#!/bin/bash

# Workforce Monitoring System - Backend Startup Script

echo "🚀 Starting Workforce Monitoring Backend..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    # Try to start MongoDB based on the system
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start mongod
    else
        echo "❌ Could not start MongoDB automatically. Please start MongoDB manually."
        echo "   On macOS: brew services start mongodb-community"
        echo "   On Linux: sudo systemctl start mongod"
        exit 1
    fi
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create data directories
echo "📁 Creating data directories..."
mkdir -p ../data/employee_images
mkdir -p ../data/logs

# Set environment variables
export FLASK_ENV=development
export FLASK_DEBUG=True
export MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/"}

# Start the Flask application
echo "🚀 Starting Flask backend server..."
echo "📊 Backend will be available at: http://localhost:5000"
echo "🔄 WebSocket support enabled for real-time updates"
echo "📷 Camera API available at: /api/camera/start"
echo "="*60

python run.py 