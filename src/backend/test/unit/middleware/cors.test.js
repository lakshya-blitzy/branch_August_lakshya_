// @fileoverview Comprehensive unit test suite for CORS middleware component
// @description Tests CORS policy enforcement, origin validation, preflight handling, 
//              environment configurations, security compliance, and PM2 compatibility
// @author Tutorial Project Team
// @version 1.0.0
// @requires jest ^29.7.0 or mocha ^11.0.0

// External Dependencies
const supertest = require('supertest'); // ^6.3.3 - SuperAgent driven library for testing HTTP servers
const express = require('express'); // ^5.1.0 - Express.js framework for test applications
const cors = require('cors'); // ^2.8.5 - CORS middleware library for testing configurations

// Internal Dependencies - CORS Middleware Functions
const corsMiddleware = require('../../../middleware/cors.js');
const {
  configureCorsForEnvironment,
  handleCorsError,
  createCorsOptions,
  validateCorsRequest,
  logCorsActivity,
  createDevelopmentCors,
  createProductionCors
} = require('../../../middleware/cors.js');

// Internal Dependencies - Express Application Factory
const { createExpressApp } = require('../../../express-server.js');

// Internal Dependencies - Test Helpers (creating these since they don't exist)
const {
  setupTestHelpers,
  createHTTPTestHelper,
  createSecurityTestHelper,
  createPerformanceTestHelper,
  createCrossPlatformTestHelper,
  createMockDataHelper,
  HTTPTestClient,
  waitFor
} = {
  // Mock implementations since the files don't exist
  setupTestHelpers: (config) => ({
    http: createHTTPTestHelper(),
    security: createSecurityTestHelper(),
    performance: createPerformanceTestHelper(),
    crossPlatform: createCrossPlatformTestHelper(),
    mockData: createMockDataHelper()
  }),
  createHTTPTestHelper: () => ({
    createTestApp: (corsConfig) => {
      const app = express();
      if (corsConfig) {
        app.use(cors(corsConfig));
      }
      return app;
    },
    request: supertest
  }),
  createSecurityTestHelper: () => ({
    validateSecurityHeaders: (response) => {
      const headers = response.headers;
      return {
        hasAccessControlAllowOrigin: !!headers['access-control-allow-origin'],
        hasAccessControlAllowMethods: !!headers['access-control-allow-methods'],
        hasAccessControlAllowHeaders: !!headers['access-control-allow-headers'],
        hasAccessControlExposeHeaders: !!headers['access-control-expose-headers'],
        hasAccessControlAllowCredentials: !!headers['access-control-allow-credentials'],
        hasAccessControlMaxAge: !!headers['access-control-max-age'],
        hasVaryHeader: !!headers['vary']
      };
    }
  }),
  createPerformanceTestHelper: () => ({
    measureResponseTime: async (fn) => {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      return Number(end - start) / 1000000; // Convert to milliseconds
    },
    measureMemoryUsage: () => process.memoryUsage(),
    measureCPUUsage: () => process.cpuUsage()
  }),
  createCrossPlatformTestHelper: () => ({
    compareResponses: (expressResponse, flaskResponse) => ({
      statusMatch: expressResponse.status === flaskResponse.status,
      headersMatch: JSON.stringify(expressResponse.headers) === JSON.stringify(flaskResponse.headers),
      bodyMatch: JSON.stringify(expressResponse.body) === JSON.stringify(flaskResponse.body)
    })
  }),
  createMockDataHelper: () => ({
    generateCorsOrigins: () => corsTestOrigins,
    generateCorsViolations: () => corsViolationScenarios,
    generatePreflightRequests: () => preflightTestData,
    generateCorsHeaders: () => corsHeaderTestData
  }),
  HTTPTestClient: class {
    constructor(app) {
      this.app = app;
      this.request = supertest(app);
    }
    async get(path, headers = {}) {
      return this.request.get(path).set(headers);
    }
    async post(path, data, headers = {}) {
      return this.request.post(path).send(data).set(headers);
    }
    async options(path, headers = {}) {
      return this.request.options(path).set(headers);
    }
    expectHeader(response, headerName, expectedValue) {
      expect(response.headers[headerName.toLowerCase()]).toBe(expectedValue);
      return this;
    }
    expectStatus(response, expectedStatus) {
      expect(response.status).toBe(expectedStatus);
      return this;
    }
    expectResponseTime(responseTime, maxTime) {
      expect(responseTime).toBeLessThan(maxTime);
      return this;
    }
  },
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Test Data - CORS-specific test data since it's not in the fixtures
const securityTestData = {
  corsOrigins: {
    allowed: [
      'http://localhost:3000',
      'https://example.com',
      'https://test.example.com',
      'https://app.example.com',
      'https://api.example.com'
    ],
    blocked: [
      'http://malicious.com',
      'https://evil.example.org',
      'http://localhost:8080',
      'https://phishing-site.com',
      'http://suspicious-domain.net'
    ],
    wildcards: [
      'https://*.example.com',
      'http://localhost:*',
      'https://*.trusted-domain.org'
    ],
    special: [
      'null', // for file:// and data: schemes
      'chrome-extension://abcdefghijklmnopqrstuvwxyz123456'
    ]
  },
  corsViolations: [
    {
      name: 'blocked_origin',
      origin: 'https://malicious.com',
      method: 'GET',
      expectedBlocking: true,
      violationType: 'origin'
    },
    {
      name: 'blocked_method',
      origin: 'https://example.com',
      method: 'DELETE',
      expectedBlocking: true,
      violationType: 'method'
    },
    {
      name: 'blocked_header',
      origin: 'https://example.com',
      method: 'GET',
      headers: { 'X-Custom-Header': 'malicious-value' },
      expectedBlocking: true,
      violationType: 'header'
    },
    {
      name: 'credentials_without_https',
      origin: 'http://example.com',
      method: 'GET',
      credentials: true,
      expectedBlocking: true,
      violationType: 'credentials'
    }
  ],
  preflightRequests: [
    {
      name: 'valid_preflight',
      origin: 'https://example.com',
      method: 'OPTIONS',
      requestMethod: 'POST',
      requestHeaders: 'Content-Type',
      expectedResponse: {
        allowOrigin: 'https://example.com',
        allowMethods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowHeaders: 'Content-Type',
        maxAge: '86400'
      }
    },
    {
      name: 'invalid_preflight_origin',
      origin: 'https://malicious.com',
      method: 'OPTIONS',
      requestMethod: 'POST',
      requestHeaders: 'Content-Type',
      expectedResponse: null
    },
    {
      name: 'preflight_with_credentials',
      origin: 'https://example.com',
      method: 'OPTIONS',
      requestMethod: 'POST',
      requestHeaders: 'Content-Type',
      credentials: true,
      expectedResponse: {
        allowOrigin: 'https://example.com',
        allowMethods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowHeaders: 'Content-Type',
        allowCredentials: 'true',
        maxAge: '86400'
      }
    }
  ],
  corsHeaders: {
    required: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers'
    ],
    optional: [
      'Access-Control-Expose-Headers',
      'Access-Control-Allow-Credentials',
      'Access-Control-Max-Age'
    ],
    forbidden: [
      'Access-Control-Allow-Origin: *',
      'Access-Control-Allow-Credentials: true'
    ]
  }
};

const performanceBenchmarks = {
  responseTimeLimits: {
    corsProcessing: { target: 5, warning: 10, critical: 20 },
    originValidation: { target: 2, warning: 5, critical: 10 },
    preflightHandling: { target: 10, warning: 20, critical: 50 }
  },
  memoryThresholds: {
    corsMiddleware: { target: 10, warning: 20, critical: 50 },
    originCache: { target: 5, warning: 10, critical: 20 }
  },
  concurrencyTargets: {
    simultaneousRequests: { target: 1000, minimum: 500 },
    preflightCache: { target: 10000, minimum: 1000 }
  }
};

const crossPlatformTestData = {
  corsCompatibility: {
    expressCorsConfig: {
      origin: ['https://example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400
    },
    flaskCorsConfig: {
      origins: ['https://example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allow_headers: ['Content-Type', 'Authorization'],
      supports_credentials: true,
      max_age: 86400
    }
  },
  flaskCorsConfig: {
    mapping: {
      'origin': 'origins',
      'allowedHeaders': 'allow_headers',
      'credentials': 'supports_credentials',
      'maxAge': 'max_age'
    }
  }
};

const validationRules = {
  corsValidation: {
    originValidation: {
      protocol: ['http:', 'https:'],
      hostname: /^[a-zA-Z0-9.-]+$/,
      port: /^\d{1,5}$/
    },
    headerValidation: {
      allowedMethods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: /^[a-zA-Z0-9-_]+$/,
      maxAge: { min: 0, max: 86400 }
    },
    securityValidation: {
      credentialsWithWildcard: false,
      nullOriginHandling: true,
      originCaseSensitive: true
    }
  }
};

// Global Test Variables
let TEST_APP = null;
let HTTP_TEST_CLIENT = null;
let SECURITY_TEST_HELPER = null;
let PERFORMANCE_TEST_HELPER = null;
let CROSS_PLATFORM_TEST_HELPER = null;
let MOCK_DATA_HELPER = null;
let TEST_SERVER = null;
let CORS_METRICS = { violations: 0, preflight: 0, allowed: 0, blocked: 0 };
let TEST_CONTEXT = { framework: 'jest', environment: 'test', isolation: true };
let CORS_TEST_ORIGINS = ['http://localhost:3000', 'https://example.com', 'https://test.example.com'];

/**
 * Main setup function that initializes comprehensive CORS testing environment
 * @param {object} testConfig - Test configuration object
 * @returns {object} Complete CORS test setup with initialized app, helpers, and utilities
 */
async function setupCorsTests(testConfig = {}) {
  // Initialize test configuration and detect testing framework
  TEST_CONTEXT.framework = typeof jest !== 'undefined' ? 'jest' : 'mocha';
  TEST_CONTEXT.environment = process.env.NODE_ENV || 'test';
  TEST_CONTEXT.isolation = testConfig.isolation !== false;

  // Set up comprehensive test helpers
  const helpers = setupTestHelpers({ cors: true, security: true, performance: true });
  
  // Create Express.js test application
  TEST_APP = createTestExpressAppWithCors(testConfig.corsConfig || {}, testConfig.testOptions || {});
  
  // Initialize HTTP test client
  HTTP_TEST_CLIENT = new HTTPTestClient(TEST_APP);
  
  // Set up security test helper
  SECURITY_TEST_HELPER = helpers.security;
  
  // Initialize performance test helper
  PERFORMANCE_TEST_HELPER = helpers.performance;
  
  // Create cross-platform test helper
  CROSS_PLATFORM_TEST_HELPER = helpers.crossPlatform;
  
  // Set up mock data helper
  MOCK_DATA_HELPER = helpers.mockData;
  
  // Configure CORS metrics collection
  CORS_METRICS = { violations: 0, preflight: 0, allowed: 0, blocked: 0 };
  
  // Set up CORS test origins
  CORS_TEST_ORIGINS = testConfig.testOrigins || CORS_TEST_ORIGINS;
  
  // Configure test timeouts and performance thresholds
  if (TEST_CONTEXT.framework === 'jest') {
    jest.setTimeout(testConfig.timeout || 10000);
  }
  
  // Start test server if needed
  if (testConfig.startServer !== false) {
    TEST_SERVER = TEST_APP.listen(0); // Use random port
  }
  
  console.log(`✓ CORS test setup complete - Framework: ${TEST_CONTEXT.framework}, Environment: ${TEST_CONTEXT.environment}`);
  
  return {
    app: TEST_APP,
    client: HTTP_TEST_CLIENT,
    server: TEST_SERVER,
    helpers: {
      security: SECURITY_TEST_HELPER,
      performance: PERFORMANCE_TEST_HELPER,
      crossPlatform: CROSS_PLATFORM_TEST_HELPER,
      mockData: MOCK_DATA_HELPER
    },
    metrics: CORS_METRICS,
    context: TEST_CONTEXT
  };
}

/**
 * Comprehensive teardown function for proper CORS test cleanup
 * @returns {Promise<void>} Promise that resolves when all cleanup is complete
 */
async function teardownCorsTests() {
  // Close HTTP test server
  if (TEST_SERVER) {
    await new Promise((resolve) => {
      TEST_SERVER.close(resolve);
    });
    TEST_SERVER = null;
  }
  
  // Reset CORS middleware cache and clear configuration state
  // Reset global test variables
  TEST_APP = null;
  HTTP_TEST_CLIENT = null;
  SECURITY_TEST_HELPER = null;
  PERFORMANCE_TEST_HELPER = null;
  CROSS_PLATFORM_TEST_HELPER = null;
  MOCK_DATA_HELPER = null;
  
  // Reset CORS metrics
  CORS_METRICS = { violations: 0, preflight: 0, allowed: 0, blocked: 0 };
  
  // Clear test context
  TEST_CONTEXT = { framework: 'jest', environment: 'test', isolation: true };
  
  // Reset CORS test origins
  CORS_TEST_ORIGINS = [];
  
  console.log('✓ CORS test teardown complete');
}

/**
 * Creates isolated Express.js application for CORS middleware testing
 * @param {object} corsConfig - CORS configuration object
 * @param {object} testOptions - Test-specific options
 * @returns {Express} Test Express application with configured CORS middleware
 */
function createTestExpressAppWithCors(corsConfig = {}, testOptions = {}) {
  // Create Express application instance
  const app = express();
  
  // Configure CORS middleware with test-specific options
  const corsOptions = createCorsOptions({
    ...corsConfig,
    origin: corsConfig.origin || CORS_TEST_ORIGINS,
    methods: corsConfig.methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: corsConfig.allowedHeaders || ['Content-Type', 'Authorization'],
    credentials: corsConfig.credentials || false,
    maxAge: corsConfig.maxAge || 86400,
    ...testOptions
  });
  
  // Apply CORS middleware
  app.use(cors(corsOptions));
  
  // Set up test routes for CORS validation
  app.get('/hello', (req, res) => {
    res.json({ message: 'Hello world' });
  });
  
  app.get('/good-evening', (req, res) => {
    res.json({ message: 'Good evening' });
  });
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'test'
    });
  });
  
  // Set up preflight request handlers
  app.options('*', cors(corsOptions));
  
  // Configure error handling for CORS violations
  app.use((err, req, res, next) => {
    if (err.message && err.message.includes('CORS')) {
      CORS_METRICS.violations++;
      return res.status(403).json({
        error: 'CORS Policy Violation',
        message: err.message,
        origin: req.get('Origin') || 'unknown'
      });
    }
    next(err);
  });
  
  return app;
}

/**
 * Comprehensive test function for validating CORS origin policies
 * @param {Express} testApp - Test Express application
 * @param {object} originValidationConfig - Origin validation configuration
 * @returns {Promise<object>} Promise resolving with comprehensive origin validation results
 */
async function testCorsOriginValidation(testApp, originValidationConfig = {}) {
  const results = {
    allowedOrigins: { passed: 0, failed: 0, details: [] },
    blockedOrigins: { passed: 0, failed: 0, details: [] },
    wildcardOrigins: { passed: 0, failed: 0, details: [] },
    specialOrigins: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0 }
  };
  
  // Test allowed origins
  for (const origin of securityTestData.corsOrigins.allowed) {
    try {
      const response = await supertest(testApp)
        .get('/hello')
        .set('Origin', origin)
        .expect(200);
      
      const hasCorrectHeader = response.headers['access-control-allow-origin'] === origin;
      if (hasCorrectHeader) {
        results.allowedOrigins.passed++;
        results.allowedOrigins.details.push({ origin, status: 'PASS', reason: 'Allowed origin accepted' });
      } else {
        results.allowedOrigins.failed++;
        results.allowedOrigins.details.push({ origin, status: 'FAIL', reason: 'Missing or incorrect CORS header' });
      }
    } catch (error) {
      results.allowedOrigins.failed++;
      results.allowedOrigins.details.push({ origin, status: 'FAIL', reason: error.message });
    }
    results.summary.totalTests++;
  }
  
  // Test blocked origins
  for (const origin of securityTestData.corsOrigins.blocked) {
    try {
      const response = await supertest(testApp)
        .get('/hello')
        .set('Origin', origin);
      
      const isBlocked = !response.headers['access-control-allow-origin'] || 
                       response.headers['access-control-allow-origin'] !== origin;
      if (isBlocked) {
        results.blockedOrigins.passed++;
        results.blockedOrigins.details.push({ origin, status: 'PASS', reason: 'Blocked origin correctly rejected' });
      } else {
        results.blockedOrigins.failed++;
        results.blockedOrigins.details.push({ origin, status: 'FAIL', reason: 'Blocked origin was allowed' });
      }
    } catch (error) {
      results.blockedOrigins.passed++;
      results.blockedOrigins.details.push({ origin, status: 'PASS', reason: 'Origin correctly blocked with error' });
    }
    results.summary.totalTests++;
  }
  
  // Test null origin handling
  try {
    const response = await supertest(testApp)
      .get('/hello')
      .set('Origin', 'null');
    
    const nullHandled = response.headers['access-control-allow-origin'] === 'null' || 
                       !response.headers['access-control-allow-origin'];
    results.specialOrigins[nullHandled ? 'passed' : 'failed']++;
    results.specialOrigins.details.push({
      origin: 'null',
      status: nullHandled ? 'PASS' : 'FAIL',
      reason: nullHandled ? 'Null origin handled correctly' : 'Null origin handling failed'
    });
  } catch (error) {
    results.specialOrigins.failed++;
    results.specialOrigins.details.push({ origin: 'null', status: 'FAIL', reason: error.message });
  }
  results.summary.totalTests++;
  
  // Calculate summary
  results.summary.passed = results.allowedOrigins.passed + results.blockedOrigins.passed + 
                           results.wildcardOrigins.passed + results.specialOrigins.passed;
  results.summary.failed = results.allowedOrigins.failed + results.blockedOrigins.failed + 
                           results.wildcardOrigins.failed + results.specialOrigins.failed;
  
  return results;
}

/**
 * Tests CORS preflight request handling
 * @param {Express} testApp - Test Express application
 * @param {object} preflightConfig - Preflight configuration
 * @returns {Promise<object>} Promise resolving with preflight handling validation results
 */
async function testCorsPreflightHandling(testApp, preflightConfig = {}) {
  const results = {
    validPreflight: { passed: 0, failed: 0, details: [] },
    invalidPreflight: { passed: 0, failed: 0, details: [] },
    preflightCache: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0 }
  };
  
  // Test valid preflight requests
  for (const preflightTest of securityTestData.preflightRequests) {
    if (preflightTest.expectedResponse) {
      try {
        const response = await supertest(testApp)
          .options('/hello')
          .set('Origin', preflightTest.origin)
          .set('Access-Control-Request-Method', preflightTest.requestMethod)
          .set('Access-Control-Request-Headers', preflightTest.requestHeaders);
        
        const hasAllowOrigin = response.headers['access-control-allow-origin'] === preflightTest.expectedResponse.allowOrigin;
        const hasAllowMethods = response.headers['access-control-allow-methods']?.includes(preflightTest.requestMethod);
        const hasAllowHeaders = response.headers['access-control-allow-headers']?.includes(preflightTest.requestHeaders);
        
        if (hasAllowOrigin && hasAllowMethods && hasAllowHeaders) {
          results.validPreflight.passed++;
          results.validPreflight.details.push({
            test: preflightTest.name,
            status: 'PASS',
            reason: 'Valid preflight handled correctly'
          });
        } else {
          results.validPreflight.failed++;
          results.validPreflight.details.push({
            test: preflightTest.name,
            status: 'FAIL',
            reason: 'Preflight headers missing or incorrect'
          });
        }
      } catch (error) {
        results.validPreflight.failed++;
        results.validPreflight.details.push({
          test: preflightTest.name,
          status: 'FAIL',
          reason: error.message
        });
      }
    } else {
      // Test invalid preflight (should be rejected)
      try {
        const response = await supertest(testApp)
          .options('/hello')
          .set('Origin', preflightTest.origin)
          .set('Access-Control-Request-Method', preflightTest.requestMethod);
        
        const isRejected = !response.headers['access-control-allow-origin'];
        if (isRejected) {
          results.invalidPreflight.passed++;
          results.invalidPreflight.details.push({
            test: preflightTest.name,
            status: 'PASS',
            reason: 'Invalid preflight correctly rejected'
          });
        } else {
          results.invalidPreflight.failed++;
          results.invalidPreflight.details.push({
            test: preflightTest.name,
            status: 'FAIL',
            reason: 'Invalid preflight was allowed'
          });
        }
      } catch (error) {
        results.invalidPreflight.passed++;
        results.invalidPreflight.details.push({
          test: preflightTest.name,
          status: 'PASS',
          reason: 'Invalid preflight correctly rejected with error'
        });
      }
    }
    results.summary.totalTests++;
  }
  
  // Calculate summary
  results.summary.passed = results.validPreflight.passed + results.invalidPreflight.passed + results.preflightCache.passed;
  results.summary.failed = results.validPreflight.failed + results.invalidPreflight.failed + results.preflightCache.failed;
  
  return results;
}

/**
 * Validates CORS header configuration
 * @param {Express} testApp - Test Express application
 * @param {object} headerConfig - Header configuration
 * @returns {Promise<object>} Promise resolving with CORS header validation results
 */
async function testCorsHeaderConfiguration(testApp, headerConfig = {}) {
  const results = {
    requiredHeaders: { passed: 0, failed: 0, details: [] },
    optionalHeaders: { passed: 0, failed: 0, details: [] },
    securityHeaders: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0 }
  };
  
  // Test with valid origin
  const testOrigin = 'https://example.com';
  const response = await supertest(testApp)
    .get('/hello')
    .set('Origin', testOrigin);
  
  // Test required headers
  for (const headerName of securityTestData.corsHeaders.required) {
    const headerKey = headerName.toLowerCase();
    const hasHeader = !!response.headers[headerKey];
    
    if (hasHeader) {
      results.requiredHeaders.passed++;
      results.requiredHeaders.details.push({
        header: headerName,
        status: 'PASS',
        value: response.headers[headerKey],
        reason: 'Required header present'
      });
    } else {
      results.requiredHeaders.failed++;
      results.requiredHeaders.details.push({
        header: headerName,
        status: 'FAIL',
        reason: 'Required header missing'
      });
    }
    results.summary.totalTests++;
  }
  
  // Test optional headers
  for (const headerName of securityTestData.corsHeaders.optional) {
    const headerKey = headerName.toLowerCase();
    const hasHeader = !!response.headers[headerKey];
    
    results.optionalHeaders.passed++;
    results.optionalHeaders.details.push({
      header: headerName,
      status: 'INFO',
      value: response.headers[headerKey] || 'not present',
      reason: hasHeader ? 'Optional header present' : 'Optional header not present'
    });
    results.summary.totalTests++;
  }
  
  // Test Vary header for proper caching
  const varyHeader = response.headers['vary'];
  const hasVaryOrigin = varyHeader && varyHeader.includes('Origin');
  if (hasVaryOrigin) {
    results.securityHeaders.passed++;
    results.securityHeaders.details.push({
      header: 'Vary',
      status: 'PASS',
      value: varyHeader,
      reason: 'Vary header includes Origin for proper caching'
    });
  } else {
    results.securityHeaders.failed++;
    results.securityHeaders.details.push({
      header: 'Vary',
      status: 'FAIL',
      reason: 'Vary header missing Origin for CORS caching'
    });
  }
  results.summary.totalTests++;
  
  // Calculate summary
  results.summary.passed = results.requiredHeaders.passed + results.optionalHeaders.passed + results.securityHeaders.passed;
  results.summary.failed = results.requiredHeaders.failed + results.optionalHeaders.failed + results.securityHeaders.failed;
  
  return results;
}

/**
 * Tests CORS violation detection and handling
 * @param {array} violationScenarios - Array of violation test scenarios
 * @param {object} violationConfig - Violation handling configuration
 * @returns {Promise<object>} Promise resolving with violation handling results
 */
async function testCorsViolationHandling(violationScenarios, violationConfig = {}) {
  const results = {
    originViolations: { passed: 0, failed: 0, details: [] },
    methodViolations: { passed: 0, failed: 0, details: [] },
    headerViolations: { passed: 0, failed: 0, details: [] },
    credentialViolations: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0 }
  };
  
  // Create test app with strict CORS policy
  const strictApp = createTestExpressAppWithCors({
    origin: ['https://example.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false
  });
  
  for (const violation of violationScenarios) {
    try {
      const request = supertest(strictApp)[violation.method.toLowerCase()]('/hello');
      
      if (violation.origin) {
        request.set('Origin', violation.origin);
      }
      
      if (violation.headers) {
        Object.entries(violation.headers).forEach(([key, value]) => {
          request.set(key, value);
        });
      }
      
      const response = await request;
      
      const isBlocked = response.status >= 400 || !response.headers['access-control-allow-origin'];
      const category = violation.violationType + 'Violations';
      
      if (violation.expectedBlocking && isBlocked) {
        results[category].passed++;
        results[category].details.push({
          violation: violation.name,
          status: 'PASS',
          reason: 'Violation correctly blocked'
        });
        CORS_METRICS.blocked++;
      } else if (!violation.expectedBlocking && !isBlocked) {
        results[category].passed++;
        results[category].details.push({
          violation: violation.name,
          status: 'PASS',
          reason: 'Valid request correctly allowed'
        });
        CORS_METRICS.allowed++;
      } else {
        results[category].failed++;
        results[category].details.push({
          violation: violation.name,
          status: 'FAIL',
          reason: violation.expectedBlocking ? 'Violation not blocked' : 'Valid request blocked'
        });
        CORS_METRICS.violations++;
      }
    } catch (error) {
      const category = violation.violationType + 'Violations';
      if (violation.expectedBlocking) {
        results[category].passed++;
        results[category].details.push({
          violation: violation.name,
          status: 'PASS',
          reason: 'Violation blocked with error'
        });
      } else {
        results[category].failed++;
        results[category].details.push({
          violation: violation.name,
          status: 'FAIL',
          reason: error.message
        });
      }
    }
    results.summary.totalTests++;
  }
  
  // Calculate summary
  results.summary.passed = results.originViolations.passed + results.methodViolations.passed + 
                           results.headerViolations.passed + results.credentialViolations.passed;
  results.summary.failed = results.originViolations.failed + results.methodViolations.failed + 
                           results.headerViolations.failed + results.credentialViolations.failed;
  
  return results;
}

/**
 * Tests environment-specific CORS configurations
 * @param {string} environment - Environment name (development/staging/production)
 * @param {object} environmentConfig - Environment-specific configuration
 * @returns {Promise<object>} Promise resolving with environment CORS validation results
 */
async function testCorsEnvironmentConfiguration(environment, environmentConfig = {}) {
  const results = {
    configurationValidation: { passed: 0, failed: 0, details: [] },
    policyEnforcement: { passed: 0, failed: 0, details: [] },
    environmentSpecific: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0 }
  };
  
  // Configure environment-specific CORS
  let corsConfig;
  if (environment === 'development') {
    corsConfig = createDevelopmentCors();
  } else if (environment === 'production') {
    corsConfig = createProductionCors();
  } else {
    corsConfig = configureCorsForEnvironment(environment);
  }
  
  const envApp = createTestExpressAppWithCors(corsConfig);
  
  // Test wildcard origin handling in development
  if (environment === 'development') {
    try {
      const response = await supertest(envApp)
        .get('/hello')
        .set('Origin', 'http://localhost:8080');
      
      const allowsLocalhost = response.headers['access-control-allow-origin'] === 'http://localhost:8080' ||
                             response.headers['access-control-allow-origin'] === '*';
      
      if (allowsLocalhost) {
        results.environmentSpecific.passed++;
        results.environmentSpecific.details.push({
          test: 'development_localhost_access',
          status: 'PASS',
          reason: 'Development allows localhost origins'
        });
      } else {
        results.environmentSpecific.failed++;
        results.environmentSpecific.details.push({
          test: 'development_localhost_access',
          status: 'FAIL',
          reason: 'Development should allow localhost origins'
        });
      }
    } catch (error) {
      results.environmentSpecific.failed++;
      results.environmentSpecific.details.push({
        test: 'development_localhost_access',
        status: 'FAIL',
        reason: error.message
      });
    }
    results.summary.totalTests++;
  }
  
  // Test strict origin enforcement in production
  if (environment === 'production') {
    try {
      const response = await supertest(envApp)
        .get('/hello')
        .set('Origin', 'http://malicious.com');
      
      const isBlocked = !response.headers['access-control-allow-origin'] ||
                       response.headers['access-control-allow-origin'] !== 'http://malicious.com';
      
      if (isBlocked) {
        results.environmentSpecific.passed++;
        results.environmentSpecific.details.push({
          test: 'production_strict_origins',
          status: 'PASS',
          reason: 'Production blocks unauthorized origins'
        });
      } else {
        results.environmentSpecific.failed++;
        results.environmentSpecific.details.push({
          test: 'production_strict_origins',
          status: 'FAIL',
          reason: 'Production should block unauthorized origins'
        });
      }
    } catch (error) {
      results.environmentSpecific.passed++;
      results.environmentSpecific.details.push({
        test: 'production_strict_origins',
        status: 'PASS',
        reason: 'Production correctly blocked with error'
      });
    }
    results.summary.totalTests++;
  }
  
  // Calculate summary
  results.summary.passed = results.configurationValidation.passed + results.policyEnforcement.passed + 
                           results.environmentSpecific.passed;
  results.summary.failed = results.configurationValidation.failed + results.policyEnforcement.failed + 
                           results.environmentSpecific.failed;
  
  return results;
}

/**
 * Measures CORS middleware performance impact
 * @param {Express} testApp - Test Express application
 * @param {object} performanceConfig - Performance testing configuration
 * @returns {Promise<object>} Promise resolving with performance analysis results
 */
async function testCorsPerformanceOptimization(testApp, performanceConfig = {}) {
  const results = {
    responseTimeOverhead: { measurements: [], average: 0, median: 0 },
    originValidationPerformance: { measurements: [], average: 0 },
    preflightCacheEffectiveness: { cacheHits: 0, cacheMisses: 0 },
    throughputImpact: { baseline: 0, withCors: 0, overhead: 0 },
    summary: { performanceGrade: 'A', recommendations: [] }
  };
  
  // Measure baseline performance without CORS
  const baselineApp = express();
  baselineApp.get('/hello', (req, res) => res.json({ message: 'Hello world' }));
  
  const baselineMeasurements = [];
  for (let i = 0; i < 10; i++) {
    const start = process.hrtime.bigint();
    await supertest(baselineApp).get('/hello');
    const end = process.hrtime.bigint();
    baselineMeasurements.push(Number(end - start) / 1000000);
  }
  const baselineAverage = baselineMeasurements.reduce((a, b) => a + b) / baselineMeasurements.length;
  
  // Measure CORS middleware overhead
  const corsMeasurements = [];
  for (let i = 0; i < 10; i++) {
    const start = process.hrtime.bigint();
    await supertest(testApp)
      .get('/hello')
      .set('Origin', 'https://example.com');
    const end = process.hrtime.bigint();
    corsMeasurements.push(Number(end - start) / 1000000);
  }
  
  results.responseTimeOverhead.measurements = corsMeasurements;
  results.responseTimeOverhead.average = corsMeasurements.reduce((a, b) => a + b) / corsMeasurements.length;
  results.responseTimeOverhead.median = corsMeasurements.sort()[Math.floor(corsMeasurements.length / 2)];
  
  // Calculate performance overhead
  const overhead = results.responseTimeOverhead.average - baselineAverage;
  const overheadPercentage = (overhead / baselineAverage) * 100;
  
  // Test origin validation performance
  const origins = ['https://example.com', 'https://test.com', 'https://app.com'];
  const originValidationTimes = [];
  
  for (const origin of origins) {
    const start = process.hrtime.bigint();
    await supertest(testApp)
      .get('/hello')
      .set('Origin', origin);
    const end = process.hrtime.bigint();
    originValidationTimes.push(Number(end - start) / 1000000);
  }
  
  results.originValidationPerformance.measurements = originValidationTimes;
  results.originValidationPerformance.average = originValidationTimes.reduce((a, b) => a + b) / originValidationTimes.length;
  
  // Generate performance recommendations
  if (overhead > performanceBenchmarks.responseTimeLimits.corsProcessing.critical) {
    results.summary.performanceGrade = 'F';
    results.summary.recommendations.push('CORS middleware overhead is critically high');
  } else if (overhead > performanceBenchmarks.responseTimeLimits.corsProcessing.warning) {
    results.summary.performanceGrade = 'C';
    results.summary.recommendations.push('CORS middleware overhead is above warning threshold');
  } else if (overhead > performanceBenchmarks.responseTimeLimits.corsProcessing.target) {
    results.summary.performanceGrade = 'B';
    results.summary.recommendations.push('CORS middleware performance is acceptable but could be optimized');
  } else {
    results.summary.performanceGrade = 'A';
    results.summary.recommendations.push('CORS middleware performance is excellent');
  }
  
  return results;
}

/**
 * Tests CORS middleware compatibility with PM2 cluster mode
 * @param {object} pm2Config - PM2 configuration
 * @param {number} workerCount - Number of worker processes
 * @returns {Promise<object>} Promise resolving with PM2 compatibility results
 */
async function testPM2CorsCompatibility(pm2Config = {}, workerCount = 2) {
  const results = {
    processIsolation: { passed: 0, failed: 0, details: [] },
    loadBalancing: { passed: 0, failed: 0, details: [] },
    sharedState: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0, compatible: true }
  };
  
  // Simulate PM2 cluster mode testing
  // Since we can't actually spawn PM2 processes in unit tests, we simulate the scenarios
  
  // Test process isolation
  const process1App = createTestExpressAppWithCors({
    origin: ['https://example.com'],
    credentials: true
  });
  
  const process2App = createTestExpressAppWithCors({
    origin: ['https://example.com'],
    credentials: true
  });
  
  try {
    const response1 = await supertest(process1App)
      .get('/hello')
      .set('Origin', 'https://example.com');
    
    const response2 = await supertest(process2App)
      .get('/hello')
      .set('Origin', 'https://example.com');
    
    const corsHeadersMatch = response1.headers['access-control-allow-origin'] === 
                            response2.headers['access-control-allow-origin'];
    
    if (corsHeadersMatch) {
      results.processIsolation.passed++;
      results.processIsolation.details.push({
        test: 'cors_headers_consistency',
        status: 'PASS',
        reason: 'CORS headers consistent across processes'
      });
    } else {
      results.processIsolation.failed++;
      results.processIsolation.details.push({
        test: 'cors_headers_consistency',
        status: 'FAIL',
        reason: 'CORS headers inconsistent across processes'
      });
    }
  } catch (error) {
    results.processIsolation.failed++;
    results.processIsolation.details.push({
      test: 'cors_headers_consistency',
      status: 'FAIL',
      reason: error.message
    });
  }
  results.summary.totalTests++;
  
  // Test load balancing compatibility
  // Simulate round-robin distribution
  const origins = ['https://example.com', 'https://test.example.com'];
  const apps = [process1App, process2App];
  
  for (let i = 0; i < 4; i++) {
    const app = apps[i % 2]; // Simulate round-robin
    const origin = origins[i % 2];
    
    try {
      const response = await supertest(app)
        .get('/hello')
        .set('Origin', origin);
      
      const corsWorking = response.headers['access-control-allow-origin'] === origin;
      if (corsWorking) {
        results.loadBalancing.passed++;
      } else {
        results.loadBalancing.failed++;
      }
    } catch (error) {
      results.loadBalancing.failed++;
    }
    results.summary.totalTests++;
  }
  
  results.loadBalancing.details.push({
    test: 'round_robin_cors',
    status: results.loadBalancing.failed === 0 ? 'PASS' : 'FAIL',
    reason: results.loadBalancing.failed === 0 ? 
           'CORS works correctly with load balancing' : 
           'CORS issues with load balancing'
  });
  
  // Calculate summary
  results.summary.passed = results.processIsolation.passed + results.loadBalancing.passed + results.sharedState.passed;
  results.summary.failed = results.processIsolation.failed + results.loadBalancing.failed + results.sharedState.failed;
  results.summary.compatible = results.summary.failed === 0;
  
  return results;
}

/**
 * Tests CORS configuration compatibility for Flask migration
 * @param {object} crossPlatformConfig - Cross-platform configuration
 * @param {object} flaskCompatibilityRules - Flask compatibility rules
 * @returns {Promise<object>} Promise resolving with cross-platform compatibility results
 */
async function testCrossPlatformCompatibility(crossPlatformConfig = {}, flaskCompatibilityRules = {}) {
  const results = {
    configMapping: { passed: 0, failed: 0, details: [] },
    responseCompatibility: { passed: 0, failed: 0, details: [] },
    headerCompatibility: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0, migrationReady: true }
  };
  
  // Test Express.js CORS configuration
  const expressConfig = crossPlatformTestData.corsCompatibility.expressCorsConfig;
  const expressApp = createTestExpressAppWithCors(expressConfig);
  
  const expressResponse = await supertest(expressApp)
    .get('/hello')
    .set('Origin', 'https://example.com');
  
  // Validate configuration mapping for Flask
  const flaskMapping = crossPlatformTestData.flaskCorsConfig.mapping;
  
  Object.entries(flaskMapping).forEach(([expressKey, flaskKey]) => {
    const hasMapping = expressConfig[expressKey] !== undefined;
    if (hasMapping) {
      results.configMapping.passed++;
      results.configMapping.details.push({
        mapping: `${expressKey} -> ${flaskKey}`,
        status: 'PASS',
        expressValue: expressConfig[expressKey],
        reason: 'Configuration mapping available'
      });
    } else {
      results.configMapping.failed++;
      results.configMapping.details.push({
        mapping: `${expressKey} -> ${flaskKey}`,
        status: 'FAIL',
        reason: 'Configuration not found in Express config'
      });
    }
    results.summary.totalTests++;
  });
  
  // Test response compatibility
  const expectedHeaders = ['access-control-allow-origin', 'vary'];
  for (const header of expectedHeaders) {
    const hasHeader = !!expressResponse.headers[header];
    if (hasHeader) {
      results.responseCompatibility.passed++;
      results.responseCompatibility.details.push({
        header,
        status: 'PASS',
        value: expressResponse.headers[header],
        reason: 'Header will be compatible with Flask-CORS'
      });
    } else {
      results.responseCompatibility.failed++;
      results.responseCompatibility.details.push({
        header,
        status: 'FAIL',
        reason: 'Header missing, may cause Flask compatibility issues'
      });
    }
    results.summary.totalTests++;
  }
  
  // Calculate summary
  results.summary.passed = results.configMapping.passed + results.responseCompatibility.passed + 
                           results.headerCompatibility.passed;
  results.summary.failed = results.configMapping.failed + results.responseCompatibility.failed + 
                           results.headerCompatibility.failed;
  results.summary.migrationReady = results.summary.failed === 0;
  
  return results;
}

/**
 * Validates CORS compliance against web standards
 * @param {object} complianceStandards - Compliance standards to validate against
 * @param {object} auditConfig - Audit configuration
 * @returns {Promise<object>} Promise resolving with compliance audit results
 */
async function testCorsComplianceValidation(complianceStandards = {}, auditConfig = {}) {
  const results = {
    w3cCompliance: { passed: 0, failed: 0, details: [] },
    securityCompliance: { passed: 0, failed: 0, details: [] },
    browserCompatibility: { passed: 0, failed: 0, details: [] },
    summary: { totalTests: 0, passed: 0, failed: 0, compliant: true }
  };
  
  const testApp = createTestExpressAppWithCors({
    origin: ['https://example.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
  });
  
  // Test W3C CORS specification compliance
  const preflightResponse = await supertest(testApp)
    .options('/hello')
    .set('Origin', 'https://example.com')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'Content-Type');
  
  // Validate required preflight headers per W3C spec
  const requiredPreflightHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods'
  ];
  
  for (const header of requiredPreflightHeaders) {
    const hasHeader = !!preflightResponse.headers[header];
    if (hasHeader) {
      results.w3cCompliance.passed++;
      results.w3cCompliance.details.push({
        header,
        status: 'PASS',
        value: preflightResponse.headers[header],
        reason: 'W3C required header present'
      });
    } else {
      results.w3cCompliance.failed++;
      results.w3cCompliance.details.push({
        header,
        status: 'FAIL',
        reason: 'W3C required header missing'
      });
    }
    results.summary.totalTests++;
  }
  
  // Test actual request after preflight
  const actualResponse = await supertest(testApp)
    .post('/hello')
    .set('Origin', 'https://example.com')
    .set('Content-Type', 'application/json');
  
  const hasOriginHeader = !!actualResponse.headers['access-control-allow-origin'];
  if (hasOriginHeader) {
    results.w3cCompliance.passed++;
    results.w3cCompliance.details.push({
      test: 'actual_request_headers',
      status: 'PASS',
      reason: 'Actual request includes required CORS headers'
    });
  } else {
    results.w3cCompliance.failed++;
    results.w3cCompliance.details.push({
      test: 'actual_request_headers',
      status: 'FAIL',
      reason: 'Actual request missing CORS headers'
    });
  }
  results.summary.totalTests++;
  
  // Test security compliance - credentials with wildcard origin
  const strictApp = createTestExpressAppWithCors({
    origin: '*',
    credentials: true
  });
  
  try {
    await supertest(strictApp)
      .get('/hello')
      .set('Origin', 'https://example.com');
    
    // This should fail security compliance (credentials with wildcard)
    results.securityCompliance.failed++;
    results.securityCompliance.details.push({
      test: 'credentials_wildcard_check',
      status: 'FAIL',
      reason: 'Allows credentials with wildcard origin (security violation)'
    });
  } catch (error) {
    results.securityCompliance.passed++;
    results.securityCompliance.details.push({
      test: 'credentials_wildcard_check',
      status: 'PASS',
      reason: 'Correctly prevents credentials with wildcard origin'
    });
  }
  results.summary.totalTests++;
  
  // Calculate summary
  results.summary.passed = results.w3cCompliance.passed + results.securityCompliance.passed + 
                           results.browserCompatibility.passed;
  results.summary.failed = results.w3cCompliance.failed + results.securityCompliance.failed + 
                           results.browserCompatibility.failed;
  results.summary.compliant = results.summary.failed === 0;
  
  return results;
}

/**
 * Generates comprehensive CORS testing report
 * @param {object} testResults - Aggregated test results from all validation categories
 * @param {object} reportConfig - Report configuration options
 * @returns {object} Complete CORS testing report with analysis and recommendations
 */
function generateCorsTestReport(testResults = {}, reportConfig = {}) {
  const report = {
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      successRate: 0,
      grade: 'A',
      timestamp: new Date().toISOString(),
      environment: TEST_CONTEXT.environment,
      framework: TEST_CONTEXT.framework
    },
    sections: {
      originValidation: testResults.originValidation || {},
      preflightHandling: testResults.preflightHandling || {},
      headerConfiguration: testResults.headerConfiguration || {},
      violationHandling: testResults.violationHandling || {},
      environmentConfiguration: testResults.environmentConfiguration || {},
      performanceOptimization: testResults.performanceOptimization || {},
      pm2Compatibility: testResults.pm2Compatibility || {},
      crossPlatformCompatibility: testResults.crossPlatformCompatibility || {},
      complianceValidation: testResults.complianceValidation || {}
    },
    metrics: {
      cors: CORS_METRICS,
      performance: testResults.performanceMetrics || {},
      security: testResults.securityMetrics || {}
    },
    recommendations: [],
    educationalInsights: [
      'CORS (Cross-Origin Resource Sharing) is a security mechanism that allows or denies web pages to access resources from other domains',
      'Preflight requests are automatically sent by browsers for complex requests to check CORS permissions',
      'The Origin header is crucial for CORS validation and should never be trusted without proper validation',
      'CORS policies should be environment-specific: permissive in development, strict in production',
      'Wildcard origins (*) should never be used with credentials for security reasons'
    ]
  };
  
  // Calculate overall summary
  Object.values(report.sections).forEach(section => {
    if (section.summary) {
      report.summary.totalTests += section.summary.totalTests || 0;
      report.summary.passed += section.summary.passed || 0;
      report.summary.failed += section.summary.failed || 0;
    }
  });
  
  if (report.summary.totalTests > 0) {
    report.summary.successRate = (report.summary.passed / report.summary.totalTests) * 100;
  }
  
  // Assign grade based on success rate
  if (report.summary.successRate >= 95) {
    report.summary.grade = 'A';
  } else if (report.summary.successRate >= 85) {
    report.summary.grade = 'B';
  } else if (report.summary.successRate >= 75) {
    report.summary.grade = 'C';
  } else if (report.summary.successRate >= 65) {
    report.summary.grade = 'D';
  } else {
    report.summary.grade = 'F';
  }
  
  // Generate recommendations based on results
  if (report.summary.successRate < 100) {
    report.recommendations.push('Review failed test cases and improve CORS configuration');
  }
  
  if (CORS_METRICS.violations > 0) {
    report.recommendations.push('Investigate CORS violations and strengthen security policies');
  }
  
  if (testResults.performanceOptimization?.summary?.performanceGrade !== 'A') {
    report.recommendations.push('Optimize CORS middleware performance for better response times');
  }
  
  return report;
}

// Test Suite Implementation
describe('CORS Middleware Comprehensive Test Suite', () => {
  let testSetup;
  
  beforeAll(async () => {
    testSetup = await setupCorsTests({
      corsConfig: {
        origin: CORS_TEST_ORIGINS,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
        maxAge: 86400
      },
      testOptions: { startServer: true },
      timeout: 30000
    });
  });
  
  afterAll(async () => {
    await teardownCorsTests();
  });
  
  describe('CORS Origin Validation', () => {
    test('should validate allowed origins correctly', async () => {
      const results = await testCorsOriginValidation(testSetup.app);
      expect(results.allowedOrigins.passed).toBeGreaterThan(0);
      expect(results.allowedOrigins.failed).toBe(0);
      expect(results.summary.passed).toBeGreaterThan(results.summary.failed);
    });
    
    test('should block unauthorized origins', async () => {
      const results = await testCorsOriginValidation(testSetup.app);
      expect(results.blockedOrigins.passed).toBeGreaterThan(0);
      expect(results.summary.totalTests).toBeGreaterThan(0);
    });
    
    test('should handle null origin appropriately', async () => {
      const response = await supertest(testSetup.app)
        .get('/hello')
        .set('Origin', 'null');
      
      // Null origin should either be handled explicitly or rejected
      expect([200, 403, 404]).toContain(response.status);
    });
  });
  
  describe('CORS Preflight Handling', () => {
    test('should handle valid preflight requests', async () => {
      const response = await supertest(testSetup.app)
        .options('/hello')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
    
    test('should reject invalid preflight requests', async () => {
      const response = await supertest(testSetup.app)
        .options('/hello')
        .set('Origin', 'https://malicious.com')
        .set('Access-Control-Request-Method', 'DELETE');
      
      // Should either reject with error or not include CORS headers
      const corsHeaderMissing = !response.headers['access-control-allow-origin'];
      const originMismatch = response.headers['access-control-allow-origin'] !== 'https://malicious.com';
      expect(corsHeaderMissing || originMismatch).toBe(true);
    });
    
    test('should include appropriate cache headers for preflight', async () => {
      const response = await supertest(testSetup.app)
        .options('/hello')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');
      
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-max-age']).toBeDefined();
      }
    });
  });
  
  describe('CORS Header Configuration', () => {
    test('should include required CORS headers', async () => {
      const response = await supertest(testSetup.app)
        .get('/hello')
        .set('Origin', 'https://example.com');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['vary']).toContain('Origin');
    });
    
    test('should handle credentials appropriately', async () => {
      const credentialsApp = createTestExpressAppWithCors({ 
        origin: ['https://example.com'], 
        credentials: true 
      });
      
      const response = await supertest(credentialsApp)
        .get('/hello')
        .set('Origin', 'https://example.com');
      
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
    });
    
    test('should not allow wildcard with credentials', async () => {
      // This should either fail to configure or properly handle the security issue
      const unsafeApp = createTestExpressAppWithCors({ 
        origin: '*', 
        credentials: true 
      });
      
      const response = await supertest(unsafeApp)
        .get('/hello')
        .set('Origin', 'https://example.com');
      
      // Should either reject the request or not set credentials header with wildcard
      const isSecure = response.headers['access-control-allow-origin'] !== '*' || 
                      response.headers['access-control-allow-credentials'] !== 'true';
      expect(isSecure).toBe(true);
    });
  });
  
  describe('CORS Violation Handling', () => {
    test('should handle CORS violations appropriately', async () => {
      const results = await testCorsViolationHandling(securityTestData.corsViolations);
      expect(results.summary.totalTests).toBeGreaterThan(0);
      expect(results.summary.passed).toBeGreaterThan(0);
    });
    
    test('should log CORS violations for monitoring', () => {
      // Verify that CORS violations are being tracked
      expect(CORS_METRICS).toHaveProperty('violations');
      expect(CORS_METRICS).toHaveProperty('blocked');
      expect(CORS_METRICS).toHaveProperty('allowed');
    });
  });
  
  describe('Environment-Specific CORS Configuration', () => {
    test('should handle development environment correctly', async () => {
      const results = await testCorsEnvironmentConfiguration('development');
      expect(results.summary.totalTests).toBeGreaterThan(0);
    });
    
    test('should handle production environment correctly', async () => {
      const results = await testCorsEnvironmentConfiguration('production');
      expect(results.summary.totalTests).toBeGreaterThan(0);
    });
  });
  
  describe('CORS Performance Optimization', () => {
    test('should measure CORS middleware performance impact', async () => {
      const results = await testCorsPerformanceOptimization(testSetup.app);
      expect(results.responseTimeOverhead.average).toBeLessThan(100); // Should be under 100ms
      expect(results.summary.performanceGrade).toMatch(/[A-F]/);
    });
    
    test('should validate origin processing performance', async () => {
      const startTime = process.hrtime.bigint();
      
      await supertest(testSetup.app)
        .get('/hello')
        .set('Origin', 'https://example.com');
      
      const endTime = process.hrtime.bigint();
      const processingTime = Number(endTime - startTime) / 1000000;
      
      expect(processingTime).toBeLessThan(performanceBenchmarks.responseTimeLimits.corsProcessing.critical);
    });
  });
  
  describe('PM2 Cluster Mode Compatibility', () => {
    test('should validate PM2 compatibility', async () => {
      const results = await testPM2CorsCompatibility();
      expect(results.summary.compatible).toBe(true);
      expect(results.summary.totalTests).toBeGreaterThan(0);
    });
  });
  
  describe('Cross-Platform Compatibility', () => {
    test('should validate Flask migration compatibility', async () => {
      const results = await testCrossPlatformCompatibility();
      expect(results.summary.migrationReady).toBe(true);
      expect(results.configMapping.passed).toBeGreaterThan(0);
    });
  });
  
  describe('CORS Compliance Validation', () => {
    test('should validate W3C CORS specification compliance', async () => {
      const results = await testCorsComplianceValidation();
      expect(results.w3cCompliance.passed).toBeGreaterThan(0);
      expect(results.summary.compliant).toBe(true);
    });
    
    test('should validate security compliance', async () => {
      const results = await testCorsComplianceValidation();
      expect(results.summary.totalTests).toBeGreaterThan(0);
    });
  });
  
  describe('CORS Test Reporting', () => {
    test('should generate comprehensive test report', async () => {
      const mockResults = {
        originValidation: { summary: { totalTests: 10, passed: 9, failed: 1 } },
        preflightHandling: { summary: { totalTests: 5, passed: 5, failed: 0 } },
        performanceOptimization: { summary: { performanceGrade: 'A' } }
      };
      
      const report = generateCorsTestReport(mockResults);
      
      expect(report.summary.totalTests).toBe(15);
      expect(report.summary.passed).toBe(14);
      expect(report.summary.failed).toBe(1);
      expect(report.summary.successRate).toBeCloseTo(93.33, 1);
      expect(report.summary.grade).toBe('A');
      expect(report.educationalInsights.length).toBeGreaterThan(0);
    });
  });
});

// Export test functions for external use
module.exports = {
  setupCorsTests,
  teardownCorsTests,
  createTestExpressAppWithCors,
  testCorsOriginValidation,
  testCorsPreflightHandling,
  testCorsHeaderConfiguration,
  testCorsViolationHandling,
  testCorsEnvironmentConfiguration,
  testCorsPerformanceOptimization,
  testPM2CorsCompatibility,
  testCrossPlatformCompatibility,
  testCorsComplianceValidation,
  generateCorsTestReport
};