# ---- Builder Stage ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Install all dependencies needed for build (if any) and production
RUN npm ci || npm install
COPY . .
# Optional: Add build step here if needed (e.g., RUN npm run build)

# ---- Production Stage ----
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies and clean cache
RUN npm ci --omit=dev || npm install --omit=dev && npm cache clean --force
# Copy necessary source code from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.js ./
# Create log directory and set permissions
RUN mkdir -p logs && chmod -R 755 logs
ENV NODE_ENV=production
ENV PORT=3003
EXPOSE 3003
USER node
# Start the service using node directly if package.json's start script is simple, or use npm start
CMD ["npm", "start"] 