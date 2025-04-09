# Survey Management Service

This microservice is responsible for managing surveys in the Customer Survey AI platform. It provides endpoints for creating, retrieving, updating, and deleting surveys.

## Features

- Survey CRUD operations
- Survey templating
- Survey sharing and permissions
- Survey versioning
- Integration with Supabase for data storage

## Tech Stack

- Node.js
- Express.js
- Supabase
- Joi (validation)
- Winston (logging)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3002
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Logging
LOG_LEVEL=info
```

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Start the service
   ```
   npm start
   ```

   For development with hot reload:
   ```
   npm run dev
   ```

## API Endpoints

### Surveys

- `GET /api/surveys`: Get all surveys
- `GET /api/surveys/:id`: Get a survey by ID
- `POST /api/surveys`: Create a new survey
- `PUT /api/surveys/:id`: Update a survey
- `DELETE /api/surveys/:id`: Delete a survey

### Templates

- `GET /api/templates`: Get all templates
- `GET /api/templates/:id`: Get a template by ID
- `POST /api/templates`: Create a new template
- `POST /api/templates/:id/create-survey`: Create a survey from a template

### API Documentation

API documentation is available at `/api-docs` when the service is running.

## Database Schema

The service uses Supabase as its database. The main table structure is:

### surveys
- `id`: UUID
- `user_id`: String
- `title`: String
- `description`: String
- `questions`: JSON Array
- `status`: String (draft, active, archived)
- `is_template`: Boolean
- `version`: Number
- `original_survey_id`: UUID (for templates)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Running Tests

```
npm test
```

For test coverage:
```
npm run test:coverage
``` 