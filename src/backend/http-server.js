/**
 * @fileoverview Enhanced HTTP Server Implementation - Bridge Phase for Node.js Tutorial Project
 * @description Advanced HTTP server implementation that bridges basic HTTP concepts with Express.js patterns,
 * providing multiple endpoints (/hello, /good-evening, /health) and enhanced features in preparation for
 * framework integration. This educational module demonstrates advanced HTTP server patterns using Node.js
 * core modules with comprehensive security headers, middleware-style request processing, health checks,
 * performance monitoring, and production-ready patterns. Implements modern ES Modules, stateless architecture
 * for PM2 cluster compatibility, advanced logging with request correlation, and serves as the foundation
 * for understanding Express.js concepts before framework introduction.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates transition from basic HTTP server to framework-like patterns
 * - Showcases routing concepts before Express.js introduction
 * - Illustrates middleware-style request processing architecture
 * - Provides foundation for understanding Express.js patterns and concepts
 * - Shows production-ready server implementation techniques
 * 
 * Features:
 * - Multiple HTTP endpoints with standardized JSON responses
 * - Middleware-style request processing pipeline for educational demonstration
 * - Comprehensive security headers preparation for Helmet.js integration
 * - Performance monitoring and metrics collection
 * - Request correlation tracking for distributed logging
 * - Health check endpoint for load balancer integration
 * - Graceful shutdown with PM2 cluster mode compatibility
 * - Environment configuration integration
 * - Advanced error handling and logging
 * - Stateless architecture for horizontal scalability
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - PM2 v6.0.8 cluster mode compatibility
 * - Environment configuration management
 * - Comprehensive logging with request correlation
 * - Security header implementation for Helmet.js preparation
 * - Cross-platform Flask compatibility patterns
 */

// Node.js built-in module imports with version comments
import http from 'node:http'; // Node.js built-in - HTTP server creation without external framework dependencies
import url from 'node:url'; // Node.js built-in - URL utilities for parsing request URLs and routing implementation
import querystring from 'node:querystring'; // Node.js built-in - Query string parsing for URL parameter extraction and processing
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic functionality for request ID generation
import os from 'node:os'; // Node.js built-in - Operating system utilities for health check information
import { performance } from 'node:perf_hooks'; // Node.js built-in - Performance measurement for response time tracking

// Internal imports from configuration and utilities
import { environmentConfig } from './config/environment.js';
import logger, { 
  info, 
  warn, 
  error as logError, 
  debug,
  generateRequestId,
  createRequestLogger,
  logPerformanceMetrics,
  logSecurityEvent 
} from './utils/logger.js';
import { 
  HTTP_CONSTANTS, 
  API_CONSTANTS, 
  SECURITY_CONSTANTS 
} from './utils/constants.js';

// Global server state and statistics tracking for monitoring and analytics
let httpServer = null;
const requestStats = { 
  total: 0, 
  hello: 0, 
  goodEvening: 0, 
  health: 0, 
  errors: 0,
  startTime: Date.now(),
  lastRequestTime: null,
  averageResponseTime: 0,
  totalResponseTime: 0
};
let serverStartTime = null;
let isShuttingDown = false;
let healthChecker = null;

/**
 * Helper function: Formats HTTP response with standardized structure, security headers,
 * and consistent JSON output for API responses with comprehensive error handling and
 * validation for production-ready response formatting.
 * 
 * @param {Object} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data object
 * @param {Object} [options={}] - Additional formatting options
 * @returns {void} No return value, sends formatted HTTP response
 */
function formatHTTPResponse(res, statusCode, data, options = {}) {
  try {
    const config = {
      contentType: options.contentType || HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      corsEnabled: options.corsEnabled !== false,
      securityHeaders: options.securityHeaders !== false,
      timestamp: options.timestamp !== false,
      correlationId: options.correlationId || null,
      ...options
    };

    // Set standard HTTP response headers
    res.statusCode = statusCode;
    res.setHeader(HTTP_CONSTANTS.HEADERS.CONTENT_TYPE, config.contentType);

    // Apply security headers for basic protection and Helmet.js preparation
    if (config.securityHeaders) {
      setupSecurityHeaders(res, environmentConfig.security || {});
    }

    // Set CORS headers for cross-platform Flask compatibility
    if (config.corsEnabled) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    // Create standardized response structure
    const responseData = {
      ...data,
      ...(config.timestamp && { timestamp: new Date().toISOString() }),
      ...(config.correlationId && { correlationId: config.correlationId }),
      status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
      version: '1.0.0'
    };

    // Convert response to JSON and send
    const responseBody = JSON.stringify(responseData, null, config.pretty ? 2 : 0);
    res.setHeader(HTTP_CONSTANTS.HEADERS.CONTENT_LENGTH, Buffer.byteLength(responseBody));
    res.end(responseBody);

    debug('HTTP response formatted and sent', {
      statusCode,
      contentLength: Buffer.byteLength(responseBody),
      correlationId: config.correlationId,
      hasSecurityHeaders: config.securityHeaders
    });

  } catch (error) {
    // Fallback error response if formatting fails
    logError('Failed to format HTTP response', error, { statusCode, data });
    res.statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
    res.setHeader(HTTP_CONSTANTS.HEADERS.CONTENT_TYPE, HTTP_CONSTANTS.CONTENT_TYPES.JSON);
    res.end(JSON.stringify({ 
      error: 'Internal server error', 
      timestamp: new Date().toISOString() 
    }));
  }
}

/**
 * Helper function: Generates unique request correlation IDs using cryptographically secure
 * random values for tracking requests across distributed systems, microservices, and PM2
 * cluster processes with comprehensive request lifecycle tracking and debugging support.
 * 
 * @param {Object} [options={}] - ID generation options
 * @param {string} [options.prefix='req'] - Prefix for the generated ID
 * @param {number} [options.length=16] - Length of random component
 * @returns {string} Unique request correlation ID for distributed request tracking
 */
function generateRequestCorrelationId(options = {}) {
  const config = {
    prefix: options.prefix || 'req',
    length: options.length || 16,
    includeTimestamp: options.includeTimestamp !== false,
    includePid: options.includePid !== false,
    ...options
  };

  try {
    // Generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(config.length);
    const randomComponent = randomBytes.toString('hex');
    
    // Build correlation ID components
    const components = [config.prefix];
    
    if (config.includeTimestamp) {
      components.push(Date.now().toString(36));
    }
    
    if (config.includePid) {
      components.push(process.pid.toString(36));
    }
    
    components.push(randomComponent);
    
    const correlationId = components.join('-');
    
    debug('Request correlation ID generated', { 
      correlationId, 
      components: components.length,
      pid: process.pid 
    });
    
    return correlationId;
  } catch (error) {
    // Fallback to timestamp-based ID if crypto fails
    const fallbackId = `${config.prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    warn('Failed to generate secure request ID, using fallback', { 
      error: error.message, 
      fallbackId 
    });
    return fallbackId;
  }
}

/**
 * Helper function: Measures performance metrics including response times, memory usage,
 * CPU utilization, and throughput measurements for production monitoring and optimization
 * with comprehensive performance data collection and analysis.
 * 
 * @param {string} operationName - Name of the operation being measured
 * @param {Function} operation - Operation function to measure
 * @param {Object} [context={}] - Additional context information
 * @returns {Promise<Object>} Performance measurement result with timing and resource data
 */
async function measurePerformance(operationName, operation, context = {}) {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  const startCpuUsage = process.cpuUsage();

  try {
    debug('Starting performance measurement', { 
      operationName, 
      startTime,
      context 
    });

    // Execute the operation and measure performance
    const result = await operation();
    
    // Calculate performance metrics
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpuUsage = process.cpuUsage(startCpuUsage);
    
    const performanceMetrics = {
      operationName,
      duration: endTime - startTime, // milliseconds
      startTime,
      endTime,
      memory: {
        heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
        heapTotalDelta: endMemory.heapTotal - startMemory.heapTotal,
        externalDelta: endMemory.external - startMemory.external,
        rss: endMemory.rss
      },
      cpu: {
        user: endCpuUsage.user / 1000, // Convert to milliseconds
        system: endCpuUsage.system / 1000
      },
      context,
      timestamp: new Date().toISOString()
    };

    // Update global performance statistics
    requestStats.totalResponseTime += performanceMetrics.duration;
    requestStats.averageResponseTime = requestStats.total > 0 ? 
      requestStats.totalResponseTime / requestStats.total : 0;

    // Log performance metrics for monitoring
    logPerformanceMetrics(performanceMetrics, context);

    // Return result with performance data
    return {
      result,
      performance: performanceMetrics
    };

  } catch (error) {
    const endTime = performance.now();
    const errorMetrics = {
      operationName,
      duration: endTime - startTime,
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    };

    logError('Performance measurement failed', error, errorMetrics);
    throw error;
  }
}

/**
 * Helper function: Creates comprehensive health check utility for system monitoring,
 * load balancer integration, and operational visibility with detailed system status,
 * performance metrics, and dependency health information.
 * 
 * @param {Object} [options={}] - Health check configuration options
 * @returns {Object} Health check utility with status methods and monitoring capabilities
 */
function createHealthCheck(options = {}) {
  const config = {
    includeSystemInfo: options.includeSystemInfo !== false,
    includeMemoryInfo: options.includeMemoryInfo !== false,
    includePerformanceMetrics: options.includePerformanceMetrics !== false,
    includeDependencies: options.includeDependencies !== false,
    healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
    ...options
  };

  const healthChecker = {
    config,
    lastCheck: null,
    status: 'unknown',
    
    /**
     * Performs comprehensive system health check
     * @returns {Object} Complete health status information
     */
    async performHealthCheck() {
      try {
        const checkStartTime = Date.now();
        
        // Gather system information
        const systemInfo = config.includeSystemInfo ? {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          uptime: process.uptime(),
          pid: process.pid
        } : null;

        // Collect memory usage information
        const memoryInfo = config.includeMemoryInfo ? {
          ...process.memoryUsage(),
          systemMemory: {
            total: os.totalmem(),
            free: os.freemem(),
            usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
          }
        } : null;

        // Calculate performance metrics
        const performanceMetrics = config.includePerformanceMetrics ? {
          ...requestStats,
          serverUptime: serverStartTime ? Date.now() - serverStartTime : 0,
          lastRequestTime: requestStats.lastRequestTime,
          requestsPerSecond: requestStats.total > 0 ? 
            requestStats.total / (process.uptime() || 1) : 0
        } : null;

        // Check dependencies (placeholder for future dependency checks)
        const dependencies = config.includeDependencies ? {
          environment: {
            status: 'healthy',
            config: !!environmentConfig
          },
          logger: {
            status: 'healthy',
            available: !!logger
          }
        } : null;

        // Determine overall health status
        const isHealthy = this.determineHealthStatus({
          memoryInfo,
          performanceMetrics,
          dependencies
        });

        const healthStatus = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          checkDuration: Date.now() - checkStartTime,
          ...(systemInfo && { system: systemInfo }),
          ...(memoryInfo && { memory: memoryInfo }),
          ...(performanceMetrics && { performance: performanceMetrics }),
          ...(dependencies && { dependencies })
        };

        this.lastCheck = healthStatus;
        this.status = healthStatus.status;

        debug('Health check completed', {
          status: healthStatus.status,
          checkDuration: healthStatus.checkDuration
        });

        return healthStatus;

      } catch (error) {
        const errorStatus = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          lastKnownGoodCheck: this.lastCheck
        };

        logError('Health check failed', error);
        this.status = 'unhealthy';
        
        return errorStatus;
      }
    },

    /**
     * Determines overall health status based on system metrics
     * @param {Object} metrics - System metrics to evaluate
     * @returns {boolean} Whether the system is healthy
     */
    determineHealthStatus(metrics) {
      // Memory health check (alert if using > 80% of available memory)
      if (metrics.memoryInfo && metrics.memoryInfo.systemMemory) {
        const memoryUsage = parseFloat(metrics.memoryInfo.systemMemory.usage);
        if (memoryUsage > 80) {
          warn('High memory usage detected', { memoryUsage });
          return false;
        }
      }

      // Performance health check (alert if average response time > 1000ms)
      if (metrics.performanceMetrics && metrics.performanceMetrics.averageResponseTime > 1000) {
        warn('Slow average response time detected', {
          averageResponseTime: metrics.performanceMetrics.averageResponseTime
        });
        return false;
      }

      // Dependency health check
      if (metrics.dependencies) {
        const unhealthyDeps = Object.entries(metrics.dependencies)
          .filter(([name, dep]) => dep.status !== 'healthy');
        
        if (unhealthyDeps.length > 0) {
          warn('Unhealthy dependencies detected', { unhealthyDeps });
          return false;
        }
      }

      return true;
    },

    /**
     * Gets current health status
     * @returns {Object} Current health status
     */
    getCurrentStatus() {
      return {
        status: this.status,
        lastCheck: this.lastCheck,
        timestamp: new Date().toISOString()
      };
    }
  };

  info('Health checker created', { config });
  return healthChecker;
}

/**
 * Creates a simple routing system that maps URL paths to handler functions, demonstrating
 * basic routing concepts before Express.js introduction. Implements pattern matching,
 * parameter extraction, and middleware-style request processing for educational demonstration
 * of web framework concepts.
 * 
 * @param {Object} routes - Route configuration object with path to handler mappings
 * @returns {Function} Router function that processes requests and delegates to appropriate handlers
 */
export function createRouter(routes) {
  if (!routes || typeof routes !== 'object') {
    throw new Error('Routes configuration object is required');
  }

  debug('Creating router with routes', { 
    routeCount: Object.keys(routes).length,
    routes: Object.keys(routes)
  });

  /**
   * Router function that processes HTTP requests and routes to appropriate handlers
   * @param {Object} req - HTTP request object
   * @param {Object} res - HTTP response object
   * @param {Object} context - Request context with correlation ID and metadata
   */
  return async function router(req, res, context) {
    try {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;
      const queryParams = parsedUrl.query;

      debug('Router processing request', {
        method: req.method,
        pathname,
        queryParams,
        correlationId: context.correlationId
      });

      // Find matching route handler
      const routeHandler = routes[pathname];
      
      if (routeHandler && typeof routeHandler === 'function') {
        // Execute route handler with context
        const routeContext = {
          ...context,
          pathname,
          queryParams,
          parsedUrl
        };

        info('Route matched', {
          pathname,
          method: req.method,
          correlationId: context.correlationId
        });

        await routeHandler(req, res, routeContext);
      } else {
        // Handle 404 - Route not found
        warn('Route not found', {
          pathname,
          method: req.method,
          availableRoutes: Object.keys(routes),
          correlationId: context.correlationId
        });

        formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND, {
          error: API_CONSTANTS.ERROR_MESSAGES.ROUTE_NOT_FOUND,
          path: pathname,
          method: req.method
        }, { correlationId: context.correlationId });
      }

    } catch (error) {
      logError('Router error occurred', error, {
        url: req.url,
        method: req.method,
        correlationId: context.correlationId
      });

      // Send error response if headers haven't been sent
      if (!res.headersSent) {
        formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
          error: API_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR
        }, { correlationId: context.correlationId });
      }
    }
  };
}

/**
 * Handles HTTP requests to the /hello endpoint, returning 'Hello world' response with
 * comprehensive logging, performance tracking, and security headers. Implements standardized
 * response formatting and demonstrates basic API endpoint patterns for educational value.
 * 
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object  
 * @param {Object} context - Request context including correlation ID and metadata
 * @returns {void} No return value, sends HTTP response with 'Hello world' message
 */
export async function handleHelloRequest(req, res, context) {
  try {
    const startTime = performance.now();

    info('Processing hello request', {
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.connection?.remoteAddress,
      correlationId: context.correlationId
    });

    // Increment hello endpoint statistics
    requestStats.hello++;
    requestStats.lastRequestTime = Date.now();

    // Validate HTTP method (only GET allowed for this endpoint)
    if (req.method !== 'GET') {
      warn('Invalid HTTP method for hello endpoint', {
        method: req.method,
        correlationId: context.correlationId
      });

      return formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.METHOD_NOT_ALLOWED, {
        error: API_CONSTANTS.ERROR_MESSAGES.METHOD_NOT_ALLOWED,
        allowedMethods: ['GET']
      }, { correlationId: context.correlationId });
    }

    // Create hello response with timestamp and version information
    const helloResponse = {
      ...API_CONSTANTS.RESPONSES.HELLO_WORLD,
      timestamp: new Date().toISOString(),
      server: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version
      }
    };

    // Send successful response
    formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.OK, helloResponse, {
      correlationId: context.correlationId
    });

    // Log response completion with performance metrics
    const responseTime = performance.now() - startTime;
    info('Hello request completed', {
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      responseTime: responseTime.toFixed(2) + 'ms',
      correlationId: context.correlationId
    });

    // Log performance metrics for monitoring
    logPerformanceMetrics({
      endpoint: '/hello',
      responseTime,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      method: req.method
    }, context);

  } catch (error) {
    requestStats.errors++;
    
    logError('Hello request handler error', error, {
      correlationId: context.correlationId,
      url: req.url,
      method: req.method
    });

    // Send error response if headers haven't been sent
    if (!res.headersSent) {
      formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
        error: API_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR
      }, { correlationId: context.correlationId });
    }
  }
}

/**
 * Handles HTTP requests to the /good-evening endpoint, returning 'Good evening' response
 * with consistent formatting, logging, and security practices. Demonstrates additional API
 * endpoint implementation and prepares for Express.js route pattern understanding.
 * 
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Object} context - Request context including correlation ID and metadata
 * @returns {void} No return value, sends HTTP response with 'Good evening' message
 */
export async function handleGoodEveningRequest(req, res, context) {
  try {
    const startTime = performance.now();

    info('Processing good evening request', {
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.connection?.remoteAddress,
      correlationId: context.correlationId
    });

    // Update endpoint-specific statistics
    requestStats.goodEvening++;
    requestStats.lastRequestTime = Date.now();

    // Validate HTTP method (only GET allowed for this endpoint)
    if (req.method !== 'GET') {
      warn('Invalid HTTP method for good evening endpoint', {
        method: req.method,
        correlationId: context.correlationId
      });

      return formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.METHOD_NOT_ALLOWED, {
        error: API_CONSTANTS.ERROR_MESSAGES.METHOD_NOT_ALLOWED,
        allowedMethods: ['GET']
      }, { correlationId: context.correlationId });
    }

    // Create good evening response with timestamp and server information
    const goodEveningResponse = {
      ...API_CONSTANTS.RESPONSES.GOOD_EVENING,
      timestamp: new Date().toISOString(),
      server: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Send successful response with security headers and CORS preparation
    formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.OK, goodEveningResponse, {
      correlationId: context.correlationId,
      corsEnabled: true
    });

    // Record response metrics and performance data
    const responseTime = performance.now() - startTime;
    info('Good evening request completed', {
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      responseTime: responseTime.toFixed(2) + 'ms',
      correlationId: context.correlationId
    });

    // Log performance metrics for monitoring and optimization
    logPerformanceMetrics({
      endpoint: '/good-evening',
      responseTime,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      method: req.method
    }, context);

  } catch (error) {
    requestStats.errors++;
    
    logError('Good evening request handler error', error, {
      correlationId: context.correlationId,
      url: req.url,
      method: req.method
    });

    // Implement error handling with consistent error response patterns
    if (!res.headersSent) {
      formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
        error: API_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR
      }, { correlationId: context.correlationId });
    }
  }
}

/**
 * Handles HTTP requests to the /health endpoint, providing comprehensive system health
 * information including server status, uptime, performance metrics, and resource utilization.
 * Implements health check patterns for load balancer integration and monitoring systems.
 * 
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Object} context - Request context including correlation ID and metadata
 * @returns {void} No return value, sends HTTP response with comprehensive health status information
 */
export async function handleHealthRequest(req, res, context) {
  try {
    const startTime = performance.now();

    debug('Processing health check request', {
      method: req.method,
      correlationId: context.correlationId
    });

    // Update health endpoint statistics
    requestStats.health++;
    requestStats.lastRequestTime = Date.now();

    // Validate HTTP method (only GET allowed for health checks)
    if (req.method !== 'GET') {
      warn('Invalid HTTP method for health endpoint', {
        method: req.method,
        correlationId: context.correlationId
      });

      return formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.METHOD_NOT_ALLOWED, {
        error: API_CONSTANTS.ERROR_MESSAGES.METHOD_NOT_ALLOWED,
        allowedMethods: ['GET']
      }, { correlationId: context.correlationId });
    }

    // Execute comprehensive health check using health checker utility
    const healthStatus = await healthChecker.performHealthCheck();

    // Include dependency status and external service health information
    const comprehensiveHealthResponse = {
      ...healthStatus,
      server: {
        pid: process.pid,
        uptime: process.uptime(),
        startTime: serverStartTime,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        environment: process.env.NODE_ENV || 'development'
      },
      statistics: {
        ...requestStats,
        requestsPerSecond: requestStats.total > 0 ? 
          requestStats.total / (process.uptime() || 1) : 0
      },
      endpoints: {
        total: requestStats.total,
        hello: requestStats.hello,
        goodEvening: requestStats.goodEvening,
        health: requestStats.health,
        errors: requestStats.errors
      }
    };

    // Determine appropriate HTTP status code based on health status
    const statusCode = healthStatus.status === 'healthy' ? 
      HTTP_CONSTANTS.STATUS_CODES.OK : 
      HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;

    // Send comprehensive health response with appropriate status code
    formatHTTPResponse(res, statusCode, comprehensiveHealthResponse, {
      correlationId: context.correlationId
    });

    // Log health check execution for monitoring and debugging
    const responseTime = performance.now() - startTime;
    info('Health check completed', {
      healthStatus: healthStatus.status,
      statusCode,
      responseTime: responseTime.toFixed(2) + 'ms',
      correlationId: context.correlationId
    });

    // Log performance indicators and resource utilization data
    logPerformanceMetrics({
      endpoint: '/health',
      responseTime,
      statusCode,
      method: req.method,
      healthStatus: healthStatus.status
    }, context);

  } catch (error) {
    requestStats.errors++;
    
    logError('Health check handler error', error, {
      correlationId: context.correlationId,
      url: req.url,
      method: req.method
    });

    // Send unhealthy status if health check fails
    if (!res.headersSent) {
      formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE, {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, { correlationId: context.correlationId });
    }
  }
}

/**
 * Factory function that creates the main HTTP request handler implementing routing logic,
 * middleware-style processing, performance measurement, and comprehensive logging. Demonstrates
 * advanced HTTP server patterns and prepares for Express.js framework concepts.
 * 
 * @param {Object} [options={}] - Request handler configuration options
 * @returns {Function} Main request handler function that processes all incoming HTTP requests
 */
export function createRequestHandler(options = {}) {
  const config = {
    enablePerformanceTracking: options.enablePerformanceTracking !== false,
    enableCorrelationTracking: options.enableCorrelationTracking !== false,
    enableSecurityHeaders: options.enableSecurityHeaders !== false,
    enableRequestLogging: options.enableRequestLogging !== false,
    ...options
  };

  // Initialize router with endpoint mappings for /hello, /good-evening, and /health
  const router = createRouter({
    '/hello': handleHelloRequest,
    '/good-evening': handleGoodEveningRequest,
    '/health': handleHealthRequest
  });

  info('Request handler created', { config });

  /**
   * Main HTTP request handler with middleware-style processing
   * @param {Object} req - HTTP request object
   * @param {Object} res - HTTP response object
   */
  return async function requestHandler(req, res) {
    const requestStartTime = performance.now();
    let correlationId = null;
    let requestLogger = null;

    try {
      // Generate correlation ID for request tracking if enabled
      if (config.enableCorrelationTracking) {
        correlationId = generateRequestCorrelationId({
          prefix: 'req',
          includeTimestamp: true,
          includePid: true
        });
      }

      // Create request-scoped logger for correlation tracking
      if (config.enableRequestLogging) {
        requestLogger = createRequestLogger(req, { correlationId });
        requestLogger.logRequest();
      }

      // Set up request processing pipeline with correlation ID and metadata
      const requestContext = {
        correlationId,
        startTime: requestStartTime,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.connection?.remoteAddress,
        requestLogger
      };

      // Update global request statistics for monitoring
      requestStats.total++;
      requestStats.lastRequestTime = Date.now();

      // Log incoming request with correlation tracking
      info('Request received', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        correlationId,
        requestNumber: requestStats.total
      });

      // Apply security header processing as preparation for Helmet.js integration
      if (config.enableSecurityHeaders) {
        res.setHeader('X-Request-ID', correlationId);
        res.setHeader('X-Response-Time', Date.now().toString());
      }

      // Execute routing with middleware-style request processing
      await router(req, res, requestContext);

      // Calculate and log response performance metrics
      if (config.enablePerformanceTracking) {
        const responseTime = performance.now() - requestStartTime;
        
        // Update average response time for monitoring
        requestStats.totalResponseTime += responseTime;
        requestStats.averageResponseTime = requestStats.total > 0 ? 
          requestStats.totalResponseTime / requestStats.total : 0;

        // Log request completion with performance data
        if (requestLogger) {
          requestLogger.logResponse(res.statusCode, responseTime);
        }

        debug('Request processing completed', {
          correlationId,
          responseTime: responseTime.toFixed(2) + 'ms',
          statusCode: res.statusCode || 'unknown',
          totalRequests: requestStats.total
        });
      }

    } catch (error) {
      requestStats.errors++;
      
      logError('Request handler error', error, {
        correlationId,
        url: req.url,
        method: req.method,
        userAgent: req.headers['user-agent']
      });

      // Send error response with comprehensive error logging and formatting
      if (!res.headersSent) {
        formatHTTPResponse(res, HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
          error: API_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR,
          correlationId
        }, { correlationId });
      }

      // Log security event for monitoring suspicious activity
      if (requestLogger) {
        requestLogger.logSecurityEvent('request-processing-error', {
          error: error.message,
          url: req.url,
          method: req.method
        });
      }
    }
  };
}

/**
 * Configures basic security headers for HTTP responses as preparation for Helmet.js integration.
 * Implements fundamental security practices including XSS protection, content type sniffing
 * prevention, and CORS preparation for cross-platform compatibility with Flask implementation.
 * 
 * @param {Object} res - HTTP response object
 * @param {Object} [securityConfig={}] - Security configuration options
 * @returns {void} No return value, modifies response object with security headers
 */
export function setupSecurityHeaders(res, securityConfig = {}) {
  try {
    const config = {
      enableXSSProtection: securityConfig.enableXSSProtection !== false,
      enableContentTypeOptions: securityConfig.enableContentTypeOptions !== false,
      enableFrameOptions: securityConfig.enableFrameOptions !== false,
      enableReferrerPolicy: securityConfig.enableReferrerPolicy !== false,
      enableCacheControl: securityConfig.enableCacheControl !== false,
      customHeaders: securityConfig.customHeaders || {},
      ...securityConfig
    };

    // Apply basic security headers from SECURITY_CONSTANTS configuration
    const securityHeaders = {
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Configure X-Frame-Options header for clickjacking protection
      'X-Frame-Options': 'DENY',
      
      // Add X-XSS-Protection header for cross-site scripting prevention
      'X-XSS-Protection': '1; mode=block',
      
      // Set Referrer-Policy header for privacy and security enhancement
      'Referrer-Policy': 'no-referrer',
      
      // Remove X-Powered-By header to hide technology stack information
      'X-Powered-By': '',
      
      // Configure cache control headers for security and performance optimization
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // Apply security headers to response based on configuration
    Object.entries(securityHeaders).forEach(([header, value]) => {
      const headerKey = header.toLowerCase().replace('x-powered-by', 'X-Powered-By');
      
      // Check if header should be applied based on configuration
      const shouldApply = 
        (header === 'X-XSS-Protection' && config.enableXSSProtection) ||
        (header === 'X-Content-Type-Options' && config.enableContentTypeOptions) ||
        (header === 'X-Frame-Options' && config.enableFrameOptions) ||
        (header === 'Referrer-Policy' && config.enableReferrerPolicy) ||
        (header.includes('Cache-Control') && config.enableCacheControl) ||
        (!header.startsWith('X-') && !header.includes('Cache-Control'));

      if (shouldApply) {
        if (header === 'X-Powered-By') {
          res.removeHeader('X-Powered-By');
        } else {
          res.setHeader(header, value);
        }
      }
    });

    // Configure CORS headers for cross-platform Flask compatibility
    if (config.enableCORS !== false) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Response-Time');
    }

    // Apply custom security headers if provided
    Object.entries(config.customHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });

    debug('Security headers applied', {
      headersSet: Object.keys(securityHeaders).length,
      corsEnabled: config.enableCORS !== false,
      customHeaders: Object.keys(config.customHeaders).length
    });

  } catch (error) {
    logError('Failed to apply security headers', error, { securityConfig });
    
    // Apply minimal security headers as fallback
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.removeHeader('X-Powered-By');
  }
}

/**
 * Configures comprehensive graceful shutdown procedures for SIGTERM and SIGINT signals
 * ensuring proper connection draining, resource cleanup, and statistics reporting. Implements
 * production-ready shutdown patterns compatible with PM2 cluster mode and zero-downtime deployment.
 * 
 * @param {Object} server - HTTP server instance
 * @returns {void} No return value, configures signal handlers for graceful shutdown
 */
export function setupGracefulShutdown(server) {
  if (!server) {
    logError('Server instance required for graceful shutdown setup');
    return;
  }

  /**
   * Graceful shutdown handler for SIGTERM and SIGINT signals
   * @param {string} signal - Signal name (SIGTERM, SIGINT)
   */
  function gracefulShutdownHandler(signal) {
    info('Graceful shutdown initiated', { 
      signal, 
      pid: process.pid, 
      uptime: process.uptime() 
    });

    // Set global shutdown flag to prevent new request acceptance
    isShuttingDown = true;

    // Log comprehensive shutdown initiation information
    logServerStatistics();
    
    info('Server statistics logged, beginning shutdown sequence', {
      signal,
      totalRequests: requestStats.total,
      uptime: process.uptime(),
      pid: process.pid
    });

    // Implement connection draining - stop accepting new connections
    server.close((closeError) => {
      if (closeError) {
        logError('Error occurred during server close', closeError);
      } else {
        info('Server closed successfully, no longer accepting connections');
      }

      // Clean up resources including health checker and performance monitoring
      if (healthChecker) {
        info('Cleaning up health checker resources');
        healthChecker = null;
      }

      // Log final server statistics and performance metrics
      info('Final server statistics', {
        totalRequests: requestStats.total,
        errors: requestStats.errors,
        averageResponseTime: requestStats.averageResponseTime,
        uptime: process.uptime(),
        pid: process.pid
      });

      // Close server instance and exit process with appropriate exit code
      info('Graceful shutdown completed successfully', { signal, pid: process.pid });
      process.exit(0);
    });

    // Force exit after timeout if graceful shutdown takes too long
    const shutdownTimeout = setTimeout(() => {
      logError('Graceful shutdown timeout exceeded, forcing exit', {
        signal,
        timeout: 10000,
        pid: process.pid
      });
      process.exit(1);
    }, 10000); // 10 second timeout

    // Clear timeout if graceful shutdown completes normally
    shutdownTimeout.unref();
  }

  // Register SIGTERM signal handler for production deployment shutdown procedures
  process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));

  // Register SIGINT signal handler for development environment interruption handling
  process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));

  // Handle uncaught exceptions and unhandled promise rejections
  process.on('uncaughtException', (error) => {
    logError('Uncaught exception occurred', error, { pid: process.pid });
    gracefulShutdownHandler('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logError('Unhandled promise rejection', new Error(reason), { 
      promise: promise.toString(),
      pid: process.pid 
    });
    gracefulShutdownHandler('UNHANDLED_REJECTION');
  });

  info('Graceful shutdown handlers configured', {
    signals: ['SIGTERM', 'SIGINT'],
    pid: process.pid,
    timeout: 10000
  });
}

/**
 * Main server startup function that initializes and starts the enhanced HTTP server with
 * comprehensive configuration, routing, monitoring, and production-ready features. Serves as
 * the bridge between basic server concepts and Express.js framework introduction.
 * 
 * @param {Object} [config={}] - Server configuration options and overrides
 * @returns {Promise<Object>} Promise resolving with server instance and configuration
 */
export async function startHTTPServer(config = {}) {
  try {
    info('Starting enhanced HTTP server', { 
      nodeVersion: process.version, 
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    });

    // Load environment configuration with validation and merge with overrides
    const serverConfig = {
      port: config.port || environmentConfig.server?.port || 3000,
      host: config.host || environmentConfig.server?.host || '0.0.0.0',
      enableHealthCheck: config.enableHealthCheck !== false,
      enablePerformanceTracking: config.enablePerformanceTracking !== false,
      enableSecurityHeaders: config.enableSecurityHeaders !== false,
      enableGracefulShutdown: config.enableGracefulShutdown !== false,
      ...config
    };

    // Initialize server statistics tracking and performance monitoring systems
    serverStartTime = Date.now();
    requestStats.startTime = serverStartTime;

    info('Server configuration loaded', {
      port: serverConfig.port,
      host: serverConfig.host,
      features: {
        healthCheck: serverConfig.enableHealthCheck,
        performanceTracking: serverConfig.enablePerformanceTracking,
        securityHeaders: serverConfig.enableSecurityHeaders,
        gracefulShutdown: serverConfig.enableGracefulShutdown
      }
    });

    // Create health checker instance for system monitoring and load balancer integration
    if (serverConfig.enableHealthCheck) {
      healthChecker = createHealthCheck({
        includeSystemInfo: true,
        includeMemoryInfo: true,
        includePerformanceMetrics: true,
        includeDependencies: true
      });

      info('Health checker initialized', { 
        status: healthChecker.status,
        config: healthChecker.config 
      });
    }

    // Configure HTTP server instance with enhanced request handler and routing
    const requestHandler = createRequestHandler({
      enablePerformanceTracking: serverConfig.enablePerformanceTracking,
      enableCorrelationTracking: true,
      enableSecurityHeaders: serverConfig.enableSecurityHeaders,
      enableRequestLogging: true
    });

    // Create HTTP server with comprehensive request handling
    httpServer = http.createServer(requestHandler);

    // Set up graceful shutdown procedures with comprehensive cleanup handling
    if (serverConfig.enableGracefulShutdown) {
      setupGracefulShutdown(httpServer);
    }

    // Start server listening with error handling and validation
    return new Promise((resolve, reject) => {
      httpServer.listen(serverConfig.port, serverConfig.host, (error) => {
        if (error) {
          logError('Failed to start HTTP server', error, { 
            port: serverConfig.port, 
            host: serverConfig.host 
          });
          reject(error);
          return;
        }

        // Log comprehensive server startup information
        const serverInfo = {
          port: serverConfig.port,
          host: serverConfig.host,
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          startTime: new Date(serverStartTime).toISOString()
        };

        info('Enhanced HTTP server started successfully', serverInfo);
        info('Server access URLs', {
          local: `http://localhost:${serverConfig.port}`,
          network: `http://${serverConfig.host}:${serverConfig.port}`,
          endpoints: {
            hello: `http://localhost:${serverConfig.port}/hello`,
            goodEvening: `http://localhost:${serverConfig.port}/good-evening`,
            health: `http://localhost:${serverConfig.port}/health`
          }
        });

        // Initialize monitoring and statistics collection for operational visibility
        const serverResult = {
          server: httpServer,
          config: serverConfig,
          info: serverInfo,
          healthChecker,
          statistics: requestStats,
          endpoints: ['/hello', '/good-evening', '/health']
        };

        resolve(serverResult);
      });

      // Handle server startup errors
      httpServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logError('Port already in use', error, { 
            port: serverConfig.port,
            suggestion: 'Try a different port or stop the conflicting process'
          });
        } else {
          logError('Server startup error', error, serverConfig);
        }
        reject(error);
      });
    });

  } catch (error) {
    logError('HTTP server initialization failed', error, { config });
    throw error;
  }
}

/**
 * Comprehensive server statistics logging function that provides detailed operational metrics
 * including request counts, performance data, resource utilization, and health status for
 * monitoring, debugging, and educational demonstration of server analytics.
 * 
 * @returns {void} No return value, performs comprehensive statistics logging
 */
function logServerStatistics() {
  try {
    // Calculate server uptime since startup
    const uptime = serverStartTime ? Date.now() - serverStartTime : 0;
    const uptimeSeconds = Math.floor(uptime / 1000);

    // Collect comprehensive request statistics
    const statistics = {
      server: {
        uptime: uptimeSeconds,
        startTime: new Date(serverStartTime).toISOString(),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      requests: {
        total: requestStats.total,
        hello: requestStats.hello,
        goodEvening: requestStats.goodEvening,
        health: requestStats.health,
        errors: requestStats.errors,
        lastRequestTime: requestStats.lastRequestTime ? 
          new Date(requestStats.lastRequestTime).toISOString() : null
      },
      performance: {
        averageResponseTime: requestStats.averageResponseTime,
        totalResponseTime: requestStats.totalResponseTime,
        requestsPerSecond: uptimeSeconds > 0 ? requestStats.total / uptimeSeconds : 0,
        errorRate: requestStats.total > 0 ? 
          (requestStats.errors / requestStats.total * 100).toFixed(2) + '%' : '0%'
      },
      system: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      },
      health: {
        status: healthChecker ? healthChecker.status : 'unknown',
        isShuttingDown
      }
    };

    // Log detailed server statistics using structured logging format
    info('Server Statistics Report', statistics);

    // Include health check status and system dependency information
    if (healthChecker) {
      const currentHealth = healthChecker.getCurrentStatus();
      debug('Current health status', currentHealth);
    }

    // Log to monitoring systems and performance tracking databases
    logPerformanceMetrics({
      type: 'server-statistics',
      uptime: uptimeSeconds,
      totalRequests: requestStats.total,
      averageResponseTime: requestStats.averageResponseTime,
      errorRate: statistics.performance.errorRate,
      memoryUsage: statistics.system.memoryUsage.heapUsed
    }, { source: 'server-statistics' });

  } catch (error) {
    logError('Failed to log server statistics', error);
  }
}

// Export main server startup function and utility functions for testing and management
export {
  // Core server functions
  startHTTPServer as default,
  
  // Request handling functions
  createRequestHandler,
  createRouter,
  
  // Endpoint handlers
  handleHelloRequest,
  handleGoodEveningRequest, 
  handleHealthRequest,
  
  // Utility functions
  setupSecurityHeaders,
  setupGracefulShutdown,
  logServerStatistics,
  
  // Helper functions (implemented locally since helpers.js doesn't exist)
  formatHTTPResponse,
  generateRequestCorrelationId as generateRequestId,
  measurePerformance,
  createHealthCheck
};

// Initialize logging for module loading
info('Enhanced HTTP server module loaded', {
  features: [
    'Multiple endpoints (/hello, /good-evening, /health)',
    'Middleware-style request processing',
    'Security headers preparation for Helmet.js',
    'Performance monitoring and metrics',
    'Request correlation tracking',
    'Health check for load balancer integration',
    'Graceful shutdown with PM2 compatibility',
    'Environment configuration integration',
    'Comprehensive logging and error handling',
    'Stateless architecture for horizontal scaling'
  ],
  compatibility: {
    pm2: true,
    cluster: true,
    express: 'preparation',
    flask: 'cross-platform'
  },
  version: '1.0.0'
});