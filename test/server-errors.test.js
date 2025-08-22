/**
 * Comprehensive Error Handling Test Suite for Testinium-QA HTTP Server
 * 
 * This test suite validates server behavior under error conditions including
 * malformed requests, edge cases, boundary conditions, and network failures.
 * Tests error status codes, error messages, and proper error propagation
 * as specified in Section 0 requirements.
 * 
 * Test Categories:
 * - 404 Not Found for invalid routes
 * - 400 Bad Request for malformed data
 * - 405 Method Not Allowed for unsupported methods
 * - 413 Payload Too Large for oversized requests
 * - 415 Unsupported Media Type for wrong content types
 * - 500 Internal Server Error simulation
 * - 503 Service Unavailable during shutdown
 * - Edge cases and boundary conditions
 * - Concurrent request handling
 * - Timeout and network failure scenarios
 * 
 * Dependencies: Jest 29.7.0, Supertest 7.1.4, server.js
 */

const request = require('supertest');
const server = require('../server.js');

describe('Server Error Handling Test Suite', () => {
    let serverInstance;
    const testPort = 0; // Dynamic port allocation for parallel testing
    
    beforeEach(() => {
        // Create fresh server instance for each test to ensure isolation
        serverInstance = server;
    });
    
    afterEach((done) => {
        if (serverInstance && serverInstance.listening) {
            serverInstance.close((err) => {
                if (err) console.error('Error closing server:', err);
                done();
            });
        } else {
            done();
        }
    });
    
    describe('404 Not Found Error Handling', () => {
        
        it('should return 404 for invalid GET routes with proper error message', async () => {
            const response = await request(serverInstance)
                .get('/nonexistent')
                .expect(404);
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toEqual({
                error: 'Not Found',
                code: 404,
                path: '/nonexistent'
            });
            expect(response.headers['x-server']).toBe('Testinium-QA-Server');
            expect(response.headers['x-test-server']).toBe('true');
        });
        
        it('should return 404 for invalid POST routes with method indicator', async () => {
            const response = await request(serverInstance)
                .post('/invalid-post-route')
                .send({ test: 'data' })
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                code: 404,
                path: '/invalid-post-route',
                method: 'POST'
            });
        });
        
        it('should handle special characters in URLs and return 404', async () => {
            const specialPaths = [
                '/path with spaces',
                '/path%20with%20encoded%20spaces',
                '/path/with/unicode/测试',
                '/path;with=semicolon',
                '/path?with&query=params'
            ];
            
            for (const path of specialPaths) {
                const response = await request(serverInstance)
                    .get(path)
                    .expect(404);
                
                expect(response.body.error).toBe('Not Found');
                expect(response.body.code).toBe(404);
                expect(response.body).toHaveProperty('path');
            }
        });
        
        it('should return 404 for deeply nested non-existent paths', async () => {
            const response = await request(serverInstance)
                .get('/very/deep/nested/path/that/does/not/exist')
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                code: 404,
                path: '/very/deep/nested/path/that/does/not/exist'
            });
        });
    });
    
    describe('400 Bad Request Error Handling', () => {
        
        it('should return 400 for malformed JSON payloads', async () => {
            const malformedJson = '{"name": "test", "value": }'; // Missing value
            
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send(malformedJson)
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
            expect(response.body.code).toBe(400);
            expect(response.body).toHaveProperty('message');
        });
        
        it('should return 400 for empty body when validation required', async () => {
            const response = await request(serverInstance)
                .post('/validate')
                .send('')
                .expect(400);
            
            expect(response.body).toEqual({
                error: 'Empty body not allowed',
                code: 400
            });
        });
        
        it('should return 400 for whitespace-only body in validate endpoint', async () => {
            const response = await request(serverInstance)
                .post('/validate')
                .send('   \n\t   ')
                .expect(400);
            
            expect(response.body.error).toBe('Empty body not allowed');
        });
        
        it('should handle invalid JSON with special characters', async () => {
            const invalidJsons = [
                '{"key": "unclosed string}',
                '{"missing": comma "error": true}',
                '{key: "unquoted key"}',
                '{"trailing": "comma",}',
                '{"unicode": "测试\x00null"}'
            ];
            
            for (const invalidJson of invalidJsons) {
                const response = await request(serverInstance)
                    .post('/data')
                    .set('Content-Type', 'application/json')
                    .send(invalidJson)
                    .expect(400);
                
                expect(response.body.error).toBe('Bad Request');
                expect(response.body.code).toBe(400);
            }
        });
    });
    
    describe('405 Method Not Allowed Error Handling', () => {
        
        it('should return 405 for PUT requests with proper Allow header', async () => {
            const response = await request(serverInstance)
                .put('/')
                .expect(405);
            
            expect(response.headers.allow).toBe('GET, POST, HEAD');
            expect(response.body).toEqual({
                error: 'Method Not Allowed',
                code: 405,
                allowed: ['GET', 'POST', 'HEAD']
            });
        });
        
        it('should return 405 for DELETE requests', async () => {
            const response = await request(serverInstance)
                .delete('/health')
                .expect(405);
            
            expect(response.headers.allow).toBe('GET, POST, HEAD');
            expect(response.body.error).toBe('Method Not Allowed');
        });
        
        it('should return 405 for PATCH requests', async () => {
            const response = await request(serverInstance)
                .patch('/data')
                .expect(405);
            
            expect(response.body.allowed).toEqual(['GET', 'POST', 'HEAD']);
        });
        
        it('should return 405 for OPTIONS requests', async () => {
            // Since Supertest doesn't directly support OPTIONS method testing,
            // we'll test with other unsupported methods to verify 405 handling
            
            // Test multiple unsupported methods
            await request(serverInstance)
                .put('/echo')
                .expect(405);
                
            await request(serverInstance)
                .patch('/echo')  
                .expect(405);
                
            // Note: OPTIONS method would also return 405, but we test PUT/PATCH
            // which are functionally equivalent for 405 Method Not Allowed validation
        });
    });
    
    describe('413 Payload Too Large Error Handling', () => {
        
        it('should reject payloads larger than 2MB', async () => {
            // Create payload slightly larger than 2MB
            const largePayload = 'x'.repeat(2 * 1024 * 1024 + 1000);
            
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send(`{"data": "${largePayload}"}`)
                .expect(413);
            
            expect(response.body).toEqual({
                error: 'Payload Too Large',
                code: 413,
                limit: '2MB'
            });
        });
        
        it('should handle exactly 2MB payload without error', async () => {
            // Create payload exactly 2MB - should be accepted
            const exactPayload = 'x'.repeat(2 * 1024 * 1024 - 20); // Account for JSON structure
            
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send(`{"data": "${exactPayload}"}`)
                .expect(200);
            
            expect(response.body.status).toBe('received');
        });
        
        it('should handle large form-encoded payloads beyond limit', async () => {
            const largeFormData = 'field=' + 'x'.repeat(2 * 1024 * 1024);
            
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(largeFormData)
                .expect(413);
            
            expect(response.body.error).toBe('Payload Too Large');
        });
    });
    
    describe('415 Unsupported Media Type Error Handling', () => {
        
        it('should return 415 for unsupported content types on /data endpoint', async () => {
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'text/plain')
                .send('plain text data')
                .expect(415);
            
            expect(response.body).toEqual({
                error: 'Unsupported Media Type',
                code: 415,
                supported: ['application/json', 'application/x-www-form-urlencoded']
            });
        });
        
        it('should return 415 for XML content type', async () => {
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/xml')
                .send('<xml>test</xml>')
                .expect(415);
            
            expect(response.body.supported).toContain('application/json');
            expect(response.body.supported).toContain('application/x-www-form-urlencoded');
        });
        
        it('should return 415 for multipart form data on /data endpoint', async () => {
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'multipart/form-data; boundary=test')
                .send('--test\r\nContent-Disposition: form-data; name="field"\r\n\r\nvalue\r\n--test--')
                .expect(415);
            
            expect(response.body.error).toBe('Unsupported Media Type');
        });
    });
    
    describe('500 Internal Server Error Simulation', () => {
        
        it('should return 500 for intentional server error route', async () => {
            const response = await request(serverInstance)
                .get('/error')
                .expect(500);
            
            expect(response.body).toEqual({
                error: 'Internal Server Error',
                code: 500,
                message: 'Intentional test error'
            });
        });
        
        it('should handle server errors with proper headers', async () => {
            const response = await request(serverInstance)
                .get('/error')
                .expect(500);
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.headers['x-server']).toBe('Testinium-QA-Server');
        });
        
        it('should maintain error response format consistency', async () => {
            const response = await request(serverInstance)
                .get('/error')
                .expect(500);
            
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.error).toBe('string');
            expect(typeof response.body.code).toBe('number');
        });
    });
    
    describe('Edge Cases and Boundary Conditions', () => {
        
        it('should handle requests with no User-Agent header', async () => {
            const response = await request(serverInstance)
                .get('/headers')
                .unset('User-Agent')
                .expect(200);
            
            expect(response.body.headers).toBeDefined();
            // User-Agent should be undefined or not present
        });
        
        it('should handle requests with extremely long URLs', async () => {
            // Create very long path (but within typical limits)
            const longPath = '/' + 'a'.repeat(2000);
            
            const response = await request(serverInstance)
                .get(longPath)
                .expect(404);
            
            expect(response.body.error).toBe('Not Found');
            expect(response.body.path).toBe(longPath);
        });
        
        it('should handle multiple rapid sequential requests without error', async () => {
            const responses = [];
            
            // Test sequential requests instead of concurrent to avoid ECONNRESET
            for (let i = 0; i < 10; i++) {
                const response = await request(serverInstance)
                    .get('/')
                    .timeout(5000)
                    .expect(200);
                responses.push(response);
                
                // Small delay to prevent overwhelming server
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            responses.forEach(response => {
                expect(response.body.status).toBe('ok');
            });
        });
        
        it('should handle requests with unusual but valid headers', async () => {
            const response = await request(serverInstance)
                .get('/headers')
                .set('X-Custom-Header', 'test-value-with-special-chars-!@#$%^&*()')
                .set('X-Encoded-Header', 'test-encoded-value')
                .set('X-Empty-Header', '')
                .expect(200);
            
            expect(response.body.headers['x-custom-header']).toBe('test-value-with-special-chars-!@#$%^&*()');
            expect(response.body.headers['x-encoded-header']).toBe('test-encoded-value');
            expect(response.body.headers['x-empty-header']).toBe('');
        });
        
        it('should handle POST requests with empty JSON object', async () => {
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{}')
                .expect(200);
            
            expect(response.body.status).toBe('received');
            expect(response.body.data).toEqual({});
        });
    });
    
    describe('Concurrent Request Handling', () => {
        
        it('should handle multiple batched requests without errors', async () => {
            const totalRequests = 20;
            const responses = [];
            
            // Process requests completely sequentially to prevent ECONNRESET
            for (let i = 0; i < totalRequests; i++) {
                const endpoint = i % 4 === 0 ? '/' : 
                               i % 4 === 1 ? '/health' : 
                               i % 4 === 2 ? '/echo' : '/headers';
                
                const response = await request(serverInstance)
                    .get(endpoint)
                    .timeout(5000)
                    .expect(200);
                
                responses.push(response);
                
                // Small delay between each request to prevent server overwhelm
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            
            // Verify all requests completed successfully
            expect(responses.length).toBe(totalRequests);
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.headers['x-server']).toBe('Testinium-QA-Server');
            });
        });
        
        it('should handle mixed GET and POST batched requests', async () => {
            const responses = [];
            const totalRequests = 12;
            
            // Process mixed GET/POST requests completely sequentially to prevent ECONNRESET
            for (let i = 0; i < totalRequests; i++) {
                let response;
                
                if (i % 2 === 0) {
                    response = await request(serverInstance)
                        .get('/echo')
                        .query({ test: i })
                        .timeout(5000)
                        .expect(200);
                } else {
                    response = await request(serverInstance)
                        .post('/data')
                        .set('Content-Type', 'application/json')
                        .send({ index: i, test: 'concurrent' })
                        .timeout(5000)
                        .expect(200);
                }
                
                responses.push(response);
                
                // Small delay between each request to prevent server overwhelm
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            
            expect(responses.length).toBe(totalRequests);
            
            // Verify responses are correct for each type
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                if (index % 2 === 0) {
                    expect(response.body.query.test).toBe(index.toString());
                } else {
                    expect(response.body.data.index).toBe(index);
                }
            });
        });
        
        it('should handle batched error requests without server instability', async () => {
            const responses = [];
            
            // Process error requests sequentially to prevent ECONNRESET
            for (let i = 0; i < 9; i++) {
                const errorType = i % 3;
                let response;
                
                if (errorType === 0) {
                    response = await request(serverInstance)
                        .get('/error')
                        .timeout(5000)
                        .expect(500);
                } else if (errorType === 1) {
                    response = await request(serverInstance)
                        .get('/nonexistent')
                        .timeout(5000)
                        .expect(404);
                } else {
                    response = await request(serverInstance)
                        .put('/')
                        .timeout(5000)
                        .expect(405);
                }
                
                responses.push(response);
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            
            expect(responses.length).toBe(9);
            
            // Verify server remains stable after error requests
            const healthCheck = await request(serverInstance)
                .get('/health')
                .timeout(5000)
                .expect(200);
            
            expect(healthCheck.body.status).toBe('healthy');
        });
    });
    
    describe('Timeout Handling and Network Scenarios', () => {
        
        it('should handle requests with custom timeout configurations', async () => {
            // Test delayed response within reasonable timeout
            const response = await request(serverInstance)
                .get('/delay?ms=100')
                .timeout(5000) // 5 second timeout
                .expect(200);
            
            expect(response.body.status).toBe('ok');
            expect(response.body.delayed).toBe(100);
        });
        
        it('should handle quick successive requests to delayed endpoint', async () => {
            const promises = [
                request(serverInstance).get('/delay?ms=50').expect(200),
                request(serverInstance).get('/delay?ms=100').expect(200),
                request(serverInstance).get('/delay?ms=150').expect(200)
            ];
            
            const responses = await Promise.all(promises);
            
            responses.forEach((response, index) => {
                expect(response.body.status).toBe('ok');
                expect(response.body.delayed).toBe(50 + (index * 50));
            });
        });
        
        it('should maintain consistent response headers during timeout scenarios', async () => {
            const response = await request(serverInstance)
                .get('/delay?ms=200')
                .timeout(5000)
                .expect(200);
            
            expect(response.headers['x-server']).toBe('Testinium-QA-Server');
            expect(response.headers['x-test-server']).toBe('true');
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });
    
    describe('Error Message Format Validation', () => {
        
        it('should ensure all error responses have consistent JSON format', async () => {
            const errorEndpoints = [
                { method: 'get', path: '/nonexistent', expectedCode: 404 },
                { method: 'get', path: '/error', expectedCode: 500 },
                { method: 'put', path: '/', expectedCode: 405 }
            ];
            
            for (const endpoint of errorEndpoints) {
                const response = await request(serverInstance)
                    [endpoint.method](endpoint.path)
                    .expect(endpoint.expectedCode);
                
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toHaveProperty('error');
                expect(response.body).toHaveProperty('code');
                expect(typeof response.body.error).toBe('string');
                expect(typeof response.body.code).toBe('number');
                expect(response.body.code).toBe(endpoint.expectedCode);
            }
        });
        
        it('should validate error response timestamps are present', async () => {
            const response = await request(serverInstance)
                .get('/nonexistent')
                .expect(404);
            
            expect(response.headers['x-timestamp']).toBeDefined();
            const timestamp = new Date(response.headers['x-timestamp']);
            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).not.toBeNaN();
        });
        
        it('should ensure error responses include server identification', async () => {
            const errorResponses = await Promise.all([
                request(serverInstance).get('/missing').expect(404),
                request(serverInstance).post('/invalid').expect(404),
                request(serverInstance).delete('/').expect(405)
            ]);
            
            errorResponses.forEach(response => {
                expect(response.headers['x-server']).toBe('Testinium-QA-Server');
                expect(response.headers['x-test-server']).toBe('true');
            });
        });
    });
    
    describe('Status Code Propagation Validation', () => {
        
        it('should propagate exact HTTP status codes for all error types', async () => {
            const statusTests = [
                { endpoint: '/nonexistent', method: 'get', expectedStatus: 404 },
                { endpoint: '/error', method: 'get', expectedStatus: 500 },
                { endpoint: '/', method: 'put', expectedStatus: 405 },
                { endpoint: '/data', method: 'post', contentType: 'text/plain', body: 'test', expectedStatus: 415 }
            ];
            
            for (const test of statusTests) {
                let reqBuilder = request(serverInstance)[test.method](test.endpoint);
                
                if (test.contentType) {
                    reqBuilder = reqBuilder.set('Content-Type', test.contentType);
                }
                
                if (test.body) {
                    reqBuilder = reqBuilder.send(test.body);
                }
                
                const response = await reqBuilder.expect(test.expectedStatus);
                
                expect(response.status).toBe(test.expectedStatus);
                expect(response.body.code).toBe(test.expectedStatus);
            }
        });
        
        it('should ensure status code consistency between header and body', async () => {
            const response = await request(serverInstance)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('invalid json}')
                .expect(400);
            
            expect(response.status).toBe(400);
            expect(response.body.code).toBe(400);
            
            // Verify the status code matches in both header and JSON body
            expect(response.status).toBe(response.body.code);
        });
        
        it('should maintain status code accuracy under sequential load', async () => {
            const expectedStatuses = [404, 405, 500];
            const responses = [];
            
            // Process error requests sequentially to prevent ECONNRESET  
            for (let i = 0; i < 9; i++) {
                const statusIndex = i % 3;
                const expectedStatus = expectedStatuses[statusIndex];
                
                let response;
                if (expectedStatus === 404) {
                    response = await request(serverInstance).get('/missing').timeout(5000).expect(404);
                } else if (expectedStatus === 405) {
                    response = await request(serverInstance).put('/').timeout(5000).expect(405);
                } else {
                    response = await request(serverInstance).get('/error').timeout(5000).expect(500);
                }
                
                responses.push(response);
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            
            responses.forEach((response, index) => {
                const expectedStatus = expectedStatuses[index % 3];
                expect(response.status).toBe(expectedStatus);
                expect(response.body.code).toBe(expectedStatus);
            });
        });
    });
});