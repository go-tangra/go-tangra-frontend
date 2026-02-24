#!/bin/sh
set -e

# Runtime environment variable substitution for Vite apps
# This allows overriding API URLs at container startup

CONFIG_FILE="/usr/share/nginx/html/_app.config.js"
NGINX_CONF_DIR="/etc/nginx/conf.d"

# Set default values for backend proxy
export BACKEND_HOST="${BACKEND_HOST:-admin}"
export BACKEND_PORT="${BACKEND_PORT:-7788}"
export SSE_PORT="${SSE_PORT:-7789}"

# SSL configuration
export SSL_CERT_PATH="${SSL_CERT_PATH:-/app/certs/frontend/server.crt}"
export SSL_KEY_PATH="${SSL_KEY_PATH:-/app/certs/frontend/server.key}"
export SERVER_NAME="${SERVER_NAME:-localhost}"

# Remove any default nginx conf.d files
rm -f "${NGINX_CONF_DIR}/default.conf"

# Common location blocks (shared between SSL and non-SSL configs)
generate_locations() {
    cat << 'LOCATIONS'
        # Allow large file uploads (documents, backups)
        client_max_body_size 100m;

        root /usr/share/nginx/html;
        index index.html;

        # SPA routing - try files, fallback to index.html
        location / {
            try_files $uri $uri/ /index.html;

            # Cache control for HTML (no cache for SPA routing)
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }

        # Module Federation entry point — never cache (no hash in filename)
        location = /remoteEntry.js {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }

        # Static assets with long cache (hashed filenames)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # Module frontend assets — single proxy to admin-service which dynamically
        # routes to the correct module's HTTP server based on its registry.
        # Cache-Control headers are set by the admin-service ModuleAssetProxy handler.
        location ^~ /modules/ {
LOCATIONS
    echo "            proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};"
    cat << 'LOCATIONS'
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API proxy for dynamic module routes (preserve full path)
        location /admin/v1/modules/ {
LOCATIONS
    echo "            proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};"
    cat << 'LOCATIONS'
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # API proxy for admin service
        location /admin/ {
LOCATIONS
    echo "            proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/;"
    cat << 'LOCATIONS'
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # SSE proxy for real-time events
        location /sse/ {
LOCATIONS
    echo "            proxy_pass http://${BACKEND_HOST}:${SSE_PORT}/;"
    cat << 'LOCATIONS'
            proxy_http_version 1.1;
            proxy_set_header Connection '';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 86400s;
            chunked_transfer_encoding off;
        }

        # Public sharing endpoint (no auth, proxied to sharing-service HTTP)
        # Uses variable to allow nginx to start even when sharing-service is not available
        # NOTE: rewrite is required because proxy_pass with variables does NOT perform URI substitution
        location /public/v1/sharing/ {
            resolver 127.0.0.11 valid=30s ipv6=off;
LOCATIONS
    echo "            set \$sharing_upstream http://${SHARING_HTTP_HOST:-sharing-service}:${SHARING_HTTP_PORT:-9601};"
    cat << 'LOCATIONS'
            rewrite ^/public/v1/sharing/(.*)$ /api/v1/$1 break;
            proxy_pass $sharing_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Never cache shared content (one-time links)
            add_header Cache-Control "no-cache, no-store, must-revalidate" always;
            add_header Pragma "no-cache" always;
            add_header Expires "0" always;
        }

        # Public signing endpoint (no auth, proxied to paperless-service HTTP)
        location /public/v1/signing/ {
            resolver 127.0.0.11 valid=30s ipv6=off;
LOCATIONS
    echo "            set \$paperless_upstream http://${PAPERLESS_HTTP_HOST:-paperless-service}:${PAPERLESS_HTTP_PORT:-9501};"
    cat << 'LOCATIONS'
            rewrite ^/public/v1/signing/(.*)$ /api/v1/signing/$1 break;
            proxy_pass $paperless_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
            client_max_body_size 50m;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
LOCATIONS
}

# Check if SSL certificates are available
if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
    echo "SSL certificates found, enabling HTTPS"

    # Generate SSL server configuration
    {
        # HTTP server - redirect to HTTPS
        cat << SSLEOF
server {
    listen 80;
    server_name ${SERVER_NAME};
    return 301 https://\$host\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl;
    server_name ${SERVER_NAME};

    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};

    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

SSLEOF
        generate_locations
        echo "    }"
    } > "${NGINX_CONF_DIR}/default.conf"

    echo "Nginx SSL config generated:"
    echo "  SERVER_NAME: ${SERVER_NAME}"
    echo "  SSL_CERT_PATH: ${SSL_CERT_PATH}"
    echo "  SSL_KEY_PATH: ${SSL_KEY_PATH}"
else
    echo "No SSL certificates found, running HTTP only on port 8080"

    # Generate non-SSL server configuration
    {
        cat << HTTPEOF
server {
    listen 8080;
    server_name ${SERVER_NAME};

HTTPEOF
        generate_locations
        echo "    }"
    } > "${NGINX_CONF_DIR}/default.conf"

    echo "Nginx HTTP config generated:"
    echo "  BACKEND_HOST: ${BACKEND_HOST}"
    echo "  BACKEND_PORT: ${BACKEND_PORT}"
    echo "  SSE_PORT: ${SSE_PORT}"
fi

# Only update if environment variables are set
if [ -n "$VITE_GLOB_API_URL" ] || [ -n "$VITE_GLOB_SSE_URL" ]; then
    # Default values if not set
    API_URL="${VITE_GLOB_API_URL:-/admin}"
    SSE_URL="${VITE_GLOB_SSE_URL:-/sse/events}"

    # Generate the app config file (matching Vben Admin format)
    cat > "$CONFIG_FILE" << EOF
window._VBEN_ADMIN_PRO_APP_CONF_={"VITE_GLOB_API_URL":"${API_URL}","VITE_GLOB_SSE_URL":"${SSE_URL}"};Object.freeze(window._VBEN_ADMIN_PRO_APP_CONF_);Object.defineProperty(window,"_VBEN_ADMIN_PRO_APP_CONF_",{configurable:false,writable:false,});
EOF

    echo "Runtime config updated at $CONFIG_FILE"
    echo "  VITE_GLOB_API_URL: ${API_URL}"
    echo "  VITE_GLOB_SSE_URL: ${SSE_URL}"
else
    echo "No environment variables set, using built-in config"
fi

# Execute the main command
exec "$@"
