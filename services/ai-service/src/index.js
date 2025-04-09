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
  res.status(200).json({ status: 'UP', service: 'ai-service' });
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
  
  if (!text) {
    return res.status(400).json({ error: 'Text input is required' });
  }
  
  const sentiment = generateSentiment(text);
  const keyPhrases = extractKeyPhrases(text);
  
  res.status(200).json({
    sentiment,
    keyPhrases,
    wordCount: text.split(' ').length,
    analysisTimestamp: new Date().toISOString()
  });
});

// Generate insights from responses
app.post('/insights', (req, res) => {
  const { responses } = req.body;
  
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Valid responses array is required' });
  }
  
  // Generate mock insights
  const textResponses = responses.filter(r => 
    r.responses && r.responses.some(a => typeof a.value === 'string' && a.value.length > 5)
  );
  
  const ratingResponses = responses.filter(r => 
    r.responses && r.responses.some(a => typeof a.value === 'number')
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
  
  // Process text responses to extract sentiment and topics
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
    
    // Calculate average sentiment
    insights.responseAnalysis.averageSentiment = parseFloat(
      (totalSentiment / textResponses.length).toFixed(2)
    );
    
    // Sort topics by frequency
    const sortedTopics = Object.entries(topicsMap)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5);
    
    insights.responseAnalysis.commonTopics = sortedTopics;
    
    // Generate mock key takeaways
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
    
    // Add common topics to key takeaways
    if (sortedTopics.length > 0) {
      insights.responseAnalysis.keyTakeaways.push(
        `Multiple mentions of "${sortedTopics[0]}" in responses`
      );
    }
  }
  
  // Generate improvement areas based on ratings
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
    
    // Find questions with low average ratings
    const improvementAreas = [];
    Object.entries(questionRatings).forEach(([questionId, data]) => {
      const average = data.sum / data.count;
      if (average < 3) {
        improvementAreas.push({
          questionId,
          averageRating: parseFloat(average.toFixed(2))
        });
      }
    });
    
    insights.improvement.areas = improvementAreas.map(area => 
      `Question ID ${area.questionId} (avg: ${area.averageRating})`
    );
    
    if (improvementAreas.length > 0) {
      insights.improvement.suggestions.push(
        "Focus on improving areas with consistently low ratings",
        "Consider revising aspects mentioned in negative feedback",
        "Implement regular follow-ups with dissatisfied respondents"
      );
    } else {
      insights.improvement.suggestions.push(
        "Maintain current quality standards",
        "Consider introducing new features requested by users",
        "Share positive feedback with the team to boost morale"
      );
    }
  }
  
  res.status(200).json(insights);
});

// Generate survey recommendations
app.post('/recommend/survey', (req, res) => {
  const { industry, target, goals } = req.body;
  
  if (!industry || !target || !goals) {
    return res.status(400).json({ 
      error: 'Missing required parameters. Please provide industry, target audience, and goals' 
    });
  }
  
  // Mock survey recommendation generation
  const recommendations = {
    surveyTitle: `${industry} Customer Experience Survey`,
    estimatedCompletionTime: '5-7 minutes',
    recommendedQuestions: [
      {
        id: '1',
        text: `How would you rate your overall experience with our ${industry} services?`,
        type: 'rating',
        required: true
      },
      {
        id: '2',
        text: 'What aspects of our service did you find most valuable?',
        type: 'text',
        required: true
      },
      {
        id: '3',
        text: 'What improvements would you suggest to make our service better?',
        type: 'text',
        required: false
      },
      {
        id: '4',
        text: `How likely are you to recommend our ${industry} services to others?`,
        type: 'rating',
        required: true
      },
      {
        id: '5',
        text: 'Would you be interested in learning about our upcoming products/services?',
        type: 'boolean',
        required: false
      }
    ],
    bestPractices: [
      'Keep the survey concise and focused on key areas',
      'Begin with easy questions to increase completion rate',
      'Include a mix of quantitative and qualitative questions',
      'Ensure your survey is mobile-friendly',
      'Follow up with respondents to close the feedback loop'
    ]
  };
  
  // Customize based on goals
  if (goals.includes('customer_satisfaction')) {
    recommendations.recommendedQuestions.push({
      id: '6',
      text: 'What factors influenced your satisfaction level the most?',
      type: 'multiple_choice',
      options: ['Product quality', 'Customer service', 'Price', 'Ease of use', 'Other'],
      required: true
    });
  }
  
  if (goals.includes('product_feedback')) {
    recommendations.recommendedQuestions.push({
      id: '7',
      text: 'Which features do you use most frequently?',
      type: 'multiple_choice',
      options: ['Feature A', 'Feature B', 'Feature C', 'Feature D', 'Other'],
      required: true
    });
  }
  
  res.status(200).json(recommendations);
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