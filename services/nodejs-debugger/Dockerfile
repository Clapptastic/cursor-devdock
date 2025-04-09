FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create the public directory if it doesn't exist
RUN mkdir -p public

# Expose the port
EXPOSE 8008

# Start the application
CMD ["node", "index.js"] 