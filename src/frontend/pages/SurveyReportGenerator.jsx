import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faFileAlt, faFilePdf, faFileWord, faFilePowerpoint, 
  faFileExcel, faFileCode, faDownload, faPalette, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../utils/supabaseClient';
import aiService from '../utils/aiService';

const SurveyReportGenerator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [reportOptions, setReportOptions] = useState({
    format: 'pdf',
    title: '',
    includeRawData: false,
    sections: [
      'executive_summary',
      'methodology',
      'key_findings',
      'question_breakdown',
      'demographic_analysis',
      'recommendations'
    ],
    branding: {
      primaryColor: '#4361ee',
      secondaryColor: '#3f37c9',
      includeLogo: true
    }
  });
  
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  
  useEffect(() => {
    fetchSurveyAndResponses();
  }, [id]);
  
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
      setReportOptions(prev => ({
        ...prev,
        title: `${surveyData.title} - Survey Report`
      }));
      
      // Fetch responses
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', id)
        .order('created_at', { ascending: false });
      
      if (responseError) throw responseError;
      
      setResponses(responseData);
    } catch (err) {
      console.error('Error fetching survey data:', err);
      setError('Failed to load survey data.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setReportOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSectionToggle = (section) => {
    setReportOptions(prev => {
      const sections = [...prev.sections];
      
      if (sections.includes(section)) {
        // Remove section
        return {
          ...prev,
          sections: sections.filter(s => s !== section)
        };
      } else {
        // Add section
        return {
          ...prev,
          sections: [...sections, section]
        };
      }
    });
  };
  
  const handleColorChange = (colorType, value) => {
    setReportOptions(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [colorType]: value
      }
    }));
  };
  
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus('Initializing report generation...');
      
      // Mock progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
        
        updateGenerationStatus();
      }, 500);
      
      // Call the AI service to generate the report
      const reportResult = await aiService.generateReport(id, {
        format: reportOptions.format,
        title: reportOptions.title,
        sections: reportOptions.sections,
        includeRawData: reportOptions.includeRawData,
        branding: reportOptions.branding
      });
      
      // Clear the interval and set generation to complete
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStatus('Report generated successfully!');
      
      // Set the generated report
      setGeneratedReport(reportResult);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
      setGenerating(false);
    } finally {
      // Don't reset generating to false as we want to show the download button
    }
  };
  
  const updateGenerationStatus = () => {
    const progress = generationProgress;
    
    if (progress < 20) {
      setGenerationStatus('Analyzing survey data...');
    } else if (progress < 40) {
      setGenerationStatus('Aggregating response patterns...');
    } else if (progress < 60) {
      setGenerationStatus('Generating statistical insights...');
    } else if (progress < 80) {
      setGenerationStatus('Creating visualizations...');
    } else if (progress < 95) {
      setGenerationStatus('Compiling report contents...');
    } else if (progress < 100) {
      setGenerationStatus('Finalizing report format...');
    } else {
      setGenerationStatus('Report generation complete!');
    }
  };
  
  const handleDownload = () => {
    // In a real app, this would download the actual file
    if (generatedReport && generatedReport.downloadUrl) {
      window.open(generatedReport.downloadUrl, '_blank');
    }
  };
  
  const renderGenerationProgress = () => {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Generating Report</h4>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <div className="generation-icon mb-3">
              {reportOptions.format === 'pdf' && <FontAwesomeIcon icon={faFilePdf} size="3x" className="text-danger" />}
              {reportOptions.format === 'docx' && <FontAwesomeIcon icon={faFileWord} size="3x" className="text-primary" />}
              {reportOptions.format === 'pptx' && <FontAwesomeIcon icon={faFilePowerpoint} size="3x" className="text-warning" />}
              {reportOptions.format === 'xlsx' && <FontAwesomeIcon icon={faFileExcel} size="3x" className="text-success" />}
              {reportOptions.format === 'html' && <FontAwesomeIcon icon={faFileCode} size="3x" className="text-info" />}
            </div>
            <h5>{reportOptions.title}</h5>
            <p className="text-muted">{generationStatus}</p>
          </div>
          
          <ProgressBar 
            now={generationProgress} 
            variant="primary" 
            className="mb-3" 
            style={{ height: '10px' }}
          />
          
          <div className="mt-4">
            <h6>Report Sections:</h6>
            <Row className="mt-2">
              {reportOptions.sections.map((section, index) => (
                <Col md={6} key={index}>
                  <div className="d-flex align-items-center mb-2">
                    <div className="section-status me-2">
                      {generationProgress >= (index + 1) * (100 / reportOptions.sections.length) ? (
                        <FontAwesomeIcon icon={faCheck} className="text-success" />
                      ) : (
                        <Spinner animation="border" size="sm" variant="primary" />
                      )}
                    </div>
                    <div>
                      {section.replace('_', ' ').split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
          
          {generationProgress === 100 && (
            <div className="text-center mt-4">
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleDownload}
                className="download-report-btn"
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Download Report
              </Button>
              
              <p className="text-muted mt-3">
                Your report is ready! Click the button to download.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  const renderDownloadSection = () => {
    if (!generatedReport) return null;
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Download Your Report</h4>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <div className="download-icon mb-3">
            {reportOptions.format === 'pdf' && <FontAwesomeIcon icon={faFilePdf} size="4x" className="text-danger" />}
            {reportOptions.format === 'docx' && <FontAwesomeIcon icon={faFileWord} size="4x" className="text-primary" />}
            {reportOptions.format === 'pptx' && <FontAwesomeIcon icon={faFilePowerpoint} size="4x" className="text-warning" />}
            {reportOptions.format === 'xlsx' && <FontAwesomeIcon icon={faFileExcel} size="4x" className="text-success" />}
            {reportOptions.format === 'html' && <FontAwesomeIcon icon={faFileCode} size="4x" className="text-info" />}
          </div>
          
          <h5 className="mb-3">{reportOptions.title}</h5>
          
          <div className="report-meta text-muted mb-4">
            <div>Generated on: {new Date().toLocaleDateString()}</div>
            <div>Format: {reportOptions.format.toUpperCase()}</div>
            <div>Sections: {reportOptions.sections.length}</div>
          </div>
          
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleDownload}
            className="download-btn"
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Download Report
          </Button>
        </Card.Body>
      </Card>
    );
  };
  
  const renderReportForm = () => {
    const availableSections = [
      { id: 'executive_summary', name: 'Executive Summary', description: 'Overview of the survey purpose and key findings' },
      { id: 'methodology', name: 'Methodology', description: 'Details about how the survey was conducted' },
      { id: 'key_findings', name: 'Key Findings', description: 'Most important insights from the survey' },
      { id: 'question_breakdown', name: 'Question Breakdown', description: 'Analysis of responses for each question' },
      { id: 'demographic_analysis', name: 'Demographic Analysis', description: 'Insights based on respondent demographics' },
      { id: 'sentiment_analysis', name: 'Sentiment Analysis', description: 'Analysis of sentiment in free text responses' },
      { id: 'trend_analysis', name: 'Trend Analysis', description: 'Patterns and trends across responses over time' },
      { id: 'comparative_analysis', name: 'Comparative Analysis', description: 'Compare with previous surveys or benchmarks' },
      { id: 'recommendations', name: 'Recommendations', description: 'AI-generated recommendations based on insights' },
      { id: 'appendix', name: 'Appendix', description: 'Additional data and detailed breakdowns' }
    ];
    
    const formatOptions = [
      { id: 'pdf', name: 'PDF Document', icon: faFilePdf, color: 'danger' },
      { id: 'docx', name: 'Word Document', icon: faFileWord, color: 'primary' },
      { id: 'pptx', name: 'PowerPoint Presentation', icon: faFilePowerpoint, color: 'warning' },
      { id: 'xlsx', name: 'Excel Spreadsheet', icon: faFileExcel, color: 'success' },
      { id: 'html', name: 'HTML Web Report', icon: faFileCode, color: 'info' }
    ];
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h4 className="mb-0">Report Options</h4>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row className="mb-4">
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Report Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="title"
                    value={reportOptions.title}
                    onChange={handleInputChange}
                    placeholder="Enter report title"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Report Format</Form.Label>
                  <div className="d-flex flex-wrap format-options">
                    {formatOptions.map(format => (
                      <div 
                        key={format.id} 
                        className={`format-option me-3 mb-3 ${reportOptions.format === format.id ? 'selected' : ''}`}
                        onClick={() => setReportOptions(prev => ({ ...prev, format: format.id }))}
                      >
                        <div className={`format-icon text-${format.color} mb-2`}>
                          <FontAwesomeIcon icon={format.icon} size="2x" />
                        </div>
                        <div className="format-name">{format.name}</div>
                      </div>
                    ))}
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Additional Options</Form.Label>
                  <Form.Check 
                    type="checkbox"
                    name="includeRawData"
                    checked={reportOptions.includeRawData}
                    onChange={handleInputChange}
                    label="Include raw data"
                    className="mb-2"
                  />
                </Form.Group>
              </Col>
              
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Branding</Form.Label>
                  <Row className="mb-2">
                    <Col xs={6}>
                      <Form.Label className="small">Primary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={reportOptions.branding.primaryColor}
                        onChange={e => handleColorChange('primaryColor', e.target.value)}
                        className="w-100"
                      />
                    </Col>
                    <Col xs={6}>
                      <Form.Label className="small">Secondary Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={reportOptions.branding.secondaryColor}
                        onChange={e => handleColorChange('secondaryColor', e.target.value)}
                        className="w-100"
                      />
                    </Col>
                  </Row>
                  <Form.Check 
                    type="checkbox"
                    name="includeLogo"
                    checked={reportOptions.branding.includeLogo}
                    onChange={e => setReportOptions(prev => ({ 
                      ...prev, 
                      branding: { ...prev.branding, includeLogo: e.target.checked }
                    }))}
                    label="Include company logo"
                    className="mt-2"
                  />
                </Form.Group>
                
                <Form.Group>
                  <Form.Label>Report Sections</Form.Label>
                  <div className="report-sections">
                    <ListGroup className="section-list">
                      {availableSections.map(section => (
                        <ListGroup.Item
                          key={section.id}
                          action
                          active={reportOptions.sections.includes(section.id)}
                          onClick={() => handleSectionToggle(section.id)}
                          className="d-flex justify-content-between align-items-start"
                        >
                          <div>
                            <div className="fw-bold">{section.name}</div>
                            <small>{section.description}</small>
                          </div>
                          {reportOptions.sections.includes(section.id) && (
                            <Badge bg="primary" pill>
                              <FontAwesomeIcon icon={faCheck} />
                            </Badge>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="text-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleGenerateReport}
                disabled={generating || reportOptions.sections.length === 0}
              >
                <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                Generate Report
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    );
  };
  
  const renderReportPreview = () => {
    const getFormatIcon = () => {
      switch (reportOptions.format) {
        case 'pdf': return <FontAwesomeIcon icon={faFilePdf} className="text-danger me-2" />;
        case 'docx': return <FontAwesomeIcon icon={faFileWord} className="text-primary me-2" />;
        case 'pptx': return <FontAwesomeIcon icon={faFilePowerpoint} className="text-warning me-2" />;
        case 'xlsx': return <FontAwesomeIcon icon={faFileExcel} className="text-success me-2" />;
        case 'html': return <FontAwesomeIcon icon={faFileCode} className="text-info me-2" />;
        default: return <FontAwesomeIcon icon={faFileAlt} className="text-primary me-2" />;
      }
    };
    
    return (
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Report Preview</h4>
            <div className="text-muted">
              {getFormatIcon()}
              {reportOptions.format.toUpperCase()}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="report-preview p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="report-title" style={{ color: reportOptions.branding.primaryColor }}>
              <h3>{reportOptions.title || 'Survey Report'}</h3>
            </div>
            
            <hr />
            
            <div className="report-sections-preview mt-4">
              {reportOptions.sections.map((section, index) => (
                <div key={index} className="report-section-preview mb-4">
                  <h5 style={{ color: reportOptions.branding.secondaryColor }}>
                    {section.replace('_', ' ').split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h5>
                  <div className="section-content-preview py-2">
                    <div className="placeholder-content">
                      <div className="placeholder-text w-100"></div>
                      <div className="placeholder-text w-75"></div>
                      <div className="placeholder-text w-50"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-muted text-center mt-3">
            <small>This is a preview of your report structure. The actual content will be generated when you click "Generate Report".</small>
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading survey data...</p>
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
  
  return (
    <Container className="py-5">
      <div className="d-flex align-items-center mb-4">
        <Button
          variant="outline-secondary"
          onClick={() => navigate(`/surveys/${id}/analytics`)}
          className="me-3"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back to Analytics
        </Button>
        <div>
          <h1 className="mb-0">Report Generator</h1>
          <p className="text-muted mb-0">Generate a customized report for {survey.title}</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col lg={12}>
          {generating ? (
            renderGenerationProgress()
          ) : generatedReport ? (
            renderDownloadSection()
          ) : (
            <>
              {renderReportForm()}
              {renderReportPreview()}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SurveyReportGenerator; 