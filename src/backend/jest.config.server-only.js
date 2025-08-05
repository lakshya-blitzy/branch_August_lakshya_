/**
 * Jest Configuration for Server.js Testing Only
 * Bypasses complex configuration modules to focus on core server functionality
 */

export default {
  // Use Node.js environment
  testEnvironment: 'node',
  
  // Test file patterns - only server tests
  testMatch: [
    '**/test/unit/server.test.js'
  ],
  
  // Module mocking to bypass configuration issues
  moduleNameMapper: {
    // Mock the entire config system
    '^../config/index\\.js$': '<rootDir>/test/mocks/config-index-mock.js',
    '^../../config/index\\.js$': '<rootDir>/test/mocks/config-index-mock.js',
    // Mock individual config modules if directly imported
    '^../config/pm2\\.js$': '<rootDir>/test/mocks/pm2-mock.js',
    '^\\.\/pm2\\.js$': '<rootDir>/test/mocks/pm2-mock.js',
    '^../config/database\\.js$': '<rootDir>/test/mocks/database-mock.js',
    '^\\.\/database\\.js$': '<rootDir>/test/mocks/database-mock.js',
    '^../utils/constants\\.js$': '<rootDir>/test/mocks/constants-mock.js',
    '^../../utils/constants\\.js$': '<rootDir>/test/mocks/constants-mock.js'
  },
  
  // Skip setup files that might have import issues
  setupFilesAfterEnv: [],
  
  // Basic coverage if needed
  collectCoverage: false,
  
  // Timeout
  testTimeout: 10000,
  
  // Worker configuration
  maxWorkers: 1,
  
  // Verbose output
  verbose: true,
  
  // Transform configuration for ES modules
  transform: {},
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests  
  resetModules: true
};