# Customer Survey Platform

A comprehensive platform for creating, distributing, and analyzing customer surveys with AI-powered insights.

## Architecture

The Customer Survey Platform is built on a microservices architecture that includes:

1. **Frontend** - React-based SPA for user interactions
2. **Kong API Gateway** - Enterprise-grade API Gateway for routing client requests to appropriate services
3. **Survey Service** - Manages survey creation and retrieval
4. **Response Service** - Handles collection and storage of survey responses
5. **AI Service** - Provides analytics, insights, and recommendations

## Services Overview

### Frontend
- Provides the user interface for creating, managing, and analyzing surveys
- Built with React
- Communicates with the Kong API Gateway

### Kong API Gateway (Port 8000)
- Entry point for all client requests
- Routes requests to appropriate microservices
- Provides rate limiting, CORS, and other security features
- Admin API available on port 8001
- Configured via declarative config in kong.yml

### Survey Service (Port 3001)
- Manages survey creation, storage, and retrieval
- Supports CRUD operations for surveys
- Enables survey sharing and public access features

### Response Service (Port 3002)
- Collects and stores survey responses
- Provides basic response statistics and data export
- Handles anonymous and authenticated responses

### AI Service (Port 3003)
- Analyzes survey responses for insights
- Performs sentiment analysis on text responses
- Identifies key themes and patterns in responses
- Generates recommendations for survey improvement
- Offers AI-powered survey design suggestions

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Building and Deploying

#### Using the Script (Recommended)

For Linux/macOS:
```bash
# Make the script executable
chmod +x build-deploy.sh
# Run the script
./build-deploy.sh
```

For Windows:
```powershell
# Run the PowerShell script
.\build-deploy.ps1
```

#### Manual Deployment
```bash
# Build all services
docker-compose build --no-cache

# Start all services in detached mode
docker-compose up -d

# Check service status
docker-compose ps
```

### Accessing the Platform

- Frontend: http://localhost
- Kong API Gateway: http://localhost:8000
- Kong Admin API: http://localhost:8001

## CI/CD Pipeline

The platform uses GitHub Actions for continuous integration and deployment with automated pipelines:

### Pipeline Stages

1. **Lint**: Validates code quality and formatting
2. **Test**: Runs unit and integration tests for all services
3. **Build**: Creates Docker images for all microservices
4. **Security Scan**: Checks Docker images for vulnerabilities using Trivy
5. **Deployment**: Automatically deploys to the appropriate environment

### Deployment Environments

- **Dev**: Deploys on pushes to the `develop` branch
- **Staging**: Deploys on pushes to the `main` branch
- **Production**: Manual deployment with required approvals

### Pipeline Features

- Automatic versioning and tagging of Docker images
- Vulnerability scanning for all container images
- Kubernetes-based deployments with zero downtime
- Environment-specific configurations
- Manual deployment triggers for any environment

See [CI/CD Pipeline Documentation](.github/workflows/README.md) for more details.

## Testing

The platform includes a comprehensive test suite to ensure functionality, reliability, and security:

### Test Types

- **Unit Tests**: Verify individual components within each service
  - Service endpoints and controllers
  - Core business logic and data processing
  - Edge cases and error handling
  - AI service components (NLP, ML models, content generation)
- **Integration Tests**: Test communication between microservices
- **End-to-End Tests**: Validate complete user flows across the platform

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific service
cd services/<service-name>
npm test

# Run with coverage reporting
npm test -- --coverage
```

### Test Coverage

The test suite provides extensive coverage of all platform components:

- **API Gateway**: 90%+ coverage of route definitions and middleware
- **Survey Service**: 95%+ coverage of CRUD operations and business logic
- **Response Service**: 90%+ coverage of response collection and processing
- **AI Service**: 95%+ coverage including:
  - API endpoints for analysis and recommendations
  - Core AI functions for content generation and processing
  - NLP components (sentiment analysis, key phrase extraction)
  - ML components (insights, recommendations, predictions)
  - Edge cases and error handling

### Test Architecture

- Tests are organized by service and test type
- Mock data and services are used to isolate test environments
- Integration tests use in-memory services with real HTTP communication
- CI pipeline automatically runs tests on every commit

See [Test Documentation](services/tests/README.md) for comprehensive details on the test suite.

## Development

### Kong Configuration

The Kong API Gateway is configured using a declarative configuration file (kong.yml) with the following structure:

```yaml
_format_version: "2.1"
_transform: true

services:
  # Service definitions with routes and plugins
  - name: service-name
    url: http://service-host:port
    routes:
      - name: route-name
        paths:
          - /path-pattern
        strip_path: true
    plugins:
      # Plugin configurations
```

Key components of the Kong configuration:

1. **Services**: Backend services that Kong proxies to
2. **Routes**: Rules for matching client requests to services
3. **Plugins**: Middleware that extends Kong's functionality (rate limiting, CORS, etc.)

To modify the API routes, edit the kong.yml file and restart the Kong container:

```bash
docker-compose restart kong
```

### Environment Variables

Each service uses environment variables for configuration. Default values are provided in `.env.example` files in each service directory. Copy these to `.env` files and modify as needed.

### Service Endpoints via Kong

#### Survey Service
- `GET /api/surveys` - Get all surveys
- `GET /api/surveys/:id` - Get survey by ID
- `POST /api/surveys` - Create a new survey
- `PUT /api/surveys/:id` - Update a survey
- `DELETE /api/surveys/:id` - Delete a survey
- `GET /survey/:id` - Get a survey for public sharing

#### Response Service
- `GET /api/responses` - Get all responses (can filter by surveyId)
- `GET /api/responses/:id` - Get response by ID
- `POST /api/responses` - Submit a new response
- `GET /api/responses/stats/:surveyId` - Get statistics for a survey
- `DELETE /api/responses/:id` - Delete a response

#### AI Service
- `GET /api/ai/analyze/text` - Analyze text for sentiment and key phrases
- `POST /api/ai/insights` - Generate insights from survey responses
- `POST /api/ai/recommend/survey` - Get AI-generated survey recommendations

## Monitoring & Management

### Viewing Logs
```bash
# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f <service-name>
# Example: docker-compose logs -f kong
```

### Stopping the Platform
```bash
docker-compose down
```

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 