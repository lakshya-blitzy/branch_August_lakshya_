/**
 * Simple Jest Configuration for Node.js Tutorial Backend Testing
 * Configured for ES modules support with Node.js
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // ES Modules support - .js is inferred from package.json type: module
  transform: {},
  
  // Test file patterns - only run unit tests for server.test.js initially
  testMatch: [
    '**/test/unit/server.test.js'
  ],
  
  // Coverage settings
  collectCoverage: false,
  
  // Module handling
  moduleFileExtensions: ['js', 'json'],
  
  // Timeout settings
  testTimeout: 10000,
  
  // Mock settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};