import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Head from 'next/head';

interface ConfigOption {
  key: string;
  value: any;
  description: string;
  type: 'boolean' | 'array' | 'number' | 'string' | 'object';
}

export default function RenovateConfigPage() {
  const [config, setConfig] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [presetTemplates, setPresetTemplates] = useState<Record<string, string>>({
    'config:base': JSON.stringify({ extends: ['config:base'] }, null, 2),
    'config:recommended': JSON.stringify({ extends: ['config:recommended'] }, null, 2),
    'github>whitesource/merge-confidence:beta': JSON.stringify({ extends: ['github>whitesource/merge-confidence:beta'] }, null, 2),
    'npm:unpublishSafe': JSON.stringify({ extends: ['npm:unpublishSafe'] }, null, 2),
    'custom': JSON.stringify({
      extends: ['config:base'],
      baseBranches: ['main'],
      schedule: ['after 10pm', 'before 5am'],
      labels: ['dependencies'],
      automerge: false,
      packageRules: [
        {
          matchUpdateTypes: ['minor', 'patch'],
          matchCurrentVersion: '!/^0/',
          automerge: true
        }
      ]
    }, null, 2)
  });

  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([
    { key: 'extends', value: ['config:base'], description: 'Base preset configuration to use', type: 'array' },
    { key: 'automerge', value: false, description: 'Automatically merge PRs when tests pass', type: 'boolean' },
    { key: 'dependencyDashboard', value: true, description: 'Generate a dashboard issue to track updates', type: 'boolean' },
    { key: 'schedule', value: ['after 10pm', 'before 5am'], description: 'Schedule when Renovate creates PRs', type: 'array' },
    { key: 'labels', value: ['dependencies'], description: 'Labels to add to PRs', type: 'array' },
    { key: 'prConcurrentLimit', value: 5, description: 'Maximum number of concurrent PRs', type: 'number' },
    { key: 'prHourlyLimit', value: 2, description: 'Maximum PRs to create per hour', type: 'number' },
    { key: 'rebaseWhen', value: 'auto', description: 'When to rebase branches (auto, never, conflicted)', type: 'string' },
    { key: 'rangeStrategy', value: 'auto', description: 'How to modify version ranges (auto, pin, replace, widen)', type: 'string' },
  ]);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/renovate/config');
      if (response.data.success) {
        setConfig(JSON.stringify(response.data.config, null, 2));
      } else {
        setError(response.data.error || 'Failed to fetch configuration');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Validate JSON
      const parsedConfig = JSON.parse(config);
      
      const response = await axios.post('/api/renovate/config', { 
        config: parsedConfig 
      });
      
      if (response.data.success) {
        setSuccessMessage('Configuration saved successfully');
      } else {
        setError(response.data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setError(err instanceof SyntaxError ? 'Invalid JSON configuration' : err.message);
    } finally {
      setIsLoading(false);
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

  const applyTemplate = (templateKey: string) => {
    setConfig(presetTemplates[templateKey]);
  };

  const updateOptionValue = (index: number, value: any) => {
    const newOptions = [...configOptions];
    newOptions[index].value = value;
    setConfigOptions(newOptions);
    
    try {
      // Update config string with new options
      const configObj = JSON.parse(config);
      configObj[newOptions[index].key] = value;
      setConfig(JSON.stringify(configObj, null, 2));
    } catch (err) {
      // If parsing fails, don't update config
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Renovate Configuration Editor</title>
      </Head>
      
      <header>
        <div className="header-content">
          <h1>Renovate Configuration Editor</h1>
          <div className="header-actions">
            <Link href="/renovate">
              <a className="back-link">← Back to Renovate Dashboard</a>
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <div className="page-content">
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <div className="config-section">
            <div className="config-section-header">
              <h2>Configuration Templates</h2>
              <p>Select a template to start with a predefined configuration</p>
            </div>
            
            <div className="template-buttons">
              {Object.keys(presetTemplates).map(key => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className="template-button"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          
          <div className="config-section">
            <div className="config-section-header">
              <h2>Quick Configuration</h2>
              <p>Common configuration options</p>
            </div>
            
            <div className="options-grid">
              {configOptions.map((option, index) => (
                <div key={option.key} className="option-item">
                  <div className="option-header">
                    <h3>{option.key}</h3>
                    <div className="option-type">{option.type}</div>
                  </div>
                  
                  <p className="option-description">{option.description}</p>
                  
                  <div className="option-control">
                    {option.type === 'boolean' && (
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={option.value} 
                          onChange={() => toggleConfigOption(index)}
                        />
                        <span className="slider round"></span>
                      </label>
                    )}
                    
                    {option.type === 'number' && (
                      <input 
                        type="number" 
                        value={option.value} 
                        onChange={(e) => updateOptionValue(index, parseInt(e.target.value))}
                        className="number-input"
                      />
                    )}
                    
                    {option.type === 'string' && (
                      <input 
                        type="text" 
                        value={option.value} 
                        onChange={(e) => updateOptionValue(index, e.target.value)}
                        className="text-input"
                      />
                    )}
                    
                    {(option.type === 'array' || option.type === 'object') && (
                      <div className="complex-value">
                        {JSON.stringify(option.value)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="config-section">
            <div className="config-section-header">
              <h2>JSON Configuration</h2>
              <p>Edit the raw configuration file</p>
            </div>
            
            <div className="config-editor">
              <textarea 
                value={config} 
                onChange={(e) => setConfig(e.target.value)} 
                rows={20} 
                disabled={isLoading}
              />
              
              <div className="editor-actions">
                <button onClick={fetchConfig} disabled={isLoading} className="secondary-button">
                  Refresh
                </button>
                <button onClick={saveConfig} disabled={isLoading} className="primary-button">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        header {
          background-color: #1a1a2e;
          color: white;
          padding: 1rem 2rem;
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        h1 {
          margin: 0;
          font-size: 1.75rem;
        }
        
        .back-link {
          color: white;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }
        
        .back-link:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        main {
          flex: 1;
          padding: 2rem;
          background-color: #f9fafb;
        }
        
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .error-message {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
        }
        
        .success-message {
          background-color: #dcfce7;
          color: #047857;
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
        }
        
        .config-section {
          background-color: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .config-section-header {
          margin-bottom: 1.5rem;
        }
        
        .config-section-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1a1a2e;
          font-size: 1.5rem;
        }
        
        .config-section-header p {
          margin: 0;
          color: #6b7280;
        }
        
        .template-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .template-button {
          padding: 0.5rem 1rem;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .template-button:hover {
          background-color: #e5e7eb;
          border-color: #9ca3af;
        }
        
        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .option-item {
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        }
        
        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .option-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .option-type {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          background-color: #e0e7ff;
          color: #4f46e5;
        }
        
        .option-description {
          margin-top: 0.5rem;
          margin-bottom: 1rem;
          color: #64748b;
          font-size: 0.875rem;
        }
        
        .option-control {
          display: flex;
          align-items: center;
        }
        
        /* Toggle switch styles */
        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: #3b82f6;
        }
        
        input:focus + .slider {
          box-shadow: 0 0 1px #3b82f6;
        }
        
        input:checked + .slider:before {
          transform: translateX(24px);
        }
        
        .slider.round {
          border-radius: 24px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
        
        .number-input, .text-input {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid #d1d5db;
        }
        
        .complex-value {
          background-color: #f3f4f6;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: nowrap;
        }
        
        .config-editor {
          margin-top: 1rem;
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
        
        .editor-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }
        
        .primary-button, .secondary-button {
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
        }
        
        .primary-button {
          background-color: #3b82f6;
          color: white;
        }
        
        .primary-button:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .secondary-button {
          background-color: #e5e7eb;
          color: #374151;
        }
        
        .secondary-button:hover:not(:disabled) {
          background-color: #d1d5db;
        }
        
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 