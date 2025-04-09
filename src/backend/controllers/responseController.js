/**
 * Response Controller
 * Handles operations related to survey responses
 */
const Response = require('../models/Response');
const Survey = require('../models/Survey');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all responses
 * @route GET /api/responses
 * @access Private/Admin
 */
const getResponses = asyncHandler(async (req, res) => {
  // Only admins can see all responses
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access all responses');
  }

  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;
  
  // Filter by survey if provided
  const query = {};
  if (req.query.survey) {
    query.survey = req.query.survey;
  }

  const count = await Response.countDocuments(query);
  const responses = await Response.find(query)
    .populate('survey', 'title')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    responses,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

/**
 * Get response by ID
 * @route GET /api/responses/:id
 * @access Private
 */
const getResponseById = asyncHandler(async (req, res) => {
  const response = await Response.findById(req.params.id)
    .populate('survey', 'title description createdBy');

  if (!response) {
    res.status(404);
    throw new Error('Response not found');
  }

  // Check if user has permission to view this response
  if (req.user.role !== 'admin') {
    const survey = await Survey.findById(response.survey._id);
    if (!survey || survey.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this response');
    }
  }

  res.json(response);
});

/**
 * Delete a response
 * @route DELETE /api/responses/:id
 * @access Private/Admin
 */
const deleteResponse = asyncHandler(async (req, res) => {
  const response = await Response.findById(req.params.id);

  if (!response) {
    res.status(404);
    throw new Error('Response not found');
  }

  // Only admins can delete responses
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete responses');
  }

  await response.remove();
  res.json({ message: 'Response removed' });
});

/**
 * Export responses for a survey
 * @route GET /api/responses/export/:surveyId
 * @access Private
 */
const exportResponses = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.surveyId);
  
  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to export responses
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to export responses for this survey');
  }

  // Get all responses for the survey
  const responses = await Response.find({ survey: req.params.surveyId })
    .sort({ createdAt: -1 });

  if (responses.length === 0) {
    res.status(404);
    throw new Error('No responses found for this survey');
  }

  // Format for export - CSV is the default format
  const format = req.query.format ? req.query.format.toLowerCase() : 'csv';
  
  switch (format) {
    case 'json':
      // Return JSON directly
      res.json({
        survey: {
          id: survey._id,
          title: survey.title
        },
        responses
      });
      break;
      
    case 'csv':
    default:
      // Generate CSV content
      const csvContent = generateCsvForResponses(survey, responses);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="survey_${survey._id}_responses.csv"`
      );
      
      res.send(csvContent);
  }
});

/**
 * Generate CSV content for responses
 * @param {Object} survey - The survey object
 * @param {Array} responses - Array of response objects
 * @returns {String} CSV formatted string
 */
const generateCsvForResponses = (survey, responses) => {
  if (!responses.length) return '';
  
  // Extract question texts for headers
  const questions = survey.questions.map(q => q.text);
  
  // Start with headers
  let csv = ['Respondent Name', 'Respondent Email', 'Submission Date', ...questions].join(',') + '\n';
  
  // Add each response as a row
  responses.forEach(response => {
    const submissionDate = new Date(response.createdAt).toISOString().split('T')[0];
    const respondentName = response.respondent?.name || 'Anonymous';
    const respondentEmail = response.respondent?.email || 'anonymous@example.com';
    
    // Prepare row with basic info
    const row = [
      `"${respondentName}"`,
      `"${respondentEmail}"`,
      `"${submissionDate}"`
    ];
    
    // Add answer for each question
    survey.questions.forEach(question => {
      const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
      let value = '';
      
      if (answer) {
        if (Array.isArray(answer.value)) {
          // Join array values with semicolons
          value = answer.value.join('; ');
        } else {
          value = answer.value;
        }
      }
      
      // Escape quotes and add to row
      row.push(`"${value.toString().replace(/"/g, '""')}"`);
    });
    
    // Add row to CSV
    csv += row.join(',') + '\n';
  });
  
  return csv;
};

module.exports = {
  getResponses,
  getResponseById,
  deleteResponse,
  exportResponses
}; 