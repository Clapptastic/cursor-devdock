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
# Copy necessary source code and entrypoint from builder stage
COPY --from=builder /app/src ./src
# Assuming the entrypoint is src/server.js
RUN mkdir -p logs && chmod -R 755 logs
ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002
USER node
# Adjust CMD if entrypoint is different
CMD ["node", "src/server.js"] 