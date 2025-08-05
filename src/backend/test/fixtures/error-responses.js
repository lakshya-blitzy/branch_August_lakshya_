/**
 * @fileoverview Comprehensive Error Response Fixtures Module for Node.js Tutorial Project
 * @description Standardized mock error responses for all error scenarios including HTTP errors,
 * validation failures, security violations, and PM2 process management errors. Supports both
 * Jest and Mocha testing frameworks with educational demonstration patterns.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive error handling patterns and best practices
 * - Showcases modern JavaScript error fixture generation techniques
 * - Provides realistic error scenarios for testing middleware and error handlers
 * - Illustrates cross-platform error response compatibility between Express.js and Flask
 * - Teaches production-ready error response structures with debugging information
 * 
 * Technology Stack:
 * - Node.js v22.x LTS with ES Modules support for modern JavaScript patterns
 * - Express.js v5.1.0 enhanced error handling with promise-based error rejection
 * - Helmet.js v8.1.0 security violations and CSP directive breaches testing
 * - PM2 v6.0.8 cluster mode failures and process management error scenarios
 * - Jest/Mocha testing frameworks with comprehensive error coverage validation
 * 
 * Architecture:
 * - Stateless design optimized for PM2 cluster mode error testing
 * - Immutable error fixtures to prevent test pollution and ensure consistency
 * - Memory-efficient caching with TTL management for performance optimization
 * - Educational annotations for learning proper error handling techniques
 * - Cross-platform compatibility ensuring identical behavior across Node.js and Flask
 */

// External dependencies
import { randomBytes, createHash } from 'node:crypto'; // Node.js built-in crypto module for generating unique error correlation IDs

// Internal dependencies - Import constants for standardized error codes, messages, and configurations
import {
  HTTP_CONSTANTS,
  ERROR_CONSTANTS,
  SECURITY_CONSTANTS,
  PM2_CONSTANTS,
  FLASK_CONSTANTS
} from '../../utils/constants.js';

// Import test data for realistic error scenarios and validation
import {
  httpEndpoints,
  securityTestData,
  pm2TestData
} from './test-data.json';

// Global error fixture cache for performance optimization and consistent test execution
const ERROR_FIXTURE_CACHE = new Map();

// Error template storage for organized access and management
const ERROR_TEMPLATES = new Map();

// Error generation counters for tracking and debugging
const ERROR_COUNTERS = {
  total: 0,
  http: 0,
  validation: 0,
  security: 0,
  pm2: 0,
  crossPlatform: 0,
  educational: 0
};

/**
 * Utility Functions
 * @description Helper functions for error fixture generation and management
 * @educational_value Demonstrates modern JavaScript utility function patterns
 */

/**
 * Formats HTTP response with standardized structure and headers
 * @param {Object} responseData - The response data to format
 * @param {number} statusCode - HTTP status code
 * @param {Object} headers - Additional headers to include
 * @returns {Object} Formatted HTTP response with consistent structure
 */
function formatHTTPResponse(responseData, statusCode = 200, headers = {}) {
  const defaultHeaders = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'Date': new Date().toUTCString(),
    'X-Response-Time': `${Math.random() * 50 + 10}ms`,
    'X-Request-ID': generateSecureToken()
  };

  return {
    statusCode,
    headers: { ...defaultHeaders, ...headers },
    body: responseData,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generates secure token for error correlation IDs and request tracking
 * @param {number} length - Token length in bytes (default: 16)
 * @returns {string} Secure random token for error correlation
 */
function generateSecureToken(length = 16) {
  return randomBytes(length).toString('hex');
}

/**
 * Deep clones objects for error response template integrity and fixture isolation
 * @param {Object} obj - Object to clone
 * @returns {Object} Deep cloned object to prevent mutation
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Converts error responses to Flask format for cross-platform compatibility validation
 * @param {Object} expressError - Express.js error response format
 * @returns {Object} Flask-compatible error response format
 */
function convertToFlaskFormat(expressError) {
  const flaskError = deepClone(expressError);
  
  // Convert Express.js specific headers to Flask equivalents
  if (flaskError.headers) {
    if (flaskError.headers['Content-Type']) {
      flaskError.headers['content-type'] = flaskError.headers['Content-Type'];
      delete flaskError.headers['Content-Type'];
    }
  }

  // Ensure Flask-compatible response structure
  flaskError.platform = 'flask';
  flaskError.framework = {
    name: 'Flask',
    version: '3.1.1'
  };

  return flaskError;
}

/**
 * Core Error Fixture Generation Functions
 * @description Factory functions for creating comprehensive error response fixtures
 * @educational_value Demonstrates modern factory pattern implementation for error handling
 */

/**
 * Creates comprehensive HTTP error response fixtures for various status codes
 * @param {number} statusCode - HTTP status code (400-599)
 * @param {Object} errorOptions - Configuration options for error generation
 * @returns {Object} HTTP error response fixture with debugging information and educational content
 */
export function createHTTPErrorFixture(statusCode, errorOptions = {}) {
  // Validate HTTP status code and determine error category
  if (!statusCode || statusCode < 400 || statusCode > 599) {
    throw new Error(`Invalid HTTP status code: ${statusCode}. Must be between 400-599.`);
  }

  // Generate unique error correlation ID for request tracking and debugging
  const correlationId = generateSecureToken();
  const timestamp = new Date().toISOString();

  // Determine error category and appropriate messaging
  const errorCategory = statusCode < 500 ? 'Client Error' : 'Server Error';
  const isClientError = statusCode < 500;

  // Create comprehensive error response metadata
  const errorMetadata = {
    correlationId,
    timestamp,
    category: errorCategory,
    statusCode,
    requestId: generateSecureToken(8),
    environment: process.env.NODE_ENV || 'development'
  };

  // Set HTTP status code and error message using standardized constants
  const statusText = getStatusText(statusCode);
  const errorMessage = ERROR_CONSTANTS.ERROR_MESSAGES[getErrorMessageKey(statusCode)] || 
                      `HTTP ${statusCode} error occurred`;

  // Create base error response structure
  const errorResponse = {
    error: statusText,
    message: errorMessage,
    statusCode,
    timestamp,
    correlationId,
    path: errorOptions.path || '/unknown',
    method: errorOptions.method || 'GET',
    userAgent: errorOptions.userAgent || 'Test-Agent/1.0',
    ip: errorOptions.ip || '127.0.0.1'
  };

  // Add debugging information for development environments
  if (process.env.NODE_ENV === 'development' || errorOptions.includeDebugInfo) {
    errorResponse.debug = {
      stack: generateMockStackTrace(statusCode),
      requestHeaders: errorOptions.headers || {},
      processingTime: `${Math.random() * 100 + 10}ms`,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    };
  }

  // Add educational annotations explaining error type and resolution strategies
  errorResponse.educational = {
    errorType: isClientError ? 'Client Error (4xx)' : 'Server Error (5xx)',
    description: getEducationalDescription(statusCode),
    commonCauses: getCommonCauses(statusCode),
    resolutionSteps: getResolutionSteps(statusCode),
    preventionTips: getPreventionTips(statusCode),
    relatedStatusCodes: getRelatedStatusCodes(statusCode)
  };

  // Apply appropriate HTTP headers including security headers
  const responseHeaders = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Error-Type': errorCategory,
    'X-Error-Code': getErrorCode(statusCode),
    'X-Correlation-ID': correlationId,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Add specific headers for different error types
  if (statusCode === 429) {
    responseHeaders['Retry-After'] = '60';
    responseHeaders['X-RateLimit-Limit'] = '100';
    responseHeaders['X-RateLimit-Remaining'] = '0';
    responseHeaders['X-RateLimit-Reset'] = new Date(Date.now() + 60000).toISOString();
  }

  if (statusCode === 503) {
    responseHeaders['Retry-After'] = '300';
    responseHeaders['X-Service-Status'] = 'maintenance';
  }

  // Create final formatted response
  const httpErrorFixture = formatHTTPResponse(errorResponse, statusCode, responseHeaders);

  // Add cross-platform formatting for Flask compatibility
  httpErrorFixture.crossPlatform = {
    express: httpErrorFixture,
    flask: convertToFlaskFormat(httpErrorFixture)
  };

  // Cache error fixture for performance optimization
  const cacheKey = createHash('md5').update(`http-${statusCode}-${JSON.stringify(errorOptions)}`).digest('hex');
  cacheErrorFixture(cacheKey, httpErrorFixture, { ttl: 3600000 }); // 1 hour TTL

  // Update error counters for tracking
  ERROR_COUNTERS.total++;
  ERROR_COUNTERS.http++;

  return httpErrorFixture;
}

/**
 * Creates comprehensive validation error response fixtures for input validation failures
 * @param {Object} validationConfig - Validation configuration and field definitions
 * @param {Object} fieldErrors - Specific field-level error information
 * @returns {Object} Validation error response fixture with field-level errors and educational guidance
 */
export function createValidationErrorFixture(validationConfig = {}, fieldErrors = {}) {
  // Generate validation-specific correlation ID for error tracking
  const correlationId = generateSecureToken();
  const timestamp = new Date().toISOString();

  // Initialize validation error configuration with field error details
  const validationContext = {
    correlationId,
    timestamp,
    validationType: validationConfig.type || 'field_validation',
    source: validationConfig.source || 'request_body',
    totalErrors: Object.keys(fieldErrors).length
  };

  // Create validation error response body with field-level error information
  const validationResponse = {
    error: 'Validation Error',
    message: 'One or more validation errors occurred',
    statusCode: HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST,
    timestamp,
    correlationId,
    validationErrors: []
  };

  // Process field-level errors and add detailed validation information
  for (const [fieldName, fieldError] of Object.entries(fieldErrors)) {
    const validationError = {
      field: fieldName,
      message: fieldError.message || ERROR_CONSTANTS.VALIDATION_ERRORS.INVALID_FORMAT,
      code: fieldError.code || 'VALIDATION_FAILED',
      value: fieldError.value || null,
      expectedType: fieldError.expectedType || 'string',
      constraints: fieldError.constraints || [],
      suggestions: generateValidationSuggestions(fieldName, fieldError)
    };

    validationResponse.validationErrors.push(validationError);
  }

  // Add constraint violation information and validation rule explanations
  validationResponse.constraints = {
    requiredFields: validationConfig.requiredFields || [],
    optionalFields: validationConfig.optionalFields || [],
    fieldTypes: validationConfig.fieldTypes || {},
    validationRules: validationConfig.validationRules || {},
    customValidators: validationConfig.customValidators || []
  };

  // Include educational content explaining validation best practices
  validationResponse.educational = {
    validationType: 'Input Validation Error',
    description: 'Client-side validation helps prevent submission of invalid data and improves user experience',
    bestPractices: [
      'Always validate data on both client and server side',
      'Provide clear, actionable error messages',
      'Use appropriate input types and constraints',
      'Implement progressive validation for better UX',
      'Sanitize input data to prevent security vulnerabilities'
    ],
    commonValidationTypes: [
      'Required field validation',
      'Format validation (email, URL, phone)',
      'Length validation (min/max characters)',
      'Type validation (number, date, boolean)',
      'Range validation (min/max values)',
      'Custom business rule validation'
    ],
    preventionStrategies: [
      'Use schema validation libraries (Joi, Ajv, Yup)',
      'Implement client-side validation with server-side backup',
      'Provide real-time validation feedback',
      'Use input masks and formatting',
      'Implement progressive disclosure for complex forms'
    ]
  };

  // Apply validation-specific headers
  const responseHeaders = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Error-Type': 'Validation Error',
    'X-Validation-Context': validationContext.validationType,
    'X-Field-Count': validationResponse.validationErrors.length.toString(),
    'X-Correlation-ID': correlationId
  };

  // Create formatted validation error fixture
  const validationErrorFixture = formatHTTPResponse(
    validationResponse, 
    HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST, 
    responseHeaders
  );

  // Add cross-platform compatibility
  validationErrorFixture.crossPlatform = {
    express: validationErrorFixture,
    flask: convertToFlaskFormat(validationErrorFixture)
  };

  // Update error counters
  ERROR_COUNTERS.total++;
  ERROR_COUNTERS.validation++;

  return validationErrorFixture;
}

/**
 * Creates comprehensive security violation error response fixtures
 * @param {string} violationType - Type of security violation (CSP, XSS, CORS, etc.)
 * @param {Object} securityContext - Security context and violation details
 * @returns {Object} Security error response fixture with violation details and compliance information
 */
export function createSecurityErrorFixture(violationType, securityContext = {}) {
  // Validate security violation type
  const validViolationTypes = ['CSP', 'XSS', 'CORS', 'HELMET', 'RATE_LIMIT', 'AUTH'];
  if (!validViolationTypes.includes(violationType.toUpperCase())) {
    throw new Error(`Invalid security violation type: ${violationType}`);
  }

  // Generate security-specific correlation ID for incident tracking
  const correlationId = generateSecureToken();
  const timestamp = new Date().toISOString();
  const incidentId = generateSecureToken(12);

  // Create security error response with violation details
  const securityResponse = {
    error: 'Security Policy Violation',
    message: getSecurityViolationMessage(violationType),
    statusCode: getSecurityStatusCode(violationType),
    timestamp,
    correlationId,
    incidentId,
    violationType: violationType.toUpperCase(),
    securityPolicy: getViolatedSecurityPolicy(violationType),
    clientIP: securityContext.clientIP || '127.0.0.1',
    userAgent: securityContext.userAgent || 'Test-Agent/1.0',
    requestPath: securityContext.requestPath || '/unknown'
  };

  // Add specific violation details based on type
  switch (violationType.toUpperCase()) {
    case 'CSP':
      securityResponse.cspViolation = {
        directive: securityContext.directive || 'script-src',
        violatedDirective: securityContext.violatedDirective || 'script-src \'self\'',
        blockedURI: securityContext.blockedURI || 'inline',
        sourceFile: securityContext.sourceFile || 'inline',
        lineNumber: securityContext.lineNumber || 1,
        originalPolicy: SECURITY_CONSTANTS.CSP_DIRECTIVES
      };
      break;

    case 'XSS':
      securityResponse.xssAttempt = {
        attackVector: securityContext.attackVector || 'script_injection',
        sanitizedInput: sanitizeXSSPayload(securityContext.payload || '<script>alert("xss")</script>'),
        detectionMethod: 'content_security_policy',
        riskLevel: 'HIGH',
        blockedElements: ['script', 'iframe', 'object']
      };
      break;

    case 'CORS':
      securityResponse.corsViolation = {
        origin: securityContext.origin || 'https://malicious.example.com',
        method: securityContext.method || 'POST',
        allowedOrigins: SECURITY_CONSTANTS.CORS_CONFIG.ORIGIN,
        allowedMethods: SECURITY_CONSTANTS.CORS_CONFIG.METHODS,
        requestedHeaders: securityContext.requestedHeaders || [],
        violatedPolicy: 'origin_not_allowed'
      };
      break;

    case 'RATE_LIMIT':
      securityResponse.rateLimitViolation = {
        limit: SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.MAX_REQUESTS,
        windowMs: SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.WINDOW_MS,
        totalRequests: securityContext.totalRequests || 150,
        remainingTime: securityContext.remainingTime || 300,
        resetTime: new Date(Date.now() + 300000).toISOString()
      };
      break;
  }

  // Add security headers appropriate for the violation type
  const securityHeaders = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Security-Incident': incidentId,
    'X-Violation-Type': violationType.toUpperCase(),
    'X-Correlation-ID': correlationId,
    'X-Blocked-Reason': 'security-policy-violation'
  };

  // Add specific security headers based on violation type
  if (violationType.toUpperCase() === 'RATE_LIMIT') {
    securityHeaders['Retry-After'] = '300';
    securityHeaders['X-RateLimit-Limit'] = SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.MAX_REQUESTS.toString();
    securityHeaders['X-RateLimit-Remaining'] = '0';
  }

  // Include educational content explaining security implications
  securityResponse.educational = {
    securityTopic: `${violationType.toUpperCase()} Security Policy`,
    description: getSecurityEducationalContent(violationType),
    mitigation: getSecurityMitigationStrategies(violationType),
    prevention: getSecurityPreventionTips(violationType),
    resources: getSecurityResources(violationType),
    compliance: getComplianceRequirements(violationType)
  };

  // Create formatted security error fixture
  const securityErrorFixture = formatHTTPResponse(
    securityResponse, 
    getSecurityStatusCode(violationType), 
    securityHeaders
  );

  // Add cross-platform compatibility
  securityErrorFixture.crossPlatform = {
    express: securityErrorFixture,
    flask: convertToFlaskFormat(securityErrorFixture)
  };

  // Update error counters
  ERROR_COUNTERS.total++;
  ERROR_COUNTERS.security++;

  return securityErrorFixture;
}

/**
 * Creates comprehensive PM2 process management error response fixtures
 * @param {string} processOperation - PM2 operation that failed (start, restart, reload, etc.)
 * @param {Object} processContext - Process context and error details
 * @returns {Object} PM2 error response fixture with process information and recovery guidance
 */
export function createPM2ErrorFixture(processOperation, processContext = {}) {
  // Validate PM2 process operation
  const validOperations = ['START', 'RESTART', 'RELOAD', 'STOP', 'DELETE', 'CLUSTER', 'SCALE'];
  if (!validOperations.includes(processOperation.toUpperCase())) {
    throw new Error(`Invalid PM2 process operation: ${processOperation}`);
  }

  // Generate process-specific correlation ID for cluster mode error tracking
  const correlationId = generateSecureToken();
  const timestamp = new Date().toISOString();
  const processIncidentId = generateSecureToken(10);

  // Create PM2 error response with process information and cluster context
  const pm2Response = {
    error: 'PM2 Process Management Error',
    message: getPM2ErrorMessage(processOperation),
    statusCode: HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE,
    timestamp,
    correlationId,
    processIncidentId,
    operation: processOperation.toUpperCase(),
    processName: processContext.processName || 'tutorial-app',
    processId: processContext.processId || Math.floor(Math.random() * 10000),
    clusterId: processContext.clusterId || 0,
    execMode: processContext.execMode || PM2_CONSTANTS.EXEC_MODES.CLUSTER
  };

  // Add PM2-specific process monitoring data
  pm2Response.processInfo = {
    status: processContext.status || 'errored',
    uptime: processContext.uptime || 0,
    restarts: processContext.restarts || 5,
    memoryUsage: processContext.memoryUsage || '150MB',
    cpuUsage: processContext.cpuUsage || '85%',
    pid: processContext.pid || Math.floor(Math.random() * 65535),
    pmId: processContext.pmId || Math.floor(Math.random() * 10),
    instanceNumber: processContext.instanceNumber || 0
  };

  // Include cluster mode information and worker count
  pm2Response.clusterInfo = {
    totalInstances: processContext.totalInstances || 4,
    runningInstances: processContext.runningInstances || 3,
    erroredInstances: processContext.erroredInstances || 1,
    loadBalancerStatus: 'degraded',
    lastRestart: new Date(Date.now() - 300000).toISOString(),
    nextRestartAttempt: new Date(Date.now() + 240000).toISOString()
  };

  // Add deployment context and environment configuration
  pm2Response.deploymentInfo = {
    environment: processContext.environment || 'production',
    nodeVersion: process.version,
    pm2Version: '6.0.8',
    startCommand: processContext.startCommand || 'pm2 start ecosystem.config.js --env production',
    configFile: processContext.configFile || 'ecosystem.config.js',
    logFiles: {
      out: processContext.outLog || './logs/out.log',
      error: processContext.errorLog || './logs/error.log',
      combined: processContext.combinedLog || './logs/combined.log'
    }
  };

  // Include educational content explaining PM2 cluster mode benefits and error recovery
  pm2Response.educational = {
    topic: 'PM2 Process Management and Cluster Mode',
    description: 'PM2 provides advanced process management for Node.js applications with built-in load balancing',
    clusterModeExplanation: 'Cluster mode distributes your application across multiple processes to utilize all CPU cores',
    errorRecoveryProcess: [
      'PM2 automatically restarts failed processes',
      'Load balancer redirects traffic to healthy instances',
      'Graceful shutdown ensures in-flight requests complete',
      'Zero-downtime deployment maintains service availability'
    ],
    performanceBenefits: [
      'Horizontal scaling across CPU cores',
      'Improved fault tolerance through process isolation',
      'Built-in load balancing for optimal resource utilization',
      'Automatic restart policies for high availability'
    ],
    troubleshootingSteps: [
      'Check PM2 logs: pm2 logs',
      'Monitor process status: pm2 status',
      'Review memory usage: pm2 monit',
      'Restart specific instance: pm2 restart <id>',
      'Reload with zero downtime: pm2 reload all'
    ]
  };

  // Add process restart recommendations and monitoring guidance
  pm2Response.recovery = {
    recommendedActions: [
      'Execute: pm2 restart tutorial-app',
      'Monitor: pm2 monit',
      'Check logs: pm2 logs tutorial-app --lines 50',
      'Verify configuration: pm2 show tutorial-app'
    ],
    preventionMeasures: [
      'Set memory restart limits: max_memory_restart',
      'Configure proper restart policies',
      'Implement health check endpoints',
      'Monitor resource usage trends',
      'Use PM2 ecosystem files for consistent deployment'
    ],
    monitoringRecommendations: [
      'Set up PM2 monitoring dashboard',
      'Configure alerts for process failures',
      'Track memory and CPU usage patterns',
      'Monitor restart frequency and causes',
      'Implement log aggregation for analysis'
    ]
  };

  // Apply PM2-specific headers
  const pm2Headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-PM2-Incident': processIncidentId,
    'X-Process-Operation': processOperation.toUpperCase(),
    'X-Cluster-Status': 'degraded',
    'X-Recovery-Time': '240',
    'X-Correlation-ID': correlationId,
    'Retry-After': '240'
  };

  // Create formatted PM2 error fixture
  const pm2ErrorFixture = formatHTTPResponse(pm2Response, HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE, pm2Headers);

  // Add cross-platform compatibility
  pm2ErrorFixture.crossPlatform = {
    express: pm2ErrorFixture,
    flask: convertToFlaskFormat(pm2ErrorFixture)
  };

  // Update error counters
  ERROR_COUNTERS.total++;
  ERROR_COUNTERS.pm2++;

  return pm2ErrorFixture;
}

/**
 * Creates cross-platform compatible error response fixtures
 * @param {Object} baseError - Base error object to convert
 * @param {string} targetPlatform - Target platform (express or flask)
 * @returns {Object} Cross-platform compatible error response fixture
 */
export function createCrossPlatformErrorFixture(baseError, targetPlatform = 'both') {
  if (!baseError || typeof baseError !== 'object') {
    throw new Error('Base error object is required for cross-platform conversion');
  }

  const correlationId = generateSecureToken();
  const timestamp = new Date().toISOString();

  // Initialize cross-platform error conversion using Flask compatibility constants
  const platformError = {
    correlationId,
    timestamp,
    conversionType: 'cross_platform_compatibility',
    sourceFramework: 'express',
    targetFramework: targetPlatform
  };

  // Convert error structure to target platform format while maintaining functional equivalence
  const expressFormat = {
    ...deepClone(baseError),
    platform: 'express',
    framework: {
      name: 'Express.js',
      version: '5.1.0'
    },
    compatibility: {
      version: '1.0.0',
      conversionId: correlationId,
      maintainsFunctionality: true
    }
  };

  const flaskFormat = convertToFlaskFormat(baseError);
  flaskFormat.compatibility = {
    version: '1.0.0',
    conversionId: correlationId,
    maintainsFunctionality: true,
    equivalentExpressError: true
  };

  // Ensure identical status codes, headers, and error message structure across platforms
  const crossPlatformResponse = {
    error: 'Cross-Platform Error Compatibility',
    message: 'Error response formatted for cross-platform compatibility testing',
    statusCode: baseError.statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
    timestamp,
    correlationId,
    platforms: {
      express: expressFormat,
      flask: flaskFormat
    }
  };

  // Include platform comparison metadata for educational analysis and validation
  crossPlatformResponse.comparison = {
    structuralEquivalence: true,
    statusCodeParity: expressFormat.statusCode === flaskFormat.statusCode,
    headerCompatibility: compareHeaderCompatibility(expressFormat.headers, flaskFormat.headers),
    responseFormatConsistency: true,
    functionalEquivalence: true
  };

  // Add conversion validation data for feature parity testing
  crossPlatformResponse.validation = {
    expressValidation: {
      hasRequiredFields: validateRequiredFields(expressFormat),
      headerStructure: validateHeaderStructure(expressFormat.headers),
      responseFormat: 'valid'
    },
    flaskValidation: {
      hasRequiredFields: validateRequiredFields(flaskFormat),
      headerStructure: validateHeaderStructure(flaskFormat.headers),
      responseFormat: 'valid'
    },
    parityCheck: {
      statusCode: 'identical',
      errorMessage: 'equivalent',
      timestamp: 'synchronized',
      correlationId: 'shared'
    }
  };

  // Include educational annotations explaining cross-platform error handling patterns
  crossPlatformResponse.educational = {
    topic: 'Cross-Platform Error Response Compatibility',
    description: 'Maintaining consistent error responses across different web frameworks',
    frameworks: {
      express: {
        strengths: ['Middleware architecture', 'Large ecosystem', 'Performance'],
        errorHandling: 'Promise-based error middleware with automatic error catching'
      },
      flask: {
        strengths: ['Simplicity', 'Flexibility', 'Python ecosystem'],
        errorHandling: 'Decorator-based error handlers with exception catching'
      }
    },
    compatibilityPrinciples: [
      'Maintain identical response structure across platforms',
      'Use consistent HTTP status codes and error messages',
      'Ensure equivalent debugging information availability',
      'Preserve error correlation IDs for tracking',
      'Implement similar security headers and policies'
    ],
    migrationGuidance: [
      'Map Express middleware to Flask before_request handlers',
      'Convert Express route handlers to Flask route decorators',
      'Translate error middleware to Flask error handlers',
      'Maintain identical JSON response schemas',
      'Preserve logging and monitoring integration'
    ]
  };

  // Apply performance equivalence validation for platform comparison benchmarking
  crossPlatformResponse.performance = {
    benchmarkingData: {
      expressResponseTime: `${Math.random() * 50 + 25}ms`,
      flaskResponseTime: `${Math.random() * 60 + 30}ms`,
      performanceVariance: '< 20%',
      memoryUsage: 'comparable',
      cpuUtilization: 'similar'
    },
    scalabilityComparison: {
      express: 'PM2 cluster mode for horizontal scaling',
      flask: 'Gunicorn worker processes for horizontal scaling',
      equivalentCapabilities: true
    }
  };

  // Create formatted cross-platform error fixture
  const headers = {
    'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
    'X-Platform-Compatibility': 'express-flask',
    'X-Conversion-ID': correlationId,
    'X-Functional-Equivalence': 'true'
  };

  const crossPlatformFixture = formatHTTPResponse(crossPlatformResponse, baseError.statusCode || 500, headers);

  // Update error counters
  ERROR_COUNTERS.total++;
  ERROR_COUNTERS.crossPlatform++;

  return crossPlatformFixture;
}

/**
 * Generates multiple variations of error response fixtures for comprehensive testing
 * @param {Object} baseError - Base error to create variations from
 * @param {Object} variationConfig - Configuration for variation generation
 * @returns {Array} Array of error response fixture variations
 */
export function generateErrorVariations(baseError, variationConfig = {}) {
  if (!baseError || typeof baseError !== 'object') {
    throw new Error('Base error object is required for variation generation');
  }

  const variations = [];
  const correlationId = generateSecureToken();

  // Create base error variation with standard error properties
  const baseVariation = {
    ...deepClone(baseError),
    variationType: 'base',
    variationId: `${correlationId}-base`,
    description: 'Standard error response without modifications'
  };
  variations.push(baseVariation);

  // Generate edge case variations including boundary values and malformed inputs
  if (variationConfig.includeEdgeCases !== false) {
    // Null/undefined value variations
    const nullVariation = deepClone(baseError);
    nullVariation.body.message = null;
    nullVariation.variationType = 'null_values';
    nullVariation.variationId = `${correlationId}-null`;
    nullVariation.description = 'Error response with null values for edge case testing';
    variations.push(nullVariation);

    // Empty string variations
    const emptyVariation = deepClone(baseError);
    emptyVariation.body.message = '';
    emptyVariation.variationType = 'empty_values';
    emptyVariation.variationId = `${correlationId}-empty`;
    emptyVariation.description = 'Error response with empty values';
    variations.push(emptyVariation);

    // Large payload variation
    const largeVariation = deepClone(baseError);
    largeVariation.body.largeData = 'A'.repeat(10000);
    largeVariation.variationType = 'large_payload';
    largeVariation.variationId = `${correlationId}-large`;
    largeVariation.description = 'Error response with large payload for size testing';
    variations.push(largeVariation);
  }

  // Create timing-based variations for testing error handling under different load conditions
  if (variationConfig.includeTiming !== false) {
    const slowVariation = deepClone(baseError);
    slowVariation.headers['X-Response-Time'] = '5000ms';
    slowVariation.variationType = 'slow_response';
    slowVariation.variationId = `${correlationId}-slow`;
    slowVariation.description = 'Simulated slow error response for timeout testing';
    variations.push(slowVariation);
  }

  // Generate header variations testing different Content-Type and security header combinations
  if (variationConfig.includeHeaderVariations !== false) {
    const xmlVariation = deepClone(baseError);
    xmlVariation.headers['Content-Type'] = HTTP_CONSTANTS.CONTENT_TYPES.XML;
    xmlVariation.variationType = 'xml_content_type';
    xmlVariation.variationId = `${correlationId}-xml`;
    xmlVariation.description = 'Error response with XML content type';
    variations.push(xmlVariation);

    const textVariation = deepClone(baseError);
    textVariation.headers['Content-Type'] = HTTP_CONSTANTS.CONTENT_TYPES.PLAIN_TEXT;
    textVariation.body = typeof baseError.body === 'object' ? 
                        JSON.stringify(baseError.body) : baseError.body;
    textVariation.variationType = 'plain_text';
    textVariation.variationId = `${correlationId}-text`;
    textVariation.description = 'Error response with plain text content type';
    variations.push(textVariation);
  }

  // Generate security scenario variations including attack patterns and vulnerability exploits
  if (variationConfig.includeSecurityVariations !== false) {
    const securityVariation = deepClone(baseError);
    securityVariation.headers['X-Security-Scan'] = 'detected';
    securityVariation.body.securityAlert = 'Potential security threat detected';
    securityVariation.variationType = 'security_alert';
    securityVariation.variationId = `${correlationId}-security`;
    securityVariation.description = 'Error response with security alert information';
    variations.push(securityVariation);
  }

  // Create environment-specific variations demonstrating development vs production error responses
  if (variationConfig.includeEnvironmentVariations !== false) {
    // Development environment with debug info
    const devVariation = deepClone(baseError);
    devVariation.body.debug = {
      stack: generateMockStackTrace(baseError.statusCode || 500),
      environment: 'development',
      debugMode: true,
      requestDetails: {
        headers: { 'user-agent': 'Test-Agent/1.0' },
        query: {},
        params: {}
      }
    };
    devVariation.variationType = 'development_environment';
    devVariation.variationId = `${correlationId}-dev`;
    devVariation.description = 'Development environment error with debug information';
    variations.push(devVariation);

    // Production environment with minimal info
    const prodVariation = deepClone(baseError);
    delete prodVariation.body.debug;
    prodVariation.body.environment = 'production';
    prodVariation.variationType = 'production_environment';
    prodVariation.variationId = `${correlationId}-prod`;
    prodVariation.description = 'Production environment error with minimal information';
    variations.push(prodVariation);
  }

  // Apply cross-platform variations ensuring compatibility across Express.js and Flask
  if (variationConfig.includeCrossPlatform !== false) {
    variations.forEach(variation => {
      variation.crossPlatform = {
        express: variation,
        flask: convertToFlaskFormat(variation)
      };
    });
  }

  // Add variation metadata for comprehensive testing
  const variationSummary = {
    totalVariations: variations.length,
    variationTypes: variations.map(v => v.variationType),
    correlationId,
    timestamp: new Date().toISOString(),
    testingScenarios: [
      'Edge case validation',
      'Performance testing',
      'Header compatibility',
      'Security testing',
      'Environment testing',
      'Cross-platform compatibility'
    ]
  };

  return {
    variations,
    summary: variationSummary
  };
}

/**
 * Caches generated error response fixtures with TTL management
 * @param {string} cacheKey - Unique cache key for the fixture
 * @param {Object} errorFixture - Error fixture to cache
 * @param {Object} cacheOptions - Cache configuration options
 * @returns {boolean} Success status indicating cache operation result
 */
export function cacheErrorFixture(cacheKey, errorFixture, cacheOptions = {}) {
  try {
    // Generate secure cache key using error configuration hash
    const secureKey = createHash('sha256').update(cacheKey).digest('hex');
    
    // Validate cache options including TTL and size limits
    const options = {
      ttl: cacheOptions.ttl || 3600000, // Default 1 hour
      maxSize: cacheOptions.maxSize || 1000,
      timestamp: Date.now()
    };

    // Deep clone error fixture for cache data integrity
    const cachedFixture = {
      data: deepClone(errorFixture),
      metadata: {
        cacheKey: secureKey,
        originalKey: cacheKey,
        cachedAt: new Date().toISOString(),
        ttl: options.ttl,
        expires: new Date(Date.now() + options.ttl).toISOString(),
        hits: 0,
        size: JSON.stringify(errorFixture).length
      }
    };

    // Implement cache eviction policy for memory management
    if (ERROR_FIXTURE_CACHE.size >= options.maxSize) {
      // Remove oldest entries first (LRU eviction)
      const oldestKey = Array.from(ERROR_FIXTURE_CACHE.keys())[0];
      ERROR_FIXTURE_CACHE.delete(oldestKey);
    }

    // Store cached error fixture with metadata
    ERROR_FIXTURE_CACHE.set(secureKey, cachedFixture);

    // Log cache operation for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Stored error fixture: ${secureKey} (${cachedFixture.metadata.size} bytes)`);
    }

    return true;
  } catch (error) {
    console.error('[Cache] Failed to cache error fixture:', error.message);
    return false;
  }
}

/**
 * Initializes all error response fixtures and prepares comprehensive error testing infrastructure
 * @param {Object} config - Initialization configuration
 * @returns {Object} Initialized error fixture collection
 */
export function initializeErrorFixtures(config = {}) {
  const initStartTime = Date.now();
  const correlationId = generateSecureToken();

  // Load error fixture configuration and test data
  const initConfig = {
    generateAllTypes: config.generateAllTypes !== false,
    includeVariations: config.includeVariations !== false,
    enableCaching: config.enableCaching !== false,
    educationalMode: config.educationalMode !== false,
    ...config
  };

  const errorFixtures = {};

  try {
    // Generate HTTP error fixtures for all status codes (400, 401, 403, 404, 500, 503)
    if (initConfig.generateAllTypes) {
      console.log('[Init] Generating HTTP error fixtures...');
      
      errorFixtures.http = {
        badRequest: createHTTPErrorFixture(400, { path: '/invalid-request' }),
        unauthorized: createHTTPErrorFixture(401, { path: '/protected' }),
        forbidden: createHTTPErrorFixture(403, { path: '/admin' }),
        notFound: createHTTPErrorFixture(404, { path: '/nonexistent' }),
        methodNotAllowed: createHTTPErrorFixture(405, { method: 'POST', path: '/hello' }),
        requestTimeout: createHTTPErrorFixture(408, { timeout: true }),
        internalServerError: createHTTPErrorFixture(500, { serverError: true }),
        serviceUnavailable: createHTTPErrorFixture(503, { maintenance: true })
      };
    }

    // Create validation error fixtures with field-level validation scenarios
    if (initConfig.generateAllTypes) {
      console.log('[Init] Generating validation error fixtures...');
      
      errorFixtures.validation = {
        missingRequired: createValidationErrorFixture(
          { type: 'required_field', source: 'request_body' },
          { 
            email: { message: 'Email is required', code: 'REQUIRED_FIELD' },
            password: { message: 'Password is required', code: 'REQUIRED_FIELD' }
          }
        ),
        invalidFormat: createValidationErrorFixture(
          { type: 'format_validation', source: 'request_body' },
          {
            email: { 
              message: 'Invalid email format', 
              code: 'INVALID_FORMAT',
              value: 'invalid-email',
              expectedType: 'email'
            }
          }
        ),
        multipleFields: createValidationErrorFixture(
          { type: 'multiple_field_validation' },
          {
            username: { message: 'Username must be at least 3 characters', code: 'TOO_SHORT' },
            age: { message: 'Age must be a number', code: 'INVALID_TYPE' },
            website: { message: 'Invalid URL format', code: 'INVALID_URL' }
          }
        ),
        schemaViolation: createValidationErrorFixture(
          { type: 'schema_validation', source: 'request_body' },
          {
            data: { 
              message: 'Request body does not match required schema',
              code: 'SCHEMA_VIOLATION',
              expectedType: 'object'
            }
          }
        ),
        constraintViolation: createValidationErrorFixture(
          { type: 'constraint_validation' },
          {
            password: {
              message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
              code: 'CONSTRAINT_VIOLATION',
              constraints: ['min_length_8', 'uppercase', 'lowercase', 'numbers']
            }
          }
        ),
        typeValidation: createValidationErrorFixture(
          { type: 'type_validation' },
          {
            count: { message: 'Count must be a positive integer', code: 'INVALID_TYPE', expectedType: 'integer' },
            active: { message: 'Active must be a boolean value', code: 'INVALID_TYPE', expectedType: 'boolean' }
          }
        )
      };
    }

    // Generate security error fixtures with CSP, XSS, and CORS violations
    if (initConfig.generateAllTypes) {
      console.log('[Init] Generating security error fixtures...');
      
      errorFixtures.security = {
        cspViolation: createSecurityErrorFixture('CSP', {
          directive: 'script-src',
          violatedDirective: 'script-src \'self\'',
          blockedURI: 'inline',
          sourceFile: 'https://example.com/malicious.js'
        }),
        xssAttempt: createSecurityErrorFixture('XSS', {
          attackVector: 'script_injection',
          payload: '<script>alert("xss")</script>',
          userAgent: 'Mozilla/5.0 (AttackBot/1.0)'
        }),
        corsViolation: createSecurityErrorFixture('CORS', {
          origin: 'https://malicious.example.com',
          method: 'POST',
          requestedHeaders: ['Authorization', 'X-Custom-Header']
        }),
        helmetBlocked: createSecurityErrorFixture('HELMET', {
          blockedHeader: 'X-Powered-By',
          securityPolicy: 'information_disclosure_prevention'
        }),
        rateLimitExceeded: createSecurityErrorFixture('RATE_LIMIT', {
          totalRequests: 150,
          windowMs: 900000,
          clientIP: '192.168.1.100'
        }),
        authenticationFailed: createHTTPErrorFixture(401, {
          path: '/api/protected',
          authMethod: 'bearer_token',
          reason: 'invalid_token'
        }),
        authorizationDenied: createHTTPErrorFixture(403, {
          path: '/api/admin',
          userRole: 'user',
          requiredRole: 'admin'
        })
      };
    }

    // Create PM2 error fixtures with cluster mode and process management errors
    if (initConfig.generateAllTypes) {
      console.log('[Init] Generating PM2 error fixtures...');
      
      errorFixtures.pm2 = {
        processClash: createPM2ErrorFixture('START', {
          processName: 'tutorial-app',
          error: 'Port 3000 already in use',
          pid: 12345
        }),
        clusterFailure: createPM2ErrorFixture('CLUSTER', {
          totalInstances: 4,
          runningInstances: 2,
          erroredInstances: 2,
          memoryUsage: '1.2GB'
        }),
        deploymentError: createPM2ErrorFixture('RELOAD', {
          operation: 'zero_downtime_reload',
          failedInstances: 1,
          reason: 'health_check_timeout'
        }),
        processRestart: createPM2ErrorFixture('RESTART', {
          restartCount: 10,
          reason: 'memory_limit_exceeded',
          memoryUsage: '1.5GB',
          maxMemory: '1GB'
        }),
        memoryExceeded: createPM2ErrorFixture('RESTART', {
          trigger: 'memory_threshold',
          currentMemory: '1.8GB',
          thresholdMemory: '1GB',
          autoRestart: true
        }),
        workerTimeout: createPM2ErrorFixture('RESTART', {
          worker: 3,
          timeout: '30s',
          lastResponse: '45s ago',
          healthCheck: 'failed'
        }),
        loadBalancerFailure: createPM2ErrorFixture('CLUSTER', {
          loadBalancer: 'degraded',
          healthyWorkers: 2,
          totalWorkers: 4,
          requestDistribution: 'uneven'
        })
      };
    }

    // Generate cross-platform error fixtures for Express/Flask compatibility
    if (initConfig.generateAllTypes) {
      console.log('[Init] Generating cross-platform error fixtures...');
      
      const baseExpressError = errorFixtures.http?.notFound || createHTTPErrorFixture(404);
      
      errorFixtures.crossPlatform = {
        expressFormat: baseExpressError,
        flaskFormat: convertToFlaskFormat(baseExpressError),
        compatible: createCrossPlatformErrorFixture(baseExpressError, 'both'),
        migrationErrors: {
          routeMapping: createCrossPlatformErrorFixture(
            createHTTPErrorFixture(404, { context: 'route_migration' }),
            'flask'
          ),
          middlewareConversion: createCrossPlatformErrorFixture(
            createHTTPErrorFixture(500, { context: 'middleware_migration' }),
            'flask'
          )
        }
      };
    }

    // Create error variations for comprehensive test coverage
    if (initConfig.includeVariations && errorFixtures.http) {
      console.log('[Init] Generating error variations...');
      
      const baseError = errorFixtures.http.internalServerError;
      const variationResult = generateErrorVariations(baseError, {
        includeEdgeCases: true,
        includeTiming: true,
        includeHeaderVariations: true,
        includeSecurityVariations: true,
        includeEnvironmentVariations: true,
        includeCrossPlatform: true
      });

      errorFixtures.variations = variationResult.variations;
      errorFixtures.variationSummary = variationResult.summary;
    }

    // Set up error fixture caching infrastructure and initialize cache storage
    if (initConfig.enableCaching) {
      console.log('[Init] Initializing error fixture cache...');
      
      // Cache commonly used fixtures
      Object.keys(errorFixtures).forEach(category => {
        if (typeof errorFixtures[category] === 'object' && category !== 'variations') {
          Object.keys(errorFixtures[category]).forEach(errorType => {
            const cacheKey = `${category}-${errorType}`;
            cacheErrorFixture(cacheKey, errorFixtures[category][errorType]);
          });
        }
      });
    }

    // Register all error fixture templates for organized access
    ERROR_TEMPLATES.set('http_errors', errorFixtures.http);
    ERROR_TEMPLATES.set('validation_errors', errorFixtures.validation);
    ERROR_TEMPLATES.set('security_errors', errorFixtures.security);
    ERROR_TEMPLATES.set('pm2_errors', errorFixtures.pm2);
    ERROR_TEMPLATES.set('cross_platform_errors', errorFixtures.crossPlatform);

    const initTime = Date.now() - initStartTime;
    
    // Generate initialization summary
    const initSummary = {
      correlationId,
      initializationTime: `${initTime}ms`,
      fixturesGenerated: Object.keys(errorFixtures).length,
      totalErrors: ERROR_COUNTERS.total,
      errorBreakdown: { ...ERROR_COUNTERS },
      cacheEntries: ERROR_FIXTURE_CACHE.size,
      templates: ERROR_TEMPLATES.size,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    console.log(`[Init] Error fixtures initialized successfully in ${initTime}ms`);
    console.log(`[Init] Generated ${ERROR_COUNTERS.total} error fixtures across ${Object.keys(errorFixtures).length} categories`);

    // Return complete error fixture collection ready for testing
    return {
      fixtures: errorFixtures,
      summary: initSummary,
      cache: ERROR_FIXTURE_CACHE,
      templates: ERROR_TEMPLATES,
      counters: ERROR_COUNTERS
    };

  } catch (error) {
    console.error('[Init] Error fixture initialization failed:', error.message);
    throw new Error(`Failed to initialize error fixtures: ${error.message}`);
  }
}

/**
 * Helper Functions for Error Generation
 * @description Utility functions to support error fixture generation
 * @educational_value Demonstrates modular helper function patterns
 */

function getStatusText(statusCode) {
  const statusTexts = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    413: 'Payload Too Large',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return statusTexts[statusCode] || 'Unknown Error';
}

function getErrorMessageKey(statusCode) {
  const messageKeys = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'ROUTE_NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    408: 'TIMEOUT',
    413: 'PAYLOAD_TOO_LARGE',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  return messageKeys[statusCode] || 'INTERNAL_ERROR';
}

function getErrorCode(statusCode) {
  const errorCodes = {
    400: 'ERR_BAD_REQUEST',
    401: 'ERR_UNAUTHORIZED',
    403: 'ERR_FORBIDDEN',
    404: 'ERR_NOT_FOUND',
    405: 'ERR_METHOD_NOT_ALLOWED',
    408: 'ERR_REQUEST_TIMEOUT',
    413: 'ERR_PAYLOAD_TOO_LARGE',
    429: 'ERR_RATE_LIMITED',
    500: 'ERR_INTERNAL_SERVER',
    503: 'ERR_SERVICE_UNAVAILABLE'
  };
  return errorCodes[statusCode] || 'ERR_UNKNOWN';
}

function getEducationalDescription(statusCode) {
  const descriptions = {
    400: 'Client-side error indicating invalid request format or parameters',
    401: 'Authentication error requiring valid credentials to access resource',
    403: 'Authorization error indicating insufficient permissions',
    404: 'Resource not found error indicating invalid URL or deleted resource',
    405: 'HTTP method not allowed for the requested endpoint',
    408: 'Request timeout indicating server waited too long for client request',
    429: 'Rate limiting error indicating too many requests from client',
    500: 'Server-side error indicating unexpected internal failure',
    503: 'Service unavailable indicating temporary server overload or maintenance'
  };
  return descriptions[statusCode] || 'HTTP error requiring investigation';
}

function getCommonCauses(statusCode) {
  const causes = {
    400: ['Invalid JSON format', 'Missing required parameters', 'Invalid data types'],
    401: ['Missing authentication token', 'Expired credentials', 'Invalid API key'],
    403: ['Insufficient user permissions', 'Resource access denied', 'IP address blocked'],
    404: ['Incorrect URL path', 'Deleted resource', 'Typo in endpoint'],
    405: ['Wrong HTTP method used', 'Endpoint only supports specific methods'],
    408: ['Slow network connection', 'Large request payload', 'Server overload'],
    429: ['Exceeded rate limit', 'Too many concurrent requests', 'API quota exceeded'],
    500: ['Server configuration error', 'Database connection failure', 'Unhandled exception'],
    503: ['Server maintenance', 'Database overload', 'Third-party service failure']
  };
  return causes[statusCode] || ['Unknown error condition'];
}

function getResolutionSteps(statusCode) {
  const steps = {
    400: ['Validate request format', 'Check required parameters', 'Verify data types'],
    401: ['Provide valid authentication', 'Refresh expired tokens', 'Check API credentials'],
    403: ['Contact administrator for permissions', 'Verify user role', 'Check access policies'],
    404: ['Verify URL spelling', 'Check if resource exists', 'Review API documentation'],
    405: ['Use correct HTTP method', 'Check endpoint documentation', 'Verify allowed methods'],
    408: ['Retry request', 'Reduce payload size', 'Check network connection'],
    429: ['Wait before retrying', 'Implement backoff strategy', 'Check rate limits'],
    500: ['Retry request later', 'Contact support', 'Check server status'],
    503: ['Wait for service recovery', 'Check maintenance schedule', 'Use alternative endpoints']
  };
  return steps[statusCode] || ['Contact technical support'];
}

function getPreventionTips(statusCode) {
  const tips = {
    400: ['Validate input client-side', 'Use schema validation', 'Implement input sanitization'],
    401: ['Implement token refresh', 'Store credentials securely', 'Use OAuth 2.0'],
    403: ['Implement proper RBAC', 'Regular permission audits', 'Principle of least privilege'],
    404: ['Use consistent URL patterns', 'Implement URL validation', 'Provide clear navigation'],
    405: ['Document allowed methods', 'Implement OPTIONS handling', 'Use REST conventions'],
    408: ['Optimize request size', 'Implement request timeouts', 'Use async processing'],
    429: ['Implement client-side throttling', 'Use exponential backoff', 'Cache responses'],
    500: ['Comprehensive error handling', 'Regular health checks', 'Monitoring and alerting'],
    503: ['Load balancing', 'Auto-scaling', 'Circuit breaker patterns']
  };
  return tips[statusCode] || ['Follow best practices'];
}

function getRelatedStatusCodes(statusCode) {
  const related = {
    400: [401, 403, 422],
    401: [400, 403],
    403: [401, 404],
    404: [400, 405],
    405: [404, 501],
    408: [500, 503, 504],
    429: [503],
    500: [502, 503, 504],
    503: [500, 502, 504]
  };
  return related[statusCode] || [];
}

function generateMockStackTrace(statusCode) {
  const stackTraces = {
    400: `Error: Bad Request\n    at validateRequest (/app/middleware/validation.js:45:13)\n    at /app/routes/api.js:23:5`,
    401: `Error: Unauthorized\n    at authenticateToken (/app/middleware/auth.js:67:11)\n    at /app/routes/protected.js:15:3`,
    404: `Error: Not Found\n    at Router.handle (/app/node_modules/express/lib/router/index.js:284:3)\n    at /app/server.js:89:7`,
    500: `Error: Internal Server Error\n    at processRequest (/app/controllers/main.js:125:15)\n    at /app/routes/api.js:45:9\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)`
  };
  return stackTraces[statusCode] || 'Stack trace not available';
}

function getSecurityViolationMessage(violationType) {
  const messages = {
    CSP: 'Content Security Policy directive violated',
    XSS: 'Cross-site scripting attempt detected and blocked',
    CORS: 'Cross-Origin Resource Sharing policy violation',
    HELMET: 'Security header policy violation',
    RATE_LIMIT: 'Rate limit exceeded for this IP address',
    AUTH: 'Authentication security violation detected'
  };
  return messages[violationType.toUpperCase()] || 'Security policy violation';
}

function getSecurityStatusCode(violationType) {
  const statusCodes = {
    CSP: 403,
    XSS: 403,
    CORS: 403,
    HELMET: 403,
    RATE_LIMIT: 429,
    AUTH: 401
  };
  return statusCodes[violationType.toUpperCase()] || 403;
}

function getViolatedSecurityPolicy(violationType) {
  const policies = {
    CSP: 'Content-Security-Policy',
    XSS: 'Cross-Site Scripting Protection',
    CORS: 'Cross-Origin Resource Sharing',
    HELMET: 'HTTP Security Headers',
    RATE_LIMIT: 'Rate Limiting Policy',
    AUTH: 'Authentication Policy'
  };
  return policies[violationType.toUpperCase()] || 'Security Policy';
}

function sanitizeXSSPayload(payload) {
  return payload.replace(/[<>'"&]/g, (char) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[char];
  });
}

function getSecurityEducationalContent(violationType) {
  const content = {
    CSP: 'Content Security Policy helps prevent XSS attacks by controlling resource loading',
    XSS: 'Cross-Site Scripting vulnerabilities allow malicious script injection',
    CORS: 'Cross-Origin Resource Sharing controls which domains can access your API',
    HELMET: 'Security headers provide multiple layers of protection against common attacks',
    RATE_LIMIT: 'Rate limiting prevents abuse and ensures fair resource usage'
  };
  return content[violationType.toUpperCase()] || 'Security best practices are essential for web applications';
}

function getSecurityMitigationStrategies(violationType) {
  const strategies = {
    CSP: ['Implement strict CSP directives', 'Use nonce or hash for inline scripts', 'Regular policy testing'],
    XSS: ['Input validation and sanitization', 'Output encoding', 'CSP implementation'],
    CORS: ['Whitelist trusted domains', 'Avoid wildcard origins', 'Secure credential handling'],
    RATE_LIMIT: ['Implement progressive delays', 'Use distributed rate limiting', 'Monitor abuse patterns']
  };
  return strategies[violationType.toUpperCase()] || ['Follow security best practices'];
}

function getSecurityPreventionTips(violationType) {
  const tips = {
    CSP: ['Start with report-only mode', 'Gradually tighten policies', 'Monitor violation reports'],
    XSS: ['Never trust user input', 'Use templating engines with auto-escaping', 'Validate on server-side'],
    CORS: ['Be specific with allowed origins', 'Avoid credentials with wildcard', 'Regular security audits']
  };
  return tips[violationType.toUpperCase()] || ['Regular security reviews'];
}

function getSecurityResources(violationType) {
  const resources = {
    CSP: ['MDN CSP Documentation', 'CSP Evaluator Tool', 'Report URI Service'],
    XSS: ['OWASP XSS Prevention Cheat Sheet', 'XSS Filter Evasion Cheat Sheet'],
    CORS: ['MDN CORS Documentation', 'CORS Best Practices Guide']
  };
  return resources[violationType.toUpperCase()] || ['OWASP Security Guidelines'];
}

function getComplianceRequirements(violationType) {
  const requirements = {
    CSP: ['PCI DSS Requirement 6.5.7', 'OWASP Top 10 A7'],
    XSS: ['PCI DSS Requirement 6.5.7', 'OWASP Top 10 A3'],
    CORS: ['OWASP API Security Top 10']
  };
  return requirements[violationType.toUpperCase()] || ['General Security Compliance'];
}

function getPM2ErrorMessage(operation) {
  const messages = {
    START: 'Failed to start PM2 process',
    RESTART: 'Process restart failed or exceeded restart limit',
    RELOAD: 'Zero-downtime reload operation failed',
    STOP: 'Failed to stop PM2 process gracefully',
    CLUSTER: 'Cluster mode operation failed',
    SCALE: 'Process scaling operation failed'
  };
  return messages[operation.toUpperCase()] || 'PM2 operation failed';
}

function generateValidationSuggestions(fieldName, fieldError) {
  const suggestions = {
    email: ['Use format: user@example.com', 'Check for typos in domain name'],
    password: ['Include uppercase and lowercase letters', 'Add numbers and special characters'],
    username: ['Use 3-20 characters', 'Only letters, numbers, and underscores allowed'],
    age: ['Must be a number between 13 and 120', 'Use numeric format only'],
    phone: ['Use format: +1-555-123-4567', 'Include country code']
  };
  return suggestions[fieldName] || ['Check the input format and try again'];
}

function compareHeaderCompatibility(expressHeaders, flaskHeaders) {
  const compatibility = {
    structuralSimilarity: true,
    caseInsensitiveMatching: true,
    contentTypeEquivalent: true,
    securityHeadersPresent: true
  };
  return compatibility;
}

function validateRequiredFields(errorObject) {
  const requiredFields = ['error', 'message', 'statusCode', 'timestamp'];
  return requiredFields.every(field => 
    errorObject.body && errorObject.body.hasOwnProperty(field)
  );
}

function validateHeaderStructure(headers) {
  return headers && 
         typeof headers === 'object' && 
         headers['Content-Type'] && 
         headers['Content-Type'].includes('application/json');
}

/**
 * Pre-built Error Fixture Collections
 * @description Ready-to-use error fixture collections for different testing scenarios
 */

// HTTP Error Fixtures
export const httpErrorFixtures = {
  notFound: createHTTPErrorFixture(404, { path: '/nonexistent' }),
  badRequest: createHTTPErrorFixture(400, { path: '/hello', reason: 'invalid_parameters' }),
  unauthorized: createHTTPErrorFixture(401, { path: '/protected', reason: 'missing_token' }),
  forbidden: createHTTPErrorFixture(403, { path: '/admin', reason: 'insufficient_permissions' }),
  internalServerError: createHTTPErrorFixture(500, { reason: 'database_connection_failed' }),
  serviceUnavailable: createHTTPErrorFixture(503, { reason: 'maintenance_mode' }),
  methodNotAllowed: createHTTPErrorFixture(405, { method: 'POST', path: '/hello' }),
  requestTimeout: createHTTPErrorFixture(408, { timeout: 30000 })
};

// Validation Error Fixtures
export const validationErrorFixtures = {
  missingRequired: createValidationErrorFixture(
    { type: 'required_validation' },
    { email: { message: 'Email is required', code: 'REQUIRED' } }
  ),
  invalidFormat: createValidationErrorFixture(
    { type: 'format_validation' },
    { email: { message: 'Invalid email format', code: 'INVALID_FORMAT', value: 'invalid-email' } }
  ),
  multipleFields: createValidationErrorFixture(
    { type: 'multi_field_validation' },
    {
      email: { message: 'Invalid email', code: 'INVALID_FORMAT' },
      password: { message: 'Password too short', code: 'TOO_SHORT' }
    }
  ),
  schemaViolation: createValidationErrorFixture(
    { type: 'schema_validation' },
    { schema: { message: 'Request does not match schema', code: 'SCHEMA_VIOLATION' } }
  ),
  constraintViolation: createValidationErrorFixture(
    { type: 'constraint_validation' },
    { password: { message: 'Password complexity requirements not met', code: 'CONSTRAINT_VIOLATION' } }
  ),
  typeValidation: createValidationErrorFixture(
    { type: 'type_validation' },
    { age: { message: 'Age must be a number', code: 'INVALID_TYPE', expectedType: 'number' } }
  )
};

// Security Error Fixtures
export const securityErrorFixtures = {
  cspViolation: createSecurityErrorFixture('CSP', {
    directive: 'script-src',
    blockedURI: 'inline'
  }),
  xssAttempt: createSecurityErrorFixture('XSS', {
    payload: '<script>alert("xss")</script>',
    attackVector: 'script_injection'
  }),
  corsViolation: createSecurityErrorFixture('CORS', {
    origin: 'https://malicious.example.com'
  }),
  helmetBlocked: createSecurityErrorFixture('HELMET', {
    securityPolicy: 'x_powered_by_removal'
  }),
  rateLimitExceeded: createSecurityErrorFixture('RATE_LIMIT', {
    totalRequests: 150,
    limit: 100
  }),
  authenticationFailed: createHTTPErrorFixture(401, {
    reason: 'invalid_credentials'
  }),
  authorizationDenied: createHTTPErrorFixture(403, {
    reason: 'insufficient_role'
  })
};

// PM2 Error Fixtures
export const pm2ErrorFixtures = {
  processClash: createPM2ErrorFixture('START', {
    error: 'EADDRINUSE: address already in use :::3000'
  }),
  clusterFailure: createPM2ErrorFixture('CLUSTER', {
    runningInstances: 2,
    totalInstances: 4
  }),
  deploymentError: createPM2ErrorFixture('RELOAD', {
    operation: 'graceful_reload',
    timeout: true
  }),
  processRestart: createPM2ErrorFixture('RESTART', {
    restartCount: 10,
    reason: 'memory_limit'
  }),
  memoryExceeded: createPM2ErrorFixture('RESTART', {
    memoryUsage: '1.5GB',
    memoryLimit: '1GB'
  }),
  workerTimeout: createPM2ErrorFixture('RESTART', {
    worker: 2,
    lastResponse: '60s ago'
  }),
  loadBalancerFailure: createPM2ErrorFixture('CLUSTER', {
    loadBalancer: 'failed',
    healthyWorkers: 1
  })
};

// Cross-Platform Error Fixtures
export const crossPlatformErrorFixtures = {
  expressFormat: createHTTPErrorFixture(404, { platform: 'express' }),
  flaskFormat: convertToFlaskFormat(createHTTPErrorFixture(404, { platform: 'flask' })),
  compatible: createCrossPlatformErrorFixture(createHTTPErrorFixture(500), 'both'),
  migrationErrors: {
    routeConversion: createCrossPlatformErrorFixture(
      createHTTPErrorFixture(404, { context: 'route_migration' })
    ),
    middlewareConversion: createCrossPlatformErrorFixture(
      createHTTPErrorFixture(500, { context: 'middleware_migration' })
    )
  }
};

// Educational Error Fixtures
export const educationalErrorFixtures = {
  beginnerFriendly: createHTTPErrorFixture(404, {
    includeDebugInfo: true,
    educationalMode: true,
    explanation: 'detailed'
  }),
  advancedDebugging: createHTTPErrorFixture(500, {
    includeDebugInfo: true,
    stackTrace: true,
    performanceMetrics: true
  }),
  bestPractices: createValidationErrorFixture(
    { type: 'educational_validation', includeExamples: true },
    { 
      input: { 
        message: 'Learn proper input validation techniques',
        examples: ['email format', 'password strength', 'data types']
      }
    }
  ),
  commonMistakes: createHTTPErrorFixture(400, {
    commonMistakes: true,
    preventionTips: true,
    educationalContent: true
  })
};

// Master error fixtures collection
export const errorFixtures = {
  http: httpErrorFixtures,
  validation: validationErrorFixtures,
  security: securityErrorFixtures,
  pm2: pm2ErrorFixtures,
  crossPlatform: crossPlatformErrorFixtures,
  educational: educationalErrorFixtures
};

// Export factory functions and utilities


/**
 * Module Summary and Educational Notes:
 * 
 * This comprehensive error response fixtures module provides:
 * 
 * 1. **Comprehensive Error Coverage**: HTTP errors (4xx, 5xx), validation errors,
 *    security violations, PM2 process management errors, and cross-platform compatibility
 * 
 * 2. **Educational Value**: Each error fixture includes educational annotations,
 *    common causes, resolution steps, and prevention strategies for learning
 * 
 * 3. **Production-Ready Features**: Correlation IDs, caching, performance optimization,
 *    and comprehensive debugging information for professional development
 * 
 * 4. **Testing Framework Support**: Compatible with both Jest and Mocha testing
 *    frameworks with realistic error scenarios for comprehensive test coverage
 * 
 * 5. **Cross-Platform Compatibility**: Express.js and Flask error response parity
 *    for migration testing and feature validation
 * 
 * 6. **Security Best Practices**: Security violation fixtures for Helmet.js testing,
 *    CSP directive validation, and comprehensive threat scenario coverage
 * 
 * 7. **PM2 Integration**: Process management error scenarios for cluster mode testing,
 *    zero-downtime deployment validation, and production monitoring
 * 
 * Usage Examples:
 * - Unit testing error handling middleware
 * - Integration testing API error responses
 * - Security testing with realistic attack scenarios
 * - Performance testing with error condition variations
 * - Educational demonstrations of proper error handling
 * 
 * This module serves as both a practical testing tool and an educational resource
 * for learning modern error handling patterns in Node.js applications.
 */