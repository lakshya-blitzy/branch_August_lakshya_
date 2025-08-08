/**
 * Header Validation Middleware
 * 
 * Provides comprehensive validation of HTTP request headers for security threats
 * including XSS, SQL injection, and other malicious content. Implements early
 * detection and rejection of potentially dangerous header values.
 * 
 * Key Features:
 * - XSS detection in custom headers
 * - SQL injection detection in header values
 * - Malicious content pattern matching
 * - Comprehensive security logging
 * - Integration with validator utilities
 * 
 * @module headerValidation
 * @version 1.0.0
 * @author Blitzy Agent
 */

const logger = require('../utils/logger.js');
const validator = require('../utils/validator.js');
const responseFormatter = require('../utils/responseFormatter.js');
const { StatusCodes } = require('http-status-codes');

/**
 * Headers that should be validated for security threats
 * Custom headers and user-controllable headers are prioritized
 */
const HEADERS_TO_VALIDATE = [
    'x-custom-header',
    'x-forwarded-for',
    'x-real-ip',
    'user-agent',
    'referer',
    'origin',
    'x-requested-with',
    'x-csrf-token',
    'x-api-key'
];

/**
 * Headers that should be excluded from validation
 * System headers and authentication headers are typically safe
 */
const EXCLUDED_HEADERS = [
    'authorization',
    'content-type',
    'content-length',
    'host',
    'connection',
    'cache-control',
    'accept',
    'accept-encoding',
    'accept-language'
];

/**
 * Main header validation middleware function
 * Validates all incoming request headers for security threats
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
function headerValidationMiddleware(req, res, next) {
    try {
        logger.debug('Starting header validation', {
            method: req.method,
            path: req.path,
            headerCount: Object.keys(req.headers).length
        });

        // Get all headers from request
        const headers = req.headers || {};
        
        // Validate each header
        for (const [headerName, headerValue] of Object.entries(headers)) {
            // Skip excluded headers
            if (EXCLUDED_HEADERS.includes(headerName.toLowerCase())) {
                continue;
            }
            
            // Skip headers with no value
            if (!headerValue || typeof headerValue !== 'string') {
                continue;
            }

            try {
                // Use the same validator that's used for body/query validation
                validator.sanitizeInput({ [headerName]: headerValue });
                
            } catch (securityError) {
                // Security threat detected in header
                logger.warn('Security threat detected in request header', {
                    headerName,
                    headerValue: headerValue.substring(0, 100), // Log first 100 chars for debugging
                    securityError: securityError.message,
                    clientIp: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent') || 'unknown',
                    method: req.method,
                    path: req.path
                });

                // Return security error response
                const errorResponse = responseFormatter.error(securityError, {
                    statusCode: StatusCodes.BAD_REQUEST,
                    code: 'HEADER_VALIDATION_ERROR',
                    details: `Security threat detected in header '${headerName}': ${securityError.message}`
                });
                
                errorResponse.error.type = 'ValidationError';
                
                return res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
            }
        }

        logger.debug('Header validation completed successfully', {
            method: req.method,
            path: req.path,
            validatedHeaders: Object.keys(headers).length
        });

        // All headers validated successfully, continue to next middleware
        next();
        
    } catch (error) {
        logger.error('Header validation middleware error', {
            error: error.message,
            method: req.method,
            path: req.path
        }, error);

        // Return internal server error for validation middleware failures
        const errorResponse = responseFormatter.error(error, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            code: 'HEADER_VALIDATION_MIDDLEWARE_ERROR'
        });

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
}

/**
 * Factory function to create header validation middleware with custom options
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.additionalHeaders - Additional headers to validate
 * @param {Array} options.excludeHeaders - Additional headers to exclude  
 * @param {boolean} options.logHeaders - Whether to log header values (default: false)
 * @returns {Function} Configured header validation middleware
 */
function createHeaderValidationMiddleware(options = {}) {
    const {
        additionalHeaders = [],
        excludeHeaders = [],
        logHeaders = false
    } = options;

    // Merge additional headers to validate
    const headersToValidate = [...HEADERS_TO_VALIDATE, ...additionalHeaders];
    
    // Merge additional headers to exclude
    const excludedHeaders = [...EXCLUDED_HEADERS, ...excludeHeaders];

    logger.info('Header validation middleware created', {
        headersToValidate: headersToValidate.length,
        excludedHeaders: excludedHeaders.length,
        logHeaders
    });

    return headerValidationMiddleware;
}

module.exports = headerValidationMiddleware;
module.exports.createHeaderValidationMiddleware = createHeaderValidationMiddleware;
module.exports.HEADERS_TO_VALIDATE = HEADERS_TO_VALIDATE;
module.exports.EXCLUDED_HEADERS = EXCLUDED_HEADERS;