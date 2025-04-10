FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application files
COPY . .

# Make sure public directory exists
RUN mkdir -p public

# Expose the port
EXPOSE 8004

# Start the application
CMD ["node", "index.js"] 