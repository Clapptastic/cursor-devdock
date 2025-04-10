#!/bin/bash

# Cursor DevDock Installation Script
# This script automates the integration of Cursor DevDock into any project

# Color variables for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Output formatting functions
print_header() {
    echo -e "\n${BLUE}===============================================${NC}"
    echo -e "${BLUE}      CURSOR DEVDOCK INSTALLATION SCRIPT      ${NC}"
    echo -e "${BLUE}===============================================${NC}\n"
}

print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker and Docker Compose are installed
check_docker() {
    print_step "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo -e "Please install Docker first: ${BLUE}https://docs.docker.com/get-docker/${NC}"
        exit 1
    else
        print_success "Docker is installed!"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        echo -e "Please install Docker Compose first: ${BLUE}https://docs.docker.com/compose/install/${NC}"
        exit 1
    else
        print_success "Docker Compose is installed!"
    fi
}

# Detect project root directory
detect_project_root() {
    print_step "Detecting project root directory..."
    
    # Navigate up to find package.json or reach filesystem root
    current_dir=$(pwd)
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/package.json" ]]; then
            print_success "Project root found at: $current_dir"
            cd "$current_dir"
            return 0
        fi
        current_dir=$(dirname "$current_dir")
    done
    
    print_warning "Could not detect project root with package.json. Using current directory."
    return 0
}

# Create DevDock directory
create_devdock_dir() {
    print_step "Creating Cursor DevDock directory structure..."
    
    mkdir -p cursor-devdock/config/renovate
    mkdir -p cursor-devdock/scripts
    mkdir -p cursor-devdock/logs
    
    print_success "Directory structure created!"
}

# Download docker-compose.yml
download_docker_compose() {
    print_step "Setting up docker-compose.yml..."
    
    cat > cursor-devdock/docker-compose.yml << 'EOL'
version: '3.8'

services:
  mcp-konnect:
    image: manitoai/cursor-devdock-konnect:latest
    ports:
      - "10000:10000"
    environment:
      - PORT=10000
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  mcp-rest-api:
    image: manitoai/cursor-devdock-rest-api:latest
    ports:
      - "10001:10001"
    environment:
      - PORT=10001
      - NODE_ENV=production
    depends_on:
      - mcp-konnect
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  claude-task-master:
    image: manitoai/cursor-devdock-claude-task:latest
    ports:
      - "10002:10002"
    environment:
      - PORT=10002
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
    depends_on:
      - mcp-rest-api
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  dashboard:
    image: manitoai/cursor-devdock-dashboard:latest
    ports:
      - "10003:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
      - CLAUDE_TASK_MASTER_URL=http://claude-task-master:10002
      - BROWSER_TOOLS_URL=http://browser-tools:10005
      - DEBUG_VISUALIZER_URL=http://debug-visualizer:10006
      - NODEJS_DEBUGGER_URL=http://nodejs-debugger:10008
      - RENOVATE_URL=http://renovate:10009
    depends_on:
      - mcp-rest-api
      - claude-task-master
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  scraper:
    image: manitoai/cursor-devdock-scraper:latest
    ports:
      - "10004:10004"
    environment:
      - PORT=10004
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
    depends_on:
      - mcp-rest-api
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  browser-tools:
    image: manitoai/cursor-devdock-browser-tools:latest
    ports:
      - "10005:10005"
    environment:
      - PORT=10005
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
    depends_on:
      - mcp-rest-api
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  debug-visualizer:
    image: manitoai/cursor-devdock-debug-visualizer:latest
    ports:
      - "10006:10006"
    environment:
      - PORT=10006
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
    depends_on:
      - mcp-rest-api
    restart: unless-stopped
    networks:
      - cursor-devdock-network

  nodejs-debugger:
    image: manitoai/cursor-devdock-nodejs-debugger:latest
    ports:
      - "10008:10008"
      - "9229:9229"
    environment:
      - PORT=10008
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
    depends_on:
      - mcp-rest-api
    restart: unless-stopped
    networks:
      - cursor-devdock-network
    volumes:
      - ..:/app/project:ro

  renovate:
    image: manitoai/cursor-devdock-renovate:latest
    ports:
      - "10009:10009"
    environment:
      - PORT=10009
      - NODE_ENV=production
      - MCP_REST_API_URL=http://mcp-rest-api:10001
    depends_on:
      - mcp-rest-api
    restart: unless-stopped
    networks:
      - cursor-devdock-network
    volumes:
      - ..:/app/project:ro
      - ./config/renovate:/app/config:rw

networks:
  cursor-devdock-network:
    driver: bridge
EOL
    
    print_success "docker-compose.yml created!"
}

# Create config directories and default renovate.json
create_config_dirs() {
    print_step "Creating configuration files..."
    
    # Default renovate.json configuration
    cat > cursor-devdock/config/renovate/renovate.json << 'EOL'
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:base"
  ],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch", "pin", "digest"],
      "automerge": true
    }
  ],
  "prHourlyLimit": 0,
  "prConcurrentLimit": 0,
  "branchConcurrentLimit": 0
}
EOL
    
    print_success "Configuration files created!"
}

# Create convenience scripts
create_convenience_scripts() {
    print_step "Creating convenience scripts..."
    
    # Start script
    cat > cursor-devdock/scripts/start.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Starting Cursor DevDock services..."
docker-compose up -d
echo "Opening dashboard in browser..."
sleep 2
open_command="xdg-open"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open_command="open"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  open_command="start"
fi
$open_command http://localhost:10003
echo "Cursor DevDock is now running!"
EOL
    
    # Stop script
    cat > cursor-devdock/scripts/stop.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Stopping Cursor DevDock services..."
docker-compose down
echo "Cursor DevDock has been stopped!"
EOL
    
    # Status script
    cat > cursor-devdock/scripts/status.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Cursor DevDock services status:"
docker-compose ps
EOL
    
    # Node.js debugger script
    cat > cursor-devdock/scripts/node-debugger.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Opening Node.js Debugger in browser..."
open_command="xdg-open"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open_command="open"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  open_command="start"
fi
$open_command http://localhost:10008
echo "Remember to start your Node.js application with --inspect flag!"
EOL
    
    # Renovate script
    cat > cursor-devdock/scripts/renovate.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Opening Renovate dependency manager in browser..."
open_command="xdg-open"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open_command="open"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  open_command="start"
fi
$open_command http://localhost:10003/renovate
EOL
    
    # Browser Tools script
    cat > cursor-devdock/scripts/browser-tools.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Opening Browser Tools in browser..."
open_command="xdg-open"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open_command="open"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  open_command="start"
fi
$open_command http://localhost:10005
EOL
    
    # Make scripts executable
    chmod +x cursor-devdock/scripts/*.sh
    
    print_success "Convenience scripts created and made executable!"
}

# Add npm scripts to package.json if it exists
add_npm_integration() {
    print_step "Adding npm integration..."
    
    if [[ -f "package.json" ]]; then
        # Check if jq is installed
        if command -v jq &> /dev/null; then
            # Use jq to add scripts to package.json
            jq '.scripts["devdock:start"] = "./cursor-devdock/scripts/start.sh" | 
                .scripts["devdock:stop"] = "./cursor-devdock/scripts/stop.sh" | 
                .scripts["devdock:status"] = "./cursor-devdock/scripts/status.sh" | 
                .scripts["devdock:debug"] = "./cursor-devdock/scripts/node-debugger.sh" | 
                .scripts["devdock:renovate"] = "./cursor-devdock/scripts/renovate.sh" | 
                .scripts["devdock:browser"] = "./cursor-devdock/scripts/browser-tools.sh"' package.json > package.json.tmp
            mv package.json.tmp package.json
            print_success "npm scripts added to package.json!"
        else
            print_warning "jq is not installed. Cannot automatically add npm scripts."
            echo -e "Add the following to your package.json scripts section manually:\n"
            echo '"devdock:start": "./cursor-devdock/scripts/start.sh",'
            echo '"devdock:stop": "./cursor-devdock/scripts/stop.sh",'
            echo '"devdock:status": "./cursor-devdock/scripts/status.sh",'
            echo '"devdock:debug": "./cursor-devdock/scripts/node-debugger.sh",'
            echo '"devdock:renovate": "./cursor-devdock/scripts/renovate.sh",'
            echo '"devdock:browser": "./cursor-devdock/scripts/browser-tools.sh"'
        fi
    else
        print_warning "No package.json found. Skipping npm integration."
    fi
}

# Create a README.md file with usage instructions
create_documentation() {
    print_step "Creating documentation..."
    
    cat > cursor-devdock/README.md << 'EOL'
# Cursor DevDock

Cursor DevDock is a suite of AI-powered development tools that enhance your development workflow with debugging, dependency management, and other productivity features.

## Services Included

- **Dashboard**: The main interface for accessing all Cursor DevDock services (http://localhost:10003)
- **Node.js Debugger**: Advanced debugging tools for Node.js applications (http://localhost:10008)
- **Renovate**: Dependency management and updates (http://localhost:10003/renovate)
- **Browser Tools**: Web application debugging tools (http://localhost:10005)
- **Debug Visualizer**: Visualization tools for complex data structures (http://localhost:10006)
- **Claude Task Master**: AI-powered task management (http://localhost:10002)

## Quick Start

### Using npm (if available):

```bash
# Start all services
npm run devdock:start

# Stop all services
npm run devdock:stop

# Check service status
npm run devdock:status

# Access specific tools
npm run devdock:debug     # Node.js Debugger
npm run devdock:renovate  # Renovate dependency manager
npm run devdock:browser   # Browser Tools
```

### Using scripts directly:

```bash
# Start all services
./cursor-devdock/scripts/start.sh

# Stop all services
./cursor-devdock/scripts/stop.sh

# Check service status
./cursor-devdock/scripts/status.sh

# Access specific tools
./cursor-devdock/scripts/node-debugger.sh  # Node.js Debugger
./cursor-devdock/scripts/renovate.sh       # Renovate dependency manager
./cursor-devdock/scripts/browser-tools.sh  # Browser Tools
```

## Configuration

Configuration files can be found in `cursor-devdock/config` directory. For example, you can customize Renovate's behavior by editing `cursor-devdock/config/renovate/renovate.json`.

## For More Information

See the full documentation at: https://manitoai.github.io/cursor-devdock/docs
EOL
    
    print_success "Documentation created!"
}

# Update .gitignore to ignore Cursor DevDock logs
update_gitignore() {
    print_step "Updating .gitignore..."
    
    if [[ -f ".gitignore" ]]; then
        if ! grep -q "cursor-devdock/logs" .gitignore; then
            echo -e "\n# Cursor DevDock\ncursor-devdock/logs/" >> .gitignore
            print_success ".gitignore updated to ignore Cursor DevDock logs!"
        else
            print_warning "Cursor DevDock already in .gitignore. Skipping."
        fi
    else
        echo -e "# Cursor DevDock\ncursor-devdock/logs/" > .gitignore
        print_success "Created .gitignore with Cursor DevDock entries!"
    fi
}

# Main installation process
main() {
    print_header
    
    echo "This script will install Cursor DevDock, a suite of AI-powered development tools."
    echo "It requires Docker and Docker Compose to be installed."
    echo -e "Installation will create a ${BLUE}cursor-devdock${NC} directory in your project.\n"
    
    read -p "Continue with installation? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Installation canceled!"
        exit 1
    fi
    
    # Execute installation steps
    check_docker
    detect_project_root
    create_devdock_dir
    download_docker_compose
    create_config_dirs
    create_convenience_scripts
    add_npm_integration
    create_documentation
    update_gitignore
    
    # Installation complete
    echo -e "\n${GREEN}===============================================${NC}"
    echo -e "${GREEN}   CURSOR DEVDOCK INSTALLATION COMPLETE!      ${NC}"
    echo -e "${GREEN}===============================================${NC}"
    echo -e "\nYou can now start Cursor DevDock with:"
    
    if [[ -f "package.json" ]]; then
        echo -e "  ${BLUE}npm run devdock:start${NC}"
    else
        echo -e "  ${BLUE}./cursor-devdock/scripts/start.sh${NC}"
    fi
    
    echo -e "\nAvailable services:"
    echo -e "- Dashboard: ${BLUE}http://localhost:10003${NC}"
    echo -e "- Node.js Debugger: ${BLUE}http://localhost:10008${NC}"
    echo -e "- Renovate: ${BLUE}http://localhost:10003/renovate${NC}"
    echo -e "- Browser Tools: ${BLUE}http://localhost:10005${NC}"
    echo -e "- Debug Visualizer: ${BLUE}http://localhost:10006${NC}"
    echo -e "- Claude Task Master: ${BLUE}http://localhost:10002${NC}"
    
    echo -e "\nStart Cursor DevDock now? (y/n) "
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -f "package.json" ]]; then
            npm run devdock:start
        else
            ./cursor-devdock/scripts/start.sh
        fi
    else
        echo -e "You can start Cursor DevDock later using the command above."
    fi
}

# Run the installation
main 