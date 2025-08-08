/**
 * Security Headers Middleware Configuration
 * 
 * Provides comprehensive HTTP security header management for the Testinium-QA Node.js server
 * component through integration with the helmet npm package. Implements enterprise-grade
 * security policies with environment-specific configurations and comprehensive validation.
 * 
 * Key Features:
 * - Content Security Policy (CSP) configuration with environment-specific policies
 * - XSS protection with mode=block enforcement
 * - Clickjacking prevention through X-Frame-Options headers
 * - Express fingerprint hiding via X-Powered-By header removal
 * - HSTS enforcement for HTTPS-only communication
 * - Referrer policy configuration for privacy protection
 * - Environment-adaptive security policies (stricter in production)
 * - Comprehensive validation of security configuration objects
 * - Structured logging of security policy enforcement
 * 
 * Security Architecture Implementation:
 * Implements Section 6.4 Security Architecture requirements including baseline
 * server-side security controls, automatic HTTP security header configuration,
 * and defense-in-depth security measures for the Node.js runtime environment.
 * 
 * @module security
 * @version 1.0.0
 * @author Blitzy Agent
 */

// Internal imports - Configuration and logging utilities
const config = require('../utils/config.js');
const logger = require('../utils/logger.js');

// External imports - Security and utility modules
const helmet = require('helmet');
const util = require('util');
const process = require('process');

/**
 * Default security configuration constants with comprehensive policy definitions
 * Provides baseline security settings that can be overridden based on environment
 * and specific application requirements.
 */
const SECURITY_DEFAULTS = {
    /**
     * Content Security Policy default configuration
     * Implements defense-in-depth against XSS and code injection attacks
     */
    CSP_POLICY: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: []
        },
        reportOnly: false
    },

    /**
     * HTTP Strict Transport Security (HSTS) maximum age in seconds
     * Enforces HTTPS-only communication for enhanced security
     */
    HSTS_MAX_AGE: 31536000, // 365 days in seconds

    /**
     * Referrer Policy default configuration
     * Controls referrer information sent with requests for privacy protection
     */
    REFERRER_POLICY: 'strict-origin-when-cross-origin',

    /**
     * X-Frame-Options default configuration
     * Prevents clickjacking attacks through frame embedding restrictions
     */
    FRAME_OPTIONS: 'DENY'
};

/**
 * Create environment-specific security policy configuration
 * Adapts security settings based on development, test, or production environments
 * with appropriate strictness levels and feature toggles.
 * 
 * @param {string} environment - Target environment (development|test|production)
 * @returns {Object} Environment-specific security policy configuration
 */
function createSecurityPolicy(environment = config.nodeEnv) {
    logger.debug('Creating security policy for environment', { 
        environment,
        isDevelopment: config.isDevelopment,
        isProduction: config.isProduction 
    });

    // Base security policy with common settings
    const basePolicy = {
        contentSecurityPolicy: { ...SECURITY_DEFAULTS.CSP_POLICY },
        hsts: {
            maxAge: SECURITY_DEFAULTS.HSTS_MAX_AGE,
            includeSubDomains: true,
            preload: true
        },
        frameguard: {
            action: SECURITY_DEFAULTS.FRAME_OPTIONS.toLowerCase()
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: {
            policy: SECURITY_DEFAULTS.REFERRER_POLICY
        },
        hidePoweredBy: true
    };

    // Environment-specific policy adjustments
    switch (environment) {
        case 'development':
            logger.debug('Applying development-specific security policy adjustments');
            
            // Relaxed CSP for development convenience
            basePolicy.contentSecurityPolicy.directives.scriptSrc.push("'unsafe-eval'");
            basePolicy.contentSecurityPolicy.directives.connectSrc.push('ws:', 'wss:');
            basePolicy.contentSecurityPolicy.reportOnly = true;
            
            // Disable HSTS in development (allows HTTP)
            basePolicy.hsts = false;
            
            // Allow framing for development tools
            basePolicy.frameguard = { action: 'sameorigin' };
            
            logger.info('Development security policy configured', {
                cspReportOnly: true,
                hstsDisabled: true,
                frameguardRelaxed: true
            });
            break;

        case 'test':
            logger.debug('Applying test-specific security policy adjustments');
            
            // Moderate CSP for test environments
            basePolicy.contentSecurityPolicy.directives.connectSrc.push('http://localhost:*');
            basePolicy.contentSecurityPolicy.reportOnly = false;
            
            // Reduced HSTS for test flexibility
            basePolicy.hsts.maxAge = 86400; // 1 day
            
            logger.info('Test security policy configured', {
                cspEnforced: true,
                hstsReduced: true,
                testHostsAllowed: true
            });
            break;

        case 'production':
        default:
            logger.debug('Applying production-specific security policy adjustments');
            
            // Strict CSP for production security
            basePolicy.contentSecurityPolicy.directives.scriptSrc = ["'self'"];
            basePolicy.contentSecurityPolicy.directives.styleSrc = ["'self'"];
            basePolicy.contentSecurityPolicy.reportOnly = false;
            
            // Maximum HSTS enforcement
            basePolicy.hsts.maxAge = SECURITY_DEFAULTS.HSTS_MAX_AGE;
            basePolicy.hsts.includeSubDomains = true;
            basePolicy.hsts.preload = true;
            
            // Strict frame options
            basePolicy.frameguard = { action: 'deny' };
            
            logger.info('Production security policy configured', {
                cspStrict: true,
                hstsMaximum: true,
                frameDenied: true
            });
            break;
    }

    return basePolicy;
}

/**
 * Validate security configuration object structure and values
 * Ensures that provided security configurations meet requirements and contain
 * valid values for all security policy directives.
 * 
 * @param {Object} securityConfig - Security configuration object to validate
 * @returns {Object} Validation result with isValid boolean and error details
 */
function validateSecurityConfig(securityConfig) {
    logger.debug('Validating security configuration', { 
        configType: typeof securityConfig,
        hasConfig: !!securityConfig 
    });

    const validationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    // Basic structure validation
    if (!util.isObject(securityConfig)) {
        validationResult.isValid = false;
        validationResult.errors.push('Security configuration must be an object');
        logger.error('Security configuration validation failed: not an object', {
            providedType: typeof securityConfig,
            providedValue: util.inspect(securityConfig, { depth: 2 })
        });
        return validationResult;
    }

    // Validate Content Security Policy structure
    if (securityConfig.contentSecurityPolicy) {
        const csp = securityConfig.contentSecurityPolicy;
        
        if (!util.isObject(csp.directives)) {
            validationResult.errors.push('CSP directives must be an object');
        } else {
            // Validate required CSP directives
            const requiredDirectives = ['defaultSrc', 'scriptSrc', 'styleSrc'];
            requiredDirectives.forEach(directive => {
                if (!Array.isArray(csp.directives[directive])) {
                    validationResult.warnings.push(
                        util.format('CSP directive %s should be an array', directive)
                    );
                }
            });
        }
    }

    // Validate HSTS configuration
    if (securityConfig.hsts && securityConfig.hsts !== false) {
        const hsts = securityConfig.hsts;
        
        if (typeof hsts.maxAge !== 'number' || hsts.maxAge < 0) {
            validationResult.errors.push('HSTS maxAge must be a non-negative number');
        }
        
        if (hsts.maxAge < 86400) { // Less than 1 day
            validationResult.warnings.push('HSTS maxAge less than 1 day is not recommended');
        }
    }

    // Validate frame guard configuration
    if (securityConfig.frameguard) {
        const validActions = ['deny', 'sameorigin'];
        if (securityConfig.frameguard.action && 
            !validActions.includes(securityConfig.frameguard.action)) {
            validationResult.errors.push(
                util.format('Frameguard action must be one of: %s', validActions.join(', '))
            );
        }
    }

    // Validate referrer policy
    if (securityConfig.referrerPolicy) {
        const validPolicies = [
            'no-referrer',
            'no-referrer-when-downgrade', 
            'origin',
            'origin-when-cross-origin',
            'same-origin',
            'strict-origin',
            'strict-origin-when-cross-origin',
            'unsafe-url'
        ];
        
        const policy = securityConfig.referrerPolicy.policy;
        if (policy && !validPolicies.includes(policy)) {
            validationResult.errors.push(
                util.format('Referrer policy must be one of: %s', validPolicies.join(', '))
            );
        }
    }

    // Log validation results
    if (validationResult.errors.length > 0) {
        validationResult.isValid = false;
        logger.error('Security configuration validation failed', {
            errorCount: validationResult.errors.length,
            errors: validationResult.errors,
            warningCount: validationResult.warnings.length,
            warnings: validationResult.warnings
        });
    } else {
        logger.info('Security configuration validation passed', {
            warningCount: validationResult.warnings.length,
            warnings: validationResult.warnings
        });
    }

    return validationResult;
}

/**
 * Get environment-specific security configuration with validation and fallbacks
 * Combines environment detection, policy creation, and validation into a single
 * comprehensive configuration function.
 * 
 * @param {string} environment - Optional environment override
 * @returns {Object} Complete security configuration for the specified environment
 */
function getEnvironmentSecurityConfig(environment = null) {
    // Determine target environment with fallback chain
    const targetEnvironment = environment || 
                            config.nodeEnv || 
                            process.env.NODE_ENV || 
                            'development';

    logger.info('Generating environment security configuration', {
        targetEnvironment,
        configEnvironment: config.nodeEnv,
        processEnvironment: process.env.NODE_ENV,
        isDevelopment: config.isDevelopment,
        isProduction: config.isProduction
    });

    // Create environment-specific policy
    const securityPolicy = createSecurityPolicy(targetEnvironment);

    // Validate the generated policy
    const validation = validateSecurityConfig(securityPolicy);
    
    if (!validation.isValid) {
        logger.error('Generated security policy failed validation', {
            environment: targetEnvironment,
            errors: validation.errors
        });
        throw new Error(util.format(
            'Security policy validation failed for environment %s: %s',
            targetEnvironment,
            validation.errors.join(', ')
        ));
    }

    // Log successful configuration generation
    logger.info('Security configuration generated successfully', {
        environment: targetEnvironment,
        cspDirectiveCount: Object.keys(securityPolicy.contentSecurityPolicy.directives).length,
        hstsEnabled: !!securityPolicy.hsts,
        validationWarnings: validation.warnings.length
    });

    return securityPolicy;
}

/**
 * Main security configuration middleware function
 * Creates and configures helmet middleware with environment-specific security policies.
 * This is the primary export that integrates with Express.js application middleware stack.
 * 
 * @param {Object} options - Optional configuration overrides
 * @returns {Function} Configured helmet middleware function
 */
function securityConfig(options = {}) {
    logger.info('Initializing security middleware configuration', {
        environment: config.nodeEnv,
        isDevelopment: config.isDevelopment,
        isProduction: config.isProduction,
        hasOptions: Object.keys(options).length > 0
    });

    try {
        // Get base environment security configuration
        const baseConfig = getEnvironmentSecurityConfig();
        
        // Merge with provided options (options take precedence)
        const finalConfig = {
            ...baseConfig,
            ...options
        };

        // Validate final configuration
        const validation = validateSecurityConfig(finalConfig);
        if (!validation.isValid) {
            throw new Error(util.format(
                'Final security configuration validation failed: %s',
                validation.errors.join(', ')
            ));
        }

        // Log configuration warnings
        if (validation.warnings.length > 0) {
            logger.warn('Security configuration has warnings', {
                warningCount: validation.warnings.length,
                warnings: validation.warnings
            });
        }

        // Create helmet middleware with final configuration
        const helmetMiddleware = helmet(finalConfig);

        logger.info('Security middleware initialized successfully', {
            environment: config.nodeEnv,
            configurationOptions: Object.keys(finalConfig).length,
            cspEnabled: !!finalConfig.contentSecurityPolicy,
            hstsEnabled: !!finalConfig.hsts,
            frameguardEnabled: !!finalConfig.frameguard,
            xssFilterEnabled: !!finalConfig.xssFilter
        });

        return helmetMiddleware;

    } catch (error) {
        logger.error('Security middleware initialization failed', {
            environment: config.nodeEnv,
            errorMessage: error.message,
            errorStack: error.stack
        }, error);

        // In development, log detailed error information
        if (config.isDevelopment) {
            logger.debug('Security middleware initialization error details', {
                options: util.inspect(options, { depth: 3 }),
                configState: {
                    nodeEnv: config.nodeEnv,
                    isDevelopment: config.isDevelopment,
                    isProduction: config.isProduction
                }
            });
        }

        throw error;
    }
}

// Export all required functions and constants
module.exports = securityConfig;
module.exports.createSecurityPolicy = createSecurityPolicy;
module.exports.validateSecurityConfig = validateSecurityConfig;
module.exports.SECURITY_DEFAULTS = SECURITY_DEFAULTS;
module.exports.getEnvironmentSecurityConfig = getEnvironmentSecurityConfig;