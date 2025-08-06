/**
 * @fileoverview Basic HTTP Server Implementation - Phase 1 Foundation Component
 * @description Educational HTTP server demonstrating core Node.js server creation using only
 * built-in modules without external framework dependencies. Implements modern ES Modules patterns,
 * comprehensive logging, graceful shutdown procedures, and production-ready patterns for PM2
 * cluster deployment. Serves as the foundational component for progressive enhancement through
 * Express.js integration, Flask cross-platform migration, and comprehensive testing.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Objectives:
 * - Demonstrate fundamental HTTP server concepts without framework abstractions
 * - Implement modern JavaScript ES Modules and Node.js v22.x LTS features
 * - Create production-ready server lifecycle management with startup and shutdown
 * - Develop logging, monitoring, and performance tracking practices
 * - Build foundation for Express.js framework integration in subsequent phases
 * - Prepare for PM2 cluster mode deployment and horizontal scaling
 * - Understand stateless architecture principles for distributed systems
 * 
 * Production Features:
 * - Stateless architecture compatible with PM2 cluster mode
 * - Comprehensive logging with request correlation tracking
 * - Graceful shutdown with SIGTERM/SIGINT signal handling
 * - Performance measurement and request tracking
 * - Error handling with detailed context and recovery procedures
 * - Modern ES Modules implementation as 2025 standard
 * 
 * Technology Stack:
 * - Node.js v22.x LTS with Active LTS support extending into late 2025
 * - ES Modules (ESM) for better tooling support and web standards alignment
 * - Node.js core HTTP module for basic server functionality
 * - Node.js URL module for request parsing and path extraction
 * - Comprehensive logging system with environment-aware configuration
 */

// Node.js built-in module imports with version comments
import http from 'node:http'; // Node.js built-in - Core HTTP server functionality for creating web servers
import url from 'node:url'; // Node.js built-in - URL parsing utilities for request path and query extraction
import os from 'node:os'; // Node.js built-in - Operating system utilities for system metrics

// Internal module imports for logging and configuration
import logger, { generateRequestId } from './utils/logger.js';
import { 
  ENV_CONSTANTS, 
  HTTP_CONSTANTS, 
  API_CONSTANTS 
} from './utils/constants.js';

// Global state management for server lifecycle and statistics
let httpServer = null; // HTTP server instance reference for lifecycle management
let requestCounter = 0; // Total request counter for basic statistics tracking
let serverStartTime = null; // Server startup timestamp for uptime calculation
let isShuttingDown = false; // Shutdown flag to prevent new request acceptance

/**
 * Performance measurement utility function for request timing and optimization monitoring
 * @description Measures execution time for performance tracking and response time optimization
 * @param {Function} asyncOperation - Async operation to measure
 * @param {Object} [context={}] - Additional context for performance logging
 * @returns {Promise<{result: any, duration: number}>} Operation result with execution duration
 */
async function measurePerformance(asyncOperation, context = {}) {
  const startTime = process.hrtime.bigint();
  const startTimestamp = Date.now();
  
  try {
    const result = await asyncOperation();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert nanoseconds to milliseconds
    
    // Log performance metrics with context
    logger.debug('Performance measurement completed', {
      operation: context.operation || 'unknown',
      duration: `${duration.toFixed(2)}ms`,
      startTimestamp,
      endTimestamp: Date.now(),
      ...context
    });
    
    return { result, duration };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    logger.error('Performance measurement failed', error, {
      operation: context.operation || 'unknown',
      duration: `${duration.toFixed(2)}ms`,
      ...context
    });
    
    throw error;
  }
}

/**
 * Creates the main HTTP request handler function that processes all incoming HTTP requests
 * and returns 'Hello world' response with comprehensive logging, performance tracking, and
 * request correlation for educational demonstration of basic HTTP server functionality.
 * 
 * @param {Object} [options={}] - Request handler configuration options
 * @param {boolean} [options.enablePerformanceTracking=true] - Enable request performance measurement
 * @param {boolean} [options.enableDetailedLogging=true] - Enable detailed request logging
 * @param {string} [options.responseMessage] - Custom response message override
 * @returns {Function} Request handler function that accepts req and res parameters for HTTP request processing
 */
export function createRequestHandler(options = {}) {
  const config = {
    enablePerformanceTracking: options.enablePerformanceTracking !== false,
    enableDetailedLogging: options.enableDetailedLogging !== false,
    responseMessage: options.responseMessage || API_CONSTANTS.RESPONSES.HELLO_WORLD.message,
    ...options
  };

  /**
   * HTTP request handler function processing individual requests
   * @param {http.IncomingMessage} req - HTTP request object
   * @param {http.ServerResponse} res - HTTP response object
   */
  return async function requestHandler(req, res) {
    // Generate unique request ID using generateRequestId helper for request correlation and debugging
    const requestId = generateRequestId({ 
      prefix: 'req',
      metadata: { 
        method: req.method, 
        url: req.url,
        userAgent: req.headers['user-agent']
      }
    });

    // Start performance measurement using custom measurePerformance helper for response time tracking
    const performanceStart = process.hrtime.bigint();
    
    try {
      // Parse request URL and extract method, path information using Node.js URL module
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const requestPath = parsedUrl.pathname;
      const requestMethod = req.method;
      
      // Log incoming request details including method, URL, user agent, and timestamp with request ID
      if (config.enableDetailedLogging) {
        logger.info('Incoming HTTP request', {
          requestId,
          method: requestMethod,
          url: req.url,
          path: requestPath,
          userAgent: req.headers['user-agent'] || 'Unknown',
          ip: req.socket.remoteAddress || 'Unknown',
          timestamp: new Date().toISOString(),
          headers: {
            host: req.headers.host,
            accept: req.headers.accept,
            'accept-encoding': req.headers['accept-encoding'],
            connection: req.headers.connection
          }
        });
      }

      // Increment global request counter for basic statistics tracking and monitoring
      requestCounter++;

      // Check if server is shutting down and reject new requests
      if (isShuttingDown) {
        logger.warn('Request rejected during shutdown', {
          requestId,
          method: requestMethod,
          url: req.url,
          shutdownStatus: 'active'
        });

        // Set appropriate shutdown response headers
        res.writeHead(HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE, {
          [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.PLAIN_TEXT,
          [HTTP_CONSTANTS.HEADERS.CONNECTION]: 'close'
        });
        res.end('Server is shutting down');
        return;
      }

      // Calculate performance metrics first for response headers
      const performanceEnd = process.hrtime.bigint();
      const duration = Number(performanceEnd - performanceStart) / 1000000; // Convert to milliseconds

      // Set HTTP response headers including Content-Type application/json from HTTP_CONSTANTS
      res.writeHead(HTTP_CONSTANTS.STATUS_CODES.OK, {
        [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration.toFixed(2)}ms`,
        'X-Server': 'Node.js Basic HTTP Server v1.0.0'
      });

      // Create JSON response with 'Hello world' message from API_CONSTANTS.RESPONSES
      const responseMessage = typeof API_CONSTANTS.RESPONSES.HELLO_WORLD.message === 'function' 
        ? API_CONSTANTS.RESPONSES.HELLO_WORLD.message() 
        : API_CONSTANTS.RESPONSES.HELLO_WORLD.message;
      
      const jsonResponse = {
        message: config.responseMessage || responseMessage
      };
      
      // Send JSON response and end - this ensures SuperTest can parse the body properly
      res.end(JSON.stringify(jsonResponse));

      // Log request completion with performance metrics and response time
      logger.info('Request completed successfully', {
        requestId,
        method: requestMethod,
        url: req.url,
        path: requestPath,
        statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
        responseTime: `${duration.toFixed(2)}ms`,
        requestNumber: requestCounter,
        timestamp: new Date().toISOString(),
        performance: {
          duration: duration,
          threshold: 100, // 100ms threshold from requirements
          withinThreshold: duration < 100
        }
      });

      // Performance tracking and alerting
      if (config.enablePerformanceTracking) {
        if (duration > 100) {
          logger.warn('Slow response detected', {
            requestId,
            responseTime: `${duration.toFixed(2)}ms`,
            threshold: '100ms',
            method: requestMethod,
            url: req.url
          });
        }
      }

    } catch (error) {
      // Handle any errors gracefully with 500 status response and error logging
      const performanceEnd = process.hrtime.bigint();
      const duration = Number(performanceEnd - performanceStart) / 1000000;

      logger.error('Request processing failed', error, {
        requestId,
        method: req.method,
        url: req.url,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        responseTime: `${duration.toFixed(2)}ms`,
        requestNumber: requestCounter
      });

      // Send error response if headers haven't been sent
      if (!res.headersSent) {
        try {
          res.writeHead(HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
            [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.PLAIN_TEXT,
            'X-Request-ID': requestId,
            'X-Error': 'Internal Server Error'
          });
          res.end('Internal Server Error');
        } catch (responseError) {
          logger.error('Failed to send error response', responseError, { requestId });
        }
      }
    }
  };
}

/**
 * Configures graceful shutdown procedures for SIGTERM and SIGINT signals ensuring proper
 * server cleanup, connection draining, and clean process termination for production-ready
 * behavior and PM2 cluster compatibility.
 * 
 * @param {http.Server} server - HTTP server instance to configure for graceful shutdown
 * @returns {void} No return value, sets up signal handlers for graceful shutdown
 */
export function setupGracefulShutdown(server) {
  // Track shutdown process state
  let shutdownInProgress = false;
  
  // Check if signal handlers are already configured to prevent memory leaks
  if (process._gracefulShutdownConfigured) {
    return;
  }
  process._gracefulShutdownConfigured = true;
  
  /**
   * Graceful shutdown handler function
   * @param {string} signal - Signal type that triggered shutdown (SIGTERM or SIGINT)
   */
  async function gracefulShutdown(signal) {
    if (shutdownInProgress) {
      logger.warn('Shutdown already in progress, ignoring signal', { 
        signal,
        shutdownInProgress: true 
      });
      return;
    }

    shutdownInProgress = true;
    
    // Set global isShuttingDown flag to prevent new request acceptance during shutdown
    isShuttingDown = true;

    // Log shutdown initiation with timestamp, signal type, and server statistics
    const shutdownStartTime = Date.now();
    const uptime = serverStartTime ? Date.now() - serverStartTime : 0;
    
    logger.info('Graceful shutdown initiated', {
      signal,
      uptime: `${(uptime / 1000).toFixed(2)}s`,
      totalRequests: requestCounter,
      shutdownStartTime: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version
    });

    // Log current server statistics before shutdown
    logServerStats();

    try {
      // Stop accepting new connections while allowing existing requests to complete
      logger.info('Stopping server from accepting new connections');
      
      // Close server instance and clean up all resources and connections
      await new Promise((resolve, reject) => {
        const shutdownTimeout = setTimeout(() => {
          logger.warn('Graceful shutdown timeout reached, forcing close');
          reject(new Error('Shutdown timeout'));
        }, API_CONSTANTS.TIMEOUTS.GRACEFUL_SHUTDOWN);

        server.close((error) => {
          clearTimeout(shutdownTimeout);
          if (error) {
            logger.error('Error during server close', error);
            reject(error);
          } else {
            logger.info('Server closed successfully');
            resolve();
          }
        });
      });

      // Log shutdown completion with final statistics and uptime information
      const shutdownDuration = Date.now() - shutdownStartTime;
      logger.info('Graceful shutdown completed successfully', {
        signal,
        shutdownDuration: `${shutdownDuration}ms`,
        finalUptime: `${(uptime / 1000).toFixed(2)}s`,
        totalRequestsProcessed: requestCounter,
        shutdownCompletedAt: new Date().toISOString(),
        processId: process.pid
      });

      // Exit process with appropriate exit code (0 for clean shutdown)
      process.exit(0);

    } catch (shutdownError) {
      // Log shutdown failure and force exit
      logger.error('Graceful shutdown failed, forcing exit', shutdownError, {
        signal,
        shutdownDuration: Date.now() - shutdownStartTime,
        processId: process.pid
      });

      // Force exit with error code
      process.exit(1);
    }
  }

  // Register SIGTERM signal handler for production deployment shutdown requests
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received, initiating graceful shutdown');
    gracefulShutdown('SIGTERM');
  });

  // Register SIGINT signal handler for development environment Ctrl+C interruption
  process.on('SIGINT', () => {
    logger.info('SIGINT signal received (Ctrl+C), initiating graceful shutdown');
    gracefulShutdown('SIGINT');
  });

  // Additional signal handlers for comprehensive shutdown coverage
  process.on('SIGHUP', () => {
    logger.info('SIGHUP signal received, initiating graceful shutdown');
    gracefulShutdown('SIGHUP');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception detected, initiating emergency shutdown', error, {
      emergency: true,
      processId: process.pid
    });
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection detected', new Error(reason), {
      reason: reason,
      promise: promise,
      emergency: true,
      processId: process.pid
    });
    gracefulShutdown('unhandledRejection');
  });

  logger.info('Graceful shutdown handlers configured', {
    signals: ['SIGTERM', 'SIGINT', 'SIGHUP'],
    handlers: ['uncaughtException', 'unhandledRejection'],
    timeout: `${API_CONSTANTS.TIMEOUTS.GRACEFUL_SHUTDOWN}ms`
  });
}

/**
 * Main server startup function that initializes and starts the basic HTTP server with
 * configuration loading, error handling, logging, graceful shutdown setup, and comprehensive
 * monitoring for educational demonstration and production readiness.
 * 
 * @param {Object} [options={}] - Server startup configuration options
 * @param {number} [options.port] - Server port override
 * @param {string} [options.host] - Server host override
 * @param {boolean} [options.enableLogging] - Enable comprehensive logging
 * @param {boolean} [options.enableGracefulShutdown] - Enable graceful shutdown handlers
 * @returns {Promise<http.Server>} Promise that resolves with server instance when successfully started
 */
export async function startBasicServer(options = {}) {
  try {
    // Load server configuration including port from ENV_CONSTANTS.DEFAULT_PORT (3000)
    const serverConfig = {
      port: options.port || ENV_CONSTANTS.DEFAULT_PORT,
      host: options.host || ENV_CONSTANTS.DEFAULT_HOST,
      enableLogging: options.enableLogging !== false,
      enableGracefulShutdown: options.enableGracefulShutdown !== false,
      enablePerformanceTracking: options.enablePerformanceTracking !== false,
      ...options
    };

    // Validate configuration parameters and check port availability
    // Port 0 is valid and means "let OS assign an available port"
    if (serverConfig.port == null || serverConfig.port < 0 || serverConfig.port > 65535) {
      throw new Error(`Invalid port number: ${serverConfig.port}. Port must be between 0 and 65535 (0 = OS-assigned).`);
    }

    if (typeof serverConfig.host !== 'string' || serverConfig.host.length === 0) {
      throw new Error(`Invalid host configuration: ${serverConfig.host}. Host must be a valid string.`);
    }

    // Initialize server statistics and set serverStartTime global variable
    serverStartTime = Date.now();
    requestCounter = 0;
    isShuttingDown = false;

    logger.info('Starting basic HTTP server', {
      config: serverConfig,
      environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      nodeVersion: process.version,
      processId: process.pid,
      startupTime: new Date().toISOString()
    });

    // Create HTTP server instance using Node.js core HTTP module
    const requestHandler = createRequestHandler({
      enablePerformanceTracking: serverConfig.enablePerformanceTracking,
      enableDetailedLogging: serverConfig.enableLogging
    });

    // Attach createRequestHandler function to handle all incoming requests
    httpServer = http.createServer(requestHandler);

    // Configure server timeouts for production readiness
    httpServer.timeout = API_CONSTANTS.TIMEOUTS.SERVER_TIMEOUT;
    httpServer.keepAliveTimeout = API_CONSTANTS.TIMEOUTS.KEEP_ALIVE_TIMEOUT;
    httpServer.headersTimeout = API_CONSTANTS.TIMEOUTS.HEADERS_TIMEOUT;

    // Configure graceful shutdown procedures using setupGracefulShutdown function
    if (serverConfig.enableGracefulShutdown) {
      setupGracefulShutdown(httpServer);
    }

    // Start server listening on configured port and host with error handling
    await new Promise((resolve, reject) => {
      httpServer.listen(serverConfig.port, serverConfig.host, (error) => {
        if (error) {
          logger.error('Failed to start HTTP server', error, {
            config: serverConfig,
            timestamp: new Date().toISOString()
          });
          reject(error);
        } else {
          resolve();
        }
      });

      // Handle server errors during startup
      httpServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          const errorMessage = `Port ${serverConfig.port} is already in use. Please choose a different port or stop the conflicting service.`;
          logger.error('Server startup failed - port in use', error, {
            port: serverConfig.port,
            host: serverConfig.host,
            suggestion: 'Try using a different port or check for running processes'
          });
          reject(new Error(errorMessage));
        } else if (error.code === 'EACCES') {
          const errorMessage = `Permission denied to bind to port ${serverConfig.port}. Try using a port above 1024 or run with appropriate privileges.`;
          logger.error('Server startup failed - permission denied', error, {
            port: serverConfig.port,
            host: serverConfig.host,
            suggestion: 'Use a port above 1024 or run with sudo (not recommended)'
          });
          reject(new Error(errorMessage));
        } else {
          logger.error('Server startup failed - unknown error', error, {
            config: serverConfig
          });
          reject(error);
        }
      });

      // Handle client connection errors
      httpServer.on('clientError', (error, socket) => {
        logger.warn('Client connection error', {
          error: error.message,
          clientAddress: socket.remoteAddress,
          clientPort: socket.remotePort,
          timestamp: new Date().toISOString()
        });

        // Close the client socket on error
        if (socket.writable) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
    });

    // Log successful server startup with access URL and configuration details
    const serverAddress = httpServer.address();
    const accessUrl = `http://${serverConfig.host === '0.0.0.0' ? 'localhost' : serverConfig.host}:${serverAddress.port}`;
    
    logger.info('Basic HTTP server started successfully', {
      url: accessUrl,
      port: serverAddress.port,
      host: serverConfig.host,
      family: serverAddress.family,
      config: serverConfig,
      uptime: Date.now() - serverStartTime,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      architecture: process.arch
    });

    // Log initial server statistics
    if (serverConfig.enableLogging) {
      setTimeout(() => {
        logServerStats();
      }, 1000); // Log stats after 1 second of operation
    }

    // Set global httpServer variable for external management and testing
    global.httpServer = httpServer;

    // Return Promise resolving with server instance for testing and integration
    return httpServer;

  } catch (error) {
    logger.error('Critical server startup failure', error, {
      config: options,
      timestamp: new Date().toISOString(),
      processId: process.pid
    });
    
    // Cleanup on startup failure
    if (httpServer) {
      try {
        httpServer.close();
      } catch (cleanupError) {
        logger.error('Failed to cleanup server after startup failure', cleanupError);
      }
    }
    
    throw error;
  }
}

/**
 * Logs comprehensive server statistics including uptime, request count, memory usage,
 * and performance metrics for monitoring, debugging, and educational demonstration of
 * server operation analytics.
 * 
 * @returns {void} No return value, performs logging side effect
 */
/**
 * Validates server configuration for security and reliability
 * @param {Object} config - Server configuration to validate
 * @returns {Object} Validation result with isValid and errors properties
 */
export function validateServerConfig(config = {}) {
  const errors = [];
  const warnings = [];

  // Validate port
  if (config.port !== undefined) {
    // Port 0 is valid and means "let OS assign an available port"
    if (typeof config.port !== 'number' || config.port < 0 || config.port > 65535) {
      errors.push('Port must be a valid number between 0 and 65535 (0 = OS-assigned)');
    }
    if (config.port < 1024 && process.getuid && process.getuid() !== 0) {
      warnings.push('Port below 1024 may require root privileges');
    }
  }

  // Validate host
  if (config.host !== undefined) {
    if (typeof config.host !== 'string' || config.host.trim() === '') {
      errors.push('Host must be a non-empty string');
    }
  }

  // Validate environment
  if (config.environment !== undefined) {
    const validEnvs = ['development', 'staging', 'production', 'test'];
    if (!validEnvs.includes(config.environment)) {
      errors.push(`Environment must be one of: ${validEnvs.join(', ')}`);
    }
  }

  // Validate timeout settings
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout < 0) {
      errors.push('Timeout must be a non-negative number');
    }
  }

  // Validate request size limits
  if (config.maxRequestSize !== undefined) {
    if (typeof config.maxRequestSize !== 'number' || config.maxRequestSize <= 0) {
      errors.push('Max request size must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timestamp: new Date().toISOString()
  };
}

export function logServerStats() {
  try {
    // Calculate server uptime since startup using serverStartTime global
    const currentTime = Date.now();
    const uptime = serverStartTime ? currentTime - serverStartTime : 0;
    const uptimeSeconds = uptime / 1000;

    // Collect memory usage statistics using process.memoryUsage()
    const memoryUsage = process.memoryUsage();
    const memoryInMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024 * 100) / 100
    };

    // Format request statistics including total count from requestCounter global
    const requestStats = {
      totalRequests: requestCounter,
      requestsPerSecond: uptimeSeconds > 0 ? (requestCounter / uptimeSeconds).toFixed(2) : 0,
      averageRequestsPerMinute: uptimeSeconds > 0 ? (requestCounter / (uptimeSeconds / 60)).toFixed(2) : 0
    };

    // Include Node.js version and environment information for context
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      processId: process.pid,
      environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      pm2Instance: process.env.PM2_HOME ? true : false
    };

    // Include performance metrics and resource utilization information
    const performanceMetrics = {
      cpuUsage: process.cpuUsage(),
      resourceUsage: process.resourceUsage ? process.resourceUsage() : null,
      loadAverage: process.platform !== 'win32' ? os.loadavg() : null
    };

    // Server status information
    const serverStatus = {
      isRunning: httpServer ? !httpServer.closed : false,
      isShuttingDown: isShuttingDown,
      listening: httpServer ? httpServer.listening : false,
      maxConnections: httpServer ? httpServer.maxConnections : null,
      address: httpServer ? httpServer.address() : null
    };

    // Log comprehensive server statistics using logger.info for visibility
    logger.info('Server statistics report', {
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        seconds: uptimeSeconds,
        formatted: formatUptime(uptime)
      },
      requests: requestStats,
      memory: {
        usage: memoryInMB,
        percentage: {
          heapUsed: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
        }
      },
      system: systemInfo,
      performance: performanceMetrics,
      server: serverStatus,
      health: {
        status: isShuttingDown ? 'shutting_down' : 'healthy',
        memoryPressure: memoryInMB.heapUsed > 100 ? 'high' : 'normal',
        requestLoad: requestStats.requestsPerSecond > 10 ? 'high' : 'normal'
      }
    });

    // Performance warnings based on metrics
    if (memoryInMB.heapUsed > 100) {
      logger.warn('High memory usage detected', {
        heapUsed: `${memoryInMB.heapUsed}MB`,
        threshold: '100MB',
        recommendation: 'Consider memory optimization or process restart'
      });
    }

    if (requestStats.requestsPerSecond > 50) {
      logger.warn('High request rate detected', {
        requestsPerSecond: requestStats.requestsPerSecond,
        threshold: '50 req/s',
        recommendation: 'Consider implementing rate limiting or scaling'
      });
    }

  } catch (error) {
    logger.error('Failed to generate server statistics', error, {
      timestamp: new Date().toISOString(),
      processId: process.pid
    });
  }
}

/**
 * Formats uptime duration into human-readable string
 * @private
 * @param {number} uptimeMs - Uptime in milliseconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(uptimeMs) {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Sets up periodic server statistics logging for monitoring
 * @private
 * @param {number} [interval=60000] - Logging interval in milliseconds (default 1 minute)
 */
function setupPeriodicStatsLogging(interval = 60000) {
  const statsInterval = setInterval(() => {
    if (!isShuttingDown) {
      logServerStats();
    } else {
      clearInterval(statsInterval);
      logger.debug('Stopped periodic stats logging due to shutdown');
    }
  }, interval);

  // Clear interval on process exit
  process.on('exit', () => {
    clearInterval(statsInterval);
  });

  logger.debug('Periodic server stats logging configured', {
    interval: `${interval}ms`,
    intervalId: statsInterval[Symbol.toPrimitive] ? statsInterval[Symbol.toPrimitive]() : 'enabled'
  });
}

// Initialize the basic HTTP server if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('Basic HTTP server module executed directly, starting server');
  
  try {
    const server = await startBasicServer({
      enableLogging: true,
      enableGracefulShutdown: true,
      enablePerformanceTracking: true
    });

    // Setup periodic statistics logging for monitoring
    setupPeriodicStatsLogging(60000); // Log stats every minute

    logger.info('Server initialization completed successfully', {
      timestamp: new Date().toISOString(),
      serverReady: true,
      moduleExecution: 'direct'
    });

  } catch (error) {
    logger.error('Failed to start server from direct module execution', error, {
      timestamp: new Date().toISOString(),
      moduleExecution: 'direct',
      processId: process.pid
    });
    process.exit(1);
  }
}

// Export all functions for external use and testing
export {
  httpServer,
  requestCounter,
  serverStartTime,
  isShuttingDown,
  measurePerformance
};

// Log module initialization
logger.info('Basic HTTP server module loaded', {
  moduleType: 'ES Module',
  version: '1.0.0',
  nodeVersion: process.version,
  exports: ['startBasicServer', 'createRequestHandler', 'setupGracefulShutdown', 'logServerStats'],
  timestamp: new Date().toISOString(),
  processId: process.pid,
  platform: process.platform
});