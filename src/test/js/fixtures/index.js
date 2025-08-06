/**
 * Test Fixtures Index - Centralized Export Point for All Mock Data and Utilities
 * 
 * This module serves as the main entry point for all test fixtures, providing
 * centralized exports of all mock data and utilities. It re-exports all fixture
 * modules for convenient single-import access in test files, enabling clean and
 * organized test code with simplified import statements.
 * 
 * Features:
 * - Centralized fixture management with consistent access patterns
 * - Single import point for all mock data and test utilities
 * - Organized exports from all mock modules for comprehensive testing
 * - Thread-safe data generation for parallel test execution
 * - Complete test data coordination across different mock types
 * 
 * Usage:
 * ```javascript
 * // Import all fixtures from single entry point
 * const fixtures = require('./fixtures');
 * 
 * // Or import specific fixtures
 * const { mockRequests, mockResponses, TestDataGenerator } = require('./fixtures');
 * 
 * // Use in tests
 * const testData = fixtures.TestDataGenerator.generateScenario();
 * const request = fixtures.mockRequests.valid.get;
 * const response = fixtures.mockResponses.success.jsonApi;
 * ```
 * 
 * @module testFixturesIndex
 * @version 1.0.0
 * @author Blitzy Agent
 */

// Import all mock request fixtures with required members access
const mockRequestsModule = require('./mockRequests.js');
const mockRequests = {
    valid: mockRequestsModule.valid,
    invalid: mockRequestsModule.invalid,
    malformed: mockRequestsModule.malformed,
    oversized: mockRequestsModule.oversized,
    injection: mockRequestsModule.injection
};

// Import all mock response fixtures with required members access
const mockResponsesModule = require('./mockResponses.js');
const mockResponses = {
    success: mockResponsesModule.success,
    error: mockResponsesModule.error,
    empty: mockResponsesModule.empty,
    custom: mockResponsesModule.custom
};

// Import all mock server configuration fixtures with required members access
const mockServerConfigsModule = require('./mockServerConfigs.js');
const mockServerConfigs = {
    default: mockServerConfigsModule.default,
    custom: mockServerConfigsModule.custom,
    invalid: mockServerConfigsModule.invalid,
    environment: mockServerConfigsModule.environment,
    portConflict: mockServerConfigsModule.portConflict,
    dynamic: mockServerConfigsModule.dynamic
};

// Import all mock environment fixtures with required members access
const mockEnvironmentModule = require('./mockEnvironment.js');
const mockEnvironment = mockEnvironmentModule.mockEnvironment || mockEnvironmentModule.default;

// Import file system mocking utilities and custom scenario creator
const mockFileSystemModule = require('./mockFileSystem.js');
const { 
    fs, 
    mockFiles, 
    permissions, 
    errors,
    createMockFileSystem,
    resetFileSystemMocks,
    createCustomMockScenario 
} = mockFileSystemModule;

// Create mockFileSystem object with required members exposed
const mockFileSystem = {
    readFile: fs.readFile,
    writeFile: fs.writeFile,
    existsSync: fs.existsSync,
    access: fs.access,
    mkdir: fs.mkdir,
    rmdir: fs.rmdir
};

// Import timer mocking utilities with required members access
const mockTimersModule = require('./mockTimers.js');
const { 
    jestTimers,
    timeouts,
    intervals,
    delays
} = mockTimersModule;

// Extract specific delay members for re-export
const delaysExport = {
    exponentialBackoff: delays.exponentialBackoff,
    linearBackoff: delays.linearBackoff,
    jitterDelay: delays.jitterDelay,
    retryDelay: delays.retryDelay
};

// Import test data generation utilities and class
const testDataGeneratorModule = require('./testDataGenerator.js');
const TestDataGeneratorClass = testDataGeneratorModule.default || testDataGeneratorModule.TestDataGenerator;
const {
    generateTestScenario,
    generateRandomPort,
    generateUniqueTestId,
    generateCompleteTestCase,
    createCoordinatedMockData,
    createIsolatedTestData,
    testDataPatterns
} = testDataGeneratorModule;

// Export all fixtures and utilities using CommonJS module.exports
module.exports = {
    // Mock request fixtures
    mockRequests,
    
    // Mock response fixtures 
    mockResponses,
    
    // Mock server configuration fixtures
    mockServerConfigs,
    
    // Mock environment fixtures
    mockEnvironment,
    
    // File system mock object with required members
    mockFileSystem,
    
    // Mock files object with all file types
    mockFiles,
    
    // File system permissions object
    permissions,
    
    // File system errors object (renamed for clarity)
    fileSystemErrors: errors,
    
    // File system utility functions
    createMockFileSystem,
    resetFileSystemMocks,
    createCustomMockScenario,
    
    // Jest timer utilities with required members
    jestTimers,
    
    // Timeout configurations
    timeouts,
    
    // Interval configurations
    intervals,
    
    // Delay configurations with required members
    delays: delaysExport,
    
    // Test data generation utility functions
    generateTestScenario,
    generateRandomPort,
    generateUniqueTestId,
    generateCompleteTestCase,
    createCoordinatedMockData,
    createIsolatedTestData,
    
    // Comprehensive test data patterns
    testDataPatterns,
    
    // Main TestDataGenerator class (both as default and named export)
    TestDataGenerator: TestDataGeneratorClass,
    default: TestDataGeneratorClass
};