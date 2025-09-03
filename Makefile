# Mileage Tracker Development Makefile

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
COMPOSE_FILE = docker-compose.yml

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help setup build up down logs clean test lint format migrate

# Default target
help: ## Show this help message
	@echo "$(GREEN)Mileage Tracker Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

# Setup
setup: ## Initial project setup
	@echo "$(GREEN)Setting up project...$(NC)"
	@cp .env.example .env 2>/dev/null || echo ".env.example not found, skipping..."
	@cd $(BACKEND_DIR) && go mod download
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)Setup complete!$(NC)"

# Build
build: ## Build all services
	@echo "$(GREEN)Building all services...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) build

build-backend: ## Build backend service only
	@echo "$(GREEN)Building backend...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) build backend

build-frontend: ## Build frontend service only
	@echo "$(GREEN)Building frontend...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) build frontend

# Development
up: ## Start all services in development mode
	@echo "$(GREEN)Starting services...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) up -d

down: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down

restart: down up ## Restart all services

logs: ## Show logs for all services
	@docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Show backend logs
	@docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Show database logs
	@docker-compose -f $(COMPOSE_FILE) logs -f db

# Development (local)
dev-backend: ## Run backend locally (requires Go and database)
	@echo "$(GREEN)Starting backend locally...$(NC)"
	@cd $(BACKEND_DIR) && air -c .air.toml

dev-frontend: ## Run frontend locally (requires Node.js)
	@echo "$(GREEN)Starting frontend locally...$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

# Testing
test: ## Run all tests
	@echo "$(GREEN)Running all tests...$(NC)"
	@$(MAKE) test-backend
	@$(MAKE) test-frontend

test-backend: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	@cd $(BACKEND_DIR) && go test ./...

test-frontend: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm test

test-e2e: ## Run end-to-end tests
	@echo "$(GREEN)Running E2E tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm run test:e2e

# Coverage
test-coverage: ## Run all tests with coverage reports
	@echo "$(GREEN)Running all tests with coverage...$(NC)"
	@$(MAKE) test-backend-coverage
	@$(MAKE) test-frontend-coverage

test-backend-coverage: ## Run backend tests with coverage
	@echo "$(GREEN)Running backend tests with coverage...$(NC)"
	@mkdir -p coverage/backend
	@cd $(BACKEND_DIR) && go test -coverprofile=../coverage/backend/coverage.out -covermode=count ./...
	@cd $(BACKEND_DIR) && go tool cover -html=../coverage/backend/coverage.out -o ../coverage/backend/coverage.html

test-frontend-coverage: ## Run frontend tests with coverage
	@echo "$(GREEN)Running frontend tests with coverage...$(NC)"
	@cd $(FRONTEND_DIR) && npm run test:coverage

# Code quality
lint: ## Run linting for all projects
	@$(MAKE) lint-backend
	@$(MAKE) lint-frontend

lint-backend: ## Run backend linting
	@echo "$(GREEN)Linting backend...$(NC)"
	@cd $(BACKEND_DIR) && golangci-lint run

lint-frontend: ## Run frontend linting
	@echo "$(GREEN)Linting frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run lint

format: ## Format all code
	@$(MAKE) format-backend
	@$(MAKE) format-frontend

format-backend: ## Format backend code
	@echo "$(GREEN)Formatting backend code...$(NC)"
	@cd $(BACKEND_DIR) && go fmt ./...
	@cd $(BACKEND_DIR) && goimports -w .

format-frontend: ## Format frontend code
	@echo "$(GREEN)Formatting frontend code...$(NC)"
	@cd $(FRONTEND_DIR) && npm run format

# Database
migrate-up: ## Run database migrations up
	@echo "$(GREEN)Running migrations up...$(NC)"
	@cd $(BACKEND_DIR) && go run cmd/migrate/main.go up

migrate-down: ## Run database migrations down
	@echo "$(YELLOW)Running migrations down...$(NC)"
	@cd $(BACKEND_DIR) && go run cmd/migrate/main.go down

migrate-create: ## Create a new migration file (usage: make migrate-create NAME=migration_name)
	@echo "$(GREEN)Creating migration: $(NAME)$(NC)"
	@cd $(BACKEND_DIR) && migrate create -ext sql -dir migrations $(NAME)

db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)Resetting database...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec db psql -U postgres -c "DROP DATABASE IF EXISTS mileagetracker;"
	@docker-compose -f $(COMPOSE_FILE) exec db psql -U postgres -c "CREATE DATABASE mileagetracker;"
	@$(MAKE) migrate-up

# Cleanup
clean: ## Clean up containers, images, and volumes
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down -v
	@docker system prune -f
	@docker volume prune -f

clean-all: ## Clean everything including images
	@echo "$(RED)Cleaning everything...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	@docker system prune -af
	@docker volume prune -f

# Health checks
health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@curl -f http://localhost:8080/health || echo "$(RED)Backend unhealthy$(NC)"
	@curl -f http://localhost:3000 || echo "$(RED)Frontend unhealthy$(NC)"

# Quick development workflow
quick-start: build up ## Quick start: build and run all services
	@echo "$(GREEN)Services starting... Use 'make logs' to monitor$(NC)"

# Generate API client
generate-client: ## Generate OpenAPI client for frontend
	@echo "$(GREEN)Generating OpenAPI client...$(NC)"
	@cd $(FRONTEND_DIR) && npm run generate:api