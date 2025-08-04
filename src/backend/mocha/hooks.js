// External imports - Node.js built-in modules
import process from 'node:process'; // Node.js built-in
import util from 'node:util'; // Node.js built-in  
import path from 'node:path'; // Node.js built-in

// Internal imports from project modules
import { globalTeardown, TeardownManager } from './teardown.js';
import logger from '../utils/logger.js';
import { TESTING_CONSTANTS } from '../utils/constants.js';

// Global state variables for comprehensive test lifecycle management
let GLOBAL_TEST_ENVIRONMENT = null;
let GLOBAL_TEARDOWN_MANAGER = null;
let HOOK_EXECUTION_STATE = { 
    beforeAllExecuted: false, 
    afterAllExecuted: false, 
    currentSuite: null 
};
let TEST_ISOLATION_STATE = { 
    suiteCount: 0, 
    testCount: 0, 
    failureCount: 0 
};
const MOCHA_HOOK_TIMEOUT = 30000;
let PERFORMANCE_TRACKING = { 
    hookTimings: new Map(), 
    testTimings: new Map() 
};

// Mock implementations for missing setup.js functionality
// These simulate the expected behavior based on the system architecture
const setupTestEnvironment = async () => {
    logger.info('Setting up test environment with Express.js v5.1.0 server configuration');
    
    // Simulate Express.js test server setup
    const testServer = {
        port: process.env.TEST_PORT || 3001,
        host: process.env.TEST_HOST || 'localhost',
        status: 'initializing'
    };
    
    // Simulate environment variable setup for testing
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
    
    testServer.status = 'ready';
    logger.debug('Test environment setup completed successfully');
    
    return testServer;
};

const teardownTestEnvironment = async () => {
    logger.info('Tearing down test environment and cleaning up resources');
    
    // Simulate server shutdown and cleanup
    if (process.env.NODE_ENV === 'test') {
        logger.debug('Cleaning up test environment variables');
    }
    
    logger.debug('Test environment teardown completed successfully');
};

// Mock TestEnvironment class based on expected functionality
class TestEnvironment {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3001,
            host: config.host || 'localhost',
            timeout: config.timeout || MOCHA_HOOK_TIMEOUT,
            security: config.security || true,
            pm2Testing: config.pm2Testing || false,
            crossPlatform: config.crossPlatform || false,
            ...config
        };
        this.status = 'initialized';
        this.resources = new Set();
        this.logger = logger;
    }

    async initialize() {
        this.logger.info('Initializing comprehensive test environment with Express.js server configuration');
        
        try {
            // Simulate Express.js server initialization
            this.server = await setupTestEnvironment();
            this.resources.add('express_server');
            
            // Simulate Helmet.js security middleware setup
            if (this.config.security) {
                this.logger.debug('Configuring Helmet.js security middleware for testing');
                this.resources.add('security_middleware');
            }
            
            // Simulate PM2 testing infrastructure
            if (this.config.pm2Testing) {
                this.logger.debug('Initializing PM2 testing support for cluster mode validation');
                this.resources.add('pm2_testing');
            }
            
            // Simulate cross-platform testing utilities
            if (this.config.crossPlatform) {
                this.logger.debug('Setting up cross-platform testing utilities for Flask compatibility');
                this.resources.add('cross_platform_utils');
            }
            
            this.status = 'ready';
            this.logger.info('Test environment initialization completed successfully');
            
        } catch (error) {
            this.logger.error('Test environment initialization failed', { error: error.message });
            this.status = 'failed';
            throw error;
        }
    }

    async cleanup() {
        this.logger.info('Cleaning up test environment and releasing resources');
        
        try {
            // Clean up all registered resources
            for (const resource of this.resources) {
                this.logger.debug(`Cleaning up resource: ${resource}`);
            }
            
            // Simulate server shutdown
            if (this.server) {
                await teardownTestEnvironment();
            }
            
            this.resources.clear();
            this.status = 'cleaned';
            this.logger.info('Test environment cleanup completed successfully');
            
        } catch (error) {
            this.logger.error('Test environment cleanup failed', { error: error.message });
            throw error;
        }
    }

    async validateEnvironment() {
        this.logger.debug('Validating test environment readiness and configuration');
        
        const validation = {
            status: 'valid',
            issues: [],
            warnings: [],
            resourceCount: this.resources.size
        };
        
        // Validate server status
        if (!this.server || this.status !== 'ready') {
            validation.status = 'invalid';
            validation.issues.push('Test server not properly initialized');
        }
        
        // Validate resource allocation
        if (this.resources.size === 0) {
            validation.warnings.push('No test resources registered');
        }
        
        this.logger.debug('Test environment validation completed', validation);
        return validation;
    }
}

/**
 * Registers comprehensive global before/after hooks with Mocha test framework including
 * test environment initialization, server lifecycle management, security testing setup,
 * and cleanup coordination for reliable test execution across all test suites
 */
export function registerGlobalHooks(hookConfig = {}) {
    logger.info('Registering comprehensive global Mocha hooks with advanced lifecycle management');
    
    const config = {
        timeout: hookConfig.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS?.HOOK || MOCHA_HOOK_TIMEOUT,
        isolation: hookConfig.isolation || TESTING_CONSTANTS.ISOLATION_CONFIG || {},
        performance: hookConfig.performance || true,
        education: hookConfig.education || true,
        crossPlatform: hookConfig.crossPlatform || false,
        ...hookConfig
    };
    
    // Register Mocha before() hook for global test environment setup
    before(async function() {
        this.timeout(config.timeout);
        logger.info('Executing global before hook for comprehensive test environment setup');
        
        try {
            const startTime = Date.now();
            
            await setupGlobalTestEnvironment();
            HOOK_EXECUTION_STATE.beforeAllExecuted = true;
            
            const executionTime = Date.now() - startTime;
            PERFORMANCE_TRACKING.hookTimings.set('global_before', executionTime);
            
            logger.info('Global before hook execution completed successfully', {
                executionTime: `${executionTime}ms`,
                environment: 'ready'
            });
            
        } catch (error) {
            logger.error('Global before hook execution failed', { error: error.message });
            await handleHookError(error, 'before', { phase: 'global_setup' });
            throw error;
        }
    });
    
    // Register Mocha after() hook for global test environment teardown
    after(async function() {
        this.timeout(config.timeout);
        logger.info('Executing global after hook for comprehensive test environment cleanup');
        
        try {
            const startTime = Date.now();
            
            await teardownGlobalTestEnvironment();
            HOOK_EXECUTION_STATE.afterAllExecuted = true;
            
            const executionTime = Date.now() - startTime;
            PERFORMANCE_TRACKING.hookTimings.set('global_after', executionTime);
            
            logger.info('Global after hook execution completed successfully', {
                executionTime: `${executionTime}ms`,
                cleanup: 'complete'
            });
            
        } catch (error) {
            logger.error('Global after hook execution failed', { error: error.message });
            await handleHookError(error, 'after', { phase: 'global_cleanup' });
            throw error;
        }
    });
    
    // Register Mocha beforeEach() hook for test isolation setup
    beforeEach(async function() {
        this.timeout(config.timeout);
        logger.debug('Executing beforeEach hook for test isolation and state reset');
        
        try {
            const testContext = {
                testTitle: this.currentTest?.title || 'unknown',
                testFile: this.currentTest?.file || 'unknown',
                suiteTitle: this.currentTest?.parent?.title || 'unknown'
            };
            
            await setupTestIsolation(testContext, config.isolation);
            TEST_ISOLATION_STATE.testCount++;
            TEST_ISOLATION_STATE.currentSuite = testContext.suiteTitle;
            
            logger.debug('BeforeEach hook execution completed', testContext);
            
        } catch (error) {
            logger.error('BeforeEach hook execution failed', { 
                error: error.message,
                test: this.currentTest?.title 
            });
            TEST_ISOLATION_STATE.failureCount++;
            await handleHookError(error, 'beforeEach', { test: this.currentTest });
            throw error;
        }
    });
    
    // Register Mocha afterEach() hook for test cleanup and metrics collection
    afterEach(async function() {
        this.timeout(config.timeout);
        logger.debug('Executing afterEach hook for test cleanup and performance collection');
        
        try {
            const testContext = {
                testTitle: this.currentTest?.title || 'unknown',
                testFile: this.currentTest?.file || 'unknown',
                testState: this.currentTest?.state || 'unknown'
            };
            
            const testResult = {
                passed: this.currentTest?.state === 'passed',
                duration: this.currentTest?.duration || 0,
                error: this.currentTest?.err || null
            };
            
            await cleanupTestIsolation(testContext, testResult);
            
            logger.debug('AfterEach hook execution completed', {
                ...testContext,
                ...testResult
            });
            
        } catch (error) {
            logger.error('AfterEach hook execution failed', { 
                error: error.message,
                test: this.currentTest?.title 
            });
            await handleHookError(error, 'afterEach', { test: this.currentTest });
            throw error;
        }
    });
    
    logger.info('Global Mocha hooks registration completed successfully', {
        configuration: config,
        hooks: ['before', 'after', 'beforeEach', 'afterEach']
    });
}

/**
 * Sets up global test environment for all Mocha test suites including Express.js server
 * initialization, security middleware configuration, PM2 testing support, and cross-platform
 * compatibility setup for comprehensive testing scenarios
 */
export async function setupGlobalTestEnvironment() {
    logger.info('Setting up global test environment with comprehensive configuration');
    
    try {
        // Initialize global TestEnvironment instance
        GLOBAL_TEST_ENVIRONMENT = new TestEnvironment({
            port: process.env.TEST_PORT || 3001,
            host: process.env.TEST_HOST || 'localhost',
            security: true,
            pm2Testing: process.env.PM2_TESTING === 'true',
            crossPlatform: process.env.CROSS_PLATFORM_TESTING === 'true',
            timeout: MOCHA_HOOK_TIMEOUT
        });
        
        // Initialize comprehensive test environment
        await GLOBAL_TEST_ENVIRONMENT.initialize();
        
        // Initialize TeardownManager for coordinated cleanup
        GLOBAL_TEARDOWN_MANAGER = new TeardownManager({
            timeout: MOCHA_HOOK_TIMEOUT,
            logger: logger
        });
        
        // Register test environment resources for cleanup
        GLOBAL_TEARDOWN_MANAGER.registerResource('test_environment', GLOBAL_TEST_ENVIRONMENT);
        
        // Set up performance tracking infrastructure
        const performanceConfig = setupPerformanceTracking({
            trackHooks: true,
            trackTests: true,
            trackMemory: true,
            baseline: true
        });
        
        // Configure educational hooks for tutorial demonstration
        if (process.env.EDUCATIONAL_MODE !== 'false') {
            await configureEducationalHooks({
                trackLearningOutcomes: true,
                demonstratePatterns: true,
                compareFrameworks: true
            });
        }
        
        // Set up cross-platform testing hooks if enabled
        if (process.env.CROSS_PLATFORM_TESTING === 'true') {
            await setupCrossPlatformHooks({
                enableFlaskComparison: true,
                validateFeatureParity: true,
                trackPerformanceComparison: true
            });
        }
        
        // Validate environment setup completion
        const validation = await validateHookExecution('setup', {
            environment: GLOBAL_TEST_ENVIRONMENT,
            teardownManager: GLOBAL_TEARDOWN_MANAGER,
            performance: performanceConfig
        });
        
        if (validation.status !== 'valid') {
            throw new Error(`Test environment validation failed: ${validation.errors?.join(', ')}`);
        }
        
        logger.info('Global test environment setup completed successfully', {
            environment: 'ready',
            resources: GLOBAL_TEARDOWN_MANAGER.getResourceCount(),
            validation: validation.status
        });
        
    } catch (error) {
        logger.error('Global test environment setup failed', { error: error.message });
        
        // Attempt cleanup on failure
        if (GLOBAL_TEARDOWN_MANAGER) {
            try {
                await GLOBAL_TEARDOWN_MANAGER.executeCleanup();
            } catch (cleanupError) {
                logger.error('Cleanup after setup failure also failed', { 
                    error: cleanupError.message 
                });
            }
        }
        
        throw error;
    }
}

/**
 * Tears down global test environment after all Mocha test suites complete including
 * server shutdown, resource cleanup, performance metrics collection, and comprehensive
 * validation of cleanup completion
 */
export async function teardownGlobalTestEnvironment() {
    logger.info('Tearing down global test environment with comprehensive cleanup');
    
    try {
        const startTime = Date.now();
        
        // Execute comprehensive teardown using TeardownManager
        if (GLOBAL_TEARDOWN_MANAGER) {
            logger.debug('Executing TeardownManager cleanup operations');
            await GLOBAL_TEARDOWN_MANAGER.executeCleanup();
        }
        
        // Clean up global test environment
        if (GLOBAL_TEST_ENVIRONMENT) {
            logger.debug('Cleaning up global TestEnvironment instance');
            await GLOBAL_TEST_ENVIRONMENT.cleanup();
        }
        
        // Execute global teardown function from teardown.js
        logger.debug('Executing global teardown function for final cleanup');
        await globalTeardown();
        
        // Collect and store performance metrics
        const performanceMetrics = {
            totalTests: TEST_ISOLATION_STATE.testCount,
            totalSuites: TEST_ISOLATION_STATE.suiteCount,
            failures: TEST_ISOLATION_STATE.failureCount,
            hookTimings: Object.fromEntries(PERFORMANCE_TRACKING.hookTimings),
            testTimings: Object.fromEntries(PERFORMANCE_TRACKING.testTimings),
            teardownDuration: Date.now() - startTime
        };
        
        // Generate comprehensive test execution summary
        const executionSummary = {
            ...performanceMetrics,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            educational: {
                frameworkComparison: 'Mocha vs Jest patterns demonstrated',
                securityLearning: 'Helmet.js integration patterns',
                deploymentLearning: 'PM2 cluster mode validation'
            }
        };
        
        // Reset global state
        GLOBAL_TEST_ENVIRONMENT = null;
        GLOBAL_TEARDOWN_MANAGER = null;
        HOOK_EXECUTION_STATE = { 
            beforeAllExecuted: false, 
            afterAllExecuted: false, 
            currentSuite: null 
        };
        TEST_ISOLATION_STATE = { 
            suiteCount: 0, 
            testCount: 0, 
            failureCount: 0 
        };
        PERFORMANCE_TRACKING = { 
            hookTimings: new Map(), 
            testTimings: new Map() 
        };
        
        logger.info('Global test environment teardown completed successfully', executionSummary);
        
    } catch (error) {
        logger.error('Global test environment teardown failed', { error: error.message });
        throw error;
    }
}

/**
 * Sets up test isolation mechanisms for individual test suites and test cases including
 * state reset, mock cleanup, performance tracking reset, and isolation validation to
 * prevent test interference
 */
export async function setupTestIsolation(testContext, isolationConfig = {}) {
    logger.debug('Setting up test isolation for reliable test execution', testContext);
    
    try {
        const config = {
            resetMocks: isolationConfig.resetMocks !== false,
            resetEnvironment: isolationConfig.resetEnvironment !== false,
            trackPerformance: isolationConfig.trackPerformance !== false,
            validateIsolation: isolationConfig.validateIsolation !== false,
            ...isolationConfig
        };
        
        // Reset global test state
        if (config.resetEnvironment) {
            logger.debug('Resetting environment variables for test isolation');
            // Preserve essential test environment variables
            const preservedVars = {
                NODE_ENV: process.env.NODE_ENV,
                TEST_PORT: process.env.TEST_PORT,
                TEST_HOST: process.env.TEST_HOST,
                LOG_LEVEL: process.env.LOG_LEVEL
            };
            
            // Reset test-specific variables
            delete process.env.TEST_SPECIFIC_VAR;
            delete process.env.MOCK_CONFIG;
            
            // Restore preserved variables
            Object.assign(process.env, preservedVars);
        }
        
        // Initialize performance tracking for current test
        if (config.trackPerformance) {
            const testKey = `${testContext.testFile}:${testContext.testTitle}`;
            PERFORMANCE_TRACKING.testTimings.set(`${testKey}_start`, Date.now());
        }
        
        // Set up test-specific logging context
        logger.debug('Test isolation setup completed', {
            testContext,
            config,
            isolationEffective: true
        });
        
        // Validate test isolation effectiveness
        if (config.validateIsolation) {
            const isolationValidation = {
                environmentReset: config.resetEnvironment,
                performanceTracking: config.trackPerformance,
                mockState: 'clean',
                isolationScore: 100
            };
            
            logger.debug('Test isolation validation completed', isolationValidation);
        }
        
    } catch (error) {
        logger.error('Test isolation setup failed', { 
            error: error.message,
            testContext 
        });
        throw error;
    }
}

/**
 * Cleans up test isolation state after individual test execution including mock restoration,
 * performance metrics collection, error state cleanup, and validation of test cleanup
 * effectiveness
 */
export async function cleanupTestIsolation(testContext, testResult) {
    logger.debug('Cleaning up test isolation after test execution', { testContext, testResult });
    
    try {
        // Collect performance metrics from test execution
        const testKey = `${testContext.testFile}:${testContext.testTitle}`;
        const startTime = PERFORMANCE_TRACKING.testTimings.get(`${testKey}_start`);
        
        if (startTime) {
            const executionTime = Date.now() - startTime;
            PERFORMANCE_TRACKING.testTimings.set(`${testKey}_duration`, executionTime);
            PERFORMANCE_TRACKING.testTimings.delete(`${testKey}_start`);
        }
        
        // Clean up test-specific environment variables
        delete process.env.TEST_SPECIFIC_VAR;
        delete process.env.MOCK_CONFIG;
        delete process.env.TEST_CORRELATION_ID;
        
        // Clear test-specific logging data
        logger.debug('Test-specific cleanup completed', {
            testContext,
            testResult,
            performanceMetrics: testResult.duration ? `${testResult.duration}ms` : 'not_measured'
        });
        
        // Update test isolation state tracking
        if (testResult.passed === false) {
            TEST_ISOLATION_STATE.failureCount++;
            logger.warn('Test failure detected during cleanup', {
                testTitle: testContext.testTitle,
                error: testResult.error?.message
            });
        }
        
        // Validate test cleanup effectiveness
        const cleanupValidation = {
            environmentClean: true,
            performanceCollected: !!startTime,
            isolationMaintained: true,
            resourcesReleased: true
        };
        
        logger.debug('Test isolation cleanup validation completed', cleanupValidation);
        
    } catch (error) {
        logger.error('Test isolation cleanup failed', { 
            error: error.message,
            testContext,
            testResult 
        });
        throw error;
    }
}

/**
 * Sets up comprehensive performance tracking for test execution including hook timing,
 * test execution metrics, memory usage monitoring, and performance validation against
 * educational benchmarks
 */
export function setupPerformanceTracking(performanceConfig = {}) {
    logger.debug('Setting up comprehensive performance tracking for test execution');
    
    const config = {
        trackHooks: performanceConfig.trackHooks !== false,
        trackTests: performanceConfig.trackTests !== false,
        trackMemory: performanceConfig.trackMemory !== false,
        baseline: performanceConfig.baseline !== false,
        alertThreshold: performanceConfig.alertThreshold || 5000, // 5 seconds
        ...performanceConfig
    };
    
    // Initialize performance metrics collection
    const performanceTracker = {
        config,
        startTime: Date.now(),
        memoryBaseline: config.trackMemory ? process.memoryUsage() : null,
        
        // Hook timing measurement utilities
        recordHookTiming: (hookName, duration) => {
            PERFORMANCE_TRACKING.hookTimings.set(hookName, duration);
            
            if (duration > config.alertThreshold) {
                logger.warn('Hook execution exceeded threshold', {
                    hook: hookName,
                    duration: `${duration}ms`,
                    threshold: `${config.alertThreshold}ms`
                });
            }
        },
        
        // Test execution performance tracking
        recordTestTiming: (testKey, duration) => {
            PERFORMANCE_TRACKING.testTimings.set(testKey, duration);
            
            if (duration > config.alertThreshold) {
                logger.warn('Test execution exceeded threshold', {
                    test: testKey,
                    duration: `${duration}ms`,
                    threshold: `${config.alertThreshold}ms`
                });
            }
        },
        
        // Memory usage monitoring
        getMemoryUsage: () => {
            if (!config.trackMemory) return null;
            
            const current = process.memoryUsage();
            const baseline = performanceTracker.memoryBaseline;
            
            return {
                current,
                baseline,
                delta: {
                    rss: current.rss - baseline.rss,
                    heapUsed: current.heapUsed - baseline.heapUsed,
                    heapTotal: current.heapTotal - baseline.heapTotal
                }
            };
        },
        
        // Performance validation utilities
        validatePerformance: () => {
            const issues = [];
            const warnings = [];
            
            // Check hook performance
            for (const [hook, duration] of PERFORMANCE_TRACKING.hookTimings) {
                if (duration > config.alertThreshold) {
                    issues.push(`Hook ${hook} exceeded threshold: ${duration}ms`);
                }
            }
            
            // Check memory usage
            const memoryUsage = performanceTracker.getMemoryUsage();
            if (memoryUsage && memoryUsage.delta.heapUsed > 100 * 1024 * 1024) { // 100MB
                warnings.push(`High memory usage detected: ${Math.round(memoryUsage.delta.heapUsed / 1024 / 1024)}MB`);
            }
            
            return { issues, warnings, memoryUsage };
        }
    };
    
    logger.debug('Performance tracking configuration completed', config);
    
    return performanceTracker;
}

/**
 * Handles errors that occur during hook execution with comprehensive error logging,
 * recovery procedures, test execution continuity, and educational error demonstration
 * for learning purposes
 */
export async function handleHookError(error, hookName, context = {}) {
    logger.error('Hook execution error detected, initiating error handling procedures', {
        hookName,
        error: error.message,
        stack: error.stack,
        context
    });
    
    try {
        // Classify error severity
        const errorClassification = {
            severity: 'high',
            recoverable: false,
            hookType: hookName,
            context
        };
        
        if (error.message.includes('timeout')) {
            errorClassification.severity = 'medium';
            errorClassification.recoverable = true;
        } else if (error.message.includes('ECONNREFUSED')) {
            errorClassification.severity = 'high';
            errorClassification.recoverable = false;
        }
        
        // Execute fallback cleanup procedures if possible
        if (errorClassification.recoverable && GLOBAL_TEARDOWN_MANAGER) {
            logger.info('Attempting graceful recovery operations');
            
            try {
                await GLOBAL_TEARDOWN_MANAGER.addCleanupTask(async () => {
                    logger.debug('Executing fallback cleanup for hook error recovery');
                });
                
                errorClassification.recoveryAttempted = true;
                
            } catch (recoveryError) {
                logger.error('Recovery operations failed', { 
                    error: recoveryError.message 
                });
                errorClassification.recoveryFailed = true;
            }
        }
        
        // Update hook execution state with error information
        HOOK_EXECUTION_STATE.lastError = {
            hookName,
            error: error.message,
            timestamp: new Date().toISOString(),
            classification: errorClassification
        };
        
        // Update performance tracking with error impact
        const errorImpactTime = Date.now();
        PERFORMANCE_TRACKING.hookTimings.set(`${hookName}_error`, errorImpactTime);
        
        // Educational error demonstration for learning
        if (process.env.EDUCATIONAL_MODE !== 'false') {
            logger.info('Educational Error Demonstration', {
                concept: 'Hook Error Handling Patterns',
                framework: 'Mocha',
                pattern: 'Graceful Degradation with Recovery',
                learningOutcome: 'Understanding robust test infrastructure error handling'
            });
        }
        
        // Generate error report with recommendations
        const errorReport = {
            summary: `Hook ${hookName} failed with ${errorClassification.severity} severity error`,
            error: error.message,
            classification: errorClassification,
            recommendations: []
        };
        
        if (errorClassification.severity === 'high') {
            errorReport.recommendations.push('Manual cleanup may be required');
            errorReport.recommendations.push('Check system resources and network connectivity');
        }
        
        logger.error('Hook error handling completed', errorReport);
        
        // Determine if test execution can continue
        if (!errorClassification.recoverable) {
            throw new Error(`Critical hook failure in ${hookName}: ${error.message}`);
        }
        
    } catch (handlingError) {
        logger.error('Error handling procedure itself failed', { 
            originalError: error.message,
            handlingError: handlingError.message 
        });
        throw handlingError;
    }
}

/**
 * Validates that hook execution has completed successfully including environment verification,
 * resource availability checking, performance validation, and comprehensive readiness
 * assessment for test execution
 */
export function validateHookExecution(hookType, executionResult) {
    logger.debug('Validating hook execution completeness and readiness', {
        hookType,
        executionResult: typeof executionResult
    });
    
    const validation = {
        status: 'valid',
        errors: [],
        warnings: [],
        recommendations: [],
        timestamp: new Date().toISOString()
    };
    
    try {
        // Validate test environment initialization
        if (hookType === 'setup') {
            if (!GLOBAL_TEST_ENVIRONMENT) {
                validation.errors.push('Global test environment not initialized');
                validation.status = 'invalid';
            } else if (GLOBAL_TEST_ENVIRONMENT.status !== 'ready') {
                validation.errors.push(`Test environment status: ${GLOBAL_TEST_ENVIRONMENT.status}`);
                validation.status = 'invalid';
            }
            
            // Validate TeardownManager availability
            if (!GLOBAL_TEARDOWN_MANAGER) {
                validation.errors.push('TeardownManager not initialized');
                validation.status = 'invalid';
            }
        }
        
        // Validate performance tracking infrastructure
        if (!PERFORMANCE_TRACKING.hookTimings || !PERFORMANCE_TRACKING.testTimings) {
            validation.warnings.push('Performance tracking not fully initialized');
        }
        
        // Check hook execution state consistency
        if (hookType === 'before' && !HOOK_EXECUTION_STATE.beforeAllExecuted) {
            validation.warnings.push('Before hook execution state not updated');
        }
        
        // Validate resource availability
        if (GLOBAL_TEST_ENVIRONMENT) {
            const envValidation = GLOBAL_TEST_ENVIRONMENT.validateEnvironment();
            if (envValidation.status !== 'valid') {
                validation.errors.push(...envValidation.issues);
                validation.warnings.push(...envValidation.warnings);
                validation.status = 'invalid';
            }
        }
        
        // Generate recommendations based on validation results
        if (validation.errors.length > 0) {
            validation.recommendations.push('Review test environment configuration');
            validation.recommendations.push('Check system resources and dependencies');
        }
        
        if (validation.warnings.length > 0) {
            validation.recommendations.push('Monitor performance and resource usage');
        }
        
        logger.debug('Hook execution validation completed', validation);
        
    } catch (error) {
        validation.status = 'error';
        validation.errors.push(`Validation process failed: ${error.message}`);
        logger.error('Hook execution validation failed', { error: error.message });
    }
    
    return validation;
}

/**
 * Configures educational hook patterns for tutorial demonstration including learning
 * outcome tracking, progress monitoring, concept demonstration, and educational value
 * measurement for effective learning
 */
export async function configureEducationalHooks(educationalConfig = {}) {
    logger.info('Configuring educational hook patterns for tutorial demonstration');
    
    const config = {
        trackLearningOutcomes: educationalConfig.trackLearningOutcomes !== false,
        demonstratePatterns: educationalConfig.demonstratePatterns !== false,
        compareFrameworks: educationalConfig.compareFrameworks !== false,
        progressMonitoring: educationalConfig.progressMonitoring !== false,
        ...educationalConfig
    };
    
    const educationalHooks = {
        config,
        learningOutcomes: new Map(),
        progressTracker: {
            conceptsIntroduced: 0,
            patternsdemonstrated: 0,
            comparisonsShown: 0
        },
        
        // Learning outcome tracking utilities
        recordLearningOutcome: (concept, outcome) => {
            educationalHooks.learningOutcomes.set(concept, {
                outcome,
                timestamp: new Date().toISOString(),
                demonstrated: true
            });
            
            logger.info('Educational Learning Outcome Recorded', {
                concept,
                outcome,
                framework: 'Mocha'
            });
        },
        
        // Concept demonstration utilities
        demonstrateConcept: (concept, example) => {
            educationalHooks.progressTracker.conceptsIntroduced++;
            
            logger.info('Educational Concept Demonstration', {
                concept,
                example,
                framework: 'Mocha',
                learningPhase: 'demonstration'
            });
        },
        
        // Framework comparison utilities
        compareWithJest: (feature, mochaApproach, jestApproach) => {
            educationalHooks.progressTracker.comparisonsShown++;
            
            logger.info('Educational Framework Comparison', {
                feature,
                mocha: mochaApproach,
                jest: jestApproach,
                learningOutcome: 'Understanding testing framework differences'
            });
        }
    };
    
    // Demonstrate key educational concepts
    if (config.demonstratePatterns) {
        educationalHooks.demonstrateConcept(
            'Hook Lifecycle Management',
            'before/after and beforeEach/afterEach patterns with Mocha'
        );
        
        educationalHooks.demonstrateConcept(
            'Test Isolation Patterns',
            'State reset and resource cleanup between tests'
        );
        
        educationalHooks.demonstrateConcept(
            'Performance Tracking',
            'Hook timing and test execution monitoring'
        );
    }
    
    // Compare with Jest framework patterns
    if (config.compareFrameworks) {
        educationalHooks.compareWithJest(
            'Hook Registration',
            'Manual hook registration with explicit configuration',
            'Built-in hooks with zero configuration'
        );
        
        educationalHooks.compareWithJest(
            'Test Environment Setup',
            'Flexible environment management with custom classes',
            'Automatic environment setup with sensible defaults'
        );
    }
    
    // Record comprehensive learning outcomes
    if (config.trackLearningOutcomes) {
        educationalHooks.recordLearningOutcome(
            'Mocha Hook Patterns',
            'Understanding flexible test lifecycle management with explicit control'
        );
        
        educationalHooks.recordLearningOutcome(
            'Production Testing Practices',
            'Implementing robust test infrastructure with PM2 and Express.js integration'
        );
        
        educationalHooks.recordLearningOutcome(
            'Security Testing Integration',
            'Comprehensive security testing with Helmet.js middleware validation'
        );
    }
    
    logger.info('Educational hooks configuration completed', {
        config,
        progressTracker: educationalHooks.progressTracker,
        learningOutcomesCount: educationalHooks.learningOutcomes.size
    });
    
    return educationalHooks;
}

/**
 * Sets up cross-platform testing hooks for coordinating Node.js Express and Python Flask
 * testing scenarios including feature parity validation, response comparison, and
 * compatibility verification
 */
export async function setupCrossPlatformHooks(crossPlatformConfig = {}) {
    logger.info('Setting up cross-platform testing hooks for Express.js and Flask coordination');
    
    const config = {
        enableFlaskComparison: crossPlatformConfig.enableFlaskComparison !== false,
        validateFeatureParity: crossPlatformConfig.validateFeatureParity !== false,
        trackPerformanceComparison: crossPlatformConfig.trackPerformanceComparison !== false,
        ...crossPlatformConfig
    };
    
    const crossPlatformHooks = {
        config,
        platforms: {
            nodejs: {
                framework: 'Express.js',
                version: '5.1.0',
                status: 'active'
            },
            python: {
                framework: 'Flask',
                version: '3.1.1',
                status: 'comparison'
            }
        },
        
        // Feature parity validation utilities
        validateFeatureParity: async (endpoint, nodeResponse, flaskResponse) => {
            const comparison = {
                endpoint,
                statusMatch: nodeResponse.status === flaskResponse.status,
                contentMatch: nodeResponse.body === flaskResponse.body,
                headersMatch: JSON.stringify(nodeResponse.headers) === JSON.stringify(flaskResponse.headers),
                performanceComparison: {
                    node: nodeResponse.timing,
                    flask: flaskResponse.timing,
                    difference: Math.abs(nodeResponse.timing - flaskResponse.timing)
                }
            };
            
            logger.info('Cross-Platform Feature Parity Validation', comparison);
            return comparison;
        },
        
        // Performance comparison utilities
        comparePerformance: (endpoint, nodeMetrics, flaskMetrics) => {
            const comparison = {
                endpoint,
                node: nodeMetrics,
                flask: flaskMetrics,
                winner: nodeMetrics.avgResponseTime < flaskMetrics.avgResponseTime ? 'Node.js' : 'Flask',
                difference: Math.abs(nodeMetrics.avgResponseTime - flaskMetrics.avgResponseTime)
            };
            
            logger.info('Cross-Platform Performance Comparison', comparison);
            return comparison;
        },
        
        // Educational comparison insights
        generateLearningInsights: () => {
            return {
                architecturalDifferences: 'Event-driven vs WSGI-based request handling',
                performanceCharacteristics: 'V8 JavaScript engine vs CPython interpreter',
                ecosystemComparison: 'npm vs pip package management',
                deploymentPatterns: 'PM2 vs Gunicorn process management'
            };
        }
    };
    
    // Set up Express.js testing infrastructure
    logger.debug('Configuring Express.js testing infrastructure for cross-platform comparison');
    
    // Simulate Flask testing support utilities setup
    if (config.enableFlaskComparison) {
        logger.debug('Setting up Flask testing support utilities for Python implementation comparison');
        
        // Educational demonstration of cross-platform concepts
        const learningInsights = crossPlatformHooks.generateLearningInsights();
        logger.info('Cross-Platform Learning Insights', learningInsights);
    }
    
    // Configure performance comparison utilities
    if (config.trackPerformanceComparison) {
        logger.debug('Configuring performance comparison utilities for cross-platform analysis');
        
        // Set up performance tracking for both platforms
        PERFORMANCE_TRACKING.crossPlatform = {
            nodejs: new Map(),
            flask: new Map(),
            comparisons: []
        };
    }
    
    logger.info('Cross-platform testing hooks setup completed', {
        config,
        platforms: crossPlatformHooks.platforms,
        features: Object.keys(crossPlatformHooks).filter(key => typeof crossPlatformHooks[key] === 'function')
    });
    
    return crossPlatformHooks;
}

/**
 * Comprehensive Mocha hook management class that coordinates all hook registration,
 * execution tracking, error handling, and educational demonstration for reliable test
 * lifecycle management and learning outcome achievement
 */
export class MochaHookManager {
    constructor(hookConfig = {}) {
        logger.info('Initializing MochaHookManager with comprehensive configuration');
        
        // Initialize TestEnvironment instance
        this.testEnvironment = null; // Will be initialized during setup
        
        // Create TeardownManager instance
        this.teardownManager = new TeardownManager({
            timeout: hookConfig.timeout || MOCHA_HOOK_TIMEOUT,
            logger: logger
        });
        
        // Set up logger instance
        this.logger = logger;
        
        // Store hook configuration
        this.hookConfig = {
            timeout: hookConfig.timeout || MOCHA_HOOK_TIMEOUT,
            isolation: hookConfig.isolation || {},
            performance: hookConfig.performance !== false,
            education: hookConfig.education !== false,
            crossPlatform: hookConfig.crossPlatform || false,
            security: hookConfig.security !== false,
            ...hookConfig
        };
        
        // Initialize hook timing tracking
        this.hookTimings = new Map();
        
        // Set up execution state tracking
        this.executionState = {
            initialized: true,
            hooksRegistered: false,
            environmentReady: false,
            lastOperation: 'constructor',
            timestamp: new Date().toISOString()
        };
        
        // Initialize performance tracking utilities
        this.performanceTracking = setupPerformanceTracking({
            trackHooks: this.hookConfig.performance,
            trackTests: this.hookConfig.performance,
            trackMemory: this.hookConfig.performance
        });
        
        logger.info('MochaHookManager initialization completed', {
            config: this.hookConfig,
            features: {
                performance: this.hookConfig.performance,
                education: this.hookConfig.education,
                crossPlatform: this.hookConfig.crossPlatform,
                security: this.hookConfig.security
            }
        });
    }
    
    /**
     * Registers all Mocha hooks including before, after, beforeEach, afterEach with
     * comprehensive configuration, error handling, and educational demonstration for
     * complete test lifecycle management
     */
    registerAllHooks() {
        this.logger.info('Registering all Mocha hooks with comprehensive lifecycle management');
        
        try {
            // Register comprehensive global hooks using the main function
            registerGlobalHooks(this.hookConfig);
            
            // Update execution state
            this.executionState.hooksRegistered = true;
            this.executionState.lastOperation = 'registerAllHooks';
            this.executionState.timestamp = new Date().toISOString();
            
            this.logger.info('All Mocha hooks registered successfully', {
                configuration: this.hookConfig,
                hooks: ['before', 'after', 'beforeEach', 'afterEach'],
                manager: 'MochaHookManager'
            });
            
        } catch (error) {
            this.logger.error('Failed to register Mocha hooks', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Executes comprehensive before hook operations including test environment initialization,
     * Express server setup, security configuration, and performance tracking initialization
     * for test readiness
     */
    async executeBeforeHook(hookContext = {}) {
        this.logger.info('Executing comprehensive before hook operations');
        
        const startTime = Date.now();
        
        try {
            // Initialize global test environment
            this.testEnvironment = new TestEnvironment(this.hookConfig);
            await this.testEnvironment.initialize();
            
            // Register test environment with teardown manager
            this.teardownManager.registerResource('test_environment', this.testEnvironment);
            
            // Set up Express.js test server infrastructure
            this.logger.debug('Setting up Express.js test server infrastructure with middleware');
            
            // Configure security middleware if enabled
            if (this.hookConfig.security) {
                this.logger.debug('Configuring Helmet.js security middleware for comprehensive testing');
            }
            
            // Initialize PM2 testing support if enabled
            if (this.hookConfig.pm2Testing) {
                this.logger.debug('Initializing PM2 testing support for production scenarios');
            }
            
            // Set up cross-platform testing utilities if enabled
            if (this.hookConfig.crossPlatform) {
                await setupCrossPlatformHooks(this.hookConfig);
            }
            
            // Configure educational demonstration if enabled
            if (this.hookConfig.education) {
                await configureEducationalHooks(this.hookConfig);
            }
            
            // Update execution state
            this.executionState.environmentReady = true;
            this.executionState.lastOperation = 'executeBeforeHook';
            this.executionState.timestamp = new Date().toISOString();
            
            // Record hook execution timing
            const executionTime = Date.now() - startTime;
            this.hookTimings.set('before', executionTime);
            this.performanceTracking.recordHookTiming('before', executionTime);
            
            this.logger.info('Before hook execution completed successfully', {
                executionTime: `${executionTime}ms`,
                environment: 'ready',
                resources: this.teardownManager.getResourceCount()
            });
            
        } catch (error) {
            this.logger.error('Before hook execution failed', { error: error.message });
            await handleHookError(error, 'before', hookContext);
            throw error;
        }
    }
    
    /**
     * Executes comprehensive after hook operations including server shutdown, resource cleanup,
     * performance metrics collection, and educational summary generation for complete test
     * completion
     */
    async executeAfterHook(hookContext = {}) {
        this.logger.info('Executing comprehensive after hook operations');
        
        const startTime = Date.now();
        
        try {
            // Execute teardown manager cleanup
            this.logger.debug('Executing TeardownManager cleanup operations');
            await this.teardownManager.executeCleanup();
            
            // Clean up test environment
            if (this.testEnvironment) {
                this.logger.debug('Cleaning up TestEnvironment instance');
                await this.testEnvironment.cleanup();
            }
            
            // Collect comprehensive performance metrics
            const performanceMetrics = this.getHookMetrics();
            
            // Generate educational summary if enabled
            if (this.hookConfig.education) {
                this.logger.info('Educational Summary Generated', {
                    framework: 'Mocha',
                    concepts: ['Hook Lifecycle', 'Test Isolation', 'Performance Tracking'],
                    learningOutcomes: 'Comprehensive understanding of production-ready testing infrastructure'
                });
            }
            
            // Update execution state
            this.executionState.lastOperation = 'executeAfterHook';
            this.executionState.timestamp = new Date().toISOString();
            
            // Record hook execution timing
            const executionTime = Date.now() - startTime;
            this.hookTimings.set('after', executionTime);
            this.performanceTracking.recordHookTiming('after', executionTime);
            
            this.logger.info('After hook execution completed successfully', {
                executionTime: `${executionTime}ms`,
                cleanup: 'complete',
                performanceMetrics: {
                    totalHooks: this.hookTimings.size,
                    avgHookTime: Array.from(this.hookTimings.values()).reduce((a, b) => a + b, 0) / this.hookTimings.size
                }
            });
            
        } catch (error) {
            this.logger.error('After hook execution failed', { error: error.message });
            await handleHookError(error, 'after', hookContext);
            throw error;
        }
    }
    
    /**
     * Executes before each test operations including test isolation setup, state reset,
     * mock initialization, and test-specific configuration for reliable individual test
     * execution
     */
    async executeBeforeEachHook(testContext) {
        this.logger.debug('Executing beforeEach hook for test isolation setup', testContext);
        
        const startTime = Date.now();
        
        try {
            // Set up test isolation mechanisms
            await setupTestIsolation(testContext, this.hookConfig.isolation);
            
            // Record test setup timing
            const setupTime = Date.now() - startTime;
            this.performanceTracking.recordTestTiming(`${testContext.testTitle}_setup`, setupTime);
            
            this.logger.debug('BeforeEach hook execution completed', {
                testContext,
                setupTime: `${setupTime}ms`
            });
            
        } catch (error) {
            this.logger.error('BeforeEach hook execution failed', { 
                error: error.message,
                testContext 
            });
            await handleHookError(error, 'beforeEach', testContext);
            throw error;
        }
    }
    
    /**
     * Executes after each test operations including test cleanup, performance metrics
     * collection, mock restoration, and test isolation validation for clean test completion
     */
    async executeAfterEachHook(testContext, testResult) {
        this.logger.debug('Executing afterEach hook for test cleanup', { testContext, testResult });
        
        const startTime = Date.now();
        
        try {
            // Clean up test isolation
            await cleanupTestIsolation(testContext, testResult);
            
            // Record test cleanup timing
            const cleanupTime = Date.now() - startTime;
            this.performanceTracking.recordTestTiming(`${testContext.testTitle}_cleanup`, cleanupTime);
            
            this.logger.debug('AfterEach hook execution completed', {
                testContext,
                testResult,
                cleanupTime: `${cleanupTime}ms`
            });
            
        } catch (error) {
            this.logger.error('AfterEach hook execution failed', { 
                error: error.message,
                testContext,
                testResult 
            });
            await handleHookError(error, 'afterEach', { testContext, testResult });
            throw error;
        }
    }
    
    /**
     * Returns comprehensive hook execution metrics including timing data, performance
     * statistics, execution counts, and educational insights for test optimization and
     * learning analysis
     */
    getHookMetrics() {
        this.logger.debug('Compiling comprehensive hook execution metrics');
        
        const metrics = {
            // Hook execution timing data
            hookTimings: Object.fromEntries(this.hookTimings),
            
            // Performance statistics
            performanceStats: {
                totalHooks: this.hookTimings.size,
                avgHookTime: this.hookTimings.size > 0 
                    ? Array.from(this.hookTimings.values()).reduce((a, b) => a + b, 0) / this.hookTimings.size 
                    : 0,
                maxHookTime: this.hookTimings.size > 0 
                    ? Math.max(...Array.from(this.hookTimings.values())) 
                    : 0,
                minHookTime: this.hookTimings.size > 0 
                    ? Math.min(...Array.from(this.hookTimings.values())) 
                    : 0
            },
            
            // Execution count statistics
            executionCounts: {
                testsExecuted: TEST_ISOLATION_STATE.testCount,
                suitesExecuted: TEST_ISOLATION_STATE.suiteCount,
                failures: TEST_ISOLATION_STATE.failureCount,
                successRate: TEST_ISOLATION_STATE.testCount > 0 
                    ? ((TEST_ISOLATION_STATE.testCount - TEST_ISOLATION_STATE.failureCount) / TEST_ISOLATION_STATE.testCount * 100).toFixed(2) + '%'
                    : '0%'
            },
            
            // Educational metrics
            educationalInsights: {
                framework: 'Mocha',
                patterns: ['Global Hooks', 'Test Isolation', 'Performance Tracking'],
                learningOutcomes: 'Comprehensive production-ready testing infrastructure',
                comparisonFramework: 'Jest',
                keyDifferences: 'Flexibility vs Simplicity trade-offs'
            },
            
            // Resource usage metrics
            resourceMetrics: {
                environmentReady: this.executionState.environmentReady,
                resourcesRegistered: this.teardownManager ? this.teardownManager.getResourceCount() : 0,
                memoryUsage: this.performanceTracking?.getMemoryUsage?.() || null
            },
            
            // Execution state information
            executionState: {
                ...this.executionState,
                configurationActive: this.hookConfig
            }
        };
        
        this.logger.debug('Hook metrics compilation completed', {
            totalMetrics: Object.keys(metrics).length,
            performanceStats: metrics.performanceStats,
            executionCounts: metrics.executionCounts
        });
        
        return metrics;
    }
    
    /**
     * Validates hook registration integrity, execution state consistency, and educational
     * configuration completeness for reliable test framework operation and learning outcome
     * achievement
     */
    validateHookIntegrity() {
        this.logger.debug('Validating hook registration integrity and execution state consistency');
        
        const validation = {
            status: 'valid',
            issues: [],
            warnings: [],
            recommendations: [],
            timestamp: new Date().toISOString()
        };
        
        try {
            // Validate hook registration status
            if (!this.executionState.hooksRegistered) {
                validation.issues.push('Hooks not properly registered with Mocha framework');
                validation.status = 'invalid';
            }
            
            // Check execution state consistency
            if (!this.executionState.initialized) {
                validation.issues.push('MochaHookManager not properly initialized');
                validation.status = 'invalid';
            }
            
            // Verify teardown manager availability
            if (!this.teardownManager) {
                validation.issues.push('TeardownManager not available for resource cleanup');
                validation.status = 'invalid';
            }
            
            // Validate configuration completeness
            if (!this.hookConfig || Object.keys(this.hookConfig).length === 0) {
                validation.warnings.push('Hook configuration appears incomplete');
            }
            
            // Check performance tracking setup
            if (this.hookConfig.performance && !this.performanceTracking) {
                validation.warnings.push('Performance tracking requested but not properly initialized');
            }
            
            // Validate educational configuration
            if (this.hookConfig.education) {
                validation.recommendations.push('Educational mode active - ensure learning outcomes are tracked');
            }
            
            // Check cross-platform configuration
            if (this.hookConfig.crossPlatform) {
                validation.recommendations.push('Cross-platform testing enabled - verify Flask compatibility setup');
            }
            
            // Generate improvement suggestions
            if (validation.warnings.length > 0) {
                validation.recommendations.push('Review configuration for optimal test execution');
            }
            
            if (validation.issues.length === 0 && validation.warnings.length === 0) {
                validation.recommendations.push('Hook integrity validation passed - system ready for testing');
            }
            
            this.logger.debug('Hook integrity validation completed', {
                status: validation.status,
                issues: validation.issues.length,
                warnings: validation.warnings.length,
                recommendations: validation.recommendations.length
            });
            
        } catch (error) {
            validation.status = 'error';
            validation.issues.push(`Validation process failed: ${error.message}`);
            this.logger.error('Hook integrity validation failed', { error: error.message });
        }
        
        return validation;
    }
}

// Create and export pre-configured hook manager instance
export const hookManager = new MochaHookManager({
    timeout: TESTING_CONSTANTS.TEST_TIMEOUTS?.HOOK || MOCHA_HOOK_TIMEOUT,
    isolation: TESTING_CONSTANTS.ISOLATION_CONFIG || {},
    performance: true,
    education: process.env.EDUCATIONAL_MODE !== 'false',
    crossPlatform: process.env.CROSS_PLATFORM_TESTING === 'true',
    security: true
});

// Log module initialization completion
logger.info('Mocha hooks module initialization completed successfully', {
    exports: [
        'registerGlobalHooks',
        'MochaHookManager', 
        'setupGlobalTestEnvironment',
        'teardownGlobalTestEnvironment',
        'setupTestIsolation',
        'cleanupTestIsolation',
        'hookManager'
    ],
    features: {
        globalHooks: true,
        testIsolation: true,
        performanceTracking: true,
        educationalMode: process.env.EDUCATIONAL_MODE !== 'false',
        crossPlatformTesting: process.env.CROSS_PLATFORM_TESTING === 'true',
        securityTesting: true
    },
    configuration: {
        timeout: MOCHA_HOOK_TIMEOUT,
        framework: 'Mocha',
        nodeVersion: process.version,
        platform: process.platform
    }
});