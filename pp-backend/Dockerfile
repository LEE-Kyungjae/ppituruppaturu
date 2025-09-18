# Multi-stage build for Go backend
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata make

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o server ./cmd/server/main.go

# Development stage
FROM builder AS development
RUN go install github.com/cosmtrek/air@latest
EXPOSE 8080
CMD ["air", "-c", ".air.toml"]

# Production stage
FROM scratch AS production

# Copy CA certificates and timezone data
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Create non-root user
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Copy the binary
COPY --from=builder /app/server /server

# Create directories for logs and data
USER nobody
WORKDIR /

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["/server", "--healthcheck"]

# Expose port
EXPOSE 8080

# Set environment
ENV GO_ENV=production
ENV PORT=8080

# Run the server
ENTRYPOINT ["/server"]