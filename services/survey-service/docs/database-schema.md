# Survey Service Database Schema

This document outlines the database schema for the Survey Service using Supabase.

## Tables

### surveys

Stores survey and template data.

| Column           | Type      | Description                                      |
|------------------|-----------|--------------------------------------------------|
| id               | uuid      | Primary key                                      |
| user_id          | uuid      | ID of the user who created the survey            |
| title            | text      | Survey title                                     |
| description      | text      | Survey description                               |
| questions        | jsonb     | Array of question objects                        |
| status           | text      | Survey status (draft, active, archived)          |
| is_template      | boolean   | Whether this is a template                       |
| is_shared        | boolean   | Whether this survey has been shared              |
| version          | integer   | Survey version number                            |
| original_survey_id | uuid    | For templates: the original survey ID            |
| template_id      | uuid      | For surveys created from templates: template ID  |
| settings         | jsonb     | Survey settings object                           |
| created_at       | timestamp | Creation timestamp                               |
| updated_at       | timestamp | Last update timestamp                            |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `user_id` references `auth.users.id`
- Index: `user_id`
- Index: `(is_template, status)` where `is_template = true`

### survey_shares

Stores information about shared surveys.

| Column           | Type      | Description                                      |
|------------------|-----------|--------------------------------------------------|
| id               | uuid      | Primary key                                      |
| survey_id        | uuid      | ID of the shared survey                          |
| user_id          | uuid      | ID of the user with access (nullable)            |
| email            | text      | Email of user with access (if user_id unknown)   |
| permission       | text      | Permission level (view, edit, admin)             |
| created_at       | timestamp | Creation timestamp                               |
| created_by       | uuid      | ID of the user who created the share             |
| expires_at       | timestamp | Expiration timestamp (nullable)                  |
| updated_at       | timestamp | Last update timestamp                            |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `survey_id` references `surveys.id` ON DELETE CASCADE
- Foreign Key: `user_id` references `auth.users.id`
- Foreign Key: `created_by` references `auth.users.id`
- Index: `(survey_id, user_id)`
- Index: `(survey_id, email)`

## Row Level Security Policies

### surveys

- `surveys_auth`: Users can read, insert, update, delete their own surveys
- `surveys_shared`: Users can read or update surveys shared with them depending on permission
- `surveys_templates`: Users can read public templates
- `surveys_admin`: Admins can access all surveys

### survey_shares

- `shares_owner`: Survey owners can read, insert, update, delete shares for their surveys
- `shares_user`: Users can read shares where they are the recipient
- `shares_admin`: Admins can access all shares

## Functions

### check_survey_access(survey_id uuid, user_id uuid)

Checks if a user has access to a specific survey and returns the permission level.

**Returns:**
- `access_level`: One of 'owner', 'shared', or NULL
- `permission`: One of 'full', 'view', 'edit', 'admin', or NULL
- `share_id`: The UUID of the share record or NULL

### get_user_shared_surveys(user_id uuid)

Returns all surveys shared with a specific user.

**Returns:**
- Array of survey records with permission level 