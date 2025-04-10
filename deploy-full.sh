#!/bin/bash

# Full deployment script for Cursor DevDock
# Handles GitHub and Docker Hub pushing

# Check command line arguments
if [ $# -lt 2 ]; then
  echo "Usage: ./deploy-full.sh <github-username/repo-name> <dockerhub-username>"
  exit 1
fi

GITHUB_REPO=$1
DOCKER_USERNAME=$2

# Step 1: Build the application
echo "=== Building Cursor DevDock ==="
docker-compose build

# Step 2: Push to GitHub
echo "=== Pushing to GitHub ==="
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
fi

git add .
git commit -m "Cursor DevDock deployment $(date)"

if git remote | grep -q "^origin$"; then
  git remote set-url origin https://github.com/$GITHUB_REPO.git
else
  git remote add origin https://github.com/$GITHUB_REPO.git
fi

git push -u origin main || git push -u origin master

# Step 3: Push to Docker Hub
echo "=== Pushing to Docker Hub ==="
docker login

for service in dashboard mcp-rest-api claude-task-master scraper browser-tools debug-visualizer; do
  echo "Pushing ${service} to Docker Hub..."
  docker tag cursor-devdock_${service} ${DOCKER_USERNAME}/cursor-devdock-${service}:latest
  docker push ${DOCKER_USERNAME}/cursor-devdock-${service}:latest
done

# Step 4: Create production docker-compose file
echo "=== Creating production docker-compose file ==="
cat docker-compose-production.yml | sed "s/\${DOCKER_USERNAME}/$DOCKER_USERNAME/g" > docker-compose.prod.yml

echo "=== Deployment Complete ==="
echo "GitHub Repository: https://github.com/$GITHUB_REPO"
echo "Docker Hub Images: https://hub.docker.com/u/$DOCKER_USERNAME"
echo ""
echo "To run from Docker Hub images:"
echo "  export DOCKER_USERNAME=$DOCKER_USERNAME"
echo "  docker-compose -f docker-compose.prod.yml up -d" 