/**
 * NLP Service Unit Tests
 * Tests for the Natural Language Processing service functions
 */

const nlpService = require('../../src/services/nlpService');

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

describe('NLP Service', () => {
  describe('extractKeyPhrases', () => {
    it('should extract key phrases from text', async () => {
      const text = 'The customer service was excellent. The interface is intuitive and easy to use.';
      
      const result = await nlpService.extractKeyPhrases(text);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
    
    it('should handle empty input', async () => {
      const result = await nlpService.extractKeyPhrases('');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it('should handle very short input', async () => {
      const result = await nlpService.extractKeyPhrases('Hi');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it('should handle long input text', async () => {
      const longText = 'This is a very long text that contains multiple sentences. ' +
        'It should be processed correctly by the key phrase extraction algorithm. ' +
        'Key phrases should be identified based on relevance and importance. ' +
        'The algorithm should be able to handle this amount of text without issues.';
      
      const result = await nlpService.extractKeyPhrases(longText);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
  
  describe('analyzeSentiment', () => {
    it('should analyze sentiment and return score and label', async () => {
      const text = 'I really love this product, it works great!';
      
      const result = await nlpService.analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('score');
      expect(typeof result.score).toBe('number');
      expect(result.sentiment).toBe('positive');
    });
    
    it('should handle negative sentiment', async () => {
      const text = 'This is terrible, I hate it and will never use it again.';
      
      const result = await nlpService.analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });
    
    it('should handle neutral sentiment', async () => {
      const text = 'This is a product. It has features.';
      
      const result = await nlpService.analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBeGreaterThanOrEqual(-0.3);
      expect(result.score).toBeLessThanOrEqual(0.3);
    });
    
    it('should handle empty input', async () => {
      const result = await nlpService.analyzeSentiment('');
      
      expect(result).toBeDefined();
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0);
    });
    
    it('should handle mixed sentiment text', async () => {
      const text = 'I like the design but dislike the functionality. Some features are good, others are terrible.';
      
      const result = await nlpService.analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('score');
      // Mixed sentiment could be slightly positive, negative, or neutral
      expect(result.sentiment).toBeDefined();
    });
  });
  
  describe('classifyText', () => {
    it('should classify text into categories', async () => {
      const text = 'The app crashes frequently when I try to save my preferences.';
      
      const result = await nlpService.classifyText(text);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('bug');
    });
    
    it('should handle feature request text', async () => {
      const text = 'It would be great if you could add dark mode to the app.';
      
      const result = await nlpService.classifyText(text);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('feature_request');
    });
    
    it('should handle positive feedback', async () => {
      const text = 'I absolutely love the new interface design, it looks fantastic!';
      
      const result = await nlpService.classifyText(text);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('positive_feedback');
    });
    
    it('should handle empty input', async () => {
      const result = await nlpService.classifyText('');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it('should handle ambiguous text', async () => {
      const text = 'This is just some general text without a clear category.';
      
      const result = await nlpService.classifyText(text);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // It might be classified as general_feedback or other
      expect(result.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Override mock to simulate error
      const errorMessage = 'Service unavailable';
      require('axios').create = jest.fn().mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error(errorMessage))
      });
      
      try {
        await nlpService.analyzeSentiment('Test text');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe(errorMessage);
      }
    });
  });
}); 