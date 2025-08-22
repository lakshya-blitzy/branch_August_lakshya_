/**
 * Jest Configuration for Testinium-QA JavaScript Testing Framework
 * 
 * This configuration file defines the Jest testing environment for the Node.js components
 * of the Testinium-QA framework, specifically for testing server.js HTTP server functionality.
 * 
 * Configuration aligns with:
 * - Section 0.4.2: Jest configuration for Node.js environment
 * - Section 0.5.1: Coverage thresholds (90%+ lines, 85% branches, 95% functions)
 * - Section 0.5.2: Test execution timing (individual tests <50ms, suite <5s)
 * - Section 3.2.1.3: Jest 29.7.0 framework integration
 * - Section 8.6.4: CI/CD pipeline artifact generation requirements
 */

module.exports = {
  // Test Environment Configuration
  // Uses Node.js environment for server-side testing of HTTP components
  testEnvironment: 'node',

  // Test Discovery Patterns
  // Matches all test files in test directory following *.test.js convention
  testMatch: [
    '**/test/**/*.test.js',
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],

  // Root Directory Configuration
  // Sets the root directory for Jest to find tests and source files
  rootDir: './',

  // Test Paths to Include
  // Defines specific directories to search for test files
  roots: [
    '<rootDir>/test'
  ],

  // Test File Extensions
  // Configures Jest to recognize these file extensions as test files
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],

  // Test Timeout Configuration
  // Sets maximum execution time for individual tests per Section 0.5.2
  testTimeout: 5000,

  // Coverage Collection Configuration
  // Defines which files to include in coverage analysis
  collectCoverageFrom: [
    'server.js',
    'src/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!**/*.config.js'
  ],

  // Coverage Directory Output
  // Specifies where coverage reports are generated
  coverageDirectory: 'coverage',

  // Coverage Reporters Configuration
  // Multiple format support for CI/CD integration per Section 8.6.4.2
  coverageReporters: [
    'text',           // Console output for developer feedback
    'text-summary',   // Brief console summary
    'html',          // HTML report for browser viewing
    'lcov',          // LCOV format for CI/CD integration
    'cobertura',     // Cobertura XML for Jenkins integration
    'json'           // JSON format for programmatic access
  ],

  // Coverage Thresholds Configuration
  // Enforces coverage requirements per Section 0.5.1
  coverageThreshold: {
    global: {
      branches: 85,     // 85%+ branch coverage per Section 0.5.1
      functions: 95,    // 95%+ function coverage per Section 0.5.1
      lines: 90,        // 90%+ line coverage per Section 0.5.1
      statements: 90    // 90%+ statement coverage per Section 0.5.1
    },
    // Specific thresholds for critical server component
    './server.js': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // Test Setup Configuration
  // Files to run before executing tests (disabled until setup file is created)
  // setupFilesAfterEnv: [
  //   '<rootDir>/test/setup/test-setup.js'
  // ],

  // Clear Mocks Configuration
  // Automatically clear mock calls and instances between tests
  clearMocks: true,

  // Reset Mocks Configuration
  // Reset mock state between tests for test isolation
  resetMocks: true,

  // Restore Mocks Configuration
  // Restore original implementations after tests
  restoreMocks: true,

  // Verbose Output Configuration
  // Enables detailed test execution reporting
  verbose: true,

  // Test Results Processor
  // Default reporter only (jest-junit not installed)
  reporters: [
    'default'
  ],

  // Error Handling Configuration
  // Stop test execution on first failure in CI environments
  bail: process.env.CI ? 1 : 0,

  // Cache Configuration
  // Enables Jest caching for improved performance in CI/CD
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Dependency Management
  // Maps module names to file paths for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1'
  },

  // Transform Configuration
  // Default Node.js transformation (babel-jest not needed for basic JS)
  // transform: {
  //   '^.+\\.js$': 'babel-jest'
  // },

  // Transform Ignore Patterns
  // Node modules to transform (default: ignore all)
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ],

  // Module Directory Configuration
  // Specifies directories to search for modules
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/test'
  ],

  // Test Match Ignore Patterns
  // Excludes specific files or patterns from test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/target/',
    '\\.config\\.js$'
  ],

  // Watch Mode Configuration
  // Configuration for Jest watch mode during development
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/target/',
    '\\.git/'
  ],

  // Force Exit Configuration
  // Force Jest to exit after tests complete (useful in CI)
  forceExit: process.env.CI ? true : false,

  // Detect Open Handles
  // Helps identify handles keeping Jest process alive
  detectOpenHandles: true,

  // Max Workers Configuration
  // Optimizes parallel execution based on environment
  maxWorkers: process.env.CI ? 2 : '50%',

  // Test Name Pattern Matching
  // Allows running tests by name pattern for focused testing
  testNamePattern: undefined,

  // Globals Configuration
  // Global variables available in all test files
  globals: {
    'TEST_TIMEOUT': 5000,
    'COVERAGE_THRESHOLD': {
      lines: 90,
      branches: 85,
      functions: 95,
      statements: 90
    }
  },

  // Extension Configuration for Future Enhancement
  // Placeholder for Jest extensions and plugins
  setupFiles: [],

  // Project Configuration for Multi-Project Support
  // Currently single project, but prepared for expansion
  projects: undefined,

  // Error Handling Preferences
  // Configures how Jest handles and reports errors
  errorOnDeprecated: true,
  
  // Silent Mode Configuration
  // Controls Jest output verbosity
  silent: false,

  // Test Environment Options
  // Additional options for Node.js test environment
  testEnvironmentOptions: {
    // Node.js specific options can be added here
  },

  // Watch Plugins Configuration
  // Default watch functionality (typeahead plugins not installed)
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ]
};