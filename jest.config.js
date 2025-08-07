/**
 * Jest Configuration for Express.js Server Testing
 * 
 * Configures Jest testing framework for comprehensive testing of the
 * Node.js Express server including unit tests, integration tests, and
 * coverage collection as specified in the technical requirements.
 * 
 * Key Features:
 * - Node.js test environment for Express.js testing
 * - Comprehensive coverage collection from server.js
 * - Strict coverage thresholds (95% overall, 90% branches)
 * - Parallel test execution for performance
 * - Extended timeout for async operations
 */

module.exports = {
  // Configure test environment for Node.js runtime (required for Express.js testing)
  testEnvironment: 'node',

  // Define which files to collect coverage from
  // Target server.js specifically as the main Express application
  collectCoverageFrom: [
    'server.js'
  ],

  // Set comprehensive coverage thresholds as per technical specification
  // Section 6.6.6.3 requires 95% overall coverage with 90% branch coverage
  coverageThreshold: {
    global: {
      branches: 90,     // 90% minimum branch coverage
      functions: 95,    // 95% minimum function coverage  
      lines: 95,        // 95% minimum line coverage
      statements: 95    // 95% minimum statement coverage
    }
  },

  // Configure test file patterns to match Jest convention
  // Look for all *.test.js files in the test directory
  testMatch: [
    '**/test/**/*.test.js'
  ],

  // Enable parallel test execution for improved performance
  // Use 50% of available CPU cores as recommended in Section 6.6.6.3
  maxWorkers: '50%',

  // Set timeout for async operations including HTTP requests
  // 5000ms allows sufficient time for Express endpoint testing
  testTimeout: 5000,

  // Configure coverage reporting options
  coverageReporters: [
    'text',           // Console summary output
    'html',           // HTML reports for local development
    'lcov'            // LCOV format for CI/CD integration
  ],

  // Specify coverage output directory
  coverageDirectory: 'coverage',

  // Configure test setup and teardown
  // Clear mocks between tests to ensure test isolation
  clearMocks: true,

  // Collect coverage by default when running tests
  collectCoverage: false,

  // Display individual test results
  verbose: true,

  // Configure Jest to handle ES6 modules if needed
  transform: {},

  // Set up test environment before each test
  setupFilesAfterEnv: [],

  // Configure module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Define root directories for tests and modules
  roots: ['<rootDir>'],

  // Configure test result processors
  testResultsProcessor: undefined
};