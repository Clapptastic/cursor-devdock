import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faDownload, faSync, faChartPie, faChartBar, faChartLine, faInfoCircle, faStar, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../utils/supabaseClient';

// Visualization components
import ResponseCountChart from '../components/analytics/ResponseCountChart';
import QuestionBreakdown from '../components/analytics/QuestionBreakdown';
import SentimentAnalysis from '../components/analytics/SentimentAnalysis';
import RespondentDemographics from '../components/analytics/RespondentDemographics';
import KeyInsights from '../components/analytics/KeyInsights';
import TrendAnalysis from '../components/analytics/TrendAnalysis';

const AnalyticsDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [insightsError, setInsightsError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const fetchSurveyAndResponses = async () => {
      try {
        setLoading(true);
        
        // Fetch survey details
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*, owner:owner_id(*)')
          .eq('id', id)
          .single();
        
        if (surveyError) throw surveyError;
        
        setSurvey(surveyData);
        
        // Fetch responses
        const { data: responseData, error: responseError } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('survey_id', id)
          .order('created_at', { ascending: false });
        
        if (responseError) throw responseError;
        
        setResponses(responseData);
        
        // Fetch AI insights if available
        const { data: insightData, error: insightError } = await supabase
          .from('survey_insights')
          .select('*')
          .eq('survey_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!insightError && insightData) {
          setInsights(insightData);
        }
        
      } catch (err) {
        console.error('Error fetching survey data:', err);
        setError('Failed to load survey analytics data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSurveyAndResponses();
  }, [id]);
  
  const handleGenerateInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      
      const { data: insightResult, error: insightError } = await supabase.functions.invoke('generate-insights', {
        body: { 
          surveyId: id,
          dateRange
        }
      });
      
      if (insightError) throw insightError;
      
      // Fetch the newly generated insights
      const { data: insightData, error: fetchError } = await supabase
        .from('survey_insights')
        .select('*')
        .eq('id', insightResult.insightId)
        .single();
      
      if (fetchError) throw fetchError;
      
      setInsights(insightData);
      
    } catch (err) {
      console.error('Error generating insights:', err);
      setInsightsError('Failed to generate insights. Please try again.');
    } finally {
      setInsightsLoading(false);
    }
  };
  
  const handleExportData = async (format) => {
    try {
      const { data, error } = await supabase.functions.invoke('export-survey-data', {
        body: { 
          surveyId: id,
          format: format || 'csv',
          includeInsights: !!insights
        }
      });
      
      if (error) throw error;
      
      // Create download link
      const blob = new Blob([data.content], { type: data.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading analytics data...</p>
      </Container>
    );
  }
  
  if (error || !survey) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || "Survey not found or you don't have permission to access it."}
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate('/dashboard')}
          className="mt-3"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  // Check if there are any responses
  if (responses.length === 0) {
    return (
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/dashboard')}
              className="mb-3"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Dashboard
            </Button>
            <h1 className="mb-1">{survey.title}</h1>
            <p className="text-muted">Analytics Dashboard</p>
          </div>
        </div>
        
        <Alert variant="info" className="text-center py-5">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" size="2x" />
          <h4 className="mt-3">No Responses Yet</h4>
          <p className="mb-3">
            This survey hasn't received any responses yet. Share your survey to start collecting data.
          </p>
          <Button
            variant="primary"
            as={Link}
            to={`/surveys/${id}/share`}
            className="mt-2"
          >
            Share Survey
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/dashboard')}
            className="mb-3"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Dashboard
          </Button>
          <h1 className="mb-1">{survey.title}</h1>
          <p className="text-muted">Analytics Dashboard</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-end">
          <Button 
            variant="outline-primary"
            className="me-2"
            onClick={() => navigate(`/surveys/${id}/report`)}
          >
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            Generate Report
          </Button>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => handleExportData('csv')}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Export CSV
          </Button>
          
          <Button 
            variant="outline-primary"
            onClick={() => handleExportData('json')}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Export JSON
          </Button>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Survey Overview</h4>
                <div>
                  <Badge bg="success" className="me-2">
                    {responses.length} Responses
                  </Badge>
                  <Badge bg={survey.status === 'published' ? 'primary' : 'secondary'}>
                    {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="summary-stat mb-3">
                    <h2 className="mb-0">{responses.length}</h2>
                    <p className="text-muted mb-0">Total Responses</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="summary-stat mb-3">
                    <h2 className="mb-0">
                      {responses.filter(r => r.completion_rate >= 100).length}
                    </h2>
                    <p className="text-muted mb-0">Complete Responses</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="summary-stat mb-3">
                    <h2 className="mb-0">
                      {Math.round(responses.reduce((sum, r) => sum + r.completion_rate, 0) / responses.length)}%
                    </h2>
                    <p className="text-muted mb-0">Avg. Completion Rate</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="summary-stat mb-3">
                    <h2 className="mb-0">
                      {Math.round(responses.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / responses.length)} sec
                    </h2>
                    <p className="text-muted mb-0">Avg. Completion Time</p>
                  </div>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              <h5 className="mb-3">Response Trend</h5>
              <ResponseCountChart responses={responses} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={12}>
          <Tabs
            activeKey={activeTab}
            onSelect={k => setActiveTab(k)}
            className="mb-4 nav-tabs-lg"
          >
            <Tab eventKey="overview" title={<span><FontAwesomeIcon icon={faChartPie} className="me-2" />Response Overview</span>}>
              <QuestionBreakdown survey={survey} responses={responses} />
            </Tab>
            
            <Tab eventKey="sentiment" title={<span><FontAwesomeIcon icon={faChartBar} className="me-2" />Sentiment Analysis</span>}>
              <SentimentAnalysis survey={survey} responses={responses} />
            </Tab>
            
            <Tab eventKey="demographics" title={<span><FontAwesomeIcon icon={faChartLine} className="me-2" />Demographics</span>}>
              <RespondentDemographics survey={survey} responses={responses} />
            </Tab>
            
            <Tab eventKey="trends" title={<span><FontAwesomeIcon icon={faChartLine} className="me-2" />Trends</span>}>
              <TrendAnalysis survey={survey} responses={responses} />
            </Tab>
            
            <Tab eventKey="insights" title={<span><FontAwesomeIcon icon={faStar} className="me-2" />AI Insights</span>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">AI-Generated Insights</h4>
                    <div>
                      {insights && (
                        <small className="text-muted me-3">
                          Generated on {new Date(insights.created_at).toLocaleDateString()}
                        </small>
                      )}
                      <Form.Select 
                        size="sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        style={{ width: 'auto', display: 'inline-block' }}
                        className="me-2"
                      >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                      </Form.Select>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerateInsights}
                        disabled={insightsLoading}
                      >
                        {insightsLoading ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSync} className="me-2" />
                            Generate Insights
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  {insightsError && (
                    <Alert variant="danger" dismissible onClose={() => setInsightsError(null)}>
                      {insightsError}
                    </Alert>
                  )}
                  
                  {insightsLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Analyzing responses and generating insights...</p>
                    </div>
                  ) : insights ? (
                    <KeyInsights insights={insights} />
                  ) : (
                    <div className="text-center py-5">
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2" size="2x" />
                      <h5 className="mt-3">No Insights Available</h5>
                      <p className="text-muted">
                        Generate insights to get AI-powered analysis of your survey responses.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleGenerateInsights}
                        className="mt-2"
                      >
                        <FontAwesomeIcon icon={faSync} className="me-2" />
                        Generate Insights
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default AnalyticsDashboard; 