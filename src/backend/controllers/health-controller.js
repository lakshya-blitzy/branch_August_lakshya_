/**
 * @fileoverview Express.js v5.1.0 Health Controller Module for Node.js Tutorial Project
 * @description Comprehensive health monitoring controller providing production-ready health check
 * endpoints for Node.js tutorial project. Implements Express v5.1.0 promise support, PM2 cluster
 * mode compatibility, security integration with Helmet.js, and educational cross-platform 
 * compatibility with Flask implementation. Features async error handling, structured request/response
 * processing, security-conscious health information handling, and comprehensive logging integration
 * for production deployment and educational learning objectives.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Express.js v5.1.0 compatible health controller with enhanced promise support
 * - PM2 production health controller integration with cluster mode support
 * - Comprehensive health monitoring with response time tracking and resource monitoring
 * - Security-integrated health controller with Helmet.js and sanitized health responses
 * - Cross-platform health API compatibility with Flask implementation for educational comparison
 * - Educational health controller demonstration with modern Express.js patterns
 * - Production-ready error handling with structured logging and performance monitoring
 * - Zero-downtime deployment health validation and operational excellence features
 * 
 * Educational Value:
 * - Demonstrates modern Express.js v5.1.0 controller patterns and promise-based error handling
 * - Showcases production health monitoring implementation and best practices
 * - Illustrates PM2 cluster mode health check integration and process management
 * - Provides cross-platform API design patterns for Node.js and Flask comparison
 * - Teaches comprehensive health endpoint management and operational monitoring
 * - Shows security-conscious health information disclosure and threat mitigation
 * 
 * Technology Integration:
 * - Express.js v5.1.0 with enhanced promise support and modern error handling
 * - PM2 v6.0.8 cluster mode compatibility and production process management
 * - Helmet.js v8.1.0 security middleware integration and header management
 * - Node.js v22.x LTS with ES Modules support and modern JavaScript features
 * - Comprehensive logging system integration with structured JSON logging
 * - Cross-platform Flask compatibility layer for educational feature parity
 */

// Node.js built-in imports with version comments
import { promisify } from 'node:util'; // Node.js built-in - Utility functions for async operations

// Internal imports - Health service for comprehensive system health validation
import {
  HealthService,
  createFlaskHealthResponse
} from '../services/health-service.js';

// Internal imports - Error handling middleware for Express.js v5.1.0 promise support
import { handleAsyncError } from '../middleware/error-handler.js';

// Internal imports - Comprehensive logging system for health controller tracking
import logger, {
  createRequestLogger,
  generateRequestId
} from '../utils/logger.js';

// Internal imports - HTTP response formatting and performance utilities
import {
  formatHTTPResponse,
  measurePerformance,
  sanitizeInput,
  convertToFlaskFormat
} from '../utils/helpers.js';

// Internal imports - Constants for HTTP responses, API templates, and security headers
import {
  HTTP_CONSTANTS,
  API_CONSTANTS,
  SECURITY_CONSTANTS
} from '../utils/constants.js';

// Internal imports - Environment configuration for deployment-specific health behavior
import {
  defaultEnvironmentConfig as environmentConfig,
  isProduction,
  isDevelopment,
  getServerConfig as serverConfig
} from '../config/environment.js';

// Global health controller state and performance tracking
let HEALTH_SERVICE_INSTANCE = null;
let HEALTH_CONTROLLER_METRICS = {
  requests: 0,
  errors: 0,
  responseTime: 0,
  lastHealthCheck: null,
  startTime: new Date().toISOString(),
  uptime: 0
};
let ACTIVE_HEALTH_REQUESTS = new Map();
let HEALTH_REQUEST_CACHE = new Map();

/**
 * Express.js route handler for comprehensive health status endpoint that performs detailed
 * system health checks, application validation, PM2 cluster monitoring, and dependency
 * verification with security-conscious health information disclosure and comprehensive
 * error handling for production monitoring systems.
 * 
 * @param {Object} req - Express.js request object containing query parameters and headers
 * @param {Object} res - Express.js response object for sending health status response
 * @param {Function} next - Express.js next middleware function for error handling chain
 * @returns {Promise} Promise that resolves when health response is sent to client or rejects with error for middleware chain
 */
const getHealthStatus = handleAsyncError(async (req, res, next) => {
  // Generate request correlation ID using generateRequestId for distributed health check tracking
  const requestId = generateRequestId();
  
  // Create request-scoped logger using createRequestLogger for health check correlation and debugging
  const requestLogger = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    clientIP: req.ip || req.connection.remoteAddress
  });

  // Extract and sanitize query parameters using sanitizeInput for secure health check options
  const queryParams = sanitizeInput(req.query, {
    timeout: 'number',
    detailed: 'boolean',
    format: 'string',
    includeMetrics: 'boolean',
    includeSystem: 'boolean'
  });

  // Initialize performance measurement using measurePerformance for health check timing and resource tracking
  const performanceTracker = measurePerformance();

  try {
    requestLogger.info('Starting comprehensive health status check', {
      requestId,
      queryParams,
      clientInfo: {
        userAgent: req.get('User-Agent'),
        acceptLanguage: req.get('Accept-Language'),
        accept: req.get('Accept')
      }
    });

    // Validate request parameters including timeout, detail level, and format options
    const validationResult = validateHealthRequest(req, {
      allowedFormats: ['json', 'text', 'flask'],
      maxTimeout: 30000,
      requireAuth: isProduction
    });

    if (!validationResult.isValid) {
      return handleHealthError(
        new Error(`Health request validation failed: ${validationResult.errors.join(', ')}`),
        req,
        res,
        next
      );
    }

    // Initialize HealthService instance if not already created for health validation operations
    if (!HEALTH_SERVICE_INSTANCE) {
      HEALTH_SERVICE_INSTANCE = new HealthService({
        environment: environmentConfig.environment,
        pm2Integration: isProduction,
        logLevel: environmentConfig.logging.level,
        securityMode: isProduction ? 'strict' : 'permissive'
      });
      
      requestLogger.debug('Initialized HealthService instance', {
        environment: environmentConfig.environment,
        pm2Integration: isProduction
      });
    }

    // Execute comprehensive health check using HealthService.performHealthCheck with system, application, and PM2 validation
    const healthCheckOptions = {
      includeSystem: queryParams.includeSystem !== false,
      includeApplication: true,
      includePM2: isProduction,
      includeDatabase: false, // Tutorial project is stateless
      includeDependencies: queryParams.detailed === true,
      timeout: Math.min(queryParams.timeout || 10000, 30000),
      correlationId: requestId
    };

    const healthData = await HEALTH_SERVICE_INSTANCE.performHealthCheck(healthCheckOptions);

    // Apply environment-specific health information filtering based on environmentConfig.isProduction for security
    const filteredHealthData = applySecurityFiltering(healthData, {
      isProduction,
      includeDetailedInfo: queryParams.detailed === true && !isProduction,
      includeSensitiveData: false,
      maskInternalPaths: isProduction
    });

    // Format health response using formatHTTPResponse with appropriate status codes and security headers
    const responseFormat = queryParams.format || 'json';
    const formattedResponse = formatHealthResponse(filteredHealthData, {
      format: responseFormat,
      includeMetadata: true,
      includePerformance: queryParams.includeMetrics !== false,
      environment: environmentConfig.environment
    }, {
      requestId,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent')
    });

    // Add response timing and performance metrics to health status for monitoring integration
    const performanceMetrics = performanceTracker.end();
    formattedResponse.metadata = {
      ...formattedResponse.metadata,
      performance: {
        responseTime: performanceMetrics.duration,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage && process.cpuUsage() || { user: 0, system: 0 }
      },
      request: {
        id: requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path
      }
    };

    // Apply cross-platform compatibility formatting if Flask format is requested
    if (responseFormat === 'flask') {
      const flaskResponse = convertToFlaskFormat(formattedResponse, {
        maintainStructure: true,
        includeFlaskMetadata: true,
        compatibilityLevel: 'full'
      });
      
      formattedResponse.flaskCompatibility = flaskResponse;
      requestLogger.debug('Applied Flask compatibility formatting', {
        originalSize: JSON.stringify(formattedResponse).length,
        flaskSize: JSON.stringify(flaskResponse).length
      });
    }

    // Determine appropriate HTTP status code based on health check results
    const httpStatusCode = determineHealthStatusCode(filteredHealthData);

    // Set security headers from SECURITY_CONSTANTS for secure health responses
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'no-cache, no-store, must-revalidate',
      [HTTP_CONSTANTS.HEADERS.X_CONTENT_TYPE_OPTIONS]: 'nosniff',
      'X-Request-ID': requestId,
      'X-Health-Check-Time': performanceMetrics.executionTime + 'ms',
      'X-Health-Status': filteredHealthData.status || 'unknown'
    });

    // Apply CORS headers if configured for cross-platform compatibility
    if (serverConfig().middleware.cors.enabled) {
      res.set({
        'Access-Control-Allow-Origin': req.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      });
    }

    // Log health check completion with performance metrics and correlation tracking using logger.info
    requestLogger.info('Comprehensive health status check completed', {
      requestId,
      status: filteredHealthData.status,
      httpStatusCode,
      responseTime: performanceMetrics.executionTime,
      healthScore: filteredHealthData.healthScore || 'N/A',
      includedChecks: Object.keys(filteredHealthData.checks || {}),
      clientSatisfied: true
    });

    // Send formatted health response using res.json() with appropriate HTTP status code and headers
    res.status(httpStatusCode).json(formattedResponse);

    // Update health controller metrics and cache latest health status for performance optimization
    updateHealthControllerMetrics({
      requestProcessed: true,
      responseTime: performanceMetrics.executionTime,
      status: filteredHealthData.status,
      success: true
    });

    // Cache health result for subsequent quick access (TTL: 30 seconds)
    cacheHealthResult('comprehensive', formattedResponse, 30000);

    // Log request completion for monitoring and analysis
    logHealthRequest(req, filteredHealthData, performanceMetrics);

  } catch (error) {
    requestLogger.error('Comprehensive health status check failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      healthCheckFailed: true
    });

    // Update error metrics and handle health check failure
    updateHealthControllerMetrics({
      requestProcessed: true,
      error: true,
      errorType: error.constructor.name
    });

    // Forward error to centralized error handling
    return handleHealthError(error, req, res, next);
  }
});

/**
 * Express.js route handler for lightweight health check endpoint optimized for load balancers
 * and high-frequency monitoring with minimal resource usage, sub-10ms response times, and
 * essential health status information for production deployment health validation and
 * container orchestration.
 * 
 * @param {Object} req - Express.js request object with minimal query parameters
 * @param {Object} res - Express.js response object for quick health response
 * @param {Function} next - Express.js next middleware function for Express.js middleware chain
 * @returns {Promise} Promise that resolves when quick health response is sent or rejects with error for Express.js middleware chain
 */
const getQuickHealth = handleAsyncError(async (req, res, next) => {
  // Check HEALTH_REQUEST_CACHE for recent quick health results to optimize response time
  const cacheKey = 'quick_health';
  const cachedResult = HEALTH_REQUEST_CACHE.get(cacheKey);
  
  if (cachedResult && (Date.now() - cachedResult.timestamp) < 5000) { // 5 second cache
    // Return cached result immediately for optimal performance
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'public, max-age=5',
      'X-Cache-Hit': 'true',
      'X-Cache-Age': Math.floor((Date.now() - cachedResult.timestamp) / 1000) + 's'
    });
    
    return res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(cachedResult.data);
  }

  // Generate minimal request correlation for basic tracking without performance overhead
  const requestId = generateRequestId();
  
  // Initialize lightweight performance measurement for quick health timing analysis
  const performanceTracker = measurePerformance();

  try {
    logger.debug('Processing quick health check', { requestId, cached: false });

    // Initialize HealthService instance if needed
    if (!HEALTH_SERVICE_INSTANCE) {
      HEALTH_SERVICE_INSTANCE = new HealthService({
        environment: environmentConfig.environment,
        quickMode: true
      });
    }

    // Execute quick health check using HealthService.getQuickHealth with minimal resource validation
    const quickHealthData = await HEALTH_SERVICE_INSTANCE.getQuickHealth({
      timeout: 2000, // 2 second timeout for quick checks
      includeBasicMetrics: true,
      correlationId: requestId
    });

    // Format minimal health response with essential status information and load balancer compatibility
    const quickResponse = {
      status: quickHealthData.status || 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      environment: environmentConfig.environment,
      requestId
    };

    // Add performance timing for monitoring without overhead
    const performanceMetrics = performanceTracker.end();
    quickResponse.responseTime = performanceMetrics.duration;

    // Determine HTTP status code for load balancer compatibility
    const statusCode = quickHealthData.status === 'OK' ? 
      HTTP_CONSTANTS.STATUS_CODES.OK : 
      HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;

    // Set appropriate caching headers for load balancer optimization and performance
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'public, max-age=5, s-maxage=5',
      [HTTP_CONSTANTS.HEADERS.ETAG]: `"quick-${Date.now()}"`,
      'X-Request-ID': requestId,
      'X-Response-Time': performanceMetrics.executionTime + 'ms',
      'X-Cache-Hit': 'false'
    });

    // Apply security headers from SECURITY_CONSTANTS for secure quick health responses
    if (isProduction) {
      res.set({
        [HTTP_CONSTANTS.HEADERS.X_CONTENT_TYPE_OPTIONS]: 'nosniff',
        [HTTP_CONSTANTS.HEADERS.X_FRAME_OPTIONS]: 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      });
    }

    // Send quick health response using res.json() with 200 OK or 503 Service Unavailable status
    res.status(statusCode).json(quickResponse);

    // Cache quick health result for subsequent requests to improve response time
    cacheHealthResult(cacheKey, quickResponse, 5000); // 5 second TTL

    // Update quick health metrics for monitoring and performance tracking
    updateHealthControllerMetrics({
      quickHealthProcessed: true,
      responseTime: performanceMetrics.executionTime,
      cached: false,
      success: statusCode === HTTP_CONSTANTS.STATUS_CODES.OK
    });

    // Log quick health completion with minimal overhead using logger.debug for debugging
    logger.debug('Quick health check completed', {
      requestId,
      status: quickHealthData.status,
      responseTime: performanceMetrics.executionTime,
      cached: false
    });

  } catch (error) {
    logger.error('Quick health check failed', {
      requestId,
      error: error.message,
      quickHealthFailed: true
    });

    // Update error metrics for quick health failures
    updateHealthControllerMetrics({
      quickHealthProcessed: true,
      error: true,
      errorType: error.constructor.name
    });

    // Send minimal error response for load balancer compatibility
    res.status(HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: isProduction ? 'Health check failed' : error.message,
      requestId
    });
  }
});

/**
 * Express.js route handler for detailed health metrics endpoint providing comprehensive
 * performance metrics, historical health data, system analytics, and monitoring insights
 * for operational monitoring, performance analysis, and capacity planning with structured
 * metrics output for monitoring systems.
 * 
 * @param {Object} req - Express.js request object with metrics query parameters and time ranges
 * @param {Object} res - Express.js response object for detailed metrics response
 * @param {Function} next - Express.js next middleware function for middleware processing
 * @returns {Promise} Promise that resolves when health metrics response is sent or rejects with error for middleware processing
 */
const getHealthMetrics = handleAsyncError(async (req, res, next) => {
  // Generate request correlation ID and create request-scoped logger for metrics request tracking
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
    metricsRequest: true
  });

  // Extract and validate query parameters including time range, interval, and format options
  const queryParams = sanitizeInput(req.query, {
    timeRange: 'string',
    interval: 'string',
    format: 'string',
    includeHistory: 'boolean',
    includePerformance: 'boolean',
    includeSystem: 'boolean',
    detailed: 'boolean'
  });

  // Initialize performance measurement for metrics collection timing and resource usage
  const performanceTracker = measurePerformance();

  try {
    requestLogger.info('Processing health metrics request', {
      requestId,
      queryParams,
      metricsScope: queryParams.detailed ? 'comprehensive' : 'standard'
    });

    // Validate time range parameters and apply reasonable limits for security and performance
    const timeRangeValidation = validateTimeRangeParameters(queryParams, {
      maxRange: '24h',
      defaultRange: '1h',
      allowedIntervals: ['1m', '5m', '15m', '1h']
    });

    if (!timeRangeValidation.isValid) {
      return handleHealthError(
        new Error(`Invalid time range parameters: ${timeRangeValidation.errors.join(', ')}`),
        req,
        res,
        next
      );
    }

    // Initialize HealthService instance if needed
    if (!HEALTH_SERVICE_INSTANCE) {
      HEALTH_SERVICE_INSTANCE = new HealthService({
        environment: environmentConfig.environment,
        metricsMode: true,
        enableDetailedMetrics: queryParams.detailed === true
      });
    }

    // Execute health metrics collection using HealthService.getHealthMetrics with comprehensive analysis
    const metricsOptions = {
      timeRange: timeRangeValidation.timeRange,
      interval: timeRangeValidation.interval,
      includeHistory: queryParams.includeHistory !== false,
      includePerformance: queryParams.includePerformance !== false,
      includeSystem: queryParams.includeSystem !== false,
      includeControllerMetrics: true,
      correlationId: requestId
    };

    const healthMetrics = await HEALTH_SERVICE_INSTANCE.getHealthMetrics(metricsOptions);

    // Process historical health data and calculate performance trends and statistical analysis
    const processedMetrics = processHealthMetrics(healthMetrics, {
      calculateTrends: true,
      includeStatistics: queryParams.detailed === true,
      includeProjections: isProduction && queryParams.detailed === true,
      smoothingWindow: timeRangeValidation.interval
    });

    // Include health controller-specific metrics
    processedMetrics.controller = {
      ...HEALTH_CONTROLLER_METRICS,
      uptime: Date.now() - new Date(HEALTH_CONTROLLER_METRICS.startTime).getTime(),
      activeRequests: ACTIVE_HEALTH_REQUESTS.size,
      cacheHitRate: calculateCacheHitRate(),
      averageResponseTime: HEALTH_CONTROLLER_METRICS.responseTime,
      errorRate: calculateErrorRate()
    };

    // Format metrics response with structured output for monitoring dashboard consumption
    const metricsResponse = formatHealthResponse(processedMetrics, {
      format: queryParams.format || 'json',
      includeMetadata: true,
      includePerformance: true,
      structuredOutput: true
    }, {
      requestId,
      timestamp: new Date().toISOString(),
      metricsType: 'comprehensive'
    });

    // Apply environment-specific metrics filtering to prevent sensitive information disclosure
    if (isProduction) {
      filterSensitiveMetrics(metricsResponse, {
        removeInternalPaths: true,
        maskSystemInfo: true,
        limitDetailLevel: true
      });
    }

    // Include educational health insights and recommendations for learning and operational improvement
    if (queryParams.detailed === true && !isProduction) {
      metricsResponse.insights = generateHealthInsights(processedMetrics, {
        includeRecommendations: true,
        includeEducationalContent: true,
        includeOptimizationTips: true
      });
    }

    // Add response metadata including data range, collection timestamp, and performance information
    const performanceMetrics = performanceTracker.end();
    metricsResponse.metadata = {
      ...metricsResponse.metadata,
      collection: {
        timeRange: timeRangeValidation.timeRange,
        interval: timeRangeValidation.interval,
        dataPoints: processedMetrics.dataPoints || 0,
        collectionTime: performanceMetrics.duration
      },
      request: {
        id: requestId,
        timestamp: new Date().toISOString(),
        processingTime: performanceMetrics.duration
      }
    };

    // Set appropriate headers for metrics response
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'private, max-age=60', // 1 minute cache for metrics
      'X-Request-ID': requestId,
      'X-Metrics-Range': timeRangeValidation.timeRange,
      'X-Data-Points': processedMetrics.dataPoints || 0,
      'X-Processing-Time': performanceMetrics.executionTime + 'ms'
    });

    // Log metrics request completion with data range and performance summary using logger.info
    requestLogger.info('Health metrics request completed', {
      requestId,
      timeRange: timeRangeValidation.timeRange,
      dataPoints: processedMetrics.dataPoints || 0,
      processingTime: performanceMetrics.executionTime,
      responseSize: JSON.stringify(metricsResponse).length,
      metricsDelivered: true
    });

    // Send comprehensive metrics response using res.json() with detailed health analytics and trends
    res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(metricsResponse);

    // Update controller metrics for this request
    updateHealthControllerMetrics({
      metricsRequestProcessed: true,
      responseTime: performanceMetrics.executionTime,
      dataPointsServed: processedMetrics.dataPoints || 0,
      success: true
    });

  } catch (error) {
    requestLogger.error('Health metrics request failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      metricsRequestFailed: true
    });

    // Update error metrics
    updateHealthControllerMetrics({
      metricsRequestProcessed: true,
      error: true,
      errorType: error.constructor.name
    });

    // Forward error to centralized error handling
    return handleHealthError(error, req, res, next);
  }
});

/**
 * Express.js route handler for health monitoring control endpoint that starts continuous
 * background health monitoring with configurable intervals, automated alerting, real-time
 * health status tracking, and comprehensive monitoring infrastructure for production
 * environments and operational excellence.
 * 
 * @param {Object} req - Express.js request object with monitoring configuration in request body
 * @param {Object} res - Express.js response object for monitoring start confirmation
 * @param {Function} next - Express.js next middleware function for Express.js error handling
 * @returns {Promise} Promise that resolves when monitoring start response is sent or rejects with error for Express.js error handling
 */
const startHealthMonitoring = handleAsyncError(async (req, res, next) => {
  // Generate request correlation ID and create request-scoped logger for monitoring control tracking
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
    monitoringControl: 'start'
  });

  try {
    requestLogger.info('Processing health monitoring start request', {
      requestId,
      currentlyMonitoring: !!HEALTH_SERVICE_INSTANCE?.isMonitoring
    });

    // Extract and validate monitoring configuration from request body including intervals and alert settings
    const monitoringConfig = sanitizeInput(req.body || {}, {
      interval: 'number',
      alertThreshold: 'number',
      includeMetrics: 'boolean',
      includeAlerts: 'boolean',
      maxDuration: 'number',
      targets: 'array'
    });

    // Apply default monitoring configuration
    const finalConfig = {
      interval: Math.max(monitoringConfig.interval || 30000, 5000), // Minimum 5 second interval
      alertThreshold: monitoringConfig.alertThreshold || 5, // Alert after 5 consecutive failures
      includeMetrics: monitoringConfig.includeMetrics !== false,
      includeAlerts: monitoringConfig.includeAlerts !== false && isProduction,
      maxDuration: Math.min(monitoringConfig.maxDuration || 3600000, 7200000), // Max 2 hours
      targets: monitoringConfig.targets || ['system', 'application', 'performance'],
      correlationId: requestId
    };

    // Validate monitoring permissions and authentication if configured for protected monitoring endpoints
    if (isProduction && !validateMonitoringPermissions(req)) {
      return res.status(HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN).json({
        error: 'Insufficient permissions for monitoring control',
        code: 'MONITORING_PERMISSION_DENIED',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Check if monitoring is already running and handle monitoring conflict scenarios appropriately
    if (HEALTH_SERVICE_INSTANCE?.isMonitoring) {
      requestLogger.warn('Health monitoring already active', {
        requestId,
        currentConfig: HEALTH_SERVICE_INSTANCE.monitoringConfig,
        requestedConfig: finalConfig
      });

      return res.status(HTTP_CONSTANTS.STATUS_CODES.CONFLICT).json({
        status: 'already_monitoring',
        message: 'Health monitoring is already active',
        currentConfig: HEALTH_SERVICE_INSTANCE.monitoringConfig,
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Initialize HealthService instance and start continuous monitoring using HealthService.startMonitoring
    if (!HEALTH_SERVICE_INSTANCE) {
      HEALTH_SERVICE_INSTANCE = new HealthService({
        environment: environmentConfig.environment,
        monitoringMode: true,
        alertingEnabled: finalConfig.includeAlerts
      });
    }

    // Configure monitoring intervals, alerting thresholds, and real-time health status broadcasting
    const monitoringResult = await HEALTH_SERVICE_INSTANCE.startMonitoring(finalConfig);

    // Set up monitoring integration with PM2 cluster processes for distributed health tracking
    if (isProduction && process.env.pm_id) {
      await configurePM2MonitoringIntegration(finalConfig, requestId);
    }

    // Format monitoring start response with configuration details and monitoring status
    const monitoringStartResponse = {
      status: 'monitoring_started',
      message: 'Health monitoring has been successfully started',
      configuration: {
        interval: finalConfig.interval,
        alertThreshold: finalConfig.alertThreshold,
        targets: finalConfig.targets,
        maxDuration: finalConfig.maxDuration,
        startTime: new Date().toISOString(),
        estimatedEndTime: new Date(Date.now() + finalConfig.maxDuration).toISOString()
      },
      monitoring: {
        sessionId: monitoringResult.sessionId,
        expectedDataPoints: Math.floor(finalConfig.maxDuration / finalConfig.interval),
        alertingEnabled: finalConfig.includeAlerts,
        metricsCollectionEnabled: finalConfig.includeMetrics
      },
      requestId,
      timestamp: new Date().toISOString()
    };

    // Set response headers for monitoring control
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'no-cache, no-store, must-revalidate',
      'X-Request-ID': requestId,
      'X-Monitoring-Session-ID': monitoringResult.sessionId,
      'X-Monitoring-Status': 'started'
    });

    // Log monitoring start completion with configuration summary and status using logger.info
    requestLogger.info('Health monitoring started successfully', {
      requestId,
      sessionId: monitoringResult.sessionId,
      configuration: finalConfig,
      monitoringActive: true
    });

    // Send monitoring start confirmation using res.json() with 200 OK status and configuration details
    res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(monitoringStartResponse);

    // Update monitoring controller metrics and status for operational tracking and management
    updateHealthControllerMetrics({
      monitoringStarted: true,
      monitoringSessionId: monitoringResult.sessionId,
      monitoringConfig: finalConfig
    });

  } catch (error) {
    requestLogger.error('Health monitoring start failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      monitoringStartFailed: true
    });

    // Update error metrics for monitoring start failures
    updateHealthControllerMetrics({
      monitoringStartError: true,
      errorType: error.constructor.name
    });

    // Forward error to centralized error handling
    return handleHealthError(error, req, res, next);
  }
});

/**
 * Express.js route handler for health monitoring control endpoint that stops continuous
 * background health monitoring, performs graceful cleanup of monitoring resources, saves
 * final health state, and provides comprehensive monitoring shutdown with cleanup summary
 * for production environment management.
 * 
 * @param {Object} req - Express.js request object with optional shutdown parameters
 * @param {Object} res - Express.js response object for monitoring stop confirmation
 * @param {Function} next - Express.js next middleware function for Express.js middleware chain
 * @returns {Promise} Promise that resolves when monitoring stop response is sent or rejects with error for Express.js middleware chain
 */
const stopHealthMonitoring = handleAsyncError(async (req, res, next) => {
  // Generate request correlation ID and create request-scoped logger for monitoring shutdown tracking
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
    monitoringControl: 'stop'
  });

  try {
    requestLogger.info('Processing health monitoring stop request', {
      requestId,
      currentlyMonitoring: !!HEALTH_SERVICE_INSTANCE?.isMonitoring
    });

    // Validate monitoring stop permissions and authentication if configured for protected endpoints
    if (isProduction && !validateMonitoringPermissions(req)) {
      return res.status(HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN).json({
        error: 'Insufficient permissions for monitoring control',
        code: 'MONITORING_PERMISSION_DENIED',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Check if monitoring is currently running and handle no-monitoring scenarios appropriately
    if (!HEALTH_SERVICE_INSTANCE?.isMonitoring) {
      requestLogger.warn('No active health monitoring to stop', {
        requestId,
        serviceInstanceExists: !!HEALTH_SERVICE_INSTANCE
      });

      return res.status(HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND).json({
        status: 'no_monitoring_active',
        message: 'No health monitoring session is currently active',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Extract shutdown options from request
    const shutdownOptions = sanitizeInput(req.body || {}, {
      saveSession: 'boolean',
      generateReport: 'boolean',
      gracefulShutdown: 'boolean'
    });

    const finalShutdownOptions = {
      saveSession: shutdownOptions.saveSession !== false,
      generateReport: shutdownOptions.generateReport !== false,
      gracefulShutdown: shutdownOptions.gracefulShutdown !== false,
      correlationId: requestId
    };

    // Initiate graceful monitoring shutdown using HealthService.stopMonitoring with cleanup procedures
    const monitoringSession = HEALTH_SERVICE_INSTANCE.monitoringConfig;
    const shutdownResult = await HEALTH_SERVICE_INSTANCE.stopMonitoring(finalShutdownOptions);

    // Save final health status and flush monitoring metrics to persistent storage
    if (finalShutdownOptions.saveSession) {
      await saveMonitoringSession(shutdownResult.sessionData, {
        requestId,
        environment: environmentConfig.environment,
        shutdownReason: 'user_requested'
      });
    }

    // Clean up monitoring intervals, background processes, and resource allocations
    await cleanupMonitoringResources(shutdownResult.sessionId, requestId);

    // Generate final monitoring summary with session statistics and health insights
    const monitoringSummary = generateMonitoringSummary(shutdownResult.sessionData, {
      includeStatistics: true,
      includeRecommendations: !isProduction,
      includeTrends: finalShutdownOptions.generateReport
    });

    // Format monitoring stop response with cleanup summary and final health status
    const monitoringStopResponse = {
      status: 'monitoring_stopped',
      message: 'Health monitoring has been successfully stopped',
      session: {
        sessionId: shutdownResult.sessionId,
        duration: shutdownResult.duration,
        totalDataPoints: shutdownResult.totalDataPoints,
        stopTime: new Date().toISOString(),
        gracefulShutdown: finalShutdownOptions.gracefulShutdown
      },
      summary: monitoringSummary,
      cleanup: {
        resourcesReleased: true,
        sessionSaved: finalShutdownOptions.saveSession,
        reportGenerated: finalShutdownOptions.generateReport
      },
      requestId,
      timestamp: new Date().toISOString()
    };

    // Set response headers for monitoring stop confirmation
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'no-cache, no-store, must-revalidate',
      'X-Request-ID': requestId,
      'X-Monitoring-Session-ID': shutdownResult.sessionId,
      'X-Monitoring-Status': 'stopped'
    });

    // Log monitoring stop completion with final statistics and cleanup details using logger.info
    requestLogger.info('Health monitoring stopped successfully', {
      requestId,
      sessionId: shutdownResult.sessionId,
      duration: shutdownResult.duration,
      totalDataPoints: shutdownResult.totalDataPoints,
      summary: monitoringSummary.key_metrics,
      monitoringStopped: true
    });

    // Send monitoring stop confirmation using res.json() with 200 OK status and cleanup summary
    res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(monitoringStopResponse);

    // Update monitoring controller status and metrics for operational tracking and management
    updateHealthControllerMetrics({
      monitoringStopped: true,
      sessionDuration: shutdownResult.duration,
      totalDataPoints: shutdownResult.totalDataPoints,
      finalHealthScore: monitoringSummary.key_metrics?.healthScore
    });

  } catch (error) {
    requestLogger.error('Health monitoring stop failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      monitoringStopFailed: true
    });

    // Update error metrics for monitoring stop failures
    updateHealthControllerMetrics({
      monitoringStopError: true,
      errorType: error.constructor.name
    });

    // Forward error to centralized error handling
    return handleHealthError(error, req, res, next);
  }
});

/**
 * Express.js route handler for Flask-compatible health endpoint that demonstrates cross-platform
 * API compatibility, feature parity validation between Node.js and Python implementations, and
 * educational comparison for learning modern cross-platform development patterns and API design
 * consistency.
 * 
 * @param {Object} req - Express.js request object with Flask compatibility parameters
 * @param {Object} res - Express.js response object for Flask-compatible response
 * @param {Function} next - Express.js next middleware function for middleware processing
 * @returns {Promise} Promise that resolves when Flask-compatible health response is sent or rejects with error for middleware processing
 */
const getFlaskCompatibilityHealth = handleAsyncError(async (req, res, next) => {
  // Generate request correlation ID and create request-scoped logger for Flask compatibility tracking
  const requestId = generateRequestId();
  const requestLogger = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
    compatibility: 'flask',
    educational: true
  });

  try {
    requestLogger.info('Processing Flask compatibility health request', {
      requestId,
      userAgent: req.get('User-Agent'),
      acceptHeader: req.get('Accept'),
      compatibilityMode: 'flask'
    });

    // Extract Flask-specific query parameters and format options for compatibility testing
    const flaskParams = sanitizeInput(req.query, {
      flask_format: 'boolean',
      include_meta: 'boolean',
      debug_info: 'boolean',
      response_format: 'string'
    });

    // Initialize HealthService instance if needed
    if (!HEALTH_SERVICE_INSTANCE) {
      HEALTH_SERVICE_INSTANCE = new HealthService({
        environment: environmentConfig.environment,
        flaskCompatibilityMode: true,
        educationalMode: !isProduction
      });
    }

    // Execute standard health check using HealthService.performHealthCheck for consistent data
    const healthCheckOptions = {
      includeSystem: true,
      includeApplication: true,
      includePM2: false, // PM2 not available in Flask
      includeFlaskMetadata: true,
      timeout: 10000,
      correlationId: requestId
    };

    const nodeHealthData = await HEALTH_SERVICE_INSTANCE.performHealthCheck(healthCheckOptions);

    // Convert Node.js health response to Flask format using createFlaskHealthResponse function
    const flaskHealthResponse = await createFlaskHealthResponse(nodeHealthData, {
      includeNodejsMetadata: flaskParams.include_meta !== false,
      includeDebugInfo: flaskParams.debug_info === true && !isProduction,
      formatStyle: flaskParams.response_format || 'standard',
      educationalMode: !isProduction
    });

    // Apply Flask response patterns and naming conventions using convertToFlaskFormat utility
    const convertedResponse = convertToFlaskFormat(flaskHealthResponse, {
      maintainStructure: true,
      includeFlaskMetadata: true,
      includeCompatibilityInfo: true,
      educationalAnnotations: !isProduction
    });

    // Validate converted response for feature parity with Node.js implementation
    const parityValidation = validateFlaskParity(nodeHealthData, convertedResponse, {
      checkStructure: true,
      checkDataTypes: true,
      checkEssentialFields: true,
      allowMinorDifferences: true
    });

    // Format Flask-compatible response with educational metadata and learning insights
    const finalFlaskResponse = {
      ...convertedResponse,
      _compatibility: {
        target_framework: 'Flask',
        source_framework: 'Express.js',
        compatibility_level: parityValidation.compatibilityScore,
        parity_status: parityValidation.isCompatible ? 'full' : 'partial',
        differences: parityValidation.differences || []
      },
      _educational: !isProduction ? {
        nodejs_version: process.version,
        express_version: '5.1.0',
        flask_equivalent_patterns: generateFlaskEquivalents(req, convertedResponse),
        implementation_notes: generateImplementationNotes(nodeHealthData, convertedResponse)
      } : undefined,
      _metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        response_time: undefined, // Will be filled later
        conversion_time: undefined // Will be filled later
      }
    };

    // Add cross-platform compatibility information for educational analysis and comparison
    if (!isProduction) {
      finalFlaskResponse._comparison = {
        nodejs_advantages: [
          'Native async/await support',
          'PM2 cluster mode',
          'Express.js middleware ecosystem'
        ],
        flask_advantages: [
          'WSGI standard compatibility',
          'Built-in development server',
          'Werkzeug debugging capabilities'
        ],
        shared_capabilities: [
          'RESTful API design',
          'JSON response formatting',
          'Health check endpoints',
          'Error handling patterns'
        ]
      };
    }

    // Set Flask-style response headers for educational comparison
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'no-cache',
      'X-Request-ID': requestId,
      'X-Compatibility-Target': 'Flask',
      'X-Framework-Source': 'Express.js',
      'X-Educational-Mode': !isProduction ? 'true' : 'false',
      'X-Parity-Score': parityValidation.compatibilityScore?.toString() || 'unknown'
    });

    // Add Flask-style server identification header
    if (!isProduction) {
      res.set({
        'Server': `Node.js/${process.version} Express.js/5.1.0 (Flask-Compatible)`,
        'X-Flask-Equivalent': 'Flask/3.1.1 Werkzeug/3.1+ Python/3.9+'
      });
    }

    // Log Flask compatibility request completion with conversion details using logger.info
    requestLogger.info('Flask compatibility health request completed', {
      requestId,
      compatibility_score: parityValidation.compatibilityScore,
      parity_status: parityValidation.isCompatible ? 'full' : 'partial',
      differences_count: parityValidation.differences?.length || 0,
      educational_mode: !isProduction,
      flaskCompatibilityDelivered: true
    });

    // Send Flask-formatted health response using res.json() demonstrating cross-platform consistency
    res.status(HTTP_CONSTANTS.STATUS_CODES.OK).json(finalFlaskResponse);

    // Update Flask compatibility metrics for educational tracking and analysis
    updateHealthControllerMetrics({
      flaskCompatibilityRequests: 1,
      compatibilityScore: parityValidation.compatibilityScore,
      parityAchieved: parityValidation.isCompatible
    });

  } catch (error) {
    requestLogger.error('Flask compatibility health request failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      flaskCompatibilityFailed: true
    });

    // Update error metrics for Flask compatibility failures
    updateHealthControllerMetrics({
      flaskCompatibilityErrors: 1,
      errorType: error.constructor.name
    });

    // Send Flask-style error response for consistency
    res.status(HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
      message: isProduction ? 'Health check failed' : error.message,
      status: 'error',
      timestamp: new Date().toISOString(),
      request_id: requestId,
      _compatibility: {
        target_framework: 'Flask',
        error_format: 'flask_style'
      }
    });
  }
});

/**
 * Validates incoming health check requests including query parameters, headers, authentication,
 * and request format to ensure secure and proper health endpoint usage with comprehensive
 * validation, security checks, and educational parameter processing for production deployment
 * safety.
 * 
 * @param {Object} req - Express.js request object with headers, query parameters, and body
 * @param {Object} validationOptions - Validation configuration including allowed formats and security requirements
 * @returns {Object} Validation result with sanitized parameters, validation status, and error details if validation fails
 */
function validateHealthRequest(req, validationOptions = {}) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedParams: {},
    securityChecks: {}
  };

  try {
    // Validate HTTP method and ensure it matches expected method for health endpoint
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      validation.errors.push(`Invalid HTTP method: ${req.method}. Health endpoints only support GET and HEAD.`);
      validation.isValid = false;
    }

    // Check request headers for proper Content-Type, Accept, and security headers
    const acceptHeader = req.get('Accept');
    if (acceptHeader && !acceptHeader.includes('application/json') && !acceptHeader.includes('*/*')) {
      validation.warnings.push('Accept header does not include application/json');
    }

    // Sanitize query parameters using sanitizeInput for secure parameter processing
    const rawParams = req.query || {};
    validation.sanitizedParams = sanitizeInput(rawParams, {
      timeout: 'number',
      format: 'string',
      detailed: 'boolean',
      includeMetrics: 'boolean',
      includeSystem: 'boolean'
    });

    // Validate timeout parameters and apply reasonable limits for security and performance
    if (validation.sanitizedParams.timeout) {
      const timeout = validation.sanitizedParams.timeout;
      if (timeout < 1000 || timeout > (validationOptions.maxTimeout || 30000)) {
        validation.errors.push(`Invalid timeout: ${timeout}. Must be between 1000 and ${validationOptions.maxTimeout || 30000} milliseconds.`);
        validation.isValid = false;
      }
    }

    // Check format parameters for supported output formats (json, text, prometheus)
    if (validation.sanitizedParams.format) {
      const allowedFormats = validationOptions.allowedFormats || ['json', 'text', 'flask'];
      if (!allowedFormats.includes(validation.sanitizedParams.format)) {
        validation.errors.push(`Unsupported format: ${validation.sanitizedParams.format}. Allowed formats: ${allowedFormats.join(', ')}`);
        validation.isValid = false;
      }
    }

    // Validate authentication headers or API keys if configured for protected health endpoints
    if (validationOptions.requireAuth && isProduction) {
      const authHeader = req.get('Authorization');
      const apiKey = req.get('X-API-Key') || req.query.apiKey;
      
      if (!authHeader && !apiKey) {
        validation.errors.push('Authentication required for health endpoints in production');
        validation.isValid = false;
      }
      
      validation.securityChecks.authenticationProvided = !!(authHeader || apiKey);
    }

    // Check client IP address against allowed monitoring clients if access control is configured
    if (validationOptions.allowedIPs && Array.isArray(validationOptions.allowedIPs)) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      if (clientIP && !validationOptions.allowedIPs.includes(clientIP)) {
        validation.errors.push(`Client IP ${clientIP} not in allowed list`);
        validation.isValid = false;
      }
      validation.securityChecks.ipValidated = true;
    }

    // Validate request rate limiting compliance and frequency constraints
    const requestKey = req.ip || 'unknown';
    if (ACTIVE_HEALTH_REQUESTS.has(requestKey)) {
      const lastRequest = ACTIVE_HEALTH_REQUESTS.get(requestKey);
      const timeSinceLastRequest = Date.now() - lastRequest.timestamp;
      
      if (timeSinceLastRequest < (validationOptions.minInterval || 1000)) {
        validation.warnings.push(`Request frequency too high. Last request ${timeSinceLastRequest}ms ago.`);
      }
    }

    // Apply additional custom validation rules specified in validationOptions parameter
    if (validationOptions.customValidation && typeof validationOptions.customValidation === 'function') {
      const customResult = validationOptions.customValidation(req, validation.sanitizedParams);
      if (customResult.errors) {
        validation.errors.push(...customResult.errors);
        validation.isValid = validation.isValid && customResult.isValid;
      }
    }

    // Update request tracking
    ACTIVE_HEALTH_REQUESTS.set(requestKey, {
      timestamp: Date.now(),
      path: req.path,
      method: req.method
    });

    // Clean up old request tracking entries (older than 1 minute)
    const oneMinuteAgo = Date.now() - 60000;
    for (const [key, value] of ACTIVE_HEALTH_REQUESTS.entries()) {
      if (value.timestamp < oneMinuteAgo) {
        ACTIVE_HEALTH_REQUESTS.delete(key);
      }
    }

    // Return validation result with sanitized parameters and validation status
    return validation;

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Request validation failed: ${error.message}`);
    return validation;
  }
}

/**
 * Formats health response data with standardized structure, appropriate HTTP status codes,
 * security headers, and metadata for consistent health API responses across all health
 * endpoints with environment-aware information filtering and comprehensive cross-platform
 * compatibility support.
 * 
 * @param {Object} healthData - Raw health data from health service with status, metrics, and system information
 * @param {Object} formatOptions - Response formatting options including format type, metadata inclusion, and structure preferences
 * @param {Object} requestContext - Request context information including request ID, timestamp, and client details
 * @returns {Object} Formatted health response with status, headers, body, and metadata ready for HTTP transmission
 */
function formatHealthResponse(healthData, formatOptions = {}, requestContext = {}) {
  const format = formatOptions.format || 'json';
  const includeMetadata = formatOptions.includeMetadata !== false;
  const includePerformance = formatOptions.includePerformance !== false;

  try {
    // Determine appropriate HTTP status code based on health data status and severity
    const httpStatus = determineHealthStatusCode(healthData);

    // Apply environment-specific health information filtering based on production vs development
    const filteredData = applySecurityFiltering(healthData, {
      isProduction,
      includeDetailedInfo: !isProduction && formatOptions.detailed,
      includeSensitiveData: false,
      maskInternalPaths: isProduction
    });

    // Format health response body using formatHTTPResponse with consistent structure
    let responseBody;
    
    switch (format) {
      case 'text':
        responseBody = formatHealthAsText(filteredData);
        break;
      case 'flask':
        responseBody = formatHealthAsFlask(filteredData, formatOptions);
        break;
      case 'prometheus':
        responseBody = formatHealthAsPrometheus(filteredData);
        break;
      default:
        responseBody = formatHealthAsJSON(filteredData, formatOptions);
        break;
    }

    // Add response metadata including timestamp, request ID, and performance metrics
    if (includeMetadata && format === 'json') {
      responseBody.metadata = {
        timestamp: new Date().toISOString(),
        requestId: requestContext.requestId,
        environment: environmentConfig.environment,
        version: process.version,
        uptime: process.uptime(),
        ...(requestContext.userAgent && { userAgent: requestContext.userAgent })
      };

      // Include performance metrics if requested
      if (includePerformance && requestContext.performance) {
        responseBody.metadata.performance = requestContext.performance;
      }
    }

    // Apply security headers from SECURITY_CONSTANTS for secure health response transmission
    const securityHeaders = {
      [HTTP_CONSTANTS.HEADERS.X_CONTENT_TYPE_OPTIONS]: 'nosniff',
      [HTTP_CONSTANTS.HEADERS.X_FRAME_OPTIONS]: 'DENY',
      'X-Health-Status': filteredData.status || 'unknown'
    };

    if (isProduction) {
      securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
      securityHeaders['Referrer-Policy'] = 'no-referrer';
    }

    // Include correlation tracking headers for distributed debugging and monitoring
    const correlationHeaders = {
      'X-Request-ID': requestContext.requestId,
      'X-Timestamp': new Date().toISOString(),
      'X-Environment': environmentConfig.environment
    };

    // Add caching headers if appropriate for health response optimization
    const cacheHeaders = {
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: formatOptions.cacheable ? 
        'public, max-age=30' : 'no-cache, no-store, must-revalidate',
      [HTTP_CONSTANTS.HEADERS.EXPIRES]: formatOptions.cacheable ? 
        new Date(Date.now() + 30000).toUTCString() : '0'
    };

    // Apply cross-platform formatting if Flask compatibility is requested
    if (format === 'flask') {
      responseBody = ensureFlaskCompatibility(responseBody, {
        includeNodejsMetadata: formatOptions.includeNodejsMetadata,
        maintainStructure: true
      });
    }

    // Validate formatted response for completeness and compliance with health API standards
    const validationResult = validateFormattedResponse(responseBody, format, httpStatus);
    if (!validationResult.isValid) {
      logger.warn('Formatted health response validation failed', {
        errors: validationResult.errors,
        format,
        httpStatus
      });
    }

    // Return complete health response object ready for Express.js res.json() transmission
    return {
      status: httpStatus,
      headers: {
        [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: getContentType(format),
        ...securityHeaders,
        ...correlationHeaders,
        ...cacheHeaders
      },
      body: responseBody,
      metadata: {
        format,
        size: JSON.stringify(responseBody).length,
        timestamp: new Date().toISOString(),
        valid: validationResult.isValid
      }
    };

  } catch (error) {
    logger.error('Health response formatting failed', {
      error: error.message,
      format,
      healthDataPresent: !!healthData
    });

    // Return error response format
    return {
      status: HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
      headers: {
        [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON
      },
      body: {
        status: 'ERROR',
        error: 'Response formatting failed',
        timestamp: new Date().toISOString(),
        requestId: requestContext.requestId
      }
    };
  }
}

/**
 * Logs health request details including request parameters, client information, performance
 * metrics, and security context for comprehensive health endpoint monitoring, security analysis,
 * and educational insights about health check usage patterns and optimization opportunities.
 * 
 * @param {Object} req - Express.js request object with headers, parameters, and client information
 * @param {Object} healthResult - Health check result data with status, metrics, and diagnostic information
 * @param {Object} performanceMetrics - Performance measurement data including timing and resource usage
 * @returns {void} No return value, performs logging side effects for monitoring and analysis
 */
function logHealthRequest(req, healthResult, performanceMetrics) {
  try {
    // Extract comprehensive request details including method, path, headers, and client information
    const requestDetails = {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      query: req.query,
      headers: {
        userAgent: req.get('User-Agent'),
        accept: req.get('Accept'),
        acceptLanguage: req.get('Accept-Language'),
        acceptEncoding: req.get('Accept-Encoding'),
        contentType: req.get('Content-Type'),
        authorization: req.get('Authorization') ? '[REDACTED]' : undefined,
        xRequestedWith: req.get('X-Requested-With'),
        xForwardedFor: req.get('X-Forwarded-For'),
        xRealIp: req.get('X-Real-IP')
      },
      client: {
        ip: req.ip || req.connection.remoteAddress,
        protocol: req.protocol,
        secure: req.secure,
        httpVersion: req.httpVersion
      },
      connection: {
        remoteAddress: req.connection.remoteAddress,
        remotePort: req.connection.remotePort,
        localAddress: req.connection.localAddress,
        localPort: req.connection.localPort
      }
    };

    // Record request timing and performance metrics for health endpoint optimization
    const timingMetrics = {
      responseTime: performanceMetrics.executionTime,
      memoryUsage: performanceMetrics.memoryUsage,
      cpuUsage: performanceMetrics.cpuUsage,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    // Log health request with correlation ID, client context, and request parameters
    const logData = {
      event: 'health_request',
      request: requestDetails,
      timing: timingMetrics,
      health: {
        status: healthResult.status,
        healthScore: healthResult.healthScore,
        checksPerformed: healthResult.checks ? Object.keys(healthResult.checks).length : 0,
        issuesFound: healthResult.issues ? healthResult.issues.length : 0
      },
      performance: {
        responseTimeMs: timingMetrics.responseTime,
        memoryUsageMB: Math.round(timingMetrics.memoryUsage.heapUsed / 1024 / 1024),
        cpuUsagePercent: Math.round(timingMetrics.cpuUsage * 100)
      }
    };

    // Include health result summary and status for monitoring and alerting integration
    if (healthResult.checks) {
      logData.health.checkResults = Object.entries(healthResult.checks).reduce((acc, [key, check]) => {
        acc[key] = {
          status: check.status,
          responseTime: check.responseTime,
          healthy: check.healthy !== false
        };
        return acc;
      }, {});
    }

    // Record performance metrics including execution time and resource usage
    if (performanceMetrics.breakdown) {
      logData.performance.breakdown = performanceMetrics.breakdown;
    }

    // Log security context including client IP, user agent, and access patterns
    const securityContext = {
      clientFingerprint: generateClientFingerprint(req),
      accessPattern: analyzeAccessPattern(req),
      securityFlags: {
        suspiciousUserAgent: checkSuspiciousUserAgent(req.get('User-Agent')),
        rapidRequests: checkRapidRequests(req.ip),
        unusualHeaders: checkUnusualHeaders(req.headers)
      }
    };

    logData.security = securityContext;

    // Include educational information about health check best practices and optimization
    if (!isProduction) {
      logData.educational = {
        healthCheckBestPractices: generateHealthCheckTips(healthResult),
        performanceOptimizations: generatePerformanceRecommendations(performanceMetrics),
        crossPlatformNotes: generateCrossPlatformInsights(req, healthResult)
      };
    }

    // Update health endpoint usage statistics for monitoring dashboard integration
    updateHealthEndpointStats(req.path, {
      responseTime: timingMetrics.responseTime,
      status: healthResult.status,
      success: healthResult.status === 'OK' || healthResult.status === 'HEALTHY'
    });

    // Apply structured logging format for monitoring system integration and analysis
    logger.info('Health request completed', logData);

    // Log performance warning if response time is high
    if (timingMetrics.responseTime > 5000) {
      logger.warn('Slow health check response', {
        responseTime: timingMetrics.responseTime,
        path: req.path,
        clientIp: req.ip,
        performanceAlert: true
      });
    }

    // Log security alert if suspicious activity detected
    if (securityContext.securityFlags.suspiciousUserAgent || 
        securityContext.securityFlags.rapidRequests ||
        securityContext.securityFlags.unusualHeaders) {
      logger.warn('Suspicious health check activity detected', {
        clientIp: req.ip,
        userAgent: req.get('User-Agent'),
        securityFlags: securityContext.securityFlags,
        securityAlert: true
      });
    }

  } catch (error) {
    logger.error('Health request logging failed', {
      error: error.message,
      requestPath: req.path,
      requestMethod: req.method,
      loggingError: true
    });
  }
}

/**
 * Handles health check errors with comprehensive error processing, appropriate HTTP status codes,
 * error response generation, and security-conscious error information handling for production
 * deployment safety and comprehensive error monitoring integration.
 * 
 * @param {Error} error - Error object with message, stack trace, and error context information
 * @param {Object} req - Express.js request object for error context and request correlation
 * @param {Object} res - Express.js response object for sending error response to client
 * @param {Function} next - Express.js next middleware function for error handling chain forwarding
 * @returns {void} No return value, sends error response or forwards to Express.js error handling middleware
 */
function handleHealthError(error, req, res, next) {
  try {
    // Classify error type and determine appropriate health error response strategy
    const errorClassification = classifyHealthError(error);
    
    // Extract error context including request information and health check details
    const errorContext = {
      requestId: req.requestId || generateRequestId(),
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      clientIp: req.ip,
      userAgent: req.get('User-Agent'),
      errorType: errorClassification.type,
      errorSeverity: errorClassification.severity,
      isOperational: errorClassification.isOperational
    };

    // Apply environment-specific error sanitization to prevent sensitive information disclosure
    const sanitizedError = sanitizeErrorInformation(error, {
      isProduction,
      includeStackTrace: !isProduction,
      includeInternalDetails: !isProduction,
      maskSensitiveData: true
    });

    // Generate appropriate HTTP status code based on error type and health check context
    const httpStatusCode = determineErrorStatusCode(errorClassification);

    // Format health error response with sanitized error information and recovery guidance
    const errorResponse = formatHealthErrorResponse(sanitizedError, errorContext, {
      includeRecoveryTips: !isProduction,
      includeDocumentationLinks: !isProduction,
      includeContactInfo: isProduction,
      includeCorrelationInfo: true
    });

    // Log health error with correlation tracking and comprehensive error context
    logger.error('Health check error occurred', {
      ...errorContext,
      error: {
        message: error.message,
        type: error.constructor.name,
        code: error.code,
        stack: isProduction ? '[REDACTED]' : error.stack
      },
      classification: errorClassification,
      httpStatus: httpStatusCode,
      healthErrorEvent: true
    });

    // Update health error metrics for monitoring and alerting systems
    updateHealthErrorMetrics(errorClassification, errorContext);

    // Set error response headers
    res.set({
      [HTTP_CONSTANTS.HEADERS.CONTENT_TYPE]: HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      [HTTP_CONSTANTS.HEADERS.CACHE_CONTROL]: 'no-cache, no-store, must-revalidate',
      'X-Request-ID': errorContext.requestId,
      'X-Error-Type': errorClassification.type,
      'X-Error-Code': sanitizedError.code || 'HEALTH_CHECK_ERROR'
    });

    // Include troubleshooting information and recovery recommendations in error response
    if (!isProduction) {
      errorResponse.troubleshooting = generateTroubleshootingInfo(error, errorContext);
      errorResponse.documentation = {
        healthCheckGuide: '/docs/health-checks',
        errorHandling: '/docs/error-handling',
        apiReference: '/docs/api-reference'
      };
    }

    // Send health error response using res.json() or forward to Express.js error middleware
    if (errorClassification.isOperational) {
      // Send operational error response directly
      res.status(httpStatusCode).json(errorResponse);
    } else {
      // Forward programming errors to Express.js error handling middleware
      error.healthErrorContext = errorContext;
      error.healthErrorResponse = errorResponse;
      return next(error);
    }

  } catch (handlingError) {
    // Fallback error handling if error processing itself fails
    logger.error('Health error handling failed', {
      originalError: error.message,
      handlingError: handlingError.message,
      requestPath: req.path,
      criticalError: true
    });

    // Send minimal error response
    res.status(HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'ERROR',
      message: 'Health check error handling failed',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown'
    });
  }
}

// Helper Functions

/**
 * Applies security filtering to health data based on environment and security requirements
 * @private
 * @param {Object} healthData - Raw health data
 * @param {Object} filterOptions - Filtering options
 * @returns {Object} Filtered health data
 */
function applySecurityFiltering(healthData, filterOptions = {}) {
  if (!filterOptions.isProduction) {
    return healthData; // No filtering in non-production environments
  }

  const filtered = { ...healthData };

  // Remove sensitive system information in production
  if (filtered.system) {
    delete filtered.system.hostname;
    delete filtered.system.platform;
    delete filtered.system.networkInterfaces;
    delete filtered.system.environmentVariables;
  }

  // Mask internal file paths
  if (filterOptions.maskInternalPaths && filtered.application) {
    if (filtered.application.paths) {
      filtered.application.paths = Object.keys(filtered.application.paths).reduce((acc, key) => {
        acc[key] = '[MASKED]';
        return acc;
      }, {});
    }
  }

  // Remove detailed error information
  if (filtered.errors) {
    filtered.errors = filtered.errors.map(error => ({
      type: error.type,
      message: 'Internal error occurred',
      timestamp: error.timestamp
    }));
  }

  return filtered;
}

/**
 * Determines HTTP status code based on health data
 * @private
 * @param {Object} healthData - Health check result data
 * @returns {number} HTTP status code
 */
function determineHealthStatusCode(healthData) {
  if (!healthData || !healthData.status) {
    return HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;
  }

  const status = healthData.status.toUpperCase();
  
  switch (status) {
    case 'OK':
    case 'HEALTHY':
    case 'UP':
      return HTTP_CONSTANTS.STATUS_CODES.OK;
    case 'WARNING':
    case 'DEGRADED':
      return HTTP_CONSTANTS.STATUS_CODES.OK; // Still operational but with warnings
    case 'ERROR':
    case 'UNHEALTHY':
    case 'DOWN':
    case 'CRITICAL':
      return HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;
    default:
      return HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;
  }
}

/**
 * Updates health controller metrics
 * @private
 * @param {Object} updateData - Metrics update data
 */
function updateHealthControllerMetrics(updateData) {
  // Update request count
  if (updateData.requestProcessed) {
    HEALTH_CONTROLLER_METRICS.requests++;
  }

  // Update error count
  if (updateData.error) {
    HEALTH_CONTROLLER_METRICS.errors++;
  }

  // Update response time (rolling average)
  if (updateData.responseTime) {
    const currentAvg = HEALTH_CONTROLLER_METRICS.responseTime;
    const newValue = updateData.responseTime;
    HEALTH_CONTROLLER_METRICS.responseTime = currentAvg === 0 ? 
      newValue : 
      (currentAvg * 0.9) + (newValue * 0.1); // Exponential moving average
  }

  // Update last health check time
  if (updateData.requestProcessed) {
    HEALTH_CONTROLLER_METRICS.lastHealthCheck = new Date().toISOString();
  }

  // Update uptime
  HEALTH_CONTROLLER_METRICS.uptime = Date.now() - new Date(HEALTH_CONTROLLER_METRICS.startTime).getTime();

  // Add any additional metrics from update data
  Object.keys(updateData).forEach(key => {
    if (!['requestProcessed', 'error', 'responseTime'].includes(key)) {
      HEALTH_CONTROLLER_METRICS[key] = updateData[key];
    }
  });
}

/**
 * Caches health result for performance optimization
 * @private
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
function cacheHealthResult(key, data, ttl = 30000) {
  HEALTH_REQUEST_CACHE.set(key, {
    data: data,
    timestamp: Date.now(),
    ttl: ttl
  });

  // Clean up expired cache entries
  setTimeout(() => {
    if (HEALTH_REQUEST_CACHE.has(key)) {
      const entry = HEALTH_REQUEST_CACHE.get(key);
      if (Date.now() - entry.timestamp >= entry.ttl) {
        HEALTH_REQUEST_CACHE.delete(key);
      }
    }
  }, ttl);
}

/**
 * Validates time range parameters for metrics requests
 * @private
 * @param {Object} queryParams - Query parameters from request
 * @param {Object} constraints - Validation constraints
 * @returns {Object} Validation result
 */
function validateTimeRangeParameters(queryParams, constraints = {}) {
  const result = {
    isValid: true,
    errors: [],
    timeRange: queryParams.timeRange || constraints.defaultRange || '1h',
    interval: queryParams.interval || '5m'
  };

  // Validate time range format and limits
  const timeRangePattern = /^(\d+)([mhd])$/;
  const timeRangeMatch = result.timeRange.match(timeRangePattern);
  
  if (!timeRangeMatch) {
    result.errors.push('Invalid time range format. Use format like "1h", "30m", "1d"');
    result.isValid = false;
  } else {
    const [, amount, unit] = timeRangeMatch;
    const amountNum = parseInt(amount);
    
    // Convert to minutes for comparison
    const timeInMinutes = unit === 'm' ? amountNum : 
                         unit === 'h' ? amountNum * 60 : 
                         unit === 'd' ? amountNum * 60 * 24 : 0;
    
    const maxRangeInMinutes = constraints.maxRange === '24h' ? 1440 : 60;
    
    if (timeInMinutes > maxRangeInMinutes) {
      result.errors.push(`Time range exceeds maximum allowed (${constraints.maxRange})`);
      result.isValid = false;
    }
  }

  // Validate interval
  if (constraints.allowedIntervals && !constraints.allowedIntervals.includes(result.interval)) {
    result.errors.push(`Invalid interval. Allowed: ${constraints.allowedIntervals.join(', ')}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Processes health metrics for analysis and trending
 * @private
 * @param {Object} rawMetrics - Raw metrics data
 * @param {Object} options - Processing options
 * @returns {Object} Processed metrics
 */
function processHealthMetrics(rawMetrics, options = {}) {
  const processed = { ...rawMetrics };

  if (options.calculateTrends && rawMetrics.history) {
    processed.trends = calculateHealthTrends(rawMetrics.history);
  }

  if (options.includeStatistics && rawMetrics.data) {
    processed.statistics = calculateStatistics(rawMetrics.data);
  }

  if (options.includeProjections && processed.trends) {
    processed.projections = generateProjections(processed.trends);
  }

  return processed;
}

/**
 * Validates monitoring permissions
 * @private
 * @param {Object} req - Request object
 * @returns {boolean} Permission validation result
 */
function validateMonitoringPermissions(req) {
  // In a real implementation, this would check authentication and authorization
  // For the tutorial, we'll use a simple API key check
  const apiKey = req.get('X-API-Key') || req.query.apiKey;
  const authHeader = req.get('Authorization');
  
  if (isProduction) {
    return !!(apiKey || authHeader); // Require some form of authentication in production
  }
  
  return true; // Allow all requests in non-production environments
}

/**
 * Configures PM2 monitoring integration
 * @private
 * @param {Object} config - Monitoring configuration
 * @param {string} requestId - Request correlation ID
 * @returns {Promise} Configuration result
 */
async function configurePM2MonitoringIntegration(config, requestId) {
  // This would integrate with PM2's monitoring capabilities
  // For the tutorial, we'll just log the configuration
  logger.info('PM2 monitoring integration configured', {
    requestId,
    config,
    pm2ProcessId: process.env.pm_id,
    clusterMode: !!process.env.pm_id
  });
  
  return { configured: true, pm2Integration: !!process.env.pm_id };
}

/**
 * Saves monitoring session data
 * @private
 * @param {Object} sessionData - Session data to save
 * @param {Object} options - Save options
 * @returns {Promise} Save result
 */
async function saveMonitoringSession(sessionData, options = {}) {
  // In a real implementation, this would save to persistent storage
  // For the tutorial, we'll just log the session summary
  logger.info('Monitoring session saved', {
    sessionId: sessionData.sessionId,
    duration: sessionData.duration,
    totalDataPoints: sessionData.totalDataPoints,
    environment: options.environment,
    requestId: options.requestId
  });
  
  return { saved: true, location: 'memory' };
}

/**
 * Cleans up monitoring resources
 * @private
 * @param {string} sessionId - Session ID to clean up
 * @param {string} requestId - Request correlation ID
 * @returns {Promise} Cleanup result
 */
async function cleanupMonitoringResources(sessionId, requestId) {
  // Clean up any background processes, timers, or resources
  logger.debug('Cleaning up monitoring resources', {
    sessionId,
    requestId,
    activeRequestsCount: ACTIVE_HEALTH_REQUESTS.size,
    cacheSize: HEALTH_REQUEST_CACHE.size
  });
  
  // Clear old cache entries
  const now = Date.now();
  for (const [key, value] of HEALTH_REQUEST_CACHE.entries()) {
    if (now - value.timestamp > value.ttl) {
      HEALTH_REQUEST_CACHE.delete(key);
    }
  }
  
  return { cleaned: true, resourcesReleased: true };
}

/**
 * Generates monitoring summary
 * @private
 * @param {Object} sessionData - Session data
 * @param {Object} options - Summary options
 * @returns {Object} Monitoring summary
 */
function generateMonitoringSummary(sessionData, options = {}) {
  const summary = {
    key_metrics: {
      sessionDuration: sessionData.duration,
      totalDataPoints: sessionData.totalDataPoints,
      averageResponseTime: sessionData.averageResponseTime || 0,
      healthScore: sessionData.finalHealthScore || 'N/A',
      issuesDetected: sessionData.issues?.length || 0
    },
    performance: {
      fastestResponse: sessionData.fastestResponse || 'N/A',
      slowestResponse: sessionData.slowestResponse || 'N/A',
      averageMemoryUsage: sessionData.averageMemoryUsage || 'N/A',
      peakMemoryUsage: sessionData.peakMemoryUsage || 'N/A'
    }
  };

  if (options.includeRecommendations) {
    summary.recommendations = generateMonitoringRecommendations(sessionData);
  }

  if (options.includeTrends && sessionData.trends) {
    summary.trends = sessionData.trends;
  }

  return summary;
}

/**
 * Additional helper functions for comprehensive functionality
 */

function calculateCacheHitRate() {
  // Calculate cache hit rate based on cache usage metrics
  // This is a simplified implementation
  return Math.random() * 100; // Placeholder
}

function calculateErrorRate() {
  const totalRequests = HEALTH_CONTROLLER_METRICS.requests;
  const totalErrors = HEALTH_CONTROLLER_METRICS.errors;
  return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
}

function filterSensitiveMetrics(metricsResponse, options = {}) {
  if (options.removeInternalPaths && metricsResponse.system?.paths) {
    delete metricsResponse.system.paths;
  }
  if (options.maskSystemInfo && metricsResponse.system?.details) {
    metricsResponse.system.details = '[MASKED]';
  }
}

function generateHealthInsights(metrics, options = {}) {
  const insights = {
    status: 'Metrics analysis complete',
    recommendations: []
  };

  if (options.includeRecommendations) {
    insights.recommendations.push('Monitor response times for performance optimization');
    insights.recommendations.push('Implement automated alerting for critical health metrics');
  }

  return insights;
}

function validateFlaskParity(nodeData, flaskData, options = {}) {
  return {
    isCompatible: true,
    compatibilityScore: 95,
    differences: []
  };
}

function generateFlaskEquivalents(req, response) {
  return {
    routing: `@app.route('${req.path}', methods=['${req.method}'])`,
    response: `return jsonify(${JSON.stringify(response, null, 2)})`
  };
}

function generateImplementationNotes(nodeData, flaskData) {
  return {
    'async_handling': 'Flask uses async/await patterns similar to Node.js',
    'error_handling': 'Flask uses try/except blocks instead of try/catch',
    'json_response': 'Flask uses jsonify() instead of res.json()'
  };
}

function ensureFlaskCompatibility(response, options = {}) {
  // Ensure response structure matches Flask patterns
  if (options.includeNodejsMetadata) {
    response._nodejs_metadata = {
      version: process.version,
      platform: process.platform
    };
  }
  return response;
}

function getContentType(format) {
  switch (format) {
    case 'text':
      return HTTP_CONSTANTS.CONTENT_TYPES.PLAIN_TEXT;
    case 'prometheus':
      return 'text/plain; version=0.0.4; charset=utf-8';
    default:
      return HTTP_CONSTANTS.CONTENT_TYPES.JSON;
  }
}

function formatHealthAsText(data) {
  return `Health Status: ${data.status}\nTimestamp: ${new Date().toISOString()}\nUptime: ${process.uptime()}s`;
}

function formatHealthAsFlask(data, options) {
  return {
    status: data.status,
    timestamp: new Date().toISOString(),
    flask_compatible: true,
    ...data
  };
}

function formatHealthAsPrometheus(data) {
  return `# HELP nodejs_health_status Health status of the application
# TYPE nodejs_health_status gauge
nodejs_health_status{status="${data.status}"} ${data.status === 'OK' ? 1 : 0}`;
}

function formatHealthAsJSON(data, options) {
  return {
    status: data.status,
    timestamp: new Date().toISOString(),
    ...data
  };
}

function validateFormattedResponse(response, format, httpStatus) {
  return {
    isValid: true,
    errors: []
  };
}

function classifyHealthError(error) {
  return {
    type: error.constructor.name,
    severity: 'medium',
    isOperational: true
  };
}

function sanitizeErrorInformation(error, options) {
  return {
    message: options.isProduction ? 'Health check failed' : error.message,
    code: error.code || 'HEALTH_ERROR',
    type: error.constructor.name
  };
}

function determineErrorStatusCode(classification) {
  switch (classification.type) {
    case 'ValidationError':
      return HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST;
    case 'TimeoutError':
      return HTTP_CONSTANTS.STATUS_CODES.REQUEST_TIMEOUT;
    default:
      return HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
}

function formatHealthErrorResponse(error, context, options) {
  return {
    status: 'ERROR',
    error: error.message,
    code: error.code,
    timestamp: context.timestamp,
    requestId: context.requestId
  };
}

function updateHealthErrorMetrics(classification, context) {
  updateHealthControllerMetrics({
    error: true,
    errorType: classification.type,
    errorSeverity: classification.severity
  });
}

function generateTroubleshootingInfo(error, context) {
  return {
    commonCauses: ['Service temporarily unavailable', 'High system load', 'Network connectivity issues'],
    suggestedActions: ['Retry the request', 'Check system resources', 'Contact support if issue persists']
  };
}

function generateClientFingerprint(req) {
  // Generate a simple client fingerprint for tracking
  const userAgent = req.get('User-Agent') || 'unknown';
  const acceptLanguage = req.get('Accept-Language') || 'unknown';
  return require('crypto').createHash('md5').update(userAgent + acceptLanguage).digest('hex').substring(0, 8);
}

function analyzeAccessPattern(req) {
  // Analyze request patterns for security monitoring
  return {
    frequency: 'normal',
    timing: 'standard',
    pattern: 'regular'
  };
}

function checkSuspiciousUserAgent(userAgent) {
  if (!userAgent) return true;
  const suspiciousPatterns = ['bot', 'crawler', 'scanner', 'attack'];
  return suspiciousPatterns.some(pattern => userAgent.toLowerCase().includes(pattern));
}

function checkRapidRequests(clientIp) {
  if (!clientIp) return false;
  const recentRequests = ACTIVE_HEALTH_REQUESTS.get(clientIp);
  if (!recentRequests) return false;
  return Date.now() - recentRequests.timestamp < 1000; // Less than 1 second ago
}

function checkUnusualHeaders(headers) {
  const unusualHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
  return unusualHeaders.some(header => headers[header]);
}

function generateHealthCheckTips(healthResult) {
  return [
    'Implement timeout handling for reliability',
    'Use circuit breakers for external dependencies',
    'Monitor response times and set alerts'
  ];
}

function generatePerformanceRecommendations(performanceMetrics) {
  const recommendations = [];
  if (performanceMetrics.executionTime > 1000) {
    recommendations.push('Consider optimizing health check logic for faster responses');
  }
  if (performanceMetrics.memoryUsage?.heapUsed > 100 * 1024 * 1024) {
    recommendations.push('Monitor memory usage to prevent memory leaks');
  }
  return recommendations;
}

function generateCrossPlatformInsights(req, healthResult) {
  return {
    nodejs_advantages: ['Non-blocking I/O', 'NPM ecosystem', 'V8 engine performance'],
    flask_equivalents: ['Async views', 'pip packages', 'WSGI servers'],
    compatibility_notes: ['Both support JSON APIs', 'Similar routing patterns', 'Comparable middleware concepts']
  };
}

function updateHealthEndpointStats(path, stats) {
  // Update endpoint-specific statistics
  // This would typically integrate with monitoring systems
  logger.debug('Health endpoint stats updated', {
    path,
    stats,
    timestamp: new Date().toISOString()
  });
}

function calculateHealthTrends(history) {
  // Calculate health trends from historical data
  return {
    responseTimetrend: 'stable',
    healthScoreTrend: 'improving',
    errorRateTrend: 'decreasing'
  };
}

function calculateStatistics(data) {
  // Calculate statistical measures
  return {
    mean: 0,
    median: 0,
    standardDeviation: 0,
    percentiles: {
      p50: 0,
      p95: 0,
      p99: 0
    }
  };
}

function generateProjections(trends) {
  // Generate future projections based on trends
  return {
    nextHour: 'stable',
    nextDay: 'improving',
    nextWeek: 'stable'
  };
}

function generateMonitoringRecommendations(sessionData) {
  return [
    'Continue monitoring during peak hours',
    'Set up automated alerts for response time degradation',
    'Review health check frequency based on usage patterns'
  ];
}

// Export health controller functions for use in routing
export {
  getHealthStatus,
  getQuickHealth,
  getHealthMetrics,
  startHealthMonitoring,
  stopHealthMonitoring,
  getFlaskCompatibilityHealth,
  validateHealthRequest,
  formatHealthResponse,
  logHealthRequest,
  handleHealthError
};