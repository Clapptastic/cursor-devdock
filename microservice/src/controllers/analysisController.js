/**
 * Advanced survey analysis controller for microservice
 * Provides specialized analysis for customer survey responses
 */
const asyncHandler = require('../middleware/asyncHandler');
const { getDB } = require('../config/database');
const { processData } = require('../utils/dataProcessingService');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Generate insights from survey responses
 * @route   POST /api/analysis/insights
 * @access  Private (API Key)
 */
const generateInsights = asyncHandler(async (req, res) => {
  const { data, options } = req.validatedData || req.body;
  
  if (!data || !Array.isArray(data)) {
    res.status(400);
    throw new Error('Valid survey response data array is required');
  }
  
  try {
    // First, perform advanced data processing
    const processedData = processData(data, {
      ...options,
      processingType: 'premium', // Use the most advanced processing
      calculateScores: true,
      includeMeta: true,
      normalize: true
    });
    
    // Extract insights from the processed data
    const insightsResult = {
      id: uuidv4(),
      original: data,
      insights: {
        summary: {
          responseCount: data.length,
          completionRate: calculateCompletionRate(data),
          averageTime: calculateAverageTime(data)
        },
        keyInsights: extractKeyInsights(processedData),
        recommendations: generateRecommendations(processedData),
        segments: identifySegments(processedData)
      },
      meta: {
        analysisType: 'insights',
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Store the insights results
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert({
        ...insightsResult,
        status: 'completed',
        source: options.source || 'insights-analysis',
        user_id: options.userId || null,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Insights generated successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
});

/**
 * @desc    Generate heatmap data for survey responses
 * @route   POST /api/analysis/heatmap
 * @access  Private (API Key)
 */
const generateHeatmap = asyncHandler(async (req, res) => {
  const { data, options } = req.validatedData || req.body;
  
  if (!data || !Array.isArray(data)) {
    res.status(400);
    throw new Error('Valid survey response data array is required');
  }
  
  try {
    // Generate heatmap data based on response patterns
    const heatmapData = {
      id: uuidv4(),
      original: data,
      heatmap: {
        // Extract field names for columns
        fields: extractFieldNames(data),
        // Generate heatmap rows for each response
        rows: data.map((item, index) => ({
          responseId: item.id || `response_${index}`,
          values: generateHeatmapValues(item)
        })),
        // Generate summary of hotspots
        hotspots: identifyHotspots(data)
      },
      meta: {
        analysisType: 'heatmap',
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Store the heatmap data
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert({
        ...heatmapData,
        status: 'completed',
        source: options.source || 'heatmap-analysis',
        user_id: options.userId || null,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Heatmap data generated successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to generate heatmap: ${error.message}`);
  }
});

/**
 * @desc    Compare survey responses over time
 * @route   POST /api/analysis/trends
 * @access  Private (API Key)
 */
const analyzeTrends = asyncHandler(async (req, res) => {
  const { currentData, previousData, options } = req.validatedData || req.body;
  
  if (!currentData || !Array.isArray(currentData)) {
    res.status(400);
    throw new Error('Valid current survey response data array is required');
  }
  
  if (!previousData || !Array.isArray(previousData)) {
    res.status(400);
    throw new Error('Valid previous survey response data array is required');
  }
  
  try {
    // Compare the two datasets to identify trends
    const trendsAnalysis = {
      id: uuidv4(),
      currentData,
      previousData,
      trends: {
        responseCount: {
          current: currentData.length,
          previous: previousData.length,
          percentChange: calculatePercentChange(currentData.length, previousData.length)
        },
        fields: compareFieldsByTime(currentData, previousData),
        keyMetrics: analyzeKeyMetricChanges(currentData, previousData),
        sentimentTrend: analyzeSentimentTrend(currentData, previousData),
        emergingThemes: identifyEmergingThemes(currentData, previousData)
      },
      meta: {
        analysisType: 'trends',
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Store the trends analysis
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert({
        ...trendsAnalysis,
        status: 'completed',
        source: options.source || 'trends-analysis',
        user_id: options.userId || null,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Trends analysis completed successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to analyze trends: ${error.message}`);
  }
});

/**
 * @desc    Generate next steps based on survey responses
 * @route   POST /api/analysis/next-steps
 * @access  Private (API Key)
 */
const generateNextSteps = asyncHandler(async (req, res) => {
  const { data, options } = req.validatedData || req.body;
  
  if (!data || !Array.isArray(data)) {
    res.status(400);
    throw new Error('Valid survey response data array is required');
  }
  
  try {
    // Generate recommended next steps based on the survey data
    const nextStepsAnalysis = {
      id: uuidv4(),
      original: data,
      nextSteps: {
        summary: generateSummary(data),
        recommendedQuestions: generateFollowUpQuestions(data),
        suggestedActions: generateSuggestedActions(data),
        prioritizedFindings: prioritizeFindings(data)
      },
      meta: {
        analysisType: 'next-steps',
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Store the next steps analysis
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert({
        ...nextStepsAnalysis,
        status: 'completed',
        source: options.source || 'next-steps-analysis',
        user_id: options.userId || null,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Next steps generated successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to generate next steps: ${error.message}`);
  }
});

// ==================== Helper Functions ==================== //

/**
 * Calculate completion rate for survey responses
 * @param {Array} data - Survey response data
 * @returns {number} Completion rate percentage
 */
function calculateCompletionRate(data) {
  // Mock implementation
  return Math.round(Math.random() * 30 + 70); // 70-100% completion rate
}

/**
 * Calculate average time spent on survey
 * @param {Array} data - Survey response data
 * @returns {number} Average time in seconds
 */
function calculateAverageTime(data) {
  // Mock implementation
  return Math.round(Math.random() * 300 + 120); // 2-7 minutes
}

/**
 * Extract key insights from processed data
 * @param {Object} processedData - Processed survey data
 * @returns {Array} Key insights
 */
function extractKeyInsights(processedData) {
  // Mock implementation
  return [
    {
      insight: "73% of respondents mentioned ease of use as a primary concern",
      confidence: 0.85,
      impact: "high",
      context: "Based on text analysis of open-ended responses"
    },
    {
      insight: "Price sensitivity is highest among small business users",
      confidence: 0.72,
      impact: "medium", 
      context: "Correlation between company size and price satisfaction"
    },
    {
      insight: "Feature X is rarely used despite high development investment",
      confidence: 0.91,
      impact: "high",
      context: "Usage patterns analysis"
    },
    {
      insight: "Customer support satisfaction has increased by 12% since last survey",
      confidence: 0.88,
      impact: "medium",
      context: "Comparative analysis with previous survey data"
    }
  ];
}

/**
 * Generate recommendations based on processed data
 * @param {Object} processedData - Processed survey data
 * @returns {Array} Recommendations
 */
function generateRecommendations(processedData) {
  // Mock implementation
  return [
    {
      recommendation: "Improve onboarding flow for new users",
      reasoning: "First-time users report confusion in getting started",
      priority: "high",
      effort: "medium"
    },
    {
      recommendation: "Simplify pricing tiers for better clarity",
      reasoning: "25% of respondents found pricing model confusing",
      priority: "medium",
      effort: "low"
    },
    {
      recommendation: "Add more tutorials for advanced features",
      reasoning: "Advanced users want more documentation",
      priority: "medium",
      effort: "medium"
    },
    {
      recommendation: "Revisit mobile experience design",
      reasoning: "Mobile satisfaction scores 18% lower than desktop",
      priority: "high",
      effort: "high"
    }
  ];
}

/**
 * Identify user segments from processed data
 * @param {Object} processedData - Processed survey data
 * @returns {Array} User segments
 */
function identifySegments(processedData) {
  // Mock implementation
  return [
    {
      segment: "Power Users",
      percentage: 18,
      characteristics: ["Use advanced features", "Daily usage", "Technical background"],
      keyNeeds: ["Advanced customization", "API access", "Performance"]
    },
    {
      segment: "Occasional Users",
      percentage: 42,
      characteristics: ["Monthly usage", "Basic feature set", "Non-technical"],
      keyNeeds: ["Simplicity", "Clear UI", "Good support"]
    },
    {
      segment: "New Users",
      percentage: 25,
      characteristics: ["Recent sign-ups", "Still exploring", "Mixed technical ability"],
      keyNeeds: ["Onboarding", "Quick wins", "Clear value proposition"]
    },
    {
      segment: "Enterprise Clients",
      percentage: 15,
      characteristics: ["Large organizations", "Multiple users", "Complex needs"],
      keyNeeds: ["Security", "Permissions", "Integration", "Support"]
    }
  ];
}

/**
 * Extract field names from data
 * @param {Array} data - Survey response data
 * @returns {Array} Field names
 */
function extractFieldNames(data) {
  if (!data || data.length === 0) return [];
  
  // Get all unique keys from the first 10 responses or all if less than 10
  const keys = new Set();
  const sampleSize = Math.min(data.length, 10);
  
  for (let i = 0; i < sampleSize; i++) {
    Object.keys(data[i]).forEach(key => keys.add(key));
  }
  
  return Array.from(keys);
}

/**
 * Generate heatmap values for a single response
 * @param {Object} item - Survey response item
 * @returns {Array} Heatmap values
 */
function generateHeatmapValues(item) {
  if (!item) return [];
  
  // Convert each value to a heat value between 0 and 1
  return Object.entries(item).map(([key, value]) => {
    // Skip special fields
    if (key === 'id' || key === 'email' || key === 'timestamp') {
      return { 
        field: key, 
        value: null, 
        heat: 0 
      };
    }
    
    // Calculate heat based on value type
    let heat = 0;
    
    if (typeof value === 'number') {
      // Normalize numbers between 0 and 1
      heat = Math.min(Math.max(value / 10, 0), 1);
    } else if (typeof value === 'string') {
      // Higher heat for longer responses
      heat = Math.min(value.length / 100, 1);
    } else if (typeof value === 'boolean') {
      // True = 0.8, False = 0.2
      heat = value ? 0.8 : 0.2;
    }
    
    return {
      field: key,
      value,
      heat
    };
  });
}

/**
 * Identify hotspots from survey data
 * @param {Array} data - Survey response data
 * @returns {Array} Hotspots
 */
function identifyHotspots(data) {
  // Mock implementation
  return [
    {
      field: "pricing_satisfaction",
      avgHeat: 0.8,
      description: "High concern area for customers"
    },
    {
      field: "ease_of_use",
      avgHeat: 0.65,
      description: "Moderate concern area"
    },
    {
      field: "feature_requests",
      avgHeat: 0.9,
      description: "High engagement area"
    }
  ];
}

/**
 * Calculate percent change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percent change
 */
function calculatePercentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Compare fields between current and previous data
 * @param {Array} currentData - Current survey data
 * @param {Array} previousData - Previous survey data
 * @returns {Array} Field comparisons
 */
function compareFieldsByTime(currentData, previousData) {
  // Mock implementation
  return [
    {
      field: "satisfaction_score",
      current: 7.8,
      previous: 7.2,
      change: 8.3,
      trend: "improving"
    },
    {
      field: "nps_score",
      current: 36,
      previous: 42,
      change: -14.3,
      trend: "declining"
    },
    {
      field: "usability_rating",
      current: 8.1,
      previous: 7.9,
      change: 2.5,
      trend: "stable"
    }
  ];
}

/**
 * Analyze changes in key metrics
 * @param {Array} currentData - Current survey data
 * @param {Array} previousData - Previous survey data
 * @returns {Object} Key metric changes
 */
function analyzeKeyMetricChanges(currentData, previousData) {
  // Mock implementation
  return {
    completion_rate: {
      current: 82,
      previous: 78,
      change: 5.1
    },
    avg_time_to_complete: {
      current: 242, // seconds
      previous: 268, // seconds
      change: -9.7
    },
    abandonment_rate: {
      current: 18,
      previous: 22,
      change: -18.2
    }
  };
}

/**
 * Analyze sentiment trends
 * @param {Array} currentData - Current survey data
 * @param {Array} previousData - Previous survey data
 * @returns {Object} Sentiment trends
 */
function analyzeSentimentTrend(currentData, previousData) {
  // Mock implementation
  return {
    overall: {
      current: 0.62, // -1 to 1 scale
      previous: 0.58,
      change: 6.9
    },
    breakdown: {
      positive: {
        current: 68,
        previous: 64,
        change: 6.3
      },
      neutral: {
        current: 26,
        previous: 30,
        change: -13.3
      },
      negative: {
        current: 6,
        previous: 6,
        change: 0
      }
    },
    top_improved_topics: ["Support", "Reliability", "Documentation"],
    top_declined_topics: ["Pricing", "New Features", "Mobile Experience"]
  };
}

/**
 * Identify emerging themes in survey data
 * @param {Array} currentData - Current survey data
 * @param {Array} previousData - Previous survey data
 * @returns {Array} Emerging themes
 */
function identifyEmergingThemes(currentData, previousData) {
  // Mock implementation
  return [
    {
      theme: "Mobile Access",
      mentions_current: 42,
      mentions_previous: 18,
      change: 133.3,
      significance: "high"
    },
    {
      theme: "Integration Needs",
      mentions_current: 37,
      mentions_previous: 22,
      change: 68.2,
      significance: "medium"
    },
    {
      theme: "Security Concerns",
      mentions_current: 29,
      mentions_previous: 12,
      change: 141.7,
      significance: "high"
    }
  ];
}

/**
 * Generate summary of survey results
 * @param {Array} data - Survey response data
 * @returns {string} Summary
 */
function generateSummary(data) {
  // Mock implementation
  return "Survey indicates strong user satisfaction (78%) with key areas for improvement in mobile experience and pricing clarity. Response rate was 24% higher than industry average, with 82% completion rate.";
}

/**
 * Generate follow-up questions based on survey responses
 * @param {Array} data - Survey response data
 * @returns {Array} Follow-up questions
 */
function generateFollowUpQuestions(data) {
  // Mock implementation
  return [
    {
      question: "What specific aspects of the mobile experience need improvement?",
      reasoning: "Many respondents mentioned mobile issues but details were limited",
      priority: "high"
    },
    {
      question: "How would you prefer pricing tiers to be structured?",
      reasoning: "Pricing confusion was a common theme",
      priority: "medium"
    },
    {
      question: "What integrations would provide the most value to your workflow?",
      reasoning: "Integration requests increased by 68% since last survey",
      priority: "high"
    }
  ];
}

/**
 * Generate suggested actions based on survey responses
 * @param {Array} data - Survey response data
 * @returns {Array} Suggested actions
 */
function generateSuggestedActions(data) {
  // Mock implementation
  return [
    {
      action: "Conduct usability testing focused on mobile experience",
      impact: "high",
      effort: "medium",
      timeframe: "1-2 months"
    },
    {
      action: "Develop simplified pricing page with comparison table",
      impact: "medium",
      effort: "low",
      timeframe: "2-4 weeks"
    },
    {
      action: "Create focus group with power users to refine advanced features",
      impact: "medium",
      effort: "medium",
      timeframe: "1 month"
    },
    {
      action: "Review onboarding flow to reduce initial complexity",
      impact: "high",
      effort: "high",
      timeframe: "2-3 months"
    }
  ];
}

/**
 * Prioritize findings from survey responses
 * @param {Array} data - Survey response data
 * @returns {Array} Prioritized findings
 */
function prioritizeFindings(data) {
  // Mock implementation
  return [
    {
      finding: "Mobile experience rated 18% lower than desktop",
      impact: "high",
      confidence: 0.92,
      priority: 1
    },
    {
      finding: "73% of users want better integration capabilities",
      impact: "high",
      confidence: 0.87,
      priority: 2
    },
    {
      finding: "Onboarding confusion leading to 24% higher support tickets",
      impact: "medium",
      confidence: 0.81,
      priority: 3
    },
    {
      finding: "Enterprise users requesting more granular permissions",
      impact: "medium",
      confidence: 0.75,
      priority: 4
    }
  ];
}

module.exports = {
  generateInsights,
  generateHeatmap,
  analyzeTrends,
  generateNextSteps
}; 