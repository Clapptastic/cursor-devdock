# Customer Survey Platform - Test Suite

This directory contains the comprehensive test suite for the Customer Survey Platform microservices.

## Test Structure

The test suite is organized in the following structure:

```
services/
├── tests/
│   ├── setup.js              # Global test setup and configuration
│   ├── unit/                 # Unit tests for individual services
│   └── integration/          # Integration tests between services
├── <service-name>/
│   ├── tests/
│   │   ├── unit/             # Service-specific unit tests
│   │   └── integration/      # Service-specific integration tests
```

### Unit Tests

Unit tests verify the functionality of individual components within each service:

- **API Gateway**: Tests for routing, error handling, and proxying
- **Survey Service**: Tests for survey CRUD operations
- **Response Service**: Tests for response submission and statistics
- **AI Service**: Tests for text analysis, sentiment analysis, and recommendation features, including:
  - API endpoint tests (analyze/text, insights, recommend/survey)
  - Core AI service functions (generateQuestions, improveQuestion, translateSurvey, etc.)
  - NLP service functions (extractKeyPhrases, analyzeSentiment, classifyText)
  - ML service functions (generateInsights, recommendSurveyChanges, predictCustomerBehavior)
  - Edge case handling and error scenarios

### Integration Tests

Integration tests verify the communication between services:

- **API Gateway to Survey Service**: Tests the routing and processing of survey-related requests
- **API Gateway to Response Service**: Tests the routing and processing of response-related requests
- **API Gateway to AI Service**: Tests the routing of AI analysis and recommendation requests
- **End-to-End Test**: Simulates a complete user flow from survey creation to response submission and analysis

## Running the Tests

### Running All Tests

To run all tests in the project:

```bash
npm test
```

### Running Tests for a Specific Service

To run tests for a specific service:

```bash
cd services/<service-name>
npm test
```

### Running Specific Test Files

To run a specific test file:

```bash
npm test -- <path-to-test-file>
```

Example:
```bash
npm test -- services/tests/integration/end-to-end.test.js
```

### Running Tests with Coverage

To run tests with coverage reporting:

```bash
npm test -- --coverage
```

## Test Configuration

Test configuration is managed through the following files:

- **jest.config.js**: Main Jest configuration for all services
- **services/tests/setup.js**: Global setup for all tests

## Mocking

The test suite uses the following mocking strategies:

- **External Services**: 3rd party services are mocked using Jest mock functions
- **Database**: Supabase client is mocked to simulate database operations
- **Services**: For integration tests, real service instances are used but with mocked dependencies
- **AI Models**: AI service calls are mocked to simulate model responses and behavior
- **Environment**: Test environment is controlled through environment variables defined in setup.js

## AI Service Testing Approach

The AI service tests are structured to verify:

1. **API Endpoints**: Tests for expected responses, validation, and error handling
2. **Core AI Functions**: Tests for the business logic implemented in aiService.js
3. **NLP Component**: Tests for natural language processing capabilities (sentiment analysis, key phrase extraction)
4. **ML Component**: Tests for machine learning functionality (insights generation, recommendations)
5. **Edge Cases**: Tests for boundary conditions like empty inputs, extremely long inputs, and malformed data
6. **Error Handling**: Tests for graceful handling of service unavailability and invalid inputs

These tests use mocking extensively to simulate AI model responses without requiring actual model inference.

## Debugging Tests

To debug tests, you can use the following techniques:

1. Use the `--verbose` flag to see detailed test output:
   ```bash
   npm test -- --verbose
   ```

2. Run tests in debug mode:
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand <path-to-test-file>
   ```

3. Enable console output during tests by setting:
   ```bash
   SILENT_TESTS=false npm test
   ```

## Continuous Integration

Tests are automatically run as part of the CI/CD pipeline when code is pushed to GitHub. See `.github/workflows/ci-cd.yml` for details. 