const request = require('supertest');
const server = require('../server');

describe('Server HTTP Tests', () => {
    // Server instance is already created and ready to use
    // No need to start/stop in each test - Supertest handles this

    describe('GET / endpoint', () => {
        test('should return 200 status code', async () => {
            const response = await request(server)
                .get('/')
                .expect(200);
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        test('should return correct response body', async () => {
            const response = await request(server)
                .get('/')
                .expect(200);
            
            expect(response.body).toEqual({
                status: 'ok',
                code: 200,
                message: 'Testinium-QA HTTP Server Running'
            });
        });

        test('should have custom server headers', async () => {
            const response = await request(server)
                .get('/')
                .expect(200);
            
            expect(response.headers['x-server']).toBe('Testinium-QA-Server');
            expect(response.headers['x-timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });

    describe('GET /health endpoint', () => {
        test('should return 200 status code', async () => {
            await request(server)
                .get('/health')
                .expect(200);
        });

        test('should return health status with uptime and memory info', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('memory');
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
            expect(typeof response.body.memory).toBe('object');
        });

        test('should have valid ISO timestamp in headers', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);
            
            const timestamp = response.headers['x-timestamp'];
            expect(timestamp).toBeDefined();
            expect(() => new Date(timestamp).toISOString()).not.toThrow();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        test('should have correct content type', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    describe('POST /data endpoint', () => {
        test('should accept valid JSON data', async () => {
            const testData = { name: 'test', value: 123 };
            
            const response = await request(server)
                .post('/data')
                .send(testData)
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'received');
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('data', testData);
            expect(response.body).toHaveProperty('size');
            expect(typeof response.body.size).toBe('number');
        });

        test('should reject invalid JSON with 400', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Bad Request');
            expect(response.body).toHaveProperty('code', 400);
            expect(response.body).toHaveProperty('message');
        });

        test('should handle empty JSON object', async () => {
            const response = await request(server)
                .post('/data')
                .send({})
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'received');
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('data', {});
        });

        test('should handle complex JSON data', async () => {
            const complexData = {
                user: {
                    id: 1,
                    name: 'John Doe',
                    preferences: ['setting1', 'setting2'],
                    metadata: {
                        created: '2023-01-01',
                        active: true
                    }
                }
            };
            
            const response = await request(server)
                .post('/data')
                .send(complexData)
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'received');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toEqual(complexData);
        });

        test('should return timestamp in ISO format in headers', async () => {
            const response = await request(server)
                .post('/data')
                .send({ test: 'data' })
                .expect(200);
            
            const timestamp = response.headers['x-timestamp'];
            expect(timestamp).toBeDefined();
            expect(() => new Date(timestamp).toISOString()).not.toThrow();
        });
    });

    describe('Server Headers', () => {
        test('should set Content-Type header for all endpoints', async () => {
            const endpoints = ['/', '/health'];
            
            for (const endpoint of endpoints) {
                const response = await request(server)
                    .get(endpoint)
                    .expect(200);
                    
                expect(response.headers['content-type']).toMatch(/application\/json/);
            }
        });

        test('should set X-Server header for all endpoints', async () => {
            const endpoints = ['/', '/health'];
            
            for (const endpoint of endpoints) {
                const response = await request(server)
                    .get(endpoint)
                    .expect(200);
                    
                expect(response.headers['x-server']).toBe('Testinium-QA-Server');
                expect(response.headers['x-timestamp']).toBeDefined();
            }
        });
    });

    describe('Response Time Performance', () => {
        test('should respond to GET / within 100ms', async () => {
            const start = Date.now();
            
            await request(server)
                .get('/')
                .expect(200);
                
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(100);
        });

        test('should respond to POST /data within 100ms', async () => {
            const start = Date.now();
            
            await request(server)
                .post('/data')
                .send({ test: 'data' })
                .expect(200);
                
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(100);
        });
    });
});