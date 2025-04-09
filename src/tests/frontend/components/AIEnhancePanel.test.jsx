import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AIEnhancePanel from '../../../frontend/components/survey/AIEnhancePanel';

// Mock axios
jest.mock('axios');

describe('AIEnhancePanel Component', () => {
  const mockSurvey = {
    id: 'survey123',
    title: 'Test Survey',
    description: 'A test survey description',
    industry: 'Technology',
    businessStage: 'mvp',
    customerSegment: ['B2B'],
    questions: [
      {
        id: 'q1',
        question: 'How satisfied are you with our product?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        labels: {
          min: 'Not satisfied',
          max: 'Very satisfied'
        }
      }
    ]
  };

  const mockOnClose = jest.fn();
  const mockOnApplyChanges = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default enhancement type', () => {
    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Check title is present
    expect(screen.getByText('AI Enhance Survey')).toBeInTheDocument();
    
    // Check enhancement types are present
    expect(screen.getByText('Optimize Questions')).toBeInTheDocument();
    expect(screen.getByText('Expand Survey')).toBeInTheDocument();
    expect(screen.getByText('Rewrite Questions')).toBeInTheDocument();
    expect(screen.getByText('Custom Enhancement')).toBeInTheDocument();
    
    // Check that the enhance button is present
    expect(screen.getByText('Enhance with AI')).toBeInTheDocument();
  });

  it('allows changing enhancement type', () => {
    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Initially "Optimize Questions" should be selected
    expect(screen.getByText('Improve clarity, reduce bias, and enhance question effectiveness.')).toBeInTheDocument();
    
    // Click on "Expand Survey"
    fireEvent.click(screen.getByText('Expand Survey'));
    
    // Now the description should change
    expect(screen.getByText('Generate additional questions to make the survey more comprehensive.')).toBeInTheDocument();
  });

  it('shows custom prompt input when "Custom Enhancement" is selected', () => {
    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Custom prompt input should not be visible initially
    expect(screen.queryByLabelText('Custom Enhancement Prompt')).not.toBeInTheDocument();
    
    // Click on "Custom Enhancement"
    fireEvent.click(screen.getByText('Custom Enhancement'));
    
    // Now the custom prompt input should be visible
    expect(screen.getByLabelText('Custom Enhancement Prompt')).toBeInTheDocument();
  });

  it('disables enhance button when custom enhancement is selected with empty prompt', () => {
    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Click on "Custom Enhancement"
    fireEvent.click(screen.getByText('Custom Enhancement'));
    
    // The button should be disabled
    expect(screen.getByText('Enhance with AI').closest('button')).toBeDisabled();
    
    // Add some text to the custom prompt
    fireEvent.change(screen.getByLabelText('Custom Enhancement Prompt'), {
      target: { value: 'Make my survey more engaging' }
    });
    
    // Now the button should be enabled
    expect(screen.getByText('Enhance with AI').closest('button')).not.toBeDisabled();
  });

  it('calls API when enhance button is clicked', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        questions: [
          {
            id: 'q1',
            question: 'Enhanced question version',
            type: 'rating',
            required: true,
            min: 1,
            max: 5,
            labels: {
              min: 'Not at all satisfied',
              max: 'Extremely satisfied'
            }
          }
        ]
      }
    });

    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Click the enhance button
    fireEvent.click(screen.getByText('Enhance with AI'));
    
    // Should show loading state
    expect(screen.getByText('The AI is working on enhancing your survey...')).toBeInTheDocument();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/optimize-survey', expect.objectContaining({
        prompt: expect.any(String),
        context: expect.objectContaining({
          title: mockSurvey.title,
          questions: mockSurvey.questions
        }),
        surveyId: mockSurvey.id
      }));
    });
    
    // Should show enhanced questions
    await waitFor(() => {
      expect(screen.getByText('Enhanced Questions')).toBeInTheDocument();
      expect(screen.getByText('Enhanced question version')).toBeInTheDocument();
      expect(screen.getByText('Apply Changes')).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    // Mock API failure
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'API error message'
        }
      }
    });

    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Click the enhance button
    fireEvent.click(screen.getByText('Enhance with AI'));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('API error message')).toBeInTheDocument();
    });
  });

  it('applies changes when "Apply Changes" button is clicked', async () => {
    // Mock successful API response
    const enhancedQuestions = [
      {
        id: 'q1',
        question: 'Enhanced question version',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        labels: {
          min: 'Not at all satisfied',
          max: 'Extremely satisfied'
        }
      }
    ];
    
    axios.post.mockResolvedValueOnce({
      data: {
        questions: enhancedQuestions
      }
    });

    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Click the enhance button
    fireEvent.click(screen.getByText('Enhance with AI'));
    
    // Wait for enhanced questions to load
    await waitFor(() => {
      expect(screen.getByText('Apply Changes')).toBeInTheDocument();
    });
    
    // Click apply changes
    fireEvent.click(screen.getByText('Apply Changes'));
    
    // Check that the callback was called with the enhanced questions
    expect(mockOnApplyChanges).toHaveBeenCalledWith(enhancedQuestions);
  });

  it('closes the panel when cancel button is clicked', () => {
    render(
      <AIEnhancePanel
        survey={mockSurvey}
        onClose={mockOnClose}
        onApplyChanges={mockOnApplyChanges}
      />
    );

    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check that the onClose callback was called
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 