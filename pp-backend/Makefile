# =============================================================================
# Go JWT Authentication Server - Makefile
# Production-grade build automation and development tools
# =============================================================================

# Project configuration
PROJECT_NAME := ppituru-backend
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Go configuration
GO_VERSION := 1.23
BINARY_NAME := server
BINARY_PATH := ./bin/$(BINARY_NAME)
MAIN_PATH := ./cmd/server/main.go

# Build flags
LDFLAGS := -ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GitCommit=$(GIT_COMMIT) -w -s"
BUILD_FLAGS := -trimpath $(LDFLAGS)

# Test configuration
COVERAGE_FILE := coverage.out
COVERAGE_HTML := coverage.html

# Docker configuration
DOCKER_IMAGE := $(PROJECT_NAME)
DOCKER_TAG := $(VERSION)

# =============================================================================
# DEFAULT TARGET
# =============================================================================

.PHONY: help
help: ## Display this help message
	@echo "🚀 $(PROJECT_NAME) - Development Commands"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "📚 Documentation: docs/README.md"
	@echo "🐳 Docker Manager: ./scripts/docker-manager.sh help"

.DEFAULT_GOAL := help

# =============================================================================
# DEVELOPMENT
# =============================================================================

.PHONY: dev-setup
dev-setup: ## Setup development environment
	@echo "🔧 Setting up development environment..."
	@go version
	@go mod download
	@go install github.com/cosmtrek/air@latest
	@go install github.com/swaggo/swag/cmd/swag@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@cp -n .env.example .env 2>/dev/null || echo ".env already exists"
	@echo "✅ Development environment ready!"

.PHONY: dev
dev: ## Start development server with live reload
	@echo "🔥 Starting development server with live reload..."
	@air

.PHONY: run
run: ## Run the application
	@echo "🚀 Running application..."
	@go run $(MAIN_PATH)

# =============================================================================
# BUILDING
# =============================================================================

.PHONY: build
build: clean ## Build the application
	@echo "🔨 Building application..."
	@mkdir -p bin
	@go build $(BUILD_FLAGS) -o $(BINARY_PATH) $(MAIN_PATH)
	@echo "✅ Build completed: $(BINARY_PATH)"

.PHONY: build-all
build-all: clean ## Build for all platforms
	@echo "🔨 Building for all platforms..."
	@mkdir -p bin
	@GOOS=linux GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/$(BINARY_NAME)-linux-amd64 $(MAIN_PATH)
	@GOOS=darwin GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/$(BINARY_NAME)-darwin-amd64 $(MAIN_PATH)
	@GOOS=darwin GOARCH=arm64 go build $(BUILD_FLAGS) -o bin/$(BINARY_NAME)-darwin-arm64 $(MAIN_PATH)
	@GOOS=windows GOARCH=amd64 go build $(BUILD_FLAGS) -o bin/$(BINARY_NAME)-windows-amd64.exe $(MAIN_PATH)
	@echo "✅ Multi-platform build completed"

.PHONY: clean
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf bin/
	@rm -f $(COVERAGE_FILE) $(COVERAGE_HTML)
	@go clean -cache
	@echo "✅ Clean completed"

# =============================================================================
# TESTING
# =============================================================================

.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	@go test -v ./...

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	@go test -v -cover -coverprofile=$(COVERAGE_FILE) ./...
	@go tool cover -func=$(COVERAGE_FILE)
	@echo "📊 Coverage report saved to $(COVERAGE_FILE)"

.PHONY: test-coverage-html
test-coverage-html: test-coverage ## Generate HTML coverage report
	@echo "🌐 Generating HTML coverage report..."
	@go tool cover -html=$(COVERAGE_FILE) -o $(COVERAGE_HTML)
	@echo "📊 HTML coverage report: $(COVERAGE_HTML)"
	@open $(COVERAGE_HTML) 2>/dev/null || echo "Open $(COVERAGE_HTML) in your browser"

.PHONY: test-integration
test-integration: ## Run integration tests (requires Docker)
	@echo "🧪 Running integration tests..."
	@./scripts/docker-manager.sh start test
	@go test -v -tags=integration ./...
	@./scripts/docker-manager.sh stop test

.PHONY: test-benchmark
test-benchmark: ## Run benchmark tests
	@echo "⚡ Running benchmark tests..."
	@go test -bench=. -benchmem ./...

# =============================================================================
# CODE QUALITY
# =============================================================================

.PHONY: lint
lint: ## Run linter
	@echo "🔍 Running linter..."
	@golangci-lint run --config .golangci.yml

.PHONY: lint-fix
lint-fix: ## Run linter with auto-fix
	@echo "🔧 Running linter with auto-fix..."
	@golangci-lint run --config .golangci.yml --fix

.PHONY: format
format: ## Format code
	@echo "💅 Formatting code..."
	@gofmt -w .
	@goimports -w .

.PHONY: vet
vet: ## Run go vet
	@echo "🔍 Running go vet..."
	@go vet ./...

.PHONY: mod-tidy
mod-tidy: ## Tidy go modules
	@echo "📦 Tidying go modules..."
	@go mod tidy
	@go mod verify

.PHONY: security-scan
security-scan: ## Run security scan
	@echo "🔒 Running security scan..."
	@gosec ./...

# =============================================================================
# DOCUMENTATION
# =============================================================================

.PHONY: docs
docs: ## Generate API documentation
	@echo "📚 Generating API documentation..."
	@swag init --generalInfo main.go --output ./docs/swagger
	@echo "✅ Swagger documentation generated: docs/swagger/"

.PHONY: docs-serve
docs-serve: docs ## Serve documentation locally
	@echo "🌐 Serving documentation at http://localhost:6060"
	@godoc -http=:6060

.PHONY: docs-check
docs-check: ## Check documentation links
	@echo "🔗 Checking documentation links..."
	@find docs -name "*.md" -exec grep -l "http" {} \; | xargs -I {} bash -c 'echo "Checking: {}" && grep -o "https\?://[^)]*" {} | head -10'

# =============================================================================
# DATABASE
# =============================================================================

.PHONY: db-migrate-up
db-migrate-up: ## Run database migrations up
	@echo "⬆️  Running database migrations up..."
	@DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_dev_db?sslmode=disable" go run cmd/migrate/main.go up

.PHONY: db-migrate-down
db-migrate-down: ## Run database migrations down (usage: make db-migrate-down STEPS=1)
	@echo "⬇️  Running database migrations down..."
	@go run cmd/migrate/main.go down $(STEPS)

.PHONY: db-migrate-version
db-migrate-version: ## Show current migration version
	@echo "📋 Checking migration version..."
	@go run cmd/migrate/main.go version

.PHONY: db-migrate-create
db-migrate-create: ## Create new migration (usage: make db-migrate-create NAME=migration_name)
	@echo "📝 Creating migration: $(NAME)"
	@go run cmd/migrate/main.go create $(NAME)

.PHONY: db-migrate-force
db-migrate-force: ## Force migration version (usage: make db-migrate-force VERSION=X)
	@echo "⚠️  Forcing migration version to: $(VERSION)"
	@go run cmd/migrate/main.go force $(VERSION)

.PHONY: db-reset
db-reset: ## Reset database (WARNING: destructive)
	@echo "⚠️  WARNING: This will destroy all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r && echo && [[ $$REPLY =~ ^[Yy]$$ ]] || exit 1
	@./scripts/docker-manager.sh stop dev
	@docker volume rm $$(docker volume ls -q | grep postgres) 2>/dev/null || true
	@./scripts/docker-manager.sh start dev
	@sleep 10
	@make db-migrate-up

.PHONY: db-seed
db-seed: ## Seed database with sample data
	@echo "🌱 Seeding database with sample data..."
	@DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_dev_db?sslmode=disable" go run cmd/seed/main.go -action=seed

.PHONY: db-clean
db-clean: ## Clean sample/test data only (safe)
	@echo "🧹 Cleaning sample data only..."
	@DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_dev_db?sslmode=disable" go run cmd/seed/main.go -action=clean

.PHONY: db-clean-all
db-clean-all: ## Clean ALL data from database (WARNING: destructive)
	@echo "🚨 WARNING: This will delete ALL data!"
	@DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_dev_db?sslmode=disable" go run cmd/seed/main.go -action=hard-clean

.PHONY: db-seed-reset
db-seed-reset: ## Reset sample data only (safe)
	@echo "🔄 Resetting sample data only..."
	@DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_dev_db?sslmode=disable" go run cmd/seed/main.go -action=reset

.PHONY: db-reset-all
db-reset-all: ## Reset ALL data with fresh sample data (WARNING: destructive)
	@echo "🚨 WARNING: This will delete ALL data and reseed!"
	@DSN="postgres://postgres:ppituru_dev_2024@localhost:5432/ppituru_dev_db?sslmode=disable" go run cmd/seed/main.go -action=hard-reset

# =============================================================================
# DOCKER & DEPLOYMENT
# =============================================================================

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(DOCKER_IMAGE):latest

.PHONY: docker-run
docker-run: ## Run Docker container
	@echo "🚀 Running Docker container..."
	@docker run --rm -p 8080:8080 --env-file .env $(DOCKER_IMAGE):$(DOCKER_TAG)

.PHONY: docker-push
docker-push: docker-build ## Push Docker image
	@echo "📤 Pushing Docker image..."
	@docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	@docker push $(DOCKER_IMAGE):latest

.PHONY: docker-services-up
docker-services-up: ## Start all Docker services
	@echo "🐳 Starting Docker services..."
	@./scripts/docker-manager.sh start dev

.PHONY: docker-services-down
docker-services-down: ## Stop all Docker services
	@echo "🛑 Stopping Docker services..."
	@./scripts/docker-manager.sh stop dev

.PHONY: docker-logs
docker-logs: ## Show Docker service logs
	@echo "📋 Showing Docker service logs..."
	@./scripts/docker-manager.sh logs

# =============================================================================
# MONITORING & HEALTH
# =============================================================================

.PHONY: health-check
health-check: ## Check application health
	@echo "💓 Checking application health..."
	@curl -f http://localhost:8080/health || echo "❌ Health check failed"

.PHONY: metrics
metrics: ## Show application metrics
	@echo "📊 Fetching application metrics..."
	@curl -s http://localhost:8080/metrics | head -20

.PHONY: load-test
load-test: ## Run load test (requires hey)
	@echo "⚡ Running load test..."
	@hey -n 1000 -c 10 http://localhost:8080/health

# =============================================================================
# RELEASE & DEPLOYMENT
# =============================================================================

.PHONY: tag
tag: ## Create and push git tag
	@echo "🏷️  Current version: $(VERSION)"
	@read -p "Enter new version: " NEW_VERSION && \
	git tag -a $$NEW_VERSION -m "Release $$NEW_VERSION" && \
	git push origin $$NEW_VERSION

.PHONY: release-notes
release-notes: ## Generate release notes
	@echo "📝 Generating release notes..."
	@git log --oneline --decorate --graph --since="1 week ago"

.PHONY: deploy-staging
deploy-staging: ## Deploy to staging environment
	@echo "🚀 Deploying to staging..."
	@echo "TODO: Add staging deployment commands"

.PHONY: deploy-prod
deploy-prod: ## Deploy to production environment
	@echo "🚀 Deploying to production..."
	@echo "TODO: Add production deployment commands"

# =============================================================================
# UTILITIES
# =============================================================================

.PHONY: env-check
env-check: ## Check environment configuration
	@echo "🔍 Checking environment configuration..."
	@./scripts/docker-manager.sh preflight

.PHONY: backup
backup: ## Create backup
	@echo "💾 Creating backup..."
	@./scripts/docker-manager.sh backup

.PHONY: logs
logs: ## Show application logs
	@echo "📋 Showing application logs..."
	@tail -f logs/*.log

.PHONY: stats
stats: ## Show project statistics
	@echo "📊 Project Statistics:"
	@echo "Lines of Go code: $$(find . -name '*.go' -not -path './vendor/*' | xargs wc -l | tail -1)"
	@echo "Test files: $$(find . -name '*_test.go' | wc -l)"
	@echo "Dependencies: $$(go list -m all | wc -l)"
	@echo "Docker images: $$(docker images | grep $(PROJECT_NAME) | wc -l)"

# =============================================================================
# CI/CD TARGETS
# =============================================================================

.PHONY: ci-test
ci-test: lint vet test ## CI test pipeline
	@echo "✅ CI test pipeline completed"

.PHONY: ci-build
ci-build: ci-test build ## CI build pipeline
	@echo "✅ CI build pipeline completed"

.PHONY: ci-deploy
ci-deploy: ci-build ## CI deployment pipeline
	@echo "✅ CI deployment pipeline completed"

# =============================================================================
# DEVELOPMENT WORKFLOW
# =============================================================================

.PHONY: quick
quick: format lint test ## Quick development check
	@echo "✅ Quick check completed"

.PHONY: full-check
full-check: clean mod-tidy format lint vet test-coverage security-scan docs ## Full project check
	@echo "✅ Full project check completed"

.PHONY: pre-commit
pre-commit: format lint test ## Pre-commit hook
	@echo "✅ Pre-commit checks passed"