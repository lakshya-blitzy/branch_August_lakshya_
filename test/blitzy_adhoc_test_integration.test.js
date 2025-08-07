/**
 * Comprehensive Integration Tests for Express.js Server
 * 
 * Tests complete application flow including middleware pipeline,
 * error handling, performance validation, and resource monitoring.
 * 
 * Coverage Areas:
 * - Complete HTTP request/response cycles
 * - Middleware execution order and functionality
 * - Error propagation through middleware stack
 * - Performance requirements validation
 * - Memory usage monitoring
 * - Concurrent load testing
 * - Server resource consumption
 */

const request = require('supertest');

describe('Express.js Server - Integration Tests', () => {
  let app;
  
  beforeAll(() => {
    // Import app fresh for integration testing
    app = require('../server');
  });

  beforeEach(() => {
    // Spy on console methods to verify logging during integration
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('Complete Request/Response Cycle', () => {
    it('should execute full middleware pipeline for GET /', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Verify response
      expect(response.text).toBe('Hello world');
      expect(response.headers['content-type']).toMatch(/text\/html/);
      
      // Verify middleware logging occurred
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/ - Client: (.+)/)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/ - Status: 200 - Duration: \d+ms/)
      );
    });

    it('should execute full middleware pipeline for GET /evening', async () => {
      const response = await request(app)
        .get('/evening')
        .expect(200);

      // Verify response
      expect(response.text).toBe('Good evening');
      expect(response.headers['content-type']).toMatch(/text\/html/);
      
      // Verify middleware logging occurred
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/evening - Client: (.+)/)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/evening - Status: 200 - Duration: \d+ms/)
      );
    });

    it('should handle 404 errors through complete pipeline', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      // Verify 404 response
      expect(response.text).toBe('Not Found');
      
      // Verify request logging occurred
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/nonexistent - Client: (.+)/)
      );
      
      // Verify 404 warning logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] 404 Not Found: GET \/nonexistent/)
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle 404 errors through complete error pipeline', async () => {
      const response = await request(app)
        .get('/nonexistent-test-route')
        .expect(404);

      // Verify 404 response
      expect(response.text).toBe('Not Found');
      
      // Verify request was logged
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/nonexistent-test-route - Client: (.+)/)
      );
      
      // Verify 404 warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] 404 Not Found: GET \/nonexistent-test-route/)
      );
    });

    it('should log different HTTP methods that result in 404', async () => {
      // Test POST method hitting 404
      const response = await request(app)
        .post('/nonexistent')
        .expect(404);

      // Verify response and logging
      expect(response.text).toBe('Not Found');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] 404 Not Found: POST \/nonexistent/)
      );
    });

    it('should handle complex URLs that result in 404', async () => {
      const complexPath = '/very/long/path/that/does/not/exist?param=value';
      
      const response = await request(app)
        .get(complexPath)
        .expect(404);

      expect(response.text).toBe('Not Found');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`\\[\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z\\] 404 Not Found: GET ${complexPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
      );
    });
  });

  describe('Performance Integration Testing', () => {
    it('should meet response time requirements under normal load', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Verify performance requirement (reasonable response time for testing)
      expect(responseTime).toBeLessThan(100);
      expect(response.text).toBe('Hello world');
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array(concurrentRequests).fill().map(() => 
        request(app).get('/').expect(200)
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.text).toBe('Hello world');
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(50); // Allow more time for concurrent processing
    });

    it('should maintain performance across different endpoints', async () => {
      const endpoints = ['/', '/evening'];
      const expectedResponses = ['Hello world', 'Good evening'];
      
      for (let i = 0; i < endpoints.length; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(endpoints[i])
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        
        expect(response.text).toBe(expectedResponses[i]);
        expect(responseTime).toBeLessThan(100);
      }
    });
  });

  describe('Resource Monitoring', () => {
    it('should monitor memory usage during request processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Process multiple requests to monitor memory
      const requests = Array(20).fill().map(() => 
        request(app).get('/').expect(200)
      );
      
      await Promise.all(requests);
      
      const finalMemory = process.memoryUsage();
      
      // Memory increase should be reasonable
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Should not have significant memory leak (allow 10MB increase for Jest test overhead)
      expect(heapIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
      
      // Total heap usage should be reasonable (accounting for Jest test overhead - <70MB)
      expect(finalMemory.heapUsed).toBeLessThan(70 * 1024 * 1024); // 70MB (Jest + Express)
    });

    it('should handle rapid successive requests without resource exhaustion', async () => {
      const rapidRequests = 50;
      const startTime = Date.now();
      
      // Create rapid succession of requests
      const promises = [];
      for (let i = 0; i < rapidRequests; i++) {
        promises.push(request(app).get('/').expect(200));
      }
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should complete successfully
      expect(responses).toHaveLength(rapidRequests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello world');
      });
      
      // Should complete within reasonable time (10 seconds for 50 requests)
      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Middleware Pipeline Integration', () => {
    it('should execute middleware in correct order', async () => {
      const logCalls = [];
      
      // Capture all console.log calls in order
      console.log.mockImplementation((message) => {
        logCalls.push(message);
      });
      
      await request(app)
        .get('/')
        .expect(200);
      
      // Should have at least 2 log calls: request start and request complete
      expect(logCalls.length).toBeGreaterThanOrEqual(2);
      
      // First call should be request logging
      expect(logCalls[0]).toMatch(/GET \/ - Client:/);
      
      // Last call should be response logging
      expect(logCalls[logCalls.length - 1]).toMatch(/GET \/ - Status: 200 - Duration:/);
    });

    it('should maintain request context through middleware chain', async () => {
      // Test that request data is preserved through the middleware pipeline
      const response = await request(app)
        .get('/evening?test=value')
        .set('User-Agent', 'Integration-Test')
        .expect(200);
      
      expect(response.text).toBe('Good evening');
      
      // Verify that logging included the query parameters
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/GET \/evening\?test=value - Client:/)
      );
    });
  });

  describe('HTTP Protocol Compliance', () => {
    it('should set proper HTTP headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      // Check required HTTP headers
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers).toHaveProperty('content-length');
      expect(response.headers).toHaveProperty('x-powered-by', 'Express');
      
      // Content-Length should match actual content
      expect(response.headers['content-length']).toBe('11'); // "Hello world".length
    });

    it('should handle HTTP/1.1 features correctly', async () => {
      const response = await request(app)
        .get('/')
        .set('Connection', 'keep-alive')
        .expect(200);
      
      expect(response.text).toBe('Hello world');
      // Supertest/Express should handle connection management automatically
    });

    it('should support different accept headers', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
        .expect(200);
      
      expect(response.text).toBe('Hello world');
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });
});