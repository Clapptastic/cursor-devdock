/**
 * Configuration generator that creates configuration files based on project analysis
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CONFIG_PATHS, CONFIG_TEMPLATES } from './constants';
import type { ProjectInfo, ConfigSettings } from './types';

/**
 * Configuration Generator class that creates config files
 */
export class ConfigGenerator {
  /**
   * Generates configuration based on project information
   * @param projectInfo Project information
   * @returns Configuration settings
   */
  static async generateConfig(projectInfo: ProjectInfo): Promise<ConfigSettings> {
    // Determine the appropriate configuration format based on the project
    const configFormat = this.determineConfigFormat(projectInfo);
    
    // Generate configuration content
    const configContent = await this.generateConfigContent(projectInfo, configFormat);
    
    // Determine necessary dependencies
    const dependencies = this.determineDependencies(projectInfo);
    
    return {
      files: configContent,
      dependencies
    };
  }
  
  /**
   * Applies configuration to the project
   * @param projectInfo Project information
   * @param config Configuration settings
   * @returns Whether the configuration was applied successfully
   */
  static async applyConfiguration(
    projectInfo: ProjectInfo,
    config: ConfigSettings
  ): Promise<boolean> {
    try {
      // Create/modify configuration files
      for (const file of config.files) {
        const filePath = path.join(projectInfo.projectPath, file.path);
        
        // Check if file exists and should not be overridden
        if (!file.override && await fs.pathExists(filePath)) {
          console.log(`Skipping existing file: ${file.path}`);
          continue;
        }
        
        // Ensure directory exists
        await fs.ensureDir(path.dirname(filePath));
        
        // Write file
        await fs.writeFile(filePath, file.content, 'utf8');
        console.log(`Created/updated file: ${file.path}`);
      }
      
      // Add dependencies if needed
      if (config.dependencies.length > 0) {
        await this.addDependencies(projectInfo, config.dependencies);
      }
      
      return true;
    } catch (error) {
      console.error('Error applying configuration:', error);
      return false;
    }
  }
  
  /**
   * Determines the appropriate configuration format based on the project
   * @param projectInfo Project information
   * @returns Configuration format ('js', 'json', or 'yaml')
   * @private
   */
  private static determineConfigFormat(projectInfo: ProjectInfo): 'js' | 'json' | 'yaml' {
    // Default to JavaScript for Node.js projects
    if (projectInfo.languages.includes('javascript') || projectInfo.languages.includes('typescript')) {
      return 'js';
    }
    
    // Use YAML for Python projects
    if (projectInfo.languages.includes('python')) {
      return 'yaml';
    }
    
    // Default to JSON for everything else
    return 'json';
  }
  
  /**
   * Generates configuration file content
   * @param projectInfo Project information
   * @param format Configuration format
   * @returns Configuration files to create
   * @private
   */
  private static async generateConfigContent(
    projectInfo: ProjectInfo,
    format: 'js' | 'json' | 'yaml'
  ): Promise<Array<{ path: string; content: string; override?: boolean }>> {
    const files: Array<{ path: string; content: string; override?: boolean }> = [];
    
    // Prepare template variables
    const templateVars = {
      PROJECT_NAME: projectInfo.name,
      BROWSER_TOOLS_ENABLED: String(true),
      CLAUDE_TASK_MASTER_ENABLED: String(true), 
      DEBUG_VISUALIZER_ENABLED: String(true),
      SCRAPER_ENABLED: String(false)
    };
    
    // Generate appropriate configuration file based on format
    if (format === 'js') {
      // JavaScript configuration file
      let content = CONFIG_TEMPLATES.DEFAULT_JS_CONFIG;
      
      // Replace template variables
      for (const [key, value] of Object.entries(templateVars)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      files.push({
        path: CONFIG_PATHS.DEVDOCK_CONFIG,
        content,
        override: false
      });
    } else if (format === 'json') {
      // JSON configuration file
      let content = CONFIG_TEMPLATES.DEFAULT_JSON_CONFIG;
      
      // Replace template variables
      for (const [key, value] of Object.entries(templateVars)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      files.push({
        path: CONFIG_PATHS.DEVDOCK_JSON,
        content,
        override: false
      });
    } else if (format === 'yaml') {
      // YAML configuration file
      const yamlConfig = {
        projectName: projectInfo.name,
        services: {
          browserTools: true,
          claudeTaskMaster: true,
          debugVisualizer: true,
          scraper: false
        }
      };
      
      files.push({
        path: 'devdock.yaml',
        content: yaml.dump(yamlConfig, { indent: 2 }),
        override: false
      });
    }
    
    // Add .gitignore entries file
    files.push({
      path: '.devdock-gitignore',
      content: `# DevDock files
.devdock/
`,
      override: false
    });
    
    // Create README snippet
    files.push({
      path: '.devdock/README.md',
      content: `# DevDock Integration

This project is integrated with Cursor DevDock for enhanced development features.

## Available Services

- **Browser Tools**: Monitors web app activity and logs
- **Claude Task Master**: AI-powered task management and automation
- **Debug Visualizer**: Visualize project structure and data flows

## Getting Started

1. Start DevDock: \`docker-compose up -d\`
2. Open the dashboard: http://localhost:10003
3. View your project metrics and data

For more information, see the [Cursor DevDock documentation](https://github.com/clapptastic/cursor-devdock).
`,
      override: false
    });
    
    return files;
  }
  
  /**
   * Determines necessary dependencies based on project type
   * @param projectInfo Project information
   * @returns List of dependencies to add
   * @private
   */
  private static determineDependencies(
    projectInfo: ProjectInfo
  ): Array<{ name: string; version: string; isDev?: boolean }> {
    const dependencies: Array<{ name: string; version: string; isDev?: boolean }> = [];
    
    // For Node.js projects
    if (
      projectInfo.languages.includes('javascript') || 
      projectInfo.languages.includes('typescript')
    ) {
      dependencies.push({
        name: 'cursor-devdock-sdk',
        version: '^0.1.0',
        isDev: true
      });
    }
    
    // For Python projects
    if (projectInfo.languages.includes('python')) {
      dependencies.push({
        name: 'cursor-devdock-sdk',
        version: '>=0.1.0',
        isDev: true
      });
    }
    
    return dependencies;
  }
  
  /**
   * Adds dependencies to the project
   * @param projectInfo Project information
   * @param dependencies Dependencies to add
   * @private
   */
  private static async addDependencies(
    projectInfo: ProjectInfo,
    dependencies: Array<{ name: string; version: string; isDev?: boolean }>
  ): Promise<void> {
    // Skip if no dependencies to add
    if (dependencies.length === 0) {
      return;
    }
    
    try {
      // For Node.js projects
      if (
        projectInfo.packageInfo.packageManager === 'npm' || 
        projectInfo.packageInfo.packageManager === 'yarn' ||
        projectInfo.packageInfo.packageManager === 'pnpm'
      ) {
        const packageJsonPath = path.join(projectInfo.projectPath, 'package.json');
        
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJson(packageJsonPath);
          
          // Ensure devDependencies object exists
          packageJson.devDependencies = packageJson.devDependencies || {};
          
          // Add dependencies
          let updated = false;
          
          for (const dependency of dependencies) {
            const target = dependency.isDev ? 'devDependencies' : 'dependencies';
            
            // Ensure dependencies object exists
            packageJson[target] = packageJson[target] || {};
            
            // Add dependency if not already present or update version
            if (!packageJson[target][dependency.name]) {
              packageJson[target][dependency.name] = dependency.version;
              updated = true;
              console.log(`Added ${dependency.name}@${dependency.version} to ${target}`);
            }
          }
          
          // Update package.json if changed
          if (updated) {
            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
          }
        }
      }
      
      // For Python projects
      else if (projectInfo.packageInfo.packageManager === 'pip') {
        const requirementsPath = path.join(projectInfo.projectPath, 'requirements-dev.txt');
        
        // Create requirements-dev.txt if it doesn't exist
        if (!await fs.pathExists(requirementsPath)) {
          console.log('Creating requirements-dev.txt');
          await fs.writeFile(requirementsPath, '# Development dependencies\n', 'utf8');
        }
        
        // Read existing file
        const content = await fs.readFile(requirementsPath, 'utf8');
        const lines = content.split('\n');
        
        // Add dependencies
        let updated = false;
        
        for (const dependency of dependencies) {
          const depLine = `${dependency.name}${dependency.version}`;
          
          // Check if dependency already exists
          const exists = lines.some(line => 
            line.trim().startsWith(dependency.name) && !line.trim().startsWith('#')
          );
          
          if (!exists) {
            lines.push(depLine);
            updated = true;
            console.log(`Added ${depLine} to requirements-dev.txt`);
          }
        }
        
        // Update file if changed
        if (updated) {
          await fs.writeFile(requirementsPath, lines.join('\n'), 'utf8');
        }
      }
    } catch (error) {
      console.error('Error adding dependencies:', error);
    }
  }
} 