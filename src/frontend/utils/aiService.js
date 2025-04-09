import { supabase } from './supabaseClient';

/**
 * AI Service - Functions for AI-related operations
 */
export const aiService = {
  /**
   * Generate a survey based on business context and target audience
   * @param {Object} params - The parameters for survey generation
   * @param {string} params.businessContext - Description of the business context
   * @param {string} params.targetAudience - Description of the target audience
   * @param {string} params.purpose - Purpose of the survey
   * @param {string} params.industry - Industry category
   * @param {number} params.questionCount - Number of questions to generate (default: 10)
   * @param {Array} params.questionFocus - Focus areas for questions (e.g., "pain_points", "needs", etc.)
   * @returns {Promise<Object>} - The generated survey
   */
  generateSurvey: async (params) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-survey', {
        body: params
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error generating survey:', error);
      throw error;
    }
  },
  
  /**
   * Generate insights from survey responses
   * @param {string} surveyId - The survey ID
   * @param {string} dateRange - Date range for responses (e.g., "7d", "30d", "all")
   * @returns {Promise<Object>} - The generated insights
   */
  generateInsights: async (surveyId, dateRange = 'all') => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { 
          surveyId,
          dateRange
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  },
  
  /**
   * Analyze sentiment in text responses
   * @param {string} surveyId - The survey ID
   * @param {Object} textResponses - Map of question indices to arrays of text responses
   * @returns {Promise<Object>} - The sentiment analysis results
   */
  analyzeSentiment: async (surveyId, textResponses) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { 
          surveyId,
          textResponses
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  },
  
  /**
   * Find survey participants based on targeting criteria
   * @param {Object} criteria - Targeting criteria
   * @param {string} criteria.industry - Target industry
   * @param {Array} criteria.demographics - Demographic requirements
   * @param {number} criteria.participantCount - Number of participants needed
   * @returns {Promise<Object>} - Information about available participants
   */
  findParticipants: async (criteria) => {
    try {
      const { data, error } = await supabase.functions.invoke('find-participants', {
        body: criteria
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error finding participants:', error);
      throw error;
    }
  },
  
  /**
   * Generate interview questions based on survey data and research goals
   * @param {Object} params - Parameters for interview question generation
   * @param {string} params.surveyId - Optional related survey ID
   * @param {string} params.researchGoals - Research goals description
   * @param {Array} params.topics - Topics to cover
   * @param {string} params.interviewFormat - Format of the interview
   * @param {number} params.duration - Expected duration in minutes
   * @returns {Promise<Object>} - Generated interview questions
   */
  generateInterviewQuestions: async (params) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: params
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error generating interview questions:', error);
      throw error;
    }
  },
  
  /**
   * Generates a comprehensive report based on survey responses
   * @param {string} surveyId - The ID of the survey to generate a report for
   * @param {Object} options - Report generation options
   * @param {string} options.format - The format of the report (pdf, docx, etc.)
   * @param {string[]} options.sections - The sections to include in the report
   * @param {boolean} options.includeRawData - Whether to include raw data
   * @param {string} options.title - The title of the report
   * @param {Object} options.branding - Custom branding options
   * @returns {Promise<Object>} - The generated report details including download URL
   */
  generateReport: async (surveyId, options = {}) => {
    try {
      console.log('Generating report for survey:', surveyId);
      console.log('Report options:', JSON.stringify(options, null, 2));
      
      // In a real implementation, this would call a backend endpoint
      // For demo/debug purposes, we're simulating the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Debug: Log that we're generating the report
      console.log(`Report generation starting: surveyId=${surveyId}, format=${options.format}`);
      
      // Debug: Log the API endpoint we would call in production
      console.log('Would call API endpoint: /api/reports/generate');

      // Simulate a response from the backend
      return {
        reportId: `report-${Date.now()}`,
        downloadUrl: `/api/reports/download/${surveyId}?format=${options.format}`,
        createdAt: new Date().toISOString(),
        format: options.format,
        sections: options.sections,
        fileName: `${options.title.replace(/\s+/g, '_')}.${options.format}`
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report: ' + (error.message || 'Unknown error'));
    }
  },
  
  /**
   * Recommend actions based on survey insights
   * @param {string} surveyId - The survey ID
   * @returns {Promise<Object>} - Recommended actions based on insights
   */
  getActionRecommendations: async (surveyId) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-action-recommendations', {
        body: { surveyId }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting action recommendations:', error);
      throw error;
    }
  },
  
  /**
   * Get confidence scores for insights and findings
   * @param {string} surveyId - The survey ID
   * @returns {Promise<Object>} - Confidence scores for various insights
   */
  getConfidenceScores: async (surveyId) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-confidence-scores', {
        body: { surveyId }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting confidence scores:', error);
      throw error;
    }
  }
};

export default aiService; 