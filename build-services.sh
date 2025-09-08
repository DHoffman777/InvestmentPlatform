#!/bin/bash

# Script to build services with increased memory allocation
export NODE_OPTIONS="--max-old-space-size=4096"

echo "Building services with increased memory allocation..."

# Array of services to build
services=(
    "auth"
    "auto-scaling"
    "cdn-management"
    "load-testing"
    "market-data"
    "performance-optimization"
    "portfolio-service"
)

# Track failed builds
failed_builds=()

# Build each service
for service in "${services[@]}"; do
    echo ""
    echo "========================================="
    echo "Building service: $service"
    echo "========================================="
    
    service_path="services/$service"
    
    if [ -d "$service_path" ]; then
        cd "$service_path"
        
        # Try to build the service
        if npx tsc 2>&1; then
            echo "✓ $service built successfully"
        else
            echo "✗ $service build failed"
            failed_builds+=("$service")
        fi
        
        # Return to root directory
        cd ../..
    else
        echo "Service directory not found: $service_path"
        failed_builds+=("$service")
    fi
done

echo ""
echo "========================================="
echo "Build Summary"
echo "========================================="

if [ ${#failed_builds[@]} -eq 0 ]; then
    echo "✓ All services built successfully!"
else
    echo "✗ Failed builds:"
    for failed in "${failed_builds[@]}"; do
        echo "  - $failed"
    done
    exit 1
fi