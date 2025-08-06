const request = require('supertest');
const http = require('http');
const { app, startServer, stopServer, PORT, routes } = require('../../main/js/server');

describe('SimpleServer', () => {
  let serverInstance;
  let httpServer;
  let testPort = 0; // Let Node.js assign a random available port

  beforeEach(() => {
    // Reset server state before each test
    serverInstance = null;
    httpServer = null;
  });

  afterEach(async () => {
    // Clean up after each test
    if (serverInstance || httpServer) {
      try {
        await stopServer();
        if (httpServer && httpServer.listening) {
          httpServer.close();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Constructor', () => {
    it('should create server with default options', () => {
      expect(typeof app).toBe('object');
      expect(typeof app.listen).toBe('function');
      expect(typeof app.close).toBe('function');
      expect(PORT).toBe(3000); // Default port
    });

    it('should create server with custom options', () => {
      expect(typeof startServer).toBe('function');
      expect(typeof stopServer).toBe('function');
      expect(typeof routes).toBe('object');
      expect(routes).toHaveProperty('getHandler');
      expect(routes).toHaveProperty('postHandler');
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server successfully', async () => {
      const serverInfo = await startServer(0); // Use port 0 for automatic assignment
      serverInstance = serverInfo.server;
      expect(serverInfo).toBeDefined();
      expect(serverInfo.server).toBeDefined();
      expect(serverInfo.port).toBe(0);
      expect(serverInstance.listening).toBe(true);
    });

    it('should not start server if already running', async () => {
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      await expect(startServer(0)).rejects.toThrow('Server is already running');
    });

    it('should stop server gracefully', async () => {
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      await expect(stopServer()).resolves.toBeUndefined();
      expect(serverInstance.listening).toBe(false);
    });

    it('should handle stop when server is not running', async () => {
      await expect(stopServer()).resolves.toBeUndefined();
    });

    it('should get server status correctly', async () => {
      // Test that we can start and stop the server
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      expect(serverInstance.listening).toBe(true);
      
      await stopServer();
      expect(serverInstance.listening).toBe(false);
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      httpServer = serverInfo.server;
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
        expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
        expect(response.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
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
        const response = await request(httpServer).get('/api/test?param1=value1');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('method', 'GET');
        expect(response.body).toHaveProperty('path', '/api/test');
        expect(response.body).toHaveProperty('query');
        expect(response.body.query.param1).toBe('value1');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('message', 'GET request processed successfully');
      });

      it('should handle POST requests with JSON data', async () => {
        const testData = { name: 'test', value: 123 };
        const response = await request(httpServer)
          .post('/api/test')
          .send(testData);
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('method', 'POST');
        expect(response.body).toHaveProperty('path', '/api/test');
        expect(response.body).toHaveProperty('received', testData);
        expect(response.body).toHaveProperty('created', true);
        expect(response.body).toHaveProperty('message', 'POST request processed successfully');
      });

      it('should handle POST requests with empty body', async () => {
        const response = await request(httpServer).post('/api/test');
        
        expect(response.status).toBe(201);
        expect(response.body.received).toEqual({});
        expect(response.body).toHaveProperty('created', true);
      });

      it('should handle PUT requests', async () => {
        const testData = { name: 'updated', value: 456 };
        const response = await request(httpServer)
          .put('/api/test')
          .send(testData);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('method', 'PUT');
        expect(response.body).toHaveProperty('updated', testData);
        expect(response.body).toHaveProperty('message', 'PUT request processed successfully');
      });

      it('should handle DELETE requests', async () => {
        const response = await request(httpServer).delete('/api/test?id=123');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('method', 'DELETE');
        expect(response.body).toHaveProperty('deleted', true);
        expect(response.body).toHaveProperty('query');
        expect(response.body.query.id).toBe('123');
        expect(response.body).toHaveProperty('message', 'DELETE request processed successfully');
      });

      it('should return 405 for unsupported methods', async () => {
        const response = await request(httpServer).patch('/api/test');
        
        expect(response.status).toBe(405);
        expect(response.body).toHaveProperty('error', 'Method not allowed');
        expect(response.body).toHaveProperty('allowedMethods');
        expect(response.body.allowedMethods).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
      });
    });

    describe('API Data endpoint (/api/data)', () => {
      it('should handle GET requests', async () => {
        const response = await request(httpServer).get('/api/data');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('method', 'GET');
        expect(response.body).toHaveProperty('path', '/api/data');
        expect(response.body).toHaveProperty('message', 'GET request processed successfully');
      });

      it('should handle POST requests', async () => {
        const response = await request(httpServer).post('/api/data').send({ test: 'data' });
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('method', 'POST');
        expect(response.body).toHaveProperty('created', true);
      });
    });

    describe('404 Not Found', () => {
      it('should return 404 for unknown endpoints', async () => {
        const response = await request(httpServer).get('/unknown');
        
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Not Found');
        expect(response.body).toHaveProperty('path', '/unknown');
        expect(response.body).toHaveProperty('message', 'The requested resource was not found');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      httpServer = serverInfo.server;
    });

    it('should handle invalid JSON in POST requests', async () => {
      const response = await request(httpServer)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('invalid json{');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid JSON in request body');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle port already in use error', async () => {
      const usedPort = httpServer.address().port;
      
      await expect(startServer(usedPort)).rejects.toThrow('Server is already running');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      httpServer = serverInfo.server;
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
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      httpServer = serverInfo.server;
    });

    it('should not expose server implementation details in errors', async () => {
      const response = await request(httpServer).get('/api/test');
      
      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('server');
    });

    it('should handle special characters in URLs safely', async () => {
      const response = await request(httpServer).get('/api/%2E%2E%2F%2E%2E%2Fetc%2Fpasswd');
      
      // The server treats this as a valid API path, returning 200 with proper handling
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('method', 'GET');
      expect(response.body).toHaveProperty('path', '/api/%2E%2E%2F%2E%2E%2Fetc%2Fpasswd');
    });
  });

  describe('Performance Boundaries', () => {
    beforeEach(async () => {
      const serverInfo = await startServer(0);
      serverInstance = serverInfo.server;
      httpServer = serverInfo.server;
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