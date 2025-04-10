# Use a smaller base image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Use a smaller runtime image
FROM node:18-alpine

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 3333

# Start the application
CMD ["npm", "start"] 