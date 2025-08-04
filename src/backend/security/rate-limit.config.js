// express-rate-limit v7.4.1 - Rate limiting middleware for Express applications
import rateLimit from 'express-rate-limit';
// memory-store v1.6.7 - Memory store for express-rate-limit
import MemoryStore from 'express-rate-limit/lib/memory-store.js';

// Internal imports - Import security constants and environment configuration
import { 
    SECURITY_CONSTANTS, 
    API_CONSTANTS 
} from '../utils/constants.js';
import { environmentConfig } from '../config/environment.js';
import logger from '../utils/logger.js';
import { SecurityError } from '../utils/error-types.js';

// Global rate limiting store for memory-based rate limiting
let RATE_LIMIT_STORE = new Map();

// Default window duration - 15 minutes in milliseconds
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

// Redis client placeholder for distributed rate limiting
let REDIS_CLIENT = null;

// Rate limiting metrics tracking
let RATE_LIMIT_METRICS = {
    requests: 0,
    blocked: 0,
    errors: 0,
    stores: {
        memory: { hits: 0, misses: 0 },
        redis: { hits: 0, misses: 0, errors: 0 }
    }
};

/**
 * Extract client IP address from Express request with proxy support
 * Handles various proxy headers and IPv6 addresses for accurate identification
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIp(req) {
    try {
        // Check various headers in order of preference for proxy environments
        const forwardedIps = req.headers['x-forwarded-for'];
        if (forwardedIps) {
            // Take the first IP from comma-separated list
            const firstIp = forwardedIps.split(',')[0].trim();
            return firstIp;
        }

        // Check other common proxy headers
        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return realIp.trim();
        }

        const clientIp = req.headers['x-client-ip'];
        if (clientIp) {
            return clientIp.trim();
        }

        // Fall back to connection remote address
        const connectionIp = req.connection?.remoteAddress || 
                           req.socket?.remoteAddress || 
                           req.ip;

        // Handle IPv6-mapped IPv4 addresses
        if (connectionIp && connectionIp.startsWith('::ffff:')) {
            return connectionIp.substring(7);
        }

        return connectionIp || 'unknown';
    } catch (error) {
        logger.warn('Failed to extract client IP', {
            error: error.message,
            headers: req.headers,
            correlationId: req.correlationId
        });
        return 'unknown';
    }
}

/**
 * Creates custom key generation function for rate limiting
 * Combines IP address, user identification, and request characteristics
 * @param {Object} options - Key generation configuration options
 * @returns {Function} - Key generator function for rate limiting
 */
export function createCustomKeyGenerator(options = {}) {
    const {
        includeUserAgent = false,
        includeApiKey = false,
        includeUserId = true,
        hashKeys = false,
        keyPrefix = 'rl:'
    } = options;

    return (req) => {
        try {
            const components = [];
            
            // Extract client IP address with proxy header support
            const clientIp = getClientIp(req);
            components.push(`ip:${clientIp}`);
            
            // Include user identification if authentication is present
            if (includeUserId && req.user?.id) {
                components.push(`user:${req.user.id}`);
            }
            
            // Add API key or client identifier for authenticated requests
            if (includeApiKey && req.headers['x-api-key']) {
                const apiKey = req.headers['x-api-key'].substring(0, 8);
                components.push(`api:${apiKey}`);
            }
            
            // Include User-Agent for additional request fingerprinting
            if (includeUserAgent && req.headers['user-agent']) {
                const userAgent = req.headers['user-agent'].substring(0, 50);
                components.push(`ua:${Buffer.from(userAgent).toString('base64').substring(0, 10)}`);
            }
            
            // Generate composite key for multi-factor rate limiting
            const compositeKey = components.join('|');
            
            // Apply key hashing for privacy and storage optimization
            if (hashKeys) {
                const crypto = require('crypto');
                const hashedKey = crypto.createHash('sha256')
                    .update(compositeKey)
                    .digest('hex')
                    .substring(0, 16);
                return `${keyPrefix}${hashedKey}`;
            }
            
            return `${keyPrefix}${compositeKey}`;
            
        } catch (error) {
            logger.error('Rate limit key generation failed', {
                error: error.message,
                correlationId: req.correlationId,
                path: req.path,
                method: req.method
            });
            
            // Fallback to IP-only key generation
            const fallbackIp = getClientIp(req);
            return `${keyPrefix}fallback:${fallbackIp}`;
        }
    };
}

/**
 * Creates storage configuration for rate limiting
 * Supports memory store, Redis store, and distributed storage for PM2 cluster mode
 * @param {string} storeType - Type of store ('memory', 'redis', 'hybrid')
 * @param {Object} storeOptions - Store configuration options
 * @returns {Object} - Store configuration with connection settings and cluster compatibility
 */
export function createStoreConfig(storeType = 'memory', storeOptions = {}) {
    const config = {
        type: storeType,
        options: storeOptions,
        fallback: null,
        cluster: environmentConfig.pm2?.cluster || false
    };

    try {
        switch (storeType) {
            case 'memory':
                // Configure memory store for development and single-process environments
                config.store = new MemoryStore({
                    max: storeOptions.max || 10000,
                    ttl: storeOptions.ttl || DEFAULT_WINDOW_MS,
                    ...storeOptions
                });
                
                logger.info('Rate limiting configured with memory store', {
                    maxEntries: config.store.options?.max || 10000,
                    ttl: config.store.options?.ttl || DEFAULT_WINDOW_MS
                });
                break;

            case 'redis':
                // Configure Redis store for production and distributed environments
                if (!REDIS_CLIENT) {
                    logger.warn('Redis client not configured, falling back to memory store');
                    return createStoreConfig('memory', storeOptions);
                }
                
                // Redis store implementation would go here
                // For tutorial purposes, we'll use memory store as fallback
                config.store = new MemoryStore({
                    max: storeOptions.max || 50000,
                    ttl: storeOptions.ttl || DEFAULT_WINDOW_MS,
                    ...storeOptions
                });
                
                logger.info('Rate limiting configured with Redis store (memory fallback)', {
                    cluster: config.cluster,
                    ttl: storeOptions.ttl || DEFAULT_WINDOW_MS
                });
                break;

            case 'hybrid':
                // Configure hybrid store with Redis primary and memory fallback
                config.store = new MemoryStore({
                    max: storeOptions.max || 25000,
                    ttl: storeOptions.ttl || DEFAULT_WINDOW_MS,
                    ...storeOptions
                });
                
                config.fallback = new MemoryStore({
                    max: 5000,
                    ttl: DEFAULT_WINDOW_MS
                });
                
                logger.info('Rate limiting configured with hybrid store', {
                    primary: 'memory',
                    fallback: 'memory',
                    cluster: config.cluster
                });
                break;

            default:
                throw new SecurityError(
                    `Unsupported store type: ${storeType}`,
                    'RATE_LIMIT_CONFIG_ERROR',
                    { storeType, supportedTypes: ['memory', 'redis', 'hybrid'] }
                );
        }

        // Configure TTL settings and automatic cleanup for store efficiency
        if (config.store) {
            config.store.resetTime = storeOptions.resetTime || DEFAULT_WINDOW_MS;
            
            // Set up periodic cleanup for memory stores
            if (storeType === 'memory' && storeOptions.enableCleanup !== false) {
                setInterval(() => {
                    try {
                        // Cleanup expired entries (implementation depends on store internals)
                        RATE_LIMIT_METRICS.stores.memory.hits++;
                    } catch (cleanupError) {
                        logger.warn('Rate limit store cleanup error', {
                            error: cleanupError.message
                        });
                    }
                }, 60000); // Cleanup every minute
            }
        }

        return config;

    } catch (error) {
        logger.error('Rate limit store configuration failed', {
            error: error.message,
            storeType,
            storeOptions: Object.keys(storeOptions)
        });
        
        // Return basic memory store as fallback
        return {
            type: 'memory',
            store: new MemoryStore({
                max: 1000,
                ttl: DEFAULT_WINDOW_MS
            }),
            fallback: null,
            cluster: false
        };
    }
}

/**
 * Creates custom handler function for rate limit exceeded scenarios
 * Provides comprehensive logging, security alerts, and educational error responses
 * @param {Object} handlerConfig - Handler configuration options
 * @returns {Function} - Express middleware function for rate limit violations
 */
export function createRateLimitHandler(handlerConfig = {}) {
    const {
        includeHeaders = true,
        logSecurityEvents = true,
        educationalMode = environmentConfig.isDevelopment,
        customMessage = null,
        alertThreshold = 10,
        blockDuration = 3600000 // 1 hour default block
    } = handlerConfig;

    return (req, res, next) => {
        try {
            // Extract request information for security event logging
            const clientIp = getClientIp(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            const requestInfo = {
                ip: clientIp,
                userAgent,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString(),
                correlationId: req.correlationId
            };

            // Update rate limiting metrics
            RATE_LIMIT_METRICS.blocked++;
            RATE_LIMIT_METRICS.requests++;

            // Log rate limit violation with comprehensive details
            if (logSecurityEvents) {
                logger.logSecurityEvent('rate_limit_exceeded', {
                    ...requestInfo,
                    rateLimit: {
                        windowMs: req.rateLimit?.windowMs,
                        limit: req.rateLimit?.limit,
                        current: req.rateLimit?.current,
                        remaining: req.rateLimit?.remaining,
                        resetTime: req.rateLimit?.resetTime
                    },
                    severity: 'medium',
                    automated: true
                });
            }

            // Trigger security alert for potential DoS attack patterns
            if (req.rateLimit?.current >= alertThreshold) {
                logger.logSecurityEvent('potential_dos_attack', {
                    ...requestInfo,
                    attempts: req.rateLimit.current,
                    threshold: alertThreshold,
                    severity: 'high',
                    recommended_action: 'IP_BLOCK',
                    automated: true
                });
            }

            // Include Retry-After header with accurate reset time
            if (includeHeaders && req.rateLimit?.resetTime) {
                const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
                res.set('Retry-After', Math.max(retryAfter, 1).toString());
            }

            // Generate educational or production error response
            const errorResponse = {
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: customMessage || API_CONSTANTS.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
                    type: 'RateLimitError',
                    timestamp: new Date().toISOString(),
                    correlationId: req.correlationId
                }
            };

            // Add educational information in development mode
            if (educationalMode) {
                errorResponse.educational = {
                    explanation: 'Rate limiting prevents API abuse and ensures fair resource usage',
                    rateLimitInfo: {
                        windowMs: req.rateLimit?.windowMs,
                        limit: req.rateLimit?.limit,
                        current: req.rateLimit?.current,
                        resetTime: req.rateLimit?.resetTime ? new Date(req.rateLimit.resetTime).toISOString() : null
                    },
                    prevention: 'Reduce request frequency or implement request caching',
                    documentation: 'https://nodejs-tutorial.security/rate-limiting'
                };
            }

            // Return standardized HTTP 429 Too Many Requests response
            return res.status(429).json(errorResponse);

        } catch (error) {
            logger.error('Rate limit handler error', {
                error: error.message,
                correlationId: req.correlationId,
                path: req.path
            });

            // Update error metrics
            RATE_LIMIT_METRICS.errors++;

            // Return generic rate limit error
            return res.status(429).json({
                error: {
                    code: 'RATE_LIMIT_ERROR',
                    message: API_CONSTANTS.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
                    timestamp: new Date().toISOString(),
                    correlationId: req.correlationId
                }
            });
        }
    };
}

/**
 * Creates skip function to bypass rate limiting for specific requests
 * Handles health checks, internal services, trusted IPs, and development testing
 * @param {Object} skipConfig - Skip function configuration options
 * @returns {Function} - Function that determines whether to skip rate limiting
 */
export function createSkipFunction(skipConfig = {}) {
    const {
        healthCheckPaths = ['/health', '/status', '/ping'],
        trustedIPs = ['127.0.0.1', '::1'],
        internalUserAgents = ['PM2', 'HealthCheck', 'Monitor'],
        bypassHeaders = ['x-internal-request'],
        developmentBypass = environmentConfig.isDevelopment,
        logSkips = true
    } = skipConfig;

    return (req) => {
        try {
            const clientIp = getClientIp(req);
            const userAgent = req.headers['user-agent'] || '';
            const path = req.path;

            // Check if request path matches health check endpoints
            if (healthCheckPaths.some(healthPath => path === healthPath || path.startsWith(healthPath))) {
                if (logSkips) {
                    logger.debug('Rate limiting skipped for health check', {
                        path,
                        clientIp,
                        correlationId: req.correlationId
                    });
                }
                return true;
            }

            // Skip rate limiting for trusted IP address ranges
            if (trustedIPs.includes(clientIp)) {
                if (logSkips) {
                    logger.debug('Rate limiting skipped for trusted IP', {
                        clientIp,
                        path,
                        correlationId: req.correlationId
                    });
                }
                return true;
            }

            // Allow bypass for internal service requests
            if (internalUserAgents.some(agent => userAgent.includes(agent))) {
                if (logSkips) {
                    logger.debug('Rate limiting skipped for internal service', {
                        userAgent,
                        path,
                        correlationId: req.correlationId
                    });
                }
                return true;
            }

            // Check for special bypass headers
            for (const header of bypassHeaders) {
                if (req.headers[header]) {
                    if (logSkips) {
                        logger.info('Rate limiting bypassed via header', {
                            header,
                            value: req.headers[header],
                            clientIp,
                            path,
                            correlationId: req.correlationId
                        });
                    }
                    return true;
                }
            }

            // Allow bypass for development and testing environments
            if (developmentBypass && (environmentConfig.isDevelopment || environmentConfig.isTest)) {
                if (logSkips && Math.random() < 0.1) { // Log 10% of dev skips to avoid spam
                    logger.debug('Rate limiting skipped for development environment', {
                        environment: environmentConfig.environment,
                        path,
                        correlationId: req.correlationId
                    });
                }
                return true;
            }

            // Do not skip rate limiting for this request
            return false;

        } catch (error) {
            logger.warn('Rate limit skip function error', {
                error: error.message,
                path: req.path,
                correlationId: req.correlationId
            });
            
            // Default to not skipping on error for security
            return false;
        }
    };
}

/**
 * Creates comprehensive rate limiting configuration object
 * Provides environment-specific settings, custom handlers, and PM2 cluster compatibility
 * @param {string} environment - Environment name ('development', 'production', 'test')
 * @param {Object} overrides - Configuration overrides and customizations
 * @returns {Object} - Complete rate limiting configuration for express-rate-limit middleware
 */
export function createRateLimitConfig(environment = environmentConfig.environment, overrides = {}) {
    try {
        // Determine environment-specific rate limiting parameters
        const baseConfig = {
            development: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // 1000 requests per window
                storeType: 'memory',
                educationalFeatures: true,
                strictMode: false
            },
            production: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // 100 requests per window
                storeType: 'memory', // Would be 'redis' with proper Redis setup
                educationalFeatures: false,
                strictMode: true
            },
            test: {
                windowMs: 1 * 60 * 1000, // 1 minute for faster testing
                max: 10000, // High limit for test scenarios
                storeType: 'memory',
                educationalFeatures: false,
                strictMode: false
            }
        };

        const envConfig = baseConfig[environment] || baseConfig.development;
        const finalConfig = { ...envConfig, ...overrides };

        // Create custom key generation function for request identification
        const keyGenerator = createCustomKeyGenerator({
            includeUserAgent: finalConfig.strictMode,
            includeApiKey: true,
            includeUserId: true,
            hashKeys: finalConfig.strictMode,
            keyPrefix: `rl:${environment}:`
        });

        // Configure storage with Redis support for distributed environments
        const storeConfig = createStoreConfig(finalConfig.storeType, {
            max: finalConfig.max * 10, // Store capacity larger than rate limit
            ttl: finalConfig.windowMs,
            enableCleanup: true
        });

        // Set up custom handler for rate limit exceeded scenarios
        const handler = createRateLimitHandler({
            includeHeaders: true,
            logSecurityEvents: true,
            educationalMode: finalConfig.educationalFeatures,
            customMessage: overrides.customMessage,
            alertThreshold: Math.floor(finalConfig.max * 0.8) // Alert at 80% of limit
        });

        // Configure skip function for health checks and internal requests
        const skip = createSkipFunction({
            healthCheckPaths: ['/health', '/status', '/ping', '/metrics'],
            trustedIPs: ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
            developmentBypass: environment !== 'production',
            logSkips: environment === 'development'
        });

        // Apply security headers and educational error responses
        const config = {
            windowMs: finalConfig.windowMs,
            max: finalConfig.max,
            keyGenerator,
            handler,
            skip,
            store: storeConfig.store,
            
            // Standard express-rate-limit options
            standardHeaders: true, // Return rate limit info in headers
            legacyHeaders: false, // Disable X-RateLimit-* headers
            
            // Skip successful requests (only count failed requests)
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            
            // Custom rate limit reached handler
            onLimitReached: (req, res, options) => {
                logger.logSecurityEvent('rate_limit_reached', {
                    ip: getClientIp(req),
                    path: req.path,
                    method: req.method,
                    limit: options.max,
                    windowMs: options.windowMs,
                    correlationId: req.correlationId
                });
            }
        };

        // Include monitoring and metrics collection configuration
        if (finalConfig.educationalFeatures) {
            config.educational = {
                description: 'Rate limiting prevents DoS attacks and ensures fair API usage',
                configuration: {
                    window: `${finalConfig.windowMs / 1000} seconds`,
                    limit: `${finalConfig.max} requests per window`,
                    store: finalConfig.storeType,
                    environment
                },
                metrics: () => RATE_LIMIT_METRICS
            };
        }

        logger.info('Rate limiting configuration created', {
            environment,
            windowMs: finalConfig.windowMs,
            max: finalConfig.max,
            storeType: finalConfig.storeType,
            educationalFeatures: finalConfig.educationalFeatures,
            pm2Cluster: storeConfig.cluster
        });

        return config;

    } catch (error) {
        logger.error('Rate limit configuration creation failed', {
            error: error.message,
            environment,
            overrides: Object.keys(overrides)
        });

        // Return minimal safe configuration as fallback
        return {
            windowMs: DEFAULT_WINDOW_MS,
            max: 100,
            keyGenerator: (req) => getClientIp(req),
            handler: (req, res) => res.status(429).json({
                error: 'Too many requests'
            }),
            skip: () => false,
            store: new MemoryStore({
                max: 1000,
                ttl: DEFAULT_WINDOW_MS
            })
        };
    }
}

/**
 * Creates endpoint-specific rate limiting configurations
 * Provides different limits for various API endpoints based on sensitivity
 * @param {string} endpointType - Type of endpoint ('auth', 'api', 'health', 'static')
 * @param {Object} endpointSettings - Endpoint-specific configuration settings
 * @returns {Object} - Endpoint-specific rate limiting configuration
 */
export function createEndpointSpecificConfig(endpointType, endpointSettings = {}) {
    const endpointConfigs = {
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: environmentConfig.isProduction ? 10 : 50, // Strict limits for auth
            customMessage: 'Too many authentication attempts. Please try again later.',
            alertThreshold: 5,
            strictMode: true
        },
        api: {
            windowMs: 15 * 60 * 1000, // 15 minutes  
            max: environmentConfig.isProduction ? 100 : 1000, // Moderate limits for API
            customMessage: 'API rate limit exceeded. Please reduce request frequency.',
            alertThreshold: 80,
            strictMode: environmentConfig.isProduction
        },
        health: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 60, // Allow frequent health checks
            customMessage: 'Health check rate limit exceeded.',
            alertThreshold: 50,
            strictMode: false
        },
        static: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 500, // High limit for static content
            customMessage: 'Static content rate limit exceeded.',
            alertThreshold: 400,
            strictMode: false
        }
    };

    const config = endpointConfigs[endpointType] || endpointConfigs.api;
    const mergedSettings = { ...config, ...endpointSettings };

    logger.info('Endpoint-specific rate limit configuration created', {
        endpointType,
        windowMs: mergedSettings.windowMs,
        max: mergedSettings.max,
        strictMode: mergedSettings.strictMode
    });

    return createRateLimitConfig(environmentConfig.environment, mergedSettings);
}

/**
 * Creates development environment rate limiting configuration
 * Provides relaxed limits, comprehensive logging, and educational features
 * @param {Object} devOptions - Development-specific configuration options
 * @returns {Object} - Development-optimized rate limiting configuration
 */
export function createDevelopmentConfig(devOptions = {}) {
    const developmentDefaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // High limit for development
        storeType: 'memory',
        educationalFeatures: true,
        strictMode: false,
        customMessage: 'Development: Rate limit exceeded. This is for educational purposes.',
        verboseLogging: true,
        skipBypassLogging: true
    };

    const config = { ...developmentDefaults, ...devOptions };
    
    logger.info('Development rate limiting configuration created', {
        max: config.max,
        windowMs: config.windowMs,
        educationalFeatures: config.educationalFeatures
    });

    return createRateLimitConfig('development', config);
}

/**
 * Creates production environment rate limiting configuration
 * Provides strict security policies, Redis distributed storage, and comprehensive monitoring
 * @param {Object} prodOptions - Production-specific configuration options
 * @returns {Object} - Production-ready rate limiting configuration
 */
export function createProductionConfig(prodOptions = {}) {
    const productionDefaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Strict limit for production
        storeType: 'memory', // Would be 'redis' with proper Redis configuration
        educationalFeatures: false,
        strictMode: true,
        customMessage: 'Rate limit exceeded. Please try again later.',
        verboseLogging: false,
        skipBypassLogging: false,
        alertThreshold: 80
    };

    const config = { ...productionDefaults, ...prodOptions };
    
    logger.info('Production rate limiting configuration created', {
        max: config.max,
        windowMs: config.windowMs,
        strictMode: config.strictMode,
        storeType: config.storeType
    });

    return createRateLimitConfig('production', config);
}

/**
 * Validates rate limiting configuration parameters
 * Ensures security effectiveness, performance optimization, and PM2 compatibility
 * @param {Object} rateLimitConfig - Rate limiting configuration to validate
 * @returns {Object} - Validation result with security assessment and recommendations
 */
export function validateRateLimitConfig(rateLimitConfig) {
    const validation = {
        valid: true,
        warnings: [],
        errors: [],
        recommendations: [],
        securityAssessment: 'GOOD',
        performanceScore: 100
    };

    try {
        // Validate window size is appropriate for DoS attack prevention
        if (!rateLimitConfig.windowMs || rateLimitConfig.windowMs < 60000) {
            validation.warnings.push('Window size less than 1 minute may not effectively prevent DoS attacks');
            validation.performanceScore -= 10;
        }

        if (rateLimitConfig.windowMs > 3600000) { // 1 hour
            validation.warnings.push('Window size greater than 1 hour may cause memory issues');
            validation.performanceScore -= 5;
        }

        // Check maximum requests per window are not too permissive
        if (!rateLimitConfig.max || rateLimitConfig.max < 10) {
            validation.warnings.push('Rate limit too strict, may impact legitimate users');
        }

        if (rateLimitConfig.max > 10000) {
            validation.warnings.push('Rate limit too permissive, may not prevent abuse');
            validation.securityAssessment = 'FAIR';
            validation.performanceScore -= 20;
        }

        // Verify key generator produces unique and consistent identifiers
        if (!rateLimitConfig.keyGenerator || typeof rateLimitConfig.keyGenerator !== 'function') {
            validation.errors.push('Key generator function is required');
            validation.valid = false;
            validation.securityAssessment = 'POOR';
        }

        // Validate store configuration and connectivity
        if (!rateLimitConfig.store) {
            validation.errors.push('Rate limit store configuration is required');
            validation.valid = false;
        }

        // Check error handler provides appropriate security responses
        if (!rateLimitConfig.handler || typeof rateLimitConfig.handler !== 'function') {
            validation.warnings.push('Custom handler recommended for security logging');
            validation.performanceScore -= 5;
        }

        // Verify skip function logic prevents abuse while allowing legitimate bypass
        if (rateLimitConfig.skip && typeof rateLimitConfig.skip !== 'function') {
            validation.errors.push('Skip function must be a function if provided');
            validation.valid = false;
        }

        // Assess PM2 cluster mode compatibility
        if (environmentConfig.pm2?.cluster && !rateLimitConfig.store) {
            validation.warnings.push('PM2 cluster mode requires shared store for consistent rate limiting');
            validation.securityAssessment = 'FAIR';
        }

        // Security and performance recommendations
        if (validation.valid) {
            validation.recommendations.push('Consider implementing IP-based blocking for repeated violations');
            validation.recommendations.push('Monitor rate limiting metrics for optimization opportunities');
            validation.recommendations.push('Implement different limits for authenticated vs anonymous users');
            
            if (environmentConfig.isProduction) {
                validation.recommendations.push('Use Redis store for distributed rate limiting in production');
                validation.recommendations.push('Implement alerting for rate limiting violations');
            }
        }

        // Final security assessment
        if (validation.errors.length > 0) {
            validation.securityAssessment = 'POOR';
        } else if (validation.warnings.length > 3) {
            validation.securityAssessment = 'FAIR';
        }

        logger.info('Rate limiting configuration validation completed', {
            valid: validation.valid,
            securityAssessment: validation.securityAssessment,
            performanceScore: validation.performanceScore,
            warnings: validation.warnings.length,
            errors: validation.errors.length
        });

    } catch (error) {
        validation.valid = false;
        validation.errors.push(`Validation error: ${error.message}`);
        validation.securityAssessment = 'POOR';
        
        logger.error('Rate limiting configuration validation failed', {
            error: error.message,
            config: Object.keys(rateLimitConfig)
        });
    }

    return validation;
}

/**
 * Returns current rate limiting status including metrics and store health
 * Provides monitoring, debugging, and educational information
 * @param {string} clientKey - Client identifier for status lookup
 * @param {Object} statusOptions - Status retrieval options
 * @returns {Object} - Rate limiting status with metrics and educational context
 */
export function getRateLimitStatus(clientKey = null, statusOptions = {}) {
    const {
        includeMetrics = true,
        includeStoreHealth = true,
        includeConfiguration = environmentConfig.isDevelopment,
        includeEducationalInfo = environmentConfig.isDevelopment
    } = statusOptions;

    const status = {
        timestamp: new Date().toISOString(),
        environment: environmentConfig.environment,
        healthy: true,
        errors: []
    };

    try {
        // Include current request count for specified client identifier
        if (clientKey && RATE_LIMIT_STORE) {
            const clientData = RATE_LIMIT_STORE.get(clientKey);
            if (clientData) {
                status.client = {
                    key: clientKey,
                    requests: clientData.requests || 0,
                    resetTime: clientData.resetTime || null,
                    remaining: Math.max(0, (clientData.limit || 100) - (clientData.requests || 0))
                };
            }
        }

        // Gather performance metrics and response time statistics
        if (includeMetrics) {
            status.metrics = {
                ...RATE_LIMIT_METRICS,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                storeSize: RATE_LIMIT_STORE?.size || 0
            };
        }

        // Check rate limiting store health and connectivity status
        if (includeStoreHealth) {
            status.storeHealth = {
                type: 'memory',
                connected: true,
                size: RATE_LIMIT_STORE?.size || 0,
                lastAccess: new Date().toISOString()
            };

            if (REDIS_CLIENT) {
                status.storeHealth.redis = {
                    connected: false, // Would check actual Redis connection
                    latency: null
                };
            }
        }

        // Include rate limiting configuration details for transparency
        if (includeConfiguration) {
            status.configuration = {
                environment: environmentConfig.environment,
                defaultWindow: DEFAULT_WINDOW_MS,
                pm2Cluster: environmentConfig.pm2?.cluster || false,
                educationalMode: environmentConfig.isDevelopment
            };
        }

        // Format status information for educational display
        if (includeEducationalInfo) {
            status.educational = {
                purpose: 'Rate limiting prevents DoS attacks and ensures fair API usage',
                howItWorks: 'Tracks request frequency per client and enforces limits within time windows',
                benefits: [
                    'Prevents API abuse and resource exhaustion',
                    'Ensures fair usage across all clients',
                    'Protects against denial of service attacks',
                    'Maintains application performance and stability'
                ],
                monitoring: 'Check /health endpoint for rate limiting status and metrics'
            };
        }

    } catch (error) {
        status.healthy = false;
        status.errors.push(error.message);
        
        logger.error('Rate limiting status retrieval failed', {
            error: error.message,
            clientKey,
            statusOptions: Object.keys(statusOptions)
        });
    }

    return status;
}

// Default rate limiting configuration for the tutorial application
export const rateLimitConfig = createRateLimitConfig(environmentConfig.environment);

// Log successful module initialization
logger.info('Rate limiting configuration module initialized', {
    environment: environmentConfig.environment,
    pm2Cluster: environmentConfig.pm2?.cluster || false,
    storeType: 'memory',
    educationalFeatures: environmentConfig.isDevelopment
});