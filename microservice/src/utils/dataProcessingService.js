/**
 * Data Processing Service
 * Contains the core business logic for processing survey data
 */
const { v4: uuidv4 } = require('uuid');

/**
 * Calculate basic statistics for numeric values in an array
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Statistical measures
 */
const calculateStats = (values) => {
  // Filter out non-numeric values
  const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
  
  if (numericValues.length === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      variance: 0,
      stdDev: 0
    };
  }
  
  // Sort values for calculations
  const sortedValues = [...numericValues].sort((a, b) => a - b);
  
  // Calculate basic statistics
  const count = numericValues.length;
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;
  
  // Calculate median
  const middle = Math.floor(count / 2);
  const median = count % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
  
  // Min and max
  const min = sortedValues[0];
  const max = sortedValues[count - 1];
  
  // Calculate variance and standard deviation
  const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  
  return {
    count,
    sum,
    mean,
    median,
    min,
    max,
    variance,
    stdDev
  };
};

/**
 * Count frequency of each unique value in an array
 * @param {Array} values - Array of values
 * @returns {Object} Value frequencies
 */
const countFrequencies = (values) => {
  const frequencies = {};
  
  values.forEach(val => {
    // Convert to string to handle different types
    const strVal = String(val);
    frequencies[strVal] = (frequencies[strVal] || 0) + 1;
  });
  
  return frequencies;
};

/**
 * Calculate correlation between two numeric arrays
 * @param {Array<number>} xValues - First array of values
 * @param {Array<number>} yValues - Second array of values
 * @returns {number} Correlation coefficient (-1 to 1)
 */
const calculateCorrelation = (xValues, yValues) => {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return 0;
  }
  
  // Filter to ensure both values are numeric
  const pairs = xValues.map((x, i) => [x, yValues[i]])
    .filter(([x, y]) => 
      typeof x === 'number' && !isNaN(x) && 
      typeof y === 'number' && !isNaN(y)
    );
  
  if (pairs.length < 2) return 0;
  
  const xVals = pairs.map(p => p[0]);
  const yVals = pairs.map(p => p[1]);
  
  // Calculate means
  const xMean = xVals.reduce((sum, val) => sum + val, 0) / xVals.length;
  const yMean = yVals.reduce((sum, val) => sum + val, 0) / yVals.length;
  
  // Calculate correlation
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;
  
  for (let i = 0; i < xVals.length; i++) {
    const xDiff = xVals[i] - xMean;
    const yDiff = yVals[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }
  
  if (xDenominator === 0 || yDenominator === 0) return 0;
  
  return numerator / (Math.sqrt(xDenominator) * Math.sqrt(yDenominator));
};

/**
 * Normalize an array of values to be between 0 and 1
 * @param {Array<number>} values - Array of values to normalize
 * @returns {Array<number>} Normalized values
 */
const normalizeValues = (values) => {
  const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
  
  if (numericValues.length <= 1) return numericValues.map(() => 0);
  
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  
  if (max === min) return numericValues.map(() => 0.5);
  
  return numericValues.map(val => (val - min) / (max - min));
};

/**
 * Process survey response data based on processing type
 * @param {Array} data - Array of survey responses
 * @param {Object} options - Processing options
 * @returns {Object} Processed data and analysis
 */
const processData = (data, options = {}) => {
  const {
    processingType = 'basic',
    calculateScores = true,
    includeMeta = false,
    normalize = false,
    compareWithPrevious = false,
    tags = []
  } = options;
  
  // Initialize result structure
  const result = {
    id: uuidv4(),
    original: data,
    processed: [],
    meta: {
      processingType,
      timestamp: new Date().toISOString(),
      options
    }
  };
  
  // Process each item in the data array
  result.processed = data.map(item => {
    const processedItem = { ...item, processed: true };
    
    if (calculateScores) {
      // Add a random score for demonstration (replace with actual scoring logic)
      processedItem.score = Math.round(Math.random() * 100);
    }
    
    return processedItem;
  });
  
  // Add additional analysis based on processing type
  if (processingType === 'advanced' || processingType === 'premium') {
    const analysis = {
      summary: {},
      fields: {}
    };
    
    // Find numeric and categorical fields
    const fieldsMap = new Map();
    
    data.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (!fieldsMap.has(key)) {
          fieldsMap.set(key, []);
        }
        fieldsMap.get(key).push(value);
      });
    });
    
    // Analyze each field
    fieldsMap.forEach((values, fieldName) => {
      const fieldAnalysis = {};
      
      // Check if field is primarily numeric
      const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
      const isNumericField = numericValues.length > values.length / 2;
      
      if (isNumericField) {
        fieldAnalysis.type = 'numeric';
        fieldAnalysis.stats = calculateStats(values);
        
        if (normalize) {
          fieldAnalysis.normalized = normalizeValues(values);
        }
      } else {
        fieldAnalysis.type = 'categorical';
        fieldAnalysis.frequencies = countFrequencies(values);
        fieldAnalysis.uniqueValues = Object.keys(fieldAnalysis.frequencies).length;
        fieldAnalysis.mostCommon = Object.entries(fieldAnalysis.frequencies)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));
      }
      
      analysis.fields[fieldName] = fieldAnalysis;
    });
    
    // Calculate correlations for premium processing
    if (processingType === 'premium') {
      analysis.correlations = {};
      
      // Find numeric fields for correlation calculation
      const numericFields = [];
      fieldsMap.forEach((values, fieldName) => {
        const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
        if (numericValues.length > values.length / 2) {
          numericFields.push(fieldName);
        }
      });
      
      // Calculate correlations between numeric fields
      for (let i = 0; i < numericFields.length; i++) {
        for (let j = i + 1; j < numericFields.length; j++) {
          const field1 = numericFields[i];
          const field2 = numericFields[j];
          const values1 = fieldsMap.get(field1);
          const values2 = fieldsMap.get(field2);
          
          const correlation = calculateCorrelation(values1, values2);
          if (!analysis.correlations[field1]) {
            analysis.correlations[field1] = {};
          }
          analysis.correlations[field1][field2] = correlation;
        }
      }
      
      // Find significant correlations
      analysis.significantCorrelations = [];
      Object.entries(analysis.correlations).forEach(([field1, correlations]) => {
        Object.entries(correlations).forEach(([field2, value]) => {
          if (Math.abs(value) > 0.5) {
            analysis.significantCorrelations.push({
              field1,
              field2,
              correlation: value,
              strength: Math.abs(value) > 0.8 ? 'strong' : 'moderate'
            });
          }
        });
      });
    }
    
    // Add analysis to result
    result.analysis = analysis;
    
    // Add summary statistics
    result.analysis.summary = {
      totalItems: data.length,
      fieldsAnalyzed: Object.keys(analysis.fields).length,
      dateRange: {
        start: new Date(Math.min(...data.filter(item => item.timestamp)
          .map(item => new Date(item.timestamp).getTime()))).toISOString(),
        end: new Date(Math.max(...data.filter(item => item.timestamp)
          .map(item => new Date(item.timestamp).getTime()))).toISOString()
      }
    };
  }
  
  // Only include metadata if requested
  if (!includeMeta) {
    delete result.meta;
  }
  
  // Include original data tags if any
  if (tags.length > 0) {
    result.tags = tags;
  }
  
  return result;
};

module.exports = {
  processData,
  calculateStats,
  countFrequencies,
  calculateCorrelation,
  normalizeValues
}; 