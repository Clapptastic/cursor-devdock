const httpMocks = require('node-mocks-http');
const { validateProcessRequest, validateTrendsRequest } = require('../../middleware/validation/analysisValidation');

describe('Analysis Validation Middleware Tests', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = httpMocks.createRequest();
    mockResponse = httpMocks.createResponse();
    mockNext = jest.fn();
  });

  describe('validateProcessRequest', () => {
    it('should pass validation with valid request body', () => {
      // Arrange
      mockRequest.body = {
        surveyId: 'valid-survey-id',
        includeResponses: true
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(200); // Default status code
    });

    it('should fail validation when surveyId is missing', () => {
      // Arrange
      mockRequest.body = {
        includeResponses: true
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyId is required');
    });

    it('should fail validation when surveyId is empty', () => {
      // Arrange
      mockRequest.body = {
        surveyId: '',
        includeResponses: true
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyId cannot be empty');
    });

    it('should pass validation when includeResponses is missing (defaults to false)', () => {
      // Arrange
      mockRequest.body = {
        surveyId: 'valid-survey-id'
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.includeResponses).toBe(false); // Should set default value
    });

    it('should pass validation when includeResponses is false', () => {
      // Arrange
      mockRequest.body = {
        surveyId: 'valid-survey-id',
        includeResponses: false
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass validation when includeResponses is provided as string "true"', () => {
      // Arrange
      mockRequest.body = {
        surveyId: 'valid-survey-id',
        includeResponses: 'true'
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.includeResponses).toBe(true); // Should convert to boolean
    });

    it('should pass validation when includeResponses is provided as string "false"', () => {
      // Arrange
      mockRequest.body = {
        surveyId: 'valid-survey-id',
        includeResponses: 'false'
      };
      
      // Act
      validateProcessRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.includeResponses).toBe(false); // Should convert to boolean
    });
  });

  describe('validateTrendsRequest', () => {
    it('should pass validation with valid request body', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-1', 'survey-2'],
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        },
        compareWithIndustry: true
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(200); // Default status code
    });

    it('should fail validation when surveyIds is missing', () => {
      // Arrange
      mockRequest.body = {
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyIds is required');
    });

    it('should fail validation when surveyIds is not an array', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: 'survey-1',
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyIds must be an array');
    });

    it('should fail validation when surveyIds is an empty array', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: [],
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('surveyIds must contain at least one survey ID');
    });

    it('should fail validation when dateRange is missing', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-1', 'survey-2']
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('dateRange is required');
    });

    it('should fail validation when dateRange.startDate is missing', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-1', 'survey-2'],
        dateRange: {
          endDate: '2023-12-31'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('dateRange.startDate is required');
    });

    it('should fail validation when dateRange.endDate is missing', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-1', 'survey-2'],
        dateRange: {
          startDate: '2023-01-01'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('dateRange.endDate is required');
    });

    it('should fail validation when startDate is after endDate', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-1', 'survey-2'],
        dateRange: {
          startDate: '2023-12-31',
          endDate: '2023-01-01'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      const responseData = mockResponse._getJSONData();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('startDate must be before or equal to endDate');
    });

    it('should pass validation when compareWithIndustry is missing (defaults to false)', () => {
      // Arrange
      mockRequest.body = {
        surveyIds: ['survey-1', 'survey-2'],
        dateRange: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      };
      
      // Act
      validateTrendsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.compareWithIndustry).toBe(false); // Should set default value
    });
  });
}); 