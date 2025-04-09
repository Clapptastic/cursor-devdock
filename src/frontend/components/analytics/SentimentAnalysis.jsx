import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { Doughnut, Bar } from 'react-chartjs-2';
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
import { supabase } from '../../utils/supabaseClient';

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

const SentimentAnalysis = ({ survey, responses }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  useEffect(() => {
    const fetchSentimentAnalysis = async () => {
      try {
        setLoading(true);
        
        // Filter for text/textarea questions only
        const textQuestions = (survey.questions || []).filter(
          q => q.type === 'text' || q.type === 'textarea'
        );
        
        if (textQuestions.length === 0) {
          setLoading(false);
          return;
        }
        
        // Set the first text question as default selected question
        if (selectedQuestion === null && textQuestions.length > 0) {
          const firstTextQuestionIndex = survey.questions.findIndex(
            q => q.type === 'text' || q.type === 'textarea'
          );
          setSelectedQuestion(firstTextQuestionIndex);
        }
        
        // Extract text responses
        const textResponses = {};
        textQuestions.forEach((question, qIndex) => {
          const questionIndex = survey.questions.indexOf(question);
          const answers = responses
            .map(response => {
              const answers = response.answers || [];
              return answers[questionIndex] || null;
            })
            .filter(answer => answer !== null && answer !== '')
            .map(answer => typeof answer === 'object' ? answer.value : answer);
          
          textResponses[questionIndex] = answers;
        });
        
        // Check if we already have sentiment analysis for this survey
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from('survey_sentiment_analysis')
          .select('*')
          .eq('survey_id', survey.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        if (existingAnalysis) {
          setSentimentData(existingAnalysis.analysis);
        } else {
          // Generate sentiment analysis
          const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-sentiment', {
            body: { 
              surveyId: survey.id,
              textResponses
            }
          });
          
          if (analysisError) throw analysisError;
          
          setSentimentData(analysisResult.analysis);
        }
      } catch (err) {
        console.error('Error fetching sentiment analysis:', err);
        setError('Failed to load sentiment analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (survey && responses && responses.length > 0) {
      fetchSentimentAnalysis();
    } else {
      setLoading(false);
    }
  }, [survey, responses, selectedQuestion]);
  
  const getTextQuestions = () => {
    return (survey.questions || []).filter(
      q => q.type === 'text' || q.type === 'textarea'
    );
  };
  
  const renderSentimentOverview = () => {
    if (!sentimentData || !sentimentData.overall) {
      return (
        <Alert variant="info">
          No sentiment data available. This could be because there aren't enough text responses to analyze.
        </Alert>
      );
    }
    
    const overall = sentimentData.overall;
    const chartData = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [
            overall.positive_percentage || 0, 
            overall.neutral_percentage || 0, 
            overall.negative_percentage || 0
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(201, 203, 207, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(201, 203, 207, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1,
        },
      ],
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
              const value = context.formattedValue || '';
              return `${label}: ${value}%`;
            }
          }
        }
      },
    };
    
    return (
      <Row>
        <Col md={6}>
          <div className="text-center mb-4">
            <h5 className="mb-3">Overall Sentiment Distribution</h5>
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-4">
            <h5 className="mb-3">Summary</h5>
            <p>{overall.summary || 'No summary available.'}</p>
            
            <div className="mt-4">
              <h6>Common Themes:</h6>
              {overall.themes && overall.themes.length > 0 ? (
                <ListGroup variant="flush">
                  {overall.themes.map((theme, index) => (
                    <ListGroup.Item key={index} className="px-0">
                      <div className="d-flex align-items-start">
                        <Badge 
                          bg={theme.sentiment === 'positive' ? 'success' : 
                             theme.sentiment === 'negative' ? 'danger' : 'secondary'}
                          className="me-2 mt-1"
                        >
                          {theme.sentiment}
                        </Badge>
                        <div>
                          <div className="fw-medium">{theme.theme}</div>
                          <small className="text-muted">{theme.frequency} mentions</small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No common themes identified.</p>
              )}
            </div>
          </div>
        </Col>
      </Row>
    );
  };
  
  const renderQuestionSentiment = () => {
    if (selectedQuestion === null) {
      return (
        <Alert variant="info">
          Please select a text question to view sentiment analysis.
        </Alert>
      );
    }
    
    if (!sentimentData || !sentimentData.questions || !sentimentData.questions[selectedQuestion]) {
      return (
        <Alert variant="info">
          No sentiment data available for this question.
        </Alert>
      );
    }
    
    const questionSentiment = sentimentData.questions[selectedQuestion];
    
    const positiveExamples = questionSentiment.examples?.positive || [];
    const negativeExamples = questionSentiment.examples?.negative || [];
    const neutralExamples = questionSentiment.examples?.neutral || [];
    
    // Prepare data for keywords chart
    const keywords = questionSentiment.keywords || [];
    const keywordLabels = keywords.map(k => k.keyword);
    const keywordCounts = keywords.map(k => k.count);
    
    const keywordChartData = {
      labels: keywordLabels,
      datasets: [
        {
          label: 'Frequency',
          data: keywordCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    const keywordChartOptions = {
      responsive: true,
      plugins: {
        legend: {
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
    
    return (
      <div>
        <div className="mb-4">
          <h5>Question: {survey.questions[selectedQuestion].text}</h5>
          <p>{questionSentiment.summary || 'No summary available for this question.'}</p>
        </div>
        
        <Row className="mb-4">
          <Col md={6}>
            <h5 className="mb-3">Key Terms</h5>
            {keywords.length > 0 ? (
              <Bar data={keywordChartData} options={keywordChartOptions} height={200} />
            ) : (
              <p className="text-muted">No key terms identified for this question.</p>
            )}
          </Col>
          <Col md={6}>
            <h5 className="mb-3">Sentiment Examples</h5>
            <div className="sentiment-examples">
              {positiveExamples.length > 0 && (
                <>
                  <h6><Badge bg="success">Positive</Badge></h6>
                  <ListGroup className="mb-3">
                    {positiveExamples.slice(0, 3).map((example, index) => (
                      <ListGroup.Item key={`pos-${index}`} className="py-2">
                        "{example}"
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
              
              {negativeExamples.length > 0 && (
                <>
                  <h6><Badge bg="danger">Negative</Badge></h6>
                  <ListGroup className="mb-3">
                    {negativeExamples.slice(0, 3).map((example, index) => (
                      <ListGroup.Item key={`neg-${index}`} className="py-2">
                        "{example}"
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
              
              {neutralExamples.length > 0 && (
                <>
                  <h6><Badge bg="secondary">Neutral</Badge></h6>
                  <ListGroup className="mb-3">
                    {neutralExamples.slice(0, 2).map((example, index) => (
                      <ListGroup.Item key={`neut-${index}`} className="py-2">
                        "{example}"
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
              
              {positiveExamples.length === 0 && negativeExamples.length === 0 && neutralExamples.length === 0 && (
                <p className="text-muted">No examples available.</p>
              )}
            </div>
          </Col>
        </Row>
      </div>
    );
  };
  
  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Analyzing sentiment in survey responses...</p>
        </Card.Body>
      </Card>
    );
  }
  
  const textQuestions = getTextQuestions();
  
  if (textQuestions.length === 0) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-5">
          <Alert variant="info">
            Sentiment analysis is only available for surveys with text-based questions.
            This survey doesn't contain any text questions.
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Overall Sentiment Analysis</h5>
        </Card.Header>
        <Card.Body>
          {renderSentimentOverview()}
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Question-Specific Sentiment</h5>
            <Form.Select 
              size="sm" 
              value={selectedQuestion || ''}
              onChange={(e) => setSelectedQuestion(parseInt(e.target.value))}
              style={{ width: 'auto' }}
            >
              <option value="" disabled>Select a question</option>
              {survey.questions.map((question, index) => {
                if (question.type === 'text' || question.type === 'textarea') {
                  return (
                    <option key={index} value={index}>
                      {question.text.length > 60 ? `${question.text.substring(0, 60)}...` : question.text}
                    </option>
                  );
                }
                return null;
              }).filter(Boolean)}
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          {renderQuestionSentiment()}
        </Card.Body>
      </Card>
    </>
  );
};

SentimentAnalysis.propTypes = {
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
    answers: PropTypes.array
  })).isRequired
};

export default SentimentAnalysis; 