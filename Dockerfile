# Multi-stage build for MindKey NFC (Hedera Edition)
FROM node:20-alpine AS base

# Install Python for AI services
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:20-alpine AS production

# Install Python and required packages
RUN apk add --no-cache python3 py3-pip

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/client/build ./client/build
COPY --from=base /app/server.js ./
COPY --from=base /app/src ./src
COPY --from=base /app/ai ./ai
COPY --from=base /app/prisma ./prisma

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mindkey -u 1001

# Change ownership
RUN chown -R mindkey:nodejs /app
USER mindkey

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "server.js"]
