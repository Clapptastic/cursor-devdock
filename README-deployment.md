# Deployment Guide

This guide explains how to deploy Cursor DevDock to GitHub and Docker Hub.

## Prerequisites

- GitHub account
- Docker Hub account
- Git installed locally
- Docker and Docker Compose installed locally

## Deployment Steps

### 1. Create GitHub Repository

Create a new repository on GitHub for the Cursor DevDock project.

### 2. Create Docker Hub Repository

Log in to Docker Hub and create repositories for each service:
- cursor-devdock-dashboard
- cursor-devdock-mcp-rest-api
- cursor-devdock-claude-task-master
- cursor-devdock-scraper
- cursor-devdock-browser-tools
- cursor-devdock-debug-visualizer

### 3. Deploy Using Script

Run the deployment script with your GitHub and Docker Hub usernames:

```bash
chmod +x deploy-full.sh
./deploy-full.sh <github-username/repo-name> <dockerhub-username>
```

For example:
```bash
./deploy-full.sh johndoe/cursor-devdock johndoe
```

### 4. Running from Docker Hub

To run Cursor DevDock using the Docker Hub images:

```bash
export DOCKER_USERNAME=<your-dockerhub-username>
docker-compose -f docker-compose.prod.yml up -d
```

## Manual Deployment

### GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

### Docker Hub

```bash
docker login
docker-compose build

# Tag and push each service
docker tag cursor-devdock_dashboard <username>/cursor-devdock-dashboard:latest
docker push <username>/cursor-devdock-dashboard:latest

# Repeat for other services
```

## CI/CD Setup

For continuous integration/deployment, you can use GitHub Actions:

1. Create a `.github/workflows/docker-publish.yml` file
2. Configure it to build and push Docker images on code changes
3. Set up secrets in your GitHub repository for Docker Hub credentials 