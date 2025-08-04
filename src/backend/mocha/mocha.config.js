/**
 * @fileoverview Programmatic Mocha Testing Framework Configuration Module
 * @description Advanced JavaScript-based configuration for Mocha testing framework providing
 * comprehensive test configuration management, environment-specific optimizations, parallel
 * execution support, and modern ES Modules integration. Complements .mocharc.json with
 * dynamic configuration capabilities for the Node.js tutorial project demonstrating
 * progressive testing patterns from basic HTTP server validation to production-ready
 * Express.js testing with PM2 cluster mode and cross-platform Flask compatibility.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Programmatic Mocha configuration with dynamic environment detection
 * - Advanced test discovery patterns for comprehensive test organization
 * - Parallel execution optimization with system resource awareness
 * - Performance tracking and optimization for different test scenarios
 * - Comprehensive reporter configuration with multiple output formats
 * - Security testing integration with Helmet.js validation patterns
 * - Cross-platform testing configuration for Express/Flask compatibility
 * - PM2 cluster mode testing support for production deployment validation
 * - Educational demonstration of modern testing configuration patterns
 * - Coverage tool integration with threshold validation and reporting
 * 
 * Educational Value:
 * - Demonstrates programmatic vs JSON configuration approaches
 * - Showcases environment-specific testing optimizations  
 * - Illustrates parallel test execution configuration and performance tuning
 * - Teaches comprehensive test reporting and coverage analysis patterns
 * - Provides insights into modern testing infrastructure management
 * - Shows integration patterns for production testing scenarios
 * 
 * Technology Integration:
 * - Mocha v11.0.0+ with Node.js ^18.18.0 || ^20.9.0 || >=21.1.0 compatibility
 * - Express.js v5.1.0 testing infrastructure integration
 * - PM2 v6.0.8 cluster mode testing support
 * - Helmet.js v8.1.0 security middleware validation
 * - C8 coverage tool integration with comprehensive reporting
 * - ES Modules support with modern JavaScript patterns
 */

// External library imports with version compatibility comments
import process from 'node:process'; // Node.js built-in - Process management for environment variable access
import path from 'node:path'; // Node.js built-in - Path utilities for test file resolution and configuration
import os from 'node:os'; // Node.js built-in - Operating system utilities for optimal parallel worker configuration
import { fileURLToPath } from 'node:url'; // Node.js built-in - URL utilities for ES Modules path resolution

// Third-party module imports with version specifications
// import mocha from 'mocha'; // mocha@^11.0.0 - Feature-rich JavaScript test framework

// Internal imports from testing infrastructure modules
import { setupTestEnvironment, TestEnvironment } from './setup.js';
import { teardownTestEnvironment, TeardownManager } from './teardown.js';
import { 
  HookManager, 
  setupGlobalBeforeHook, 
  setupGlobalAfterHook 
} from './hooks.js';
import { 
  getTestingConfig, 
  validateEnvironment 
} from '../config/environment.js';
import { TESTING_CONSTANTS } from '../utils/constants.js';
import logger from '../utils/logger.js';

// Global configuration constants and state management
const MOCHA_CONFIG = null; // Global configuration instance placeholder
const TEST_ENVIRONMENT = process.env.NODE_ENV || 'test'; // Current test environment detection
const IS_CI = process.env.CI === 'true'; // Continuous Integration environment detection
const PARALLEL_ENABLED = process.env.MOCHA_PARALLEL !== 'false'; // Parallel execution control
const COVERAGE_ENABLED = process.env.COVERAGE !== 'false'; // Coverage collection control

// Configuration cache for performance optimization
const CONFIG_CACHE = new Map();
const ENVIRONMENT_CACHE = new Map();
const VALIDATION_CACHE = new Map();

// Performance tracking and metrics collection
const PERFORMANCE_METRICS = {
  configurationTime: 0,
  environmentDetectionTime: 0,
  validationTime: 0,
  totalTests: 0,
  parallelWorkers: 0
};

/**
 * Creates comprehensive Mocha configuration object with environment-specific settings,
 * ES Modules support, advanced test discovery patterns, and integration with testing
 * infrastructure including setup.js, teardown.js, and hooks.js modules for robust
 * test execution across development, CI/CD, and production scenarios.
 * 
 * @param {Object} [options={}] - Configuration options and overrides
 * @param {string} [options.environment] - Target environment override
 * @param {boolean} [options.parallel] - Parallel execution override
 * @param {number} [options.timeout] - Global timeout override
 * @param {Array} [options.testPatterns] - Custom test file patterns
 * @param {Object} [options.coverage] - Coverage configuration overrides
 * @returns {Object} Complete Mocha configuration object with environment-specific settings and advanced testing capabilities
 */
export function createMochaConfiguration(options = {}) {
  const startTime = Date.now();
  
  logger.info('Creating comprehensive Mocha configuration', { 
    options: Object.keys(options),
    environment: TEST_ENVIRONMENT,
    parallel: PARALLEL_ENABLED,
    coverage: COVERAGE_ENABLED
  });

  try {
    // Initialize base configuration with default Mocha settings and ES Modules support
    const baseConfig = {
      ui: 'bdd', // Behavior-driven development interface
      timeout: options.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS?.UNIT_TESTS || 10000,
      slow: 75, // Slow test threshold in milliseconds
      bail: IS_CI, // Stop on first failure in CI environments
      checkLeaks: true, // Check for global variable leaks
      fullTrace: true, // Show full stack traces
      exit: true, // Force exit after tests complete
      recursive: true, // Search subdirectories for test files
      parallel: options.parallel !== undefined ? options.parallel : PARALLEL_ENABLED,
      jobs: 'auto', // Automatic worker count determination
      loader: 'esmock', // ES Modules loader for mocking support
      extension: ['js', 'mjs'], // Supported file extensions
      require: ['./setup.js'], // Global setup module
      file: ['./hooks.js'] // Global hooks configuration
    };

    // Apply environment-specific configuration for development, CI/CD, and production scenarios
    const environmentSettings = detectEnvironmentSettings();
    const environmentConfig = {
      ...baseConfig,
      ...environmentSettings.mochaConfig,
      timeout: environmentSettings.timeout || baseConfig.timeout,
      parallel: environmentSettings.parallel !== undefined ? environmentSettings.parallel : baseConfig.parallel,
      jobs: environmentSettings.jobs || baseConfig.jobs,
      reporter: environmentSettings.reporter || 'spec',
      reporterOptions: environmentSettings.reporterOptions || {}
    };

    // Configure test discovery patterns for unit, integration, e2e, performance, and security tests
    const testDiscoveryConfig = configureTestDiscovery({
      patterns: options.testPatterns,
      environment: TEST_ENVIRONMENT,
      crossPlatform: process.env.CROSS_PLATFORM_TESTING === 'true'
    });
    
    const discoveryConfig = {
      ...environmentConfig,
      spec: testDiscoveryConfig.spec,
      ignore: testDiscoveryConfig.ignore
    };

    // Set up timeout configuration with adaptive values based on test type and environment
    const timeoutConfig = configureTimeouts({
      environment: TEST_ENVIRONMENT,
      ci: IS_CI,
      baseTimeout: discoveryConfig.timeout
    });
    
    const timeoutEnhancedConfig = {
      ...discoveryConfig,
      timeout: timeoutConfig.globalTimeout,
      slow: timeoutConfig.slowThreshold
    };

    // Configure parallel execution settings with optimal worker count based on system resources
    const parallelConfig = configureParallelExecution({
      enabled: timeoutEnhancedConfig.parallel,
      environment: TEST_ENVIRONMENT,
      systemResources: {
        cpuCount: os.cpus().length,
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      }
    });
    
    const parallelEnhancedConfig = {
      ...timeoutEnhancedConfig,
      parallel: parallelConfig.enabled,
      jobs: parallelConfig.jobs,
      ...(parallelConfig.workerOptions && { workerOptions: parallelConfig.workerOptions })
    };

    // Set up reporter configuration with environment-appropriate output formats and destinations
    const reporterConfig = configureReporters({
      environment: TEST_ENVIRONMENT,
      ci: IS_CI,
      coverage: COVERAGE_ENABLED,
      outputDirectory: path.resolve('./logs'),
      formats: options.reporterFormats || ['spec', 'json']
    });
    
    const reporterEnhancedConfig = {
      ...parallelEnhancedConfig,
      reporter: reporterConfig.primary,
      reporterOptions: {
        ...parallelEnhancedConfig.reporterOptions,
        ...reporterConfig.options
      }
    };

    // Configure hooks integration with setup.js, teardown.js, and hooks.js modules
    const hooksConfig = setupTestHooks({
      setupModule: './setup.js',
      teardownModule: './teardown.js',
      hooksModule: './hooks.js',
      timeout: timeoutConfig.hookTimeout,
      environment: TEST_ENVIRONMENT
    });
    
    const hooksEnhancedConfig = {
      ...reporterEnhancedConfig,
      require: [
        ...reporterEnhancedConfig.require,
        ...hooksConfig.requireModules
      ],
      file: [
        ...reporterEnhancedConfig.file,
        ...hooksConfig.fileModules
      ]
    };

    // Apply coverage integration settings with C8 tool configuration and threshold validation
    const coverageConfig = integrateCoverageTools({
      enabled: COVERAGE_ENABLED,
      tool: 'c8',
      thresholds: TESTING_CONSTANTS.COVERAGE_THRESHOLDS?.GLOBAL || {
        statements: 90,
        branches: 85,
        functions: 95,
        lines: 90
      },
      outputDirectory: './coverage/mocha',
      include: ['../src/**/*.js', '../src/**/*.mjs'],
      exclude: ['../test/**', '../coverage/**', '../node_modules/**']
    });

    // Configure security testing settings for Helmet.js validation and vulnerability testing
    const securityConfig = configureSecurityTesting({
      enabled: true,
      helmetValidation: true,
      vulnerabilityScanning: process.env.SECURITY_TESTING === 'true',
      crossSiteScripting: true,
      contentSecurityPolicy: true
    });

    // Set up cross-platform testing configuration for Express/Flask compatibility testing
    const crossPlatformConfig = configureCrossPlatformTesting({
      enabled: process.env.CROSS_PLATFORM_TESTING === 'true',
      flaskCompatibility: true,
      responseComparison: true,
      performanceComparison: true,
      endpointParity: true
    });

    // Configure PM2 testing settings for cluster mode and production deployment testing
    const pm2Config = configurePM2Testing({
      enabled: process.env.PM2_TESTING === 'true',
      clusterMode: true,
      processManagement: true,
      zeroDowntimeDeployment: true,
      loadBalancing: true
    });

    // Apply performance testing configuration with benchmarking and resource monitoring
    const performanceConfig = configurePerformanceTesting({
      enabled: true,
      responseTimeThresholds: TESTING_CONSTANTS.PERFORMANCE_TARGETS || {
        unit: 100,
        integration: 500,
        e2e: 2000
      },
      memoryMonitoring: true,
      cpuMonitoring: true,
      loadTesting: process.env.LOAD_TESTING === 'true'
    });

    // Return complete Mocha configuration object with all advanced settings applied
    const finalConfig = {
      ...hooksEnhancedConfig,
      
      // Coverage integration
      ...(coverageConfig.mochaIntegration && coverageConfig.mochaIntegration),
      
      // Advanced configuration sections
      security: securityConfig,
      crossPlatform: crossPlatformConfig,
      pm2: pm2Config,
      performance: performanceConfig,
      
      // Metadata and configuration tracking
      metadata: {
        createdAt: new Date().toISOString(),
        environment: TEST_ENVIRONMENT,
        nodeVersion: process.version,
        platform: process.platform,
        configurationTime: Date.now() - startTime,
        features: {
          parallel: finalConfig.parallel,
          coverage: COVERAGE_ENABLED,
          security: securityConfig.enabled,
          crossPlatform: crossPlatformConfig.enabled,
          pm2: pm2Config.enabled,
          performance: performanceConfig.enabled
        }
      }
    };

    // Update performance metrics
    PERFORMANCE_METRICS.configurationTime = Date.now() - startTime;
    PERFORMANCE_METRICS.parallelWorkers = finalConfig.jobs === 'auto' ? 
      os.cpus().length : (parseInt(finalConfig.jobs) || 1);

    logger.info('Mocha configuration created successfully', {
      configurationTime: PERFORMANCE_METRICS.configurationTime,
      features: finalConfig.metadata.features,
      parallelWorkers: PERFORMANCE_METRICS.parallelWorkers
    });

    return finalConfig;

  } catch (error) {
    logger.error('Failed to create Mocha configuration', error, {
      options,
      environment: TEST_ENVIRONMENT,
      configurationTime: Date.now() - startTime
    });
    throw error;
  }
}

/**
 * Detects current environment and returns environment-specific configuration settings
 * for optimal test execution in development, CI/CD, and production scenarios with
 * platform optimizations and resource allocation based on system capabilities.
 * 
 * @returns {Object} Environment-specific configuration settings with platform optimizations and resource allocation
 */
export function detectEnvironmentSettings() {
  const startTime = Date.now();
  const cacheKey = `env_${TEST_ENVIRONMENT}_${IS_CI}_${PARALLEL_ENABLED}`;
  
  // Check cache for recent environment detection results
  if (ENVIRONMENT_CACHE.has(cacheKey)) {
    const cached = ENVIRONMENT_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
      logger.debug('Using cached environment settings', { cacheKey });
      return cached.settings;
    }
  }

  logger.debug('Detecting environment settings for Mocha configuration', {
    environment: TEST_ENVIRONMENT,
    ci: IS_CI,
    parallel: PARALLEL_ENABLED
  });

  try {
    // Detect current environment from NODE_ENV and CI environment variables
    const environment = TEST_ENVIRONMENT;
    const isCI = IS_CI;
    const cpuCount = os.cpus().length;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Determine optimal parallel worker count based on available CPU cores and memory
    let optimalWorkers = 1;
    if (PARALLEL_ENABLED) {
      if (isCI) {
        // Conservative worker count for CI environments
        optimalWorkers = Math.min(cpuCount, 4);
      } else if (environment === 'development') {
        // Balanced worker count for development
        optimalWorkers = Math.max(1, Math.floor(cpuCount / 2));
      } else {
        // Maximum workers for test environment
        optimalWorkers = cpuCount;
      }
      
      // Memory-based worker adjustment
      const memoryPerWorker = 512 * 1024 * 1024; // 512MB per worker
      const maxWorkersByMemory = Math.floor(freeMemory / memoryPerWorker);
      optimalWorkers = Math.min(optimalWorkers, maxWorkersByMemory);
    }

    // Configure timeout settings based on environment performance characteristics
    const timeoutMultiplier = isCI ? 2.0 : 1.0; // Longer timeouts in CI
    const baseTimeout = TESTING_CONSTANTS.TEST_TIMEOUTS?.UNIT_TESTS || 10000;
    const environmentTimeout = Math.floor(baseTimeout * timeoutMultiplier);

    // Set up reporter configuration appropriate for environment (console, file, CI)
    let primaryReporter = 'spec';
    let reporterOptions = {};
    
    if (isCI) {
      primaryReporter = 'json';
      reporterOptions = {
        output: path.resolve('./logs/mocha-test-results.json')
      };
    } else if (environment === 'production') {
      primaryReporter = 'tap';
      reporterOptions = {
        output: path.resolve('./logs/mocha-production-results.tap')
      };
    } else {
      primaryReporter = 'spec';
      reporterOptions = {
        slow: 100,
        colors: true
      };
    }

    // Configure log level and output verbosity based on environment requirements
    const logLevel = environment === 'development' ? 'debug' : 
                    environment === 'test' ? 'info' : 'warn';
    const verbose = environment === 'development' || process.env.VERBOSE === 'true';

    // Determine coverage reporting requirements based on environment and CI settings
    const coverageRequired = isCI || environment === 'production';
    const coverageFormats = isCI ? ['json', 'lcov'] : ['text', 'html'];

    // Configure test file watching and live reload settings for development environments
    const watchEnabled = environment === 'development' && !isCI;
    const watchOptions = watchEnabled ? {
      ignore: ['node_modules/**', 'coverage/**', 'logs/**', '.git/**'],
      usePolling: process.platform === 'win32'
    } : null;

    // Return environment-specific configuration object with optimized settings
    const environmentSettings = {
      environment,
      isCI,
      mochaConfig: {
        parallel: PARALLEL_ENABLED,
        jobs: optimalWorkers,
        bail: isCI, // Fail fast in CI environments
        forbidOnly: isCI, // Prevent .only() in CI
        forbidPending: isCI, // Prevent .skip() in CI
        grep: process.env.MOCHA_GREP || undefined,
        invert: process.env.MOCHA_INVERT === 'true'
      },
      timeout: environmentTimeout,
      parallel: PARALLEL_ENABLED,
      jobs: optimalWorkers,
      reporter: primaryReporter,
      reporterOptions,
      logLevel,
      verbose,
      coverage: {
        required: coverageRequired,
        formats: coverageFormats
      },
      watch: {
        enabled: watchEnabled,
        options: watchOptions
      },
      systemResources: {
        cpuCount,
        totalMemory,
        freeMemory,
        optimalWorkers,
        memoryPerWorker: Math.floor(freeMemory / optimalWorkers)
      },
      performance: {
        timeoutMultiplier,
        baseTimeout,
        calculatedTimeout: environmentTimeout
      }
    };

    // Cache environment settings for performance optimization
    ENVIRONMENT_CACHE.set(cacheKey, {
      settings: environmentSettings,
      timestamp: Date.now()
    });

    // Update performance metrics
    PERFORMANCE_METRICS.environmentDetectionTime = Date.now() - startTime;

    logger.debug('Environment settings detected successfully', {
      environment,
      optimalWorkers,
      timeout: environmentTimeout,
      reporter: primaryReporter,
      detectionTime: PERFORMANCE_METRICS.environmentDetectionTime
    });

    return environmentSettings;

  } catch (error) {
    logger.error('Failed to detect environment settings', error, {
      environment: TEST_ENVIRONMENT,
      ci: IS_CI,
      detectionTime: Date.now() - startTime
    });
    
    // Return fallback configuration
    return {
      environment: 'test',
      isCI: false,
      mochaConfig: {
        parallel: false,
        jobs: 1,
        bail: false
      },
      timeout: 10000,
      reporter: 'spec',
      reporterOptions: {},
      logLevel: 'info',
      verbose: false
    };
  }
}

/**
 * Configures comprehensive test discovery patterns for different test types including
 * unit, integration, end-to-end, performance, and security tests with proper file
 * organization and cross-platform support for Express/Flask compatibility testing.
 * 
 * @param {Object} [discoveryConfig={}] - Test discovery configuration options
 * @param {Array} [discoveryConfig.patterns] - Custom test file patterns
 * @param {string} [discoveryConfig.environment] - Target environment
 * @param {boolean} [discoveryConfig.crossPlatform] - Enable cross-platform test patterns
 * @returns {Object} Test discovery configuration with patterns, extensions, and exclusion rules
 */
export function configureTestDiscovery(discoveryConfig = {}) {
  logger.debug('Configuring comprehensive test discovery patterns', discoveryConfig);

  const config = {
    patterns: discoveryConfig.patterns || null,
    environment: discoveryConfig.environment || TEST_ENVIRONMENT,
    crossPlatform: discoveryConfig.crossPlatform || false,
    includePerformance: discoveryConfig.includePerformance !== false,
    includeSecurity: discoveryConfig.includeSecurity !== false,
    ...discoveryConfig
  };

  try {
    // Define test file patterns for unit tests in test/unit directory with .test.js extension
    const unitTestPatterns = [
      '../test/unit/**/*.test.js',
      '../test/unit/**/*.spec.js',
      '../src/**/__tests__/**/*.test.js'
    ];

    // Configure integration test patterns for test/integration directory with API endpoint testing
    const integrationTestPatterns = [
      '../test/integration/**/*.test.js',
      '../test/integration/**/*.spec.js',
      '../test/api/**/*.test.js'
    ];

    // Set up end-to-end test patterns for test/e2e directory with production workflow testing
    const e2eTestPatterns = [
      '../test/e2e/**/*.test.js',
      '../test/e2e/**/*.spec.js',
      '../test/workflows/**/*.test.js'
    ];

    // Configure performance test patterns for test/performance directory with load testing
    const performanceTestPatterns = config.includePerformance ? [
      '../test/performance/**/*.test.js',
      '../test/load/**/*.test.js',
      '../test/benchmark/**/*.test.js'
    ] : [];

    // Set up security test patterns for test/security directory with Helmet.js validation
    const securityTestPatterns = config.includeSecurity ? [
      '../test/security/**/*.test.js',
      '../test/security/helmet/**/*.test.js',
      '../test/vulnerability/**/*.test.js'
    ] : [];

    // Configure cross-platform test patterns for Express/Flask compatibility testing
    const crossPlatformTestPatterns = config.crossPlatform ? [
      '../test/cross-platform/**/*.test.js',
      '../test/compatibility/**/*.test.js',
      '../test/flask-comparison/**/*.test.js'
    ] : [];

    // Combine all test patterns based on configuration
    let allTestPatterns = [
      ...unitTestPatterns,
      ...integrationTestPatterns
    ];

    // Add additional test types based on environment
    if (config.environment !== 'development') {
      allTestPatterns.push(...e2eTestPatterns);
    }

    if (config.includePerformance) {
      allTestPatterns.push(...performanceTestPatterns);
    }

    if (config.includeSecurity) {
      allTestPatterns.push(...securityTestPatterns);
    }

    if (config.crossPlatform) {
      allTestPatterns.push(...crossPlatformTestPatterns);
    }

    // Use custom patterns if provided
    if (config.patterns) {
      allTestPatterns = Array.isArray(config.patterns) ? config.patterns : [config.patterns];
    }

    // Set up exclusion patterns for non-test files, dependencies, and build artifacts
    const excludePatterns = [
      '../node_modules/**',
      '../coverage/**',
      '../logs/**',
      '../tmp/**',
      '../dist/**',
      '../build/**',
      '../.git/**',
      '../flask-app/**/*.py', // Exclude Python Flask files
      '../.env*',
      '../*.md',
      '../*.json',
      '../*.config.js'
    ];

    // Configure file extension support for .js and .mjs files with ES Modules
    const supportedExtensions = ['js', 'mjs'];

    // Return comprehensive test discovery configuration with all patterns defined
    const discoveryConfiguration = {
      spec: allTestPatterns,
      ignore: excludePatterns,
      extensions: supportedExtensions,
      recursive: true,
      patterns: {
        unit: unitTestPatterns,
        integration: integrationTestPatterns,
        e2e: e2eTestPatterns,
        performance: performanceTestPatterns,
        security: securityTestPatterns,
        crossPlatform: crossPlatformTestPatterns
      },
      metadata: {
        totalPatterns: allTestPatterns.length,
        environment: config.environment,
        crossPlatformEnabled: config.crossPlatform,
        performanceTestsEnabled: config.includePerformance,
        securityTestsEnabled: config.includeSecurity,
        createdAt: new Date().toISOString()
      }
    };

    logger.debug('Test discovery configuration completed', {
      totalPatterns: allTestPatterns.length,
      excludePatterns: excludePatterns.length,
      extensions: supportedExtensions,
      environment: config.environment
    });

    return discoveryConfiguration;

  } catch (error) {
    logger.error('Failed to configure test discovery patterns', error, config);
    
    // Return minimal fallback configuration
    return {
      spec: ['../test/**/*.test.js'],
      ignore: ['../node_modules/**'],
      extensions: ['js'],
      recursive: true
    };
  }
}

/**
 * Configures optimal parallel test execution settings based on system resources,
 * test types, and environment constraints for maximum testing performance with
 * intelligent worker allocation and resource management.
 * 
 * @param {Object} [parallelConfig={}] - Parallel execution configuration options
 * @param {boolean} [parallelConfig.enabled] - Enable parallel execution
 * @param {string} [parallelConfig.environment] - Target environment
 * @param {Object} [parallelConfig.systemResources] - System resource information
 * @returns {Object} Parallel execution configuration with worker count, job distribution, and resource limits
 */
export function configureParallelExecution(parallelConfig = {}) {
  logger.debug('Configuring optimal parallel test execution settings', parallelConfig);

  const config = {
    enabled: parallelConfig.enabled !== false && PARALLEL_ENABLED,
    environment: parallelConfig.environment || TEST_ENVIRONMENT,
    systemResources: parallelConfig.systemResources || {
      cpuCount: os.cpus().length,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    },
    maxWorkers: parallelConfig.maxWorkers || undefined,
    workerMemoryLimit: parallelConfig.workerMemoryLimit || 512 * 1024 * 1024, // 512MB
    ...parallelConfig
  };

  try {
    // Detect system CPU core count and available memory for optimal worker allocation
    const { cpuCount, freeMemory, totalMemory } = config.systemResources;
    
    logger.debug('System resources detected', {
      cpuCount,
      freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
      totalMemoryMB: Math.round(totalMemory / 1024 / 1024)
    });

    // Configure parallel execution based on test types (unit tests benefit more from parallelization)
    let optimalWorkers = 1;
    let parallelizationStrategy = 'sequential';
    
    if (config.enabled) {
      // Calculate optimal worker count based on CPU cores
      if (config.environment === 'development') {
        optimalWorkers = Math.max(1, Math.floor(cpuCount / 2)); // Conservative for development
        parallelizationStrategy = 'balanced';
      } else if (IS_CI) {
        optimalWorkers = Math.min(cpuCount, 4); // Limited for CI stability
        parallelizationStrategy = 'conservative';
      } else {
        optimalWorkers = cpuCount; // Full utilization for test environment
        parallelizationStrategy = 'aggressive';
      }

      // Apply maximum worker limit if specified
      if (config.maxWorkers) {
        optimalWorkers = Math.min(optimalWorkers, config.maxWorkers);
      }

      // Adjust workers based on available memory
      const memoryBasedWorkers = Math.floor(freeMemory / config.workerMemoryLimit);
      if (memoryBasedWorkers < optimalWorkers) {
        logger.warn('Reducing worker count due to memory constraints', {
          cpuBasedWorkers: optimalWorkers,
          memoryBasedWorkers,
          workerMemoryLimit: config.workerMemoryLimit
        });
        optimalWorkers = Math.max(1, memoryBasedWorkers);
        parallelizationStrategy = 'memory-constrained';
      }
    }

    // Set up job distribution strategy for balanced workload across worker processes
    const jobDistribution = {
      strategy: parallelizationStrategy,
      workers: optimalWorkers,
      loadBalancing: 'file-based', // Distribute by test files
      workStealing: true, // Allow workers to steal jobs from busy workers
      chunkSize: 1 // One test file per chunk
    };

    // Configure resource limits and memory constraints for parallel worker processes
    const resourceLimits = {
      memoryPerWorker: config.workerMemoryLimit,
      maxMemoryUsage: optimalWorkers * config.workerMemoryLimit,
      cpuTimeSlice: Math.floor(100 / optimalWorkers), // CPU percentage per worker
      workerTimeout: 60000, // 60 seconds worker timeout
      idleTimeout: 10000 // 10 seconds idle timeout
    };

    // Set up parallel execution exclusions for tests requiring sequential execution
    const sequentialExclusions = [
      // Tests that modify global state
      '../test/global-state/**/*.test.js',
      // Tests that use shared resources
      '../test/shared-resources/**/*.test.js',
      // Database integration tests
      '../test/database/**/*.test.js',
      // PM2 cluster tests
      '../test/pm2/**/*.test.js'
    ];

    // Configure timeout adjustments for parallel execution overhead and resource contention
    const timeoutAdjustments = {
      baseTimeout: TESTING_CONSTANTS.TEST_TIMEOUTS?.UNIT_TESTS || 10000,
      parallelMultiplier: 1.5, // 50% increase for parallel overhead
      workerStartupTime: 2000, // 2 seconds for worker startup
      resourceContentionBuffer: 1000 // 1 second buffer for resource contention
    };

    // Set up worker communication and error handling for robust parallel execution
    const workerOptions = {
      execArgv: [
        '--max-old-space-size=' + Math.floor(config.workerMemoryLimit / 1024 / 1024), // Memory limit in MB
        '--experimental-worker' // Enable worker threads
      ],
      env: {
        ...process.env,
        WORKER_ID: '${workerId}', // Placeholder for worker ID
        WORKER_COUNT: optimalWorkers.toString(),
        PARALLEL_EXECUTION: 'true'
      },
      stdio: 'pipe',
      timeout: resourceLimits.workerTimeout
    };

    // Return parallel execution configuration with optimal worker and resource settings
    const parallelExecutionConfig = {
      enabled: config.enabled,
      jobs: optimalWorkers === 1 ? 1 : optimalWorkers,
      jobDistribution,
      resourceLimits,
      sequentialExclusions,
      timeoutAdjustments,
      workerOptions: config.enabled ? workerOptions : null,
      metadata: {
        strategy: parallelizationStrategy,
        systemResources: config.systemResources,
        optimalWorkers,
        memoryPerWorker: config.workerMemoryLimit,
        environment: config.environment,
        createdAt: new Date().toISOString()
      }
    };

    // Update performance metrics
    PERFORMANCE_METRICS.parallelWorkers = optimalWorkers;

    logger.debug('Parallel execution configuration completed', {
      enabled: config.enabled,
      workers: optimalWorkers,
      strategy: parallelizationStrategy,
      memoryPerWorker: Math.round(config.workerMemoryLimit / 1024 / 1024) + 'MB'
    });

    return parallelExecutionConfig;

  } catch (error) {
    logger.error('Failed to configure parallel execution', error, config);
    
    // Return sequential fallback configuration
    return {
      enabled: false,
      jobs: 1,
      metadata: {
        strategy: 'sequential-fallback',
        error: error.message
      }
    };
  }
}

/**
 * Configures comprehensive test reporting with multiple output formats, environment-specific
 * reporters, coverage integration, and educational reporting for tutorial purposes with
 * detailed metrics collection and analysis capabilities.
 * 
 * @param {Object} [reporterConfig={}] - Reporter configuration options
 * @param {string} [reporterConfig.environment] - Target environment
 * @param {boolean} [reporterConfig.ci] - CI environment flag
 * @param {boolean} [reporterConfig.coverage] - Coverage integration flag
 * @param {string} [reporterConfig.outputDirectory] - Output directory path
 * @param {Array} [reporterConfig.formats] - Reporter formats to enable
 * @returns {Object} Reporter configuration with multiple output formats and environment-specific settings
 */
export function configureReporters(reporterConfig = {}) {
  logger.debug('Configuring comprehensive test reporting system', reporterConfig);

  const config = {
    environment: reporterConfig.environment || TEST_ENVIRONMENT,
    ci: reporterConfig.ci || IS_CI,
    coverage: reporterConfig.coverage !== false && COVERAGE_ENABLED,
    outputDirectory: reporterConfig.outputDirectory || './logs',
    formats: reporterConfig.formats || ['spec'],
    verbose: reporterConfig.verbose !== false,
    colors: reporterConfig.colors !== false && !IS_CI,
    ...reporterConfig
  };

  try {
    // Configure primary reporter based on environment (spec for development, json for CI)
    let primaryReporter = 'spec';
    let primaryOptions = {};

    if (config.ci) {
      primaryReporter = 'json';
      primaryOptions = {
        output: path.join(config.outputDirectory, 'mocha-test-results.json')
      };
    } else if (config.environment === 'production') {
      primaryReporter = 'tap';
      primaryOptions = {
        output: path.join(config.outputDirectory, 'mocha-production-results.tap')
      };
    } else {
      primaryReporter = 'spec';
      primaryOptions = {
        slow: 100,
        colors: config.colors,
        verbose: config.verbose
      };
    }

    // Set up secondary reporters for comprehensive output including HTML and TAP formats
    const secondaryReporters = [];
    
    if (config.formats.includes('html')) {
      secondaryReporters.push({
        name: 'html',
        output: path.join(config.outputDirectory, 'mocha-test-report.html'),
        options: {
          title: 'Node.js Tutorial Project Test Report',
          description: 'Comprehensive test results for Express.js and Flask implementations'
        }
      });
    }

    if (config.formats.includes('junit')) {
      secondaryReporters.push({
        name: 'junit',
        output: path.join(config.outputDirectory, 'junit-test-results.xml'),
        options: {
          mochaFile: path.join(config.outputDirectory, 'junit-test-results.xml'),
          suiteName: 'Node.js Tutorial Tests'
        }
      });
    }

    if (config.formats.includes('markdown')) {
      secondaryReporters.push({
        name: 'markdown',
        output: path.join(config.outputDirectory, 'test-report.md'),
        options: {
          title: 'Test Results Summary',
          includeStackTrace: false
        }
      });
    }

    // Configure coverage reporter integration with C8 tool for detailed coverage analysis
    const coverageReporterConfig = config.coverage ? {
      enabled: true,
      tool: 'c8',
      reporters: ['text', 'html', 'json', 'lcov'],
      outputDirectory: path.join(config.outputDirectory, '../coverage'),
      watermarks: TESTING_CONSTANTS.COVERAGE_THRESHOLDS?.GLOBAL || {
        statements: [70, 90],
        functions: [70, 95],
        branches: [60, 85],
        lines: [70, 90]
      },
      thresholds: TESTING_CONSTANTS.COVERAGE_THRESHOLDS?.GLOBAL || {
        statements: 90,
        functions: 95,
        branches: 85,
        lines: 90
      }
    } : null;

    // Set up performance reporter for response time and resource usage reporting
    const performanceReporterConfig = {
      enabled: true,
      metricsCollection: {
        responseTime: true,
        memoryUsage: true,
        cpuUsage: true,
        testDuration: true
      },
      thresholds: TESTING_CONSTANTS.PERFORMANCE_TARGETS || {
        unitTestTimeout: 100,
        integrationTestTimeout: 500,
        e2eTestTimeout: 2000
      },
      output: path.join(config.outputDirectory, 'performance-metrics.json')
    };

    // Configure security test reporter for Helmet.js validation and vulnerability reporting
    const securityReporterConfig = {
      enabled: true,
      securityEvents: {
        helmetValidation: true,
        vulnerabilityScanning: true,
        cspViolations: true,
        xssAttempts: true
      },
      output: path.join(config.outputDirectory, 'security-test-report.json'),
      alertThresholds: {
        criticalVulnerabilities: 0,
        highRiskIssues: 5,
        mediumRiskIssues: 20
      }
    };

    // Set up cross-platform comparison reporter for Express/Flask compatibility analysis
    const crossPlatformReporterConfig = config.environment === 'test' ? {
      enabled: process.env.CROSS_PLATFORM_TESTING === 'true',
      comparisons: {
        responseComparison: true,
        performanceComparison: true,
        endpointParity: true,
        errorHandling: true
      },
      output: path.join(config.outputDirectory, 'cross-platform-comparison.json'),
      tolerances: {
        responseTimeDifference: 50, // 50ms tolerance
        memoryUsageDifference: 10 // 10% tolerance
      }
    } : { enabled: false };

    // Configure educational reporter with tutorial-specific metrics and learning outcomes
    const educationalReporterConfig = {
      enabled: true,
      learningMetrics: {
        conceptsCovered: true,
        skillsDemo 
        stratersatedrated: true,
        progressTracking: true,
        difficultyAssessment: true
      },
      tutorials: {
        httpServerBasics: true,
        expressFramework: true,
        testingStrategies: true,
        securityImplementation: true,
        productionDeployment: true
      },
      output: path.join(config.outputDirectory, 'educational-progress.json')
    };

    // Set up file output destinations for all reporters with proper directory structure
    const outputConfig = {
      baseDirectory: config.outputDirectory,
      structure: {
        results: path.join(config.outputDirectory, 'results'),
        coverage: path.join(config.outputDirectory, '../coverage'),
        performance: path.join(config.outputDirectory, 'performance'),
        security: path.join(config.outputDirectory, 'security'),
        educational: path.join(config.outputDirectory, 'educational')
      },
      fileRotation: {
        enabled: true,
        maxFiles: 10,
        maxAge: '7d'
      }
    };

    // Return comprehensive reporter configuration with all output formats and destinations
    const reporterConfiguration = {
      primary: primaryReporter,
      options: primaryOptions,
      secondary: secondaryReporters,
      coverage: coverageReporterConfig,
      performance: performanceReporterConfig,
      security: securityReporterConfig,
      crossPlatform: crossPlatformReporterConfig,
      educational: educationalReporterConfig,
      output: outputConfig,
      metadata: {
        environment: config.environment,
        ci: config.ci,
        coverageEnabled: config.coverage,
        totalReporters: 1 + secondaryReporters.length,
        outputDirectory: config.outputDirectory,
        createdAt: new Date().toISOString()
      }
    };

    logger.debug('Reporter configuration completed', {
      primary: primaryReporter,
      secondary: secondaryReporters.length,
      coverage: config.coverage,
      environment: config.environment
    });

    return reporterConfiguration;

  } catch (error) {
    logger.error('Failed to configure reporters', error, config);
    
    // Return minimal fallback configuration
    return {
      primary: 'spec',
      options: {},
      secondary: [],
      metadata: {
        error: error.message,
        fallback: true
      }
    };
  }
}

/**
 * Configures adaptive timeout settings for different test types, environments, and
 * performance scenarios with intelligent timeout adjustment based on test complexity
 * and system performance characteristics.
 * 
 * @param {Object} [timeoutConfig={}] - Timeout configuration options
 * @param {string} [timeoutConfig.environment] - Target environment
 * @param {boolean} [timeoutConfig.ci] - CI environment flag
 * @param {number} [timeoutConfig.baseTimeout] - Base timeout value
 * @returns {Object} Timeout configuration with adaptive settings for different test scenarios
 */
export function configureTimeouts(timeoutConfig = {}) {
  logger.debug('Configuring adaptive timeout settings for test execution', timeoutConfig);

  const config = {
    environment: timeoutConfig.environment || TEST_ENVIRONMENT,
    ci: timeoutConfig.ci || IS_CI,
    baseTimeout: timeoutConfig.baseTimeout || TESTING_CONSTANTS.TEST_TIMEOUTS?.UNIT_TESTS || 10000,
    performanceMode: timeoutConfig.performanceMode || false,
    ...timeoutConfig
  };

  try {
    // Set base timeout values for unit tests (fast execution, 5000ms default)
    const unitTestTimeout = config.baseTimeout;
    
    // Configure extended timeouts for integration tests (HTTP requests, 10000ms default)
    const integrationTestTimeout = unitTestTimeout * 2;
    
    // Set longer timeouts for end-to-end tests (full workflows, 30000ms default)
    const e2eTestTimeout = unitTestTimeout * 6;
    
    // Configure performance test timeouts for load testing scenarios (60000ms default)
    const performanceTestTimeout = unitTestTimeout * 12;
    
    // Set security test timeouts for vulnerability scanning and validation (15000ms default)
    const securityTestTimeout = unitTestTimeout * 3;

    // Configure adaptive timeouts based on environment (longer for CI/CD systems)
    const environmentMultiplier = config.ci ? 2.0 : 1.0;
    const performanceMultiplier = config.performanceMode ? 0.5 : 1.0;
    
    const adjustedTimeouts = {
      unit: Math.floor(unitTestTimeout * environmentMultiplier * performanceMultiplier),
      integration: Math.floor(integrationTestTimeout * environmentMultiplier * performanceMultiplier),
      e2e: Math.floor(e2eTestTimeout * environmentMultiplier * performanceMultiplier),
      performance: Math.floor(performanceTestTimeout * environmentMultiplier),
      security: Math.floor(securityTestTimeout * environmentMultiplier * performanceMultiplier)
    };

    // Set up hook-specific timeouts for setup and teardown operations (30000ms default)
    const hookTimeouts = {
      before: Math.floor(30000 * environmentMultiplier),
      after: Math.floor(30000 * environmentMultiplier),
      beforeEach: Math.floor(10000 * environmentMultiplier),
      afterEach: Math.floor(10000 * environmentMultiplier)
    };

    // Configure timeout escalation for retries and error recovery scenarios
    const escalationConfig = {
      enabled: true,
      retryMultiplier: 1.5,
      maxRetries: config.ci ? 2 : 3,
      escalationThreshold: 0.8, // Escalate if test uses 80% of timeout
      recoveryTimeout: Math.floor(unitTestTimeout * 2 * environmentMultiplier)
    };

    // Determine global timeout for Mocha configuration
    const globalTimeout = Math.max(...Object.values(adjustedTimeouts));
    const slowThreshold = Math.floor(unitTestTimeout * 0.75); // 75% of unit test timeout

    // Return comprehensive timeout configuration with all scenario-specific settings
    const timeoutConfiguration = {
      globalTimeout,
      slowThreshold,
      testTypeTimeouts: adjustedTimeouts,
      hookTimeouts,
      escalation: escalationConfig,
      multipliers: {
        environment: environmentMultiplier,
        performance: performanceMultiplier,
        combined: environmentMultiplier * performanceMultiplier
      },
      metadata: {
        environment: config.environment,
        ci: config.ci,
        baseTimeout: config.baseTimeout,
        performanceMode: config.performanceMode,
        createdAt: new Date().toISOString()
      }
    };

    logger.debug('Timeout configuration completed', {
      globalTimeout,
      slowThreshold,
      environment: config.environment,
      environmentMultiplier
    });

    return timeoutConfiguration;

  } catch (error) {
    logger.error('Failed to configure timeouts', error, config);
    
    // Return fallback timeout configuration
    return {
      globalTimeout: 30000,
      slowThreshold: 75,
      testTypeTimeouts: {
        unit: 10000,
        integration: 20000,
        e2e: 60000
      },
      metadata: {
        error: error.message,
        fallback: true
      }
    };
  }
}

/**
 * Integrates code coverage tools including C8 with Mocha configuration, sets up
 * coverage thresholds, and configures coverage reporting for quality metrics
 * validation with comprehensive analysis and threshold enforcement.
 * 
 * @param {Object} [coverageConfig={}] - Coverage integration configuration
 * @param {boolean} [coverageConfig.enabled] - Enable coverage collection
 * @param {string} [coverageConfig.tool] - Coverage tool name
 * @param {Object} [coverageConfig.thresholds] - Coverage thresholds
 * @param {string} [coverageConfig.outputDirectory] - Coverage output directory
 * @param {Array} [coverageConfig.include] - Include patterns
 * @param {Array} [coverageConfig.exclude] - Exclude patterns
 * @returns {Object} Coverage integration configuration with tool settings and threshold validation
 */
export function integrateCoverageTools(coverageConfig = {}) {
  logger.debug('Integrating code coverage tools with Mocha configuration', coverageConfig);

  const config = {
    enabled: coverageConfig.enabled !== false && COVERAGE_ENABLED,
    tool: coverageConfig.tool || 'c8',
    thresholds: coverageConfig.thresholds || TESTING_CONSTANTS.COVERAGE_THRESHOLDS?.GLOBAL || {
      statements: 90,
      branches: 85,
      functions: 95,
      lines: 90
    },
    outputDirectory: coverageConfig.outputDirectory || './coverage/mocha',
    include: coverageConfig.include || ['../src/**/*.js', '../src/**/*.mjs'],
    exclude: coverageConfig.exclude || ['../test/**', '../coverage/**', '../node_modules/**'],
    reporters: coverageConfig.reporters || ['text', 'html', 'json', 'lcov'],
    ...coverageConfig
  };

  try {
    if (!config.enabled) {
      logger.info('Coverage integration disabled');
      return { enabled: false };
    }

    // Configure C8 coverage tool integration with Mocha test execution
    const c8Config = {
      enabled: config.tool === 'c8',
      reporter: config.reporters,
      reportsDir: config.outputDirectory,
      include: config.include,
      exclude: config.exclude,
      all: true,
      clean: true,
      checkCoverage: true,
      statements: config.thresholds.statements,
      branches: config.thresholds.branches,
      functions: config.thresholds.functions,
      lines: config.thresholds.lines,
      skipFull: false,
      tempDirectory: path.join(config.outputDirectory, '.tmp'),
      watermarks: {
        statements: [config.thresholds.statements - 20, config.thresholds.statements],
        functions: [config.thresholds.functions - 20, config.thresholds.functions],
        branches: [config.thresholds.branches - 20, config.thresholds.branches],
        lines: [config.thresholds.lines - 20, config.thresholds.lines]
      }
    };

    // Set up coverage thresholds (≥ 90% statements, ≥ 85% branches, ≥ 95% functions)
    const thresholdValidation = {
      enforced: true,
      failOnThreshold: config.failOnThreshold !== false,
      thresholds: config.thresholds,
      perFile: config.perFileThresholds || {
        statements: Math.max(70, config.thresholds.statements - 20),
        branches: Math.max(60, config.thresholds.branches - 20),
        functions: Math.max(80, config.thresholds.functions - 20),
        lines: Math.max(70, config.thresholds.lines - 20)
      }
    };

    // Configure coverage file patterns to include source code and exclude test files
    const filePatterns = {
      include: config.include.map(pattern => path.resolve(pattern)),
      exclude: config.exclude.map(pattern => path.resolve(pattern)),
      extensions: ['.js', '.mjs'],
      sourceMap: true,
      instrumenter: 'v8' // Use V8 built-in coverage
    };

    // Set up coverage report generation in multiple formats (text, html, json, lcov)
    const reportGeneration = {
      formats: config.reporters,
      destinations: {
        text: 'stdout',
        html: path.join(config.outputDirectory, 'index.html'),
        json: path.join(config.outputDirectory, 'coverage-final.json'),
        lcov: path.join(config.outputDirectory, 'lcov.info'),
        'json-summary': path.join(config.outputDirectory, 'coverage-summary.json')
      },
      options: {
        skipEmpty: false,
        skipFull: false,
        maxCols: 120,
        showBranches: true,
        showFunctions: true
      }
    };

    // Configure coverage output directories with proper organization and cleanup
    const outputManagement = {
      baseDirectory: config.outputDirectory,
      structure: {
        reports: path.join(config.outputDirectory, 'reports'),
        raw: path.join(config.outputDirectory, 'raw'),
        artifacts: path.join(config.outputDirectory, 'artifacts'),
        temp: path.join(config.outputDirectory, '.tmp')
      },
      cleanup: {
        enabled: true,
        removeTemp: true,
        retentionDays: 30
      }
    };

    // Set up coverage validation and threshold enforcement with failure reporting
    const validationConfig = {
      thresholdEnforcement: thresholdValidation,
      reportValidation: {
        checkIntegrity: true,
        validatePercentages: true,
        verifyFileInclusion: true
      },
      failureHandling: {
        failOnLowCoverage: config.failOnThreshold !== false,
        generateDetailedReport: true,
        includeUncoveredLines: true
      }
    };

    // Configure coverage integration with CI/CD systems for automated quality gates
    const ciIntegration = IS_CI ? {
      enabled: true,
      formats: ['json', 'lcov'],
      uploadArtifacts: true,
      qualityGates: {
        coverageDecrease: 5, // Max 5% decrease allowed
        uncoveredLines: 100 // Max 100 uncovered lines
      },
      notifications: {
        onFailure: true,
        onSuccess: false,
        channels: ['console', 'file']
      }
    } : { enabled: false };

    // Set up coverage trend tracking and regression detection for quality monitoring
    const trendTracking = {
      enabled: true,
      historicalData: path.join(config.outputDirectory, 'trends'),
      metrics: ['statements', 'branches', 'functions', 'lines'],
      alertThresholds: {
        significantDecrease: 10, // 10% decrease
        consistentDecline: 3 // 3 consecutive decreases
      },
      reporting: {
        generateTrendReport: true,
        includeGraphs: false, // Text-based for simplicity
        retentionPeriod: '90d'
      }
    };

    // Return comprehensive coverage configuration with tool integration and reporting
    const coverageConfiguration = {
      enabled: config.enabled,
      tool: config.tool,
      c8: c8Config,
      thresholds: thresholdValidation,
      filePatterns,
      reporting: reportGeneration,
      output: outputManagement,
      validation: validationConfig,
      ci: ciIntegration,
      trends: trendTracking,
      
      // Mocha integration settings
      mochaIntegration: {
        require: config.tool === 'c8' ? undefined : [`${config.tool}/register`],
        env: {
          NODE_V8_COVERAGE: config.tool === 'c8' ? config.outputDirectory : undefined
        }
      },
      
      metadata: {
        tool: config.tool,
        thresholds: config.thresholds,
        outputDirectory: config.outputDirectory,
        reporters: config.reporters,
        createdAt: new Date().toISOString()
      }
    };

    logger.debug('Coverage integration configuration completed', {
      enabled: config.enabled,
      tool: config.tool,
      thresholds: config.thresholds,
      reporters: config.reporters.length
    });

    return coverageConfiguration;

  } catch (error) {
    logger.error('Failed to integrate coverage tools', error, config);
    
    // Return disabled coverage configuration
    return {
      enabled: false,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Sets up comprehensive test hooks integration with setup.js, teardown.js, and hooks.js
 * modules for robust test lifecycle management and resource handling with proper
 * initialization order and error recovery mechanisms.
 * 
 * @param {Object} [hooksConfig={}] - Test hooks configuration
 * @param {string} [hooksConfig.setupModule] - Setup module path
 * @param {string} [hooksConfig.teardownModule] - Teardown module path
 * @param {string} [hooksConfig.hooksModule] - Hooks module path
 * @param {number} [hooksConfig.timeout] - Hook timeout value
 * @param {string} [hooksConfig.environment] - Target environment
 * @returns {Object} Test hooks configuration with lifecycle management and error handling
 */
export function setupTestHooks(hooksConfig = {}) {
  logger.debug('Setting up comprehensive test hooks integration', hooksConfig);

  const config = {
    setupModule: hooksConfig.setupModule || './setup.js',
    teardownModule: hooksConfig.teardownModule || './teardown.js',
    hooksModule: hooksConfig.hooksModule || './hooks.js',
    timeout: hooksConfig.timeout || 30000,
    environment: hooksConfig.environment || TEST_ENVIRONMENT,
    errorRecovery: hooksConfig.errorRecovery !== false,
    ...hooksConfig
  };

  try {
    // Configure global before hook integration with setup.js for test environment initialization
    const beforeHookConfig = {
      module: config.setupModule,
      functions: ['setupTestEnvironment'],
      classes: ['TestEnvironment'],
      timeout: config.timeout,
      errorHandling: {
        retryOnFailure: true,
        maxRetries: 2,
        fallbackAction: 'warn-and-continue'
      },
      initialization: {
        validateEnvironment: true,
        checkDependencies: true,
        setupResources: true
      }
    };

    // Set up global after hook integration with teardown.js for comprehensive cleanup
    const afterHookConfig = {
      module: config.teardownModule,
      functions: ['teardownTestEnvironment'],
      classes: ['TeardownManager'],
      timeout: config.timeout,
      errorHandling: {
        forceCleanup: true,
        ignoreErrors: false,
        logFailures: true
      },
      cleanup: {
        validateCleanup: true,
        checkResourceLeaks: true,
        performGarbageCollection: true
      }
    };

    // Configure beforeEach hook integration for test isolation and state reset
    const beforeEachHookConfig = {
      enabled: true,
      timeout: Math.floor(config.timeout / 3), // Shorter timeout for individual tests
      isolation: {
        resetGlobalState: true,
        clearMocks: true,
        resetEnvironmentVariables: false // Preserve test environment
      },
      validation: {
        checkTestPrerequisites: true,
        validateTestEnvironment: true
      }
    };

    // Set up afterEach hook integration for test cleanup and resource restoration
    const afterEachHookConfig = {
      enabled: true,
      timeout: Math.floor(config.timeout / 3),
      cleanup: {
        restoreGlobalState: true,
        clearTestData: true,
        releaseResources: true
      },
      metrics: {
        collectPerformanceData: true,
        trackMemoryUsage: true,
        recordTestDuration: true
      }
    };

    // Configure hook timeout settings with appropriate values for each hook type
    const timeoutSettings = {
      before: config.timeout,
      after: config.timeout,
      beforeEach: beforeEachHookConfig.timeout,
      afterEach: afterEachHookConfig.timeout,
      escalation: {
        warningThreshold: Math.floor(config.timeout * 0.8),
        errorThreshold: config.timeout,
        forceTerminationThreshold: config.timeout * 1.5
      }
    };

    // Set up hook error handling with recovery strategies and detailed error reporting
    const errorHandlingConfig = {
      globalErrorHandler: true,
      strategies: {
        setup: beforeHookConfig.errorHandling,
        teardown: afterHookConfig.errorHandling,
        isolation: {
          continueOnFailure: false,
          reportIsolationFailures: true
        }
      },
      recovery: {
        enabled: config.errorRecovery,
        attemptRecovery: true,
        fallbackToBasicSetup: true,
        maxRecoveryAttempts: 3
      },
      reporting: {
        detailedErrorLogs: true,
        includeStackTraces: true,
        generateErrorReport: true
      }
    };

    // Configure hook dependency management for proper initialization order
    const dependencyManagement = {
      initializationOrder: [
        config.setupModule,
        config.hooksModule
      ],
      cleanupOrder: [
        config.hooksModule,
        config.teardownModule
      ],
      dependencies: {
        [config.setupModule]: [],
        [config.hooksModule]: [config.setupModule],
        [config.teardownModule]: [config.hooksModule, config.setupModule]
      },
      validation: {
        checkDependencyAvailability: true,
        validateModuleExports: true,
        verifyInitializationOrder: true
      }
    };

    // Set up hook performance monitoring for lifecycle operation tracking
    const performanceMonitoring = {
      enabled: true,
      metrics: {
        hookExecutionTime: true,
        setupDuration: true,
        teardownDuration: true,
        isolationOverhead: true
      },
      thresholds: {
        setupWarning: 5000, // 5 seconds
        teardownWarning: 10000, // 10 seconds
        isolationWarning: 1000 // 1 second
      },
      reporting: {
        logSlowHooks: true,
        generatePerformanceReport: true,
        includeRecommendations: true
      }
    };

    // Return comprehensive hooks configuration with all lifecycle management settings
    const hooksConfiguration = {
      requireModules: [config.setupModule],
      fileModules: [config.hooksModule],
      
      hooks: {
        before: beforeHookConfig,
        after: afterHookConfig,
        beforeEach: beforeEachHookConfig,
        afterEach: afterEachHookConfig
      },
      
      timeouts: timeoutSettings,
      errorHandling: errorHandlingConfig,
      dependencies: dependencyManagement,
      performance: performanceMonitoring,
      
      // Integration settings
      integration: {
        setupTestEnvironment: {
          module: config.setupModule,
          function: 'setupTestEnvironment',
          class: 'TestEnvironment'
        },
        teardownTestEnvironment: {
          module: config.teardownModule,
          function: 'teardownTestEnvironment',
          class: 'TeardownManager'
        },
        hookManager: {
          module: config.hooksModule,
          class: 'HookManager'
        }
      },
      
      metadata: {
        environment: config.environment,
        timeout: config.timeout,
        errorRecovery: config.errorRecovery,
        modulesCount: 3,
        createdAt: new Date().toISOString()
      }
    };

    logger.debug('Test hooks configuration completed', {
      modules: [config.setupModule, config.teardownModule, config.hooksModule],
      timeout: config.timeout,
      errorRecovery: config.errorRecovery
    });

    return hooksConfiguration;

  } catch (error) {
    logger.error('Failed to setup test hooks', error, config);
    
    // Return minimal fallback configuration
    return {
      requireModules: ['./setup.js'],
      fileModules: ['./hooks.js'],
      metadata: {
        error: error.message,
        fallback: true
      }
    };
  }
}

/**
 * Validates the complete Mocha configuration for correctness, compatibility, and
 * completeness with comprehensive error checking and warning generation for
 * production readiness and educational compliance.
 * 
 * @param {Object} config - Mocha configuration object to validate
 * @param {Object} [validationOptions={}] - Validation options
 * @returns {Object} Validation result with status, errors, warnings, and recommendations
 */
export function validateConfiguration(config, validationOptions = {}) {
  const startTime = Date.now();
  
  logger.debug('Validating comprehensive Mocha configuration', {
    configKeys: Object.keys(config),
    validationOptions
  });

  const options = {
    strict: validationOptions.strict !== false,
    checkDependencies: validationOptions.checkDependencies !== false,
    validateFiles: validationOptions.validateFiles !== false,
    checkPerformance: validationOptions.checkPerformance !== false,
    ...validationOptions
  };

  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    compliance: {
      nodeVersion: false,
      dependencies: false,
      fileSystem: false,
      performance: false,
      security: false
    },
    metadata: {
      validatedAt: new Date().toISOString(),
      validationType: 'comprehensive',
      environment: TEST_ENVIRONMENT
    }
  };

  try {
    // Validate Node.js version compatibility with Mocha requirements (^18.18.0 || ^20.9.0 || >=21.1.0)
    const nodeVersionValidation = validateNodeVersion();
    if (!nodeVersionValidation.isValid) {
      validationResult.errors.push(`Node.js version ${process.version} is not compatible with Mocha requirements`);
      validationResult.isValid = false;
    } else {
      validationResult.compliance.nodeVersion = true;
      if (!nodeVersionValidation.isRecommended) {
        validationResult.warnings.push(`Node.js version ${process.version} is supported but ${nodeVersionValidation.recommended} is recommended`);
      }
    }

    // Check test framework dependencies and version compatibility with ES Modules
    if (options.checkDependencies) {
      const dependencyValidation = validateDependencies(config);
      validationResult.compliance.dependencies = dependencyValidation.isValid;
      validationResult.errors.push(...dependencyValidation.errors);
      validationResult.warnings.push(...dependencyValidation.warnings);
      if (!dependencyValidation.isValid) {
        validationResult.isValid = false;
      }
    }

    // Validate test file patterns and ensure test files exist and are accessible
    if (options.validateFiles) {
      const fileValidation = validateTestFiles(config);
      validationResult.compliance.fileSystem = fileValidation.isValid;
      validationResult.errors.push(...fileValidation.errors);
      validationResult.warnings.push(...fileValidation.warnings);
      if (!fileValidation.isValid) {
        validationResult.isValid = false;
      }
    }

    // Check timeout configuration values for reasonableness and environment appropriateness
    const timeoutValidation = validateTimeoutConfiguration(config);
    validationResult.errors.push(...timeoutValidation.errors);
    validationResult.warnings.push(...timeoutValidation.warnings);
    validationResult.recommendations.push(...timeoutValidation.recommendations);

    // Validate parallel execution settings against system resources and constraints
    const parallelValidation = validateParallelConfiguration(config);
    validationResult.warnings.push(...parallelValidation.warnings);
    validationResult.recommendations.push(...parallelValidation.recommendations);

    // Check reporter configuration and output destination accessibility
    const reporterValidation = validateReporterConfiguration(config);
    validationResult.errors.push(...reporterValidation.errors);
    validationResult.warnings.push(...reporterValidation.warnings);

    // Validate coverage tool integration and threshold settings
    const coverageValidation = validateCoverageConfiguration(config);
    validationResult.warnings.push(...coverageValidation.warnings);
    validationResult.recommendations.push(...coverageValidation.recommendations);

    // Check hook configuration and dependency availability
    const hookValidation = validateHookConfiguration(config);
    validationResult.errors.push(...hookValidation.errors);
    validationResult.warnings.push(...hookValidation.warnings);

    // Validate performance settings and resource allocation
    if (options.checkPerformance) {
      const performanceValidation = validatePerformanceConfiguration(config);
      validationResult.compliance.performance = performanceValidation.isValid;
      validationResult.warnings.push(...performanceValidation.warnings);
      validationResult.recommendations.push(...performanceValidation.recommendations);
    }

    // Validate security configuration and testing setup
    const securityValidation = validateSecurityConfiguration(config);
    validationResult.compliance.security = securityValidation.isValid;
    validationResult.warnings.push(...securityValidation.warnings);
    validationResult.recommendations.push(...securityValidation.recommendations);

    // Generate validation report with errors, warnings, and configuration recommendations
    const overallCompliance = Object.values(validationResult.compliance).filter(Boolean).length / 
                             Object.keys(validationResult.compliance).length;
    
    validationResult.complianceScore = Math.round(overallCompliance * 100);

    // Add general recommendations based on validation results
    if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
      validationResult.recommendations.push('Configuration is fully compliant and ready for production use');
    } else if (validationResult.errors.length === 0) {
      validationResult.recommendations.push('Configuration is valid but has warnings that should be addressed');
    } else {
      validationResult.recommendations.push('Configuration has critical errors that must be fixed before use');
    }

    // Add educational recommendations
    if (TEST_ENVIRONMENT === 'development') {
      validationResult.recommendations.push('Consider enabling verbose logging for educational purposes');
      validationResult.recommendations.push('Review test patterns to ensure comprehensive coverage of tutorial concepts');
    }

    // Update performance metrics
    PERFORMANCE_METRICS.validationTime = Date.now() - startTime;

    // Return comprehensive validation result with actionable feedback and status
    validationResult.metadata.validationTime = PERFORMANCE_METRICS.validationTime;
    validationResult.metadata.totalChecks = Object.keys(validationResult.compliance).length;
    validationResult.metadata.criticalErrors = validationResult.errors.length;
    validationResult.metadata.warnings = validationResult.warnings.length;

    logger.debug('Configuration validation completed', {
      isValid: validationResult.isValid,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      complianceScore: validationResult.complianceScore,
      validationTime: PERFORMANCE_METRICS.validationTime
    });

    return validationResult;

  } catch (error) {
    logger.error('Configuration validation failed', error, {
      config: typeof config,
      options,
      validationTime: Date.now() - startTime
    });

    validationResult.isValid = false;
    validationResult.errors.push(`Validation process failed: ${error.message}`);
    validationResult.metadata.validationError = error.message;
    
    return validationResult;
  }
}

/**
 * Comprehensive Mocha configuration manager class that orchestrates all aspects of
 * test configuration including environment detection, parallel execution, coverage
 * integration, and educational features for production-ready testing infrastructure.
 */
export class MochaConfigurationManager {
  /**
   * Initializes Mocha configuration manager with options and prepares for
   * comprehensive test configuration setup with validation and optimization.
   * 
   * @param {Object} [configOptions={}] - Configuration options for the manager
   */
  constructor(configOptions = {}) {
    logger.info('Initializing MochaConfigurationManager with comprehensive configuration capabilities');

    // Store configuration options and validate required properties
    this.configOptions = {
      environment: configOptions.environment || TEST_ENVIRONMENT,
      autoDetectEnvironment: configOptions.autoDetectEnvironment !== false,
      enableCaching: configOptions.enableCaching !== false,
      validateOnGeneration: configOptions.validateOnGeneration !== false,
      optimizeForPerformance: configOptions.optimizeForPerformance !== false,
      enableEducationalFeatures: configOptions.enableEducationalFeatures !== false,
      ...configOptions
    };

    // Initialize environment detection and configuration state tracking
    this.environment = null;
    this.config = null;
    this.isInitialized = false;
    this.validationResult = null;

    // Set up logging configuration for configuration management operations
    this.logger = logger;

    // Prepare validation tracking and error collection mechanisms
    this.validationHistory = [];
    this.performanceMetrics = {
      configurationGenerations: 0,
      totalConfigurationTime: 0,
      averageConfigurationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // Configure default settings and framework-specific optimizations
    this.defaults = {
      timeout: TESTING_CONSTANTS.TEST_TIMEOUTS?.UNIT_TESTS || 10000,
      parallel: PARALLEL_ENABLED,
      coverage: COVERAGE_ENABLED,
      security: true,
      crossPlatform: process.env.CROSS_PLATFORM_TESTING === 'true',
      pm2: process.env.PM2_TESTING === 'true',
      educational: this.configOptions.enableEducationalFeatures
    };

    // Initialize configuration cache for performance optimization
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes

    this.logger.debug('MochaConfigurationManager initialized', {
      options: this.configOptions,
      defaults: this.defaults,
      environment: this.configOptions.environment
    });

    this.isInitialized = true;
  }

  /**
   * Generates complete Mocha configuration with all advanced settings and
   * environment optimizations including parallel execution, coverage integration,
   * and comprehensive testing infrastructure setup.
   * 
   * @returns {Object} Complete Mocha configuration object ready for test execution
   */
  generateConfiguration() {
    const startTime = Date.now();
    
    this.logger.info('Generating comprehensive Mocha configuration', {
      environment: this.configOptions.environment,
      caching: this.configOptions.enableCaching,
      validation: this.configOptions.validateOnGeneration
    });

    try {
      // Check cache for existing configuration if caching is enabled
      const cacheKey = this.generateCacheKey();
      if (this.configOptions.enableCaching && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          this.performanceMetrics.cacheHits++;
          this.logger.debug('Using cached Mocha configuration', { cacheKey });
          return cached.config;
        }
      }

      this.performanceMetrics.cacheMisses++;

      // Detect environment settings and apply environment-specific optimizations
      if (this.configOptions.autoDetectEnvironment || !this.environment) {
        this.environment = detectEnvironmentSettings();
        this.logger.debug('Environment detected', {
          environment: this.environment.environment,
          optimalWorkers: this.environment.systemResources?.optimalWorkers
        });
      }

      // Generate base configuration using createMochaConfiguration
      const baseConfig = createMochaConfiguration({
        environment: this.configOptions.environment,
        parallel: this.defaults.parallel,
        timeout: this.defaults.timeout,
        coverage: this.defaults.coverage
      });

      // Configure test discovery patterns for comprehensive test organization
      const discoveryConfig = configureTestDiscovery({
        environment: this.configOptions.environment,
        crossPlatform: this.defaults.crossPlatform,
        includePerformance: true,
        includeSecurity: this.defaults.security
      });

      // Set up parallel execution configuration with system resource optimization
      const parallelConfig = configureParallelExecution({
        enabled: this.defaults.parallel,
        environment: this.configOptions.environment,
        systemResources: this.environment.systemResources
      });

      // Configure reporters with multiple output formats and destinations
      const reporterConfig = configureReporters({
        environment: this.configOptions.environment,
        ci: IS_CI,
        coverage: this.defaults.coverage,
        formats: ['spec', 'json', 'html']
      });

      // Set up timeout configuration with adaptive values for different test types
      const timeoutConfig = configureTimeouts({
        environment: this.configOptions.environment,
        ci: IS_CI,
        baseTimeout: this.defaults.timeout
      });

      // Integrate coverage tools with threshold validation and reporting
      const coverageConfig = integrateCoverageTools({
        enabled: this.defaults.coverage,
        tool: 'c8',
        thresholds: TESTING_CONSTANTS.COVERAGE_THRESHOLDS?.GLOBAL
      });

      // Configure test hooks integration with lifecycle management modules
      const hooksConfig = setupTestHooks({
        environment: this.configOptions.environment,
        timeout: timeoutConfig.hookTimeouts?.before || 30000
      });

      // Combine all configuration sections into comprehensive Mocha configuration
      this.config = {
        ...baseConfig,
        
        // Override with optimized settings
        spec: discoveryConfig.spec,
        ignore: discoveryConfig.ignore,
        parallel: parallelConfig.enabled,
        jobs: parallelConfig.jobs,
        timeout: timeoutConfig.globalTimeout,
        slow: timeoutConfig.slowThreshold,
        reporter: reporterConfig.primary,
        reporterOptions: reporterConfig.options,
        require: hooksConfig.requireModules,
        file: hooksConfig.fileModules,
        
        // Advanced configuration sections
        discovery: discoveryConfig,
        parallelExecution: parallelConfig,
        reporting: reporterConfig,
        timeouts: timeoutConfig,
        coverage: coverageConfig,
        hooks: hooksConfig,
        
        // Manager metadata
        manager: {
          generatedAt: new Date().toISOString(),
          environment: this.configOptions.environment,
          version: '1.0.0',
          features: {
            parallel: parallelConfig.enabled,
            coverage: coverageConfig.enabled,
            security: this.defaults.security,
            crossPlatform: this.defaults.crossPlatform,
            educational: this.defaults.educational
          }
        }
      };

      // Validate complete configuration and generate comprehensive settings object
      if (this.configOptions.validateOnGeneration) {
        this.validationResult = validateConfiguration(this.config, {
          strict: true,
          checkDependencies: true,
          validateFiles: false, // Skip file validation for performance
          checkPerformance: true
        });

        if (!this.validationResult.isValid) {
          this.logger.warn('Generated configuration has validation errors', {
            errors: this.validationResult.errors.length,
            warnings: this.validationResult.warnings.length
          });
        }

        this.config.validation = this.validationResult;
      }

      // Cache configuration for future use
      if (this.configOptions.enableCaching) {
        this.cache.set(cacheKey, {
          config: this.config,
          timestamp: Date.now()
        });
      }

      // Update performance metrics
      const configurationTime = Date.now() - startTime;
      this.performanceMetrics.configurationGenerations++;
      this.performanceMetrics.totalConfigurationTime += configurationTime;
      this.performanceMetrics.averageConfigurationTime = 
        this.performanceMetrics.totalConfigurationTime / this.performanceMetrics.configurationGenerations;

      // Return fully configured Mocha configuration ready for test execution
      this.logger.info('Mocha configuration generated successfully', {
        configurationTime,
        features: this.config.manager.features,
        validation: this.validationResult ? {
          isValid: this.validationResult.isValid,
          errors: this.validationResult.errors.length,
          warnings: this.validationResult.warnings.length
        } : 'skipped'
      });

      return this.config;

    } catch (error) {
      this.logger.error('Failed to generate Mocha configuration', error, {
        environment: this.configOptions.environment,
        configurationTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Updates existing configuration with new settings and re-validates for
   * consistency and compatibility with comprehensive change tracking.
   * 
   * @param {Object} updates - Configuration updates to apply
   * @returns {Object} Updated configuration object with validation results
   */
  updateConfiguration(updates) {
    this.logger.debug('Updating Mocha configuration with new settings', {
      updates: Object.keys(updates),
      hasExistingConfig: !!this.config
    });

    try {
      if (!this.config) {
        this.logger.warn('No existing configuration found, generating new configuration first');
        this.generateConfiguration();
      }

      // Merge new settings with existing configuration using deep merge strategy
      const mergedConfig = this.deepMerge(this.config, updates);

      // Re-validate updated configuration for consistency and compatibility
      const validationResult = validateConfiguration(mergedConfig, {
        strict: false,
        checkDependencies: false,
        validateFiles: false,
        checkPerformance: false
      });

      // Update environment-specific settings if environment has changed
      if (updates.environment && updates.environment !== this.configOptions.environment) {
        this.configOptions.environment = updates.environment;
        this.environment = null; // Force environment re-detection
        this.logger.info('Environment changed, will re-detect on next generation', {
          oldEnvironment: this.configOptions.environment,
          newEnvironment: updates.environment
        });
      }

      // Regenerate dependent configuration sections affected by updates
      const affectedSections = this.determineAffectedSections(updates);
      if (affectedSections.length > 0) {
        this.logger.debug('Regenerating affected configuration sections', {
          sections: affectedSections
        });
        
        // Clear cache to force regeneration
        if (this.configOptions.enableCaching) {
          this.cache.clear();
        }
      }

      // Update configuration and validation result
      this.config = mergedConfig;
      this.validationResult = validationResult;

      // Return updated configuration with validation status and warnings
      const updateResult = {
        config: this.config,
        validation: this.validationResult,
        changes: {
          applied: Object.keys(updates),
          affectedSections,
          timestamp: new Date().toISOString()
        }
      };

      this.logger.debug('Configuration updated successfully', {
        appliedChanges: Object.keys(updates).length,
        affectedSections: affectedSections.length,
        isValid: this.validationResult.isValid
      });

      return updateResult;

    } catch (error) {
      this.logger.error('Failed to update configuration', error, {
        updates: Object.keys(updates)
      });
      throw error;
    }
  }

  /**
   * Exports configuration in various formats for different use cases and
   * integration scenarios with comprehensive format support and validation.
   * 
   * @param {string} [format='object'] - Export format (object, json, file)
   * @returns {any} Configuration in requested format (object, JSON, file)
   */
  exportConfiguration(format = 'object') {
    this.logger.debug('Exporting Mocha configuration', {
      format,
      hasConfig: !!this.config
    });

    try {
      if (!this.config) {
        this.logger.warn('No configuration available, generating new configuration first');
        this.generateConfiguration();
      }

      // Validate export format and prepare configuration for serialization
      const supportedFormats = ['object', 'json', 'file', 'env'];
      if (!supportedFormats.includes(format)) {
        throw new Error(`Unsupported export format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
      }

      // Apply format-specific transformations and optimizations
      let exportData = this.config;
      
      if (format === 'json') {
        exportData = JSON.stringify(this.config, null, 2);
      } else if (format === 'file') {
        // Generate Mocha configuration file content
        exportData = this.generateConfigurationFile();
      } else if (format === 'env') {
        // Generate environment variables configuration
        exportData = this.generateEnvironmentVariables();
      }

      // Generate configuration output in requested format
      const exportResult = {
        format,
        data: exportData,
        metadata: {
          exportedAt: new Date().toISOString(),
          configurationVersion: this.config.manager?.version || '1.0.0',
          environment: this.configOptions.environment,
          validation: this.validationResult ? {
            isValid: this.validationResult.isValid,
            errors: this.validationResult.errors.length,
            warnings: this.validationResult.warnings.length
          } : null
        }
      };

      // Include metadata and validation information in export
      if (format === 'object') {
        exportResult.data.exportMetadata = exportResult.metadata;
      }

      this.logger.debug('Configuration exported successfully', {
        format,
        dataSize: typeof exportData === 'string' ? exportData.length : 'object',
        environment: this.configOptions.environment
      });

      // Return formatted configuration ready for consumption
      return format === 'object' ? exportResult : exportData;

    } catch (error) {
      this.logger.error('Failed to export configuration', error, {
        format,
        hasConfig: !!this.config
      });
      throw error;
    }
  }

  /**
   * Generates cache key for configuration caching
   * @private
   * @returns {string} Cache key
   */
  generateCacheKey() {
    const keyComponents = [
      this.configOptions.environment,
      PARALLEL_ENABLED,
      COVERAGE_ENABLED,
      IS_CI,
      JSON.stringify(this.defaults)
    ];
    
    return keyComponents.join('|');
  }

  /**
   * Deep merge two objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Determines which configuration sections are affected by updates
   * @private
   * @param {Object} updates - Configuration updates
   * @returns {Array} Affected section names
   */
  determineAffectedSections(updates) {
    const affectedSections = [];
    const sectionMap = {
      timeout: ['timeouts', 'hooks'],
      parallel: ['parallelExecution', 'performance'],
      environment: ['discovery', 'reporting', 'hooks'],
      coverage: ['coverage', 'reporting'],
      reporter: ['reporting']
    };
    
    for (const updateKey of Object.keys(updates)) {
      if (sectionMap[updateKey]) {
        affectedSections.push(...sectionMap[updateKey]);
      }
    }
    
    return [...new Set(affectedSections)];
  }

  /**
   * Generates Mocha configuration file content
   * @private
   * @returns {string} Configuration file content
   */
  generateConfigurationFile() {
    const configExport = {
      ...this.config,
      // Remove manager-specific metadata for file export
      manager: undefined,
      validation: undefined
    };
    
    return `// Generated Mocha configuration
// Created at: ${new Date().toISOString()}
// Environment: ${this.configOptions.environment}

module.exports = ${JSON.stringify(configExport, null, 2)};`;
  }

  /**
   * Generates environment variables for configuration
   * @private
   * @returns {Object} Environment variables object
   */
  generateEnvironmentVariables() {
    const envVars = {
      NODE_ENV: this.configOptions.environment,
      MOCHA_PARALLEL: this.config.parallel ? 'true' : 'false',
      MOCHA_TIMEOUT: this.config.timeout.toString(),
      MOCHA_REPORTER: this.config.reporter,
      COVERAGE: this.config.coverage?.enabled ? 'true' : 'false'
    };
    
    if (this.config.jobs && this.config.jobs !== 'auto') {
      envVars.MOCHA_JOBS = this.config.jobs.toString();
    }
    
    return envVars;
  }
}

// Helper functions for configuration validation

/**
 * Validates Node.js version compatibility
 * @private
 * @returns {Object} Validation result
 */
function validateNodeVersion() {
  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.slice(1).split('.')[0]);
  
  const isValid = majorVersion >= 18;
  const isRecommended = majorVersion >= 20;
  
  return {
    isValid,
    isRecommended,
    current: currentVersion,
    minimum: '18.18.0',
    recommended: '20.9.0'
  };
}

/**
 * Validates dependencies configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateDependencies(config) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  // Check for required Mocha configuration properties
  const requiredProperties = ['ui', 'timeout', 'reporter'];
  for (const prop of requiredProperties) {
    if (!(prop in config)) {
      result.errors.push(`Missing required property: ${prop}`);
      result.isValid = false;
    }
  }
  
  return result;
}

/**
 * Validates test file patterns
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateTestFiles(config) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  if (!config.spec || !Array.isArray(config.spec) || config.spec.length === 0) {
    result.errors.push('No test file patterns specified');
    result.isValid = false;
  }
  
  return result;
}

/**
 * Validates timeout configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateTimeoutConfiguration(config) {
  const result = {
    errors: [],
    warnings: [],
    recommendations: []
  };
  
  if (config.timeout < 1000) {
    result.warnings.push('Timeout value is very low (< 1 second)');
  } else if (config.timeout > 300000) {
    result.warnings.push('Timeout value is very high (> 5 minutes)');
  }
  
  return result;
}

/**
 * Validates parallel execution configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateParallelConfiguration(config) {
  const result = {
    warnings: [],
    recommendations: []
  };
  
  if (config.parallel && (!config.jobs || config.jobs === 1)) {
    result.warnings.push('Parallel execution enabled but only 1 worker configured');
  }
  
  return result;
}

/**
 * Validates reporter configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateReporterConfiguration(config) {
  const result = {
    errors: [],
    warnings: []
  };
  
  const validReporters = ['spec', 'json', 'html', 'tap', 'junit', 'markdown'];
  if (config.reporter && !validReporters.includes(config.reporter)) {
    result.warnings.push(`Unknown reporter: ${config.reporter}`);
  }
  
  return result;
}

/**
 * Validates coverage configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateCoverageConfiguration(config) {
  const result = {
    warnings: [],
    recommendations: []
  };
  
  if (config.coverage?.enabled && !config.coverage.thresholds) {
    result.recommendations.push('Consider setting coverage thresholds for quality assurance');
  }
  
  return result;
}

/**
 * Validates hook configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateHookConfiguration(config) {
  const result = {
    errors: [],
    warnings: []
  };
  
  if (config.require && !Array.isArray(config.require)) {
    result.errors.push('require configuration must be an array');
  }
  
  return result;
}

/**
 * Validates performance configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validatePerformanceConfiguration(config) {
  const result = {
    isValid: true,
    warnings: [],
    recommendations: []
  };
  
  if (config.jobs && typeof config.jobs === 'number' && config.jobs > os.cpus().length) {
    result.warnings.push(`Worker count (${config.jobs}) exceeds CPU cores (${os.cpus().length})`);
  }
  
  return result;
}

/**
 * Validates security configuration
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result
 */
function validateSecurityConfiguration(config) {
  const result = {
    isValid: true,
    warnings: [],
    recommendations: []
  };
  
  if (config.security?.enabled === false) {
    result.warnings.push('Security testing is disabled');
  }
  
  return result;
}

// Additional configuration helper functions

/**
 * Configures security testing settings
 * @private
 * @param {Object} securityConfig - Security configuration
 * @returns {Object} Security configuration
 */
function configureSecurityTesting(securityConfig = {}) {
  return {
    enabled: securityConfig.enabled !== false,
    helmetValidation: securityConfig.helmetValidation !== false,
    vulnerabilityScanning: securityConfig.vulnerabilityScanning || false,
    crossSiteScripting: securityConfig.crossSiteScripting !== false,
    contentSecurityPolicy: securityConfig.contentSecurityPolicy !== false
  };
}

/**
 * Configures cross-platform testing settings
 * @private
 * @param {Object} crossPlatformConfig - Cross-platform configuration
 * @returns {Object} Cross-platform configuration
 */
function configureCrossPlatformTesting(crossPlatformConfig = {}) {
  return {
    enabled: crossPlatformConfig.enabled || false,
    flaskCompatibility: crossPlatformConfig.flaskCompatibility || false,
    responseComparison: crossPlatformConfig.responseComparison || false,
    performanceComparison: crossPlatformConfig.performanceComparison || false,
    endpointParity: crossPlatformConfig.endpointParity || false
  };
}

/**
 * Configures PM2 testing settings
 * @private
 * @param {Object} pm2Config - PM2 configuration
 * @returns {Object} PM2 configuration
 */
function configurePM2Testing(pm2Config = {}) {
  return {
    enabled: pm2Config.enabled || false,
    clusterMode: pm2Config.clusterMode || false,
    processManagement: pm2Config.processManagement || false,
    zeroDowntimeDeployment: pm2Config.zeroDowntimeDeployment || false,
    loadBalancing: pm2Config.loadBalancing || false
  };
}

/**
 * Configures performance testing settings
 * @private
 * @param {Object} performanceConfig - Performance configuration
 * @returns {Object} Performance configuration
 */
function configurePerformanceTesting(performanceConfig = {}) {
  return {
    enabled: performanceConfig.enabled !== false,
    responseTimeThresholds: performanceConfig.responseTimeThresholds || {},
    memoryMonitoring: performanceConfig.memoryMonitoring !== false,
    cpuMonitoring: performanceConfig.cpuMonitoring !== false,
    loadTesting: performanceConfig.loadTesting || false
  };
}

// Log module initialization completion
logger.info('Mocha configuration module initialized successfully', {
  environment: TEST_ENVIRONMENT,
  parallel: PARALLEL_ENABLED,
  coverage: COVERAGE_ENABLED,
  ci: IS_CI,
  nodeVersion: process.version,
  platform: process.platform,
  exports: [
    'createMochaConfiguration',
    'MochaConfigurationManager',
    'detectEnvironmentSettings',
    'configureTestDiscovery',
    'configureParallelExecution',
    'configureReporters',
    'validateConfiguration'
  ]
});