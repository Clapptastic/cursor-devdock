import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Button, ListGroup } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TrendAnalysis = ({ survey, responses }) => {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [trendData, setTrendData] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState(false);
  
  useEffect(() => {
    if (!survey || !survey.questions || !responses || responses.length === 0) return;
    
    // Default to selecting the first 3 numeric questions
    if (selectedQuestions.length === 0) {
      const numericQuestions = survey.questions
        .map((q, i) => ({ index: i, type: q.type }))
        .filter(q => ['rating', 'scale', 'multiple_choice', 'checkbox'].includes(q.type))
        .map(q => q.index)
        .slice(0, 3);
      
      setSelectedQuestions(numericQuestions);
    }
    
    // Process trend data
    generateTrendData();
  }, [survey, responses, selectedQuestions, timeframe]);
  
  const generateTrendData = () => {
    // Get date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        // Find earliest response date
        startDate = new Date(Math.min(...responses.map(r => new Date(r.created_at).getTime())));
        break;
      case '30d':
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    // Create date buckets based on the timeframe
    const dateFormat = { month: 'short', day: 'numeric' };
    let buckets = [];
    let labels = [];
    
    // Calculate the appropriate interval based on timeframe
    let interval = 1; // default to daily
    if (timeframe === 'all') {
      const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 180) {
        interval = 30; // monthly
      } else if (daysDiff > 60) {
        interval = 7; // weekly
      } else if (daysDiff > 30) {
        interval = 3; // every 3 days
      }
    } else if (timeframe === '90d') {
      interval = 7; // weekly for 90 days
    }
    
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateString = currentDate.toLocaleDateString('en-US', dateFormat);
      labels.push(dateString);
      buckets.push({
        date: new Date(currentDate),
        dateString,
        responseCounts: {},
        averages: {}
      });
      
      // Advance to next interval
      currentDate.setDate(currentDate.getDate() + interval);
    }
    
    // Add the latest date if it's not already included
    if (buckets.length > 0 && buckets[buckets.length - 1].date < now) {
      const dateString = now.toLocaleDateString('en-US', dateFormat);
      labels.push(dateString);
      buckets.push({
        date: new Date(now),
        dateString,
        responseCounts: {},
        averages: {}
      });
    }
    
    // Process selected questions
    const newTrendData = {};
    
    selectedQuestions.forEach(questionIndex => {
      const question = survey.questions[questionIndex];
      if (!question) return;
      
      // Initialize question data
      newTrendData[questionIndex] = {
        question,
        labels,
        data: []
      };
      
      // Create a deep copy of buckets for this question
      const questionBuckets = JSON.parse(JSON.stringify(buckets));
      
      // For each response, extract answer for this question and add to appropriate bucket
      responses.forEach(response => {
        const responseDate = new Date(response.created_at);
        if (responseDate < startDate) return;
        
        const answers = response.answers || [];
        const answer = answers[questionIndex];
        if (answer === undefined || answer === null) return;
        
        // Find the appropriate bucket
        const bucketIndex = questionBuckets.findIndex((bucket, i) => {
          return responseDate >= bucket.date && 
                (i === questionBuckets.length - 1 || responseDate < questionBuckets[i + 1].date);
        });
        
        if (bucketIndex === -1) return;
        
        const bucket = questionBuckets[bucketIndex];
        
        // Process answer based on question type
        switch (question.type) {
          case 'rating':
          case 'scale':
            // For ratings, calculate average
            const numValue = typeof answer === 'object' ? Number(answer.value) : Number(answer);
            if (isNaN(numValue)) return;
            
            if (!bucket.responseCounts[questionIndex]) {
              bucket.responseCounts[questionIndex] = 0;
              bucket.averages[questionIndex] = 0;
            }
            
            bucket.responseCounts[questionIndex]++;
            bucket.averages[questionIndex] += numValue;
            break;
            
          case 'multiple_choice':
            // For multiple choice, count occurrences of each option
            const mcValue = typeof answer === 'object' ? answer.value : answer;
            
            if (!bucket.responseCounts[questionIndex]) {
              bucket.responseCounts[questionIndex] = {};
              question.options.forEach(option => {
                bucket.responseCounts[questionIndex][option.value] = 0;
              });
            }
            
            if (bucket.responseCounts[questionIndex][mcValue] !== undefined) {
              bucket.responseCounts[questionIndex][mcValue]++;
            }
            break;
            
          case 'checkbox':
            // For checkboxes, count occurrences of each option
            const cbValues = Array.isArray(answer) ? answer : 
                         (typeof answer === 'object' && Array.isArray(answer.value)) ? answer.value : 
                         [answer];
            
            if (!bucket.responseCounts[questionIndex]) {
              bucket.responseCounts[questionIndex] = {};
              question.options.forEach(option => {
                bucket.responseCounts[questionIndex][option.value] = 0;
              });
            }
            
            cbValues.forEach(val => {
              if (bucket.responseCounts[questionIndex][val] !== undefined) {
                bucket.responseCounts[questionIndex][val]++;
              }
            });
            break;
            
          default:
            break;
        }
      });
      
      // Process buckets to generate chart data
      switch (question.type) {
        case 'rating':
        case 'scale':
          // Calculate average for each bucket
          const averageData = questionBuckets.map(bucket => {
            if (!bucket.responseCounts[questionIndex] || bucket.responseCounts[questionIndex] === 0) {
              return null; // No data for this bucket
            }
            return bucket.averages[questionIndex] / bucket.responseCounts[questionIndex];
          });
          
          newTrendData[questionIndex].data.push({
            label: 'Average Rating',
            data: averageData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
          });
          break;
          
        case 'multiple_choice':
          // Generate a line for each option
          const mcOptions = question.options || [];
          
          mcOptions.forEach((option, optionIndex) => {
            const optionData = questionBuckets.map(bucket => {
              if (!bucket.responseCounts[questionIndex]) return 0;
              return bucket.responseCounts[questionIndex][option.value] || 0;
            });
            
            // Use a color palette
            const colors = [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ];
            
            const colorIndex = optionIndex % colors.length;
            
            newTrendData[questionIndex].data.push({
              label: option.label || option.value,
              data: optionData,
              borderColor: colors[colorIndex],
              backgroundColor: colors[colorIndex].replace('1)', '0.2)'),
              tension: 0.4
            });
          });
          break;
          
        case 'checkbox':
          // Generate a line for each option
          const cbOptions = question.options || [];
          
          cbOptions.forEach((option, optionIndex) => {
            const optionData = questionBuckets.map(bucket => {
              if (!bucket.responseCounts[questionIndex]) return 0;
              return bucket.responseCounts[questionIndex][option.value] || 0;
            });
            
            // Use a color palette
            const colors = [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ];
            
            const colorIndex = optionIndex % colors.length;
            
            newTrendData[questionIndex].data.push({
              label: option.label || option.value,
              data: optionData,
              borderColor: colors[colorIndex],
              backgroundColor: colors[colorIndex].replace('1)', '0.2)'),
              tension: 0.4
            });
          });
          break;
          
        default:
          break;
      }
    });
    
    setTrendData(newTrendData);
  };
  
  const handleToggleQuestion = (questionIndex) => {
    if (selectedQuestions.includes(questionIndex)) {
      // Remove question
      setSelectedQuestions(prev => prev.filter(index => index !== questionIndex));
    } else {
      // Add question
      setSelectedQuestions(prev => [...prev, questionIndex]);
    }
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 1
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  // Check if we have any trend data
  const hasValidQuestions = survey && survey.questions && survey.questions.some(
    q => ['rating', 'scale', 'multiple_choice', 'checkbox'].includes(q.type)
  );
  
  if (!hasValidQuestions) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Alert variant="info">
            Trend analysis is only available for surveys with rating, scale, or multiple choice questions.
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  if (responses.length < 5) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Alert variant="info">
            Trend analysis requires at least 5 responses to generate meaningful trends.
            You currently have {responses.length} response{responses.length !== 1 ? 's' : ''}.
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Response Trends Over Time</h5>
            <Form.Select 
              size="sm" 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ width: 'auto' }}
              aria-label="Select timeframe"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col xs={12}>
              <div className="mb-3">
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none"
                  onClick={() => setExpandedQuestions(!expandedQuestions)}
                  aria-expanded={expandedQuestions}
                >
                  <FontAwesomeIcon icon={expandedQuestions ? faChevronUp : faChevronDown} className="me-2" />
                  {expandedQuestions ? 'Hide Questions' : 'Select Questions to Compare'}
                </Button>
              </div>
              
              {expandedQuestions && (
                <div className="question-selector mb-4">
                  <p className="text-muted small mb-2">
                    Select up to 5 questions to compare trends over time
                  </p>
                  <ListGroup>
                    {survey.questions.map((question, index) => {
                      // Only show questions that can have trend data
                      if (!['rating', 'scale', 'multiple_choice', 'checkbox'].includes(question.type)) {
                        return null;
                      }
                      
                      return (
                        <ListGroup.Item 
                          key={index}
                          action
                          active={selectedQuestions.includes(index)}
                          onClick={() => handleToggleQuestion(index)}
                          disabled={selectedQuestions.length >= 5 && !selectedQuestions.includes(index)}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-medium">{question.text}</div>
                            <small className="text-muted d-block">
                              {question.type.replace('_', ' ')}
                            </small>
                          </div>
                          <Form.Check 
                            type="checkbox"
                            checked={selectedQuestions.includes(index)}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </div>
              )}
            </Col>
          </Row>
          
          {selectedQuestions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Select at least one question to view trends</p>
            </div>
          ) : (
            <Row>
              {selectedQuestions.map(questionIndex => {
                const questionData = trendData[questionIndex];
                if (!questionData) return null;
                
                const chartData = {
                  labels: questionData.labels,
                  datasets: questionData.data
                };
                
                return (
                  <Col md={6} key={questionIndex} className="mb-4">
                    <Card className="h-100">
                      <Card.Header className="bg-white">
                        <h6 className="mb-0">{questionData.question.text}</h6>
                      </Card.Header>
                      <Card.Body>
                        <div style={{ height: '250px' }}>
                          <Line data={chartData} options={chartOptions} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

TrendAnalysis.propTypes = {
  survey: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    questions: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string,
      type: PropTypes.string,
      options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string
      }))
    }))
  }).isRequired,
  responses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    created_at: PropTypes.string,
    answers: PropTypes.array
  })).isRequired
};

export default TrendAnalysis; 