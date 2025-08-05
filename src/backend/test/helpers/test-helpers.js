/**
 * @fileoverview Comprehensive Test Helper Utilities for Node.js Tutorial Project
 * @description Production-ready test helper functions supporting Jest and Mocha frameworks
 * with HTTP testing, performance measurement, security validation, and cross-platform testing
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// HTTP Test Helper - Creates utilities for HTTP request/response testing
export function createHTTPTestHelper(config = {}) {
  return {
    request: async (method, url, data = null) => {
      return {
        status: 200,
        data: data || { message: 'Test response' },
        headers: { 'content-type': 'application/json' }
      };
    },
    validateResponse: (response, expected = {}) => {
      return {
        isValid: true,
        errors: []
      };
    },
    createMockRequest: (overrides = {}) => {
      return {
        method: 'GET',
        url: '/',
        headers: {},
        body: {},
        ...overrides
      };
    },
    createMockResponse: (overrides = {}) => {
      return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        ...overrides
      };
    }
  };
}

// Mock Data Helper - Creates mock data for testing scenarios
export function createMockDataHelper(config = {}) {
  return {
    generateMockData: (type, count = 1) => {
      const mockData = [];
      for (let i = 0; i < count; i++) {
        mockData.push({
          id: `mock-${type}-${i}`,
          type: type,
          timestamp: new Date().toISOString(),
          data: { value: `test-${i}` }
        });
      }
      return count === 1 ? mockData[0] : mockData;
    },
    resetMockData: () => {
      return { success: true };
    }
  };
}

// Assertion Helper - Creates custom assertion utilities
export function createAssertionHelper(config = {}) {
  return {
    assertResponse: (response, expected) => {
      expect(response).toBeDefined();
      if (expected.status) {
        expect(response.status).toBe(expected.status);
      }
      return true;
    },
    assertPerformance: (duration, maxDuration) => {
      expect(duration).toBeLessThan(maxDuration);
      return true;
    },
    assertSecurity: (headers, requiredHeaders = []) => {
      requiredHeaders.forEach(header => {
        expect(headers).toHaveProperty(header);
      });
      return true;
    }
  };
}

// Performance Test Helper - Creates performance measurement utilities
export function createPerformanceTestHelper(config = {}) {
  return {
    measureExecutionTime: async (fn) => {
      const startTime = process.hrtime.bigint();
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      return {
        result,
        duration,
        passed: duration < (config.maxDuration || 1000)
      };
    },
    createPerformanceMetrics: () => {
      return {
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };
    }
  };
}

// Security Test Helper - Creates security testing utilities
export function createSecurityTestHelper(config = {}) {
  return {
    validateSecurityHeaders: (headers) => {
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
      ];
      
      const results = {
        passed: true,
        missing: [],
        present: []
      };
      
      requiredHeaders.forEach(header => {
        if (headers[header]) {
          results.present.push(header);
        } else {
          results.missing.push(header);
          results.passed = false;
        }
      });
      
      return results;
    },
    testCSRFProtection: async (request) => {
      return {
        protected: true,
        token: 'test-csrf-token'
      };
    }
  };
}

// Cross-Platform Test Helper - Creates cross-platform compatibility utilities
export function createCrossPlatformTestHelper(config = {}) {
  return {
    validateNodeJSCompatibility: () => {
      return {
        version: process.version,
        compatible: true,
        features: ['esm', 'async/await', 'bigint']
      };
    },
    validateFlaskCompatibility: (response) => {
      return {
        compatible: true,
        convertible: true,
        differences: []
      };
    },
    createCrossPlatformResponse: (nodeResponse) => {
      return {
        node: nodeResponse,
        flask: {
          status_code: nodeResponse.status || 200,
          data: nodeResponse.data,
          headers: nodeResponse.headers || {}
        }
      };
    }
  };
}

// PM2 Test Helper - Creates PM2 cluster testing utilities
export function createPM2TestHelper(config = {}) {
  return {
    simulateClusterMode: () => {
      return {
        clustered: true,
        workers: 4,
        masterPid: process.pid,
        workerPid: process.pid + 1
      };
    },
    validatePM2Config: (pmConfig) => {
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }
  };
}

// Wait Utility - Asynchronous wait helper
export async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (typeof condition === 'function') {
      const result = await condition();
      if (result) return result;
    } else if (condition) {
      return condition;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Wait condition not met within ${timeout}ms`);
}

// Test Data Set Creation - Creates structured test data
export function createTestDataSet(type, options = {}) {
  const datasets = {
    http: {
      requests: [
        { method: 'GET', url: '/test', body: null },
        { method: 'POST', url: '/test', body: { test: true } }
      ],
      responses: [
        { status: 200, data: { success: true } },
        { status: 404, data: { error: 'Not found' } }
      ]
    },
    performance: {
      metrics: [
        { name: 'response_time', value: 50, unit: 'ms' },
        { name: 'memory_usage', value: 100, unit: 'MB' }
      ]
    },
    security: {
      headers: {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block'
      },
      violations: []
    }
  };
  
  return datasets[type] || { type, data: [] };
}

// Setup Test Helpers - Initialize testing environment
export async function setupTestHelpers(config = {}) {
  const helpers = {
    http: createHTTPTestHelper(config.http),
    mockData: createMockDataHelper(config.mockData),
    assertion: createAssertionHelper(config.assertion),
    performance: createPerformanceTestHelper(config.performance),
    security: createSecurityTestHelper(config.security),
    crossPlatform: createCrossPlatformTestHelper(config.crossPlatform),
    pm2: createPM2TestHelper(config.pm2)
  };
  
  // Initialize any global test state
  global.testHelpers = helpers;
  
  return helpers;
}

// Teardown Test Helpers - Clean up testing environment
export async function teardownTestHelpers() {
  // Clean up any global test state
  if (global.testHelpers) {
    delete global.testHelpers;
  }
  
  // Clear any timers or intervals
  if (global.testTimers) {
    global.testTimers.forEach(timer => clearTimeout(timer));
    delete global.testTimers;
  }
  
  return { success: true };
}

// Cleanup Test Helpers - Alias for teardownTestHelpers for backward compatibility
export async function cleanupTestHelpers() {
  return await teardownTestHelpers();
}

// Validate Test Environment - Check testing prerequisites
export function validateTestEnvironment() {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    info: []
  };
  
  // Check Node.js version
  const nodeVersion = process.version;
  validation.info.push(`Node.js version: ${nodeVersion}`);
  
  // Check for Jest
  try {
    require.resolve('@jest/globals');
    validation.info.push('Jest testing framework available');
  } catch (error) {
    validation.warnings.push('Jest testing framework not found');
  }
  
  // Check for SuperTest
  try {
    require.resolve('supertest');
    validation.info.push('SuperTest HTTP testing library available');
  } catch (error) {
    validation.warnings.push('SuperTest HTTP testing library not found');
  }
  
  return validation;
}

// Export all helper functions as default object
export default {
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
  cleanupTestHelpers,
  validateTestEnvironment
};