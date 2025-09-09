# Backend - Go API Server

PortOne payment integration backend service

## Quick Start

```bash
cp .env.example .env  # Edit PortOne credentials
go mod tidy
go run main.go
```

## API Endpoints

- `POST /api/v1/payments/sessions` - Create payment session
- `POST /api/v1/payments/verify` - Verify payment  
- `GET /api/v1/admin/dashboard` - Admin dashboard data
- `GET /api/v1/admin/users` - User management

## Database

PostgreSQL with migrations in `internal/migrations/`

## Configuration

See `.env.example` for required environment variables.