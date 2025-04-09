/**
 * Survey Controller
 * Handles operations related to surveys including CRUD and response handling
 */
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all surveys
 * @route GET /api/surveys
 * @access Private
 */
const getSurveys = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;
  const query = {};

  // Filter surveys by creator if not admin
  if (req.user.role !== 'admin') {
    query.createdBy = req.user._id;
  }

  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  const count = await Survey.countDocuments(query);
  const surveys = await Survey.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    surveys,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

/**
 * Get survey by ID
 * @route GET /api/surveys/:id
 * @access Private
 */
const getSurveyById = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id)
    .populate('createdBy', 'name email company')
    .populate('template', 'name description');

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to view this survey
  if (req.user.role !== 'admin' && survey.createdBy._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this survey');
  }

  res.json(survey);
});

/**
 * Create a new survey
 * @route POST /api/surveys
 * @access Private
 */
const createSurvey = asyncHandler(async (req, res) => {
  const { title, description, questions, template, status, expiresAt } = req.validatedData;

  const survey = await Survey.create({
    title,
    description,
    questions,
    template,
    status: status || 'draft',
    expiresAt,
    createdBy: req.user._id
  });

  if (survey) {
    res.status(201).json(survey);
  } else {
    res.status(400);
    throw new Error('Invalid survey data');
  }
});

/**
 * Update a survey
 * @route PUT /api/surveys/:id
 * @access Private
 */
const updateSurvey = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to update this survey
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this survey');
  }

  // Don't allow published surveys to be modified unless going back to draft
  if (survey.status === 'published' && req.body.status !== 'draft') {
    if (Object.keys(req.body).some(key => key !== 'status')) {
      res.status(400);
      throw new Error('Published surveys cannot be modified unless changed to draft status');
    }
  }

  const updatedSurvey = await Survey.findByIdAndUpdate(
    req.params.id,
    req.validatedData,
    { new: true, runValidators: true }
  );

  res.json(updatedSurvey);
});

/**
 * Delete a survey
 * @route DELETE /api/surveys/:id
 * @access Private
 */
const deleteSurvey = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to delete this survey
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this survey');
  }

  // Check if survey has responses
  const responseCount = await Response.countDocuments({ survey: req.params.id });
  if (responseCount > 0 && req.user.role !== 'admin') {
    res.status(400);
    throw new Error('Cannot delete survey with responses. Contact an admin for assistance.');
  }

  await survey.remove();
  res.json({ message: 'Survey removed' });
});

/**
 * Get survey responses
 * @route GET /api/surveys/:id/responses
 * @access Private
 */
const getSurveyResponses = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to view this survey's responses
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view responses for this survey');
  }

  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;

  const count = await Response.countDocuments({ survey: req.params.id });
  const responses = await Response.find({ survey: req.params.id })
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
 * Get public survey for responses
 * @route GET /api/surveys/public/:id
 * @access Public
 */
const getPublicSurvey = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id)
    .select('title description questions status expiresAt');

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if survey is published
  if (survey.status !== 'published') {
    res.status(404);
    throw new Error('Survey not available');
  }

  // Check if survey has expired
  if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
    res.status(400);
    throw new Error('Survey has expired');
  }

  res.json(survey);
});

/**
 * Submit a response to a survey
 * @route POST /api/surveys/:id/respond
 * @access Public
 */
const submitSurveyResponse = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if survey is published
  if (survey.status !== 'published') {
    res.status(400);
    throw new Error('Cannot respond to unpublished survey');
  }

  // Check if survey has expired
  if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
    res.status(400);
    throw new Error('Survey has expired');
  }

  // Create the response
  const { answers, respondent } = req.validatedData;

  const response = await Response.create({
    survey: req.params.id,
    answers,
    respondent: respondent || {
      name: 'Anonymous',
      email: 'anonymous@example.com'
    }
  });

  if (response) {
    // Create notification for the survey owner
    try {
      const { createResponseNotification } = require('./notificationController');
      await createResponseNotification(response);
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the response submission if notification fails
    }

    res.status(201).json({ message: 'Response submitted successfully', id: response._id });
  } else {
    res.status(400);
    throw new Error('Invalid response data');
  }
});

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResponses,
  getPublicSurvey,
  submitSurveyResponse
}; 