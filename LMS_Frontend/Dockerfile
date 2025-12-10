# Multi-stage build for production
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY LMS_Frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY LMS_Frontend/ ./

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
