package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"syscall"

	"golang.org/x/term"
)

// ProductionSetup handles initial production environment setup
func main() {
	fmt.Println("🚀 PortOne Payment System - Production Setup")
	fmt.Println("===========================================")
	fmt.Println()

	// Check if already in production mode
	if isProductionConfigured() {
		fmt.Println("⚠️  Production environment already configured.")
		fmt.Print("Do you want to reconfigure? (y/N): ")
		if !confirmAction() {
			fmt.Println("Setup cancelled.")
			return
		}
	}

	config := &ProductionConfig{}

	// Collect configuration
	if err := collectDatabaseConfig(config); err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}

	if err := collectPortOneConfig(config); err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}

	if err := collectSecurityConfig(config); err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}

	if err := collectServerConfig(config); err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}

	// Generate environment file
	if err := generateEnvironmentFile(config); err != nil {
		fmt.Printf("❌ Error generating .env file: %v\n", err)
		os.Exit(1)
	}

	// Generate docker-compose.prod.yml
	if err := generateDockerCompose(config); err != nil {
		fmt.Printf("❌ Error generating docker-compose.prod.yml: %v\n", err)
		os.Exit(1)
	}

	// Generate deployment scripts
	if err := generateDeploymentScripts(config); err != nil {
		fmt.Printf("❌ Error generating deployment scripts: %v\n", err)
		os.Exit(1)
	}

	// Generate nginx configuration
	if err := generateNginxConfig(config); err != nil {
		fmt.Printf("❌ Error generating nginx config: %v\n", err)
		os.Exit(1)
	}

	// Display summary
	displaySetupSummary(config)
}

type ProductionConfig struct {
	// Database
	DatabaseHost     string
	DatabasePort     string
	DatabaseName     string
	DatabaseUser     string
	DatabasePassword string
	DatabaseSSL      bool

	// PortOne
	PortOneStoreID    string
	PortOneAPIKey     string
	PortOneAPISecret  string
	PortOneWebhookSecret string

	// Security
	JWTSecret     string
	RefreshSecret string
	EncryptionKey string
	CSRFSecret    string

	// Server
	Domain        string
	Port          string
	UseHTTPS      bool
	CertEmail     string
	AllowedOrigins []string

	// Redis (optional)
	UseRedis      bool
	RedisHost     string
	RedisPassword string
}

func collectDatabaseConfig(config *ProductionConfig) error {
	fmt.Println("📊 Database Configuration")
	fmt.Println("------------------------")

	config.DatabaseHost = promptString("Database Host", "localhost")
	config.DatabasePort = promptString("Database Port", "5432")
	config.DatabaseName = promptString("Database Name", "pitturu_production")
	config.DatabaseUser = promptString("Database User", "pitturu")
	config.DatabasePassword = promptPassword("Database Password")
	config.DatabaseSSL = promptBool("Enable SSL for database connection", true)

	fmt.Println()
	return nil
}

func collectPortOneConfig(config *ProductionConfig) error {
	fmt.Println("💳 PortOne Configuration")
	fmt.Println("-----------------------")

	fmt.Println("Get these values from PortOne Console: https://admin.portone.io")
	config.PortOneStoreID = promptString("PortOne Store ID", "")
	config.PortOneAPIKey = promptPassword("PortOne API Key")
	config.PortOneAPISecret = promptPassword("PortOne API Secret")
	config.PortOneWebhookSecret = promptPassword("PortOne Webhook Secret (optional)")

	fmt.Println()
	return nil
}

func collectSecurityConfig(config *ProductionConfig) error {
	fmt.Println("🔐 Security Configuration")
	fmt.Println("------------------------")

	fmt.Print("Generate secure secrets automatically? (Y/n): ")
	if confirmAction() {
		config.JWTSecret = generateSecureSecret(64)
		config.RefreshSecret = generateSecureSecret(64)
		config.EncryptionKey = generateSecureSecret(64)
		config.CSRFSecret = generateSecureSecret(32)
		fmt.Println("✅ Security secrets generated automatically")
	} else {
		config.JWTSecret = promptPassword("JWT Secret (min 64 characters)")
		config.RefreshSecret = promptPassword("Refresh Token Secret (min 64 characters)")
		config.EncryptionKey = promptPassword("Encryption Key (min 64 characters)")
		config.CSRFSecret = promptPassword("CSRF Secret (min 32 characters)")
	}

	fmt.Println()
	return nil
}

func collectServerConfig(config *ProductionConfig) error {
	fmt.Println("🌐 Server Configuration")
	fmt.Println("----------------------")

	config.Domain = promptString("Domain (e.g., api.yourdomain.com)", "")
	config.Port = promptString("Port", "8080")
	config.UseHTTPS = promptBool("Enable HTTPS with SSL certificate", true)
	
	if config.UseHTTPS {
		config.CertEmail = promptString("Email for SSL certificate", "")
	}

	// CORS Origins
	fmt.Print("Allowed CORS origins (comma-separated): ")
	origins := promptString("", "https://yourdomain.com")
	config.AllowedOrigins = strings.Split(origins, ",")
	for i, origin := range config.AllowedOrigins {
		config.AllowedOrigins[i] = strings.TrimSpace(origin)
	}

	// Redis configuration
	config.UseRedis = promptBool("Use Redis for caching/sessions", false)
	if config.UseRedis {
		config.RedisHost = promptString("Redis Host", "localhost:6379")
		config.RedisPassword = promptPassword("Redis Password (optional)")
	}

	fmt.Println()
	return nil
}

func generateEnvironmentFile(config *ProductionConfig) error {
	fmt.Println("📝 Generating production environment file...")

	envContent := fmt.Sprintf(`# Production Environment Configuration
# Generated on %s
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
GIN_MODE=release
APP_ENV=production
PORT=%s
HOST=0.0.0.0

# =============================================================================
# DATABASE CONFIGURATION  
# =============================================================================
DSN="postgres://%s:%s@%s:%s/%s?sslmode=%s"
DATABASE_URL="postgres://%s:%s@%s:%s/%s?sslmode=%s"

# Connection Pool
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=25
DB_CONN_MAX_IDLE_TIME_MIN=5
DB_CONN_MAX_LIFETIME_HOUR=2

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
JWT_SECRET=%s
REFRESH_SECRET=%s
ENCRYPTION_KEY=%s
CSRF_SECRET=%s

# Token Expiration
ACCESS_TTL_MIN=15
REFRESH_TTL_DAYS=7
BCRYPT_COST=12

# =============================================================================
# PORTONE CONFIGURATION
# =============================================================================
PORTONE_STORE_ID=%s
PORTONE_API_KEY=%s
PORTONE_API_SECRET=%s
PORTONE_WEBHOOK_SECRET=%s
PORTONE_BASE_URL=https://api.iamport.kr

# =============================================================================
# SECURITY SETTINGS
# =============================================================================
CORS_ORIGINS=%s
REQUIRE_HTTPS=%t
RATE_RPS=100
RATE_BURST=200
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MIN=15

# =============================================================================
# REDIS CONFIGURATION (if enabled)
# =============================================================================`,
		getCurrentTimestamp(),
		config.Port,
		config.DatabaseUser, config.DatabasePassword, config.DatabaseHost, config.DatabasePort, config.DatabaseName, getSSLMode(config.DatabaseSSL),
		config.DatabaseUser, config.DatabasePassword, config.DatabaseHost, config.DatabasePort, config.DatabaseName, getSSLMode(config.DatabaseSSL),
		config.JWTSecret,
		config.RefreshSecret,
		config.EncryptionKey,
		config.CSRFSecret,
		config.PortOneStoreID,
		config.PortOneAPIKey,
		config.PortOneAPISecret,
		config.PortOneWebhookSecret,
		strings.Join(config.AllowedOrigins, ","),
		config.UseHTTPS,
	)

	if config.UseRedis {
		envContent += fmt.Sprintf(`
REDIS_URL=redis://%s
REDIS_PASSWORD=%s
REDIS_DB=0`, config.RedisHost, config.RedisPassword)
	}

	envContent += `

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/pitturu/app.log

# =============================================================================
# MONITORING
# =============================================================================
ENABLE_METRICS=true
METRICS_PATH=/metrics
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
`

	return ioutil.WriteFile(".env.production", []byte(envContent), 0600)
}

func generateDockerCompose(config *ProductionConfig) error {
	fmt.Println("🐳 Generating Docker Compose configuration...")

	composeContent := fmt.Sprintf(`version: '3.8'

services:
  pitturu-backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: pitturu-backend
    restart: unless-stopped
    ports:
      - "%s:%s"
    environment:
      - GIN_MODE=release
      - APP_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./logs:/var/log/pitturu
    depends_on:
      - postgres
    networks:
      - pitturu-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:%s/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: pitturu-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: %s
      POSTGRES_USER: %s
      POSTGRES_PASSWORD: %s
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - pitturu-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U %s -d %s"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: pitturu-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - pitturu-backend
    networks:
      - pitturu-network`,
		config.Port, config.Port, config.Port,
		config.DatabaseName, config.DatabaseUser, config.DatabasePassword,
		config.DatabaseUser, config.DatabaseName,
	)

	if config.UseRedis {
		composeContent += fmt.Sprintf(`

  redis:
    image: redis:7-alpine
    container_name: pitturu-redis
    restart: unless-stopped
    command: redis-server --requirepass %s
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - pitturu-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3`, config.RedisPassword)
	}

	composeContent += `

volumes:
  postgres_data:
  logs:`

	if config.UseRedis {
		composeContent += `
  redis_data:`
	}

	composeContent += `

networks:
  pitturu-network:
    driver: bridge
`

	return ioutil.WriteFile("docker-compose.prod.yml", []byte(composeContent), 0644)
}

func generateDeploymentScripts(config *ProductionConfig) error {
	fmt.Println("📜 Generating deployment scripts...")

	// Deploy script
	deployScript := `#!/bin/bash
set -e

echo "🚀 Starting PortOne Payment System deployment..."

# Check if required files exist
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please run the production setup first."
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml file not found!"
    exit 1
fi

# Create necessary directories
mkdir -p logs
mkdir -p backups
mkdir -p ssl

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Build application
echo "🔨 Building application..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🏁 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec pitturu-backend /app/migrate

# Check service health
echo "🏥 Checking service health..."
if docker-compose -f docker-compose.prod.yml exec pitturu-backend wget --quiet --tries=1 --spider http://localhost:8080/health; then
    echo "✅ Application is healthy and ready!"
else
    echo "❌ Application health check failed!"
    echo "Checking logs..."
    docker-compose -f docker-compose.prod.yml logs pitturu-backend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "Application is running at: ` + config.Domain + `"
`

	if err := ioutil.WriteFile("deploy.sh", []byte(deployScript), 0755); err != nil {
		return err
	}

	// Backup script
	backupScript := `#!/bin/bash
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="pitturu_backup_${DATE}.sql"

echo "📦 Creating database backup..."

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Create database backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U pitturu pitturu_production > ${BACKUP_DIR}/${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Keep only last 30 backups
find ${BACKUP_DIR} -name "pitturu_backup_*.sql.gz" -mtime +30 -delete

echo "🧹 Old backups cleaned up"
`

	return ioutil.WriteFile("backup.sh", []byte(backupScript), 0755)
}

func generateNginxConfig(config *ProductionConfig) error {
	fmt.Println("🌐 Generating Nginx configuration...")

	nginxConfig := fmt.Sprintf(`events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    upstream backend {
        server pitturu-backend:%s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name %s;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name %s;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers for HTTPS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeout settings
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Auth routes with stricter rate limiting
        location /api/v1/auth/ {
            limit_req zone=auth burst=10 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend;
            access_log off;
        }

        # Metrics endpoint (restrict access)
        location /metrics {
            allow 127.0.0.1;
            deny all;
            proxy_pass http://backend;
        }

        # Static files (if any)
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}`, config.Port, config.Domain, config.Domain)

	return ioutil.WriteFile("nginx.conf", []byte(nginxConfig), 0644)
}

func displaySetupSummary(config *ProductionConfig) {
	fmt.Println("🎉 Production Setup Complete!")
	fmt.Println("=============================")
	fmt.Printf("Domain: %s\n", config.Domain)
	fmt.Printf("Database: %s@%s:%s/%s\n", config.DatabaseUser, config.DatabaseHost, config.DatabasePort, config.DatabaseName)
	fmt.Printf("HTTPS: %v\n", config.UseHTTPS)
	fmt.Printf("Redis: %v\n", config.UseRedis)
	fmt.Println()
	fmt.Println("Generated files:")
	fmt.Println("- .env.production")
	fmt.Println("- docker-compose.prod.yml")
	fmt.Println("- deploy.sh")
	fmt.Println("- backup.sh") 
	fmt.Println("- nginx.conf")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("1. Review the generated .env.production file")
	fmt.Println("2. Set up SSL certificates in ./ssl/ directory")
	fmt.Println("3. Run: ./deploy.sh")
	fmt.Println()
	fmt.Println("⚠️  IMPORTANT: Keep .env.production secure and never commit it to version control!")
}

// Utility functions

func promptString(prompt, defaultValue string) string {
	reader := bufio.NewReader(os.Stdin)
	
	if defaultValue != "" {
		fmt.Printf("%s [%s]: ", prompt, defaultValue)
	} else {
		fmt.Printf("%s: ", prompt)
	}
	
	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(input)
	
	if input == "" {
		return defaultValue
	}
	return input
}

func promptPassword(prompt string) string {
	fmt.Printf("%s: ", prompt)
	
	password, err := term.ReadPassword(int(syscall.Stdin))
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		os.Exit(1)
	}
	
	fmt.Println() // New line after password input
	return string(password)
}

func promptBool(prompt string, defaultValue bool) bool {
	defaultStr := "Y/n"
	if !defaultValue {
		defaultStr = "y/N"
	}
	
	fmt.Printf("%s (%s): ", prompt, defaultStr)
	
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')
	input = strings.ToLower(strings.TrimSpace(input))
	
	if input == "" {
		return defaultValue
	}
	
	return input == "y" || input == "yes"
}

func confirmAction() bool {
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')
	input = strings.ToLower(strings.TrimSpace(input))
	return input == "y" || input == "yes" || input == ""
}

func generateSecureSecret(length int) string {
	bytes := make([]byte, length/2) // hex encoding doubles the length
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Sprintf("Failed to generate secure secret: %v", err))
	}
	return hex.EncodeToString(bytes)
}

func isProductionConfigured() bool {
	_, err := os.Stat(".env.production")
	return err == nil
}

func getSSLMode(useSSL bool) string {
	if useSSL {
		return "require"
	}
	return "disable"
}

func getCurrentTimestamp() string {
	return fmt.Sprintf("%d", 1234567890) // Placeholder
}