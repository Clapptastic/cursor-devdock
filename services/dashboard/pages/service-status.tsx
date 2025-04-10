import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ServiceStatus from '../components/ServiceStatus';

const ServiceStatusPage = () => {
  return (
    <div className="container">
      <Head>
        <title>Service Status - Cursor DevDock</title>
      </Head>

      <div className="header">
        <h1 className="title">MCP Service Status</h1>
        <Link href="/">
          <span className="back-link">Back to Dashboard</span>
        </Link>
      </div>

      <main>
        <div className="status-container">
          <ServiceStatus showDetails={true} />
        </div>

        <div className="info-section">
          <h2>About the Services</h2>
          <p>
            The Cursor DevDock platform consists of multiple microservices that work together to provide 
            development and debugging tools. Each service has a specific purpose and communicates with 
            other services through well-defined APIs.
          </p>

          <div className="service-descriptions">
            <div className="service-item">
              <h3>MCP REST API</h3>
              <p>
                Core API service that handles communication between services and provides a centralized
                entry point for operations. This service orchestrates all other components.
              </p>
            </div>

            <div className="service-item">
              <h3>MCP Konnect</h3>
              <p>
                Service registration and discovery component that maintains a registry of available services 
                and their capabilities. It helps services find and communicate with each other.
              </p>
            </div>

            <div className="service-item">
              <h3>Claude Task Master</h3>
              <p>
                Manages and executes AI tasks with Claude. It handles task queuing, execution, and result storage,
                providing a robust way to work with AI models.
              </p>
            </div>

            <div className="service-item">
              <h3>Dashboard</h3>
              <p>
                The main user interface for the Cursor DevDock platform. It provides access to all services
                and visualizes data in a user-friendly format.
              </p>
            </div>

            <div className="service-item">
              <h3>Browser Tools</h3>
              <p>
                Monitors browser activity and captures logs, errors, and network requests. It helps
                debug web applications by providing insights into browser behavior.
              </p>
            </div>

            <div className="service-item">
              <h3>Debug Visualizer</h3>
              <p>
                Visualizes complex data structures for easier debugging. It supports various visualization
                formats including tree, graph, and JSON views.
              </p>
            </div>

            <div className="service-item">
              <h3>Scraper</h3>
              <p>
                Web scraping service that extracts data from websites. It supports both regular and stealth
                modes to handle various scraping scenarios.
              </p>
            </div>

            <div className="service-item">
              <h3>Kaneo</h3>
              <p>
                Administration dashboard for managing MCP services. It provides configuration options,
                monitoring, and service management capabilities.
              </p>
            </div>
          </div>
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
        
        .back-link {
          padding: 0.5rem 1rem;
          background-color: #f3f4f6;
          border-radius: 0.25rem;
          color: #4b5563;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .back-link:hover {
          background-color: #e5e7eb;
        }
        
        .status-container {
          margin-bottom: 2rem;
        }
        
        .info-section {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-section h2 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1a1a2e;
        }
        
        .service-descriptions {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .service-item {
          padding: 1rem;
          border-radius: 0.25rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        
        .service-item h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        
        .service-item p {
          margin: 0;
          color: #4b5563;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default ServiceStatusPage; 