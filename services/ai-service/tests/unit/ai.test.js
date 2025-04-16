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
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('service', 'ai-service');
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
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('sentiment');
      expect(response.body.data).toHaveProperty('keyPhrases');
      expect(response.body.data).toHaveProperty('wordCount');
      expect(response.body.data).toHaveProperty('analysisTimestamp');
      expect(typeof response.body.data.wordCount).toBe('number');
      expect(response.body.data.sentiment).toHaveProperty('score');
      expect(response.body.data.sentiment).toHaveProperty('label');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Text input is required');
    });

    it('should handle empty text input', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: '' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.sentiment.score).toBe(0);
      expect(response.body.data.sentiment.label).toBe('neutral');
      expect(response.body.data.keyPhrases).toEqual([]);
      expect(response.body.data.wordCount).toBe(0);
    });

    it('should handle text with negative sentiment', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 'This product is terrible and difficult to use. I hate the interface.' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.sentiment.label).toBe('negative');
      expect(response.body.data.sentiment.score).toBeLessThan(0);
    });

    it('should handle text with neutral sentiment', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 'This is a product that exists. It has some features.' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.sentiment.label).toBe('neutral');
      expect(response.body.data.sentiment.score).toBeGreaterThanOrEqual(-0.3);
      expect(response.body.data.sentiment.score).toBeLessThanOrEqual(0.3);
    });

    it('should handle single word text input', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 'Good' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.wordCount).toBe(1);
      expect(response.body.data.sentiment.label).toBe('positive');
    });

    it('should handle extremely long text input', async () => {
      // Create a long string of 5000 characters
      const longText = 'This is a test. '.repeat(500);
      
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: longText });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.wordCount).toBeGreaterThan(1000);
    });

    it('should handle invalid data types for text input', async () => {
      const response = await request(app)
        .post('/analyze/text')
        .send({ text: 12345 }); // Invalid data type
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Text input is required');
    });
  });

  describe('POST /insights', () => {
    it('should generate insights from survey responses', async () => {
      const testData = {
        responses: [
          {
            responses: [
              { value: 'The product is great but could use more features', type: 'text' },
              { value: 4, type: 'rating' }
            ]
          },
          {
            responses: [
              { value: 'Support team was excellent and responsive', type: 'text' },
              { value: 5, type: 'rating' }
            ]
          }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalResponses');
      expect(response.body.data).toHaveProperty('responseAnalysis');
      expect(response.body.data).toHaveProperty('improvement');
      expect(response.body.data.responseAnalysis).toHaveProperty('averageSentiment');
      expect(response.body.data.responseAnalysis).toHaveProperty('commonTopics');
      expect(response.body.data.responseAnalysis).toHaveProperty('keyTakeaways');
      expect(response.body.data.improvement).toHaveProperty('areas');
      expect(response.body.data.improvement).toHaveProperty('suggestions');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/insights')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Valid responses array is required');
    });

    it('should handle empty responses array', async () => {
      const response = await request(app)
        .post('/insights')
        .send({ responses: [] });
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Valid responses array is required');
    });

    it('should handle responses with only ratings (no text)', async () => {
      const testData = {
        responses: [
          { responses: [{ questionId: 'q1', value: 2, type: 'rating' }] },
          { responses: [{ questionId: 'q1', value: 2, type: 'rating' }] }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('improvement');
      expect(response.body.data.improvement.areas.length).toBeGreaterThan(0);
      expect(response.body.data.improvement.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle responses with only text (no ratings)', async () => {
      const testData = {
        responses: [
          { responses: [{ value: 'The product is great but could use more features', type: 'text' }] },
          { responses: [{ value: 'Support team was excellent and responsive', type: 'text' }] }
        ]
      };
      
      const response = await request(app)
        .post('/insights')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('responseAnalysis');
      expect(response.body.data.responseAnalysis.averageSentiment).toBeDefined();
      expect(response.body.data.responseAnalysis.commonTopics.length).toBeGreaterThan(0);
      expect(response.body.data.responseAnalysis.keyTakeaways.length).toBeGreaterThan(0);
    });

    it('should handle responses with negative text sentiment', async () => {
       const testData = {
         responses: [
           { responses: [{ value: 'This is bad', type: 'text' }] }
         ]
       };
       const response = await request(app).post('/insights').send(testData);
       expect(response.statusCode).toBe(200);
       expect(response.body.success).toBe(true);
       expect(response.body.data.responseAnalysis.averageSentiment).toBeLessThan(0);
       expect(response.body.data.responseAnalysis.keyTakeaways).toContain("Overall negative sentiment detected in responses");
    });
  });

  describe('POST /recommend/survey', () => {
    it('should recommend survey improvements', async () => {
      const testData = {
        industry: 'SaaS',
        target: 'SMB Customers',
        goals: ['customer_satisfaction', 'product_feedback']
      };
      
      const response = await request(app)
        .post('/recommend/survey')
        .send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('surveyTitle');
      expect(response.body.data).toHaveProperty('estimatedCompletionTime');
      expect(response.body.data).toHaveProperty('recommendedQuestions');
      expect(response.body.data).toHaveProperty('bestPractices');
      expect(response.body.data.surveyTitle).toContain('SaaS');
      expect(response.body.data.surveyTitle).toContain('SMB Customers');
      expect(Array.isArray(response.body.data.recommendedQuestions)).toBe(true);
      expect(response.body.data.recommendedQuestions.length).toBe(testData.goals.length);
      expect(Array.isArray(response.body.data.bestPractices)).toBe(true);
      expect(response.body.data.bestPractices.length).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/recommend/survey')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Missing required parameters');
    });

    it('should validate missing industry field', async () => {
      const testData = { target: 'Developers', goals: ['product_feedback'] };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameters');
    });

    it('should validate missing target field', async () => {
      const testData = { industry: 'Healthcare', goals: ['customer_satisfaction'] };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameters');
    });

    it('should validate missing goals field', async () => {
      const testData = { industry: 'Retail', target: 'Shoppers' };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameters');
    });

    it('should handle customer_satisfaction goal only', async () => {
      const testData = {
        industry: 'Finance',
        target: 'Clients',
        goals: ['customer_satisfaction']
      };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedQuestions.length).toBe(1);
      expect(response.body.data.recommendedQuestions[0].text).toBe('How satisfied are you?'); 
    });

    it('should handle product_feedback goal only', async () => {
      const testData = {
        industry: 'Gaming',
        target: 'Players',
        goals: ['product_feedback']
      };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedQuestions.length).toBe(1);
      expect(response.body.data.recommendedQuestions[0].text).toBe('What features needed?');
    });

    it('should handle empty goals array with default questions', async () => {
      const testData = { industry: 'Education', target: 'Students', goals: [] };
      const response = await request(app).post('/recommend/survey').send(testData);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedQuestions.length).toBe(5);
    });

    it('should handle unsupported industry', async () => {
      const testData = {
        industry: 'NonExistentIndustry',
        target: 'Anyone',
        goals: ['product_feedback']
      };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.surveyTitle).toContain('NonExistentIndustry');
      expect(response.body.data.recommendedQuestions.length).toBe(1);
    });

    it('should handle unsupported goals with default questions', async () => {
      const testData = {
        industry: 'Travel',
        target: 'Tourists',
        goals: ['unknown_goal', 'another_bad_goal']
      };
      const response = await request(app).post('/recommend/survey').send(testData);
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedQuestions.length).toBe(testData.goals.length);
      expect(response.body.data.recommendedQuestions[0].text).toBe('Default question');
    });
  });

  describe('POST /generate-questions', () => {
    it('should generate questions successfully', async () => {
      const response = await request(app).post('/generate-questions').send({
        industry: 'Tech', businessStage: 'Growth', customerSegment: 'Developers', topic: 'API Usage'
      });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('question_text');
    });
    it('should return 400 for missing parameters', async () => {
      const response = await request(app).post('/generate-questions').send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameters');
    });
  });

  describe('POST /improve-question', () => {
    it('should improve a question successfully', async () => {
      const response = await request(app).post('/improve-question').send({
        question: 'Do you like our product', context: 'UI'
      });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('original');
      expect(response.body.data).toHaveProperty('improved');
      expect(response.body.data).toHaveProperty('suggestions');
    });
    it('should return 400 for missing parameters', async () => {
      const response = await request(app).post('/improve-question').send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameter: question');
    });
  });

  describe('POST /translate-survey', () => {
      const questions = [{ id: 1, question_text: 'How satisfied are you?' }];
      it('should translate questions successfully', async () => {
          const response = await request(app).post('/translate-survey').send({ questions, targetLanguage: 'Spanish' });
          expect(response.statusCode).toBe(200);
          expect(response.body.success).toBe(true);
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBe(questions.length);
          expect(response.body.data[0]).toHaveProperty('original');
          expect(response.body.data[0]).toHaveProperty('translated');
          expect(response.body.data[0].translated).toContain('Cómo');
          expect(response.body).not.toHaveProperty('warning');
          expect(response.body.message).toContain('Successfully translated');
      });
      it('should return a warning for unsupported languages', async () => {
          const response = await request(app).post('/translate-survey').send({ questions, targetLanguage: 'Klingon' });
          expect(response.statusCode).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.message).toContain('warning: Klingon is not supported');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data[0].translated).toContain('Cómo');
      });
      it('should return 400 for missing parameters', async () => {
          const response = await request(app).post('/translate-survey').send({ questions });
          expect(response.statusCode).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.error.message).toBe('Missing required parameters: questions array and targetLanguage');
      });
  });

  describe('POST /analyze-responses', () => {
    it('should analyze responses successfully', async () => {
      const response = await request(app).post('/analyze-responses').send({ survey_id: 'valid-survey' });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('sentimentAnalysis');
      expect(response.body.data).toHaveProperty('responseDistribution');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('responses');
      expect(response.body).not.toHaveProperty('warning');
      expect(response.body.message).toContain('Survey responses analyzed successfully');
    });
    it('should analyze responses without including full responses', async () => {
        const response = await request(app).post('/analyze-responses').send({ survey_id: 'valid-survey', includeResponses: false });
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).not.toHaveProperty('responses');
    });
    it('should handle analysis with warning (e.g., empty survey)', async () => {
        const response = await request(app).post('/analyze-responses').send({ survey_id: 'empty-survey' });
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('warning', 'No responses');
        expect(response.body.message).toContain('No responses');
    });
    it('should return 400 for missing parameters', async () => {
      const response = await request(app).post('/analyze-responses').send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameter: survey_id');
    });
  });

  describe('POST /extract-themes', () => {
    it('should extract themes successfully', async () => {
      const response = await request(app).post('/extract-themes').send({ survey_id: 'valid-survey' });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('themes');
      expect(Array.isArray(response.body.data.themes)).toBe(true);
      expect(response.body.data).toHaveProperty('keyPhrases');
      expect(response.body.data).not.toHaveProperty('rawData');
      expect(response.body).not.toHaveProperty('warning');
      expect(response.body.message).toContain('Themes extracted successfully');
    });
    it('should extract themes including raw data when requested', async () => {
        const response = await request(app).post('/extract-themes').send({ survey_id: 'valid-survey', options: { includeRaw: true } });
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('rawData');
        expect(Array.isArray(response.body.data.rawData)).toBe(true);
    });
     it('should handle extraction with warning (e.g., insufficient data)', async () => {
        const response = await request(app).post('/extract-themes').send({ survey_id: 'empty-survey' });
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('warning', 'insufficient data');
        expect(response.body.data.themes.length).toBe(0);
        expect(response.body.message).toContain('insufficient data');
    });
    it('should return 400 for missing parameters', async () => {
      const response = await request(app).post('/extract-themes').send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameter: survey_id');
    });
  });

  describe('POST /generate-insights (API Endpoint)', () => {
    it('should generate insights successfully', async () => {
      const response = await request(app).post('/generate-insights').send({ survey_id: 'valid-survey' });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('keyMetrics');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('weaknesses');
      expect(response.body.data).toHaveProperty('opportunities');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('quantitativeAnalysis');
      expect(response.body.data).toHaveProperty('textualAnalysis');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('overallSentiment');
      expect(Array.isArray(response.body.data.insights)).toBe(true);
      expect(response.body.message).toContain('Insights generated successfully');
    });
    it('should handle insights generation with warning (e.g., insufficient data)', async () => {
        const response = await request(app).post('/generate-insights').send({ survey_id: 'insufficient' });
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('warning', 'limited data for generating insights');
        expect(response.body.data.insights.length).toBe(0);
        expect(response.body.message).toContain('limited data for generating insights');
    });
    it('should handle insights generation with error (e.g., not found)', async () => {
        const response = await request(app).post('/generate-insights').send({ survey_id: 'not-found' });
        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('message', 'Survey not found');
    });
    it('should return 400 for missing parameters', async () => {
      const response = await request(app).post('/generate-insights').send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Missing required parameter: survey_id');
    });
  });
  
  describe('Fallback Route', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/nonexistent/route');
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Route not found');
    });
  });
}); 