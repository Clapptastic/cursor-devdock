# Customer Survey Application

An AI-powered interview and survey generation system that creates customized survey questions based on business context and target audience.

## Project Structure

```
customer-survey/
├── src/
│   ├── frontend/          # Frontend components
│   ├── backend/           # Backend API and server
│   ├── ai/                # AI services and models
│   ├── database/          # Database migrations and seeds
│   ├── shared/            # Shared utilities
│   └── tests/             # Test files
├── scripts/               # Development and utility scripts
└── ...
```

## Prerequisites

- Node.js (v16+)
- MongoDB
- Anthropic API key (for Claude AI integration)
- OpenAI API key (optional)

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd customer-survey
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file to add your API keys and other configuration.

## Development

Start the development server:

```
npm run dev
```

This will start the backend server at http://localhost:3000.

## Testing

Run the tests:

```
npm test
```

Run linting:

```
npm run lint
```

## API Endpoints

- `GET /`: Welcome message
- `GET /health`: Health check endpoint

More endpoints will be documented as they are developed.

## License

MIT 