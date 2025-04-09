import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Alert, 
  Spinner,
  Tab,
  Nav 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faPlus, 
  faMagic, 
  faGears, 
  faEye, 
  faShare, 
  faTrash,
  faArrowUp,
  faArrowDown,
  faBrain
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

import QuestionTypeSelector from '../components/survey/QuestionTypeSelector';
import QuestionEditor from '../components/survey/QuestionEditor';
import SurveyPreview from '../components/survey/SurveyPreview';
import SurveySettings from '../components/survey/SurveySettings';
import SurveyShareOptions from '../components/survey/SurveyShareOptions';
import AIEnhancePanel from '../components/survey/AIEnhancePanel';
import AIRecommendations from '../components/survey/AIRecommendations';

const SurveyEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/surveys/${id}`);
        setSurvey(response.data);
        
        // Set the first question as active if survey has questions
        if (response.data.questions && response.data.questions.length > 0) {
          setActiveQuestionIndex(0);
        }
      } catch (err) {
        console.error('Error fetching survey:', err);
        setError(err.response?.data?.message || 'Failed to load survey');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurvey();
  }, [id]);
  
  const handleSaveSurvey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await axios.put(`/api/surveys/${id}`, survey);
      
      // Show success message or toast
    } catch (err) {
      console.error('Error saving survey:', err);
      setError(err.response?.data?.message || 'Failed to save survey');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddQuestion = (questionType) => {
    if (!survey) return;
    
    const newQuestion = createEmptyQuestion(questionType);
    const updatedQuestions = [...survey.questions, newQuestion];
    
    setSurvey({
      ...survey,
      questions: updatedQuestions
    });
    
    // Set the new question as active
    setActiveQuestionIndex(updatedQuestions.length - 1);
  };
  
  const handleDeleteQuestion = (index) => {
    if (!survey) return;
    
    const updatedQuestions = [...survey.questions];
    updatedQuestions.splice(index, 1);
    
    setSurvey({
      ...survey,
      questions: updatedQuestions
    });
    
    // Update active question index
    if (activeQuestionIndex === index) {
      // If we're deleting the active question
      if (updatedQuestions.length > 0) {
        // If there are still questions, set the active to the previous index
        // or the last question if we deleted the first one
        setActiveQuestionIndex(index === 0 ? 0 : index - 1);
      } else {
        // If no questions remain, reset active index
        setActiveQuestionIndex(null);
      }
    } else if (activeQuestionIndex > index) {
      // If we're deleting a question before the active one, decrement the active index
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };
  
  const handleMoveQuestion = (index, direction) => {
    if (!survey) return;
    
    const updatedQuestions = [...survey.questions];
    
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === updatedQuestions.length - 1)
    ) {
      return; // Can't move first question up or last question down
    }
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the questions
    [updatedQuestions[index], updatedQuestions[targetIndex]] = 
    [updatedQuestions[targetIndex], updatedQuestions[index]];
    
    setSurvey({
      ...survey,
      questions: updatedQuestions
    });
    
    // Update active question index
    if (activeQuestionIndex === index) {
      setActiveQuestionIndex(targetIndex);
    } else if (activeQuestionIndex === targetIndex) {
      setActiveQuestionIndex(index);
    }
  };
  
  const handleUpdateQuestion = (updatedQuestion) => {
    if (!survey || activeQuestionIndex === null) return;
    
    const updatedQuestions = [...survey.questions];
    updatedQuestions[activeQuestionIndex] = updatedQuestion;
    
    setSurvey({
      ...survey,
      questions: updatedQuestions
    });
  };
  
  const handleUpdateSurveySettings = (updatedSettings) => {
    if (!survey) return;
    
    setSurvey({
      ...survey,
      settings: {
        ...survey.settings,
        ...updatedSettings
      }
    });
  };
  
  const handleUpdateSurveyBasic = (e) => {
    const { name, value } = e.target;
    
    setSurvey({
      ...survey,
      [name]: value
    });
  };
  
  const handlePublishSurvey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await axios.put(`/api/surveys/${id}/publish`, {
        status: 'published'
      });
      
      setSurvey({
        ...survey,
        status: 'published'
      });
      
      // Show success message
    } catch (err) {
      console.error('Error publishing survey:', err);
      setError(err.response?.data?.message || 'Failed to publish survey');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAIEnhance = (enhancedQuestions) => {
    if (!survey) return;
    
    setSurvey({
      ...survey,
      questions: enhancedQuestions
    });
    
    setShowAIPanel(false);
  };
  
  // Helper function to create an empty question of the specified type
  const createEmptyQuestion = (type) => {
    const baseQuestion = {
      id: `q_${Date.now()}`,
      type,
      question: '',
      description: '',
      required: true
    };
    
    switch (type) {
      case 'multiple_choice':
      case 'checkbox':
      case 'dropdown':
        return {
          ...baseQuestion,
          options: ['Option 1', 'Option 2']
        };
      case 'rating':
        return {
          ...baseQuestion,
          min: 1,
          max: 5,
          labels: {
            min: 'Poor',
            max: 'Excellent'
          }
        };
      case 'open_ended':
      default:
        return baseQuestion;
    }
  };
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <Spinner animation="border" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/surveys')}>
              Back to Surveys
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
  
  if (!survey) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Survey not found
          <div className="mt-3">
            <Button variant="outline-primary" onClick={() => navigate('/surveys')}>
              Back to Surveys
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid className="survey-editor-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">{survey.title || 'Untitled Survey'}</h2>
          <p className="text-muted">
            Status: <span className={`status-${survey.status}`}>{survey.status}</span>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary"
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            <FontAwesomeIcon icon={faMagic} className="me-2" />
            AI Enhance
          </Button>
          <Button 
            variant="outline-secondary"
            onClick={() => navigate(`/surveys/${id}/preview`)}
          >
            <FontAwesomeIcon icon={faEye} className="me-2" />
            Preview
          </Button>
          <Button 
            variant="primary"
            onClick={handleSaveSurvey}
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner as="span" size="sm" animation="border" className="me-2" />
            ) : (
              <FontAwesomeIcon icon={faSave} className="me-2" />
            )}
            Save
          </Button>
          {survey.status === 'draft' && (
            <Button 
              variant="success"
              onClick={handlePublishSurvey}
              disabled={isSaving || survey.questions.length === 0}
            >
              Publish
            </Button>
          )}
        </div>
      </div>
      
      <Row>
        <Col md={3}>
          <Card className="mb-3">
            <Card.Header>
              <h5 className="mb-0">Basic Information</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Survey Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={survey.title}
                  onChange={handleUpdateSurveyBasic}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={survey.description}
                  onChange={handleUpdateSurveyBasic}
                />
              </Form.Group>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Questions</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {survey.questions.length > 0 ? (
                <div className="question-list">
                  {survey.questions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className={`question-list-item ${activeQuestionIndex === index ? 'active' : ''}`}
                      onClick={() => setActiveQuestionIndex(index)}
                      draggable
                      onDragStart={() => setDraggedQuestionIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedQuestionIndex !== null && draggedQuestionIndex !== index) {
                          // Move the dragged question to the new position
                          const updatedQuestions = [...survey.questions];
                          const [movedQuestion] = updatedQuestions.splice(draggedQuestionIndex, 1);
                          updatedQuestions.splice(index, 0, movedQuestion);
                          
                          setSurvey({
                            ...survey,
                            questions: updatedQuestions
                          });
                          
                          // Update active question index
                          if (activeQuestionIndex === draggedQuestionIndex) {
                            setActiveQuestionIndex(index);
                          }
                          
                          setDraggedQuestionIndex(null);
                        }
                      }}
                    >
                      <div className="question-preview">
                        {question.question || `Question ${index + 1}`}
                        <div className="question-type-badge">
                          {question.type.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="question-actions">
                        <Button 
                          variant="link" 
                          size="sm"
                          className="question-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(index, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <FontAwesomeIcon icon={faArrowUp} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm"
                          className="question-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(index, 'down');
                          }}
                          disabled={index === survey.questions.length - 1}
                        >
                          <FontAwesomeIcon icon={faArrowDown} />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm"
                          className="question-action-btn text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(index);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center">
                  <p className="text-muted">No questions yet</p>
                </div>
              )}
              <div className="p-3 border-top">
                <h6>Add New Question</h6>
                <QuestionTypeSelector onSelectType={handleAddQuestion} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9}>
          <Card>
            <Card.Header>
              <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="questions">Questions</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="preview">Preview</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="settings">
                    <FontAwesomeIcon icon={faGears} className="me-2" />
                    Settings
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="share">
                    <FontAwesomeIcon icon={faShare} className="me-2" />
                    Share
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="ai-insights">
                    <FontAwesomeIcon icon={faBrain} className="me-2" />
                    AI Insights
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                <Tab.Pane eventKey="questions">
                  {activeQuestionIndex !== null && survey.questions.length > 0 ? (
                    <QuestionEditor 
                      question={survey.questions[activeQuestionIndex]}
                      onChange={handleUpdateQuestion}
                    />
                  ) : (
                    <div className="text-center p-5">
                      <p className="text-muted mb-3">No question selected or survey has no questions.</p>
                      <QuestionTypeSelector 
                        onSelectType={handleAddQuestion} 
                        displayMode="button"
                      />
                    </div>
                  )}
                </Tab.Pane>
                <Tab.Pane eventKey="preview">
                  <SurveyPreview survey={survey} />
                </Tab.Pane>
                <Tab.Pane eventKey="settings">
                  <SurveySettings 
                    settings={survey.settings} 
                    onUpdate={handleUpdateSurveySettings}
                  />
                </Tab.Pane>
                <Tab.Pane eventKey="share">
                  <SurveyShareOptions 
                    survey={survey}
                    surveyId={id}
                  />
                </Tab.Pane>
                <Tab.Pane eventKey="ai-insights">
                  <Row>
                    <Col>
                      <h4 className="mb-4">AI Survey Analysis</h4>
                      <AIRecommendations survey={survey} />
                    </Col>
                  </Row>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {showAIPanel && (
        <AIEnhancePanel 
          survey={survey}
          onClose={() => setShowAIPanel(false)}
          onApplyChanges={handleAIEnhance}
        />
      )}
      
      <style jsx>{`
        .survey-editor-container {
          min-height: calc(100vh - 70px);
        }
        
        .status-draft {
          color: var(--bs-warning);
          font-weight: 500;
        }
        
        .status-published {
          color: var(--bs-success);
          font-weight: 500;
        }
        
        .question-list {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .question-list-item {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e9ecef;
          cursor: pointer;
          position: relative;
          background-color: #fff;
          transition: background-color 0.2s;
        }
        
        .question-list-item:hover {
          background-color: #f8f9fa;
        }
        
        .question-list-item.active {
          background-color: #e9ecef;
          border-left: 4px solid var(--bs-primary);
        }
        
        .question-preview {
          font-weight: 500;
          margin-bottom: 0.25rem;
          word-break: break-word;
        }
        
        .question-type-badge {
          display: inline-block;
          font-size: 0.75rem;
          background-color: #e9ecef;
          color: #495057;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          text-transform: capitalize;
          margin-top: 0.25rem;
        }
        
        .question-actions {
          display: flex;
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .question-list-item:hover .question-actions {
          opacity: 1;
        }
        
        .question-action-btn {
          padding: 0.25rem;
          color: #6c757d;
        }
        
        .question-action-btn:hover:not(:disabled) {
          color: var(--bs-primary);
        }
      `}</style>
    </Container>
  );
};

export default SurveyEditor; 