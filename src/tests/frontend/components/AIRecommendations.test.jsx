import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AIRecommendations from '../../../frontend/components/survey/AIRecommendations';

// Mock axios
jest.mock('axios');

describe('AIRecommendations Component', () => {
  const mockSurvey = {
    id: 'survey123',
    title: 'Test Survey',
    description: 'A test survey description',
    questions: [
      {
        id: 'q1',
        question: 'How satisfied are you with our product?',
        type: 'rating',
        required: true
      }
    ]
  };

  const mockResponses = [
    {
      id: 'r1',
      survey_id: 'survey123',
      response_data: {
        q1: 4
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in initial state', () => {
    render(<AIRecommendations survey={mockSurvey} />);

    // Check title is present
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    
    // Check that the generate button is present
    expect(screen.getByText('Generate Analysis')).toBeInTheDocument();
    
    // Check initial empty state message
    expect(screen.getByText('No Analysis Yet')).toBeInTheDocument();
    expect(screen.getByText("Click \"Generate Analysis\" to get AI-powered insights about your survey")).toBeInTheDocument();
  });

  it('shows loading state when generating analysis', async () => {
    // Set up a delayed resolution to show loading state
    axios.post.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: {
              summary: 'Test summary',
              designInsights: []
            }
          });
        }, 100);
      });
    });

    render(<AIRecommendations survey={mockSurvey} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Check loading state
    expect(screen.getByText('Analyzing your survey...')).toBeInTheDocument();
  });

  it('fetches and displays recommendations when button is clicked', async () => {
    // Mock successful API response
    const mockAnalysis = {
      summary: 'This survey is well-structured but could benefit from more specific questions.',
      designInsights: [
        { title: 'Good Question Structure', content: 'Clear and concise questions', type: 'insight' },
        { title: 'Response Bias Risk', content: 'Some questions may lead to biased responses', type: 'warning' }
      ],
      improvementSuggestions: [
        { title: 'Add Open-ended Questions', content: 'Consider adding qualitative questions', type: 'tip' }
      ],
      nextSteps: ['Review question wording', 'Add follow-up questions']
    };

    axios.post.mockResolvedValueOnce({ data: mockAnalysis });

    render(<AIRecommendations survey={mockSurvey} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Wait for recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Survey Summary')).toBeInTheDocument();
    });
    
    // Check that the summary is displayed
    expect(screen.getByText(mockAnalysis.summary)).toBeInTheDocument();
    
    // Check that insights are displayed
    expect(screen.getByText('Good Question Structure')).toBeInTheDocument();
    expect(screen.getByText('Response Bias Risk')).toBeInTheDocument();
    
    // Check that suggestions are displayed
    expect(screen.getByText('Add Open-ended Questions')).toBeInTheDocument();
    
    // Check that next steps are displayed
    expect(screen.getByText('Review question wording')).toBeInTheDocument();
    expect(screen.getByText('Add follow-up questions')).toBeInTheDocument();
    
    // Check that the button text changed
    expect(screen.getByText('Refresh Analysis')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Failed to generate recommendations'
        }
      }
    });

    render(<AIRecommendations survey={mockSurvey} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to generate recommendations')).toBeInTheDocument();
    });
  });

  it('refreshes analysis when refresh button is clicked', async () => {
    // Mock initial successful API response
    const initialAnalysis = {
      summary: 'Initial summary',
      designInsights: [{ title: 'Initial insight', content: 'Content', type: 'insight' }],
      improvementSuggestions: [],
      nextSteps: []
    };

    // Mock refresh API response
    const refreshedAnalysis = {
      summary: 'Updated summary',
      designInsights: [{ title: 'Updated insight', content: 'Content', type: 'insight' }],
      improvementSuggestions: [],
      nextSteps: []
    };

    // First call returns initial analysis
    axios.post.mockResolvedValueOnce({ data: initialAnalysis });
    
    // Second call returns refreshed analysis
    axios.post.mockResolvedValueOnce({ data: refreshedAnalysis });

    render(<AIRecommendations survey={mockSurvey} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Wait for initial recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Initial summary')).toBeInTheDocument();
    });
    
    // Click the refresh button
    fireEvent.click(screen.getByText('Refresh Analysis'));
    
    // Wait for refreshed recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Updated summary')).toBeInTheDocument();
    });
    
    // Axios should have been called twice
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  it('includes responses when they are provided', async () => {
    render(<AIRecommendations survey={mockSurvey} responses={mockResponses} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Check that the API call included responses flag
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/analyze-survey', {
        surveyId: mockSurvey.id,
        includeResponses: true
      });
    });
    
    // Check that the loading text mentions responses
    expect(screen.getByText('Analyzing your survey and responses...')).toBeInTheDocument();
  });

  it('shows response insights section when responses are provided and analysis is loaded', async () => {
    // Mock successful API response with response insights
    const mockAnalysis = {
      summary: 'Analysis with responses',
      designInsights: [],
      responseInsights: [
        { title: 'High Satisfaction Score', content: 'Average rating: 4.5/5', type: 'stat' }
      ],
      improvementSuggestions: [],
      nextSteps: []
    };

    axios.post.mockResolvedValueOnce({ data: mockAnalysis });

    render(<AIRecommendations survey={mockSurvey} responses={mockResponses} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Wait for analysis to load
    await waitFor(() => {
      expect(screen.getByText('Analysis with responses')).toBeInTheDocument();
    });
    
    // Check that response insights section is displayed
    expect(screen.getByText('Response Insights')).toBeInTheDocument();
    expect(screen.getByText('High Satisfaction Score')).toBeInTheDocument();
  });

  it('displays different badge variants based on insight type', async () => {
    // Mock successful API response with different insight types
    const mockAnalysis = {
      summary: 'Test summary',
      designInsights: [
        { title: 'Insight Title', content: 'Content', type: 'insight' },
        { title: 'Warning Title', content: 'Content', type: 'warning' },
        { title: 'Tip Title', content: 'Content', type: 'tip' },
        { title: 'Stat Title', content: 'Content', type: 'stat' }
      ],
      improvementSuggestions: [],
      nextSteps: []
    };

    axios.post.mockResolvedValueOnce({ data: mockAnalysis });

    render(<AIRecommendations survey={mockSurvey} />);

    // Click the generate button
    fireEvent.click(screen.getByText('Generate Analysis'));
    
    // Wait for analysis to load
    await waitFor(() => {
      expect(screen.getByText('Test summary')).toBeInTheDocument();
    });
    
    // Expand the design insights section if it's collapsed
    if (screen.queryByText('Insight Title') === null) {
      fireEvent.click(screen.getByText('Survey Design Insights'));
    }
    
    // Check for different badge variants
    expect(screen.getByText('insight')).toBeInTheDocument(); // Primary badge
    expect(screen.getByText('warning')).toBeInTheDocument(); // Warning badge
    expect(screen.getByText('tip')).toBeInTheDocument(); // Info badge
    expect(screen.getByText('stat')).toBeInTheDocument(); // Success badge
  });
}); 