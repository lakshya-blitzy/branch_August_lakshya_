/**
 * @fileoverview Specialized Test Helper Utilities for Server.js Testing
 * @description Comprehensive helper utilities designed specifically for testing all 11 exported 
 * functions from server.js including configuration factories, mock data generators, test environment 
 * setup, validation helpers, and shared constants. Supports enhanced coverage for HTTP responses, 
 * status codes, headers, server startup/shutdown, error handling, PM2 cluster mode, health 
 * monitoring, and edge cases as specified in the Summary of Changes.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Configuration factories for minimal, complete, invalid, and edge case server configurations
 * - Mock data generators for health status responses (healthy, degraded, critical) and PM2 scenarios
 * - Error scenario helpers for system errors, custom errors, and edge case errors
 * - PM2 configuration helpers for cluster mode testing and zero-downtime deployment scenarios
 * - Performance metrics helpers and startup/shutdown utilities for complete server lifecycle testing
 * - Validation helpers and test isolation utilities for parallel execution
 * - Extracted magic numbers and constants for improved maintainability
 * 
 * Test Coverage Support:
 * - All 11 exported server functions: startProductionServer, initializeServerEnvironment, 
 *   setupGracefulShutdownHandlers, handleServerStartupError, validateServerReadiness, 
 *   monitorServerHealth, logServerStartupInformation, createPM2CompatibleServer, 
 *   validateProductionDeployment, initializeHealthMonitoring, trackApplicationUptime
 * - Enhanced coverage targets: 95%+ statements, 90%+ branches, 100% functions
 * - Comprehensive testing scenarios for production readiness validation
 * 
 * Educational Value:
 * - Demonstrates specialized test helper patterns for complex server module testing
 * - Shows configuration factory patterns for comprehensive test scenario coverage
 * - Illustrates mock data generation techniques for health monitoring and cluster scenarios
 * - Provides examples of error scenario modeling and edge case validation
 * - Teaches test isolation and parallel execution support patterns
 * 
 * Technology Integration:
 * - Node.js v22.x built-in modules (crypto, os, process) for secure random generation and system info
 * - Jest v29.7.0 and Mocha v11.0.0 compatible helper functions and utilities
 * - PM2 v6.0.8 cluster mode configuration and testing support
 * - Express.js v5.1.0 server testing with comprehensive middleware validation
 * - Production-grade error handling and performance monitoring scenario support
 */

// Node.js built-in module imports for secure random generation and system information
import { randomBytes } from 'crypto'; // Node.js built-in - Generate secure random bytes for test tokens and correlation IDs
import { totalmem } from 'os'; // Node.js built-in - Total system memory information for performance test scenarios
import { env } from 'process'; // Node.js built-in - Environment variable access for test configuration and PM2 detection

// ============================================================================
// CONFIGURATION FACTORIES - Server configuration variations for comprehensive testing
// ============================================================================

/**
 * Configuration variations for parameterized testing covering minimal, complete, invalid, 
 * edge cases, production, development, and testing scenarios. Enables comprehensive 
 * validation of all server configuration paths and environment-specific behaviors.
 * 
 * @constant {Object} CONFIG_VARIATIONS
 */
export const CONFIG_VARIATIONS = {
  minimal: {
    server: { 
      port: 3000,
      host: '127.0.0.1'
    },
    environment: 'development'
  },
  
  complete: {
    server: {
      port: 3000,
      host: '127.0.0.1',
      protocol: 'http',
      timeout: 30000
    },
    security: {
      helmet: true,
      cors: true,
      csp: true,
      ssl: false
    },
    pm2: {
      enabled: true,
      instances: 'max',
      monitoring: true
    },
    logging: {
      level: 'info',
      format: 'json',
      enabled: true
    },
    environment: 'production'
  },
  
  invalid: {
    server: {
      port: 'invalid-port',
      host: null
    },
    security: {
      helmet: 'invalid-config'
    },
    environment: 'invalid-env'
  },
  
  edgeCases: {
    server: {
      port: 65535, // Maximum valid port
      host: '0.0.0.0' // All interfaces
    },
    security: {
      helmet: true,
      cors: {
        origin: ['https://example.com', 'https://test.com'],
        credentials: true
      }
    },
    pm2: {
      enabled: true,
      instances: 1,
      monitoring: false
    },
    environment: 'production'
  },
  
  production: {
    server: {
      port: env.PORT || 3000,
      host: '0.0.0.0'
    },
    security: {
      helmet: true,
      cors: false,
      csp: true,
      ssl: true
    },
    pm2: {
      enabled: true,
      instances: 'max',
      monitoring: true,
      clustering: true,
      zeroDowntime: true
    },
    logging: {
      level: 'warn',
      format: 'json'
    },
    environment: 'production'
  },
  
  development: {
    server: {
      port: 3000,
      host: '127.0.0.1'
    },
    security: {
      helmet: true,
      cors: true,
      csp: false
    },
    pm2: {
      enabled: false
    },
    logging: {
      level: 'debug',
      format: 'dev'
    },
    environment: 'development'
  },
  
  testing: {
    server: {
      port: 0, // Let system assign available port
      host: '127.0.0.1'
    },
    security: {
      helmet: false,
      cors: true
    },
    pm2: {
      enabled: false
    },
    logging: {
      level: 'silent',
      enabled: false
    },
    environment: 'test'
  }
};

/**
 * Health status fixtures for comprehensive health monitoring test scenarios including
 * healthy, degraded, critical, starting, shutting down, and maintenance states.
 * 
 * @constant {Object} HEALTH_STATUS_FIXTURES
 */
export const HEALTH_STATUS_FIXTURES = {
  healthy: {
    status: 'healthy',
    uptime: 3600.123,
    memoryUsage: {
      rss: 52428800,     // 50MB
      heapTotal: 31457280, // 30MB
      heapUsed: 20971520,  // 20MB
      external: 1048576    // 1MB
    },
    cpuUsage: {
      user: 100000,    // 100ms
      system: 50000    // 50ms
    },
    requestCount: 1000,
    errorCount: 0,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    environment: 'test'
  },
  
  degraded: {
    status: 'degraded',
    uptime: 7200.456,
    memoryUsage: {
      rss: 838860800,      // 800MB - high memory usage
      heapTotal: 629145600, // 600MB
      heapUsed: 524288000,  // 500MB
      external: 10485760    // 10MB
    },
    cpuUsage: {
      user: 5000000,   // 5000ms - high CPU usage
      system: 2000000  // 2000ms
    },
    requestCount: 5000,
    errorCount: 25,
    errors: ['high_memory', 'slow_response'],
    timestamp: new Date().toISOString(),
    pid: process.pid,
    environment: 'production'
  },
  
  critical: {
    status: 'critical',
    uptime: 900.789,
    memoryUsage: {
      rss: 1073741824,     // 1GB - critical memory usage
      heapTotal: 805306368, // 768MB
      heapUsed: 734003200,  // 700MB
      external: 52428800    // 50MB
    },
    cpuUsage: {
      user: 10000000,  // 10000ms - critical CPU usage
      system: 5000000  // 5000ms
    },
    requestCount: 100,
    errorCount: 50,
    errors: ['out_of_memory', 'cpu_overload', 'connection_timeout'],
    timestamp: new Date().toISOString(),
    pid: process.pid,
    environment: 'production'
  },
  
  starting: {
    status: 'starting',
    uptime: 5.123,
    memoryUsage: {
      rss: 20971520,       // 20MB - initial memory usage
      heapTotal: 15728640, // 15MB
      heapUsed: 10485760,  // 10MB
      external: 1048576    // 1MB
    },
    cpuUsage: {
      user: 50000,     // 50ms
      system: 25000    // 25ms
    },
    requestCount: 0,
    errorCount: 0,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    environment: 'production'
  },
  
  shutting_down: {
    status: 'shutting_down',
    uptime: 3600.987,
    memoryUsage: {
      rss: 31457280,       // 30MB - releasing memory
      heapTotal: 20971520, // 20MB
      heapUsed: 15728640,  // 15MB
      external: 2097152    // 2MB
    },
    cpuUsage: {
      user: 200000,    // 200ms
      system: 100000   // 100ms
    },
    requestCount: 2500,
    errorCount: 5,
    shutdownInitiated: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    environment: 'production'
  },
  
  maintenance: {
    status: 'maintenance',
    uptime: 1800.654,
    memoryUsage: {
      rss: 41943040,       // 40MB
      heapTotal: 31457280, // 30MB
      heapUsed: 25165824,  // 24MB
      external: 3145728    // 3MB
    },
    cpuUsage: {
      user: 150000,    // 150ms
      system: 75000    // 75ms
    },
    requestCount: 0,
    errorCount: 0,
    maintenanceMode: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    environment: 'production'
  }
};

/**
 * Error scenario fixtures for comprehensive error handling testing including system errors,
 * custom errors, edge case errors, startup errors, shutdown errors, and timeout errors.
 * 
 * @constant {Object} ERROR_FIXTURES
 */
export const ERROR_FIXTURES = {
  systemErrors: [
    {
      code: 'EADDRINUSE',
      message: 'Address already in use',
      errno: -98,
      syscall: 'listen',
      address: '127.0.0.1',
      port: 3000,
      category: 'port-binding',
      recoverable: true
    },
    {
      code: 'EACCES',
      message: 'Permission denied',
      errno: -13,
      syscall: 'listen',
      address: '0.0.0.0',
      port: 80,
      category: 'permission',
      recoverable: false
    },
    {
      code: 'ENOTFOUND',
      message: 'Hostname not found',
      errno: -3008,
      syscall: 'getaddrinfo',
      hostname: 'invalid.localhost',
      category: 'network',
      recoverable: false
    }
  ],
  
  customErrors: [
    {
      name: 'ConfigValidationError',
      message: 'Configuration validation failed',
      details: ['Invalid port number', 'Missing security configuration'],
      category: 'configuration',
      recoverable: true
    },
    {
      name: 'StartupTimeoutError',
      message: 'Server startup timeout exceeded',
      timeout: 30000,
      category: 'startup',
      recoverable: false
    },
    {
      name: 'HealthCheckFailureError',
      message: 'Health check validation failed',
      checks: ['memory', 'cpu', 'connections'],
      category: 'health',
      recoverable: true
    }
  ],
  
  edgeCaseErrors: [
    {
      code: 'EMFILE',
      message: 'Too many open files',
      errno: -24,
      syscall: 'open',
      category: 'resource',
      recoverable: true
    },
    {
      code: 'ENOMEM',
      message: 'Cannot allocate memory',
      errno: -12,
      syscall: 'spawn',
      category: 'memory',
      recoverable: false
    },
    {
      code: 'ENOSPC',
      message: 'No space left on device',
      errno: -28,
      syscall: 'write',
      category: 'disk',
      recoverable: false
    }
  ],
  
  startupErrors: [
    {
      phase: 'initialization',
      error: 'Environment validation failed',
      details: 'NODE_ENV not set',
      recoverable: true
    },
    {
      phase: 'configuration',
      error: 'Invalid server configuration',
      details: 'Port must be a number between 1 and 65535',
      recoverable: true
    },
    {
      phase: 'pm2-setup',
      error: 'PM2 cluster mode initialization failed',
      details: 'Unable to detect worker process',
      recoverable: false
    }
  ],
  
  shutdownErrors: [
    {
      phase: 'graceful-shutdown',
      error: 'Shutdown timeout exceeded',
      timeout: 30000,
      recoverable: false
    },
    {
      phase: 'connection-draining',
      error: 'Active connections remain',
      activeConnections: 5,
      recoverable: true
    },
    {
      phase: 'cleanup',
      error: 'Resource cleanup failed',
      details: 'Unable to close monitoring intervals',
      recoverable: true
    }
  ],
  
  timeoutErrors: [
    {
      operation: 'server-startup',
      timeout: 30000,
      actual: 35000,
      category: 'performance'
    },
    {
      operation: 'health-check',
      timeout: 5000,
      actual: 8000,
      category: 'monitoring'
    },
    {
      operation: 'graceful-shutdown',
      timeout: 30000,
      actual: 45000,
      category: 'shutdown'
    }
  ]
};

/**
 * PM2 configuration fixtures for cluster mode testing, zero-downtime deployment scenarios,
 * load balancing, health checks, and restart policies.
 * 
 * @constant {Object} PM2_CONFIG_FIXTURES
 */
export const PM2_CONFIG_FIXTURES = {
  clusterMode: {
    name: 'tutorial-server-cluster',
    script: './server.js',
    instances: 'max',
    execMode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PM2_HOME: '/tmp/.pm2',
      PM2_INSTANCES: '4'
    },
    autorestart: true,
    watch: false,
    maxMemoryRestart: '1G',
    minUptime: '10s',
    maxRestarts: 10
  },
  
  forkMode: {
    name: 'tutorial-server-fork',
    script: './server.js',
    instances: 1,
    execMode: 'fork',
    env: {
      NODE_ENV: 'development',
      TEST_ENV: 'true'
    },
    autorestart: true,
    watch: true,
    ignoreWatch: ['node_modules', 'logs'],
    maxMemoryRestart: '500M'
  },
  
  zeroDowntime: {
    deploymentStrategy: 'rolling',
    maxConcurrentActions: 1,
    updateTimeout: 4000,
    killTimeout: 1600,
    listenTimeout: 3000,
    gracefulShutdown: true,
    instances: 4,
    reloadDelay: 1000
  },
  
  loadBalancing: {
    algorithm: 'round-robin',
    enableStickySessions: false,
    healthCheckEnabled: true,
    healthCheckPath: '/health',
    healthCheckInterval: 30000,
    healthCheckTimeout: 5000,
    failoverTimeout: 5000,
    maxFailures: 3
  },
  
  healthChecks: {
    enabled: true,
    endpoint: '/health',
    interval: 30000,
    timeout: 5000,
    retries: 3,
    expectedStatus: 200,
    expectedFields: ['status', 'uptime', 'timestamp']
  },
  
  restartPolicies: {
    exponentialBackoff: {
      minDelay: 1000,
      maxDelay: 60000,
      factor: 2,
      maxRetries: 10
    },
    memoryBased: {
      threshold: '1G',
      checkInterval: 30000,
      gracePeriod: 10000
    },
    errorBased: {
      errorThreshold: 10,
      timeWindow: 60000,
      action: 'restart'
    }
  }
};

/**
 * Performance metrics fixtures for startup time, memory usage, CPU usage, response time,
 * request count, error rate, and uptime measurements.
 * 
 * @constant {Object} PERFORMANCE_METRICS_FIXTURES
 */
export const PERFORMANCE_METRICS_FIXTURES = {
  startupTime: {
    target: 2000,      // 2 seconds
    warning: 5000,     // 5 seconds
    critical: 10000,   // 10 seconds
    actual: 1500,      // 1.5 seconds
    unit: 'milliseconds'
  },
  
  memoryUsage: {
    rss: {
      current: 52428800,    // 50MB
      peak: 104857600,      // 100MB
      target: 134217728,    // 128MB
      warning: 268435456,   // 256MB
      critical: 536870912   // 512MB
    },
    heapTotal: {
      current: 31457280,    // 30MB
      peak: 62914560,       // 60MB
      target: 83886080      // 80MB
    },
    heapUsed: {
      current: 20971520,    // 20MB
      peak: 41943040,       // 40MB
      target: 52428800      // 50MB
    }
  },
  
  cpuUsage: {
    user: {
      current: 100000,      // 100ms
      peak: 500000,         // 500ms
      target: 200000        // 200ms
    },
    system: {
      current: 50000,       // 50ms
      peak: 200000,         // 200ms
      target: 100000        // 100ms
    },
    percentage: {
      current: 15.5,        // 15.5%
      peak: 85.2,           // 85.2%
      target: 70.0,         // 70%
      warning: 80.0,        // 80%
      critical: 90.0        // 90%
    }
  },
  
  responseTime: {
    p50: 25,              // 25ms
    p95: 75,              // 75ms
    p99: 150,             // 150ms
    average: 45,          // 45ms
    target: 100,          // 100ms
    warning: 200,         // 200ms
    critical: 500         // 500ms
  },
  
  requestCount: {
    total: 10000,
    successful: 9850,
    failed: 150,
    rate: 500,            // requests per second
    target: 1000,         // target RPS
    peak: 1250            // peak RPS
  },
  
  errorRate: {
    current: 0.015,       // 1.5%
    target: 0.001,        // 0.1%
    warning: 0.01,        // 1%
    critical: 0.05,       // 5%
    total: 150,
    categories: {
      '4xx': 120,
      '5xx': 30
    }
  },
  
  uptime: {
    current: 3600.123,    // 1 hour
    target: 31536000,     // 1 year (99.9% uptime)
    sla: 0.999,           // 99.9%
    actual: 0.9985,       // 99.85%
    unit: 'seconds'
  }
};

/**
 * Server lifecycle fixtures for startup sequence, shutdown sequence, graceful shutdown,
 * force shutdown, state transitions, and signal handlers.
 * 
 * @constant {Object} SERVER_LIFECYCLE_FIXTURES
 */
export const SERVER_LIFECYCLE_FIXTURES = {
  startupSequence: [
    { phase: 'initialization', duration: 100, status: 'completed' },
    { phase: 'configuration', duration: 200, status: 'completed' },
    { phase: 'environment-setup', duration: 300, status: 'completed' },
    { phase: 'express-app-creation', duration: 150, status: 'completed' },
    { phase: 'server-binding', duration: 50, status: 'completed' },
    { phase: 'health-monitoring', duration: 75, status: 'completed' },
    { phase: 'signal-handlers', duration: 25, status: 'completed' }
  ],
  
  shutdownSequence: [
    { phase: 'signal-received', duration: 0, status: 'initiated' },
    { phase: 'stop-accepting-requests', duration: 10, status: 'completed' },
    { phase: 'drain-connections', duration: 2000, status: 'completed' },
    { phase: 'stop-health-monitoring', duration: 50, status: 'completed' },
    { phase: 'close-server', duration: 100, status: 'completed' },
    { phase: 'cleanup-resources', duration: 75, status: 'completed' },
    { phase: 'exit-process', duration: 5, status: 'completed' }
  ],
  
  gracefulShutdown: {
    timeout: 30000,           // 30 seconds
    signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
    drainTimeout: 25000,      // 25 seconds for connection draining
    forceExitDelay: 5000,     // 5 seconds before force exit
    cleanupSteps: 7,
    expectedDuration: 2240    // Expected total shutdown time
  },
  
  forceShutdown: {
    trigger: 'timeout',
    originalSignal: 'SIGTERM',
    timeout: 30000,
    actualDuration: 30000,
    exitCode: 1,
    remainingConnections: 3,
    incompleteCleanup: ['monitoring-interval', 'health-checks']
  },
  
  stateTransitions: {
    'starting': ['running', 'error'],
    'running': ['shutting_down', 'error', 'maintenance'],
    'shutting_down': ['stopped', 'force_stopped'],
    'error': ['starting', 'stopped'],
    'maintenance': ['running', 'shutting_down'],
    'stopped': ['starting'],
    'force_stopped': ['starting']
  },
  
  signalHandlers: {
    'SIGTERM': {
      description: 'Graceful shutdown for production PM2 deployments',
      graceful: true,
      timeout: 30000,
      cleanup: true
    },
    'SIGINT': {
      description: 'Graceful shutdown for development and manual termination',
      graceful: true,
      timeout: 30000,
      cleanup: true
    },
    'SIGUSR2': {
      description: 'PM2 reload command support for zero-downtime deployments',
      graceful: true,
      timeout: 30000,
      cleanup: true
    },
    'SIGKILL': {
      description: 'Force termination (cannot be caught)',
      graceful: false,
      timeout: 0,
      cleanup: false
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS - Server fixture creation and validation functions
// ============================================================================

/**
 * Creates a server configuration fixture with optional overrides for comprehensive testing scenarios.
 * Generates realistic server configurations with proper validation and environment-specific settings.
 * 
 * @param {Object} [options={}] - Server fixture creation options
 * @param {string} [options.type='minimal'] - Configuration type (minimal, complete, invalid, production, etc.)
 * @param {Object} [options.overrides={}] - Configuration overrides for specific test scenarios
 * @param {boolean} [options.includeSecrets=false] - Whether to include sensitive configuration data
 * @returns {Object} Server configuration fixture with realistic test data
 */
export function createServerFixture(options = {}) {
  const { type = 'minimal', overrides = {}, includeSecrets = false } = options;
  
  // Get base configuration from CONFIG_VARIATIONS
  const baseConfig = CONFIG_VARIATIONS[type] || CONFIG_VARIATIONS.minimal;
  
  // Generate dynamic values for realistic testing
  const dynamicConfig = {
    correlationId: generateTestId('server-fixture'),
    timestamp: new Date().toISOString(),
    testPort: generateTestPort(),
    ...baseConfig
  };
  
  // Add secrets if requested (for testing secret handling)
  if (includeSecrets) {
    dynamicConfig.secrets = {
      jwtSecret: generateSecureToken(),
      sessionSecret: generateSecureToken(),
      apiKey: generateSecureToken()
    };
  }
  
  // Apply overrides with deep merge
  return mergeConfig(dynamicConfig, overrides);
}

/**
 * Creates a health check fixture with configurable status and metrics for health monitoring testing.
 * Generates realistic health status data including memory usage, CPU metrics, and error conditions.
 * 
 * @param {Object} [options={}] - Health check fixture options
 * @param {string} [options.status='healthy'] - Health status (healthy, degraded, critical, etc.)
 * @param {Object} [options.customMetrics={}] - Custom metric overrides
 * @param {boolean} [options.includeErrors=false] - Whether to include error conditions
 * @returns {Object} Health check fixture with realistic metrics and status information
 */
export function createHealthCheckFixture(options = {}) {
  const { status = 'healthy', customMetrics = {}, includeErrors = false } = options;
  
  // Get base health status from HEALTH_STATUS_FIXTURES
  const baseHealth = HEALTH_STATUS_FIXTURES[status] || HEALTH_STATUS_FIXTURES.healthy;
  
  // Generate dynamic health metrics
  const dynamicHealth = {
    ...baseHealth,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    correlationId: generateTestId('health-check'),
    systemMemory: totalmem(),
    nodeVersion: process.version,
    platform: process.platform
  };
  
  // Add error conditions if requested
  if (includeErrors && status !== 'healthy') {
    dynamicHealth.errors = generateHealthErrors(status);
    dynamicHealth.recommendations = generateHealthRecommendations(status);
  }
  
  // Apply custom metrics
  return { ...dynamicHealth, ...customMetrics };
}

/**
 * Creates a server error fixture with comprehensive error details for error handling testing.
 * Generates realistic error scenarios including system errors, validation errors, and custom errors.
 * 
 * @param {Object} [options={}] - Error fixture creation options
 * @param {string} [options.category='system'] - Error category (system, custom, validation, etc.)
 * @param {string} [options.code] - Specific error code (EADDRINUSE, EACCES, etc.)
 * @param {boolean} [options.includeStack=true] - Whether to include stack trace
 * @returns {Object} Server error fixture with realistic error details and context
 */
export function createServerErrorFixture(options = {}) {
  const { category = 'system', code, includeStack = true } = options;
  
  let errorTemplate;
  
  // Select error template based on category and code
  if (category === 'system' && code) {
    // Search for the error code across all system error arrays
    const systemErrorArrays = [ERROR_FIXTURES.systemErrors, ERROR_FIXTURES.edgeCaseErrors, ERROR_FIXTURES.startupErrors, ERROR_FIXTURES.shutdownErrors, ERROR_FIXTURES.timeoutErrors];
    for (const errorArray of systemErrorArrays) {
      errorTemplate = errorArray.find(err => err.code === code);
      if (errorTemplate) break;
    }
  } else if (category === 'system' && !code) {
    errorTemplate = ERROR_FIXTURES.systemErrors[0]; // Default to first system error
  } else if (category === 'custom') {
    errorTemplate = ERROR_FIXTURES.customErrors[0]; // Default to first custom error
  } else {
    // Unknown category - should cause errorTemplate to be undefined
    errorTemplate = undefined;
  }
  
  if (!errorTemplate) {
    throw new Error(`Unknown error category: ${category} with code: ${code}`);
  }
  
  // Create error fixture with dynamic data
  const errorFixture = {
    ...errorTemplate,
    timestamp: new Date().toISOString(),
    correlationId: generateTestId('error'),
    environment: env.NODE_ENV || 'test',
    pid: process.pid
  };
  
  // Add stack trace if requested
  if (includeStack) {
    errorFixture.stack = generateMockStackTrace(errorTemplate.name || 'Error');
  }
  
  return errorFixture;
}

/**
 * Validates a server fixture against expected schema and requirements for test reliability.
 * Performs comprehensive validation including configuration completeness, type checking, and constraint validation.
 * 
 * @param {Object} fixture - Server fixture to validate
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.strict=false] - Whether to perform strict validation
 * @returns {Object} Validation result with isValid flag and detailed error/warning messages
 */
export function validateServerFixture(fixture, options = {}) {
  const { strict = false } = options;
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    checks: []
  };
  
  // Required fields validation
  const requiredFields = ['server', 'environment'];
  for (const field of requiredFields) {
    if (!fixture[field]) {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
    } else {
      validation.checks.push(`${field}-present`);
    }
  }
  
  // Server configuration validation
  if (fixture.server) {
    if (typeof fixture.server.port !== 'number' || fixture.server.port < 1 || fixture.server.port > 65535) {
      validation.errors.push('Invalid port number (must be 1-65535)');
      validation.isValid = false;
    }
    
    if (fixture.server.host && typeof fixture.server.host !== 'string') {
      validation.errors.push('Invalid host (must be string)');
      validation.isValid = false;
    }
  }
  
  // Environment validation
  const validEnvironments = ['development', 'production', 'test'];
  if (fixture.environment && !validEnvironments.includes(fixture.environment)) {
    if (strict) {
      validation.errors.push(`Invalid environment: ${fixture.environment}`);
      validation.isValid = false;
    } else {
      validation.warnings.push(`Unusual environment: ${fixture.environment}`);
    }
  }
  
  return validation;
}

/**
 * Initializes comprehensive server fixtures including configuration, health status, errors, and PM2 scenarios.
 * Sets up complete test environment with all necessary fixtures for server module testing.
 * 
 * @param {Object} [options={}] - Fixture initialization options
 * @param {boolean} [options.includeAll=true] - Whether to include all fixture types
 * @param {Array<string>} [options.fixtureTypes] - Specific fixture types to initialize
 * @returns {Promise<Object>} Initialized fixture collection with all server testing scenarios
 */
export async function initializeServerFixtures(options = {}) {
  const { includeAll = true, fixtureTypes = [] } = options;
  const startTime = Date.now();
  
  const fixtures = {
    initialized: true,
    timestamp: new Date().toISOString(),
    correlationId: generateTestId('fixtures-init'),
    collections: {}
  };
  
  try {
    // Initialize configuration fixtures
    if (includeAll || fixtureTypes.includes('config')) {
      fixtures.collections.config = {};
      for (const [type, config] of Object.entries(CONFIG_VARIATIONS)) {
        fixtures.collections.config[type] = createServerFixture({ type });
      }
    }
    
    // Initialize health status fixtures
    if (includeAll || fixtureTypes.includes('health')) {
      fixtures.collections.health = {};
      for (const [status, healthData] of Object.entries(HEALTH_STATUS_FIXTURES)) {
        fixtures.collections.health[status] = createHealthCheckFixture({ status });
      }
    }
    
    // Initialize error fixtures
    if (includeAll || fixtureTypes.includes('errors')) {
      fixtures.collections.errors = {};
      for (const [category, errors] of Object.entries(ERROR_FIXTURES)) {
        fixtures.collections.errors[category] = errors.map(error => {
          // Map error fixture categories to createServerErrorFixture categories
          let fixtureCategory = 'system'; // Default to system
          if (category === 'customErrors') {
            fixtureCategory = 'custom';
          }
          return createServerErrorFixture({ category: fixtureCategory, code: error.code });
        });
      }
    }
    
    // Initialize PM2 fixtures
    if (includeAll || fixtureTypes.includes('pm2')) {
      fixtures.collections.pm2 = PM2_CONFIG_FIXTURES;
    }
    
    // Initialize performance fixtures
    if (includeAll || fixtureTypes.includes('performance')) {
      fixtures.collections.performance = PERFORMANCE_METRICS_FIXTURES;
    }
    
    // Initialize lifecycle fixtures
    if (includeAll || fixtureTypes.includes('lifecycle')) {
      fixtures.collections.lifecycle = SERVER_LIFECYCLE_FIXTURES;
    }
    
    const initDuration = Date.now() - startTime;
    fixtures.stats = {
      initializationTime: initDuration,
      fixtureCount: Object.keys(fixtures.collections).length,
      totalFixtures: Object.values(fixtures.collections).reduce((count, collection) => 
        count + (Array.isArray(collection) ? collection.length : Object.keys(collection).length), 0
      )
    };
    
    return fixtures;
    
  } catch (error) {
    throw new Error(`Server fixtures initialization failed: ${error.message}`);
  }
}

/**
 * Cleans up server fixtures and releases resources for proper test isolation.
 * Ensures complete cleanup of all fixture resources and test state.
 * 
 * @param {Object} [fixtures] - Fixtures to clean up
 * @returns {Promise<void>} Promise that resolves when cleanup is complete
 */
export async function cleanupServerFixtures(fixtures) {
  try {
    // Clear fixture collections
    if (fixtures && fixtures.collections) {
      for (const collection of Object.values(fixtures.collections)) {
        if (Array.isArray(collection)) {
          collection.length = 0;
        } else if (typeof collection === 'object') {
          Object.keys(collection).forEach(key => delete collection[key]);
        }
      }
    }
    
    // Clear global test state
    if (global.serverTestFixtures) {
      delete global.serverTestFixtures;
    }
    
    // Force garbage collection if available
    if (global.gc && typeof global.gc === 'function') {
      global.gc();
    }
    
  } catch (error) {
    console.warn('Server fixtures cleanup warning:', error.message);
  }
}

// ============================================================================
// HELPER UTILITY FUNCTIONS - Internal utility functions for fixture generation
// ============================================================================

/**
 * Generates a unique test ID with optional prefix for correlation tracking.
 * @private
 * @param {string} [prefix='test'] - Prefix for the generated ID
 * @returns {string} Unique test ID
 */
function generateTestId(prefix = 'test') {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a secure token for testing authentication and security scenarios.
 * @private
 * @returns {string} Secure random token
 */
function generateSecureToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Generates a random test port number in the safe range for testing.
 * @private
 * @returns {number} Random port number between 3000-9999
 */
function generateTestPort() {
  return Math.floor(Math.random() * 7000) + 3000;
}

/**
 * Generates mock health errors based on status for realistic error scenarios.
 * @private
 * @param {string} status - Health status (degraded, critical, etc.)
 * @returns {Array<string>} Array of relevant health error messages
 */
function generateHealthErrors(status) {
  const errorMap = {
    degraded: ['high_memory_usage', 'slow_response_time', 'elevated_error_rate'],
    critical: ['memory_exhaustion', 'cpu_overload', 'connection_timeout', 'service_unavailable'],
    starting: ['initialization_pending', 'health_checks_incomplete'],
    shutting_down: ['graceful_shutdown_initiated', 'connection_draining'],
    maintenance: ['maintenance_mode_active', 'limited_functionality']
  };
  
  return errorMap[status] || [];
}

/**
 * Generates health recommendations based on status for actionable guidance.
 * @private
 * @param {string} status - Health status
 * @returns {Array<string>} Array of health improvement recommendations
 */
function generateHealthRecommendations(status) {
  const recommendationMap = {
    degraded: ['Monitor memory usage', 'Check response times', 'Review error logs'],
    critical: ['Immediate intervention required', 'Consider restart', 'Check system resources'],
    starting: ['Allow startup completion', 'Monitor initialization progress'],
    shutting_down: ['Allow graceful shutdown', 'Monitor connection draining'],
    maintenance: ['Maintenance mode active', 'Normal operations will resume']
  };
  
  return recommendationMap[status] || [];
}

/**
 * Generates a mock stack trace for error testing scenarios.
 * @private
 * @param {string} errorName - Name of the error for stack trace generation
 * @returns {string} Mock stack trace string
 */
function generateMockStackTrace(errorName) {
  return [
    `${errorName}: Test error for server testing`,
    '    at createServerErrorFixture (/test/helpers/server-test-helpers.js:123:45)',
    '    at Object.<anonymous> (/test/unit/server.test.js:567:89)',
    '    at Promise.then.completed (/node_modules/jest/index.js:12:34)',
    '    at new Promise (<anonymous>)',
    '    at Module._load (internal/modules/cjs/loader.js:78:90)'
  ].join('\n');
}

/**
 * Performs deep merge of configuration objects for fixture customization.
 * @private
 * @param {Object} base - Base configuration object
 * @param {Object} overrides - Override configuration object
 * @returns {Object} Merged configuration object
 */
function mergeConfig(base, overrides) {
  const result = { ...base };
  
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeConfig(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// ============================================================================
// DEFAULT EXPORT - Comprehensive server fixtures utility object
// ============================================================================

/**
 * Default export object containing all server testing utilities organized by category.
 * Provides comprehensive access to configuration, health, error, PM2, performance, 
 * and lifecycle fixtures with utility functions for server module testing.
 * 
 * @default
 */
const serverFixtures = {
  config: CONFIG_VARIATIONS,
  health: HEALTH_STATUS_FIXTURES,
  errors: ERROR_FIXTURES,
  pm2: PM2_CONFIG_FIXTURES,
  performance: PERFORMANCE_METRICS_FIXTURES,
  lifecycle: SERVER_LIFECYCLE_FIXTURES,
  utilities: {
    createServerFixture,
    createHealthCheckFixture,
    createServerErrorFixture,
    validateServerFixture,
    initializeServerFixtures,
    cleanupServerFixtures
  }
};

export default serverFixtures;