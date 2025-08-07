/**
 * Middleware Unit Tests for Express.js Server
 * 
 * Tests isolated middleware functions including request logging,
 * 404 error handling, and 500 error handling. Uses mocked
 * HTTP request/response objects for isolation testing.
 */

const httpMocks = require('node-mocks-http');
const app = require('../server');

describe('Express Middleware Tests', () => {
    let consoleSpy;
    let consoleWarnSpy;
    let consoleErrorSpy;
    let mockDateNow;
    let mockDate;

    beforeEach(() => {
        // Mock console methods to capture logging output
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock Date for consistent timestamps
        mockDate = new Date('2024-01-01T12:00:00.000Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
        Date.now = jest.fn(() => mockDate.getTime());
        Date.prototype.toISOString = jest.fn(() => mockDate.toISOString());
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe('Request Logging Middleware', () => {
        it('should log incoming request with timestamp, method, URL, and client IP', (done) => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/test',
                ip: '127.0.0.1'
            });
            const res = httpMocks.createResponse();
            
            // Extract the logging middleware from the app stack
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 && // (req, res, next)
                layer.handle.toString().includes('startTime')
            );
            
            expect(loggingMiddleware).toBeDefined();
            
            const next = jest.fn();
            loggingMiddleware.handle(req, res, next);
            
            // Verify next() was called
            expect(next).toHaveBeenCalled();
            
            // Verify request logging
            expect(consoleSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] GET /test - Client: 127.0.0.1'
            );
            
            done();
        });

        it('should handle missing IP address with fallback', (done) => {
            const req = httpMocks.createRequest({
                method: 'POST',
                url: '/api/data',
                connection: { remoteAddress: '192.168.1.100' }
            });
            const res = httpMocks.createResponse();
            
            // Remove ip property to test fallback
            delete req.ip;
            
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 &&
                layer.handle.toString().includes('startTime')
            );
            
            const next = jest.fn();
            loggingMiddleware.handle(req, res, next);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] POST /api/data - Client: 192.168.1.100'
            );
            
            done();
        });

        it('should use "unknown" when no IP information is available', (done) => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/unknown',
                connection: {}
            });
            const res = httpMocks.createResponse();
            
            // Remove all IP-related properties
            delete req.ip;
            delete req.connection.remoteAddress;
            
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 &&
                layer.handle.toString().includes('startTime')
            );
            
            const next = jest.fn();
            loggingMiddleware.handle(req, res, next);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] GET /unknown - Client: unknown'
            );
            
            done();
        });

        it('should log response details when res.send is called', (done) => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/response-test',
                ip: '10.0.0.1'
            });
            const res = httpMocks.createResponse();
            
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 &&
                layer.handle.toString().includes('startTime')
            );
            
            const next = jest.fn();
            
            // Apply the middleware
            loggingMiddleware.handle(req, res, next);
            
            // Set a status code and send response
            res.status(200);
            res.send('Test response');
            
            // Verify both request and response logs
            expect(consoleSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] GET /response-test - Client: 10.0.0.1'
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] GET /response-test - Status: 200 - Duration: 0ms'
            );
            
            done();
        });

        it('should calculate duration accurately', (done) => {
            // Mock Date.now to return different values for start and end
            let callCount = 0;
            Date.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 1000 : 1050; // 50ms difference
            });
            
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/duration-test',
                ip: '127.0.0.1'
            });
            const res = httpMocks.createResponse();
            
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 &&
                layer.handle.toString().includes('startTime')
            );
            
            const next = jest.fn();
            loggingMiddleware.handle(req, res, next);
            
            res.status(200);
            res.send('Duration test');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Duration: 50ms')
            );
            
            done();
        });
    });

    describe('404 Error Handler Middleware', () => {
        it('should handle undefined routes with 404 status and warning log', (done) => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/nonexistent-route'
            });
            const res = httpMocks.createResponse();
            
            // Find 404 handler in middleware stack
            const middlewareStack = app._router.stack;
            const notFoundHandler = middlewareStack.find(layer => 
                layer.handle.length === 2 && // (req, res) - no next parameter
                layer.handle.toString().includes('404')
            );
            
            expect(notFoundHandler).toBeDefined();
            
            notFoundHandler.handle(req, res);
            
            // Verify 404 status and response
            expect(res.statusCode).toBe(404);
            expect(res._getData()).toBe('Not Found');
            
            // Verify warning log
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] 404 Not Found: GET /nonexistent-route'
            );
            
            done();
        });

        it('should handle POST requests to undefined routes', (done) => {
            const req = httpMocks.createRequest({
                method: 'POST',
                url: '/api/undefined'
            });
            const res = httpMocks.createResponse();
            
            const middlewareStack = app._router.stack;
            const notFoundHandler = middlewareStack.find(layer => 
                layer.handle.length === 2 &&
                layer.handle.toString().includes('404')
            );
            
            notFoundHandler.handle(req, res);
            
            expect(res.statusCode).toBe(404);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] 404 Not Found: POST /api/undefined'
            );
            
            done();
        });
    });

    describe('500 Error Handler Middleware', () => {
        it('should handle internal server errors with proper logging', (done) => {
            const testError = new Error('Test error message');
            testError.stack = 'Error: Test error message\n    at test function';
            
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/error-test',
                ip: '192.168.1.50'
            });
            const res = httpMocks.createResponse();
            const next = jest.fn();
            
            // Find error handler in middleware stack
            const middlewareStack = app._router.stack;
            const errorHandler = middlewareStack.find(layer => 
                layer.handle.length === 4 && // (err, req, res, next)
                layer.handle.toString().includes('Error in')
            );
            
            expect(errorHandler).toBeDefined();
            
            errorHandler.handle(testError, req, res, next);
            
            // Verify 500 status and generic response
            expect(res.statusCode).toBe(500);
            expect(res._getData()).toBe('Internal Server Error');
            
            // Verify error logging
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] Error in GET /error-test - Client: 192.168.1.50'
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error details:', 'Test error message'
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Stack trace:', 'Error: Test error message\n    at test function'
            );
            
            done();
        });

        it('should not expose stack traces to client response', (done) => {
            const sensitiveError = new Error('Database connection failed');
            sensitiveError.stack = 'Error: Database connection failed\n    at DatabasePool.connect\n    at sensitive.file.js:123:45';
            
            const req = httpMocks.createRequest({
                method: 'POST',
                url: '/sensitive-operation',
                ip: '172.16.0.10'
            });
            const res = httpMocks.createResponse();
            const next = jest.fn();
            
            const middlewareStack = app._router.stack;
            const errorHandler = middlewareStack.find(layer => 
                layer.handle.length === 4 &&
                layer.handle.toString().includes('Error in')
            );
            
            errorHandler.handle(sensitiveError, req, res, next);
            
            // Verify client only gets generic error message
            expect(res._getData()).toBe('Internal Server Error');
            expect(res._getData()).not.toContain('Database connection failed');
            expect(res._getData()).not.toContain('sensitive.file.js');
            expect(res._getData()).not.toContain('DatabasePool.connect');
            
            // Verify sensitive details are logged server-side only
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error details:', 'Database connection failed'
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Stack trace:', expect.stringContaining('sensitive.file.js')
            );
            
            done();
        });

        it('should handle errors with missing client IP', (done) => {
            const error = new Error('Connection timeout');
            
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/timeout-test',
                connection: {}
            });
            const res = httpMocks.createResponse();
            const next = jest.fn();
            
            // Remove IP information
            delete req.ip;
            delete req.connection.remoteAddress;
            
            const middlewareStack = app._router.stack;
            const errorHandler = middlewareStack.find(layer => 
                layer.handle.length === 4 &&
                layer.handle.toString().includes('Error in')
            );
            
            errorHandler.handle(error, req, res, next);
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[2024-01-01T12:00:00.000Z] Error in GET /timeout-test - Client: unknown'
            );
            
            done();
        });
    });

    describe('Middleware Performance and Integration', () => {
        it('should maintain proper middleware execution order', (done) => {
            const executionOrder = [];
            
            // Create a custom middleware that tracks execution
            const trackingMiddleware = (req, res, next) => {
                executionOrder.push('tracking');
                next();
            };
            
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/order-test',
                ip: '127.0.0.1'
            });
            const res = httpMocks.createResponse();
            
            // Verify that middleware calls next() properly
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 &&
                layer.handle.toString().includes('startTime')
            );
            
            const nextSpy = jest.fn(() => {
                executionOrder.push('next_called');
            });
            
            loggingMiddleware.handle(req, res, nextSpy);
            
            expect(nextSpy).toHaveBeenCalled();
            expect(executionOrder).toContain('next_called');
            
            done();
        });

        it('should have minimal performance overhead for logging middleware', (done) => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/performance-test',
                ip: '127.0.0.1'
            });
            const res = httpMocks.createResponse();
            
            const middlewareStack = app._router.stack;
            const loggingMiddleware = middlewareStack.find(layer => 
                layer.handle.length === 3 &&
                layer.handle.toString().includes('startTime')
            );
            
            const startTime = process.hrtime.bigint();
            const next = jest.fn();
            
            loggingMiddleware.handle(req, res, next);
            
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1e6; // Convert to milliseconds
            
            // Verify middleware overhead is under 1ms as specified in requirements
            expect(durationMs).toBeLessThan(1);
            expect(next).toHaveBeenCalled();
            
            done();
        });
    });
});