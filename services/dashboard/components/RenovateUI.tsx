import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Dependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  updateType: 'patch' | 'minor' | 'major';
  selected: boolean;
}

interface RenovateUIProps {
  title?: string;
}

const RenovateUI: React.FC<RenovateUIProps> = ({ title = 'Dependency Manager' }) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');

  const scanForUpdates = async () => {
    setScanning(true);
    setError('');
    setSuccessMessage('');
    
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
        setSuccessMessage(`Scan completed successfully. Found updates for ${depsWithSelection.length} dependencies.`);
      } else {
        throw new Error(response.data.error || 'Failed to scan for updates');
      }
    } catch (err) {
      console.error('Error scanning for updates:', err);
      setError('Failed to scan for dependency updates. Please try again.');
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
    
    try {
      // Call the renovate API to update dependencies
      const response = await axios.post('/api/renovate', {
        action: 'update',
        dependencies: selectedDeps.map(dep => dep.name)
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
      } else {
        throw new Error(response.data.error || 'Failed to update dependencies');
      }
    } catch (err) {
      console.error('Error updating dependencies:', err);
      setError('Failed to update dependencies. Please try again.');
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
      </div>

      {error && <div className="renovate-error">{error}</div>}
      {successMessage && <div className="renovate-success">{successMessage}</div>}
      
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
      `}</style>
    </div>
  );
};

export default RenovateUI; 