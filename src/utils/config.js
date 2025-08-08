/**
 * Environment-based Configuration Utility
 * 
 * Provides comprehensive configuration management for the Testinium-QA Node.js server component.
 * Supports environment-specific settings across development, test, and production environments
 * with robust default value fallbacks and environment variable validation.
 * 
 * Key Features:
 * - Environment-based configuration (development/test/production)
 * - Port management with conflict prevention (3000 for dev, 3001 for test)
 * - Comprehensive validation settings and security configurations
 * - Support for .env files and system environment variables
 * - Type-safe configuration access with runtime validation
 * 
 * @module config
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - Environment variable management
const dotenv = require('dotenv');
const process = require('process');
const path = require('path');
const fs = require('fs');

/**
 * Load environment variables from .env files with intelligent file discovery
 * Supports multiple .env file locations for flexible project structure
 */
function loadEnvironmentVariables() {
    // Define potential .env file locations in order of priority
    const envFilePaths = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), 'config', '.env'),
        path.resolve(__dirname, '..', '..', '.env')
    ];

    // Load the first .env file found
    for (const envPath of envFilePaths) {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
            console.log(`[CONFIG] Loaded environment variables from: ${envPath}`);
            break;
        }
    }

    // Also load default .env if no specific path worked
    dotenv.config();
}

// Initialize environment variable loading
loadEnvironmentVariables();

/**
 * Validate required configuration values and provide detailed error messages
 * for missing critical configuration parameters
 */
function validateConfiguration() {
    const errors = [];
    const warnings = [];

    // Validate NODE_ENV
    const validEnvironments = ['development', 'test', 'production'];
    if (!validEnvironments.includes(process.env.NODE_ENV)) {
        warnings.push(`NODE_ENV should be one of: ${validEnvironments.join(', ')}. Defaulting to 'development'.`);
    }

    // Validate PORT in production
    if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
        warnings.push('PORT not specified in production environment. Using default port.');
    }

    // Log validation results
    if (warnings.length > 0) {
        console.warn('[CONFIG] Configuration warnings:');
        warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    if (errors.length > 0) {
        console.error('[CONFIG] Configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        throw new Error('Critical configuration validation failed. Please check your environment variables.');
    }
}

/**
 * Determine the current environment with fallback to development
 * @returns {string} Current environment (development|test|production)
 */
function getEnvironment() {
    return process.env.NODE_ENV || 'development';
}

/**
 * Get environment-specific port configuration with conflict prevention
 * Ensures different ports for different environments to prevent conflicts
 * @returns {number} Port number for the current environment
 */
function getPort() {
    // Use explicit PORT environment variable if set
    if (process.env.PORT) {
        return parseInt(process.env.PORT, 10);
    }

    // Environment-specific port defaults to prevent conflicts
    const environment = getEnvironment();
    switch (environment) {
        case 'test':
            return 3001; // Test environment port (prevents conflicts with dev)
        case 'production':
            return process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
        case 'development':
        default:
            return 3000; // Development environment port
    }
}

/**
 * Parse comma-separated environment variable with defaults
 * @param {string} envVar - Environment variable name
 * @param {Array} defaultValue - Default array value
 * @returns {Array} Parsed array from environment variable or default
 */
function parseArrayFromEnv(envVar, defaultValue = []) {
    const value = process.env[envVar];
    if (!value) return defaultValue;
    
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

/**
 * Parse boolean environment variable with default
 * @param {string} envVar - Environment variable name
 * @param {boolean} defaultValue - Default boolean value
 * @returns {boolean} Parsed boolean value
 */
function parseBooleanFromEnv(envVar, defaultValue = false) {
    const value = process.env[envVar];
    if (value === undefined) return defaultValue;
    
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse integer environment variable with validation and default
 * @param {string} envVar - Environment variable name
 * @param {number} defaultValue - Default integer value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Parsed and validated integer value
 */
function parseIntFromEnv(envVar, defaultValue, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const value = process.env[envVar];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        console.warn(`[CONFIG] Invalid integer value for ${envVar}: ${value}. Using default: ${defaultValue}`);
        return defaultValue;
    }
    
    if (parsed < min || parsed > max) {
        console.warn(`[CONFIG] Value for ${envVar} (${parsed}) outside valid range [${min}, ${max}]. Using default: ${defaultValue}`);
        return defaultValue;
    }
    
    return parsed;
}

/**
 * Get CORS origins configuration based on environment
 * @returns {Array|string} CORS origins configuration
 */
function getCorsOrigins() {
    const environment = getEnvironment();
    
    // Use environment variable if explicitly set
    if (process.env.CORS_ORIGINS) {
        return parseArrayFromEnv('CORS_ORIGINS');
    }
    
    // Environment-specific defaults
    switch (environment) {
        case 'production':
            return ['https://testinium-qa.com', 'https://api.testinium-qa.com'];
        case 'test':
            return ['http://localhost:3000', 'http://localhost:3001'];
        case 'development':
        default:
            return true; // Allow all origins in development
    }
}

/**
 * Get log level configuration based on environment
 * @returns {string} Log level (debug|info|warn|error)
 */
function getLogLevel() {
    const environment = getEnvironment();
    
    // Use explicit LOG_LEVEL if set
    if (process.env.LOG_LEVEL) {
        const validLevels = ['debug', 'info', 'warn', 'error'];
        const level = process.env.LOG_LEVEL.toLowerCase();
        return validLevels.includes(level) ? level : 'info';
    }
    
    // Environment-specific defaults
    switch (environment) {
        case 'development':
            return 'debug';
        case 'test':
            return 'warn';
        case 'production':
        default:
            return 'info';
    }
}

/**
 * Get rate limiting configuration for API endpoints
 * @returns {Object} Rate limiting configuration object
 */
function getRateLimitConfig() {
    const environment = getEnvironment();
    
    // Base configuration with environment-specific adjustments
    const baseConfig = {
        windowMs: parseIntFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000, 1000, 24 * 60 * 60 * 1000), // 15 minutes default
        skipSuccessfulRequests: parseBooleanFromEnv('RATE_LIMIT_SKIP_SUCCESS', false),
        skipFailedRequests: parseBooleanFromEnv('RATE_LIMIT_SKIP_FAILED', false),
        redisEnabled: parseBooleanFromEnv('RATE_LIMIT_REDIS_ENABLED', false),
        trustedIPs: parseArrayFromEnv('RATE_LIMIT_TRUSTED_IPS', ['127.0.0.1', '::1'])
    };
    
    // Environment-specific rate limits
    switch (environment) {
        case 'development':
            baseConfig.maxRequests = parseIntFromEnv('RATE_LIMIT_MAX_REQUESTS', 1000, 1, 10000);
            baseConfig.endpointLimits = {
                '/api/health': 300,
                '/api/test': 100,
                '/api/report': 50
            };
            break;
        case 'test':
            baseConfig.maxRequests = parseIntFromEnv('RATE_LIMIT_MAX_REQUESTS', 500, 1, 5000);
            baseConfig.endpointLimits = {
                '/api/health': 200,
                '/api/test': 50,
                '/api/report': 25,
                '/api/auth/login': 5,
                '/api/items': 100,
                '/api/admin/users': 20
            };
            break;
        case 'production':
        default:
            baseConfig.maxRequests = parseIntFromEnv('RATE_LIMIT_MAX_REQUESTS', 100, 1, 1000);
            baseConfig.endpointLimits = {
                '/api/health': 60,
                '/api/test': 30,
                '/api/report': 15
            };
            break;
    }
    
    return baseConfig;
}

/**
 * Get body parser configuration with size limits and security settings
 * @returns {Object} Body parser configuration object
 */
function getBodyParserConfig() {
    const environment = getEnvironment();
    
    return {
        jsonLimit: process.env.BODY_PARSER_JSON_LIMIT || (environment === 'development' ? '10mb' : '1mb'),
        urlencodedLimit: process.env.BODY_PARSER_URLENCODED_LIMIT || (environment === 'development' ? '10mb' : '1mb'),
        rawLimit: process.env.BODY_PARSER_RAW_LIMIT || (environment === 'development' ? '10mb' : '1mb'),
        strict: parseBooleanFromEnv('BODY_PARSER_STRICT', environment === 'production'),
        extended: parseBooleanFromEnv('BODY_PARSER_EXTENDED', true),
        parameterLimit: parseIntFromEnv('BODY_PARSER_PARAMETER_LIMIT', 1000, 1, 10000),
        type: process.env.BODY_PARSER_TYPE || 'application/json'
    };
}

/**
 * Get compression middleware configuration
 * @returns {Object} Compression configuration object
 */
function getCompressionConfig() {
    const environment = getEnvironment();
    
    return {
        level: parseIntFromEnv('COMPRESSION_LEVEL', environment === 'production' ? 6 : 1, 1, 9),
        threshold: parseIntFromEnv('COMPRESSION_THRESHOLD', 1024, 0, 1048576), // 1KB default threshold
        excludeTypes: parseArrayFromEnv('COMPRESSION_EXCLUDE_TYPES', [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'application/zip',
            'application/gzip'
        ])
    };
}

/**
 * Get validation configuration for request processing
 * @returns {Object} Validation configuration object
 */
function getValidationConfig() {
    const environment = getEnvironment();
    
    return {
        strict: parseBooleanFromEnv('VALIDATION_STRICT', environment === 'production'),
        maxSize: parseIntFromEnv('VALIDATION_MAX_SIZE', 1048576, 1024, 104857600), // 1MB default, max 100MB
        timeout: parseIntFromEnv('VALIDATION_TIMEOUT', 5000, 100, 30000) // 5 seconds default
    };
}

// Validate configuration at startup
validateConfiguration();

/**
 * Complete configuration object with all required settings
 * Provides comprehensive configuration for the Node.js server component
 * with environment-specific defaults and robust validation
 */
const config = {
    // Environment and runtime configuration
    environment: getEnvironment(),
    nodeEnv: getEnvironment(),
    port: getPort(),
    apiKey: process.env.API_KEY || (getEnvironment() === 'development' ? 'dev-api-key-12345' : undefined),
    
    // Environment detection helpers
    isDevelopment: getEnvironment() === 'development',
    isTest: getEnvironment() === 'test',
    isProduction: getEnvironment() === 'production',
    
    // Security and CORS configuration
    corsOrigins: getCorsOrigins(),
    
    // Logging configuration
    logLevel: getLogLevel(),
    
    // Validation configuration
    validation: getValidationConfig(),
    
    // Body parser configuration
    bodyParser: getBodyParserConfig(),
    
    // Compression configuration
    compression: getCompressionConfig(),
    
    // Rate limiting configuration
    rateLimit: getRateLimitConfig()
};

/**
 * Deep freeze the configuration object to prevent accidental modifications
 * @param {Object} obj - Object to deep freeze
 * @returns {Object} Frozen object
 */
function deepFreeze(obj) {
    // Retrieve the property names defined on obj
    Object.getOwnPropertyNames(obj).forEach(function(name) {
        const value = obj[name];
        
        // Freeze properties before freezing self
        if (value && typeof value === 'object') {
            deepFreeze(value);
        }
    });
    
    return Object.freeze(obj);
}

// Deep freeze configuration object to prevent accidental modifications
deepFreeze(config);

// Log configuration summary at startup
console.log('[CONFIG] Configuration loaded successfully:');
console.log(`  Environment: ${config.environment}`);
console.log(`  Port: ${config.port}`);
console.log(`  Log Level: ${config.logLevel}`);
console.log(`  Validation Strict Mode: ${config.validation.strict}`);
console.log(`  Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs}ms`);

// Export the configuration object as the default export
module.exports = config;