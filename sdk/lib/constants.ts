/**
 * Constants used throughout the SDK
 */

/** SDK version */
export const SDK_VERSION = '0.1.0';

/** Default dashboard URL */
export const DEFAULT_DASHBOARD_URL = 'http://localhost:10003';

/** Service endpoint URLs */
export const SERVICE_ENDPOINTS = {
  /** Browser Tools service */
  BROWSER_TOOLS: 'http://localhost:10005',
  
  /** Claude Task Master service */
  CLAUDE_TASK_MASTER: 'http://localhost:10002',
  
  /** Debug Visualizer service */
  DEBUG_VISUALIZER: 'http://localhost:10006',
  
  /** MCP REST API service */
  MCP_REST_API: 'http://localhost:10001',
  
  /** Scraper service */
  SCRAPER: 'http://localhost:10004'
};

/** Configuration file paths */
export const CONFIG_PATHS = {
  /** DevDock configuration file */
  DEVDOCK_CONFIG: 'devdock.config.js',
  
  /** DevDock JSON configuration */
  DEVDOCK_JSON: 'devdock.json'
};

/** Configuration templates */
export const CONFIG_TEMPLATES = {
  /** Default JS configuration */
  DEFAULT_JS_CONFIG: `
module.exports = {
  projectName: '{{PROJECT_NAME}}',
  services: {
    browserTools: {{BROWSER_TOOLS_ENABLED}},
    claudeTaskMaster: {{CLAUDE_TASK_MASTER_ENABLED}},
    debugVisualizer: {{DEBUG_VISUALIZER_ENABLED}},
    scraper: {{SCRAPER_ENABLED}}
  },
  // Add custom configuration here
};`,

  /** Default JSON configuration */
  DEFAULT_JSON_CONFIG: `{
  "projectName": "{{PROJECT_NAME}}",
  "services": {
    "browserTools": {{BROWSER_TOOLS_ENABLED}},
    "claudeTaskMaster": {{CLAUDE_TASK_MASTER_ENABLED}},
    "debugVisualizer": {{DEBUG_VISUALIZER_ENABLED}},
    "scraper": {{SCRAPER_ENABLED}}
  }
}`
};

/** Framework detection patterns */
export const FRAMEWORK_PATTERNS = {
  /** React detection */
  REACT: {
    DEP_NAMES: ['react', 'react-dom'],
    FILE_PATTERNS: ['.jsx', '.tsx', 'react']
  },
  
  /** Vue detection */
  VUE: {
    DEP_NAMES: ['vue'],
    FILE_PATTERNS: ['.vue', 'vue.config.js']
  },
  
  /** Angular detection */
  ANGULAR: {
    DEP_NAMES: ['@angular/core'],
    FILE_PATTERNS: ['angular.json']
  },
  
  /** Next.js detection */
  NEXT: {
    DEP_NAMES: ['next'],
    FILE_PATTERNS: ['next.config.js']
  },
  
  /** Express detection */
  EXPRESS: {
    DEP_NAMES: ['express'],
    FILE_PATTERNS: []
  },
  
  /** Django detection */
  DJANGO: {
    DEP_NAMES: ['django'],
    FILE_PATTERNS: ['manage.py', 'wsgi.py']
  },
  
  /** Flask detection */
  FLASK: {
    DEP_NAMES: ['flask'],
    FILE_PATTERNS: []
  },
  
  /** Rails detection */
  RAILS: {
    DEP_NAMES: ['rails'],
    FILE_PATTERNS: ['Gemfile', 'config/routes.rb']
  },
  
  /** Laravel detection */
  LARAVEL: {
    DEP_NAMES: ['laravel'],
    FILE_PATTERNS: ['artisan', 'composer.json']
  }
};

/** Language detection patterns */
export const LANGUAGE_PATTERNS = {
  /** JavaScript detection */
  JAVASCRIPT: {
    EXTENSIONS: ['.js', '.jsx', '.mjs'],
    CONFIG_FILES: ['package.json', '.eslintrc.js', 'webpack.config.js']
  },
  
  /** TypeScript detection */
  TYPESCRIPT: {
    EXTENSIONS: ['.ts', '.tsx'],
    CONFIG_FILES: ['tsconfig.json', '.tsconfig.js']
  },
  
  /** Python detection */
  PYTHON: {
    EXTENSIONS: ['.py'],
    CONFIG_FILES: ['requirements.txt', 'setup.py', 'Pipfile']
  },
  
  /** Ruby detection */
  RUBY: {
    EXTENSIONS: ['.rb'],
    CONFIG_FILES: ['Gemfile', '.ruby-version']
  },
  
  /** PHP detection */
  PHP: {
    EXTENSIONS: ['.php'],
    CONFIG_FILES: ['composer.json']
  },
  
  /** Java detection */
  JAVA: {
    EXTENSIONS: ['.java'],
    CONFIG_FILES: ['pom.xml', 'build.gradle']
  },
  
  /** C# detection */
  CSHARP: {
    EXTENSIONS: ['.cs'],
    CONFIG_FILES: ['.sln', '.csproj']
  },
  
  /** Go detection */
  GO: {
    EXTENSIONS: ['.go'],
    CONFIG_FILES: ['go.mod', 'go.sum']
  },
  
  /** Rust detection */
  RUST: {
    EXTENSIONS: ['.rs'],
    CONFIG_FILES: ['Cargo.toml']
  }
};

/** API endpoints */
export const API_ENDPOINTS = {
  /** Project registration endpoint */
  REGISTER_PROJECT: '/api/projects/register',
  
  /** Metrics endpoint */
  METRICS: '/api/projects/:projectId/metrics',
  
  /** Events endpoint */
  EVENTS: '/api/projects/:projectId/events'
}; 