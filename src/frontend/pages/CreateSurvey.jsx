import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faArrowRight, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';

// Components
import IndustrySelector from '../components/survey/IndustrySelector';
import BusinessStageSelector from '../components/survey/BusinessStageSelector';
import CustomerSegmentSelector from '../components/survey/CustomerSegmentSelector';
import AssumptionsInput from '../components/survey/AssumptionsInput';
import PersonaBuilder from '../components/survey/PersonaBuilder';
import QuestionFocusSelector from '../components/survey/QuestionFocusSelector';

// Supabase Client
import { supabase } from '../utils/supabaseClient';

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const totalSteps = 7;
  
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    industry: '',
    businessStage: '',
    customerSegment: [],
    assumptions: [],
    persona: {
      age: '',
      gender: '',
      occupation: '',
      painPoints: [],
      goals: [],
      preferences: []
    },
    questionFocus: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSurveyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComplexChange = (field, value) => {
    setSurveyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    setStep(prevStep => prevStep + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(prevStep => prevStep - 1);
    window.scrollTo(0, 0);
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return surveyData.title.length > 0 && surveyData.description.length > 0;
      case 2:
        return surveyData.industry && surveyData.businessStage;
      case 3:
        return surveyData.customerSegment.length > 0;
      case 4:
        return surveyData.assumptions.length > 0;
      case 5:
        return (
          surveyData.persona.age &&
          surveyData.persona.occupation &&
          surveyData.persona.painPoints.length > 0 &&
          surveyData.persona.goals.length > 0
        );
      case 6:
        return surveyData.questionFocus.length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await supabase.auth.getUser();
      
      if (!user.data?.user) {
        throw new Error('You must be logged in to create a survey');
      }
      
      // First, create the template in Supabase
      const { data: template, error: templateError } = await supabase
        .from('survey_templates')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          industry: surveyData.industry,
          business_stage: surveyData.businessStage,
          customer_segment: surveyData.customerSegment,
          assumptions: surveyData.assumptions,
          persona: surveyData.persona,
          question_focus: surveyData.questionFocus,
          owner_id: user.data.user.id,
          status: 'active'
        })
        .select()
        .single();
      
      if (templateError) throw templateError;
      
      // Then, create an AI-generated survey based on the template
      const { data: generatedSurvey, error: surveyError } = await supabase.functions.invoke('generate-survey', {
        body: { templateId: template.id }
      });
      
      if (surveyError) throw surveyError;
      
      // Create the actual survey in Supabase
      const { data: survey, error: createError } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          template_id: template.id,
          owner_id: user.data.user.id,
          questions: generatedSurvey.questions,
          settings: {
            allowAnonymous: true,
            requireEmail: false,
            showProgressBar: true,
            allowSave: false
          },
          status: 'draft'
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Navigate to edit page with the new survey ID
      navigate(`/surveys/${survey.id}/edit`);
    } catch (err) {
      console.error('Error creating survey:', err);
      setError(err.message || 'Failed to create survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h3>Let's Create Your Survey</h3>
            <p className="text-muted mb-4">
              Start by giving your survey a name and brief description
            </p>
            
            <Form.Group className="mb-3">
              <Form.Label>Survey Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={surveyData.title}
                onChange={handleInputChange}
                placeholder="e.g., Product Market Fit Survey for [Your Product]"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={surveyData.description}
                onChange={handleInputChange}
                placeholder="Briefly describe the purpose of this survey..."
              />
            </Form.Group>
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <h3>Tell Us About Your Business</h3>
            <p className="text-muted mb-4">
              This information helps us generate relevant questions
            </p>
            
            <IndustrySelector
              value={surveyData.industry}
              onChange={(value) => handleComplexChange('industry', value)}
            />
            
            <BusinessStageSelector
              value={surveyData.businessStage}
              onChange={(value) => handleComplexChange('businessStage', value)}
            />
          </div>
        );
      
      case 3:
        return (
          <div className="step-content">
            <h3>Define Your Target Audience</h3>
            <p className="text-muted mb-4">
              Select the customer segments you want to target
            </p>
            
            <CustomerSegmentSelector
              selected={surveyData.customerSegment}
              onChange={(value) => handleComplexChange('customerSegment', value)}
            />
          </div>
        );
      
      case 4:
        return (
          <div className="step-content">
            <h3>What Assumptions Do You Want to Validate?</h3>
            <p className="text-muted mb-4">
              List the key hypotheses or assumptions you want to test
            </p>
            
            <AssumptionsInput
              assumptions={surveyData.assumptions}
              onChange={(value) => handleComplexChange('assumptions', value)}
            />
          </div>
        );
      
      case 5:
        return (
          <div className="step-content">
            <h3>Build Your Customer Persona</h3>
            <p className="text-muted mb-4">
              Define the ideal customer you want to interview or survey
            </p>
            
            <PersonaBuilder
              persona={surveyData.persona}
              onChange={(value) => handleComplexChange('persona', value)}
            />
          </div>
        );

      case 6:
        return (
          <div className="step-content">
            <h3>What Do You Want to Learn?</h3>
            <p className="text-muted mb-4">
              Select focus areas for your survey questions
            </p>
            
            <QuestionFocusSelector
              selected={surveyData.questionFocus}
              onChange={(value) => handleComplexChange('questionFocus', value)}
            />
          </div>
        );
      
      case 7:
        return (
          <div className="step-content">
            <h3>Review Your Information</h3>
            <p className="text-muted mb-4">
              We'll use this to generate your survey template
            </p>
            
            <div className="review-container">
              <div className="review-section">
                <h5>Basic Information</h5>
                <p><strong>Title:</strong> {surveyData.title}</p>
                <p><strong>Description:</strong> {surveyData.description}</p>
              </div>
              
              <div className="review-section">
                <h5>Business Details</h5>
                <p><strong>Industry:</strong> {surveyData.industry}</p>
                <p><strong>Business Stage:</strong> {surveyData.businessStage}</p>
              </div>
              
              <div className="review-section">
                <h5>Target Audience</h5>
                <p><strong>Customer Segments:</strong></p>
                <ul>
                  {surveyData.customerSegment.map((segment, index) => (
                    <li key={index}>{segment}</li>
                  ))}
                </ul>
              </div>
              
              <div className="review-section">
                <h5>Assumptions to Validate</h5>
                <ul>
                  {surveyData.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
                  ))}
                </ul>
              </div>
              
              <div className="review-section">
                <h5>Customer Persona</h5>
                <p><strong>Age:</strong> {surveyData.persona.age}</p>
                <p><strong>Gender:</strong> {surveyData.persona.gender || 'Not specified'}</p>
                <p><strong>Occupation:</strong> {surveyData.persona.occupation}</p>
                
                <p><strong>Pain Points:</strong></p>
                <ul>
                  {surveyData.persona.painPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
                
                <p><strong>Goals:</strong></p>
                <ul>
                  {surveyData.persona.goals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
                
                {surveyData.persona.preferences.length > 0 && (
                  <>
                    <p><strong>Preferences:</strong></p>
                    <ul>
                      {surveyData.persona.preferences.map((pref, index) => (
                        <li key={index}>{pref}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              
              <div className="review-section">
                <h5>Question Focus Areas</h5>
                <ul>
                  {surveyData.questionFocus.map((focus, index) => (
                    <li key={index}>
                      {focus.startsWith('custom_') 
                        ? focus.replace('custom_', '').replace(/_/g, ' ') 
                        : focus.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {/* Progress bar */}
              <div className="mb-4">
                <ProgressBar 
                  now={(step / totalSteps) * 100} 
                  className="mb-2" 
                  variant="primary"
                />
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Step {step} of {totalSteps}</span>
                  <span className="text-muted small">{Math.round((step / totalSteps) * 100)}% Complete</span>
                </div>
              </div>
              
              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              )}
              
              {renderStepContent()}
              
              <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                {step > 1 ? (
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back
                  </Button>
                ) : (
                  <div></div> // Empty div to maintain spacing
                )}
                
                {step < totalSteps ? (
                  <Button 
                    variant="primary" 
                    onClick={handleNext}
                    disabled={!validateStep() || isLoading}
                  >
                    Continue
                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Generating Survey...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faMagic} className="me-2" />
                        Generate Survey
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {step === totalSteps && (
            <div className="text-center mt-4">
              <p className="text-muted">
                <FontAwesomeIcon icon={faMagic} className="me-2 text-primary" />
                Our AI will generate survey questions based on your inputs.
                You'll be able to edit them afterward.
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CreateSurvey; 