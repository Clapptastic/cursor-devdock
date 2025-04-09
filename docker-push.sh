#!/bin/bash

# Script to build and push Docker images to Docker Hub

# Check if Docker Hub username is provided
if [ -z "$1" ]; then
  echo "Usage: ./docker-push.sh <dockerhub-username>"
  exit 1
fi

DOCKER_USERNAME=$1
IMAGE_PREFIX="${DOCKER_USERNAME}/cursor-devdock"

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Build all images
echo "Building Docker images..."
docker-compose build

# Tag and push each service
for service in dashboard mcp-rest-api claude-task-master scraper browser-tools debug-visualizer; do
  echo "Pushing ${service} to Docker Hub..."
  docker tag cursor-devdock_${service} ${IMAGE_PREFIX}-${service}:latest
  docker push ${IMAGE_PREFIX}-${service}:latest
done

echo "All images have been pushed to Docker Hub!" 