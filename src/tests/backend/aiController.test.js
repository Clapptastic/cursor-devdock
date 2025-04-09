const { optimizeSurvey, analyzeSurvey } = require('../../backend/controllers/aiController');
const { supabase } = require('../../backend/config/supabaseClient');
const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');

// Mock the dependencies
jest.mock('../../backend/config/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  }
}));

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
              choices: [{ message: { content: '{"questions": [{"id": "q1", "question": "Enhanced question", "type": "multiple_choice", "required": true, "options": ["Option 1", "Option 2"]}]}' } }]
            })
          }
        }
      };
    })
  };
});

describe('AI Controller Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Clear all mock calls between tests
    jest.clearAllMocks();
  });

  describe('optimizeSurvey', () => {
    it('should return 400 if prompt, context, or surveyId is missing', async () => {
      // Setup
      req.body = { prompt: 'test', context: {} };

      // Call function
      await optimizeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 404 if survey is not found', async () => {
      // Setup
      req.body = { prompt: 'test', context: {}, surveyId: 'survey123' };
      supabase.single.mockResolvedValueOnce({
        error: { message: 'Not found' },
        data: null
      });

      // Call function
      await optimizeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should successfully optimize a survey using Anthropic', async () => {
      // Setup
      req.body = {
        prompt: 'Improve my survey',
        context: {
          title: 'Test Survey',
          description: 'A test survey',
          industry: 'Technology',
          businessStage: 'mvp',
          customerSegment: ['B2B'],
          questions: [{ id: 'q1', question: 'Original question' }]
        },
        surveyId: 'survey123'
      };

      process.env.AI_PROVIDER = 'anthropic';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      // Call function
      await optimizeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        questions: expect.any(Array),
        originalSurveyId: 'survey123'
      }));
      expect(Anthropic.mock.instances[0].messages.create).toHaveBeenCalled();
    });

    it('should successfully optimize a survey using OpenAI', async () => {
      // Setup
      req.body = {
        prompt: 'Improve my survey',
        context: {
          title: 'Test Survey',
          description: 'A test survey',
          industry: 'Technology',
          businessStage: 'mvp',
          customerSegment: ['B2B'],
          questions: [{ id: 'q1', question: 'Original question' }]
        },
        surveyId: 'survey123'
      };

      process.env.AI_PROVIDER = 'openai';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      // Call function
      await optimizeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        questions: expect.any(Array),
        originalSurveyId: 'survey123'
      }));
      expect(OpenAI.mock.instances[0].chat.completions.create).toHaveBeenCalled();
    });

    it('should handle invalid AI response format', async () => {
      // Setup
      req.body = {
        prompt: 'Improve my survey',
        context: {
          title: 'Test Survey',
          description: 'A test survey',
          questions: [{ id: 'q1', question: 'Original question' }]
        },
        surveyId: 'survey123'
      };

      process.env.AI_PROVIDER = 'anthropic';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      // Mock invalid AI response
      Anthropic.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: 'Invalid response without JSON' }]
          })
        }
      }));

      // Call function
      await optimizeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('analyzeSurvey', () => {
    it('should return 400 if surveyId is missing', async () => {
      // Setup
      req.body = {};

      // Call function
      await analyzeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 404 if survey is not found', async () => {
      // Setup
      req.body = { surveyId: 'survey123' };
      supabase.single.mockResolvedValueOnce({
        error: { message: 'Not found' },
        data: null
      });

      // Call function
      await analyzeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should successfully analyze a survey with Anthropic', async () => {
      // Setup
      req.body = {
        surveyId: 'survey123',
        includeResponses: false
      };

      process.env.AI_PROVIDER = 'anthropic';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: [
          { id: 'q1', question: 'Test question', type: 'multiple_choice' }
        ],
        error: null
      }));

      // Mock valid AI response for analysis
      Anthropic.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: '{"summary": "Test summary", "designInsights": [{"title": "Good insight", "content": "Content here", "type": "insight"}], "improvementSuggestions": [{"title": "Good suggestion", "content": "Content here", "type": "tip"}], "nextSteps": ["Step 1", "Step 2"]}' }]
          })
        }
      }));

      supabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'analysis123' },
          error: null
        })
      });

      // Call function
      await analyzeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        summary: 'Test summary',
        designInsights: expect.any(Array),
        improvementSuggestions: expect.any(Array),
        nextSteps: expect.any(Array),
        analysisId: 'analysis123'
      }));
      expect(Anthropic.mock.instances[0].messages.create).toHaveBeenCalled();
    });

    it('should successfully analyze a survey with responses', async () => {
      // Setup
      req.body = {
        surveyId: 'survey123',
        includeResponses: true
      };

      process.env.AI_PROVIDER = 'openai';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: [
          { id: 'q1', question: 'Test question', type: 'multiple_choice' }
        ],
        error: null
      }));

      // Mock responses retrieval
      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        data: [
          { id: 'r1', response_data: { q1: 'Option A' } }
        ],
        error: null
      }));

      // Mock valid AI response for analysis with responses
      OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: '{"summary": "Test summary with responses", "designInsights": [{"title": "Good insight", "content": "Content here", "type": "insight"}], "responseInsights": [{"title": "Response insight", "content": "Content here", "type": "stat"}], "improvementSuggestions": [{"title": "Good suggestion", "content": "Content here", "type": "tip"}], "nextSteps": ["Step 1", "Step 2"]}' } }]
            })
          }
        }
      }));

      supabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'analysis456' },
          error: null
        })
      });

      // Call function
      await analyzeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        summary: 'Test summary with responses',
        designInsights: expect.any(Array),
        responseInsights: expect.any(Array),
        improvementSuggestions: expect.any(Array),
        nextSteps: expect.any(Array),
        analysisId: 'analysis456'
      }));
      expect(OpenAI.mock.instances[0].chat.completions.create).toHaveBeenCalled();
    });

    it('should handle invalid AI response format', async () => {
      // Setup
      req.body = {
        surveyId: 'survey123',
        includeResponses: false
      };

      process.env.AI_PROVIDER = 'anthropic';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: [
          { id: 'q1', question: 'Test question', type: 'multiple_choice' }
        ],
        error: null
      }));

      // Mock invalid AI response
      Anthropic.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: 'Invalid response without JSON' }]
          })
        }
      }));

      // Call function
      await analyzeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should continue if saving analysis to database fails', async () => {
      // Setup
      req.body = {
        surveyId: 'survey123',
        includeResponses: false
      };

      process.env.AI_PROVIDER = 'anthropic';
      
      supabase.single.mockResolvedValueOnce({
        error: null,
        data: { id: 'survey123', title: 'Test Survey' }
      });

      supabase.select.mockImplementationOnce(() => ({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        data: [
          { id: 'q1', question: 'Test question', type: 'multiple_choice' }
        ],
        error: null
      }));

      // Mock valid AI response
      Anthropic.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ text: '{"summary": "Test summary", "designInsights": [{"title": "Good insight", "content": "Content here", "type": "insight"}], "improvementSuggestions": [{"title": "Good suggestion", "content": "Content here", "type": "tip"}], "nextSteps": ["Step 1", "Step 2"]}' }]
          })
        }
      }));

      // Mock database error when saving analysis
      supabase.insert.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' }
        })
      });

      // Call function
      await analyzeSurvey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        summary: 'Test summary',
        designInsights: expect.any(Array),
        improvementSuggestions: expect.any(Array),
        nextSteps: expect.any(Array),
        analysisId: null
      }));
    });
  });
}); 