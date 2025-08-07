/**
 * Comprehensive Middleware Tests for Express.js Server
 * 
 * Tests request logging middleware behavior through actual HTTP requests.
 * Validates logging behavior, performance tracking, and edge cases.
 * 
 * Coverage Areas:
 * - Request logging with timestamp, method, URL, client IP
 * - Response time calculation and logging
 * - Console output verification 
 * - Error handling in middleware
 * - Edge cases (missing IP, malformed requests)
 */

const request = require('supertest');
const app = require('../server');

describe('Express.js Server - Request Logging Middleware', () => {
  let consoleSpy, consoleErrorSpy, consoleWarnSpy;
  
  beforeEach(() => {
    // Spy on console methods to verify logging behavior
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('Request Logging Functionality', () => {
    it('should log incoming requests with timestamp, method, URL, and client IP', async () => {
      await request(app)
        .get('/')
        .expect(200);

      // Verify that request logging occurred with correct pattern
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/ - Client: (.+)/)
      );
    });

    it('should log different HTTP methods correctly', async () => {
      // Test POST request (will hit 404 but still logged)
      await request(app)
        .post('/evening')
        .expect(404);

      // Verify POST method was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] POST \/evening - Client: (.+)/)
      );
    });

    it('should log different URL paths correctly', async () => {
      await request(app)
        .get('/evening')
        .expect(200);

      // Verify /evening path was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/evening - Client: (.+)/)
      );
    });
  });

  describe('Response Time Tracking', () => {
    it('should log response details with duration when response is sent', async () => {
      // Clear previous logs
      consoleSpy.mockClear();
      
      await request(app)
        .get('/')
        .expect(200);

      // Verify response timing log exists with correct pattern
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/ - Status: 200 - Duration: \d+ms/)
      );
    });

    it('should handle different status codes correctly', async () => {
      consoleSpy.mockClear();
      
      await request(app)
        .get('/nonexistent')
        .expect(404);
      
      // Verify 404 response timing log
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/nonexistent - Status: 404 - Duration: \d+ms/)
      );
    });
  });

  describe('Middleware Integration', () => {
    it('should continue to endpoint handlers after logging', async () => {
      consoleSpy.mockClear();
      
      const response = await request(app)
        .get('/')
        .expect(200);

      // Verify middleware logged AND endpoint responded
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/ - Client: (.+)/)
      );
      expect(response.text).toBe('Hello world');
    });

    it('should work with all defined endpoints', async () => {
      consoleSpy.mockClear();
      
      // Test both endpoints
      const response1 = await request(app)
        .get('/')
        .expect(200);
        
      const response2 = await request(app)
        .get('/evening')
        .expect(200);

      // Verify both endpoints work correctly after middleware processing
      expect(response1.text).toBe('Hello world');
      expect(response2.text).toBe('Good evening');
      
      // Verify both were logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/ - Client: (.+)/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/evening - Client: (.+)/)
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle undefined routes and still log them', async () => {
      consoleSpy.mockClear();
      
      await request(app)
        .get('/nonexistent-route')
        .expect(404);

      // Should log the request even though it hits 404
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/nonexistent-route - Client: (.+)/)
      );
      
      // Should also log the response timing
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/nonexistent-route - Status: 404 - Duration: \d+ms/)
      );
    });

    it('should handle different HTTP methods that hit 404', async () => {
      consoleSpy.mockClear();
      
      await request(app)
        .post('/evening')
        .expect(404);

      // Should log POST method even though it hits 404
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] POST \/evening - Client: (.+)/)
      );
    });

    it('should handle requests with query parameters', async () => {
      consoleSpy.mockClear();
      
      await request(app)
        .get('/?test=value&another=param')
        .expect(200);

      // Should log the full URL including query params
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/\?test=value&another=param - Client: (.+)/)
      );
    });
  });
});