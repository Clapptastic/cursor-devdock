/**
 * AI Service
 * 
 * Provides AI-powered analysis, insights, and recommendations
 * based on survey responses and user behavior.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { successResponse, errorResponse } = require('./utils/responseHelper');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'success',
    service: 'ai-service',
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
});

// Mock NLP functions
const generateSentiment = (text) => {
  if (!text) return { score: 0, label: 'neutral' };
  
  const lowercasedText = text.toLowerCase();
  
  // Very simple sentiment analysis simulation
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
  let label = 'neutral';
  
  if (score > 0.3) label = 'positive';
  else if (score < -0.3) label = 'negative';
  
  return { score: parseFloat(score.toFixed(2)), label };
};

const extractKeyPhrases = (text) => {
  if (!text || text.length < 5) return [];
  
  // Simplified key phrase extraction simulation
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

// API Routes
// Analyze text responses
app.post('/analyze/text', (req, res) => {
  const { text } = req.body;
  
  if (typeof text !== 'string') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Text input must be a string' });
  }
  
  const sentiment = generateSentiment(text);
  const keyPhrases = extractKeyPhrases(text);
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    success: true,
    sentiment,
    keyPhrases,
    wordCount: text.split(' ').filter(word => word.length > 0).length,
    analysisTimestamp: new Date().toISOString()
  });
});

// Generate insights from responses
app.post('/insights', (req, res) => {
  const { responses } = req.body;
  
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Valid responses array is required' });
  }
  
  const textResponses = responses.filter(r => 
    r.responses && Array.isArray(r.responses) && r.responses.some(a => typeof a.value === 'string' && a.value.length > 5)
  );
  
  const ratingResponses = responses.filter(r => 
    r.responses && Array.isArray(r.responses) && r.responses.some(a => typeof a.value === 'number')
  );
  
  const insights = {
    totalResponses: responses.length,
    responseAnalysis: {
      averageSentiment: 0,
      commonTopics: [],
      keyTakeaways: []
    },
    improvement: {
      areas: [],
      suggestions: []
    }
  };
  
  if (textResponses.length > 0) {
    let totalSentiment = 0;
    const topicsMap = {};
    
    textResponses.forEach(response => {
      response.responses.forEach(answer => {
        if (typeof answer.value === 'string' && answer.value.length > 5) {
          const sentiment = generateSentiment(answer.value);
          totalSentiment += sentiment.score;
          
          const phrases = extractKeyPhrases(answer.value);
          phrases.forEach(phrase => {
            topicsMap[phrase] = (topicsMap[phrase] || 0) + 1;
          });
        }
      });
    });
    
    insights.responseAnalysis.averageSentiment = parseFloat(
      (totalSentiment / textResponses.length).toFixed(2)
    );
    
    const sortedTopics = Object.entries(topicsMap)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5);
    
    insights.responseAnalysis.commonTopics = sortedTopics;
    
    if (insights.responseAnalysis.averageSentiment > 0.2) {
      insights.responseAnalysis.keyTakeaways.push(
        "Overall positive sentiment detected in responses",
        "Users are generally satisfied with the service/product"
      );
    } else if (insights.responseAnalysis.averageSentiment < -0.2) {
      insights.responseAnalysis.keyTakeaways.push(
        "Overall negative sentiment detected in responses",
        "Users are expressing dissatisfaction with certain aspects"
      );
    } else {
      insights.responseAnalysis.keyTakeaways.push(
        "Mixed or neutral sentiment detected in responses",
        "Users have varying opinions about the service/product"
      );
    }
    
    if (sortedTopics.length > 0) {
      insights.responseAnalysis.keyTakeaways.push(
        `Multiple mentions of "${sortedTopics[0]}" in responses`
      );
    }
  }
  
  if (ratingResponses.length > 0) {
    const questionRatings = {};
    
    ratingResponses.forEach(response => {
      response.responses.forEach(answer => {
        if (typeof answer.value === 'number') {
          if (!questionRatings[answer.questionId]) {
            questionRatings[answer.questionId] = { sum: 0, count: 0 };
          }
          questionRatings[answer.questionId].sum += answer.value;
          questionRatings[answer.questionId].count += 1;
        }
      });
    });
    
    Object.entries(questionRatings).forEach(([questionId, { sum, count }]) => {
      const averageRating = sum / count;
      if (averageRating < 3) {
        insights.improvement.areas.push(`Improve question ${questionId}`);
        insights.improvement.suggestions.push(`Consider revising question ${questionId} to better capture user feedback.`);
      }
    });
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    success: true,
    insights
  });
});

// Generate survey recommendations
app.post('/recommend/survey', (req, res) => {
  const { industry, target, goals } = req.body;
  
  if (!industry || !target || !Array.isArray(goals) || goals.length === 0) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const recommendedQuestions = goals.map(goal => {
    switch (goal) {
      case 'customer_satisfaction':
        return { text: 'How satisfied are you with our product?', type: 'rating' };
      case 'product_feedback':
        return { text: 'What features would you like to see added?', type: 'text' };
      default:
        return { text: 'Please provide your feedback.', type: 'text' };
    }
  });
  
  const bestPractices = [
    'Keep surveys short and focused',
    'Use clear and concise language',
    'Offer incentives for completion'
  ];
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    success: true,
    surveyTitle: `${industry} Survey for ${target}`,
    estimatedCompletionTime: '5 minutes',
    recommendedQuestions,
    bestPractices
  });
});

// Generate survey questions
app.post('/generate-questions', async (req, res) => {
  try {
    const { industry, businessStage, customerSegment, topic, count = 10 } = req.body;
    const questions = await require('./services/aiService').generateQuestions(
      industry, businessStage, customerSegment, topic, count
    );
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(successResponse(questions, `Successfully generated ${questions.length} questions for ${topic}`));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse(error.message));
  }
});

// Improve a question
app.post('/improve-question', async (req, res) => {
  try {
    const { question, context } = req.body;
    const improved = await require('./services/aiService').improveQuestion(question, context);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(successResponse(improved, 'Question successfully improved'));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse(error.message));
  }
});

// Translate survey questions
app.post('/translate-survey', async (req, res) => {
  try {
    const { questions, targetLanguage } = req.body;
    const translated = await require('./services/aiService').translateSurvey(questions, targetLanguage);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(successResponse(translated, `Successfully translated ${translated.length} questions to ${targetLanguage}`));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse(error.message));
  }
});

// Analyze survey responses
app.post('/analyze-responses', async (req, res) => {
  try {
    const { survey_id, includeResponses = true } = req.body;
    const analysis = await require('./services/aiService').analyzeResponses(survey_id, includeResponses);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(successResponse(analysis, 'Survey responses analyzed successfully'));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse(error.message));
  }
});

// Extract themes from survey responses
app.post('/extract-themes', async (req, res) => {
  try {
    const { survey_id, options = {} } = req.body;
    const themes = await require('./services/aiService').extractThemes(survey_id, options);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(successResponse(themes, 'Themes extracted successfully'));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse(error.message));
  }
});

// Generate insights from survey data
app.post('/generate-insights', async (req, res) => {
  try {
    const { survey_id } = req.body;
    const insights = await require('./services/aiService').generateInsights(survey_id);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(successResponse(insights, 'Insights generated successfully'));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(errorResponse(error.message));
  }
});

// Fallback for undefined routes
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`AI Service is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for testing
module.exports = app;