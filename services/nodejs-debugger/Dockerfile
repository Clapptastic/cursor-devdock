FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create public directory
RUN mkdir -p public

# Expose debugger port
EXPOSE 8005
EXPOSE 9229

# Start the application
CMD ["node", "index.js"] 