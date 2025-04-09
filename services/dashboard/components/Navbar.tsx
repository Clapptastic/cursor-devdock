import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar: React.FC = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/service-status', label: 'Service Status' },
    { path: '/docs', label: 'Documentation' },
    { path: '/renovate', label: 'Dependency Manager' },
  ];
  
  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link href="/">
            <a>Cursor DevDock</a>
          </Link>
        </div>
        
        <button 
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger"></span>
        </button>
        
        <div className={`navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path}>
              <a className={isActive(link.path) ? 'active' : ''}>{link.label}</a>
            </Link>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .navbar {
          background-color: #1a1a2e;
          color: white;
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }
        
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
        }
        
        .navbar-logo a {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }
        
        .navbar-links {
          display: flex;
          gap: 1.5rem;
        }
        
        .navbar-links a {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.2s ease;
          padding: 0.25rem 0;
        }
        
        .navbar-links a:hover {
          color: white;
        }
        
        .navbar-links a.active {
          color: white;
          font-weight: 600;
          border-bottom: 2px solid #10b981;
        }
        
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        .hamburger {
          display: block;
          position: relative;
          width: 24px;
          height: 2px;
          background-color: white;
        }
        
        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 2px;
          background-color: white;
          transition: transform 0.3s ease;
        }
        
        .hamburger::before {
          top: -8px;
        }
        
        .hamburger::after {
          bottom: -8px;
        }
        
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block;
          }
          
          .navbar-links {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            background-color: #1a1a2e;
            padding: 1rem 2rem;
            display: none;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          .navbar-links.open {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 