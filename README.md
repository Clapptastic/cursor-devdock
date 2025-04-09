# Cursor DevDock

A containerized development environment that enhances the AI coding experience inside Cursor by leveraging the Model Context Protocol (MCP) server functionality.

## Features

- **MCP Server Integration** - Seamlessly integrate with Cursor's MCP using Kong MCP Konnect for API management
- **AI Task Management** - Leverage Claude Task Master for intelligent task routing and management
- **Web UI Interface** - Access all tools through a unified localhost dashboard at http://localhost:3000
- **TypeScript Debug Tools** - Analyze TypeScript code with integrated debugging visualization
- **Scraping Capabilities** - Web scraping with standard and stealth modes using firecrawl-mcp-server
- **Browser Monitoring** - Track and analyze browser-based events and workflows
- **Debug Visualization** - Visualize complex data structures and debug information
- **Dependency Management** - Automatically track and update dependencies with Renovate
- **Kaneo Dashboard** - Access the Kaneo workflow management interface

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js (for local development)
- Git

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/cursor-devdock.git
   cd cursor-devdock
   ```

2. Run the init script to set up and start all services:
   ```bash
   chmod +x init.sh
   ./init.sh
   ```

3. Access the dashboard at [http://localhost:3000](http://localhost:3000)

## Available Services

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard | [http://localhost:3000](http://localhost:3000) | Main UI for accessing all tools |
| MCP Konnect | [http://localhost:8000](http://localhost:8000) | API management and registration |
| MCP REST API | [http://localhost:8001](http://localhost:8001) | REST interface for MCP functionality |
| Claude Task Master | [http://localhost:8002](http://localhost:8002) | AI task routing service |
| Scraper | [http://localhost:8003](http://localhost:8003) | Web scraping service with firecrawl integration |
| Browser Tools | [http://localhost:8004](http://localhost:8004) | Browser monitoring tools |
| Debug Visualizer | [http://localhost:8005](http://localhost:8005) | Debug visualization tools |
| Kaneo | [http://localhost:3333](http://localhost:3333) | Kaneo dashboard for workflow management |

## Components

### 1. MCP Server Integration
- Kong MCP Konnect for managing APIs and connections
- MCP REST API for exposing custom APIs to Cursor

### 2. AI Task Management
- Claude Task Master for AI task routing
- Web-based UI for interacting with Claude-style prompts
- Task routing to appropriate submodules via MCP

### 3. Web UI Interface
- Unified dashboard for accessing all tools
- TypeScript debug info via TypeScript SDK integration
- VSCode Debug Visualizer-style data visualization
- Kaneo dashboard integration via iframe

### 4. Scraping and Stealth
- Web scraping with Firecrawl integration
- Stealth mode for browser behavior simulation
- Batch and crawl capabilities

### 5. Dependency Management
- Renovate for tracking and updating dependencies
- Configuration stored in config/renovate

### 6. Browser Monitoring
- Browser-based event logging
- Real-time console and network monitoring
- WebSocket-based live updates

## Configuration

### MCP Konnect

MCP Konnect configuration is stored in `config/mcp-konnect/config.yaml`. You can edit this file to register additional APIs or modify existing ones.

### Renovate

Renovate configuration is stored in `config/renovate/config.json`. You can customize dependency update rules, scheduling, and more.

## Developer Guide

### Project Structure

```
cursor-devdock/
├── config/                 # Configuration files
│   ├── mcp-konnect/        # MCP Konnect configuration
│   └── renovate/           # Renovate configuration
├── services/               # Service implementations
│   ├── browser-tools/      # Browser monitoring tools
│   ├── claude-task-master/ # AI task routing service
│   ├── dashboard/          # Main UI dashboard
│   ├── debug-visualizer/   # Debug visualization tools
│   ├── kaneo/              # Kaneo dashboard integration
│   ├── mcp-rest-api/       # REST API for MCP
│   └── scraper/            # Web scraping service
├── docker-compose.yml      # Docker Compose configuration
├── init.sh                 # Initialization script
└── README.md               # Documentation
```

### Adding a New Service

1. Create a new directory under `services/` for your service
2. Create a Dockerfile and necessary implementation files
3. Add the service to `docker-compose.yml`
4. Register the service's API with MCP Konnect

Example:
```yaml
# In docker-compose.yml
services:
  # ... existing services ...
  
  your-service:
    build:
      context: ./services/your-service
    ports:
      - "8099:8099"
    environment:
      - MCP_REST_API_URL=http://mcp-rest-api:8001
```

Then register your service:
```bash
curl -X POST http://localhost:8001/register-api \
  -H "Content-Type: application/json" \
  -d '{"name":"your-service", "url":"http://your-service:8099", "description":"Your service description"}'
```

### Extending the System

The system is designed to be modular and extensible. You can add new services or enhance existing ones as needed:

1. **Adding a new API**: Create a service and register it with MCP Konnect
2. **Adding a new UI component**: Add to the dashboard's navigation and create a corresponding page
3. **Enhancing scraping**: Add new endpoints to the scraper service

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 