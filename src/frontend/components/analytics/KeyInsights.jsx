import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Accordion, ListGroup } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faStar, 
  faExclamationTriangle, 
  faTasks, 
  faComments, 
  faChartLine, 
  faUsers,
  faArrowRight,
  faChevronDown,
  faPlus,
  faMinus,
  faEllipsisH,
  faUserCheck,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';

const KeyInsights = ({ insights }) => {
  const [expandedSections, setExpandedSections] = useState({
    keyFindings: true,
    recommendations: true,
    correlations: false,
    verbatim: false,
    segments: false
  });
  
  if (!insights || !insights.data) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No insights available</p>
      </div>
    );
  }
  
  const { 
    summary, 
    key_findings, 
    recommendations, 
    correlations, 
    verbatim_quotes,
    audience_segments,
    confidence_score
  } = insights.data;
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const getConfidenceBadge = (score) => {
    if (score >= 85) {
      return <Badge bg="success">High Confidence</Badge>;
    } else if (score >= 70) {
      return <Badge bg="primary">Medium Confidence</Badge>;
    } else {
      return <Badge bg="warning" text="dark">Low Confidence</Badge>;
    }
  };
  
  const formatConfidenceScore = (score) => {
    return `${score}/100`;
  };
  
  const renderSummary = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faLightbulb} className="me-2 text-warning" />
              Executive Summary
            </h5>
            <div>
              {getConfidenceBadge(confidence_score)}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <p className="mb-0">{summary}</p>
        </Card.Body>
      </Card>
    );
  };
  
  const renderKeyFindings = () => {
    if (!key_findings || key_findings.length === 0) return null;
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Button 
            variant="link" 
            className="p-0 text-decoration-none w-100 text-start"
            onClick={() => toggleSection('keyFindings')}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faStar} className="me-2 text-primary" />
                Key Findings
              </h5>
              <FontAwesomeIcon icon={expandedSections.keyFindings ? faMinus : faPlus} />
            </div>
          </Button>
        </Card.Header>
        {expandedSections.keyFindings && (
          <Card.Body>
            <ListGroup variant="flush">
              {key_findings.map((finding, index) => (
                <ListGroup.Item key={index} className="px-0 py-3 border-bottom">
                  <div className="d-flex">
                    <div className="insight-number me-3">
                      <span className="badge bg-primary rounded-circle">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h6 className="mb-1">{finding.title}</h6>
                      <p className="mb-0 text-muted">{finding.description}</p>
                      {finding.metrics && (
                        <div className="mt-2 d-flex gap-3">
                          {finding.metrics.map((metric, midx) => (
                            <div key={midx} className="metric-badge">
                              <Badge bg="light" text="dark" className="p-2">
                                <span className="fw-bold">{metric.value}</span>
                                <span className="ms-1 text-muted small">{metric.label}</span>
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        )}
      </Card>
    );
  };
  
  const renderRecommendations = () => {
    if (!recommendations || recommendations.length === 0) return null;
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Button 
            variant="link" 
            className="p-0 text-decoration-none w-100 text-start"
            onClick={() => toggleSection('recommendations')}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faTasks} className="me-2 text-success" />
                Recommendations
              </h5>
              <FontAwesomeIcon icon={expandedSections.recommendations ? faMinus : faPlus} />
            </div>
          </Button>
        </Card.Header>
        {expandedSections.recommendations && (
          <Card.Body>
            <Row xs={1} md={2}>
              {recommendations.map((recommendation, index) => (
                <Col key={index} className="mb-3">
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body>
                      <div className="d-flex align-items-start">
                        <div 
                          className={`me-3 p-2 rounded-circle text-white d-flex align-items-center justify-content-center`}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: recommendation.priority === 'high' ? '#dc3545' : 
                                            recommendation.priority === 'medium' ? '#fd7e14' : '#6c757d' 
                          }}
                        >
                          <small className="fw-bold">{index + 1}</small>
                        </div>
                        <div>
                          <h6>{recommendation.title}</h6>
                          <p className="mb-0 text-muted small">{recommendation.description}</p>
                          {recommendation.priority && (
                            <Badge 
                              bg={recommendation.priority === 'high' ? 'danger' : 
                                 recommendation.priority === 'medium' ? 'warning' : 'secondary'}
                              className="mt-2"
                            >
                              {recommendation.priority.toUpperCase()} PRIORITY
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        )}
      </Card>
    );
  };
  
  const renderCorrelations = () => {
    if (!correlations || correlations.length === 0) return null;
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Button 
            variant="link" 
            className="p-0 text-decoration-none w-100 text-start"
            onClick={() => toggleSection('correlations')}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faChartLine} className="me-2 text-info" />
                Correlations & Patterns
              </h5>
              <FontAwesomeIcon icon={expandedSections.correlations ? faMinus : faPlus} />
            </div>
          </Button>
        </Card.Header>
        {expandedSections.correlations && (
          <Card.Body>
            <Accordion defaultActiveKey="0">
              {correlations.map((correlation, index) => (
                <Accordion.Item key={index} eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <span className="me-2">{correlation.title}</span>
                      <Badge 
                        bg={correlation.strength === 'strong' ? 'success' : 
                           correlation.strength === 'moderate' ? 'primary' : 'secondary'}
                        className="ms-2"
                      >
                        {correlation.strength}
                      </Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>{correlation.description}</p>
                    {correlation.data_points && (
                      <ul className="mb-0">
                        {correlation.data_points.map((point, pidx) => (
                          <li key={pidx}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Body>
        )}
      </Card>
    );
  };
  
  const renderVerbatimQuotes = () => {
    if (!verbatim_quotes || verbatim_quotes.length === 0) return null;
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Button 
            variant="link" 
            className="p-0 text-decoration-none w-100 text-start"
            onClick={() => toggleSection('verbatim')}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faComments} className="me-2 text-secondary" />
                Key Verbatim Quotes
              </h5>
              <FontAwesomeIcon icon={expandedSections.verbatim ? faMinus : faPlus} />
            </div>
          </Button>
        </Card.Header>
        {expandedSections.verbatim && (
          <Card.Body>
            <Row>
              {verbatim_quotes.map((quote, index) => (
                <Col md={6} key={index} className="mb-3">
                  <Card className="h-100 border">
                    <Card.Body>
                      <blockquote className="blockquote mb-0">
                        <p className="quote-text">"{quote.text}"</p>
                        <footer className="blockquote-footer mt-2">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              {quote.question && (
                                <small className="text-muted d-block">{quote.question}</small>
                              )}
                            </div>
                            {quote.sentiment && (
                              <Badge 
                                bg={quote.sentiment === 'positive' ? 'success' : 
                                  quote.sentiment === 'negative' ? 'danger' : 'secondary'}
                              >
                                {quote.sentiment}
                              </Badge>
                            )}
                          </div>
                        </footer>
                      </blockquote>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        )}
      </Card>
    );
  };
  
  const renderAudienceSegments = () => {
    if (!audience_segments || audience_segments.length === 0) return null;
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <Button 
            variant="link" 
            className="p-0 text-decoration-none w-100 text-start"
            onClick={() => toggleSection('segments')}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faUsers} className="me-2 text-purple" />
                Audience Segments
              </h5>
              <FontAwesomeIcon icon={expandedSections.segments ? faMinus : faPlus} />
            </div>
          </Button>
        </Card.Header>
        {expandedSections.segments && (
          <Card.Body>
            <Row xs={1} md={audience_segments.length > 1 ? 2 : 1}>
              {audience_segments.map((segment, index) => (
                <Col key={index} className="mb-3">
                  <Card className="border h-100">
                    <Card.Header className="bg-white">
                      <h6 className="mb-0">
                        <FontAwesomeIcon icon={faUserCheck} className="me-2" />
                        {segment.name}
                        {segment.percentage && (
                          <Badge bg="light" text="dark" className="ms-2">
                            {segment.percentage}% of respondents
                          </Badge>
                        )}
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <p>{segment.description}</p>
                      
                      {segment.characteristics && segment.characteristics.length > 0 && (
                        <div className="mt-3">
                          <h6 className="mb-2">Key Characteristics:</h6>
                          <ul className="mb-0">
                            {segment.characteristics.map((char, cidx) => (
                              <li key={cidx}>{char}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {segment.preferences && segment.preferences.length > 0 && (
                        <div className="mt-3">
                          <h6 className="mb-2">Preferences:</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {segment.preferences.map((pref, pidx) => (
                              <Badge bg="light" text="dark" key={pidx} className="p-2">
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        )}
      </Card>
    );
  };
  
  return (
    <div className="ai-insights">
      {renderSummary()}
      {renderKeyFindings()}
      {renderRecommendations()}
      {renderCorrelations()}
      {renderVerbatimQuotes()}
      {renderAudienceSegments()}
      
      <div className="text-center mt-4 pt-3 border-top">
        <p className="text-muted small">
          <FontAwesomeIcon icon={faChartPie} className="me-2" />
          Insights analyzed with AI based on {insights.response_count || '0'} responses.
          Confidence score: {formatConfidenceScore(confidence_score)}
          {insights.generated_at && (
            <span className="ms-2">
              Generated on {new Date(insights.generated_at).toLocaleDateString()}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

KeyInsights.propTypes = {
  insights: PropTypes.shape({
    id: PropTypes.string,
    survey_id: PropTypes.string,
    data: PropTypes.shape({
      summary: PropTypes.string,
      key_findings: PropTypes.array,
      recommendations: PropTypes.array,
      correlations: PropTypes.array,
      verbatim_quotes: PropTypes.array,
      audience_segments: PropTypes.array,
      confidence_score: PropTypes.number
    }),
    response_count: PropTypes.number,
    generated_at: PropTypes.string
  }).isRequired
};

export default KeyInsights; 