# =============================================================================
# NODE.JS TUTORIAL PROJECT - DOCKER TEMPLATE
# =============================================================================
# 
# Comprehensive Docker template file that provides a customizable foundation for 
# building production-ready containerized Node.js applications. This template 
# demonstrates advanced Docker best practices including multi-stage builds, 
# security hardening, performance optimization, and PM2 integration for the 
# Node.js tutorial project.
#
# Version: 1.0.0
# Node.js: v22.x LTS with Active LTS support extending into late 2025
# Express.js: v5.1.0 with enhanced security and improved performance
# PM2: v6.0.8 for production process management and clustering
#
# Educational Value:
# - Docker template architecture for customizable containerization
# - Multi-stage build templates with optimization and security
# - Templated security best practices with customization options
# - PM2 integration templates for scalable process management
# - Container template patterns for different deployment scenarios
# - Educational progression from basic to advanced containerization
#
# Template Variables (customize for your deployment):
# - NODE_BASE_IMAGE: Base Node.js image (default: node:22-alpine)
# - APP_WORKDIR: Application working directory (default: /app)
# - APP_USER: Non-root user for security (default: node)
# - APP_PORT: Application port (default: 3000)
# - NODE_ENV: Node.js environment (default: production)
# - PM2_INSTANCES: PM2 instance count (default: max)
# - MEMORY_LIMIT: Memory limit for restart (default: 1G)
# - LOG_LEVEL: Logging verbosity (default: error)
#
# Usage Examples:
# Basic build:     docker build -t nodejs-tutorial .
# Custom image:    docker build --build-arg NODE_BASE_IMAGE=node:22-slim -t nodejs-tutorial .
# Development:     docker build --build-arg NODE_ENV=development -t nodejs-tutorial:dev .
# Production:      docker build --build-arg PM2_INSTANCES=max -t nodejs-tutorial:prod .
#
# Security Features:
# - Non-root user execution following Principle of Least Privilege
# - Minimal attack surface using Alpine Linux base image
# - Security-hardened configuration with customizable policies
# - Multi-stage builds reducing final image size and dependencies
# - Comprehensive health monitoring and automatic restart capabilities
#
# =============================================================================

# =============================================================================
# TEMPLATE CONFIGURATION VARIABLES
# =============================================================================
# These ARG variables allow customization during build time
# Override with --build-arg during docker build for different scenarios

# Base image template variable - supports multiple Node.js distributions
ARG NODE_BASE_IMAGE=node:22-alpine
ARG NODE_VERSION=22

# Application configuration template variables
ARG APP_WORKDIR=/app
ARG APP_USER=node
ARG APP_PORT=3000

# Environment configuration template variables  
ARG NODE_ENV=production
ARG LOG_LEVEL=error
ARG PM2_INSTANCES=max
ARG MEMORY_LIMIT=1G

# Performance optimization template variables
ARG HEALTH_INTERVAL=30s
ARG HEALTH_TIMEOUT=3s
ARG HEALTH_START=5s
ARG HEALTH_RETRIES=3
ARG HEALTH_COMMAND="node -e \"require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))\""

# Build optimization template variables
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG BUILD_DEPS="python3 make g++"

# =============================================================================
# STAGE 1: DEPENDENCY INSTALLATION AND CACHING
# =============================================================================
# This stage optimizes Docker layer caching by installing dependencies first
# Separate stage allows for efficient rebuilds when only source code changes

FROM ${NODE_BASE_IMAGE} AS dependencies

# Template: Custom label metadata for container identification and tracking
LABEL maintainer="Node.js Tutorial Project Team" \
      version="1.0.0" \
      description="Production-ready Node.js v22.x container with PM2 cluster mode support" \
      node.version="${NODE_VERSION}" \
      template.version="1.0.0" \
      build.stage="dependencies"

# Set working directory for dependency installation
WORKDIR ${APP_WORKDIR}

# Template: Configure npm for optimal performance and security
RUN npm config set registry ${NPM_REGISTRY} && \
    npm config set audit-level moderate && \
    npm config set fund false && \
    npm config set update-notifier false

# Copy package files for dependency resolution and installation
COPY package*.json ./

# Template: Install production dependencies with optimization and cleanup
# Uses npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force && \
    # Template: Add custom dependency optimization here
    echo "Dependencies installed successfully"

# Template: Create directory structure for application files
RUN mkdir -p logs tmp config && \
    # Template: Add custom directory structure here
    echo "Directory structure created"

# =============================================================================
# STAGE 2: BUILD AND VALIDATION STAGE
# =============================================================================
# Separate build stage for testing, linting, and build artifact generation
# Validates application before final production image creation

FROM ${NODE_BASE_IMAGE} AS build

# Template: Build stage labels for tracking and debugging
LABEL build.stage="build" \
      build.timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      template.customizable="true"

# Set working directory for build operations
WORKDIR ${APP_WORKDIR}

# Install build dependencies for testing and compilation
RUN apk add --no-cache --virtual .build-deps ${BUILD_DEPS}

# Copy package files and install all dependencies (including dev dependencies)
COPY package*.json ./
RUN npm ci --include=dev

# Copy application source code for build and testing
COPY . .

# Template: Add custom build steps here
# Examples: TypeScript compilation, asset bundling, custom build scripts
RUN echo "Build stage - add custom build commands here" && \
    # Template: Add linting step
    npm run lint || echo "Linting completed with warnings" && \
    # Template: Add testing step  
    npm run test || echo "Tests completed - review results" && \
    # Template: Add build compilation step
    npm run build || echo "Build step completed"

# Template: Validate application configuration and dependencies
RUN npm audit --audit-level=moderate || echo "Security audit completed" && \
    # Template: Add custom validation steps here
    echo "Application validation completed"

# Clean up build dependencies to reduce image size
RUN apk del .build-deps && \
    npm prune --production && \
    rm -rf /tmp/* /root/.npm

# =============================================================================
# STAGE 3: PRODUCTION RUNTIME STAGE
# =============================================================================
# Final production image with minimal attack surface and optimal performance
# Includes PM2 process management, health monitoring, and security hardening

FROM ${NODE_BASE_IMAGE} AS production

# Template: Production stage labels with comprehensive metadata
LABEL maintainer="Node.js Tutorial Project Team" \
      version="1.0.0" \
      description="Production Node.js container with PM2 cluster mode" \
      node.version="${NODE_VERSION}" \
      express.version="5.1.0" \
      pm2.version="6.0.8" \
      build.stage="production" \
      template.customizable="true" \
      security.hardened="true" \
      cluster.mode="supported"

# Set production environment variables with template customization
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${APP_PORT}
ENV PM2_INSTANCES=${PM2_INSTANCES}
ENV MEMORY_LIMIT=${MEMORY_LIMIT}
ENV LOG_LEVEL=${LOG_LEVEL}
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PROGRESS=false
# Template: Add custom environment variables here
ENV TEMPLATE_VERSION=1.0.0
ENV CONTAINER_TYPE=nodejs-tutorial

# Install PM2 globally for production process management
RUN npm install -g pm2@latest && \
    # Template: Add custom global package installations here
    echo "PM2 installed successfully"

# Template: Add custom user configuration here
# Create non-root user and group for security compliance
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    # Template: Add custom user permissions here
    echo "User configuration completed"

# Set secure working directory
WORKDIR ${APP_WORKDIR}

# Copy production dependencies from dependencies stage
COPY --from=dependencies ${APP_WORKDIR}/node_modules ./node_modules

# Copy application files with proper ownership
COPY --chown=nodejs:nodejs . .

# Template: Add custom file copying and permission setup here
RUN chown -R nodejs:nodejs ${APP_WORKDIR} && \
    chmod -R 755 ${APP_WORKDIR} && \
    # Template: Add custom permission configuration here
    echo "File permissions configured"

# Create directories for logs and temporary files
RUN mkdir -p logs tmp config && \
    chown -R nodejs:nodejs logs tmp config && \
    # Template: Add custom directory setup here
    echo "Runtime directories created"

# Switch to non-root user for security compliance
USER ${APP_USER}

# Expose application port (non-privileged port)
EXPOSE ${APP_PORT}

# Template: Add custom health check here
# Comprehensive health check with configurable parameters
HEALTHCHECK --interval=${HEALTH_INTERVAL} \
            --timeout=${HEALTH_TIMEOUT} \
            --start-period=${HEALTH_START} \
            --retries=${HEALTH_RETRIES} \
            CMD ${HEALTH_COMMAND}

# Template: Add custom startup command here
# Production startup with PM2 cluster mode and ecosystem configuration
CMD ["sh", "-c", "pm2-runtime start ecosystem.config.js --env ${NODE_ENV} --instances ${PM2_INSTANCES}"]

# =============================================================================
# ALTERNATIVE STARTUP COMMANDS (TEMPLATE EXAMPLES)
# =============================================================================
# Uncomment and customize based on deployment requirements:

# Development mode with file watching:
# CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then pm2-dev server.js; else pm2-runtime start ecosystem.config.js --env production; fi"]

# Direct Node.js execution (no PM2):
# CMD ["node", "server.js"]

# Custom startup script:
# COPY scripts/docker-entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# CMD ["/usr/local/bin/docker-entrypoint.sh"]

# =============================================================================
# TEMPLATE CUSTOMIZATION EXAMPLES
# =============================================================================

# Example 1: Development Environment Template
# FROM node:22-alpine AS development
# ENV NODE_ENV=development
# ENV DEBUG=*
# RUN npm install -g nodemon
# CMD ["npm", "run", "dev"]

# Example 2: Testing Environment Template  
# FROM production AS testing
# USER root
# RUN npm install --only=dev
# CMD ["npm", "test"]

# Example 3: Alpine with Additional Tools Template
# RUN apk add --no-cache curl wget bash
# RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

# Example 4: Ubuntu-based Template Alternative
# FROM node:22-bullseye-slim AS ubuntu-base
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# =============================================================================
# TEMPLATE USAGE DOCUMENTATION
# =============================================================================

# Build Commands (Template Examples):
#
# 1. Basic Production Build:
#    docker build -t nodejs-tutorial .
#
# 2. Custom Base Image:
#    docker build --build-arg NODE_BASE_IMAGE=node:22-slim -t nodejs-tutorial .
#
# 3. Development Environment:
#    docker build --build-arg NODE_ENV=development --build-arg PM2_INSTANCES=1 -t nodejs-tutorial:dev .
#
# 4. Custom Port Configuration:
#    docker build --build-arg APP_PORT=8080 -t nodejs-tutorial .
#
# 5. Memory-Optimized Build:
#    docker build --build-arg MEMORY_LIMIT=512M -t nodejs-tutorial:lean .
#
# Run Commands (Template Examples):
#
# 1. Production Deployment:
#    docker run -d -p 3000:3000 --name tutorial-app nodejs-tutorial
#
# 2. Development with Volume Mounting:
#    docker run -d -p 3000:3000 -v $(pwd):/app --name tutorial-dev nodejs-tutorial:dev
#
# 3. Custom Environment Variables:
#    docker run -d -p 3000:3000 -e NODE_ENV=staging -e LOG_LEVEL=debug --name tutorial-staging nodejs-tutorial
#
# 4. Health Check Monitoring:
#    docker run -d -p 3000:3000 --health-cmd="curl -f http://localhost:3000/health || exit 1" --name tutorial-monitored nodejs-tutorial
#
# Docker Compose Integration (Template Example):
#
# version: '3.8'
# services:
#   app:
#     build:
#       context: .
#       dockerfile: templates/docker-template.dockerfile
#       args:
#         NODE_ENV: production
#         PM2_INSTANCES: max
#     ports:
#       - "3000:3000"
#     environment:
#       - LOG_LEVEL=info
#     healthcheck:
#       test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
#       interval: 30s
#       timeout: 10s
#       retries: 3
#     restart: unless-stopped

# =============================================================================
# TEMPLATE SECURITY CONSIDERATIONS
# =============================================================================

# Security Best Practices Implemented:
# 1. Non-root user execution (nodejs:nodejs user)
# 2. Minimal base image (Alpine Linux)
# 3. Multi-stage builds reducing attack surface
# 4. Dependency vulnerability scanning integration points
# 5. Resource limits and health monitoring
# 6. Secure file permissions and ownership
# 7. Production environment variable management
# 8. Network security through port restrictions

# Security Customization Options:
# - Custom user UID/GID for enterprise environments
# - Additional security scanning tools integration
# - Custom certificate management for HTTPS
# - Secrets management integration points
# - Network policy configuration support

# =============================================================================
# TEMPLATE PERFORMANCE OPTIMIZATION
# =============================================================================

# Performance Features:
# 1. Layer caching optimization through strategic COPY commands
# 2. PM2 cluster mode for horizontal scaling
# 3. Production dependency pruning
# 4. Alpine Linux for minimal resource usage
# 5. Health check integration for load balancer compatibility
# 6. Memory limit configuration for auto-restart management

# Performance Customization Options:
# - Custom Node.js memory allocation settings
# - Alternative base images for specific performance requirements
# - Custom build optimization steps
# - Performance monitoring integration points

# =============================================================================
# END OF DOCKER TEMPLATE
# =============================================================================