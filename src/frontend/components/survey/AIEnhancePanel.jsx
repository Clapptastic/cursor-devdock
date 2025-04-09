import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Modal, 
  Button, 
  Form, 
  Spinner, 
  Alert, 
  ToggleButtonGroup, 
  ToggleButton,
  Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagic, 
  faClone, 
  faWandMagicSparkles,
  faPencilAlt, 
  faRobot,
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const AIEnhancePanel = ({ survey, onClose, onApplyChanges }) => {
  const [enhancementType, setEnhancementType] = useState('optimize');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enhancedQuestions, setEnhancedQuestions] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // The different enhancement types available
  const ENHANCEMENT_TYPES = [
    {
      id: 'optimize',
      name: 'Optimize Questions',
      icon: faWandMagicSparkles,
      description: 'Improve clarity, reduce bias, and enhance question effectiveness.',
      prompt: 'Optimize my survey questions to improve clarity, reduce bias, and make them more effective for gathering insights.'
    },
    {
      id: 'expand',
      name: 'Expand Survey',
      icon: faClone,
      description: 'Generate additional questions to make the survey more comprehensive.',
      prompt: 'Suggest additional questions that would make my survey more comprehensive and help gather deeper insights.'
    },
    {
      id: 'rewrite',
      name: 'Rewrite Questions',
      icon: faPencilAlt,
      description: 'Completely rewrite the questions while preserving their intent.',
      prompt: 'Rewrite my survey questions to improve their clarity and effectiveness while preserving their original intent.'
    },
    {
      id: 'custom',
      name: 'Custom Enhancement',
      icon: faRobot,
      description: 'Write your own prompt to guide the AI enhancement.',
      prompt: ''
    }
  ];

  const getPrompt = () => {
    if (enhancementType === 'custom') {
      return customPrompt;
    }
    
    const selectedType = ENHANCEMENT_TYPES.find(type => type.id === enhancementType);
    return selectedType ? selectedType.prompt : '';
  };

  const handleEnhance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setEnhancedQuestions(null);
      
      const prompt = getPrompt();
      
      if (!prompt) {
        setError('Please provide a prompt for the AI enhancement.');
        return;
      }
      
      // Prepare the context for the AI
      const context = {
        title: survey.title,
        description: survey.description,
        industry: survey.industry,
        businessStage: survey.businessStage,
        customerSegment: survey.customerSegment,
        questions: survey.questions
      };
      
      // Call the AI enhancement endpoint
      const response = await axios.post('/api/ai/optimize-survey', {
        prompt,
        context,
        surveyId: survey.id
      });
      
      const { questions } = response.data;
      
      if (!questions || !Array.isArray(questions)) {
        throw new Error('Invalid response from AI service');
      }
      
      setEnhancedQuestions(questions);
    } catch (err) {
      console.error('Error enhancing survey:', err);
      setError(err.response?.data?.message || 'Failed to enhance survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (enhancedQuestions) {
      onApplyChanges(enhancedQuestions);
    }
  };

  return (
    <Modal 
      show={true} 
      onHide={onClose}
      size="lg"
      backdrop="static"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faMagic} className="me-2 text-primary" />
          AI Enhance Survey
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        <div className="mb-4">
          <h5>Enhancement Type</h5>
          <p className="text-muted small">
            Select how you'd like AI to enhance your survey.
          </p>
          
          <ToggleButtonGroup 
            type="radio" 
            name="enhancementType" 
            value={enhancementType}
            onChange={setEnhancementType}
            className="w-100 enhancement-type-selector mb-3"
          >
            {ENHANCEMENT_TYPES.map(type => (
              <ToggleButton
                key={type.id}
                id={`enhancement-${type.id}`}
                value={type.id}
                variant="outline-primary"
                className="enhancement-type-button"
              >
                <FontAwesomeIcon icon={type.icon} className="me-2" />
                {type.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          
          <div className="enhancement-description p-3 bg-light rounded">
            <p className="mb-1">
              <strong>
                {ENHANCEMENT_TYPES.find(type => type.id === enhancementType)?.name}
              </strong>
            </p>
            <p className="mb-0 small">
              {ENHANCEMENT_TYPES.find(type => type.id === enhancementType)?.description}
            </p>
          </div>
        </div>
        
        {enhancementType === 'custom' && (
          <Form.Group className="mb-4">
            <Form.Label>Custom Enhancement Prompt</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe how you want AI to enhance your survey..."
            />
            <Form.Text className="text-muted">
              Be specific about what aspects of the survey you want to improve.
            </Form.Text>
          </Form.Group>
        )}
        
        {!enhancedQuestions && !isLoading && (
          <div className="text-center mb-3">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleEnhance}
              disabled={enhancementType === 'custom' && !customPrompt.trim()}
            >
              <FontAwesomeIcon icon={faMagic} className="me-2" />
              Enhance with AI
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">
              The AI is working on enhancing your survey...
            </p>
          </div>
        )}
        
        {enhancedQuestions && (
          <div className="enhanced-questions mt-4">
            <h5>Enhanced Questions</h5>
            <p className="text-muted small mb-3">
              Review the AI-enhanced questions before applying them to your survey.
            </p>
            
            <div className="questions-comparison">
              {enhancedQuestions.map((question, index) => (
                <Card key={index} className="mb-3 enhanced-question-card">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="question-number me-2">#{index + 1}</span>
                        <span className="question-type-badge">
                          {question.type.replace('_', ' ')}
                        </span>
                      </div>
                      {question.id.startsWith('new_') && (
                        <span className="new-question-badge bg-success text-white px-2 py-1 rounded-pill small">
                          New
                        </span>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <h6>{question.question}</h6>
                    {question.description && (
                      <p className="text-muted small">{question.description}</p>
                    )}
                    
                    {['multiple_choice', 'checkbox', 'dropdown'].includes(question.type) && question.options && (
                      <div className="mt-2">
                        <strong className="small">Options:</strong>
                        <ul className="small mb-0 ps-3">
                          {question.options.map((option, i) => (
                            <li key={i}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {question.type === 'rating' && (
                      <div className="mt-2 small">
                        <strong>Scale:</strong> {question.min || 1} to {question.max || 5}
                        {question.labels && (
                          <div>
                            <span>{question.labels.min} → {question.labels.max}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Cancel
        </Button>
        
        {enhancedQuestions && (
          <Button variant="success" onClick={handleApplyChanges}>
            Apply Changes
          </Button>
        )}
      </Modal.Footer>
      
      <style jsx>{`
        .enhancement-type-selector {
          display: grid;
          grid-template-columns: repeat(${ENHANCEMENT_TYPES.length}, 1fr);
          gap: 8px;
        }
        
        .enhancement-type-button {
          text-align: center;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        
        .enhancement-description {
          border-left: 3px solid var(--bs-primary);
        }
        
        .questions-comparison {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .enhanced-question-card {
          border-left: 3px solid var(--bs-primary);
        }
        
        .question-number {
          font-weight: bold;
          color: var(--bs-primary);
        }
        
        .question-type-badge {
          background-color: #e9ecef;
          color: #495057;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-transform: capitalize;
        }
      `}</style>
    </Modal>
  );
};

AIEnhancePanel.propTypes = {
  survey: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onApplyChanges: PropTypes.func.isRequired
};

export default AIEnhancePanel; 