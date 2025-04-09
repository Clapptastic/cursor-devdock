import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

// Comprehensive list of industries
const INDUSTRIES = [
  { value: 'saas', label: 'SaaS (Software as a Service)' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'healthcare', label: 'Healthcare & Medical' },
  { value: 'fintech', label: 'Financial Technology' },
  { value: 'edtech', label: 'Education Technology' },
  { value: 'biotech', label: 'Biotechnology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'travel', label: 'Travel & Hospitality' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'foodbeverage', label: 'Food & Beverage' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'logistics', label: 'Logistics & Transportation' },
  { value: 'consulting', label: 'Consulting & Professional Services' },
  { value: 'agriculture', label: 'Agriculture & Farming' },
  { value: 'construction', label: 'Construction' },
  { value: 'gaming', label: 'Gaming & eSports' },
  { value: 'healthfitness', label: 'Health & Fitness' },
  { value: 'nonprofit', label: 'Non-profit & Social Impact' },
  { value: 'other', label: 'Other' }
];

const IndustrySelector = ({ value, onChange }) => {
  return (
    <Form.Group className="mb-4">
      <Form.Label>Industry</Form.Label>
      <Form.Select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an industry</option>
        {INDUSTRIES.map((industry) => (
          <option key={industry.value} value={industry.value}>
            {industry.label}
          </option>
        ))}
      </Form.Select>
      <Form.Text className="text-muted">
        This helps us tailor questions relevant to your specific industry.
      </Form.Text>
    </Form.Group>
  );
};

IndustrySelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default IndustrySelector; 