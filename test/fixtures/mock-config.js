/**
 * Mock Configuration Module for Test Isolation
 * 
 * Provides comprehensive mock configuration settings and utilities for test isolation
 * in the Testinium-QA Node.js testing infrastructure. This module supports both Jest
 * and Mocha testing frameworks by exporting mock server configurations, environment
 * variable mocks, external service stubs, and test-specific settings.
 * 
 * Features:
 * - Dynamic port allocation for parallel test execution
 * - Environment variable mocking for different test scenarios
 * - Mock file system paths for configuration loading
 * - External service endpoint stubs for API testing
 * - Timeout settings optimized for test execution
 * - Override utilities for per-test customization
 * 
 * @module test/fixtures/mock-config
 * @since 1.0.0
 * @author Blitzy Platform
 */

// Node.js built-in modules for mock configuration generation
const path = require('path');
const process = require('process');
const url = require('url');
const os = require('os');

/**
 * Mock Server Configuration
 * 
 * Provides server-related mock settings including port management,
 * host configuration, and server lifecycle options for test isolation.
 */
const server = {
  /**
   * Dynamic port allocation for test servers
   * Using port 0 allows the OS to assign available ports automatically,
   * preventing port conflicts during parallel test execution
   */
  port: 0,
  
  /**
   * Backup port range for explicit port testing scenarios
   * Range selected to avoid common service ports and reduce conflicts
   */
  portRange: {
    min: 3000,
    max: 3999
  },
  
  /**
   * Host configuration for different test environments
   */
  host: '127.0.0.1',
  hostname: os.hostname(),
  
  /**
   * Server startup and shutdown configuration
   */
  lifecycle: {
    startupTimeout: 5000,    // 5 seconds as per Section 0.3.2 SLA requirements
    shutdownTimeout: 3000,   // 3 seconds for graceful shutdown
    maxConnections: 100,     // Concurrent connection limit for load testing
    keepAliveTimeout: 5000   // Keep-alive timeout for HTTP connections
  },
  
  /**
   * Protocol and security settings for mock servers
   */
  protocol: {
    http: {
      enabled: true,
      version: '1.1'
    },
    https: {
      enabled: false,  // Disabled by default for simplicity in unit tests
      cert: null,
      key: null
    }
  }
};

/**
 * Timeout Configuration
 * 
 * Comprehensive timeout settings optimized for test execution performance
 * and reliability across different testing scenarios and CI/CD environments.
 */
const timeout = {
  /**
   * HTTP request timeouts for API testing
   */
  http: {
    connect: 2000,     // Connection establishment timeout
    request: 5000,     // Individual request timeout  
    response: 10000    // Response processing timeout
  },
  
  /**
   * Test execution timeouts
   */
  test: {
    unit: 5000,        // Individual unit test timeout (5s)
    integration: 15000, // Integration test timeout (15s)
    e2e: 30000,        // End-to-end test timeout (30s)
    suite: 300000      // Full test suite timeout (5 minutes)
  },
  
  /**
   * Server lifecycle timeouts
   */
  server: {
    startup: 5000,     // Server startup timeout
    shutdown: 3000,    // Graceful shutdown timeout
    healthCheck: 1000  // Health check response timeout
  },
  
  /**
   * Database and external service timeouts
   */
  external: {
    database: 3000,    // Database query timeout
    api: 8000,         // External API call timeout
    fileSystem: 2000   // File system operation timeout
  }
};

/**
 * Environment Variable Mocks
 * 
 * Provides mock environment variables for different test scenarios,
 * ensuring consistent test execution across different environments
 * without relying on actual system environment variables.
 */
const env = {
  /**
   * Base environment variables for all test scenarios
   */
  base: {
    NODE_ENV: 'test',
    PORT: '0',  // Dynamic port allocation
    HOST: '127.0.0.1',
    TZ: 'UTC',  // Standardized timezone for consistent test results
    CI: 'false'
  },
  
  /**
   * Development environment simulation
   */
  development: {
    ...process.env,  // Inherit actual environment
    NODE_ENV: 'development',
    DEBUG: 'true',
    LOG_LEVEL: 'debug',
    CACHE_ENABLED: 'false'
  },
  
  /**
   * Production environment simulation  
   */
  production: {
    NODE_ENV: 'production',
    DEBUG: 'false',
    LOG_LEVEL: 'info',
    CACHE_ENABLED: 'true',
    SECURITY_HEADERS: 'true'
  },
  
  /**
   * CI/CD environment simulation
   */
  ci: {
    NODE_ENV: 'test',
    CI: 'true',
    DEBUG: 'false',
    LOG_LEVEL: 'warn',
    PARALLEL_TESTS: 'true',
    HEADLESS: 'true'
  },
  
  /**
   * Current working directory for path resolution
   */
  cwd: process.cwd()
};

/**
 * Port Configuration
 * 
 * Manages port allocation and availability for test servers,
 * ensuring proper isolation and preventing conflicts during
 * parallel test execution scenarios.
 */
const ports = {
  /**
   * Dynamic port allocation function
   * Returns 0 to let the OS assign an available port
   */
  getDynamicPort: () => 0,
  
  /**
   * Reserved ports for specific test scenarios
   */
  reserved: {
    httpServer: 3001,
    httpsServer: 3443,
    mockApi: 3002,
    testDb: 3306,
    redis: 6379
  },
  
  /**
   * Port availability checking utilities
   */
  utils: {
    /**
     * Generates a random port within the safe range
     * @returns {number} Random port number
     */
    getRandomPort: () => Math.floor(Math.random() * (3999 - 3000 + 1)) + 3000,
    
    /**
     * Returns the next available port in sequence
     * @param {number} startPort Starting port number
     * @returns {number} Next available port
     */
    getNextPort: (startPort = 3000) => startPort + Math.floor(Math.random() * 100)
  }
};

/**
 * Mock File System Paths
 * 
 * Provides consistent mock paths for file system operations,
 * configuration loading, and test data management across
 * different operating systems and test environments.
 */
const paths = {
  /**
   * Project root directory paths
   */
  root: process.cwd(),
  projectRoot: path.resolve(process.cwd()),
  
  /**
   * Test-specific directory paths
   */
  testRoot: path.join(process.cwd(), 'test'),
  fixtures: path.join(process.cwd(), 'test', 'fixtures'),
  mockData: path.join(process.cwd(), 'test', 'fixtures', 'mock-data'),
  tempDir: os.tmpdir(),
  
  /**
   * Configuration file paths
   */
  config: {
    base: path.join(process.cwd(), 'config'),
    test: path.join(process.cwd(), 'test', 'config'),
    env: path.join(process.cwd(), '.env.test'),
    package: path.join(process.cwd(), 'package.json')
  },
  
  /**
   * Log and output directory paths
   */
  output: {
    logs: path.join(process.cwd(), 'logs'),
    coverage: path.join(process.cwd(), 'coverage'),
    reports: path.join(process.cwd(), 'test-reports'),
    temp: path.join(os.tmpdir(), 'testinium-qa-test')
  },
  
  /**
   * Path manipulation utilities
   */
  utils: {
    /**
     * Resolves a relative path to absolute path
     * @param {string} relativePath Relative path to resolve
     * @returns {string} Absolute path
     */
    resolve: (relativePath) => path.resolve(relativePath),
    
    /**
     * Joins multiple path segments
     * @param {...string} segments Path segments to join
     * @returns {string} Joined path
     */
    join: (...segments) => path.join(...segments),
    
    /**
     * Gets the directory name of a path
     * @param {string} filePath File path
     * @returns {string} Directory name
     */
    dirname: (filePath) => path.dirname(filePath)
  }
};

/**
 * External Service Endpoint Stubs
 * 
 * Provides mock endpoints and service configurations for external
 * dependencies, enabling test isolation and eliminating external
 * service dependencies during test execution.
 */
const services = {
  /**
   * Mock API endpoints
   */
  api: {
    baseUrl: 'http://localhost:3002/api',
    endpoints: {
      users: '/users',
      auth: '/auth',
      data: '/data',
      health: '/health'
    },
    
    /**
     * Mock API responses
     */
    responses: {
      success: { status: 'ok', code: 200 },
      error: { error: 'Internal Server Error', code: 500 },
      notFound: { error: 'Not Found', code: 404 },
      unauthorized: { error: 'Unauthorized', code: 401 }
    }
  },
  
  /**
   * Database connection mocks
   */
  database: {
    host: 'localhost',
    port: 5432,
    name: 'test_db',
    user: 'test_user',
    password: 'test_password',
    connectionString: 'postgresql://test_user:test_password@localhost:5432/test_db'
  },
  
  /**
   * External service URLs
   */
  external: {
    github: new url.URL('https://api.github.com'),
    npm: url.parse('https://registry.npmjs.org'),
    maven: url.format({
      protocol: 'https:',
      hostname: 'repo1.maven.org',
      pathname: '/maven2/'
    })
  },
  
  /**
   * Mock service utilities
   */
  utils: {
    /**
     * Constructs a complete service URL
     * @param {string} base Base URL
     * @param {string} endpoint Endpoint path
     * @returns {string} Complete URL
     */
    buildUrl: (base, endpoint) => new url.URL(endpoint, base).toString(),
    
    /**
     * Parses a service URL into components
     * @param {string} serviceUrl Service URL to parse
     * @returns {object} Parsed URL components
     */
    parseUrl: (serviceUrl) => url.parse(serviceUrl)
  }
};

/**
 * Configuration Override Utility
 * 
 * Provides functionality to override default mock configuration
 * settings on a per-test basis, enabling flexible test scenarios
 * while maintaining base configuration integrity.
 * 
 * @param {object} overrides Configuration overrides to apply
 * @returns {object} Merged configuration object
 */
function overrideConfig(overrides = {}) {
  // Deep clone the base configuration to prevent mutations
  const baseConfig = {
    server: { ...server },
    timeout: { ...timeout },
    env: { ...env },
    ports: { ...ports },
    paths: { ...paths },
    services: { ...services }
  };
  
  // Apply overrides using object spread for shallow merge
  // For deep merging, each section is handled individually
  const mergedConfig = {
    server: { ...baseConfig.server, ...(overrides.server || {}) },
    timeout: { 
      ...baseConfig.timeout, 
      ...(overrides.timeout || {}),
      http: { ...baseConfig.timeout.http, ...(overrides.timeout?.http || {}) },
      test: { ...baseConfig.timeout.test, ...(overrides.timeout?.test || {}) },
      server: { ...baseConfig.timeout.server, ...(overrides.timeout?.server || {}) },
      external: { ...baseConfig.timeout.external, ...(overrides.timeout?.external || {}) }
    },
    env: {
      ...baseConfig.env,
      ...(overrides.env || {}),
      base: { ...baseConfig.env.base, ...(overrides.env?.base || {}) },
      development: { ...baseConfig.env.development, ...(overrides.env?.development || {}) },
      production: { ...baseConfig.env.production, ...(overrides.env?.production || {}) },
      ci: { ...baseConfig.env.ci, ...(overrides.env?.ci || {}) }
    },
    ports: { ...baseConfig.ports, ...(overrides.ports || {}) },
    paths: { ...baseConfig.paths, ...(overrides.paths || {}) },
    services: { 
      ...baseConfig.services, 
      ...(overrides.services || {}),
      api: { ...baseConfig.services.api, ...(overrides.services?.api || {}) },
      database: { ...baseConfig.services.database, ...(overrides.services?.database || {}) },
      external: { ...baseConfig.services.external, ...(overrides.services?.external || {}) }
    }
  };
  
  return mergedConfig;
}

/**
 * Mock Configuration Export
 * 
 * Default export containing all mock configuration components
 * and utilities for comprehensive test isolation support.
 * 
 * @type {object}
 */
const mockConfig = {
  server,
  timeout,
  env,
  ports,
  paths,
  services,
  overrideConfig
};

// CommonJS module export for compatibility with both Jest and Mocha
module.exports = mockConfig;