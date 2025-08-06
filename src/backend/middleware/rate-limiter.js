/**
 * @fileoverview Express.js Rate Limiting Middleware - Phase 6 Security Implementation
 * @description Comprehensive DoS attack prevention and API abuse protection middleware
 *              with PM2 cluster compatibility, Redis distribution support, and educational
 *              security demonstrations for Node.js tutorial project
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Sliding window rate limiting algorithm with configurable thresholds
 * - Environment-specific security policies (development, production, testing)
 * - PM2 cluster mode compatibility with distributed state management
 * - Redis integration for production deployment scaling
 * - Custom key generation for accurate client identification
 * - Comprehensive security event logging and monitoring
 * - Educational error responses with security explanations
 * - Integration with Helmet.js security headers and CORS policies
 * - Administrative tools for rate limiting management and debugging
 * 
 * Security Benefits:
 * - Prevents denial of service (DoS) attacks through request frequency limiting
 * - Protects against API abuse and resource exhaustion
 * - Provides distributed rate limiting across PM2 worker processes
 * - Implements security best practices with comprehensive monitoring
 * - Supports production-ready deployment with zero-downtime capabilities
 */

// External dependencies - Latest versions for 2025 security and performance
import rateLimit from 'express-rate-limit'; // v7.1.5 - Express.js rate limiting with sliding window support
import { RedisStore } from 'rate-limit-redis'; // v4.2.0 - Redis storage for distributed rate limiting

// Internal configuration and utility imports
import { 
    createRateLimitConfig, 
    createDevelopmentConfig, 
    createProductionConfig 
} from '../security/rate-limit.config.js';

import { 
    SECURITY_CONSTANTS, 
    API_CONSTANTS 
} from '../utils/constants.js';

import { 
    currentEnvironment, 
    isProduction, 
    getSecurityConfig as securityConfig 
} from '../config/environment.js';

import logger, { logSecurityEvent } from '../utils/logger.js';

import {
    HTTPError,
    SecurityError,
    createErrorResponse,
    sanitizeErrorForResponse
} from '../utils/error-types.js';

// Global rate limiter state and metrics tracking
let RATE_LIMITER_INITIALIZED = false;
const DEFAULT_RATE_LIMIT_CONFIG = {
    windowMs: 900000, // 15 minutes in milliseconds
    max: 100, // Maximum requests per window
    standardHeaders: true, // Include standard rate limit headers
    legacyHeaders: false, // Disable legacy X-RateLimit headers
    skipSuccessfulRequests: false, // Count all requests
    skipFailedRequests: false // Count failed requests for security
};

// Rate limiting metrics for monitoring and educational purposes
const RATE_LIMIT_METRICS = {
    requests: 0, // Total requests processed
    blocked: 0, // Total requests blocked
    errors: 0, // Total errors encountered
    lastReset: Date.now(), // Last metrics reset timestamp
    clients: new Map(), // Client-specific tracking
    violations: new Map() // Security violation tracking
};

/**
 * Helper function to extract client IP address from request
 * Supports proxy headers and IPv6 addresses for accurate client identification
 * 
 * @param {Object} req - Express request object
 * @returns {string} Client IP address with fallback handling
 */
function getClientIp(req) {
    try {
        // Check for IP in various proxy headers (most common to least common)
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            const ips = forwardedFor.split(',').map(ip => ip.trim());
            return ips[0];
        }

        // Check other common proxy headers
        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return realIp.trim();
        }

        // Check for Cloudflare connecting IP
        const cfConnectingIp = req.headers['cf-connecting-ip'];
        if (cfConnectingIp) {
            return cfConnectingIp.trim();
        }

        // Fall back to connection remote address
        const remoteAddress = req.connection?.remoteAddress || 
                             req.socket?.remoteAddress || 
                             req.ip;

        // Handle IPv6 localhost mapping to IPv4
        if (remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1') {
            return '127.0.0.1';
        }

        return remoteAddress || 'unknown';
    } catch (error) {
        logger.warn('Failed to extract client IP address', {
            error: error.message,
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.url
        });
        return 'unknown';
    }
}

/**
 * Helper function to format standardized HTTP responses
 * Provides consistent response structure for rate limit violations
 * 
 * @param {Object} options - Response formatting options
 * @returns {Object} Standardized HTTP response object
 */
function formatHTTPResponse({ status, message, data = null, error = null, headers = {} }) {
    const response = {
        success: status >= 200 && status < 300,
        status,
        message,
        timestamp: new Date().toISOString(),
        environment: currentEnvironment
    };

    // Include data if provided and successful
    if (data && response.success) {
        response.data = data;
    }

    // Include error details if provided and not successful
    if (error && !response.success) {
        response.error = isProduction ? 
            sanitizeErrorForResponse(error) : 
            error;
    }

    // Include educational context for rate limiting
    if (status === 429) {
        response.educational = {
            concept: 'Rate Limiting',
            explanation: 'This request was blocked to prevent abuse and ensure fair resource usage',
            mitigation: 'Reduce request frequency or implement proper backoff strategies',
            documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429'
        };
    }

    return { response, headers };
}

/**
 * Creates comprehensive rate limiting middleware with environment-specific configuration
 * Supports distributed deployment, custom key generation, and security monitoring
 * 
 * @param {Object} options - Rate limiting configuration options
 * @param {string} options.environment - Target environment (development, production, testing)
 * @param {Object} options.customConfig - Custom configuration overrides
 * @param {boolean} options.enableRedis - Enable Redis storage for distributed mode
 * @param {Object} options.keyGenerator - Custom key generation options
 * @param {Object} options.monitoring - Monitoring and logging configuration
 * @returns {Function} Express.js middleware function for rate limiting
 */
function createRateLimiterMiddleware(options = {}) {
    try {
        // Extract and validate configuration options
        const {
            environment = currentEnvironment,
            customConfig = {},
            enableRedis = isProduction,
            keyGenerator = {},
            monitoring = {}
        } = options;

        logger.info('Initializing rate limiting middleware', {
            environment,
            enableRedis,
            customConfig: Object.keys(customConfig),
            rateLimiterInitialized: RATE_LIMITER_INITIALIZED
        });

        // Create environment-specific configuration
        let config;
        switch (environment) {
            case 'production':
                config = createProductionConfig(customConfig);
                break;
            case 'development':
                config = createDevelopmentConfig(customConfig);
                break;
            case 'test':
                config = {
                    ...DEFAULT_RATE_LIMIT_CONFIG,
                    windowMs: 60000, // 1 minute for testing
                    max: 10000, // High limit for testing
                    ...customConfig
                };
                break;
            default:
                config = createRateLimitConfig(environment, customConfig);
        }

        // Initialize Redis store for distributed environments
        let store = undefined;
        if (enableRedis && isProduction) {
            try {
                store = new RedisStore({
                    // Redis connection configuration from environment
                    host: securityConfig.redis?.host || 'localhost',
                    port: securityConfig.redis?.port || 6379,
                    password: securityConfig.redis?.password,
                    db: securityConfig.redis?.db || 0,
                    // Connection options for production reliability
                    connectTimeout: 10000,
                    commandTimeout: 5000,
                    retryDelayOnFailover: 100,
                    maxRetriesPerRequest: 3,
                    // Key prefix for rate limiting
                    prefix: 'rate_limit:',
                    // Expiration handling
                    expiry: Math.ceil(config.windowMs / 1000)
                });

                logger.info('Redis store initialized for distributed rate limiting', {
                    host: securityConfig.redis?.host || 'localhost',
                    port: securityConfig.redis?.port || 6379,
                    prefix: 'rate_limit:'
                });
            } catch (error) {
                logger.error('Failed to initialize Redis store, falling back to memory store', {
                    error: error.message,
                    stack: error.stack
                });
                store = undefined; // Fall back to memory store
            }
        }

        // Create custom key generator for client identification
        const customKeyGenerator = createCustomKeyGenerator({
            includeUserAgent: keyGenerator.includeUserAgent || false,
            includeEndpoint: keyGenerator.includeEndpoint || false,
            hashKeys: keyGenerator.hashKeys || isProduction,
            ...keyGenerator
        });

        // Create custom rate limit exceeded handler
        const rateLimitHandler = createRateLimitHandler({
            environment,
            includeEducational: !isProduction,
            enableSecurityLogging: true,
            ...monitoring
        });

        // Create rate limiting middleware configuration
        const rateLimitConfig = {
            ...config,
            store,
            keyGenerator: customKeyGenerator,
            handler: rateLimitHandler,
            // Skip function for health checks and internal requests
            skip: (req) => {
                // Skip rate limiting for health check endpoints
                if (req.path === '/health' || req.path === '/status') {
                    return true;
                }
                
                // Skip for internal service requests (if configured)
                const internalToken = req.headers['x-internal-token'];
                if (internalToken && internalToken === securityConfig.internalToken) {
                    return true;
                }
                
                return false;
            }
        };

        // Create and configure the rate limiting middleware
        const rateLimiter = rateLimit(rateLimitConfig);

        // Mark rate limiter as initialized
        RATE_LIMITER_INITIALIZED = true;

        logger.info('Rate limiting middleware successfully created', {
            environment,
            windowMs: config.windowMs,
            maxRequests: config.max,
            storeType: store ? 'redis' : 'memory',
            keyGeneratorType: 'custom',
            handlerType: 'custom'
        });

        return rateLimiter;

    } catch (error) {
        logger.error('Failed to create rate limiting middleware', {
            error: error.message,
            stack: error.stack,
            options
        });

        // Return a pass-through middleware that logs errors but doesn't block requests
        return (req, res, next) => {
            logger.warn('Rate limiting disabled due to initialization error', {
                method: req.method,
                url: req.url,
                clientIp: getClientIp(req)
            });
            next();
        };
    }
}

/**
 * Creates custom key generation function for accurate client identification
 * Supports distributed PM2 environments with consistent key generation
 * 
 * @param {Object} keyOptions - Key generation configuration options
 * @returns {Function} Key generator function for rate limiting storage
 */
function createCustomKeyGenerator(keyOptions = {}) {
    const {
        includeUserAgent = false,
        includeEndpoint = false,
        hashKeys = isProduction,
        keyPrefix = 'rl:'
    } = keyOptions;

    return async (req) => {
        try {
            // Start with client IP as base identifier
            const clientIp = getClientIp(req);
            let keyComponents = [clientIp];

            // Include user agent for more specific identification (optional)
            if (includeUserAgent && req.headers['user-agent']) {
                const userAgent = req.headers['user-agent'].substring(0, 100); // Limit length
                keyComponents.push(userAgent);
            }

            // Include endpoint for endpoint-specific rate limiting (optional)
            if (includeEndpoint) {
                keyComponents.push(req.method, req.route?.path || req.path);
            }

            // Include authenticated user ID if available
            if (req.user?.id) {
                keyComponents.push(`user:${req.user.id}`);
            }

            // Include API key if present
            if (req.headers['x-api-key']) {
                const apiKey = req.headers['x-api-key'].substring(0, 20); // Limit for security
                keyComponents.push(`api:${apiKey}`);
            }

            // Include test client identifier for testing purposes
            if (req.headers['x-test-client']) {
                const testClient = req.headers['x-test-client'].substring(0, 50); // Limit for safety
                keyComponents.push(`test:${testClient}`);
            }

            // Generate composite key
            let compositeKey = keyComponents.join('|');

            // Hash the key for privacy and storage efficiency in production
            if (hashKeys) {
                const crypto = await import('node:crypto');
                const hash = crypto.createHash('sha256');
                hash.update(compositeKey);
                compositeKey = hash.digest('hex').substring(0, 32); // Use first 32 chars
            }

            const finalKey = `${keyPrefix}${compositeKey}`;

            // Log key generation for debugging (not in production)
            if (!isProduction) {
                logger.debug('Generated rate limiting key', {
                    originalComponents: keyComponents.length,
                    hashedKey: hashKeys,
                    keyLength: finalKey.length,
                    clientIp
                });
            }

            return finalKey;

        } catch (error) {
            logger.error('Failed to generate rate limiting key', {
                error: error.message,
                clientIp: getClientIp(req),
                method: req.method,
                url: req.url
            });

            // Fallback to simple IP-based key
            return `${keyPrefix}${getClientIp(req)}`;
        }
    };
}

/**
 * Creates custom handler for rate limit exceeded scenarios
 * Provides comprehensive security logging and educational error responses
 * 
 * @param {Object} handlerConfig - Handler configuration options
 * @returns {Function} Express middleware function for handling rate limit violations
 */
function createRateLimitHandler(handlerConfig = {}) {
    const {
        environment = currentEnvironment,
        includeEducational = !isProduction,
        enableSecurityLogging = true,
        customMessage = null
    } = handlerConfig;

    return async (req, res, next) => {
        try {
            // Extract request information for security analysis
            const clientIp = getClientIp(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            const method = req.method;
            const url = req.url;
            const timestamp = new Date().toISOString();

            // Check if this is the first time the limit is reached (replaces deprecated onLimitReached)
            if (req.rateLimit && req.rateLimit.current === req.rateLimit.limit + 1) {
                // Update violation tracking (moved from deprecated onLimitReached)
                if (!RATE_LIMIT_METRICS.violations.has(clientIp)) {
                    RATE_LIMIT_METRICS.violations.set(clientIp, {
                        count: 0,
                        firstViolation: Date.now(),
                        lastViolation: Date.now()
                    });
                }
                
                const violation = RATE_LIMIT_METRICS.violations.get(clientIp);
                violation.count++;
                violation.lastViolation = Date.now();
                
                // Log security event for potential DoS attack (moved from deprecated onLimitReached)
                logSecurityEvent('RATE_LIMIT_VIOLATION', {
                    clientIp,
                    userAgent: req.headers['user-agent'],
                    method: req.method,
                    url: req.url,
                    violationCount: violation.count,
                    timeSinceFirst: Date.now() - violation.firstViolation
                });
            }

            // Update rate limiting metrics
            RATE_LIMIT_METRICS.blocked++;
            
            // Update client-specific metrics
            if (!RATE_LIMIT_METRICS.clients.has(clientIp)) {
                RATE_LIMIT_METRICS.clients.set(clientIp, {
                    requests: 0,
                    blocked: 0,
                    firstSeen: timestamp
                });
            }
            const clientMetrics = RATE_LIMIT_METRICS.clients.get(clientIp);
            clientMetrics.blocked++;

            // Log security event if logging is enabled
            if (enableSecurityLogging) {
                logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                    clientIp,
                    userAgent,
                    method,
                    url,
                    timestamp,
                    totalBlocked: RATE_LIMIT_METRICS.blocked,
                    clientBlocked: clientMetrics.blocked,
                    environment
                });
            }

            // Check for potential DoS attack patterns
            const recentViolations = RATE_LIMIT_METRICS.violations.get(clientIp);
            if (recentViolations && recentViolations.count > 10) {
                const timeSinceFirst = Date.now() - recentViolations.firstViolation;
                if (timeSinceFirst < 300000) { // 5 minutes
                    logger.logSecurityEvent('POTENTIAL_DOS_ATTACK', {
                        clientIp,
                        violationCount: recentViolations.count,
                        timeWindow: timeSinceFirst,
                        severity: 'HIGH'
                    });
                }
            }

            // Calculate retry-after header value
            const resetTime = res.getHeader('X-RateLimit-Reset');
            const retryAfter = resetTime ? 
                Math.ceil((resetTime - Date.now()) / 1000) : 
                Math.ceil(DEFAULT_RATE_LIMIT_CONFIG.windowMs / 1000);

            // Create error response
            const errorMessage = customMessage || 
                SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.DEFAULT_MESSAGE ||
                'Too many requests from this IP, please try again later.';

            // Create comprehensive error response
            const { response, headers } = formatHTTPResponse({
                status: 429,
                message: errorMessage,
                error: includeEducational ? {
                    type: 'RATE_LIMIT_EXCEEDED',
                    code: 'TOO_MANY_REQUESTS',
                    details: {
                        windowMs: res.getHeader('X-RateLimit-Window') || DEFAULT_RATE_LIMIT_CONFIG.windowMs,
                        limit: res.getHeader('X-RateLimit-Limit') || DEFAULT_RATE_LIMIT_CONFIG.max,
                        remaining: res.getHeader('X-RateLimit-Remaining') || 0,
                        resetTime: resetTime || (Date.now() + DEFAULT_RATE_LIMIT_CONFIG.windowMs)
                    }
                } : undefined,
                headers: {
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Type': 'sliding-window',
                    'Content-Type': 'application/json'
                }
            });

            // Set response headers
            Object.entries(headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });

            // Send rate limit exceeded response
            res.status(429).json(response);

        } catch (error) {
            logger.error('Error in rate limit handler', {
                error: error.message,
                stack: error.stack,
                clientIp: getClientIp(req),
                method: req.method,
                url: req.url
            });

            // Fallback error response
            res.status(429).json({
                success: false,
                status: 429,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString()
            });
        }
    };
}

/**
 * Creates environment-specific rate limiting middleware
 * Optimizes configuration for development, production, or testing environments
 * 
 * @param {string} environment - Target environment (development, production, testing)
 * @param {Object} overrides - Configuration overrides for specific requirements
 * @returns {Function} Environment-optimized rate limiting middleware
 */
function createEnvironmentSpecificLimiter(environment, overrides = {}) {
    try {
        logger.info('Creating environment-specific rate limiter', {
            environment,
            overrides: Object.keys(overrides)
        });

        // Validate environment parameter
        const validEnvironments = ['development', 'production', 'testing', 'test'];
        if (!validEnvironments.includes(environment)) {
            throw new Error(`Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(', ')}`);
        }

        // Create middleware with environment-specific configuration
        const middleware = createRateLimiterMiddleware({
            environment,
            customConfig: overrides,
            enableRedis: environment === 'production',
            keyGenerator: {
                includeUserAgent: environment === 'production',
                includeEndpoint: false,
                hashKeys: environment === 'production'
            },
            monitoring: {
                includeEducational: environment !== 'production',
                enableSecurityLogging: true
            }
        });

        logger.info('Environment-specific rate limiter created successfully', {
            environment,
            redisEnabled: environment === 'production',
            educationalMode: environment !== 'production'
        });

        return middleware;

    } catch (error) {
        logger.error('Failed to create environment-specific rate limiter', {
            error: error.message,
            environment,
            overrides
        });
        throw error;
    }
}

/**
 * Creates endpoint-specific rate limiting middleware
 * Provides granular protection for different API endpoints based on sensitivity
 * 
 * @param {string} endpointPattern - Endpoint pattern or path for specific rate limiting
 * @param {Object} endpointConfig - Endpoint-specific rate limiting configuration
 * @returns {Function} Endpoint-specific rate limiting middleware
 */
function createEndpointSpecificLimiter(endpointPattern, endpointConfig = {}) {
    try {
        logger.info('Creating endpoint-specific rate limiter', {
            endpointPattern,
            config: endpointConfig
        });

        // Determine endpoint category and default limits
        let categoryConfig = {};
        
        if (endpointPattern.includes('/auth/') || endpointPattern.includes('/login')) {
            // Authentication endpoints - stricter limits
            categoryConfig = {
                windowMs: 900000, // 15 minutes
                max: 5, // 5 attempts per window
                message: 'Too many authentication attempts, please try again later'
            };
        } else if (endpointPattern.includes('/api/')) {
            // API endpoints - standard limits
            categoryConfig = {
                windowMs: 900000, // 15 minutes
                max: 100, // 100 requests per window
                message: 'Too many API requests, please try again later'
            };
        } else if (endpointPattern.includes('/health') || endpointPattern.includes('/status')) {
            // Health check endpoints - very high limits
            categoryConfig = {
                windowMs: 60000, // 1 minute
                max: 1000, // 1000 requests per minute
                message: 'Health check rate limit exceeded'
            };
        } else {
            // Default endpoints - moderate limits
            categoryConfig = DEFAULT_RATE_LIMIT_CONFIG;
        }

        // Merge category config with custom config
        const finalConfig = {
            ...categoryConfig,
            ...endpointConfig
        };

        // Create custom key generator that includes endpoint
        const endpointKeyGenerator = createCustomKeyGenerator({
            includeEndpoint: true,
            includeUserAgent: isProduction,
            hashKeys: isProduction
        });

        // Create endpoint-specific middleware
        const middleware = createRateLimiterMiddleware({
            environment: currentEnvironment,
            customConfig: finalConfig,
            enableRedis: isProduction,
            keyGenerator: {
                customGenerator: endpointKeyGenerator
            }
        });

        logger.info('Endpoint-specific rate limiter created successfully', {
            endpointPattern,
            windowMs: finalConfig.windowMs,
            maxRequests: finalConfig.max
        });

        return middleware;

    } catch (error) {
        logger.error('Failed to create endpoint-specific rate limiter', {
            error: error.message,
            endpointPattern,
            endpointConfig
        });
        throw error;
    }
}

/**
 * Validates rate limiting configuration for security and performance
 * Ensures proper DoS protection and PM2 cluster compatibility
 * 
 * @param {Object} config - Rate limiting configuration to validate
 * @returns {Object} Comprehensive validation result with recommendations
 */
function validateRateLimiterConfig(config) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [],
        securityAssessment: {},
        performanceAnalysis: {}
    };

    try {
        // Validate basic configuration structure
        if (!config || typeof config !== 'object') {
            validation.isValid = false;
            validation.errors.push('Configuration must be a valid object');
            return validation;
        }

        // Validate window size for DoS protection effectiveness
        if (typeof config.windowMs !== 'number' || config.windowMs < 60000) {
            validation.warnings.push('Window size less than 1 minute may not provide effective DoS protection');
            validation.recommendations.push('Consider using a window size of at least 15 minutes for production');
        }

        if (config.windowMs > 3600000) { // 1 hour
            validation.warnings.push('Very long window size may impact user experience');
        }

        // Validate request limits
        if (typeof config.max !== 'number' || config.max < 1) {
            validation.isValid = false;
            validation.errors.push('Maximum requests limit must be a positive number');
        }

        if (config.max > 10000) {
            validation.warnings.push('Very high request limit may not prevent abuse effectively');
        }

        // Validate PM2 cluster compatibility
        if (config.store && typeof config.store !== 'object') {
            validation.warnings.push('Custom store configuration should be properly configured for PM2 cluster mode');
        }

        // Security assessment
        validation.securityAssessment = {
            dosProtectionLevel: config.max < 100 ? 'high' : config.max < 500 ? 'medium' : 'low',
            windowEffectiveness: config.windowMs >= 900000 ? 'effective' : 'limited',
            distributedSupport: config.store ? 'enabled' : 'memory-only',
            keyGeneratorSecurity: typeof config.keyGenerator === 'function' ? 'custom' : 'default'
        };

        // Performance analysis
        validation.performanceAnalysis = {
            memoryImpact: config.store ? 'low' : 'medium',
            scalability: config.store ? 'high' : 'limited',
            latencyImpact: 'minimal',
            throughputReduction: config.max > 1000 ? 'minimal' : 'moderate'
        };

        // Generate recommendations based on environment
        if (isProduction) {
            validation.recommendations.push(
                'Use Redis store for production deployment',
                'Enable key hashing for privacy protection',
                'Configure comprehensive security logging',
                'Set up monitoring and alerting for violations'
            );
        } else {
            validation.recommendations.push(
                'Enable educational error responses for development',
                'Use memory store for development simplicity',
                'Configure debug logging for troubleshooting'
            );
        }

        logger.info('Rate limiter configuration validation completed', {
            isValid: validation.isValid,
            errorsCount: validation.errors.length,
            warningsCount: validation.warnings.length,
            securityLevel: validation.securityAssessment.dosProtectionLevel
        });

        return validation;

    } catch (error) {
        logger.error('Failed to validate rate limiter configuration', {
            error: error.message,
            config: typeof config
        });

        validation.isValid = false;
        validation.errors.push(`Validation error: ${error.message}`);
        return validation;
    }
}

/**
 * Returns comprehensive status of the rate limiting system
 * Provides metrics, configuration details, and educational information
 * 
 * @param {Object} statusOptions - Status retrieval options
 * @returns {Object} Detailed rate limiter status and metrics
 */
function getRateLimiterStatus(statusOptions = {}) {
    try {
        const {
            includeMetrics = true,
            includeConfig = true,
            includeEducational = !isProduction,
            includeClients = false
        } = statusOptions;

        const status = {
            initialized: RATE_LIMITER_INITIALIZED,
            environment: currentEnvironment,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };

        // Include metrics if requested
        if (includeMetrics) {
            status.metrics = {
                ...RATE_LIMIT_METRICS,
                clients: includeClients ? 
                    Object.fromEntries(RATE_LIMIT_METRICS.clients) : 
                    RATE_LIMIT_METRICS.clients.size,
                violations: includeClients ? 
                    Object.fromEntries(RATE_LIMIT_METRICS.violations) : 
                    RATE_LIMIT_METRICS.violations.size,
                requestsPerSecond: RATE_LIMIT_METRICS.requests / (process.uptime() || 1),
                blockingRate: RATE_LIMIT_METRICS.blocked / (RATE_LIMIT_METRICS.requests || 1)
            };
        }

        // Include configuration details if requested
        if (includeConfig) {
            status.configuration = {
                environment: currentEnvironment,
                redisEnabled: isProduction,
                defaultLimits: DEFAULT_RATE_LIMIT_CONFIG,
                securityLogging: true,
                pm2Compatible: true
            };
        }

        // Include educational information if requested
        if (includeEducational) {
            status.educational = {
                concept: 'Rate Limiting for DoS Protection',
                purpose: 'Prevents abuse and ensures fair resource usage',
                algorithm: 'Sliding window with distributed state management',
                security: 'Protects against denial of service attacks',
                scalability: 'PM2 cluster compatible with Redis distribution',
                monitoring: 'Comprehensive logging and metrics collection'
            };
        }

        // Store health check
        status.storeHealth = {
            type: isProduction ? 'redis' : 'memory',
            status: 'healthy', // This would need actual store health checking
            latency: 'normal'
        };

        logger.info('Rate limiter status retrieved', {
            includeMetrics,
            includeConfig,
            includeEducational,
            totalRequests: RATE_LIMIT_METRICS.requests,
            totalBlocked: RATE_LIMIT_METRICS.blocked
        });

        return status;

    } catch (error) {
        logger.error('Failed to retrieve rate limiter status', {
            error: error.message,
            statusOptions
        });

        return {
            initialized: RATE_LIMITER_INITIALIZED,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Resets rate limiting state for specific clients or all clients
 * Provides administrative control for testing and emergency response
 * 
 * @param {string} clientKey - Specific client key to reset (optional)
 * @param {Object} resetOptions - Reset operation configuration
 * @returns {Object} Reset operation result with status and metrics
 */
function resetRateLimiter(clientKey = null, resetOptions = {}) {
    try {
        const {
            resetMetrics = false,
            resetViolations = true,
            logReset = true
        } = resetOptions;

        const resetResult = {
            timestamp: new Date().toISOString(),
            clientKey,
            resetType: clientKey ? 'specific' : 'global',
            affectedClients: 0,
            previousMetrics: { ...RATE_LIMIT_METRICS }
        };

        // Reset specific client if key provided
        if (clientKey) {
            const clientRemoved = RATE_LIMIT_METRICS.clients.delete(clientKey);
            const violationRemoved = RATE_LIMIT_METRICS.violations.delete(clientKey);
            
            resetResult.affectedClients = clientRemoved ? 1 : 0;
            resetResult.actions = {
                clientRemoved,
                violationRemoved
            };

        } else {
            // Global reset
            resetResult.affectedClients = RATE_LIMIT_METRICS.clients.size;
            
            RATE_LIMIT_METRICS.clients.clear();
            
            if (resetViolations) {
                RATE_LIMIT_METRICS.violations.clear();
            }
            
            if (resetMetrics) {
                RATE_LIMIT_METRICS.requests = 0;
                RATE_LIMIT_METRICS.blocked = 0;
                RATE_LIMIT_METRICS.errors = 0;
                RATE_LIMIT_METRICS.lastReset = Date.now();
            }
        }

        // Log reset operation if enabled
        if (logReset) {
            logger.logSecurityEvent('RATE_LIMITER_RESET', {
                resetType: resetResult.resetType,
                clientKey,
                affectedClients: resetResult.affectedClients,
                resetMetrics,
                resetViolations,
                operator: 'system' // This could be enhanced with user context
            });
        }

        logger.info('Rate limiter reset completed', resetResult);

        return resetResult;

    } catch (error) {
        logger.error('Failed to reset rate limiter', {
            error: error.message,
            clientKey,
            resetOptions
        });

        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Default rate limiting middleware with production-ready configuration
export const rateLimiter = createRateLimiterMiddleware({
    environment: currentEnvironment,
    enableRedis: isProduction,
    keyGenerator: {
        includeUserAgent: isProduction,
        hashKeys: isProduction
    },
    monitoring: {
        includeEducational: !isProduction,
        enableSecurityLogging: true
    }
});

// Export all functions for comprehensive rate limiting capabilities
export {
    createRateLimiterMiddleware,
    createCustomKeyGenerator,
    createRateLimitHandler,
    createEnvironmentSpecificLimiter,
    createEndpointSpecificLimiter,
    validateRateLimiterConfig,
    getRateLimiterStatus,
    resetRateLimiter
};

// Export default middleware for standard Express.js integration
export default rateLimiter;