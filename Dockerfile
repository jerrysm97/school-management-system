FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start command (assumes built server can run from TS directly via tsx, or we should have built server)
# Since we are using tsx/ts-node in dev, for prod we ideally transpile server too. 
# But for simplicity in this prototype, we can run with tsx if installed, or we should have a build:server script.
# Checking package.json... we don't have a build:server usually in these setups.
# Let's install tsx globally or locally in prod deps to run the server.

RUN npm install -g tsx

CMD ["tsx", "server/index.ts"]
