import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLink, faCopy, faCheck, faTimes, faArrowLeft, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../utils/supabaseClient';

const SurveySharePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [publicShareUrl, setPublicShareUrl] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSharing, setShowSharing] = useState(true);
  
  const [userEmail, setUserEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  
  useEffect(() => {
    const fetchSurveyAndShares = async () => {
      try {
        setIsLoading(true);
        
        // Fetch survey details
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*, owner:owner_id(*)')
          .eq('id', id)
          .single();
        
        if (surveyError) throw surveyError;
        
        setSurvey(surveyData);
        
        // Generate sharing URLs
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/s/${id}`);
        setPublicShareUrl(`${baseUrl}/s/${id}/p`);
        
        // Fetch shared users
        const { data: sharesData, error: sharesError } = await supabase
          .from('survey_shares')
          .select('*, user:user_id(*)')
          .eq('survey_id', id);
        
        if (sharesError) throw sharesError;
        
        setSharedUsers(sharesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load survey sharing information.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurveyAndShares();
  }, [id]);
  
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShareByEmail = async () => {
    try {
      setIsSaving(true);
      
      // Check if email is already shared
      const existingShare = sharedUsers.find(
        share => share.user?.email?.toLowerCase() === userEmail.toLowerCase()
      );
      
      if (existingShare) {
        setError('This email is already on the share list.');
        return;
      }
      
      // First try to find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (userError) throw userError;
      
      if (!userData) {
        // User not found - send an invitation email instead
        const { error: inviteError } = await supabase.functions.invoke('send-survey-invite', {
          body: {
            surveyId: id,
            email: userEmail,
            surveyTitle: survey.title,
            inviterName: survey.owner?.full_name || 'Someone'
          }
        });
        
        if (inviteError) throw inviteError;
        
        setSuccessMessage(`Invitation sent to ${userEmail}. They'll receive an email with access instructions.`);
        setUserEmail('');
        return;
      }
      
      // If user exists, create a direct share
      const { data: shareData, error: shareError } = await supabase
        .from('survey_shares')
        .insert({
          survey_id: id,
          user_id: userData.id,
          can_edit: canEdit
        })
        .select('*, user:user_id(*)')
        .single();
      
      if (shareError) throw shareError;
      
      setSharedUsers([...sharedUsers, shareData]);
      setSuccessMessage(`Survey shared with ${userEmail} successfully.`);
      setUserEmail('');
      setCanEdit(false);
    } catch (err) {
      console.error('Error sharing survey:', err);
      setError('Failed to share the survey. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveShare = async (shareId) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('survey_shares')
        .delete()
        .eq('id', shareId);
      
      if (error) throw error;
      
      setSharedUsers(sharedUsers.filter(share => share.id !== shareId));
      setSuccessMessage('User access removed successfully.');
    } catch (err) {
      console.error('Error removing share:', err);
      setError('Failed to remove access. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateSharePermission = async (shareId, newCanEdit) => {
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('survey_shares')
        .update({ can_edit: newCanEdit })
        .eq('id', shareId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the local state
      setSharedUsers(sharedUsers.map(share => 
        share.id === shareId ? { ...share, can_edit: newCanEdit } : share
      ));
      
      setSuccessMessage('Permissions updated successfully.');
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('Failed to update permissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTogglePublicAccess = async (isPublic) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('surveys')
        .update({ is_public: isPublic })
        .eq('id', id);
      
      if (error) throw error;
      
      setSurvey({ ...survey, is_public: isPublic });
      setSuccessMessage(isPublic 
        ? 'Survey is now publicly accessible via link.' 
        : 'Public access has been disabled.');
    } catch (err) {
      console.error('Error updating public access:', err);
      setError('Failed to update public access. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading survey sharing options...</p>
      </Container>
    );
  }
  
  if (!survey) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Survey not found or you don't have permission to access it.
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
      <Row className="mb-4">
        <Col>
          <Button
            variant="outline-secondary"
            onClick={() => navigate(`/surveys/${id}/edit`)}
            className="mb-3"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Survey
          </Button>
          <h1 className="mb-3">Share Survey</h1>
          <p className="text-muted">"{survey.title}"</p>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h4 className="mb-0">Sharing Options</h4>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-4">
                <Form.Label>Share Link</Form.Label>
                <div className="d-flex">
                  <Form.Control 
                    type="text" 
                    value={shareUrl} 
                    readOnly 
                    className="me-2"
                  />
                  <Button 
                    variant="outline-primary"
                    onClick={() => handleCopyLink(shareUrl)}
                    title="Copy link"
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Share this link with specific individuals. Only authorized users will be able to access it.
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Check 
                  type="switch"
                  id="public-access-switch"
                  label="Enable public access"
                  checked={survey.is_public}
                  onChange={(e) => handleTogglePublicAccess(e.target.checked)}
                />
                <Form.Text className="text-muted d-block mb-2">
                  When enabled, anyone with the public link can view and respond to this survey.
                </Form.Text>
                
                {survey.is_public && (
                  <div className="d-flex mt-3">
                    <Form.Control 
                      type="text" 
                      value={publicShareUrl} 
                      readOnly 
                      className="me-2"
                    />
                    <Button 
                      variant="outline-primary"
                      onClick={() => handleCopyLink(publicShareUrl)}
                      title="Copy public link"
                    >
                      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                    </Button>
                  </div>
                )}
              </Form.Group>
              
              <hr />
              
              <Form.Group className="mb-4">
                <Form.Label>Share with a User</Form.Label>
                <div className="d-flex">
                  <Form.Control 
                    type="email" 
                    value={userEmail} 
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="me-2"
                  />
                  <Button 
                    variant="primary"
                    onClick={handleShareByEmail}
                    disabled={!userEmail || isSaving}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Add
                  </Button>
                </div>
                <Form.Check 
                  type="checkbox"
                  id="can-edit-switch"
                  label="Allow editing"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="mt-2"
                />
                <Form.Text className="text-muted">
                  Enter the email of a user to grant them access. If they don't have an account, we'll send them an invitation.
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header>
              <h4 className="mb-0">Shared With</h4>
            </Card.Header>
            <Card.Body>
              {sharedUsers.length === 0 ? (
                <p className="text-muted">
                  This survey hasn't been shared with any specific users yet.
                </p>
              ) : (
                <Table hover responsive className="shared-users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Access Level</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedUsers.map(share => (
                      <tr key={share.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar me-2">
                              {share.user?.full_name 
                                ? share.user.full_name.charAt(0) 
                                : (share.user?.email.charAt(0) || 'U')}
                            </div>
                            <div>
                              <div>{share.user?.full_name || 'Unnamed User'}</div>
                              <div className="text-muted small">{share.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Form.Check 
                            type="switch"
                            id={`can-edit-switch-${share.id}`}
                            label={share.can_edit ? "Can Edit" : "View Only"}
                            checked={share.can_edit}
                            onChange={(e) => handleUpdateSharePermission(share.id, e.target.checked)}
                          />
                        </td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleRemoveShare(share.id)}
                            title="Remove access"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Survey Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Badge 
                  bg={survey.status === 'draft' ? 'secondary' : 'success'}
                  className="px-3 py-2"
                >
                  {survey.status === 'draft' ? 'Draft' : 'Published'}
                </Badge>
              </div>
              
              <p className="mb-1"><strong>Created:</strong> {new Date(survey.created_at).toLocaleDateString()}</p>
              <p><strong>Last Updated:</strong> {new Date(survey.updated_at).toLocaleDateString()}</p>
              
              {survey.status === 'draft' && (
                <Alert variant="warning" className="mt-3">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  This survey is still in draft mode. Only people with edit access can preview it.
                </Alert>
              )}
              
              {survey.status === 'published' && (
                <div className="mt-3">
                  <p className="mb-2"><strong>Responses:</strong> {survey.response_count || 0}</p>
                  {survey.response_count > 0 && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      as={Link}
                      to={`/surveys/${id}/responses`}
                      className="w-100"
                    >
                      View Responses
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Sharing Tips</h5>
            </Card.Header>
            <Card.Body>
              <ul className="ps-3 mb-0">
                <li className="mb-2">Users with <strong>View Only</strong> access can view and respond to your survey.</li>
                <li className="mb-2">Users with <strong>Can Edit</strong> permission can modify your survey questions and settings.</li>
                <li className="mb-2">The <strong>Public link</strong> allows anyone to access your survey without logging in.</li>
                <li>Use <strong>email sharing</strong> to track who has access to your survey.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SurveySharePage; 