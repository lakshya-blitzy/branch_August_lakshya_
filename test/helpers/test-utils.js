const TestServer = require('../../server');
const testData = require('../fixtures/test-data.json');

/**
 * Test utilities for server testing
 */
class TestUtils {
    /**
     * Creates a test server instance with random port
     */
    static createTestServer(port = 0) {
        return new TestServer(port);
    }

    /**
     * Starts a test server and returns promise with server details
     */
    static startTestServer(port = 0) {
        return new Promise((resolve, reject) => {
            const testServer = new TestServer(port);
            const server = testServer.start((error, assignedPort) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({
                    testServer,
                    server,
                    port: assignedPort
                });
            });
        });
    }

    /**
     * Stops a test server gracefully
     */
    static stopTestServer(testServer) {
        return new Promise((resolve) => {
            if (testServer) {
                testServer.stop(() => resolve());
            } else {
                resolve();
            }
        });
    }

    /**
     * Gets test data from fixtures
     */
    static getTestData() {
        return testData;
    }

    /**
     * Gets valid request data for testing
     */
    static getValidRequests() {
        return testData.validRequests;
    }

    /**
     * Gets invalid JSON examples for testing
     */
    static getInvalidJSON() {
        return testData.invalidJSON;
    }

    /**
     * Gets expected responses for comparison
     */
    static getExpectedResponses() {
        return testData.expectedResponses;
    }

    /**
     * Gets test scenarios for parameterized testing
     */
    static getTestScenarios() {
        return testData.testScenarios;
    }

    /**
     * Validates response format for server endpoints
     */
    static validateResponseFormat(response, expectedKeys = []) {
        expect(response).toBeDefined();
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
        
        expectedKeys.forEach(key => {
            expect(response.body).toHaveProperty(key);
        });
    }

    /**
     * Validates standard headers are present
     */
    static validateHeaders(response, additionalHeaders = {}) {
        expect(response.headers).toBeDefined();
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.headers['x-test-server']).toBe('true');
        
        Object.entries(additionalHeaders).forEach(([key, value]) => {
            expect(response.headers[key]).toBe(value);
        });
    }

    /**
     * Validates timestamp format (ISO 8601)
     */
    static validateTimestamp(timestamp) {
        expect(typeof timestamp).toBe('string');
        expect(() => new Date(timestamp)).not.toThrow();
        expect(new Date(timestamp).toISOString()).toBe(timestamp);
        
        // Validate it's a reasonable timestamp (not too far in past/future)
        const now = Date.now();
        const timestampMs = new Date(timestamp).getTime();
        const oneHour = 60 * 60 * 1000;
        
        expect(timestampMs).toBeGreaterThan(now - oneHour);
        expect(timestampMs).toBeLessThanOrEqual(now + oneHour);
    }

    /**
     * Measures response time for performance testing
     */
    static async measureResponseTime(requestFunction) {
        const start = Date.now();
        const response = await requestFunction();
        const duration = Date.now() - start;
        
        return { response, duration };
    }

    /**
     * Validates performance against targets
     */
    static validatePerformance(duration, maxTime = testData.performanceTargets.maxResponseTime) {
        expect(duration).toBeLessThan(maxTime);
    }

    /**
     * Creates random test data
     */
    static generateRandomData() {
        return {
            id: Math.floor(Math.random() * 10000),
            name: `TestUser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            timestamp: new Date().toISOString(),
            randomValue: Math.random(),
            boolean: Math.random() > 0.5,
            array: Array.from({ length: 3 }, (_, i) => `item_${i}`),
            nested: {
                level1: {
                    level2: {
                        value: 'deep_nested_value'
                    }
                }
            }
        };
    }

    /**
     * Generates large test data for stress testing
     */
    static generateLargeData(sizeKB = 100) {
        const targetSize = sizeKB * 1024; // Convert to bytes
        const baseData = { message: 'A'.repeat(100) };
        const items = [];
        let currentSize = 0;
        
        while (currentSize < targetSize) {
            items.push({ ...baseData, id: items.length });
            currentSize = JSON.stringify(items).length;
        }
        
        return { items, totalItems: items.length, sizeBytes: currentSize };
    }

    /**
     * Validates error response format
     */
    static validateErrorResponse(response, expectedStatus, expectedError = null) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.error).toBe('string');
        expect(typeof response.body.message).toBe('string');
        
        if (expectedError) {
            expect(response.body.error).toBe(expectedError);
        }
        
        this.validateHeaders(response);
    }

    /**
     * Runs multiple concurrent requests for load testing
     */
    static async runConcurrentRequests(requestFunction, concurrency = 10) {
        const promises = Array.from({ length: concurrency }, () => requestFunction());
        const results = await Promise.allSettled(promises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
            total: results.length,
            successful,
            failed,
            results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
        };
    }

    /**
     * Waits for a specified amount of time
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retries an operation with exponential backoff
     */
    static async retry(operation, maxAttempts = 3, baseDelay = 100) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxAttempts) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    await this.delay(delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Gets available port for testing
     */
    static async getAvailablePort() {
        const testServer = new TestServer(0);
        
        return new Promise((resolve, reject) => {
            testServer.start((error, port) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                testServer.stop(() => {
                    resolve(port);
                });
            });
        });
    }

    /**
     * Validates JSON schema-like structure
     */
    static validateObjectSchema(obj, schema) {
        Object.entries(schema).forEach(([key, expectedType]) => {
            expect(obj).toHaveProperty(key);
            
            if (expectedType === 'string') {
                expect(typeof obj[key]).toBe('string');
            } else if (expectedType === 'number') {
                expect(typeof obj[key]).toBe('number');
            } else if (expectedType === 'boolean') {
                expect(typeof obj[key]).toBe('boolean');
            } else if (expectedType === 'object') {
                expect(typeof obj[key]).toBe('object');
                expect(obj[key]).not.toBeNull();
            } else if (expectedType === 'array') {
                expect(Array.isArray(obj[key])).toBe(true);
            }
        });
    }

    /**
     * Sanitizes data for logging (removes sensitive info)
     */
    static sanitizeForLog(data) {
        const sanitized = JSON.parse(JSON.stringify(data));
        
        // Remove common sensitive fields
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
        
        const sanitizeObject = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            
            Object.keys(obj).forEach(key => {
                if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    sanitizeObject(obj[key]);
                }
            });
        };
        
        sanitizeObject(sanitized);
        return sanitized;
    }
}

module.exports = TestUtils;