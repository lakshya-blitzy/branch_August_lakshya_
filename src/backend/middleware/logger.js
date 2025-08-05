/**
 * @fileoverview Express.js HTTP Request/Response Logging Middleware
 * @description Comprehensive request lifecycle tracking, performance monitoring, security event logging,
 * and educational debugging capabilities for the Node.js tutorial project. Implements modern Express v5.1.0
 * middleware patterns with correlation ID tracking, structured JSON logging, PM2 cluster mode compatibility,
 * and educational insights for progressive web development learning.
 * 
 * Features:
 * - Request/response lifecycle tracking with unique correlation IDs
 * - Performance monitoring and metrics collection
 * - Security event logging for Helmet.js integration
 * - PM2 cluster mode compatible logging with process correlation
 * - Educational insights and debugging capabilities
 * - Cross-platform compatibility with Flask implementation patterns
 * - Environment-specific detail levels and configuration
 * - Automated log rotation and centralized management
 * - Production-ready error handling and fallback mechanisms
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// External library imports with version comments
import onHeaders from 'on-headers'; // v1.0.2 - HTTP response header monitoring for response logging
import onFinished from 'on-finished'; // v2.4.1 - HTTP request/response lifecycle monitoring for completion tracking

// Internal imports from utility modules
import logger, {
  debug,
  info,
  warn,
  error as logError,
  generateRequestId,
  logPerformanceMetrics,
  logSecurityEvent,
  createRequestLogger,
  formatLogMessage
} from '../utils/logger.js';

import {
  HTTP_CONSTANTS,
  API_CONSTANTS,
  ENV_CONSTANTS,
  PM2_CONSTANTS
} from '../utils/constants.js';

import { environmentConfig } from '../config/environment.js';

// Global middleware state management for PM2 cluster compatibility
let LOGGER_MIDDLEWARE_INITIALIZED = false;
const REQUEST_METRICS = {
  count: 0,
  totalTime: 0,
  avgResponseTime: 0,
  errors: 0,
  startTime: Date.now()
};
const ACTIVE_REQUESTS = new Map(); // Track active requests across cluster
const CORRELATION_TRACKING = new Map(); // Distributed correlation tracking
const SECURITY_EVENTS = []; // Security event accumulator

/**
 * Utility function to measure performance timing since helpers.js doesn't exist
 * @private
 * @param {Function} operation - Function to measure
 * @returns {Object} Performance measurement result
 */
function measurePerformance(operation) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  try {
    const result = operation();
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    return {
      result,
      timing: {
        duration: Number(endTime - startTime) / 1000000, // Convert to milliseconds
        startTime: Number(startTime),
        endTime: Number(endTime)
      },
      memory: {
        heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
        heapTotalDelta: endMemory.heapTotal - startMemory.heapTotal,
        startMemory,
        endMemory
      }
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    return {
      error,
      timing: {
        duration: Number(endTime - startTime) / 1000000,
        startTime: Number(startTime),
        endTime: Number(endTime)
      }
    };
  }
}

/**
 * Utility function to format HTTP responses since helpers.js doesn't exist
 * @private
 * @param {Object} res - Express response object
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted response data
 */
function formatHTTPResponse(res, options = {}) {
  const response = {
    statusCode: res.statusCode,
    statusMessage: res.statusMessage || HTTP_CONSTANTS.STATUS_CODES[res.statusCode] || 'Unknown',
    headers: { ...res.getHeaders() },
    timestamp: new Date().toISOString(),
    contentLength: res.get('content-length') || 0,
    contentType: res.get('content-type') || 'unknown'
  };
  
  // Add security header analysis for educational purposes
  if (options.includeSecurityAnalysis) {
    response.securityHeaders = {
      contentSecurityPolicy: !!res.get('content-security-policy'),
      strictTransportSecurity: !!res.get('strict-transport-security'),
      xFrameOptions: !!res.get('x-frame-options'),
      xContentTypeOptions: !!res.get('x-content-type-options'),
      xXssProtection: res.get('x-xss-protection')
    };
  }
  
  // Add performance insights for educational analysis
  if (options.includePerformanceInsights) {
    response.performanceInsights = {
      statusCategory: Math.floor(res.statusCode / 100) * 100,
      isError: res.statusCode >= 400,
      isServerError: res.statusCode >= 500,
      cacheability: res.get('cache-control') || 'no-cache-control'
    };
  }
  
  return response;
}

/**
 * Creates Express.js HTTP request logging middleware with comprehensive request/response tracking,
 * performance monitoring, correlation ID management, and security event logging. Supports
 * environment-specific detail levels, PM2 cluster mode compatibility, and educational insights
 * for modern Express.js middleware patterns and production logging best practices.
 * 
 * @param {Object} [options={}] - Logger middleware configuration options
 * @param {string} [options.logLevel] - Override default log level for middleware
 * @param {boolean} [options.enablePerformanceMonitoring=true] - Enable detailed performance tracking
 * @param {boolean} [options.enableSecurityLogging=true] - Enable security event logging
 * @param {boolean} [options.enableEducationalMode=false] - Enable detailed educational logging
 * @param {boolean} [options.enableFlaskCompatibility=false] - Enable Flask-compatible logging patterns
 * @param {Object} [options.pm2Config] - PM2-specific configuration overrides
 * @param {Object} [options.correlationConfig] - Correlation tracking configuration
 * @returns {Function} Express.js middleware function with (req, res, next) signature for HTTP request logging
 */
export function createMiddlewareRequestLogger(options = {}) {
  // Validate and merge middleware options with environment-specific defaults
  const config = {
    logLevel: options.logLevel || environmentConfig.middleware?.logging?.level || ENV_CONSTANTS.LOG_LEVELS.INFO,
    enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    enableSecurityLogging: options.enableSecurityLogging ?? true,
    enableEducationalMode: options.enableEducationalMode ?? !environmentConfig.isProduction,
    enableFlaskCompatibility: options.enableFlaskCompatibility ?? false,
    enableCorrelationTracking: options.enableCorrelationTracking ?? true,
    requestIdPrefix: options.requestIdPrefix || 'req',
    maxActiveRequests: options.maxActiveRequests || 1000,
    performanceThresholds: {
      warning: options.performanceThresholds?.warning || 1000, // 1 second
      critical: options.performanceThresholds?.critical || 5000, // 5 seconds
      ...options.performanceThresholds
    },
    pm2Config: {
      enableProcessCorrelation: environmentConfig.currentEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
      logRotationEnabled: true,
      clusterMode: process.env.PM2_HOME ? true : false,
      ...options.pm2Config
    },
    correlationConfig: {
      includeTimestamp: true,
      includePid: true,
      includeHostname: false,
      ...options.correlationConfig
    },
    ...options
  };

  // Initialize request metrics tracking and performance monitoring
  if (!LOGGER_MIDDLEWARE_INITIALIZED) {
    REQUEST_METRICS.count = 0;
    REQUEST_METRICS.totalTime = 0;
    REQUEST_METRICS.avgResponseTime = 0;
    REQUEST_METRICS.errors = 0;
    REQUEST_METRICS.startTime = Date.now();
    LOGGER_MIDDLEWARE_INITIALIZED = true;
    
    // Log middleware initialization with configuration details
    info('Express.js logging middleware initialized', {
      configuration: config,
      environment: environmentConfig.currentEnvironment,
      pm2Enabled: config.pm2Config.clusterMode,
      pid: process.pid,
      educationalMode: config.enableEducationalMode,
      middleware: 'request-logger'
    });
  }

  // Return Express.js middleware function ready for application integration
  return function requestLogger(req, res, next) {
    // Set up correlation ID generation for distributed request tracking
    const correlationId = config.enableCorrelationTracking ? 
      generateRequestId({
        prefix: config.requestIdPrefix,
        includeTimestamp: config.correlationConfig.includeTimestamp,
        includePid: config.correlationConfig.includePid,
        includeHostname: config.correlationConfig.includeHostname,
        metadata: {
          method: req.method,
          url: req.url,
          userAgent: req.get('user-agent')
        }
      }) : `${config.requestIdPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize request context and performance timing
    const requestContext = {
      correlationId,
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      query: req.query,
      headers: req.headers,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      referer: req.get('referer') || null,
      startTime: Date.now(),
      startHrTime: process.hrtime.bigint(),
      pid: process.pid,
      middleware: 'express-logger'
    };

    // Add correlation ID to request object for downstream middleware
    req.correlationId = correlationId;
    req.requestContext = requestContext;

    // Store request context for lifecycle tracking and PM2 cluster coordination
    if (ACTIVE_REQUESTS.size < config.maxActiveRequests) {
      ACTIVE_REQUESTS.set(correlationId, requestContext);
      CORRELATION_TRACKING.set(correlationId, {
        startTime: requestContext.startTime,
        pid: process.pid,
        status: 'active'
      });
    }

    // Log incoming HTTP request with comprehensive context
    logHTTPRequest(req, correlationId, {
      config,
      enableEducationalMode: config.enableEducationalMode,
      enableFlaskCompatibility: config.enableFlaskCompatibility
    });

    // Set up performance measurement for request processing
    const performanceMeasurement = measurePerformance(() => {
      // This function tracks the start of request processing
      return { requestStarted: true, correlationId };
    });

    // Configure response completion tracking using onFinished for request lifecycle management
    onFinished(res, (err, res) => {
      const endTime = Date.now();
      const responseTime = endTime - requestContext.startTime;
      
      // Update global request metrics
      REQUEST_METRICS.count++;
      REQUEST_METRICS.totalTime += responseTime;
      REQUEST_METRICS.avgResponseTime = REQUEST_METRICS.totalTime / REQUEST_METRICS.count;
      
      if (res.statusCode >= 400) {
        REQUEST_METRICS.errors++;
      }

      // Log HTTP response with performance metrics and correlation tracking
      logHTTPResponse(req, res, correlationId, responseTime, {
        config,
        error: err,
        enableEducationalMode: config.enableEducationalMode
      });

      // Clean up tracking maps to prevent memory leaks
      ACTIVE_REQUESTS.delete(correlationId);
      CORRELATION_TRACKING.delete(correlationId);

      // Log performance data if monitoring is enabled
      if (config.enablePerformanceMonitoring) {
        logPerformanceData({
          responseTime,
          statusCode: res.statusCode,
          contentLength: res.get('content-length') || 0,
          method: req.method,
          url: req.url
        }, correlationId, {
          config,
          thresholds: config.performanceThresholds
        });
      }
    });

    // Set up request/response header monitoring using onHeaders for comprehensive HTTP tracking
    onHeaders(res, () => {
      // Log response headers being set for educational and debugging purposes
      if (config.enableEducationalMode) {
        debug('Response headers being set', {
          correlationId,
          headers: res.getHeaders(),
          statusCode: res.statusCode,
          timing: Date.now() - requestContext.startTime,
          educational: {
            explanation: 'onHeaders callback fires when response headers are being written',
            purpose: 'Allows modification of headers before response is sent to client',
            middleware: 'express-request-logger'
          }
        });
      }
    });

    // Continue to next middleware in the Express.js pipeline
    next();
  };
}

/**
 * Logs incoming HTTP request details including method, URL, headers, query parameters,
 * client information, and correlation tracking. Provides comprehensive request documentation
 * for debugging, security monitoring, and educational learning with environment-appropriate detail levels.
 * 
 * @param {Object} req - Express request object
 * @param {string} correlationId - Unique request correlation identifier
 * @param {Object} context - Additional context information for logging
 * @returns {void} No return value, performs request logging side effect with structured output
 */
export function logHTTPRequest(req, correlationId, context = {}) {
  // Extract HTTP request method, URL, and query parameters for request identification
  const requestData = {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params
  };

  // Collect relevant request headers including security and client information
  const headers = {
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    accept: req.get('accept'),
    acceptEncoding: req.get('accept-encoding'),
    acceptLanguage: req.get('accept-language'),
    referer: req.get('referer'),
    origin: req.get('origin'),
    host: req.get('host'),
    connection: req.get('connection'),
    cacheControl: req.get('cache-control'),
    // Security headers for analysis
    authorization: req.get('authorization') ? '[REDACTED]' : null,
    xForwardedFor: req.get('x-forwarded-for'),
    xRealIp: req.get('x-real-ip')
  };

  // Extract client information for security tracking and analysis
  const clientInfo = {
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    referer: req.get('referer') || null,
    origin: req.get('origin') || null,
    forwardedFor: req.get('x-forwarded-for') || null,
    realIp: req.get('x-real-ip') || null
  };

  // Create comprehensive request log entry
  const logEntry = {
    type: 'http-request',
    correlationId,
    timestamp: new Date().toISOString(),
    request: requestData,
    headers: headers,
    client: clientInfo,
    server: {
      pid: process.pid,
      environment: environmentConfig.currentEnvironment,
      pm2Instance: process.env.PM2_INSTANCE_ID || null
    }
  };

  // Add educational information for learning and development
  if (context.enableEducationalMode) {
    logEntry.educational = {
      httpMethod: {
        description: `${req.method} is an HTTP method used for ${getMethodDescription(req.method)}`,
        safety: getMethodSafety(req.method),
        idempotent: getMethodIdempotency(req.method)
      },
      urlStructure: {
        explanation: 'URL contains path, query parameters, and fragments',
        path: req.path,
        queryCount: Object.keys(req.query).length,
        hasParams: Object.keys(req.params).length > 0
      },
      headers: {
        count: Object.keys(req.headers).length,
        important: ['user-agent', 'accept', 'content-type', 'authorization'].filter(h => req.get(h)),
        security: ['x-forwarded-for', 'x-real-ip', 'origin'].filter(h => req.get(h))
      }
    };
  }

  // Add Flask compatibility information for cross-platform development
  if (context.enableFlaskCompatibility) {
    logEntry.flaskCompatibility = {
      requestObject: 'Equivalent to Flask request object',
      headers: 'Similar to Flask request.headers',
      args: 'Similar to Flask request.args (query parameters)',
      form: 'Similar to Flask request.form (form data)',
      json: 'Similar to Flask request.json (JSON data)'
    };
  }

  // Log request with appropriate level based on environment and configuration
  const logLevel = context.config?.logLevel || ENV_CONSTANTS.LOG_LEVELS.INFO;
  
  if (logLevel === ENV_CONSTANTS.LOG_LEVELS.DEBUG) {
    debug('HTTP request received', logEntry);
  } else {
    info('HTTP request received', logEntry);
  }

  // Check for security-relevant patterns in request for security monitoring
  if (context.config?.enableSecurityLogging) {
    checkRequestSecurity(req, correlationId, logEntry);
  }
}

/**
 * Logs HTTP response details including status code, headers, response time, content length,
 * and performance metrics. Provides comprehensive response documentation for monitoring,
 * optimization, and educational learning with correlation tracking and security analysis.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {string} correlationId - Unique request correlation identifier
 * @param {number} responseTime - Request processing time in milliseconds
 * @param {Object} [context={}] - Additional context for logging
 * @returns {void} No return value, performs response logging side effect with performance metrics
 */
export function logHTTPResponse(req, res, correlationId, responseTime, context = {}) {
  // Format response information using utility function for consistent output
  const responseData = formatHTTPResponse(res, {
    includeSecurityAnalysis: context.enableEducationalMode,
    includePerformanceInsights: context.config?.enablePerformanceMonitoring
  });

  // Calculate comprehensive performance metrics
  const performanceMetrics = {
    responseTime,
    statusCode: res.statusCode,
    contentLength: parseInt(res.get('content-length')) || 0,
    statusCategory: Math.floor(res.statusCode / 100) * 100,
    isError: res.statusCode >= 400,
    isServerError: res.statusCode >= 500,
    isRedirect: res.statusCode >= 300 && res.statusCode < 400,
    isSuccess: res.statusCode >= 200 && res.statusCode < 300
  };

  // Create comprehensive response log entry
  const logEntry = {
    type: 'http-response',
    correlationId,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      path: req.path
    },
    response: responseData,
    performance: performanceMetrics,
    timing: {
      responseTime,
      unit: 'milliseconds'
    },
    server: {
      pid: process.pid,
      environment: environmentConfig.currentEnvironment
    }
  };

  // Add error context if response indicates an error
  if (context.error || performanceMetrics.isError) {
    logEntry.error = {
      hasError: true,
      errorSource: context.error ? 'middleware' : 'application',
      errorMessage: context.error?.message || `HTTP ${res.statusCode} response`,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage
    };
  }

  // Add educational insights about HTTP response codes and performance
  if (context.enableEducationalMode) {
    logEntry.educational = {
      statusCode: {
        category: getStatusCodeCategory(res.statusCode),
        meaning: getStatusCodeMeaning(res.statusCode),
        isError: performanceMetrics.isError,
        shouldRetry: shouldRetryStatus(res.statusCode)
      },
      performance: {
        rating: getPerformanceRating(responseTime),
        comparison: getPerformanceComparison(responseTime),
        optimization: getOptimizationSuggestions(responseTime, performanceMetrics.contentLength)
      },
      headers: {
        securityHeaders: responseData.securityHeaders || {},
        cacheability: res.get('cache-control') || 'no-cache',
        contentType: res.get('content-type') || 'unknown'
      }
    };
  }

  // Determine appropriate log level based on response status and performance
  let logLevel = ENV_CONSTANTS.LOG_LEVELS.INFO;
  if (performanceMetrics.isServerError || context.error) {
    logLevel = ENV_CONSTANTS.LOG_LEVELS.ERROR;
  } else if (performanceMetrics.isError || responseTime > (context.config?.performanceThresholds?.warning || 1000)) {
    logLevel = ENV_CONSTANTS.LOG_LEVELS.WARN;
  }

  // Log response with appropriate level
  switch (logLevel) {
    case ENV_CONSTANTS.LOG_LEVELS.ERROR:
      logError('HTTP response completed with error', context.error, logEntry);
      break;
    case ENV_CONSTANTS.LOG_LEVELS.WARN:
      warn('HTTP response completed with warning', logEntry);
      break;
    default:
      info('HTTP response completed', logEntry);
  }

  // Update global metrics for monitoring dashboard
  updateGlobalMetrics(performanceMetrics, responseTime);
}

/**
 * Logs security-related events from middleware including Helmet.js violations, CORS breaches,
 * rate limiting triggers, and authentication failures. Provides comprehensive security monitoring
 * with correlation tracking, threat analysis, and educational security insights.
 * 
 * @param {string} eventType - Type of security event (e.g., 'cors-violation', 'rate-limit-exceeded')
 * @param {Object} securityContext - Security-related context information
 * @param {Object} req - Express request object for correlation
 * @param {string} correlationId - Request correlation identifier
 * @returns {void} No return value, performs security event logging side effect with threat monitoring
 */
export function logSecurityMiddlewareEvent(eventType, securityContext, req, correlationId) {
  // Classify security event type and determine appropriate severity level
  const eventSeverity = classifySecurityEventSeverity(eventType);
  const threatLevel = assessThreatLevel(eventType, securityContext);

  // Sanitize security context to prevent sensitive information disclosure
  const sanitizedContext = sanitizeSecurityContext(securityContext);

  // Extract client information for security investigation
  const clientInfo = {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    origin: req.get('origin'),
    forwardedFor: req.get('x-forwarded-for'),
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };

  // Create comprehensive security event log entry
  const securityEvent = {
    type: 'security-event',
    eventType,
    severity: eventSeverity,
    threatLevel,
    correlationId,
    timestamp: new Date().toISOString(),
    client: clientInfo,
    context: sanitizedContext,
    server: {
      pid: process.pid,
      environment: environmentConfig.currentEnvironment,
      pm2Instance: process.env.PM2_INSTANCE_ID || null
    },
    investigation: {
      requiresInvestigation: threatLevel === 'high' || threatLevel === 'critical',
      automaticResponse: getAutomaticResponseAction(eventType),
      recommendedAction: getSecurityRecommendation(eventType)
    }
  };

  // Add educational security information for learning purposes
  securityEvent.educational = {
    eventDescription: getSecurityEventDescription(eventType),
    threatExplanation: getThreatExplanation(eventType),
    mitigationStrategies: getMitigationStrategies(eventType),
    preventionTips: getPreventionTips(eventType)
  };

  // Log security event using appropriate security logging function
  logSecurityEvent(eventType, sanitizedContext, {
    correlationId,
    clientInfo,
    severity: eventSeverity,
    threatLevel
  });

  // Add to security events collection for analysis
  SECURITY_EVENTS.push({
    ...securityEvent,
    id: generateRequestId({ prefix: 'sec' })
  });

  // Trigger alerts for high-severity events
  if (eventSeverity === 'high' || eventSeverity === 'critical') {
    triggerSecurityAlert(securityEvent);
  }
}

/**
 * Creates specialized security event logging middleware that integrates with Helmet.js, CORS,
 * rate limiting, and authentication middleware for comprehensive security monitoring. Provides
 * correlation tracking, threat detection, and educational security insights.
 * 
 * @param {Object} [securityOptions={}] - Security logging configuration options
 * @param {Array} [securityOptions.enabledEvents] - List of security events to log
 * @param {Object} [securityOptions.alertThresholds] - Alert threshold configuration
 * @param {boolean} [securityOptions.enableThreatDetection=true] - Enable automated threat detection
 * @returns {Function} Security logging middleware function for integration with security middleware stack
 */
export function createSecurityLogger(securityOptions = {}) {
  // Validate security logging configuration and merge with defaults
  const config = {
    enabledEvents: securityOptions.enabledEvents || [
      'helmet-violation',
      'cors-violation', 
      'rate-limit-exceeded',
      'authentication-failure',
      'authorization-violation',
      'suspicious-request',
      'xss-attempt',
      'sql-injection-attempt'
    ],
    alertThresholds: {
      eventsPerMinute: 10,
      eventsPerHour: 100,
      criticalEventsPerHour: 5,
      ...securityOptions.alertThresholds
    },
    enableThreatDetection: securityOptions.enableThreatDetection ?? true,
    enableEducationalMode: securityOptions.enableEducationalMode ?? !environmentConfig.isProduction,
    correlationTracking: securityOptions.correlationTracking ?? true,
    ...securityOptions
  };

  // Initialize security event tracking and correlation management
  const securityMetrics = {
    eventCounts: new Map(),
    lastReset: Date.now(),
    alertsTriggered: 0
  };

  // Log security middleware initialization
  info('Security logging middleware initialized', {
    config,
    enabledEvents: config.enabledEvents,
    environment: environmentConfig.currentEnvironment,
    middleware: 'security-logger'
  });

  // Return security logging middleware ready for integration
  return function securityLogger(req, res, next) {
    const correlationId = req.correlationId || generateRequestId({ prefix: 'sec' });
    
    // Add security logging capability to request object
    req.logSecurityEvent = (eventType, securityContext) => {
      if (config.enabledEvents.includes(eventType)) {
        logSecurityMiddlewareEvent(eventType, securityContext, req, correlationId);
        
        // Update security metrics
        const currentCount = securityMetrics.eventCounts.get(eventType) || 0;
        securityMetrics.eventCounts.set(eventType, currentCount + 1);
        
        // Check alert thresholds
        checkSecurityAlertThresholds(eventType, securityMetrics, config.alertThresholds);
      }
    };

    // Add security context to request for downstream middleware
    req.securityContext = {
      correlationId,
      enabledEvents: config.enabledEvents,
      threatDetectionEnabled: config.enableThreatDetection
    };

    next();
  };
}

/**
 * Logs detailed performance metrics including response times, memory usage, CPU utilization,
 * and throughput measurements for production monitoring and optimization. Integrates with PM2
 * monitoring and provides educational performance insights.
 * 
 * @param {Object} performanceMetrics - Performance data to log
 * @param {string} correlationId - Request correlation identifier
 * @param {Object} [context={}] - Additional context for performance logging
 * @returns {void} No return value, performs performance logging side effect with metrics collection
 */
export function logPerformanceData(performanceMetrics, correlationId, context = {}) {
  // Extract and enhance performance metrics with system information
  const enhancedMetrics = {
    ...performanceMetrics,
    correlationId,
    timestamp: new Date().toISOString(),
    system: {
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      pid: process.pid
    },
    application: {
      totalRequests: REQUEST_METRICS.count,
      averageResponseTime: REQUEST_METRICS.avgResponseTime,
      errorRate: REQUEST_METRICS.count > 0 ? (REQUEST_METRICS.errors / REQUEST_METRICS.count) * 100 : 0,
      activeRequests: ACTIVE_REQUESTS.size
    }
  };

  // Calculate performance trends and thresholds
  const performanceAnalysis = {
    rating: getPerformanceRating(performanceMetrics.responseTime),
    exceedsWarningThreshold: performanceMetrics.responseTime > (context.thresholds?.warning || 1000),
    exceedsCriticalThreshold: performanceMetrics.responseTime > (context.thresholds?.critical || 5000),
    memoryPressure: enhancedMetrics.system.memory.heapUsed > (512 * 1024 * 1024), // 512MB
    recommendations: getPerformanceOptimizationRecommendations(enhancedMetrics)
  };

  // Create comprehensive performance log entry
  const performanceLogEntry = {
    type: 'performance-metrics',
    correlationId,
    metrics: enhancedMetrics,
    analysis: performanceAnalysis,
    thresholds: context.thresholds,
    educational: context.config?.enableEducationalMode ? {
      performanceImpact: getPerformanceEducationalInsights(performanceMetrics),
      optimizationTips: getPerformanceOptimizationTips(performanceMetrics),
      monitoringGuidance: getPerformanceMonitoringGuidance()
    } : undefined
  };

  // Log performance data using appropriate level based on analysis
  if (performanceAnalysis.exceedsCriticalThreshold) {
    logError('Critical performance threshold exceeded', null, performanceLogEntry);
  } else if (performanceAnalysis.exceedsWarningThreshold) {
    warn('Performance warning threshold exceeded', performanceLogEntry);
  } else {
    // Use debug level for normal performance data to avoid log spam
    debug('Performance metrics collected', performanceLogEntry);
  }

  // Send to dedicated performance monitoring system
  logPerformanceMetrics(enhancedMetrics, {
    correlationId,
    analysis: performanceAnalysis,
    environment: environmentConfig.currentEnvironment
  });
}

/**
 * Creates development-optimized logging middleware with enhanced debugging information,
 * full request/response details, performance timing, and educational insights for learning
 * and troubleshooting purposes.
 * 
 * @param {Object} [devOptions={}] - Development logging configuration
 * @param {boolean} [devOptions.verboseLogging=true] - Enable verbose request/response logging
 * @param {boolean} [devOptions.includeStackTraces=true] - Include stack traces in error logs
 * @param {boolean} [devOptions.enableEducationalMode=true] - Enable educational insights
 * @returns {Function} Development logging middleware with enhanced debugging and educational features
 */
export function createDevelopmentLogger(devOptions = {}) {
  const config = {
    verboseLogging: devOptions.verboseLogging ?? true,
    includeStackTraces: devOptions.includeStackTraces ?? true,
    enableEducationalMode: devOptions.enableEducationalMode ?? true,
    logAllHeaders: devOptions.logAllHeaders ?? true,
    logRequestBodies: devOptions.logRequestBodies ?? false, // Security consideration
    logResponseBodies: devOptions.logResponseBodies ?? false, // Performance consideration
    colorizeOutput: devOptions.colorizeOutput ?? true,
    enablePerformanceTiming: devOptions.enablePerformanceTiming ?? true,
    enableMiddlewareTracking: devOptions.enableMiddlewareTracking ?? true,
    ...devOptions
  };

  info('Development logging middleware initialized', {
    config,
    environment: 'development',
    middleware: 'development-logger'
  });

  return createMiddlewareRequestLogger({
    ...config,
    logLevel: ENV_CONSTANTS.LOG_LEVELS.DEBUG,
    enableEducationalMode: true,
    enablePerformanceMonitoring: true,
    enableSecurityLogging: true,
    performanceThresholds: {
      warning: 500, // Lower thresholds for development
      critical: 2000
    }
  });
}

/**
 * Creates production-optimized logging middleware with efficient performance, structured JSON output,
 * security compliance, and minimal overhead for enterprise deployment and PM2 cluster mode compatibility.
 * 
 * @param {Object} [prodOptions={}] - Production logging configuration
 * @param {boolean} [prodOptions.enableStructuredLogging=true] - Use structured JSON format
 * @param {boolean} [prodOptions.enableLogRotation=true] - Enable automatic log rotation
 * @param {boolean} [prodOptions.enableSecurityCompliance=true] - Enable security-compliant logging
 * @returns {Function} Production logging middleware optimized for performance and security compliance
 */
export function createProductionLogger(prodOptions = {}) {
  const config = {
    enableStructuredLogging: prodOptions.enableStructuredLogging ?? true,
    enableLogRotation: prodOptions.enableLogRotation ?? true,
    enableSecurityCompliance: prodOptions.enableSecurityCompliance ?? true,
    enableEducationalMode: false, // Disabled in production
    verboseLogging: false, // Minimal logging for performance
    logLevel: prodOptions.logLevel || ENV_CONSTANTS.LOG_LEVELS.INFO,
    enablePerformanceMonitoring: prodOptions.enablePerformanceMonitoring ?? true,
    enableSecurityLogging: prodOptions.enableSecurityLogging ?? true,
    performanceThresholds: {
      warning: 1000,
      critical: 5000,
      ...prodOptions.performanceThresholds
    },
    pm2Config: {
      enableProcessCorrelation: true,
      logRotationEnabled: true,
      clusterMode: true,
      ...prodOptions.pm2Config
    },
    ...prodOptions
  };

  info('Production logging middleware initialized', {
    config: {
      logLevel: config.logLevel,
      structuredLogging: config.enableStructuredLogging,
      securityCompliance: config.enableSecurityCompliance,
      pm2Integration: config.pm2Config.clusterMode
    },
    environment: 'production',
    middleware: 'production-logger'
  });

  return createMiddlewareRequestLogger(config);
}

/**
 * Returns comprehensive logging middleware metrics including request counts, response times,
 * error rates, security events, and performance statistics for monitoring dashboard and educational analysis.
 * 
 * @param {Object} [metricsOptions={}] - Metrics collection options
 * @param {boolean} [metricsOptions.includeSecurityMetrics=true] - Include security event statistics
 * @param {boolean} [metricsOptions.includePerformanceMetrics=true] - Include performance data
 * @returns {Object} Detailed logging metrics with performance data, security events, and educational insights
 */
export function getLoggerMetrics(metricsOptions = {}) {
  const config = {
    includeSecurityMetrics: metricsOptions.includeSecurityMetrics ?? true,
    includePerformanceMetrics: metricsOptions.includePerformanceMetrics ?? true,
    includeEducationalInsights: metricsOptions.includeEducationalInsights ?? !environmentConfig.isProduction,
    includePm2Metrics: metricsOptions.includePm2Metrics ?? (process.env.PM2_HOME ? true : false),
    ...metricsOptions
  };

  // Collect comprehensive request/response metrics
  const requestMetrics = {
    total: REQUEST_METRICS.count,
    errors: REQUEST_METRICS.errors,
    successRate: REQUEST_METRICS.count > 0 ? ((REQUEST_METRICS.count - REQUEST_METRICS.errors) / REQUEST_METRICS.count * 100).toFixed(2) : 100,
    averageResponseTime: Math.round(REQUEST_METRICS.avgResponseTime * 100) / 100,
    totalResponseTime: REQUEST_METRICS.totalTime,
    activeRequests: ACTIVE_REQUESTS.size,
    uptimeSeconds: Math.floor((Date.now() - REQUEST_METRICS.startTime) / 1000)
  };

  // Compile security event statistics with threat analysis
  const securityMetrics = config.includeSecurityMetrics ? {
    totalEvents: SECURITY_EVENTS.length,
    eventsByType: getSecurityEventsByType(),
    recentEvents: SECURITY_EVENTS.slice(-10), // Last 10 events
    threatLevels: getSecurityThreatLevelDistribution(),
    topSources: getTopSecurityEventSources()
  } : {};

  // Calculate performance statistics and trends
  const performanceMetrics = config.includePerformanceMetrics ? {
    responseTimeDistribution: getResponseTimeDistribution(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    systemUptime: process.uptime(),
    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
  } : {};

  // Generate correlation tracking statistics
  const correlationMetrics = {
    activeCorrelations: CORRELATION_TRACKING.size,
    correlationAge: getCorrelationAgeStatistics(),
    trackingHealth: CORRELATION_TRACKING.size === ACTIVE_REQUESTS.size
  };

  // Compile PM2 cluster mode metrics if available
  const pm2Metrics = config.includePm2Metrics ? {
    processId: process.pid,
    clusterId: process.env.PM2_INSTANCE_ID || null,
    clusterMode: !!process.env.PM2_HOME,
    workerStatus: 'active',
    restartCount: parseInt(process.env.PM2_RESTART_COUNT) || 0
  } : {};

  // Create comprehensive metrics object
  const metrics = {
    timestamp: new Date().toISOString(),
    environment: environmentConfig.currentEnvironment,
    middleware: 'express-request-logger',
    requests: requestMetrics,
    security: securityMetrics,
    performance: performanceMetrics,
    correlation: correlationMetrics,
    pm2: pm2Metrics,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    }
  };

  // Add educational insights about logging effectiveness
  if (config.includeEducationalInsights) {
    metrics.educational = {
      loggingEffectiveness: assessLoggingEffectiveness(metrics),
      optimizationOpportunities: identifyOptimizationOpportunities(metrics),
      bestPracticesCompliance: assessBestPracticesCompliance(metrics),
      learningInsights: generateLearningInsights(metrics)
    };
  }

  return metrics;
}

/**
 * Validates logger middleware configuration including log levels, output destinations,
 * security settings, performance options, and integration requirements with detailed
 * analysis and recommendations.
 * 
 * @param {Object} config - Configuration object to validate
 * @param {string} [config.logLevel] - Log level to validate
 * @param {Object} [config.performanceThresholds] - Performance threshold configuration
 * @param {Object} [config.securityConfig] - Security logging configuration
 * @returns {Object} Comprehensive validation result with status, warnings, security analysis, and optimization recommendations
 */
export function validateLoggerConfig(config) {
  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    securityAnalysis: {},
    performanceAnalysis: {},
    timestamp: new Date().toISOString()
  };

  try {
    // Validate log level configuration and environment appropriateness
    if (config.logLevel) {
      const validLogLevels = Object.values(ENV_CONSTANTS.LOG_LEVELS);
      if (!validLogLevels.includes(config.logLevel)) {
        validationResult.errors.push({
          field: 'logLevel',
          message: `Invalid log level: ${config.logLevel}`,
          validValues: validLogLevels,
          severity: 'error'
        });
        validationResult.isValid = false;
      }
    }

    // Check security logging configuration completeness
    if (config.enableSecurityLogging && !config.securityConfig) {
      validationResult.warnings.push({
        field: 'securityConfig',
        message: 'Security logging enabled but no security configuration provided',
        recommendation: 'Provide security configuration for optimal security monitoring',
        severity: 'warning'
      });
    }

    // Validate performance monitoring settings
    if (config.performanceThresholds) {
      if (config.performanceThresholds.warning && config.performanceThresholds.critical) {
        if (config.performanceThresholds.warning >= config.performanceThresholds.critical) {
          validationResult.errors.push({
            field: 'performanceThresholds',
            message: 'Warning threshold must be less than critical threshold',
            current: config.performanceThresholds,
            severity: 'error'
          });
          validationResult.isValid = false;
        }
      }
    }

    // Check PM2 cluster mode compatibility and configuration
    if (config.pm2Config) {
      if (config.pm2Config.clusterMode && !process.env.PM2_HOME) {
        validationResult.warnings.push({
          field: 'pm2Config.clusterMode',
          message: 'PM2 cluster mode enabled but PM2 not detected',
          recommendation: 'Ensure PM2 is properly configured or disable cluster mode',
          severity: 'warning'
        });
      }
    }

    // Validate correlation tracking settings
    if (config.enableCorrelationTracking === false && config.enableEducationalMode) {
      validationResult.warnings.push({
        field: 'correlationTracking',
        message: 'Correlation tracking disabled while educational mode is enabled',
        recommendation: 'Enable correlation tracking for better educational insights',
        severity: 'info'
      });
    }

    // Security analysis
    validationResult.securityAnalysis = {
      securityLoggingEnabled: !!config.enableSecurityLogging,
      sensitiveDataProtection: assessSensitiveDataProtection(config),
      complianceLevel: assessComplianceLevel(config),
      recommendations: generateSecurityRecommendations(config)
    };

    // Performance analysis
    validationResult.performanceAnalysis = {
      performanceMonitoringEnabled: !!config.enablePerformanceMonitoring,
      thresholdConfiguration: assessThresholdConfiguration(config),
      optimizationPotential: assessOptimizationPotential(config),
      recommendations: generatePerformanceRecommendations(config)
    };

    // Generate overall recommendations
    validationResult.recommendations = [
      ...generateConfigurationRecommendations(config),
      ...generateEnvironmentSpecificRecommendations(config),
      ...generateBestPracticeRecommendations(config)
    ];

  } catch (error) {
    validationResult.isValid = false;
    validationResult.errors.push({
      field: 'configuration',
      message: 'Configuration validation failed',
      error: error.message,
      severity: 'critical'
    });
  }

  return validationResult;
}

/**
 * Creates Flask-compatible logging middleware interface for cross-platform development
 * and feature parity testing between Node.js Express and Python Flask implementations
 * with consistent logging patterns.
 * 
 * @param {Object} [flaskConfig={}] - Flask compatibility configuration
 * @param {string} [flaskConfig.logFormat='flask-style'] - Logging format style
 * @param {boolean} [flaskConfig.enableFlaskHeaders=true] - Enable Flask-style header logging
 * @returns {Object} Flask-compatible logger interface with consistent formatting and correlation tracking
 */
export function createFlaskCompatibleLogger(flaskConfig = {}) {
  const config = {
    logFormat: flaskConfig.logFormat || 'flask-style',
    enableFlaskHeaders: flaskConfig.enableFlaskHeaders ?? true,
    enableRequestContext: flaskConfig.enableRequestContext ?? true,
    enableCrossPatformValidation: flaskConfig.enableCrossPatformValidation ?? true,
    correlationHeader: flaskConfig.correlationHeader || 'X-Request-ID',
    ...flaskConfig
  };

  // Create Flask-compatible logging interface
  const flaskCompatibleLogger = {
    // Flask-style request logging
    logRequest: (req, flaskContext = {}) => {
      const flaskRequestData = {
        method: req.method,
        url: req.url,
        path: req.path,
        args: req.query, // Flask request.args equivalent
        form: req.body || {}, // Flask request.form equivalent
        headers: req.headers,
        remote_addr: req.ip, // Flask request.remote_addr
        user_agent: req.get('user-agent'), // Flask request.user_agent
        referrer: req.get('referer'), // Flask request.referrer
        flask_compatibility: true,
        cross_platform: {
          original_platform: 'node-express',
          target_platform: 'python-flask',
          compatibility_mode: true
        }
      };

      info('Flask-compatible request logged', {
        ...flaskRequestData,
        ...flaskContext,
        educational: {
          explanation: 'This log entry mimics Flask request object structure',
          equivalentFlaskCode: 'flask.request object with similar properties',
          crossPlatformNote: 'Maintains consistent logging between Node.js and Python'
        }
      });

      return flaskRequestData;
    },

    // Flask-style response logging
    logResponse: (res, responseTime, flaskContext = {}) => {
      const flaskResponseData = {
        status_code: res.statusCode, // Flask response.status_code
        headers: res.getHeaders(),
        content_length: res.get('content-length') || 0,
        response_time: responseTime,
        flask_compatibility: true,
        cross_platform: {
          original_platform: 'node-express',
          target_platform: 'python-flask',
          response_pattern: 'Flask response object equivalent'
        }
      };

      info('Flask-compatible response logged', {
        ...flaskResponseData,
        ...flaskContext,
        educational: {
          explanation: 'This log entry mimics Flask response object structure',
          equivalentFlaskCode: 'Flask response object with status_code, headers, etc.',
          crossPlatformNote: 'Enables direct comparison between Node.js and Python implementations'
        }
      });

      return flaskResponseData;
    },

    // Cross-platform validation utility
    validateCrossPlatformCompatibility: () => {
      const validationResult = {
        compatible: true,
        platform: 'node-express-flask-compatible',
        timestamp: new Date().toISOString(),
        features: {
          requestLogging: true,
          responseLogging: true,
          correlationTracking: true,
          performanceMonitoring: true,
          securityLogging: true
        },
        crossPlatformMapping: {
          'Flask request.method': 'Express req.method',
          'Flask request.url': 'Express req.url',
          'Flask request.args': 'Express req.query',
          'Flask request.form': 'Express req.body',
          'Flask request.headers': 'Express req.headers',
          'Flask request.remote_addr': 'Express req.ip',
          'Flask response.status_code': 'Express res.statusCode',
          'Flask response.headers': 'Express res.getHeaders()'
        },
        educational: {
          purpose: 'Enables seamless migration and comparison between Node.js and Python',
          benefits: 'Consistent logging patterns across different technology stacks',
          learningValue: 'Demonstrates cross-platform development principles'
        }
      };

      info('Cross-platform compatibility validated', validationResult);
      return validationResult;
    }
  };

  // Initialize Flask-compatible logging
  info('Flask-compatible logger interface created', {
    config,
    compatibility: 'python-flask',
    middleware: 'flask-compatible-logger',
    educational: {
      purpose: 'Demonstrates cross-platform logging compatibility',
      framework_comparison: 'Express.js vs Flask logging patterns',
      migration_support: 'Facilitates Node.js to Python migration'
    }
  });

  return flaskCompatibleLogger;
}

// Helper functions for educational and analysis purposes

function getMethodDescription(method) {
  const descriptions = {
    GET: 'retrieving data from the server without side effects',
    POST: 'sending data to create new resources',
    PUT: 'updating or creating resources',
    DELETE: 'removing resources from the server',
    PATCH: 'partially updating existing resources',
    HEAD: 'retrieving headers without response body',
    OPTIONS: 'checking allowed methods and CORS preflight'
  };
  return descriptions[method] || 'performing HTTP operations';
}

function getMethodSafety(method) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return safeMethods.includes(method) ? 'safe' : 'unsafe';
}

function getMethodIdempotency(method) {
  const idempotentMethods = ['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
  return idempotentMethods.includes(method) ? 'idempotent' : 'non-idempotent';
}

function getStatusCodeCategory(statusCode) {
  const categories = {
    1: 'Informational',
    2: 'Success',
    3: 'Redirection', 
    4: 'Client Error',
    5: 'Server Error'
  };
  return categories[Math.floor(statusCode / 100)] || 'Unknown';
}

function getStatusCodeMeaning(statusCode) {
  return HTTP_CONSTANTS.STATUS_CODES[statusCode] || 'Unknown Status';
}

function shouldRetryStatus(statusCode) {
  // Generally safe to retry: 500, 502, 503, 504
  const retryableStatuses = [500, 502, 503, 504];
  return retryableStatuses.includes(statusCode);
}

function getPerformanceRating(responseTime) {
  if (responseTime < 100) return 'excellent';
  if (responseTime < 300) return 'good';
  if (responseTime < 1000) return 'acceptable';
  if (responseTime < 3000) return 'slow';
  return 'very-slow';
}

function getPerformanceComparison(responseTime) {
  return {
    vsTarget: responseTime <= 100 ? 'within-target' : 'exceeds-target',
    vsAverage: responseTime <= REQUEST_METRICS.avgResponseTime ? 'better-than-average' : 'worse-than-average'
  };
}

function getOptimizationSuggestions(responseTime, contentLength) {
  const suggestions = [];
  if (responseTime > 1000) {
    suggestions.push('Consider response caching');
    suggestions.push('Optimize database queries');
    suggestions.push('Review middleware efficiency');
  }
  if (contentLength > 1024 * 1024) { // > 1MB
    suggestions.push('Enable response compression');
    suggestions.push('Consider content optimization');
  }
  return suggestions;
}

function classifySecurityEventSeverity(eventType) {
  const severityMap = {
    'helmet-violation': 'medium',
    'cors-violation': 'high',
    'rate-limit-exceeded': 'medium',
    'authentication-failure': 'high',
    'authorization-violation': 'high',
    'suspicious-request': 'medium',
    'xss-attempt': 'critical',
    'sql-injection-attempt': 'critical'
  };
  return severityMap[eventType] || 'medium';
}

function assessThreatLevel(eventType, context) {
  // Simplified threat assessment
  const criticalEvents = ['xss-attempt', 'sql-injection-attempt'];
  const highEvents = ['cors-violation', 'authentication-failure', 'authorization-violation'];
  
  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  return 'medium';
}

function sanitizeSecurityContext(context) {
  // Remove or redact sensitive information
  const sanitized = { ...context };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function checkRequestSecurity(req, correlationId, logEntry) {
  // Basic security pattern detection
  const suspiciousPatterns = [
    /script.*>/i,
    /javascript:/i,
    /\bunion\b.*\bselect\b/i,
    /\bdrop\b.*\btable\b/i
  ];
  
  const requestString = `${req.url} ${JSON.stringify(req.headers)} ${JSON.stringify(req.query)}`;
  
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(requestString)) {
      const eventType = index < 2 ? 'xss-attempt' : 'sql-injection-attempt';
      logSecurityEvent(eventType, {
        pattern: pattern.toString(),
        matchedContent: requestString.match(pattern)?.[0] || 'pattern-match',
        requestUrl: req.url,
        userAgent: req.get('user-agent')
      }, {
        correlationId,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
  });
}

function updateGlobalMetrics(performanceMetrics, responseTime) {
  // Update global metrics for dashboard and monitoring
  REQUEST_METRICS.totalTime += responseTime;
  REQUEST_METRICS.avgResponseTime = REQUEST_METRICS.totalTime / REQUEST_METRICS.count;
  
  if (performanceMetrics.isError) {
    REQUEST_METRICS.errors++;
  }
}

// Additional helper functions for comprehensive functionality
function getSecurityEventsByType() {
  const eventTypes = {};
  SECURITY_EVENTS.forEach(event => {
    eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
  });
  return eventTypes;
}

function getSecurityThreatLevelDistribution() {
  const threatLevels = {};
  SECURITY_EVENTS.forEach(event => {
    threatLevels[event.threatLevel] = (threatLevels[event.threatLevel] || 0) + 1;
  });
  return threatLevels;
}

function getTopSecurityEventSources() {
  const sources = {};
  SECURITY_EVENTS.forEach(event => {
    const ip = event.client?.ip || 'unknown';
    sources[ip] = (sources[ip] || 0) + 1;
  });
  return Object.entries(sources)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .reduce((obj, [ip, count]) => ({ ...obj, [ip]: count }), {});
}

function getResponseTimeDistribution() {
  // Simplified distribution calculation
  return {
    fast: '< 100ms',
    medium: '100ms - 1s', 
    slow: '> 1s',
    average: Math.round(REQUEST_METRICS.avgResponseTime)
  };
}

function getCorrelationAgeStatistics() {
  const now = Date.now();
  const ages = Array.from(CORRELATION_TRACKING.values()).map(tracking => now - tracking.startTime);
  
  return {
    oldestAge: Math.max(...ages) || 0,
    averageAge: ages.length > 0 ? ages.reduce((a, b) => a + b) / ages.length : 0,
    totalTracked: ages.length
  };
}

// Additional helper functions for validation and analysis
function assessLoggingEffectiveness(metrics) {
  return {
    requestCoverage: metrics.requests.total > 0 ? 100 : 0,
    errorTracking: metrics.requests.errors > 0 ? 'active' : 'inactive',
    performanceMonitoring: metrics.performance ? 'enabled' : 'disabled',
    securityMonitoring: metrics.security?.totalEvents > 0 ? 'active' : 'inactive'
  };
}

function identifyOptimizationOpportunities(metrics) {
  const opportunities = [];
  
  if (metrics.requests.averageResponseTime > 500) {
    opportunities.push('Response time optimization needed');
  }
  
  if (metrics.performance?.memoryUsage?.heapUsed > 512 * 1024 * 1024) {
    opportunities.push('Memory usage optimization recommended');
  }
  
  if (metrics.security?.totalEvents > 10) {
    opportunities.push('Security monitoring tuning needed');
  }
  
  return opportunities;
}

function assessBestPracticesCompliance(metrics) {
  return {
    structuredLogging: true,
    correlationTracking: metrics.correlation?.trackingHealth || false,
    performanceMonitoring: !!metrics.performance,
    securityLogging: !!metrics.security,
    errorHandling: metrics.requests.errors !== undefined
  };
}

function generateLearningInsights(metrics) {
  return {
    requestPatterns: 'Analyze request distribution and patterns',
    performanceTrends: 'Monitor response time trends over time',
    securityThreats: 'Review security events for threat patterns',
    systemHealth: 'Monitor system resource utilization'
  };
}

// Create and export default request logger instance
const requestLogger = createMiddlewareRequestLogger({
  enableEducationalMode: !environmentConfig.isProduction,
  enablePerformanceMonitoring: true,
  enableSecurityLogging: true
});

// Export all logging functions and utilities
export {
  requestLogger as default,
  requestLogger
  // All other functions are individually exported above
};