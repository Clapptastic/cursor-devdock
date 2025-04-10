import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { 
  getBrowserLogs, 
  getConsoleErrors, 
  getNetworkErrors, 
  getNetworkLogs,
  reportBrowserLog,
  reportConsoleError,
  reportNetworkError,
  reportNetworkLog
} from '../lib/api';
import ServiceStatus from '../components/ServiceStatus';

const BrowserTools = () => {
  const [activeTab, setActiveTab] = useState('browser-logs');
  const [logs, setLogs] = useState({
    browserLogs: [],
    consoleErrors: [],
    networkErrors: [],
    networkLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionCheckLoading, setExtensionCheckLoading] = useState(true);

  // Test data form
  const [testData, setTestData] = useState({
    type: 'browserLog',
    url: 'https://example.com',
    event: 'page-view',
    message: 'Test error message',
    status: 404,
    statusText: 'Not Found',
    method: 'GET',
    duration: 250,
    size: 1024
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [browserLogsRes, consoleErrorsRes, networkErrorsRes, networkLogsRes] = await Promise.all([
        getBrowserLogs(),
        getConsoleErrors(),
        getNetworkErrors(),
        getNetworkLogs()
      ]);

      setLogs({
        browserLogs: Array.isArray(browserLogsRes.data) ? browserLogsRes.data : [],
        consoleErrors: Array.isArray(consoleErrorsRes.data) ? consoleErrorsRes.data : [],
        networkErrors: Array.isArray(networkErrorsRes.data) ? networkErrorsRes.data : [],
        networkLogs: Array.isArray(networkLogsRes.data) ? networkLogsRes.data : []
      });
      setError('');
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Poll for log updates every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    
    // Check if the extension is installed
    const checkExtension = () => {
      try {
        // Send a message to the extension to check if it's installed
        if (window.chrome && window.chrome.runtime) {
          window.chrome.runtime.sendMessage(
            'devdock-browser-monitor-extension-id', // This ID would be your actual extension ID
            { action: 'checkConnection' },
            function(response) {
              if (response && response.connected) {
                setExtensionInstalled(true);
              } else {
                setExtensionInstalled(false);
              }
              setExtensionCheckLoading(false);
            }
          );
        } else {
          setExtensionInstalled(false);
          setExtensionCheckLoading(false);
        }
      } catch (err) {
        console.error('Error checking extension:', err);
        setExtensionInstalled(false);
        setExtensionCheckLoading(false);
      }
    };

    checkExtension();
    const extensionCheckInterval = setInterval(checkExtension, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(extensionCheckInterval);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestData({
      ...testData,
      [name]: value
    });
  };

  const handleSubmitTestData = async (e) => {
    e.preventDefault();
    
    try {
      if (testData.type === 'browserLog') {
        await reportBrowserLog(testData.url, testData.event, { testDetails: true });
      } else if (testData.type === 'consoleError') {
        await reportConsoleError(testData.url, testData.message, 'Test stack trace');
      } else if (testData.type === 'networkError') {
        await reportNetworkError(testData.url, testData.status, testData.statusText, testData.method);
      } else if (testData.type === 'networkLog') {
        await reportNetworkLog(testData.url, testData.method, testData.status, testData.duration, testData.size);
      }
      
      // Fetch updated logs after submitting test data
      fetchLogs();
    } catch (error) {
      console.error('Error submitting test data:', error);
      setError('Failed to submit test data');
    }
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  const handleInstallExtension = () => {
    // This would be the URL to your extension in the Chrome Web Store
    window.open('https://chrome.google.com/webstore/detail/devdock-browser-monitor/extension-id', '_blank');
  };

  return (
    <div className="container">
      <Head>
        <title>Browser Tools - MCP Dashboard</title>
      </Head>

      <h1 className="title">Browser Monitoring Tools</h1>
      
      <ServiceStatus showDetails={false} />

      <div className="extension-prompt">
        <div className="extension-card">
          <div className="extension-header">
            <h3>Browser Extension</h3>
            {extensionCheckLoading ? (
              <div className="extension-status loading">Checking...</div>
            ) : extensionInstalled ? (
              <div className="extension-status connected">Connected</div>
            ) : (
              <div className="extension-status disconnected">Not Installed</div>
            )}
          </div>
          <p>
            The Browser Monitoring Tool requires a Chrome extension to capture logs, errors, and network activity from your browser.
          </p>
          {!extensionInstalled && (
            <button 
              className="extension-install-btn" 
              onClick={handleInstallExtension}
            >
              Install Chrome Extension
            </button>
          )}
          {extensionInstalled && (
            <p className="extension-success">
              Extension is installed and connected! Browser activity is now being monitored.
            </p>
          )}
        </div>
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'browser-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('browser-logs')}
        >
          Browser Logs
        </div>
        <div
          className={`tab ${activeTab === 'console-errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('console-errors')}
        >
          Console Errors
        </div>
        <div
          className={`tab ${activeTab === 'network-errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('network-errors')}
        >
          Network Errors
        </div>
        <div
          className={`tab ${activeTab === 'network-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('network-logs')}
        >
          Network Logs
        </div>
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            {activeTab === 'browser-logs' && (
              <div className="logs-container">
                {logs.browserLogs.length === 0 ? (
                  <div className="empty-state">No browser logs found</div>
                ) : (
                  logs.browserLogs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <div className="log-header">
                        <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                        <span className="log-url">{log.url}</span>
                        <span className="log-event">{log.event}</span>
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <pre className="log-details">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'console-errors' && (
              <div className="logs-container">
                {logs.consoleErrors.length === 0 ? (
                  <div className="empty-state">No console errors found</div>
                ) : (
                  logs.consoleErrors.map((error, index) => (
                    <div key={index} className="log-entry error-entry">
                      <div className="log-header">
                        <span className="log-timestamp">{formatTimestamp(error.timestamp)}</span>
                        <span className="log-url">{error.url}</span>
                      </div>
                      <div className="error-message">{error.message}</div>
                      {error.stack && (
                        <pre className="stack-trace">{error.stack}</pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'network-errors' && (
              <div className="logs-container">
                {logs.networkErrors.length === 0 ? (
                  <div className="empty-state">No network errors found</div>
                ) : (
                  logs.networkErrors.map((error, index) => (
                    <div key={index} className="log-entry error-entry">
                      <div className="log-header">
                        <span className="log-timestamp">{formatTimestamp(error.timestamp)}</span>
                        <span className="log-method">{error.method || 'GET'}</span>
                        <span className="log-url">{error.url}</span>
                      </div>
                      <div className="status-code error">
                        {error.status} {error.statusText}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'network-logs' && (
              <div className="logs-container">
                {logs.networkLogs.length === 0 ? (
                  <div className="empty-state">No network logs found</div>
                ) : (
                  logs.networkLogs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <div className="log-header">
                        <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                        <span className="log-method">{log.method || 'GET'}</span>
                        <span className="log-url">{log.url}</span>
                      </div>
                      <div className="log-stats">
                        <span className={`status-code ${log.status >= 400 ? 'error' : log.status >= 300 ? 'warning' : 'success'}`}>
                          {log.status || 200}
                        </span>
                        <span className="duration">{log.duration}ms</span>
                        <span className="size">{formatSize(log.size)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="test-panel">
        <h3>Send Test Data</h3>
        <form onSubmit={handleSubmitTestData}>
          <div className="form-group">
            <label>Type:</label>
            <select name="type" value={testData.type} onChange={handleInputChange}>
              <option value="browserLog">Browser Log</option>
              <option value="consoleError">Console Error</option>
              <option value="networkError">Network Error</option>
              <option value="networkLog">Network Log</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>URL:</label>
            <input 
              type="text" 
              name="url" 
              value={testData.url} 
              onChange={handleInputChange} 
              placeholder="https://example.com"
            />
          </div>
          
          {(testData.type === 'browserLog') && (
            <div className="form-group">
              <label>Event:</label>
              <input 
                type="text" 
                name="event" 
                value={testData.event} 
                onChange={handleInputChange} 
                placeholder="page-view"
              />
            </div>
          )}
          
          {(testData.type === 'consoleError') && (
            <div className="form-group">
              <label>Error Message:</label>
              <input 
                type="text" 
                name="message" 
                value={testData.message} 
                onChange={handleInputChange} 
                placeholder="Error message"
              />
            </div>
          )}
          
          {(testData.type === 'networkError' || testData.type === 'networkLog') && (
            <>
              <div className="form-group">
                <label>HTTP Method:</label>
                <select name="method" value={testData.method} onChange={handleInputChange}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Status Code:</label>
                <input 
                  type="number" 
                  name="status" 
                  value={testData.status} 
                  onChange={handleInputChange}
                />
              </div>
              
              {testData.type === 'networkError' && (
                <div className="form-group">
                  <label>Status Text:</label>
                  <input 
                    type="text" 
                    name="statusText" 
                    value={testData.statusText} 
                    onChange={handleInputChange} 
                    placeholder="Not Found"
                  />
                </div>
              )}
              
              {testData.type === 'networkLog' && (
                <>
                  <div className="form-group">
                    <label>Duration (ms):</label>
                    <input 
                      type="number" 
                      name="duration" 
                      value={testData.duration} 
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Size (bytes):</label>
                    <input 
                      type="number" 
                      name="size" 
                      value={testData.size} 
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <button type="submit" className="submit-btn">
            Send Test Data
          </button>
        </form>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .title {
          margin-bottom: 1.5rem;
          color: #1a1a2e;
        }
        
        .tabs {
          display: flex;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .tab {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          border: 1px solid transparent;
          border-bottom: none;
          margin-right: 0.5rem;
          border-top-left-radius: 0.25rem;
          border-top-right-radius: 0.25rem;
          background-color: #f3f4f6;
        }
        
        .tab.active {
          background-color: white;
          border-color: #e5e7eb;
          margin-bottom: -1px;
          font-weight: 500;
        }
        
        .tab-content {
          margin-bottom: 2rem;
        }
        
        .logs-container {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .log-entry {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .log-entry:last-child {
          border-bottom: none;
        }
        
        .error-entry {
          background-color: rgba(254, 226, 226, 0.3);
        }
        
        .log-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .log-timestamp {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .log-url {
          color: #4b5563;
          word-break: break-all;
        }
        
        .log-event {
          font-weight: 500;
        }
        
        .log-method {
          font-family: monospace;
          font-weight: bold;
        }
        
        .log-details, .stack-trace {
          background-color: #f9fafb;
          padding: 0.75rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
          white-space: pre-wrap;
          margin-top: 0.5rem;
        }
        
        .error-message {
          color: #b91c1c;
          font-weight: 500;
        }
        
        .log-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .status-code {
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .status-code.success {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-code.warning {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .status-code.error {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .duration, .size {
          color: #4b5563;
          font-size: 0.875rem;
        }
        
        .loading, .error, .empty-state {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
        
        .error {
          color: #b91c1c;
        }
        
        .test-panel {
          margin-top: 2rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background-color: #f9fafb;
        }
        
        .test-panel h3 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          background-color: white;
        }
        
        .submit-btn {
          padding: 0.5rem 1rem;
          background-color: #1a1a2e;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
        }
        
        .submit-btn:hover {
          background-color: #0f0f1a;
        }
        
        .extension-prompt {
          margin-bottom: 20px;
        }
        
        .extension-card {
          background-color: #ffffff;
          border-radius: 6px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }
        
        .extension-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .extension-header h3 {
          margin: 0;
          color: #4a6cf7;
        }
        
        .extension-status {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .extension-status:before {
          content: '';
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 6px;
        }
        
        .extension-status.connected {
          color: #28a745;
        }
        
        .extension-status.connected:before {
          background-color: #28a745;
        }
        
        .extension-status.disconnected {
          color: #dc3545;
        }
        
        .extension-status.disconnected:before {
          background-color: #dc3545;
        }
        
        .extension-status.loading {
          color: #ffc107;
        }
        
        .extension-status.loading:before {
          background-color: #ffc107;
        }
        
        .extension-install-btn {
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .extension-install-btn:hover {
          background-color: #3a5bd7;
        }
        
        .extension-success {
          color: #28a745;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default BrowserTools; 