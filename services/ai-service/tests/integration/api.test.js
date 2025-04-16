/**
 * API Integration Tests
 */

const request = require('supertest');
const app = require('../../src/index');

describe('AI Service API', () => {
  let server;

  beforeAll((done) => {
    // Start server on a random port for integration tests
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(server)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Check the successResponse structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });
  
  describe('Question Generation', () => {
    it('should generate questions with valid parameters', async () => {
      const requestBody = {
        industry: 'SaaS',
        businessStage: 'Growth',
        customerSegment: 'B2B',
        topic: 'Customer Satisfaction',
        count: 5
      };
      
      const response = await request(server)
        .post('/generate-questions')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(requestBody.count);
    });
    
    it('should return 400 for missing required parameters', async () => {
      const requestBody = {
        // Missing required fields
        industry: 'SaaS'
      };
      
      const response = await request(server)
        .post('/generate-questions')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });
  });
  
  describe('Question Improvement', () => {
    it('should improve a question with valid input', async () => {
      const requestBody = {
        question: 'Do you like our product?',
        context: 'SaaS platform'
      };
      
      const response = await request(server)
        .post('/improve-question')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('original', requestBody.question);
      expect(response.body.data).toHaveProperty('improved');
      expect(response.body.data).toHaveProperty('suggestions');
    });
  });
  
  describe('Survey Translation', () => {
    it('should translate survey questions', async () => {
      const requestBody = {
        questions: [
          {
            id: 'q1',
            question_text: 'How satisfied are you with our product?',
            description: 'Rate on a scale from 1 to 5'
          }
        ],
        targetLanguage: 'Spanish'
      };
      
      const response = await request(server)
        .post('/translate-survey')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(requestBody.questions.length);
    });
  });
  
  describe('Response Analysis', () => {
    it('should analyze survey responses', async () => {
      const requestBody = {
        survey_id: 'survey-123',
        includeResponses: true
      };
      
      const response = await request(server)
        .post('/analyze-responses')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('survey_id', requestBody.survey_id);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('sentiment');
    });
  });
  
  describe('Theme Extraction', () => {
    it('should extract themes from survey responses', async () => {
      const requestBody = {
        survey_id: 'survey-123',
        options: {
          minThemeCount: 3,
          maxThemes: 5
        }
      };
      
      const response = await request(server)
        .post('/extract-themes')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('themes');
      expect(Array.isArray(response.body.data.themes)).toBe(true);
    });
  });
  
  describe('Insights Generation', () => {
    it('should generate insights from survey data', async () => {
      const requestBody = {
        survey_id: 'survey-123',
        options: {
          includeRecommendations: true
        }
      };
      
      const response = await request(server)
        .post('/generate-insights')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('weaknesses');
      expect(response.body.data).toHaveProperty('recommendations');
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(server)
        .get('/non-existent-route')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });
  });
}); 