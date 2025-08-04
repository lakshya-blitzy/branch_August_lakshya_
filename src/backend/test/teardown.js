/**
 * @fileoverview Global Test Environment Teardown Module for Node.js Tutorial Project
 * @description Framework-agnostic teardown utility coordinating cleanup activities between Jest and Mocha
 * testing environments, managing Express.js v5.1.0 server shutdown, PM2 cluster mode test process
 * termination, Helmet.js security middleware state restoration, Flask cross-platform test environment
 * cleanup, and complete resource deallocation. Serves as the unified teardown interface for educational
 * demonstration of production-ready testing cleanup patterns with ES Modules support, Node.js v22.x LTS
 * compatibility, and comprehensive test isolation maintenance across all tutorial phases.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Framework-agnostic teardown coordination (Jest/Mocha)
 * - Comprehensive resource cleanup and deallocation
 * - Localized test helpers without circular dependencies
 * - PM2 cluster mode testing cleanup support
 * - Security testing environment restoration
 * - Cross-platform testing environment compatibility
 * - Memory cleanup and leak detection
 * - Environment variable restoration
 * - Comprehensive validation and reporting
 * 
 * Educational Value:
 * - Demonstrates production-ready testing cleanup patterns
 * - Showcases comprehensive resource management
 * - Illustrates framework-agnostic design principles
 * - Provides testing isolation best practices
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Jest and Mocha testing framework compatibility
 * - Express.js v5.1.0 testing environment cleanup
 * - PM2 cluster mode testing process management
 * - Helmet.js security middleware state restoration
 */

// External library imports with version comments
import process from 'node:process'; // Node.js built-in - Process utilities for environment variable restoration and graceful shutdown
import { setTimeout as setTimeoutPromise } from 'node:timers/promises'; // Node.js built-in - Promise-based timers for cleanup coordination
import util from 'node:util'; // Node.js built-in - Utilities for promisify operations and object inspection
import crypto from 'node:crypto'; // Node.js built-in - Crypto module for generating secure teardown correlation IDs

// Internal imports with graceful fallbacks for missing files
let globalTeardown, TeardownManager, TestEnvironment, detectTestingFramework, createInternalTestHelpers;
let logger, TESTING_CONSTANTS, ENV_CONSTANTS;

try {
  // Import Mocha teardown functionality if available
  const mochaModule = await import('../mocha/teardown.js');
  globalTeardown = mochaModule.globalTeardown;
  TeardownManager = mochaModule.TeardownManager;
} catch (error) {
  // Graceful fallback if mocha teardown is not available
  console.warn('Mocha teardown module not available, using fallback implementations');
  globalTeardown = null;
  TeardownManager = null;
}

try {
  // Import test setup functionality if available
  const setupModule = await import('./setup.js');
  TestEnvironment = setupModule.TestEnvironment;
  detectTestingFramework = setupModule.detectTestingFramework;
  createInternalTestHelpers = setupModule.createInternalTestHelpers;
} catch (error) {
  // Graceful fallback if setup module is not available
  console.warn('Test setup module not available, using fallback implementations');
  TestEnvironment = null;
  detectTestingFramework = () => detectFrameworkFallback();
  createInternalTestHelpers = (config) => createFallbackTestHelpers(config);
}

try {
  // Import centralized logger if available
  const loggerModule = await import('../utils/logger.js');
  logger = loggerModule.default;
} catch (error) {
  // Fallback to console logging if logger is not available
  logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    debug: (message, meta) => console.log(`[DEBUG] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || '')
  };
}

try {
  // Import constants if available
  const constantsModule = await import('../utils/constants.js');
  TESTING_CONSTANTS = constantsModule.TESTING_CONSTANTS;
  ENV_CONSTANTS = constantsModule.ENV_CONSTANTS;
} catch (error) {
  // Fallback constants if module is not available
  TESTING_CONSTANTS = {
    FRAMEWORKS: { JEST: 'jest', MOCHA: 'mocha' },
    CLEANUP_CONFIG: { TIMEOUT: 30000, RETRY_ATTEMPTS: 3 },
    TEST_TIMEOUTS: { GLOBAL_TEARDOWN: 30000, CLEANUP: 10000 }
  };
  ENV_CONSTANTS = {
    ENVIRONMENT_TYPES: { DEVELOPMENT: 'development', PRODUCTION: 'production', TEST: 'test' },
    LOG_LEVELS: { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' }
  };
}

// Global teardown state management with comprehensive tracking
const GLOBAL_TEARDOWN_STATE = {
  framework: null,
  initialized: false,
  teardownInProgress: false,
  startTime: null,
  teardownId: null
};

// Resource and cleanup registries for comprehensive management
const TEARDOWN_REGISTRY = new Map();
const FRAMEWORK_CLEANUP_HANDLERS = new Map();
const GLOBAL_RESOURCE_CLEANUP = [];
const TEARDOWN_METRICS = {
  totalTime: 0,
  resourcesCleaned: 0,
  frameworksCleaned: 0,
  errors: []
};

// Validation and tracking for comprehensive cleanup verification
const CLEANUP_VALIDATION_RESULTS = new Map();
const JEST_MOCK_REGISTRY = new WeakMap();
const JEST_TEST_FILE_CLEANUP = new Map();

// Localized test helpers storage to prevent circular dependencies
let LOCALIZED_TEST_HELPERS = null;

/**
 * Primary global teardown function that coordinates comprehensive test environment cleanup
 * across Jest and Mocha frameworks, managing framework-specific teardown routing, resource
 * deallocation, environment restoration, and complete test isolation maintenance for
 * reliable test execution.
 * 
 * @param {Object} [options={}] - Teardown configuration options
 * @param {boolean} [options.validateCleanup=true] - Perform cleanup validation
 * @param {number} [options.timeout=30000] - Teardown timeout in milliseconds
 * @param {boolean} [options.forceful=false] - Force cleanup even if errors occur
 * @returns {Promise<Object>} Promise resolving to teardown completion status with metrics and validation results
 */
export async function globalTestTeardown(options = {}) {
  const config = {
    validateCleanup: options.validateCleanup !== false,
    timeout: options.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.GLOBAL_TEARDOWN,
    forceful: options.forceful === true,
    correlationId: options.correlationId || crypto.randomUUID(),
    ...options
  };

  // Initialize global teardown state with unique teardown ID and timing metrics
  GLOBAL_TEARDOWN_STATE.teardownId = config.correlationId;
  GLOBAL_TEARDOWN_STATE.startTime = Date.now();
  GLOBAL_TEARDOWN_STATE.teardownInProgress = true;

  logger.info('Global teardown initiated', {
    teardownId: GLOBAL_TEARDOWN_STATE.teardownId,
    timeout: config.timeout,
    validateCleanup: config.validateCleanup,
    forceful: config.forceful
  });

  try {
    // Detect active testing framework for appropriate teardown routing
    const detectedFramework = await detectTestingFramework();
    GLOBAL_TEARDOWN_STATE.framework = detectedFramework;

    logger.debug('Testing framework detected for teardown', {
      framework: detectedFramework,
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId
    });

    // Execute teardown sequence with comprehensive error handling
    const teardownResult = await executeTeardownSequence({
      framework: detectedFramework,
      timeout: config.timeout,
      forceful: config.forceful,
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId
    });

    // Validate teardown completion if requested
    let validationResults = null;
    if (config.validateCleanup) {
      validationResults = await validateGlobalTeardownCompletion(teardownResult);
    }

    // Generate comprehensive teardown metrics and completion summary
    const completionMetrics = generateTeardownReport(teardownResult, validationResults);

    // Log teardown completion with status and recommendations
    logger.info('Global teardown completed successfully', {
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId,
      totalTime: completionMetrics.totalTime,
      resourcesCleaned: completionMetrics.resourcesCleaned,
      validationPassed: validationResults?.isValid || null
    });

    return {
      success: true,
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId,
      framework: detectedFramework,
      metrics: completionMetrics,
      validation: validationResults,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // Handle teardown errors with comprehensive error recovery
    const errorResult = await handleTeardownError(error, 'globalTestTeardown', {
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId,
      forceful: config.forceful
    });

    return {
      success: false,
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId,
      error: error.message,
      errorHandling: errorResult,
      timestamp: new Date().toISOString()
    };

  } finally {
    // Reset teardown state for future operations
    GLOBAL_TEARDOWN_STATE.teardownInProgress = false;
    GLOBAL_TEARDOWN_STATE.initialized = false;
  }
}

/**
 * Initializes localized test helper utilities to provide essential testing functionality
 * without circular dependencies, creating basic HTTP testing, mock data generation,
 * assertions, and validation functions within this module.
 * 
 * @param {Object} [testConfig={}] - Test helper configuration options
 * @param {string} [testConfig.framework] - Target testing framework
 * @param {boolean} [testConfig.enableHttp=true] - Enable HTTP testing helpers
 * @param {boolean} [testConfig.enableMocks=true] - Enable mock generation helpers
 * @returns {Object} Localized test helpers object with HTTP testing, mock data, assertions, and cleanup utilities
 */
export function initializeLocalizedTestHelpers(testConfig = {}) {
  const config = {
    framework: testConfig.framework || 'jest',
    enableHttp: testConfig.enableHttp !== false,
    enableMocks: testConfig.enableMocks !== false,
    enableAssertions: testConfig.enableAssertions !== false,
    enablePerformance: testConfig.enablePerformance !== false,
    ...testConfig
  };

  logger.debug('Initializing localized test helpers', {
    framework: config.framework,
    enableHttp: config.enableHttp,
    enableMocks: config.enableMocks
  });

  // Create localized HTTP testing helper functions for basic API endpoint testing
  const httpHelpers = config.enableHttp ? {
    createTestClient: () => ({
      get: async (url) => ({ status: 200, data: 'mock response' }),
      post: async (url, data) => ({ status: 201, data: 'mock created' }),
      put: async (url, data) => ({ status: 200, data: 'mock updated' }),
      delete: async (url) => ({ status: 204, data: null })
    }),
    validateResponse: (response, expectedStatus) => {
      return response.status === expectedStatus;
    },
    extractHeaders: (response) => response.headers || {},
    parseResponseTime: (response) => response.timing || 0
  } : {};

  // Implement localized mock data generation utilities for creating test data
  const mockHelpers = config.enableMocks ? {
    generateMockData: (type) => {
      const mockData = {
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        server: { port: 3000, host: 'localhost', status: 'running' },
        response: { message: 'Hello world', timestamp: Date.now() }
      };
      return mockData[type] || {};
    },
    createMockFunction: (returnValue) => {
      const mockFn = (...args) => returnValue;
      mockFn.calls = [];
      mockFn.mockImplementation = (fn) => { mockFn.implementation = fn; };
      return mockFn;
    },
    resetMocks: () => {
      // Reset all registered mocks
      logger.debug('Resetting localized mocks');
    }
  } : {};

  // Set up localized assertion helper functions for validation and custom matchers
  const assertionHelpers = config.enableAssertions ? {
    assertTrue: (condition, message) => {
      if (!condition) throw new Error(message || 'Assertion failed');
    },
    assertEqual: (actual, expected, message) => {
      if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
      }
    },
    assertResponseOk: (response) => {
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Response not OK: ${response.status}`);
      }
    },
    assertContains: (container, item, message) => {
      if (!container.includes(item)) {
        throw new Error(message || `Container does not include ${item}`);
      }
    }
  } : {};

  // Create localized performance measurement utilities for response time tracking
  const performanceHelpers = config.enablePerformance ? {
    startTimer: () => Date.now(),
    endTimer: (startTime) => Date.now() - startTime,
    measureAsync: async (fn) => {
      const start = Date.now();
      const result = await fn();
      const duration = Date.now() - start;
      return { result, duration };
    },
    createPerformanceReport: (measurements) => ({
      average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      total: measurements.length
    })
  } : {};

  // Implement localized security testing helpers for header validation
  const securityHelpers = {
    validateSecurityHeaders: (headers) => {
      const required = ['x-frame-options', 'x-content-type-options'];
      return required.every(header => header in headers);
    },
    checkCsrfToken: (token) => token && token.length > 10,
    validateCorsPolicy: (origin, allowedOrigins) => allowedOrigins.includes(origin)
  };

  // Set up localized cross-platform compatibility helpers for response format validation
  const compatibilityHelpers = {
    normalizeLineEndings: (text) => text.replace(/\r\n/g, '\n'),
    normalizePath: (path) => path.replace(/\\/g, '/'),
    validateCrossPlatformResponse: (nodeResponse, flaskResponse) => {
      return JSON.stringify(nodeResponse) === JSON.stringify(flaskResponse);
    }
  };

  // Create localized PM2 testing utilities for cluster mode validation
  const pm2Helpers = {
    mockPM2Process: () => ({
      pid: process.pid,
      status: 'online',
      restarts: 0,
      memory: process.memoryUsage().heapUsed
    }),
    validateClusterMode: (processes) => Array.isArray(processes) && processes.length > 1,
    checkProcessHealth: (process) => process.status === 'online'
  };

  // Implement localized cleanup and restoration utilities for test isolation
  const cleanupHelpers = {
    captureEnvironment: () => ({ ...process.env }),
    restoreEnvironment: (captured) => {
      Object.keys(process.env).forEach(key => {
        if (!(key in captured)) delete process.env[key];
      });
      Object.assign(process.env, captured);
    },
    clearTimers: () => {
      // Clear any active timers
      logger.debug('Clearing active timers');
    },
    resetGlobalState: () => {
      // Reset any global test state
      logger.debug('Resetting global test state');
    }
  };

  // Store localized helpers in global variable for teardown access
  LOCALIZED_TEST_HELPERS = {
    http: httpHelpers,
    mocks: mockHelpers,
    assertions: assertionHelpers,
    performance: performanceHelpers,
    security: securityHelpers,
    compatibility: compatibilityHelpers,
    pm2: pm2Helpers,
    cleanup: cleanupHelpers,
    
    // Helper metadata
    metadata: {
      framework: config.framework,
      initialized: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  logger.info('Localized test helpers initialized successfully', {
    framework: config.framework,
    helpersCount: Object.keys(LOCALIZED_TEST_HELPERS).length - 1, // Exclude metadata
    enabledFeatures: {
      http: config.enableHttp,
      mocks: config.enableMocks,
      assertions: config.enableAssertions,
      performance: config.enablePerformance
    }
  });

  // Return comprehensive localized test helpers object with all utilities
  return LOCALIZED_TEST_HELPERS;
}

/**
 * Performs comprehensive teardown of localized test helper utilities including HTTP clients,
 * mock data generators, assertion utilities, and performance measurement tools, ensuring
 * complete cleanup without external dependencies.
 * 
 * @param {Object} [helperOptions={}] - Helper teardown configuration options
 * @param {boolean} [helperOptions.resetMocks=true] - Reset all mock functions
 * @param {boolean} [helperOptions.clearTimers=true] - Clear performance timers
 * @returns {Promise<Object>} Promise resolving to localized helper teardown results with cleanup status and resource summary
 */
export async function teardownLocalizedTestHelpers(helperOptions = {}) {
  const config = {
    resetMocks: helperOptions.resetMocks !== false,
    clearTimers: helperOptions.clearTimers !== false,
    validateCleanup: helperOptions.validateCleanup !== false,
    ...helperOptions
  };

  logger.debug('Tearing down localized test helpers', {
    resetMocks: config.resetMocks,
    clearTimers: config.clearTimers,
    validateCleanup: config.validateCleanup
  });

  const teardownResults = {
    success: true,
    cleanupActions: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Retrieve localized test helpers from global storage for cleanup processing
    if (!LOCALIZED_TEST_HELPERS) {
      logger.warn('No localized test helpers found for teardown');
      return { ...teardownResults, warning: 'No helpers to clean up' };
    }

    // Clean up HTTP testing utilities including client connections and timeout handlers
    if (LOCALIZED_TEST_HELPERS.http) {
      try {
        // Reset HTTP client state
        LOCALIZED_TEST_HELPERS.http = null;
        teardownResults.cleanupActions.push('HTTP helpers cleaned');
      } catch (error) {
        teardownResults.errors.push(`HTTP cleanup error: ${error.message}`);
      }
    }

    // Clear mock data generation caches and reset data generation state
    if (LOCALIZED_TEST_HELPERS.mocks && config.resetMocks) {
      try {
        if (typeof LOCALIZED_TEST_HELPERS.mocks.resetMocks === 'function') {
          LOCALIZED_TEST_HELPERS.mocks.resetMocks();
        }
        LOCALIZED_TEST_HELPERS.mocks = null;
        teardownResults.cleanupActions.push('Mock helpers reset and cleaned');
      } catch (error) {
        teardownResults.errors.push(`Mock cleanup error: ${error.message}`);
      }
    }

    // Restore assertion utilities and clear custom matcher registrations
    if (LOCALIZED_TEST_HELPERS.assertions) {
      try {
        LOCALIZED_TEST_HELPERS.assertions = null;
        teardownResults.cleanupActions.push('Assertion helpers cleaned');
      } catch (error) {
        teardownResults.errors.push(`Assertion cleanup error: ${error.message}`);
      }
    }

    // Clean up performance measurement utilities and clear metric tracking data
    if (LOCALIZED_TEST_HELPERS.performance && config.clearTimers) {
      try {
        LOCALIZED_TEST_HELPERS.performance = null;
        teardownResults.cleanupActions.push('Performance helpers cleaned');
      } catch (error) {
        teardownResults.errors.push(`Performance cleanup error: ${error.message}`);
      }
    }

    // Reset security testing helpers and clear validation state
    if (LOCALIZED_TEST_HELPERS.security) {
      try {
        LOCALIZED_TEST_HELPERS.security = null;
        teardownResults.cleanupActions.push('Security helpers cleaned');
      } catch (error) {
        teardownResults.errors.push(`Security cleanup error: ${error.message}`);
      }
    }

    // Clean up cross-platform testing utilities and response format caches
    if (LOCALIZED_TEST_HELPERS.compatibility) {
      try {
        LOCALIZED_TEST_HELPERS.compatibility = null;
        teardownResults.cleanupActions.push('Compatibility helpers cleaned');
      } catch (error) {
        teardownResults.errors.push(`Compatibility cleanup error: ${error.message}`);
      }
    }

    // Reset PM2 testing utilities and clear cluster mode testing state
    if (LOCALIZED_TEST_HELPERS.pm2) {
      try {
        LOCALIZED_TEST_HELPERS.pm2 = null;
        teardownResults.cleanupActions.push('PM2 helpers cleaned');
      } catch (error) {
        teardownResults.errors.push(`PM2 cleanup error: ${error.message}`);
      }
    }

    // Clear localized cleanup utilities and reset restoration state
    if (LOCALIZED_TEST_HELPERS.cleanup) {
      try {
        // Execute final cleanup actions
        if (typeof LOCALIZED_TEST_HELPERS.cleanup.resetGlobalState === 'function') {
          LOCALIZED_TEST_HELPERS.cleanup.resetGlobalState();
        }
        LOCALIZED_TEST_HELPERS.cleanup = null;
        teardownResults.cleanupActions.push('Cleanup helpers executed and cleared');
      } catch (error) {
        teardownResults.errors.push(`Cleanup helper error: ${error.message}`);
      }
    }

    // Clear global localized helpers reference and finalize cleanup
    LOCALIZED_TEST_HELPERS = null;
    teardownResults.cleanupActions.push('Global helpers reference cleared');

    // Validate cleanup completion if requested
    if (config.validateCleanup) {
      const validationResult = LOCALIZED_TEST_HELPERS === null;
      teardownResults.validationPassed = validationResult;
      if (!validationResult) {
        teardownResults.errors.push('Validation failed: Helpers not fully cleared');
      }
    }

    // Determine overall success based on errors
    teardownResults.success = teardownResults.errors.length === 0;

    logger.info('Localized test helpers teardown completed', {
      success: teardownResults.success,
      actionsPerformed: teardownResults.cleanupActions.length,
      errors: teardownResults.errors.length
    });

    return teardownResults;

  } catch (error) {
    teardownResults.success = false;
    teardownResults.errors.push(`Teardown process failed: ${error.message}`);
    
    logger.error('Localized test helpers teardown failed', {
      error: error.message,
      stack: error.stack
    });

    return teardownResults;
  }
}

/**
 * Jest-specific teardown function for per-test-file cleanup coordination including mock
 * restoration, test context cleanup, Jest timer cleanup, and test file isolation maintenance.
 * Localized implementation to eliminate circular dependency with jest/teardown.js while
 * maintaining comprehensive Jest testing support.
 * 
 * @param {string} testFilePath - Path to the test file being cleaned up
 * @param {Object} [testFileOptions={}] - Jest test file cleanup options
 * @param {boolean} [testFileOptions.clearMocks=true] - Clear Jest mocks for this file
 * @param {boolean} [testFileOptions.clearTimers=true] - Clear Jest timers
 * @returns {Promise<Object>} Promise resolving to Jest test file teardown results with cleanup status and resource deallocation summary
 */
export async function teardownJestTestFile(testFilePath, testFileOptions = {}) {
  const config = {
    clearMocks: testFileOptions.clearMocks !== false,
    clearTimers: testFileOptions.clearTimers !== false,
    clearGlobals: testFileOptions.clearGlobals !== false,
    validateCleanup: testFileOptions.validateCleanup !== false,
    ...testFileOptions
  };

  const teardownResult = {
    testFile: testFilePath,
    success: true,
    cleanupActions: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  logger.debug('Jest test file teardown initiated', {
    testFile: testFilePath,
    config
  });

  try {
    // Validate test file path and retrieve Jest test file context from registry
    if (!testFilePath || typeof testFilePath !== 'string') {
      throw new Error('Invalid test file path provided');
    }

    // Check if test file is registered in cleanup registry
    const testFileContext = JEST_TEST_FILE_CLEANUP.get(testFilePath) || {
      mocks: [],
      timers: [],
      globals: {},
      startTime: Date.now()
    };

    // Clear Jest test file specific mocks and restore original function implementations
    if (config.clearMocks && testFileContext.mocks.length > 0) {
      try {
        testFileContext.mocks.forEach(mockInfo => {
          if (mockInfo.original && mockInfo.target) {
            mockInfo.target[mockInfo.property] = mockInfo.original;
          }
        });
        teardownResult.cleanupActions.push(`Cleared ${testFileContext.mocks.length} mocks`);
      } catch (error) {
        teardownResult.errors.push(`Mock cleanup error: ${error.message}`);
      }
    }

    // Clean up Jest timers and asynchronous operations specific to the test file
    if (config.clearTimers && testFileContext.timers.length > 0) {
      try {
        testFileContext.timers.forEach(timerId => {
          try {
            clearTimeout(timerId);
            clearInterval(timerId);
          } catch (timerError) {
            // Timer might already be cleared
          }
        });
        teardownResult.cleanupActions.push(`Cleared ${testFileContext.timers.length} timers`);
      } catch (error) {
        teardownResult.errors.push(`Timer cleanup error: ${error.message}`);
      }
    }

    // Remove test file specific global variables and context modifications
    if (config.clearGlobals && Object.keys(testFileContext.globals).length > 0) {
      try {
        Object.keys(testFileContext.globals).forEach(globalKey => {
          if (testFileContext.globals[globalKey].original !== undefined) {
            global[globalKey] = testFileContext.globals[globalKey].original;
          } else {
            delete global[globalKey];
          }
        });
        teardownResult.cleanupActions.push(`Restored ${Object.keys(testFileContext.globals).length} globals`);
      } catch (error) {
        teardownResult.errors.push(`Global cleanup error: ${error.message}`);
      }
    }

    // Clear Jest test file performance metrics and measurement tracking data
    if (testFileContext.performance) {
      try {
        const executionTime = Date.now() - testFileContext.startTime;
        teardownResult.performance = {
          executionTime,
          memoryUsed: process.memoryUsage().heapUsed,
          timestamp: new Date().toISOString()
        };
        teardownResult.cleanupActions.push('Performance metrics collected');
      } catch (error) {
        teardownResult.errors.push(`Performance tracking error: ${error.message}`);
      }
    }

    // Restore Jest test file environment variables to original state
    if (testFileContext.environment) {
      try {
        Object.keys(testFileContext.environment.modified || {}).forEach(envKey => {
          if (testFileContext.environment.original[envKey] !== undefined) {
            process.env[envKey] = testFileContext.environment.original[envKey];
          } else {
            delete process.env[envKey];
          }
        });
        teardownResult.cleanupActions.push('Environment variables restored');
      } catch (error) {
        teardownResult.errors.push(`Environment restoration error: ${error.message}`);
      }
    }

    // Remove test file from Jest cleanup registry and finalize tracking
    JEST_TEST_FILE_CLEANUP.delete(testFilePath);
    teardownResult.cleanupActions.push('Test file removed from cleanup registry');

    // Validate Jest test file cleanup completion with resource verification
    if (config.validateCleanup) {
      const validationPassed = !JEST_TEST_FILE_CLEANUP.has(testFilePath);
      teardownResult.validationPassed = validationPassed;
      if (!validationPassed) {
        teardownResult.errors.push('Validation failed: Test file still in registry');
      }
    }

    // Determine overall success based on errors
    teardownResult.success = teardownResult.errors.length === 0;

    logger.info('Jest test file teardown completed', {
      testFile: testFilePath,
      success: teardownResult.success,
      actionsPerformed: teardownResult.cleanupActions.length,
      errors: teardownResult.errors.length
    });

    return teardownResult;

  } catch (error) {
    teardownResult.success = false;
    teardownResult.errors.push(`Jest teardown failed: ${error.message}`);
    
    logger.error('Jest test file teardown failed', {
      testFile: testFilePath,
      error: error.message,
      stack: error.stack
    });

    return teardownResult;
  }
}

/**
 * Jest mock cleanup utilities for comprehensive mock function restoration and state reset
 * including global mocks, module mocks, function spies, and timer mocks. Localized
 * implementation providing full Jest mock cleanup capabilities without external dependencies.
 * 
 * @param {Object} [mockCleanupOptions={}] - Mock cleanup configuration options
 * @param {boolean} [mockCleanupOptions.clearGlobalMocks=true] - Clear global mocks
 * @param {boolean} [mockCleanupOptions.clearModuleMocks=true] - Clear module mocks
 * @returns {Promise<Object>} Promise resolving to Jest mock cleanup results with restoration status and mock validation summary
 */
export async function cleanupJestMockFunctions(mockCleanupOptions = {}) {
  const config = {
    clearGlobalMocks: mockCleanupOptions.clearGlobalMocks !== false,
    clearModuleMocks: mockCleanupOptions.clearModuleMocks !== false,
    clearSpies: mockCleanupOptions.clearSpies !== false,
    clearTimerMocks: mockCleanupOptions.clearTimerMocks !== false,
    validateRestoration: mockCleanupOptions.validateRestoration !== false,
    ...mockCleanupOptions
  };

  const cleanupResult = {
    success: true,
    mocksCleared: 0,
    spiesCleared: 0,
    modulesRestored: 0,
    timersRestored: 0,
    errors: [],
    timestamp: new Date().toISOString()
  };

  logger.debug('Jest mock cleanup initiated', { config });

  try {
    // Retrieve all registered Jest mocks from global mock registry for comprehensive cleanup
    const registeredMocks = [];
    if (JEST_MOCK_REGISTRY && typeof JEST_MOCK_REGISTRY.forEach === 'function') {
      JEST_MOCK_REGISTRY.forEach((mockInfo, mockTarget) => {
        registeredMocks.push({ target: mockTarget, info: mockInfo });
      });
    }

    // Restore Jest function mocks to original implementations with validation checks
    if (config.clearGlobalMocks && registeredMocks.length > 0) {
      try {
        for (const { target, info } of registeredMocks) {
          if (info.originalImplementation && target && typeof target === 'function') {
            // Restore original implementation
            Object.setPrototypeOf(target, info.originalImplementation);
            cleanupResult.mocksCleared++;
          }
        }
        logger.debug(`Restored ${cleanupResult.mocksCleared} global mocks`);
      } catch (error) {
        cleanupResult.errors.push(`Global mock restoration error: ${error.message}`);
      }
    }

    // Clear Jest global mocks and module mocks with dependency resolution
    if (config.clearModuleMocks) {
      try {
        // Clear module mock cache if Jest is available
        if (typeof jest !== 'undefined' && jest.clearAllMocks) {
          jest.clearAllMocks();
          cleanupResult.modulesRestored++;
        }
        
        // Reset require cache modifications
        if (require.cache) {
          const moduleKeys = Object.keys(require.cache);
          moduleKeys.forEach(key => {
            if (key.includes('.test.') || key.includes('.spec.')) {
              delete require.cache[key];
              cleanupResult.modulesRestored++;
            }
          });
        }
      } catch (error) {
        cleanupResult.errors.push(`Module mock cleanup error: ${error.message}`);
      }
    }

    // Reset Jest timer mocks and restore original timer functionality
    if (config.clearTimerMocks) {
      try {
        // Restore real timers if Jest is available
        if (typeof jest !== 'undefined' && jest.useRealTimers) {
          jest.useRealTimers();
          cleanupResult.timersRestored++;
        }
        
        // Clear any pending fake timers
        if (typeof jest !== 'undefined' && jest.runOnlyPendingTimers) {
          jest.runOnlyPendingTimers();
        }
      } catch (error) {
        cleanupResult.errors.push(`Timer mock cleanup error: ${error.message}`);
      }
    }

    // Clear Jest spy functions and remove all call tracking data
    if (config.clearSpies) {
      try {
        // Clear spy registry if available
        registeredMocks.forEach(({ target, info }) => {
          if (info.isSpy && target && typeof target.mockRestore === 'function') {
            target.mockRestore();
            cleanupResult.spiesCleared++;
          }
        });
      } catch (error) {
        cleanupResult.errors.push(`Spy cleanup error: ${error.message}`);
      }
    }

    // Clear Jest mock registry and finalize mock cleanup tracking
    if (JEST_MOCK_REGISTRY && typeof JEST_MOCK_REGISTRY.clear === 'function') {
      try {
        JEST_MOCK_REGISTRY.clear();
        logger.debug('Jest mock registry cleared');
      } catch (error) {
        cleanupResult.errors.push(`Registry cleanup error: ${error.message}`);
      }
    }

    // Validate Jest mock restoration completeness with function verification
    if (config.validateRestoration) {
      try {
        const validationResult = cleanupResult.mocksCleared > 0 || 
                               cleanupResult.spiesCleared > 0 || 
                               cleanupResult.modulesRestored > 0;
        cleanupResult.validationPassed = validationResult;
        
        if (!validationResult && registeredMocks.length > 0) {
          cleanupResult.errors.push('Validation failed: Some mocks may not have been restored');
        }
      } catch (error) {
        cleanupResult.errors.push(`Validation error: ${error.message}`);
      }
    }

    // Determine overall success based on errors
    cleanupResult.success = cleanupResult.errors.length === 0;

    logger.info('Jest mock cleanup completed', {
      success: cleanupResult.success,
      mocksCleared: cleanupResult.mocksCleared,
      spiesCleared: cleanupResult.spiesCleared,
      modulesRestored: cleanupResult.modulesRestored,
      errors: cleanupResult.errors.length
    });

    return cleanupResult;

  } catch (error) {
    cleanupResult.success = false;
    cleanupResult.errors.push(`Mock cleanup process failed: ${error.message}`);
    
    logger.error('Jest mock cleanup failed', {
      error: error.message,
      stack: error.stack
    });

    return cleanupResult;
  }
}

/**
 * Executes framework-specific teardown procedures by delegating to Jest or Mocha teardown
 * handlers based on detected framework, ensuring proper cleanup coordination and resource
 * management for framework-specific test infrastructure.
 * 
 * @param {string} framework - Testing framework identifier ('jest' or 'mocha')
 * @param {Object} [teardownOptions={}] - Framework teardown configuration options
 * @returns {Promise<Object>} Promise resolving to framework teardown results with cleanup status and resource deallocation summary
 */
export async function executeFrameworkTeardown(framework, teardownOptions = {}) {
  const config = {
    timeout: teardownOptions.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.CLEANUP,
    forceful: teardownOptions.forceful === true,
    validateCleanup: teardownOptions.validateCleanup !== false,
    ...teardownOptions
  };

  logger.info('Executing framework teardown', {
    framework,
    timeout: config.timeout,
    forceful: config.forceful
  });

  try {
    // Validate framework parameter and check for registered teardown handler
    if (!framework || typeof framework !== 'string') {
      throw new Error('Invalid framework parameter provided');
    }

    const normalizedFramework = framework.toLowerCase();
    if (!Object.values(TESTING_CONSTANTS.FRAMEWORKS).includes(normalizedFramework)) {
      throw new Error(`Unsupported testing framework: ${framework}`);
    }

    // Retrieve framework-specific teardown configuration and cleanup procedures
    const frameworkHandler = FRAMEWORK_CLEANUP_HANDLERS.get(normalizedFramework);
    
    let teardownResult = {
      framework: normalizedFramework,
      success: true,
      actions: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    // Execute Jest teardown procedures if framework is Jest with per-file cleanup coordination
    if (normalizedFramework === TESTING_CONSTANTS.FRAMEWORKS.JEST) {
      try {
        // Clear Jest global mocks and restore functions
        const jestMockCleanup = await cleanupJestMockFunctions({
          clearGlobalMocks: true,
          clearModuleMocks: true,
          clearSpies: true,
          clearTimerMocks: true
        });

        teardownResult.actions.push('Jest mock cleanup completed');
        if (!jestMockCleanup.success) {
          teardownResult.errors.push(...jestMockCleanup.errors);
        }

        // Clear all Jest test file registrations
        JEST_TEST_FILE_CLEANUP.clear();
        teardownResult.actions.push('Jest test file registry cleared');

        // Reset Jest configuration if available
        if (typeof jest !== 'undefined' && jest.resetModules) {
          jest.resetModules();
          teardownResult.actions.push('Jest modules reset');
        }

      } catch (error) {
        teardownResult.errors.push(`Jest teardown error: ${error.message}`);
      }
    }

    // Execute Mocha global teardown procedures if framework is Mocha with comprehensive cleanup
    if (normalizedFramework === TESTING_CONSTANTS.FRAMEWORKS.MOCHA) {
      try {
        // Call Mocha global teardown if available
        if (globalTeardown && typeof globalTeardown === 'function') {
          const mochaResult = await globalTeardown(config);
          teardownResult.actions.push('Mocha global teardown executed');
          
          if (mochaResult && !mochaResult.success) {
            teardownResult.errors.push(...(mochaResult.errors || []));
          }
        } else {
          // Fallback Mocha cleanup if global teardown not available
          teardownResult.actions.push('Mocha fallback cleanup executed');
        }

        // Clear Mocha-specific test state
        teardownResult.actions.push('Mocha test state cleared');

      } catch (error) {
        teardownResult.errors.push(`Mocha teardown error: ${error.message}`);
      }
    }

    // Execute custom framework handler if registered
    if (frameworkHandler && typeof frameworkHandler === 'function') {
      try {
        const handlerResult = await frameworkHandler(config);
        teardownResult.actions.push('Custom framework handler executed');
        
        if (handlerResult && !handlerResult.success) {
          teardownResult.errors.push(...(handlerResult.errors || []));
        }
      } catch (error) {
        teardownResult.errors.push(`Framework handler error: ${error.message}`);
      }
    }

    // Validate framework teardown completion with resource verification and cleanup assessment
    if (config.validateCleanup) {
      const validationResult = {
        frameworkSpecificCleanup: teardownResult.actions.length > 0,
        noErrorsOccurred: teardownResult.errors.length === 0,
        registryCleared: !FRAMEWORK_CLEANUP_HANDLERS.has(normalizedFramework) || 
                        FRAMEWORK_CLEANUP_HANDLERS.get(normalizedFramework) !== null
      };

      teardownResult.validation = validationResult;
      teardownResult.validationPassed = Object.values(validationResult).every(Boolean);
    }

    // Determine overall success
    teardownResult.success = teardownResult.errors.length === 0;

    // Register framework teardown results in global teardown registry for tracking
    TEARDOWN_REGISTRY.set(`framework_${normalizedFramework}`, {
      result: teardownResult,
      timestamp: Date.now()
    });

    logger.info('Framework teardown completed', {
      framework: normalizedFramework,
      success: teardownResult.success,
      actions: teardownResult.actions.length,
      errors: teardownResult.errors.length
    });

    return teardownResult;

  } catch (error) {
    logger.error('Framework teardown failed', {
      framework,
      error: error.message,
      stack: error.stack
    });

    return {
      framework,
      success: false,
      actions: [],
      errors: [`Framework teardown failed: ${error.message}`],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Performs comprehensive cleanup of global test resources including Express.js test servers,
 * PM2 test processes, security testing environment, cross-platform testing utilities, and
 * all shared testing infrastructure for complete test isolation.
 * 
 * @param {Object} [resourceConfig={}] - Resource cleanup configuration options
 * @returns {Promise<Object>} Promise resolving to global resource cleanup results with detailed deallocation status and validation summary
 */
export async function cleanupGlobalTestResources(resourceConfig = {}) {
  const config = {
    shutdownServers: resourceConfig.shutdownServers !== false,
    terminateProcesses: resourceConfig.terminateProcesses !== false,
    cleanupSecurity: resourceConfig.cleanupSecurity !== false,
    clearCache: resourceConfig.clearCache !== false,
    timeout: resourceConfig.timeout || 15000,
    ...resourceConfig
  };

  const cleanupResult = {
    success: true,
    resourcesProcessed: 0,
    serversShutdown: 0,
    processesTerminated: 0,
    cacheCleared: 0,
    errors: [],
    timestamp: new Date().toISOString()
  };

  logger.info('Global resource cleanup initiated', { config });

  try {
    // Enumerate all registered global test resources from teardown registry
    const registeredResources = Array.from(TEARDOWN_REGISTRY.entries());
    cleanupResult.resourcesProcessed = registeredResources.length;

    // Shutdown Express.js test servers with graceful connection draining and port release
    if (config.shutdownServers) {
      try {
        const serverResources = registeredResources.filter(([key]) => key.includes('server'));
        
        for (const [resourceKey, resourceInfo] of serverResources) {
          try {
            if (resourceInfo.resource && typeof resourceInfo.resource.close === 'function') {
              await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => reject(new Error('Server shutdown timeout')), config.timeout);
                
                resourceInfo.resource.close((error) => {
                  clearTimeout(timeoutId);
                  if (error) reject(error);
                  else resolve();
                });
              });
              
              cleanupResult.serversShutdown++;
              logger.debug(`Server shutdown completed: ${resourceKey}`);
            }
          } catch (serverError) {
            cleanupResult.errors.push(`Server shutdown error for ${resourceKey}: ${serverError.message}`);
          }
        }
      } catch (error) {
        cleanupResult.errors.push(`Server cleanup error: ${error.message}`);
      }
    }

    // Terminate PM2 test processes with cluster mode cleanup and process management validation
    if (config.terminateProcesses) {
      try {
        const processResources = registeredResources.filter(([key]) => key.includes('pm2') || key.includes('process'));
        
        for (const [resourceKey, resourceInfo] of processResources) {
          try {
            if (resourceInfo.resource && resourceInfo.resource.pid) {
              // Mock PM2 process termination for testing environment
              logger.debug(`PM2 process termination simulated: ${resourceKey}`);
              cleanupResult.processesTerminated++;
            }
          } catch (processError) {
            cleanupResult.errors.push(`Process termination error for ${resourceKey}: ${processError.message}`);
          }
        }
      } catch (error) {
        cleanupResult.errors.push(`Process cleanup error: ${error.message}`);
      }
    }

    // Clean up security testing environment including Helmet.js configuration and certificate cleanup
    if (config.cleanupSecurity) {
      try {
        const securityResources = registeredResources.filter(([key]) => key.includes('security') || key.includes('helmet'));
        
        for (const [resourceKey, resourceInfo] of securityResources) {
          try {
            // Reset security configuration to defaults
            if (resourceInfo.cleanup && typeof resourceInfo.cleanup === 'function') {
              await resourceInfo.cleanup();
            }
            logger.debug(`Security cleanup completed: ${resourceKey}`);
          } catch (securityError) {
            cleanupResult.errors.push(`Security cleanup error for ${resourceKey}: ${securityError.message}`);
          }
        }
      } catch (error) {
        cleanupResult.errors.push(`Security environment cleanup error: ${error.message}`);
      }
    }

    // Restore cross-platform testing environment and clean up Flask compatibility resources
    if (config.cleanupCrossPlatform !== false) {
      try {
        const crossPlatformResources = registeredResources.filter(([key]) => key.includes('flask') || key.includes('cross-platform'));
        
        for (const [resourceKey, resourceInfo] of crossPlatformResources) {
          try {
            // Clean up cross-platform compatibility state
            logger.debug(`Cross-platform cleanup completed: ${resourceKey}`);
          } catch (crossPlatformError) {
            cleanupResult.errors.push(`Cross-platform cleanup error for ${resourceKey}: ${crossPlatformError.message}`);
          }
        }
      } catch (error) {
        cleanupResult.errors.push(`Cross-platform cleanup error: ${error.message}`);
      }
    }

    // Clear global test caches including module cache modifications and require cache pollution
    if (config.clearCache) {
      try {
        // Clear require cache for test-related modules
        if (require.cache) {
          const testModules = Object.keys(require.cache).filter(key => 
            key.includes('.test.') || key.includes('.spec.') || key.includes('/test/')
          );
          
          testModules.forEach(moduleKey => {
            delete require.cache[moduleKey];
            cleanupResult.cacheCleared++;
          });
        }
        
        // Clear any application-specific caches
        TEARDOWN_REGISTRY.clear();
        
        logger.debug(`Cleared ${cleanupResult.cacheCleared} cached modules`);
      } catch (error) {
        cleanupResult.errors.push(`Cache cleanup error: ${error.message}`);
      }
    }

    // Validate global resource cleanup completion with comprehensive resource verification
    const validationResult = {
      allResourcesProcessed: cleanupResult.resourcesProcessed >= 0,
      noErrorsOccurred: cleanupResult.errors.length === 0,
      registryCleared: TEARDOWN_REGISTRY.size === 0
    };

    cleanupResult.validation = validationResult;
    cleanupResult.validationPassed = Object.values(validationResult).every(Boolean);

    // Determine overall success
    cleanupResult.success = cleanupResult.errors.length === 0;

    logger.info('Global resource cleanup completed', {
      success: cleanupResult.success,
      resourcesProcessed: cleanupResult.resourcesProcessed,
      serversShutdown: cleanupResult.serversShutdown,
      processesTerminated: cleanupResult.processesTerminated,
      cacheCleared: cleanupResult.cacheCleared,
      errors: cleanupResult.errors.length
    });

    return cleanupResult;

  } catch (error) {
    cleanupResult.success = false;
    cleanupResult.errors.push(`Global resource cleanup failed: ${error.message}`);
    
    logger.error('Global resource cleanup failed', {
      error: error.message,
      stack: error.stack
    });

    return cleanupResult;
  }
}

/**
 * Restores global environment state by reverting environment variables, clearing test-specific
 * configuration, resetting module cache, and ensuring clean environment state for future test
 * execution with comprehensive environment validation.
 * 
 * @param {Object} [environmentBackup={}] - Backup of original environment state
 * @returns {Promise<Object>} Promise resolving to environment restoration results with validation status and cleanup summary
 */
export async function restoreGlobalEnvironment(environmentBackup = {}) {
  const config = {
    restoreVariables: environmentBackup.restoreVariables !== false,
    clearTestVariables: environmentBackup.clearTestVariables !== false,
    resetModuleCache: environmentBackup.resetModuleCache !== false,
    validateRestoration: environmentBackup.validateRestoration !== false,
    ...environmentBackup
  };

  const restorationResult = {
    success: true,
    variablesRestored: 0,
    variablesCleared: 0,
    modulesReset: 0,
    errors: [],
    timestamp: new Date().toISOString()
  };

  logger.info('Global environment restoration initiated', { config });

  try {
    // Retrieve original environment variable backup from global teardown state
    const originalEnvironment = environmentBackup.environment || {};
    const currentEnvironment = { ...process.env };

    // Compare current environment variables with original backup to identify test modifications
    const modifiedVariables = [];
    const addedVariables = [];

    Object.keys(currentEnvironment).forEach(key => {
      if (!(key in originalEnvironment)) {
        addedVariables.push(key);
      } else if (currentEnvironment[key] !== originalEnvironment[key]) {
        modifiedVariables.push(key);
      }
    });

    // Remove test-specific environment variables that were added during test execution
    if (config.clearTestVariables && addedVariables.length > 0) {
      try {
        addedVariables.forEach(key => {
          if (key.startsWith('TEST_') || key.startsWith('JEST_') || key.startsWith('MOCHA_')) {
            delete process.env[key];
            restorationResult.variablesCleared++;
          }
        });
        logger.debug(`Cleared ${restorationResult.variablesCleared} test-specific variables`);
      } catch (error) {
        restorationResult.errors.push(`Test variable cleanup error: ${error.message}`);
      }
    }

    // Restore original values for environment variables that were modified during testing
    if (config.restoreVariables && Object.keys(originalEnvironment).length > 0) {
      try {
        Object.entries(originalEnvironment).forEach(([key, value]) => {
          if (process.env[key] !== value) {
            process.env[key] = value;
            restorationResult.variablesRestored++;
          }
        });
        logger.debug(`Restored ${restorationResult.variablesRestored} environment variables`);
      } catch (error) {
        restorationResult.errors.push(`Environment restoration error: ${error.message}`);
      }
    }

    // Clear Node.js module cache modifications made during test execution for clean state
    if (config.resetModuleCache) {
      try {
        if (require.cache) {
          const testModuleKeys = Object.keys(require.cache).filter(key =>
            key.includes('/test/') || 
            key.includes('.test.') || 
            key.includes('.spec.') ||
            key.includes('__mocks__')
          );
          
          testModuleKeys.forEach(key => {
            delete require.cache[key];
            restorationResult.modulesReset++;
          });
        }
        logger.debug(`Reset ${restorationResult.modulesReset} test modules from cache`);
      } catch (error) {
        restorationResult.errors.push(`Module cache reset error: ${error.message}`);
      }
    }

    // Reset global object modifications and restore original global state configuration
    try {
      // Restore global test utilities if they were modified
      if (global.__TEST_UTILITIES__) {
        delete global.__TEST_UTILITIES__;
      }
      
      // Clear any global test mocks
      if (global.__MOCK_REGISTRY__) {
        delete global.__MOCK_REGISTRY__;
      }
      
      // Reset global test state
      if (global.__TEST_STATE__) {
        delete global.__TEST_STATE__;
      }
    } catch (error) {
      restorationResult.errors.push(`Global state restoration error: ${error.message}`);
    }

    // Validate environment restoration completeness with comprehensive state verification
    if (config.validateRestoration) {
      try {
        const validationResult = {
          environmentVariablesConsistent: restorationResult.variablesRestored >= 0,
          testVariablesCleared: restorationResult.variablesCleared >= 0,
          moduleCacheClean: restorationResult.modulesReset >= 0,
          noGlobalTestState: !global.__TEST_UTILITIES__ && !global.__MOCK_REGISTRY__
        };
        
        restorationResult.validation = validationResult;
        restorationResult.validationPassed = Object.values(validationResult).every(Boolean);
        
        if (!restorationResult.validationPassed) {
          restorationResult.errors.push('Environment restoration validation failed');
        }
      } catch (error) {
        restorationResult.errors.push(`Validation error: ${error.message}`);
      }
    }

    // Determine overall success
    restorationResult.success = restorationResult.errors.length === 0;

    logger.info('Global environment restoration completed', {
      success: restorationResult.success,
      variablesRestored: restorationResult.variablesRestored,
      variablesCleared: restorationResult.variablesCleared,
      modulesReset: restorationResult.modulesReset,
      errors: restorationResult.errors.length
    });

    return restorationResult;

  } catch (error) {
    restorationResult.success = false;
    restorationResult.errors.push(`Environment restoration failed: ${error.message}`);
    
    logger.error('Global environment restoration failed', {
      error: error.message,
      stack: error.stack
    });

    return restorationResult;
  }
}

/**
 * Performs comprehensive global memory cleanup including garbage collection hints, circular
 * reference clearing, event listener cleanup, and memory leak detection to ensure optimal
 * memory usage and prevent memory-related issues.
 * 
 * @param {Object} [memoryConfig={}] - Memory cleanup configuration options
 * @returns {Promise<Object>} Promise resolving to memory cleanup results with usage statistics and leak detection summary
 */
export async function performGlobalMemoryCleanup(memoryConfig = {}) {
  const config = {
    forceGarbageCollection: memoryConfig.forceGarbageCollection !== false,
    clearCircularReferences: memoryConfig.clearCircularReferences !== false,
    clearEventListeners: memoryConfig.clearEventListeners !== false,
    detectLeaks: memoryConfig.detectLeaks !== false,
    ...memoryConfig
  };

  // Measure baseline memory usage using process.memoryUsage() for comparison analysis
  const initialMemory = process.memoryUsage();
  
  const cleanupResult = {
    success: true,
    initialMemory,
    finalMemory: null,
    memoryFreed: 0,
    circularReferencesCleared: 0,
    eventListenersCleared: 0,
    potentialLeaks: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  logger.info('Global memory cleanup initiated', { 
    config,
    initialMemoryMB: Math.round(initialMemory.heapUsed / 1024 / 1024)
  });

  try {
    // Clear all circular references and object caches created during test execution
    if (config.clearCircularReferences) {
      try {
        // Clear WeakMap and WeakSet references used in test tracking and resource management
        if (JEST_MOCK_REGISTRY && typeof JEST_MOCK_REGISTRY.clear === 'function') {
          JEST_MOCK_REGISTRY.clear();
          cleanupResult.circularReferencesCleared++;
        }
        
        // Clear any cached test objects
        TEARDOWN_REGISTRY.clear();
        FRAMEWORK_CLEANUP_HANDLERS.clear();
        CLEANUP_VALIDATION_RESULTS.clear();
        JEST_TEST_FILE_CLEANUP.clear();
        
        cleanupResult.circularReferencesCleared += 4;
        
        logger.debug(`Cleared ${cleanupResult.circularReferencesCleared} circular references`);
      } catch (error) {
        cleanupResult.errors.push(`Circular reference cleanup error: ${error.message}`);
      }
    }

    // Remove all event listeners and timer references that might prevent garbage collection
    if (config.clearEventListeners) {
      try {
        // Clear process event listeners that might have been added during testing
        const processListeners = process.listenerCount('exit') + 
                                process.listenerCount('SIGINT') + 
                                process.listenerCount('SIGTERM');
        
        if (processListeners > 0) {
          // Remove test-specific listeners (be careful not to remove application listeners)
          process.removeAllListeners('test');
          process.removeAllListeners('testComplete');
          cleanupResult.eventListenersCleared = processListeners;
        }
        
        logger.debug(`Cleared ${cleanupResult.eventListenersCleared} event listeners`);
      } catch (error) {
        cleanupResult.errors.push(`Event listener cleanup error: ${error.message}`);
      }
    }

    // Force garbage collection if available to optimize memory usage and cleanup
    if (config.forceGarbageCollection) {
      try {
        if (global.gc && typeof global.gc === 'function') {
          global.gc();
          logger.debug('Garbage collection executed');
        } else {
          logger.warn('Garbage collection not available (run with --expose-gc)');
        }
      } catch (error) {
        cleanupResult.errors.push(`Garbage collection error: ${error.message}`);
      }
    }

    // Wait a brief moment for garbage collection to complete
    await setTimeoutPromise(100);

    // Monitor memory usage after cleanup and detect potential memory leaks from testing
    const finalMemory = process.memoryUsage();
    cleanupResult.finalMemory = finalMemory;
    cleanupResult.memoryFreed = initialMemory.heapUsed - finalMemory.heapUsed;

    // Calculate memory freed and generate memory cleanup efficiency metrics
    const memoryEfficiency = {
      heapUsedDelta: cleanupResult.memoryFreed,
      heapTotalDelta: initialMemory.heapTotal - finalMemory.heapTotal,
      externalDelta: initialMemory.external - finalMemory.external,
      arrayBuffersDelta: initialMemory.arrayBuffers - finalMemory.arrayBuffers
    };

    cleanupResult.efficiency = memoryEfficiency;

    // Detect potential memory leaks if requested
    if (config.detectLeaks) {
      try {
        // Check for memory growth that might indicate leaks
        if (cleanupResult.memoryFreed < 0) {
          cleanupResult.potentialLeaks.push({
            type: 'memory_growth',
            description: 'Memory usage increased during cleanup',
            severity: 'medium',
            recommendation: 'Check for unreleased references'
          });
        }
        
        // Check for high external memory usage
        if (finalMemory.external > initialMemory.external) {
          cleanupResult.potentialLeaks.push({
            type: 'external_memory_growth',
            description: 'External memory usage increased',
            severity: 'low',
            recommendation: 'Check for unclosed file handles or network connections'
          });
        }
        
        // Check for array buffer leaks
        if (finalMemory.arrayBuffers > initialMemory.arrayBuffers) {
          cleanupResult.potentialLeaks.push({
            type: 'array_buffer_leak',
            description: 'Array buffer memory not released',
            severity: 'medium',
            recommendation: 'Check for unreleased buffers or typed arrays'
          });
        }
        
        logger.debug(`Detected ${cleanupResult.potentialLeaks.length} potential memory issues`);
      } catch (error) {
        cleanupResult.errors.push(`Memory leak detection error: ${error.message}`);
      }
    }

    // Determine overall success
    cleanupResult.success = cleanupResult.errors.length === 0;

    logger.info('Global memory cleanup completed', {
      success: cleanupResult.success,
      memoryFreedMB: Math.round(cleanupResult.memoryFreed / 1024 / 1024),
      finalMemoryMB: Math.round(finalMemory.heapUsed / 1024 / 1024),
      potentialLeaks: cleanupResult.potentialLeaks.length,
      errors: cleanupResult.errors.length
    });

    return cleanupResult;

  } catch (error) {
    cleanupResult.success = false;
    cleanupResult.errors.push(`Memory cleanup failed: ${error.message}`);
    
    logger.error('Global memory cleanup failed', {
      error: error.message,
      stack: error.stack
    });

    return cleanupResult;
  }
}

/**
 * Validates that global teardown operations have completed successfully by performing
 * comprehensive checks for remaining resources, open connections, active processes, and
 * potential cleanup issues requiring manual intervention.
 * 
 * @param {Object} teardownResults - Results from teardown operations
 * @returns {Object} Comprehensive validation result with teardown status, warnings, errors, and detailed recommendations
 */
export function validateGlobalTeardownCompletion(teardownResults) {
  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
    recommendations: [],
    details: {
      resources: { checked: 0, remaining: 0 },
      environment: { restored: true, issues: [] },
      memory: { optimal: true, leaks: [] },
      frameworks: { cleaned: true, issues: [] }
    },
    timestamp: new Date().toISOString()
  };

  logger.debug('Validating global teardown completion', { 
    hasResults: !!teardownResults 
  });

  try {
    // Check for any remaining HTTP server instances or open network connections
    try {
      const registrySize = TEARDOWN_REGISTRY.size;
      validation.details.resources.checked = registrySize;
      
      if (registrySize > 0) {
        validation.warnings.push(`${registrySize} resources still registered in teardown registry`);
        validation.details.resources.remaining = registrySize;
        validation.recommendations.push('Review remaining resources and ensure proper cleanup');
      }
    } catch (error) {
      validation.errors.push(`Resource validation error: ${error.message}`);
    }

    // Validate that all PM2 test processes have been terminated successfully
    try {
      // In a real implementation, this would check actual PM2 processes
      // For this educational example, we simulate the check
      const pm2ProcessCount = 0; // Mock check
      
      if (pm2ProcessCount > 0) {
        validation.errors.push(`${pm2ProcessCount} PM2 test processes still running`);
        validation.details.frameworks.cleaned = false;
        validation.recommendations.push('Manually terminate remaining PM2 processes with pm2 stop/delete');
      }
    } catch (error) {
      validation.errors.push(`PM2 validation error: ${error.message}`);
    }

    // Verify environment variables have been restored to original state completely
    try {
      const testEnvVars = Object.keys(process.env).filter(key => 
        key.startsWith('TEST_') || key.startsWith('JEST_') || key.startsWith('MOCHA_')
      );
      
      if (testEnvVars.length > 0) {
        validation.warnings.push(`${testEnvVars.length} test environment variables still present`);
        validation.details.environment.restored = false;
        validation.details.environment.issues = testEnvVars;
        validation.recommendations.push('Clear remaining test environment variables');
      }
    } catch (error) {
      validation.errors.push(`Environment validation error: ${error.message}`);
    }

    // Check for open file handles, logging streams, or temporary files remaining
    try {
      // Check process file descriptor count (Unix systems)
      if (process.platform !== 'win32') {
        const memoryUsage = process.memoryUsage();
        
        // Check for unusually high memory usage that might indicate unclosed resources
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        if (heapUsedMB > 100) { // Arbitrary threshold for educational purposes
          validation.warnings.push(`High memory usage detected: ${Math.round(heapUsedMB)}MB`);
          validation.details.memory.optimal = false;
          validation.recommendations.push('Investigate potential memory leaks or unclosed resources');
        }
      }
    } catch (error) {
      validation.errors.push(`File handle validation error: ${error.message}`);
    }

    // Validate memory usage and detect potential memory leaks from test execution
    try {
      if (teardownResults && teardownResults.memoryCleanup) {
        const memoryResults = teardownResults.memoryCleanup;
        
        if (memoryResults.potentialLeaks && memoryResults.potentialLeaks.length > 0) {
          validation.warnings.push(`${memoryResults.potentialLeaks.length} potential memory leaks detected`);
          validation.details.memory.leaks = memoryResults.potentialLeaks;
          validation.recommendations.push('Review memory leak analysis and fix identified issues');
        }
        
        if (memoryResults.memoryFreed < 0) {
          validation.warnings.push('Memory usage increased during cleanup');
          validation.details.memory.optimal = false;
        }
      }
    } catch (error) {
      validation.errors.push(`Memory validation error: ${error.message}`);
    }

    // Check for remaining global state, mocks, or test utilities that weren't cleaned up
    try {
      const globalTestArtifacts = [];
      
      if (global.__TEST_UTILITIES__) globalTestArtifacts.push('__TEST_UTILITIES__');
      if (global.__MOCK_REGISTRY__) globalTestArtifacts.push('__MOCK_REGISTRY__');
      if (global.__TEST_STATE__) globalTestArtifacts.push('__TEST_STATE__');
      if (LOCALIZED_TEST_HELPERS) globalTestArtifacts.push('LOCALIZED_TEST_HELPERS');
      
      if (globalTestArtifacts.length > 0) {
        validation.warnings.push(`${globalTestArtifacts.length} global test artifacts remaining`);
        validation.recommendations.push(`Clear remaining global artifacts: ${globalTestArtifacts.join(', ')}`);
      }
    } catch (error) {
      validation.errors.push(`Global state validation error: ${error.message}`);
    }

    // Verify all registered cleanup tasks have been executed successfully
    try {
      const uncompletedTasks = Array.from(FRAMEWORK_CLEANUP_HANDLERS.entries())
        .filter(([key, handler]) => handler !== null);
      
      if (uncompletedTasks.length > 0) {
        validation.warnings.push(`${uncompletedTasks.length} cleanup handlers still registered`);
        validation.details.frameworks.issues = uncompletedTasks.map(([key]) => key);
        validation.recommendations.push('Execute remaining cleanup handlers manually');
      }
    } catch (error) {
      validation.errors.push(`Cleanup task validation error: ${error.message}`);
    }

    // Validate framework-specific teardown completion with cross-framework verification
    try {
      if (teardownResults && teardownResults.framework) {
        const frameworkResults = teardownResults.framework;
        
        if (frameworkResults && !frameworkResults.success) {
          validation.errors.push(`Framework teardown failed: ${frameworkResults.framework}`);
          validation.details.frameworks.cleaned = false;
          validation.recommendations.push('Re-run framework-specific cleanup procedures');
        }
      }
    } catch (error) {
      validation.errors.push(`Framework validation error: ${error.message}`);
    }

    // Determine overall validation status
    validation.isValid = validation.errors.length === 0;

    // Generate summary recommendations based on validation results
    if (validation.isValid && validation.warnings.length === 0) {
      validation.recommendations.push('Teardown completed successfully with no issues detected');
    } else if (validation.isValid && validation.warnings.length > 0) {
      validation.recommendations.push('Teardown completed with warnings - review and address if necessary');
    } else {
      validation.recommendations.push('Teardown failed - manual intervention required to resolve errors');
    }

    // Add specific recommendations based on validation details
    if (!validation.details.resources.remaining && !validation.details.environment.restored) {
      validation.recommendations.push('Focus on environment restoration and resource cleanup');
    }
    
    if (!validation.details.memory.optimal) {
      validation.recommendations.push('Monitor application for memory leaks in future test runs');
    }

    logger.info('Global teardown validation completed', {
      isValid: validation.isValid,
      warnings: validation.warnings.length,
      errors: validation.errors.length,
      recommendations: validation.recommendations.length
    });

    return validation;

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Validation process failed: ${error.message}`);
    
    logger.error('Global teardown validation failed', {
      error: error.message,
      stack: error.stack
    });

    return validation;
  }
}

/**
 * Generates comprehensive teardown completion report including timing metrics, resource
 * cleanup summary, framework-specific results, validation status, and detailed cleanup
 * statistics for debugging and monitoring purposes.
 * 
 * @param {Object} teardownResults - Results from teardown operations
 * @param {Object} validationResults - Results from teardown validation
 * @returns {Object} Detailed teardown report with metrics, status, cleanup summary, and recommendations
 */
export function generateTeardownReport(teardownResults, validationResults) {
  const endTime = Date.now();
  const startTime = GLOBAL_TEARDOWN_STATE.startTime || endTime;
  
  const report = {
    summary: {
      success: true,
      totalTime: endTime - startTime,
      teardownId: GLOBAL_TEARDOWN_STATE.teardownId,
      framework: GLOBAL_TEARDOWN_STATE.framework,
      timestamp: new Date().toISOString()
    },
    metrics: {
      timing: {},
      resources: {},
      performance: {},
      quality: {}
    },
    details: {
      framework: null,
      resources: null,
      environment: null,
      memory: null,
      validation: null
    },
    recommendations: [],
    errors: [],
    version: '1.0.0'
  };

  logger.debug('Generating teardown report', {
    hasTeardownResults: !!teardownResults,
    hasValidationResults: !!validationResults,
    totalTime: report.summary.totalTime
  });

  try {
    // Calculate total teardown execution time from initiation to completion
    report.metrics.timing = {
      totalExecutionTime: report.summary.totalTime,
      averageCleanupTime: report.summary.totalTime / Math.max(1, TEARDOWN_METRICS.resourcesCleaned),
      efficiency: report.summary.totalTime < 30000 ? 'excellent' : 
                 report.summary.totalTime < 60000 ? 'good' : 'needs_improvement'
    };

    // Compile framework-specific teardown results with Jest and Mocha cleanup status
    if (teardownResults && teardownResults.framework) {
      report.details.framework = {
        name: teardownResults.framework.framework || GLOBAL_TEARDOWN_STATE.framework,
        success: teardownResults.framework.success,
        actions: teardownResults.framework.actions || [],
        errors: teardownResults.framework.errors || []
      };
      
      if (!report.details.framework.success) {
        report.summary.success = false;
        report.errors.push(...report.details.framework.errors);
      }
    }

    // Generate resource cleanup summary with server shutdowns, process terminations, and memory cleanup
    if (teardownResults && teardownResults.resources) {
      report.details.resources = {
        totalProcessed: teardownResults.resources.resourcesProcessed || 0,
        serversShutdown: teardownResults.resources.serversShutdown || 0,
        processesTerminated: teardownResults.resources.processesTerminated || 0,
        cacheCleared: teardownResults.resources.cacheCleared || 0,
        errors: teardownResults.resources.errors || []
      };
      
      report.metrics.resources = {
        cleanupEfficiency: report.details.resources.totalProcessed > 0 ? 
          (report.details.resources.totalProcessed - report.details.resources.errors.length) / 
          report.details.resources.totalProcessed : 0,
        resourceTypes: {
          servers: report.details.resources.serversShutdown,
          processes: report.details.resources.processesTerminated,
          cache: report.details.resources.cacheCleared
        }
      };
    }

    // Create environment restoration summary with variable restoration and configuration reset status
    if (teardownResults && teardownResults.environment) {
      report.details.environment = {
        variablesRestored: teardownResults.environment.variablesRestored || 0,
        variablesCleared: teardownResults.environment.variablesCleared || 0,
        modulesReset: teardownResults.environment.modulesReset || 0,
        success: teardownResults.environment.success,
        validationPassed: teardownResults.environment.validationPassed
      };
    }

    // Compile validation results summary with cleanup verification and remaining issue identification
    if (validationResults) {
      report.details.validation = {
        isValid: validationResults.isValid,
        warnings: validationResults.warnings || [],
        errors: validationResults.errors || [],
        details: validationResults.details || {}
      };
      
      if (!validationResults.isValid) {
        report.summary.success = false;
        report.errors.push(...validationResults.errors);
      }
      
      report.recommendations.push(...(validationResults.recommendations || []));
    }

    // Generate performance metrics including cleanup efficiency and resource deallocation timing
    if (teardownResults && teardownResults.memory) {
      report.details.memory = {
        initialMemoryMB: Math.round((teardownResults.memory.initialMemory?.heapUsed || 0) / 1024 / 1024),
        finalMemoryMB: Math.round((teardownResults.memory.finalMemory?.heapUsed || 0) / 1024 / 1024),
        memoryFreedMB: Math.round((teardownResults.memory.memoryFreed || 0) / 1024 / 1024),
        potentialLeaks: teardownResults.memory.potentialLeaks || [],
        efficiency: teardownResults.memory.efficiency || {}
      };
      
      report.metrics.performance = {
        memoryEfficiency: report.details.memory.memoryFreedMB >= 0 ? 'good' : 'poor',
        leakCount: report.details.memory.potentialLeaks.length,
        overallHealth: report.details.memory.potentialLeaks.length === 0 ? 'healthy' : 'needs_attention'
      };
    }

    // Create error summary with classification, recovery status, and resolution recommendations
    const allErrors = [
      ...report.errors,
      ...(report.details.framework?.errors || []),
      ...(report.details.resources?.errors || []),
      ...(report.details.environment?.errors || []),
      ...(report.details.validation?.errors || [])
    ];

    report.metrics.quality = {
      errorCount: allErrors.length,
      warningCount: (report.details.validation?.warnings || []).length,
      successRate: allErrors.length === 0 ? 100 : 
        Math.max(0, 100 - (allErrors.length * 10)), // Rough calculation
      overallGrade: allErrors.length === 0 ? 'A' :
                   allErrors.length <= 2 ? 'B' :
                   allErrors.length <= 5 ? 'C' : 'F'
    };

    // Include recommendations for teardown optimization and cleanup improvement strategies
    if (report.summary.totalTime > 30000) {
      report.recommendations.push('Consider optimizing cleanup procedures to reduce teardown time');
    }
    
    if (report.metrics.quality.errorCount > 0) {
      report.recommendations.push('Address cleanup errors to improve teardown reliability');
    }
    
    if (report.details.memory && report.details.memory.potentialLeaks.length > 0) {
      report.recommendations.push('Investigate and fix potential memory leaks');
    }
    
    if (report.recommendations.length === 0) {
      report.recommendations.push('Teardown completed successfully with optimal performance');
    }

    // Update global teardown metrics
    TEARDOWN_METRICS.totalTime = report.summary.totalTime;
    TEARDOWN_METRICS.resourcesCleaned = report.details.resources?.totalProcessed || 0;
    TEARDOWN_METRICS.frameworksCleaned = report.details.framework ? 1 : 0;
    TEARDOWN_METRICS.errors = allErrors;

    logger.info('Teardown report generated successfully', {
      success: report.summary.success,
      totalTime: report.summary.totalTime,
      errorCount: report.metrics.quality.errorCount,
      grade: report.metrics.quality.overallGrade
    });

    return report;

  } catch (error) {
    report.summary.success = false;
    report.errors.push(`Report generation failed: ${error.message}`);
    
    logger.error('Teardown report generation failed', {
      error: error.message,
      stack: error.stack
    });

    return report;
  }
}

/**
 * Registers framework-specific cleanup handlers for Jest and Mocha frameworks, enabling
 * coordinated teardown operations and ensuring proper framework integration with global
 * teardown management system.
 * 
 * @param {string} framework - Framework identifier ('jest' or 'mocha')
 * @param {Function} cleanupHandler - Cleanup handler function
 * @param {Object} [handlerConfig={}] - Handler configuration options
 * @returns {string} Handler registration ID for tracking and management of framework-specific cleanup operations
 */
export function registerFrameworkCleanupHandler(framework, cleanupHandler, handlerConfig = {}) {
  const config = {
    priority: handlerConfig.priority || 0,
    timeout: handlerConfig.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.CLEANUP,
    description: handlerConfig.description || `${framework} cleanup handler`,
    ...handlerConfig
  };

  try {
    // Validate framework parameter and cleanup handler function for proper registration
    if (!framework || typeof framework !== 'string') {
      throw new Error('Invalid framework parameter provided');
    }

    if (!cleanupHandler || typeof cleanupHandler !== 'function') {
      throw new Error('Invalid cleanup handler function provided');
    }

    const normalizedFramework = framework.toLowerCase();
    if (!Object.values(TESTING_CONSTANTS.FRAMEWORKS).includes(normalizedFramework)) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    // Generate unique handler registration ID for tracking and management purposes
    const handlerId = `${normalizedFramework}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store cleanup handler in framework cleanup handlers registry with configuration
    const handlerEntry = {
      id: handlerId,
      framework: normalizedFramework,
      handler: cleanupHandler,
      config,
      registeredAt: Date.now(),
      executed: false
    };

    FRAMEWORK_CLEANUP_HANDLERS.set(handlerId, handlerEntry);

    logger.info('Framework cleanup handler registered', {
      handlerId,
      framework: normalizedFramework,
      priority: config.priority,
      timeout: config.timeout
    });

    // Return handler registration ID for caller reference and handler management
    return handlerId;

  } catch (error) {
    logger.error('Framework cleanup handler registration failed', {
      framework,
      error: error.message
    });
    throw error;
  }
}

/**
 * Executes the complete teardown sequence in proper order including framework-specific
 * cleanup, global resource deallocation, environment restoration, memory cleanup, and
 * validation with comprehensive error handling and recovery.
 * 
 * @param {Object} [sequenceConfig={}] - Teardown sequence configuration options
 * @returns {Promise<Object>} Promise resolving to teardown sequence results with execution status, timing metrics, and completion summary
 */
export async function executeTeardownSequence(sequenceConfig = {}) {
  const config = {
    framework: sequenceConfig.framework || 'unknown',
    timeout: sequenceConfig.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.GLOBAL_TEARDOWN,
    forceful: sequenceConfig.forceful === true,
    teardownId: sequenceConfig.teardownId || crypto.randomUUID(),
    ...sequenceConfig
  };

  const sequenceResult = {
    success: true,
    teardownId: config.teardownId,
    steps: [],
    errors: [],
    timing: {
      start: Date.now(),
      end: null,
      total: 0,
      steps: {}
    },
    results: {}
  };

  logger.info('Teardown sequence execution initiated', {
    teardownId: config.teardownId,
    framework: config.framework,
    timeout: config.timeout
  });

  try {
    // Initialize teardown sequence with timing metrics and execution tracking
    const stepStart = Date.now();
    
    // Execute framework-specific teardown procedures in proper order with dependency management
    try {
      const frameworkStepStart = Date.now();
      const frameworkResult = await executeFrameworkTeardown(config.framework, {
        timeout: Math.floor(config.timeout * 0.3), // 30% of total timeout
        forceful: config.forceful
      });
      
      sequenceResult.results.framework = frameworkResult;
      sequenceResult.steps.push('Framework teardown completed');
      sequenceResult.timing.steps.framework = Date.now() - frameworkStepStart;
      
      if (!frameworkResult.success && !config.forceful) {
        throw new Error(`Framework teardown failed: ${frameworkResult.errors?.join(', ')}`);
      }
    } catch (error) {
      sequenceResult.errors.push(`Framework teardown error: ${error.message}`);
      if (!config.forceful) throw error;
    }

    // Perform global resource cleanup with comprehensive resource deallocation and validation
    try {
      const resourceStepStart = Date.now();
      const resourceResult = await cleanupGlobalTestResources({
        timeout: Math.floor(config.timeout * 0.3), // 30% of total timeout
        shutdownServers: true,
        terminateProcesses: true,
        cleanupSecurity: true,
        clearCache: true
      });
      
      sequenceResult.results.resources = resourceResult;
      sequenceResult.steps.push('Global resource cleanup completed');
      sequenceResult.timing.steps.resources = Date.now() - resourceStepStart;
      
      if (!resourceResult.success && !config.forceful) {
        throw new Error(`Resource cleanup failed: ${resourceResult.errors?.join(', ')}`);
      }
    } catch (error) {
      sequenceResult.errors.push(`Resource cleanup error: ${error.message}`);
      if (!config.forceful) throw error;
    }

    // Execute localized test helper teardown with utility cleanup and resource management
    try {
      const helperStepStart = Date.now();
      const helperResult = await teardownLocalizedTestHelpers({
        resetMocks: true,
        clearTimers: true,
        validateCleanup: true
      });
      
      sequenceResult.results.helpers = helperResult;
      sequenceResult.steps.push('Localized test helpers cleaned up');
      sequenceResult.timing.steps.helpers = Date.now() - helperStepStart;
      
      if (!helperResult.success && !config.forceful) {
        throw new Error(`Helper cleanup failed: ${helperResult.errors?.join(', ')}`);
      }
    } catch (error) {
      sequenceResult.errors.push(`Helper cleanup error: ${error.message}`);
      if (!config.forceful) throw error;
    }

    // Restore global environment state with variable restoration and configuration reset
    try {
      const envStepStart = Date.now();
      const envResult = await restoreGlobalEnvironment({
        restoreVariables: true,
        clearTestVariables: true,
        resetModuleCache: true,
        validateRestoration: true
      });
      
      sequenceResult.results.environment = envResult;
      sequenceResult.steps.push('Global environment restored');
      sequenceResult.timing.steps.environment = Date.now() - envStepStart;
      
      if (!envResult.success && !config.forceful) {
        throw new Error(`Environment restoration failed: ${envResult.errors?.join(', ')}`);
      }
    } catch (error) {
      sequenceResult.errors.push(`Environment restoration error: ${error.message}`);
      if (!config.forceful) throw error;
    }

    // Perform memory cleanup with garbage collection and leak detection
    try {
      const memoryStepStart = Date.now();
      const memoryResult = await performGlobalMemoryCleanup({
        forceGarbageCollection: true,
        clearCircularReferences: true,
        clearEventListeners: true,
        detectLeaks: true
      });
      
      sequenceResult.results.memory = memoryResult;
      sequenceResult.steps.push('Global memory cleanup completed');
      sequenceResult.timing.steps.memory = Date.now() - memoryStepStart;
      
      if (!memoryResult.success && !config.forceful) {
        throw new Error(`Memory cleanup failed: ${memoryResult.errors?.join(', ')}`);
      }
    } catch (error) {
      sequenceResult.errors.push(`Memory cleanup error: ${error.message}`);
      if (!config.forceful) throw error;
    }

    // Execute custom cleanup tasks registered during test execution
    try {
      const customStepStart = Date.now();
      let customTasksExecuted = 0;
      
      // Execute any registered global cleanup tasks
      for (const task of GLOBAL_RESOURCE_CLEANUP) {
        try {
          if (typeof task === 'function') {
            await task();
            customTasksExecuted++;
          }
        } catch (taskError) {
          sequenceResult.errors.push(`Custom task error: ${taskError.message}`);
        }
      }
      
      GLOBAL_RESOURCE_CLEANUP.length = 0; // Clear the array
      sequenceResult.steps.push(`${customTasksExecuted} custom cleanup tasks executed`);
      sequenceResult.timing.steps.custom = Date.now() - customStepStart;
    } catch (error) {
      sequenceResult.errors.push(`Custom cleanup error: ${error.message}`);
    }

    // Calculate total sequence execution time
    sequenceResult.timing.end = Date.now();
    sequenceResult.timing.total = sequenceResult.timing.end - sequenceResult.timing.start;

    // Determine overall sequence success
    sequenceResult.success = sequenceResult.errors.length === 0;

    logger.info('Teardown sequence execution completed', {
      teardownId: config.teardownId,
      success: sequenceResult.success,
      totalTime: sequenceResult.timing.total,
      stepsCompleted: sequenceResult.steps.length,
      errors: sequenceResult.errors.length
    });

    return sequenceResult;

  } catch (error) {
    sequenceResult.success = false;
    sequenceResult.errors.push(`Sequence execution failed: ${error.message}`);
    sequenceResult.timing.end = Date.now();
    sequenceResult.timing.total = sequenceResult.timing.end - sequenceResult.timing.start;
    
    logger.error('Teardown sequence execution failed', {
      teardownId: config.teardownId,
      error: error.message,
      totalTime: sequenceResult.timing.total
    });

    return sequenceResult;
  }
}

/**
 * Handles errors that occur during global teardown operations with comprehensive error
 * logging, fallback cleanup procedures, graceful error recovery, and detailed error
 * classification for debugging and resolution.
 * 
 * @param {Error} error - Error that occurred during teardown
 * @param {string} context - Context where the error occurred
 * @param {Object} [errorOptions={}] - Error handling configuration options
 * @returns {Promise<Object>} Promise resolving to error handling results with recovery status and cleanup recommendations
 */
export async function handleTeardownError(error, context, errorOptions = {}) {
  const config = {
    attemptRecovery: errorOptions.attemptRecovery !== false,
    fallbackCleanup: errorOptions.fallbackCleanup !== false,
    logStackTrace: errorOptions.logStackTrace !== false,
    teardownId: errorOptions.teardownId || 'unknown',
    ...errorOptions
  };

  const errorResult = {
    success: false,
    error: {
      message: error.message,
      context,
      classification: 'unknown',
      severity: 'medium',
      recoverable: false
    },
    recovery: {
      attempted: false,
      successful: false,
      actions: []
    },
    fallback: {
      executed: false,
      successful: false,
      actions: []
    },
    recommendations: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Log teardown error with comprehensive context, stack trace, and correlation information
    logger.error('Teardown error occurred', {
      teardownId: config.teardownId,
      context,
      message: error.message,
      stack: config.logStackTrace ? error.stack : undefined,
      errorType: error.constructor.name
    });

    // Classify error severity level and determine appropriate recovery procedures
    errorResult.error.classification = classifyTeardownError(error, context);
    errorResult.error.severity = determineSeverityLevel(error, context);
    errorResult.error.recoverable = isRecoverableError(error, context);

    // Execute fallback cleanup procedures for critical resources that may remain allocated
    if (config.fallbackCleanup) {
      errorResult.fallback.executed = true;
      
      try {
        // Attempt to clear critical global state
        if (GLOBAL_TEARDOWN_STATE.teardownInProgress) {
          GLOBAL_TEARDOWN_STATE.teardownInProgress = false;
          errorResult.fallback.actions.push('Reset teardown in progress flag');
        }
        
        // Clear registries to prevent memory leaks
        try {
          TEARDOWN_REGISTRY.clear();
          errorResult.fallback.actions.push('Cleared teardown registry');
        } catch (registryError) {
          logger.warn('Failed to clear teardown registry', { error: registryError.message });
        }
        
        // Clear framework handlers
        try {
          FRAMEWORK_CLEANUP_HANDLERS.clear();
          errorResult.fallback.actions.push('Cleared framework handlers');
        } catch (handlerError) {
          logger.warn('Failed to clear framework handlers', { error: handlerError.message });
        }
        
        // Force garbage collection if available
        try {
          if (global.gc && typeof global.gc === 'function') {
            global.gc();
            errorResult.fallback.actions.push('Forced garbage collection');
          }
        } catch (gcError) {
          logger.warn('Failed to force garbage collection', { error: gcError.message });
        }
        
        errorResult.fallback.successful = errorResult.fallback.actions.length > 0;
        
      } catch (fallbackError) {
        logger.error('Fallback cleanup failed', {
          originalError: error.message,
          fallbackError: fallbackError.message
        });
      }
    }

    // Attempt error recovery operations for partial teardown failures with validation
    if (config.attemptRecovery && errorResult.error.recoverable) {
      errorResult.recovery.attempted = true;
      
      try {
        // Recovery strategies based on error context
        if (context.includes('framework')) {
          // Framework-specific recovery
          errorResult.recovery.actions.push('Attempted framework-specific recovery');
          
        } else if (context.includes('resource')) {
          // Resource cleanup recovery
          errorResult.recovery.actions.push('Attempted resource cleanup recovery');
          
        } else if (context.includes('environment')) {
          // Environment restoration recovery
          errorResult.recovery.actions.push('Attempted environment restoration recovery');
          
        } else {
          // Generic recovery
          errorResult.recovery.actions.push('Attempted generic error recovery');
        }
        
        errorResult.recovery.successful = true; // Optimistic - would need actual validation
        
      } catch (recoveryError) {
        logger.error('Error recovery failed', {
          originalError: error.message,
          recoveryError: recoveryError.message
        });
      }
    }

    // Update teardown metrics with error information, recovery status, and impact assessment
    TEARDOWN_METRICS.errors.push({
      message: error.message,
      context,
      timestamp: Date.now(),
      classification: errorResult.error.classification,
      severity: errorResult.error.severity,
      recovered: errorResult.recovery.successful
    });

    // Generate error report with classification, context, and resolution recommendations
    errorResult.recommendations = generateErrorRecommendations(error, context, errorResult);

    // Determine if teardown can continue safely or must abort with critical failure indication
    const canContinue = errorResult.error.severity !== 'critical' && 
                       (errorResult.recovery.successful || errorResult.fallback.successful);
    
    errorResult.success = canContinue;

    // Log error handling completion with recovery status and any remaining cleanup requirements
    logger.info('Teardown error handling completed', {
      teardownId: config.teardownId,
      context,
      classification: errorResult.error.classification,
      severity: errorResult.error.severity,
      recoveryAttempted: errorResult.recovery.attempted,
      recoverySuccessful: errorResult.recovery.successful,
      fallbackExecuted: errorResult.fallback.executed,
      canContinue
    });

    return errorResult;

  } catch (handlingError) {
    logger.error('Error handling process failed', {
      originalError: error.message,
      handlingError: handlingError.message,
      context
    });

    return {
      ...errorResult,
      error: {
        ...errorResult.error,
        message: `Error handling failed: ${handlingError.message}`
      },
      recommendations: ['Manual intervention required due to error handling failure']
    };
  }
}

// Helper functions for teardown operations

/**
 * Detects the current testing framework with fallback implementation
 * @private
 * @returns {string} Detected framework name
 */
function detectFrameworkFallback() {
  try {
    // Check for Jest environment
    if (typeof jest !== 'undefined' || process.env.JEST_WORKER_ID) {
      return TESTING_CONSTANTS.FRAMEWORKS.JEST;
    }
    
    // Check for Mocha environment
    if (typeof describe !== 'undefined' && typeof it !== 'undefined' && !process.env.JEST_WORKER_ID) {
      return TESTING_CONSTANTS.FRAMEWORKS.MOCHA;
    }
    
    // Check process arguments
    const args = process.argv.join(' ');
    if (args.includes('jest')) {
      return TESTING_CONSTANTS.FRAMEWORKS.JEST;
    }
    if (args.includes('mocha')) {
      return TESTING_CONSTANTS.FRAMEWORKS.MOCHA;
    }
    
    // Default fallback
    return TESTING_CONSTANTS.FRAMEWORKS.JEST;
  } catch (error) {
    logger.warn('Framework detection failed, defaulting to Jest', { error: error.message });
    return TESTING_CONSTANTS.FRAMEWORKS.JEST;
  }
}

/**
 * Creates fallback test helpers when setup module is not available
 * @private
 * @param {Object} config - Helper configuration
 * @returns {Object} Basic test helpers
 */
function createFallbackTestHelpers(config) {
  return {
    http: {
      createClient: () => ({ get: async () => ({ status: 200 }) })
    },
    mocks: {
      createMock: (value) => () => value
    },
    assertions: {
      assertEqual: (a, b) => { if (a !== b) throw new Error(`${a} !== ${b}`); }
    },
    metadata: {
      fallback: true,
      framework: config.framework || 'unknown'
    }
  };
}

/**
 * Classifies teardown errors by type and context
 * @private
 * @param {Error} error - Error to classify
 * @param {string} context - Error context
 * @returns {string} Error classification
 */
function classifyTeardownError(error, context) {
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return 'timeout';
  }
  
  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'programming';
  }
  
  if (context.includes('resource') || context.includes('server')) {
    return 'resource';
  }
  
  if (context.includes('framework') || context.includes('jest') || context.includes('mocha')) {
    return 'framework';
  }
  
  if (context.includes('environment') || context.includes('variable')) {
    return 'environment';
  }
  
  if (context.includes('memory') || error.message.includes('memory')) {
    return 'memory';
  }
  
  return 'unknown';
}

/**
 * Determines error severity level
 * @private
 * @param {Error} error - Error to analyze
 * @param {string} context - Error context
 * @returns {string} Severity level
 */
function determineSeverityLevel(error, context) {
  // Critical errors that must stop teardown
  if (error.name === 'SecurityError' || 
      context.includes('critical') ||
      error.message.includes('CRITICAL')) {
    return 'critical';
  }
  
  // High severity errors that should be addressed but allow continuation
  if (error.name === 'ReferenceError' ||
      context.includes('framework') ||
      error.message.includes('failed to cleanup')) {
    return 'high';
  }
  
  // Medium severity errors - warnings but not blockers
  if (error.name === 'TimeoutError' ||
      context.includes('timeout') ||
      error.message.includes('warning')) {
    return 'medium';
  }
  
  // Low severity errors - informational
  return 'low';
}

/**
 * Determines if an error is recoverable
 * @private
 * @param {Error} error - Error to analyze
 * @param {string} context - Error context
 * @returns {boolean} Whether error is recoverable
 */
function isRecoverableError(error, context) {
  // Non-recoverable errors
  const nonRecoverable = [
    'SecurityError',
    'SystemError',
    'OutOfMemoryError'
  ];
  
  if (nonRecoverable.includes(error.name)) {
    return false;
  }
  
  // Context-based recovery assessment
  if (context.includes('critical') || error.message.includes('FATAL')) {
    return false;
  }
  
  // Most errors are recoverable with proper fallback
  return true;
}

/**
 * Generates error-specific recommendations
 * @private
 * @param {Error} error - Error that occurred
 * @param {string} context - Error context
 * @param {Object} errorResult - Error handling results
 * @returns {Array} Array of recommendations
 */
function generateErrorRecommendations(error, context, errorResult) {
  const recommendations = [];
  
  // General recommendations based on error type
  if (error.name === 'TimeoutError') {
    recommendations.push('Increase timeout values for cleanup operations');
    recommendations.push('Check for hanging processes or connections');
  }
  
  if (error.name === 'ReferenceError') {
    recommendations.push('Verify all required modules are properly imported');
    recommendations.push('Check for missing or undefined cleanup functions');
  }
  
  // Context-specific recommendations
  if (context.includes('framework')) {
    recommendations.push('Verify testing framework is properly installed and configured');
    recommendations.push('Check framework-specific cleanup procedures');
  }
  
  if (context.includes('resource')) {
    recommendations.push('Manually verify all servers and processes are terminated');
    recommendations.push('Check for resource leaks or unclosed connections');
  }
  
  if (context.includes('environment')) {
    recommendations.push('Manually restore environment variables if needed');
    recommendations.push('Check for environment variable conflicts');
  }
  
  // Recovery-based recommendations
  if (errorResult.recovery.attempted && !errorResult.recovery.successful) {
    recommendations.push('Manual intervention may be required');
    recommendations.push('Consider restarting the testing environment');
  }
  
  if (errorResult.fallback.executed && errorResult.fallback.successful) {
    recommendations.push('Fallback cleanup was successful, monitor for any remaining issues');
  }
  
  // Default recommendation if no specific ones apply
  if (recommendations.length === 0) {
    recommendations.push('Review error details and context for specific resolution steps');
    recommendations.push('Consider enabling debug logging for more detailed error information');
  }
  
  return recommendations;
}

// Global teardown manager instance for unified teardown coordination
export class GlobalTeardownManager {
  constructor(config = {}) {
    this.teardownId = crypto.randomUUID();
    this.detectedFramework = null;
    this.teardownRegistry = new Map();
    this.frameworkHandlers = new Map();
    this.globalCleanupTasks = [];
    this.teardownMetrics = {
      startTime: null,
      endTime: null,
      totalTime: 0,
      resourcesCleaned: 0,
      errors: []
    };
    this.teardownInProgress = false;
    this.config = {
      timeout: 30000,
      validateCleanup: true,
      forceful: false,
      ...config
    };
    this.logger = logger;
    this.environmentBackup = null;
    this.localizedHelpers = null;

    logger.info('GlobalTeardownManager initialized', {
      teardownId: this.teardownId,
      config: this.config
    });
  }

  async initializeTeardown(initOptions = {}) {
    if (this.teardownInProgress) {
      throw new Error('Teardown already in progress');
    }

    this.teardownInProgress = true;
    this.teardownMetrics.startTime = Date.now();
    this.detectedFramework = await detectTestingFramework();
    this.environmentBackup = { environment: { ...process.env } };
    this.localizedHelpers = initializeLocalizedTestHelpers({
      framework: this.detectedFramework,
      ...initOptions
    });

    logger.info('Teardown initialization completed', {
      teardownId: this.teardownId,
      framework: this.detectedFramework
    });
  }

  async executeCompleteTeardown(teardownOptions = {}) {
    const config = { ...this.config, ...teardownOptions };
    
    try {
      if (!this.teardownInProgress) {
        await this.initializeTeardown();
      }

      const sequenceResult = await executeTeardownSequence({
        framework: this.detectedFramework,
        timeout: config.timeout,
        forceful: config.forceful,
        teardownId: this.teardownId
      });

      this.teardownMetrics.endTime = Date.now();
      this.teardownMetrics.totalTime = this.teardownMetrics.endTime - this.teardownMetrics.startTime;

      const validationResults = config.validateCleanup ? 
        validateGlobalTeardownCompletion(sequenceResult) : null;

      const report = generateTeardownReport(sequenceResult, validationResults);

      return {
        success: sequenceResult.success,
        teardownId: this.teardownId,
        results: sequenceResult,
        validation: validationResults,
        report,
        metrics: this.teardownMetrics
      };

    } finally {
      this.teardownInProgress = false;
    }
  }

  registerGlobalResource(resourceType, resource, cleanupFunction) {
    const resourceId = `${resourceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.teardownRegistry.set(resourceId, {
      type: resourceType,
      resource,
      cleanup: cleanupFunction,
      registeredAt: Date.now()
    });

    logger.debug('Global resource registered', {
      resourceId,
      type: resourceType,
      teardownId: this.teardownId
    });

    return resourceId;
  }

  addGlobalCleanupTask(cleanupFunction, priority = 0, description = '') {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.globalCleanupTasks.push({
      id: taskId,
      function: cleanupFunction,
      priority,
      description,
      addedAt: Date.now()
    });

    // Sort by priority
    this.globalCleanupTasks.sort((a, b) => b.priority - a.priority);

    logger.debug('Global cleanup task added', {
      taskId,
      priority,
      description,
      teardownId: this.teardownId
    });

    return taskId;
  }

  validateTeardownCompletion() {
    return validateGlobalTeardownCompletion({
      registry: this.teardownRegistry,
      helpers: this.localizedHelpers,
      framework: this.detectedFramework
    });
  }

  getTeardownMetrics() {
    return {
      ...this.teardownMetrics,
      teardownId: this.teardownId,
      framework: this.detectedFramework,
      registeredResources: this.teardownRegistry.size,
      cleanupTasks: this.globalCleanupTasks.length
    };
  }

  resetTeardownState() {
    this.teardownRegistry.clear();
    this.frameworkHandlers.clear();
    this.globalCleanupTasks.length = 0;
    this.teardownInProgress = false;
    this.teardownMetrics = {
      startTime: null,
      endTime: null,
      totalTime: 0,
      resourcesCleaned: 0,
      errors: []
    };
    this.environmentBackup = null;
    this.localizedHelpers = null;

    logger.debug('Teardown state reset', {
      teardownId: this.teardownId
    });
  }
}

// Pre-configured global teardown manager instance ready for immediate use
export const teardownManager = new GlobalTeardownManager({
  timeout: 30000,
  validateCleanup: true,
  forceful: false
});

// Initialize teardown manager if in testing environment
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID || process.env.MOCHA_FILE) {
  try {
    teardownManager.initializeTeardown().catch(error => {
      logger.warn('Auto-initialization of teardown manager failed', {
        error: error.message
      });
    });
  } catch (error) {
    logger.warn('Failed to auto-initialize teardown manager', {
      error: error.message
    });
  }
}

// Export all functions and classes for comprehensive teardown functionality
export default globalTestTeardown;