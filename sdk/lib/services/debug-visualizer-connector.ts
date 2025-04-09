/**
 * Debug Visualizer connector for visualizing debug data
 */

import axios from 'axios';
import { Logger } from '../utils/logger';
import type { CursorDevDockSDK } from '../index';
import type { SDKOptions, VisualizationData, ProjectInfo } from '../types';

// Update VisualizationType to use specific string literals
type VisualizationType = 'tree' | 'graph' | 'json' | 'table' | 'dependency-graph' | 'project-structure' | 'api-flow' | 'custom';

/**
 * Debug Visualizer Connector for data visualization
 */
export class DebugVisualizerConnector {
  private sdk: CursorDevDockSDK;
  private options: SDKOptions;
  private logger: Logger;
  private baseUrl: string;
  private isInitialized: boolean;
  
  /**
   * Creates a new Debug Visualizer connector
   * @param sdk SDK instance
   * @param options SDK options
   */
  constructor(sdk: CursorDevDockSDK, options: SDKOptions) {
    this.sdk = sdk;
    this.options = options;
    this.logger = new Logger(options.logLevel);
    this.baseUrl = options.serviceEndpoints.debugVisualizer;
    this.isInitialized = false;
  }
  
  /**
   * Initializes the Debug Visualizer connector
   * @returns Whether initialization was successful
   */
  async init(): Promise<boolean> {
    try {
      this.logger.debug('Initializing Debug Visualizer connector');
      
      // Check if the service is available
      await this.checkServiceAvailability();
      
      // Register with the service
      await this.register();
      
      this.isInitialized = true;
      this.logger.info('Debug Visualizer connector initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Debug Visualizer connector:', error);
      return false;
    }
  }
  
  /**
   * Visualizes data by sending it to the Debug Visualizer service
   * @param data Visualization data to send
   * @returns The visualization ID or null if failed
   */
  async visualize(data: VisualizationData): Promise<string | null> {
    if (!this.isInitialized) {
      this.logger.warn('Debug Visualizer connector not initialized');
      return null;
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/visualize`, data);
      
      if (response.status === 200 || response.status === 201) {
        this.logger.debug(`Visualization created with ID: ${response.data.id}`);
        return response.data.id;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to visualize data:', error);
      return null;
    }
  }
  
  /**
   * Gets an existing visualization by ID
   * @param id Visualization ID
   * @returns The visualization data or null if not found
   */
  async getVisualization(id: string): Promise<VisualizationData | null> {
    if (!this.isInitialized) {
      this.logger.warn('Debug Visualizer connector not initialized');
      return null;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/visualizations/${id}`);
      
      if (response.status === 200) {
        this.logger.debug(`Retrieved visualization with ID: ${id}`);
        return response.data;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get visualization with ID: ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Gets all visualizations for the current project
   * @returns An array of visualization data or null if failed
   */
  async getAllVisualizations(): Promise<VisualizationData[] | null> {
    if (!this.isInitialized) {
      this.logger.warn('Debug Visualizer connector not initialized');
      return null;
    }
    
    try {
      const projectInfo = this.sdk.getProjectInfo();
      
      if (!projectInfo) {
        throw new Error('Project information not available');
      }
      
      const response = await axios.get(`${this.baseUrl}/api/visualizations?projectId=${projectInfo.id}`);
      
      if (response.status === 200) {
        this.logger.debug(`Retrieved ${response.data.length} visualizations`);
        return response.data;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Failed to get all visualizations:', error);
      return null;
    }
  }
  
  /**
   * Updates an existing visualization
   * @param id Visualization ID
   * @param data New visualization data
   * @returns Whether the update was successful
   */
  async updateVisualization(id: string, data: VisualizationData): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('Debug Visualizer connector not initialized');
      return false;
    }
    
    try {
      const response = await axios.put(`${this.baseUrl}/api/visualizations/${id}`, data);
      
      if (response.status === 200) {
        this.logger.debug(`Updated visualization with ID: ${id}`);
        return true;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update visualization with ID: ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Deletes a visualization
   * @param id Visualization ID
   * @returns Whether the deletion was successful
   */
  async deleteVisualization(id: string): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.warn('Debug Visualizer connector not initialized');
      return false;
    }
    
    try {
      const response = await axios.delete(`${this.baseUrl}/api/visualizations/${id}`);
      
      if (response.status === 200 || response.status === 204) {
        this.logger.debug(`Deleted visualization with ID: ${id}`);
        return true;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete visualization with ID: ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Visualizes a data structure with a specific visualization type
   * @param data The data to visualize
   * @param type Visualization type (e.g., 'tree', 'graph', 'json', 'table')
   * @param title Optional title for the visualization
   * @returns The visualization ID or null if failed
   */
  async visualizeAs(data: any, type: VisualizationType, title?: string): Promise<string | null> {
    if (!this.isInitialized) {
      this.logger.warn('Debug Visualizer connector not initialized');
      return null;
    }
    
    const visualizationData: VisualizationData = {
      type,
      data,
      title: title || `${type} Visualization`,
      timestamp: new Date().toISOString()
    };
    
    return this.visualize(visualizationData);
  }
  
  /**
   * Helper method to visualize data as a tree
   * @param data Tree data
   * @param title Optional title
   * @returns The visualization ID or null if failed
   */
  async visualizeTree(data: any, title?: string): Promise<string | null> {
    return this.visualizeAs(data, 'tree', title);
  }
  
  /**
   * Helper method to visualize data as a graph
   * @param data Graph data
   * @param title Optional title
   * @returns The visualization ID or null if failed
   */
  async visualizeGraph(data: any, title?: string): Promise<string | null> {
    return this.visualizeAs(data, 'graph', title);
  }
  
  /**
   * Helper method to visualize data as a table
   * @param data Table data
   * @param title Optional title
   * @returns The visualization ID or null if failed
   */
  async visualizeTable(data: any, title?: string): Promise<string | null> {
    return this.visualizeAs(data, 'table', title);
  }
  
  /**
   * Helper method to visualize JSON data
   * @param data JSON data
   * @param title Optional title
   * @returns The visualization ID or null if failed
   */
  async visualizeJSON(data: any, title?: string): Promise<string | null> {
    return this.visualizeAs(data, 'json', title);
  }
  
  /**
   * Shuts down the Debug Visualizer connector
   */
  async shutdown(): Promise<void> {
    this.logger.debug('Shutting down Debug Visualizer connector');
    this.isInitialized = false;
  }
  
  /**
   * Checks if the Debug Visualizer service is available
   * @private
   */
  private async checkServiceAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      this.logger.debug('Debug Visualizer service is available');
    } catch (error) {
      this.logger.error('Debug Visualizer service is not available:', error);
      throw new Error('Debug Visualizer service is not available');
    }
  }
  
  /**
   * Registers with the Debug Visualizer service
   * @private
   */
  private async register(): Promise<void> {
    try {
      const projectInfo = this.sdk.getProjectInfo();
      
      if (!projectInfo) {
        throw new Error('Project information not available');
      }
      
      const response = await axios.post(`${this.baseUrl}/api/register`, {
        projectId: projectInfo.id,
        projectName: projectInfo.name,
        projectPath: projectInfo.projectPath
      });
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      this.logger.debug('Registered with Debug Visualizer service');
    } catch (error) {
      this.logger.error('Failed to register with Debug Visualizer service:', error);
      throw error;
    }
  }
} 