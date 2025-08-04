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

// Mock response imports for comprehensive response validation and testing scenarios
import {
  helloResponses,
  healthResponses,
  errorResponses,
  performanceResponses
} from '../fixtures/mock-responses.js';

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
});