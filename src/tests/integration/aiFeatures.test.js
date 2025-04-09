const request = require('supertest');
const app = require('../../backend/server');
const { supabase } = require('../../backend/config/supabaseClient');
const jwt = require('jsonwebtoken');

// Mock supabase client
jest.mock('../../backend/config/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis()
  }
}));

// Mock AI providers
jest.mock('@anthropic-ai/sdk', () => {
  return {
    Anthropic: jest.fn().mockImplementation(() => {
      return {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: '{"questions": [{"id": "q1", "question": "Enhanced question", "type": "multiple_choice", "required": true, "options": ["Option 1", "Option 2"]}]}' }]
          })
        }
      };
    })
  };
});

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: '{"summary": "Test summary", "designInsights": [{"title": "Test insight", "content": "Test content", "type": "insight"}], "improvementSuggestions": [{"title": "Test suggestion", "content": "Test content", "type": "tip"}], "nextSteps": ["Test step"]}' } }]
            })
          }
        }
      };
    })
  };
});

describe('AI Features Integration Tests', () => {
  let token;
  const userId = 'test-user-id';
  const mockSurvey = {
    id: 'test-survey-id',
    title: 'Test Survey',
    description: 'A test survey',
    user_id: userId,
    questions: [
      {
        id: 'q1',
        question: 'How satisfied are you with our product?',
        type: 'rating'
      }
    ]
  };

  beforeAll(() => {
    // Create a valid JWT token for testing
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', {
      expiresIn: '1h'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/optimize-survey', () => {
    it('should enhance a survey successfully', async () => {
      // Mock Supabase responses
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: mockSurvey
      });

      const requestBody = {
        prompt: 'Improve my survey for clarity',
        context: {
          title: mockSurvey.title,
          description: mockSurvey.description,
          questions: mockSurvey.questions
        },
        surveyId: mockSurvey.id
      };

      const response = await request(app)
        .post('/api/ai/optimize-survey')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.questions).toBeInstanceOf(Array);
      expect(response.body.questions[0].question).toBe('Enhanced question');

      // Verify Supabase was called with correct params
      expect(supabase.from).toHaveBeenCalledWith('surveys');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockSurvey.id);
      expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/ai/optimize-survey')
        .send({
          prompt: 'Improve my survey',
          context: {},
          surveyId: 'test-survey-id'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if request body is incomplete', async () => {
      const response = await request(app)
        .post('/api/ai/optimize-survey')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required fields
          prompt: 'Improve my survey'
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 if survey not found', async () => {
      // Mock Supabase response for non-existent survey
      supabase.single.mockResolvedValueOnce({
        error: { message: 'Survey not found' },
        data: null
      });

      const response = await request(app)
        .post('/api/ai/optimize-survey')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Improve my survey',
          context: {
            title: 'Test Survey',
            questions: []
          },
          surveyId: 'non-existent-id'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/ai/analyze-survey', () => {
    it('should analyze a survey successfully', async () => {
      // Mock Supabase responses
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: mockSurvey
      });

      // Mock questions retrieval
      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: mockSurvey.questions,
        error: null
      }));

      // Mock successful analysis record creation
      supabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'test-analysis-id' },
          error: null
        })
      });

      const response = await request(app)
        .post('/api/ai/analyze-survey')
        .set('Authorization', `Bearer ${token}`)
        .send({
          surveyId: mockSurvey.id,
          includeResponses: false
        });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary).toBe('Test summary');
      expect(response.body.designInsights).toBeInstanceOf(Array);
      expect(response.body.improvementSuggestions).toBeInstanceOf(Array);
      expect(response.body.nextSteps).toBeInstanceOf(Array);
      expect(response.body.analysisId).toBe('test-analysis-id');

      // Verify Supabase was called with correct params
      expect(supabase.from).toHaveBeenCalledWith('surveys');
      expect(supabase.from).toHaveBeenCalledWith('survey_questions');
      expect(supabase.from).toHaveBeenCalledWith('analyses');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockSurvey.id);
      expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should include responses when requested', async () => {
      // Mock Supabase responses
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: mockSurvey
      });

      // Mock questions retrieval
      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: mockSurvey.questions,
        error: null
      }));

      // Mock responses retrieval
      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        data: [
          { id: 'r1', response_data: { q1: 4 } }
        ],
        error: null
      }));

      // Mock successful analysis record creation
      supabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'test-analysis-id' },
          error: null
        })
      });

      const response = await request(app)
        .post('/api/ai/analyze-survey')
        .set('Authorization', `Bearer ${token}`)
        .send({
          surveyId: mockSurvey.id,
          includeResponses: true
        });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify Supabase was called to fetch responses
      expect(supabase.from).toHaveBeenCalledWith('responses');
    });

    it('should continue if saving analysis fails', async () => {
      // Mock Supabase responses
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: mockSurvey
      });

      // Mock questions retrieval
      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: mockSurvey.questions,
        error: null
      }));

      // Mock failed analysis record creation
      supabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' }
        })
      });

      const response = await request(app)
        .post('/api/ai/analyze-survey')
        .set('Authorization', `Bearer ${token}`)
        .send({
          surveyId: mockSurvey.id
        });

      // Should still succeed but with null analysisId
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysisId).toBeNull();
    });

    it('should return 400 if request body is incomplete', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-survey')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing surveyId
        });

      expect(response.status).toBe(400);
    });
  });
}); 