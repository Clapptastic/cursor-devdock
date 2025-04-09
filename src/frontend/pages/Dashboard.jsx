import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faEllipsisV, faShare, faEdit, faTrash, faChartBar, faFileAlt, faUsers, faComments } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { supabase, getCurrentUser } from '../utils/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user data and surveys on component mount
  useEffect(() => {
    const fetchUserAndSurveys = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current authenticated user
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Fetch surveys from Supabase
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .or(`owner_id.eq.${currentUser.id},shared_with.cs.{${currentUser.id}}`)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        setSurveys(data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load surveys. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndSurveys();
  }, []);

  // Handle deleting a survey
  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);
      
      if (error) throw error;
      
      // Remove from local state
      setSurveys(surveys.filter(survey => survey.id !== surveyId));
    } catch (err) {
      console.error('Error deleting survey:', err);
      setError('Failed to delete survey. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter surveys based on active filter
  const filteredSurveys = surveys.filter(survey => {
    // Apply search filter
    if (searchTerm && !survey.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    switch (activeFilter) {
      case 'draft':
        return survey.status === 'draft';
      case 'published':
        return survey.status === 'published';
      case 'shared':
        return survey.owner_id !== user?.id;
      default: // 'all'
        return true;
    }
  });

  return (
    <Container className="dashboard py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="mb-0">Survey Dashboard</h1>
          <p className="text-muted">
            Manage your surveys and view insights
          </p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => navigate('/surveys/create')}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Create New Survey
          </Button>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6} className="mb-3 mb-md-0">
              <div className="search-box">
                <FontAwesomeIcon icon={faSearch} className="search-icon text-muted" />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Col>
            <Col md={6}>
              <Nav className="survey-filters">
                <Nav.Item>
                  <Nav.Link 
                    active={activeFilter === 'all'} 
                    onClick={() => setActiveFilter('all')}
                  >
                    All
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeFilter === 'draft'} 
                    onClick={() => setActiveFilter('draft')}
                  >
                    Drafts
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeFilter === 'published'} 
                    onClick={() => setActiveFilter('published')}
                  >
                    Published
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeFilter === 'shared'} 
                    onClick={() => setActiveFilter('shared')}
                  >
                    Shared with me
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading your surveys...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <Card className="shadow-sm text-center py-5">
          <Card.Body>
            <h4 className="mb-3">No surveys found</h4>
            <p className="text-muted mb-4">
              {searchTerm 
                ? "No surveys match your search criteria"
                : activeFilter !== 'all'
                  ? `You don't have any ${activeFilter} surveys yet`
                  : "You haven't created any surveys yet. Let's create your first one!"}
            </p>
            {!searchTerm && activeFilter === 'all' && (
              <Button 
                variant="primary" 
                onClick={() => navigate('/surveys/create')}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Survey
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {filteredSurveys.map(survey => (
            <Col key={survey.id} lg={4} md={6} className="mb-4">
              <Card className="survey-card h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className={`status-badge status-${survey.status}`}>
                      {survey.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                    
                    <div className="dropdown">
                      <Button variant="link" className="dropdown-toggle-no-caret p-0">
                        <FontAwesomeIcon icon={faEllipsisV} className="text-muted" />
                      </Button>
                      <div className="dropdown-menu dropdown-menu-end">
                        <button 
                          className="dropdown-item" 
                          onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                        >
                          <FontAwesomeIcon icon={faEdit} className="me-2" />
                          Edit
                        </button>
                        <button 
                          className="dropdown-item" 
                          onClick={() => navigate(`/surveys/${survey.id}/share`)}
                        >
                          <FontAwesomeIcon icon={faShare} className="me-2" />
                          Share
                        </button>
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={() => handleDeleteSurvey(survey.id)}
                          disabled={isDeleting}
                        >
                          <FontAwesomeIcon icon={faTrash} className="me-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <h5 className="survey-title mb-2">{survey.title}</h5>
                  <p className="text-muted small survey-desc mb-3">
                    {survey.description?.length > 100
                      ? `${survey.description.substring(0, 100)}...`
                      : survey.description}
                  </p>
                  
                  <div className="survey-stats small text-muted mb-3">
                    <div>Created: {new Date(survey.created_at).toLocaleDateString()}</div>
                    <div>Questions: {survey.questions?.length || 0}</div>
                    <div>Responses: {survey.response_count || 0}</div>
                  </div>
                  
                  <div className="d-flex mt-auto pt-3 border-top">
                    {survey.status === 'published' && (
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => navigate(`/surveys/${survey.id}/responses`)}
                      >
                        <FontAwesomeIcon icon={faChartBar} className="me-1" />
                        View Responses
                      </Button>
                    )}
                    <Button 
                      variant={survey.status === 'draft' ? 'primary' : 'outline-secondary'} 
                      size="sm"
                      className="ms-auto"
                      onClick={() => navigate(`/surveys/${survey.id}/${survey.status === 'draft' ? 'edit' : 'view'}`)}
                    >
                      {survey.status === 'draft' ? 'Continue Editing' : 'View Survey'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card className="shadow-sm mt-4">
        <Card.Body>
          <Row className="text-center">
            <Col md={3} className="mb-4">
              <Link to="/surveys/create" className="text-decoration-none">
                <div className="feature-card p-4 h-100 d-flex flex-column align-items-center justify-content-center">
                  <FontAwesomeIcon icon={faFileAlt} className="mb-3 fa-3x text-primary" />
                  <h5>Create Survey</h5>
                  <p className="text-muted">Create a new AI-powered survey</p>
                </div>
              </Link>
            </Col>
            <Col md={3} className="mb-4">
              <Link to="/participants" className="text-decoration-none">
                <div className="feature-card p-4 h-100 d-flex flex-column align-items-center justify-content-center">
                  <FontAwesomeIcon icon={faUsers} className="mb-3 fa-3x text-primary" />
                  <h5>Find Participants</h5>
                  <p className="text-muted">Recruit participants for your surveys</p>
                </div>
              </Link>
            </Col>
            <Col md={3} className="mb-4">
              <Link to="/interview-generator" className="text-decoration-none">
                <div className="feature-card p-4 h-100 d-flex flex-column align-items-center justify-content-center">
                  <FontAwesomeIcon icon={faComments} className="mb-3 fa-3x text-primary" />
                  <h5>Interview Questions</h5>
                  <p className="text-muted">Generate interview questions</p>
                </div>
              </Link>
            </Col>
            <Col md={3} className="mb-4">
              <Link to={filteredSurveys.length > 0 ? `/surveys/${filteredSurveys[0].id}/report` : "#"} 
                    className={`text-decoration-none ${filteredSurveys.length === 0 ? "disabled-link" : ""}`}
                    onClick={e => filteredSurveys.length === 0 && e.preventDefault()}>
                <div className="feature-card p-4 h-100 d-flex flex-column align-items-center justify-content-center">
                  <FontAwesomeIcon icon={faFileAlt} className="mb-3 fa-3x text-primary" />
                  <h5>Generate Reports</h5>
                  <p className="text-muted">Create detailed reports from your survey data</p>
                </div>
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard; 