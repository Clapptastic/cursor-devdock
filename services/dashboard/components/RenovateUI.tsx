import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Dependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  updateType: 'patch' | 'minor' | 'major' | null;
  selected: boolean;
}

interface RenovateUIProps {
  title?: string;
}

interface ConfigOption {
  key: string;
  value: any;
  description: string;
}

const RenovateUI: React.FC<RenovateUIProps> = ({ title = 'Dependency Manager' }) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [detailsLog, setDetailsLog] = useState<string>('');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [config, setConfig] = useState<string>('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([
    { key: 'automerge', value: false, description: 'Automatically merge PRs when tests pass' },
    { key: 'dependencyDashboard', value: true, description: 'Generate a dashboard issue to track updates' },
    { key: 'schedule', value: ['after 10pm', 'before 5am'], description: 'Schedule when Renovate creates PRs' },
    { key: 'labels', value: ['dependencies'], description: 'Labels to add to PRs' },
    { key: 'prConcurrentLimit', value: 5, description: 'Maximum number of concurrent PRs' }
  ]);

  const scanForUpdates = async () => {
    setScanning(true);
    setError('');
    setSuccessMessage('');
    setDetailsLog('');
    setShowDetails(false);
    
    try {
      // Call the renovate API to scan for updates
      const response = await axios.post('/api/renovate', {
        action: 'scan'
      });
      
      if (response.data.success) {
        // Add selected property to each dependency
        const depsWithSelection = response.data.dependencies.map(dep => ({
          ...dep,
          selected: false
        }));
        
        setDependencies(depsWithSelection);
        
        if (depsWithSelection.length === 0) {
          setSuccessMessage('Scan completed successfully. All dependencies are up to date!');
        } else {
          setSuccessMessage(`Scan completed successfully. Found updates for ${depsWithSelection.length} dependencies.`);
        }
      } else {
        throw new Error(response.data.error || 'Failed to scan for updates');
      }
    } catch (err) {
      console.error('Error scanning for updates:', err);
      setError(`Failed to scan for dependency updates: ${err.response?.data?.details || err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const updateDependencies = async () => {
    const selectedDeps = dependencies.filter(dep => dep.selected);
    
    if (selectedDeps.length === 0) {
      setError('Please select at least one dependency to update.');
      return;
    }
    
    setUpdating(true);
    setError('');
    setSuccessMessage('');
    setDetailsLog('');
    setShowDetails(false);
    
    try {
      // Call the renovate API to update dependencies
      const response = await axios.post('/api/renovate', {
        action: 'update',
        dependencies: selectedDeps.map(dep => ({
          name: dep.name,
          version: dep.latestVersion
        }))
      });
      
      if (response.data.success) {
        // Update the dependencies list to show updated versions
        setDependencies(
          dependencies.map(dep => 
            dep.selected 
              ? { ...dep, currentVersion: dep.latestVersion, selected: false } 
              : dep
          )
        );
        
        setSuccessMessage(response.data.message || `Successfully updated ${selectedDeps.length} dependencies.`);
        
        // Store details for log view
        if (response.data.details) {
          const logContent = `STDOUT:\n${response.data.details.stdout || 'No output'}\n\nSTDERR:\n${response.data.details.stderr || 'No errors'}`;
          setDetailsLog(logContent);
        }
      } else {
        throw new Error(response.data.error || 'Failed to update dependencies');
      }
    } catch (err) {
      console.error('Error updating dependencies:', err);
      setError(`Failed to update dependencies: ${err.response?.data?.details || err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const toggleDependency = (index: number) => {
    setDependencies(
      dependencies.map((dep, i) => 
        i === index ? { ...dep, selected: !dep.selected } : dep
      )
    );
  };

  const selectAll = () => {
    setDependencies(
      dependencies.map(dep => ({ ...dep, selected: true }))
    );
  };

  const selectNone = () => {
    setDependencies(
      dependencies.map(dep => ({ ...dep, selected: false }))
    );
  };

  const selectByType = (type: 'patch' | 'minor' | 'major') => {
    setDependencies(
      dependencies.map(dep => ({ 
        ...dep, 
        selected: dep.updateType === type ? true : dep.selected 
      }))
    );
  };

  const filteredDependencies = filter === 'all' 
    ? dependencies 
    : dependencies.filter(dep => dep.updateType === filter);

  const getUpdateTypeBadge = (type: 'patch' | 'minor' | 'major') => {
    switch (type) {
      case 'patch':
        return <span className="update-badge patch">Patch</span>;
      case 'minor':
        return <span className="update-badge minor">Minor</span>;
      case 'major':
        return <span className="update-badge major">Major</span>;
      default:
        return null;
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    setConfigError(null);
    
    try {
      const response = await axios.get('/api/renovate/config');
      if (response.data.success) {
        setConfig(JSON.stringify(response.data.config, null, 2));
      } else {
        setConfigError(response.data.error || 'Failed to fetch configuration');
      }
    } catch (err: any) {
      setConfigError(err.message || 'An error occurred while fetching configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setConfigError(null);
    
    try {
      // Validate JSON
      const parsedConfig = JSON.parse(config);
      
      const response = await axios.post('/api/renovate/config', { 
        config: parsedConfig 
      });
      
      if (response.data.success) {
        setSuccessMessage('Configuration saved successfully');
      } else {
        setConfigError(response.data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setConfigError(err.message || 'Invalid JSON configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleConfigOption = (index: number) => {
    const newOptions = [...configOptions];
    if (typeof newOptions[index].value === 'boolean') {
      newOptions[index].value = !newOptions[index].value;
    }
    setConfigOptions(newOptions);
    
    try {
      // Update config string with new options
      const configObj = JSON.parse(config);
      configObj[newOptions[index].key] = newOptions[index].value;
      setConfig(JSON.stringify(configObj, null, 2));
    } catch (err) {
      // If parsing fails, don't update config
    }
  };

  useEffect(() => {
    if (showConfig && !config) {
      fetchConfig();
    }
  }, [showConfig, config]);

  return (
    <div className="renovate-container">
      <h3 className="renovate-title">{title}</h3>
      
      <div className="renovate-actions">
        <button 
          className="renovate-button scan" 
          onClick={scanForUpdates}
          disabled={scanning || updating}
        >
          {scanning ? 'Scanning...' : 'Scan for Updates'}
        </button>
        
        <button 
          className="renovate-button update" 
          onClick={updateDependencies}
          disabled={scanning || updating || dependencies.length === 0}
        >
          {updating ? 'Updating...' : 'Update Selected'}
        </button>
        
        <button 
          className="renovate-button config"
          onClick={() => setShowConfig(!showConfig)}
          disabled={loading}
        >
          {showConfig ? 'Hide Configuration' : 'Show Configuration'}
        </button>
      </div>

      {error && (
        <div className="renovate-error">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="renovate-success">
          <p>{successMessage}</p>
          {detailsLog && (
            <button 
              className="details-toggle" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
      )}
      
      {showDetails && detailsLog && (
        <div className="details-log">
          <pre>{detailsLog}</pre>
        </div>
      )}
      
      {showConfig && (
        <div className="config-section">
          <h3>Renovate Configuration</h3>
          
          {configError && <div className="error-message">{configError}</div>}
          
          <div className="config-options">
            <h4>Quick Configuration</h4>
            <div className="options-grid">
              {configOptions.map((option, index) => (
                <div key={option.key} className="option-item">
                  <label>
                    {typeof option.value === 'boolean' ? (
                      <input 
                        type="checkbox" 
                        checked={option.value} 
                        onChange={() => toggleConfigOption(index)}
                      />
                    ) : null}
                    <span>{option.key}</span>
                  </label>
                  <p className="option-description">{option.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="config-editor">
            <h4>JSON Configuration</h4>
            <textarea 
              value={config} 
              onChange={(e) => setConfig(e.target.value)} 
              rows={10} 
              disabled={loading}
            />
            <div className="config-buttons">
              <button onClick={fetchConfig} disabled={loading}>
                Refresh
              </button>
              <button onClick={saveConfig} disabled={loading}>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
      
      {dependencies.length > 0 && (
        <>
          <div className="renovate-filters">
            <div className="filter-buttons">
              <button 
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${filter === 'patch' ? 'active' : ''}`}
                onClick={() => setFilter('patch')}
              >
                Patch
              </button>
              <button 
                className={`filter-button ${filter === 'minor' ? 'active' : ''}`}
                onClick={() => setFilter('minor')}
              >
                Minor
              </button>
              <button 
                className={`filter-button ${filter === 'major' ? 'active' : ''}`}
                onClick={() => setFilter('major')}
              >
                Major
              </button>
            </div>
            
            <div className="selection-buttons">
              <button className="selection-button" onClick={selectAll}>Select All</button>
              <button className="selection-button" onClick={selectNone}>Deselect All</button>
              <button className="selection-button" onClick={() => selectByType('patch')}>Select Patch</button>
              <button className="selection-button" onClick={() => selectByType('minor')}>Select Minor</button>
            </div>
          </div>

          <div className="renovate-table">
            <div className="table-header">
              <div className="col-checkbox"></div>
              <div className="col-name">Package</div>
              <div className="col-version">Current</div>
              <div className="col-version">Latest</div>
              <div className="col-type">Type</div>
            </div>
            
            <div className="table-body">
              {filteredDependencies.length === 0 ? (
                <div className="table-empty">No dependencies match the selected filter.</div>
              ) : (
                filteredDependencies.map((dep, index) => (
                  <div 
                    key={dep.name} 
                    className={`table-row ${dep.selected ? 'selected' : ''}`}
                    onClick={() => toggleDependency(dependencies.indexOf(dep))}
                  >
                    <div className="col-checkbox">
                      <input 
                        type="checkbox" 
                        checked={dep.selected}
                        onChange={() => toggleDependency(dependencies.indexOf(dep))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="col-name">{dep.name}</div>
                    <div className="col-version">{dep.currentVersion}</div>
                    <div className="col-version">{dep.latestVersion}</div>
                    <div className="col-type">
                      {getUpdateTypeBadge(dep.updateType)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .renovate-container {
          margin: 1rem 0;
          padding: 1.5rem;
          border-radius: 0.5rem;
          background-color: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .renovate-title {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a202c;
        }
        
        .renovate-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .renovate-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .renovate-button.scan {
          background-color: #4f46e5;
          color: white;
        }
        
        .renovate-button.scan:hover {
          background-color: #4338ca;
        }
        
        .renovate-button.update {
          background-color: #059669;
          color: white;
        }
        
        .renovate-button.update:hover {
          background-color: #047857;
        }
        
        .renovate-button.config {
          background-color: #7c3aed;
          color: white;
        }
        
        .renovate-button.config:hover {
          background-color: #6d28d9;
        }
        
        .renovate-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        .renovate-error {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
          color: #b91c1c;
        }
        
        .renovate-success {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background-color: #d1fae5;
          border-left: 4px solid #10b981;
          color: #047857;
        }
        
        .details-toggle {
          background: none;
          border: none;
          color: #047857;
          text-decoration: underline;
          cursor: pointer;
          padding: 0.25rem 0;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
        
        .details-log {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .details-log pre {
          margin: 0;
          font-family: monospace;
          font-size: 0.875rem;
          white-space: pre-wrap;
        }
        
        .renovate-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .filter-buttons, .selection-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .filter-button, .selection-button {
          padding: 0.375rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          background-color: #f9fafb;
          color: #4b5563;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-button:hover, .selection-button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .filter-button.active {
          background-color: #6366f1;
          color: white;
          border-color: #6366f1;
        }
        
        .renovate-table {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          overflow: hidden;
        }
        
        .table-header {
          display: flex;
          background-color: #f3f4f6;
          font-weight: 600;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .table-header > div {
          padding: 0.75rem 1rem;
        }
        
        .table-row {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .table-row:last-child {
          border-bottom: none;
        }
        
        .table-row:hover {
          background-color: #f9fafb;
        }
        
        .table-row.selected {
          background-color: #eff6ff;
        }
        
        .table-row > div {
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
        }
        
        .col-checkbox {
          width: 40px;
          justify-content: center;
        }
        
        .col-name {
          flex: 1;
          font-weight: 500;
        }
        
        .col-version {
          width: 100px;
          font-family: monospace;
        }
        
        .col-type {
          width: 100px;
        }
        
        .update-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .update-badge.patch {
          background-color: #dcfce7;
          color: #047857;
        }
        
        .update-badge.minor {
          background-color: #ffedd5;
          color: #c2410c;
        }
        
        .update-badge.major {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .table-empty {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
        
        .config-section {
          background-color: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .config-section h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1a1a2e;
        }
        
        .config-section h4 {
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          color: #1a1a2e;
        }
        
        .config-options {
          margin-bottom: 1.5rem;
        }
        
        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }
        
        .option-item {
          padding: 0.75rem;
          background-color: #f8fafc;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        }
        
        .option-item label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }
        
        .option-description {
          margin-top: 0.5rem;
          margin-bottom: 0;
          color: #64748b;
          font-size: 0.875rem;
        }
        
        .config-editor {
          margin-top: 1.5rem;
        }
        
        .config-editor textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          font-family: monospace;
          font-size: 0.875rem;
          resize: vertical;
          margin-bottom: 1rem;
        }
        
        .config-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .config-buttons button {
          background-color: #4b5563;
          color: white;
        }
        
        .config-buttons button:hover:not(:disabled) {
          background-color: #374151;
        }
      `}</style>
    </div>
  );
};

export default RenovateUI; 