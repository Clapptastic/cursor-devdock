# Customer Survey Application Tests

This directory contains test suites for the Customer Survey application. The tests are organized into directories that mirror the project structure.

## Test Structure

- `controllers/` - Tests for API controllers that handle requests and responses
- `database/` - Tests for database interactions including migrations, seeds, and the Supabase client
- `frontend/` - Tests for React components and pages
- `integration/` - End-to-end tests that verify multiple components working together
- `middleware/` - Tests for middleware functions like validation and authentication
- `routes/` - Tests for API route definitions and configurations

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/tests/controllers/analysisController.test.js

# Run tests with coverage report
npm run test:coverage
```

## Test Utilities

The `database/testSupabaseSetup.js` file provides helper functions for mocking Supabase in tests:

- `createMockSupabaseClient()` - Creates a mock Supabase client with chainable methods
- `createSuccessResponse()` - Creates a mock successful response object
- `createErrorResponse()` - Creates a mock error response object
- `createMockData()` - Creates sample data for different tables
- `setupMockResponses()` - Configures a mock client with predefined responses

## Database Tests

The database tests focus on:

1. **Migrations** - Testing the database schema creation and rollback
2. **Seeds** - Verifying seed data is properly inserted
3. **Supabase Client** - Testing the client configuration and utility functions

## API Tests

The API tests cover:

1. **Controllers** - Testing request handling, business logic, and response formation
2. **Middleware** - Testing request validation, authentication, and error handling
3. **Routes** - Testing API endpoints and their configurations

## Frontend Tests

Frontend tests include:

1. **Component Tests** - Testing React components for rendering and user interactions
2. **Integration Tests** - Testing component interactions within features
3. **AI Features** - Testing AI-powered components and their interactions with the API

## AI Features Tests

Special attention is given to testing AI features:

1. **Analysis Controller** - Tests for survey data processing and trend analysis
2. **Validation Middleware** - Tests for validating analysis requests
3. **Integration Tests** - Tests for the complete AI analysis workflow

## Test Mocking Strategy

These tests use the following mocking strategy:

1. External APIs (Supabase, AI providers) are mocked to avoid external dependencies
2. Database operations are mocked to focus on business logic
3. Authentication is mocked to simulate authorized requests
4. Frontend components use React Testing Library to simulate user interactions

## Adding New Tests

When adding new tests:

1. Follow the naming convention: `[filename].test.js`
2. Place tests in the appropriate directory that mirrors the project structure
3. Use the utility functions in `testSupabaseSetup.js` for database mocking
4. Follow the Arrange-Act-Assert pattern in test cases 