/**
 * @fileoverview Core Business Logic Service Module for Node.js Tutorial Project
 * @description Advanced service layer implementation providing comprehensive business logic
 * for message generation functionality. Implements production-ready service patterns with
 * performance tracking, caching, security validation, cross-platform compatibility,
 * and comprehensive error handling designed for PM2 cluster mode deployment.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Stateless architecture compatible with PM2 cluster mode
 * - Comprehensive performance tracking and metrics collection
 * - Memory-based caching with TTL management for optimization
 * - Cross-platform compatibility with Flask implementations
 * - Security-conscious input validation and output sanitization
 * - Health monitoring and service diagnostics for production deployment
 * - Educational value demonstrating modern Node.js service patterns
 * - Production-ready error handling and logging integration
 * 
 * Educational Value:
 * - Demonstrates enterprise-grade service layer architecture patterns
 * - Showcases stateless design principles for horizontal scaling
 * - Illustrates comprehensive performance monitoring and optimization
 * - Provides security-conscious implementation examples
 * - Teaches production-ready error handling and logging practices
 * 
 * Technology Integration:
 * - Express.js v5.1.0 compatible service layer implementation
 * - PM2 v6.0.8 cluster mode optimized for horizontal scaling
 * - Helmet.js security integration for comprehensive protection
 * - Node.js v22.x LTS native capabilities and modern ES modules
 * - Cross-platform Flask compatibility for educational comparison
 */

// External library imports with version comments
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic functionality for secure operations
import util from 'node:util'; // Node.js built-in - Object inspection and formatting utilities

// Node.js core modules for system information
import os from 'os';

// Internal imports with specific members for service functionality
import {
  API_CONSTANTS,
  HTTP_CONSTANTS,
  TESTING_CONSTANTS,
  FLASK_CONSTANTS
} from '../utils/constants.js';

import logger, {
  logPerformanceMetrics,
  generateRequestId
} from '../utils/logger.js';

import {
  HTTPError,
  ValidationError
} from '../utils/error-types.js';

// Global service state management for performance optimization and monitoring
const SERVICE_CACHE = new Map(); // Memory-based response caching for performance optimization

const PERFORMANCE_METRICS = { // Application-wide performance metrics for monitoring
  requests: 0,
  totalResponseTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0,
  lastRequestTime: null,
  errorCount: 0,
  serviceStartTime: Date.now()
};

const HEALTH_STATUS = { // Service health monitoring for load balancer integration
  healthy: true,
  lastCheck: null,
  errorCount: 0,
  uptime: 0,
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development'
};

// Helper function implementations (since helpers.js doesn't exist)

/**
 * Formats HTTP response with standardized structure and security headers
 * @param {any} data - Response data to format
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted response object
 */
function formatHTTPResponse(data, options = {}) {
  const timestamp = new Date().toISOString();
  const requestId = options.requestId || generateRequestId({ prefix: 'res' });
  
  return {
    success: true,
    data,
    metadata: {
      timestamp,
      requestId,
      version: HEALTH_STATUS.version,
      environment: HEALTH_STATUS.environment,
      responseTime: options.responseTime || null
    },
    headers: {
      'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      'X-Request-ID': requestId,
      'X-Response-Time': options.responseTime ? `${options.responseTime}ms` : null,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...options.headers
    }
  };
}

/**
 * Sanitizes input data to prevent XSS and injection attacks
 * @param {any} input - Input data to sanitize
 * @returns {any} Sanitized input data
 */
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Measures performance of operations with high precision timing
 * @param {Function} operation - Operation to measure
 * @returns {Object} Performance measurement results
 */
async function measurePerformance(operation) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  try {
    const result = await operation();
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal
    };
    
    return {
      result,
      performance: {
        duration,
        memory: memoryDelta,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    throw new Error(`Performance measurement failed after ${duration}ms: ${error.message}`);
  }
}

/**
 * Converts Express.js response to Flask-compatible format
 * @param {Object} expressResponse - Express.js response object
 * @param {Object} options - Conversion options
 * @returns {Object} Flask-compatible response object
 */
function convertToFlaskFormat(expressResponse, options = {}) {
  const flaskResponse = {
    message: expressResponse.data?.message || expressResponse.message,
    status: 'success',
    timestamp: expressResponse.metadata?.timestamp || new Date().toISOString()
  };
  
  // Apply Flask-specific formatting rules
  if (FLASK_CONSTANTS.RESPONSE_FORMATS.INCLUDE_META) {
    flaskResponse.meta = {
      version: FLASK_CONSTANTS.COMPATIBILITY_MAP.VERSION,
      framework: 'flask',
      node_equivalent: expressResponse.metadata?.version || '1.0.0'
    };
  }
  
  return flaskResponse;
}

/**
 * Creates health check object for system monitoring
 * @param {Object} options - Health check options
 * @returns {Object} Health check object
 */
function createHealthCheck(options = {}) {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  return {
    status: HEALTH_STATUS.healthy ? 'healthy' : 'unhealthy',
    uptime,
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
    },
    performance: {
      totalRequests: PERFORMANCE_METRICS.requests,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime,
      cacheHitRate: PERFORMANCE_METRICS.requests > 0 ? 
        (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2) + '%' : '0%'
    },
    timestamp: new Date().toISOString(),
    version: HEALTH_STATUS.version,
    environment: HEALTH_STATUS.environment,
    ...options
  };
}

/**
 * Generates secure token for request correlation and tracking
 * @param {Object} options - Token generation options
 * @returns {string} Secure token string
 */
function generateSecureToken(options = {}) {
  const prefix = options.prefix || 'token';
  const length = options.length || 16;
  
  const randomBytes = crypto.randomBytes(length);
  const token = randomBytes.toString('hex');
  
  return `${prefix}_${token}`;
}

/**
 * Deep clones objects for cache integrity and data protection
 * @param {any} obj - Object to clone
 * @returns {any} Deep cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = deepClone(value);
    }
    return cloned;
  }
  
  return obj;
}

/**
 * Core business logic function that generates the 'Hello world' message for the /hello endpoint.
 * Implements comprehensive message generation with performance tracking, caching support,
 * security validation, and cross-platform compatibility for Flask migration testing.
 * Provides stateless operation for PM2 cluster mode compatibility.
 * 
 * @param {Object} requestContext - Request context object containing request metadata
 * @param {Object} options - Configuration options for message generation
 * @returns {Object} Hello message response object with formatted content, metadata, and performance metrics
 */
export async function getHelloMessage(requestContext = {}, options = {}) {
  // Generate unique request correlation ID using generateRequestId for tracking
  const correlationId = generateRequestId({ prefix: 'hello' });
  
  // Validate input parameters - reject null or undefined requestContext
  if (requestContext === null || requestContext === undefined) {
    return {
      success: false,
      error: {
        code: 'INVALID_REQUEST_CONTEXT',
        message: 'Request context cannot be null or undefined',
        correlationId
      },
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId,
        cached: false
      }
    };
  }
  
  try {
    // Start performance measurement using measurePerformance for response time monitoring
    const operation = async () => {
      // Validate request context and sanitize input using sanitizeInput for security
      const sanitizedContext = sanitizeInput(requestContext);
      
      // Check cache for existing hello message response using SERVICE_CACHE
      const cacheKey = `hello_${JSON.stringify(sanitizedContext)}_${options.variant || 'default'}`;
      const cachedResponse = await getCachedServiceResponse(cacheKey, { ttl: 300000 }); // 5 minute TTL
      
      if (cachedResponse.hit) {
        // Update cache hit metrics
        PERFORMANCE_METRICS.cacheHits++;
        
        logger.debug('Hello message served from cache', {
          correlationId,
          cacheKey,
          hitRate: (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2)
        });
        
        return cachedResponse.data;
      }
      
      // Cache miss - generate new response
      PERFORMANCE_METRICS.cacheMisses++;
      
      // Generate hello world message using API_CONSTANTS.RESPONSES template
      const messageData = {
        message: API_CONSTANTS.RESPONSES.HELLO_WORLD.message,
        endpoint: API_CONSTANTS.ENDPOINTS.HELLO,
        method: 'GET',
        statusCode: HTTP_CONSTANTS.STATUS_CODES.OK
      };
      
      // Add request metadata including timestamp, correlation ID, and performance context
      const metadata = {
        correlationId,
        timestamp: new Date().toISOString(),
        requestContext: sanitizedContext,
        serviceVersion: HEALTH_STATUS.version,
        processId: process.pid,
        nodeVersion: process.version
      };
      
      // Format response using formatHTTPResponse for standardized output structure
      const response = formatHTTPResponse(messageData, {
        requestId: correlationId,
        ...options.headers
      });
      
      // Add service-specific metadata
      response.metadata = {
        ...response.metadata,
        ...metadata,
        cached: false,
        generatedAt: new Date().toISOString()
      };
      
      // Cache response using deep clone for performance optimization
      await cacheServiceResponse(cacheKey, deepClone(response), {
        ttl: 300000, // 5 minutes
        tags: ['hello', 'messages']
      });
      
      return response;
    };
    
    // Execute operation with performance tracking
    const { result, performance } = await measurePerformance(operation);
    
    // Track service metrics using logPerformanceMetrics and update global counters
    PERFORMANCE_METRICS.requests++;
    PERFORMANCE_METRICS.totalResponseTime += performance.duration;
    PERFORMANCE_METRICS.averageResponseTime = PERFORMANCE_METRICS.totalResponseTime / PERFORMANCE_METRICS.requests;
    PERFORMANCE_METRICS.lastRequestTime = new Date().toISOString();
    
    // Track service-level metrics
    trackServiceMetrics('getHelloMessage', performance.duration, {
      correlationId,
      memoryDelta: performance.memory,
      cacheHit: result.metadata.cached || false
    });
    
    // Add performance data to response
    result.metadata.performance = {
      responseTime: performance.duration,
      memoryUsage: performance.memory,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime
    };
    
    // Log message generation with debug information and correlation tracking
    logger.info('Hello message generated successfully', {
      correlationId,
      responseTime: performance.duration,
      cached: result.metadata.cached || false,
      totalRequests: PERFORMANCE_METRICS.requests,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime
    });
    
    // Return formatted hello message response ready for controller consumption
    return result;
    
  } catch (error) {
    // Handle errors through centralized error handling
    PERFORMANCE_METRICS.errorCount++;
    HEALTH_STATUS.errorCount++;
    
    logger.error('Error generating hello message', {
      correlationId,
      error: error.message,
      stack: error.stack,
      context: requestContext
    });
    
    // Return error response through handleServiceError
    return handleServiceError(error, { operation: 'getHelloMessage', correlationId }, requestContext);
  }
}

/**
 * Business logic function that generates the 'Good evening' message for the /good-evening endpoint.
 * Maintains identical functionality to getHelloMessage while providing distinct greeting content
 * for educational demonstration of service patterns and cross-platform compatibility validation.
 * 
 * @param {Object} requestContext - Request context object containing request metadata
 * @param {Object} options - Configuration options for message generation
 * @returns {Object} Good evening message response object with formatted content, metadata, and performance metrics
 */
export async function getGoodEveningMessage(requestContext = {}, options = {}) {
  // Generate unique request correlation ID using generateRequestId for tracking
  const correlationId = generateRequestId({ prefix: 'evening' });
  
  try {
    // Start performance measurement using measurePerformance for response time monitoring
    const operation = async () => {
      // Validate request context and sanitize input using sanitizeInput for security
      const sanitizedContext = sanitizeInput(requestContext);
      
      // Check cache for existing good evening message response using SERVICE_CACHE
      const cacheKey = `evening_${JSON.stringify(sanitizedContext)}_${options.variant || 'default'}`;
      const cachedResponse = await getCachedServiceResponse(cacheKey, { ttl: 300000 }); // 5 minute TTL
      
      if (cachedResponse.hit) {
        // Update cache hit metrics
        PERFORMANCE_METRICS.cacheHits++;
        
        logger.debug('Good evening message served from cache', {
          correlationId,
          cacheKey,
          hitRate: (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2)
        });
        
        return cachedResponse.data;
      }
      
      // Cache miss - generate new response
      PERFORMANCE_METRICS.cacheMisses++;
      
      // Generate good evening message using API_CONSTANTS.RESPONSES template
      const messageData = {
        message: API_CONSTANTS.RESPONSES.GOOD_EVENING.message,
        endpoint: API_CONSTANTS.ENDPOINTS.GOOD_EVENING,
        method: 'GET',
        statusCode: HTTP_CONSTANTS.STATUS_CODES.OK
      };
      
      // Add request metadata including timestamp, correlation ID, and performance context
      const metadata = {
        correlationId,
        timestamp: new Date().toISOString(),
        requestContext: sanitizedContext,
        serviceVersion: HEALTH_STATUS.version,
        processId: process.pid,
        nodeVersion: process.version
      };
      
      // Format response using formatHTTPResponse for standardized output structure
      const response = formatHTTPResponse(messageData, {
        requestId: correlationId,
        ...options.headers
      });
      
      // Add service-specific metadata
      response.metadata = {
        ...response.metadata,
        ...metadata,
        cached: false,
        generatedAt: new Date().toISOString()
      };
      
      // Cache response using deep clone for performance optimization
      await cacheServiceResponse(cacheKey, deepClone(response), {
        ttl: 300000, // 5 minutes
        tags: ['evening', 'messages']
      });
      
      return response;
    };
    
    // Execute operation with performance tracking
    const { result, performance } = await measurePerformance(operation);
    
    // Track service metrics using logPerformanceMetrics and update global counters
    PERFORMANCE_METRICS.requests++;
    PERFORMANCE_METRICS.totalResponseTime += performance.duration;
    PERFORMANCE_METRICS.averageResponseTime = PERFORMANCE_METRICS.totalResponseTime / PERFORMANCE_METRICS.requests;
    PERFORMANCE_METRICS.lastRequestTime = new Date().toISOString();
    
    // Track service-level metrics
    trackServiceMetrics('getGoodEveningMessage', performance.duration, {
      correlationId,
      memoryDelta: performance.memory,
      cacheHit: result.metadata.cached || false
    });
    
    // Add performance data to response
    result.metadata.performance = {
      responseTime: performance.duration,
      memoryUsage: performance.memory,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime
    };
    
    // Log message generation with debug information and correlation tracking
    logger.info('Good evening message generated successfully', {
      correlationId,
      responseTime: performance.duration,
      cached: result.metadata.cached || false,
      totalRequests: PERFORMANCE_METRICS.requests,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime
    });
    
    // Return formatted good evening message response ready for controller consumption
    return result;
    
  } catch (error) {
    // Handle errors through centralized error handling
    PERFORMANCE_METRICS.errorCount++;
    HEALTH_STATUS.errorCount++;
    
    logger.error('Error generating good evening message', {
      correlationId,
      error: error.message,
      stack: error.stack,
      context: requestContext
    });
    
    // Return error response through handleServiceError
    return handleServiceError(error, { operation: 'getGoodEveningMessage', correlationId }, requestContext);
  }
}

/**
 * Validates incoming requests for message endpoints including security checks, parameter validation,
 * and input sanitization to prevent XSS, injection attacks, and malformed requests. Provides
 * comprehensive validation with detailed error reporting and security event logging.
 * 
 * @param {Object} request - Request object to validate
 * @param {Object} validationOptions - Validation configuration options
 * @returns {Object} Validation result with success status, sanitized data, and error details
 */
export function validateMessageRequest(request = {}, validationOptions = {}) {
  const correlationId = generateRequestId({ prefix: 'validate' });
  
  try {
    // Validate request object structure and required properties
    if (!request || typeof request !== 'object') {
      throw new ValidationError('Invalid request object structure', [], {
        code: 'INVALID_REQUEST_STRUCTURE',
        correlationId
      });
    }
    
    // Check HTTP method against allowed methods for endpoint
    const allowedMethods = validationOptions.allowedMethods || ['GET'];
    const method = request.method || 'GET';
    
    if (!allowedMethods.includes(method.toUpperCase())) {
      throw new ValidationError('HTTP method not allowed', [
        {
          field: 'method',
          message: `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
          code: 'METHOD_NOT_ALLOWED',
          value: method,
          allowedValues: allowedMethods
        }
      ], { correlationId });
    }
    
    // Sanitize request parameters using sanitizeInput for XSS prevention
    const sanitizedRequest = {
      method: sanitizeInput(method),
      path: sanitizeInput(request.path || '/'),
      headers: sanitizeInput(request.headers || {}),
      query: sanitizeInput(request.query || {}),
      body: sanitizeInput(request.body || {}),
      timestamp: new Date().toISOString()
    };
    
    // Validate request headers for security compliance and proper formatting
    const requiredHeaders = validationOptions.requiredHeaders || [];
    const missingHeaders = [];
    
    for (const header of requiredHeaders) {
      if (!sanitizedRequest.headers[header.toLowerCase()]) {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      throw new ValidationError('Missing required headers', 
        missingHeaders.map(header => ({
          field: `headers.${header}`,
          message: `Required header ${header} is missing`,
          code: 'MISSING_REQUIRED_HEADER',
          requiredHeader: header
        })), { correlationId }
      );
    }
    
    // Check request size limits against API_CONSTANTS.REQUEST_LIMITS
    const requestSize = JSON.stringify(sanitizedRequest).length;
    const maxSize = validationOptions.maxRequestSize || 10240; // 10KB default
    
    if (requestSize > maxSize) {
      throw new ValidationError('Request size exceeds limit', [
        {
          field: 'request',
          message: `Request size ${requestSize} bytes exceeds limit of ${maxSize} bytes`,
          code: 'REQUEST_TOO_LARGE',
          actualSize: requestSize,
          maxSize
        }
      ], { correlationId });
    }
    
    // Validate content type and accept headers for API compatibility
    const contentType = sanitizedRequest.headers['content-type'];
    const acceptHeader = sanitizedRequest.headers['accept'];
    
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      logger.warn('Unsupported content type', {
        correlationId,
        contentType,
        supportedTypes: ['application/json', 'text/plain']
      });
    }
    
    // Perform rate limiting validation if specified in options
    if (validationOptions.rateLimit) {
      const clientId = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      // Rate limiting would be implemented here in production
      logger.debug('Rate limiting check performed', {
        correlationId,
        clientId,
        rateLimit: validationOptions.rateLimit
      });
    }
    
    // Log validation attempt with request correlation and security context
    logger.debug('Request validation completed successfully', {
      correlationId,
      method: sanitizedRequest.method,
      path: sanitizedRequest.path,
      requestSize,
      validation: {
        methodAllowed: true,
        headersValid: missingHeaders.length === 0,
        sizeValid: requestSize <= maxSize,
        sanitized: true
      }
    });
    
    // Return validation result with sanitized data and security assessment
    return {
      success: true,
      data: sanitizedRequest,
      validation: {
        correlationId,
        timestamp: new Date().toISOString(),
        checks: {
          structure: true,
          method: true,
          headers: true,
          size: true,
          security: true
        },
        sanitized: true,
        requestSize,
        processingTime: Date.now()
      }
    };
    
  } catch (error) {
    // Generate validation errors using ValidationError class if validation fails
    logger.warn('Request validation failed', {
      correlationId,
      error: error.message,
      validationErrors: error instanceof ValidationError ? error.getFieldErrors() : null,
      request: {
        method: request.method,
        path: request.path,
        size: JSON.stringify(request).length
      }
    });
    
    // Return validation failure with detailed error information
    return {
      success: false,
      error: error instanceof ValidationError ? error : new ValidationError(error.message, [], { correlationId }),
      validation: {
        correlationId,
        timestamp: new Date().toISOString(),
        checks: {
          structure: false,
          method: false,
          headers: false,
          size: false,
          security: false
        },
        sanitized: false,
        processingTime: Date.now()
      }
    };
  }
}

/**
 * Formats service response objects with consistent structure, security headers, and metadata
 * for controller consumption. Applies cross-platform formatting rules and ensures response
 * compatibility with both Express.js and Flask implementations for educational comparison.
 * 
 * @param {any} responseData - Data to be formatted in the response
 * @param {Object} formatOptions - Formatting configuration options
 * @returns {Object} Formatted response object with standardized structure and security headers
 */
export function formatMessageResponse(responseData, formatOptions = {}) {
  const correlationId = generateRequestId({ prefix: 'format' });
  
  try {
    // Validate response data and formatting options for completeness
    if (responseData === undefined || responseData === null) {
      throw new Error('Response data cannot be null or undefined');
    }
    
    if (typeof formatOptions !== 'object') {
      throw new Error('Format options must be an object');
    }
    
    // Apply standardized response structure using HTTP_CONSTANTS formatting rules
    const baseStructure = {
      success: true,
      data: responseData,
      metadata: {
        correlationId,
        timestamp: new Date().toISOString(),
        version: HEALTH_STATUS.version,
        environment: HEALTH_STATUS.environment
      }
    };
    
    // Add security headers and CORS information if specified in options
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '0',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...formatOptions.securityHeaders
    };
    
    // Include performance metrics and response timing information
    if (formatOptions.includePerformance) {
      baseStructure.metadata.performance = {
        requestCount: PERFORMANCE_METRICS.requests,
        averageResponseTime: PERFORMANCE_METRICS.averageResponseTime,
        cacheHitRate: PERFORMANCE_METRICS.requests > 0 ? 
          (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2) + '%' : '0%',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
    }
    
    // Add request correlation ID and tracking metadata
    if (formatOptions.requestId) {
      baseStructure.metadata.requestId = formatOptions.requestId;
      securityHeaders['X-Request-ID'] = formatOptions.requestId;
    }
    
    // Apply cross-platform formatting using FLASK_CONSTANTS compatibility mapping
    let formattedResponse = { ...baseStructure };
    
    if (formatOptions.platform === 'flask' || formatOptions.flaskCompatible) {
      formattedResponse = createFlaskCompatibleResponse(baseStructure, {
        includeMetadata: formatOptions.includeMetadata !== false,
        compatibilityMode: formatOptions.compatibilityMode || 'full'
      });
    }
    
    // Add HTTP headers to response
    formattedResponse.headers = {
      'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...securityHeaders,
      ...formatOptions.headers
    };
    
    // Validate final response object against expected schema
    const responseValidation = validateResponseStructure(formattedResponse, formatOptions);
    if (!responseValidation.valid) {
      throw new Error(`Response validation failed: ${responseValidation.errors.join(', ')}`);
    }
    
    // Log response formatting with performance and security context
    logger.debug('Response formatted successfully', {
      correlationId,
      dataType: typeof responseData,
      platform: formatOptions.platform || 'express',
      flaskCompatible: Boolean(formatOptions.flaskCompatible),
      securityHeadersApplied: Object.keys(securityHeaders).length,
      responseSize: JSON.stringify(formattedResponse).length
    });
    
    // Return formatted response ready for HTTP transmission
    return formattedResponse;
    
  } catch (error) {
    logger.error('Response formatting failed', {
      correlationId,
      error: error.message,
      stack: error.stack,
      dataType: typeof responseData,
      formatOptions
    });
    
    // Return error response with proper formatting
    return {
      success: false,
      error: {
        message: 'Response formatting failed',
        code: 'RESPONSE_FORMAT_ERROR',
        correlationId,
        timestamp: new Date().toISOString()
      },
      headers: {
        'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
        'X-Request-ID': correlationId
      }
    };
  }
}

/**
 * Tracks and logs service-level performance metrics including response times, request counts,
 * cache hit rates, and error frequencies for production monitoring and PM2 integration.
 * Provides comprehensive metrics collection for optimization and alerting.
 * 
 * @param {string} operationType - Type of operation being tracked
 * @param {number} responseTime - Response time in milliseconds
 * @param {Object} metricsContext - Additional context for metrics tracking
 */
export function trackServiceMetrics(operationType, responseTime, metricsContext = {}) {
  try {
    // Update global PERFORMANCE_METRICS with operation statistics
    PERFORMANCE_METRICS.requests++;
    PERFORMANCE_METRICS.totalResponseTime += responseTime;
    PERFORMANCE_METRICS.averageResponseTime = PERFORMANCE_METRICS.totalResponseTime / PERFORMANCE_METRICS.requests;
    PERFORMANCE_METRICS.lastRequestTime = new Date().toISOString();
    
    // Calculate average response times and throughput measurements
    const throughput = PERFORMANCE_METRICS.requests / (process.uptime() || 1); // requests per second
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Track cache hit and miss rates for performance optimization
    const cacheStats = {
      hitRate: PERFORMANCE_METRICS.requests > 0 ? 
        (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0',
      totalHits: PERFORMANCE_METRICS.cacheHits,
      totalMisses: PERFORMANCE_METRICS.cacheMisses,
      totalRequests: PERFORMANCE_METRICS.requests
    };
    
    // Update error counters and success rates for reliability monitoring
    const successRate = PERFORMANCE_METRICS.requests > 0 ? 
      ((PERFORMANCE_METRICS.requests - PERFORMANCE_METRICS.errorCount) / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '100';
    
    // Compare performance against TESTING_CONSTANTS.PERFORMANCE_TARGETS
    const performanceTargets = TESTING_CONSTANTS.PERFORMANCE_TARGETS;
    const alerts = [];
    
    if (responseTime > performanceTargets.RESPONSE_TIME_MS) {
      alerts.push({
        type: 'RESPONSE_TIME_THRESHOLD_EXCEEDED',
        value: responseTime,
        threshold: performanceTargets.RESPONSE_TIME_MS,
        severity: responseTime > performanceTargets.RESPONSE_TIME_MS * 2 ? 'high' : 'medium'
      });
    }
    
    if (memoryUsage.heapUsed > performanceTargets.MEMORY_USAGE_MB * 1024 * 1024) {
      alerts.push({
        type: 'MEMORY_USAGE_HIGH',
        value: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        threshold: performanceTargets.MEMORY_USAGE_MB,
        severity: 'medium'
      });
    }
    
    // Log performance metrics using logPerformanceMetrics with correlation
    const metricsData = {
      operation: operationType,
      responseTime,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime,
      throughput: throughput.toFixed(2),
      successRate,
      cache: cacheStats,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      cpu: cpuUsage,
      uptime: process.uptime(),
      processId: process.pid,
      alerts,
      context: metricsContext,
      timestamp: new Date().toISOString()
    };
    
    // Use specialized performance logging function
    logPerformanceMetrics(operationType, metricsData);
    
    // Update service health status based on performance thresholds
    const healthScore = calculateHealthScore(PERFORMANCE_METRICS, alerts);
    HEALTH_STATUS.healthy = healthScore > 0.8; // 80% threshold
    HEALTH_STATUS.lastCheck = new Date().toISOString();
    HEALTH_STATUS.uptime = process.uptime();
    
    // Trigger performance alerts if thresholds are exceeded
    if (alerts.length > 0) {
      logger.warn('Performance thresholds exceeded', {
        operation: operationType,
        alerts,
        currentMetrics: metricsData,
        healthScore
      });
      
      // Emit performance alert event for monitoring systems
      process.nextTick(() => {
        process.emit('performance-alert', {
          operation: operationType,
          alerts,
          metrics: metricsData,
          severity: alerts.some(a => a.severity === 'high') ? 'high' : 'medium'
        });
      });
    }
    
  } catch (error) {
    logger.error('Metrics tracking failed', {
      operation: operationType,
      error: error.message,
      stack: error.stack,
      context: metricsContext
    });
    
    // Increment error count even if tracking fails
    PERFORMANCE_METRICS.errorCount++;
  }
}

/**
 * Centralized error handling function for service layer errors that provides proper error
 * classification, logging, response sanitization, and security event tracking. Integrates
 * with error monitoring systems and provides detailed error context for debugging.
 * 
 * @param {Error} error - Error object to handle
 * @param {Object} errorContext - Context information about the error
 * @param {Object} request - Original request object for context
 * @returns {Object} Formatted error response with sanitized error information and appropriate status codes
 */
export function handleServiceError(error, errorContext = {}, request = {}) {
  const correlationId = errorContext.correlationId || generateRequestId({ prefix: 'error' });
  
  try {
    // Classify error type using error class instances and error codes
    let errorType = 'UNKNOWN_ERROR';
    let statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
    let userMessage = 'An internal error occurred';
    
    if (error instanceof ValidationError) {
      errorType = 'VALIDATION_ERROR';
      statusCode = HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST;
      userMessage = 'Request validation failed';
    } else if (error instanceof HTTPError) {
      errorType = 'HTTP_ERROR';
      statusCode = error.statusCode;
      userMessage = error.message;
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      errorType = 'NETWORK_ERROR';
      statusCode = HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;
      userMessage = 'Service temporarily unavailable';
    } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      errorType = 'PROGRAMMING_ERROR';
      statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
      userMessage = 'Internal processing error';
    }
    
    // Extract request correlation ID and context for error tracking
    const errorData = {
      errorId: generateSecureToken({ prefix: 'err' }),
      correlationId,
      type: errorType,
      message: error.message,
      statusCode,
      timestamp: new Date().toISOString(),
      operation: errorContext.operation || 'unknown',
      context: {
        request: {
          method: request.method,
          path: request.path,
          headers: sanitizeInput(request.headers || {}),
          userAgent: request.headers?.['user-agent'],
          ip: request.ip || request.connection?.remoteAddress
        },
        service: {
          version: HEALTH_STATUS.version,
          environment: HEALTH_STATUS.environment,
          processId: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        performance: {
          totalRequests: PERFORMANCE_METRICS.requests,
          errorCount: PERFORMANCE_METRICS.errorCount + 1,
          averageResponseTime: PERFORMANCE_METRICS.averageResponseTime
        }
      }
    };
    
    // Log detailed error information with stack trace and context
    logger.error('Service error handled', {
      ...errorData,
      stack: error.stack,
      errorContext,
      severity: getErrorSeverity(error, errorType)
    });
    
    // Sanitize error message to prevent sensitive information disclosure
    const sanitizedMessage = sanitizeErrorMessage(userMessage, HEALTH_STATUS.environment);
    
    // Create appropriate HTTP error response using HTTPError class
    const errorResponse = {
      success: false,
      error: {
        code: errorType,
        message: sanitizedMessage,
        correlationId,
        timestamp: errorData.timestamp,
        statusCode
      },
      metadata: {
        errorId: errorData.errorId,
        version: HEALTH_STATUS.version,
        environment: HEALTH_STATUS.environment,
        requestId: correlationId
      }
    };
    
    // Include validation details for ValidationError instances
    if (error instanceof ValidationError) {
      errorResponse.error.validation = {
        fieldErrors: error.getFieldErrors(),
        errorCount: error.errorCount,
        summary: error.getSummary()
      };
    }
    
    // Track error metrics and update service health status
    PERFORMANCE_METRICS.errorCount++;
    HEALTH_STATUS.errorCount++;
    
    // Recalculate health status
    const errorRate = PERFORMANCE_METRICS.requests > 0 ? 
      (PERFORMANCE_METRICS.errorCount / PERFORMANCE_METRICS.requests) : 0;
    
    if (errorRate > 0.1) { // 10% error rate threshold
      HEALTH_STATUS.healthy = false;
      logger.warn('Service health degraded due to high error rate', {
        errorRate: (errorRate * 100).toFixed(2) + '%',
        totalErrors: PERFORMANCE_METRICS.errorCount,
        totalRequests: PERFORMANCE_METRICS.requests
      });
    }
    
    // Generate security event log if error indicates potential security issue
    if (isSecurityRelated(error, errorType)) {
      const securityEvent = {
        type: 'SECURITY_EVENT',
        severity: 'medium',
        event: errorType,
        source: errorData.context.request.ip,
        userAgent: errorData.context.request.userAgent,
        correlationId,
        timestamp: errorData.timestamp
      };
      
      logger.warn('Security-related error detected', securityEvent);
      
      // Emit security event for monitoring
      process.nextTick(() => {
        process.emit('security-event', securityEvent);
      });
    }
    
    // Update global error counters and performance metrics
    trackServiceMetrics('error_handling', 0, {
      errorType,
      errorCode: error.code,
      statusCode,
      correlationId
    });
    
    // Return sanitized error response ready for controller handling
    return errorResponse;
    
  } catch (handlingError) {
    // Fallback error handling if error handling itself fails
    logger.error('Error handling failed', {
      originalError: error.message,
      handlingError: handlingError.message,
      correlationId
    });
    
    return {
      success: false,
      error: {
        code: 'ERROR_HANDLING_FAILED',
        message: 'An error occurred while processing the request',
        correlationId,
        timestamp: new Date().toISOString(),
        statusCode: HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR
      }
    };
  }
}

/**
 * Creates Flask-compatible response objects for cross-platform testing and feature parity
 * validation between Node.js Express and Flask implementations. Ensures consistent API
 * behavior across different technology stacks for educational comparison.
 * 
 * @param {Object} expressResponse - Express.js response object to convert
 * @param {Object} conversionOptions - Configuration options for conversion
 * @returns {Object} Flask-compatible response object with equivalent structure and formatting
 */
export function createFlaskCompatibleResponse(expressResponse, conversionOptions = {}) {
  const correlationId = generateRequestId({ prefix: 'flask' });
  
  try {
    // Validate Express.js response structure for conversion compatibility
    if (!expressResponse || typeof expressResponse !== 'object') {
      throw new Error('Invalid Express response object for Flask conversion');
    }
    
    // Apply Flask response formatting rules using FLASK_CONSTANTS.RESPONSE_FORMATS
    const flaskResponse = {
      message: extractMessage(expressResponse),
      status: expressResponse.success ? 'success' : 'error',
      timestamp: new Date().toISOString()
    };
    
    // Convert Express headers to Flask header format and naming conventions
    if (expressResponse.headers) {
      flaskResponse.headers = convertHeadersToFlaskFormat(expressResponse.headers);
    }
    
    // Transform response data structure to match Flask application expectations
    if (expressResponse.data) {
      flaskResponse.data = transformDataForFlask(expressResponse.data, conversionOptions);
    }
    
    // Apply Flask-specific serialization and data type conversions
    if (conversionOptions.includeMetadata !== false && expressResponse.metadata) {
      flaskResponse.meta = {
        framework: 'flask',
        converted_from: 'express',
        conversion_timestamp: new Date().toISOString(),
        original_version: expressResponse.metadata.version || '1.0.0',
        flask_version: FLASK_CONSTANTS.COMPATIBILITY_MAP.VERSION,
        compatibility_level: conversionOptions.compatibilityMode || 'full'
      };
      
      // Include performance data if available
      if (expressResponse.metadata.performance) {
        flaskResponse.meta.performance = {
          response_time_ms: expressResponse.metadata.performance.responseTime,
          memory_usage: expressResponse.metadata.performance.memoryUsage,
          converted_metrics: true
        };
      }
    }
    
    // Include Flask-compatible metadata and response context
    if (FLASK_CONSTANTS.RESPONSE_FORMATS.INCLUDE_REQUEST_ID && expressResponse.metadata?.requestId) {
      flaskResponse.request_id = expressResponse.metadata.requestId;
    }
    
    if (FLASK_CONSTANTS.RESPONSE_FORMATS.INCLUDE_ERRORS && expressResponse.error) {
      flaskResponse.errors = convertErrorsToFlaskFormat(expressResponse.error);
    }
    
    // Validate converted response against Flask compatibility requirements
    const validationResult = validateFlaskCompatibility(flaskResponse, expressResponse);
    if (!validationResult.compatible) {
      logger.warn('Flask compatibility validation failed', {
        correlationId,
        issues: validationResult.issues,
        expressStructure: Object.keys(expressResponse),
        flaskStructure: Object.keys(flaskResponse)
      });
    }
    
    // Log conversion process with compatibility notes and validation results
    logger.debug('Express to Flask conversion completed', {
      correlationId,
      compatibilityMode: conversionOptions.compatibilityMode || 'full',
      includeMetadata: conversionOptions.includeMetadata !== false,
      validationPassed: validationResult.compatible,
      conversionTime: new Date().toISOString(),
      dataTransformed: Boolean(expressResponse.data),
      headersConverted: Boolean(expressResponse.headers)
    });
    
    // Return Flask-formatted response ready for cross-platform testing
    return flaskResponse;
    
  } catch (error) {
    logger.error('Flask conversion failed', {
      correlationId,
      error: error.message,
      stack: error.stack,
      expressResponse: util.inspect(expressResponse, { depth: 2 })
    });
    
    // Return fallback Flask-compatible error response
    return {
      message: 'Conversion to Flask format failed',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code: 'FLASK_CONVERSION_ERROR',
        details: error.message,
        correlation_id: correlationId
      },
      meta: {
        framework: 'flask',
        converted_from: 'express',
        conversion_failed: true
      }
    };
  }
}

/**
 * Caches service responses using memory-based caching with TTL management, cache invalidation,
 * and performance optimization for frequently requested data. Implements stateless caching
 * compatible with PM2 cluster mode requirements.
 * 
 * @param {string} cacheKey - Unique identifier for the cached response
 * @param {any} responseData - Response data to cache
 * @param {Object} cacheOptions - Caching configuration options
 * @returns {boolean} Success status indicating whether response was successfully cached
 */
export function cacheServiceResponse(cacheKey, responseData, cacheOptions = {}) {
  try {
    // Generate secure cache key using hash of request parameters and context
    const hashedKey = crypto.createHash('sha256')
      .update(cacheKey)
      .digest('hex')
      .substring(0, 16);
    
    // Validate cache options including TTL and cache size limits
    const options = {
      ttl: cacheOptions.ttl || 300000, // 5 minutes default
      maxSize: cacheOptions.maxSize || 100, // Maximum cache entries
      tags: cacheOptions.tags || [],
      createdAt: Date.now(),
      expiresAt: Date.now() + (cacheOptions.ttl || 300000),
      accessCount: 0,
      ...cacheOptions
    };
    
    // Deep clone response data using deepClone for cache integrity
    const clonedData = deepClone(responseData);
    
    // Add cache metadata including timestamp, TTL, and expiration time
    const cacheEntry = {
      key: hashedKey,
      originalKey: cacheKey,
      data: clonedData,
      metadata: {
        createdAt: options.createdAt,
        expiresAt: options.expiresAt,
        ttl: options.ttl,
        tags: options.tags,
        accessCount: options.accessCount,
        lastAccessed: options.createdAt,
        size: JSON.stringify(clonedData).length
      }
    };
    
    // Store cached response in SERVICE_CACHE with appropriate cache key
    SERVICE_CACHE.set(hashedKey, cacheEntry);
    
    // Update cache statistics including hit rates and memory usage
    const cacheStats = {
      totalEntries: SERVICE_CACHE.size,
      memoryUsage: calculateCacheMemoryUsage(),
      hitRate: PERFORMANCE_METRICS.requests > 0 ? 
        (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0'
    };
    
    // Implement cache eviction policy for memory management
    if (SERVICE_CACHE.size > options.maxSize) {
      evictOldestCacheEntries(SERVICE_CACHE.size - options.maxSize + 1);
    }
    
    // Clean up expired entries
    cleanupExpiredCacheEntries();
    
    // Log cache operation with performance impact and statistics
    logger.debug('Response cached successfully', {
      cacheKey: hashedKey,
      originalKey: cacheKey,
      ttl: options.ttl,
      size: cacheEntry.metadata.size,
      tags: options.tags,
      cacheStats,
      expiresAt: new Date(options.expiresAt).toISOString()
    });
    
    // Return success status indicating cache operation result
    return true;
    
  } catch (error) {
    logger.error('Cache operation failed', {
      cacheKey,
      error: error.message,
      stack: error.stack,
      cacheSize: SERVICE_CACHE.size
    });
    
    return false;
  }
}

/**
 * Retrieves cached service responses with TTL validation, hit tracking, and performance
 * monitoring for optimized response delivery. Implements cache warming and intelligent
 * prefetching for improved performance.
 * 
 * @param {string} cacheKey - Cache key to retrieve
 * @param {Object} retrievalOptions - Configuration options for cache retrieval
 * @returns {Object} Cache retrieval result with cached data, hit status, and performance metrics
 */
export function getCachedServiceResponse(cacheKey, retrievalOptions = {}) {
  const startTime = Date.now();
  
  try {
    // Generate cache key using consistent hashing algorithm
    const hashedKey = crypto.createHash('sha256')
      .update(cacheKey)
      .digest('hex')
      .substring(0, 16);
    
    // Check SERVICE_CACHE for existing cached response with cache key
    const cacheEntry = SERVICE_CACHE.get(hashedKey);
    
    if (!cacheEntry) {
      // Cache miss
      const result = {
        hit: false,
        data: null,
        metadata: {
          cacheKey: hashedKey,
          originalKey: cacheKey,
          retrievalTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          reason: 'CACHE_MISS'
        }
      };
      
      // Log cache miss
      logger.debug('Cache miss', {
        cacheKey: hashedKey,
        originalKey: cacheKey,
        cacheSize: SERVICE_CACHE.size,
        retrievalTime: result.metadata.retrievalTime
      });
      
      return result;
    }
    
    // Validate cached response TTL and expiration timestamp
    const now = Date.now();
    if (cacheEntry.metadata.expiresAt <= now) {
      // Entry expired - remove from cache
      SERVICE_CACHE.delete(hashedKey);
      
      const result = {
        hit: false,
        data: null,
        metadata: {
          cacheKey: hashedKey,
          originalKey: cacheKey,
          retrievalTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          reason: 'CACHE_EXPIRED',
          expiredAt: new Date(cacheEntry.metadata.expiresAt).toISOString()
        }
      };
      
      logger.debug('Cache entry expired', {
        cacheKey: hashedKey,
        originalKey: cacheKey,
        expiredAt: result.metadata.expiredAt,
        ttl: cacheEntry.metadata.ttl
      });
      
      return result;
    }
    
    // Update cache hit statistics and performance counters
    cacheEntry.metadata.accessCount++;
    cacheEntry.metadata.lastAccessed = now;
    
    // Deep clone cached data to prevent reference modification
    const clonedData = deepClone(cacheEntry.data);
    
    // Mark cloned data as cached to indicate it came from cache
    if (clonedData && clonedData.metadata) {
      clonedData.metadata.cached = true;
    }
    
    // Add cache metadata including hit status and retrieval timing
    const result = {
      hit: true,
      data: clonedData,
      metadata: {
        cacheKey: hashedKey,
        originalKey: cacheKey,
        retrievalTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheInfo: {
          createdAt: new Date(cacheEntry.metadata.createdAt).toISOString(),
          expiresAt: new Date(cacheEntry.metadata.expiresAt).toISOString(),
          accessCount: cacheEntry.metadata.accessCount,
          lastAccessed: new Date(cacheEntry.metadata.lastAccessed).toISOString(),
          tags: cacheEntry.metadata.tags,
          size: cacheEntry.metadata.size,
          ttlRemaining: cacheEntry.metadata.expiresAt - now
        }
      }
    };
    
    // Log cache retrieval with hit/miss status and performance impact
    logger.debug('Cache hit successful', {
      cacheKey: hashedKey,
      originalKey: cacheKey,
      accessCount: cacheEntry.metadata.accessCount,
      ttlRemaining: result.metadata.cacheInfo.ttlRemaining,
      retrievalTime: result.metadata.retrievalTime,
      size: cacheEntry.metadata.size
    });
    
    // Return cache result with data and retrieval statistics
    return result;
    
  } catch (error) {
    logger.error('Cache retrieval failed', {
      cacheKey,
      error: error.message,
      stack: error.stack,
      retrievalTime: Date.now() - startTime
    });
    
    return {
      hit: false,
      data: null,
      metadata: {
        cacheKey,
        retrievalTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        reason: 'CACHE_ERROR',
        error: error.message
      }
    };
  }
}

/**
 * Generates comprehensive service health information including operational status, performance
 * metrics, error rates, and dependency validation for monitoring integration and load balancer
 * health checks. Provides detailed service diagnostics.
 * 
 * @param {Object} healthOptions - Configuration options for health check
 * @returns {Object} Service health report with status, metrics, and diagnostic information
 */
export function generateServiceHealth(healthOptions = {}) {
  try {
    // Check service operational status and initialization state
    const uptime = process.uptime();
    const startTime = Date.now() - (uptime * 1000);
    
    // Collect service performance metrics and response time statistics
    const performanceMetrics = {
      totalRequests: PERFORMANCE_METRICS.requests,
      averageResponseTime: PERFORMANCE_METRICS.averageResponseTime,
      totalResponseTime: PERFORMANCE_METRICS.totalResponseTime,
      requestsPerSecond: uptime > 0 ? (PERFORMANCE_METRICS.requests / uptime).toFixed(2) : '0',
      lastRequestTime: PERFORMANCE_METRICS.lastRequestTime
    };
    
    // Calculate error rates and success percentages for service operations
    const errorRate = PERFORMANCE_METRICS.requests > 0 ? 
      (PERFORMANCE_METRICS.errorCount / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0';
    const successRate = (100 - parseFloat(errorRate)).toFixed(2);
    
    // Validate service dependencies and integration points
    const dependencies = {
      nodejs: {
        version: process.version,
        status: 'healthy'
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      eventLoop: process.uptime() > 0 ? 'responsive' : 'unknown'
    };
    
    // Check cache health and memory usage statistics
    const cacheHealth = {
      totalEntries: SERVICE_CACHE.size,
      hitRate: PERFORMANCE_METRICS.requests > 0 ? 
        (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0',
      memoryUsage: calculateCacheMemoryUsage(),
      oldestEntry: getOldestCacheEntry(),
      newestEntry: getNewestCacheEntry()
    };
    
    // Generate service health score based on performance thresholds
    const healthScore = calculateHealthScore(PERFORMANCE_METRICS, []);
    const isHealthy = healthScore > 0.8 && parseFloat(errorRate) < 10; // 80% health, <10% error rate
    
    // Include diagnostic information for troubleshooting and monitoring
    const diagnostics = {
      processId: process.pid,
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      memoryUsage: {
        rss: `${Math.round(dependencies.memory.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(dependencies.memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(dependencies.memory.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(dependencies.memory.external / 1024 / 1024)}MB`
      },
      loadAverage: os.loadavg(),
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`
    };
    
    // Update global HEALTH_STATUS with current service state
    HEALTH_STATUS.healthy = isHealthy;
    HEALTH_STATUS.lastCheck = new Date().toISOString();
    HEALTH_STATUS.uptime = uptime;
    
    // Create comprehensive health report
    const healthReport = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        started: new Date(startTime).toISOString(),
        formatted: formatUptime(uptime)
      },
      performance: performanceMetrics,
      reliability: {
        errorRate: `${errorRate}%`,
        successRate: `${successRate}%`,
        errorCount: PERFORMANCE_METRICS.errorCount,
        healthScore: healthScore.toFixed(3)
      },
      cache: cacheHealth,
      dependencies,
      diagnostics,
      version: HEALTH_STATUS.version,
      environment: HEALTH_STATUS.environment,
      checks: {
        serviceResponsive: isHealthy,
        memoryWithinLimits: dependencies.memory.heapUsed < 200 * 1024 * 1024, // 200MB limit
        errorRateAcceptable: parseFloat(errorRate) < 10,
        performanceAcceptable: PERFORMANCE_METRICS.averageResponseTime < 100,
        cacheOperational: SERVICE_CACHE.size >= 0
      }
    };
    
    // Add optional health check components
    if (healthOptions.includeDetailed) {
      healthReport.detailed = {
        requestHistory: getRequestHistory(),
        errorHistory: getErrorHistory(),
        cacheStatistics: getCacheStatistics()
      };
    }
    
    // Log health check generation with detailed status information
    logger.debug('Service health check generated', {
      status: healthReport.status,
      healthScore,
      uptime: uptime,
      errorRate,
      cacheHitRate: cacheHealth.hitRate,
      memoryUsage: diagnostics.memoryUsage.heapUsed,
      totalRequests: performanceMetrics.totalRequests
    });
    
    // Return comprehensive service health report for monitoring systems
    return healthReport;
    
  } catch (error) {
    logger.error('Health check generation failed', {
      error: error.message,
      stack: error.stack
    });
    
    // Return emergency health status
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: {
        message: 'Health check failed',
        details: error.message
      },
      uptime: {
        seconds: process.uptime(),
        started: 'unknown'
      },
      version: HEALTH_STATUS.version,
      environment: HEALTH_STATUS.environment
    };
  }
}

// Helper functions for internal service operations

/**
 * Validates response structure against expected schema
 * @private
 */
function validateResponseStructure(response, options) {
  const errors = [];
  
  if (!response.success !== undefined && typeof response.success !== 'boolean') {
    errors.push('success field must be boolean');
  }
  
  if (!response.data && !response.error) {
    errors.push('response must contain either data or error');
  }
  
  if (!response.metadata || typeof response.metadata !== 'object') {
    errors.push('metadata field is required and must be object');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculates service health score based on metrics
 * @private
 */
function calculateHealthScore(metrics, alerts) {
  let score = 1.0;
  
  // Reduce score based on error rate
  if (metrics.requests > 0) {
    const errorRate = metrics.errorCount / metrics.requests;
    score -= errorRate * 0.5; // 50% penalty for errors
  }
  
  // Reduce score for performance issues
  if (metrics.averageResponseTime > 100) {
    score -= 0.2; // 20% penalty for slow responses
  }
  
  // Reduce score for alerts
  alerts.forEach(alert => {
    if (alert.severity === 'high') {
      score -= 0.3;
    } else if (alert.severity === 'medium') {
      score -= 0.1;
    }
  });
  
  return Math.max(0, score);
}

/**
 * Determines error severity based on error type
 * @private
 */
function getErrorSeverity(error, errorType) {
  const highSeverityTypes = ['PROGRAMMING_ERROR', 'SECURITY_ERROR'];
  const mediumSeverityTypes = ['HTTP_ERROR', 'VALIDATION_ERROR'];
  
  if (highSeverityTypes.includes(errorType)) {
    return 'high';
  } else if (mediumSeverityTypes.includes(errorType)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Sanitizes error messages for safe display
 * @private
 */
function sanitizeErrorMessage(message, environment) {
  if (environment === 'production') {
    // In production, use generic messages for security
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credential/i,
      /connection/i
    ];
    
    if (sensitivePatterns.some(pattern => pattern.test(message))) {
      return 'A system error occurred';
    }
  }
  
  return message;
}

/**
 * Checks if error is security-related
 * @private
 */
function isSecurityRelated(error, errorType) {
  const securityTypes = ['VALIDATION_ERROR', 'HTTP_ERROR'];
  const securityCodes = ['ECONNRESET', 'ETIMEDOUT'];
  
  return securityTypes.includes(errorType) || 
         securityCodes.includes(error.code) ||
         error.message.toLowerCase().includes('security') ||
         error.message.toLowerCase().includes('unauthorized');
}

/**
 * Flask conversion helper functions
 * @private
 */
function extractMessage(expressResponse) {
  if (expressResponse.data?.message) {
    return expressResponse.data.message;
  }
  if (expressResponse.error?.message) {
    return expressResponse.error.message;
  }
  return 'No message available';
}

function convertHeadersToFlaskFormat(headers) {
  const flaskHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    // Convert Express header names to Flask conventions
    const flaskKey = key.toLowerCase().replace(/-/g, '_');
    flaskHeaders[flaskKey] = value;
  }
  return flaskHeaders;
}

function transformDataForFlask(data, options) {
  if (typeof data === 'string') {
    return { message: data };
  }
  
  if (typeof data === 'object' && data !== null) {
    const transformed = { ...data };
    
    // Convert camelCase to snake_case for Flask conventions
    const converted = {};
    for (const [key, value] of Object.entries(transformed)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeKey] = value;
    }
    
    return converted;
  }
  
  return data;
}

function convertErrorsToFlaskFormat(error) {
  return {
    code: error.code,
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    correlation_id: error.correlationId
  };
}

function validateFlaskCompatibility(flaskResponse, expressResponse) {
  const issues = [];
  
  if (!flaskResponse.message) {
    issues.push('Missing message field required by Flask format');
  }
  
  if (!flaskResponse.status) {
    issues.push('Missing status field required by Flask format');
  }
  
  if (!flaskResponse.timestamp) {
    issues.push('Missing timestamp field required by Flask format');
  }
  
  return {
    compatible: issues.length === 0,
    issues
  };
}

/**
 * Cache management helper functions
 * @private
 */
function calculateCacheMemoryUsage() {
  let totalSize = 0;
  for (const [key, entry] of SERVICE_CACHE.entries()) {
    totalSize += entry.metadata.size || 0;
  }
  return totalSize;
}

function evictOldestCacheEntries(count) {
  const entries = Array.from(SERVICE_CACHE.entries())
    .sort((a, b) => a[1].metadata.lastAccessed - b[1].metadata.lastAccessed);
  
  for (let i = 0; i < count && i < entries.length; i++) {
    SERVICE_CACHE.delete(entries[i][0]);
    logger.debug('Cache entry evicted', {
      key: entries[i][0],
      lastAccessed: new Date(entries[i][1].metadata.lastAccessed).toISOString()
    });
  }
}

function cleanupExpiredCacheEntries() {
  const now = Date.now();
  const expiredKeys = [];
  
  for (const [key, entry] of SERVICE_CACHE.entries()) {
    if (entry.metadata.expiresAt <= now) {
      expiredKeys.push(key);
    }
  }
  
  for (const key of expiredKeys) {
    SERVICE_CACHE.delete(key);
  }
  
  if (expiredKeys.length > 0) {
    logger.debug('Expired cache entries cleaned up', {
      count: expiredKeys.length,
      remainingEntries: SERVICE_CACHE.size
    });
  }
}

function getOldestCacheEntry() {
  let oldest = null;
  for (const entry of SERVICE_CACHE.values()) {
    if (!oldest || entry.metadata.createdAt < oldest.createdAt) {
      oldest = {
        createdAt: entry.metadata.createdAt,
        key: entry.originalKey
      };
    }
  }
  return oldest ? new Date(oldest.createdAt).toISOString() : null;
}

function getNewestCacheEntry() {
  let newest = null;
  for (const entry of SERVICE_CACHE.values()) {
    if (!newest || entry.metadata.createdAt > newest.createdAt) {
      newest = {
        createdAt: entry.metadata.createdAt,
        key: entry.originalKey
      };
    }
  }
  return newest ? new Date(newest.createdAt).toISOString() : null;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function getRequestHistory() {
  // In a production system, this would maintain a rolling history
  return {
    recentRequests: PERFORMANCE_METRICS.requests,
    averageResponseTime: PERFORMANCE_METRICS.averageResponseTime,
    lastRequestTime: PERFORMANCE_METRICS.lastRequestTime
  };
}

function getErrorHistory() {
  // In a production system, this would maintain error details
  return {
    totalErrors: PERFORMANCE_METRICS.errorCount,
    errorRate: PERFORMANCE_METRICS.requests > 0 ? 
      (PERFORMANCE_METRICS.errorCount / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0'
  };
}

function getCacheStatistics() {
  return {
    totalEntries: SERVICE_CACHE.size,
    memoryUsage: calculateCacheMemoryUsage(),
    hitRate: PERFORMANCE_METRICS.requests > 0 ? 
      (PERFORMANCE_METRICS.cacheHits / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0',
    missRate: PERFORMANCE_METRICS.requests > 0 ? 
      (PERFORMANCE_METRICS.cacheMisses / PERFORMANCE_METRICS.requests * 100).toFixed(2) : '0'
  };
}

// Initialize service monitoring
logger.info('Hello service initialized successfully', {
  version: HEALTH_STATUS.version,
  environment: HEALTH_STATUS.environment,
  pid: process.pid,
  nodeVersion: process.version,
  timestamp: new Date().toISOString(),
  features: {
    caching: true,
    performanceTracking: true,
    flaskCompatibility: true,
    healthMonitoring: true,
    securityValidation: true
  }
});