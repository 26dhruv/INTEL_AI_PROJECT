#!/bin/bash
set -e

echo "🚀 Building Workforce Monitoring System for Render..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Add gunicorn and eventlet for production
pip install gunicorn eventlet

# Install Node.js dependencies and build frontend
echo "🔧 Building frontend..."
cd frontend
npm ci
npm run build

# Copy built frontend to backend static folder
echo "📁 Copying frontend build to backend..."
cd ..
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

# Create necessary data directories
echo "📁 Creating data directories..."
mkdir -p data/employee_images
mkdir -p data/logs
mkdir -p data/uploads

# Make sure the app file is executable
chmod +x backend/app_simple.py

echo "✅ Build complete!"
echo "🌐 Backend will serve both API and frontend from single service"
echo "🔧 API endpoints available at /api/*"
echo "🎨 Frontend served from /" 