import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Card, 
  Button, 
  Accordion, 
  ListGroup, 
  Badge, 
  Spinner, 
  Alert 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBrain, 
  faLightbulb, 
  faChartBar, 
  faExclamationTriangle,
  faInfoCircle,
  faSync,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const RecommendationItem = ({ title, content, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'insight':
        return faLightbulb;
      case 'warning':
        return faExclamationTriangle;
      case 'tip':
        return faInfoCircle;
      case 'stat':
        return faChartBar;
      default:
        return faLightbulb;
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'insight':
        return 'primary';
      case 'warning':
        return 'warning';
      case 'tip':
        return 'info';
      case 'stat':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <ListGroup.Item className="recommendation-item">
      <div className="d-flex align-items-start">
        <div className={`recommendation-icon text-${getBadgeVariant()} me-3`}>
          <FontAwesomeIcon icon={getIcon()} />
        </div>
        <div className="recommendation-content flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>{title}</strong>
            <Badge bg={getBadgeVariant()} className="text-capitalize">{type}</Badge>
          </div>
          <div className="recommendation-text">
            {content}
          </div>
        </div>
      </div>
    </ListGroup.Item>
  );
};

RecommendationItem.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  type: PropTypes.oneOf(['insight', 'warning', 'tip', 'stat']).isRequired
};

const AIRecommendations = ({ survey, responses }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await axios.post('/api/ai/analyze-survey', {
        surveyId: survey.id,
        includeResponses: !!responses
      });
      
      setRecommendations(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setError(err.response?.data?.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <Card className="ai-recommendations-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <FontAwesomeIcon icon={faBrain} className="me-2 text-primary" />
          <span className="fw-bold">AI Recommendations</span>
        </div>
        
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={fetchRecommendations}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={isLoading ? faSync : (recommendations ? faSync : faBrain)} 
                          className={`me-1 ${isLoading ? 'fa-spin' : ''}`} />
          {recommendations ? 'Refresh Analysis' : 'Generate Analysis'}
        </Button>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {isLoading && (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">
              Analyzing your survey{responses ? ' and responses' : ''}...
            </p>
          </div>
        )}
        
        {!isLoading && !recommendations && !error && (
          <div className="text-center p-4">
            <FontAwesomeIcon icon={faBrain} size="3x" className="text-muted mb-3" />
            <h5>No Analysis Yet</h5>
            <p className="text-muted">
              Click "Generate Analysis" to get AI-powered insights about your survey
              {responses ? ' and response data' : ''}.
            </p>
          </div>
        )}
        
        {recommendations && (
          <>
            {lastUpdated && (
              <div className="text-end mb-3">
                <small className="text-muted">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-1 text-success" />
                  Last updated: {formatTimestamp(lastUpdated)}
                </small>
              </div>
            )}
            
            <div className="survey-summary mb-4">
              <h5>Survey Summary</h5>
              <p>{recommendations.summary}</p>
            </div>
            
            <Accordion defaultActiveKey="0" className="mb-4">
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <FontAwesomeIcon icon={faLightbulb} className="me-2 text-primary" />
                  Survey Design Insights
                </Accordion.Header>
                <Accordion.Body>
                  <ListGroup variant="flush">
                    {recommendations.designInsights?.map((insight, index) => (
                      <RecommendationItem
                        key={index}
                        title={insight.title}
                        content={insight.content}
                        type={insight.type || 'insight'}
                      />
                    ))}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
              
              {responses && recommendations.responseInsights && (
                <Accordion.Item eventKey="1">
                  <Accordion.Header>
                    <FontAwesomeIcon icon={faChartBar} className="me-2 text-success" />
                    Response Insights
                  </Accordion.Header>
                  <Accordion.Body>
                    <ListGroup variant="flush">
                      {recommendations.responseInsights?.map((insight, index) => (
                        <RecommendationItem
                          key={index}
                          title={insight.title}
                          content={insight.content}
                          type={insight.type || 'stat'}
                        />
                      ))}
                    </ListGroup>
                  </Accordion.Body>
                </Accordion.Item>
              )}
              
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-info" />
                  Improvement Suggestions
                </Accordion.Header>
                <Accordion.Body>
                  <ListGroup variant="flush">
                    {recommendations.improvementSuggestions?.map((suggestion, index) => (
                      <RecommendationItem
                        key={index}
                        title={suggestion.title}
                        content={suggestion.content}
                        type={suggestion.type || 'tip'}
                      />
                    ))}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
            
            {recommendations.nextSteps && (
              <div className="next-steps">
                <h5>Recommended Next Steps</h5>
                <ListGroup>
                  {recommendations.nextSteps.map((step, index) => (
                    <ListGroup.Item key={index} className="d-flex align-items-center">
                      <Badge bg="primary" className="me-2">{index + 1}</Badge>
                      {step}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </>
        )}
      </Card.Body>
      
      <style jsx>{`
        .ai-recommendations-card {
          border-top: 4px solid var(--bs-primary);
        }
        
        .recommendation-item {
          border-left: 3px solid transparent;
          transition: border-color 0.2s;
        }
        
        .recommendation-item:hover {
          border-left-color: var(--bs-primary);
          background-color: rgba(0, 123, 255, 0.03);
        }
        
        .recommendation-icon {
          font-size: 1.2rem;
          margin-top: 0.1rem;
        }
        
        .recommendation-text {
          font-size: 0.95rem;
        }
      `}</style>
    </Card>
  );
};

AIRecommendations.propTypes = {
  survey: PropTypes.object.isRequired,
  responses: PropTypes.array
};

export default AIRecommendations; 