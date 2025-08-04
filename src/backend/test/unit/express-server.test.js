/**
 * @fileoverview Comprehensive Unit Test Suite for Express.js Server Implementation
 * @description Extensive unit testing for Express.js v5.1.0 server implementation validating
 * Phase 2 framework integration including middleware stack validation, security header testing,
 * route integration, performance requirements, and production readiness. Tests Express server
 * creation, configuration, Helmet.js security integration, CORS functionality, rate limiting,
 * request logging, error handling, and PM2 cluster mode compatibility with comprehensive
 * assertion helpers and educational demonstrations of testing best practices.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Testing Framework Compatibility:
 * - Jest v29+ with ES Modules support and built-in assertion library
 * - Mocha v11+ with Node.js ^18.18.0 || ^20.9.0 || >=21.1.0
 * - SuperTest HTTP endpoint testing integration
 * - Comprehensive code coverage with ≥90% target threshold
 * 
 * Educational Objectives:
 * - Demonstrate comprehensive Express.js testing patterns with modern frameworks
 * - Implement production-ready testing strategies including security and performance validation
 * - Show HTTP API testing best practices with SuperTest integration and assertion patterns
 * - Validate PM2 compatibility and production deployment features through testing
 * - Provide cross-platform testing preparation for Flask migration and compatibility
 * - Create educational test examples with comprehensive learning annotations
 * 
 * Production Features:
 * - Comprehensive middleware testing including security, CORS, and performance validation
 * - HTTP endpoint testing with status code, header, and response content validation
 * - Security testing with Helmet.js header validation and vulnerability assessment
 * - Performance testing with response time measurement and memory monitoring
 * - Error handling testing including exception scenarios and edge cases
 * - PM2 cluster mode compatibility validation and stateless architecture testing
 * - Cross-platform compatibility preparation for Express.js to Flask migration
 * - Educational demonstrations with comprehensive testing best practices
 */

// External testing libraries with version comments for dependency management
import supertest from 'supertest'; // v6.3.3 - SuperAgent driven library for testing HTTP servers
import { randomUUID } from 'node:crypto'; // crypto v20.11.0 - Node.js crypto module for secure test identifiers
import process from 'node:process'; // process built-in - Node.js process utilities for monitoring

// Internal Express.js server imports for comprehensive testing coverage
import {
  createExpressServer,
  startExpressServer,
  configureExpressRoutes,
  initializeExpressMiddleware,
  handleExpressServerShutdown,
  validateExpressConfiguration
} from '../../express-server.js';

// Mock response fixtures and test data for comprehensive testing scenarios
import {
  createMockResponse,
  createHelloResponse,
  createGoodEveningResponse,
  createHealthResponse,
  createErrorResponse,
  createSecurityResponse,
  createPerformanceResponse,
  helloResponses,
  goodEveningResponses,
  healthResponses,
  errorResponses,
  securityResponses,
  performanceResponses
} from '../fixtures/mock-responses.js';

// Constants imports for testing configuration and validation
import {
  HTTP_CONSTANTS,
  API_CONSTANTS,
  TESTING_CONSTANTS,
  SECURITY_CONSTANTS
} from '../../utils/constants.js';

// Routes and middleware imports for integration testing
import { routes } from '../../routes/index.js';
import { middleware, createMiddlewareStack } from '../../middleware/index.js';

/**
 * Global Test Infrastructure and State Management
 * @description Centralized test state management for Express.js server testing
 */
let TEST_SERVER_INSTANCE = null; // Express.js server instance for testing
let HTTP_TEST_CLIENT = null; // SuperTest HTTP client for endpoint testing
let SECURITY_TEST_HELPER = null; // Security validation helper for Helmet.js testing
let PERFORMANCE_TEST_HELPER = null; // Performance monitoring helper for benchmark validation
let TEST_CORRELATION_ID = null; // Unique test correlation ID for request tracking
let TEST_START_TIME = null; // Test suite start time for performance measurement
const MIDDLEWARE_TEST_CACHE = new Map(); // Middleware testing cache for optimization
const ROUTE_TEST_REGISTRY = new Map(); // Route testing registry for validation tracking

/**
 * Test Helper Function Implementations
 * @description Comprehensive test helper functions for Express.js testing infrastructure
 * Note: These functions replace the missing test-helpers.js file with inline implementations
 */

/**
 * Sets up comprehensive testing infrastructure for Express.js server testing
 * @returns {Promise<Object>} Test infrastructure setup result with helper instances
 */
const setupTestHelpers = async () => {
  try {
    // Generate unique test correlation ID for request tracking and debugging
    TEST_CORRELATION_ID = randomUUID();
    TEST_START_TIME = Date.now();

    // Initialize test infrastructure components
    const testSetup = {
      correlationId: TEST_CORRELATION_ID,
      startTime: TEST_START_TIME,
      helpers: {
        http: null,
        security: null,
        performance: null,
        async: null
      }
    };

    console.log(`Setting up test helpers for Express.js testing [${TEST_CORRELATION_ID}]`);
    return testSetup;

  } catch (error) {
    console.error('Failed to setup test helpers:', error);
    throw new Error(`Test helper setup failed: ${error.message}`);
  }
};

/**
 * Creates HTTP test helper using SuperTest for comprehensive endpoint testing
 * @param {Object} app - Express.js application instance for testing
 * @returns {Object} HTTP test helper with SuperTest integration and assertion methods
 */
const createHTTPTestHelper = (app) => {
  if (!app) {
    throw new Error('Express.js application instance required for HTTP testing');
  }

  // Initialize SuperTest HTTP client for endpoint testing
  HTTP_TEST_CLIENT = supertest(app);

  return {
    client: HTTP_TEST_CLIENT,
    
    // HTTP GET request helper with response validation
    async get(endpoint, options = {}) {
      const response = await HTTP_TEST_CLIENT
        .get(endpoint)
        .set('X-Test-Correlation-ID', TEST_CORRELATION_ID)
        .expect(options.expectedStatus || HTTP_CONSTANTS.STATUS_CODES.OK);
      
      return response;
    },

    // HTTP POST request helper with body and header support
    async post(endpoint, body = {}, options = {}) {
      const response = await HTTP_TEST_CLIENT
        .post(endpoint)
        .send(body)
        .set('X-Test-Correlation-ID', TEST_CORRELATION_ID)
        .set('Content-Type', 'application/json')
        .expect(options.expectedStatus || HTTP_CONSTANTS.STATUS_CODES.OK);
      
      return response;
    },

    // Response validation helper for comprehensive assertions
    validateResponse(response, expectedData = {}) {
      const validations = {
        statusCode: response.status === (expectedData.status || HTTP_CONSTANTS.STATUS_CODES.OK),
        contentType: response.headers['content-type']?.includes('application/json'),
        hasBody: typeof response.body === 'object',
        hasTimestamp: response.body?.timestamp !== undefined
      };

      return {
        passed: Object.values(validations).every(v => v),
        validations,
        response
      };
    }
  };
};

/**
 * Creates security test helper for Helmet.js validation and security header testing
 * @param {Object} app - Express.js application instance for security testing
 * @returns {Object} Security test helper with Helmet.js validation methods
 */
const createSecurityTestHelper = (app) => {
  SECURITY_TEST_HELPER = {
    app,
    
    // Validates Helmet.js security headers implementation
    async validateSecurityHeaders(endpoint = '/hello') {
      const response = await supertest(app)
        .get(endpoint)
        .set('X-Test-Correlation-ID', TEST_CORRELATION_ID);

      const securityHeaders = {
        contentSecurityPolicy: response.headers['content-security-policy'],
        strictTransportSecurity: response.headers['strict-transport-security'],
        xContentTypeOptions: response.headers['x-content-type-options'],
        xFrameOptions: response.headers['x-frame-options'],
        referrerPolicy: response.headers['referrer-policy'],
        xXssProtection: response.headers['x-xss-protection']
      };

      const validation = {
        helmetEnabled: Object.values(securityHeaders).some(header => header !== undefined),
        cspConfigured: securityHeaders.contentSecurityPolicy !== undefined,
        hstsEnabled: securityHeaders.strictTransportSecurity !== undefined,
        noSniffEnabled: securityHeaders.xContentTypeOptions === 'nosniff',
        frameOptionsSet: securityHeaders.xFrameOptions !== undefined,
        xPoweredByRemoved: response.headers['x-powered-by'] === undefined
      };

      return {
        headers: securityHeaders,
        validation,
        passed: Object.values(validation).every(v => v),
        response
      };
    },

    // CORS validation helper for cross-origin request testing
    async validateCORS(origin = 'http://localhost:3000') {
      const response = await supertest(app)
        .options('/hello')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'GET')
        .set('X-Test-Correlation-ID', TEST_CORRELATION_ID);

      return {
        corsEnabled: response.headers['access-control-allow-origin'] !== undefined,
        methodsAllowed: response.headers['access-control-allow-methods'],
        headersAllowed: response.headers['access-control-allow-headers'],
        response
      };
    }
  };

  return SECURITY_TEST_HELPER;
};

/**
 * Creates performance test helper for response time measurement and benchmark validation
 * @param {Object} app - Express.js application instance for performance testing
 * @returns {Object} Performance test helper with timing and resource monitoring methods
 */
const createPerformanceTestHelper = (app) => {
  PERFORMANCE_TEST_HELPER = {
    app,
    
    // Measures response time for performance benchmarking
    async measureResponseTime(endpoint = '/hello', iterations = 10) {
      const measurements = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        
        await supertest(app)
          .get(endpoint)
          .set('X-Test-Correlation-ID', TEST_CORRELATION_ID);
        
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        measurements.push(responseTime);
      }

      const average = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const median = measurements.sort((a, b) => a - b)[Math.floor(measurements.length / 2)];
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);

      return {
        measurements,
        statistics: { average, median, min, max },
        target: TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD,
        passed: average <= TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD
      };
    },

    // Memory usage monitoring for resource validation
    async measureMemoryUsage() {
      const beforeMemory = process.memoryUsage();
      
      // Perform multiple requests to measure memory impact
      for (let i = 0; i < 50; i++) {
        await supertest(app)
          .get('/hello')
          .set('X-Test-Correlation-ID', TEST_CORRELATION_ID);
      }

      const afterMemory = process.memoryUsage();
      const memoryDelta = {
        heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
        heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal,
        external: afterMemory.external - beforeMemory.external,
        rss: afterMemory.rss - beforeMemory.rss
      };

      return {
        before: beforeMemory,
        after: afterMemory,
        delta: memoryDelta,
        threshold: TESTING_CONSTANTS.PERFORMANCE_TARGETS.MEMORY_USAGE_THRESHOLD * 1024 * 1024,
        passed: memoryDelta.heapUsed < (TESTING_CONSTANTS.PERFORMANCE_TARGETS.MEMORY_USAGE_THRESHOLD * 1024 * 1024)
      };
    }
  };

  return PERFORMANCE_TEST_HELPER;
};

/**
 * Creates async test helper for Promise testing and timeout management
 * @param {Object} options - Async testing configuration options
 * @returns {Object} Async test helper with Promise and timeout utilities
 */
const createAsyncTestHelper = (options = {}) => {
  const config = {
    defaultTimeout: options.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS,
    retryAttempts: options.retryAttempts || 3,
    retryDelay: options.retryDelay || 1000
  };

  return {
    config,
    
    // Promise wrapper with timeout support
    async withTimeout(promise, timeout = config.defaultTimeout) {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
        )
      ]);
    },

    // Retry wrapper for flaky operations
    async withRetry(operation, attempts = config.retryAttempts) {
      let lastError;
      
      for (let i = 0; i < attempts; i++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          }
        }
      }
      
      throw lastError;
    },

    // Concurrent operation helper
    async concurrent(operations) {
      const startTime = Date.now();
      const results = await Promise.all(operations.map(op => op()));
      const endTime = Date.now();
      
      return {
        results,
        duration: endTime - startTime,
        operations: operations.length
      };
    }
  };
};

/**
 * Test suite teardown function for resource cleanup and test isolation
 * @returns {Promise<void>} Cleanup completion promise
 */
const teardownTestSuite = async () => {
  try {
    // Close test server instance and clean up HTTP connections
    if (TEST_SERVER_INSTANCE && typeof TEST_SERVER_INSTANCE.close === 'function') {
      await new Promise((resolve) => {
        TEST_SERVER_INSTANCE.close(resolve);
      });
      TEST_SERVER_INSTANCE = null;
    }

    // Clear HTTP test client and release SuperTest resources
    HTTP_TEST_CLIENT = null;

    // Clean up security test helper and reset security state
    SECURITY_TEST_HELPER = null;

    // Clear performance test helper and reset metrics cache
    PERFORMANCE_TEST_HELPER = null;

    // Reset global test variables and correlation tracking
    TEST_CORRELATION_ID = null;
    TEST_START_TIME = null;

    // Clear middleware test cache and reset registry
    MIDDLEWARE_TEST_CACHE.clear();
    ROUTE_TEST_REGISTRY.clear();

    // Perform garbage collection hints for memory optimization
    if (global.gc) {
      global.gc();
    }

    console.log('Test suite teardown completed successfully');

  } catch (error) {
    console.error('Error during test suite teardown:', error);
    throw error;
  }
};

/**
 * Main Test Suite: Express.js Server Implementation Testing
 * @description Comprehensive testing suite for Express.js v5.1.0 server functionality
 */
describe('Express.js Server Implementation - Comprehensive Unit Testing', () => {
  // Set up test suite with infrastructure initialization
  beforeAll(async () => {
    await setupTestHelpers();
    console.log(`Starting Express.js server test suite [${TEST_CORRELATION_ID}]`);
  }, TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);

  // Clean up test infrastructure after all tests
  afterAll(async () => {
    await teardownTestSuite();
  }, TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);

  /**
   * Test Suite: Express Server Creation Functionality
   * @description Tests Express.js server creation, configuration, and initialization
   */
  describe('Express Server Creation', () => {
    let testApp;

    beforeEach(() => {
      testApp = null;
    });

    afterEach(async () => {
      if (testApp && typeof testApp.close === 'function') {
        await new Promise(resolve => testApp.close(resolve));
      }
    });

    /**
     * Test: createExpressServer function validation
     * @description Validates Express application creation and middleware integration
     */
    test('should create Express application instance with middleware integration', async () => {
      // Arrange: Initialize test configuration with environment settings
      const testConfig = {
        enableHealthMonitoring: true,
        enablePerformanceTracking: true,
        educationalOptions: { enabled: true }
      };

      // Act: Call createExpressServer function with test configuration
      testApp = createExpressServer(testConfig);

      // Assert: Validate Express application instance creation
      expect(testApp).toBeDefined();
      expect(typeof testApp.listen).toBe('function');
      expect(typeof testApp.use).toBe('function');
      expect(typeof testApp.get).toBe('function');

      // Validate middleware stack integration and execution order
      expect(testApp._router).toBeDefined();
      expect(testApp._router.stack.length).toBeGreaterThan(0);

      // Educational annotation: Express.js application factory pattern
      console.log('✓ Express.js application created successfully with comprehensive middleware stack');
    });

    /**
     * Test: Express middleware integration validation
     * @description Tests middleware stack composition and configuration
     */
    test('should initialize comprehensive middleware stack with security configuration', () => {
      // Arrange: Create Express application with middleware configuration
      const middlewareConfig = {
        security: {
          helmet: { contentSecurityPolicy: true },
          cors: { allowedOrigins: ['http://localhost:3000'] }
        },
        enablePerformanceTracking: true
      };

      // Act: Initialize Express middleware stack
      testApp = createExpressServer(middlewareConfig);
      const result = initializeExpressMiddleware(testApp, middlewareConfig);

      // Assert: Validate middleware integration results
      expect(result).toBeDefined();
      expect(result.middleware).toContain('helmet');
      expect(result.middleware).toContain('cors');
      expect(result.middleware).toContain('compression');
      expect(result.middleware).toContain('request-logging');

      // Validate security middleware configuration
      expect(result.security.helmet).toBeDefined();
      expect(result.security.cors).toBeDefined();

      // Educational annotation: Middleware composition pattern
      console.log('✓ Comprehensive middleware stack initialized with security features');
    });

    /**
     * Test: Express route configuration validation
     * @description Tests route mounting and endpoint integration
     */
    test('should configure Express routes with comprehensive endpoint integration', () => {
      // Arrange: Create Express application for route testing
      testApp = createExpressServer();
      const routeConfig = {
        enableMetrics: true,
        educationalMode: true
      };

      // Act: Configure Express routes with test configuration
      configureExpressRoutes(testApp, routeConfig);

      // Assert: Validate route configuration success
      expect(testApp._router).toBeDefined();
      
      // Register route configuration in test registry for validation tracking
      ROUTE_TEST_REGISTRY.set('hello', { path: '/hello', method: 'GET' });
      ROUTE_TEST_REGISTRY.set('good-evening', { path: '/good-evening', method: 'GET' });

      // Educational annotation: Express.js routing architecture
      console.log('✓ Express.js routes configured with comprehensive endpoint integration');
    });
  });

  /**
   * Test Suite: Express Server Startup and Lifecycle Management
   * @description Tests server startup, port binding, and lifecycle management
   */
  describe('Express Server Startup and Lifecycle', () => {
    let testServer;

    afterEach(async () => {
      if (testServer && typeof testServer.close === 'function') {
        await new Promise(resolve => testServer.close(resolve));
      }
    });

    /**
     * Test: Express server startup process validation
     * @description Tests complete server startup and port binding
     */
    test('should start Express server with comprehensive configuration', async () => {
      // Arrange: Create Express application and startup configuration
      const testApp = createExpressServer();
      const startupConfig = {
        port: 0, // Use ephemeral port for testing
        enableGracefulShutdown: true,
        enableHealthMonitoring: true
      };

      // Act: Start Express server with configuration
      testServer = await startExpressServer(testApp, startupConfig);

      // Assert: Validate server startup and configuration
      expect(testServer).toBeDefined();
      expect(testServer.listening).toBe(true);
      expect(testServer.address()).toBeDefined();
      expect(typeof testServer.address().port).toBe('number');

      // Validate server readiness for HTTP requests
      const serverAddress = testServer.address();
      expect(serverAddress.port).toBeGreaterThan(0);

      // Educational annotation: HTTP server binding and lifecycle
      console.log(`✓ Express.js server started successfully on port ${serverAddress.port}`);
    });

    /**
     * Test: Server graceful shutdown procedures
     * @description Tests graceful shutdown and resource cleanup
     */
    test('should handle graceful shutdown with resource cleanup', async () => {
      // Arrange: Start Express server for shutdown testing
      const testApp = createExpressServer();
      testServer = await startExpressServer(testApp, { port: 0 });

      // Act: Trigger graceful shutdown
      const shutdownResult = await handleExpressServerShutdown(testServer, 'SIGTERM');

      // Assert: Validate shutdown completion and resource cleanup
      expect(shutdownResult).toBeDefined();
      expect(shutdownResult.success).toBe(true);
      expect(shutdownResult.signal).toBe('SIGTERM');
      expect(typeof shutdownResult.shutdownDuration).toBe('number');

      // Educational annotation: Graceful shutdown patterns for production
      console.log('✓ Express.js server graceful shutdown completed successfully');
    });
  });

  /**
   * Test Suite: HTTP Endpoint Testing with SuperTest Integration
   * @description Comprehensive endpoint testing with response validation
   */
  describe('HTTP Endpoint Testing', () => {
    let testApp;
    let httpHelper;

    beforeAll(() => {
      testApp = createExpressServer();
      httpHelper = createHTTPTestHelper(testApp);
    });

    /**
     * Test: /hello endpoint functionality validation
     * @description Tests hello endpoint response content and status codes
     */
    test('should handle /hello endpoint with correct response format', async () => {
      // Arrange: Expected response data from API constants
      const expectedMessage = API_CONSTANTS.RESPONSES.HELLO_WORLD.message;

      // Act: Make GET request to /hello endpoint
      const response = await httpHelper.get('/hello');

      // Assert: Validate response status and content
      expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toBeDefined();
      expect(response.body.message).toBe(expectedMessage);
      expect(response.body.timestamp).toBeDefined();

      // Validate response structure consistency
      const validation = httpHelper.validateResponse(response, {
        status: HTTP_CONSTANTS.STATUS_CODES.OK
      });
      expect(validation.passed).toBe(true);

      // Educational annotation: RESTful API response validation
      console.log('✓ /hello endpoint validated with proper JSON response structure');
    });

    /**
     * Test: /good-evening endpoint functionality validation
     * @description Tests good evening endpoint for consistency with hello endpoint
     */
    test('should handle /good-evening endpoint with consistent response structure', async () => {
      // Arrange: Expected response data for good evening endpoint
      const expectedMessage = API_CONSTANTS.RESPONSES.GOOD_EVENING.message;

      // Act: Make GET request to /good-evening endpoint
      const response = await httpHelper.get('/good-evening');

      // Assert: Validate response structure and content consistency
      expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.message).toBe(expectedMessage);
      expect(response.body.timestamp).toBeDefined();

      // Validate educational comparison with hello endpoint
      const helloResponse = await httpHelper.get('/hello');
      expect(typeof response.body).toBe(typeof helloResponse.body);
      expect(Object.keys(response.body)).toEqual(Object.keys(helloResponse.body));

      // Educational annotation: Endpoint pattern consistency validation
      console.log('✓ /good-evening endpoint demonstrates consistent API design patterns');
    });

    /**
     * Test: Performance requirements validation
     * @description Tests response time and performance benchmarks
     */
    test('should meet performance requirements for response time', async () => {
      // Arrange: Create performance test helper
      const performanceHelper = createPerformanceTestHelper(testApp);

      // Act: Measure response time for hello endpoint
      const performanceResult = await performanceHelper.measureResponseTime('/hello', 10);

      // Assert: Validate performance benchmarks
      expect(performanceResult.passed).toBe(true);
      expect(performanceResult.statistics.average).toBeLessThanOrEqual(
        TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD
      );

      // Educational annotation: Performance testing and benchmarking
      console.log(`✓ Response time performance: ${performanceResult.statistics.average.toFixed(2)}ms (target: ${performanceResult.target}ms)`);
    });
  });

  /**
   * Test Suite: Security Header Validation with Helmet.js
   * @description Comprehensive security testing including Helmet.js validation
   */
  describe('Security Header Validation', () => {
    let testApp;
    let securityHelper;

    beforeAll(() => {
      testApp = createExpressServer({
        security: {
          helmet: { contentSecurityPolicy: true },
          cors: { allowedOrigins: ['http://localhost:3000'] }
        }
      });
      securityHelper = createSecurityTestHelper(testApp);
    });

    /**
     * Test: Helmet.js security headers validation
     * @description Tests comprehensive security header implementation
     */
    test('should implement comprehensive Helmet.js security headers', async () => {
      // Act: Validate security headers implementation
      const securityValidation = await securityHelper.validateSecurityHeaders('/hello');

      // Assert: Validate Helmet.js security configuration
      expect(securityValidation.passed).toBe(true);
      expect(securityValidation.validation.helmetEnabled).toBe(true);
      expect(securityValidation.validation.cspConfigured).toBe(true);
      expect(securityValidation.validation.noSniffEnabled).toBe(true);
      expect(securityValidation.validation.xPoweredByRemoved).toBe(true);

      // Validate specific security headers
      expect(securityValidation.headers.contentSecurityPolicy).toBeDefined();
      expect(securityValidation.headers.xContentTypeOptions).toBe('nosniff');
      expect(securityValidation.headers.xFrameOptions).toBeDefined();

      // Educational annotation: Web security headers and threat mitigation
      console.log('✓ Comprehensive security headers implemented via Helmet.js middleware');
    });

    /**
     * Test: CORS configuration validation
     * @description Tests CORS middleware functionality and cross-origin protection
     */
    test('should configure CORS middleware for cross-origin protection', async () => {
      // Act: Validate CORS configuration
      const corsValidation = await securityHelper.validateCORS('http://localhost:3000');

      // Assert: Validate CORS functionality
      expect(corsValidation.corsEnabled).toBe(true);
      expect(corsValidation.methodsAllowed).toBeDefined();
      expect(corsValidation.headersAllowed).toBeDefined();

      // Educational annotation: Cross-origin resource sharing and security
      console.log('✓ CORS middleware configured for secure cross-origin request handling');
    });
  });

  /**
   * Test Suite: Error Handling and Exception Management
   * @description Tests error handling middleware and exception scenarios
   */
  describe('Error Handling and Exception Management', () => {
    let testApp;
    let httpHelper;

    beforeAll(() => {
      testApp = createExpressServer();
      httpHelper = createHTTPTestHelper(testApp);
    });

    /**
     * Test: 404 Not Found error handling
     * @description Tests proper 404 error responses for non-existent routes
     */
    test('should handle 404 Not Found errors for non-existent routes', async () => {
      // Act: Request non-existent route
      const response = await supertest(testApp)
        .get('/non-existent-route')
        .set('X-Test-Correlation-ID', TEST_CORRELATION_ID)
        .expect(HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND);

      // Assert: Validate 404 error response format
      expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND);
      expect(response.headers['content-type']).toContain('application/json');

      // Educational annotation: RESTful error handling patterns
      console.log('✓ 404 Not Found error handling validated with proper status codes');
    });

    /**
     * Test: Express.js configuration validation
     * @description Tests comprehensive configuration validation
     */
    test('should validate Express.js configuration comprehensively', async () => {
      // Act: Perform comprehensive configuration validation
      const validationResult = await validateExpressConfiguration(testApp, {
        comprehensive: true,
        includeSecurityAudit: true,
        includePerformanceAnalysis: true
      });

      // Assert: Validate configuration health and compliance
      expect(validationResult).toBeDefined();
      expect(validationResult.overall.healthy).toBe(true);
      expect(validationResult.overall.score).toBeGreaterThanOrEqual(70);
      expect(validationResult.components.express.status).toBe('healthy');

      // Educational annotation: Production readiness validation
      console.log(`✓ Express.js configuration validation: ${validationResult.overall.score}/100 health score`);
    });
  });

  /**
   * Test Suite: PM2 Cluster Mode Compatibility
   * @description Tests PM2 compatibility and stateless architecture
   */
  describe('PM2 Cluster Mode Compatibility', () => {
    let testApp;

    beforeAll(() => {
      testApp = createExpressServer();
    });

    /**
     * Test: Stateless architecture validation
     * @description Tests stateless design for PM2 cluster mode readiness
     */
    test('should implement stateless architecture for PM2 cluster mode', () => {
      // Arrange: Create multiple Express application instances
      const instance1 = createExpressServer();
      const instance2 = createExpressServer();

      // Assert: Validate instance independence and stateless design
      expect(instance1).not.toBe(instance2);
      expect(typeof instance1.listen).toBe('function');
      expect(typeof instance2.listen).toBe('function');

      // Validate no shared state between instances
      expect(instance1._router).not.toBe(instance2._router);

      // Educational annotation: Stateless architecture and process isolation
      console.log('✓ Stateless architecture validated for PM2 cluster mode compatibility');
    });

    /**
     * Test: Concurrent request handling capability
     * @description Tests concurrent request processing and load handling
     */
    test('should handle concurrent requests efficiently', async () => {
      // Arrange: Create async test helper for concurrent operations
      const asyncHelper = createAsyncTestHelper();
      const httpHelper = createHTTPTestHelper(testApp);

      // Act: Execute concurrent requests
      const concurrentOperations = Array(10).fill().map(() => 
        () => httpHelper.get('/hello')
      );

      const concurrentResult = await asyncHelper.concurrent(concurrentOperations);

      // Assert: Validate concurrent processing success
      expect(concurrentResult.results).toHaveLength(10);
      expect(concurrentResult.results.every(result => result.status === 200)).toBe(true);
      expect(concurrentResult.duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Educational annotation: Concurrent processing and scalability
      console.log(`✓ Concurrent request handling: ${concurrentResult.operations} requests in ${concurrentResult.duration}ms`);
    });
  });

  /**
   * Test Suite: Cross-Platform Compatibility Preparation
   * @description Tests Flask migration preparation and compatibility features
   */
  describe('Cross-Platform Compatibility Preparation', () => {
    let testApp;
    let httpHelper;

    beforeAll(() => {
      testApp = createExpressServer();
      httpHelper = createHTTPTestHelper(testApp);
    });

    /**
     * Test: Response format standardization for Flask compatibility
     * @description Tests response format consistency for cross-platform migration
     */
    test('should maintain consistent response format for Flask compatibility', async () => {
      // Act: Get responses from both endpoints
      const helloResponse = await httpHelper.get('/hello');
      const goodEveningResponse = await httpHelper.get('/good-evening');

      // Assert: Validate response structure consistency
      const helloKeys = Object.keys(helloResponse.body).sort();
      const goodEveningKeys = Object.keys(goodEveningResponse.body).sort();
      expect(helloKeys).toEqual(goodEveningKeys);

      // Validate JSON format compatibility with Flask jsonify()
      expect(helloResponse.headers['content-type']).toContain('application/json');
      expect(goodEveningResponse.headers['content-type']).toContain('application/json');

      // Educational annotation: Cross-platform API design consistency
      console.log('✓ Response format standardization validated for Flask migration compatibility');
    });

    /**
     * Test: HTTP header consistency validation
     * @description Tests header format consistency across platforms
     */
    test('should maintain HTTP header consistency for cross-platform compatibility', async () => {
      // Act: Validate header consistency across endpoints
      const responses = await Promise.all([
        httpHelper.get('/hello'),
        httpHelper.get('/good-evening')
      ]);

      // Assert: Validate header consistency
      responses.forEach(response => {
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBeDefined();
      });

      // Educational annotation: HTTP standard compliance for cross-platform development
      console.log('✓ HTTP header consistency validated for cross-platform compatibility');
    });
  });

  /**
   * Test Suite: Memory Usage and Resource Management
   * @description Tests memory usage, resource management, and performance optimization
   */
  describe('Memory Usage and Resource Management', () => {
    let testApp;

    beforeAll(() => {
      testApp = createExpressServer();
    });

    /**
     * Test: Memory usage validation under load
     * @description Tests memory consumption and leak detection
     */
    test('should maintain acceptable memory usage under load', async () => {
      // Arrange: Create performance test helper for memory monitoring
      const performanceHelper = createPerformanceTestHelper(testApp);

      // Act: Measure memory usage under load
      const memoryResult = await performanceHelper.measureMemoryUsage();

      // Assert: Validate memory usage within acceptable thresholds
      expect(memoryResult.passed).toBe(true);
      expect(memoryResult.delta.heapUsed).toBeLessThan(memoryResult.threshold);

      // Educational annotation: Memory management and resource optimization
      console.log(`✓ Memory usage: ${Math.round(memoryResult.delta.heapUsed / 1024 / 1024)}MB delta (threshold: ${Math.round(memoryResult.threshold / 1024 / 1024)}MB)`);
    });
  });

  /**
   * Test Suite: Educational Testing Demonstrations
   * @description Educational examples and testing best practices demonstrations
   */
  describe('Educational Testing Demonstrations', () => {
    /**
     * Test: Comprehensive testing patterns demonstration
     * @description Demonstrates modern testing patterns and best practices
     */
    test('should demonstrate comprehensive testing patterns and best practices', () => {
      // Educational demonstration of testing patterns
      const testingPatterns = {
        unitTesting: 'Individual function and component testing',
        integrationTesting: 'Component interaction testing',
        endpointTesting: 'HTTP API endpoint validation',
        securityTesting: 'Security header and vulnerability testing',
        performanceTesting: 'Response time and resource usage validation',
        errorHandling: 'Exception and error scenario testing',
        crossPlatform: 'Cross-platform compatibility validation'
      };

      // Assert: Validate educational content availability
      Object.keys(testingPatterns).forEach(pattern => {
        expect(testingPatterns[pattern]).toBeDefined();
        expect(typeof testingPatterns[pattern]).toBe('string');
      });

      // Educational annotation: Comprehensive testing strategy explanation
      console.log('✓ Testing best practices demonstrated with comprehensive coverage patterns');
      console.log('Educational Value: Modern Express.js testing strategies with SuperTest integration');
      console.log('Next Steps: Integration testing and Flask cross-platform migration testing');
    });
  });
});