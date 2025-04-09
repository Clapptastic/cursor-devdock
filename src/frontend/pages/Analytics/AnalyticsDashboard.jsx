import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    // Fetch survey data
    // This is a placeholder and should be replaced with actual data fetching logic
    setSurvey({ title: 'Sample Survey' });
    setId(1); // Placeholder ID
  }, []);

  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h1 className="mb-0">Analytics: {survey?.title}</h1>
      <div>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate(`/surveys/${id}/view`)}
          className="me-2"
        >
          <FontAwesomeIcon icon={faEye} className="me-2" />
          View Survey
        </Button>
        <Button 
          variant="primary" 
          onClick={() => navigate(`/surveys/${id}/report`)}
        >
          <FontAwesomeIcon icon={faFileAlt} className="me-2" />
          Generate Report
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 