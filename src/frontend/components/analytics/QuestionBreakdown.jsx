import React, { useState } from 'react';
import { Card, Row, Col, Form, Accordion, Badge, ListGroup, ProgressBar } from 'react-bootstrap';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
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

const QuestionBreakdown = ({ survey, responses }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [chartType, setChartType] = useState('bar');
  
  if (!survey || !survey.questions || !responses || responses.length === 0) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <p className="text-muted">No data available to display.</p>
        </Card.Body>
      </Card>
    );
  }
  
  const questions = survey.questions || [];
  
  const getQuestionResponses = (questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return [];
    
    return responses.map(response => {
      const answers = response.answers || [];
      return answers[questionIndex] || null;
    }).filter(answer => answer !== null);
  };
  
  const getChartData = (questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return { labels: [], datasets: [] };
    
    const answers = getQuestionResponses(questionIndex);
    
    switch (question.type) {
      case 'multiple_choice':
      case 'checkbox':
        const options = question.options || [];
        const counts = options.map(option => {
          if (question.type === 'multiple_choice') {
            return answers.filter(a => a === option.value || a.value === option.value).length;
          } else {
            // For checkbox, count selections for each option
            return answers.filter(a => 
              Array.isArray(a) ? a.includes(option.value) : 
              (Array.isArray(a.value) ? a.value.includes(option.value) : false)
            ).length;
          }
        });
        
        return {
          labels: options.map(o => o.label || o.value),
          datasets: [
            {
              label: 'Responses',
              data: counts,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)'
              ],
              borderWidth: 1,
            },
          ],
        };
        
      case 'rating':
        const ratings = {};
        answers.forEach(a => {
          const rating = typeof a === 'object' ? a.value : a;
          ratings[rating] = (ratings[rating] || 0) + 1;
        });
        
        const ratingLabels = [];
        const ratingCounts = [];
        
        // Create a range of possible ratings
        const maxRating = question.max || 5;
        for (let i = 1; i <= maxRating; i++) {
          ratingLabels.push(i.toString());
          ratingCounts.push(ratings[i] || 0);
        }
        
        return {
          labels: ratingLabels,
          datasets: [
            {
              label: 'Responses',
              data: ratingCounts,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        };
        
      case 'scale':
        const scaleValues = {};
        answers.forEach(a => {
          const value = typeof a === 'object' ? a.value : a;
          scaleValues[value] = (scaleValues[value] || 0) + 1;
        });
        
        const scaleLabels = [];
        const scaleCounts = [];
        
        // Create a range from min to max with step
        const min = question.min || 1;
        const max = question.max || 10;
        const step = question.step || 1;
        
        for (let i = min; i <= max; i += step) {
          scaleLabels.push(i.toString());
          scaleCounts.push(scaleValues[i] || 0);
        }
        
        return {
          labels: scaleLabels,
          datasets: [
            {
              label: 'Responses',
              data: scaleCounts,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        };
        
      default:
        return { labels: [], datasets: [] };
    }
  };
  
  const renderChart = (questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return null;
    
    const chartData = getChartData(questionIndex);
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false,
        },
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
    
    // Show appropriate chart based on question type and selected chart type
    switch (question.type) {
      case 'multiple_choice':
      case 'checkbox':
      case 'rating':
      case 'scale':
        if (chartType === 'pie') {
          return <Pie data={chartData} options={chartOptions} />;
        } else if (chartType === 'doughnut') {
          return <Doughnut data={chartData} options={chartOptions} />;
        } else {
          return <Bar data={chartData} options={chartOptions} />;
        }
        
      case 'text':
      case 'textarea':
        return renderTextResponses(questionIndex);
        
      default:
        return <p className="text-muted text-center">No visualization available for this question type.</p>;
    }
  };
  
  const renderTextResponses = (questionIndex) => {
    const answers = getQuestionResponses(questionIndex);
    
    if (answers.length === 0) {
      return <p className="text-muted text-center">No responses for this question.</p>;
    }
    
    return (
      <div className="text-response-list mt-3">
        <ListGroup>
          {answers.map((answer, index) => (
            <ListGroup.Item key={index} className="text-response-item">
              {typeof answer === 'object' ? answer.value : answer}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    );
  };
  
  const renderResponseSummary = (questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return null;
    
    const answers = getQuestionResponses(questionIndex);
    const totalResponses = answers.length;
    const responseRate = Math.round((totalResponses / responses.length) * 100);
    
    let avgRating = null;
    if (question.type === 'rating' || question.type === 'scale') {
      const sum = answers.reduce((acc, curr) => {
        const value = typeof curr === 'object' ? curr.value : curr;
        return acc + parseFloat(value);
      }, 0);
      avgRating = (sum / totalResponses).toFixed(1);
    }
    
    return (
      <Row className="text-center mb-4">
        <Col md={4}>
          <div className="summary-stat">
            <h3 className="mb-0">{totalResponses}</h3>
            <p className="text-muted mb-0">Responses</p>
          </div>
        </Col>
        <Col md={4}>
          <div className="summary-stat">
            <h3 className="mb-0">{responseRate}%</h3>
            <p className="text-muted mb-0">Response Rate</p>
          </div>
        </Col>
        {avgRating && (
          <Col md={4}>
            <div className="summary-stat">
              <h3 className="mb-0">{avgRating}</h3>
              <p className="text-muted mb-0">Average Rating</p>
            </div>
          </Col>
        )}
      </Row>
    );
  };

  return (
    <Row>
      <Col lg={4}>
        <Card className="shadow-sm mb-4 h-100">
          <Card.Header className="bg-white">
            <h5 className="mb-0">Questions</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <ListGroup variant="flush">
              {questions.map((question, index) => (
                <ListGroup.Item 
                  key={index}
                  action 
                  active={selectedQuestion === index}
                  onClick={() => setSelectedQuestion(index)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-medium">{question.text}</div>
                    <small className="text-muted d-block">
                      {getQuestionResponses(index).length} responses
                    </small>
                  </div>
                  <Badge bg="secondary" pill>
                    {question.type.replace('_', ' ')}
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={8}>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{questions[selectedQuestion]?.text || 'Question Analysis'}</h5>
              {['multiple_choice', 'checkbox', 'rating', 'scale'].includes(questions[selectedQuestion]?.type) && (
                <Form.Select 
                  size="sm" 
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="doughnut">Doughnut Chart</option>
                </Form.Select>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            {renderResponseSummary(selectedQuestion)}
            {renderChart(selectedQuestion)}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

QuestionBreakdown.propTypes = {
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

export default QuestionBreakdown; 