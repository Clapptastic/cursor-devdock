# Cursor DevDock

Cursor DevDock is a development toolkit that provides monitoring, debugging, and visualization tools for your applications.

## Services

- **MCP Konnect**: Service registry and API gateway
- **MCP REST API**: REST API for interacting with DevDock services
- **Browser Tools**: Browser monitoring and debugging tools
- **Claude Task Master**: AI task management and automation
- **Dashboard**: Main dashboard UI for DevDock
- **Debug Visualizer**: Tools for visualizing data structures and project information
- **Kaneo**: Dashboard for services
- **Scraper**: Web scraping service
- **Renovate**: Dependency management

## Getting Started

1. Clone this repository
2. Run `./init.sh` to start the services
3. Access the dashboard at http://localhost:10003

## Integrating with Your Application

The DevDock services are designed to be integrated with your application via the SDK:

### Node.js/TypeScript

```javascript
// Install the SDK
npm install cursor-devdock-sdk --save-dev

// In your application
const { CursorDevDockSDK } = require('cursor-devdock-sdk');

// Initialize the SDK
const devdock = new CursorDevDockSDK({
  projectName: 'Your Project Name',
  projectPath: __dirname
});

// Start the SDK
await devdock.init();

// Use the browser tools
const browserTools = devdock.getService('browserTools');
await browserTools.captureEvent({
  type: 'log',
  timestamp: new Date().toISOString(),
  source: 'app.js',
  data: { message: 'Application started' }
});

// Use the debug visualizer
const debugVisualizer = devdock.getService('debugVisualizer');
await debugVisualizer.visualizeJSON({
  users: [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]
}, 'User Data');
```

## Service URLs

- Dashboard: http://localhost:10003
- MCP Konnect: http://localhost:10000
- MCP REST API: http://localhost:10001
- Claude Task Master: http://localhost:10002
- Scraper: http://localhost:10004
- Browser Tools: http://localhost:10005
- Debug Visualizer: http://localhost:10006
- Kaneo: http://localhost:10007

## Documentation

For more details on integrating with each service, refer to the SDK documentation in the `sdk/` directory. 