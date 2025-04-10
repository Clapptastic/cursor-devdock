# Node.js Debugger Service Setup

This document outlines the setup and troubleshooting steps for the Node.js Debugger Service in the Cursor DevDock environment.

## Configuration

The Node.js Debugger Service is configured in the following files:

1. `services/nodejs-debugger/Dockerfile`: Contains Docker image configuration
2. `services/nodejs-debugger/index.js`: Contains the main application code
3. `docker-compose.yml`: Contains service configuration for Docker Compose

## Port Configuration

The service is configured to run on port 12345 internally and is mapped to port 10008 externally. The debugger port (9229) is also exposed for connecting to Node.js processes.

```yaml
# Docker Compose configuration
nodejs-debugger:
  build:
    context: ./services/nodejs-debugger
  ports:
    - "10008:12345"
    - "9229:9229"
  environment:
    - MCP_REST_API_URL=http://mcp-rest-api:8001
    - PORT=12345
```

## Troubleshooting Port Conflicts

If you encounter port conflicts (EADDRINUSE errors) when starting the Node.js Debugger Service, follow these steps:

1. Check for processes using the configured port:
   ```bash
   netstat -an | grep LISTEN | grep <port>
   # or
   sudo lsof -i :<port>
   ```

2. Update the port configuration in three places:
   - `services/nodejs-debugger/Dockerfile`: Update the `EXPOSE` directive
   - `services/nodejs-debugger/index.js`: Update the `port` variable
   - `docker-compose.yml`: Update the port mapping and environment variable

3. Rebuild and restart the service:
   ```bash
   docker-compose down
   docker-compose build nodejs-debugger
   docker-compose up -d
   ```

4. Check the logs to verify the service is running:
   ```bash
   docker-compose logs nodejs-debugger
   ```

## Service Registration

The Node.js Debugger Service should register itself with the MCP REST API on startup. If registration fails, check the following:

1. Ensure the MCP REST API service is running:
   ```bash
   docker-compose ps mcp-rest-api
   ```

2. Check the logs for registration errors:
   ```bash
   docker-compose logs nodejs-debugger | grep "Failed to register"
   ```

3. Verify the MCP REST API URL in the environment variables:
   ```yaml
   environment:
     - MCP_REST_API_URL=http://mcp-rest-api:8001
   ```

## Testing the Service

Once the service is running, you can test it by accessing the UI at http://localhost:10008 or making requests to the API endpoints:

```bash
curl -I http://localhost:10008
```

## Note on Docker Network Issues

In some Docker environments, there may be issues with port binding within the container network. If you've tried multiple ports and still encounter EADDRINUSE errors, consider the following:

1. Restart the Docker daemon
2. Inspect the Docker network:
   ```bash
   docker network inspect manitoai-dev_default
   ```
3. Create a dedicated network for the Node.js Debugger Service:
   ```yaml
   networks:
     nodejs-debugger-network:
       driver: bridge
   
   services:
     nodejs-debugger:
       # ...
       networks:
         - nodejs-debugger-network
   ```

## Further Resources

For more information on the Node.js Debugger Service, see the following resources:

- [Node.js Debugger Documentation](docs/nodejs-debugger.md)
- [Cursor DevDock Integration Guide](CURSOR_DEVDOCK_INTEGRATION.md) 