FROM node:18-alpine

WORKDIR /app

# Copy shared libs first
COPY libs/ ./libs/

# Install and build shared libs
WORKDIR /app/libs/shared
COPY libs/shared/package*.json ./
RUN npm install && npm run build

WORKDIR /app/libs/types
COPY libs/types/package*.json ./
RUN npm install && npm run build

# Now work on auth service
WORKDIR /app

# Copy package files and tsconfig files
COPY services/auth/package.json ./package.json.orig
COPY tsconfig.json ./tsconfig.base.json

# Modify package.json to use local file paths
RUN sed 's|"@investment-platform/shared": ".*"|"@investment-platform/shared": "file:./libs/shared"|g' package.json.orig | \
    sed 's|"@investment-platform/types": ".*"|"@investment-platform/types": "file:./libs/types"|g' > package.json

# Install dependencies
RUN npm install

# Copy source code and fix tsconfig
COPY services/auth/src ./src
COPY services/auth/tsconfig.json ./tsconfig.json.orig

# Fix tsconfig extends path and add build-specific options
RUN sed 's|"extends": "../../tsconfig.json"|"extends": "./tsconfig.base.json"|g' tsconfig.json.orig | \
    sed 's|"allowSyntheticDefaultImports": true|"allowSyntheticDefaultImports": true,\n    "skipLibCheck": true,\n    "downlevelIteration": true|g' > tsconfig.json

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]