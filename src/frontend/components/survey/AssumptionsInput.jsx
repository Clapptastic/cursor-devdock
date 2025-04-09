import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Card, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faArrowUp, 
  faArrowDown, 
  faLightbulb 
} from '@fortawesome/free-solid-svg-icons';

// Example assumptions for different business stages to help users
const EXAMPLE_ASSUMPTIONS = {
  ideation: [
    "Our target customers experience problem X frequently",
    "Customers are willing to pay for a solution to problem X",
    "Current solutions in the market are inadequate",
    "Feature Y is essential for our target customers"
  ],
  mvp: [
    "Our current MVP solves the core problem for customers",
    "Our pricing model is attractive to our target segment",
    "Users can easily understand how to use our product",
    "Our product delivers measurable value to customers"
  ],
  pmf: [
    "Our product satisfies the needs of our target market",
    "Our current acquisition channels can scale",
    "Customers are willing to recommend our product",
    "Our business model is sustainable with current metrics"
  ],
  scaling: [
    "Our product can serve larger enterprise customers",
    "Our infrastructure can handle 10x current load",
    "Our pricing strategy is optimal for growth",
    "Our customer success process can scale with growth"
  ]
};

const AssumptionsInput = ({ assumptions, onChange, businessStage = 'ideation' }) => {
  const [newAssumption, setNewAssumption] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleAddAssumption = () => {
    if (newAssumption.trim()) {
      onChange([...assumptions, newAssumption.trim()]);
      setNewAssumption('');
    }
  };

  const handleRemoveAssumption = (index) => {
    const updatedAssumptions = [...assumptions];
    updatedAssumptions.splice(index, 1);
    onChange(updatedAssumptions);
  };

  const handleMoveAssumption = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === assumptions.length - 1)
    ) {
      return;
    }

    const updatedAssumptions = [...assumptions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [updatedAssumptions[index], updatedAssumptions[targetIndex]] = 
    [updatedAssumptions[targetIndex], updatedAssumptions[index]];
    
    onChange(updatedAssumptions);
  };

  const handleAddExample = (example) => {
    if (!assumptions.includes(example)) {
      onChange([...assumptions, example]);
    }
  };

  const getCurrentExamples = () => {
    return EXAMPLE_ASSUMPTIONS[businessStage] || EXAMPLE_ASSUMPTIONS.ideation;
  };

  return (
    <div className="assumptions-input">
      <Form.Group className="mb-3">
        <Form.Label>Business Assumptions</Form.Label>
        <p className="text-muted small">
          What key hypotheses or assumptions do you want to validate with this survey? 
          These will help focus your questions on gathering the most valuable insights.
        </p>
        
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            value={newAssumption}
            onChange={(e) => setNewAssumption(e.target.value)}
            placeholder="Enter a business assumption or hypothesis..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAssumption();
              }
            }}
          />
          <Button 
            variant="outline-primary" 
            onClick={handleAddAssumption}
            disabled={!newAssumption.trim()}
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </Button>
        </InputGroup>
        
        <Button 
          variant="link" 
          className="p-0 mb-3 text-decoration-none"
          onClick={() => setShowExamples(!showExamples)}
        >
          <FontAwesomeIcon icon={faLightbulb} className="me-1" />
          {showExamples ? 'Hide Examples' : 'Show Examples'}
        </Button>
        
        {showExamples && (
          <Card className="mb-3 example-card">
            <Card.Header>Example Assumptions</Card.Header>
            <Card.Body>
              <p className="small text-muted">
                Click an example to add it to your list.
              </p>
              <ul className="example-list">
                {getCurrentExamples().map((example, index) => (
                  <li key={index}>
                    <Button 
                      variant="link" 
                      className="p-0 example-button"
                      onClick={() => handleAddExample(example)}
                      disabled={assumptions.includes(example)}
                    >
                      {example}
                    </Button>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        )}
        
        {assumptions.length > 0 && (
          <div className="assumptions-list">
            <Form.Label>Your Assumptions:</Form.Label>
            {assumptions.map((assumption, index) => (
              <Card key={index} className="mb-2 assumption-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="assumption-number me-2">
                      {index + 1}.
                    </div>
                    <div className="assumption-text flex-grow-1">
                      {assumption}
                    </div>
                    <div className="assumption-actions">
                      <Button 
                        variant="link" 
                        className="p-1 action-button"
                        onClick={() => handleMoveAssumption(index, 'up')}
                        disabled={index === 0}
                      >
                        <FontAwesomeIcon icon={faArrowUp} />
                      </Button>
                      <Button 
                        variant="link" 
                        className="p-1 action-button"
                        onClick={() => handleMoveAssumption(index, 'down')}
                        disabled={index === assumptions.length - 1}
                      >
                        <FontAwesomeIcon icon={faArrowDown} />
                      </Button>
                      <Button 
                        variant="link" 
                        className="p-1 action-button text-danger"
                        onClick={() => handleRemoveAssumption(index)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Form.Group>
      
      <style jsx>{`
        .example-card {
          background-color: #f8f9fa;
          border-color: #e9ecef;
        }
        
        .example-list {
          padding-left: 1.5rem;
          margin-bottom: 0;
        }
        
        .example-button {
          color: #495057;
          text-decoration: none;
        }
        
        .example-button:hover:not(:disabled) {
          color: var(--bs-primary);
          text-decoration: underline;
        }
        
        .example-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .assumption-card {
          border-left: 3px solid var(--bs-primary);
        }
        
        .assumption-number {
          font-weight: bold;
          color: var(--bs-primary);
          min-width: 20px;
        }
        
        .action-button {
          padding: 0.25rem 0.5rem;
          color: #6c757d;
        }
        
        .action-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

AssumptionsInput.propTypes = {
  assumptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  businessStage: PropTypes.string
};

export default AssumptionsInput; 