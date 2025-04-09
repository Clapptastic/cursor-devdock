const request = require('supertest');
const express = require('express');
const nock = require('nock');

// Set environment variables for testing
process.env.SURVEY_SERVICE_URL = 'http://localhost:3001';
process.env.RESPONSE_SERVICE_URL = 'http://localhost:3002';
process.env.AI_SERVICE_URL = 'http://localhost:3003';

// Mock authentication middleware
jest.mock('../../src/middleware/authMiddleware', () => {
  return jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id', role: 'user' };
    next();
  });
}, { virtual: true });

// Get the app without calling listen() (which happens in the require)
const app = require('../../src/index');

// Prevent app from starting a server during tests
jest.mock('../../src/index', () => {
  const originalModule = jest.requireActual('../../src/index');
  // Don't call listen, just export the app
  const app = originalModule;
  return app;
});

// Mock service endpoints
const SURVEY_SERVICE_URL = process.env.SURVEY_SERVICE_URL;
const RESPONSE_SERVICE_URL = process.env.RESPONSE_SERVICE_URL;

describe('API Gateway Service', () => {
  beforeEach(() => {
    // Clear all nock interceptors
    nock.cleanAll();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
    });
  });

  describe('Surveys API', () => {
    it('should proxy GET /surveys to survey service', async () => {
      // Mock the survey service response
      nock(SURVEY_SERVICE_URL)
        .get('/')
        .reply(200, [
          { id: '1', title: 'Customer Satisfaction Survey' },
          { id: '2', title: 'Product Feedback Survey' }
        ]);

      const response = await request(app).get('/api/surveys');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should proxy GET /surveys/:id to survey service', async () => {
      // Mock the survey service response
      nock(SURVEY_SERVICE_URL)
        .get('/1')
        .reply(200, { 
          id: '1', 
          title: 'Customer Satisfaction Survey',
          questions: [
            { id: '1', text: 'How would you rate our service?', type: 'rating' }
          ]
        });

      const response = await request(app).get('/api/surveys/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });

    it('should proxy POST /surveys to survey service', async () => {
      const newSurvey = {
        title: 'New Survey',
        questions: [
          { text: 'How would you rate our service?', type: 'rating' }
        ]
      };

      // Mock the survey service response allowing any body
      nock(SURVEY_SERVICE_URL)
        .post('/', () => true)  // Accept any request body
        .reply(201, { id: '3', ...newSurvey });

      const response = await request(app)
        .post('/api/surveys')
        .send(newSurvey);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id', '3');
    });
  });

  describe('Responses API', () => {
    it('should proxy GET /responses to response service', async () => {
      // Mock the response service
      nock(RESPONSE_SERVICE_URL)
        .get('/')
        .reply(200, [
          { id: '1', surveyId: '1', answers: [] },
          { id: '2', surveyId: '1', answers: [] }
        ]);

      const response = await request(app).get('/api/responses');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should proxy POST /responses to response service', async () => {
      const newResponse = {
        surveyId: '1',
        answers: [
          { questionId: '1', value: 5, type: 'rating' }
        ],
        respondentEmail: 'test@example.com'
      };

      // Mock the response service allowing any body
      nock(RESPONSE_SERVICE_URL)
        .post('/', () => true)  // Accept any request body
        .reply(201, { id: '3', ...newResponse });

      const response = await request(app)
        .post('/api/responses')
        .send(newResponse);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id', '3');
    });

    it('should proxy GET /responses/stats/:surveyId to response service', async () => {
      // Mock the response service
      nock(RESPONSE_SERVICE_URL)
        .get('/stats/1')
        .reply(200, {
          totalResponses: 2,
          questionStats: {
            '1': {
              average: 4.5,
              distribution: { '4': 1, '5': 1 }
            }
          }
        });

      const response = await request(app).get('/api/responses/stats/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalResponses', 2);
      expect(response.body).toHaveProperty('questionStats');
    });
  });

  describe('Public API', () => {
    it('should proxy GET /public/survey/:id to survey service', async () => {
      // Mock the survey service response
      nock(SURVEY_SERVICE_URL)
        .get('/public/survey/1')
        .reply(200, { 
          id: '1', 
          title: 'Customer Satisfaction Survey',
          questions: [
            { id: '1', text: 'How would you rate our service?', type: 'rating' }
          ]
        });

      const response = await request(app).get('/public/survey/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors for undefined routes', async () => {
      const response = await request(app).get('/undefined-route');
      expect(response.statusCode).toBe(404);
    });

    it('should handle service unavailability', async () => {
      // Mock the survey service to be unavailable
      nock(SURVEY_SERVICE_URL)
        .get('/')
        .replyWithError('Service unavailable');

      const response = await request(app).get('/api/surveys');
      expect(response.statusCode).toBe(502);
    });
  });
}); 