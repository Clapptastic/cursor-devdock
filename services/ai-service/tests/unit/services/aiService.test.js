/**
 * AI Service Unit Tests
 */

const aiService = require('../../../src/services/aiService');

// Mock axios for API testing
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} })
  }))
}));

describe('AI Service', () => {
  describe('generateQuestions', () => {
    it('should generate questions based on parameters', async () => {
      const industry = 'SaaS';
      const businessStage = 'Growth';
      const customerSegment = 'B2B';
      const topic = 'Customer Satisfaction';
      const count = 5;
      
      const questions = await aiService.generateQuestions(
        industry, 
        businessStage, 
        customerSegment, 
        topic, 
        count
      );
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(count);
      
      // Check question structure
      questions.forEach(question => {
        expect(question).toHaveProperty('question_text');
        expect(question).toHaveProperty('description');
        expect(question).toHaveProperty('question_type');
        expect(question).toHaveProperty('question_type_id');
        expect(question).toHaveProperty('is_required');
        expect(question).toHaveProperty('settings');
        expect(question).toHaveProperty('order_position');
      });
    });
  });
  
  describe('improveQuestion', () => {
    it('should improve a question with suggestions', async () => {
      const originalQuestion = 'Do you like our product?';
      const context = 'SaaS platform';
      
      const result = await aiService.improveQuestion(originalQuestion, context);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('original', originalQuestion);
      expect(result).toHaveProperty('improved');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.improved).not.toBe(originalQuestion);
      expect(result.improved.includes(context)).toBe(true);
    });
    
    it('should handle questions without context', async () => {
      const originalQuestion = 'How good is our service?';
      
      const result = await aiService.improveQuestion(originalQuestion);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('original', originalQuestion);
      expect(result).toHaveProperty('improved');
      expect(result.improved).not.toBe(originalQuestion);
    });
  });
  
  describe('translateSurvey', () => {
    it('should translate survey questions to the target language', async () => {
      const questions = [
        {
          id: 'q1',
          question_text: 'How satisfied are you with our product?',
          description: 'Rate on a scale from 1 to 5'
        },
        {
          id: 'q2',
          question_text: 'What features would you like to see added?',
          description: null
        }
      ];
      
      const targetLanguage = 'Spanish';
      
      const result = await aiService.translateSurvey(questions, targetLanguage);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(questions.length);
      
      // Check that questions were translated
      result.forEach((translatedQuestion, index) => {
        expect(translatedQuestion).toHaveProperty('id', questions[index].id);
        expect(translatedQuestion.question_text).not.toBe(questions[index].question_text);
      });
    });
  });
  
  describe('analyzeResponses', () => {
    it('should return analysis results for survey responses', async () => {
      const surveyId = 'survey-123';
      
      const result = await aiService.analyzeResponses(surveyId, true);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('survey_id', surveyId);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('common_themes');
      expect(result).toHaveProperty('recommendations');
    });
  });
  
  describe('extractThemes', () => {
    it('should extract themes from survey responses', async () => {
      const surveyId = 'survey-123';
      const options = { minThemeCount: 3, maxThemes: 5 };
      
      const result = await aiService.extractThemes(surveyId, options);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('themes');
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result).toHaveProperty('keyPhrases');
      expect(Array.isArray(result.keyPhrases)).toBe(true);
      
      // Check theme structure
      result.themes.forEach(theme => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('count');
        expect(theme).toHaveProperty('sentiment');
        expect(theme).toHaveProperty('keyPhrases');
      });
    });
  });
  
  describe('generateInsights', () => {
    it('should generate business insights from survey data', async () => {
      const surveyId = 'survey-123';
      
      const result = await aiService.generateInsights(surveyId);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('strengths');
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(result).toHaveProperty('weaknesses');
      expect(Array.isArray(result.weaknesses)).toBe(true);
      expect(result).toHaveProperty('opportunities');
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });
}); 