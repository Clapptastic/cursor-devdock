import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { checkAllServices } from '../lib/api';
import ServiceStatus from '../components/ServiceStatus';

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
              <p>Manage and monitor AI tasks with queue management and result tracking.</p>
              <div className="service-actions">
                <span className="view-button">View Tasks</span>
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
      `}</style>
    </div>
  );
};

export default Dashboard; 