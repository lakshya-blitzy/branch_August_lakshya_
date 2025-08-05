/**
 * @fileoverview Comprehensive Server Test Fixtures for Node.js Tutorial Project
 * @description Production-ready test fixtures specifically for server.js testing including
 * configuration variations, health status responses, error scenarios, performance metrics,
 * PM2 configurations, and startup/shutdown mocks. Supports comprehensive testing of all
 * 11 exported functions from server.js with realistic data and edge cases.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive server lifecycle testing patterns
 * - Showcases production-ready test fixture organization and structure
 * - Illustrates PM2 cluster mode testing with realistic configuration data
 * - Provides security testing fixtures for Helmet.js integration validation
 * - Teaches performance testing with resource monitoring and benchmarking
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with Active LTS support for server environment testing
 * - Express.js v5.1.0 server lifecycle and configuration testing fixtures
 * - PM2 v6.0.8 cluster mode and process management testing scenarios
 * - Helmet.js v8.1.0 security configuration and header validation fixtures
 * - Modern ES Modules with comprehensive server state management patterns
 * 
 * Test Coverage:
 * - All 11 exported server.js functions with comprehensive test scenarios
 * - Configuration variations for parameterized testing (minimal, complete, invalid, edge cases)
 * - Health monitoring test scenarios (healthy, degraded, critical, starting, shutdown, maintenance)
 * - Error scenario fixtures (system errors, custom errors, edge case errors, startup errors, shutdown errors, timeout errors)
 * - PM2 configuration fixtures (cluster mode, fork mode, zero downtime, load balancing, health checks, restart policies)
 * - Performance metrics fixtures (startup time, memory usage, CPU usage, response time, request count, error rate, uptime)
 * - Server lifecycle fixtures (startup sequence, shutdown sequence, graceful shutdown, force shutdown, state transitions, signal handlers)
 */

// External imports from Node.js standard library
import { randomBytes } from 'crypto'; // Generate secure random bytes for server test tokens, correlation IDs, and fixture data
import { freemem } from 'os'; // System memory information for server health monitoring and performance testing fixtures

/**
 * Configuration Variations for Parameterized Server Testing
 * @description Comprehensive configuration objects covering minimal, complete, invalid, 
 * and edge case scenarios for testing server initialization and validation functions
 */
export const CONFIG_VARIATIONS = {
  /**
   * Minimal configuration for basic server startup testing
   * @description Tests server startup with minimal required configuration parameters
   */
  minimal: {
    server: {
      port: 3000,
      host: 'localhost'
    },
    environment: 'development',
    metadata: {
      name: 'minimal-config',
      description: 'Minimal server configuration for basic functionality testing',
      testScenarios: ['startup', 'shutdown', 'basic-health-check']
    }
  },

  /**
   * Complete production-ready configuration for comprehensive testing
   * @description Full configuration with all optional parameters for production scenario testing
   */
  complete: {
    server: {
      port: 3000,
      host: '0.0.0.0',
      protocol: 'http',
      timeout: 30000,
      keepAliveTimeout: 60000,
      requestTimeout: 10000
    },
    security: {
      helmet: {
        enabled: true,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"]
          }
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      },
      cors: {
        enabled: true,
        origin: ['http://localhost:3000'],
        methods: ['GET', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false
      },
      rateLimit: {
        enabled: true,
        windowMs: 900000, // 15 minutes
        max: 1000, // requests per window
        message: 'Too many requests from this IP'
      }
    },
    pm2: {
      enabled: true,
      instances: 'max',
      execMode: 'cluster',
      maxMemoryRestart: '1G',
      autorestart: true,
      watch: false,
      minUptime: '10s',
      maxRestarts: 10
    },
    monitoring: {
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        path: '/health'
      },
      metrics: {
        enabled: true,
        collectInterval: 10000,
        memoryThreshold: 1073741824, // 1GB
        cpuThreshold: 80
      }
    },
    logging: {
      level: 'info',
      format: 'json',
      file: {
        enabled: true,
        path: './logs',
        maxFiles: 10,
        maxSize: '10m'
      }
    },
    environment: 'production',
    metadata: {
      name: 'complete-config',
      description: 'Complete production-ready server configuration with all features enabled',
      testScenarios: ['full-startup', 'cluster-mode', 'health-monitoring', 'graceful-shutdown', 'security-validation', 'performance-testing']
    }
  },

  /**
   * Invalid configuration for error handling testing
   * @description Configuration with invalid values to test error validation and handling
   */
  invalid: {
    server: {
      port: 'invalid-port',
      host: 12345, // invalid host type
      timeout: -1000 // invalid negative timeout
    },
    security: {
      helmet: 'invalid-helmet-config',
      cors: {
        origin: 12345 // invalid origin type
      }
    },
    pm2: {
      instances: 'invalid-instances',
      maxMemoryRestart: 'invalid-memory'
    },
    environment: 'invalid-environment',
    metadata: {
      name: 'invalid-config',
      description: 'Invalid configuration for testing error handling and validation',
      testScenarios: ['validation-errors', 'startup-failures', 'configuration-rejection']
    }
  },

  /**
   * Edge case configuration for boundary testing
   * @description Configuration with boundary values and edge cases
   */
  edgeCases: {
    server: {
      port: 65535, // maximum valid port
      host: '::1', // IPv6 loopback
      timeout: 1, // minimum timeout
      keepAliveTimeout: 2147483647 // maximum 32-bit integer
    },
    security: {
      helmet: {
        enabled: true,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'none'"] // strictest CSP
          }
        }
      },
      rateLimit: {
        windowMs: 1000, // very short window
        max: 1 // single request per window
      }
    },
    pm2: {
      instances: 1, // single instance
      execMode: 'fork',
      maxMemoryRestart: '1M' // very low memory limit
    },
    environment: 'test',
    metadata: {
      name: 'edge-cases-config',
      description: 'Edge case configuration for boundary testing and extreme scenarios',
      testScenarios: ['boundary-values', 'extreme-limits', 'edge-case-validation']
    }
  },

  /**
   * Production configuration for production scenario testing
   * @description Realistic production configuration for comprehensive production testing
   */
  production: {
    server: {
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
      protocol: 'http',
      timeout: 30000
    },
    security: {
      helmet: {
        enabled: true,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"]
          }
        }
      },
      cors: {
        enabled: false // Disabled in production
      }
    },
    pm2: {
      enabled: true,
      instances: 'max',
      execMode: 'cluster',
      maxMemoryRestart: '2G'
    },
    environment: 'production',
    metadata: {
      name: 'production-config',
      description: 'Production configuration for realistic production environment testing',
      testScenarios: ['production-startup', 'production-monitoring', 'production-security']
    }
  },

  /**
   * Development configuration for development environment testing
   * @description Development-friendly configuration with debugging and monitoring features
   */
  development: {
    server: {
      port: 3000,
      host: 'localhost'
    },
    security: {
      helmet: {
        enabled: true,
        contentSecurityPolicy: {
          reportOnly: true // Development CSP reporting
        }
      },
      cors: {
        enabled: true,
        origin: true // Allow all origins in development
      }
    },
    pm2: {
      enabled: false // No PM2 in development
    },
    monitoring: {
      healthCheck: {
        enabled: true,
        interval: 10000 // More frequent in development
      }
    },
    logging: {
      level: 'debug'
    },
    environment: 'development',
    metadata: {
      name: 'development-config',
      description: 'Development configuration with debugging and monitoring features',
      testScenarios: ['dev-startup', 'hot-reload', 'debug-logging']
    }
  },

  /**
   * Testing configuration for test environment scenarios
   * @description Test-specific configuration for automated testing environments
   */
  testing: {
    server: {
      port: 0, // Random available port for testing
      host: 'localhost'
    },
    security: {
      helmet: {
        enabled: true
      },
      cors: {
        enabled: true
      }
    },
    pm2: {
      enabled: false // No PM2 in testing
    },
    monitoring: {
      healthCheck: {
        enabled: true,
        interval: 5000 // Faster testing
      }
    },
    logging: {
      level: 'silent' // Minimal logging in tests
    },
    environment: 'test',
    metadata: {
      name: 'testing-config',
      description: 'Test-specific configuration for automated testing environments',
      testScenarios: ['test-isolation', 'fast-startup', 'minimal-logging']
    }
  }
};

/**
 * Health Status Response Fixtures for Health Monitoring Testing
 * @description Comprehensive health status responses covering all possible server health states
 * for testing health monitoring, load balancer integration, and operational monitoring
 */
export const HEALTH_STATUS_FIXTURES = {
  /**
   * Healthy server status for positive health check testing
   * @description Server operating normally with all systems functional
   */
  healthy: {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: 3600.123, // 1 hour uptime
    environment: 'production',
    version: '1.0.0',
    pid: 12345,
    memory: {
      used: Math.floor(freemem() * 0.3), // 30% of available memory
      total: freemem(),
      percentage: 30
    },
    cpu: {
      usage: 25.5,
      loadAverage: [0.5, 0.3, 0.2]
    },
    cluster: {
      enabled: true,
      instances: 4,
      workerId: 1
    },
    requests: {
      total: 150000,
      perSecond: 42.3,
      errors: 12,
      errorRate: 0.008
    },
    metadata: {
      nodeVersion: 'v22.0.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'server-01'
    }
  },

  /**
   * Degraded server status for warning condition testing
   * @description Server experiencing performance issues but still operational
   */
  degraded: {
    status: 'degraded',
    timestamp: new Date().toISOString(),
    uptime: 7200.456, // 2 hours uptime
    environment: 'production',
    version: '1.0.0',
    pid: 12346,
    memory: {
      used: Math.floor(freemem() * 0.75), // 75% memory usage - concerning
      total: freemem(),
      percentage: 75
    },
    cpu: {
      usage: 85.2, // High CPU usage
      loadAverage: [2.1, 1.8, 1.5]
    },
    cluster: {
      enabled: true,
      instances: 4,
      workerId: 2,
      failedInstances: 1
    },
    requests: {
      total: 320000,
      perSecond: 23.1, // Reduced throughput
      errors: 450,
      errorRate: 0.14 // Elevated error rate
    },
    warnings: [
      'High memory usage detected',
      'CPU usage above threshold',
      'One cluster instance failed'
    ],
    metadata: {
      nodeVersion: 'v22.0.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'server-02'
    }
  },

  /**
   * Critical server status for emergency condition testing
   * @description Server in critical state, barely operational or failing
   */
  critical: {
    status: 'critical',
    timestamp: new Date().toISOString(),
    uptime: 180.789, // Short uptime, recent restart
    environment: 'production',
    version: '1.0.0',
    pid: 12347,
    memory: {
      used: Math.floor(freemem() * 0.95), // 95% memory usage - critical
      total: freemem(),
      percentage: 95
    },
    cpu: {
      usage: 98.7, // Near maximum CPU
      loadAverage: [5.2, 4.8, 4.1]
    },
    cluster: {
      enabled: true,
      instances: 4,
      workerId: 3,
      failedInstances: 3,
      availableInstances: 1
    },
    requests: {
      total: 5000,
      perSecond: 1.2, // Very low throughput
      errors: 1200,
      errorRate: 0.24 // High error rate
    },
    errors: [
      'Memory usage critical',
      'CPU overload detected',
      'Multiple cluster instances failed',
      'Database connection errors',
      'Disk space low'
    ],
    metadata: {
      nodeVersion: 'v22.0.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'server-03'
    }
  },

  /**
   * Starting server status for startup testing
   * @description Server in startup phase, not yet fully operational
   */
  starting: {
    status: 'starting',
    timestamp: new Date().toISOString(),
    uptime: 5.123, // Very short uptime
    environment: 'production',
    version: '1.0.0',
    pid: 12348,
    memory: {
      used: Math.floor(freemem() * 0.15), // Low initial memory usage
      total: freemem(),
      percentage: 15
    },
    cpu: {
      usage: 45.3, // Moderate CPU during startup
      loadAverage: [0.8, 0.4, 0.2]
    },
    cluster: {
      enabled: true,
      instances: 4,
      workerId: 4,
      initializing: true,
      readyInstances: 1
    },
    requests: {
      total: 0,
      perSecond: 0,
      errors: 0,
      errorRate: 0
    },
    startupProgress: {
      configurationLoaded: true,
      databaseConnected: false,
      routesRegistered: true,
      middlewareLoaded: true,
      healthCheckEnabled: false
    },
    metadata: {
      nodeVersion: 'v22.0.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'server-04'
    }
  },

  /**
   * Shutting down server status for shutdown testing
   * @description Server in graceful shutdown process
   */
  shutting_down: {
    status: 'shutting_down',
    timestamp: new Date().toISOString(),
    uptime: 86400.567, // 24 hours uptime before shutdown
    environment: 'production',
    version: '1.0.0',
    pid: 12349,
    memory: {
      used: Math.floor(freemem() * 0.40),
      total: freemem(),
      percentage: 40
    },
    cpu: {
      usage: 15.8, // Low CPU during shutdown
      loadAverage: [0.3, 0.2, 0.1]
    },
    cluster: {
      enabled: true,
      instances: 4,
      workerId: 1,
      shuttingDown: true,
      activeConnections: 23
    },
    requests: {
      total: 2450000,
      perSecond: 5.2, // Reduced load during shutdown
      errors: 890,
      errorRate: 0.036
    },
    shutdownProgress: {
      newConnectionsRejected: true,
      activeConnectionsDraining: true,
      gracefulTimeout: 30000,
      remainingTime: 15000
    },
    metadata: {
      nodeVersion: 'v22.0.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'server-05'
    }
  },

  /**
   * Maintenance server status for maintenance mode testing
   * @description Server in maintenance mode, limited functionality
   */
  maintenance: {
    status: 'maintenance',
    timestamp: new Date().toISOString(),
    uptime: 1800.234, // 30 minutes in maintenance
    environment: 'production',
    version: '1.0.0',
    pid: 12350,
    memory: {
      used: Math.floor(freemem() * 0.20),
      total: freemem(),
      percentage: 20
    },
    cpu: {
      usage: 10.5, // Minimal CPU in maintenance
      loadAverage: [0.1, 0.1, 0.1]
    },
    cluster: {
      enabled: false, // Single instance during maintenance
      instances: 1,
      workerId: null,
      maintenanceMode: true
    },
    requests: {
      total: 50,
      perSecond: 0.1, // Very low request rate
      errors: 5,
      errorRate: 0.1
    },
    maintenanceInfo: {
      reason: 'Scheduled system update',
      estimatedDuration: 3600000, // 1 hour
      remainingTime: 1800000, // 30 minutes
      allowedOperations: ['health-check', 'admin-access']
    },
    metadata: {
      nodeVersion: 'v22.0.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'server-maintenance'
    }
  }
};

/**
 * Error Scenario Fixtures for Comprehensive Error Testing
 * @description Complete collection of error scenarios covering system errors, custom errors,
 * edge case errors, startup errors, shutdown errors, and timeout errors for testing
 * error handling, recovery procedures, and failure modes
 */
export const ERROR_FIXTURES = {
  /**
   * System-level errors for operating system and network failure testing
   * @description Common system errors that can occur during server operation
   */
  systemErrors: [
    {
      code: 'EADDRINUSE',
      message: 'Address already in use',
      description: 'Port is already bound to another process',
      httpStatus: 500,
      recovery: 'Try a different port or stop the conflicting process',
      category: 'port-binding',
      severity: 'critical',
      details: {
        port: 3000,
        host: 'localhost',
        pid: process.pid,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['concurrent-startup', 'port-conflict', 'multiple-instances']
    },
    {
      code: 'EACCES',
      message: 'Permission denied',
      description: 'Insufficient permissions to bind to port or access resource',
      httpStatus: 500,
      recovery: 'Run with appropriate permissions or use a different port',
      category: 'permission',
      severity: 'critical',
      details: {
        resource: 'port 80',
        requiredPermission: 'root',
        currentUser: process.getuid?.() || 'unknown',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['privileged-port', 'permission-denied', 'security-restrictions']
    },
    {
      code: 'ENOTFOUND',
      message: 'Host not found',
      description: 'Unable to resolve hostname',
      httpStatus: 500,
      recovery: 'Check hostname and network connectivity',
      category: 'network',
      severity: 'high',
      details: {
        hostname: 'invalid.example.com',
        dnsServer: '8.8.8.8',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['dns-failure', 'network-isolation', 'invalid-hostname']
    },
    {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
      description: 'Remote service refused the connection',
      httpStatus: 503,
      recovery: 'Check if the remote service is running and accessible',
      category: 'connection',
      severity: 'high',
      details: {
        remoteHost: 'database.example.com',
        remotePort: 5432,
        attempts: 3,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['service-unavailable', 'database-down', 'external-dependency-failure']
    },
    {
      code: 'ETIMEDOUT',
      message: 'Operation timed out',
      description: 'Network operation exceeded timeout limit',
      httpStatus: 504,
      recovery: 'Increase timeout or check network latency',
      category: 'timeout',
      severity: 'medium',
      details: {
        operation: 'database query',
        timeout: 30000,
        elapsed: 35000,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['slow-network', 'timeout-handling', 'performance-degradation']
    },
    {
      code: 'EMFILE',
      message: 'Too many open files',
      description: 'File descriptor limit exceeded',
      httpStatus: 500,
      recovery: 'Increase file descriptor limit or close unused files',
      category: 'resource',
      severity: 'high',
      details: {
        currentFds: 1024,
        maxFds: 1024,
        processId: process.pid,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['resource-exhaustion', 'file-descriptor-leak', 'high-concurrency']
    },
    {
      code: 'ENOMEM',
      message: 'Out of memory',
      description: 'Insufficient system memory available',
      httpStatus: 500,
      recovery: 'Free memory or restart the process',
      category: 'memory',
      severity: 'critical',
      details: {
        totalMemory: freemem(),
        usedMemory: process.memoryUsage().heapUsed,
        threshold: freemem() * 0.9,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['memory-leak', 'memory-pressure', 'out-of-memory']
    },
    {
      code: 'ENOSPC',
      message: 'No space left on device',
      description: 'Disk space exhausted',
      httpStatus: 500,
      recovery: 'Free disk space or expand storage',
      category: 'storage',
      severity: 'critical',
      details: {
        device: '/dev/sda1',
        availableSpace: 0,
        requiredSpace: 1048576,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['disk-full', 'log-rotation-failure', 'storage-exhaustion']
    }
  ],

  /**
   * Custom application errors for business logic and validation testing
   * @description Application-specific errors for testing custom error handling
   */
  customErrors: [
    {
      code: 'CONFIG_VALIDATION_ERROR',
      message: 'Configuration validation failed',
      description: 'Server configuration contains invalid or missing parameters',
      httpStatus: 500,
      recovery: 'Check configuration file and fix validation errors',
      category: 'validation',
      severity: 'critical',
      details: {
        configFile: 'config/production.json',
        validationErrors: [
          'Missing required field: server.port',
          'Invalid value for security.helmet.enabled: must be boolean',
          'PM2 instances must be number or "max"'
        ],
        timestamp: new Date().toISOString()
      },
      testScenarios: ['invalid-config', 'missing-required-fields', 'type-validation']
    },
    {
      code: 'STARTUP_TIMEOUT',
      message: 'Server startup timeout exceeded',
      description: 'Server failed to start within the specified timeout period',
      httpStatus: 500,
      recovery: 'Increase startup timeout or fix slow initialization',
      category: 'startup',
      severity: 'high',
      details: {
        timeoutMs: 30000,
        elapsedMs: 35000,
        lastStage: 'database-connection',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['slow-startup', 'timeout-handling', 'initialization-failure']
    },
    {
      code: 'HEALTH_CHECK_FAILURE',
      message: 'Health check validation failed',
      description: 'Server health check returned unhealthy status',
      httpStatus: 503,
      recovery: 'Check server components and dependencies',
      category: 'health',
      severity: 'high',
      details: {
        healthEndpoint: '/health',
        failedChecks: ['database', 'external-api'],
        lastSuccessful: new Date(Date.now() - 300000).toISOString(),
        timestamp: new Date().toISOString()
      },
      testScenarios: ['health-degradation', 'dependency-failure', 'monitoring-alerts']
    },
    {
      code: 'PM2_CLUSTER_ERROR',
      message: 'PM2 cluster configuration error',
      description: 'Error in PM2 cluster mode configuration or operation',
      httpStatus: 500,
      recovery: 'Check PM2 configuration and cluster settings',
      category: 'cluster',
      severity: 'high',
      details: {
        clusterMode: true,
        instances: 'max',
        error: 'Failed to spawn worker process',
        workerId: 2,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['cluster-failure', 'worker-crash', 'load-balancing-error']
    },
    {
      code: 'GRACEFUL_SHUTDOWN_TIMEOUT',
      message: 'Graceful shutdown timeout exceeded',
      description: 'Server failed to shutdown gracefully within timeout',
      httpStatus: 500,
      recovery: 'Force shutdown or increase graceful shutdown timeout',
      category: 'shutdown',
      severity: 'medium',
      details: {
        gracefulTimeoutMs: 30000,
        elapsedMs: 35000,
        activeConnections: 15,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['shutdown-timeout', 'connection-draining', 'force-shutdown']
    }
  ],

  /**
   * Edge case errors for boundary condition and extreme scenario testing
   * @description Unusual or extreme error conditions for comprehensive testing
   */
  edgeCaseErrors: [
    {
      code: 'MAX_LISTENERS_EXCEEDED',
      message: 'Maximum number of event listeners exceeded',
      description: 'EventEmitter listener limit reached',
      httpStatus: 500,
      recovery: 'Check for event listener leaks',
      category: 'memory',
      severity: 'medium',
      details: {
        eventName: 'connection',
        maxListeners: 10,
        currentListeners: 15,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['event-leak', 'listener-overflow', 'memory-management']
    },
    {
      code: 'INVALID_PORT_RANGE',
      message: 'Port number out of valid range',
      description: 'Specified port number is outside valid range (1-65535)',
      httpStatus: 500,
      recovery: 'Use a valid port number between 1 and 65535',
      category: 'validation',
      severity: 'high',
      details: {
        requestedPort: 70000,
        validRange: '1-65535',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['port-validation', 'boundary-testing', 'input-validation']
    },
    {
      code: 'RAPID_RESTART_LOOP',
      message: 'Rapid restart loop detected',
      description: 'Server restarting too frequently, potential configuration issue',
      httpStatus: 500,
      recovery: 'Check configuration and fix underlying issues',
      category: 'stability',
      severity: 'critical',
      details: {
        restartCount: 10,
        timeWindow: 60000,
        threshold: 5,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['restart-loop', 'configuration-error', 'stability-testing']
    },
    {
      code: 'MEMORY_PRESSURE_WARNING',
      message: 'System under memory pressure',
      description: 'Available system memory below warning threshold',
      httpStatus: 503,
      recovery: 'Monitor memory usage and consider scaling',
      category: 'performance',
      severity: 'medium',
      details: {
        totalMemory: freemem(),
        availableMemory: Math.floor(freemem() * 0.1),
        threshold: Math.floor(freemem() * 0.2),
        timestamp: new Date().toISOString()
      },
      testScenarios: ['memory-pressure', 'performance-degradation', 'resource-monitoring']
    }
  ],

  /**
   * Startup-specific errors for server initialization testing
   * @description Errors that occur during server startup and initialization
   */
  startupErrors: [
    {
      code: 'MIDDLEWARE_INITIALIZATION_ERROR',
      message: 'Failed to initialize middleware',
      description: 'Error occurred while setting up Express middleware',
      httpStatus: 500,
      recovery: 'Check middleware configuration and dependencies',
      category: 'initialization',
      severity: 'critical',
      details: {
        middleware: 'helmet',
        stage: 'security-setup',
        error: 'Invalid CSP configuration',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['middleware-error', 'initialization-failure', 'dependency-error']
    },
    {
      code: 'ROUTE_REGISTRATION_ERROR',
      message: 'Failed to register routes',
      description: 'Error occurred while registering Express routes',
      httpStatus: 500,
      recovery: 'Check route definitions and handlers',
      category: 'routing',
      severity: 'critical',
      details: {
        route: '/api/health',
        method: 'GET',
        error: 'Handler function not defined',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['route-error', 'handler-missing', 'registration-failure']
    },
    {
      code: 'ENVIRONMENT_VALIDATION_ERROR',
      message: 'Environment validation failed',
      description: 'Required environment variables missing or invalid',
      httpStatus: 500,
      recovery: 'Set required environment variables',
      category: 'environment',
      severity: 'critical',
      details: {
        missingVars: ['NODE_ENV', 'PORT'],
        invalidVars: ['LOG_LEVEL'],
        timestamp: new Date().toISOString()
      },
      testScenarios: ['env-validation', 'missing-variables', 'configuration-error']
    }
  ],

  /**
   * Shutdown-specific errors for server termination testing
   * @description Errors that occur during server shutdown and cleanup
   */
  shutdownErrors: [
    {
      code: 'CONNECTION_DRAIN_ERROR',
      message: 'Failed to drain active connections',
      description: 'Error occurred while draining connections during shutdown',
      httpStatus: 500,
      recovery: 'Force close connections or increase drain timeout',
      category: 'shutdown',
      severity: 'medium',
      details: {
        activeConnections: 25,
        drainTimeout: 30000,
        connectionErrors: 3,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['shutdown-drain', 'connection-cleanup', 'graceful-termination']
    },
    {
      code: 'CLEANUP_RESOURCE_ERROR',
      message: 'Failed to cleanup resources',
      description: 'Error occurred while cleaning up resources during shutdown',
      httpStatus: 500,
      recovery: 'Manual resource cleanup may be required',
      category: 'cleanup',
      severity: 'low',
      details: {
        resource: 'monitoring-intervals',
        errorCount: 2,
        timestamp: new Date().toISOString()
      },
      testScenarios: ['resource-cleanup', 'shutdown-error', 'memory-management']
    }
  ],

  /**
   * Timeout-specific errors for timing and performance testing
   * @description Errors related to various timeout scenarios
   */
  timeoutErrors: [
    {
      code: 'REQUEST_TIMEOUT',
      message: 'Request processing timeout',
      description: 'Request took longer than configured timeout',
      httpStatus: 408,
      recovery: 'Optimize request processing or increase timeout',
      category: 'performance',
      severity: 'medium',
      details: {
        requestId: randomBytes(8).toString('hex'),
        timeout: 10000,
        elapsed: 12000,
        endpoint: '/api/slow-operation',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['request-timeout', 'performance-testing', 'slow-operations']
    },
    {
      code: 'HEALTH_CHECK_TIMEOUT',
      message: 'Health check timeout',
      description: 'Health check request exceeded timeout limit',
      httpStatus: 503,
      recovery: 'Check health check implementation and dependencies',
      category: 'monitoring',
      severity: 'high',
      details: {
        healthCheckTimeout: 5000,
        elapsed: 6000,
        endpoint: '/health',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['health-timeout', 'monitoring-failure', 'dependency-slow']
    },
    {
      code: 'KEEPALIVE_TIMEOUT',
      message: 'Keep-alive connection timeout',
      description: 'Keep-alive connection exceeded timeout limit',
      httpStatus: 408,
      recovery: 'Adjust keep-alive timeout settings',
      category: 'connection',
      severity: 'low',
      details: {
        keepAliveTimeout: 60000,
        connectionAge: 65000,
        clientIP: '192.168.1.100',
        timestamp: new Date().toISOString()
      },
      testScenarios: ['keepalive-timeout', 'connection-management', 'client-behavior']
    }
  ]
};

/**
 * PM2 Configuration Fixtures for Process Management Testing
 * @description Comprehensive PM2 configurations covering cluster mode, fork mode,
 * zero-downtime deployments, load balancing, health checks, and restart policies
 * for testing PM2 integration and process management features
 */
export const PM2_CONFIG_FIXTURES = {
  /**
   * Cluster mode configuration for multi-process testing
   * @description PM2 cluster mode setup for load distribution and fault tolerance testing
   */
  clusterMode: {
    name: 'nodejs-tutorial-cluster',
    script: 'server.js',
    exec_mode: 'cluster',
    instances: 'max', // Use all available CPU cores
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      CLUSTER_MODE: 'true'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'debug'
    },
    log_file: './logs/pm2-cluster.log',
    error_file: './logs/pm2-cluster-error.log',
    out_file: './logs/pm2-cluster-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    kill_timeout: 5000,
    listen_timeout: 8000,
    shutdown_with_message: true,
    wait_ready: true,
    health_check: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
      timeout: 5000,
      max_failures: 3
    },
    monitoring: {
      pmx: true,
      http: true,
      https: false,
      port: 3001
    },
    testScenarios: [
      'cluster-startup',
      'worker-distribution',
      'load-balancing',
      'worker-restart',
      'cluster-health'
    ]
  },

  /**
   * Fork mode configuration for single-process testing
   * @description PM2 fork mode setup for simple process management testing
   */
  forkMode: {
    name: 'nodejs-tutorial-fork',
    script: 'server.js',
    exec_mode: 'fork',
    instances: 1,
    max_memory_restart: '512M',
    node_args: '--max-old-space-size=512',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      CLUSTER_MODE: 'false'
    },
    log_file: './logs/pm2-fork.log',
    error_file: './logs/pm2-fork-error.log',
    out_file: './logs/pm2-fork-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: false,
    autorestart: true,
    watch: true,
    watch_delay: 1000,
    ignore_watch: ['node_modules', 'logs', 'test'],
    max_restarts: 5,
    min_uptime: '5s',
    restart_delay: 2000,
    kill_timeout: 3000,
    listen_timeout: 5000,
    testScenarios: [
      'fork-startup',
      'single-process',
      'file-watching',
      'development-mode',
      'simple-restart'
    ]
  },

  /**
   * Zero-downtime deployment configuration for deployment testing
   * @description PM2 configuration optimized for zero-downtime deployment scenarios
   */
  zeroDowntime: {
    name: 'nodejs-tutorial-zero-downtime',
    script: 'server.js',
    exec_mode: 'cluster',
    instances: 4,
    max_memory_restart: '1G',
    increment_var: 'PORT',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    deploy: {
      production: {
        user: 'deploy',
        host: '192.168.1.100',
        ref: 'origin/main',
        repo: 'git@github.com:example/nodejs-tutorial.git',
        path: '/var/www/production',
        'pre-deploy-local': '',
        'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
        'pre-setup': ''
      }
    },
    graceful_timeout: 30000,
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 10000,
    shutdown_with_message: true,
    overlapping: false,
    autorestart: true,
    max_restarts: 3,
    min_uptime: '30s',
    restart_delay: 5000,
    health_check: {
      enabled: true,
      endpoint: '/health',
      interval: 15000,
      timeout: 3000,
      max_failures: 2
    },
    deployment_strategy: {
      type: 'rolling',
      batch_size: 1,
      delay_between_batches: 5000,
      health_check_delay: 10000
    },
    testScenarios: [
      'zero-downtime-deploy',
      'rolling-restart',
      'graceful-shutdown',
      'deployment-health',
      'connection-draining'
    ]
  },

  /**
   * Load balancing configuration for traffic distribution testing
   * @description PM2 setup optimized for load balancing and traffic distribution
   */
  loadBalancing: {
    name: 'nodejs-tutorial-lb',
    script: 'server.js',
    exec_mode: 'cluster',
    instances: 8, // Specific number for load testing
    max_memory_restart: '800M',
    instance_var: 'INSTANCE_ID',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      CLUSTER_MODE: 'true',
      LOAD_BALANCER: 'true'
    },
    load_balancing: {
      strategy: 'round_robin',
      sticky_sessions: false,
      session_affinity: false
    },
    performance: {
      max_concurrent_requests: 1000,
      request_timeout: 30000,
      keep_alive_timeout: 60000
    },
    scaling: {
      auto_scaling: true,
      min_instances: 2,
      max_instances: 16,
      cpu_threshold: 80,
      memory_threshold: 80,
      scale_up_delay: 30000,
      scale_down_delay: 60000
    },
    health_check: {
      enabled: true,
      endpoint: '/health',
      interval: 10000,
      timeout: 2000,
      max_failures: 2,
      recovery_time: 30000
    },
    monitoring: {
      cpu_monitoring: true,
      memory_monitoring: true,
      request_monitoring: true,
      error_monitoring: true
    },
    testScenarios: [
      'load-distribution',
      'auto-scaling',
      'performance-tuning',
      'traffic-balancing',
      'resource-optimization'
    ]
  },

  /**
   * Health check configuration for monitoring testing
   * @description PM2 configuration focused on health checking and monitoring
   */
  healthChecks: {
    name: 'nodejs-tutorial-health',
    script: 'server.js',
    exec_mode: 'cluster',
    instances: 2,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HEALTH_CHECK_ENABLED: 'true'
    },
    health_check: {
      enabled: true,
      endpoint: '/health',
      interval: 5000, // Frequent health checks
      timeout: 2000,
      max_failures: 1, // Strict failure tolerance
      retry_delay: 1000,
      success_threshold: 2,
      failure_threshold: 3
    },
    custom_health_checks: [
      {
        name: 'database',
        endpoint: '/health/database',
        interval: 10000,
        timeout: 3000,
        critical: true
      },
      {
        name: 'external_api',
        endpoint: '/health/external',
        interval: 30000,
        timeout: 5000,
        critical: false
      },
      {
        name: 'memory',
        type: 'memory',
        threshold: 85,
        interval: 15000,
        critical: true
      },
      {
        name: 'cpu',
        type: 'cpu',
        threshold: 90,
        interval: 15000,
        critical: true
      }
    ],
    alerts: {
      enabled: true,
      webhook_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      email_notifications: true,
      sms_notifications: false
    },
    recovery: {
      auto_restart: true,
      restart_delay: 5000,
      max_restart_attempts: 5,
      escalation_delay: 30000
    },
    testScenarios: [
      'health-monitoring',
      'failure-detection',
      'auto-recovery',
      'alert-system',
      'critical-threshold'
    ]
  },

  /**
   * Restart policies configuration for restart behavior testing
   * @description PM2 configuration with various restart policies and strategies
   */
  restartPolicies: {
    name: 'nodejs-tutorial-restart',
    script: 'server.js',
    exec_mode: 'cluster',
    instances: 3,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    restart_policies: {
      // Exponential backoff restart policy
      exponential_backoff: {
        enabled: true,
        initial_delay: 1000,
        max_delay: 60000,
        multiplier: 2,
        max_attempts: 10
      },
      // Memory-based restart policy
      memory_restart: {
        enabled: true,
        threshold: '1G',
        check_interval: 30000,
        grace_period: 10000
      },
      // Time-based restart policy
      scheduled_restart: {
        enabled: true,
        cron: '0 3 * * *', // Daily at 3 AM
        timezone: 'UTC'
      },
      // Error-based restart policy
      error_restart: {
        enabled: true,
        error_threshold: 10,
        time_window: 300000, // 5 minutes
        restart_delay: 5000
      },
      // CPU-based restart policy
      cpu_restart: {
        enabled: true,
        threshold: 95,
        duration: 60000, // 1 minute
        check_interval: 10000
      }
    },
    restart_constraints: {
      max_restarts: 20,
      restart_window: 3600000, // 1 hour
      min_uptime: '30s',
      restart_delay: 3000,
      kill_timeout: 8000,
      listen_timeout: 10000
    },
    restart_hooks: {
      pre_restart: 'echo "Preparing for restart"',
      post_restart: 'echo "Restart completed"',
      restart_failed: 'echo "Restart failed"'
    },
    testScenarios: [
      'restart-policies',
      'exponential-backoff',
      'scheduled-restart',
      'error-handling',
      'resource-monitoring'
    ]
  }
};

/**
 * Performance Metrics Fixtures for Performance Testing and Monitoring
 * @description Comprehensive performance metrics covering startup time, memory usage,
 * CPU usage, response time, request count, error rate, and uptime for testing
 * performance monitoring, benchmarking, and SLA validation
 */
export const PERFORMANCE_METRICS_FIXTURES = {
  /**
   * Startup time metrics for server initialization performance testing
   * @description Metrics tracking various phases of server startup process
   */
  startupTime: {
    total: 2150, // Total startup time in milliseconds
    phases: {
      initialization: {
        duration: 150,
        description: 'Basic Node.js and module initialization',
        start: 0,
        end: 150,
        operations: [
          'Module loading',
          'Global variable setup',
          'Process event handler registration'
        ]
      },
      configuration: {
        duration: 300,
        description: 'Configuration loading and validation',
        start: 150,
        end: 450,
        operations: [
          'Environment variable parsing',
          'Configuration file loading',
          'Configuration validation',
          'Default value assignment'
        ]
      },
      middleware: {
        duration: 450,
        description: 'Express middleware setup and configuration',
        start: 450,
        end: 900,
        operations: [
          'Express app creation',
          'Security middleware (Helmet)',
          'CORS configuration',
          'Body parser setup',
          'Static file serving',
          'Rate limiting setup'
        ]
      },
      routes: {
        duration: 200,
        description: 'Route registration and handler setup',
        start: 900,
        end: 1100,
        operations: [
          'API route registration',
          'Health check endpoint',
          'Static routes',
          'Error handler registration'
        ]
      },
      services: {
        duration: 400,
        description: 'Service initialization and dependency setup',
        start: 1100,
        end: 1500,
        operations: [
          'Database connection',
          'External API clients',
          'Cache initialization',
          'Monitoring setup'
        ]
      },
      server_start: {
        duration: 500,
        description: 'HTTP server startup and port binding',
        start: 1500,
        end: 2000,
        operations: [
          'HTTP server creation',
          'Port binding',
          'PM2 cluster setup',
          'Health monitoring start'
        ]
      },
      post_startup: {
        duration: 150,
        description: 'Post-startup validation and final setup',
        start: 2000,
        end: 2150,
        operations: [
          'Health check validation',
          'Startup notification',
          'Readiness signal'
        ]
      }
    },
    benchmarks: {
      excellent: '<1000ms',
      good: '1000-2000ms',
      acceptable: '2000-5000ms',
      poor: '>5000ms'
    },
    environment_factors: {
      cpu_cores: 4,
      memory_available: Math.floor(freemem() / 1024 / 1024) + 'MB',
      node_version: 'v22.0.0',
      platform: process.platform,
      load_average: [0.5, 0.3, 0.2]
    },
    testScenarios: [
      'startup-performance',
      'initialization-timing',
      'bottleneck-analysis',
      'performance-regression'
    ]
  },

  /**
   * Memory usage metrics for memory consumption and leak testing
   * @description Detailed memory usage patterns and monitoring data
   */
  memoryUsage: {
    heap: {
      used: Math.floor(freemem() * 0.15), // 15% of available memory
      total: Math.floor(freemem() * 0.20), // 20% of available memory
      limit: Math.floor(freemem() * 0.80), // 80% memory limit
      percentage: 18.75 // (used / limit) * 100
    },
    external: {
      used: Math.floor(freemem() * 0.05), // 5% for external objects
      buffers: Math.floor(freemem() * 0.02), // 2% for buffers
      array_buffers: Math.floor(freemem() * 0.01) // 1% for ArrayBuffers
    },
    system: {
      total: freemem(),
      available: Math.floor(freemem() * 0.70), // 70% available
      used: Math.floor(freemem() * 0.30), // 30% used
      cached: Math.floor(freemem() * 0.20), // 20% cached
      swap: {
        total: Math.floor(freemem() * 0.50),
        used: Math.floor(freemem() * 0.05),
        free: Math.floor(freemem() * 0.45)
      }
    },
    process: {
      rss: process.memoryUsage().rss,
      heap_used: process.memoryUsage().heapUsed,
      heap_total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      array_buffers: process.memoryUsage().arrayBuffers || 0
    },
    gc_stats: {
      collections: 15,
      time_spent: 45.2, // milliseconds
      average_pause: 3.01, // milliseconds
      last_collection: Date.now() - 30000, // 30 seconds ago
      heap_size_before: Math.floor(freemem() * 0.25),
      heap_size_after: Math.floor(freemem() * 0.15)
    },
    memory_trends: {
      startup: Math.floor(freemem() * 0.10),
      peak: Math.floor(freemem() * 0.25),
      average: Math.floor(freemem() * 0.18),
      current: Math.floor(freemem() * 0.15),
      growth_rate: 0.05 // MB per hour
    },
    thresholds: {
      warning: Math.floor(freemem() * 0.70), // 70% threshold
      critical: Math.floor(freemem() * 0.85), // 85% threshold
      restart: Math.floor(freemem() * 0.95) // 95% restart threshold
    },
    testScenarios: [
      'memory-monitoring',
      'leak-detection',
      'gc-performance',
      'memory-pressure'
    ]
  },

  /**
   * CPU usage metrics for processor utilization and performance testing
   * @description CPU utilization patterns and performance characteristics
   */
  cpuUsage: {
    current: {
      percentage: 25.5,
      user: 15.2,
      system: 8.1,
      idle: 74.5,
      iowait: 2.2,
      cores: [
        { id: 0, usage: 22.1, user: 13.5, system: 8.6 },
        { id: 1, usage: 28.9, user: 16.9, system: 12.0 },
        { id: 2, usage: 24.3, user: 14.8, system: 9.5 },
        { id: 3, usage: 26.7, user: 15.6, system: 11.1 }
      ]
    },
    load_average: {
      one_minute: 0.75,
      five_minutes: 0.68,
      fifteen_minutes: 0.52,
      trend: 'stable'
    },
    process_specific: {
      cpu_percentage: 8.3,
      user_time: 1234567890, // microseconds
      system_time: 987654321, // microseconds
      children_user_time: 123456789,
      children_system_time: 98765432
    },
    performance_characteristics: {
      event_loop_lag: 1.23, // milliseconds
      event_loop_utilization: 0.15, // 15%
      libuv_handles: 12,
      libuv_requests: 3,
      active_resources: 8
    },
    historical_data: {
      last_hour: {
        average: 23.8,
        peak: 45.2,
        minimum: 8.1,
        spikes: 3
      },
      last_day: {
        average: 21.5,
        peak: 78.9,
        minimum: 2.3,
        spikes: 12
      }
    },
    thresholds: {
      normal: 50,
      warning: 70,
      critical: 85,
      emergency: 95
    },
    testScenarios: [
      'cpu-monitoring',
      'load-testing',
      'performance-tuning',
      'spike-detection'
    ]
  },

  /**
   * Response time metrics for request performance and latency testing
   * @description HTTP response time statistics and performance benchmarks
   */
  responseTime: {
    overall: {
      average: 45.7, // milliseconds
      median: 38.2,
      p95: 89.1,
      p99: 156.3,
      minimum: 12.4,
      maximum: 342.8
    },
    by_endpoint: {
      '/api/health': {
        average: 15.2,
        median: 12.8,
        p95: 28.1,
        p99: 45.6,
        samples: 15420
      },
      '/api/users': {
        average: 67.3,
        median: 58.9,
        p95: 124.7,
        p99: 198.4,
        samples: 8934
      },
      '/api/data': {
        average: 123.8,
        median: 98.2,
        p95: 234.5,
        p99: 389.1,
        samples: 5621
      },
      '/': {
        average: 25.6,
        median: 21.3,
        p95: 45.8,
        p99: 72.1,
        samples: 12450
      }
    },
    by_method: {
      GET: {
        average: 42.1,
        median: 35.8,
        p95: 82.3,
        samples: 28450
      },
      POST: {
        average: 78.4,
        median: 65.2,
        p95: 145.7,
        samples: 6780
      },
      PUT: {
        average: 89.3,
        median: 76.1,
        p95: 167.8,
        samples: 3421
      },
      DELETE: {
        average: 56.7,
        median: 48.9,
        p95: 98.4,
        samples: 1234
      }
    },
    time_distribution: {
      '0-10ms': 15.2, // percentage
      '10-50ms': 62.8,
      '50-100ms': 18.5,
      '100-200ms': 2.8,
      '200ms+': 0.7
    },
    factors: {
      network_latency: 5.2,
      processing_time: 35.1,
      database_time: 3.8,
      external_api_time: 1.6
    },
    sla_compliance: {
      target: 100, // milliseconds
      compliance_rate: 97.2, // percentage
      violations: 1124,
      total_requests: 40125
    },
    testScenarios: [
      'response-time-monitoring',
      'latency-testing',
      'sla-validation',
      'performance-benchmarking'
    ]
  },

  /**
   * Request count metrics for traffic volume and throughput testing
   * @description Request volume statistics and traffic patterns
   */
  requestCount: {
    total: 1250000,
    current_period: {
      last_minute: 842,
      last_hour: 45230,
      last_day: 1089600,
      last_week: 7627200
    },
    requests_per_second: {
      current: 14.2,
      average: 12.8,
      peak: 89.3,
      minimum: 2.1
    },
    by_status_code: {
      '200': 1187500, // 95%
      '201': 31250,   // 2.5%
      '400': 12500,   // 1%
      '404': 6250,    // 0.5%
      '429': 3750,    // 0.3%
      '500': 8750     // 0.7%
    },
    by_endpoint: {
      '/api/health': 187500,  // 15%
      '/api/users': 312500,   // 25%
      '/api/data': 250000,    // 20%
      '/': 375000,            // 30%
      '/static/*': 125000     // 10%
    },
    by_time_period: {
      '00-06': 62500,   // 5% - overnight
      '06-12': 250000,  // 20% - morning
      '12-18': 500000,  // 40% - afternoon peak
      '18-24': 437500   // 35% - evening
    },
    traffic_patterns: {
      trend: 'increasing',
      seasonality: 'business_hours',
      growth_rate: 15.3, // percent per month
      volatility: 'low'
    },
    concurrent_connections: {
      current: 45,
      average: 38,
      peak: 156,
      minimum: 2
    },
    testScenarios: [
      'traffic-monitoring',
      'load-testing',
      'capacity-planning',
      'pattern-analysis'
    ]
  },

  /**
   * Error rate metrics for reliability and stability testing
   * @description Error statistics and reliability measurements
   */
  errorRate: {
    overall: {
      rate: 0.02, // 2% error rate
      total_errors: 25000,
      total_requests: 1250000,
      period: '24h'
    },
    by_error_type: {
      client_errors: {
        count: 15000,
        rate: 0.012, // 1.2%
        codes: {
          '400': 7500,  // Bad Request
          '401': 2500,  // Unauthorized
          '403': 1000,  // Forbidden
          '404': 3500,  // Not Found
          '429': 500    // Too Many Requests
        }
      },
      server_errors: {
        count: 10000,
        rate: 0.008, // 0.8%
        codes: {
          '500': 6000,  // Internal Server Error
          '502': 1500,  // Bad Gateway
          '503': 2000,  // Service Unavailable
          '504': 500    // Gateway Timeout
        }
      }
    },
    by_endpoint: {
      '/api/health': {
        rate: 0.001, // 0.1%
        count: 187
      },
      '/api/users': {
        rate: 0.015, // 1.5%
        count: 4687
      },
      '/api/data': {
        rate: 0.032, // 3.2%
        count: 8000
      },
      '/': {
        rate: 0.005, // 0.5%
        count: 1875
      }
    },
    error_frequency: {
      errors_per_minute: 17.4,
      errors_per_hour: 1041.7,
      errors_per_day: 25000,
      peak_error_rate: 145.2 // errors per minute
    },
    error_patterns: {
      most_common: 'Internal Server Error (500)',
      trend: 'decreasing',
      seasonality: 'higher_during_peak_hours',
      correlation_with_load: 'positive'
    },
    reliability_metrics: {
      uptime_percentage: 99.92,
      mtbf: 7200000, // Mean Time Between Failures (seconds)
      mttr: 300,     // Mean Time To Recovery (seconds)
      availability: 99.92
    },
    testScenarios: [
      'error-monitoring',
      'reliability-testing',
      'failure-analysis',
      'recovery-testing'
    ]
  },

  /**
   * Uptime metrics for availability and reliability tracking
   * @description Server uptime statistics and availability measurements
   */
  uptime: {
    current_session: {
      seconds: 86400, // 24 hours
      human_readable: '1 day, 0 hours, 0 minutes',
      started_at: new Date(Date.now() - 86400000).toISOString(),
      running_since: '2025-01-01T00:00:00.000Z'
    },
    historical: {
      last_week: {
        total_seconds: 604800, // 7 days
        uptime_seconds: 604200, // 99.9% uptime
        downtime_seconds: 600,  // 10 minutes downtime
        uptime_percentage: 99.90,
        incidents: 2
      },
      last_month: {
        total_seconds: 2592000, // 30 days
        uptime_seconds: 2589840, // 99.92% uptime
        downtime_seconds: 2160,  // 36 minutes downtime
        uptime_percentage: 99.92,
        incidents: 5
      },
      last_year: {
        total_seconds: 31536000, // 365 days
        uptime_seconds: 31510800, // 99.92% uptime
        downtime_seconds: 25200,  // 7 hours downtime
        uptime_percentage: 99.92,
        incidents: 23
      }
    },
    availability_zones: {
      primary: {
        uptime_percentage: 99.95,
        last_downtime: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        total_incidents: 12
      },
      secondary: {
        uptime_percentage: 99.88,
        last_downtime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        total_incidents: 18
      }
    },
    downtime_analysis: {
      planned_maintenance: {
        total_seconds: 7200, // 2 hours
        percentage: 28.6, // of total downtime
        frequency: 'monthly'
      },
      unplanned_outages: {
        total_seconds: 18000, // 5 hours
        percentage: 71.4, // of total downtime
        average_duration: 782 // seconds
      }
    },
    sla_compliance: {
      target: 99.9, // 99.9% uptime SLA
      actual: 99.92,
      compliance_status: 'exceeding',
      credits_owed: 0
    },
    recovery_metrics: {
      average_recovery_time: 5.2, // minutes
      fastest_recovery: 1.8, // minutes
      slowest_recovery: 15.6, // minutes
      auto_recovery_rate: 78.3 // percentage
    },
    testScenarios: [
      'uptime-monitoring',
      'availability-testing',
      'sla-validation',
      'recovery-testing'
    ]
  }
};

/**
 * Server Lifecycle Fixtures for Server State Management Testing
 * @description Comprehensive server lifecycle data covering startup sequence,
 * shutdown sequence, graceful shutdown, force shutdown, state transitions,
 * and signal handlers for testing complete server lifecycle management
 */
export const SERVER_LIFECYCLE_FIXTURES = {
  /**
   * Startup sequence data for server initialization testing
   * @description Complete server startup workflow with timing and validation points
   */
  startupSequence: {
    phases: [
      {
        name: 'pre_init',
        order: 1,
        duration: 50,
        description: 'Pre-initialization setup',
        state: 'initializing',
        operations: [
          'Process environment validation',
          'Node.js version check',
          'Required modules availability check'
        ],
        validation: {
          required: true,
          timeout: 5000,
          success_criteria: ['environment_valid', 'modules_loaded']
        },
        error_handling: {
          on_failure: 'abort_startup',
          retry_attempts: 0,
          fallback: null
        }
      },
      {
        name: 'config_load',
        order: 2,
        duration: 200,
        description: 'Configuration loading and validation',
        state: 'loading_config',
        operations: [
          'Load environment variables',
          'Parse configuration files',
          'Validate configuration schema',
          'Apply default values'
        ],
        validation: {
          required: true,
          timeout: 10000,
          success_criteria: ['config_valid', 'schema_compliant']
        },
        error_handling: {
          on_failure: 'retry_with_defaults',
          retry_attempts: 3,
          fallback: 'default_config'
        }
      },
      {
        name: 'express_init',
        order: 3,
        duration: 300,
        description: 'Express application initialization',
        state: 'initializing_app',
        operations: [
          'Create Express application',
          'Configure trust proxy',
          'Set application settings'
        ],
        validation: {
          required: true,
          timeout: 15000,
          success_criteria: ['app_created', 'settings_applied']
        },
        error_handling: {
          on_failure: 'abort_startup',
          retry_attempts: 1,
          fallback: null
        }
      },
      {
        name: 'middleware_setup',
        order: 4,
        duration: 400,
        description: 'Middleware stack configuration',
        state: 'configuring_middleware',
        operations: [
          'Security middleware (Helmet)',
          'CORS configuration',
          'Body parser setup',
          'Rate limiting',
          'Static file serving',
          'Request logging'
        ],
        validation: {
          required: true,
          timeout: 20000,
          success_criteria: ['middleware_loaded', 'security_configured']
        },
        error_handling: {
          on_failure: 'continue_without_optional',
          retry_attempts: 2,
          fallback: 'minimal_middleware'
        }
      },
      {
        name: 'routes_registration',
        order: 5,
        duration: 150,
        description: 'Route registration and handler setup',
        state: 'registering_routes',
        operations: [
          'API routes registration',
          'Health check endpoints',
          'Error handlers',
          'Not found handler'
        ],
        validation: {
          required: true,
          timeout: 10000,
          success_criteria: ['routes_registered', 'handlers_bound']
        },
        error_handling: {
          on_failure: 'abort_startup',
          retry_attempts: 1,
          fallback: null
        }
      },
      {
        name: 'services_init',
        order: 6,
        duration: 500,
        description: 'External services initialization',
        state: 'initializing_services',
        operations: [
          'Database connection',
          'Cache initialization',
          'External API clients',
          'Background job queues'
        ],
        validation: {
          required: false,
          timeout: 30000,
          success_criteria: ['services_connected', 'health_checks_pass']
        },
        error_handling: {
          on_failure: 'continue_degraded',
          retry_attempts: 3,
          fallback: 'offline_mode'
        }
      },
      {
        name: 'server_start',
        order: 7,
        duration: 300,
        description: 'HTTP server startup',
        state: 'starting_server',
        operations: [
          'Create HTTP server',
          'Bind to port',
          'Start listening',
          'Configure keep-alive'
        ],
        validation: {
          required: true,
          timeout: 20000,
          success_criteria: ['port_bound', 'server_listening']
        },
        error_handling: {
          on_failure: 'retry_different_port',
          retry_attempts: 5,
          fallback: 'random_port'
        }
      },
      {
        name: 'pm2_cluster',
        order: 8,
        duration: 400,
        description: 'PM2 cluster mode setup',
        state: 'setting_up_cluster',
        operations: [
          'Worker process spawning',
          'Load balancer configuration',
          'Health monitoring setup',
          'Inter-process communication'
        ],
        validation: {
          required: false,
          timeout: 25000,
          success_criteria: ['workers_spawned', 'load_balanced']
        },
        error_handling: {
          on_failure: 'continue_single_process',
          retry_attempts: 2,
          fallback: 'fork_mode'
        }
      },
      {
        name: 'health_monitoring',
        order: 9,
        duration: 200,
        description: 'Health monitoring activation',
        state: 'activating_monitoring',
        operations: [
          'Health check endpoints',
          'Metric collection start',
          'Alert system activation',
          'Uptime tracking'
        ],
        validation: {
          required: true,
          timeout: 15000,
          success_criteria: ['health_active', 'metrics_collecting']
        },
        error_handling: {
          on_failure: 'continue_without_monitoring',
          retry_attempts: 2,
          fallback: 'basic_health_check'
        }
      },
      {
        name: 'ready_signal',
        order: 10,
        duration: 100,
        description: 'Ready signal and final validation',
        state: 'ready',
        operations: [
          'Send ready signal to PM2',
          'Log startup completion',
          'Enable request processing',
          'Notify monitoring systems'
        ],
        validation: {
          required: true,
          timeout: 5000,
          success_criteria: ['ready_signal_sent', 'requests_accepted']
        },
        error_handling: {
          on_failure: 'abort_startup',
          retry_attempts: 0,
          fallback: null
        }
      }
    ],
    total_duration: 2700, // Sum of all phase durations
    critical_path: ['pre_init', 'config_load', 'express_init', 'routes_registration', 'server_start', 'ready_signal'],
    optional_phases: ['services_init', 'pm2_cluster', 'health_monitoring'],
    rollback_strategy: 'progressive_shutdown',
    testScenarios: [
      'startup-timing',
      'phase-validation',
      'error-recovery',
      'rollback-testing'
    ]
  },

  /**
   * Shutdown sequence data for server termination testing
   * @description Complete server shutdown workflow with graceful termination
   */
  shutdownSequence: {
    phases: [
      {
        name: 'shutdown_signal',
        order: 1,
        duration: 50,
        description: 'Signal reception and acknowledgment',
        state: 'shutting_down',
        operations: [
          'Signal handler activation',
          'Shutdown flag setting',
          'Log shutdown initiation',
          'Reject new connections'
        ],
        validation: {
          required: true,
          timeout: 2000,
          success_criteria: ['signal_received', 'new_connections_rejected']
        }
      },
      {
        name: 'connection_drain',
        order: 2,
        duration: 5000,
        description: 'Active connection draining',
        state: 'draining_connections',
        operations: [
          'Stop accepting new requests',
          'Allow active requests to complete',
          'Monitor connection count',
          'Send keep-alive close headers'
        ],
        validation: {
          required: true,
          timeout: 30000,
          success_criteria: ['active_connections_drained', 'no_new_requests']
        }
      },
      {
        name: 'services_shutdown',
        order: 3,
        duration: 2000,
        description: 'External services disconnection',
        state: 'disconnecting_services',
        operations: [
          'Database connection closure',
          'Cache disconnection',
          'External API cleanup',
          'Background job termination'
        ],
        validation: {
          required: false,
          timeout: 15000,
          success_criteria: ['services_disconnected', 'resources_released']
        }
      },
      {
        name: 'cleanup_resources',
        order: 4,
        duration: 1000,
        description: 'Resource cleanup and finalization',
        state: 'cleaning_up',
        operations: [
          'Clear intervals and timeouts',
          'Close file descriptors',
          'Free memory allocations',
          'Cleanup temporary files'
        ],
        validation: {
          required: true,
          timeout: 10000,
          success_criteria: ['resources_cleaned', 'memory_freed']
        }
      },
      {
        name: 'server_close',
        order: 5,
        duration: 500,
        description: 'HTTP server closure',
        state: 'closing_server',
        operations: [
          'Stop HTTP server',
          'Unbind port',
          'Close server socket',
          'Release port binding'
        ],
        validation: {
          required: true,
          timeout: 10000,
          success_criteria: ['server_closed', 'port_released']
        }
      },
      {
        name: 'final_cleanup',
        order: 6,
        duration: 200,
        description: 'Final cleanup and process termination',
        state: 'terminating',
        operations: [
          'Final log messages',
          'Process exit preparation',
          'Signal PM2 completion',
          'Memory cleanup'
        ],
        validation: {
          required: true,
          timeout: 5000,
          success_criteria: ['cleanup_complete', 'ready_to_exit']
        }
      }
    ],
    total_duration: 8750,
    graceful_timeout: 30000,
    force_timeout: 45000,
    exit_codes: {
      success: 0,
      graceful_timeout: 1,
      force_shutdown: 2,
      error: 3
    },
    testScenarios: [
      'graceful-shutdown',
      'timeout-handling',
      'resource-cleanup',
      'connection-draining'
    ]
  },

  /**
   * Graceful shutdown configuration for clean termination testing
   * @description Graceful shutdown parameters and behavior configuration
   */
  gracefulShutdown: {
    triggers: {
      signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
      events: ['uncaughtException', 'unhandledRejection'],
      manual: ['admin_shutdown', 'maintenance_mode']
    },
    configuration: {
      graceful_timeout: 30000, // 30 seconds
      connection_drain_timeout: 15000, // 15 seconds
      service_shutdown_timeout: 10000, // 10 seconds
      final_cleanup_timeout: 5000, // 5 seconds
      health_check_grace_period: 3000 // 3 seconds
    },
    behavior: {
      reject_new_connections: true,
      drain_existing_connections: true,
      wait_for_requests: true,
      close_services_gracefully: true,
      cleanup_resources: true,
      log_shutdown_progress: true
    },
    monitoring: {
      track_active_connections: true,
      monitor_shutdown_progress: true,
      alert_on_timeout: true,
      metrics_collection: true
    },
    fallback: {
      force_shutdown_on_timeout: true,
      emergency_exit_code: 2,
      cleanup_on_force: 'minimal',
      notification_on_force: true
    },
    testScenarios: [
      'signal-handling',
      'graceful-timing',
      'connection-management',
      'resource-release'
    ]
  },

  /**
   * Force shutdown configuration for emergency termination testing
   * @description Force shutdown behavior and emergency termination procedures
   */
  forceShutdown: {
    triggers: {
      signals: ['SIGKILL', 'SIGABRT'],
      timeouts: ['graceful_timeout_exceeded'],
      errors: ['critical_system_error', 'memory_exhaustion'],
      manual: ['emergency_stop', 'kill_command']
    },
    behavior: {
      immediate_termination: true,
      skip_graceful_phases: true,
      force_close_connections: true,
      abort_running_requests: true,
      skip_service_cleanup: true,
      minimal_resource_cleanup: true
    },
    timing: {
      max_force_duration: 5000, // 5 seconds maximum
      cleanup_timeout: 1000, // 1 second for minimal cleanup
      exit_timeout: 500 // 500ms for process exit
    },
    cleanup_priorities: [
      'critical_data_save',
      'essential_logs',
      'security_cleanup',
      'notification_send'
    ],
    exit_handling: {
      exit_code: 2,
      error_logging: true,
      crash_dump: false,
      notification: 'emergency_alert'
    },
    testScenarios: [
      'force-termination',
      'emergency-cleanup',
      'timeout-exceeded',
      'critical-error-handling'
    ]
  },

  /**
   * State transitions for server lifecycle state management testing
   * @description Valid state transitions and state validation rules
   */
  stateTransitions: {
    states: [
      'stopped',
      'initializing',
      'loading_config',
      'initializing_app',
      'configuring_middleware',
      'registering_routes',
      'initializing_services',
      'starting_server',
      'setting_up_cluster',
      'activating_monitoring',
      'ready',
      'running',
      'degraded',
      'maintenance',
      'shutting_down',
      'draining_connections',
      'disconnecting_services',
      'cleaning_up',
      'closing_server',
      'terminating',
      'error'
    ],
    transitions: {
      stopped: ['initializing'],
      initializing: ['loading_config', 'error'],
      loading_config: ['initializing_app', 'error'],
      initializing_app: ['configuring_middleware', 'error'],
      configuring_middleware: ['registering_routes', 'error'],
      registering_routes: ['initializing_services', 'starting_server', 'error'],
      initializing_services: ['starting_server', 'error'],
      starting_server: ['setting_up_cluster', 'activating_monitoring', 'error'],
      setting_up_cluster: ['activating_monitoring', 'error'],
      activating_monitoring: ['ready', 'error'],
      ready: ['running', 'error'],
      running: ['degraded', 'maintenance', 'shutting_down', 'error'],
      degraded: ['running', 'maintenance', 'shutting_down', 'error'],
      maintenance: ['running', 'shutting_down'],
      shutting_down: ['draining_connections', 'terminating', 'error'],
      draining_connections: ['disconnecting_services', 'terminating', 'error'],
      disconnecting_services: ['cleaning_up', 'terminating', 'error'],
      cleaning_up: ['closing_server', 'terminating', 'error'],
      closing_server: ['terminating', 'error'],
      terminating: ['stopped'],
      error: ['terminating', 'stopped']
    },
    validation_rules: {
      startup_sequence: ['stopped', 'initializing', 'loading_config', 'initializing_app', 'configuring_middleware', 'registering_routes', 'starting_server', 'ready', 'running'],
      shutdown_sequence: ['running', 'shutting_down', 'draining_connections', 'disconnecting_services', 'cleaning_up', 'closing_server', 'terminating', 'stopped'],
      error_recovery: ['error', 'terminating', 'stopped', 'initializing'],
      maintenance_cycle: ['running', 'maintenance', 'running']
    },
    timeouts: {
      state_transition_timeout: 30000,
      startup_total_timeout: 120000,
      shutdown_total_timeout: 60000,
      error_recovery_timeout: 10000
    },
    testScenarios: [
      'state-validation',
      'transition-timing',
      'invalid-transitions',
      'error-recovery'
    ]
  },

  /**
   * Signal handlers configuration for process signal management testing
   * @description Signal handling behavior and process management
   */
  signalHandlers: {
    handlers: {
      SIGTERM: {
        description: 'Graceful termination signal',
        action: 'graceful_shutdown',
        timeout: 30000,
        cleanup: true,
        exit_code: 0,
        priority: 'high'
      },
      SIGINT: {
        description: 'Interrupt signal (Ctrl+C)',
        action: 'graceful_shutdown',
        timeout: 30000,
        cleanup: true,
        exit_code: 0,
        priority: 'high'
      },
      SIGUSR2: {
        description: 'User-defined signal for restart',
        action: 'graceful_restart',
        timeout: 45000,
        cleanup: true,
        exit_code: 0,
        priority: 'medium'
      },
      SIGHUP: {
        description: 'Hangup signal for configuration reload',
        action: 'reload_config',
        timeout: 10000,
        cleanup: false,
        exit_code: null,
        priority: 'low'
      },
      SIGKILL: {
        description: 'Force kill signal',
        action: 'force_termination',
        timeout: 0,
        cleanup: false,
        exit_code: 2,
        priority: 'critical'
      },
      SIGABRT: {
        description: 'Abort signal',
        action: 'force_termination',
        timeout: 1000,
        cleanup: 'minimal',
        exit_code: 3,
        priority: 'critical'
      }
    },
    behavior: {
      signal_masking: false,
      multiple_signal_handling: 'queue',
      signal_propagation: true,
      custom_handlers: true
    },
    error_handling: {
      handler_errors: 'log_and_continue',
      timeout_exceeded: 'force_termination',
      unknown_signal: 'ignore',
      recursive_signals: 'prevent'
    },
    testScenarios: [
      'signal-handling',
      'graceful-termination',
      'force-termination',
      'signal-timing'
    ]
  }
};

/**
 * Create Server Fixture Factory Function
 * @description Factory function to create customized server configuration fixtures
 * for specific test scenarios with parameter overrides and validation
 * 
 * @param {string} type - Base configuration type ('minimal', 'complete', 'invalid', etc.)
 * @param {Object} overrides - Configuration overrides to apply
 * @param {Object} options - Additional options for fixture creation
 * @returns {Object} Customized server configuration fixture
 */
export function createServerFixture(type = 'minimal', overrides = {}, options = {}) {
  try {
    // Validate input parameters
    if (!CONFIG_VARIATIONS[type]) {
      throw new Error(`Invalid configuration type: ${type}. Available types: ${Object.keys(CONFIG_VARIATIONS).join(', ')}`);
    }

    // Get base configuration
    const baseConfig = JSON.parse(JSON.stringify(CONFIG_VARIATIONS[type]));
    
    // Apply overrides using deep merge
    const mergedConfig = deepMerge(baseConfig, overrides);
    
    // Add fixture metadata
    const fixture = {
      ...mergedConfig,
      _fixture_metadata: {
        created_at: new Date().toISOString(),
        fixture_type: 'server_configuration',
        base_type: type,
        has_overrides: Object.keys(overrides).length > 0,
        test_id: options.testId || randomBytes(8).toString('hex'),
        scenario: options.scenario || 'default',
        tags: options.tags || []
      }
    };

    // Apply additional options
    if (options.addTimestamp) {
      fixture.timestamp = new Date().toISOString();
    }
    
    if (options.addProcessInfo) {
      fixture.process_info = {
        pid: process.pid,
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory_usage: process.memoryUsage()
      };
    }

    // Validate final configuration if requested
    if (options.validate !== false) {
      validateServerConfiguration(fixture);
    }

    return fixture;
  } catch (error) {
    throw new Error(`Failed to create server fixture: ${error.message}`);
  }
}

/**
 * Create Health Check Fixture Factory Function
 * @description Factory function to create health check response fixtures
 * for testing health monitoring and status reporting functionality
 * 
 * @param {string} status - Health status ('healthy', 'degraded', 'critical', etc.)
 * @param {Object} customData - Custom data to include in health response
 * @param {Object} options - Additional options for fixture creation
 * @returns {Object} Health check response fixture
 */
export function createHealthCheckFixture(status = 'healthy', customData = {}, options = {}) {
  try {
    // Validate health status
    if (!HEALTH_STATUS_FIXTURES[status]) {
      throw new Error(`Invalid health status: ${status}. Available statuses: ${Object.keys(HEALTH_STATUS_FIXTURES).join(', ')}`);
    }

    // Get base health status
    const baseHealth = JSON.parse(JSON.stringify(HEALTH_STATUS_FIXTURES[status]));
    
    // Merge custom data
    const healthFixture = deepMerge(baseHealth, customData);
    
    // Update timestamp to current time
    healthFixture.timestamp = new Date().toISOString();
    
    // Add fixture metadata
    healthFixture._fixture_metadata = {
      created_at: new Date().toISOString(),
      fixture_type: 'health_check',
      base_status: status,
      has_custom_data: Object.keys(customData).length > 0,
      test_id: options.testId || randomBytes(8).toString('hex'),
      scenario: options.scenario || 'monitoring'
    };

    // Apply dynamic data if requested
    if (options.dynamicMemory) {
      const totalMem = freemem();
      const usagePercent = options.memoryUsagePercent || Math.random() * 100;
      healthFixture.memory = {
        used: Math.floor(totalMem * (usagePercent / 100)),
        total: totalMem,
        percentage: usagePercent
      };
    }

    if (options.dynamicCpu) {
      healthFixture.cpu = {
        usage: options.cpuUsage || Math.random() * 100,
        loadAverage: [
          Math.random() * 2,
          Math.random() * 2,
          Math.random() * 2
        ]
      };
    }

    // Add correlation ID for tracing
    if (options.correlationId) {
      healthFixture.correlation_id = options.correlationId;
    }

    return healthFixture;
  } catch (error) {
    throw new Error(`Failed to create health check fixture: ${error.message}`);
  }
}

/**
 * Create Server Error Fixture Factory Function
 * @description Factory function to create server error fixtures for testing
 * error handling, recovery procedures, and failure scenarios
 * 
 * @param {string} errorType - Error type ('systemErrors', 'customErrors', etc.)
 * @param {string} errorCode - Specific error code within the type
 * @param {Object} context - Additional context for the error
 * @param {Object} options - Additional options for fixture creation
 * @returns {Object} Server error fixture
 */
export function createServerErrorFixture(errorType = 'systemErrors', errorCode = 'EADDRINUSE', context = {}, options = {}) {
  try {
    // Validate error type
    if (!ERROR_FIXTURES[errorType]) {
      throw new Error(`Invalid error type: ${errorType}. Available types: ${Object.keys(ERROR_FIXTURES).join(', ')}`);
    }

    // Find specific error by code
    const errorArray = ERROR_FIXTURES[errorType];
    const baseError = errorArray.find(err => err.code === errorCode);
    
    if (!baseError) {
      const availableCodes = errorArray.map(err => err.code).join(', ');
      throw new Error(`Invalid error code: ${errorCode} for type ${errorType}. Available codes: ${availableCodes}`);
    }

    // Create error fixture
    const errorFixture = JSON.parse(JSON.stringify(baseError));
    
    // Merge additional context
    errorFixture.context = {
      ...errorFixture.details,
      ...context,
      timestamp: new Date().toISOString()
    };

    // Add fixture metadata
    errorFixture._fixture_metadata = {
      created_at: new Date().toISOString(),
      fixture_type: 'server_error',
      error_type: errorType,
      error_code: errorCode,
      has_context: Object.keys(context).length > 0,
      test_id: options.testId || randomBytes(8).toString('hex'),
      scenario: options.scenario || 'error_handling'
    };

    // Add stack trace if requested
    if (options.includeStack) {
      const error = new Error(errorFixture.message);
      error.code = errorFixture.code;
      errorFixture.stack = error.stack;
    }

    // Add retry information if applicable
    if (options.retryAttempt) {
      errorFixture.retry_info = {
        attempt: options.retryAttempt,
        max_attempts: options.maxRetries || 3,
        next_retry_in: options.retryDelay || 1000,
        exponential_backoff: options.useBackoff || false
      };
    }

    return errorFixture;
  } catch (error) {
    throw new Error(`Failed to create server error fixture: ${error.message}`);
  }
}

/**
 * Validate Server Fixture Function
 * @description Validates server configuration fixtures for correctness and completeness
 * Ensures configuration fixtures meet basic requirements and structural validity
 * 
 * @param {Object} fixture - Server fixture to validate
 * @param {Object} options - Validation options and requirements
 * @returns {Object} Validation result with status and details
 */
export function validateServerFixture(fixture, options = {}) {
  const validationResult = {
    valid: true,
    errors: [],
    warnings: [],
    metadata: {
      validated_at: new Date().toISOString(),
      fixture_type: fixture._fixture_metadata?.fixture_type || 'unknown',
      validation_level: options.level || 'basic'
    }
  };

  try {
    // Required field validation
    const requiredFields = ['server', 'environment'];
    for (const field of requiredFields) {
      if (!fixture[field]) {
        validationResult.errors.push(`Missing required field: ${field}`);
        validationResult.valid = false;
      }
    }

    // Server configuration validation
    if (fixture.server) {
      if (typeof fixture.server.port !== 'number' || fixture.server.port < 1 || fixture.server.port > 65535) {
        if (fixture.server.port !== 0) { // Allow 0 for random port selection
          validationResult.errors.push('Invalid server port: must be between 1-65535 or 0 for random');
          validationResult.valid = false;
        }
      }

      if (fixture.server.host && typeof fixture.server.host !== 'string') {
        validationResult.errors.push('Invalid server host: must be a string');
        validationResult.valid = false;
      }
    }

    // Environment validation
    const validEnvironments = ['development', 'test', 'staging', 'production'];
    if (fixture.environment && !validEnvironments.includes(fixture.environment)) {
      validationResult.warnings.push(`Non-standard environment: ${fixture.environment}. Consider using: ${validEnvironments.join(', ')}`);
    }

    // Security configuration validation
    if (fixture.security) {
      if (fixture.security.helmet && typeof fixture.security.helmet.enabled !== 'boolean') {
        validationResult.warnings.push('Helmet enabled flag should be a boolean');
      }

      if (fixture.security.cors && fixture.security.cors.origin && 
          !Array.isArray(fixture.security.cors.origin) && 
          typeof fixture.security.cors.origin !== 'string' && 
          fixture.security.cors.origin !== true) {
        validationResult.warnings.push('CORS origin should be string, array, or boolean');
      }
    }

    // PM2 configuration validation
    if (fixture.pm2) {
      if (fixture.pm2.instances && 
          typeof fixture.pm2.instances !== 'number' && 
          fixture.pm2.instances !== 'max') {
        validationResult.warnings.push('PM2 instances should be a number or "max"');
      }
    }

    // Advanced validation if requested
    if (options.level === 'strict') {
      // Check for conflicting configurations
      if (fixture.environment === 'production' && fixture.security?.cors?.origin === true) {
        validationResult.warnings.push('Production environment with open CORS policy is not recommended');
      }

      if (fixture.pm2?.enabled === true && fixture.environment === 'development') {
        validationResult.warnings.push('PM2 clustering in development environment may not be necessary');
      }
    }

    return validationResult;
  } catch (error) {
    validationResult.valid = false;
    validationResult.errors.push(`Validation error: ${error.message}`);
    return validationResult;
  }
}

/**
 * Initialize Server Fixtures Function
 * @description Initializes and prepares server fixtures for test execution
 * Sets up fixture cache, validates configurations, and prepares test environment
 * 
 * @param {Object} options - Initialization options and configuration
 * @returns {Promise<Object>} Initialization result with prepared fixtures
 */
export function initializeServerFixtures(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const initializationResult = {
        initialized: false,
        cache_enabled: options.enableCache !== false,
        fixtures_loaded: 0,
        validation_results: [],
        cache: new Map(),
        metadata: {
          initialized_at: new Date().toISOString(),
          test_session_id: options.sessionId || randomBytes(16).toString('hex'),
          environment: options.environment || 'test'
        }
      };

      // Initialize fixture cache if enabled
      if (initializationResult.cache_enabled) {
        // Pre-load commonly used configurations
        const commonConfigs = ['minimal', 'complete', 'testing'];
        commonConfigs.forEach(configType => {
          try {
            const fixture = createServerFixture(configType, {}, { validate: true });
            initializationResult.cache.set(`config_${configType}`, fixture);
            initializationResult.fixtures_loaded++;
          } catch (error) {
            console.warn(`Failed to cache ${configType} configuration: ${error.message}`);
          }
        });

        // Pre-load commonly used health statuses
        const commonHealthStates = ['healthy', 'degraded', 'critical'];
        commonHealthStates.forEach(status => {
          try {
            const fixture = createHealthCheckFixture(status, {}, { validate: true });
            initializationResult.cache.set(`health_${status}`, fixture);
            initializationResult.fixtures_loaded++;
          } catch (error) {
            console.warn(`Failed to cache ${status} health status: ${error.message}`);
          }
        });
      }

      // Validate all fixture schemas if requested
      if (options.validateSchemas) {
        Object.keys(CONFIG_VARIATIONS).forEach(configType => {
          const validationResult = validateServerFixture(CONFIG_VARIATIONS[configType]);
          initializationResult.validation_results.push({
            type: 'config',
            name: configType,
            ...validationResult
          });
        });
      }

      // Setup cleanup handlers
      if (options.setupCleanup) {
        process.on('exit', () => {
          cleanupServerFixtures();
        });
      }

      initializationResult.initialized = true;
      resolve(initializationResult);
    } catch (error) {
      reject(new Error(`Failed to initialize server fixtures: ${error.message}`));
    }
  });
}

/**
 * Cleanup Server Fixtures Function
 * @description Cleans up server fixtures, clears caches, and releases resources
 * Ensures proper cleanup after test execution to prevent memory leaks
 * 
 * @param {Object} options - Cleanup options and configuration
 * @returns {Object} Cleanup result with status and statistics
 */
export function cleanupServerFixtures(options = {}) {
  try {
    const cleanupResult = {
      cleaned: false,
      cache_cleared: false,
      resources_released: 0,
      memory_freed: 0,
      metadata: {
        cleaned_at: new Date().toISOString(),
        cleanup_level: options.level || 'standard'
      }
    };

    // Clear fixture cache if it exists
    if (global.serverFixtureCache) {
      const cacheSize = global.serverFixtureCache.size;
      global.serverFixtureCache.clear();
      cleanupResult.cache_cleared = true;
      cleanupResult.resources_released += cacheSize;
      delete global.serverFixtureCache;
    }

    // Clear any temporary files if created
    if (options.clearTempFiles) {
      // Implementation would depend on specific temp file locations
      cleanupResult.resources_released++;
    }

    // Force garbage collection if available and requested
    if (options.forceGC && global.gc) {
      const memBefore = process.memoryUsage().heapUsed;
      global.gc();
      const memAfter = process.memoryUsage().heapUsed;
      cleanupResult.memory_freed = memBefore - memAfter;
    }

    // Clear any event listeners or timers
    if (options.clearListeners) {
      // Remove any fixture-specific event listeners
      process.removeAllListeners('serverFixtureCleanup');
      cleanupResult.resources_released++;
    }

    cleanupResult.cleaned = true;
    return cleanupResult;
  } catch (error) {
    return {
      cleaned: false,
      error: error.message,
      metadata: {
        cleaned_at: new Date().toISOString(),
        cleanup_failed: true
      }
    };
  }
}

/**
 * Default Server Fixtures Export Object
 * @description Main export object containing all server fixtures and utilities
 * organized by category for easy access and comprehensive testing support
 */
const serverFixtures = {
  /**
   * Configuration fixtures for various server setup scenarios
   */
  config: {
    variations: CONFIG_VARIATIONS,
    create: (type, overrides, options) => createServerFixture(type, overrides, options),
    validate: (fixture, options) => validateServerFixture(fixture, options)
  },

  /**
   * Health status fixtures for monitoring and health check testing
   */
  health: {
    statuses: HEALTH_STATUS_FIXTURES,
    create: (status, customData, options) => createHealthCheckFixture(status, customData, options)
  },

  /**
   * Error fixtures for error handling and failure scenario testing
   */
  errors: {
    scenarios: ERROR_FIXTURES,
    create: (errorType, errorCode, context, options) => createServerErrorFixture(errorType, errorCode, context, options)
  },

  /**
   * PM2 configuration fixtures for process management testing
   */
  pm2: {
    configurations: PM2_CONFIG_FIXTURES
  },

  /**
   * Performance metrics fixtures for performance testing and monitoring
   */
  performance: {
    metrics: PERFORMANCE_METRICS_FIXTURES
  },

  /**
   * Server lifecycle fixtures for state management and transition testing
   */
  lifecycle: {
    sequences: SERVER_LIFECYCLE_FIXTURES
  },

  /**
   * Utility functions for fixture management and testing support
   */
  utilities: {
    initialize: initializeServerFixtures,
    cleanup: cleanupServerFixtures,
    validate: validateServerFixture,
    createServer: createServerFixture,
    createHealth: createHealthCheckFixture,
    createError: createServerErrorFixture
  }
};

export default serverFixtures;

/**
 * Helper function for deep merging objects
 * @description Recursively merges objects, handling nested properties and arrays
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Helper function for server configuration validation
 * @description Validates basic server configuration structure and values
 * @param {Object} config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
function validateServerConfiguration(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }
  
  if (!config.server) {
    throw new Error('Server configuration is required');
  }
  
  if (typeof config.server.port !== 'number' && config.server.port !== 0) {
    throw new Error('Server port must be a number or 0 for random port');
  }
  
  if (config.server.port < 0 || config.server.port > 65535) {
    throw new Error('Server port must be between 0 and 65535');
  }
}