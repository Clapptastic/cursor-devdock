/**
 * Cursor DevDock SDK
 * Integrates Cursor projects with DevDock services
 */

import { EventEmitter } from 'events';
import { ProjectScanner } from './scanner';
import { ConfigGenerator } from './config-generator';
import { DashboardConnector } from './services/dashboard-connector';
import { BrowserToolsConnector } from './services/browser-tools-connector';
import { ClaudeTaskMasterConnector } from './services/claude-task-master-connector';
import { DebugVisualizerConnector } from './services/debug-visualizer-connector';
import { ScraperConnector } from './services/scraper-connector';
import { Logger } from './utils/logger';
import { SDK_VERSION } from './constants';
import type { SDKOptions, ProjectInfo, Metric, ServiceConnector } from './types';

/**
 * Main SDK class that coordinates all DevDock integrations
 */
export class CursorDevDockSDK extends EventEmitter {
  private options: SDKOptions;
  private services: Record<string, ServiceConnector>;
  private projectInfo: ProjectInfo | null;
  private isInitialized: boolean;
  private logger: Logger;
  private dashboardConnector: DashboardConnector;

  /**
   * Creates a new CursorDevDock SDK instance
   * @param options Configuration options for the SDK
   */
  constructor(options: Partial<SDKOptions> = {}) {
    super();
    this.options = this.mergeDefaults(options);
    this.services = {};
    this.projectInfo = null;
    this.isInitialized = false;
    this.logger = new Logger(this.options.logLevel);
    this.dashboardConnector = new DashboardConnector(this, this.options);
  }

  /**
   * Initializes the SDK and connects to DevDock services
   * @returns Promise resolving to true if initialization was successful
   */
  async init(): Promise<boolean> {
    try {
      this.logger.info('Initializing Cursor DevDock SDK...');
      
      // Scan project and detect environment
      this.logger.debug(`Scanning project at ${this.options.projectPath}`);
      this.projectInfo = await ProjectScanner.scan(this.options.projectPath);
      
      // Generate and apply configurations
      if (this.options.autoConfig) {
        this.logger.debug('Generating configuration...');
        const config = await ConfigGenerator.generateConfig(this.projectInfo);
        await ConfigGenerator.applyConfiguration(this.projectInfo, config);
      }
      
      // Initialize services based on detected project
      this.logger.debug('Initializing services...');
      await this.initializeServices();
      
      // Register project with DevDock dashboard
      this.logger.debug('Registering project with dashboard...');
      await this.registerProject();
      
      this.isInitialized = true;
      this.logger.info('Cursor DevDock SDK initialized successfully');
      this.emit('initialized');
      
      return true;
    } catch (error) {
      this.logger.error('DevDock SDK initialization failed:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Gets the current project information
   * @returns Project information object
   */
  getProjectInfo(): ProjectInfo | null {
    return this.projectInfo;
  }

  /**
   * Sends a custom metric to the DevDock dashboard
   * @param name Name of the metric
   * @param data Metric data
   */
  async sendMetric(name: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Cannot send metrics before SDK is initialized');
      return;
    }

    const metric: Metric = {
      name,
      timestamp: new Date().toISOString(),
      data
    };

    try {
      await this.dashboardConnector.sendMetrics([metric]);
      this.logger.debug(`Metric "${name}" sent to dashboard`);
    } catch (error) {
      this.logger.error(`Failed to send metric "${name}":`, error);
    }
  }

  /**
   * Gets a service connector by name
   * @param serviceName Name of the service
   * @returns Service connector or null if not found/initialized
   */
  getService<T extends ServiceConnector>(serviceName: string): T | null {
    return (this.services[serviceName] as T) || null;
  }

  /**
   * Shuts down the SDK and disconnects from all services
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Cursor DevDock SDK...');
    
    // Shutdown all services
    for (const [name, service] of Object.entries(this.services)) {
      try {
        this.logger.debug(`Shutting down service: ${name}`);
        if (typeof service.shutdown === 'function') {
          await service.shutdown();
        }
      } catch (error) {
        this.logger.error(`Error shutting down service ${name}:`, error);
      }
    }
    
    this.isInitialized = false;
    this.emit('shutdown');
    this.logger.info('SDK shutdown complete');
  }

  /**
   * Registers the project with the Dashboard
   * @private
   */
  private async registerProject(): Promise<void> {
    if (!this.projectInfo) {
      throw new Error('Project information not available');
    }
    
    await this.dashboardConnector.registerProject(this.projectInfo);
  }

  /**
   * Initializes service connectors based on configuration
   * @private
   */
  private async initializeServices(): Promise<void> {
    if (!this.projectInfo) {
      throw new Error('Project information not available');
    }

    const serviceMap = {
      browserTools: BrowserToolsConnector,
      claudeTaskMaster: ClaudeTaskMasterConnector,
      debugVisualizer: DebugVisualizerConnector,
      scraper: ScraperConnector
    };

    for (const [key, ServiceClass] of Object.entries(serviceMap)) {
      const serviceKey = key as keyof typeof serviceMap;
      
      if (this.options.services[serviceKey]) {
        this.logger.debug(`Initializing service: ${serviceKey}`);
        try {
          const service = new ServiceClass(this, this.options);
          await service.init();
          this.services[serviceKey] = service;
          this.logger.debug(`Service ${serviceKey} initialized`);
        } catch (error) {
          this.logger.error(`Failed to initialize service ${serviceKey}:`, error);
        }
      }
    }
  }

  /**
   * Merges provided options with defaults
   * @param options User-provided options
   * @returns Merged options
   * @private
   */
  private mergeDefaults(options: Partial<SDKOptions>): SDKOptions {
    const defaults: SDKOptions = {
      projectName: '',
      projectPath: process.cwd(),
      logLevel: 'info',
      autoConfig: true,
      dashboardUrl: 'http://localhost:10003',
      services: {
        browserTools: true,
        claudeTaskMaster: true,
        debugVisualizer: true,
        scraper: false
      },
      serviceEndpoints: {
        browserTools: 'http://localhost:10005',
        claudeTaskMaster: 'http://localhost:10002',
        debugVisualizer: 'http://localhost:10006',
        mcpRestApi: 'http://localhost:10001',
        scraper: 'http://localhost:10004'
      }
    };

    return {
      ...defaults,
      ...options,
      services: {
        ...defaults.services,
        ...options.services
      },
      serviceEndpoints: {
        ...defaults.serviceEndpoints,
        ...options.serviceEndpoints
      }
    };
  }
}

// Export types
export * from './types';

// Export version
export { SDK_VERSION };

// Default export
export default CursorDevDockSDK; 