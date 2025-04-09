# Customer Survey SDK

A TypeScript SDK for integrating with the Customer Survey Platform API.

## Installation

```bash
# Install from npm
npm install customer-survey-sdk

# Install from local tarball
npm install customer-survey-sdk-1.0.0.tgz
```

## Configuration

Initialize the SDK with your API configuration:

```typescript
import { CustomerSurveySDK } from 'customer-survey-sdk';

const sdk = new CustomerSurveySDK({
  apiUrl: 'https://api.customer-survey.com', // Your API base URL
  token: 'your-jwt-token', // Optional: JWT token for authentication
  apiKey: 'your-api-key', // Optional: API Key for authentication
  timeout: 30000, // Optional: Request timeout in milliseconds (default: 30000)
  debug: false // Optional: Enable debug logging (default: false)
});
```

## Authentication

You can authenticate with either a JWT token or an API key:

```typescript
// Set JWT token
sdk.setAuthToken('your-jwt-token');

// Clear JWT token
sdk.clearAuthToken();

// Set API key
sdk.setApiKey('your-api-key');
```

## Usage

The SDK provides access to all Customer Survey Platform services:

### Survey Service

Create and manage surveys:

```typescript
// Get all surveys
const { data: surveys } = await sdk.survey.getSurveys();

// Get survey by ID
const { data: survey } = await sdk.survey.getSurvey('survey-id');

// Create a new survey
const newSurvey = {
  title: 'Customer Feedback',
  description: 'Help us improve our product',
  questions: [
    {
      id: '1',
      text: 'How would you rate our service?',
      type: 'rating',
      required: true
    }
  ]
};
const { data: createdSurvey } = await sdk.survey.createSurvey(newSurvey);

// Update a survey
await sdk.survey.updateSurvey('survey-id', { title: 'Updated Title' });

// Delete a survey
await sdk.survey.deleteSurvey('survey-id');

// Get a public survey (no authentication required)
const { data: publicSurvey } = await sdk.survey.getPublicSurvey('survey-id');

// Publish a survey
await sdk.survey.publishSurvey('survey-id');

// Clone a survey
const { data: clonedSurvey } = await sdk.survey.cloneSurvey('survey-id', 'New Clone Title');
```

### Response Service

Manage survey responses:

```typescript
// Get all responses
const { data: responses } = await sdk.response.getResponses();

// Get responses for a specific survey
const { data: surveyResponses } = await sdk.response.getResponses('survey-id');

// Get a specific response
const { data: response } = await sdk.response.getResponse('response-id');

// Submit a new response
const newResponse = {
  surveyId: 'survey-id',
  answers: [
    {
      questionId: '1',
      value: 5,
      type: 'rating'
    }
  ]
};
const { data: submittedResponse } = await sdk.response.submitResponse(newResponse);

// Delete a response
await sdk.response.deleteResponse('response-id');

// Get response statistics
const { data: stats } = await sdk.response.getStatistics('survey-id');

// Export responses
const { data: csvData } = await sdk.response.exportResponses('survey-id', 'csv');
```

### AI Service

Leverage AI capabilities:

```typescript
// Analyze text
const { data: analysis } = await sdk.ai.analyzeText('Your product is amazing!');

// Get insights from responses
const { data: insights } = await sdk.ai.getInsights(responses);

// Get survey recommendations
const { data: recommendation } = await sdk.ai.getSurveyRecommendations(
  'customer_satisfaction',
  'software',
  'enterprise'
);

// Generate a report
const { data: report } = await sdk.ai.generateReport('survey-id', 'pdf');

// Generate follow-up questions
const followUpQuestions = await sdk.ai.generateFollowUpQuestions('response-id');
```

## Error Handling

The SDK provides a consistent error format:

```typescript
try {
  const survey = await sdk.survey.getSurvey('invalid-id');
} catch (error) {
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('HTTP status:', error.status);
  console.error('Details:', error.details);
}
```

## Debugging

Enable debug mode to see detailed logs:

```typescript
// Enable debug logging
sdk.setDebugMode(true);

// Disable debug logging
sdk.setDebugMode(false);
```

## TypeScript Support

This SDK includes TypeScript definitions for all API requests and responses.

## License

MIT 