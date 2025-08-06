const request = require('supertest');
const http = require('http');
const SimpleServer = require('../../main/js/server');

describe('SimpleServer', () => {
  let server;
  let httpServer;

  beforeEach(() => {
    // Create a new server instance for each test
    server = new SimpleServer({ port: 0 }); // Use port 0 for automatic assignment
  });

  afterEach(async () => {
    // Clean up after each test
    if (server && server.isRunning) {
      await server.stop();
    }
    if (httpServer) {
      httpServer.close();
    }
  });

  describe('Constructor', () => {
    it('should create server with default options', () => {
      const defaultServer = new SimpleServer();
      expect(defaultServer.port).toBe(3000);
      expect(defaultServer.host).toBe('localhost');
      expect(defaultServer.isRunning).toBe(false);
    });

    it('should create server with custom options', () => {
      const customServer = new SimpleServer({ port: 8080, host: '0.0.0.0' });
      expect(customServer.port).toBe(8080);
      expect(customServer.host).toBe('0.0.0.0');
      expect(customServer.isRunning).toBe(false);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      await expect(server.start()).resolves.toBeDefined();
      expect(server.isRunning).toBe(true);
    });

    it('should not start server if already running', async () => {
      await server.start();
      await expect(server.start()).rejects.toThrow('Server is already running');
    });

    it('should stop server gracefully', async () => {
      await server.start();
      await expect(server.stop()).resolves.toBeUndefined();
      expect(server.isRunning).toBe(false);
    });

    it('should handle stop when server is not running', async () => {
      await expect(server.stop()).resolves.toBeUndefined();
    });

    it('should get server status correctly', async () => {
      const initialStatus = server.getStatus();
      expect(initialStatus.isRunning).toBe(false);
      expect(initialStatus.port).toBe(0); // Should be 0 since we set port: 0 in beforeEach

      await server.start();
      const runningStatus = server.getStatus();
      expect(runningStatus.isRunning).toBe(true);
      expect(runningStatus.port).toBe(0); // Port remains 0 (config), actual port is different
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      await server.start();
      httpServer = server.server;
    });

    describe('Root endpoint (/)', () => {
      it('should return 200 OK with server info', async () => {
        const response = await request(httpServer).get('/');
        
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body).toHaveProperty('message', 'Testinium-QA Server Running');
        expect(response.body).toHaveProperty('version', '1.0.0');
        expect(response.body).toHaveProperty('timestamp');
        expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      });

      it('should include CORS headers', async () => {
        const response = await request(httpServer).get('/');
        
        expect(response.headers['access-control-allow-origin']).toBe('*');
        expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PUT, DELETE');
        expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
      });
    });

    describe('Health endpoint (/health)', () => {
      it('should return health status', async () => {
        const response = await request(httpServer).get('/health');
        
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('memory');
        expect(typeof response.body.uptime).toBe('number');
        expect(response.body.memory).toHaveProperty('rss');
        expect(response.body.memory).toHaveProperty('heapUsed');
      });
    });

    describe('API Test endpoint (/api/test)', () => {
      it('should handle GET requests', async () => {
        const response = await request(httpServer).get('/api/test');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          method: 'GET',
          data: 'test data'
        });
      });

      it('should handle POST requests with JSON data', async () => {
        const testData = { name: 'test', value: 123 };
        const response = await request(httpServer)
          .post('/api/test')
          .send(testData);
        
        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          method: 'POST',
          endpoint: '/api/test',
          received: testData,
          created: true
        });
      });

      it('should handle POST requests with empty body', async () => {
        const response = await request(httpServer).post('/api/test');
        
        expect(response.status).toBe(201);
        expect(response.body.received).toEqual({});
      });

      it('should handle PUT requests', async () => {
        const response = await request(httpServer).put('/api/test');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          method: 'PUT',
          updated: true
        });
      });

      it('should handle DELETE requests', async () => {
        const response = await request(httpServer).delete('/api/test');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          method: 'DELETE',
          deleted: true
        });
      });

      it('should return 405 for unsupported methods', async () => {
        const response = await request(httpServer).patch('/api/test');
        
        expect(response.status).toBe(405);
        expect(response.body).toEqual({
          error: 'Method not allowed'
        });
      });
    });

    describe('API Data endpoint (/api/data)', () => {
      it('should return data on GET request', async () => {
        const response = await request(httpServer).get('/api/data');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ]
        });
      });

      it('should return 405 for non-GET methods', async () => {
        const response = await request(httpServer).post('/api/data');
        
        expect(response.status).toBe(405);
        expect(response.body).toEqual({
          error: 'Method not allowed'
        });
      });
    });

    describe('404 Not Found', () => {
      it('should return 404 for unknown endpoints', async () => {
        const response = await request(httpServer).get('/unknown');
        
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          error: 'Not Found'
        });
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await server.start();
      httpServer = server.server;
    });

    it('should handle invalid JSON in POST requests', async () => {
      const response = await request(httpServer)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('invalid json{');
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid JSON'
      });
    });

    it('should handle port already in use error', async () => {
      const server2 = new SimpleServer({ port: server.server.address().port });
      
      await expect(server2.start()).rejects.toThrow('Port');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await server.start();
      httpServer = server.server;
    });

    it('should handle very large request bodies', async () => {
      const largeData = { content: 'x'.repeat(10000) };
      const response = await request(httpServer)
        .post('/api/test')
        .send(largeData);
      
      expect(response.status).toBe(201);
      expect(response.body.received.content).toBe(largeData.content);
    }, 10000); // Increase timeout for large requests

    it('should handle Unicode characters in request', async () => {
      const unicodeData = { message: 'Hello 世界 🌍' };
      const response = await request(httpServer)
        .post('/api/test')
        .send(unicodeData);
      
      expect(response.status).toBe(201);
      expect(response.body.received.message).toBe(unicodeData.message);
    });

    it('should handle empty string paths', async () => {
      const response = await request(httpServer).get('');
      
      expect(response.status).toBe(200); // Should route to '/'
    });

    it('should handle multiple rapid requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(httpServer).get('/health')
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Security Considerations', () => {
    beforeEach(async () => {
      await server.start();
      httpServer = server.server;
    });

    it('should not expose server implementation details in errors', async () => {
      const response = await request(httpServer).get('/api/test');
      
      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('server');
    });

    it('should handle special characters in URLs safely', async () => {
      const response = await request(httpServer).get('/api/%2E%2E%2F%2E%2E%2Fetc%2Fpasswd');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found'
      });
    });
  });

  describe('Performance Boundaries', () => {
    beforeEach(async () => {
      await server.start();
      httpServer = server.server;
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await request(httpServer).get('/');
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(100); // Should respond within 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 50 }, () =>
        request(httpServer).get('/health')
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);
  });
});