# Response Service Database Schema

This document outlines the database schema for the Response Service using Supabase.

## Tables

### survey_responses

Stores response header information.

| Column           | Type      | Description                                      |
|------------------|-----------|--------------------------------------------------|
| id               | uuid      | Primary key                                      |
| survey_id        | uuid      | ID of the survey being responded to              |
| respondent_id    | uuid      | ID of the user responding (if authenticated)     |
| respondent_email | text      | Email of respondent (for anonymous responses)    |
| respondent_ip    | text      | IP address of respondent (optional)              |
| completion_time  | integer   | Time taken to complete survey in seconds         |
| status           | text      | Response status (started, completed, abandoned)  |
| metadata         | jsonb     | Additional metadata about the response           |
| created_at       | timestamp | Creation timestamp                               |
| updated_at       | timestamp | Last update timestamp                            |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `survey_id` references `surveys.id` ON DELETE CASCADE
- Foreign Key: `respondent_id` references `auth.users.id`
- Index: `survey_id`
- Index: `(survey_id, respondent_id)`
- Index: `(survey_id, respondent_email)`
- Index: `(survey_id, created_at)`

### response_answers

Stores individual answers for each question in a response.

| Column           | Type      | Description                                      |
|------------------|-----------|--------------------------------------------------|
| id               | uuid      | Primary key                                      |
| response_id      | uuid      | ID of the response this answer belongs to        |
| question_id      | text      | ID of the question being answered                |
| question_text    | text      | Text of the question (for data durability)       |
| question_type    | text      | Type of question (text, multiple choice, etc.)   |
| answer_value     | jsonb     | Answer value(s)                                  |
| created_at       | timestamp | Creation timestamp                               |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `response_id` references `survey_responses.id` ON DELETE CASCADE
- Index: `response_id`
- Index: `(response_id, question_id)`

## Row Level Security Policies

### survey_responses

- `responses_survey_owner`: Survey owners can read all responses for their surveys
- `responses_respondent`: Respondents can read their own responses
- `responses_create`: Anyone can create a response
- `responses_admin`: Admins can access all responses

### response_answers

- `answers_survey_owner`: Survey owners can read all answers for their surveys
- `answers_respondent`: Respondents can read their own answers
- `answers_create`: Anyone can create answers for their responses
- `answers_admin`: Admins can access all answers

## Functions

### get_survey_response_rate(survey_id uuid)

Calculates the response rate for a given survey.

**Returns:**
- `response_rate`: The percentage of responses that are complete
- `total_responses`: The total number of responses
- `completed_responses`: The number of completed responses

### get_response_analytics(survey_id uuid)

Generates analytics for survey responses.

**Returns:**
- `totalResponses`: Count of all responses
- `statusBreakdown`: Counts by status
- `completionRate`: Percentage of completed responses
- `averageCompletionTime`: Average time to complete in seconds
- `responsesByDate`: Responses grouped by date 