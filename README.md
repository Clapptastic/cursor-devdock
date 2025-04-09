# Cursor DevDock

![Cursor DevDock Logo](https://cursor.sh/logo.png)

Cursor DevDock is a suite of AI-powered development tools designed to enhance your development workflow. It integrates seamlessly with your existing projects and provides a comprehensive set of features for debugging, dependency management, task tracking, and more.

## Features

- **Dashboard**: Central hub for accessing all Cursor DevDock services
- **Node.js Debugger**: Advanced debugging tools for Node.js applications
- **Browser Tools**: Monitor and debug web applications
- **Debug Visualizer**: Visualize complex data structures
- **Renovate**: Automated dependency management
- **Claude Task Master**: AI-powered task management and tracking
- **MCP Integration**: Seamless integration with Cursor's AI capabilities

## Quick Start

The easiest way to get started is to use our automated installation script:

```bash
curl -sSL https://raw.githubusercontent.com/manitoai/cursor-devdock/main/cursor-devdock-install.sh | bash
```

This script will:
1. Check for Docker and Docker Compose installation
2. Create the necessary directory structure
3. Set up configuration files
4. Integrate with your project's package.json (if available)
5. Provide convenience scripts for managing the services

After installation, you can start Cursor DevDock with:

```bash
npm run devdock:start
# or directly with
./cursor-devdock/scripts/start.sh
```

## Services

### Dashboard
- **URL**: http://localhost:10003
- **Description**: The main interface for accessing all Cursor DevDock services
- **Features**: Service status monitoring, navigation to all tools, documentation

### Node.js Debugger
- **URL**: http://localhost:10008
- **Description**: Advanced debugging tools for Node.js applications
- **Features**: Breakpoint management, variable inspection, step execution, call stack

### Browser Tools
- **URL**: http://localhost:10005
- **Description**: Tools for monitoring and debugging web applications
- **Features**: Console log capture, network request monitoring, error tracking

### Debug Visualizer
- **URL**: http://localhost:10006
- **Description**: Visualization tools for complex data structures
- **Features**: JSON visualization, tree view, object inspection

### Renovate
- **URL**: http://localhost:10003/renovate
- **Description**: Dependency management tools
- **Features**: Scan for outdated dependencies, automated updates, PR management

### Claude Task Master
- **URL**: http://localhost:10002
- **Description**: AI-powered task management
- **Features**: Task creation, tracking, prioritization, and AI-generated subtasks

## System Requirements

- Docker
- Docker Compose
- Node.js 14+ (for npm integration)

## Configuration

Configuration files are stored in the `cursor-devdock/config` directory. You can modify these files to customize the behavior of the services.

## Manual Installation

If you prefer to set up Cursor DevDock manually, follow these steps:

1. Clone this repository:
   ```bash
   git clone https://github.com/manitoai/cursor-devdock.git
   ```

2. Navigate to the directory:
   ```bash
   cd cursor-devdock
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Services not starting
- Ensure Docker is running
- Check for port conflicts
- Review Docker logs: `docker-compose -f ./cursor-devdock/docker-compose.yml logs`

### Cannot connect to Node.js debugger
- Ensure your Node.js application is started with the `--inspect` flag
- Check that port 9229 is accessible

## Support

For support, please visit our [support portal](https://support.cursor.sh) or open an issue on our [GitHub repository](https://github.com/manitoai/cursor-devdock/issues).

## License

Cursor DevDock is licensed under the [MIT License](LICENSE). 