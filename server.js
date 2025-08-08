/**
 * Testinium-QA Node.js HTTP Server Implementation
 * 
 * Comprehensive Express.js HTTP server component providing RESTful API endpoints,
 * middleware stack for request processing, and error handling. This server operates
 * on configurable ports (3000 for development, 3001 for testing) with comprehensive
 * middleware including body-parser for request parsing, CORS for cross-origin support,
 * morgan for logging, helmet for security headers, and compression for response optimization.
 * 
 * Key Features:
 * - RESTful API endpoints supporting GET, POST, PUT, DELETE, and PATCH methods
 * - Comprehensive middleware stack for security, parsing, and optimization
 * - Graceful shutdown through SIGTERM/SIGINT signal handlers with connection draining
 * - Health check endpoints for monitoring server availability
 * - Environment-based configuration (development/test/production)
 * - Memory usage under 512MB limit and response times under 100ms
 * - Integration with existing Java test framework without conflicts
 * 
 * @module server
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - Core HTTP server framework and Node.js modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const process = require('process');

// Internal imports - API routes and middleware configuration
const apiRouter = require('./src/routes/api.js');
const errorHandler = require('./src/middleware/errorHandler.js');
const corsConfig = require('./src/middleware/cors.js');
const securityConfig = require('./src/middleware/security.js');
const headerValidation = require('./src/middleware/headerValidation.js');
const compressionConfig = require('./src/middleware/compression.js');
const bodyParserConfig = require('./src/middleware/bodyParser.js');
const loggingConfig = require('./src/middleware/logging.js');
const rateLimitConfig = require('./src/middleware/rateLimit.js');

// Internal imports - Configuration and logging utilities
const config = require('./src/utils/config.js');
const logger = require('./src/utils/logger.js');

/**
 * Global server state management
 * Tracks server status for graceful shutdown and health monitoring
 */
let serverInstance = null;
let isShuttingDown = false;
let connectionCount = 0;
let connections = new Set();

/**
 * Track active connections for graceful shutdown
 * @param {Object} socket - Socket connection object
 */
function trackConnection(socket) {
    connectionCount++;
    connections.add(socket);
    
    socket.on('close', () => {
        connectionCount--;
        connections.delete(socket);
        logger.debug('Connection closed', { 
            activeConnections: connectionCount,
            isShuttingDown 
        });
    });
    
    logger.debug('New connection established', { 
        activeConnections: connectionCount 
    });
}

/**
 * Create and configure Express application instance
 * Sets up comprehensive middleware stack and API routes
 * @returns {Object} Configured Express application
 */
function createApp() {
    logger.info('Initializing Express application', {
        environment: config.environment,
        nodeEnv: config.nodeEnv,
        port: config.port
    });
    
    // Create Express application instance
    const app = express();
    
    // Trust proxy headers for proper IP resolution behind load balancers
    app.set('trust proxy', true);
    
    // Disable Express server fingerprinting for security
    app.disable('x-powered-by');
    
    // Set environment-specific configuration
    app.set('env', config.nodeEnv);
    
    try {
        // 1. Security middleware - Applied first for maximum protection
        logger.debug('Configuring security middleware');
        app.use(securityConfig());
        
        // 2. Header validation middleware - Validate request headers for security threats
        logger.debug('Configuring header validation middleware');
        app.use(headerValidation);
        
        // 3. CORS middleware - Enable cross-origin requests with security
        logger.debug('Configuring CORS middleware');
        app.use(corsConfig());
        
        // 4. Compression middleware - Optimize response payloads
        logger.debug('Configuring compression middleware');
        app.use(compressionConfig());
        
        // 5. HTTP request logging middleware - Monitor all requests
        logger.debug('Configuring logging middleware');
        app.use(loggingConfig());
        
        // 6. Rate limiting middleware - Prevent API abuse
        logger.debug('Configuring rate limiting middleware');
        app.use(rateLimitConfig);
        
        // 7. Body parsing middleware - Parse request bodies
        logger.debug('Configuring body parser middleware');
        const bodyParsers = bodyParserConfig(app);
        
        // Apply JSON parser for API endpoints
        app.use('/api', bodyParsers.json);
        
        // Apply URL-encoded parser for form submissions
        app.use('/webhooks/form-*', bodyParsers.urlencoded);
        
        // Apply raw parser for webhook signature verification
        app.use('/webhooks', bodyParsers.raw);
        
        // Global fallback parsers
        app.use(bodyParsers.json);
        app.use(bodyParsers.urlencoded);
        
        // 7. API routes - Main application endpoints
        logger.debug('Configuring API routes');
        app.use('/api', apiRouter);
        
        // 8. Root health endpoint for load balancer health checks
        app.get('/health', (req, res) => {
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: config.environment,
                version: '1.0.0',
                memoryUsage: process.memoryUsage()
            };
            
            logger.debug('Root health check accessed', {
                path: '/health',
                ip: req.ip
            });
            
            res.status(200).json({
                success: true,
                data: healthData,
                message: 'Server is healthy and operational'
            });
        });
        
        // 8. Root endpoint with server information
        app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                data: {
                    service: 'Testinium-QA Node.js Server',
                    version: '1.0.0',
                    environment: config.environment,
                    timestamp: new Date().toISOString(),
                    endpoints: {
                        health: '/health',
                        api: '/api',
                        apiHealth: '/api/health'
                    }
                },
                message: 'Testinium-QA Node.js Server is running'
            });
        });
        
        // 9. 404 handler for undefined routes
        app.use('*', (req, res) => {
            logger.warn('Route not found', {
                method: req.method,
                path: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            res.status(404).json({
                success: false,
                error: {
                    message: 'Route not found',
                    code: 'ROUTE_NOT_FOUND',
                    details: {
                        path: req.originalUrl,
                        method: req.method
                    }
                },
                statusCode: 404,
                type: 'ERROR',
                metadata: {
                    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                    path: req.originalUrl || req.url || 'unknown',
                    method: req.method || 'unknown'
                }
            });
        });
        
        // 10. Error handling middleware - Applied last to catch all errors
        logger.debug('Configuring error handling middleware');
        app.use(errorHandler);
        
        logger.info('Express application configured successfully', {
            middlewareStack: [
                'security',
                'cors',
                'compression', 
                'logging',
                'bodyParser',
                'apiRoutes',
                'errorHandler'
            ],
            environment: config.environment
        });
        
        return app;
        
    } catch (error) {
        logger.error('Failed to configure Express application', {
            error: error.message,
            stack: error.stack,
            environment: config.environment
        }, error);
        
        throw error;
    }
}

/**
 * Create HTTP server instance with connection tracking
 * @param {Object} app - Express application instance
 * @returns {Object} HTTP server instance
 */
function createServer(app) {
    logger.info('Creating HTTP server instance', {
        port: config.port,
        environment: config.environment
    });
    
    try {
        // Create HTTP server with Express app
        const server = http.createServer(app);
        
        // Configure server timeouts for performance and security
        server.timeout = 30000; // 30 seconds request timeout
        server.keepAliveTimeout = 5000; // 5 seconds keep-alive timeout
        server.headersTimeout = 6000; // 6 seconds headers timeout (should be > keepAliveTimeout)
        
        // Track connections for graceful shutdown
        server.on('connection', trackConnection);
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${config.port} is already in use`, {
                    port: config.port,
                    environment: config.environment,
                    errorCode: error.code
                }, error);
            } else {
                logger.error('HTTP server error occurred', {
                    error: error.message,
                    code: error.code,
                    port: config.port
                }, error);
            }
        });
        
        // Log server events
        server.on('listening', () => {
            const address = server.address();
            logger.info('HTTP server is listening', {
                port: address.port,
                host: address.address,
                family: address.family,
                environment: config.environment,
                pid: process.pid
            });
        });
        
        server.on('close', () => {
            logger.info('HTTP server closed', {
                environment: config.environment,
                finalConnectionCount: connectionCount
            });
        });
        
        return server;
        
    } catch (error) {
        logger.error('Failed to create HTTP server', {
            error: error.message,
            stack: error.stack,
            port: config.port
        }, error);
        
        throw error;
    }
}

/**
 * Graceful shutdown handler for SIGTERM and SIGINT signals
 * Implements connection draining and cleanup procedures
 * @param {string} signal - Signal name (SIGTERM or SIGINT)
 */
function gracefulShutdown(signal) {
    if (isShuttingDown) {
        logger.warn('Shutdown already in progress, forcing exit', { signal });
        process.exit(1);
        return;
    }
    
    isShuttingDown = true;
    
    logger.info('Graceful shutdown initiated', {
        signal,
        activeConnections: connectionCount,
        environment: config.environment,
        pid: process.pid
    });
    
    // Stop accepting new connections
    if (serverInstance) {
        serverInstance.close((error) => {
            if (error) {
                logger.error('Error during server close', {
                    error: error.message,
                    signal
                }, error);
            } else {
                logger.info('Server stopped accepting new connections', { signal });
            }
        });
    }
    
    // Set shutdown timeout
    const shutdownTimeout = setTimeout(() => {
        logger.warn('Graceful shutdown timeout, forcing exit', {
            signal,
            remainingConnections: connectionCount
        });
        
        // Force close remaining connections
        connections.forEach(socket => {
            try {
                socket.destroy();
            } catch (error) {
                logger.error('Error destroying connection', { error: error.message });
            }
        });
        
        process.exit(1);
    }, 10000); // 10 second timeout
    
    // Wait for existing connections to close
    const checkConnections = setInterval(() => {
        logger.debug('Waiting for connections to close', {
            activeConnections: connectionCount,
            signal
        });
        
        if (connectionCount === 0) {
            clearInterval(checkConnections);
            clearTimeout(shutdownTimeout);
            
            logger.info('All connections closed, exiting gracefully', {
                signal,
                environment: config.environment
            });
            
            process.exit(0);
        }
    }, 1000); // Check every second
}

/**
 * Initialize and start the HTTP server
 * Sets up signal handlers and starts listening on configured port
 */
function startServer() {
    try {
        logger.info('Starting Testinium-QA Node.js Server', {
            version: '1.0.0',
            environment: config.environment,
            nodeEnv: config.nodeEnv,
            port: config.port,
            pid: process.pid
        });
        
        // Create Express application
        const app = createApp();
        
        // Create HTTP server
        const server = createServer(app);
        
        // Store server instance for graceful shutdown
        serverInstance = server;
        
        // Set up graceful shutdown signal handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception occurred', {
                error: error.message,
                stack: error.stack,
                pid: process.pid
            }, error);
            
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled promise rejection', {
                reason: reason instanceof Error ? reason.message : String(reason),
                stack: reason instanceof Error ? reason.stack : undefined,
                promise: promise.toString()
            }, reason instanceof Error ? reason : undefined);
            
            gracefulShutdown('UNHANDLED_REJECTION');
        });
        
        // Start listening on configured port
        server.listen(config.port, () => {
            const address = server.address();
            logger.info('Testinium-QA Node.js Server started successfully', {
                port: address.port,
                host: address.address || 'localhost',
                environment: config.environment,
                endpoints: {
                    root: `http://localhost:${address.port}/`,
                    health: `http://localhost:${address.port}/health`,
                    apiHealth: `http://localhost:${address.port}/api/health`,
                    api: `http://localhost:${address.port}/api`
                },
                memory: process.memoryUsage(),
                uptime: process.uptime()
            });
        });
        
        // Export configured instances
        module.exports = app;
        module.exports.server = server;
        
    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack,
            environment: config.environment
        }, error);
        
        process.exit(1);
    }
}

// Start the server if this file is executed directly
if (require.main === module) {
    startServer();
} else {
    // Export factory functions if imported as module
    const app = createApp();
    const server = createServer(app);
    
    module.exports = app;
    module.exports.server = server;
    module.exports.startServer = startServer;
    module.exports.gracefulShutdown = gracefulShutdown;
}