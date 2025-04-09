/**
 * Share Controller
 * Handles operations related to sharing surveys
 */
const Survey = require('../models/Survey');
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Generate a sharing link for a survey
 * @route POST /api/share/create/:surveyId
 * @access Private
 */
const createSharingLink = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.surveyId);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to share this survey
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to share this survey');
  }

  // Generate a unique sharing token if it doesn't exist
  if (!survey.sharingToken) {
    // Create a random token
    const sharingToken = crypto.randomBytes(16).toString('hex');
    
    // Save the token to the survey
    survey.sharingToken = sharingToken;
    await survey.save();
  }

  // Generate the sharing URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const sharingUrl = `${baseUrl}/survey/share/${survey.sharingToken}`;

  res.json({
    success: true,
    sharingToken: survey.sharingToken,
    sharingUrl,
    surveyId: survey._id
  });
});

/**
 * Get survey by sharing token
 * @route GET /api/share/:token
 * @access Public
 */
const getSurveyByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    res.status(400);
    throw new Error('Sharing token is required');
  }

  const survey = await Survey.findOne({ sharingToken: token })
    .select('_id title description questions status expiresAt');

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found or sharing link is invalid');
  }

  // Check if survey is published
  if (survey.status !== 'published') {
    res.status(403);
    throw new Error('This survey is not currently active');
  }

  // Check if survey has expired
  if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
    res.status(403);
    throw new Error('This survey has expired');
  }

  res.json(survey);
});

/**
 * Revoke a sharing link
 * @route DELETE /api/share/:surveyId
 * @access Private
 */
const revokeSharingLink = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.surveyId);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to modify this survey
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this survey');
  }

  // Remove the sharing token
  survey.sharingToken = undefined;
  await survey.save();

  res.json({
    success: true,
    message: 'Sharing link has been revoked'
  });
});

module.exports = {
  createSharingLink,
  getSurveyByToken,
  revokeSharingLink
}; 