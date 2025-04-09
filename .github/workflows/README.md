# CI/CD Pipeline for Customer Survey Platform

This document describes the CI/CD pipeline implemented with GitHub Actions for the Customer Survey Platform.

## Pipeline Overview

The CI/CD pipeline automates the build, test, and deployment processes for the microservices architecture:

1. **Lint**: Validates code quality
2. **Test**: Runs automated tests for each service
3. **Build**: Creates Docker images for each microservice
4. **Security Scan**: Checks Docker images for vulnerabilities
5. **Deployment**: Deploys to dev, staging, and production environments based on triggers

## Pipeline Triggers

The pipeline is triggered by these events:

- **Push to develop branch**: Runs the pipeline and deploys to dev environment
- **Push to main branch**: Runs the pipeline and deploys to dev and staging environments
- **Pull Requests to develop/main**: Runs linting, tests, and builds (without deployment)
- **Manual trigger**: Allows deploying to any environment (dev, staging, prod)

## Deployment Environments

The pipeline supports three deployment environments:

- **Dev**: For development and testing features
- **Staging**: Pre-production environment for integration testing
- **Production**: Live environment for end users

Each environment has protection rules requiring appropriate approvals before deployment.

## Security Features

The pipeline includes several security features:

- **Dependency Scanning**: Checks for vulnerabilities in dependencies
- **Docker Image Scanning**: Uses Trivy to scan container images
- **Secure Secrets**: Uses GitHub Secrets for sensitive information
- **Environment Protection**: Requires approvals for sensitive deployments

## Required Secrets

To use this pipeline, the following secrets must be configured in GitHub:

- `KUBE_CONFIG_DEV`: Kubernetes configuration for dev environment
- `KUBE_CONFIG_STAGING`: Kubernetes configuration for staging environment
- `KUBE_CONFIG_PROD`: Kubernetes configuration for production environment

## Container Registry

The pipeline uses GitHub Container Registry (ghcr.io) to store Docker images. Authentication happens automatically using the GitHub Actions runner's credentials.

## Best Practices Implemented

This pipeline follows DevOps best practices:

- **Infrastructure as Code**: Kubernetes manifests for deployments
- **Immutable Artifacts**: Images are tagged with commit SHA
- **Staged Deployments**: Progressive deployment through environments
- **Automated Testing**: Tests run before deployments
- **Security Scanning**: Vulnerability scanning of container images
- **Approval Gates**: Required approvals for production deployment
- **Zero-Downtime Deployments**: Rolling updates in Kubernetes

## Extending the Pipeline

To add new services to the pipeline:

1. Add the service name to the matrix in the build job
2. Create appropriate Kubernetes manifests in kubernetes/{env}/ directories
3. Add the service to the deployment verification steps 