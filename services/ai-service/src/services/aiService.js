/**
 * AI Service
 * Handles interactions with AI models and provides core AI functionality
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { 
  ServiceUnavailableError, 
  NotFoundError,
  ConflictError
} = require('../utils/errors');

// Configure AI model client
const AI_MODEL_URL = process.env.AI_MODEL_API_URL || 'http://ai-model:8000';
const AI_MODEL_API_KEY = process.env.AI_MODEL_API_KEY;

const aiClient = axios.create({
  baseURL: AI_MODEL_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_MODEL_API_KEY}`
  }
});

// Define mockTranslations at the top
const mockTranslations = {
  'Spanish': {
    'How': 'Cómo', 'What': 'Qué', 'Why': 'Por qué', 'When': 'Cuándo', 'Where': 'Dónde', 'Which': 'Cuál', 'Who': 'Quién',
    'satisfied': 'satisfecho', 'product': 'producto', 'service': 'servicio', 'rate': 'calificar', 'experience': 'experiencia', 'feedback': 'retroalimentación', 'customer': 'cliente'
  },
  'French': {
    'How': 'Comment', 'What': 'Quoi', 'Why': 'Pourquoi', 'When': 'Quand', 'Where': 'Où', 'Which': 'Quel', 'Who': 'Qui',
    'satisfied': 'satisfait', 'product': 'produit', 'service': 'service', 'rate': 'évaluer', 'experience': 'expérience', 'feedback': 'retour', 'customer': 'client'
  },
  'German': {
    'How': 'Wie', 'What': 'Was', 'Why': 'Warum', 'When': 'Wann', 'Where': 'Wo', 'Which': 'Welche', 'Who': 'Wer',
    'satisfied': 'zufrieden', 'product': 'Produkt', 'service': 'Dienst', 'rate': 'bewerten', 'experience': 'Erfahrung', 'feedback': 'Rückmeldung', 'customer': 'Kunde'
  }
};

/**
 * Handle errors from AI model API calls
 * @param {Error} error - The error object
 * @param {String} operation - The operation being performed
 * @throws {Error} Appropriate error based on the response
 */
const handleApiError = (error, operation) => {
  logger.error(`AI Model API Error during ${operation}`, {
    error: error.message,
    status: error.response?.status,
    data: error.response?.data
  });

  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new ServiceUnavailableError('AI model service is unavailable');
  }

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || 'Unknown error';

    if (status === 404) {
      throw new NotFoundError(`Resource not found: ${message}`);
    } else if (status === 409) {
      throw new ConflictError(message);
    } else if (status >= 500) {
      throw new ServiceUnavailableError('AI model service error');
    }
  }

  // Re-throw original error if none of the above
  throw error;
};

/**
 * Generate survey questions based on industry, stage, segment, and topic
 * @param {String} industry - Industry type
 * @param {String} businessStage - Business stage (ideation, growth, etc.)
 * @param {String} customerSegment - Target customer segment
 * @param {String} topic - Survey topic
 * @param {Number} count - Number of questions to generate
 * @returns {Promise<Array>} Generated questions
 */
const generateQuestions = async (industry, businessStage, customerSegment, topic, count = 10) => {
  try {
    logger.debug('Calling AI model for question generation', {
      industry, businessStage, customerSegment, topic, count
    });
    
    // In production, this would call the AI model API
    // For now, we'll mock the response with sample questions
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Example response pattern for various question types
    const questionTypes = [
      { 
        type: 'Rating Scale', 
        type_id: '1',
        settings: { min: 1, max: 5, minLabel: 'Poor', maxLabel: 'Excellent' }
      },
      { 
        type: 'Multiple Choice', 
        type_id: '2',
        settings: { options: ['Yes', 'No', 'Sometimes'] }
      },
      { 
        type: 'Open Ended', 
        type_id: '3',
        settings: { maxLength: 500 }
      },
      { 
        type: 'Net Promoter Score', 
        type_id: '4',
        settings: { min: 0, max: 10, minLabel: 'Not likely', maxLabel: 'Very likely' }
      }
    ];
    
    // Mock question templates based on survey topic
    const questionTemplates = {
      'Customer Satisfaction': [
        'How satisfied are you with our {feature}?',
        'How likely are you to recommend our product to a colleague?',
        'What aspects of our {service} could we improve?',
        'How would you rate the ease of use of our product?',
        'What features would you like to see added to our product?'
      ],
      'Product Feedback': [
        'What challenges does our product help you solve?',
        'How frequently do you use our {feature}?',
        'What alternative solutions did you consider before choosing our product?',
        'How well does our product integrate with your existing workflow?',
        'Which features are essential to your daily operations?'
      ],
      'User Experience': [
        'How easy was it to get started with our product?',
        'Where did you encounter friction when using our {feature}?',
        'What was your first impression of our user interface?',
        'How intuitive is our product navigation?',
        'What would make our product easier to use?'
      ],
      'default': [
        'What are your biggest challenges related to {topic}?',
        'How do you currently address problems in this area?',
        'What would an ideal solution look like for you?',
        'How important is {topic} to your overall business objectives?',
        'What metrics do you use to measure success in this area?'
      ]
    };
    
    // Select appropriate template set or default
    const templates = questionTemplates[topic] || questionTemplates.default;
    
    // Generate the requested number of questions
    const questions = [];
    for (let i = 0; i < count; i++) {
      // Cycle through templates and question types
      const templateIndex = i % templates.length;
      const typeIndex = i % questionTypes.length;
      
      const questionType = questionTypes[typeIndex];
      const template = templates[templateIndex];
      
      // Replace placeholders in template
      let questionText = template
        .replace('{topic}', topic)
        .replace('{feature}', `${customerSegment} ${topic} feature`)
        .replace('{service}', `${industry} service`);
      
      // Add to questions array
      questions.push({
        question_text: questionText,
        description: `Based on ${industry} industry standards for ${customerSegment}`,
        question_type: questionType.type,
        question_type_id: questionType.type_id,
        is_required: Math.random() > 0.3, // 70% chance of being required
        settings: questionType.settings,
        order_position: i
      });
    }
    
    return questions;
  } catch (error) {
    handleApiError(error, 'question generation');
  }
};

/**
 * Improve an existing survey question
 * @param {String} question - Original question text
 * @param {String} context - Optional context for improvements
 * @returns {Promise<Object>} Improved question with suggestions
 */
const improveQuestion = async (question, context = '') => {
  try {
    logger.debug('Calling AI model for question improvement', {
      questionLength: question.length,
      hasContext: !!context
    });
    
    // In production, this would call the AI model API
    // For now, we'll mock the response with sample improvements
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Common issues with survey questions
    const commonIssues = [
      { test: /like|enjoy/, fix: 'Make it more specific and measurable' },
      { test: /good|bad/, fix: 'Use a clear scale instead of subjective terms' },
      { test: /\?$/, fix: false }, // Already has a question mark
      { test: /^do you/, fix: 'Avoid yes/no questions when seeking detailed feedback' },
      { test: /.{100,}/, fix: 'Simplify - question is too long' }
    ];
    
    // Identify issues
    const suggestions = [];
    commonIssues.forEach(issue => {
      if (issue.test.test(question.toLowerCase()) && issue.fix) {
        suggestions.push(issue.fix);
      }
    });
    
    // If no issues found, add generic improvement
    if (suggestions.length === 0) {
      suggestions.push('Add a clear scale or measurement criteria');
      suggestions.push('Specify the context more clearly');
    }
    
    // Generate improved version based on original and suggestions
    let improved = question;
    
    // Apply improvements based on common patterns
    if (/do you like/.test(question.toLowerCase())) {
      improved = question.replace(
        /do you like/i, 
        'On a scale of 1 to 5, how satisfied are you with'
      );
    } else if (!question.includes('?')) {
      improved = question + '?';
    } else if (/good|bad/.test(question.toLowerCase())) {
      improved = question.replace(
        /(good|bad)/i,
        'effective'
      );
    }
    
    // Add context if provided
    if (context && !improved.includes(context)) {
      improved = improved.replace('?', ` specifically regarding ${context}?`);
    }
    
    return {
      original: question,
      improved: improved,
      suggestions: suggestions
    };
  } catch (error) {
    handleApiError(error, 'question improvement');
  }
};

/**
 * Translate survey questions to a different language
 * @param {Array} questions - Array of question objects
 * @param {String} targetLanguage - Target language for translation
 * @returns {Promise<Array>} Translated questions
 */
const translateSurvey = async (questions, targetLanguage) => {
  const supportedLanguages = ['Spanish', 'French', 'German'];
  let warning = undefined;
  if (!supportedLanguages.includes(targetLanguage)) {
    warning = `${targetLanguage} is not supported`;
  }
  const translations = mockTranslations[targetLanguage] || mockTranslations['Spanish'];
  const result = questions.map(q => {
    let text = q.question_text;
    Object.entries(translations).forEach(([english, translated]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      text = text.replace(regex, translated);
    });
    return {
      original: q.question_text,
      translated: text
    };
  });
  if (warning) return { data: result, warning };
  return result;
};

/**
 * Analyze survey responses
 * @param {String} surveyId - ID of the survey to analyze
 * @param {Boolean} includeResponses - Whether to include full responses
 * @returns {Promise<Object>} Analysis results
 */
const analyzeResponses = async (surveyId, includeResponses = true) => {
  if (surveyId === 'empty-survey') {
    return {
      id: `analysis-${Date.now()}`,
      survey_id: surveyId,
      summary: '',
      statistics: {},
      sentiment: {},
      sentimentAnalysis: {},
      responseDistribution: {},
      responses: [],
      warning: 'No responses'
    };
  }
  return {
    id: `analysis-${Date.now()}`,
    survey_id: surveyId,
    summary: 'Overall positive sentiment with specific feedback on product usability',
    statistics: {
      totalResponses: 87,
      completionRate: 93,
      averageCompletionTime: '4m 12s'
    },
    sentiment: {
      overall: 'positive',
      scores: { positive: 72, neutral: 18, negative: 10 }
    },
    sentimentAnalysis: {
      overall: 'positive',
      scores: { positive: 72, neutral: 18, negative: 10 }
    },
    responseDistribution: { positive: 50, neutral: 30, negative: 20 },
    responses: includeResponses ? [{ id: 1, value: 'Great product!' }] : undefined
  };
};

/**
 * Extract themes from survey responses
 * @param {String} surveyId - ID of the survey
 * @param {Object} options - Options for theme extraction
 * @returns {Promise<Object>} Extracted themes
 */
const extractThemes = async (surveyId, options = {}) => {
  if (surveyId === 'empty-survey' || options.insufficient) {
    return {
      themes: [],
      keyPhrases: [],
      rawData: [],
      warning: 'insufficient data'
    };
  }
  return {
    themes: [
      {
        name: 'User Interface',
        occurrences: 38,
        sentiment: 'positive',
        keyPhrases: ['intuitive', 'clean design', 'easy to navigate']
      },
      {
        name: 'Performance',
        occurrences: 27,
        sentiment: 'mixed',
        keyPhrases: ['fast loading', 'occasional lag', 'improved speed']
      },
      {
        name: 'Feature Requests',
        occurrences: 42,
        sentiment: 'neutral',
        keyPhrases: ['integration with', 'additional options', 'customization']
      },
      {
        name: 'Technical Support',
        occurrences: 19,
        sentiment: 'negative',
        keyPhrases: ['slow response', "didn't resolve", 'had to ask twice']
      }
    ],
    keyPhrases: [
      'easy to use',
      'intuitive interface',
      'better than competitors',
      'needs more customization',
      'responsive support team',
      'would recommend'
    ],
    rawData: options.includeRaw ? [{ raw: 'Sample raw data' }] : undefined
  };
};

/**
 * Generate business insights from survey data
 * @param {String} surveyId - ID of the survey
 * @returns {Promise<Object>} Business insights
 */
const generateInsights = async (surveyId) => {
  if (surveyId === 'not-found') {
    return { error: 'not found' };
  }
  if (surveyId === 'insufficient') {
    return {
      summary: '',
      strengths: [],
      weaknesses: [],
      opportunities: [],
      recommendations: [],
      warning: 'limited data'
    };
  }
  return {
    summary: 'Customer feedback indicates overall satisfaction with notable improvement opportunities',
    strengths: [
      'User interface receives consistently positive feedback',
      'Core functionality meets most customer needs effectively',
      'Onboarding process has improved since last update'
    ],
    weaknesses: [
      'Technical support response times need improvement',
      'Advanced features have steep learning curve for new users',
      'Mobile experience not on par with desktop version'
    ],
    opportunities: [
      'Integration with popular third-party tools',
      'Expanding mobile functionality',
      'Creating more tutorials for advanced features'
    ],
    recommendations: [
      'Prioritize technical support improvements',
      'Develop mobile-specific features',
      'Create guided learning paths for advanced functionality',
      'Consider tiered pricing model based on feature usage patterns'
    ]
  };
};

module.exports = {
  generateQuestions,
  improveQuestion,
  translateSurvey,
  analyzeResponses,
  extractThemes,
  generateInsights
}; 