/**
 * Testinium-QA HTTP Server - Minimal Implementation for Testing
 * 
 * This module implements a minimal HTTP server using Node.js built-in modules
 * to serve as the target for comprehensive unit tests. The server provides
 * basic routes for testing HTTP responses, status codes, headers, and 
 * lifecycle operations including startup and shutdown sequences.
 * 
 * Features:
 * - Basic GET and POST route handling
 * - Proper error handling for 404 and 500 status codes
 * - Configurable port binding with dynamic allocation support
 * - Graceful shutdown with connection draining
 * - Signal handling (SIGTERM, SIGINT)
 * - Request body parsing for POST operations
 * - Response header validation support
 * - Edge case handling for malformed requests
 * 
 * Export: server instance for testing with Supertest
 * Dependencies: Node.js built-in modules only (http, url, querystring, process)
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

/**
 * HTTP Server Implementation
 * 
 * Creates a minimal HTTP server instance with basic routing capabilities,
 * comprehensive error handling, and lifecycle management features required
 * for thorough testing scenarios.
 */

// Track active connections for graceful shutdown
const activeConnections = new Set();
let isShuttingDown = false;
let shutdownTimeout = null;

/**
 * Request handler for HTTP server
 * Implements basic routing logic with proper error handling
 * and support for both GET and POST operations
 * 
 * @param {IncomingMessage} req - HTTP request object
 * @param {ServerResponse} res - HTTP response object
 */
function requestHandler(req, res) {
    // Track connection for graceful shutdown
    activeConnections.add(req.socket);
    
    // Remove connection when request ends
    req.on('close', () => {
        activeConnections.delete(req.socket);
    });
    
    // Handle shutdown state
    if (isShuttingDown) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server shutting down', code: 503 }));
        return;
    }
    
    try {
        // Parse request URL using url.parse() as required by schema
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method;
        
        // Set common headers for all responses
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Server', 'Testinium-QA-Server');
        res.setHeader('X-Timestamp', new Date().toISOString());
        res.setHeader('X-Test-Server', 'true');
        
        // Route handling logic
        if (method === 'GET') {
            handleGetRequest(req, res, pathname, parsedUrl.query);
        } else if (method === 'POST') {
            handlePostRequest(req, res, pathname);
        } else if (method === 'HEAD') {
            // Support HEAD requests for testing headers
            res.writeHead(200);
            res.end();
        } else {
            // Method not allowed
            res.writeHead(405, { 'Allow': 'GET, POST, HEAD' });
            res.end(JSON.stringify({ 
                error: 'Method Not Allowed', 
                code: 405,
                allowed: ['GET', 'POST', 'HEAD']
            }));
        }
    } catch (error) {
        // Internal server error handling
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Internal Server Error', 
            code: 500,
            message: error.message 
        }));
    }
}

/**
 * Handle GET requests with comprehensive route support
 * 
 * @param {IncomingMessage} req - HTTP request object
 * @param {ServerResponse} res - HTTP response object
 * @param {string} pathname - Request pathname
 * @param {Object} query - Parsed query parameters
 */
function handleGetRequest(req, res, pathname, query) {
    switch (pathname) {
        case '/':
            // Root endpoint for basic health check
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: 'ok', 
                code: 200,
                message: 'Testinium-QA HTTP Server Running'
            }));
            break;
            
        case '/health':
            // Health check endpoint
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: 'healthy', 
                code: 200,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }));
            break;
            
        case '/echo':
            // Echo query parameters back
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: 'ok', 
                code: 200,
                query: query || {},
                pathname: pathname
            }));
            break;
            
        case '/headers':
            // Return request headers for testing
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: 'ok', 
                code: 200,
                headers: req.headers
            }));
            break;
            
        case '/error':
            // Trigger 500 error for testing
            throw new Error('Intentional test error');
            
        case '/delay':
            // Delayed response for timeout testing
            const delay = parseInt(query.ms) || 100;
            setTimeout(() => {
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'ok', 
                    code: 200,
                    delayed: delay 
                }));
            }, delay);
            break;
            
        default:
            // 404 Not Found
            res.writeHead(404);
            res.end(JSON.stringify({ 
                error: 'Not Found', 
                code: 404,
                path: decodeURIComponent(pathname)
            }));
    }
}

/**
 * Handle POST requests with body parsing
 * 
 * @param {IncomingMessage} req - HTTP request object
 * @param {ServerResponse} res - HTTP response object
 * @param {string} pathname - Request pathname
 */
function handlePostRequest(req, res, pathname) {
    let body = '';
    let responseSent = false;
    
    // Collect request body data
    req.on('data', chunk => {
        if (responseSent) return;
        
        body += chunk.toString();
        
        // Prevent oversized payloads (2MB limit)
        if (body.length > 2 * 1024 * 1024) {
            responseSent = true;
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Payload Too Large', 
                code: 413,
                limit: '2MB'
            }));
            return;
        }
    });
    
    req.on('end', () => {
        if (responseSent) return;
        
        try {
            processPostRequest(req, res, pathname, body);
        } catch (error) {
            responseSent = true;
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Bad Request', 
                code: 400,
                message: error.message
            }));
        }
    });
    
    req.on('error', (error) => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Request Error', 
            code: 400,
            message: error.message
        }));
    });
}

/**
 * Process POST request body and respond appropriately
 * 
 * @param {IncomingMessage} req - HTTP request object
 * @param {ServerResponse} res - HTTP response object
 * @param {string} pathname - Request pathname
 * @param {string} body - Request body content
 */
function processPostRequest(req, res, pathname, body) {
    const contentType = req.headers['content-type'] || '';
    let parsedData = null;
    
    switch (pathname) {
        case '/data':
            // Handle JSON data submission
            if (contentType.includes('application/json')) {
                parsedData = JSON.parse(body);
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'received', 
                    code: 200,
                    data: parsedData,
                    size: body.length
                }));
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                // Use querystring.parse() as required by schema
                parsedData = querystring.parse(body);
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'received', 
                    code: 200,
                    form: parsedData,
                    size: body.length
                }));
            } else {
                res.writeHead(415);
                res.end(JSON.stringify({ 
                    error: 'Unsupported Media Type', 
                    code: 415,
                    supported: ['application/json', 'application/x-www-form-urlencoded']
                }));
            }
            break;
            
        case '/upload':
            // Handle file upload (simple implementation)
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: 'uploaded', 
                code: 200,
                size: body.length,
                contentType: contentType
            }));
            break;
            
        case '/validate':
            // Validate request body format
            if (!body || body.trim() === '') {
                res.writeHead(400);
                res.end(JSON.stringify({ 
                    error: 'Empty body not allowed', 
                    code: 400
                }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'valid', 
                    code: 200,
                    validation: 'passed'
                }));
            }
            break;
            
        default:
            // 404 Not Found for POST requests
            res.writeHead(404);
            res.end(JSON.stringify({ 
                error: 'Not Found', 
                code: 404,
                path: pathname,
                method: 'POST'
            }));
    }
}

/**
 * Create HTTP server instance using http.createServer() as required by schema
 */
const server = http.createServer(requestHandler);

/**
 * Graceful shutdown handler
 * Implements connection draining and resource cleanup
 * as specified in Section 0.4.2
 */
function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    isShuttingDown = true;
    
    // Stop accepting new connections
    server.close((err) => {
        if (err) {
            console.error('Error during server close:', err);
            process.exit(1);
        }
        
        console.log('HTTP server closed.');
        
        // Force close active connections after timeout
        if (activeConnections.size > 0) {
            console.log(`Closing ${activeConnections.size} active connections...`);
            
            // Give connections 5 seconds to finish
            shutdownTimeout = setTimeout(() => {
                activeConnections.forEach(socket => {
                    socket.destroy();
                });
                process.exit(0);
            }, 5000);
            
            // If all connections close naturally, cancel timeout
            const checkConnections = setInterval(() => {
                if (activeConnections.size === 0) {
                    clearInterval(checkConnections);
                    clearTimeout(shutdownTimeout);
                    console.log('All connections closed gracefully.');
                    process.exit(0);
                }
            }, 100);
        } else {
            process.exit(0);
        }
    });
}

// Signal handling using process.on() as required by schema
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

/**
 * Store original server methods to avoid infinite recursion
 */
const originalServerMethods = {
    listen: server.listen.bind(server),
    close: server.close.bind(server),
    address: server.address.bind(server),
    on: server.on.bind(server),
    removeListener: server.removeListener.bind(server)
};

/**
 * Enhanced server object with additional methods required by export schema
 * Provides listen(), close(), address(), on(), removeListener() methods
 * as specified in the exports schema
 */
const enhancedServer = {
    /**
     * Start the server on specified port
     * @param {number} port - Port to listen on (default: 3000, 0 for dynamic)
     * @param {string} hostname - Hostname to bind to (default: 'localhost')
     * @param {Function} callback - Callback function when server starts
     * @returns {Server} The server instance for chaining
     */
    listen: function(port = 3000, hostname = 'localhost', callback) {
        const actualPort = port === 0 ? 0 : port; // Support dynamic port allocation
        
        try {
            return originalServerMethods.listen(actualPort, hostname, (error) => {
                if (error) {
                    console.error('Server failed to start:', error);
                    if (callback) callback(error);
                    return;
                }
                
                const address = originalServerMethods.address();
                console.log(`Testinium-QA HTTP Server listening on ${hostname}:${address.port}`);
                
                if (callback) callback(null, address);
            });
        } catch (error) {
            console.error('Listen error:', error);
            if (callback) callback(error);
            throw error;
        }
    },

    /**
     * Close the server and cleanup resources
     * @param {Function} callback - Callback function when server closes
     * @returns {Server} The server instance
     */
    close: function(callback) {
        if (isShuttingDown) {
            if (callback) callback(new Error('Already shutting down'));
            return this;
        }
        
        isShuttingDown = true;
        
        return originalServerMethods.close((error) => {
            // Cleanup active connections
            activeConnections.forEach(socket => {
                socket.destroy();
            });
            activeConnections.clear();
            
            // Clear any pending shutdown timeout
            if (shutdownTimeout) {
                clearTimeout(shutdownTimeout);
                shutdownTimeout = null;
            }
            
            if (callback) callback(error);
        });
    },

    /**
     * Get server address information
     * @returns {Object|null} Address object with port and family, or null if not listening
     */
    address: function() {
        return originalServerMethods.address();
    },

    /**
     * Add event listener to server
     * @param {string} event - Event name
     * @param {Function} listener - Event listener function
     * @returns {Server} The server instance for chaining
     */
    on: function(event, listener) {
        return originalServerMethods.on(event, listener);
    },

    /**
     * Remove event listener from server
     * @param {string} event - Event name
     * @param {Function} listener - Event listener function to remove
     * @returns {Server} The server instance for chaining
     */
    removeListener: function(event, listener) {
        return originalServerMethods.removeListener(event, listener);
    }
};

// Delegate all other server methods to the original server
Object.getOwnPropertyNames(Object.getPrototypeOf(server)).forEach(name => {
    if (typeof server[name] === 'function' && !enhancedServer[name]) {
        enhancedServer[name] = function(...args) {
            return server[name](...args);
        };
    }
});

// Delegate properties
Object.getOwnPropertyNames(server).forEach(name => {
    if (!enhancedServer[name]) {
        Object.defineProperty(enhancedServer, name, {
            get() { return server[name]; },
            set(value) { server[name] = value; },
            enumerable: true,
            configurable: true
        });
    }
});

// Error handling for server instance
enhancedServer.on('error', (error) => {
    console.error('Server error:', error);
    
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${error.port} is already in use`);
    } else if (error.code === 'EACCES') {
        console.error(`Permission denied to bind to port ${error.port}`);
    }
});

// Handle client connection events
enhancedServer.on('connection', (socket) => {
    activeConnections.add(socket);
    
    socket.on('close', () => {
        activeConnections.delete(socket);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        activeConnections.delete(socket);
    });
});

// Export raw server for testing with Supertest (compatible with its lifecycle management)
// The raw server allows Supertest to handle listen/close lifecycle automatically
module.exports = server;

// Also export enhanced server for CLI usage if needed
module.exports.enhanced = enhancedServer;