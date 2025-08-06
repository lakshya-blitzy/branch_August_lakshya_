const request = require('supertest');
const { app, startServer, stopServer, PORT, routes } = require('../../main/js/server');

describe('SimpleServer Integration Tests', () => {
  let serverInstance;
  let httpServer;

  beforeAll(async () => {
    // Start server once for all integration tests
    const serverInfo = await startServer(0); // Use port 0 for dynamic allocation
    serverInstance = serverInfo.server;
    httpServer = serverInfo.server;
  });

  afterAll(async () => {
    // Clean up after all tests
    if (serverInstance || httpServer) {
      await stopServer();
    }
  });

  describe('Complete Request/Response Cycles', () => {
    it('should handle a complete GET workflow', async () => {
      // Step 1: Health check
      const healthResponse = await request(httpServer).get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('healthy');

      // Step 2: Get data
      const dataResponse = await request(httpServer).get('/api/data');
      expect(dataResponse.status).toBe(200);
      expect(dataResponse.body).toHaveProperty('method', 'GET');
      expect(dataResponse.body).toHaveProperty('path', '/api/data');

      // Step 3: Test endpoint
      const testResponse = await request(httpServer).get('/api/test');
      expect(testResponse.status).toBe(200);
      expect(testResponse.body.method).toBe('GET');
    });

    it('should handle a complete POST workflow', async () => {
      const testData = {
        username: 'testuser',
        email: 'test@example.com',
        timestamp: new Date().toISOString()
      };

      // Post data
      const postResponse = await request(httpServer)
        .post('/api/test')
        .send(testData);

      expect(postResponse.status).toBe(201);
      expect(postResponse.body.method).toBe('POST');
      expect(postResponse.body.received).toEqual(testData);
      expect(postResponse.body.created).toBe(true);
      expect(postResponse.body).toHaveProperty('path', '/api/test');
    });

    it('should handle a complete CRUD-like workflow', async () => {
      const testData = { id: 1, name: 'Test Item', value: 42 };

      // Create (POST)
      const createResponse = await request(httpServer)
        .post('/api/test')
        .send(testData);
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.created).toBe(true);

      // Read (GET)
      const readResponse = await request(httpServer).get('/api/test');
      expect(readResponse.status).toBe(200);
      expect(readResponse.body.method).toBe('GET');

      // Update (PUT)
      const updateResponse = await request(httpServer).put('/api/test');
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('updated', {});
      expect(updateResponse.body).toHaveProperty('method', 'PUT');

      // Delete (DELETE)
      const deleteResponse = await request(httpServer).delete('/api/test');
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.deleted).toBe(true);
    });
  });

  describe('Error Propagation Through System', () => {
    it('should propagate 404 errors correctly', async () => {
      const response = await request(httpServer).get('/nonexistent/endpoint');
      
      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('path', '/nonexistent/endpoint');
      expect(response.body).toHaveProperty('message', 'The requested resource was not found');
    });

    it('should propagate method not allowed errors', async () => {
      const response = await request(httpServer).patch('/api/data');
      
      expect(response.status).toBe(405);
      expect(response.body).toHaveProperty('error', 'Method not allowed');
      expect(response.body).toHaveProperty('allowedMethods');
      expect(response.body.allowedMethods).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(httpServer)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid JSON in request body');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('Middleware Chain Execution', () => {
    it('should apply CORS headers to all responses', async () => {
      const endpoints = ['/', '/health', '/api/test', '/api/data', '/nonexistent'];
      
      for (const endpoint of endpoints) {
        const response = await request(httpServer).get(endpoint);
        
        expect(response.headers['access-control-allow-origin']).toBe('*');
        expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
        expect(response.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
      }
    });

    it('should set JSON content type for all API responses', async () => {
      const endpoints = ['/', '/health', '/api/test', '/api/data'];
      
      for (const endpoint of endpoints) {
        const response = await request(httpServer).get(endpoint);
        expect(response.headers['content-type']).toBe('application/json');
      }
    });
  });

  describe('Server State Management', () => {
    it('should maintain consistent state across requests', async () => {
      // Make multiple requests to verify server state consistency
      const responses = await Promise.all([
        request(httpServer).get('/health'),
        request(httpServer).get('/'),
        request(httpServer).get('/api/data'),
        request(httpServer).get('/health')
      ]);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(400);
      });

      // Health checks should show consistent uptime progression
      const firstHealth = responses[0].body;
      const secondHealth = responses[3].body;
      
      expect(secondHealth.uptime).toBeGreaterThanOrEqual(firstHealth.uptime);
      expect(secondHealth.status).toBe('healthy');
      expect(firstHealth.status).toBe('healthy');
    });

    it('should handle memory correctly across multiple requests', async () => {
      const initialHealth = await request(httpServer).get('/health');
      const initialMemory = initialHealth.body.memory;

      // Make several requests with data
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(httpServer)
          .post('/api/test')
          .send({ iteration: i, data: 'x'.repeat(1000) })
      );

      await Promise.all(requests);

      const finalHealth = await request(httpServer).get('/health');
      const finalMemory = finalHealth.body.memory;

      // Memory should still be reasonable (not indicating major leaks)
      expect(finalMemory.heapUsed).toBeGreaterThan(0);
      expect(finalMemory.rss).toBeGreaterThan(0);
      
      // Memory should not have grown excessively (basic leak detection)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle a typical API client workflow', async () => {
      // Simulate a client connecting and performing operations
      
      // 1. Client checks if server is available
      const healthCheck = await request(httpServer).get('/health');
      expect(healthCheck.status).toBe(200);
      
      // 2. Client fetches server info
      const serverInfo = await request(httpServer).get('/');
      expect(serverInfo.status).toBe(200);
      expect(serverInfo.body.message).toBe('Testinium-QA Server Running');
      
      // 3. Client retrieves data
      const data = await request(httpServer).get('/api/data');
      expect(data.status).toBe(200);
      expect(data.body).toHaveProperty('method', 'GET');
      expect(data.body).toHaveProperty('path', '/api/data');
      
      // 4. Client submits new data
      const submitData = await request(httpServer)
        .post('/api/test')
        .send({
          sessionId: 'test-session-123',
          testResults: [
            { test: 'login', status: 'passed' },
            { test: 'navigation', status: 'passed' }
          ]
        });
      
      expect(submitData.status).toBe(201);
      expect(submitData.body.created).toBe(true);
      
      // 5. Client performs cleanup
      const cleanup = await request(httpServer).delete('/api/test');
      expect(cleanup.status).toBe(200);
      expect(cleanup.body.deleted).toBe(true);
    });

    it('should handle concurrent client sessions', async () => {
      const clientSessions = Array.from({ length: 5 }, (_, sessionId) => {
        return Promise.all([
          request(httpServer).get('/health'),
          request(httpServer).get('/api/data'),
          request(httpServer)
            .post('/api/test')
            .send({ sessionId: `session-${sessionId}`, action: 'test' }),
          request(httpServer).put('/api/test'),
          request(httpServer).delete('/api/test')
        ]);
      });

      const allResponses = await Promise.all(clientSessions);
      
      // Verify all sessions completed successfully
      allResponses.forEach(sessionResponses => {
        expect(sessionResponses[0].status).toBe(200); // health
        expect(sessionResponses[1].status).toBe(200); // get data
        expect(sessionResponses[2].status).toBe(201); // post
        expect(sessionResponses[3].status).toBe(200); // put
        expect(sessionResponses[4].status).toBe(200); // delete
      });
    });
  });

  describe('Network and Protocol Compliance', () => {
    it('should handle HTTP/1.1 keep-alive correctly', async () => {
      // Make multiple requests on the same connection
      const agent = request.agent(httpServer);
      
      const response1 = await agent.get('/health');
      const response2 = await agent.get('/api/data');
      const response3 = await agent.get('/');
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });

    it('should handle different content types correctly', async () => {
      // Test with different content types
      const jsonResponse = await request(httpServer)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send({ type: 'json' });
      
      expect(jsonResponse.status).toBe(201);
      expect(jsonResponse.body.received.type).toBe('json');
    });

    it('should validate HTTP method semantics', async () => {
      // GET should be idempotent (except for timestamps)
      const get1 = await request(httpServer).get('/api/data');
      const get2 = await request(httpServer).get('/api/data');
      
      // Compare all fields except timestamp
      expect(get1.body.method).toEqual(get2.body.method);
      expect(get1.body.path).toEqual(get2.body.path);
      expect(get1.body.query).toEqual(get2.body.query);
      expect(get1.body.message).toEqual(get2.body.message);
      
      // Timestamps should be different due to timing
      expect(get1.body.timestamp).toBeDefined();
      expect(get2.body.timestamp).toBeDefined();
      
      // POST should create/modify state (different response each time)
      const post1 = await request(httpServer)
        .post('/api/test')
        .send({ timestamp: Date.now() });
      const post2 = await request(httpServer)
        .post('/api/test') 
        .send({ timestamp: Date.now() });
      
      expect(post1.status).toBe(201);
      expect(post2.status).toBe(201);
      // Both should succeed but timestamps will differ
    });
  });
});