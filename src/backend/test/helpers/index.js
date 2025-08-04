// Main test helpers index module - Central entry point for comprehensive testing utilities
// Supports both Jest and Mocha testing frameworks with Node.js v22.x LTS compatibility
// Educational demonstration of testing patterns and best practices through organized helper utility access

// Import comprehensive test helper utilities from test-helpers.js module
import {
  createHTTPTestHelper,
  createMockDataHelper,
  createAssertionHelper,
  createPerformanceTestHelper,
  createSecurityTestHelper,
  createCrossPlatformTestHelper,
  createPM2TestHelper,
  waitFor,
  createTestDataSet,
  setupTestHelpers,
  teardownTestHelpers,
  validateTestEnvironment
} from './test-helpers.js';

// Import mock data generation utilities from mock-data.js module
import {
  createMockHTTPRequest,
  createMockHTTPResponse,
  createMockControllerData,
  createMockServiceData,
  createMockSecurityData,
  createMockPerformanceData,
  createMockCrossPlatformData,
  createMockPM2Data,
  createMockErrorScenarios,
  generateTestDataSeed,
  createMockTestFixtures,
  resetMockDataCache,
  validateMockData
} from './mock-data.js';

// Import setup and configuration utilities from setup-helpers.js module
import {
  setupExpressTestServer,
  setupTestDatabase,
  setupTestEnvironmentVariables,
  setupSecurityTestEnvironment,
  setupCrossPlatformTestEnvironment,
  setupPM2TestEnvironment,
  setupPerformanceTestEnvironment,
  setupMockDataEnvironment,
  setupTestLogger,
  setupTestTimeout,
  setupTestIsolation,
  validateSetupConfiguration
} from './setup-helpers.js';

/**
 * Comprehensive initialization function that sets up all test helper utilities 
 * by coordinating setupTestHelpers, setupMockDataEnvironment, and validateSetupConfiguration functions.
 * Provides unified initialization interface for both Jest and Mocha frameworks with educational 
 * logging and configuration validation.
 * 
 * @param {Object} config - Configuration object for test helper initialization
 * @param {string} testFramework - Testing framework identifier ('jest' or 'mocha')
 * @returns {Object} Initialized test helpers bundle with all utilities, validation results, and educational information
 */
export async function initializeTestHelpers(config = {}, testFramework = 'jest') {
  try {
    // Step 1: Validate initialization configuration using validateSetupConfiguration 
    // for dependency and environment checking
    console.log('[Test Helpers] Starting comprehensive test helper initialization...');
    const validationResults = await validateSetupConfiguration(config);
    
    if (!validationResults.isValid) {
      console.warn('[Test Helpers] Configuration validation warnings:', validationResults.warnings);
      if (validationResults.errors.length > 0) {
        throw new Error(`Configuration validation failed: ${validationResults.errors.join(', ')}`);
      }
    }

    // Step 2: Initialize mock data environment using setupMockDataEnvironment 
    // with Faker.js configuration and seed management
    console.log('[Test Helpers] Initializing mock data environment...');
    const mockDataEnvironment = await setupMockDataEnvironment({
      framework: testFramework,
      seed: config.mockDataSeed || Date.now(),
      ...config.mockData
    });

    // Step 3: Set up comprehensive test helpers using setupTestHelpers 
    // with framework detection and utility initialization
    console.log('[Test Helpers] Setting up comprehensive test helpers...');
    const testHelpers = await setupTestHelpers({
      framework: testFramework,
      mockDataEnvironment,
      ...config.testHelpers
    });

    // Step 4: Configure test environment variables using setupTestEnvironmentVariables 
    // for proper test isolation
    console.log('[Test Helpers] Configuring test environment variables...');
    const environmentConfig = await setupTestEnvironmentVariables({
      framework: testFramework,
      isolationLevel: config.isolationLevel || 'high',
      ...config.environment
    });

    // Step 5: Initialize test logger using setupTestLogger 
    // for educational logging and execution tracking
    console.log('[Test Helpers] Initializing test logger...');
    const loggerConfig = await setupTestLogger({
      framework: testFramework,
      logLevel: config.logLevel || 'info',
      educational: true,
      ...config.logging
    });

    // Step 6: Set up test timeout configuration using setupTestTimeout 
    // for framework-specific timeout management
    console.log('[Test Helpers] Setting up test timeout configuration...');
    const timeoutConfig = await setupTestTimeout({
      framework: testFramework,
      defaultTimeout: config.defaultTimeout || 5000,
      asyncTimeout: config.asyncTimeout || 10000,
      ...config.timeouts
    });

    // Step 7: Configure test isolation using setupTestIsolation 
    // for preventing test interference and ensuring clean execution
    console.log('[Test Helpers] Configuring test isolation...');
    const isolationConfig = await setupTestIsolation({
      framework: testFramework,
      isolationLevel: config.isolationLevel || 'high',
      cleanupStrategy: config.cleanupStrategy || 'aggressive',
      ...config.isolation
    });

    // Step 8: Generate initialization summary with configured utilities, warnings, and educational recommendations
    const initializationSummary = {
      framework: testFramework,
      timestamp: new Date().toISOString(),
      status: 'initialized',
      components: {
        validation: validationResults,
        mockData: mockDataEnvironment,
        testHelpers: testHelpers,
        environment: environmentConfig,
        logging: loggerConfig,
        timeouts: timeoutConfig,
        isolation: isolationConfig
      },
      metrics: {
        initializationTime: Date.now() - (config.startTime || Date.now()),
        helpersInitialized: Object.keys(testHelpers).length,
        mockFactoriesReady: Object.keys(mockDataEnvironment.factories || {}).length
      },
      recommendations: [
        'Use createHTTPTestHelper for SuperTest-based API endpoint testing',
        'Leverage createMockDataHelper for realistic test data generation',
        'Apply createSecurityTestHelper for Helmet.js validation testing',
        'Implement createPerformanceTestHelper for response time measurement',
        'Utilize createPM2TestHelper for production deployment testing'
      ]
    };

    console.log('[Test Helpers] Initialization completed successfully');
    console.log('[Test Helpers] Educational Info:', {
      framework: testFramework,
      helpersCount: initializationSummary.metrics.helpersInitialized,
      mockFactories: initializationSummary.metrics.mockFactoriesReady,
      initTime: `${initializationSummary.metrics.initializationTime}ms`
    });

    // Step 9: Return comprehensive test helpers bundle with all initialized utilities and validation information
    return {
      // Core helper factories
      createHTTPTestHelper: (options = {}) => createHTTPTestHelper({ ...options, framework: testFramework }),
      createMockDataHelper: (options = {}) => createMockDataHelper({ ...options, environment: mockDataEnvironment }),
      createAssertionHelper: (options = {}) => createAssertionHelper({ ...options, framework: testFramework }),
      createPerformanceTestHelper: (options = {}) => createPerformanceTestHelper({ ...options, framework: testFramework }),
      createSecurityTestHelper: (options = {}) => createSecurityTestHelper({ ...options, framework: testFramework }),
      createCrossPlatformTestHelper: (options = {}) => createCrossPlatformTestHelper({ ...options, framework: testFramework }),
      createPM2TestHelper: (options = {}) => createPM2TestHelper({ ...options, framework: testFramework }),
      
      // Utility functions
      waitFor,
      createTestDataSet,
      validateTestEnvironment,
      
      // Mock data factories
      createMockHTTPRequest: (options = {}) => createMockHTTPRequest({ ...options, environment: mockDataEnvironment }),
      createMockHTTPResponse: (options = {}) => createMockHTTPResponse({ ...options, environment: mockDataEnvironment }),
      createMockControllerData: (options = {}) => createMockControllerData({ ...options, environment: mockDataEnvironment }),
      createMockServiceData: (options = {}) => createMockServiceData({ ...options, environment: mockDataEnvironment }),
      createMockSecurityData: (options = {}) => createMockSecurityData({ ...options, environment: mockDataEnvironment }),
      createMockPerformanceData: (options = {}) => createMockPerformanceData({ ...options, environment: mockDataEnvironment }),
      createMockCrossPlatformData: (options = {}) => createMockCrossPlatformData({ ...options, environment: mockDataEnvironment }),
      createMockPM2Data: (options = {}) => createMockPM2Data({ ...options, environment: mockDataEnvironment }),
      createMockErrorScenarios: (options = {}) => createMockErrorScenarios({ ...options, environment: mockDataEnvironment }),
      generateTestDataSeed,
      createMockTestFixtures: (options = {}) => createMockTestFixtures({ ...options, environment: mockDataEnvironment }),
      resetMockDataCache,
      validateMockData,
      
      // Setup utilities
      setupExpressTestServer,
      setupTestDatabase,
      setupTestEnvironmentVariables,
      setupSecurityTestEnvironment,
      setupCrossPlatformTestEnvironment,
      setupPM2TestEnvironment,
      setupPerformanceTestEnvironment,
      setupMockDataEnvironment,
      setupTestLogger,
      setupTestTimeout,
      setupTestIsolation,
      validateSetupConfiguration,
      
      // Configuration and metadata
      config: initializationSummary,
      framework: testFramework,
      isInitialized: true
    };

  } catch (error) {
    console.error('[Test Helpers] Initialization failed:', error.message);
    console.error('[Test Helpers] Stack trace:', error.stack);
    
    // Return partial initialization state for debugging
    return {
      isInitialized: false,
      error: error.message,
      framework: testFramework,
      timestamp: new Date().toISOString(),
      troubleshooting: [
        'Verify all test helper modules are available',
        'Check Node.js version compatibility (>=18.18.0)',
        'Ensure testing framework is properly installed',
        'Validate configuration object structure',
        'Review dependency availability and versions'
      ]
    };
  }
}

/**
 * Comprehensive cleanup function that coordinates teardownTestHelpers, resetMockDataCache, 
 * and all test environment cleanup operations. Provides unified cleanup interface for ensuring 
 * complete test resource deallocation and environment reset between test runs.
 * 
 * @returns {Promise<void>} Promise that resolves when all test helper cleanup operations are complete
 */
export async function cleanupTestHelpers() {
  try {
    console.log('[Test Helpers] Starting comprehensive cleanup operations...');
    const cleanupStartTime = Date.now();

    // Step 1: Execute teardownTestHelpers for comprehensive test helper resource cleanup and deallocation
    console.log('[Test Helpers] Executing teardown of test helpers...');
    await teardownTestHelpers();

    // Step 2: Reset mock data cache using resetMockDataCache for clean test isolation and cache clearing
    console.log('[Test Helpers] Resetting mock data cache...');
    await resetMockDataCache();

    // Step 3: Clean up test environment variables and restore original environment state
    console.log('[Test Helpers] Cleaning up test environment variables...');
    const originalEnv = process.env.ORIGINAL_ENV || {};
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('TEST_') || key.startsWith('MOCK_')) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);

    // Step 4: Close all test servers and cleanup HTTP test connections using Express test server cleanup
    console.log('[Test Helpers] Closing test servers and HTTP connections...');
    if (global.testServers && Array.isArray(global.testServers)) {
      await Promise.all(global.testServers.map(server => 
        new Promise(resolve => {
          if (server && typeof server.close === 'function') {
            server.close(resolve);
          } else {
            resolve();
          }
        })
      ));
      global.testServers = [];
    }

    // Step 5: Clear performance measurement data and benchmark caches for fresh test execution
    console.log('[Test Helpers] Clearing performance measurement data...');
    if (global.performanceCache) {
      global.performanceCache.clear();
    }
    if (global.benchmarkData) {
      global.benchmarkData = {};
    }

    // Step 6: Clean up security testing temporary certificates and configuration files
    console.log('[Test Helpers] Cleaning up security testing artifacts...');
    if (global.securityTestArtifacts && Array.isArray(global.securityTestArtifacts)) {
      global.securityTestArtifacts.forEach(artifact => {
        try {
          if (artifact.cleanup && typeof artifact.cleanup === 'function') {
            artifact.cleanup();
          }
        } catch (cleanupError) {
          console.warn('[Test Helpers] Security artifact cleanup warning:', cleanupError.message);
        }
      });
      global.securityTestArtifacts = [];
    }

    // Step 7: Reset cross-platform testing utilities and conversion caches with state cleanup
    console.log('[Test Helpers] Resetting cross-platform testing utilities...');
    if (global.crossPlatformCache) {
      global.crossPlatformCache.clear();
    }
    if (global.conversionCache) {
      global.conversionCache.clear();
    }

    // Step 8: Clean up PM2 testing processes and configuration files with process termination
    console.log('[Test Helpers] Cleaning up PM2 testing processes...');
    if (global.pm2TestProcesses && Array.isArray(global.pm2TestProcesses)) {
      global.pm2TestProcesses.forEach(processInfo => {
        try {
          if (processInfo.cleanup && typeof processInfo.cleanup === 'function') {
            processInfo.cleanup();
          }
        } catch (processCleanupError) {
          console.warn('[Test Helpers] PM2 process cleanup warning:', processCleanupError.message);
        }
      });
      global.pm2TestProcesses = [];
    }

    // Step 9: Perform final garbage collection hints and memory cleanup operations
    console.log('[Test Helpers] Performing final memory cleanup...');
    if (global.gc && typeof global.gc === 'function') {
      global.gc();
    }
    
    // Clear any remaining global test state
    delete global.testHelpersInitialized;
    delete global.mockDataEnvironment;
    delete global.testConfiguration;

    // Step 10: Log cleanup completion for debugging and test execution tracking
    const cleanupDuration = Date.now() - cleanupStartTime;
    console.log(`[Test Helpers] Cleanup completed successfully in ${cleanupDuration}ms`);
    console.log('[Test Helpers] All test resources have been properly deallocated');

  } catch (error) {
    console.error('[Test Helpers] Cleanup operation failed:', error.message);
    console.error('[Test Helpers] Cleanup stack trace:', error.stack);
    
    // Attempt partial cleanup to prevent resource leaks
    try {
      if (global.testServers) global.testServers = [];
      if (global.performanceCache) global.performanceCache.clear();
      if (global.crossPlatformCache) global.crossPlatformCache.clear();
      console.log('[Test Helpers] Partial cleanup completed to prevent resource leaks');
    } catch (partialCleanupError) {
      console.error('[Test Helpers] Partial cleanup also failed:', partialCleanupError.message);
    }
    
    throw error; // Re-throw to ensure test frameworks are aware of cleanup failures
  }
}

// Export all individual helper utilities for direct access
// HTTP Testing Helpers - SuperTest-based API endpoint testing and validation
export { createHTTPTestHelper };

// Mock Data Helpers - Faker.js-based realistic test data creation
export { createMockDataHelper };

// Assertion Helpers - Jest and Mocha framework-specific testing utilities
export { createAssertionHelper };

// Performance Testing Helpers - Response time measurement and resource usage validation
export { createPerformanceTestHelper };

// Security Testing Helpers - Helmet.js validation and comprehensive vulnerability testing
export { createSecurityTestHelper };

// Cross-Platform Testing Helpers - Express/Flask compatibility validation and feature parity
export { createCrossPlatformTestHelper };

// PM2 Testing Helpers - Production deployment and process management testing
export { createPM2TestHelper };

// Utility Functions - Asynchronous conditions handling and test data management
export { waitFor, createTestDataSet };

// Test Lifecycle Management - Setup, teardown, and environment validation
export { setupTestHelpers, teardownTestHelpers, validateTestEnvironment };

// Mock Data Generation Utilities - HTTP requests, responses, and comprehensive test scenarios
export { 
  createMockHTTPRequest, 
  createMockHTTPResponse, 
  createMockControllerData, 
  createMockServiceData,
  createMockSecurityData,
  createMockPerformanceData,
  createMockCrossPlatformData,
  createMockPM2Data,
  createMockErrorScenarios,
  generateTestDataSeed,
  createMockTestFixtures,
  resetMockDataCache,
  validateMockData
};

// Setup and Configuration Utilities - Test environment preparation and management
export {
  setupExpressTestServer,
  setupTestDatabase,
  setupTestEnvironmentVariables,
  setupSecurityTestEnvironment,
  setupCrossPlatformTestEnvironment,
  setupPM2TestEnvironment,
  setupPerformanceTestEnvironment,
  setupMockDataEnvironment,
  setupTestLogger,
  setupTestTimeout,
  setupTestIsolation,
  validateSetupConfiguration
};

// Default export for comprehensive test helpers bundle initialization
export default {
  // Main initialization and cleanup functions
  initializeTestHelpers,
  cleanupTestHelpers,
  
  // Helper factory functions for creating specialized test utilities
  createHTTPTestHelper,
  createMockDataHelper,
  createAssertionHelper,
  createPerformanceTestHelper,
  createSecurityTestHelper,
  createCrossPlatformTestHelper,
  createPM2TestHelper,
  
  // Utility functions for test execution and data management
  waitFor,
  createTestDataSet,
  validateTestEnvironment,
  
  // Mock data generation factories for comprehensive testing scenarios
  createMockHTTPRequest,
  createMockHTTPResponse,
  createMockControllerData,
  createMockServiceData,
  createMockSecurityData,
  createMockPerformanceData,
  createMockCrossPlatformData,
  createMockPM2Data,
  createMockErrorScenarios,
  generateTestDataSeed,
  createMockTestFixtures,
  resetMockDataCache,
  validateMockData,
  
  // Setup and configuration utilities for test environment preparation
  setupExpressTestServer,
  setupTestDatabase,
  setupTestEnvironmentVariables,
  setupSecurityTestEnvironment,
  setupCrossPlatformTestEnvironment,
  setupPM2TestEnvironment,
  setupPerformanceTestEnvironment,
  setupMockDataEnvironment,
  setupTestLogger,
  setupTestTimeout,
  setupTestIsolation,
  validateSetupConfiguration,
  
  // Version and compatibility information
  version: '1.0.0',
  supportedFrameworks: ['jest', 'mocha'],
  nodeVersion: '>=18.18.0',
  educationalPurpose: 'Node.js tutorial comprehensive testing utilities demonstration'
};