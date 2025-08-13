FROM node:18-alpine

  WORKDIR /app

  # Copy package files
  COPY services/portfolio-service/package*.json ./
  COPY tsconfig.json ./

  # Install all dependencies (including dev for build)
  RUN npm install

  # Copy source code
  COPY services/portfolio-service/src/ ./src/
  COPY services/portfolio-service/prisma/ ./prisma/

  # Generate Prisma client
  RUN npx prisma generate

  # Skip TypeScript compilation for development - run with ts-node instead
  # RUN npx tsc
  
  # Create logs directory for winston
  RUN mkdir -p logs

  # Expose port
  EXPOSE 3002

  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

  # Keep WORKDIR as /app (don't change to /src)
  # Start the application in development mode with ts-node-dev (skip compilation)
  CMD ["npm", "run", "dev"]