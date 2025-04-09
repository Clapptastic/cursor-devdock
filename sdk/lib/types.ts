/**
 * Type definitions for Cursor DevDock SDK
 */

import { CursorDevDockSDK } from './index';

/**
 * Log levels for the SDK
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * SDK configuration options
 */
export interface SDKOptions {
  /** Project name (defaults to directory name if not provided) */
  projectName: string;
  
  /** Path to the project root directory (defaults to current working directory) */
  projectPath: string;
  
  /** Log level (defaults to 'info') */
  logLevel: LogLevel;
  
  /** Whether to automatically generate and apply configuration (defaults to true) */
  autoConfig: boolean;
  
  /** URL of the DevDock dashboard (defaults to http://localhost:10003) */
  dashboardUrl: string;
  
  /** Optional connection key for authenticating with DevDock */
  connectionKey?: string;
  
  /** Services to enable */
  services: {
    /** Browser Tools service for monitoring web apps (defaults to true) */
    browserTools: boolean;
    
    /** Claude Task Master for AI task processing (defaults to true) */
    claudeTaskMaster: boolean;
    
    /** Debug Visualizer for visualizing project data (defaults to true) */
    debugVisualizer: boolean;
    
    /** Scraper service for web scraping (defaults to false) */
    scraper: boolean;
  };
  
  /** Service endpoint URLs */
  serviceEndpoints: {
    /** Browser Tools service endpoint (defaults to http://localhost:10005) */
    browserTools: string;
    
    /** Claude Task Master service endpoint (defaults to http://localhost:10002) */
    claudeTaskMaster: string;
    
    /** Debug Visualizer service endpoint (defaults to http://localhost:10006) */
    debugVisualizer: string;
    
    /** MCP REST API service endpoint (defaults to http://localhost:10001) */
    mcpRestApi: string;
    
    /** Scraper service endpoint (defaults to http://localhost:10004) */
    scraper: string;
  };
}

/**
 * Base service connector interface
 */
export interface ServiceConnector {
  /** Initialize the service connection */
  init(): Promise<boolean>;
  
  /** Shutdown the service connection (optional) */
  shutdown?(): Promise<void>;
}

/**
 * Project framework types
 */
export type FrameworkType = 
  | 'react' 
  | 'vue' 
  | 'angular' 
  | 'node' 
  | 'express' 
  | 'next' 
  | 'django' 
  | 'flask' 
  | 'rails' 
  | 'laravel'
  | 'other';

/**
 * Project language types
 */
export type LanguageType = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'ruby' 
  | 'php' 
  | 'java' 
  | 'csharp'
  | 'go'
  | 'rust'
  | 'other';

/**
 * Project dependency information
 */
export interface Dependency {
  /** Name of the dependency */
  name: string;
  
  /** Version of the dependency */
  version: string;
  
  /** Whether this is a development dependency */
  isDev: boolean;
}

/**
 * Project package manager types
 */
export type PackageManagerType = 'npm' | 'yarn' | 'pnpm' | 'pip' | 'bundler' | 'composer' | 'other';

/**
 * Project file information
 */
export interface ProjectFileInfo {
  /** Path to the file */
  path: string;
  
  /** Size of the file in bytes */
  size: number;
  
  /** Last modified timestamp */
  lastModified: string;
}

/**
 * Package information for the project
 */
export interface PackageInfo {
  /** Name of the project from package file */
  name?: string;
  
  /** Version of the project from package file */
  version?: string;
  
  /** Project description from package file */
  description?: string;
  
  /** List of project dependencies */
  dependencies: Dependency[];
  
  /** Type of package manager used */
  packageManager: PackageManagerType;
}

/**
 * Project information gathered by scanning
 */
export interface ProjectInfo {
  /** Project path (absolute) */
  projectPath: string;
  
  /** Project name */
  name: string;
  
  /** Detected package information */
  packageInfo: PackageInfo;
  
  /** Detected frameworks in the project */
  frameworks: FrameworkType[];
  
  /** Detected languages in the project */
  languages: LanguageType[];
  
  /** Key project files detected */
  keyFiles: ProjectFileInfo[];
  
  /** Timestamp of when the scan was performed */
  timestamp: string;
}

/**
 * Configuration settings for generating project config
 */
export interface ConfigSettings {
  /** Files to create or modify */
  files: {
    /** Path to the file */
    path: string;
    
    /** Content to write */
    content: string;
    
    /** Whether to override existing file */
    override?: boolean;
  }[];
  
  /** Dependencies to add to the project */
  dependencies: {
    /** Name of the dependency */
    name: string;
    
    /** Version of the dependency */
    version: string;
    
    /** Whether it's a dev dependency */
    isDev?: boolean;
  }[];
}

/**
 * Metric data sent to the dashboard
 */
export interface Metric {
  /** Name of the metric */
  name: string;
  
  /** Timestamp when the metric was recorded */
  timestamp: string;
  
  /** Metric data (can be any structure) */
  data: any;
}

/**
 * Browser event data structure
 */
export interface BrowserEvent {
  /** Type of browser event */
  type: 'log' | 'error' | 'network' | 'performance' | 'custom';
  
  /** Timestamp when the event occurred */
  timestamp: string;
  
  /** Source of the event (file, URL, etc.) */
  source?: string;
  
  /** Event message or data */
  data: any;
}

/**
 * Claude Task structure
 */
export interface ClaudeTask {
  /** Task ID */
  id: string;
  
  /** Task description */
  description: string;
  
  /** Task context (additional information) */
  context?: string;
  
  /** Task status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Claude model to use */
  model?: string;
  
  /** Created timestamp */
  createdAt: string;
  
  /** Response from Claude (if completed) */
  response?: string;
}

/**
 * Debug visualization data
 */
export interface VisualizationData {
  /** Type of visualization */
  type: 'dependency-graph' | 'project-structure' | 'api-flow' | 'custom';
  
  /** Title of the visualization */
  title: string;
  
  /** Data for the visualization (format depends on type) */
  data: any;
} 