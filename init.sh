#!/bin/bash

# Create necessary directories
mkdir -p config/mcp-konnect
mkdir -p config/renovate
mkdir -p services/dashboard/pages/api
mkdir -p services/dashboard/styles
mkdir -p services/claude-task-master/public
mkdir -p services/browser-tools/public
mkdir -p services/mcp-rest-api
mkdir -p services/scraper
mkdir -p services/debug-visualizer/public

# Build and start the Docker containers
echo "Starting Cursor DevDock services..."
docker-compose up -d

echo "Waiting for services to start..."
sleep 15

# Check if services are running
docker-compose ps

# Register services with MCP Konnect if needed
echo "Registering services with MCP Konnect..."
curl -X POST http://localhost:8001/register-api \
  -H "Content-Type: application/json" \
  -d '{"name":"claude-task-master", "url":"http://claude-task-master:8002", "description":"AI Task Routing Service"}'

curl -X POST http://localhost:8001/register-api \
  -H "Content-Type: application/json" \
  -d '{"name":"scraper", "url":"http://scraper:8003", "description":"Web Scraping Service"}'

curl -X POST http://localhost:8001/register-api \
  -H "Content-Type: application/json" \
  -d '{"name":"browser-tools", "url":"http://browser-tools:8004", "description":"Browser Monitoring Tools"}'

echo "Cursor DevDock is now running!"
echo "Access the dashboard at http://localhost:3000" 