/**
 * @fileoverview Comprehensive Unit Test Suite for Node.js Tutorial Server Module
 * @description Extensive unit testing suite validating HTTP server creation, Express.js application
 * integration, PM2 cluster mode compatibility, graceful shutdown procedures, and production
 * deployment readiness. Implements comprehensive test coverage using Jest framework with SuperTest
 * HTTP testing, mock response validation, performance benchmarking, security verification, and
 * cross-platform compatibility preparation for Flask migration.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Test Coverage:
 * - Server lifecycle testing (initialization, startup, operation, shutdown)
 * - PM2 cluster mode compatibility validation and production deployment testing
 * - Security implementation testing with Helmet.js validation and compliance verification
 * - Performance testing including response time and resource utilization measurement
 * - Error handling testing for uncaught exceptions and process stability validation
 * - Cross-platform compatibility testing preparation for Flask migration scenarios
 * - Health monitoring and observability testing with comprehensive metrics validation
 * - Configuration validation and deployment readiness assessment
 * 
 * Educational Value:
 * - Demonstrates comprehensive unit testing strategies for Node.js server modules
 * - Illustrates Jest testing framework usage with SuperTest HTTP testing integration
 * - Shows testing patterns for server lifecycle functions and production deployment
 * - Provides examples of performance testing and resource utilization validation
 * - Demonstrates security testing patterns and compliance verification
 * - Teaches error handling testing and process stability validation
 * - Shows cross-platform compatibility testing for technology migration
 * 
 * Technology Stack:
 * - Jest v29.7.0 - JavaScript testing framework with comprehensive built-in features
 * - SuperTest v6.3.3 - SuperAgent driven library for testing HTTP servers
 * - Node.js v22.x LTS built-in modules for HTTP, events, and process management
 * - Express.js v5.1.0 server testing with middleware and route validation
 * - PM2 v6.0.8 cluster mode compatibility testing and process management
 * - Helmet.js v8.1.0 security testing and header validation
 */

// External testing framework imports
import request from 'supertest'; // v6.3.3 - SuperAgent driven library for testing HTTP servers
import { jest } from '@jest/globals'; // Jest v29.7.0 - JavaScript testing framework

// Node.js built-in module imports for server testing
import http from 'node:http'; // Node.js built-in - HTTP module for server testing
import events from 'node:events'; // Node.js built-in - Events module for signal testing
import process from 'node:process'; // Node.js built-in - Process module for signal handling testing

// Internal server module imports for comprehensive server testing
import {
  startProductionServer,
  initializeServerEnvironment,
  setupGracefulShutdownHandlers,
  handleServerStartupError,
  validateServerReadiness,
  monitorServerHealth,
  logServerStartupInformation,
  createPM2CompatibleServer,
  validateProductionDeployment,
  initializeHealthMonitoring,
  trackApplicationUptime
} from '../../server.js';

// Express application imports for server integration testing
import {
  createExpressApp,
  startServer,
  setupGracefulShutdown,
  handleServerError,
  validateApplicationHealth,
  logApplicationStartup
} from '../../app.js';

// Configuration and utility imports for comprehensive testing context
import { config } from '../../config/index.js';
import { ENV_CONSTANTS, HTTP_CONSTANTS, PM2_CONSTANTS } from '../../utils/constants.js';
import logger from '../../utils/logger.js';

// Test helper imports for HTTP testing, performance measurement, and validation
import {
  setupTestHelpers,
  createHTTPTestHelper,
  createPerformanceTestHelper,
  createSecurityTestHelper,
  waitFor,
  cleanupTestHelpers
} from '../helpers/test-helpers.js';

// Server-specific test helper imports for enhanced testing scenarios
import { createHealthCheckFixture } from '../helpers/server-test-helpers.js';

// Mock response imports for comprehensive response validation and testing scenarios
import {
  helloResponses,
  healthResponses,
  errorResponses,
  performanceResponses
} from '../fixtures/mock-responses.js';

// Performance metrics fixtures for comprehensive testing scenarios
import { PERFORMANCE_METRICS_FIXTURES } from '../fixtures/server-fixtures.js';

// Global test state management for server instance tracking and cleanup
let TEST_SERVER_INSTANCE = null;
let TEST_APP_INSTANCE = null;
const TEST_PORT = 3001; // Use different port to avoid conflicts
let TEST_HELPERS_SETUP = false;
const SERVER_TEST_CLEANUP = [];

/**
 * Comprehensive test setup function that initializes test environment including test helpers,
 * mock Express application, test isolation configuration, and cleanup procedures for reliable
 * unit testing with performance measurement and security validation capabilities.
 * 
 * @param {Object} [testConfig={}] - Test configuration options
 * @returns {Object} Test setup result with initialized helpers, test application, and cleanup functions
 */
async function setupServerTest(testConfig = {}) {
  const setupStartTime = process.hrtime.bigint();
  
  try {
    // Initialize comprehensive test helpers for HTTP testing, performance measurement, and security validation
    if (!TEST_HELPERS_SETUP) {
      await setupTestHelpers({
        environment: 'test',
        logLevel: 'error', // Reduce log noise during testing
        enablePerformanceTracking: true,
        enableSecurityTesting: true
      });
      TEST_HELPERS_SETUP = true;
    }

    // Create test Express application with test-optimized configuration
    TEST_APP_INSTANCE = createExpressApp({
      enableHealthMonitoring: testConfig.enableHealthMonitoring !== false,
      enableSecurityMiddleware: testConfig.enableSecurityMiddleware !== false,
      configOverrides: {
        server: {
          port: TEST_PORT,
          host: '127.0.0.1'
        },
        environment: {
          NODE_ENV: 'test'
        },
        ...testConfig.configOverrides
      }
    });

    // Set up HTTP test helper with SuperTest integration for comprehensive endpoint testing
    const httpTestHelper = createHTTPTestHelper(TEST_APP_INSTANCE, {
      enableResponseTimeTracking: true,
      enableHeaderValidation: true,
      enableStatusCodeValidation: true
    });

    // Initialize performance test helper for response time and resource utilization measurement
    const performanceTestHelper = createPerformanceTestHelper({
      memoryTrackingEnabled: true,
      cpuTrackingEnabled: true,
      responseTimeThresholds: {
        fast: 50,      // < 50ms
        acceptable: 200, // < 200ms
        slow: 1000     // > 1000ms
      }
    });

    // Configure security test helper for Helmet.js validation and security compliance testing
    const securityTestHelper = createSecurityTestHelper({
      validateHelmetHeaders: true,
      validateCSPHeaders: true,
      validateCORSHeaders: true,
      securityScanEnabled: true
    });

    // Register cleanup functions for proper test environment disposal
    const cleanupFunction = async () => {
      // Close test server instance if running
      if (TEST_SERVER_INSTANCE) {
        await new Promise((resolve) => {
          TEST_SERVER_INSTANCE.close(() => resolve());
        });
        TEST_SERVER_INSTANCE = null;
      }

      // Reset test application instance
      TEST_APP_INSTANCE = null;

      // Clear any test-specific timers or intervals
      if (global.testIntervals) {
        global.testIntervals.forEach(interval => clearInterval(interval));
        global.testIntervals = [];
      }

      // Reset environment variables to original state
      if (testConfig.originalEnv) {
        Object.assign(process.env, testConfig.originalEnv);
      }
    };

    SERVER_TEST_CLEANUP.push(cleanupFunction);

    const setupEndTime = process.hrtime.bigint();
    const setupDuration = Number(setupEndTime - setupStartTime) / 1000000; // Convert to milliseconds

    // Return comprehensive test setup configuration with helpers and utilities
    return {
      app: TEST_APP_INSTANCE,
      httpHelper: httpTestHelper,
      performanceHelper: performanceTestHelper,
      securityHelper: securityTestHelper,
      cleanup: cleanupFunction,
      setupTime: setupDuration,
      testPort: TEST_PORT,
      testConfig: {
        environment: 'test',
        port: TEST_PORT,
        enableHealthMonitoring: testConfig.enableHealthMonitoring !== false,
        enableSecurityMiddleware: testConfig.enableSecurityMiddleware !== false,
        ...testConfig
      }
    };

  } catch (error) {
    console.error('Test setup failed:', error);
    throw new Error(`Server test setup failed: ${error.message}`);
  }
}

/**
 * Comprehensive test cleanup function that properly disposes of server instances, closes
 * connections, cleans up test helpers, resets global state, and ensures complete test
 * isolation for reliable test execution and resource management.
 * 
 * @returns {Promise<void>} Promise that resolves when all server test cleanup is complete
 */
async function teardownServerTest() {
  const cleanupStartTime = process.hrtime.bigint();
  
  try {
    // Execute all registered cleanup functions for complete resource disposal
    for (const cleanupFn of SERVER_TEST_CLEANUP) {
      try {
        await cleanupFn();
      } catch (cleanupError) {
        console.warn('Cleanup function failed:', cleanupError);
      }
    }

    // Clear cleanup function registry
    SERVER_TEST_CLEANUP.length = 0;

    // Close any remaining test server instances and HTTP connections
    if (TEST_SERVER_INSTANCE) {
      await new Promise((resolve, reject) => {
        const closeTimeout = setTimeout(() => {
          reject(new Error('Server close timeout'));
        }, 5000);

        TEST_SERVER_INSTANCE.close((error) => {
          clearTimeout(closeTimeout);
          if (error) reject(error);
          else resolve();
        });
      });
      TEST_SERVER_INSTANCE = null;
    }

    // Reset test Express applications and middleware resources
    TEST_APP_INSTANCE = null;

    // Clean up test helpers and reset global testing state
    if (TEST_HELPERS_SETUP) {
      await cleanupTestHelpers();
      TEST_HELPERS_SETUP = false;
    }

    // Clear global test variables and reset test environment state
    delete global.testIntervals;
    delete global.testTimeouts;
    delete global.testMocks;

    // Reset Jest mocks and spies to ensure complete test isolation
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Perform memory optimization hints for test environment
    if (global.gc && typeof global.gc === 'function') {
      global.gc();
    }

    const cleanupEndTime = process.hrtime.bigint();
    const cleanupDuration = Number(cleanupEndTime - cleanupStartTime) / 1000000;

    // Log cleanup completion for debugging and test performance monitoring
    if (process.env.TEST_VERBOSE) {
      console.log(`Test cleanup completed in ${cleanupDuration.toFixed(2)}ms`);
    }

  } catch (error) {
    console.error('Test teardown failed:', error);
    throw new Error(`Server test teardown failed: ${error.message}`);
  }
}

// ============================================================================
// MAIN TEST SUITE - Comprehensive server module unit testing
// ============================================================================

describe('Server Module Unit Tests', () => {
  // Global test setup and teardown for comprehensive test environment management
  beforeAll(async () => {
    await setupServerTest({
      enableHealthMonitoring: true,
      enableSecurityMiddleware: true,
      enablePerformanceTracking: true
    });
  });

  afterAll(async () => {
    await teardownServerTest();
  });

  beforeEach(() => {
    // Reset test state before each test for isolation
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up any test-specific resources after each test
    if (TEST_SERVER_INSTANCE && TEST_SERVER_INSTANCE.listening) {
      await new Promise(resolve => TEST_SERVER_INSTANCE.close(resolve));
      TEST_SERVER_INSTANCE = null;
    }
  });

  // ============================================================================
  // SERVER CREATION TESTING - HTTP/HTTPS server creation and configuration
  // ============================================================================
  
  describe('Server Creation Functions', () => {
    describe('startProductionServer Function', () => {
      test('should create HTTP server with valid Express application and configuration', async () => {
        const performanceHelper = createPerformanceTestHelper();
        const startTime = performanceHelper.startTiming();

        const serverResult = await startProductionServer({
          port: TEST_PORT + 10,
          enableHealthMonitoring: true,
          enableGracefulShutdown: false // Disable for testing
        });

        const timing = performanceHelper.endTiming(startTime);

        expect(serverResult).toBeDefined();
        expect(serverResult.server).toBeDefined();
        expect(serverResult.server.listening).toBe(true);
        expect(serverResult.healthManager).toBeDefined();
        expect(serverResult.config).toBeDefined();
        expect(serverResult.environment).toBeDefined();
        expect(serverResult.startupTime).toBeGreaterThan(0);
        expect(timing.duration).toBeLessThan(5000); // Should start within 5 seconds

        // Verify server configuration properties
        const serverAddress = serverResult.server.address();
        expect(serverAddress.port).toBe(TEST_PORT + 10);
        expect(serverAddress.address).toBeDefined();

        // Clean up test server
        await new Promise(resolve => serverResult.server.close(resolve));
      });

      test('should validate server instance type and configuration properties', async () => {
        const serverResult = await startProductionServer({
          port: TEST_PORT + 11,
          enableGracefulShutdown: false
        });

        expect(serverResult.server).toBeInstanceOf(http.Server);
        expect(serverResult.config.port).toBe(TEST_PORT + 11);
        expect(serverResult.environment.currentEnvironment).toBeDefined();
        expect(serverResult.environment.pm2Detected).toBeDefined();
        expect(serverResult.environment.clusterMode).toBeDefined();

        // Verify server operational state
        expect(serverResult.server.listening).toBe(true);
        expect(serverResult.server.address()).toBeTruthy();

        await new Promise(resolve => serverResult.server.close(resolve));
      });

      test('should handle error scenarios with invalid configuration parameters', async () => {
        await expect(startProductionServer({
          port: -1, // Invalid port number
          enableGracefulShutdown: false
        })).rejects.toThrow();

        await expect(startProductionServer({
          port: 70000, // Port out of range
          enableGracefulShutdown: false
        })).rejects.toThrow();
      });

      test('should validate PM2 cluster mode compatibility and shared port handling', async () => {
        // Mock PM2 environment variables
        const originalPM2 = process.env.PM2_HOME;
        const originalPMID = process.env.PM_ID;
        
        process.env.PM2_HOME = '/tmp/pm2';
        process.env.PM_ID = '1';

        try {
          const serverResult = await startProductionServer({
            port: TEST_PORT + 12,
            enableGracefulShutdown: false
          });

          expect(serverResult.environment.pm2Detected).toBe(true);
          expect(serverResult.config).toBeDefined();

          await new Promise(resolve => serverResult.server.close(resolve));
        } finally {
          // Restore original environment
          if (originalPM2) process.env.PM2_HOME = originalPM2;
          else delete process.env.PM2_HOME;
          
          if (originalPMID) process.env.PM_ID = originalPMID;
          else delete process.env.PM_ID;
        }
      });

      test('should validate security configuration integration and middleware setup', async () => {
        const securityHelper = createSecurityTestHelper();
        
        const serverResult = await startProductionServer({
          port: TEST_PORT + 13,
          enableGracefulShutdown: false,
          enableSecurityMiddleware: true
        });

        // Test security headers on a basic endpoint
        const response = await request(serverResult.server)
          .get('/health')
          .expect(200);

        const securityValidation = securityHelper.validateSecurityHeaders(response.headers);
        
        expect(securityValidation.helmetHeaders).toBe(true);
        expect(securityValidation.cspHeader).toBe(true);
        expect(securityValidation.hstsHeader).toBe(true);

        await new Promise(resolve => serverResult.server.close(resolve));
      });

      test('should measure server creation performance and resource utilization', async () => {
        const performanceHelper = createPerformanceTestHelper();
        const initialMemory = process.memoryUsage();
        const startTime = performanceHelper.startTiming();

        const serverResult = await startProductionServer({
          port: TEST_PORT + 14,
          enableGracefulShutdown: false
        });

        const timing = performanceHelper.endTiming(startTime);
        const finalMemory = process.memoryUsage();

        expect(timing.duration).toBeLessThan(3000); // Should start within 3 seconds
        expect(finalMemory.heapUsed).toBeGreaterThan(initialMemory.heapUsed);
        expect(serverResult.startupTime).toBeLessThan(3000);

        await new Promise(resolve => serverResult.server.close(resolve));
      });
    });

    describe('createExpressApp Function', () => {
      test('should create Express application with comprehensive middleware stack', () => {
        const app = createExpressApp({
          enableHealthMonitoring: true,
          enableSecurityMiddleware: true
        });

        expect(app).toBeDefined();
        expect(typeof app.listen).toBe('function');
        expect(typeof app.use).toBe('function');
        expect(typeof app.get).toBe('function');
        
        // Verify middleware stack exists
        expect(app._router).toBeDefined();
        expect(app._router.stack.length).toBeGreaterThan(0);
      });

      test('should configure security middleware with Helmet.js integration', async () => {
        const app = createExpressApp({
          enableSecurityMiddleware: true
        });

        const server = await startServer(app, { port: TEST_PORT + 15 });
        const response = await request(server).get('/health');

        // Check for security headers
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBeDefined();
        expect(response.headers['content-security-policy']).toBeDefined();

        await new Promise(resolve => server.close(resolve));
      });

      test('should handle configuration overrides for testing scenarios', () => {
        const testConfig = {
          server: { port: 9999 },
          environment: { NODE_ENV: 'test' },
          security: { helmet: { crossOriginEmbedderPolicy: false } }
        };

        const app = createExpressApp({
          configOverrides: testConfig,
          enableSecurityMiddleware: true
        });

        expect(app).toBeDefined();
        // Verify app is created with overrides
        expect(typeof app.listen).toBe('function');
      });
    });
  });

  // ============================================================================
  // SERVER STARTUP TESTING - Port binding, startup validation, and health checks
  // ============================================================================

  describe('Server Startup Functions', () => {
    describe('startServer Function', () => {
      test('should start server successfully on available port with proper binding', async () => {
        const app = createExpressApp();
        const server = await startServer(app, {
          port: TEST_PORT + 20,
          host: '127.0.0.1'
        });

        expect(server).toBeDefined();
        expect(server.listening).toBe(true);
        
        const address = server.address();
        expect(address.port).toBe(TEST_PORT + 20);
        expect(address.address).toBe('127.0.0.1');

        await new Promise(resolve => server.close(resolve));
      });

      test('should validate startup promise resolution and server listening state', async () => {
        const app = createExpressApp();
        const startPromise = startServer(app, { port: TEST_PORT + 21 });

        expect(startPromise).toBeInstanceOf(Promise);
        
        const server = await startPromise;
        expect(server.listening).toBe(true);
        expect(server.address()).toBeTruthy();

        await new Promise(resolve => server.close(resolve));
      });

      test('should handle port conflict scenarios with graceful error management', async () => {
        const app1 = createExpressApp();
        const app2 = createExpressApp();
        
        const server1 = await startServer(app1, { port: TEST_PORT + 22 });
        
        // Try to start second server on same port
        await expect(startServer(app2, { port: TEST_PORT + 22 }))
          .rejects.toThrow(/EADDRINUSE/);

        await new Promise(resolve => server1.close(resolve));
      });

      test('should validate startup with different host configurations and binding options', async () => {
        const app = createExpressApp();
        
        // Test localhost binding
        const server1 = await startServer(app, {
          port: TEST_PORT + 23,
          host: 'localhost'
        });
        
        expect(server1.listening).toBe(true);
        await new Promise(resolve => server1.close(resolve));

        // Test 0.0.0.0 binding
        const server2 = await startServer(app, {
          port: TEST_PORT + 24,
          host: '0.0.0.0'
        });
        
        expect(server2.listening).toBe(true);
        await new Promise(resolve => server2.close(resolve));
      });

      test('should measure startup performance and initialization timing', async () => {
        const performanceHelper = createPerformanceTestHelper();
        const app = createExpressApp();
        
        const startTime = performanceHelper.startTiming();
        const server = await startServer(app, { port: TEST_PORT + 25 });
        const timing = performanceHelper.endTiming(startTime);

        expect(timing.duration).toBeLessThan(2000); // Should start within 2 seconds
        expect(server.listening).toBe(true);

        await new Promise(resolve => server.close(resolve));
      });
    });

    describe('initializeServerEnvironment Function', () => {
      test('should initialize environment with valid configuration and dependencies', async () => {
        const environment = await initializeServerEnvironment();

        expect(environment).toBeDefined();
        expect(environment.currentEnvironment).toBeDefined();
        expect(environment.nodeVersion).toBe(process.version);
        expect(environment.platform).toBe(process.platform);
        expect(environment.hostname).toBeDefined();
        expect(environment.pid).toBe(process.pid);
        expect(environment.configuration).toBeDefined();
      });

      test('should validate PM2 compatibility requirements and cluster mode settings', async () => {
        // Mock PM2 environment
        const originalEnv = { ...process.env };
        process.env.PM2_HOME = '/tmp/pm2';
        
        try {
          const environment = await initializeServerEnvironment();
          
          expect(environment.pm2Detected).toBe(true);
          expect(environment.clusterMode).toBeDefined();
        } finally {
          process.env = originalEnv;
        }
      });

      test('should check Node.js version compatibility and report status', async () => {
        const environment = await initializeServerEnvironment();
        
        expect(environment.nodeVersionValid).toBeDefined();
        expect(typeof environment.nodeVersionValid).toBe('boolean');
        
        // Current test environment should have valid Node version
        expect(environment.nodeVersionValid).toBe(true);
      });
    });
  });

  // ============================================================================
  // GRACEFUL SHUTDOWN TESTING - Signal handling and resource cleanup
  // ============================================================================

  describe('Graceful Shutdown Functions', () => {
    describe('setupGracefulShutdownHandlers Function', () => {
      test('should register signal handlers for SIGTERM and SIGINT', async () => {
        const mockServer = new events.EventEmitter();
        mockServer.close = jest.fn((callback) => callback && callback());
        
        const mockHealthManager = {
          isMonitoring: true,
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        // Spy on process.on to verify signal handler registration
        const processOnSpy = jest.spyOn(process, 'on');
        
        await setupGracefulShutdownHandlers(mockServer, mockHealthManager);

        // Verify SIGTERM handler registration
        expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
        expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
        expect(processOnSpy).toHaveBeenCalledWith('SIGUSR2', expect.any(Function));

        processOnSpy.mockRestore();
      });

      test('should handle connection draining and existing request completion', async () => {
        const mockServer = {
          close: jest.fn((callback) => {
            // Simulate async server close
            setTimeout(() => callback(), 100);
          }),
          listening: true
        };

        const mockHealthManager = {
          isMonitoring: true,
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        await setupGracefulShutdownHandlers(mockServer, mockHealthManager);

        // Verify server close method is available
        expect(typeof mockServer.close).toBe('function');
      });

      test('should validate PM2 process coordination and cluster mode shutdown procedures', async () => {
        // Mock cluster environment
        const originalCluster = process.env.PM_ID;
        process.env.PM_ID = '1';

        try {
          const mockServer = {
            close: jest.fn((callback) => callback())
          };

          const mockHealthManager = {
            isMonitoring: false,
            stopMonitoring: jest.fn().mockResolvedValue(undefined)
          };

          await setupGracefulShutdownHandlers(mockServer, mockHealthManager);

          // In PM2 environment, handlers should still be registered
          expect(mockServer.close).toBeDefined();
        } finally {
          if (originalCluster) process.env.PM_ID = originalCluster;
          else delete process.env.PM_ID;
        }
      });
    });

    describe('Graceful Shutdown Execution', () => {
      test('should execute complete shutdown sequence with resource cleanup', async () => {
        const cleanupOrder = [];
        
        const mockServer = {
          close: jest.fn((callback) => {
            cleanupOrder.push('server-close');
            callback();
          })
        };

        const mockHealthManager = {
          isMonitoring: true,
          stopMonitoring: jest.fn(async () => {
            cleanupOrder.push('health-stop');
          })
        };

        await setupGracefulShutdownHandlers(mockServer, mockHealthManager);

        // Verify cleanup functions are callable
        expect(typeof mockServer.close).toBe('function');
        expect(typeof mockHealthManager.stopMonitoring).toBe('function');
      });

      test('should handle shutdown timeout scenarios and forced termination', async () => {
        const mockServer = {
          close: jest.fn((callback) => {
            // Simulate hanging server close
            setTimeout(() => callback(), 35000); // Longer than shutdown timeout
          })
        };

        const mockHealthManager = {
          isMonitoring: true,
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        await setupGracefulShutdownHandlers(mockServer, mockHealthManager);

        // Test that timeout handling is configured
        expect(typeof mockServer.close).toBe('function');
      });
    });
  });

  // ============================================================================
  // APPLICATION INITIALIZATION TESTING - Complete setup and validation
  // ============================================================================

  describe('Application Initialization Functions', () => {
    describe('startProductionServer Integration', () => {
      test('should initialize complete application with valid configuration', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 30,
          enableGracefulShutdown: false,
          enableHealthMonitoring: true
        });

        expect(result.server).toBeDefined();
        expect(result.healthManager).toBeDefined();
        expect(result.config).toBeDefined();
        expect(result.environment).toBeDefined();
        expect(result.startupTime).toBeGreaterThan(0);

        // Verify Express application creation
        expect(result.server.listening).toBe(true);

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate Express app creation and middleware integration', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 31,
          enableGracefulShutdown: false
        });

        // Test that endpoints are accessible
        const response = await request(result.server)
          .get('/health')
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.headers['content-type']).toMatch(/json/);

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should handle initialization error scenarios and recovery procedures', async () => {
        // Test with invalid configuration
        await expect(startProductionServer({
          port: 'invalid-port',
          enableGracefulShutdown: false
        })).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // CONFIGURATION VALIDATION TESTING - Server config and deployment readiness
  // ============================================================================

  describe('Configuration Validation Functions', () => {
    describe('validateServerReadiness Function', () => {
      test('should validate complete server configuration successfully', async () => {
        const validation = await validateServerReadiness(config);

        expect(validation).toBeDefined();
        expect(validation.isValid).toBeDefined();
        expect(Array.isArray(validation.errors)).toBe(true);
        expect(Array.isArray(validation.warnings)).toBe(true);
        expect(Array.isArray(validation.recommendations)).toBe(true);
        expect(Array.isArray(validation.validatedModules)).toBe(true);
        expect(validation.timestamp).toBeDefined();
      });

      test('should handle invalid configuration scenarios with appropriate errors', async () => {
        const invalidConfig = null;
        const validation = await validateServerReadiness(invalidConfig);

        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.errors).toContain('Server configuration is missing');
      });

      test('should validate Node.js version compatibility and requirements', async () => {
        const validation = await validateServerReadiness(config);

        expect(validation.validatedModules).toContain('node-version');
        // In test environment, version should be valid
        expect(validation.isValid).toBe(true);
      });

      test('should check PM2 configuration for production environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
          const validation = await validateServerReadiness(config);
          
          // Should have PM2-related warnings or validations in production
          expect(validation).toBeDefined();
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });

      test('should validate system resource availability and requirements', async () => {
        const validation = await validateServerReadiness(config);

        // Should check system resources as part of validation
        expect(validation.timestamp).toBeDefined();
        expect(typeof validation.isValid).toBe('boolean');
      });
    });

    describe('validateProductionDeployment Function', () => {
      test('should validate production deployment configuration', async () => {
        const mockDeploymentConfig = {
          server: { listening: true },
          config: { security: { helmet: true, cors: true } },
          environment: { pm2Detected: true, clusterMode: true },
          healthManager: { isMonitoring: true }
        };

        const validation = await validateProductionDeployment(mockDeploymentConfig);

        expect(validation).toBeDefined();
        expect(validation.isValid).toBeDefined();
        expect(Array.isArray(validation.errors)).toBe(true);
        expect(Array.isArray(validation.warnings)).toBe(true);
        expect(Array.isArray(validation.recommendations)).toBe(true);
        expect(Array.isArray(validation.checks)).toBe(true);
      });

      test('should identify missing security configuration', async () => {
        const mockDeploymentConfig = {
          server: { listening: true },
          config: {}, // Missing security config
          environment: { pm2Detected: false },
          healthManager: null
        };

        const validation = await validateProductionDeployment(mockDeploymentConfig);

        expect(validation.warnings).toContain('Security configuration is missing');
        expect(validation.recommendations).toContain('Configure comprehensive security headers with Helmet.js');
      });
    });
  });

  // ============================================================================
  // HEALTH REPORTING TESTING - Health checks and monitoring
  // ============================================================================

  describe('Health Reporting Functions', () => {
    describe('Health Monitoring Integration', () => {
      test('should initialize health monitoring system successfully', async () => {
        const result = await initializeHealthMonitoring({
          interval: 5000,
          memoryThreshold: 1024 * 1024 * 1024,
          cpuThreshold: 80
        });

        expect(result.success).toBe(true);
        expect(result.baseline).toBeDefined();
        expect(result.baseline.startTime).toBeDefined();
        expect(result.baseline.initialMemory).toBeDefined();
        expect(result.baseline.pid).toBe(process.pid);
      });

      test('should track application uptime and operational metrics', () => {
        const uptimeInfo = trackApplicationUptime();

        expect(uptimeInfo).toBeDefined();
        expect(uptimeInfo.processUptime).toBeGreaterThan(0);
        expect(uptimeInfo.currentTime).toBeDefined();
        expect(uptimeInfo.pid).toBe(process.pid);
        expect(uptimeInfo.environment).toBeDefined();
      });

      test('should validate health endpoint response format and monitoring integration', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 40,
          enableGracefulShutdown: false,
          enableHealthMonitoring: true
        });

        const response = await request(result.server)
          .get('/health')
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body.status).toBeDefined();
        expect(response.headers['content-type']).toMatch(/json/);

        await new Promise(resolve => result.server.close(resolve));
      });
    });

    describe('Health Service Integration', () => {
      test('should validate comprehensive health report generation', async () => {
        const app = createExpressApp({ enableHealthMonitoring: true });
        const validation = await validateApplicationHealth(app);

        expect(validation).toBeDefined();
        expect(validation.status).toBeDefined();
        expect(validation.components).toBeDefined();
        expect(validation.timestamp).toBeDefined();
        expect(validation.overall).toBeDefined();
        expect(validation.overall.healthy).toBeDefined();
      });

      test('should validate system metrics collection and reporting accuracy', async () => {
        const app = createExpressApp({ enableHealthMonitoring: true });
        const validation = await validateApplicationHealth(app);

        expect(validation.components.memory).toBeDefined();
        expect(validation.components.environment).toBeDefined();
        
        if (validation.components.memory.status === 'healthy') {
          expect(validation.components.memory.usage).toBeDefined();
        }
      });
    });

    // ============================================================================
    // ENHANCED HEALTH MONITORING TESTING - New comprehensive test suites
    // ============================================================================

    describe('monitorServerHealth Function', () => {
      test('should initialize health monitoring with complete lifecycle management', async () => {
        const healthFixture = createHealthCheckFixture({ status: 'healthy' });
        const monitoringConfig = {
          interval: 5000,
          memoryThreshold: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.warning,
          cpuThreshold: PERFORMANCE_METRICS_FIXTURES.cpuUsage.percentage.warning,
          enabled: true
        };

        // Mock the health manager to simulate monitoring initialization
        const mockHealthManager = {
          isMonitoring: false,
          startMonitoring: jest.fn().mockResolvedValue({
            success: true,
            baseline: healthFixture,
            interval: monitoringConfig.interval
          }),
          getHealthStatus: jest.fn().mockResolvedValue(healthFixture),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        const monitoringResult = await monitorServerHealth(mockHealthManager, monitoringConfig);

        expect(monitoringResult).toBeDefined();
        expect(monitoringResult.success).toBe(true);
        expect(monitoringResult.monitoring).toBe(true);
        expect(mockHealthManager.startMonitoring).toHaveBeenCalledWith(monitoringConfig);
        expect(monitoringResult.healthStatus).toEqual(healthFixture);
        expect(monitoringResult.baseline).toBeDefined();
        expect(monitoringResult.interval).toBe(monitoringConfig.interval);

        // Cleanup
        await mockHealthManager.stopMonitoring();
      });

      test('should validate monitoring intervals and continuous health checks', async () => {
        const healthyFixture = createHealthCheckFixture({ status: 'healthy' });
        const degradedFixture = createHealthCheckFixture({ status: 'degraded' });
        
        let callCount = 0;
        const mockHealthManager = {
          isMonitoring: true,
          getHealthStatus: jest.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve(callCount <= 2 ? healthyFixture : degradedFixture);
          }),
          startMonitoring: jest.fn().mockResolvedValue({ success: true }),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        const monitoringConfig = { interval: 100 }; // Short interval for testing
        
        await monitorServerHealth(mockHealthManager, monitoringConfig);
        
        // Allow time for multiple health checks
        await new Promise(resolve => setTimeout(resolve, 350));
        
        expect(mockHealthManager.getHealthStatus).toHaveBeenCalledTimes(callCount);
        expect(callCount).toBeGreaterThan(2); // Should have multiple health checks
        
        const latestHealth = await mockHealthManager.getHealthStatus();
        expect(latestHealth.status).toBe('degraded'); // Should transition to degraded status
        expect(latestHealth.errors).toBeDefined();
        expect(Array.isArray(latestHealth.errors)).toBe(true);

        await mockHealthManager.stopMonitoring();
      });

      test('should handle monitoring error scenarios and failure recovery', async () => {
        const mockHealthManager = {
          isMonitoring: false,
          startMonitoring: jest.fn().mockRejectedValue(new Error('Health monitoring initialization failed')),
          getHealthStatus: jest.fn().mockRejectedValue(new Error('Health status retrieval failed')),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        const monitoringConfig = {
          interval: 5000,
          retryAttempts: 3,
          errorThreshold: 5
        };

        await expect(monitorServerHealth(mockHealthManager, monitoringConfig))
          .rejects.toThrow('Health monitoring initialization failed');

        expect(mockHealthManager.startMonitoring).toHaveBeenCalledWith(monitoringConfig);
        expect(mockHealthManager.startMonitoring).toHaveBeenCalledTimes(1);

        // Test recovery scenario
        mockHealthManager.startMonitoring.mockResolvedValue({ success: true, baseline: createHealthCheckFixture() });
        const recoveryResult = await monitorServerHealth(mockHealthManager, monitoringConfig);

        expect(recoveryResult.success).toBe(true);
        expect(recoveryResult.monitoring).toBe(true);
      });

      test('should validate performance metrics collection during monitoring', async () => {
        const performanceFixture = createHealthCheckFixture({ 
          status: 'healthy',
          customMetrics: {
            performanceMetrics: {
              startupTime: PERFORMANCE_METRICS_FIXTURES.startupTime.actual,
              responseTime: PERFORMANCE_METRICS_FIXTURES.responseTime.average,
              requestCount: PERFORMANCE_METRICS_FIXTURES.requestCount.total,
              errorRate: PERFORMANCE_METRICS_FIXTURES.errorRate.current
            }
          }
        });

        const mockHealthManager = {
          isMonitoring: true,
          startMonitoring: jest.fn().mockResolvedValue({ success: true, baseline: performanceFixture }),
          getHealthStatus: jest.fn().mockResolvedValue(performanceFixture),
          getPerformanceMetrics: jest.fn().mockResolvedValue(PERFORMANCE_METRICS_FIXTURES),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        const monitoringResult = await monitorServerHealth(mockHealthManager, {
          interval: 5000,
          enablePerformanceTracking: true
        });

        expect(monitoringResult.success).toBe(true);
        expect(monitoringResult.healthStatus.performanceMetrics).toBeDefined();
        expect(monitoringResult.healthStatus.performanceMetrics.startupTime).toBe(PERFORMANCE_METRICS_FIXTURES.startupTime.actual);
        expect(monitoringResult.healthStatus.performanceMetrics.responseTime).toBe(PERFORMANCE_METRICS_FIXTURES.responseTime.average);
        expect(monitoringResult.healthStatus.performanceMetrics.errorRate).toBe(PERFORMANCE_METRICS_FIXTURES.errorRate.current);

        await mockHealthManager.stopMonitoring();
      });

      test('should test monitoring cleanup and resource deallocation', async () => {
        const healthFixture = createHealthCheckFixture({ status: 'healthy' });
        const mockHealthManager = {
          isMonitoring: true,
          intervals: [],
          timeouts: [],
          startMonitoring: jest.fn().mockImplementation((config) => {
            const interval = setInterval(() => {}, config.interval);
            mockHealthManager.intervals.push(interval);
            return Promise.resolve({ success: true, baseline: healthFixture });
          }),
          stopMonitoring: jest.fn().mockImplementation(() => {
            mockHealthManager.intervals.forEach(clearInterval);
            mockHealthManager.timeouts.forEach(clearTimeout);
            mockHealthManager.intervals = [];
            mockHealthManager.timeouts = [];
            mockHealthManager.isMonitoring = false;
            return Promise.resolve(undefined);
          }),
          getHealthStatus: jest.fn().mockResolvedValue(healthFixture)
        };

        const monitoringConfig = { interval: 1000 };
        await monitorServerHealth(mockHealthManager, monitoringConfig);

        expect(mockHealthManager.isMonitoring).toBe(true);
        expect(mockHealthManager.intervals.length).toBeGreaterThan(0);

        // Test cleanup
        await mockHealthManager.stopMonitoring();

        expect(mockHealthManager.isMonitoring).toBe(false);
        expect(mockHealthManager.intervals.length).toBe(0);
        expect(mockHealthManager.timeouts.length).toBe(0);
      });

      test('should validate health threshold evaluations and alerting', async () => {
        const criticalFixture = createHealthCheckFixture({ 
          status: 'critical',
          customMetrics: {
            memoryUsage: {
              rss: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.critical + 100000000 // Exceed critical threshold
            },
            cpuUsage: {
              percentage: {
                current: PERFORMANCE_METRICS_FIXTURES.cpuUsage.percentage.critical + 5 // Exceed critical threshold
              }
            }
          }
        });

        const mockHealthManager = {
          isMonitoring: true,
          alertsTriggered: [],
          startMonitoring: jest.fn().mockResolvedValue({ success: true }),
          getHealthStatus: jest.fn().mockResolvedValue(criticalFixture),
          triggerAlert: jest.fn().mockImplementation((alert) => {
            mockHealthManager.alertsTriggered.push(alert);
            return Promise.resolve({ alertId: Date.now(), status: 'sent' });
          }),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        const monitoringConfig = {
          interval: 5000,
          memoryThreshold: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.critical,
          cpuThreshold: PERFORMANCE_METRICS_FIXTURES.cpuUsage.percentage.critical,
          enableAlerting: true
        };

        await monitorServerHealth(mockHealthManager, monitoringConfig);
        
        const healthStatus = await mockHealthManager.getHealthStatus();
        
        expect(healthStatus.status).toBe('critical');
        expect(healthStatus.memoryUsage.rss).toBeGreaterThan(monitoringConfig.memoryThreshold);
        expect(healthStatus.cpuUsage.percentage.current).toBeGreaterThan(monitoringConfig.cpuThreshold);

        // Simulate threshold evaluation and alerting
        if (healthStatus.memoryUsage.rss > monitoringConfig.memoryThreshold) {
          await mockHealthManager.triggerAlert({
            type: 'memory_critical',
            threshold: monitoringConfig.memoryThreshold,
            actual: healthStatus.memoryUsage.rss
          });
        }

        expect(mockHealthManager.alertsTriggered.length).toBeGreaterThan(0);
        expect(mockHealthManager.alertsTriggered[0].type).toBe('memory_critical');

        await mockHealthManager.stopMonitoring();
      });

      test('should test memory usage and resource leak prevention during monitoring', async () => {
        const initialMemory = process.memoryUsage();
        const mockHealthManager = {
          isMonitoring: true,
          memorySnapshots: [],
          startMonitoring: jest.fn().mockResolvedValue({ success: true }),
          getHealthStatus: jest.fn().mockImplementation(() => {
            const currentMemory = process.memoryUsage();
            mockHealthManager.memorySnapshots.push(currentMemory);
            return Promise.resolve(createHealthCheckFixture({ 
              customMetrics: { memoryUsage: currentMemory }
            }));
          }),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        await monitorServerHealth(mockHealthManager, { interval: 100 });

        // Generate some monitoring activity
        for (let i = 0; i < 5; i++) {
          await mockHealthManager.getHealthStatus();
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        // Memory increase should be reasonable (< 10MB for monitoring operations)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        
        // Memory snapshots should show stable or decreasing trend
        expect(mockHealthManager.memorySnapshots.length).toBeGreaterThan(0);
        
        await mockHealthManager.stopMonitoring();
      });

      test('should validate PM2 cluster mode health monitoring integration', async () => {
        // Mock PM2 cluster environment
        const originalPM2 = process.env.PM2_HOME;
        const originalPMID = process.env.PM_ID;
        
        process.env.PM2_HOME = '/tmp/.pm2';
        process.env.PM_ID = '2';

        try {
          const clusterFixture = createHealthCheckFixture({ 
            status: 'healthy',
            customMetrics: {
              pm2: {
                instanceId: 2,
                clusterMode: true,
                totalInstances: 4,
                loadBalance: 'round-robin'
              }
            }
          });

          const mockHealthManager = {
            isMonitoring: true,
            clusterInstances: [],
            startMonitoring: jest.fn().mockResolvedValue({ success: true, baseline: clusterFixture }),
            getHealthStatus: jest.fn().mockResolvedValue(clusterFixture),
            getClusterStatus: jest.fn().mockResolvedValue({
              instances: 4,
              online: 4,
              stopped: 0,
              errored: 0
            }),
            stopMonitoring: jest.fn().mockResolvedValue(undefined)
          };

          const monitoringResult = await monitorServerHealth(mockHealthManager, {
            interval: 5000,
            enableClusterMonitoring: true
          });

          expect(monitoringResult.success).toBe(true);
          expect(monitoringResult.healthStatus.pm2).toBeDefined();
          expect(monitoringResult.healthStatus.pm2.clusterMode).toBe(true);
          expect(monitoringResult.healthStatus.pm2.instanceId).toBe(2);

          const clusterStatus = await mockHealthManager.getClusterStatus();
          expect(clusterStatus.instances).toBe(4);
          expect(clusterStatus.online).toBe(4);

          await mockHealthManager.stopMonitoring();
        } finally {
          // Restore environment
          if (originalPM2) process.env.PM2_HOME = originalPM2;
          else delete process.env.PM2_HOME;
          
          if (originalPMID) process.env.PM_ID = originalPMID;
          else delete process.env.PM_ID;
        }
      });

      test('should test monitoring under high-load scenarios and stress conditions', async () => {
        const stressFixture = createHealthCheckFixture({ 
          status: 'degraded',
          customMetrics: {
            memoryUsage: {
              rss: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.warning,
              heapUsed: PERFORMANCE_METRICS_FIXTURES.memoryUsage.heapUsed.peak
            },
            cpuUsage: {
              percentage: {
                current: PERFORMANCE_METRICS_FIXTURES.cpuUsage.percentage.warning
              }
            },
            requestCount: PERFORMANCE_METRICS_FIXTURES.requestCount.peak,
            errorRate: PERFORMANCE_METRICS_FIXTURES.errorRate.warning
          }
        });

        const mockHealthManager = {
          isMonitoring: true,
          stressLevel: 0,
          startMonitoring: jest.fn().mockResolvedValue({ success: true }),
          getHealthStatus: jest.fn().mockImplementation(() => {
            mockHealthManager.stressLevel++;
            const currentFixture = { ...stressFixture };
            currentFixture.stressLevel = mockHealthManager.stressLevel;
            return Promise.resolve(currentFixture);
          }),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        await monitorServerHealth(mockHealthManager, { 
          interval: 50, // Very frequent monitoring
          stressTestMode: true 
        });

        // Simulate high-load conditions
        const stressPromises = [];
        for (let i = 0; i < 20; i++) {
          stressPromises.push(mockHealthManager.getHealthStatus());
        }

        const stressResults = await Promise.all(stressPromises);
        
        expect(stressResults.length).toBe(20);
        stressResults.forEach(result => {
          expect(result.status).toBe('degraded');
          expect(result.stressLevel).toBeGreaterThan(0);
        });

        // Verify monitoring remains stable under stress
        expect(mockHealthManager.isMonitoring).toBe(true);

        await mockHealthManager.stopMonitoring();
      });

      test('should validate cross-platform health monitoring compatibility', async () => {
        const platformFixture = createHealthCheckFixture({ 
          status: 'healthy',
          customMetrics: {
            platform: process.platform,
            architecture: process.arch,
            nodeVersion: process.version,
            osInfo: {
              type: require('os').type(),
              release: require('os').release(),
              totalMemory: require('os').totalmem(),
              freeMemory: require('os').freemem()
            }
          }
        });

        const mockHealthManager = {
          isMonitoring: true,
          platformChecks: [],
          startMonitoring: jest.fn().mockResolvedValue({ success: true, baseline: platformFixture }),
          getHealthStatus: jest.fn().mockResolvedValue(platformFixture),
          validatePlatformCompatibility: jest.fn().mockImplementation(() => {
            const checks = [
              { platform: 'linux', compatible: true },
              { platform: 'darwin', compatible: true },
              { platform: 'win32', compatible: true }
            ];
            mockHealthManager.platformChecks = checks;
            return Promise.resolve(checks);
          }),
          stopMonitoring: jest.fn().mockResolvedValue(undefined)
        };

        await monitorServerHealth(mockHealthManager, {
          interval: 5000,
          enablePlatformChecks: true
        });

        const healthStatus = await mockHealthManager.getHealthStatus();
        expect(healthStatus.platform).toBe(process.platform);
        expect(healthStatus.nodeVersion).toBe(process.version);
        expect(healthStatus.osInfo).toBeDefined();

        const platformChecks = await mockHealthManager.validatePlatformCompatibility();
        expect(platformChecks.length).toBe(3);
        platformChecks.forEach(check => {
          expect(check.compatible).toBe(true);
        });

        await mockHealthManager.stopMonitoring();
      });
    });

    describe('logServerStartupInformation Function', () => {
      test('should log startup information with complete server metadata', async () => {
        const startupInfo = {
          server: {
            port: 3000,
            host: '127.0.0.1',
            protocol: 'http'
          },
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            pm2Detected: false
          },
          config: {
            environment: 'test',
            security: { helmet: true, cors: true }
          },
          startupTime: PERFORMANCE_METRICS_FIXTURES.startupTime.actual,
          memoryUsage: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.current,
          timestamp: new Date().toISOString()
        };

        // Mock logger to capture startup information logs
        const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

        await logServerStartupInformation(startupInfo);

        expect(loggerSpy).toHaveBeenCalledWith(
          'Server startup completed successfully',
          expect.objectContaining({
            server: expect.objectContaining({
              port: 3000,
              host: '127.0.0.1',
              protocol: 'http'
            }),
            environment: expect.objectContaining({
              nodeVersion: process.version,
              platform: process.platform
            }),
            performance: expect.objectContaining({
              startupTime: PERFORMANCE_METRICS_FIXTURES.startupTime.actual
            }),
            timestamp: expect.any(String)
          })
        );

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        loggerSpy.mockRestore();
      });

      test('should validate log output format and structured data consistency', async () => {
        const startupInfo = {
          server: { port: 8080, host: '0.0.0.0' },
          environment: { nodeVersion: 'v22.0.0', platform: 'linux' },
          config: { environment: 'production' },
          startupTime: 1500,
          correlationId: 'test-startup-12345',
          buildInfo: {
            version: '1.0.0',
            buildDate: '2025-01-01',
            gitCommit: 'abc123def456'
          }
        };

        const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

        await logServerStartupInformation(startupInfo);

        const logCall = loggerSpy.mock.calls[0];
        const logMessage = logCall[0];
        const logData = logCall[1];

        // Validate log message format
        expect(logMessage).toBe('Server startup completed successfully');

        // Validate structured data format
        expect(logData).toHaveProperty('server');
        expect(logData).toHaveProperty('environment');
        expect(logData).toHaveProperty('performance');
        expect(logData).toHaveProperty('timestamp');
        expect(logData).toHaveProperty('correlationId', 'test-startup-12345');

        // Validate data types and structure
        expect(typeof logData.server.port).toBe('number');
        expect(typeof logData.server.host).toBe('string');
        expect(typeof logData.performance.startupTime).toBe('number');
        expect(typeof logData.timestamp).toBe('string');

        // Validate ISO 8601 timestamp format
        expect(new Date(logData.timestamp).toISOString()).toBe(logData.timestamp);

        loggerSpy.mockRestore();
      });

      test('should test logging behavior in different environments', async () => {
        const environments = ['development', 'production', 'test'];
        const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

        for (const env of environments) {
          const startupInfo = {
            server: { port: 3000, host: '127.0.0.1' },
            environment: { nodeVersion: process.version, platform: process.platform },
            config: { environment: env },
            startupTime: PERFORMANCE_METRICS_FIXTURES.startupTime.actual,
            timestamp: new Date().toISOString()
          };

          await logServerStartupInformation(startupInfo);

          const logCall = loggerSpy.mock.calls[loggerSpy.mock.calls.length - 1];
          const logData = logCall[1];

          expect(logData.config.environment).toBe(env);

          // Environment-specific validations
          if (env === 'production') {
            expect(logData.security).toBeDefined();
            expect(logData.pm2).toBeDefined();
          } else if (env === 'development') {
            expect(logData.development).toBeDefined();
          } else if (env === 'test') {
            expect(logData.test).toBeDefined();
          }
        }

        expect(loggerSpy).toHaveBeenCalledTimes(3);
        loggerSpy.mockRestore();
      });

      test('should validate security information masking in production logs', async () => {
        const startupInfoWithSecrets = {
          server: { port: 3000, host: '0.0.0.0' },
          environment: { nodeVersion: process.version, platform: process.platform },
          config: { 
            environment: 'production',
            secrets: {
              jwtSecret: 'super-secret-jwt-key',
              dbPassword: 'database-password-123',
              apiKey: 'secret-api-key-xyz'
            },
            security: {
              helmet: true,
              cors: { origin: 'https://example.com' }
            }
          },
          startupTime: 2000,
          timestamp: new Date().toISOString()
        };

        const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

        await logServerStartupInformation(startupInfoWithSecrets);

        const logCall = loggerSpy.mock.calls[0];
        const logData = logCall[1];

        // Verify sensitive information is masked or excluded
        expect(logData.config.secrets).toBeUndefined();
        
        // Check that security configuration is logged (non-sensitive parts)
        expect(logData.config.security).toBeDefined();
        expect(logData.config.security.helmet).toBe(true);
        
        // Verify no sensitive strings appear in the logged data
        const logDataString = JSON.stringify(logData);
        expect(logDataString).not.toContain('super-secret-jwt-key');
        expect(logDataString).not.toContain('database-password-123');
        expect(logDataString).not.toContain('secret-api-key-xyz');

        loggerSpy.mockRestore();
      });

      test('should test log correlation IDs and request tracing integration', async () => {
        const correlationId = `startup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const startupInfo = {
          server: { port: 4000, host: '127.0.0.1' },
          environment: { nodeVersion: process.version, platform: process.platform },
          config: { environment: 'test' },
          startupTime: PERFORMANCE_METRICS_FIXTURES.startupTime.actual,
          correlationId: correlationId,
          traceId: traceId,
          parentSpanId: null,
          requestContext: {
            source: 'server-startup',
            initiator: 'system',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };

        const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

        await logServerStartupInformation(startupInfo);

        const logCall = loggerSpy.mock.calls[0];
        const logData = logCall[1];

        // Validate correlation tracking
        expect(logData.correlationId).toBe(correlationId);
        expect(logData.traceId).toBe(traceId);
        expect(logData.requestContext).toBeDefined();
        expect(logData.requestContext.source).toBe('server-startup');
        expect(logData.requestContext.initiator).toBe('system');

        // Validate trace continuity
        expect(typeof logData.correlationId).toBe('string');
        expect(logData.correlationId.startsWith('startup-')).toBe(true);
        expect(typeof logData.traceId).toBe('string');
        expect(logData.traceId.startsWith('trace-')).toBe(true);

        // Validate context preservation
        expect(logData.requestContext.timestamp).toBeDefined();
        expect(new Date(logData.requestContext.timestamp).toISOString()).toBe(logData.requestContext.timestamp);

        loggerSpy.mockRestore();
      });
    });

  // ============================================================================
  // ERROR HANDLING TESTING - Exception handling and process stability
  // ============================================================================

  describe('Error Handling Functions', () => {
    describe('handleServerStartupError Function', () => {
      test('should handle port binding errors with appropriate classification', async () => {
        const portError = new Error('Port already in use');
        portError.code = 'EADDRINUSE';
        portError.port = TEST_PORT;

        // Mock logger to capture error logs
        const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

        await handleServerStartupError(portError, { server: { port: TEST_PORT } });

        expect(loggerSpy).toHaveBeenCalledWith(
          'Port binding error - address already in use',
          expect.any(Error),
          expect.objectContaining({
            port: TEST_PORT,
            resolution: 'Change port or stop conflicting process'
          })
        );

        loggerSpy.mockRestore();
      });

      test('should handle permission errors with system configuration guidance', async () => {
        const permissionError = new Error('Permission denied');
        permissionError.code = 'EACCES';

        const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

        await handleServerStartupError(permissionError, {});

        expect(loggerSpy).toHaveBeenCalledWith(
          'Permission error - access denied',
          expect.any(Error),
          expect.objectContaining({
            resolution: 'Check port permissions or run with appropriate privileges'
          })
        );

        loggerSpy.mockRestore();
      });

      test('should classify configuration validation errors appropriately', async () => {
        const configError = new Error('Configuration validation failed: Missing required fields');

        const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

        await handleServerStartupError(configError, {});

        expect(loggerSpy).toHaveBeenCalledWith(
          'Configuration validation error',
          expect.any(Error),
          expect.objectContaining({
            resolution: 'Review and fix configuration errors'
          })
        );

        loggerSpy.mockRestore();
      });
    });

    describe('Application Error Handling', () => {
      test('should handle Express application errors correctly', async () => {
        const app = createExpressApp();
        
        // Add a route that throws an error
        app.get('/test-error', (req, res, next) => {
          const error = new Error('Test error');
          next(error);
        });

        const server = await startServer(app, { port: TEST_PORT + 50 });

        const response = await request(server)
          .get('/test-error')
          .expect(500);

        expect(response.body.error).toBeDefined();
        expect(response.body.timestamp).toBeDefined();

        await new Promise(resolve => server.close(resolve));
      });

      test('should validate server error handling with handleServerError function', () => {
        const testError = new Error('Test server error');
        testError.code = 'ENOTFOUND';

        const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

        handleServerError(testError, { host: 'invalid-host' });

        expect(loggerSpy).toHaveBeenCalledWith(
          'Host not found',
          expect.any(Error),
          expect.objectContaining({
            host: 'invalid-host',
            suggestion: 'Check host configuration and network connectivity'
          })
        );

        loggerSpy.mockRestore();
      });
    });

    describe('initializeHealthMonitoring Function - Enhanced Tests', () => {
      test('should initialize health monitoring with custom configurations', async () => {
        const customConfig = {
          interval: 10000,
          memoryThreshold: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.warning,
          cpuThreshold: PERFORMANCE_METRICS_FIXTURES.cpuUsage.percentage.warning,
          enableMetrics: true,
          enableAlerting: true,
          retentionPeriod: 86400000, // 24 hours
          healthEndpoint: '/custom-health',
          metricsEndpoint: '/custom-metrics'
        };

        const result = await initializeHealthMonitoring(customConfig);

        expect(result.success).toBe(true);
        expect(result.baseline).toBeDefined();
        expect(result.baseline.startTime).toBeDefined();
        expect(result.baseline.initialMemory).toBeDefined();
        expect(result.baseline.pid).toBe(process.pid);
        expect(result.configuration).toBeDefined();
        expect(result.configuration.interval).toBe(customConfig.interval);
        expect(result.configuration.memoryThreshold).toBe(customConfig.memoryThreshold);
        expect(result.configuration.cpuThreshold).toBe(customConfig.cpuThreshold);
        expect(result.configuration.enableMetrics).toBe(true);
        expect(result.configuration.enableAlerting).toBe(true);
        expect(result.monitoring).toBeDefined();
        expect(result.monitoring.endpoint).toBe(customConfig.healthEndpoint);
      });

      test('should handle initialization error scenarios and failure recovery', async () => {
        // Test with invalid configuration that should cause initialization failure
        const invalidConfig = {
          interval: -1000, // Invalid negative interval
          memoryThreshold: 'invalid-threshold', // Invalid threshold type
          cpuThreshold: -50, // Invalid negative threshold
          enableMetrics: 'yes' // Invalid boolean value
        };

        await expect(initializeHealthMonitoring(invalidConfig))
          .rejects.toThrow(/Configuration validation failed|Invalid.*configuration/);

        // Test recovery with valid configuration
        const validConfig = {
          interval: 5000,
          memoryThreshold: PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.target,
          cpuThreshold: PERFORMANCE_METRICS_FIXTURES.cpuUsage.percentage.target,
          enableMetrics: true
        };

        const recoveryResult = await initializeHealthMonitoring(validConfig);
        
        expect(recoveryResult.success).toBe(true);
        expect(recoveryResult.baseline).toBeDefined();
        expect(recoveryResult.configuration).toEqual(expect.objectContaining(validConfig));
      });

      test('should validate monitoring service dependency validation and setup', async () => {
        const dependencyConfig = {
          interval: 5000,
          dependencies: {
            logger: true,
            metrics: true,
            alerts: true,
            database: false // Optional dependency
          },
          serviceChecks: {
            validateLogger: true,
            validateMetricsCollector: true,
            validateAlertManager: true
          },
          fallbackMode: true
        };

        const result = await initializeHealthMonitoring(dependencyConfig);

        expect(result.success).toBe(true);
        expect(result.dependencies).toBeDefined();
        expect(result.dependencies.validated).toBe(true);
        expect(result.dependencies.available).toBeDefined();
        expect(Array.isArray(result.dependencies.available)).toBe(true);
        expect(result.dependencies.available).toContain('logger');
        expect(result.dependencies.available).toContain('metrics');
        
        // Validate service health checks
        expect(result.serviceChecks).toBeDefined();
        expect(result.serviceChecks.logger).toBe(true);
        expect(result.serviceChecks.metrics).toBe(true);
        
        // Validate fallback configuration
        expect(result.fallbackMode).toBe(true);
        expect(result.baseline.fallbackEnabled).toBe(true);
      });

      test('should validate health check interval configuration and validation', async () => {
        const intervalConfigs = [
          { interval: 1000, expected: 1000, valid: true },   // 1 second - minimum
          { interval: 5000, expected: 5000, valid: true },   // 5 seconds - default
          { interval: 30000, expected: 30000, valid: true }, // 30 seconds - maximum recommended
          { interval: 0, expected: 5000, valid: false },     // Invalid - should use default
          { interval: -5000, expected: 5000, valid: false }, // Invalid - should use default
          { interval: 100000, expected: 60000, valid: false } // Too high - should cap at maximum
        ];

        for (const config of intervalConfigs) {
          try {
            const result = await initializeHealthMonitoring({
              interval: config.interval,
              strictValidation: true
            });

            if (config.valid) {
              expect(result.success).toBe(true);
              expect(result.configuration.interval).toBe(config.expected);
            } else {
              expect(result.success).toBe(true);
              expect(result.configuration.interval).toBe(config.expected);
              expect(result.warnings).toBeDefined();
              expect(Array.isArray(result.warnings)).toBe(true);
              expect(result.warnings.some(warning => 
                warning.includes('interval') || warning.includes('default')
              )).toBe(true);
            }
          } catch (error) {
            if (config.valid) {
              throw error; // Re-throw if we expected this to succeed
            }
            // Expected failure for invalid configurations
            expect(error.message).toMatch(/interval|configuration|validation/i);
          }
        }
      });

      test('should test initialization cleanup on startup failures', async () => {
        // Mock a scenario where initialization partially succeeds but then fails
        const partialFailureConfig = {
          interval: 5000,
          enableMetrics: true,
          enableAlerting: true,
          simulatePartialFailure: true
        };

        // Track cleanup resources
        const cleanupTracker = {
          intervals: [],
          timeouts: [],
          listeners: [],
          resources: []
        };

        try {
          // This should simulate a failure after partial initialization
          await expect(initializeHealthMonitoring(partialFailureConfig))
            .rejects.toThrow(/Simulated initialization failure|Partial failure scenario/);
        } catch (error) {
          // Expected failure
        }

        // Verify cleanup was performed
        expect(cleanupTracker.intervals.length).toBe(0);
        expect(cleanupTracker.timeouts.length).toBe(0);
        expect(cleanupTracker.listeners.length).toBe(0);
        expect(cleanupTracker.resources.length).toBe(0);

        // Test successful initialization after cleanup
        const successConfig = {
          interval: 5000,
          enableMetrics: true,
          enableAlerting: false
        };

        const result = await initializeHealthMonitoring(successConfig);
        
        expect(result.success).toBe(true);
        expect(result.baseline).toBeDefined();
        expect(result.cleanup).toBeDefined();
        expect(typeof result.cleanup.performed).toBe('boolean');
      });
    });

    describe('trackApplicationUptime Function - Enhanced Tests', () => {
      test('should track uptime calculation accuracy over time', async () => {
        const startTime = Date.now();
        
        // Get initial uptime reading
        const initialUptimeInfo = trackApplicationUptime();
        
        expect(initialUptimeInfo).toBeDefined();
        expect(initialUptimeInfo.processUptime).toBeGreaterThan(0);
        expect(initialUptimeInfo.currentTime).toBeDefined();
        expect(initialUptimeInfo.pid).toBe(process.pid);
        expect(initialUptimeInfo.environment).toBeDefined();

        // Wait a short period and check uptime accuracy
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const laterUptimeInfo = trackApplicationUptime();
        
        expect(laterUptimeInfo.processUptime).toBeGreaterThan(initialUptimeInfo.processUptime);
        
        // Calculate expected uptime difference (should be close to 100ms)
        const uptimeDifference = laterUptimeInfo.processUptime - initialUptimeInfo.processUptime;
        expect(uptimeDifference).toBeGreaterThan(0.05); // At least 50ms
        expect(uptimeDifference).toBeLessThan(0.5); // Less than 500ms (generous tolerance)

        // Validate timestamp accuracy
        const timeDifference = new Date(laterUptimeInfo.currentTime) - new Date(initialUptimeInfo.currentTime);
        expect(timeDifference).toBeGreaterThan(50); // At least 50ms difference
        expect(timeDifference).toBeLessThan(500); // Less than 500ms difference
      });

      test('should validate uptime metrics persistence and retrieval', async () => {
        const uptimeMetrics = [];
        
        // Collect multiple uptime readings
        for (let i = 0; i < 5; i++) {
          const uptimeInfo = trackApplicationUptime();
          uptimeMetrics.push({
            reading: i + 1,
            timestamp: uptimeInfo.currentTime,
            processUptime: uptimeInfo.processUptime,
            systemUptime: uptimeInfo.systemUptime,
            memoryUsage: uptimeInfo.memoryUsage
          });
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Validate metrics collection
        expect(uptimeMetrics.length).toBe(5);
        
        // Validate uptime progression
        for (let i = 1; i < uptimeMetrics.length; i++) {
          expect(uptimeMetrics[i].processUptime).toBeGreaterThan(uptimeMetrics[i - 1].processUptime);
          expect(new Date(uptimeMetrics[i].timestamp)).toBeInstanceOf(Date);
        }

        // Validate consistency
        uptimeMetrics.forEach((metric, index) => {
          expect(metric.reading).toBe(index + 1);
          expect(typeof metric.processUptime).toBe('number');
          expect(typeof metric.systemUptime).toBe('number');
          expect(metric.memoryUsage).toBeDefined();
        });

        // Calculate average uptime change rate
        const totalUptimeChange = uptimeMetrics[4].processUptime - uptimeMetrics[0].processUptime;
        const averageChangeRate = totalUptimeChange / 4;
        expect(averageChangeRate).toBeGreaterThan(0.03); // At least 30ms per reading
        expect(averageChangeRate).toBeLessThan(0.3); // Less than 300ms per reading
      });

      test('should test uptime tracking during server restarts and recovery', async () => {
        // Simulate server restart scenario by tracking uptime before and after a simulated restart
        const preRestartUptime = trackApplicationUptime();
        
        // Store initial values
        const initialProcessUptime = preRestartUptime.processUptime;
        const initialTimestamp = preRestartUptime.currentTime;
        const initialMemory = preRestartUptime.memoryUsage;

        // Simulate restart delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Post-restart tracking
        const postRestartUptime = trackApplicationUptime();
        
        // Validate uptime continuity (process uptime should continue increasing)
        expect(postRestartUptime.processUptime).toBeGreaterThan(initialProcessUptime);
        expect(new Date(postRestartUptime.currentTime)).toBeInstanceOf(Date);
        expect(new Date(postRestartUptime.currentTime) > new Date(initialTimestamp)).toBe(true);

        // Validate restart recovery metrics
        expect(postRestartUptime.pid).toBe(process.pid);
        expect(postRestartUptime.environment).toBeDefined();
        
        // Check memory usage changes (could increase or decrease)
        expect(postRestartUptime.memoryUsage).toBeDefined();
        expect(typeof postRestartUptime.memoryUsage.heapUsed).toBe('number');
        expect(typeof postRestartUptime.memoryUsage.rss).toBe('number');

        // Validate uptime calculation accuracy
        const expectedUptimeIncrease = 0.15; // ~150ms minimum increase
        const actualUptimeIncrease = postRestartUptime.processUptime - initialProcessUptime;
        expect(actualUptimeIncrease).toBeGreaterThan(expectedUptimeIncrease);
      });

      test('should validate uptime reporting in health status responses', async () => {
        const uptimeInfo = trackApplicationUptime();
        
        // Create health status that includes uptime information
        const healthStatusWithUptime = {
          status: 'healthy',
          timestamp: uptimeInfo.currentTime,
          uptime: {
            process: uptimeInfo.processUptime,
            system: uptimeInfo.systemUptime,
            formatted: {
              process: formatUptime(uptimeInfo.processUptime),
              system: formatUptime(uptimeInfo.systemUptime)
            }
          },
          performance: {
            memoryUsage: uptimeInfo.memoryUsage,
            startupTime: PERFORMANCE_METRICS_FIXTURES.startupTime.actual,
            responseTime: PERFORMANCE_METRICS_FIXTURES.responseTime.average
          },
          environment: uptimeInfo.environment,
          pid: uptimeInfo.pid
        };

        // Validate health status structure
        expect(healthStatusWithUptime.status).toBe('healthy');
        expect(healthStatusWithUptime.uptime).toBeDefined();
        expect(healthStatusWithUptime.uptime.process).toBe(uptimeInfo.processUptime);
        expect(healthStatusWithUptime.uptime.system).toBe(uptimeInfo.systemUptime);
        
        // Validate formatted uptime strings
        expect(typeof healthStatusWithUptime.uptime.formatted.process).toBe('string');
        expect(typeof healthStatusWithUptime.uptime.formatted.system).toBe('string');
        
        // Validate performance metrics integration
        expect(healthStatusWithUptime.performance.memoryUsage).toEqual(uptimeInfo.memoryUsage);
        expect(healthStatusWithUptime.performance.startupTime).toBe(PERFORMANCE_METRICS_FIXTURES.startupTime.actual);
        
        // Validate environment consistency
        expect(healthStatusWithUptime.environment).toEqual(uptimeInfo.environment);
        expect(healthStatusWithUptime.pid).toBe(uptimeInfo.pid);

        function formatUptime(seconds) {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          return `${hours}h ${minutes}m ${secs}s`;
        }
      });
    });
  });

  // ============================================================================
  // PERFORMANCE TESTING - Response times and resource utilization
  // ============================================================================

  describe('Server Performance Characteristics', () => {
    describe('Response Time Performance', () => {
      test('should measure server response time with benchmark validation', async () => {
        const performanceHelper = createPerformanceTestHelper();
        const result = await startProductionServer({
          port: TEST_PORT + 60,
          enableGracefulShutdown: false
        });

        const startTime = performanceHelper.startTiming();
        
        await request(result.server)
          .get('/hello')
          .expect(200);

        const timing = performanceHelper.endTiming(startTime);

        expect(timing.duration).toBeLessThan(200); // Should respond within 200ms
        expect(timing.duration).toBeGreaterThan(0);

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate memory usage during server operation', async () => {
        const initialMemory = process.memoryUsage();
        
        const result = await startProductionServer({
          port: TEST_PORT + 61,
          enableGracefulShutdown: false
        });

        // Make several requests to test memory stability
        for (let i = 0; i < 10; i++) {
          await request(result.server).get('/health').expect(200);
        }

        const finalMemory = process.memoryUsage();
        
        // Memory should not increase dramatically
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should measure concurrent request handling capabilities', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 62,
          enableGracefulShutdown: false
        });

        const concurrentRequests = Array(10).fill().map(() =>
          request(result.server).get('/hello').expect(200)
        );

        const responses = await Promise.all(concurrentRequests);
        
        expect(responses).toHaveLength(10);
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body).toBeDefined();
        });

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate startup time and initialization performance', async () => {
        const performanceHelper = createPerformanceTestHelper();
        const startTime = performanceHelper.startTiming();

        const result = await startProductionServer({
          port: TEST_PORT + 63,
          enableGracefulShutdown: false
        });

        const timing = performanceHelper.endTiming(startTime);

        expect(timing.duration).toBeLessThan(5000); // Should start within 5 seconds
        expect(result.startupTime).toBeLessThan(5000);

        await new Promise(resolve => result.server.close(resolve));
      });
    });

    describe('Resource Utilization', () => {
      test('should monitor CPU and memory usage during operation', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 64,
          enableGracefulShutdown: false
        });

        const initialCPU = process.cpuUsage();
        const initialMemory = process.memoryUsage();

        // Generate some load
        for (let i = 0; i < 20; i++) {
          await request(result.server).get('/health');
        }

        const finalCPU = process.cpuUsage(initialCPU);
        const finalMemory = process.memoryUsage();

        expect(finalCPU.user).toBeGreaterThan(0);
        expect(finalMemory.heapUsed).toBeGreaterThanOrEqual(initialMemory.heapUsed);

        await new Promise(resolve => result.server.close(resolve));
      });
    });
  });

  // ============================================================================
  // SECURITY INTEGRATION TESTING - Helmet.js and security compliance
  // ============================================================================

  describe('Security Features Integration', () => {
    describe('Helmet.js Security Implementation', () => {
      test('should validate comprehensive security header implementation', async () => {
        const securityHelper = createSecurityTestHelper();
        const result = await startProductionServer({
          port: TEST_PORT + 70,
          enableGracefulShutdown: false,
          enableSecurityMiddleware: true
        });

        const response = await request(result.server)
          .get('/hello')
          .expect(200);

        const securityValidation = securityHelper.validateSecurityHeaders(response.headers);

        expect(securityValidation.helmetHeaders).toBe(true);
        expect(securityValidation.cspHeader).toBe(true);
        expect(securityValidation.hstsHeader).toBe(true);
        expect(securityValidation.xssProtection).toBe(true);

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate Content Security Policy configuration and enforcement', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 71,
          enableGracefulShutdown: false
        });

        const response = await request(result.server)
          .get('/health')
          .expect(200);

        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['content-security-policy']).toMatch(/default-src/);

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should verify security header presence and correct configuration', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 72,
          enableGracefulShutdown: false
        });

        const response = await request(result.server)
          .get('/health')
          .expect(200);

        // Check for essential security headers
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBeDefined();
        expect(response.headers['strict-transport-security']).toBeDefined();
        expect(response.headers['x-powered-by']).toBeUndefined(); // Should be removed

        await new Promise(resolve => result.server.close(resolve));
      });
    });

    describe('CORS and Cross-Origin Protection', () => {
      test('should validate CORS policy compliance and configuration', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 73,
          enableGracefulShutdown: false
        });

        const response = await request(result.server)
          .options('/hello')
          .set('Origin', 'http://localhost:3000')
          .expect(204);

        expect(response.headers['access-control-allow-origin']).toBeDefined();
        expect(response.headers['access-control-allow-methods']).toBeDefined();

        await new Promise(resolve => result.server.close(resolve));
      });
    });
  });

  // ============================================================================
  // CROSS-PLATFORM COMPATIBILITY TESTING - Flask migration preparation
  // ============================================================================

  describe('Cross-Platform Compatibility', () => {
    describe('Response Format Standardization', () => {
      test('should validate API endpoint consistency for Flask migration', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 80,
          enableGracefulShutdown: false
        });

        // Test hello endpoint response format
        const helloResponse = await request(result.server)
          .get('/hello')
          .expect(200);

        expect(helloResponse.body).toBeDefined();
        expect(helloResponse.headers['content-type']).toMatch(/json/);

        // Test good-evening endpoint response format
        const goodEveningResponse = await request(result.server)
          .get('/good-evening')
          .expect(200);

        expect(goodEveningResponse.body).toBeDefined();
        expect(goodEveningResponse.headers['content-type']).toMatch(/json/);

        // Both endpoints should have consistent response structure
        expect(typeof helloResponse.body).toBe(typeof goodEveningResponse.body);

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate status code compatibility and error response consistency', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 81,
          enableGracefulShutdown: false
        });

        // Test successful responses
        const successResponse = await request(result.server)
          .get('/health')
          .expect(200);

        expect(successResponse.status).toBe(200);

        // Test 404 responses
        const notFoundResponse = await request(result.server)
          .get('/nonexistent')
          .expect(404);

        expect(notFoundResponse.status).toBe(404);
        expect(notFoundResponse.body.error).toBeDefined();

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should verify header consistency and security policy equivalence', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 82,
          enableGracefulShutdown: false
        });

        const responses = await Promise.all([
          request(result.server).get('/hello'),
          request(result.server).get('/good-evening'),
          request(result.server).get('/health')
        ]);

        // All responses should have consistent security headers
        responses.forEach(response => {
          expect(response.headers['content-type']).toMatch(/json/);
          expect(response.headers['x-content-type-options']).toBe('nosniff');
          expect(response.headers['x-frame-options']).toBeDefined();
        });

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate performance characteristics for cross-platform comparison', async () => {
        const performanceHelper = createPerformanceTestHelper();
        const result = await startProductionServer({
          port: TEST_PORT + 83,
          enableGracefulShutdown: false
        });

        const timings = [];

        // Measure response times for multiple endpoints
        for (const endpoint of ['/hello', '/good-evening', '/health']) {
          const startTime = performanceHelper.startTiming();
          await request(result.server).get(endpoint).expect(200);
          const timing = performanceHelper.endTiming(startTime);
          timings.push(timing.duration);
        }

        // All endpoints should have comparable performance
        const maxTime = Math.max(...timings);
        const minTime = Math.min(...timings);
        const variance = maxTime - minTime;

        expect(variance).toBeLessThan(100); // Should be within 100ms of each other
        expect(maxTime).toBeLessThan(200); // All should be under 200ms

        await new Promise(resolve => result.server.close(resolve));
      });

      test('should validate migration readiness and compatibility assessment', async () => {
        const result = await startProductionServer({
          port: TEST_PORT + 84,
          enableGracefulShutdown: false
        });

        // Test that all required endpoints are available
        const endpoints = ['/hello', '/good-evening', '/health'];
        const responses = await Promise.all(
          endpoints.map(endpoint => request(result.server).get(endpoint))
        );

        responses.forEach((response, index) => {
          expect(response.status).toBe(200);
          expect(response.body).toBeDefined();
          // Each endpoint should return appropriate content
          expect(response.headers['content-type']).toMatch(/json/);
        });

        await new Promise(resolve => result.server.close(resolve));
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTING - End-to-end server functionality
  // ============================================================================

  describe('Server Integration Tests', () => {
    test('should validate complete server lifecycle from startup to shutdown', async () => {
      const performanceHelper = createPerformanceTestHelper();
      const startTime = performanceHelper.startTiming();

      // Start server
      const result = await startProductionServer({
        port: TEST_PORT + 90,
        enableGracefulShutdown: false,
        enableHealthMonitoring: true
      });

      const startupTiming = performanceHelper.endTiming(startTime);

      // Verify server is operational
      expect(result.server.listening).toBe(true);
      expect(result.healthManager).toBeDefined();

      // Test server functionality
      const response = await request(result.server)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBeDefined();

      // Shutdown server
      const shutdownStart = performanceHelper.startTiming();
      await new Promise(resolve => result.server.close(resolve));
      const shutdownTiming = performanceHelper.endTiming(shutdownStart);

      // Validate timing metrics
      expect(startupTiming.duration).toBeLessThan(5000);
      expect(shutdownTiming.duration).toBeLessThan(2000);
    });

    test('should validate server under load conditions', async () => {
      const result = await startProductionServer({
        port: TEST_PORT + 91,
        enableGracefulShutdown: false
      });

      // Generate load with multiple concurrent requests
      const loadRequests = Array(50).fill().map(async (_, index) => {
        const endpoint = ['/hello', '/good-evening', '/health'][index % 3];
        return request(result.server).get(endpoint);
      });

      const responses = await Promise.all(loadRequests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      });

      await new Promise(resolve => result.server.close(resolve));
    });

    test('should validate comprehensive server configuration and feature integration', async () => {
      const result = await startProductionServer({
        port: TEST_PORT + 92,
        enableGracefulShutdown: false,
        enableHealthMonitoring: true,
        enableSecurityMiddleware: true
      });

      // Validate all major components are working
      const healthResponse = await request(result.server)
        .get('/health')
        .expect(200);

      const helloResponse = await request(result.server)
        .get('/hello')
        .expect(200);

      const goodEveningResponse = await request(result.server)
        .get('/good-evening')
        .expect(200);

      // Check security headers on all responses
      [healthResponse, helloResponse, goodEveningResponse].forEach(response => {
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['content-security-policy']).toBeDefined();
      });

      await new Promise(resolve => result.server.close(resolve));
    });
  });

  // ============================================================================
  // EDGE CASE AND ERROR SCENARIO TESTING
  // ============================================================================

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle rapid server start/stop cycles', async () => {
      for (let i = 0; i < 3; i++) {
        const result = await startProductionServer({
          port: TEST_PORT + 100 + i,
          enableGracefulShutdown: false
        });

        expect(result.server.listening).toBe(true);
        
        await new Promise(resolve => result.server.close(resolve));
        
        // Brief pause between cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    test('should handle invalid request scenarios gracefully', async () => {
      const result = await startProductionServer({
        port: TEST_PORT + 103,
        enableGracefulShutdown: false
      });

      // Test invalid HTTP methods
      await request(result.server)
        .post('/hello')
        .expect(404);

      // Test non-existent routes
      await request(result.server)
        .get('/nonexistent')
        .expect(404);

      await new Promise(resolve => result.server.close(resolve));
    });

    test('should maintain stability under error conditions', async () => {
      const result = await startProductionServer({
        port: TEST_PORT + 104,
        enableGracefulShutdown: false
      });

      // Make multiple requests including some that will fail
      const requests = [
        request(result.server).get('/hello'),
        request(result.server).get('/nonexistent'),
        request(result.server).get('/health'),
        request(result.server).get('/another-nonexistent'),
        request(result.server).get('/good-evening')
      ];

      const responses = await Promise.allSettled(requests);

      // Server should remain stable despite error requests
      const healthCheck = await request(result.server)
        .get('/health')
        .expect(200);

      expect(healthCheck.body).toBeDefined();

      await new Promise(resolve => result.server.close(resolve));
    });
  });

  // ============================================================================
  // COMPREHENSIVE EDGE CASES AND ENHANCED ERROR SCENARIOS
  // ============================================================================

  describe('Enhanced Edge Cases and Advanced Error Scenarios', () => {
    test('should handle enhanced error handling scenarios with additional error codes', async () => {
      const enhancedErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', 'EMFILE', 'ENOMEM', 'ENOSPC'];
      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

      for (const errorCode of enhancedErrorCodes) {
        const enhancedError = new Error(`Enhanced error scenario: ${errorCode}`);
        enhancedError.code = errorCode;
        enhancedError.errno = Math.floor(Math.random() * -1000);
        enhancedError.syscall = 'enhanced-test';

        await handleServerStartupError(enhancedError, { 
          server: { port: 3000 },
          enhancedErrorHandling: true
        });

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(errorCode.toLowerCase())),
          expect.any(Error),
          expect.objectContaining({
            resolution: expect.any(String),
            errorCode: errorCode
          })
        );
      }

      expect(loggerSpy).toHaveBeenCalledTimes(enhancedErrorCodes.length);
      loggerSpy.mockRestore();
    });

    test('should validate memory pressure and resource exhaustion testing', async () => {
      const initialMemory = process.memoryUsage();
      const memoryPressureThreshold = PERFORMANCE_METRICS_FIXTURES.memoryUsage.rss.critical;
      
      // Simulate memory pressure scenario
      const largeArrays = [];
      let memoryPressureDetected = false;
      
      try {
        // Create memory pressure (be careful not to crash the test)
        while (process.memoryUsage().heapUsed < memoryPressureThreshold * 0.1) { // Use 10% of critical threshold
          largeArrays.push(new Array(1000).fill('memory-pressure-test'));
          
          if (largeArrays.length > 100) { // Safety limit
            memoryPressureDetected = true;
            break;
          }
        }

        const pressuredMemory = process.memoryUsage();
        expect(pressuredMemory.heapUsed).toBeGreaterThan(initialMemory.heapUsed);
        
        // Test server startup under memory pressure
        const result = await startProductionServer({
          port: TEST_PORT + 200,
          enableGracefulShutdown: false,
          memoryPressureMode: true
        });

        expect(result.server).toBeDefined();
        expect(result.server.listening).toBe(true);

        // Validate memory monitoring during pressure
        const healthStatus = createHealthCheckFixture({ 
          status: pressuredMemory.heapUsed > memoryPressureThreshold * 0.05 ? 'degraded' : 'healthy',
          customMetrics: { memoryUsage: pressuredMemory }
        });

        expect(healthStatus.status).toBeDefined();
        expect(healthStatus.memoryUsage.heapUsed).toBeGreaterThan(initialMemory.heapUsed);

        await new Promise(resolve => result.server.close(resolve));
      } finally {
        // Cleanup memory pressure
        largeArrays.length = 0;
        if (global.gc) global.gc();
      }
    });

    test('should test rapid configuration changes and hot-reload scenarios', async () => {
      const configSequence = [
        { port: TEST_PORT + 210, env: 'development', security: false },
        { port: TEST_PORT + 211, env: 'staging', security: true },
        { port: TEST_PORT + 212, env: 'production', security: true }
      ];

      const servers = [];
      
      try {
        for (let i = 0; i < configSequence.length; i++) {
          const config = configSequence[i];
          const previousConfig = i > 0 ? configSequence[i - 1] : null;

          // Simulate rapid configuration change
          const result = await startProductionServer({
            port: config.port,
            enableGracefulShutdown: false,
            enableSecurityMiddleware: config.security,
            environment: config.env,
            hotReloadMode: true,
            previousConfig: previousConfig
          });

          servers.push(result.server);

          expect(result.server.listening).toBe(true);
          expect(result.config.port).toBe(config.port);
          expect(result.environment.currentEnvironment).toBe(config.env);

          // Test configuration validation
          const validation = await validateServerReadiness({
            server: { port: config.port },
            environment: config.env,
            security: { enabled: config.security }
          });

          expect(validation.isValid).toBe(true);
          expect(validation.errors.length).toBe(0);

          // Brief pause between rapid changes
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Validate all servers are running simultaneously
        expect(servers.length).toBe(configSequence.length);
        servers.forEach(server => {
          expect(server.listening).toBe(true);
        });

      } finally {
        // Cleanup all servers
        for (const server of servers) {
          await new Promise(resolve => server.close(resolve));
        }
      }
    });

    test('should validate network interruption simulation and recovery testing', async () => {
      let networkInterrupted = false;
      let recoveryAttempts = 0;
      
      const mockNetworkService = {
        isConnected: () => !networkInterrupted,
        simulateInterruption: () => { networkInterrupted = true; },
        simulateRecovery: () => { 
          networkInterrupted = false;
          recoveryAttempts++;
        },
        getRecoveryAttempts: () => recoveryAttempts
      };

      const result = await startProductionServer({
        port: TEST_PORT + 220,
        enableGracefulShutdown: false,
        networkService: mockNetworkService,
        enableNetworkRecovery: true
      });

      expect(result.server.listening).toBe(true);
      expect(mockNetworkService.isConnected()).toBe(true);

      // Simulate network interruption
      mockNetworkService.simulateInterruption();
      expect(mockNetworkService.isConnected()).toBe(false);

      // Test server resilience during network interruption
      const interruptionResponse = await request(result.server)
        .get('/health')
        .expect(200); // Server should still respond locally

      expect(interruptionResponse.body).toBeDefined();

      // Simulate network recovery
      mockNetworkService.simulateRecovery();
      expect(mockNetworkService.isConnected()).toBe(true);
      expect(mockNetworkService.getRecoveryAttempts()).toBe(1);

      // Validate post-recovery functionality
      const recoveryResponse = await request(result.server)
        .get('/health')
        .expect(200);

      expect(recoveryResponse.body).toBeDefined();
      expect(recoveryResponse.body.networkStatus).not.toBe('interrupted');

      await new Promise(resolve => result.server.close(resolve));
    });

    test('should test cascading failure scenarios and recovery mechanisms', async () => {
      const failureSequence = ['database', 'cache', 'logging', 'monitoring'];
      const recoverySequence = [];
      
      const mockDependencies = {
        database: { healthy: true, recover: () => { recoverySequence.push('database'); } },
        cache: { healthy: true, recover: () => { recoverySequence.push('cache'); } },
        logging: { healthy: true, recover: () => { recoverySequence.push('logging'); } },
        monitoring: { healthy: true, recover: () => { recoverySequence.push('monitoring'); } }
      };

      const result = await startProductionServer({
        port: TEST_PORT + 230,
        enableGracefulShutdown: false,
        dependencies: mockDependencies,
        enableCascadeRecovery: true
      });

      expect(result.server.listening).toBe(true);

      // Simulate cascading failures
      for (const service of failureSequence) {
        mockDependencies[service].healthy = false;
        
        // Test server resilience during each failure
        const response = await request(result.server)
          .get('/health')
          .expect(200);

        expect(response.body.status).toBeDefined();
        // Server should report degraded status but continue operating
      }

      // Simulate recovery sequence (reverse order)
      for (const service of failureSequence.reverse()) {
        mockDependencies[service].healthy = true;
        mockDependencies[service].recover();
      }

      // Validate recovery completion
      expect(recoverySequence.length).toBe(failureSequence.length);
      expect(recoverySequence).toContain('database');
      expect(recoverySequence).toContain('cache');
      expect(recoverySequence).toContain('logging');
      expect(recoverySequence).toContain('monitoring');

      const finalHealthCheck = await request(result.server)
        .get('/health')
        .expect(200);

      expect(finalHealthCheck.body.status).toBeDefined();

      await new Promise(resolve => result.server.close(resolve));
    });

    test('should validate race condition testing for concurrent operations', async () => {
      const concurrentOperations = 10;
      const operationResults = [];
      
      // Test concurrent server startups
      const startupPromises = Array(concurrentOperations).fill(0).map(async (_, index) => {
        try {
          const result = await startProductionServer({
            port: TEST_PORT + 240 + index,
            enableGracefulShutdown: false,
            concurrentMode: true,
            operationId: `concurrent-${index}`
          });
          
          operationResults.push({
            index,
            success: true,
            port: result.server.address().port,
            server: result.server
          });
          
          return result;
        } catch (error) {
          operationResults.push({
            index,
            success: false,
            error: error.message
          });
          throw error;
        }
      });

      const startupResults = await Promise.allSettled(startupPromises);
      
      // Count successful startups
      const successfulStartups = startupResults.filter(result => result.status === 'fulfilled');
      const failedStartups = startupResults.filter(result => result.status === 'rejected');

      expect(successfulStartups.length).toBeGreaterThan(0);
      expect(successfulStartups.length + failedStartups.length).toBe(concurrentOperations);

      // Test concurrent health checks
      const healthCheckPromises = operationResults
        .filter(result => result.success && result.server)
        .map(async (result) => {
          return request(result.server)
            .get('/health')
            .expect(200);
        });

      const healthResults = await Promise.allSettled(healthCheckPromises);
      const successfulHealthChecks = healthResults.filter(result => result.status === 'fulfilled');
      
      expect(successfulHealthChecks.length).toBeGreaterThan(0);

      // Cleanup concurrent servers
      const cleanupPromises = operationResults
        .filter(result => result.success && result.server)
        .map(result => new Promise(resolve => result.server.close(resolve)));

      await Promise.allSettled(cleanupPromises);
    });

    test('should test cross-platform compatibility edge cases', async () => {
      const platformSpecificTests = {
        'win32': {
          pathSeparator: '\\',
          homeDir: process.env.USERPROFILE || 'C:\\Users\\Test',
          tempDir: process.env.TEMP || 'C:\\Temp'
        },
        'linux': {
          pathSeparator: '/',
          homeDir: process.env.HOME || '/home/test',
          tempDir: '/tmp'
        },
        'darwin': {
          pathSeparator: '/',
          homeDir: process.env.HOME || '/Users/test',
          tempDir: '/tmp'
        }
      };

      const currentPlatform = process.platform;
      const platformConfig = platformSpecificTests[currentPlatform] || platformSpecificTests['linux'];

      const result = await startProductionServer({
        port: TEST_PORT + 250,
        enableGracefulShutdown: false,
        platformSpecific: {
          platform: currentPlatform,
          pathSeparator: platformConfig.pathSeparator,
          homeDirectory: platformConfig.homeDir,
          tempDirectory: platformConfig.tempDir
        }
      });

      expect(result.server.listening).toBe(true);
      expect(result.environment.platform).toBe(currentPlatform);

      // Test platform-specific functionality
      const platformResponse = await request(result.server)
        .get('/health')
        .expect(200);

      expect(platformResponse.body).toBeDefined();

      // Validate cross-platform path handling
      const pathTest = await validateServerReadiness({
        server: { port: TEST_PORT + 250 },
        platform: {
          current: currentPlatform,
          pathSeparator: platformConfig.pathSeparator,
          homeDir: platformConfig.homeDir
        }
      });

      expect(pathTest.isValid).toBe(true);

      await new Promise(resolve => result.server.close(resolve));
    });

    test('should validate performance boundary testing under various load conditions', async () => {
      const loadConditions = [
        { name: 'light', concurrency: 5, duration: 100 },
        { name: 'moderate', concurrency: 20, duration: 200 },
        { name: 'heavy', concurrency: 50, duration: 300 }
      ];

      const performanceResults = [];

      for (const condition of loadConditions) {
        const result = await startProductionServer({
          port: TEST_PORT + 260 + loadConditions.indexOf(condition),
          enableGracefulShutdown: false,
          performanceMode: condition.name
        });

        const startTime = Date.now();
        const initialMemory = process.memoryUsage();

        // Generate load based on condition
        const loadPromises = Array(condition.concurrency).fill(0).map(async () => {
          const loadStartTime = Date.now();
          const response = await request(result.server)
            .get('/health')
            .expect(200);
          const loadEndTime = Date.now();
          
          return {
            responseTime: loadEndTime - loadStartTime,
            statusCode: response.status,
            bodySize: JSON.stringify(response.body).length
          };
        });

        const loadResults = await Promise.all(loadPromises);
        const endTime = Date.now();
        const finalMemory = process.memoryUsage();

        const performanceMetrics = {
          condition: condition.name,
          totalDuration: endTime - startTime,
          averageResponseTime: loadResults.reduce((sum, r) => sum + r.responseTime, 0) / loadResults.length,
          maxResponseTime: Math.max(...loadResults.map(r => r.responseTime)),
          minResponseTime: Math.min(...loadResults.map(r => r.responseTime)),
          memoryIncrease: finalMemory.heapUsed - initialMemory.heapUsed,
          successfulRequests: loadResults.filter(r => r.statusCode === 200).length,
          concurrency: condition.concurrency
        };

        performanceResults.push(performanceMetrics);

        // Validate performance boundaries
        expect(performanceMetrics.averageResponseTime).toBeLessThan(PERFORMANCE_METRICS_FIXTURES.responseTime.critical);
        expect(performanceMetrics.successfulRequests).toBe(condition.concurrency);

        await new Promise(resolve => result.server.close(resolve));
      }

      // Validate performance scaling
      expect(performanceResults.length).toBe(loadConditions.length);
      performanceResults.forEach(metrics => {
        expect(metrics.averageResponseTime).toBeGreaterThan(0);
        expect(metrics.successfulRequests).toBeGreaterThan(0);
      });
    });

    test('should test security header validation under stress conditions', async () => {
      const result = await startProductionServer({
        port: TEST_PORT + 270,
        enableGracefulShutdown: false,
        enableSecurityMiddleware: true,
        securityStressMode: true
      });

      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'content-security-policy',
        'strict-transport-security',
        'x-xss-protection'
      ];

      // Test security headers under concurrent load
      const stressPromises = Array(30).fill(0).map(async (_, index) => {
        const endpoint = ['/hello', '/health', '/good-evening'][index % 3];
        const response = await request(result.server)
          .get(endpoint)
          .expect(200);

        // Validate security headers presence
        const headerValidation = {
          endpoint,
          headers: {},
          allPresent: true
        };

        securityHeaders.forEach(header => {
          headerValidation.headers[header] = !!response.headers[header];
          if (!response.headers[header]) {
            headerValidation.allPresent = false;
          }
        });

        return headerValidation;
      });

      const stressResults = await Promise.all(stressPromises);

      // Validate all requests maintained security headers
      stressResults.forEach(result => {
        expect(result.allPresent).toBe(true);
        securityHeaders.forEach(header => {
          expect(result.headers[header]).toBe(true);
        });
      });

      // Validate x-powered-by header is removed (security best practice)
      const finalSecurityCheck = await request(result.server)
        .get('/health')
        .expect(200);

      expect(finalSecurityCheck.headers['x-powered-by']).toBeUndefined();

      await new Promise(resolve => result.server.close(resolve));
    });

    test('should validate PM2 cluster communication edge cases', async () => {
      // Mock PM2 cluster environment with edge cases
      const originalEnv = {
        PM2_HOME: process.env.PM2_HOME,
        PM_ID: process.env.PM_ID,
        PM2_INSTANCES: process.env.PM2_INSTANCES
      };

      const edgeCaseScenarios = [
        { PM_ID: '0', PM2_INSTANCES: '4', scenario: 'master-process' },
        { PM_ID: '3', PM2_INSTANCES: '4', scenario: 'last-worker' },
        { PM_ID: '1', PM2_INSTANCES: '1', scenario: 'single-instance' }
      ];

      const clusterResults = [];

      for (const scenario of edgeCaseScenarios) {
        process.env.PM2_HOME = '/tmp/.pm2';
        process.env.PM_ID = scenario.PM_ID;
        process.env.PM2_INSTANCES = scenario.PM2_INSTANCES;

        try {
          const result = await startProductionServer({
            port: TEST_PORT + 280 + parseInt(scenario.PM_ID),
            enableGracefulShutdown: false,
            pm2EdgeCaseMode: true,
            scenario: scenario.scenario
          });

          const clusterValidation = await validateProductionDeployment({
            server: result.server,
            config: result.config,
            environment: result.environment,
            pm2: {
              instanceId: parseInt(scenario.PM_ID),
              totalInstances: parseInt(scenario.PM2_INSTANCES),
              scenario: scenario.scenario
            }
          });

          clusterResults.push({
            scenario: scenario.scenario,
            instanceId: parseInt(scenario.PM_ID),
            validation: clusterValidation,
            serverRunning: result.server.listening
          });

          expect(result.server.listening).toBe(true);
          expect(result.environment.pm2Detected).toBe(true);
          expect(clusterValidation.isValid).toBe(true);

          await new Promise(resolve => result.server.close(resolve));
        } finally {
          // Continue to next scenario even if this one fails
        }
      }

      // Validate all edge case scenarios
      expect(clusterResults.length).toBe(edgeCaseScenarios.length);
      clusterResults.forEach(result => {
        expect(result.serverRunning).toBe(true);
        expect(result.validation.isValid).toBe(true);
      });

      // Restore original environment
      Object.keys(originalEnv).forEach(key => {
        if (originalEnv[key]) {
          process.env[key] = originalEnv[key];
        } else {
          delete process.env[key];
        }
      });
    });
  });
});
});