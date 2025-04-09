const request = require('supertest');
const express = require('express');

// Get the app without calling listen() (which happens in the require)
const app = require('../../src/index');

// Prevent app from starting a server during tests
jest.mock('../../src/index', () => {
  const originalModule = jest.requireActual('../../src/index');
  // Don't call listen, just export the app
  const app = originalModule;
  return app;
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    data: [
      {
        id: '1',
        surveyId: '1',
        answers: [
          {
            questionId: '1',
            value: 4,
            type: 'rating'
          }
        ],
        respondentEmail: 'test@example.com',
        submittedAt: new Date().toISOString()
      }
    ],
    error: null,
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  })
}));

describe('Response Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
    });
  });

  describe('GET /', () => {
    it('should return all responses', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter responses by surveyId', async () => {
      const response = await request(app).get('/?surveyId=1');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(item => {
        expect(item.surveyId).toBe('1');
      });
    });
  });

  describe('GET /:id', () => {
    it('should return a response by id', async () => {
      const response = await request(app).get('/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });

    it('should return 404 for non-existent response', async () => {
      const response = await request(app).get('/999');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /', () => {
    it('should submit a new response', async () => {
      const newResponse = {
        surveyId: '1',
        responses: [
          {
            questionId: '1',
            value: 5,
            type: 'rating'
          }
        ],
        respondentId: 'user-test'
      };
      
      const response = await request(app)
        .post('/')
        .send(newResponse);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/')
        .send({});
      
      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /stats/:surveyId', () => {
    it('should return survey response statistics', async () => {
      const response = await request(app).get('/stats/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalResponses');
      expect(response.body).toHaveProperty('responseDistribution');
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app).get('/stats/999');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a response', async () => {
      const response = await request(app).delete('/1');
      expect(response.statusCode).toBe(204);
    });
  });
}); 