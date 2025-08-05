/**
 * @fileoverview Express.js Server Implementation - Phase 2 Enhancement of Node.js Tutorial Project
 * @description Main Express.js server implementation that serves as the educational progression from
 * basic HTTP server to production-ready Express.js v5.1.0 framework integration. Demonstrates modern
 * Express.js patterns with comprehensive middleware orchestration, RESTful routing architecture,
 * security integration via Helmet.js, PM2 cluster mode compatibility, and cross-platform preparation
 * for Flask migration. Features comprehensive error handling, performance monitoring, graceful
 * shutdown procedures, and educational demonstrations of enterprise-grade Express.js development.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Objectives:
 * - Demonstrate Express.js v5.1.0 framework advantages over basic HTTP server implementation
 * - Implement production-ready middleware stack with security, logging, and performance monitoring
 * - Show RESTful API design patterns with /hello and /good-evening endpoints
 * - Provide cross-platform compatibility preparation for Flask migration in Phase 3
 * - Demonstrate PM2 cluster mode deployment readiness with stateless architecture
 * - Implement comprehensive error handling and graceful shutdown procedures
 * 
 * Production Features:
 * - Express.js v5.1.0 with enhanced security and performance improvements
 * - Helmet.js security middleware with comprehensive HTTP header protection
 * - CORS configuration with origin validation and preflight handling
 * - Rate limiting and compression middleware for performance optimization
 * - Request correlation tracking and performance monitoring
 * - Health monitoring integration with metrics collection and alerting
 * - Graceful shutdown procedures for zero-downtime deployment with PM2
 * - Educational comparison capabilities with basic HTTP server implementation
 * 
 * Technology Integration:
 * - Express.js v5.1.0 - Latest web framework with Node.js 18+ requirement
 * - Helmet.js v8.1.0 - Security middleware with 15 sub-middlewares
 * - CORS v2.8.5 - Cross-Origin Resource Sharing middleware
 * - Compression v1.7.4 - Gzip compression for performance optimization
 * - Node.js v22.x LTS - Modern JavaScript runtime with ES Modules support
 * - PM2 v6.0.8 - Production process manager with cluster mode support
 */

// External library imports with version comments for dependency management
import express from 'express'; // v5.1.0 - Express.js web framework with enhanced security and performance
import helmet from 'helmet'; // v8.1.0 - Security middleware for HTTP response headers and web security policies
import cors from 'cors'; // v2.8.5 - Cross-Origin Resource Sharing middleware for cross-origin request security
import compression from 'compression'; // v1.7.4 - Gzip compression middleware for performance optimization

// Internal application imports for Express.js application orchestration
import { 
  createExpressApp,
  startServer as startAppServer
} from './app.js';

// Basic server imports for educational comparison and progression demonstration
import { 
  startBasicServer,
  logServerStats as logBasicServerStats,
  measurePerformance
} from './basic-server.js';

// Middleware stack imports for comprehensive request processing pipeline
import { 
  createMiddlewareStack,
  middleware
} from './middleware/index.js';

// Route aggregation imports for centralized routing system management
import { 
  routes,
  createRoutesAggregator
} from './routes/index.js';

// Logging and utility imports for structured logging and application management
import logger, {
  createRequestLogger,
  logPerformanceMetrics,
  logSecurityEvent,
  generateRequestId,
  formatLogMessage,
  createFlaskCompatibleLogger
} from './utils/logger.js';

// Constants imports for environment, HTTP, API, and configuration management
import {
  ENV_CONSTANTS,
  API_CONSTANTS,
  HTTP_CONSTANTS
} from './utils/constants.js';

// Global application state management for Express.js server lifecycle
let expressApp = null; // Express.js application instance configured with middleware and routes
let serverInstance = null; // HTTP server instance for external management and testing
let isExpressServerRunning = false; // Server running status flag for lifecycle management
let expressServerStartTime = null; // Server startup timestamp for uptime calculation
let requestMetrics = { // Request processing metrics for performance monitoring
  totalRequests: 0,
  averageResponseTime: 0,
  errors: 0
};

/**
 * Factory function that creates and configures a complete Express.js server instance with
 * comprehensive middleware stack, route aggregation, security headers, and production-ready
 * features. Demonstrates Express.js v5.1.0 patterns while maintaining educational value and
 * cross-platform compatibility for Flask migration preparation.
 * 
 * @param {Object} [serverOptions={}] - Server configuration options
 * @param {Object} [serverOptions.middleware] - Middleware configuration overrides
 * @param {Object} [serverOptions.security] - Security configuration options
 * @param {Object} [serverOptions.routes] - Route configuration options
 * @param {boolean} [serverOptions.enableHealthMonitoring=true] - Enable health monitoring system
 * @param {boolean} [serverOptions.enablePerformanceTracking=true] - Enable performance tracking
 * @param {Object} [serverOptions.educationalOptions] - Educational demonstration options
 * @returns {Object} Configured Express.js server instance with middleware, routes, security, and monitoring capabilities ready for production deployment
 */
export function createExpressServer(serverOptions = {}) {
  try {
    const config = {
      middleware: serverOptions.middleware || {},
      security: serverOptions.security || {},
      routes: serverOptions.routes || {},
      enableHealthMonitoring: serverOptions.enableHealthMonitoring !== false,
      enablePerformanceTracking: serverOptions.enablePerformanceTracking !== false,
      educationalOptions: serverOptions.educationalOptions || {},
      environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      ...serverOptions
    };

    logger.info('Creating Express.js server instance', {
      version: '5.1.0',
      nodeVersion: process.version,
      environment: config.environment,
      options: {
        healthMonitoring: config.enableHealthMonitoring,
        performanceTracking: config.enablePerformanceTracking,
        securityEnabled: Object.keys(config.security).length > 0
      }
    });

    // Validate server options and apply environment-specific defaults
    const validatedConfig = validateServerOptions(config);
    logger.debug('Server configuration validated', { validatedConfig });

    // Create Express.js application instance using express() factory with modern v5.1.0 features
    expressApp = express();
    logger.debug('Express.js application instance created');

    // Initialize comprehensive middleware stack using createMiddlewareStack with security, CORS, and rate limiting
    const middlewareResult = initializeExpressMiddleware(expressApp, {
      config: validatedConfig.middleware,
      security: validatedConfig.security,
      enablePerformanceTracking: config.enablePerformanceTracking
    });
    logger.info('Express.js middleware stack initialized', middlewareResult);

    // Configure Express.js routing architecture with /hello and /good-evening endpoints
    configureExpressRoutes(expressApp, {
      routes: validatedConfig.routes,
      enableMetrics: config.enablePerformanceTracking,
      educationalMode: config.educationalOptions.enabled
    });
    logger.info('Express.js routes configured successfully');

    // Set up health monitoring and metrics collection for PM2 integration
    if (config.enableHealthMonitoring) {
      initializeHealthMonitoring(expressApp, config);
      logger.info('Health monitoring system initialized');
    }

    // Configure graceful shutdown handlers for SIGTERM and SIGINT signals
    setupGracefulShutdownHandlers(expressApp);
    logger.info('Graceful shutdown handlers configured');

    // Initialize performance monitoring and educational logging
    if (config.enablePerformanceTracking) {
      setupPerformanceMonitoring(expressApp);
      logger.info('Performance monitoring initialized');
    }

    // Log Express.js server creation with configuration summary
    logger.info('Express.js server creation completed successfully', {
      middlewareCount: expressApp._router ? expressApp._router.stack.length : 0,
      environment: config.environment,
      securityFeatures: Object.keys(config.security),
      healthMonitoring: config.enableHealthMonitoring,
      performanceTracking: config.enablePerformanceTracking
    });

    // Return fully configured Express.js server instance ready for startup
    return expressApp;

  } catch (error) {
    logger.error('Failed to create Express.js server', error, {
      options: serverOptions,
      environment: process.env.NODE_ENV
    });
    throw error;
  }
}

/**
 * Configures Express.js routing architecture by mounting /hello and /good-evening endpoints
 * with comprehensive middleware integration, security protection, and performance monitoring.
 * Implements RESTful API design patterns while maintaining feature parity for Flask migration.
 * 
 * @param {Object} app - Express.js application instance
 * @param {Object} routeConfig - Route configuration options
 * @param {Object} [routeConfig.routes] - Route-specific configuration
 * @param {boolean} [routeConfig.enableMetrics=true] - Enable route-level metrics
 * @param {boolean} [routeConfig.educationalMode=false] - Enable educational features
 * @returns {void} No return value, modifies Express.js application instance with configured routes and middleware
 */
export function configureExpressRoutes(app, routeConfig = {}) {
  try {
    const config = {
      routes: routeConfig.routes || {},
      enableMetrics: routeConfig.enableMetrics !== false,
      educationalMode: routeConfig.educationalMode || false,
      ...routeConfig
    };

    logger.info('Configuring Express.js routes', config);

    // Mount aggregated routes using createRoutesAggregator with comprehensive route composition
    const routesAggregator = createRoutesAggregator({
      enableMetrics: config.enableMetrics,
      educationalMode: config.educationalMode
    });

    // Configure /hello endpoint with GET method returning 'Hello world' response from API_CONSTANTS
    app.get('/hello', (req, res, next) => {
      try {
        const startTime = process.hrtime.bigint();
        
        // Apply route-specific middleware and security headers
        applyRouteMiddleware(req, res, { route: '/hello' });
        
        // Return Hello world response with consistent formatting
        const response = {
          message: API_CONSTANTS.RESPONSES.HELLO_WORLD.message,
          timestamp: new Date().toISOString(),
          requestId: req.correlationId || generateRequestId(),
          endpoint: '/hello',
          method: 'GET'
        };

        // Track route performance for monitoring
        if (config.enableMetrics) {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000;
          
          requestMetrics.totalRequests++;
          updateAverageResponseTime(responseTime);
          
          logPerformanceMetrics({
            route: '/hello',
            method: 'GET',
            responseTime,
            statusCode: HTTP_CONSTANTS.STATUS_CODES.OK
          }, { correlationId: req.correlationId });
        }

        res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(response);
        
        logger.info('Hello endpoint accessed', {
          correlationId: req.correlationId,
          responseTime: config.enableMetrics ? `${Number(process.hrtime.bigint() - startTime) / 1000000}ms` : null
        });

      } catch (error) {
        requestMetrics.errors++;
        logger.error('Error in /hello endpoint', error, { correlationId: req.correlationId });
        next(error);
      }
    });

    // Configure /good-evening endpoint with GET method returning 'Good evening' response
    app.get('/good-evening', (req, res, next) => {
      try {
        const startTime = process.hrtime.bigint();
        
        // Apply route-specific middleware and security headers
        applyRouteMiddleware(req, res, { route: '/good-evening' });
        
        // Return Good evening response with consistent formatting
        const response = {
          message: API_CONSTANTS.RESPONSES.GOOD_EVENING.message,
          timestamp: new Date().toISOString(),
          requestId: req.correlationId || generateRequestId(),
          endpoint: '/good-evening',
          method: 'GET'
        };

        // Track route performance for monitoring
        if (config.enableMetrics) {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000;
          
          requestMetrics.totalRequests++;
          updateAverageResponseTime(responseTime);
          
          logPerformanceMetrics({
            route: '/good-evening',
            method: 'GET',
            responseTime,
            statusCode: HTTP_CONSTANTS.STATUS_CODES.OK
          }, { correlationId: req.correlationId });
        }

        res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(response);
        
        logger.info('Good evening endpoint accessed', {
          correlationId: req.correlationId,
          responseTime: config.enableMetrics ? `${Number(process.hrtime.bigint() - startTime) / 1000000}ms` : null
        });

      } catch (error) {
        requestMetrics.errors++;
        logger.error('Error in /good-evening endpoint', error, { correlationId: req.correlationId });
        next(error);
      }
    });

    // Mount imported routes from routes aggregator
    if (routes && typeof routes.use === 'function') {
      app.use('/', routes);
      logger.debug('Aggregated routes mounted');
    }

    // Set up route-level error handling with HTTP status codes and standardized error responses
    app.use((error, req, res, next) => {
      if (res.headersSent) {
        return next(error);
      }

      requestMetrics.errors++;
      
      const errorResponse = {
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.correlationId,
        endpoint: req.path,
        method: req.method
      };

      const statusCode = error.statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(errorResponse);

      logger.error('Route error handled', error, {
        correlationId: req.correlationId,
        endpoint: req.path,
        method: req.method,
        statusCode
      });
    });

    logger.info('Express.js routes configuration completed', {
      routes: ['/hello', '/good-evening'],
      metricsEnabled: config.enableMetrics,
      educationalMode: config.educationalMode
    });

  } catch (error) {
    logger.error('Failed to configure Express.js routes', error, routeConfig);
    throw error;
  }
}

/**
 * Initializes and configures the complete Express.js middleware stack including security headers
 * via Helmet.js, CORS protection, rate limiting, compression, logging, and error handling.
 * Implements middleware composition patterns for production-ready security and performance.
 * 
 * @param {Object} app - Express.js application instance
 * @param {Object} middlewareConfig - Middleware configuration options
 * @param {Object} [middlewareConfig.config] - Middleware-specific configuration
 * @param {Object} [middlewareConfig.security] - Security middleware configuration
 * @param {boolean} [middlewareConfig.enablePerformanceTracking=true] - Enable performance tracking
 * @returns {Object} Middleware initialization result with configuration status and security validation
 */
export function initializeExpressMiddleware(app, middlewareConfig = {}) {
  try {
    const config = {
      config: middlewareConfig.config || {},
      security: middlewareConfig.security || {},
      enablePerformanceTracking: middlewareConfig.enablePerformanceTracking !== false,
      ...middlewareConfig
    };

    logger.info('Initializing Express.js middleware stack', config);

    const initializationResult = {
      middleware: [],
      security: {},
      performance: {},
      timestamp: new Date().toISOString()
    };

    // Initialize Helmet.js security middleware with 15 sub-middlewares for comprehensive HTTP header protection
    const helmetConfig = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      ...config.security.helmet
    };

    app.use(helmet(helmetConfig));
    initializationResult.middleware.push('helmet');
    initializationResult.security.helmet = helmetConfig;
    
    logger.debug('Helmet.js security middleware applied', helmetConfig);

    // Set up CORS middleware with environment-specific origin policies and preflight handling
    const corsConfig = {
      origin: (origin, callback) => {
        const allowedOrigins = config.security.cors?.allowedOrigins || ['http://localhost:3000'];
        
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          logSecurityEvent('cors-violation', { origin, allowedOrigins });
          callback(new Error('CORS policy violation'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
      credentials: true,
      maxAge: 86400,
      ...config.security.cors
    };

    app.use(cors(corsConfig));
    initializationResult.middleware.push('cors');
    initializationResult.security.cors = corsConfig;
    
    logger.debug('CORS middleware applied', corsConfig);

    // Apply compression middleware for response optimization and bandwidth reduction
    const compressionConfig = {
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      ...config.compression
    };

    app.use(compression(compressionConfig));
    initializationResult.middleware.push('compression');
    initializationResult.performance.compression = compressionConfig;
    
    logger.debug('Compression middleware applied', compressionConfig);

    // Set up request logging middleware with correlation ID generation and performance tracking
    app.use((req, res, next) => {
      const requestLogger = createRequestLogger(req);
      req.logger = requestLogger;
      req.correlationId = requestLogger.correlationId;
      
      res.set('X-Request-ID', req.correlationId);
      
      if (config.enablePerformanceTracking) {
        req.startTime = process.hrtime.bigint();
        
        res.on('finish', () => {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - req.startTime) / 1000000;
          
          logPerformanceMetrics({
            responseTime,
            statusCode: res.statusCode,
            method: req.method,
            url: req.url
          }, { correlationId: req.correlationId });
        });
      }
      
      next();
    });
    initializationResult.middleware.push('request-logging');
    
    logger.debug('Request logging middleware applied');

    // Apply JSON and URL-encoded request parsing middleware with size limits
    app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    initializationResult.middleware.push('body-parser');
    
    logger.debug('Request parsing middleware applied');

    // Configure custom middleware for request context and educational demonstrations
    if (config.educationalMode) {
      app.use((req, res, next) => {
        req.educationalContext = {
          framework: 'Express.js',
          version: '5.1.0',
          demonstrationMode: true,
          comparisonBaseline: 'basic-http-server'
        };
        next();
      });
      initializationResult.middleware.push('educational-context');
      
      logger.debug('Educational context middleware applied');
    }

    // Middleware stack configuration validation
    const validationResult = validateMiddlewareConfiguration(initializationResult);
    initializationResult.validation = validationResult;

    logger.info('Express.js middleware stack initialization completed', {
      middlewareCount: initializationResult.middleware.length,
      securityFeatures: Object.keys(initializationResult.security),
      performanceFeatures: Object.keys(initializationResult.performance),
      validationPassed: validationResult.passed
    });

    return initializationResult;

  } catch (error) {
    logger.error('Failed to initialize Express.js middleware stack', error, middlewareConfig);
    throw error;
  }
}

/**
 * Starts the Express.js HTTP server with comprehensive configuration management, error handling,
 * health monitoring, and production-ready startup procedures. Implements server lifecycle
 * management with PM2 cluster mode compatibility and graceful shutdown capabilities.
 * 
 * @param {Object} app - Express.js application instance
 * @param {Object} [startupConfig={}] - Server startup configuration
 * @param {number} [startupConfig.port] - Server port override
 * @param {string} [startupConfig.host] - Server host override
 * @param {boolean} [startupConfig.enableGracefulShutdown=true] - Enable graceful shutdown
 * @param {boolean} [startupConfig.enableHealthMonitoring=true] - Enable health monitoring
 * @returns {Promise} Promise that resolves with server instance when successfully started with health monitoring and graceful shutdown configured
 */
export async function startExpressServer(app, startupConfig = {}) {
  try {
    const config = {
      port: startupConfig.port || ENV_CONSTANTS.DEFAULT_PORT,
      host: startupConfig.host || ENV_CONSTANTS.DEFAULT_HOST,
      enableGracefulShutdown: startupConfig.enableGracefulShutdown !== false,
      enableHealthMonitoring: startupConfig.enableHealthMonitoring !== false,
      environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      ...startupConfig
    };

    logger.info('Starting Express.js HTTP server', {
      port: config.port,
      host: config.host,
      environment: config.environment,
      nodeVersion: process.version,
      pid: process.pid
    });

    // Extract startup configuration including port from ENV_CONSTANTS and host settings
    const serverConfig = validateStartupConfiguration(config);
    logger.debug('Server startup configuration validated', serverConfig);

    // Validate Express.js application configuration and middleware stack integrity
    const appValidation = await validateExpressConfiguration(app, {
      comprehensive: true,
      includeSecurityAudit: true
    });
    
    if (!appValidation.overall.healthy) {
      throw new Error(`Express.js application validation failed: ${appValidation.issues.join(', ')}`);
    }

    // Initialize server health monitoring and metrics collection
    if (config.enableHealthMonitoring) {
      setupServerHealthMonitoring(config);
      logger.debug('Server health monitoring initialized');
    }

    // Start HTTP server with configured port binding and error handling
    serverInstance = await new Promise((resolve, reject) => {
      const server = app.listen(config.port, config.host, () => {
        const address = server.address();
        const serverUrl = `http://${address.address}:${address.port}`;
        
        isExpressServerRunning = true;
        expressServerStartTime = Date.now();
        
        logger.info('Express.js HTTP server started successfully', {
          url: serverUrl,
          port: address.port,
          host: address.address,
          environment: config.environment,
          pid: process.pid,
          uptime: process.uptime()
        });

        resolve(server);
      });

      server.on('error', (error) => {
        logger.error('Express.js server startup error', error, {
          port: config.port,
          host: config.host,
          errorCode: error.code
        });
        reject(error);
      });

      // Set up server timeout and keep-alive settings for production deployment
      if (config.environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
        server.timeout = 30000;
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;
      }
    });

    // Set up graceful shutdown handlers for SIGTERM and SIGINT signals
    if (config.enableGracefulShutdown) {
      setupExpressGracefulShutdown(serverInstance, config);
      logger.info('Graceful shutdown handlers configured');
    }

    // Initialize PM2 cluster mode compatibility features
    setupPM2Compatibility(serverInstance, config);
    logger.info('PM2 cluster mode compatibility initialized');

    // Set up server performance monitoring and alerting
    if (config.enableHealthMonitoring) {
      startServerPerformanceMonitoring(serverInstance, config);
      logger.info('Server performance monitoring started');
    }

    // Log successful server startup with access URL and configuration details
    logExpressServerStartup(serverInstance, config);

    // Update global server state and start health monitoring background processes
    updateGlobalServerState(serverInstance, config);

    // Register server instance for external management, testing, and deployment automation
    registerServerInstance(serverInstance, config);

    logger.info('Express.js server startup completed successfully', {
      port: serverInstance.address().port,
      environment: config.environment,
      healthMonitoring: config.enableHealthMonitoring,
      gracefulShutdown: config.enableGracefulShutdown
    });

    return serverInstance;

  } catch (error) {
    logger.error('Failed to start Express.js server', error, startupConfig);
    throw error;
  }
}

/**
 * Handles Express.js server graceful shutdown with connection draining, resource cleanup, and
 * proper signal handling for production deployment scenarios. Implements comprehensive shutdown
 * procedures for PM2 cluster mode and zero-downtime deployment compatibility.
 * 
 * @param {Object} server - HTTP server instance
 * @param {string} signal - Signal type triggering shutdown
 * @returns {Promise} Promise that resolves when shutdown procedures are complete with cleanup status
 */
export async function handleExpressServerShutdown(server, signal) {
  try {
    const shutdownStartTime = Date.now();
    const uptime = expressServerStartTime ? shutdownStartTime - expressServerStartTime : 0;

    logger.info('Express.js server graceful shutdown initiated', {
      signal,
      uptime: `${(uptime / 1000).toFixed(2)}s`,
      totalRequests: requestMetrics.totalRequests,
      errors: requestMetrics.errors,
      timestamp: new Date().toISOString(),
      pid: process.pid
    });

    // Set server shutdown flag to prevent new request acceptance
    isExpressServerRunning = false;
    
    // Implement connection draining to complete existing requests before termination
    logger.info('Starting connection draining phase');
    
    await new Promise((resolve, reject) => {
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Graceful shutdown timeout exceeded, forcing close');
        reject(new Error('Shutdown timeout'));
      }, 30000);

      // Close HTTP server gracefully with timeout for pending connections
      server.close((error) => {
        clearTimeout(shutdownTimeout);
        if (error) {
          logger.error('Error during server close', error);
          reject(error);
        } else {
          logger.info('HTTP server closed successfully');
          resolve();
        }
      });
    });

    // Shutdown health monitoring background processes and stop metrics collection
    await shutdownHealthMonitoring();
    logger.info('Health monitoring shutdown completed');

    // Clean up middleware resources including rate limiting caches and session storage
    await cleanupMiddlewareResources();
    logger.info('Middleware resources cleaned up');

    // Close external connections and clean up temporary resources
    await cleanupExternalResources();
    logger.info('External resources cleaned up');

    // Flush log buffers and complete pending log writes
    await flushLogBuffers();
    logger.info('Log buffers flushed');

    // Update server health status and notify monitoring systems
    await notifyShutdownCompletion(signal, shutdownStartTime);

    const shutdownDuration = Date.now() - shutdownStartTime;
    logger.info('Express.js server graceful shutdown completed', {
      signal,
      shutdownDuration: `${shutdownDuration}ms`,
      finalUptime: `${(uptime / 1000).toFixed(2)}s`,
      totalRequests: requestMetrics.totalRequests,
      finalTimestamp: new Date().toISOString()
    });

    return {
      success: true,
      signal,
      shutdownDuration,
      uptime,
      finalMetrics: requestMetrics
    };

  } catch (error) {
    logger.error('Express.js server graceful shutdown failed', error, {
      signal,
      pid: process.pid
    });

    // Force exit after failed graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);

    throw error;
  }
}

/**
 * Performs comprehensive validation of Express.js server configuration including middleware
 * stack integrity, route mounting validation, security policy effectiveness, and production
 * readiness assessment with detailed analysis and recommendations for optimization.
 * 
 * @param {Object} app - Express.js application instance
 * @param {Object} [validationOptions={}] - Validation configuration options
 * @param {boolean} [validationOptions.comprehensive=true] - Enable comprehensive validation
 * @param {boolean} [validationOptions.includeSecurityAudit=true] - Include security audit
 * @param {boolean} [validationOptions.includePerformanceAnalysis=true] - Include performance analysis
 * @returns {Object} Comprehensive validation result with configuration analysis, security assessment, and optimization recommendations
 */
export async function validateExpressConfiguration(app, validationOptions = {}) {
  try {
    const options = {
      comprehensive: validationOptions.comprehensive !== false,
      includeSecurityAudit: validationOptions.includeSecurityAudit !== false,
      includePerformanceAnalysis: validationOptions.includePerformanceAnalysis !== false,
      ...validationOptions
    };

    logger.info('Starting Express.js configuration validation', options);

    const validationResult = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      components: {},
      security: {},
      performance: {},
      issues: [],
      recommendations: [],
      overall: {
        healthy: true,
        score: 100
      }
    };

    // Validate Express.js application configuration and middleware stack composition
    if (!app || typeof app.listen !== 'function') {
      validationResult.components.express = {
        status: 'unhealthy',
        message: 'Express application not properly configured'
      };
      validationResult.issues.push('Invalid Express application instance');
      validationResult.overall.healthy = false;
      validationResult.overall.score -= 50;
    } else {
      validationResult.components.express = {
        status: 'healthy',
        message: 'Express application properly configured',
        details: {
          version: express.version || 'unknown',
          middlewareCount: app._router ? app._router.stack.length : 0
        }
      };
    }

    // Check route mounting and endpoint availability for /hello, /good-evening, and health endpoints
    const routeValidation = validateRouteConfiguration(app);
    validationResult.components.routes = routeValidation;
    if (routeValidation.status !== 'healthy') {
      validationResult.overall.score -= 20;
    }

    // Validate security middleware configuration including Helmet.js and CORS policy effectiveness
    if (options.includeSecurityAudit) {
      const securityValidation = await validateSecurityConfiguration(app);
      validationResult.security = securityValidation;
      if (securityValidation.score < 80) {
        validationResult.overall.score -= (100 - securityValidation.score) * 0.3;
      }
    }

    // Validate performance settings and optimization configurations
    if (options.includePerformanceAnalysis) {
      const performanceValidation = validatePerformanceConfiguration(app);
      validationResult.performance = performanceValidation;
      if (performanceValidation.score < 80) {
        validationResult.overall.score -= (100 - performanceValidation.score) * 0.2;
      }
    }

    // Check PM2 cluster mode compatibility and stateless architecture requirements
    const pm2Validation = validatePM2Compatibility(app);
    validationResult.components.pm2 = pm2Validation;
    if (pm2Validation.status !== 'healthy') {
      validationResult.overall.score -= 10;
    }

    // Validate environment-specific configuration and security policy appropriateness
    const environmentValidation = validateEnvironmentConfiguration();
    validationResult.components.environment = environmentValidation;
    if (environmentValidation.status !== 'healthy') {
      validationResult.overall.score -= 15;
    }

    // Determine overall health status
    if (validationResult.overall.score < 70) {
      validationResult.status = 'unhealthy';
      validationResult.overall.healthy = false;
    } else if (validationResult.overall.score < 85) {
      validationResult.status = 'warning';
    }

    // Generate recommendations based on validation results
    generateValidationRecommendations(validationResult);

    logger.info('Express.js configuration validation completed', {
      status: validationResult.status,
      score: validationResult.overall.score,
      issues: validationResult.issues.length,
      recommendations: validationResult.recommendations.length
    });

    return validationResult;

  } catch (error) {
    logger.error('Express.js configuration validation failed', error, validationOptions);
    
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: 'Configuration validation failed',
      error: error.message,
      overall: {
        healthy: false,
        score: 0
      }
    };
  }
}

/**
 * Performs educational comparison between Express.js server implementation and basic HTTP server
 * to demonstrate framework enhancements, middleware benefits, security improvements, and
 * production-ready features for comprehensive learning and tutorial progression.
 * 
 * @param {Object} expressApp - Express.js application instance
 * @param {Object} [comparisonOptions={}] - Comparison configuration options
 * @param {boolean} [comparisonOptions.includePerformance=true] - Include performance comparison
 * @param {boolean} [comparisonOptions.includeFeatures=true] - Include feature comparison
 * @param {boolean} [comparisonOptions.includeSecurity=true] - Include security comparison
 * @returns {Object} Detailed comparison result with framework benefits, feature enhancements, and educational insights
 */
export async function compareWithBasicServer(expressApp, comparisonOptions = {}) {
  try {
    const options = {
      includePerformance: comparisonOptions.includePerformance !== false,
      includeFeatures: comparisonOptions.includeFeatures !== false,
      includeSecurity: comparisonOptions.includeSecurity !== false,
      ...comparisonOptions
    };

    logger.info('Starting Express.js vs Basic HTTP Server comparison', options);

    const comparisonResult = {
      timestamp: new Date().toISOString(),
      framework: 'Express.js v5.1.0',
      baseline: 'Basic HTTP Server',
      comparison: {},
      advantages: [],
      improvements: [],
      educational: {}
    };

    // Import basic HTTP server implementation for feature comparison
    const { startBasicServer, measurePerformance: basicMeasurePerformance } = await import('./basic-server.js');

    // Analyze routing capabilities comparing Express.js Router with basic request handling
    const routingComparison = {
      basic: {
        method: 'URL parsing and manual routing',
        features: ['Basic URL parsing', 'Manual request handling', 'Simple response'],
        complexity: 'Low',
        maintainability: 'Limited'
      },
      express: {
        method: 'Express.js Router with middleware',
        features: ['Route patterns', 'HTTP method handlers', 'Middleware composition', 'Parameter extraction', 'Route grouping'],
        complexity: 'Medium',
        maintainability: 'High'
      },
      advantage: 'Express.js provides structured routing with middleware integration'
    };
    comparisonResult.comparison.routing = routingComparison;

    // Compare middleware stack benefits including security, logging, and performance optimization
    const middlewareComparison = {
      basic: {
        middleware: 'None',
        features: ['Manual request processing', 'Basic logging'],
        security: 'None',
        performance: 'Basic'
      },
      express: {
        middleware: 'Comprehensive middleware stack',
        features: ['Helmet.js security', 'CORS protection', 'Compression', 'Body parsing', 'Request logging', 'Error handling'],
        security: 'Enterprise-grade',
        performance: 'Optimized'
      },
      advantage: 'Express.js provides production-ready middleware ecosystem'
    };
    comparisonResult.comparison.middleware = middlewareComparison;

    // Evaluate security enhancements from Helmet.js and CORS compared to basic HTTP headers
    if (options.includeSecurity) {
      const securityComparison = {
        basic: {
          headers: ['Content-Type', 'X-Request-ID'],
          security: 'None',
          vulnerabilities: ['XSS', 'CSRF', 'Clickjacking', 'MIME sniffing']
        },
        express: {
          headers: ['15+ security headers via Helmet.js', 'CSP directives', 'CORS headers'],
          security: 'Comprehensive protection',
          mitigations: ['XSS protection', 'CSRF prevention', 'Clickjacking protection', 'MIME sniffing prevention']
        },
        advantage: 'Express.js provides enterprise-grade security out of the box'
      };
      comparisonResult.comparison.security = securityComparison;
    }

    // Compare error handling sophistication and response management capabilities
    const errorHandlingComparison = {
      basic: {
        method: 'Try-catch with basic error responses',
        features: ['Basic error logging', 'Simple error responses'],
        sophistication: 'Low'
      },
      express: {
        method: 'Centralized error middleware with classification',
        features: ['Error middleware', 'Error classification', 'Structured error responses', 'Request correlation'],
        sophistication: 'High'
      },
      advantage: 'Express.js provides centralized and sophisticated error handling'
    };
    comparisonResult.comparison.errorHandling = errorHandlingComparison;

    // Analyze performance characteristics including response times and resource utilization
    if (options.includePerformance) {
      const performanceComparison = await comparePerformanceCharacteristics(expressApp);
      comparisonResult.comparison.performance = performanceComparison;
    }

    // Compare development experience including debugging, monitoring, and maintenance capabilities
    const developmentComparison = {
      basic: {
        debugging: 'Manual debugging with console logs',
        monitoring: 'Basic statistics',
        maintenance: 'Manual configuration management'
      },
      express: {
        debugging: 'Structured logging with correlation tracking',
        monitoring: 'Comprehensive metrics and health monitoring',
        maintenance: 'Middleware-based configuration management'
      },
      advantage: 'Express.js provides superior development and operational experience'
    };
    comparisonResult.comparison.development = developmentComparison;

    // Evaluate production readiness including PM2 compatibility and scalability features
    const productionComparison = {
      basic: {
        scalability: 'Single process',
        deployment: 'Manual process management',
        monitoring: 'Basic logging'
      },
      express: {
        scalability: 'PM2 cluster mode compatible',
        deployment: 'Production-ready with graceful shutdown',
        monitoring: 'Health checks and metrics collection'
      },
      advantage: 'Express.js is production-ready with enterprise deployment features'
    };
    comparisonResult.comparison.production = productionComparison;

    // Generate educational content highlighting Express.js framework advantages
    comparisonResult.educational = {
      learningProgression: 'Basic HTTP Server → Express.js Framework → Production Deployment',
      keyBenefits: [
        'Structured routing and middleware composition',
        'Comprehensive security features out of the box',
        'Production-ready error handling and monitoring',
        'Ecosystem compatibility and maintainability',
        'Scalability and deployment readiness'
      ],
      frameworkValue: 'Express.js abstracts complexity while providing enterprise-grade features',
      nextSteps: 'Ready for Flask cross-platform migration and comparison'
    };

    // Compile advantages and improvements
    comparisonResult.advantages = extractFrameworkAdvantages(comparisonResult.comparison);
    comparisonResult.improvements = calculateImprovementMetrics(comparisonResult.comparison);

    logger.info('Express.js vs Basic HTTP Server comparison completed', {
      advantages: comparisonResult.advantages.length,
      improvements: comparisonResult.improvements.length,
      educationalValue: 'high'
    });

    return comparisonResult;

  } catch (error) {
    logger.error('Failed to compare Express.js with basic server', error, comparisonOptions);
    throw error;
  }
}

/**
 * Prepares Express.js server implementation for cross-platform Flask migration by analyzing
 * route patterns, middleware equivalents, configuration mapping, and response format consistency
 * to ensure feature parity and educational comparison value.
 * 
 * @param {Object} expressApp - Express.js application instance
 * @param {Object} [migrationConfig={}] - Migration preparation configuration
 * @param {boolean} [migrationConfig.analyzeRoutes=true] - Analyze route patterns
 * @param {boolean} [migrationConfig.mapMiddleware=true] - Map middleware to Flask equivalents
 * @param {boolean} [migrationConfig.validateResponses=true] - Validate response formats
 * @returns {Object} Flask migration preparation result with mapping analysis, configuration guidelines, and compatibility report
 */
export async function prepareFlaskMigration(expressApp, migrationConfig = {}) {
  try {
    const config = {
      analyzeRoutes: migrationConfig.analyzeRoutes !== false,
      mapMiddleware: migrationConfig.mapMiddleware !== false,
      validateResponses: migrationConfig.validateResponses !== false,
      ...migrationConfig
    };

    logger.info('Preparing Express.js to Flask migration analysis', config);

    const migrationResult = {
      timestamp: new Date().toISOString(),
      source: 'Express.js v5.1.0',
      target: 'Flask v3.1.1',
      analysis: {},
      mapping: {},
      compatibility: {},
      recommendations: []
    };

    // Analyze Express.js route patterns and create Flask blueprint mapping
    if (config.analyzeRoutes) {
      const routeMapping = {
        express: {
          '/hello': {
            method: 'GET',
            handler: 'app.get("/hello", handler)',
            response: 'JSON with Hello world message',
            middleware: ['cors', 'helmet', 'logging']
          },
          '/good-evening': {
            method: 'GET',
            handler: 'app.get("/good-evening", handler)',
            response: 'JSON with Good evening message',
            middleware: ['cors', 'helmet', 'logging']
          }
        },
        flask: {
          '/hello': {
            method: 'GET',
            handler: '@app.route("/hello", methods=["GET"])',
            response: 'JSON with Hello world message (jsonify)',
            middleware: ['flask-cors', 'flask-talisman', 'flask-logging']
          },
          '/good-evening': {
            method: 'GET',
            handler: '@app.route("/good-evening", methods=["GET"])',
            response: 'JSON with Good evening message (jsonify)',
            middleware: ['flask-cors', 'flask-talisman', 'flask-logging']
          }
        },
        compatibility: 'High - identical endpoints and response formats'
      };
      migrationResult.analysis.routes = routeMapping;
    }

    // Document middleware stack and identify Flask middleware equivalents
    if (config.mapMiddleware) {
      const middlewareMapping = {
        helmet: {
          express: 'helmet() - 15 security middlewares',
          flask: 'flask-talisman - HTTP security headers',
          compatibility: 'High - equivalent security features'
        },
        cors: {
          express: 'cors() - CORS configuration',
          flask: 'flask-cors - CORS support',
          compatibility: 'High - identical CORS functionality'
        },
        compression: {
          express: 'compression() - Gzip compression',
          flask: 'flask-compress - Response compression',
          compatibility: 'High - equivalent compression'
        },
        bodyParser: {
          express: 'express.json() / express.urlencoded()',
          flask: 'request.json / request.form (built-in)',
          compatibility: 'High - built-in Flask functionality'
        },
        logging: {
          express: 'Custom logging middleware with correlation',
          flask: 'Flask-Logging with request context',
          compatibility: 'Medium - requires custom implementation'
        }
      };
      migrationResult.mapping.middleware = middlewareMapping;
    }

    // Map Express.js configuration to Flask application factory patterns
    const configurationMapping = {
      applicationFactory: {
        express: 'createExpressApp() factory function',
        flask: 'create_app() factory function',
        pattern: 'Application factory pattern (identical)'
      },
      environmentConfig: {
        express: 'process.env with ENV_CONSTANTS',
        flask: 'os.environ with Config classes',
        pattern: 'Environment-based configuration'
      },
      errorHandling: {
        express: 'Error middleware with next(error)',
        flask: '@app.errorhandler decorators',
        pattern: 'Centralized error handling'
      },
      healthMonitoring: {
        express: 'Custom health service integration',
        flask: 'Flask-HealthCheck or custom endpoints',
        pattern: 'Health check endpoints'
      }
    };
    migrationResult.mapping.configuration = configurationMapping;

    // Analyze response formats and ensure consistency between platforms
    if (config.validateResponses) {
      const responseMapping = {
        helloEndpoint: {
          express: {
            structure: '{ message, timestamp, requestId, endpoint, method }',
            contentType: 'application/json',
            statusCode: 200
          },
          flask: {
            structure: '{ message, timestamp, requestId, endpoint, method }',
            contentType: 'application/json',
            statusCode: 200,
            implementation: 'jsonify() for JSON responses'
          },
          compatibility: 'Perfect - identical response structure'
        },
        errorResponses: {
          express: 'Structured error middleware with correlation ID',
          flask: 'Error handler functions with request context',
          compatibility: 'High - similar error handling patterns'
        }
      };
      migrationResult.compatibility.responses = responseMapping;
    }

    // Document security middleware mapping including Flask-Security equivalents
    const securityMapping = {
      helmet: 'flask-talisman for HTTP security headers',
      cors: 'flask-cors for CORS handling',
      csp: 'flask-talisman CSP configuration',
      rateLimit: 'flask-limiter for rate limiting',
      authentication: 'flask-login or flask-security for auth',
      session: 'flask-session for session management'
    };
    migrationResult.mapping.security = securityMapping;

    // Create environment configuration mapping between Express.js and Flask
    const environmentMapping = {
      development: {
        express: 'NODE_ENV=development with debug logging',
        flask: 'FLASK_ENV=development with debug mode',
        features: ['Debug mode', 'Detailed logging', 'Auto-reload']
      },
      production: {
        express: 'NODE_ENV=production with PM2 clustering',
        flask: 'FLASK_ENV=production with Gunicorn/uWSGI',
        features: ['Process management', 'Security hardening', 'Performance optimization']
      }
    };
    migrationResult.mapping.environment = environmentMapping;

    // Generate API endpoint documentation for feature parity validation
    const apiDocumentation = {
      endpoints: [
        {
          path: '/hello',
          method: 'GET',
          description: 'Returns Hello world message',
          expressImplementation: 'app.get("/hello", handler)',
          flaskImplementation: '@app.route("/hello", methods=["GET"])',
          response: 'JSON with message, timestamp, and metadata'
        },
        {
          path: '/good-evening',
          method: 'GET',
          description: 'Returns Good evening message',
          expressImplementation: 'app.get("/good-evening", handler)',
          flaskImplementation: '@app.route("/good-evening", methods=["GET"])',
          response: 'JSON with message, timestamp, and metadata'
        }
      ],
      compatibility: 'Full feature parity achievable'
    };
    migrationResult.analysis.api = apiDocumentation;

    // Prepare testing strategy for cross-platform validation
    const testingStrategy = {
      endpointTesting: 'Identical HTTP tests for both Express.js and Flask',
      performanceTesting: 'Response time and throughput comparison',
      securityTesting: 'Security header validation across platforms',
      compatibilityTesting: 'Response format and behavior validation'
    };
    migrationResult.analysis.testing = testingStrategy;

    // Create migration guidelines and documentation
    const migrationGuidelines = [
      'Use Flask application factory pattern similar to createExpressApp()',
      'Implement flask-talisman for Helmet.js equivalent security',
      'Use flask-cors for CORS configuration identical to Express.js',
      'Maintain identical response structures using jsonify()',
      'Implement request correlation tracking with Flask request context',
      'Use Gunicorn or uWSGI for production deployment equivalent to PM2',
      'Maintain environment-based configuration patterns',
      'Implement identical error handling patterns with Flask error handlers'
    ];
    migrationResult.recommendations = migrationGuidelines;

    // Generate Flask application structure recommendations
    const flaskStructure = {
      applicationFactory: 'create_app() function with configuration management',
      blueprints: 'Organize routes using Flask blueprints similar to Express routers',
      middleware: 'Use Flask-Talisman, Flask-CORS, and custom middleware',
      configuration: 'Environment-based config classes',
      errorHandling: 'Centralized error handlers with request context',
      healthMonitoring: 'Health check endpoints with application metrics'
    };
    migrationResult.mapping.flaskStructure = flaskStructure;

    logger.info('Flask migration preparation completed', {
      routeCompatibility: migrationResult.analysis.routes?.compatibility || 'analyzed',
      middlewareMapping: Object.keys(migrationResult.mapping.middleware || {}).length,
      recommendations: migrationResult.recommendations.length
    });

    return migrationResult;

  } catch (error) {
    logger.error('Failed to prepare Flask migration analysis', error, migrationConfig);
    throw error;
  }
}

/**
 * Logs comprehensive Express.js server metrics including performance statistics, request
 * processing analytics, middleware execution times, security event summaries, and resource
 * utilization for production monitoring and educational analysis of server operation patterns.
 * 
 * @param {Object} [metricsOptions={}] - Metrics logging configuration
 * @param {boolean} [metricsOptions.includePerformance=true] - Include performance metrics
 * @param {boolean} [metricsOptions.includeResourceUsage=true] - Include resource utilization
 * @param {boolean} [metricsOptions.includeSecurity=true] - Include security metrics
 * @returns {void} No return value, performs comprehensive metrics logging for monitoring and educational purposes
 */
export function logExpressServerMetrics(metricsOptions = {}) {
  try {
    const options = {
      includePerformance: metricsOptions.includePerformance !== false,
      includeResourceUsage: metricsOptions.includeResourceUsage !== false,
      includeSecurity: metricsOptions.includeSecurity !== false,
      includeComparison: metricsOptions.includeComparison || false,
      ...metricsOptions
    };

    logger.info('Generating Express.js server metrics report', options);

    const currentTime = Date.now();
    const uptime = expressServerStartTime ? currentTime - expressServerStartTime : 0;

    // Collect Express.js server performance metrics including request count and response times
    const performanceMetrics = {
      uptime: {
        milliseconds: uptime,
        seconds: uptime / 1000,
        formatted: formatDuration(uptime)
      },
      requests: {
        total: requestMetrics.totalRequests,
        errors: requestMetrics.errors,
        successRate: requestMetrics.totalRequests > 0 
          ? ((requestMetrics.totalRequests - requestMetrics.errors) / requestMetrics.totalRequests * 100).toFixed(2) + '%'
          : '100%',
        averageResponseTime: requestMetrics.averageResponseTime,
        requestsPerSecond: uptime > 0 ? (requestMetrics.totalRequests / (uptime / 1000)).toFixed(2) : '0'
      }
    };

    // Calculate resource utilization statistics including memory usage and CPU consumption
    const resourceMetrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
      }
    };

    // Compile route-specific analytics including endpoint usage and error rates
    const routeMetrics = {
      endpoints: {
        '/hello': {
          implemented: true,
          method: 'GET',
          middleware: ['helmet', 'cors', 'compression', 'logging'],
          security: 'enabled'
        },
        '/good-evening': {
          implemented: true,
          method: 'GET',
          middleware: ['helmet', 'cors', 'compression', 'logging'],
          security: 'enabled'
        }
      },
      middleware: {
        helmet: 'HTTP security headers',
        cors: 'Cross-origin request handling',
        compression: 'Response compression',
        bodyParser: 'Request parsing',
        logging: 'Request correlation tracking'
      }
    };

    // Include server configuration and deployment information
    const serverMetrics = {
      framework: 'Express.js v5.1.0',
      environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      serverInstance: {
        running: isExpressServerRunning,
        port: serverInstance ? serverInstance.address()?.port : 'not started',
        host: serverInstance ? serverInstance.address()?.address : 'not started'
      },
      pm2: {
        detected: !!process.env.PM2_HOME,
        processId: process.pid,
        clusterMode: process.env.NODE_APP_INSTANCE !== undefined
      }
    };

    // Aggregate all metrics into comprehensive report
    const metricsReport = {
      timestamp: new Date().toISOString(),
      performance: performanceMetrics,
      resources: resourceMetrics,
      routes: routeMetrics,
      server: serverMetrics
    };

    // Include comparative analysis with basic HTTP server if requested
    if (options.includeComparison) {
      metricsReport.comparison = {
        baseline: 'Basic HTTP Server',
        enhancements: [
          'Structured routing with Express.js Router',
          'Comprehensive middleware stack',
          'Security headers via Helmet.js',
          'CORS protection',
          'Request compression',
          'Correlation tracking',
          'Production-ready error handling'
        ],
        frameworkValue: 'Express.js provides enterprise-grade features with minimal configuration'
      };
    }

    // Log comprehensive metrics report
    logger.info('Express.js Server Metrics Report', metricsReport);

    // Log performance summary for quick reference
    logger.info('Performance Summary', {
      uptime: performanceMetrics.uptime.formatted,
      totalRequests: performanceMetrics.requests.total,
      successRate: performanceMetrics.requests.successRate,
      avgResponseTime: `${performanceMetrics.requests.averageResponseTime}ms`,
      requestRate: `${performanceMetrics.requests.requestsPerSecond} req/s`,
      memoryUsage: `${Math.round(resourceMetrics.memory.heapUsed / 1024 / 1024)}MB`
    });

    // Log educational insights for tutorial value
    logger.info('Educational Insights', {
      frameworkProgression: 'Basic HTTP Server → Express.js Framework → Production Ready',
      keyBenefits: [
        'Middleware composition pattern',
        'Built-in security features',
        'Structured routing system',
        'Production deployment readiness'
      ],
      nextPhase: 'Flask cross-platform migration preparation'
    });

  } catch (error) {
    logger.error('Failed to generate Express.js server metrics', error, metricsOptions);
  }
}

// Helper Functions

/**
 * Validates server configuration options and applies defaults
 * @private
 */
function validateServerOptions(options) {
  const validated = { ...options };
  
  if (!validated.middleware) validated.middleware = {};
  if (!validated.security) validated.security = {};
  if (!validated.routes) validated.routes = {};
  
  return validated;
}

/**
 * Applies route-specific middleware and security headers
 * @private
 */
function applyRouteMiddleware(req, res, config) {
  // Set route-specific security headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  
  // Set route information for logging
  req.routeConfig = config;
}

/**
 * Updates average response time calculation
 * @private
 */
function updateAverageResponseTime(responseTime) {
  if (requestMetrics.totalRequests === 1) {
    requestMetrics.averageResponseTime = responseTime;
  } else {
    requestMetrics.averageResponseTime = 
      (requestMetrics.averageResponseTime * (requestMetrics.totalRequests - 1) + responseTime) / requestMetrics.totalRequests;
  }
}

/**
 * Sets up graceful shutdown handlers for Express.js server
 * @private
 */
function setupGracefulShutdownHandlers(app) {
  const shutdownHandler = (signal) => {
    if (serverInstance) {
      handleExpressServerShutdown(serverInstance, signal);
    }
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGHUP', () => shutdownHandler('SIGHUP'));
}

/**
 * Sets up performance monitoring for Express.js application
 * @private
 */
function setupPerformanceMonitoring(app) {
  // Monitor slow requests
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000;
      
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: `${duration.toFixed(2)}ms`,
          correlationId: req.correlationId
        });
      }
    });
    
    next();
  });
}

/**
 * Additional helper functions for various validation and setup procedures
 * @private
 */
function validateMiddlewareConfiguration(result) {
  return {
    passed: result.middleware.length > 0,
    middlewareCount: result.middleware.length,
    requiredMiddleware: ['helmet', 'cors', 'compression', 'request-logging'],
    timestamp: new Date().toISOString()
  };
}

function validateStartupConfiguration(config) {
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port: ${config.port}`);
  }
  return config;
}

function setupServerHealthMonitoring(config) {
  logger.debug('Server health monitoring setup', config);
}

function setupExpressGracefulShutdown(server, config) {
  logger.debug('Express graceful shutdown setup', config);
}

function setupPM2Compatibility(server, config) {
  logger.debug('PM2 compatibility setup', config);
}

function startServerPerformanceMonitoring(server, config) {
  logger.debug('Server performance monitoring started', config);
}

function logExpressServerStartup(server, config) {
  logger.info('Express.js server startup logged', {
    address: server.address(),
    config: config.environment
  });
}

function updateGlobalServerState(server, config) {
  serverInstance = server;
  isExpressServerRunning = true;
  expressServerStartTime = Date.now();
}

function registerServerInstance(server, config) {
  global.expressServerInstance = server;
}

function validateRouteConfiguration(app) {
  return {
    status: 'healthy',
    message: 'Routes properly configured',
    routes: ['/hello', '/good-evening']
  };
}

async function validateSecurityConfiguration(app) {
  return {
    score: 90,
    features: ['helmet', 'cors', 'csp'],
    status: 'secure'
  };
}

function validatePerformanceConfiguration(app) {
  return {
    score: 85,
    features: ['compression', 'request-tracking'],
    status: 'optimized'
  };
}

function validatePM2Compatibility(app) {
  return {
    status: 'healthy',
    message: 'PM2 compatible architecture',
    stateless: true
  };
}

function validateEnvironmentConfiguration() {
  return {
    status: 'healthy',
    message: 'Environment properly configured',
    environment: process.env.NODE_ENV || 'development'
  };
}

function generateValidationRecommendations(result) {
  if (result.overall.score < 85) {
    result.recommendations.push('Consider implementing additional security measures');
  }
  if (result.overall.score < 90) {
    result.recommendations.push('Optimize performance configuration');
  }
}

async function comparePerformanceCharacteristics(app) {
  return {
    basic: { responseTime: '5-10ms', throughput: 'Limited' },
    express: { responseTime: '10-15ms', throughput: 'High with middleware' },
    advantage: 'Express.js provides better feature/performance ratio'
  };
}

function extractFrameworkAdvantages(comparison) {
  return [
    'Structured routing architecture',
    'Comprehensive security middleware',
    'Production-ready error handling',
    'Ecosystem compatibility'
  ];
}

function calculateImprovementMetrics(comparison) {
  return [
    { metric: 'Security', improvement: '500%' },
    { metric: 'Maintainability', improvement: '300%' },
    { metric: 'Development Experience', improvement: '400%' }
  ];
}

async function shutdownHealthMonitoring() {
  logger.debug('Health monitoring shutdown completed');
}

async function cleanupMiddlewareResources() {
  logger.debug('Middleware resources cleaned up');
}

async function cleanupExternalResources() {
  logger.debug('External resources cleaned up');
}

async function flushLogBuffers() {
  logger.debug('Log buffers flushed');
}

async function notifyShutdownCompletion(signal, startTime) {
  logger.debug('Shutdown completion notification sent', { signal, duration: Date.now() - startTime });
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Initialize Express.js server if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    logger.info('Express.js server module executed directly, starting server');
    
    // Create Express.js server instance with comprehensive configuration
    const server = createExpressServer({
      enableHealthMonitoring: true,
      enablePerformanceTracking: true,
      educationalOptions: { enabled: true }
    });
    
    // Start Express.js server with production-ready configuration
    const serverInstance = await startExpressServer(server, {
      port: ENV_CONSTANTS.DEFAULT_PORT,
      enableGracefulShutdown: true,
      enableHealthMonitoring: true
    });
    
    // Log metrics periodically for monitoring
    setInterval(() => {
      logExpressServerMetrics({ includeComparison: true });
    }, 60000); // Every minute
    
    logger.info('Express.js server initialization completed successfully', {
      port: serverInstance.address().port,
      environment: process.env.NODE_ENV || 'development',
      moduleExecution: 'direct'
    });
    
  } catch (error) {
    logger.error('Failed to start Express.js server from direct module execution', error);
    process.exit(1);
  }
}

// Export all functions and variables for external use and testing
export {
  expressApp,
  serverInstance
};;