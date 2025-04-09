/**
 * AI Controller
 * Handles AI-powered operations for survey and question generation
 */
const Template = require('../models/Template');
const asyncHandler = require('../middleware/asyncHandler');
const axios = require('axios');
const { supabase } = require('../config/supabaseClient');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Generate survey questions based on business context and target audience
 * @route POST /api/ai/generate
 * @access Private
 */
const generateSurveyQuestions = asyncHandler(async (req, res) => {
  const { businessContext, targetAudience, category, questionCount = 10 } = req.body;

  if (!businessContext || !targetAudience) {
    res.status(400);
    throw new Error('Business context and target audience are required');
  }

  try {
    // Get API configuration from environment variables
    const API_KEY = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    const API_PROVIDER = process.env.AI_PROVIDER || 'anthropic'; // Default to Anthropic Claude
    
    if (!API_KEY) {
      res.status(500);
      throw new Error('AI provider API key not configured');
    }
    
    // Prepare prompt for AI model
    const prompt = `Generate ${questionCount} high-quality survey questions for the following business context and target audience:
    
Business Context: ${businessContext}

Target Audience: ${targetAudience}

Category: ${category || 'General'}

Please create a mix of different question types (multiple choice, rating, text, etc.) that will provide valuable insights. 
For each question, specify:
1. The question text
2. The question type (multiple_choice, checkbox, rating, text, textarea)
3. Whether it's required
4. For multiple choice or checkbox questions, provide the options

Format the response as a valid JSON array of question objects that can be directly imported into our system.
Example format:
[
  {
    "text": "How satisfied are you with our customer service?",
    "type": "rating",
    "required": true
  },
  {
    "text": "Which of our products do you use regularly?",
    "type": "checkbox",
    "required": true,
    "options": ["Product A", "Product B", "Product C", "Product D"]
  }
]`;

    let response;
    
    // Make API call to selected provider
    if (API_PROVIDER === 'anthropic') {
      // Claude API call
      response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: 'user', content: prompt }
        ]
      }, {
        headers: {
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      });
      
      // Extract the generated text from Claude's response
      const generatedText = response.data.content[0].text;
      
      // Parse the JSON from the text response
      const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (!jsonMatch) {
        res.status(500);
        throw new Error('Failed to generate valid question format');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Create a template from the generated questions
      const template = await Template.create({
        name: `${category || 'Survey'} Template - ${new Date().toLocaleDateString()}`,
        description: `Generated for: ${businessContext.substring(0, 100)}...`,
        category: category || 'General',
        questions,
        tags: ['ai-generated', category],
        createdBy: req.user._id,
        isPublic: false,
        aiGenerated: true
      });
      
      res.status(201).json({
        success: true,
        template,
        questions
      });
      
    } else if (API_PROVIDER === 'openai') {
      // OpenAI API call
      response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a survey design expert that generates high-quality survey questions based on business context and target audience.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Extract the generated text from OpenAI's response
      const generatedText = response.data.choices[0].message.content;
      
      // Parse the JSON from the text response
      const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (!jsonMatch) {
        res.status(500);
        throw new Error('Failed to generate valid question format');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Create a template from the generated questions
      const template = await Template.create({
        name: `${category || 'Survey'} Template - ${new Date().toLocaleDateString()}`,
        description: `Generated for: ${businessContext.substring(0, 100)}...`,
        category: category || 'General',
        questions,
        tags: ['ai-generated', category],
        createdBy: req.user._id,
        isPublic: false,
        aiGenerated: true
      });
      
      res.status(201).json({
        success: true,
        template,
        questions
      });
    } else {
      res.status(400);
      throw new Error('Unsupported AI provider');
    }
    
  } catch (error) {
    console.error('AI Generation Error:', error);
    
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status);
      throw new Error(`AI provider error: ${error.response.data.error?.message || 'Unknown API error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500);
      throw new Error('No response from AI provider. Please try again later.');
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500);
      throw new Error(`Error: ${error.message}`);
    }
  }
});

/**
 * Analyze survey responses and generate insights
 * @route POST /api/ai/analyze/:surveyId
 * @access Private
 */
const analyzeSurveyResponses = asyncHandler(async (req, res) => {
  // This would be implemented similarly to the question generation
  // but would analyze existing responses and generate insights
  res.status(501).json({
    message: 'Survey response analysis feature coming soon'
  });
});

/**
 * Optimize existing survey by suggesting improvements
 * @route POST /api/ai/optimize-survey
 * @access Private
 */
const optimizeSurvey = asyncHandler(async (req, res) => {
  const { prompt, context, surveyId } = req.body;
  
  if (!prompt || !context || !surveyId) {
    res.status(400);
    throw new Error('Prompt, context, and survey ID are required');
  }
  
  try {
    // Check if survey exists and belongs to the user
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('user_id', req.user.id)
      .single();
      
    if (surveyError) {
      res.status(404);
      throw new Error('Survey not found or you do not have permission to access it');
    }
    
    // Determine which AI provider to use
    const aiProvider = process.env.AI_PROVIDER || 'anthropic';
    
    // Create system prompt for AI
    const systemPrompt = `You are an expert survey designer that helps improve survey quality.
You analyze existing surveys and provide enhanced versions based on best practices.
Always respond with properly formatted JSON only.`;

    // Create detailed user prompt with the context
    const userPrompt = `I need help enhancing my survey with the following details:

Survey title: ${context.title}
Survey description: ${context.description}
Industry: ${context.industry || 'Not specified'}
Business stage: ${context.businessStage || 'Not specified'}
Customer segment: ${context.customerSegment || 'Not specified'}

Here are the current questions in my survey:
${JSON.stringify(context.questions, null, 2)}

User request: ${prompt}

Analyze the survey and provide enhanced questions. Be sure to:
1. Improve clarity and reduce bias in existing questions
2. Enhance response options where applicable
3. Maintain the original purpose of each question
4. Use a consistent tone throughout the survey
5. Follow survey design best practices

Please respond with ONLY a JSON array of enhanced questions following this exact format:
{
  "questions": [
    {
      "id": "original_question_id_1",  // use the original question's ID if available, or create one with format "new_UUID" for new questions
      "question": "Enhanced question text",
      "description": "Optional description",
      "type": "multiple_choice|checkbox|rating|text|textarea|dropdown",
      "required": true|false,
      "options": ["Option 1", "Option 2"] // Only for multiple_choice, checkbox and dropdown types
      // For rating questions, include:
      "min": 1,
      "max": 5,
      "labels": {
        "min": "Not satisfied",
        "max": "Very satisfied"
      }
    }
  ]
}`;

    let aiResponse;
    
    // Call the appropriate AI provider
    if (aiProvider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });
      
      aiResponse = response.content[0].text;
    } else if (aiProvider === 'openai') {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      
      aiResponse = response.choices[0].message.content;
    } else {
      res.status(400);
      throw new Error('Unsupported AI provider');
    }
    
    // Parse the AI response to extract the JSON
    try {
      // Look for a JSON object in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        res.status(500);
        throw new Error('Invalid AI response format');
      }
      
      const enhancedSurvey = JSON.parse(jsonMatch[0]);
      
      // Validate the enhanced survey data
      if (!enhancedSurvey.questions || !Array.isArray(enhancedSurvey.questions)) {
        res.status(500);
        throw new Error('Invalid format in AI response: questions array missing');
      }
      
      // Return the enhanced questions
      res.status(200).json({
        success: true,
        questions: enhancedSurvey.questions,
        originalSurveyId: surveyId
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, aiResponse);
      res.status(500);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  } catch (error) {
    console.error('AI Survey Enhancement Error:', error);
    
    if (error.response) {
      res.status(error.response.status);
      throw new Error(`AI provider error: ${error.response.data.error?.message || 'Unknown API error'}`);
    } else if (error.request) {
      res.status(500);
      throw new Error('No response from AI provider. Please try again later.');
    } else {
      res.status(500);
      throw new Error(`Error: ${error.message}`);
    }
  }
});

/**
 * @desc Generate survey questions with AI
 * @route POST /api/ai/generate-survey
 * @access Private
 */
const generateSurvey = asyncHandler(async (req, res) => {
  const { templateId } = req.body;

  if (!templateId) {
    return res.status(400).json({ message: 'Template ID is required' });
  }

  // Fetch the template data
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) {
    return res.status(404).json({ 
      message: 'Template not found', 
      error: templateError.message 
    });
  }

  // Prepare context for AI
  const context = prepareContextFromTemplate(template);

  // Generate questions with AI
  let questions;
  try {
    // Try Anthropic first (Claude)
    questions = await generateWithAnthropic(context);
  } catch (anthropicError) {
    console.error('Error using Anthropic:', anthropicError);
    
    // Fallback to OpenAI
    try {
      questions = await generateWithOpenAI(context);
    } catch (openaiError) {
      console.error('Error using OpenAI fallback:', openaiError);
      return res.status(500).json({ 
        message: 'Failed to generate survey questions', 
        error: openaiError.message 
      });
    }
  }

  // Parse and validate the generated questions
  const parsedQuestions = parseAndValidateQuestions(questions);

  // Create a new survey with the generated questions
  const surveyId = uuidv4();
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .insert({
      id: surveyId,
      title: template.title,
      description: template.description,
      questions: parsedQuestions,
      template_id: templateId,
      user_id: req.user.id,
      status: 'draft',
      settings: {
        allowAnonymous: true,
        showProgressBar: true,
        showQuestionNumbers: true,
        randomizeQuestions: false
      }
    })
    .select()
    .single();

  if (surveyError) {
    console.error('Error creating survey:', surveyError);
    return res.status(500).json({ 
      message: 'Failed to create survey', 
      error: surveyError.message 
    });
  }

  res.status(201).json(survey);
});

/**
 * Prepare context for AI from template data
 */
const prepareContextFromTemplate = (template) => {
  return {
    title: template.title,
    description: template.description,
    industry: template.industry,
    businessStage: template.businessStage,
    customerSegment: template.customerSegment,
    assumptions: template.assumptions,
    persona: template.persona
  };
};

/**
 * Generate questions using Anthropic (Claude)
 */
const generateWithAnthropic = async (context) => {
  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(context);

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  return response.content[0].text;
};

/**
 * Generate questions using OpenAI (fallback)
 */
const generateWithOpenAI = async (context) => {
  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(context);

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2000
  });

  return response.choices[0].message.content;
};

/**
 * Get system prompt for AI
 */
const getSystemPrompt = () => {
  return `You are an expert survey designer following the principles from "Talking to Humans" by Giff Constable. 
Your task is to create effective customer discovery survey questions tailored to the business context provided.
Focus on questions that validate assumptions, understand customer pain points, and reveal insights about the target audience.

Guidelines for survey creation:
1. Include a mix of question types: multiple-choice, rating scales, open-ended
2. Start with easier questions before moving to more complex ones
3. Avoid leading questions that bias responses
4. Keep questions clear, concise, and focused
5. Design questions that reveal behavioral insights, not just opinions
6. Include questions specifically designed to validate the key assumptions

Format your response as valid JSON according to the schema specified in the user prompt.`;
};

/**
 * Get user prompt for AI with context
 */
const getUserPrompt = (context) => {
  return `Please create a comprehensive customer discovery survey for my business with the following details:

BUSINESS CONTEXT:
- Title: ${context.title}
- Description: ${context.description}
- Industry: ${context.industry}
- Business Stage: ${context.businessStage}
- Target Customer Segments: ${JSON.stringify(context.customerSegment)}

KEY ASSUMPTIONS TO VALIDATE:
${context.assumptions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

CUSTOMER PERSONA:
- Age: ${context.persona.age}
- Gender: ${context.persona.gender || 'Any'}
- Occupation: ${context.persona.occupation}
- Pain Points: ${JSON.stringify(context.persona.painPoints)}
- Goals: ${JSON.stringify(context.persona.goals)}
${context.persona.preferences && context.persona.preferences.length > 0 ? 
`- Preferences: ${JSON.stringify(context.persona.preferences)}` : ''}

Please generate approximately 10-15 questions that will help validate my assumptions and understand my target customers better.

Return the questions as a valid JSON array with the following structure:
[
  {
    "id": "unique-id-1",
    "type": "multiple_choice|rating|open_ended|checkbox|dropdown",
    "question": "The question text",
    "description": "Optional additional context or instructions for the question",
    "required": true|false,
    "options": ["Option 1", "Option 2"] (only for multiple_choice, checkbox, or dropdown types),
    "min": 1, (only for rating types)
    "max": 10, (only for rating types)
    "labels": { "min": "Not at all likely", "max": "Extremely likely" } (only for rating types)
  }
]`;
};

/**
 * Parse and validate the questions from AI response
 */
const parseAndValidateQuestions = (aiResponse) => {
  try {
    // Extract JSON from response (in case the AI added explanatory text)
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the AI response');
    }
    
    const questionsJson = jsonMatch[0];
    const questions = JSON.parse(questionsJson);
    
    // Basic validation
    if (!Array.isArray(questions)) {
      throw new Error('Questions must be an array');
    }
    
    // Add any missing IDs
    questions.forEach((q, index) => {
      if (!q.id) {
        q.id = uuidv4();
      }
    });
    
    return questions;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return a default set of questions as fallback
    return getDefaultQuestions();
  }
};

/**
 * Get default questions as fallback
 */
const getDefaultQuestions = () => {
  return [
    {
      id: uuidv4(),
      type: 'multiple_choice',
      question: 'How did you hear about our product?',
      description: 'Please select the option that best applies',
      required: true,
      options: ['Search engine', 'Social media', 'Friend or colleague', 'Advertisement', 'Other']
    },
    {
      id: uuidv4(),
      type: 'rating',
      question: 'How likely are you to recommend our product to a friend or colleague?',
      description: 'On a scale from 1 to 10',
      required: true,
      min: 1,
      max: 10,
      labels: { min: 'Not at all likely', max: 'Extremely likely' }
    },
    {
      id: uuidv4(),
      type: 'open_ended',
      question: 'What problem are you trying to solve with our product?',
      description: 'Please be as specific as possible',
      required: true
    },
    {
      id: uuidv4(),
      type: 'checkbox',
      question: 'Which features are most important to you?',
      description: 'Select all that apply',
      required: true,
      options: ['Ease of use', 'Price', 'Customer support', 'Integration capabilities', 'Performance']
    }
  ];
};

/**
 * @desc Generate AI response for an open text prompt
 * @route POST /api/ai/generate
 * @access Private
 */
const generateAIResponse = asyncHandler(async (req, res) => {
  const { prompt, context, options } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    let response;
    
    if (process.env.ANTHROPIC_API_KEY) {
      // Use Anthropic if key is available
      response = await anthropic.messages.create({
        model: options?.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
        max_tokens: options?.maxTokens || 1000,
        system: context || 'You are a helpful assistant responding to a user prompt.',
        messages: [{ role: 'user', content: prompt }]
      });
      
      return res.json({ 
        response: response.content[0].text,
        model: response.model,
        provider: 'anthropic'
      });
    } else if (process.env.OPENAI_API_KEY) {
      // Fallback to OpenAI
      response = await openai.chat.completions.create({
        model: options?.model || process.env.OPENAI_MODEL || 'gpt-4-turbo',
        messages: [
          { role: 'system', content: context || 'You are a helpful assistant responding to a user prompt.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: options?.maxTokens || 1000
      });
      
      return res.json({ 
        response: response.choices[0].message.content,
        model: response.model,
        provider: 'openai'
      });
    } else {
      return res.status(500).json({ message: 'No AI provider configured' });
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return res.status(500).json({ 
      message: 'Failed to generate AI response', 
      error: error.message 
    });
  }
});

/**
 * Analyze a survey and its responses with AI
 * @route POST /api/ai/analyze-survey
 * @access Private
 */
const analyzeSurvey = asyncHandler(async (req, res) => {
  const { surveyId, includeResponses = false } = req.body;
  
  if (!surveyId) {
    res.status(400);
    throw new Error('Survey ID is required');
  }
  
  try {
    // Check if survey exists and belongs to the user
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('user_id', req.user.id)
      .single();
      
    if (surveyError) {
      res.status(404);
      throw new Error('Survey not found or you do not have permission to access it');
    }
    
    // Fetch survey questions
    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order', { ascending: true });
      
    if (questionsError) {
      res.status(500);
      throw new Error('Failed to fetch survey questions');
    }
    
    // Fetch responses if requested
    let responses = [];
    if (includeResponses) {
      const { data: responseData, error: responsesError } = await supabase
        .from('responses')
        .select('*, response_data(*)')
        .eq('survey_id', surveyId);
        
      if (responsesError) {
        res.status(500);
        throw new Error('Failed to fetch survey responses');
      }
      
      responses = responseData;
    }
    
    // Determine which AI provider to use
    const aiProvider = process.env.AI_PROVIDER || 'anthropic';
    
    // Create system prompt for AI
    const systemPrompt = `You are an expert survey analyst that helps businesses understand and improve their surveys.
You analyze survey design and responses to provide insights, identify issues, and suggest improvements.
Always respond with properly formatted JSON only.`;

    // Create detailed user prompt with the context
    const userPrompt = `I need an analysis of my survey with the following details:

Survey title: ${survey.title}
Survey description: ${survey.description}
Survey questions: ${JSON.stringify(questions, null, 2)}
${includeResponses ? `Response count: ${responses.length}
Survey responses: ${JSON.stringify(responses, null, 2)}` : ''}

Please analyze ${includeResponses ? 'the survey design and responses' : 'the survey design'} and provide insights.

Please respond with ONLY a JSON object with the following structure:
{
  "summary": "A concise summary of the survey design ${includeResponses ? 'and responses' : ''}",
  "designInsights": [
    {
      "title": "Insight title",
      "content": "Detailed explanation of the insight",
      "type": "insight|warning|tip"
    }
  ],
  ${includeResponses ? `"responseInsights": [
    {
      "title": "Insight title",
      "content": "Detailed explanation derived from analyzing responses",
      "type": "insight|warning|stat|tip"
    }
  ],` : ''}
  "improvementSuggestions": [
    {
      "title": "Suggestion title",
      "content": "Detailed explanation of how to improve the survey",
      "type": "tip|warning"
    }
  ],
  "nextSteps": [
    "Specific action item 1",
    "Specific action item 2"
  ]
}`;

    let aiResponse;
    
    // Call the appropriate AI provider
    if (aiProvider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });
      
      aiResponse = response.content[0].text;
    } else if (aiProvider === 'openai') {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      
      aiResponse = response.choices[0].message.content;
    } else {
      res.status(400);
      throw new Error('Unsupported AI provider');
    }
    
    // Parse the AI response to extract the JSON
    try {
      // Look for a JSON object in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        res.status(500);
        throw new Error('Invalid AI response format');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate the analysis data
      if (!analysis.summary || !analysis.designInsights || !analysis.improvementSuggestions) {
        res.status(500);
        throw new Error('Invalid format in AI response: required fields missing');
      }
      
      // Track the analysis in the database
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          id: uuidv4(),
          survey_id: surveyId,
          user_id: req.user.id,
          analysis_data: analysis,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (analysisError) {
        console.error('Error saving analysis to database:', analysisError);
        // Continue anyway - we don't want to fail just because we couldn't save the analysis
      }
      
      // Return the analysis
      res.status(200).json({
        success: true,
        ...analysis,
        analysisId: analysisRecord?.id || null
      });
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, aiResponse);
      res.status(500);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  } catch (error) {
    console.error('AI Survey Analysis Error:', error);
    
    if (error.response) {
      res.status(error.response.status);
      throw new Error(`AI provider error: ${error.response.data.error?.message || 'Unknown API error'}`);
    } else if (error.request) {
      res.status(500);
      throw new Error('No response from AI provider. Please try again later.');
    } else {
      res.status(500);
      throw new Error(`Error: ${error.message}`);
    }
  }
});

module.exports = {
  generateSurveyQuestions,
  analyzeSurveyResponses,
  optimizeSurvey,
  generateSurvey,
  analyzeSurvey
}; 