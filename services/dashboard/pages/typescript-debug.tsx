import React, { useState, useEffect } from 'react';
import styles from '../styles/TypeScriptDebug.module.css';
import axios from 'axios';

const TypeScriptDebug = () => {
  const [project, setProject] = useState('');
  const [fileContents, setFileContents] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDebug = async () => {
    if (!project || !fileContents) {
      setError('Please provide both project path and file contents');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // This would connect to an actual TypeScript SDK server
      // For now, we're simulating the response
      
      // Simulated response from TypeScript SDK
      const response = {
        data: {
          diagnostics: [
            {
              code: 2322,
              message: "Type 'string' is not assignable to type 'number'",
              line: 5,
              character: 10,
              file: 'example.ts'
            },
            {
              code: 2345,
              message: "Argument of type 'string' is not assignable to parameter of type 'boolean'",
              line: 8,
              character: 15,
              file: 'example.ts'
            }
          ],
          typeInfo: {
            name: 'ExampleInterface',
            properties: [
              { name: 'id', type: 'number', required: true },
              { name: 'name', type: 'string', required: true },
              { name: 'active', type: 'boolean', required: false }
            ]
          }
        }
      };
      
      setDebugInfo(response.data);
    } catch (err) {
      setError('Failed to get TypeScript debug information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>TypeScript Debug</h1>
      
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="project">Project Path</label>
          <input
            id="project"
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Enter project path"
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="fileContents">File Contents</label>
          <textarea
            id="fileContents"
            value={fileContents}
            onChange={(e) => setFileContents(e.target.value)}
            placeholder="Paste TypeScript code here"
            className={styles.textarea}
          />
        </div>
        
        <button 
          onClick={handleDebug}
          disabled={loading}
          className={styles.button}
        >
          {loading ? 'Analyzing...' : 'Analyze TypeScript'}
        </button>
        
        {error && <div className={styles.error}>{error}</div>}
      </div>
      
      {debugInfo && (
        <div className={styles.results}>
          <h2>Analysis Results</h2>
          
          <div className={styles.section}>
            <h3>Diagnostics</h3>
            {debugInfo.diagnostics.length > 0 ? (
              <ul className={styles.list}>
                {debugInfo.diagnostics.map((diagnostic, index) => (
                  <li key={index} className={styles.diagnostic}>
                    <div className={styles.diagnosticHeader}>
                      <span className={styles.code}>TS{diagnostic.code}</span>
                      <span className={styles.location}>
                        {diagnostic.file}:{diagnostic.line}:{diagnostic.character}
                      </span>
                    </div>
                    <div className={styles.message}>{diagnostic.message}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No diagnostics found.</p>
            )}
          </div>
          
          <div className={styles.section}>
            <h3>Type Information</h3>
            {debugInfo.typeInfo ? (
              <div className={styles.typeInfo}>
                <div className={styles.typeName}>{debugInfo.typeInfo.name}</div>
                <table className={styles.typeTable}>
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Type</th>
                      <th>Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.typeInfo.properties.map((prop, index) => (
                      <tr key={index}>
                        <td>{prop.name}</td>
                        <td>{prop.type}</td>
                        <td>{prop.required ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No type information available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeScriptDebug; 