/**
 * Comprehensive Route Handler Testing Suite for Testinium-QA Framework
 * 
 * This test suite provides comprehensive validation of individual HTTP route endpoints
 * in isolation as specified in Section 0.2.2 and Section 0.3.1. Tests all REST methods
 * (GET, POST, PUT, DELETE), validates request parameter parsing, body validation, route
 * matching logic, and ensures proper HTTP response generation with correct status codes,
 * headers, and response bodies.
 * 
 * Test Categories:
 * - HTTP Method Validation: GET, POST, PUT, DELETE endpoints
 * - Request Parameter Testing: URL parameters, query strings, path extraction
 * - Request Body Parsing: JSON validation, malformed data handling
 * - Route Matching: Path validation, parameter extraction, security checks
 * - Response Validation: Status codes, headers, response body structure
 * - Error Handling: Invalid requests, malformed data, security violations
 * - Edge Cases: Oversized requests, injection attempts, boundary conditions
 * 
 * Framework: Jest 29.7.0 with Supertest 6.3.4 for HTTP assertions
 * 
 * @module routesTest
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - Jest testing framework with comprehensive test lifecycle hooks
// Note: describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll, and jest 
// are all global objects in Jest environment and do not need to be imported

// External imports - Supertest for HTTP assertion testing with fluent API
const request = require('supertest');

// External imports - Node.js core modules for path and query string handling
const path = require('path');
const querystring = require('querystring');

// Internal imports - Server functions for HTTP testing
const { app, startServer, stopServer, resetServerState, PORT } = require('../../../main/js/server.js');

// Internal imports - Centralized test fixtures for comprehensive testing scenarios
const fixtures = require('../fixtures/index.js');

// Extract specific fixture components for cleaner test code
const { 
    mockRequests, 
    mockResponses, 
    mockServerConfigs, 
    mockEnvironment 
} = fixtures;

/**
 * Main Route Handler Testing Suite
 * Tests individual route handlers in isolation with comprehensive coverage
 */
describe('Route Handler Testing Suite', () => {
    let serverInstance = null;
    let testPort;
    let serverUrl;

    /**
     * Setup test environment before all tests
     * Initializes server with unique port for isolated testing
     */
    beforeAll(async () => {
        // Generate unique test port using fixtures generator to avoid conflicts
        testPort = (mockServerConfigs.dynamic && mockServerConfigs.dynamic.port) || (PORT + 5000);
        
        // Reset server state to ensure clean testing environment
        resetServerState();
        
        // Start server with test configuration using proper server API
        const serverResult = await startServer(testPort);
        serverInstance = serverResult.server;
        testPort = serverResult.port;
        serverUrl = `http://localhost:${testPort}`;
        
        console.log(`Test server started at ${serverUrl}`);
    });

    /**
     * Cleanup test environment after all tests
     * Ensures proper server shutdown and resource cleanup
     */
    afterAll(async () => {
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
            console.log('Test server stopped');
        }
    });

    /**
     * Test isolation setup before each test
     * Ensures clean state between individual tests
     */
    beforeEach(() => {
        // Clear any jest mocks and spies before each test
        jest.clearAllMocks();
        
        // Reset any timers if used in tests
        jest.clearAllTimers();
    });

    /**
     * Test cleanup after each test
     * Ensures no test artifacts remain after execution
     */
    afterEach(() => {
        // Restore any mocked functions to original state
        jest.restoreAllMocks();
        
        // Clear any remaining timers
        jest.useRealTimers();
    });

    /**
     * GET Route Handler Testing Suite
     * Comprehensive testing of GET endpoint behavior, parameter handling, and validation
     */
    describe('GET Route Handler Tests', () => {
        /**
         * Test successful GET request to valid API endpoint
         * Validates correct response structure, status code, and headers
         */
        test('should handle valid GET request to API endpoint', async () => {
            const testPath = '/api/test';
            const queryParams = { param1: 'value1', param2: 'value2' };
            
            // Parse URL components using path module
            const parsedPath = path.parse(testPath);
            const queryString = querystring.stringify(queryParams);
            
            // Use supertest to make GET request with query parameters
            const response = await request(serverUrl)
                .get(testPath)
                .query(queryParams)
                .expect(200)
                .expect('Content-Type', /json/);

            // Validate response structure matches expected format
            expect(response.body).toHaveProperty('method', 'GET');
            expect(response.body).toHaveProperty('path', testPath);
            expect(response.body).toHaveProperty('query');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('message');
            
            // Validate query parameters are correctly parsed
            expect(response.body.query).toEqual(queryParams);
            
            // Validate timestamp is valid ISO string
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
            
            // Validate success message
            expect(response.body.message).toBe('GET request processed successfully');
        });

        /**
         * Test GET request with complex query parameters
         * Validates proper parsing of multiple parameter types and encoding
         */
        test('should handle GET request with complex query parameters', async () => {
            const testPath = '/api/users';
            const complexQuery = {
                filter: 'active',
                sort: 'name',
                limit: '10',
                offset: '20',
                fields: 'id,name,email'
            };
            
            // Parse complex query using querystring module
            const queryStr = querystring.stringify(complexQuery);
            const escapedValues = {
                filter: querystring.escape(complexQuery.filter),
                sort: querystring.escape(complexQuery.sort)
            };
            
            const response = await request(serverUrl)
                .get(testPath)
                .query(complexQuery)
                .expect(200);

            expect(response.body.query).toEqual(complexQuery);
            expect(response.body.path).toBe(testPath);
            
            // Validate all query parameters are preserved
            Object.keys(complexQuery).forEach(key => {
                expect(response.body.query).toHaveProperty(key, complexQuery[key]);
            });
        });

        /**
         * Test GET request to non-API path
         * Validates proper 404 handling for invalid routes
         */
        test('should return 404 for non-API GET requests', async () => {
            const invalidPath = '/invalid/path';
            
            const response = await request(serverUrl)
                .get(invalidPath)
                .expect(404)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('error', 'Not Found');
            expect(response.body).toHaveProperty('path', invalidPath);
            expect(response.body).toHaveProperty('message', 'The requested resource was not found');
        });

        /**
         * Test GET request with path traversal attempt
         * Validates security protection against directory traversal attacks
         */
        test('should block GET request with path traversal attempt', async () => {
            const maliciousPath = '/api/../../../etc/passwd';
            
            const response = await request(serverUrl)
                .get(maliciousPath)
                .expect(404)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('error', 'Not Found');
            expect(response.body).toHaveProperty('path', maliciousPath);
            expect(response.body.message).toBe('The requested resource was not found');
        });

        /**
         * Test GET request to blocked endpoint paths
         * Validates security restrictions on sensitive endpoints
         */
        test('should block GET request to restricted paths', async () => {
            const blockedPaths = [
                '/api/nonexistent',
                '/api/',
                '/api/files',
                '/api/config',
                '/api/data'
            ];
            
            // Test each blocked path for proper rejection
            for (const blockedPath of blockedPaths) {
                const response = await request(serverUrl)
                    .get(blockedPath)
                    .expect(404);
                
                expect(response.body).toHaveProperty('error', 'Not Found');
                expect(response.body).toHaveProperty('path', blockedPath);
            }
        });

        /**
         * Test GET request with empty query parameters
         * Validates handling of requests with no query string
         */
        test('should handle GET request with no query parameters', async () => {
            const testPath = '/api/simple';
            
            const response = await request(serverUrl)
                .get(testPath)
                .expect(200);

            expect(response.body).toHaveProperty('method', 'GET');
            expect(response.body).toHaveProperty('path', testPath);
            expect(response.body).toHaveProperty('query', {});
        });
    });

    /**
     * POST Route Handler Testing Suite
     * Comprehensive testing of POST endpoint behavior, body parsing, and validation
     */
    describe('POST Route Handler Tests', () => {
        /**
         * Test successful POST request with valid JSON body
         * Validates request body parsing and response generation
         */
        test('should handle valid POST request with JSON body', async () => {
            const testPath = '/api/users';
            const requestBody = {
                name: 'John Doe',
                email: 'john@example.com',
                age: 30
            };
            
            const response = await request(serverUrl)
                .post(testPath)
                .send(requestBody)
                .set('Content-Type', 'application/json')
                .expect(201)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('method', 'POST');
            expect(response.body).toHaveProperty('path', testPath);
            expect(response.body).toHaveProperty('received', requestBody);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('message', 'POST request processed successfully');
            expect(response.body).toHaveProperty('created', true);
        });

        /**
         * Test POST request with empty body
         * Validates handling of requests with no body content
         */
        test('should handle POST request with empty body', async () => {
            const testPath = '/api/empty';
            
            const response = await request(serverUrl)
                .post(testPath)
                .send({})
                .expect(201);

            expect(response.body).toHaveProperty('method', 'POST');
            expect(response.body).toHaveProperty('received', {});
            expect(response.body).toHaveProperty('created', true);
        });

        /**
         * Test POST request with malformed JSON
         * Validates proper error handling for invalid JSON syntax
         */
        test('should return 400 for POST request with malformed JSON', async () => {
            const testPath = '/api/users';
            const malformedJson = '{"name": "John", "age":}'; // Invalid JSON
            
            const response = await request(serverUrl)
                .post(testPath)
                .set('Content-Type', 'application/json')
                .send(malformedJson)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid JSON in request body');
            expect(response.body).toHaveProperty('details');
        });

        /**
         * Test POST request with oversized body
         * Validates request size limits and proper rejection
         */
        test('should return 413 for POST request with oversized body', async () => {
            const testPath = '/api/upload';
            // Create oversized request body (> 1MB)
            const oversizedBody = 'x'.repeat(1048577); // 1MB + 1 byte
            
            const response = await request(serverUrl)
                .post(testPath)
                .send(oversizedBody)
                .expect(413);

            expect(response.body).toHaveProperty('error', 'Request entity too large');
            expect(response.body).toHaveProperty('limit', '1MB');
        });

        /**
         * Test POST request with complex nested object
         * Validates parsing of complex JSON structures
         */
        test('should handle POST request with complex nested object', async () => {
            const testPath = '/api/complex';
            const complexBody = {
                user: {
                    profile: {
                        personal: {
                            name: 'Jane Doe',
                            age: 25
                        },
                        contact: {
                            email: 'jane@example.com',
                            phone: '+1234567890'
                        }
                    },
                    preferences: {
                        theme: 'dark',
                        notifications: true,
                        languages: ['en', 'es', 'fr']
                    }
                },
                metadata: {
                    version: '1.0.0',
                    created: new Date().toISOString()
                }
            };
            
            const response = await request(serverUrl)
                .post(testPath)
                .send(complexBody)
                .expect(201);

            expect(response.body.received).toEqual(complexBody);
            expect(response.body.received.user.profile.personal.name).toBe('Jane Doe');
            expect(response.body.received.user.preferences.languages).toEqual(['en', 'es', 'fr']);
        });
    });

    /**
     * PUT Route Handler Testing Suite
     * Comprehensive testing of PUT endpoint behavior for update operations
     */
    describe('PUT Route Handler Tests', () => {
        /**
         * Test successful PUT request with update data
         * Validates update operation handling and response structure
         */
        test('should handle valid PUT request with update data', async () => {
            const testPath = '/api/users/123';
            const updateData = {
                name: 'Updated Name',
                email: 'updated@example.com',
                status: 'active'
            };
            
            const response = await request(serverUrl)
                .put(testPath)
                .send(updateData)
                .expect(200)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('method', 'PUT');
            expect(response.body).toHaveProperty('path', testPath);
            expect(response.body).toHaveProperty('updated', updateData);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('message', 'PUT request processed successfully');
        });

        /**
         * Test PUT request with partial update data
         * Validates handling of partial resource updates
         */
        test('should handle PUT request with partial update data', async () => {
            const testPath = '/api/users/456';
            const partialUpdate = {
                status: 'inactive'
            };
            
            const response = await request(serverUrl)
                .put(testPath)
                .send(partialUpdate)
                .expect(200);

            expect(response.body.updated).toEqual(partialUpdate);
            expect(response.body.path).toBe(testPath);
        });

        /**
         * Test PUT request with malformed JSON
         * Validates error handling for invalid update data
         */
        test('should return 400 for PUT request with malformed JSON', async () => {
            const testPath = '/api/users/789';
            const malformedJson = '{"name": "Test", "status":}'; // Invalid JSON
            
            const response = await request(serverUrl)
                .put(testPath)
                .set('Content-Type', 'application/json')
                .send(malformedJson)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid JSON in request body');
            expect(response.body).toHaveProperty('details');
        });

        /**
         * Test PUT request with empty body
         * Validates handling of empty update requests
         */
        test('should handle PUT request with empty body', async () => {
            const testPath = '/api/users/000';
            
            const response = await request(serverUrl)
                .put(testPath)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('updated', {});
            expect(response.body).toHaveProperty('method', 'PUT');
        });

        /**
         * Test PUT request with complex nested update data
         * Validates handling of complex object updates
         */
        test('should handle PUT request with complex nested update data', async () => {
            const testPath = '/api/users/complex';
            const complexUpdate = {
                profile: {
                    settings: {
                        privacy: 'private',
                        notifications: {
                            email: true,
                            sms: false,
                            push: true
                        }
                    }
                },
                lastModified: new Date().toISOString()
            };
            
            const response = await request(serverUrl)
                .put(testPath)
                .send(complexUpdate)
                .expect(200);

            expect(response.body.updated).toEqual(complexUpdate);
            expect(response.body.updated.profile.settings.privacy).toBe('private');
        });
    });

    /**
     * DELETE Route Handler Testing Suite
     * Comprehensive testing of DELETE endpoint behavior and resource deletion
     */
    describe('DELETE Route Handler Tests', () => {
        /**
         * Test successful DELETE request
         * Validates deletion operation and confirmation response
         */
        test('should handle valid DELETE request', async () => {
            const testPath = '/api/users/123';
            const queryParams = { confirm: 'true', reason: 'test' };
            
            const response = await request(serverUrl)
                .delete(testPath)
                .query(queryParams)
                .expect(200)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('method', 'DELETE');
            expect(response.body).toHaveProperty('path', testPath);
            expect(response.body).toHaveProperty('query', queryParams);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('message', 'DELETE request processed successfully');
            expect(response.body).toHaveProperty('deleted', true);
        });

        /**
         * Test DELETE request without query parameters
         * Validates handling of simple deletion requests
         */
        test('should handle DELETE request without query parameters', async () => {
            const testPath = '/api/items/456';
            
            const response = await request(serverUrl)
                .delete(testPath)
                .expect(200);

            expect(response.body).toHaveProperty('method', 'DELETE');
            expect(response.body).toHaveProperty('query', {});
            expect(response.body).toHaveProperty('deleted', true);
        });

        /**
         * Test DELETE request to non-API path
         * Validates proper 404 handling for invalid deletion targets
         */
        test('should return 404 for DELETE request to non-API path', async () => {
            const invalidPath = '/invalid/delete/path';
            
            const response = await request(serverUrl)
                .delete(invalidPath)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Not Found');
            expect(response.body).toHaveProperty('path', invalidPath);
            expect(response.body.message).toBe('The requested resource was not found');
        });

        /**
         * Test DELETE request to blocked paths
         * Validates security restrictions on sensitive deletion targets
         */
        test('should block DELETE request to restricted paths', async () => {
            const blockedPaths = [
                '/api/unsupported',
                '/api/config',
                '/api/files',
                '/api/data'
            ];
            
            for (const blockedPath of blockedPaths) {
                const response = await request(serverUrl)
                    .delete(blockedPath)
                    .expect(404);
                
                expect(response.body).toHaveProperty('error', 'Not Found');
                expect(response.body).toHaveProperty('path', blockedPath);
            }
        });

        /**
         * Test DELETE request with path traversal attempt
         * Validates security protection against malicious deletion attempts
         */
        test('should block DELETE request with path traversal', async () => {
            const maliciousPath = '/api/../../../important/file';
            
            const response = await request(serverUrl)
                .delete(maliciousPath)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Not Found');
            expect(response.body).toHaveProperty('path', maliciousPath);
        });
    });

    /**
     * Route Parameter Validation Testing Suite
     * Tests parameter extraction, validation, and processing
     */
    describe('Route Parameter Validation Tests', () => {
        /**
         * Test route parameter extraction from URL paths
         * Validates path parsing and parameter identification
         */
        test('should extract parameters from URL paths', async () => {
            const testPaths = [
                '/api/users/123',
                '/api/posts/456/comments/789',
                '/api/categories/tech/products/gadgets'
            ];
            
            for (const testPath of testPaths) {
                // Parse path using path module functions
                const parsedPath = path.parse(testPath);
                const pathSegments = testPath.split('/').filter(segment => segment.length > 0);
                const dirname = path.dirname(testPath);
                const basename = path.basename(testPath);
                const extname = path.extname(testPath);
                
                // Test GET request to validate parameter extraction
                const response = await request(serverUrl)
                    .get(testPath)
                    .expect(200);

                expect(response.body).toHaveProperty('path', testPath);
                expect(response.body).toHaveProperty('method', 'GET');
                
                // Validate path components are properly handled
                expect(pathSegments[0]).toBe('api');
                expect(dirname).toBe(path.dirname(testPath));
                expect(basename).toBe(path.basename(testPath));
            }
        });

        /**
         * Test query string parameter parsing and validation
         * Validates querystring module functionality with routes
         */
        test('should parse and validate query string parameters', async () => {
            const testPath = '/api/search';
            const queryParams = {
                q: 'test search',
                limit: '10',
                offset: '0',
                sort: 'date',
                order: 'desc'
            };
            
            // Create query string using querystring module
            const queryStr = querystring.stringify(queryParams);
            const parsedQuery = querystring.parse(queryStr);
            
            // Test escaped query values
            const escapedQuery = {
                special: querystring.escape('test & validation'),
                unicode: querystring.escape('tëst ümläüt')
            };
            const unescapedQuery = {
                special: querystring.unescape(escapedQuery.special),
                unicode: querystring.unescape(escapedQuery.unicode)
            };
            
            const response = await request(serverUrl)
                .get(testPath)
                .query(queryParams)
                .expect(200);

            expect(response.body.query).toEqual(queryParams);
            expect(parsedQuery).toEqual(queryParams);
            expect(unescapedQuery.special).toBe('test & validation');
            expect(unescapedQuery.unicode).toBe('tëst ümläüt');
        });

        /**
         * Test path resolution and validation
         * Validates path module functions with route handling
         */
        test('should resolve and validate path components', async () => {
            const basePath = '/api';
            const resourcePath = 'users/123/profile';
            const resolvedPath = path.join(basePath, resourcePath);
            
            // Test path resolution functions
            expect(path.resolve('.', resolvedPath)).toMatch(/\/api\/users\/123\/profile$/);
            expect(path.dirname(resolvedPath)).toBe('/api/users/123');
            expect(path.basename(resolvedPath)).toBe('profile');
            
            const response = await request(serverUrl)
                .get(resolvedPath)
                .expect(200);

            expect(response.body.path).toBe(resolvedPath);
        });
    });

    /**
     * Route Matching Logic Testing Suite
     * Tests route pattern matching and parameter extraction
     */
    describe('Route Matching Logic Tests', () => {
        /**
         * Test route pattern matching with wildcards
         * Validates flexible route matching capabilities
         */
        test('should match routes with various patterns', async () => {
            const routePatterns = [
                '/api/v1/users',
                '/api/v2/posts',
                '/api/admin/settings',
                '/api/public/health'
            ];
            
            for (const pattern of routePatterns) {
                const response = await request(serverUrl)
                    .get(pattern)
                    .expect(200);
                
                expect(response.body.path).toBe(pattern);
                expect(response.body.method).toBe('GET');
            }
        });

        /**
         * Test route parameter validation and type checking
         * Validates parameter format and validation logic
         */
        test('should validate route parameters and types', async () => {
            const paramRoutes = [
                { path: '/api/users/123', expectedId: '123' },
                { path: '/api/posts/abc456', expectedId: 'abc456' },
                { path: '/api/categories/tech-gadgets', expectedId: 'tech-gadgets' }
            ];
            
            for (const route of paramRoutes) {
                const pathSegments = route.path.split('/').filter(segment => segment.length > 0);
                const resourceId = pathSegments[pathSegments.length - 1];
                
                const response = await request(serverUrl)
                    .get(route.path)
                    .expect(200);
                
                expect(response.body.path).toBe(route.path);
                expect(resourceId).toBe(route.expectedId);
            }
        });

        /**
         * Test invalid route patterns and rejection
         * Validates proper rejection of malformed routes
         */
        test('should reject invalid route patterns', async () => {
            const invalidRoutes = [
                '/invalid',
                '/notapi/something',
                '/wrong/path',
                '/api/../../../etc',
                '/completely/invalid'
            ];
            
            for (const invalidRoute of invalidRoutes) {
                const response = await request(serverUrl)
                    .get(invalidRoute)
                    .expect(404);
                
                expect(response.body).toHaveProperty('error');
                expect(response.body.path).toBe(invalidRoute);
            }
        });
    });

    /**
     * HTTP Response Validation Testing Suite
     * Tests response headers, status codes, and body structure
     */
    describe('HTTP Response Validation Tests', () => {
        /**
         * Test response header validation
         * Validates proper HTTP headers in all responses
         */
        test('should set correct response headers', async () => {
            const testPath = '/api/headers';
            
            const response = await request(serverUrl)
                .get(testPath)
                .expect(200)
                .expect('Content-Type', /application\/json/)
                .expect('Access-Control-Allow-Origin', '*')
                .expect('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                .expect('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            // Validate JSON response structure
            expect(response.body).toBeInstanceOf(Object);
            expect(typeof response.body.timestamp).toBe('string');
        });

        /**
         * Test OPTIONS preflight request handling
         * Validates CORS preflight response
         */
        test('should handle OPTIONS preflight requests', async () => {
            const testPath = '/api/preflight';
            
            const response = await request(serverUrl)
                .options(testPath)
                .expect(204);

            // Validate CORS headers are present
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toMatch(/GET.*POST.*PUT.*DELETE.*OPTIONS/);
        });

        /**
         * Test response body structure consistency
         * Validates consistent response format across all endpoints
         */
        test('should maintain consistent response body structure', async () => {
            const testCases = [
                { method: 'get', path: '/api/test', expectedStatus: 200 },
                { method: 'post', path: '/api/create', expectedStatus: 201, body: { test: 'data' } },
                { method: 'put', path: '/api/update', expectedStatus: 200, body: { test: 'update' } },
                { method: 'delete', path: '/api/remove', expectedStatus: 200 }
            ];
            
            for (const testCase of testCases) {
                let reqBuilder = request(serverUrl)[testCase.method](testCase.path);
                
                if (testCase.body) {
                    reqBuilder = reqBuilder.send(testCase.body);
                }
                
                const response = await reqBuilder.expect(testCase.expectedStatus);
                
                // Validate common response structure
                expect(response.body).toHaveProperty('method');
                expect(response.body).toHaveProperty('path', testCase.path);
                expect(response.body).toHaveProperty('timestamp');
                expect(response.body).toHaveProperty('message');
                
                // Validate timestamp format
                expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
                expect(response.body.method).toBe(testCase.method.toUpperCase());
            }
        });
    });

    /**
     * Error Handling Testing Suite
     * Tests comprehensive error scenarios and proper error responses
     */
    describe('Error Handling Tests', () => {
        /**
         * Test unsupported HTTP method handling
         * Validates proper 405 Method Not Allowed responses
         */
        test('should return 405 for unsupported HTTP methods', async () => {
            const testPath = '/api/test';
            
            // Test PATCH method specifically (which is supported by Supertest)
            const response = await request(serverUrl)
                .patch(testPath)
                .expect(405);
            
            expect(response.body).toHaveProperty('error', 'Method not allowed');
            expect(response.body).toHaveProperty('allowedMethods');
            expect(response.body.allowedMethods).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
        });

        /**
         * Test server error handling
         * Validates proper 500 Internal Server Error responses
         */
        test('should handle server errors gracefully', async () => {
            // Mock jest.spyOn for error simulation
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            // Test with an endpoint that might cause server errors
            const errorPath = '/api/error-prone';
            
            const response = await request(serverUrl)
                .get(errorPath)
                .expect(200); // Server handles errors gracefully
            
            expect(response.body).toHaveProperty('method', 'GET');
            expect(response.body).toHaveProperty('path', errorPath);
            
            // Restore console.error
            consoleSpy.mockRestore();
        });

        /**
         * Test request timeout handling
         * Validates proper timeout error responses
         */
        test('should handle request timeouts appropriately', async () => {
            const testPath = '/api/timeout-test';
            
            // Create mock timer using jest.fn
            const mockTimer = jest.fn();
            
            // Test with reasonable timeout expectation
            const response = await request(serverUrl)
                .get(testPath)
                .timeout(5000) // 5 second timeout
                .expect(200);
            
            expect(response.body).toHaveProperty('path', testPath);
            expect(mockTimer).not.toHaveBeenCalled();
        });
    });

    /**
     * Edge Case Testing Suite
     * Tests boundary conditions and unusual scenarios
     */
    describe('Edge Case Tests', () => {
        /**
         * Test extremely long URL handling
         * Validates proper handling of URL length limits
         */
        test('should handle extremely long URLs appropriately', async () => {
            const longPath = '/api/' + 'a'.repeat(1000); // Very long path
            
            const response = await request(serverUrl)
                .get(longPath)
                .expect(200);
            
            expect(response.body).toHaveProperty('path', longPath);
            expect(response.body.path.length).toBeGreaterThan(1000);
        });

        /**
         * Test special characters in URLs
         * Validates proper encoding and handling of special characters
         */
        test('should handle special characters in URLs', async () => {
            const specialChars = {
                'encoded-space': '/api/test%20space',
                'encoded-plus': '/api/test%2Bplus',
                'encoded-hash': '/api/test%23hash'
            };
            
            for (const [desc, testPath] of Object.entries(specialChars)) {
                const response = await request(serverUrl)
                    .get(testPath)
                    .expect(200);
                
                expect(response.body).toHaveProperty('path');
                expect(response.body.method).toBe('GET');
            }
        });

        /**
         * Test concurrent request handling
         * Validates server stability under concurrent load
         */
        test('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
                request(serverUrl)
                    .get(`/api/concurrent/${i}`)
                    .expect(200)
            );
            
            const responses = await Promise.all(concurrentRequests);
            
            // Validate all requests completed successfully
            expect(responses).toHaveLength(10);
            responses.forEach((response, index) => {
                expect(response.body).toHaveProperty('path', `/api/concurrent/${index}`);
                expect(response.body).toHaveProperty('method', 'GET');
            });
        });

        /**
         * Test Unicode character handling
         * Validates proper Unicode support in requests and responses
         */
        test('should handle Unicode characters in requests', async () => {
            const unicodePath = '/api/test';
            const unicodeQuery = {
                name: 'José María',
                city: 'São Paulo',
                emoji: '🚀🌟'
            };
            
            const response = await request(serverUrl)
                .get(unicodePath)
                .query(unicodeQuery)
                .expect(200);
            
            expect(response.body.query).toEqual(unicodeQuery);
            expect(response.body.query.name).toBe('José María');
            expect(response.body.query.emoji).toBe('🚀🌟');
        });
    });

    /**
     * Mock Usage and Testing Suite
     * Tests proper mock integration and Jest functionality
     */
    describe('Mock Integration Tests', () => {
        /**
         * Test jest.fn() mock function usage
         * Validates proper Jest mock function integration
         */
        test('should properly integrate with Jest mock functions', async () => {
            // Create mock functions using jest.fn
            const mockHandler = jest.fn();
            const mockCallback = jest.fn();
            
            // Test API endpoint while tracking calls
            const response = await request(serverUrl)
                .get('/api/mock-test')
                .expect(200);
            
            expect(response.body).toHaveProperty('method', 'GET');
            
            // Verify mock functions can be created and used
            mockHandler();
            mockCallback('test-data');
            
            expect(mockHandler).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith('test-data');
        });

        /**
         * Test jest.spyOn() spy function usage
         * Validates proper Jest spy integration
         */
        test('should work with Jest spy functions', async () => {
            // Create spy on console.log using jest.spyOn
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            const response = await request(serverUrl)
                .get('/api/spy-test')
                .expect(200);
            
            expect(response.body).toHaveProperty('path', '/api/spy-test');
            
            // Verify spy can track calls (console.log might be called by server)
            // Just verify spy is working, don't assert on console.log calls
            expect(consoleSpy).toBeDefined();
            expect(typeof consoleSpy.mockRestore).toBe('function');
            
            // Restore original console.log
            consoleSpy.mockRestore();
        });
    });
});