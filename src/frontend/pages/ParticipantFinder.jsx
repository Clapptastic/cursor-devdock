import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Badge, Modal } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUsers, 
  faTags, 
  faEnvelope,
  faArrowLeft,
  faFilter,
  faInfoCircle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import aiService from '../utils/aiService';

const ParticipantFinder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    industry: '',
    participantCount: 25,
    demographics: {
      ageRanges: [],
      genders: [],
      locations: [],
      incomeRanges: [],
      educationLevels: []
    },
    requirementDescriptions: '',
    surveyId: '',
    incentiveAmount: 25
  });
  
  const [participants, setParticipants] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inviteModalShow, setInviteModalShow] = useState(false);
  const [inviteData, setInviteData] = useState({
    subject: '',
    message: '',
    selectedParticipants: []
  });
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDemographicChange = (category, value, checked) => {
    setFormData(prev => {
      const updatedDemographics = { ...prev.demographics };
      
      if (checked) {
        // Add the value if not already present
        if (!updatedDemographics[category].includes(value)) {
          updatedDemographics[category] = [...updatedDemographics[category], value];
        }
      } else {
        // Remove the value if present
        updatedDemographics[category] = updatedDemographics[category].filter(v => v !== value);
      }
      
      return {
        ...prev,
        demographics: updatedDemographics
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await aiService.findParticipants({
        industry: formData.industry,
        demographics: formData.demographics,
        participantCount: formData.participantCount,
        requirementDescriptions: formData.requirementDescriptions,
        incentiveAmount: formData.incentiveAmount,
        surveyId: formData.surveyId || undefined
      });
      
      setParticipants(result);
    } catch (err) {
      console.error('Error finding participants:', err);
      setError('Failed to find participants. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenInviteModal = (selectedParticipants) => {
    const sampleSubject = `Invitation to participate in a ${formData.industry} research study`;
    const sampleMessage = `Hello,

We're conducting a research study about ${formData.industry} and we'd like to invite you to participate. The survey will take approximately 10-15 minutes to complete, and you'll receive ${formData.incentiveAmount} USD as a thank you for your time.

If you're interested, please click the link below to begin:
[SURVEY_LINK]

Thank you for your consideration!`;

    setInviteData({
      subject: sampleSubject,
      message: sampleMessage,
      selectedParticipants: selectedParticipants || []
    });
    
    setInviteModalShow(true);
  };
  
  const handleSelectAllParticipants = () => {
    if (!participants || !participants.available_participants) return;
    
    const allParticipantIds = participants.available_participants.map(p => p.id);
    
    if (inviteData.selectedParticipants.length === allParticipantIds.length) {
      // Deselect all
      setInviteData(prev => ({
        ...prev,
        selectedParticipants: []
      }));
    } else {
      // Select all
      setInviteData(prev => ({
        ...prev,
        selectedParticipants: allParticipantIds
      }));
    }
  };
  
  const handleToggleParticipant = (participantId) => {
    setInviteData(prev => {
      const selected = [...prev.selectedParticipants];
      
      if (selected.includes(participantId)) {
        // Remove participant
        return {
          ...prev,
          selectedParticipants: selected.filter(id => id !== participantId)
        };
      } else {
        // Add participant
        return {
          ...prev,
          selectedParticipants: [...selected, participantId]
        };
      }
    });
  };
  
  const handleSendInvites = async () => {
    try {
      setInviteLoading(true);
      
      // In a real application, this would send the invites through a Supabase function
      // For demonstration, we'll simulate a successful API call
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setInviteSent(true);
      
      // In a real application, you might update the participants' status in the database
      
    } catch (err) {
      console.error('Error sending invites:', err);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };
  
  const renderParticipantFinderForm = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <h4 className="mb-0">Find Survey Participants</h4>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Industry</Form.Label>
                <Form.Select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>Select an industry</option>
                  <option value="Software & Technology">Software & Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Retail & E-commerce">Retail & E-commerce</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Media & Entertainment">Media & Entertainment</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Travel & Hospitality">Travel & Hospitality</option>
                  <option value="Professional Services">Professional Services</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Participants Needed</Form.Label>
                <Form.Control
                  type="number"
                  name="participantCount"
                  value={formData.participantCount}
                  onChange={handleInputChange}
                  min={1}
                  max={200}
                  required
                />
                <Form.Text className="text-muted">
                  We'll recommend up to this many participants who match your criteria.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Additional Requirements (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="requirementDescriptions"
              value={formData.requirementDescriptions}
              onChange={handleInputChange}
              placeholder="e.g., Must have purchased a subscription service in the last 6 months"
            />
          </Form.Group>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Incentive Amount (USD)</Form.Label>
                <Form.Control
                  type="number"
                  name="incentiveAmount"
                  value={formData.incentiveAmount}
                  onChange={handleInputChange}
                  min={0}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Survey ID (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="surveyId"
                  value={formData.surveyId}
                  onChange={handleInputChange}
                  placeholder="Link to an existing survey"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <div className="demographics-section mt-4 pt-3 border-top">
            <h5 className="mb-3">
              <FontAwesomeIcon icon={faFilter} className="me-2" />
              Demographic Filters (Optional)
            </h5>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age Ranges</Form.Label>
                  <div>
                    {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(range => (
                      <Form.Check
                        key={range}
                        type="checkbox"
                        id={`age-${range}`}
                        label={range}
                        checked={formData.demographics.ageRanges.includes(range)}
                        onChange={(e) => handleDemographicChange('ageRanges', range, e.target.checked)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <div>
                    {['Male', 'Female', 'Non-binary', 'Other'].map(gender => (
                      <Form.Check
                        key={gender}
                        type="checkbox"
                        id={`gender-${gender}`}
                        label={gender}
                        checked={formData.demographics.genders.includes(gender)}
                        onChange={(e) => handleDemographicChange('genders', gender, e.target.checked)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Locations</Form.Label>
                  <div>
                    {['United States', 'Europe', 'Asia', 'Australia', 'South America', 'Africa'].map(location => (
                      <Form.Check
                        key={location}
                        type="checkbox"
                        id={`location-${location}`}
                        label={location}
                        checked={formData.demographics.locations.includes(location)}
                        onChange={(e) => handleDemographicChange('locations', location, e.target.checked)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Income Ranges (USD)</Form.Label>
                  <div>
                    {['Under $30k', '$30k-$60k', '$60k-$100k', '$100k-$150k', 'Over $150k'].map(range => (
                      <Form.Check
                        key={range}
                        type="checkbox"
                        id={`income-${range}`}
                        label={range}
                        checked={formData.demographics.incomeRanges.includes(range)}
                        onChange={(e) => handleDemographicChange('incomeRanges', range, e.target.checked)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </div>
          
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
              disabled={loading || !formData.industry}
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
                  Searching...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  Find Participants
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
  
  const renderParticipantResults = () => {
    if (!participants) return null;
    
    const { available_participants, total_matched, estimated_cost, match_quality } = participants;
    
    return (
      <>
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Participant Search Results</h4>
              <Button
                variant="outline-secondary"
                onClick={() => setParticipants(null)}
              >
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Modify Criteria
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="text-center mb-4">
              <Col md={3}>
                <div className="stats-item">
                  <h2 className="mb-0">{total_matched}</h2>
                  <p className="text-muted mb-0">Total Matches</p>
                </div>
              </Col>
              <Col md={3}>
                <div className="stats-item">
                  <h2 className="mb-0">{available_participants.length}</h2>
                  <p className="text-muted mb-0">Immediately Available</p>
                </div>
              </Col>
              <Col md={3}>
                <div className="stats-item">
                  <h2 className="mb-0">${estimated_cost}</h2>
                  <p className="text-muted mb-0">Estimated Cost</p>
                </div>
              </Col>
              <Col md={3}>
                <div className="stats-item">
                  <h2 className="mb-0">{match_quality}%</h2>
                  <p className="text-muted mb-0">Match Quality</p>
                </div>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Available Participants ({available_participants.length})</h5>
              <div>
                <Button
                  variant="primary"
                  onClick={() => handleOpenInviteModal()}
                  disabled={available_participants.length === 0}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Invite Participants
                </Button>
              </div>
            </div>
            
            {available_participants.length === 0 ? (
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                No participants match your exact criteria. Try broadening your search.
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th>
                        <Form.Check
                          type="checkbox"
                          checked={inviteData.selectedParticipants.length === available_participants.length}
                          onChange={handleSelectAllParticipants}
                        />
                      </th>
                      <th>Participant</th>
                      <th>Demographics</th>
                      <th>Match Score</th>
                      <th>Response Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {available_participants.map(participant => (
                      <tr key={participant.id}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={inviteData.selectedParticipants.includes(participant.id)}
                            onChange={() => handleToggleParticipant(participant.id)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar me-2">
                              {participant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-medium">{participant.name}</div>
                              <div className="text-muted small">{participant.profession}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="demographics small">
                            <span className="me-2">{participant.age}</span>
                            <span className="me-2">•</span>
                            <span className="me-2">{participant.gender}</span>
                            <span className="me-2">•</span>
                            <span>{participant.location}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg={
                            participant.match_score >= 90 ? 'success' :
                            participant.match_score >= 75 ? 'primary' :
                            participant.match_score >= 60 ? 'warning' : 'secondary'
                          }>
                            {participant.match_score}%
                          </Badge>
                        </td>
                        <td>
                          {participant.response_rate}%
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenInviteModal([participant.id])}
                          >
                            <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                            Invite
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-start">
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </>
    );
  };
  
  const renderInviteModal = () => (
    <Modal
      show={inviteModalShow}
      onHide={() => {
        if (!inviteLoading) {
          setInviteModalShow(false);
          setInviteSent(false);
        }
      }}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faEnvelope} className="me-2" />
          Send Survey Invitations
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {inviteSent ? (
          <div className="text-center py-4">
            <div className="success-icon mb-3">
              <FontAwesomeIcon icon={faCheck} className="text-success" size="3x" />
            </div>
            <h4 className="mb-3">Invitations Sent Successfully!</h4>
            <p className="mb-4">
              Your survey invitations have been sent to {inviteData.selectedParticipants.length} participants. 
              You'll be notified as responses come in.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setInviteModalShow(false);
                setInviteSent(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <strong>Selected Participants:</strong> {inviteData.selectedParticipants.length} participants
            </div>
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email Subject:</Form.Label>
                <Form.Control
                  type="text"
                  value={inviteData.subject}
                  onChange={(e) => setInviteData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Email Message:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={inviteData.message}
                  onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                  required
                />
                <Form.Text className="text-muted">
                  Use [SURVEY_LINK] as a placeholder for your survey link.
                </Form.Text>
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      {!inviteSent && (
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setInviteModalShow(false)}
            disabled={inviteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendInvites}
            disabled={inviteLoading || inviteData.selectedParticipants.length === 0}
          >
            {inviteLoading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Sending...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Send Invitations
              </>
            )}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
  
  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Find Survey Participants</h1>
          <p className="text-muted">
            Define your target audience and we'll find the perfect participants for your research.
          </p>
        </Col>
      </Row>
      
      <Row>
        <Col>
          {participants ? renderParticipantResults() : renderParticipantFinderForm()}
        </Col>
      </Row>
      
      {renderInviteModal()}
    </Container>
  );
};

export default ParticipantFinder; 