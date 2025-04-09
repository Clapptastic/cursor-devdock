import React from 'react';
import PropTypes from 'prop-types';
import { Form, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faFlask, 
  faBullseye, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';

// Business stages with descriptions and icons
const BUSINESS_STAGES = [
  { 
    value: 'ideation', 
    label: 'Ideation', 
    icon: faLightbulb,
    description: 'You have an idea but haven\'t built anything yet. You\'re validating the problem and solution.' 
  },
  { 
    value: 'mvp', 
    label: 'MVP Testing', 
    icon: faFlask,
    description: 'You have a minimal viable product and are testing with early users to validate assumptions.' 
  },
  { 
    value: 'pmf', 
    label: 'Product-Market Fit', 
    icon: faBullseye,
    description: 'You\'re refining your product based on early user feedback and seeking the right market fit.' 
  },
  { 
    value: 'scaling', 
    label: 'Scaling', 
    icon: faChartLine,
    description: 'You have product-market fit and are focused on growth and scaling your business.' 
  }
];

const BusinessStageSelector = ({ value, onChange }) => {
  return (
    <Form.Group className="mb-4">
      <Form.Label>Business Stage</Form.Label>
      <div className="business-stage-cards">
        {BUSINESS_STAGES.map((stage) => (
          <Card 
            key={stage.value}
            className={`business-stage-card ${value === stage.value ? 'selected' : ''}`}
            onClick={() => onChange(stage.value)}
          >
            <Card.Body>
              <div className="icon-container">
                <FontAwesomeIcon icon={stage.icon} size="2x" />
              </div>
              <Card.Title>{stage.label}</Card.Title>
              <Card.Text>{stage.description}</Card.Text>
            </Card.Body>
          </Card>
        ))}
      </div>
      <Form.Text className="text-muted">
        The business stage helps us customize questions to validate the right assumptions.
      </Form.Text>
      
      <style jsx>{`
        .business-stage-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .business-stage-card {
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
          border: 2px solid transparent;
        }
        
        .business-stage-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .business-stage-card.selected {
          border-color: var(--bs-primary);
          background-color: rgba(var(--bs-primary-rgb), 0.05);
        }
        
        .icon-container {
          margin-bottom: 1rem;
          color: var(--bs-primary);
        }
      `}</style>
    </Form.Group>
  );
};

BusinessStageSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BusinessStageSelector; 