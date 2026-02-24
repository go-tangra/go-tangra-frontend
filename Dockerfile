##################################
# Stage 1: Build Vue.js application
##################################

FROM node:20-alpine AS builder

ARG APP_VERSION=1.0.0

# Set environment variables for build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

# Set working directory
WORKDIR /app

# Copy package files for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/ ./packages/
COPY internal/ ./internal/
COPY scripts/ ./scripts/

# Install dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Stub internal packages (required before build)
RUN pnpm -r run stub --if-present

# Build the admin application
RUN pnpm run build --filter=@vben/web-antd

##################################
# Stage 2: Production nginx image
##################################

FROM nginx:1.27-alpine AS production

ARG APP_VERSION=1.0.0

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache gettext

# Set timezone
ENV TZ=UTC

# Copy built assets from builder
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script for runtime env substitution
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Remove default nginx site config (entrypoint generates it dynamically)
RUN rm -f /etc/nginx/conf.d/default.conf

# Create non-root user and ensure conf.d is writable for entrypoint
RUN addgroup -g 1000 frontend && \
    adduser -D -u 1000 -G frontend frontend && \
    chown -R frontend:frontend /usr/share/nginx/html && \
    chown -R frontend:frontend /var/cache/nginx && \
    chown -R frontend:frontend /var/log/nginx && \
    chown -R frontend:frontend /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R frontend:frontend /var/run/nginx.pid

# Expose ports (8080 for HTTP dev, 80/443 for production SSL)
EXPOSE 8080 80 443

# Set default environment variables
ENV VITE_GLOB_API_URL=http://localhost:8080
ENV VITE_GLOB_SSE_URL=http://localhost:8080/events

# Use custom entrypoint for runtime env substitution
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels
LABEL org.opencontainers.image.title="Go Wind Admin Frontend" \
      org.opencontainers.image.description="Go Wind Admin Vue.js Frontend Application" \
      org.opencontainers.image.version="${APP_VERSION}"
