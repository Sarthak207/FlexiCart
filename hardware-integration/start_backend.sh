#!/bin/bash

# Smart Cart Backend Startup Script

echo "🚀 Starting Smart Cart Backend Services..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "⚠️  requirements.txt not found, skipping dependency installation"
fi

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f "../env.example" ]; then
        cp ../env.example ../.env
        echo "📝 Please update the .env file with your actual API keys"
    else
        echo "❌ env.example not found. Please create a .env file manually"
        exit 1
    fi
fi

# Start the backend server
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📡 WebSocket endpoint: ws://localhost:8000/ws"
echo "📚 API documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 main.py
