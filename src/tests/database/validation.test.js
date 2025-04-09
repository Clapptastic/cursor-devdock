/**
 * Database validation tests
 */
const mongoose = require('mongoose');
const {
  validateUser,
  validateSurvey,
  validateTemplate,
  validateResponse,
  validateAnalysis
} = require('../../database/validation');
const {
  sampleUserData,
  sampleSurveyData,
  sampleTemplateData,
  sampleResponseData,
  sampleAnalysisData
} = require('../../database/testUtils');

describe('Database Validation', () => {
  describe('User Validation', () => {
    it('should validate a valid user', () => {
      const userData = sampleUserData();
      const { error } = validateUser(userData);
      expect(error).toBeUndefined();
    });

    it('should require a name', () => {
      const userData = sampleUserData({ name: undefined });
      const { error } = validateUser(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should require a valid email', () => {
      const userData = sampleUserData({ email: 'invalid-email' });
      const { error } = validateUser(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should require a password with at least 6 characters', () => {
      const userData = sampleUserData({ password: '12345' });
      const { error } = validateUser(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('should validate role is either user or admin', () => {
      const userData = sampleUserData({ role: 'superuser' });
      const { error } = validateUser(userData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('role');
    });
  });

  describe('Survey Validation', () => {
    it('should validate a valid survey', () => {
      const surveyData = sampleSurveyData();
      const { error } = validateSurvey(surveyData);
      expect(error).toBeUndefined();
    });

    it('should require a title', () => {
      const surveyData = sampleSurveyData({ title: undefined });
      const { error } = validateSurvey(surveyData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('title');
    });

    it('should require at least one question', () => {
      const surveyData = sampleSurveyData({ questions: [] });
      const { error } = validateSurvey(surveyData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('questions');
    });
    
    it('should validate question types', () => {
      const invalidQuestion = {
        text: 'Invalid question',
        type: 'invalid-type',
        required: true
      };
      
      const surveyData = sampleSurveyData({
        questions: [invalidQuestion]
      });
      
      const { error } = validateSurvey(surveyData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('type');
    });
    
    it('should require options for multiplechoice questions', () => {
      const invalidQuestion = {
        text: 'Multiple choice question',
        type: 'multiplechoice',
        required: true,
        options: []
      };
      
      const surveyData = sampleSurveyData({
        questions: [invalidQuestion]
      });
      
      const { error } = validateSurvey(surveyData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('options');
    });
  });

  describe('Template Validation', () => {
    it('should validate a valid template', () => {
      const templateData = sampleTemplateData();
      const { error } = validateTemplate(templateData);
      expect(error).toBeUndefined();
    });

    it('should require a name', () => {
      const templateData = sampleTemplateData({ name: undefined });
      const { error } = validateTemplate(templateData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('name');
    });

    it('should require a category', () => {
      const templateData = sampleTemplateData({ category: undefined });
      const { error } = validateTemplate(templateData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('category');
    });
  });

  describe('Response Validation', () => {
    it('should validate a valid response', () => {
      const responseData = sampleResponseData();
      const { error } = validateResponse(responseData);
      expect(error).toBeUndefined();
    });

    it('should require a survey reference', () => {
      const responseData = sampleResponseData({ survey: undefined });
      const { error } = validateResponse(responseData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('survey');
    });
    
    it('should validate answer values based on question type', () => {
      // Valid answer with a boolean value for a boolean question
      const validAnswer = {
        questionId: new mongoose.Types.ObjectId().toString(),
        questionText: 'Do you agree?',
        questionType: 'boolean',
        value: true
      };
      
      // Invalid answer with a string value for a boolean question
      const invalidAnswer = {
        questionId: new mongoose.Types.ObjectId().toString(),
        questionText: 'Do you agree?',
        questionType: 'boolean',
        value: 'yes'
      };
      
      const validResponseData = sampleResponseData({
        answers: [validAnswer]
      });
      
      const invalidResponseData = sampleResponseData({
        answers: [invalidAnswer]
      });
      
      const { error: validError } = validateResponse(validResponseData);
      const { error: invalidError } = validateResponse(invalidResponseData);
      
      expect(validError).toBeUndefined();
      expect(invalidError).toBeDefined();
      expect(invalidError.details[0].path).toContain('value');
    });
  });

  describe('Analysis Validation', () => {
    it('should validate a valid analysis', () => {
      const analysisData = sampleAnalysisData();
      const { error } = validateAnalysis(analysisData);
      expect(error).toBeUndefined();
    });

    it('should require a survey reference', () => {
      const analysisData = sampleAnalysisData({ survey: undefined });
      const { error } = validateAnalysis(analysisData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('survey');
    });

    it('should require a summary', () => {
      const analysisData = sampleAnalysisData({ summary: undefined });
      const { error } = validateAnalysis(analysisData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('summary');
    });
    
    it('should validate sentiment values', () => {
      const invalidInsight = {
        question: 'What is your favorite color?',
        analysisText: 'Test analysis',
        sentiment: 'invalid-sentiment',
        keywords: ['test'],
        score: 5
      };
      
      const analysisData = sampleAnalysisData({
        insights: [invalidInsight]
      });
      
      const { error } = validateAnalysis(analysisData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('sentiment');
    });
  });
}); 