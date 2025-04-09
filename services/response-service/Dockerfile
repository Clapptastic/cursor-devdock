FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies and clean npm cache to reduce image size
RUN npm ci || npm install && npm cache clean --force

# Bundle app source
COPY . .

# Create log directory and set permissions
RUN mkdir -p logs && chmod -R 755 logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Expose the service port
EXPOSE 3002

# Set non-root user for security
USER node

# Start the service
CMD ["npm", "start"] 