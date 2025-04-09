/**
 * Embed Controller
 * Handles operations related to embedding surveys on external websites
 */
const Survey = require('../models/Survey');
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Generate embed code for a survey
 * @route POST /api/embed/generate/:surveyId
 * @access Private
 */
const generateEmbedCode = asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.surveyId);

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if user has permission to embed this survey
  if (req.user.role !== 'admin' && survey.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to embed this survey');
  }

  // Set the embed options
  const { style = 'inline', height = '600px', width = '100%' } = req.body;

  // Generate a unique embed token if it doesn't exist
  if (!survey.embedToken) {
    // Create a random token
    const embedToken = crypto.randomBytes(16).toString('hex');
    
    // Save the token to the survey
    survey.embedToken = embedToken;
    await survey.save();
  }

  // Get the base API URL
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  
  // Create the embed script
  let embedCode = '';
  
  if (style === 'inline') {
    embedCode = `
<!-- Survey Embed Code - ${survey.title} -->
<div id="survey-container-${survey.embedToken}" style="width: ${width}; height: ${height};"></div>
<script src="${baseUrl}/embed/script/${survey.embedToken}.js"></script>
<script>
  loadSurvey('${survey.embedToken}', 'survey-container-${survey.embedToken}');
</script>
<!-- End Survey Embed Code -->
`;
  } else if (style === 'popup') {
    embedCode = `
<!-- Survey Popup Code - ${survey.title} -->
<button id="open-survey-${survey.embedToken}" style="padding: 10px 15px; background-color: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 4px;">Take Our Survey</button>
<script src="${baseUrl}/embed/script/${survey.embedToken}.js"></script>
<script>
  document.getElementById('open-survey-${survey.embedToken}').addEventListener('click', function() {
    openSurveyPopup('${survey.embedToken}', '${width}', '${height}', '${survey.title}');
  });
</script>
<!-- End Survey Popup Code -->
`;
  }

  res.json({
    success: true,
    embedToken: survey.embedToken,
    embedCode,
    surveyId: survey._id
  });
});

/**
 * Get embed JavaScript file for a survey
 * @route GET /api/embed/script/:token.js
 * @access Public
 */
const getEmbedScript = asyncHandler(async (req, res) => {
  // Extract token from the request (remove .js extension)
  const token = req.params.token.replace('.js', '');

  if (!token) {
    res.status(400);
    throw new Error('Embed token is required');
  }

  // Verify that the survey exists with this token
  const survey = await Survey.findOne({ embedToken: token });

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found');
  }

  // Check if survey is published
  if (survey.status !== 'published') {
    res.status(403);
    throw new Error('This survey is not currently active');
  }

  // Set content type as JavaScript
  res.setHeader('Content-Type', 'application/javascript');

  // Generate the JavaScript for embedding
  const script = `
/**
 * Survey Embed Script
 * For survey: ${survey.title}
 * Token: ${token}
 */

// Load the survey into a container
function loadSurvey(token, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Survey container not found:', containerId);
    return;
  }

  // Create an iframe to load the survey
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.src = '${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/embed/' + token;
  
  // Clear the container and add the iframe
  container.innerHTML = '';
  container.appendChild(iframe);
}

// Open the survey in a popup window
function openSurveyPopup(token, width, height, title) {
  // Default dimensions if not provided
  width = width || '800px';
  height = height || '600px';
  
  // Convert from px to numbers for window.open
  const numWidth = parseInt(width.replace('px', '')) || 800;
  const numHeight = parseInt(height.replace('px', '')) || 600;
  
  // Calculate center position
  const left = (window.innerWidth - numWidth) / 2 + window.screenX;
  const top = (window.innerHeight - numHeight) / 2 + window.screenY;
  
  // Open the popup
  window.open(
    '${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/embed/' + token,
    'survey_popup_' + token,
    \`width=\${numWidth},height=\${numHeight},left=\${left},top=\${top},resizable=yes,scrollbars=yes,status=no,location=no\`
  );
}
`;

  res.send(script);
});

/**
 * Get embed HTML for a survey
 * @route GET /api/embed/:token
 * @access Public
 */
const getEmbedHtml = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    res.status(400);
    throw new Error('Embed token is required');
  }

  const survey = await Survey.findOne({ embedToken: token })
    .select('_id title description questions status expiresAt');

  if (!survey) {
    res.status(404);
    throw new Error('Survey not found or embed link is invalid');
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

  // Set content type as HTML
  res.setHeader('Content-Type', 'text/html');
  
  // Generate a simple HTML wrapper for the embedded survey
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${survey.title}</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      height: 100%;
      width: 100%;
    }
    .survey-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #333;
    }
    p {
      color: #666;
    }
    .embedded-indicator {
      font-size: 12px;
      color: #999;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="survey-container">
    <h1>${survey.title}</h1>
    <p>${survey.description || ''}</p>
    
    <!-- Survey content would be loaded here by the frontend -->
    <div id="survey-content" data-survey-id="${survey._id}"></div>
    
    <div class="embedded-indicator">
      Powered by Customer Survey Platform
    </div>
  </div>

  <!-- This script tag would load the frontend survey renderer -->
  <script>
    // Survey data to be used by the frontend
    window.surveyData = ${JSON.stringify(survey)};
  </script>
</body>
</html>
`;

  res.send(html);
});

/**
 * Disable embedding for a survey
 * @route DELETE /api/embed/:surveyId
 * @access Private
 */
const disableEmbedding = asyncHandler(async (req, res) => {
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

  // Remove the embed token
  survey.embedToken = undefined;
  await survey.save();

  res.json({
    success: true,
    message: 'Survey embedding has been disabled'
  });
});

module.exports = {
  generateEmbedCode,
  getEmbedScript,
  getEmbedHtml,
  disableEmbedding
}; 