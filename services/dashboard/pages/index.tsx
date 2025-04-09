import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { checkAllServices } from '../lib/api';
import ServiceStatus from '../components/ServiceStatus';

// Component for service status badge
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
      {status}
    </span>
  );
};

// Service card component
const ServiceCard = ({ title, description, path, status, linkText = 'Open', docsPath = null }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        <div className="mt-4 flex space-x-3">
          <Link href={path}>
            <a className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 ${status === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {linkText}
            </a>
          </Link>
          {docsPath && (
            <Link href={docsPath}>
              <a className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Documentation
              </a>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const serviceStatus = await checkAllServices();
        setServices(serviceStatus);
      } catch (error) {
        console.error('Error fetching service status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Cursor DevDock Dashboard</title>
      </Head>

      <div className="header">
        <h1 className="title">Cursor DevDock Dashboard</h1>
        <div className="status-container">
          <ServiceStatus />
        </div>
      </div>

      <main>
        <div className="service-grid">
          <Link href="/browser-tools">
            <div className={`service-card ${services.find(s => s.name === 'Browser Tools')?.status === 'available' ? 'available' : 'unavailable'}`}>
              <h2>Browser Tools</h2>
              <p>Monitor and debug browser behavior with real-time logs for console events, network requests, and more.</p>
              <div className="service-actions">
                <span className="view-button">View Dashboard</span>
              </div>
            </div>
          </Link>

          <Link href="/debug-visualizer">
            <div className={`service-card ${services.find(s => s.name === 'Debug Visualizer')?.status === 'available' ? 'available' : 'unavailable'}`}>
              <h2>Debug Visualizer</h2>
              <p>Visualize complex data structures and debug information in an interactive format.</p>
              <div className="service-actions">
                <span className="view-button">View Visualizer</span>
              </div>
            </div>
          </Link>

          <Link href="/scraper">
            <div className={`service-card ${services.find(s => s.name === 'Scraper')?.status === 'available' ? 'available' : 'unavailable'}`}>
              <h2>Web Scraper</h2>
              <p>Extract and parse data from websites with configurable selectors and stealth mode.</p>
              <div className="service-actions">
                <span className="view-button">Open Scraper</span>
              </div>
            </div>
          </Link>

          <Link href="/claude-tasks">
            <div className={`service-card ${services.find(s => s.name === 'Claude Task Master')?.status === 'available' ? 'available' : 'unavailable'}`}>
              <h2>Claude Task Master</h2>
              <p>AI-powered task-management system to break down complex projects into manageable tasks with dependencies.</p>
              <div className="service-actions">
                <span className="view-button">View Tasks</span>
                <Link href="/docs">
                  <a className="docs-button">Documentation</a>
                </Link>
              </div>
            </div>
          </Link>

          <Link href="/kaneo">
            <div className={`service-card ${services.find(s => s.name === 'Kaneo')?.status === 'available' ? 'available' : 'unavailable'}`}>
              <h2>Kaneo Dashboard</h2>
              <p>Centralized control panel for managing MCP services and configurations.</p>
              <div className="service-actions">
                <span className="view-button">Open Kaneo</span>
              </div>
            </div>
          </Link>

          <Link href="/service-status">
            <div className="service-card status-card">
              <h2>Service Status</h2>
              <p>View detailed status information for all MCP services and components.</p>
              <div className="service-actions">
                <span className="view-button">Check Status</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="service-grid" style={{marginTop: '1.5rem'}}>
          <Link href="/docs">
            <div className="service-card documentation-card">
              <h2>Documentation</h2>
              <p>Access comprehensive documentation for Claude Task Master and other DevDock services.</p>
              <div className="service-actions">
                <span className="view-button">View Documentation</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="integration-section">
          <h2>Integrating with Your Application</h2>
          <p>
            Cursor DevDock is designed to be integrated with your application using the SDK.
            Install the SDK in your project and connect to these services programmatically.
          </p>
          
          <div className="code-example">
            <pre>
              <code>
{`// Install the SDK
npm install cursor-devdock-sdk --save-dev

// In your application
const { CursorDevDockSDK } = require('cursor-devdock-sdk');

// Initialize the SDK
const devdock = new CursorDevDockSDK({
  projectName: 'Your Project Name',
  projectPath: __dirname
});

// Start the SDK
await devdock.init();

// Use services
const browserTools = devdock.getService('browserTools');
await browserTools.captureEvent({
  type: 'log',
  timestamp: new Date().toISOString(),
  source: 'app.js',
  data: { message: 'Application started' }
});`}
              </code>
            </pre>
          </div>
          
          <p>For more details, check the <a href="https://github.com/clapptastic/cursor-devdock-sdk" target="_blank" rel="noopener noreferrer">SDK documentation</a>.</p>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .title {
          margin: 0;
          color: #1a1a2e;
          font-size: 2rem;
        }
        
        .status-container {
          display: flex;
          align-items: center;
        }
        
        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .service-card {
          padding: 1.5rem;
          border-radius: 0.5rem;
          background-color: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .service-card.available::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: #10b981;
        }
        
        .service-card.unavailable::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: #ef4444;
        }
        
        .service-card h2 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        
        .service-card p {
          color: #4b5563;
          margin-bottom: 1.5rem;
        }
        
        .service-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        .view-button {
          padding: 0.5rem 1rem;
          background-color: #1a1a2e;
          color: white;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }
        
        .view-button:hover {
          background-color: #0f0f1a;
        }
        
        .status-card {
          background-color: #f8fafc;
        }
        
        .integration-section {
          margin-top: 3rem;
          padding: 2rem;
          background-color: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }
        
        .integration-section h2 {
          margin-top: 0;
          color: #1a1a2e;
          margin-bottom: 1rem;
        }
        
        .code-example {
          margin: 1.5rem 0;
          background-color: #1a1a2e;
          border-radius: 0.5rem;
          overflow: auto;
        }
        
        .code-example pre {
          padding: 1.5rem;
          margin: 0;
        }
        
        .code-example code {
          color: #e5e7eb;
          font-family: monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          white-space: pre;
        }
        
        .integration-section a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        
        .integration-section a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 