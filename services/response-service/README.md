# Response Management Service

A microservice for collecting, storing, and retrieving survey responses using Supabase. This service is part of the Customer Survey AI platform.

## Features

- Collection of survey responses with validation against survey schema
- Storage of response data in Supabase
- Analytics for survey responses
- Authentication and authorization controls
- Comprehensive API for response management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account with project set up

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd services/response-service
```

2. Install dependencies
```bash
npm install
```

3. Copy the example environment file and update with your values
```bash
cp .env.example .env
```

4. Set up your Supabase database using the SQL scripts in the `sql` directory
```bash
# Run this script on your Supabase database
cat sql/init.sql | psql <your-connection-string>
```

### Running the Service

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## API Documentation

The Response Service exposes the following main endpoints:

- `POST /api/surveys/:surveyId/responses` - Submit a response for a survey
- `GET /api/surveys/:surveyId/responses` - Get all responses for a survey
- `GET /api/responses/:id` - Get a specific response by ID
- `PUT /api/responses/:id` - Update a response
- `DELETE /api/responses/:id` - Delete a response
- `GET /api/surveys/:surveyId/analytics` - Get analytics for a survey's responses

For complete API documentation, see [API Documentation](docs/api-documentation.md).

## Database Schema

The service uses Supabase (PostgreSQL) with the following main tables:

- `survey_responses` - Stores response header information
- `response_answers` - Stores individual answers for each question

For complete database schema documentation, see [Database Schema](docs/database-schema.md).

## Architecture

The Response Service follows a modular architecture:

- `controllers/` - HTTP request handlers
- `models/` - Database operations and business logic
- `middleware/` - Express middleware (auth, validation, error handling)
- `routes/` - API route definitions
- `utils/` - Utility functions and helpers
- `config/` - Configuration for database, etc.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | The port the service runs on | No (default: 3003) |
| NODE_ENV | Environment (development, production) | No (default: development) |
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_KEY | Supabase service role key | Yes |
| JWT_SECRET | Secret for JWT verification | Yes |
| LOG_LEVEL | Winston log level | No (default: info) |

## Testing

```bash
npm test
```

## License

This project is proprietary and confidential. 