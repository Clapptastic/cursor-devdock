# Response Service API Documentation

This document provides detailed information about the Response Service API endpoints.

## Base URL

```
/api
```

## Authentication

Most endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Some endpoints (like creating a response) allow anonymous access without authentication.

## Endpoints

### Responses

#### Submit a Response for a Survey

Creates a new response for a specific survey. This endpoint allows anonymous responses.

```
POST /surveys/:surveyId/responses
```

**Path Parameters:**
- `surveyId` - The ID of the survey being responded to

**Request Body:**
```json
{
  "respondentEmail": "respondent@example.com",
  "completionTime": 180,
  "status": "completed",
  "answers": [
    {
      "questionId": "q1",
      "questionText": "How satisfied are you with our service?",
      "questionType": "rating",
      "value": 4
    },
    {
      "questionId": "q2",
      "questionText": "What could we improve?",
      "questionType": "text",
      "value": "Your customer service is great, but website navigation could be better."
    }
  ],
  "metadata": {
    "browser": "Chrome",
    "device": "desktop"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": {
      "id": "uuid",
      "survey_id": "uuid",
      "respondent_id": null,
      "respondent_email": "respondent@example.com",
      "respondent_ip": "192.168.1.1",
      "completion_time": 180,
      "status": "completed",
      "metadata": {
        "browser": "Chrome",
        "device": "desktop"
      },
      "created_at": "2023-05-01T12:00:00Z",
      "answers": [
        {
          "id": "uuid",
          "response_id": "uuid",
          "question_id": "q1",
          "question_text": "How satisfied are you with our service?",
          "question_type": "rating",
          "answer_value": 4,
          "created_at": "2023-05-01T12:00:00Z"
        },
        {
          "id": "uuid",
          "response_id": "uuid",
          "question_id": "q2",
          "question_text": "What could we improve?",
          "question_type": "text",
          "answer_value": "Your customer service is great, but website navigation could be better.",
          "created_at": "2023-05-01T12:00:00Z"
        }
      ]
    }
  }
}
```

#### Get a Response by ID

Retrieves a specific response by ID.

```
GET /responses/:id
```

**Path Parameters:**
- `id` - The response ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": {
      "id": "uuid",
      "survey_id": "uuid",
      "respondent_id": "uuid",
      "respondent_email": "respondent@example.com",
      "completion_time": 180,
      "status": "completed",
      "metadata": {},
      "created_at": "2023-05-01T12:00:00Z",
      "answers": [...]
    }
  }
}
```

#### Get Responses for a Survey

Retrieves all responses for a specific survey.

```
GET /surveys/:surveyId/responses
```

**Path Parameters:**
- `surveyId` - The survey ID

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status (completed, started, abandoned)
- `startDate` (optional) - Filter by responses after this date (ISO format)
- `endDate` (optional) - Filter by responses before this date (ISO format)

**Response:**
```json
{
  "status": "success",
  "data": {
    "responses": [
      {
        "id": "uuid",
        "survey_id": "uuid",
        "respondent_email": "respondent@example.com",
        "completion_time": 180,
        "status": "completed",
        "created_at": "2023-05-01T12:00:00Z",
        "answers": [...]
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

#### Update a Response

Updates an existing response.

```
PUT /responses/:id
```

**Path Parameters:**
- `id` - The response ID

**Request Body:**
```json
{
  "status": "completed",
  "completionTime": 210,
  "answers": [
    {
      "questionId": "q3",
      "questionText": "Would you recommend us?",
      "questionType": "boolean",
      "value": true
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "response": {
      "id": "uuid",
      "status": "completed",
      "completion_time": 210,
      "updated_at": "2023-05-02T12:00:00Z"
    }
  }
}
```

#### Delete a Response

Deletes a response.

```
DELETE /responses/:id
```

**Path Parameters:**
- `id` - The response ID

**Response:**
```
204 No Content
```

### Analytics

#### Get Response Analytics for a Survey

Retrieves analytics data for a specific survey's responses.

```
GET /surveys/:surveyId/analytics
```

**Path Parameters:**
- `surveyId` - The survey ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "totalResponses": 50,
      "statusBreakdown": {
        "completed": 42,
        "abandoned": 8
      },
      "completionRate": 0.84,
      "averageCompletionTime": 195,
      "responsesByDate": {
        "2023-05-01": 10,
        "2023-05-02": 15,
        "2023-05-03": 25
      }
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error message",
  "errors": [
    {
      "field": "answers[0].value",
      "message": "Value is required for rating questions"
    }
  ]
}
```

Common HTTP status codes:
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error 