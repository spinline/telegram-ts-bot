# Stage 1: Build the application
FROM node:18 AS builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install all dependencies, including devDependencies needed for build
RUN npm install

# Copy application source code
COPY . .

# Build the TypeScript source code to JavaScript
WORKDIR /usr/src/app/frontend # Frontend klasörüne geç
RUN npm run build

# ---

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/frontend/dist ./dist # Frontend dist klasörünü kopyala

# The command to run the application
CMD [ "node", "dist/index.js" ]
