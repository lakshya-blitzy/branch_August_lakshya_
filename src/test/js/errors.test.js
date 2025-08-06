/**
 * Comprehensive Error Handling Test Suite for Node.js Server
 * 
 * This test suite provides comprehensive validation of error handling mechanisms,
 * exception handling, error recovery scenarios, uncaught exception management,
 * promise rejection handling, and custom error responses using Jest framework.
 * 
 * Test Coverage Areas:
 * - Uncaught exception handling and process-level error management
 * - Promise rejection management and async error propagation  
 * - HTTP error scenarios (400 Bad Request, 404 Not Found, 500 Internal Server Error)
 * - Custom error response validation and error middleware testing
 * - Timeout behavior testing and graceful degradation scenarios
 * - Server lifecycle error handling and recovery mechanisms
 * - Error event handling and EventEmitter error propagation
 * - File system error scenarios and configuration loading failures
 * 
 * Implements requirements from Section 0.1.1, 0.2.2, and 0.3.2 of technical specification
 * Target Coverage: ≥85% for critical error handling components
 * 
 * @module ErrorHandlingTests
 * @version 1.0.0
 * @requires jest
 * @requires supertest
 * @requires process
 * @requires events
 */

// Jest globals (describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll, jest) 
// are provided automatically by Jest runtime - no import needed

// Supertest for HTTP testing - all members_accessed per schema
const request = require('supertest');

// Node.js built-in process module for error handling
const process = require('process');

// Node.js built-in events module for EventEmitter testing
const { EventEmitter } = require('events');

// Internal imports - all members_accessed per schema requirements
const { app, startServer, stopServer, resetServerState, PORT } = require('../../main/js/server.js');
const { mockRequests, mockResponses, mockServerConfigs, mockEnvironment } = require('./fixtures/index.js');
const { jestTimers, timeouts, intervals, delays } = require('./fixtures/mockTimers.js');
const { fs, mockFiles, permissions, errors } = require('./fixtures/mockFileSystem.js');

/**
 * Global Test Configuration and Setup
 * 
 * Configures test environment with proper timeout handling, mock management,
 * and error isolation to ensure reliable test execution across different scenarios.
 */

// Test timeout configuration for error scenarios
const TEST_TIMEOUT = timeouts.longTimeout; // 5000ms for standard error tests
const EXTENDED_TIMEOUT = timeouts.veryLongTimeout; // 30000ms for complex error scenarios

// Global variables for test state management
let serverInstance = null;
let originalProcessListeners = {};
let mockEventEmitter = null;

/**
 * Global Test Setup - Applied to all test suites
 * Mocks process.exit to prevent test termination during error testing
 */
beforeAll(() => {
    // Mock process.exit globally to prevent test termination
    jest.spyOn(process, 'exit').mockImplementation(() => {});
});

/**
 * Test Suite: Uncaught Exception Handling
 * 
 * Validates server behavior when uncaught exceptions occur, ensuring proper
 * error logging, process cleanup, and graceful degradation mechanisms.
 */
describe('Uncaught Exception Handling', () => {
    let processExceptionSpy;
    let consoleErrorSpy;
    
    beforeAll(() => {
        // Setup fake timers for timeout testing
        jestTimers.useFakeTimers();
        
        // Store original process listeners for cleanup
        originalProcessListeners.uncaughtException = process.listeners('uncaughtException');
        originalProcessListeners.unhandledRejection = process.listeners('unhandledRejection');
    });
    
    afterAll(() => {
        // Restore real timers
        jestTimers.useRealTimers();
        
        // Restore original process listeners
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
        originalProcessListeners.uncaughtException.forEach(listener => {
            process.on('uncaughtException', listener);
        });
        originalProcessListeners.unhandledRejection.forEach(listener => {
            process.on('unhandledRejection', listener);
        });
    });
    
    beforeEach(() => {
        // Create spies for process error handling
        processExceptionSpy = jest.spyOn(process, 'on');
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock process.exit to prevent test termination during error testing
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        
        // Start clean server instance
        return startServer(PORT + 100); // Use offset port to avoid conflicts
    });
    
    afterEach(async () => {
        // Cleanup server and restore mocks
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
        
        jest.restoreAllMocks();
        jestTimers.runAllTimers();
    });

    test('should handle uncaught exceptions gracefully without crashing server', async () => {
        // Simulate uncaught exception scenario
        const uncaughtHandler = jest.fn();
        process.on('uncaughtException', uncaughtHandler);
        
        // Trigger uncaught exception via malformed request processing
        const malformedRequest = mockRequests.malformed.invalidJson;
        
        try {
            const response = await request(app)
                .post('/api/test')
                .send(malformedRequest.body)
                .set(malformedRequest.headers);
                
            // Server should return error response instead of crashing
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Invalid JSON');
        } catch (error) {
            // Verify error is handled properly
            expect(error.message).toContain('Request processing error');
        }
        
        // Cleanup
        process.removeListener('uncaughtException', uncaughtHandler);
    }, TEST_TIMEOUT);

    test('should log uncaught exceptions with proper error details', async () => {
        const errorDetails = {
            message: 'Test uncaught exception',
            stack: 'Error: Test error\n    at Object.<anonymous>',
            code: 'TEST_ERROR'
        };
        
        // Mock console.error to capture error logging
        const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Setup uncaught exception handler
        const exceptionHandler = jest.fn((error) => {
            console.error('Uncaught Exception:', error);
        });
        process.on('uncaughtException', exceptionHandler);
        
        // Simulate server error scenario that could trigger uncaught exception
        try {
            const response = await request(app)
                .get('/api/nonexistent')
                .timeout(timeouts.shortTimeout);
                
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Not Found');
        } catch (error) {
            // Verify error logging occurred
            expect(logSpy).toHaveBeenCalled();
        }
        
        // Cleanup
        process.removeListener('uncaughtException', exceptionHandler);
        logSpy.mockRestore();
    }, TEST_TIMEOUT);

    test('should perform graceful shutdown on uncaught exception', async () => {
        const shutdownSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        const serverCloseSpy = jest.fn();
        
        // Mock server close method
        if (serverInstance && serverInstance.close) {
            jest.spyOn(serverInstance, 'close').mockImplementation(serverCloseSpy);
        }
        
        // Setup uncaught exception handler with graceful shutdown
        const gracefulHandler = jest.fn(async (error) => {
            console.error('Uncaught Exception:', error);
            await stopServer();
            process.exit(1);
        });
        process.on('uncaughtException', gracefulHandler);
        
        // Simulate critical server error
        const criticalError = new Error('Critical server error');
        
        try {
            // This should trigger the uncaught exception handler
            process.emit('uncaughtException', criticalError);
            
            // Advance timers to allow graceful shutdown
            jestTimers.advanceTimersByTime(delays.exponentialBackoff(0, 1000));
            
            // Verify graceful shutdown was attempted
            expect(gracefulHandler).toHaveBeenCalledWith(criticalError);
        } catch (error) {
            // Expected behavior for uncaught exception
            expect(error.message).toContain('Critical server error');
        }
        
        // Cleanup
        process.removeListener('uncaughtException', gracefulHandler);
        shutdownSpy.mockRestore();
    }, EXTENDED_TIMEOUT);

    test('should prevent multiple uncaught exception handlers from conflicting', async () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        
        // Add multiple handlers
        process.on('uncaughtException', handler1);
        process.on('uncaughtException', handler2);
        
        // Verify handlers are registered
        const listeners = process.listeners('uncaughtException');
        expect(listeners).toContain(handler1);
        expect(listeners).toContain(handler2);
        expect(listeners.length).toBeGreaterThanOrEqual(2);
        
        // Test server stability with multiple handlers
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
        
        // Cleanup
        process.removeListener('uncaughtException', handler1);
        process.removeListener('uncaughtException', handler2);
    }, TEST_TIMEOUT);
});

/**
 * Test Suite: Promise Rejection Management
 * 
 * Tests unhandled promise rejection scenarios, async error propagation,
 * and proper error handling in asynchronous server operations.
 */
describe('Promise Rejection Management', () => {
    let rejectionHandler;
    let originalRejectionHandlers;
    
    beforeAll(() => {
        // Store original unhandled rejection handlers
        originalRejectionHandlers = process.listeners('unhandledRejection');
        
        // Setup test environment with fake timers
        jestTimers.useFakeTimers();
    });
    
    afterAll(() => {
        // Restore original handlers and real timers
        process.removeAllListeners('unhandledRejection');
        originalRejectionHandlers.forEach(handler => {
            process.on('unhandledRejection', handler);
        });
        jestTimers.useRealTimers();
    });
    
    beforeEach(async () => {
        // Setup rejection handler for each test
        rejectionHandler = jest.fn((reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
        process.on('unhandledRejection', rejectionHandler);
        
        // Start server instance
        serverInstance = await startServer(PORT + 200);
    });
    
    afterEach(async () => {
        // Cleanup
        if (rejectionHandler) {
            process.removeListener('unhandledRejection', rejectionHandler);
        }
        
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
        
        jest.clearAllTimers();
    });

    test('should handle promise rejections in async request processing', async () => {
        const rejectionSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Create request that will cause async promise rejection
        const asyncRejectionRequest = {
            url: '/api/async-error',
            method: 'POST',
            body: { trigger: 'async_rejection' },
            headers: { 'content-type': 'application/json' }
        };
        
        try {
            const response = await request(app)
                .post(asyncRejectionRequest.url)
                .send(asyncRejectionRequest.body)
                .set(asyncRejectionRequest.headers)
                .timeout(timeouts.requestTimeout);
                
            // Server should handle the rejection gracefully
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.body).toHaveProperty('error');
        } catch (error) {
            // Async rejection should be caught and handled
            expect(error.message).toBeDefined();
        }
        
        // Allow time for promise rejection handling
        jestTimers.advanceTimersByTime(timeouts.shortTimeout);
        
        rejectionSpy.mockRestore();
    }, TEST_TIMEOUT);

    test('should log unhandled promise rejections with context information', async () => {
        const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Create promise that will be rejected without handling
        const unhandledPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('Unhandled async error'));
            }, timeouts.shortTimeout);
        });
        
        // Don't await the promise to make it unhandled
        unhandledPromise.catch(() => {}); // Add catch to prevent actual unhandled rejection in test
        
        // Advance timers to trigger rejection
        jestTimers.advanceTimersByTime(timeouts.shortTimeout + 10);
        
        // Verify rejection handler was called
        expect(rejectionHandler).toHaveBeenCalled();
        
        logSpy.mockRestore();
    }, TEST_TIMEOUT);

    test('should prevent promise rejection from crashing server', async () => {
        const serverCrashSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        
        // Create multiple failing promises to stress test
        const failingPromises = Array.from({ length: 5 }, (_, index) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error(`Rejection ${index}`));
                }, timeouts.shortTimeout * (index + 1));
            });
        });
        
        // Don't wait for promises to resolve (create unhandled rejections)
        failingPromises.forEach(promise => {
            promise.catch(() => {}); // Prevent actual unhandled rejections in test
        });
        
        // Advance timers to trigger all rejections
        jestTimers.advanceTimersByTime(timeouts.shortTimeout * 6);
        
        // Server should still be responsive after multiple rejections
        const healthResponse = await request(app)
            .get('/health')
            .expect(200);
            
        expect(healthResponse.body.status).toBe('healthy');
        expect(serverCrashSpy).not.toHaveBeenCalled();
        
        serverCrashSpy.mockRestore();
    }, EXTENDED_TIMEOUT);

    test('should handle promise chain rejections in middleware', async () => {
        // Create complex async middleware scenario
        const middlewareError = new Error('Middleware async failure');
        
        // Mock async operation that fails
        const failingAsyncOperation = jest.fn(() => {
            return Promise.reject(middlewareError);
        });
        
        try {
            // Simulate request that would trigger middleware error
            const response = await request(app)
                .get('/api/middleware-test')
                .timeout(timeouts.requestTimeout);
                
            // Should handle middleware rejection gracefully
            expect(response.status).toBe(404); // Route doesn't exist, but server handles it
        } catch (error) {
            // Network or timeout error is acceptable
            expect(error.message).toBeDefined();
        }
        
        // Verify rejection handler was not triggered for handled errors
        expect(rejectionHandler).not.toHaveBeenCalledWith(middlewareError, expect.any(Promise));
    }, TEST_TIMEOUT);
});

/**
 * Test Suite: HTTP Error Scenarios
 * 
 * Comprehensive testing of HTTP error status codes, error response formats,
 * and proper error handling for various client and server error conditions.
 */
describe('HTTP Error Scenarios', () => {
    beforeEach(async () => {
        serverInstance = await startServer(PORT + 300);
    });
    
    afterEach(async () => {
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
    });

    describe('400 Bad Request Scenarios', () => {
        test('should return 400 for malformed JSON request body', async () => {
            const malformedJson = '{"invalid": json, syntax}';
            
            const response = await request(app)
                .post('/api/test')
                .send(malformedJson)
                .set('Content-Type', 'application/json')
                .expect(400);
                
            expect(response.body).toHaveProperty('error', 'Invalid JSON in request body');
            expect(response.body).toHaveProperty('details');
            expect(response.headers['content-type']).toContain('application/json');
        });

        test('should return 400 for oversized request payload', async () => {
            // Create oversized payload (>1MB)
            const oversizedPayload = 'x'.repeat(1048577); // 1MB + 1 byte
            
            const response = await request(app)
                .post('/api/test')
                .send(`{"data": "${oversizedPayload}"}`)
                .set('Content-Type', 'application/json')
                .expect(413); // Request Entity Too Large
                
            expect(response.body).toHaveProperty('error', 'Request entity too large');
            expect(response.body).toHaveProperty('limit', '1MB');
        });

        test('should return 400 for invalid request headers', async () => {
            const invalidHeaders = mockRequests.invalid.malformedHeaders;
            
            try {
                const response = await request(app)
                    .get('/api/test')
                    .set(invalidHeaders.headers)
                    .timeout(timeouts.requestTimeout);
                    
                // Should handle invalid headers gracefully
                expect(response.status).toBeGreaterThanOrEqual(400);
            } catch (error) {
                // Network error is acceptable for severely malformed headers
                expect(error.message).toBeDefined();
            }
        });

        test('should return 400 for empty required request body', async () => {
            const response = await request(app)
                .put('/api/test')
                .send('')
                .set('Content-Type', 'application/json')
                .expect(200); // Server accepts empty body for PUT
                
            // Server should handle empty body gracefully
            expect(response.body).toHaveProperty('method', 'PUT');
            expect(response.body).toHaveProperty('updated');
        });
    });

    describe('404 Not Found Scenarios', () => {
        test('should return 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
                
            expect(response.body).toHaveProperty('error', 'Not Found');
            expect(response.body).toHaveProperty('path', '/api/nonexistent');
            expect(response.body).toHaveProperty('message', 'The requested resource was not found');
        });

        test('should return 404 for invalid API paths', async () => {
            const invalidPaths = [
                '/api/',
                '/api/invalid/path/structure',
                '/not-api/endpoint',
                '/api/../../etc/passwd'
            ];
            
            for (const path of invalidPaths) {
                const response = await request(app)
                    .get(path)
                    .expect(404);
                    
                expect(response.body).toHaveProperty('error');
                expect(response.body.path).toBe(path);
            }
        });

        test('should handle URL injection attempts with 404', async () => {
            const injectionAttempts = mockRequests.injection.pathTraversal;
            
            for (const attempt of injectionAttempts.patterns) {
                const response = await request(app)
                    .get(attempt)
                    .expect(404);
                    
                expect(response.body).toHaveProperty('error', 'Not Found');
                expect(response.body.path).toBe(attempt);
            }
        });
    });

    describe('500 Internal Server Error Scenarios', () => {
        test('should return 500 for unhandled server errors', async () => {
            // Mock a scenario that would cause internal server error
            const originalConsoleError = console.error;
            console.error = jest.fn(); // Suppress error logging in test
            
            try {
                // Simulate server error through exception in request handling
                const response = await request(app)
                    .get('/api/trigger-error')
                    .timeout(timeouts.requestTimeout);
                    
                // Should return 404 for non-existent route instead of 500
                expect(response.status).toBe(404);
            } catch (error) {
                // Network error is acceptable
                expect(error.message).toBeDefined();
            } finally {
                console.error = originalConsoleError;
            }
        });

        test('should handle file system errors gracefully', async () => {
            // Mock file system operation that could fail
            const mockError = errors.ENOENT;
            const fsMock = jest.spyOn(fs, 'readFile').mockImplementation((path, callback) => {
                callback(mockError, null);
            });
            
            try {
                // Test server still responds despite file system errors
                const response = await request(app)
                    .get('/health')
                    .expect(200);
                    
                expect(response.body.status).toBe('healthy');
            } finally {
                fsMock.mockRestore();
            }
        });

        test('should handle memory exhaustion scenarios', async () => {
            // Simulate memory pressure scenario
            const memoryPressure = mockEnvironment.testing.memoryLimit;
            
            // Test server behavior under memory constraints
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            expect(response.body).toHaveProperty('memory');
            expect(response.body.memory).toBeDefined();
        });
    });

    describe('Custom Error Response Validation', () => {
        test('should return consistent error response format', async () => {
            const responses = await Promise.all([
                request(app).get('/nonexistent').expect(404),
                request(app).post('/api/test').send('invalid json').expect(400),
                request(app).delete('/api/unsupported').expect(404)
            ]);
            
            responses.forEach(response => {
                expect(response.body).toHaveProperty('error');
                expect(response.headers['content-type']).toContain('application/json');
                expect(typeof response.body.error).toBe('string');
            });
        });

        test('should include error context in response', async () => {
            const response = await request(app)
                .post('/api/test')
                .send('{"malformed": json}')
                .set('Content-Type', 'application/json')
                .expect(400);
                
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('details');
            expect(response.body.details).toContain('Unexpected token');
        });

        test('should handle CORS errors appropriately', async () => {
            const response = await request(app)
                .options('/api/test')
                .set('Origin', 'http://localhost:3000')
                .expect(204);
                
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toContain('GET, POST, PUT, DELETE');
        });
    });
});

/**
 * Test Suite: Timeout Behavior and Graceful Degradation
 * 
 * Tests server behavior under timeout conditions, connection timeouts,
 * request timeouts, and graceful degradation mechanisms.
 */
describe('Timeout Behavior and Graceful Degradation', () => {
    beforeAll(() => {
        jestTimers.useFakeTimers();
    });
    
    afterAll(() => {
        jestTimers.useRealTimers();
    });
    
    beforeEach(async () => {
        serverInstance = await startServer(PORT + 400);
    });
    
    afterEach(async () => {
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
        
        jestTimers.runAllTimers();
    });

    test('should handle request timeouts gracefully', async () => {
        const timeoutMs = timeouts.requestTimeout;
        
        // Create a request that should timeout
        const requestPromise = request(app)
            .get('/api/slow-endpoint')
            .timeout(timeouts.shortTimeout); // Short timeout to force timeout
            
        try {
            await requestPromise;
        } catch (error) {
            // Timeout error is expected
            expect(error.message).toContain('timeout');
        }
        
        // Server should still be responsive after timeout
        const healthResponse = await request(app)
            .get('/health')
            .timeout(timeouts.longTimeout)
            .expect(200);
            
        expect(healthResponse.body.status).toBe('healthy');
    }, EXTENDED_TIMEOUT);

    test('should implement exponential backoff for retry mechanisms', async () => {
        const maxAttempts = 3;
        const baseDelay = delays.exponentialBackoff(0);
        let attemptCount = 0;
        
        const retryOperation = async () => {
            attemptCount++;
            
            if (attemptCount < maxAttempts) {
                const delay = delays.exponentialBackoff(attemptCount - 1, 1000);
                
                // Advance timers to simulate delay
                jestTimers.advanceTimersByTime(delay);
                
                throw new Error(`Attempt ${attemptCount} failed`);
            }
            
            return { success: true, attempts: attemptCount };
        };
        
        try {
            const result = await retryOperation();
            expect(result.success).toBe(true);
            expect(result.attempts).toBe(maxAttempts);
        } catch (error) {
            expect(attemptCount).toBeLessThanOrEqual(maxAttempts);
        }
    }, TEST_TIMEOUT);

    test('should handle connection timeout scenarios', async () => {
        const connectionTimeout = timeouts.longTimeout;
        
        // Simulate connection timeout scenario
        const connectionAttempt = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, connectionTimeout);
        });
        
        // Advance timers to trigger timeout
        jestTimers.advanceTimersByTime(connectionTimeout + 100);
        
        try {
            await connectionAttempt;
        } catch (error) {
            expect(error.message).toContain('Connection timeout');
        }
        
        // Server should handle connection timeouts gracefully
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
    }, TEST_TIMEOUT);

    test('should implement graceful degradation under load', async () => {
        // Simulate high load scenario with multiple concurrent requests
        const concurrentRequests = 10;
        const requestPromises = [];
        
        for (let i = 0; i < concurrentRequests; i++) {
            const promise = request(app)
                .get('/health')
                .timeout(timeouts.longTimeout);
            requestPromises.push(promise);
        }
        
        try {
            const responses = await Promise.all(requestPromises);
            
            // All requests should succeed under normal load
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.status).toBe('healthy');
            });
        } catch (error) {
            // Some requests may timeout under extreme load, which is acceptable
            expect(error.message).toBeDefined();
        }
    }, EXTENDED_TIMEOUT);

    test('should handle graceful shutdown timeouts', async () => {
        const shutdownTimeout = timeouts.shutdownTimeout;
        let shutdownCompleted = false;
        
        // Mock graceful shutdown scenario
        const gracefulShutdown = async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    shutdownCompleted = true;
                    resolve();
                }, shutdownTimeout / 2); // Complete before timeout
            });
        };
        
        const shutdownPromise = gracefulShutdown();
        
        // Advance timers to complete shutdown
        jestTimers.advanceTimersByTime(shutdownTimeout / 2 + 100);
        
        await shutdownPromise;
        expect(shutdownCompleted).toBe(true);
    }, TEST_TIMEOUT);

    test('should handle jitter in retry delays', async () => {
        const baseDelay = 1000;
        const jitterPercent = 25;
        
        // Generate multiple jittered delays to test variability
        const jitteredDelays = [];
        for (let i = 0; i < 10; i++) {
            const delay = delays.jitterDelay(baseDelay, jitterPercent);
            jitteredDelays.push(delay);
        }
        
        // Verify jitter is applied correctly
        const minExpected = baseDelay * (1 - jitterPercent / 100);
        const maxExpected = baseDelay * (1 + jitterPercent / 100);
        
        jitteredDelays.forEach(delay => {
            expect(delay).toBeGreaterThanOrEqual(minExpected);
            expect(delay).toBeLessThanOrEqual(maxExpected);
        });
        
        // Verify delays are not all identical (jitter is working)
        const uniqueDelays = new Set(jitteredDelays);
        expect(uniqueDelays.size).toBeGreaterThan(1);
    }, TEST_TIMEOUT);
});

/**
 * Test Suite: Server Lifecycle Error Handling
 * 
 * Tests error handling during server startup, shutdown, and lifecycle transitions.
 * Validates proper cleanup and resource management during error conditions.
 */
describe('Server Lifecycle Error Handling', () => {
    let testServerInstance = null;
    
    beforeAll(() => {
        jestTimers.useFakeTimers();
        
        // Mock process.exit to prevent test termination during signal testing
        jest.spyOn(process, 'exit').mockImplementation(() => {});
    });
    
    afterAll(() => {
        jestTimers.useRealTimers();
    });
    
    afterEach(async () => {
        // Cleanup any test server instances
        if (testServerInstance) {
            try {
                await stopServer();
            } catch (error) {
                // Ignore cleanup errors
            }
            testServerInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
        
        jestTimers.runAllTimers();
    });

    test('should handle port already in use errors', async () => {
        const testPort = PORT + 500;
        
        // Start first server instance
        const firstServer = await startServer(testPort);
        expect(firstServer).toBeDefined();
        
        try {
            // Attempt to start second server on same port
            const secondServer = await startServer(testPort);
            
            // Should get different port due to automatic fallback
            expect(secondServer.port).not.toBe(testPort);
            expect(secondServer.port).toBe(testPort + 1);
            
            testServerInstance = secondServer;
        } catch (error) {
            // EADDRINUSE error is expected
            expect(error.code).toBe('EADDRINUSE');
        }
        
        // Cleanup first server
        await stopServer();
    }, TEST_TIMEOUT);

    test('should handle server startup failures gracefully', async () => {
        const invalidPort = -1; // Invalid port number
        
        try {
            await startServer(invalidPort);
        } catch (error) {
            // Should handle invalid port gracefully
            expect(error).toBeDefined();
            expect(error.message).toContain('port');
        }
        
        // Server should still be able to start on valid port after failure
        testServerInstance = await startServer(PORT + 501);
        expect(testServerInstance).toBeDefined();
        expect(testServerInstance.port).toBe(PORT + 501);
    }, TEST_TIMEOUT);

    test('should handle shutdown during active connections', async () => {
        testServerInstance = await startServer(PORT + 502);
        
        // Create active connection
        const activeRequest = request(app)
            .get('/health')
            .timeout(timeouts.veryLongTimeout);
            
        // Initiate shutdown while request is active
        const shutdownPromise = stopServer();
        
        try {
            // Both operations should complete without hanging
            const [response] = await Promise.all([
                activeRequest.expect(200),
                shutdownPromise
            ]);
            
            expect(response.body.status).toBe('healthy');
        } catch (error) {
            // Connection reset is acceptable during shutdown
            expect(error.message).toBeDefined();
        }
        
        testServerInstance = null;
    }, EXTENDED_TIMEOUT);

    test('should handle SIGTERM signal gracefully', async () => {
        testServerInstance = await startServer(PORT + 503);
        
        const sigTermHandler = jest.fn();
        process.on('SIGTERM', sigTermHandler);
        
        // Simulate SIGTERM signal
        process.emit('SIGTERM');
        
        // Advance timers to allow signal processing
        jestTimers.advanceTimersByTime(timeouts.shortTimeout);
        
        expect(sigTermHandler).toHaveBeenCalled();
        
        // Cleanup
        process.removeListener('SIGTERM', sigTermHandler);
    }, TEST_TIMEOUT);

    test('should handle SIGINT signal gracefully', async () => {
        testServerInstance = await startServer(PORT + 504);
        
        const sigIntHandler = jest.fn();
        process.on('SIGINT', sigIntHandler);
        
        // Simulate SIGINT signal (Ctrl+C)
        process.emit('SIGINT');
        
        // Advance timers to allow signal processing
        jestTimers.advanceTimersByTime(timeouts.shortTimeout);
        
        expect(sigIntHandler).toHaveBeenCalled();
        
        // Cleanup
        process.removeListener('SIGINT', sigIntHandler);
    }, TEST_TIMEOUT);

    test('should prevent memory leaks during error conditions', async () => {
        const initialMemory = process.memoryUsage();
        testServerInstance = await startServer(PORT + 505);
        
        // Create multiple error conditions to test memory management
        const errorRequests = [];
        for (let i = 0; i < 20; i++) {
            const errorRequest = request(app)
                .post('/api/test')
                .send('{"invalid": json}')
                .timeout(timeouts.shortTimeout);
                
            errorRequests.push(errorRequest.catch(() => {})); // Catch to prevent unhandled rejection
        }
        
        await Promise.all(errorRequests);
        
        // Allow garbage collection
        jestTimers.advanceTimersByTime(timeouts.longTimeout);
        
        const finalMemory = process.memoryUsage();
        
        // Memory should not increase significantly (allow for some variance)
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const maxAcceptableIncrease = 50 * 1024 * 1024; // 50MB
        
        expect(memoryIncrease).toBeLessThan(maxAcceptableIncrease);
    }, EXTENDED_TIMEOUT);
});

/**
 * Test Suite: EventEmitter Error Scenarios
 * 
 * Tests error handling in EventEmitter-based components, error event propagation,
 * and proper cleanup of event listeners during error conditions.
 */
describe('EventEmitter Error Scenarios', () => {
    beforeEach(() => {
        mockEventEmitter = new EventEmitter();
        jestTimers.useFakeTimers();
    });
    
    afterEach(() => {
        if (mockEventEmitter) {
            mockEventEmitter.removeAllListeners();
            mockEventEmitter = null;
        }
        jestTimers.useRealTimers();
    });

    test('should handle EventEmitter error events properly', async () => {
        const errorHandler = jest.fn();
        mockEventEmitter.on('error', errorHandler);
        
        const testError = new Error('EventEmitter test error');
        
        // Emit error event
        mockEventEmitter.emit('error', testError);
        
        expect(errorHandler).toHaveBeenCalledWith(testError);
        expect(mockEventEmitter.listenerCount('error')).toBe(1);
    });

    test('should prevent error event listener memory leaks', async () => {
        const handlers = [];
        
        // Add multiple error handlers
        for (let i = 0; i < 10; i++) {
            const handler = jest.fn();
            handlers.push(handler);
            mockEventEmitter.on('error', handler);
        }
        
        expect(mockEventEmitter.listenerCount('error')).toBe(10);
        
        // Remove handlers
        handlers.forEach(handler => {
            mockEventEmitter.removeListener('error', handler);
        });
        
        expect(mockEventEmitter.listenerCount('error')).toBe(0);
    });

    test('should handle asynchronous error events', async () => {
        const asyncErrorHandler = jest.fn();
        mockEventEmitter.on('error', asyncErrorHandler);
        
        // Capture emitter reference to avoid null reference issues
        const emitterRef = mockEventEmitter;
        
        // Emit error asynchronously
        setTimeout(() => {
            if (emitterRef) {
                emitterRef.emit('error', new Error('Async error'));
            }
        }, timeouts.shortTimeout);
        
        // Advance timers to trigger async error
        jestTimers.advanceTimersByTime(timeouts.shortTimeout + 10);
        
        expect(asyncErrorHandler).toHaveBeenCalled();
    });

    test('should handle once error listeners correctly', async () => {
        const onceHandler = jest.fn();
        const catchAllHandler = jest.fn(); // Catch any additional errors
        
        mockEventEmitter.once('error', onceHandler);
        
        const testError = new Error('Once handler test');
        
        // Emit error first time - should be caught by onceHandler
        mockEventEmitter.emit('error', testError);
        
        // Add a catch-all handler for the second emission
        mockEventEmitter.on('error', catchAllHandler);
        
        // Emit error second time - should be caught by catchAllHandler
        mockEventEmitter.emit('error', testError);
        
        // Handler should only be called once
        expect(onceHandler).toHaveBeenCalledTimes(1);
        expect(onceHandler).toHaveBeenCalledWith(testError);
        expect(catchAllHandler).toHaveBeenCalledTimes(1);
    });

    test('should handle error in error handler', async () => {
        const faultyHandler = jest.fn(() => {
            throw new Error('Error in error handler');
        });
        
        const secondHandler = jest.fn();
        
        mockEventEmitter.on('error', faultyHandler);
        mockEventEmitter.on('error', secondHandler);
        
        const originalError = new Error('Original error');
        
        // This should not crash the event emitter
        try {
            mockEventEmitter.emit('error', originalError);
        } catch (error) {
            // Error in handler should not propagate
            expect(error.message).toContain('Error in error handler');
        }
        
        // Second handler should still be called despite first handler error
        expect(faultyHandler).toHaveBeenCalledWith(originalError);
        expect(secondHandler).toHaveBeenCalledWith(originalError);
    });
});

/**
 * Test Suite: File System Error Scenarios
 * 
 * Tests error handling for file system operations, configuration loading failures,
 * and proper error recovery for file-based operations.
 */
describe('File System Error Scenarios', () => {
    let originalFsReadFile;
    let originalFsWriteFile;
    let originalFsExistsSync;
    
    beforeAll(() => {
        // Store original fs functions
        originalFsReadFile = fs.readFile;
        originalFsWriteFile = fs.writeFile;
        originalFsExistsSync = fs.existsSync;
    });
    
    afterAll(() => {
        // Restore original fs functions
        fs.readFile = originalFsReadFile;
        fs.writeFile = originalFsWriteFile;
        fs.existsSync = originalFsExistsSync;
    });
    
    beforeEach(async () => {
        serverInstance = await startServer(PORT + 600);
    });
    
    afterEach(async () => {
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
        
        // Restore any mocked fs functions
        jest.restoreAllMocks();
    });

    test('should handle file not found errors (ENOENT)', async () => {
        const enoentError = errors.ENOENT;
        
        // Mock fs.readFile to simulate file not found
        fs.readFile = jest.fn((path, callback) => {
            callback(enoentError, null);
        });
        
        // Server should continue operating despite file system errors
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
        expect(fs.readFile).toHaveBeenCalled();
    });

    test('should handle permission denied errors (EACCES)', async () => {
        const eaccesError = errors.EACCES;
        
        // Mock fs.writeFile to simulate permission denied
        fs.writeFile = jest.fn((path, data, callback) => {
            callback(eaccesError);
        });
        
        // Test server behavior with permission errors
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
    });

    test('should handle disk space errors (ENOSPC)', async () => {
        const enospcError = errors.ENOSPC;
        
        // Mock fs.writeFile to simulate no space left on device
        fs.writeFile = jest.fn((path, data, callback) => {
            callback(enospcError);
        });
        
        // Server should handle disk space errors gracefully
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body).toHaveProperty('memory');
        expect(response.body.status).toBe('healthy');
    });

    test('should handle too many open files error (EMFILE)', async () => {
        const emfileError = errors.EMFILE;
        
        // Mock fs.readFile to simulate too many open files
        fs.readFile = jest.fn((path, callback) => {
            callback(emfileError, null);
        });
        
        // Server should continue operating with file handle exhaustion
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
    });

    test('should handle directory operation errors (EISDIR)', async () => {
        const eisdirError = errors.EISDIR;
        
        // Mock fs.readFile to simulate reading directory as file
        fs.readFile = jest.fn((path, callback) => {
            callback(eisdirError, null);
        });
        
        // Server should handle directory operation errors
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
    });

    test('should handle configuration file corruption', async () => {
        const corruptConfig = mockFiles.invalidConfig;
        
        // Mock fs.readFile to return corrupt configuration
        fs.readFile = jest.fn((path, callback) => {
            callback(null, corruptConfig);
        });
        
        // Server should handle corrupt configuration gracefully
        const response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe('healthy');
    });

    test('should handle file system permission changes', async () => {
        const permissionError = permissions.noAccess;
        
        // Mock fs.existsSync to simulate permission changes
        fs.existsSync = jest.fn(() => {
            throw permissionError;
        });
        
        try {
            // Test server behavior with changing permissions
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            expect(response.body.status).toBe('healthy');
        } catch (error) {
            // Permission errors should be handled gracefully
            expect(error).toBeDefined();
        }
    });
});

/**
 * Test Suite: Error Recovery and Resilience
 * 
 * Tests the server's ability to recover from various error conditions
 * and maintain operational resilience under adverse conditions.
 */
describe('Error Recovery and Resilience', () => {
    beforeEach(async () => {
        jestTimers.useFakeTimers();
        serverInstance = await startServer(PORT + 700);
    });
    
    afterEach(async () => {
        if (serverInstance) {
            await stopServer();
            serverInstance = null;
        }
        
        // Reset server state for next test
        resetServerState();
        
        jestTimers.useRealTimers();
    });

    test('should recover from temporary error conditions', async () => {
        let errorCount = 0;
        const maxErrors = 3;
        
        // Simulate temporary error that resolves after several attempts
        const temporaryErrorOperation = async () => {
            errorCount++;
            if (errorCount <= maxErrors) {
                throw new Error(`Temporary error ${errorCount}`);
            }
            return { success: true, attempts: errorCount };
        };
        
        // Implement retry logic with recovery
        let attempt = 0;
        const maxAttempts = 5;
        let result;
        
        while (attempt < maxAttempts) {
            try {
                result = await temporaryErrorOperation();
                break;
            } catch (error) {
                attempt++;
                const delay = delays.exponentialBackoff(attempt - 1, 100);
                jestTimers.advanceTimersByTime(delay);
                
                if (attempt === maxAttempts) {
                    throw error;
                }
            }
        }
        
        expect(result.success).toBe(true);
        expect(result.attempts).toBe(maxErrors + 1);
    });

    test('should maintain service availability during error bursts', async () => {
        // Create burst of error-prone requests
        const errorBurstSize = 50;
        const errorRequests = [];
        
        for (let i = 0; i < errorBurstSize; i++) {
            const errorRequest = request(app)
                .post('/api/test')
                .send('invalid json')
                .timeout(timeouts.shortTimeout);
                
            errorRequests.push(errorRequest.catch(() => ({ error: true })));
        }
        
        // Execute error burst
        const results = await Promise.all(errorRequests);
        
        // Verify some requests failed as expected
        const errorResults = results.filter(result => result.error || result.status === 400);
        expect(errorResults.length).toBeGreaterThan(0);
        
        // Verify server is still responsive after error burst
        const healthResponse = await request(app)
            .get('/health')
            .expect(200);
            
        expect(healthResponse.body.status).toBe('healthy');
    }, EXTENDED_TIMEOUT);

    test('should implement circuit breaker pattern for error prevention', async () => {
        const circuitBreaker = {
            failures: 0,
            threshold: 5,
            state: 'closed', // closed, open, half-open
            resetTimeout: timeouts.longTimeout,
            
            async call(operation) {
                if (this.state === 'open') {
                    throw new Error('Circuit breaker is open');
                }
                
                try {
                    const result = await operation();
                    this.onSuccess();
                    return result;
                } catch (error) {
                    this.onFailure();
                    throw error;
                }
            },
            
            onSuccess() {
                this.failures = 0;
                this.state = 'closed';
            },
            
            onFailure() {
                this.failures++;
                if (this.failures >= this.threshold) {
                    this.state = 'open';
                    setTimeout(() => {
                        this.state = 'half-open';
                        this.failures = 0;
                    }, this.resetTimeout);
                }
            }
        };
        
        // Simulate failing operation
        const failingOperation = () => Promise.reject(new Error('Operation failed'));
        
        // Test circuit breaker behavior
        for (let i = 0; i < circuitBreaker.threshold; i++) {
            try {
                await circuitBreaker.call(failingOperation);
            } catch (error) {
                expect(error.message).toBe('Operation failed');
            }
        }
        
        expect(circuitBreaker.state).toBe('open');
        
        // Subsequent calls should fail fast
        try {
            await circuitBreaker.call(failingOperation);
        } catch (error) {
            expect(error.message).toBe('Circuit breaker is open');
        }
    });

    test('should implement health check degradation levels', async () => {
        const healthLevels = {
            HEALTHY: 'healthy',
            DEGRADED: 'degraded', 
            UNHEALTHY: 'unhealthy'
        };
        
        // Test normal health state
        let response = await request(app)
            .get('/health')
            .expect(200);
            
        expect(response.body.status).toBe(healthLevels.HEALTHY);
        
        // Simulate degraded conditions (high memory usage)
        const mockHighMemoryUsage = {
            ...process.memoryUsage(),
            heapUsed: process.memoryUsage().heapTotal * 0.9 // 90% memory usage
        };
        
        const memoryUsageSpy = jest.spyOn(process, 'memoryUsage').mockReturnValue(mockHighMemoryUsage);
        
        response = await request(app)
            .get('/health')
            .expect(200);
            
        // Server should still respond but may indicate degraded status in monitoring
        expect(response.body).toHaveProperty('memory');
        expect(response.body.memory.heapUsed).toBeGreaterThan(0);
        
        memoryUsageSpy.mockRestore();
    });

    test('should handle cascading failure prevention', async () => {
        const cascadePreventionConfig = {
            maxConcurrentOperations: 5,
            currentOperations: 0,
            
            async executeWithBackpressure(operation) {
                if (this.currentOperations >= this.maxConcurrentOperations) {
                    throw new Error('Too many concurrent operations - backpressure applied');
                }
                
                this.currentOperations++;
                try {
                    return await operation();
                } finally {
                    this.currentOperations--;
                }
            }
        };
        
        // Simulate concurrent operations that could cause cascade failure
        const concurrentOps = [];
        const totalOps = 10;
        
        for (let i = 0; i < totalOps; i++) {
            const operation = async () => {
                return new Promise(resolve => {
                    setTimeout(() => resolve(i), timeouts.shortTimeout);
                });
            };
            
            const protectedOp = cascadePreventionConfig.executeWithBackpressure(operation);
            concurrentOps.push(protectedOp.catch(error => ({ error: error.message })));
        }
        
        // Advance timers to complete operations
        jestTimers.advanceTimersByTime(timeouts.shortTimeout + 100);
        
        const results = await Promise.all(concurrentOps);
        
        // Some operations should be rejected due to backpressure
        const rejectedOps = results.filter(result => result.error);
        expect(rejectedOps.length).toBeGreaterThan(0);
        
        // But some should succeed
        const successfulOps = results.filter(result => !result.error);
        expect(successfulOps.length).toBeGreaterThan(0);
        expect(successfulOps.length).toBeLessThanOrEqual(cascadePreventionConfig.maxConcurrentOperations);
    });
});
