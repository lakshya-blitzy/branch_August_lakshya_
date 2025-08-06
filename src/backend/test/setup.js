/**
 * Test setup and environment configuration utilities
 * Provides standardized test environment setup and teardown functionality
 */

/**
 * Sets up the test environment with necessary configurations and mocks
 * @param {Object} options - Test environment setup options
 * @returns {Promise<Object>} Setup result with test environment configuration
 */
export async function setupTestEnvironment(options = {}) {
  const config = {
    timeout: options.timeout || 30000,
    enableMocking: options.enableMocking !== false,
    resetAfterEach: options.resetAfterEach !== false,
    enableLogging: options.enableLogging || false,
    ...options
  };

  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Configure test-specific settings
  if (config.enableMocking) {
    // Enable mocking functionality
  }

  return {
    success: true,
    config,
    timestamp: new Date().toISOString()
  };
}

/**
 * Tears down the test environment and cleans up resources
 * @param {Object} options - Teardown options
 * @returns {Promise<void>}
 */
export async function teardownTestEnvironment(options = {}) {
  // Clean up test resources
  if (options.resetEnv) {
    delete process.env.NODE_ENV;
  }
}

/**
 * Create a test server instance for testing
 * @param {Object} app - Express application instance
 * @param {Object} options - Server configuration options
 * @returns {Promise<Object>} Server instance and utilities
 */
export async function createTestServer(app, options = {}) {
  const port = options.port || 0; // Use dynamic port if not specified
  
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      const actualPort = server.address().port;
      
      resolve({
        server,
        port: actualPort,
        url: `http://localhost:${actualPort}`,
        close: () => {
          return new Promise((resolveClose) => {
            server.close(() => resolveClose());
          });
        }
      });
    });
  });
}

/**
 * Default test environment configuration
 */
export const defaultTestConfig = {
  timeout: 30000,
  enableMocking: true,
  resetAfterEach: true,
  enableLogging: false
};

/**
 * TestEnvironment class for managing test environments
 */
export class TestEnvironment {
  constructor(config = {}) {
    this.config = { ...defaultTestConfig, ...config };
    this.isInitialized = false;
    this.resources = new Map();
  }

  async initialize() {
    if (this.isInitialized) {
      return this;
    }

    // Set up test environment
    const setupResult = await setupTestEnvironment(this.config);
    this.isInitialized = setupResult.success;
    
    return this;
  }

  async cleanup() {
    if (!this.isInitialized) {
      return;
    }

    // Clean up resources
    for (const [key, resource] of this.resources) {
      try {
        if (resource && typeof resource.close === 'function') {
          await resource.close();
        }
      } catch (error) {
        console.warn(`Failed to cleanup resource ${key}:`, error);
      }
    }

    await teardownTestEnvironment(this.config);
    this.isInitialized = false;
    this.resources.clear();
  }

  addResource(key, resource) {
    this.resources.set(key, resource);
  }

  getResource(key) {
    return this.resources.get(key);
  }

  isReady() {
    return this.isInitialized;
  }
}