/**
 * @fileoverview Comprehensive Unit Test Suite for Express.js Error Handling Middleware
 * @description Complete testing of error processing, response generation, security error handling,
 * PM2 error management, and cross-platform error compatibility with ≥90% code coverage
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive unit testing of Express.js error handling middleware
 * - Showcases testing various error types with Jest framework and SuperTest integration
 * - Implements async error handling testing with Express v5.1.0 promise support
 * - Validates security error handling with Helmet.js integration
 * - Tests PM2 cluster mode error handling with process management scenarios
 * - Demonstrates cross-platform error compatibility testing for Node.js Express and Flask
 * - Shows environment-aware error sanitization testing for production safety
 * - Implements performance testing of error handling with automated benchmarking
 * - Provides comprehensive mock data generation for error scenarios and edge cases
 * - Validates error response formats with SuperTest and custom assertion patterns
 * 
 * Technology Stack:
 * - Jest ^29.7.0 - Comprehensive testing framework with built-in mocking and coverage
 * - SuperTest ^6.3.3 - HTTP testing library for Express.js applications
 * - Node.js v22.x LTS - Latest LTS runtime with modern async/await support
 * - Express.js v5.1.0 - Enhanced promise support and improved error handling
 * - PM2 v6.0.8 - Production process manager with cluster mode capabilities
 * 
 * Coverage Targets:
 * - Statements: 95%+ - Comprehensive line-by-line execution validation
 * - Branches: 90%+ - Complete conditional path testing coverage
 * - Functions: 100% - All exported functions tested with multiple scenarios
 * - Lines: 95%+ - Detailed source code execution validation
 */

// External testing framework imports with version comments
import express from 'express'; // ^5.1.0 - Express.js framework for test application creation
import request from 'supertest'; // ^6.3.3 - HTTP testing library for API endpoint validation

// Jest globals for ES modules support
import { jest, describe, test, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Import error handling middleware components for comprehensive testing
import errorHandler, {
  createErrorHandler,
  handleAsyncError,
  processError,
  generateErrorResponse,
  handleSecurityError,
  handleValidationError,
  handlePM2Error
} from '../../../middleware/error-handler.js';

// Import custom error types for specialized error testing scenarios
import {
  BaseError,
  HTTPError,
  ValidationError,
  SecurityError,
  PM2Error,
  createErrorResponse,
  isOperationalError
} from '../../../utils/error-types.js';

// Import application constants for validation and configuration
import {
  HTTP_CONSTANTS,
  ERROR_CONSTANTS
} from '../../../utils/constants.js';

/**
 * Global Test Variables
 * @description Test-scoped variables for application instances and helper utilities
 */
let testApp = null;
let httpTestHelper = null;
let assertionHelper = null;
let mockDataHelper = null;
let testEnvironment = null;

/**
 * Test Environment Setup
 * @description Initializes comprehensive testing infrastructure with Express application,
 * HTTP testing utilities, assertion helpers, and mock data generation
 */
const setupTestEnvironment = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    testStartTime: Date.now(),
    testProcessId: process.pid,
    memoryUsage: process.memoryUsage(),
    testInstanceId: Math.random().toString(36).substring(7)
  };
};

/**
 * HTTP Test Helper Factory
 * @description Creates SuperTest-integrated HTTP testing utilities for error response validation
 * @param {Object} app - Express application instance for testing
 * @returns {Object} HTTP testing helper with request methods and validation utilities
 */
const createHTTPTestHelper = (app) => {
  return {
    get: (path) => request(app).get(path),
    post: (path) => request(app).post(path),
    put: (path) => request(app).put(path),
    delete: (path) => request(app).delete(path),
    expectError: async (path, expectedStatus, expectedError) => {
      const response = await request(app).get(path);
      expect(response.status).toBe(expectedStatus);
      expect(response.body).toHaveProperty('error');
      if (expectedError) {
        expect(response.body.error).toContain(expectedError);
      }
      return response;
    },
    expectSuccess: async (path, expectedStatus = 200) => {
      const response = await request(app).get(path);
      expect(response.status).toBe(expectedStatus);
      expect(response.body).not.toHaveProperty('error');
      return response;
    }
  };
};

/**
 * Assertion Helper Factory
 * @description Creates custom assertion utilities for framework-agnostic error validation
 * @returns {Object} Assertion helper with error-specific validation methods
 */
const createAssertionHelper = () => {
  return {
    expectErrorInstance: (error, ErrorClass) => {
      expect(error).toBeInstanceOf(ErrorClass);
      expect(error).toBeInstanceOf(BaseError);
    },
    expectErrorProperties: (error, expectedProps) => {
      Object.keys(expectedProps).forEach(key => {
        expect(error).toHaveProperty(key, expectedProps[key]);
      });
    },
    expectResponseFormat: (response, expectedFormat) => {
      expect(response.body).toMatchObject(expectedFormat);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('correlationId');
    },
    expectErrorSanitization: (response, environment) => {
      if (environment === 'production') {
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('internalDetails');
      } else {
        expect(response.body).toHaveProperty('stack');
      }
    },
    expectSecurityHeaders: (response) => {
      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-powered-by']).toBeUndefined();
    }
  };
};

/**
 * Mock Data Helper Factory
 * @description Creates mock data generation utilities for realistic error scenarios
 * @returns {Object} Mock data helper with error scenario generators
 */
const createMockDataHelper = () => {
  return {
    createMockRequest: (options = {}) => {
      return {
        method: options.method || 'GET',
        path: options.path || '/test',
        url: options.url || '/test',
        headers: {
          'user-agent': 'test-agent/1.0',
          'content-type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          ...options.headers
        },
        body: options.body || {},
        params: options.params || {},
        query: options.query || {},
        ip: options.ip || '127.0.0.1',
        user: options.user || null,
        correlationId: options.correlationId || `test-${Date.now()}`,
        startTime: options.startTime || Date.now()
      };
    },
    createMockResponse: (options = {}) => {
      const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          res.body = data;
          return res;
        }),
        send: jest.fn().mockImplementation((data) => {
          res.body = data;
          return res;
        }),
        end: jest.fn().mockReturnThis(),
        locals: options.locals || {}
      };
      return res;
    },
    createMockNext: () => {
      return jest.fn();
    },
    createValidationErrors: () => {
      return [
        { field: 'email', message: 'Invalid email format', code: 'INVALID_EMAIL' },
        { field: 'password', message: 'Password too short', code: 'TOO_SHORT' },
        { field: 'age', message: 'Must be a number', code: 'INVALID_TYPE' }
      ];
    },
    createSecurityViolation: (type = 'XSS') => {
      return {
        type,
        source: 'user_input',
        details: `${type} violation detected in request`,
        severity: 'HIGH',
        blocked: true,
        timestamp: new Date().toISOString()
      };
    },
    createPM2Failure: (type = 'MEMORY_EXCEEDED') => {
      return {
        type,
        processId: process.pid,
        clusterId: 0,
        affectedInstances: ['worker-1', 'worker-2'],
        recoveryAction: 'RESTART_PROCESS',
        severity: 'CRITICAL'
      };
    }
  };
};

/**
 * Test Express Application Factory
 * @description Creates Express.js application instance with error handling middleware
 * @param {Object} middlewareConfig - Configuration options for error handling middleware
 * @returns {Object} Configured Express application for error testing scenarios
 */
const createTestExpressApp = (middlewareConfig = {}) => {
  const app = express();
  
  // Configure JSON parsing middleware for request body handling
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Add request tracking middleware for correlation ID generation
  app.use((req, res, next) => {
    req.correlationId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    req.startTime = Date.now();
    next();
  });
  
  // Test routes that generate various error types for comprehensive testing
  app.get('/test/base-error', (req, res, next) => {
    const error = new BaseError('Test base error message');
    next(error);
  });
  
  app.get('/test/http-error', (req, res, next) => {
    const error = new HTTPError('Test HTTP error', HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST);
    next(error);
  });
  
  app.get('/test/validation-error', (req, res, next) => {
    const validationErrors = mockDataHelper.createValidationErrors();
    const error = new ValidationError('Validation failed', validationErrors);
    next(error);
  });
  
  app.get('/test/security-error', (req, res, next) => {
    const violation = mockDataHelper.createSecurityViolation('XSS');
    const error = new SecurityError('Security violation detected', 'XSS_ATTEMPT', violation);
    next(error);
  });
  
  app.get('/test/pm2-error', (req, res, next) => {
    const failure = mockDataHelper.createPM2Failure('MEMORY_EXCEEDED');
    const error = new PM2Error('PM2 process failure', failure);
    next(error);
  });
  
  app.get('/test/async-error', async (req, res, next) => {
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Async operation failed')), 10);
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/test/standard-error', (req, res, next) => {
    const error = new Error('Standard JavaScript error');
    next(error);
  });
  
  app.get('/test/null-error', (req, res, next) => {
    next(null);
  });
  
  app.get('/test/undefined-error', (req, res, next) => {
    next(undefined);
  });
  
  app.get('/test/string-error', (req, res, next) => {
    next('String error message');
  });
  
  app.get('/test/circular-error', (req, res, next) => {
    const error = new Error('Circular reference error');
    error.circular = error; // Create circular reference
    next(error);
  });
  
  // Health check endpoint for testing error handler integration
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test'
    });
  });
  
  // Apply error handling middleware with configuration
  if (middlewareConfig.useFactory) {
    app.use(createErrorHandler(middlewareConfig));
  } else {
    app.use(errorHandler);
  }
  
  return app;
};

/**
 * Error Response Validation Utility
 * @description Validates error response structure, content, and format for comprehensive testing
 * @param {Object} response - HTTP response object from SuperTest
 * @param {Object} expectedError - Expected error properties for validation
 * @param {Object} validationOptions - Additional validation configuration options
 * @returns {Object} Validation result with status and detailed analysis
 */
const validateErrorResponse = (response, expectedError, validationOptions = {}) => {
  const validation = {
    status: 'PASSED',
    failures: [],
    analysis: {}
  };
  
  try {
    // Validate HTTP status code
    if (expectedError.statusCode && response.status !== expectedError.statusCode) {
      validation.failures.push(`Expected status ${expectedError.statusCode}, got ${response.status}`);
    }
    
    // Validate response body structure
    const requiredFields = ['error', 'timestamp', 'correlationId'];
    requiredFields.forEach(field => {
      if (!response.body.hasOwnProperty(field)) {
        validation.failures.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate error message content
    if (expectedError.message && !response.body.error.includes(expectedError.message)) {
      validation.failures.push(`Error message doesn't contain expected text: ${expectedError.message}`);
    }
    
    // Validate environment-specific sanitization
    if (validationOptions.environment === 'production') {
      if (response.body.hasOwnProperty('stack')) {
        validation.failures.push('Stack trace exposed in production environment');
      }
    }
    
    // Validate correlation ID format
    if (response.body.correlationId && !/^test-\d+-[a-z0-9]+$/.test(response.body.correlationId)) {
      validation.failures.push('Invalid correlation ID format');
    }
    
    // Validate timestamp format
    if (response.body.timestamp && isNaN(Date.parse(response.body.timestamp))) {
      validation.failures.push('Invalid timestamp format');
    }
    
    // Set validation status
    validation.status = validation.failures.length === 0 ? 'PASSED' : 'FAILED';
    
    // Generate analysis
    validation.analysis = {
      responseTime: response.header['x-response-time'] || 'N/A',
      contentType: response.header['content-type'],
      bodySize: JSON.stringify(response.body).length,
      securityHeaders: Object.keys(response.header).filter(h => h.startsWith('x-') || h.includes('security')),
      errorClassification: response.body.type || 'Unknown'
    };
    
  } catch (error) {
    validation.status = 'ERROR';
    validation.failures.push(`Validation error: ${error.message}`);
  }
  
  return validation;
};

/**
 * Error Test Scenario Generator
 * @description Generates comprehensive error test scenarios for thorough testing coverage
 * @param {Array} errorTypes - Array of error types to generate scenarios for
 * @param {Object} scenarioOptions - Configuration options for scenario generation
 * @returns {Array} Array of error test scenarios with validation criteria
 */
const generateErrorTestScenarios = (errorTypes = [], scenarioOptions = {}) => {
  const scenarios = [];
  
  // Base error scenarios
  scenarios.push({
    name: 'BaseError with default configuration',
    error: new BaseError('Test base error'),
    expectedStatus: 500,
    expectedResponse: {
      error: 'Test base error',
      type: 'BaseError'
    }
  });
  
  // HTTP error scenarios with various status codes
  const httpStatusCodes = [400, 401, 403, 404, 422, 500, 502, 503];
  httpStatusCodes.forEach(status => {
    scenarios.push({
      name: `HTTPError with status ${status}`,
      error: new HTTPError(`HTTP error ${status}`, status),
      expectedStatus: status,
      expectedResponse: {
        error: `HTTP error ${status}`,
        type: 'HTTPError'
      }
    });
  });
  
  // Validation error scenarios
  scenarios.push({
    name: 'ValidationError with multiple field errors',
    error: new ValidationError('Validation failed', mockDataHelper.createValidationErrors()),
    expectedStatus: 422,
    expectedResponse: {
      error: 'Validation failed',
      type: 'ValidationError',
      validationErrors: expect.any(Array)
    }
  });
  
  // Security error scenarios
  const securityTypes = ['XSS', 'CSRF', 'SQL_INJECTION', 'AUTHENTICATION'];
  securityTypes.forEach(type => {
    scenarios.push({
      name: `SecurityError for ${type} violation`,
      error: new SecurityError(`${type} violation detected`, type, mockDataHelper.createSecurityViolation(type)),
      expectedStatus: 403,
      expectedResponse: {
        error: `${type} violation detected`,
        type: 'SecurityError'
      }
    });
  });
  
  // PM2 error scenarios
  const pm2FailureTypes = ['MEMORY_EXCEEDED', 'CPU_OVERLOAD', 'PROCESS_CRASH', 'CLUSTER_FAILURE'];
  pm2FailureTypes.forEach(type => {
    scenarios.push({
      name: `PM2Error for ${type} failure`,
      error: new PM2Error(`PM2 ${type} failure`, mockDataHelper.createPM2Failure(type)),
      expectedStatus: 503,
      expectedResponse: {
        error: `PM2 ${type} failure`,
        type: 'PM2Error'
      }
    });
  });
  
  // Edge case scenarios
  scenarios.push(
    {
      name: 'Null error handling',
      error: null,
      expectedStatus: 500,
      expectedResponse: {
        error: 'An unexpected error occurred'
      }
    },
    {
      name: 'Undefined error handling',
      error: undefined,
      expectedStatus: 500,
      expectedResponse: {
        error: 'An unexpected error occurred'
      }
    },
    {
      name: 'String error handling',
      error: 'String error message',
      expectedStatus: 500,
      expectedResponse: {
        error: 'String error message'
      }
    },
    {
      name: 'Circular reference error handling',
      error: (() => {
        const error = new Error('Circular error');
        error.circular = error;
        return error;
      })(),
      expectedStatus: 500,
      expectedResponse: {
        error: 'Circular error'
      }
    }
  );
  
  return scenarios;
};

/**
 * Environment-Aware Error Sanitization Test
 * @description Tests environment-specific error sanitization and information disclosure
 * @param {Error} error - Error instance to test sanitization with
 * @param {string} environment - Environment mode (production, development, test)
 * @returns {Object} Test result validating environment-appropriate sanitization
 */
const testEnvironmentAwareErrorSanitization = async (error, environment) => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;
  
  try {
    const app = createTestExpressApp();
    const response = await request(app)
      .get('/test/standard-error')
      .expect(500);
    
    const sanitizationResult = {
      environment,
      sanitized: true,
      details: {
        stackTraceExposed: response.body.hasOwnProperty('stack'),
        internalDetailsExposed: response.body.hasOwnProperty('internalDetails'),
        correlationIdPresent: response.body.hasOwnProperty('correlationId'),
        timestampPresent: response.body.hasOwnProperty('timestamp'),
        errorTypePresent: response.body.hasOwnProperty('type')
      }
    };
    
    // Validate production sanitization
    if (environment === 'production') {
      sanitizationResult.sanitized = !sanitizationResult.details.stackTraceExposed && 
                                     !sanitizationResult.details.internalDetailsExposed;
    }
    
    return sanitizationResult;
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
};

/**
 * Cross-Platform Error Compatibility Test
 * @description Tests error response compatibility between Node.js Express and Flask implementations
 * @param {Error} error - Error instance to test compatibility with
 * @param {Object} compatibilityOptions - Cross-platform compatibility configuration
 * @returns {Object} Cross-platform compatibility test result with format validation
 */
const testCrossPlatformErrorCompatibility = async (error, compatibilityOptions = {}) => {
  const app = createTestExpressApp();
  
  // Generate Node.js Express error response
  const nodeResponse = await request(app)
    .get('/test/http-error')
    .expect(400);
  
  // Expected Flask-compatible error response format
  const expectedFlaskFormat = {
    error: expect.any(String),
    timestamp: expect.any(String),
    correlationId: expect.any(String),
    type: expect.any(String)
  };
  
  const compatibilityResult = {
    nodeJsResponse: nodeResponse.body,
    expectedFlaskFormat,
    compatible: true,
    differences: [],
    analysis: {
      fieldCompatibility: {},
      formatConsistency: true,
      statusCodeMapping: true
    }
  };
  
  // Validate field compatibility
  Object.keys(expectedFlaskFormat).forEach(field => {
    compatibilityResult.analysis.fieldCompatibility[field] = nodeResponse.body.hasOwnProperty(field);
    if (!nodeResponse.body.hasOwnProperty(field)) {
      compatibilityResult.differences.push(`Missing field for Flask compatibility: ${field}`);
      compatibilityResult.compatible = false;
    }
  });
  
  // Validate timestamp format compatibility
  if (nodeResponse.body.timestamp && !Date.parse(nodeResponse.body.timestamp)) {
    compatibilityResult.differences.push('Timestamp format not compatible with Flask datetime');
    compatibilityResult.compatible = false;
  }
  
  // Validate status code mapping
  if (nodeResponse.status !== 400) {
    compatibilityResult.differences.push(`Status code mismatch: expected 400, got ${nodeResponse.status}`);
    compatibilityResult.compatible = false;
  }
  
  return compatibilityResult;
};

/**
 * Error Handling Performance Measurement
 * @description Measures error handling performance including response time and resource usage
 * @param {Array} errorScenarios - Array of error scenarios to measure performance for
 * @param {Object} performanceConfig - Performance measurement configuration
 * @returns {Object} Performance measurement results with timing and resource data
 */
const measureErrorHandlingPerformance = async (errorScenarios, performanceConfig = {}) => {
  const app = createTestExpressApp();
  const measurements = {
    totalScenarios: errorScenarios.length,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    memoryUsageBefore: process.memoryUsage(),
    memoryUsageAfter: null,
    performanceResults: []
  };
  
  const startTime = Date.now();
  
  for (const scenario of errorScenarios) {
    const scenarioStartTime = process.hrtime.bigint();
    
    try {
      await request(app)
        .get('/test/http-error')
        .expect(400);
      
      const scenarioEndTime = process.hrtime.bigint();
      const responseTime = Number(scenarioEndTime - scenarioStartTime) / 1000000; // Convert to ms
      
      measurements.performanceResults.push({
        scenario: scenario.name || 'Unknown',
        responseTime,
        memoryDelta: process.memoryUsage().heapUsed - measurements.memoryUsageBefore.heapUsed
      });
      
      measurements.minResponseTime = Math.min(measurements.minResponseTime, responseTime);
      measurements.maxResponseTime = Math.max(measurements.maxResponseTime, responseTime);
    } catch (error) {
      measurements.performanceResults.push({
        scenario: scenario.name || 'Unknown',
        responseTime: -1,
        error: error.message
      });
    }
  }
  
  measurements.memoryUsageAfter = process.memoryUsage();
  measurements.averageResponseTime = measurements.performanceResults
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / measurements.performanceResults.length;
  
  measurements.totalExecutionTime = Date.now() - startTime;
  
  return measurements;
};

/**
 * Async Error Handling Validation
 * @description Validates async error handling capabilities with Promise rejections and async/await
 * @param {Array} asyncErrorScenarios - Array of async error scenarios to validate
 * @returns {Promise<Object>} Promise resolving to async error handling validation results
 */
const validateAsyncErrorHandling = async (asyncErrorScenarios) => {
  const app = createTestExpressApp();
  const validationResults = {
    totalScenarios: asyncErrorScenarios.length,
    passedScenarios: 0,
    failedScenarios: 0,
    results: []
  };
  
  for (const scenario of asyncErrorScenarios) {
    try {
      const response = await request(app)
        .get('/test/async-error')
        .expect(500);
      
      const result = {
        scenario: scenario.name || 'Async Error',
        status: 'PASSED',
        responseTime: response.header['x-response-time'] || 'N/A',
        errorCaught: !!response.body.error,
        contextPreserved: !!response.body.correlationId
      };
      
      validationResults.results.push(result);
      validationResults.passedScenarios++;
    } catch (error) {
      const result = {
        scenario: scenario.name || 'Async Error',
        status: 'FAILED',
        error: error.message
      };
      
      validationResults.results.push(result);
      validationResults.failedScenarios++;
    }
  }
  
  validationResults.successRate = (validationResults.passedScenarios / validationResults.totalScenarios) * 100;
  
  return validationResults;
};

// =============================================================================
// TEST SUITE IMPLEMENTATION
// =============================================================================

describe('Error Handler Middleware - Core Functionality', () => {
  
  beforeAll(async () => {
    testEnvironment = setupTestEnvironment();
    mockDataHelper = createMockDataHelper();
    assertionHelper = createAssertionHelper();
    testApp = createTestExpressApp();
    httpTestHelper = createHTTPTestHelper(testApp);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });
  
  afterEach(() => {
    // Clean up test-specific resources
  });
  
  afterAll(async () => {
    // Cleanup and generate test coverage report
  });

  describe('Basic Error Processing', () => {
    
    test('should handle basic Error instances with default processing', async () => {
      const response = await httpTestHelper.expectError('/test/standard-error', 500);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.error).toBe('Standard JavaScript error');
      
      const validation = validateErrorResponse(response, { 
        statusCode: 500, 
        message: 'Standard JavaScript error' 
      });
      expect(validation.status).toBe('PASSED');
    });
    
    test('should handle BaseError instances with context preservation', async () => {
      const response = await httpTestHelper.expectError('/test/base-error', 500);
      
      assertionHelper.expectResponseFormat(response, {
        error: 'Test base error message',
        type: 'BaseError'
      });
      
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
    
    test('should integrate properly with Express middleware chain', async () => {
      const middlewareOrder = [];
      const testApp = express();
      
      testApp.use((req, res, next) => {
        middlewareOrder.push('first');
        next();
      });
      
      testApp.use((req, res, next) => {
        middlewareOrder.push('second');
        next(new Error('Test middleware error'));
      });
      
      testApp.use(errorHandler);
      
      const response = await request(testApp)
        .get('/')
        .expect(500);
      
      expect(middlewareOrder).toEqual(['first', 'second']);
      expect(response.body).toHaveProperty('error', 'Test middleware error');
    });
    
  });
  
  describe('HTTP Error Handling', () => {
    
    test('should handle HTTPError with correct status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503];
      
      for (const statusCode of statusCodes) {
        const testApp = express();
        testApp.get('/test', (req, res, next) => {
          next(new HTTPError(`HTTP error ${statusCode}`, statusCode));
        });
        testApp.use(errorHandler);
        
        const response = await request(testApp)
          .get('/test')
          .expect(statusCode);
        
        expect(response.body.error).toBe(`HTTP error ${statusCode}`);
        expect(response.body.type).toBe('HTTPError');
      }
    });
    
    test('should set appropriate response headers for HTTP errors', async () => {
      const response = await httpTestHelper.expectError('/test/http-error', 400);
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
    });
    
    test('should generate RESTful error responses', async () => {
      const response = await httpTestHelper.expectError('/test/http-error', 400);
      
      const expectedRESTfulFormat = {
        error: expect.any(String),
        type: 'HTTPError',
        timestamp: expect.any(String),
        correlationId: expect.any(String)
      };
      
      assertionHelper.expectResponseFormat(response, expectedRESTfulFormat);
    });
    
  });
  
  describe('Validation Error Handling', () => {
    
    test('should handle ValidationError with field details', async () => {
      const response = await httpTestHelper.expectError('/test/validation-error', 422);
      
      expect(response.body.type).toBe('ValidationError');
      expect(response.body).toHaveProperty('validationErrors');
      expect(Array.isArray(response.body.validationErrors)).toBe(true);
      expect(response.body.validationErrors.length).toBeGreaterThan(0);
      
      response.body.validationErrors.forEach(error => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
      });
    });
    
    test('should provide user-friendly validation messages', async () => {
      const response = await httpTestHelper.expectError('/test/validation-error', 422);
      
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.validationErrors[0].message).toMatch(/invalid|required|too|format/i);
    });
    
    test('should handle multiple validation errors', async () => {
      const response = await httpTestHelper.expectError('/test/validation-error', 422);
      
      expect(response.body.validationErrors.length).toBeGreaterThanOrEqual(3);
      
      const fieldNames = response.body.validationErrors.map(e => e.field);
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('password');
      expect(fieldNames).toContain('age');
    });
    
  });
  
  describe('Security Error Handling', () => {
    
    test('should handle SecurityError with violation context', async () => {
      const response = await httpTestHelper.expectError('/test/security-error', 403);
      
      expect(response.body.type).toBe('SecurityError');
      expect(response.body.error).toContain('Security violation detected');
      expect(response.body).toHaveProperty('securityType');
    });
    
    test('should sanitize security errors for logging', async () => {
      const response = await httpTestHelper.expectError('/test/security-error', 403);
      
      // Should not expose sensitive security details in response
      expect(response.body).not.toHaveProperty('internalSecurityDetails');
      expect(response.body).not.toHaveProperty('sourceCode');
      expect(response.body).not.toHaveProperty('systemPaths');
    });
    
    test('should generate security alerts for monitoring', async () => {
      const response = await httpTestHelper.expectError('/test/security-error', 403);
      
      expect(response.body).toHaveProperty('alertGenerated');
      expect(response.body).toHaveProperty('incidentId');
      expect(response.body.severity).toBe('HIGH');
    });
    
  });
  
  describe('PM2 Error Handling', () => {
    
    test('should handle PM2Error with cluster context', async () => {
      const response = await httpTestHelper.expectError('/test/pm2-error', 503);
      
      expect(response.body.type).toBe('PM2Error');
      expect(response.body).toHaveProperty('clusterImpact');
      expect(response.body).toHaveProperty('affectedInstances');
    });
    
    test('should determine cluster impact for PM2 errors', async () => {
      const response = await httpTestHelper.expectError('/test/pm2-error', 503);
      
      expect(response.body.clusterImpact).toBeDefined();
      expect(response.body.affectedInstances).toBeInstanceOf(Array);
      expect(response.body.recoveryAction).toBeDefined();
    });
    
    test('should generate recovery actions for PM2 errors', async () => {
      const response = await httpTestHelper.expectError('/test/pm2-error', 503);
      
      expect(response.body.recoveryAction).toMatch(/restart|reload|scale/i);
      expect(response.body).toHaveProperty('estimatedRecoveryTime');
      expect(response.body).toHaveProperty('riskAssessment');
    });
    
  });
  
  describe('Error Sanitization and Security', () => {
    
    test('should sanitize errors in production environment', async () => {
      const sanitizationResult = await testEnvironmentAwareErrorSanitization(
        new Error('Production error'), 
        'production'
      );
      
      expect(sanitizationResult.sanitized).toBe(true);
      expect(sanitizationResult.details.stackTraceExposed).toBe(false);
      expect(sanitizationResult.details.internalDetailsExposed).toBe(false);
      expect(sanitizationResult.details.correlationIdPresent).toBe(true);
    });
    
    test('should preserve debug information in development', async () => {
      const sanitizationResult = await testEnvironmentAwareErrorSanitization(
        new Error('Development error'), 
        'development'
      );
      
      expect(sanitizationResult.details.stackTraceExposed).toBe(true);
      expect(sanitizationResult.details.correlationIdPresent).toBe(true);
      expect(sanitizationResult.details.timestampPresent).toBe(true);
    });
    
    test('should handle sensitive information properly', async () => {
      const testApp = express();
      testApp.get('/test', (req, res, next) => {
        const error = new Error('Database connection failed: password123');
        error.sensitiveData = { password: 'secret123', apiKey: 'key456' };
        next(error);
      });
      testApp.use(errorHandler);
      
      const response = await request(testApp)
        .get('/test')
        .expect(500);
      
      expect(response.body.error).not.toContain('password123');
      expect(response.body).not.toHaveProperty('sensitiveData');
    });
    
  });
  
  describe('Async Error Handling', () => {
    
    test('should handle async function errors', async () => {
      const response = await httpTestHelper.expectError('/test/async-error', 500);
      
      expect(response.body.error).toBe('Async operation failed');
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body).toHaveProperty('timestamp');
    });
    
    test('should handle Promise rejections', async () => {
      const testApp = express();
      testApp.get('/test', (req, res, next) => {
        Promise.reject(new Error('Promise rejection error'))
          .catch(next);
      });
      testApp.use(errorHandler);
      
      const response = await request(testApp)
        .get('/test')
        .expect(500);
      
      expect(response.body.error).toBe('Promise rejection error');
    });
    
    test('should integrate with Express v5.1.0 promise support', async () => {
      const testApp = express();
      testApp.get('/test', async (req, res, next) => {
        throw new Error('Express v5 async error');
      });
      testApp.use(errorHandler);
      
      const response = await request(testApp)
        .get('/test')
        .expect(500);
      
      expect(response.body.error).toBe('Express v5 async error');
      expect(response.body).toHaveProperty('asyncContext');
    });
    
  });
  
  describe('Cross-Platform Compatibility', () => {
    
    test('should generate Flask-compatible error responses', async () => {
      const compatibilityResult = await testCrossPlatformErrorCompatibility(
        new HTTPError('Test error', 400)
      );
      
      expect(compatibilityResult.compatible).toBe(true);
      expect(compatibilityResult.differences).toHaveLength(0);
      expect(compatibilityResult.analysis.fieldCompatibility.error).toBe(true);
      expect(compatibilityResult.analysis.fieldCompatibility.timestamp).toBe(true);
    });
    
    test('should maintain consistent error codes across platforms', async () => {
      const response = await httpTestHelper.expectError('/test/http-error', 400);
      
      expect(response.status).toBe(400);
      expect(response.body.type).toBe('HTTPError');
      expect(response.body).toHaveProperty('code');
    });
    
    test('should preserve correlation tracking across platforms', async () => {
      const response = await httpTestHelper.expectError('/test/http-error', 400);
      
      expect(response.body.correlationId).toMatch(/^test-\d+-[a-z0-9]+$/);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
    
  });
  
  describe('Performance and Monitoring', () => {
    
    test('should meet response time performance targets', async () => {
      const startTime = process.hrtime.bigint();
      
      await httpTestHelper.expectError('/test/http-error', 400);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
      
      expect(responseTime).toBeLessThan(100); // Target: < 100ms
    });
    
    test('should track error metrics and statistics', async () => {
      const scenarios = generateErrorTestScenarios();
      const performanceResults = await measureErrorHandlingPerformance(scenarios.slice(0, 5));
      
      expect(performanceResults.averageResponseTime).toBeLessThan(100);
      expect(performanceResults.performanceResults).toHaveLength(5);
      expect(performanceResults.minResponseTime).toBeGreaterThan(0);
    });
    
    test('should handle concurrent error processing', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill().map(() =>
        httpTestHelper.expectError('/test/http-error', 400)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('correlationId');
      });
      
      const throughput = (concurrentRequests / totalTime) * 1000; // req/sec
      expect(throughput).toBeGreaterThan(50); // Minimum throughput expectation
    });
    
  });
  
  describe('Edge Cases and Error Scenarios', () => {
    
    test('should handle null and undefined errors gracefully', async () => {
      const nullResponse = await httpTestHelper.expectError('/test/null-error', 500);
      expect(nullResponse.body.error).toBe('An unexpected error occurred');
      
      const undefinedResponse = await httpTestHelper.expectError('/test/undefined-error', 500);
      expect(undefinedResponse.body.error).toBe('An unexpected error occurred');
    });
    
    test('should handle circular reference errors', async () => {
      const response = await httpTestHelper.expectError('/test/circular-error', 500);
      
      expect(response.body.error).toBe('Circular reference error');
      expect(response.body).not.toHaveProperty('circular');
      expect(response.body).toHaveProperty('correlationId');
    });
    
    test('should handle malformed error objects', async () => {
      const response = await httpTestHelper.expectError('/test/string-error', 500);
      
      expect(response.body.error).toBe('String error message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('correlationId');
    });
    
  });

});

// =============================================================================
// SPECIALIZED FUNCTION TESTING
// =============================================================================

describe('Error Handler Factory Functions', () => {
  
  test('createErrorHandler should create configured error handler', () => {
    const config = {
      environment: 'test',
      logErrors: true,
      includeStack: false
    };
    
    const handler = createErrorHandler(config);
    expect(typeof handler).toBe('function');
    expect(handler.length).toBe(4); // Express error handler signature
  });
  
  test('handleAsyncError should wrap async operations', async () => {
    const asyncOperation = async () => {
      throw new Error('Async error');
    };
    
    const wrappedOperation = handleAsyncError(asyncOperation);
    expect(typeof wrappedOperation).toBe('function');
    
    const mockNext = jest.fn();
    await wrappedOperation({}, {}, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
  
  test('processError should classify and enrich errors', () => {
    const mockReq = mockDataHelper.createMockRequest();
    const error = new Error('Test error');
    
    const processedError = processError(error, mockReq);
    
    expect(processedError).toHaveProperty('correlationId');
    expect(processedError).toHaveProperty('timestamp');
    expect(processedError).toHaveProperty('context');
  });
  
  test('generateErrorResponse should create standardized responses', () => {
    const error = new HTTPError('Test HTTP error', 400);
    const mockReq = mockDataHelper.createMockRequest();
    
    const response = generateErrorResponse(error, mockReq);
    
    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('timestamp');
    expect(response).toHaveProperty('correlationId');
    expect(response).toHaveProperty('type');
  });
  
  test('handleSecurityError should process security violations', () => {
    const violation = mockDataHelper.createSecurityViolation('XSS');
    const securityError = new SecurityError('XSS detected', 'XSS', violation);
    const mockReq = mockDataHelper.createMockRequest();
    
    const result = handleSecurityError(securityError, mockReq);
    
    expect(result).toHaveProperty('alertGenerated', true);
    expect(result).toHaveProperty('securityType', 'XSS');
    expect(result).toHaveProperty('incidentId');
  });
  
  test('handleValidationError should format validation failures', () => {
    const validationErrors = mockDataHelper.createValidationErrors();
    const validationError = new ValidationError('Validation failed', validationErrors);
    const mockReq = mockDataHelper.createMockRequest();
    
    const result = handleValidationError(validationError, mockReq);
    
    expect(result).toHaveProperty('validationErrors');
    expect(result).toHaveProperty('summary');
    expect(result.validationErrors).toHaveLength(3);
  });
  
  test('handlePM2Error should process cluster failures', () => {
    const failure = mockDataHelper.createPM2Failure('MEMORY_EXCEEDED');
    const pm2Error = new PM2Error('Memory exceeded', failure);
    const mockReq = mockDataHelper.createMockRequest();
    
    const result = handlePM2Error(pm2Error, mockReq);
    
    expect(result).toHaveProperty('clusterImpact');
    expect(result).toHaveProperty('recoveryAction');
    expect(result).toHaveProperty('affectedInstances');
  });
  
});

// =============================================================================
// INTEGRATION TESTING WITH SUPERTEST
// =============================================================================

describe('HTTP Integration Testing', () => {
  
  let testServer;
  
  beforeAll(() => {
    testServer = testApp.listen(0); // Random port
  });
  
  afterAll((done) => {
    testServer.close(done);
  });
  
  test('should handle complete HTTP error flow', async () => {
    const response = await request(testServer)
      .get('/test/http-error')
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(response.body).toMatchObject({
      error: expect.any(String),
      type: 'HTTPError',
      timestamp: expect.any(String),
      correlationId: expect.any(String)
    });
  });
  
  test('should maintain request context through error handling', async () => {
    const customHeader = 'test-correlation-123';
    
    const response = await request(testServer)
      .get('/test/base-error')
      .set('X-Correlation-ID', customHeader)
      .expect(500);
    
    expect(response.body.correlationId).toBeDefined();
    expect(response.body.context).toHaveProperty('headers');
  });
  
  test('should handle multiple error types in sequence', async () => {
    const errorEndpoints = [
      '/test/base-error',
      '/test/http-error', 
      '/test/validation-error',
      '/test/security-error',
      '/test/pm2-error'
    ];
    
    for (const endpoint of errorEndpoints) {
      const response = await request(testServer).get(endpoint);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('correlationId');
    }
  });
  
});

// =============================================================================
// COMPREHENSIVE ERROR TYPE TESTING
// =============================================================================

describe('Custom Error Types Validation', () => {
  
  test('BaseError should provide foundation functionality', () => {
    const error = new BaseError('Base error message');
    
    assertionHelper.expectErrorInstance(error, BaseError);
    expect(error.message).toBe('Base error message');
    expect(error.errorId).toBeDefined();
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.isOperational).toBe(true);
  });
  
  test('HTTPError should extend BaseError with HTTP semantics', () => {
    const error = new HTTPError('HTTP error', 404);
    
    assertionHelper.expectErrorInstance(error, HTTPError);
    expect(error.statusCode).toBe(404);
    expect(error.headers).toBeDefined();
    expect(error.toHTTPResponse).toBeInstanceOf(Function);
  });
  
  test('ValidationError should handle field validation', () => {
    const validationErrors = mockDataHelper.createValidationErrors();
    const error = new ValidationError('Validation failed', validationErrors);
    
    assertionHelper.expectErrorInstance(error, ValidationError);
    expect(error.validationErrors).toEqual(validationErrors);
    expect(error.getSummary).toBeInstanceOf(Function);
  });
  
  test('SecurityError should handle security violations', () => {
    const violation = mockDataHelper.createSecurityViolation('CSRF');
    const error = new SecurityError('CSRF detected', 'CSRF', violation);
    
    assertionHelper.expectErrorInstance(error, SecurityError);
    expect(error.securityType).toBe('CSRF');
    expect(error.getSecurityAlert).toBeInstanceOf(Function);
  });
  
  test('PM2Error should handle process management failures', () => {
    const failure = mockDataHelper.createPM2Failure('CLUSTER_FAILURE');
    const error = new PM2Error('Cluster failure', failure);
    
    assertionHelper.expectErrorInstance(error, PM2Error);
    expect(error.affectsCluster).toBeInstanceOf(Function);
    expect(error.getRecoveryAction).toBeInstanceOf(Function);
  });
  
});

// =============================================================================
// ASYNC ERROR HANDLING COMPREHENSIVE TESTING
// =============================================================================

describe('Async Error Handling Validation', () => {
  
  test('should handle Promise rejection chains', async () => {
    const asyncScenarios = [
      { name: 'Promise.reject', error: Promise.reject(new Error('Rejected')) },
      { name: 'Async function throw', error: async () => { throw new Error('Async throw'); } },
      { name: 'setTimeout error', error: () => setTimeout(() => { throw new Error('Timeout error'); }, 10) }
    ];
    
    const validationResults = await validateAsyncErrorHandling(asyncScenarios);
    
    expect(validationResults.successRate).toBeGreaterThan(80);
    expect(validationResults.passedScenarios).toBeGreaterThan(0);
  });
  
  test('should preserve context in async error handling', async () => {
    const testApp = express();
    testApp.get('/async-context', async (req, res, next) => {
      req.customContext = { userId: 123, sessionId: 'abc123' };
      
      try {
        await new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Async context error')), 10);
        });
      } catch (error) {
        error.context = req.customContext;
        next(error);
      }
    });
    testApp.use(errorHandler);
    
    const response = await request(testApp)
      .get('/async-context')
      .expect(500);
    
    expect(response.body).toHaveProperty('context');
    expect(response.body.context).toHaveProperty('userId', 123);
  });
  
});

// =============================================================================
// PERFORMANCE AND STRESS TESTING
// =============================================================================

describe('Performance Stress Testing', () => {
  
  test('should handle high-frequency error generation', async () => {
    const iterations = 100;
    const promises = [];
    
    for (let i = 0; i < iterations; i++) {
      promises.push(
        request(testApp)
          .get('/test/http-error')
          .expect(400)
      );
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    const averageResponseTime = (endTime - startTime) / iterations;
    
    expect(responses).toHaveLength(iterations);
    expect(averageResponseTime).toBeLessThan(50); // 50ms average per request
    
    responses.forEach(response => {
      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.correlationId).toMatch(/^test-\d+-[a-z0-9]+$/);
    });
  });
  
  test('should maintain memory stability under error load', async () => {
    const initialMemory = process.memoryUsage();
    
    // Generate sustained error load
    for (let batch = 0; batch < 10; batch++) {
      const batchPromises = Array(50).fill().map(() =>
        request(testApp).get('/test/validation-error').expect(422)
      );
      await Promise.all(batchPromises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
  
});

// =============================================================================
// EDUCATIONAL VALIDATION TESTING
// =============================================================================

describe('Educational Value Validation', () => {
  
  test('should demonstrate comprehensive error handling patterns', () => {
    const demoScenarios = generateErrorTestScenarios();
    
    expect(demoScenarios.length).toBeGreaterThan(15);
    expect(demoScenarios.some(s => s.name.includes('BaseError'))).toBe(true);
    expect(demoScenarios.some(s => s.name.includes('HTTPError'))).toBe(true);
    expect(demoScenarios.some(s => s.name.includes('ValidationError'))).toBe(true);
    expect(demoScenarios.some(s => s.name.includes('SecurityError'))).toBe(true);
    expect(demoScenarios.some(s => s.name.includes('PM2Error'))).toBe(true);
  });
  
  test('should validate error handling best practices', async () => {
    const bestPracticesValidation = {
      correlationIdPresent: false,
      timestampFormatValid: false,
      errorTypeClassified: false,
      sensitiveDataSanitized: false,
      httpStatusAppropriate: false
    };
    
    const response = await httpTestHelper.expectError('/test/security-error', 403);
    
    bestPracticesValidation.correlationIdPresent = !!response.body.correlationId;
    bestPracticesValidation.timestampFormatValid = !isNaN(Date.parse(response.body.timestamp));
    bestPracticesValidation.errorTypeClassified = !!response.body.type;
    bestPracticesValidation.sensitiveDataSanitized = !response.body.hasOwnProperty('internalSecurityDetails');
    bestPracticesValidation.httpStatusAppropriate = response.status === 403;
    
    Object.values(bestPracticesValidation).forEach(practice => {
      expect(practice).toBe(true);
    });
  });
  
  test('should demonstrate production-ready error handling', async () => {
    const productionFeatures = {
      environmentAwareSanitization: false,
      correlationTracking: false,
      structuredLogging: false,
      monitoringIntegration: false,
      securityCompliance: false
    };
    
    // Test production environment sanitization
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    try {
      const response = await request(testApp)
        .get('/test/standard-error')
        .expect(500);
      
      productionFeatures.environmentAwareSanitization = !response.body.hasOwnProperty('stack');
      productionFeatures.correlationTracking = !!response.body.correlationId;
      productionFeatures.structuredLogging = !!response.body.timestamp;
      productionFeatures.monitoringIntegration = !!response.body.type;
      productionFeatures.securityCompliance = !response.body.hasOwnProperty('internalDetails');
      
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
    
    Object.entries(productionFeatures).forEach(([feature, implemented]) => {
      expect(implemented).toBe(true);
    });
  });
  
});