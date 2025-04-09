import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const [taskResponses, setTaskResponses] = useState([]);
  const [apiConnections, setApiConnections] = useState([]);
  const [logs, setLogs] = useState([]);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeResult, setScrapeResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Fetch data from services
    const fetchData = async () => {
      try {
        const taskRes = await axios.get('/api/claude-tasks');
        setTaskResponses(taskRes.data);

        const apiRes = await axios.get('/api/connections');
        setApiConnections(apiRes.data);

        const logsRes = await axios.get('/api/browser-logs');
        setLogs(logsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeUrl) return;
    
    setIsLoading(true);
    try {
      const res = await axios.post('/api/scrape', { 
        url: scrapeUrl,
        stealthMode: false 
      });
      setScrapeResult(res.data);
    } catch (error) {
      console.error('Error during scraping:', error);
      setScrapeResult({ error: 'Failed to scrape the URL' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cursor DevDock</h1>
        <nav className={styles.nav}>
          <button 
            className={activeTab === 'dashboard' ? styles.activeTab : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'claude' ? styles.activeTab : ''}
            onClick={() => setActiveTab('claude')}
          >
            Claude Task Master
          </button>
          <button 
            className={activeTab === 'scraper' ? styles.activeTab : ''}
            onClick={() => setActiveTab('scraper')}
          >
            Web Scraper
          </button>
          <button 
            className={activeTab === 'browser' ? styles.activeTab : ''}
            onClick={() => setActiveTab('browser')}
          >
            Browser Tools
          </button>
          <button 
            className={activeTab === 'visualizer' ? styles.activeTab : ''}
            onClick={() => setActiveTab('visualizer')}
          >
            Debug Visualizer
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {activeTab === 'dashboard' && (
          <div className={styles.dashboardGrid}>
            <div className={styles.card}>
              <h2>API Connections</h2>
              <ul className={styles.connectionsList}>
                {apiConnections.map((conn, i) => (
                  <li key={i} className={styles.connectionItem}>
                    <span className={styles.connectionName}>{conn.name}</span>
                    <span className={
                      conn.status === 'connected' ? styles.statusConnected : styles.statusDisconnected
                    }>
                      {conn.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={styles.card}>
              <h2>Recent Tasks</h2>
              <ul className={styles.taskList}>
                {taskResponses.map((task, i) => (
                  <li key={i} className={styles.taskItem}>
                    <div className={styles.taskHeader}>
                      <span className={styles.taskId}>Task #{task.id}</span>
                      <span className={
                        task.status === 'completed' ? styles.statusCompleted : 
                        task.status === 'in_progress' ? styles.statusInProgress :
                        styles.statusPending
                      }>
                        {task.status}
                      </span>
                    </div>
                    <p className={styles.taskDescription}>{task.task}</p>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={styles.card}>
              <h2>Browser Logs</h2>
              <div className={styles.logsContainer}>
                {logs.map((log, i) => (
                  <div key={i} className={styles.logEntry}>
                    <span className={styles.logTimestamp}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={styles.logUrl}>{log.url}</span>
                    <span className={styles.logEvent}>{log.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claude' && (
          <div className={styles.fullFrame}>
            <iframe 
              src="http://localhost:8002" 
              width="100%" 
              height="100%" 
              title="Claude Task Master"
              className={styles.iframe}
            />
          </div>
        )}

        {activeTab === 'scraper' && (
          <div className={styles.card}>
            <h2>Web Scraper</h2>
            <form onSubmit={handleScrape} className={styles.scraperForm}>
              <input
                type="url"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="Enter URL to scrape"
                required
                className={styles.urlInput}
              />
              <button type="submit" disabled={isLoading} className={styles.button}>
                {isLoading ? 'Scraping...' : 'Scrape'}
              </button>
            </form>
            
            {scrapeResult && (
              <div className={styles.scrapeResult}>
                <h3>Results</h3>
                <pre>{JSON.stringify(scrapeResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'browser' && (
          <div className={styles.fullFrame}>
            <iframe 
              src="http://localhost:8004" 
              width="100%" 
              height="100%" 
              title="Browser Tools"
              className={styles.iframe}
            />
          </div>
        )}

        {activeTab === 'visualizer' && (
          <div className={styles.fullFrame}>
            <iframe 
              src="http://localhost:8005/debug-visualizer" 
              width="100%" 
              height="100%" 
              title="Debug Visualizer"
              className={styles.iframe}
            />
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Cursor DevDock - AI-Powered Local Dev Environment</p>
      </footer>
    </div>
  );
};

export default Dashboard; 