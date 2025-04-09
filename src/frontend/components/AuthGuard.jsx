import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { getSession } from '../utils/supabaseClient';

/**
 * AuthGuard component to protect routes that require authentication
 * Redirects unauthenticated users to the login page
 */
const AuthGuard = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return (
      <Navigate 
        to="/auth" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  return children;
};

export default AuthGuard; 