#!/bin/bash

# Check if GitHub repository URL is provided
if [ -z "$1" ]; then
  echo "Usage: ./github-commit.sh <github-repo-url>"
  echo "Example: ./github-commit.sh https://github.com/yourusername/cursor-devdock.git"
  exit 1
fi

GITHUB_REPO_URL=$1

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
fi

# Add all files
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Initial commit of Cursor DevDock"

# Check if origin remote exists and set it
if git remote | grep -q "^origin$"; then
  echo "Setting remote URL to $GITHUB_REPO_URL"
  git remote set-url origin $GITHUB_REPO_URL
else
  echo "Adding remote origin as $GITHUB_REPO_URL"
  git remote add origin $GITHUB_REPO_URL
fi

# Push to GitHub
echo "Pushing to GitHub repository..."
git push -u origin main || git push -u origin master

echo "Successfully pushed to GitHub!" 