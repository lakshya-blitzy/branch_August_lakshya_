/**
 * @fileoverview Comprehensive Express.js v5.1.0 Error Handling Middleware
 * @description Advanced error handling middleware that provides centralized error processing,
 * response generation, and logging for the Node.js tutorial project. Implements modern error
 * handling patterns with environment-aware error sanitization, security-conscious error responses,
 * and production-ready error management. Integrates with the complete error type system including
 * BaseError, HTTPError, ValidationError, SecurityError, and PM2Error classes for comprehensive
 * error processing.
 * 
 * Features Express v5.1.0 promise support, async error handling, PM2 cluster mode compatibility,
 * and cross-platform error response consistency with Flask implementations. Provides educational
 * error handling demonstrations while maintaining enterprise-grade production error management
 * with comprehensive logging, monitoring integration, and security violation handling.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// External library imports with version comments
import util from 'node:util'; // Node.js built-in - utilities for error object inspection and debugging
import crypto from 'node:crypto'; // Node.js built-in - cryptographic utilities for correlation IDs

// Internal imports - Error types and utilities
import {
    BaseError,
    HTTPError,
    ValidationError,
    SecurityError,
    PM2Error,
    createErrorResponse,
    isOperationalError,
    sanitizeErrorForResponse
} from '../utils/error-types.js';

// Internal imports - Logging and utilities
import logger, {
    generateRequestId,
    formatLogMessage
} from '../utils/logger.js';

// Internal imports - Configuration and constants
import {
    defaultEnvironmentConfig as environmentConfig,
    currentEnvironment,
    isProduction,
    isDevelopment
} from '../config/environment.js';

import {
    HTTP_CONSTANTS,
    ERROR_CONSTANTS
} from '../utils/constants.js';

// Global error tracking and metrics for comprehensive monitoring
const ERROR_HANDLER_METRICS = {
    total: 0,
    byType: {},
    httpErrors: 0,
    validationErrors: 0,
    securityErrors: 0,
    pm2Errors: 0
};

const ASYNC_ERROR_TRACKING = new Map();
const ERROR_CORRELATION_MAP = new Map();
const PERFORMANCE_METRICS = {
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    errorCount: 0
};

/**
 * Factory function that creates Express.js v5.1.0 compatible error handling middleware with
 * environment-specific configuration, comprehensive error processing, and production-ready
 * error management. Supports async error handling, promise rejection processing, and
 * integration with all custom error types.
 * 
 * @param {Object} [options={}] - Error handler configuration options
 * @param {boolean} [options.includeStack=false] - Include stack traces in responses
 * @param {boolean} [options.enableMetrics=true] - Enable error metrics tracking
 * @param {boolean} [options.enableCorrelation=true] - Enable error correlation tracking
 * @param {number} [options.maxStackDepth=10] - Maximum stack trace depth
 * @param {Array<string>} [options.sanitizeFields=[]] - Additional fields to sanitize
 * @returns {Function} Express.js error handling middleware with comprehensive error processing
 */
function createErrorHandler(options = {}) {
    // Validate and merge error handler options with environment-specific defaults
    const config = {
        includeStack: isDevelopment && (options.includeStack !== false),
        enableMetrics: options.enableMetrics !== false,
        enableCorrelation: options.enableCorrelation !== false,
        maxStackDepth: options.maxStackDepth || 10,
        sanitizeFields: options.sanitizeFields || [],
        logLevel: isProduction ? 'error' : 'debug',
        detailedLogging: isDevelopment,
        securityAlerts: isProduction,
        performanceTracking: options.performanceTracking !== false,
        crossPlatformCompatibility: true,
        ...options
    };

    // Initialize error handler metrics and tracking systems
    if (config.enableMetrics) {
        logger.debug('Error handler metrics enabled', {
            environment: currentEnvironment,
            metricsConfig: {
                enableMetrics: config.enableMetrics,
                enableCorrelation: config.enableCorrelation,
                performanceTracking: config.performanceTracking
            }
        });
    }

    // Return comprehensive Express.js error handling middleware function
    return async function errorHandler(error, req, res, next) {
        const startTime = process.hrtime.bigint();
        let correlationId = null;
        let processedError = null;

        try {
            // Generate or extract correlation ID for distributed error tracking
            correlationId = req.correlationId || 
                           generateRequestId() || 
                           crypto.randomUUID();

            // Store correlation tracking for distributed debugging
            if (config.enableCorrelation) {
                ERROR_CORRELATION_MAP.set(correlationId, {
                    timestamp: new Date().toISOString(),
                    requestId: req.id || correlationId,
                    method: req.method || 'UNKNOWN',
                    url: req.url || 'unknown',
                    ip: req.ip || req.connection?.remoteAddress || 'unknown',
                    userAgent: req.get('User-Agent') || 'unknown'
                });
            }

            // Process error with comprehensive classification and context extraction
            processedError = await processError(error, req, res, next);

            // Generate environment-appropriate error response with security considerations
            const errorResponse = await generateErrorResponse(processedError, req, {
                correlationId,
                config,
                environment: currentEnvironment
            });

            // Log comprehensive error details with correlation tracking
            await logErrorDetails(processedError, req, {
                correlationId,
                config,
                processingTime: Number(process.hrtime.bigint() - startTime) / 1000000
            });

            // Handle specialized error types with specific processing logic
            if (processedError instanceof SecurityError) {
                await handleSecurityError(processedError, req, res);
            } else if (processedError instanceof ValidationError) {
                await handleValidationError(processedError, req);
            } else if (processedError instanceof PM2Error) {
                await handlePM2Error(processedError, req, { correlationId });
            }

            // Update comprehensive error metrics and performance tracking
            if (config.enableMetrics) {
                updateErrorMetrics(processedError, {
                    processingTime: Number(process.hrtime.bigint() - startTime) / 1000000,
                    correlationId,
                    environment: currentEnvironment
                });
            }

            // Send error response with appropriate HTTP status and headers
            if (!res.headersSent) {
                // Set CORS headers for cross-platform compatibility
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

                // Set correlation ID header for distributed debugging
                if (correlationId) {
                    res.header('X-Correlation-ID', correlationId);
                }

                // Set cache control headers for error responses
                res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.header('Pragma', 'no-cache');
                res.header('Expires', '0');

                // Send comprehensive error response
                res.status(errorResponse.statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR)
                   .json(errorResponse.body);
            }

        } catch (handlerError) {
            // Handle errors that occur within the error handler itself
            logger.error('Error handler processing failed', {
                originalError: error.message,
                handlerError: handlerError.message,
                correlationId,
                stack: handlerError.stack,
                environment: currentEnvironment
            });

            // Send minimal safe error response if headers not sent
            if (!res.headersSent) {
                res.status(HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR)
                   .json({
                       error: 'Internal Server Error',
                       message: isProduction ? 
                           'An unexpected error occurred. Please try again later.' :
                           'Error handler processing failed',
                       correlationId: correlationId || 'unknown',
                       timestamp: new Date().toISOString()
                   });
            }
        } finally {
            // Cleanup correlation tracking to prevent memory leaks
            if (config.enableCorrelation && correlationId) {
                // Keep correlation data for 5 minutes for debugging
                setTimeout(() => {
                    ERROR_CORRELATION_MAP.delete(correlationId);
                }, 300000);
            }
        }
    };
}

/**
 * Handles asynchronous errors and promise rejections in Express.js v5.1.0 middleware by
 * properly catching unhandled promise rejections, async function errors, and ensuring
 * proper error propagation through the middleware chain with comprehensive error context
 * preservation.
 * 
 * @param {Function} asyncFunction - Async function to wrap with error handling
 * @returns {Function} Wrapped async function with comprehensive error handling
 */
function handleAsyncError(asyncFunction) {
    return async function wrappedAsyncFunction(req, res, next) {
        const correlationId = req.correlationId || generateRequestId();
        const startTime = process.hrtime.bigint();

        try {
            // Store async operation tracking for debugging
            ASYNC_ERROR_TRACKING.set(correlationId, {
                startTime,
                functionName: asyncFunction.name || 'anonymous',
                method: req.method,
                url: req.url,
                timestamp: new Date().toISOString()
            });

            // Execute async function with comprehensive error catching
            const result = await asyncFunction(req, res, next);
            
            // Clean up successful async operation tracking
            ASYNC_ERROR_TRACKING.delete(correlationId);
            
            return result;

        } catch (error) {
            // Enhance error with async context information
            const asyncContext = ASYNC_ERROR_TRACKING.get(correlationId);
            const processingTime = asyncContext ? 
                Number(process.hrtime.bigint() - asyncContext.startTime) / 1000000 : 0;

            // Add async operation metadata to error
            if (error instanceof BaseError) {
                error.addContext('asyncOperation', {
                    functionName: asyncFunction.name || 'anonymous',
                    processingTime,
                    correlationId,
                    operationType: 'async_middleware'
                });
            }

            // Log async error with comprehensive context
            logger.error('Async middleware error caught', {
                error: error.message,
                functionName: asyncFunction.name || 'anonymous',
                processingTime,
                correlationId,
                method: req.method,
                url: req.url,
                stack: error.stack,
                asyncContext
            });

            // Clean up tracking and forward error to error handler
            ASYNC_ERROR_TRACKING.delete(correlationId);
            next(error);
        }
    };
}

/**
 * Core error processing function that analyzes error types, classifies operational vs
 * programming errors, extracts error context, and prepares comprehensive error information
 * for response generation and logging with security-conscious information handling.
 * 
 * @param {Error} error - Error object to process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object} Processed error object with classification and context
 */
async function processError(error, req, res, next) {
    const startTime = process.hrtime.bigint();
    const processingContext = {
        correlationId: req.correlationId || generateRequestId(),
        timestamp: new Date().toISOString(),
        environment: currentEnvironment,
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection?.remoteAddress
    };

    try {
        // Classify error type using instanceof checks for custom error classes
        let processedError = error;
        let errorType = 'UnknownError';
        let isOperational = false;

        // Determine error type and operational classification
        if (error instanceof SecurityError) {
            errorType = 'SecurityError';
            isOperational = true;
            
            // Add security context and sanitize sensitive information
            processedError.addContext('securityIncident', {
                correlationId: processingContext.correlationId,
                timestamp: processingContext.timestamp,
                clientIP: processingContext.ip,
                userAgent: req.get('User-Agent'),
                securityType: error.securityType,
                riskLevel: error.getRiskLevel ? error.getRiskLevel() : 'medium'
            });

        } else if (error instanceof ValidationError) {
            errorType = 'ValidationError';
            isOperational = true;
            
            // Add validation context with field-level details
            processedError.addContext('validationFailure', {
                correlationId: processingContext.correlationId,
                fieldCount: error.validationErrors ? error.validationErrors.length : 0,
                validationSummary: error.getSummary ? error.getSummary() : 'Validation failed'
            });

        } else if (error instanceof HTTPError) {
            errorType = 'HTTPError';
            isOperational = true;
            
            // Add HTTP context with status code and headers
            processedError.addContext('httpError', {
                correlationId: processingContext.correlationId,
                statusCode: error.statusCode,
                method: processingContext.method,
                url: processingContext.url,
                headers: error.headers || {}
            });

        } else if (error instanceof PM2Error) {
            errorType = 'PM2Error';
            isOperational = error.isOperational !== false;
            
            // Add PM2 process context
            processedError.addContext('pm2Error', {
                correlationId: processingContext.correlationId,
                processId: error.processId || process.pid,
                clusterId: process.env.pm_id || 'single',
                affectsCluster: error.affectsCluster ? error.affectsCluster() : false,
                recoveryAction: error.getRecoveryAction ? error.getRecoveryAction() : 'restart'
            });

        } else if (error instanceof BaseError) {
            errorType = 'BaseError';
            isOperational = true;
            
            // Add base error context
            processedError.addContext('baseError', {
                correlationId: processingContext.correlationId,
                errorId: error.getCorrelationId ? error.getCorrelationId() : processingContext.correlationId
            });

        } else {
            // Handle native JavaScript errors and unknown error types
            errorType = error.constructor.name || 'Error';
            isOperational = isOperationalError(error);
            
            // Convert to BaseError for consistent handling
            processedError = new BaseError(
                error.message || 'An unexpected error occurred',
                {
                    code: error.code || 'UNKNOWN_ERROR',
                    statusCode: error.statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
                    originalError: error,
                    correlationId: processingContext.correlationId
                }
            );
        }

        // Add comprehensive system context information
        processedError.addContext('systemInfo', {
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: processingContext.timestamp
        });

        // Add request context for debugging and monitoring
        processedError.addContext('requestInfo', {
            method: processingContext.method,
            url: processingContext.url,
            headers: sanitizeRequestHeaders(req.headers),
            ip: processingContext.ip,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer'),
            contentType: req.get('Content-Type'),
            contentLength: req.get('Content-Length')
        });

        // Calculate processing metrics
        const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        processedError.addContext('processingMetrics', {
            processingTime,
            errorType,
            isOperational,
            severity: determineSeverity(processedError, isOperational),
            impact: assessErrorImpact(processedError, req)
        });

        // Log error processing completion
        logger.debug('Error processing completed', {
            errorType,
            isOperational,
            processingTime,
            correlationId: processingContext.correlationId,
            severity: processedError.context?.processingMetrics?.severity
        });

        return processedError;

    } catch (processingError) {
        // Handle errors that occur during error processing
        logger.error('Error processing failed', {
            originalError: error.message,
            processingError: processingError.message,
            correlationId: processingContext.correlationId,
            processingTime: Number(process.hrtime.bigint() - startTime) / 1000000
        });

        // Return minimal error object for safe handling
        return new BaseError(
            'Error processing failed',
            {
                code: 'ERROR_PROCESSING_FAILED',
                statusCode: HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
                originalError: error,
                processingError,
                correlationId: processingContext.correlationId
            }
        );
    }
}

/**
 * Generates environment-appropriate error responses with proper HTTP status codes, headers,
 * and sanitized error information. Ensures production environments don't leak sensitive
 * information while providing adequate debugging information for development and
 * comprehensive cross-platform response compatibility.
 * 
 * @param {Error} error - Processed error object
 * @param {Object} req - Express request object
 * @param {Object} processingContext - Error processing context
 * @returns {Object} Complete error response with status, headers, and body
 */
async function generateErrorResponse(error, req, processingContext) {
    const { correlationId, config, environment } = processingContext;
    const startTime = process.hrtime.bigint();

    try {
        // Determine appropriate HTTP status code based on error type
        let statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
        let headers = {
            'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
            'X-Correlation-ID': correlationId,
            'X-Error-Type': error.constructor.name,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        };

        // Extract status code from various error types
        if (error instanceof HTTPError) {
            statusCode = error.statusCode || statusCode;
            if (error.headers) {
                headers = { ...headers, ...error.headers };
            }
        } else if (error instanceof ValidationError) {
            statusCode = HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST;
        } else if (error instanceof SecurityError) {
            statusCode = HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN;
            headers['X-Security-Alert'] = 'true';
        } else if (error instanceof PM2Error) {
            statusCode = HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;
            headers['Retry-After'] = '60';
        }

        // Generate base error response structure
        const baseResponse = createErrorResponse(error, {
            includeStack: config?.includeStack && isDevelopment,
            sanitizeFields: config?.sanitizeFields || [],
            correlationId,
            environment
        });

        // Apply environment-specific sanitization
        const sanitizedResponse = sanitizeErrorForResponse(baseResponse, {
            environment,
            securityLevel: isProduction ? 'high' : 'medium',
            includeSensitiveData: isDevelopment
        });

        // Add cross-platform compatibility fields for Flask equivalence
        const crossPlatformResponse = {
            ...sanitizedResponse,
            success: false,
            error: true,
            timestamp: new Date().toISOString(),
            correlationId,
            environment: isProduction ? 'production' : environment,
            version: '1.0.0'
        };

        // Add validation details for ValidationError instances
        if (error instanceof ValidationError && error.validationErrors) {
            crossPlatformResponse.validation = {
                errors: error.validationErrors.map(err => ({
                    field: err.field || 'unknown',
                    message: err.message || 'Validation failed',
                    value: isDevelopment ? err.value : '[REDACTED]',
                    code: err.code || 'VALIDATION_ERROR'
                })),
                summary: error.getSummary ? error.getSummary() : 'Multiple validation errors'
            };
        }

        // Add security context for SecurityError instances
        if (error instanceof SecurityError) {
            crossPlatformResponse.security = {
                type: error.securityType || 'unknown',
                severity: error.severity || 'medium',
                action: isProduction ? 'logged' : 'logged_and_alerted',
                timestamp: new Date().toISOString()
            };
        }

        // Add PM2 context for PM2Error instances
        if (error instanceof PM2Error) {
            crossPlatformResponse.pm2 = {
                processId: error.processId || process.pid,
                clusterId: process.env.pm_id || 'single',
                recoveryAction: error.getRecoveryAction ? error.getRecoveryAction() : 'restart',
                affectsCluster: error.affectsCluster ? error.affectsCluster() : false
            };
        }

        // Calculate response generation metrics
        const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        
        // Add performance metadata for development
        if (isDevelopment) {
            crossPlatformResponse._metadata = {
                responseGenerationTime: responseTime,
                errorProcessingTime: error.context?.processingMetrics?.processingTime || 0,
                totalProcessingTime: responseTime + (error.context?.processingMetrics?.processingTime || 0),
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
        }

        logger.debug('Error response generated', {
            statusCode,
            correlationId,
            responseTime,
            hasValidation: !!crossPlatformResponse.validation,
            hasSecurity: !!crossPlatformResponse.security,
            hasPM2: !!crossPlatformResponse.pm2
        });

        return {
            statusCode,
            headers,
            body: crossPlatformResponse
        };

    } catch (responseError) {
        // Handle errors during response generation
        logger.error('Error response generation failed', {
            error: error.message,
            responseError: responseError.message,
            correlationId,
            stack: responseError.stack
        });

        // Return minimal safe error response
        return {
            statusCode: HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
            headers: {
                'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
                'X-Correlation-ID': correlationId
            },
            body: {
                error: 'Internal Server Error',
                message: isProduction ? 
                    'An unexpected error occurred. Please try again later.' :
                    'Error response generation failed',
                correlationId,
                timestamp: new Date().toISOString(),
                success: false
            }
        };
    }
}

/**
 * Comprehensive error logging function that records error details, context, stack traces,
 * and performance metrics to structured logging systems with proper sanitization for
 * security-sensitive information and integration with monitoring and alerting systems.
 * 
 * @param {Error} error - Processed error object
 * @param {Object} req - Express request object
 * @param {Object} errorContext - Error logging context
 */
async function logErrorDetails(error, req, errorContext) {
    const { correlationId, config, processingTime } = errorContext;
    
    try {
        // Extract comprehensive error information
        const errorInfo = {
            type: error.constructor.name,
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            statusCode: error.statusCode || HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
            stack: config?.detailedLogging ? error.stack : undefined,
            correlationId
        };

        // Extract request context for logging
        const requestInfo = {
            method: req.method || 'UNKNOWN',
            url: req.url || 'unknown',
            headers: sanitizeRequestHeaders(req.headers || {}),
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            referer: req.get('Referer') || null,
            contentType: req.get('Content-Type') || null
        };

        // Add system context information
        const systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            environment: currentEnvironment,
            timestamp: new Date().toISOString()
        };

        // Add performance metrics
        const performanceInfo = {
            processingTime,
            errorProcessingTime: error.context?.processingMetrics?.processingTime || 0,
            totalTime: processingTime + (error.context?.processingMetrics?.processingTime || 0)
        };

        // Create structured log message
        const logMessage = formatLogMessage({
            level: 'error',
            message: `Error processed: ${error.message}`,
            error: errorInfo,
            request: requestInfo,
            system: systemInfo,
            performance: performanceInfo,
            correlationId,
            timestamp: new Date().toISOString()
        });

        // Log with appropriate level based on error type and environment
        if (error instanceof SecurityError) {
            logger.logSecurityEvent({
                type: 'error',
                severity: error.severity || 'medium',
                securityType: error.securityType || 'unknown',
                message: error.message,
                context: {
                    correlationId,
                    ip: requestInfo.ip,
                    userAgent: requestInfo.userAgent,
                    timestamp: systemInfo.timestamp
                },
                sanitizedDetails: error.sanitizeForLogging ? error.sanitizeForLogging() : {}
            });
        } else if (error instanceof PM2Error) {
            logger.warn('PM2 Error encountered', {
                ...logMessage,
                pm2Context: {
                    processId: error.processId || process.pid,
                    clusterId: process.env.pm_id || 'single',
                    affectsCluster: error.affectsCluster ? error.affectsCluster() : false,
                    recoveryAction: error.getRecoveryAction ? error.getRecoveryAction() : 'restart'
                }
            });
        } else if (error instanceof ValidationError) {
            logger.warn('Validation Error encountered', {
                ...logMessage,
                validationContext: {
                    fieldCount: error.validationErrors ? error.validationErrors.length : 0,
                    summary: error.getSummary ? error.getSummary() : 'Validation failed'
                }
            });
        } else {
            // Log general errors with full context
            logger.error(logMessage);
        }

        // Log performance metrics for monitoring
        if (config?.performanceTracking && processingTime > 100) {
            logger.logPerformanceMetrics({
                type: 'error_processing',
                duration: processingTime,
                errorType: error.constructor.name,
                correlationId,
                timestamp: systemInfo.timestamp
            });
        }

    } catch (loggingError) {
        // Handle errors that occur during logging
        console.error('Error logging failed:', {
            originalError: error.message,
            loggingError: loggingError.message,
            correlationId,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Specialized security error handler that processes security violations from Helmet.js,
 * CORS, rate limiting, and authentication systems with appropriate security response
 * generation, threat tracking, and automated security incident management.
 * 
 * @param {SecurityError} securityError - Security error instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Security error response with blocking, logging, and alerting actions
 */
async function handleSecurityError(securityError, req, res) {
    const correlationId = req.correlationId || generateRequestId();
    const startTime = process.hrtime.bigint();

    try {
        // Extract security violation context and threat assessment
        const securityContext = {
            violationType: securityError.securityType || 'unknown',
            severity: securityError.severity || 'medium',
            clientIP: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            referer: req.get('Referer') || null,
            method: req.method || 'UNKNOWN',
            url: req.url || 'unknown',
            timestamp: new Date().toISOString(),
            correlationId
        };

        // Generate security alert for monitoring systems
        const securityAlert = securityError.getSecurityAlert ? 
            securityError.getSecurityAlert() : 
            {
                type: 'security_violation',
                severity: securityContext.severity,
                description: securityError.message,
                recommendedAction: 'log_and_monitor'
            };

        // Log detailed security violation with sanitized context
        logger.logSecurityEvent({
            type: 'security_error',
            severity: securityContext.severity,
            violation: securityContext.violationType,
            message: securityError.message,
            context: securityContext,
            alert: securityAlert,
            sanitizedDetails: securityError.sanitizeForLogging ? 
                securityError.sanitizeForLogging() : 
                { message: securityError.message, type: securityContext.violationType }
        });

        // Apply progressive security enforcement based on violation severity
        let securityAction = 'log';
        let additionalHeaders = {};

        switch (securityContext.severity) {
            case 'critical':
                securityAction = 'block_and_alert';
                additionalHeaders['X-Security-Action'] = 'blocked';
                additionalHeaders['X-Block-Reason'] = 'critical_security_violation';
                break;
            case 'high':
                securityAction = 'throttle_and_alert';
                additionalHeaders['X-Security-Action'] = 'throttled';
                additionalHeaders['Retry-After'] = '300'; // 5 minutes
                break;
            case 'medium':
                securityAction = 'log_and_monitor';
                additionalHeaders['X-Security-Action'] = 'monitored';
                break;
            default:
                securityAction = 'log';
                additionalHeaders['X-Security-Action'] = 'logged';
        }

        // Update security metrics for threat analysis
        updateSecurityMetrics(securityError, securityContext);

        // Calculate processing time for performance monitoring
        const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        logger.debug('Security error processed', {
            violationType: securityContext.violationType,
            severity: securityContext.severity,
            action: securityAction,
            processingTime,
            correlationId
        });

        return {
            action: securityAction,
            severity: securityContext.severity,
            headers: additionalHeaders,
            alert: securityAlert,
            processingTime
        };

    } catch (handlingError) {
        logger.error('Security error handling failed', {
            originalError: securityError.message,
            handlingError: handlingError.message,
            correlationId,
            stack: handlingError.stack
        });

        return {
            action: 'log',
            severity: 'unknown',
            headers: { 'X-Security-Action': 'error_in_processing' },
            alert: { type: 'processing_error', severity: 'medium' }
        };
    }
}

/**
 * Specialized validation error handler that processes input validation failures with
 * user-friendly error messages, field-level error details, and comprehensive validation
 * feedback for client-side error handling and form validation support.
 * 
 * @param {ValidationError} validationError - Validation error instance
 * @param {Object} req - Express request object
 * @returns {Object} Validation error response with field-level details and user-friendly messaging
 */
async function handleValidationError(validationError, req) {
    const correlationId = req.correlationId || generateRequestId();
    const startTime = process.hrtime.bigint();

    try {
        // Extract validation errors and field-level details
        const validationDetails = validationError.validationErrors || [];
        const fieldMapping = {};
        const userFriendlyMessages = [];

        // Process each validation error for user-friendly display
        validationDetails.forEach((validation, index) => {
            const field = validation.field || `field_${index}`;
            const message = validation.message || 'Validation failed';
            const value = isDevelopment ? validation.value : '[REDACTED]';
            const code = validation.code || 'VALIDATION_ERROR';

            // Create field mapping for client-side form error display
            fieldMapping[field] = {
                message,
                code,
                value: isDevelopment ? value : undefined,
                constraint: validation.constraint || null,
                expected: validation.expected || null
            };

            // Generate user-friendly error message
            userFriendlyMessages.push({
                field,
                message: generateUserFriendlyMessage(validation),
                severity: validation.severity || 'error'
            });
        });

        // Generate validation summary for overall status
        const validationSummary = validationError.getSummary ? 
            validationError.getSummary() : 
            `${validationDetails.length} validation error(s) occurred`;

        // Create comprehensive validation response
        const validationResponse = {
            type: 'validation_error',
            summary: validationSummary,
            fieldCount: validationDetails.length,
            fields: fieldMapping,
            messages: userFriendlyMessages,
            correlationId,
            timestamp: new Date().toISOString()
        };

        // Add request correlation information for debugging
        validationResponse.request = {
            method: req.method || 'UNKNOWN',
            url: req.url || 'unknown',
            contentType: req.get('Content-Type') || null,
            correlationId
        };

        // Log validation patterns for improvement analysis
        logger.warn('Validation error processed', {
            summary: validationSummary,
            fieldCount: validationDetails.length,
            fields: Object.keys(fieldMapping),
            method: req.method,
            url: req.url,
            correlationId,
            processingTime: Number(process.hrtime.bigint() - startTime) / 1000000
        });

        // Update validation metrics for pattern analysis
        updateValidationMetrics(validationError, req);

        return validationResponse;

    } catch (handlingError) {
        logger.error('Validation error handling failed', {
            originalError: validationError.message,
            handlingError: handlingError.message,
            correlationId,
            stack: handlingError.stack
        });

        return {
            type: 'validation_error',
            summary: 'Validation processing failed',
            fieldCount: 0,
            fields: {},
            messages: [],
            correlationId,
            timestamp: new Date().toISOString(),
            error: 'validation_processing_failed'
        };
    }
}

/**
 * Specialized PM2 error handler that processes cluster mode failures, process management
 * errors, and deployment issues with appropriate recovery actions, cluster coordination,
 * and zero-downtime error recovery strategies.
 * 
 * @param {PM2Error} pm2Error - PM2 error instance
 * @param {Object} req - Express request object
 * @param {Object} processContext - Process management context
 * @returns {Object} PM2 error response with recovery actions and cluster management information
 */
async function handlePM2Error(pm2Error, req, processContext) {
    const { correlationId } = processContext;
    const startTime = process.hrtime.bigint();

    try {
        // Extract PM2 error context and cluster impact assessment
        const pm2Context = {
            processId: pm2Error.processId || process.pid,
            clusterId: process.env.pm_id || 'single',
            instanceId: process.env.INSTANCE_ID || 'unknown',
            affectsCluster: pm2Error.affectsCluster ? pm2Error.affectsCluster() : false,
            recoveryAction: pm2Error.getRecoveryAction ? pm2Error.getRecoveryAction() : 'restart',
            severity: pm2Error.severity || 'medium',
            timestamp: new Date().toISOString(),
            correlationId
        };

        // Assess impact on cluster and other processes
        const clusterImpact = assessClusterImpact(pm2Error, pm2Context);

        // Generate recovery recommendations based on error type and impact
        const recoveryRecommendations = generateRecoveryRecommendations(pm2Error, pm2Context, clusterImpact);

        // Log PM2 error with comprehensive process context
        logger.warn('PM2 error processed', {
            message: pm2Error.message,
            processId: pm2Context.processId,
            clusterId: pm2Context.clusterId,
            affectsCluster: pm2Context.affectsCluster,
            recoveryAction: pm2Context.recoveryAction,
            clusterImpact,
            correlationId,
            timestamp: pm2Context.timestamp
        });

        // Coordinate with other cluster processes if necessary
        if (pm2Context.affectsCluster && clusterImpact.severity === 'high') {
            await coordinateClusterRecovery(pm2Error, pm2Context, recoveryRecommendations);
        }

        // Update PM2 metrics for process management optimization
        updatePM2Metrics(pm2Error, pm2Context, clusterImpact);

        // Calculate processing time for performance monitoring
        const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000;

        // Generate PM2 error response with recovery information
        const pm2Response = {
            type: 'pm2_error',
            processId: pm2Context.processId,
            clusterId: pm2Context.clusterId,
            recovery: {
                action: pm2Context.recoveryAction,
                recommendations: recoveryRecommendations,
                timeline: calculateRecoveryTimeline(pm2Context.recoveryAction),
                affectsCluster: pm2Context.affectsCluster
            },
            clusterStatus: {
                impact: clusterImpact,
                healthyProcesses: await getHealthyProcessCount(),
                totalProcesses: await getTotalProcessCount()
            },
            correlationId,
            timestamp: pm2Context.timestamp,
            processingTime
        };

        logger.debug('PM2 error response generated', {
            processId: pm2Context.processId,
            recoveryAction: pm2Context.recoveryAction,
            affectsCluster: pm2Context.affectsCluster,
            processingTime,
            correlationId
        });

        return pm2Response;

    } catch (handlingError) {
        logger.error('PM2 error handling failed', {
            originalError: pm2Error.message,
            handlingError: handlingError.message,
            correlationId,
            stack: handlingError.stack
        });

        return {
            type: 'pm2_error',
            processId: process.pid,
            clusterId: process.env.pm_id || 'single',
            recovery: {
                action: 'restart',
                recommendations: ['Manual process restart required'],
                timeline: 'immediate',
                affectsCluster: false
            },
            clusterStatus: {
                impact: { severity: 'unknown' },
                healthyProcesses: 'unknown',
                totalProcesses: 'unknown'
            },
            correlationId,
            timestamp: new Date().toISOString(),
            error: 'pm2_processing_failed'
        };
    }
}

/**
 * Updates comprehensive error metrics including error counts by type, performance impact,
 * response times, and operational statistics for monitoring dashboards, alerting systems,
 * and performance optimization analysis.
 * 
 * @param {Error} error - Processed error object
 * @param {Object} processingMetrics - Error processing metrics and context
 */
function updateErrorMetrics(error, processingMetrics) {
    const { processingTime, correlationId, environment } = processingMetrics;

    try {
        // Increment total error count and type-specific counters
        ERROR_HANDLER_METRICS.total++;
        
        const errorType = error.constructor.name;
        ERROR_HANDLER_METRICS.byType[errorType] = (ERROR_HANDLER_METRICS.byType[errorType] || 0) + 1;

        // Update error type-specific metrics
        if (error instanceof HTTPError) {
            ERROR_HANDLER_METRICS.httpErrors++;
        } else if (error instanceof ValidationError) {
            ERROR_HANDLER_METRICS.validationErrors++;
        } else if (error instanceof SecurityError) {
            ERROR_HANDLER_METRICS.securityErrors++;
        } else if (error instanceof PM2Error) {
            ERROR_HANDLER_METRICS.pm2Errors++;
        }

        // Update performance metrics with processing time tracking
        PERFORMANCE_METRICS.errorCount++;
        PERFORMANCE_METRICS.totalProcessingTime += processingTime;
        PERFORMANCE_METRICS.averageProcessingTime = 
            PERFORMANCE_METRICS.totalProcessingTime / PERFORMANCE_METRICS.errorCount;

        // Generate alerts for error rate threshold breaches
        const errorRate = calculateErrorRate();
        if (errorRate > getErrorRateThreshold(environment)) {
            logger.warn('Error rate threshold exceeded', {
                currentRate: errorRate,
                threshold: getErrorRateThreshold(environment),
                environment,
                metrics: ERROR_HANDLER_METRICS,
                correlationId
            });
        }

        // Log performance impact if processing time is excessive
        if (processingTime > 100) { // 100ms threshold
            logger.warn('Slow error processing detected', {
                processingTime,
                errorType,
                correlationId,
                averageTime: PERFORMANCE_METRICS.averageProcessingTime
            });
        }

        // Update trend analysis data for capacity planning
        updateErrorTrends(errorType, processingTime, environment);

        logger.debug('Error metrics updated', {
            total: ERROR_HANDLER_METRICS.total,
            byType: ERROR_HANDLER_METRICS.byType,
            averageProcessingTime: PERFORMANCE_METRICS.averageProcessingTime,
            errorRate,
            correlationId
        });

    } catch (metricsError) {
        logger.error('Error metrics update failed', {
            error: error.message,
            metricsError: metricsError.message,
            correlationId
        });
    }
}

/**
 * Validates error handling configuration, middleware integration, and error processing
 * effectiveness with comprehensive testing, performance analysis, and security assessment
 * for production readiness validation.
 * 
 * @param {Object} handlerConfig - Error handler configuration to validate
 * @returns {Object} Validation result with status, recommendations, and improvement suggestions
 */
function validateErrorHandling(handlerConfig) {
    const validationStart = process.hrtime.bigint();
    const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [],
        tests: {
            passed: 0,
            failed: 0,
            total: 0
        },
        performance: {
            validationTime: 0,
            configurationScore: 0
        },
        security: {
            compliant: true,
            vulnerabilities: []
        },
        timestamp: new Date().toISOString()
    };

    try {
        // Validate error handler configuration completeness
        const configTests = [
            {
                name: 'Environment Configuration',
                test: () => handlerConfig && typeof handlerConfig === 'object',
                message: 'Error handler configuration must be a valid object'
            },
            {
                name: 'Logger Integration',
                test: () => logger && typeof logger.error === 'function',
                message: 'Logger must be properly configured with error method'
            },
            {
                name: 'Error Types Available',
                test: () => BaseError && HTTPError && ValidationError && SecurityError && PM2Error,
                message: 'All custom error types must be available'
            },
            {
                name: 'Environment Detection',
                test: () => currentEnvironment && isProduction !== undefined && isDevelopment !== undefined,
                message: 'Environment detection must be functional'
            },
            {
                name: 'Constants Available',
                test: () => HTTP_CONSTANTS && ERROR_CONSTANTS,
                message: 'Required constants must be available'
            }
        ];

        // Execute configuration tests
        configTests.forEach(({ name, test, message }) => {
            validationResult.tests.total++;
            try {
                if (test()) {
                    validationResult.tests.passed++;
                } else {
                    validationResult.tests.failed++;
                    validationResult.errors.push(`${name}: ${message}`);
                    validationResult.isValid = false;
                }
            } catch (testError) {
                validationResult.tests.failed++;
                validationResult.errors.push(`${name}: Test execution failed - ${testError.message}`);
                validationResult.isValid = false;
            }
        });

        // Validate error processing pipeline functionality
        const processingTests = [
            {
                name: 'Error Classification',
                test: () => {
                    const testError = new HTTPError('Test error', { statusCode: 404 });
                    return testError instanceof HTTPError && testError instanceof BaseError;
                },
                message: 'Error classification and inheritance must work correctly'
            },
            {
                name: 'Correlation ID Generation',
                test: () => {
                    const id = generateRequestId();
                    return id && typeof id === 'string' && id.length > 0;
                },
                message: 'Correlation ID generation must be functional'
            },
            {
                name: 'Error Sanitization',
                test: () => {
                    const testData = { sensitive: 'password', safe: 'data' };
                    const sanitized = sanitizeErrorForResponse(testData, { environment: 'production' });
                    return sanitized && typeof sanitized === 'object';
                },
                message: 'Error sanitization must be available'
            }
        ];

        // Execute processing tests
        processingTests.forEach(({ name, test, message }) => {
            validationResult.tests.total++;
            try {
                if (test()) {
                    validationResult.tests.passed++;
                } else {
                    validationResult.tests.failed++;
                    validationResult.warnings.push(`${name}: ${message}`);
                }
            } catch (testError) {
                validationResult.tests.failed++;
                validationResult.warnings.push(`${name}: Test execution failed - ${testError.message}`);
            }
        });

        // Validate security error handling effectiveness
        const securityTests = [
            {
                name: 'Security Error Handling',
                test: () => {
                    try {
                        const secError = new SecurityError('Test security violation', { securityType: 'xss' });
                        return secError instanceof SecurityError;
                    } catch {
                        return false;
                    }
                },
                message: 'Security error handling must be available'
            },
            {
                name: 'Production Safety',
                test: () => {
                    if (isProduction) {
                        return !handlerConfig.includeStack && !handlerConfig.detailedLogging;
                    }
                    return true;
                },
                message: 'Production configuration must not leak sensitive information'
            }
        ];

        // Execute security tests
        securityTests.forEach(({ name, test, message }) => {
            validationResult.tests.total++;
            try {
                if (test()) {
                    validationResult.tests.passed++;
                } else {
                    validationResult.tests.failed++;
                    validationResult.security.vulnerabilities.push(`${name}: ${message}`);
                    validationResult.security.compliant = false;
                }
            } catch (testError) {
                validationResult.tests.failed++;
                validationResult.security.vulnerabilities.push(`${name}: Test execution failed - ${testError.message}`);
                validationResult.security.compliant = false;
            }
        });

        // Calculate configuration score and performance metrics
        const passRate = validationResult.tests.total > 0 ? 
            (validationResult.tests.passed / validationResult.tests.total) * 100 : 0;
        
        validationResult.performance.configurationScore = Math.round(passRate);
        validationResult.performance.validationTime = Number(process.hrtime.bigint() - validationStart) / 1000000;

        // Generate recommendations based on validation results
        if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
            validationResult.recommendations.push('Error handling configuration is optimal and ready for production');
        } else if (validationResult.errors.length === 0) {
            validationResult.recommendations.push('Error handling is functional but has warnings to address');
            validationResult.recommendations.push('Review warnings and consider improvements for optimal performance');
        } else {
            validationResult.recommendations.push('Critical errors must be fixed before production deployment');
            validationResult.recommendations.push('Address all configuration errors and rerun validation');
        }

        // Add environment-specific recommendations
        if (isProduction) {
            validationResult.recommendations.push('Ensure error sanitization is enabled for production');
            validationResult.recommendations.push('Verify security error handling is properly configured');
        } else {
            validationResult.recommendations.push('Consider enabling detailed logging for development debugging');
        }

        logger.info('Error handling validation completed', {
            isValid: validationResult.isValid,
            score: validationResult.performance.configurationScore,
            testsTotal: validationResult.tests.total,
            testsPassed: validationResult.tests.passed,
            testsFailed: validationResult.tests.failed,
            validationTime: validationResult.performance.validationTime,
            securityCompliant: validationResult.security.compliant
        });

        return validationResult;

    } catch (validationError) {
        logger.error('Error handling validation failed', {
            error: validationError.message,
            stack: validationError.stack,
            validationTime: Number(process.hrtime.bigint() - validationStart) / 1000000
        });

        validationResult.isValid = false;
        validationResult.errors.push(`Validation process failed: ${validationError.message}`);
        validationResult.recommendations.push('Fix validation process errors and retry validation');
        
        return validationResult;
    }
}

// Helper functions for error processing and metrics

/**
 * Sanitizes request headers to remove sensitive information
 * @private
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
function sanitizeRequestHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
        if (sanitized[header]) {
            sanitized[header] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Determines error severity based on error type and operational classification
 * @private
 * @param {Error} error - Error object
 * @param {boolean} isOperational - Whether error is operational
 * @returns {string} Severity level
 */
function determineSeverity(error, isOperational) {
    if (error instanceof SecurityError) {
        return error.severity || 'high';
    } else if (error instanceof PM2Error) {
        return error.affectsCluster && error.affectsCluster() ? 'critical' : 'medium';
    } else if (error instanceof HTTPError) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) return 'high';
        if (statusCode >= 400) return 'medium';
        return 'low';
    } else if (!isOperational) {
        return 'critical';
    }
    return 'medium';
}

/**
 * Assesses error impact on system and users
 * @private
 * @param {Error} error - Error object
 * @param {Object} req - Request object
 * @returns {string} Impact level
 */
function assessErrorImpact(error, req) {
    if (error instanceof SecurityError) return 'security';
    if (error instanceof PM2Error && error.affectsCluster && error.affectsCluster()) return 'cluster';
    if (error instanceof ValidationError) return 'user_input';
    if (error instanceof HTTPError && error.statusCode >= 500) return 'service';
    return 'minimal';
}

/**
 * Generates user-friendly validation error messages
 * @private
 * @param {Object} validation - Validation error details
 * @returns {string} User-friendly message
 */
function generateUserFriendlyMessage(validation) {
    const field = validation.field || 'field';
    const constraint = validation.constraint;
    
    switch (validation.code) {
        case 'REQUIRED':
            return `${field} is required`;
        case 'MIN_LENGTH':
            return `${field} must be at least ${constraint} characters long`;
        case 'MAX_LENGTH':
            return `${field} must be no more than ${constraint} characters long`;
        case 'EMAIL':
            return `${field} must be a valid email address`;
        case 'URL':
            return `${field} must be a valid URL`;
        default:
            return validation.message || `${field} is invalid`;
    }
}

/**
 * Calculates current error rate for monitoring
 * @private
 * @returns {number} Error rate percentage
 */
function calculateErrorRate() {
    const timeWindow = 60000; // 1 minute
    const now = Date.now();
    // This would typically use a sliding window, simplified for demonstration
    return ERROR_HANDLER_METRICS.total > 0 ? 
        (ERROR_HANDLER_METRICS.total / timeWindow) * 100 : 0;
}

/**
 * Gets error rate threshold based on environment
 * @private
 * @param {string} environment - Current environment
 * @returns {number} Error rate threshold
 */
function getErrorRateThreshold(environment) {
    const thresholds = {
        production: 5,    // 5% error rate
        staging: 10,      // 10% error rate
        development: 20,  // 20% error rate
        test: 50          // 50% error rate
    };
    
    return thresholds[environment] || thresholds.development;
}

/**
 * Updates error trend data for analysis
 * @private
 * @param {string} errorType - Type of error
 * @param {number} processingTime - Processing time
 * @param {string} environment - Environment name
 */
function updateErrorTrends(errorType, processingTime, environment) {
    // In a real implementation, this would update trend analysis data
    logger.debug('Error trend updated', {
        errorType,
        processingTime,
        environment,
        timestamp: new Date().toISOString()
    });
}

/**
 * Updates security metrics for threat analysis
 * @private
 * @param {SecurityError} error - Security error
 * @param {Object} context - Security context
 */
function updateSecurityMetrics(error, context) {
    logger.debug('Security metrics updated', {
        violationType: context.violationType,
        severity: context.severity,
        clientIP: context.clientIP,
        timestamp: context.timestamp
    });
}

/**
 * Updates validation metrics for pattern analysis
 * @private
 * @param {ValidationError} error - Validation error
 * @param {Object} req - Request object
 */
function updateValidationMetrics(error, req) {
    logger.debug('Validation metrics updated', {
        fieldCount: error.validationErrors ? error.validationErrors.length : 0,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
}

/**
 * Assesses cluster impact for PM2 errors
 * @private
 * @param {PM2Error} error - PM2 error
 * @param {Object} context - PM2 context
 * @returns {Object} Cluster impact assessment
 */
function assessClusterImpact(error, context) {
    return {
        severity: context.affectsCluster ? 'high' : 'low',
        affectedProcesses: context.affectsCluster ? 'multiple' : 'single',
        recoveryTime: context.affectsCluster ? 'extended' : 'minimal'
    };
}

/**
 * Generates recovery recommendations for PM2 errors
 * @private
 * @param {PM2Error} error - PM2 error
 * @param {Object} context - PM2 context
 * @param {Object} impact - Cluster impact
 * @returns {Array} Recovery recommendations
 */
function generateRecoveryRecommendations(error, context, impact) {
    const recommendations = [];
    
    if (impact.severity === 'high') {
        recommendations.push('Perform graceful cluster restart');
        recommendations.push('Verify all processes are healthy after restart');
    } else {
        recommendations.push('Restart affected process');
        recommendations.push('Monitor process stability');
    }
    
    return recommendations;
}

/**
 * Coordinates cluster recovery for PM2 errors
 * @private
 * @param {PM2Error} error - PM2 error
 * @param {Object} context - PM2 context
 * @param {Array} recommendations - Recovery recommendations
 */
async function coordinateClusterRecovery(error, context, recommendations) {
    logger.warn('Coordinating cluster recovery', {
        processId: context.processId,
        clusterId: context.clusterId,
        recommendations,
        correlationId: context.correlationId
    });
}

/**
 * Calculates recovery timeline based on action type
 * @private
 * @param {string} action - Recovery action
 * @returns {string} Recovery timeline
 */
function calculateRecoveryTimeline(action) {
    const timelines = {
        restart: 'immediate',
        reload: '1-2 minutes',
        graceful_restart: '2-5 minutes',
        cluster_restart: '5-10 minutes'
    };
    
    return timelines[action] || 'unknown';
}

/**
 * Gets healthy process count for cluster status
 * @private
 * @returns {Promise<number>} Healthy process count
 */
async function getHealthyProcessCount() {
    // In a real implementation, this would query PM2 for process status
    return parseInt(process.env.PM2_INSTANCES) || 1;
}

/**
 * Gets total process count for cluster status
 * @private
 * @returns {Promise<number>} Total process count
 */
async function getTotalProcessCount() {
    // In a real implementation, this would query PM2 for total processes
    return parseInt(process.env.PM2_INSTANCES) || 1;
}

/**
 * Updates PM2 metrics for process management
 * @private
 * @param {PM2Error} error - PM2 error
 * @param {Object} context - PM2 context
 * @param {Object} impact - Cluster impact
 */
function updatePM2Metrics(error, context, impact) {
    logger.debug('PM2 metrics updated', {
        processId: context.processId,
        clusterId: context.clusterId,
        impact: impact.severity,
        timestamp: context.timestamp
    });
}

// Export default error handler for Express.js integration
const errorHandler = createErrorHandler();

export {
    // Main error handler middleware
    errorHandler as default,
    
    // Factory and utility functions
    createErrorHandler,
    handleAsyncError,
    processError,
    generateErrorResponse,
    logErrorDetails,
    
    // Specialized error handlers
    handleSecurityError,
    handleValidationError,
    handlePM2Error,
    
    // Metrics and validation
    updateErrorMetrics,
    validateErrorHandling,
    
    // Error handler metrics for monitoring
    ERROR_HANDLER_METRICS,
    PERFORMANCE_METRICS
};

// Initialize error handler system
logger.info('Express.js error handling middleware initialized', {
    environment: currentEnvironment,
    version: '1.0.0',
    features: {
        asyncSupport: true,
        securityHandling: true,
        pm2Compatibility: true,
        crossPlatformCompatibility: true,
        metricsTracking: true,
        correlationTracking: true
    },
    timestamp: new Date().toISOString()
});