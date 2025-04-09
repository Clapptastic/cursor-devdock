import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Button, ProgressBar, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons';

const SurveyPreview = ({ survey }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  if (!survey || !survey.questions || survey.questions.length === 0) {
    return (
      <div className="text-center p-5">
        <p className="text-muted">This survey has no questions yet.</p>
      </div>
    );
  }
  
  const { settings = {} } = survey;
  const questionsPerPage = settings.questionsPerPage || 1;
  const totalPages = Math.ceil(survey.questions.length / questionsPerPage);
  const showQuestionNumbers = settings.showQuestionNumbers !== false;
  const showProgressBar = settings.showProgressBar !== false;
  
  // Calculate current questions to display
  const startIndex = currentPage * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, survey.questions.length);
  const currentQuestions = survey.questions.slice(startIndex, endIndex);
  
  const handleInputChange = (questionId, value, type = 'single') => {
    if (type === 'checkbox') {
      // For checkboxes, we need to handle multiple selected values
      setResponses(prev => {
        const currentValues = prev[questionId] || [];
        
        if (currentValues.includes(value)) {
          // Remove if already selected
          return {
            ...prev,
            [questionId]: currentValues.filter(v => v !== value)
          };
        } else {
          // Add if not selected
          return {
            ...prev,
            [questionId]: [...currentValues, value]
          };
        }
      });
    } else {
      // For other question types
      setResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };
  
  const isQuestionAnswered = (questionId) => {
    const response = responses[questionId];
    
    if (response === undefined) return false;
    if (Array.isArray(response) && response.length === 0) return false;
    if (response === '') return false;
    
    return true;
  };
  
  const canNavigateNext = () => {
    // Check if all required questions on current page are answered
    const allRequiredAnswered = currentQuestions.every(question => {
      if (question.required) {
        return isQuestionAnswered(question.id);
      }
      return true;
    });
    
    return allRequiredAnswered;
  };
  
  const handleNext = () => {
    if (canNavigateNext()) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
        window.scrollTo(0, 0);
      } else {
        // Submit the survey
        setSubmitted(true);
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleReset = () => {
    setCurrentPage(0);
    setResponses({});
    setSubmitted(false);
  };
  
  if (submitted) {
    return (
      <Card className="text-center p-5">
        <div className="mb-4">
          <FontAwesomeIcon icon={faCheck} className="text-success" style={{ fontSize: '3rem' }} />
        </div>
        <h3>Thank you for completing the survey!</h3>
        <p className="text-muted">Your responses have been recorded.</p>
        <div className="mt-4">
          <Button variant="primary" onClick={handleReset}>
            Preview Again
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="survey-preview">
      <div className="survey-header mb-4">
        <h2>{survey.title}</h2>
        {survey.description && <p className="text-muted">{survey.description}</p>}
        
        {showProgressBar && (
          <div className="mt-3">
            <ProgressBar 
              now={(currentPage / (totalPages - 1)) * 100} 
              variant="primary" 
              className="preview-progress-bar"
            />
            <div className="d-flex justify-content-between text-muted small mt-1">
              <span>Start</span>
              <span>Page {currentPage + 1} of {totalPages}</span>
              <span>End</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="survey-questions">
        {currentQuestions.map((question, index) => {
          const questionNumber = startIndex + index + 1;
          
          return (
            <Card key={question.id} className="question-card mb-4">
              <Card.Body>
                <div className="question-header mb-3">
                  {showQuestionNumbers && (
                    <Badge bg="primary" className="question-number me-2">
                      {questionNumber}
                    </Badge>
                  )}
                  <h5 className="question-text d-inline">
                    {question.question}
                    {question.required && <span className="text-danger ms-1">*</span>}
                  </h5>
                </div>
                
                {question.description && (
                  <p className="text-muted question-description mb-3">
                    {question.description}
                  </p>
                )}
                
                <div className="question-input">
                  {renderQuestionInput(question, responses, handleInputChange)}
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
      
      <div className="survey-navigation d-flex justify-content-between mt-4">
        <Button 
          variant="outline-secondary" 
          onClick={handlePrevious}
          disabled={currentPage === 0}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
          Previous
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleNext}
          disabled={!canNavigateNext()}
        >
          {currentPage < totalPages - 1 ? (
            <>
              Next
              <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>
      
      <style jsx>{`
        .survey-preview {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .preview-progress-bar {
          height: 8px;
        }
        
        .question-card {
          border-radius: 8px;
          border-left: 4px solid var(--bs-primary);
        }
        
        .question-number {
          min-width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .question-text {
          font-weight: 500;
        }
        
        .question-description {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

// Helper function to render the appropriate input for each question type
const renderQuestionInput = (question, responses, handleInputChange) => {
  const response = responses[question.id];
  
  switch (question.type) {
    case 'multiple_choice':
      return (
        <div>
          {question.options.map((option, i) => (
            <Form.Check
              key={i}
              type="radio"
              id={`${question.id}-option-${i}`}
              name={question.id}
              label={option}
              checked={response === option}
              onChange={() => handleInputChange(question.id, option)}
            />
          ))}
        </div>
      );
    
    case 'checkbox':
      return (
        <div>
          {question.options.map((option, i) => (
            <Form.Check
              key={i}
              type="checkbox"
              id={`${question.id}-option-${i}`}
              label={option}
              checked={Array.isArray(response) && response.includes(option)}
              onChange={() => handleInputChange(question.id, option, 'checkbox')}
            />
          ))}
        </div>
      );
    
    case 'dropdown':
      return (
        <Form.Select
          value={response || ''}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
        >
          <option value="">Select an option</option>
          {question.options.map((option, i) => (
            <option key={i} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      );
    
    case 'rating':
      return (
        <div>
          <div className="d-flex justify-content-between mb-2">
            <div className="rating-min">
              {question.min || 1}
              {question.labels?.min && ` - ${question.labels.min}`}
            </div>
            <div className="rating-max">
              {question.max || 5}
              {question.labels?.max && ` - ${question.labels.max}`}
            </div>
          </div>
          
          <div className="rating-buttons d-flex justify-content-between">
            {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }).map((_, i) => {
              const value = (question.min || 1) + i;
              return (
                <Button 
                  key={i} 
                  variant={value === response ? 'primary' : 'outline-secondary'}
                  className="rating-button"
                  onClick={() => handleInputChange(question.id, value)}
                >
                  {value}
                </Button>
              );
            })}
          </div>
        </div>
      );
    
    case 'open_ended':
    default:
      return (
        <Form.Control
          as="textarea"
          rows={3}
          value={response || ''}
          onChange={(e) => handleInputChange(question.id, e.target.value)}
          placeholder="Your answer"
        />
      );
  }
};

SurveyPreview.propTypes = {
  survey: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        question: PropTypes.string,
        description: PropTypes.string,
        required: PropTypes.bool,
        options: PropTypes.arrayOf(PropTypes.string),
        min: PropTypes.number,
        max: PropTypes.number,
        labels: PropTypes.shape({
          min: PropTypes.string,
          max: PropTypes.string
        })
      })
    ),
    settings: PropTypes.shape({
      questionsPerPage: PropTypes.number,
      showProgressBar: PropTypes.bool,
      showQuestionNumbers: PropTypes.bool
    })
  })
};

export default SurveyPreview; 