import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RenovateUI from '../components/RenovateUI';

const RenovatePage: React.FC = () => {
  return (
    <div className="container">
      <Head>
        <title>Dependency Manager - MCP Dashboard</title>
        <meta name="description" content="Manage and update dependencies with Renovate" />
      </Head>

      <div className="header">
        <h1 className="title">Dependency Manager</h1>
        <Link href="/">
          <span className="back-link">Back to Dashboard</span>
        </Link>
      </div>

      <main>
        <div className="content-section">
          <div className="intro-text">
            <h2>Keep Your Dependencies Up to Date</h2>
            <p>
              Renovate helps you keep your project dependencies updated automatically. 
              This interface allows you to manage dependency updates with fine-grained control.
            </p>
            <div className="info-box">
              <h3>Update Types</h3>
              <ul>
                <li><span className="badge patch">Patch</span> - Bug fixes and minor improvements that don't change the API</li>
                <li><span className="badge minor">Minor</span> - New features that don't break existing functionality</li>
                <li><span className="badge major">Major</span> - Breaking changes that may require code modifications</li>
              </ul>
            </div>
          </div>

          <div className="renovate-wrapper">
            <RenovateUI title="Project Dependencies" />
          </div>

          <div className="renovate-docs">
            <h3>Additional Options</h3>
            <p>For advanced Renovate configuration, you can:</p>
            <ul>
              <li>Create a <code>renovate.json</code> file at the root of your project</li>
              <li>Configure package rules for specific dependencies</li>
              <li>Set up automated PRs for your repository</li>
              <li>Schedule updates during specific time windows</li>
            </ul>
            <a href="https://docs.renovatebot.com/" target="_blank" rel="noopener noreferrer" className="doc-link">
              Read the full Renovate documentation
            </a>
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
        
        .content-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .intro-text {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .intro-text h2 {
          margin-top: 0;
          color: #1a1a2e;
        }
        
        .info-box {
          margin-top: 1.5rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        }
        
        .info-box h3 {
          margin-top: 0;
          font-size: 1.125rem;
          color: #1a1a2e;
        }
        
        .info-box ul {
          list-style-type: none;
          padding-left: 0;
        }
        
        .info-box li {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .badge.patch {
          background-color: #dcfce7;
          color: #047857;
        }
        
        .badge.minor {
          background-color: #ffedd5;
          color: #c2410c;
        }
        
        .badge.major {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .renovate-docs {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .renovate-docs h3 {
          margin-top: 0;
          color: #1a1a2e;
        }
        
        .renovate-docs ul {
          margin-bottom: 1.5rem;
        }
        
        .renovate-docs li {
          margin-bottom: 0.5rem;
        }
        
        .renovate-docs code {
          background-color: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        .doc-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          background-color: #4f46e5;
          color: white;
          border-radius: 0.25rem;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .doc-link:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
};

export default RenovatePage; 