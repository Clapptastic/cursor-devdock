#!/bin/bash

# Build and deploy Customer Survey Platform microservices
echo "🚀 Starting Customer Survey Platform microservices deployment"

# Ensure docker and docker-compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker and/or docker-compose are not installed"
    echo "Please install Docker and docker-compose before running this script"
    exit 1
fi

# Stop any running containers to ensure clean state
echo "🧹 Cleaning up existing containers..."
docker-compose down

# Build all services
echo "🏗️ Building all microservices..."
docker-compose build --no-cache

# Start all services
echo "🚀 Starting all microservices..."
docker-compose up -d

# Check status
echo "🔍 Checking container status..."
docker-compose ps

echo ""
echo "✅ Deployment completed!"
echo "📊 The frontend is available at: http://localhost"
echo "🔌 The API Gateway is available at: http://localhost:3000"
echo ""
echo "To view logs run: docker-compose logs -f"
echo "To stop all services run: docker-compose down" 