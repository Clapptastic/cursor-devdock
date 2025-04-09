/**
 * Response Service
 * 
 * Handles survey response collection, storage, and retrieval.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'response-service' });
});

// Mock survey responses data for development
const mockResponses = [
  {
    id: '1',
    surveyId: '1',
    respondentId: 'user-123',
    responses: [
      { questionId: '1', value: 4 },
      { questionId: '2', value: 'Your service was excellent, but your product could be improved.' },
      { questionId: '3', value: true }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    surveyId: '1',
    respondentId: 'user-456',
    responses: [
      { questionId: '1', value: 5 },
      { questionId: '2', value: 'Everything was perfect!' },
      { questionId: '3', value: true }
    ],
    createdAt: new Date().toISOString()
  }
];

// API Routes
// Get all responses
app.get('/', (req, res) => {
  // Check if filtering by surveyId
  const { surveyId } = req.query;
  
  if (surveyId) {
    const filteredResponses = mockResponses.filter(r => r.surveyId === surveyId);
    return res.status(200).json(filteredResponses);
  }
  
  res.status(200).json(mockResponses);
});

// Get response by ID
app.get('/:id', (req, res) => {
  const response = mockResponses.find(r => r.id === req.params.id);
  
  if (!response) {
    return res.status(404).json({ error: 'Response not found' });
  }
  
  res.status(200).json(response);
});

// Submit a new response
app.post('/', (req, res) => {
  const { surveyId, respondentId, responses } = req.body;
  
  if (!surveyId || !responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Invalid response data. SurveyId and responses are required.' });
  }
  
  const newResponse = {
    id: uuidv4(),
    surveyId,
    respondentId: respondentId || 'anonymous',
    responses,
    createdAt: new Date().toISOString()
  };
  
  mockResponses.push(newResponse);
  
  res.status(201).json(newResponse);
});

// Get response statistics for a survey
app.get('/stats/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  const responses = mockResponses.filter(r => r.surveyId === surveyId);
  
  if (responses.length === 0) {
    return res.status(404).json({ error: 'No responses found for this survey' });
  }
  
  // Generate basic statistics
  const stats = {
    surveyId,
    totalResponses: responses.length,
    averageRatings: {},
    responseDistribution: {},
    lastResponseDate: responses.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0].createdAt
  };
  
  // Calculate statistics by question type
  responses.forEach(response => {
    response.responses.forEach(answer => {
      // Handle rating questions
      if (typeof answer.value === 'number') {
        if (!stats.averageRatings[answer.questionId]) {
          stats.averageRatings[answer.questionId] = {
            sum: 0,
            count: 0
          };
        }
        stats.averageRatings[answer.questionId].sum += answer.value;
        stats.averageRatings[answer.questionId].count += 1;
      }
      
      // Handle distribution for all answer types
      if (!stats.responseDistribution[answer.questionId]) {
        stats.responseDistribution[answer.questionId] = {};
      }
      
      const value = String(answer.value);
      
      if (!stats.responseDistribution[answer.questionId][value]) {
        stats.responseDistribution[answer.questionId][value] = 0;
      }
      
      stats.responseDistribution[answer.questionId][value] += 1;
    });
  });
  
  // Calculate averages
  for (const questionId in stats.averageRatings) {
    const { sum, count } = stats.averageRatings[questionId];
    stats.averageRatings[questionId] = parseFloat((sum / count).toFixed(2));
  }
  
  res.status(200).json(stats);
});

// Delete a response
app.delete('/:id', (req, res) => {
  const responseIndex = mockResponses.findIndex(r => r.id === req.params.id);
  
  if (responseIndex === -1) {
    return res.status(404).json({ error: 'Response not found' });
  }
  
  mockResponses.splice(responseIndex, 1);
  
  res.status(204).send();
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Response Service is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for testing
module.exports = app; 