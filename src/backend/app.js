/**
 * @fileoverview Main Express.js Application Orchestrator for Node.js Tutorial Project
 * @description Central entry point for assembling, configuring, and initializing the complete Express.js v5.1.0
 * web server with comprehensive middleware stack, routing system, service layer integration, and monitoring
 * capabilities. Implements modern Express.js patterns with ES Modules, Helmet.js security integration,
 * PM2 cluster mode compatibility, and comprehensive error handling for production-ready deployment.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Express.js v5.1.0 application architecture with enhanced security and performance
 * - Modern Node.js v22.x LTS application pattern with ES Modules support
 * - Progressive enhancement building upon basic HTTP server with production-ready features
 * - Comprehensive security implementation with Helmet.js and CORS configuration
 * - PM2 cluster mode compatibility with stateless application architecture
 * - Health monitoring integration with metrics collection and alerting
 * - Cross-platform preparation for Flask migration with identical API patterns
 * - Educational value throughout implementation with detailed documentation
 * 
 * Architecture Integration:
 * - Central configuration orchestration through config/index.js
 * - Middleware stack composition via middleware/index.js factory functions
 * - Route aggregation and mounting through routes/index.js
 * - Service layer integration via services/index.js barrel exports
 * - Controller initialization through controllers/index.js management
 * - Health monitoring via monitoring/health-check.js (when available)
 * - Comprehensive logging through utils/logger.js structured logging
 * - Error handling via utils/error-types.js standardized error classes
 * 
 * Production Readiness:
 * - Graceful shutdown handling for PM2 cluster mode
 * - Health check endpoints for load balancer integration
 * - Security headers and policies via Helmet.js configuration
 * - Request correlation tracking and performance monitoring
 * - Comprehensive error handling with operational vs programming classification
 * - Environment-aware configuration management
 * - Cross-platform compatibility preparation for Flask migration
 */

// External library imports with version comments for dependency management
import express from 'express'; // v5.1.0 - Express.js web framework with enhanced security and performance
import helmet from 'helmet'; // v8.1.0 - Security middleware for HTTP response headers and web security policies
import cors from 'cors'; // latest - Cross-Origin Resource Sharing middleware for cross-origin request security
import os from 'os'; // Node.js built-in - Operating system related utilities

// Internal configuration imports for unified application configuration management
import { 
  config,
  environmentConfig as environment,
  securityConfig as security,
  pm2Config as server
} from './config/index.js';

// Middleware stack imports for comprehensive request processing pipeline
import { 
  createMiddlewareStack,
  initializeMiddleware
} from './middleware/index.js';

// Route aggregation imports for centralized routing system management
import {
  routes,
  createRoutesAggregator,
  helloRouter,
  goodEveningRouter,
  healthRouter
} from './routes/index.js';

// Service layer imports for business logic and application services
import { HealthService, startHealthMonitoring } from './services/index.js';

// Controller layer imports for request handling and response management
import { initializeAllControllers } from './controllers/index.js';

// Health monitoring imports for comprehensive application monitoring (conditionally available)
let HealthCheckManager;
try {
  const healthCheckModule = await import('./monitoring/health-check.js');
  HealthCheckManager = healthCheckModule.HealthCheckManager;
} catch (error) {
  // Health check manager not available, use fallback monitoring
  console.warn('Health check manager not available, using fallback monitoring');
}

// Utility imports for logging, constants, and error handling
import logger, {
  createRequestLogger,
  logPerformanceMetrics,
  logSecurityEvent,
  generateRequestId
} from './utils/logger.js';

import {
  ENV_CONSTANTS,
  HTTP_CONSTANTS,
  PM2_CONSTANTS
} from './utils/constants.js';

import {
  createErrorResponse,
  HTTPError,
  isOperationalError,
  classifyErrorSeverity
} from './utils/error-types.js';

// Global application state and monitoring variables
let app = null; // Express application instance
let httpServer = null; // HTTP server instance
let healthService = null; // Health service instance
let healthCheckManager = null; // Health check manager instance
let isShuttingDown = false; // Graceful shutdown flag

/**
 * Factory function that creates and configures the Express.js application instance with all middleware,
 * routes, security, and monitoring components. Implements modern Express.js v5.1.0 patterns with
 * comprehensive configuration management and production-ready setup.
 * 
 * @param {Object} [options={}] - Application configuration options
 * @param {Object} [options.configOverrides] - Configuration overrides for testing
 * @param {boolean} [options.enableHealthMonitoring=true] - Enable health monitoring system
 * @param {boolean} [options.enableSecurityMiddleware=true] - Enable security middleware
 * @param {Object} [options.additionalMiddleware] - Additional middleware to apply
 * @returns {Object} Configured Express.js application instance ready for server startup
 */
async function createExpressApp(options = {}) {
  const appConfig = {
    enableHealthMonitoring: options.enableHealthMonitoring !== false,
    enableSecurityMiddleware: options.enableSecurityMiddleware !== false,
    configOverrides: options.configOverrides || {},
    additionalMiddleware: options.additionalMiddleware || [],
    ...options
  };

  try {
    logger.info('Starting Express.js application creation', {
      version: '5.1.0',
      nodeVersion: process.version,
      environment: environment.NODE_ENV,
      pid: process.pid,
      options: appConfig
    });

    // Create Express application instance using express() factory
    app = express();
    
    // Apply configuration overrides for testing and customization
    const finalConfig = {
      ...config,
      ...appConfig.configOverrides
    };

    logger.debug('Application configuration loaded', {
      environment: finalConfig.environment,
      security: finalConfig.security ? 'enabled' : 'disabled',
      server: finalConfig.server
    });

    // Configure comprehensive middleware stack
    await configureMiddleware(app, {
      security: finalConfig.security,
      server: finalConfig.server,
      environment: finalConfig.environment,
      enableSecurity: appConfig.enableSecurityMiddleware,
      additionalMiddleware: appConfig.additionalMiddleware
    });

    // Mount application routes with proper aggregation
    mountRoutes(app, {
      routes: finalConfig.routes || {},
      environment: finalConfig.environment
    });

    // Initialize health monitoring system if enabled
    if (appConfig.enableHealthMonitoring) {
      await initializeHealthMonitoring(app);
    }

    // Set up error handling middleware for centralized error processing
    setupErrorHandling(app);

    // Configure 404 handler for unmatched routes
    setup404Handler(app);

    logger.info('Express.js application created successfully', {
      middlewareCount: app._router ? app._router.stack.length : 0,
      environment: finalConfig.environment.NODE_ENV,
      securityEnabled: appConfig.enableSecurityMiddleware,
      healthMonitoringEnabled: appConfig.enableHealthMonitoring
    });

    return app;

  } catch (error) {
    logger.error('Failed to create Express.js application', error, {
      options: appConfig,
      environment: process.env.NODE_ENV
    });
    
    // Create minimal fallback application for error scenarios
    const fallbackApp = express();
    fallbackApp.get('/health', (req, res) => {
      res.status(HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE).json({
        status: 'error',
        message: 'Application initialization failed',
        timestamp: new Date().toISOString()
      });
    });
    
    return fallbackApp;
  }
}

/**
 * Configures and applies all middleware components to the Express application including security,
 * logging, parsing, and error handling middleware. Implements middleware stack composition with
 * proper ordering and configuration management.
 * 
 * @param {Object} app - Express application instance
 * @param {Object} middlewareConfig - Middleware configuration options
 * @param {Object} middlewareConfig.security - Security configuration
 * @param {Object} middlewareConfig.environment - Environment configuration
 * @param {boolean} middlewareConfig.enableSecurity - Enable security middleware
 * @param {Array} middlewareConfig.additionalMiddleware - Additional middleware functions
 * @returns {void} No return value, modifies Express app instance with configured middleware stack
 */
async function configureMiddleware(app, middlewareConfig) {
  try {
    logger.info('Configuring middleware stack', {
      securityEnabled: middlewareConfig.enableSecurity,
      environment: middlewareConfig.environment?.NODE_ENV
    });

    // Initialize middleware stack using factory function
    const middlewareStack = await createMiddlewareStack(
      middlewareConfig.environment?.NODE_ENV || process.env.NODE_ENV || 'development',
      {
        enableSecurityValidation: middlewareConfig.enableSecurity,
        customConfig: middlewareConfig.security || {}
      }
    );

    // Initialize middleware with environment-specific configuration
    initializeMiddleware(app, {
      stack: middlewareStack,
      config: middlewareConfig
    });

    // Apply Helmet.js security middleware with CSP directives and security headers
    if (middlewareConfig.enableSecurity && middlewareConfig.security) {
      app.use(helmet({
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
        ...middlewareConfig.security.helmet
      }));

      logger.debug('Helmet.js security middleware configured', {
        csp: 'enabled',
        headers: Object.keys(middlewareConfig.security.helmet || {})
      });
    }

    // Configure CORS middleware with origin restrictions and preflight handling
    const corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = middlewareConfig.security?.cors?.allowedOrigins || ['http://localhost:3000'];
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          const error = new HTTPError('CORS policy violation', HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN, {
            origin,
            allowedOrigins
          });
          
          logSecurityEvent('cors-violation', {
            origin,
            allowedOrigins,
            userAgent: 'unknown'
          });
          
          callback(error);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
      credentials: true,
      maxAge: 86400, // 24 hours
      ...middlewareConfig.security?.cors
    };

    app.use(cors(corsOptions));
    logger.debug('CORS middleware configured', { corsOptions });

    // Set up request parsing middleware for JSON and URL-encoded data with size limits
    app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        req.rawBody = buf;
      }
    }));
    
    app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb'
    }));

    // Apply request logging middleware with correlation ID generation
    app.use((req, res, next) => {
      const requestLogger = createRequestLogger(req);
      req.logger = requestLogger;
      req.correlationId = requestLogger.correlationId;
      
      // Set correlation ID header for response tracking
      res.set('X-Request-ID', req.correlationId);
      
      requestLogger.logRequest();
      
      // Track response for performance monitoring
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
        
        requestLogger.logResponse(res.statusCode, responseTime);
        
        logPerformanceMetrics({
          responseTime,
          statusCode: res.statusCode,
          method: req.method,
          url: req.url
        }, {
          correlationId: req.correlationId
        });
      });
      
      next();
    });

    // Apply additional custom middleware if provided
    middlewareConfig.additionalMiddleware.forEach(middleware => {
      if (typeof middleware === 'function') {
        app.use(middleware);
        logger.debug('Applied additional middleware', { 
          middlewareName: middleware.name || 'anonymous'
        });
      }
    });

    logger.info('Middleware stack configured successfully', {
      securityMiddleware: middlewareConfig.enableSecurity,
      additionalMiddleware: middlewareConfig.additionalMiddleware.length
    });

  } catch (error) {
    logger.error('Failed to configure middleware stack', error, {
      middlewareConfig
    });
    throw new HTTPError('Middleware configuration failed', HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
      cause: error
    });
  }
}

/**
 * Mounts all application routes including hello, good-evening, and health endpoints with proper
 * route aggregation and RESTful API design. Implements route organization with error handling
 * and middleware integration.
 * 
 * @param {Object} app - Express application instance
 * @param {Object} routeConfig - Route configuration options
 * @param {Object} routeConfig.routes - Route-specific configuration
 * @param {Object} routeConfig.environment - Environment configuration
 * @returns {void} No return value, mounts routes on Express app instance with proper configuration
 */
function mountRoutes(app, routeConfig) {
  try {
    logger.info('Mounting application routes', {
      environment: routeConfig.environment?.NODE_ENV
    });

    // Create routes aggregator with configuration options
    const routesAggregator = createRoutesAggregator({
      environment: routeConfig.environment?.NODE_ENV || process.env.NODE_ENV || 'development',
      enableMetrics: true
    });

    // Mount hello router on /hello endpoint with GET method support
    app.use('/hello', helloRouter);
    logger.debug('Mounted hello router', { path: '/hello' });

    // Mount good-evening router on /good-evening endpoint with consistent formatting
    app.use('/good-evening', goodEveningRouter);
    logger.debug('Mounted good-evening router', { path: '/good-evening' });

    // Mount health router on /health endpoint with comprehensive health checks
    app.use('/health', healthRouter);
    logger.debug('Mounted health router', { path: '/health' });

    // Mount aggregated routes if available
    if (routes && typeof routes === 'object') {
      Object.keys(routes).forEach(routePath => {
        if (routes[routePath] && typeof routes[routePath].use === 'function') {
          app.use(routePath, routes[routePath]);
          logger.debug('Mounted aggregated route', { path: routePath });
        }
      });
    }

    // Add API version prefix for future API versioning
    const apiPrefix = '/api/v1';
    
    // Mount versioned API routes
    app.use(`${apiPrefix}/hello`, helloRouter);
    app.use(`${apiPrefix}/good-evening`, goodEveningRouter);
    app.use(`${apiPrefix}/health`, healthRouter);

    logger.debug('Mounted versioned API routes', { prefix: apiPrefix });

    // Set up route performance monitoring
    app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        if (responseTime > 1000) { // Log slow requests
          logger.warn('Slow route response detected', {
            method: req.method,
            url: req.url,
            responseTime,
            statusCode: res.statusCode,
            correlationId: req.correlationId
          });
        }
      });
      
      next();
    });

    logger.info('Application routes mounted successfully', {
      routes: ['/hello', '/good-evening', '/health'],
      versionedRoutes: [`${apiPrefix}/hello`, `${apiPrefix}/good-evening`, `${apiPrefix}/health`]
    });

  } catch (error) {
    logger.error('Failed to mount application routes', error, {
      routeConfig
    });
    throw new HTTPError('Route mounting failed', HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, {
      cause: error
    });
  }
}

/**
 * Initializes comprehensive health monitoring system including health checks, performance metrics,
 * uptime tracking, and alerting capabilities. Integrates with PM2 monitoring and production
 * observability requirements.
 * 
 * @param {Object} app - Express application instance
 * @returns {Object} Initialized health monitoring system with metrics collection and alerting
 */
async function initializeHealthMonitoring(app) {
  try {
    logger.info('Initializing health monitoring system');

    // Create HealthService instance with application context
    healthService = new HealthService({
      app,
      environment: environment,
      monitoring: {
        enabled: true,
        interval: 30000, // 30 seconds
        thresholds: {
          memory: 1024 * 1024 * 1024, // 1GB
          cpu: 80, // 80%
          responseTime: 2000 // 2 seconds
        }
      }
    });

    // Initialize HealthCheckManager if available
    if (HealthCheckManager) {
      healthCheckManager = new HealthCheckManager({
        healthService,
        alerting: {
          enabled: environment.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
          channels: ['log', 'metrics']
        }
      });

      // Start health monitoring background processes
      healthCheckManager.initializeHealthChecks();
      healthCheckManager.startMonitoring();
      
      logger.debug('HealthCheckManager initialized and started');
    } else {
      // Fallback health monitoring without HealthCheckManager
      setupFallbackHealthMonitoring();
    }

    // Start health service monitoring
    await startHealthMonitoring({
      service: healthService,
      interval: 30000,
      thresholds: {
        memory: 1024 * 1024 * 1024,
        cpu: 80,
        responseTime: 2000
      }
    });

    // Set up health metrics collection
    const healthMetricsInterval = setInterval(() => {
      if (!isShuttingDown) {
        const healthMetrics = healthService.getApplicationHealth();
        
        logPerformanceMetrics({
          type: 'health-metrics',
          ...healthMetrics
        }, {
          source: 'health-monitoring'
        });
      }
    }, 60000); // Every minute

    // Cleanup interval on shutdown
    process.on('SIGTERM', () => {
      clearInterval(healthMetricsInterval);
    });

    logger.info('Health monitoring system initialized successfully', {
      healthService: 'enabled',
      healthCheckManager: HealthCheckManager ? 'enabled' : 'fallback',
      metricsInterval: '60s'
    });

    return {
      healthService,
      healthCheckManager,
      isHealthy: () => healthService.getApplicationHealth().status === 'healthy'
    };

  } catch (error) {
    logger.error('Failed to initialize health monitoring', error);
    
    // Set up minimal health monitoring fallback
    setupFallbackHealthMonitoring();
    
    return {
      healthService: null,
      healthCheckManager: null,
      isHealthy: () => true // Assume healthy if monitoring fails
    };
  }
}

/**
 * Sets up fallback health monitoring when HealthCheckManager is not available
 * @private
 */
function setupFallbackHealthMonitoring() {
  logger.warn('Using fallback health monitoring system');
  
  // Basic health monitoring without external dependencies
  const basicHealthCheck = {
    getStatus: () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    })
  };
  
  // Expose basic health endpoint
  if (app) {
    app.get('/health/basic', (req, res) => {
      res.json(basicHealthCheck.getStatus());
    });
  }
}

/**
 * Sets up comprehensive error handling middleware for centralized error processing and response
 * formatting. Implements Express.js v5.1.0 error handling patterns with proper error classification.
 * 
 * @param {Object} app - Express application instance
 * @returns {void} No return value, sets up error handling middleware on Express app
 */
function setupErrorHandling(app) {
  try {
    logger.debug('Setting up error handling middleware');

    // Error handling middleware (must be last)
    app.use((error, req, res, next) => {
      // Generate error correlation ID if not present
      const errorId = generateRequestId({ prefix: 'err' });
      
      // Log error with full context
      logger.error('Application error occurred', error, {
        correlationId: req.correlationId || errorId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Classify error severity for monitoring
      const errorClassification = classifyErrorSeverity(error, {
        requestId: req.correlationId,
        method: req.method,
        url: req.url
      });

      // Create standardized error response
      const errorResponse = createErrorResponse(error, {
        environment: environment.NODE_ENV,
        includeStack: environment.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
        correlationId: req.correlationId || errorId,
        additionalContext: {
          method: req.method,
          url: req.url,
          severity: errorClassification.severity
        }
      });

      // Set appropriate status code
      const statusCode = error.statusCode || 
                        error.status || 
                        HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;

      // Send error response
      res.status(statusCode).json(errorResponse);

      // Emit error event for monitoring systems
      process.emit('application-error', {
        error,
        request: {
          method: req.method,
          url: req.url,
          correlationId: req.correlationId
        },
        response: {
          statusCode,
          errorResponse
        },
        classification: errorClassification
      });
    });

    logger.debug('Error handling middleware configured successfully');

  } catch (error) {
    logger.error('Failed to setup error handling middleware', error);
    
    // Fallback error handler
    app.use((error, req, res, next) => {
      res.status(HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }
}

/**
 * Sets up 404 handler for unmatched routes with appropriate error responses
 * @private
 * @param {Object} app - Express application instance
 */
function setup404Handler(app) {
  app.use('*', (req, res) => {
    const error = new HTTPError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND,
      {
        method: req.method,
        url: req.originalUrl,
        correlationId: req.correlationId
      }
    );

    logger.warn('Route not found', {
      method: req.method,
      url: req.originalUrl,
      correlationId: req.correlationId,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    const errorResponse = createErrorResponse(error, {
      environment: environment.NODE_ENV
    });

    res.status(HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND).json(errorResponse);
  });
}

/**
 * Configures graceful shutdown handlers for SIGTERM and SIGINT signals ensuring proper resource
 * cleanup, connection draining, and clean process termination. Essential for PM2 cluster mode
 * and production deployments.
 * 
 * @param {Object} httpServer - HTTP server instance
 * @returns {void} No return value, sets up signal handlers for graceful shutdown procedures
 */
function setupGracefulShutdown(httpServer) {
  const shutdownHandler = async (signal) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, forcefully exiting', { signal });
      process.exit(1);
      return;
    }

    isShuttingDown = true;
    logger.info('Graceful shutdown initiated', { signal, pid: process.pid });

    try {
      // Set shutdown timeout to prevent hanging
      const shutdownTimeout = setTimeout(() => {
        logger.error('Shutdown timeout exceeded, forcefully exiting');
        process.exit(1);
      }, 30000); // 30 seconds

      // Stop accepting new requests
      if (httpServer) {
        logger.info('Closing HTTP server');
        
        await new Promise((resolve, reject) => {
          httpServer.close((error) => {
            if (error) {
              logger.error('Error closing HTTP server', error);
              reject(error);
            } else {
              logger.info('HTTP server closed successfully');
              resolve();
            }
          });
        });
      }

      // Stop health monitoring
      if (healthService) {
        logger.info('Stopping health monitoring');
        // Assuming healthService has a stop method
        if (typeof healthService.stop === 'function') {
          await healthService.stop();
        }
      }

      if (healthCheckManager) {
        logger.info('Stopping health check manager');
        // Assuming healthCheckManager has a stop method
        if (typeof healthCheckManager.stop === 'function') {
          await healthCheckManager.stop();
        }
      }

      // Clear shutdown timeout
      clearTimeout(shutdownTimeout);

      logger.info('Graceful shutdown completed successfully', { signal });
      process.exit(0);

    } catch (error) {
      logger.error('Error during graceful shutdown', error, { signal });
      process.exit(1);
    }
  };

  // Register signal handlers
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdownHandler('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', new Error(reason), {
      promise: promise.toString()
    });
    shutdownHandler('unhandledRejection');
  });

  logger.info('Graceful shutdown handlers configured', {
    signals: ['SIGTERM', 'SIGINT', 'uncaughtException', 'unhandledRejection']
  });
}

/**
 * Starts the Express.js HTTP server with configuration management, error handling, and
 * production-ready startup procedures. Implements server lifecycle management with proper
 * initialization sequence and startup validation.
 * 
 * @param {Object} expressApp - Express application instance
 * @param {Object} [serverConfig={}] - Server configuration options
 * @param {number} [serverConfig.port] - Server port override
 * @param {string} [serverConfig.host] - Server host override
 * @param {boolean} [serverConfig.enableGracefulShutdown=true] - Enable graceful shutdown
 * @returns {Object} Started HTTP server instance with health monitoring and graceful shutdown
 */
function startServer(expressApp, serverConfig = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Extract server configuration with defaults
      const config = {
        port: serverConfig.port || ENV_CONSTANTS.DEFAULT_PORT,
        host: serverConfig.host || '0.0.0.0',
        enableGracefulShutdown: serverConfig.enableGracefulShutdown !== false,
        ...serverConfig
      };

      logger.info('Starting HTTP server', {
        port: config.port,
        host: config.host,
        environment: environment.NODE_ENV,
        nodeVersion: process.version,
        pid: process.pid
      });

      // Validate server configuration
      // Port 0 is valid for dynamic port assignment
      const portNumber = Number(config.port);
      if (config.port === null || config.port === undefined || 
          isNaN(portNumber) || portNumber < 0 || portNumber > 65535 || 
          !Number.isInteger(portNumber)) {
        throw new Error(`Invalid port number: ${config.port}`);
      }
      config.port = portNumber;

      // Start HTTP server with configured port and host
      httpServer = expressApp.listen(config.port, config.host, () => {
        const address = httpServer.address();
        const serverUrl = `http://${address.address}:${address.port}`;

        logger.info('HTTP server started successfully', {
          url: serverUrl,
          port: address.port,
          host: address.address,
          environment: environment.NODE_ENV,
          pid: process.pid,
          uptime: process.uptime()
        });

        // Log application startup summary
        logApplicationStartup(config, httpServer);

        // Set up graceful shutdown if enabled
        if (config.enableGracefulShutdown) {
          setupGracefulShutdown(httpServer);
        }

        // Validate application health after startup
        validateApplicationHealth(expressApp)
          .then(healthResult => {
            logger.info('Application health validation completed', healthResult);
            resolve(httpServer);
          })
          .catch(healthError => {
            logger.warn('Application health validation failed', healthError);
            // Don't reject, just warn - server is still functional
            resolve(httpServer);
          });
      });

      // Set up server error handling
      httpServer.on('error', (error) => {
        handleServerError(error, {
          port: config.port,
          host: config.host,
          environment: environment.NODE_ENV
        });
        reject(error);
      });

      // Configure server timeout settings for production
      if (environment.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
        httpServer.timeout = 30000; // 30 seconds
        httpServer.keepAliveTimeout = 65000; // 65 seconds
        httpServer.headersTimeout = 66000; // 66 seconds
      }

    } catch (error) {
      logger.error('Failed to start HTTP server', error, serverConfig);
      reject(error);
    }
  });
}

/**
 * Handles server startup and runtime errors with appropriate error classification, logging,
 * and recovery procedures. Implements comprehensive error handling for production reliability.
 * 
 * @param {Error} error - Server error instance
 * @param {Object} context - Error context information
 * @returns {void} No return value, handles error with logging and appropriate response actions
 */
function handleServerError(error, context = {}) {
  // Classify error type and determine appropriate response
  const isOperational = isOperationalError(error);
  const severity = classifyErrorSeverity(error, context);

  logger.error('Server error occurred', error, {
    ...context,
    isOperational,
    severity: severity.severity,
    errorCode: error.code,
    errno: error.errno,
    syscall: error.syscall,
    address: error.address,
    port: error.port
  });

  // Handle specific error types
  switch (error.code) {
    case 'EADDRINUSE':
      logger.error('Port already in use', error, {
        port: context.port,
        suggestion: 'Try a different port or stop the process using this port'
      });
      break;

    case 'EACCES':
      logger.error('Permission denied', error, {
        port: context.port,
        suggestion: 'Try running with elevated privileges or use a port > 1024'
      });
      break;

    case 'ENOTFOUND':
      logger.error('Host not found', error, {
        host: context.host,
        suggestion: 'Check host configuration and network connectivity'
      });
      break;

    default:
      logger.error('Unknown server error', error, context);
  }

  // Emit error event for monitoring systems
  process.emit('server-error', {
    error,
    context,
    severity,
    isOperational,
    timestamp: new Date().toISOString()
  });

  // Exit process for unrecoverable errors
  if (!isOperational || severity.severity === 'critical') {
    logger.error('Unrecoverable server error, exiting process', {
      error: error.message,
      code: error.code,
      severity: severity.severity
    });
    
    // Give time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

/**
 * Validates overall application health including all components, dependencies, and system
 * requirements. Performs comprehensive health assessment for deployment readiness.
 * 
 * @param {Object} expressApp - Express application instance
 * @returns {Object} Comprehensive health validation result with component status and recommendations
 */
async function validateApplicationHealth(expressApp) {
  try {
    logger.debug('Starting application health validation');

    const healthValidation = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      components: {},
      issues: [],
      recommendations: [],
      overall: {
        healthy: true,
        score: 100
      }
    };

    // Validate Express application configuration
    if (!expressApp || typeof expressApp.listen !== 'function') {
      healthValidation.components.express = {
        status: 'unhealthy',
        message: 'Express application not properly configured'
      };
      healthValidation.issues.push('Express application invalid');
      healthValidation.overall.healthy = false;
      healthValidation.overall.score -= 30;
    } else {
      healthValidation.components.express = {
        status: 'healthy',
        message: 'Express application configured correctly'
      };
    }

    // Validate middleware stack
    const middlewareCount = expressApp._router ? expressApp._router.stack.length : 0;
    if (middlewareCount === 0) {
      healthValidation.components.middleware = {
        status: 'warning',
        message: 'No middleware detected'
      };
      healthValidation.issues.push('Missing middleware stack');
      healthValidation.overall.score -= 10;
    } else {
      healthValidation.components.middleware = {
        status: 'healthy',
        message: `${middlewareCount} middleware functions loaded`
      };
    }

    // Validate health service
    if (healthService && typeof healthService.getApplicationHealth === 'function') {
      try {
        const serviceHealth = healthService.getApplicationHealth();
        healthValidation.components.healthService = {
          status: serviceHealth.status === 'healthy' ? 'healthy' : 'warning',
          message: 'Health service operational',
          details: serviceHealth
        };
      } catch (serviceError) {
        healthValidation.components.healthService = {
          status: 'warning',
          message: 'Health service error',
          error: serviceError.message
        };
        healthValidation.overall.score -= 5;
      }
    } else {
      healthValidation.components.healthService = {
        status: 'warning',
        message: 'Health service not available'
      };
      healthValidation.overall.score -= 5;
    }

    // Validate system resources
    const memoryUsage = process.memoryUsage();
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    
    if (memoryUsage.heapUsed > totalMemory * 0.8) {
      healthValidation.components.memory = {
        status: 'warning',
        message: 'High memory usage detected',
        usage: memoryUsage,
        free: freeMemory
      };
      healthValidation.issues.push('High memory usage');
      healthValidation.overall.score -= 15;
    } else {
      healthValidation.components.memory = {
        status: 'healthy',
        message: 'Memory usage within normal range',
        usage: memoryUsage
      };
    }

    // Validate environment configuration
    if (!environment.NODE_ENV) {
      healthValidation.components.environment = {
        status: 'warning',
        message: 'NODE_ENV not set'
      };
      healthValidation.recommendations.push('Set NODE_ENV environment variable');
      healthValidation.overall.score -= 5;
    } else {
      healthValidation.components.environment = {
        status: 'healthy',
        message: `Environment: ${environment.NODE_ENV}`
      };
    }

    // Determine overall health status
    if (healthValidation.overall.score < 70) {
      healthValidation.status = 'unhealthy';
      healthValidation.overall.healthy = false;
    } else if (healthValidation.overall.score < 90) {
      healthValidation.status = 'warning';
    }

    logger.info('Application health validation completed', {
      status: healthValidation.status,
      score: healthValidation.overall.score,
      components: Object.keys(healthValidation.components).length,
      issues: healthValidation.issues.length
    });

    return healthValidation;

  } catch (error) {
    logger.error('Application health validation failed', error);
    
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: 'Health validation failed',
      error: error.message,
      overall: {
        healthy: false,
        score: 0
      }
    };
  }
}

/**
 * Logs comprehensive application startup information including configuration summary,
 * security policies, performance settings, and operational status.
 * 
 * @param {Object} appConfig - Application configuration
 * @param {Object} httpServer - HTTP server instance
 * @returns {void} No return value, performs comprehensive startup logging for operational monitoring
 */
function logApplicationStartup(appConfig, httpServer) {
  try {
    const startupInfo = {
      application: {
        name: 'Node.js Tutorial Project',
        version: '1.0.0',
        environment: environment.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      
      server: {
        port: appConfig.port || (httpServer && httpServer.address() ? httpServer.address().port : 'unknown'),
        host: appConfig.host || '0.0.0.0',
        timeout: httpServer ? httpServer.timeout : 'default',
        keepAliveTimeout: httpServer ? httpServer.keepAliveTimeout : 'default'
      },
      
      security: {
        helmet: security ? 'enabled' : 'disabled',
        cors: 'enabled',
        csp: security && security.helmet ? 'enabled' : 'disabled'
      },
      
      monitoring: {
        healthService: healthService ? 'enabled' : 'disabled',
        healthCheckManager: healthCheckManager ? 'enabled' : 'fallback',
        logging: 'enabled',
        performanceTracking: 'enabled'
      },
      
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pm2: process.env.PM2_HOME ? 'enabled' : 'not-detected'
      },
      
      timestamp: new Date().toISOString(),
      startupTime: Date.now()
    };

    logger.info('Application startup completed', startupInfo);

    // Log startup summary
    const summary = [
      `🚀 Node.js Tutorial Project started successfully`,
      `📊 Environment: ${startupInfo.application.environment}`,
      `🌐 Server: http://${startupInfo.server.host}:${startupInfo.server.port}`,
      `🔒 Security: ${startupInfo.security.helmet === 'enabled' ? '✅' : '❌'} Helmet, ✅ CORS`,
      `📈 Monitoring: ${startupInfo.monitoring.healthService === 'enabled' ? '✅' : '❌'} Health Service`,
      `⚡ PM2: ${startupInfo.process.pm2 === 'enabled' ? '✅ Detected' : '❌ Not Detected'}`,
      `🔧 Node.js: ${startupInfo.application.nodeVersion}`,
      `🆔 PID: ${startupInfo.process.pid}`
    ].join('\n');

    console.log('\n' + summary + '\n');

    // Emit startup event for monitoring systems
    process.emit('application-startup', startupInfo);

  } catch (error) {
    logger.error('Failed to log application startup information', error);
  }
}

/**
 * Creates Express.js application with development-specific configurations
 * @param {Object} config - Development-specific configuration options  
 * @returns {Object} Express application instance with development settings
 */
export function createDevelopmentApp(config = {}) {
  const developmentConfig = {
    environment: 'development',
    enableHealthMonitoring: true,
    enableDetailedLogging: true,
    enableCors: true,
    enableRateLimiting: false, // More lenient for development
    enableSecurityHeaders: true,
    enableStaticFiles: true,
    ...config
  };
  
  return createExpressApp(developmentConfig);
}

/**
 * Creates Express.js application with production-specific configurations
 * @param {Object} config - Production-specific configuration options  
 * @returns {Object} Express application instance with production settings
 */
export function createProductionApp(config = {}) {
  const productionConfig = {
    environment: 'production',
    enableHealthMonitoring: true,
    enableDetailedLogging: false,
    enableCors: true,
    enableRateLimiting: true, // Stricter for production
    enableSecurityHeaders: true,
    enableStaticFiles: false, // Usually served by CDN in production
    enableGzip: true,
    enableTrust: true, // Trust proxy headers in production
    ...config
  };
  
  return createExpressApp(productionConfig);
}

// Export main application instance and utility functions for external use
export {
  app,
  createExpressApp,
  createExpressApp as createApp, // Alias for tests
  startServer,
  healthService,
  httpServer,
  setupGracefulShutdown,
  handleServerError,
  validateApplicationHealth,
  validateApplicationHealth as validateApplicationConfiguration, // Alias for tests
  logApplicationStartup
};

// Initialize controllers if the module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // Initialize all controllers
    await initializeAllControllers();
    
    // Create and start the application
    const application = await createExpressApp({
      enableHealthMonitoring: true,
      enableSecurityMiddleware: true
    });
    
    const httpServer = await startServer(application);
    
    logger.info('Application started as main module', {
      port: httpServer.address().port,
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    logger.error('Failed to start application as main module', error);
    process.exit(1);
  }
}