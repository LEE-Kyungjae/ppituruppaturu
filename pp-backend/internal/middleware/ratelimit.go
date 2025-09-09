// backend/internal/middleware/ratelimit.go
package middleware

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimitOptions struct {
	Enabled    bool
	RPS        float64       // requests per second
	Burst      int           // token bucket burst
	TTL        time.Duration // idle TTL per client key (e.g., 10m)
	Cleanup    time.Duration // cleanup interval (e.g., 1m)
	MaxEntries int           // optional upper bound; 0 = unlimited

	// KeyFunc determines how to identify a client (default: ClientIP).
	// You can use JWT sub, API-Key header, etc.
	KeyFunc func(c *gin.Context) string

	// Skipper: return true to skip rate limiting for this request (e.g. /healthz, /swagger/*)
	Skipper func(c *gin.Context) bool

	// Whitelist contains CIDR ranges to bypass rate-limiting (e.g., internal networks).
	Whitelist []*net.IPNet

	// OnLimited lets you customize the 429 response. If nil, a sane default is used.
	OnLimited func(c *gin.Context, retryAfter time.Duration)
}

type clientLimiter struct {
	Limiter  *rate.Limiter
	LastSeen time.Time
}

type limiterStore struct {
	mu       sync.Mutex
	clients  map[string]*clientLimiter
	options  RateLimitOptions
	stopCh   chan struct{}
	started  bool
	numEntry int
}

func NewRateLimiter(opts RateLimitOptions) gin.HandlerFunc {
	// defaults
	if !opts.Enabled {
		return func(c *gin.Context) { c.Next() }
	}
	if opts.RPS <= 0 {
		opts.RPS = 10
	}
	if opts.Burst <= 0 {
		opts.Burst = 20
	}
	if opts.TTL <= 0 {
		opts.TTL = 10 * time.Minute
	}
	if opts.Cleanup <= 0 {
		opts.Cleanup = time.Minute
	}
	if opts.KeyFunc == nil {
		opts.KeyFunc = clientKeyFromIP
	}
	if opts.Skipper == nil {
		opts.Skipper = func(c *gin.Context) bool { return false }
	}

	store := &limiterStore{
		clients: make(map[string]*clientLimiter),
		options: opts,
		stopCh:  make(chan struct{}),
	}

	store.startCleanup()

	return func(c *gin.Context) {
		if opts.Skipper(c) {
			c.Next()
			return
		}
		if ip := clientIP(c); ip != "" && isWhitelisted(ip, opts.Whitelist) {
			c.Next()
			return
		}

		key := opts.KeyFunc(c)
		lim := store.getLimiter(key, rate.Limit(opts.RPS), opts.Burst)

		// Fast-path allow
		if lim.Allow() {
			c.Next()
			return
		}

		// Not allowed now: compute Retry-After using a reservation without consuming it.
		// Reserve() consumes tokens; we'll immediately cancel to avoid side-effects.
		r := lim.Reserve()
		if !r.OK() {
			// system at capacity; set minimal info
			writeTooManyRequests(c, opts, 1*time.Second)
			return
		}
		delay := r.DelayFrom(time.Now())
		r.Cancel() // don't actually consume

		writeTooManyRequests(c, opts, delay)
	}
}

func (s *limiterStore) getLimiter(key string, limit rate.Limit, burst int) *rate.Limiter {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cl, ok := s.clients[key]; ok {
		cl.LastSeen = time.Now()
		return cl.Limiter
	}

	// enforce MaxEntries (simple backpressure by evicting oldest)
	if s.options.MaxEntries > 0 && s.numEntry >= s.options.MaxEntries {
		// find oldest
		var oldestKey string
		var oldestTime time.Time
		for k, v := range s.clients {
			if oldestTime.IsZero() || v.LastSeen.Before(oldestTime) {
				oldestKey = k
				oldestTime = v.LastSeen
			}
		}
		if oldestKey != "" {
			delete(s.clients, oldestKey)
			s.numEntry--
		}
	}

	lim := rate.NewLimiter(limit, burst)
	s.clients[key] = &clientLimiter{Limiter: lim, LastSeen: time.Now()}
	s.numEntry++
	return lim
}

func (s *limiterStore) startCleanup() {
	if s.started {
		return
	}
	s.started = true
	ticker := time.NewTicker(s.options.Cleanup)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				s.cleanup()
			case <-s.stopCh:
				return
			}
		}
	}()
}

func (s *limiterStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for k, v := range s.clients {
		if now.Sub(v.LastSeen) > s.options.TTL {
			delete(s.clients, k)
			s.numEntry--
		}
	}
}

func (s *limiterStore) Stop() { close(s.stopCh) }

// ------- helpers -------

func clientKeyFromIP(c *gin.Context) string {
	return clientIP(c)
}

func clientIP(c *gin.Context) string {
	// gin.ClientIP already respects X-Forwarded-For when trusted proxies are configured.
	// Ensure you call engine.SetTrustedProxies(...) appropriately in your bootstrap code.
	return c.ClientIP()
}

func isWhitelisted(ip string, cidrs []*net.IPNet) bool {
	if len(cidrs) == 0 || ip == "" {
		return false
	}
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return false
	}
	for _, n := range cidrs {
		if n.Contains(parsed) {
			return true
		}
	}
	return false
}

func writeTooManyRequests(c *gin.Context, opts RateLimitOptions, retryAfter time.Duration) {
	// Standard headers
	if retryAfter <= 0 {
		retryAfter = time.Second
	}
	// Retry-After: seconds
	c.Header("Retry-After", formatRetryAfter(retryAfter))

	// Optional informational headers (token-bucket semantics don't map 1:1 to these;
	// we expose configured policy for observability).
	c.Header("X-RateLimit-Policy", policyString(opts.RPS, opts.Burst))
	// If you want to expose window-like semantics, you can add your own headers here.

	traceID := requestID(c)

	if opts.OnLimited != nil {
		opts.OnLimited(c, retryAfter)
		return
	}

	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"error": gin.H{
			"code":    "RATE_LIMITED",
			"message": "Too many requests",
			"details": gin.H{
				"retry_after_ms": retryAfter.Milliseconds(),
			},
			"traceId": traceID,
		},
	})
}

func requestID(c *gin.Context) string {
	// prefer common request-id headers if present
	for _, h := range []string{
		"X-Request-Id",
		"X-Correlation-Id",
		"Traceparent",
	} {
		if v := strings.TrimSpace(c.GetHeader(h)); v != "" {
			return v
		}
	}
	return ""
}

func policyString(rps float64, burst int) string {
	// human friendly description for logs/headers
	return "token-bucket; rps=" + trimFloat(rps) + "; burst=" + itoa(burst)
}

// small helpers without bringing fmt to reduce allocations
func itoa(i int) string {
	return strconv.Itoa(i)
}
func trimFloat(f float64) string {
	// simple trimming: 12.340000 -> "12.34"
	s := strconv.FormatFloat(f, 'f', 2, 64)
	// drop trailing zeros and dot
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	return s
}

func formatRetryAfter(d time.Duration) string {
	secs := int(d.Round(time.Second) / time.Second)
	if secs < 1 {
		secs = 1
	}
	return itoa(secs)
}