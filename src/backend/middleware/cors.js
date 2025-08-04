/**
 * @fileoverview Express.js CORS (Cross-Origin Resource Sharing) Middleware Implementation
 * @description Comprehensive CORS middleware for the Node.js tutorial project providing environment-aware
 * cross-origin request handling with Express v5.1.0 compatibility, PM2 cluster mode support, and 
 * production-ready security policies. Integrates with Helmet.js security middleware and implements
 * modern web security standards with educational demonstrations and cross-platform compatibility.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Environment-specific CORS policies with dynamic origin validation
 * - Security integration with comprehensive violation tracking and monitoring
 * - PM2 cluster mode compatibility with performance optimization
 * - Request correlation tracking for distributed debugging
 * - Cross-platform educational patterns for Flask comparison
 * - Production-ready deployment with zero-downtime reloads
 * - Comprehensive error handling and security event logging
 * 
 * Educational Value:
 * - Demonstrates modern CORS security patterns and browser same-origin policy
 * - Showcases environment-aware middleware configuration and deployment strategies
 * - Illustrates Express.js v5.1.0 middleware architecture and promise-based error handling
 * - Provides comprehensive security logging and violation monitoring examples
 * - Teaches production deployment patterns with PM2 cluster mode integration
 * 
 * Technology Integration:
 * - Express.js v5.1.0 middleware compatibility with promise support
 * - PM2 v6.0.8 cluster mode production deployment support
 * - Helmet.js security middleware integration for comprehensive protection
 * - Node.js v22.x LTS native security capabilities and ES Modules
 * - Cross-platform Flask compatibility for educational comparison
 */

// External library imports with version comments for dependency management
import cors from 'cors'; // v2.8.5 - Express.js CORS middleware library for configurable cross-origin resource sharing

// Internal imports for CORS configuration and security management
import {
  createCorsConfig,
  createCorsMiddleware,
  logCorsEvent
} from '../security/cors.config.js';

// Environment configuration imports for deployment-specific settings
import {
  environmentConfig
} from '../config/environment.js';

// Extract specific environment properties for CORS configuration
const { currentEnvironment, isProduction, security } = environmentConfig;

// Logging utilities for CORS activity tracking and security monitoring
import logger, {
  info as logInfo,
  warn as logWarn,
  error as logError,
  logSecurityEvent,
  generateRequestId
} from '../utils/logger.js';

// Error handling imports for comprehensive CORS error management
import {
  HTTPError,
  SecurityError,
  createErrorResponse,
  formatErrorForLogging
} from '../utils/error-types.js';

// Global CORS middleware cache for performance optimization in production environments
const CORS_MIDDLEWARE_CACHE = new Map();

// CORS violation counter for security monitoring and pattern analysis
const CORS_VIOLATION_COUNTER = new Map();

// Default CORS options for baseline security configuration
const DEFAULT_CORS_OPTIONS = {
  credentials: false,
  optionsSuccessStatus: 200
};

/**
 * Configures CORS middleware based on the current environment with appropriate security policies,
 * origin validation, and performance optimization. Creates environment-specific CORS configuration
 * using security policies that range from permissive development settings to strict production
 * security controls with comprehensive monitoring and violation tracking.
 * 
 * @param {Object} [options={}] - Custom CORS configuration options to override defaults
 * @param {Array|string|Function} [options.origin] - Custom origin configuration for specific requirements
 * @param {Array} [options.methods] - Allowed HTTP methods override for API-specific needs
 * @param {Array} [options.allowedHeaders] - Custom allowed headers for application requirements
 * @param {boolean} [options.credentials] - Enable credentials support for authenticated requests
 * @param {number} [options.maxAge] - Preflight cache duration for performance optimization
 * @param {boolean} [options.enableCaching] - Enable CORS middleware caching for performance
 * @returns {Function} Configured Express.js CORS middleware function with environment-specific policies and comprehensive error handling
 */
export function configureCorsForEnvironment(options = {}) {
  try {
    // Detect current environment using environmentConfig.currentEnvironment for appropriate policy selection
    const environment = options.environment || currentEnvironment;
    const cacheKey = `cors-${environment}-${JSON.stringify(options)}`;
    
    logInfo('Configuring CORS middleware for environment', {
      environment,
      isProduction,
      customOptions: Object.keys(options).length > 0,
      cacheEnabled: options.enableCaching !== false
    });

    // Check cache for existing CORS middleware to improve performance
    if (options.enableCaching !== false && CORS_MIDDLEWARE_CACHE.has(cacheKey)) {
      logInfo('Using cached CORS middleware configuration', { cacheKey, environment });
      return CORS_MIDDLEWARE_CACHE.get(cacheKey);
    }

    // Create environment-specific CORS configuration using createCorsConfig from security module
    const baseConfig = createCorsConfig(environment, {
      security: security.cors || {},
      customOptions: options
    });

    // Apply custom options and overrides from input parameters to base configuration
    const corsOptions = createCorsOptions(environment, {
      ...baseConfig,
      ...options
    });

    // Set up CORS violation logging and security event tracking for monitoring
    corsOptions.origin = createOriginValidator(corsOptions.origin, environment);

    // Configure error handling for CORS failures with appropriate response sanitization
    const corsMiddleware = createCorsMiddleware(corsOptions);

    // Initialize request correlation tracking for CORS request debugging and monitoring
    const enhancedCorsMiddleware = (req, res, next) => {
      // Generate correlation ID for distributed request tracking
      if (!req.correlationId) {
        req.correlationId = generateRequestId({ prefix: 'cors' });
      }

      // Log CORS request initiation for monitoring and debugging
      logCorsActivity('request-initiated', {
        method: req.method,
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
        environment
      }, corsOptions);

      // Apply performance optimizations including preflight caching and origin validation efficiency
      if (req.method === 'OPTIONS') {
        // Enhanced preflight handling with caching optimization
        res.set('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
        
        // Set preflight cache headers for performance
        if (corsOptions.maxAge) {
          res.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
        }
      }

      // Execute CORS middleware with enhanced error handling
      corsMiddleware(req, res, (error) => {
        if (error) {
          // Handle CORS errors with comprehensive logging and security tracking
          return handleCorsError(error, req, res, next);
        }

        // Log successful CORS validation
        logCorsActivity('request-validated', {
          method: req.method,
          origin: req.get('Origin'),
          allowed: true,
          correlationId: req.correlationId
        }, corsOptions);

        next();
      });
    };

    // Cache configured CORS middleware for improved performance and consistency
    if (options.enableCaching !== false) {
      CORS_MIDDLEWARE_CACHE.set(cacheKey, enhancedCorsMiddleware);
      
      // Set cache expiration for dynamic configuration updates
      setTimeout(() => {
        CORS_MIDDLEWARE_CACHE.delete(cacheKey);
        logInfo('CORS middleware cache expired', { cacheKey, environment });
      }, isProduction ? 3600000 : 300000); // 1 hour production, 5 minutes development
    }

    // Log CORS middleware configuration initialization with security policy details
    logInfo('CORS middleware configured successfully', {
      environment,
      allowedOrigins: corsOptions.origin ? 'configured' : 'all',
      credentials: corsOptions.credentials,
      cached: options.enableCaching !== false,
      correlationSupport: true
    });

    // Return configured CORS middleware ready for Express.js application integration
    return enhancedCorsMiddleware;

  } catch (error) {
    // Log configuration error with comprehensive context for debugging
    logError('Failed to configure CORS middleware', formatErrorForLogging(error, {
      environment: currentEnvironment,
      requestId: generateRequestId({ prefix: 'cors-config-error' }),
      options
    }));

    // Return fallback CORS middleware for graceful degradation
    return createFallbackCorsMiddleware(options);
  }
}

/**
 * Handles CORS-related errors including origin violations, method restrictions, and header policy
 * breaches with comprehensive logging, security event tracking, and appropriate error responses
 * based on environment security requirements and violation severity assessment.
 * 
 * @param {Error} error - CORS error instance with violation details and context information
 * @param {Object} request - Express.js request object with origin and header information
 * @param {Object} response - Express.js response object for error response generation
 * @param {Function} next - Express.js next middleware function for error handling continuation
 * @returns {void} No return value, handles error response and logging side effects
 */
export function handleCorsError(error, request, response, next) {
  try {
    // Analyze CORS error type and determine appropriate security response level
    const errorType = error.name || 'CorsError';
    const origin = request.get('Origin') || 'unknown';
    const method = request.method;
    const requestHeaders = request.get('Access-Control-Request-Headers');

    // Generate request correlation ID for error tracking and debugging
    const correlationId = request.correlationId || generateRequestId({ prefix: 'cors-error' });

    // Classify CORS violation severity based on error type and security implications
    const violationSeverity = classifyCorsViolationSeverity(error, {
      origin,
      method,
      environment: currentEnvironment,
      userAgent: request.get('User-Agent')
    });

    // Update CORS violation counters and security metrics for monitoring
    const violationKey = `${origin}-${errorType}`;
    const currentCount = CORS_VIOLATION_COUNTER.get(violationKey) || 0;
    CORS_VIOLATION_COUNTER.set(violationKey, currentCount + 1);

    // Log security event using logCorsEvent with comprehensive violation context
    const securityEvent = {
      type: 'cors-violation',
      severity: violationSeverity,
      origin,
      method,
      requestHeaders,
      errorMessage: error.message,
      userAgent: request.get('User-Agent'),
      ip: request.ip || request.connection?.remoteAddress,
      correlationId,
      timestamp: new Date().toISOString(),
      violationCount: currentCount + 1,
      environment: currentEnvironment
    };

    logSecurityEvent('CORS violation detected', securityEvent);

    // Create SecurityError instance for comprehensive CORS violation tracking
    const securityError = new SecurityError(
      'CORS policy violation detected',
      'cors-violation',
      {
        violationDetails: {
          type: errorType,
          severity: violationSeverity,
          origin,
          method,
          requestHeaders
        },
        clientIp: request.ip,
        userAgent: request.get('User-Agent'),
        requestId: correlationId,
        originalError: error
      }
    );

    // Trigger security alerts if violation thresholds are exceeded
    if (currentCount + 1 > 5) { // More than 5 violations from same origin/error type
      logWarn('CORS violation threshold exceeded', {
        origin,
        errorType,
        violationCount: currentCount + 1,
        correlationId,
        securityRecommendation: 'Consider origin blocking or rate limiting'
      });

      // Emit security alert for monitoring systems
      logSecurityEvent('CORS violation threshold exceeded', {
        ...securityEvent,
        alertLevel: 'high',
        recommendedAction: 'origin-monitoring'
      });
    }

    // Sanitize error response based on environment to prevent information disclosure
    const sanitizedMessage = isProduction ? 
      'Cross-origin request not allowed' : 
      `CORS Error: ${error.message}`;

    // Send appropriate HTTP error response with CORS-compliant headers
    const corsErrorResponse = {
      error: {
        message: sanitizedMessage,
        type: 'CorsError',
        correlationId,
        timestamp: new Date().toISOString()
      }
    };

    // Set security headers and CORS error response
    response.status(403);
    response.set({
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'Vary': 'Origin'
    });

    // Include debugging information in development environment
    if (!isProduction) {
      corsErrorResponse.debug = {
        origin,
        method,
        requestHeaders,
        errorDetails: error.stack
      };
    }

    response.json(corsErrorResponse);

    // Continue Express.js middleware chain with error handling
    // Don't call next(error) as we've handled the response

  } catch (handlingError) {
    // Log error handling failure for debugging and monitoring
    logError('Failed to handle CORS error', formatErrorForLogging(handlingError, {
      originalError: error.message,
      correlationId: request.correlationId,
      environment: currentEnvironment
    }));

    // Fallback error response for error handling failures
    response.status(500).json({
      error: {
        message: 'Internal server error during CORS handling',
        correlationId: request.correlationId || generateRequestId({ prefix: 'cors-fallback' })
      }
    });
  }
}

/**
 * Creates comprehensive CORS options object by merging environment-specific defaults, security
 * requirements, and custom overrides for optimal cross-origin protection and functionality
 * balance in different deployment environments with performance optimization.
 * 
 * @param {string} environment - Target environment name for configuration selection
 * @param {Object} customOptions - Custom CORS options to merge with environment defaults
 * @returns {Object} Complete CORS options object with origin validation, security policies, and performance optimization
 */
export function createCorsOptions(environment, customOptions = {}) {
  try {
    // Load environment-specific CORS defaults from security configuration
    const environmentDefaults = getEnvironmentCorsDefaults(environment);

    // Apply custom options and overrides while maintaining security requirements
    const mergedOptions = {
      ...DEFAULT_CORS_OPTIONS,
      ...environmentDefaults,
      ...customOptions
    };

    // Configure origin validation function with environment-appropriate policies
    if (!mergedOptions.origin && environment === 'production') {
      // Production requires explicit origin configuration for security
      mergedOptions.origin = security.cors?.allowedOrigins || false;
    } else if (!mergedOptions.origin && environment === 'development') {
      // Development allows more permissive origin policies
      mergedOptions.origin = true; // Allow all origins in development
    }

    // Set up allowed methods and headers based on environment security level
    mergedOptions.methods = mergedOptions.methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];
    mergedOptions.allowedHeaders = mergedOptions.allowedHeaders || [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Correlation-ID'
    ];

    // Configure credentials handling with HTTPS enforcement in production
    if (mergedOptions.credentials && isProduction) {
      logWarn('CORS credentials enabled in production', {
        environment,
        recommendation: 'Ensure HTTPS is enforced for credential security'
      });
    }

    // Set preflight cache duration for performance optimization
    mergedOptions.maxAge = mergedOptions.maxAge || (isProduction ? 86400 : 3600); // 24h prod, 1h dev

    // Add CORS violation tracking and security event logging
    const originalOrigin = mergedOptions.origin;
    mergedOptions.origin = createOriginValidator(originalOrigin, environment);

    // Validate final CORS options for security effectiveness and compliance
    validateCorsOptions(mergedOptions, environment);

    logInfo('CORS options created successfully', {
      environment,
      credentialsEnabled: mergedOptions.credentials,
      originPolicy: typeof mergedOptions.origin,
      maxAge: mergedOptions.maxAge,
      methodsCount: mergedOptions.methods.length,
      headersCount: mergedOptions.allowedHeaders.length
    });

    // Return complete CORS options ready for middleware integration
    return mergedOptions;

  } catch (error) {
    logError('Failed to create CORS options', formatErrorForLogging(error, {
      environment,
      customOptions: Object.keys(customOptions),
      requestId: generateRequestId({ prefix: 'cors-options-error' })
    }));

    // Return safe default options for error recovery
    return {
      ...DEFAULT_CORS_OPTIONS,
      origin: environment === 'production' ? false : true,
      methods: ['GET', 'HEAD', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  }
}

/**
 * Validates incoming CORS requests against security policies including origin verification,
 * method validation, and header checking with comprehensive logging and violation tracking
 * for security monitoring and compliance enforcement.
 * 
 * @param {Object} request - Express.js request object with CORS headers and origin information
 * @param {Object} corsConfig - CORS configuration object with security policies and validation rules
 * @returns {Object} CORS validation result with security status, violations, and recommendation for request handling
 */
export function validateCorsRequest(request, corsConfig) {
  try {
    const validationResult = {
      isValid: true,
      violations: [],
      recommendations: [],
      securityScore: 100,
      timestamp: new Date().toISOString(),
      correlationId: request.correlationId || generateRequestId({ prefix: 'cors-validation' })
    };

    // Extract origin, method, and headers from CORS request for validation
    const origin = request.get('Origin');
    const method = request.method;
    const requestHeaders = request.get('Access-Control-Request-Headers');
    const userAgent = request.get('User-Agent');

    // Validate request origin against environment-specific whitelist policies
    const originValidation = validateOrigin(origin, corsConfig.origin, currentEnvironment);
    if (!originValidation.isValid) {
      validationResult.isValid = false;
      validationResult.violations.push({
        type: 'origin-violation',
        severity: 'high',
        message: originValidation.message,
        origin,
        recommendation: 'Verify origin against allowed list'
      });
      validationResult.securityScore -= 30;
    }

    // Check HTTP method against allowed methods configuration
    const methodValidation = validateMethod(method, corsConfig.methods);
    if (!methodValidation.isValid) {
      validationResult.isValid = false;
      validationResult.violations.push({
        type: 'method-violation',
        severity: 'medium',
        message: methodValidation.message,
        method,
        allowedMethods: corsConfig.methods,
        recommendation: 'Use allowed HTTP methods only'
      });
      validationResult.securityScore -= 20;
    }

    // Validate request headers against security policy and allowed headers
    if (requestHeaders) {
      const headerValidation = validateHeaders(requestHeaders, corsConfig.allowedHeaders);
      if (!headerValidation.isValid) {
        validationResult.violations.push({
          type: 'header-violation',
          severity: 'low',
          message: headerValidation.message,
          requestHeaders,
          allowedHeaders: corsConfig.allowedHeaders,
          recommendation: 'Remove disallowed headers from request'
        });
        validationResult.securityScore -= 10;
      }
    }

    // Verify credentials handling compliance with HTTPS requirements
    if (corsConfig.credentials && !request.secure && isProduction) {
      validationResult.violations.push({
        type: 'credentials-security-violation',
        severity: 'high',
        message: 'Credentials enabled without HTTPS in production',
        recommendation: 'Enforce HTTPS for credential-enabled requests'
      });
      validationResult.securityScore -= 25;
    }

    // Check for suspicious user agent patterns
    if (userAgent) {
      const userAgentValidation = validateUserAgent(userAgent);
      if (!userAgentValidation.isValid) {
        validationResult.violations.push({
          type: 'user-agent-suspicious',
          severity: 'low',
          message: userAgentValidation.message,
          userAgent: userAgent.substring(0, 100), // Truncate for logging
          recommendation: 'Monitor for bot or malicious activity'
        });
        validationResult.securityScore -= 5;
      }
    }

    // Log validation results and security violations for monitoring
    if (validationResult.violations.length > 0) {
      logWarn('CORS validation violations detected', {
        correlationId: validationResult.correlationId,
        violationCount: validationResult.violations.length,
        securityScore: validationResult.securityScore,
        origin,
        method,
        environment: currentEnvironment
      });

      // Log individual violations for detailed security monitoring
      validationResult.violations.forEach(violation => {
        logCorsEvent(violation.type, {
          severity: violation.severity,
          origin,
          method,
          userAgent: userAgent?.substring(0, 100),
          correlationId: validationResult.correlationId
        });
      });
    }

    // Generate validation report with security recommendations
    validationResult.summary = {
      totalViolations: validationResult.violations.length,
      highSeverityViolations: validationResult.violations.filter(v => v.severity === 'high').length,
      securityRating: validationResult.securityScore >= 80 ? 'good' : 
                     validationResult.securityScore >= 60 ? 'warning' : 'critical',
      recommendedAction: validationResult.isValid ? 'allow' : 'block'
    };

    // Return comprehensive validation result for middleware processing
    return validationResult;

  } catch (error) {
    logError('CORS validation error', formatErrorForLogging(error, {
      correlationId: request.correlationId,
      origin: request.get('Origin'),
      method: request.method
    }));

    // Return safe validation result for error scenarios
    return {
      isValid: false,
      violations: [{
        type: 'validation-error',
        severity: 'high',
        message: 'CORS validation failed due to internal error',
        recommendation: 'Review validation system'
      }],
      securityScore: 0,
      correlationId: request.correlationId || generateRequestId({ prefix: 'cors-validation-error' })
    };
  }
}

/**
 * Logs CORS-related activities including successful requests, policy violations, and security
 * events with structured output for monitoring, debugging, and compliance tracking in production
 * environments and educational analysis with correlation support.
 * 
 * @param {string} activityType - Type of CORS activity for categorization and filtering
 * @param {Object} requestContext - Request context information for correlation and debugging
 * @param {Object} corsContext - CORS-specific context including policies and configuration
 * @returns {void} No return value, performs structured logging side effect for CORS activity tracking
 */
export function logCorsActivity(activityType, requestContext, corsContext = {}) {
  try {
    // Classify CORS activity type and determine appropriate logging level
    const logLevel = determineLogLevel(activityType);
    const timestamp = new Date().toISOString();

    // Generate request correlation ID for distributed request tracking
    const correlationId = requestContext.correlationId || 
                         generateRequestId({ prefix: 'cors-activity' });

    // Extract and sanitize request context for security logging
    const sanitizedContext = {
      method: requestContext.method,
      origin: requestContext.origin || 'none',
      userAgent: requestContext.userAgent ? 
                requestContext.userAgent.substring(0, 100) : 'unknown',
      correlationId,
      environment: requestContext.environment || currentEnvironment,
      allowed: requestContext.allowed,
      ip: requestContext.ip ? maskIpAddress(requestContext.ip) : 'unknown'
    };

    // Format CORS activity with structured output for monitoring systems
    const activityLog = {
      level: logLevel.toUpperCase(),
      type: 'cors-activity',
      activity: activityType,
      timestamp,
      context: sanitizedContext,
      cors: {
        credentialsEnabled: corsContext.credentials || false,
        maxAge: corsContext.maxAge,
        methodsCount: corsContext.methods?.length || 0,
        originPolicy: typeof corsContext.origin
      },
      system: {
        pid: process.pid,
        environment: currentEnvironment,
        nodeVersion: process.version
      }
    };

    // Include timestamp, environment, and security policy context
    if (isProduction) {
      // Production logging with minimal sensitive information
      activityLog.context.userAgent = 'redacted-in-production';
      activityLog.context.ip = 'redacted-in-production';
    }

    // Add performance metrics if available
    if (requestContext.responseTime) {
      activityLog.performance = {
        responseTime: requestContext.responseTime,
        timestamp: timestamp
      };
    }

    // Log using appropriate logging method based on activity severity
    switch (logLevel) {
      case 'error':
        logError(`CORS Activity: ${activityType}`, activityLog);
        break;
      case 'warn':
        logWarn(`CORS Activity: ${activityType}`, activityLog);
        break;
      case 'info':
      default:
        logInfo(`CORS Activity: ${activityType}`, activityLog);
        break;
    }

    // Update CORS activity metrics and monitoring counters
    updateCorsActivityMetrics(activityType, sanitizedContext);

    // Emit educational logging for development environment
    if (!isProduction && activityType.includes('violation')) {
      logInfo('CORS Educational Note', {
        type: 'educational',
        concept: 'same-origin-policy',
        explanation: 'CORS violations occur when browser same-origin policy blocks cross-origin requests',
        solution: 'Configure CORS policies to allow specific origins, methods, and headers',
        correlationId,
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'
      });
    }

  } catch (error) {
    // Fallback logging for activity logging failures
    logError('Failed to log CORS activity', {
      activityType,
      error: error.message,
      correlationId: requestContext.correlationId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optimizes CORS middleware performance through caching, efficient origin validation, preflight
 * optimization, and request processing enhancements while maintaining security effectiveness
 * and policy compliance for high-traffic production environments.
 * 
 * @param {Function} corsMiddleware - Original CORS middleware function to optimize
 * @param {Object} performanceOptions - Performance optimization configuration options
 * @returns {Function} Performance-optimized CORS middleware with caching and efficient validation while maintaining security
 */
export function optimizeCorsPerformance(corsMiddleware, performanceOptions = {}) {
  try {
    const options = {
      enableOriginCache: performanceOptions.enableOriginCache !== false,
      enablePreflightCache: performanceOptions.enablePreflightCache !== false,
      cacheSize: performanceOptions.cacheSize || 1000,
      cacheTtl: performanceOptions.cacheTtl || (isProduction ? 3600000 : 300000), // 1h prod, 5m dev
      enableMetrics: performanceOptions.enableMetrics !== false,
      ...performanceOptions
    };

    // Implement origin validation caching for improved performance
    const originCache = new Map();
    const preflightCache = new Map();
    let metricsData = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    };

    logInfo('Optimizing CORS middleware performance', {
      originCacheEnabled: options.enableOriginCache,
      preflightCacheEnabled: options.enablePreflightCache,
      cacheSize: options.cacheSize,
      cacheTtl: options.cacheTtl,
      metricsEnabled: options.enableMetrics
    });

    // Return optimized CORS middleware with performance enhancements
    return (req, res, next) => {
      const startTime = Date.now();
      const origin = req.get('Origin');
      const method = req.method;
      const correlationId = req.correlationId || generateRequestId({ prefix: 'cors-optimized' });

      // Add request correlation tracking for performance monitoring
      req.correlationId = correlationId;

      // Optimize preflight request handling and response caching
      if (method === 'OPTIONS' && options.enablePreflightCache) {
        const preflightKey = `${origin}-${req.get('Access-Control-Request-Method')}-${req.get('Access-Control-Request-Headers')}`;
        
        if (preflightCache.has(preflightKey)) {
          const cachedResponse = preflightCache.get(preflightKey);
          
          // Apply cached preflight response
          Object.keys(cachedResponse.headers).forEach(header => {
            res.set(header, cachedResponse.headers[header]);
          });
          
          metricsData.cacheHits++;
          
          logInfo('CORS preflight cache hit', {
            correlationId,
            origin,
            cacheKey: preflightKey.substring(0, 50),
            responseTime: Date.now() - startTime
          });
          
          return res.status(200).end();
        }
      }

      // Efficient error handling with minimal performance impact
      const errorHandler = (error) => {
        if (error) {
          const responseTime = Date.now() - startTime;
          
          // Log performance metrics for error scenarios
          if (options.enableMetrics) {
            metricsData.totalRequests++;
            metricsData.averageResponseTime = 
              (metricsData.averageResponseTime + responseTime) / 2;
          }
          
          logWarn('CORS error in optimized middleware', {
            correlationId,
            error: error.message,
            responseTime,
            origin
          });
          
          return handleCorsError(error, req, res, next);
        }

        // Cache preflight responses for performance
        if (method === 'OPTIONS' && options.enablePreflightCache) {
          const preflightKey = `${origin}-${req.get('Access-Control-Request-Method')}-${req.get('Access-Control-Request-Headers')}`;
          const headers = {};
          
          // Extract CORS headers for caching
          ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 
           'Access-Control-Allow-Headers', 'Access-Control-Max-Age'].forEach(header => {
            const value = res.get(header);
            if (value) headers[header] = value;
          });
          
          preflightCache.set(preflightKey, { headers, timestamp: Date.now() });
          
          // Cleanup old cache entries
          if (preflightCache.size > options.cacheSize) {
            const oldestKey = preflightCache.keys().next().value;
            preflightCache.delete(oldestKey);
          }
        }

        // Set up performance metrics collection and monitoring
        const responseTime = Date.now() - startTime;
        
        if (options.enableMetrics) {
          metricsData.totalRequests++;
          metricsData.averageResponseTime = 
            (metricsData.averageResponseTime + responseTime) / 2;
        }

        // Log successful CORS processing with performance data
        logCorsActivity('request-processed', {
          correlationId,
          origin,
          method,
          responseTime,
          cacheHit: false
        });

        next();
      };

      // Apply middleware-level optimizations for PM2 cluster compatibility
      corsMiddleware(req, res, errorHandler);
    };

  } catch (error) {
    logError('Failed to optimize CORS middleware', formatErrorForLogging(error, {
      performanceOptions: Object.keys(performanceOptions),
      requestId: generateRequestId({ prefix: 'cors-optimization-error' })
    }));

    // Return original middleware on optimization failure
    return corsMiddleware;
  }
}

/**
 * Creates development-friendly CORS middleware with relaxed security policies, enhanced logging,
 * and debugging capabilities to support hot reloading, development tools, and cross-origin testing
 * while maintaining essential security protections for educational environments.
 * 
 * @param {Object} devOptions - Development-specific CORS configuration options
 * @returns {Function} Development-optimized CORS middleware with enhanced debugging and permissive policies for local development
 */
export function createDevelopmentCors(devOptions = {}) {
  try {
    logInfo('Creating development CORS configuration', {
      environment: 'development',
      enhancedLogging: true,
      permissiveOrigins: true,
      debuggingEnabled: true
    });

    const developmentConfig = {
      // Configure permissive origin policies for local development servers
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, curl, Postman)
        if (!origin) {
          logInfo('CORS: Allowing request with no origin header', {
            type: 'development-cors',
            reason: 'no-origin-header',
            action: 'allowed'
          });
          return callback(null, true);
        }

        // Allow localhost and common development origins
        const developmentOrigins = [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://localhost:8080',
          'http://localhost:8000',
          ...(devOptions.additionalOrigins || [])
        ];

        const isAllowed = developmentOrigins.includes(origin) || 
                         origin.startsWith('http://localhost:') ||
                         origin.startsWith('http://127.0.0.1:');

        if (isAllowed) {
          logInfo('CORS: Development origin allowed', {
            origin,
            type: 'development-cors',
            action: 'allowed'
          });
          callback(null, true);
        } else {
          logWarn('CORS: Development origin blocked', {
            origin,
            type: 'development-cors',
            action: 'blocked',
            suggestion: 'Add origin to development whitelist'
          });
          callback(new Error(`Origin ${origin} not allowed in development CORS policy`), false);
        }
      },

      // Enable comprehensive CORS logging for development debugging
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      
      // Allow additional development headers and methods
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID',
        'X-Debug-Mode',
        'X-Development-Tool',
        'Cache-Control',
        'Pragma'
      ],

      // Set up development-specific error responses with detailed information
      credentials: devOptions.credentials || false,
      
      // Configure CORS for hot reloading and development tools compatibility
      maxAge: 300, // 5 minutes for development (shorter for rapid changes)
      
      // Set development-specific options success status
      optionsSuccessStatus: 200,
      
      // Enable preflight continue for development debugging
      preflightContinue: false
    };

    // Add educational logging for CORS learning and understanding
    const developmentMiddleware = configureCorsForEnvironment({
      ...developmentConfig,
      ...devOptions,
      environment: 'development'
    });

    // Enhance middleware with educational logging
    return (req, res, next) => {
      const startTime = Date.now();
      const origin = req.get('Origin');
      const method = req.method;

      // Add educational context for CORS learning
      if (method === 'OPTIONS') {
        logInfo('CORS Educational: Preflight request detected', {
          type: 'educational',
          concept: 'preflight-request',
          explanation: 'Browser is checking CORS permissions before sending actual request',
          origin,
          requestedMethod: req.get('Access-Control-Request-Method'),
          requestedHeaders: req.get('Access-Control-Request-Headers'),
          learnMore: 'Preflight requests are sent for complex CORS requests'
        });
      }

      // Execute development CORS middleware with enhanced logging
      developmentMiddleware(req, res, (error) => {
        const responseTime = Date.now() - startTime;

        if (error) {
          logWarn('CORS Development Error', {
            error: error.message,
            origin,
            method,
            responseTime,
            type: 'development-cors-error',
            debugging: {
              origin,
              method,
              headers: req.headers,
              suggestion: 'Check development CORS configuration'
            }
          });
          
          return handleCorsError(error, req, res, next);
        }

        // Log successful CORS processing with educational context
        logInfo('CORS Development Success', {
          origin,
          method,
          responseTime,
          type: 'development-cors-success',
          educational: {
            concept: 'cors-success',
            explanation: 'Cross-origin request successfully validated and allowed'
          }
        });

        next();
      });
    };

  } catch (error) {
    logError('Failed to create development CORS middleware', formatErrorForLogging(error, {
      devOptions: Object.keys(devOptions),
      requestId: generateRequestId({ prefix: 'dev-cors-error' })
    }));

    // Return permissive fallback for development
    return cors({
      origin: true,
      credentials: false,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS']
    });
  }
}

/**
 * Creates production-hardened CORS middleware with strict security policies, minimal attack
 * surface, comprehensive monitoring, and enterprise-grade protection against cross-origin attacks
 * while enabling necessary business functionality with zero-downtime deployment support.
 * 
 * @param {Object} prodOptions - Production-specific CORS configuration options
 * @returns {Function} Production-hardened CORS middleware with strict security policies and enterprise monitoring capabilities
 */
export function createProductionCors(prodOptions = {}) {
  try {
    logInfo('Creating production CORS configuration', {
      environment: 'production',
      strictSecurity: true,
      monitoringEnabled: true,
      enterpriseGrade: true
    });

    const productionConfig = {
      // Configure strict origin whitelist with only approved production domains
      origin: (origin, callback) => {
        const allowedOrigins = prodOptions.allowedOrigins || 
                              security.cors?.allowedOrigins || 
                              [];

        // Block requests with no origin in production for security
        if (!origin) {
          const error = new SecurityError(
            'Requests without origin header not allowed in production',
            'cors-no-origin',
            {
              severity: 'medium',
              environment: 'production',
              securityPolicy: 'strict-origin-required'
            }
          );
          
          logSecurityEvent('CORS: No origin header in production', {
            type: 'cors-security-violation',
            severity: 'medium',
            action: 'blocked',
            reason: 'no-origin-header-production'
          });
          
          return callback(error, false);
        }

        // Validate against production whitelist
        const isAllowed = Array.isArray(allowedOrigins) && allowedOrigins.includes(origin);
        
        if (isAllowed) {
          logInfo('CORS: Production origin validated', {
            origin,
            type: 'production-cors',
            action: 'allowed',
            securityLevel: 'validated'
          });
          callback(null, true);
        } else {
          const error = new SecurityError(
            'Origin not in production whitelist',
            'cors-origin-violation',
            {
              origin,
              allowedOrigins: allowedOrigins.length,
              severity: 'high',
              environment: 'production'
            }
          );
          
          logSecurityEvent('CORS: Production origin violation', {
            origin,
            type: 'cors-security-violation',
            severity: 'high',
            action: 'blocked',
            allowedOriginsCount: allowedOrigins.length
          });
          
          callback(error, false);
        }
      },

      // Implement comprehensive CORS violation monitoring and alerting
      methods: prodOptions.methods || ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
      
      // Apply minimal error information disclosure for production security
      allowedHeaders: prodOptions.allowedHeaders || [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID'
      ],

      // Set up security event logging for compliance and monitoring
      credentials: prodOptions.credentials || false,
      
      // Configure PM2 cluster mode compatibility for production deployment
      maxAge: 86400, // 24 hours for production caching
      
      // Apply performance optimizations for high-traffic production environments
      optionsSuccessStatus: 200,
      preflightContinue: false
    };

    // Validate production CORS configuration
    if (!security.cors?.allowedOrigins || security.cors.allowedOrigins.length === 0) {
      logWarn('Production CORS warning: No allowed origins configured', {
        type: 'production-cors-warning',
        recommendation: 'Configure security.cors.allowedOrigins for production',
        securityRisk: 'high'
      });
    }

    // Create production CORS middleware with monitoring
    const productionMiddleware = configureCorsForEnvironment({
      ...productionConfig,
      ...prodOptions,
      environment: 'production'
    });

    // Return enterprise-grade production CORS middleware with comprehensive security
    return (req, res, next) => {
      const startTime = Date.now();
      const origin = req.get('Origin');
      const method = req.method;
      const correlationId = req.correlationId || generateRequestId({ prefix: 'prod-cors' });

      // Add production security headers
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });

      // Execute production CORS middleware with enterprise monitoring
      productionMiddleware(req, res, (error) => {
        const responseTime = Date.now() - startTime;

        if (error) {
          // Comprehensive security logging for production violations
          logSecurityEvent('Production CORS violation', {
            error: error.message,
            origin,
            method,
            correlationId,
            responseTime,
            securityLevel: 'production',
            userAgent: req.get('User-Agent')?.substring(0, 100),
            ip: req.ip,
            violationType: 'cors-policy-violation'
          });

          // Update production security metrics
          updateProductionSecurityMetrics('cors-violation', {
            origin,
            method,
            timestamp: new Date().toISOString()
          });

          return handleCorsError(error, req, res, next);
        }

        // Log successful production CORS validation
        logInfo('Production CORS validated', {
          origin,
          method,
          correlationId,
          responseTime,
          securityLevel: 'production-validated',
          type: 'production-cors-success'
        });

        // Update production success metrics
        updateProductionSecurityMetrics('cors-success', {
          origin,
          method,
          responseTime
        });

        next();
      });
    };

  } catch (error) {
    logError('Failed to create production CORS middleware', formatErrorForLogging(error, {
      prodOptions: Object.keys(prodOptions),
      requestId: generateRequestId({ prefix: 'prod-cors-error' }),
      environment: 'production'
    }));

    // Return secure fallback for production errors
    return cors({
      origin: false, // Block all origins on configuration error
      credentials: false,
      methods: ['GET', 'HEAD', 'POST']
    });
  }
}

// Helper Functions for CORS Implementation

/**
 * Creates origin validator function with caching and security monitoring
 * @private
 * @param {*} originalOrigin - Original origin configuration
 * @param {string} environment - Environment name
 * @returns {Function} Origin validator function
 */
function createOriginValidator(originalOrigin, environment) {
  if (typeof originalOrigin === 'function') {
    return originalOrigin;
  }

  return (origin, callback) => {
    // Handle array of allowed origins
    if (Array.isArray(originalOrigin)) {
      const isAllowed = originalOrigin.includes(origin);
      return callback(null, isAllowed);
    }

    // Handle boolean configuration
    if (typeof originalOrigin === 'boolean') {
      return callback(null, originalOrigin);
    }

    // Handle string configuration
    if (typeof originalOrigin === 'string') {
      return callback(null, origin === originalOrigin);
    }

    // Default fallback
    return callback(null, environment !== 'production');
  };
}

/**
 * Gets environment-specific CORS defaults
 * @private
 * @param {string} environment - Environment name
 * @returns {Object} Environment CORS defaults
 */
function getEnvironmentCorsDefaults(environment) {
  const defaults = {
    development: {
      origin: true,
      credentials: false,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Correlation-ID'],
      maxAge: 3600
    },
    production: {
      origin: false,
      credentials: false,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      maxAge: 86400
    },
    test: {
      origin: true,
      credentials: false,
      methods: ['GET', 'HEAD', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 0
    }
  };

  return defaults[environment] || defaults.development;
}

/**
 * Validates CORS options for security and compliance
 * @private
 * @param {Object} options - CORS options to validate
 * @param {string} environment - Environment name
 */
function validateCorsOptions(options, environment) {
  if (environment === 'production') {
    if (options.origin === true) {
      logWarn('Production CORS warning: Allowing all origins is insecure', {
        recommendation: 'Configure specific allowed origins for production'
      });
    }

    if (options.credentials && !options.origin) {
      logWarn('Production CORS warning: Credentials with wildcard origin is not allowed', {
        recommendation: 'Configure specific origins when using credentials'
      });
    }
  }
}

/**
 * Validates origin against allowed origins
 * @private
 * @param {string} origin - Request origin
 * @param {*} allowedOrigin - Allowed origin configuration
 * @param {string} environment - Environment name
 * @returns {Object} Validation result
 */
function validateOrigin(origin, allowedOrigin, environment) {
  if (environment === 'development' && allowedOrigin === true) {
    return { isValid: true, message: 'All origins allowed in development' };
  }

  if (Array.isArray(allowedOrigin)) {
    const isValid = allowedOrigin.includes(origin);
    return {
      isValid,
      message: isValid ? 'Origin allowed' : `Origin ${origin} not in allowed list`
    };
  }

  if (typeof allowedOrigin === 'boolean') {
    return {
      isValid: allowedOrigin,
      message: allowedOrigin ? 'All origins allowed' : 'No origins allowed'
    };
  }

  return { isValid: false, message: 'Invalid origin configuration' };
}

/**
 * Validates HTTP method against allowed methods
 * @private
 * @param {string} method - HTTP method
 * @param {Array} allowedMethods - Allowed methods
 * @returns {Object} Validation result
 */
function validateMethod(method, allowedMethods) {
  const isValid = allowedMethods.includes(method);
  return {
    isValid,
    message: isValid ? 'Method allowed' : `Method ${method} not allowed`
  };
}

/**
 * Validates request headers against allowed headers
 * @private
 * @param {string} requestHeaders - Request headers
 * @param {Array} allowedHeaders - Allowed headers
 * @returns {Object} Validation result
 */
function validateHeaders(requestHeaders, allowedHeaders) {
  const headers = requestHeaders.split(',').map(h => h.trim());
  const disallowedHeaders = headers.filter(h => !allowedHeaders.includes(h));
  
  return {
    isValid: disallowedHeaders.length === 0,
    message: disallowedHeaders.length > 0 ? 
      `Disallowed headers: ${disallowedHeaders.join(', ')}` : 
      'All headers allowed'
  };
}

/**
 * Validates user agent for suspicious patterns
 * @private
 * @param {string} userAgent - User agent string
 * @returns {Object} Validation result
 */
function validateUserAgent(userAgent) {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /hack/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  return {
    isValid: !isSuspicious,
    message: isSuspicious ? 'Suspicious user agent detected' : 'User agent valid'
  };
}

/**
 * Classifies CORS violation severity
 * @private
 * @param {Error} error - CORS error
 * @param {Object} context - Error context
 * @returns {string} Severity level
 */
function classifyCorsViolationSeverity(error, context) {
  if (context.environment === 'production') {
    return 'high';
  }

  if (error.message.includes('origin')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determines log level for activity type
 * @private
 * @param {string} activityType - Activity type
 * @returns {string} Log level
 */
function determineLogLevel(activityType) {
  if (activityType.includes('violation') || activityType.includes('error')) {
    return 'warn';
  }

  if (activityType.includes('blocked') || activityType.includes('denied')) {
    return 'warn';
  }

  return 'info';
}

/**
 * Masks IP address for privacy
 * @private
 * @param {string} ip - IP address
 * @returns {string} Masked IP
 */
function maskIpAddress(ip) {
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return 'masked';
}

/**
 * Updates CORS activity metrics
 * @private
 * @param {string} activityType - Activity type
 * @param {Object} context - Activity context
 */
function updateCorsActivityMetrics(activityType, context) {
  // Implementation would update metrics collection
  // This is a placeholder for actual metrics implementation
}

/**
 * Updates production security metrics
 * @private
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 */
function updateProductionSecurityMetrics(eventType, data) {
  // Implementation would update production metrics
  // This is a placeholder for actual production metrics
}

/**
 * Creates fallback CORS middleware for error scenarios
 * @private
 * @param {Object} options - Fallback options
 * @returns {Function} Fallback middleware
 */
function createFallbackCorsMiddleware(options) {
  logWarn('Using fallback CORS middleware due to configuration error');
  
  return cors({
    origin: currentEnvironment === 'production' ? false : true,
    credentials: false,
    methods: ['GET', 'HEAD', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
}

// Export default CORS middleware configured for current environment
export const corsMiddleware = configureCorsForEnvironment();

// Log CORS middleware initialization
logInfo('CORS middleware module initialized', {
  version: '1.0.0',
  environment: currentEnvironment,
  isProduction,
  features: [
    'environment-aware-configuration',
    'security-violation-tracking', 
    'pm2-cluster-compatibility',
    'request-correlation-tracking',
    'performance-optimization',
    'educational-logging'
  ],
  exports: [
    'corsMiddleware',
    'configureCorsForEnvironment',
    'handleCorsError',
    'createCorsOptions',
    'validateCorsRequest',
    'logCorsActivity',
    'optimizeCorsPerformance',
    'createDevelopmentCors',
    'createProductionCors'
  ],
  timestamp: new Date().toISOString()
});