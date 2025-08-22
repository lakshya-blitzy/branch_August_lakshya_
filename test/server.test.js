const request = require('supertest');
const TestServer = require('../server');

describe('Server HTTP Tests', () => {
    let testServer;
    let server;
    let port;

    beforeEach((done) => {
        testServer = new TestServer(0); // Use port 0 for dynamic allocation
        server = testServer.start((error, assignedPort) => {
            if (error) {
                done(error);
                return;
            }
            port = assignedPort;
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
                message: 'Server is running'
            });
        });

        test('should have custom test server header', async () => {
            const response = await request(server)
                .get('/')
                .expect(200);
            
            expect(response.headers['x-test-server']).toBe('true');
        });
    });

    describe('GET /health endpoint', () => {
        test('should return 200 status code', async () => {
            await request(server)
                .get('/health')
                .expect(200);
        });

        test('should return health status with timestamp and uptime', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });

        test('should return valid ISO timestamp', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);
            
            const timestamp = response.body.timestamp;
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
            
            expect(response.body).toHaveProperty('message', 'Data received successfully');
            expect(response.body).toHaveProperty('received', testData);
            expect(response.body).toHaveProperty('timestamp');
        });

        test('should reject invalid JSON with 400', async () => {
            const response = await request(server)
                .post('/data')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Invalid JSON');
            expect(response.body).toHaveProperty('message');
        });

        test('should handle empty JSON object', async () => {
            const response = await request(server)
                .post('/data')
                .send({})
                .expect(200);
            
            expect(response.body).toHaveProperty('received', {});
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
            
            expect(response.body.received).toEqual(complexData);
        });

        test('should return timestamp in ISO format', async () => {
            const response = await request(server)
                .post('/data')
                .send({ test: 'data' })
                .expect(200);
            
            const timestamp = response.body.timestamp;
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

        test('should set X-Test-Server header for all endpoints', async () => {
            const endpoints = ['/', '/health'];
            
            for (const endpoint of endpoints) {
                const response = await request(server)
                    .get(endpoint)
                    .expect(200);
                    
                expect(response.headers['x-test-server']).toBe('true');
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