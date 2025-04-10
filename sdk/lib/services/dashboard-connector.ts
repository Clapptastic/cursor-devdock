/**
 * Dashboard connector for communicating with the DevDock dashboard
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../constants';
import { Logger } from '../utils/logger';
import type { CursorDevDockSDK } from '../index';
import type { ProjectInfo, Metric, SDKOptions } from '../types';

/**
 * Dashboard Connector for registering projects and sending metrics
 */
export class DashboardConnector {
  private sdk: CursorDevDockSDK;
  private options: SDKOptions;
  private logger: Logger;
  private projectId: string | null;
  private baseUrl: string;
  
  /**
   * Creates a new dashboard connector
   * @param sdk SDK instance
   * @param options SDK options
   */
  constructor(sdk: CursorDevDockSDK, options: SDKOptions) {
    this.sdk = sdk;
    this.options = options;
    this.logger = new Logger(options.logLevel);
    this.projectId = null;
    this.baseUrl = options.dashboardUrl;
  }
  
  /**
   * Registers the project with the dashboard
   * @param projectInfo Project information
   * @returns Project ID
   */
  async registerProject(projectInfo: ProjectInfo): Promise<string> {
    try {
      this.logger.debug('Registering project with dashboard:', projectInfo.name);
      
      const response = await axios.post(`${this.baseUrl}${API_ENDPOINTS.REGISTER_PROJECT}`, {
        projectInfo,
        connectionKey: this.options.connectionKey
      });
      
      if (response.status === 200 || response.status === 201) {
        this.projectId = response.data.projectId;
        this.logger.info(`Project registered with ID: ${this.projectId}`);
        return this.projectId;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`Failed to register project: ${error.response.status} ${error.response.statusText}`);
        
        if (error.response.data) {
          this.logger.error('Response data:', error.response.data);
        }
      } else {
        this.logger.error('Failed to register project:', error);
      }
      
      // For development, use a fake project ID to allow continuing
      if (process.env.NODE_ENV === 'development') {
        this.projectId = `dev-${Date.now()}`;
        this.logger.warn(`Using development project ID: ${this.projectId}`);
        return this.projectId;
      }
      
      throw error;
    }
  }
  
  /**
   * Sends metrics to the dashboard
   * @param metrics Metrics to send
   */
  async sendMetrics(metrics: Metric[]): Promise<void> {
    if (!this.projectId) {
      throw new Error('Project not registered with dashboard');
    }
    
    try {
      this.logger.debug(`Sending ${metrics.length} metrics to dashboard`);
      
      const endpoint = API_ENDPOINTS.METRICS.replace(':projectId', this.projectId);
      const response = await axios.post(`${this.baseUrl}${endpoint}`, { metrics });
      
      if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      this.logger.debug('Metrics sent successfully');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`Failed to send metrics: ${error.response.status} ${error.response.statusText}`);
      } else {
        this.logger.error('Failed to send metrics:', error);
      }
      
      throw error;
    }
  }
  
  /**
   * Sends events to the dashboard
   * @param events Events to send
   */
  async sendEvents(events: any[]): Promise<void> {
    if (!this.projectId) {
      throw new Error('Project not registered with dashboard');
    }
    
    try {
      this.logger.debug(`Sending ${events.length} events to dashboard`);
      
      const endpoint = API_ENDPOINTS.EVENTS.replace(':projectId', this.projectId);
      const response = await axios.post(`${this.baseUrl}${endpoint}`, { events });
      
      if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      this.logger.debug('Events sent successfully');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(`Failed to send events: ${error.response.status} ${error.response.statusText}`);
      } else {
        this.logger.error('Failed to send events:', error);
      }
      
      throw error;
    }
  }
  
  /**
   * Gets the project ID
   * @returns Project ID
   */
  getProjectId(): string | null {
    return this.projectId;
  }
  
  /**
   * Sets the project ID manually (useful for testing)
   * @param projectId Project ID
   */
  setProjectId(projectId: string): void {
    this.projectId = projectId;
  }
} 