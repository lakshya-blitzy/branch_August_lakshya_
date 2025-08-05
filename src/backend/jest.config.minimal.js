/**
 * Minimal Jest Configuration for Basic Testing
 * Bypasses complex imports to establish testing baseline
 */

export default {
  // Use Node.js environment
  testEnvironment: 'node',
  
  // ES Modules support
  preset: undefined,
  
  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  
  // Transform configuration for ES modules
  transform: {},
  
  // Module path mapping
  moduleNameMapper: {},
  
  // Skip setup files that might have import issues
  setupFilesAfterEnv: [],
  
  // Basic coverage if needed
  collectCoverage: false,
  
  // Timeout
  testTimeout: 10000,
  
  // Worker configuration
  maxWorkers: 1,
  
  // Verbose output
  verbose: true
};