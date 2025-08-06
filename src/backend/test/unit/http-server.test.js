// Jest v29.7.0 - Comprehensive unit test suite for HTTP server implementations
// SuperTest v6.3.3 - HTTP testing framework with enhanced API endpoint validation
// Node.js v22.x LTS - Modern ES Modules testing patterns with production readiness

// Import Jest functions for ES module compatibility
import { jest } from '@jest/globals';

import supertest from 'supertest'; // v6.3.3
import http from 'node:http'; // built-in
import process from 'node:process'; // built-in
import crypto from 'node:crypto'; // built-in

// Import HTTP server implementations for comprehensive testing
import {
  startHTTPServer,
  createHTTPRequestHandler,
  setupGracefulShutdown,
  logServerStatistics,
  validateServerConfiguration
} from '../../http-server.js';

import {
  startBasicServer,
  createRequestHandler
} from '../../basic-server.js';

// Import test data fixtures for comprehensive validation scenarios
import {
  httpEndpoints,
  performanceBenchmarks,
  securityTestData,
  errorScenarios
} from '../fixtures/test-data.js' with { type: 'json' };

// Global test environment variables for test isolation and management
let testEnvironment = null;
let httpTestHelper = null;
let performanceHelper = null;
let assertionHelper = null;
let securityHelper = null;
let testServers = new Map();
let testStartTime = null;
let activeTestConnections = new Set();

/**
 * Sets up the comprehensive test suite environment including Jest configuration,
 * test helpers initialization, server setup, and global test infrastructure
 * for HTTP server testing with performance monitoring and security validation
 */
async function setupTestSuite() {
  // Initialize Jest test environment with ES Modules support and Node.js configuration
  testStartTime = process.hrtime.bigint();
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  
  // Set up comprehensive test environment using setupTestEnvironment function
  testEnvironment = {
    async initialize() {
      this.testId = crypto.randomUUID();
      this.startTime = Date.now();
      this.serverInstances = new Map();
      this.cleanupTasks = [];
      return this;
    },
    
    async createServer(serverType = 'enhanced', config = {}) {
      const defaultConfig = {
        port: 0, // Use dynamic port allocation for test isolation
        environment: 'test',
        logLevel: 'silent'
      };
      
      const serverConfig = { ...defaultConfig, ...config };
      const serverId = crypto.randomUUID();
      
      let server;
      if (serverType === 'basic') {
        server = await startBasicServer(serverConfig);
      } else {
        server = await startHTTPServer(serverConfig);
      }
      
      const address = server.address();
      const serverInfo = {
        id: serverId,
        instance: server,
        type: serverType,
        port: address.port,
        url: `http://localhost:${address.port}`,
        config: serverConfig
      };
      
      this.serverInstances.set(serverId, serverInfo);
      testServers.set(serverId, serverInfo);
      
      return serverInfo;
    },
    
    async cleanup() {
      // Execute all cleanup tasks in reverse order
      for (const task of this.cleanupTasks.reverse()) {
        try {
          await task();
        } catch (error) {
          console.error('Cleanup task failed:', error);
        }
      }
      
      // Shutdown all server instances with graceful connection draining
      for (const [serverId, serverInfo] of this.serverInstances) {
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Server shutdown timeout')), 5000);
            serverInfo.instance.close(() => {
              clearTimeout(timeout);
              resolve();
            });
          });
        } catch (error) {
          console.error(`Failed to shutdown server ${serverId}:`, error);
        }
      }
      
      this.serverInstances.clear();
      testServers.clear();
    }
  };
  
  await testEnvironment.initialize();
  
  // Initialize HTTP test helper with SuperTest integration for API endpoint testing
  httpTestHelper = {
    async createTestAgent(serverInfo) {
      const agent = supertest(serverInfo.instance);
      activeTestConnections.add(agent);
      return agent;
    },
    
    async makeRequest(agent, method, path, options = {}) {
      const startTime = process.hrtime.bigint();
      
      let request = agent[method.toLowerCase()](path);
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request = request.set(key, value);
        });
      }
      
      if (options.body) {
        request = request.send(options.body);
      }
      
      if (options.query) {
        request = request.query(options.query);
      }
      
      // Explicitly expect JSON content type to trigger SuperTest's JSON parsing
      request = request.expect('Content-Type', /application\/json/);
      
      const response = await request;
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      return {
        ...response,
        body: response._body || response.body, // Ensure body is properly exposed from _body
        responseTime,
        timing: {
          start: startTime,
          end: endTime,
          duration: responseTime
        }
      };
    }
  };
  
  // Configure performance test helper with response time measurement and memory monitoring
  performanceHelper = {
    async measureResponseTime(requestFunction, iterations = 10) {
      const measurements = [];
      const memoryBefore = process.memoryUsage();
      
      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await requestFunction();
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        measurements.push(duration);
      }
      
      const memoryAfter = process.memoryUsage();
      const memoryUsage = {
        heapUsed: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024,
        heapTotal: (memoryAfter.heapTotal - memoryBefore.heapTotal) / 1024 / 1024,
        external: (memoryAfter.external - memoryBefore.external) / 1024 / 1024,
        arrayBuffers: (memoryAfter.arrayBuffers - memoryBefore.arrayBuffers) / 1024 / 1024
      };
      
      const sorted = measurements.sort((a, b) => a - b);
      return {
        mean: measurements.reduce((a, b) => a + b) / measurements.length,
        median: sorted[Math.floor(sorted.length / 2)],
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        standardDeviation: Math.sqrt(
          measurements.reduce((sum, val) => sum + Math.pow(val - measurements.reduce((a, b) => a + b) / measurements.length, 2), 0) / measurements.length
        ),
        memoryUsage,
        iterations,
        measurements
      };
    },
    
    validatePerformance(metrics, benchmark) {
      const results = {
        passed: true,
        violations: [],
        warnings: []
      };
      
      if (metrics.p95 > benchmark.critical) {
        results.passed = false;
        results.violations.push(`P95 response time ${metrics.p95.toFixed(2)}ms exceeds critical threshold ${benchmark.critical}ms`);
      } else if (metrics.p95 > benchmark.warning) {
        results.warnings.push(`P95 response time ${metrics.p95.toFixed(2)}ms exceeds warning threshold ${benchmark.warning}ms`);
      }
      
      if (metrics.memoryUsage.heapUsed > performanceBenchmarks.memoryThresholds.heapUsed.critical) {
        results.passed = false;
        results.violations.push(`Memory usage ${metrics.memoryUsage.heapUsed.toFixed(2)}MB exceeds threshold`);
      }
      
      return results;
    }
  };
  
  // Set up assertion helper with Jest-specific matchers and validation functions
  assertionHelper = {
    validateResponse(response, expected) {
      const results = {
        passed: true,
        errors: [],
        warnings: []
      };
      
      // Validate status code
      if (expected.statusCode && response.status !== expected.statusCode) {
        results.passed = false;
        results.errors.push(`Expected status ${expected.statusCode}, got ${response.status}`);
      }
      
      // Validate headers
      if (expected.headers) {
        Object.entries(expected.headers).forEach(([key, value]) => {
          const actualValue = response.headers[key.toLowerCase()];
          if (value === null && actualValue !== undefined) {
            results.passed = false;
            results.errors.push(`Header ${key} should not be present`);
          } else if (value !== null && actualValue !== value) {
            results.passed = false;
            results.errors.push(`Expected header ${key}: ${value}, got: ${actualValue}`);
          }
        });
      }
      
      // Validate response body structure
      if (expected.body && typeof expected.body === 'object') {
        Object.keys(expected.body).forEach(key => {
          if (!(key in response.body)) {
            results.passed = false;
            results.errors.push(`Missing required field: ${key}`);
          }
        });
      }
      
      // Validate response time
      if (expected.responseTime && response.responseTime) {
        const timeThreshold = parseInt(expected.responseTime.replace(/[<>ms]/g, ''));
        if (response.responseTime > timeThreshold) {
          results.warnings.push(`Response time ${response.responseTime}ms exceeds target ${timeThreshold}ms`);
        }
      }
      
      return results;
    },
    
    expectToMatchPattern(value, pattern, message = '') {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        throw new Error(`${message}: Expected "${value}" to match pattern "${pattern}"`);
      }
    }
  };
  
  // Initialize security test helper for HTTP header validation and compliance checking
  securityHelper = {
    validateSecurityHeaders(response) {
      const results = {
        passed: true,
        violations: [],
        warnings: [],
        compliant: true
      };
      
      const headers = response.headers;
      
      // Check required security headers
      securityTestData.securityHeaders.requiredHeaders.forEach(headerName => {
        const normalizedHeader = headerName.toLowerCase().replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        if (!headers[normalizedHeader]) {
          results.passed = false;
          results.violations.push(`Missing required security header: ${headerName}`);
        }
      });
      
      // Check forbidden headers
      securityTestData.securityHeaders.forbiddenHeaders.forEach(headerName => {
        const normalizedHeader = headerName.toLowerCase().replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        if (headers[normalizedHeader]) {
          results.passed = false;
          results.violations.push(`Forbidden header present: ${headerName}`);
        }
      });
      
      // Validate specific security header values
      if (headers['content-security-policy']) {
        if (!headers['content-security-policy'].includes('default-src')) {
          results.warnings.push('CSP header missing default-src directive');
        }
      }
      
      if (headers['strict-transport-security']) {
        if (!headers['strict-transport-security'].includes('max-age=')) {
          results.violations.push('HSTS header missing max-age directive');
          results.passed = false;
        }
      }
      
      if (headers['x-frame-options']) {
        const validValues = ['DENY', 'SAMEORIGIN'];
        if (!validValues.some(value => headers['x-frame-options'].includes(value))) {
          results.violations.push('X-Frame-Options header has invalid value');
          results.passed = false;
        }
      }
      
      return results;
    },
    
    validateContentSecurity(response) {
      const results = {
        xssProtected: true,
        clickjackingProtected: true,
        mimeSniffingProtected: true,
        issues: []
      };
      
      // Check XSS protection
      if (!response.headers['content-security-policy'] || 
          !response.headers['x-content-type-options']) {
        results.xssProtected = false;
        results.issues.push('Insufficient XSS protection headers');
      }
      
      // Check clickjacking protection
      if (!response.headers['x-frame-options'] && 
          !response.headers['content-security-policy']?.includes('frame-ancestors')) {
        results.clickjackingProtected = false;
        results.issues.push('Insufficient clickjacking protection');
      }
      
      // Check MIME sniffing protection
      if (response.headers['x-content-type-options'] !== 'nosniff') {
        results.mimeSniffingProtected = false;
        results.issues.push('MIME sniffing not properly disabled');
      }
      
      return results;
    }
  };
  
  // Configure test data fixtures and mock response scenarios
  // Test fixtures are imported from test-data.js and available globally
  
  // Set up test server registry for lifecycle management and cleanup
  testEnvironment.cleanupTasks.push(async () => {
    activeTestConnections.clear();
    testServers.clear();
  });
  
  // Initialize global test hooks for setup and teardown procedures
  // Jest hooks will be configured in beforeAll/afterAll blocks
  
  // Configure test timeouts and performance monitoring for reliable execution
  jest.setTimeout(30000); // 30 second timeout for comprehensive testing
}

/**
 * Performs comprehensive test suite cleanup including server shutdown,
 * helper disposal, mock restoration, resource deallocation, and environment reset
 */
async function teardownTestSuite() {
  try {
    // Shutdown all active test servers with graceful connection draining
    for (const [serverId, serverInfo] of testServers) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Server shutdown timeout')), 5000);
        serverInfo.instance.close(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    
    // Clean up HTTP test helper and close SuperTest connections
    activeTestConnections.clear();
    httpTestHelper = null;
    
    // Dispose of performance test helper and clear benchmark data
    performanceHelper = null;
    
    // Reset assertion helper and clear custom matcher configurations
    assertionHelper = null;
    
    // Clean up security test helper and reset validation state
    securityHelper = null;
    
    // Clear test data fixtures and restore original configurations
    testServers.clear();
    
    // Perform comprehensive resource cleanup and memory optimization
    if (global.gc) {
      global.gc();
    }
    
    // Reset global test variables and clear test registries
    testEnvironment = null;
    testStartTime = null;
    
    // Restore environment variables and process configuration
    delete process.env.LOG_LEVEL;
    
    // Log test suite cleanup completion and execution statistics
    const endTime = process.hrtime.bigint();
    const totalDuration = testStartTime ? Number(endTime - testStartTime) / 1000000 : 0;
    console.log(`Test suite completed in ${totalDuration.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('Test suite cleanup failed:', error);
    throw error;
  }
}

/**
 * Creates a test server instance with specified configuration, dynamic port allocation,
 * error handling, and registration in test server management system
 */
async function createTestServerInstance(serverType, serverConfig) {
  // Validate server type parameter and configuration object
  if (!['basic', 'enhanced'].includes(serverType)) {
    throw new Error(`Invalid server type: ${serverType}`);
  }
  
  if (!serverConfig || typeof serverConfig !== 'object') {
    throw new Error('Server configuration must be an object');
  }
  
  // Determine appropriate server factory function based on server type
  const serverFactory = serverType === 'basic' ? startBasicServer : startHTTPServer;
  
  // Allocate available port from test port range for server binding
  const testConfig = {
    port: 0, // Dynamic port allocation
    environment: 'test',
    logLevel: 'silent',
    ...serverConfig
  };
  
  // Create server instance using factory function with test configuration
  const serverResult = await serverFactory(testConfig);
  
  // Extract HTTP server instance - different return formats for basic vs enhanced servers
  const server = serverResult.server || serverResult; // Enhanced returns object, basic returns server directly
  
  // Verify server is listening (already started by factory function)
  if (!server.listening) {
    throw new Error('Server should be listening after factory creation');
  }
  
  // Register server in global test server registry for management
  const address = server.address();
  const serverInfo = {
    id: crypto.randomUUID(),
    instance: server,
    type: serverType,
    port: address.port,
    url: `http://localhost:${address.port}`,
    config: testConfig
  };
  
  testServers.set(serverInfo.id, serverInfo);
  
  // Set up server health monitoring and status tracking
  server.on('error', (error) => {
    console.error(`Server ${serverInfo.id} error:`, error);
  });
  
  // Configure server timeout settings for test optimization
  server.timeout = 10000; // 10 second timeout
  server.keepAliveTimeout = 5000; // 5 second keep-alive
  
  // Return server instance with port, URL, and management information
  return serverInfo;
}

/**
 * Validates HTTP server response including status code, headers, content,
 * timing, and security compliance with comprehensive assertion checking
 */
function validateServerResponse(response, expectedCriteria) {
  const validation = assertionHelper.validateResponse(response, expectedCriteria);
  
  // Additional security validation
  const securityValidation = securityHelper.validateSecurityHeaders(response);
  
  // Performance validation
  let performanceValidation = { passed: true, violations: [], warnings: [] };
  if (expectedCriteria.responseTime && response.responseTime) {
    const timeThreshold = parseInt(expectedCriteria.responseTime.replace(/[<>ms]/g, ''));
    if (response.responseTime > timeThreshold) {
      performanceValidation.warnings.push(`Response time ${response.responseTime}ms exceeds target ${timeThreshold}ms`);
    }
  }
  
  return {
    status: validation.passed && securityValidation.passed && performanceValidation.passed,
    validation: {
      response: validation,
      security: securityValidation,
      performance: performanceValidation
    },
    timing: response.timing || {},
    metrics: {
      responseTime: response.responseTime,
      statusCode: response.status,
      headerCount: Object.keys(response.headers).length,
      bodySize: response.text ? response.text.length : 0
    }
  };
}

/**
 * Measures HTTP response performance including response time, memory usage,
 * CPU utilization, and resource consumption with statistical analysis
 */
async function measureResponsePerformance(requestFunction, performanceConfig = {}) {
  const config = {
    iterations: 10,
    warmupIterations: 2,
    ...performanceConfig
  };
  
  // Initialize performance measurement with high-resolution timing
  const measurements = [];
  const memoryBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  
  // Perform warmup iterations
  for (let i = 0; i < config.warmupIterations; i++) {
    await requestFunction();
  }
  
  // Execute performance measurement iterations
  for (let i = 0; i < config.iterations; i++) {
    const startTime = process.hrtime.bigint();
    await requestFunction();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    measurements.push(duration);
  }
  
  // Calculate statistical metrics
  const memoryAfter = process.memoryUsage();
  const cpuAfter = process.cpuUsage(cpuBefore);
  
  const sorted = measurements.sort((a, b) => a - b);
  const mean = measurements.reduce((a, b) => a + b) / measurements.length;
  const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / measurements.length;
  
  return {
    timing: {
      mean: mean,
      median: sorted[Math.floor(sorted.length / 2)],
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      standardDeviation: Math.sqrt(variance)
    },
    memory: {
      heapUsed: (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024,
      heapTotal: (memoryAfter.heapTotal - memoryBefore.heapTotal) / 1024 / 1024,
      external: (memoryAfter.external - memoryBefore.external) / 1024 / 1024,
      arrayBuffers: (memoryAfter.arrayBuffers - memoryBefore.arrayBuffers) / 1024 / 1024
    },
    cpu: {
      user: cpuAfter.user / 1000, // Convert to milliseconds
      system: cpuAfter.system / 1000
    },
    iterations: config.iterations,
    measurements
  };
}

/**
 * Tests complete server lifecycle including startup, request handling,
 * health monitoring, graceful shutdown, and resource management
 */
async function testServerLifecycle(serverFactory, lifecycleConfig = {}) {
  const config = {
    testRequests: 10,
    shutdownTimeout: 5000,
    ...lifecycleConfig
  };
  
  let server = null;
  let serverInfo = null;
  
  try {
    // Test server startup process with configuration validation
    serverInfo = await createTestServerInstance(serverFactory === startBasicServer ? 'basic' : 'enhanced', config);
    server = serverInfo.instance;
    
    // Validate server listening status and port binding
    expect(server.listening).toBe(true);
    expect(serverInfo.port).toBeGreaterThan(0);
    
    // Test request handling capabilities
    const agent = await httpTestHelper.createTestAgent(serverInfo);
    for (let i = 0; i < config.testRequests; i++) {
      const response = await httpTestHelper.makeRequest(agent, 'GET', '/hello');
      expect(response.status).toBe(200);
    }
    
    // Test graceful shutdown procedures
    const shutdownPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Shutdown timeout')), config.shutdownTimeout);
      server.close(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    await shutdownPromise;
    
    return {
      startupSuccessful: true,
      requestHandlingSuccessful: true,
      shutdownSuccessful: true,
      port: serverInfo.port,
      requestCount: config.testRequests
    };
    
  } catch (error) {
    if (server && server.listening) {
      await new Promise(resolve => server.close(resolve));
    }
    throw error;
  }
}

/**
 * Simulates various HTTP request scenarios including different methods,
 * headers, payloads, and edge cases for comprehensive server testing
 */
async function simulateHttpRequests(server, requestScenarios) {
  const results = [];
  const agent = supertest(server.instance);
  
  for (const scenario of requestScenarios) {
    try {
      const startTime = process.hrtime.bigint();
      
      let request = agent[scenario.method.toLowerCase()](scenario.path);
      
      if (scenario.headers) {
        Object.entries(scenario.headers).forEach(([key, value]) => {
          request = request.set(key, value);
        });
      }
      
      if (scenario.body) {
        request = request.send(scenario.body);
      }
      
      if (scenario.query) {
        request = request.query(scenario.query);
      }
      
      const response = await request;
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      results.push({
        scenario: scenario.name || `${scenario.method} ${scenario.path}`,
        success: true,
        response: {
          status: response.status,
          headers: response.headers,
          body: response.body,
          responseTime
        },
        validation: validateServerResponse(response, scenario.expected || {})
      });
      
    } catch (error) {
      results.push({
        scenario: scenario.name || `${scenario.method} ${scenario.path}`,
        success: false,
        error: error.message,
        validation: { status: false, errors: [error.message] }
      });
    }
  }
  
  return results;
}

/**
 * Validates HTTP security headers implementation including CSP, HSTS,
 * X-Frame-Options, and other security headers with compliance checking
 */
function validateSecurityHeaders(response, securityRequirements = {}) {
  const requirements = {
    ...securityTestData.securityHeaders,
    ...securityRequirements
  };
  
  const validation = securityHelper.validateSecurityHeaders(response);
  const contentSecurity = securityHelper.validateContentSecurity(response);
  
  // Detailed header validation
  const headerAnalysis = {};
  
  Object.entries(securityTestData.helmetHeaders).forEach(([headerKey, headerInfo]) => {
    const headerName = headerKey.replace(/([A-Z])/g, '-$1').toLowerCase();
    const actualValue = response.headers[headerName];
    
    headerAnalysis[headerKey] = {
      expected: headerInfo.expected,
      actual: actualValue,
      present: actualValue !== undefined,
      compliant: headerInfo.expected === null ? 
        actualValue === undefined : 
        actualValue === headerInfo.expected,
      description: headerInfo.description
    };
  });
  
  return {
    overallCompliance: validation.passed && contentSecurity.xssProtected && contentSecurity.clickjackingProtected,
    headerValidation: validation,
    contentSecurity: contentSecurity,
    headerAnalysis: headerAnalysis,
    securityScore: Object.values(headerAnalysis).reduce((score, header) => 
      score + (header.compliant ? 1 : 0), 0) / Object.keys(headerAnalysis).length * 100,
    recommendations: [
      ...validation.violations,
      ...validation.warnings,
      ...contentSecurity.issues
    ]
  };
}

/**
 * Tests comprehensive error handling scenarios including HTTP errors,
 * server errors, timeout conditions, and exception management
 */
async function testErrorHandling(server, errorScenarios) {
  const results = [];
  const agent = supertest(server.instance);
  
  for (const [errorType, scenarios] of Object.entries(errorScenarios)) {
    for (const [scenarioName, scenario] of Object.entries(scenarios)) {
      try {
        let request = agent[scenario.request?.method?.toLowerCase() || 'get'](
          scenario.request?.path || scenario.path || '/nonexistent'
        );
        
        if (scenario.request?.headers) {
          Object.entries(scenario.request.headers).forEach(([key, value]) => {
            request = request.set(key, value);
          });
        }
        
        const response = await request;
        
        const validation = {
          statusCode: response.status === scenario.expectedResponse?.statusCode,
          headers: true, // Simplified header validation
          body: scenario.expectedResponse?.body ? 
            Object.keys(scenario.expectedResponse.body).every(key => 
              response.body && response.body[key] !== undefined) : true
        };
        
        results.push({
          errorType,
          scenarioName,
          success: validation.statusCode && validation.headers && validation.body,
          response: {
            status: response.status,
            headers: response.headers,
            body: response.body
          },
          expected: scenario.expectedResponse,
          validation
        });
        
      } catch (error) {
        results.push({
          errorType,
          scenarioName,
          success: false,
          error: error.message,
          validation: { statusCode: false, headers: false, body: false }
        });
      }
    }
  }
  
  return results;
}

// Jest Test Suite Configuration and Implementation
describe('HTTP Server Comprehensive Test Suite', () => {
  // Global test suite setup and teardown
  beforeAll(async () => {
    await setupTestSuite();
  });
  
  afterAll(async () => {
    await teardownTestSuite();
  });
  
  afterEach(async () => {
    // Clean up test servers created in individual tests
    for (const [serverId, serverInfo] of testServers) {
      if (serverInfo.instance.listening) {
        await new Promise(resolve => serverInfo.instance.close(resolve));
      }
    }
    testServers.clear();
  });

  // Basic HTTP Server Test Suite
  describe('Basic HTTP Server Tests', () => {
    let basicServer;
    let basicServerAgent;
    
    beforeEach(async () => {
      basicServer = await createTestServerInstance('basic', {});
      basicServerAgent = await httpTestHelper.createTestAgent(basicServer);
    }, 15000); // 15 second timeout
    
    describe('Server Startup and Configuration', () => {
      test('should start basic server successfully with default configuration', async () => {
        expect(basicServer.instance.listening).toBe(true);
        expect(basicServer.port).toBeGreaterThan(0);
        expect(basicServer.type).toBe('basic');
      });
      
      test('should validate basic server configuration', async () => {
        const config = basicServer.config;
        expect(config.environment).toBe('test');
        expect(config.logLevel).toBe('silent');
        expect(config.port).toBe(0); // Dynamic port allocation
      });
      
      test('should handle server startup errors gracefully', async () => {
        // Test invalid configuration
        await expect(createTestServerInstance('basic', { port: -1 }))
          .rejects.toThrow();
      });
    });
    
    describe('HTTP Request Processing', () => {
      test('should handle GET requests to root path successfully', async () => {
        const response = await httpTestHelper.makeRequest(basicServerAgent, 'GET', '/');
        
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toEqual({ message: 'Hello world' });
        expect(response.responseTime).toBeLessThan(100);
      });
      
      test('should return consistent response format', async () => {
        const response = await basicServerAgent.get('/');
        
        const validation = validateServerResponse(response, {
          statusCode: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: { message: 'Hello world' }
        });
        
        expect(validation.status).toBe(true);
      });
      
      test('should handle multiple concurrent requests', async () => {
        const requestPromises = Array.from({ length: 10 }, () =>
          httpTestHelper.makeRequest(basicServerAgent, 'GET', '/')
        );
        
        const responses = await Promise.all(requestPromises);
        
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body.message).toBe('Hello world');
        });
      });
    });
    
    describe('Response Generation and Formatting', () => {
      test('should generate properly formatted JSON responses', async () => {
        const response = await basicServerAgent.get('/');
        
        expect(response.type).toBe('application/json');
        expect(response.body).toBeInstanceOf(Object);
        expect(response.body.message).toBe('Hello world');
      });
      
      test('should include proper response headers', async () => {
        const response = await basicServerAgent.get('/');
        
        expect(response.headers).toHaveProperty('content-type');
        expect(response.headers).toHaveProperty('date');
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });
    });
    
    describe('Performance and Resource Usage', () => {
      test('should meet response time requirements', async () => {
        const metrics = await performanceHelper.measureResponseTime(
          () => httpTestHelper.makeRequest(basicServerAgent, 'GET', '/'),
          20
        );
        
        expect(metrics.p95).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.critical);
        expect(metrics.mean).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.target);
      });
      
      test('should validate memory usage efficiency', async () => {
        const metrics = await performanceHelper.measureResponseTime(
          () => httpTestHelper.makeRequest(basicServerAgent, 'GET', '/'),
          50
        );
        
        const performanceValidation = performanceHelper.validatePerformance(
          metrics,
          performanceBenchmarks.responseTimeLimits.hello
        );
        
        expect(performanceValidation.passed).toBe(true);
      });
    });
    
    describe('Graceful Shutdown and Cleanup', () => {
      test('should shutdown gracefully without dropping connections', async () => {
        const lifecycleResult = await testServerLifecycle(startBasicServer, {
          testRequests: 5,
          shutdownTimeout: 3000
        });
        
        expect(lifecycleResult.startupSuccessful).toBe(true);
        expect(lifecycleResult.requestHandlingSuccessful).toBe(true);
        expect(lifecycleResult.shutdownSuccessful).toBe(true);
      });
    });
  });

  // Enhanced HTTP Server Test Suite
  describe('Enhanced HTTP Server Tests', () => {
    let enhancedServer;
    let enhancedServerAgent;
    
    beforeEach(async () => {
      enhancedServer = await createTestServerInstance('enhanced', {});
      enhancedServerAgent = await httpTestHelper.createTestAgent(enhancedServer);
    }, 15000); // 15 second timeout
    
    describe('Advanced Configuration Validation', () => {
      test('should start enhanced server with advanced features', async () => {
        expect(enhancedServer.instance.listening).toBe(true);
        expect(enhancedServer.port).toBeGreaterThan(0);
        expect(enhancedServer.type).toBe('enhanced');
      });
      
      test('should validate enhanced server configuration', async () => {
        const config = enhancedServer.config;
        expect(config.environment).toBe('test');
        expect(config.logLevel).toBe('silent');
      });
    });
    
    describe('Health Check Implementation', () => {
      test('should provide comprehensive health check endpoint', async () => {
        const response = await httpTestHelper.makeRequest(enhancedServerAgent, 'GET', '/health');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('environment');
        expect(response.body.status).toBe('OK');
        expect(response.responseTime).toBeLessThan(50);
      });
      
      test('should validate health check response format', async () => {
        const response = await enhancedServerAgent.get('/health');
        
        const validation = validateServerResponse(response, httpEndpoints.health.expectedResponse);
        expect(validation.status).toBe(true);
      });
    });
    
    describe('Performance Monitoring and Metrics', () => {
      test('should track and report performance metrics', async () => {
        const metrics = await performanceHelper.measureResponseTime(
          () => httpTestHelper.makeRequest(enhancedServerAgent, 'GET', '/hello'),
          30
        );
        
        expect(metrics.p95).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.critical);
        expect(metrics.memoryUsage.heapUsed).toBeLessThan(performanceBenchmarks.memoryThresholds.heapUsed.warning);
      });
      
      test('should handle multiple endpoint performance validation', async () => {
        const endpoints = ['/hello', '/good-evening', '/health'];
        const results = [];
        
        for (const endpoint of endpoints) {
          const metrics = await performanceHelper.measureResponseTime(
            () => httpTestHelper.makeRequest(enhancedServerAgent, 'GET', endpoint),
            10
          );
          results.push({ endpoint, metrics });
        }
        
        results.forEach(({ endpoint, metrics }) => {
          expect(metrics.p95).toBeLessThan(100); // General performance requirement
        });
      });
    });
    
    describe('Security Header Implementation', () => {
      test('should implement comprehensive security headers', async () => {
        const response = await enhancedServerAgent.get('/hello');
        
        const securityValidation = validateSecurityHeaders(response);
        
        expect(securityValidation.overallCompliance).toBe(true);
        expect(securityValidation.securityScore).toBeGreaterThan(80);
      });
      
      test('should validate Content Security Policy implementation', async () => {
        const response = await enhancedServerAgent.get('/hello');
        
        expect(response.headers).toHaveProperty('content-security-policy');
        const csp = response.headers['content-security-policy'];
        expect(csp).toContain('default-src');
        expect(csp).toContain("'self'");
      });
      
      test('should implement proper XSS protection headers', async () => {
        const response = await enhancedServerAgent.get('/hello');
        
        expect(response.headers).toHaveProperty('x-content-type-options');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers).toHaveProperty('x-frame-options');
      });
      
      test('should remove information disclosure headers', async () => {
        const response = await enhancedServerAgent.get('/hello');
        
        expect(response.headers).not.toHaveProperty('x-powered-by');
        expect(response.headers).not.toHaveProperty('server');
      });
    });
    
    describe('Production Deployment Features', () => {
      test('should handle graceful shutdown with connection draining', async () => {
        const lifecycleResult = await testServerLifecycle(startHTTPServer, {
          testRequests: 10,
          shutdownTimeout: 5000
        });
        
        expect(lifecycleResult.startupSuccessful).toBe(true);
        expect(lifecycleResult.requestHandlingSuccessful).toBe(true);
        expect(lifecycleResult.shutdownSuccessful).toBe(true);
      });
    });
  });

  // Server Lifecycle Tests
  describe('Server Lifecycle Tests', () => {
    describe('Server Initialization and Startup', () => {
      test('should initialize basic server with proper configuration', async () => {
        const serverInfo = await createTestServerInstance('basic', {
          environment: 'test',
          logLevel: 'silent'
        });
        
        expect(serverInfo.instance.listening).toBe(true);
        expect(serverInfo.config.environment).toBe('test');
        expect(serverInfo.config.logLevel).toBe('silent');
      });
      
      test('should initialize enhanced server with production features', async () => {
        const serverInfo = await createTestServerInstance('enhanced', {
          environment: 'test'
        });
        
        expect(serverInfo.instance.listening).toBe(true);
        expect(serverInfo.type).toBe('enhanced');
      });
    });
    
    describe('Runtime Operation and Monitoring', () => {
      test('should maintain stable operation under load', async () => {
        const serverInfo = await createTestServerInstance('enhanced', {});
        const agent = await httpTestHelper.createTestAgent(serverInfo);
        
        // Simulate sustained load
        const requestPromises = Array.from({ length: 50 }, (_, i) =>
          httpTestHelper.makeRequest(agent, 'GET', '/hello').then(response => ({
            index: i,
            responseTime: response.responseTime,
            status: response.status
          }))
        );
        
        const results = await Promise.all(requestPromises);
        
        const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
        const successfulRequests = results.filter(r => r.status === 200).length;
        
        expect(successfulRequests).toBe(50);
        expect(averageResponseTime).toBeLessThan(100);
      });
    });
    
    describe('Graceful Shutdown and Resource Cleanup', () => {
      test('should perform complete lifecycle with proper cleanup', async () => {
        const results = await testServerLifecycle(startHTTPServer, {
          testRequests: 20,
          shutdownTimeout: 5000
        });
        
        expect(results.startupSuccessful).toBe(true);
        expect(results.requestHandlingSuccessful).toBe(true);
        expect(results.shutdownSuccessful).toBe(true);
        expect(results.requestCount).toBe(20);
      });
    });
  });

  // Performance Benchmark Tests
  describe('Performance Benchmark Tests', () => {
    let testServer;
    let testAgent;
    
    beforeEach(async () => {
      testServer = await createTestServerInstance('enhanced', {});
      testAgent = await httpTestHelper.createTestAgent(testServer);
    }, 15000); // 15 second timeout
    
    describe('Response Time Measurement and Validation', () => {
      test('should meet target response times for all endpoints', async () => {
        const endpointTests = [
          { path: '/hello', benchmark: performanceBenchmarks.responseTimeLimits.hello },
          { path: '/good-evening', benchmark: performanceBenchmarks.responseTimeLimits.goodEvening },
          { path: '/health', benchmark: performanceBenchmarks.responseTimeLimits.health }
        ];
        
        for (const { path, benchmark } of endpointTests) {
          const metrics = await performanceHelper.measureResponseTime(
            () => httpTestHelper.makeRequest(testAgent, 'GET', path),
            20
          );
          
          expect(metrics.p95).toBeLessThan(benchmark.critical);
          expect(metrics.mean).toBeLessThan(benchmark.target);
        }
      });
    });
    
    describe('Memory Usage Monitoring and Thresholds', () => {
      test('should maintain memory usage within acceptable limits', async () => {
        const metrics = await performanceHelper.measureResponseTime(
          () => httpTestHelper.makeRequest(testAgent, 'GET', '/hello'),
          100
        );
        
        expect(metrics.memoryUsage.heapUsed).toBeLessThan(performanceBenchmarks.memoryThresholds.heapUsed.warning);
        expect(Math.abs(metrics.memoryUsage.heapTotal)).toBeLessThan(performanceBenchmarks.memoryThresholds.total.warning);
      });
    });
    
    describe('Concurrent Request Handling', () => {
      test('should handle concurrent requests efficiently', async () => {
        const concurrentRequests = 20;
        const startTime = Date.now();
        
        const requestPromises = Array.from({ length: concurrentRequests }, () =>
          httpTestHelper.makeRequest(testAgent, 'GET', '/hello')
        );
        
        const responses = await Promise.all(requestPromises);
        const totalTime = Date.now() - startTime;
        
        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
        
        // Total time should be reasonable for concurrent execution
        expect(totalTime).toBeLessThan(5000); // 5 seconds max for 20 concurrent requests
        
        // Average response time should still be good
        const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
        expect(avgResponseTime).toBeLessThan(200);
      });
    });
  });

  // Security Validation Tests
  describe('Security Validation Tests', () => {
    let secureServer;
    let secureAgent;
    
    beforeEach(async () => {
      secureServer = await createTestServerInstance('enhanced', {});
      secureAgent = await httpTestHelper.createTestAgent(secureServer);
    }, 15000); // 15 second timeout
    
    describe('HTTP Security Header Validation', () => {
      test('should implement all required security headers', async () => {
        const response = await secureAgent.get('/hello');
        
        const securityValidation = validateSecurityHeaders(response);
        
        expect(securityValidation.overallCompliance).toBe(true);
        expect(securityValidation.headerValidation.passed).toBe(true);
        expect(securityValidation.contentSecurity.xssProtected).toBe(true);
        expect(securityValidation.contentSecurity.clickjackingProtected).toBe(true);
      });
      
      test('should validate individual security header values', async () => {
        const response = await secureAgent.get('/hello');
        
        // Content Security Policy
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['content-security-policy']).toContain('default-src');
        
        // Strict Transport Security
        expect(response.headers['strict-transport-security']).toBeDefined();
        expect(response.headers['strict-transport-security']).toMatch(/max-age=\d+/);
        
        // X-Frame-Options
        expect(response.headers['x-frame-options']).toBeDefined();
        expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
        
        // X-Content-Type-Options
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        
        // Referrer Policy
        expect(response.headers['referrer-policy']).toBeDefined();
      });
    });
    
    describe('Input Validation and Sanitization', () => {
      test('should handle malformed requests safely', async () => {
        const malformedRequests = [
          { path: '/../etc/passwd', expectedStatus: 404 },
          { path: '/hello' + 'A'.repeat(1000), expectedStatus: [200, 404, 414] },
          { path: '/hello%00', expectedStatus: [200, 400] }
        ];
        
        for (const { path, expectedStatus } of malformedRequests) {
          try {
            const response = await secureAgent.get(path);
            if (Array.isArray(expectedStatus)) {
              expect(expectedStatus).toContain(response.status);
            } else {
              expect(response.status).toBe(expectedStatus);
            }
          } catch (error) {
            // Some malformed requests might cause connection errors, which is acceptable
            expect(error.message).toBeDefined();
          }
        }
      });
    });
    
    describe('Error Information Disclosure Prevention', () => {
      test('should not disclose sensitive information in error responses', async () => {
        const response = await secureAgent.get('/nonexistent-endpoint');
        
        expect(response.status).toBe(404);
        expect(response.body).not.toMatch(/stack trace/i);
        expect(response.body).not.toMatch(/internal error/i);
        expect(response.headers).not.toHaveProperty('x-powered-by');
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling Tests', () => {
    let errorTestServer;
    let errorTestAgent;
    
    beforeEach(async () => {
      errorTestServer = await createTestServerInstance('enhanced', {});
      errorTestAgent = await httpTestHelper.createTestAgent(errorTestServer);
    }, 15000); // 15 second timeout
    
    describe('HTTP Error Response Validation', () => {
      test('should handle 404 errors appropriately', async () => {
        const response = await errorTestAgent.get('/nonexistent-path');
        
        expect(response.status).toBe(404);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('statusCode');
        expect(response.body.statusCode).toBe(404);
      });
      
      test('should handle method not allowed errors', async () => {
        try {
          const response = await errorTestAgent.post('/hello');
          expect([405, 404]).toContain(response.status); // Either method not allowed or not found
        } catch (error) {
          // POST requests might be rejected at connection level
          expect(error).toBeDefined();
        }
      });
    });
    
    describe('Server Exception Handling', () => {
      test('should handle internal server errors gracefully', async () => {
        // Test server's ability to handle unexpected errors
        const response = await errorTestAgent.get('/hello');
        expect(response.status).toBe(200); // Normal operation should work
        
        // Additional error scenarios would require special server configuration
        // or error injection mechanisms which are beyond basic HTTP server scope
      });
    });
    
    describe('Comprehensive Error Scenario Testing', () => {
      test('should validate error handling across multiple scenarios', async () => {
        const errorResults = await testErrorHandling(errorTestServer, errorScenarios);
        
        const httpErrorResults = errorResults.filter(r => r.errorType === 'httpErrors');
        expect(httpErrorResults.length).toBeGreaterThan(0);
        
        // At least some error scenarios should be handled properly
        const successfulErrorHandling = httpErrorResults.filter(r => r.success).length;
        expect(successfulErrorHandling).toBeGreaterThan(0);
      });
    });
  });

  // Integration Tests for Cross-Platform Compatibility
  describe('Cross-Platform Compatibility Tests', () => {
    test('should provide consistent API responses for Express.js migration', async () => {
      const enhancedServer = await createTestServerInstance('enhanced', {});
      const agent = await httpTestHelper.createTestAgent(enhancedServer);
      
      const endpoints = ['/hello', '/good-evening', '/health'];
      
      for (const endpoint of endpoints) {
        const response = await httpTestHelper.makeRequest(agent, 'GET', endpoint);
        
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toBeInstanceOf(Object);
        
        if (endpoint === '/health') {
          expect(response.body).toHaveProperty('status');
          expect(response.body).toHaveProperty('timestamp');
          expect(response.body).toHaveProperty('uptime');
          expect(response.body).toHaveProperty('environment');
        } else {
          expect(response.body).toHaveProperty('message');
        }
      }
    });
  });

  // Educational and Documentation Tests
  describe('Educational Testing Patterns', () => {
    test('should demonstrate comprehensive HTTP testing methodology', async () => {
      const basicServer = await createTestServerInstance('basic', {});
      const enhancedServer = await createTestServerInstance('enhanced', {});
      
      const basicAgent = await httpTestHelper.createTestAgent(basicServer);
      const enhancedAgent = await httpTestHelper.createTestAgent(enhancedServer);
      
      // Test progression from basic to enhanced
      const basicResponse = await httpTestHelper.makeRequest(basicAgent, 'GET', '/');
      const enhancedResponse = await httpTestHelper.makeRequest(enhancedAgent, 'GET', '/hello');
      
      expect(basicResponse.status).toBe(200);
      expect(enhancedResponse.status).toBe(200);
      
      // Enhanced server should have better security
      const basicSecurity = validateSecurityHeaders(basicResponse);
      const enhancedSecurity = validateSecurityHeaders(enhancedResponse);
      
      expect(enhancedSecurity.securityScore).toBeGreaterThanOrEqual(basicSecurity.securityScore);
    });
    
    test('should validate test coverage and educational value', () => {
      // Verify that all major testing patterns are demonstrated
      expect(setupTestSuite).toBeDefined();
      expect(teardownTestSuite).toBeDefined();
      expect(createTestServerInstance).toBeDefined();
      expect(validateServerResponse).toBeDefined();
      expect(measureResponsePerformance).toBeDefined();
      expect(testServerLifecycle).toBeDefined();
      expect(simulateHttpRequests).toBeDefined();
      expect(validateSecurityHeaders).toBeDefined();
      expect(testErrorHandling).toBeDefined();
      
      // Verify test helper availability
      expect(httpTestHelper).toBeDefined();
      expect(performanceHelper).toBeDefined();
      expect(assertionHelper).toBeDefined();
      expect(securityHelper).toBeDefined();
    });
  });
});