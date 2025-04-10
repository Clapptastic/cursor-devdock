#!/bin/bash

# GitHub Repository Setup and Push Script

# Check if GitHub username is provided
if [ -z "$1" ]; then
  echo "Usage: ./github-setup.sh <github-username> [repository-name]"
  echo "Example: ./github-setup.sh johndoe cursor-devdock"
  exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME=${2:-"cursor-devdock"}  # Default to cursor-devdock if not provided

echo "Setting up GitHub repository for $GITHUB_USERNAME/$REPO_NAME"

# Update remote URL with the correct GitHub username
git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo "Remote URL updated to: https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Instructions for creating the repository on GitHub
echo ""
echo "IMPORTANT: Before pushing, you must create the repository on GitHub:"
echo "1. Go to https://github.com/new"
echo "2. Name it '$REPO_NAME'"
echo "3. Add a description (e.g., 'AI-Powered Local Dev Environment for Cursor')"
echo "4. Choose visibility (public or private)"
echo "5. Do NOT initialize with README, .gitignore, or license"
echo "6. Click 'Create repository'"
echo ""
echo "After creating the repository, run the following command to push your code:"
echo "  git push -u origin main"
echo ""
echo "If you've already created the repository, you can push now by running:"
echo "  git push -u origin main" 