FROM node:18-alpine

WORKDIR /app

# Clone the Kaneo repository
RUN apk add --no-cache git
RUN git clone https://github.com/usekaneo/kaneo.git .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

EXPOSE 3333

# Start the Kaneo server
CMD ["npm", "start"] 