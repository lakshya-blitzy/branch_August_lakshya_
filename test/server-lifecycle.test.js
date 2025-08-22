const TestServer = require('../server');
const http = require('http');

describe('Server Lifecycle Tests', () => {
    let testServer;

    afterEach((done) => {
        if (testServer) {
            testServer.stop(() => {
                testServer = null;
                done();
            });
        } else {
            done();
        }
    });

    describe('Server Startup', () => {
        test('should start server successfully on dynamic port', (done) => {
            testServer = new TestServer(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                expect(port).toBeDefined();
                expect(typeof port).toBe('number');
                expect(port).toBeGreaterThan(0);
                expect(port).toBeLessThanOrEqual(65535);
                done();
            });
        });

        test('should start server on specified port when available', (done) => {
            // Use a high port number that's likely to be available
            const testPort = 8000 + Math.floor(Math.random() * 1000);
            testServer = new TestServer(testPort);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                expect(port).toBe(testPort);
                done();
            });
        });

        test('should return server instance from start method', (done) => {
            testServer = new TestServer(0);
            
            const server = testServer.start((error, port) => {
                expect(error).toBeNull();
                expect(server).toBeInstanceOf(require('http').Server);
                expect(testServer.getServer()).toBe(server);
                done();
            });
        });

        test('should update port property after binding', (done) => {
            testServer = new TestServer(0);
            
            expect(testServer.getPort()).toBe(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                expect(testServer.getPort()).toBe(port);
                expect(testServer.getPort()).toBeGreaterThan(0);
                done();
            });
        });

        test('should handle server creation before start', (done) => {
            testServer = new TestServer(0);
            
            // Create server explicitly
            const server = testServer.createServer();
            expect(server).toBeInstanceOf(require('http').Server);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                expect(port).toBeGreaterThan(0);
                done();
            });
        });
    });

    describe('Server Shutdown', () => {
        test('should stop server gracefully', (done) => {
            testServer = new TestServer(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                
                testServer.stop((stopError) => {
                    expect(stopError).toBeFalsy();
                    done();
                });
            });
        });

        test('should handle stop without server instance', (done) => {
            testServer = new TestServer(0);
            
            // Stop without starting
            testServer.stop((error) => {
                expect(error).toBeFalsy();
                done();
            });
        });

        test('should handle multiple stop calls safely', (done) => {
            testServer = new TestServer(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                
                // First stop
                testServer.stop((stopError1) => {
                    expect(stopError1).toBeFalsy();
                    
                    // Second stop should not cause issues
                    testServer.stop((stopError2) => {
                        expect(stopError2).toBeFalsy();
                        done();
                    });
                });
            });
        });

        test('should release port after shutdown', (done) => {
            testServer = new TestServer(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                const assignedPort = port;
                
                testServer.stop((stopError) => {
                    expect(stopError).toBeFalsy();
                    
                    // Try to start another server on the same port
                    const testServer2 = new TestServer(assignedPort);
                    testServer2.start((error2, port2) => {
                        expect(error2).toBeNull();
                        expect(port2).toBe(assignedPort);
                        
                        testServer2.stop(() => {
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('Server Properties', () => {
        test('should return correct port after start', (done) => {
            testServer = new TestServer(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                expect(testServer.getPort()).toBe(port);
                done();
            });
        });

        test('should return server instance', (done) => {
            testServer = new TestServer(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                
                const server = testServer.getServer();
                expect(server).toBeInstanceOf(require('http').Server);
                expect(server.listening).toBe(true);
                done();
            });
        });

        test('should handle getServer before start', () => {
            testServer = new TestServer(0);
            expect(testServer.getServer()).toBeNull();
        });
    });

    describe('Server Configuration', () => {
        test('should create server with default port 0', () => {
            testServer = new TestServer();
            expect(testServer.getPort()).toBe(0);
        });

        test('should create server with specified port', () => {
            const testPort = 9000;
            testServer = new TestServer(testPort);
            expect(testServer.getPort()).toBe(testPort);
        });

        test('should initialize with null server instance', () => {
            testServer = new TestServer(0);
            expect(testServer.getServer()).toBeNull();
        });
    });

    describe('Server State Management', () => {
        test('should maintain server state correctly during lifecycle', (done) => {
            testServer = new TestServer(0);
            
            // Initial state
            expect(testServer.getServer()).toBeNull();
            expect(testServer.getPort()).toBe(0);
            
            testServer.start((error, port) => {
                expect(error).toBeNull();
                
                // After start
                expect(testServer.getServer()).not.toBeNull();
                expect(testServer.getServer().listening).toBe(true);
                expect(testServer.getPort()).toBe(port);
                expect(testServer.getPort()).toBeGreaterThan(0);
                
                testServer.stop((stopError) => {
                    expect(stopError).toBeFalsy();
                    
                    // After stop
                    expect(testServer.getServer()).not.toBeNull();
                    expect(testServer.getServer().listening).toBe(false);
                    expect(testServer.getPort()).toBe(port); // Port should remain the same
                    
                    done();
                });
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle rapid start/stop cycles', (done) => {
            testServer = new TestServer(0);
            
            let completedCycles = 0;
            const totalCycles = 3;
            
            const cycle = () => {
                testServer.start((error, port) => {
                    expect(error).toBeNull();
                    
                    setTimeout(() => {
                        testServer.stop((stopError) => {
                            expect(stopError).toBeFalsy();
                            
                            completedCycles++;
                            if (completedCycles < totalCycles) {
                                setTimeout(cycle, 10); // Small delay between cycles
                            } else {
                                done();
                            }
                        });
                    }, 10);
                });
            };
            
            cycle();
        });

        test('should handle concurrent start attempts', (done) => {
            testServer = new TestServer(0);
            
            let responses = 0;
            const expectedResponses = 2;
            
            // Start server twice concurrently
            testServer.start((error1, port1) => {
                responses++;
                expect(error1).toBeNull();
                expect(port1).toBeGreaterThan(0);
                
                if (responses === expectedResponses) {
                    done();
                }
            });
            
            // Second start should reuse the same server
            testServer.start((error2, port2) => {
                responses++;
                expect(error2).toBeNull();
                expect(port2).toBeGreaterThan(0);
                
                if (responses === expectedResponses) {
                    done();
                }
            });
        });
    });
});