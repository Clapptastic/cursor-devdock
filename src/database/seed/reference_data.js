/**
 * Reference data for the Customer Survey application
 * 
 * This file contains initial data for the reference tables in the database:
 * - Industries
 * - Business Stages
 * - Customer Segments
 * - Question Types
 */

// Industry types for survey targeting
const industries = [
  {
    name: 'SaaS',
    description: 'Software as a Service - Cloud-based software delivery model'
  },
  {
    name: 'E-commerce',
    description: 'Online retail and marketplaces'
  },
  {
    name: 'Fintech',
    description: 'Financial technology services and products'
  },
  {
    name: 'Healthcare',
    description: 'Medical services, healthcare technology, and wellness'
  },
  {
    name: 'Education',
    description: 'Educational technology, services, and institutions'
  },
  {
    name: 'Manufacturing',
    description: 'Production of physical goods and products'
  },
  {
    name: 'Real Estate',
    description: 'Property management, sales, and related services'
  },
  {
    name: 'Food & Beverage',
    description: 'Restaurants, food production, and delivery services'
  },
  {
    name: 'Entertainment',
    description: 'Media, gaming, and recreational services'
  },
  {
    name: 'Travel & Hospitality',
    description: 'Tourism, accommodations, and travel services'
  }
];

// Business stages for contextualizing survey questions
const businessStages = [
  {
    name: 'Ideation',
    description: 'Early concept development and validation phase'
  },
  {
    name: 'MVP Testing',
    description: 'Minimum viable product testing with early adopters'
  },
  {
    name: 'Product-Market Fit',
    description: 'Validating product-market fit and refining offerings'
  },
  {
    name: 'Early Growth',
    description: 'Initial scaling and customer acquisition focus'
  },
  {
    name: 'Scaling',
    description: 'Rapid expansion and scaling operations'
  },
  {
    name: 'Established',
    description: 'Mature business with established market presence'
  }
];

// Customer segments for targeting specific audiences
const customerSegments = [
  {
    name: 'B2B',
    description: 'Business-to-business customers'
  },
  {
    name: 'B2C',
    description: 'Business-to-consumer customers'
  },
  {
    name: 'Enterprise',
    description: 'Large enterprise organizations'
  },
  {
    name: 'SMBs',
    description: 'Small and medium-sized businesses'
  },
  {
    name: 'Startups',
    description: 'Early-stage startup companies'
  },
  {
    name: 'Government',
    description: 'Government agencies and public sector'
  },
  {
    name: 'Non-profit',
    description: 'Non-profit organizations and NGOs'
  },
  {
    name: 'Educational',
    description: 'Educational institutions and learners'
  }
];

// Question types with their respective configuration schemas
const questionTypes = [
  {
    name: 'Multiple Choice',
    description: 'Select one option from multiple choices',
    settings_schema: {
      allowOther: { type: 'boolean', default: false },
      randomizeOptions: { type: 'boolean', default: false },
      displayStyle: { type: 'string', enum: ['radio', 'dropdown'], default: 'radio' }
    }
  },
  {
    name: 'Checkbox',
    description: 'Select multiple options from choices',
    settings_schema: {
      allowOther: { type: 'boolean', default: false },
      randomizeOptions: { type: 'boolean', default: false },
      minSelections: { type: 'number', default: 0 },
      maxSelections: { type: 'number', default: null }
    }
  },
  {
    name: 'Rating Scale',
    description: 'Rate on a numeric scale',
    settings_schema: {
      minValue: { type: 'number', default: 1 },
      maxValue: { type: 'number', default: 5 },
      stepSize: { type: 'number', default: 1 },
      showLabels: { type: 'boolean', default: true },
      minLabel: { type: 'string', default: '' },
      maxLabel: { type: 'string', default: '' }
    }
  },
  {
    name: 'Likert Scale',
    description: 'Rate agreement on a standard scale',
    settings_schema: {
      options: { 
        type: 'array', 
        default: [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree'
        ]
      },
      showValues: { type: 'boolean', default: false }
    }
  },
  {
    name: 'Open-Ended',
    description: 'Free text response',
    settings_schema: {
      multiline: { type: 'boolean', default: false },
      minLength: { type: 'number', default: 0 },
      maxLength: { type: 'number', default: null },
      placeholder: { type: 'string', default: '' }
    }
  },
  {
    name: 'Dropdown',
    description: 'Select from a dropdown list',
    settings_schema: {
      allowOther: { type: 'boolean', default: false },
      placeholder: { type: 'string', default: 'Select an option' }
    }
  },
  {
    name: 'Matrix',
    description: 'Grid of questions with the same response options',
    settings_schema: {
      rows: { type: 'array', default: [] },
      columns: { type: 'array', default: [] },
      columnType: { type: 'string', enum: ['radio', 'checkbox'], default: 'radio' }
    }
  },
  {
    name: 'Net Promoter Score',
    description: 'Scale from 0-10 measuring customer loyalty',
    settings_schema: {
      showLabels: { type: 'boolean', default: true },
      detractorLabel: { type: 'string', default: 'Not likely at all' },
      promoterLabel: { type: 'string', default: 'Extremely likely' }
    }
  },
  {
    name: 'Date',
    description: 'Date selection',
    settings_schema: {
      format: { type: 'string', default: 'MM/DD/YYYY' },
      minDate: { type: 'string', default: null },
      maxDate: { type: 'string', default: null }
    }
  },
  {
    name: 'Ranking',
    description: 'Rank items in order of preference',
    settings_schema: {
      items: { type: 'array', default: [] },
      allowTies: { type: 'boolean', default: false }
    }
  }
];

module.exports = {
  industries,
  businessStages,
  customerSegments,
  questionTypes
}; 