#!/bin/sh
set -e

# Runtime environment variable substitution for Vite apps
# This allows overriding API URLs at container startup

CONFIG_FILE="/usr/share/nginx/html/_app.config.js"
NGINX_CONF="/etc/nginx/nginx.conf"

# Set default values for backend proxy
export BACKEND_HOST="${BACKEND_HOST:-admin}"
export BACKEND_PORT="${BACKEND_PORT:-7788}"
export SSE_PORT="${SSE_PORT:-7789}"

# Substitute environment variables in nginx config
if [ -f "$NGINX_CONF" ]; then
    envsubst '${BACKEND_HOST} ${BACKEND_PORT} ${SSE_PORT}' < "$NGINX_CONF" > /tmp/nginx.conf
    mv /tmp/nginx.conf "$NGINX_CONF"
    echo "Nginx config updated with backend proxy:"
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
