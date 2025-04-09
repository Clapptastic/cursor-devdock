import React, { useEffect, useState } from 'react';
import styles from '../styles/Kaneo.module.css';

const KaneoPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set a timeout to simulate loading and check if the iframe loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Kaneo Dashboard</h1>
      <p className={styles.description}>
        Kaneo is a powerful dashboard for managing and visualizing your AI tasks and workflows.
      </p>
      
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading Kaneo...</p>
        </div>
      )}
      
      <div className={styles.iframeContainer} style={{ display: isLoading ? 'none' : 'block' }}>
        <iframe 
          src="http://localhost:3333" 
          className={styles.iframe}
          title="Kaneo Dashboard"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default KaneoPage; 