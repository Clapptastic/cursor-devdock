const httpMocks = require('node-mocks-http');
const controller = require('../../controllers/analysisController');
const { createMockSupabaseClient, setupMockResponses } = require('../database/testSupabaseSetup');

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => createMockSupabaseClient())
}));

// Mock AI providers
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'AI generated analysis response' }]
      })
    }
  }))
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated analysis response' } }]
        })
      }
    }
  }))
}));

describe('Analysis Controller Tests', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  let mockSupabase;

  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = httpMocks.createRequest();
    mockResponse = httpMocks.createResponse();
    mockNext = jest.fn();
    
    // Setup Supabase client
    mockSupabase = require('@supabase/supabase-js').createClient();
    setupMockResponses(mockSupabase);
    
    // Setup default request properties
    mockRequest.user = { id: 'user-uuid-1' };
  });

  describe('processSurveyData', () => {
    beforeEach(() => {
      mockRequest.body = {
        surveyId: 'survey-uuid-1',
        includeResponses: true
      };
    });

    it('should process survey data and return analysis results', async () => {
      // Arrange
      mockSupabase.from().select().single.mockImplementation(() => ({
        data: {
          id: 'survey-uuid-1',
          title: 'Customer Feedback',
          questions: [
            { id: 'q1', text: 'How would you rate our service?', type: 'rating' }
          ]
        },
        error: null
      }));
      
      mockSupabase.from().select().eq.mockImplementation(() => ({
        data: [
          {
            id: 'response-uuid-1',
            answers: [{ question_id: 'q1', value: 4 }]
          }
        ],
        error: null
      }));
      
      // Act
      await controller.processSurveyData(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(200);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(true);
      expect(responseData.analysisResults).toBeDefined();
      expect(responseData.analysisId).toBeDefined();
    });

    it('should handle survey not found', async () => {
      // Arrange
      mockSupabase.from().select().single.mockImplementation(() => ({
        data: null,
        error: { message: 'Survey not found' }
      }));
      
      // Act
      await controller.processSurveyData(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(404);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('not found');
    });

    it('should handle missing request body', async () => {
      // Arrange
      mockRequest.body = {};
      
      // Act
      await controller.processSurveyData(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyId is required');
    });

    it('should handle API failure gracefully', async () => {
      // Arrange
      mockSupabase.from().select().single.mockImplementation(() => ({
        data: {
          id: 'survey-uuid-1',
          title: 'Customer Feedback',
          questions: [
            { id: 'q1', text: 'How would you rate our service?', type: 'rating' }
          ]
        },
        error: null
      }));
      
      // Mock AI provider failure
      require('@anthropic-ai/sdk').Anthropic.mockImplementation(() => ({
        messages: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }));
      
      // Act
      await controller.processSurveyData(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(500);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Error processing survey data');
    });
  });

  describe('analyzeTrends', () => {
    beforeEach(() => {
      mockRequest.body = {
        surveyIds: ['survey-uuid-1', 'survey-uuid-2'],
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };
    });

    it('should analyze trends across multiple surveys', async () => {
      // Arrange
      mockSupabase.from().select().in.mockImplementation(() => ({
        data: [
          {
            id: 'survey-uuid-1',
            title: 'Survey 1',
            created_at: '2023-01-10T00:00:00.000Z'
          },
          {
            id: 'survey-uuid-2',
            title: 'Survey 2',
            created_at: '2023-02-10T00:00:00.000Z'
          }
        ],
        error: null
      }));
      
      mockSupabase.from().select().eq.mockImplementation(() => ({
        data: [
          {
            id: 'response-uuid-1',
            survey_id: 'survey-uuid-1',
            created_at: '2023-01-15T00:00:00.000Z',
            answers: [{ question_id: 'q1', value: 4 }]
          },
          {
            id: 'response-uuid-2',
            survey_id: 'survey-uuid-2',
            created_at: '2023-02-15T00:00:00.000Z',
            answers: [{ question_id: 'q1', value: 5 }]
          }
        ],
        error: null
      }));
      
      // Act
      await controller.analyzeTrends(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(200);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(true);
      expect(responseData.trendAnalysis).toBeDefined();
      expect(responseData.summary).toBeDefined();
      expect(responseData.visualizationData).toBeDefined();
    });

    it('should handle missing survey IDs', async () => {
      // Arrange
      mockRequest.body = {
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };
      
      // Act
      await controller.analyzeTrends(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyIds is required');
    });

    it('should handle missing date range', async () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-uuid-1', 'survey-uuid-2']
      };
      
      // Act
      await controller.analyzeTrends(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('dateRange is required');
    });

    it('should handle no surveys found', async () => {
      // Arrange
      mockSupabase.from().select().in.mockImplementation(() => ({
        data: [],
        error: null
      }));
      
      // Act
      await controller.analyzeTrends(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(404);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('No surveys found');
    });
  });

  describe('getAnalysisHistory', () => {
    it('should retrieve analysis history for a survey', async () => {
      // Arrange
      mockRequest.params = { surveyId: 'survey-uuid-1' };
      
      mockSupabase.from().select().eq.mockImplementation(() => ({
        data: [
          {
            id: 'analysis-uuid-1',
            survey_id: 'survey-uuid-1',
            created_at: '2023-01-20T00:00:00.000Z',
            summary: 'Analysis 1'
          },
          {
            id: 'analysis-uuid-2',
            survey_id: 'survey-uuid-1',
            created_at: '2023-01-25T00:00:00.000Z',
            summary: 'Analysis 2'
          }
        ],
        error: null
      }));
      
      // Act
      await controller.getAnalysisHistory(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(200);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(true);
      expect(responseData.analyses).toHaveLength(2);
      expect(responseData.analyses[0].id).toBe('analysis-uuid-1');
    });

    it('should handle no analyses found', async () => {
      // Arrange
      mockRequest.params = { surveyId: 'survey-uuid-1' };
      
      mockSupabase.from().select().eq.mockImplementation(() => ({
        data: [],
        error: null
      }));
      
      // Act
      await controller.getAnalysisHistory(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(200);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(true);
      expect(responseData.analyses).toHaveLength(0);
      expect(responseData.message).toContain('No analyses found');
    });

    it('should handle database error', async () => {
      // Arrange
      mockRequest.params = { surveyId: 'survey-uuid-1' };
      
      mockSupabase.from().select().eq.mockImplementation(() => ({
        data: null,
        error: { message: 'Database error' }
      }));
      
      // Act
      await controller.getAnalysisHistory(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(500);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Error retrieving analysis history');
    });
  });
}); 