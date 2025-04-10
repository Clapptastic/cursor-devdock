/**
 * Project scanner that detects project structure, frameworks, and languages
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as detectIndent from 'detect-indent';
import { FRAMEWORK_PATTERNS, LANGUAGE_PATTERNS } from './constants';
import type { 
  ProjectInfo,
  PackageInfo,
  Dependency,
  FrameworkType,
  LanguageType, 
  PackageManagerType,
  ProjectFileInfo
} from './types';

/**
 * Project Scanner class that analyzes projects
 */
export class ProjectScanner {
  /**
   * Scans a project directory to detect structure, frameworks, and languages
   * @param projectPath Path to the project directory
   * @returns Project information
   */
  static async scan(projectPath: string): Promise<ProjectInfo> {
    // Ensure the path is absolute
    const absolutePath = path.isAbsolute(projectPath) 
      ? projectPath 
      : path.resolve(process.cwd(), projectPath);
    
    // Check if directory exists
    if (!await fs.pathExists(absolutePath)) {
      throw new Error(`Project directory does not exist: ${absolutePath}`);
    }
    
    // Get project name from directory name
    const projectName = path.basename(absolutePath);
    
    // Find project files
    const packageInfo = await this.findPackageInfo(absolutePath);
    
    // Detect frameworks used in project
    const frameworks = await this.detectFrameworks(packageInfo, absolutePath);
    
    // Detect languages used in project
    const languages = await this.detectLanguages(absolutePath);
    
    // Identify key project files
    const keyFiles = await this.findKeyProjectFiles(absolutePath);
    
    return {
      projectPath: absolutePath,
      name: packageInfo.name || projectName,
      packageInfo,
      frameworks,
      languages,
      keyFiles,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Finds package information from project files
   * @param projectPath Path to the project directory
   * @returns Package information
   * @private
   */
  private static async findPackageInfo(projectPath: string): Promise<PackageInfo> {
    const result: PackageInfo = {
      dependencies: [],
      packageManager: 'other'
    };
    
    // Check for package.json (Node.js projects)
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        result.name = packageJson.name;
        result.version = packageJson.version;
        result.description = packageJson.description;
        result.packageManager = this.detectNodePackageManager(projectPath);
        
        // Extract dependencies
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        
        // Process regular dependencies
        for (const [name, version] of Object.entries(dependencies)) {
          result.dependencies.push({
            name,
            version: String(version),
            isDev: false
          });
        }
        
        // Process dev dependencies
        for (const [name, version] of Object.entries(devDependencies)) {
          result.dependencies.push({
            name,
            version: String(version),
            isDev: true
          });
        }
      } catch (error) {
        console.error('Error parsing package.json:', error);
      }
    }
    
    // Check for requirements.txt (Python projects)
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    if (await fs.pathExists(requirementsPath)) {
      try {
        const content = await fs.readFile(requirementsPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        result.packageManager = 'pip';
        
        // Extract Python dependencies
        for (const line of lines) {
          // Parse requirement lines like "package==1.0.0" or "package>=1.0.0"
          const match = line.match(/^([a-zA-Z0-9_.-]+)([=<>!~]+)(.+)$/);
          if (match) {
            result.dependencies.push({
              name: match[1],
              version: `${match[2]}${match[3]}`,
              isDev: false
            });
          }
        }
      } catch (error) {
        console.error('Error parsing requirements.txt:', error);
      }
    }
    
    // Check for Gemfile (Ruby projects)
    const gemfilePath = path.join(projectPath, 'Gemfile');
    if (await fs.pathExists(gemfilePath)) {
      try {
        const content = await fs.readFile(gemfilePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        result.packageManager = 'bundler';
        
        // Extract Ruby dependencies
        for (const line of lines) {
          // Parse gem lines like "gem 'package', '~> 1.0.0'" or "gem 'package'"
          const match = line.match(/gem\s+['"]([^'"]+)['"](,\s*['"]([^'"]+)['"])?/);
          if (match) {
            result.dependencies.push({
              name: match[1],
              version: match[3] || '*',
              isDev: line.includes(':development') || line.includes(':test')
            });
          }
        }
      } catch (error) {
        console.error('Error parsing Gemfile:', error);
      }
    }
    
    // Check for composer.json (PHP projects)
    const composerPath = path.join(projectPath, 'composer.json');
    if (await fs.pathExists(composerPath)) {
      try {
        const composerJson = await fs.readJson(composerPath);
        result.name = composerJson.name;
        result.version = composerJson.version;
        result.description = composerJson.description;
        result.packageManager = 'composer';
        
        // Extract dependencies
        const dependencies = composerJson.require || {};
        const devDependencies = composerJson['require-dev'] || {};
        
        // Process regular dependencies
        for (const [name, version] of Object.entries(dependencies)) {
          if (name !== 'php') { // Skip PHP version constraint
            result.dependencies.push({
              name,
              version: String(version),
              isDev: false
            });
          }
        }
        
        // Process dev dependencies
        for (const [name, version] of Object.entries(devDependencies)) {
          result.dependencies.push({
            name,
            version: String(version),
            isDev: true
          });
        }
      } catch (error) {
        console.error('Error parsing composer.json:', error);
      }
    }
    
    return result;
  }
  
  /**
   * Detects Node.js package manager based on lock files
   * @param projectPath Path to the project directory
   * @returns Detected package manager
   * @private
   */
  private static async detectNodePackageManager(projectPath: string): Promise<PackageManagerType> {
    // Check for yarn.lock (Yarn)
    if (await fs.pathExists(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    
    // Check for pnpm-lock.yaml (pnpm)
    if (await fs.pathExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    
    // Default to npm if package.json exists
    if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
      return 'npm';
    }
    
    return 'other';
  }
  
  /**
   * Detects frameworks used in the project
   * @param packageInfo Package information
   * @param projectPath Path to the project directory
   * @returns List of detected frameworks
   * @private
   */
  private static async detectFrameworks(
    packageInfo: PackageInfo,
    projectPath: string
  ): Promise<FrameworkType[]> {
    const frameworks: FrameworkType[] = [];
    const dependencyNames = packageInfo.dependencies.map(dep => dep.name);
    
    // Check each framework
    for (const [frameworkKey, frameworkPattern] of Object.entries(FRAMEWORK_PATTERNS)) {
      // Check dependencies
      const hasFrameworkDeps = frameworkPattern.DEP_NAMES.some(depName => 
        dependencyNames.includes(depName)
      );
      
      // Check file patterns
      let hasFrameworkFiles = false;
      
      for (const pattern of frameworkPattern.FILE_PATTERNS) {
        // If pattern is a file extension, use glob to find matching files
        if (pattern.startsWith('.')) {
          const files = await glob.glob(`**/*${pattern}`, { 
            cwd: projectPath,
            ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**'],
            nodir: true
          });
          
          if (files.length > 0) {
            hasFrameworkFiles = true;
            break;
          }
        } 
        // If pattern is a specific file, check if it exists
        else {
          if (await fs.pathExists(path.join(projectPath, pattern))) {
            hasFrameworkFiles = true;
            break;
          }
        }
      }
      
      // If framework is detected by either dependencies or files, add it
      if (hasFrameworkDeps || hasFrameworkFiles) {
        frameworks.push(frameworkKey.toLowerCase() as FrameworkType);
      }
    }
    
    // If no frameworks detected, add 'other'
    if (frameworks.length === 0) {
      frameworks.push('other');
    }
    
    return frameworks;
  }
  
  /**
   * Detects languages used in the project
   * @param projectPath Path to the project directory
   * @returns List of detected languages
   * @private
   */
  private static async detectLanguages(projectPath: string): Promise<LanguageType[]> {
    const languages: LanguageType[] = [];
    
    // Check each language
    for (const [languageKey, languagePattern] of Object.entries(LANGUAGE_PATTERNS)) {
      // Check file extensions
      let hasLanguageFiles = false;
      
      for (const extension of languagePattern.EXTENSIONS) {
        const files = await glob.glob(`**/*${extension}`, { 
          cwd: projectPath,
          ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**'],
          nodir: true
        });
        
        if (files.length > 0) {
          hasLanguageFiles = true;
          break;
        }
      }
      
      // Check config files
      let hasConfigFiles = false;
      
      for (const configFile of languagePattern.CONFIG_FILES) {
        if (await fs.pathExists(path.join(projectPath, configFile))) {
          hasConfigFiles = true;
          break;
        }
      }
      
      // If language is detected by either files or config, add it
      if (hasLanguageFiles || hasConfigFiles) {
        languages.push(languageKey.toLowerCase() as LanguageType);
      }
    }
    
    // If no languages detected, add 'other'
    if (languages.length === 0) {
      languages.push('other');
    }
    
    return languages;
  }
  
  /**
   * Finds key project files
   * @param projectPath Path to the project directory
   * @returns List of key project files
   * @private
   */
  private static async findKeyProjectFiles(projectPath: string): Promise<ProjectFileInfo[]> {
    const keyFiles: ProjectFileInfo[] = [];
    
    // List of important configuration files to look for
    const importantFiles = [
      'package.json',
      'tsconfig.json',
      '.env',
      '.env.example',
      '.gitignore',
      '.eslintrc.js',
      '.eslintrc.json',
      'webpack.config.js',
      'next.config.js',
      'vue.config.js',
      'angular.json',
      'jest.config.js',
      'babel.config.js',
      'requirements.txt',
      'setup.py',
      'manage.py',
      'Gemfile',
      'composer.json',
      'docker-compose.yml',
      'Dockerfile',
      'README.md'
    ];
    
    // Check each file
    for (const filename of importantFiles) {
      const filePath = path.join(projectPath, filename);
      
      if (await fs.pathExists(filePath)) {
        try {
          const stats = await fs.stat(filePath);
          
          keyFiles.push({
            path: path.relative(projectPath, filePath),
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          });
        } catch (error) {
          console.error(`Error getting file info for ${filePath}:`, error);
        }
      }
    }
    
    return keyFiles;
  }
} 