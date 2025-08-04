/**
 * @fileoverview Test-Specific Jest Configuration Module for Node.js Tutorial Project
 * @description Test-specific Jest configuration module that extends the main Jest configuration with test directory optimizations,
 * enhanced test discovery, specialized coverage reporting, and comprehensive testing utilities integration. This configuration
 * is specifically tailored for the test directory execution environment, providing isolated test execution with support for
 * cross-platform testing, PM2 cluster mode validation, security testing with Helmet.js, performance benchmarking, and
 * educational demonstration patterns. Implements modern ES Modules support with Node.js v22.x LTS compatibility, dynamic
 * configuration based on environment detection, and seamless integration with the comprehensive testing infrastructure
 * including setup/teardown lifecycle management, test helpers, and dual framework support for both Jest and Mocha
 * compatibility testing scenarios.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Test directory specific Jest configuration with inheritance from main config
 * - Comprehensive test discovery patterns for organized test directory structure
 * - Performance optimization for test directory execution with worker management
 * - Test lifecycle management with directory-specific setup and teardown
 * - Cross-platform testing configuration for Express/Flask compatibility
 * - Security testing integration with Helmet.js validation patterns
 * - Performance testing configuration with benchmarking and metrics
 * - PM2 cluster mode testing with production deployment validation
 * - Educational testing patterns with comprehensive coverage and reporting
 * 
 * Educational Value:
 * - Understanding Jest configuration inheritance and extension patterns
 * - Implementing test directory isolation and optimization strategies
 * - Configuring comprehensive test discovery for different test types
 * - Setting up performance optimization for efficient test execution
 * - Managing test lifecycle with setup, teardown, and helper integration
 * - Implementing cross-platform testing configuration and validation
 * - Configuring security testing with vulnerability detection
 * - Setting up production deployment testing with PM2 integration
 * - Creating educational testing patterns for tutorial demonstration
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Jest latest with test directory specific optimization
 * - Express.js v5.1.0 testing environment configuration
 * - PM2 cluster mode testing process management
 * - Helmet.js security middleware testing integration
 * - SuperTest for HTTP endpoint testing and validation
 * - Cross-platform compatibility for Node.js and Flask implementations
 */

// Node.js built-in modules for system interaction and path resolution
import path from 'node:path'; // Node.js built-in - Cross-platform file path utilities for test directory configuration
import os from 'node:os'; // Node.js built-in - Operating system utilities for CPU core detection and optimal Jest worker configuration
import { fileURLToPath } from 'node:url'; // Node.js built-in - URL utilities for ES Modules __dirname and __filename compatibility

// Internal imports with comprehensive testing infrastructure integration
import baseJestConfig from '../jest/jest.config.js'; // Import base Jest configuration for extension and test directory-specific overrides
import { setupTestEnvironment, TestEnvironment } from './setup.js'; // Import test environment setup and validation classes
import { globalTeardown } from './teardown.js'; // Import global teardown function for comprehensive test cleanup and resource deallocation
import { setupTestHelpers } from './helpers/test-helpers.js'; // Import test helpers setup for comprehensive testing utilities
import { TESTING_CONSTANTS } from '../utils/constants.js'; // Import testing constants for coverage thresholds, timeout configuration, and performance targets

// ES Modules compatibility globals for test directory configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test directory specific globals for Jest configuration and execution environment
global.TEST_DIR_CONFIG = true;
global.IS_TEST_EXECUTION = true;
global.TEST_ISOLATION_MODE = 'directory';

/**
 * Creates comprehensive Jest configuration object specifically optimized for test directory execution
 * with enhanced test discovery, performance optimization, coverage reporting, and integration with
 * test helpers, setup/teardown lifecycle, and comprehensive testing utilities.
 * 
 * @param {Object} options - Configuration options for test directory Jest setup
 * @param {string} [options.environment='test'] - Target environment for configuration optimization
 * @param {boolean} [options.enableCoverage=true] - Enable code coverage collection and reporting
 * @param {boolean} [options.enablePerformance=true] - Enable performance optimization features
 * @param {boolean} [options.enableSecurity=true] - Enable security testing configuration
 * @param {boolean} [options.enableCrossPlatform=true] - Enable cross-platform testing support
 * @param {Object} [options.customPaths={}] - Custom path overrides for test directory structure
 * @returns {Object} Complete Jest configuration object with test directory optimizations and comprehensive testing support
 */
export function createTestJestConfig(options = {}) {
  // Set up configuration defaults with comprehensive test directory support
  const config = {
    environment: options.environment || 'test',
    enableCoverage: options.enableCoverage !== false,
    enablePerformance: options.enablePerformance !== false,
    enableSecurity: options.enableSecurity !== false,
    enableCrossPlatform: options.enableCrossPlatform !== false,
    customPaths: options.customPaths || {},
    ...options
  };

  // Detect current environment for configuration optimization
  const currentEnvironment = process.env.NODE_ENV || config.environment;
  const isCIEnvironment = process.env.CI === 'true';
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

  // Calculate optimal worker count based on available CPU cores and test directory requirements
  const optimalWorkers = calculateOptimalWorkerCount({
    environment: currentEnvironment,
    isCI: isCIEnvironment,
    testDirectoryMode: true
  });

  // Configure test discovery patterns specific to test directory structure and organization
  const testDiscoveryConfig = configureTestDiscovery({
    includeUnit: true,
    includeIntegration: true,
    includeE2E: true,
    includePerformance: config.enablePerformance,
    includeSecurity: config.enableSecurity,
    includeCrossPlatform: config.enableCrossPlatform,
    customPatterns: config.customPaths.testPatterns || []
  });

  // Set up coverage collection with test directory specific patterns and exclusions
  const coverageConfig = setupTestCoverage({
    enabled: config.enableCoverage,
    testDirectoryMode: true,
    includePerformanceTests: config.enablePerformance,
    includeSecurityTests: config.enableSecurity,
    customExclusions: config.customPaths.coverageExclusions || []
  });

  // Configure test environment variables and global test utilities initialization
  const environmentConfig = configureTestEnvironment({
    testDirectory: __dirname,
    enableHelpers: true,
    enableSecurity: config.enableSecurity,
    enableCrossPlatform: config.enableCrossPlatform,
    customGlobals: config.customPaths.globals || {}
  });

  // Set up test directory specific timeout configurations and performance settings
  const performanceConfig = optimizeTestPerformance({
    enabled: config.enablePerformance,
    maxWorkers: optimalWorkers,
    testDirectory: __dirname,
    environment: currentEnvironment,
    ciOptimization: isCIEnvironment
  });

  // Configure test directory specific reporter configurations for enhanced output
  const reportingConfig = configureTestReporting(isCIEnvironment, {
    enableEducational: true,
    enablePerformanceMetrics: config.enablePerformance,
    enableSecurityReporting: config.enableSecurity,
    outputDirectory: path.join(__dirname, '../coverage/test-jest')
  });

  // Apply test directory specific overrides for CI, development, and production testing scenarios
  const testDirectoryOverrides = {
    // Test directory root configuration
    rootDir: __dirname,
    displayName: {
      name: 'Test Directory Jest Configuration',
      color: 'cyan'
    },

    // Test directory specific module name mapping for test helpers and utilities resolution
    moduleNameMapper: {
      '^@/(.*)$': path.join(__dirname, '../$1'),
      '^@backend/(.*)$': path.join(__dirname, '../$1'),
      '^@test/(.*)$': path.join(__dirname, '$1'),
      '^@helpers/(.*)$': path.join(__dirname, 'helpers/$1'),
      '^@fixtures/(.*)$': path.join(__dirname, 'fixtures/$1'),
      '^@config/(.*)$': path.join(__dirname, '../config/$1'),
      '^@utils/(.*)$': path.join(__dirname, '../utils/$1'),
      '^@mocks/(.*)$': path.join(__dirname, '__mocks__/$1')
    },

    // Test directory specific setup and teardown file paths for test lifecycle management
    globalSetup: path.join(__dirname, 'setup.js'),
    globalTeardown: path.join(__dirname, 'teardown.js'),
    setupFilesAfterEnv: [
      path.join(__dirname, 'helpers/test-helpers.js')
    ],

    // Test directory specific environment variables for test execution mode and configuration
    globals: {
      ...environmentConfig.globals,
      __TEST_DIRECTORY__: __dirname,
      __TEST_CONFIG_MODE__: 'directory_specific',
      __ENABLE_CROSS_PLATFORM__: config.enableCrossPlatform,
      __ENABLE_SECURITY_TESTING__: config.enableSecurity,
      __ENABLE_PERFORMANCE_TESTING__: config.enablePerformance
    }
  };

  // Return complete Jest configuration object with all test directory optimizations applied
  return mergeWithBaseConfig(baseJestConfig, {
    ...testDiscoveryConfig,
    ...coverageConfig,
    ...environmentConfig,
    ...performanceConfig,
    ...reportingConfig,
    ...testDirectoryOverrides
  });
}

/**
 * Merges test directory specific configuration with base Jest configuration while preserving
 * base settings and applying appropriate overrides for test directory execution optimization.
 * 
 * @param {Object} baseConfig - Base Jest configuration object from main jest.config.js
 * @param {Object} testDirOverrides - Test directory specific configuration overrides
 * @returns {Object} Merged Jest configuration with base settings preserved and test directory optimizations applied
 */
export function mergeWithBaseConfig(baseConfig, testDirOverrides) {
  // Deep clone base Jest configuration to prevent mutation of original configuration
  const mergedConfig = JSON.parse(JSON.stringify(baseConfig));

  // Apply test directory specific test matching patterns while preserving base patterns
  if (testDirOverrides.testMatch) {
    mergedConfig.testMatch = [
      ...mergedConfig.testMatch || [],
      ...testDirOverrides.testMatch
    ];
  }

  // Merge coverage configuration with test directory specific collection patterns
  if (testDirOverrides.collectCoverageFrom) {
    mergedConfig.collectCoverageFrom = [
      ...mergedConfig.collectCoverageFrom || [],
      ...testDirOverrides.collectCoverageFrom
    ];
  }

  // Override setup and teardown file paths to use test directory specific files
  if (testDirOverrides.globalSetup) {
    mergedConfig.globalSetup = testDirOverrides.globalSetup;
  }

  if (testDirOverrides.globalTeardown) {
    mergedConfig.globalTeardown = testDirOverrides.globalTeardown;
  }

  if (testDirOverrides.setupFilesAfterEnv) {
    mergedConfig.setupFilesAfterEnv = testDirOverrides.setupFilesAfterEnv;
  }

  // Merge timeout configurations with test directory specific performance requirements
  if (testDirOverrides.testTimeout) {
    mergedConfig.testTimeout = testDirOverrides.testTimeout;
  }

  // Apply test directory specific module name mapping while preserving base mappings
  if (testDirOverrides.moduleNameMapper) {
    mergedConfig.moduleNameMapper = {
      ...mergedConfig.moduleNameMapper || {},
      ...testDirOverrides.moduleNameMapper
    };
  }

  // Override reporter configurations for test directory specific output requirements
  if (testDirOverrides.reporters) {
    mergedConfig.reporters = testDirOverrides.reporters;
  }

  // Merge watch mode settings with test directory development workflow optimizations
  if (testDirOverrides.watchPlugins) {
    mergedConfig.watchPlugins = [
      ...mergedConfig.watchPlugins || [],
      ...testDirOverrides.watchPlugins
    ];
  }

  // Apply test directory specific environment variable overrides
  if (testDirOverrides.globals) {
    mergedConfig.globals = {
      ...mergedConfig.globals || {},
      ...testDirOverrides.globals
    };
  }

  // Apply all other test directory specific overrides
  Object.keys(testDirOverrides).forEach(key => {
    if (!['testMatch', 'collectCoverageFrom', 'moduleNameMapper', 'reporters', 'watchPlugins', 'globals'].includes(key)) {
      mergedConfig[key] = testDirOverrides[key];
    }
  });

  // Return merged configuration object with comprehensive test directory support
  return mergedConfig;
}

/**
 * Configures comprehensive test file discovery patterns for test directory including unit tests,
 * integration tests, end-to-end tests, performance tests, security tests with proper exclusion
 * patterns and watch mode optimization.
 * 
 * @param {Object} discoveryOptions - Test discovery configuration options
 * @param {boolean} [discoveryOptions.includeUnit=true] - Include unit test discovery patterns
 * @param {boolean} [discoveryOptions.includeIntegration=true] - Include integration test patterns
 * @param {boolean} [discoveryOptions.includeE2E=true] - Include end-to-end test patterns
 * @param {boolean} [discoveryOptions.includePerformance=true] - Include performance test patterns
 * @param {boolean} [discoveryOptions.includeSecurity=true] - Include security test patterns
 * @param {Array} [discoveryOptions.customPatterns=[]] - Additional custom test patterns
 * @returns {Object} Test discovery configuration with patterns, exclusions, and watch settings
 */
export function configureTestDiscovery(discoveryOptions = {}) {
  const options = {
    includeUnit: discoveryOptions.includeUnit !== false,
    includeIntegration: discoveryOptions.includeIntegration !== false,
    includeE2E: discoveryOptions.includeE2E !== false,
    includePerformance: discoveryOptions.includePerformance !== false,
    includeSecurity: discoveryOptions.includeSecurity !== false,
    customPatterns: discoveryOptions.customPatterns || [],
    ...discoveryOptions
  };

  // Set up unit test discovery patterns for test/unit directory with .test.js extension
  const unitTestPatterns = options.includeUnit ? [
    '**/unit/**/*.test.js',
    '**/unit/**/*.spec.js'
  ] : [];

  // Configure integration test patterns for test/integration directory structure
  const integrationTestPatterns = options.includeIntegration ? [
    '**/integration/**/*.test.js',
    '**/integration/**/*.spec.js',
    '**/integration/express-*.test.js',
    '**/integration/flask-*.test.js'
  ] : [];

  // Set up end-to-end test discovery patterns for test/e2e directory
  const e2eTestPatterns = options.includeE2E ? [
    '**/e2e/**/*.test.js',
    '**/e2e/**/*.spec.js',
    '**/e2e/pm2-cluster.test.js',
    '**/e2e/zero-downtime.test.js'
  ] : [];

  // Configure performance test patterns for test/performance directory with benchmarking support
  const performanceTestPatterns = options.includePerformance ? [
    '**/performance/**/*.test.js',
    '**/performance/**/*.spec.js',
    '**/performance/response-time.test.js',
    '**/performance/load-*.test.js',
    '**/performance/benchmark-*.test.js'
  ] : [];

  // Set up security test discovery patterns for test/security directory with Helmet.js validation
  const securityTestPatterns = options.includeSecurity ? [
    '**/security/**/*.test.js',
    '**/security/**/*.spec.js',
    '**/security/helmet-*.test.js',
    '**/security/vulnerability-*.test.js',
    '**/security/csrf-*.test.js'
  ] : [];

  // Configure cross-platform test discovery for Flask compatibility testing scenarios
  const crossPlatformTestPatterns = [
    '**/integration/cross-platform.test.js',
    '**/compatibility/**/*.test.js'
  ];

  // Configure test path ignore patterns to exclude node_modules, coverage, and build directories
  const testPathIgnorePatterns = [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/',
    '/.git/',
    '/logs/',
    '/tmp/',
    '/bin/',
    '**/*.config.js',
    '**/*.config.ts'
  ];

  // Set up watch path ignore patterns for efficient watch mode operation during development
  const watchPathIgnorePatterns = [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/',
    '/logs/',
    '/.git/',
    '**/*.log',
    '**/*.tmp'
  ];

  // Return comprehensive test discovery configuration with all patterns and exclusions
  return {
    testMatch: [
      ...unitTestPatterns,
      ...integrationTestPatterns,
      ...e2eTestPatterns,
      ...performanceTestPatterns,
      ...securityTestPatterns,
      ...crossPlatformTestPatterns,
      ...options.customPatterns,
      '**/*.test.js' // Fallback pattern for any test files
    ],
    testPathIgnorePatterns,
    watchPathIgnorePatterns,
    modulePathIgnorePatterns: testPathIgnorePatterns
  };
}

/**
 * Configures comprehensive code coverage collection and reporting specifically for test directory
 * execution with quality gates, multiple output formats, file-specific thresholds, and educational
 * coverage requirements.
 * 
 * @param {Object} coverageConfig - Coverage configuration options
 * @param {boolean} [coverageConfig.enabled=true] - Enable coverage collection
 * @param {boolean} [coverageConfig.testDirectoryMode=true] - Optimize for test directory execution
 * @param {boolean} [coverageConfig.includePerformanceTests=true] - Include performance test coverage
 * @param {boolean} [coverageConfig.includeSecurityTests=true] - Include security test coverage
 * @param {Array} [coverageConfig.customExclusions=[]] - Additional coverage exclusion patterns
 * @returns {Object} Coverage configuration with collection patterns, reporters, thresholds, and quality gates
 */
export function setupTestCoverage(coverageConfig = {}) {
  const config = {
    enabled: coverageConfig.enabled !== false,
    testDirectoryMode: coverageConfig.testDirectoryMode !== false,
    includePerformanceTests: coverageConfig.includePerformanceTests !== false,
    includeSecurityTests: coverageConfig.includeSecurityTests !== false,
    customExclusions: coverageConfig.customExclusions || [],
    ...coverageConfig
  };

  if (!config.enabled) {
    return { collectCoverage: false };
  }

  // Configure coverage collection patterns to include all source files while excluding test files
  const collectCoverageFrom = [
    '../**/*.js', // Include all source files relative to test directory
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**',
    '!**/jest/**',
    '!**/mocha/**',
    '!**/*.config.js',
    '!**/bin/**',
    '!**/logs/**',
    '!**/tmp/**',
    '!**/dist/**',
    '!**/build/**',
    ...config.customExclusions
  ];

  // Configure coverage directory path relative to test directory location for organized output
  const coverageDirectory = path.join(__dirname, '../coverage/test-jest');

  // Set up multiple coverage reporters including text, HTML, JSON, and LCOV for comprehensive reporting
  const coverageReporters = [
    'text',
    'html',
    'json',
    'lcov',
    'text-summary',
    'clover'
  ];

  // Apply global coverage thresholds from TESTING_CONSTANTS for automated quality gates
  const coverageThreshold = {
    global: {
      branches: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.GLOBAL.branches,
      functions: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.GLOBAL.functions,
      lines: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.GLOBAL.lines,
      statements: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.GLOBAL.statements
    },
    // Configure file-specific coverage thresholds for critical components
    '../server.js': {
      branches: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.CRITICAL_FILES.branches,
      functions: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.CRITICAL_FILES.functions,
      lines: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.CRITICAL_FILES.lines,
      statements: TESTING_CONSTANTS.COVERAGE_THRESHOLDS.CRITICAL_FILES.statements
    },
    '../express-server.js': {
      branches: 90,
      functions: 100,
      lines: 90,
      statements: 90
    },
    '../utils/': {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    },
    '../middleware/': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90
    }
  };

  // Return comprehensive coverage configuration with quality gates and reporting capabilities
  return {
    collectCoverage: true,
    collectCoverageFrom,
    coverageDirectory,
    coverageReporters,
    coverageThreshold,
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/test/',
      '/coverage/',
      '/jest/',
      '/mocha/',
      '**/*.config.js',
      '**/*.test.js',
      '**/*.spec.js'
    ]
  };
}

/**
 * Configures test environment settings including Node.js environment, ES Modules support,
 * global setup/teardown, test helpers initialization, and cross-platform testing support
 * for educational demonstration.
 * 
 * @param {Object} environmentConfig - Test environment configuration options
 * @param {string} [environmentConfig.testDirectory] - Test directory path for configuration
 * @param {boolean} [environmentConfig.enableHelpers=true] - Enable test helpers initialization
 * @param {boolean} [environmentConfig.enableSecurity=true] - Enable security testing features
 * @param {boolean} [environmentConfig.enableCrossPlatform=true] - Enable cross-platform testing
 * @param {Object} [environmentConfig.customGlobals={}] - Custom global variables
 * @returns {Object} Test environment configuration with setup, teardown, and utilities integration
 */
export function configureTestEnvironment(environmentConfig = {}) {
  const config = {
    testDirectory: environmentConfig.testDirectory || __dirname,
    enableHelpers: environmentConfig.enableHelpers !== false,
    enableSecurity: environmentConfig.enableSecurity !== false,
    enableCrossPlatform: environmentConfig.enableCrossPlatform !== false,
    customGlobals: environmentConfig.customGlobals || {},
    ...environmentConfig
  };

  // Set test environment to 'node' for backend testing without browser dependencies
  const testEnvironment = 'node';

  // Configure ES Modules support with extensionsToTreatAsEsm and empty transform object
  const extensionsToTreatAsEsm = ['.js'];
  const transform = {}; // Empty transform for native ES Modules support

  // Configure test timeout values based on TESTING_CONSTANTS for various test types
  const testTimeout = TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS;

  // Set up test environment variables for test execution mode and configuration
  const globals = {
    __TEST_DIRECTORY__: config.testDirectory,
    __TEST_ENVIRONMENT__: 'test_directory',
    __NODE_ENV__: 'test',
    __ENABLE_COVERAGE__: true,
    __ENABLE_SECURITY_TESTING__: config.enableSecurity,
    __ENABLE_CROSS_PLATFORM__: config.enableCrossPlatform,
    __ENABLE_PERFORMANCE_TESTING__: true,
    __JEST_TEST_TIMEOUT__: testTimeout,
    ...config.customGlobals
  };

  // Return comprehensive test environment configuration with lifecycle management
  return {
    testEnvironment,
    extensionsToTreatAsEsm,
    transform,
    testTimeout,
    globals,
    moduleFileExtensions: ['js', 'json', 'mjs'],
    preset: null // Disable preset for custom configuration
  };
}

/**
 * Configures performance optimization settings for test directory execution including worker
 * management, parallel execution, memory optimization, and resource usage monitoring for
 * efficient test execution.
 * 
 * @param {Object} performanceOptions - Performance configuration options
 * @param {boolean} [performanceOptions.enabled=true] - Enable performance optimizations
 * @param {string|number} [performanceOptions.maxWorkers] - Maximum worker count for parallel execution
 * @param {string} [performanceOptions.testDirectory] - Test directory path for optimization
 * @param {string} [performanceOptions.environment='test'] - Environment for optimization strategy
 * @param {boolean} [performanceOptions.ciOptimization=false] - Enable CI-specific optimizations
 * @returns {Object} Performance configuration with worker management, parallel execution, and optimization settings
 */
export function optimizeTestPerformance(performanceOptions = {}) {
  const options = {
    enabled: performanceOptions.enabled !== false,
    maxWorkers: performanceOptions.maxWorkers,
    testDirectory: performanceOptions.testDirectory || __dirname,
    environment: performanceOptions.environment || 'test',
    ciOptimization: performanceOptions.ciOptimization === true,
    ...performanceOptions
  };

  if (!options.enabled) {
    return {};
  }

  // Calculate optimal worker count based on available CPU cores and test directory requirements
  const maxWorkers = options.maxWorkers || calculateOptimalWorkerCount({
    environment: options.environment,
    isCI: options.ciOptimization,
    testDirectoryMode: true
  });

  // Configure max workers setting for parallel test execution with resource consideration
  const workerConfig = {
    maxWorkers
  };

  // Set up test execution timeout optimization based on test types and performance targets
  const timeoutConfig = {
    testTimeout: TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS,
    slowTestThreshold: TESTING_CONSTANTS.PERFORMANCE_TARGETS.UNIT_TEST_TIMEOUT
  };

  // Configure bail settings for failing fast on test failures in CI environments
  const bailConfig = {
    bail: options.ciOptimization ? 1 : false
  };

  // Set up verbose output configuration for detailed test execution feedback
  const outputConfig = {
    verbose: !options.ciOptimization,
    silent: false
  };

  // Configure handle and leak detection for debugging test resource management
  const debugConfig = {
    detectHandles: true,
    detectLeaks: true,
    detectOpenHandles: true,
    forceExit: options.ciOptimization
  };

  // Return comprehensive performance configuration with optimization and monitoring capabilities
  return {
    ...workerConfig,
    ...timeoutConfig,
    ...bailConfig,
    ...outputConfig,
    ...debugConfig,
    cache: !options.ciOptimization,
    cacheDirectory: path.join(options.testDirectory, '../node_modules/.cache/jest')
  };
}

/**
 * Configures comprehensive test reporting including console output, CI/CD integration, coverage
 * reports, performance metrics, and educational demonstration with detailed test execution feedback.
 * 
 * @param {boolean} isCIEnvironment - Whether running in CI/CD environment
 * @param {Object} reportingOptions - Reporting configuration options
 * @param {boolean} [reportingOptions.enableEducational=true] - Enable educational reporting features
 * @param {boolean} [reportingOptions.enablePerformanceMetrics=true] - Enable performance reporting
 * @param {boolean} [reportingOptions.enableSecurityReporting=true] - Enable security test reporting
 * @param {string} [reportingOptions.outputDirectory] - Output directory for reports
 * @returns {Array} Array of Jest reporter configurations for comprehensive test output and integration
 */
export function configureTestReporting(isCIEnvironment, reportingOptions = {}) {
  const options = {
    enableEducational: reportingOptions.enableEducational !== false,
    enablePerformanceMetrics: reportingOptions.enablePerformanceMetrics !== false,
    enableSecurityReporting: reportingOptions.enableSecurityReporting !== false,
    outputDirectory: reportingOptions.outputDirectory || path.join(__dirname, '../coverage/test-jest'),
    ...reportingOptions
  };

  // Set up default Jest reporter for detailed console output with verbose test results
  const reporters = ['default'];

  // Configure jest-junit reporter for CI/CD XML output if running in CI environment
  if (isCIEnvironment) {
    reporters.push([
      'jest-junit',
      {
        outputDirectory: options.outputDirectory,
        outputName: 'junit-test.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: false,
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        includeConsoleOutput: true,
        includeShortConsoleOutput: false
      }
    ]);

    // Add GitHub Actions reporter if running in GitHub Actions
    if (process.env.GITHUB_ACTIONS === 'true') {
      reporters.push('github-actions');
    }
  }

  // Configure custom reporter configurations for test execution metrics and performance tracking
  if (options.enablePerformanceMetrics) {
    reporters.push([
      'jest-performance-reporter',
      {
        outputDirectory: options.outputDirectory,
        includeSlowTests: true,
        slowTestThreshold: TESTING_CONSTANTS.PERFORMANCE_TARGETS.UNIT_TEST_TIMEOUT
      }
    ]);
  }

  // Set up educational reporting features for tutorial demonstration and learning feedback
  if (options.enableEducational) {
    reporters.push([
      'jest-summary-reporter',
      {
        threshold: 80,
        failuresOnly: false,
        showPassedTests: true,
        includeCoverage: true
      }
    ]);
  }

  // Configure security test reporting for vulnerability detection and validation results
  if (options.enableSecurityReporting) {
    reporters.push([
      'jest-security-reporter',
      {
        outputDirectory: options.outputDirectory,
        includeVulnerabilities: true,
        securityThreshold: 'medium'
      }
    ]);
  }

  // Return array of reporter configurations for comprehensive test output and integration
  return {
    reporters,
    notify: !isCIEnvironment,
    notifyMode: 'failure-change'
  };
}

/**
 * Validates Jest configuration for test directory execution including dependency availability,
 * environment readiness, setup file accessibility, and comprehensive testing infrastructure
 * validation.
 * 
 * @param {Object} config - Jest configuration object to validate
 * @returns {Object} Validation result with status, warnings, errors, and configuration readiness assessment
 */
export function validateTestConfiguration(config) {
  const validation = {
    status: 'valid',
    warnings: [],
    errors: [],
    ready: true,
    details: {
      dependencies: { valid: true, issues: [] },
      environment: { valid: true, issues: [] },
      files: { valid: true, issues: [] },
      configuration: { valid: true, issues: [] }
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Validate Node.js version compatibility with Jest requirements and ES Modules support
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion < 18) {
      validation.errors.push(`Node.js version ${nodeVersion} is not supported. Minimum required: v18.0.0`);
      validation.details.environment.valid = false;
      validation.details.environment.issues.push('Node.js version too old');
    }

    // Check Jest framework installation and version compatibility for test directory execution
    try {
      const jestVersion = require('jest/package.json').version;
      if (!jestVersion) {
        validation.errors.push('Jest framework is not properly installed');
        validation.details.dependencies.valid = false;
        validation.details.dependencies.issues.push('Jest not found');
      }
    } catch (error) {
      validation.warnings.push('Unable to verify Jest installation');
      validation.details.dependencies.issues.push('Jest verification failed');
    }

    // Validate setup and teardown file accessibility and executable permissions
    const setupFiles = [
      config.globalSetup,
      config.globalTeardown,
      ...(config.setupFilesAfterEnv || [])
    ].filter(Boolean);

    setupFiles.forEach(filePath => {
      try {
        if (filePath && !require('fs').existsSync(filePath)) {
          validation.warnings.push(`Setup file not found: ${filePath}`);
          validation.details.files.issues.push(`Missing: ${filePath}`);
        }
      } catch (error) {
        validation.warnings.push(`Unable to verify setup file: ${filePath}`);
        validation.details.files.issues.push(`Verification failed: ${filePath}`);
      }
    });

    // Check test helper availability and initialization capability for comprehensive testing
    try {
      const testHelpersPath = path.join(__dirname, 'helpers/test-helpers.js');
      if (!require('fs').existsSync(testHelpersPath)) {
        validation.warnings.push('Test helpers file not found - will use fallback helpers');
        validation.details.files.issues.push('Test helpers missing');
      }
    } catch (error) {
      validation.warnings.push('Unable to verify test helpers availability');
      validation.details.files.issues.push('Test helpers verification failed');
    }

    // Validate coverage tool availability and configuration correctness for quality gates
    if (config.collectCoverage) {
      if (!config.collectCoverageFrom || config.collectCoverageFrom.length === 0) {
        validation.warnings.push('Coverage enabled but no collection patterns specified');
        validation.details.configuration.issues.push('Coverage patterns missing');
      }

      if (!config.coverageDirectory) {
        validation.warnings.push('Coverage enabled but no output directory specified');
        validation.details.configuration.issues.push('Coverage directory missing');
      }
    }

    // Check test discovery pattern validity and file accessibility for test execution
    if (!config.testMatch || config.testMatch.length === 0) {
      validation.errors.push('No test discovery patterns specified');
      validation.details.configuration.valid = false;
      validation.details.configuration.issues.push('Test patterns missing');
    }

    // Validate environment variable configuration and test environment readiness
    if (config.testEnvironment !== 'node') {
      validation.warnings.push(`Test environment is ${config.testEnvironment}, expected 'node' for backend testing`);
      validation.details.environment.issues.push('Non-node test environment');
    }

    // Check cross-platform testing dependencies and Flask compatibility requirements
    if (config.globals && config.globals.__ENABLE_CROSS_PLATFORM__) {
      validation.warnings.push('Cross-platform testing enabled - ensure Flask implementation is available');
      validation.details.configuration.issues.push('Cross-platform dependency check needed');
    }

    // Validate performance testing utilities and benchmarking tool availability
    if (config.globals && config.globals.__ENABLE_PERFORMANCE_TESTING__) {
      validation.warnings.push('Performance testing enabled - ensure benchmarking utilities are configured');
      validation.details.configuration.issues.push('Performance tools check needed');
    }

    // Determine overall validation status based on errors and warnings
    if (validation.errors.length > 0) {
      validation.status = 'invalid';
      validation.ready = false;
    } else if (validation.warnings.length > 0) {
      validation.status = 'valid_with_warnings';
      validation.ready = true;
    }

    // Update validation details
    validation.details.dependencies.valid = validation.details.dependencies.issues.length === 0;
    validation.details.environment.valid = validation.details.environment.issues.length === 0;
    validation.details.files.valid = validation.details.files.issues.length === 0;
    validation.details.configuration.valid = validation.details.configuration.issues.length === 0;

  } catch (error) {
    validation.status = 'validation_failed';
    validation.ready = false;
    validation.errors.push(`Configuration validation failed: ${error.message}`);
  }

  // Generate comprehensive validation report with warnings, errors, and recommendations
  return validation;
}

/**
 * Calculates optimal Jest worker count based on system resources and environment
 * @private
 * @param {Object} options - Worker calculation options
 * @returns {string} Optimal worker count configuration
 */
function calculateOptimalWorkerCount(options = {}) {
  const availableCores = os.cpus().length;
  const { environment, isCI, testDirectoryMode } = options;

  let workerRatio = 0.5; // Default 50% for test directory

  if (isCI) {
    workerRatio = 0.75; // Use 75% in CI for faster execution
  } else if (testDirectoryMode) {
    workerRatio = 0.6; // Use 60% for test directory isolation
  }

  const calculatedWorkers = Math.max(1, Math.floor(availableCores * workerRatio));
  const maxWorkers = Math.min(calculatedWorkers, 8); // Cap at 8 for stability

  return isCI ? `${Math.floor(workerRatio * 100)}%` : maxWorkers.toString();
}

// Create test directory specific Jest configuration with comprehensive optimizations
const testDirectoryConfig = createTestJestConfig({
  environment: process.env.NODE_ENV || 'test',
  enableCoverage: true,
  enablePerformance: true,
  enableSecurity: true,
  enableCrossPlatform: true,
  customPaths: {
    testPatterns: [],
    coverageExclusions: [],
    globals: {}
  }
});

// Export test directory configuration object with paths, patterns, and settings
export { testDirectoryConfig };

// Export default Jest configuration with comprehensive test directory support
export default testDirectoryConfig;

// Export named configuration for selective imports
export const testJestConfig = testDirectoryConfig;

/**
 * Educational Summary - Test Directory Jest Configuration:
 * 
 * This configuration demonstrates advanced Jest setup patterns including:
 * - Configuration inheritance and extension from base Jest configuration
 * - Test directory isolation with optimized performance settings
 * - Comprehensive test discovery for multiple test types (unit, integration, e2e, performance, security)
 * - Dynamic worker count optimization based on system resources and environment
 * - Cross-platform testing support for Node.js and Flask compatibility validation
 * - Security testing integration with Helmet.js and vulnerability detection
 * - PM2 cluster mode testing for production deployment scenarios
 * - Educational demonstration patterns with comprehensive coverage and reporting
 * 
 * Key Learning Outcomes:
 * - Understanding Jest configuration inheritance and merging strategies
 * - Implementing test directory specific optimizations and isolation
 * - Configuring comprehensive test discovery patterns for organized test suites
 * - Setting up performance optimization with resource-aware worker management
 * - Managing test lifecycle with directory-specific setup, teardown, and helpers
 * - Implementing cross-platform testing configuration for compatibility validation
 * - Configuring security testing integration with middleware validation
 * - Setting up production deployment testing with PM2 cluster mode support
 * 
 * Production Readiness Features:
 * - Environment-aware configuration with CI/CD optimization
 * - Resource-efficient parallel execution with dynamic worker scaling
 * - Comprehensive code coverage with quality gates and thresholds
 * - Cross-platform compatibility validation for deployment consistency
 * - Security testing integration with vulnerability detection and reporting
 * - Performance testing configuration with benchmarking and metrics collection
 * - Educational demonstration patterns for tutorial and learning purposes
 * - Production deployment testing with PM2 cluster mode validation
 */