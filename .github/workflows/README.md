# CI/CD Workflows

This directory contains GitHub Actions workflows for the Customer Survey Platform.

## Available Workflows

### 1. CI/CD Workflow (`ci-cd.yml`)

The main CI/CD pipeline that runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual triggers with environment selection

The workflow includes the following jobs:

1. **Lint Code**: Validates code quality using ESLint
2. **SDK Build and Test**: Builds and tests the SDK, creates the package
3. **Tests**: Runs unit and integration tests for all microservices
4. **Build Docker Images**: Builds Docker images for all services
5. **Security Scan**: Scans Docker images for vulnerabilities using Trivy
6. **Deploy to Dev**: Deploys to the development environment
7. **Deploy to Staging**: Deploys to the staging environment
8. **Deploy to Production**: Deploys to the production environment

### 2. Tests Workflow (`tests.yml`)

Separate workflow focused on running tests with coverage reports.

## Environment Promotion

The CI/CD pipeline implements a progressive delivery approach:

1. Code merged to `develop` is automatically deployed to the development environment
2. Code merged to `main` is automatically deployed to the staging environment
3. Production deployments require a manual trigger or a version tag

## SDK Deployment

The SDK is packaged and published in several ways:

1. As an npm package uploaded to GitHub Packages
2. As a Docker container with:
   - The SDK package
   - Documentation
   - A simple web server with API endpoints:
     - `/health`: Health check
     - `/sdk`: Package download
     - `/docs`: API documentation
     - `/info`: Package information

## Required Secrets

- `GITHUB_TOKEN`: For GitHub repository access
- `KUBE_CONFIG`: Kubernetes configuration for deployments

## Workflow Permissions

Workflows require permission to:
- Read repository contents
- Write packages
- Deploy to environments

## Manual Triggers

To manually trigger a deployment:
1. Go to the Actions tab
2. Select "Customer Survey Platform CI/CD"
3. Click "Run workflow"
4. Select the target environment (dev/staging/prod) 