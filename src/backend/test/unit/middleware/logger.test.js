/**
 * @fileoverview Comprehensive Unit Test Suite for Express.js Logger Middleware Module
 * @description Complete testing framework for HTTP request/response logging functionality, performance 
 * monitoring, security event tracking, correlation ID management, and PM2 cluster mode compatibility.
 * Tests all middleware functions with Jest/Mocha compatibility, SuperTest HTTP testing, comprehensive 
 * mock data validation, performance benchmarking, security violation testing, and cross-platform 
 * Flask compatibility patterns with ≥90% code coverage requirements.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Testing Framework Features:
 * - Comprehensive unit testing using Jest with Mocha compatibility patterns
 * - SuperTest HTTP testing for real API endpoint validation
 * - Sinon for advanced mocking, spying, and stubbing functionality
 * - Performance benchmarking with response time measurement
 * - Security event simulation and validation testing
 * - PM2 cluster mode compatibility and correlation tracking
 * - Cross-platform Flask compatibility pattern validation
 * - Educational demonstration of modern Node.js testing practices
 * 
 * Coverage Requirements:
 * - Unit tests: ≥90% code coverage for all logger middleware functions
 * - Integration tests: Real HTTP request/response lifecycle validation
 * - Performance tests: Response time thresholds and memory usage monitoring
 * - Security tests: Comprehensive security event logging validation
 * - Cross-platform tests: Flask compatibility and feature parity validation
 * 
 * Test Categories:
 * - Logger factory function testing (createRequestLogger, createSecurityLogger, etc.)
 * - HTTP request/response logging validation with correlation tracking
 * - Security middleware integration and event logging
 * - Performance monitoring and metrics collection testing
 * - Configuration validation and environment-specific behavior
 * - Error handling scenarios and exception recovery testing
 * - PM2 cluster mode compatibility and process correlation
 * - Cross-platform logging interface and Flask migration readiness
 */

// External testing framework imports with version specifications
import express from 'express'; // v5.1.0 - Express.js web framework for test application creation
import supertest from 'supertest'; // v6.3.3 - SuperAgent driven library for HTTP servers testing
import sinon from 'sinon'; // v17.0.1 - Standalone test spies, stubs and mocks for JavaScript testing
import { EventEmitter } from 'node:events'; // built-in - Node.js events module for event-driven testing
import { performance } from 'node:perf_hooks'; // built-in - Node.js performance measurement utilities
import crypto from 'node:crypto'; // built-in - Node.js crypto module for secure test data generation
import util from 'node:util'; // built-in - Node.js utilities for object inspection and debugging

// Internal logger middleware imports for comprehensive testing
import {
  createRequestLogger,
  logHTTPRequest,
  logHTTPResponse,
  logSecurityMiddlewareEvent,
  createSecurityLogger,
  createDevelopmentLogger,
  createProductionLogger,
  getLoggerMetrics,
  validateLoggerConfig,
  createFlaskCompatibleLogger
} from '../../../middleware/logger.js';

// Application imports for integration testing
import { createApp, createDevelopmentApp } from '../../../app.js';

// Test helpers and fixtures for comprehensive test data
import {
  createHTTPTestHelper,
  createPerformanceTestHelper,
  createSecurityTestHelper,
  createMockDataHelper,
  setupTestHelpers
} from '../../helpers/test-helpers.js';

import {
  helloResponses,
  errorResponses,
  securityResponses,
  performanceResponses
} from '../../fixtures/mock-responses.js';

import { setupTestEnvironment } from '../../setup.js';

// Constants and utilities for testing configuration
import {
  HTTP_CONSTANTS,
  TESTING_CONSTANTS,
  SECURITY_CONSTANTS,
  PM2_CONSTANTS,
  ERROR_CONSTANTS
} from '../../../utils/constants.js';

import logger from '../../../utils/logger.js';

// Global test environment variables and state management
let TEST_APP_INSTANCE = null;
let TEST_SERVER = null;
let TEST_HELPERS = null;
let MOCK_REQUEST_FACTORY = null;
let MOCK_RESPONSE_FACTORY = null;
let LOGGER_MIDDLEWARE_INSTANCE = null;
let PERFORMANCE_METRICS_TRACKER = new Map();
let SECURITY_EVENT_TRACKER = [];
let TEST_CORRELATION_IDS = new Set();

// Test suite configuration and lifecycle management
describe('Express.js Logger Middleware - Comprehensive Unit Test Suite', () => {
  // Main test suite setup with comprehensive environment initialization
  beforeAll(async () => {
    await setupTestSuite({
      framework: 'jest',
      environment: 'test',
      enablePerformanceMonitoring: true,
      enableSecurityTesting: true,
      enableCrossPlatformTesting: true
    });
  });

  // Individual test setup for clean test isolation
  beforeEach(async () => {
    // Reset test state and clear tracking collections
    PERFORMANCE_METRICS_TRACKER.clear();
    SECURITY_EVENT_TRACKER.length = 0;
    TEST_CORRELATION_IDS.clear();
    
    // Create fresh mock instances for each test
    MOCK_REQUEST_FACTORY = createMockRequest();
    MOCK_RESPONSE_FACTORY = createMockResponse();
    
    // Reset all sinon mocks and stubs
    sinon.restore();
  });

  // Test cleanup after each individual test
  afterEach(() => {
    // Restore all mocks and clear test artifacts
    sinon.restore();
    
    // Clear performance tracking data
    PERFORMANCE_METRICS_TRACKER.clear();
    
    // Reset security event tracking
    SECURITY_EVENT_TRACKER.length = 0;
  });

  // Complete test suite cleanup and resource deallocation
  afterAll(async () => {
    await cleanupTestSuite();
  });

  // Test Group 1: Logger Factory Function Testing
  describe('createRequestLogger - Request Logger Factory Testing', () => {
    test('should create request logger with default configuration', () => {
      // Arrange: Set up test request object with minimal configuration
      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/hello',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'test-agent/1.0'
        }
      });

      // Act: Create request logger instance using factory function
      const requestLogger = createRequestLogger(mockRequest);

      // Assert: Validate logger instance creation and properties
      expect(requestLogger).toBeDefined();
      expect(requestLogger).toHaveProperty('correlationId');
      expect(requestLogger).toHaveProperty('logRequest');
      expect(requestLogger).toHaveProperty('logResponse');
      expect(typeof requestLogger.logRequest).toBe('function');
      expect(typeof requestLogger.logResponse).toBe('function');
      
      // Validate correlation ID format and uniqueness
      expect(requestLogger.correlationId).toMatch(/^req-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      TEST_CORRELATION_IDS.add(requestLogger.correlationId);
      expect(TEST_CORRELATION_IDS.size).toBe(1);
    });

    test('should create request logger with custom configuration options', () => {
      // Arrange: Set up complex request with extensive configuration
      const mockRequest = createMockRequest({
        method: 'POST',
        url: '/api/v1/hello',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
          'X-Request-ID': 'custom-correlation-id',
          'User-Agent': 'test-client/2.0',
          'X-Forwarded-For': '192.168.1.100'
        },
        body: { message: 'test request' },
        ip: '192.168.1.100'
      });

      const customOptions = {
        enablePerformanceTracking: true,
        enableSecurityLogging: true,
        correlationIdPrefix: 'test',
        logLevel: 'debug'
      };

      // Act: Create request logger with custom configuration
      const requestLogger = createRequestLogger(mockRequest, customOptions);

      // Assert: Validate custom configuration application
      expect(requestLogger).toBeDefined();
      expect(requestLogger.correlationId).toMatch(/^test-[a-f0-9-]+$/);
      expect(requestLogger.options).toMatchObject(customOptions);
      expect(requestLogger.requestMetadata).toHaveProperty('method', 'POST');
      expect(requestLogger.requestMetadata).toHaveProperty('url', '/api/v1/hello');
      expect(requestLogger.requestMetadata).toHaveProperty('userAgent', 'test-client/2.0');
      expect(requestLogger.requestMetadata).toHaveProperty('clientIp', '192.168.1.100');
    });

    test('should handle malformed request objects gracefully', () => {
      // Arrange: Create invalid request objects for error handling testing
      const invalidRequests = [
        null,
        undefined,
        {},
        { method: null },
        { url: undefined },
        { headers: 'invalid' }
      ];

      // Act & Assert: Test error handling for each invalid request
      invalidRequests.forEach((invalidRequest, index) => {
        expect(() => {
          const logger = createRequestLogger(invalidRequest);
          // Should create fallback logger even with invalid input
          expect(logger).toBeDefined();
          expect(logger.correlationId).toBeDefined();
        }).not.toThrow();
      });
    });

    test('should generate unique correlation IDs for concurrent requests', () => {
      // Arrange: Create multiple mock requests for concurrency testing
      const concurrentRequests = Array.from({ length: 100 }, (_, index) => 
        createMockRequest({
          method: 'GET',
          url: `/test/${index}`,
          headers: { 'User-Agent': `test-agent-${index}` }
        })
      );

      // Act: Create loggers concurrently
      const loggers = concurrentRequests.map(req => createRequestLogger(req));

      // Assert: Validate uniqueness of all correlation IDs
      const correlationIds = loggers.map(logger => logger.correlationId);
      const uniqueIds = new Set(correlationIds);
      
      expect(uniqueIds.size).toBe(100);
      expect(correlationIds.length).toBe(100);
      
      // Validate correlation ID format consistency
      correlationIds.forEach(id => {
        expect(id).toMatch(/^req-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      });
    });
  });

  // Test Group 2: HTTP Request Logging Validation
  describe('logHTTPRequest - Request Logging Functionality', () => {
    test('should log HTTP GET request with comprehensive details', async () => {
      // Arrange: Set up comprehensive GET request scenario
      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/hello?name=world&lang=en',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Test Browser)',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'X-Forwarded-For': '203.0.113.195'
        },
        query: { name: 'world', lang: 'en' },
        ip: '203.0.113.195'
      });

      const logSpy = sinon.spy(logger, 'info');

      // Act: Execute request logging
      const result = await logHTTPRequest(mockRequest, {
        enablePerformanceTracking: true,
        enableDetailedLogging: true
      });

      // Assert: Validate logged request information
      expect(result).toBeDefined();
      expect(logSpy.calledOnce).toBe(true);
      
      const loggedData = logSpy.firstCall.args[1];
      expect(loggedData).toHaveProperty('method', 'GET');
      expect(loggedData).toHaveProperty('url', '/hello?name=world&lang=en');
      expect(loggedData).toHaveProperty('userAgent', 'Mozilla/5.0 (Test Browser)');
      expect(loggedData).toHaveProperty('clientIp', '203.0.113.195');
      expect(loggedData).toHaveProperty('timestamp');
      expect(loggedData).toHaveProperty('correlationId');
      expect(loggedData.query).toEqual({ name: 'world', lang: 'en' });
    });

    test('should log HTTP POST request with body content and security sanitization', async () => {
      // Arrange: Set up POST request with sensitive data for sanitization testing
      const sensitiveBody = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com',
        apiKey: 'sk-1234567890abcdef',
        creditCard: '4111-1111-1111-1111'
      };

      const mockRequest = createMockRequest({
        method: 'POST',
        url: '/api/v1/login',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sensitive-token-123',
          'User-Agent': 'PostmanRuntime/7.29.0'
        },
        body: sensitiveBody
      });

      const logSpy = sinon.spy(logger, 'info');

      // Act: Execute request logging with security sanitization
      await logHTTPRequest(mockRequest, {
        enableSecuritySanitization: true,
        sanitizeFields: ['password', 'apiKey', 'creditCard', 'Authorization']
      });

      // Assert: Validate security sanitization in logged data
      const loggedData = logSpy.firstCall.args[1];
      expect(loggedData.body.password).toBe('[REDACTED]');
      expect(loggedData.body.apiKey).toBe('[REDACTED]');
      expect(loggedData.body.creditCard).toBe('[REDACTED]');
      expect(loggedData.body.username).toBe('testuser'); // Should not be sanitized
      expect(loggedData.body.email).toBe('test@example.com'); // Should not be sanitized
      expect(loggedData.headers.Authorization).toBe('[REDACTED]');
    });

    test('should handle correlation ID tracking across distributed requests', async () => {
      // Arrange: Create request chain simulating distributed system
      const parentCorrelationId = 'parent-req-12345';
      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/api/v1/data',
        headers: {
          'X-Correlation-ID': parentCorrelationId,
          'X-Parent-Request-ID': 'upstream-service-67890'
        }
      });

      const logSpy = sinon.spy(logger, 'info');

      // Act: Execute request logging with correlation tracking
      await logHTTPRequest(mockRequest, {
        enableCorrelationTracking: true,
        preserveUpstreamCorrelation: true
      });

      // Assert: Validate correlation ID preservation and tracking
      const loggedData = logSpy.firstCall.args[1];
      expect(loggedData.correlationId).toBe(parentCorrelationId);
      expect(loggedData.parentRequestId).toBe('upstream-service-67890');
      expect(loggedData.distributedTracing).toBeDefined();
    });

    test('should measure and log request processing performance metrics', async () => {
      // Arrange: Set up performance measurement testing
      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/performance-test'
      });

      const performanceStartSpy = sinon.spy(performance, 'now');

      // Act: Execute request logging with performance tracking
      const startTime = performance.now();
      await logHTTPRequest(mockRequest, {
        enablePerformanceTracking: true,
        trackMemoryUsage: true
      });
      const endTime = performance.now();

      // Assert: Validate performance metrics collection
      expect(performanceStartSpy.called).toBe(true);
      
      const processingTime = endTime - startTime;
      expect(processingTime).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(100); // Should be very fast for mock request
      
      // Check if performance data is stored for later retrieval
      expect(PERFORMANCE_METRICS_TRACKER.size).toBeGreaterThan(0);
    });
  });

  // Test Group 3: HTTP Response Logging Validation
  describe('logHTTPResponse - Response Logging Functionality', () => {
    test('should log successful HTTP response with complete details', async () => {
      // Arrange: Set up successful response scenario
      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/hello',
        correlationId: 'test-correlation-123'
      });

      const mockResponse = createMockResponse({
        statusCode: HTTP_CONSTANTS.STATUS_CODES.OK,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '25',
          'X-Response-Time': '15ms'
        },
        body: { message: 'Hello world' }
      });

      const responseTime = 15.5; // milliseconds
      const logSpy = sinon.spy(logger, 'info');

      // Act: Execute response logging
      await logHTTPResponse(mockRequest, mockResponse, responseTime, {
        enablePerformanceLogging: true,
        includeResponseBody: true
      });

      // Assert: Validate logged response information
      const loggedData = logSpy.firstCall.args[1];
      expect(loggedData).toHaveProperty('statusCode', 200);
      expect(loggedData).toHaveProperty('responseTime', 15.5);
      expect(loggedData).toHaveProperty('correlationId', 'test-correlation-123');
      expect(loggedData).toHaveProperty('contentLength', '25');
      expect(loggedData).toHaveProperty('contentType', 'application/json');
      expect(loggedData.response.body).toEqual({ message: 'Hello world' });
    });

    test('should log error responses with appropriate error classification', async () => {
      // Arrange: Set up error response scenarios
      const errorScenarios = [
        {
          statusCode: HTTP_CONSTANTS.STATUS_CODES.NOT_FOUND,
          body: { error: 'Route not found' },
          expectedLevel: 'warn'
        },
        {
          statusCode: HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
          body: { error: 'Internal server error' },
          expectedLevel: 'error'
        },
        {
          statusCode: HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST,
          body: { error: 'Invalid request parameters' },
          expectedLevel: 'warn'
        }
      ];

      const logSpyWarn = sinon.spy(logger, 'warn');
      const logSpyError = sinon.spy(logger, 'error');

      // Act & Assert: Test each error scenario
      for (const scenario of errorScenarios) {
        const mockRequest = createMockRequest({
          method: 'GET',
          url: '/test-error'
        });

        const mockResponse = createMockResponse({
          statusCode: scenario.statusCode,
          body: scenario.body
        });

        await logHTTPResponse(mockRequest, mockResponse, 50, {
          enableErrorClassification: true
        });

        // Validate appropriate logging level used
        if (scenario.expectedLevel === 'error') {
          expect(logSpyError.called).toBe(true);
        } else if (scenario.expectedLevel === 'warn') {
          expect(logSpyWarn.called).toBe(true);
        }
      }
    });

    test('should calculate and log performance percentiles and trends', async () => {
      // Arrange: Generate response time data for statistical analysis
      const responseTimes = [10, 15, 20, 25, 30, 35, 40, 50, 100, 150]; // milliseconds
      const requests = responseTimes.map((time, index) => ({
        request: createMockRequest({
          method: 'GET',
          url: `/performance-test/${index}`
        }),
        response: createMockResponse({
          statusCode: HTTP_CONSTANTS.STATUS_CODES.OK
        }),
        responseTime: time
      }));

      // Act: Log multiple responses to build performance trends
      for (const { request, response, responseTime } of requests) {
        await logHTTPResponse(request, response, responseTime, {
          enablePerformanceTrending: true,
          calculatePercentiles: true
        });
      }

      // Assert: Validate performance trend calculation
      const metrics = getLoggerMetrics();
      expect(metrics.performance).toBeDefined();
      expect(metrics.performance.averageResponseTime).toBeCloseTo(47.5, 1);
      expect(metrics.performance.p50).toBeGreaterThan(0);
      expect(metrics.performance.p95).toBeGreaterThan(0);
      expect(metrics.performance.p99).toBeGreaterThan(0);
    });

    test('should track response correlation and complete request lifecycle', async () => {
      // Arrange: Set up complete request-response lifecycle
      const correlationId = 'lifecycle-test-456';
      const mockRequest = createMockRequest({
        method: 'POST',
        url: '/lifecycle-test',
        correlationId: correlationId,
        timestamp: new Date().toISOString()
      });

      const mockResponse = createMockResponse({
        statusCode: HTTP_CONSTANTS.STATUS_CODES.CREATED,
        headers: {
          'X-Request-ID': correlationId,
          'Location': '/api/resources/123'
        }
      });

      const logSpy = sinon.spy(logger, 'info');

      // Act: Complete request-response lifecycle logging
      await logHTTPRequest(mockRequest);
      await logHTTPResponse(mockRequest, mockResponse, 25.7);

      // Assert: Validate lifecycle correlation and completion tracking
      expect(logSpy.calledTwice).toBe(true);
      
      const requestLog = logSpy.firstCall.args[1];
      const responseLog = logSpy.secondCall.args[1];
      
      expect(requestLog.correlationId).toBe(correlationId);
      expect(responseLog.correlationId).toBe(correlationId);
      expect(responseLog.lifecycle).toHaveProperty('completed', true);
      expect(responseLog.lifecycle).toHaveProperty('totalDuration');
    });
  });

  // Test Group 4: Security Event Logging and Validation
  describe('logSecurityMiddlewareEvent - Security Event Logging', () => {
    test('should log CSP violation events with threat analysis', async () => {
      // Arrange: Set up Content Security Policy violation scenario
      const cspViolationEvent = {
        type: 'csp-violation',
        violatedDirective: 'script-src',
        blockedURI: 'https://malicious-site.com/evil.js',
        documentURI: 'https://example.com/page',
        sourceFile: 'https://example.com/app.js',
        lineNumber: 42,
        columnNumber: 15,
        originalPolicy: "default-src 'self'; script-src 'self'"
      };

      const mockRequest = createMockRequest({
        method: 'POST',
        url: '/csp-report',
        headers: {
          'Content-Type': 'application/csp-report',
          'User-Agent': 'Mozilla/5.0 (Potentially Malicious Browser)'
        },
        body: { 'csp-report': cspViolationEvent },
        ip: '192.168.1.100'
      });

      const securityLogSpy = sinon.spy(logger, 'warn');

      // Act: Log security event
      await logSecurityMiddlewareEvent('csp-violation', cspViolationEvent, mockRequest, {
        enableThreatAnalysis: true,
        enableIncidentTracking: true
      });

      // Assert: Validate security event logging and threat analysis
      expect(securityLogSpy.calledOnce).toBe(true);
      
      const loggedEvent = securityLogSpy.firstCall.args[1];
      expect(loggedEvent.securityEvent.type).toBe('csp-violation');
      expect(loggedEvent.securityEvent.threatLevel).toBeDefined();
      expect(loggedEvent.securityEvent.violatedDirective).toBe('script-src');
      expect(loggedEvent.securityEvent.blockedURI).toBe('https://malicious-site.com/evil.js');
      expect(loggedEvent.incidentId).toBeDefined();
      expect(SECURITY_EVENT_TRACKER.length).toBe(1);
    });

    test('should log CORS violation with origin analysis and blocking', async () => {
      // Arrange: Set up CORS violation scenario
      const corsViolationEvent = {
        type: 'cors-violation',
        origin: 'https://suspicious-domain.evil',
        method: 'POST',
        allowedOrigins: ['https://trusted-domain.com', 'https://example.com'],
        headers: ['Authorization', 'Content-Type'],
        credentials: true
      };

      const mockRequest = createMockRequest({
        method: 'OPTIONS',
        url: '/api/sensitive-data',
        headers: {
          'Origin': 'https://suspicious-domain.evil',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Authorization, Content-Type'
        }
      });

      const securityLogSpy = sinon.spy(logger, 'error');

      // Act: Log CORS violation with threat assessment
      await logSecurityMiddlewareEvent('cors-violation', corsViolationEvent, mockRequest, {
        enableOriginAnalysis: true,
        enableAutomaticBlocking: true
      });

      // Assert: Validate CORS violation logging and response
      const loggedEvent = securityLogSpy.firstCall.args[1];
      expect(loggedEvent.securityEvent.type).toBe('cors-violation');
      expect(loggedEvent.securityEvent.origin).toBe('https://suspicious-domain.evil');
      expect(loggedEvent.securityEvent.blocked).toBe(true);
      expect(loggedEvent.securityEvent.threatAssessment).toBeDefined();
    });

    test('should log rate limiting violations with pattern analysis', async () => {
      // Arrange: Simulate rate limiting violation pattern
      const rateLimitEvents = Array.from({ length: 10 }, (_, index) => ({
        timestamp: new Date(Date.now() - (9 - index) * 1000).toISOString(),
        ip: '10.0.0.1',
        endpoint: '/api/data',
        requestCount: index + 1,
        windowSize: 60000, // 1 minute
        limit: 5
      }));

      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/api/data',
        ip: '10.0.0.1',
        headers: {
          'User-Agent': 'Aggressive Bot/1.0'
        }
      });

      const securityLogSpy = sinon.spy(logger, 'warn');

      // Act: Log rate limiting violations
      for (const event of rateLimitEvents.slice(-3)) { // Log last 3 violations
        await logSecurityMiddlewareEvent('rate-limit-violation', event, mockRequest, {
          enablePatternAnalysis: true,
          enableBehaviorTracking: true
        });
      }

      // Assert: Validate pattern detection and escalation
      expect(securityLogSpy.callCount).toBe(3);
      
      const lastLoggedEvent = securityLogSpy.lastCall.args[1];
      expect(lastLoggedEvent.securityEvent.type).toBe('rate-limit-violation');
      expect(lastLoggedEvent.securityEvent.patternAnalysis).toBeDefined();
      expect(lastLoggedEvent.securityEvent.escalationLevel).toBeDefined();
      expect(SECURITY_EVENT_TRACKER.length).toBeGreaterThan(0);
    });

    test('should integrate with Helmet.js security middleware events', async () => {
      // Arrange: Set up Helmet.js integration scenario
      const helmetEvents = [
        {
          type: 'helmet-xss-protection',
          blocked: true,
          reason: 'XSS attempt detected in query parameter'
        },
        {
          type: 'helmet-nosniff',
          warning: 'Content type sniffing attempted',
          contentType: 'text/html'
        },
        {
          type: 'helmet-frame-options',
          blocked: true,
          reason: 'Clickjacking attempt blocked'
        }
      ];

      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/vulnerable-page?search=<script>alert("xss")</script>',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Attack Vector)',
          'X-Frame-Options': 'SAMEORIGIN'
        }
      });

      const securityLogSpy = sinon.spy(logger, 'warn');

      // Act: Log Helmet.js security events
      for (const event of helmetEvents) {
        await logSecurityMiddlewareEvent(`helmet-${event.type}`, event, mockRequest, {
          enableHelmetIntegration: true,
          enableXSSDetection: true
        });
      }

      // Assert: Validate Helmet.js integration and security logging
      expect(securityLogSpy.callCount).toBe(3);
      
      const xssEvent = securityLogSpy.firstCall.args[1];
      expect(xssEvent.securityEvent.type).toBe('helmet-helmet-xss-protection');
      expect(xssEvent.securityEvent.blocked).toBe(true);
      expect(xssEvent.helmetIntegration).toBeDefined();
    });
  });

  // Test Group 5: Specialized Logger Factory Testing
  describe('Specialized Logger Factories - Environment-Specific Testing', () => {
    test('createSecurityLogger - should create security-focused logger with threat monitoring', () => {
      // Arrange: Set up security logger configuration
      const securityConfig = {
        enableThreatDetection: true,
        enableIncidentResponse: true,
        threatThresholds: {
          low: 1,
          medium: 5,
          high: 10,
          critical: 20
        },
        alertingEnabled: true
      };

      // Act: Create security logger instance
      const securityLogger = createSecurityLogger(securityConfig);

      // Assert: Validate security logger capabilities
      expect(securityLogger).toBeDefined();
      expect(securityLogger).toHaveProperty('logSecurityEvent');
      expect(securityLogger).toHaveProperty('analyzeThreats');
      expect(securityLogger).toHaveProperty('generateAlert');
      expect(securityLogger.config.enableThreatDetection).toBe(true);
      expect(securityLogger.config.threatThresholds.critical).toBe(20);
    });

    test('createDevelopmentLogger - should create development-optimized logger with enhanced debugging', () => {
      // Arrange: Set up development logger configuration
      const developmentConfig = {
        verboseLogging: true,
        enableStackTraces: true,
        enableRequestInspection: true,
        enablePerformanceDetails: true,
        educationalAnnotations: true
      };

      // Act: Create development logger instance
      const developmentLogger = createDevelopmentLogger(developmentConfig);

      // Assert: Validate development logger features
      expect(developmentLogger).toBeDefined();
      expect(developmentLogger).toHaveProperty('logRequestDetails');
      expect(developmentLogger).toHaveProperty('logPerformanceBreakdown');
      expect(developmentLogger).toHaveProperty('logEducationalInsights');
      expect(developmentLogger.config.verboseLogging).toBe(true);
      expect(developmentLogger.config.educationalAnnotations).toBe(true);
    });

    test('createProductionLogger - should create production-optimized logger with enterprise features', () => {
      // Arrange: Set up production logger configuration
      const productionConfig = {
        enableAggregation: true,
        enableAlerts: true,
        enableMetrics: true,
        enableAuditTrail: true,
        sanitizeSensitiveData: true,
        compressionEnabled: true,
        retentionPolicy: '30d'
      };

      // Act: Create production logger instance
      const productionLogger = createProductionLogger(productionConfig);

      // Assert: Validate production logger capabilities
      expect(productionLogger).toBeDefined();
      expect(productionLogger).toHaveProperty('logAggregatedMetrics');
      expect(productionLogger).toHaveProperty('generateAuditTrail');
      expect(productionLogger).toHaveProperty('sanitizeData');
      expect(productionLogger.config.enableAggregation).toBe(true);
      expect(productionLogger.config.sanitizeSensitiveData).toBe(true);
    });
  });

  // Test Group 6: Performance Testing and Monitoring
  describe('Performance Testing - Response Time and Memory Usage Monitoring', () => {
    test('should measure response times within acceptable thresholds', async () => {
      // Arrange: Set up performance testing scenario
      const performanceTestHelper = createPerformanceTestHelper({
        responseTimeThreshold: TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD,
        memoryThreshold: TESTING_CONSTANTS.PERFORMANCE_TARGETS.MEMORY_USAGE_THRESHOLD
      });

      const testEndpoints = ['/hello', '/good-evening', '/health'];
      const responseTimeResults = [];

      // Act: Measure response times for multiple endpoints
      for (const endpoint of testEndpoints) {
        const startTime = performance.now();
        
        const mockRequest = createMockRequest({
          method: 'GET',
          url: endpoint
        });
        
        await logHTTPRequest(mockRequest, {
          enablePerformanceTracking: true
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        responseTimeResults.push({ endpoint, responseTime });
      }

      // Assert: Validate response time thresholds
      responseTimeResults.forEach(result => {
        expect(result.responseTime).toBeLessThan(100); // Should be under 100ms
        expect(result.responseTime).toBeGreaterThan(0);
      });

      const averageResponseTime = responseTimeResults.reduce((sum, result) => 
        sum + result.responseTime, 0) / responseTimeResults.length;
      
      expect(averageResponseTime).toBeLessThan(50); // Average should be under 50ms
    });

    test('should track memory usage and detect memory leaks', async () => {
      // Arrange: Set up memory usage monitoring
      const initialMemory = process.memoryUsage();
      const memorySnapshots = [initialMemory];

      // Act: Perform multiple logging operations to test memory usage
      for (let i = 0; i < 100; i++) {
        const mockRequest = createMockRequest({
          method: 'GET',
          url: `/memory-test/${i}`,
          body: { data: 'x'.repeat(1000) } // 1KB of data per request
        });

        await logHTTPRequest(mockRequest, {
          enablePerformanceTracking: true,
          enableMemoryTracking: true
        });

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          memorySnapshots.push(process.memoryUsage());
        }
      }

      // Assert: Validate memory usage stability
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 100 requests)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      // Check for memory leak patterns
      const memoryTrend = memorySnapshots.map(snapshot => snapshot.heapUsed);
      const isIncreasingTrend = memoryTrend.every((value, index) => 
        index === 0 || value >= memoryTrend[index - 1] - 1024 * 1024); // Allow 1MB variance
      
      expect(isIncreasingTrend).toBe(false); // Should not be constantly increasing
    });

    test('should validate concurrent request handling performance', async () => {
      // Arrange: Set up concurrent request testing
      const concurrentRequests = 50;
      const requests = Array.from({ length: concurrentRequests }, (_, index) => 
        createMockRequest({
          method: 'POST',
          url: `/concurrent-test/${index}`,
          body: { requestId: index, timestamp: Date.now() }
        })
      );

      const startTime = performance.now();
      const performancePromises = [];

      // Act: Execute concurrent requests
      for (const request of requests) {
        performancePromises.push(
          logHTTPRequest(request, {
            enablePerformanceTracking: true,
            enableConcurrencyTracking: true
          })
        );
      }

      await Promise.all(performancePromises);
      const endTime = performance.now();
      const totalProcessingTime = endTime - startTime;

      // Assert: Validate concurrent processing performance
      expect(totalProcessingTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Validate that all requests were processed
      expect(performancePromises.length).toBe(concurrentRequests);
      
      // Check performance metrics
      const metrics = getLoggerMetrics();
      expect(metrics.concurrency).toBeDefined();
      expect(metrics.concurrency.totalRequests).toBe(concurrentRequests);
      expect(metrics.concurrency.averageProcessingTime).toBeLessThan(100);
    });
  });

  // Test Group 7: Configuration Validation and Error Handling
  describe('Configuration Validation - validateLoggerConfig Function Testing', () => {
    test('should validate correct logger configuration', () => {
      // Arrange: Set up valid configuration scenarios
      const validConfigurations = [
        {
          logLevel: 'info',
          enablePerformanceTracking: true,
          enableSecurityLogging: true,
          outputFormat: 'json',
          maxFileSize: '10MB',
          retention: '30d'
        },
        {
          logLevel: 'debug',
          enablePerformanceTracking: false,
          enableSecurityLogging: true,
          outputFormat: 'text',
          customFormatters: ['timestamp', 'correlationId']
        }
      ];

      // Act & Assert: Test each valid configuration
      validConfigurations.forEach((config, index) => {
        const validationResult = validateLoggerConfig(config);
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
        expect(validationResult.warnings).toBeDefined();
        expect(validationResult.optimizations).toBeDefined();
      });
    });

    test('should detect and report configuration errors', () => {
      // Arrange: Set up invalid configuration scenarios
      const invalidConfigurations = [
        {
          logLevel: 'invalid-level', // Invalid log level
          enablePerformanceTracking: 'yes', // Should be boolean
          maxFileSize: 'unlimited' // Invalid size format
        },
        {
          outputFormat: 'unsupported-format',
          retention: '0d', // Invalid retention period
          enableSecurityLogging: null // Should be boolean
        }
      ];

      // Act & Assert: Test each invalid configuration
      invalidConfigurations.forEach(config => {
        const validationResult = validateLoggerConfig(config);
        
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
        expect(validationResult.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              severity: expect.stringMatching(/error|warning/)
            })
          ])
        );
      });
    });

    test('should provide optimization recommendations', () => {
      // Arrange: Set up configuration that can be optimized
      const suboptimalConfig = {
        logLevel: 'silly', // Too verbose for production
        enablePerformanceTracking: false, // Should be enabled
        outputFormat: 'text', // JSON is more structured
        maxFileSize: '1MB', // Too small for production
        retention: '1d' // Too short for compliance
      };

      // Act: Validate configuration and get recommendations
      const validationResult = validateLoggerConfig(suboptimalConfig, {
        environment: 'production',
        enableOptimizationSuggestions: true
      });

      // Assert: Validate optimization recommendations
      expect(validationResult.optimizations.length).toBeGreaterThan(0);
      expect(validationResult.optimizations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/performance|security|compliance/),
            recommendation: expect.any(String),
            impact: expect.stringMatching(/low|medium|high/)
          })
        ])
      );
    });

    test('should validate PM2 cluster mode compatibility', () => {
      // Arrange: Set up PM2-specific configuration
      const pm2Config = {
        enableClusterMode: true,
        processCorrelation: true,
        sharedLogging: true,
        logRotation: true,
        ipcEnabled: true
      };

      // Act: Validate PM2 compatibility
      const validationResult = validateLoggerConfig(pm2Config, {
        environment: 'production',
        enablePM2Validation: true
      });

      // Assert: Validate PM2 compatibility checks
      expect(validationResult.pm2Compatibility).toBeDefined();
      expect(validationResult.pm2Compatibility.isCompatible).toBe(true);
      expect(validationResult.pm2Compatibility.recommendations).toBeDefined();
    });
  });

  // Test Group 8: Cross-Platform Flask Compatibility Testing
  describe('Cross-Platform Compatibility - createFlaskCompatibleLogger Testing', () => {
    test('should create Flask-compatible logging interface', () => {
      // Arrange: Set up Flask compatibility configuration
      const flaskConfig = {
        responseFormat: 'flask-compatible',
        enableCrossPlatformValidation: true,
        logFormatMapping: {
          timestamp: 'iso8601',
          level: 'uppercase',
          message: 'string'
        }
      };

      // Act: Create Flask-compatible logger
      const flaskLogger = createFlaskCompatibleLogger(flaskConfig);

      // Assert: Validate Flask compatibility interface
      expect(flaskLogger).toBeDefined();
      expect(flaskLogger).toHaveProperty('log_request'); // Python naming convention
      expect(flaskLogger).toHaveProperty('log_response');
      expect(flaskLogger).toHaveProperty('format_response');
      expect(flaskLogger.config.responseFormat).toBe('flask-compatible');
    });

    test('should maintain response format consistency across platforms', async () => {
      // Arrange: Set up cross-platform response testing
      const testRequest = createMockRequest({
        method: 'GET',
        url: '/hello'
      });

      const nodeResponse = helloResponses.success;
      const flaskLogger = createFlaskCompatibleLogger({
        enforceFormatConsistency: true
      });

      // Act: Format response for both platforms
      const nodeFormatted = await logHTTPResponse(testRequest, nodeResponse, 15);
      const flaskFormatted = flaskLogger.format_response(testRequest, nodeResponse, 15);

      // Assert: Validate format consistency
      expect(nodeFormatted.message).toBe(flaskFormatted.message);
      expect(nodeFormatted.timestamp).toBeDefined();
      expect(flaskFormatted.timestamp).toBeDefined();
      expect(typeof nodeFormatted.responseTime).toBe('number');
      expect(typeof flaskFormatted.response_time).toBe('number'); // Python naming
    });

    test('should validate feature parity between Node.js and Flask implementations', async () => {
      // Arrange: Set up feature parity testing
      const features = [
        'request_logging',
        'response_logging',
        'performance_tracking',
        'security_events',
        'correlation_tracking',
        'error_handling'
      ];

      const flaskLogger = createFlaskCompatibleLogger({
        enableFeatureParityValidation: true,
        requiredFeatures: features
      });

      // Act: Validate each feature
      const featureValidation = flaskLogger.validate_feature_parity();

      // Assert: Validate feature parity
      expect(featureValidation.parityScore).toBeGreaterThan(0.9); // 90% parity
      expect(featureValidation.missingFeatures).toHaveLength(0);
      expect(featureValidation.incompatibleFeatures).toHaveLength(0);
      
      features.forEach(feature => {
        expect(featureValidation.supportedFeatures).toContain(feature);
      });
    });

    test('should support migration validation and compatibility testing', async () => {
      // Arrange: Set up migration validation scenario
      const migrationTestCases = [
        {
          endpoint: '/hello',
          method: 'GET',
          expected: helloResponses.success
        },
        {
          endpoint: '/health',
          method: 'GET',
          expected: performanceResponses.benchmark
        },
        {
          endpoint: '/error',
          method: 'GET',
          expected: errorResponses.notFound
        }
      ];

      const flaskLogger = createFlaskCompatibleLogger({
        enableMigrationValidation: true
      });

      // Act: Run migration validation tests
      const migrationResults = [];
      for (const testCase of migrationTestCases) {
        const nodeResult = await logHTTPRequest(
          createMockRequest({
            method: testCase.method,
            url: testCase.endpoint
          })
        );

        const flaskResult = flaskLogger.simulate_flask_request({
          method: testCase.method,
          url: testCase.endpoint
        });

        migrationResults.push({
          testCase,
          nodeResult,
          flaskResult,
          compatible: flaskLogger.validate_compatibility(nodeResult, flaskResult)
        });
      }

      // Assert: Validate migration compatibility
      migrationResults.forEach(result => {
        expect(result.compatible.isCompatible).toBe(true);
        expect(result.compatible.differenceScore).toBeLessThan(0.1); // Less than 10% difference
      });
    });
  });

  // Test Group 9: Integration Testing with Express Application
  describe('Middleware Integration - Express Application Testing', () => {
    test('should integrate logger middleware with Express application', async () => {
      // Arrange: Set up Express application with logger middleware
      const app = createApp({
        enableLogging: true,
        loggerConfig: {
          enablePerformanceTracking: true,
          enableSecurityLogging: true
        }
      });

      const httpTestHelper = createHTTPTestHelper(app);

      // Act: Make real HTTP requests through Express application
      const responses = await Promise.all([
        httpTestHelper.get('/hello').expectStatus(200),
        httpTestHelper.get('/good-evening').expectStatus(200),
        httpTestHelper.get('/health').expectStatus(200)
      ]);

      // Assert: Validate middleware integration and logging
      responses.forEach(response => {
        expect(response.headers).toHaveProperty('x-request-id');
        expect(response.status).toBeDefined();
        expect(response.body).toBeDefined();
      });

      // Validate that logging occurred for each request
      expect(PERFORMANCE_METRICS_TRACKER.size).toBeGreaterThan(0);
    });

    test('should handle real HTTP request/response lifecycle', async () => {
      // Arrange: Set up real HTTP server for integration testing
      const app = createDevelopmentApp({
        enableVerboseLogging: true
      });

      const server = app.listen(0); // Use random available port
      const port = server.address().port;
      const baseURL = `http://localhost:${port}`;

      const logSpy = sinon.spy(logger, 'info');

      try {
        // Act: Make real HTTP requests
        const response = await supertest(app)
          .get('/hello')
          .expect(200)
          .expect('Content-Type', /json/);

        // Assert: Validate real request/response handling
        expect(response.body).toHaveProperty('message');
        expect(logSpy.called).toBe(true);
        
        const loggedData = logSpy.getCalls()
          .find(call => call.args[0].includes('HTTP request'))?.args[1];
        
        if (loggedData) {
          expect(loggedData).toHaveProperty('method', 'GET');
          expect(loggedData).toHaveProperty('url', '/hello');
          expect(loggedData).toHaveProperty('correlationId');
        }

      } finally {
        // Cleanup: Close server
        server.close();
      }
    });

    test('should handle middleware pipeline execution and error propagation', async () => {
      // Arrange: Set up Express application with error scenarios
      const app = express();
      
      // Add logger middleware
      app.use((req, res, next) => {
        const requestLogger = createRequestLogger(req);
        req.logger = requestLogger;
        requestLogger.logRequest();
        next();
      });

      // Add route that throws error
      app.get('/error-test', (req, res, next) => {
        const error = new Error('Test error for middleware testing');
        error.statusCode = 500;
        next(error);
      });

      // Add error handling middleware
      app.use((error, req, res, next) => {
        logSecurityMiddlewareEvent('application-error', {
          error: error.message,
          stack: error.stack
        }, req);
        
        res.status(error.statusCode || 500).json({
          error: error.message,
          correlationId: req.correlationId
        });
      });

      const errorLogSpy = sinon.spy(logger, 'error');

      // Act: Trigger error scenario
      const response = await supertest(app)
        .get('/error-test')
        .expect(500);

      // Assert: Validate error handling and logging
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('correlationId');
      expect(errorLogSpy.called).toBe(true);
    });
  });

  // Test Group 10: Metrics Collection and Monitoring
  describe('Metrics Collection - getLoggerMetrics Function Testing', () => {
    test('should collect comprehensive logging metrics', async () => {
      // Arrange: Generate diverse logging data for metrics collection
      const testScenarios = [
        { method: 'GET', url: '/metrics-test-1', responseTime: 25 },
        { method: 'POST', url: '/metrics-test-2', responseTime: 45 },
        { method: 'PUT', url: '/metrics-test-3', responseTime: 65 },
        { method: 'DELETE', url: '/metrics-test-4', responseTime: 35 }
      ];

      // Act: Execute logging operations to generate metrics data
      for (const scenario of testScenarios) {
        const mockRequest = createMockRequest({
          method: scenario.method,
          url: scenario.url
        });

        const mockResponse = createMockResponse({
          statusCode: 200
        });

        await logHTTPRequest(mockRequest);
        await logHTTPResponse(mockRequest, mockResponse, scenario.responseTime);
      }

      // Get comprehensive metrics
      const metrics = getLoggerMetrics();

      // Assert: Validate metrics collection and accuracy
      expect(metrics).toBeDefined();
      expect(metrics.requests).toBeDefined();
      expect(metrics.responses).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.security).toBeDefined();

      // Validate request metrics
      expect(metrics.requests.total).toBe(4);
      expect(metrics.requests.byMethod.GET).toBe(1);
      expect(metrics.requests.byMethod.POST).toBe(1);
      expect(metrics.requests.byMethod.PUT).toBe(1);
      expect(metrics.requests.byMethod.DELETE).toBe(1);

      // Validate performance metrics
      expect(metrics.performance.averageResponseTime).toBeCloseTo(42.5, 1);
      expect(metrics.performance.totalRequests).toBe(4);
    });

    test('should calculate performance percentiles and trends', async () => {
      // Arrange: Generate varied response time data
      const responseTimes = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      for (const responseTime of responseTimes) {
        const mockRequest = createMockRequest({
          method: 'GET',
          url: `/percentile-test/${responseTime}`
        });

        const mockResponse = createMockResponse({
          statusCode: 200
        });

        await logHTTPResponse(mockRequest, mockResponse, responseTime);
      }

      // Act: Get performance metrics with percentiles
      const metrics = getLoggerMetrics({
        includePercentiles: true,
        calculateTrends: true
      });

      // Assert: Validate percentile calculations
      expect(metrics.performance.percentiles).toBeDefined();
      expect(metrics.performance.percentiles.p50).toBeCloseTo(55, 5); // Median around 55
      expect(metrics.performance.percentiles.p95).toBeCloseTo(95, 5); // 95th percentile around 95
      expect(metrics.performance.percentiles.p99).toBeCloseTo(99, 5); // 99th percentile around 99
    });

    test('should track security event metrics and trends', async () => {
      // Arrange: Generate security events for metrics testing
      const securityEvents = [
        { type: 'csp-violation', severity: 'medium' },
        { type: 'cors-violation', severity: 'high' },
        { type: 'rate-limit-violation', severity: 'low' },
        { type: 'xss-attempt', severity: 'high' },
        { type: 'sql-injection-attempt', severity: 'critical' }
      ];

      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/security-test'
      });

      // Act: Log security events
      for (const event of securityEvents) {
        await logSecurityMiddlewareEvent(event.type, {
          severity: event.severity,
          timestamp: new Date().toISOString()
        }, mockRequest);
      }

      // Get security metrics
      const metrics = getLoggerMetrics({
        includeSecurityMetrics: true
      });

      // Assert: Validate security metrics
      expect(metrics.security).toBeDefined();
      expect(metrics.security.totalEvents).toBe(5);
      expect(metrics.security.bySeverity.critical).toBe(1);
      expect(metrics.security.bySeverity.high).toBe(2);
      expect(metrics.security.bySeverity.medium).toBe(1);
      expect(metrics.security.bySeverity.low).toBe(1);
      expect(metrics.security.byType['csp-violation']).toBe(1);
    });
  });

  // Test Group 11: Error Handling and Exception Recovery
  describe('Error Handling - Exception Recovery and Resilience Testing', () => {
    test('should handle logging failures gracefully without breaking application flow', async () => {
      // Arrange: Set up scenario where logging fails
      const originalLoggerError = logger.error;
      const loggerErrorStub = sinon.stub(logger, 'error').throws(new Error('Logging system failure'));

      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/resilience-test'
      });

      // Act: Attempt logging operations that will fail
      let applicationError = null;
      try {
        await logHTTPRequest(mockRequest, {
          enableErrorRecovery: true,
          fallbackLogging: true
        });
      } catch (error) {
        applicationError = error;
      }

      // Assert: Validate graceful error handling
      expect(applicationError).toBeNull(); // Should not throw application error
      expect(loggerErrorStub.called).toBe(true); // Logging was attempted

      // Restore original logger
      logger.error = originalLoggerError;
    });

    test('should implement fallback logging mechanisms during system failures', async () => {
      // Arrange: Simulate various system failure scenarios
      const failureScenarios = [
        { type: 'memory-pressure', available: false },
        { type: 'disk-full', writable: false },
        { type: 'network-partition', connected: false }
      ];

      const fallbackLogSpy = sinon.spy();

      // Act: Test each failure scenario
      for (const scenario of failureScenarios) {
        const mockRequest = createMockRequest({
          method: 'GET',
          url: `/failure-test/${scenario.type}`
        });

        await logHTTPRequest(mockRequest, {
          enableFallbackLogging: true,
          fallbackMechanism: fallbackLogSpy,
          systemStatus: scenario
        });
      }

      // Assert: Validate fallback mechanisms were used
      expect(fallbackLogSpy.callCount).toBe(failureScenarios.length);
    });

    test('should recover from temporary logging service outages', async () => {
      // Arrange: Simulate temporary service outage
      let serviceAvailable = false;
      const serviceCheckStub = sinon.stub().callsFake(() => serviceAvailable);

      const mockRequest = createMockRequest({
        method: 'GET',
        url: '/outage-recovery-test'
      });

      // Act: Attempt logging during outage, then after recovery
      // Initial attempt during outage
      await logHTTPRequest(mockRequest, {
        enableServiceRecovery: true,
        serviceHealthCheck: serviceCheckStub,
        retryAttempts: 3
      });

      // Simulate service recovery
      serviceAvailable = true;

      // Retry after recovery
      await logHTTPRequest(mockRequest, {
        enableServiceRecovery: true,
        serviceHealthCheck: serviceCheckStub,
        retryAttempts: 3
      });

      // Assert: Validate recovery mechanism
      expect(serviceCheckStub.callCount).toBeGreaterThan(1);
    });

    test('should handle malformed data and sanitization errors', async () => {
      // Arrange: Create requests with malformed/dangerous data
      const malformedRequests = [
        {
          method: 'POST',
          url: '/malformed-test-1',
          body: { circular: null }, // Will create circular reference
          headers: { 'Content-Type': null }
        },
        {
          method: 'GET',
          url: '/malformed-test-2',
          query: { param: Buffer.alloc(1000000) }, // Large buffer
          headers: { 'User-Agent': 'x'.repeat(10000) } // Extremely long header
        }
      ];

      // Create circular reference
      malformedRequests[0].body.circular = malformedRequests[0].body;

      const errorHandlingSpy = sinon.spy();

      // Act: Process malformed requests
      for (const request of malformedRequests) {
        try {
          await logHTTPRequest(request, {
            enableDataSanitization: true,
            enableErrorRecovery: true,
            errorHandler: errorHandlingSpy
          });
        } catch (error) {
          // Should not throw - errors should be handled gracefully
          expect(error).toBeNull();
        }
      }

      // Assert: Validate error handling
      // Should not have thrown any unhandled errors
      expect(true).toBe(true); // Test passes if no exceptions were thrown
    });
  });
});

// Test Suite Setup and Utility Functions

/**
 * Sets up comprehensive test suite environment including Express.js application instances,
 * logger middleware configuration, test helpers initialization, mock data preparation,
 * and framework-agnostic testing infrastructure for comprehensive logger middleware testing.
 * 
 * @param {Object} suiteConfig - Test suite configuration options
 * @returns {Promise<Object>} Promise resolving to complete test suite environment
 */
async function setupTestSuite(suiteConfig) {
  try {
    // Initialize testing framework detection and configure Jest/Mocha compatibility
    const testingFramework = suiteConfig.framework || 'jest';
    process.env.NODE_ENV = 'test';
    process.env.TESTING_FRAMEWORK = testingFramework;

    // Set up Express.js test application instances
    TEST_APP_INSTANCE = createApp({
      enableHealthMonitoring: false, // Disable for testing
      enableSecurityMiddleware: true,
      configOverrides: {
        environment: { NODE_ENV: 'test' },
        logging: { level: 'debug' }
      }
    });

    // Initialize comprehensive test helpers
    TEST_HELPERS = await setupTestHelpers({
      framework: testingFramework,
      enableHTTPTesting: true,
      enablePerformanceTesting: suiteConfig.enablePerformanceMonitoring,
      enableSecurityTesting: suiteConfig.enableSecurityTesting
    });

    // Configure logger middleware instances for testing
    LOGGER_MIDDLEWARE_INSTANCE = createRequestLogger({
      method: 'GET',
      url: '/test-setup',
      headers: { 'User-Agent': 'test-setup' }
    });

    // Initialize performance metrics tracking
    PERFORMANCE_METRICS_TRACKER.clear();
    SECURITY_EVENT_TRACKER.length = 0;
    TEST_CORRELATION_IDS.clear();

    console.log('✅ Test suite setup completed successfully');
    
    return {
      app: TEST_APP_INSTANCE,
      helpers: TEST_HELPERS,
      logger: LOGGER_MIDDLEWARE_INSTANCE,
      framework: testingFramework
    };

  } catch (error) {
    console.error('❌ Test suite setup failed:', error);
    throw error;
  }
}

/**
 * Creates comprehensive mock Express.js request objects with realistic properties
 * including headers, query parameters, body content, client information, and
 * correlation tracking for testing logger middleware request processing.
 * 
 * @param {Object} requestConfig - Mock request configuration
 * @param {Object} options - Additional options for request creation
 * @returns {Object} Mock Express.js request object with realistic properties
 */
function createMockRequest(requestConfig = {}, options = {}) {
  const correlationId = requestConfig.correlationId || 
    `req-${crypto.randomUUID()}`;

  const mockRequest = {
    method: requestConfig.method || 'GET',
    url: requestConfig.url || '/',
    path: requestConfig.path || requestConfig.url || '/',
    originalUrl: requestConfig.originalUrl || requestConfig.url || '/',
    query: requestConfig.query || {},
    params: requestConfig.params || {},
    body: requestConfig.body || {},
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent/1.0',
      'accept': 'application/json',
      ...requestConfig.headers
    },
    ip: requestConfig.ip || '127.0.0.1',
    ips: requestConfig.ips || [],
    protocol: requestConfig.protocol || 'http',
    secure: requestConfig.secure || false,
    xhr: requestConfig.xhr || false,
    correlationId: correlationId,
    timestamp: requestConfig.timestamp || new Date().toISOString(),
    
    // Express.js methods
    get: function(headerName) {
      return this.headers[headerName.toLowerCase()];
    },
    header: function(headerName) {
      return this.get(headerName);
    },
    
    // Additional metadata for testing
    _testMetadata: {
      createdAt: Date.now(),
      testCase: options.testCase || 'unknown',
      mockType: 'http-request'
    }
  };

  return mockRequest;
}

/**
 * Creates comprehensive mock Express.js response objects with realistic properties
 * including headers, status codes, response body, timing information, and method
 * implementations for testing logger middleware response processing.
 * 
 * @param {Object} responseConfig - Mock response configuration
 * @param {Object} options - Additional options for response creation
 * @returns {Object} Mock Express.js response object with realistic properties
 */
function createMockResponse(responseConfig = {}, options = {}) {
  const mockResponse = {
    statusCode: responseConfig.statusCode || HTTP_CONSTANTS.STATUS_CODES.OK,
    statusMessage: responseConfig.statusMessage || 'OK',
    headers: {
      'content-type': 'application/json',
      'x-powered-by': 'Express',
      ...responseConfig.headers
    },
    body: responseConfig.body || {},
    locals: responseConfig.locals || {},
    finished: responseConfig.finished || false,
    headersSent: responseConfig.headersSent || false,
    
    // Response timing
    responseTime: responseConfig.responseTime || 0,
    startTime: responseConfig.startTime || Date.now(),
    
    // Express.js methods
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    set: function(field, value) {
      if (typeof field === 'object') {
        Object.assign(this.headers, field);
      } else {
        this.headers[field.toLowerCase()] = value;
      }
      return this;
    },
    
    header: function(field, value) {
      return this.set(field, value);
    },
    
    get: function(field) {
      return this.headers[field.toLowerCase()];
    },
    
    json: function(obj) {
      this.body = obj;
      this.set('Content-Type', 'application/json');
      return this;
    },
    
    send: function(body) {
      this.body = body;
      return this;
    },
    
    end: function() {
      this.finished = true;
      return this;
    },
    
    // Event emitter simulation
    on: function(event, callback) {
      // Simulate async event emission
      if (event === 'finish') {
        setTimeout(callback, 1);
      }
      return this;
    },
    
    // Additional metadata for testing
    _testMetadata: {
      createdAt: Date.now(),
      testCase: options.testCase || 'unknown',
      mockType: 'http-response'
    }
  };

  return mockResponse;
}

/**
 * Comprehensive cleanup function for test suite including server shutdown,
 * mock restoration, cache clearing, resource deallocation, and complete test
 * environment cleanup to ensure proper test isolation.
 * 
 * @returns {Promise<void>} Promise that resolves when all cleanup operations are complete
 */
async function cleanupTestSuite() {
  try {
    // Shutdown test Express.js application instances
    if (TEST_SERVER) {
      await new Promise((resolve) => {
        TEST_SERVER.close(resolve);
      });
      TEST_SERVER = null;
    }

    // Clear performance metrics tracking
    PERFORMANCE_METRICS_TRACKER.clear();
    
    // Reset security event monitoring
    SECURITY_EVENT_TRACKER.length = 0;
    
    // Clear correlation ID tracking
    TEST_CORRELATION_IDS.clear();

    // Reset global test variables
    TEST_APP_INSTANCE = null;
    TEST_HELPERS = null;
    MOCK_REQUEST_FACTORY = null;
    MOCK_RESPONSE_FACTORY = null;
    LOGGER_MIDDLEWARE_INSTANCE = null;

    // Restore all mocks and stubs
    sinon.restore();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    console.log('✅ Test suite cleanup completed successfully');

  } catch (error) {
    console.error('❌ Test suite cleanup failed:', error);
    throw error;
  }
}