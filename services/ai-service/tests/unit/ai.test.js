const request = require('supertest');
const app = require('../../src/index');

// Prevent app from starting a server during tests
jest.mock('../../src/index', () => {
  const originalModule = jest.requireActual('../../src/index');
  // Don't call listen, just export the app
  const app = originalModule;
  return app;
});

// Mock NLP and ML services
jest.mock('../../src/services/nlpService', () => ({
  analyzeSentiment: jest.fn().mockResolvedValue({
    sentiment: 'positive',
    score: 0.85,
    keyPhrases: ['great product', 'excellent service']
  }),
  extractKeyPhrases: jest.fn().mockResolvedValue(['easy to use', 'helpful support']),
  classifyText: jest.fn().mockResolvedValue(['feedback', 'product'])
}));

jest.mock('../../src/services/mlService', () => ({
  generateInsights: jest.fn().mockResolvedValue({
    overallSentiment: 'positive',
    trends: ['increasing satisfaction', 'positive onboarding experience'],
    recommendations: ['focus on UI improvements', 'expand documentation']
  }),
  recommendSurveyChanges: jest.fn().mockResolvedValue({
    suggestedQuestions: [
      { text: 'How easy was the onboarding process?', type: 'rating' },
      { text: 'What features would you like to see added?', type: 'text' }
    ],
    suggestedRemovals: [],
    suggestedGrouping: ['user experience', 'features', 'support']
  })
}));

describe('AI Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
      expect(response.body).toHaveProperty('service', 'ai-service');
    });
  });

  describe('POST /analyze/text', () => {
    it('should analyze text and return sentiment', async () => {
      const testData = {
        text: 'This product is excellent and easy to use. The support team was very helpful.'
      };
      
      const response = await request(app)
        .post('/analyze/text')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('keyPhrases');
      expect(response.body).toHaveProperty('wordCount');
      expect(response.body).toHaveProperty('analysisTimestamp');
      expect(typeof response.body.wordCount).toBe('number');
      expect(response.body.sentiment).toHaveProperty('score');
      expect(response.body.sentiment).toHaveProperty('label');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Text input is required');
    });

    it('should handle empty text input', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: '' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.sentiment.score).toBe(0);
      expect(response.body.sentiment.label).toBe('neutral');
      expect(response.body.keyPhrases).toEqual([]);
      expect(response.body.wordCount).toBe(0);
    });

    it('should handle text with negative sentiment', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 'This product is terrible and difficult to use. I hate the interface.' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.sentiment.label).toBe('negative');
      expect(response.body.sentiment.score).toBeLessThan(0);
    });

    it('should handle text with neutral sentiment', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 'This is a product that exists. It has some features.' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.sentiment.label).toBe('neutral');
      expect(response.body.sentiment.score).toBeGreaterThanOrEqual(-0.3);
      expect(response.body.sentiment.score).toBeLessThanOrEqual(0.3);
    });

    it('should handle single word text input', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 'Good' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.wordCount).toBe(1);
      expect(response.body.sentiment.label).toBe('positive');
    });

    it('should handle extremely long text input', async () => {
      // Create a long string of 5000 characters
      const longText = 'This is a test. '.repeat(500);
      
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: longText });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.wordCount).toBeGreaterThan(1000);
    });

    it('should handle invalid data types for text input', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 12345 }); // Invalid data type
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Text input must be a string');
    });
  });

  describe('POST /insights', () => {
    it('should generate insights from survey responses', async () => {
      const testData = {
        responses: [
          {
            responses: [
              {
                value: 'The product is great but could use more features',
                type: 'text'
              },
              {
                value: 4,
                type: 'rating'
              }
            ]
          },
          {
            responses: [
              {
                value: 'Support team was excellent and responsive',
                type: 'text'
              },
              {
                value: 5,
                type: 'rating'
              }
            ]
          }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalResponses');
      expect(response.body).toHaveProperty('responseAnalysis');
      expect(response.body).toHaveProperty('improvement');
      expect(response.body.responseAnalysis).toHaveProperty('averageSentiment');
      expect(response.body.responseAnalysis).toHaveProperty('commonTopics');
      expect(response.body.responseAnalysis).toHaveProperty('keyTakeaways');
      expect(response.body.improvement).toHaveProperty('areas');
      expect(response.body.improvement).toHaveProperty('suggestions');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/insights')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty responses array', async () => {
      const response = await request(app)
        .post('/insights')
        .send({ responses: [] });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('Valid responses array is required');
    });

    it('should handle responses with only ratings (no text)', async () => {
      const testData = {
        responses: [
          {
            responses: [
              {
                questionId: 'q1',
                value: 2,
                type: 'rating'
              }
            ]
          },
          {
            responses: [
              {
                questionId: 'q1',
                value: 2,
                type: 'rating'
              }
            ]
          }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('improvement');
      expect(response.body.improvement.areas.length).toBeGreaterThan(0);
      expect(response.body.improvement.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle responses with only text (no ratings)', async () => {
      const testData = {
        responses: [
          {
            responses: [
              {
                value: 'The product is great but could use more features',
                type: 'text'
              }
            ]
          },
          {
            responses: [
              {
                value: 'Support team was excellent and responsive',
                type: 'text'
              }
            ]
          }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('responseAnalysis');
      expect(response.body.responseAnalysis.commonTopics.length).toBeGreaterThan(0);
      expect(response.body.responseAnalysis.keyTakeaways.length).toBeGreaterThan(0);
    });

    it('should handle negative sentiment in responses', async () => {
      const testData = {
        responses: [
          {
            responses: [
              {
                value: 'This product is terrible. I hate using it.',
                type: 'text'
              }
            ]
          },
          {
            responses: [
              {
                value: 'The worst experience I have ever had. Horrible interface.',
                type: 'text'
              }
            ]
          }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.responseAnalysis.averageSentiment).toBeLessThan(0);
      expect(response.body.responseAnalysis.keyTakeaways).toContain(
        "Overall negative sentiment detected in responses"
      );
    });

    it('should handle neutral sentiment in responses', async () => {
      const testData = {
        responses: [
          {
            responses: [
              {
                value: 'The product works as expected.',
                type: 'text'
              }
            ]
          },
          {
            responses: [
              {
                value: 'It has some features that are useful.',
                type: 'text'
              }
            ]
          }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.responseAnalysis.keyTakeaways).toContain(
        "Mixed or neutral sentiment detected in responses"
      );
    });

    it('should handle responses with invalid or malformed structure', async () => {
      const testData = {
        responses: [
          { foo: 'bar' }, // Invalid structure
          { responses: 'not an array' } // Invalid responses field
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.totalResponses).toBe(2);
      // Even with invalid structures, the service should still return a valid response
      expect(response.body).toHaveProperty('responseAnalysis');
      expect(response.body).toHaveProperty('improvement');
    });

    it('should handle responses with mixed valid and invalid data', async () => {
      const testData = {
        responses: [
          {
            responses: [
              {
                value: 'Good product',
                type: 'text'
              }
            ]
          },
          { responses: null }, // Invalid
          {} // Missing responses field
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.totalResponses).toBe(3);
    });
  });

  describe('POST /recommend/survey', () => {
    it('should recommend survey improvements', async () => {
      const testData = {
        industry: 'Technology',
        target: 'Enterprise',
        goals: ['customer_satisfaction', 'product_feedback']
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('surveyTitle');
      expect(response.body).toHaveProperty('estimatedCompletionTime');
      expect(response.body).toHaveProperty('recommendedQuestions');
      expect(response.body).toHaveProperty('bestPractices');
      expect(Array.isArray(response.body.recommendedQuestions)).toBe(true);
      expect(Array.isArray(response.body.bestPractices)).toBe(true);
      expect(response.body.recommendedQuestions.length).toBeGreaterThan(0);
      expect(response.body.bestPractices.length).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/recommend/survey')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate missing industry field', async () => {
      const response = await request(app)
        .post('/recommend/survey')
        .send({
          target: 'Enterprise',
          goals: ['customer_satisfaction']
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should validate missing target field', async () => {
      const response = await request(app)
        .post('/recommend/survey')
        .send({
          industry: 'Technology',
          goals: ['customer_satisfaction']
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should validate missing goals field', async () => {
      const response = await request(app)
        .post('/recommend/survey')
        .send({
          industry: 'Technology',
          target: 'Enterprise'
        });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should handle customer_satisfaction goal only', async () => {
      const testData = {
        industry: 'Healthcare',
        target: 'Patients',
        goals: ['customer_satisfaction']
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.recommendedQuestions.some(q => 
        q.text.includes('satisfaction')
      )).toBe(true);
    });

    it('should handle product_feedback goal only', async () => {
      const testData = {
        industry: 'Retail',
        target: 'Shoppers',
        goals: ['product_feedback']
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.recommendedQuestions.some(q => 
        q.text.includes('features')
      )).toBe(true);
    });

    it('should handle empty goals array', async () => {
      const testData = {
        industry: 'Education',
        target: 'Students',
        goals: []
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should handle unsupported industry', async () => {
      const testData = {
        industry: 'NonExistentIndustry',
        target: 'Customers',
        goals: ['customer_satisfaction']
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      // Should still return valid recommendations even for unknown industry
      expect(response.body).toHaveProperty('recommendedQuestions');
      expect(response.body.surveyTitle).toContain('NonExistentIndustry');
    });

    it('should handle unsupported goals', async () => {
      const testData = {
        industry: 'Finance',
        target: 'Investors',
        goals: ['unsupported_goal']
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      // Should still return basic recommendations without goal-specific questions
      expect(response.body).toHaveProperty('recommendedQuestions');
      expect(response.body.recommendedQuestions.length).toBe(5); // Only the base questions
    });
  });

  // New tests for any undocumented or edge case routes
  describe('Error handling', () => {
    it('should handle undefined routes', async () => {
      const response = await request(app).get('/non-existent-endpoint');
      expect(response.statusCode).toBe(404);
    });

    it('should handle method not allowed', async () => {
      const response = await request(app).get('/analyze/text');
      expect(response.statusCode).toBe(404);
    });
  });

  describe('Large payload handling', () => {
    it('should handle large response dataset', async () => {
      // Create a large dataset with 100 responses
      const largeData = {
        responses: Array(100).fill().map((_, i) => ({
          responses: [
            {
              questionId: `q${i % 5}`,
              value: i % 2 === 0 ? 'This is a sample text response.' : i % 5,
              type: i % 2 === 0 ? 'text' : 'rating'
            }
          ]
        }))
      };
      
      const response = await request(app)
        .post('/insights')
        .send(largeData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.totalResponses).toBe(100);
    });
  });
}); 