#!/bin/bash

# Workforce Monitoring System - Backend Startup Script

echo "🚀 Starting Workforce Monitoring System Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "../venv" ] && [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
if [ -d "venv" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
elif [ -d "../venv" ]; then
    echo "🔧 Activating virtual environment..."
    source ../venv/bin/activate
fi

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
fi

# Create data directory if it doesn't exist
mkdir -p data

# Start the application
echo "🌐 Starting Flask application..."
python3 start.py 