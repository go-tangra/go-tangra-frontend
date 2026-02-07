# Makefile for Go Wind Admin Frontend

# Variables
IMAGE_NAME ?= menta2l/go-wind-admin-frontend
IMAGE_TAG ?= latest
DOCKER_REGISTRY ?=
NODE_VERSION := $(shell cat .node-version 2>/dev/null || echo "20")

# Build the frontend application
.PHONY: build
build:
	@echo "Building frontend application..."
	@pnpm install --frozen-lockfile
	@pnpm run build --filter=@vben/web-antd
	@echo "Build complete!"

# Run development server
.PHONY: dev
dev:
	@pnpm run dev

# Run type checking
.PHONY: typecheck
typecheck:
	@pnpm run check:type

# Run linting
.PHONY: lint
lint:
	@pnpm run lint

# Format code
.PHONY: format
format:
	@pnpm run format

# Clean build artifacts
.PHONY: clean
clean:
	@pnpm run clean
	@echo "Clean complete!"

# Install dependencies
.PHONY: install
install:
	@pnpm install

# Build Docker image
.PHONY: docker
docker:
	@echo "Building Docker image $(IMAGE_NAME):$(IMAGE_TAG)..."
	@docker build \
		--no-cache \
		-t $(IMAGE_NAME):$(IMAGE_TAG) \
		-t $(IMAGE_NAME):latest \
		.

# Build Docker image with custom registry
.PHONY: docker-tag
docker-tag: docker
ifdef DOCKER_REGISTRY
	@echo "Tagging image for registry $(DOCKER_REGISTRY)..."
	@docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(DOCKER_REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	@docker tag $(IMAGE_NAME):latest $(DOCKER_REGISTRY)/$(IMAGE_NAME):latest
endif

# Push Docker image to registry
.PHONY: docker-push
docker-push: docker-tag
	@docker push $(IMAGE_NAME):$(IMAGE_TAG)
	@docker push $(IMAGE_NAME):latest

# Build multi-platform Docker image
.PHONY: docker-buildx
docker-buildx:
	@echo "Building multi-platform Docker image..."
	@docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-t $(IMAGE_NAME):$(IMAGE_TAG) \
		-t $(IMAGE_NAME):latest \
		.

# Run Docker container locally
.PHONY: docker-run
docker-run:
	@echo "Running Docker container..."
	@docker run -d \
		-p 8080:8080 \
		-e VITE_GLOB_API_URL=http://localhost:7788 \
		-e VITE_GLOB_SSE_URL=http://localhost:7789/events \
		--name $(IMAGE_NAME) \
		$(IMAGE_NAME):latest

# Stop and remove Docker container
.PHONY: docker-stop
docker-stop:
	@docker stop $(IMAGE_NAME) 2>/dev/null || true
	@docker rm $(IMAGE_NAME) 2>/dev/null || true

# Run tests
.PHONY: test
test:
	@pnpm run test:unit

# Run end-to-end tests
.PHONY: test-e2e
test-e2e:
	@pnpm run test:e2e

# Preview production build
.PHONY: preview
preview:
	@pnpm run preview

# Show help
.PHONY: help
help:
	@echo ""
	@echo "Go Wind Admin Frontend Makefile"
	@echo "================================"
	@echo ""
	@echo "Development:"
	@echo "  install      Install dependencies"
	@echo "  dev          Run development server"
	@echo "  build        Build for production"
	@echo "  preview      Preview production build"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint         Run linting"
	@echo "  format       Format code"
	@echo "  typecheck    Run type checking"
	@echo ""
	@echo "Docker:"
	@echo "  docker       Build Docker image"
	@echo "  docker-tag   Build and tag for registry (set DOCKER_REGISTRY)"
	@echo "  docker-push  Build, tag, and push to registry"
	@echo "  docker-buildx Build multi-platform image (amd64/arm64)"
	@echo "  docker-run   Run Docker container locally"
	@echo "  docker-stop  Stop and remove Docker container"
	@echo ""
	@echo "Testing:"
	@echo "  test         Run unit tests"
	@echo "  test-e2e     Run end-to-end tests"
	@echo ""
	@echo "Other:"
	@echo "  clean        Remove build artifacts"
	@echo ""
	@echo "Variables:"
	@echo "  IMAGE_NAME      Docker image name (default: menta2k/go-wind-admin-frontend)"
	@echo "  IMAGE_TAG       Docker image tag (default: latest)"
	@echo "  DOCKER_REGISTRY Docker registry for push (optional)"
	@echo ""
	@echo "Examples:"
	@echo "  make dev"
	@echo "  make build"
	@echo "  make docker"
	@echo "  make docker-run VITE_GLOB_API_URL=http://api.example.com"
	@echo "  make docker-push DOCKER_REGISTRY=ghcr.io/myorg"
	@echo ""

.DEFAULT_GOAL := help
