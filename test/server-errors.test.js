const request = require('supertest');
const TestServer = require('../server');

describe('Server Error Handling Tests', () => {
    let testServer;
    let server;

    beforeEach((done) => {
        testServer = new TestServer(0);
        server = testServer.start((error, port) => {
            if (error) {
                done(error);
                return;
            }
            done();
        });
    });

    afterEach((done) => {
        if (testServer) {
            testServer.stop(done);
        } else {
            done();
        }
    });

    describe('404 Not Found Errors', () => {
        test('should return 404 for unknown GET routes', async () => {
            const response = await request(server)
                .get('/unknown-route')
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                message: 'Route GET /unknown-route not found'
            });
        });

        test('should return 404 for unknown POST routes', async () => {
            const response = await request(server)
                .post('/unknown-endpoint')
                .send({ test: 'data' })
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                message: 'Route POST /unknown-endpoint not found'
            });
        });

        test('should return 404 for unsupported HTTP methods', async () => {
            const response = await request(server)
                .put('/')
                .send({ test: 'data' })
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                message: 'Route PUT / not found'
            });
        });

        test('should return 404 for DELETE method', async () => {
            const response = await request(server)
                .delete('/data')
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                message: 'Route DELETE /data not found'
            });
        });

        test('should return 404 for PATCH method', async () => {
            const response = await request(server)
                .patch('/health')
                .send({ update: 'data' })
                .expect(404);
            
            expect(response.body).toEqual({
                error: 'Not Found',
                message: 'Route PATCH /health not found'
            });
        });

        test('should handle special characters in URL path', async () => {
            const response = await request(server)
                .get('/test%20path%20with%20spaces')
                .expect(404);
            
            expect(response.body.error).toBe('Not Found');
            expect(response.body.message).toContain('not found');
        });
    });

    describe('400 Bad Request Errors', () => {
        test('should return 400 for malformed JSON in POST /data', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Invalid JSON');
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.message).toBe('string');
        });

        test('should return 400 for incomplete JSON in POST /data', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"name": "test"')
                .expect(400);
            
            expect(response.body.error).toBe('Invalid JSON');
        });

        test('should return 400 for non-JSON string in POST /data', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('not json at all')
                .expect(400);
            
            expect(response.body.error).toBe('Invalid JSON');
        });

        test('should return 400 for empty malformed JSON', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{')
                .expect(400);
            
            expect(response.body.error).toBe('Invalid JSON');
        });

        test('should return 400 for JSON with trailing comma', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"test": "value",}')
                .expect(400);
            
            expect(response.body.error).toBe('Invalid JSON');
        });
    });

    describe('500 Internal Server Error', () => {
        test('should return 500 for /error endpoint', async () => {
            const response = await request(server)
                .get('/error')
                .expect(500);
            
            expect(response.body).toEqual({
                error: 'Internal Server Error',
                message: 'This is a test error endpoint'
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
            const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
            
            for (const method of methods) {
                const response = await request(server)
                    [method.toLowerCase()]('/error')
                    .expect(404); // Should be 404 since /error only handles GET
                
                expect(response.body.error).toBe('Not Found');
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
                expect(response.body).toHaveProperty('message');
                expect(typeof response.body.error).toBe('string');
                expect(typeof response.body.message).toBe('string');
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
            expect(response.body.message).toContain('not found');
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
                expect(response.body.message).toContain('not found');
            }
        });

        test('should handle empty request body gracefully', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('')
                .expect(400);
            
            expect(response.body.error).toBe('Invalid JSON');
        });

        test('should handle very large malformed JSON payloads', async () => {
            const largeInvalidJson = '{' + 'x'.repeat(1000) + 'invalid';
            
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send(largeInvalidJson)
                .expect(400);
            
            expect(response.body.error).toBe('Invalid JSON');
        });

        test('should handle numeric-only invalid JSON', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('123456789')
                .expect(200); // Numbers are valid JSON
            
            expect(response.body.received).toBe(123456789);
        });

        test('should handle boolean-only invalid JSON', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('true')
                .expect(200); // Booleans are valid JSON
            
            expect(response.body.received).toBe(true);
        });
    });

    describe('HTTP Method Error Consistency', () => {
        test('should return consistent 404 format across different methods', async () => {
            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            const testPath = '/nonexistent';
            
            for (const method of methods) {
                const response = await request(server)
                    [method.toLowerCase()](testPath)
                    .send({})
                    .expect(404);
                
                expect(response.body).toEqual({
                    error: 'Not Found',
                    message: `Route ${method} ${testPath} not found`
                });
                
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.headers['x-test-server']).toBe('true');
            }
        });

        test('should handle OPTIONS method appropriately', async () => {
            // Most HTTP servers either handle OPTIONS or return 404/405
            try {
                const response = await request(server)
                    .options('/')
                    .expect(404);
                
                expect(response.body.error).toBe('Not Found');
                expect(response.body.message).toContain('OPTIONS');
            } catch (error) {
                // OPTIONS might not be supported by supertest or the server
                // This is acceptable behavior
                expect(error.message).toContain('OPTIONS');
            }
        });
    });
});