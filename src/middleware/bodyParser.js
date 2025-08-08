/**
 * Request Body Parsing Middleware Configuration
 * 
 * Provides comprehensive middleware for parsing JSON, URL-encoded, and raw request bodies
 * with configurable size limits, type validation, and error handling for malformed payloads.
 * Wraps and configures the body-parser npm package with security-conscious configurations
 * to prevent DoS attacks and ensure robust request processing.
 * 
 * Key Features:
 * - Security-conscious configuration with size limits to prevent DoS attacks
 * - JSON request body parsing with 1MB default limit
 * - URL-encoded form data parsing for web submissions
 * - Raw body parsing for webhook payloads and signature verification
 * - Strict type checking to reject invalid content types
 * - Comprehensive error handling for malformed JSON with 400 status codes
 * - Environment-based configuration with development and production optimizations
 * - Configurable size limits based on endpoint requirements
 * - Preservation of raw body data for cryptographic signature verification
 * - Integration with centralized error handling middleware
 * 
 * @module bodyParser
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - Body parsing middleware library
const bodyParser = require('body-parser');

// External imports - Node.js built-in utility modules
const util = require('util');
const process = require('process');

// Internal imports - Environment-based configuration utility
const config = require('../utils/config.js');

// Internal imports - Structured logging utility  
const logger = require('../utils/logger.js');

// Internal imports - Custom error class for validation failures
const { ValidationError } = require('./errorHandler.js');

/**
 * Default body parser configuration constants
 * Provides comprehensive default values for all body parsing middleware options
 */
const BODY_PARSER_DEFAULTS = {
    // Size limit constants for different body types
    JSON_LIMIT: '1mb',              // Default JSON payload size limit
    URLENCODED_LIMIT: '1mb',        // Default URL-encoded payload size limit  
    RAW_LIMIT: '1mb',               // Default raw payload size limit
    
    // Parameter and field limits
    PARAMETER_LIMIT: 1000,          // Maximum number of URL-encoded parameters
    
    // Configuration flags
    STRICT_MODE: true,              // Strict JSON parsing mode
    EXTENDED: true,                 // Extended URL-encoded parsing with qs library
    TYPE_VALIDATION: true           // Enable content-type validation
};

/**
 * Handle body parsing errors with comprehensive error context
 * Provides centralized error handling for all body parsing failures
 * @param {Error} error - Original parsing error from body-parser
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
function handleParsingError(error, req, res, next) {
    // Extract request correlation details for logging
    const requestId = req.requestId || 'unknown';
    const contentType = req.get('Content-Type') || 'unknown';
    const contentLength = req.get('Content-Length') || 'unknown';
    
    // Log parsing error with comprehensive context
    logger.error('Body parsing error occurred', {
        requestId: requestId,
        errorType: error.type || error.name,
        errorMessage: error.message,
        contentType: contentType,
        contentLength: contentLength,
        method: req.method,
        path: req.originalUrl || req.path,
        userAgent: req.get('User-Agent') || 'unknown',
        clientIP: req.ip || req.connection?.remoteAddress || 'unknown'
    }, error);
    
    // Create detailed validation error based on parsing failure type
    let validationError;
    
    if (error.type === 'entity.parse.failed') {
        // JSON syntax errors
        validationError = new ValidationError(
            'Invalid JSON format in request body',
            {
                parseError: error.message,
                contentType: contentType,
                expectedFormat: 'Valid JSON object or array',
                position: error.body ? `Near character ${error.body.length}` : 'unknown'
            }
        );
    } else if (error.type === 'entity.too.large') {
        // Payload size limit exceeded
        validationError = new ValidationError(
            'Request payload exceeds maximum allowed size',
            {
                limit: error.limit || config.bodyParser.jsonLimit,
                received: contentLength,
                contentType: contentType,
                maxAllowed: error.expected || 'configured limit'
            }
        );
    } else if (error.type === 'request.aborted') {
        // Request was aborted during parsing
        validationError = new ValidationError(
            'Request was aborted during body parsing',
            {
                contentType: contentType,
                partialLength: error.received || 'unknown'
            }
        );
    } else if (error.type === 'charset.unsupported') {
        // Unsupported character encoding
        validationError = new ValidationError(
            'Unsupported character encoding in request body',
            {
                charset: error.charset || 'unknown',
                supportedCharsets: ['utf-8', 'utf8', 'ascii']
            }
        );
    } else if (error.type === 'encoding.unsupported') {
        // Unsupported content encoding
        validationError = new ValidationError(
            'Unsupported content encoding in request body',
            {
                encoding: error.encoding || 'unknown',
                supportedEncodings: ['identity', 'gzip', 'deflate']
            }
        );
    } else if (error.type === 'parameters.too.many') {
        // Too many URL-encoded parameters
        validationError = new ValidationError(
            'Too many parameters in URL-encoded request body',
            {
                limit: config.bodyParser.parameterLimit,
                contentType: contentType
            }
        );
    } else if (error.type === 'strict') {
        // Strict mode violation (non-object/array JSON)
        validationError = new ValidationError(
            'JSON body must be an object or array in strict mode',
            {
                received: typeof error.body,
                expectedTypes: ['object', 'array'],
                strictMode: config.bodyParser.strict
            }
        );
    } else {
        // Generic parsing error
        validationError = new ValidationError(
            'Request body parsing failed',
            {
                errorType: error.type || error.name,
                errorMessage: error.message,
                contentType: contentType
            }
        );
    }
    
    // Log validation error creation
    logger.debug('Validation error created for body parsing failure', {
        requestId: requestId,
        validationErrorType: validationError.name,
        statusCode: validationError.statusCode,
        details: validationError.details
    });
    
    // Pass validation error to centralized error handler
    next(validationError);
}

/**
 * Create JSON body parser middleware with security-conscious configuration
 * Implements comprehensive JSON parsing with size limits and strict validation
 * @param {Object} options - Custom configuration options to override defaults
 * @returns {Function} Express middleware function for JSON body parsing
 */
function jsonParser(options = {}) {
    // Merge provided options with configuration and defaults
    const mergedOptions = {
        limit: options.limit || config.bodyParser.jsonLimit || BODY_PARSER_DEFAULTS.JSON_LIMIT,
        strict: options.strict !== undefined ? options.strict : 
                (config.bodyParser.strict !== undefined ? config.bodyParser.strict : BODY_PARSER_DEFAULTS.STRICT_MODE),
        type: options.type || config.bodyParser.type || 'application/json',
        verify: options.verify || undefined,
        reviver: options.reviver || undefined,
        inflate: options.inflate !== undefined ? options.inflate : true
    };
    
    // Log JSON parser configuration
    logger.debug('Creating JSON parser middleware', {
        limit: mergedOptions.limit,
        strict: mergedOptions.strict,
        type: mergedOptions.type,
        environment: config.nodeEnv
    });
    
    // Create body-parser JSON middleware with error handling
    const parser = bodyParser.json(mergedOptions);
    
    // Return wrapper middleware that includes error handling
    return (req, res, next) => {
        parser(req, res, (error) => {
            if (error) {
                return handleParsingError(error, req, res, next);
            }
            
            // Log successful JSON parsing in development
            if (config.isDevelopment && req.body) {
                logger.debug('JSON body parsed successfully', {
                    contentLength: util.inspect(req.body).length,
                    bodyType: util.isObject(req.body) ? 'object' : typeof req.body,
                    hasContent: Object.keys(req.body || {}).length > 0
                });
            }
            
            next();
        });
    };
}

/**
 * Create URL-encoded body parser middleware for form submissions  
 * Implements comprehensive form data parsing with parameter limits
 * @param {Object} options - Custom configuration options to override defaults
 * @returns {Function} Express middleware function for URL-encoded body parsing
 */
function urlencodedParser(options = {}) {
    // Merge provided options with configuration and defaults
    const mergedOptions = {
        limit: options.limit || config.bodyParser.urlencodedLimit || BODY_PARSER_DEFAULTS.URLENCODED_LIMIT,
        extended: options.extended !== undefined ? options.extended : 
                 (config.bodyParser.extended !== undefined ? config.bodyParser.extended : BODY_PARSER_DEFAULTS.EXTENDED),
        parameterLimit: options.parameterLimit || config.bodyParser.parameterLimit || BODY_PARSER_DEFAULTS.PARAMETER_LIMIT,
        type: options.type || 'application/x-www-form-urlencoded',
        verify: options.verify || undefined,
        inflate: options.inflate !== undefined ? options.inflate : true
    };
    
    // Log URL-encoded parser configuration
    logger.debug('Creating URL-encoded parser middleware', {
        limit: mergedOptions.limit,
        extended: mergedOptions.extended,
        parameterLimit: mergedOptions.parameterLimit,
        type: mergedOptions.type,
        environment: config.nodeEnv
    });
    
    // Create body-parser URL-encoded middleware with error handling
    const parser = bodyParser.urlencoded(mergedOptions);
    
    // Return wrapper middleware that includes error handling
    return (req, res, next) => {
        parser(req, res, (error) => {
            if (error) {
                return handleParsingError(error, req, res, next);
            }
            
            // Log successful URL-encoded parsing in development  
            if (config.isDevelopment && req.body) {
                logger.debug('URL-encoded body parsed successfully', {
                    parameterCount: Object.keys(req.body || {}).length,
                    contentLength: util.inspect(req.body).length,
                    extended: mergedOptions.extended
                });
            }
            
            next();
        });
    };
}

/**
 * Create raw body parser middleware for webhook payloads and signature verification
 * Implements raw buffer parsing while preserving original payload data
 * @param {Object} options - Custom configuration options to override defaults  
 * @returns {Function} Express middleware function for raw body parsing
 */
function rawParser(options = {}) {
    // Merge provided options with configuration and defaults
    const mergedOptions = {
        limit: options.limit || config.bodyParser.rawLimit || BODY_PARSER_DEFAULTS.RAW_LIMIT,
        type: options.type || 'application/octet-stream',
        verify: options.verify || undefined,
        inflate: options.inflate !== undefined ? options.inflate : true
    };
    
    // Log raw parser configuration
    logger.debug('Creating raw parser middleware', {
        limit: mergedOptions.limit,
        type: mergedOptions.type,
        environment: config.nodeEnv
    });
    
    // Create body-parser raw middleware with error handling
    const parser = bodyParser.raw(mergedOptions);
    
    // Return wrapper middleware that includes error handling
    return (req, res, next) => {
        parser(req, res, (error) => {
            if (error) {
                return handleParsingError(error, req, res, next);
            }
            
            // Log successful raw parsing in development
            if (config.isDevelopment && req.body) {
                logger.debug('Raw body parsed successfully', {
                    bufferLength: Buffer.isBuffer(req.body) ? req.body.length : 0,
                    isBuffer: Buffer.isBuffer(req.body),
                    isUint8Array: util.types.isUint8Array(req.body)
                });
            }
            
            next();
        });
    };
}

/**
 * Create custom body parser with flexible type and verification support
 * Enables advanced parsing scenarios with custom type detection and verification
 * @param {Object} options - Custom parser configuration
 * @returns {Function} Express middleware function for custom body parsing
 */
function createCustomParser(options = {}) {
    // Validate required options
    if (!options.type) {
        throw new ValidationError('Custom parser requires type specification', {
            requiredOptions: ['type'],
            providedOptions: Object.keys(options)
        });
    }
    
    // Determine parser type based on content type pattern
    let baseParser;
    const typePattern = util.isString(options.type) ? options.type.toLowerCase() : String(options.type).toLowerCase();
    
    if (typePattern.includes('json')) {
        // Use JSON parser for JSON-like content types
        baseParser = bodyParser.json;
        logger.debug('Using JSON base parser for custom parser', { type: options.type });
    } else if (typePattern.includes('urlencoded') || typePattern.includes('form')) {
        // Use URL-encoded parser for form-like content types
        baseParser = bodyParser.urlencoded;
        logger.debug('Using URL-encoded base parser for custom parser', { type: options.type });
    } else if (typePattern.includes('text')) {
        // Use text parser for text-based content types
        baseParser = bodyParser.text;
        logger.debug('Using text base parser for custom parser', { type: options.type });
    } else {
        // Use raw parser for binary or unknown content types
        baseParser = bodyParser.raw;
        logger.debug('Using raw base parser for custom parser', { type: options.type });
    }
    
    // Set up default options based on environment
    const defaultLimit = config.isDevelopment ? '10mb' : '1mb';
    const mergedOptions = {
        limit: options.limit || defaultLimit,
        type: options.type,
        verify: options.verify || undefined,
        inflate: options.inflate !== undefined ? options.inflate : true,
        ...options
    };
    
    // Log custom parser creation
    logger.info('Creating custom body parser', {
        type: mergedOptions.type,
        limit: mergedOptions.limit,
        baseParser: baseParser.name,
        environment: config.nodeEnv
    });
    
    // Create custom parser middleware with error handling
    const parser = baseParser(mergedOptions);
    
    // Return wrapper middleware that includes error handling
    return (req, res, next) => {
        parser(req, res, (error) => {
            if (error) {
                return handleParsingError(error, req, res, next);
            }
            
            // Log successful custom parsing
            logger.debug('Custom body parsed successfully', {
                type: mergedOptions.type,
                hasBody: !!req.body,
                bodyType: typeof req.body
            });
            
            next();
        });
    };
}

/**
 * Main body parser configuration function (default export)
 * Provides comprehensive middleware configuration with environment-based optimization
 * @param {Object} app - Express application instance
 * @param {Object} customOptions - Custom configuration options to override defaults
 * @returns {Object} Object containing configured middleware functions
 */
function bodyParserConfig(app, customOptions = {}) {
    // Validate Express app instance
    if (!app || typeof app.use !== 'function') {
        throw new ValidationError('Invalid Express app instance provided to bodyParserConfig', {
            providedType: typeof app,
            expectedType: 'Express application instance',
            requiredMethods: ['use']
        });
    }
    
    // Log body parser configuration initialization
    logger.info('Initializing body parser middleware configuration', {
        environment: config.nodeEnv,
        isDevelopment: config.isDevelopment,
        customOptionsProvided: Object.keys(customOptions).length > 0
    });
    
    // Create configured middleware instances
    const middlewares = {
        json: jsonParser(customOptions.json || {}),
        urlencoded: urlencodedParser(customOptions.urlencoded || {}),
        raw: rawParser(customOptions.raw || {})
    };
    
    // Apply middleware to Express app based on environment and requirements
    if (customOptions.applyToApp !== false) {
        // Apply JSON parser for API endpoints
        app.use('/api/*', middlewares.json);
        logger.debug('Applied JSON parser to /api/* routes');
        
        // Apply URL-encoded parser for form submissions
        app.use('/forms/*', middlewares.urlencoded);
        app.use('/webhooks/form-*', middlewares.urlencoded);
        logger.debug('Applied URL-encoded parser to form and webhook routes');
        
        // Apply raw parser for webhook endpoints requiring signature verification
        app.use('/webhooks/*', middlewares.raw);
        logger.debug('Applied raw parser to /webhooks/* routes');
        
        // Global fallback parsers with lower precedence
        app.use(middlewares.json);
        app.use(middlewares.urlencoded);
        logger.debug('Applied global fallback parsers');
    }
    
    // Log successful configuration
    logger.info('Body parser middleware configuration completed successfully', {
        appliedMiddlewares: Object.keys(middlewares),
        globalApplication: customOptions.applyToApp !== false,
        environment: config.nodeEnv
    });
    
    // Return configured middleware functions for manual application
    return {
        json: middlewares.json,
        urlencoded: middlewares.urlencoded,
        raw: middlewares.raw,
        custom: createCustomParser,
        constants: BODY_PARSER_DEFAULTS,
        errorHandler: handleParsingError
    };
}

// Export default configuration function
module.exports = bodyParserConfig;

// Export individual parser functions as named exports
module.exports.jsonParser = jsonParser;
module.exports.urlencodedParser = urlencodedParser; 
module.exports.rawParser = rawParser;
module.exports.createCustomParser = createCustomParser;
module.exports.BODY_PARSER_DEFAULTS = BODY_PARSER_DEFAULTS;
module.exports.handleParsingError = handleParsingError;