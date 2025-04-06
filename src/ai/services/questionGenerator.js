const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Anthropic client
const anthropic = new Anthropic(process.env.ANTHROPIC_API_KEY);

/**
 * Generate survey questions based on business context and target audience
 * @param {string} businessContext - Information about the business
 * @param {string} targetAudience - Information about the target audience
 * @param {number} numQuestions - Number of questions to generate
 * @param {string} surveyType - Type of survey (customer feedback, product, etc.)
 * @returns {Array} - Array of generated question objects
 */
const generateQuestions = async (
  businessContext,
  targetAudience,
  numQuestions = 5,
  surveyType = 'customer feedback'
) => {
  try {
    const prompt = `
Generate ${numQuestions} effective survey questions for a ${surveyType} survey.

Business Context:
${businessContext}

Target Audience:
${targetAudience}

The questions should be diverse, focused on getting valuable insights, and appropriate for the target audience.
For each question, specify:
1. The question text
2. The question type (text, multiplechoice, checkbox, rating, boolean)
3. If it's multiple choice or checkbox, provide the options
4. Whether the question is required

Format the response as an array of JSON objects that can be directly used in a JavaScript application.
`;

    const response = await anthropic.completions.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens_to_sample: 2000,
      temperature: 0.7,
      prompt: `${Anthropic.HUMAN_PROMPT} ${prompt} ${Anthropic.AI_PROMPT}`,
    });

    // Extract the JSON array from the response
    const completionText = response.completion;
    
    // Find the JSON part in the response (looking for array between brackets)
    const jsonMatch = completionText.match(/\[\s*\{.*\}\s*\]/s);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON data from AI response');
    }
    
    const jsonString = jsonMatch[0];
    const questions = JSON.parse(jsonString);
    
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

module.exports = {
  generateQuestions,
}; 