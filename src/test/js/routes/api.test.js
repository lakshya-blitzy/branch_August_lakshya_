/**
 * API Endpoint Integration Testing Suite for Testinium-QA Framework
 * 
 * Comprehensive integration tests for validating complete API request/response cycles,
 * RESTful API patterns, JSON payload handling, authentication/authorization,
 * error responses, and API contract compliance.
 * 
 * This test suite validates:
 * - Complete HTTP request/response cycles using Supertest
 * - RESTful API endpoint patterns and method validation
 * - JSON request/response serialization and deserialization
 * - HTTP status codes, headers, and CORS configuration
 * - API error handling and security validation
 * - Server lifecycle integration with Jest test framework
 * - Rate limiting and authentication scenarios
 * - API versioning and contract compliance
 * 
 * Test execution follows the specifications from Section 0.2.2 for API endpoint
 * testing with comprehensive validation of business logic execution,
 * authentication workflows, and error response standardization.
 * 
 * @module apiIntegrationTests
 * @version 1.0.0
 * @author Blitzy Agent
 * @requires jest ^29.7.0
 * @requires supertest ^6.3.4
 * @requires server.js (main HTTP server implementation)
 * @requires fixtures (centralized test fixtures and mock data)
 */

// External dependencies as specified in external_imports schema
// Note: Jest globals (describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll, jest) 
// are automatically available in Jest test environment and don't need to be imported
const request = require('supertest');
const { STATUS_CODES, METHODS, IncomingMessage, ServerResponse } = require('http');
const { URL, URLSearchParams, parse, format, resolve } = require('url');

// Internal dependencies as specified in internal_imports schema
const { app, startServer, stopServer, PORT, routes } = require('../../../main/js/server.js');
const { 
    mockRequests, 
    mockResponses, 
    mockServerConfigs, 
    mockEnvironment 
} = require('../fixtures/index.js');

/**
 * API Integration Test Suite - Core API Endpoint Testing
 * 
 * Tests complete API workflows including authentication, request validation,
 * business logic execution, and response generation as specified in Section 0.3.1
 */
describe('API Endpoint Integration Tests', () => {
    let serverInstance = null;
    let testPort = null;
    let baseUrl = null;

    /**
     * Test Suite Setup - Initialize server for API testing
     * Configure test environment and start HTTP server instance
     */
    beforeAll(async () => {
        // Use dynamic port from mock server configs to prevent conflicts
        testPort = mockServerConfigs.dynamic.port || 0;
        
        try {
            const serverInfo = await startServer(testPort, 'localhost');
            serverInstance = serverInfo.server;
            testPort = serverInfo.port;
            baseUrl = serverInfo.url;
            
            console.log(`Test server started at ${baseUrl} for API integration testing`);
        } catch (error) {
            console.error('Failed to start test server:', error);
            throw error;
        }
    });

    /**
     * Test Suite Cleanup - Graceful server shutdown
     * Ensure proper cleanup for test isolation
     */
    afterAll(async () => {
        if (serverInstance) {
            try {
                await stopServer();
                console.log('Test server stopped gracefully');
            } catch (error) {
                console.error('Error stopping test server:', error);
            }
        }
    });

    /**
     * Per-test cleanup to ensure test isolation
     */
    afterEach(() => {
        // Clear any Jest spies and mocks
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    /**
     * API Health Check and Basic Functionality Tests
     * Validates server availability and basic endpoint functionality
     */
    describe('API Health and Basic Endpoints', () => {
        test('should respond to health check endpoint', async () => {
            const response = await request(serverInstance)
                .get('/health')
                .expect(200)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                status: 'healthy',
                uptime: expect.any(Number),
                memory: expect.any(Object),
                timestamp: expect.any(String)
            });

            // Validate ISO timestamp format
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });

        test('should respond to root endpoint with server information', async () => {
            const response = await request(serverInstance)
                .get('/')
                .expect(200)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                message: 'Testinium-QA Server Running',
                version: '1.0.0',
                timestamp: expect.any(String),
                port: expect.any(Number),
                environment: expect.any(String)
            });
        });

        test('should handle CORS preflight requests correctly', async () => {
            const response = await request(serverInstance)
                .options('/api/test')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toContain('GET');
            expect(response.headers['access-control-allow-methods']).toContain('POST');
            expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
        });
    });

    /**
     * RESTful API GET Endpoint Testing
     * Comprehensive validation of GET request handling and response patterns
     */
    describe('API GET Endpoints', () => {
        test('should handle valid GET requests to API endpoints', async () => {
            const testEndpoint = '/api/users';
            const queryParams = mockRequests.valid.query || { limit: 10, offset: 0 };
            
            const response = await request(serverInstance)
                .get(testEndpoint)
                .query(queryParams)
                .expect(200)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                method: 'GET',
                path: testEndpoint,
                query: expect.objectContaining(
                    Object.keys(queryParams).reduce((acc, key) => {
                        acc[key] = String(queryParams[key]); // Query params are strings
                        return acc;
                    }, {})
                ),
                timestamp: expect.any(String),
                message: 'GET request processed successfully'
            });
        });

        test('should handle GET requests with complex query parameters', async () => {
            const complexQuery = {
                search: 'user query',
                filters: JSON.stringify({ active: true, role: 'admin' }),
                sort: 'created_date',
                order: 'desc'
            };

            const response = await request(serverInstance)
                .get('/api/search')
                .query(complexQuery)
                .expect(200);

            expect(response.body.query).toMatchObject({
                search: 'user query',
                filters: complexQuery.filters,
                sort: 'created_date',
                order: 'desc'
            });
        });

        test('should reject GET requests to non-API paths with 404', async () => {
            const response = await request(serverInstance)
                .get('/non-api/path')
                .expect(404)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                error: 'Not Found',
                path: '/non-api/path',
                message: 'The requested resource was not found'
            });
        });

        test('should block path traversal attempts in GET requests', async () => {
            const maliciousPaths = [
                '/api/../../../etc/passwd',
                '/api/..\\..\\windows\\system32',
                '/api/nonexistent',
                '/api/',
                '/api/invalid/path/structure'
            ];

            for (const path of maliciousPaths) {
                const response = await request(serverInstance)
                    .get(path)
                    .expect(404)
                    .expect('Content-Type', /application\/json/);

                expect(response.body).toMatchObject({
                    error: 'Not Found',
                    message: expect.any(String)
                });
            }
        });

        test('should handle empty query parameters gracefully', async () => {
            const response = await request(serverInstance)
                .get('/api/items')
                .expect(200);

            expect(response.body.query).toEqual({});
            expect(response.body.method).toBe('GET');
        });
    });

    /**
     * RESTful API POST Endpoint Testing
     * Validation of POST request handling, JSON payload processing, and creation responses
     */
    describe('API POST Endpoints', () => {
        test('should handle valid POST requests with JSON payload', async () => {
            const testData = mockRequests.valid.postData || {
                name: 'Test User',
                email: 'test@example.com',
                role: 'user'
            };

            const response = await request(serverInstance)
                .post('/api/users')
                .send(testData)
                .set('Content-Type', 'application/json')
                .expect(201)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                method: 'POST',
                path: '/api/users',
                received: testData,
                timestamp: expect.any(String),
                message: 'POST request processed successfully',
                created: true
            });
        });

        test('should handle POST requests with empty JSON payload', async () => {
            const response = await request(serverInstance)
                .post('/api/items')
                .send({})
                .set('Content-Type', 'application/json')
                .expect(201);

            expect(response.body.received).toEqual({});
            expect(response.body.created).toBe(true);
        });

        test('should handle POST requests with complex nested JSON', async () => {
            const complexData = {
                user: {
                    profile: {
                        name: 'John Doe',
                        preferences: {
                            theme: 'dark',
                            notifications: true
                        }
                    }
                },
                metadata: {
                    source: 'api_test',
                    timestamp: new Date().toISOString()
                }
            };

            const response = await request(serverInstance)
                .post('/api/users/profile')
                .send(complexData)
                .expect(201);

            expect(response.body.received).toEqual(complexData);
        });

        test('should reject POST requests with malformed JSON', async () => {
            const response = await request(serverInstance)
                .post('/api/users')
                .send('{ invalid json }')
                .set('Content-Type', 'application/json')
                .expect(400)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                error: 'Invalid JSON in request body',
                details: expect.any(String)
            });
        });

        test('should reject oversized POST payloads (>1MB)', async () => {
            // Create a large payload exceeding 1MB limit
            const largePayload = {
                data: 'x'.repeat(1048577) // Just over 1MB
            };

            const response = await request(serverInstance)
                .post('/api/upload')
                .send(largePayload)
                .expect(413)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                error: 'Request entity too large',
                limit: '1MB'
            });
        });

        test('should handle POST requests without body gracefully', async () => {
            const response = await request(serverInstance)
                .post('/api/ping')
                .expect(201);

            expect(response.body.received).toEqual({});
        });
    });

    /**
     * RESTful API PUT Endpoint Testing  
     * Validation of PUT request handling for update operations
     */
    describe('API PUT Endpoints', () => {
        test('should handle valid PUT requests for updates', async () => {
            const updateData = {
                id: 123,
                name: 'Updated User',
                email: 'updated@example.com',
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

        test('should handle partial updates via PUT', async () => {
            const partialUpdate = {
                status: 'inactive'
            };

            const response = await request(serverInstance)
                .put('/api/users/456/status')
                .send(partialUpdate)
                .expect(200);

            expect(response.body.updated).toEqual(partialUpdate);
        });

        test('should reject PUT requests with malformed JSON', async () => {
            const response = await request(serverInstance)
                .put('/api/users/789')
                .send('{ invalid json }')
                .set('Content-Type', 'application/json')
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Invalid JSON in request body',
                details: expect.any(String)
            });
        });

        test('should handle PUT requests with empty body', async () => {
            const response = await request(serverInstance)
                .put('/api/users/999')
                .expect(200);

            expect(response.body.updated).toEqual({});
        });
    });

    /**
     * RESTful API DELETE Endpoint Testing
     * Validation of DELETE request handling and resource deletion confirmation
     */
    describe('API DELETE Endpoints', () => {
        test('should handle valid DELETE requests', async () => {
            const queryParams = { confirm: 'true', reason: 'test cleanup' };

            const response = await request(serverInstance)
                .delete('/api/users/123')
                .query(queryParams)
                .expect(200)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                method: 'DELETE',
                path: '/api/users/123',
                query: expect.objectContaining({
                    confirm: 'true',
                    reason: 'test cleanup'
                }),
                timestamp: expect.any(String),
                message: 'DELETE request processed successfully',
                deleted: true
            });
        });

        test('should handle DELETE requests without query parameters', async () => {
            const response = await request(serverInstance)
                .delete('/api/items/456')
                .expect(200);

            expect(response.body.query).toEqual({});
            expect(response.body.deleted).toBe(true);
        });

        test('should block DELETE requests to sensitive paths', async () => {
            const sensitivePaths = [
                '/api/config',
                '/api/files',
                '/api/data',
                '/api/unsupported'
            ];

            for (const path of sensitivePaths) {
                const response = await request(serverInstance)
                    .delete(path)
                    .expect(404);

                expect(response.body.error).toBe('Not Found');
            }
        });

        test('should prevent path traversal in DELETE requests', async () => {
            const response = await request(serverInstance)
                .delete('/api/../admin/users')
                .expect(404);

            expect(response.body.message).toContain('not found');
        });
    });

    /**
     * HTTP Method and Protocol Validation Tests
     * Validation of HTTP method support, status codes, and protocol compliance
     */
    describe('HTTP Method and Protocol Validation', () => {
        test('should reject unsupported HTTP methods with 405', async () => {
            const response = await request(serverInstance)
                .patch('/api/users/123')
                .expect(405)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                error: 'Method not allowed',
                allowedMethods: expect.arrayContaining(['GET', 'POST', 'PUT', 'DELETE'])
            });
        });

        test('should validate HTTP status codes against Node.js STATUS_CODES', async () => {
            // Test that our status codes match Node.js standard codes
            const testCases = [
                { path: '/api/users', method: 'get', expectedStatus: 200 },
                { path: '/api/users', method: 'post', expectedStatus: 201 },
                { path: '/nonexistent', method: 'get', expectedStatus: 404 },
                { path: '/api/users', method: 'patch', expectedStatus: 405 }
            ];

            for (const testCase of testCases) {
                const response = await request(serverInstance)[testCase.method](testCase.path);
                expect(response.status).toBe(testCase.expectedStatus);
                expect(STATUS_CODES[testCase.expectedStatus]).toBeDefined();
            }
        });

        test('should validate HTTP methods against Node.js METHODS', async () => {
            const supportedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
            
            for (const method of supportedMethods) {
                expect(METHODS).toContain(method);
            }
        });

        test('should set proper Content-Type headers for JSON responses', async () => {
            const endpoints = [
                { method: 'get', path: '/api/test' },
                { method: 'post', path: '/api/test' },
                { method: 'put', path: '/api/test' },
                { method: 'delete', path: '/api/test' }
            ];

            for (const endpoint of endpoints) {
                const response = await request(serverInstance)[endpoint.method](endpoint.path);
                expect(response.headers['content-type']).toMatch(/application\/json/);
            }
        });
    });

    /**
     * URL Parsing and Query Parameter Validation Tests
     * Validation of URL parsing, query parameter handling using Node.js url module
     */
    describe('URL Parsing and Query Parameter Validation', () => {
        test('should properly parse complex URLs with query parameters', async () => {
            const complexUrl = '/api/search?q=test&filters[]=active&filters[]=verified&sort=name&order=asc';
            
            const response = await request(serverInstance)
                .get(complexUrl)
                .expect(200);

            // Validate that our server processed the parsed URL correctly
            expect(response.body.path).toBe('/api/search');
            expect(response.body.query).toMatchObject({
                q: 'test',
                sort: 'name',
                order: 'asc'
            });
        });

        test('should handle URL encoding and special characters', async () => {
            const encodedPath = encodeURIComponent('/api/search with spaces');
            const specialChars = {
                'special chars': 'value with & symbols',
                'unicode': '测试数据'
            };

            const response = await request(serverInstance)
                .get('/api/search')
                .query(specialChars)
                .expect(200);

            expect(response.body.query).toMatchObject({
                'special chars': 'value with & symbols',
                'unicode': '测试数据'
            });
        });

        test('should validate URL construction using url module utilities', () => {
            // Test URL parsing functionality
            const testUrl = 'http://localhost:3000/api/users?id=123&active=true';
            const parsedUrl = new URL(testUrl);
            
            expect(parsedUrl.pathname).toBe('/api/users');
            expect(parsedUrl.searchParams.get('id')).toBe('123');
            expect(parsedUrl.searchParams.get('active')).toBe('true');

            // Test URLSearchParams functionality
            const params = new URLSearchParams();
            params.append('filter', 'active');
            params.append('sort', 'name');
            
            expect(params.toString()).toBe('filter=active&sort=name');
        });

        test('should resolve relative URLs correctly', () => {
            const baseUrl = 'http://localhost:3000/api/';
            const relativeUrl = '../health';
            
            const resolvedUrl = resolve(baseUrl, relativeUrl);
            expect(resolvedUrl).toBe('http://localhost:3000/health');
        });
    });

    /**
     * API Error Handling and Security Tests
     * Comprehensive validation of error responses and security measures
     */
    describe('API Error Handling and Security', () => {
        test('should handle server errors gracefully with 500 status', async () => {
            // Mock a server error by accessing routes object directly
            const originalHandler = routes.getHandler;
            routes.getHandler = () => {
                throw new Error('Simulated server error');
            };

            const response = await request(serverInstance)
                .get('/api/users')
                .expect(500)
                .expect('Content-Type', /application\/json/);

            expect(response.body).toMatchObject({
                error: 'Internal Server Error',
                message: expect.any(String)
            });

            // Restore original handler
            routes.getHandler = originalHandler;
        });

        test('should validate CORS headers for cross-origin requests', async () => {
            const response = await request(serverInstance)
                .get('/api/test')
                .set('Origin', 'http://example.com')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toContain('GET');
            expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
        });

        test('should reject requests to blocked sensitive paths', async () => {
            const blockedPaths = [
                '/api/config',
                '/api/files', 
                '/api/data',
                '/api/content'
            ];

            for (const path of blockedPaths) {
                const response = await request(serverInstance)
                    .get(path)
                    .expect(404);

                expect(response.body.error).toBe('Not Found');
            }
        });

        test('should prevent directory traversal attacks', async () => {
            const attackVectors = [
                '/api/../../../etc/passwd',
                '/api/..\\..\\windows\\system32',
                '/api/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
            ];

            for (const vector of attackVectors) {
                const response = await request(serverInstance)
                    .get(vector)
                    .expect(404);

                expect(response.body.error).toBe('Not Found');
            }
        });

        test('should handle malformed request headers gracefully', async () => {
            const response = await request(serverInstance)
                .post('/api/users')
                .set('Content-Type', 'invalid/content/type')
                .send('invalid data')
                .expect(400);

            expect(response.body.error).toContain('Invalid JSON');
        });
    });

    /**
     * API Authentication and Authorization Simulation Tests
     * Testing authentication patterns and authorization workflows
     */
    describe('API Authentication and Authorization Simulation', () => {
        test('should handle requests with authorization headers', async () => {
            const authToken = 'Bearer jwt-token-example';
            
            const response = await request(serverInstance)
                .get('/api/protected')
                .set('Authorization', authToken)
                .expect(200);

            // Server should process the request normally
            // (Authorization is typically handled by middleware in production)
            expect(response.body.method).toBe('GET');
            expect(response.body.path).toBe('/api/protected');
        });

        test('should handle API key authentication pattern', async () => {
            const apiKey = 'test-api-key-12345';
            
            const response = await request(serverInstance)
                .get('/api/data')
                .set('X-API-Key', apiKey)
                .expect(200);

            expect(response.body.method).toBe('GET');
        });

        test('should support role-based access pattern testing', async () => {
            const roleHeaders = {
                'X-User-Role': 'admin',
                'X-User-ID': '12345'
            };

            const response = await request(serverInstance)
                .post('/api/admin/users')
                .set(roleHeaders)
                .send({ name: 'New Admin User' })
                .expect(201);

            expect(response.body.created).toBe(true);
        });
    });

    /**
     * API Rate Limiting and Performance Tests
     * Testing rate limiting behavior and performance characteristics
     */
    describe('API Rate Limiting and Performance Simulation', () => {
        test('should handle multiple concurrent requests efficiently', async () => {
            const concurrentRequests = 10;
            const requests = [];

            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    request(serverInstance)
                        .get(`/api/users/${i}`)
                        .expect(200)
                );
            }

            const responses = await Promise.all(requests);
            
            // All requests should complete successfully
            expect(responses).toHaveLength(concurrentRequests);
            responses.forEach((response, index) => {
                expect(response.body.path).toBe(`/api/users/${index}`);
            });
        });

        test('should measure response time performance', async () => {
            const startTime = Date.now();
            
            await request(serverInstance)
                .get('/api/performance-test')
                .expect(200);
                
            const responseTime = Date.now() - startTime;
            
            // Response time should be under 100ms for simple requests
            expect(responseTime).toBeLessThan(100);
        });

        test('should handle rapid sequential requests', async () => {
            const sequentialCount = 5;
            const responses = [];

            for (let i = 0; i < sequentialCount; i++) {
                const response = await request(serverInstance)
                    .post('/api/items')
                    .send({ item: i, timestamp: Date.now() })
                    .expect(201);
                    
                responses.push(response);
            }

            expect(responses).toHaveLength(sequentialCount);
            responses.forEach(response => {
                expect(response.body.created).toBe(true);
            });
        });
    });

    /**
     * API Versioning and Contract Compliance Tests
     * Validation of API versioning patterns and contract compliance
     */
    describe('API Versioning and Contract Compliance', () => {
        test('should support API versioning in URL path', async () => {
            const versionedEndpoints = [
                '/api/v1/users',
                '/api/v2/users',
                '/api/latest/users'
            ];

            for (const endpoint of versionedEndpoints) {
                const response = await request(serverInstance)
                    .get(endpoint)
                    .expect(200);

                expect(response.body.path).toBe(endpoint);
                expect(response.body.method).toBe('GET');
            }
        });

        test('should support API versioning via headers', async () => {
            const response = await request(serverInstance)
                .get('/api/users')
                .set('API-Version', 'v2')
                .set('Accept', 'application/vnd.api+json;version=2')
                .expect(200);

            expect(response.body.method).toBe('GET');
        });

        test('should validate JSON API contract compliance', async () => {
            const jsonApiData = {
                data: {
                    type: 'users',
                    attributes: {
                        name: 'John Doe',
                        email: 'john@example.com'
                    }
                }
            };

            const response = await request(serverInstance)
                .post('/api/users')
                .send(jsonApiData)
                .set('Content-Type', 'application/vnd.api+json')
                .expect(201);

            expect(response.body.received).toEqual(jsonApiData);
        });

        test('should handle content negotiation via Accept headers', async () => {
            const acceptHeaders = [
                'application/json',
                'application/vnd.api+json',
                'application/json; charset=utf-8'
            ];

            for (const acceptHeader of acceptHeaders) {
                const response = await request(serverInstance)
                    .get('/api/users')
                    .set('Accept', acceptHeader)
                    .expect(200);

                expect(response.headers['content-type']).toMatch(/application\/json/);
            }
        });
    });

    /**
     * End-to-End API Workflow Tests
     * Complete workflow testing simulating real user interactions
     */
    describe('End-to-End API Workflow Tests', () => {
        test('should complete full CRUD workflow', async () => {
            // CREATE
            const createResponse = await request(serverInstance)
                .post('/api/workflow/items')
                .send({ name: 'Test Item', description: 'E2E test item' })
                .expect(201);

            expect(createResponse.body.created).toBe(true);

            // READ
            const readResponse = await request(serverInstance)
                .get('/api/workflow/items/1')
                .expect(200);

            expect(readResponse.body.method).toBe('GET');

            // UPDATE  
            const updateResponse = await request(serverInstance)
                .put('/api/workflow/items/1')
                .send({ name: 'Updated Test Item', status: 'active' })
                .expect(200);

            expect(updateResponse.body.updated).toMatchObject({
                name: 'Updated Test Item',
                status: 'active'
            });

            // DELETE
            const deleteResponse = await request(serverInstance)
                .delete('/api/workflow/items/1')
                .expect(200);

            expect(deleteResponse.body.deleted).toBe(true);
        });

        test('should handle complex business workflow with multiple API calls', async () => {
            // Simulate user registration workflow
            const userRegistration = await request(serverInstance)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@workflow.com',
                    password: 'securepassword'
                })
                .expect(201);

            // Simulate profile creation
            const profileCreation = await request(serverInstance)
                .post('/api/profiles')
                .send({
                    userId: 'testuser',
                    firstName: 'Test',
                    lastName: 'User'
                })
                .expect(201);

            // Simulate data retrieval
            const profileRetrieval = await request(serverInstance)
                .get('/api/profiles/testuser')
                .expect(200);

            expect(userRegistration.body.created).toBe(true);
            expect(profileCreation.body.created).toBe(true);
            expect(profileRetrieval.body.method).toBe('GET');
        });
    });
});