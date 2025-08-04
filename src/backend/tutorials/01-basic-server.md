# Phase 1: Basic HTTP Server Implementation Tutorial

A comprehensive educational guide for building foundational Node.js HTTP servers using core modules, modern ES patterns, and production-ready practices.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites and Environment Setup](#prerequisites-and-environment-setup)
3. [HTTP Fundamentals](#http-fundamentals)
4. [Basic Server Implementation](#basic-server-implementation)
5. [Request Handling Patterns](#request-handling-patterns)
6. [Logging Implementation](#logging-implementation)
7. [Graceful Shutdown Implementation](#graceful-shutdown-implementation)
8. [Performance Optimization](#performance-optimization)
9. [Testing and Validation](#testing-and-validation)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Next Steps Preparation](#next-steps-preparation)

---

## Introduction

Welcome to **Phase 1** of the Progressive Node.js Tutorial Project! This comprehensive tutorial will guide you through creating a foundational HTTP server using Node.js core modules, establishing the essential knowledge base for your journey from basic server concepts to production deployment mastery.

### What You'll Learn

In this 60-90 minute tutorial, you'll master:

- **Node.js HTTP Module**: Understanding core HTTP server capabilities and request/response cycles
- **Modern ES Modules**: Implementing ES2022+ import/export patterns as the default standard for Node.js v22.x LTS
- **Production-Ready Patterns**: Graceful shutdown procedures, comprehensive logging, and error handling
- **Performance Awareness**: Response time measurement and optimization techniques under 100ms targets
- **Foundation Building**: Preparing for Express.js framework integration in Phase 2

### Tutorial Progression Overview

This tutorial is **Phase 1** of a 7-phase educational journey:

1. **Phase 1** (Current): Basic HTTP Server Implementation
2. **Phase 2**: Express.js Framework Integration
3. **Phase 3**: Cross-Platform Flask Migration Comparison
4. **Phase 4**: Comprehensive Testing Implementation
5. **Phase 5**: PM2 Production Deployment
6. **Phase 6**: Security Hardening and Monitoring
7. **Phase 7**: Documentation and Best Practices

### Learning Philosophy

This tutorial emphasizes:
- **Hands-on Implementation**: Every concept includes working code examples
- **Production Readiness**: Patterns you'll use in real-world applications
- **Progressive Complexity**: Building knowledge systematically from basics to advanced topics
- **Cross-Platform Compatibility**: Techniques that work across different deployment environments

---

## Prerequisites and Environment Setup

### Node.js Installation Requirements

**Required Version**: Node.js v22.x LTS (Active LTS with support extending into late 2025)

#### Step 1: Install Node.js v22.x LTS

```bash
# Check current Node.js version
node --version

# Download and install Node.js v22.x LTS from nodejs.org
# Or use Node Version Manager (recommended)

# Using NVM (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# Using NVM for Windows
# Download and install from: https://github.com/coreybutler/nvm-windows
nvm install 22.0.0
nvm use 22.0.0
```

#### Step 2: Verify Installation

```bash
# Verify Node.js version (should show v22.x.x)
node --version

# Verify npm availability (should show 10.x.x or higher)
npm --version

# Check ES Modules support
node --input-type=module --eval "console.log('ES Modules supported!')"
```

### Project Initialization

#### Step 3: Create Project Directory

```bash
# Create project directory
mkdir nodejs-tutorial-project
cd nodejs-tutorial-project

# Initialize npm project
npm init -y
```

#### Step 4: Configure ES Modules

Edit your `package.json` to enable ES Modules:

```json
{
  "name": "nodejs-tutorial-project",
  "version": "1.0.0",
  "type": "module",
  "description": "Progressive Node.js Tutorial - Phase 1: Basic HTTP Server",
  "main": "src/backend/basic-server.js",
  "scripts": {
    "start": "node src/backend/basic-server.js",
    "dev": "node --watch src/backend/basic-server.js",
    "test": "node src/backend/examples/basic-usage.js"
  },
  "keywords": ["nodejs", "http", "server", "tutorial", "es-modules"],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=22.0.0"
  }
}
```

#### Step 5: Create Directory Structure

```bash
# Create project structure
mkdir -p src/backend/{utils,examples,config,tutorials}
mkdir -p tests docs

# Your project structure should look like:
# nodejs-tutorial-project/
# ├── src/
# │   └── backend/
# │       ├── basic-server.js
# │       ├── utils/
# │       ├── examples/
# │       ├── config/
# │       └── tutorials/
# ├── tests/
# ├── docs/
# └── package.json
```

### Development Environment Configuration

#### Step 6: Set Up Environment Variables

Create a `.env` file for development configuration:

```bash
# .env
NODE_ENV=development
SERVER_PORT=3000
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
GRACEFUL_SHUTDOWN_TIMEOUT=10000
```

#### Step 7: Configure Git (Optional but Recommended)

```bash
# Initialize Git repository
git init

# Create .gitignore
cat > .gitignore << EOF
node_modules/
.env
*.log
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
```

### Prerequisites Checklist

Before proceeding, ensure you have:

- ✅ **Node.js v22.x LTS** installed and verified
- ✅ **npm 10.x+** available and working
- ✅ **ES Modules support** confirmed
- ✅ **Project directory** created with proper structure
- ✅ **package.json** configured with `"type": "module"`
- ✅ **Development scripts** configured
- ✅ **Text editor or IDE** ready (VS Code, WebStorm, Vim, etc.)
- ✅ **Command line interface** familiarity
- ✅ **Basic JavaScript knowledge** (functions, promises, async/await)

---

## HTTP Fundamentals

Understanding HTTP protocol fundamentals is crucial for building effective web servers. Let's explore the core concepts that underpin all HTTP server implementations.

### The HTTP Request/Response Cycle

HTTP (Hypertext Transfer Protocol) is a stateless, request-response protocol that enables communication between clients and servers.

#### HTTP Request Structure

Every HTTP request contains:

```
METHOD /path/to/resource HTTP/1.1
Host: localhost:3000
User-Agent: Mozilla/5.0...
Content-Type: application/json
Content-Length: 42

{"message": "Hello, server!"}
```

**Key Components:**
- **Method**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Path**: Resource identifier (e.g., `/api/users/123`)
- **Headers**: Metadata about the request (Content-Type, Authorization, etc.)
- **Body**: Optional data payload (for POST, PUT, PATCH requests)

#### HTTP Response Structure

Every HTTP response includes:

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 26
Date: Wed, 03 Aug 2025 10:00:00 GMT

{"message": "Hello, world!"}
```

**Key Components:**
- **Status Code**: 200 (OK), 404 (Not Found), 500 (Internal Server Error), etc.
- **Headers**: Response metadata (Content-Type, Cache-Control, etc.)
- **Body**: Response data (HTML, JSON, files, etc.)

### Common HTTP Status Codes

Understanding status codes is essential for proper HTTP communication:

#### Success Codes (2xx)
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Success with no response body

#### Client Error Codes (4xx)
- **400 Bad Request**: Invalid request syntax
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded

#### Server Error Codes (5xx)
- **500 Internal Server Error**: Generic server error
- **502 Bad Gateway**: Invalid response from upstream server
- **503 Service Unavailable**: Server temporarily unavailable

### Node.js HTTP Module Capabilities

Node.js provides a powerful built-in `http` module for creating HTTP servers:

```javascript
import http from 'node:http';
import url from 'node:url';

// Create HTTP server
const server = http.createServer((request, response) => {
  // Parse request URL
  const parsedUrl = url.parse(request.url, true);
  
  // Extract request details
  const method = request.method;
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // Set response headers
  response.setHeader('Content-Type', 'application/json');
  response.statusCode = 200;
  
  // Send response
  response.end(JSON.stringify({
    method,
    pathname,
    query,
    message: 'Hello from Node.js HTTP server!'
  }));
});
```

### Key HTTP Concepts for Server Development

#### 1. Stateless Nature
- Each request is independent
- Server doesn't retain client state between requests
- Session management requires external storage (cookies, databases)

#### 2. Content Negotiation
- Clients specify preferred content types via `Accept` header
- Servers respond with appropriate `Content-Type`
- Examples: `application/json`, `text/html`, `text/plain`

#### 3. HTTP Methods and Semantics
- **GET**: Retrieve data (idempotent, cacheable)
- **POST**: Create resources (not idempotent)
- **PUT**: Update/replace resources (idempotent)
- **DELETE**: Remove resources (idempotent)
- **PATCH**: Partial updates (not necessarily idempotent)

#### 4. Headers and Metadata
- **Request Headers**: `User-Agent`, `Accept`, `Authorization`
- **Response Headers**: `Content-Type`, `Cache-Control`, `Set-Cookie`
- **Custom Headers**: Application-specific metadata

### URL Parsing and Path Extraction

Understanding URL structure is crucial for routing:

```javascript
import url from 'node:url';

const requestUrl = 'http://localhost:3000/api/users/123?page=1&limit=10';
const parsed = url.parse(requestUrl, true);

console.log({
  protocol: parsed.protocol,  // 'http:'
  host: parsed.host,         // 'localhost:3000'
  pathname: parsed.pathname, // '/api/users/123'
  query: parsed.query        // { page: '1', limit: '10' }
});
```

### Error Handling Patterns

HTTP servers must handle various error scenarios:

```javascript
// Client errors (4xx)
if (!isValidRequest(request)) {
  response.statusCode = 400;
  response.end(JSON.stringify({
    error: 'Bad Request',
    message: 'Invalid request format'
  }));
  return;
}

// Server errors (5xx)
try {
  const result = await processRequest(request);
  response.end(JSON.stringify(result));
} catch (error) {
  response.statusCode = 500;
  response.end(JSON.stringify({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }));
}
```

These HTTP fundamentals form the foundation for all web server implementations. In the next section, we'll apply these concepts to build our basic HTTP server using Node.js core modules.

---

## Basic Server Implementation

Now let's build our foundational HTTP server using Node.js core modules and modern ES Module patterns. This implementation will serve as the basis for all subsequent tutorial phases.

### Core Server Implementation

Create `src/backend/basic-server.js`:

```javascript
/**
 * Basic HTTP Server Implementation - Tutorial Phase 1
 * 
 * A foundational HTTP server using Node.js core modules with modern ES Modules,
 * comprehensive logging, graceful shutdown, and production-ready patterns.
 */

// Node.js core modules using ES Module imports
import http from 'node:http';
import url from 'node:url';
import { performance } from 'node:perf_hooks';

// Internal module imports (we'll create these)
import logger from './utils/logger.js';
import { HTTP_CONSTANTS, SERVER_CONSTANTS } from './utils/constants.js';
import { createEnvironmentConfig } from './config/environment.js';

// Application configuration
const config = createEnvironmentConfig();
const PORT = config.server.port || 3000;
const HOST = config.server.host || 'localhost';

// Server state management
let server;
let isShuttingDown = false;
let requestCount = 0;
let startTime = Date.now();

/**
 * Creates the main request handler function
 * Processes all incoming HTTP requests with logging and error handling
 */
function createRequestHandler() {
  return async (request, response) => {
    // Generate unique request ID for correlation
    const requestId = generateRequestId();
    const requestStart = performance.now();
    
    // Increment request counter
    requestCount++;
    
    try {
      // Parse request URL and extract components
      const parsedUrl = url.parse(request.url, true);
      const method = request.method;
      const pathname = parsedUrl.pathname;
      const query = parsedUrl.query;
      
      // Log incoming request
      logger.info('Incoming request', {
        requestId,
        method,
        pathname,
        query,
        userAgent: request.headers['user-agent'],
        ip: request.connection.remoteAddress
      });
      
      // Set security headers
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('X-XSS-Protection', '1; mode=block');
      response.setHeader('X-Request-ID', requestId);
      
      // Handle different routes
      let responseData;
      let statusCode = HTTP_CONSTANTS.STATUS_CODES.OK;
      
      switch (pathname) {
        case '/':
          responseData = {
            message: 'Hello world',
            timestamp: new Date().toISOString(),
            requestId,
            server: 'Node.js Basic HTTP Server',
            version: '1.0.0'
          };
          break;
          
        case '/health':
          responseData = createHealthResponse();
          break;
          
        case '/metrics':
          responseData = createMetricsResponse();
          break;
          
        default:
          statusCode = HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND;
          responseData = {
            error: 'Not Found',
            message: `Resource ${pathname} not found`,
            requestId,
            timestamp: new Date().toISOString()
          };
      }
      
      // Set response headers
      response.setHeader('Content-Type', HTTP_CONSTANTS.CONTENT_TYPES.JSON);
      response.statusCode = statusCode;
      
      // Send response
      const responseBody = JSON.stringify(responseData, null, 2);
      response.end(responseBody);
      
      // Calculate response time
      const responseTime = performance.now() - requestStart;
      
      // Log response
      logger.info('Request completed', {
        requestId,
        method,
        pathname,
        statusCode,
        responseTime: `${responseTime.toFixed(2)}ms`,
        contentLength: Buffer.byteLength(responseBody)
      });
      
      // Performance warning if response time exceeds threshold
      if (responseTime > SERVER_CONSTANTS.PERFORMANCE.MAX_RESPONSE_TIME) {
        logger.warn('Slow response detected', {
          requestId,
          responseTime: `${responseTime.toFixed(2)}ms`,
          threshold: `${SERVER_CONSTANTS.PERFORMANCE.MAX_RESPONSE_TIME}ms`
        });
      }
      
    } catch (error) {
      // Handle errors with comprehensive logging
      handleRequestError(error, request, response, requestId);
    }
  };
}

/**
 * Generates unique request ID for correlation
 */
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates health check response with server status
 */
function createHealthResponse() {
  const uptime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    uptime: `${Math.floor(uptime / 1000)}s`,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    },
    requests: {
      total: requestCount,
      averagePerSecond: Math.round(requestCount / (uptime / 1000))
    }
  };
}

/**
 * Creates metrics response with performance data
 */
function createMetricsResponse() {
  const uptime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    server: {
      uptime: Math.floor(uptime / 1000),
      startTime: new Date(startTime).toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    },
    requests: {
      total: requestCount,
      rate: Math.round(requestCount / (uptime / 1000))
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    }
  };
}

/**
 * Handles request errors with proper logging and response
 */
function handleRequestError(error, request, response, requestId) {
  logger.error('Request error occurred', {
    requestId,
    error: error.message,
    stack: error.stack,
    method: request.method,
    url: request.url
  });
  
  // Ensure response hasn't been sent already
  if (!response.headersSent) {
    response.statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
    response.setHeader('Content-Type', HTTP_CONSTANTS.CONTENT_TYPES.JSON);
    response.end(JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      requestId,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Starts the HTTP server with proper error handling
 */
async function startServer() {
  try {
    // Create server with request handler
    server = http.createServer(createRequestHandler());
    
    // Configure server settings
    server.keepAliveTimeout = SERVER_CONSTANTS.KEEP_ALIVE_TIMEOUT;
    server.headersTimeout = SERVER_CONSTANTS.HEADERS_TIMEOUT;
    server.timeout = SERVER_CONSTANTS.REQUEST_TIMEOUT;
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`, { port: PORT, error: error.message });
        process.exit(1);
      } else {
        logger.error('Server error occurred', { error: error.message, stack: error.stack });
      }
    });
    
    // Start listening
    server.listen(PORT, HOST, () => {
      logger.info('HTTP server started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid,
        timestamp: new Date().toISOString()
      });
      
      console.log(`\n🚀 Server running at http://${HOST}:${PORT}/`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`📈 Metrics: http://${HOST}:${PORT}/metrics`);
      console.log(`\n👋 Try: curl http://${HOST}:${PORT}/\n`);
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * Implements graceful shutdown procedures
 */
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit');
      process.exit(1);
    }
    
    isShuttingDown = true;
    
    logger.info('Graceful shutdown initiated', { 
      signal,
      uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
      totalRequests: requestCount
    });
    
    // Stop accepting new connections
    server.close((error) => {
      if (error) {
        logger.error('Error during server shutdown', { error: error.message });
        process.exit(1);
      }
      
      logger.info('HTTP server closed successfully', {
        totalRequests: requestCount,
        uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`
      });
      
      process.exit(0);
    });
    
    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
      logger.warn('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, SERVER_CONSTANTS.GRACEFUL_SHUTDOWN_TIMEOUT);
  };
  
  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { reason, promise });
    shutdown('unhandledRejection');
  });
}

/**
 * Main application entry point
 */
async function main() {
  try {
    // Set up graceful shutdown
    setupGracefulShutdown();
    
    // Start the server
    await startServer();
    
  } catch (error) {
    logger.error('Application startup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export functions for testing and reuse
export {
  createRequestHandler,
  startServer,
  setupGracefulShutdown,
  generateRequestId,
  createHealthResponse,
  createMetricsResponse
};
```

### Key Implementation Features

#### 1. **Modern ES Modules**
- Uses `import`/`export` syntax throughout
- Node.js v22.x native ES Module support
- Proper file extensions (`.js`) for relative imports

#### 2. **Request Correlation**
- Unique request IDs for distributed tracing
- Comprehensive request/response logging
- Performance timing measurement

#### 3. **Security Headers**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Custom `X-Request-ID` header

#### 4. **Multiple Endpoints**
- `/` - Basic "Hello world" response
- `/health` - Health check with server metrics
- `/metrics` - Detailed performance metrics
- `404` handling for unknown routes

#### 5. **Error Handling**
- Comprehensive try/catch blocks
- Proper HTTP status codes
- Structured error responses
- Stack trace logging (development)

#### 6. **Performance Monitoring**
- Response time measurement
- Slow response warnings
- Request counting
- Memory usage tracking

### Testing Your Basic Server

#### Step 1: Create Required Dependencies

First, create the essential utility files referenced in our server:

**`src/backend/utils/constants.js`** (simplified version):
```javascript
export const HTTP_CONSTANTS = {
  STATUS_CODES: {
    OK: 200,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },
  CONTENT_TYPES: {
    JSON: 'application/json',
    HTML: 'text/html',
    TEXT: 'text/plain'
  }
};

export const SERVER_CONSTANTS = {
  PERFORMANCE: {
    MAX_RESPONSE_TIME: 100 // milliseconds
  },
  KEEP_ALIVE_TIMEOUT: 65000,
  HEADERS_TIMEOUT: 66000,
  REQUEST_TIMEOUT: 30000,
  GRACEFUL_SHUTDOWN_TIMEOUT: 10000
};
```

**`src/backend/utils/logger.js`** (simplified version):
```javascript
function createLogger() {
  const log = (level, message, metadata = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...metadata,
      pid: process.pid
    };
    
    console.log(JSON.stringify(logEntry, null, 2));
  };
  
  return {
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata),
    debug: (message, metadata) => log('debug', message, metadata)
  };
}

export default createLogger();
```

**`src/backend/config/environment.js`** (simplified version):
```javascript
export function createEnvironmentConfig() {
  return {
    server: {
      port: process.env.SERVER_PORT || 3000,
      host: process.env.SERVER_HOST || 'localhost'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info'
    },
    environment: process.env.NODE_ENV || 'development'
  };
}
```

#### Step 2: Start Your Server

```bash
# Using npm script
npm start

# Or directly with Node.js
node src/backend/basic-server.js

# Using watch mode for development
npm run dev
```

#### Step 3: Test Server Endpoints

```bash
# Test basic endpoint
curl http://localhost:3000/
curl -i http://localhost:3000/

# Test health check
curl http://localhost:3000/health

# Test metrics
curl http://localhost:3000/metrics

# Test 404 handling
curl http://localhost:3000/nonexistent

# Test with different methods
curl -X POST http://localhost:3000/
curl -X PUT http://localhost:3000/
```

#### Expected Responses

**Basic endpoint (`/`)**:
```json
{
  "message": "Hello world",
  "timestamp": "2025-08-03T10:00:00.000Z",
  "requestId": "req-1722679200000-abc123def",
  "server": "Node.js Basic HTTP Server",
  "version": "1.0.0"
}
```

**Health check (`/health`)**:
```json
{
  "status": "healthy",
  "uptime": "45s",
  "timestamp": "2025-08-03T10:00:45.000Z",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "used": "12MB",
    "total": "18MB"
  },
  "requests": {
    "total": 3,
    "averagePerSecond": 0
  }
}
```

### Verification Checklist

Ensure your server implementation:

- ✅ **Starts successfully** on port 3000
- ✅ **Responds to requests** with proper JSON formatting
- ✅ **Includes security headers** in all responses
- ✅ **Logs requests and responses** with structured data
- ✅ **Handles errors gracefully** without crashing
- ✅ **Measures performance** and warns on slow responses
- ✅ **Provides health checks** and metrics endpoints
- ✅ **Implements 404 handling** for unknown routes

This basic server implementation establishes the foundation for all subsequent tutorial phases. The patterns you've learned here—ES Modules, structured logging, error handling, and performance monitoring—are essential skills for Node.js development.

---

## Request Handling Patterns

Understanding sophisticated request handling patterns is crucial for building robust HTTP servers. Let's explore advanced techniques for parsing requests, extracting data, and formatting responses.

### Advanced URL Parsing and Route Handling

```javascript
import url from 'node:url';
import querystring from 'node:querystring';

/**
 * Advanced request parser that extracts comprehensive request information
 */
function parseRequest(request) {
  // Parse URL components
  const parsedUrl = url.parse(request.url, true);
  
  // Extract path segments for route matching
  const pathSegments = parsedUrl.pathname
    .split('/')
    .filter(segment => segment.length > 0);
  
  // Parse query parameters with type coercion
  const query = parseQueryParameters(parsedUrl.query);
  
  // Extract headers with normalization
  const headers = normalizeHeaders(request.headers);
  
  // Generate request fingerprint for caching/rate limiting
  const fingerprint = generateRequestFingerprint(request);
  
  return {
    method: request.method,
    url: request.url,
    pathname: parsedUrl.pathname,
    pathSegments,
    query,
    headers,
    fingerprint,
    timestamp: new Date().toISOString(),
    httpVersion: request.httpVersion,
    remoteAddress: request.connection.remoteAddress,
    remotePort: request.connection.remotePort
  };
}

/**
 * Parses query parameters with intelligent type conversion
 */
function parseQueryParameters(queryObj) {
  const parsed = {};
  
  for (const [key, value] of Object.entries(queryObj)) {
    // Handle array parameters (e.g., ?tags=js&tags=node)
    if (Array.isArray(value)) {
      parsed[key] = value.map(convertQueryValue);
    } else {
      parsed[key] = convertQueryValue(value);
    }
  }
  
  return parsed;
}

/**
 * Converts query string values to appropriate types
 */
function convertQueryValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  
  // Try to convert to number
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  
  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  
  return value;
}

/**
 * Normalizes HTTP headers for consistent access
 */
function normalizeHeaders(headers) {
  const normalized = {};
  
  for (const [key, value] of Object.entries(headers)) {
    // Convert to lowercase for consistent access
    const normalizedKey = key.toLowerCase();
    normalized[normalizedKey] = value;
    
    // Also provide camelCase version for common headers
    if (normalizedKey === 'content-type') {
      normalized.contentType = value;
    } else if (normalizedKey === 'user-agent') {
      normalized.userAgent = value;
    } else if (normalizedKey === 'authorization') {
      normalized.authorization = value;
    }
  }
  
  return normalized;
}

/**
 * Generates request fingerprint for identification and rate limiting
 */
function generateRequestFingerprint(request) {
  const components = [
    request.connection.remoteAddress,
    request.headers['user-agent'] || 'unknown',
    request.method,
    url.parse(request.url).pathname
  ];
  
  return Buffer.from(components.join('|')).toString('base64').substring(0, 16);
}
```

### Request Body Processing

```javascript
/**
 * Processes request body with support for different content types
 */
async function processRequestBody(request) {
  return new Promise((resolve, reject) => {
    const contentType = request.headers['content-type'] || '';
    const contentLength = parseInt(request.headers['content-length'] || '0', 10);
    
    // Validate content length
    if (contentLength > MAX_BODY_SIZE) {
      reject(new Error(`Request body too large: ${contentLength} bytes`));
      return;
    }
    
    let body = '';
    let rawBody = Buffer.alloc(0);
    
    // Handle request body chunks
    request.on('data', (chunk) => {
      rawBody = Buffer.concat([rawBody, chunk]);
      
      // Check if body size exceeds limit
      if (rawBody.length > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'));
        return;
      }
    });
    
    request.on('end', () => {
      try {
        body = rawBody.toString('utf8');
        
        // Parse body based on content type
        let parsedBody;
        
        if (contentType.includes('application/json')) {
          parsedBody = parseJSONBody(body);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          parsedBody = parseFormBody(body);
        } else if (contentType.includes('multipart/form-data')) {
          // For this tutorial, we'll keep it simple
          parsedBody = { raw: body, type: 'multipart' };
        } else {
          parsedBody = { raw: body, type: 'text' };
        }
        
        resolve({
          raw: body,
          parsed: parsedBody,
          contentType: contentType,
          size: rawBody.length
        });
        
      } catch (error) {
        reject(new Error(`Failed to parse request body: ${error.message}`));
      }
    });
    
    request.on('error', (error) => {
      reject(new Error(`Request body error: ${error.message}`));
    });
  });
}

/**
 * Parses JSON request body with error handling
 */
function parseJSONBody(body) {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Parses form-encoded request body
 */
function parseFormBody(body) {
  return querystring.parse(body);
}

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit
```

### Response Formatting and Headers

```javascript
/**
 * Creates standardized HTTP response with proper headers and formatting
 */
function createResponse(data, options = {}) {
  const {
    statusCode = 200,
    headers = {},
    requestId = generateRequestId(),
    includeMetadata = true,
    format = 'json'
  } = options;
  
  // Standard response headers
  const standardHeaders = {
    'Content-Type': getContentType(format),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Request-ID': requestId,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...headers
  };
  
  // Prepare response body
  let responseBody;
  
  if (format === 'json') {
    const responseData = includeMetadata ? 
      addResponseMetadata(data, { requestId, statusCode }) : 
      data;
    
    responseBody = JSON.stringify(responseData, null, 2);
  } else if (format === 'html') {
    responseBody = createHTMLResponse(data, { requestId, statusCode });
  } else {
    responseBody = String(data);
  }
  
  // Add content length header
  standardHeaders['Content-Length'] = Buffer.byteLength(responseBody, 'utf8');
  
  return {
    statusCode,
    headers: standardHeaders,
    body: responseBody
  };
}

/**
 * Adds metadata to response for consistency and debugging
 */
function addResponseMetadata(data, metadata) {
  const { requestId, statusCode } = metadata;
  
  // For error responses
  if (statusCode >= 400) {
    return {
      error: true,
      statusCode,
      message: data.message || 'An error occurred',
      code: data.code || 'UNKNOWN_ERROR',
      requestId,
      timestamp: new Date().toISOString(),
      ...data
    };
  }
  
  // For successful responses
  return {
    success: true,
    statusCode,
    data: data,
    requestId,
    timestamp: new Date().toISOString(),
    meta: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  };
}

/**
 * Creates HTML response for non-API endpoints
 */
function createHTMLResponse(data, metadata) {
  const { requestId, statusCode } = metadata;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Node.js Basic Server</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { color: ${statusCode >= 400 ? '#e74c3c' : '#27ae60'}; }
        .metadata { color: #7f8c8d; font-size: 0.9em; margin-top: 20px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Node.js Basic HTTP Server</h1>
        <p class="status">Status: ${statusCode} ${getStatusText(statusCode)}</p>
        
        <h2>Response Data</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        
        <div class="metadata">
            <p>Request ID: ${requestId}</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>Server: Node.js ${process.version}</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Gets content type for response format
 */
function getContentType(format) {
  const contentTypes = {
    json: 'application/json; charset=utf-8',
    html: 'text/html; charset=utf-8',
    text: 'text/plain; charset=utf-8',
    xml: 'application/xml; charset=utf-8'
  };
  
  return contentTypes[format] || contentTypes.text;
}

/**
 * Gets HTTP status text for status code
 */
function getStatusText(statusCode) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return statusTexts[statusCode] || 'Unknown Status';
}
```

### Enhanced Request Handler with Pattern Matching

```javascript
/**
 * Enhanced request handler with pattern matching and middleware support
 */
function createEnhancedRequestHandler() {
  return async (request, response) => {
    const requestId = generateRequestId();
    const startTime = performance.now();
    
    try {
      // Parse request comprehensively
      const parsedRequest = parseRequest(request);
      
      // Add request body if present
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        parsedRequest.body = await processRequestBody(request);
      }
      
      // Log request with full details
      logger.info('Enhanced request processing', {
        requestId,
        method: parsedRequest.method,
        pathname: parsedRequest.pathname,
        query: parsedRequest.query,
        headers: {
          userAgent: parsedRequest.headers.userAgent,
          contentType: parsedRequest.headers.contentType,
          authorization: parsedRequest.headers.authorization ? '[PRESENT]' : '[NONE]'
        },
        fingerprint: parsedRequest.fingerprint
      });
      
      // Route matching with pattern support
      const routeMatch = matchRoute(parsedRequest);
      
      if (!routeMatch) {
        const errorResponse = createResponse(
          { message: `Resource ${parsedRequest.pathname} not found` },
          { statusCode: 404, requestId }
        );
        sendResponse(response, errorResponse);
        return;
      }
      
      // Execute route handler
      const result = await routeMatch.handler(parsedRequest, routeMatch.params);
      
      // Create and send response
      const responseData = createResponse(result, {
        statusCode: result.statusCode || 200,
        requestId,
        headers: result.headers
      });
      
      sendResponse(response, responseData);
      
      // Log response timing
      const responseTime = performance.now() - startTime;
      logger.info('Request completed', {
        requestId,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: responseData.statusCode,
        bodySize: responseData.headers['Content-Length']
      });
      
    } catch (error) {
      handleRequestError(error, request, response, requestId);
    }
  };
}

/**
 * Route matching with parameter extraction
 */
function matchRoute(request) {
  const routes = [
    {
      pattern: /^\/$/,
      method: 'GET',
      handler: handleHome
    },
    {
      pattern: /^\/health$/,
      method: 'GET',
      handler: handleHealth
    },
    {
      pattern: /^\/api\/users\/(\d+)$/,
      method: 'GET',
      handler: handleUserById,
      paramNames: ['userId']
    },
    {
      pattern: /^\/api\/users$/,
      method: ['GET', 'POST'],
      handler: handleUsers
    }
  ];
  
  for (const route of routes) {
    // Check method match
    const methodMatch = Array.isArray(route.method) ?
      route.method.includes(request.method) :
      route.method === request.method;
    
    if (!methodMatch) continue;
    
    // Check pattern match
    const match = request.pathname.match(route.pattern);
    if (!match) continue;
    
    // Extract parameters
    const params = {};
    if (route.paramNames && match.length > 1) {
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
    }
    
    return {
      handler: route.handler,
      params,
      route
    };
  }
  
  return null;
}

/**
 * Route handlers
 */
async function handleHome(request, params) {
  return {
    message: 'Hello world',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    requestInfo: {
      method: request.method,
      userAgent: request.headers.userAgent,
      fingerprint: request.fingerprint
    }
  };
}

async function handleHealth(request, params) {
  return createHealthResponse();
}

async function handleUserById(request, params) {
  const userId = parseInt(params.userId, 10);
  
  // Simulate user lookup
  const user = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    createdAt: new Date().toISOString()
  };
  
  return { user };
}

async function handleUsers(request, params) {
  if (request.method === 'GET') {
    // Simulate user list with pagination
    const page = request.query.page || 1;
    const limit = Math.min(request.query.limit || 10, 100);
    
    const users = Array.from({ length: limit }, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      name: `User ${(page - 1) * limit + i + 1}`,
      email: `user${(page - 1) * limit + i + 1}@example.com`
    }));
    
    return {
      users,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: 1000,
        pages: Math.ceil(1000 / limit)
      }
    };
  } else if (request.method === 'POST') {
    // Simulate user creation
    const userData = request.body.parsed;
    
    const newUser = {
      id: Math.floor(Math.random() * 10000),
      ...userData,
      createdAt: new Date().toISOString()
    };
    
    return {
      statusCode: 201,
      user: newUser,
      message: 'User created successfully'
    };
  }
}

/**
 * Sends HTTP response with proper headers and body
 */
function sendResponse(response, responseData) {
  // Set status code
  response.statusCode = responseData.statusCode;
  
  // Set headers
  Object.entries(responseData.headers).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
  
  // Send body
  response.end(responseData.body);
}
```

### Testing Enhanced Request Handling

Test the enhanced patterns with various requests:

```bash
# Test basic endpoint
curl http://localhost:3000/

# Test with query parameters
curl "http://localhost:3000/api/users?page=2&limit=5"

# Test parameterized routes
curl http://localhost:3000/api/users/123

# Test POST with JSON body
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Test form data
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Jane%20Doe&email=jane@example.com"
```

These request handling patterns provide a solid foundation for building sophisticated HTTP APIs. The techniques you've learned—URL parsing, body processing, route matching, and response formatting—are essential for any production HTTP server.

---

## Logging Implementation

Comprehensive logging is crucial for production applications. Let's implement a robust logging system that provides structured data, request correlation, and production-ready monitoring capabilities.

### Understanding Logging Levels and Structured Data

Before implementing our logger, let's understand the logging hierarchy and structured data benefits:

#### Logging Levels (in order of severity)
1. **DEBUG** - Detailed diagnostic information
2. **INFO** - General operational information  
3. **WARN** - Potentially harmful situations
4. **ERROR** - Error events that don't stop the application
5. **FATAL** - Severe errors that may cause application termination

#### Benefits of Structured Logging
- **Machine-readable**: Easy parsing by log aggregation systems
- **Consistent format**: Standardized across all log entries
- **Rich context**: Includes metadata, timestamps, and correlation IDs
- **Searchable**: Efficient filtering and querying in log systems

### Advanced Logger Implementation

Create `src/backend/utils/logger.js`:

```javascript
/**
 * Advanced Structured Logger for Node.js Tutorial Project
 * 
 * Provides comprehensive logging capabilities with structured data,
 * request correlation, performance metrics, and production-ready features.
 */

import util from 'node:util';
import { performance } from 'node:perf_hooks';

// Logging configuration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const LOG_LEVEL_NAMES = Object.keys(LOG_LEVELS);
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Color codes for console output (development only)
const COLORS = {
  DEBUG: '\x1b[36m',  // Cyan
  INFO: '\x1b[32m',   // Green
  WARN: '\x1b[33m',   // Yellow
  ERROR: '\x1b[31m',  // Red
  FATAL: '\x1b[35m',  // Magenta
  RESET: '\x1b[0m'    // Reset
};

// Global request correlation map
const REQUEST_CONTEXT = new Map();

/**
 * Advanced Logger Class with structured logging and context management
 */
class Logger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'nodejs-tutorial';
    this.version = options.version || '1.0.0';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.enableColors = options.enableColors !== false && this.environment === 'development';
    this.enableRequestLogging = options.enableRequestLogging !== false;
    
    // Performance tracking
    this.requestTimings = new Map();
    this.logMetrics = {
      total: 0,
      byLevel: Object.fromEntries(LOG_LEVEL_NAMES.map(level => [level, 0]))
    };
  }

  /**
   * Creates a structured log entry with comprehensive metadata
   */
  createLogEntry(level, message, metadata = {}) {
    // Increment metrics
    this.logMetrics.total++;
    this.logMetrics.byLevel[level]++;
    
    // Get current context
    const context = this.getCurrentContext();
    
    // Base log entry structure
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      
      // Process information
      process: {
        pid: process.pid,
        uptime: Math.floor(process.uptime()),
        memory: this.getMemoryUsage(),
        cpu: process.cpuUsage()
      },
      
      // Request context (if available)
      ...(context && { request: context }),
      
      // Additional metadata
      ...metadata,
      
      // Error handling
      ...(metadata.error && this.formatError(metadata.error))
    };
    
    // Add stack trace for errors in development
    if (level === 'ERROR' || level === 'FATAL') {
      if (metadata.error && metadata.error.stack && this.environment === 'development') {
        logEntry.stack = metadata.error.stack;
      }
    }
    
    return logEntry;
  }

  /**
   * Outputs log entry to appropriate destination
   */
  output(logEntry) {
    const levelColor = this.enableColors ? COLORS[logEntry.level] : '';
    const resetColor = this.enableColors ? COLORS.RESET : '';
    
    if (this.environment === 'development') {
      // Human-readable format for development
      const time = new Date(logEntry.timestamp).toLocaleTimeString();
      const level = `${levelColor}${logEntry.level.padEnd(5)}${resetColor}`;
      const message = logEntry.message;
      const context = logEntry.request ? `[${logEntry.request.id}]` : '';
      
      console.log(`${time} ${level} ${context} ${message}`);
      
      // Show metadata if present
      if (Object.keys(logEntry).length > 8) { // More than basic fields
        const metadata = { ...logEntry };
        delete metadata.timestamp;
        delete metadata.level;
        delete metadata.message;
        delete metadata.service;
        delete metadata.version;
        delete metadata.environment;
        delete metadata.process;
        
        console.log(`${' '.repeat(15)} ${util.inspect(metadata, { 
          colors: this.enableColors, 
          depth: 3,
          compact: false
        })}`);
      }
    } else {
      // JSON format for production
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Logs debug information (detailed diagnostic data)
   */
  debug(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      const logEntry = this.createLogEntry('DEBUG', message, metadata);
      this.output(logEntry);
    }
  }

  /**
   * Logs general information (operational events)
   */
  info(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      const logEntry = this.createLogEntry('INFO', message, metadata);
      this.output(logEntry);
    }
  }

  /**
   * Logs warnings (potentially harmful situations)
   */
  warn(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      const logEntry = this.createLogEntry('WARN', message, metadata);
      this.output(logEntry);
    }
  }

  /**
   * Logs errors (error events that don't stop the application)
   */
  error(message, metadata = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      const logEntry = this.createLogEntry('ERROR', message, metadata);
      this.output(logEntry);
    }
  }

  /**
   * Logs fatal errors (severe errors that may cause termination)
   */
  fatal(message, metadata = {}) {
    const logEntry = this.createLogEntry('FATAL', message, metadata);
    this.output(logEntry);
  }

  /**
   * Creates request-specific logger with correlation context
   */
  child(context = {}) {
    const childLogger = Object.create(this);
    childLogger.childContext = { ...this.childContext, ...context };
    return childLogger;
  }

  /**
   * Sets request context for correlation
   */
  setRequestContext(requestId, context = {}) {
    REQUEST_CONTEXT.set(requestId, {
      id: requestId,
      startTime: performance.now(),
      ...context
    });
    return requestId;
  }

  /**
   * Gets current request context
   */
  getCurrentContext() {
    // Return child context if available
    if (this.childContext) {
      return this.childContext;
    }
    
    // Try to find most recent request context
    const contexts = Array.from(REQUEST_CONTEXT.values());
    return contexts.length > 0 ? contexts[contexts.length - 1] : null;
  }

  /**
   * Clears request context (call when request completes)
   */
  clearRequestContext(requestId) {
    REQUEST_CONTEXT.delete(requestId);
  }

  /**
   * Logs request start with timing
   */
  logRequestStart(requestId, requestData) {
    if (!this.enableRequestLogging) return;
    
    this.setRequestContext(requestId, {
      method: requestData.method,
      url: requestData.url,
      userAgent: requestData.userAgent,
      ip: requestData.ip
    });
    
    this.info('Request started', {
      requestId,
      method: requestData.method,
      url: requestData.url,
      userAgent: requestData.userAgent,
      ip: requestData.ip,
      headers: this.sanitizeHeaders(requestData.headers)
    });
  }

  /**
   * Logs request completion with timing and metrics
   */
  logRequestComplete(requestId, responseData) {
    if (!this.enableRequestLogging) return;
    
    const context = REQUEST_CONTEXT.get(requestId);
    if (!context) {
      this.warn('Request context not found for completion log', { requestId });
      return;
    }
    
    const duration = performance.now() - context.startTime;
    
    this.info('Request completed', {
      requestId,
      method: context.method,
      url: context.url,
      statusCode: responseData.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: responseData.contentLength,
      userAgent: context.userAgent,
      ip: context.ip
    });
    
    // Clean up context
    this.clearRequestContext(requestId);
    
    // Log slow requests as warnings
    if (duration > 1000) { // > 1 second
      this.warn('Slow request detected', {
        requestId,
        method: context.method,
        url: context.url,
        duration: `${duration.toFixed(2)}ms`,
        threshold: '1000ms'
      });
    }
  }

  /**
   * Logs application metrics and statistics
   */
  logMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.info('Application metrics', {
      uptime: process.uptime(),
      memory: {
        rss: this.formatBytes(memoryUsage.rss),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        external: this.formatBytes(memoryUsage.external)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      logging: {
        totalLogs: this.logMetrics.total,
        byLevel: this.logMetrics.byLevel
      },
      activeRequests: REQUEST_CONTEXT.size
    });
  }

  /**
   * Formats error objects for logging
   */
  formatError(error) {
    if (!error) return {};
    
    const errorInfo = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      }
    };
    
    // Add additional error properties
    if (error.statusCode) errorInfo.error.statusCode = error.statusCode;
    if (error.syscall) errorInfo.error.syscall = error.syscall;
    if (error.errno) errorInfo.error.errno = error.errno;
    
    return errorInfo;
  }

  /**
   * Gets formatted memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss),
      heapTotal: this.formatBytes(usage.heapTotal),
      heapUsed: this.formatBytes(usage.heapUsed),
      heapUsedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      external: this.formatBytes(usage.external)
    };
  }

  /**
   * Formats bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Sanitizes headers for logging (removes sensitive information)
   */
  sanitizeHeaders(headers = {}) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

/**
 * Request ID generation utility
 */
export function generateRequestId(options = {}) {
  const prefix = options.prefix || 'req';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create logger instance with configuration
 */
function createLogger(options = {}) {
  return new Logger({
    serviceName: 'nodejs-tutorial-server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    ...options
  });
}

// Export default logger instance
const logger = createLogger();

// Export additional utilities
export {
  Logger,
  createLogger,
  generateRequestId,
  LOG_LEVELS,
  LOG_LEVEL_NAMES
};

export default logger;
```

### Enhanced Server with Comprehensive Logging

Update your `basic-server.js` to use the advanced logger:

```javascript
// Import the enhanced logger
import logger, { generateRequestId } from './utils/logger.js';

/**
 * Enhanced request handler with comprehensive logging
 */
function createRequestHandler() {
  return async (request, response) => {
    const requestId = generateRequestId();
    
    // Log request start
    logger.logRequestStart(requestId, {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.connection.remoteAddress,
      headers: request.headers
    });
    
    try {
      // Parse request
      const parsedUrl = url.parse(request.url, true);
      
      // Log request processing
      logger.debug('Processing request', {
        requestId,
        pathname: parsedUrl.pathname,
        query: parsedUrl.query,
        method: request.method
      });
      
      // Process request based on route
      let responseData;
      let statusCode = HTTP_CONSTANTS.STATUS_CODES.OK;
      
      switch (parsedUrl.pathname) {
        case '/':
          responseData = {
            message: 'Hello world',
            timestamp: new Date().toISOString(),
            requestId
          };
          logger.debug('Home route processed', { requestId });
          break;
          
        case '/health':
          responseData = createHealthResponse();
          logger.debug('Health check processed', { requestId });
          break;
          
        case '/metrics':
          responseData = createMetricsResponse();
          logger.debug('Metrics route processed', { requestId });
          break;
          
        case '/logs/metrics':
          // Special endpoint to show logging metrics
          logger.logMetrics();
          responseData = {
            message: 'Logging metrics have been recorded',
            timestamp: new Date().toISOString()
          };
          break;
          
        default:
          statusCode = HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND;
          responseData = {
            error: 'Not Found',
            message: `Resource ${parsedUrl.pathname} not found`,
            requestId
          };
          logger.warn('Route not found', { 
            requestId, 
            pathname: parsedUrl.pathname,
            method: request.method 
          });
      }
      
      // Set response headers
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('X-Request-ID', requestId);
      response.statusCode = statusCode;
      
      // Send response
      const responseBody = JSON.stringify(responseData, null, 2);
      response.end(responseBody);
      
      // Log request completion
      logger.logRequestComplete(requestId, {
        statusCode,
        contentLength: Buffer.byteLength(responseBody)
      });
      
    } catch (error) {
      // Log error with full context
      logger.error('Request processing failed', {
        requestId,
        error,
        method: request.method,
        url: request.url,
        stack: error.stack
      });
      
      // Send error response
      if (!response.headersSent) {
        response.statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('X-Request-ID', requestId);
        
        const errorResponse = {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          requestId,
          timestamp: new Date().toISOString()
        };
        
        response.end(JSON.stringify(errorResponse));
        
        // Log error response
        logger.logRequestComplete(requestId, {
          statusCode: HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
          contentLength: Buffer.byteLength(JSON.stringify(errorResponse))
        });
      }
    }
  };
}

/**
 * Enhanced server startup with logging
 */
async function startServer() {
  try {
    logger.info('Starting HTTP server', {
      port: PORT,
      host: HOST,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      pid: process.pid
    });
    
    server = http.createServer(createRequestHandler());
    
    // Server error handling with logging
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.fatal('Port already in use', { 
          port: PORT, 
          error: error.message 
        });
        process.exit(1);
      } else {
        logger.error('Server error', { error });
      }
    });
    
    // Client error handling
    server.on('clientError', (error, socket) => {
      logger.warn('Client error', { error: error.message });
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    
    // Connection handling
    server.on('connection', (socket) => {
      logger.debug('New connection established', {
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort
      });
    });
    
    // Start listening
    server.listen(PORT, HOST, () => {
      logger.info('HTTP server started successfully', {
        port: PORT,
        host: HOST,
        url: `http://${HOST}:${PORT}/`,
        healthCheck: `http://${HOST}:${PORT}/health`,
        metrics: `http://${HOST}:${PORT}/metrics`,
        logMetrics: `http://${HOST}:${PORT}/logs/metrics`
      });
      
      // Log periodic metrics
      setInterval(() => {
        logger.logMetrics();
      }, 60000); // Every minute
    });
    
  } catch (error) {
    logger.fatal('Failed to start server', { error });
    process.exit(1);
  }
}

/**
 * Enhanced graceful shutdown with logging
 */
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    logger.info('Graceful shutdown initiated', { 
      signal,
      uptime: process.uptime()
    });
    
    server.close((error) => {
      if (error) {
        logger.error('Error during server shutdown', { error });
        process.exit(1);
      }
      
      logger.info('HTTP server closed successfully');
      logger.info('Application shutdown complete');
      process.exit(0);
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      logger.warn('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 10000);
  };
  
  // Register signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception', { error });
    shutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled promise rejection', { reason, promise });
    shutdown('unhandledRejection');
  });
}
```

### Testing Your Logging Implementation

#### Step 1: Test Different Log Levels

```bash
# Set different log levels and restart server
LOG_LEVEL=DEBUG npm start
LOG_LEVEL=INFO npm start
LOG_LEVEL=WARN npm start
LOG_LEVEL=ERROR npm start
```

#### Step 2: Generate Various Log Types

```bash
# Generate info logs (normal requests)
curl http://localhost:3000/
curl http://localhost:3000/health

# Generate warning logs (404 errors)
curl http://localhost:3000/nonexistent

# Generate debug logs (if LOG_LEVEL=DEBUG)
curl http://localhost:3000/metrics

# View logging metrics
curl http://localhost:3000/logs/metrics
```

#### Step 3: Test Request Correlation

Make concurrent requests to see request correlation in action:

```bash
# Make multiple concurrent requests
for i in {1..5}; do
  curl http://localhost:3000/ &
done
wait
```

### Log Output Examples

#### Development Environment (Human-readable)
```
10:30:15 INFO  [req-1l9m2k3n4o-abc123] Request started
         { requestId: 'req-1l9m2k3n4o-abc123',
           method: 'GET',
           url: '/',
           userAgent: 'curl/7.68.0',
           ip: '::1' }

10:30:15 DEBUG [req-1l9m2k3n4o-abc123] Processing request
         { requestId: 'req-1l9m2k3n4o-abc123',
           pathname: '/',
           query: {},
           method: 'GET' }

10:30:15 INFO  [req-1l9m2k3n4o-abc123] Request completed
         { requestId: 'req-1l9m2k3n4o-abc123',
           method: 'GET',
           url: '/',
           statusCode: 200,
           duration: '2.34ms',
           contentLength: 128 }
```

#### Production Environment (JSON)
```json
{
  "timestamp": "2025-08-03T10:30:15.123Z",
  "level": "INFO",
  "message": "Request started",
  "service": "nodejs-tutorial-server",
  "version": "1.0.0",
  "environment": "production",
  "process": {
    "pid": 12345,
    "uptime": 3600,
    "memory": {
      "rss": "45.2 MB",
      "heapTotal": "32.1 MB",
      "heapUsed": "28.7 MB",
      "heapUsedPercent": 89,
      "external": "2.1 MB"
    }
  },
  "request": {
    "id": "req-1l9m2k3n4o-abc123",
    "method": "GET",
    "url": "/",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.100"
  }
}
```

This comprehensive logging implementation provides:

- **Structured logging** with consistent JSON format
- **Request correlation** across distributed systems
- **Performance monitoring** with timing and memory metrics
- **Environment-aware output** (human-readable vs JSON)
- **Security-conscious** header sanitization
- **Production-ready** features like log levels and metrics

The logging patterns you've implemented here are essential for production applications and will serve as the foundation for monitoring and debugging throughout the tutorial series.

---

## Graceful Shutdown Implementation

Graceful shutdown is critical for production applications. It ensures that your server can terminate cleanly, completing in-flight requests and releasing resources properly. Let's implement comprehensive graceful shutdown procedures.

### Understanding Graceful Shutdown

Graceful shutdown involves:
1. **Signal Handling**: Responding to OS termination signals
2. **Connection Draining**: Completing existing requests
3. **Resource Cleanup**: Closing database connections, file handles
4. **Timeout Handling**: Forced termination if graceful shutdown takes too long
5. **Process Monitoring**: Integration with PM2 and container orchestration

### Comprehensive Graceful Shutdown Implementation

```javascript
/**
 * Graceful Shutdown Manager for Node.js HTTP Server
 * 
 * Handles clean application termination with connection draining,
 * resource cleanup, and process management integration.
 */

import { EventEmitter } from 'node:events';
import { performance } from 'node:perf_hooks';
import logger from './utils/logger.js';

class GracefulShutdownManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      shutdownTimeout: options.shutdownTimeout || 30000, // 30 seconds
      drainTimeout: options.drainTimeout || 10000,       // 10 seconds
      forceTimeout: options.forceTimeout || 5000,        // 5 seconds
      signals: options.signals || ['SIGTERM', 'SIGINT'],
      enableHealthCheck: options.enableHealthCheck !== false,
      ...options
    };
    
    // Shutdown state management
    this.isShuttingDown = false;
    this.shutdownInitiated = null;
    this.shutdownReason = null;
    this.activeConnections = new Set();
    this.activeRequests = new Map();
    
    // Resource tracking
    this.resources = new Map();
    this.healthCheckInterval = null;
    
    // Metrics
    this.metrics = {
      shutdownCount: 0,
      gracefulShutdowns: 0,
      forcedShutdowns: 0,
      averageShutdownTime: 0,
      longestShutdownTime: 0
    };
    
    this.setupSignalHandlers();
    this.setupProcessHandlers();
    
    if (this.options.enableHealthCheck) {
      this.startHealthCheck();
    }
  }

  /**
   * Registers HTTP server for graceful shutdown management
   */
  registerServer(server) {
    this.server = server;
    
    // Track active connections
    server.on('connection', (socket) => {
      this.activeConnections.add(socket);
      
      socket.on('close', () => {
        this.activeConnections.delete(socket);
      });
      
      logger.debug('Connection registered for graceful shutdown', {
        totalConnections: this.activeConnections.size
      });
    });
    
    // Track active requests
    server.on('request', (req, res) => {
      const requestId = res.getHeader('X-Request-ID') || this.generateRequestId();
      const requestInfo = {
        id: requestId,
        method: req.method,
        url: req.url,
        startTime: performance.now()
      };
      
      this.activeRequests.set(requestId, requestInfo);
      
      res.on('finish', () => {
        this.activeRequests.delete(requestId);
      });
      
      res.on('close', () => {
        this.activeRequests.delete(requestId);
      });
    });
    
    logger.info('HTTP server registered for graceful shutdown management');
  }

  /**
   * Registers a resource for cleanup during shutdown
   */
  registerResource(name, resource, cleanupFn) {
    this.resources.set(name, {
      resource,
      cleanup: cleanupFn,
      registeredAt: new Date().toISOString()
    });
    
    logger.debug('Resource registered for cleanup', { 
      name, 
      totalResources: this.resources.size 
    });
  }

  /**
   * Initiates graceful shutdown process
   */
  async shutdown(reason = 'manual', signal = null) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress', { 
        reason: this.shutdownReason,
        elapsed: Date.now() - this.shutdownInitiated 
      });
      return;
    }
    
    this.isShuttingDown = true;
    this.shutdownInitiated = Date.now();
    this.shutdownReason = reason;
    this.metrics.shutdownCount++;
    
    logger.info('Graceful shutdown initiated', {
      reason,
      signal,
      activeConnections: this.activeConnections.size,
      activeRequests: this.activeRequests.size,
      registeredResources: this.resources.size,
      uptime: process.uptime()
    });
    
    // Emit shutdown start event
    this.emit('shutdownStart', { reason, signal });
    
    try {
      // Phase 1: Stop accepting new connections
      await this.stopAcceptingConnections();
      
      // Phase 2: Drain existing connections
      await this.drainConnections();
      
      // Phase 3: Close server
      await this.closeServer();
      
      // Phase 4: Cleanup resources
      await this.cleanupResources();
      
      // Phase 5: Final cleanup
      await this.finalCleanup();
      
      const shutdownTime = Date.now() - this.shutdownInitiated;
      this.metrics.gracefulShutdowns++;
      this.updateShutdownMetrics(shutdownTime);
      
      logger.info('Graceful shutdown completed successfully', {
        reason,
        shutdownTime: `${shutdownTime}ms`,
        activeConnectionsRemaining: this.activeConnections.size,
        activeRequestsRemaining: this.activeRequests.size
      });
      
      this.emit('shutdownComplete', { reason, shutdownTime });
      
      // Exit process
      process.exit(0);
      
    } catch (error) {
      this.metrics.forcedShutdowns++;
      
      logger.error('Graceful shutdown failed, forcing exit', {
        reason,
        error: error.message,
        stack: error.stack,
        shutdownTime: Date.now() - this.shutdownInitiated
      });
      
      this.emit('shutdownError', { reason, error });
      
      // Force exit
      process.exit(1);
    }
  }

  /**
   * Phase 1: Stop accepting new connections
   */
  async stopAcceptingConnections() {
    logger.info('Stopping acceptance of new connections');
    
    if (this.server) {
      // Stop the server from accepting new connections
      this.server.close();
      logger.debug('Server closed to new connections');
    }
    
    // Update health check status
    this.emit('healthStatusChange', { status: 'shutting_down' });
  }

  /**
   * Phase 2: Drain existing connections
   */
  async drainConnections() {
    logger.info('Draining existing connections', {
      activeConnections: this.activeConnections.size,
      activeRequests: this.activeRequests.size
    });
    
    const drainStart = Date.now();
    
    // Wait for active requests to complete
    while (this.activeRequests.size > 0 && (Date.now() - drainStart) < this.options.drainTimeout) {
      logger.debug('Waiting for active requests to complete', {
        remaining: this.activeRequests.size,
        elapsed: Date.now() - drainStart
      });
      
      await this.sleep(100); // Check every 100ms
    }
    
    // If requests are still active after timeout, log them
    if (this.activeRequests.size > 0) {
      const activeRequestsList = Array.from(this.activeRequests.values()).map(req => ({
        id: req.id,
        method: req.method,
        url: req.url,
        duration: performance.now() - req.startTime
      }));
      
      logger.warn('Active requests remaining after drain timeout', {
        activeRequests: activeRequestsList,
        drainTimeout: this.options.drainTimeout
      });
    }
    
    // Close remaining connections
    for (const socket of this.activeConnections) {
      socket.destroy();
    }
    
    logger.info('Connection draining completed', {
      drainTime: Date.now() - drainStart,
      remainingConnections: this.activeConnections.size
    });
  }

  /**
   * Phase 3: Close server
   */
  async closeServer() {
    if (!this.server) return;
    
    logger.info('Closing HTTP server');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server close timeout'));
      }, this.options.forceTimeout);
      
      this.server.close((error) => {
        clearTimeout(timeout);
        
        if (error) {
          logger.error('Error closing server', { error: error.message });
          reject(error);
        } else {
          logger.info('HTTP server closed successfully');
          resolve();
        }
      });
    });
  }

  /**
   * Phase 4: Cleanup registered resources
   */
  async cleanupResources() {
    if (this.resources.size === 0) {
      logger.debug('No resources to cleanup');
      return;
    }
    
    logger.info('Cleaning up registered resources', {
      resourceCount: this.resources.size
    });
    
    const cleanupPromises = [];
    
    for (const [name, resourceInfo] of this.resources.entries()) {
      const cleanupPromise = this.cleanupResource(name, resourceInfo);
      cleanupPromises.push(cleanupPromise);
    }
    
    // Wait for all cleanup operations to complete
    const results = await Promise.allSettled(cleanupPromises);
    
    // Log cleanup results
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    logger.info('Resource cleanup completed', {
      totalResources: this.resources.size,
      successful: successCount,
      failed: failureCount
    });
    
    // Log individual failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const resourceName = Array.from(this.resources.keys())[index];
        logger.error('Resource cleanup failed', {
          resource: resourceName,
          error: result.reason.message
        });
      }
    });
  }

  /**
   * Cleans up individual resource
   */
  async cleanupResource(name, resourceInfo) {
    try {
      logger.debug('Cleaning up resource', { name });
      
      if (typeof resourceInfo.cleanup === 'function') {
        await resourceInfo.cleanup(resourceInfo.resource);
      }
      
      logger.debug('Resource cleanup successful', { name });
      
    } catch (error) {
      logger.error('Resource cleanup failed', {
        resource: name,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Phase 5: Final cleanup
   */
  async finalCleanup() {
    logger.info('Performing final cleanup');
    
    // Stop health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clear all tracking data
    this.activeConnections.clear();
    this.activeRequests.clear();
    this.resources.clear();
    
    // Emit final event
    this.emit('finalCleanup');
    
    logger.debug('Final cleanup completed');
  }

  /**
   * Sets up OS signal handlers
   */
  setupSignalHandlers() {
    this.options.signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Received ${signal} signal`);
        this.shutdown(`signal:${signal}`, signal);
      });
    });
    
    logger.debug('Signal handlers registered', { 
      signals: this.options.signals 
    });
  }

  /**
   * Sets up process error handlers
   */
  setupProcessHandlers() {
    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      this.shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal('Unhandled promise rejection', {
        reason: reason.toString(),
        promise: promise.toString()
      });
      this.shutdown('unhandledRejection');
    });
    
    logger.debug('Process error handlers registered');
  }

  /**
   * Starts health check monitoring
   */
  startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      const healthStatus = {
        status: this.isShuttingDown ? 'shutting_down' : 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        activeConnections: this.activeConnections.size,
        activeRequests: this.activeRequests.size,
        isShuttingDown: this.isShuttingDown,
        shutdownMetrics: this.metrics
      };
      
      this.emit('healthCheck', healthStatus);
      
      // Log health status periodically (every 10 checks = ~5 minutes)
      if (Math.floor(process.uptime()) % 300 === 0) {
        logger.debug('Health check status', healthStatus);
      }
      
    }, 30000); // Every 30 seconds
    
    logger.debug('Health check monitoring started');
  }

  /**
   * Updates shutdown timing metrics
   */
  updateShutdownMetrics(shutdownTime) {
    const totalShutdowns = this.metrics.gracefulShutdowns + this.metrics.forcedShutdowns;
    
    this.metrics.averageShutdownTime = 
      (this.metrics.averageShutdownTime * (totalShutdowns - 1) + shutdownTime) / totalShutdowns;
    
    if (shutdownTime > this.metrics.longestShutdownTime) {
      this.metrics.longestShutdownTime = shutdownTime;
    }
  }

  /**
   * Utility method for sleeping
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates request ID for tracking
   */
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets current shutdown status
   */
  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      shutdownReason: this.shutdownReason,
      shutdownInitiated: this.shutdownInitiated,
      activeConnections: this.activeConnections.size,
      activeRequests: this.activeRequests.size,
      registeredResources: this.resources.size,
      metrics: this.metrics
    };
  }
}

// Export the graceful shutdown manager
export { GracefulShutdownManager };
export default GracefulShutdownManager;
```

### Integrating Graceful Shutdown with Your Server

Update your `basic-server.js` to use the graceful shutdown manager:

```javascript
import GracefulShutdownManager from './utils/graceful-shutdown.js';

// Create graceful shutdown manager
const shutdownManager = new GracefulShutdownManager({
  shutdownTimeout: 30000,    // 30 seconds total timeout
  drainTimeout: 10000,       // 10 seconds to drain connections
  forceTimeout: 5000,        // 5 seconds to force close server
  signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'], // Include SIGUSR2 for PM2
  enableHealthCheck: true
});

/**
 * Enhanced server startup with graceful shutdown integration
 */
async function startServer() {
  try {
    logger.info('Starting HTTP server with graceful shutdown support');
    
    // Create server
    server = http.createServer(createRequestHandler());
    
    // Register server with shutdown manager
    shutdownManager.registerServer(server);
    
    // Register cleanup resources (examples)
    shutdownManager.registerResource('database', null, async () => {
      logger.info('Closing database connections');
      // await database.close();
    });
    
    shutdownManager.registerResource('cache', null, async () => {
      logger.info('Clearing cache');
      // await cache.clear();
    });
    
    shutdownManager.registerResource('fileHandles', null, async () => {
      logger.info('Closing file handles');
      // Close any open file handles
    });
    
    // Set up shutdown manager event listeners
    shutdownManager.on('shutdownStart', ({ reason, signal }) => {
      logger.info('Shutdown process started', { reason, signal });
    });
    
    shutdownManager.on('healthStatusChange', ({ status }) => {
      logger.info('Health status changed', { status });
    });
    
    shutdownManager.on('shutdownComplete', ({ reason, shutdownTime }) => {
      logger.info('Shutdown process completed', { reason, shutdownTime });
    });
    
    shutdownManager.on('shutdownError', ({ reason, error }) => {
      logger.error('Shutdown process error', { reason, error: error.message });
    });
    
    // Server error handling
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.fatal('Port already in use', { port: PORT, error: error.message });
        shutdownManager.shutdown('port-conflict');
      } else {
        logger.error('Server error', { error: error.message });
      }
    });
    
    // Start listening
    server.listen(PORT, HOST, () => {
      logger.info('HTTP server started with graceful shutdown', {
        port: PORT,
        host: HOST,
        pid: process.pid,
        shutdownTimeout: shutdownManager.options.shutdownTimeout,
        signals: shutdownManager.options.signals
      });
      
      console.log(`\n🚀 Server running at http://${HOST}:${PORT}/`);
      console.log(`🛡️  Graceful shutdown enabled (SIGTERM, SIGINT, SIGUSR2)`);
      console.log(`⏱️  Shutdown timeout: ${shutdownManager.options.shutdownTimeout}ms\n`);
    });
    
  } catch (error) {
    logger.fatal('Failed to start server', { error: error.message });
    shutdownManager.shutdown('startup-error');
  }
}

/**
 * Enhanced health check with shutdown status
 */
function createHealthResponse() {
  const shutdownStatus = shutdownManager.getStatus();
  const uptime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  
  return {
    status: shutdownStatus.isShuttingDown ? 'shutting_down' : 'healthy',
    uptime: `${Math.floor(uptime / 1000)}s`,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    // Memory information
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    },
    
    // Request statistics
    requests: {
      total: requestCount,
      averagePerSecond: Math.round(requestCount / (uptime / 1000))
    },
    
    // Shutdown information
    shutdown: {
      isShuttingDown: shutdownStatus.isShuttingDown,
      reason: shutdownStatus.shutdownReason,
      activeConnections: shutdownStatus.activeConnections,
      activeRequests: shutdownStatus.activeRequests,
      registeredResources: shutdownStatus.registeredResources,
      metrics: shutdownStatus.metrics
    }
  };
}

// Remove the old setupGracefulShutdown function since we're using the manager now
// The GracefulShutdownManager handles all signal registration and process handling

// Start the application
async function main() {
  try {
    await startServer();
  } catch (error) {
    logger.fatal('Application startup failed', { error: error.message });
    shutdownManager.shutdown('startup-failure');
  }
}
```

### Testing Graceful Shutdown

#### Step 1: Test Normal Shutdown

```bash
# Start the server
npm start

# In another terminal, send SIGTERM
kill -TERM $(pgrep -f "node.*basic-server")

# Or use SIGINT (Ctrl+C from the same terminal)
```

#### Step 2: Test Shutdown During Active Requests

```bash
# Start the server
npm start

# Generate some load (in another terminal)
for i in {1..10}; do
  curl http://localhost:3000/ &
  sleep 0.1
done

# While requests are running, send shutdown signal
kill -TERM $(pgrep -f "node.*basic-server")
```

#### Step 3: Test PM2 Integration

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start src/backend/basic-server.js --name tutorial-server

# Test graceful restart
pm2 reload tutorial-server

# Test graceful stop
pm2 stop tutorial-server

# View logs
pm2 logs tutorial-server
```

### Expected Graceful Shutdown Log Output

```
INFO  Graceful shutdown initiated { 
  reason: 'signal:SIGTERM',
  signal: 'SIGTERM',
  activeConnections: 2,
  activeRequests: 1,
  registeredResources: 3,
  uptime: 147.234 
}

INFO  Stopping acceptance of new connections

INFO  Draining existing connections { 
  activeConnections: 2,
  activeRequests: 1 
}

DEBUG Waiting for active requests to complete { 
  remaining: 1,
  elapsed: 250 
}

INFO  Connection draining completed { 
  drainTime: 1240,
  remainingConnections: 0 
}

INFO  Closing HTTP server

INFO  HTTP server closed successfully

INFO  Cleaning up registered resources { resourceCount: 3 }

DEBUG Cleaning up resource { name: 'database' }
INFO  Closing database connections
DEBUG Resource cleanup successful { name: 'database' }

DEBUG Cleaning up resource { name: 'cache' }
INFO  Clearing cache
DEBUG Resource cleanup successful { name: 'cache' }

INFO  Resource cleanup completed { 
  totalResources: 3,
  successful: 3,
  failed: 0 
}

INFO  Performing final cleanup

INFO  Graceful shutdown completed successfully { 
  reason: 'signal:SIGTERM',
  shutdownTime: '2847ms',
  activeConnectionsRemaining: 0,
  activeRequestsRemaining: 0 
}
```

### Graceful Shutdown Best Practices

1. **Signal Handling**: Always handle SIGTERM and SIGINT signals
2. **Connection Draining**: Wait for active requests to complete
3. **Resource Cleanup**: Close database connections, file handles, etc.
4. **Timeout Management**: Set reasonable timeouts to prevent hanging
5. **Logging**: Comprehensive logging for debugging shutdown issues
6. **Health Checks**: Update health status during shutdown
7. **PM2 Integration**: Support SIGUSR2 for PM2 cluster mode
8. **Testing**: Regularly test shutdown procedures under load

This graceful shutdown implementation ensures your server can terminate cleanly in production environments, making it suitable for container orchestration platforms like Kubernetes and process managers like PM2.

---

## Performance Optimization

Performance optimization is crucial for production HTTP servers. Let's implement comprehensive performance monitoring, measurement techniques, and optimization strategies to achieve response times under 100ms.

### Performance Monitoring Infrastructure

```javascript
/**
 * Performance Monitor for Node.js HTTP Server
 * 
 * Provides comprehensive performance monitoring, metrics collection,
 * and optimization insights for production applications.
 */

import { performance, PerformanceObserver } from 'node:perf_hooks';
import { EventEmitter } from 'node:events';
import logger from './logger.js';

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableDetailedMetrics: options.enableDetailedMetrics !== false,
      metricsInterval: options.metricsInterval || 60000, // 1 minute
      slowRequestThreshold: options.slowRequestThreshold || 100, // 100ms
      memoryWarningThreshold: options.memoryWarningThreshold || 0.8, // 80% of heap
      cpuWarningThreshold: options.cpuWarningThreshold || 0.8, // 80% CPU usage
      ...options
    };
    
    // Performance metrics storage
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        slow: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimeDistribution: {
          '0-10ms': 0,
          '10-50ms': 0,
          '50-100ms': 0,
          '100-500ms': 0,
          '500ms+': 0
        }
      },
      
      memory: {
        heapUsedMax: 0,
        heapTotalMax: 0,
        rssMax: 0,
        externalMax: 0,
        gcCount: 0,
        gcTime: 0
      },
      
      cpu: {
        userTime: 0,
        systemTime: 0,
        loadAverage: [0, 0, 0],
        utilizationPercent: 0
      },
      
      system: {
        startTime: Date.now(),
        uptime: 0,
        errorRate: 0,
        throughput: 0
      }
    };
    
    // Request timing tracking
    this.activeRequests = new Map();
    this.recentRequests = [];
    this.maxRecentRequests = 1000;
    
    // Performance observers
    this.setupPerformanceObservers();
    
    // Start metrics collection
    this.startMetricsCollection();
    
    logger.debug('Performance monitor initialized', {
      slowRequestThreshold: this.options.slowRequestThreshold,
      metricsInterval: this.options.metricsInterval
    });
  }

  /**
   * Records request start time and context
   */
  startRequest(requestId, context = {}) {
    const requestInfo = {
      id: requestId,
      startTime: performance.now(),
      startTimeHR: process.hrtime.bigint(),
      method: context.method,
      url: context.url,
      userAgent: context.userAgent,
      contentLength: context.contentLength || 0
    };
    
    this.activeRequests.set(requestId, requestInfo);
    
    // Emit request start event
    this.emit('requestStart', requestInfo);
    
    return requestInfo;
  }

  /**
   * Records request completion and calculates metrics
   */
  endRequest(requestId, responseContext = {}) {
    const requestInfo = this.activeRequests.get(requestId);
    if (!requestInfo) {
      logger.warn('Request not found in performance tracking', { requestId });
      return null;
    }
    
    // Calculate timing metrics
    const endTime = performance.now();
    const endTimeHR = process.hrtime.bigint();
    const responseTime = endTime - requestInfo.startTime;
    const responseTimeHR = Number(endTimeHR - requestInfo.startTimeHR) / 1000000; // Convert to ms
    
    // Complete request info
    const completedRequest = {
      ...requestInfo,
      endTime,
      responseTime: responseTimeHR, // Use high-resolution timing
      statusCode: responseContext.statusCode || 200,
      responseSize: responseContext.responseSize || 0,
      success: (responseContext.statusCode || 200) < 400,
      error: responseContext.error
    };
    
    // Update metrics
    this.updateRequestMetrics(completedRequest);
    
    // Store recent request for analysis
    this.addRecentRequest(completedRequest);
    
    // Clean up active requests
    this.activeRequests.delete(requestId);
    
    // Check for slow requests
    if (responseTimeHR > this.options.slowRequestThreshold) {
      this.handleSlowRequest(completedRequest);
    }
    
    // Emit request completion event
    this.emit('requestComplete', completedRequest);
    
    return completedRequest;
  }

  /**
   * Updates request metrics with new data point
   */
  updateRequestMetrics(request) {
    const metrics = this.metrics.requests;
    
    // Update counters
    metrics.total++;
    if (request.success) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }
    
    if (request.responseTime > this.options.slowRequestThreshold) {
      metrics.slow++;
    }
    
    // Update response time statistics
    const responseTime = request.responseTime;
    
    // Calculate rolling average
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.total - 1) + responseTime) / metrics.total;
    
    // Update min/max
    if (responseTime < metrics.minResponseTime) {
      metrics.minResponseTime = responseTime;
    }
    if (responseTime > metrics.maxResponseTime) {
      metrics.maxResponseTime = responseTime;
    }
    
    // Update distribution
    if (responseTime <= 10) {
      metrics.responseTimeDistribution['0-10ms']++;
    } else if (responseTime <= 50) {
      metrics.responseTimeDistribution['10-50ms']++;
    } else if (responseTime <= 100) {
      metrics.responseTimeDistribution['50-100ms']++;
    } else if (responseTime <= 500) {
      metrics.responseTimeDistribution['100-500ms']++;
    } else {
      metrics.responseTimeDistribution['500ms+']++;
    }
  }

  /**
   * Handles slow request detection and logging
   */
  handleSlowRequest(request) {
    logger.warn('Slow request detected', {
      requestId: request.id,
      method: request.method,
      url: request.url,
      responseTime: `${request.responseTime.toFixed(2)}ms`,
      threshold: `${this.options.slowRequestThreshold}ms`,
      statusCode: request.statusCode,
      responseSize: request.responseSize
    });
    
    // Emit slow request event for alerting
    this.emit('slowRequest', request);
  }

  /**
   * Adds request to recent requests buffer for analysis
   */
  addRecentRequest(request) {
    this.recentRequests.push({
      timestamp: Date.now(),
      responseTime: request.responseTime,
      success: request.success,
      statusCode: request.statusCode,
      method: request.method,
      url: request.url
    });
    
    // Maintain buffer size
    if (this.recentRequests.length > this.maxRecentRequests) {
      this.recentRequests = this.recentRequests.slice(-this.maxRecentRequests);
    }
  }

  /**
   * Collects system performance metrics
   */
  collectSystemMetrics() {
    // Memory metrics
    const memoryUsage = process.memoryUsage();
    this.metrics.memory.heapUsedMax = Math.max(
      this.metrics.memory.heapUsedMax, 
      memoryUsage.heapUsed
    );
    this.metrics.memory.heapTotalMax = Math.max(
      this.metrics.memory.heapTotalMax, 
      memoryUsage.heapTotal
    );
    this.metrics.memory.rssMax = Math.max(
      this.metrics.memory.rssMax, 
      memoryUsage.rss
    );
    this.metrics.memory.externalMax = Math.max(
      this.metrics.memory.externalMax, 
      memoryUsage.external
    );
    
    // CPU metrics
    const cpuUsage = process.cpuUsage();
    this.metrics.cpu.userTime = cpuUsage.user;
    this.metrics.cpu.systemTime = cpuUsage.system;
    
    // Load average (Unix/Linux only)
    if (process.platform !== 'win32') {
      const os = require('os');
      this.metrics.cpu.loadAverage = os.loadavg();
    }
    
    // System metrics
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.errorRate = 
      this.metrics.requests.total > 0 ? 
      (this.metrics.requests.failed / this.metrics.requests.total) * 100 : 0;
    
    // Calculate throughput (requests per second over last minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCount = this.recentRequests.filter(r => r.timestamp > oneMinuteAgo).length;
    this.metrics.system.throughput = recentCount / 60;
    
    // Check for performance warnings
    this.checkPerformanceWarnings(memoryUsage);
  }

  /**
   * Checks for performance warning conditions
   */
  checkPerformanceWarnings(memoryUsage) {
    // Memory warning
    const heapUtilization = memoryUsage.heapUsed / memoryUsage.heapTotal;
    if (heapUtilization > this.options.memoryWarningThreshold) {
      logger.warn('High memory utilization detected', {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        utilization: `${(heapUtilization * 100).toFixed(1)}%`,
        threshold: `${(this.options.memoryWarningThreshold * 100)}%`
      });
      
      this.emit('memoryWarning', { memoryUsage, utilization: heapUtilization });
    }
    
    // High error rate warning
    if (this.metrics.system.errorRate > 5) { // > 5% error rate
      logger.warn('High error rate detected', {
        errorRate: `${this.metrics.system.errorRate.toFixed(2)}%`,
        totalRequests: this.metrics.requests.total,
        failedRequests: this.metrics.requests.failed
      });
      
      this.emit('highErrorRate', { 
        errorRate: this.metrics.system.errorRate,
        metrics: this.metrics.requests 
      });
    }
    
    // Low throughput warning (less than 1 request per second for active server)
    if (this.metrics.system.uptime > 60 && this.metrics.system.throughput < 1) {
      logger.debug('Low throughput detected', {
        throughput: `${this.metrics.system.throughput.toFixed(2)} req/s`,
        uptime: `${Math.floor(this.metrics.system.uptime)}s`
      });
    }
  }

  /**
   * Sets up performance observers for Node.js performance hooks
   */
  setupPerformanceObservers() {
    if (!this.options.enableDetailedMetrics) return;
    
    // HTTP performance observer
    const httpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'http') {
          logger.debug('HTTP performance entry', {
            name: entry.name,
            duration: `${entry.duration.toFixed(2)}ms`,
            startTime: entry.startTime
          });
        }
      });
    });
    
    try {
      httpObserver.observe({ entryTypes: ['http'] });
    } catch (error) {
      logger.debug('HTTP performance observer not available', { error: error.message });
    }
    
    // GC performance observer
    const gcObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.memory.gcCount++;
        this.metrics.memory.gcTime += entry.duration;
        
        logger.debug('Garbage collection event', {
          kind: entry.kind,
          duration: `${entry.duration.toFixed(2)}ms`,
          type: entry.entryType
        });
        
        this.emit('gc', { 
          kind: entry.kind, 
          duration: entry.duration,
          totalGcTime: this.metrics.memory.gcTime 
        });
      });
    });
    
    try {
      gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {
      logger.debug('GC performance observer not available', { error: error.message });
    }
  }

  /**
   * Starts periodic metrics collection
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.logPerformanceMetrics();
    }, this.options.metricsInterval);
    
    logger.debug('Started periodic metrics collection', {
      interval: this.options.metricsInterval
    });
  }

  /**
   * Stops metrics collection
   */
  stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Logs comprehensive performance metrics
   */
  logPerformanceMetrics() {
    const summary = this.getPerformanceSummary();
    
    logger.info('Performance metrics summary', summary);
    
    // Emit metrics event for external monitoring
    this.emit('metrics', summary);
  }

  /**
   * Gets comprehensive performance summary
   */
  getPerformanceSummary() {
    const memoryUsage = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: this.metrics.system.uptime,
      
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        slow: this.metrics.requests.slow,
        errorRate: this.metrics.system.errorRate.toFixed(2),
        throughput: this.metrics.system.throughput.toFixed(2),
        averageResponseTime: this.metrics.requests.averageResponseTime.toFixed(2),
        minResponseTime: this.metrics.requests.minResponseTime === Infinity ? 0 : this.metrics.requests.minResponseTime.toFixed(2),
        maxResponseTime: this.metrics.requests.maxResponseTime.toFixed(2),
        distribution: this.metrics.requests.responseTimeDistribution
      },
      
      memory: {
        current: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        peak: {
          heapUsed: Math.round(this.metrics.memory.heapUsedMax / 1024 / 1024),
          heapTotal: Math.round(this.metrics.memory.heapTotalMax / 1024 / 1024),
          rss: Math.round(this.metrics.memory.rssMax / 1024 / 1024),
          external: Math.round(this.metrics.memory.externalMax / 1024 / 1024)
        },
        heapUtilization: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1),
        gc: {
          count: this.metrics.memory.gcCount,
          totalTime: this.metrics.memory.gcTime.toFixed(2)
        }
      },
      
      cpu: {
        user: this.metrics.cpu.userTime,
        system: this.metrics.cpu.systemTime,
        loadAverage: this.metrics.cpu.loadAverage
      },
      
      activeRequests: this.activeRequests.size
    };
  }

  /**
   * Gets recent performance trends
   */
  getPerformanceTrends(timeWindow = 300000) { // 5 minutes default
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentRequests = this.recentRequests.filter(r => r.timestamp > windowStart);
    
    if (recentRequests.length === 0) {
      return {
        timeWindow: timeWindow,
        requestCount: 0,
        trends: null
      };
    }
    
    // Calculate trends
    const responseTimes = recentRequests.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const errorCount = recentRequests.filter(r => !r.success).length;
    const errorRate = (errorCount / recentRequests.length) * 100;
    
    return {
      timeWindow: timeWindow,
      requestCount: recentRequests.length,
      averageResponseTime: avgResponseTime.toFixed(2),
      errorRate: errorRate.toFixed(2),
      throughput: (recentRequests.length / (timeWindow / 1000)).toFixed(2),
      trends: {
        responseTime: this.calculateTrend(responseTimes),
        requestVolume: this.calculateVolumeTrend(recentRequests, timeWindow)
      }
    };
  }

  /**
   * Calculates trend direction for response times
   */
  calculateTrend(values) {
    if (values.length < 10) return 'insufficient_data';
    
    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Calculates volume trend
   */
  calculateVolumeTrend(requests, timeWindow) {
    const bucketSize = timeWindow / 10; // 10 buckets
    const buckets = new Array(10).fill(0);
    const startTime = Date.now() - timeWindow;
    
    requests.forEach(req => {
      const bucketIndex = Math.floor((req.timestamp - startTime) / bucketSize);
      if (bucketIndex >= 0 && bucketIndex < 10) {
        buckets[bucketIndex]++;
      }
    });
    
    const firstHalf = buckets.slice(0, 5).reduce((a, b) => a + b, 0);
    const secondHalf = buckets.slice(5).reduce((a, b) => a + b, 0);
    
    if (firstHalf === 0 && secondHalf === 0) return 'no_requests';
    if (firstHalf === 0) return 'increasing';
    if (secondHalf === 0) return 'decreasing';
    
    const change = ((secondHalf - firstHalf) / firstHalf) * 100;
    
    if (Math.abs(change) < 10) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Resets all metrics (useful for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        slow: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimeDistribution: {
          '0-10ms': 0,
          '10-50ms': 0,
          '50-100ms': 0,
          '100-500ms': 0,
          '500ms+': 0
        }
      },
      memory: {
        heapUsedMax: 0,
        heapTotalMax: 0,
        rssMax: 0,
        externalMax: 0,
        gcCount: 0,
        gcTime: 0
      },
      cpu: {
        userTime: 0,
        systemTime: 0,
        loadAverage: [0, 0, 0],
        utilizationPercent: 0
      },
      system: {
        startTime: Date.now(),
        uptime: 0,
        errorRate: 0,
        throughput: 0
      }
    };
    
    this.activeRequests.clear();
    this.recentRequests = [];
    
    logger.info('Performance metrics reset');
  }
}

// Export the performance monitor
export { PerformanceMonitor };
export default PerformanceMonitor;
```

### Integration with HTTP Server

Update your `basic-server.js` to include performance monitoring: