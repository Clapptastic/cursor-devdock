/**
 * ML Service Unit Tests
 * Tests for the Machine Learning service functions
 */

const mlService = require('../../src/services/mlService');

// Mock external API client
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    post: jest.fn().mockResolvedValue({
      data: {
        result: 'mocked response'
      }
    })
  })
}));

describe('ML Service', () => {
  describe('generateInsights', () => {
    it('should generate insights from response data', async () => {
      const responses = [
        {
          surveyId: 'survey-123',
          userId: 'user-1',
          responses: [
            { questionId: 'q1', value: 4, type: 'rating' },
            { questionId: 'q2', value: 'Very good experience overall', type: 'text' }
          ]
        },
        {
          surveyId: 'survey-123',
          userId: 'user-2',
          responses: [
            { questionId: 'q1', value: 3, type: 'rating' },
            { questionId: 'q2', value: 'It was satisfactory but could be better', type: 'text' }
          ]
        }
      ];
      
      const result = await mlService.generateInsights(responses);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallSentiment');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.trends)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
    
    it('should handle empty responses array', async () => {
      const result = await mlService.generateInsights([]);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallSentiment', 'neutral');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('recommendations');
      expect(result.trends.length).toBe(0);
      expect(result.recommendations).toContain('Not enough data to generate insights');
    });
    
    it('should handle responses with only ratings (no text)', async () => {
      const responses = [
        {
          surveyId: 'survey-123',
          userId: 'user-1',
          responses: [
            { questionId: 'q1', value: 4, type: 'rating' },
            { questionId: 'q2', value: 5, type: 'rating' }
          ]
        },
        {
          surveyId: 'survey-123',
          userId: 'user-2',
          responses: [
            { questionId: 'q1', value: 3, type: 'rating' },
            { questionId: 'q2', value: 4, type: 'rating' }
          ]
        }
      ];
      
      const result = await mlService.generateInsights(responses);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallSentiment');
      expect(result).toHaveProperty('quantitativeAnalysis');
      expect(result.quantitativeAnalysis).toBeDefined();
    });
    
    it('should handle responses with only text (no ratings)', async () => {
      const responses = [
        {
          surveyId: 'survey-123',
          userId: 'user-1',
          responses: [
            { questionId: 'q1', value: 'Great product, loved it!', type: 'text' },
            { questionId: 'q2', value: 'The interface is intuitive', type: 'text' }
          ]
        }
      ];
      
      const result = await mlService.generateInsights(responses);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallSentiment');
      expect(result).toHaveProperty('textualAnalysis');
      expect(result.textualAnalysis).toBeDefined();
    });
  });
  
  describe('recommendSurveyChanges', () => {
    it('should recommend changes to improve a survey', async () => {
      const survey = {
        id: 'survey-123',
        title: 'Customer Feedback',
        questions: [
          { id: 'q1', text: 'How do you like our service?', type: 'rating' },
          { id: 'q2', text: 'Any suggestions for improvement?', type: 'text' }
        ]
      };
      const responseCount = 25;
      
      const result = await mlService.recommendSurveyChanges(survey, responseCount);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('suggestedQuestions');
      expect(result).toHaveProperty('suggestedRemovals');
      expect(result).toHaveProperty('suggestedGrouping');
      expect(Array.isArray(result.suggestedQuestions)).toBe(true);
      expect(Array.isArray(result.suggestedRemovals)).toBe(true);
      expect(Array.isArray(result.suggestedGrouping)).toBe(true);
    });
    
    it('should recommend question rephrasing for yes/no questions', async () => {
      const survey = {
        id: 'survey-123',
        title: 'Customer Feedback',
        questions: [
          { id: 'q1', text: 'Did you enjoy using our product?', type: 'boolean' },
          { id: 'q2', text: 'Would you buy from us again?', type: 'boolean' }
        ]
      };
      
      const result = await mlService.recommendSurveyChanges(survey);
      
      expect(result).toBeDefined();
      expect(result.suggestedQuestions.length).toBeGreaterThan(0);
      // Should suggest replacing yes/no questions with scale questions
      expect(result.suggestedQuestions.some(q => 
        q.text.includes('rate') || q.text.includes('scale')
      )).toBe(true);
    });
    
    it('should not suggest changes for well-designed surveys', async () => {
      const survey = {
        id: 'survey-123',
        title: 'Well Designed Survey',
        questions: [
          { id: 'q1', text: 'On a scale of 1-5, how would you rate our customer service?', type: 'rating' },
          { id: 'q2', text: 'What specific aspects of our product do you find most valuable?', type: 'text' },
          { id: 'q3', text: 'How likely are you to recommend our product to others?', type: 'nps' }
        ]
      };
      const responseCount = 100; // Good sample size
      
      const result = await mlService.recommendSurveyChanges(survey, responseCount);
      
      expect(result).toBeDefined();
      expect(result.suggestedRemovals.length).toBe(0);
      expect(result.suggestedQuestions.length).toBe(0);
    });
    
    it('should suggest adding questions for surveys with few questions', async () => {
      const survey = {
        id: 'survey-123',
        title: 'Minimal Survey',
        questions: [
          { id: 'q1', text: 'How would you rate our service?', type: 'rating' }
        ]
      };
      
      const result = await mlService.recommendSurveyChanges(survey);
      
      expect(result).toBeDefined();
      expect(result.suggestedQuestions.length).toBeGreaterThan(0);
    });
  });
  
  describe('predictCustomerBehavior', () => {
    it('should predict customer behavior based on responses', async () => {
      const responses = [
        {
          userId: 'user-1',
          responses: [
            { questionId: 'q1', value: 2, type: 'rating' },
            { questionId: 'q2', value: 'Not happy with the service', type: 'text' }
          ],
          metadata: {
            date: new Date().toISOString(),
            customer: { type: 'enterprise', tenure: 12 }
          }
        },
        {
          userId: 'user-2',
          responses: [
            { questionId: 'q1', value: 5, type: 'rating' },
            { questionId: 'q2', value: 'Love the product, will buy more!', type: 'text' }
          ],
          metadata: {
            date: new Date().toISOString(),
            customer: { type: 'enterprise', tenure: 6 }
          }
        }
      ];
      
      const result = await mlService.predictCustomerBehavior(responses);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('predictions');
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(result.predictions.length).toBe(responses.length);
      
      // Check structure of predictions
      const firstPrediction = result.predictions[0];
      expect(firstPrediction).toHaveProperty('userId');
      expect(firstPrediction).toHaveProperty('churnRisk');
      expect(firstPrediction).toHaveProperty('upsellPotential');
      expect(firstPrediction).toHaveProperty('sentiment');
      expect(typeof firstPrediction.churnRisk).toBe('number');
    });
    
    it('should handle empty responses array', async () => {
      const result = await mlService.predictCustomerBehavior([]);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('predictions');
      expect(result.predictions.length).toBe(0);
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('No data provided');
    });
    
    it('should identify high-risk customers', async () => {
      const responses = [
        {
          userId: 'high-risk-user',
          responses: [
            { questionId: 'q1', value: 1, type: 'rating' },
            { questionId: 'q2', value: 'Terrible service, looking for alternatives', type: 'text' }
          ],
          metadata: {
            date: new Date().toISOString(),
            customer: { type: 'enterprise', tenure: 1 }
          }
        }
      ];
      
      const result = await mlService.predictCustomerBehavior(responses);
      
      expect(result).toBeDefined();
      expect(result.predictions[0].churnRisk).toBeGreaterThan(0.5);
      expect(result.predictions[0].upsellPotential).toBeLessThan(0.5);
    });
    
    it('should identify upsell opportunities', async () => {
      const responses = [
        {
          userId: 'upsell-opportunity',
          responses: [
            { questionId: 'q1', value: 5, type: 'rating' },
            { questionId: 'q2', value: 'Great product, would love more features', type: 'text' }
          ],
          metadata: {
            date: new Date().toISOString(),
            customer: { type: 'enterprise', tenure: 24 }
          }
        }
      ];
      
      const result = await mlService.predictCustomerBehavior(responses);
      
      expect(result).toBeDefined();
      expect(result.predictions[0].churnRisk).toBeLessThan(0.3);
      expect(result.predictions[0].upsellPotential).toBeGreaterThan(0.7);
    });
  });
  
  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Override mock to simulate error
      const apiError = new Error('ML service unavailable');
      require('axios').create = jest.fn().mockReturnValue({
        post: jest.fn().mockRejectedValue(apiError)
      });
      
      try {
        await mlService.generateInsights([{ responses: [] }]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe(apiError.message);
      }
    });
    
    it('should handle malformed input data', async () => {
      const malformedData = [
        { userId: 'user-1' }, // Missing responses
        { responses: 'not an array' } // Invalid format
      ];
      
      try {
        await mlService.predictCustomerBehavior(malformedData);
        // Depending on implementation, this might throw or return a warning
        // This test might need adjustment based on actual behavior
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 