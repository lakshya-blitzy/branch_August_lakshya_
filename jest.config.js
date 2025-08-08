/**
 * Jest Configuration for Testinium-QA Node.js Server Component
 * 
 * This configuration enables comprehensive unit testing for the Express.js HTTP server
 * with zero-configuration setup, complete code coverage reporting, and integration
 * with Supertest for HTTP assertion testing. The configuration is optimized for
 * server-side testing within the dual-language architecture (Java + Node.js).
 * 
 * Key Features:
 * - Node.js test environment for server-side testing without DOM
 * - 100% code coverage thresholds for lines, branches, functions, and statements
 * - Multiple coverage report formats for stakeholder and CI/CD integration
 * - Comprehensive test file discovery patterns
 * - Async operation support with extended timeout settings
 * - Detailed test execution feedback with verbose output
 * 
 * Framework Selection: Jest over Mocha for zero-configuration setup, built-in
 * assertion library, superior debugging experience, and snapshot testing capabilities.
 */

module.exports = {
  // =============================================================================
  // TEST ENVIRONMENT CONFIGURATION
  // =============================================================================
  
  /**
   * Test Environment: Node.js
   * 
   * Configures Jest to run tests in Node.js environment rather than jsdom,
   * which is essential for server-side testing without browser DOM APIs.
   * This enables testing of Express.js endpoints, middleware, and server logic.
   */
  testEnvironment: 'node',

  // =============================================================================
  // TEST FILE DISCOVERY PATTERNS
  // =============================================================================

  /**
   * Test Match Patterns
   * 
   * Defines comprehensive patterns for Jest to discover test files, supporting
   * both .test.js and .spec.js conventions within the test/ directory structure.
   * This ensures all Jest unit tests and Supertest integration tests are executed.
   */
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.spec.js',
    '<rootDir>/test/**/__tests__/**/*.js'
  ],

  // =============================================================================
  // CODE COVERAGE CONFIGURATION
  // =============================================================================

  /**
   * Coverage Collection Configuration
   * 
   * Specifies which files to include in code coverage analysis, focusing on
   * the server.js main entry point and all source files in the src/ directory.
   * This ensures comprehensive coverage tracking for all server components.
   */
  collectCoverageFrom: [
    'server.js',
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],

  /**
   * Coverage Directory Configuration
   * 
   * Defines the output directory for coverage reports, aligning with Jenkins
   * artifact collection requirements and enabling easy access to coverage data.
   */
  coverageDirectory: 'coverage',

  /**
   * Coverage Reporters Configuration
   * 
   * Configures multiple report formats to support different stakeholder needs:
   * - 'text': Command-line friendly reports for CI/CD pipeline integration
   * - 'lcov': Machine-readable format for external tools and IDE integration
   * - 'html': Stakeholder-friendly web-based reports with detailed analysis
   * - 'json': Structured data format for programmatic access and aggregation
   */
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],

  /**
   * Coverage Thresholds Configuration
   * 
   * Enforces strict 100% code coverage requirements as specified in Section 0
   * requirements. These thresholds ensure comprehensive test coverage across
   * all dimensions and serve as CI/CD quality gates for deployment approval.
   */
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    './server.js': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    },
    './src/**/*.js': {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100
    }
  },

  // =============================================================================
  // TEST EXECUTION CONFIGURATION
  // =============================================================================

  /**
   * Test Timeout Configuration
   * 
   * Sets extended timeout for async operations including HTTP server startup,
   * request processing, and graceful shutdown procedures. This accommodates
   * Supertest integration testing and ensures reliable test execution.
   */
  testTimeout: 10000,

  /**
   * Verbose Output Configuration
   * 
   * Enables detailed test execution feedback including individual test results,
   * execution timing, and comprehensive error reporting for debugging and
   * monitoring purposes.
   */
  verbose: true,

  // =============================================================================
  // MODULE RESOLUTION CONFIGURATION
  // =============================================================================

  /**
   * Module Paths Configuration
   * 
   * Configures module resolution to support clean import statements and
   * consistent path handling across different test scenarios and environments.
   */
  modulePaths: [
    '<rootDir>',
    '<rootDir>/src',
    '<rootDir>/test'
  ],

  /**
   * Module File Extensions
   * 
   * Defines supported file extensions for module resolution, ensuring
   * compatibility with modern JavaScript and JSON configuration files.
   */
  moduleFileExtensions: [
    'js',
    'json',
    'mjs'
  ],

  // =============================================================================
  // TEST SETUP AND TEARDOWN CONFIGURATION
  // =============================================================================

  /**
   * Setup Files After Environment
   * 
   * Configures optional setup files for test environment initialization.
   * These files run after the test environment is set up but before tests execute,
   * enabling global test configuration and environment preparation.
   */
  setupFilesAfterEnv: [
    // Uncomment if setup file is created
    // '<rootDir>/test/setup.js'
  ],

  /**
   * Global Setup and Teardown
   * 
   * Configures optional global setup and teardown procedures for test suite
   * execution, enabling comprehensive test environment management including
   * server lifecycle and resource cleanup.
   */
  // globalSetup: '<rootDir>/test/globalSetup.js',
  // globalTeardown: '<rootDir>/test/globalTeardown.js',

  // =============================================================================
  // PERFORMANCE OPTIMIZATION CONFIGURATION
  // =============================================================================

  /**
   * Clear Mocks Configuration
   * 
   * Automatically clears mock data between tests to prevent test pollution
   * and ensure test isolation for reliable parallel execution.
   */
  clearMocks: true,

  /**
   * Reset Mocks Configuration
   * 
   * Resets mock implementation between tests for complete test isolation
   * and consistent testing behavior across the test suite.
   */
  resetMocks: true,

  /**
   * Restore Mocks Configuration
   * 
   * Restores original implementations after each test to prevent mock
   * leakage and maintain test independence.
   */
  restoreMocks: true,

  // =============================================================================
  // ERROR HANDLING AND DEBUGGING CONFIGURATION
  // =============================================================================

  /**
   * Error on Deprecated Configuration
   * 
   * Treats deprecated Jest API usage as errors to ensure forward compatibility
   * and maintain code quality standards.
   */
  errorOnDeprecated: true,

  /**
   * Detect Open Handles Configuration
   * 
   * Detects handles that prevent Jest from exiting cleanly, essential for
   * server testing to identify unclosed connections, timers, or processes.
   */
  detectOpenHandles: true,

  /**
   * Force Exit Configuration
   * 
   * Disabled to ensure proper cleanup of resources including server connections,
   * file handles, and async operations before test suite completion.
   */
  forceExit: false,

  // =============================================================================
  // IGNORE PATTERNS CONFIGURATION
  // =============================================================================

  /**
   * Test Path Ignore Patterns
   * 
   * Defines patterns for directories and files that Jest should ignore during
   * test discovery, preventing execution of non-test files and build artifacts.
   */
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/',
    '<rootDir>/dist/'
  ],

  /**
   * Coverage Path Ignore Patterns
   * 
   * Excludes specific directories from coverage collection to focus analysis
   * on production code and prevent inflation of coverage metrics with test files.
   */
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test/',
    '/.git/',
    '/dist/'
  ],

  // =============================================================================
  // WATCH MODE CONFIGURATION
  // =============================================================================

  /**
   * Watch Path Ignore Patterns
   * 
   * Configures file watching to ignore build artifacts and dependencies,
   * optimizing performance during development with test watch mode.
   */
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/'
  ],

  /**
   * Watch Plugins Configuration
   * 
   * Enables enhanced watch mode functionality for improved development
   * experience with interactive test filtering and execution control.
   */
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // =============================================================================
  // TRANSFORM AND COMPILATION CONFIGURATION
  // =============================================================================

  /**
   * Transform Configuration
   * 
   * Configures file transformation for different file types, ensuring
   * proper handling of modern JavaScript features and module formats.
   */
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest'
  },

  /**
   * Transform Ignore Patterns
   * 
   * Specifies which node_modules should be transformed, essential for
   * handling ES modules in dependencies while optimizing build performance.
   */
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|express)/)'
  ]
};