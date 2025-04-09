/**
 * Analysis Controller
 * Handles operations related to survey response analysis
 */
const Analysis = require('../models/Analysis');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get analysis for a survey
 * @route GET /api/analysis/survey/:id
 * @access Private
 */
const getSurveyAnalysis = asyncHandler(async (req, res) => {
  // Check if survey exists and user has access
  const survey = await Survey.findById(req.params.id);
  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to view this survey's analysis
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view analysis for this survey');
  }

  // Find existing analysis or create a new one
  let analysis = await Analysis.findOne({ survey: req.params.id });
  
  if (!analysis) {
    // Count number of responses
    const responseCount = await Response.countDocuments({ survey: req.params.id });
    
    if (responseCount === 0) {
      res.status(400);
      throw new Error('Cannot generate analysis for a survey with no responses');
    }
    
    // Generate new analysis
    analysis = await generateAnalysis(req.params.id);
  } else if (req.query.refresh === 'true') {
    // Update existing analysis
    analysis = await refreshAnalysis(analysis._id, req.params.id);
  }

  res.json(analysis);
});

/**
 * Get all analyses for user's surveys
 * @route GET /api/analysis
 * @access Private
 */
const getAllAnalyses = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;
  const query = {};

  // If not admin, only show analyses for user's surveys
  if (req.user.role !== 'admin') {
    // Get IDs of surveys created by user
    const userSurveys = await Survey.find({ createdBy: req.user._id }).select('_id');
    const surveyIds = userSurveys.map(survey => survey._id);
    query.survey = { $in: surveyIds };
  }

  const count = await Analysis.countDocuments(query);
  const analyses = await Analysis.find(query)
    .populate('survey', 'title createdAt')
    .sort({ updatedAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    analyses,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

/**
 * Get analysis by ID
 * @route GET /api/analysis/:id
 * @access Private
 */
const getAnalysisById = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findById(req.params.id)
    .populate('survey', 'title description createdBy');

  if (!analysis) {
    res.status(404);
    throw new Error('Analysis not found');
  }

  // Check if user has permission to view this analysis
  const survey = await Survey.findById(analysis.survey._id);
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this analysis');
  }

  res.json(analysis);
});

/**
 * Generate analysis for a survey
 * @param {string} surveyId - ID of the survey to analyze
 * @returns {Promise<Object>} The generated analysis
 */
const generateAnalysis = async (surveyId) => {
  // Get the survey with its questions
  const survey = await Survey.findById(surveyId);
  
  // Get all responses for the survey
  const responses = await Response.find({ survey: surveyId });
  
  // Initialize result container
  const results = {};
  const responseCount = responses.length;
  
  // Process each question in the survey
  survey.questions.forEach((question, qIndex) => {
    const questionKey = `q${qIndex + 1}`;
    const result = {
      question: question.text,
      type: question.type,
      responseCount
    };
    
    // Handle different question types
    switch (question.type) {
      case 'multiple_choice':
      case 'checkbox':
        result.options = {};
        question.options.forEach(option => {
          result.options[option] = 0;
        });
        
        // Count responses for each option
        responses.forEach(response => {
          const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
          if (answer) {
            if (Array.isArray(answer.value)) {
              answer.value.forEach(val => {
                if (result.options[val] !== undefined) {
                  result.options[val]++;
                }
              });
            } else if (result.options[answer.value] !== undefined) {
              result.options[answer.value]++;
            }
          }
        });
        
        // Calculate percentages
        result.percentages = {};
        Object.keys(result.options).forEach(option => {
          result.percentages[option] = responseCount > 0 
            ? Math.round((result.options[option] / responseCount) * 100) 
            : 0;
        });
        break;
        
      case 'rating':
        result.average = 0;
        result.distribution = {};
        
        // Initialize distribution count for each rating value
        for (let i = 1; i <= 5; i++) {
          result.distribution[i] = 0;
        }
        
        // Calculate average and count distribution
        let totalRating = 0;
        let ratingCount = 0;
        
        responses.forEach(response => {
          const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
          if (answer && answer.value) {
            const rating = parseInt(answer.value);
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
              totalRating += rating;
              ratingCount++;
              result.distribution[rating]++;
            }
          }
        });
        
        result.average = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
        break;
        
      case 'text':
      case 'textarea':
        // For text responses, just store the count of responses
        result.responseTexts = [];
        responses.forEach(response => {
          const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
          if (answer && answer.value) {
            result.responseTexts.push(answer.value);
          }
        });
        break;
        
      default:
        // Unknown question type
        result.note = 'Analysis not available for this question type';
    }
    
    results[questionKey] = result;
  });
  
  // Create and save the analysis record
  const analysis = await Analysis.create({
    survey: surveyId,
    results,
    responseCount,
    generatedAt: new Date()
  });
  
  return analysis;
};

/**
 * Refresh existing analysis with latest response data
 * @param {string} analysisId - ID of the analysis to refresh
 * @param {string} surveyId - ID of the survey to analyze
 * @returns {Promise<Object>} The refreshed analysis
 */
const refreshAnalysis = async (analysisId, surveyId) => {
  // Generate fresh analysis
  const freshResults = await generateAnalysis(surveyId);
  
  // Update existing analysis with new results
  const analysis = await Analysis.findByIdAndUpdate(
    analysisId,
    {
      results: freshResults.results,
      responseCount: freshResults.responseCount,
      generatedAt: new Date()
    },
    { new: true }
  );
  
  return analysis;
};

module.exports = {
  getSurveyAnalysis,
  getAllAnalyses,
  getAnalysisById
}; 