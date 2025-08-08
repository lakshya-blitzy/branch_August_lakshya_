/**
 * HTTP Request and Response Logging Middleware
 * 
 * Provides comprehensive logging middleware configuration that wraps and extends
 * the morgan logging library with customizable formats, structured logging,
 * request/response details, execution timing, and error tracking for monitoring
 * and debugging capabilities.
 * 
 * Features:
 * - Environment-specific logging (development vs production)
 * - Request ID correlation tracking
 * - Structured JSON logging for production environments
 * - Sensitive data sanitization (passwords, tokens)
 * - Custom morgan tokens for enhanced logging
 * - File output configuration with rotation support
 * - Integration with error handler middleware
 */

const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const process = require('process');
const fs = require('fs');
const path = require('path');
const stringify = require('fast-safe-stringify');

/**
 * List of sensitive field names to exclude from logs
 * Covers common patterns for passwords, tokens, and authentication data
 */
const SENSITIVE_FIELDS = [
    'password',
    'passwd',
    'pass',
    'secret',
    'token',
    'auth',
    'authorization',
    'bearer',
    'key',
    'apikey',
    'api_key',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'sessionid',
    'session_id',
    'cookie',
    'credentials',
    'pin',
    'ssn',
    'social_security',
    'credit_card',
    'creditcard',
    'cvv',
    'ccv'
];

/**
 * Sanitizes log data by removing sensitive information
 * 
 * @param {Object} data - Data object to sanitize
 * @returns {Object} Sanitized data with sensitive fields masked
 */
function sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeLogData(item));
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
        const lowercaseKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(sensitiveField => 
            lowercaseKey.includes(sensitiveField)
        );
        
        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeLogData(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Request ID middleware that adds unique correlation ID to each request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requestIdMiddleware(req, res, next) {
    // Generate unique request ID if not already present
    req.requestId = req.get('X-Request-ID') || uuidv4();
    
    // Add request ID to response headers for client correlation
    res.set('X-Request-ID', req.requestId);
    
    // Store request start time for performance tracking
    req.startTime = Date.now();
    
    next();
}

/**
 * Creates custom morgan tokens for enhanced logging information
 * 
 * Registers custom tokens with morgan for:
 * - Request ID correlation
 * - Request body size
 * - Response body size
 * - Request/response sanitized bodies
 * - User agent parsing
 * - Client IP extraction
 */
function createCustomTokens() {
    // Request ID token for correlation tracking
    morgan.token('requestId', (req) => {
        return req.requestId || 'unknown';
    });
    
    // Request body size token
    morgan.token('req-size', (req) => {
        if (req.get('content-length')) {
            return req.get('content-length');
        }
        return req.body ? Buffer.byteLength(stringify(req.body), 'utf8') : '0';
    });
    
    // Response body size token (approximation)
    morgan.token('res-size', (req, res) => {
        return res.get('content-length') || '0';
    });
    
    // Sanitized request body token for development logging
    morgan.token('req-body', (req) => {
        if (!req.body || Object.keys(req.body).length === 0) {
            return '';
        }
        return stringify(sanitizeLogData(req.body));
    });
    
    // Sanitized response body token (for development only)
    morgan.token('res-body', (req, res) => {
        // Only include response body in development mode
        if (process.env.NODE_ENV === 'production') {
            return '';
        }
        
        if (res.locals.responseBody) {
            return stringify(sanitizeLogData(res.locals.responseBody));
        }
        return '';
    });
    
    // User agent parsing token
    morgan.token('user-agent-parsed', (req) => {
        const userAgent = req.get('User-Agent') || '';
        // Basic user agent parsing - extract browser and version
        if (userAgent.includes('Chrome')) {
            const match = userAgent.match(/Chrome\/([0-9.]+)/);
            return match ? `Chrome/${match[1]}` : 'Chrome/unknown';
        } else if (userAgent.includes('Firefox')) {
            const match = userAgent.match(/Firefox\/([0-9.]+)/);
            return match ? `Firefox/${match[1]}` : 'Firefox/unknown';
        } else if (userAgent.includes('Safari')) {
            const match = userAgent.match(/Version\/([0-9.]+).*Safari/);
            return match ? `Safari/${match[1]}` : 'Safari/unknown';
        }
        return 'Other';
    });
    
    // Client IP token with proxy support
    morgan.token('client-ip', (req) => {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               'unknown';
    });
    
    // Request processing time in milliseconds
    morgan.token('processing-time', (req) => {
        if (req.startTime) {
            return `${Date.now() - req.startTime}ms`;
        }
        return '0ms';
    });
    
    // Environment token
    morgan.token('env', () => {
        return process.env.NODE_ENV || 'development';
    });
    
    // Timestamp in ISO format
    morgan.token('timestamp', () => {
        return new Date().toISOString();
    });
}

/**
 * Development logger configuration
 * 
 * Provides verbose, human-readable logging for development environments
 * with color coding, detailed request/response information, and debugging data
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeBody - Whether to include request/response bodies
 * @param {WriteStream} options.stream - Output stream (defaults to stdout)
 * @returns {Function} Configured morgan middleware for development
 */
function developmentLogger(options = {}) {
    const {
        includeBody = true,
        stream = process.stdout
    } = options;
    
    // Ensure custom tokens are registered
    createCustomTokens();
    
    // Development format with comprehensive details
    let format = ':timestamp [:requestId] :client-ip :method :url :status :res[content-length] - :processing-time :user-agent-parsed';
    
    if (includeBody) {
        format += ' | ReqBody: :req-body | ResBody: :res-body';
    }
    
    return morgan(format, {
        stream: stream,
        // Log all requests in development
        skip: () => false
    });
}

/**
 * Production logger configuration
 * 
 * Provides structured JSON logging optimized for production environments
 * with sensitive data sanitization, performance metrics, and log aggregation
 * compatibility
 * 
 * @param {Object} options - Configuration options
 * @param {WriteStream} options.stream - Output stream for logs
 * @param {string} options.logFile - Path to log file (optional)
 * @param {boolean} options.skipSuccessful - Skip logging successful requests
 * @returns {Function} Configured morgan middleware for production
 */
function productionLogger(options = {}) {
    const {
        stream,
        logFile,
        skipSuccessful = false
    } = options;
    
    // Ensure custom tokens are registered
    createCustomTokens();
    
    // Create write stream for file logging if specified
    let outputStream = stream;
    if (logFile && !stream) {
        // Ensure log directory exists
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        outputStream = fs.createWriteStream(logFile, { flags: 'a' });
    }
    
    // Custom JSON format for production logging
    morgan.format('json-production', (tokens, req, res) => {
        const logEntry = {
            timestamp: tokens.timestamp(req, res),
            requestId: tokens.requestId(req, res),
            environment: tokens.env(req, res),
            http: {
                method: tokens.method(req, res),
                url: tokens.url(req, res),
                version: req.httpVersion,
                status: parseInt(tokens.status(req, res)) || 0,
                userAgent: tokens['user-agent'](req, res),
                clientIP: tokens['client-ip'](req, res),
                referrer: tokens.referrer(req, res) || ''
            },
            request: {
                size: parseInt(tokens['req-size'](req, res)) || 0,
                headers: sanitizeLogData(req.headers)
            },
            response: {
                size: parseInt(tokens['res-size'](req, res)) || 0,
                time: parseInt(tokens['response-time'](req, res)) || 0,
                processingTime: tokens['processing-time'](req, res)
            },
            performance: {
                responseTime: tokens['response-time'](req, res),
                contentLength: tokens['res'][{'content-length': 'content-length'}] || '0'
            }
        };
        
        // Add error information if response indicates an error
        if (res.statusCode >= 400) {
            logEntry.error = {
                status: res.statusCode,
                message: res.statusMessage || 'Unknown error',
                stack: res.locals.errorStack || undefined
            };
        }
        
        return stringify(logEntry);
    });
    
    return morgan('json-production', {
        stream: outputStream || process.stdout,
        skip: (req, res) => {
            // Skip successful requests if configured
            if (skipSuccessful && res.statusCode < 400) {
                return true;
            }
            return false;
        }
    });
}

/**
 * Main logging configuration function
 * 
 * Returns appropriate logger based on NODE_ENV with sensible defaults
 * and comprehensive configuration options
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.environment - Override environment detection
 * @param {string} options.logLevel - Minimum log level
 * @param {string} options.logFile - File path for file-based logging
 * @param {boolean} options.enableConsole - Enable console output
 * @param {boolean} options.enableFile - Enable file output
 * @param {Object} options.customFormat - Custom morgan format
 * @returns {Function} Configured morgan middleware
 */
function loggingConfig(options = {}) {
    const {
        environment = process.env.NODE_ENV || 'development',
        logLevel = 'info',
        logFile,
        enableConsole = true,
        enableFile = false,
        customFormat
    } = options;
    
    // Register custom tokens
    createCustomTokens();
    
    // Determine logging strategy based on environment
    const isProduction = environment === 'production';
    const isDevelopment = environment === 'development';
    const isTest = environment === 'test';
    
    // Configure streams
    const streams = [];
    
    if (enableConsole && !isTest) {
        streams.push(process.stdout);
    }
    
    if (enableFile && logFile) {
        // Ensure log directory exists
        const logDir = path.dirname(path.resolve(logFile));
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const fileStream = fs.createWriteStream(path.resolve(logFile), { 
            flags: 'a',
            encoding: 'utf8'
        });
        streams.push(fileStream);
    }
    
    // Return appropriate logger based on environment
    if (isProduction) {
        return productionLogger({
            stream: streams[0],
            logFile: enableFile ? logFile : undefined,
            skipSuccessful: logLevel === 'error'
        });
    } else if (isDevelopment) {
        return developmentLogger({
            includeBody: true,
            stream: streams[0]
        });
    } else if (isTest) {
        // Minimal logging for test environment
        return morgan('tiny', {
            stream: fs.createWriteStream('/dev/null'),
            skip: () => true  // Skip all logging in test environment
        });
    } else {
        // Default to development-style logging
        return developmentLogger({
            includeBody: false,
            stream: streams[0] || process.stdout
        });
    }
}

// Export all logging functions
module.exports = loggingConfig;
module.exports.developmentLogger = developmentLogger;
module.exports.productionLogger = productionLogger;
module.exports.requestIdMiddleware = requestIdMiddleware;
module.exports.createCustomTokens = createCustomTokens;
module.exports.sanitizeLogData = sanitizeLogData;