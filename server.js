/**
 * Express.js Tutorial Server
 * 
 * A simple Node.js server implementation using Express.js framework
 * providing HTTP endpoints for educational purposes.
 * 
 * Endpoints:
 * - GET / : Returns "Hello world"
 * - GET /evening : Returns "Good evening"
 */

const express = require('express');

// Initialize Express application
const app = express();

/**
 * Request Logging Middleware
 * 
 * Logs HTTP request details including method, URL, timestamp,
 * and response information for operational visibility.
 */
app.use((req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Log incoming request
    console.log(`[${timestamp}] ${req.method} ${req.url} - Client: ${clientIP}`);
    
    // Capture response details
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`);
        return originalSend.call(this, data);
    };
    
    next();
});

/**
 * GET / endpoint
 * 
 * Returns "Hello world" response as specified in user requirements.
 * This represents the existing endpoint from the tutorial example.
 */
app.get('/', (req, res) => {
    try {
        res.send('Hello world');
    } catch (error) {
        console.error('Error in GET / endpoint:', error);
        next(error);
    }
});

/**
 * GET /evening endpoint
 * 
 * Returns "Good evening" response as specified in user requirements.
 * This is the new endpoint requested to be added to the tutorial server.
 */
app.get('/evening', (req, res) => {
    try {
        res.send('Good evening');
    } catch (error) {
        console.error('Error in GET /evening endpoint:', error);
        next(error);
    }
});

/**
 * 404 Error Handler
 * 
 * Handles requests to undefined routes with appropriate
 * HTTP 404 status and basic error message.
 */
app.use((req, res) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).send('Not Found');
});

/**
 * Express.js Error Handling Middleware
 * 
 * Centralized error processing for all application errors.
 * Logs error details and generates appropriate HTTP responses.
 */
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Log error details with stack trace
    console.error(`[${timestamp}] Error in ${req.method} ${req.url} - Client: ${clientIP}`);
    console.error('Error details:', err.message);
    console.error('Stack trace:', err.stack);
    
    // Send generic error response to client
    res.status(500).send('Internal Server Error');
});

// Configure server port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Start the Express.js server
 * 
 * Binds the server to the configured port and begins listening
 * for incoming HTTP requests. Logs startup information for
 * operational visibility.
 */
app.listen(PORT, () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Server running on port ${PORT}`);
    console.log(`[${timestamp}] Available endpoints:`);
    console.log(`[${timestamp}]   GET http://localhost:${PORT}/ - Returns "Hello world"`);
    console.log(`[${timestamp}]   GET http://localhost:${PORT}/evening - Returns "Good evening"`);
});

// Export the Express app object for testing or external module usage
module.exports = app;