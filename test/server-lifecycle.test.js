const server = require('../server');
const http = require('http');

describe('Server Lifecycle Tests', () => {
    let testServerInstance;

    afterEach((done) => {
        // If we started a server instance, close it
        if (testServerInstance && testServerInstance.listening) {
            testServerInstance.close(() => {
                testServerInstance = null;
                done();
            });
        } else {
            done();
        }
    });

    describe('Server Startup', () => {
        test('should start server successfully on dynamic port', (done) => {
            testServerInstance = server.listen(0, 'localhost', (error) => {
                expect(error).toBeUndefined();
                const address = server.address();
                expect(address).toBeDefined();
                expect(address.port).toBeDefined();
                expect(typeof address.port).toBe('number');
                expect(address.port).toBeGreaterThan(0);
                expect(address.port).toBeLessThanOrEqual(65535);
                done();
            });
        });

        test('should start server on specified port when available', (done) => {
            // Use a high port number that's likely to be available
            const testPort = 8000 + Math.floor(Math.random() * 1000);
            testServerInstance = server.listen(testPort, 'localhost', (error) => {
                expect(error).toBeUndefined();
                const address = server.address();
                expect(address.port).toBe(testPort);
                done();
            });
        });

        test('should return server instance from listen method', (done) => {
            testServerInstance = server.listen(0, 'localhost', (error) => {
                expect(error).toBeUndefined();
                expect(testServerInstance).toBeInstanceOf(require('http').Server);
                expect(testServerInstance).toBe(server);
                done();
            });
        });

        test('should provide port information after binding', (done) => {
            testServerInstance = server.listen(0, 'localhost', (error) => {
                expect(error).toBeUndefined();
                
                const serverAddress = server.address();
                expect(serverAddress).toBeDefined();
                expect(serverAddress.port).toBeGreaterThan(0);
                done();
            });
        });

        test('should validate server instance properties', () => {
            // Test server instance has required methods
            expect(server).toBeInstanceOf(require('http').Server);
            expect(typeof server.listen).toBe('function');
            expect(typeof server.close).toBe('function');
            expect(typeof server.address).toBe('function');
            expect(typeof server.on).toBe('function');
            expect(typeof server.removeListener).toBe('function');
        });
    });

    describe('Server Shutdown', () => {
        test('should stop server gracefully', (done) => {
            testServerInstance = server.listen(0, 'localhost', (error) => {
                expect(error).toBeUndefined();
                
                server.close((stopError) => {
                    expect(stopError).toBeFalsy();
                    done();
                });
            });
        });
    });
});