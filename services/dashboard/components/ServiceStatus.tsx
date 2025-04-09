import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ServiceStatusProps {
  showDetails?: boolean;
}

interface Service {
  name: string;
  url: string;
  status: string;
}

interface ErrorLog {
  timestamp: string;
  message: string;
  service: string;
  level: string;
}

const ServiceStatus: React.FC<ServiceStatusProps> = ({ showDetails = false }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ErrorLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/services');
        
        if (response.data && Array.isArray(response.data)) {
          setServices(response.data);
          setError('');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError('Failed to check service status');
        console.error('Error checking services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Poll service status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchServiceLogs = async (service: Service) => {
    try {
      setLogsLoading(true);
      setLogsError('');
      
      // Normalize service name for API endpoint
      const serviceName = service.name.toLowerCase().replace(/\s+/g, '-');
      
      const response = await axios.get(`/api/logs/${serviceName}`);
      
      if (response.data && Array.isArray(response.data)) {
        setServiceLogs(response.data);
      } else {
        setServiceLogs([]);
      }
    } catch (err) {
      setLogsError('Failed to fetch service logs');
      console.error('Error fetching logs:', err);
      setServiceLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleServiceClick = async (service: Service) => {
    // Only fetch logs for unavailable services
    if (service.status !== 'available') {
      setSelectedService(service);
      await fetchServiceLogs(service);
      setShowLogsModal(true);
    }
  };

  const closeLogsModal = () => {
    setShowLogsModal(false);
    setSelectedService(null);
    setServiceLogs([]);
  };

  if (loading && services.length === 0) {
    return <div className="service-status-indicator loading">Checking services...</div>;
  }

  if (error) {
    return <div className="service-status-indicator error">Service check failed</div>;
  }

  const allAvailable = services.every(service => service.status === 'available');

  if (!showDetails) {
    return (
      <div className={`service-status-indicator ${allAvailable ? 'available' : 'unavailable'}`}>
        {allAvailable ? 'All services connected' : 'Some services unavailable'}
      </div>
    );
  }

  return (
    <div className="service-status-container">
      <h3>MCP Service Status</h3>
      <div className="service-grid">
        {services.map((service) => (
          <div 
            key={service.name} 
            className={`service-card ${service.status === 'available' ? 'available' : 'unavailable'}`}
            onClick={() => handleServiceClick(service)}
            style={{ cursor: service.status === 'available' ? 'default' : 'pointer' }}
          >
            <div className="service-name">{service.name}</div>
            <div className="service-status">{service.status}</div>
            <div className="service-url">
              {service.status === 'available' ? (
                <a 
                  href={service.url.replace(/http:\/\/[^:]+/, 'http://localhost')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="service-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {service.url}
                </a>
              ) : (
                service.url
              )}
            </div>
            {service.status !== 'available' && (
              <div className="service-error-hint">Click to view error logs</div>
            )}
          </div>
        ))}
      </div>

      {/* Logs Modal */}
      {showLogsModal && selectedService && (
        <div className="logs-modal-overlay">
          <div className="logs-modal">
            <div className="logs-modal-header">
              <h3>{selectedService.name} Error Logs</h3>
              <button className="close-button" onClick={closeLogsModal}>×</button>
            </div>
            <div className="logs-modal-content">
              {logsLoading ? (
                <div className="logs-loading">Loading logs...</div>
              ) : logsError ? (
                <div className="logs-error">{logsError}</div>
              ) : serviceLogs.length === 0 ? (
                <div className="no-logs">No error logs available for this service.</div>
              ) : (
                <div className="logs-list">
                  {serviceLogs.map((log, index) => (
                    <div key={index} className={`log-entry log-${log.level || 'error'}`}>
                      <div className="log-timestamp">{log.timestamp}</div>
                      <div className="log-message">{log.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="logs-modal-footer">
              <button className="refresh-button" 
                onClick={() => fetchServiceLogs(selectedService)} 
                disabled={logsLoading}
              >
                Refresh Logs
              </button>
              <button className="close-button-text" onClick={closeLogsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .service-status-container {
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 0.5rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        
        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .service-card {
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }
        
        .service-card.available {
          background-color: #d1fae5;
          border-color: #065f46;
        }
        
        .service-card.unavailable {
          background-color: #fee2e2;
          border-color: #b91c1c;
        }
        
        .service-card.unavailable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .service-name {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .service-status {
          text-transform: uppercase;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .service-url {
          font-size: 0.75rem;
          color: #4b5563;
          word-break: break-all;
        }
        
        .service-link {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .service-link:hover {
          color: #1d4ed8;
        }
        
        .service-error-hint {
          font-size: 0.75rem;
          font-style: italic;
          margin-top: 0.5rem;
          color: #991b1b;
        }
        
        .service-status-indicator {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .service-status-indicator.available {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .service-status-indicator.unavailable {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .service-status-indicator.loading {
          background-color: #f3f4f6;
          color: #4b5563;
        }
        
        .service-status-indicator.error {
          background-color: #fecaca;
          color: #991b1b;
        }
        
        /* Modal Styles */
        .logs-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .logs-modal {
          background-color: white;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .logs-modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logs-modal-header h3 {
          margin: 0;
          color: #111827;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }
        
        .logs-modal-content {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
        }
        
        .logs-modal-footer {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        
        .logs-loading {
          text-align: center;
          color: #6b7280;
          padding: 2rem 0;
        }
        
        .logs-error {
          color: #b91c1c;
          text-align: center;
          padding: 1rem;
          background-color: #fee2e2;
          border-radius: 0.25rem;
        }
        
        .no-logs {
          text-align: center;
          color: #6b7280;
          padding: 2rem 0;
        }
        
        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .log-entry {
          padding: 0.75rem;
          border-radius: 0.25rem;
          background-color: #f3f4f6;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        .log-error {
          background-color: #fee2e2;
          border-left: 4px solid #b91c1c;
        }
        
        .log-warn {
          background-color: #fef3c7;
          border-left: 4px solid #d97706;
        }
        
        .log-info {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
        }
        
        .log-timestamp {
          color: #6b7280;
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }
        
        .log-message {
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .refresh-button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .refresh-button:hover {
          background-color: #1d4ed8;
        }
        
        .refresh-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        .close-button-text {
          background: none;
          border: none;
          color: #6b7280;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .close-button-text:hover {
          color: #111827;
        }
      `}</style>
    </div>
  );
};

export default ServiceStatus; 