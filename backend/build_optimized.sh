#!/bin/bash

# Memory-optimized Docker build script for Workforce Monitoring System
# This script reduces memory usage during the build process

set -e

echo "🚀 Starting memory-optimized Docker build..."

# Set Docker build options for memory optimization
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# Build arguments for memory optimization
BUILD_ARGS="--build-arg BUILDKIT_INLINE_CACHE=1"

# Build the image with memory optimizations
echo "📦 Building Docker image with memory optimizations..."
docker build \
    --no-cache \
    --memory=4g \
    --memory-swap=4g \
    --cpus=2 \
    --progress=plain \
    $BUILD_ARGS \
    -t workforce-monitoring-backend:optimized \
    .

echo "✅ Build completed successfully!"
echo "🐳 Image: workforce-monitoring-backend:optimized"
echo "💾 Memory usage optimized for deployment"

# Optional: Show image size
echo "📊 Image size:"
docker images workforce-monitoring-backend:optimized --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 