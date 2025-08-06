/**
 * Simple Jest Configuration for Node.js Tutorial Backend Testing
 * Configured for ES modules support with Node.js
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // ES Modules support - .js is inferred from package.json type: module
  transform: {},
  
  // Test file patterns - run all tests
  testMatch: [
    '**/test/**/*.test.js'
  ],
  
  // Coverage settings
  collectCoverage: false,
  
  // Module handling
  moduleFileExtensions: ['js', 'json'],
  
  // Timeout settings
  testTimeout: 30000,
  
  // Mock settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Inject Jest globals into the test environment
  injectGlobals: true,
  
  // Setup files after environment
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest-setup.js']
};