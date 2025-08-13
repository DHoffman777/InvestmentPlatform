#!/bin/bash

# Kong API Gateway Setup Script for Investment Platform
# This script configures Kong services, routes, and plugins for the platform

set -e

KONG_ADMIN_URL="http://localhost:8001"
KONG_NAMESPACE="investment-platform"

echo "🚀 Setting up Kong API Gateway for Investment Platform..."

# Wait for Kong Admin API to be ready
echo "⏳ Waiting for Kong Admin API to be ready..."
until curl -s "${KONG_ADMIN_URL}/status" > /dev/null; do
    echo "Waiting for Kong Admin API..."
    sleep 5
done

echo "✅ Kong Admin API is ready!"

# Function to create or update Kong service
create_service() {
    local service_name=$1
    local host=$2
    local port=$3
    local path=$4

    echo "📝 Creating service: $service_name"
    
    curl -s -X POST ${KONG_ADMIN_URL}/services \
        --data "name=${service_name}" \
        --data "host=${host}" \
        --data "port=${port}" \
        --data "path=${path}" \
        --data "protocol=http" \
        --data "retries=3" \
        --data "connect_timeout=60000" \
        --data "write_timeout=60000" \
        --data "read_timeout=60000" || {
        
        echo "Service already exists, updating..."
        curl -s -X PATCH ${KONG_ADMIN_URL}/services/${service_name} \
            --data "host=${host}" \
            --data "port=${port}" \
            --data "path=${path}" \
            --data "protocol=http"
    }
}

# Function to create or update Kong route
create_route() {
    local route_name=$1
    local service_name=$2
    local paths=$3
    local hosts=$4
    local methods=$5

    echo "🛣️  Creating route: $route_name"
    
    curl -s -X POST ${KONG_ADMIN_URL}/routes \
        --data "name=${route_name}" \
        --data "service.name=${service_name}" \
        --data "paths=${paths}" \
        --data "hosts=${hosts}" \
        --data "methods=${methods}" \
        --data "strip_path=true" \
        --data "preserve_host=true" || {
        
        echo "Route already exists, updating..."
        curl -s -X PATCH ${KONG_ADMIN_URL}/routes/${route_name} \
            --data "paths=${paths}" \
            --data "hosts=${hosts}" \
            --data "methods=${methods}"
    }
}

# Function to enable plugin on service
enable_plugin() {
    local plugin_name=$1
    local service_name=$2
    local config=$3

    echo "🔌 Enabling plugin: $plugin_name on service: $service_name"
    
    curl -s -X POST ${KONG_ADMIN_URL}/services/${service_name}/plugins \
        --data "name=${plugin_name}" \
        ${config:+--data "${config}"} || {
        echo "Plugin may already be enabled or configuration needs update"
    }
}

# Function to enable global plugin
enable_global_plugin() {
    local plugin_name=$1
    local config=$2

    echo "🌐 Enabling global plugin: $plugin_name"
    
    curl -s -X POST ${KONG_ADMIN_URL}/plugins \
        --data "name=${plugin_name}" \
        ${config:+--data "${config}"} || {
        echo "Global plugin may already be enabled"
    }
}

# Create Services
echo "🏗️  Creating Kong services..."

create_service "auth-service" "auth-service.${KONG_NAMESPACE}.svc.cluster.local" "3001" "/"
create_service "portfolio-service" "portfolio-service.${KONG_NAMESPACE}.svc.cluster.local" "3003" "/"
create_service "market-data-service" "market-data-service.${KONG_NAMESPACE}.svc.cluster.local" "3004" "/"
create_service "reporting-service" "reporting-service.${KONG_NAMESPACE}.svc.cluster.local" "3005" "/"

# Create Routes
echo "🛣️  Creating Kong routes..."

create_route "auth-routes" "auth-service" "/api/v1/auth" "api.investment-platform.com" "GET,POST,PUT,DELETE,PATCH,OPTIONS"
create_route "health-routes" "auth-service" "/api/v1/health" "api.investment-platform.com" "GET"
create_route "portfolio-routes" "portfolio-service" "/api/v1/portfolios" "api.investment-platform.com" "GET,POST,PUT,DELETE,PATCH,OPTIONS"
create_route "market-data-routes" "market-data-service" "/api/v1/market-data" "api.investment-platform.com" "GET,POST"
create_route "reporting-routes" "reporting-service" "/api/v1/reports" "api.investment-platform.com" "GET,POST"

# Enable Global Plugins
echo "🔌 Enabling global plugins..."

enable_global_plugin "prometheus" ""
enable_global_plugin "correlation-id" "config.header_name=X-Request-ID&config.generator=uuid&config.echo_downstream=true"
enable_global_plugin "request-transformer" "config.add.headers=X-Gateway:kong,X-Forwarded-Proto:https&config.remove.headers=X-Internal-Token"
enable_global_plugin "response-transformer" "config.add.headers=X-Content-Type-Options:nosniff,X-Frame-Options:DENY,X-XSS-Protection:1; mode=block&config.remove.headers=Server,X-Powered-By"

# Enable Service-Specific Plugins
echo "🔧 Configuring service-specific plugins..."

# CORS plugin for all services
enable_plugin "cors" "auth-service" "config.origins=https://app.investment-platform.com,https://admin.investment-platform.com&config.methods=GET,POST,PUT,DELETE,PATCH,OPTIONS&config.headers=Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,Authorization,X-Tenant-ID,X-Request-ID&config.credentials=true&config.max_age=3600"

# Rate limiting
enable_plugin "rate-limiting" "auth-service" "config.minute=100&config.hour=1000&config.policy=local"
enable_plugin "rate-limiting" "portfolio-service" "config.minute=200&config.hour=2000&config.policy=local"
enable_plugin "rate-limiting" "market-data-service" "config.minute=500&config.hour=5000&config.policy=local"
enable_plugin "rate-limiting" "reporting-service" "config.minute=50&config.hour=500&config.policy=local"

# JWT Authentication (for protected routes)
enable_plugin "jwt" "portfolio-service" "config.uri_param_names=jwt&config.header_names=Authorization&config.claims_to_verify=exp,iat,iss"
enable_plugin "jwt" "reporting-service" "config.uri_param_names=jwt&config.header_names=Authorization&config.claims_to_verify=exp,iat,iss"

# Create Kong Consumer (for API key authentication)
echo "👤 Creating Kong consumers..."

curl -s -X POST ${KONG_ADMIN_URL}/consumers \
    --data "username=investment-platform-app" \
    --data "custom_id=app-consumer" || echo "Consumer may already exist"

curl -s -X POST ${KONG_ADMIN_URL}/consumers \
    --data "username=investment-platform-admin" \
    --data "custom_id=admin-consumer" || echo "Consumer may already exist"

# Create API Keys
echo "🔑 Creating API keys..."

APP_API_KEY=$(curl -s -X POST ${KONG_ADMIN_URL}/consumers/investment-platform-app/key-auth | jq -r '.key' 2>/dev/null || echo "existing-app-key")
ADMIN_API_KEY=$(curl -s -X POST ${KONG_ADMIN_URL}/consumers/investment-platform-admin/key-auth | jq -r '.key' 2>/dev/null || echo "existing-admin-key")

echo "📊 Kong configuration summary:"
echo "================================="
echo "Services created: auth-service, portfolio-service, market-data-service, reporting-service"
echo "Routes created: API endpoints for all services"
echo "Global plugins: prometheus, correlation-id, request-transformer, response-transformer"
echo "Service plugins: cors, rate-limiting, jwt (where applicable)"
echo "Consumers: investment-platform-app, investment-platform-admin"
echo "================================="
echo "App API Key: $APP_API_KEY"
echo "Admin API Key: $ADMIN_API_KEY"
echo "================================="
echo ""
echo "Kong Admin GUI: http://localhost:8002"
echo "Kong Admin API: http://localhost:8001"
echo "Kong Proxy: http://localhost:8000"
echo ""
echo "✅ Kong API Gateway setup complete!"

# Test the setup
echo "🧪 Testing Kong configuration..."

echo "Testing Kong status..."
curl -s ${KONG_ADMIN_URL}/status | jq '.'

echo "Testing services..."
curl -s ${KONG_ADMIN_URL}/services | jq '.data[].name'

echo "Testing routes..."
curl -s ${KONG_ADMIN_URL}/routes | jq '.data[].name'

echo "Testing plugins..."
curl -s ${KONG_ADMIN_URL}/plugins | jq '.data[].name'

echo ""
echo "🎉 Kong API Gateway is ready for the Investment Platform!"
echo ""
echo "Next steps:"
echo "1. Deploy your microservices to Kubernetes"
echo "2. Update DNS to point to Kong proxy LoadBalancer"
echo "3. Configure SSL/TLS certificates"
echo "4. Set up monitoring and alerting"
echo "5. Review and adjust rate limits based on expected traffic"