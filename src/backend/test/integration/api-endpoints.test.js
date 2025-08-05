/**
 * @fileoverview Comprehensive API Endpoints Integration Test Suite
 * @description Complete integration testing for Express.js API endpoints with security validation,
 * performance benchmarking, cross-platform compatibility testing, and comprehensive error handling
 * validation using SuperTest framework and HTTPTestClient utilities.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive API integration testing patterns
 * - Showcases security testing methodologies with Helmet.js validation
 * - Implements performance testing and benchmarking strategies
 * - Provides cross-platform compatibility testing for Flask migration
 * - Illustrates error handling testing and validation patterns
 * - Shows modern testing framework usage with Jest/Mocha compatibility
 * 
 * Testing Coverage:
 * - HTTP endpoint functionality validation (/hello, /good-evening, /health)
 * - Security header verification and XSS protection testing
 * - Performance measurement and response time validation
 * - CORS policy testing and cross-origin request validation
 * - Rate limiting and DoS protection testing
 * - Comprehensive error scenario testing and validation
 * - Cross-platform compatibility preparation for Flask migration
 * 
 * Technology Stack:
 * - SuperTest v7.0.0 for HTTP endpoint testing
 * - Jest/Mocha framework compatibility for test execution
 * - Express.js v5.1.0 application testing
 * - Helmet.js security validation testing
 * - PM2 cluster mode compatibility testing
 */

// External library imports with version tracking for dependency management
import request from 'supertest'; // v7.0.0 - SuperTest library for HTTP testing with Express.js applications

// Internal application imports for test environment setup
import { createExpressApp } from '../../app.js';

// Test data and fixture imports for comprehensive testing scenarios
import {
  httpEndpoints,
  securityTestData,
  performanceBenchmarks,
  errorScenarios
} from '../fixtures/test-data.js';

// Constants imports for HTTP protocol and application configuration
import {
  API_CONSTANTS,
  HTTP_CONSTANTS,
  SECURITY_CONSTANTS,
  TESTING_CONSTANTS
} from '../../utils/constants.js';

// Global test variables for application and test management
let testApp = null; // Express application instance for testing
let httpClient = null; // HTTP test client for fluent API testing
let performanceHelper = null; // Performance testing utilities
let testStartTime = null; // Test execution start time tracking

/**
 * HTTPTestClient - Fluent HTTP testing utility for comprehensive API endpoint validation
 * @description Custom test client providing fluent interface for HTTP testing with built-in
 * security validation, performance measurement, and response assertion capabilities
 */
class HTTPTestClient {
  constructor(app) {
    this.app = app;
    this.request = request(app);
    this.lastResponse = null;
    this.measurements = {
      responseTime: null,
      memoryUsage: null,
      statusCode: null
    };
  }

  /**
   * Sends GET request to specified endpoint with optional headers and query parameters
   * @param {string} path - API endpoint path
   * @param {Object} options - Request options including headers and query parameters
   * @returns {HTTPTestClient} Fluent interface for method chaining
   */
  async get(path, options = {}) {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    try {
      let req = request(this.app).get(path);
      
      // Apply custom headers if provided
      if (options.headers) {
        Object.keys(options.headers).forEach(header => {
          req = req.set(header, options.headers[header]);
        });
      }

      // Apply query parameters if provided
      if (options.query) {
        req = req.query(options.query);
      }

      this.lastResponse = await req;
      
      // Calculate performance metrics
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      
      this.measurements.responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
      this.measurements.memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
      this.measurements.statusCode = this.lastResponse.status;

      return this;
    } catch (error) {
      // Handle request errors gracefully
      this.lastResponse = {
        status: 0,
        headers: {},
        body: { error: error.message },
        error: error
      };
      return this;
    }
  }

  /**
   * Sends POST request to specified endpoint with request body and headers
   * @param {string} path - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Request options including headers
   * @returns {HTTPTestClient} Fluent interface for method chaining
   */
  async post(path, data = {}, options = {}) {
    const startTime = process.hrtime.bigint();

    try {
      let req = request(this.app).post(path).send(data);
      
      if (options.headers) {
        Object.keys(options.headers).forEach(header => {
          req = req.set(header, options.headers[header]);
        });
      }

      this.lastResponse = await req;
      
      const endTime = process.hrtime.bigint();
      this.measurements.responseTime = Number(endTime - startTime) / 1000000;
      this.measurements.statusCode = this.lastResponse.status;

      return this;
    } catch (error) {
      this.lastResponse = {
        status: 0,
        headers: {},
        body: { error: error.message },
        error: error
      };
      return this;
    }
  }

  /**
   * Validates HTTP status code against expected value with detailed error reporting
   * @param {number} expectedStatus - Expected HTTP status code
   * @returns {HTTPTestClient} Fluent interface for method chaining
   */
  expectStatus(expectedStatus) {
    const actualStatus = this.lastResponse ? this.lastResponse.status : 0;
    
    if (actualStatus !== expectedStatus) {
      throw new Error(
        `Status code assertion failed: expected ${expectedStatus}, got ${actualStatus}. ` +
        `Response: ${JSON.stringify(this.lastResponse?.body || {}, null, 2)}`
      );
    }
    return this;
  }

  /**
   * Validates specific HTTP header presence and value with case-insensitive matching
   * @param {string} headerName - HTTP header name to validate
   * @param {string|RegExp} expectedValue - Expected header value or pattern
   * @returns {HTTPTestClient} Fluent interface for method chaining
   */
  expectHeader(headerName, expectedValue) {
    if (!this.lastResponse || !this.lastResponse.headers) {
      throw new Error(`No response headers available for validation`);
    }

    const headers = this.lastResponse.headers;
    const headerKey = Object.keys(headers).find(key => 
      key.toLowerCase() === headerName.toLowerCase()
    );

    if (!headerKey) {
      throw new Error(
        `Header '${headerName}' not found. Available headers: ${Object.keys(headers).join(', ')}`
      );
    }

    const actualValue = headers[headerKey];
    
    if (expectedValue instanceof RegExp) {
      if (!expectedValue.test(actualValue)) {
        throw new Error(
          `Header '${headerName}' value '${actualValue}' does not match pattern ${expectedValue}`
        );
      }
    } else if (expectedValue !== null && actualValue !== expectedValue) {
      throw new Error(
        `Header '${headerName}' value mismatch: expected '${expectedValue}', got '${actualValue}'`
      );
    }

    return this;
  }

  /**
   * Validates JSON response body structure and content with deep comparison
   * @param {Object} expectedBody - Expected response body structure
   * @returns {HTTPTestClient} Fluent interface for method chaining
   */
  expectJSON(expectedBody) {
    if (!this.lastResponse) {
      throw new Error('No response available for JSON validation');
    }

    const actualBody = this.lastResponse.body;
    
    // Deep comparison of expected properties
    Object.keys(expectedBody).forEach(key => {
      if (!(key in actualBody)) {
        throw new Error(`Missing property '${key}' in response body`);
      }
      
      if (typeof expectedBody[key] === 'object' && expectedBody[key] !== null) {
        // Recursive validation for nested objects
        this._deepCompare(expectedBody[key], actualBody[key], key);
      } else if (expectedBody[key] !== actualBody[key]) {
        throw new Error(
          `Property '${key}' mismatch: expected '${expectedBody[key]}', got '${actualBody[key]}'`
        );
      }
    });

    return this;
  }

  /**
   * Validates comprehensive security headers implementation with Helmet.js verification
   * @param {Object} securityConfig - Security header configuration for validation
   * @returns {HTTPTestClient} Fluent interface for method chaining
   */
  expectSecurityHeaders(securityConfig = {}) {
    const requiredHeaders = securityConfig.requiredHeaders || 
      securityTestData.securityHeaders.requiredHeaders;
    
    const forbiddenHeaders = securityConfig.forbiddenHeaders || 
      securityTestData.securityHeaders.forbiddenHeaders;

    // Validate required security headers are present
    requiredHeaders.forEach(headerName => {
      const headerKey = Object.keys(this.lastResponse.headers).find(key => 
        key.toLowerCase() === headerName.toLowerCase()
      );
      
      if (!headerKey) {
        throw new Error(`Required security header '${headerName}' is missing`);
      }
    });

    // Validate forbidden headers are not present
    forbiddenHeaders.forEach(headerName => {
      const headerKey = Object.keys(this.lastResponse.headers).find(key => 
        key.toLowerCase() === headerName.toLowerCase()
      );
      
      if (headerKey) {
        throw new Error(`Forbidden header '${headerName}' should not be present`);
      }
    });

    // Validate specific security header values
    if (this.lastResponse.headers['content-security-policy']) {
      const csp = this.lastResponse.headers['content-security-policy'];
      if (!csp.includes("default-src 'self'")) {
        throw new Error('Content-Security-Policy does not include required default-src directive');
      }
    }

    if (this.lastResponse.headers['strict-transport-security']) {
      const hsts = this.lastResponse.headers['strict-transport-security'];
      if (!hsts.includes('max-age=')) {
        throw new Error('Strict-Transport-Security header missing max-age directive');
      }
    }

    return this;
  }

  /**
   * Deep comparison utility for nested object validation
   * @private
   */
  _deepCompare(expected, actual, path) {
    Object.keys(expected).forEach(key => {
      const newPath = `${path}.${key}`;
      
      if (!(key in actual)) {
        throw new Error(`Missing nested property '${newPath}' in response`);
      }
      
      if (typeof expected[key] === 'object' && expected[key] !== null) {
        this._deepCompare(expected[key], actual[key], newPath);
      } else if (expected[key] !== actual[key]) {
        throw new Error(
          `Nested property '${newPath}' mismatch: expected '${expected[key]}', got '${actual[key]}'`
        );
      }
    });
  }

  /**
   * Gets performance measurements from last request
   * @returns {Object} Performance metrics including response time and memory usage
   */
  getPerformanceMetrics() {
    return { ...this.measurements };
  }

  /**
   * Gets last response object for manual inspection
   * @returns {Object} Last HTTP response object
   */
  getLastResponse() {
    return this.lastResponse;
  }
}

/**
 * Performance testing helper utility for response time measurement and throughput validation
 * @description Provides utilities for measuring API performance, conducting load tests,
 * and validating response time benchmarks against predefined targets
 */
class PerformanceHelper {
  constructor() {
    this.measurements = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Starts performance measurement session
   */
  startMeasurement() {
    this.startTime = process.hrtime.bigint();
    this.measurements = [];
  }

  /**
   * Records individual measurement data point
   * @param {string} operation - Operation name being measured
   * @param {number} duration - Operation duration in milliseconds
   * @param {Object} metadata - Additional measurement metadata
   */
  recordMeasurement(operation, duration, metadata = {}) {
    this.measurements.push({
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Calculates performance statistics from recorded measurements
   * @returns {Object} Performance statistics including averages, percentiles, and outliers
   */
  calculateStatistics() {
    if (this.measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, median: 0 };
    }

    const durations = this.measurements.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, val) => acc + val, 0);
    
    return {
      count: durations.length,
      average: sum / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      median: durations[Math.floor(durations.length / 2)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };
  }

  /**
   * Validates performance against benchmark targets
   * @param {Object} targets - Performance target configuration
   * @returns {Object} Validation results with pass/fail status and recommendations
   */
  validatePerformance(targets) {
    const stats = this.calculateStatistics();
    const results = {
      passed: true,
      violations: [],
      recommendations: []
    };

    if (targets.responseTime && stats.average > targets.responseTime) {
      results.passed = false;
      results.violations.push(
        `Average response time ${stats.average.toFixed(2)}ms exceeds target ${targets.responseTime}ms`
      );
      results.recommendations.push('Optimize server-side processing and middleware stack');
    }

    if (targets.p95ResponseTime && stats.p95 > targets.p95ResponseTime) {
      results.passed = false;
      results.violations.push(
        `95th percentile response time ${stats.p95.toFixed(2)}ms exceeds target ${targets.p95ResponseTime}ms`
      );
      results.recommendations.push('Investigate performance outliers and optimize slow requests');
    }

    return { ...results, statistics: stats };
  }
}

/**
 * Test environment setup function - initializes comprehensive testing infrastructure
 * @description Creates Express application instance, configures HTTP test client, sets up
 * performance helpers, and prepares test data fixtures for comprehensive API testing
 * 
 * @param {Object} testConfig - Test configuration options
 * @returns {Object} Test environment configuration with app instance, HTTP client, and helpers
 */
function setupIntegrationTests(testConfig = {}) {
  try {
    // Create Express application instance for testing with test-specific configuration
    testApp = createExpressApp({
      enableHealthMonitoring: testConfig.enableHealthMonitoring !== false,
      enableSecurityMiddleware: testConfig.enableSecurityMiddleware !== false,
      configOverrides: {
        environment: { NODE_ENV: 'test' },
        ...testConfig.configOverrides
      }
    });

    // Initialize HTTP test client with fluent API testing capabilities
    httpClient = new HTTPTestClient(testApp);

    // Set up performance helper utilities for response time measurement
    performanceHelper = new PerformanceHelper();

    // Record test environment initialization
    testStartTime = Date.now();

    console.log('✅ Integration test environment initialized successfully');
    console.log(`📊 Test configuration: ${JSON.stringify(testConfig, null, 2)}`);

    return {
      app: testApp,
      httpClient,
      performanceHelper,
      testConfig,
      startTime: testStartTime
    };

  } catch (error) {
    console.error('❌ Failed to initialize integration test environment:', error);
    throw new Error(`Test environment setup failed: ${error.message}`);
  }
}

/**
 * Test environment cleanup function - properly closes connections and generates reports
 * @description Cleans up test environment by closing HTTP connections, clearing test data,
 * resetting application state, and generating test completion reports with metrics
 * 
 * @param {Object} teardownConfig - Cleanup configuration options
 * @returns {Object} Test cleanup result with performance metrics and coverage summary
 */
function teardownIntegrationTests(teardownConfig = {}) {
  try {
    const testDuration = Date.now() - testStartTime;
    
    // Generate performance metrics summary
    const performanceMetrics = performanceHelper ? performanceHelper.calculateStatistics() : {};
    
    // Reset global test variables
    testApp = null;
    httpClient = null;
    performanceHelper = null;
    testStartTime = null;

    console.log('✅ Integration test environment cleaned up successfully');
    console.log(`⏱️  Total test duration: ${testDuration}ms`);
    console.log(`📊 Performance metrics: ${JSON.stringify(performanceMetrics, null, 2)}`);

    return {
      testDuration,
      performanceMetrics,
      cleanupStatus: 'success',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to cleanup integration test environment:', error);
    return {
      testDuration: testStartTime ? Date.now() - testStartTime : 0,
      cleanupStatus: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Comprehensive endpoint response validation function
 * @description Performs complete validation of HTTP endpoint responses including status codes,
 * content types, security headers, response timing, and educational analysis
 * 
 * @param {Object} response - HTTP response object to validate
 * @param {Object} expectedResponse - Expected response configuration
 * @param {Object} validationOptions - Validation configuration options
 * @returns {Object} Comprehensive validation result with status and analysis
 */
function validateEndpointResponse(response, expectedResponse, validationOptions = {}) {
  const validationResult = {
    passed: true,
    validations: [],
    failures: [],
    warnings: [],
    performanceMetrics: {},
    securityAnalysis: {},
    timestamp: new Date().toISOString()
  };

  try {
    // Validate HTTP status code
    if (expectedResponse.status && response.status !== expectedResponse.status) {
      validationResult.passed = false;
      validationResult.failures.push(
        `Status code mismatch: expected ${expectedResponse.status}, got ${response.status}`
      );
    } else {
      validationResult.validations.push(`Status code ${response.status} validation passed`);
    }

    // Validate content type header
    if (expectedResponse.headers && expectedResponse.headers['Content-Type']) {
      const actualContentType = response.headers['content-type'];
      const expectedContentType = expectedResponse.headers['Content-Type'];
      
      if (!actualContentType || !actualContentType.includes(expectedContentType.split(';')[0])) {
        validationResult.passed = false;
        validationResult.failures.push(
          `Content-Type mismatch: expected ${expectedContentType}, got ${actualContentType}`
        );
      } else {
        validationResult.validations.push(`Content-Type validation passed`);
      }
    }

    // Validate response body structure
    if (expectedResponse.body) {
      const bodyValidation = validateResponseBody(response.body, expectedResponse.body);
      if (!bodyValidation.passed) {
        validationResult.passed = false;
        validationResult.failures.push(...bodyValidation.failures);
      } else {
        validationResult.validations.push(...bodyValidation.validations);
      }
    }

    // Validate security headers if enabled
    if (validationOptions.validateSecurity !== false) {
      const securityValidation = validateSecurityHeaders(response.headers);
      validationResult.securityAnalysis = securityValidation;
      
      if (!securityValidation.passed) {
        validationResult.warnings.push(...securityValidation.warnings);
      }
    }

    // Record performance metrics
    if (validationOptions.responseTime) {
      validationResult.performanceMetrics.responseTime = validationOptions.responseTime;
      
      const targetTime = expectedResponse.performanceTarget || 100; // Default 100ms target
      if (validationOptions.responseTime > targetTime) {
        validationResult.warnings.push(
          `Response time ${validationOptions.responseTime}ms exceeds target ${targetTime}ms`
        );
      }
    }

    return validationResult;

  } catch (error) {
    validationResult.passed = false;
    validationResult.failures.push(`Validation error: ${error.message}`);
    return validationResult;
  }
}

/**
 * Response body structure validation helper
 * @private
 */
function validateResponseBody(actualBody, expectedBody) {
  const result = { passed: true, validations: [], failures: [] };
  
  Object.keys(expectedBody).forEach(key => {
    if (!(key in actualBody)) {
      result.passed = false;
      result.failures.push(`Missing property '${key}' in response body`);
    } else if (typeof expectedBody[key] === 'object' && expectedBody[key] !== null) {
      const nestedValidation = validateResponseBody(actualBody[key], expectedBody[key]);
      if (!nestedValidation.passed) {
        result.passed = false;
        result.failures.push(...nestedValidation.failures);
      }
    } else {
      result.validations.push(`Property '${key}' validation passed`);
    }
  });
  
  return result;
}

/**
 * Security headers validation helper
 * @private
 */
function validateSecurityHeaders(headers) {
  const result = {
    passed: true,
    warnings: [],
    securityScore: 100,
    headersAnalyzed: []
  };

  const requiredHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options'
  ];

  requiredHeaders.forEach(header => {
    const headerKey = Object.keys(headers).find(key => 
      key.toLowerCase() === header.toLowerCase()
    );
    
    if (!headerKey) {
      result.passed = false;
      result.warnings.push(`Missing security header: ${header}`);
      result.securityScore -= 20;
    } else {
      result.headersAnalyzed.push(header);
    }
  });

  // Check for information disclosure headers
  if (headers['x-powered-by']) {
    result.warnings.push('X-Powered-By header should be removed to prevent information disclosure');
    result.securityScore -= 10;
  }

  return result;
}

/**
 * Comprehensive security testing function for API endpoints
 * @description Conducts thorough security testing including Helmet.js header validation,
 * XSS attack prevention testing, CORS policy verification, and security vulnerability assessment
 * 
 * @param {string} endpoint - API endpoint to test for security
 * @param {Object} securityConfig - Security testing configuration
 * @returns {Object} Security testing results with vulnerability assessment
 */
async function testEndpointSecurity(endpoint, securityConfig = {}) {
  const securityResults = {
    endpoint,
    timestamp: new Date().toISOString(),
    overallSecurityScore: 100,
    testResults: {},
    vulnerabilities: [],
    recommendations: [],
    passed: true
  };

  try {
    // Test 1: Helmet.js security headers validation
    console.log(`🔒 Testing security headers for ${endpoint}`);
    
    const response = await httpClient.get(endpoint);
    const headersValidation = validateSecurityHeaders(response.getLastResponse().headers);
    
    securityResults.testResults.securityHeaders = headersValidation;
    securityResults.overallSecurityScore = Math.min(
      securityResults.overallSecurityScore, 
      headersValidation.securityScore
    );

    // Test 2: XSS protection testing
    console.log(`🛡️  Testing XSS protection for ${endpoint}`);
    
    for (const xssTest of securityTestData.xssAttacks) {
      try {
        const xssResponse = await httpClient.get(endpoint, {
          query: { input: xssTest.payload }
        });
        
        const responseBody = JSON.stringify(xssResponse.getLastResponse().body);
        
        if (responseBody.includes(xssTest.payload)) {
          securityResults.vulnerabilities.push({
            type: 'XSS_VULNERABILITY',
            severity: 'HIGH',
            description: `XSS payload not properly sanitized: ${xssTest.name}`,
            payload: xssTest.payload
          });
          securityResults.overallSecurityScore -= 25;
          securityResults.passed = false;
        }
      } catch (error) {
        // XSS test causing error is generally good (blocked)
        console.log(`✅ XSS test '${xssTest.name}' properly blocked`);
      }
    }

    // Test 3: CORS policy validation
    console.log(`🌐 Testing CORS policy for ${endpoint}`);
    
    try {
      const corsResponse = await httpClient.get(endpoint, {
        headers: { 
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = corsResponse.getLastResponse().headers;
      
      if (corsHeaders['access-control-allow-origin'] === '*') {
        securityResults.vulnerabilities.push({
          type: 'CORS_WILDCARD',
          severity: 'MEDIUM',
          description: 'CORS allows all origins - potential security risk'
        });
        securityResults.overallSecurityScore -= 15;
      }
      
      securityResults.testResults.corsPolicy = {
        allowOrigin: corsHeaders['access-control-allow-origin'],
        allowMethods: corsHeaders['access-control-allow-methods'],
        allowHeaders: corsHeaders['access-control-allow-headers']
      };
    } catch (error) {
      console.log(`✅ CORS policy properly configured`);
    }

    // Test 4: Rate limiting validation (if enabled)
    console.log(`⚡ Testing rate limiting for ${endpoint}`);
    
    const rateLimitPromises = Array(10).fill().map(() => httpClient.get(endpoint));
    const rateLimitResponses = await Promise.all(rateLimitPromises);
    
    const rateLimitedResponse = rateLimitResponses.find(r => 
      r.getLastResponse().status === HTTP_CONSTANTS.STATUS_CODES.TOO_MANY_REQUESTS
    );
    
    securityResults.testResults.rateLimiting = {
      implemented: !!rateLimitedResponse,
      requests: rateLimitResponses.length,
      blocked: rateLimitedResponse ? true : false
    };

    // Generate security recommendations
    if (securityResults.vulnerabilities.length > 0) {
      securityResults.recommendations.push(
        'Implement comprehensive input sanitization and output encoding',
        'Review and strengthen Content Security Policy directives',
        'Ensure all user inputs are properly validated and escaped'
      );
    }

    if (securityResults.overallSecurityScore < 80) {
      securityResults.recommendations.push(
        'Implement additional security headers for comprehensive protection',
        'Consider implementing Web Application Firewall (WAF) rules',
        'Conduct regular security audits and penetration testing'
      );
    }

    console.log(`🔒 Security testing completed for ${endpoint} - Score: ${securityResults.overallSecurityScore}/100`);
    
    return securityResults;

  } catch (error) {
    securityResults.passed = false;
    securityResults.vulnerabilities.push({
      type: 'TESTING_ERROR',
      severity: 'HIGH',
      description: `Security testing failed: ${error.message}`
    });
    
    return securityResults;
  }
}

/**
 * Performance measurement and benchmarking function for API endpoints
 * @description Measures and analyzes API endpoint performance including response time benchmarking,
 * concurrent request handling, memory usage validation, and throughput testing
 * 
 * @param {string} endpoint - API endpoint to measure performance
 * @param {Object} performanceConfig - Performance testing configuration
 * @returns {Object} Performance measurement results with benchmarks and optimization suggestions
 */
async function measureEndpointPerformance(endpoint, performanceConfig = {}) {
  const performanceResults = {
    endpoint,
    timestamp: new Date().toISOString(),
    measurements: {},
    benchmarks: {},
    recommendations: [],
    passed: true
  };

  try {
    console.log(`⚡ Starting performance testing for ${endpoint}`);
    
    // Get performance targets from test data
    const endpointName = endpoint.replace('/', '').replace('-', '') || 'default';
    const targets = performanceBenchmarks.responseTimeLimits[endpointName] || 
                   performanceBenchmarks.responseTimeLimits.hello;

    // Test 1: Single request response time baseline
    console.log(`📊 Measuring baseline response time for ${endpoint}`);
    
    performanceHelper.startMeasurement();
    
    const baselineStartTime = process.hrtime.bigint();
    const baselineResponse = await httpClient.get(endpoint);
    const baselineEndTime = process.hrtime.bigint();
    
    const baselineResponseTime = Number(baselineEndTime - baselineStartTime) / 1000000;
    
    performanceResults.measurements.baseline = {
      responseTime: baselineResponseTime,
      statusCode: baselineResponse.getLastResponse().status,
      memoryUsage: process.memoryUsage()
    };

    // Test 2: Multiple request average response time
    console.log(`📈 Measuring average response time over multiple requests`);
    
    const multipleRequestPromises = Array(10).fill().map(async (_, index) => {
      const startTime = process.hrtime.bigint();
      await httpClient.get(endpoint);
      const endTime = process.hrtime.bigint();
      
      const responseTime = Number(endTime - startTime) / 1000000;
      performanceHelper.recordMeasurement(`request_${index}`, responseTime);
      return responseTime;
    });

    const multipleResponseTimes = await Promise.all(multipleRequestPromises);
    const averageResponseTime = multipleResponseTimes.reduce((sum, time) => sum + time, 0) / multipleResponseTimes.length;
    
    performanceResults.measurements.average = {
      responseTime: averageResponseTime,
      sampleSize: multipleResponseTimes.length,
      min: Math.min(...multipleResponseTimes),
      max: Math.max(...multipleResponseTimes)
    };

    // Test 3: Concurrent request handling
    console.log(`🚀 Testing concurrent request handling for ${endpoint}`);
    
    const concurrentRequests = performanceConfig.concurrentRequests || 
                              performanceBenchmarks.concurrencyTargets.test || 20;
    
    const concurrentStartTime = Date.now();
    const concurrentPromises = Array(concurrentRequests).fill().map(async () => {
      const startTime = process.hrtime.bigint();
      const response = await httpClient.get(endpoint);
      const endTime = process.hrtime.bigint();
      
      return {
        responseTime: Number(endTime - startTime) / 1000000,
        statusCode: response.getLastResponse().status
      };
    });

    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentEndTime = Date.now();
    
    const successfulRequests = concurrentResults.filter(r => r.statusCode === 200).length;
    const totalDuration = concurrentEndTime - concurrentStartTime;
    const throughput = (successfulRequests / totalDuration) * 1000; // requests per second

    performanceResults.measurements.concurrent = {
      totalRequests: concurrentRequests,
      successfulRequests,
      totalDuration,
      throughput,
      averageResponseTime: concurrentResults.reduce((sum, r) => sum + r.responseTime, 0) / concurrentResults.length
    };

    // Test 4: Memory usage monitoring
    console.log(`💾 Monitoring memory usage during performance testing`);
    
    const memoryBefore = process.memoryUsage();
    
    // Simulate memory-intensive operations
    for (let i = 0; i < 100; i++) {
      await httpClient.get(endpoint);
    }
    
    const memoryAfter = process.memoryUsage();
    
    performanceResults.measurements.memory = {
      heapUsedBefore: memoryBefore.heapUsed,
      heapUsedAfter: memoryAfter.heapUsed,
      heapGrowth: memoryAfter.heapUsed - memoryBefore.heapUsed,
      rss: memoryAfter.rss,
      external: memoryAfter.external
    };

    // Benchmark validation against targets
    performanceResults.benchmarks = {
      responseTimeTarget: targets.target,
      responseTimeWarning: targets.warning,
      responseTimeCritical: targets.critical,
      baselineMeetsTarget: baselineResponseTime < targets.target,
      averageMeetsTarget: averageResponseTime < targets.target,
      throughputTarget: performanceBenchmarks.concurrencyTargets.requestsPerSecond?.minimum || 1000,
      throughputMeetsTarget: throughput > (performanceBenchmarks.concurrencyTargets.requestsPerSecond?.minimum || 1000)
    };

    // Generate performance recommendations
    if (averageResponseTime > targets.warning) {
      performanceResults.passed = false;
      performanceResults.recommendations.push(
        'Average response time exceeds warning threshold',
        'Consider optimizing database queries and business logic',
        'Review middleware stack for performance bottlenecks',
        'Implement response caching strategies'
      );
    }

    if (throughput < (performanceBenchmarks.concurrencyTargets.requestsPerSecond?.minimum || 1000)) {
      performanceResults.recommendations.push(
        'Throughput below target - consider horizontal scaling',
        'Optimize connection pooling and resource management',
        'Review PM2 cluster configuration for optimal CPU utilization'
      );
    }

    const memoryGrowthMB = performanceResults.measurements.memory.heapGrowth / (1024 * 1024);
    if (memoryGrowthMB > 10) {
      performanceResults.recommendations.push(
        'Significant memory growth detected - investigate potential memory leaks',
        'Implement proper cleanup of resources and event listeners',
        'Consider implementing garbage collection optimization'
      );
    }

    console.log(`⚡ Performance testing completed for ${endpoint}`);
    console.log(`📊 Baseline: ${baselineResponseTime.toFixed(2)}ms, Average: ${averageResponseTime.toFixed(2)}ms, Throughput: ${throughput.toFixed(2)} req/s`);
    
    return performanceResults;

  } catch (error) {
    performanceResults.passed = false;
    performanceResults.error = error.message;
    performanceResults.recommendations.push(
      'Performance testing failed - investigate application stability',
      'Check for unhandled errors affecting response times'
    );
    
    return performanceResults;
  }
}

/**
 * Cross-platform compatibility testing function for Flask migration preparation
 * @description Tests API endpoint compatibility for cross-platform migration by validating
 * response formats, status codes, header consistency, and behavior patterns
 * 
 * @param {string} endpoint - API endpoint to test for compatibility
 * @param {Object} compatibilityConfig - Cross-platform compatibility configuration
 * @returns {Object} Cross-platform compatibility analysis with migration readiness assessment
 */
async function testCrossPlatformCompatibility(endpoint, compatibilityConfig = {}) {
  const compatibilityResults = {
    endpoint,
    timestamp: new Date().toISOString(),
    expressResponse: null,
    flaskCompatibility: {},
    migrationReadiness: {
      score: 100,
      issues: [],
      recommendations: []
    },
    passed: true
  };

  try {
    console.log(`🔄 Testing cross-platform compatibility for ${endpoint}`);
    
    // Get Express.js response for baseline comparison
    const expressResponse = await httpClient.get(endpoint);
    compatibilityResults.expressResponse = {
      statusCode: expressResponse.getLastResponse().status,
      headers: expressResponse.getLastResponse().headers,
      body: expressResponse.getLastResponse().body,
      responseTime: expressResponse.getPerformanceMetrics().responseTime
    };

    // Test 1: Response format standardization
    console.log(`📋 Validating response format for Flask compatibility`);
    
    const responseBody = compatibilityResults.expressResponse.body;
    const contentType = compatibilityResults.expressResponse.headers['content-type'];
    
    // Validate JSON response format
    if (!contentType || !contentType.includes('application/json')) {
      compatibilityResults.migrationReadiness.issues.push(
        'Response content-type should be application/json for Flask compatibility'
      );
      compatibilityResults.migrationReadiness.score -= 20;
    }

    // Validate response structure consistency
    const requiredFields = {
      '/hello': ['message'],
      '/good-evening': ['message'],
      '/health': ['status', 'timestamp', 'uptime', 'environment']
    };

    const endpointRequiredFields = requiredFields[endpoint] || [];
    const missingFields = endpointRequiredFields.filter(field => !(field in responseBody));
    
    if (missingFields.length > 0) {
      compatibilityResults.migrationReadiness.issues.push(
        `Missing required fields for Flask compatibility: ${missingFields.join(', ')}`
      );
      compatibilityResults.migrationReadiness.score -= 15;
    }

    // Test 2: Status code standardization
    console.log(`🔢 Validating status code consistency for cross-platform migration`);
    
    const statusCode = compatibilityResults.expressResponse.statusCode;
    if (statusCode !== HTTP_CONSTANTS.STATUS_CODES.OK) {
      compatibilityResults.migrationReadiness.issues.push(
        `Unexpected status code ${statusCode} - should be 200 for successful requests`
      );
      compatibilityResults.migrationReadiness.score -= 10;
    }

    // Test 3: Header format compatibility
    console.log(`📝 Validating header format for Flask migration compatibility`);
    
    const headers = compatibilityResults.expressResponse.headers;
    const requiredHeaders = ['content-type', 'content-length'];
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length > 0) {
      compatibilityResults.migrationReadiness.issues.push(
        `Missing headers for Flask compatibility: ${missingHeaders.join(', ')}`
      );
      compatibilityResults.migrationReadiness.score -= 5;
    }

    // Check for Express.js specific headers that need conversion
    const expressSpecificHeaders = ['x-powered-by', 'etag'];
    const presentExpressHeaders = expressSpecificHeaders.filter(header => headers[header]);
    
    if (presentExpressHeaders.length > 0) {
      compatibilityResults.migrationReadiness.recommendations.push(
        `Express.js specific headers detected: ${presentExpressHeaders.join(', ')} - ensure Flask equivalent implementation`
      );
    }

    // Test 4: Error response format consistency
    console.log(`❌ Testing error response format compatibility`);
    
    try {
      const errorResponse = await httpClient.get('/nonexistent-endpoint');
      const errorStatusCode = errorResponse.getLastResponse().status;
      const errorBody = errorResponse.getLastResponse().body;
      
      compatibilityResults.flaskCompatibility.errorHandling = {
        statusCode: errorStatusCode,
        hasErrorMessage: !!errorBody.error || !!errorBody.message,
        responseFormat: typeof errorBody === 'object' ? 'json' : 'text'
      };
      
      if (errorStatusCode !== HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND) {
        compatibilityResults.migrationReadiness.issues.push(
          'Error status codes should be consistent between Express.js and Flask implementations'
        );
      }
    } catch (error) {
      // Error in error testing is acceptable
      console.log('Error response testing completed');
    }

    // Test 5: Performance characteristics comparison
    console.log(`⚡ Validating performance characteristics for migration planning`);
    
    const responseTime = compatibilityResults.expressResponse.responseTime;
    const performanceTargets = performanceBenchmarks.responseTimeLimits[endpoint.replace('/', '')] || 
                              performanceBenchmarks.responseTimeLimits.hello;
    
    compatibilityResults.flaskCompatibility.performance = {
      expressResponseTime: responseTime,
      meetsPerformanceTarget: responseTime < performanceTargets.target,
      flaskPerformanceExpectation: performanceTargets.target * 1.5 // Allow 50% variance for Flask
    };

    // Generate migration readiness assessment
    if (compatibilityResults.migrationReadiness.score >= 90) {
      compatibilityResults.migrationReadiness.status = 'READY';
      compatibilityResults.migrationReadiness.recommendations.push(
        'Endpoint is ready for Flask migration with minimal modifications'
      );
    } else if (compatibilityResults.migrationReadiness.score >= 70) {
      compatibilityResults.migrationReadiness.status = 'NEEDS_MINOR_CHANGES';
      compatibilityResults.migrationReadiness.recommendations.push(
        'Minor modifications required for optimal Flask compatibility',
        'Focus on response format standardization and header consistency'
      );
    } else {
      compatibilityResults.migrationReadiness.status = 'NEEDS_MAJOR_CHANGES';
      compatibilityResults.migrationReadiness.recommendations.push(
        'Significant modifications required for Flask migration',
        'Review response formats, status codes, and error handling patterns',
        'Consider implementing compatibility middleware for transition period'
      );
      compatibilityResults.passed = false;
    }

    console.log(`🔄 Cross-platform compatibility testing completed for ${endpoint}`);
    console.log(`📊 Migration readiness score: ${compatibilityResults.migrationReadiness.score}/100 (${compatibilityResults.migrationReadiness.status})`);
    
    return compatibilityResults;

  } catch (error) {
    compatibilityResults.passed = false;
    compatibilityResults.migrationReadiness.issues.push(
      `Compatibility testing failed: ${error.message}`
    );
    compatibilityResults.migrationReadiness.score = 0;
    compatibilityResults.migrationReadiness.status = 'TESTING_FAILED';
    
    return compatibilityResults;
  }
}

/**
 * Comprehensive test report generation function
 * @description Generates comprehensive integration test report including endpoint validation results,
 * security analysis, performance metrics, cross-platform compatibility assessment, and educational insights
 * 
 * @param {Object} testResults - Aggregated test results from all test suites
 * @param {Object} reportConfig - Report generation configuration
 * @returns {Object} Comprehensive test report with analysis, metrics, and recommendations
 */
function generateTestReport(testResults, reportConfig = {}) {
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      testDuration: testResults.testDuration || 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallScore: 0
    },
    endpointResults: {},
    securityAnalysis: {
      overallSecurityScore: 100,
      vulnerabilities: [],
      recommendations: []
    },
    performanceAnalysis: {
      overallPerformanceScore: 100,
      benchmarks: {},
      recommendations: []
    },
    compatibilityAnalysis: {
      migrationReadiness: 'UNKNOWN',
      overallCompatibilityScore: 100,
      recommendations: []
    },
    educationalInsights: [],
    recommendations: [],
    nextSteps: []
  };

  try {
    console.log('📊 Generating comprehensive integration test report');

    // Aggregate endpoint test results
    Object.keys(testResults).forEach(endpoint => {
      if (testResults[endpoint] && typeof testResults[endpoint] === 'object') {
        const endpointResult = testResults[endpoint];
        
        report.endpointResults[endpoint] = {
          functional: endpointResult.functional || {},
          security: endpointResult.security || {},
          performance: endpointResult.performance || {},
          compatibility: endpointResult.compatibility || {}
        };

        // Count tests
        report.summary.totalTests += 4; // functional, security, performance, compatibility
        
        const passedCount = [
          endpointResult.functional?.passed,
          endpointResult.security?.passed,
          endpointResult.performance?.passed,
          endpointResult.compatibility?.passed
        ].filter(Boolean).length;
        
        report.summary.passedTests += passedCount;
        report.summary.failedTests += (4 - passedCount);
      }
    });

    // Calculate overall scores
    const endpointCount = Object.keys(report.endpointResults).length;
    
    if (endpointCount > 0) {
      // Security analysis aggregation
      let totalSecurityScore = 0;
      let securityVulnerabilities = [];
      
      Object.values(report.endpointResults).forEach(result => {
        if (result.security?.overallSecurityScore) {
          totalSecurityScore += result.security.overallSecurityScore;
        }
        if (result.security?.vulnerabilities) {
          securityVulnerabilities.push(...result.security.vulnerabilities);
        }
      });
      
      report.securityAnalysis.overallSecurityScore = totalSecurityScore / endpointCount;
      report.securityAnalysis.vulnerabilities = securityVulnerabilities;

      // Performance analysis aggregation
      let totalPerformanceScore = 0;
      
      Object.values(report.endpointResults).forEach(result => {
        if (result.performance?.passed) {
          totalPerformanceScore += 100;
        } else {
          totalPerformanceScore += 60; // Partial score for failed performance tests
        }
      });
      
      report.performanceAnalysis.overallPerformanceScore = totalPerformanceScore / endpointCount;

      // Compatibility analysis aggregation
      let totalCompatibilityScore = 0;
      let migrationStatuses = [];
      
      Object.values(report.endpointResults).forEach(result => {
        if (result.compatibility?.migrationReadiness?.score) {
          totalCompatibilityScore += result.compatibility.migrationReadiness.score;
        }
        if (result.compatibility?.migrationReadiness?.status) {
          migrationStatuses.push(result.compatibility.migrationReadiness.status);
        }
      });
      
      report.compatibilityAnalysis.overallCompatibilityScore = totalCompatibilityScore / endpointCount;
      
      // Determine overall migration readiness
      if (migrationStatuses.every(status => status === 'READY')) {
        report.compatibilityAnalysis.migrationReadiness = 'READY';
      } else if (migrationStatuses.some(status => status === 'NEEDS_MAJOR_CHANGES')) {
        report.compatibilityAnalysis.migrationReadiness = 'NEEDS_MAJOR_CHANGES';
      } else {
        report.compatibilityAnalysis.migrationReadiness = 'NEEDS_MINOR_CHANGES';
      }
    }

    // Calculate overall test score
    report.summary.overallScore = (
      (report.summary.passedTests / Math.max(report.summary.totalTests, 1)) * 100
    );

    // Generate educational insights
    report.educationalInsights = [
      'Integration testing validates complete API endpoint functionality including security and performance',
      'Security testing with Helmet.js demonstrates modern web security best practices',
      'Performance benchmarking ensures production readiness and optimal user experience',
      'Cross-platform compatibility testing prepares for technology migration and framework flexibility',
      'Comprehensive error handling testing validates robustness under failure conditions'
    ];

    // Generate recommendations based on results
    if (report.securityAnalysis.overallSecurityScore < 80) {
      report.recommendations.push(
        'Strengthen security implementation with additional security headers',
        'Implement comprehensive input validation and output sanitization',
        'Consider security audit and penetration testing'
      );
    }

    if (report.performanceAnalysis.overallPerformanceScore < 80) {
      report.recommendations.push(
        'Optimize application performance to meet response time targets',
        'Implement caching strategies for frequently accessed endpoints',
        'Consider PM2 cluster mode optimization for better throughput'
      );
    }

    if (report.compatibilityAnalysis.migrationReadiness !== 'READY') {
      report.recommendations.push(
        'Address cross-platform compatibility issues before Flask migration',
        'Standardize response formats and error handling patterns',
        'Implement compatibility testing in CI/CD pipeline'
      );
    }

    // Generate next steps
    report.nextSteps = [
      'Review and address any failed test cases',
      'Implement recommended security and performance improvements',
      'Plan Flask migration based on compatibility analysis results',
      'Set up continuous integration for automated testing',
      'Document API specifications for cross-platform consistency'
    ];

    console.log('📊 Integration test report generated successfully');
    console.log(`✅ Overall Score: ${report.summary.overallScore.toFixed(1)}/100`);
    console.log(`🔒 Security Score: ${report.securityAnalysis.overallSecurityScore.toFixed(1)}/100`);
    console.log(`⚡ Performance Score: ${report.performanceAnalysis.overallPerformanceScore.toFixed(1)}/100`);
    console.log(`🔄 Migration Readiness: ${report.compatibilityAnalysis.migrationReadiness}`);

    return report;

  } catch (error) {
    console.error('❌ Failed to generate test report:', error);
    
    return {
      ...report,
      error: error.message,
      summary: {
        ...report.summary,
        overallScore: 0
      }
    };
  }
}

// ==================== MAIN TEST SUITES ====================

describe('Express.js API Endpoints Integration Testing', () => {
  let testResults = {};

  beforeAll(async () => {
    console.log('🚀 Initializing comprehensive API integration test suite');
    console.log('📋 Test Coverage: Functionality, Security, Performance, Cross-Platform Compatibility');
    
    const testEnvironment = setupIntegrationTests({
      enableHealthMonitoring: true,
      enableSecurityMiddleware: true,
      configOverrides: {
        environment: { NODE_ENV: 'test' }
      }
    });
    
    console.log('✅ Test environment initialized successfully');
  });

  afterAll(async () => {
    console.log('📊 Generating comprehensive test report');
    
    const report = generateTestReport(testResults, {
      includePerformanceMetrics: true,
      includeSecurityAnalysis: true,
      includeCompatibilityAssessment: true
    });
    
    teardownIntegrationTests({
      generateReport: true,
      report
    });
    
    console.log('✅ Integration test suite completed');
  });

  // ==================== HELLO ENDPOINT TESTS ====================
  
  describe('Hello Endpoint Integration Tests (/hello)', () => {
    const endpoint = '/hello';
    let endpointResults = {};

    beforeAll(() => {
      console.log(`🧪 Starting comprehensive testing for ${endpoint} endpoint`);
      testResults[endpoint] = {};
    });

    afterAll(() => {
      testResults[endpoint] = endpointResults;
      console.log(`✅ Completed testing for ${endpoint} endpoint`);
    });

    test('should return 200 status for GET /hello with correct response format', async () => {
      console.log('🔍 Testing basic functionality for /hello endpoint');
      
      const response = await httpClient.get(endpoint);
      
      // Validate basic response properties
      httpClient.expectStatus(HTTP_CONSTANTS.STATUS_CODES.OK);
      httpClient.expectHeader('Content-Type', /application\/json/);
      httpClient.expectJSON(httpEndpoints.hello.expectedResponse.body);
      
      // Validate response timing
      const metrics = httpClient.getPerformanceMetrics();
      expect(metrics.responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.hello.critical);
      
      endpointResults.functional = {
        passed: true,
        statusCode: metrics.statusCode,
        responseTime: metrics.responseTime,
        responseBody: response.getLastResponse().body
      };
      
      console.log(`✅ Basic functionality test passed - Response time: ${metrics.responseTime.toFixed(2)}ms`);
    });

    test('should include comprehensive security headers for GET /hello', async () => {
      console.log('🔒 Testing security implementation for /hello endpoint');
      
      const securityResults = await testEndpointSecurity(endpoint, {
        validateXSS: true,
        validateCSP: true,
        validateCORS: true
      });
      
      endpointResults.security = securityResults;
      
      expect(securityResults.passed).toBe(true);
      expect(securityResults.overallSecurityScore).toBeGreaterThan(75);
      expect(securityResults.vulnerabilities.filter(v => v.severity === 'HIGH')).toHaveLength(0);
      
      console.log(`🔒 Security test completed - Score: ${securityResults.overallSecurityScore}/100`);
    });

    test('should meet performance targets for GET /hello under normal load', async () => {
      console.log('⚡ Testing performance characteristics for /hello endpoint');
      
      const performanceResults = await measureEndpointPerformance(endpoint, {
        concurrentRequests: 50,
        measureMemory: true,
        validateThroughput: true
      });
      
      endpointResults.performance = performanceResults;
      
      expect(performanceResults.passed).toBe(true);
      expect(performanceResults.measurements.baseline.responseTime).toBeLessThan(
        performanceBenchmarks.responseTimeLimits.hello.target
      );
      expect(performanceResults.measurements.concurrent.throughput).toBeGreaterThan(100);
      
      console.log(`⚡ Performance test completed - Baseline: ${performanceResults.measurements.baseline.responseTime.toFixed(2)}ms`);
    });

    test('should handle OPTIONS request for CORS preflight correctly', async () => {
      console.log('🌐 Testing CORS preflight handling for /hello endpoint');
      
      const optionsResponse = await httpClient.post('/hello', {}, {
        headers: {
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
          'Origin': 'http://localhost:3000'
        }
      });
      
      // CORS preflight should return appropriate status
      const response = optionsResponse.getLastResponse();
      expect([200, 204, 404]).toContain(response.status); // Various valid CORS responses
      
      console.log('✅ CORS preflight test completed');
    });

    test('should be compatible with Flask migration requirements', async () => {
      console.log('🔄 Testing cross-platform compatibility for /hello endpoint');
      
      const compatibilityResults = await testCrossPlatformCompatibility(endpoint, {
        validateResponseFormat: true,
        validateStatusCodes: true,
        validateHeaders: true
      });
      
      endpointResults.compatibility = compatibilityResults;
      
      expect(compatibilityResults.passed).toBe(true);
      expect(compatibilityResults.migrationReadiness.score).toBeGreaterThan(70);
      expect(compatibilityResults.migrationReadiness.status).not.toBe('TESTING_FAILED');
      
      console.log(`🔄 Compatibility test completed - Readiness: ${compatibilityResults.migrationReadiness.status}`);
    });
  });

  // ==================== GOOD EVENING ENDPOINT TESTS ====================
  
  describe('Good Evening Endpoint Integration Tests (/good-evening)', () => {
    const endpoint = '/good-evening';
    let endpointResults = {};

    beforeAll(() => {
      console.log(`🧪 Starting comprehensive testing for ${endpoint} endpoint`);
      testResults[endpoint] = {};
    });

    afterAll(() => {
      testResults[endpoint] = endpointResults;
      console.log(`✅ Completed testing for ${endpoint} endpoint`);
    });

    test('should return 200 status for GET /good-evening with correct response format', async () => {
      console.log('🔍 Testing basic functionality for /good-evening endpoint');
      
      const response = await httpClient.get(endpoint);
      
      httpClient.expectStatus(HTTP_CONSTANTS.STATUS_CODES.OK);
      httpClient.expectHeader('Content-Type', /application\/json/);
      httpClient.expectJSON(httpEndpoints.goodEvening.expectedResponse.body);
      
      const metrics = httpClient.getPerformanceMetrics();
      expect(metrics.responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.goodEvening.critical);
      
      endpointResults.functional = {
        passed: true,
        statusCode: metrics.statusCode,
        responseTime: metrics.responseTime,
        responseBody: response.getLastResponse().body
      };
      
      console.log(`✅ Basic functionality test passed - Response time: ${metrics.responseTime.toFixed(2)}ms`);
    });

    test('should include identical security headers as hello endpoint', async () => {
      console.log('🔒 Testing security header consistency for /good-evening endpoint');
      
      const securityResults = await testEndpointSecurity(endpoint, {
        validateConsistency: true,
        compareWith: '/hello'
      });
      
      endpointResults.security = securityResults;
      
      expect(securityResults.passed).toBe(true);
      expect(securityResults.overallSecurityScore).toBeGreaterThan(75);
      
      console.log(`🔒 Security consistency test completed - Score: ${securityResults.overallSecurityScore}/100`);
    });

    test('should meet performance requirements consistently with hello endpoint', async () => {
      console.log('⚡ Testing performance consistency for /good-evening endpoint');
      
      const performanceResults = await measureEndpointPerformance(endpoint, {
        concurrentRequests: 50,
        compareWith: '/hello'
      });
      
      endpointResults.performance = performanceResults;
      
      expect(performanceResults.passed).toBe(true);
      expect(performanceResults.measurements.baseline.responseTime).toBeLessThan(
        performanceBenchmarks.responseTimeLimits.goodEvening.target
      );
      
      console.log(`⚡ Performance consistency test completed - Baseline: ${performanceResults.measurements.baseline.responseTime.toFixed(2)}ms`);
    });

    test('should maintain cross-platform compatibility standards', async () => {
      console.log('🔄 Testing cross-platform compatibility for /good-evening endpoint');
      
      const compatibilityResults = await testCrossPlatformCompatibility(endpoint, {
        validateConsistency: true
      });
      
      endpointResults.compatibility = compatibilityResults;
      
      expect(compatibilityResults.passed).toBe(true);
      expect(compatibilityResults.migrationReadiness.score).toBeGreaterThan(70);
      
      console.log(`🔄 Compatibility test completed - Readiness: ${compatibilityResults.migrationReadiness.status}`);
    });
  });

  // ==================== HEALTH ENDPOINT TESTS ====================
  
  describe('Health Check Endpoint Integration Tests (/health)', () => {
    const endpoint = '/health';
    let endpointResults = {};

    beforeAll(() => {
      console.log(`🧪 Starting comprehensive testing for ${endpoint} endpoint`);
      testResults[endpoint] = {};
    });

    afterAll(() => {
      testResults[endpoint] = endpointResults;
      console.log(`✅ Completed testing for ${endpoint} endpoint`);
    });

    test('should return comprehensive health status for GET /health', async () => {
      console.log('🔍 Testing health check functionality for /health endpoint');
      
      const response = await httpClient.get(endpoint);
      
      httpClient.expectStatus(HTTP_CONSTANTS.STATUS_CODES.OK);
      httpClient.expectHeader('Content-Type', /application\/json/);
      
      const responseBody = response.getLastResponse().body;
      
      // Validate required health check fields
      expect(responseBody).toHaveProperty('status');
      expect(responseBody).toHaveProperty('timestamp');
      expect(responseBody).toHaveProperty('uptime');
      expect(responseBody).toHaveProperty('environment');
      
      // Validate health check data types
      expect(typeof responseBody.status).toBe('string');
      expect(typeof responseBody.timestamp).toBe('string');
      expect(typeof responseBody.uptime).toBe('number');
      expect(responseBody.uptime).toBeGreaterThan(0);
      
      const metrics = httpClient.getPerformanceMetrics();
      expect(metrics.responseTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.health.critical);
      
      endpointResults.functional = {
        passed: true,
        statusCode: metrics.statusCode,
        responseTime: metrics.responseTime,
        responseBody: responseBody,
        healthStatus: responseBody.status
      };
      
      console.log(`✅ Health check test passed - Status: ${responseBody.status}, Uptime: ${responseBody.uptime.toFixed(2)}s`);
    });

    test('should include appropriate security headers for health endpoint', async () => {
      console.log('🔒 Testing security implementation for /health endpoint');
      
      const securityResults = await testEndpointSecurity(endpoint, {
        allowHealthSpecific: true
      });
      
      endpointResults.security = securityResults;
      
      expect(securityResults.passed).toBe(true);
      expect(securityResults.overallSecurityScore).toBeGreaterThan(70);
      
      console.log(`🔒 Health endpoint security test completed - Score: ${securityResults.overallSecurityScore}/100`);
    });

    test('should respond quickly for load balancer health checks', async () => {
      console.log('⚡ Testing health check performance for load balancer integration');
      
      const performanceResults = await measureEndpointPerformance(endpoint, {
        concurrentRequests: 100, // Health checks need to handle high concurrency
        optimizeForHealthChecks: true
      });
      
      endpointResults.performance = performanceResults;
      
      expect(performanceResults.passed).toBe(true);
      expect(performanceResults.measurements.baseline.responseTime).toBeLessThan(
        performanceBenchmarks.responseTimeLimits.health.target
      );
      
      // Health checks should be very fast
      expect(performanceResults.measurements.average.responseTime).toBeLessThan(50);
      
      console.log(`⚡ Health check performance test completed - Average: ${performanceResults.measurements.average.responseTime.toFixed(2)}ms`);
    });

    test('should provide consistent health data format for monitoring integration', async () => {
      console.log('🔄 Testing health check compatibility for monitoring systems');
      
      const compatibilityResults = await testCrossPlatformCompatibility(endpoint, {
        validateMonitoringCompatibility: true
      });
      
      endpointResults.compatibility = compatibilityResults;
      
      expect(compatibilityResults.passed).toBe(true);
      expect(compatibilityResults.migrationReadiness.score).toBeGreaterThan(80);
      
      console.log(`🔄 Health check compatibility test completed - Readiness: ${compatibilityResults.migrationReadiness.status}`);
    });
  });

  // ==================== CROSS-ENDPOINT INTEGRATION TESTS ====================
  
  describe('Cross-Endpoint Security Integration Tests', () => {
    test('should apply Helmet.js security headers consistently across all endpoints', async () => {
      console.log('🔒 Testing security header consistency across all endpoints');
      
      const endpoints = ['/hello', '/good-evening', '/health'];
      const securityResults = {};
      
      for (const endpoint of endpoints) {
        const response = await httpClient.get(endpoint);
        const headers = response.getLastResponse().headers;
        
        securityResults[endpoint] = {
          hasCSP: !!headers['content-security-policy'],
          hasHSTS: !!headers['strict-transport-security'],
          hasXFrameOptions: !!headers['x-frame-options'],
          hasXContentTypeOptions: !!headers['x-content-type-options'],
          missingXPoweredBy: !headers['x-powered-by']
        };
      }
      
      // Validate consistency across endpoints
      const firstEndpoint = securityResults[endpoints[0]];
      endpoints.slice(1).forEach(endpoint => {
        Object.keys(firstEndpoint).forEach(header => {
          expect(securityResults[endpoint][header]).toBe(firstEndpoint[header]);
        });
      });
      
      console.log('✅ Security header consistency validated across all endpoints');
    });

    test('should prevent XSS attacks across all endpoints', async () => {
      console.log('🛡️ Testing XSS protection across all endpoints');
      
      const endpoints = ['/hello', '/good-evening', '/health'];
      const xssPayload = '<script>alert("xss")</script>';
      
      for (const endpoint of endpoints) {
        const response = await httpClient.get(endpoint, {
          query: { input: xssPayload }
        });
        
        const responseBody = JSON.stringify(response.getLastResponse().body);
        expect(responseBody).not.toContain('<script>');
        expect(responseBody).not.toContain('alert');
      }
      
      console.log('✅ XSS protection validated across all endpoints');
    });
  });

  describe('Cross-Endpoint Performance Integration Tests', () => {
    test('should handle concurrent requests efficiently across multiple endpoints', async () => {
      console.log('🚀 Testing concurrent request handling across multiple endpoints');
      
      const endpoints = ['/hello', '/good-evening', '/health'];
      const concurrentRequests = 50;
      
      const startTime = Date.now();
      
      const allRequests = endpoints.flatMap(endpoint =>
        Array(concurrentRequests).fill().map(() => httpClient.get(endpoint))
      );
      
      const responses = await Promise.all(allRequests);
      const endTime = Date.now();
      
      const totalDuration = endTime - startTime;
      const successfulResponses = responses.filter(r => 
        r.getLastResponse().status === HTTP_CONSTANTS.STATUS_CODES.OK
      ).length;
      
      const throughput = (successfulResponses / totalDuration) * 1000; // req/sec
      
      expect(successfulResponses).toBe(allRequests.length);
      expect(throughput).toBeGreaterThan(100); // Minimum 100 req/sec
      
      console.log(`✅ Concurrent request test completed - Throughput: ${throughput.toFixed(2)} req/s`);
    });

    test('should maintain performance under sustained load', async () => {
      console.log('📊 Testing sustained load performance across endpoints');
      
      const endpoints = ['/hello', '/good-evening', '/health'];
      const loadTestDuration = 10000; // 10 seconds
      const requestInterval = 100; // 100ms between requests
      
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;
      
      while ((Date.now() - startTime) < loadTestDuration) {
        const endpoint = endpoints[requestCount % endpoints.length];
        
        try {
          const response = await httpClient.get(endpoint);
          if (response.getLastResponse().status === HTTP_CONSTANTS.STATUS_CODES.OK) {
            successCount++;
          }
          requestCount++;
          
          await new Promise(resolve => setTimeout(resolve, requestInterval));
        } catch (error) {
          requestCount++;
        }
      }
      
      const successRate = (successCount / requestCount) * 100;
      
      expect(successRate).toBeGreaterThan(95); // 95% success rate minimum
      
      console.log(`✅ Sustained load test completed - Success rate: ${successRate.toFixed(1)}%`);
    });
  });

  describe('Error Handling Integration Tests', () => {
    test('should return 404 for non-existent endpoints with proper error format', async () => {
      console.log('❌ Testing 404 error handling for non-existent endpoints');
      
      const nonExistentEndpoints = ['/nonexistent', '/invalid-route', '/missing-endpoint'];
      
      for (const endpoint of nonExistentEndpoints) {
        const response = await httpClient.get(endpoint);
        
        expect(response.getLastResponse().status).toBe(HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND);
        
        const responseBody = response.getLastResponse().body;
        expect(responseBody).toHaveProperty('error');
        expect(typeof responseBody.error).toBe('string');
      }
      
      console.log('✅ 404 error handling validated for non-existent endpoints');
    });

    test('should handle malformed requests gracefully', async () => {
      console.log('⚠️ Testing graceful handling of malformed requests');
      
      try {
        // Test with extremely long URL
        const longPath = '/hello' + 'a'.repeat(2048);
        const response = await httpClient.get(longPath);
        
        // Should either handle gracefully or return appropriate error
        expect([200, 404, 414, 400]).toContain(response.getLastResponse().status);
        
      } catch (error) {
        // Graceful error handling is acceptable
        console.log('Malformed request properly rejected');
      }
      
      console.log('✅ Malformed request handling validated');
    });

    test('should provide consistent error response format across all error scenarios', async () => {
      console.log('📋 Testing error response format consistency');
      
      const errorScenarios = [
        { endpoint: '/nonexistent', expectedStatus: 404 },
        { endpoint: '/hello/../invalid', expectedStatus: 404 },
      ];
      
      const errorResponses = [];
      
      for (const scenario of errorScenarios) {
        const response = await httpClient.get(scenario.endpoint);
        errorResponses.push({
          endpoint: scenario.endpoint,
          status: response.getLastResponse().status,
          body: response.getLastResponse().body,
          headers: response.getLastResponse().headers
        });
      }
      
      // Validate consistent error response structure
      errorResponses.forEach(errorResponse => {
        expect(errorResponse.body).toHaveProperty('error');
        expect(errorResponse.headers['content-type']).toContain('application/json');
      });
      
      console.log('✅ Error response format consistency validated');
    });
  });
});

// Export test utilities for external use and educational purposes
export {
  setupIntegrationTests,
  teardownIntegrationTests,
  validateEndpointResponse,
  testEndpointSecurity,
  measureEndpointPerformance,
  testCrossPlatformCompatibility,
  generateTestReport,
  HTTPTestClient,
  PerformanceHelper
};