const request = require('supertest');
const server = require('../server');

describe('Server Error Handling Tests', () => {
    // Server instance is already created and ready to use
    // No need to start/stop in each test - Supertest handles this

    describe('404 Not Found Errors', () => {
        test('should return 404 for unknown GET routes', async () => {
            const response = await request(server)
                .get('/unknown-route')
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                code: 404,
                path: '/unknown-route'
            });
        });

        test('should return 404 for unknown POST routes', async () => {
            const response = await request(server)
                .post('/unknown-endpoint')
                .send({ test: 'data' })
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                code: 404,
                path: '/unknown-endpoint',
                method: 'POST'
            });
        });

        test('should return 405 for unsupported HTTP methods', async () => {
            const response = await request(server)
                .put('/')
                .send({ test: 'data' })
                .expect(405);
            
            expect(response.body).toEqual({
                error: 'Method Not Allowed',
                code: 405,
                allowed: ['GET', 'POST', 'HEAD']
            });
        });

        test('should return 405 for DELETE method', async () => {
            const response = await request(server)
                .delete('/data')
                .expect(405);
            
            expect(response.body).toEqual({
                error: 'Method Not Allowed',
                code: 405,
                allowed: ['GET', 'POST', 'HEAD']
            });
        });

        test('should return 405 for PATCH method', async () => {
            const response = await request(server)
                .patch('/health')
                .send({ update: 'data' })
                .expect(405);
            
            expect(response.body).toEqual({
                error: 'Method Not Allowed',
                code: 405,
                allowed: ['GET', 'POST', 'HEAD']
            });
        });

        test('should handle special characters in URL path', async () => {
            const response = await request(server)
                .get('/test%20path%20with%20spaces')
                .expect(404);
            
            expect(response.body.error).toBe('Not Found');
            expect(response.body.path).toBe('/test path with spaces'); // Server decodes the URL
            expect(response.body.code).toBe(404);
        });
    });

    describe('400 Bad Request Errors', () => {
        test('should return 400 for malformed JSON in POST /data', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Bad Request');
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.message).toBe('string');
        });

        test('should return 400 for incomplete JSON in POST /data', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"name": "test"')
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
        });

        test('should return 400 for non-JSON string in POST /data', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('not json at all')
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
        });

        test('should return 400 for empty malformed JSON', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{')
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
        });

        test('should return 400 for JSON with trailing comma', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"test": "value",}')
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
        });
    });

    describe('500 Internal Server Error', () => {
        test('should return 500 for /error endpoint', async () => {
            const response = await request(server)
                .get('/error')
                .expect(500);
            
            expect(response.body).toEqual({
                error: 'Internal Server Error',
                code: 500,
                message: 'Intentional test error'
            });
        });

        test('should maintain correct headers for error responses', async () => {
            const response = await request(server)
                .get('/error')
                .expect(500);
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.headers['x-test-server']).toBe('true');
        });

        test('should handle error endpoint with different methods', async () => {
            const methods = [
                { method: 'POST', expectedStatus: 404, expectedError: 'Not Found' },
                { method: 'PUT', expectedStatus: 405, expectedError: 'Method Not Allowed' },
                { method: 'DELETE', expectedStatus: 405, expectedError: 'Method Not Allowed' },
                { method: 'PATCH', expectedStatus: 405, expectedError: 'Method Not Allowed' }
            ];
            
            for (const { method, expectedStatus, expectedError } of methods) {
                const response = await request(server)
                    [method.toLowerCase()]('/error')
                    .expect(expectedStatus);
                
                expect(response.body.error).toBe(expectedError);
            }
        });
    });

    describe('Error Response Format', () => {
        test('should always return JSON error responses', async () => {
            const errorEndpoints = [
                { method: 'get', path: '/unknown', expectedStatus: 404 },
                { method: 'post', path: '/unknown', expectedStatus: 404 },
                { method: 'get', path: '/error', expectedStatus: 500 }
            ];
            
            for (const endpoint of errorEndpoints) {
                const response = await request(server)
                    [endpoint.method](endpoint.path)
                    .send({})
                    .expect(endpoint.expectedStatus);
                
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toHaveProperty('error');
                expect(response.body).toHaveProperty('code');
                expect(typeof response.body.error).toBe('string');
                expect(typeof response.body.code).toBe('number');
                
                // Different error types have different additional properties
                if (endpoint.expectedStatus === 500) {
                    expect(response.body).toHaveProperty('message');
                    expect(typeof response.body.message).toBe('string');
                } else {
                    expect(response.body).toHaveProperty('path');
                    expect(typeof response.body.path).toBe('string');
                }
            }
        });

        test('should include X-Test-Server header in all error responses', async () => {
            const response = await request(server)
                .get('/unknown-endpoint')
                .expect(404);
            
            expect(response.headers['x-test-server']).toBe('true');
        });

        test('should not expose internal error details', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
            
            // Should not expose internal Node.js error stack traces
            expect(response.body.message).not.toContain('SyntaxError');
            expect(response.body.message).not.toContain('at JSON.parse');
            expect(response.body).not.toHaveProperty('stack');
        });
    });

    describe('Edge Case Error Handling', () => {
        test('should handle extremely long URLs', async () => {
            const longPath = '/test' + 'a'.repeat(2000);
            
            const response = await request(server)
                .get(longPath)
                .expect(404);
            
            expect(response.body.error).toBe('Not Found');
            expect(response.body.path).toBe(longPath); // Server returns the full path
            expect(response.body.code).toBe(404);
        });

        test('should handle special characters in error paths', async () => {
            const specialChars = [
                '/test/path with spaces',
                '/test/path-with-dashes',
                '/test/path_with_underscores',
                '/test/path.with.dots',
                '/test/path@with@symbols'
            ];
            
            for (const path of specialChars) {
                const response = await request(server)
                    .get(path)
                    .expect(404);
                
                expect(response.body.error).toBe('Not Found');
                expect(response.body.path).toBe(path);
            }
        });

        test('should handle empty request body gracefully', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('')
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
        });

        test('should handle very large malformed JSON payloads', async () => {
            const largeInvalidJson = '{' + 'x'.repeat(1000) + 'invalid';
            
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send(largeInvalidJson)
                .expect(400);
            
            expect(response.body.error).toBe('Bad Request');
        });

        test('should handle numeric-only invalid JSON', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('123456789')
                .expect(200); // Numbers are valid JSON
            
            expect(response.body.data).toBe(123456789);
        });

        test('should handle boolean-only invalid JSON', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('true')
                .expect(200); // Booleans are valid JSON
            
            expect(response.body.data).toBe(true);
        });
    });

    describe('HTTP Method Error Consistency', () => {
        test('should return appropriate error codes for different methods', async () => {
            const testCases = [
                { method: 'GET', expectedStatus: 404, expectedError: 'Not Found' },
                { method: 'POST', expectedStatus: 404, expectedError: 'Not Found' },
                { method: 'PUT', expectedStatus: 405, expectedError: 'Method Not Allowed' },
                { method: 'DELETE', expectedStatus: 405, expectedError: 'Method Not Allowed' },
                { method: 'PATCH', expectedStatus: 405, expectedError: 'Method Not Allowed' }
            ];
            const testPath = '/nonexistent';
            
            for (const { method, expectedStatus, expectedError } of testCases) {
                const response = await request(server)
                    [method.toLowerCase()](testPath)
                    .send({})
                    .expect(expectedStatus);
                
                expect(response.body.error).toBe(expectedError);
                expect(response.body.code).toBe(expectedStatus);
                
                if (expectedStatus === 404) {
                    // 404 errors include path info
                    expect(response.body.path).toBe(testPath);
                    if (method !== 'GET') {
                        expect(response.body.method).toBe(method);
                    }
                } else {
                    // 405 errors include allowed methods
                    expect(response.body.allowed).toContain('GET');
                    expect(response.body.allowed).toContain('POST');
                    expect(response.body.allowed).toContain('HEAD');
                }
                
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.headers['x-test-server']).toBe('true');
            }
        });

        test('should handle OPTIONS method appropriately', async () => {
            const response = await request(server)
                .options('/')
                .expect(405);
            
            expect(response.body.error).toBe('Method Not Allowed');
            expect(response.body.code).toBe(405);
            expect(response.body.allowed).toContain('GET');
            expect(response.body.allowed).toContain('POST');
            expect(response.body.allowed).toContain('HEAD');
        });
    });
});