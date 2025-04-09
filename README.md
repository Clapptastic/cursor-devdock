# Cursor DevDock

A containerized development environment that enhances the AI coding experience inside Cursor by leveraging the Model Context Protocol (MCP) server functionality.

## Features

- **MCP Server Integration** - Integrate with Kong MCP Konnect to manage APIs and expose them to Cursor
- **AI Task Management** - Use Claude Task Master to route AI tasks to appropriate services
- **Web UI Dashboard** - Access all tools through a unified localhost interface
- **Scraping Capabilities** - Web scraping with stealth mode support
- **Browser Monitoring** - Track and analyze browser-based events and workflows
- **Dependency Management** - Automatically track and update dependencies with Renovate
- **Debugging Tools** - Visualize data structures and debug information

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
| Scraper | [http://localhost:8003](http://localhost:8003) | Web scraping service |
| Browser Tools | [http://localhost:8004](http://localhost:8004) | Browser monitoring tools |

## Configuration

### MCP Konnect

MCP Konnect configuration is stored in `config/mcp-konnect/config.yaml`. You can edit this file to register additional APIs or modify existing ones.

### Renovate

Renovate configuration is stored in `config/renovate/config.json`. You can customize dependency update rules, scheduling, and more.

## Developer Guide

### Project Structure

## Extending the System

### Adding a New Service

1. Create a new directory under `services/`
2. Add your Dockerfile and service code
3. Update `docker-compose.yml` to include your service
4. Register your service's API with MCP Konnect

### Configuration

Configuration files for various services can be found in the `config/` directory. 