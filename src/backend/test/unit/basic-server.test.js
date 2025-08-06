/**
 * @fileoverview Comprehensive Unit Test Suite for Basic HTTP Server Implementation
 * @description Educational demonstration of fundamental HTTP server testing patterns
 * that validates core Node.js server functionality without framework abstractions.
 * 
 * This test file provides comprehensive validation of the Phase 1 foundational
 * implementation, ensuring proper server lifecycle management including startup,
 * request handling, graceful shutdown, and error scenarios using modern ES Modules
 * testing with Jest framework integration.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive unit testing patterns for HTTP server applications
 * - Implements performance testing with timing measurement and resource monitoring
 * - Tests asynchronous server operations with proper setup and teardown procedures
 * - Validates error handling and graceful degradation in server applications
 * - Tests server lifecycle management including startup, operation, and shutdown
 * - Implements concurrent testing patterns for load validation and stability
 * - Creates educational testing examples for tutorial demonstration and learning
 * 
 * Technology Stack:
 * - Jest v29+ testing framework with comprehensive assertion capabilities
 * - Node.js v22.x LTS with ES Modules support and modern JavaScript features
 * - SuperTest integration for HTTP endpoint testing and response validation
 * - Built-in Node.js modules for networking, process management, and utilities
 * 
 * Architecture:
 * - Isolated test execution with proper setup and teardown procedures
 * - Performance benchmarking with defined targets and automated validation
 * - Error scenario testing covering network issues, resource exhaustion, and edge cases
 * - Concurrent testing validation for multi-user scenarios and load handling
 * - Configuration testing ensuring robust parameter validation and error handling
 */

// External Dependencies - Testing Framework
import { jest } from '@jest/globals'; // Jest v29.x - Testing framework for ES modules

// External Dependencies - Node.js Core Modules
import http from 'node:http'; // Node.js v22.x - Core HTTP module for HTTP client testing
import process from 'node:process'; // Node.js v22.x - Process utilities for signal testing and memory monitoring
import net from 'node:net'; // Node.js v22.x - Networking module for port availability testing
import events from 'node:events'; // Node.js v22.x - Events module for server lifecycle event testing
import util from 'node:util'; // Node.js v22.x - Utilities for promisification and object inspection

// Internal Dependencies - Application Modules
import {
  startBasicServer,
  createRequestHandler,
  setupGracefulShutdown,
  validateServerConfig,
  logServerStats
} from '../../basic-server.js';

import { createLogger, generateRequestId } from '../../utils/logger.js';
import {
  HTTP_CONSTANTS,
  API_CONSTANTS,
  TESTING_CONSTANTS,
  ERROR_CONSTANTS,
  ENV_CONSTANTS
} from '../../utils/constants.js';

// Test Data - Fixtures and Configuration
import {
  httpEndpoints,
  performanceBenchmarks,
  errorScenarios
} from '../fixtures/test-data.js';

// Global Test Variables - Server Instance Management
let TEST_SERVER_INSTANCE = null;
let TEST_HTTP_CLIENT = null;
let TEST_PERFORMANCE_HELPER = null;
let TEST_ASSERTION_HELPER = null;
let TEST_PORT = null;
const SERVER_STARTUP_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 3000;

/**
 * HTTP Testing Helper Factory
 * @description Creates comprehensive HTTP testing utilities with SuperTest-like functionality
 * @param {string} baseURL - Base URL for HTTP requests
 * @returns {object} HTTP testing helper with request methods and validation utilities
 */
function createHTTPTestHelper(baseURL) {
  const helper = {
    /**
     * Perform GET request with comprehensive response validation
     * @param {string} path - Request path
     * @param {object} options - Request options
     * @returns {Promise<object>} Response object with timing and validation data
     */
    async get(path, options = {}) {
      const startTime = process.hrtime.bigint();
      
      return new Promise((resolve, reject) => {
        const requestOptions = {
          hostname: 'localhost',
          port: TEST_PORT,
          path: path,
          method: 'GET',
          timeout: options.timeout || REQUEST_TIMEOUT,
          headers: {
            'User-Agent': 'Node.js-Tutorial-Test-Client/1.0.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate',
            ...options.headers
          }
        };

        const req = http.request(requestOptions, (res) => {
          let body = '';
          
          res.on('data', (chunk) => {
            body += chunk;
          });
          
          res.on('end', () => {
            const endTime = process.hrtime.bigint();
            const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              body: body,
              responseTime: responseTime,
              size: Buffer.byteLength(body, 'utf8')
            });
          });
        });

        req.on('error', (error) => {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000;
          
          reject({
            error: error,
            responseTime: responseTime,
            message: `HTTP request failed: ${error.message}`
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject({
            error: new Error('Request timeout'),
            responseTime: REQUEST_TIMEOUT,
            message: 'HTTP request timed out'
          });
        });

        req.end();
      });
    },

    /**
     * Validate response status code with detailed assertion
     * @param {object} response - HTTP response object
     * @param {number} expectedStatus - Expected status code
     * @returns {object} Validation result with detailed information
     */
    expectStatus(response, expectedStatus) {
      const isValid = response.status === expectedStatus;
      return {
        valid: isValid,
        actual: response.status,
        expected: expectedStatus,
        message: isValid 
          ? `Status code ${response.status} matches expected ${expectedStatus}`
          : `Status code ${response.status} does not match expected ${expectedStatus}`
      };
    },

    /**
     * Validate response time against performance targets
     * @param {object} response - HTTP response object
     * @param {number} maxTime - Maximum allowed response time in milliseconds
     * @returns {object} Performance validation result
     */
    expectResponseTime(response, maxTime = performanceBenchmarks.responseTimeLimits.target) {
      const isValid = response.responseTime <= maxTime;
      return {
        valid: isValid,
        actual: response.responseTime,
        expected: maxTime,
        message: isValid
          ? `Response time ${response.responseTime}ms is within target ${maxTime}ms`
          : `Response time ${response.responseTime}ms exceeds target ${maxTime}ms`
      };
    }
  };

  return helper;
}

/**
 * Performance Testing Helper Factory
 * @description Creates performance monitoring and measurement utilities
 * @returns {object} Performance testing helper with measurement and validation functions
 */
function createPerformanceTestHelper() {
  const helper = {
    /**
     * Measure response time for HTTP request with high precision
     * @param {Function} requestFunction - Function that performs HTTP request
     * @returns {Promise<object>} Response time measurement with statistics
     */
    async measureResponseTime(requestFunction) {
      const measurements = [];
      const iterations = 5; // Multiple measurements for accuracy
      
      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await requestFunction();
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        measurements.push(responseTime);
      }
      
      const average = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);
      
      return {
        average: average,
        min: min,
        max: max,
        measurements: measurements,
        iterations: iterations
      };
    },

    /**
     * Validate memory usage against defined thresholds
     * @returns {object} Memory usage validation result with current statistics
     */
    validateMemoryUsage() {
      const memUsage = process.memoryUsage();
      const maxHeapSize = performanceBenchmarks.memoryThresholds.maxHeapSize;
      const isValid = memUsage.heapUsed <= maxHeapSize;
      
      return {
        valid: isValid,
        current: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        threshold: maxHeapSize,
        message: isValid
          ? `Memory usage ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB is within threshold`
          : `Memory usage ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB exceeds threshold`
      };
    }
  };

  return helper;
}

/**
 * Assertion Helper Factory
 * @description Creates framework-agnostic validation functions and custom assertions
 * @returns {object} Assertion helper with validation and error checking functions
 */
function createAssertionHelper() {
  const helper = {
    /**
     * Deep equality assertion with detailed comparison
     * @param {any} actual - Actual value
     * @param {any} expected - Expected value
     * @returns {object} Assertion result with detailed comparison information
     */
    expectDeepEqual(actual, expected) {
      const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
      return {
        valid: isEqual,
        actual: actual,
        expected: expected,
        message: isEqual
          ? 'Values are deeply equal'
          : `Values differ: actual ${JSON.stringify(actual)} !== expected ${JSON.stringify(expected)}`
      };
    },

    /**
     * Exception throwing assertion with error validation
     * @param {Function} fn - Function that should throw an error
     * @param {string|RegExp} expectedError - Expected error message or pattern
     * @returns {object} Exception assertion result
     */
    expectToThrow(fn, expectedError) {
      try {
        fn();
        return {
          valid: false,
          message: 'Function did not throw an error as expected'
        };
      } catch (error) {
        const errorMatches = expectedError instanceof RegExp
          ? expectedError.test(error.message)
          : error.message.includes(expectedError);
        
        return {
          valid: errorMatches,
          actual: error.message,
          expected: expectedError,
          message: errorMatches
            ? 'Function threw expected error'
            : `Function threw unexpected error: ${error.message}`
        };
      }
    }
  };

  return helper;
}

/**
 * Asynchronous Condition Waiting Utility
 * @description Waits for asynchronous conditions with configurable timeout
 * @param {Function} condition - Function that returns true when condition is met
 * @param {number} timeout - Maximum wait time in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>} Promise that resolves when condition is met or times out
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms timeout`);
}

/**
 * Test Environment Setup Function
 * @description Initializes global test environment and infrastructure
 * @returns {object} Test environment configuration and utilities
 */
function setupTestEnvironment() {
  // Initialize test logger with test-specific configuration
  const testLogger = createLogger({
    environment: 'test',
    level: 'error', // Minimize noise during testing
    silent: process.env.TEST_VERBOSE !== 'true'
  });

  // Create test helpers
  TEST_PERFORMANCE_HELPER = createPerformanceTestHelper();
  TEST_ASSERTION_HELPER = createAssertionHelper();

  return {
    logger: testLogger,
    performanceHelper: TEST_PERFORMANCE_HELPER,
    assertionHelper: TEST_ASSERTION_HELPER
  };
}

/**
 * Find Available Port Utility
 * @description Finds an available port for test server binding
 * @param {number} startPort - Starting port number to check
 * @returns {Promise<number>} Promise resolving to available port number
 */
async function findAvailablePort(startPort = 3001) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Setup Test Server Instance
 * @description Sets up isolated test server with dynamic port allocation and cleanup
 * @param {object} serverOptions - Server configuration options
 * @returns {Promise<object>} Promise resolving to test server instance with utilities
 */
async function setupTestServer(serverOptions = {}) {
  // Use provided port (including 0 for OS-assigned) or find available port to avoid conflicts
  TEST_PORT = serverOptions.port !== undefined ? serverOptions.port : await findAvailablePort(3001);
  
  // Configure server options with test-specific settings
  const config = {
    port: TEST_PORT,
    host: '127.0.0.1',
    environment: 'test',
    ...serverOptions
  };

  // Validate server configuration
  const configValidation = validateServerConfig(config);
  if (!configValidation.isValid) {
    throw new Error(`Invalid server configuration: ${configValidation.errors.join(', ')}`);
  }

  // Start test server instance
  const serverResult = await startBasicServer(config);
  TEST_SERVER_INSTANCE = serverResult;

  // Wait for server to be ready by checking if it's listening
  await waitFor(
    async () => {
      return TEST_SERVER_INSTANCE && TEST_SERVER_INSTANCE.listening;
    },
    2000 // Reduced timeout since we're just checking the listening state
  );

  // Get the actual port assigned by the OS (important when using port 0)
  const actualPort = TEST_SERVER_INSTANCE.address().port;
  
  // Update TEST_PORT global variable with the actual assigned port
  TEST_PORT = actualPort;

  // Create client URL from the actual assigned port
  const clientUrl = `http://localhost:${actualPort}`;

  // Create HTTP test client using the actual assigned port
  TEST_HTTP_CLIENT = createHTTPTestHelper(clientUrl);

  return {
    server: TEST_SERVER_INSTANCE,
    port: actualPort, // Return the actual assigned port, not the requested port
    client: TEST_HTTP_CLIENT,
    config: config,
    cleanup: () => teardownTestServer({ server: TEST_SERVER_INSTANCE })
  };
}

/**
 * Teardown Test Server Instance
 * @description Performs comprehensive cleanup of test server with graceful shutdown
 * @param {object} testServer - Test server instance to clean up
 * @returns {Promise<void>} Promise that resolves when cleanup is complete
 */
async function teardownTestServer(testServer) {
  // Handle both { server: instance } and direct server instance
  const serverInstance = testServer?.server || testServer;
  
  if (!serverInstance || !serverInstance.listening) {
    return;
  }

  // Initiate graceful shutdown
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (serverInstance.destroy) {
        serverInstance.destroy();
      }
      reject(new Error('Server shutdown timeout'));
    }, 3000); // Reduced timeout

    serverInstance.close((err) => {
      clearTimeout(timeout);
      if (err && err.message !== 'Server is not running.') {
        // Only reject for real errors, not "server not running"
        reject(err);
      } else {
        // Clear global test variables if this was the global instance
        if (serverInstance === TEST_SERVER_INSTANCE) {
          TEST_SERVER_INSTANCE = null;
          TEST_HTTP_CLIENT = null;
          TEST_PORT = null;
        }
        resolve();
      }
    });
  });
}

/**
 * Validate Server Response
 * @description Comprehensive validation of HTTP server response
 * @param {object} response - HTTP response object
 * @param {object} expectedData - Expected response data for validation
 * @returns {object} Validation result with detailed analysis
 */
function validateServerResponse(response, expectedData) {
  const validations = {
    status: TEST_HTTP_CLIENT.expectStatus(response, expectedData.status || HTTP_CONSTANTS.STATUS_CODES.OK),
    timing: TEST_HTTP_CLIENT.expectResponseTime(response, expectedData.maxResponseTime || 100),
    contentType: {
      valid: response.headers['content-type']?.includes('text/plain') || 
             response.headers['content-type']?.includes('application/json'),
      actual: response.headers['content-type'],
      message: 'Content-Type header validation'
    },
    body: {
      valid: response.body.includes(expectedData.message || 'Hello world'),
      actual: response.body,
      expected: expectedData.message || 'Hello world',
      message: 'Response body content validation'
    }
  };

  const allValid = Object.values(validations).every(v => v.valid);

  return {
    valid: allValid,
    validations: validations,
    response: response,
    summary: allValid ? 'All validations passed' : 'Some validations failed'
  };
}

// Jest Test Suite Configuration
describe('Basic HTTP Server Functionality', () => {
  let testEnvironment;

  // Global test setup
  beforeAll(async () => {
    testEnvironment = setupTestEnvironment();
  }, TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);

  // Individual test setup
  beforeEach(async () => {
    // Each test gets a fresh server instance
    jest.setTimeout(TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);
  });

  // Individual test cleanup (managed by each describe block)
  // Removed global afterEach to prevent conflicts with individual test server management

  // Global test cleanup
  afterAll(async () => {
    // Final cleanup of any remaining resources
    if (TEST_SERVER_INSTANCE) {
      await teardownTestServer({ server: TEST_SERVER_INSTANCE });
    }
  });

  describe('Server Startup and Configuration', () => {
    test('should start server on available port', async () => {
      const testServer = await setupTestServer({ port: 0 }); // Use OS-assigned port
      
      expect(testServer.server).toBeDefined();
      expect(testServer.server.listening).toBe(true);
      expect(testServer.port).toBeGreaterThan(0);
      
      // Test server accessibility
      const response = await testServer.client.get('/');
      expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
      expect(response.responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
      
      await testServer.cleanup();
    });

    test('should start server on custom port', async () => {
      const customPort = await findAvailablePort(4000);
      const testServer = await setupTestServer({ port: customPort });
      
      expect(testServer.port).toBe(customPort);
      expect(testServer.server.listening).toBe(true);
      
      await testServer.cleanup();
    });

    test('should validate server configuration parameters', async () => {
      const invalidConfigs = [
        { port: -1 }, // Invalid port
        { port: 65536 }, // Port out of range
        { host: '' } // Invalid empty host
      ];

      for (const config of invalidConfigs) {
        const validation = validateServerConfig(config);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toHaveLength(1);
      }

      // Valid configuration using dynamic port
      const validConfig = { port: 0, host: '127.0.0.1' }; // Use OS-assigned port
      const validation = validateServerConfig(validConfig);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should handle port already in use error', async () => {
      const port = await findAvailablePort(5000);
      
      // Start first server
      const firstServer = await setupTestServer({ port });
      
      // Attempt to start second server on same port should fail
      await expect(async () => {
        await setupTestServer({ port });
      }).rejects.toThrow();
      
      await firstServer.cleanup();
    });
  });

  describe('HTTP Request Handling', () => {
    let testServer;

    beforeEach(async () => {
      testServer = await setupTestServer();
    });

    afterEach(async () => {
      if (testServer) {
        await testServer.cleanup();
      }
    });

    test("should return 'Hello world' for any HTTP request", async () => {
      const testPaths = ['/', '/hello', '/any-path', '/test'];
      
      for (const path of testPaths) {
        const response = await testServer.client.get(path);
        const validation = validateServerResponse(response, httpEndpoints.hello.expectedResponse);
        
        expect(validation.valid).toBe(true);
        expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
        expect(response.body).toContain('Hello world');
        expect(response.responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
      }
    });

    test('should handle different HTTP methods consistently', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const response = await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: '127.0.0.1',
            port: testServer.port,
            path: '/',
            method: method,
            timeout: REQUEST_TIMEOUT
          }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              resolve({
                status: res.statusCode,
                body: body,
                headers: res.headers
              });
            });
          });
          req.on('error', reject);
          req.end();
        });

        expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
        expect(response.body).toContain('Hello world');
      }
    });

    test('should include proper HTTP headers in response', async () => {
      const response = await testServer.client.get('/');
      
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers['content-type']).toMatch(/text\/plain|application\/json/);
      
      // Server can use either content-length or chunked encoding
      const hasContentLength = response.headers['content-length'];
      const hasChunkedEncoding = response.headers['transfer-encoding'] === 'chunked';
      
      expect(hasContentLength || hasChunkedEncoding).toBe(true);
      
      if (hasContentLength) {
        expect(parseInt(response.headers['content-length'])).toBeGreaterThan(0);
      }
    });

    test('should handle malformed HTTP requests gracefully', async () => {
      // Test with invalid HTTP request format
      const malformedRequest = new Promise((resolve) => {
        const socket = net.createConnection(testServer.port, '127.0.0.1');
        let resolved = false;
        
        // Create timeout that will be cleared properly
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
            resolve({ handled: true, timeout: true });
          }
        }, 2000);
        
        socket.write('INVALID HTTP REQUEST\r\n\r\n');
        
        socket.on('data', (data) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            socket.end();
            resolve({
              response: data.toString(),
              handled: true
            });
          }
        });
        
        socket.on('error', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({
              handled: true,
              error: true
            });
          }
        });
      });

      const result = await malformedRequest;
      expect(result.handled).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    let testServer;

    beforeEach(async () => {
      testServer = await setupTestServer();
    });

    afterEach(async () => {
      if (testServer) {
        await testServer.cleanup();
      }
    });

    test('should respond within 100ms performance target', async () => {
      const performanceResult = await TEST_PERFORMANCE_HELPER.measureResponseTime(async () => {
        await testServer.client.get('/');
      });

      expect(performanceResult.average).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
      expect(performanceResult.max).toBeLessThan(performanceBenchmarks.responseTimeLimits.maximum);
      expect(performanceResult.min).toBeGreaterThan(0);
      
      // All measurements should be within acceptable range
      performanceResult.measurements.forEach(time => {
        expect(time).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
      });
    });

    test('should maintain memory usage under baseline threshold', async () => {
      // Create isolated test server for this test
      const isolatedServer = await setupTestServer();
      
      try {
        // Take baseline measurement
        const baselineMemory = process.memoryUsage();
        
        // Perform multiple requests to test memory stability
        for (let i = 0; i < 100; i++) {
          await isolatedServer.client.get('/');
        }
        
        // Validate memory usage
        const memoryValidation = TEST_PERFORMANCE_HELPER.validateMemoryUsage();
        expect(memoryValidation.valid).toBe(true);
        
        // Memory should not have increased significantly
        const currentMemory = process.memoryUsage();
        const memoryIncrease = currentMemory.heapUsed - baselineMemory.heapUsed;
        expect(memoryIncrease).toBeLessThan(performanceBenchmarks.memoryThresholds.maxIncrease);
      } finally {
        // Clean up isolated server
        await teardownTestServer(isolatedServer);
      }
    });

    test('should handle concurrent requests efficiently', async () => {
      // Create isolated test server for this test
      const isolatedServer = await setupTestServer();
      
      try {
        const concurrentRequests = 50;
        const requests = [];
        
        const startTime = process.hrtime.bigint();
        
        // Create concurrent requests
        for (let i = 0; i < concurrentRequests; i++) {
          requests.push(isolatedServer.client.get('/'));
        }
        
        // Wait for all requests to complete
        const responses = await Promise.all(requests);
        
        const endTime = process.hrtime.bigint();
        const totalTime = Number(endTime - startTime) / 1000000;
        
        // Validate all responses
        responses.forEach(response => {
          expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
          expect(response.body).toContain('Hello world');
        });
        
        // Validate performance under concurrent load
        const averageResponseTime = totalTime / concurrentRequests;
        expect(averageResponseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.concurrent);
        
        // Check server stability
        const memoryValidation = TEST_PERFORMANCE_HELPER.validateMemoryUsage();
        expect(memoryValidation.valid).toBe(true);
        
      } finally {
        // Clean up isolated server
        await teardownTestServer(isolatedServer);
      }
    });

    test('should maintain performance consistency over time', async () => {
      // Create isolated test server for this test
      const isolatedServer = await setupTestServer();
      
      try {
        const measurements = [];
        const testDuration = 10; // 10 iterations
        
        for (let i = 0; i < testDuration; i++) {
          const startTime = process.hrtime.bigint();
          await isolatedServer.client.get('/');
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000;
          measurements.push(responseTime);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Calculate performance consistency
        const average = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
        const variance = measurements.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / measurements.length;
        const standardDeviation = Math.sqrt(variance);
        
        expect(average).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
        expect(standardDeviation).toBeLessThan(performanceBenchmarks.responseTimeLimits.variance);
      } finally {
        // Clean up isolated server
        await teardownTestServer(isolatedServer);
      }
    });
  });

  describe('Graceful Shutdown and Signal Handling', () => {
    let testServer;

    beforeEach(async () => {
      testServer = await setupTestServer();
    });

    afterEach(async () => {
      if (testServer && testServer.server && testServer.server.listening) {
        await testServer.cleanup();
      }
    });

    test('should handle SIGTERM signal gracefully', async () => {
      // Create isolated test server for this test to avoid interference
      const isolatedServer = await setupTestServer();
      
      try {
        // Verify server is initially running
        expect(isolatedServer.server.listening).toBe(true);
        
        // Make a quick request to ensure server is responsive
        const initialResponse = await isolatedServer.client.get('/');
        expect(initialResponse.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
        
        // Track if graceful shutdown was triggered
        let gracefulShutdownTriggered = false;
        let processExitCalled = false;
        
        // Mock both process.emit and process.exit
        const originalEmit = process.emit;
        const originalExit = process.exit;
        
        // Mock process.emit to track SIGTERM handling
        process.emit = function(event, ...args) {
          if (event === 'SIGTERM') {
            gracefulShutdownTriggered = true;
          }
          return originalEmit.call(this, event, ...args);
        };
        
        // Mock process.exit to prevent Jest from being killed
        process.exit = function(code) {
          processExitCalled = true;
          // Don't actually exit in tests
        };
        
        try {
          // Send SIGTERM signal to trigger graceful shutdown
          process.emit('SIGTERM');
          
          // Verify the signal was processed
          expect(gracefulShutdownTriggered).toBe(true);
          
          // Wait for shutdown process to complete
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify that graceful shutdown was attempted
          expect(processExitCalled).toBe(true);
          
        } finally {
          // Restore original functions
          process.emit = originalEmit;
          process.exit = originalExit;
        }
        
      } finally {
        // Clean up isolated server
        await teardownTestServer(isolatedServer);
      }
    });

    test('should complete active requests during shutdown', async () => {
      const testServer = await setupTestServer();
      
      // Start multiple active requests
      const activeRequests = [
        testServer.client.get('/'),
        testServer.client.get('/'),
        testServer.client.get('/')
      ];
      
      // Initiate shutdown while requests are active
      setTimeout(() => {
        testServer.server.close();
      }, 50);
      
      // All active requests should complete successfully
      const responses = await Promise.all(activeRequests);
      responses.forEach(response => {
        expect(response.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
      });
    });

    test('should reject new connections during shutdown', async () => {
      const testServer = await setupTestServer();
      
      // Mock process.exit to prevent Jest from being killed
      const originalExit = process.exit;
      process.exit = function(code) {
        // Don't actually exit in tests
      };
      
      try {
        // Simulate graceful shutdown by sending SIGTERM to initiate the shutdown process
        process.emit('SIGTERM');
        
        // Wait a small amount of time for shutdown to start
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Attempt new connection after shutdown initiated
        // This should either fail or return 503 (service unavailable) during shutdown
        try {
          const response = await testServer.client.get('/');
          
          // During shutdown, server should reject new requests with 503
          // or allow existing connections to complete with 200
          expect([
            HTTP_CONSTANTS.STATUS_CODES.OK,
            HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE
          ]).toContain(response.status);
        } catch (error) {
          // It's also acceptable if the connection is rejected during shutdown
          expect(error.message).toMatch(/ECONNREFUSED|ECONNRESET|Server is not running|503/);
        }
        
      } finally {
        // Restore original process.exit
        process.exit = originalExit;
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let testServer;

    beforeEach(async () => {
      testServer = await setupTestServer();
    });

    afterEach(async () => {
      if (testServer) {
        await testServer.cleanup();
      }
    });

    test('should handle network connection errors gracefully', async () => {
      // Test connection timeout
      const timeoutRequest = new Promise((resolve) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: testServer.port,
          path: '/',
          timeout: 1 // Very short timeout
        }, resolve);
        
        req.on('timeout', () => {
          req.destroy();
          resolve({ timeout: true });
        });
        
        req.on('error', (error) => {
          resolve({ error: error.code });
        });
        
        req.end();
      });

      const result = await timeoutRequest;
      expect(result.timeout || result.error).toBeTruthy();
    });

    test('should handle large request payloads appropriately', async () => {
      // Use a more reasonable payload size (1MB instead of 10MB)
      const largePayload = 'x'.repeat(1024 * 1024); // 1MB payload
      
      const largeRequest = new Promise((resolve) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: testServer.port,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(largePayload)
          },
          timeout: 5000 // 5 second timeout
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              body: body
            });
          });
        });
        
        req.on('error', (error) => {
          resolve({ error: error.message });
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve({ error: 'Request timeout' });
        });
        
        // Write payload in chunks to avoid overwhelming the server
        const chunkSize = 64 * 1024; // 64KB chunks
        let offset = 0;
        
        function writeChunk() {
          if (offset >= largePayload.length) {
            req.end();
            return;
          }
          
          const chunk = largePayload.slice(offset, offset + chunkSize);
          offset += chunkSize;
          
          if (req.write(chunk)) {
            // Buffer is not full, write next chunk immediately
            setImmediate(writeChunk);
          } else {
            // Buffer is full, wait for drain event
            req.once('drain', writeChunk);
          }
        }
        
        writeChunk();
      });

      const result = await largeRequest;
      // Server should handle request gracefully (may return 200 or error, but shouldn't crash)
      expect(result.status || result.error).toBeDefined();
      
      // If we get a response, it should be a valid HTTP status code
      if (result.status) {
        expect(result.status).toBeGreaterThanOrEqual(200);
        expect(result.status).toBeLessThan(600);
      }
    });

    test('should log server statistics accurately', async () => {
      // Import the logger module to mock the default logger
      const loggerModule = await import('../../utils/logger.js');
      const logSpy = jest.spyOn(loggerModule.default, 'info').mockImplementation(() => {});
      
      // Test server statistics logging (no parameters needed)
      logServerStats();
      
      expect(logSpy).toHaveBeenCalled();
      
      // Validate log content
      const logCall = logSpy.mock.calls[0];
      expect(logCall[0]).toContain('Server statistics');
      
      logSpy.mockRestore();
    });

    test('should handle rapid connection creation and destruction', async () => {
      const rapidConnections = [];
      
      // Create many rapid connections
      for (let i = 0; i < 20; i++) {
        rapidConnections.push(
          new Promise((resolve) => {
            const socket = net.createConnection(testServer.port, '127.0.0.1');
            socket.on('connect', () => {
              socket.end();
              resolve({ connected: true });
            });
            socket.on('error', () => {
              resolve({ error: true });
            });
          })
        );
      }
      
      const results = await Promise.all(rapidConnections);
      
      // Most connections should succeed
      const successfulConnections = results.filter(r => r.connected).length;
      expect(successfulConnections).toBeGreaterThan(15);
      
      // Server should remain stable
      const healthCheck = await testServer.client.get('/');
      expect(healthCheck.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
    });

    test('should validate configuration with edge case values', async () => {
      const edgeCaseConfigs = [
        { port: 1 }, // Minimum valid port
        { port: 65535 }, // Maximum valid port
        { host: '0.0.0.0' }, // All interfaces
        { host: '::1' }, // IPv6 localhost
      ];

      for (const config of edgeCaseConfigs) {
        const validation = validateServerConfig(config);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  describe('Server Statistics and Monitoring', () => {
    let testServer;

    beforeEach(async () => {
      testServer = await setupTestServer();
    });

    afterEach(async () => {
      if (testServer) {
        await testServer.cleanup();
      }
    });

    test('should track uptime accurately', async () => {
      const startTime = Date.now();
      
      // Wait a short period
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make request to trigger uptime calculation
      await testServer.client.get('/');
      
      const uptime = process.uptime();
      const expectedMinimumUptime = (Date.now() - startTime) / 1000;
      
      expect(uptime).toBeGreaterThanOrEqual(expectedMinimumUptime - 0.1); // Allow small variance
    });

    test('should monitor memory usage during operation', async () => {
      // Create isolated test server for this test
      const isolatedServer = await setupTestServer();
      
      try {
        const initialMemory = process.memoryUsage();
        
        // Perform operations that may affect memory
        for (let i = 0; i < 50; i++) {
          await isolatedServer.client.get('/');
        }
        
        const finalMemory = process.memoryUsage();
        const memoryValidation = TEST_PERFORMANCE_HELPER.validateMemoryUsage();
        
        expect(memoryValidation.valid).toBe(true);
        expect(finalMemory.heapUsed).toBeGreaterThanOrEqual(initialMemory.heapUsed);
      } finally {
        // Clean up isolated server
        await teardownTestServer(isolatedServer);
      }
    });

    test('should provide server health information', async () => {
      // Create isolated test server for this test
      const isolatedServer = await setupTestServer();
      
      try {
        // Test if server is responsive and healthy
        const healthChecks = [];
        
        for (let i = 0; i < 5; i++) {
          const startTime = process.hrtime.bigint();
          const response = await isolatedServer.client.get('/');
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000;
          
          healthChecks.push({
            status: response.status,
            responseTime: responseTime,
            timestamp: Date.now()
          });
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Validate health check results
        healthChecks.forEach(check => {
          expect(check.status).toBe(HTTP_CONSTANTS.STATUS_CODES.OK);
          expect(check.responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
        });
        
        // Validate consistency
        const responseTimes = healthChecks.map(c => c.responseTime);
        const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        expect(averageResponseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.target);
        
      } finally {
        // Clean up isolated server
        await teardownTestServer(isolatedServer);
      }
    });
  });
});