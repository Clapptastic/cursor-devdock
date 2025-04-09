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
        title: 'Customer Satisfaction Survey',
        description: 'Help us improve our service',
        questions: [
          {
            id: '1',
            text: 'How satisfied are you with our product?',
            type: 'rating',
            required: true,
            options: { min: 1, max: 5 }
          }
        ],
        createdAt: new Date().toISOString(),
        active: true
      }
    ],
    error: null,
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  })
}));

describe('Survey Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
    });
  });

  describe('GET /', () => {
    it('should return all surveys', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /:id', () => {
    it('should return a survey by id', async () => {
      const response = await request(app).get('/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app).get('/999');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /', () => {
    it('should create a new survey', async () => {
      const newSurvey = {
        title: 'New Survey',
        description: 'A test survey',
        questions: [
          {
            text: 'Test question',
            type: 'text',
            required: true
          }
        ]
      };
      
      const response = await request(app)
        .post('/')
        .send(newSurvey);
      
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

  describe('PUT /:id', () => {
    it('should update an existing survey', async () => {
      const updatedSurvey = {
        title: 'Updated Survey',
        description: 'Updated description',
        questions: [
          {
            text: 'Updated question',
            type: 'text',
            required: true
          }
        ]
      };
      
      const response = await request(app)
        .put('/1')
        .send(updatedSurvey);
      
      expect(response.statusCode).toBe(200);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a survey', async () => {
      const response = await request(app).delete('/1');
      expect(response.statusCode).toBe(204);
    });
  });
}); 