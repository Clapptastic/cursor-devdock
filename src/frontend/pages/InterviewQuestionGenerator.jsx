import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagic, 
  faClipboard, 
  faDownload, 
  faCheck,
  faArrowLeft,
  faUser,
  faClock,
  faList,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import aiService from '../utils/aiService';

const InterviewQuestionGenerator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    researchGoals: '',
    topics: [''],
    interviewFormat: 'individual',
    duration: 30,
    targetAudience: '',
    interviewMethod: 'in-person'
  });
  
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTopicChange = (index, value) => {
    const updatedTopics = [...formData.topics];
    updatedTopics[index] = value;
    
    setFormData(prev => ({
      ...prev,
      topics: updatedTopics
    }));
  };
  
  const addTopic = () => {
    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, '']
    }));
  };
  
  const removeTopic = (index) => {
    const updatedTopics = formData.topics.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      topics: updatedTopics
    }));
  };
  
  const validateForm = () => {
    return (
      formData.researchGoals.trim() !== '' &&
      formData.topics.some(topic => topic.trim() !== '') &&
      formData.targetAudience.trim() !== ''
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Clean up topics by removing empty ones
      const filteredTopics = formData.topics.filter(topic => topic.trim() !== '');
      
      const result = await aiService.generateInterviewQuestions({
        ...formData,
        topics: filteredTopics
      });
      
      setGeneratedQuestions(result);
    } catch (err) {
      console.error('Error generating interview questions:', err);
      setError('Failed to generate interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!generatedQuestions) return;
    
    const textToCopy = [
      `# ${generatedQuestions.title || 'Interview Questions'}`,
      '',
      `## Introduction`,
      generatedQuestions.introduction || '',
      '',
      `## Questions`,
      ...(generatedQuestions.questions || []).map((q, i) => `${i + 1}. ${q.text}${q.follow_up ? `\n   - Follow-up: ${q.follow_up}` : ''}`),
      '',
      `## Closing`,
      generatedQuestions.closing || ''
    ].join('\n');
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleDownload = () => {
    if (!generatedQuestions) return;
    
    const textContent = [
      `# ${generatedQuestions.title || 'Interview Questions'}`,
      '',
      `## Introduction`,
      generatedQuestions.introduction || '',
      '',
      `## Questions`,
      ...(generatedQuestions.questions || []).map((q, i) => `${i + 1}. ${q.text}${q.follow_up ? `\n   - Follow-up: ${q.follow_up}` : ''}`),
      '',
      `## Closing`,
      generatedQuestions.closing || ''
    ].join('\n');
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedQuestions.title || 'interview-questions'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const renderQuestionForm = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <h4 className="mb-0">Create Interview Questions</h4>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>What are your research goals?</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="researchGoals"
              value={formData.researchGoals}
              onChange={handleInputChange}
              placeholder="e.g., Understand customer pain points with current solutions in the market"
              required
            />
            <Form.Text className="text-muted">
              Clearly describe what you want to learn from these interviews.
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Who is your target audience?</Form.Label>
            <Form.Control
              type="text"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              placeholder="e.g., Small business owners in the retail industry"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>Topics to Cover</Form.Label>
            {formData.topics.map((topic, index) => (
              <div key={index} className="d-flex mb-2">
                <Form.Control
                  type="text"
                  value={topic}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  placeholder={`Topic ${index + 1}, e.g., Current challenges, Decision-making process`}
                  className="me-2"
                />
                {formData.topics.length > 1 && (
                  <Button 
                    variant="outline-danger" 
                    onClick={() => removeTopic(index)}
                    className="flex-shrink-0"
                  >
                    &times;
                  </Button>
                )}
              </div>
            ))}
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={addTopic}
              className="mt-2"
            >
              + Add Topic
            </Button>
          </Form.Group>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Interview Format</Form.Label>
                <Form.Select
                  name="interviewFormat"
                  value={formData.interviewFormat}
                  onChange={handleInputChange}
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                  <option value="panel">Panel</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Interview Method</Form.Label>
                <Form.Select
                  name="interviewMethod"
                  value={formData.interviewMethod}
                  onChange={handleInputChange}
                >
                  <option value="in-person">In Person</option>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          
          <div className="d-flex justify-content-between mt-4 pt-3 border-top">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/dashboard')}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back to Dashboard
            </Button>
            
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading || !validateForm()}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Generating...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMagic} className="me-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
  
  const renderGeneratedQuestions = () => (
    <>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">{generatedQuestions.title || 'Generated Interview Questions'}</h4>
            <div>
              <Button
                variant="outline-primary"
                className="me-2"
                onClick={handleCopyToClipboard}
              >
                <FontAwesomeIcon icon={copied ? faCheck : faClipboard} className="me-2" />
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button
                variant="outline-primary"
                onClick={handleDownload}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Download
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="interview-meta mb-4">
            <Row className="g-3">
              <Col md={4}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <div className="icon-box me-3">
                      <FontAwesomeIcon icon={faUser} className="text-primary" />
                    </div>
                    <div>
                      <div className="small text-muted">Target Audience</div>
                      <div className="fw-medium">{formData.targetAudience}</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <div className="icon-box me-3">
                      <FontAwesomeIcon icon={faClock} className="text-primary" />
                    </div>
                    <div>
                      <div className="small text-muted">Duration</div>
                      <div className="fw-medium">{formData.duration} minutes</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <div className="icon-box me-3">
                      <FontAwesomeIcon icon={faList} className="text-primary" />
                    </div>
                    <div>
                      <div className="small text-muted">Question Count</div>
                      <div className="fw-medium">{generatedQuestions.questions.length} questions</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
          
          <div className="interview-script">
            <h5 className="mb-3">Introduction</h5>
            <div className="interview-section mb-4 p-3 bg-light rounded">
              <p className="mb-0">{generatedQuestions.introduction}</p>
            </div>
            
            <h5 className="mb-3">Questions</h5>
            <ListGroup className="mb-4">
              {generatedQuestions.questions.map((question, index) => (
                <ListGroup.Item key={index} className="py-3">
                  <div className="d-flex">
                    <div className="question-number me-3">
                      <span className="badge bg-primary rounded-circle">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="fw-medium mb-2">{question.text}</div>
                      {question.follow_up && (
                        <div className="ms-3 mt-2">
                          <small className="text-muted">Follow-up:</small>
                          <div>{question.follow_up}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            
            <h5 className="mb-3">Closing</h5>
            <div className="interview-section mb-4 p-3 bg-light rounded">
              <p className="mb-0">{generatedQuestions.closing}</p>
            </div>
          </div>
          
          {generatedQuestions.tips && generatedQuestions.tips.length > 0 && (
            <div className="interview-tips mt-4 pt-3 border-top">
              <h5 className="mb-3">Interview Tips</h5>
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                <strong>Pro Tips:</strong>
                <ul className="mb-0 mt-2">
                  {generatedQuestions.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </Alert>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <div className="d-flex justify-content-between">
        <Button
          variant="outline-secondary"
          onClick={() => setGeneratedQuestions(null)}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Edit Research Goals
        </Button>
        
        <Button
          variant="outline-primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </>
  );
  
  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">AI Interview Question Generator</h1>
          <p className="text-muted">
            Create a set of interview questions tailored to your research goals and target audience.
          </p>
        </Col>
      </Row>
      
      <Row>
        <Col lg={generatedQuestions ? 12 : 8}>
          {generatedQuestions ? renderGeneratedQuestions() : renderQuestionForm()}
        </Col>
        
        {!generatedQuestions && (
          <Col lg={4}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Interview Question Tips</h5>
              </Card.Header>
              <Card.Body>
                <h6>Best Practices</h6>
                <ul className="mb-4">
                  <li>Start with broad, open-ended questions</li>
                  <li>Use "why" and "how" to uncover deeper insights</li>
                  <li>Avoid leading questions that suggest answers</li>
                  <li>Include follow-up questions to explore interesting areas</li>
                  <li>End with questions about future preferences</li>
                </ul>
                
                <h6>Question Types</h6>
                <ul className="mb-0">
                  <li><strong>Behavioral:</strong> "Tell me about a time when..."</li>
                  <li><strong>Experiential:</strong> "Walk me through how you..."</li>
                  <li><strong>Opinion:</strong> "What do you think about..."</li>
                  <li><strong>Feeling:</strong> "How do you feel when..."</li>
                  <li><strong>Knowledge:</strong> "What do you know about..."</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default InterviewQuestionGenerator; 