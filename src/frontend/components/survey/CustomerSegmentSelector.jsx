import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Badge, Button, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

// Common customer segments with descriptions
const COMMON_SEGMENTS = [
  {
    value: 'b2c_consumer',
    label: 'B2C - General Consumer',
    description: 'Individual customers using products/services for personal use'
  },
  {
    value: 'b2b_enterprise',
    label: 'B2B - Enterprise',
    description: 'Large businesses with 1000+ employees'
  },
  {
    value: 'b2b_midmarket',
    label: 'B2B - Mid-market',
    description: 'Medium-sized businesses with 100-999 employees'
  },
  {
    value: 'b2b_smb',
    label: 'B2B - Small Business',
    description: 'Small businesses with fewer than 100 employees'
  },
  {
    value: 'b2b_startup',
    label: 'B2B - Startups',
    description: 'Early-stage companies seeking growth'
  },
  {
    value: 'b2g',
    label: 'B2G - Government',
    description: 'Government agencies and public sector organizations'
  },
  {
    value: 'education',
    label: 'Education',
    description: 'Schools, universities, and educational institutions'
  },
  {
    value: 'nonprofit',
    label: 'Non-profit',
    description: 'Organizations with social or environmental missions'
  }
];

const CustomerSegmentSelector = ({ selected, onChange }) => {
  const [customSegment, setCustomSegment] = useState('');

  const handleToggleSegment = (segment) => {
    if (selected.includes(segment)) {
      onChange(selected.filter(s => s !== segment));
    } else {
      onChange([...selected, segment]);
    }
  };

  const handleAddCustomSegment = () => {
    if (customSegment.trim() && !selected.includes(customSegment.trim())) {
      onChange([...selected, customSegment.trim()]);
      setCustomSegment('');
    }
  };

  const handleRemoveSegment = (segment) => {
    onChange(selected.filter(s => s !== segment));
  };

  const isCommonSegment = (segment) => {
    return COMMON_SEGMENTS.some(s => s.value === segment);
  };

  return (
    <Form.Group className="mb-4">
      <Form.Label>Customer Segments</Form.Label>
      
      <p className="text-muted small mb-3">
        Select the types of customers you want to target with your survey.
      </p>
      
      <div className="segment-options mb-4">
        {COMMON_SEGMENTS.map((segment) => (
          <div key={segment.value} className="segment-option">
            <Form.Check
              type="checkbox"
              id={`segment-${segment.value}`}
              label={segment.label}
              checked={selected.includes(segment.value)}
              onChange={() => handleToggleSegment(segment.value)}
            />
            <p className="text-muted small ms-4">{segment.description}</p>
          </div>
        ))}
      </div>
      
      <Form.Label>Add Custom Segment</Form.Label>
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          value={customSegment}
          onChange={(e) => setCustomSegment(e.target.value)}
          placeholder="e.g., Digital Nomads, Parents of Teenagers"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomSegment();
            }
          }}
        />
        <Button 
          variant="outline-secondary" 
          onClick={handleAddCustomSegment}
          disabled={!customSegment.trim()}
        >
          <FontAwesomeIcon icon={faPlus} /> Add
        </Button>
      </InputGroup>
      
      {selected.length > 0 && (
        <div className="selected-segments mt-3">
          <Form.Label>Selected Segments:</Form.Label>
          <div>
            {selected.map((segment) => (
              <Badge 
                key={segment} 
                bg="primary" 
                className="me-2 mb-2 segment-badge"
              >
                {isCommonSegment(segment) 
                  ? COMMON_SEGMENTS.find(s => s.value === segment)?.label 
                  : segment
                }
                <Button
                  variant="link"
                  size="sm"
                  className="badge-remove"
                  onClick={() => handleRemoveSegment(segment)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .segment-options {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          padding: 1rem;
        }
        
        .segment-option {
          margin-bottom: 1rem;
        }
        
        .segment-option:last-child {
          margin-bottom: 0;
        }
        
        .segment-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
        }
        
        .badge-remove {
          color: white;
          padding: 0;
          margin-left: 0.5rem;
          opacity: 0.7;
        }
        
        .badge-remove:hover {
          opacity: 1;
          color: white;
        }
      `}</style>
    </Form.Group>
  );
};

CustomerSegmentSelector.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired
};

export default CustomerSegmentSelector; 