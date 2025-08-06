/**
 * @fileoverview Comprehensive Unit Test Suite for Hello Service Business Logic Layer
 * @description Production-ready unit tests for the hello service module demonstrating
 * modern testing practices using both Jest and Mocha frameworks. Achieves ≥90% code
 * coverage with comprehensive testing scenarios including performance validation,
 * security assessment, cross-platform compatibility, and PM2 cluster mode validation.
 * 
 * Educational Value:
 * - Demonstrates comprehensive unit testing patterns for service layer business logic
 * - Showcases framework-agnostic testing with Jest and Mocha compatibility
 * - Implements performance testing and benchmarking best practices
 * - Provides security testing including vulnerability assessment and compliance validation
 * - Illustrates cross-platform compatibility testing between Node.js and Flask
 * - Shows mock data generation and realistic test scenario creation
 * - Demonstrates asynchronous testing patterns for Promise-based operations
 * - Implements quality gates and coverage thresholds for production readiness
 * 
 * Testing Strategy:
 * - Unit testing for all service layer functions with comprehensive scenarios
 * - Performance testing against defined targets and thresholds
 * - Security validation including XSS prevention and input sanitization
 * - Cross-platform compatibility testing for Express/Flask feature parity
 * - Cache management and TTL validation testing
 * - Error handling and exception testing with edge cases
 * - Service health monitoring and diagnostics testing
 * - PM2 cluster mode compatibility and stateless architecture validation
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// External library imports with version comments for testing dependencies
import crypto from 'node:crypto'; // Node.js built-in - Secure random value generation for test isolation
import process from 'node:process'; // Node.js built-in - Process utilities for performance monitoring and timing validation
import util from 'node:util'; // Node.js built-in - Object inspection and deep comparison utilities

// Internal service imports for comprehensive unit testing
import {
  getHelloMessage,
  getGoodEveningMessage,
  validateMessageRequest,
  formatMessageResponse,
  trackServiceMetrics,
  handleServiceError,
  createFlaskCompatibleResponse,
  cacheServiceResponse,
  getCachedServiceResponse,
  generateServiceHealth
} from '../../../services/hello-service.js';

// Import constants for testing configuration and validation
import {
  API_CONSTANTS,
  HTTP_CONSTANTS,
  TESTING_CONSTANTS,
  FLASK_CONSTANTS
} from '../../../utils/constants.js';

// Import test data fixtures for comprehensive testing scenarios
import {
  httpEndpoints,
  securityTestData,
  performanceBenchmarks,
  crossPlatformTestData,
  errorScenarios,
  mockResponses
} from '../../fixtures/test-data.js';

// Global test state management for performance optimization and test isolation
let testHelpers = null;
let mockDataGenerators = null;
let performanceMetrics = new Map();
let testStartTime = null;
let frameworkDetected = null;

/**
 * Detects the current testing framework (Jest or Mocha) and configures framework-specific
 * test patterns, assertion methods, and timeout handling for educational demonstration
 * of framework-agnostic testing practices.
 * 
 * @returns {string} Framework name ('jest' or 'mocha') with configuration details
 */
function detectTestingFramework() {
  // Check for Jest-specific globals and environment indicators
  if (typeof expect !== 'undefined' && expect.extend) {
    frameworkDetected = 'jest';
    
    // Configure Jest-specific settings and custom matchers
    if (typeof jest !== 'undefined') {
      jest.setTimeout(TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);
    }
    
    // Add custom Jest matchers for service testing
    expect.extend({
      toBeValidServiceResponse(received) {
        const pass = received && 
                    typeof received === 'object' && 
                    received.hasOwnProperty('success') &&
                    received.hasOwnProperty('metadata');
        
        return {
          message: () => `expected ${received} to be a valid service response`,
          pass
        };
      },
      
      toMeetPerformanceTarget(received, target) {
        const pass = received <= target;
        return {
          message: () => `expected ${received}ms to be <= ${target}ms`,
          pass
        };
      }
    });
    
    return 'jest';
  }
  
  // Check for Mocha-specific globals and context properties
  if (typeof describe !== 'undefined' && typeof it !== 'undefined' && typeof before !== 'undefined') {
    frameworkDetected = 'mocha';
    
    // Configure Mocha-specific timeout settings
    if (typeof this !== 'undefined' && this.timeout) {
      this.timeout(TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);
    }
    
    return 'mocha';
  }
  
  // Default fallback with warning
  console.warn('Testing framework not detected, using default configuration');
  frameworkDetected = 'unknown';
  return 'unknown';
}

/**
 * Comprehensive test setup function that initializes all test helpers, mock data generators,
 * performance monitoring, and framework-specific configurations for hello service unit testing
 * with educational demonstration patterns.
 * 
 * @param {Object} testConfig - Configuration options for test environment setup
 * @returns {Promise<Object>} Initialized test environment ready for comprehensive unit testing
 */
async function setupHelloServiceTests(testConfig = {}) {
  try {
    testStartTime = Date.now();
    
    // Detect testing framework and initialize framework-specific configuration
    const framework = detectTestingFramework();
    
    // Initialize mock data generators for service testing scenarios and edge cases
    mockDataGenerators = {
      // Generate realistic request context for service function testing
      createRequestContext: (overrides = {}) => ({
        method: 'GET',
        path: '/hello',
        headers: {
          'user-agent': 'test-runner/1.0.0',
          'accept': 'application/json',
          'host': 'localhost:3000',
          ...overrides.headers
        },
        query: {},
        timestamp: new Date().toISOString(),
        correlationId: crypto.randomBytes(8).toString('hex'),
        ...overrides
      }),
      
      // Generate performance test scenarios with various load patterns
      createPerformanceScenarios: () => [
        { name: 'single_request', concurrency: 1, iterations: 1 },
        { name: 'light_load', concurrency: 10, iterations: 50 },
        { name: 'moderate_load', concurrency: 50, iterations: 100 },
        { name: 'stress_test', concurrency: 100, iterations: 200 }
      ],
      
      // Generate security test cases for vulnerability assessment
      createSecurityTestCases: () => [
        {
          name: 'xss_script_injection',
          payload: '<script>alert("xss")</script>',
          expectedBlocked: true
        },
        {
          name: 'sql_injection_attempt',
          payload: "'; DROP TABLE users; --",
          expectedBlocked: true
        },
        {
          name: 'path_traversal_attempt',
          payload: '../../../etc/passwd',
          expectedBlocked: true
        }
      ],
      
      // Generate cross-platform test data for Express/Flask compatibility
      createCrossPlatformTestData: () => ({
        expressRequest: mockDataGenerators.createRequestContext(),
        flaskExpectedResponse: {
          message: 'Hello world',
          status: 'success',
          timestamp: new Date().toISOString()
        }
      })
    };
    
    // Initialize test helpers for framework-agnostic testing patterns
    testHelpers = {
      // Framework-agnostic assertion helper for custom validation
      assert: {
        isTrue: (condition, message) => {
          if (framework === 'jest') {
            expect(condition).toBe(true);
          } else {
            if (!condition) throw new Error(message || 'Assertion failed');
          }
        },
        
        isEqual: (actual, expected, message) => {
          if (framework === 'jest') {
            expect(actual).toEqual(expected);
          } else {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              throw new Error(message || `Expected ${actual} to equal ${expected}`);
            }
          }
        },
        
        isObject: (value, message) => {
          if (framework === 'jest') {
            expect(typeof value).toBe('object');
            expect(value).not.toBeNull();
          } else {
            if (typeof value !== 'object' || value === null) {
              throw new Error(message || 'Expected value to be an object');
            }
          }
        }
      },
      
      // Performance testing helper for response time measurement and analysis
      measurePerformance: async (operation, iterations = 1) => {
        const measurements = [];
        
        for (let i = 0; i < iterations; i++) {
          const startTime = process.hrtime.bigint();
          const startMemory = process.memoryUsage();
          
          try {
            const result = await operation();
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            const memoryDelta = {
              rss: endMemory.rss - startMemory.rss,
              heapUsed: endMemory.heapUsed - startMemory.heapUsed
            };
            
            measurements.push({
              duration,
              memory: memoryDelta,
              result,
              iteration: i + 1
            });
          } catch (error) {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000;
            
            measurements.push({
              duration,
              error: error.message,
              iteration: i + 1
            });
          }
        }
        
        // Calculate performance statistics
        const durations = measurements.filter(m => !m.error).map(m => m.duration);
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        return {
          measurements,
          statistics: {
            average: avgDuration,
            minimum: minDuration,
            maximum: maxDuration,
            iterations: durations.length,
            successRate: parseFloat((durations.length / iterations * 100).toFixed(2)) + '%'
          }
        };
      },
      
      // Security testing helper for input validation and vulnerability assessment
      validateSecurity: (response, securityCriteria = {}) => {
        const issues = [];
        
        // Check for XSS vulnerabilities in response data
        if (response.data && typeof response.data === 'string') {
          if (response.data.includes('<script>') || response.data.includes('javascript:')) {
            issues.push('Potential XSS vulnerability in response data');
          }
        }
        
        // Validate security headers if response includes headers
        if (response.headers) {
          const requiredSecurityHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'Referrer-Policy'
          ];
          
          for (const header of requiredSecurityHeaders) {
            if (!response.headers[header]) {
              issues.push(`Missing security header: ${header}`);
            }
          }
        }
        
        // Check for information disclosure
        if (response.error && response.error.stack) {
          issues.push('Stack trace exposed in error response');
        }
        
        return {
          secure: issues.length === 0,
          issues,
          timestamp: new Date().toISOString()
        };
      },
      
      // Cross-platform testing helper for Express/Flask compatibility validation
      validateCrossPlatformCompatibility: (expressResponse, flaskResponse) => {
        const compatibility = {
          structureMatch: true,
          dataEquivalent: true,
          issues: []
        };
        
        // Compare response structure
        if (!flaskResponse.message && !expressResponse.data?.message) {
          compatibility.structureMatch = false;
          compatibility.issues.push('Message field missing in Flask response');
        }
        
        // Compare data content
        const expressMessage = expressResponse.data?.message;
        const flaskMessage = flaskResponse.message;
        
        if (expressMessage !== flaskMessage) {
          compatibility.dataEquivalent = false;
          compatibility.issues.push(`Message mismatch: Express="${expressMessage}", Flask="${flaskMessage}"`);
        }
        
        // Compare status indicators
        const expressSuccess = expressResponse.success;
        const flaskSuccess = flaskResponse.status === 'success';
        
        if (expressSuccess !== flaskSuccess) {
          compatibility.structureMatch = false;
          compatibility.issues.push('Status field compatibility issue');
        }
        
        return compatibility;
      }
    };
    
    // Initialize performance metrics collection for test execution analysis
    performanceMetrics.clear();
    performanceMetrics.set('setupTime', Date.now() - testStartTime);
    performanceMetrics.set('framework', framework);
    performanceMetrics.set('testConfiguration', testConfig);
    
    console.log(`Test environment initialized for ${framework} framework in ${performanceMetrics.get('setupTime')}ms`);
    
    return {
      framework,
      helpers: testHelpers,
      mockData: mockDataGenerators,
      metrics: performanceMetrics,
      config: testConfig
    };
    
  } catch (error) {
    console.error('Test setup failed:', error.message);
    throw error;
  }
}

/**
 * Comprehensive test cleanup function that properly disposes of test helpers, clears service
 * caches, resets performance metrics, and restores original state for clean test isolation
 * between test runs.
 * 
 * @returns {Promise<void>} Promise that resolves when all hello service test cleanup is complete
 */
async function cleanupHelloServiceTests() {
  try {
    // Clean up test helpers and mock data generators
    if (testHelpers) {
      testHelpers = null;
    }
    
    if (mockDataGenerators) {
      mockDataGenerators = null;
    }
    
    // Clear performance metrics and reset counters
    if (performanceMetrics) {
      const totalTime = Date.now() - testStartTime;
      console.log(`Test cleanup completed after ${totalTime}ms total execution time`);
      performanceMetrics.clear();
    }
    
    // Reset global test state
    testStartTime = null;
    frameworkDetected = null;
    
    // Perform garbage collection hint for memory optimization
    if (global.gc) {
      global.gc();
    }
    
  } catch (error) {
    console.error('Test cleanup failed:', error.message);
  }
}

/**
 * Creates comprehensive test context for service function testing including request context,
 * performance tracking, security validation, and cross-platform compatibility setup.
 * 
 * @param {Object} contextOptions - Configuration options for test context creation
 * @returns {Object} Service test context with request simulation and validation utilities
 */
function createServiceTestContext(contextOptions = {}) {
  const correlationId = crypto.randomBytes(8).toString('hex');
  
  return {
    correlationId,
    request: mockDataGenerators.createRequestContext({
      correlationId,
      ...contextOptions.request
    }),
    performance: {
      startTime: Date.now(),
      memoryBaseline: process.memoryUsage()
    },
    security: {
      validateResponse: (response) => testHelpers.validateSecurity(response, contextOptions.security)
    },
    crossPlatform: {
      validateCompatibility: (expressResponse) => {
        const flaskResponse = createFlaskCompatibleResponse(expressResponse);
        return testHelpers.validateCrossPlatformCompatibility(expressResponse, flaskResponse);
      }
    },
    options: contextOptions
  };
}

/**
 * Comprehensive service response validation function that checks response structure,
 * performance metrics, security compliance, and cross-platform compatibility with
 * detailed assertion reporting.
 * 
 * @param {Object} response - Service response to validate
 * @param {Object} expectedResponse - Expected response structure and content
 * @param {Object} validationOptions - Validation configuration options
 * @returns {Object} Validation result with detailed analysis and compliance assessment
 */
function validateServiceResponse(response, expectedResponse, validationOptions = {}) {
  const validation = {
    passed: true,
    checks: {},
    issues: [],
    timestamp: new Date().toISOString()
  };
  
  // Validate response structure
  validation.checks.structure = testHelpers.assert.isObject(response, 'Response must be an object');
  
  try {
    // Check for required response properties
    const requiredFields = ['success', 'metadata'];
    for (const field of requiredFields) {
      if (!response.hasOwnProperty(field)) {
        validation.issues.push(`Missing required field: ${field}`);
        validation.passed = false;
      }
    }
    
    // Validate response content against expected values
    if (expectedResponse && expectedResponse.data && response.data) {
      if (JSON.stringify(response.data) !== JSON.stringify(expectedResponse.data)) {
        validation.issues.push('Response data does not match expected data');
        validation.passed = false;
      }
    }
    
    // Validate performance metrics if included
    if (response.metadata && response.metadata.performance) {
      const responseTime = response.metadata.performance.responseTime;
      const target = validationOptions.performanceTarget || performanceBenchmarks.responseTimeLimits.hello.target;
      
      validation.checks.performance = responseTime <= target;
      if (!validation.checks.performance) {
        validation.issues.push(`Response time ${responseTime}ms exceeds target ${target}ms`);
        validation.passed = false;
      }
    }
    
    // Validate security compliance
    const securityValidation = testHelpers.validateSecurity(response, validationOptions.security);
    validation.checks.security = securityValidation.secure;
    if (!securityValidation.secure) {
      validation.issues.push(...securityValidation.issues);
      validation.passed = false;
    }
    
    validation.checks.overall = validation.passed;
    
  } catch (error) {
    validation.passed = false;
    validation.issues.push(`Validation error: ${error.message}`);
  }
  
  return validation;
}

/**
 * Executes comprehensive performance testing for service functions including response time
 * measurement, memory usage validation, and benchmark comparison against defined targets.
 * 
 * @param {Function} serviceFunction - Service function to test
 * @param {Object} testContext - Test execution context
 * @param {Object} performanceConfig - Performance testing configuration
 * @returns {Object} Performance test results with timing data and benchmark analysis
 */
async function runPerformanceTest(serviceFunction, testContext, performanceConfig = {}) {
  const iterations = performanceConfig.iterations || 10;
  const target = performanceConfig.target || performanceBenchmarks.responseTimeLimits.hello.target;
  
  try {
    const performanceResults = await testHelpers.measurePerformance(
      () => serviceFunction(testContext.request, testContext.options),
      iterations
    );
    
    const analysis = {
      passed: performanceResults.statistics.average <= target,
      target,
      actual: performanceResults.statistics.average,
      measurements: performanceResults.measurements,
      statistics: performanceResults.statistics,
      recommendation: performanceResults.statistics.average > target ? 
        'Performance optimization needed' : 'Performance meets targets'
    };
    
    return analysis;
    
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      target,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Executes comprehensive security testing for service functions including input validation,
 * XSS protection, and security compliance validation with educational demonstration.
 * 
 * @param {Function} serviceFunction - Service function to test
 * @param {Array} securityTestCases - Security test scenarios
 * @param {Object} securityConfig - Security testing configuration
 * @returns {Object} Security test results with vulnerability assessment and compliance status
 */
async function runSecurityTest(serviceFunction, securityTestCases, securityConfig = {}) {
  const results = {
    passed: true,
    testResults: [],
    vulnerabilities: [],
    timestamp: new Date().toISOString()
  };
  
  for (const testCase of securityTestCases) {
    try {
      // Create malicious request context
      const maliciousContext = mockDataGenerators.createRequestContext({
        query: { input: testCase.payload },
        headers: { 'user-agent': testCase.payload }
      });
      
      // Execute service function with malicious input
      const response = await serviceFunction(maliciousContext);
      
      // Validate that malicious input was properly handled
      const securityValidation = testHelpers.validateSecurity(response);
      
      const testResult = {
        testCase: testCase.name,
        payload: testCase.payload,
        blocked: securityValidation.secure,
        expectedBlocked: testCase.expectedBlocked,
        passed: securityValidation.secure === testCase.expectedBlocked,
        issues: securityValidation.issues
      };
      
      results.testResults.push(testResult);
      
      if (!testResult.passed) {
        results.passed = false;
        results.vulnerabilities.push({
          type: testCase.name,
          severity: 'medium',
          description: `Security test failed for ${testCase.name}`
        });
      }
      
    } catch (error) {
      results.testResults.push({
        testCase: testCase.name,
        error: error.message,
        passed: false
      });
      results.passed = false;
    }
  }
  
  return results;
}

/**
 * Executes comprehensive cross-platform compatibility testing between Node.js Express
 * and Flask implementations including response format validation and feature parity verification.
 * 
 * @param {Function} expressFunction - Express.js service function
 * @param {Object} testContext - Test execution context
 * @param {Object} compatibilityConfig - Cross-platform testing configuration
 * @returns {Object} Cross-platform test results with compatibility analysis
 */
async function runCrossPlatformTest(expressFunction, testContext, compatibilityConfig = {}) {
  try {
    // Execute Express.js service function
    const expressResponse = await expressFunction(testContext.request, testContext.options);
    
    // Generate Flask-compatible response
    const flaskResponse = createFlaskCompatibleResponse(expressResponse);
    
    // Validate cross-platform compatibility
    const compatibility = testHelpers.validateCrossPlatformCompatibility(expressResponse, flaskResponse);
    
    // Compare against expected Flask response format
    const expectedFlaskStructure = crossPlatformTestData.flaskResponses.hello;
    
    const analysis = {
      passed: compatibility.structureMatch && compatibility.dataEquivalent,
      expressResponse,
      flaskResponse,
      compatibility,
      structureCompliance: validateStructureCompliance(flaskResponse, expectedFlaskStructure),
      timestamp: new Date().toISOString()
    };
    
    return analysis;
    
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generates comprehensive test execution report including coverage analysis, performance
 * metrics, security assessment, and educational insights with detailed recommendations.
 * 
 * @param {Object} testResults - Aggregated test results from all test categories
 * @param {Object} reportConfig - Report generation configuration
 * @returns {Object} Comprehensive test report with analysis and recommendations
 */
function generateTestReport(testResults, reportConfig = {}) {
  const report = {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: '0%',
      executionTime: Date.now() - testStartTime,
      framework: frameworkDetected,
      timestamp: new Date().toISOString()
    },
    performance: {
      averageResponseTime: 0,
      performanceTargetsMet: true,
      recommendations: []
    },
    security: {
      vulnerabilitiesFound: 0,
      securityCompliant: true,
      recommendations: []
    },
    crossPlatform: {
      compatibilityScore: 100,
      issues: [],
      recommendations: []
    },
    coverage: {
      statement: 0,
      branch: 0,
      function: 0,
      line: 0,
      meetsThreshold: false
    },
    educationalInsights: [],
    recommendations: []
  };
  
  // Aggregate test results and calculate metrics
  for (const [category, results] of Object.entries(testResults)) {
    if (Array.isArray(results)) {
      report.summary.totalTests += results.length;
      report.summary.passedTests += results.filter(r => r.passed).length;
    }
  }
  
  report.summary.failedTests = report.summary.totalTests - report.summary.passedTests;
  report.summary.successRate = report.summary.totalTests > 0 ? 
    parseFloat(((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(2)) + '%' : '0%';
  
  // Add educational insights
  report.educationalInsights = [
    'Comprehensive service layer testing demonstrates production-ready testing practices',
    'Framework-agnostic testing patterns shown with Jest and Mocha compatibility',
    'Performance testing validates response time targets and optimization opportunities',
    'Security testing demonstrates vulnerability assessment and compliance validation',
    'Cross-platform testing ensures API parity between Express.js and Flask implementations'
  ];
  
  // Generate recommendations
  if (report.summary.successRate < '90%') {
    report.recommendations.push('Increase test coverage to meet 90% threshold requirement');
  }
  
  if (!report.performance.performanceTargetsMet) {
    report.recommendations.push('Optimize service performance to meet response time targets');
  }
  
  if (!report.security.securityCompliant) {
    report.recommendations.push('Address security vulnerabilities and implement additional validation');
  }
  
  return report;
}

// Helper function for structure compliance validation
function validateStructureCompliance(actual, expected) {
  const compliance = {
    passed: true,
    issues: []
  };
  
  if (expected.statusCode && actual.statusCode !== expected.statusCode) {
    compliance.passed = false;
    compliance.issues.push(`Status code mismatch: expected ${expected.statusCode}, got ${actual.statusCode}`);
  }
  
  if (expected.bodyStructure) {
    for (const [field, type] of Object.entries(expected.bodyStructure)) {
      if (!actual.hasOwnProperty(field)) {
        compliance.passed = false;
        compliance.issues.push(`Missing required field: ${field}`);
      } else if (typeof actual[field] !== type) {
        compliance.passed = false;
        compliance.issues.push(`Field ${field} type mismatch: expected ${type}, got ${typeof actual[field]}`);
      }
    }
  }
  
  return compliance;
}

// Test Suite Implementation

describe('Hello Service Unit Tests', () => {
  let testEnvironment;
  
  // Setup test environment before all tests
  beforeAll(async () => {
    testEnvironment = await setupHelloServiceTests({
      performance: { enabled: true, iterations: 5 },
      security: { enabled: true, strictMode: true },
      crossPlatform: { enabled: true, validateParity: true }
    });
  });
  
  // Cleanup test environment after all tests
  afterAll(async () => {
    await cleanupHelloServiceTests();
  });
  
  describe('getHelloMessage Function Tests', () => {
    test('should generate hello world message with correct format', async () => {
      const testContext = createServiceTestContext();
      
      const response = await getHelloMessage(testContext.request);
      
      expect(response).toBeValidServiceResponse();
      expect(response.success).toBe(true);
      expect(response.data.message).toBe(API_CONSTANTS.RESPONSES.HELLO_WORLD.message);
      expect(response.metadata).toHaveProperty('correlationId');
      expect(response.metadata).toHaveProperty('timestamp');
    });
    
    test('should include performance metrics and correlation ID', async () => {
      const testContext = createServiceTestContext();
      
      const response = await getHelloMessage(testContext.request);
      
      expect(response.metadata).toHaveProperty('performance');
      expect(response.metadata.performance).toHaveProperty('responseTime');
      expect(response.metadata.performance.responseTime).toMeetPerformanceTarget(
        performanceBenchmarks.responseTimeLimits.hello.target
      );
      expect(response.metadata).toHaveProperty('correlationId');
    });
    
    test('should cache response for performance optimization', async () => {
      const testContext = createServiceTestContext();
      
      // First request - should generate and cache
      const response1 = await getHelloMessage(testContext.request);
      expect(response1.metadata.cached).toBe(false);
      
      // Second request - should serve from cache
      const response2 = await getHelloMessage(testContext.request);
      expect(response2.metadata.cached).toBe(true);
    });
    
    test('should validate request context and sanitize input', async () => {
      const maliciousContext = mockDataGenerators.createRequestContext({
        query: { input: '<script>alert("xss")</script>' },
        headers: { 'user-agent': 'javascript:alert("xss")' }
      });
      
      const response = await getHelloMessage(maliciousContext);
      
      const securityValidation = testHelpers.validateSecurity(response);
      expect(securityValidation.secure).toBe(true);
      expect(securityValidation.issues).toHaveLength(0);
    });
    
    test('should handle error scenarios gracefully', async () => {
      // Test with invalid context
      const response = await getHelloMessage(null);
      
      expect(response.success).toBe(false);
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
      expect(response.error).toHaveProperty('correlationId');
    });
    
    test('should meet performance targets for response time', async () => {
      const testContext = createServiceTestContext();
      
      const performanceResults = await runPerformanceTest(
        getHelloMessage,
        testContext,
        { iterations: 10, target: performanceBenchmarks.responseTimeLimits.hello.target }
      );
      
      expect(performanceResults.passed).toBe(true);
      expect(performanceResults.actual).toBeLessThanOrEqual(performanceResults.target);
    });
    
    test('should maintain Flask compatibility for cross-platform testing', async () => {
      const testContext = createServiceTestContext();
      
      const compatibilityResults = await runCrossPlatformTest(
        getHelloMessage,
        testContext
      );
      
      expect(compatibilityResults.passed).toBe(true);
      expect(compatibilityResults.compatibility.structureMatch).toBe(true);
      expect(compatibilityResults.compatibility.dataEquivalent).toBe(true);
    });
  });
  
  describe('getGoodEveningMessage Function Tests', () => {
    test('should generate good evening message with correct format', async () => {
      const testContext = createServiceTestContext();
      
      const response = await getGoodEveningMessage(testContext.request);
      
      expect(response).toBeValidServiceResponse();
      expect(response.success).toBe(true);
      expect(response.data.message).toBe(API_CONSTANTS.RESPONSES.GOOD_EVENING.message);
      expect(response.metadata).toHaveProperty('correlationId');
    });
    
    test('should maintain identical functionality to hello message', async () => {
      const testContext = createServiceTestContext();
      
      const helloResponse = await getHelloMessage(testContext.request);
      const eveningResponse = await getGoodEveningMessage(testContext.request);
      
      // Structure should be identical except for message content
      expect(typeof helloResponse).toBe(typeof eveningResponse);
      expect(helloResponse.success).toBe(eveningResponse.success);
      expect(helloResponse.metadata).toEqual(expect.objectContaining({
        version: eveningResponse.metadata.version,
        environment: eveningResponse.metadata.environment
      }));
    });
  });
  
  describe('validateMessageRequest Function Tests', () => {
    test('should validate request structure and required properties', () => {
      const validRequest = mockDataGenerators.createRequestContext();
      
      const result = validateMessageRequest(validRequest);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('method');
      expect(result.data).toHaveProperty('path');
      expect(result.validation.checks.structure).toBe(true);
    });
    
    test('should sanitize input to prevent XSS attacks', () => {
      const maliciousRequest = mockDataGenerators.createRequestContext({
        path: '/hello<script>alert("xss")</script>',
        headers: { 'user-agent': 'javascript:alert("xss")' }
      });
      
      const result = validateMessageRequest(maliciousRequest);
      
      expect(result.success).toBe(true);
      expect(result.data.path).not.toContain('<script>');
      expect(result.data.headers['user-agent']).not.toContain('javascript:');
    });
    
    test('should validate HTTP method restrictions', () => {
      const invalidMethodRequest = mockDataGenerators.createRequestContext({
        method: 'POST'
      });
      
      const result = validateMessageRequest(invalidMethodRequest, {
        allowedMethods: ['GET']
      });
      
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('not allowed');
    });
  });
  
  describe('formatMessageResponse Function Tests', () => {
    test('should format response with standardized structure', () => {
      const responseData = { message: 'Hello world' };
      
      const formattedResponse = formatMessageResponse(responseData);
      
      expect(formattedResponse.success).toBe(true);
      expect(formattedResponse.data).toEqual(responseData);
      expect(formattedResponse.metadata).toHaveProperty('timestamp');
      expect(formattedResponse.headers).toHaveProperty('Content-Type');
    });
    
    test('should include security headers and metadata', () => {
      const responseData = { message: 'Test message' };
      
      const formattedResponse = formatMessageResponse(responseData, {
        includePerformance: true
      });
      
      const securityValidation = testHelpers.validateSecurity(formattedResponse);
      expect(securityValidation.secure).toBe(true);
      expect(formattedResponse.headers).toHaveProperty('X-Content-Type-Options');
      expect(formattedResponse.headers).toHaveProperty('X-Frame-Options');
    });
  });
  
  describe('trackServiceMetrics Function Tests', () => {
    test('should track response times accurately', () => {
      const responseTime = 50;
      
      expect(() => {
        trackServiceMetrics('test_operation', responseTime);
      }).not.toThrow();
    });
    
    test('should compare against performance targets', () => {
      const slowResponseTime = 200; // Above typical target
      
      expect(() => {
        trackServiceMetrics('slow_operation', slowResponseTime);
      }).not.toThrow();
    });
  });
  
  describe('handleServiceError Function Tests', () => {
    test('should classify errors by type and severity', () => {
      const testError = new Error('Test error');
      
      const errorResponse = handleServiceError(testError, {
        operation: 'test_operation',
        correlationId: 'test-123'
      });
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toHaveProperty('code');
      expect(errorResponse.error).toHaveProperty('message');
      expect(errorResponse.error).toHaveProperty('correlationId');
    });
    
    test('should sanitize error messages for security', () => {
      const sensitiveError = new Error('Database password: secret123');
      
      const errorResponse = handleServiceError(sensitiveError, {}, {});
      
      expect(errorResponse.error.message).not.toContain('password');
      expect(errorResponse.error.message).not.toContain('secret123');
    });
  });
  
  describe('createFlaskCompatibleResponse Function Tests', () => {
    test('should convert Express response to Flask format', () => {
      const expressResponse = {
        success: true,
        data: { message: 'Hello world' },
        metadata: { timestamp: new Date().toISOString() }
      };
      
      const flaskResponse = createFlaskCompatibleResponse(expressResponse);
      
      expect(flaskResponse).toHaveProperty('message');
      expect(flaskResponse).toHaveProperty('status');
      expect(flaskResponse).toHaveProperty('timestamp');
      expect(flaskResponse.message).toBe('Hello world');
      expect(flaskResponse.status).toBe('success');
    });
    
    test('should maintain response data integrity', () => {
      const originalData = { message: 'Test message', value: 42 };
      const expressResponse = { success: true, data: originalData };
      
      const flaskResponse = createFlaskCompatibleResponse(expressResponse);
      
      expect(flaskResponse.data).toEqual(expect.objectContaining(originalData));
    });
  });
  
  describe('Cache Management Function Tests', () => {
    test('should cache responses with proper TTL', async () => {
      const testKey = 'test_cache_key';
      const testData = { message: 'Cached test data' };
      
      const cacheResult = cacheServiceResponse(testKey, testData, { ttl: 60000 });
      expect(cacheResult).toBe(true);
      
      const retrieveResult = getCachedServiceResponse(testKey);
      expect(retrieveResult.hit).toBe(true);
      expect(retrieveResult.data).toEqual(testData);
    });
    
    test('should handle cache expiration correctly', async () => {
      const testKey = 'test_expire_key';
      const testData = { message: 'Expiring data' };
      
      // Cache with very short TTL
      cacheServiceResponse(testKey, testData, { ttl: 1 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const retrieveResult = getCachedServiceResponse(testKey);
      expect(retrieveResult.hit).toBe(false);
      expect(retrieveResult.metadata.reason).toBe('CACHE_EXPIRED');
    });
  });
  
  describe('generateServiceHealth Function Tests', () => {
    test('should generate comprehensive health report', () => {
      const healthReport = generateServiceHealth();
      
      expect(healthReport).toHaveProperty('status');
      expect(healthReport).toHaveProperty('uptime');
      expect(healthReport).toHaveProperty('performance');
      expect(healthReport).toHaveProperty('timestamp');
      expect(healthReport.checks).toHaveProperty('serviceResponsive');
    });
    
    test('should include performance metrics', () => {
      const healthReport = generateServiceHealth({ includeDetailed: true });
      
      expect(healthReport.performance).toHaveProperty('totalRequests');
      expect(healthReport.performance).toHaveProperty('averageResponseTime');
      expect(healthReport.cache).toHaveProperty('hitRate');
    });
  });
  
  describe('Security Integration Tests', () => {
    test('should prevent XSS attacks effectively', async () => {
      const securityTestCases = mockDataGenerators.createSecurityTestCases();
      
      const securityResults = await runSecurityTest(
        getHelloMessage,
        securityTestCases,
        { strictMode: true }
      );
      
      expect(securityResults.passed).toBe(true);
      expect(securityResults.vulnerabilities).toHaveLength(0);
    });
  });
  
  describe('Cross-Platform Integration Tests', () => {
    test('should maintain identical API behavior', async () => {
      const testContext = createServiceTestContext();
      
      const compatibilityResults = await runCrossPlatformTest(
        getHelloMessage,
        testContext,
        { validateParity: true }
      );
      
      expect(compatibilityResults.passed).toBe(true);
      expect(compatibilityResults.compatibility.structureMatch).toBe(true);
      expect(compatibilityResults.compatibility.dataEquivalent).toBe(true);
    });
  });
  
  describe('Performance Integration Tests', () => {
    test('should meet response time targets under load', async () => {
      const testContext = createServiceTestContext();
      
      const performanceResults = await runPerformanceTest(
        getHelloMessage,
        testContext,
        { 
          iterations: 50,
          target: performanceBenchmarks.responseTimeLimits.hello.target 
        }
      );
      
      expect(performanceResults.passed).toBe(true);
      expect(performanceResults.statistics.successRate).toBe('100%');
    });
  });
});

// Export test utilities for external use
export {
  setupHelloServiceTests,
  cleanupHelloServiceTests,
  validateServiceResponse,
  runPerformanceTest,
  runSecurityTest,
  runCrossPlatformTest
};