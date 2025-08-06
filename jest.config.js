module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/src/test/js/**/*.test.js',
    '**/src/test/js/**/*.spec.js'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    'src/main/js/**/*.js',
    '!src/main/js/node_modules/**',
    '!**/coverage/**',
    '!**/test/**'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'html',
    'json',
    'text-summary',
    'lcov'
  ],
  
  // Coverage thresholds (adjusted for initial baseline)
  coverageThreshold: {
    global: {
      lines: 80,      // Minimum 80% line coverage (baseline)
      branches: 80,   // Minimum 80% branch coverage  
      functions: 70,  // Minimum 70% function coverage (baseline)
      statements: 80  // Minimum 80% statement coverage (baseline)
    }
  },
  
  // Test execution settings
  maxWorkers: '50%',
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform settings (none needed for pure JavaScript)
  transform: {},
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true
};