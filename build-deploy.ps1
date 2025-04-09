# PowerShell script to build and deploy Customer Survey Platform microservices
Write-Host "🚀 Starting Customer Survey Platform microservices deployment"

# Ensure docker and docker-compose are installed
$docker = Get-Command docker -ErrorAction SilentlyContinue
$dockerCompose = Get-Command docker-compose -ErrorAction SilentlyContinue

if (-not $docker -or -not $dockerCompose) {
    Write-Host "❌ Docker and/or docker-compose are not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop for Windows before running this script" -ForegroundColor Red
    exit 1
}

# Stop any running containers to ensure clean state
Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Cyan
docker-compose down

# Build all services
Write-Host "🏗️ Building all microservices..." -ForegroundColor Cyan
docker-compose build --no-cache

# Start all services
Write-Host "🚀 Starting all microservices..." -ForegroundColor Cyan
docker-compose up -d

# Check status
Write-Host "🔍 Checking container status..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "📊 The frontend is available at: http://localhost" -ForegroundColor Yellow
Write-Host "🔌 The API Gateway is available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs run: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "To stop all services run: docker-compose down" -ForegroundColor Cyan 