@echo off
REM Smart Cart Backend Startup Script for Windows

echo 🚀 Starting Smart Cart Backend Services...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ⚠️  requirements.txt not found, skipping dependency installation
)

REM Check if .env file exists
if not exist "..\.env" (
    echo ⚠️  .env file not found. Creating from example...
    if exist "..\env.example" (
        copy "..\env.example" "..\.env"
        echo 📝 Please update the .env file with your actual API keys
    ) else (
        echo ❌ env.example not found. Please create a .env file manually
        pause
        exit /b 1
    )
)

REM Start the backend server
echo 🌐 Starting FastAPI server on http://localhost:8000
echo 📡 WebSocket endpoint: ws://localhost:8000/ws
echo 📚 API documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
