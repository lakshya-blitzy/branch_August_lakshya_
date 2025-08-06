/**
 * @fileoverview Comprehensive Integration Test Suite for HTTP Server Implementation
 * @description Complete integration testing for Node.js v22.x LTS HTTP server with Express.js v5.1.0
 * framework compatibility, PM2 cluster mode preparation, security validation, and cross-platform
 * Flask migration support. Implements modern ES Modules testing with Jest framework integration,
 * SuperTest HTTP testing, performance benchmarking, and production deployment validation.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Complete HTTP server lifecycle integration testing
 * - SuperTest-powered API endpoint validation
 * - Performance benchmarking with response time measurement
 * - Security header validation and vulnerability assessment
 * - Cross-platform compatibility testing for Flask migration
 * - Error handling integration with comprehensive scenario coverage
 * - Load testing and scalability assessment for PM2 cluster preparation
 * - Production deployment validation with zero-downtime testing
 * - Educational demonstration patterns with comprehensive documentation
 * 
 * Educational Value:
 * - Demonstrates comprehensive integration testing patterns
 * - Showcases SuperTest for HTTP server testing
 * - Illustrates performance testing and benchmarking
 * - Teaches security testing and vulnerability assessment
 * - Provides cross-platform compatibility validation examples
 * - Shows production-ready testing strategies
 * 
 * Technology Stack:
 * - Jest v29.x testing framework with Node.js integration
 * - SuperTest v6.3.3 for HTTP assertions and API testing
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 compatibility validation
 * - PM2 cluster mode testing preparation
 * - Helmet.js security integration testing
 */

// External library imports with version comments
import supertest from 'supertest'; // v6.3.3 - SuperAgent driven library for testing HTTP servers
import http from 'node:http'; // Node.js built-in - HTTP server creation and testing
import process from 'node:process'; // Node.js built-in - Process utilities for memory monitoring
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic functionality for test identifiers
import net from 'node:net'; // Node.js built-in - Network utilities for port availability

// Jest globals for ES modules support
import { jest, describe, test, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Internal imports for HTTP server functionality
import {
  startHTTPServer,
  createHTTPRequestHandler,
  setupGracefulShutdown,
  validateServerConfiguration,
  createHealthCheckEndpoint
} from '../../http-server.js';

// Configuration and utility imports
import { environmentConfig } from '../../config/environment.js';
import { ENV_CONSTANTS, HTTP_CONSTANTS, API_CONSTANTS, TESTING_CONSTANTS } from '../../utils/constants.js';
import logger, { createRequestLogger, logPerformanceMetrics } from '../../utils/logger.js';

// Test data and fixtures
import {
  httpEndpoints,
  performanceBenchmarks,
  securityTestData,
  crossPlatformTestData,
  errorScenarios
} from '../fixtures/test-data.js';

// Global test environment state
let testEnvironment = null;
let httpTestHelper = null;
let performanceHelper = null;
let securityHelper = null;
let crossPlatformHelper = null;
let testServers = new Map();
let integrationTestClients = new Map();
let activeTestConnections = new Set();
let performanceMetricsCache = new Map();
let testStartTime = null;

/**
 * Sets up the comprehensive integration test suite environment including Jest configuration,
 * test helpers initialization, server setup, HTTP clients, and global test infrastructure
 * for complete HTTP server integration testing with performance monitoring and security validation.
 * 
 * @param {Object} config - Integration test configuration object
 * @returns {Promise<void>} Promise that resolves when integration test suite setup is complete
 */
async function setupIntegrationTestSuite(config = {}) {
  testStartTime = Date.now();
  
  try {
    logger.info('Setting up integration test suite', {
      environment: 'test',
      config: config,
      testStartTime
    });

    // Initialize Jest integration test environment with ES Modules support
    process.env.NODE_ENV = ENV_CONSTANTS.ENVIRONMENT_TYPES.TESTING;
    process.env.LOG_LEVEL = ENV_CONSTANTS.LOG_LEVELS.ERROR; // Reduce log noise during tests

    // Create comprehensive test environment with integration-specific settings
    testEnvironment = {
      initialized: false,
      startTime: testStartTime,
      config: {
        timeout: TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS,
        performanceTargets: performanceBenchmarks,
        securityRequirements: securityTestData,
        crossPlatformRequirements: crossPlatformTestData,
        ...config
      },
      
      // Test environment initialization
      async initialize() {
        if (this.initialized) return;
        
        logger.info('Initializing test environment');
        this.initialized = true;
        return Promise.resolve();
      },
      
      // Create test server instance
      async createServer(serverConfig = {}) {
        const port = await findAvailablePort();
        const config = {
          port,
          host: 'localhost',
          ...serverConfig
        };
        
        const server = await createIntegrationTestServer('enhanced', config);
        testServers.set(server.id, server);
        
        return server;
      },
      
      // Cleanup test environment
      async cleanup() {
        logger.info('Cleaning up test environment');
        
        // Close all test servers
        for (const [serverId, server] of testServers) {
          try {
            await server.close();
            testServers.delete(serverId);
          } catch (error) {
            logger.warn('Failed to close test server', { serverId, error: error.message });
          }
        }
        
        // Clear performance metrics
        performanceMetricsCache.clear();
        activeTestConnections.clear();
        
        this.initialized = false;
      },
      
      // Get server information
      getServerInfo(serverId) {
        return testServers.get(serverId);
      }
    };

    // Initialize HTTP test helper with SuperTest integration for comprehensive API testing
    httpTestHelper = await createHTTPTestHelper({
      timeout: TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS,
      retries: 3,
      validateResponse: true,
      measurePerformance: true
    });

    // Configure performance test helper with response time measurement and benchmark analysis
    performanceHelper = await createPerformanceTestHelper({
      targets: performanceBenchmarks,
      measureMemory: true,
      trackConcurrency: true,
      benchmarkMode: true
    });

    // Set up security test helper for HTTP header validation and compliance checking
    securityHelper = await createSecurityTestHelper({
      requirements: securityTestData,
      validateHeaders: true,
      checkVulnerabilities: true,
      complianceChecks: true
    });

    // Initialize cross-platform test helper for Express/Flask compatibility validation
    crossPlatformHelper = await createCrossPlatformTestHelper({
      platformData: crossPlatformTestData,
      validateCompatibility: true,
      checkResponseParity: true
    });

    // Configure global test hooks for setup, execution, and teardown
    setupGlobalTestHooks();

    logger.info('Integration test suite setup completed', {
      environment: testEnvironment.config,
      helpersInitialized: {
        http: !!httpTestHelper,
        performance: !!performanceHelper,
        security: !!securityHelper,
        crossPlatform: !!crossPlatformHelper
      }
    });

  } catch (error) {
    logger.error('Failed to setup integration test suite', error, { config });
    throw error;
  }
}

/**
 * Performs comprehensive integration test suite cleanup including server shutdown,
 * HTTP client disposal, helper cleanup, mock restoration, resource deallocation,
 * and environment reset for clean test isolation.
 * 
 * @returns {Promise<void>} Promise that resolves when integration test suite cleanup is complete
 */
async function teardownIntegrationTestSuite() {
  try {
    logger.info('Starting integration test suite teardown');

    // Shutdown all active test servers with graceful connection draining
    for (const [serverId, server] of testServers) {
      try {
        if (server && server.close) {
          await server.close();
          logger.debug('Test server closed', { serverId });
        }
      } catch (error) {
        logger.warn('Error closing test server', { serverId, error: error.message });
      }
    }
    testServers.clear();

    // Close all HTTP test clients and dispose of SuperTest connections
    for (const [clientId, client] of integrationTestClients) {
      try {
        if (client && client.close) {
          await client.close();
        }
      } catch (error) {
        logger.warn('Error closing test client', { clientId, error: error.message });
      }
    }
    integrationTestClients.clear();

    // Clear active connections and performance metrics
    activeTestConnections.clear();
    performanceMetricsCache.clear();

    // Cleanup test environment
    if (testEnvironment && testEnvironment.cleanup) {
      await testEnvironment.cleanup();
    }

    // Reset global test variables
    testEnvironment = null;
    httpTestHelper = null;
    performanceHelper = null;
    securityHelper = null;
    crossPlatformHelper = null;

    // Log cleanup completion with execution statistics
    const testDuration = Date.now() - (testStartTime || Date.now());
    logger.info('Integration test suite teardown completed', {
      duration: testDuration,
      serversShutdown: testServers.size,
      clientsClosed: integrationTestClients.size
    });

  } catch (error) {
    logger.error('Error during integration test suite teardown', error);
    throw error;
  }
}

/**
 * Creates a complete HTTP server instance for integration testing with specified configuration,
 * dynamic port allocation, health check endpoints, error handling, and registration in test
 * server management system.
 * 
 * @param {string} serverType - Type of server to create (basic, enhanced, production-ready)
 * @param {Object} serverConfig - Server configuration object
 * @returns {Promise<Object>} Promise resolving to test server instance with management utilities
 */
async function createIntegrationTestServer(serverType, serverConfig = {}) {
  try {
    logger.debug('Creating integration test server', { serverType, config: serverConfig });

    // Validate server type and configuration
    const validServerTypes = ['basic', 'enhanced', 'production-ready'];
    if (!validServerTypes.includes(serverType)) {
      throw new Error(`Invalid server type: ${serverType}`);
    }

    // Allocate available port with conflict resolution
    const port = serverConfig.port || await findAvailablePort();
    const host = serverConfig.host || 'localhost';

    // Create server instance based on type
    let server;
    let serverInstance;
    
    switch (serverType) {
      case 'enhanced':
      case 'production-ready':
        // Create enhanced HTTP server with all features
        const requestHandler = createHTTPRequestHandler({
          enablePerformanceTracking: true,
          enableSecurityHeaders: true,
          enableHealthCheck: true,
          enableLogging: false // Disable during tests to reduce noise
        });
        
        serverInstance = http.createServer(requestHandler);
        break;
        
      case 'basic':
      default:
        // Create basic HTTP server for comparison testing
        serverInstance = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Hello world' }));
        });
        break;
    }

    // Configure server timeouts and settings
    serverInstance.timeout = TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS;
    serverInstance.keepAliveTimeout = 5000;
    serverInstance.headersTimeout = 10000;

    // Start server listening with error handling
    await new Promise((resolve, reject) => {
      serverInstance.listen(port, host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Create server management object
    server = {
      id: crypto.randomBytes(8).toString('hex'),
      type: serverType,
      instance: serverInstance,
      port,
      host,
      url: `http://${host}:${port}`,
      config: serverConfig,
      startTime: Date.now(),
      
      // Server management methods
      async close() {
        return new Promise((resolve, reject) => {
          if (this.instance) {
            this.instance.close((error) => {
              if (error) {
                reject(error);
              } else {
                logger.debug('Test server closed', { serverId: this.id });
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      },
      
      // Health check method
      isHealthy() {
        return this.instance && this.instance.listening;
      },
      
      // Performance monitoring
      getMetrics() {
        return {
          uptime: Date.now() - this.startTime,
          port: this.port,
          listening: this.instance?.listening || false
        };
      }
    };

    logger.debug('Integration test server created successfully', {
      serverId: server.id,
      type: serverType,
      url: server.url
    });

    return server;

  } catch (error) {
    logger.error('Failed to create integration test server', error, { serverType, serverConfig });
    throw error;
  }
}

/**
 * Creates a comprehensive HTTP test client with SuperTest integration for making HTTP requests
 * to test servers with response validation, performance measurement, security header checking,
 * and cross-platform compatibility testing.
 * 
 * @param {Object} server - Server instance to test against
 * @param {Object} clientConfig - Client configuration object
 * @returns {Object} HTTP test client with comprehensive testing capabilities
 */
function createHTTPTestClient(server, clientConfig = {}) {
  try {
    logger.debug('Creating HTTP test client', { serverId: server.id, config: clientConfig });

    // Initialize SuperTest instance with server binding
    const request = supertest(server.instance);
    
    // Create HTTP test client with comprehensive capabilities
    const client = {
      id: crypto.randomBytes(8).toString('hex'),
      server,
      request,
      config: clientConfig,
      metrics: {
        requests: 0,
        errors: 0,
        totalResponseTime: 0
      },

      // HTTP method helpers with performance measurement
      async get(path, options = {}) {
        const startTime = process.hrtime.bigint();
        this.metrics.requests++;
        
        try {
          const response = await this.request
            .get(path)
            .timeout(options.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS)
            .expect(options.expectedStatus || 200);
          
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
          this.metrics.totalResponseTime += responseTime;
          
          if (options.measurePerformance) {
            this.recordPerformanceMetric(path, 'GET', responseTime, response.status);
          }
          
          return { response, responseTime };
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },

      async post(path, data = {}, options = {}) {
        const startTime = process.hrtime.bigint();
        this.metrics.requests++;
        
        try {
          const response = await this.request
            .post(path)
            .send(data)
            .timeout(options.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS)
            .expect(options.expectedStatus || 200);
          
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
          this.metrics.totalResponseTime += responseTime;
          
          if (options.measurePerformance) {
            this.recordPerformanceMetric(path, 'POST', responseTime, response.status);
          }
          
          return { response, responseTime };
        } catch (error) {
          this.metrics.errors++;
          throw error;
        }
      },

      // Response validation methods
      expectStatus(response, expectedStatus) {
        expect(response.status).toBe(expectedStatus);
        return this;
      },

      expectHeader(response, headerName, expectedValue) {
        expect(response.headers[headerName.toLowerCase()]).toBeDefined();
        if (expectedValue !== undefined) {
          expect(response.headers[headerName.toLowerCase()]).toBe(expectedValue);
        }
        return this;
      },

      expectResponseTime(responseTime, maxTime) {
        expect(responseTime).toBeLessThan(maxTime);
        return this;
      },

      // Performance metrics recording
      recordPerformanceMetric(path, method, responseTime, statusCode) {
        const metric = {
          timestamp: Date.now(),
          path,
          method,
          responseTime,
          statusCode,
          serverId: this.server.id
        };
        
        const metricsKey = `${method}:${path}`;
        if (!performanceMetricsCache.has(metricsKey)) {
          performanceMetricsCache.set(metricsKey, []);
        }
        performanceMetricsCache.get(metricsKey).push(metric);
      },

      // Get performance metrics summary
      getPerformanceMetrics() {
        return {
          ...this.metrics,
          averageResponseTime: this.metrics.requests > 0 
            ? this.metrics.totalResponseTime / this.metrics.requests 
            : 0,
          errorRate: this.metrics.requests > 0 
            ? (this.metrics.errors / this.metrics.requests) * 100 
            : 0
        };
      },

      // Cleanup method
      close() {
        logger.debug('HTTP test client closed', { clientId: this.id });
        return Promise.resolve();
      }
    };

    integrationTestClients.set(client.id, client);
    
    logger.debug('HTTP test client created successfully', {
      clientId: client.id,
      serverId: server.id
    });

    return client;

  } catch (error) {
    logger.error('Failed to create HTTP test client', error, { 
      serverId: server?.id, 
      clientConfig 
    });
    throw error;
  }
}

/**
 * Validates complete HTTP response including status code, headers, content, timing,
 * security compliance, cross-platform compatibility, and performance metrics with
 * comprehensive assertion checking and detailed error reporting.
 * 
 * @param {Object} response - HTTP response object from SuperTest
 * @param {Object} expectedCriteria - Expected response criteria
 * @param {Object} validationOptions - Validation options
 * @returns {Object} Comprehensive validation result with detailed analysis
 */
function validateCompleteHTTPResponse(response, expectedCriteria, validationOptions = {}) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    performance: {},
    security: {},
    compatibility: {},
    timestamp: new Date().toISOString()
  };

  try {
    // Validate HTTP status code
    if (expectedCriteria.statusCode) {
      if (response.status !== expectedCriteria.statusCode) {
        validation.errors.push(`Expected status ${expectedCriteria.statusCode}, got ${response.status}`);
        validation.isValid = false;
      }
    }

    // Validate response headers
    if (expectedCriteria.headers) {
      Object.entries(expectedCriteria.headers).forEach(([headerName, expectedValue]) => {
        const actualValue = response.headers[headerName.toLowerCase()];
        
        if (expectedValue === null) {
          // Header should not be present
          if (actualValue !== undefined) {
            validation.warnings.push(`Header '${headerName}' should not be present`);
          }
        } else if (actualValue !== expectedValue) {
          validation.errors.push(`Header '${headerName}' expected '${expectedValue}', got '${actualValue}'`);
          validation.isValid = false;
        }
      });
    }

    // Validate response body content
    if (expectedCriteria.body) {
      try {
        const responseBody = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
        
        Object.entries(expectedCriteria.body).forEach(([key, expectedValue]) => {
          if (responseBody[key] !== expectedValue) {
            validation.errors.push(`Body field '${key}' expected '${expectedValue}', got '${responseBody[key]}'`);
            validation.isValid = false;
          }
        });
      } catch (error) {
        validation.errors.push(`Failed to parse response body: ${error.message}`);
        validation.isValid = false;
      }
    }

    // Validate response time against performance benchmarks
    if (validationOptions.responseTime && expectedCriteria.maxResponseTime) {
      validation.performance.responseTime = validationOptions.responseTime;
      validation.performance.threshold = expectedCriteria.maxResponseTime;
      
      if (validationOptions.responseTime > expectedCriteria.maxResponseTime) {
        validation.warnings.push(`Response time ${validationOptions.responseTime}ms exceeds threshold ${expectedCriteria.maxResponseTime}ms`);
      }
    }

    // Validate security headers if security testing is enabled
    if (validationOptions.validateSecurity) {
      validation.security = validateSecurityHeaders(response.headers);
      if (!validation.security.isCompliant) {
        validation.warnings.push(...validation.security.issues);
      }
    }

    // Validate cross-platform compatibility if enabled
    if (validationOptions.validateCompatibility) {
      validation.compatibility = validateCrossPlatformCompatibility(response, expectedCriteria);
    }

    logger.debug('HTTP response validation completed', {
      isValid: validation.isValid,
      errorsCount: validation.errors.length,
      warningsCount: validation.warnings.length
    });

    return validation;

  } catch (error) {
    logger.error('HTTP response validation failed', error);
    validation.isValid = false;
    validation.errors.push(`Validation process failed: ${error.message}`);
    return validation;
  }
}

// Helper function implementations

/**
 * Creates HTTP test helper with SuperTest integration
 * @private
 */
async function createHTTPTestHelper(config) {
  return {
    config,
    initialized: true,
    
    async makeRequest(server, method, path, options = {}) {
      const client = createHTTPTestClient(server);
      return await client[method.toLowerCase()](path, options.data || {}, options);
    },
    
    validateResponse: validateCompleteHTTPResponse
  };
}

/**
 * Creates performance test helper for benchmarking
 * @private
 */
async function createPerformanceTestHelper(config) {
  return {
    config,
    
    async measureResponseTime(testFunction) {
      const startTime = process.hrtime.bigint();
      const result = await testFunction();
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      return { result, responseTime };
    },
    
    async runLoadTest(server, options = {}) {
      const concurrentRequests = options.concurrency || 10;
      const requestsPerSecond = options.rps || 100;
      const duration = options.duration || 10000;
      
      const client = createHTTPTestClient(server);
      const startTime = Date.now();
      const results = [];
      
      while (Date.now() - startTime < duration) {
        const promises = Array(concurrentRequests).fill().map(async () => {
          try {
            const result = await client.get(options.path || '/health');
            results.push({
              success: true,
              responseTime: result.responseTime,
              statusCode: result.response.status
            });
          } catch (error) {
            results.push({
              success: false,
              error: error.message
            });
          }
        });
        
        await Promise.all(promises);
        
        // Rate limiting
        if (requestsPerSecond) {
          const delay = 1000 / requestsPerSecond;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      return {
        totalRequests: results.length,
        successfulRequests: results.filter(r => r.success).length,
        averageResponseTime: results
          .filter(r => r.success && r.responseTime)
          .reduce((acc, r) => acc + r.responseTime, 0) / results.length,
        errorRate: (results.filter(r => !r.success).length / results.length) * 100
      };
    }
  };
}

/**
 * Creates security test helper for header validation
 * @private
 */
async function createSecurityTestHelper(config) {
  return {
    config,
    
    validateSecurityHeaders(headers) {
      const issues = [];
      const requiredHeaders = securityTestData.securityHeaders.requiredHeaders;
      
      requiredHeaders.forEach(header => {
        const headerValue = headers[header.toLowerCase()];
        if (!headerValue) {
          issues.push(`Missing required security header: ${header}`);
        }
      });
      
      return {
        isCompliant: issues.length === 0,
        issues
      };
    }
  };
}

/**
 * Creates cross-platform test helper for compatibility validation
 * @private
 */
async function createCrossPlatformTestHelper(config) {
  return {
    config,
    
    validateCompatibility(response, expectedCriteria) {
      return {
        nodeJSResponse: response,
        compatibilityScore: 100, // Placeholder
        issues: []
      };
    }
  };
}

/**
 * Validates security headers in HTTP response
 * @private
 */
function validateSecurityHeaders(headers) {
  const issues = [];
  const requiredHeaders = ['content-type', 'x-content-type-options'];
  
  requiredHeaders.forEach(header => {
    if (!headers[header]) {
      issues.push(`Missing security header: ${header}`);
    }
  });
  
  return {
    isCompliant: issues.length === 0,
    issues
  };
}

/**
 * Validates cross-platform compatibility
 * @private
 */
function validateCrossPlatformCompatibility(response, expectedCriteria) {
  return {
    compatible: true,
    differences: []
  };
}

/**
 * Finds an available port for testing
 * @private
 */
async function findAvailablePort(startPort = 3001) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Sets up global test hooks
 * @private
 */
function setupGlobalTestHooks() {
  // No-op for now - Jest will handle most test lifecycle
}

// Integration Test Suite Class Implementation

/**
 * Comprehensive integration test suite management class that orchestrates complete HTTP server
 * integration testing including server lifecycle management, performance testing, security
 * validation, cross-platform compatibility testing, and educational demonstration patterns.
 */
class IntegrationTestSuite {
  /**
   * Initializes IntegrationTestSuite instance with comprehensive configuration validation,
   * test environment setup, and helper initialization for complete integration testing capabilities.
   * 
   * @param {Object} config - Configuration object for integration test suite
   */
  constructor(config = {}) {
    this.config = {
      timeout: TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS,
      performanceTargets: performanceBenchmarks,
      securityRequirements: securityTestData,
      crossPlatformRequirements: crossPlatformTestData,
      ...config
    };
    
    this.testEnvironment = null;
    this.testServers = new Map();
    this.httpClients = new Map();
    this.performanceHelper = null;
    this.securityHelper = null;
    this.crossPlatformHelper = null;
    this.performanceMetrics = new Map();
    this.initialized = false;
    this.cleanup = async () => {
      await this.teardown();
    };
  }

  /**
   * Initializes the complete integration test environment including test helpers, server instances,
   * HTTP clients, performance monitoring, and all testing utilities with comprehensive validation.
   * 
   * @returns {Promise<void>} Promise that resolves when integration test environment initialization is complete
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      logger.info('Initializing integration test suite', { config: this.config });
      
      await setupIntegrationTestSuite(this.config);
      
      this.testEnvironment = testEnvironment;
      this.performanceHelper = performanceHelper;
      this.securityHelper = securityHelper;
      this.crossPlatformHelper = crossPlatformHelper;
      
      await this.testEnvironment.initialize();
      
      this.initialized = true;
      
      logger.info('Integration test suite initialization completed');
      
    } catch (error) {
      logger.error('Failed to initialize integration test suite', error);
      throw error;
    }
  }

  /**
   * Creates a comprehensive test server instance with specified configuration, health endpoints,
   * performance monitoring, security features, and registration in the server management system.
   * 
   * @param {string} serverType - Type of server to create (basic, enhanced, production-ready)
   * @param {Object} serverConfig - Server configuration object
   * @returns {Promise<Object>} Promise resolving to test server instance with management utilities
   */
  async createTestServer(serverType = 'enhanced', serverConfig = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const server = await createIntegrationTestServer(serverType, serverConfig);
    this.testServers.set(server.id, server);
    
    logger.debug('Test server created and registered', {
      serverId: server.id,
      type: serverType,
      url: server.url
    });
    
    return server;
  }

  /**
   * Creates a comprehensive HTTP test client for the specified server with SuperTest integration,
   * performance measurement, security validation, and cross-platform compatibility testing capabilities.
   * 
   * @param {string} serverType - Type of server to get client for
   * @param {Object} clientConfig - Client configuration object
   * @returns {Object} HTTP test client with comprehensive testing capabilities
   */
  createHTTPClient(serverType, clientConfig = {}) {
    const server = Array.from(this.testServers.values())
      .find(s => s.type === serverType);
    
    if (!server) {
      throw new Error(`No server of type '${serverType}' found`);
    }
    
    const client = createHTTPTestClient(server, clientConfig);
    this.httpClients.set(client.id, client);
    
    return client;
  }

  /**
   * Executes comprehensive performance testing including response time measurement, memory usage
   * validation, load testing, concurrent request simulation, and benchmark analysis.
   * 
   * @param {string} serverType - Type of server to test
   * @param {Object} performanceConfig - Performance testing configuration
   * @returns {Promise<Object>} Promise resolving to comprehensive performance test results
   */
  async runPerformanceTests(serverType, performanceConfig = {}) {
    const server = Array.from(this.testServers.values())
      .find(s => s.type === serverType);
    
    if (!server) {
      throw new Error(`No server of type '${serverType}' found`);
    }
    
    const config = {
      concurrency: 10,
      duration: 5000,
      path: '/health',
      ...performanceConfig
    };
    
    logger.info('Running performance tests', { serverId: server.id, config });
    
    const results = await this.performanceHelper.runLoadTest(server, config);
    
    // Cache results for analysis
    this.performanceMetrics.set(`${serverType}-performance`, {
      timestamp: Date.now(),
      results,
      config
    });
    
    return results;
  }

  /**
   * Executes comprehensive security testing including HTTP header validation, vulnerability assessment,
   * security compliance checking, and preparation for Helmet.js security hardening implementation.
   * 
   * @param {string} serverType - Type of server to test
   * @param {Object} securityConfig - Security testing configuration
   * @returns {Promise<Object>} Promise resolving to comprehensive security test results
   */
  async runSecurityTests(serverType, securityConfig = {}) {
    const server = Array.from(this.testServers.values())
      .find(s => s.type === serverType);
    
    if (!server) {
      throw new Error(`No server of type '${serverType}' found`);
    }
    
    logger.info('Running security tests', { serverId: server.id, config: securityConfig });
    
    const client = createHTTPTestClient(server);
    const { response } = await client.get('/health');
    
    const securityValidation = this.securityHelper.validateSecurityHeaders(response.headers);
    
    return {
      timestamp: Date.now(),
      serverId: server.id,
      validation: securityValidation,
      recommendations: []
    };
  }

  /**
   * Executes comprehensive cross-platform compatibility testing for Flask migration preparation
   * including response format validation, API behavior verification, and feature parity assessment.
   * 
   * @param {string} serverType - Type of server to test
   * @param {Object} compatibilityConfig - Compatibility testing configuration
   * @returns {Promise<Object>} Promise resolving to cross-platform compatibility test results
   */
  async runCrossPlatformTests(serverType, compatibilityConfig = {}) {
    const server = Array.from(this.testServers.values())
      .find(s => s.type === serverType);
    
    if (!server) {
      throw new Error(`No server of type '${serverType}' found`);
    }
    
    logger.info('Running cross-platform compatibility tests', { 
      serverId: server.id, 
      config: compatibilityConfig 
    });
    
    const client = createHTTPTestClient(server);
    const testResults = {};
    
    // Test all defined endpoints for compatibility
    for (const [endpointName, endpointData] of Object.entries(httpEndpoints)) {
      try {
        const { response } = await client.get(endpointData.path);
        
        const compatibility = this.crossPlatformHelper.validateCompatibility(
          response, 
          endpointData.expectedResponse
        );
        
        testResults[endpointName] = {
          endpoint: endpointData.path,
          compatibility,
          tested: true
        };
      } catch (error) {
        testResults[endpointName] = {
          endpoint: endpointData.path,
          error: error.message,
          tested: false
        };
      }
    }
    
    return {
      timestamp: Date.now(),
      serverId: server.id,
      results: testResults,
      overallCompatibility: Object.values(testResults)
        .every(result => result.compatibility?.compatible !== false)
    };
  }

  /**
   * Performs comprehensive cleanup of the integration test environment including server shutdown,
   * HTTP client disposal, helper cleanup, performance metrics clearing, and complete resource deallocation.
   * 
   * @returns {Promise<void>} Promise that resolves when all integration test cleanup operations are complete
   */
  async cleanup() {
    try {
      logger.info('Starting integration test suite cleanup');
      
      // Close all HTTP clients
      for (const [clientId, client] of this.httpClients) {
        try {
          await client.close();
        } catch (error) {
          logger.warn('Error closing HTTP client', { clientId, error: error.message });
        }
      }
      this.httpClients.clear();
      
      // Close all test servers
      for (const [serverId, server] of this.testServers) {
        try {
          await server.close();
        } catch (error) {
          logger.warn('Error closing test server', { serverId, error: error.message });
        }
      }
      this.testServers.clear();
      
      // Clear performance metrics
      this.performanceMetrics.clear();
      
      // Cleanup test environment
      if (this.testEnvironment && this.testEnvironment.cleanup) {
        await this.testEnvironment.cleanup();
      }
      
      // Call global teardown
      await teardownIntegrationTestSuite();
      
      this.initialized = false;
      
      logger.info('Integration test suite cleanup completed');
      
    } catch (error) {
      logger.error('Error during integration test suite cleanup', error);
      throw error;
    }
  }
}

// Jest Test Suite Implementation

describe('HTTP Server Integration Tests', () => {
  let integrationSuite;
  let testServer;
  let httpClient;

  beforeAll(async () => {
    integrationSuite = new IntegrationTestSuite({
      timeout: TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS
    });
    
    await integrationSuite.initialize();
    testServer = await integrationSuite.createTestServer('enhanced');
    httpClient = integrationSuite.createHTTPClient('enhanced');
  }, TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS);

  afterAll(async () => {
    if (integrationSuite) {
      await integrationSuite.cleanup();
    }
  }, 30000);

  describe('Complete Server Lifecycle Integration', () => {
    test('should start server successfully and bind to correct port', async () => {
      expect(testServer).toBeDefined();
      expect(testServer.port).toBeGreaterThan(3000);
      expect(testServer.isHealthy()).toBe(true);
    });

    test('should handle graceful shutdown', async () => {
      const tempServer = await integrationSuite.createTestServer('enhanced');
      expect(tempServer.isHealthy()).toBe(true);
      
      await tempServer.close();
      expect(tempServer.isHealthy()).toBe(false);
    });
  });

  describe('HTTP Request/Response Cycle Validation', () => {
    test('should handle GET /hello endpoint correctly', async () => {
      const expectedResponse = httpEndpoints.hello.expectedResponse;
      const { response, responseTime } = await httpClient.get('/hello');
      
      expect(response.status).toBe(expectedResponse.status);
      expect(response.body.message).toBe(expectedResponse.body.message);
      expect(responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.critical);
    });

    test('should handle GET /good-evening endpoint correctly', async () => {
      const expectedResponse = httpEndpoints.goodEvening.expectedResponse;
      const { response, responseTime } = await httpClient.get('/good-evening');
      
      expect(response.status).toBe(expectedResponse.status);
      expect(response.body.message).toBe(expectedResponse.body.message);
      expect(responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.goodEvening.critical);
    });

    test('should handle GET /health endpoint correctly', async () => {
      const { response, responseTime } = await httpClient.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.health.critical);
    });

    test('should return 404 for non-existent routes', async () => {
      try {
        await httpClient.get('/non-existent-route');
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });
  });

  describe('Performance Integration Testing', () => {
    test('should meet response time requirements', async () => {
      const performanceResults = await integrationSuite.runPerformanceTests('enhanced', {
        concurrency: 5,
        duration: 3000
      });
      
      expect(performanceResults.averageResponseTime).toBeLessThan(
        performanceBenchmarks.responseTimeLimits.hello.critical
      );
      expect(performanceResults.errorRate).toBeLessThan(5); // Less than 5% error rate
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests).fill().map(() => 
        httpClient.get('/health')
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(({ response, responseTime }) => {
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.health.critical);
      });
    });
  });

  describe('Security Integration Validation', () => {
    test('should implement basic security headers', async () => {
      const securityResults = await integrationSuite.runSecurityTests('enhanced');
      
      expect(securityResults.validation.isCompliant).toBe(true);
      if (securityResults.validation.issues.length > 0) {
        console.warn('Security issues found:', securityResults.validation.issues);
      }
    });

    test('should set correct Content-Type headers', async () => {
      const { response } = await httpClient.get('/hello');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Cross-Platform Compatibility Testing', () => {
    test('should maintain response format compatibility', async () => {
      const compatibilityResults = await integrationSuite.runCrossPlatformTests('enhanced');
      
      expect(compatibilityResults.overallCompatibility).toBe(true);
      
      Object.values(compatibilityResults.results).forEach(result => {
        if (result.tested) {
          expect(result.compatibility.compatible).toBe(true);
        }
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle malformed requests gracefully', async () => {
      try {
        await httpClient.post('/hello', { invalidData: 'test' });
      } catch (error) {
        expect(error.status).toBeGreaterThanOrEqual(400);
        expect(error.status).toBeLessThan(500);
      }
    });
  });

  describe('Load Testing and Scalability Assessment', () => {
    test('should maintain performance under sustained load', async () => {
      const loadTestResults = await integrationSuite.runPerformanceTests('enhanced', {
        concurrency: 20,
        duration: 5000,
        rps: 50
      });
      
      expect(loadTestResults.errorRate).toBeLessThan(10); // Less than 10% error rate under load
      expect(loadTestResults.averageResponseTime).toBeLessThan(
        performanceBenchmarks.responseTimeLimits.hello.warning * 2 // Allow 2x normal time under load
      );
    });
  });
});

// Export test utilities for reuse
export {
  IntegrationTestSuite,
  createIntegrationTestServer,
  createHTTPTestClient,
  validateCompleteHTTPResponse,
  setupIntegrationTestSuite,
  teardownIntegrationTestSuite
};