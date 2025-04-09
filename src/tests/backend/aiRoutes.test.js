const request = require('supertest');
const express = require('express');
const aiRoutes = require('../../backend/routes/aiRoutes');
const { optimizeSurvey, analyzeSurvey } = require('../../backend/controllers/aiController');

// Mock middleware and controller functions
jest.mock('../../backend/middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }
}));

jest.mock('../../backend/middleware/asyncHandler', () => 
  (fn) => (req, res, next) => fn(req, res, next)
);

jest.mock('../../backend/controllers/aiController', () => ({
  generateSurveyQuestions: jest.fn(),
  generateSurvey: jest.fn(),
  analyzeSurveyResponses: jest.fn(),
  optimizeSurvey: jest.fn(),
  analyzeSurvey: jest.fn()
}));

describe('AI Routes Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/ai/optimize-survey', () => {
    it('should call optimizeSurvey controller', async () => {
      // Setup mock implementation
      optimizeSurvey.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          questions: [
            { id: 'q1', question: 'Enhanced question' }
          ]
        });
      });

      // Test data
      const testData = {
        prompt: 'Enhance my survey',
        context: {
          title: 'Test Survey',
          questions: []
        },
        surveyId: 'test-survey-id'
      };

      // Make request
      const response = await request(app)
        .post('/api/ai/optimize-survey')
        .send(testData);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(optimizeSurvey).toHaveBeenCalledTimes(1);
      expect(response.body.questions).toBeInstanceOf(Array);
    });

    it('should handle errors from optimizeSurvey controller', async () => {
      // Setup mock implementation with error
      optimizeSurvey.mockImplementation((req, res, next) => {
        const error = new Error('Test error');
        error.statusCode = 400;
        next(error);
      });

      // Add error handling middleware for test
      app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
          message: err.message
        });
      });

      // Test data
      const testData = {
        prompt: 'Enhance my survey',
        context: {},
        surveyId: 'test-survey-id'
      };

      // Make request
      const response = await request(app)
        .post('/api/ai/optimize-survey')
        .send(testData);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Test error');
      expect(optimizeSurvey).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/ai/analyze-survey', () => {
    it('should call analyzeSurvey controller', async () => {
      // Setup mock implementation
      analyzeSurvey.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          summary: 'Test summary',
          designInsights: [
            { title: 'Good insight', content: 'Test content', type: 'insight' }
          ],
          improvementSuggestions: [
            { title: 'Good suggestion', content: 'Test content', type: 'tip' }
          ],
          nextSteps: ['Step 1', 'Step 2']
        });
      });

      // Test data
      const testData = {
        surveyId: 'test-survey-id',
        includeResponses: false
      };

      // Make request
      const response = await request(app)
        .post('/api/ai/analyze-survey')
        .send(testData);

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(analyzeSurvey).toHaveBeenCalledTimes(1);
      expect(response.body.summary).toBe('Test summary');
      expect(response.body.designInsights).toBeInstanceOf(Array);
      expect(response.body.improvementSuggestions).toBeInstanceOf(Array);
      expect(response.body.nextSteps).toBeInstanceOf(Array);
    });

    it('should handle errors from analyzeSurvey controller', async () => {
      // Setup mock implementation with error
      analyzeSurvey.mockImplementation((req, res, next) => {
        const error = new Error('Test error');
        error.statusCode = 400;
        next(error);
      });

      // Add error handling middleware for test
      app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
          message: err.message
        });
      });

      // Test data
      const testData = {
        surveyId: 'test-survey-id'
      };

      // Make request
      const response = await request(app)
        .post('/api/ai/analyze-survey')
        .send(testData);

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Test error');
      expect(analyzeSurvey).toHaveBeenCalledTimes(1);
    });
  });
}); 