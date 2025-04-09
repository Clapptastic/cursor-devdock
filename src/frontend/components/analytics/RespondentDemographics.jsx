import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const RespondentDemographics = ({ survey, responses }) => {
  const [loading, setLoading] = useState(true);
  const [demographicData, setDemographicData] = useState({
    age: null,
    gender: null,
    location: null,
    occupation: null,
    education: null,
    income: null
  });
  
  useEffect(() => {
    if (!survey || !responses || responses.length === 0) {
      setLoading(false);
      return;
    }
    
    // Process demographic data from responses
    const processDemographics = () => {
      const demographics = {
        age: {},
        gender: {},
        location: {},
        occupation: {},
        education: {},
        income: {}
      };
      
      // Check if the survey collects demographic information
      const demographicQuestionIndices = {};
      
      survey.questions.forEach((question, index) => {
        const lowerText = question.text.toLowerCase();
        
        // Look for demographic questions based on text
        if (lowerText.includes('age') && !demographicQuestionIndices.age) {
          demographicQuestionIndices.age = index;
        } else if (lowerText.includes('gender') && !demographicQuestionIndices.gender) {
          demographicQuestionIndices.gender = index;
        } else if ((lowerText.includes('country') || lowerText.includes('location')) && !demographicQuestionIndices.location) {
          demographicQuestionIndices.location = index;
        } else if ((lowerText.includes('occupation') || lowerText.includes('job') || lowerText.includes('profession')) && !demographicQuestionIndices.occupation) {
          demographicQuestionIndices.occupation = index;
        } else if (lowerText.includes('education') && !demographicQuestionIndices.education) {
          demographicQuestionIndices.education = index;
        } else if ((lowerText.includes('income') || lowerText.includes('salary')) && !demographicQuestionIndices.income) {
          demographicQuestionIndices.income = index;
        }
      });
      
      // Extract demographic data from responses
      responses.forEach(response => {
        const answers = response.answers || [];
        
        Object.keys(demographicQuestionIndices).forEach(demoType => {
          const index = demographicQuestionIndices[demoType];
          if (index !== undefined && answers[index]) {
            const answer = typeof answers[index] === 'object' ? answers[index].value : answers[index];
            
            if (answer) {
              demographics[demoType][answer] = (demographics[demoType][answer] || 0) + 1;
            }
          }
        });
        
        // Also check for demographics in respondent_info if available
        if (response.respondent_info) {
          Object.keys(response.respondent_info).forEach(key => {
            const lowerKey = key.toLowerCase();
            const value = response.respondent_info[key];
            
            if (!value) return;
            
            if (lowerKey.includes('age') && value) {
              demographics.age[value] = (demographics.age[value] || 0) + 1;
            } else if (lowerKey.includes('gender') && value) {
              demographics.gender[value] = (demographics.gender[value] || 0) + 1;
            } else if ((lowerKey.includes('country') || lowerKey.includes('location')) && value) {
              demographics.location[value] = (demographics.location[value] || 0) + 1;
            } else if ((lowerKey.includes('occupation') || lowerKey.includes('job')) && value) {
              demographics.occupation[value] = (demographics.occupation[value] || 0) + 1;
            } else if (lowerKey.includes('education') && value) {
              demographics.education[value] = (demographics.education[value] || 0) + 1;
            } else if (lowerKey.includes('income') && value) {
              demographics.income[value] = (demographics.income[value] || 0) + 1;
            }
          });
        }
      });
      
      // Process and clean up the demographic data
      const processedData = {};
      
      Object.keys(demographics).forEach(demoType => {
        const data = demographics[demoType];
        const entries = Object.entries(data);
        
        if (entries.length === 0) {
          processedData[demoType] = null;
          return;
        }
        
        // If too many unique values, group some together
        if (demoType === 'age' && entries.length > 8) {
          const ageGroups = {
            'Under 18': 0,
            '18-24': 0,
            '25-34': 0,
            '35-44': 0,
            '45-54': 0,
            '55-64': 0,
            '65+': 0
          };
          
          entries.forEach(([age, count]) => {
            const numAge = parseInt(age);
            
            if (isNaN(numAge)) {
              return; // Skip non-numeric ages
            }
            
            if (numAge < 18) {
              ageGroups['Under 18'] += count;
            } else if (numAge < 25) {
              ageGroups['18-24'] += count;
            } else if (numAge < 35) {
              ageGroups['25-34'] += count;
            } else if (numAge < 45) {
              ageGroups['35-44'] += count;
            } else if (numAge < 55) {
              ageGroups['45-54'] += count;
            } else if (numAge < 65) {
              ageGroups['55-64'] += count;
            } else {
              ageGroups['65+'] += count;
            }
          });
          
          processedData[demoType] = Object.entries(ageGroups)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => {
              const ageOrder = [
                'Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
              ];
              return ageOrder.indexOf(a[0]) - ageOrder.indexOf(b[0]);
            });
        } else if (entries.length > 10) {
          // For other demographics with too many entries, take top N entries and group the rest
          const sortedEntries = [...entries].sort((a, b) => b[1] - a[1]);
          const topEntries = sortedEntries.slice(0, 9);
          const otherCount = sortedEntries.slice(9).reduce((sum, [_, count]) => sum + count, 0);
          
          if (otherCount > 0) {
            topEntries.push(['Other', otherCount]);
          }
          
          processedData[demoType] = topEntries;
        } else {
          processedData[demoType] = entries.sort((a, b) => b[1] - a[1]);
        }
      });
      
      setDemographicData(processedData);
      setLoading(false);
    };
    
    processDemographics();
  }, [survey, responses]);
  
  const generateChartData = (demoData, backgroundColors) => {
    if (!demoData || demoData.length === 0) return null;
    
    return {
      labels: demoData.map(([label]) => label),
      datasets: [
        {
          data: demoData.map(([_, count]) => count),
          backgroundColor: backgroundColors || [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: backgroundColors ? backgroundColors.map(color => color.replace('0.6', '1')) : [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };
  
  const renderDemographicChart = (title, demoType, chartType = 'doughnut') => {
    const demoData = demographicData[demoType];
    
    if (!demoData || demoData.length === 0) {
      return (
        <Card className="shadow-sm mb-4 h-100">
          <Card.Header className="bg-white">
            <h5 className="mb-0">{title}</h5>
          </Card.Header>
          <Card.Body className="text-center py-4">
            <p className="text-muted">No data available</p>
          </Card.Body>
        </Card>
      );
    }
    
    let chartColors;
    if (demoType === 'gender') {
      chartColors = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)'
      ];
    }
    
    const chartData = generateChartData(demoData, chartColors);
    
    return (
      <Card className="shadow-sm mb-4 h-100">
        <Card.Header className="bg-white">
          <h5 className="mb-0">{title}</h5>
        </Card.Header>
        <Card.Body>
          {chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
          {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
        </Card.Body>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Processing demographic data...</p>
        </Card.Body>
      </Card>
    );
  }
  
  // Check if we have any demographic data
  const hasDemographicData = Object.values(demographicData).some(data => data && data.length > 0);
  
  if (!hasDemographicData) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Alert variant="info">
            No demographic data could be found in this survey. To collect demographics, include 
            questions about age, gender, location, occupation, etc., or collect respondent 
            information.
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <>
      <Row>
        <Col md={6} lg={4}>
          {renderDemographicChart('Age Distribution', 'age', 'bar')}
        </Col>
        <Col md={6} lg={4}>
          {renderDemographicChart('Gender Distribution', 'gender', 'pie')}
        </Col>
        <Col md={6} lg={4}>
          {renderDemographicChart('Location', 'location', 'doughnut')}
        </Col>
      </Row>
      
      <Row>
        <Col md={6} lg={4}>
          {renderDemographicChart('Occupation', 'occupation', 'bar')}
        </Col>
        <Col md={6} lg={4}>
          {renderDemographicChart('Education Level', 'education', 'doughnut')}
        </Col>
        <Col md={6} lg={4}>
          {renderDemographicChart('Income Range', 'income', 'bar')}
        </Col>
      </Row>
    </>
  );
};

RespondentDemographics.propTypes = {
  survey: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    questions: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string,
      type: PropTypes.string
    }))
  }).isRequired,
  responses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    answers: PropTypes.array,
    respondent_info: PropTypes.object
  })).isRequired
};

export default RespondentDemographics; 