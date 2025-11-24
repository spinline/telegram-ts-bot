# ---------- Build stage ----------
FROM node:22.13.0-alpine AS build
WORKDIR /app

# Copy package files and npm config first (changes less frequently)
COPY package*.json .npmrc ./

# Install dependencies (cached unless package files change)
RUN npm ci

# Copy source code (changes frequently, so comes after deps)
COPY . .

# Build app
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
