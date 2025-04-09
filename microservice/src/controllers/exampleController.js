/**
 * Data processing controller for microservice
 * Handles survey data processing operations
 */
const asyncHandler = require('../middleware/asyncHandler');
const { getDB } = require('../config/database');
const { processData } = require('../utils/dataProcessingService');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Process data and store results
 * @route   POST /api/process
 * @access  Private (API Key)
 */
const processDataHandler = asyncHandler(async (req, res) => {
  // Get validated data from middleware
  const { data, options } = req.validatedData || req.body;
  
  if (!data) {
    res.status(400);
    throw new Error('Data is required');
  }
  
  // Process the data using our service
  const processedData = processData(data, options);
  
  // Add additional metadata for storage
  const resultToStore = {
    ...processedData,
    status: 'completed',
    source: options.source || 'api',
    user_id: options.userId || null,
    created_at: new Date().toISOString()
  };
  
  // Store the processed data in Supabase
  try {
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert(resultToStore)
      .select();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Data processed successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to process data: ${error.message}`);
  }
});

/**
 * @desc    Get processed data by ID
 * @route   GET /api/process/:id
 * @access  Private (API Key)
 */
const getProcessedData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    res.status(400);
    throw new Error('ID is required');
  }
  
  // Get the processed data from Supabase
  try {
    const supabase = getDB();
    const { data, error } = await supabase
      .from('processed_data')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      res.status(404);
      throw new Error('Processed data not found');
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500);
    throw new Error(`Failed to get processed data: ${error.message}`);
  }
});

/**
 * @desc    Get all processed data
 * @route   GET /api/process
 * @access  Private (API Key)
 */
const getAllProcessedData = asyncHandler(async (req, res) => {
  // Get validated query params from middleware
  const { 
    page = 1, 
    limit = 10, 
    sort = 'created_at',
    order = 'desc',
    status,
    userId,
    surveyId,
    from,
    to
  } = req.validatedQuery || req.query;
  
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit) - 1;
  
  // Build query
  try {
    const supabase = getDB();
    let query = supabase.from('processed_data').select('*', { count: 'exact' });
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (surveyId && options?.surveyId) {
      query = query.eq('options->>surveyId', surveyId);
    }
    
    if (from) {
      query = query.gte('created_at', from);
    }
    
    if (to) {
      query = query.lte('created_at', to);
    }
    
    // Get count
    const { count, error: countError } = await query;
    
    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }
    
    // Get paginated data
    const { data, error } = await query
      .range(startIndex, endIndex)
      .order(sort, { ascending: order === 'asc' });
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Build pagination object
    const pagination = {
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil((count || 0) / parseInt(limit))
    };
    
    res.json({
      success: true,
      pagination,
      data: data || []
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to get processed data: ${error.message}`);
  }
});

/**
 * @desc    Delete processed data by ID
 * @route   DELETE /api/process/:id
 * @access  Private (API Key)
 */
const deleteProcessedData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    res.status(400);
    throw new Error('ID is required');
  }
  
  try {
    const supabase = getDB();
    
    // First check if the record exists
    const { data: existingData, error: existingError } = await supabase
      .from('processed_data')
      .select('id')
      .eq('id', id)
      .single();
      
    if (existingError || !existingData) {
      res.status(404);
      throw new Error('Processed data not found');
    }
    
    // Delete the record
    const { error } = await supabase
      .from('processed_data')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    res.json({
      success: true,
      message: 'Processed data deleted successfully'
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500);
    throw new Error(`Failed to delete processed data: ${error.message}`);
  }
});

/**
 * @desc    Run sentiment analysis on survey responses
 * @route   POST /api/process/sentiment
 * @access  Private (API Key)
 */
const analyzeSentiment = asyncHandler(async (req, res) => {
  const { data, options } = req.validatedData || req.body;
  
  if (!data || !Array.isArray(data)) {
    res.status(400);
    throw new Error('Valid response data array is required');
  }
  
  try {
    // Process textual responses to extract sentiment
    const processedData = {
      id: uuidv4(),
      original: data,
      sentimentAnalysis: data.map(item => {
        // Extract text responses for analysis
        const textResponses = Object.entries(item)
          .filter(([key, value]) => 
            typeof value === 'string' && 
            value.length > 5 && 
            !key.includes('email') && 
            !key.includes('name')
          )
          .map(([key, value]) => ({ field: key, text: value }));
          
        // Calculate sentiment scores (mock implementation)
        const sentimentScores = textResponses.map(response => {
          // This is a simplified mock implementation
          // In a real implementation, you would use NLP tools or APIs
          const text = response.text.toLowerCase();
          const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'helpful'];
          const negativeWords = ['bad', 'poor', 'terrible', 'hate', 'dislike', 'difficult', 'problem'];
          
          let positiveScore = 0;
          let negativeScore = 0;
          
          positiveWords.forEach(word => {
            if (text.includes(word)) positiveScore += 1;
          });
          
          negativeWords.forEach(word => {
            if (text.includes(word)) negativeScore += 1;
          });
          
          const totalScore = positiveScore - negativeScore;
          let sentiment = 'neutral';
          
          if (totalScore > 1) sentiment = 'positive';
          else if (totalScore < -1) sentiment = 'negative';
          
          return {
            ...response,
            sentiment,
            score: totalScore,
            confidence: 0.7 // Mock confidence value
          };
        });
        
        // Calculate overall sentiment
        const totalScore = sentimentScores.reduce((sum, item) => sum + item.score, 0);
        const avgScore = sentimentScores.length > 0 ? totalScore / sentimentScores.length : 0;
        
        let overallSentiment = 'neutral';
        if (avgScore > 1) overallSentiment = 'positive';
        else if (avgScore < -1) overallSentiment = 'negative';
        
        return {
          responseId: item.id || uuidv4(),
          fieldSentiments: sentimentScores,
          overallSentiment,
          averageScore: avgScore
        };
      }),
      meta: {
        analysisType: 'sentiment',
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Store the analysis results
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert({
        ...processedData,
        status: 'completed',
        source: options.source || 'sentiment-analysis',
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
      message: 'Sentiment analysis completed successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to analyze sentiment: ${error.message}`);
  }
});

/**
 * @desc    Find themes and patterns in survey responses
 * @route   POST /api/process/themes
 * @access  Private (API Key)
 */
const findThemes = asyncHandler(async (req, res) => {
  const { data, options } = req.validatedData || req.body;
  
  if (!data || !Array.isArray(data)) {
    res.status(400);
    throw new Error('Valid response data array is required');
  }
  
  try {
    // Collect all text responses
    const allTextResponses = [];
    data.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (
          typeof value === 'string' && 
          value.length > 10 && 
          !key.includes('email') && 
          !key.includes('name')
        ) {
          allTextResponses.push({
            responseId: item.id || 'unknown',
            field: key,
            text: value
          });
        }
      });
    });
    
    // Mock theme extraction (in a real implementation, use NLP)
    const extractedThemes = [];
    const wordFrequency = {};
    
    // Count word frequencies
    allTextResponses.forEach(response => {
      const words = response.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3); // Filter out short words
        
      words.forEach(word => {
        if (!wordFrequency[word]) {
          wordFrequency[word] = { count: 0, responses: [] };
        }
        wordFrequency[word].count += 1;
        wordFrequency[word].responses.push(response.responseId);
      });
    });
    
    // Find top themes based on frequency
    const topWords = Object.entries(wordFrequency)
      .filter(([word, data]) => {
        // Filter out common stop words (simplified)
        const stopWords = ['this', 'that', 'would', 'could', 'should', 'their', 'there', 'about', 'which'];
        return !stopWords.includes(word);
      })
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
      
    topWords.forEach(([word, data]) => {
      extractedThemes.push({
        theme: word,
        count: data.count,
        responseIds: [...new Set(data.responses)], // Deduplicate
        confidence: 0.6 // Mock confidence value
      });
    });
    
    // Create the themes analysis result
    const themesAnalysis = {
      id: uuidv4(),
      original: data,
      themeAnalysis: {
        topThemes: extractedThemes,
        totalResponses: data.length,
        totalTextFields: allTextResponses.length
      },
      meta: {
        analysisType: 'themes',
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Store the analysis results
    const supabase = getDB();
    const { data: result, error } = await supabase
      .from('processed_data')
      .insert({
        ...themesAnalysis,
        status: 'completed',
        source: options.source || 'theme-analysis',
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
      message: 'Theme analysis completed successfully'
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to analyze themes: ${error.message}`);
  }
});

module.exports = {
  processData: processDataHandler,
  getProcessedData,
  getAllProcessedData,
  deleteProcessedData,
  analyzeSentiment,
  findThemes
}; 