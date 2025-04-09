import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog, faQuestionCircle, faChartBar, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, signOut } from '../utils/supabaseClient';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [location.pathname]); // Re-fetch when route changes

  // Handle navbar transparency effect on homepage
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if current page is the auth page
  const isAuthPage = location.pathname.startsWith('/auth');
  
  // Check if current page is a public survey page
  const isPublicSurveyPage = location.pathname.startsWith('/s/');
  
  // Check if current page is homepage
  const isHomePage = location.pathname === '/';
  
  // Determine navbar styling based on scroll and current page
  const navbarClass = `${scrolled || !isHomePage ? 'bg-white shadow-sm' : 'bg-transparent'} navbar-transition`;

  return (
    <Navbar expand="lg" className={navbarClass} sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img 
            src="/logo.svg" 
            alt="Survey Platform Logo" 
            height="30" 
            className="me-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/30x30?text=SP';
            }}
          />
          <span>Customer Survey Platform</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        
        <Navbar.Collapse id="navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link 
                  as={Link} 
                  to="/dashboard" 
                  active={location.pathname === '/dashboard'}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/surveys/create" 
                  active={location.pathname === '/surveys/create'}
                >
                  Create Survey
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/participants" 
                  active={location.pathname === '/participants'}
                >
                  Find Participants
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/interview-generator" 
                  active={location.pathname === '/interview-generator'}
                >
                  Interview Questions
                </Nav.Link>
                
                <Dropdown as={Nav.Item}>
                  <Dropdown.Toggle as={Nav.Link} id="analytics-dropdown">
                    Analytics & Reports
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/dashboard" active={location.pathname.includes('/analytics')}>
                      <FontAwesomeIcon icon={faChartBar} className="me-2" />
                      Analytics Dashboard
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/dashboard" active={location.pathname.includes('/report')}>
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Generate Reports
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
              
              <Nav>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-secondary" id="user-dropdown" className="d-flex align-items-center">
                    <div className="avatar me-2">
                      {user.user_metadata?.full_name ? (
                        user.user_metadata.full_name.charAt(0)
                      ) : (
                        user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="d-none d-md-inline">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="user-dropdown">
                    <div className="user-dropdown-header">
                      <small className="text-muted">Signed in as</small>
                      <p className="mb-0 text-truncate" style={{maxWidth: '200px'}}>
                        {user.email}
                      </p>
                    </div>
                    <div className="user-dropdown-body">
                      <Link to="/profile" className="user-dropdown-item">
                        <FontAwesomeIcon icon={faUser} className="user-dropdown-icon" /> 
                        Profile
                      </Link>
                      <Link to="/settings" className="user-dropdown-item">
                        <FontAwesomeIcon icon={faCog} className="user-dropdown-icon" /> 
                        Settings
                      </Link>
                      <Link to="/help" className="user-dropdown-item">
                        <FontAwesomeIcon icon={faQuestionCircle} className="user-dropdown-icon" /> 
                        Help & Support
                      </Link>
                      <hr className="my-2" />
                      <div className="user-dropdown-item cursor-pointer" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} className="user-dropdown-icon" /> 
                        Logout
                      </div>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </>
          ) : (
            <>
              {/* Only show nav links on public pages */}
              {(isPublicSurveyPage || !isAuthPage) && (
                <>
                  <Nav className="me-auto">
                    {isHomePage ? (
                      <>
                        <Nav.Link href="#features-section">Features</Nav.Link>
                        <Nav.Link href="#how-it-works-section">How It Works</Nav.Link>
                        <Nav.Link href="#testimonials-section">Testimonials</Nav.Link>
                      </>
                    ) : (
                      <>
                        <Nav.Link as={Link} to="/#features-section">Features</Nav.Link>
                        <Nav.Link as={Link} to="/#how-it-works-section">How It Works</Nav.Link>
                        <Nav.Link as={Link} to="/#testimonials-section">Testimonials</Nav.Link>
                      </>
                    )}
                  </Nav>
                  
                  <Nav>
                    {!isAuthPage && (
                      <Button 
                        variant="outline-primary" 
                        className="me-2"
                        onClick={() => navigate('/auth')}
                      >
                        Login
                      </Button>
                    )}
                    
                    {!isAuthPage && (
                      <Button 
                        variant="primary"
                        onClick={() => navigate('/auth', { state: { register: true } })}
                      >
                        Sign Up
                      </Button>
                    )}
                  </Nav>
                </>
              )}
            </>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar; 