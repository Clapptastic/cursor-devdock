import React from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListUl, 
  faCheckSquare, 
  faAlignLeft, 
  faStar, 
  faCaretDown 
} from '@fortawesome/free-solid-svg-icons';

// Define question types with icons and descriptions
const QUESTION_TYPES = [
  {
    type: 'multiple_choice',
    label: 'Multiple Choice',
    icon: faListUl,
    description: 'Respondents select one option from a list',
    color: '#4285f4'
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: faCheckSquare,
    description: 'Respondents select multiple options from a list',
    color: '#34a853'
  },
  {
    type: 'open_ended',
    label: 'Open-Ended',
    icon: faAlignLeft,
    description: 'Respondents provide a free-form text response',
    color: '#ea4335'
  },
  {
    type: 'rating',
    label: 'Rating Scale',
    icon: faStar,
    description: 'Respondents rate on a numerical scale',
    color: '#fbbc05'
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: faCaretDown,
    description: 'Respondents select one option from a dropdown menu',
    color: '#9c27b0'
  }
];

const QuestionTypeSelector = ({ onSelectType, displayMode = 'card' }) => {
  if (displayMode === 'button') {
    return (
      <div className="question-type-buttons">
        {QUESTION_TYPES.map((questionType) => (
          <Button
            key={questionType.type}
            variant="outline-primary"
            className="me-2 mb-2"
            onClick={() => onSelectType(questionType.type)}
          >
            <FontAwesomeIcon icon={questionType.icon} className="me-2" />
            {questionType.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Row xs={1} sm={2} md={QUESTION_TYPES.length} className="g-3">
      {QUESTION_TYPES.map((questionType) => (
        <Col key={questionType.type}>
          <Card 
            className="question-type-card"
            onClick={() => onSelectType(questionType.type)}
          >
            <Card.Body>
              <div 
                className="question-type-icon" 
                style={{ backgroundColor: questionType.color }}
              >
                <FontAwesomeIcon icon={questionType.icon} />
              </div>
              <Card.Title className="question-type-title">
                {questionType.label}
              </Card.Title>
              <Card.Text className="question-type-description">
                {questionType.description}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}

      <style jsx>{`
        .question-type-card {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          height: 100%;
        }

        .question-type-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .question-type-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          margin-bottom: 12px;
          color: white;
        }

        .question-type-title {
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .question-type-description {
          font-size: 0.8rem;
          color: #6c757d;
          margin-bottom: 0;
        }
      `}</style>
    </Row>
  );
};

QuestionTypeSelector.propTypes = {
  onSelectType: PropTypes.func.isRequired,
  displayMode: PropTypes.oneOf(['card', 'button'])
};

export default QuestionTypeSelector; 