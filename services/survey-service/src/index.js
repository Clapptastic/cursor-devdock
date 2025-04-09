/**
 * Survey Service
 * 
 * Handles survey creation, retrieval, and management.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'survey-service' });
});

// Mock survey data for development
const mockSurveys = [
  {
    id: '1',
    title: 'Customer Satisfaction Survey',
    description: 'Help us improve our services by providing your feedback.',
    questions: [
      { id: '1', text: 'How would you rate our service?', type: 'rating', required: true },
      { id: '2', text: 'What aspects could we improve upon?', type: 'text', required: false },
      { id: '3', text: 'Would you recommend us to a friend?', type: 'boolean', required: true }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Product Feedback Survey',
    description: 'Your thoughts on our latest product release.',
    questions: [
      { id: '1', text: 'How easy was the product to use?', type: 'rating', required: true },
      { id: '2', text: 'What features would you like to see in the future?', type: 'text', required: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// API Routes
// Get all surveys
app.get('/', (req, res) => {
  res.status(200).json(mockSurveys);
});

// Get survey by ID
app.get('/:id', (req, res) => {
  const survey = mockSurveys.find(s => s.id === req.params.id);
  
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  
  res.status(200).json(survey);
});

// Create a new survey
app.post('/', (req, res) => {
  const { title, description, questions } = req.body;
  
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Invalid survey data. Title and at least one question are required.' });
  }
  
  const newSurvey = {
    id: (mockSurveys.length + 1).toString(),
    title,
    description,
    questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockSurveys.push(newSurvey);
  
  res.status(201).json(newSurvey);
});

// Update survey
app.put('/:id', (req, res) => {
  const surveyIndex = mockSurveys.findIndex(s => s.id === req.params.id);
  
  if (surveyIndex === -1) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  
  const { title, description, questions } = req.body;
  
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Invalid survey data. Title and at least one question are required.' });
  }
  
  mockSurveys[surveyIndex] = {
    ...mockSurveys[surveyIndex],
    title,
    description,
    questions,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json(mockSurveys[surveyIndex]);
});

// Delete survey
app.delete('/:id', (req, res) => {
  const surveyIndex = mockSurveys.findIndex(s => s.id === req.params.id);
  
  if (surveyIndex === -1) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  
  mockSurveys.splice(surveyIndex, 1);
  
  res.status(204).send();
});

// Public survey endpoint for sharing
app.get('/public/survey/:id', (req, res) => {
  const survey = mockSurveys.find(s => s.id === req.params.id);
  
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }
  
  // Return a version suitable for public sharing (exclude sensitive data)
  const publicSurvey = {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questions: survey.questions
  };
  
  res.status(200).json(publicSurvey);
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Survey Service is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for testing
module.exports = app; 