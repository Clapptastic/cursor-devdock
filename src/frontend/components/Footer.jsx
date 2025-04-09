import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-light py-4 mt-5">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start">
              <img 
                src="/logo.svg" 
                alt="Survey Platform Logo" 
                height="24" 
                className="me-2" 
              />
              <span className="fw-bold">Customer Survey Platform</span>
            </div>
            <div className="text-muted small mt-2">
              &copy; {currentYear} All rights reserved
            </div>
          </Col>
          
          <Col md={4} className="text-center mb-3 mb-md-0">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <Link to="/about" className="text-decoration-none text-muted">About</Link>
              </li>
              <li className="list-inline-item mx-3">
                <Link to="/privacy" className="text-decoration-none text-muted">Privacy</Link>
              </li>
              <li className="list-inline-item">
                <Link to="/terms" className="text-decoration-none text-muted">Terms</Link>
              </li>
            </ul>
          </Col>
          
          <Col md={4} className="text-center text-md-end">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted"
                  aria-label="Twitter"
                >
                  <FontAwesomeIcon icon={faTwitter} size="lg" />
                </a>
              </li>
              <li className="list-inline-item ms-3">
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted"
                  aria-label="LinkedIn"
                >
                  <FontAwesomeIcon icon={faLinkedin} size="lg" />
                </a>
              </li>
              <li className="list-inline-item ms-3">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted"
                  aria-label="GitHub"
                >
                  <FontAwesomeIcon icon={faGithub} size="lg" />
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 