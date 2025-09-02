# Simple Dockerfile without Air for fallback
FROM golang:1.23-alpine AS development

WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Default command runs the server directly (no hot reload)
CMD ["go", "run", "./cmd/server"]