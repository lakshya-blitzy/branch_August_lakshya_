/**
 * Server Lifecycle Test Suite
 * 
 * Comprehensive test suite for validating server lifecycle operations including
 * startup and shutdown sequences, port binding validation, graceful shutdown
 * procedures, and signal handling (SIGTERM, SIGINT). Ensures proper resource
 * management, connection draining, and clean server termination.
 * 
 * Test Coverage:
 * - Server startup with port binding validation
 * - Dynamic port allocation (port 0) for test isolation
 * - Port conflict handling (EADDRINUSE errors)
 * - Server ready state verification
 * - Graceful shutdown procedures with connection draining
 * - Signal handling for SIGTERM and SIGINT with Sinon mocking
 * - Resource cleanup and memory deallocation
 * - Shutdown timeout implementation to prevent hanging
 * - Multiple shutdown attempt prevention
 * - Test isolation with fresh server instances per test
 * 
 * Dependencies:
 * - server.js: HTTP server instance for lifecycle testing
 * - jest: Testing framework for test structure and assertions
 * - sinon: Advanced mocking for system signals and process events
 */

const server = require('../server.js');
const sinon = require('sinon');

describe('Server Lifecycle Tests', () => {
    let testServer;
    let processStub;
    let processOnStub;
    let processExitStub;
    let originalProcessOn;
    let originalProcessExit;

    /**
     * Setup fresh server instance and process mocks before each test
     * Ensures test isolation and prevents cross-test contamination
     */
    beforeEach(() => {
        // Create fresh server instance for each test
        testServer = require('../server.js');
        
        // Store original process methods for cleanup
        originalProcessOn = process.on;
        originalProcessExit = process.exit;
        
        // Setup process method stubs for signal handling tests
        processOnStub = sinon.stub(process, 'on');
        processExitStub = sinon.stub(process, 'exit');
        
        // Allow original signal handling to work during tests
        processOnStub.callThrough();
    });

    /**
     * Cleanup server instances and restore process methods after each test
     * Ensures no server instances remain running and process state is reset
     */
    afterEach((done) => {
        // Close server if it's listening to prevent port conflicts
        if (testServer && testServer.listening) {
            testServer.close((err) => {
                if (err) {
                    console.error('Error closing test server:', err);
                }
                
                // Restore all Sinon stubs and mocks
                sinon.restore();
                
                // Restore original process methods
                process.on = originalProcessOn;
                process.exit = originalProcessExit;
                
                done();
            });
        } else {
            // Restore all Sinon stubs and mocks
            sinon.restore();
            
            // Restore original process methods
            process.on = originalProcessOn;
            process.exit = originalProcessExit;
            
            done();
        }
    });

    describe('Server Startup Tests', () => {
        it('should successfully bind to specified port when available', (done) => {
            const testPort = 0; // Use port 0 for dynamic allocation
            
            testServer.listen(testPort, 'localhost', (err, address) => {
                expect(err).toBeNull();
                expect(address).toBeDefined();
                expect(address.port).toBeGreaterThan(0);
                expect(address.family).toBeDefined();
                
                // Verify server is actually listening
                const serverAddress = testServer.address();
                expect(serverAddress).toBeTruthy();
                expect(serverAddress.port).toBe(address.port);
                expect(serverAddress.address).toBe('127.0.0.1');
                
                done();
            });
        });

        it('should handle dynamic port allocation with port 0', (done) => {
            testServer.listen(0, 'localhost', (err, address) => {
                expect(err).toBeNull();
                expect(address).toBeDefined();
                expect(address.port).toBeGreaterThan(0);
                expect(address.port).toBeLessThan(65536);
                
                // Verify address method returns consistent data
                const retrievedAddress = testServer.address();
                expect(retrievedAddress.port).toBe(address.port);
                
                done();
            });
        });

        it('should emit ready event when server starts successfully', (done) => {
            let readyEventEmitted = false;
            
            // Use server.on() method as required by schema
            testServer.on('listening', () => {
                readyEventEmitted = true;
                expect(readyEventEmitted).toBe(true);
                
                // Verify server state
                const address = testServer.address();
                expect(address).toBeTruthy();
                expect(address.port).toBeGreaterThan(0);
                
                done();
            });
            
            testServer.listen(0, 'localhost');
        });

        it('should handle port already in use error gracefully', (done) => {
            // Start first server on specific port
            const firstServer = require('../server.js');
            const testPort = Math.floor(Math.random() * (65535 - 3000) + 3000);
            
            firstServer.listen(testPort, 'localhost', (err) => {
                if (err) {
                    done(err);
                    return;
                }
                
                // Try to start second server on same port
                testServer.on('error', (error) => {
                    expect(error).toBeDefined();
                    expect(error.code).toBe('EADDRINUSE');
                    expect(error.port).toBe(testPort);
                    
                    // Cleanup first server
                    firstServer.close(() => {
                        done();
                    });
                });
                
                // This should trigger EADDRINUSE error
                testServer.listen(testPort, 'localhost');
            });
        });

        it('should verify server ready state after successful startup', (done) => {
            testServer.listen(0, 'localhost', (err) => {
                expect(err).toBeNull();
                
                // Verify server is in ready state
                expect(testServer.listening).toBe(true);
                
                const address = testServer.address();
                expect(address).toBeTruthy();
                expect(typeof address.port).toBe('number');
                expect(address.port).toBeGreaterThan(0);
                
                done();
            });
        });
    });

    describe('Server Shutdown Tests', () => {
        beforeEach((done) => {
            // Ensure server is started before shutdown tests
            testServer.listen(0, 'localhost', () => {
                done();
            });
        });

        it('should close gracefully when close() method is called', (done) => {
            expect(testServer.listening).toBe(true);
            
            testServer.close((err) => {
                expect(err).toBeFalsy();
                expect(testServer.listening).toBe(false);
                
                // Verify address returns null after closing
                const address = testServer.address();
                expect(address).toBeNull();
                
                done();
            });
        });

        it('should stop accepting new connections during shutdown', (done) => {
            let connectionAttempted = false;
            
            testServer.close((err) => {
                expect(err).toBeFalsy();
                
                // Attempt to connect after shutdown initiated
                const http = require('http');
                const options = {
                    hostname: 'localhost',
                    port: testServer.address() ? testServer.address().port : 0,
                    path: '/',
                    method: 'GET'
                };
                
                const req = http.request(options, (res) => {
                    // Should not reach here as server is closing
                    connectionAttempted = true;
                });
                
                req.on('error', (error) => {
                    // Expected error during shutdown
                    expect(error.code).toMatch(/ECONNREFUSED|ENOTFOUND/);
                    expect(connectionAttempted).toBe(false);
                    done();
                });
                
                req.end();
            });
        });

        it('should handle multiple shutdown attempts gracefully', (done) => {
            let firstCloseCompleted = false;
            let secondCloseCompleted = false;
            
            // First close attempt
            testServer.close((err) => {
                expect(err).toBeFalsy();
                firstCloseCompleted = true;
                checkBothCompleted();
            });
            
            // Second close attempt should be handled gracefully
            testServer.close((err) => {
                expect(err).toBeTruthy(); // Should error since already closing
                expect(err.message).toContain('Already shutting down');
                secondCloseCompleted = true;
                checkBothCompleted();
            });
            
            function checkBothCompleted() {
                if (firstCloseCompleted && secondCloseCompleted) {
                    expect(testServer.listening).toBe(false);
                    done();
                }
            }
        });

        it('should cleanup resources and memory during shutdown', (done) => {
            const initialMemory = process.memoryUsage();
            
            testServer.close((err) => {
                expect(err).toBeFalsy();
                
                // Allow garbage collection to run
                setTimeout(() => {
                    const finalMemory = process.memoryUsage();
                    
                    // Memory usage should be cleaned up (allowing some variance)
                    expect(finalMemory.heapUsed).toBeLessThanOrEqual(
                        initialMemory.heapUsed * 1.1 // Allow 10% variance
                    );
                    
                    done();
                }, 100);
            });
        });
    });

    describe('Signal Handling Tests', () => {
        let mockGracefulShutdown;
        let signalHandlers = {};
        
        beforeEach((done) => {
            // Start server for signal testing
            testServer.listen(0, 'localhost', () => {
                // Setup signal handler tracking
                processOnStub.restore();
                processOnStub = sinon.stub(process, 'on').callsFake((signal, handler) => {
                    signalHandlers[signal] = handler;
                    return originalProcessOn.call(process, signal, handler);
                });
                
                done();
            });
        });

        it('should handle SIGTERM signal with graceful shutdown', (done) => {
            expect(testServer.listening).toBe(true);
            
            // Mock process.exit to prevent actual exit during tests
            processExitStub.callsFake((code) => {
                expect(code).toBe(0);
                expect(testServer.listening).toBe(false);
                done();
            });
            
            // Trigger SIGTERM handler if it exists
            if (signalHandlers.SIGTERM) {
                signalHandlers.SIGTERM();
            } else {
                // Fallback: emit SIGTERM event directly
                process.emit('SIGTERM');
            }
        });

        it('should handle SIGINT signal with graceful shutdown', (done) => {
            expect(testServer.listening).toBe(true);
            
            // Mock process.exit to prevent actual exit during tests
            processExitStub.callsFake((code) => {
                expect(code).toBe(0);
                expect(testServer.listening).toBe(false);
                done();
            });
            
            // Trigger SIGINT handler if it exists
            if (signalHandlers.SIGINT) {
                signalHandlers.SIGINT();
            } else {
                // Fallback: emit SIGINT event directly
                process.emit('SIGINT');
            }
        });

        it('should implement shutdown timeout to prevent hanging', (done) => {
            jest.setTimeout(10000); // Extend timeout for this test
            
            let shutdownStarted = false;
            const originalServerClose = testServer.close;
            
            // Mock server.close to simulate hanging shutdown
            const closeStub = sinon.stub(testServer, 'close').callsFake((callback) => {
                shutdownStarted = true;
                // Simulate hanging by not calling the callback immediately
                setTimeout(() => {
                    if (callback) callback();
                }, 6000); // Simulate longer than expected shutdown
            });
            
            // Mock process.exit to detect forced shutdown
            processExitStub.callsFake((code) => {
                expect(shutdownStarted).toBe(true);
                expect(code).toBe(0);
                
                // Restore stubs
                closeStub.restore();
                done();
            });
            
            // Trigger SIGTERM to start graceful shutdown
            if (signalHandlers.SIGTERM) {
                signalHandlers.SIGTERM();
            } else {
                process.emit('SIGTERM');
            }
        });

        it('should use Sinon to stub process signals for isolated testing', () => {
            // Verify that Sinon stubs are properly configured
            expect(processOnStub).toBeDefined();
            expect(processExitStub).toBeDefined();
            
            // Test that stubs are working
            expect(sinon.isSinonProxy(process.on)).toBe(true);
            expect(sinon.isSinonProxy(process.exit)).toBe(true);
            
            // Verify stub call tracking
            expect(processOnStub.called).toBe(true);
            
            // Test stub functionality
            const testHandler = sinon.spy();
            process.on('test-signal', testHandler);
            
            expect(processOnStub.calledWith('test-signal', testHandler)).toBe(true);
        });
    });

    describe('Event Listener Management Tests', () => {
        it('should properly add event listeners using on() method', (done) => {
            const testHandler = jest.fn();
            
            // Use server.on() method as required by schema
            testServer.on('connection', testHandler);
            
            // Start server to trigger events
            testServer.listen(0, 'localhost', () => {
                const http = require('http');
                const port = testServer.address().port;
                
                // Create a connection to trigger the event
                const req = http.request({
                    hostname: 'localhost',
                    port: port,
                    path: '/',
                    method: 'GET'
                }, (res) => {
                    // Allow event loop to process connection event
                    setTimeout(() => {
                        expect(testHandler).toHaveBeenCalled();
                        done();
                    }, 100);
                });
                
                req.on('error', (err) => {
                    done(err);
                });
                
                req.end();
            });
        });

        it('should properly remove event listeners using removeListener() method', (done) => {
            const testHandler = jest.fn();
            
            // Add event listener
            testServer.on('connection', testHandler);
            
            // Remove event listener using removeListener() as required by schema
            testServer.removeListener('connection', testHandler);
            
            // Start server and create connection
            testServer.listen(0, 'localhost', () => {
                const http = require('http');
                const port = testServer.address().port;
                
                const req = http.request({
                    hostname: 'localhost',
                    port: port,
                    path: '/',
                    method: 'GET'
                }, (res) => {
                    // Handler should not be called since it was removed
                    setTimeout(() => {
                        expect(testHandler).not.toHaveBeenCalled();
                        done();
                    }, 100);
                });
                
                req.on('error', (err) => {
                    done(err);
                });
                
                req.end();
            });
        });

        it('should handle error events properly', (done) => {
            const errorHandler = jest.fn();
            
            testServer.on('error', errorHandler);
            
            // Trigger an error by trying to listen on an invalid port
            testServer.listen(-1, 'localhost', (err) => {
                // Error should be handled by our error handler
                setTimeout(() => {
                    expect(errorHandler).toHaveBeenCalled();
                    const errorArg = errorHandler.mock.calls[0][0];
                    expect(errorArg).toBeInstanceOf(Error);
                    done();
                }, 100);
            });
        });
    });

    describe('Resource Management and Cleanup Tests', () => {
        it('should track active connections for proper cleanup', (done) => {
            testServer.listen(0, 'localhost', () => {
                const http = require('http');
                const port = testServer.address().port;
                let connectionCount = 0;
                
                testServer.on('connection', () => {
                    connectionCount++;
                });
                
                // Create multiple connections
                const requests = [];
                for (let i = 0; i < 3; i++) {
                    const req = http.request({
                        hostname: 'localhost',
                        port: port,
                        path: '/',
                        method: 'GET'
                    }, (res) => {
                        res.on('data', () => {});
                        res.on('end', () => {
                            if (requests.every(r => r.finished)) {
                                expect(connectionCount).toBe(3);
                                done();
                            }
                        });
                    });
                    
                    req.on('error', (err) => {
                        done(err);
                    });
                    
                    req.end();
                    requests.push(req);
                }
            });
        });

        it('should prevent memory leaks during server lifecycle', (done) => {
            const initialMemory = process.memoryUsage();
            let servers = [];
            
            // Create and destroy multiple server instances
            for (let i = 0; i < 5; i++) {
                const tempServer = require('../server.js');
                servers.push(tempServer);
            }
            
            // Close all servers
            let closedCount = 0;
            servers.forEach(s => {
                s.listen(0, 'localhost', () => {
                    s.close(() => {
                        closedCount++;
                        if (closedCount === servers.length) {
                            // Force garbage collection
                            if (global.gc) {
                                global.gc();
                            }
                            
                            setTimeout(() => {
                                const finalMemory = process.memoryUsage();
                                
                                // Memory should not grow significantly
                                const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
                                expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
                                
                                done();
                            }, 100);
                        }
                    });
                });
            });
        });

        it('should handle connection draining during graceful shutdown', (done) => {
            testServer.listen(0, 'localhost', () => {
                const http = require('http');
                const port = testServer.address().port;
                let activeConnections = [];
                
                testServer.on('connection', (socket) => {
                    activeConnections.push(socket);
                    socket.on('close', () => {
                        const index = activeConnections.indexOf(socket);
                        if (index > -1) {
                            activeConnections.splice(index, 1);
                        }
                    });
                });
                
                // Create a long-lived connection
                const req = http.request({
                    hostname: 'localhost',
                    port: port,
                    path: '/delay?ms=500',
                    method: 'GET'
                }, (res) => {
                    res.on('data', () => {});
                    res.on('end', () => {
                        expect(activeConnections.length).toBe(0);
                        done();
                    });
                });
                
                req.on('error', (err) => {
                    done(err);
                });
                
                req.end();
                
                // Start graceful shutdown while connection is active
                setTimeout(() => {
                    expect(activeConnections.length).toBe(1);
                    testServer.close();
                }, 100);
            });
        });
    });
});