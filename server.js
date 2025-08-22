const http = require('http');

/**
 * Simple HTTP server for testing purposes
 * Provides minimal endpoints to support comprehensive testing scenarios
 */
class TestServer {
    constructor(port = 0) {
        this.port = port;
        this.server = null;
    }

    /**
     * Creates the HTTP server with basic routes
     */
    createServer() {
        this.server = http.createServer((req, res) => {
            const { method, url } = req;
            
            // Set common headers
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Test-Server', 'true');

            try {
                // Route handling
                if (method === 'GET' && url === '/') {
                    // Basic health check endpoint
                    res.statusCode = 200;
                    res.end(JSON.stringify({ status: 'ok', message: 'Server is running' }));
                    
                } else if (method === 'GET' && url === '/health') {
                    // Health check with timestamp
                    res.statusCode = 200;
                    res.end(JSON.stringify({ 
                        status: 'healthy', 
                        timestamp: new Date().toISOString(),
                        uptime: process.uptime()
                    }));
                    
                } else if (method === 'POST' && url === '/data') {
                    // Handle POST data
                    let body = '';
                    
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            res.statusCode = 200;
                            res.end(JSON.stringify({
                                message: 'Data received successfully',
                                received: data,
                                timestamp: new Date().toISOString()
                            }));
                        } catch (error) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({
                                error: 'Invalid JSON',
                                message: error.message
                            }));
                        }
                    });
                    
                } else if (method === 'GET' && url === '/error') {
                    // Intentional error for testing error handling
                    res.statusCode = 500;
                    res.end(JSON.stringify({
                        error: 'Internal Server Error',
                        message: 'This is a test error endpoint'
                    }));
                    
                } else {
                    // 404 Not Found
                    res.statusCode = 404;
                    res.end(JSON.stringify({
                        error: 'Not Found',
                        message: `Route ${method} ${url} not found`
                    }));
                }
            } catch (error) {
                // Catch any unexpected errors
                res.statusCode = 500;
                res.end(JSON.stringify({
                    error: 'Internal Server Error',
                    message: error.message
                }));
            }
        });

        return this.server;
    }

    /**
     * Starts the server on specified port
     */
    start(callback) {
        if (!this.server) {
            this.createServer();
        }

        // If server is already listening, return existing details
        if (this.server.listening) {
            if (callback) {
                process.nextTick(() => callback(null, this.port));
            }
            return this.server;
        }

        this.server.listen(this.port, (error) => {
            if (error) {
                if (callback) callback(error);
                return;
            }
            
            this.port = this.server.address().port;
            if (callback) callback(null, this.port);
        });

        return this.server;
    }

    /**
     * Stops the server gracefully
     */
    stop(callback) {
        if (this.server && this.server.listening) {
            this.server.close((error) => {
                if (callback) callback(error);
            });
        } else {
            // Server is not running or already stopped - not an error condition
            if (callback) callback();
        }
    }

    /**
     * Gets the current server port
     */
    getPort() {
        return this.port;
    }

    /**
     * Gets the server instance
     */
    getServer() {
        return this.server;
    }
}

// Export for testing
module.exports = TestServer;

// CLI usage (when run directly)
if (require.main === module) {
    const server = new TestServer(3000);
    
    server.start((error, port) => {
        if (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
        
        console.log(`Test server running on port ${port}`);
        console.log(`Available endpoints:`);
        console.log(`  GET  /        - Health check`);
        console.log(`  GET  /health  - Detailed health status`);
        console.log(`  POST /data    - Accept JSON data`);
        console.log(`  GET  /error   - Test error handling`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        server.stop(() => {
            console.log('Server stopped.');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        server.stop(() => {
            console.log('Server stopped.');
            process.exit(0);
        });
    });
}