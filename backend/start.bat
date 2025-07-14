@echo off
REM Workforce Monitoring System - Backend Startup Script for Windows

echo 🚀 Starting Workforce Monitoring System Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    if not exist "..\venv" (
        echo 📦 Creating virtual environment...
        python -m venv venv
    )
)

REM Activate virtual environment
if exist "venv" (
    echo 🔧 Activating virtual environment...
    call venv\Scripts\activate.bat
) else if exist "..\venv" (
    echo 🔧 Activating virtual environment...
    call ..\venv\Scripts\activate.bat
)

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📥 Installing dependencies...
    pip install -r requirements.txt
)

REM Create data directory if it doesn't exist
if not exist "data" mkdir data

REM Start the application
echo 🌐 Starting Flask application...
python start.py

pause 