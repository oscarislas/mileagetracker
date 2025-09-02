# Mileage Tracker

A modern mileage tracking application built with Go backend and React frontend.

## Project Structure

```
├── backend/                 # Go backend API
│   ├── cmd/                # Application entrypoints
│   ├── internal/           # Private application code
│   ├── migrations/         # Database migrations
│   └── pkg/               # Public libraries
├── frontend/              # React frontend
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   └── tests/            # Test files
├── docker-compose.yml    # Local development orchestration
└── Makefile             # Development commands
```

## Tech Stack

### Backend
- **Go 1.22+** - Main programming language
- **Gin** - HTTP web framework
- **GORM** - ORM for database operations
- **PostgreSQL** - Database
- **OpenAPI** - API specification and code generation
- **Zap** - Structured logging
- **Air** - Hot reload for development

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Catppuccin** - Color theme
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Playwright** - End-to-end testing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development environment
- **PostgreSQL** - Database

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose**
- **Go 1.22+** (for local development)
- **Node.js 18+** (for local development)
- **Make** (for using the Makefile commands)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mileagetracker
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services**
   ```bash
   make quick-start
   ```

4. **View the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Health: http://localhost:8080/health

### Local Development

For development with hot reload and debugging:

1. **Start the database**
   ```bash
   docker-compose up db -d
   ```

2. **Run backend locally**
   ```bash
   make dev-backend
   # or manually:
   cd backend && go run cmd/server/main.go
   ```

3. **Run frontend locally**
   ```bash
   make dev-frontend
   # or manually:
   cd frontend && npm run dev
   ```

## Available Commands

### General
- `make help` - Show all available commands
- `make setup` - Initial project setup
- `make clean` - Clean up containers and volumes

### Development
- `make up` - Start all services
- `make down` - Stop all services
- `make logs` - View logs from all services
- `make dev-backend` - Run backend locally
- `make dev-frontend` - Run frontend locally

### Testing
- `make test` - Run all tests
- `make test-backend` - Run backend tests
- `make test-frontend` - Run frontend tests
- `make test-e2e` - Run end-to-end tests

### Code Quality
- `make lint` - Run linting for all projects
- `make format` - Format all code

### Database
- `make migrate-up` - Run database migrations
- `make migrate-down` - Rollback migrations
- `make db-reset` - Reset database

## API Documentation

The API is documented using OpenAPI 3.0. When the backend is running:

- **OpenAPI Spec**: `backend/internal/api/openapi/openapi.yaml`
- **Health Check**: GET `/health`
- **Readiness Check**: GET `/ready`
- **API Routes**: `/api/v1/*`

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement backend API changes
   - Update OpenAPI specification
   - Implement frontend changes
   - Write tests
   - Run quality checks: `make lint test`

2. **Database Changes**
   - Create migration: `make migrate-create NAME=feature_name`
   - Apply migration: `make migrate-up`
   - Update domain models if needed

3. **Testing**
   - Unit tests for both backend and frontend
   - Integration tests for API endpoints
   - E2E tests for user workflows

## Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mileagetracker
SERVER_PORT=8080
GIN_MODE=debug
LOG_LEVEL=debug
```

### Frontend (frontend/.env)
```env
VITE_API_URL=http://localhost:8080
```

## VS Code Setup

Recommended extensions are configured in `.vscode/extensions.json`. The workspace includes:

- Go language support with debugging
- TypeScript and React development
- Tailwind CSS IntelliSense
- ESLint and Prettier integration
- Docker and Docker Compose support

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure all quality checks pass: `make lint test`
5. Use conventional commit messages

## License

[Add your license here]