# Stage 1: Build the application
FROM node:22.12-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies (cached unless package files change)
RUN npm ci

# Copy source code (changes frequently, so comes after deps)
COPY frontend/ ./

# Build application
RUN npm run build

# ---    

# Stage 2: Create the production image
FROM node:22.12-alpine

# Set working directory for the production image
WORKDIR /app/frontend

# Copy frontend package.json for production dependencies
COPY frontend/package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the built application from the builder stage
COPY --from=builder /app/frontend/dist ./dist/

# The command to run the application
CMD [ "npm", "run", "preview" ]
