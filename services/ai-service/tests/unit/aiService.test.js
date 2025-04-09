/**
 * AI Service Unit Tests
 * Tests for the core AI service functions
 */

const aiService = require('../../src/services/aiService');

// Mock the axios client and other dependencies
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    post: jest.fn().mockResolvedValue({
      data: {
        result: 'mocked response'
      }
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        result: 'mocked response'
      }
    })
  })
}));

jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe('AI Service Functions', () => {
  describe('generateQuestions', () => {
    it('should generate questions based on industry and topics', async () => {
      const industry = 'Technology';
      const businessStage = 'Growth';
      const customerSegment = 'Enterprise';
      const topic = 'Customer Satisfaction';
      const count = 5;

      const result = await aiService.generateQuestions(
        industry, 
        businessStage, 
        customerSegment, 
        topic, 
        count
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(count);
      
      // Check question structure
      const firstQuestion = result[0];
      expect(firstQuestion).toHaveProperty('question_text');
      expect(firstQuestion).toHaveProperty('description');
      expect(firstQuestion).toHaveProperty('question_type');
      expect(firstQuestion).toHaveProperty('question_type_id');
      expect(firstQuestion).toHaveProperty('is_required');
      expect(firstQuestion).toHaveProperty('settings');
      expect(firstQuestion).toHaveProperty('order_position');
    });

    it('should use default count when not specified', async () => {
      const result = await aiService.generateQuestions(
        'Finance', 
        'Startup', 
        'SMB', 
        'Product Feedback'
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10); // Default count is 10
    });

    it('should handle unknown topic by using default templates', async () => {
      const result = await aiService.generateQuestions(
        'Healthcare', 
        'Mature', 
        'Patients', 
        'Unknown Topic',
        3
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      
      // Should use default templates for unknown topics
      const questionText = result[0].question_text;
      expect(questionText).toContain('Unknown Topic');
    });
  });

  describe('improveQuestion', () => {
    it('should improve a question with suggestions', async () => {
      const question = 'Do you like our product?';
      const context = 'ease of use';

      const result = await aiService.improveQuestion(question, context);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('original', question);
      expect(result).toHaveProperty('improved');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Should have improved the yes/no question format
      expect(result.improved).not.toBe(question);
      expect(result.improved).toContain('scale');
    });

    it('should handle questions without context', async () => {
      const question = 'Is our website good?';

      const result = await aiService.improveQuestion(question);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('original', question);
      expect(result).toHaveProperty('improved');
      expect(result.improved).not.toBe(question);
    });

    it('should handle questions that already have question marks', async () => {
      const question = 'How would you rate our customer service?';

      const result = await aiService.improveQuestion(question);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('original', question);
      expect(result).toHaveProperty('improved');
      // Since the question already has a good format, improvements may be minimal
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('translateSurvey', () => {
    it('should translate survey questions to target language', async () => {
      const questions = [
        {
          question_text: 'How satisfied are you with our product?',
          description: 'Rate your overall satisfaction'
        },
        {
          question_text: 'What features would you like to see added?',
          description: 'Suggest new features'
        }
      ];
      const targetLanguage = 'Spanish';

      const result = await aiService.translateSurvey(questions, targetLanguage);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(questions.length);
      
      // Each question should have original and translated properties
      expect(result[0]).toHaveProperty('original');
      expect(result[0]).toHaveProperty('translated');
      expect(result[0].original).toBe(questions[0].question_text);
      expect(result[0].translated).toBeDefined();
      expect(result[0].translated).not.toBe(questions[0].question_text);
    });

    it('should handle empty questions array', async () => {
      const result = await aiService.translateSurvey([], 'French');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle unsupported languages by returning a warning', async () => {
      const questions = [
        {
          question_text: 'How satisfied are you with our product?',
          description: 'Rate your overall satisfaction'
        }
      ];
      const targetLanguage = 'Klingon';

      const result = await aiService.translateSurvey(questions, targetLanguage);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('not supported');
    });
  });

  describe('analyzeResponses', () => {
    it('should analyze survey responses and return insights', async () => {
      const surveyId = 'survey-123';
      const includeResponses = true;

      const result = await aiService.analyzeResponses(surveyId, includeResponses);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('sentimentAnalysis');
      expect(result).toHaveProperty('responseDistribution');
      
      // Should include responses since flag is true
      expect(result).toHaveProperty('responses');
      expect(Array.isArray(result.responses)).toBe(true);
    });

    it('should exclude raw responses when flag is false', async () => {
      const surveyId = 'survey-123';
      const includeResponses = false;

      const result = await aiService.analyzeResponses(surveyId, includeResponses);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('sentimentAnalysis');
      expect(result).toHaveProperty('responseDistribution');
      
      // Should not include responses since flag is false
      expect(result).not.toHaveProperty('responses');
    });

    it('should handle surveys with no responses', async () => {
      const surveyId = 'empty-survey';

      const result = await aiService.analyzeResponses(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('No responses');
    });
  });

  describe('extractThemes', () => {
    it('should extract themes from survey responses', async () => {
      const surveyId = 'survey-123';
      const options = {
        minOccurrences: 2,
        includeRaw: true
      };

      const result = await aiService.extractThemes(surveyId, options);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('themes');
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result.themes.length).toBeGreaterThan(0);
      
      // Check theme structure
      const firstTheme = result.themes[0];
      expect(firstTheme).toHaveProperty('name');
      expect(firstTheme).toHaveProperty('occurrences');
      expect(firstTheme).toHaveProperty('sentiment');
      
      // Should include raw data since includeRaw is true
      expect(result).toHaveProperty('rawData');
    });

    it('should use default options when not specified', async () => {
      const surveyId = 'survey-123';

      const result = await aiService.extractThemes(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('themes');
      expect(Array.isArray(result.themes)).toBe(true);
      
      // Should not include raw data since it's not requested in defaults
      expect(result).not.toHaveProperty('rawData');
    });

    it('should handle surveys with no responses or insufficient data', async () => {
      const surveyId = 'insufficient-data';

      const result = await aiService.extractThemes(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('themes');
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result.themes.length).toBe(0);
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('insufficient data');
    });
  });

  describe('generateInsights', () => {
    it('should generate insights for a survey', async () => {
      const surveyId = 'survey-123';

      const result = await aiService.generateInsights(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('insights');
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
      
      // Check insights structure
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('keyMetrics');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle non-existent survey IDs', async () => {
      const surveyId = 'non-existent';

      const result = await aiService.generateInsights(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('not found');
    });

    it('should handle surveys with insufficient data', async () => {
      const surveyId = 'insufficient-data';

      const result = await aiService.generateInsights(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('limited data');
    });
  });

  // Error handling tests
  describe('Error handling', () => {
    it('should handle API errors properly', async () => {
      // Temporarily override the mock to simulate an error
      const axiosError = new Error('API connection refused');
      axiosError.code = 'ECONNREFUSED';
      
      const originalCreate = require('axios').create;
      require('axios').create = jest.fn().mockReturnValue({
        post: jest.fn().mockRejectedValue(axiosError),
        get: jest.fn().mockRejectedValue(axiosError)
      });
      
      try {
        await aiService.generateQuestions('Tech', 'Growth', 'Enterprise', 'Feedback', 5);
        // If we reach here, the test failed because the function didn't throw
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('unavailable');
      }
      
      // Restore the original mock
      require('axios').create = originalCreate;
    });
    
    it('should handle not found errors', async () => {
      // Temporarily override the mock to simulate a 404 error
      const axiosError = new Error('Resource not found');
      axiosError.response = {
        status: 404,
        data: { message: 'Survey not found' }
      };
      
      const originalCreate = require('axios').create;
      require('axios').create = jest.fn().mockReturnValue({
        post: jest.fn().mockRejectedValue(axiosError),
        get: jest.fn().mockRejectedValue(axiosError)
      });
      
      try {
        await aiService.analyzeResponses('non-existent-survey');
        // If we reach here, the test failed because the function didn't throw
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('not found');
      }
      
      // Restore the original mock
      require('axios').create = originalCreate;
    });
  });
}); 