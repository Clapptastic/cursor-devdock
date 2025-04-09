FROM node:18-alpine

# Install Git (required by Renovate)
RUN apk add --no-cache git openssh-client

# Set up work directory
WORKDIR /app

# Install renovate globally
RUN npm install -g renovate

# Create config directory
RUN mkdir -p /app/config

# Default renovate config
COPY renovate.json /app/config/renovate.json

# Create convenience scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Expose renovate API port
EXPOSE 8099

# Default command runs renovate API server
CMD ["node", "/app/scripts/api-server.js"] 