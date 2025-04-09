import React, { useState } from 'react';
import styles from '../styles/Visualizer.module.css';

const DebugVisualizer = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [visualizationType, setVisualizationType] = useState('json');
  const [visualizationData, setVisualizationData] = useState(null);
  const [error, setError] = useState('');

  const handleVisualize = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      setVisualizationData(parsedData);
      setError('');
    } catch (err) {
      setError('Invalid JSON format');
      setVisualizationData(null);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Debug Visualizer</h1>
      
      <div className={styles.inputSection}>
        <div className={styles.controls}>
          <select 
            value={visualizationType} 
            onChange={(e) => setVisualizationType(e.target.value)}
            className={styles.select}
          >
            <option value="json">JSON</option>
            <option value="tree">Tree</option>
            <option value="graph">Graph</option>
          </select>
          
          <button 
            onClick={handleVisualize}
            className={styles.visualizeButton}
          >
            Visualize
          </button>
        </div>
        
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your JSON data here..."
          className={styles.jsonInput}
        />
        
        {error && <div className={styles.error}>{error}</div>}
      </div>
      
      <div className={styles.visualizationContainer}>
        {visualizationData && (
          visualizationType === 'json' ? (
            <pre className={styles.jsonVisualization}>
              {JSON.stringify(visualizationData, null, 2)}
            </pre>
          ) : visualizationType === 'tree' ? (
            <div className={styles.treeVisualization}>
              <ul className={styles.treeRoot}>
                <TreeNode node={visualizationData} name="root" />
              </ul>
            </div>
          ) : (
            <div className={styles.graphVisualization}>
              <p>Graph visualization is not yet implemented</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Helper component for tree visualization
const TreeNode = ({ node, name }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (node === null) {
    return <li>{name}: null</li>;
  }
  
  if (typeof node !== 'object') {
    return <li>{name}: {String(node)}</li>;
  }
  
  const isArray = Array.isArray(node);
  const isEmpty = Object.keys(node).length === 0;
  
  return (
    <li>
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
        {name} {isExpanded ? '▼' : '►'} {isArray ? '[...]' : '{...}'}
      </div>
      
      {isExpanded && !isEmpty && (
        <ul>
          {Object.entries(node).map(([key, value]) => (
            <TreeNode key={key} node={value} name={key} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default DebugVisualizer; 