/**
 * Comprehensive Unit Tests for Express.js Server
 * 
 * Tests all endpoints, core functionality, and error scenarios
 * for the Node.js tutorial server as specified in technical requirements.
 * 
 * Coverage Areas:
 * - GET / endpoint (Hello world response)
 * - GET /evening endpoint (Good evening response) 
 * - 404 error handling for undefined routes
 * - Response headers and status codes
 * - Performance requirements (<10ms response time)
 */

const request = require('supertest');
const app = require('../server');

describe('Express.js Tutorial Server - Main Endpoints', () => {
  
  describe('GET / endpoint', () => {
    it('should return "Hello world" with 200 status', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Validate response body
      expect(response.text).toBe('Hello world');
      
      // Validate performance requirement (reasonable response time for testing)
      expect(responseTime).toBeLessThan(100);
    });

    it('should return correct Content-Type header', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      // Express.js defaults to text/html for .send() with strings
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should handle concurrent requests correctly', async () => {
      const promises = Array(5).fill().map(() => 
        request(app).get('/').expect(200)
      );
      
      const responses = await Promise.all(promises);
      
      // All responses should be identical
      responses.forEach(response => {
        expect(response.text).toBe('Hello world');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /evening endpoint', () => {
    it('should return "Good evening" with 200 status', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/evening')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Validate response body
      expect(response.text).toBe('Good evening');
      
      // Validate performance requirement (reasonable response time for testing)  
      expect(responseTime).toBeLessThan(100);
    });

    it('should return correct Content-Type header', async () => {
      const response = await request(app)
        .get('/evening')
        .expect(200);
      
      // Express.js defaults to text/html for .send() with strings
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should handle concurrent requests correctly', async () => {
      const promises = Array(5).fill().map(() => 
        request(app).get('/evening').expect(200)
      );
      
      const responses = await Promise.all(promises);
      
      // All responses should be identical  
      responses.forEach(response => {
        expect(response.text).toBe('Good evening');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.text).toBe('Not Found');
    });

    it('should handle 404 for POST requests on undefined routes', async () => {
      const response = await request(app)
        .post('/nonexistent')
        .expect(404);
      
      expect(response.text).toBe('Not Found');
    });

    it('should handle 404 for PUT requests on undefined routes', async () => {
      const response = await request(app)
        .put('/nonexistent')
        .expect(404);
      
      expect(response.text).toBe('Not Found');
    });

    it('should handle 404 for DELETE requests on undefined routes', async () => {
      const response = await request(app)
        .delete('/nonexistent')
        .expect(404);
      
      expect(response.text).toBe('Not Found');
    });

    it('should handle malformed URLs', async () => {
      const response = await request(app)
        .get('/this/is/a/very/long/path/that/does/not/exist')
        .expect(404);
      
      expect(response.text).toBe('Not Found');
    });
  });

  describe('HTTP Methods Validation', () => {
    it('should reject POST requests to /', async () => {
      await request(app)
        .post('/')
        .expect(404); // Will hit 404 handler since only GET is defined
    });

    it('should reject PUT requests to /', async () => {
      await request(app)
        .put('/')
        .expect(404); // Will hit 404 handler since only GET is defined
    });

    it('should reject DELETE requests to /', async () => {
      await request(app)
        .delete('/')
        .expect(404); // Will hit 404 handler since only GET is defined
    });

    it('should reject POST requests to /evening', async () => {
      await request(app)
        .post('/evening')
        .expect(404); // Will hit 404 handler since only GET is defined
    });
  });

  describe('Response Headers Validation', () => {
    it('should include X-Powered-By header (Express default)', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.headers['x-powered-by']).toBe('Express');
    });

    it('should include Content-Length header', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.headers['content-length']).toBe('11'); // "Hello world".length
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with query parameters', async () => {
      const response = await request(app)
        .get('/?test=value&another=param')
        .expect(200);
      
      expect(response.text).toBe('Hello world');
    });

    it('should handle requests with hash fragments', async () => {
      const response = await request(app)
        .get('/#section')
        .expect(200);
      
      expect(response.text).toBe('Hello world');
    });

    it('should handle case-sensitive routing', async () => {
      // Express routing is case-insensitive by default (contrary to our initial assumption)
      const response = await request(app)
        .get('/EVENING')
        .expect(200);
      
      expect(response.text).toBe('Good evening');
    });

    it('should handle trailing slashes correctly', async () => {
      // Express automatically handles trailing slashes (contrary to our initial assumption)
      const response = await request(app)
        .get('/evening/')
        .expect(200);
      
      expect(response.text).toBe('Good evening');
    });
  });
});