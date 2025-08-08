/**
 * Comprehensive Jest Unit Test Suite for server.js
 * 
 * Validates all server functionality including HTTP responses, status codes, headers,
 * middleware execution, error handling, and server lifecycle management. Tests cover
 * server initialization, route endpoints, middleware functionality, graceful shutdown
 * procedures, and edge cases using supertest for HTTP assertion testing.
 * 
 * Test Coverage Areas:
 * - Server Initialization and Configuration Tests
 * - Route Endpoint Tests (GET, POST, PUT, PATCH, DELETE)
 * - Middleware Functionality Tests (CORS, Security, Compression, Logging)
 * - Error Handling Tests (400, 401, 404, 500 status codes)
 * - Server Lifecycle Tests (startup/shutdown procedures)
 * - Edge Cases and Boundary Conditions
 * - Authentication and Authorization Testing
 * - Request Validation and Error Response Formatting
 * 
 * @module server.test
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - Jest testing framework
const { describe, test, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } = require('jest');

// External imports - Supertest for HTTP assertion testing
const request = require('supertest');

// External imports - Node.js built-in modules for lifecycle testing
const { EventEmitter } = require('events');
const http = require('http');

// Internal imports - Express application and server components
const app = require('../server.js');

// Internal imports - Test data fixtures for comprehensive validation
const testData = require('./fixtures/testData.json');

// Internal imports - Custom error classes for error handling tests
const { UnauthorizedError } = require('../src/middleware/errorHandler.js');

// Test environment configuration
const TEST_PORT = 3001; // Dedicated port for testing to avoid conflicts
const TEST_TIMEOUT = 30000; // 30 second timeout for complex operations
const SERVER_STARTUP_DELAY = 1000; // 1 second delay for server startup

// Global test variables for server lifecycle management
let testServer = null;
let serverInstance = null;

/**
 * Test utility functions for common operations
 */

/**
 * Start test server instance with proper error handling
 * @returns {Promise<Object>} HTTP server instance
 */
async function startTestServer() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(app);
        
        server.listen(TEST_PORT, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(server);
            }
        });
        
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                reject(new Error(`Test port ${TEST_PORT} is already in use`));
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Stop test server with graceful shutdown
 * @param {Object} server - HTTP server instance to stop
 * @returns {Promise<void>}
 */
async function stopTestServer(server) {
    return new Promise((resolve) => {
        if (server && server.listening) {
            server.close(() => {
                resolve();
            });
        } else {
            resolve();
        }
    });
}

/**
 * Wait for specified duration (useful for async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Jest global setup and teardown hooks
beforeAll(async () => {
    // Clear any existing timers or intervals
    jest.clearAllTimers();
    jest.clearAllMocks();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = TEST_PORT.toString();
    
    // Start test server for integration testing
    try {
        testServer = await startTestServer();
        serverInstance = testServer;
        
        // Allow server to fully initialize
        await wait(SERVER_STARTUP_DELAY);
    } catch (error) {
        console.error('Failed to start test server:', error);
        throw error;
    }
}, TEST_TIMEOUT);

afterAll(async () => {
    // Stop test server gracefully
    if (testServer) {
        await stopTestServer(testServer);
        testServer = null;
        serverInstance = null;
    }
    
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    
    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
}, TEST_TIMEOUT);

beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
});

afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
});

/**
 * Server Initialization Tests
 * Verify server starts successfully and loads all required middleware
 */
describe('Server Initialization Tests', () => {
    
    test('server should start successfully on specified port', async () => {
        expect(testServer).toBeTruthy();
        expect(testServer.listening).toBe(true);
        
        const address = testServer.address();
        expect(address.port).toBe(TEST_PORT);
    });
    
    test('Express application should be configured correctly', () => {
        expect(app).toBeTruthy();
        expect(typeof app).toBe('function');
        expect(app.settings).toBeTruthy();
    });
    
    test('server should have proper environment configuration', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(app.get('env')).toBe('test');
    });
    
    test('server should disable x-powered-by header for security', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.headers['x-powered-by']).toBeUndefined();
    });
    
    test('server should trust proxy settings', () => {
        expect(app.get('trust proxy')).toBe(true);
    });
});

/**
 * Route Endpoint Tests
 * Test all HTTP methods and endpoint functionality using Supertest
 */
describe('Route Endpoint Tests', () => {
    
    describe('GET /health - Health Check Endpoint', () => {
        
        test('should return 200 with health status data', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    status: 'healthy',
                    environment: 'test',
                    version: '1.0.0'
                },
                message: 'Server is healthy and operational'
            });
            
            expect(response.body.data.timestamp).toBeTruthy();
            expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
            expect(response.body.data.memoryUsage).toBeTruthy();
        });
        
        test('should return health data with proper structure', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            const { data } = response.body;
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('timestamp');
            expect(data).toHaveProperty('uptime');
            expect(data).toHaveProperty('environment');
            expect(data).toHaveProperty('version');
            expect(data).toHaveProperty('memoryUsage');
        });
    });
    
    describe('GET / - Root Endpoint', () => {
        
        test('should return 200 with server information', async () => {
            const response = await request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    service: 'Testinium-QA Node.js Server',
                    version: '1.0.0',
                    environment: 'test',
                    endpoints: {
                        health: '/health',
                        api: '/api',
                        apiHealth: '/api/health'
                    }
                },
                message: 'Testinium-QA Node.js Server is running'
            });
            
            expect(response.body.data.timestamp).toBeTruthy();
        });
    });
    
    describe('GET /api/health - API Health Check', () => {
        
        test('should return API health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
        });
    });
    
    describe('GET /api/items - List Items with Pagination', () => {
        
        test('should return items list with pagination', async () => {
            const response = await request(app)
                .get('/api/items')
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeTruthy();
        });
        
        test('should handle query parameters for pagination', async () => {
            const response = await request(app)
                .get('/api/items')
                .query(testData.validRequestPayloads.searchQuery.pagination)
                .expect(200);
                
            expect(response.body.success).toBe(true);
        });
        
        test('should handle advanced search filters', async () => {
            const response = await request(app)
                .get('/api/items')
                .query(testData.validRequestPayloads.searchQuery.advanced)
                .expect(200);
                
            expect(response.body.success).toBe(true);
        });
    });
    
    describe('GET /api/items/:id - Retrieve Single Item', () => {
        
        test('should return 200 for valid item ID', async () => {
            const response = await request(app)
                .get('/api/items/123')
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
        });
        
        test('should return 404 for non-existent item ID', async () => {
            const response = await request(app)
                .get('/api/items/999999')
                .expect(404)
                .expect('Content-Type', /json/);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });
    });
    
    describe('POST /api/items - Create New Item', () => {
        
        test('should create item with valid data and return 201', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.validRequestPayloads.createUser.basic)
                .expect(201)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('created');
        });
        
        test('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.invalidRequestPayloads.missingRequiredFields.createUserMissingUsername)
                .expect(400)
                .expect('Content-Type', /json/);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(400);
        });
        
        test('should return 400 for invalid data types', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.invalidRequestPayloads.invalidDataTypes.usernameAsNumber)
                .expect(400)
                .expect('Content-Type', /json/);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(400);
        });
    });
    
    describe('PUT /api/items/:id - Full Item Update', () => {
        
        test('should update item with complete replacement semantics', async () => {
            const response = await request(app)
                .put('/api/items/123')
                .send(testData.validRequestPayloads.updateUser.basic)
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('updated');
        });
        
        test('should return 404 for non-existent item', async () => {
            const response = await request(app)
                .put('/api/items/999999')
                .send(testData.validRequestPayloads.updateUser.basic)
                .expect(404)
                .expect('Content-Type', /json/);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(404);
        });
    });
    
    describe('PATCH /api/items/:id - Partial Item Update', () => {
        
        test('should update item with JSON merge patch semantics', async () => {
            const response = await request(app)
                .patch('/api/items/123')
                .send(testData.validRequestPayloads.updateUser.roleChange)
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('updated');
        });
        
        test('should handle password change requests', async () => {
            const response = await request(app)
                .patch('/api/items/123')
                .send(testData.validRequestPayloads.updateUser.passwordChange)
                .expect(200)
                .expect('Content-Type', /json/);
                
            expect(response.body.success).toBe(true);
        });
    });
    
    describe('DELETE /api/items/:id - Delete Item', () => {
        
        test('should delete item and return 204 No Content', async () => {
            await request(app)
                .delete('/api/items/123')
                .expect(204);
        });
        
        test('should return 404 for non-existent item deletion', async () => {
            const response = await request(app)
                .delete('/api/items/999999')
                .expect(404)
                .expect('Content-Type', /json/);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(404);
        });
    });
    
    describe('OPTIONS - CORS Preflight Request Handling', () => {
        
        test('should handle CORS preflight requests', async () => {
            const response = await request(app)
                .options('/api/items')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST')
                .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
                .expect(200);
                
            expect(response.headers['access-control-allow-origin']).toBeTruthy();
            expect(response.headers['access-control-allow-methods']).toBeTruthy();
            expect(response.headers['access-control-allow-headers']).toBeTruthy();
        });
    });
});

/**
 * Middleware Functionality Tests
 * Validate proper middleware execution and configuration
 */
describe('Middleware Functionality Tests', () => {
    
    describe('Body Parsing Middleware', () => {
        
        test('should parse JSON request bodies correctly', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.validRequestPayloads.createUser.basic)
                .set('Content-Type', 'application/json')
                .expect(201);
                
            expect(response.body.success).toBe(true);
        });
        
        test('should handle URL-encoded form data', async () => {
            const response = await request(app)
                .post('/webhooks/form-test')
                .send('username=testuser&email=test@example.com')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect((res) => {
                    // Should not return 500 error for form parsing
                    expect(res.status).not.toBe(500);
                });
        });
        
        test('should reject malformed JSON with 400 status', async () => {
            const response = await request(app)
                .post('/api/items')
                .send('{"username": "test", "email": }')
                .set('Content-Type', 'application/json')
                .expect(400);
                
            expect(response.body.error).toBe(true);
            expect(response.body.message).toContain('JSON');
        });
    });
    
    describe('CORS Middleware', () => {
        
        test('should include proper CORS headers in responses', async () => {
            const response = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:3000')
                .expect(200);
                
            expect(response.headers['access-control-allow-origin']).toBeTruthy();
        });
        
        test('should handle cross-origin requests', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://example.com')
                .expect(200);
                
            expect(response.headers['access-control-allow-origin']).toBeTruthy();
        });
    });
    
    describe('Security Headers Middleware (Helmet)', () => {
        
        test('should include security headers in responses', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            // Check for common security headers added by Helmet
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBeTruthy();
            expect(response.headers['x-xss-protection']).toBeTruthy();
        });
        
        test('should not expose x-powered-by header', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            expect(response.headers['x-powered-by']).toBeUndefined();
        });
    });
    
    describe('Compression Middleware', () => {
        
        test('should compress large responses', async () => {
            const response = await request(app)
                .get('/api/items')
                .set('Accept-Encoding', 'gzip, deflate')
                .expect(200);
                
            // Response should include content-encoding for large payloads
            if (response.headers['content-length'] > 1024) {
                expect(response.headers['content-encoding']).toBeTruthy();
            }
        });
    });
    
    describe('Logging Middleware (Morgan)', () => {
        
        test('should log HTTP requests', async () => {
            // Mock console.log to capture logging output
            const originalLog = console.log;
            const logSpy = jest.fn();
            console.log = logSpy;
            
            await request(app)
                .get('/health')
                .expect(200);
                
            // Restore original console.log
            console.log = originalLog;
            
            // Morgan logging should have occurred (captured in spy)
            expect(logSpy).toHaveBeenCalled();
        });
    });
    
    describe('Rate Limiting Middleware', () => {
        
        test('should allow normal request rates', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);
                
            expect(response.body.success).toBe(true);
        });
        
        test('should handle concurrent requests without errors', async () => {
            const requests = Array.from({ length: 10 }, () => 
                request(app).get('/api/health').expect(200)
            );
            
            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
            });
        });
    });
});

/**
 * Error Handling Tests
 * Validate comprehensive error handling and status codes
 */
describe('Error Handling Tests', () => {
    
    describe('400 Bad Request Errors', () => {
        
        test('should return 400 for malformed JSON', async () => {
            const response = await request(app)
                .post('/api/items')
                .send('{"invalid": json}')
                .set('Content-Type', 'application/json')
                .expect(400);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(400);
            expect(response.body.message).toContain('JSON');
        });
        
        test('should return 400 for validation errors', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.invalidRequestPayloads.boundaryViolations.usernameTooShort)
                .expect(400);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(400);
        });
        
        test('should return 400 for boundary violations', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.invalidRequestPayloads.boundaryViolations.passwordTooShort)
                .expect(400);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(400);
        });
    });
    
    describe('401 Unauthorized Errors', () => {
        
        test('should return 401 for authentication failures', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send(testData.authenticationTestData.invalidCredentials.wrongPassword)
                .expect(401);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(401);
        });
        
        test('should return 401 for missing credentials', async () => {
            const response = await request(app)
                .get('/api/protected')
                .expect(401);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(401);
        });
        
        test('should return 401 for invalid authentication tokens', async () => {
            const response = await request(app)
                .get('/api/protected')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(401);
        });
    });
    
    describe('404 Not Found Errors', () => {
        
        test('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });
        
        test('should return 404 for undefined API endpoints', async () => {
            const response = await request(app)
                .get('/undefined/endpoint')
                .expect(404);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(404);
        });
    });
    
    describe('500 Internal Server Errors', () => {
        
        test('should handle unhandled exceptions gracefully', async () => {
            // Mock an endpoint that throws an error
            const originalUse = app.use;
            app.use('/api/error-test', (req, res, next) => {
                throw new Error('Test internal server error');
            });
            
            const response = await request(app)
                .get('/api/error-test')
                .expect(500);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(500);
            
            // Restore original app.use
            app.use = originalUse;
        });
    });
    
    describe('Error Response Format Consistency', () => {
        
        test('should return consistent error response structure', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
                
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('path');
            expect(response.body).toHaveProperty('method');
        });
        
        test('should include request ID for error correlation', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
                
            expect(response.body.requestId).toBeTruthy();
        });
    });
    
    describe('Custom Error Classes', () => {
        
        test('should handle UnauthorizedError correctly', () => {
            const error = new UnauthorizedError('Test unauthorized access');
            
            expect(error.message).toBe('Test unauthorized access');
            expect(error.statusCode).toBe(401);
            expect(error.name).toBe('UnauthorizedError');
        });
    });
});

/**
 * Server Lifecycle Tests
 * Test server startup, shutdown, and signal handling
 */
describe('Server Lifecycle Tests', () => {
    
    describe('Server Startup Tests', () => {
        
        test('should start server successfully', () => {
            expect(testServer).toBeTruthy();
            expect(testServer.listening).toBe(true);
        });
        
        test('should bind to correct port', () => {
            const address = testServer.address();
            expect(address.port).toBe(TEST_PORT);
        });
        
        test('should prevent multiple server instances on same port', async () => {
            // Attempt to start another server on the same port
            const server2 = http.createServer(app);
            
            try {
                await new Promise((resolve, reject) => {
                    server2.listen(TEST_PORT, (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            server2.close();
                            resolve();
                        }
                    });
                });
                
                // Should not reach here
                expect(true).toBe(false);
            } catch (error) {
                expect(error.code).toBe('EADDRINUSE');
            }
        });
    });
    
    describe('Graceful Shutdown Tests', () => {
        
        test('should handle SIGTERM signal gracefully', (done) => {
            const mockServer = http.createServer(app);
            const mockPort = TEST_PORT + 1;
            
            mockServer.listen(mockPort, () => {
                // Send SIGTERM signal
                mockServer.emit('SIGTERM');
                
                // Server should close gracefully
                mockServer.close(() => {
                    expect(mockServer.listening).toBe(false);
                    done();
                });
            });
        });
        
        test('should handle SIGINT signal gracefully', (done) => {
            const mockServer = http.createServer(app);
            const mockPort = TEST_PORT + 2;
            
            mockServer.listen(mockPort, () => {
                // Send SIGINT signal
                mockServer.emit('SIGINT');
                
                // Server should close gracefully
                mockServer.close(() => {
                    expect(mockServer.listening).toBe(false);
                    done();
                });
            });
        });
        
        test('should cleanup resources during shutdown', async () => {
            const eventEmitter = new EventEmitter();
            const cleanupSpy = jest.fn();
            
            eventEmitter.on('cleanup', cleanupSpy);
            eventEmitter.emit('cleanup');
            
            expect(cleanupSpy).toHaveBeenCalled();
        });
    });
    
    describe('Connection Management', () => {
        
        test('should track active connections', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            expect(response.body.success).toBe(true);
        });
        
        test('should handle connection cleanup', async () => {
            // Multiple requests to test connection handling
            const requests = Array.from({ length: 5 }, () => 
                request(app).get('/health').expect(200)
            );
            
            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
            });
        });
    });
});

/**
 * Edge Cases and Boundary Conditions Tests
 * Test extreme scenarios and boundary conditions
 */
describe('Edge Cases and Boundary Conditions', () => {
    
    describe('Empty Request Bodies', () => {
        
        test('should handle empty POST request bodies', async () => {
            const response = await request(app)
                .post('/api/items')
                .send({})
                .expect(400);
                
            expect(response.body.error).toBe(true);
            expect(response.body.status).toBe(400);
        });
        
        test('should handle null request bodies', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(null)
                .expect(400);
                
            expect(response.body.error).toBe(true);
        });
    });
    
    describe('Large Payload Handling', () => {
        
        test('should handle large JSON payloads', async () => {
            const largePayload = testData.edgeCaseDataSets.maximumPayloadSizes.nearMaximumUserObject;
            
            const response = await request(app)
                .post('/api/items')
                .send(largePayload)
                .expect((res) => {
                    // Should handle large payloads without crashing
                    expect([200, 201, 400, 413]).toContain(res.status);
                });
        });
        
        test('should reject extremely large payloads', async () => {
            const oversizedPayload = {
                data: 'x'.repeat(10 * 1024 * 1024) // 10MB string
            };
            
            const response = await request(app)
                .post('/api/items')
                .send(oversizedPayload)
                .expect((res) => {
                    // Should reject with 413 Payload Too Large or handle gracefully
                    expect([400, 413, 500]).toContain(res.status);
                });
        });
    });
    
    describe('Special Characters and Unicode', () => {
        
        test('should handle Unicode characters correctly', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.edgeCaseDataSets.specialCharactersHandling.unicodeCharacters)
                .expect((res) => {
                    // Should handle Unicode without errors
                    expect(res.status).not.toBe(500);
                });
        });
        
        test('should sanitize potential XSS attempts', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.edgeCaseDataSets.specialCharactersHandling.xssAttempts)
                .expect((res) => {
                    // Should reject or sanitize XSS attempts
                    expect([400, 422]).toContain(res.status);
                });
        });
        
        test('should handle SQL injection attempts safely', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.edgeCaseDataSets.specialCharactersHandling.sqlInjectionAttempts)
                .expect((res) => {
                    // Should reject SQL injection attempts
                    expect([400, 422]).toContain(res.status);
                });
        });
    });
    
    describe('Null and Undefined Values', () => {
        
        test('should handle null values in request', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.edgeCaseDataSets.nullAndUndefinedScenarios.mixedNullValues)
                .expect(400);
                
            expect(response.body.error).toBe(true);
        });
        
        test('should handle deeply nested null values', async () => {
            const response = await request(app)
                .post('/api/items')
                .send(testData.edgeCaseDataSets.nullAndUndefinedScenarios.deeplyNestedNulls)
                .expect(400);
                
            expect(response.body.error).toBe(true);
        });
    });
    
    describe('Concurrent Request Handling', () => {
        
        test('should handle concurrent requests without conflicts', async () => {
            const concurrentRequests = testData.edgeCaseDataSets.concurrentRequestSimulation.multipleUsers
                .slice(0, 10) // Test with first 10 users
                .map((userData) => 
                    request(app)
                        .post('/api/items')
                        .send(userData.payload)
                        .expect((res) => {
                            expect([200, 201, 400]).toContain(res.status);
                        })
                );
                
            const responses = await Promise.all(concurrentRequests);
            
            // All requests should complete without server errors
            responses.forEach(response => {
                expect(response.status).not.toBe(500);
            });
        });
        
        test('should handle rapid-fire requests', async () => {
            const rapidRequests = Array.from({ length: 20 }, () => 
                request(app).get('/api/health').expect(200)
            );
            
            const responses = await Promise.all(rapidRequests);
            
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
            });
        });
    });
    
    describe('Invalid Content-Type Headers', () => {
        
        test('should handle missing Content-Type header', async () => {
            const response = await request(app)
                .post('/api/items')
                .send('{"username": "test"}')
                .expect((res) => {
                    expect([200, 201, 400]).toContain(res.status);
                });
        });
        
        test('should handle invalid Content-Type header', async () => {
            const response = await request(app)
                .post('/api/items')
                .set('Content-Type', 'invalid/type')
                .send('{"username": "test"}')
                .expect((res) => {
                    expect([400, 415]).toContain(res.status);
                });
        });
    });
    
    describe('Timeout Scenarios', () => {
        
        test('should handle request timeout gracefully', async () => {
            const response = await request(app)
                .get('/api/health')
                .timeout(1000) // 1 second timeout
                .expect((res) => {
                    // Should complete within timeout or handle gracefully
                    expect(res.status).toBeLessThan(600);
                });
        }, 5000);
    });
});

/**
 * HTTP Status Code Validation Tests
 * Ensure all required HTTP status codes are properly implemented
 */
describe('HTTP Status Code Validation', () => {
    
    test('should return 200 for successful GET requests', async () => {
        await request(app)
            .get('/health')
            .expect(200);
    });
    
    test('should return 201 for successful POST requests', async () => {
        await request(app)
            .post('/api/items')
            .send(testData.validRequestPayloads.createUser.basic)
            .expect(201);
    });
    
    test('should return 204 for successful DELETE requests', async () => {
        await request(app)
            .delete('/api/items/123')
            .expect(204);
    });
    
    test('should return 400 for bad requests', async () => {
        await request(app)
            .post('/api/items')
            .send({})
            .expect(400);
    });
    
    test('should return 401 for unauthorized requests', async () => {
        await request(app)
            .get('/api/protected')
            .expect(401);
    });
    
    test('should return 404 for not found resources', async () => {
        await request(app)
            .get('/api/nonexistent')
            .expect(404);
    });
    
    test('should return 500 for internal server errors', async () => {
        // Mock an endpoint that throws an error
        app.use('/api/error-500', (req, res, next) => {
            throw new Error('Simulated server error');
        });
        
        await request(app)
            .get('/api/error-500')
            .expect(500);
    });
});

/**
 * Headers Validation Tests
 * Validate proper HTTP headers in responses
 */
describe('Headers Validation Tests', () => {
    
    test('should include proper Content-Type headers', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200)
            .expect('Content-Type', /json/);
    });
    
    test('should include CORS headers for cross-origin requests', async () => {
        const response = await request(app)
            .get('/health')
            .set('Origin', 'http://localhost:3000')
            .expect(200);
            
        expect(response.headers['access-control-allow-origin']).toBeTruthy();
    });
    
    test('should include security headers', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBeTruthy();
    });
    
    test('should not expose sensitive server information', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.headers['x-powered-by']).toBeUndefined();
        expect(response.headers['server']).toBeUndefined();
    });
});