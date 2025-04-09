# Survey Service API Documentation

This document provides detailed information about the Survey Service API endpoints.

## Base URL

```
/api
```

## Authentication

All endpoints require authentication using Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Surveys

#### Get All Surveys

Retrieves all surveys for the authenticated user.

```
GET /surveys
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (draft, active, archived)

**Response:**
```json
{
  "status": "success",
  "data": {
    "surveys": [
      {
        "id": "uuid",
        "title": "My Survey",
        "description": "Survey description",
        "status": "active",
        "created_at": "2023-05-01T12:00:00Z",
        "updated_at": "2023-05-01T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

#### Create a Survey

Creates a new survey.

```
POST /surveys
```

**Request Body:**
```json
{
  "title": "My Survey",
  "description": "Survey description",
  "questions": [
    {
      "text": "What is your name?",
      "type": "text",
      "required": true
    },
    {
      "text": "How satisfied are you with our service?",
      "type": "rating",
      "required": true,
      "minValue": 1,
      "maxValue": 5
    }
  ],
  "status": "draft",
  "settings": {
    "showProgressBar": true,
    "showQuestionNumbers": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "survey": {
      "id": "uuid",
      "title": "My Survey",
      "description": "Survey description",
      "questions": [...],
      "status": "draft",
      "created_at": "2023-05-01T12:00:00Z",
      "updated_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

#### Get a Survey

Retrieves a specific survey by ID.

```
GET /surveys/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "survey": {
      "id": "uuid",
      "title": "My Survey",
      "description": "Survey description",
      "questions": [...],
      "status": "active",
      "created_at": "2023-05-01T12:00:00Z",
      "updated_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

#### Update a Survey

Updates an existing survey.

```
PUT /surveys/:id
```

**Request Body:**
```json
{
  "title": "Updated Survey Title",
  "description": "Updated description",
  "status": "active"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "survey": {
      "id": "uuid",
      "title": "Updated Survey Title",
      "description": "Updated description",
      "status": "active",
      "updated_at": "2023-05-02T12:00:00Z"
    }
  }
}
```

#### Delete a Survey

Deletes a survey.

```
DELETE /surveys/:id
```

**Response:**
```
204 No Content
```

#### Search Surveys

Searches for surveys based on criteria.

```
GET /surveys/search
```

**Query Parameters:**
- `title` (optional): Search in title
- `status` (optional): Filter by status
- `is_template` (optional): Filter templates (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "surveys": [...],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

#### Create Template from Survey

Creates a template from an existing survey.

```
POST /surveys/:id/template
```

**Request Body:**
```json
{
  "title": "My Template",
  "description": "Template description"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "template": {
      "id": "uuid",
      "title": "My Template",
      "description": "Template description",
      "is_template": true,
      "original_survey_id": "uuid",
      "created_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

### Templates

#### Get All Templates

Retrieves all templates for the authenticated user.

```
GET /templates
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "templates": [...],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

#### Create a Template

Creates a new template.

```
POST /templates
```

**Request Body:**
```json
{
  "title": "Customer Feedback Template",
  "description": "Template for gathering customer feedback",
  "questions": [...],
  "category": "Feedback",
  "tags": ["customer", "feedback"],
  "isPublic": false
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "template": {
      "id": "uuid",
      "title": "Customer Feedback Template",
      "description": "Template for gathering customer feedback",
      "is_template": true,
      "created_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

#### Get a Template

Retrieves a specific template by ID.

```
GET /templates/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "template": {
      "id": "uuid",
      "title": "Customer Feedback Template",
      "description": "Template for gathering customer feedback",
      "questions": [...],
      "is_template": true,
      "created_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

#### Update a Template

Updates an existing template.

```
PUT /templates/:id
```

**Request Body:**
```json
{
  "title": "Updated Template Title",
  "description": "Updated description",
  "isPublic": true
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "template": {
      "id": "uuid",
      "title": "Updated Template Title",
      "description": "Updated description",
      "isPublic": true,
      "updated_at": "2023-05-02T12:00:00Z"
    }
  }
}
```

#### Delete a Template

Deletes a template.

```
DELETE /templates/:id
```

**Response:**
```
204 No Content
```

#### Create Survey from Template

Creates a new survey from a template.

```
POST /templates/:id/create-survey
```

**Request Body:**
```json
{
  "title": "My New Survey",
  "description": "Survey description",
  "settings": {
    "showProgressBar": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "survey": {
      "id": "uuid",
      "title": "My New Survey",
      "description": "Survey description",
      "template_id": "uuid",
      "is_template": false,
      "status": "draft",
      "created_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

### Survey Sharing

#### Share a Survey

Shares a survey with another user.

```
POST /surveys/:id/shares
```

**Request Body:**
```json
{
  "userId": "uuid", // or "email": "user@example.com"
  "permission": "view", // view, edit, or admin
  "expiresAt": "2023-12-31T23:59:59Z" // optional
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "survey": {
      "id": "uuid",
      "is_shared": true
    },
    "share": {
      "id": "uuid",
      "survey_id": "uuid",
      "user_id": "uuid",
      "permission": "view",
      "created_at": "2023-05-01T12:00:00Z"
    }
  }
}
```

#### Get Survey Shares

Retrieves all users with whom a survey is shared.

```
GET /surveys/:id/shares
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "shares": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "email": "user@example.com",
        "permission": "view",
        "created_at": "2023-05-01T12:00:00Z",
        "expires_at": "2023-12-31T23:59:59Z"
      }
    ]
  }
}
```

#### Update Share Permissions

Updates the permission level for a shared survey.

```
PATCH /surveys/:id/shares/:shareId
```

**Request Body:**
```json
{
  "permission": "edit"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "share": {
      "id": "uuid",
      "permission": "edit",
      "updated_at": "2023-05-02T12:00:00Z"
    }
  }
}
```

#### Remove Share

Removes sharing access for a user.

```
DELETE /surveys/:id/shares/:shareId
```

**Response:**
```
204 No Content
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error message",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
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