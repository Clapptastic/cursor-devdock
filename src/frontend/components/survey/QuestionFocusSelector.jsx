import React, { useState } from 'react';
import { Form, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

/**
 * Component for selecting focus areas for survey questions
 * Allows users to select predefined focus areas or add custom ones
 */
const QuestionFocusSelector = ({ selected, onChange }) => {
  const [customFocus, setCustomFocus] = useState('');
  
  // Predefined focus areas relevant to customer discovery
  const predefinedFocusAreas = [
    { id: 'pain_points', name: 'Pain Points', description: 'Problems and challenges faced by customers' },
    { id: 'needs', name: 'Needs & Desires', description: 'What customers want or need' },
    { id: 'behavior', name: 'Behavior', description: 'How customers currently behave or use solutions' },
    { id: 'demographics', name: 'Demographics', description: 'Customer background and characteristics' },
    { id: 'preferences', name: 'Preferences', description: 'What customers like or dislike' },
    { id: 'decision_making', name: 'Decision Making', description: 'How customers make purchase decisions' },
    { id: 'product_feedback', name: 'Product Feedback', description: 'Opinions about your product or service' },
    { id: 'competitors', name: 'Competitors', description: 'Experience with alternative solutions' },
    { id: 'price_sensitivity', name: 'Price Sensitivity', description: 'Willingness to pay and price expectations' },
    { id: 'feature_prioritization', name: 'Feature Prioritization', description: 'Which features matter most' }
  ];

  const handleToggleFocus = (focusId) => {
    let updatedFocus;
    
    if (selected.includes(focusId)) {
      // Remove if already selected
      updatedFocus = selected.filter(id => id !== focusId);
    } else {
      // Add if not already selected
      updatedFocus = [...selected, focusId];
    }
    
    onChange(updatedFocus);
  };

  const handleAddCustomFocus = () => {
    if (customFocus.trim() === '') return;
    
    const customFocusId = `custom_${customFocus.toLowerCase().replace(/\s+/g, '_')}`;
    
    if (!selected.includes(customFocusId)) {
      const updatedFocus = [...selected, customFocusId];
      onChange(updatedFocus);
    }
    
    setCustomFocus('');
  };

  const handleRemoveFocus = (focusId) => {
    const updatedFocus = selected.filter(id => id !== focusId);
    onChange(updatedFocus);
  };

  // Get name for a focus area ID (for custom ones that aren't in predefined list)
  const getFocusName = (focusId) => {
    if (focusId.startsWith('custom_')) {
      return focusId.replace('custom_', '').replace(/_/g, ' ');
    }
    
    const predefined = predefinedFocusAreas.find(area => area.id === focusId);
    return predefined ? predefined.name : focusId;
  };

  return (
    <div className="question-focus-selector">
      <Form.Group className="mb-4">
        <Form.Label>Select Focus Areas for Questions</Form.Label>
        <p className="text-muted small mb-3">
          Choose areas you want to focus on in your survey. This helps our AI generate more relevant questions.
        </p>
        
        <div className="focus-badges mb-3">
          {selected.length > 0 ? (
            selected.map(focusId => (
              <Badge 
                key={focusId} 
                bg="primary" 
                className="me-2 mb-2 py-2 px-3 focus-badge"
              >
                {getFocusName(focusId)}
                <Button
                  variant="link"
                  size="sm"
                  className="badge-remove p-0 ms-2 text-white"
                  onClick={() => handleRemoveFocus(focusId)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              </Badge>
            ))
          ) : (
            <p className="text-muted fst-italic small">No focus areas selected yet</p>
          )}
        </div>
        
        <div className="predefined-areas mb-4">
          <p className="fw-medium mb-2">Common Focus Areas:</p>
          <div className="d-flex flex-wrap gap-2">
            {predefinedFocusAreas.map(area => (
              <Button
                key={area.id}
                variant={selected.includes(area.id) ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => handleToggleFocus(area.id)}
                title={area.description}
                className="focus-area-button mb-1"
              >
                {area.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="custom-focus">
          <p className="fw-medium mb-2">Add Custom Focus Area:</p>
          <div className="d-flex">
            <Form.Control
              type="text"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="e.g., Brand Perception, User Experience..."
              className="me-2"
            />
            <Button 
              variant="outline-primary"
              onClick={handleAddCustomFocus}
              disabled={!customFocus.trim()}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add
            </Button>
          </div>
        </div>
      </Form.Group>
    </div>
  );
};

QuestionFocusSelector.propTypes = {
  /** Array of selected focus area IDs */
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Function called when selection changes */
  onChange: PropTypes.func.isRequired
};

export default QuestionFocusSelector; 