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
 * import * as fixtures from './fixtures';
 * 
 * // Or import specific fixtures
 * import { mockRequests, mockResponses, TestDataGenerator } from './fixtures';
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
import mockRequestsModule from './mockRequests.js';
const mockRequests = {
    valid: mockRequestsModule.valid,
    invalid: mockRequestsModule.invalid,
    malformed: mockRequestsModule.malformed,
    oversized: mockRequestsModule.oversized,
    injection: mockRequestsModule.injection
};

// Import all mock response fixtures with required members access
import mockResponsesModule from './mockResponses.js';
const mockResponses = {
    success: mockResponsesModule.success,
    error: mockResponsesModule.error,
    empty: mockResponsesModule.empty,
    custom: mockResponsesModule.custom
};

// Import all mock server configuration fixtures with required members access
import mockServerConfigsModule from './mockServerConfigs.js';
const mockServerConfigs = {
    default: mockServerConfigsModule.default,
    custom: mockServerConfigsModule.custom,
    invalid: mockServerConfigsModule.invalid,
    environment: mockServerConfigsModule.environment,
    portConflict: mockServerConfigsModule.portConflict,
    dynamic: mockServerConfigsModule.dynamic
};

// Import all mock environment fixtures with required members access
import mockEnvironmentModule from './mockEnvironment.js';
const mockEnvironment = {
    development: mockEnvironmentModule.development,
    testing: mockEnvironmentModule.testing,
    production: mockEnvironmentModule.production,
    ci: mockEnvironmentModule.ci,
    staging: mockEnvironmentModule.staging,
    custom: mockEnvironmentModule.custom
};

// Import file system mocking utilities and custom scenario creator
import { 
    fs, 
    mockFiles, 
    permissions, 
    errors,
    createMockFileSystem,
    resetFileSystemMocks,
    createCustomMockScenario 
} from './mockFileSystem.js';

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
import { 
    jestTimers,
    timeouts,
    intervals,
    delays
} from './mockTimers.js';

// Extract specific delay members for re-export
const delaysExport = {
    exponentialBackoff: delays.exponentialBackoff,
    linearBackoff: delays.linearBackoff,
    jitterDelay: delays.jitterDelay,
    retryDelay: delays.retryDelay
};

// Import test data generation utilities and class
import TestDataGeneratorClass, {
    generateTestScenario,
    generateRandomPort,
    generateUniqueTestId,
    generateCompleteTestCase,
    createCoordinatedMockData,
    createIsolatedTestData,
    testDataPatterns
} from './testDataGenerator.js';

// Export all mock request fixtures as named export
export { mockRequests };

// Export all mock response fixtures as named export
export { mockResponses };

// Export all mock server configuration fixtures as named export
export { mockServerConfigs };

// Export all mock environment fixtures as named export
export { mockEnvironment };

// Export file system mock object with required members
export { mockFileSystem };

// Export mock files object with all file types
export { mockFiles };

// Export file system permissions object
export { permissions };

// Export file system errors object (renamed for clarity)
export { errors as fileSystemErrors };

// Export file system utility functions
export { createMockFileSystem };
export { resetFileSystemMocks };
export { createCustomMockScenario };

// Export Jest timer utilities with required members
export { jestTimers };

// Export timeout configurations
export { timeouts };

// Export interval configurations  
export { intervals };

// Export delay configurations with required members
export { delaysExport as delays };

// Export test data generation utility functions
export { generateTestScenario };
export { generateRandomPort };
export { generateUniqueTestId };
export { generateCompleteTestCase };
export { createCoordinatedMockData };
export { createIsolatedTestData };

// Export comprehensive test data patterns
export { testDataPatterns };

// Export the main TestDataGenerator class as default export
export default TestDataGeneratorClass;

// Also export TestDataGenerator as named export for convenience
export { TestDataGeneratorClass as TestDataGenerator };