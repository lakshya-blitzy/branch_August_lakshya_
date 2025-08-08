/**
 * Express Error Handling Middleware
 * 
 * Provides centralized error processing for all API endpoints using the Error Boundary Pattern.
 * Ensures consistent error response formatting with appropriate HTTP status codes, comprehensive
 * error logging integration, and graceful error recovery. Handles both synchronous and 
 * asynchronous errors from route handlers, ensuring no unhandled exceptions crash the server.
 * 
 * Key Features:
 * - Centralized error processing with Error Boundary Pattern implementation
 * - Consistent JSON error response formatting across all endpoints
 * - Environment-based error detail exposure (development vs production)
 * - Comprehensive error logging with request correlation tracking
 * - Custom error class support for typed error handling
 * - JSON parsing error handling for malformed request bodies
 * - Timeout error processing with appropriate status codes
 * - Request ID tracking for error correlation in distributed systems
 * - Stack trace exposure in development environment only
 * - Graceful degradation for uncaught exceptions
 * 
 * @module errorHandler
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - HTTP status code constants
const { StatusCodes } = require('http-status-codes');

// External imports - UUID generation for request correlation
const { v4: uuidv4 } = require('uuid');

// External imports - Node.js utility modules
const util = require('util');
const process = require('process');

// External imports - Express async error handling
require('express-async-errors');

// Internal imports - Structured logging utility
const logger = require('../utils/logger.js');

// Internal imports - Environment configuration
const config = require('../utils/config.js');

/**
 * ValidationError class for request validation failures
 * Extends Error to provide typed error handling with additional context
 */
class ValidationError extends Error {
    /**
     * Create a ValidationError instance
     * @param {string} message - Error message describing validation failure
     * @param {Object} details - Additional validation error details
     */
    constructor(message, details = {}) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = StatusCodes.BAD_REQUEST;
        this.details = details;
        
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, ValidationError.prototype);
        
        // Capture stack trace excluding constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ValidationError);
        }
    }
}

/**
 * UnauthorizedError class for authentication failures
 * Provides specific error type for authentication and authorization issues
 */
class UnauthorizedError extends Error {
    /**
     * Create an UnauthorizedError instance
     * @param {string} message - Error message describing authentication failure
     */
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = StatusCodes.UNAUTHORIZED;
        
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
        
        // Capture stack trace excluding constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnauthorizedError);
        }
    }
}

/**
 * NotFoundError class for resource not found scenarios
 * Provides specific error type for missing resource conditions
 */
class NotFoundError extends Error {
    /**
     * Create a NotFoundError instance
     * @param {string} message - Error message describing missing resource
     */
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = StatusCodes.NOT_FOUND;
        
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, NotFoundError.prototype);
        
        // Capture stack trace excluding constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotFoundError);
        }
    }
}

/**
 * Utility function for creating custom errors with specific status codes
 * Provides a factory function for generating standardized error objects
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error context
 * @returns {Error} Custom error instance with specified properties
 */
function createError(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, details = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    error.timestamp = new Date().toISOString();
    
    // Add request correlation ID if available
    if (global.currentRequest && global.currentRequest.traceId) {
        error.traceId = global.currentRequest.traceId;
    }
    
    return error;
}

/**
 * Determine appropriate HTTP status code based on error type and properties
 * Implements comprehensive error classification logic for consistent status codes
 * @param {Error} error - Error object to classify
 * @returns {number} Appropriate HTTP status code
 */
function determineStatusCode(error) {
    // Check for explicit status code on error object
    if (error.statusCode && typeof error.statusCode === 'number') {
        return error.statusCode;
    }
    
    // Classification based on error type and properties
    switch (error.name) {
        case 'ValidationError':
            return StatusCodes.BAD_REQUEST;
            
        case 'UnauthorizedError':
        case 'AuthenticationError':
            return StatusCodes.UNAUTHORIZED;
            
        case 'NotFoundError':
        case 'ResourceNotFoundError':
            return StatusCodes.NOT_FOUND;
            
        case 'SyntaxError':
            // JSON parsing errors
            return StatusCodes.BAD_REQUEST;
            
        case 'TimeoutError':
        case 'RequestTimeoutError':
            return StatusCodes.REQUEST_TIMEOUT;
            
        case 'UnprocessableEntityError':
            return StatusCodes.UNPROCESSABLE_ENTITY;
            
        default:
            // Check error message for common patterns
            const message = error.message ? error.message.toLowerCase() : '';
            
            if (message.includes('validation') || message.includes('invalid')) {
                return StatusCodes.BAD_REQUEST;
            }
            
            if (message.includes('unauthorized') || message.includes('authentication')) {
                return StatusCodes.UNAUTHORIZED;
            }
            
            if (message.includes('not found') || message.includes('missing')) {
                return StatusCodes.NOT_FOUND;
            }
            
            if (message.includes('timeout')) {
                return StatusCodes.REQUEST_TIMEOUT;
            }
            
            // Default to internal server error for unclassified errors
            return StatusCodes.INTERNAL_SERVER_ERROR;
    }
}

/**
 * Generate unique request identifier for error correlation
 * Creates or retrieves request ID for tracking errors across distributed systems
 * @param {Object} req - Express request object
 * @returns {string} Unique request identifier
 */
function generateRequestId(req) {
    // Safety check for malformed request objects
    if (!req) {
        return uuidv4();
    }
    
    // Use existing request ID if available in headers
    if (req.headers && req.headers['x-request-id']) {
        return req.headers['x-request-id'];
    }
    
    // Use existing request ID if already generated
    if (req.requestId) {
        return req.requestId;
    }
    
    // Generate new request ID using UUID v4
    const requestId = uuidv4();
    
    // Store for future reference (only if req is a proper object)
    if (req && typeof req === 'object') {
        req.requestId = requestId;
    }
    
    return requestId;
}

/**
 * Format error response with consistent JSON structure
 * Creates standardized error response format for client consumption
 * @param {Error} error - Error object to format
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response object
 */
function formatErrorResponse(error, req) {
    const statusCode = determineStatusCode(error);
    const requestId = generateRequestId(req);
    const timestamp = new Date().toISOString();
    
    // Base error response structure
    const errorResponse = {
        error: true,
        status: statusCode,
        message: error.message || 'An unexpected error occurred',
        timestamp: timestamp,
        requestId: requestId,
        path: req.originalUrl || req.url || 'unknown',
        method: req.method || 'unknown'
    };
    
    // Include additional details in development environment
    if (config.isDevelopment) {
        errorResponse.details = {
            name: error.name,
            stack: error.stack,
            ...error.details
        };
        
        // Include request details for debugging (with safety checks)
        errorResponse.requestDetails = {
            headers: req.headers || {},
            query: req.query || {},
            body: req.body || {},
            params: req.params || {},
            ip: req.ip || (req.connection && req.connection.remoteAddress) || 'unknown',
            userAgent: (req.get && req.get('User-Agent')) || 'unknown'
        };
        
        // Add process information
        errorResponse.processInfo = {
            pid: process.pid,
            environment: config.nodeEnv,
            timestamp: timestamp
        };
    }
    
    // Include error details for specific error types (even in production)
    if (error instanceof ValidationError && error.details) {
        errorResponse.validationErrors = error.details;
    }
    
    // Include safe error context in production
    if (config.isProduction) {
        // Only include safe error details that don't expose sensitive information
        if (error.code) {
            errorResponse.code = error.code;
        }
        
        if (error.field) {
            errorResponse.field = error.field;
        }
    }
    
    return errorResponse;
}

/**
 * Log error with comprehensive context and correlation information
 * Provides structured error logging for monitoring and debugging
 * @param {Error} error - Error object to log
 * @param {Object} req - Express request object
 * @param {string} requestId - Request correlation identifier
 */
function logError(error, req, requestId) {
    const statusCode = determineStatusCode(error);
    
    // Determine log level based on error severity
    let logLevel = 'error';
    if (statusCode < 500) {
        logLevel = 'warn'; // Client errors (4xx)
    }
    
    // Prepare error context for logging with safety checks
    const errorContext = {
        requestId: requestId,
        statusCode: statusCode,
        errorName: error.name,
        errorMessage: error.message,
        path: (req && (req.originalUrl || req.url)) || 'unknown',
        method: (req && req.method) || 'unknown',
        ip: (req && req.ip) || (req && req.connection && req.connection.remoteAddress) || 'unknown',
        userAgent: (req && req.get && req.get('User-Agent')) || 'unknown',
        timestamp: new Date().toISOString()
    };
    
    // Include additional context in development
    if (config.isDevelopment) {
        errorContext.stack = error.stack;
        errorContext.requestHeaders = (req && req.headers) || {};
        errorContext.requestBody = (req && req.body) || {};
        errorContext.requestQuery = (req && req.query) || {};
        errorContext.requestParams = (req && req.params) || {};
    }
    
    // Include error details if available
    if (error.details) {
        errorContext.errorDetails = error.details;
    }
    
    // Log with appropriate level
    if (logLevel === 'error') {
        logger.error(`Server error occurred: ${error.message}`, errorContext, error);
    } else {
        logger.warn(`Client error occurred: ${error.message}`, errorContext);
    }
    
    // Additional debug logging in development
    if (config.isDevelopment) {
        logger.debug('Full error object inspection', {
            errorInspection: util.inspect(error, { depth: 3, colors: false }),
            requestId: requestId
        });
    }
}

/**
 * Handle JSON parsing errors from malformed request bodies
 * Provides specific handling for JSON syntax errors and parsing failures
 * @param {Error} error - JSON parsing error
 * @param {Object} req - Express request object
 * @returns {Object} Formatted JSON parsing error response
 */
function handleJsonParsingError(error, req) {
    const jsonError = createError(
        'Invalid JSON format in request body',
        StatusCodes.BAD_REQUEST,
        {
            parseError: error.message,
            expectedFormat: 'Valid JSON object',
            receivedContentType: req.get('Content-Type')
        }
    );
    
    return formatErrorResponse(jsonError, req);
}

/**
 * Main error handling middleware function
 * Implements Express error handling middleware signature (err, req, res, next)
 * Provides centralized error processing with the Error Boundary Pattern
 * 
 * @param {Error} err - Error object passed from Express or thrown in route handlers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorHandler(err, req, res, next) {
    // Generate unique request identifier for correlation
    const requestId = generateRequestId(req);
    
    // Set request ID in global context for logger correlation
    if (!global.currentRequest) {
        global.currentRequest = {};
    }
    global.currentRequest.traceId = requestId;
    
    // Handle specific error types with custom processing
    
    // JSON parsing errors from body-parser
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        const errorResponse = handleJsonParsingError(err, req);
        logError(err, req, requestId);
        return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
    }
    
    // Request timeout errors
    if (err.code === 'ETIMEDOUT' || err.timeout) {
        const timeoutError = createError(
            'Request timeout - operation took too long to complete',
            StatusCodes.REQUEST_TIMEOUT,
            {
                timeout: err.timeout || 'unknown',
                operation: err.operation || 'request'
            }
        );
        
        const errorResponse = formatErrorResponse(timeoutError, req);
        logError(timeoutError, req, requestId);
        return res.status(StatusCodes.REQUEST_TIMEOUT).json(errorResponse);
    }
    
    // Handle validation errors with detailed field information
    if (err instanceof ValidationError) {
        const errorResponse = formatErrorResponse(err, req);
        logError(err, req, requestId);
        return res.status(err.statusCode).json(errorResponse);
    }
    
    // Handle authentication/authorization errors
    if (err instanceof UnauthorizedError) {
        const errorResponse = formatErrorResponse(err, req);
        logError(err, req, requestId);
        return res.status(err.statusCode).json(errorResponse);
    }
    
    // Handle not found errors
    if (err instanceof NotFoundError) {
        const errorResponse = formatErrorResponse(err, req);
        logError(err, req, requestId);
        return res.status(err.statusCode).json(errorResponse);
    }
    
    // Handle generic errors with proper classification
    const statusCode = determineStatusCode(err);
    const errorResponse = formatErrorResponse(err, req);
    
    // Log error with full context
    logError(err, req, requestId);
    
    // Ensure response hasn't been sent already
    if (res.headersSent) {
        logger.warn('Cannot send error response - headers already sent', {
            requestId: requestId,
            error: err.message
        });
        return next(err);
    }
    
    // Send formatted error response with error handling
    try {
        res.status(statusCode).json(errorResponse);
        
        // Info logging for successful error handling
        logger.info('Error response sent successfully', {
            requestId: requestId,
            statusCode: statusCode,
            path: req.originalUrl || req.url,
            method: req.method
        });
    } catch (responseError) {
        // Handle errors during response formatting
        logger.error('Failed to send error response', {
            requestId: requestId,
            originalError: err.message,
            responseError: responseError.message
        });
        
        // Try to send a basic error response
        try {
            if (!res.headersSent) {
                res.status(500).json({
                    error: true,
                    status: 500,
                    message: 'Internal server error',
                    requestId: requestId,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (finalError) {
            // Last resort - delegate to Express default error handler
            return next(err);
        }
    } finally {
        // Clean up global request context
        if (global.currentRequest) {
            if (global.currentRequest.traceId === requestId) {
                delete global.currentRequest.traceId;
            }
            // Clean up entire context if empty
            if (Object.keys(global.currentRequest).length === 0) {
                global.currentRequest = undefined;
            }
        }
    }
}

// Export error handler as default export
module.exports = errorHandler;

// Export custom error classes and utility functions as named exports
module.exports.createError = createError;
module.exports.ValidationError = ValidationError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.NotFoundError = NotFoundError;