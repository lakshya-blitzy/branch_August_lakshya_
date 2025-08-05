/**
 * @fileoverview Comprehensive Unit Test Suite for Hello Controller Module
 * @description Complete unit testing suite for hello controller functionality including HTTP request/response
 * handling, service layer integration, security middleware functionality, error handling patterns, and 
 * cross-platform compatibility with Flask implementation. Implements extensive testing scenarios using 
 * Jest framework with SuperTest integration for HTTP endpoint testing, performance validation, security 
 * header verification, and comprehensive error handling validation.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive unit testing patterns for Express.js controllers
 * - Illustrates service layer mocking and dependency injection for isolated testing
 * - Showcases HTTP endpoint testing with SuperTest integration and response validation
 * - Provides security testing methodologies including header validation and vulnerability assessment
 * - Shows performance testing patterns with benchmark validation and metrics collection
 * - Demonstrates error handling testing including exception scenarios and error recovery patterns
 * - Illustrates cross-platform compatibility testing for Node.js and Flask implementations
 * - Provides modern testing practices with Jest framework and async/await patterns
 * 
 * Testing Coverage:
 * - Hello Endpoint Testing: Primary endpoint functionality and response validation
 * - Good Evening Endpoint Testing: Secondary endpoint with identical patterns
 * - Request Validation Testing: HTTP method validation and security enforcement
 * - Error Handling Testing: Exception handling and error response validation
 * - Performance Testing: Response time validation and resource monitoring
 * - Security Testing: Header validation and vulnerability assessment
 * - Cross-Platform Compatibility Testing: Flask comparison and feature parity
 */

// External testing framework imports with version comments  
// Import Jest functions for ES module compatibility
import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest'; // ^6.3.3 - SuperAgent driven library for testing HTTP servers

// Internal controller imports for unit testing
import {
  hello,
  goodEvening,
  validateRequestMethod,
  handleControllerError,
  createRequestContext,
  handleOptionsRequest,
  REQUEST_METRICS,
  CONTROLLER_CACHE,
  CORS_HEADERS
} from '../../../controllers/hello-controller.js';

// Error handling imports
import {
  ValidationError,
  HTTPError
} from '../../../utils/error-types.js';

// Import service functions
import {
  getHelloMessage,
  getGoodEveningMessage,
  validateMessageRequest,
  handleServiceError,
  trackServiceMetrics,
  formatMessageResponse,
  createFlaskCompatibleResponse,
  generateServiceHealth
} from '../../../services/hello-service.js';

// Test data imports for comprehensive validation scenarios
import {
  httpEndpoints,
  securityTestData,
  performanceBenchmarks,
  errorScenarios,
  crossPlatformTestData,
  mockResponses,
  validationRules
} from '../../fixtures/test-data.js';

// Mock implementations for non-existent helper files
const createHTTPTestHelper = () => ({
  makeRequest: async (method, path, options = {}) => {
    const request = {
      method: method.toUpperCase(),
      url: path,
      originalUrl: path,
      path,
      query: options.query || {},
      params: options.params || {},
      body: options.body || {},
      headers: options.headers || { 'user-agent': 'test-agent' },
      ip: options.ip || '127.0.0.1',
      secure: options.secure || false,
      protocol: options.protocol || 'http',
      connection: { remoteAddress: '127.0.0.1' }
    };
    return request;
  },
  
  validateResponse: (response, expected) => {
    const validation = {
      statusCode: response.statusCode === expected.statusCode,
      headers: true,
      body: true,
      timing: response.responseTime < expected.maxResponseTime
    };
    return validation;
  }
});

const createAssertionHelper = () => ({
  assertResponseStructure: (response, expectedStructure) => {
    expect(response).toBeDefined();
    if (expectedStructure.message) {
      expect(response.data.data.message).toBeDefined();
    }
    return true;
  },
  
  assertSecurityHeaders: (headers, expectedHeaders) => {
    Object.keys(expectedHeaders).forEach(header => {
      if (expectedHeaders[header] === null) {
        expect(headers[header]).toBeUndefined();
      } else {
        expect(headers[header]).toBeDefined();
      }
    });
    return true;
  },
  
  assertPerformanceThresholds: (metrics, thresholds) => {
    if (thresholds.responseTime) {
      expect(metrics.responseTime).toBeLessThan(thresholds.responseTime);
    }
    return true;
  }
});

const createPerformanceTestHelper = () => ({
  measureResponseTime: async (testFunction) => {
    const startTime = process.hrtime.bigint();
    await testFunction();
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / 1000000; // Convert to milliseconds
  },
  
  measureMemoryUsage: () => {
    return process.memoryUsage();
  },
  
  validatePerformanceThresholds: (metrics, thresholds) => {
    return metrics.responseTime <= thresholds.target;
  }
});

const createSecurityTestHelper = () => ({
  validateSecurityHeaders: (headers) => {
    const requiredHeaders = securityTestData.securityHeaders.requiredHeaders;
    return requiredHeaders.every(header => headers[header] !== undefined);
  },
  
  testXSSProtection: (response, payload) => {
    return !response.includes(payload);
  },
  
  validateCSP: (cspHeader) => {
    return cspHeader && cspHeader.includes('default-src');
  }
});

const createMockDataHelper = () => ({
  generateTestRequest: (options = {}) => ({
    method: options.method || 'GET',
    url: options.url || '/hello',
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {},
    ...options
  }),
  
  generateErrorScenario: (errorType) => {
    return errorScenarios.httpErrors[errorType] || {
      request: { method: 'GET', path: '/error' },
      expectedResponse: { statusCode: 500 }
    };
  }
});

const waitFor = async (condition, timeout = 5000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timeout waiting for condition');
};

// Mock test environment setup
const setupTestEnvironment = () => ({
  environment: 'test',
  logLevel: 'silent',
  enableCors: true,
  security: {
    helmetEnabled: true,
    httpsRedirect: false
  }
});

// Global test helpers initialization
let testHelpers, mockApp, testServer, performanceHelper, securityHelper;

/**
 * Sets up comprehensive test environment for hello controller testing including Express app creation,
 * test server initialization, helper configuration, and mock service setup with proper cleanup
 * procedures for isolated test execution.
 */
async function setupHelloControllerTests() {
  // Initialize test environment
  const testEnv = setupTestEnvironment();
  
  // Create HTTP test helper
  const httpHelper = createHTTPTestHelper();
  
  // Initialize all test helpers
  testHelpers = {
    http: httpHelper,
    assertions: createAssertionHelper(),
    performance: createPerformanceTestHelper(),
    security: createSecurityTestHelper(),
    mockData: createMockDataHelper()
  };
  
  // Set up performance helper
  performanceHelper = testHelpers.performance;
  
  // Set up security helper
  securityHelper = testHelpers.security;
  
  // Configure service layer mocks
  const serviceMocks = await setupServiceMocks({
    enableMocking: true,
    mockResponses: mockResponses.successResponses
  });
  
  // Return test setup object
  return {
    testHelpers,
    serviceMocks,
    environment: testEnv,
    cleanup: async () => await cleanupHelloControllerTests()
  };
}

/**
 * Creates mock Express request objects with configurable properties, headers, parameters,
 * and metadata for comprehensive controller testing including security scenarios, edge cases,
 * and performance validation.
 */
function createMockRequest(requestOptions = {}) {
  const defaultOptions = {
    method: 'GET',
    url: '/hello',
    originalUrl: '/hello',
    path: '/hello',
    query: {},
    params: {},
    body: {},
    headers: {
      'user-agent': 'test-user-agent',
      'accept': 'application/json',
      'host': 'localhost:3000'
    },
    ip: '127.0.0.1',
    secure: false,
    protocol: 'http',
    connection: { remoteAddress: '127.0.0.1' }
  };
  
  const request = { ...defaultOptions, ...requestOptions };
  
  // Add Express.js specific properties and methods
  request.get = (header) => request.headers[header.toLowerCase()];
  request.header = request.get;
  
  return request;
}

/**
 * Creates mock Express response objects with chainable methods, status tracking, header management,
 * and response capture for comprehensive controller response validation and testing scenarios.
 */
function createMockResponse(responseOptions = {}) {
  const response = {
    statusCode: 200,
    headers: {},
    data: null,
    headersSent: false,
    locals: {},
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    },
    
    getHeader: function(name) {
      return this.headers[name];
    },
    
    json: function(data) {
      this.data = data;
      this.headers['Content-Type'] = 'application/json';
      return this;
    },
    
    send: function(data) {
      this.data = data;
      return this;
    },
    
    end: function() {
      this.headersSent = true;
      return this;
    }
  };
  
  return Object.assign(response, responseOptions);
}

/**
 * Creates mock Express next function for middleware testing including error handling,
 * call tracking, and argument validation for comprehensive middleware flow testing
 * and error propagation validation.
 */
function createMockNext() {
  const next = jest.fn();
  next.callCount = 0;
  next.lastError = null;
  
  next.mockImplementation((error) => {
    next.callCount++;
    if (error) {
      next.lastError = error;
    }
  });
  
  return next;
}

/**
 * Validates controller response objects including status codes, headers, content structure,
 * performance metrics, and security compliance for comprehensive response verification
 * and testing validation.
 */
function validateControllerResponse(response, expectedResponse, validationOptions = {}) {
  const validation = {
    isValid: true,
    errors: [],
    statusCode: false,
    headers: false,
    content: false,
    performance: false,
    security: false
  };
  
  // Validate status code
  const expectedStatusCode = expectedResponse.statusCode || expectedResponse.status;
  if (response.statusCode === expectedStatusCode) {
    validation.statusCode = true;
  } else {
    validation.errors.push(`Status code mismatch: expected ${expectedStatusCode}, got ${response.statusCode}`);
    validation.isValid = false;
  }
  
  // Validate headers
  if (expectedResponse.headers) {
    const headerValidation = testHelpers.assertions.assertSecurityHeaders(response.headers, expectedResponse.headers);
    validation.headers = headerValidation;
  } else {
    validation.headers = true;
  }
  
  // Validate content structure
  if (expectedResponse.body && response.data) {
    const contentValidation = testHelpers.assertions.assertResponseStructure(response.data, expectedResponse.body);
    validation.content = contentValidation;
  } else {
    validation.content = true;
  }
  
  return validation;
}

/**
 * Sets up comprehensive service layer mocking for hello service functions including response
 * simulation, error scenarios, performance tracking, and cross-platform compatibility testing
 * with proper cleanup and restoration.
 */
async function setupServiceMocks(mockConfig = {}) {
  const mocks = {
    getHelloMessage: jest.fn(),
    getGoodEveningMessage: jest.fn(),
    validateMessageRequest: jest.fn(),
    handleServiceError: jest.fn(),
    trackServiceMetrics: jest.fn(),
    formatMessageResponse: jest.fn(),
    createFlaskCompatibleResponse: jest.fn(),
    
    cleanup: () => {
      Object.keys(mocks).forEach(key => {
        if (typeof mocks[key] === 'function' && mocks[key].mockRestore) {
          mocks[key].mockRestore();
        }
      });
    }
  };
  
  // Configure default mock implementations
  mocks.getHelloMessage.mockResolvedValue({
    message: 'Hello world',
    timestamp: new Date().toISOString()
  });
  
  mocks.getGoodEveningMessage.mockResolvedValue({
    message: 'Good evening',
    timestamp: new Date().toISOString()
  });
  
  mocks.validateMessageRequest.mockResolvedValue({
    success: true,
    data: {
      method: 'GET',
      path: '/hello',
      headers: { 'user-agent': 'test-user-agent' },
      query: {},
      body: {},
      timestamp: new Date().toISOString()
    },
    validation: {
      correlationId: 'test-correlation-id',
      timestamp: new Date().toISOString(),
      checks: {
        structure: true,
        method: true,
        headers: true,
        size: true,
        security: true
      },
      sanitized: true
    }
  });
  
  mocks.handleServiceError.mockResolvedValue({
    errorId: 'test-error-id',
    message: 'Test error',
    sanitized: true
  });
  
  mocks.trackServiceMetrics.mockResolvedValue(true);
  
  mocks.formatMessageResponse.mockImplementation((response) => ({
    ...response,
    formatted: true,
    timestamp: new Date().toISOString()
  }));
  
  mocks.createFlaskCompatibleResponse.mockImplementation((response) => ({
    ...response,
    flaskCompatible: true
  }));
  
  return mocks;
}

/**
 * Comprehensive cleanup function for hello controller tests including server shutdown,
 * mock restoration, cache clearing, and resource deallocation for proper test isolation
 * and memory management.
 */
async function cleanupHelloControllerTests() {
  // Clear global test state
  if (testHelpers && testHelpers.mocks && testHelpers.mocks.cleanup) {
    testHelpers.mocks.cleanup();
  }
  
  // Reset performance metrics
  Object.keys(REQUEST_METRICS).forEach(key => {
    if (typeof REQUEST_METRICS[key] === 'number') {
      REQUEST_METRICS[key] = 0;
    }
  });
  
  // Clear controller cache
  CONTROLLER_CACHE.clear();
  
  // Reset globals
  testHelpers = null;
  mockApp = null;
  testServer = null;
  performanceHelper = null;
  securityHelper = null;
}

// Main test suite
describe('Hello Controller Unit Tests', () => {
  let testSetup;
  
  beforeAll(async () => {
    testSetup = await setupHelloControllerTests();
  });
  
  afterAll(async () => {
    if (testSetup && testSetup.cleanup) {
      await testSetup.cleanup();
    }
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Hello Endpoint Testing', () => {
    test('should return Hello world message with 200 status', async () => {
      // Arrange
      const mockRequest = createMockRequest({ 
        method: 'GET', 
        url: '/hello' 
      });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Mock service dependencies
      const serviceMocks = await setupServiceMocks();
      
      // Act
      const responseTime = await performanceHelper.measureResponseTime(async () => {
        await hello(mockRequest, mockResponse, mockNext);
      });
      
      // Assert
      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.data.data.message).toBe('Hello world');
      expect(mockResponse.headers['Content-Type']).toContain('application/json');
      expect(responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.critical);
      
      // Cleanup
      serviceMocks.cleanup();
    });
    
    test('should handle request context and correlation tracking', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      await hello(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.headers['X-Request-ID']).toBeDefined();
      expect(mockResponse.headers['X-Response-Time']).toBeDefined();
      expect(mockResponse.headers['X-Controller']).toBe('hello-controller');
    });
    
    test('should apply security headers and CORS configuration', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      await hello(mockRequest, mockResponse, mockNext);
      
      // Assert
      Object.keys(CORS_HEADERS).forEach(header => {
        expect(mockResponse.headers[header]).toBe(CORS_HEADERS[header]);
      });
      expect(mockResponse.headers['X-Powered-By']).toBeUndefined();
    });
  });
  
  describe('Good Evening Endpoint Testing', () => {
    test('should return Good evening message with identical patterns', async () => {
      // Arrange
      const mockRequest = createMockRequest({ 
        method: 'GET', 
        url: '/good-evening' 
      });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      const responseTime = await performanceHelper.measureResponseTime(async () => {
        await goodEvening(mockRequest, mockResponse, mockNext);
      });
      
      // Assert
      expect(mockResponse.statusCode).toBe(200);
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.data.data.message).toBe('Good evening');
      expect(responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.goodEvening.critical);
    });
    
    test('should maintain feature parity with hello endpoint', async () => {
      // Arrange
      const helloRequest = createMockRequest({ url: '/hello' });
      const helloResponse = createMockResponse();
      const goodEveningRequest = createMockRequest({ url: '/good-evening' });
      const goodEveningResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      await hello(helloRequest, helloResponse, mockNext);
      await goodEvening(goodEveningRequest, goodEveningResponse, mockNext);
      
      // Assert - Security headers should be identical
      Object.keys(CORS_HEADERS).forEach(header => {
        expect(helloResponse.headers[header]).toBe(goodEveningResponse.headers[header]);
      });
      
      // Response structure should be similar
      expect(helloResponse.statusCode).toBe(goodEveningResponse.statusCode);
      expect(typeof helloResponse.data.data.data.message).toBe(typeof goodEveningResponse.data.data.data.message);
    });
  });
  
  describe('Request Validation Testing', () => {
    test('should validate HTTP methods and reject unsupported methods', async () => {
      // Test POST method rejection
      const mockRequest = createMockRequest({ method: 'POST' });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      validateRequestMethod(mockRequest, mockResponse, mockNext);
      
      expect(mockResponse.statusCode).toBe(405);
      expect(mockResponse.headers['Allow']).toContain('GET');
      expect(mockResponse.headers['Allow']).toContain('OPTIONS');
    });
    
    test('should handle OPTIONS preflight requests for CORS', async () => {
      // Arrange
      const mockRequest = createMockRequest({ 
        method: 'OPTIONS',
        headers: {
          'origin': 'https://example.com',
          'access-control-request-method': 'GET'
        }
      });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      handleOptionsRequest(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(204);
      expect(mockResponse.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(mockResponse.headers['Access-Control-Max-Age']).toBe('86400');
    });
    
    test('should sanitize input and prevent security vulnerabilities', async () => {
      // Test XSS attack vector
      const xssPayload = securityTestData.xssAttacks[0].payload;
      const mockRequest = createMockRequest({ 
        query: { test: xssPayload }
      });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      await hello(mockRequest, mockResponse, mockNext);
      
      // Response should not contain the XSS payload
      expect(JSON.stringify(mockResponse.data)).not.toContain('<script>');
    });
  });
  
  describe('Error Handling Testing', () => {
    test('should handle service layer errors gracefully', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      const testError = new Error('Service layer error');
      
      // Act - Test the error handling function directly
      await handleControllerError(testError, mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(500);
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.error).toBeDefined();
      expect(mockResponse.data.success).toBe(false);
    });
    
    test('should handle validation errors with detailed feedback', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      const validationError = new ValidationError(
        'Request validation failed', 
        ['Invalid parameter'], 
        { correlationId: 'test-correlation-id' }
      );
      
      // Act - Test the error handling function directly with ValidationError
      await handleControllerError(validationError, mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.error).toBeDefined();
      expect(mockResponse.data.success).toBe(false);
    });
    
    test('should handle unexpected errors with fallback responses', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      const unexpectedError = new Error('Unexpected system error');
      unexpectedError.stack = 'Error stack trace';
      
      // Act
      await handleControllerError(unexpectedError, mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockResponse.statusCode).toBe(500);
      expect(mockResponse.data.error).toBeDefined();
      expect(mockResponse.headers['X-Request-ID']).toBeDefined();
    });
  });
  
  describe('Performance Testing', () => {
    test('should meet response time performance targets', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      const performanceThreshold = performanceBenchmarks.responseTimeLimits.hello.target;
      
      // Act
      const responseTime = await performanceHelper.measureResponseTime(async () => {
        await hello(mockRequest, mockResponse, mockNext);
      });
      
      // Assert
      expect(responseTime).toBeLessThan(performanceThreshold);
      
      // Validate performance metrics are tracked
      expect(REQUEST_METRICS.requests).toBeGreaterThan(0);
    });
    
    test('should handle concurrent requests efficiently', async () => {
      // Arrange
      const concurrentRequestCount = 10;
      const requests = Array(concurrentRequestCount).fill().map(() => ({
        request: createMockRequest(),
        response: createMockResponse(),
        next: createMockNext()
      }));
      
      // Act
      const startTime = Date.now();
      await Promise.all(requests.map(({ request, response, next }) => 
        hello(request, response, next)
      ));
      const totalTime = Date.now() - startTime;
      
      // Assert
      const averageResponseTime = totalTime / concurrentRequestCount;
      expect(averageResponseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.warning);
      
      // All requests should complete successfully
      requests.forEach(({ response }) => {
        expect(response.statusCode).toBe(200);
      });
    });
  });
  
  describe('Security Testing', () => {
    test('should apply Helmet.js security headers correctly', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      await hello(mockRequest, mockResponse, mockNext);
      
      // Assert
      const securityValidation = securityHelper.validateSecurityHeaders(mockResponse.headers);
      expect(securityValidation).toBe(true);
      
      // Specific security header checks
      expect(mockResponse.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(mockResponse.headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });
    
    test('should prevent common security vulnerabilities', async () => {
      // Test XSS prevention
      const xssAttack = securityTestData.xssAttacks.find(attack => 
        attack.name === 'script_injection'
      );
      
      const mockRequest = createMockRequest({
        query: { malicious: xssAttack.payload }
      });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      await hello(mockRequest, mockResponse, mockNext);
      
      // Response should not contain unescaped XSS payload
      const responseString = JSON.stringify(mockResponse.data);
      expect(securityHelper.testXSSProtection(responseString, xssAttack.payload)).toBe(true);
    });
  });
  
  describe('Cross-Platform Compatibility Testing', () => {
    test('should maintain Flask compatibility for response formats', async () => {
      // Arrange
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      await hello(mockRequest, mockResponse, mockNext);
      
      // Assert - Response structure should match Flask format
      const expressResponse = mockResponse.data;
      const expectedFlaskResponse = crossPlatformTestData.flaskResponses.hello;
      
      expect(expressResponse.data.data.message).toBe(expectedFlaskResponse.body.message);
      expect(mockResponse.statusCode).toBe(expectedFlaskResponse.statusCode);
    });
    
    test('should support cross-platform testing utilities', async () => {
      // Test request context creation for Flask compatibility
      const mockRequest = createMockRequest();
      const context = createRequestContext(mockRequest, {
        correlationId: 'test-correlation-id',
        endpoint: '/hello'
      });
      
      // Assert context structure is compatible with Flask
      expect(context.correlationId).toBe('test-correlation-id');
      expect(context.crossPlatform.framework).toBe('express');
      expect(context.crossPlatform.flaskCompatible).toBe(true);
      expect(context.route.endpoint).toBe('/hello');
    });
  });
  
  describe('Integration Tests', () => {
    test('should handle complete request-response cycle', async () => {
      // Arrange
      const mockRequest = createMockRequest({
        headers: {
          'user-agent': 'integration-test-agent',
          'accept': 'application/json',
          'x-request-id': 'integration-test-id'
        }
      });
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      // Act
      await hello(mockRequest, mockResponse, mockNext);
      
      // Assert complete response validation
      const validation = validateControllerResponse(
        mockResponse,
        httpEndpoints.hello.expectedResponse,
        { validatePerformance: true, validateSecurity: true }
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.statusCode).toBe(true);
      expect(validation.headers).toBe(true);
      expect(validation.content).toBe(true);
    });
    
    test('should maintain consistency across multiple requests', async () => {
      // Test multiple requests to ensure consistent behavior
      const requestCount = 5;
      const responses = [];
      
      for (let i = 0; i < requestCount; i++) {
        const mockRequest = createMockRequest();
        const mockResponse = createMockResponse();
        const mockNext = createMockNext();
        
        await hello(mockRequest, mockResponse, mockNext);
        responses.push(mockResponse);
      }
      
      // All responses should have consistent structure
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        expect(response.data.data.data.message).toBe('Hello world');
        expect(response.headers['Content-Type']).toContain('application/json');
      });
    });
  });
  
  describe('Edge Cases and Error Scenarios', () => {
    test('should handle malformed request objects', async () => {
      // Test with missing required properties
      const malformedRequest = { method: 'GET' }; // Missing url and other properties
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();
      
      await hello(malformedRequest, mockResponse, mockNext);
      
      // Should handle gracefully and send error response
      expect(mockResponse.statusCode).toBeGreaterThanOrEqual(400);
    });
    
    test('should handle memory constraints gracefully', async () => {
      // Simulate memory usage monitoring
      const memoryBefore = process.memoryUsage();
      
      // Execute multiple requests to test memory handling
      for (let i = 0; i < 50; i++) {
        const mockRequest = createMockRequest();
        const mockResponse = createMockResponse();
        const mockNext = createMockNext();
        
        await hello(mockRequest, mockResponse, mockNext);
      }
      
      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(performanceBenchmarks.memoryThresholds.perProcess.warning * 1024 * 1024);
    });
  });
});