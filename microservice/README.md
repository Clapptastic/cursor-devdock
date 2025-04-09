# Customer Survey Microservice

A self-contained microservice designed to extend the Customer Survey Application with specialized data processing capabilities.

## Overview

This microservice provides a dedicated API for data processing operations that require isolation from the main application. It uses Supabase for data storage and connects to the main application via API calls when needed.

## Features

- Independent ExpressJS server
- API key authentication
- Supabase data storage
- JWT token handling from main application
- Health and readiness check endpoints
- Advanced survey data processing
- Sentiment analysis
- Theme extraction
- Heatmap generation
- Trend analysis
- Insights generation
- Next steps recommendation

## Setup

1. **Install dependencies**

```bash
cd microservice
npm install
```

2. **Configure environment variables**

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Update the following fields:
- `PORT`: Port for the microservice (default: 3001)
- `MAIN_API_URL`: URL of the main Customer Survey application
- `SUPABASE_URL`, `SUPABASE_KEY`: Your Supabase configuration
- `API_KEY`: Create a secure key for authenticating requests to this microservice

3. **Run database migrations**

Use the Supabase SQL Editor to run the migration from `src/migrations/20250405_init_processed_data.sql`.

4. **Start the microservice**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Checks

- `GET /health`: Health check endpoint that verifies database connectivity
- `GET /health/ready`: Readiness probe for container environments

### Data Processing

All data processing endpoints require an API key in the `x-api-key` header.

- `POST /api/process`: Process data and store results
  - Request Body: `{ "data": [...], "options": {...} }`
  - Returns: Processed data with ID

- `GET /api/process/:id`: Get processed data by ID
  - Returns: Previously processed data

- `GET /api/process`: Get all processed data (paginated)
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `sort`: Field to sort by (default: 'created_at')
    - `order`: Sort order 'asc' or 'desc' (default: 'desc')
    - `status`: Filter by status ('completed', 'processing', 'failed')
    - `type`: Filter by analysis type
  - Returns: List of processed data with pagination info

- `DELETE /api/process/:id`: Delete processed data by ID
  - Returns: Success message

### Sentiment Analysis

- `POST /api/process/sentiment`: Analyze sentiment in textual survey responses
  - Request Body: `{ "data": [...], "options": {...} }`
  - Returns: Sentiment analysis results

### Theme Analysis

- `POST /api/process/themes`: Extract common themes from survey responses
  - Request Body: `{ "data": [...], "options": {...} }`
  - Returns: Extracted themes with frequencies

### Advanced Analysis

- `POST /api/analysis/insights`: Generate actionable insights from survey data
  - Request Body: `{ "data": [...], "options": {...} }`
  - Returns: Key insights, recommendations, and user segments

- `POST /api/analysis/heatmap`: Generate heatmap visualization data
  - Request Body: `{ "data": [...], "options": {...} }`
  - Returns: Heatmap data and hotspot identification

- `POST /api/analysis/trends`: Analyze trends between current and previous survey data
  - Request Body: `{ "currentData": [...], "previousData": [...], "options": {...} }`
  - Returns: Trend analysis with key metrics and changes

- `POST /api/analysis/next-steps`: Generate recommended next steps based on survey data
  - Request Body: `{ "data": [...], "options": {...} }`
  - Returns: Follow-up questions, suggested actions, and prioritized findings

## Processing Options

The `options` object can include the following properties:

- `processingType`: Level of analysis ('basic', 'advanced', 'premium')
- `calculateScores`: Whether to calculate scores for responses (boolean)
- `includeMeta`: Include metadata in the results (boolean)
- `normalize`: Normalize numeric values (boolean)
- `compareWithPrevious`: Compare with previous data (boolean)
- `tags`: Array of tags to associate with the data
- `userId`: UUID of the user who owns the data
- `surveyId`: UUID of the survey being analyzed
- `storageOptions`: Additional storage options
  - `ttl`: Time-to-live in seconds
  - `priority`: Processing priority ('low', 'normal', 'high')
  - `compression`: Whether to compress the data (boolean)

## Integrating with Main Application

To call this microservice from the main Customer Survey application:

```javascript
const axios = require('axios');

const callMicroservice = async (data) => {
  try {
    const response = await axios.post('http://localhost:3001/api/process', {
      data,
      options: { 
        processingType: 'advanced',
        calculateScores: true,
        normalize: true
      }
    }, {
      headers: {
        'x-api-key': process.env.MICROSERVICE_API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Microservice error:', error.message);
    throw error;
  }
};
```

## Testing

Run the test suite:

```bash
npm test
```

Generate test coverage report:

```bash
npm run test:coverage
``` 