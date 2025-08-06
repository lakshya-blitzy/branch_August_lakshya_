/**
 * Mock Environment Variables and Deployment Scenario Configurations
 * 
 * This module provides comprehensive environment variable mocking utilities for testing 
 * Node.js server applications across different deployment scenarios including development,
 * testing, staging, CI/CD, and production environments.
 * 
 * Features:
 * - Pre-configured environment scenarios for all deployment contexts
 * - Safe mocking and restoration of process.env variables
 * - Thread-safe environment isolation for parallel test execution
 * - Custom environment configuration creation
 * - CI/CD pipeline integration support
 * 
 * @module mockEnvironment
 */

const process = require('process');

/**
 * Store for original environment variables to enable safe restoration
 * @private
 */
let originalEnv = { ...process.env };

/**
 * Currently active mock environment variables
 * @private
 */
let activeMockEnv = null;

/**
 * Pre-configured environment variable sets for different deployment scenarios.
 * Each environment includes comprehensive settings for NODE_ENV, debugging flags,
 * CI/CD configurations, PORT settings, and environment-specific parameters.
 */
const mockEnvironment = {
    /**
     * Development Environment Configuration
     * Optimized for local development with debugging enabled and relaxed security
     */
    development: {
        NODE_ENV: 'development',
        DEBUG: 'true',
        PORT: '3000',
        HOST: 'localhost',
        LOG_LEVEL: 'debug',
        CORS_ENABLED: 'true',
        RATE_LIMITING: 'false',
        SSL_ENABLED: 'false',
        SESSION_SECRET: 'dev-secret-key',
        DB_POOL_SIZE: '5',
        REQUEST_TIMEOUT: '30000',
        CACHE_ENABLED: 'false',
        METRICS_ENABLED: 'true',
        ERROR_STACK_TRACE: 'true',
        HOT_RELOAD: 'true',
        WEBPACK_DEV_SERVER: 'true',
        SOURCE_MAPS: 'true',
        MINIFICATION: 'false',
        BUNDLE_ANALYZER: 'false',
        AUTO_OPEN_BROWSER: 'true'
    },

    /**
     * Testing Environment Configuration
     * Isolated test execution with controlled dependencies and CI/CD integration
     */
    testing: {
        NODE_ENV: 'test',
        DEBUG: 'false',
        PORT: '0', // Dynamic port assignment for test isolation
        HOST: '127.0.0.1',
        LOG_LEVEL: 'error',
        CORS_ENABLED: 'false',
        RATE_LIMITING: 'false',
        SSL_ENABLED: 'false',
        SESSION_SECRET: 'test-secret-key',
        DB_POOL_SIZE: '2',
        REQUEST_TIMEOUT: '5000',
        CACHE_ENABLED: 'false',
        METRICS_ENABLED: 'false',
        ERROR_STACK_TRACE: 'true',
        PARALLEL_TESTS: 'true',
        TEST_TIMEOUT: '10000',
        MOCK_EXTERNAL_APIS: 'true',
        DISABLE_LOGGING: 'false',
        FORCE_EXIT: 'true',
        COVERAGE_ENABLED: 'true',
        JEST_WORKER_ID: '1',
        CI_PARALLEL_VARS: 'JEST_WORKER_ID'
    },

    /**
     * Production Environment Configuration
     * Security-hardened settings for production deployment
     */
    production: {
        NODE_ENV: 'production',
        DEBUG: 'false',
        PORT: '8080',
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
        CORS_ENABLED: 'true',
        RATE_LIMITING: 'true',
        SSL_ENABLED: 'true',
        SESSION_SECRET: undefined, // Must be provided via external configuration
        DB_POOL_SIZE: '20',
        REQUEST_TIMEOUT: '30000',
        CACHE_ENABLED: 'true',
        METRICS_ENABLED: 'true',
        ERROR_STACK_TRACE: 'false',
        COMPRESSION_ENABLED: 'true',
        CLUSTER_ENABLED: 'true',
        WORKER_PROCESSES: 'auto',
        GRACEFUL_SHUTDOWN_TIMEOUT: '15000',
        HEALTH_CHECK_ENABLED: 'true',
        SECURITY_HEADERS: 'true',
        CSP_ENABLED: 'true',
        HSTS_ENABLED: 'true'
    },

    /**
     * Continuous Integration Environment Configuration
     * Optimized for CI/CD pipeline execution with parallel processing support
     */
    ci: {
        NODE_ENV: 'test',
        DEBUG: 'false',
        PORT: '0', // Dynamic port assignment
        HOST: 'localhost',
        LOG_LEVEL: 'warn',
        CORS_ENABLED: 'false',
        RATE_LIMITING: 'false',
        SSL_ENABLED: 'false',
        SESSION_SECRET: 'ci-test-secret',
        DB_POOL_SIZE: '3',
        REQUEST_TIMEOUT: '10000',
        CACHE_ENABLED: 'false',
        METRICS_ENABLED: 'false',
        ERROR_STACK_TRACE: 'true',
        CI: 'true',
        CONTINUOUS_INTEGRATION: 'true',
        JENKINS_BUILD_ID: '123',
        PARALLEL_TESTS: 'true',
        MAX_WORKERS: '4',
        WORKER_IDLE_MEMORY_LIMIT: '512MB',
        COVERAGE_THRESHOLD: '85',
        FAIL_FAST: 'true',
        VERBOSE_LOGGING: 'false',
        ARTIFACT_STORAGE: 'true',
        TEST_RESULTS_FORMAT: 'junit',
        PERFORMANCE_BUDGET: 'true'
    },

    /**
     * Staging Environment Configuration
     * Production-like environment for final validation before deployment
     */
    staging: {
        NODE_ENV: 'staging',
        DEBUG: 'false',
        PORT: '8080',
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
        CORS_ENABLED: 'true',
        RATE_LIMITING: 'true',
        SSL_ENABLED: 'true',
        SESSION_SECRET: 'staging-secret-key',
        DB_POOL_SIZE: '10',
        REQUEST_TIMEOUT: '30000',
        CACHE_ENABLED: 'true',
        METRICS_ENABLED: 'true',
        ERROR_STACK_TRACE: 'true',
        MONITORING_ENABLED: 'true',
        PROFILING_ENABLED: 'true',
        LOAD_TESTING: 'false',
        SMOKE_TESTS: 'true',
        INTEGRATION_TESTS: 'true',
        PERFORMANCE_TESTS: 'false',
        SECURITY_SCAN: 'true',
        VULNERABILITY_CHECK: 'true',
        DEPENDENCY_AUDIT: 'true'
    },

    /**
     * Custom Environment Template
     * Base template for creating custom environment configurations
     */
    custom: {
        NODE_ENV: 'development',
        DEBUG: 'true',
        PORT: '3000',
        HOST: 'localhost',
        LOG_LEVEL: 'debug',
        CORS_ENABLED: 'true',
        RATE_LIMITING: 'false',
        SSL_ENABLED: 'false',
        SESSION_SECRET: 'custom-secret-key',
        DB_POOL_SIZE: '5',
        REQUEST_TIMEOUT: '30000',
        CACHE_ENABLED: 'false',
        METRICS_ENABLED: 'true',
        ERROR_STACK_TRACE: 'true'
    }
};

/**
 * Safely mock environment variables with the specified configuration.
 * Preserves original environment for restoration and applies thread-safe mocking.
 * 
 * @param {Object} envConfig - Environment variable configuration object
 * @param {boolean} [preserveExisting=false] - Whether to preserve existing environment variables
 * @throws {Error} If envConfig is not a valid object
 * 
 * @example
 * // Mock development environment
 * mockEnv(mockEnvironment.development);
 * 
 * @example
 * // Mock custom environment with preservation
 * mockEnv({ NODE_ENV: 'test', PORT: '4000' }, true);
 */
function mockEnv(envConfig, preserveExisting = false) {
    // Validate input parameters
    if (!envConfig || typeof envConfig !== 'object' || Array.isArray(envConfig)) {
        throw new Error('Environment configuration must be a valid object');
    }

    // Store original environment if not already stored
    if (!activeMockEnv) {
        originalEnv = { ...process.env };
    }

    // Clear current environment if not preserving existing variables
    if (!preserveExisting) {
        // Clear all environment variables except critical Node.js internals
        const criticalVars = ['PATH', 'HOME', 'USER', 'TMPDIR', 'NODE', 'npm_config_cache'];
        for (const key in process.env) {
            if (!criticalVars.includes(key)) {
                delete process.env[key];
            }
        }
    }

    // Apply new environment configuration
    for (const [key, value] of Object.entries(envConfig)) {
        if (value !== undefined) {
            process.env[key] = String(value);
        }
    }

    // Store reference to active mock environment
    activeMockEnv = { ...envConfig };

    // Validate essential process properties are accessible
    try {
        // Test access to essential process properties used in testing
        const testAccess = {
            env: process.env.NODE_ENV,
            argv: process.argv.length,
            cwd: process.cwd(),
            platform: process.platform
        };
        
        // Verify process.exit function is available (without calling it)
        if (typeof process.exit !== 'function') {
            throw new Error('Process.exit function not accessible');
        }
    } catch (error) {
        throw new Error(`Failed to access essential process properties: ${error.message}`);
    }
}

/**
 * Restore the original environment variables, undoing all mocking changes.
 * Ensures complete cleanup and thread-safe restoration.
 * 
 * @throws {Error} If restoration fails or original environment was not preserved
 * 
 * @example
 * // Restore original environment after testing
 * mockEnv(mockEnvironment.testing);
 * // ... run tests ...
 * restoreEnv();
 */
function restoreEnv() {
    if (!originalEnv) {
        throw new Error('Original environment not preserved - cannot restore');
    }

    try {
        // Clear all current environment variables
        for (const key in process.env) {
            delete process.env[key];
        }

        // Restore original environment variables
        for (const [key, value] of Object.entries(originalEnv)) {
            if (value !== undefined) {
                process.env[key] = value;
            }
        }

        // Clear active mock environment reference
        activeMockEnv = null;

        // Validate restoration by checking critical environment variables
        const restorationCheck = {
            pathExists: process.env.PATH !== undefined,
            nodeEnvRestored: process.env.NODE_ENV === originalEnv.NODE_ENV,
            processPropsAccessible: process.cwd() && process.platform && process.argv
        };

        if (!restorationCheck.pathExists) {
            throw new Error('Critical PATH environment variable not restored');
        }

    } catch (error) {
        throw new Error(`Environment restoration failed: ${error.message}`);
    }
}

/**
 * Create a custom environment configuration by merging base configuration with overrides.
 * Supports deep merging and validation of environment variable values.
 * 
 * @param {string} baseEnv - Base environment name ('development', 'testing', 'production', etc.)
 * @param {Object} overrides - Environment variable overrides and additions
 * @returns {Object} Custom environment configuration object
 * @throws {Error} If baseEnv is invalid or overrides are malformed
 * 
 * @example
 * // Create custom test environment with different port
 * const customTestEnv = createCustomEnv('testing', {
 *     PORT: '4000',
 *     DEBUG: 'true',
 *     CUSTOM_API_URL: 'http://localhost:3001'
 * });
 * mockEnv(customTestEnv);
 * 
 * @example
 * // Create custom CI environment with increased timeouts
 * const customCiEnv = createCustomEnv('ci', {
 *     REQUEST_TIMEOUT: '60000',
 *     TEST_TIMEOUT: '30000'
 * });
 */
function createCustomEnv(baseEnv, overrides = {}) {
    // Validate base environment
    if (!baseEnv || typeof baseEnv !== 'string') {
        throw new Error('Base environment must be a valid string');
    }

    if (!mockEnvironment[baseEnv]) {
        const availableEnvs = Object.keys(mockEnvironment).join(', ');
        throw new Error(`Invalid base environment '${baseEnv}'. Available: ${availableEnvs}`);
    }

    // Validate overrides
    if (overrides && (typeof overrides !== 'object' || Array.isArray(overrides))) {
        throw new Error('Environment overrides must be a valid object');
    }

    try {
        // Create deep copy of base environment to avoid mutation
        const baseConfig = JSON.parse(JSON.stringify(mockEnvironment[baseEnv]));
        
        // Apply overrides with validation
        const customConfig = { ...baseConfig };
        for (const [key, value] of Object.entries(overrides)) {
            // Validate environment variable name
            if (typeof key !== 'string' || key.trim() === '') {
                throw new Error(`Invalid environment variable name: '${key}'`);
            }

            // Convert value to string (environment variables are always strings)
            if (value !== undefined && value !== null) {
                customConfig[key] = String(value);
            } else {
                customConfig[key] = undefined;
            }
        }

        // Validate essential configuration parameters
        if (customConfig.NODE_ENV && !['development', 'test', 'staging', 'production'].includes(customConfig.NODE_ENV)) {
            console.warn(`Warning: Non-standard NODE_ENV value '${customConfig.NODE_ENV}'`);
        }

        if (customConfig.PORT && isNaN(parseInt(customConfig.PORT)) && customConfig.PORT !== '0') {
            throw new Error(`Invalid PORT value '${customConfig.PORT}' - must be a number or '0'`);
        }

        return customConfig;

    } catch (error) {
        throw new Error(`Failed to create custom environment: ${error.message}`);
    }
}

/**
 * Get a copy of the original environment variables before any mocking was applied.
 * Useful for validation, debugging, and manual restoration scenarios.
 * 
 * @returns {Object} Copy of original environment variables
 * @throws {Error} If original environment was not preserved
 * 
 * @example
 * // Compare current environment with original
 * const original = getOriginalEnv();
 * console.log('Original NODE_ENV:', original.NODE_ENV);
 * console.log('Current NODE_ENV:', process.env.NODE_ENV);
 * 
 * @example
 * // Validate specific original environment variable
 * const original = getOriginalEnv();
 * if (original.PORT) {
 *     console.log('Original port was:', original.PORT);
 * }
 */
function getOriginalEnv() {
    if (!originalEnv) {
        throw new Error('Original environment not preserved - cannot retrieve');
    }

    try {
        // Return deep copy to prevent accidental modification
        return JSON.parse(JSON.stringify(originalEnv));
    } catch (error) {
        // Fallback to shallow copy if JSON serialization fails
        return { ...originalEnv };
    }
}

/**
 * Utility function to validate current environment meets testing requirements.
 * Checks for required environment variables and validates their values.
 * 
 * @private
 * @param {string[]} requiredVars - Array of required environment variable names
 * @returns {boolean} True if all requirements are met
 */
function validateEnvironment(requiredVars = []) {
    for (const varName of requiredVars) {
        if (process.env[varName] === undefined) {
            return false;
        }
    }
    return true;
}

/**
 * Get current environment status and configuration summary.
 * Useful for debugging and test environment validation.
 * 
 * @private
 * @returns {Object} Current environment status
 */
function getEnvironmentStatus() {
    return {
        isMocked: activeMockEnv !== null,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        debug: process.env.DEBUG,
        ci: process.env.CI,
        activeMockConfig: activeMockEnv ? Object.keys(activeMockEnv) : null,
        processProps: {
            platform: process.platform,
            argv: process.argv.length,
            cwd: process.cwd()
        }
    };
}

// Export default mockEnvironment object and utility functions
module.exports = {
    // Default export - pre-configured environment scenarios
    default: mockEnvironment,
    
    // Named exports - utility functions
    mockEnv,
    restoreEnv,
    createCustomEnv,
    getOriginalEnv,
    
    // Additional utility exports for advanced use cases
    validateEnvironment,
    getEnvironmentStatus
};

// Also support ES6 default export syntax for compatibility
module.exports.mockEnvironment = mockEnvironment;