# go-tangra-frontend

Vue 3 admin dashboard and management UI for the Go-Tangra platform. Built as a monorepo with shared packages and a single admin application.

## Features

- **Multi-Module Dashboard** — Unified interface for all platform services
- **Real-time Updates** — Server-Sent Events (SSE) for live data
- **Multi-Tenant** — Tenant switching and isolation
- **Role-Based Access** — Permission-based UI rendering and route guards
- **Internationalization** — Multi-language support via Vue I18n
- **Theme Support** — Light/dark modes with Ant Design theming

## Managed Modules

| Module | Functionality |
|--------|--------------|
| **System** | Users, roles, permissions, login policies, tasks, dictionaries |
| **LCM** | Certificates, issuers, permissions, audit logs |
| **Deployer** | Configurations, jobs, deployment targets |
| **IPAM** | Subnets, IP addresses, devices, VLANs, locations, host groups |
| **Warden** | Secrets, folders, permissions |
| **Paperless** | Documents, categories, permissions |
| **Logs** | API audit, login audit, operation logs |

## Tech Stack

- **Framework**: Vue 3.5, Vue Router 4, Pinia
- **UI**: Ant Design Vue 4, Tailwind CSS 3, shadcn/ui
- **Build**: Vite 6, Turbo (monorepo), pnpm
- **Charts**: ECharts 5
- **Tables**: VXE Table 4
- **Language**: TypeScript 5.6

## Quick Start

```bash
# Install dependencies (requires pnpm >= 9.12.0, Node.js >= 20.10.0)
pnpm install

# Start development server
pnpm dev

# Production build
pnpm build

# Type checking
pnpm check:type

# Lint and format
pnpm lint
pnpm format
```

## Project Structure

```
apps/
└── admin/                 # Main admin dashboard (@vben/web-antd)
    ├── src/views/         # Feature pages (116 components)
    ├── src/stores/        # Pinia state stores (52+ stores)
    ├── src/router/        # Route configuration
    └── src/generated/     # Auto-generated API types
packages/
├── types/                 # Shared TypeScript types
├── constants/             # Enums and constants
├── stores/                # Global Pinia stores
├── styles/                # SCSS/Tailwind styles
├── effects/               # Composables, hooks, plugins
│   ├── request/           # HTTP client (Axios)
│   ├── hooks/             # Vue composables
│   ├── common-ui/         # Shared UI components
│   ├── layouts/           # Layout system
│   └── access/            # Permission directives
└── @core/                 # Core framework
    ├── composables/       # Core Vue composables
    └── ui-kit/            # Form, popup, menu, tabs components
```

## Docker

```bash
# Build image
docker build -t go-tangra-frontend .

# Run
docker run -p 8080:8080 go-tangra-frontend
```

Multi-stage build: Node.js builder + Nginx production image. Runs as non-root user (UID 1000) with GZIP compression and API proxying.

## API Integration

- REST API via Axios with interceptors
- SSE for real-time updates
- Auto-generated types from backend OpenAPI specs
- Development proxy to `http://localhost:5320/api`
