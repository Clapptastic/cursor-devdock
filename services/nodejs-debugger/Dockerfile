FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p public

# Expose the port for the debugger service
EXPOSE 12345
EXPOSE 9229

# Start the application
CMD ["node", "index.js"] 