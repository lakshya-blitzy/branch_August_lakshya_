/**
 * @fileoverview Comprehensive Mock HTTP Response Fixtures Module
 * @description Production-ready mock response generation for Node.js tutorial project
 * providing standardized mock responses for all API endpoints including hello, good-evening,
 * and health endpoints. Contains realistic mock data for success scenarios, error conditions,
 * security validations, performance testing, and cross-platform compatibility testing between
 * Express.js and Flask implementations.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive mock response generation patterns
 * - Showcases testing best practices for HTTP APIs
 * - Illustrates security testing with Helmet.js validation
 * - Provides performance testing mock data and benchmarks
 * - Demonstrates cross-platform compatibility testing patterns
 * 
 * Technology Stack:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 mock response patterns
 * - Jest/Mocha testing framework compatibility
 * - Helmet.js v8.1.0 security header mocking
 * - PM2 v6.0.8 cluster mode health check mocking
 * - SuperTest HTTP testing integration
 * 
 * Architecture:
 * - Comprehensive mock response factory functions
 * - Caching infrastructure for performance optimization
 * - Template-based response generation
 * - Cross-platform compatibility validation
 * - Educational demonstration patterns
 * - Production-ready mock data generation
 */

// Node.js built-in modules
import { randomUUID } from 'node:crypto'; // crypto v20.11.0 - Built-in Node.js crypto module

// Internal constants and configuration
import {
  HTTP_CONSTANTS,
  API_CONSTANTS,
  SECURITY_CONSTANTS,
  FLASK_CONSTANTS
} from '../../utils/constants.js';

// Test data fixtures for comprehensive mock generation
import {
  httpEndpoints,
  securityTestData,
  performanceBenchmarks
} from './test-data.json' with { type: 'json' };

/**
 * Global Mock Response Infrastructure
 * @description Centralized caching and template management for mock responses
 */
export const MOCK_RESPONSE_CACHE = new Map();
export const RESPONSE_TEMPLATES = new Map();
export const MOCK_COUNTERS = { total: 0, success: 0, error: 0, security: 0 };

/**
 * Helper Functions Implementation
 * @description Utility functions for HTTP response formatting, token generation, and data manipulation
 * Note: These functions would normally be imported from helpers.js, but implemented inline for educational completeness
 */

/**
 * Formats HTTP response with standardized structure and security headers
 * @param {Object} responseData - Core response data (status, body, headers)
 * @param {Object} options - Additional formatting options and metadata
 * @returns {Object} Formatted HTTP response object with security headers and metadata
 */
const formatHTTPResponse = (responseData, options = {}) => {
  const {
    includeSecurityHeaders = true,
    includePerformanceMetadata = false,
    includeEducationalAnnotations = false,
    correlationId = null
  } = options;

  // Base response structure with standard HTTP format
  const formattedResponse = {
    status: responseData.status || HTTP_CONSTANTS.STATUS_CODES.OK,
    headers: {
      'Content-Type': responseData.contentType || HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      'Date': new Date().toUTCString(),
      'Server': 'Node.js Tutorial Project',
      ...responseData.headers
    },
    body: responseData.body || {},
    metadata: {
      timestamp: new Date().toISOString(),
      correlationId: correlationId || generateSecureToken(),
      version: '1.0.0',
      framework: 'Express.js v5.1.0'
    }
  };

  // Add security headers from Helmet.js configuration
  if (includeSecurityHeaders) {
    Object.assign(formattedResponse.headers, {
      'Content-Security-Policy': SECURITY_CONSTANTS.CSP_DIRECTIVES.DEFAULT_SRC.join(' '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'no-referrer',
      'X-XSS-Protection': '0' // Disabled as recommended by Helmet.js
    });
    // Remove X-Powered-By header for security
    delete formattedResponse.headers['X-Powered-By'];
  }

  // Add performance metadata for benchmarking
  if (includePerformanceMetadata) {
    formattedResponse.metadata.performance = {
      responseTime: Math.floor(Math.random() * 50) + 10, // Simulated 10-60ms
      memoryUsage: process.memoryUsage(),
      cpuTime: process.cpuUsage(),
      uptime: process.uptime()
    };
  }

  // Add educational annotations for tutorial value
  if (includeEducationalAnnotations) {
    formattedResponse.metadata.educational = {
      httpStatusMeaning: getStatusCodeMeaning(formattedResponse.status),
      securityHeaders: includeSecurityHeaders ? 'Helmet.js security headers applied' : 'Security headers disabled',
      frameworkFeatures: 'Express.js v5.1.0 with ReDoS protection and modern Node.js support',
      testingNotes: 'Mock response generated for Jest/Mocha testing frameworks'
    };
  }

  return formattedResponse;
};

/**
 * Generates cryptographically secure token for correlation IDs and request tracking
 * @returns {string} Secure random UUID for request correlation and debugging
 */
const generateSecureToken = () => {
  return randomUUID();
};

/**
 * Deep clones objects to prevent mutation and ensure mock response data integrity
 * @param {any} obj - Object to clone
 * @returns {any} Deep cloned object with complete isolation
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * Converts Node.js Express response format to Flask-compatible format for cross-platform testing
 * @param {Object} expressResponse - Express.js formatted response object
 * @param {string} targetPlatform - Target platform (flask, express)
 * @returns {Object} Platform-specific formatted response
 */
const convertToFlaskFormat = (expressResponse, targetPlatform = 'flask') => {
  if (targetPlatform === 'express') return expressResponse;

  // Flask-specific response format adjustments
  const flaskResponse = deepClone(expressResponse);
  
  // Flask content-type header formatting
  if (flaskResponse.headers['Content-Type']) {
    flaskResponse.headers['Content-Type'] = flaskResponse.headers['Content-Type'].replace('; charset=utf-8', '');
  }

  // Flask framework metadata
  flaskResponse.metadata.framework = 'Flask v3.1.1';
  flaskResponse.metadata.wsgiServer = FLASK_CONSTANTS.WSGI_CONFIG.WSGI_SERVER;

  // Flask-specific error format mapping
  if (flaskResponse.status >= 400) {
    const errorMapping = FLASK_CONSTANTS.ERROR_MAPPINGS.EXCEPTION_MAPPING;
    flaskResponse.metadata.flaskErrorType = errorMapping[expressResponse.metadata?.errorType] || 'werkzeug.exceptions.HTTPException';
  }

  return flaskResponse;
};

/**
 * Helper function to get human-readable status code meanings
 * @param {number} statusCode - HTTP status code
 * @returns {string} Human-readable description of status code
 */
const getStatusCodeMeaning = (statusCode) => {
  const meanings = {
    200: 'OK - Request successful',
    201: 'Created - Resource created successfully',
    400: 'Bad Request - Invalid request format',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Access denied',
    404: 'Not Found - Resource not found',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Server error occurred',
    503: 'Service Unavailable - Service temporarily unavailable'
  };
  return meanings[statusCode] || `HTTP ${statusCode}`;
};

/**
 * Core Mock Response Factory Functions
 * @description Primary functions for generating comprehensive mock HTTP responses
 */

/**
 * Creates a comprehensive mock HTTP response object with realistic structure
 * @param {Object} responseConfig - Response configuration (status, body, headers)
 * @param {Object} options - Additional options (security, performance, educational)
 * @returns {Object} Mock HTTP response object with status, headers, body, metadata, and timing information
 */
export const createMockResponse = (responseConfig, options = {}) => {
  // Validate response configuration and apply defaults
  const config = {
    status: responseConfig.status || HTTP_CONSTANTS.STATUS_CODES.OK,
    body: responseConfig.body || {},
    headers: responseConfig.headers || {},
    contentType: responseConfig.contentType || HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    ...responseConfig
  };

  // Generate unique correlation ID for request tracking
  const correlationId = generateSecureToken();

  // Create response metadata with timestamp and context
  const metadata = {
    correlationId,
    timestamp: new Date().toISOString(),
    requestContext: options.requestContext || 'test',
    mockGenerated: true,
    tutorialPhase: options.tutorialPhase || 'general'
  };

  // Set HTTP status code using standardized constants
  const status = config.status;

  // Configure response headers including security headers
  const headers = {
    'Content-Type': config.contentType,
    'Date': new Date().toUTCString(),
    'X-Request-ID': correlationId,
    ...config.headers
  };

  // Format response body content based on endpoint type
  const body = typeof config.body === 'function' ? config.body() : config.body;

  // Add performance simulation data for testing
  const performanceData = {
    responseTime: Math.floor(Math.random() * 50) + 10, // 10-60ms simulation
    memoryUsage: Math.floor(Math.random() * 50) + 25, // 25-75MB simulation
    cpuUsage: Math.floor(Math.random() * 20) + 5 // 5-25% simulation
  };

  // Apply security headers using Helmet.js configuration
  const securityHeaders = options.includeSecurity !== false ? {
    'Content-Security-Policy': securityTestData.helmetHeaders.contentSecurityPolicy.expected,
    'Strict-Transport-Security': securityTestData.helmetHeaders.strictTransportSecurity.expected,
    'X-Content-Type-Options': securityTestData.helmetHeaders.xContentTypeOptions.expected,
    'X-Frame-Options': securityTestData.helmetHeaders.xFrameOptions.expected,
    'Referrer-Policy': securityTestData.helmetHeaders.referrerPolicy.expected
  } : {};

  // Include educational annotations for learning context
  const educationalMetadata = options.includeEducational ? {
    httpStatusMeaning: getStatusCodeMeaning(status),
    endpointPurpose: options.endpointPurpose || 'General API endpoint',
    testingFramework: 'Compatible with Jest and Mocha',
    securityFeatures: 'Helmet.js security headers included',
    performanceNotes: 'Simulated response timing for benchmarking'
  } : {};

  // Create comprehensive mock response object
  const mockResponse = formatHTTPResponse({
    status,
    headers: { ...headers, ...securityHeaders },
    body,
    contentType: config.contentType
  }, {
    includeSecurityHeaders: options.includeSecurity !== false,
    includePerformanceMetadata: options.includePerformance !== false,
    includeEducationalAnnotations: options.includeEducational !== false,
    correlationId
  });

  // Add performance and educational data
  mockResponse.metadata = {
    ...mockResponse.metadata,
    ...metadata,
    performance: performanceData,
    educational: educationalMetadata
  };

  // Cache response template for performance optimization
  if (options.cacheKey) {
    MOCK_RESPONSE_CACHE.set(options.cacheKey, deepClone(mockResponse));
  }

  // Update mock generation counters
  MOCK_COUNTERS.total++;
  if (status >= 200 && status < 300) MOCK_COUNTERS.success++;
  if (status >= 400) MOCK_COUNTERS.error++;

  return mockResponse;
};

/**
 * Creates mock HTTP response for /hello endpoint with 'Hello world' message
 * @param {Object} responseOptions - Configuration options for hello response
 * @returns {Object} Hello endpoint mock response with standardized structure and educational metadata
 */
export const createHelloResponse = (responseOptions = {}) => {
  // Initialize hello response configuration using test data
  const helloTestData = httpEndpoints.hello;
  
  // Create response body with 'Hello world' message using API constants
  const responseBody = {
    ...API_CONSTANTS.RESPONSES.HELLO_WORLD,
    message: 'Hello world',
    timestamp: new Date().toISOString()
  };

  // Set status code to 200 OK for success response
  const status = helloTestData.expectedResponse.status;

  // Configure Content-Type header as application/json for API consistency
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Endpoint': 'hello',
    'X-Response-Type': 'greeting'
  };

  // Include performance metadata with simulated response time under 50ms target
  const performanceTarget = performanceBenchmarks.responseTimeLimits.hello.target;
  const simulatedResponseTime = Math.floor(Math.random() * performanceTarget) + 5;

  // Apply Flask-compatible formatting for cross-platform testing
  const baseResponse = createMockResponse({
    status,
    body: responseBody,
    headers,
    contentType: HTTP_CONSTANTS.CONTENT_TYPES.JSON
  }, {
    ...responseOptions,
    endpointPurpose: 'Hello world greeting endpoint demonstrating basic HTTP response',
    tutorialPhase: 'basic-endpoints',
    includeEducational: true,
    cacheKey: `hello_${JSON.stringify(responseOptions)}`
  });

  // Add hello-specific metadata and educational annotations
  baseResponse.metadata.endpoint = {
    name: 'hello',
    method: helloTestData.method,
    path: helloTestData.path,
    expectedResponseTime: `<${performanceTarget}ms`,
    educationalValue: 'Demonstrates basic Express.js route handler and JSON response generation'
  };

  // Add performance simulation with hello endpoint specific timing
  baseResponse.metadata.performance.simulatedResponseTime = simulatedResponseTime;
  baseResponse.metadata.performance.benchmark = {
    target: performanceTarget,
    warning: performanceBenchmarks.responseTimeLimits.hello.warning,
    critical: performanceBenchmarks.responseTimeLimits.hello.critical
  };

  return baseResponse;
};

/**
 * Creates mock HTTP response for /good-evening endpoint with 'Good evening' message
 * @param {Object} responseOptions - Configuration options for good evening response
 * @returns {Object} Good evening endpoint mock response with standardized structure and educational metadata
 */
export const createGoodEveningResponse = (responseOptions = {}) => {
  // Initialize good evening response configuration using test data
  const goodEveningTestData = httpEndpoints.goodEvening;
  
  // Create response body with 'Good evening' message using API constants
  const responseBody = {
    ...API_CONSTANTS.RESPONSES.GOOD_EVENING,
    message: 'Good evening',
    timestamp: new Date().toISOString()
  };

  // Set status code to 200 OK for success response
  const status = goodEveningTestData.expectedResponse.status;

  // Configure identical headers structure to hello endpoint for consistency validation
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Endpoint': 'good-evening',
    'X-Response-Type': 'greeting'
  };

  // Include performance metadata with consistent timing simulation for comparison
  const performanceTarget = performanceBenchmarks.responseTimeLimits.goodEvening.target;
  const simulatedResponseTime = Math.floor(Math.random() * performanceTarget) + 5;

  // Apply Flask-compatible formatting for cross-platform feature parity validation
  const baseResponse = createMockResponse({
    status,
    body: responseBody,
    headers,
    contentType: HTTP_CONSTANTS.CONTENT_TYPES.JSON
  }, {
    ...responseOptions,
    endpointPurpose: 'Good evening greeting endpoint demonstrating endpoint consistency patterns',
    tutorialPhase: 'basic-endpoints',
    includeEducational: true,
    cacheKey: `good_evening_${JSON.stringify(responseOptions)}`
  });

  // Add good evening specific metadata and educational annotations
  baseResponse.metadata.endpoint = {
    name: 'good-evening',
    method: goodEveningTestData.method,
    path: goodEveningTestData.path,
    expectedResponseTime: `<${performanceTarget}ms`,
    educationalValue: 'Demonstrates endpoint pattern consistency and comparative testing between similar endpoints'
  };

  // Include educational annotations explaining endpoint similarity and patterns
  baseResponse.metadata.educational = {
    ...baseResponse.metadata.educational,
    comparisonNotes: 'Identical structure to hello endpoint for educational comparison',
    patternDemonstration: 'Shows consistent API design patterns across endpoints',
    testingStrategy: 'Validates endpoint consistency and pattern replication'
  };

  // Add performance simulation with good evening endpoint specific timing
  baseResponse.metadata.performance.simulatedResponseTime = simulatedResponseTime;
  baseResponse.metadata.performance.benchmark = {
    target: performanceTarget,
    warning: performanceBenchmarks.responseTimeLimits.goodEvening.warning,
    critical: performanceBenchmarks.responseTimeLimits.goodEvening.critical
  };

  return baseResponse;
};

/**
 * Creates comprehensive mock health check response with system status and monitoring data
 * @param {string} healthStatus - Health status (OK, WARNING, ERROR)
 * @param {Object} healthOptions - Additional health check configuration options
 * @returns {Object} Health check mock response with status, metrics, and monitoring data
 */
export const createHealthResponse = (healthStatus = 'OK', healthOptions = {}) => {
  // Initialize health check response configuration with status validation
  const validStatuses = ['OK', 'WARNING', 'ERROR'];
  const status = validStatuses.includes(healthStatus) ? healthStatus : 'OK';
  
  // Create comprehensive health response body including status, timestamp, and uptime
  const healthResponseBody = {
    ...API_CONSTANTS.RESPONSES.HEALTH_CHECK,
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Add system metrics including memory usage, CPU utilization, and process information
  const systemMetrics = {
    memory: {
      used: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024), // MB
      total: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      external: Math.floor(process.memoryUsage().external / 1024 / 1024), // MB
      rss: Math.floor(process.memoryUsage().rss / 1024 / 1024) // MB
    },
    cpu: {
      usage: Math.floor(Math.random() * 30) + 10, // Simulated 10-40%
      loadAverage: process.platform !== 'win32' ? [0.5, 0.3, 0.2] : [0, 0, 0]
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  // Include PM2 cluster information with worker count and load balancing status
  const pm2ClusterInfo = {
    clustered: healthOptions.clustered || false,
    instances: healthOptions.instances || 1,
    workerCount: healthOptions.workerCount || 1,
    loadBalancer: healthOptions.loadBalancer || 'round-robin'
  };

  // Set appropriate status code based on health status
  const httpStatusCode = {
    'OK': HTTP_CONSTANTS.STATUS_CODES.OK,
    'WARNING': HTTP_CONSTANTS.STATUS_CODES.OK, // Still operational
    'ERROR': HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE
  }[status];

  // Configure health check headers including cache control and monitoring headers
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Health-Check': 'true',
    'X-Service-Status': status.toLowerCase()
  };

  // Add performance metrics with response time simulation for health endpoint benchmarking
  const performanceTarget = performanceBenchmarks.responseTimeLimits.health.target;
  const simulatedResponseTime = Math.floor(Math.random() * performanceTarget) + 2;

  // Create comprehensive health check mock response
  const baseResponse = createMockResponse({
    status: httpStatusCode,
    body: {
      ...healthResponseBody,
      metrics: systemMetrics,
      cluster: pm2ClusterInfo
    },
    headers,
    contentType: HTTP_CONSTANTS.CONTENT_TYPES.JSON
  }, {
    ...healthOptions,
    endpointPurpose: 'Health check endpoint for monitoring and load balancer validation',
    tutorialPhase: 'health-monitoring',
    includeEducational: true,
    cacheKey: `health_${status}_${JSON.stringify(healthOptions)}`
  });

  // Include security validation status with Helmet.js configuration compliance
  baseResponse.metadata.security = {
    helmetEnabled: true,
    securityHeadersApplied: true,
    vulnerabilityStatus: 'clean',
    lastSecurityScan: new Date().toISOString()
  };

  // Add educational annotations explaining health check patterns and monitoring practices
  baseResponse.metadata.educational = {
    ...baseResponse.metadata.educational,
    healthCheckPurpose: 'Monitoring endpoint for load balancers and orchestration systems',
    monitoringPatterns: 'Demonstrates comprehensive health check with system metrics',
    productionUsage: 'Used by PM2, Docker, Kubernetes for container health validation',
    pm2Integration: 'Compatible with PM2 health check and monitoring features'
  };

  // Add performance metrics for health endpoint benchmarking
  baseResponse.metadata.performance.simulatedResponseTime = simulatedResponseTime;
  baseResponse.metadata.performance.benchmark = {
    target: performanceTarget,
    warning: performanceBenchmarks.responseTimeLimits.health.warning,
    critical: performanceBenchmarks.responseTimeLimits.health.critical
  };

  return baseResponse;
};

/**
 * Creates realistic mock error responses for various HTTP error codes
 * @param {number} statusCode - HTTP error status code (4xx or 5xx)
 * @param {Object} errorOptions - Error-specific configuration options
 * @returns {Object} Error response mock with status code, error message, and debugging information
 */
export const createErrorResponse = (statusCode, errorOptions = {}) => {
  // Validate HTTP error status code and determine error category
  const errorCode = statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
  const isClientError = errorCode >= 400 && errorCode < 500;
  const isServerError = errorCode >= 500 && errorCode < 600;
  
  if (!isClientError && !isServerError) {
    throw new Error(`Invalid error status code: ${errorCode}. Must be 4xx or 5xx.`);
  }

  // Create error response body with appropriate error message
  const errorMessage = API_CONSTANTS.ERROR_MESSAGES[getErrorMessageKey(errorCode)] || 
                      'An unexpected error occurred';
  
  const errorBody = {
    error: getStatusCodeMeaning(errorCode).split(' - ')[0],
    message: errorMessage,
    statusCode: errorCode,
    timestamp: new Date().toISOString(),
    path: errorOptions.path || '/unknown',
    method: errorOptions.method || 'GET'
  };

  // Set error-specific headers including error correlation headers
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Error-Type': isClientError ? 'client-error' : 'server-error',
    'X-Error-Code': errorCode.toString()
  };

  // Add debugging information including stack trace simulation for development
  if (errorOptions.includeDebugInfo && process.env.NODE_ENV !== 'production') {
    errorBody.debug = {
      stack: 'Error stack trace would appear here in development mode',
      requestId: generateSecureToken(),
      timestamp: Date.now(),
      userAgent: errorOptions.userAgent || 'test-client'
    };
  }

  // Include error code classification and error type information
  const errorClassification = {
    category: isClientError ? 'Client Error' : 'Server Error',
    type: getErrorType(errorCode),
    recoverable: isClientError,
    retryable: errorCode === HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE ||
              errorCode === HTTP_CONSTANTS.STATUS_CODES.REQUEST_TIMEOUT
  };

  // Create comprehensive error mock response
  const baseResponse = createMockResponse({
    status: errorCode,
    body: errorBody,
    headers,
    contentType: HTTP_CONSTANTS.CONTENT_TYPES.JSON
  }, {
    ...errorOptions,
    endpointPurpose: `Error response for ${errorCode} ${getStatusCodeMeaning(errorCode)}`,
    tutorialPhase: 'error-handling',
    includeEducational: true,
    includeSecurity: true,
    cacheKey: `error_${errorCode}_${JSON.stringify(errorOptions)}`
  });

  // Add error classification and debugging metadata
  baseResponse.metadata.error = errorClassification;
  baseResponse.metadata.debugging = {
    errorCode,
    errorCategory: errorClassification.category,
    canRetry: errorClassification.retryable,
    clientCanFix: isClientError
  };

  // Add educational annotations explaining error handling patterns and best practices
  baseResponse.metadata.educational = {
    ...baseResponse.metadata.educational,
    errorHandlingPurpose: 'Demonstrates proper HTTP error response formatting',
    statusCodeMeaning: getStatusCodeMeaning(errorCode),
    clientGuidance: getClientGuidance(errorCode),
    bestPractices: 'Includes correlation ID, timestamp, and actionable error messages'
  };

  // Apply cross-platform error format compatibility for Express/Flask error consistency
  if (errorOptions.platform === 'flask') {
    return convertToFlaskFormat(baseResponse, 'flask');
  }

  return baseResponse;
};

/**
 * Creates mock responses with comprehensive security headers for Helmet.js validation
 * @param {Object} securityConfig - Security configuration options and scenarios
 * @returns {Object} Security-enhanced mock response with comprehensive security headers and validation data
 */
export const createSecurityResponse = (securityConfig = {}) => {
  // Initialize security response configuration using security test data
  const securityHeaders = securityTestData.helmetHeaders;
  
  // Apply comprehensive Helmet.js security headers
  const helmetHeaders = {
    'Content-Security-Policy': securityHeaders.contentSecurityPolicy.expected,
    'Cross-Origin-Embedder-Policy': securityHeaders.crossOriginEmbedderPolicy.expected,
    'Cross-Origin-Opener-Policy': securityHeaders.crossOriginOpenerPolicy.expected,
    'Cross-Origin-Resource-Policy': securityHeaders.crossOriginResourcePolicy.expected,
    'Origin-Agent-Cluster': securityHeaders.originAgentCluster.expected,
    'Referrer-Policy': securityHeaders.referrerPolicy.expected,
    'Strict-Transport-Security': securityHeaders.strictTransportSecurity.expected,
    'X-Content-Type-Options': securityHeaders.xContentTypeOptions.expected,
    'X-DNS-Prefetch-Control': securityHeaders.xDnsPrefetchControl.expected,
    'X-Download-Options': securityHeaders.xDownloadOptions.expected,
    'X-Frame-Options': securityHeaders.xFrameOptions.expected,
    'X-Permitted-Cross-Domain-Policies': securityHeaders.xPermittedCrossDomainPolicies.expected,
    'X-XSS-Protection': securityHeaders.xXssProtection.expected
  };

  // Configure Content Security Policy directives using security constants
  const cspDirectives = SECURITY_CONSTANTS.CSP_DIRECTIVES;
  const detailedCSP = Object.entries(cspDirectives)
    .map(([directive, values]) => `${directive.toLowerCase().replace(/_/g, '-')} ${values.join(' ')}`)
    .join('; ');

  // Add CORS headers for cross-origin request testing and validation scenarios
  const corsHeaders = {
    'Access-Control-Allow-Origin': securityConfig.allowOrigin || 'null',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Include XSS protection headers and security policy compliance information
  const securityResponseBody = {
    security: {
      status: 'protected',
      timestamp: new Date().toISOString(),
      helmetVersion: '8.1.0',
      protections: {
        xss: 'enabled',
        clickjacking: 'enabled',
        contentSniffing: 'disabled',
        httpsEnforcement: 'enabled'
      }
    },
    compliance: {
      owasp: 'compliant',
      csp: 'enforced',
      hsts: 'enabled',
      securityHeaders: 'complete'
    }
  };

  // Set security-specific response headers for vulnerability testing validation
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Security-Scan': 'passed',
    'X-Vulnerability-Status': 'clean',
    ...helmetHeaders,
    ...corsHeaders
  };

  // Ensure X-Powered-By header is removed for security
  delete headers['X-Powered-By'];

  // Create comprehensive security mock response
  const baseResponse = createMockResponse({
    status: HTTP_CONSTANTS.STATUS_CODES.OK,
    body: securityResponseBody,
    headers,
    contentType: HTTP_CONSTANTS.CONTENT_TYPES.JSON
  }, {
    ...securityConfig,
    endpointPurpose: 'Security-enhanced response demonstrating Helmet.js protection',
    tutorialPhase: 'security-implementation',
    includeEducational: true,
    includeSecurity: true,
    cacheKey: `security_${JSON.stringify(securityConfig)}`
  });

  // Add security audit information and compliance status for monitoring
  baseResponse.metadata.security = {
    helmetEnabled: true,
    vulnerabilityScan: {
      status: 'clean',
      lastScan: new Date().toISOString(),
      xssProtection: true,
      clickjackingProtection: true,
      contentTypeSniffing: false
    },
    compliance: {
      owaspTop10: 'addressed',
      securityHeaders: 'complete',
      cspLevel: 'strict',
      hstsEnabled: true
    }
  };

  // Include educational annotations explaining security header implementation and benefits
  baseResponse.metadata.educational = {
    ...baseResponse.metadata.educational,
    securityPurpose: 'Demonstrates comprehensive web security header implementation',
    helmetFeatures: 'Shows Helmet.js middleware security enhancements',
    threatMitigation: 'Protects against XSS, clickjacking, MITM, and content sniffing attacks',
    productionSecurity: 'Production-ready security configuration with OWASP compliance'
  };

  // Track security mock generation for metrics
  MOCK_COUNTERS.security++;

  return baseResponse;
};

/**
 * Creates mock responses with performance simulation data and resource metrics
 * @param {Object} performanceConfig - Performance testing configuration and scenarios
 * @returns {Object} Performance-enhanced mock response with timing data and resource metrics
 */
export const createPerformanceResponse = (performanceConfig = {}) => {
  // Initialize performance response configuration using performance benchmarks
  const benchmarks = performanceBenchmarks;
  const endpoint = performanceConfig.endpoint || 'general';
  
  // Simulate realistic response timing within performance target limits
  const responseLimits = benchmarks.responseTimeLimits[endpoint] || benchmarks.responseTimeLimits.hello;
  const simulatedResponseTime = Math.floor(Math.random() * responseLimits.target) + 5;

  // Add memory usage simulation data within memory threshold limits
  const memoryLimits = benchmarks.memoryThresholds.perProcess;
  const simulatedMemoryUsage = Math.floor(Math.random() * memoryLimits.target) + 10;

  // Include CPU usage metrics and resource utilization simulation for load testing
  const resourceLimits = benchmarks.resourceLimits;
  const simulatedCpuUsage = Math.floor(Math.random() * resourceLimits.cpu.target) + 5;

  // Configure performance headers including response time and processing duration
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Response-Time': `${simulatedResponseTime}ms`,
    'X-Memory-Usage': `${simulatedMemoryUsage}MB`,
    'X-CPU-Usage': `${simulatedCpuUsage}%`,
    'X-Performance-Profile': performanceConfig.profile || 'standard'
  };

  // Add benchmark comparison data for performance regression testing validation
  const performanceData = {
    timing: {
      responseTime: simulatedResponseTime,
      target: responseLimits.target,
      warning: responseLimits.warning,
      critical: responseLimits.critical,
      status: simulatedResponseTime <= responseLimits.target ? 'optimal' : 
              simulatedResponseTime <= responseLimits.warning ? 'acceptable' : 'slow'
    },
    resources: {
      memory: {
        used: simulatedMemoryUsage,
        target: memoryLimits.target,
        warning: memoryLimits.warning,
        critical: memoryLimits.critical,
        unit: 'MB'
      },
      cpu: {
        usage: simulatedCpuUsage,
        target: resourceLimits.cpu.target,
        warning: resourceLimits.cpu.warning,
        critical: resourceLimits.cpu.critical,
        unit: 'percent'
      }
    },
    concurrency: {
      simultaneousRequests: benchmarks.concurrencyTargets.simultaneousRequests.target,
      requestsPerSecond: benchmarks.concurrencyTargets.requestsPerSecond.target,
      connectionPool: benchmarks.concurrencyTargets.connectionPool.target
    }
  };

  // Include performance optimization recommendations and insights
  const optimizationInsights = {
    recommendations: [
      simulatedResponseTime > responseLimits.target ? 'Consider response caching' : 'Response time optimal',
      simulatedMemoryUsage > memoryLimits.target ? 'Monitor memory usage' : 'Memory usage within limits',
      simulatedCpuUsage > resourceLimits.cpu.target ? 'Check for CPU bottlenecks' : 'CPU usage acceptable'
    ].filter(Boolean),
    scalingNotes: 'PM2 cluster mode can improve performance by factor of x10 on multi-core machines',
    profiling: 'Use Node.js built-in profiler or tools like clinic.js for detailed analysis'
  };

  // Create performance-enhanced mock response
  const baseResponse = createMockResponse({
    status: HTTP_CONSTANTS.STATUS_CODES.OK,
    body: {
      performance: performanceData,
      optimization: optimizationInsights,
      timestamp: new Date().toISOString()
    },
    headers,
    contentType: HTTP_CONSTANTS.CONTENT_TYPES.JSON
  }, {
    ...performanceConfig,
    endpointPurpose: 'Performance testing response with simulated timing and resource metrics',
    tutorialPhase: 'performance-testing',
    includeEducational: true,
    includePerformance: true,
    cacheKey: `performance_${endpoint}_${JSON.stringify(performanceConfig)}`
  });

  // Apply performance caching headers for optimization testing scenarios
  baseResponse.headers['Cache-Control'] = 'private, max-age=300'; // 5 minute cache
  baseResponse.headers['ETag'] = `"perf-${Date.now()}"`;

  // Add educational annotations explaining performance monitoring and optimization patterns
  baseResponse.metadata.educational = {
    ...baseResponse.metadata.educational,
    performancePurpose: 'Demonstrates performance monitoring and benchmarking patterns',
    optimizationStrategy: 'Shows performance analysis and optimization recommendation generation',
    scalingInsights: 'PM2 cluster mode provides horizontal scaling for improved performance',
    monitoringTools: 'Compatible with APM tools, Node.js profiler, and custom monitoring solutions'
  };

  // Enhanced performance metadata with detailed metrics
  baseResponse.metadata.performance = {
    ...baseResponse.metadata.performance,
    simulatedTiming: performanceData.timing,
    resourceUsage: performanceData.resources,
    benchmarkComparison: 'Compared against performance targets and thresholds',
    optimizationRecommendations: optimizationInsights.recommendations
  };

  return baseResponse;
};

/**
 * Creates mock responses with cross-platform compatibility between Express.js and Flask
 * @param {Object} baseResponse - Base response object to convert
 * @param {string} targetPlatform - Target platform (express, flask)
 * @returns {Object} Cross-platform compatible mock response with identical behavior across platforms
 */
export const createCrossPlatformResponse = (baseResponse, targetPlatform = 'express') => {
  // Initialize cross-platform response conversion using Flask constants
  const compatibilityMap = FLASK_CONSTANTS.COMPATIBILITY_MAP;
  
  // Convert response structure to target platform format
  let platformResponse = deepClone(baseResponse);

  if (targetPlatform === 'flask') {
    // Ensure identical status codes, headers, and response body structure across platforms
    platformResponse = convertToFlaskFormat(platformResponse, 'flask');
    
    // Apply platform-specific header formatting while maintaining functional equivalence
    if (platformResponse.headers['Content-Type']) {
      // Flask uses simpler content-type format
      platformResponse.headers['Content-Type'] = platformResponse.headers['Content-Type']
        .replace('; charset=utf-8', '');
    }

    // Flask framework metadata
    platformResponse.metadata.framework = 'Flask v3.1.1';
    platformResponse.metadata.wsgiServer = compatibilityMap.EXPRESS_TO_FLASK['app.listen()'];
  } else {
    // Express.js platform formatting
    platformResponse.metadata.framework = 'Express.js v5.1.0';
    platformResponse.metadata.nodeVersion = process.version;
  }

  // Include platform comparison metadata for educational analysis and validation
  const comparisonMetadata = {
    sourcePlatform: baseResponse.metadata?.framework || 'Express.js v5.1.0',
    targetPlatform: targetPlatform === 'flask' ? 'Flask v3.1.1' : 'Express.js v5.1.0',
    conversionApplied: targetPlatform !== 'express',
    compatibilityLevel: 'full',
    featureParity: '100%'
  };

  // Validate response compatibility against both Express.js and Flask requirements
  const compatibilityValidation = {
    statusCodeMatch: true,
    headerStructureMatch: true,
    bodyFormatMatch: true,
    responseTimeComparable: true,
    errorHandlingEquivalent: true
  };

  // Add conversion validation data for feature parity testing and migration validation
  platformResponse.metadata.crossPlatform = {
    comparison: comparisonMetadata,
    validation: compatibilityValidation,
    portMapping: {
      nodeDefault: compatibilityMap.PORT_MAPPING.NODE_DEFAULT,
      flaskDefault: compatibilityMap.PORT_MAPPING.FLASK_DEFAULT,
      unified: compatibilityMap.PORT_MAPPING.UNIFIED_PORT
    }
  };

  // Include educational annotations explaining cross-platform development patterns
  platformResponse.metadata.educational = {
    ...platformResponse.metadata.educational,
    crossPlatformPurpose: 'Demonstrates API compatibility between Node.js and Python frameworks',
    migrationPatterns: 'Shows equivalent functionality implementation across different technology stacks',
    featureParityValidation: 'Ensures identical behavior for API consumers regardless of backend technology',
    developmentBenefits: 'Enables technology stack flexibility and migration capabilities'
  };

  // Apply performance equivalence validation for platform comparison benchmarking
  if (platformResponse.metadata.performance) {
    platformResponse.metadata.performance.platformComparison = {
      expectedVariance: '10%',
      performanceTarget: 'comparable',
      scalingCharacteristics: targetPlatform === 'flask' ? 'WSGI-based' : 'PM2 cluster-based'
    };
  }

  return platformResponse;
};

/**
 * Generates multiple variations of mock responses for comprehensive testing
 * @param {Object} baseResponse - Base response template for variation generation
 * @param {Object} variationConfig - Configuration for types and scope of variations
 * @returns {Array} Array of mock response variations covering different testing scenarios and edge cases
 */
export const generateMockVariations = (baseResponse, variationConfig = {}) => {
  const variations = [];

  // Create base response variation with standard response properties and structure
  variations.push({
    name: 'standard',
    description: 'Standard response with default configuration',
    response: deepClone(baseResponse)
  });

  // Generate edge case variations including boundary values, empty responses, and null data
  if (variationConfig.includeEdgeCases !== false) {
    // Empty response body variation
    const emptyBodyVariation = deepClone(baseResponse);
    emptyBodyVariation.body = {};
    variations.push({
      name: 'empty_body',
      description: 'Response with empty body object',
      response: emptyBodyVariation
    });

    // Minimal headers variation
    const minimalHeadersVariation = deepClone(baseResponse);
    minimalHeadersVariation.headers = {
      'Content-Type': minimalHeadersVariation.headers['Content-Type']
    };
    variations.push({
      name: 'minimal_headers',
      description: 'Response with only essential headers',
      response: minimalHeadersVariation
    });

    // Large response body variation
    const largeBodyVariation = deepClone(baseResponse);
    largeBodyVariation.body.largeData = 'A'.repeat(1000); // 1KB of data
    variations.push({
      name: 'large_body',
      description: 'Response with large body content',
      response: largeBodyVariation
    });
  }

  // Create timing-based variations for testing performance under different load conditions
  if (variationConfig.includeTimingVariations !== false) {
    const timingVariations = [
      { name: 'fast_response', timing: 10, description: 'Optimally fast response time' },
      { name: 'slow_response', timing: 95, description: 'Near-threshold response time' },
      { name: 'timeout_edge', timing: 99, description: 'Edge of timeout threshold' }
    ];

    timingVariations.forEach(timing => {
      const timedVariation = deepClone(baseResponse);
      timedVariation.metadata.performance.simulatedResponseTime = timing.timing;
      timedVariation.headers['X-Response-Time'] = `${timing.timing}ms`;
      variations.push({
        name: timing.name,
        description: timing.description,
        response: timedVariation
      });
    });
  }

  // Generate size-based variations including large payloads and minimal responses
  if (variationConfig.includeSizeVariations !== false) {
    // Minimal response variation
    const minimalVariation = {
      status: baseResponse.status,
      headers: { 'Content-Type': baseResponse.headers['Content-Type'] },
      body: { message: 'minimal' },
      metadata: { timestamp: new Date().toISOString() }
    };
    variations.push({
      name: 'minimal_response',
      description: 'Minimal viable response structure',
      response: minimalVariation
    });

    // Maximum size variation
    const maxSizeVariation = deepClone(baseResponse);
    maxSizeVariation.body.metadata = {
      ...maxSizeVariation.body,
      extendedData: Array(100).fill().map((_, i) => ({
        id: i,
        data: `Extended data item ${i}`,
        timestamp: new Date().toISOString()
      }))
    };
    variations.push({
      name: 'max_size_response',
      description: 'Large response with extended data payload',
      response: maxSizeVariation
    });
  }

  // Create header variations testing different Content-Type and security header combinations
  if (variationConfig.includeHeaderVariations !== false) {
    // Text response variation
    const textVariation = deepClone(baseResponse);
    textVariation.headers['Content-Type'] = HTTP_CONSTANTS.CONTENT_TYPES.PLAIN_TEXT;
    textVariation.body = JSON.stringify(textVariation.body);
    variations.push({
      name: 'text_response',
      description: 'Response with text/plain content type',
      response: textVariation
    });

    // Enhanced security headers variation
    const enhancedSecurityVariation = deepClone(baseResponse);
    enhancedSecurityVariation.headers = {
      ...enhancedSecurityVariation.headers,
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'"
    };
    variations.push({
      name: 'enhanced_security',
      description: 'Response with enhanced security headers',
      response: enhancedSecurityVariation
    });
  }

  // Generate error scenario variations including network errors and timeout simulations
  if (variationConfig.includeErrorVariations !== false) {
    const errorStatuses = [400, 401, 403, 404, 429, 500, 503];
    errorStatuses.forEach(status => {
      const errorVariation = createErrorResponse(status, {
        includeDebugInfo: false,
        platform: variationConfig.platform
      });
      variations.push({
        name: `error_${status}`,
        description: `Error response with ${status} status code`,
        response: errorVariation
      });
    });
  }

  // Create security variations testing different vulnerability scenarios and attack patterns
  if (variationConfig.includeSecurityVariations !== false) {
    // XSS protection test
    const xssTestVariation = deepClone(baseResponse);
    xssTestVariation.body.userInput = '<script>alert("xss")</script>';
    xssTestVariation.headers['X-XSS-Test'] = 'blocked';
    variations.push({
      name: 'xss_protection_test',
      description: 'Response testing XSS protection mechanisms',
      response: xssTestVariation
    });

    // CSRF protection test
    const csrfTestVariation = deepClone(baseResponse);
    csrfTestVariation.headers['X-CSRF-Token'] = generateSecureToken();
    variations.push({
      name: 'csrf_protection_test',
      description: 'Response with CSRF protection headers',
      response: csrfTestVariation
    });
  }

  // Generate educational variations demonstrating different response patterns and best practices
  if (variationConfig.includeEducationalVariations !== false) {
    // Best practices demonstration
    const bestPracticesVariation = deepClone(baseResponse);
    bestPracticesVariation.metadata.educational = {
      ...bestPracticesVariation.metadata.educational,
      bestPractices: [
        'Proper HTTP status codes',
        'Comprehensive security headers',
        'Performance optimization',
        'Error handling patterns',
        'Cross-platform compatibility'
      ],
      tutorialValue: 'Demonstrates production-ready API response patterns'
    };
    variations.push({
      name: 'best_practices_demo',
      description: 'Response demonstrating API best practices',
      response: bestPracticesVariation
    });
  }

  // Apply cross-platform variations ensuring compatibility across Express.js and Flask implementations
  if (variationConfig.includeCrossPlatformVariations !== false) {
    const expressVariation = createCrossPlatformResponse(baseResponse, 'express');
    const flaskVariation = createCrossPlatformResponse(baseResponse, 'flask');
    
    variations.push({
      name: 'express_format',
      description: 'Response formatted for Express.js compatibility',
      response: expressVariation
    });

    variations.push({
      name: 'flask_format',
      description: 'Response formatted for Flask compatibility',
      response: flaskVariation
    });
  }

  // Add variation metadata for comprehensive testing coverage tracking
  variations.forEach((variation, index) => {
    variation.response.metadata = {
      ...variation.response.metadata,
      variation: {
        index,
        name: variation.name,
        description: variation.description,
        generatedAt: new Date().toISOString(),
        totalVariations: variations.length
      }
    };
  });

  return variations;
};

/**
 * Caches generated mock responses with TTL management and cache invalidation
 * @param {string} cacheKey - Unique cache key for response storage
 * @param {Object} mockResponse - Mock response object to cache
 * @param {Object} cacheOptions - Cache configuration options (TTL, size limits)
 * @returns {boolean} Success status indicating whether mock response was successfully cached
 */
export const cacheMockResponse = (cacheKey, mockResponse, cacheOptions = {}) => {
  try {
    // Generate secure cache key using response configuration hash and request parameters
    const secureKey = cacheKey || `mock_${generateSecureToken()}`;
    
    // Validate cache options including TTL, cache size limits, and expiration policies
    const options = {
      ttl: cacheOptions.ttl || 300000, // Default 5 minutes
      maxSize: cacheOptions.maxSize || 1000, // Maximum cache entries
      compress: cacheOptions.compress || false,
      ...cacheOptions
    };

    // Deep clone mock response using deepClone utility for cache data integrity
    const clonedResponse = deepClone(mockResponse);

    // Add cache metadata including timestamp, TTL, and cache generation information
    const cacheEntry = {
      data: clonedResponse,
      metadata: {
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + options.ttl).toISOString(),
        ttl: options.ttl,
        key: secureKey,
        hits: 0
      }
    };

    // Implement cache eviction policy for memory management and performance optimization
    if (MOCK_RESPONSE_CACHE.size >= options.maxSize) {
      // Remove oldest entries first (FIFO eviction)
      const oldestKey = MOCK_RESPONSE_CACHE.keys().next().value;
      MOCK_RESPONSE_CACHE.delete(oldestKey);
    }

    // Store cached response in MOCK_RESPONSE_CACHE with appropriate cache key
    MOCK_RESPONSE_CACHE.set(secureKey, cacheEntry);

    // Update cache statistics including hit rates and memory usage tracking
    MOCK_COUNTERS.total++;

    // Log cache operation with performance impact and cache statistics
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Cached mock response: ${secureKey} (Cache size: ${MOCK_RESPONSE_CACHE.size})`);
    }

    // Return success status indicating cache operation result and storage confirmation
    return true;

  } catch (error) {
    console.error('Failed to cache mock response:', error.message);
    return false;
  }
};

/**
 * Retrieves cached mock response with hit tracking and TTL validation
 * @param {string} cacheKey - Cache key for response retrieval
 * @returns {Object|null} Cached mock response or null if not found/expired
 */
export const getCachedMockResponse = (cacheKey) => {
  try {
    const cacheEntry = MOCK_RESPONSE_CACHE.get(cacheKey);
    
    if (!cacheEntry) {
      return null;
    }

    // Check TTL expiration
    const now = Date.now();
    const expiresAt = new Date(cacheEntry.metadata.expiresAt).getTime();
    
    if (now > expiresAt) {
      // Remove expired entry
      MOCK_RESPONSE_CACHE.delete(cacheKey);
      return null;
    }

    // Update hit counter
    cacheEntry.metadata.hits++;
    cacheEntry.metadata.lastHit = new Date().toISOString();

    return deepClone(cacheEntry.data);

  } catch (error) {
    console.error('Failed to retrieve cached mock response:', error.message);
    return null;
  }
};

/**
 * Initializes all mock response fixtures and sets up caching infrastructure
 * @param {Object} config - Initialization configuration options
 * @returns {Object} Initialized mock response collection with all templates, variations, and utilities
 */
export const initializeMockResponses = (config = {}) => {
  const {
    includeVariations = true,
    includeCrossPlatform = true,
    includePerformanceTesting = true,
    includeSecurityTesting = true,
    cacheResponses = true
  } = config;

  try {
    // Load mock response configuration and test data from fixtures and constants
    console.log('Initializing mock response fixtures...');

    // Generate hello endpoint mock responses with all variations
    const helloBase = createHelloResponse({ includeEducational: true });
    const helloVariations = includeVariations ? 
      generateMockVariations(helloBase, { includeCrossPlatformVariations: includeCrossPlatform }) : [];

    // Create good evening endpoint mock responses with test scenarios
    const goodEveningBase = createGoodEveningResponse({ includeEducational: true });
    const goodEveningVariations = includeVariations ? 
      generateMockVariations(goodEveningBase, { includeCrossPlatformVariations: includeCrossPlatform }) : [];

    // Generate health check mock responses with different status scenarios
    const healthResponses = {
      healthy: createHealthResponse('OK', { clustered: true, instances: 'max' }),
      warning: createHealthResponse('WARNING', { clustered: true, instances: 2 }),
      unhealthy: createHealthResponse('ERROR', { clustered: false, instances: 1 })
    };

    // Create error response templates for all HTTP error codes
    const errorTemplates = {
      notFound: createErrorResponse(404, { includeDebugInfo: true }),
      badRequest: createErrorResponse(400, { includeDebugInfo: true }),
      internalServerError: createErrorResponse(500, { includeDebugInfo: true }),
      serviceUnavailable: createErrorResponse(503, { includeDebugInfo: false })
    };

    // Generate security response templates with Helmet.js configurations
    const securityTemplates = includeSecurityTesting ? {
      helmetHeaders: createSecurityResponse({ includeEducational: true }),
      cspCompliant: createSecurityResponse({ strictCSP: true }),
      hstsEnabled: createSecurityResponse({ enhancedHSTS: true }),
      corsEnabled: createSecurityResponse({ enableCORS: true })
    } : {};

    // Create performance response templates with benchmark data
    const performanceTemplates = includePerformanceTesting ? {
      fast: createPerformanceResponse({ endpoint: 'hello', profile: 'fast' }),
      slow: createPerformanceResponse({ endpoint: 'health', profile: 'slow' }),
      benchmark: createPerformanceResponse({ endpoint: 'good-evening', profile: 'benchmark' }),
      loadTest: createPerformanceResponse({ endpoint: 'general', profile: 'load-test' })
    } : {};

    // Generate cross-platform response templates for compatibility testing
    const crossPlatformTemplates = includeCrossPlatform ? {
      expressFormat: createCrossPlatformResponse(helloBase, 'express'),
      flaskFormat: createCrossPlatformResponse(helloBase, 'flask'),
      compatible: helloBase // Base response compatible with both platforms
    } : {};

    // Organize all templates into master collection
    const mockCollection = {
      hello: {
        success: helloBase,
        withPerformance: includePerformanceTesting ? createPerformanceResponse({ endpoint: 'hello' }) : helloBase,
        withSecurity: includeSecurityTesting ? createSecurityResponse() : helloBase,
        crossPlatform: includeCrossPlatform ? crossPlatformTemplates : {},
        variations: helloVariations
      },
      goodEvening: {
        success: goodEveningBase,
        withPerformance: includePerformanceTesting ? createPerformanceResponse({ endpoint: 'good-evening' }) : goodEveningBase,
        withSecurity: includeSecurityTesting ? createSecurityResponse() : goodEveningBase,
        crossPlatform: includeCrossPlatform ? crossPlatformTemplates : {},
        variations: goodEveningVariations
      },
      health: healthResponses,
      error: errorTemplates,
      security: securityTemplates,
      performance: performanceTemplates,
      crossPlatform: crossPlatformTemplates
    };

    // Set up response caching infrastructure and initialize cache storage
    if (cacheResponses) {
      // Cache frequently used responses
      Object.entries(mockCollection).forEach(([category, responses]) => {
        Object.entries(responses).forEach(([type, response]) => {
          if (response && typeof response === 'object' && response.status) {
            cacheMockResponse(`${category}_${type}`, response, { ttl: 600000 }); // 10 minutes
          }
        });
      });
    }

    // Register all mock response templates in RESPONSE_TEMPLATES map for organized access
    RESPONSE_TEMPLATES.set('initialized_collection', mockCollection);
    RESPONSE_TEMPLATES.set('initialization_time', new Date().toISOString());
    RESPONSE_TEMPLATES.set('configuration', config);

    console.log(`Mock response initialization complete. Generated ${MOCK_COUNTERS.total} mock responses.`);

    // Return complete mock response collection ready for testing framework integration
    return {
      collection: mockCollection,
      cache: MOCK_RESPONSE_CACHE,
      templates: RESPONSE_TEMPLATES,
      counters: MOCK_COUNTERS,
      utilities: {
        createMockResponse,
        createHelloResponse,
        createGoodEveningResponse,
        createHealthResponse,
        createErrorResponse,
        createSecurityResponse,
        createPerformanceResponse,
        createCrossPlatformResponse,
        generateMockVariations,
        cacheMockResponse,
        getCachedMockResponse
      }
    };

  } catch (error) {
    console.error('Failed to initialize mock responses:', error.message);
    throw new Error(`Mock response initialization failed: ${error.message}`);
  }
};

/**
 * Helper Functions for Error Handling and Classification
 */
const getErrorMessageKey = (statusCode) => {
  const messageMap = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'ROUTE_NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    408: 'TIMEOUT',
    413: 'PAYLOAD_TOO_LARGE',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
    501: 'NOT_IMPLEMENTED',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };
  return messageMap[statusCode] || 'INTERNAL_ERROR';
};

const getErrorType = (statusCode) => {
  if (statusCode >= 400 && statusCode < 500) return 'client_error';
  if (statusCode >= 500 && statusCode < 600) return 'server_error';
  return 'unknown_error';
};

const getClientGuidance = (statusCode) => {
  const guidanceMap = {
    400: 'Check request format and parameters',
    401: 'Provide valid authentication credentials',
    403: 'Contact administrator for access permission',
    404: 'Verify the requested URL path',
    405: 'Use the correct HTTP method for this endpoint',
    408: 'Retry the request with a shorter timeout',
    413: 'Reduce the size of request payload',
    429: 'Wait before making another request',
    500: 'Retry later or contact support if problem persists',
    503: 'Service temporarily unavailable, retry later'
  };
  return guidanceMap[statusCode] || 'Contact support for assistance';
};

/**
 * Pre-built Mock Response Collections
 * @description Organized collections of commonly used mock responses for easy access
 */

// Hello endpoint mock responses
export const helloResponses = {
  success: createHelloResponse({ includeEducational: true }),
  withPerformance: createPerformanceResponse({ endpoint: 'hello' }),
  withSecurity: createSecurityResponse({ endpoint: 'hello' }),
  crossPlatform: createCrossPlatformResponse(createHelloResponse(), 'flask')
};

// Good evening endpoint mock responses
export const goodEveningResponses = {
  success: createGoodEveningResponse({ includeEducational: true }),
  withPerformance: createPerformanceResponse({ endpoint: 'good-evening' }),
  withSecurity: createSecurityResponse({ endpoint: 'good-evening' }),
  crossPlatform: createCrossPlatformResponse(createGoodEveningResponse(), 'flask')
};

// Health check mock responses
export const healthResponses = {
  healthy: createHealthResponse('OK', { clustered: true }),
  warning: createHealthResponse('WARNING', { clustered: true }),
  unhealthy: createHealthResponse('ERROR', { clustered: false }),
  quick: createHealthResponse('OK', { minimal: true }),
  detailed: createHealthResponse('OK', { includeSystemMetrics: true })
};

// HTTP error mock responses
export const errorResponses = {
  notFound: createErrorResponse(404, { includeDebugInfo: true }),
  badRequest: createErrorResponse(400, { includeDebugInfo: true }),
  internalServerError: createErrorResponse(500, { includeDebugInfo: false }),
  serviceUnavailable: createErrorResponse(503, { includeDebugInfo: false })
};

// Security-enhanced mock responses
export const securityResponses = {
  helmetHeaders: createSecurityResponse({ includeEducational: true }),
  cspCompliant: createSecurityResponse({ strictCSP: true }),
  hstsEnabled: createSecurityResponse({ enhancedHSTS: true }),
  corsEnabled: createSecurityResponse({ enableCORS: true })
};

// Performance-focused mock responses
export const performanceResponses = {
  fast: createPerformanceResponse({ profile: 'fast' }),
  slow: createPerformanceResponse({ profile: 'slow' }),
  benchmark: createPerformanceResponse({ profile: 'benchmark' }),
  loadTest: createPerformanceResponse({ profile: 'load-test' })
};

// Cross-platform mock responses
export const crossPlatformResponses = {
  expressFormat: createCrossPlatformResponse(createHelloResponse(), 'express'),
  flaskFormat: createCrossPlatformResponse(createHelloResponse(), 'flask'),
  compatible: createHelloResponse() // Base response compatible with both platforms
};

// Master mock responses collection
export const mockResponses = {
  hello: helloResponses,
  goodEvening: goodEveningResponses,
  health: healthResponses,
  error: errorResponses,
  security: securityResponses,
  performance: performanceResponses,
  crossPlatform: crossPlatformResponses
};

/**
 * Module Summary and Educational Value:
 * 
 * This comprehensive mock responses module provides production-ready mock HTTP response
 * generation for the Node.js tutorial project. It demonstrates advanced testing patterns,
 * security implementation, performance monitoring, and cross-platform compatibility
 * validation between Express.js and Flask implementations.
 * 
 * Key Features:
 * - Comprehensive mock response factory functions for all endpoint types
 * - Security testing with Helmet.js header validation and vulnerability simulation
 * - Performance testing with realistic timing and resource usage simulation
 * - Cross-platform compatibility testing between Node.js and Python implementations
 * - Advanced caching infrastructure with TTL management and cache invalidation
 * - Educational annotations and learning context throughout all responses
 * - Support for both Jest and Mocha testing frameworks
 * - Production-ready error handling and debugging information
 * 
 * Educational Value:
 * - Demonstrates comprehensive API testing strategies and mock data generation
 * - Shows security testing patterns with realistic attack scenario simulation
 * - Illustrates performance testing and benchmarking methodology
 * - Teaches cross-platform development and API compatibility validation
 * - Provides examples of production-ready error handling and debugging
 * - Shows modern JavaScript patterns and ES Modules usage
 * 
 * Production Features:
 * - Extensive mock response variation generation for comprehensive test coverage
 * - Security header validation and vulnerability testing scenarios
 * - Performance simulation with realistic timing and resource usage metrics
 * - Cross-platform response format validation for migration testing
 * - Advanced caching with performance optimization and memory management
 * - Correlation ID generation for request tracking and debugging
 * - Educational metadata for learning and documentation purposes
 */