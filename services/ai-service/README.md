# Customer Survey AI Service

The AI Service provides intelligent features for the Customer Survey application, including survey question generation, response analysis, and business insights.

## Features

- **Question Generation**: Create tailored survey questions based on industry, business stage, and customer segment
- **Question Enhancement**: Improve existing questions with AI suggestions
- **Translation**: Translate survey questions to different languages
- **Response Analysis**: Analyze survey responses to identify patterns and sentiment
- **Theme Extraction**: Identify common themes from open-ended responses
- **Business Insights**: Generate actionable business insights and recommendations

## Setup and Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the AI service directory:

```bash
cd services/ai-service
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Customize the environment variables in the `.env` file.

### Running the Service

In development mode:

```bash
npm run dev
```

In production mode:

```bash
npm start
```

## API Documentation

When the service is running, API documentation is available at:

```
http://localhost:3006/api-docs
```

The documentation provides details on all available endpoints, request formats, and response schemas.

## Docker Support

The service includes Docker support:

```bash
# Build the container
docker build -t customer-survey-ai-service .

# Run the container
docker run -p 3006:3006 --env-file .env customer-survey-ai-service
```

## Architecture

The AI service is designed as a microservice that interacts with other components of the Customer Survey application:

- Communicates with external AI models for natural language processing
- Retrieves response data from the Response Service when needed
- Provides AI-generated content to the Template Service
- Sends analysis results to the Analysis Service

## Testing

The AI service includes a comprehensive test suite to ensure functionality, reliability, and accuracy:

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage reporting
npm test -- --coverage

# Run a specific test file
npm test -- tests/unit/ai.test.js
```

### Test Categories

The test suite is organized into the following categories:

1. **API Endpoint Tests**: Verify HTTP endpoints and request/response handling
   - `/analyze/text`: Text analysis and sentiment extraction
   - `/insights`: Response analysis and insight generation
   - `/recommend/survey`: Survey design recommendations

2. **Core Service Tests**: Verify internal business logic functions
   - `generateQuestions`: Question generation based on industry and topic
   - `improveQuestion`: AI-powered question enhancement
   - `translateSurvey`: Survey translation functionality
   - `analyzeResponses`: Response analysis and pattern detection
   - `extractThemes`: Theme identification from text responses
   - `generateInsights`: Business insight generation

3. **NLP Component Tests**: Verify natural language processing capabilities
   - `extractKeyPhrases`: Key phrase identification
   - `analyzeSentiment`: Sentiment analysis
   - `classifyText`: Text classification

4. **ML Component Tests**: Verify machine learning functionality
   - `generateInsights`: Insight generation from response data
   - `recommendSurveyChanges`: Survey improvement recommendations
   - `predictCustomerBehavior`: Customer behavior predictions

5. **Edge Case Tests**: Verify handling of boundary conditions
   - Empty inputs and missing data
   - Extremely long inputs
   - Malformed data structures

For more details on testing, see the [Platform Testing Documentation](../tests/README.md).

## Contributing

Please follow the code style guidelines and submit unit tests with any code changes.

## License

This project is proprietary software. 