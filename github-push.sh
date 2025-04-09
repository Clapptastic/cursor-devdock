#!/bin/bash

# Script to initialize git repository and push to GitHub

# Check if repository name is provided
if [ -z "$1" ]; then
  echo "Usage: ./github-push.sh <github-username/repo-name>"
  exit 1
fi

GITHUB_REPO=$1

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
fi

# Add all files
git add .

# Commit changes
git commit -m "Initial commit of Cursor DevDock"

# Add GitHub remote
git remote add origin https://github.com/$GITHUB_REPO.git

# Push to GitHub
echo "Pushing to GitHub repository: $GITHUB_REPO"
git push -u origin main || git push -u origin master

echo "Successfully pushed to GitHub!" 