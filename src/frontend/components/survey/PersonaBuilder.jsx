import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faUser,
  faBusinessTime,
  faBullseye,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

// Gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'all', label: 'All Genders' }
];

// Age range options
const AGE_RANGES = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
  { value: 'all', label: 'All Ages' }
];

// Example pain points for different contexts
const EXAMPLE_PAIN_POINTS = [
  "Lacks time to complete tasks efficiently",
  "Struggles with complex/confusing interfaces",
  "Finds current solutions too expensive",
  "Can't easily integrate with existing tools",
  "Lacks reliable technical support",
  "Has difficulty tracking and measuring results",
  "Experiences frustration with manual processes"
];

// Example goals for different contexts
const EXAMPLE_GOALS = [
  "Save time on routine tasks",
  "Reduce operational costs",
  "Increase productivity",
  "Improve customer satisfaction",
  "Make data-driven decisions",
  "Scale operations efficiently",
  "Simplify complex processes"
];

const PersonaBuilder = ({ persona, onChange }) => {
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newPreference, setNewPreference] = useState('');

  const handleInputChange = (field, value) => {
    onChange({
      ...persona,
      [field]: value
    });
  };

  const handleListItemAdd = (field, value, setter) => {
    if (value.trim()) {
      onChange({
        ...persona,
        [field]: [...persona[field], value.trim()]
      });
      setter('');
    }
  };

  const handleListItemRemove = (field, index) => {
    const updatedList = [...persona[field]];
    updatedList.splice(index, 1);
    onChange({
      ...persona,
      [field]: updatedList
    });
  };

  const handleAddExample = (field, example, currentList) => {
    if (!currentList.includes(example)) {
      onChange({
        ...persona,
        [field]: [...currentList, example]
      });
    }
  };

  return (
    <div className="persona-builder">
      <div className="persona-section">
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <FontAwesomeIcon icon={faUser} className="me-2" />
            Basic Demographics
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age Range</Form.Label>
                  <Form.Select
                    value={persona.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  >
                    <option value="">Select an age range</option>
                    {AGE_RANGES.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={persona.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Occupation/Role</Form.Label>
              <Form.Control
                type="text"
                value={persona.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="e.g., Marketing Manager, Small Business Owner, Teacher"
              />
              <Form.Text className="text-muted">
                Specify the job role or occupation of your target customer
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>
      </div>
      
      <div className="persona-section">
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Pain Points
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">
              What problems or challenges does your customer face that your product might solve?
            </p>
            
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                value={newPainPoint}
                onChange={(e) => setNewPainPoint(e.target.value)}
                placeholder="Enter a pain point..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleListItemAdd('painPoints', newPainPoint, setNewPainPoint);
                  }
                }}
              />
              <Button 
                variant="outline-primary" 
                onClick={() => handleListItemAdd('painPoints', newPainPoint, setNewPainPoint)}
                disabled={!newPainPoint.trim()}
              >
                <FontAwesomeIcon icon={faPlus} /> Add
              </Button>
            </InputGroup>
            
            <div className="examples-section mb-3">
              <p className="mb-2 small fw-bold">Examples (click to add):</p>
              <div className="example-tags">
                {EXAMPLE_PAIN_POINTS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline-secondary"
                    size="sm"
                    className="me-2 mb-2 example-tag"
                    onClick={() => handleAddExample('painPoints', example, persona.painPoints)}
                    disabled={persona.painPoints.includes(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
            
            {persona.painPoints.length > 0 ? (
              <div className="list-items">
                {persona.painPoints.map((item, index) => (
                  <div key={index} className="list-item">
                    <span className="list-item-number">{index + 1}.</span>
                    <span className="list-item-text">{item}</span>
                    <Button
                      variant="link"
                      className="list-item-remove"
                      onClick={() => handleListItemRemove('painPoints', index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center small fst-italic my-3">
                No pain points added yet. Add at least one to continue.
              </p>
            )}
          </Card.Body>
        </Card>
      </div>
      
      <div className="persona-section">
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <FontAwesomeIcon icon={faBullseye} className="me-2" />
            Goals & Motivations
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">
              What is your customer trying to achieve? What are their main goals?
            </p>
            
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Enter a goal or motivation..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleListItemAdd('goals', newGoal, setNewGoal);
                  }
                }}
              />
              <Button 
                variant="outline-primary" 
                onClick={() => handleListItemAdd('goals', newGoal, setNewGoal)}
                disabled={!newGoal.trim()}
              >
                <FontAwesomeIcon icon={faPlus} /> Add
              </Button>
            </InputGroup>
            
            <div className="examples-section mb-3">
              <p className="mb-2 small fw-bold">Examples (click to add):</p>
              <div className="example-tags">
                {EXAMPLE_GOALS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline-secondary"
                    size="sm"
                    className="me-2 mb-2 example-tag"
                    onClick={() => handleAddExample('goals', example, persona.goals)}
                    disabled={persona.goals.includes(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
            
            {persona.goals.length > 0 ? (
              <div className="list-items">
                {persona.goals.map((item, index) => (
                  <div key={index} className="list-item">
                    <span className="list-item-number">{index + 1}.</span>
                    <span className="list-item-text">{item}</span>
                    <Button
                      variant="link"
                      className="list-item-remove"
                      onClick={() => handleListItemRemove('goals', index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center small fst-italic my-3">
                No goals added yet. Add at least one to continue.
              </p>
            )}
          </Card.Body>
        </Card>
      </div>
      
      <div className="persona-section">
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <FontAwesomeIcon icon={faBusinessTime} className="me-2" />
            Preferences (Optional)
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">
              What preferences, communication styles, or behaviors characterize your customer?
            </p>
            
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                value={newPreference}
                onChange={(e) => setNewPreference(e.target.value)}
                placeholder="Enter a preference or characteristic..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleListItemAdd('preferences', newPreference, setNewPreference);
                  }
                }}
              />
              <Button 
                variant="outline-primary" 
                onClick={() => handleListItemAdd('preferences', newPreference, setNewPreference)}
                disabled={!newPreference.trim()}
              >
                <FontAwesomeIcon icon={faPlus} /> Add
              </Button>
            </InputGroup>
            
            {persona.preferences.length > 0 ? (
              <div className="list-items">
                {persona.preferences.map((item, index) => (
                  <div key={index} className="list-item">
                    <span className="list-item-number">{index + 1}.</span>
                    <span className="list-item-text">{item}</span>
                    <Button
                      variant="link"
                      className="list-item-remove"
                      onClick={() => handleListItemRemove('preferences', index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center small fst-italic my-3">
                No preferences added yet. This section is optional.
              </p>
            )}
          </Card.Body>
        </Card>
      </div>
      
      <style jsx>{`
        .list-items {
          margin-top: 1rem;
        }
        
        .list-item {
          display: flex;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;
          align-items: center;
        }
        
        .list-item:last-child {
          border-bottom: none;
        }
        
        .list-item-number {
          min-width: 25px;
          color: var(--bs-primary);
          font-weight: bold;
        }
        
        .list-item-text {
          flex-grow: 1;
        }
        
        .list-item-remove {
          color: #dc3545;
          padding: 0.25rem 0.5rem;
        }
        
        .list-item-remove:hover {
          background-color: rgba(220, 53, 69, 0.1);
          border-radius: 4px;
        }
        
        .example-tags {
          display: flex;
          flex-wrap: wrap;
        }
        
        .example-tag:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

PersonaBuilder.propTypes = {
  persona: PropTypes.shape({
    age: PropTypes.string,
    gender: PropTypes.string,
    occupation: PropTypes.string,
    painPoints: PropTypes.arrayOf(PropTypes.string).isRequired,
    goals: PropTypes.arrayOf(PropTypes.string).isRequired,
    preferences: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default PersonaBuilder; 