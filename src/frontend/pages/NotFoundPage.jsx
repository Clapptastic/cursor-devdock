import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSearch } from '@fortawesome/free-solid-svg-icons';

const NotFoundPage = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="error-page">
            <h1 className="display-1 fw-bold text-primary">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            
            <p className="text-muted mb-5">
              The page you are looking for doesn't exist or has been moved.
              Please check the URL or navigate back to the dashboard.
            </p>
            
            <div className="d-flex justify-content-center gap-3">
              <Button 
                as={Link} 
                to="/" 
                variant="primary"
                className="d-inline-flex align-items-center"
              >
                <FontAwesomeIcon icon={faHome} className="me-2" />
                Back to Dashboard
              </Button>
              
              <Button 
                as={Link} 
                to="/help" 
                variant="outline-secondary"
                className="d-inline-flex align-items-center"
              >
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Search Help
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage; 