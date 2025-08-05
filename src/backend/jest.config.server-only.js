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
    // Mock problematic configuration modules
    '^../config/security\\.js$': '<rootDir>/test/mocks/security-mock.js',
    '^../config/pm2\\.js$': '<rootDir>/test/mocks/pm2-mock.js',
    '^../security/(.*)$': '<rootDir>/test/mocks/security-mock.js',
    '^../utils/constants\\.js$': '<rootDir>/test/mocks/constants-mock.js'
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