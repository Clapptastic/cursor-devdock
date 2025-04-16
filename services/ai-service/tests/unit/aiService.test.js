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
        { id: 1, question_text: 'How satisfied are you with our product?' },
        { id: 2, question_text: 'What features would you like to see added?' }
      ];
      const targetLanguage = 'Spanish';

      const result = await aiService.translateSurvey(questions, targetLanguage);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true); // Successful translation returns an array directly
      expect(result.length).toBe(questions.length);
      
      // Each question should have id, original and translated properties
      expect(result[0]).toHaveProperty('id', questions[0].id);
      expect(result[0]).toHaveProperty('original');
      expect(result[0]).toHaveProperty('translated');
      expect(result[0].original).toBe(questions[0].question_text);
      expect(result[0].translated).toBeDefined();
      expect(result[0].translated).not.toBe(questions[0].question_text);
      expect(result[0].translated).toContain('Cómo'); // Spanish word
    });

    it('should handle empty questions array', async () => {
      const result = await aiService.translateSurvey([], 'French');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle unsupported languages by returning an object with warning and data', async () => {
      const questions = [
        { id: 1, question_text: 'How satisfied are you with our product?' }
      ];
      const targetLanguage = 'Klingon';

      const result = await aiService.translateSurvey(questions, targetLanguage);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('warning'); // Check for warning property
      expect(result.warning).toContain(`${targetLanguage} is not supported`);
      expect(result).toHaveProperty('data'); // Check for data property containing the (default) translation
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(questions.length);
      expect(result.data[0].translated).toContain('Cómo'); // Defaults to Spanish mock
    });
  });

  describe('analyzeResponses', () => {
    it('should analyze survey responses and return insights', async () => {
      const surveyId = 'survey-123';
      const includeResponses = true;

      const result = await aiService.analyzeResponses(surveyId, includeResponses);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('sentimentAnalysis'); // Check specific property from mock
      expect(result.sentimentAnalysis).toHaveProperty('overall');
      expect(result.sentimentAnalysis).toHaveProperty('scores');
      expect(result).toHaveProperty('responseDistribution'); // Check specific property from mock
      expect(result).toHaveProperty('common_themes');
      expect(result).toHaveProperty('recommendations');
      
      // Should include responses since flag is true
      expect(result).toHaveProperty('responses');
      expect(Array.isArray(result.responses)).toBe(true);
      expect(result.responses.length).toBeGreaterThan(0); // Mock returns one sample response
    });

    it('should exclude raw responses when flag is false', async () => {
      const surveyId = 'survey-123';
      const includeResponses = false;

      const result = await aiService.analyzeResponses(surveyId, includeResponses);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('sentimentAnalysis');
      expect(result).toHaveProperty('responseDistribution');
      
      // Should not include responses since flag is false
      expect(result).not.toHaveProperty('responses');
    });

    it('should handle surveys with no responses by returning warning', async () => {
      const surveyId = 'empty-survey';

      const result = await aiService.analyzeResponses(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('warning'); // Check specific warning property
      expect(result.warning).toBe('No responses');
      expect(result).toHaveProperty('summary', '');
      expect(result.statistics.totalResponses).toBe(0);
      expect(result.sentimentAnalysis.overall).toBe('neutral');
      expect(result.responseDistribution.positive).toBe(0);
      expect(result.responses).toEqual([]);
    });
  });

  describe('extractThemes', () => {
    it('should extract themes from survey responses', async () => {
      const surveyId = 'survey-123';
      const options = {
        minOccurrences: 2, // Option not actually used by mock, but kept for test structure
        includeRaw: false // Default false
      };

      const result = await aiService.extractThemes(surveyId, options);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('themes');
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result.themes.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('keyPhrases');
      expect(Array.isArray(result.keyPhrases)).toBe(true);
      expect(result).not.toHaveProperty('rawData'); // Should not be present by default
      
      // Check theme structure based on mock
      const firstTheme = result.themes[0];
      expect(firstTheme).toHaveProperty('name');
      expect(firstTheme).toHaveProperty('count');
      expect(firstTheme).toHaveProperty('occurrences'); // Check for occurrences property
      expect(firstTheme).toHaveProperty('sentiment');
      expect(firstTheme).toHaveProperty('keyPhrases');
      expect(Array.isArray(firstTheme.keyPhrases)).toBe(true);
    });

    it('should include raw data when options.includeRaw is true', async () => {
        const surveyId = 'survey-456';
        const options = { includeRaw: true };

        const result = await aiService.extractThemes(surveyId, options);

        expect(result).toBeDefined();
        expect(result).toHaveProperty('themes');
        expect(result).toHaveProperty('rawData'); // Should have rawData property
        expect(Array.isArray(result.rawData)).toBe(true);
        expect(result.rawData.length).toBeGreaterThan(0); // Mock adds sample raw data
    });

    it('should handle insufficient data by returning warning', async () => {
      const surveyId = 'empty-survey'; // Mock handles this case
      const options = { insufficient: true }; // Also trigger insufficient case via options

      const result = await aiService.extractThemes(surveyId, options);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('warning', 'insufficient data'); // Check warning property
      expect(result).toHaveProperty('themes');
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result.themes.length).toBe(0); // Mock returns empty themes array
      expect(result).toHaveProperty('keyPhrases');
      expect(result.keyPhrases.length).toBe(0); // Mock returns empty keyPhrases array
    });
  });

  describe('generateInsights', () => {
    it('should generate business insights from survey data', async () => {
      const surveyId = 'survey-789';

      const result = await aiService.generateInsights(surveyId);

      expect(result).toBeDefined();
      // Check properties based on the complex mock structure
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('keyMetrics');
      expect(result).toHaveProperty('strengths');
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(result).toHaveProperty('weaknesses');
      expect(Array.isArray(result.weaknesses)).toBe(true);
      expect(result).toHaveProperty('opportunities');
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result).toHaveProperty('insights'); // Check for the insights array property
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBe(1); // Mock puts all details inside one element
      expect(result.insights[0]).toHaveProperty('summary'); // Check nested properties
      expect(result.insights[0]).toHaveProperty('keyMetrics');
      expect(result).toHaveProperty('quantitativeAnalysis'); // Check extra props for mlService test
      expect(result).toHaveProperty('textualAnalysis');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('overallSentiment');
    });

    it('should handle insufficient data by returning warning', async () => {
      const surveyId = 'insufficient'; // Mock handles this case

      const result = await aiService.generateInsights(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('warning', 'limited data for generating insights'); // Check warning property
      expect(result).toHaveProperty('insights');
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBe(0); // Mock returns empty insights array
      expect(result).toHaveProperty('recommendations');
      // Mock returns specific recommendation for insufficient data
      expect(result.recommendations).toEqual(['Not enough data to generate insights']);
    });

    it('should handle survey not found by returning error object', async () => {
      const surveyId = 'not-found'; // Mock handles this case

      const result = await aiService.generateInsights(surveyId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('error', 'Survey not found'); // Mock returns object with error prop directly
      expect(result).not.toHaveProperty('insights');
      expect(result).not.toHaveProperty('warning');
    });
  });

  // --- Tests for utility/error functions ---
  describe('throwApiError', () => {
    it('should throw ServiceUnavailableError for connection errors', async () => {
      await expect(aiService.throwApiError('unavailable')).rejects.toThrow('ML service unavailable');
    });

    it('should throw NotFoundError for 404 errors', async () => {
       await expect(aiService.throwApiError('not_found')).rejects.toThrow('Resource not found');
    });

    it('should throw a generic error for other types', async () => {
      await expect(aiService.throwApiError('other')).rejects.toThrow('Generic internal error');
    });
  });

  // --- Tests for functions used by other services (ml/nlp) ---

  describe('recommendSurveyChanges (mock test)', () => {
    it('should recommend changes based on survey structure', async () => {
        const survey = { questions: [{ type: 'yes/no' }] };
        const result = await aiService.recommendSurveyChanges(survey);
        expect(result.suggestedQuestions.length).toBeGreaterThan(0);
        expect(result.suggestedQuestions[0].text).toContain('rating scale'); // Based on mock logic
    });

    it('should return empty arrays for well-designed surveys', async () => {
        const survey = { questions: [], wellDesigned: true }; // Add flag for mock
        const result = await aiService.recommendSurveyChanges(survey);
        expect(result.suggestedQuestions.length).toBe(0);
        expect(result.suggestedRemovals.length).toBe(0);
    });
  });

  describe('predictCustomerBehavior (mock test)', () => {
    it('should predict behavior based on responses', async () => {
        const responses = [{ customerId: 1, feedback: 'love it' }, { customerId: 2, feedback: 'bad experience' }];
        const result = await aiService.predictCustomerBehavior(responses);
        expect(result).toHaveProperty('predictions');
        expect(Array.isArray(result.predictions)).toBe(true);
        expect(result.predictions.length).toBe(responses.length);
        expect(result.predictions[0]).toHaveProperty('churnRisk');
        expect(result.predictions[0]).toHaveProperty('upsellPotential');
        expect(result).toHaveProperty('engagementLevel', 'medium'); // Check top-level props
        expect(result).toHaveProperty('retention', 'high');
    });

    it('should handle no responses with warning', async () => {
        const result = await aiService.predictCustomerBehavior([]);
        expect(result).toHaveProperty('warning', 'No data provided for prediction');
        expect(result).toHaveProperty('predictions', []); // Check predictions array exists even with warning
        expect(result.engagementLevel).toBe('unknown');
        expect(result.retention).toBe('unknown');
    });
  });

  describe('classifyText (mock test)', () => {
    it('should classify text into categories', async () => {
        expect(await aiService.classifyText('Found a bug')).toEqual(['bug']);
        expect(await aiService.classifyText('Need a new feature')).toEqual(['feature_request']);
        expect(await aiService.classifyText('Great product!')).toEqual(['feedback']);
        expect(await aiService.classifyText('General feedback')).toEqual(['feedback']);
    });
     it('should handle empty text', async () => {
        expect(await aiService.classifyText('')).toEqual([]);
    });
  });
}); 