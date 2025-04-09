import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { FaChartBar, FaUsers, FaRocket, FaLightbulb, FaCheckCircle, FaEnvelope } from 'react-icons/fa';

const HomePage = () => {
  const location = useLocation();

  // Handle smooth scrolling for anchor links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          // Add slight delay to ensure UI is ready
          setTimeout(() => {
            window.scrollTo({
              top: element.offsetTop - 100, // Adjust for header height
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    };

    handleHashChange();
  }, [location]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section text-center">
        <Container>
          <Row className="justify-content-center align-items-center">
            <Col lg={8} md={10}>
              <div className="hero-content slide-up">
                <h1 className="hero-title mb-4">Get Actionable Customer Insights Faster</h1>
                <p className="hero-subtitle mb-5">
                  Discover what your customers really think with AI-powered surveys
                  that deliver meaningful data to drive your business forward.
                </p>
                <div className="hero-buttons">
                  <Link to="/auth" className="btn btn-primary btn-lg me-3 mb-3 mb-md-0">
                    Get Started Free
                  </Link>
                  <Link to="/auth" className="btn btn-outline-primary btn-lg">
                    See Demo
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
          <Row className="mt-5">
            <Col>
              <div className="hero-image-container">
                <img 
                  src="/images/dashboard-preview.png" 
                  alt="Customer Survey Dashboard Preview" 
                  className="hero-image img-fluid shadow-lg rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/1200x600?text=Customer+Survey+Dashboard';
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features-section" className="features-section section-container bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title mx-auto">Powerful Features to Understand Your Customers</h2>
              <p className="section-subtitle">
                Everything you need to create, distribute, and analyze customer surveys in one place
              </p>
            </Col>
          </Row>
          <Row className="g-4 mb-5">
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="feature-icon-wrapper mb-3">
                    <FaRocket className="feature-icon text-primary" />
                  </div>
                  <h3 className="feature-title h5 mb-3">AI-Powered Survey Creation</h3>
                  <p className="feature-text">
                    Create professional surveys in seconds with our AI assistant that helps you craft
                    the perfect questions for your audience.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="feature-icon-wrapper mb-3">
                    <FaUsers className="feature-icon text-primary" />
                  </div>
                  <h3 className="feature-title h5 mb-3">Audience Targeting</h3>
                  <p className="feature-text">
                    Reach the right people with smart distribution tools. Find participants that match
                    your exact customer profile.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="feature-icon-wrapper mb-3">
                    <FaChartBar className="feature-icon text-primary" />
                  </div>
                  <h3 className="feature-title h5 mb-3">Real-time Analytics</h3>
                  <p className="feature-text">
                    Watch responses come in real-time and get automatic insights with visual reports
                    and actionable recommendations.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="feature-icon-wrapper mb-3">
                    <FaLightbulb className="feature-icon text-primary" />
                  </div>
                  <h3 className="feature-title h5 mb-3">Smart Insights</h3>
                  <p className="feature-text">
                    Our AI analyzes your survey data to uncover hidden patterns and opportunities that
                    you might have missed.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="feature-icon-wrapper mb-3">
                    <FaCheckCircle className="feature-icon text-primary" />
                  </div>
                  <h3 className="feature-title h5 mb-3">Easy Integration</h3>
                  <p className="feature-text">
                    Connect with your favorite tools through our API or use our ready-made integrations
                    with popular platforms.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="feature-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="feature-icon-wrapper mb-3">
                    <FaEnvelope className="feature-icon text-primary" />
                  </div>
                  <h3 className="feature-title h5 mb-3">Automated Follow-ups</h3>
                  <p className="feature-text">
                    Set triggered emails based on survey responses to engage further with your customers
                    at just the right moment.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="how-it-works-section section-container">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title mx-auto">How It Works</h2>
              <p className="section-subtitle">
                Get valuable customer insights in just three simple steps
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={4}>
              <div className="step-card text-center">
                <div className="step-number">1</div>
                <h3 className="step-title h5 mb-3">Create Your Survey</h3>
                <p className="step-text">
                  Use our AI-powered survey builder to create professional surveys in minutes or customize
                  templates for your specific needs.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="step-card text-center">
                <div className="step-number">2</div>
                <h3 className="step-title h5 mb-3">Distribute to Participants</h3>
                <p className="step-text">
                  Share your survey via custom link, email, social media, or find matching participants
                  through our platform.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="step-card text-center">
                <div className="step-number">3</div>
                <h3 className="step-title h5 mb-3">Analyze Results</h3>
                <p className="step-text">
                  Get real-time analytics, visual reports, and AI-powered insights to make data-driven
                  decisions for your business.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials-section" className="testimonials-section section-container bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title mx-auto">What Our Customers Say</h2>
              <p className="section-subtitle">
                Join thousands of businesses making better decisions with our platform
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <Card className="testimonial-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="testimonial-rating mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-warning">★</span>
                    ))}
                  </div>
                  <p className="testimonial-text mb-4">
                    "The AI-powered survey creator saved us hours of work. We got insights we never would
                    have discovered on our own. It's completely changed how we interact with customers."
                  </p>
                  <div className="testimonial-author d-flex align-items-center">
                    <div className="testimonial-avatar me-3">
                      <div className="avatar-placeholder rounded-circle bg-primary text-white">JD</div>
                    </div>
                    <div>
                      <h5 className="testimonial-name mb-0">Jane Doe</h5>
                      <p className="testimonial-title mb-0 text-muted">Product Manager, TechCorp</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="testimonial-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="testimonial-rating mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-warning">★</span>
                    ))}
                  </div>
                  <p className="testimonial-text mb-4">
                    "The analytics dashboard made it so easy to understand our customer data. We identified
                    key pain points and improved our product in just a few weeks."
                  </p>
                  <div className="testimonial-author d-flex align-items-center">
                    <div className="testimonial-avatar me-3">
                      <div className="avatar-placeholder rounded-circle bg-primary text-white">MT</div>
                    </div>
                    <div>
                      <h5 className="testimonial-name mb-0">Michael Thompson</h5>
                      <p className="testimonial-title mb-0 text-muted">CEO, StartupX</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="testimonial-card h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="testimonial-rating mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-warning">★</span>
                    ))}
                  </div>
                  <p className="testimonial-text mb-4">
                    "Finding the right participants was always our biggest challenge. With the participant
                    finder, we got responses from exactly the customers we needed to hear from."
                  </p>
                  <div className="testimonial-author d-flex align-items-center">
                    <div className="testimonial-avatar me-3">
                      <div className="avatar-placeholder rounded-circle bg-primary text-white">SJ</div>
                    </div>
                    <div>
                      <h5 className="testimonial-name mb-0">Sarah Johnson</h5>
                      <p className="testimonial-title mb-0 text-muted">Marketing Director, GrowthCo</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section section-container">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="cta-card bg-primary text-white text-center p-5 rounded-lg">
                <h2 className="cta-title mb-4">Ready to Understand Your Customers Better?</h2>
                <p className="cta-text mb-4">
                  Start creating your first survey today and get insights that drive growth
                </p>
                <Link to="/auth" className="btn btn-light btn-lg px-5">
                  Start For Free
                </Link>
                <p className="mt-3 mb-0 small">No credit card required. Free plan available.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomePage; 