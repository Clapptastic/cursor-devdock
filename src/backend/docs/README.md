# API Documentation

This directory contains the API documentation for the Customer Survey Application.

## Overview

The API documentation is built using the OpenAPI 3.0 specification (Swagger) and is accessible through a web interface at `/api-docs` when the server is running.

## Files

- `swagger.json`: The OpenAPI specification file that defines all API endpoints, request/response schemas, and security requirements.

## Features

- Interactive API documentation with Swagger UI
- Request/response schema validation
- Authentication information
- Examples for each endpoint
- Try-it-out functionality to test API calls directly from the documentation

## Updating Documentation

When adding new endpoints or modifying existing ones, make sure to update the `swagger.json` file accordingly. Follow these steps:

1. Add the new endpoint under the appropriate path in the `paths` section
2. Define request parameters and body schemas
3. Define response schemas
4. Link to reusable components in the `components/schemas` section
5. Add appropriate security requirements

## Security

The API documentation includes security definitions for JWT authentication. Protected endpoints require a valid Bearer token.

## Usage

To access the documentation:

1. Start the server: `npm run dev`
2. Open your browser at `http://localhost:3000/api-docs`
3. Explore the available endpoints
4. To test authenticated endpoints, obtain a token and use the Authorize button to set it 