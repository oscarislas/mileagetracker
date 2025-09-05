# 🚗 Mileage Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192.svg)](https://www.postgresql.org)

A modern, full-stack mileage tracking application built for tax deduction management.

## ✨ Key Features

- **📝 Trip Management**: Log business trips with client names, dates, mileage, and notes
- **💰 Expense Calculation**: Automatic calculation based on IRS-standard mileage rates
- **📊 Monthly Summaries**: 6-month rolling summary with total miles and deductions
- **🔍 Smart Client Search**: Autocomplete client names from previous trips
- **⚙️ Configurable Settings**: Adjustable mileage rates for different tax years
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔒 Type Safety**: Full TypeScript coverage with OpenAPI-generated client
- **🧪 Comprehensive Testing**: Unit, integration, and E2E test coverage

## 🏗️ Architecture Overview

This application follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────┐    HTTP/REST    ┌──────────────────┐
│  React Frontend │ ◄──────────────► │   Go Backend     │
│  (TypeScript)   │                 │   (Gin + GORM)   │
└─────────────────┘                 └──────────────────┘
        │                                    │
        │ Container Network                  │ SQL Queries
        │                                    ▼
        └─────────────────► ┌──────────────────────────┐
                            │    PostgreSQL 15         │
                            │  (Persistent Storage)    │
                            └──────────────────────────┘
```

### Tech Stack

#### Backend (Go)
- **Framework**: [Gin](https://gin-gonic.com/) - Fast HTTP web framework
- **ORM**: [GORM](https://gorm.io/) - Type-safe database operations
- **Database**: PostgreSQL 15 with migrations
- **Logging**: [Zap](https://pkg.go.dev/go.uber.org/zap) - Structured logging
- **API**: OpenAPI 3.0 specification-driven development
- **Development**: [Air](https://github.com/cosmtrek/air) - Live reload

#### Frontend (React)
- **Framework**: React 19 with TypeScript for type safety
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast development and building
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Catppuccin](https://github.com/catppuccin/tailwindcss) theme
- **State Management**: [TanStack Query](https://tanstack.com/query) for server state
- **Routing**: React Router 7 for client-side navigation
- **Testing**: Playwright (E2E) + Vitest (unit tests)

#### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose with health checks
- **Development**: Hot reload for both frontend and backend
- **Database**: Persistent PostgreSQL with automated migrations

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (required for all setups)
- **Go 1.23+** (optional, for local development)
- **Node.js 18+** (optional, for local development)
- **Make** (recommended, for easy command execution)

### One-Command Setup

```bash
git clone https://github.com/oscarislas/mileagetracker.git
cd mileagetracker
make quick-start
```

This will:
1. Build all Docker images
2. Start all services (database, backend, frontend)
3. Apply database migrations
4. Start serving the application

### Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **API Documentation**: `backend/internal/api/openapi/openapi.yaml`

## 🛠️ Development Guide

### Local Development (Recommended)

For the best development experience with debugging and faster iteration:

1. **Start the database only**:
   ```bash
   docker-compose up db -d
   ```

2. **Run backend locally** (Terminal 1):
   ```bash
   make dev-backend
   # Uses Air for hot reload
   ```

3. **Run frontend locally** (Terminal 2):
   ```bash
   make dev-frontend
   # Uses Vite dev server with HMR
   ```

### Container-Only Development

If you prefer everything in containers:

```bash
make up          # Start all services
make logs        # View logs from all services
make down        # Stop all services
```

### Environment Setup

1. **Copy environment templates**:
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

2. **Adjust settings** (optional):
   ```env
   # .env (Backend configuration)
   DB_NAME=mileagetracker
   DB_USER=postgres
   DB_PASSWORD=postgres
   SERVER_PORT=8080
   LOG_LEVEL=debug
   
   # frontend/.env (Frontend configuration)
   VITE_API_URL=http://localhost:8080
   ```

## 📋 Available Commands

### Quick Reference
```bash
make help                    # Show all available commands
make setup                   # Initial project setup
make quick-start             # Build and start everything
```

### Development Workflow
```bash
# Service management
make up                      # Start all services
make down                    # Stop all services
make restart                 # Restart all services
make logs                    # View logs from all services

# Local development
make dev-backend             # Run backend locally (hot reload)
make dev-frontend            # Run frontend locally (HMR)

# Testing
make test                    # Run all tests
make test-backend            # Go tests only
make test-frontend           # React tests only  
make test-e2e                # Playwright E2E tests
make test-coverage           # All tests with coverage reports

# Code quality
make lint                    # Lint all projects
make format                  # Format all code
make lint-backend            # golangci-lint
make lint-frontend           # ESLint + TypeScript

# Database operations
make migrate-up              # Apply migrations
make migrate-down            # Rollback migrations
make migrate-create NAME=... # Create new migration
make db-reset                # Drop, recreate, and migrate

# Health and monitoring
make health                  # Check service health
```

## 🔗 API Reference

### Core Endpoints

| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| `GET` | `/health` | Service health check | Returns service status |
| `GET` | `/ready` | Readiness check | Returns service + DB status |
| `POST` | `/api/v1/trips` | Create new trip | Create trip with client/mileage |
| `GET` | `/api/v1/trips` | List trips (paginated) | `?page=1&limit=10` |
| `GET` | `/api/v1/trips/{id}` | Get specific trip | Returns full trip details |
| `PUT` | `/api/v1/trips/{id}` | Update trip | Modify existing trip |
| `DELETE` | `/api/v1/trips/{id}` | Delete trip | Remove trip permanently |
| `GET` | `/api/v1/trips/summary` | Monthly summary | 6-month expense summary |
| `GET` | `/api/v1/clients` | Client suggestions | Autocomplete client names |
| `GET` | `/api/v1/settings` | Get mileage rate | Current IRS rate setting |
| `PUT` | `/api/v1/settings` | Update rate | Set new mileage rate |

### API Examples

**Create a new trip**:
```bash
curl -X POST http://localhost:8080/api/v1/trips \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Acme Corp",
    "trip_date": "2024-01-15",
    "miles": 125.5,
    "notes": "Client meeting downtown"
  }'
```

**Get trips with pagination**:
```bash
curl "http://localhost:8080/api/v1/trips?page=1&limit=5"
```

**Get expense summary**:
```bash
curl "http://localhost:8080/api/v1/trips/summary"
```

**Response format**:
```json
{
  "months": [
    {
      "month": "January 2024",
      "year": 2024,
      "month_num": 1,
      "total_miles": 145.50,
      "amount": 97.49
    }
  ]
}
```

## 🧪 Testing Strategy

### Test Coverage Goals
- **Backend**: >90% coverage for business logic
- **Frontend**: >85% coverage for components and hooks
- **E2E**: Critical user workflows covered

### Running Tests

```bash
# Run specific test suites
make test-backend           # Go unit tests
make test-frontend          # React component tests
make test-e2e              # Full user workflow tests

# Coverage reports
make test-coverage         # Generate HTML coverage reports
# Reports saved to coverage/ directory
```

### Test Organization

```
backend/
├── internal/service/*_test.go    # Business logic tests
├── internal/repository/*_test.go  # Data layer tests
└── internal/api/*_test.go        # HTTP handler tests

frontend/
├── src/components/**/*.test.tsx   # Component tests
├── src/hooks/**/*.test.ts         # Custom hook tests
└── tests/e2e/                    # Playwright E2E tests
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Trips table (main entity)
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    client_name VARCHAR(30) NOT NULL,
    trip_date DATE NOT NULL,
    miles DECIMAL(10,2) NOT NULL CHECK (miles >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (for autocomplete)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (application configuration)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    mileage_rate DECIMAL(5,3) NOT NULL DEFAULT 0.67,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migrations

Database migrations are managed through Go:

```bash
# Create new migration
make migrate-create NAME=add_new_feature

# Apply migrations (up)
make migrate-up

# Rollback migrations (down)  
make migrate-down

# Reset database completely
make db-reset
```

Migration files are located in `backend/migrations/`:
- `001_initial.up.sql` / `001_initial.down.sql`
- `002_add_clients.up.sql` / `002_add_clients.down.sql`

## 🔧 Configuration

### Backend Configuration (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mileagetracker
DB_SSLMODE=disable

# Server
SERVER_PORT=8080
GIN_MODE=debug
LOG_LEVEL=debug

# Features
CORS_ALLOW_ORIGIN=http://localhost:3000
```

### Frontend Configuration (frontend/.env)
```env
# API Configuration
VITE_API_URL=http://localhost:8080

# Development
VITE_LOG_LEVEL=debug
```


## 🚢 Production Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
```env
# Backend
GIN_MODE=release
LOG_LEVEL=info
DB_SSLMODE=require
CORS_ALLOW_ORIGIN=https://yourdomain.com

# Database
DB_HOST=your-postgres-host
DB_PASSWORD=secure-random-password
```

### Health Monitoring
The application provides health check endpoints suitable for load balancers:

- **Liveness probe**: `GET /health` (returns 200 if service is running)
- **Readiness probe**: `GET /ready` (returns 200 if service and DB are healthy)

## 🤝 Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/awesome-feature`
3. **Set up development environment**: `make setup`
4. **Start development services**: `make dev-backend` and `make dev-frontend`
5. **Make your changes** following existing patterns
6. **Write/update tests** for new functionality
7. **Run quality checks**: `make lint test`
8. **Commit with conventional format**: `git commit -m "feat: add awesome feature"`
9. **Push and create pull request**

### Commit Message Format

Follow the [50/72 rule](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) and imperative mood:

```bash
# Good examples:
git commit -m "feat: add client search functionality"
git commit -m "fix: resolve mileage calculation rounding error"
git commit -m "docs: update API examples in README"

# Bad examples:
git commit -m "Added search"  # Past tense
git commit -m "Fix bug"       # Too vague
git commit -m "This commit adds a new feature for client search that allows users to find clients quickly"  # Too long
```

### Code Style Guidelines

- **Go**: Follow `gofmt` and `golangci-lint` rules
- **TypeScript**: Use strict TypeScript, prefer type guards over type assertions
- **React**: Use functional components with hooks, avoid `any` types
- **Testing**: Write tests for new features, aim for high coverage
- **Documentation**: Update relevant docs for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Gin Web Framework](https://gin-gonic.com/) for the fast HTTP server
- [GORM](https://gorm.io/) for elegant database operations
- [TanStack Query](https://tanstack.com/query) for excellent data fetching
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Catppuccin](https://catppuccin.com/) for the beautiful color palette

---

**Happy tracking! 🚗💼**