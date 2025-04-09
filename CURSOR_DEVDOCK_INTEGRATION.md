# Cursor DevDock Integration Guide

This guide provides step-by-step instructions for integrating Cursor DevDock into your projects. Cursor DevDock is a suite of AI-powered development tools that enhance your development workflow with debugging, dependency management, and other productivity features.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automatic Installation)](#quick-start-automatic-installation)
3. [Manual Installation](#manual-installation)
4. [Using Cursor DevDock](#using-cursor-devdock)
5. [Service Overview](#service-overview)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Prerequisites

Before using Cursor DevDock, ensure you have the following installed:

- **Docker**: [Installation Guide](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Installation Guide](https://docs.docker.com/compose/install/)

## Quick Start (Automatic Installation)

The easiest way to integrate Cursor DevDock is using our automatic installation script.

### For Non-Technical Users

1. Open your terminal (Command Prompt on Windows, Terminal on macOS/Linux)
2. Navigate to your project directory
3. Run the following command:

```bash
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/cursor-devdock-install.sh | bash
```

4. Follow the on-screen prompts
5. Once installation is complete, start Cursor DevDock by typing:

```bash
npm run devdock:start
```

That's it! Your browser will automatically open with the Cursor DevDock dashboard.

## Manual Installation

If you prefer to install manually or if the automatic script doesn't work for your environment, follow these steps:

1. Create a `cursor-devdock` directory in your project:

```bash
mkdir -p cursor-devdock
```

2. Download the Docker Compose file:

```bash
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/docker-compose.yml -o cursor-devdock/docker-compose.yml
```

3. Create the scripts directory:

```bash
mkdir -p cursor-devdock/scripts
```

4. Download the convenience scripts:

```bash
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/scripts/start.sh -o cursor-devdock/scripts/start.sh
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/scripts/stop.sh -o cursor-devdock/scripts/stop.sh
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/scripts/status.sh -o cursor-devdock/scripts/status.sh
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/scripts/node-debugger.sh -o cursor-devdock/scripts/node-debugger.sh
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/scripts/renovate.sh -o cursor-devdock/scripts/renovate.sh
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/scripts/browser-tools.sh -o cursor-devdock/scripts/browser-tools.sh

chmod +x cursor-devdock/scripts/*.sh
```

5. If you have a Node.js project, add the scripts to your package.json:

```json
"scripts": {
  "devdock:start": "./cursor-devdock/scripts/start.sh",
  "devdock:stop": "./cursor-devdock/scripts/stop.sh",
  "devdock:status": "./cursor-devdock/scripts/status.sh",
  "devdock:debug": "./cursor-devdock/scripts/node-debugger.sh",
  "devdock:renovate": "./cursor-devdock/scripts/renovate.sh",
  "devdock:browser": "./cursor-devdock/scripts/browser-tools.sh"
}
```

6. Start Cursor DevDock:

```bash
./cursor-devdock/scripts/start.sh
```

## Using Cursor DevDock

### Starting the Services

Once installed, you can start Cursor DevDock in one of two ways:

#### For Node.js Projects:

```bash
npm run devdock:start
```

#### For Any Project:

```bash
./cursor-devdock/scripts/start.sh
```

This will start all Cursor DevDock services and open the dashboard in your default browser.

### Accessing Individual Services

You can also start and access individual services:

| Service | Command (npm) | Command (script) | URL |
|---------|--------------|------------------|-----|
| Dashboard | `npm run devdock:start` | `./cursor-devdock/scripts/start.sh` | http://localhost:10003 |
| Node.js Debugger | `npm run devdock:debug` | `./cursor-devdock/scripts/node-debugger.sh` | http://localhost:10008 |
| Renovate | `npm run devdock:renovate` | `./cursor-devdock/scripts/renovate.sh` | http://localhost:10003/renovate |
| Browser Tools | `npm run devdock:browser` | `./cursor-devdock/scripts/browser-tools.sh` | http://localhost:10005 |

### Stopping the Services

To stop all Cursor DevDock services:

```bash
npm run devdock:stop
```

or

```bash
./cursor-devdock/scripts/stop.sh
```

### Checking Service Status

To check the status of all services:

```bash
npm run devdock:status
```

or

```bash
./cursor-devdock/scripts/status.sh
```

## Service Overview

Cursor DevDock includes the following services:

### Dashboard

The main interface for accessing all Cursor DevDock services. It provides:
- Links to all services
- Service status monitoring
- Documentation
- Task management with Todo application

**URL**: http://localhost:10003

### Node.js Debugger

Advanced debugging tools for Node.js applications:
- Set breakpoints in your code
- Inspect variables and call stack
- Step through code execution
- Monitor console output
- Execute JavaScript code in the context of your application
- Debug remote applications with the `--inspect` flag

**Getting Started with the Debugger**:
1. Start your Node.js application with: `node --inspect your-app.js`
2. Navigate to the Node.js Debugger UI at http://localhost:10008
3. Connect to your running Node.js process
4. Set breakpoints, inspect variables, and control execution

**URL**: http://localhost:10008

### Renovate (Dependency Manager)

Manage and update your project dependencies:
- Scan for outdated dependencies
- See which updates are safe (patch) vs. potentially breaking (major)
- Selectively update packages
- View update logs and error details

**URL**: http://localhost:10003/renovate

### Browser Tools

Tools for monitoring and debugging web applications:
- Capture console logs
- Monitor network requests
- Track errors
- Analyze performance

**URL**: http://localhost:10005

### Debug Visualizer

Visualization tools for complex data structures:
- JSON visualization
- Tree view of nested objects
- Object inspection
- Data transformation

**URL**: http://localhost:10006

### Claude Task Master (AI Task Management)

AI-powered task management system:
- Break down complex projects into manageable tasks
- Track task dependencies
- Prioritize work
- Get AI-generated subtasks

**URL**: http://localhost:10002

## Troubleshooting

### Common Issues

#### Services Won't Start

**Problem**: Docker Compose fails to start the services.

**Solution**:
1. Check if Docker is running
2. Check for port conflicts
3. Try restarting Docker
4. Look at the logs:
   ```bash
   docker-compose -f ./cursor-devdock/docker-compose.yml logs
   ```

#### Can't Access Services

**Problem**: The services start but you can't access them in your browser.

**Solution**:
1. Check if the services are running:
   ```bash
   npm run devdock:status
   ```
2. Try accessing with http://127.0.0.1:PORT instead of localhost
3. Check your firewall settings
4. Try restarting the services

#### Node.js Debugger Not Connecting

**Problem**: The Node.js debugger doesn't connect to your application.

**Solution**:
1. Make sure your Node.js application is started with the `--inspect` flag
2. Check the debugger port (default is 9229)
3. Ensure the port is accessible and not blocked by a firewall
4. Try using `--inspect=0.0.0.0:9229` to listen on all interfaces
5. Restart both your application and the debugger service

## FAQ

### Do I need to restart Cursor DevDock when I change my code?

No, Cursor DevDock services operate independently from your code. The only exception is the Node.js debugger, which needs your application to be running with the debug flag.

### How does Renovate know which dependencies to update?

Renovate scans your project's package files (package.json, requirements.txt, etc.) and checks for available updates. It uses semantic versioning to determine which updates are safe.

### Can I use Cursor DevDock with non-Node.js projects?

Yes! While some features like the Node.js debugger are specific to Node.js, other services like the Browser Tools, Renovate, and Task Master work with any project type.

### How can I customize the configuration?

Configuration files are stored in the `cursor-devdock/config` directory. You can modify these files to customize the behavior of the services.

### Will Cursor DevDock slow down my computer?

Cursor DevDock uses Docker containers which are lightweight and only consume resources when actively used. You can start only the services you need and stop them when not in use.

### How do I update Cursor DevDock?

To update to the latest version, run the installation script again:

```bash
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/cursor-devdock-install.sh | bash
```

This will update the services while preserving your configuration.

### Can I debug a remote Node.js application?

Yes, you can debug a Node.js application running on a different machine:
1. Start your application with `--inspect=0.0.0.0:9229` on the remote machine
2. Make sure the port is accessible over the network
3. Connect to the remote machine's IP address using the Node.js Debugger

## Support

If you encounter any issues or have questions, please visit our [support portal](https://manitoai.github.io/cursor-devdock/support) or open an issue on our [GitHub repository](https://github.com/manitoai/cursor-devdock/issues). 