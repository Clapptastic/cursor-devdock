/**
 * NLP Service
 * 
 * Provides natural language processing functionality for the AI service.
 */

/**
 * Extracts key phrases from text
 * @param {string} text - The text to analyze
 * @returns {Promise<string[]>} - Array of key phrases
 */
const extractKeyPhrases = async (text) => {
  if (!text || text.length < 5) return [];
  
  // Simplified key phrase extraction
  const words = text.toLowerCase().replace(/[.,?!;:()]/g, '').split(' ');
  const phrases = [];
  
  // Extract 2-word phrases that might be important
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 3 && words[i+1].length > 3) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
  }
  
  // Return up to 3 key phrases
  return phrases.slice(0, 3);
};

/**
 * Analyzes sentiment in text
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} - Sentiment analysis results
 */
const analyzeSentiment = async (text) => {
  if (!text) {
    return {
      sentiment: 'neutral',
      score: 0,
      keyPhrases: []
    };
  }
  
  const lowercasedText = text.toLowerCase();
  
  // Simple sentiment analysis implementation
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'helpful', 'perfect'];
  const negativeWords = ['bad', 'poor', 'terrible', 'horrible', 'hate', 'dislike', 'difficult', 'disappointing'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowercasedText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowercasedText.includes(word)) negativeCount++;
  });
  
  const score = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
  let sentiment = 'neutral';
  
  if (score > 0.3) sentiment = 'positive';
  else if (score < -0.3) sentiment = 'negative';
  
  return {
    sentiment,
    score: parseFloat(score.toFixed(2)),
    keyPhrases: await extractKeyPhrases(text)
  };
};

/**
 * Classifies text into categories
 * @param {string} text - The text to classify
 * @returns {Promise<string[]>} - Array of categories
 */
const classifyText = async (text) => {
  if (!text) return [];
  
  const categories = [];
  
  // Simple classification logic
  if (text.toLowerCase().includes('product')) categories.push('product');
  if (text.toLowerCase().includes('service')) categories.push('service');
  if (text.toLowerCase().includes('support')) categories.push('support');
  if (text.toLowerCase().includes('price')) categories.push('pricing');
  if (text.toLowerCase().includes('feature')) categories.push('feature');
  if (text.toLowerCase().includes('bug')) categories.push('bug');
  if (text.toLowerCase().includes('improve')) categories.push('improvement');
  if (text.toLowerCase().includes('suggest')) categories.push('suggestion');
  
  // If no specific categories found, classify as feedback
  if (categories.length === 0) categories.push('feedback');
  
  return categories;
};

module.exports = {
  analyzeSentiment,
  extractKeyPhrases,
  classifyText
}; 