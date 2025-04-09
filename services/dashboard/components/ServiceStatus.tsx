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

const ServiceStatus: React.FC<ServiceStatusProps> = ({ showDetails = false }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                >
                  {service.url}
                </a>
              ) : (
                service.url
              )}
            </div>
          </div>
        ))}
      </div>
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
        }
        
        .service-card.available {
          background-color: #d1fae5;
          border-color: #065f46;
        }
        
        .service-card.unavailable {
          background-color: #fee2e2;
          border-color: #b91c1c;
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
      `}</style>
    </div>
  );
};

export default ServiceStatus; 