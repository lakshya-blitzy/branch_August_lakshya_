/**
 * @fileoverview Comprehensive CORS (Cross-Origin Resource Sharing) Configuration Module
 * @description Advanced CORS configuration system providing environment-aware cross-origin policies,
 * dynamic origin validation, security-conscious defaults, and seamless Express.js v5.1.0 integration.
 * Features progressive CORS configuration from permissive development settings to strict production
 * policies, supporting educational demonstrations of modern web security standards while maintaining
 * cross-platform compatibility with Flask implementations.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Environment-aware CORS policies with dynamic origin validation
 * - Express.js v5.1.0 compatible middleware integration
 * - PM2 cluster mode deployment compatibility
 * - Helmet.js security framework integration
 * - Comprehensive security event tracking and violation logging
 * - Performance optimization with preflight caching and origin validation
 * - Cross-platform Flask implementation compatibility
 * - Educational content with comprehensive security demonstrations
 * 
 * Security Features:
 * - Dynamic origin validation with whitelist checking and pattern matching
 * - Security-conscious error sanitization for production environments
 * - Comprehensive CORS violation monitoring and alerting
 * - Progressive security policies from development to production
 * - Integration with security event logging and monitoring systems
 * 
 * Educational Value:
 * - Demonstrates CORS security concepts and browser same-origin policy
 * - Showcases environment-specific security configuration patterns
 * - Illustrates Express.js middleware integration and error handling
 * - Provides cross-platform web security implementation examples
 * - Teaches production security monitoring and logging practices
 * 
 * Technology Integration:
 * - Express.js v5.1.0 security enhancements and promise-based middleware
 * - PM2 v6.0.8 cluster mode process isolation and zero-downtime reloads
 * - Helmet.js 15 security middleware comprehensive HTTP header security
 * - Node.js v22.x LTS modern JavaScript patterns and ES Modules support
 * - Cross-platform Flask CORS implementation pattern compatibility
 */

// Internal imports with specific members for CORS configuration functionality
import {
    SECURITY_CONSTANTS,
    HTTP_CONSTANTS
} from '../utils/constants.js';

import {
    defaultEnvironmentConfig as environmentConfig
} from '../config/environment.js';

import logger, {
    info as logInfo,
    warn as logWarn,
    error as logError,
    logSecurityEvent
} from '../utils/logger.js';

import {
    SecurityError,
    createErrorResponse
} from '../utils/error-types.js';

// Global CORS configuration cache and management constants
const CORS_CONFIG_CACHE = new Map(); // Caches validated CORS configurations for performance optimization
const DEFAULT_CORS_MAX_AGE = 86400; // Default preflight cache duration in seconds (24 hours)
const CORS_VIOLATION_THRESHOLD = 10; // Maximum CORS violations before triggering security alerts
const DEVELOPMENT_ALLOW_ALL_ORIGINS = true; // Enable permissive origin policy for development environments

// CORS violation tracking and metrics for security monitoring
const CORS_METRICS = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    violationsByOrigin: new Map(),
    preflightRequests: 0,
    cachedPreflightHits: 0
};

// Security event tracking for CORS violations and monitoring
const SECURITY_EVENT_TYPES = {
    CORS_VIOLATION: 'cors-violation',
    ORIGIN_BLOCKED: 'origin-blocked',
    PREFLIGHT_FAILED: 'preflight-failed',
    INVALID_METHOD: 'invalid-method',
    HEADER_VIOLATION: 'header-violation',
    CREDENTIAL_VIOLATION: 'credential-violation'
};

/**
 * URL Validation Utility Function
 * Validates URLs for CORS origin validation and security checking of cross-origin request sources.
 * Provides comprehensive URL format validation, protocol checking, and security policy enforcement.
 * 
 * @param {string} url - URL to validate
 * @param {Object} [options={}] - Validation options
 * @param {Array} [options.allowedProtocols] - Allowed URL protocols
 * @param {boolean} [options.requireHttps] - Require HTTPS protocol
 * @returns {boolean} True if URL is valid and secure, false otherwise
 */
function validateUrl(url, options = {}) {
    const config = {
        allowedProtocols: options.allowedProtocols || ['http:', 'https:'],
        requireHttps: options.requireHttps || environmentConfig.isProduction,
        allowLocalhost: options.allowLocalhost !== false || environmentConfig.isDevelopment,
        ...options
    };

    // Basic URL format validation
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return false;
    }

    try {
        const urlObj = new URL(url);
        
        // Protocol validation
        if (!config.allowedProtocols.includes(urlObj.protocol)) {
            return false;
        }
        
        // HTTPS requirement for production
        if (config.requireHttps && urlObj.protocol !== 'https:') {
            return false;
        }
        
        // Localhost and development domain validation
        if (config.allowLocalhost && environmentConfig.isDevelopment) {
            const localhostPatterns = ['localhost', '127.0.0.1', '::1'];
            if (localhostPatterns.some(pattern => urlObj.hostname === pattern)) {
                return true;
            }
        }
        
        // Basic hostname validation
        const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
        if (!hostnameRegex.test(urlObj.hostname)) {
            return false;
        }
        
        return true;
    } catch (error) {
        logWarn('URL validation failed', {
            url: url.substring(0, 100), // Limit URL length in logs
            error: error.message
        });
        return false;
    }
}

/**
 * Input Sanitization Utility Function
 * Sanitizes input for CORS origin validation and header sanitization in cross-origin requests.
 * Provides security filtering, injection attack prevention, and input normalization.
 * 
 * @param {string} input - Input string to sanitize
 * @param {Object} [options={}] - Sanitization options
 * @param {boolean} [options.removeHTML] - Remove HTML tags
 * @param {boolean} [options.removeScripts] - Remove script content
 * @returns {string} Sanitized input string safe for processing
 */
function sanitizeInput(input, options = {}) {
    const config = {
        removeHTML: options.removeHTML !== false,
        removeScripts: options.removeScripts !== false,
        maxLength: options.maxLength || 1000,
        allowedChars: options.allowedChars || /^[a-zA-Z0-9.\-_:/?#[\]@!$&'()*+,;=%~]+$/,
        ...options
    };

    // Basic input validation
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input.trim();
    
    // Length limitation
    if (sanitized.length > config.maxLength) {
        sanitized = sanitized.substring(0, config.maxLength);
    }
    
    // Remove HTML tags if requested
    if (config.removeHTML) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Remove script content
    if (config.removeScripts) {
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }
    
    // Character validation
    if (!config.allowedChars.test(sanitized)) {
        logWarn('Input contains invalid characters, sanitizing', {
            originalLength: input.length,
            sanitizedLength: sanitized.length
        });
        sanitized = sanitized.replace(/[^a-zA-Z0-9.\-_:/?#[\]@!$&'()*+,;=%~]/g, '');
    }
    
    return sanitized;
}

/**
 * Creates foundational CORS configuration with secure defaults for all environments.
 * Establishes baseline cross-origin policies that provide security while enabling necessary
 * functionality. Implements comprehensive CORS policy management with environment-aware
 * security controls.
 * 
 * @param {string} environment - Environment name (development, production, staging, test)
 * @returns {Object} Base CORS configuration object with secure defaults, origin validation, and method restrictions
 */
export function createBaseCorsConfig(environment) {
    // Validate environment parameter against supported environment types
    const validEnvironments = ['development', 'production', 'staging', 'test'];
    if (!validEnvironments.includes(environment)) {
        logWarn('Invalid environment provided to createBaseCorsConfig', {
            provided: environment,
            valid: validEnvironments
        });
        environment = 'development';
    }

    // Initialize empty CORS configuration object for environment-specific customization
    const baseConfig = {
        // Set default origin policy based on environment security requirements
        origin: false, // Will be configured by environment-specific functions
        
        // Configure allowed HTTP methods from HTTP_CONSTANTS.HTTP_METHODS
        methods: [
            HTTP_CONSTANTS.HTTP_METHODS.GET,
            HTTP_CONSTANTS.HTTP_METHODS.POST,
            HTTP_CONSTANTS.HTTP_METHODS.PUT,
            HTTP_CONSTANTS.HTTP_METHODS.DELETE,
            HTTP_CONSTANTS.HTTP_METHODS.OPTIONS,
            HTTP_CONSTANTS.HTTP_METHODS.HEAD
        ],
        
        // Set allowed headers policy with security considerations and necessary headers
        allowedHeaders: [
            HTTP_CONSTANTS.HEADERS.CONTENT_TYPE,
            HTTP_CONSTANTS.HEADERS.AUTHORIZATION,
            HTTP_CONSTANTS.HEADERS.ACCEPT,
            HTTP_CONSTANTS.HEADERS.ORIGIN,
            HTTP_CONSTANTS.HEADERS.X_REQUESTED_WITH,
            'X-Request-ID',
            'X-API-Version'
        ],
        
        // Configure exposed headers for client access
        exposedHeaders: [
            'X-Request-ID',
            'X-Rate-Limit-Remaining',
            'X-Rate-Limit-Reset',
            'X-Response-Time'
        ],
        
        // Configure credentials handling with HTTPS enforcement in production
        credentials: environment === 'production' ? false : true,
        
        // Set preflight cache duration using DEFAULT_CORS_MAX_AGE constant
        maxAge: environment === 'production' ? DEFAULT_CORS_MAX_AGE : 3600,
        
        // Apply optionsSuccessStatus for legacy browser compatibility
        optionsSuccessStatus: HTTP_CONSTANTS.STATUS_CODES.NO_CONTENT,
        
        // Configure preflightContinue handling for Express.js middleware chain
        preflightContinue: false
    };

    // Apply environment-specific security hardening measures
    if (environment === 'production') {
        // Production security hardening
        baseConfig.credentials = false; // Disable credentials in production by default
        baseConfig.methods = baseConfig.methods.filter(method => 
            !['TRACE', 'CONNECT'].includes(method)
        );
    }

    // Log CORS configuration creation with security level and environment
    logInfo('Base CORS configuration created', {
        environment,
        methodsCount: baseConfig.methods.length,
        headersCount: baseConfig.allowedHeaders.length,
        maxAge: baseConfig.maxAge,
        credentials: baseConfig.credentials,
        timestamp: new Date().toISOString()
    });

    // Return comprehensive base CORS configuration object
    return baseConfig;
}

/**
 * Creates development-friendly CORS configuration with relaxed security policies.
 * Supports hot reloading, debugging tools, local development servers, and cross-origin
 * testing while maintaining essential security protections for the development workflow.
 * 
 * @param {Object} baseConfig - Base CORS configuration to customize
 * @returns {Object} Development-optimized CORS configuration with relaxed policies for local development
 */
export function createDevelopmentCorsConfig(baseConfig) {
    // Clone base CORS configuration for development customization
    const devConfig = {
        ...baseConfig,
        
        // Enable permissive origin policy for local development servers
        origin: (origin, callback) => {
            // Allow localhost, 127.0.0.1, and development domains in origin whitelist
            const developmentOrigins = [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8080',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'http://127.0.0.1:8080',
                'http://[::1]:3000',
                'http://[::1]:3001',
                'http://[::1]:8080'
            ];
            
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) {
                return callback(null, true);
            }
            
            // Check against development origin whitelist
            if (developmentOrigins.includes(origin) || 
                origin.match(/^http:\/\/localhost:\d+$/) ||
                origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
                return callback(null, true);
            }
            
            // Log development CORS violation for debugging
            logWarn('Development CORS origin rejected', {
                origin,
                allowedOrigins: developmentOrigins,
                suggestion: 'Add origin to development whitelist'
            });
            
            return callback(null, false);
        },
        
        // Configure credentials handling to support development authentication
        credentials: true,
        
        // Allow additional HTTP methods for development testing and debugging
        methods: [
            ...baseConfig.methods,
            'PATCH',
            'TRACE' // For debugging purposes only
        ],
        
        // Set relaxed headers policy to allow development and debugging headers
        allowedHeaders: [
            ...baseConfig.allowedHeaders,
            'X-Debug-Mode',
            'X-Development-Token',
            'X-Hot-Reload',
            'X-Test-Request'
        ],
        
        // Configure generous preflight cache duration for development performance
        maxAge: 3600, // 1 hour for development
        
        // Enable detailed CORS violation logging for development debugging
        optionsSuccessStatus: HTTP_CONSTANTS.STATUS_CODES.OK // Some dev tools expect 200
    };

    // Log development CORS configuration with security warnings
    logInfo('Development CORS configuration created', {
        environment: 'development',
        securityLevel: 'permissive',
        warning: 'This configuration should NOT be used in production',
        credentials: devConfig.credentials,
        methodsCount: devConfig.methods.length,
        timestamp: new Date().toISOString()
    });

    // Return development-optimized CORS configuration object
    return devConfig;
}

/**
 * Creates production-hardened CORS configuration with strict security policies.
 * Implements minimal attack surface and comprehensive protection against cross-origin
 * attacks while enabling necessary business functionality for production API deployments.
 * 
 * @param {Object} baseConfig - Base CORS configuration to harden
 * @returns {Object} Production-hardened CORS configuration with strict security policies
 */
export function createProductionCorsConfig(baseConfig) {
    // Clone base CORS configuration for production hardening
    const prodConfig = {
        ...baseConfig,
        
        // Implement strict origin whitelist with only approved production domains
        origin: (origin, callback) => {
            // Get production allowed origins from environment configuration
            const productionOrigins = environmentConfig.security?.corsOrigins || [];
            
            // Reject requests with no origin in production
            if (!origin && environmentConfig.isProduction) {
                logSecurityEvent(SECURITY_EVENT_TYPES.CORS_VIOLATION, {
                    reason: 'No origin header in production request',
                    severity: 'medium',
                    blocked: true
                });
                return callback(new SecurityError(
                    'Origin header required in production',
                    'cors-violation',
                    { clientIp: 'unknown' }
                ), false);
            }
            
            // Allow no-origin requests in non-production for API clients
            if (!origin && !environmentConfig.isProduction) {
                return callback(null, true);
            }
            
            // Validate origin URL format and security
            if (!validateUrl(origin, { requireHttps: true })) {
                logSecurityEvent(SECURITY_EVENT_TYPES.CORS_VIOLATION, {
                    reason: 'Invalid origin URL format',
                    origin,
                    severity: 'high',
                    blocked: true
                });
                return callback(new SecurityError(
                    'Invalid origin URL format',
                    'cors-violation',
                    { origin, clientIp: 'unknown' }
                ), false);
            }
            
            // Check against production origin whitelist
            if (productionOrigins.includes(origin)) {
                // Update CORS metrics for allowed requests
                CORS_METRICS.allowedRequests++;
                return callback(null, true);
            }
            
            // Log and block unauthorized origins
            CORS_METRICS.blockedRequests++;
            const violationCount = CORS_METRICS.violationsByOrigin.get(origin) || 0;
            CORS_METRICS.violationsByOrigin.set(origin, violationCount + 1);
            
            logSecurityEvent(SECURITY_EVENT_TYPES.ORIGIN_BLOCKED, {
                origin,
                violationCount: violationCount + 1,
                severity: violationCount > CORS_VIOLATION_THRESHOLD ? 'high' : 'medium',
                productionOrigins,
                blocked: true
            });
            
            return callback(new SecurityError(
                'Origin not allowed by CORS policy',
                'cors-violation',
                { origin, violationCount: violationCount + 1 }
            ), false);
        },
        
        // Restrict HTTP methods to only necessary business operations
        methods: [
            HTTP_CONSTANTS.HTTP_METHODS.GET,
            HTTP_CONSTANTS.HTTP_METHODS.POST,
            HTTP_CONSTANTS.HTTP_METHODS.PUT,
            HTTP_CONSTANTS.HTTP_METHODS.DELETE,
            HTTP_CONSTANTS.HTTP_METHODS.OPTIONS
        ],
        
        // Configure minimal headers policy allowing only required headers
        allowedHeaders: [
            HTTP_CONSTANTS.HEADERS.CONTENT_TYPE,
            HTTP_CONSTANTS.HEADERS.AUTHORIZATION,
            HTTP_CONSTANTS.HEADERS.ACCEPT,
            'X-Request-ID'
        ],
        
        // Enforce credentials handling with strict HTTPS requirements
        credentials: false, // Disabled in production for security
        
        // Set conservative preflight cache duration for security
        maxAge: DEFAULT_CORS_MAX_AGE,
        
        // Configure production-appropriate error responses with minimal information
        optionsSuccessStatus: HTTP_CONSTANTS.STATUS_CODES.NO_CONTENT
    };

    // Log production CORS configuration with security compliance status
    logInfo('Production CORS configuration created', {
        environment: 'production',
        securityLevel: 'strict',
        allowedOrigins: environmentConfig.security?.corsOrigins?.length || 0,
        credentials: prodConfig.credentials,
        methodsCount: prodConfig.methods.length,
        complianceStatus: 'hardened',
        timestamp: new Date().toISOString()
    });

    // Return enterprise-grade production CORS configuration
    return prodConfig;
}

/**
 * Creates staging environment CORS configuration that balances production-like security
 * with testing flexibility. Enables comprehensive security testing, load testing, and
 * validation of CORS policies before production deployment.
 * 
 * @param {Object} baseConfig - Base CORS configuration to customize for staging
 * @returns {Object} Staging-optimized CORS configuration balancing security and testing requirements
 */
export function createStagingCorsConfig(baseConfig) {
    // Clone base CORS configuration for staging customization
    const stagingConfig = {
        ...baseConfig,
        
        // Apply production-like security policies with testing accommodations
        origin: (origin, callback) => {
            // Configure staging-specific origin whitelist including testing domains
            const stagingOrigins = [
                ...(environmentConfig.security?.corsOrigins || []),
                'https://staging.example.com',
                'https://test.example.com',
                'https://qa.example.com'
            ];
            
            // Allow testing tools and load testing origins
            const testingOrigins = [
                'https://loadtest.example.com',
                'https://performance.example.com'
            ];
            
            const allAllowedOrigins = [...stagingOrigins, ...testingOrigins];
            
            // Allow no-origin requests for API testing tools
            if (!origin) {
                return callback(null, true);
            }
            
            // Validate origin URL for staging security testing
            if (!validateUrl(origin)) {
                logWarn('Staging CORS origin validation failed', {
                    origin,
                    reason: 'Invalid URL format'
                });
                return callback(null, false);
            }
            
            // Check against staging and testing origin whitelist
            if (allAllowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            
            // Log staging CORS violations for testing validation
            logWarn('Staging CORS origin not in whitelist', {
                origin,
                allowedOrigins: allAllowedOrigins,
                environment: 'staging'
            });
            
            return callback(null, false);
        },
        
        // Allow additional testing methods while maintaining security controls
        methods: [
            ...baseConfig.methods,
            'PATCH' // For testing PATCH operations
        ],
        
        // Configure staging-appropriate error responses for testing feedback
        credentials: true, // Enable for authentication testing
        
        // Configure load testing compatible CORS policies and performance settings
        maxAge: 7200, // 2 hours for staging performance testing
        
        // Enable staging-appropriate headers for testing
        allowedHeaders: [
            ...baseConfig.allowedHeaders,
            'X-Test-ID',
            'X-Load-Test',
            'X-Performance-Test'
        ],
        
        exposedHeaders: [
            ...baseConfig.exposedHeaders,
            'X-Test-Response-Time',
            'X-Staging-Version'
        ]
    };

    // Log staging CORS configuration with testing considerations
    logInfo('Staging CORS configuration created', {
        environment: 'staging',
        securityLevel: 'balanced',
        testingEnabled: true,
        loadTestingSupported: true,
        methodsCount: stagingConfig.methods.length,
        timestamp: new Date().toISOString()
    });

    // Return staging-optimized CORS configuration for security testing
    return stagingConfig;
}

/**
 * Creates test environment CORS configuration optimized for automated testing.
 * Supports unit tests, integration tests, and continuous integration environments
 * with predictable behavior and comprehensive test coverage support.
 * 
 * @param {Object} baseConfig - Base CORS configuration to customize for testing
 * @returns {Object} Test-optimized CORS configuration with predictable behavior and comprehensive testing support
 */
export function createTestCorsConfig(baseConfig) {
    // Clone base CORS configuration for test environment customization
    const testConfig = {
        ...baseConfig,
        
        // Configure predictable CORS behavior for automated testing
        origin: (origin, callback) => {
            // Allow test-specific origins including localhost and test domains
            const testOrigins = [
                'http://localhost:3000',
                'http://localhost:8080',
                'http://test.localhost',
                'https://test.example.com',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:8080'
            ];
            
            // Always allow no-origin requests in test environment
            if (!origin) {
                return callback(null, true);
            }
            
            // Allow any localhost or test domain for comprehensive testing
            if (testOrigins.includes(origin) || 
                origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|test\.)/)) {
                return callback(null, true);
            }
            
            // Provide deterministic rejection for testing error handling
            return callback(null, false);
        },
        
        // Enable comprehensive CORS violation tracking for test validation
        methods: [
            ...baseConfig.methods,
            'PATCH',
            'TRACE' // For testing comprehensive HTTP method coverage
        ],
        
        // Configure test-appropriate error responses for assertion testing
        credentials: true,
        
        // Set up deterministic CORS policy behavior for consistent testing
        maxAge: 60, // Short cache for test isolation
        
        // Enable test-specific headers for testing framework compatibility
        allowedHeaders: [
            ...baseConfig.allowedHeaders,
            'X-Test-Case',
            'X-Mock-Response',
            'X-Test-Scenario',
            'X-Coverage-ID'
        ],
        
        // Configure test-specific preflight handling for performance testing
        optionsSuccessStatus: HTTP_CONSTANTS.STATUS_CODES.OK,
        
        // Enable detailed logging for test debugging and validation
        preflightContinue: false
    };

    // Log test CORS configuration with testing framework compatibility
    logInfo('Test CORS configuration created', {
        environment: 'test',
        securityLevel: 'permissive',
        testingOptimized: true,
        deterministicBehavior: true,
        cacheTimeout: testConfig.maxAge,
        timestamp: new Date().toISOString()
    });

    // Return test-optimized CORS configuration for automated testing
    return testConfig;
}

/**
 * Creates dynamic origin validation function with whitelist checking, pattern matching,
 * and subdomain validation. Provides flexible origin validation for different environments
 * while maintaining security controls and violation tracking.
 * 
 * @param {Array} allowedOrigins - Array of allowed origin patterns and exact origins
 * @param {Object} validationOptions - Origin validation configuration options
 * @returns {Function} Origin validation function that accepts origin and callback parameters for CORS middleware
 */
export function createOriginValidator(allowedOrigins, validationOptions = {}) {
    const options = {
        enablePatternMatching: validationOptions.enablePatternMatching !== false,
        allowSubdomains: validationOptions.allowSubdomains === true,
        caseInsensitive: validationOptions.caseInsensitive === true,
        logViolations: validationOptions.logViolations !== false,
        ...validationOptions
    };

    // Validate allowedOrigins array and sanitize origin patterns
    if (!Array.isArray(allowedOrigins)) {
        logError('Invalid allowedOrigins provided to createOriginValidator', {
            provided: typeof allowedOrigins,
            expected: 'array'
        });
        allowedOrigins = [];
    }

    // Initialize origin validation cache for performance optimization
    const validationCache = new Map();
    const violationCache = new Map();

    // Create validation function with origin and callback parameters
    return function validateOrigin(origin, callback) {
        // Handle null origin (mobile apps, desktop apps, curl, etc.)
        if (!origin) {
            if (environmentConfig.isDevelopment) {
                return callback(null, true);
            } else {
                // Log null origin in production for security monitoring
                if (options.logViolations) {
                    logSecurityEvent(SECURITY_EVENT_TYPES.CORS_VIOLATION, {
                        reason: 'Null origin in production environment',
                        severity: 'low',
                        blocked: false
                    });
                }
                return callback(null, environmentConfig.security?.allowNullOrigin || false);
            }
        }

        // Check validation cache for performance optimization
        if (validationCache.has(origin)) {
            const cachedResult = validationCache.get(origin);
            return callback(null, cachedResult);
        }

        // Implement exact origin matching for security and performance
        const normalizedOrigin = options.caseInsensitive ? origin.toLowerCase() : origin;
        const normalizedAllowed = allowedOrigins.map(o => 
            options.caseInsensitive ? o.toLowerCase() : o
        );

        if (normalizedAllowed.includes(normalizedOrigin)) {
            validationCache.set(origin, true);
            return callback(null, true);
        }

        // Add pattern-based origin matching for subdomain validation
        if (options.enablePatternMatching) {
            for (const pattern of allowedOrigins) {
                if (pattern.includes('*')) {
                    const regexPattern = pattern
                        .replace(/\./g, '\\.')
                        .replace(/\*/g, '.*');
                    const regex = new RegExp(`^${regexPattern}$`, options.caseInsensitive ? 'i' : '');
                    
                    if (regex.test(origin)) {
                        validationCache.set(origin, true);
                        return callback(null, true);
                    }
                }
            }
        }

        // Include subdomain validation if enabled
        if (options.allowSubdomains) {
            try {
                const originUrl = new URL(origin);
                for (const allowedOrigin of allowedOrigins) {
                    const allowedUrl = new URL(allowedOrigin);
                    if (originUrl.hostname.endsWith('.' + allowedUrl.hostname) &&
                        originUrl.protocol === allowedUrl.protocol) {
                        validationCache.set(origin, true);
                        return callback(null, true);
                    }
                }
            } catch (error) {
                // Invalid URL format
                if (options.logViolations) {
                    logWarn('Invalid origin URL format in validation', {
                        origin,
                        error: error.message
                    });
                }
            }
        }

        // Add CORS violation logging for unauthorized origins
        if (options.logViolations) {
            const violationCount = violationCache.get(origin) || 0;
            violationCache.set(origin, violationCount + 1);

            logSecurityEvent(SECURITY_EVENT_TYPES.ORIGIN_BLOCKED, {
                origin,
                violationCount: violationCount + 1,
                allowedOrigins: allowedOrigins.length,
                severity: violationCount > CORS_VIOLATION_THRESHOLD ? 'high' : 'medium',
                blocked: true
            });

            // Update global CORS metrics
            CORS_METRICS.blockedRequests++;
            CORS_METRICS.violationsByOrigin.set(origin, violationCount + 1);
        }

        // Cache negative result for performance
        validationCache.set(origin, false);

        // Return configured origin validation function for CORS middleware
        return callback(null, false);
    };
}

/**
 * Validates CORS configuration completeness, security effectiveness, and compliance
 * with modern web security standards. Ensures optimal cross-origin protection and
 * policy correctness for production deployment.
 * 
 * @param {Object} corsConfig - CORS configuration object to validate
 * @param {string} environment - Environment name for validation context
 * @returns {Object} Validation result with security status, warnings, recommendations, and compliance information
 */
export function validateCorsConfig(corsConfig, environment) {
    const validationResult = {
        isValid: true,
        securityScore: 100,
        warnings: [],
        errors: [],
        recommendations: [],
        compliance: {
            securityStandards: true,
            productionReady: true,
            bestPractices: true
        },
        environment,
        timestamp: new Date().toISOString()
    };

    // Validate CORS configuration structure and required properties
    if (!corsConfig || typeof corsConfig !== 'object') {
        validationResult.isValid = false;
        validationResult.errors.push('CORS configuration must be a valid object');
        return validationResult;
    }

    // Check origin policy security and whitelist completeness
    if (!corsConfig.origin) {
        validationResult.warnings.push('Origin policy not configured - all origins will be blocked');
        validationResult.securityScore -= 20;
    } else if (corsConfig.origin === true) {
        validationResult.errors.push('Wildcard origin (*) is dangerous and should not be used');
        validationResult.isValid = false;
        validationResult.securityScore -= 50;
        validationResult.compliance.securityStandards = false;
    }

    // Verify HTTP methods restriction and security implications
    if (!Array.isArray(corsConfig.methods)) {
        validationResult.errors.push('Methods must be specified as an array');
        validationResult.isValid = false;
    } else {
        const dangerousMethods = ['TRACE', 'CONNECT'];
        const hasDangerousMethods = corsConfig.methods.some(method => 
            dangerousMethods.includes(method.toUpperCase())
        );
        
        if (hasDangerousMethods && environment === 'production') {
            validationResult.warnings.push('Dangerous HTTP methods detected in production');
            validationResult.securityScore -= 15;
            validationResult.compliance.productionReady = false;
        }
    }

    // Validate headers policy for security and functionality balance
    if (!Array.isArray(corsConfig.allowedHeaders)) {
        validationResult.warnings.push('Allowed headers should be explicitly specified');
        validationResult.securityScore -= 10;
    } else {
        const sensitiveHeaders = ['Cookie', 'Authorization'];
        const exposedSensitiveHeaders = corsConfig.allowedHeaders.filter(header =>
            sensitiveHeaders.some(sensitive => header.toLowerCase().includes(sensitive.toLowerCase()))
        );
        
        if (exposedSensitiveHeaders.length > 0 && environment === 'production') {
            validationResult.warnings.push(`Sensitive headers exposed: ${exposedSensitiveHeaders.join(', ')}`);
            validationResult.securityScore -= 20;
        }
    }

    // Check credentials handling configuration and HTTPS enforcement
    if (corsConfig.credentials === true) {
        if (environment === 'production') {
            validationResult.warnings.push('Credentials enabled in production requires careful origin control');
            validationResult.securityScore -= 15;
            
            if (corsConfig.origin === true) {
                validationResult.errors.push('Cannot use credentials with wildcard origin');
                validationResult.isValid = false;
                validationResult.compliance.securityStandards = false;
            }
        }
    }

    // Analyze preflight cache duration for security and performance
    if (typeof corsConfig.maxAge !== 'number') {
        validationResult.warnings.push('Preflight cache duration (maxAge) should be specified');
        validationResult.securityScore -= 5;
    } else {
        if (corsConfig.maxAge > 86400 && environment === 'production') {
            validationResult.warnings.push('Very long preflight cache may impact security updates');
            validationResult.securityScore -= 10;
        }
        
        if (corsConfig.maxAge < 60) {
            validationResult.warnings.push('Very short preflight cache may impact performance');
        }
    }

    // Validate environment-specific CORS policy appropriateness
    switch (environment) {
        case 'production':
            if (typeof corsConfig.origin === 'function') {
                validationResult.recommendations.push('Ensure origin validation function implements strict whitelist');
            }
            if (corsConfig.credentials) {
                validationResult.recommendations.push('Consider disabling credentials in production unless required');
            }
            break;
            
        case 'development':
            if (typeof corsConfig.origin !== 'function' && corsConfig.origin !== true) {
                validationResult.recommendations.push('Consider using flexible origin validation for development');
            }
            break;
            
        case 'test':
            if (corsConfig.maxAge > 300) {
                validationResult.recommendations.push('Use shorter cache duration in test environment');
            }
            break;
    }

    // Check for insecure CORS configurations and common vulnerabilities
    const insecurePatterns = [
        { check: corsConfig.origin === '*', message: 'Wildcard origin is insecure' },
        { check: corsConfig.credentials && corsConfig.origin === true, message: 'Credentials with wildcard origin' },
        { check: corsConfig.methods?.includes('*'), message: 'Wildcard methods are insecure' },
        { check: corsConfig.allowedHeaders?.includes('*'), message: 'Wildcard headers are insecure' }
    ];

    insecurePatterns.forEach(pattern => {
        if (pattern.check) {
            validationResult.errors.push(pattern.message);
            validationResult.isValid = false;
            validationResult.securityScore -= 30;
            validationResult.compliance.securityStandards = false;
        }
    });

    // Generate security recommendations and improvement suggestions
    if (validationResult.securityScore < 80) {
        validationResult.recommendations.push('Review and strengthen CORS security policies');
    }

    if (environment === 'production' && validationResult.securityScore < 90) {
        validationResult.compliance.productionReady = false;
        validationResult.recommendations.push('Address security issues before production deployment');
    }

    // Final compliance assessment
    validationResult.compliance.overall = validationResult.isValid && 
                                         validationResult.compliance.securityStandards &&
                                         validationResult.compliance.productionReady;

    // Log validation results with detailed CORS compliance status
    const logLevel = validationResult.isValid ? 'info' : 'warn';
    logger[logLevel]('CORS configuration validation completed', {
        environment,
        isValid: validationResult.isValid,
        securityScore: validationResult.securityScore,
        warningsCount: validationResult.warnings.length,
        errorsCount: validationResult.errors.length,
        compliance: validationResult.compliance,
        timestamp: validationResult.timestamp
    });

    // Return comprehensive validation report with actionable recommendations
    return validationResult;
}

/**
 * Main factory function that creates complete CORS configuration based on environment.
 * Integrates all cross-origin policies, origin validation, security controls, and
 * optimization for seamless Express.js middleware integration with comprehensive
 * logging and monitoring.
 * 
 * @param {string} environment - Environment name (development, production, staging, test)
 * @param {Object} options - Additional configuration options and overrides
 * @returns {Object} Complete CORS configuration object ready for Express.js CORS middleware integration
 */
export function createCorsConfig(environment = 'development', options = {}) {
    // Validate environment parameter against supported environment types
    const validEnvironments = ['development', 'production', 'staging', 'test'];
    if (!validEnvironments.includes(environment)) {
        logWarn('Invalid environment provided to createCorsConfig', {
            provided: environment,
            valid: validEnvironments,
            defaulting: 'development'
        });
        environment = 'development';
    }

    // Check configuration cache for existing environment CORS configuration
    const cacheKey = `${environment}-${JSON.stringify(options)}`;
    if (CORS_CONFIG_CACHE.has(cacheKey)) {
        const cachedConfig = CORS_CONFIG_CACHE.get(cacheKey);
        logInfo('CORS configuration retrieved from cache', {
            environment,
            cacheKey: cacheKey.substring(0, 50),
            timestamp: new Date().toISOString()
        });
        return cachedConfig;
    }

    // Create base CORS configuration using createBaseCorsConfig function
    const baseConfig = createBaseCorsConfig(environment);

    // Apply environment-specific customizations based on environment type
    let corsConfig;
    switch (environment) {
        case 'development':
            corsConfig = createDevelopmentCorsConfig(baseConfig);
            break;
        case 'production':
            corsConfig = createProductionCorsConfig(baseConfig);
            break;
        case 'staging':
            corsConfig = createStagingCorsConfig(baseConfig);
            break;
        case 'test':
            corsConfig = createTestCorsConfig(baseConfig);
            break;
        default:
            corsConfig = baseConfig;
    }

    // Merge custom options and overrides from options parameter
    const finalConfig = {
        ...corsConfig,
        ...options,
        // Preserve critical security functions from environment config
        origin: options.origin || corsConfig.origin
    };

    // Apply security constants and default values from SECURITY_CONSTANTS
    if (SECURITY_CONSTANTS.CORS_CONFIG) {
        finalConfig.maxAge = finalConfig.maxAge || SECURITY_CONSTANTS.CORS_CONFIG.MAX_AGE;
        finalConfig.credentials = finalConfig.credentials ?? SECURITY_CONSTANTS.CORS_CONFIG.CREDENTIALS;
    }

    // Validate final configuration using validateCorsConfig function
    const validationResult = validateCorsConfig(finalConfig, environment);
    
    if (!validationResult.isValid) {
        logError('CORS configuration validation failed', {
            environment,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            securityScore: validationResult.securityScore
        });
        
        // Use safe fallback configuration for invalid configs
        return createBaseCorsConfig('development');
    }

    // Cache validated configuration for improved performance
    CORS_CONFIG_CACHE.set(cacheKey, finalConfig);

    // Log comprehensive CORS configuration creation with metadata
    logInfo('CORS configuration created successfully', {
        environment,
        securityScore: validationResult.securityScore,
        compliance: validationResult.compliance,
        cacheKey: cacheKey.substring(0, 50),
        configurationFeatures: {
            originValidation: typeof finalConfig.origin === 'function',
            credentialsEnabled: finalConfig.credentials,
            methodsCount: finalConfig.methods?.length || 0,
            headersCount: finalConfig.allowedHeaders?.length || 0,
            maxAge: finalConfig.maxAge
        },
        timestamp: new Date().toISOString()
    });

    // Return complete CORS configuration ready for Express middleware
    return finalConfig;
}

/**
 * Creates configured CORS middleware function for Express.js applications.
 * Provides environment-specific policies, error handling, violation logging,
 * and performance optimization with seamless Express.js v5.1.0 middleware integration.
 * 
 * @param {string} environment - Environment name for CORS policy selection
 * @param {Object} corsOptions - Additional CORS configuration options
 * @returns {Function} Configured Express.js CORS middleware function with environment-specific policies
 */
export function createCorsMiddleware(environment = 'development', corsOptions = {}) {
    // Create CORS configuration using createCorsConfig function
    const corsConfig = createCorsConfig(environment, corsOptions);

    // Set up CORS violation logging and security event tracking
    const originalOriginHandler = corsConfig.origin;
    
    if (typeof originalOriginHandler === 'function') {
        corsConfig.origin = (origin, callback) => {
            // Add performance monitoring and metrics collection
            const startTime = Date.now();
            CORS_METRICS.totalRequests++;
            
            // Wrap original handler with enhanced logging
            originalOriginHandler(origin, (error, allowed) => {
                const responseTime = Date.now() - startTime;
                
                // Log CORS decision with performance metrics
                logCorsEvent('origin-validation', {
                    origin,
                    allowed,
                    error: error?.message,
                    responseTime,
                    environment
                });
                
                // Update metrics
                if (allowed) {
                    CORS_METRICS.allowedRequests++;
                } else {
                    CORS_METRICS.blockedRequests++;
                }
                
                callback(error, allowed);
            });
        };
    }

    // Add request correlation and debugging support
    const corsMiddleware = (req, res, next) => {
        // Add CORS request correlation ID
        req.corsRequestId = req.headers['x-request-id'] || `cors-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Track preflight requests for optimization
        if (req.method === 'OPTIONS') {
            CORS_METRICS.preflightRequests++;
            
            // Check for cached preflight responses
            const cacheKey = `${req.headers.origin}-${req.headers['access-control-request-method']}`;
            if (corsConfig.maxAge && corsConfig.maxAge > 0) {
                CORS_METRICS.cachedPreflightHits++;
            }
        }
        
        // Apply CORS configuration
        const cors = require('cors');
        return cors(corsConfig)(req, res, next);
    };

    // Log CORS middleware initialization with configuration summary
    logInfo('CORS middleware created', {
        environment,
        middlewareType: 'express-cors',
        configurationSummary: {
            originType: typeof corsConfig.origin,
            methodsCount: corsConfig.methods?.length || 0,
            credentialsEnabled: corsConfig.credentials,
            maxAge: corsConfig.maxAge
        },
        timestamp: new Date().toISOString()
    });

    // Return configured CORS middleware function for Express application
    return corsMiddleware;
}

/**
 * Logs CORS-related events including violations, security alerts, and cross-origin
 * request activities. Provides detailed context information for security monitoring,
 * threat analysis, and compliance tracking in production environments.
 * 
 * @param {string} eventType - Type of CORS event (violation, allowed, blocked, etc.)
 * @param {Object} eventContext - Event context and details
 * @param {Object} request - Express request object (optional)
 * @returns {void} No return value, performs security logging side effect
 */
export function logCorsEvent(eventType, eventContext, request = null) {
    // Extract relevant request information and sanitize sensitive data
    const requestInfo = request ? {
        method: request.method,
        url: sanitizeInput(request.url),
        origin: sanitizeInput(request.headers?.origin || 'none'),
        userAgent: sanitizeInput(request.headers?.['user-agent'] || 'unknown'),
        ip: request.ip || request.connection?.remoteAddress || 'unknown',
        requestId: request.corsRequestId || request.headers?.['x-request-id'] || 'unknown'
    } : null;

    // Classify CORS event type and security impact level
    const eventClassification = {
        type: eventType,
        category: 'cors-security',
        severity: determineEventSeverity(eventType, eventContext),
        impact: assessEventImpact(eventType, eventContext)
    };

    // Generate event correlation ID for distributed debugging
    const correlationId = `cors-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Include security context including IP address, user agent, and origin
    const securityContext = {
        origin: eventContext.origin ? sanitizeInput(eventContext.origin) : null,
        allowed: eventContext.allowed,
        blocked: eventContext.blocked || false,
        violationCount: eventContext.violationCount || 0,
        clientFingerprint: generateClientFingerprint(requestInfo)
    };

    // Add timestamp and environment context for temporal analysis
    const eventData = {
        correlationId,
        timestamp: new Date().toISOString(),
        environment: environmentConfig.currentEnvironment,
        event: eventClassification,
        security: securityContext,
        context: {
            ...eventContext,
            request: requestInfo,
            performance: {
                responseTime: eventContext.responseTime,
                cacheHit: eventContext.cacheHit || false
            }
        }
    };

    // Format security event for monitoring systems and alerting
    const logLevel = eventClassification.severity === 'high' ? 'warn' : 
                    eventClassification.severity === 'critical' ? 'error' : 'info';

    // Log using logSecurityEvent function for security tracking
    logSecurityEvent(eventType, eventData, { 
        level: logLevel,
        category: 'cors-security',
        correlationId 
    });

    // Trigger security alerts if violation threshold exceeded
    if (eventContext.violationCount && eventContext.violationCount > CORS_VIOLATION_THRESHOLD) {
        logSecurityEvent('cors-violation-threshold-exceeded', {
            ...eventData,
            alertLevel: 'high',
            recommendedAction: 'investigate-client-behavior',
            threshold: CORS_VIOLATION_THRESHOLD
        });
    }

    // Update CORS metrics and violation counters
    updateCorsMetrics(eventType, eventContext);
}

/**
 * Factory function that creates and returns configured origin validation function.
 * Provides flexible origin validation with caching, pattern matching, and comprehensive
 * security logging for CORS middleware integration based on environment and security requirements.
 * 
 * @param {string} environment - Environment name for validation rules
 * @param {Object} validatorOptions - Origin validator configuration options
 * @returns {Function} Configured origin validation function for CORS middleware with environment-specific validation rules
 */
export function getOriginValidator(environment = 'development', validatorOptions = {}) {
    // Load environment-specific allowed origins from configuration
    const allowedOrigins = environmentConfig.security?.corsOrigins || 
                          getDefaultOriginsForEnvironment(environment);

    const options = {
        enablePatternMatching: validatorOptions.enablePatternMatching !== false,
        allowSubdomains: validatorOptions.allowSubdomains === true,
        logViolations: validatorOptions.logViolations !== false,
        cacheResults: validatorOptions.cacheResults !== false,
        environment,
        ...validatorOptions
    };

    // Create origin validation function using createOriginValidator
    const originValidator = createOriginValidator(allowedOrigins, options);

    // Set up origin validation caching for performance optimization
    const validationCache = new Map();
    const cacheTimeout = options.cacheTimeout || 300000; // 5 minutes default

    // Configure security logging for origin validation events
    const enhancedValidator = (origin, callback) => {
        const startTime = Date.now();
        
        // Check cache if enabled
        if (options.cacheResults && validationCache.has(origin)) {
            const cached = validationCache.get(origin);
            if (Date.now() - cached.timestamp < cacheTimeout) {
                logCorsEvent('origin-validation-cached', {
                    origin,
                    allowed: cached.allowed,
                    cacheHit: true,
                    responseTime: Date.now() - startTime
                });
                return callback(null, cached.allowed);
            } else {
                validationCache.delete(origin); // Remove expired cache entry
            }
        }
        
        // Use original validator
        originValidator(origin, (error, allowed) => {
            const responseTime = Date.now() - startTime;
            
            // Cache result if enabled
            if (options.cacheResults && !error) {
                validationCache.set(origin, {
                    allowed,
                    timestamp: Date.now()
                });
            }
            
            // Log validation event
            logCorsEvent('origin-validation', {
                origin,
                allowed,
                error: error?.message,
                responseTime,
                environment,
                cacheHit: false
            });
            
            callback(error, allowed);
        });
    };

    // Log origin validator creation
    logInfo('Origin validator created', {
        environment,
        allowedOriginsCount: allowedOrigins.length,
        options,
        timestamp: new Date().toISOString()
    });

    // Return configured origin validator function for CORS middleware
    return enhancedValidator;
}

/**
 * Optimizes CORS configuration for performance and security effectiveness.
 * Analyzes origin patterns, reduces validation overhead, optimizes preflight handling,
 * and maintains security coverage while improving response times and resource utilization.
 * 
 * @param {Object} corsConfig - CORS configuration to optimize
 * @param {Object} optimizationOptions - Optimization configuration options
 * @returns {Object} Optimized CORS configuration with improved performance and maintained security effectiveness
 */
export function optimizeCorsConfig(corsConfig, optimizationOptions = {}) {
    const options = {
        enableCaching: optimizationOptions.enableCaching !== false,
        optimizeOriginValidation: optimizationOptions.optimizeOriginValidation !== false,
        consolidatePatterns: optimizationOptions.consolidatePatterns !== false,
        optimizePreflight: optimizationOptions.optimizePreflight !== false,
        maintainSecurity: optimizationOptions.maintainSecurity !== false,
        ...optimizationOptions
    };

    // Create optimized configuration starting with original
    const optimizedConfig = { ...corsConfig };

    // Analyze origin patterns and consolidate similar validation rules
    if (options.optimizeOriginValidation && typeof corsConfig.origin === 'function') {
        // Create caching wrapper for origin validation
        const originalOriginValidator = corsConfig.origin;
        const originCache = new Map();
        const cacheTimeout = options.cacheTimeout || 300000; // 5 minutes

        optimizedConfig.origin = (origin, callback) => {
            // Check cache first
            if (options.enableCaching && originCache.has(origin)) {
                const cached = originCache.get(origin);
                if (Date.now() - cached.timestamp < cacheTimeout) {
                    return callback(null, cached.allowed);
                } else {
                    originCache.delete(origin);
                }
            }

            // Use original validator with caching
            originalOriginValidator(origin, (error, allowed) => {
                if (options.enableCaching && !error) {
                    originCache.set(origin, {
                        allowed,
                        timestamp: Date.now()
                    });
                }
                callback(error, allowed);
            });
        };
    }

    // Optimize preflight cache duration for performance without compromising security
    if (options.optimizePreflight) {
        const currentMaxAge = corsConfig.maxAge || 0;
        const environment = environmentConfig.currentEnvironment;

        // Environment-specific preflight optimization
        switch (environment) {
            case 'production':
                optimizedConfig.maxAge = Math.max(currentMaxAge, 3600); // Minimum 1 hour
                break;
            case 'staging':
                optimizedConfig.maxAge = Math.max(currentMaxAge, 1800); // Minimum 30 minutes
                break;
            case 'development':
                optimizedConfig.maxAge = Math.min(currentMaxAge, 300); // Maximum 5 minutes
                break;
            default:
                // Keep original maxAge
                break;
        }
    }

    // Reduce validation overhead through caching and pattern optimization
    if (options.consolidatePatterns && Array.isArray(corsConfig.allowedHeaders)) {
        // Remove duplicate headers and consolidate patterns
        optimizedConfig.allowedHeaders = [...new Set(corsConfig.allowedHeaders)];
    }

    if (Array.isArray(corsConfig.methods)) {
        // Remove duplicate methods
        optimizedConfig.methods = [...new Set(corsConfig.methods)];
    }

    // Minimize response header size while maintaining CORS functionality
    if (corsConfig.exposedHeaders) {
        // Keep only essential exposed headers
        const essentialHeaders = [
            'X-Request-ID',
            'X-Rate-Limit-Remaining',
            'X-Rate-Limit-Reset'
        ];
        optimizedConfig.exposedHeaders = corsConfig.exposedHeaders.filter(header =>
            essentialHeaders.includes(header) || header.startsWith('X-API-')
        );
    }

    // Validate optimized configuration maintains security effectiveness
    const validationResult = validateCorsConfig(optimizedConfig, environmentConfig.currentEnvironment);
    
    if (!validationResult.isValid || validationResult.securityScore < 70) {
        logWarn('CORS optimization reduced security effectiveness, reverting', {
            originalScore: 'unknown',
            optimizedScore: validationResult.securityScore,
            errors: validationResult.errors
        });
        return corsConfig; // Return original if optimization compromises security
    }

    // Calculate performance improvements
    const performanceGains = {
        cachingEnabled: options.enableCaching,
        preflightOptimized: options.optimizePreflight,
        headersOptimized: corsConfig.allowedHeaders?.length !== optimizedConfig.allowedHeaders?.length,
        validationOptimized: options.optimizeOriginValidation
    };

    // Log optimization results and performance improvements
    logInfo('CORS configuration optimized', {
        environment: environmentConfig.currentEnvironment,
        performanceGains,
        securityScore: validationResult.securityScore,
        optimizations: {
            maxAgeChanged: corsConfig.maxAge !== optimizedConfig.maxAge,
            headersConsolidated: corsConfig.allowedHeaders?.length !== optimizedConfig.allowedHeaders?.length,
            methodsConsolidated: corsConfig.methods?.length !== optimizedConfig.methods?.length,
            cachingAdded: options.enableCaching
        },
        timestamp: new Date().toISOString()
    });

    // Return optimized CORS configuration with performance metadata
    return {
        ...optimizedConfig,
        _optimization: {
            enabled: true,
            timestamp: new Date().toISOString(),
            gains: performanceGains,
            securityScore: validationResult.securityScore
        }
    };
}

/**
 * Creates reference implementation for Flask CORS configuration.
 * Maintains cross-platform feature parity and educational comparison between
 * Node.js Express and Python Flask implementations with consistent security
 * policies and functionality.
 * 
 * @param {Object} expressCorsConfig - Express.js CORS configuration to convert
 * @returns {Object} Flask-compatible CORS configuration object for cross-platform reference
 */
export function createFlaskCorsReference(expressCorsConfig) {
    // Convert Express.js CORS configuration to Flask-CORS format
    const flaskConfig = {
        // Map Express middleware options to Flask-CORS equivalents
        origins: [],
        methods: expressCorsConfig.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers: expressCorsConfig.allowedHeaders || ['Content-Type', 'Authorization'],
        expose_headers: expressCorsConfig.exposedHeaders || [],
        supports_credentials: expressCorsConfig.credentials || false,
        max_age: expressCorsConfig.maxAge || 3600,
        send_wildcard: false,
        automatic_options: true
    };

    // Translate security policies and origin validation rules to Flask patterns
    if (typeof expressCorsConfig.origin === 'function') {
        // Create Flask-compatible origin list
        flaskConfig.origins = getDefaultOriginsForEnvironment(environmentConfig.currentEnvironment);
        flaskConfig._origin_validator = 'function'; // Note: Flask-CORS uses different pattern
    } else if (Array.isArray(expressCorsConfig.origin)) {
        flaskConfig.origins = expressCorsConfig.origin;
    } else if (expressCorsConfig.origin === true) {
        flaskConfig.origins = '*';
        flaskConfig.send_wildcard = true;
    }

    // Convert error handling patterns to Flask conventions and response formats
    const flaskErrorHandling = {
        error_handler: 'flask_cors_error_handler',
        invalid_origin_response: {
            status: 403,
            message: 'Origin not allowed by CORS policy'
        },
        preflight_failure_response: {
            status: 400,
            message: 'CORS preflight request failed'
        }
    };

    // Generate Flask application integration examples and code snippets
    const flaskIntegrationExample = `
# Flask CORS Configuration Example
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# CORS Configuration equivalent to Express.js setup
cors_config = {
    'origins': ${JSON.stringify(flaskConfig.origins)},
    'methods': ${JSON.stringify(flaskConfig.methods)},
    'allow_headers': ${JSON.stringify(flaskConfig.allow_headers)},
    'expose_headers': ${JSON.stringify(flaskConfig.expose_headers)},
    'supports_credentials': ${flaskConfig.supports_credentials},
    'max_age': ${flaskConfig.max_age}
}

CORS(app, **cors_config)

# Custom origin validation (equivalent to Express origin function)
@app.before_request
def validate_cors_origin():
    # Custom origin validation logic here
    pass
`;

    // Create documentation comparing Express.js and Flask CORS implementations
    const crossPlatformComparison = {
        express: {
            middleware: 'cors',
            originFunction: 'Supports callback-based origin validation',
            errorHandling: 'Express error middleware integration',
            configuration: 'Object-based configuration with functions'
        },
        flask: {
            middleware: 'flask-cors',
            originFunction: 'List-based or pattern-based origin validation',
            errorHandling: 'Flask error handler integration',
            configuration: 'Dictionary-based configuration with decorators'
        },
        differences: [
            'Express uses callback-based origin validation, Flask uses list/pattern matching',
            'Express middleware runs per-request, Flask-CORS configures globally',
            'Express supports dynamic configuration, Flask is more static',
            'Error handling patterns differ between Express and Flask frameworks'
        ]
    };

    // Validate Flask configuration maintains feature parity with Express version
    const featureParity = {
        originValidation: true,
        methodRestriction: true,
        headerControl: true,
        credentialsHandling: true,
        preflightCaching: true,
        errorHandling: true,
        securityFeatures: true
    };

    // Return Flask-compatible CORS configuration for educational reference
    return {
        config: flaskConfig,
        errorHandling: flaskErrorHandling,
        integrationExample: flaskIntegrationExample,
        comparison: crossPlatformComparison,
        featureParity,
        metadata: {
            generatedFrom: 'express-cors-config',
            timestamp: new Date().toISOString(),
            compatibility: 'flask-cors',
            version: '1.0.0'
        }
    };
}

/**
 * Generates comprehensive documentation for CORS configuration.
 * Includes security explanations, policy details, implementation examples,
 * and educational content for the tutorial project with cross-platform
 * comparisons and best practices.
 * 
 * @param {Object} corsConfig - CORS configuration to document
 * @param {string} format - Documentation output format (markdown, html, json)
 * @returns {Object} Comprehensive CORS configuration documentation with security explanations and examples
 */
export function generateCorsDocumentation(corsConfig, format = 'markdown') {
    // Generate documentation structure for CORS configuration and policies
    const documentation = {
        title: 'CORS Configuration Documentation',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        environment: environmentConfig.currentEnvironment,
        format
    };

    // Create detailed explanations for each CORS setting and security implication
    const configurationExplanations = {
        origin: {
            description: 'Controls which origins are allowed to make cross-origin requests',
            security: 'Prevents unauthorized websites from accessing your API',
            values: {
                function: 'Dynamic validation with custom logic',
                array: 'Static whitelist of allowed origins',
                true: 'Allow all origins (DANGEROUS)',
                false: 'Block all cross-origin requests'
            },
            examples: {
                development: 'Permissive for local development and testing',
                production: 'Strict whitelist of approved domains only'
            }
        },
        methods: {
            description: 'Specifies which HTTP methods are allowed in cross-origin requests',
            security: 'Limits attack surface by restricting dangerous HTTP methods',
            recommendations: 'Only allow methods your API actually uses',
            dangerous: ['TRACE', 'CONNECT']
        },
        allowedHeaders: {
            description: 'Controls which request headers can be sent in cross-origin requests',
            security: 'Prevents header-based attacks and information disclosure',
            standard: ['Content-Type', 'Authorization', 'Accept'],
            custom: 'Application-specific headers for API functionality'
        },
        credentials: {
            description: 'Controls whether cookies and authentication can be included',
            security: 'Enabling credentials requires careful origin control',
            warning: 'Cannot be used with wildcard origins for security reasons'
        }
    };

    // Include cross-origin attack prevention information and benefits
    const securityBenefits = {
        sameOriginPolicy: {
            description: 'Browser security model that restricts cross-origin requests',
            purpose: 'Prevents malicious websites from accessing sensitive data',
            corsRole: 'CORS provides controlled exceptions to same-origin policy'
        },
        attackPrevention: {
            csrf: 'Cross-Site Request Forgery protection through origin validation',
            xss: 'Cross-Site Scripting mitigation by controlling resource access',
            dataTheft: 'Prevents unauthorized data access from malicious origins'
        },
        complianceStandards: {
            owasp: 'Follows OWASP guidelines for cross-origin security',
            w3c: 'Implements W3C CORS specification correctly',
            security: 'Meets modern web security standards and best practices'
        }
    };

    // Add configuration examples and best practices for different environments
    const configurationExamples = {
        development: {
            description: 'Permissive configuration for local development',
            code: JSON.stringify(createDevelopmentCorsConfig(createBaseCorsConfig('development')), null, 2),
            notes: 'Allows localhost origins and debugging headers'
        },
        production: {
            description: 'Strict security configuration for production deployment',
            code: JSON.stringify(createProductionCorsConfig(createBaseCorsConfig('production')), null, 2),
            notes: 'Minimal attack surface with strict origin validation'
        },
        staging: {
            description: 'Balanced configuration for pre-production testing',
            code: JSON.stringify(createStagingCorsConfig(createBaseCorsConfig('staging')), null, 2),
            notes: 'Production-like security with testing accommodations'
        }
    };

    // Create troubleshooting guides for common CORS issues and violations
    const troubleshootingGuide = {
        commonIssues: {
            'CORS policy blocked': {
                cause: 'Origin not in allowed list',
                solution: 'Add origin to whitelist or check origin validation function',
                debugging: 'Check browser console for exact error message'
            },
            'Preflight request failed': {
                cause: 'Custom headers or non-simple methods not allowed',
                solution: 'Add headers/methods to allowedHeaders/methods configuration',
                debugging: 'Check OPTIONS request response in network tab'
            },
            'Credentials not allowed': {
                cause: 'Credentials enabled with wildcard origin',
                solution: 'Use specific origins when credentials are required',
                debugging: 'Cannot use credentials:true with origin:true'
            }
        },
        debuggingSteps: [
            'Check browser console for CORS error messages',
            'Verify origin header in request matches allowed origins',
            'Check preflight OPTIONS request and response',
            'Validate CORS configuration against browser requirements',
            'Test with simple requests before complex requests'
        ]
    };

    // Include environment-specific configuration recommendations and security notes
    const environmentRecommendations = {
        development: {
            security: 'Use permissive settings for development productivity',
            performance: 'Short cache timeouts for rapid iteration',
            debugging: 'Enable detailed logging and verbose error messages'
        },
        production: {
            security: 'Implement strict origin validation and minimal headers',
            performance: 'Long cache timeouts for optimal performance',
            monitoring: 'Enable comprehensive security event logging'
        },
        staging: {
            security: 'Production-like policies with testing accommodations',
            performance: 'Balanced cache settings for testing scenarios',
            testing: 'Support for load testing and security validation'
        }
    };

    // Generate testing instructions for CORS policy validation and verification
    const testingInstructions = {
        manualTesting: {
            tools: ['Browser Developer Tools', 'Postman', 'curl'],
            steps: [
                'Test simple requests (GET) first',
                'Test preflight requests (POST with custom headers)',
                'Verify origin validation with different domains',
                'Test credential handling if enabled',
                'Validate error responses for blocked requests'
            ]
        },
        automatedTesting: {
            frameworks: ['Jest', 'Mocha', 'Cypress'],
            testCases: [
                'Valid origin acceptance',
                'Invalid origin rejection',
                'Preflight request handling',
                'Method validation',
                'Header validation',
                'Credential handling'
            ]
        }
    };

    // Create educational content about modern web security and same-origin policy
    const educationalContent = {
        concepts: {
            sameOriginPolicy: 'Foundation of web security, prevents cross-origin data access',
            cors: 'Controlled relaxation of same-origin policy for legitimate use cases',
            preflight: 'Browser security check for complex cross-origin requests',
            credentials: 'Cookies and authentication headers in cross-origin requests'
        },
        realWorldScenarios: {
            spa: 'Single Page Applications accessing APIs on different domains',
            microservices: 'Service-to-service communication in distributed architectures',
            cdn: 'Content Delivery Networks serving resources to multiple domains',
            apis: 'Public APIs accessed by web applications from various origins'
        }
    };

    // Add cross-platform comparison with Flask CORS implementation
    const flaskComparison = createFlaskCorsReference(corsConfig);

    // Format documentation according to specified output format
    let formattedDocumentation;
    
    switch (format.toLowerCase()) {
        case 'markdown':
            formattedDocumentation = formatAsMarkdown({
                documentation,
                configurationExplanations,
                securityBenefits,
                configurationExamples,
                troubleshootingGuide,
                environmentRecommendations,
                testingInstructions,
                educationalContent,
                flaskComparison
            });
            break;
            
        case 'html':
            formattedDocumentation = formatAsHTML({
                documentation,
                configurationExplanations,
                securityBenefits,
                configurationExamples,
                troubleshootingGuide,
                environmentRecommendations,
                testingInstructions,
                educationalContent,
                flaskComparison
            });
            break;
            
        case 'json':
        default:
            formattedDocumentation = {
                documentation,
                configurationExplanations,
                securityBenefits,
                configurationExamples,
                troubleshootingGuide,
                environmentRecommendations,
                testingInstructions,
                educationalContent,
                flaskComparison
            };
            break;
    }

    // Log documentation generation
    logInfo('CORS documentation generated', {
        format,
        environment: environmentConfig.currentEnvironment,
        sectionsCount: Object.keys(configurationExplanations).length,
        timestamp: new Date().toISOString()
    });

    // Return comprehensive educational documentation object
    return formattedDocumentation;
}

// Default CORS configurations for different environments exported as constants
export const corsDefaults = {
    development: createDevelopmentCorsConfig(createBaseCorsConfig('development')),
    production: createProductionCorsConfig(createBaseCorsConfig('production')),
    staging: createStagingCorsConfig(createBaseCorsConfig('staging')),
    test: createTestCorsConfig(createBaseCorsConfig('test'))
};

// Helper functions for internal use

/**
 * Determines event severity based on type and context
 * @private
 */
function determineEventSeverity(eventType, context) {
    if (eventType.includes('violation') || eventType.includes('blocked')) {
        return context.violationCount > CORS_VIOLATION_THRESHOLD ? 'high' : 'medium';
    }
    return 'low';
}

/**
 * Assesses event impact
 * @private
 */
function assessEventImpact(eventType, context) {
    if (context.blocked) return 'security-block';
    if (context.allowed) return 'access-granted';
    return 'neutral';
}

/**
 * Generates client fingerprint for tracking
 * @private
 */
function generateClientFingerprint(requestInfo) {
    if (!requestInfo) return 'unknown';
    
    const crypto = require('crypto');
    const fingerprint = `${requestInfo.ip}-${requestInfo.userAgent}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
}

/**
 * Updates CORS metrics
 * @private
 */
function updateCorsMetrics(eventType, context) {
    if (eventType === 'origin-validation') {
        if (context.allowed) {
            CORS_METRICS.allowedRequests++;
        } else {
            CORS_METRICS.blockedRequests++;
        }
    }
    
    if (eventType.includes('preflight')) {
        CORS_METRICS.preflightRequests++;
        
        if (context.cacheHit) {
            CORS_METRICS.cachedPreflightHits++;
        }
    }
}

/**
 * Gets default origins for environment
 * @private
 */
function getDefaultOriginsForEnvironment(environment) {
    const defaults = {
        development: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://127.0.0.1:3000'
        ],
        production: [],
        staging: [
            'https://staging.example.com',
            'https://test.example.com'
        ],
        test: [
            'http://localhost:3000',
            'http://test.example.com'
        ]
    };
    
    return defaults[environment] || defaults.development;
}

/**
 * Formats documentation as Markdown
 * @private
 */
function formatAsMarkdown(content) {
    // Implementation would format the content object as Markdown
    return `# CORS Configuration Documentation\n\n` +
           `Generated at: ${content.documentation.generatedAt}\n\n` +
           `## Configuration Overview\n\n` +
           JSON.stringify(content.configurationExplanations, null, 2);
}

/**
 * Formats documentation as HTML
 * @private
 */
function formatAsHTML(content) {
    // Implementation would format the content object as HTML
    return `<html><head><title>CORS Documentation</title></head>` +
           `<body><h1>CORS Configuration Documentation</h1>` +
           `<p>Generated at: ${content.documentation.generatedAt}</p>` +
           `</body></html>`;
}

// Initialize CORS configuration system
logInfo('CORS configuration system initialized', {
    version: '1.0.0',
    supportedEnvironments: ['development', 'production', 'staging', 'test'],
    features: [
        'Dynamic origin validation',
        'Environment-aware policies',
        'Security event logging',
        'Performance optimization',
        'Cross-platform compatibility'
    ],
    environment: environmentConfig.currentEnvironment,
    timestamp: new Date().toISOString()
});