import React from 'react';
import PropTypes from 'prop-types';
import { Form, Row, Col, Button, Card, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faArrowUp, 
  faArrowDown, 
  faGripVertical 
} from '@fortawesome/free-solid-svg-icons';

const QuestionEditor = ({ question, onChange }) => {
  if (!question) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    onChange({
      ...question,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleOptionsChange = (index, value) => {
    if (!question.options) return;
    
    const updatedOptions = [...question.options];
    updatedOptions[index] = value;
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };

  const handleAddOption = () => {
    if (!question.options) return;
    
    onChange({
      ...question,
      options: [...question.options, `Option ${question.options.length + 1}`]
    });
  };

  const handleRemoveOption = (index) => {
    if (!question.options) return;
    
    const updatedOptions = [...question.options];
    updatedOptions.splice(index, 1);
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };

  const handleMoveOption = (index, direction) => {
    if (!question.options) return;
    
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === question.options.length - 1)
    ) {
      return;
    }
    
    const updatedOptions = [...question.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap options
    [updatedOptions[index], updatedOptions[targetIndex]] = 
    [updatedOptions[targetIndex], updatedOptions[index]];
    
    onChange({
      ...question,
      options: updatedOptions
    });
  };

  const handleRatingChange = (field, value) => {
    onChange({
      ...question,
      [field]: parseInt(value, 10)
    });
  };

  const handleLabelChange = (field, value) => {
    onChange({
      ...question,
      labels: {
        ...question.labels,
        [field]: value
      }
    });
  };

  return (
    <div className="question-editor">
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Question Text</Form.Label>
          <Form.Control
            type="text"
            name="question"
            value={question.question}
            onChange={handleInputChange}
            placeholder="Enter your question text"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Description (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="description"
            value={question.description}
            onChange={handleInputChange}
            placeholder="Add additional instructions or context"
          />
        </Form.Group>
        
        {/* Options for multiple choice, checkbox, or dropdown questions */}
        {['multiple_choice', 'checkbox', 'dropdown'].includes(question.type) && (
          <div className="question-options mb-3">
            <Form.Label>Answer Options</Form.Label>
            
            <div className="options-list mb-2">
              {question.options.map((option, index) => (
                <div key={index} className="option-item">
                  <InputGroup className="mb-2">
                    <InputGroup.Text className="option-drag-handle">
                      <FontAwesomeIcon icon={faGripVertical} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionsChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => handleMoveOption(index, 'up')}
                      disabled={index === 0}
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      onClick={() => handleMoveOption(index, 'down')}
                      disabled={index === question.options.length - 1}
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </Button>
                    <Button 
                      variant="outline-danger"
                      onClick={() => handleRemoveOption(index)}
                      disabled={question.options.length <= 2}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </InputGroup>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleAddOption}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Option
            </Button>
          </div>
        )}
        
        {/* Settings for rating questions */}
        {question.type === 'rating' && (
          <Card className="mb-3 p-3 bg-light">
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Minimum Value</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={9}
                    value={question.min}
                    onChange={(e) => handleRatingChange('min', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    The lowest value on the scale
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Maximum Value</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={10}
                    value={question.max}
                    onChange={(e) => handleRatingChange('max', e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    The highest value on the scale
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Min Label</Form.Label>
                  <Form.Control
                    type="text"
                    value={question.labels?.min || ''}
                    onChange={(e) => handleLabelChange('min', e.target.value)}
                    placeholder="e.g., Not at all likely"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Max Label</Form.Label>
                  <Form.Control
                    type="text"
                    value={question.labels?.max || ''}
                    onChange={(e) => handleLabelChange('max', e.target.value)}
                    placeholder="e.g., Extremely likely"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}
        
        <Row className="mb-3">
          <Col xs={12}>
            <Form.Check 
              type="switch"
              id="required-switch"
              name="required"
              label="Required question"
              checked={question.required}
              onChange={handleInputChange}
            />
          </Col>
        </Row>
      </Form>
      
      <div className="question-preview mt-4">
        <h5>Question Preview</h5>
        <Card className="p-3">
          <RenderQuestionPreview question={question} />
        </Card>
      </div>
      
      <style jsx>{`
        .option-drag-handle {
          cursor: move;
          background-color: #f8f9fa;
          border-right: none;
        }
        
        .option-item {
          position: relative;
        }
      `}</style>
    </div>
  );
};

const RenderQuestionPreview = ({ question }) => {
  if (!question) return null;
  
  return (
    <div className="preview-container">
      <div className="preview-question">
        {question.question || 'Your question will appear here'}
        {question.required && <span className="text-danger ms-1">*</span>}
      </div>
      
      {question.description && (
        <div className="preview-description text-muted mb-3">
          {question.description}
        </div>
      )}
      
      {question.type === 'multiple_choice' && (
        <div className="preview-options">
          {question.options?.map((option, index) => (
            <Form.Check
              key={index}
              type="radio"
              id={`preview-radio-${index}`}
              label={option}
              name="preview-radio-group"
              disabled
            />
          ))}
        </div>
      )}
      
      {question.type === 'checkbox' && (
        <div className="preview-options">
          {question.options?.map((option, index) => (
            <Form.Check
              key={index}
              type="checkbox"
              id={`preview-checkbox-${index}`}
              label={option}
              disabled
            />
          ))}
        </div>
      )}
      
      {question.type === 'dropdown' && (
        <Form.Select disabled>
          <option>Select an option</option>
          {question.options?.map((option, index) => (
            <option key={index}>{option}</option>
          ))}
        </Form.Select>
      )}
      
      {question.type === 'rating' && (
        <div className="preview-rating mb-3">
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
          
          <div className="rating-buttons">
            {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }).map((_, i) => (
              <Button 
                key={i} 
                variant="outline-secondary"
                className="rating-button"
                disabled
              >
                {(question.min || 1) + i}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {question.type === 'open_ended' && (
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Respondent answer will appear here"
          disabled
        />
      )}
      
      <style jsx>{`
        .preview-container {
          margin-bottom: 1rem;
        }
        
        .preview-question {
          font-weight: 500;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        
        .preview-description {
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        
        .rating-buttons {
          display: flex;
          justify-content: space-between;
        }
        
        .rating-button {
          min-width: 40px;
        }
        
        .rating-min,
        .rating-max {
          font-size: 0.8rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

RenderQuestionPreview.propTypes = {
  question: PropTypes.object
};

QuestionEditor.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string,
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
  }),
  onChange: PropTypes.func.isRequired
};

export default QuestionEditor; 