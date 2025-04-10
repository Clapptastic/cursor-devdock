#!/bin/bash

echo "Building and deploying Cursor DevDock..."

# Stop any running containers
docker-compose down

# Build the containers
docker-compose build

# Start the containers
./init.sh

echo "Deployment complete! Cursor DevDock is now running."
echo "Access the dashboard at http://localhost:3000" 