const request = require('supertest');
const express = require('express');
const router = require('../../routes/analysisRoutes');
const analysisController = require('../../controllers/analysisController');
const { validateProcessRequest, validateTrendsRequest } = require('../../middleware/validation/analysisValidation');
const authMiddleware = require('../../middleware/authMiddleware');

// Mock middleware and controllers
jest.mock('../../middleware/validation/analysisValidation', () => ({
  validateProcessRequest: jest.fn((req, res, next) => next()),
  validateTrendsRequest: jest.fn((req, res, next) => next())
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  })
}));

jest.mock('../../controllers/analysisController', () => ({
  processSurveyData: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      analysisResults: { summary: 'Test summary' },
      analysisId: 'test-analysis-id'
    });
  }),
  analyzeTrends: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      trendAnalysis: { trends: 'Test trends' },
      summary: 'Test summary',
      visualizationData: { data: 'Test data' }
    });
  }),
  getAnalysisHistory: jest.fn((req, res) => {
    res.status(200).json({
      success: true,
      analyses: [
        { id: 'analysis-1', summary: 'Analysis 1' },
        { id: 'analysis-2', summary: 'Analysis 2' }
      ]
    });
  })
}));

describe('Analysis Routes Tests', () => {
  let app;

  beforeEach(() => {
    // Create Express app and register router
    app = express();
    app.use(express.json());
    app.use('/api/analysis', router);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/analysis/process', () => {
    it('should process survey data and return analysis results', async () => {
      // Arrange
      const requestBody = {
        surveyId: 'test-survey-id',
        includeResponses: true
      };

      // Act
      const response = await request(app)
        .post('/api/analysis/process')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysisResults).toBeDefined();
      expect(response.body.analysisId).toBeDefined();
      
      // Verify middleware and controller were called
      expect(authMiddleware.protect).toHaveBeenCalled();
      expect(validateProcessRequest).toHaveBeenCalled();
      expect(analysisController.processSurveyData).toHaveBeenCalled();
    });
  });

  describe('POST /api/analysis/trends', () => {
    it('should analyze trends and return trend analysis results', async () => {
      // Arrange
      const requestBody = {
        surveyIds: ['survey-1', 'survey-2'],
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };

      // Act
      const response = await request(app)
        .post('/api/analysis/trends')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trendAnalysis).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.visualizationData).toBeDefined();
      
      // Verify middleware and controller were called
      expect(authMiddleware.protect).toHaveBeenCalled();
      expect(validateTrendsRequest).toHaveBeenCalled();
      expect(analysisController.analyzeTrends).toHaveBeenCalled();
    });
  });

  describe('GET /api/analysis/history/:surveyId', () => {
    it('should get analysis history for a survey', async () => {
      // Act
      const response = await request(app)
        .get('/api/analysis/history/test-survey-id');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analyses).toHaveLength(2);
      
      // Verify middleware and controller were called
      expect(authMiddleware.protect).toHaveBeenCalled();
      expect(analysisController.getAnalysisHistory).toHaveBeenCalled();
      expect(analysisController.getAnalysisHistory.mock.calls[0][0].params.surveyId).toBe('test-survey-id');
    });
  });

  describe('Route configuration', () => {
    it('should use authentication middleware for all routes', () => {
      // The auth middleware should be called for each test above
      expect(authMiddleware.protect).toHaveBeenCalledTimes(3);
    });
    
    it('should use appropriate validation middleware', () => {
      expect(validateProcessRequest).toHaveBeenCalledTimes(1);
      expect(validateTrendsRequest).toHaveBeenCalledTimes(1);
    });
  });
}); 