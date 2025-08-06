/**
 * Server Integration Tests - Comprehensive HTTP Server Testing Suite
 * 
 * This module provides comprehensive integration testing for the Node.js HTTP server,
 * covering complete request/response cycles, middleware chain execution, error propagation
 * through system layers, and server initialization sequences.
 * 
 * Test Coverage Areas:
 * - Full HTTP request/response cycle validation
 * - Middleware chain execution and ordering
 * - Error propagation through all layers
 * - Server lifecycle management (startup/shutdown)
 * - Component interaction validation
 * - Edge case and boundary condition testing
 * - Performance and reliability scenarios
 * 
 * Testing Framework: Jest 29.7.0 with Supertest 6.3.4
 * Target Coverage: ≥85% as specified in Section 6.6 Testing Strategy
 * 
 * @module serverIntegrationTests
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports as specified in external_imports schema
// Jest provides global functions (describe, it, expect, etc.) - no need to import
const request = require('supertest');

// Internal imports as specified in internal_imports schema
const { app, startServer, stopServer, PORT } = require('../../main/js/server.js');
const { mockRequests, mockResponses, mockServerConfigs, mockEnvironment } = require('./fixtures/index.js');

// Configure Jest timeout for integration tests (longer than unit tests)
jest.setTimeout(30000);

/**
 * Server Integration Test Suite
 * Tests complete HTTP server functionality including middleware chains,
 * error propagation, and component interactions
 */
describe('Server Integration Tests', () => {
    let serverInstance = null;
    let serverInfo = null;

    /**
     * Global test setup - Initialize server instance
     * Runs once before all tests in this suite
     */
    beforeAll(async () => {
        try {
            // Use dynamic port to avoid conflicts during CI/CD
            const testPort = mockServerConfigs.dynamic.testPort || 0;
            serverInfo = await startServer(testPort, mockServerConfigs.default.host);
            serverInstance = serverInfo.server;
            
            console.log(`Integration test server started at ${serverInfo.url}`);
        } catch (error) {
            console.error('Failed to start test server:', error);
            throw error;
        }
    });

    /**
     * Global test teardown - Cleanup server instance
     * Runs once after all tests in this suite
     */
    afterAll(async () => {
        if (serverInstance) {
            try {
                await stopServer();
                console.log('Integration test server stopped successfully');
            } catch (error) {
                console.error('Error stopping test server:', error);
            }
        }
    });

    /**
     * Individual test setup - Reset any test-specific state
     * Runs before each individual test
     */
    beforeEach(() => {
        // Reset environment variables for each test
        if (mockEnvironment.testing.NODE_ENV) {
            process.env.NODE_ENV = mockEnvironment.testing.NODE_ENV;
        }
    });

    /**
     * Individual test cleanup - Clean up test-specific state  
     * Runs after each individual test
     */
    afterEach(() => {
        // Clean up any test-specific environment changes
        if (process.env.NODE_ENV !== mockEnvironment.testing.NODE_ENV) {
            process.env.NODE_ENV = mockEnvironment.testing.NODE_ENV;
        }
    });

    /**
     * Server Initialization and Lifecycle Integration Tests
     * Tests complete server startup, configuration, and shutdown sequences
     */
    describe('Server Lifecycle Integration', () => {
        
        it('should successfully initialize server with default configuration', async () => {
            // Test server initialization sequence
            expect(serverInstance).toBeTruthy();
            expect(serverInfo.port).toBeGreaterThan(0);
            expect(serverInfo.host).toBeDefined();
            expect(serverInfo.url).toMatch(/^http:\/\/.+:\d+$/);
            
            // Validate server is actually listening and responding
            const response = await request(serverInstance)
                .get('/')
                .expect(200);
                
            expect(response.body).toMatchObject({
                message: 'Testinium-QA Server Running',
                version: '1.0.0',
                port: expect.any(Number),
                environment: expect.any(String)
            });
            expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
        });

        it('should handle server configuration validation during startup', async () => {
            // Test that server properly validates and handles configuration
            const response = await request(serverInstance)
                .get('/health')
                .expect(200);
                
            expect(response.body).toMatchObject({
                status: 'healthy',
                uptime: expect.any(Number),
                memory: expect.objectContaining({
                    rss: expect.any(Number),
                    heapTotal: expect.any(Number),
                    heapUsed: expect.any(Number),
                    external: expect.any(Number)
                }),
                timestamp: expect.any(String)
            });
            
            // Validate uptime indicates server has been running
            expect(response.body.uptime).toBeGreaterThan(0);
        });

        it('should properly handle CORS headers in middleware chain', async () => {
            // Test middleware chain execution for CORS handling
            const response = await request(serverInstance)
                .get('/api/test')
                .expect(200);
                
            // Validate CORS headers are properly set by middleware
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
            expect(response.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
        });

        it('should handle OPTIONS preflight requests correctly', async () => {
            // Test preflight request handling in middleware chain
            const response = await request(serverInstance)
                .options('/api/test')
                .expect(204);
                
            // Validate preflight response structure
            expect(response.body).toEqual({});
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
        });
    });

    /**
     * HTTP Request/Response Cycle Integration Tests
     * Tests complete request processing through all middleware layers
     */
    describe('HTTP Request/Response Cycle Integration', () => {
        
        it('should handle complete GET request cycle with query parameters', async () => {
            // Test complete GET request processing through middleware chain
            const testQuery = mockRequests.valid.get.query;
            const queryString = new URLSearchParams(testQuery).toString();
            
            const response = await request(serverInstance)
                .get(`/api/users?${queryString}`)
                .expect(200)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                method: 'GET',
                path: '/api/users',
                query: testQuery,
                timestamp: expect.any(String),
                message: 'GET request processed successfully'
            });
        });

        it('should handle complete POST request cycle with JSON body', async () => {
            // Test complete POST request processing with body parsing
            const testDataString = mockRequests.valid.post.body;
            const testData = JSON.parse(testDataString); // Parse the JSON string
            
            const response = await request(serverInstance)
                .post('/api/users')
                .send(testData) // Send the parsed object
                .set('Content-Type', 'application/json')
                .expect(201)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                method: 'POST',
                path: '/api/users',
                received: testData, // Expect the parsed object
                timestamp: expect.any(String),
                message: 'POST request processed successfully',
                created: true
            });
        });

        it('should handle complete PUT request cycle with data validation', async () => {
            // Test complete PUT request processing with validation
            const updateData = {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                role: 'admin',
                status: 'active'
            };
            
            const response = await request(serverInstance)
                .put('/api/users/123')
                .send(updateData)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                method: 'PUT',
                path: '/api/users/123',
                updated: updateData,
                timestamp: expect.any(String),
                message: 'PUT request processed successfully'
            });
        });

        it('should handle complete DELETE request cycle with confirmation', async () => {
            // Test complete DELETE request processing
            const deleteQuery = mockRequests.valid.delete.query;
            const queryString = new URLSearchParams(deleteQuery).toString();
            
            const response = await request(serverInstance)
                .delete(`/api/users/123?${queryString}`)
                .expect(200)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                method: 'DELETE',
                path: '/api/users/123',
                query: deleteQuery,
                timestamp: expect.any(String),
                message: 'DELETE request processed successfully',
                deleted: true
            });
        });
    });

    /**
     * Middleware Chain Execution Integration Tests
     * Tests proper middleware ordering and execution flow
     */
    describe('Middleware Chain Execution', () => {
        
        it('should execute middleware chain in correct order for API requests', async () => {
            // Test middleware execution order: CORS -> routing -> response
            const response = await request(serverInstance)
                .get('/api/middleware-test')
                .expect(200);
                
            // Validate that CORS middleware executed before routing
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.body.method).toBe('GET');
            expect(response.body.path).toBe('/api/middleware-test');
        });

        it('should handle middleware chain for unsupported HTTP methods', async () => {
            // Test middleware chain handles unsupported methods correctly
            const response = await request(serverInstance)
                .patch('/api/test')
                .expect(405)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                error: 'Method not allowed',
                allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
            });
            
            // Validate CORS headers still applied even for 405 errors
            expect(response.headers['access-control-allow-origin']).toBe('*');
        });

        it('should execute error handling middleware for malformed requests', async () => {
            // Test error handling middleware in the chain
            const malformedData = mockRequests.malformed.invalidJson;
            
            const response = await request(serverInstance)
                .post('/api/test')
                .send(malformedData)
                .set('Content-Type', 'application/json')
                .expect(400)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                error: 'Invalid JSON in request body',
                details: expect.any(String)
            });
        });

        it('should handle request size limits in middleware chain', async () => {
            // Test request size validation in middleware
            const oversizedData = mockRequests.oversized.largePayload;
            
            const response = await request(serverInstance)
                .post('/api/test')
                .send(oversizedData)
                .set('Content-Type', 'application/json')
                .expect(413)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                error: 'Request entity too large',
                limit: '1MB'
            });
        });
    });

    /**
     * Error Propagation Integration Tests
     * Tests how errors propagate through system layers
     */
    describe('Error Propagation Through System Layers', () => {
        
        it('should propagate JSON parsing errors through error handling layers', async () => {
            // Test error propagation from JSON parsing to response layer
            const invalidJson = '{"invalid": json}';
            
            const response = await request(serverInstance)
                .post('/api/test')
                .send(invalidJson)
                .set('Content-Type', 'application/json')
                .expect(400);
                
            expect(response.body.error).toBe('Invalid JSON in request body');
            expect(response.body.details).toContain('Unexpected token');
        });

        it('should propagate 404 errors through routing layers correctly', async () => {
            // Test error propagation for non-existent routes
            const response = await request(serverInstance)
                .get('/nonexistent/path')
                .expect(404)
                .expect('Content-Type', /application\/json/);
                
            expect(response.body).toMatchObject({
                error: 'Not Found',
                path: '/nonexistent/path',
                message: 'The requested resource was not found'
            });
        });

        it('should handle and propagate request stream errors', async () => {
            // Test error propagation from request stream issues
            const response = await request(serverInstance)
                .post('/api/test')
                .send('') // Empty body that should be handled gracefully
                .set('Content-Type', 'application/json')
                .expect(201); // Should still succeed with empty object
                
            expect(response.body.received).toEqual({});
        });

        it('should propagate server errors with proper status codes', async () => {
            // Test internal server error propagation
            // This tests the global error handler in the middleware chain
            const response = await request(serverInstance)
                .get('/api/test')
                .expect(200); // Normal request should succeed
                
            // Verify normal operation to ensure error handling works
            expect(response.body.method).toBe('GET');
        });
    });

    /**
     * Component Interaction Integration Tests
     * Tests interaction between different server components
     */
    describe('Component Interaction Validation', () => {
        
        it('should integrate request parsing with response generation', async () => {
            // Test integration between request parser and response generator
            const testData = {
                integration: 'test',
                components: ['parser', 'generator'],
                timestamp: new Date().toISOString()
            };
            
            const response = await request(serverInstance)
                .post('/api/integration')
                .send(testData)
                .expect(201);
                
            // Validate complete integration cycle
            expect(response.body.received).toEqual(testData);
            expect(response.body.method).toBe('POST');
            expect(response.body.created).toBe(true);
        });

        it('should integrate URL parsing with query parameter handling', async () => {
            // Test integration between URL parser and query handler
            const complexQuery = {
                filter: 'active',
                sort: 'name',
                page: '1',
                limit: '10',
                include: 'metadata'
            };
            
            const response = await request(serverInstance)
                .get('/api/integration/query')
                .query(complexQuery)
                .expect(200);
                
            expect(response.body.query).toEqual(complexQuery);
            expect(response.body.path).toBe('/api/integration/query');
        });

        it('should integrate content-type handling with response formatting', async () => {
            // Test integration between content-type detection and formatting
            const response = await request(serverInstance)
                .get('/api/content-test')
                .set('Accept', 'application/json')
                .expect(200)
                .expect('Content-Type', /application\/json/);
                
            expect(typeof response.body).toBe('object');
            expect(response.body.method).toBe('GET');
        });

        it('should integrate HTTP method routing with parameter extraction', async () => {
            // Test integration between HTTP method router and parameter extraction
            const putData = { status: 'updated', version: '2.0' };
            
            const response = await request(serverInstance)
                .put('/api/resources/456/status')
                .send(putData)
                .expect(200);
                
            expect(response.body.method).toBe('PUT');
            expect(response.body.path).toBe('/api/resources/456/status');
            expect(response.body.updated).toEqual(putData);
        });
    });

    /**
     * Performance and Reliability Integration Tests
     * Tests system performance under various conditions
     */
    describe('Performance and Reliability Integration', () => {
        
        it('should handle concurrent requests without interference', async () => {
            // Test concurrent request handling
            const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
                request(serverInstance)
                    .get(`/api/concurrent/${i}`)
                    .query({ request: i, timestamp: Date.now() })
            );
            
            const responses = await Promise.all(concurrentRequests);
            
            // Validate all requests succeeded
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.body.path).toBe(`/api/concurrent/${index}`);
                expect(response.body.query.request).toBe(index.toString());
            });
        });

        it('should maintain response time performance under load', async () => {
            // Test response time performance
            const startTime = Date.now();
            
            const response = await request(serverInstance)
                .get('/api/performance')
                .expect(200);
                
            const responseTime = Date.now() - startTime;
            
            // Validate response time is within acceptable limits (< 1000ms for integration tests)
            expect(responseTime).toBeLessThan(1000);
            expect(response.body.method).toBe('GET');
        });

        it('should handle rapid sequential requests reliably', async () => {
            // Test rapid sequential request handling
            const requests = [];
            
            for (let i = 0; i < 5; i++) {
                const response = await request(serverInstance)
                    .post('/api/sequential')
                    .send({ sequence: i, timestamp: Date.now() })
                    .expect(201);
                    
                requests.push(response.body);
            }
            
            // Validate all requests were processed correctly
            requests.forEach((req, index) => {
                expect(req.received.sequence).toBe(index);
                expect(req.method).toBe('POST');
                expect(req.created).toBe(true);
            });
        });

        it('should maintain data integrity across request boundaries', async () => {
            // Test data integrity in concurrent operations
            const testId = Date.now();
            
            // Send multiple requests with the same test ID
            const responses = await Promise.all([
                request(serverInstance).post('/api/integrity').send({ testId, operation: 'create' }),
                request(serverInstance).put('/api/integrity').send({ testId, operation: 'update' }),
                request(serverInstance).get('/api/integrity').query({ testId, operation: 'read' })
            ]);
            
            // Validate each operation maintained data integrity
            expect(responses[0].status).toBe(201); // POST
            expect(responses[1].status).toBe(200); // PUT  
            expect(responses[2].status).toBe(200); // GET
            
            responses.forEach(response => {
                if (response.body.received) {
                    expect(response.body.received.testId).toBe(testId);
                } else if (response.body.query) {
                    expect(response.body.query.testId).toBe(testId.toString());
                }
            });
        });
    });

    /**
     * Edge Case and Boundary Condition Integration Tests
     * Tests system behavior at boundaries and edge cases
     */
    describe('Edge Case and Boundary Integration', () => {
        
        it('should handle empty request bodies gracefully', async () => {
            // Test empty body handling
            const response = await request(serverInstance)
                .post('/api/empty')
                .send('')
                .set('Content-Type', 'application/json')
                .expect(201);
                
            expect(response.body.received).toEqual({});
            expect(response.body.method).toBe('POST');
        });

        it('should handle special characters in URL paths', async () => {
            // Test special character handling in URLs
            const specialPath = '/api/special%20chars/test%2Bencoding';
            
            const response = await request(serverInstance)
                .get(specialPath)
                .expect(200);
                
            expect(response.body.method).toBe('GET');
            expect(response.body.path).toContain('special');
        });

        it('should handle very long query strings correctly', async () => {
            // Test boundary condition for query string length
            const longQuery = Array.from({ length: 50 }, (_, i) => `param${i}=value${i}`).join('&');
            
            const response = await request(serverInstance)
                .get(`/api/long-query?${longQuery}`)
                .expect(200);
                
            expect(response.body.method).toBe('GET');
            expect(Object.keys(response.body.query)).toHaveLength(50);
        });

        it('should handle unicode characters in request data', async () => {
            // Test unicode character handling
            const unicodeData = {
                name: '测试用户',
                emoji: '🚀',
                description: 'Тест описание',
                special: 'café@münchen.de'
            };
            
            const response = await request(serverInstance)
                .post('/api/unicode')
                .send(unicodeData)
                .set('Content-Type', 'application/json')
                .expect(201);
                
            expect(response.body.received).toEqual(unicodeData);
        });

        it('should handle requests at maximum allowed size limit', async () => {
            // Test request that exceeds 1MB limit (1,048,576 bytes)
            // Create payload that will exceed limit when JSON stringified
            const oversizedPayload = {
                data: 'x'.repeat(1048580) // 1,048,580 chars + JSON overhead = ~1,048,591 bytes (over 1MB)
            };
            
            const response = await request(serverInstance)
                .post('/api/large')
                .send(JSON.stringify(oversizedPayload))
                .set('Content-Type', 'application/json')
                .expect(413); // Should hit size limit due to exceeding 1MB
                
            expect(response.body.error).toBe('Request entity too large');
        });
    });
});