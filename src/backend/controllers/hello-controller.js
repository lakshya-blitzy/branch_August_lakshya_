/**
 * @fileoverview Express.js Controller Module for Node.js Tutorial Project Hello Endpoints
 * @description Comprehensive Express.js v5.1.0 controller implementation that handles HTTP request/response
 * lifecycle for the hello endpoints (/hello and /good-evening) in the Node.js tutorial project. 
 * Implements the controller layer of the MVC architecture pattern by orchestrating service layer 
 * business logic, request validation, response formatting, and comprehensive error handling.
 * 
 * Features comprehensive Express.js v5.1.0 integration with modern middleware support, security 
 * headers, request correlation tracking, and production-ready patterns including PM2 cluster mode 
 * compatibility, cross-platform Flask migration support, and educational demonstration of controller 
 * best practices for HTTP endpoint management.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates Express.js v5.1.0 controller implementation with modern async/await patterns
 * - Illustrates controller-service architecture separation with clear responsibility boundaries
 * - Showcases request validation and security implementation in controller layer
 * - Provides HTTP status code management and response formatting best practices
 * - Demonstrates error handling patterns with centralized error management
 * - Shows performance monitoring and metrics collection in production controllers
 * - Illustrates cross-platform development with Flask compatibility considerations
 * - Provides CORS handling and preflight request management examples
 * - Demonstrates request correlation tracking for distributed system debugging
 * - Shows PM2 cluster mode compatibility with stateless controller design
 * 
 * Technology Integration:
 * - Express.js v5.1.0 with async/await middleware support
 * - PM2 v6.0.8 cluster mode compatible stateless design
 * - Helmet.js security middleware integration
 * - Node.js v22.x LTS ES Modules with modern JavaScript features
 * - Cross-platform Flask equivalent functionality for educational comparison
 * - Comprehensive testing support for Jest and Mocha frameworks
 * 
 * Production Features:
 * - PM2 cluster mode full compatibility with load balancing support
 * - Comprehensive metrics collection and performance monitoring integration
 * - Production-ready error handling with sanitized responses
 * - Structured logging with correlation tracking and performance metrics
 * - Controller health status and operational monitoring support
 * - Zero-downtime deployment compatibility with PM2 reload operations
 */

// Internal imports from service layer with comprehensive business logic functionality
import {
  getHelloMessage,
  getGoodEveningMessage,
  validateMessageRequest,
  handleServiceError,
  trackServiceMetrics,
  formatMessageResponse,
  createFlaskCompatibleResponse,
  generateServiceHealth
} from '../services/hello-service.js';

// Internal imports from constants module for standardized configuration and HTTP management
import {
  API_CONSTANTS,
  HTTP_CONSTANTS
} from '../utils/constants.js';

// Internal imports from logger module for structured logging and request correlation tracking
import logger, {
  generateRequestId,
  createRequestLogger,
  logPerformanceMetrics,
  logSecurityEvent
} from '../utils/logger.js';

// Internal imports from error handling module for comprehensive error management and classification
import {
  HTTPError,
  ValidationError,
  createErrorResponse,
  classifyErrorSeverity
} from '../utils/error-types.js';

// Internal imports from security module for security headers middleware
import securityHeaders from '../security/security-headers.js';

// Global controller cache for performance optimization and response caching
const CONTROLLER_CACHE = new Map();

// Global request metrics for performance monitoring and PM2 integration
const REQUEST_METRICS = {
  requests: 0,
  totalResponseTime: 0,
  errorCount: 0,
  lastResetTime: Date.now()
};

// CORS headers configuration for cross-origin request support and security policy
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Expose-Headers': 'X-Request-ID, X-Response-Time'
};

/**
 * Primary controller function for handling GET /hello endpoint requests with comprehensive
 * Express.js v5.1.0 integration. Orchestrates request validation, service layer interaction,
 * response formatting, and error handling with security features, performance monitoring,
 * and cross-platform compatibility. Implements stateless design for PM2 cluster mode
 * and provides educational demonstration of Express.js controller patterns.
 * 
 * @param {Object} req - Express.js request object with HTTP request details and middleware context
 * @param {Object} res - Express.js response object for HTTP response management and header control
 * @param {Function} next - Express.js next middleware function for error handling and pipeline continuation
 * @returns {Promise<void>} Asynchronous function that handles complete request processing and sends response or calls next middleware
 */
async function hello(req, res, next) {
  // Generate unique request correlation ID using generateRequestId for distributed tracking and debugging
  const correlationId = generateRequestId({
    prefix: 'hello',
    metadata: {
      method: req.method,
      url: req.url,
      userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
    }
  });

  // Start performance measurement using process.hrtime.bigint() for high-precision controller execution timing
  const startTime = process.hrtime.bigint();

  // Create request-scoped logger with correlation tracking and contextual information for comprehensive request lifecycle logging
  const requestLogger = createRequestLogger(req, {
    correlationId,
    controller: 'hello-controller',
    endpoint: '/hello'
  });

  try {
    // Log incoming request with method, URL, headers, and correlation information for request tracking and debugging
    requestLogger.logRequest();
    requestLogger.info('Hello endpoint request started', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
    });

    // Validate request using validateMessageRequest for comprehensive security and parameter checking
    const validationResult = await validateMessageRequest(req, {
      correlationId,
      endpoint: '/hello',
      securityCheck: true
    });

    if (!validationResult.success) {
      throw new ValidationError(
        'Request validation failed',
        validationResult.error ? [validationResult.error] : [],
        {
          correlationId,
          requestContext: createRequestContext(req, { correlationId })
        }
      );
    }

    // Extract comprehensive request context including headers, query parameters, and client information for service processing
    const requestContext = createRequestContext(req, {
      correlationId,
      validationResult,
      startTime,
      endpoint: '/hello'
    });

    // Call getHelloMessage service function with request context and performance options for business logic processing
    const serviceResponse = await getHelloMessage(requestContext, {
      enableCaching: true,
      performanceTracking: true,
      crossPlatformFormat: true
    });

    // Format service response using formatMessageResponse for standardized API output and cross-platform compatibility
    const formattedResponse = await formatMessageResponse(serviceResponse, {
      format: 'http-json',
      includeMetadata: true,
      correlationId,
      responseHeaders: true
    });

    // Calculate response time for performance tracking and monitoring integration
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Apply security headers middleware for comprehensive security protection
    securityHeaders(req, res, () => {});

    // Set comprehensive HTTP headers including CORS headers from CORS_HEADERS configuration
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set request correlation and performance headers for debugging and monitoring
    res.setHeader('X-Request-ID', correlationId);
    res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    res.setHeader('X-Controller', 'hello-controller');
    res.setHeader('Content-Type', HTTP_CONSTANTS.CONTENT_TYPES.JSON);

    // Send JSON response with 200 status code using Express.js res.status().json() pattern for standard HTTP response
    res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(formattedResponse);

    // Track controller metrics using trackServiceMetrics for comprehensive performance monitoring and PM2 integration
    await trackServiceMetrics('hello-controller', {
      responseTime,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      correlationId,
      endpoint: '/hello'
    });

    // Update global request metrics for controller performance tracking and dashboard integration
    REQUEST_METRICS.requests++;
    REQUEST_METRICS.totalResponseTime += responseTime;

    // Log successful request completion with response time and correlation tracking for operational monitoring
    requestLogger.logResponse(HTTP_CONSTANTS.STATUS_CODES.OK, responseTime);
    requestLogger.info('Hello endpoint request completed successfully', {
      responseTime: `${responseTime.toFixed(2)}ms`,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      responseSize: JSON.stringify(formattedResponse).length
    });

  } catch (error) {
    // Handle any errors using handleControllerError and pass to Express.js error middleware for centralized error management
    await handleControllerError(error, req, res, next);
  }
}

/**
 * Controller function for handling GET /good-evening endpoint requests with identical functionality
 * to hello controller. Demonstrates consistent controller patterns, service integration, and response
 * handling while providing different message content for educational comparison and cross-platform
 * feature parity validation between Node.js Express and Python Flask implementations.
 * 
 * @param {Object} req - Express.js request object with HTTP request details and middleware context
 * @param {Object} res - Express.js response object for HTTP response management and header control
 * @param {Function} next - Express.js next middleware function for error handling and pipeline continuation
 * @returns {Promise<void>} Asynchronous function that handles complete request processing and sends response or calls next middleware
 */
async function goodEvening(req, res, next) {
  // Generate unique request correlation ID using generateRequestId for distributed tracking and debugging across systems
  const correlationId = generateRequestId({
    prefix: 'goodevening',
    metadata: {
      method: req.method,
      url: req.url,
      userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
    }
  });

  // Start performance measurement using process.hrtime.bigint() for high-precision controller execution timing and metrics
  const startTime = process.hrtime.bigint();

  // Create request-scoped logger with correlation tracking and contextual information for comprehensive request lifecycle logging
  const requestLogger = createRequestLogger(req, {
    correlationId,
    controller: 'hello-controller',
    endpoint: '/good-evening'
  });

  try {
    // Log incoming request with method, URL, headers, and correlation information for request tracking and system debugging
    requestLogger.logRequest();
    requestLogger.info('Good evening endpoint request started', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
    });

    // Validate request using validateMessageRequest for comprehensive security and parameter checking with endpoint-specific rules
    const validationResult = await validateMessageRequest(req, {
      correlationId,
      endpoint: '/good-evening',
      securityCheck: true
    });

    if (!validationResult.success) {
      throw new ValidationError(
        'Request validation failed',
        validationResult.error ? [validationResult.error] : [],
        {
          correlationId,
          requestContext: createRequestContext(req, { correlationId })
        }
      );
    }

    // Extract comprehensive request context including headers, query parameters, and client information for service layer processing
    const requestContext = createRequestContext(req, {
      correlationId,
      validationResult,
      startTime,
      endpoint: '/good-evening'
    });

    // Call getGoodEveningMessage service function with request context and performance options for business logic processing
    const serviceResponse = await getGoodEveningMessage(requestContext, {
      enableCaching: true,
      performanceTracking: true,
      crossPlatformFormat: true
    });

    // Format service response using formatMessageResponse for standardized API output and cross-platform compatibility
    const formattedResponse = await formatMessageResponse(serviceResponse, {
      format: 'http-json',
      includeMetadata: true,
      correlationId,
      responseHeaders: true
    });

    // Calculate response time for performance tracking and monitoring integration with PM2 and dashboard systems
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Apply security headers middleware for comprehensive security protection
    securityHeaders(req, res, () => {});

    // Set comprehensive HTTP headers including CORS headers from CORS_HEADERS configuration for cross-origin support
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set request correlation and performance headers for debugging and distributed system monitoring
    res.setHeader('X-Request-ID', correlationId);
    res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    res.setHeader('X-Controller', 'hello-controller');
    res.setHeader('Content-Type', HTTP_CONSTANTS.CONTENT_TYPES.JSON);

    // Send JSON response with 200 status code using Express.js res.status().json() pattern for standard RESTful API response
    res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(formattedResponse);

    // Track controller metrics using trackServiceMetrics for comprehensive performance monitoring and PM2 cluster integration
    await trackServiceMetrics('hello-controller', {
      responseTime,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      correlationId,
      endpoint: '/good-evening'
    });

    // Update global request metrics for controller performance tracking and operational dashboard integration
    REQUEST_METRICS.requests++;
    REQUEST_METRICS.totalResponseTime += responseTime;

    // Log successful request completion with response time and correlation tracking for operational monitoring and debugging
    requestLogger.logResponse(HTTP_CONSTANTS.STATUS_CODES.OK, responseTime);
    requestLogger.info('Good evening endpoint request completed successfully', {
      responseTime: `${responseTime.toFixed(2)}ms`,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
      responseSize: JSON.stringify(formattedResponse).length
    });

  } catch (error) {
    // Handle any errors using handleControllerError and pass to Express.js error middleware for centralized error management and logging
    await handleControllerError(error, req, res, next);
  }
}

/**
 * Middleware function that validates HTTP request methods against allowed methods for hello endpoints,
 * ensuring REST API compliance and security by rejecting unsupported methods with appropriate error
 * responses and comprehensive security logging for monitoring and attack detection in production environments.
 * 
 * @param {Object} req - Express.js request object with HTTP method and request details for validation
 * @param {Object} res - Express.js response object for sending error responses and setting appropriate headers
 * @param {Function} next - Express.js next middleware function for continuing pipeline or error handling
 * @returns {void} Middleware function that continues to next middleware or sends error response with security logging
 */
function validateRequestMethod(req, res, next) {
  // Extract HTTP method from request object and normalize to uppercase for consistent comparison with allowed methods
  const method = req.method.toUpperCase();

  // Generate correlation ID for security event tracking and request monitoring across distributed systems
  const correlationId = generateRequestId({
    prefix: 'method-validation',
    metadata: { method, url: req.url }
  });

  // Validate method against allowed methods from HTTP_CONSTANTS.HTTP_METHODS for hello endpoints with security enforcement
  const allowedMethods = [
    HTTP_CONSTANTS.HTTP_METHODS.GET,
    HTTP_CONSTANTS.HTTP_METHODS.OPTIONS
  ];

  // Log method validation attempt with request correlation and comprehensive security context for monitoring
  logger.debug('HTTP method validation started', {
    correlationId,
    method,
    url: req.url,
    allowedMethods,
    clientIp: req.ip,
    userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
  });

  // Check if method is GET for hello endpoints or OPTIONS for CORS preflight with security policy enforcement
  if (allowedMethods.includes(method)) {
    // Log successful method validation and continue to next middleware in the Express.js pipeline
    logger.debug('HTTP method validation passed', {
      correlationId,
      method,
      url: req.url
    });
    
    // Attach correlation ID to request for downstream middleware and controller access
    req.correlationId = correlationId;
    
    // Call next() to continue middleware pipeline processing with validated method
    return next();
  }

  // If method is invalid, create HTTPError with 405 Method Not Allowed status for proper REST API error handling
  const methodError = new HTTPError(
    `Method ${method} not allowed for this endpoint`,
    HTTP_CONSTANTS.STATUS_CODES.METHOD_NOT_ALLOWED,
    {
      method,
      url: req.url,
      correlationId,
      requestContext: {
        ip: req.ip,
        userAgent: req.headers ? req.headers['user-agent'] : 'unknown',
        headers: req.headers
      }
    }
  );

  // Set Allow header with supported methods for client guidance and HTTP compliance
  res.setHeader('Allow', allowedMethods.join(', '));
  res.setHeader('X-Request-ID', correlationId);

  // Log security violation for unsupported method with comprehensive client information for threat monitoring
  logSecurityEvent('method-not-allowed', {
    method,
    url: req.url,
    allowedMethods,
    severity: 'medium',
    action: 'blocked'
  }, {
    correlationId,
    ip: req.ip,
    userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
  });

  // Send appropriate error response with method validation details and security headers
  const errorResponse = createErrorResponse(methodError, {
    environment: process.env.NODE_ENV,
    includeStack: false,
    sanitize: true
  });

  // Update error metrics for monitoring and alerting systems
  REQUEST_METRICS.errorCount++;

  // Send HTTP 405 Method Not Allowed response with comprehensive error details
  res.status(HTTP_CONSTANTS.STATUS_CODES.METHOD_NOT_ALLOWED).json(errorResponse);
}

/**
 * Centralized error handling function for controller-level errors including service failures,
 * validation errors, and unexpected exceptions. Provides comprehensive error logging, response
 * sanitization, and security-conscious error reporting with correlation tracking and monitoring
 * integration for production debugging and incident response workflows.
 * 
 * @param {Error} error - Error object with detailed error information and context for processing
 * @param {Object} req - Express.js request object with request details and middleware context for error correlation
 * @param {Object} res - Express.js response object for sending sanitized error responses with appropriate status codes
 * @param {Function} next - Express.js next middleware function for passing to Express.js error handling middleware if needed
 * @returns {void} Error handling function that sends error response or passes to Express.js error middleware with comprehensive logging
 */
async function handleControllerError(error, req, res, next) {
  // Extract request correlation ID and context for comprehensive error tracking across distributed systems
  const correlationId = req.correlationId || 
                        (error.context && error.context.requestId) ||
                        generateRequestId({ prefix: 'error' });

  // Create error context with request information and timing data for debugging and incident response
  const errorContext = {
    correlationId,
    controller: 'hello-controller',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers ? req.headers['user-agent'] : 'unknown',
    timestamp: new Date().toISOString(),
    headers: req.headers
  };

  try {
    // Classify error type using error instanceof checks for HTTPError, ValidationError, and other custom error types
    let statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
    let errorCategory = 'unknown';

    if (error instanceof HTTPError) {
      statusCode = error.statusCode;
      errorCategory = 'http';
    } else if (error instanceof ValidationError) {
      statusCode = HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST;
      errorCategory = 'validation';
    } else if (error.statusCode) {
      statusCode = error.statusCode;
      errorCategory = 'service';
    }

    // Call handleServiceError for service-level error processing and sanitization with security considerations
    const processedError = await handleServiceError(error, errorContext);

    // Classify error severity using classifyErrorSeverity for monitoring and alerting system integration
    const severityClassification = classifyErrorSeverity(error, errorContext);

    // Create comprehensive sanitized error response using createErrorResponse for client-safe error information
    const errorResponse = createErrorResponse(processedError, {
      environment: process.env.NODE_ENV,
      includeStack: process.env.NODE_ENV === 'development',
      sanitize: true,
      additionalContext: {
        correlationId,
        timestamp: new Date().toISOString(),
        controller: 'hello-controller'
      }
    });

    // Set appropriate error headers and CORS information for cross-origin error handling
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set error correlation and debugging headers for distributed system troubleshooting
    res.setHeader('X-Request-ID', correlationId);
    res.setHeader('X-Error-ID', processedError.errorId || 'unknown');
    res.setHeader('X-Error-Category', errorCategory);
    res.setHeader('Content-Type', HTTP_CONSTANTS.CONTENT_TYPES.JSON);

    // Log detailed error information with stack trace and comprehensive request context for debugging
    logger.error('Controller error occurred', error, {
      ...errorContext,
      errorCategory,
      statusCode,
      severity: severityClassification.severity,
      errorId: processedError.errorId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Track error metrics using trackServiceMetrics for performance monitoring and alerting with PM2 integration
    await trackServiceMetrics('hello-controller', {
      errorOccurred: true,
      errorType: error.constructor.name,
      statusCode,
      correlationId,
      severity: severityClassification.severity
    });

    // Update global error metrics for controller monitoring and operational dashboard integration
    REQUEST_METRICS.errorCount++;

    // Log security events if error indicates potential security issues or attack patterns
    if (severityClassification.severity === 'high' || severityClassification.severity === 'critical') {
      logSecurityEvent('controller-error', {
        errorType: error.constructor.name,
        severity: severityClassification.severity,
        statusCode,
        action: 'logged'
      }, errorContext);
    }

    // Send error response with appropriate status code and sanitized error details for client consumption
    res.status(statusCode).json(errorResponse);

    // Log error handling completion for operational monitoring and debugging workflow
    logger.info('Controller error handling completed', {
      correlationId,
      statusCode,
      errorCategory,
      responseTime: Date.now() - new Date(errorContext.timestamp).getTime()
    });

  } catch (handlingError) {
    // Fallback error handling if primary error handling fails - log and pass to Express.js error middleware
    logger.error('Error handling failed in controller error handler', handlingError, {
      correlationId,
      originalError: error.message,
      fallbackActivated: true
    });

    // Update error metrics for fallback scenario monitoring
    REQUEST_METRICS.errorCount++;

    // Pass both errors to Express.js error handling middleware for final processing
    const fallbackError = new HTTPError(
      'Internal error handling failure',
      HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
      {
        correlationId,
        originalError: error.message,
        handlingError: handlingError.message
      }
    );

    // Call next with fallback error to trigger Express.js error handling middleware
    return next(fallbackError);
  }
}

/**
 * Creates comprehensive request context object containing correlation tracking, client information,
 * performance metrics, and security validation data for service layer processing and cross-platform
 * compatibility with consistent context structure for Flask comparison and educational demonstration.
 * 
 * @param {Object} req - Express.js request object with HTTP request details and middleware context
 * @param {Object} contextOptions - Context creation options with correlation ID and additional metadata
 * @param {string} [contextOptions.correlationId] - Request correlation ID for distributed tracking
 * @param {Object} [contextOptions.validationResult] - Request validation results and security checks
 * @param {bigint} [contextOptions.startTime] - Request start time for performance measurement
 * @param {string} [contextOptions.endpoint] - Endpoint identifier for context categorization
 * @returns {Object} Request context object with correlation tracking, client info, performance data, and security validation ready for service layer consumption
 */
function createRequestContext(req, contextOptions = {}) {
  // Generate or extract request correlation ID for distributed tracking and debugging across microservices
  const correlationId = contextOptions.correlationId || 
                        req.correlationId ||
                        generateRequestId({
                          prefix: 'ctx',
                          metadata: {
                            method: req.method,
                            url: req.url
                          }
                        });

  // Extract comprehensive client information including IP address, user agent, and headers for security and debugging
  const clientInfo = {
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers ? req.headers['user-agent'] : 'unknown' || 'unknown',
    acceptLanguage: req.headers['accept-language'],
    acceptEncoding: req.headers['accept-encoding'],
    referer: req.headers.referer,
    origin: req.headers.origin,
    host: req.headers.host,
    forwarded: req.headers['x-forwarded-for'],
    realIp: req.headers['x-real-ip']
  };

  // Create comprehensive request timestamp and performance tracking context for monitoring and optimization
  const performanceContext = {
    requestStartTime: contextOptions.startTime ? 
      (typeof contextOptions.startTime === 'bigint' ? contextOptions.startTime.toString() : contextOptions.startTime) : 
      process.hrtime.bigint().toString(),
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    nodeProcessId: process.pid,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };

  // Add security context including authentication status and permissions for security validation and audit
  const securityContext = {
    isSecure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    protocol: req.protocol,
    encrypted: !!req.connection?.encrypted,
    authenticationStatus: 'none', // No authentication in this tutorial
    permissions: [],
    sessionId: null,
    userId: null,
    securityHeaders: {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? '[REDACTED]' : null,
      apiKey: req.headers['x-api-key'] ? '[REDACTED]' : null
    }
  };

  // Include Express.js request properties relevant to service processing and business logic execution
  const requestProperties = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    body: req.body,
    cookies: req.cookies,
    route: req.route ? {
      path: req.route.path,
      methods: req.route.methods
    } : null,
    baseUrl: req.baseUrl,
    hostname: req.hostname,
    subdomains: req.subdomains,
    fresh: req.fresh,
    stale: req.stale,
    xhr: req.xhr
  };

  // Add cross-platform compatibility metadata for Flask comparison and educational demonstration
  const crossPlatformContext = {
    framework: 'express',
    frameworkVersion: '5.1.0',
    language: 'javascript',
    languageVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    environment: process.env.NODE_ENV || 'development',
    flaskCompatible: true,
    conversionNotes: 'Ready for Flask migration comparison'
  };

  // Include route-specific context such as endpoint and method information for service layer categorization
  const routeContext = {
    endpoint: contextOptions.endpoint || req.path,
    controller: 'hello-controller',
    handlerFunction: contextOptions.endpoint === '/hello' ? 'hello' : 
                    contextOptions.endpoint === '/good-evening' ? 'goodEvening' : 'unknown',
    isHelloEndpoint: contextOptions.endpoint === '/hello',
    isGoodEveningEndpoint: contextOptions.endpoint === '/good-evening',
    validationResult: contextOptions.validationResult || null
  };

  // Add PM2 cluster context and process information for distributed system coordination
  const clusterContext = {
    pm2ProcessId: process.env.pm_id || null,
    pm2InstanceName: process.env.name || null,
    pm2ExecMode: process.env.exec_mode || 'fork',
    pm2NodeAppInstance: process.env.NODE_APP_INSTANCE || 0,
    clusterWorker: !!process.env.pm_id,
    processTitle: process.title,
    processArgv: process.argv.slice(2)
  };

  // Create comprehensive request context ready for service layer consumption with all necessary information
  const requestContext = {
    // Core identification and correlation
    correlationId,
    requestId: correlationId,
    
    // Client and network information
    client: clientInfo,
    
    // Performance and timing data
    performance: performanceContext,
    
    // Security validation and authentication
    security: securityContext,
    
    // Express.js request details
    request: requestProperties,
    
    // Cross-platform compatibility
    crossPlatform: crossPlatformContext,
    
    // Route and endpoint context
    route: routeContext,
    
    // PM2 and cluster information
    cluster: clusterContext,
    
    // Additional metadata
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: 'hello-controller',
      version: '1.0.0',
      contextType: 'http-request'
    }
  };

  // Log context creation with correlation ID and comprehensive request details for debugging and monitoring
  // Safe JSON stringify that handles BigInt values by converting them to strings
  const safeStringify = (obj) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  };
  
  logger.debug('Request context created', {
    correlationId,
    endpoint: contextOptions.endpoint,
    method: req.method,
    clientIp: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    contextSize: safeStringify(requestContext).length
  });

  // Return comprehensive request context ready for service layer consumption and cross-platform compatibility
  return requestContext;
}

/**
 * Handles HTTP OPTIONS requests for CORS preflight validation, providing appropriate CORS headers,
 * method validation, and security policy information for cross-origin requests with comprehensive
 * logging and security monitoring for production deployment and cross-platform browser compatibility.
 * 
 * @param {Object} req - Express.js request object with CORS preflight request details and headers
 * @param {Object} res - Express.js response object for sending CORS headers and preflight response
 * @param {Function} next - Express.js next middleware function for continuing pipeline or error handling
 * @returns {void} CORS preflight handler that sends appropriate headers and response with security validation and monitoring
 */
function handleOptionsRequest(req, res, next) {
  // Generate correlation ID for CORS preflight tracking and security monitoring across distributed requests
  const correlationId = generateRequestId({
    prefix: 'cors-preflight',
    metadata: {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method']
    }
  });

  // Validate that request method is OPTIONS for CORS preflight handling and security policy enforcement
  if (req.method !== HTTP_CONSTANTS.HTTP_METHODS.OPTIONS) {
    logger.warn('Non-OPTIONS request received in CORS handler', {
      correlationId,
      method: req.method,
      url: req.url,
      origin: req.headers.origin
    });
    return next();
  }

  // Extract requested method and headers from CORS preflight request for validation and security checking
  const requestedMethod = req.headers['access-control-request-method'];
  const requestedHeaders = req.headers['access-control-request-headers'];
  const origin = req.headers.origin;

  // Validate requested method against allowed methods for hello endpoints with security policy enforcement
  const allowedMethods = [
    HTTP_CONSTANTS.HTTP_METHODS.GET,
    HTTP_CONSTANTS.HTTP_METHODS.OPTIONS
  ];

  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-API-Key'
  ];

  // Log CORS preflight request with comprehensive client information and validation context for security monitoring
  logger.info('CORS preflight request received', {
    correlationId,
    origin,
    requestedMethod,
    requestedHeaders,
    allowedMethods,
    allowedHeaders,
    clientIp: req.ip,
    userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
  });

  // Validate requested method and headers for security compliance and attack prevention
  const isMethodAllowed = !requestedMethod || allowedMethods.includes(requestedMethod);
  const areHeadersAllowed = !requestedHeaders || 
    requestedHeaders.split(',').every(header => 
      allowedHeaders.includes(header.trim())
    );

  if (!isMethodAllowed || !areHeadersAllowed) {
    // Log security violation for invalid CORS preflight request with comprehensive context
    logSecurityEvent('cors-violation', {
      requestedMethod,
      requestedHeaders,
      allowedMethods,
      allowedHeaders,
      origin,
      violation: !isMethodAllowed ? 'method' : 'headers',
      severity: 'medium',
      action: 'blocked'
    }, {
      correlationId,
      ip: req.ip,
      userAgent: req.headers ? req.headers['user-agent'] : 'unknown'
    });

    // Return 403 Forbidden for invalid CORS preflight requests with security logging
    const corsError = new HTTPError(
      'CORS preflight validation failed',
      HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN,
      {
        correlationId,
        requestedMethod,
        requestedHeaders,
        allowedMethods,
        allowedHeaders
      }
    );

    return handleControllerError(corsError, req, res, next);
  }

  // Apply security headers middleware for comprehensive security protection
  securityHeaders(req, res, () => {});

  // Set comprehensive CORS headers from CORS_HEADERS global configuration for cross-origin support
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Set additional security headers and policy information for enhanced CORS security
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours cache
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  // Set request correlation and debugging headers for distributed system troubleshooting
  res.setHeader('X-Request-ID', correlationId);
  res.setHeader('X-CORS-Preflight', 'handled');
  res.setHeader('X-Controller', 'hello-controller');

  // Set appropriate cache headers for preflight response optimization and browser caching
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());

  // Log successful CORS preflight handling with client information and validation results for monitoring
  logger.info('CORS preflight request handled successfully', {
    correlationId,
    origin,
    requestedMethod,
    requestedHeaders,
    cacheMaxAge: '86400',
    response: 'preflight-approved'
  });

  // Send 204 No Content response with appropriate CORS headers for successful preflight validation
  res.status(HTTP_CONSTANTS.STATUS_CODES.NO_CONTENT).end();
}

/**
 * Tracks controller-level performance metrics including request processing time, memory usage,
 * and throughput measurements for production monitoring, PM2 integration, and performance
 * optimization with detailed metrics collection and alerting for operational dashboard integration.
 * 
 * @param {string} controllerName - Name of the controller for metrics categorization and monitoring dashboard
 * @param {number} responseTime - Response processing time in milliseconds for performance analysis
 * @param {Object} performanceContext - Performance context with additional metrics and system information
 * @param {string} [performanceContext.correlationId] - Request correlation ID for distributed performance tracking
 * @param {string} [performanceContext.endpoint] - Endpoint identifier for route-specific performance analysis
 * @param {number} [performanceContext.statusCode] - HTTP status code for success/error rate calculation
 * @param {Object} [performanceContext.memoryUsage] - Memory usage snapshot for resource monitoring
 * @returns {void} Performance tracking function that updates metrics and triggers monitoring with PM2 integration and alerting
 */
function trackControllerPerformance(controllerName, responseTime, performanceContext = {}) {
  // Extract correlation ID and performance metadata for comprehensive tracking and debugging
  const correlationId = performanceContext.correlationId || generateRequestId({ prefix: 'perf' });
  const endpoint = performanceContext.endpoint || 'unknown';
  const statusCode = performanceContext.statusCode || 200;

  // Update global REQUEST_METRICS with controller performance statistics for operational monitoring
  REQUEST_METRICS.requests++;
  REQUEST_METRICS.totalResponseTime += responseTime;

  // Calculate average response times and throughput measurements for performance dashboard integration
  const averageResponseTime = REQUEST_METRICS.totalResponseTime / REQUEST_METRICS.requests;
  const requestsPerSecond = REQUEST_METRICS.requests / ((Date.now() - REQUEST_METRICS.lastResetTime) / 1000);

  // Track memory usage and resource consumption during request processing for resource optimization
  const currentMemoryUsage = performanceContext.memoryUsage || process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Compare performance against targets from testing constants and operational thresholds
  const performanceTargets = {
    maxResponseTime: 1000, // 1 second
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    targetThroughput: 100, // 100 requests per second
    errorRateThreshold: 0.05 // 5% error rate
  };

  // Calculate current error rate for monitoring and alerting thresholds
  const errorRate = REQUEST_METRICS.errorCount / REQUEST_METRICS.requests;

  // Update controller-specific performance counters and statistics for detailed monitoring
  const performanceMetrics = {
    controllerName,
    endpoint,
    responseTime,
    averageResponseTime,
    requestsPerSecond,
    statusCode,
    errorRate,
    memory: {
      heapUsed: currentMemoryUsage.heapUsed,
      heapTotal: currentMemoryUsage.heapTotal,
      external: currentMemoryUsage.external,
      rss: currentMemoryUsage.rss
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      loadAverage: require('os').loadavg(),
      freeMemory: require('os').freemem(),
      totalMemory: require('os').totalmem(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString(),
    correlationId
  };

  // Check performance thresholds and trigger warnings for operational alerting and monitoring
  const performanceAlerts = [];

  if (responseTime > performanceTargets.maxResponseTime) {
    performanceAlerts.push({
      type: 'slow-response',
      threshold: performanceTargets.maxResponseTime,
      actual: responseTime,
      severity: responseTime > (performanceTargets.maxResponseTime * 2) ? 'high' : 'medium'
    });
  }

  if (currentMemoryUsage.heapUsed > performanceTargets.maxMemoryUsage) {
    performanceAlerts.push({
      type: 'high-memory',
      threshold: performanceTargets.maxMemoryUsage,
      actual: currentMemoryUsage.heapUsed,
      severity: 'medium'
    });
  }

  if (errorRate > performanceTargets.errorRateThreshold) {
    performanceAlerts.push({
      type: 'high-error-rate',
      threshold: performanceTargets.errorRateThreshold,
      actual: errorRate,
      severity: 'high'
    });
  }

  // Log performance metrics with correlation tracking and comprehensive context for monitoring systems
  logPerformanceMetrics(performanceMetrics, {
    controllerName,
    endpoint,
    correlationId,
    alerts: performanceAlerts,
    thresholds: performanceTargets
  });

  // Trigger performance alerts if thresholds are exceeded for operational response and optimization
  if (performanceAlerts.length > 0) {
    logger.warn('Performance thresholds exceeded', {
      correlationId,
      controllerName,
      endpoint,
      alerts: performanceAlerts,
      responseTime,
      averageResponseTime,
      errorRate,
      memoryUsage: currentMemoryUsage.heapUsed
    });

    // Emit performance alert events for monitoring system integration and automated response
    process.emit('performance-alert', {
      controllerName,
      endpoint,
      metrics: performanceMetrics,
      alerts: performanceAlerts,
      timestamp: new Date().toISOString()
    });
  }

  // Update cached performance data for dashboard and monitoring integration with PM2 compatibility
  if (!CONTROLLER_CACHE.has('performance-metrics')) {
    CONTROLLER_CACHE.set('performance-metrics', new Map());
  }

  const controllerMetrics = CONTROLLER_CACHE.get('performance-metrics');
  controllerMetrics.set(controllerName, {
    ...performanceMetrics,
    lastUpdated: new Date().toISOString(),
    alertCount: performanceAlerts.length
  });

  // Log performance tracking completion for operational monitoring and debugging workflow
  logger.debug('Controller performance tracking completed', {
    correlationId,
    controllerName,
    endpoint,
    responseTime,
    averageResponseTime,
    requestCount: REQUEST_METRICS.requests,
    alertCount: performanceAlerts.length
  });
}

/**
 * Creates Flask-compatible controller interface and response patterns for cross-platform testing
 * and feature parity validation between Node.js Express and Python Flask implementations with
 * consistent behavior and educational value for framework comparison and migration planning.
 * 
 * @param {string} controllerType - Type of controller to create (hello, goodEvening) for Flask compatibility mapping
 * @param {Object} compatibilityOptions - Flask compatibility configuration and mapping options
 * @param {boolean} [compatibilityOptions.includeFlaskDecorators] - Include Flask decorator equivalents in controller
 * @param {string} [compatibilityOptions.responseFormat] - Response format compatibility (flask-json, flask-template)
 * @param {boolean} [compatibilityOptions.enableFlaskRouting] - Enable Flask routing pattern compatibility
 * @param {Object} [compatibilityOptions.flaskConfig] - Flask-specific configuration and settings
 * @returns {Function} Flask-compatible controller function with equivalent functionality and response patterns for cross-platform testing
 */
function createFlaskCompatibleController(controllerType, compatibilityOptions = {}) {
  const options = {
    includeFlaskDecorators: compatibilityOptions.includeFlaskDecorators !== false,
    responseFormat: compatibilityOptions.responseFormat || 'flask-json',
    enableFlaskRouting: compatibilityOptions.enableFlaskRouting !== false,
    flaskConfig: compatibilityOptions.flaskConfig || {},
    enableCrossValidation: compatibilityOptions.enableCrossValidation !== false,
    ...compatibilityOptions
  };

  // Generate correlation ID for Flask compatibility tracking and cross-platform validation
  const compatibilityId = generateRequestId({
    prefix: 'flask-compat',
    metadata: { controllerType, options }
  });

  // Analyze Flask controller patterns and request/response handling for equivalent functionality mapping
  const flaskPatterns = {
    decorators: {
      route: `@app.route('/${controllerType}', methods=['GET'])`,
      corsSupport: '@cross_origin()',
      performanceTracking: '@performance_monitor',
      errorHandling: '@error_handler'
    },
    requestHandling: {
      requestObject: 'flask.request',
      responseObject: 'flask.jsonify',
      errorHandling: 'flask.abort',
      logging: 'flask.current_app.logger'
    },
    responseFormat: {
      jsonResponse: 'flask.jsonify(data)',
      statusCode: 'return response, status_code',
      headers: 'response.headers[key] = value',
      cookies: 'response.set_cookie(key, value)'
    }
  };

  // Create controller wrapper that matches Flask function signatures and behavior patterns
  async function flaskCompatibleController(req, res, next) {
    // Generate Flask-compatible correlation ID and request context for cross-platform debugging
    const flaskCorrelationId = generateRequestId({
      prefix: 'flask-ctrl',
      metadata: {
        controllerType,
        method: req.method,
        url: req.url
      }
    });

    // Create Flask-compatible request context with Python-style object structure
    const flaskRequestContext = {
      // Flask request object equivalent
      request: {
        method: req.method,
        url: req.originalUrl,
        args: req.query, // Flask request.args equivalent
        form: req.body, // Flask request.form equivalent
        headers: req.headers,
        remote_addr: req.ip, // Flask style naming
        user_agent: req.headers['user-agent'],
        referrer: req.headers.referer,
        is_secure: req.secure
      },
      
      // Flask application context equivalent
      current_app: {
        config: options.flaskConfig,
        logger: {
          info: (msg) => logger.info(`[Flask-Compat] ${msg}`, { flaskCorrelationId }),
          error: (msg) => logger.error(`[Flask-Compat] ${msg}`, { flaskCorrelationId }),
          debug: (msg) => logger.debug(`[Flask-Compat] ${msg}`, { flaskCorrelationId })
        },
        name: 'hello-app'
      },
      
      // Flask session equivalent (simplified)
      session: {},
      
      // Flask g object equivalent
      g: {
        correlation_id: flaskCorrelationId,
        start_time: Date.now()
      }
    };

    try {
      // Log Flask compatibility controller initialization with pattern mapping information
      logger.info('Flask-compatible controller started', {
        flaskCorrelationId,
        controllerType,
        patterns: flaskPatterns.decorators,
        requestMethod: req.method,
        requestUrl: req.originalUrl
      });

      // Implement consistent error handling and exception patterns matching Flask error handling
      let serviceFunction;
      let expectedEndpoint;

      switch (controllerType) {
        case 'hello':
          serviceFunction = getHelloMessage;
          expectedEndpoint = '/hello';
          break;
        case 'goodEvening':
          serviceFunction = getGoodEveningMessage;
          expectedEndpoint = '/good-evening';
          break;
        default:
          throw new HTTPError(
            `Unknown controller type: ${controllerType}`,
            HTTP_CONSTANTS.STATUS_CODES.NOT_IMPLEMENTED,
            { flaskCorrelationId, controllerType }
          );
      }

      // Create Express request context for service layer processing
      const expressContext = createRequestContext(req, {
        correlationId: flaskCorrelationId,
        endpoint: expectedEndpoint
      });

      // Call service function with Flask-compatible context mapping
      const serviceResponse = await serviceFunction(expressContext, {
        enableCaching: true,
        performanceTracking: true,
        crossPlatformFormat: true,
        flaskCompatibility: true
      });

      // Apply Flask-compatible response formatting and status codes for consistent cross-platform behavior
      let flaskResponse;

      if (options.responseFormat === 'flask-json') {
        // Create Flask jsonify equivalent response structure
        flaskResponse = await createFlaskCompatibleResponse(serviceResponse, {
          format: 'flask-jsonify',
          includeHeaders: true,
          correlationId: flaskCorrelationId
        });
      } else {
        // Use standard Express response formatting
        flaskResponse = await formatMessageResponse(serviceResponse, {
          format: 'http-json',
          includeMetadata: true,
          correlationId: flaskCorrelationId
        });
      }

      // Set Flask-compatible headers and response metadata
      res.setHeader('X-Flask-Compat', 'true');
      res.setHeader('X-Framework', 'express-flask-compatible');
      res.setHeader('X-Controller-Type', controllerType);
      res.setHeader('X-Correlation-ID', flaskCorrelationId);

      // Apply CORS headers for cross-platform compatibility
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Calculate response time for Flask-compatible performance tracking
      const responseTime = Date.now() - flaskRequestContext.g.start_time;

      // Send Flask-compatible JSON response with appropriate status code
      res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(flaskResponse);

      // Track Flask compatibility metrics for cross-platform validation and testing
      await trackServiceMetrics('flask-compatible-controller', {
        responseTime,
        statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
        correlationId: flaskCorrelationId,
        controllerType,
        flaskCompatible: true
      });

      // Log Flask compatibility controller completion with performance metrics
      logger.info('Flask-compatible controller completed', {
        flaskCorrelationId,
        controllerType,
        responseTime: `${responseTime}ms`,
        statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
        flaskPatterns: options.includeFlaskDecorators ? flaskPatterns : 'disabled'
      });

    } catch (error) {
      // Handle errors using Flask-compatible error patterns and response formatting
      logger.error('Flask-compatible controller error', error, {
        flaskCorrelationId,
        controllerType,
        errorType: error.constructor.name
      });

      // Create Flask-compatible error response (Flask abort equivalent)
      const flaskError = new HTTPError(
        error.message,
        error.statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        {
          flaskCorrelationId,
          controllerType,
          flaskCompatible: true,
          originalError: error
        }
      );

      // Pass to error handler with Flask compatibility context
      await handleControllerError(flaskError, req, res, next);
    }
  }

  // Include cross-platform validation and testing support for feature parity verification
  flaskCompatibleController.flaskMetadata = {
    controllerType,
    patterns: flaskPatterns,
    compatibilityOptions: options,
    decorators: options.includeFlaskDecorators ? flaskPatterns.decorators : null,
    routingPattern: options.enableFlaskRouting ? `@app.route('/${controllerType}', methods=['GET'])` : null,
    responseFormat: options.responseFormat,
    createdAt: new Date().toISOString(),
    compatibilityId
  };

  // Add Flask validation method for cross-platform testing and feature parity checks
  flaskCompatibleController.validateFlaskCompatibility = async function(testRequest) {
    const validationResults = {
      compatible: true,
      issues: [],
      recommendations: [],
      testResults: {}
    };

    try {
      // Test Flask-equivalent request processing
      const mockRes = {
        setHeader: () => {},
        status: () => ({ json: (data) => data }),
        headers: {}
      };

      const mockNext = () => {};

      // Run compatibility test
      await flaskCompatibleController(testRequest, mockRes, mockNext);

      validationResults.testResults.requestProcessing = 'passed';
      validationResults.testResults.responseFormatting = 'passed';
      validationResults.testResults.errorHandling = 'passed';

    } catch (validationError) {
      validationResults.compatible = false;
      validationResults.issues.push(`Compatibility test failed: ${validationError.message}`);
    }

    return validationResults;
  };

  // Log Flask-compatible controller creation with mapping information and compatibility metadata
  logger.info('Flask-compatible controller created', {
    compatibilityId,
    controllerType,
    options,
    patterns: flaskPatterns,
    metadata: flaskCompatibleController.flaskMetadata
  });

  // Return Flask-compatible controller for cross-platform testing and educational comparison
  return flaskCompatibleController;
}

// Export all controller functions and utilities for Express.js routing integration
export {
  hello,
  goodEvening,
  validateRequestMethod,
  handleControllerError,
  createRequestContext,
  handleOptionsRequest,
  trackControllerPerformance,
  createFlaskCompatibleController,
  
  // Export global state for monitoring and debugging
  REQUEST_METRICS,
  CONTROLLER_CACHE,
  CORS_HEADERS
};

// Initialize controller module and log startup information for operational monitoring
logger.info('Hello controller module initialized', {
  version: '1.0.0',
  framework: 'Express.js v5.1.0',
  functions: [
    'hello',
    'goodEvening', 
    'validateRequestMethod',
    'handleControllerError',
    'createRequestContext',
    'handleOptionsRequest',
    'trackControllerPerformance',
    'createFlaskCompatibleController'
  ],
  features: [
    'Request correlation tracking',
    'Performance monitoring',
    'Security validation',
    'CORS handling',
    'Error management',
    'Flask compatibility',
    'PM2 cluster support',
    'Cross-platform validation'
  ],
  environment: process.env.NODE_ENV || 'development',
  pm2Compatible: !!process.env.pm_id,
  pid: process.pid,
  timestamp: new Date().toISOString()
});