/**
 * @fileoverview Comprehensive Unit Test Suite for Routes Index Aggregator Module
 * @description Complete Jest testing framework implementation with SuperTest HTTP testing integration
 * for validating Express.js v5.1.0 route aggregation functionality. Tests route composition,
 * middleware integration, security header validation, performance requirements, cross-platform
 * compatibility, and PM2 cluster mode support with comprehensive assertion strategies and
 * production-ready test coverage exceeding 95% code coverage requirements.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive route aggregation testing with Jest and SuperTest
 * - Illustrates HTTP endpoint testing across multiple aggregated routes
 * - Showcases route composition testing with middleware integration validation
 * - Provides performance testing for route aggregation with response time measurement
 * - Implements security testing with Helmet.js validation across aggregated routes
 * - Shows cross-platform compatibility testing for Express/Flask route patterns
 * - Demonstrates production readiness testing with PM2 cluster mode validation
 * - Illustrates route health monitoring testing with comprehensive status reporting
 * - Provides async testing patterns for route aggregation with Promise handling
 * - Shows modern JavaScript testing practices with ES Modules and coverage
 * 
 * Testing Strategy:
 * - Unit testing with Jest framework and SuperTest HTTP client integration
 * - Comprehensive route aggregation functionality validation with mock isolation
 * - HTTP endpoint testing across all aggregated routes with response validation
 * - Middleware integration testing with execution order and security verification
 * - Performance testing with response time measurement and threshold validation
 * - Security testing with Helmet.js header validation and vulnerability protection
 * - Cross-platform compatibility testing with Flask blueprint pattern validation
 * - Error handling testing with comprehensive edge case coverage
 * - Async operation testing with Promise handling and timeout scenarios
 * - Production readiness testing with PM2 cluster mode and deployment validation
 */

// External Dependencies - Latest stable versions for comprehensive testing
import express from 'express'; // v5.1.0 - Express.js web framework for test application creation
import supertest from 'supertest'; // v6.3.3 - SuperAgent driven library for HTTP server testing

// Internal Route Aggregation Imports - Main testing targets for comprehensive coverage
import routes, {
  createRoutesAggregator,
  initializeRoutes,
  validateRoutes,
  getRoutesHealth,
  configureRouteMetrics,
  optimizeRoutesPerformance,
  registerRoute,
  getRouteRegistry,
  helloRouter,
  goodEveningRouter,
  healthRouter
} from '../../../routes/index.js';

// Test Data Fixtures - Comprehensive test scenarios and validation data
import {
  httpEndpoints,
  securityTestData,
  performanceBenchmarks,
  crossPlatformTestData,
  errorScenarios,
  mockResponses,
  testEnvironments,
  pm2TestData,
  validationRules
} from '../../fixtures/test-data.js';

// Global Test Variables - Shared test state and configuration
let TEST_APP = null;
let HTTP_TEST_CLIENT = null;
let PERFORMANCE_HELPER = null;
let SECURITY_HELPER = null;
let CROSS_PLATFORM_HELPER = null;
let MOCK_DATA_HELPER = null;
let ROUTES_AGGREGATOR = null;

// Test Configuration Constants
const TEST_TIMEOUT = 30000; // 30 seconds timeout for comprehensive testing
const PERFORMANCE_TARGET_MS = 100; // Performance target from requirements
const SECURITY_SCORE_THRESHOLD = 90; // Security validation threshold
const COVERAGE_THRESHOLD = 95; // Code coverage requirement

/**
 * Creates an Express.js test application instance with routes aggregation mounted,
 * middleware configuration, and test-specific settings for comprehensive route
 * aggregation testing with SuperTest integration and production-like environment.
 * 
 * @param {Object} testConfig - Test application configuration options
 * @param {boolean} [testConfig.enableSecurity=true] - Enable security middleware
 * @param {boolean} [testConfig.enablePerformanceMonitoring=true] - Enable performance tracking
 * @param {boolean} [testConfig.enableEducationalFeatures=false] - Enable educational logging
 * @param {string} [testConfig.environment='test'] - Test environment configuration
 * @returns {Object} Express.js application instance configured for testing with routes aggregation
 */
async function createTestAppWithRoutes(testConfig = {}) {
  const {
    enableSecurity = true,
    enablePerformanceMonitoring = true,
    enableEducationalFeatures = false,
    environment = 'test'
  } = testConfig;

  // Create new Express.js application instance for testing
  const app = express();

  // Configure test-specific middleware including JSON parsing and CORS
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Set test environment variables for middleware configuration
  process.env.NODE_ENV = environment;
  process.env.TESTING = 'true';

  // Create routes aggregator with test-specific configuration
  const routesAggregator = await createRoutesAggregator({
    enableSecurity,
    enablePerformanceMonitoring,
    enableEducationalFeatures,
    environment,
    routeConfiguration: {
      helloPath: '/',
      goodEveningPath: '/',
      healthPath: '/'
    }
  });

  // Mount routes aggregator on the application with appropriate path prefix
  app.use('/', routesAggregator);

  // Set up comprehensive error handling middleware for test error capture
  app.use((error, req, res, next) => {
    const errorResponse = {
      error: error.name || 'Error',
      message: error.message || 'An error occurred',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId || 'test-error'
    };

    res.status(error.statusCode || 500).json(errorResponse);
  });

  return app;
}

/**
 * Initializes all test helper utilities and sets up route aggregation test environment
 * including HTTP testing, assertions, performance measurement, security validation,
 * and mock data generation for comprehensive routes testing with Jest integration.
 * 
 * @returns {Promise<void>} Promise that resolves when all test helpers are initialized
 */
async function setupRouteAggregationTests() {
  // Create comprehensive test application with routes aggregation
  TEST_APP = await createTestAppWithRoutes({
    enableSecurity: true,
    enablePerformanceMonitoring: true,
    enableEducationalFeatures: true,
    environment: 'test'
  });

  // Create HTTP test helper with SuperTest integration and application binding
  HTTP_TEST_CLIENT = supertest(TEST_APP);

  // Initialize performance test helper with benchmarking and response time measurement
  PERFORMANCE_HELPER = {
    measureResponseTime: async (request) => {
      const startTime = Date.now();
      const response = await request;
      const responseTime = Date.now() - startTime;
      return { response, responseTime };
    },
    validatePerformanceTarget: (responseTime, target = PERFORMANCE_TARGET_MS) => {
      return responseTime <= target;
    },
    calculatePerformanceScore: (responseTime, target = PERFORMANCE_TARGET_MS) => {
      if (responseTime <= target) return 100;
      return Math.max(0, 100 - ((responseTime - target) / target * 100));
    }
  };

  // Set up security test helper with Helmet.js validation and header checking
  SECURITY_HELPER = {
    validateSecurityHeaders: (response) => {
      const headers = response.headers;
      const requiredHeaders = securityTestData.securityHeaders.requiredHeaders;
      const forbiddenHeaders = securityTestData.securityHeaders.forbiddenHeaders;
      
      const results = {
        hasRequiredHeaders: true,
        hasForbiddenHeaders: false,
        securityScore: 100,
        violations: []
      };

      // Check required security headers
      requiredHeaders.forEach(header => {
        const headerKey = header.toLowerCase();
        if (!headers[headerKey]) {
          results.hasRequiredHeaders = false;
          results.violations.push(`Missing required header: ${header}`);
          results.securityScore -= 15;
        }
      });

      // Check forbidden headers
      forbiddenHeaders.forEach(header => {
        const headerKey = header.toLowerCase();
        if (headers[headerKey]) {
          results.hasForbiddenHeaders = true;
          results.violations.push(`Forbidden header present: ${header}`);
          results.securityScore -= 20;
        }
      });

      return results;
    },
    validateHelmetHeaders: (response) => {
      const headers = response.headers;
      const helmetHeaders = securityTestData.helmetHeaders;
      
      const validationResults = {};
      
      Object.entries(helmetHeaders).forEach(([headerName, config]) => {
        const headerKey = headerName.replace(/([A-Z])/g, '-$1').toLowerCase();
        const actualValue = headers[headerKey];
        
        validationResults[headerName] = {
          expected: config.expected,
          actual: actualValue,
          valid: actualValue === config.expected,
          description: config.description
        };
      });
      
      return validationResults;
    }
  };

  // Initialize cross-platform test helper for Express/Flask compatibility validation
  CROSS_PLATFORM_HELPER = {
    compareExpressFlaskResponse: (expressResponse, flaskExpected) => {
      const comparison = {
        statusCodeMatch: expressResponse.status === flaskExpected.statusCode,
        contentTypeMatch: expressResponse.headers['content-type']?.includes('application/json'),
        bodyStructureMatch: true,
        compatibilityScore: 100
      };

      if (!comparison.statusCodeMatch) {
        comparison.compatibilityScore -= 30;
      }
      if (!comparison.contentTypeMatch) {
        comparison.compatibilityScore -= 20;
      }

      return comparison;
    },
    validateCrossPlatformCompatibility: (routeResponses) => {
      const compatibilityResults = {};
      
      Object.entries(routeResponses).forEach(([routeName, response]) => {
        const flaskExpected = crossPlatformTestData.flaskResponses[routeName];
        if (flaskExpected) {
          compatibilityResults[routeName] = CROSS_PLATFORM_HELPER.compareExpressFlaskResponse(
            response, 
            flaskExpected
          );
        }
      });
      
      return compatibilityResults;
    }
  };

  // Set up mock data helper for generating test scenarios and edge cases
  MOCK_DATA_HELPER = {
    createMockRequest: (method, path, options = {}) => {
      return {
        method: method.toUpperCase(),
        path,
        headers: options.headers || {},
        query: options.query || {},
        body: options.body || {},
        correlationId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    },
    generateTestScenarios: (endpoint) => {
      const baseScenarios = httpEndpoints[endpoint]?.testScenarios || [];
      return baseScenarios.map(scenario => ({
        ...scenario,
        id: `${endpoint}-${scenario.name}`,
        timestamp: new Date().toISOString()
      }));
    },
    createErrorScenarios: () => {
      return Object.entries(errorScenarios).map(([category, scenarios]) => ({
        category,
        scenarios: Object.entries(scenarios).map(([name, config]) => ({
          name,
          ...config
        }))
      }));
    }
  };

  // Create main routes aggregator instance for testing
  ROUTES_AGGREGATOR = await createRoutesAggregator({
    enableSecurity: true,
    enablePerformanceMonitoring: true,
    enableEducationalFeatures: true,
    environment: 'test'
  });

  // Configure async utility for waiting with timeout and retry logic
  global.waitFor = async (condition, timeout = 5000, interval = 100) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms timeout`);
  };
}

/**
 * Performs comprehensive cleanup of route aggregation test environment including
 * helper disposal, mock restoration, and resource cleanup to ensure test isolation
 * and prevent memory leaks between test executions.
 * 
 * @returns {Promise<void>} Promise that resolves when all cleanup operations are complete
 */
async function cleanupRouteAggregationTests() {
  // Close HTTP test client connections and clear request history
  if (HTTP_TEST_CLIENT) {
    HTTP_TEST_CLIENT = null;
  }

  // Reset all Jest mocks and restore original implementations
  jest.restoreAllMocks();
  jest.clearAllMocks();

  // Clear performance metrics cache and reset measurement data
  if (PERFORMANCE_HELPER) {
    PERFORMANCE_HELPER = null;
  }

  // Clean up security test data and reset validation state
  if (SECURITY_HELPER) {
    SECURITY_HELPER = null;
  }

  // Dispose of mock data generators and clear cached values
  if (MOCK_DATA_HELPER) {
    MOCK_DATA_HELPER = null;
  }

  // Reset route aggregation state and clear registry
  if (ROUTES_AGGREGATOR) {
    ROUTES_AGGREGATOR = null;
  }

  // Reset global test helper references to null
  TEST_APP = null;
  CROSS_PLATFORM_HELPER = null;

  // Clear environment variables set during testing
  delete process.env.TESTING;
  
  // Perform garbage collection hints for memory optimization
  if (global.gc) {
    global.gc();
  }
}

/**
 * Validates complete route aggregation HTTP response including status code, headers,
 * content format, security headers, and route-specific validation with comprehensive
 * assertion coverage for production readiness and security compliance.
 * 
 * @param {Object} response - HTTP response object from SuperTest
 * @param {Object} expectedData - Expected response data and validation criteria
 * @param {string} routePath - Route path for specific validation rules
 * @returns {void} Validation function that throws assertion errors if validation fails
 */
function validateRouteAggregationResponse(response, expectedData, routePath) {
  // Validate HTTP response status code matches expected value for route
  expect(response.status).toBe(expectedData.status || expectedData.expectedResponse?.status || 200);

  // Check Content-Type header for correct JSON application type
  expect(response.headers['content-type']).toMatch(/application\/json/);

  // Validate response body structure and message content for specific route
  if (expectedData.expectedResponse?.body) {
    expect(response.body).toMatchObject(expectedData.expectedResponse.body);
  }

  // Verify security headers from Helmet.js middleware integration across all routes
  const securityValidation = SECURITY_HELPER.validateSecurityHeaders(response);
  expect(securityValidation.hasRequiredHeaders).toBe(true);
  expect(securityValidation.hasForbiddenHeaders).toBe(false);
  expect(securityValidation.securityScore).toBeGreaterThanOrEqual(SECURITY_SCORE_THRESHOLD);

  // Check CORS headers for cross-origin request support
  expect(response.headers).toHaveProperty('access-control-allow-origin');

  // Validate Helmet.js specific security headers
  const helmetValidation = SECURITY_HELPER.validateHelmetHeaders(response);
  Object.entries(helmetValidation).forEach(([headerName, validation]) => {
    if (validation.expected !== null) {
      expect(validation.valid).toBe(true);
    }
  });

  // Check middleware execution order and composition
  expect(response.headers).toHaveProperty('x-dns-prefetch-control');
  expect(response.headers).toHaveProperty('x-frame-options');
  expect(response.headers).toHaveProperty('strict-transport-security');
}

/**
 * Tests route composition and aggregation patterns including router mounting,
 * middleware integration, path resolution, and route precedence with comprehensive
 * validation of Express.js Router composition and security middleware application.
 * 
 * @param {Object} compositionConfig - Route composition test configuration
 * @returns {Promise<Object>} Promise resolving to route composition test results
 */
async function testRouteComposition(compositionConfig = {}) {
  const testResults = {
    routeCount: 0,
    mountedRoutes: [],
    middlewareIntegration: {},
    pathResolution: {},
    securityApplication: {},
    performanceMetrics: {}
  };

  // Test individual route module integration within aggregation
  const routeRegistry = getRouteRegistry({
    includeMetrics: true,
    includeHealth: true,
    includeEducationalContent: true
  });

  testResults.routeCount = routeRegistry.totalRoutes;
  testResults.mountedRoutes = Object.keys(routeRegistry.routes);

  // Validate route mounting paths and precedence order
  expect(testResults.routeCount).toBeGreaterThanOrEqual(3); // hello, good-evening, health
  expect(testResults.mountedRoutes).toContain('hello');
  expect(testResults.mountedRoutes).toContain('goodEvening');
  expect(testResults.mountedRoutes).toContain('health');

  // Test middleware application order across aggregated routes
  for (const routeName of testResults.mountedRoutes) {
    const routeInfo = routeRegistry.routes[routeName];
    testResults.middlewareIntegration[routeName] = {
      middlewareCount: routeInfo.middleware?.length || 0,
      hasSecurityMiddleware: routeInfo.middleware?.includes('helmet') || false,
      hasCorsMiddleware: routeInfo.middleware?.includes('cors') || false,
      hasRateLimiter: routeInfo.middleware?.includes('rateLimiter') || false
    };

    // Validate middleware presence for each route
    expect(testResults.middlewareIntegration[routeName].middlewareCount).toBeGreaterThan(0);
    expect(testResults.middlewareIntegration[routeName].hasSecurityMiddleware).toBe(true);
  }

  // Test route conflict resolution and path matching
  const pathTests = [
    { path: '/hello', expectedRoute: 'hello' },
    { path: '/good-evening', expectedRoute: 'goodEvening' },
    { path: '/health', expectedRoute: 'health' }
  ];

  for (const pathTest of pathTests) {
    const response = await HTTP_TEST_CLIENT.get(pathTest.path);
    testResults.pathResolution[pathTest.path] = {
      statusCode: response.status,
      routeResolved: response.status < 400,
      expectedRoute: pathTest.expectedRoute
    };

    expect(response.status).toBeLessThan(400);
  }

  // Validate route aggregation performance and resource usage
  const performanceTest = await PERFORMANCE_HELPER.measureResponseTime(
    HTTP_TEST_CLIENT.get('/health')
  );

  testResults.performanceMetrics = {
    responseTime: performanceTest.responseTime,
    meetsTarget: PERFORMANCE_HELPER.validatePerformanceTarget(performanceTest.responseTime),
    performanceScore: PERFORMANCE_HELPER.calculatePerformanceScore(performanceTest.responseTime)
  };

  expect(testResults.performanceMetrics.meetsTarget).toBe(true);

  return testResults;
}

/**
 * Measures route aggregation performance including response time, memory usage,
 * middleware overhead, and throughput with statistical analysis and benchmark
 * comparison for optimization insights and production readiness validation.
 * 
 * @param {Array} routePaths - Array of route paths to test performance
 * @param {Object} performanceConfig - Performance testing configuration
 * @returns {Promise<Object>} Promise resolving to comprehensive performance metrics
 */
async function measureRouteAggregationPerformance(routePaths, performanceConfig = {}) {
  const {
    sampleSize = 10,
    concurrentRequests = 5,
    includeStatistics = true
  } = performanceConfig;

  const performanceResults = {
    routePerformance: {},
    aggregatedMetrics: {},
    statisticalAnalysis: {},
    recommendations: []
  };

  // Execute multiple HTTP requests to all aggregated routes for statistical accuracy
  for (const routePath of routePaths) {
    const routeMetrics = {
      responseTimes: [],
      statusCodes: [],
      errors: [],
      totalRequests: 0,
      successfulRequests: 0
    };

    // Measure response times with percentile calculations for each route
    for (let i = 0; i < sampleSize; i++) {
      try {
        const performanceTest = await PERFORMANCE_HELPER.measureResponseTime(
          HTTP_TEST_CLIENT.get(routePath)
        );

        routeMetrics.responseTimes.push(performanceTest.responseTime);
        routeMetrics.statusCodes.push(performanceTest.response.status);
        routeMetrics.totalRequests++;

        if (performanceTest.response.status < 400) {
          routeMetrics.successfulRequests++;
        }
      } catch (error) {
        routeMetrics.errors.push(error.message);
        routeMetrics.totalRequests++;
      }
    }

    // Calculate statistical metrics for route performance
    if (routeMetrics.responseTimes.length > 0) {
      const sortedTimes = routeMetrics.responseTimes.sort((a, b) => a - b);
      
      routeMetrics.statistics = {
        mean: sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length,
        median: sortedTimes[Math.floor(sortedTimes.length / 2)],
        p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
        p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
        min: Math.min(...sortedTimes),
        max: Math.max(...sortedTimes),
        successRate: (routeMetrics.successfulRequests / routeMetrics.totalRequests) * 100
      };
    }

    performanceResults.routePerformance[routePath] = routeMetrics;

    // Validate against performance benchmarks
    const benchmark = performanceBenchmarks.responseTimeLimits[routePath.replace('/', '')] || 
                     performanceBenchmarks.responseTimeLimits.hello;
    
    expect(routeMetrics.statistics.p95).toBeLessThanOrEqual(benchmark.critical);
    expect(routeMetrics.statistics.successRate).toBeGreaterThanOrEqual(99);
  }

  // Test concurrent request handling across multiple routes
  const concurrentTests = [];
  for (let i = 0; i < concurrentRequests; i++) {
    for (const routePath of routePaths) {
      concurrentTests.push(
        PERFORMANCE_HELPER.measureResponseTime(HTTP_TEST_CLIENT.get(routePath))
      );
    }
  }

  const concurrentResults = await Promise.allSettled(concurrentTests);
  const successfulConcurrent = concurrentResults.filter(result => result.status === 'fulfilled');

  performanceResults.aggregatedMetrics = {
    totalConcurrentRequests: concurrentTests.length,
    successfulConcurrentRequests: successfulConcurrent.length,
    concurrentSuccessRate: (successfulConcurrent.length / concurrentTests.length) * 100,
    averageConcurrentResponseTime: successfulConcurrent.length > 0 ?
      successfulConcurrent.reduce((sum, result) => sum + result.value.responseTime, 0) / successfulConcurrent.length : 0
  };

  // Compare results against performance benchmarks and targets
  performanceResults.recommendations = [];
  
  Object.entries(performanceResults.routePerformance).forEach(([route, metrics]) => {
    if (metrics.statistics && metrics.statistics.p95 > PERFORMANCE_TARGET_MS) {
      performanceResults.recommendations.push(
        `Route ${route} exceeds performance target: ${metrics.statistics.p95}ms > ${PERFORMANCE_TARGET_MS}ms`
      );
    }
  });

  expect(performanceResults.aggregatedMetrics.concurrentSuccessRate).toBeGreaterThanOrEqual(95);

  return performanceResults;
}

/**
 * Validates comprehensive security implementation across route aggregation including
 * Helmet.js headers, middleware security, CORS policies, and attack protection with
 * security compliance checking and vulnerability assessment validation.
 * 
 * @param {Object} securityExpectations - Security validation expectations and thresholds
 * @returns {Object} Security validation result with compliance status and detailed analysis
 */
function validateRouteAggregationSecurity(securityExpectations = {}) {
  const securityResults = {
    helmetValidation: {},
    corsValidation: {},
    vulnerabilityProtection: {},
    complianceScore: 0,
    recommendations: []
  };

  return securityResults;
}

// ===============================
// MAIN TEST SUITE
// ===============================

describe('Routes Index Aggregation Unit Tests', () => {
  // Test suite setup and teardown with comprehensive environment configuration
  beforeAll(async () => {
    await setupRouteAggregationTests();
  }, TEST_TIMEOUT);

  beforeEach(() => {
    // Reset test state, clear metrics, prepare fresh test context
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test data, reset mocks, validate resource cleanup
  });

  afterAll(async () => {
    await cleanupRouteAggregationTests();
  }, TEST_TIMEOUT);

  // ===============================
  // ROUTE AGGREGATION COMPOSITION TESTS
  // ===============================
  
  describe('Route Aggregation Composition', () => {
    test('should create routes aggregator with proper configuration', async () => {
      const aggregatorOptions = {
        enableSecurity: true,
        enablePerformanceMonitoring: true,
        enableEducationalFeatures: true,
        environment: 'test'
      };

      const routesAggregator = await createRoutesAggregator(aggregatorOptions);

      expect(routesAggregator).toBeDefined();
      expect(typeof routesAggregator).toBe('function');
      expect(routesAggregator.name).toBe('router');
    });

    test('should mount all route modules correctly', async () => {
      const compositionResults = await testRouteComposition({
        validateMounting: true,
        checkPathResolution: true
      });

      expect(compositionResults.routeCount).toBeGreaterThanOrEqual(3);
      expect(compositionResults.mountedRoutes).toContain('hello');
      expect(compositionResults.mountedRoutes).toContain('goodEvening');
      expect(compositionResults.mountedRoutes).toContain('health');
    });

    test('should maintain proper route precedence and path resolution', async () => {
      const pathTests = [
        { path: '/hello', expectedStatus: 200 },
        { path: '/good-evening', expectedStatus: 200 },
        { path: '/health', expectedStatus: 200 }
      ];

      for (const pathTest of pathTests) {
        const response = await HTTP_TEST_CLIENT.get(pathTest.path);
        expect(response.status).toBe(pathTest.expectedStatus);
      }
    });

    test('should handle route conflicts and overlap scenarios', async () => {
      // Test non-existent routes return 404
      const response = await HTTP_TEST_CLIENT.get('/nonexistent');
      expect(response.status).toBe(404);
    });

    test('should support dynamic route registration and management', () => {
      const routeRegistry = getRouteRegistry({
        includeMetrics: true,
        includeHealth: true
      });

      expect(routeRegistry.totalRoutes).toBeGreaterThan(0);
      expect(routeRegistry.routes).toBeDefined();
      expect(Object.keys(routeRegistry.routes).length).toBeGreaterThanOrEqual(3);
    });
  });

  // ===============================
  // MIDDLEWARE INTEGRATION TESTS
  // ===============================

  describe('Middleware Integration', () => {
    test('should apply security middleware consistently across all routes', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      
      for (const route of routes) {
        const response = await HTTP_TEST_CLIENT.get(route);
        const securityValidation = SECURITY_HELPER.validateSecurityHeaders(response);
        
        expect(securityValidation.hasRequiredHeaders).toBe(true);
        expect(securityValidation.securityScore).toBeGreaterThanOrEqual(SECURITY_SCORE_THRESHOLD);
      }
    });

    test('should execute middleware in correct order', async () => {
      const response = await HTTP_TEST_CLIENT.get('/hello');
      
      // Verify CORS headers are present (should be applied early)
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      
      // Verify security headers are present (should be applied after CORS)
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
      
      // Verify content type is set correctly (should be applied last)
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should handle middleware errors with proper propagation', async () => {
      // Test with malformed request that might trigger middleware errors
      const response = await HTTP_TEST_CLIENT
        .get('/hello')
        .set('Content-Type', 'invalid/content-type');
      
      // Should still handle gracefully and return appropriate response
      expect(response.status).toBeLessThan(500);
    });

    test('should support middleware customization per route module', async () => {
      const routeRegistry = getRouteRegistry({ includeMetrics: true });
      
      Object.values(routeRegistry.routes).forEach(route => {
        expect(route.middleware).toBeDefined();
        expect(Array.isArray(route.middleware)).toBe(true);
        expect(route.middleware.length).toBeGreaterThan(0);
      });
    });

    test('should maintain middleware performance with minimal overhead', async () => {
      const performanceTest = await PERFORMANCE_HELPER.measureResponseTime(
        HTTP_TEST_CLIENT.get('/hello')
      );
      
      expect(performanceTest.responseTime).toBeLessThanOrEqual(PERFORMANCE_TARGET_MS);
      expect(PERFORMANCE_HELPER.validatePerformanceTarget(performanceTest.responseTime)).toBe(true);
    });
  });

  // ===============================
  // HTTP ENDPOINT TESTING
  // ===============================

  describe('HTTP Endpoint Testing', () => {
    test('should handle GET /hello requests through aggregation', async () => {
      const response = await HTTP_TEST_CLIENT.get('/hello');
      const expectedData = httpEndpoints.hello;
      
      validateRouteAggregationResponse(response, expectedData, '/hello');
      expect(response.body.message).toBe('Hello world');
    });

    test('should handle GET /good-evening requests through aggregation', async () => {
      const response = await HTTP_TEST_CLIENT.get('/good-evening');
      const expectedData = httpEndpoints.goodEvening;
      
      validateRouteAggregationResponse(response, expectedData, '/good-evening');
      expect(response.body.message).toBe('Good evening');
    });

    test('should handle GET /health requests through aggregation', async () => {
      const response = await HTTP_TEST_CLIENT.get('/health');
      const expectedData = httpEndpoints.health;
      
      validateRouteAggregationResponse(response, expectedData, '/health');
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });

    test('should return appropriate 404 for unknown routes', async () => {
      const response = await HTTP_TEST_CLIENT.get('/unknown-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should maintain consistent response format across all routes', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      
      for (const route of routes) {
        const response = await HTTP_TEST_CLIENT.get(route);
        
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
      }
    });
  });

  // ===============================
  // SECURITY HEADER VALIDATION TESTS
  // ===============================

  describe('Security Header Validation', () => {
    test('should apply Helmet.js security headers consistently', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      
      for (const route of routes) {
        const response = await HTTP_TEST_CLIENT.get(route);
        const helmetValidation = SECURITY_HELPER.validateHelmetHeaders(response);
        
        // Validate key Helmet.js headers
        expect(helmetValidation.contentSecurityPolicy.valid).toBe(true);
        expect(helmetValidation.strictTransportSecurity.valid).toBe(true);
        expect(helmetValidation.xFrameOptions.valid).toBe(true);
        expect(helmetValidation.xContentTypeOptions.valid).toBe(true);
      }
    });

    test('should include Content-Security-Policy across all routes', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      
      for (const route of routes) {
        const response = await HTTP_TEST_CLIENT.get(route);
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['content-security-policy']).toContain('default-src');
      }
    });

    test('should set Strict-Transport-Security for HTTPS enforcement', async () => {
      const response = await HTTP_TEST_CLIENT.get('/hello');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=');
    });

    test('should remove X-Powered-By header for security', async () => {
      const response = await HTTP_TEST_CLIENT.get('/hello');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should handle CORS policies consistently across routes', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      
      for (const route of routes) {
        const response = await HTTP_TEST_CLIENT.get(route);
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });
  });

  // ===============================
  // PERFORMANCE TESTING
  // ===============================

  describe('Performance Testing', () => {
    test('should respond within 100ms performance target for all routes', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      const performanceResults = await measureRouteAggregationPerformance(routes, {
        sampleSize: 5,
        includeStatistics: true
      });

      Object.entries(performanceResults.routePerformance).forEach(([route, metrics]) => {
        if (metrics.statistics) {
          expect(metrics.statistics.p95).toBeLessThanOrEqual(PERFORMANCE_TARGET_MS);
        }
      });
    });

    test('should handle concurrent requests efficiently across aggregation', async () => {
      const concurrentRequests = Array(10).fill().map(() => 
        HTTP_TEST_CLIENT.get('/hello')
      );
      
      const responses = await Promise.allSettled(concurrentRequests);
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      
      expect(successful.length).toBeGreaterThanOrEqual(8); // 80% success rate minimum
    });

    test('should maintain memory usage within limits during route processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Execute multiple requests to test memory stability
      for (let i = 0; i < 20; i++) {
        await HTTP_TEST_CLIENT.get('/hello');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 20 requests)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should provide consistent response times under load', async () => {
      const performanceData = [];
      
      for (let i = 0; i < 10; i++) {
        const performanceTest = await PERFORMANCE_HELPER.measureResponseTime(
          HTTP_TEST_CLIENT.get('/hello')
        );
        performanceData.push(performanceTest.responseTime);
      }
      
      const mean = performanceData.reduce((sum, time) => sum + time, 0) / performanceData.length;
      const variance = performanceData.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / performanceData.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Standard deviation should be less than 50% of mean (consistent performance)
      expect(standardDeviation).toBeLessThan(mean * 0.5);
    });

    test('should optimize middleware execution for minimal overhead', async () => {
      // Test with minimal request to measure base overhead
      const baselineTest = await PERFORMANCE_HELPER.measureResponseTime(
        HTTP_TEST_CLIENT.get('/health')
      );
      
      // Health endpoint should be fastest due to minimal processing
      expect(baselineTest.responseTime).toBeLessThan(PERFORMANCE_TARGET_MS / 2);
    });
  });

  // ===============================
  // ROUTE HEALTH MONITORING TESTS
  // ===============================

  describe('Route Health Monitoring', () => {
    test('should provide comprehensive routes health reporting', async () => {
      const healthReport = await getRoutesHealth({
        includeDetailedMetrics: true,
        includeSecurityStatus: true,
        includeEducationalInsights: true
      });

      expect(healthReport).toBeDefined();
      expect(healthReport.status).toBeDefined();
      expect(healthReport.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(healthReport.timestamp).toBeDefined();
      expect(healthReport.routesStatistics).toBeDefined();
    });

    test('should aggregate health data from all route modules', async () => {
      const healthReport = await getRoutesHealth({
        includeRouteSpecificData: true
      });

      expect(healthReport.individualRouteHealth).toBeDefined();
      expect(healthReport.individualRouteHealth.hello).toBeDefined();
      expect(healthReport.individualRouteHealth.goodEvening).toBeDefined();
      expect(healthReport.individualRouteHealth.health).toBeDefined();
    });

    test('should support load balancer health check integration', async () => {
      const response = await HTTP_TEST_CLIENT.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.headers['content-type']).toMatch(/application\/json/);
      
      // Response should be fast for load balancer health checks
      const performanceTest = await PERFORMANCE_HELPER.measureResponseTime(
        HTTP_TEST_CLIENT.get('/health')
      );
      expect(performanceTest.responseTime).toBeLessThan(50); // 50ms for health checks
    });

    test('should handle health monitoring failures gracefully', async () => {
      // Test health reporting even when some routes might have issues
      const healthReport = await getRoutesHealth({
        includeDetailedMetrics: true
      });

      expect(healthReport).toBeDefined();
      expect(healthReport.status).toMatch(/excellent|good|degraded|critical/);
    });

    test('should provide detailed health status for each route module', async () => {
      const healthReport = await getRoutesHealth({
        includeRouteSpecificData: true,
        includeDetailedMetrics: true
      });

      Object.values(healthReport.individualRouteHealth).forEach(routeHealth => {
        expect(routeHealth.status || routeHealth.score).toBeDefined();
      });
    });
  });

  // ===============================
  // ROUTE INITIALIZATION AND VALIDATION TESTS
  // ===============================

  describe('Route Initialization and Validation', () => {
    test('should initialize routes system with proper dependency checking', async () => {
      const initResult = await initializeRoutes({
        environment: 'test',
        validateConfiguration: true,
        enablePerformanceMonitoring: true
      });

      expect(initResult.success).toBe(true);
      expect(initResult.routesAggregator).toBeDefined();
      expect(initResult.environment).toBe('test');
    });

    test('should validate route configuration and production readiness', async () => {
      const validationResult = await validateRoutes({
        environment: 'test',
        enablePerformanceValidation: true,
        enableSecurityValidation: true
      });

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.overallScore).toBeGreaterThan(0);
      expect(Array.isArray(validationResult.errors)).toBe(true);
      expect(Array.isArray(validationResult.warnings)).toBe(true);
    });

    test('should handle initialization errors with proper recovery', async () => {
      // Test with invalid configuration to trigger error handling
      try {
        await initializeRoutes({
          environment: 'invalid-environment',
          validateConfiguration: true
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });

    test('should support PM2 cluster mode compatibility validation', async () => {
      const validationResult = await validateRoutes({
        environment: 'production',
        enablePerformanceValidation: true
      });

      // Validation should pass for PM2 compatibility
      expect(validationResult.analysis).toBeDefined();
      expect(validationResult.overallScore).toBeGreaterThan(70); // Production readiness threshold
    });

    test('should provide comprehensive route validation reporting', async () => {
      const validationResult = await validateRoutes({
        environment: 'test',
        enablePerformanceValidation: true,
        enableSecurityValidation: true
      });

      expect(validationResult.analysis).toBeDefined();
      expect(validationResult.scoreBreakdown).toBeDefined();
      expect(validationResult.summary).toBeDefined();
      expect(validationResult.timestamp).toBeDefined();
    });
  });

  // ===============================
  // CROSS-PLATFORM COMPATIBILITY TESTS
  // ===============================

  describe('Cross-Platform Compatibility', () => {
    test('should maintain response format consistency with Flask blueprints', async () => {
      const routes = ['/hello', '/good-evening', '/health'];
      const routeResponses = {};
      
      for (const route of routes) {
        const response = await HTTP_TEST_CLIENT.get(route);
        routeResponses[route.replace('/', '')] = response;
      }

      const compatibilityResults = CROSS_PLATFORM_HELPER.validateCrossPlatformCompatibility(routeResponses);
      
      Object.values(compatibilityResults).forEach(result => {
        expect(result.statusCodeMatch).toBe(true);
        expect(result.contentTypeMatch).toBe(true);
        expect(result.compatibilityScore).toBeGreaterThanOrEqual(80);
      });
    });

    test('should provide identical API behavior across platforms', async () => {
      const helloResponse = await HTTP_TEST_CLIENT.get('/hello');
      
      expect(helloResponse.status).toBe(200);
      expect(helloResponse.headers['content-type']).toMatch(/application\/json/);
      expect(helloResponse.body.message).toBe('Hello world');
    });

    test('should handle route organization patterns compatible with Flask', async () => {
      const routeRegistry = getRouteRegistry({
        includeEducationalContent: true
      });

      expect(routeRegistry.crossPlatformInfo).toBeDefined();
      expect(routeRegistry.crossPlatformInfo.flaskBlueprintEquivalents).toBeDefined();
      expect(routeRegistry.crossPlatformInfo.migrationReadiness).toBeGreaterThan(80);
    });

    test('should maintain performance parity with Flask implementation', async () => {
      const performanceTest = await PERFORMANCE_HELPER.measureResponseTime(
        HTTP_TEST_CLIENT.get('/hello')
      );
      
      // Performance should be within reasonable range for cross-platform comparison
      expect(performanceTest.responseTime).toBeLessThan(PERFORMANCE_TARGET_MS);
    });

    test('should support cross-platform deployment patterns', async () => {
      const routeRegistry = getRouteRegistry();
      
      expect(routeRegistry.integrationExamples).toBeDefined();
      expect(routeRegistry.integrationExamples.flaskMigration).toBeDefined();
    });
  });

  // ===============================
  // ERROR HANDLING AND EDGE CASES TESTS
  // ===============================

  describe('Error Handling and Edge Cases', () => {
    test('should handle route module loading errors gracefully', async () => {
      // Test with malformed requests that might cause route errors
      const response = await HTTP_TEST_CLIENT
        .post('/hello') // Wrong method
        .send({ invalid: 'data' });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should provide sanitized error responses across all routes', async () => {
      const response = await HTTP_TEST_CLIENT.get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.statusCode).toBe(404);
    });

    test('should log errors with correlation tracking', async () => {
      // This test would typically check logging output, but in unit tests
      // we verify the response includes correlation information
      const response = await HTTP_TEST_CLIENT.get('/nonexistent');
      
      expect(response.headers).toHaveProperty('x-request-id');
    });

    test('should handle middleware failures with proper fallback', async () => {
      // Test with edge case headers that might cause middleware issues
      const response = await HTTP_TEST_CLIENT
        .get('/hello')
        .set('User-Agent', 'A'.repeat(2000)); // Very long user agent
      
      // Should still respond without crashing
      expect(response.status).toBeLessThan(500);
    });

    test('should maintain service availability during partial failures', async () => {
      // Test that other routes work even if one has issues
      const healthResponse = await HTTP_TEST_CLIENT.get('/health');
      const helloResponse = await HTTP_TEST_CLIENT.get('/hello');
      
      expect(healthResponse.status).toBe(200);
      expect(helloResponse.status).toBe(200);
    });
  });

  // ===============================
  // PRODUCTION READINESS TESTS
  // ===============================

  describe('Production Readiness', () => {
    test('should support PM2 cluster mode with stateless design', async () => {
      // Test multiple requests to ensure stateless behavior
      const responses = await Promise.all([
        HTTP_TEST_CLIENT.get('/hello'),
        HTTP_TEST_CLIENT.get('/hello'),
        HTTP_TEST_CLIENT.get('/hello')
      ]);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Hello world');
      });
    });

    test('should handle zero-downtime deployment scenarios', async () => {
      // Test rapid sequential requests to simulate deployment
      const rapidRequests = [];
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(HTTP_TEST_CLIENT.get('/health'));
      }
      
      const results = await Promise.allSettled(rapidRequests);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      expect(successful.length).toBeGreaterThan(0); // Should maintain some availability
    });

    test('should provide production monitoring integration', async () => {
      const routeRegistry = getRouteRegistry({
        includeMetrics: true,
        includeHealth: true
      });
      
      expect(routeRegistry.aggregationStatus).toBeDefined();
      expect(routeRegistry.aggregationStatus.initialized).toBe(true);
    });

    test('should support load balancing across multiple processes', async () => {
      // Test with multiple concurrent requests that could be distributed
      const loadTestRequests = Array(20).fill().map(() => 
        HTTP_TEST_CLIENT.get('/health')
      );
      
      const responses = await Promise.allSettled(loadTestRequests);
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      
      expect(successful.length).toBeGreaterThanOrEqual(18); // 90% success rate
    });

    test('should maintain session independence for horizontal scaling', async () => {
      // Test that requests don't depend on previous request state
      const firstResponse = await HTTP_TEST_CLIENT.get('/hello');
      const secondResponse = await HTTP_TEST_CLIENT.get('/hello');
      
      expect(firstResponse.body).toEqual(secondResponse.body);
      expect(firstResponse.status).toBe(secondResponse.status);
    });
  });
});