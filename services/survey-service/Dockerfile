# ---- Builder Stage ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
# Optional: Add build step here if needed

# ---- Production Stage ----
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies and clean cache
RUN npm ci --omit=dev || npm install --omit=dev && npm cache clean --force
# Copy necessary source code from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.js ./
RUN mkdir -p logs && chmod -R 755 logs
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
USER node
CMD ["npm", "start"] 