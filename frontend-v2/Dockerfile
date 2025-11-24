# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (cached unless package files change)
RUN npm ci

# Copy source code (changes frequently, so comes after deps)
COPY . .

# Build app
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
