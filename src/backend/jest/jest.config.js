/**
 * @fileoverview Comprehensive Jest Testing Framework Configuration
 * @description Production-ready Jest configuration supporting ES Modules, parallel test execution,
 * code coverage reporting, and cross-platform testing compatibility for the Node.js tutorial project.
 * Provides dynamic configuration based on environment, CPU cores, and testing requirements with
 * comprehensive educational value and modern development practices.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Native ES Modules support without Babel transformation
 * - Dynamic worker count optimization based on available CPU cores
 * - Comprehensive code coverage with enforced quality gates
 * - Global test lifecycle management with setup/teardown
 * - Environment-specific configuration overrides
 * - Cross-platform testing support for Node.js and Flask implementations
 * - Performance-optimized parallel execution
 * - CI/CD integration with multiple output formats
 * 
 * Educational Value:
 * - Demonstrates modern Jest configuration patterns for 2025
 * - Showcases ES Modules testing without transformation overhead
 * - Illustrates performance optimization through parallel execution
 * - Teaches comprehensive code coverage implementation
 * - Shows environment-aware testing configuration
 * - Demonstrates production-ready testing practices
 * 
 * Technology Stack:
 * - Jest latest with Node.js 18+ requirement
 * - ES Modules with extensionsToTreatAsEsm configuration
 * - Node.js v22.x LTS with built-in module support
 * - SuperTest for HTTP endpoint testing
 * - C8/Istanbul for comprehensive coverage reporting
 */

// Node.js built-in modules for system interaction and path resolution
import path from 'node:path'; // v18+ - Node.js built-in path utilities for cross-platform file path handling
import os from 'node:os'; // v18+ - Node.js built-in OS utilities for CPU core detection and system information

// Internal imports for testing constants and environment configuration
import { 
  TESTING_CONSTANTS,
  ENV_CONSTANTS 
} from '../utils/constants.js';

// Global configuration constants for Jest setup
const DEFAULT_TEST_ENVIRONMENT = 'node'; // Node.js test environment for backend testing without browser dependencies
const MAX_WORKERS_RATIO = 0.5; // Use 50% of available CPU cores for optimal performance balance
const COVERAGE_DIRECTORY = '../coverage/jest'; // Coverage output directory relative to Jest configuration location
const IS_CI_ENVIRONMENT = process.env.CI === 'true'; // Detect CI environment for configuration optimization

/**
 * Calculates the optimal number of Jest worker processes based on available CPU cores,
 * environment type, and system resources to maximize test execution performance while
 * maintaining system stability and resource availability for other processes.
 * 
 * @returns {string} Worker count configuration string for Jest maxWorkers setting
 * @educational_value Demonstrates system resource optimization and environment-aware configuration
 */
export function getOptimalWorkerCount() {
  // Get available CPU core count using Node.js built-in os module
  const availableCores = os.cpus().length;
  
  // Apply different worker ratios based on environment type for optimal resource utilization
  let workerRatio = MAX_WORKERS_RATIO; // Default 50% for development
  
  if (IS_CI_ENVIRONMENT) {
    workerRatio = 0.75; // Use 75% of cores in CI for faster build times
  } else if (process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    workerRatio = 0.6; // Use 60% in production to leave resources for other processes
  }
  
  // Calculate worker count with minimum of 1 and maximum based on available cores
  const calculatedWorkers = Math.max(1, Math.floor(availableCores * workerRatio));
  
  // Ensure we don't exceed system resources and maintain performance
  const maxRecommendedWorkers = Math.min(calculatedWorkers, 8); // Cap at 8 workers for stability
  
  // Return as percentage string for Jest compatibility or specific number
  if (IS_CI_ENVIRONMENT) {
    return `${Math.floor(workerRatio * 100)}%`; // Percentage for CI environments
  }
  
  return maxRecommendedWorkers.toString(); // Specific number for development
}

/**
 * Configures comprehensive code coverage settings including collection patterns,
 * output formats, thresholds, and quality gates for both local development and
 * CI/CD environments with enforced quality standards.
 * 
 * @param {Object} coverageOptions - Coverage configuration options
 * @returns {Object} Coverage configuration object with collection patterns, reporters, and thresholds
 * @educational_value Teaches code coverage best practices and quality gate implementation
 */
export function setupCoverageConfiguration(coverageOptions = {}) {
  // Extract coverage thresholds from testing constants for consistency
  const { GLOBAL, CRITICAL_FILES } = TESTING_CONSTANTS.COVERAGE_THRESHOLDS;
  
  return {
    // Enable coverage collection for comprehensive testing analysis
    collectCoverage: true,
    
    // Define comprehensive file patterns for coverage collection
    collectCoverageFrom: [
      'src/**/*.js', // Include all source JavaScript files
      '!src/**/*.test.js', // Exclude test files from coverage
      '!src/**/*.spec.js', // Exclude spec files from coverage
      '!src/test/**', // Exclude test directory
      '!src/jest/**', // Exclude Jest configuration directory
      '!src/**/*.config.js', // Exclude configuration files
      '!**/node_modules/**', // Exclude dependencies
      '!**/coverage/**', // Exclude coverage output
      '!**/dist/**', // Exclude build output
      '!**/build/**', // Exclude build artifacts
      '!**/bin/**', // Exclude executable scripts
      ...( coverageOptions.additionalPatterns || []) // Allow additional patterns
    ],
    
    // Set coverage output directory relative to configuration location
    coverageDirectory: COVERAGE_DIRECTORY,
    
    // Configure multiple coverage reporters for different use cases
    coverageReporters: [
      'text', // Console output for immediate feedback
      'html', // HTML report for detailed analysis
      'json', // JSON format for programmatic processing
      'lcov', // LCOV format for CI/CD integration
      'text-summary', // Brief summary for quick overview
      ...(IS_CI_ENVIRONMENT ? ['cobertura'] : []) // XML format for CI systems
    ],
    
    // Set comprehensive coverage thresholds for quality gates
    coverageThreshold: {
      // Global coverage requirements for entire codebase
      global: {
        branches: GLOBAL.branches, // 85% branch coverage
        functions: GLOBAL.functions, // 95% function coverage
        lines: GLOBAL.lines, // 90% line coverage
        statements: GLOBAL.statements // 90% statement coverage
      },
      
      // Specific thresholds for critical application files
      './src/backend/server.js': {
        branches: CRITICAL_FILES.branches, // 95% branch coverage for main server
        functions: CRITICAL_FILES.functions, // 100% function coverage for server
        lines: CRITICAL_FILES.lines, // 95% line coverage for server
        statements: CRITICAL_FILES.statements // 95% statement coverage for server
      },
      
      // Enhanced thresholds for utility modules
      './src/backend/utils/': {
        branches: 90,
        functions: 95,
        lines: 90,
        statements: 90
      }
    },
    
    // Coverage path ignore patterns for files that shouldn't be measured
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/coverage/',
      '/test/',
      '/jest/',
      '\\.config\\.(js|ts)$',
      '\\.test\\.(js|ts)$',
      '\\.spec\\.(js|ts)$'
    ]
  };
}

/**
 * Sets up Jest configuration for native ES Modules support including file extensions,
 * transform settings, and module resolution for modern JavaScript development patterns
 * without Babel transformation overhead for optimal performance.
 * 
 * @returns {Object} ES Modules configuration object for Jest transform and extension handling
 * @educational_value Demonstrates modern JavaScript module system configuration
 */
export function configureESModulesSupport() {
  return {
    // Configure file extensions to treat as ES Modules
    extensionsToTreatAsEsm: ['.js'], // Treat .js files as ES Modules
    
    // Disable transformation for native ES Modules support
    transform: {}, // Empty transform object for no Babel transformation
    
    // Configure module file extensions Jest should recognize
    moduleFileExtensions: [
      'js', // JavaScript files
      'json', // JSON configuration files
      'mjs' // ES Module files with .mjs extension
    ],
    
    // Configure experimental VM modules for enhanced ES Modules support
    extensionsToTreatAsEsm: ['.js'],
    
    // Set up module name mapper for absolute import resolution
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1', // Root-relative imports
      '^@backend/(.*)$': '<rootDir>/$1', // Backend-specific imports
      '^@config/(.*)$': '<rootDir>/config/$1', // Configuration imports
      '^@utils/(.*)$': '<rootDir>/utils/$1', // Utility imports
      '^@test/(.*)$': '<rootDir>/test/$1' // Test utility imports
    },
    
    // Configure import resolution for Node.js built-in modules
    transformIgnorePatterns: [
      'node_modules/(?!(.*\\.mjs$))', // Don't transform node_modules except .mjs files
    ]
  };
}

/**
 * Configures file paths for Jest global setup, teardown, and per-test setup files
 * using path resolution for cross-platform compatibility and proper test lifecycle
 * management with comprehensive test environment initialization.
 * 
 * @returns {Object} Test environment path configuration with setup and teardown file locations
 * @educational_value Teaches test lifecycle management and environment configuration
 */
export function setupTestEnvironmentPaths() {
  // Resolve setup file paths using Node.js path module for cross-platform compatibility
  const setupPaths = {
    // Global setup executed once before all tests
    globalSetup: path.resolve(process.cwd(), 'src/backend/jest/global-setup.js'),
    
    // Global teardown executed once after all tests
    globalTeardown: path.resolve(process.cwd(), 'src/backend/jest/global-teardown.js'),
    
    // Setup files executed after Jest environment is set up for each test file
    setupFilesAfterEnv: [
      path.resolve(process.cwd(), 'src/backend/jest/setup.js')
    ]
  };
  
  return setupPaths;
}

/**
 * Sets up test file discovery patterns for unit tests, integration tests, and
 * end-to-end tests with proper exclusion patterns and file organization support
 * for comprehensive test suite execution.
 * 
 * @param {Object} testPatterns - Test pattern configuration options
 * @returns {Object} Test matching configuration with patterns and exclusions
 * @educational_value Demonstrates test organization and discovery patterns
 */
export function configureTestMatching(testPatterns = {}) {
  return {
    // Configure comprehensive test file discovery patterns
    testMatch: [
      '**/test/**/*.test.js', // Test directory files
      '**/test/unit/**/*.test.js', // Unit test files
      '**/test/integration/**/*.test.js', // Integration test files
      '**/test/e2e/**/*.test.js', // End-to-end test files
      '**/__tests__/**/*.js', // Jest convention test directory
      '**/?(*.)+(spec|test).js', // Flexible test file naming
      ...(testPatterns.additionalPatterns || []) // Allow additional patterns
    ],
    
    // Configure paths to ignore during test discovery
    testPathIgnorePatterns: [
      '/node_modules/', // Exclude dependencies
      '/coverage/', // Exclude coverage output
      '/dist/', // Exclude build output
      '/build/', // Exclude build artifacts
      '/docs/', // Exclude documentation
      '/logs/', // Exclude log files
      '\\.config\\.(js|ts)$' // Exclude configuration files
    ],
    
    // Configure watch mode path ignoring for efficient file monitoring
    watchPathIgnorePatterns: [
      '/node_modules/',
      '/coverage/',
      '/dist/',
      '/build/',
      '/logs/',
      '\\.log$'
    ]
  };
}

/**
 * Configures Jest reporters for test output formatting, CI/CD integration, and
 * development feedback including default console output and specialized CI reporters
 * for comprehensive test result reporting and analysis.
 * 
 * @param {boolean} isCIEnvironment - Whether running in CI/CD environment
 * @returns {Array} Array of Jest reporter configurations for different output formats
 * @educational_value Teaches test reporting and CI/CD integration patterns
 */
export function setupReportersAndOutput(isCIEnvironment = IS_CI_ENVIRONMENT) {
  const reporters = [
    'default' // Default Jest console reporter with detailed output
  ];
  
  // Add CI-specific reporters for automated environments
  if (isCIEnvironment) {
    reporters.push([
      'jest-junit', // JUnit XML reporter for CI/CD integration
      {
        outputDirectory: path.resolve(process.cwd(), 'coverage/jest'),
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]);
    
    // Add GitHub Actions reporter if running in GitHub Actions
    if (process.env.GITHUB_ACTIONS === 'true') {
      reporters.push([
        'github-actions', // GitHub Actions integration reporter
        {
          silent: false,
          reportLocation: 'summary'
        }
      ]);
    }
  }
  
  // Add custom reporter for development environment
  if (!isCIEnvironment && process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT) {
    reporters.push([
      'jest-summary-reporter', // Summary reporter for development
      {
        threshold: 80,
        failuresOnly: false
      }
    ]);
  }
  
  return reporters;
}

/**
 * Applies environment-specific configuration overrides for development, testing,
 * and CI environments to optimize Jest behavior for different execution contexts
 * and runtime requirements.
 * 
 * @param {Object} baseConfig - Base Jest configuration object
 * @param {string} environment - Current environment type
 * @returns {Object} Jest configuration with environment-specific overrides applied
 * @educational_value Demonstrates environment-aware configuration management
 */
export function applyEnvironmentOverrides(baseConfig, environment = process.env.NODE_ENV) {
  const config = { ...baseConfig };
  
  // Detect current environment with fallback to development
  const currentEnv = environment || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
  
  // Apply CI-specific overrides for automated testing environments
  if (IS_CI_ENVIRONMENT) {
    Object.assign(config, {
      // Disable watch mode in CI for single test run
      watchman: false,
      
      // Enable coverage collection in CI
      collectCoverage: true,
      
      // Stop on first test failure for faster CI feedback
      bail: 1,
      
      // Use optimal worker count for CI
      maxWorkers: getOptimalWorkerCount(),
      
      // Disable cache for fresh CI runs
      cache: false,
      
      // Force exit to prevent hanging CI builds
      forceExit: true,
      
      // Extended timeout for CI environment
      testTimeout: TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS
    });
  }
  
  // Apply development-specific overrides for local development
  if (currentEnv === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT) {
    Object.assign(config, {
      // Enable watch mode for development
      watch: !IS_CI_ENVIRONMENT,
      
      // Disable coverage by default in development for faster execution
      collectCoverage: false,
      
      // Don't bail on failures for development
      bail: false,
      
      // Enable verbose output for development debugging
      verbose: true,
      
      // Shorter timeout for development
      testTimeout: TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS
    });
  }
  
  // Apply testing environment overrides for test execution optimization
  if (currentEnv === ENV_CONSTANTS.ENVIRONMENT_TYPES.TESTING) {
    Object.assign(config, {
      // Optimize for test execution speed
      maxWorkers: Math.min(4, os.cpus().length),
      
      // Enable coverage for testing environment
      collectCoverage: true,
      
      // Use performance-optimized timeouts
      testTimeout: TESTING_CONSTANTS.PERFORMANCE_TARGETS.INTEGRATION_TEST_TIMEOUT
    });
  }
  
  return config;
}

/**
 * Creates and returns the comprehensive Jest configuration object with dynamic settings
 * based on environment, CPU cores, and testing requirements. Supports ES Modules,
 * parallel execution, coverage reporting, and cross-platform compatibility.
 * 
 * @param {Object} options - Configuration options for customization
 * @returns {Object} Complete Jest configuration object with all settings and integrations
 * @educational_value Demonstrates comprehensive testing framework configuration
 */
export function createJestConfig(options = {}) {
  // Get base configurations from helper functions
  const esModulesConfig = configureESModulesSupport();
  const coverageConfig = setupCoverageConfiguration(options.coverage);
  const testPaths = setupTestEnvironmentPaths();
  const testMatching = configureTestMatching(options.testPatterns);
  const reporters = setupReportersAndOutput();
  
  // Create comprehensive base configuration
  const baseConfig = {
    // Test environment configuration
    testEnvironment: DEFAULT_TEST_ENVIRONMENT,
    
    // Disable default Jest preset for custom configuration
    preset: null,
    
    // ES Modules support configuration
    ...esModulesConfig,
    
    // Test discovery and execution patterns
    ...testMatching,
    
    // Code coverage configuration
    ...coverageConfig,
    
    // Test lifecycle management
    ...testPaths,
    
    // Performance and execution settings
    testTimeout: TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS, // Default unit test timeout
    maxWorkers: getOptimalWorkerCount(), // Optimal worker count for parallel execution
    
    // Output and reporting configuration
    verbose: !IS_CI_ENVIRONMENT, // Verbose output except in CI
    bail: IS_CI_ENVIRONMENT ? 1 : false, // Bail on first failure in CI
    forceExit: IS_CI_ENVIRONMENT, // Force exit in CI to prevent hanging
    reporters, // Configured reporters for different environments
    
    // Development and debugging features
    detectHandles: true, // Detect handles that prevent Jest from exiting
    detectLeaks: true, // Detect memory leaks in tests
    detectOpenHandles: true, // Detect open handles that prevent clean exit
    
    // Mock and spy configuration
    clearMocks: true, // Clear mock calls between tests
    resetMocks: true, // Reset mock implementation between tests
    restoreMocks: true, // Restore original implementation after tests
    
    // Cache configuration for performance
    cache: !IS_CI_ENVIRONMENT, // Enable cache except in CI
    cacheDirectory: path.resolve(process.cwd(), 'node_modules/.cache/jest'),
    
    // Watch mode configuration for development
    watchPlugins: [
      'jest-watch-typeahead/filename', // Enhanced filename filtering
      'jest-watch-typeahead/testname' // Enhanced test name filtering
    ],
    
    // Error handling configuration
    errorOnDeprecated: true, // Throw errors on deprecated API usage
    
    // Notification configuration for development
    notify: !IS_CI_ENVIRONMENT, // Desktop notifications except in CI
    notifyMode: 'failure-change', // Notify on failure state changes
    
    // JSON output configuration for programmatic access
    json: IS_CI_ENVIRONMENT, // JSON output in CI for parsing
    
    // Custom options passed from configuration
    ...options.customConfig
  };
  
  // Apply environment-specific overrides
  const finalConfig = applyEnvironmentOverrides(baseConfig, options.environment);
  
  return finalConfig;
}

/**
 * Jest-specific constants for configuration and reference across test environments
 */
export const JEST_CONSTANTS = Object.freeze({
  // Default timeout values for different test types
  DEFAULT_TIMEOUT: TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS,
  
  // Coverage directory for output consistency
  COVERAGE_DIRECTORY,
  
  // Worker ratio for performance optimization
  WORKER_RATIO: MAX_WORKERS_RATIO,
  
  // ES Modules configuration object
  ES_MODULES_CONFIG: {
    extensionsToTreatAsEsm: ['.js'],
    transform: {},
    moduleFileExtensions: ['js', 'json', 'mjs']
  }
});

// Create and export the default Jest configuration
const jestConfig = createJestConfig({
  // Environment-specific configuration
  environment: process.env.NODE_ENV,
  
  // Custom coverage options
  coverage: {
    additionalPatterns: []
  },
  
  // Custom test patterns
  testPatterns: {
    additionalPatterns: []
  },
  
  // Additional custom configuration
  customConfig: {
    // Add any additional Jest configuration here
    displayName: {
      name: 'Node.js Tutorial Backend Tests',
      color: 'blue'
    },
    
    // Root directory for Jest execution
    rootDir: path.resolve(process.cwd()),
    
    // Test results processor for additional analysis
    testResultsProcessor: IS_CI_ENVIRONMENT ? 'jest-junit' : undefined
  }
});

// Export the complete Jest configuration as default
export default jestConfig;

/**
 * Educational Summary:
 * 
 * This Jest configuration demonstrates modern testing framework setup with:
 * - Native ES Modules support without Babel transformation overhead
 * - Dynamic worker count optimization based on system resources
 * - Comprehensive code coverage with enforced quality gates
 * - Environment-aware configuration for development, testing, and CI
 * - Cross-platform compatibility with Flask migration testing
 * - Performance optimization through parallel execution
 * - Production-ready error handling and resource management
 * 
 * Key Learning Points:
 * - ES Modules configuration for modern JavaScript testing
 * - System resource optimization for test execution performance
 * - Comprehensive coverage requirements and quality gates
 * - Environment-specific testing configuration patterns
 * - CI/CD integration with multiple output formats
 * - Test lifecycle management with global setup and teardown
 * - Modern Jest features for debugging and development
 * 
 * Production Features:
 * - Zero-downtime configuration updates through dynamic settings
 * - Resource-aware worker count calculation for optimal performance
 * - Comprehensive error detection and handling capabilities
 * - Memory leak detection and resource cleanup validation
 * - Cross-platform path resolution for deployment consistency
 * - Security-conscious configuration with proper isolation
 */