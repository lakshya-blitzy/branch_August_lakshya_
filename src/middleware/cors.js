/**
 * CORS (Cross-Origin Resource Sharing) Configuration Middleware
 * 
 * Provides comprehensive CORS middleware configuration for the Testinium-QA Node.js server
 * with environment-specific origin validation, security policy enforcement, and extensive
 * logging for cross-domain request monitoring and troubleshooting.
 * 
 * Key Features:
 * - Environment-aware origin validation (development allows all, production restricts)
 * - Comprehensive HTTP method and header configuration
 * - Preflight request handling with OPTIONS method support  
 * - Dynamic origin validation for multi-tenant scenarios
 * - Structured logging for CORS policy enforcement and debugging
 * - Error handling for unauthorized origins with detailed context
 * - Credentials support for cookie-based session management
 * - Integration with cors npm package for robust CORS implementation
 * 
 * Security Features:
 * - Origin allowlist enforcement in production environments
 * - Request validation with comprehensive error logging
 * - CORS policy violation detection and alerting
 * - Secure default configurations with environment-specific overrides
 * 
 * @module cors
 * @version 1.0.0
 * @author Blitzy Agent
 */

// Internal imports - Configuration and logging utilities
const config = require('../utils/config.js');
const logger = require('../utils/logger.js');

// External imports - CORS middleware and Node.js utilities
const cors = require('cors');
const util = require('util');
const process = require('process');

/**
 * CORS default configuration constants
 * Defines standard CORS settings with security-focused defaults
 * @constant {Object} CORS_DEFAULTS
 */
const CORS_DEFAULTS = {
    /**
     * Allowed HTTP methods for CORS requests
     * Includes all RESTful methods plus OPTIONS for preflight
     * @constant {Array<string>} ALLOWED_METHODS
     */
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    
    /**
     * Allowed headers for CORS requests
     * Includes essential headers for modern web applications
     * @constant {Array<string>} ALLOWED_HEADERS
     */
    ALLOWED_HEADERS: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Trace-Id',
        'X-API-Key'
    ],
    
    /**
     * Maximum age for CORS preflight cache (in seconds)
     * Optimizes performance by reducing preflight request frequency
     * @constant {number} MAX_AGE
     */
    MAX_AGE: 86400 // 24 hours
};

/**
 * Validate origin against configured allowlist with comprehensive logging
 * Implements dynamic origin validation for both development and production environments
 * @param {string} origin - Request origin to validate
 * @param {Function} callback - CORS callback function (origin, error)
 */
function validateOrigin(origin, callback) {
    const corsLogger = logger.createChildLogger({ component: 'cors-validator' });
    
    try {
        // Handle requests without origin (same-origin, mobile apps, etc.)
        if (!origin) {
            corsLogger.debug('Request without origin header - allowing', {
                userAgent: process.env.HTTP_USER_AGENT || 'unknown',
                requestType: 'same-origin-or-native'
            });
            return callback(null, true);
        }
        
        // Validate origin format using Node.js util for type safety
        if (!util.isString(origin) || origin.trim().length === 0) {
            corsLogger.warn('Invalid origin format detected', {
                origin: util.inspect(origin),
                originType: typeof origin,
                requestBlocked: true
            });
            return callback(new Error('Invalid origin format'), false);
        }
        
        const trimmedOrigin = origin.trim();
        const corsOrigins = config.corsOrigins;
        
        // Development environment - allow all origins with debugging
        if (config.isDevelopment) {
            corsLogger.debug('Development mode - allowing all origins', {
                origin: trimmedOrigin,
                environment: config.nodeEnv
            });
            return callback(null, true);
        }
        
        // Production environment - strict origin validation
        if (config.isProduction) {
            // Handle boolean true configuration (allow all - not recommended for production)
            if (corsOrigins === true) {
                corsLogger.warn('Production environment configured to allow all origins - security risk', {
                    origin: trimmedOrigin,
                    environment: config.nodeEnv,
                    securityWarning: true
                });
                return callback(null, true);
            }
            
            // Validate against origin allowlist
            if (util.isArray(corsOrigins)) {
                const isAllowed = corsOrigins.includes(trimmedOrigin);
                
                if (isAllowed) {
                    corsLogger.info('Origin validated successfully', {
                        origin: trimmedOrigin,
                        environment: config.nodeEnv,
                        allowedOrigins: corsOrigins.length
                    });
                    return callback(null, true);
                } else {
                    corsLogger.error('Origin validation failed - not in allowlist', {
                        origin: trimmedOrigin,
                        environment: config.nodeEnv,
                        allowedOrigins: corsOrigins,
                        securityViolation: true
                    });
                    return callback(new Error(`Origin '${trimmedOrigin}' not allowed by CORS policy`), false);
                }
            }
        }
        
        // Fallback for other environments (test, staging, etc.)
        const fallbackAllowed = corsOrigins === true || 
                               (util.isArray(corsOrigins) && corsOrigins.includes(trimmedOrigin));
        
        if (fallbackAllowed) {
            corsLogger.info('Origin allowed by fallback validation', {
                origin: trimmedOrigin,
                environment: config.nodeEnv || process.env.NODE_ENV,
                validationType: 'fallback'
            });
            return callback(null, true);
        } else {
            corsLogger.warn('Origin rejected by fallback validation', {
                origin: trimmedOrigin,
                environment: config.nodeEnv || process.env.NODE_ENV,
                corsConfig: util.inspect(corsOrigins)
            });
            return callback(new Error(`Origin '${trimmedOrigin}' not allowed`), false);
        }
        
    } catch (error) {
        corsLogger.error('Exception during origin validation', {
            origin: origin,
            error: error.message,
            stack: error.stack
        }, error);
        return callback(error, false);
    }
}

/**
 * Create comprehensive CORS options configuration object
 * Builds complete CORS configuration with environment-specific settings
 * @param {Object} customOptions - Custom CORS options to merge with defaults
 * @returns {Object} Complete CORS options configuration
 */
function createCorsOptions(customOptions = {}) {
    const corsLogger = logger.createChildLogger({ component: 'cors-options' });
    
    try {
        // Base CORS configuration with security defaults
        const baseOptions = {
            origin: validateOrigin,
            methods: CORS_DEFAULTS.ALLOWED_METHODS,
            allowedHeaders: CORS_DEFAULTS.ALLOWED_HEADERS,
            maxAge: CORS_DEFAULTS.MAX_AGE,
            credentials: true, // Enable credentials for cookie-based sessions
            optionsSuccessStatus: 200 // Legacy browser support for OPTIONS
        };
        
        // Environment-specific CORS enhancements
        if (config.isDevelopment) {
            baseOptions.exposedHeaders = [
                'X-Total-Count',
                'X-Request-Id', 
                'X-Response-Time',
                'X-Debug-Info'
            ];
            corsLogger.debug('Development CORS options created', {
                exposedHeaders: baseOptions.exposedHeaders,
                credentials: baseOptions.credentials
            });
        }
        
        if (config.isProduction) {
            baseOptions.exposedHeaders = [
                'X-Total-Count',
                'X-Request-Id'
            ];
            // Enhanced security for production
            baseOptions.preflightContinue = false;
            corsLogger.info('Production CORS options created', {
                exposedHeaders: baseOptions.exposedHeaders,
                securityEnhanced: true
            });
        }
        
        // Merge custom options with validation
        const finalOptions = { ...baseOptions, ...customOptions };
        
        // Validate merged configuration
        if (customOptions.origin && typeof customOptions.origin !== 'function') {
            corsLogger.warn('Custom origin provided - overriding validation function', {
                customOrigin: util.inspect(customOptions.origin),
                originalValidation: 'validateOrigin function'
            });
        }
        
        corsLogger.info('CORS options configuration completed', {
            methods: finalOptions.methods.length,
            allowedHeaders: finalOptions.allowedHeaders.length,
            credentials: finalOptions.credentials,
            maxAge: finalOptions.maxAge,
            environment: config.nodeEnv
        });
        
        return finalOptions;
        
    } catch (error) {
        corsLogger.error('Failed to create CORS options', {
            customOptions: util.inspect(customOptions),
            error: error.message
        }, error);
        
        // Return safe fallback configuration
        return {
            origin: false, // Block all origins as safe fallback
            methods: ['GET'],
            allowedHeaders: ['Content-Type'],
            credentials: false
        };
    }
}

/**
 * Handle CORS-related errors with comprehensive logging and response formatting
 * Provides detailed error context for CORS policy violations and configuration issues
 * @param {Error} error - CORS-related error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function handleCorsError(error, req, res, next) {
    const corsLogger = logger.createChildLogger({ component: 'cors-error-handler' });
    
    try {
        const errorContext = {
            origin: req.get('Origin') || 'unknown',
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent') || 'unknown',
            referer: req.get('Referer') || 'none',
            timestamp: new Date().toISOString(),
            requestId: req.get('X-Request-Id') || 'untracked'
        };
        
        // Log detailed CORS error with full context
        corsLogger.error('CORS policy violation detected', errorContext, error);
        
        // Check if response is already sent to prevent duplicate headers
        if (res.headersSent) {
            corsLogger.warn('Response already sent - cannot modify CORS headers', {
                ...errorContext,
                responseStatus: res.statusCode
            });
            return next(error);
        }
        
        // Set appropriate CORS error response
        res.status(403).json({
            error: 'CORS Policy Violation',
            message: 'Cross-origin request blocked by CORS policy',
            details: config.isDevelopment ? {
                origin: errorContext.origin,
                allowedOrigins: config.corsOrigins,
                hint: 'Check your CORS configuration or request origin'
            } : undefined,
            timestamp: errorContext.timestamp,
            requestId: errorContext.requestId
        });
        
        // Additional security logging for production environments
        if (config.isProduction) {
            corsLogger.error('Production CORS violation - potential security concern', {
                ...errorContext,
                severity: 'high',
                alerting: true
            });
        }
        
    } catch (handlingError) {
        corsLogger.error('Exception in CORS error handler', {
            originalError: error.message,
            handlingError: handlingError.message
        }, handlingError);
        
        // Fallback error response
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'CORS error handling failed',
                timestamp: new Date().toISOString()
            });
        }
    }
}

/**
 * Main CORS configuration middleware factory function
 * Creates and configures the CORS middleware with comprehensive options and error handling
 * @param {Object} options - Optional CORS configuration overrides
 * @returns {Function} Configured Express CORS middleware
 */
function corsConfig(options = {}) {
    const corsLogger = logger.createChildLogger({ component: 'cors-config' });
    
    try {
        // Create comprehensive CORS options
        const corsOptions = createCorsOptions(options);
        
        // Initialize CORS middleware with enhanced error handling
        const corsMiddleware = cors(corsOptions);
        
        corsLogger.info('CORS middleware initialized successfully', {
            environment: config.nodeEnv,
            allowedMethods: corsOptions.methods.length,
            allowedHeaders: corsOptions.allowedHeaders.length,
            credentials: corsOptions.credentials,
            customOptions: Object.keys(options).length > 0
        });
        
        // Return enhanced middleware with error wrapping
        return (req, res, next) => {
            corsMiddleware(req, res, (error) => {
                if (error) {
                    handleCorsError(error, req, res, next);
                } else {
                    next();
                }
            });
        };
        
    } catch (error) {
        corsLogger.error('Failed to initialize CORS middleware', {
            options: util.inspect(options),
            error: error.message
        }, error);
        
        // Return safe fallback middleware that blocks all CORS requests
        return (req, res, next) => {
            if (req.get('Origin')) {
                return handleCorsError(
                    new Error('CORS middleware initialization failed'), 
                    req, 
                    res, 
                    next
                );
            }
            next();
        };
    }
}

// Export all functions and constants as specified in the schema
module.exports = corsConfig;
module.exports.validateOrigin = validateOrigin;
module.exports.createCorsOptions = createCorsOptions;
module.exports.handleCorsError = handleCorsError;
module.exports.CORS_DEFAULTS = CORS_DEFAULTS;