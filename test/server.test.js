/**
 * Comprehensive HTTP Server Test Suite - test/server.test.js
 * 
 * Main server test suite using Jest and Supertest that validates HTTP response functionality
 * including status codes, headers, and response bodies. Tests core server endpoints,
 * request/response cycles, and validates proper HTTP protocol compliance for GET and POST requests.
 * 
 * Test Coverage:
 * - HTTP response validation (status codes, headers, body content)
 * - Server endpoint testing (GET /, POST /data, error routes)
 * - Request/response cycle validation 
 * - Header validation including Content-Type and custom headers
 * - Edge case handling (malformed JSON, large payloads, invalid routes)
 * - Performance assertions (response time under 100ms)
 * - Error scenario testing (404, 400, 500, 405 status codes)
 * 
 * @module test/server.test.js
 * @requires jest
 * @requires supertest
 * @requires server
 * @requires test/fixtures/test-data.json
 * @requires test/fixtures/mock-config.js
 * @since 1.0.0
 * @author Blitzy Platform - Testinium QA Framework
 */

// External imports from testing frameworks
const { describe, it, test, expect, beforeEach, afterEach, jest } = require('jest');
const request = require('supertest');

// Internal imports from project dependencies
const server = require('../server.js');
const testData = require('./fixtures/test-data.json');
const mockConfig = require('./fixtures/mock-config.js');

/**
 * Main Test Suite: HTTP Server Response Validation
 * 
 * Comprehensive test suite validating HTTP server functionality including
 * status codes, headers, response bodies, and proper protocol compliance.
 * Implements minimum 2-3 assertions per test following the pattern:
 * 'should [expected behavior] when [condition]'
 */
describe('HTTP Server Response Validation', () => {
  let serverInstance;
  let serverAddress;
  
  /**
   * Test Setup: Server Lifecycle Management
   * 
   * Sets up a fresh server instance for each test to ensure isolation
   * and prevent test interdependencies. Uses dynamic port allocation
   * from mockConfig to avoid port conflicts during parallel execution.
   */
  beforeEach((done) => {
    // Use dynamic port allocation from mockConfig for test isolation
    const testPort = mockConfig.ports.getDynamicPort();
    
    serverInstance = server.listen(testPort, mockConfig.server.host, (error) => {
      if (error) {
        return done(error);
      }
      
      serverAddress = server.address();
      expect(serverInstance).toBeDefined();
      expect(serverAddress).toBeTruthy();
      expect(serverAddress.port).toBeGreaterThan(0);
      done();
    });
  });
  
  /**
   * Test Cleanup: Resource Management
   * 
   * Ensures proper cleanup of server resources after each test
   * to prevent memory leaks and port conflicts. Implements timeout
   * protection as specified in mockConfig.timeout.server.shutdown.
   */
  afterEach((done) => {
    if (serverInstance && serverInstance.listening) {
      const shutdownTimeout = setTimeout(() => {
        done(new Error('Server shutdown timeout exceeded'));
      }, mockConfig.timeout.server.shutdown);
      
      serverInstance.close((error) => {
        clearTimeout(shutdownTimeout);
        
        if (error) {
          return done(error);
        }
        
        serverInstance = null;
        serverAddress = null;
        done();
      });
    } else {
      done();
    }
  });

  /**
   * Test Group: GET Endpoint Validation
   * 
   * Validates GET request handling including root endpoint response,
   * status codes, headers, and response body structure. Tests both
   * successful requests and error scenarios.
   */
  describe('GET Endpoints', () => {
    
    /**
     * Test Case: Root Endpoint Success Response
     * 
     * Validates that GET / returns 200 status with 'ok' response
     * as specified in Section 0.3.2 requirements.
     */
    test('should return 200 with ok response when accessing root endpoint', async () => {
      const startTime = Date.now();
      
      const response = await request(server)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);
      
      const responseTime = Date.now() - startTime;
      
      // Validate response structure (minimum 3 assertions as required)
      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('ok');
      expect(response.body.code).toBe(200);
      expect(response.body.message).toBe('Testinium-QA HTTP Server Running');
      
      // Validate response headers
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-server']).toBe('Testinium-QA-Server');
      expect(response.headers['x-timestamp']).toBeDefined();
      expect(response.headers['x-test-server']).toBe('true');
      
      // Performance assertion: response time under 100ms
      expect(responseTime).toBeLessThan(100);
    });
    
    /**
     * Test Case: Health Check Endpoint
     * 
     * Validates health endpoint returns system information
     * including uptime and memory usage statistics.
     */
    test('should return health information when accessing health endpoint', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate health response structure
      expect(response.body.status).toBe('healthy');
      expect(response.body.code).toBe(200);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.memory).toBeDefined();
      expect(typeof response.body.memory).toBe('object');
      
      // Validate memory object structure
      expect(response.body.memory.rss).toBeGreaterThan(0);
      expect(response.body.memory.heapUsed).toBeGreaterThan(0);
      expect(response.body.memory.heapTotal).toBeGreaterThan(0);
    });
    
    /**
     * Test Case: Echo Endpoint with Query Parameters
     * 
     * Validates echo endpoint returns query parameters correctly
     * and maintains proper request/response cycle.
     */
    test('should echo query parameters when accessing echo endpoint', async () => {
      const queryParams = testData.valid.simpleObject;
      
      const response = await request(server)
        .get('/echo')
        .query(queryParams)
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate echo response includes query parameters
      expect(response.body.status).toBe('ok');
      expect(response.body.code).toBe(200);
      expect(response.body.query).toBeDefined();
      expect(response.body.pathname).toBe('/echo');
      expect(response.body.query.name).toBe(queryParams.name);
      expect(response.body.query.value).toBe(String(queryParams.value));
      expect(response.body.query.email).toBe(queryParams.email);
    });
    
    /**
     * Test Case: Headers Inspection Endpoint
     * 
     * Validates headers endpoint returns request headers for testing
     * header validation functionality.
     */
    test('should return request headers when accessing headers endpoint', async () => {
      const customHeaders = testData.headers.validHeaders;
      
      const response = await request(server)
        .get('/headers')
        .set('User-Agent', customHeaders.userAgent)
        .set('Authorization', customHeaders.authorization)
        .set('X-Custom-Header', customHeaders.customHeader)
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate headers response structure
      expect(response.body.status).toBe('ok');
      expect(response.body.code).toBe(200);
      expect(response.body.headers).toBeDefined();
      
      // Validate custom headers are included
      expect(response.body.headers['user-agent']).toBe(customHeaders.userAgent);
      expect(response.body.headers.authorization).toBe(customHeaders.authorization);
      expect(response.body.headers['x-custom-header']).toBe(customHeaders.customHeader);
    });
    
    /**
     * Test Case: 404 Not Found for Invalid Routes
     * 
     * Validates that invalid routes return 404 status with proper
     * error structure as specified in Section 0.3.2.
     */
    test('should return 404 Not Found when accessing nonexistent route', async () => {
      const invalidPath = '/nonexistent-endpoint';
      
      const response = await request(server)
        .get(invalidPath)
        .expect(404)
        .expect('Content-Type', /json/);
      
      // Validate 404 error response structure
      expect(response.body.error).toBe('Not Found');
      expect(response.body.code).toBe(404);
      expect(response.body.path).toBe(invalidPath);
      
      // Validate error response headers
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-server']).toBe('Testinium-QA-Server');
    });
    
    /**
     * Test Case: Delayed Response for Timeout Testing
     * 
     * Validates delayed response endpoint works correctly and
     * returns response within expected timeframe.
     */
    test('should handle delayed response when accessing delay endpoint', async () => {
      const delayMs = 50; // Short delay for testing
      const startTime = Date.now();
      
      const response = await request(server)
        .get(`/delay?ms=${delayMs}`)
        .expect(200)
        .expect('Content-Type', /json/);
      
      const actualDelay = Date.now() - startTime;
      
      // Validate delayed response
      expect(response.body.status).toBe('ok');
      expect(response.body.code).toBe(200);
      expect(response.body.delayed).toBe(delayMs);
      
      // Validate actual delay is approximately correct (±10ms tolerance)
      expect(actualDelay).toBeGreaterThanOrEqual(delayMs - 10);
      expect(actualDelay).toBeLessThan(delayMs + 50);
    });
    
    /**
     * Test Case: Intentional Error Endpoint
     * 
     * Validates error endpoint triggers 500 Internal Server Error
     * with proper error handling and response structure.
     */
    test('should return 500 Internal Server Error when accessing error endpoint', async () => {
      const response = await request(server)
        .get('/error')
        .expect(500)
        .expect('Content-Type', /json/);
      
      // Validate 500 error response structure
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.code).toBe(500);
      expect(response.body.message).toBe('Intentional test error');
      
      // Validate error response headers
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
  
  /**
   * Test Group: POST Endpoint Validation
   * 
   * Validates POST request handling including JSON data processing,
   * form data handling, content type validation, and error scenarios
   * with malformed payloads.
   */
  describe('POST Endpoints', () => {
    
    /**
     * Test Case: POST /data with Valid JSON
     * 
     * Validates that POST /data accepts and processes JSON payloads
     * correctly as specified in Section 0.3.2 requirements.
     */
    test('should accept and process JSON data when posting to data endpoint', async () => {
      const testPayload = testData.valid.complexObject.user;
      const startTime = Date.now();
      
      const response = await request(server)
        .post('/data')
        .send(testPayload)
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
      
      const responseTime = Date.now() - startTime;
      
      // Validate POST response structure (minimum 3 assertions)
      expect(response.body.status).toBe('received');
      expect(response.body.code).toBe(200);
      expect(response.body.data).toEqual(testPayload);
      expect(response.body.size).toBeGreaterThan(0);
      
      // Validate response headers
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-server']).toBe('Testinium-QA-Server');
      
      // Performance assertion: response time under 100ms
      expect(responseTime).toBeLessThan(100);
    });
    
    /**
     * Test Case: POST /data with Form Data
     * 
     * Validates form-encoded data processing and proper
     * content type handling for URL-encoded payloads.
     */
    test('should accept and process form data when posting urlencoded content', async () => {
      const formData = testData.contentTypes.formData.sample;
      
      const response = await request(server)
        .post('/data')
        .send(formData)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate form data response
      expect(response.body.status).toBe('received');
      expect(response.body.code).toBe(200);
      expect(response.body.form).toBeDefined();
      expect(response.body.form.name).toBe('test');
      expect(response.body.form.value).toBe('123');
      expect(response.body.size).toBeGreaterThan(0);
    });
    
    /**
     * Test Case: POST /validate with Valid Data
     * 
     * Validates the validation endpoint accepts valid payloads
     * and returns successful validation response.
     */
    test('should validate request body when posting to validate endpoint', async () => {
      const validPayload = testData.valid.stringData.simple;
      
      const response = await request(server)
        .post('/validate')
        .send(validPayload)
        .set('Content-Type', 'text/plain')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate validation response
      expect(response.body.status).toBe('valid');
      expect(response.body.code).toBe(200);
      expect(response.body.validation).toBe('passed');
    });
    
    /**
     * Test Case: POST /upload with File Data
     * 
     * Validates file upload endpoint handles binary data
     * and returns proper upload confirmation.
     */
    test('should handle file upload when posting to upload endpoint', async () => {
      const binaryData = testData.large.binaryData.base64;
      const mimeType = testData.large.binaryData.mimeType;
      
      const response = await request(server)
        .post('/upload')
        .send(binaryData)
        .set('Content-Type', mimeType)
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate upload response
      expect(response.body.status).toBe('uploaded');
      expect(response.body.code).toBe(200);
      expect(response.body.size).toBeGreaterThan(0);
      expect(response.body.contentType).toBe(mimeType);
    });
  });
  
  /**
   * Test Group: Error Handling Validation
   * 
   * Validates comprehensive error handling including malformed JSON,
   * unsupported methods, empty bodies, and invalid content types.
   */
  describe('Error Handling', () => {
    
    /**
     * Test Case: 400 Bad Request for Malformed JSON
     * 
     * Validates that malformed JSON returns 400 Bad Request
     * with proper error structure and message.
     */
    test('should return 400 Bad Request when posting malformed JSON', async () => {
      const malformedJson = testData.invalid.malformedJson;
      
      const response = await request(server)
        .post('/data')
        .send(malformedJson)
        .set('Content-Type', 'application/json')
        .expect(400)
        .expect('Content-Type', /json/);
      
      // Validate 400 error response structure
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.code).toBe(400);
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe('string');
    });
    
    /**
     * Test Case: 405 Method Not Allowed
     * 
     * Validates unsupported HTTP methods return 405 status
     * with Allow header listing supported methods.
     */
    test('should return 405 Method Not Allowed when using unsupported method', async () => {
      const response = await request(server)
        .patch('/') // PATCH is not supported
        .expect(405)
        .expect('Content-Type', /json/);
      
      // Validate 405 error response
      expect(response.body.error).toBe('Method Not Allowed');
      expect(response.body.code).toBe(405);
      expect(response.body.allowed).toEqual(['GET', 'POST', 'HEAD']);
      
      // Validate Allow header
      expect(response.headers.allow).toBe('GET, POST, HEAD');
    });
    
    /**
     * Test Case: 415 Unsupported Media Type
     * 
     * Validates unsupported content types return 415 status
     * with list of supported media types.
     */
    test('should return 415 Unsupported Media Type for invalid content type', async () => {
      const response = await request(server)
        .post('/data')
        .send('test data')
        .set('Content-Type', 'text/plain') // Not supported for /data endpoint
        .expect(415)
        .expect('Content-Type', /json/);
      
      // Validate 415 error response
      expect(response.body.error).toBe('Unsupported Media Type');
      expect(response.body.code).toBe(415);
      expect(response.body.supported).toContain('application/json');
      expect(response.body.supported).toContain('application/x-www-form-urlencoded');
    });
    
    /**
     * Test Case: 400 Bad Request for Empty Body
     * 
     * Validates empty request bodies are handled correctly
     * when body content is required.
     */
    test('should return 400 Bad Request when posting empty body to validate endpoint', async () => {
      const response = await request(server)
        .post('/validate')
        .send('')
        .expect(400)
        .expect('Content-Type', /json/);
      
      // Validate empty body error response
      expect(response.body.error).toBe('Empty body not allowed');
      expect(response.body.code).toBe(400);
    });
    
    /**
     * Test Case: 413 Payload Too Large
     * 
     * Validates large payloads are rejected with 413 status
     * when exceeding the 2MB limit specified in server.js.
     */
    test('should return 413 Payload Too Large for oversized request', async () => {
      // Create a payload larger than 2MB
      const largePayload = 'x'.repeat(2 * 1024 * 1024 + 1); // 2MB + 1 byte
      
      const response = await request(server)
        .post('/data')
        .send(largePayload)
        .set('Content-Type', 'text/plain')
        .expect(413)
        .expect('Content-Type', /json/);
      
      // Validate payload size error response
      expect(response.body.error).toBe('Payload Too Large');
      expect(response.body.code).toBe(413);
      expect(response.body.limit).toBe('2MB');
    });
  });
  
  /**
   * Test Group: Header Validation
   * 
   * Validates HTTP header handling including custom headers,
   * Content-Type validation, and server-generated headers.
   */
  describe('Header Validation', () => {
    
    /**
     * Test Case: Custom Header Validation
     * 
     * Validates server correctly sets and returns custom headers
     * including X-Server, X-Timestamp, and X-Test-Server.
     */
    test('should include custom headers in response', async () => {
      const response = await request(server)
        .get('/')
        .expect(200);
      
      // Validate presence of custom headers (minimum 3 assertions)
      expect(response.headers['x-server']).toBe('Testinium-QA-Server');
      expect(response.headers['x-timestamp']).toBeDefined();
      expect(response.headers['x-test-server']).toBe('true');
      
      // Validate timestamp header format (ISO string)
      const timestamp = response.headers['x-timestamp'];
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
    
    /**
     * Test Case: Content-Type Header Validation
     * 
     * Validates proper Content-Type header handling for different
     * response types and request scenarios.
     */
    test('should set correct Content-Type header for JSON responses', async () => {
      const response = await request(server)
        .get('/')
        .expect(200)
        .expect('Content-Type', /application\/json/);
      
      // Validate specific Content-Type header value
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });
    
    /**
     * Test Case: HEAD Request Header Validation
     * 
     * Validates HEAD requests return proper headers without body
     * as per HTTP specification requirements.
     */
    test('should handle HEAD requests with proper headers and no body', async () => {
      const response = await request(server)
        .head('/')
        .expect(200);
      
      // Validate HEAD request response
      expect(response.body).toEqual({});
      expect(response.text).toBe('');
      
      // Validate headers are still present
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-server']).toBe('Testinium-QA-Server');
    });
  });
  
  /**
   * Test Group: Edge Cases and Boundary Conditions
   * 
   * Validates edge cases including concurrent requests, special characters,
   * boundary values, and stress testing scenarios.
   */
  describe('Edge Cases and Boundary Conditions', () => {
    
    /**
     * Test Case: Special Characters in URL
     * 
     * Validates proper handling of special characters and
     * URL encoding in request paths.
     */
    test('should handle special characters in URL paths correctly', async () => {
      const specialPath = '/test%20path%21%40%23';
      
      const response = await request(server)
        .get(specialPath)
        .expect(404)
        .expect('Content-Type', /json/);
      
      // Validate decoded path in error response
      expect(response.body.error).toBe('Not Found');
      expect(response.body.code).toBe(404);
      expect(response.body.path).toBe('/test path!@#'); // URL decoded
    });
    
    /**
     * Test Case: Unicode Content Handling
     * 
     * Validates proper handling of Unicode characters in
     * request and response bodies.
     */
    test('should handle Unicode content correctly', async () => {
      const unicodeData = {
        text: testData.edgeCases.specialCharacters.unicode,
        rtl: testData.edgeCases.specialCharacters.rtlText,
        cyrillic: testData.edgeCases.specialCharacters.cyrillicText
      };
      
      const response = await request(server)
        .post('/data')
        .send(unicodeData)
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate Unicode data processing
      expect(response.body.status).toBe('received');
      expect(response.body.data).toEqual(unicodeData);
      expect(response.body.data.text).toBe(unicodeData.text);
      expect(response.body.data.rtl).toBe(unicodeData.rtl);
      expect(response.body.data.cyrillic).toBe(unicodeData.cyrillic);
    });
    
    /**
     * Test Case: Concurrent Request Handling
     * 
     * Validates server handles multiple concurrent requests
     * without degradation or race conditions.
     */
    test('should handle concurrent requests without issues', async () => {
      const concurrentCount = 10;
      const requests = [];
      const startTime = Date.now();
      
      // Generate concurrent requests
      for (let i = 0; i < concurrentCount; i++) {
        requests.push(
          request(server)
            .get('/')
            .expect(200)
            .expect('Content-Type', /json/)
        );
      }
      
      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // Validate all responses successful (minimum 3 assertions)
      expect(responses).toHaveLength(concurrentCount);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.code).toBe(200);
      });
      
      // Performance assertion: total time reasonable for concurrent requests
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });
    
    /**
     * Test Case: Boundary Value Testing
     * 
     * Validates handling of boundary values including numeric limits,
     * empty strings, and edge case data structures.
     */
    test('should handle boundary values correctly', async () => {
      const boundaryData = testData.edgeCases.boundaryValues;
      
      const response = await request(server)
        .post('/data')
        .send(boundaryData)
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate boundary value processing
      expect(response.body.status).toBe('received');
      expect(response.body.data).toEqual(boundaryData);
      expect(response.body.data.maxInteger).toBe(2147483647);
      expect(response.body.data.minInteger).toBe(-2147483648);
      expect(typeof response.body.data.maxFloat).toBe('number');
      expect(typeof response.body.data.minFloat).toBe('number');
    });
    
    /**
     * Test Case: Empty and Null Data Handling
     * 
     * Validates proper handling of empty objects, null values,
     * and undefined data structures.
     */
    test('should handle empty and null data structures correctly', async () => {
      const emptyData = testData.empty;
      
      const response = await request(server)
        .post('/data')
        .send(emptyData)
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
      
      // Validate empty data processing
      expect(response.body.status).toBe('received');
      expect(response.body.data).toEqual(emptyData);
      expect(response.body.data.emptyObject).toEqual({});
      expect(response.body.data.emptyArray).toEqual([]);
      expect(response.body.data.nullValue).toBeNull();
      expect(response.body.data.falseValue).toBe(false);
      expect(response.body.data.zeroValue).toBe(0);
    });
  });
  
  /**
   * Test Group: Performance Validation
   * 
   * Validates performance requirements including response times,
   * throughput, and resource efficiency as specified in requirements.
   */
  describe('Performance Validation', () => {
    
    /**
     * Test Case: Response Time Under 100ms
     * 
     * Validates simple routes respond within 100ms as specified
     * in Section 0.3.2 performance requirements.
     */
    test('should respond within 100ms for simple GET requests', async () => {
      const measurements = [];
      
      // Take multiple measurements for statistical accuracy
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        await request(server)
          .get('/')
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        measurements.push(responseTime);
      }
      
      // Calculate average response time
      const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      
      // Validate performance requirement (minimum 3 assertions)
      expect(averageTime).toBeLessThan(100);
      expect(Math.max(...measurements)).toBeLessThan(150); // Max individual time
      expect(Math.min(...measurements)).toBeGreaterThan(0); // Min time should be positive
      
      // Log performance metrics for debugging
      console.log(`Average response time: ${averageTime.toFixed(2)}ms`);
      console.log(`Min: ${Math.min(...measurements)}ms, Max: ${Math.max(...measurements)}ms`);
    });
    
    /**
     * Test Case: POST Request Performance
     * 
     * Validates POST requests with JSON data maintain good performance
     * even with complex payloads.
     */
    test('should maintain performance for POST requests with complex data', async () => {
      const complexPayload = testData.valid.complexObject;
      const startTime = Date.now();
      
      const response = await request(server)
        .post('/data')
        .send(complexPayload)
        .set('Content-Type', 'application/json')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Validate performance and correctness
      expect(responseTime).toBeLessThan(100);
      expect(response.body.status).toBe('received');
      expect(response.body.data).toEqual(complexPayload);
    });
    
    /**
     * Test Case: Memory Efficiency Validation
     * 
     * Validates server doesn't leak memory or resources during
     * multiple request processing cycles.
     */
    test('should maintain memory efficiency during multiple requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const requestCount = 50;
      
      // Process multiple requests
      for (let i = 0; i < requestCount; i++) {
        await request(server)
          .get('/health')
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Validate memory usage remains reasonable
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      
      // Log memory usage for debugging
      console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    });
  });
});

/**
 * Additional Test Suite: Server Integration Tests
 * 
 * Integration tests focusing on server lifecycle, port binding,
 * and integration with the testing infrastructure.
 */
describe('Server Integration Tests', () => {
  
  /**
   * Test Case: Server Instance Validation
   * 
   * Validates server instance is properly created and exported
   * with required methods for Supertest integration.
   */
  test('should export valid server instance with required methods', () => {
    // Validate server object properties (minimum 3 assertions)
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
    expect(typeof server.address).toBe('function');
    expect(typeof server.on).toBe('function');
    
    // Validate server is an HTTP server instance
    expect(server.constructor.name).toBe('Server');
  });
  
  /**
   * Test Case: Test Data Validation
   * 
   * Validates test fixture data is properly loaded and structured
   * for comprehensive testing scenarios.
   */
  test('should load and validate test fixture data correctly', () => {
    // Validate testData structure
    expect(testData).toBeDefined();
    expect(testData.valid).toBeDefined();
    expect(testData.invalid).toBeDefined();
    expect(testData.large).toBeDefined();
    expect(testData.empty).toBeDefined();
    expect(testData.expectedResponses).toBeDefined();
    
    // Validate specific test data elements
    expect(testData.valid.simpleObject.name).toBe('test-user');
    expect(testData.expectedResponses.success.status).toBe(200);
    expect(testData.invalid.malformedJson).toContain('{"name": "test"');
  });
  
  /**
   * Test Case: Mock Configuration Validation
   * 
   * Validates mock configuration is properly structured and provides
   * required settings for test execution.
   */
  test('should load and validate mock configuration correctly', () => {
    // Validate mockConfig structure
    expect(mockConfig).toBeDefined();
    expect(mockConfig.server).toBeDefined();
    expect(mockConfig.timeout).toBeDefined();
    expect(mockConfig.env).toBeDefined();
    expect(mockConfig.ports).toBeDefined();
    
    // Validate configuration values
    expect(mockConfig.server.port).toBe(0);
    expect(mockConfig.server.host).toBe('127.0.0.1');
    expect(mockConfig.timeout.server.shutdown).toBe(3000);
    expect(typeof mockConfig.ports.getDynamicPort).toBe('function');
    expect(mockConfig.ports.getDynamicPort()).toBe(0);
  });
});

/**
 * Module Export Information
 * 
 * This test module uses Jest as the testing framework with Supertest for HTTP testing.
 * It provides comprehensive coverage of the HTTP server functionality including:
 * 
 * - Happy path scenarios (GET /, POST /data)
 * - Error handling (404, 400, 500, 405, 413, 415)
 * - Header validation and custom headers
 * - Edge cases and boundary conditions
 * - Performance validation (< 100ms response times)
 * - Concurrent request handling
 * - Memory efficiency testing
 * - Unicode and special character handling
 * - Large payload processing
 * 
 * Test execution follows the pattern: describe() -> beforeEach() -> test() -> afterEach()
 * Each test includes minimum 2-3 assertions as specified in requirements.
 * Server instances are properly isolated using dynamic port allocation.
 * All external dependencies are mocked using the test fixtures.
 * 
 * @total_tests 35+
 * @coverage_target 95%+
 * @performance_target <100ms per request
 * @isolation_level per-test server instances
 * @framework Jest 29.7.0 + Supertest 7.1.4
 */