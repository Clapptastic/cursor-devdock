/**
 * Browser Tools connector for monitoring web applications
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../utils/logger';
import type { CursorDevDockSDK } from '../index';
import type { SDKOptions, BrowserEvent } from '../types';

/**
 * Browser Tools Connector for web application monitoring
 */
export class BrowserToolsConnector {
  private sdk: CursorDevDockSDK;
  private options: SDKOptions;
  private logger: Logger;
  private baseUrl: string;
  private isInitialized: boolean;
  
  /**
   * Creates a new Browser Tools connector
   * @param sdk SDK instance
   * @param options SDK options
   */
  constructor(sdk: CursorDevDockSDK, options: SDKOptions) {
    this.sdk = sdk;
    this.options = options;
    this.logger = new Logger(options.logLevel);
    this.baseUrl = options.serviceEndpoints.browserTools;
    this.isInitialized = false;
  }
  
  /**
   * Initializes the Browser Tools connector
   * @returns Whether initialization was successful
   */
  async init(): Promise<boolean> {
    try {
      this.logger.debug('Initializing Browser Tools connector');
      
      // Check if the service is available
      await this.checkServiceAvailability();
      
      // Register with the service
      await this.register();
      
      // Add instrumentation to the project
      await this.addInstrumentation();
      
      this.isInitialized = true;
      this.logger.info('Browser Tools connector initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Browser Tools connector:', error);
      return false;
    }
  }
  
  /**
   * Captures a browser event and sends it to the Browser Tools service
   * @param eventData Event data
   */
  async captureEvent(eventData: BrowserEvent): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Browser Tools connector not initialized');
      return;
    }
    
    try {
      await axios.post(`${this.baseUrl}/api/logs`, eventData);
      this.logger.debug(`Captured ${eventData.type} event`);
    } catch (error) {
      this.logger.error('Failed to capture event:', error);
    }
  }
  
  /**
   * Takes a screenshot of the current page
   * @param selector Optional CSS selector to screenshot a specific element
   * @returns Base64-encoded screenshot image or null if failed
   */
  async takeScreenshot(selector?: string): Promise<string | null> {
    if (!this.isInitialized) {
      this.logger.warn('Browser Tools connector not initialized');
      return null;
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/screenshot`, { selector });
      
      if (response.status === 200 && response.data.image) {
        this.logger.debug('Screenshot captured successfully');
        return response.data.image;
      } else {
        throw new Error('Failed to capture screenshot');
      }
    } catch (error) {
      this.logger.error('Failed to take screenshot:', error);
      return null;
    }
  }
  
  /**
   * Clears all logs from the Browser Tools service
   */
  async clearLogs(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Browser Tools connector not initialized');
      return;
    }
    
    try {
      await axios.delete(`${this.baseUrl}/api/logs`);
      this.logger.debug('Cleared all logs');
    } catch (error) {
      this.logger.error('Failed to clear logs:', error);
    }
  }
  
  /**
   * Gets all logs from the Browser Tools service
   * @param type Optional log type to filter by
   * @returns Array of logs or null if failed
   */
  async getLogs(type?: 'log' | 'error' | 'network' | 'performance'): Promise<BrowserEvent[] | null> {
    if (!this.isInitialized) {
      this.logger.warn('Browser Tools connector not initialized');
      return null;
    }
    
    try {
      const url = type 
        ? `${this.baseUrl}/api/logs?type=${type}` 
        : `${this.baseUrl}/api/logs`;
      
      const response = await axios.get(url);
      
      if (response.status === 200) {
        this.logger.debug(`Retrieved ${response.data.length} logs`);
        return response.data;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to get logs:', error);
      return null;
    }
  }
  
  /**
   * Shuts down the Browser Tools connector
   */
  async shutdown(): Promise<void> {
    this.logger.debug('Shutting down Browser Tools connector');
    this.isInitialized = false;
  }
  
  /**
   * Checks if the Browser Tools service is available
   * @private
   */
  private async checkServiceAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      this.logger.debug('Browser Tools service is available');
    } catch (error) {
      this.logger.error('Browser Tools service is not available:', error);
      throw new Error('Browser Tools service is not available');
    }
  }
  
  /**
   * Registers with the Browser Tools service
   * @private
   */
  private async register(): Promise<void> {
    try {
      const projectInfo = this.sdk.getProjectInfo();
      
      if (!projectInfo) {
        throw new Error('Project information not available');
      }
      
      const response = await axios.post(`${this.baseUrl}/api/register`, {
        projectName: projectInfo.name,
        projectPath: projectInfo.projectPath
      });
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      this.logger.debug('Registered with Browser Tools service');
    } catch (error) {
      this.logger.error('Failed to register with Browser Tools service:', error);
      throw error;
    }
  }
  
  /**
   * Adds instrumentation to the project
   * @private
   */
  private async addInstrumentation(): Promise<void> {
    const projectInfo = this.sdk.getProjectInfo();
    
    if (!projectInfo) {
      throw new Error('Project information not available');
    }
    
    // Determine where to add instrumentation based on project type
    if (
      projectInfo.frameworks.includes('react') || 
      projectInfo.frameworks.includes('vue') || 
      projectInfo.frameworks.includes('angular') ||
      projectInfo.frameworks.includes('next')
    ) {
      await this.addWebInstrumentation(projectInfo.projectPath);
    }
  }
  
  /**
   * Adds instrumentation to a web project
   * @param projectPath Project path
   * @private
   */
  private async addWebInstrumentation(projectPath: string): Promise<void> {
    try {
      // Create a browser-tools.js file in the project
      const instrumentationCode = `
// DevDock Browser Tools Integration
(function() {
  const BROWSER_TOOLS_URL = '${this.baseUrl}';
  
  // Helper to send logs to Browser Tools
  function sendLog(type, data) {
    try {
      fetch(BROWSER_TOOLS_URL + '/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          timestamp: new Date().toISOString(),
          data
        })
      }).catch(e => console.warn('DevDock Browser Tools:', e));
    } catch (e) {
      // Silently fail if there's an error sending logs
    }
  }
  
  // Capture console logs
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };
  
  console.log = function(...args) {
    sendLog('log', { level: 'log', message: args.map(arg => String(arg)).join(' ') });
    return originalConsole.log.apply(console, args);
  };
  
  console.warn = function(...args) {
    sendLog('log', { level: 'warn', message: args.map(arg => String(arg)).join(' ') });
    return originalConsole.warn.apply(console, args);
  };
  
  console.error = function(...args) {
    sendLog('error', { message: args.map(arg => String(arg)).join(' ') });
    return originalConsole.error.apply(console, args);
  };
  
  console.info = function(...args) {
    sendLog('log', { level: 'info', message: args.map(arg => String(arg)).join(' ') });
    return originalConsole.info.apply(console, args);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    sendLog('error', {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? event.error.stack : null
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    sendLog('error', {
      message: 'Unhandled Promise Rejection',
      reason: event.reason ? String(event.reason) : null
    });
  });
  
  // Monitor network requests
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input.url;
    
    return originalFetch.apply(window, [input, init])
      .then(response => {
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          sendLog('network', {
            url,
            status: response.status,
            statusText: response.statusText,
            duration,
            error: true
          });
        }
        
        return response;
      })
      .catch(error => {
        sendLog('network', {
          url,
          error: true,
          message: error.message,
          duration: Date.now() - startTime
        });
        
        throw error;
      });
  };
  
  // Monitor XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._devdockUrl = url;
    this._devdockMethod = method;
    return originalXhrOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    const xhr = this;
    const startTime = Date.now();
    
    xhr.addEventListener('load', function() {
      if (xhr.status >= 400) {
        sendLog('network', {
          url: xhr._devdockUrl,
          method: xhr._devdockMethod,
          status: xhr.status,
          statusText: xhr.statusText,
          duration: Date.now() - startTime,
          error: true
        });
      }
    });
    
    xhr.addEventListener('error', function() {
      sendLog('network', {
        url: xhr._devdockUrl,
        method: xhr._devdockMethod,
        error: true,
        duration: Date.now() - startTime
      });
    });
    
    return originalXhrSend.apply(this, arguments);
  };
  
  // Log initialization
  sendLog('log', { level: 'info', message: 'DevDock Browser Tools initialized' });
  
  console.info('DevDock Browser Tools initialized');
})();
      `;
      
      // Define paths to check for adding instrumentation
      const instrumentationPaths = [
        // For React/Next.js
        { path: path.join(projectPath, 'public'), file: 'browser-tools.js' },
        // For Vue
        { path: path.join(projectPath, 'public'), file: 'browser-tools.js' },
        // For Angular
        { path: path.join(projectPath, 'src', 'assets'), file: 'browser-tools.js' }
      ];
      
      // Find a suitable path
      let instrumentationPath = null;
      let instrumentationFile = 'browser-tools.js';
      
      for (const pathInfo of instrumentationPaths) {
        if (await fs.pathExists(pathInfo.path)) {
          instrumentationPath = pathInfo.path;
          instrumentationFile = pathInfo.file;
          break;
        }
      }
      
      // If no suitable path found, create one
      if (!instrumentationPath) {
        instrumentationPath = path.join(projectPath, '.devdock');
        await fs.ensureDir(instrumentationPath);
        instrumentationFile = 'browser-tools.js';
      }
      
      // Write instrumentation file
      const fullPath = path.join(instrumentationPath, instrumentationFile);
      await fs.writeFile(fullPath, instrumentationCode, 'utf8');
      
      this.logger.info(`Browser Tools instrumentation added to ${fullPath}`);
      
      // Add instructions on how to include the script
      const readmePath = path.join(projectPath, '.devdock', 'BROWSER_TOOLS.md');
      await fs.ensureDir(path.dirname(readmePath));
      
      const instructions = `# DevDock Browser Tools Integration

The Browser Tools instrumentation has been added to your project. To use it, you need to include the script in your HTML.

## For React/Next.js

Add the following line to your HTML head:

\`\`\`html
<script src="/browser-tools.js"></script>
\`\`\`

For Next.js, you can add it to your \`_document.js\` or \`_document.tsx\` file:

\`\`\`jsx
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {process.env.NODE_ENV === 'development' && (
            <script src="/browser-tools.js" />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
\`\`\`

## For Vue.js

Add the following line to your \`public/index.html\` file:

\`\`\`html
<script src="<%= process.env.NODE_ENV === 'development' ? '/browser-tools.js' : '' %>"></script>
\`\`\`

## For Angular

Add the following to your \`index.html\` file:

\`\`\`html
<script src="assets/browser-tools.js"></script>
\`\`\`

## Manually

If the above methods don't work for your project, you can manually include the script:

1. Copy the \`browser-tools.js\` file to your public directory.
2. Add a script tag to your HTML that points to the file.

\`\`\`html
<script src="/path/to/browser-tools.js"></script>
\`\`\`
`;
      
      await fs.writeFile(readmePath, instructions, 'utf8');
      
      this.logger.info(`Browser Tools integration instructions added to ${readmePath}`);
    } catch (error) {
      this.logger.error('Failed to add web instrumentation:', error);
      throw error;
    }
  }
} 