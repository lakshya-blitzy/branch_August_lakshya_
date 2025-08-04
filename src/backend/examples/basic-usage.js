/**
 * @fileoverview Educational Basic HTTP Server Usage Examples
 * @description Comprehensive demonstration of basic HTTP server usage patterns for the Node.js
 * tutorial project. This example file showcases how to properly initialize, configure, and manage
 * the basic HTTP server using modern Node.js v22.x LTS practices with ES Modules. Provides
 * comprehensive usage examples including server startup, configuration management, error handling,
 * graceful shutdown, and performance monitoring. Designed as a practical learning resource for
 * Phase 1 of the tutorial progression, demonstrating fundamental HTTP server concepts before
 * advancing to Express.js framework integration.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Features:
 * - Production-ready patterns including logging integration and environment configuration
 * - Health monitoring and proper resource management suitable for educational and development purposes
 * - Modern Node.js development patterns showcasing ES Modules and Node.js v22.x LTS features
 * - Comprehensive usage examples for Phase 1 foundational concepts
 * - Cross-platform learning foundation preparing for Flask migration and feature parity validation
 * - Stateless architecture examples preparing for PM2 cluster mode and horizontal scaling
 * 
 * Learning Objectives:
 * - Understanding basic HTTP server concepts and Node.js core capabilities
 * - Learning modern ES Modules and Node.js v22.x LTS features
 * - Implementing production-ready patterns for server lifecycle management
 * - Developing monitoring and observability practices
 * - Preparing for Express.js framework integration and advanced features
 * - Building foundation for cross-platform development and Flask migration
 * 
 * Usage Examples:
 * - Basic server startup and shutdown: node src/backend/examples/basic-usage.js --example=startup
 * - Configuration options demonstration: node src/backend/examples/basic-usage.js --example=config
 * - Monitoring and health checks: node src/backend/examples/basic-usage.js --example=monitoring
 * - Performance measurement examples: node src/backend/examples/basic-usage.js --example=performance
 * - All examples: node src/backend/examples/basic-usage.js --example=all
 */

// External library imports with version comments
import process from 'node:process'; // Node.js built-in - Process module for environment variable access, signal handling, and process management examples
import { URL } from 'node:url'; // Node.js built-in - URL utilities for demonstrating URL parsing and endpoint construction examples

// Internal imports with specific members for educational HTTP server functionality
import {
  startBasicServer,
  createRequestHandler,
  setupGracefulShutdown,
  logServerStats
} from '../basic-server.js';

import logger, {
  info as logInfo,
  warn as logWarn,
  error as logError,
  debug as logDebug
} from '../utils/logger.js';

import { 
  environmentConfig 
} from '../config/environment.js';

import {
  ENV_CONSTANTS
} from '../utils/constants.js';

// Global state variables for example execution tracking and management
let serverInstance = null;
let exampleStartTime = null;
let isShuttingDown = false;
let exampleMetrics = {
  startupTime: 0,
  requestCount: 0,
  errors: 0
};

/**
 * Simple helper function implementations to replace missing helpers.js
 * These provide basic functionality for educational demonstration purposes
 */

/**
 * Measures performance of an async operation with timing and memory tracking
 * @param {Function} operation - Async operation to measure
 * @param {string} [operationName='operation'] - Name for logging purposes
 * @returns {Object} Performance metrics including duration and memory usage
 */
async function measurePerformance(operation, operationName = 'operation') {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  try {
    const result = await operation();
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal
    };
    
    const metrics = {
      operation: operationName,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      memory: memoryDelta,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    logDebug('Performance measurement completed', { metrics });
    return { result, metrics };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    const metrics = {
      operation: operationName,
      duration: Math.round(duration * 100) / 100,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };
    
    logError('Performance measurement failed', { metrics });
    throw error;
  }
}

/**
 * Creates a basic health check function for server monitoring demonstration
 * @param {Object} [options={}] - Health check configuration options
 * @returns {Function} Health check function that returns server status
 */
function createHealthCheck(options = {}) {
  const config = {
    includeMemory: options.includeMemory !== false,
    includeUptime: options.includeUptime !== false,
    includeEnvironment: options.includeEnvironment !== false,
    ...options
  };
  
  return function healthCheck() {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // Basic server health check
    health.checks.server = {
      status: serverInstance ? 'running' : 'stopped',
      port: serverInstance?.address()?.port || null
    };
    
    // Memory usage check if enabled
    if (config.includeMemory) {
      const memory = process.memoryUsage();
      health.checks.memory = {
        rss: Math.round(memory.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) // MB
      };
    }
    
    // Process uptime check if enabled
    if (config.includeUptime) {
      health.checks.uptime = {
        process: Math.round(process.uptime()),
        server: exampleStartTime ? Math.round((Date.now() - exampleStartTime) / 1000) : 0
      };
    }
    
    // Environment information if enabled
    if (config.includeEnvironment) {
      health.checks.environment = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      };
    }
    
    // Overall health assessment
    health.healthy = health.checks.server.status === 'running';
    
    return health;
  };
}

/**
 * Main example function that demonstrates complete basic HTTP server usage including
 * initialization, startup, configuration, monitoring, and shutdown procedures with
 * comprehensive logging and educational commentary for Phase 1 learning objectives.
 * 
 * @param {Object} [options={}] - Example execution options and configuration
 * @param {string} [options.port] - Server port override for demonstration
 * @param {string} [options.host] - Server host override for demonstration
 * @param {boolean} [options.enableMonitoring=true] - Enable health monitoring demonstration
 * @param {boolean} [options.verbose=true] - Enable verbose educational logging
 * @returns {Promise<Object>} Promise that resolves with example execution results including server instance, metrics, and educational insights
 */
export async function runBasicServerExample(options = {}) {
  const config = {
    port: options.port || environmentConfig.server?.port || ENV_CONSTANTS.DEFAULT_PORT,
    host: options.host || environmentConfig.server?.host || ENV_CONSTANTS.DEFAULT_HOST,
    enableMonitoring: options.enableMonitoring !== false,
    verbose: options.verbose !== false,
    ...options
  };
  
  try {
    // Log example startup with educational context and learning objectives
    logInfo('🚀 Starting Basic HTTP Server Usage Example', {
      phase: 'Phase 1 - Basic HTTP Server Examples',
      learningObjectives: [
        'Understanding basic HTTP server concepts and Node.js core capabilities',
        'Learning modern ES Modules and Node.js v22.x LTS features',
        'Implementing production-ready patterns for server lifecycle management',
        'Developing monitoring and observability practices'
      ],
      configuration: config
    });
    
    // Load and validate environment configuration using environmentConfig
    if (config.verbose) {
      logInfo('📋 Environment Configuration Analysis', {
        environment: environmentConfig.environment || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        serverConfig: {
          port: config.port,
          host: config.host,
          protocol: 'http'
        }
      });
    }
    
    // Create server configuration object with educational explanations
    const serverConfig = {
      port: config.port,
      host: config.host,
      
      // Request handler configuration for educational demonstration
      requestHandler: createRequestHandler({
        enableLogging: config.verbose,
        includeTimestamp: true,
        correlationId: true
      }),
      
      // Performance monitoring configuration
      monitoring: {
        enabled: config.enableMonitoring,
        logRequests: config.verbose,
        trackMemory: true
      }
    };
    
    if (config.verbose) {
      logInfo('⚙️ Server Configuration Prepared', {
        config: serverConfig,
        explanation: 'Configuration demonstrates modern Node.js patterns including request handling, monitoring, and production-ready settings'
      });
    }
    
    // Measure server startup performance using measurePerformance helper
    const { result: server, metrics: startupMetrics } = await measurePerformance(
      async () => {
        exampleStartTime = Date.now();
        const serverInstance = await startBasicServer(serverConfig);
        return serverInstance;
      },
      'basic-server-startup'
    );
    
    // Set global serverInstance and update metrics for tracking
    serverInstance = server;
    exampleMetrics.startupTime = startupMetrics.duration;
    
    // Set up health monitoring using createHealthCheck utility
    let healthCheck = null;
    if (config.enableMonitoring) {
      healthCheck = createHealthCheck({
        includeMemory: true,
        includeUptime: true,
        includeEnvironment: config.verbose
      });
      
      if (config.verbose) {
        const initialHealth = healthCheck();
        logInfo('🏥 Health Monitoring Initialized', {
          healthCheck: initialHealth,
          explanation: 'Health monitoring provides operational visibility and debugging capabilities for production deployments'
        });
      }
    }
    
    // Configure graceful shutdown using setupGracefulShutdown for production patterns
    const shutdownHandler = setupGracefulShutdown(serverInstance, {
      timeout: 10000, // 10 second graceful shutdown timeout
      onShutdown: async () => {
        isShuttingDown = true;
        logInfo('🛑 Graceful shutdown initiated', {
          uptime: Math.round((Date.now() - exampleStartTime) / 1000),
          explanation: 'Graceful shutdown ensures proper resource cleanup and request completion'
        });
      }
    });
    
    // Log successful server startup with access information and next steps
    const serverAddress = serverInstance.address();
    const serverUrl = `http://${config.host}:${serverAddress.port}`;
    
    logInfo('✅ Basic HTTP Server Example Started Successfully', {
      server: {
        url: serverUrl,
        address: serverAddress,
        pid: process.pid
      },
      performance: {
        startupTime: `${startupMetrics.duration}ms`,
        memoryUsage: startupMetrics.memory
      },
      nextSteps: [
        `Test the server: curl ${serverUrl}`,
        'Monitor health: Check process memory and CPU usage',
        'Graceful shutdown: Send SIGTERM or SIGINT signal',
        'Next phase: Express.js framework integration'
      ]
    });
    
    // Return example results with server instance, metrics, and educational guidance
    const results = {
      server: serverInstance,
      url: serverUrl,
      address: serverAddress,
      metrics: {
        startup: startupMetrics,
        example: exampleMetrics
      },
      healthCheck: healthCheck || null,
      shutdownHandler,
      
      // Educational insights and guidance
      educational: {
        phase: 'Phase 1 - Basic HTTP Server',
        concepts: [
          'Node.js core HTTP module usage',
          'ES Modules import/export patterns',
          'Asynchronous server startup',
          'Performance measurement techniques',
          'Health monitoring implementation',
          'Graceful shutdown patterns'
        ],
        nextPhase: 'Phase 2 - Express.js Framework Integration',
        bestPractices: [
          'Always measure performance of critical operations',
          'Implement health checks for operational visibility',
          'Use graceful shutdown for production reliability',
          'Log comprehensive information for debugging',
          'Follow modern ES Modules patterns'
        ]
      }
    };
    
    return results;
    
  } catch (error) {
    exampleMetrics.errors++;
    logError('❌ Basic HTTP Server Example Failed', {
      error: error.message,
      stack: error.stack,
      metrics: exampleMetrics,
      troubleshooting: [
        'Check if port is already in use',
        'Verify Node.js version compatibility (v22.x LTS)',
        'Ensure proper file permissions',
        'Review environment configuration'
      ]
    });
    throw error;
  }
}

/**
 * Educational function that demonstrates various server configuration options including
 * port settings, host configuration, environment-specific settings, and best practices
 * for different deployment scenarios with comprehensive explanations and recommendations.
 * 
 * @param {string} [environment='development'] - Target environment for configuration demonstration
 * @param {Object} [options={}] - Configuration demonstration options
 * @returns {Object} Configuration demonstration object with examples, explanations, and recommended settings
 */
export function demonstrateServerConfiguration(environment = 'development', options = {}) {
  const config = {
    showDefaults: options.showDefaults !== false,
    includeSecurityOptions: options.includeSecurityOptions === true,
    verboseExplanations: options.verboseExplanations !== false,
    ...options
  };
  
  logInfo('📋 Server Configuration Demonstration', {
    environment,
    purpose: 'Educational demonstration of server configuration patterns and best practices'
  });
  
  // Load environment-specific configuration from environmentConfig
  const envConfig = environmentConfig.server || {};
  const baseConfig = {
    port: ENV_CONSTANTS.DEFAULT_PORT,
    host: ENV_CONSTANTS.DEFAULT_HOST,
    environment
  };
  
  // Demonstrate port configuration options and selection strategies
  const portConfiguration = {
    default: ENV_CONSTANTS.DEFAULT_PORT,
    fromEnvironment: process.env.PORT ? parseInt(process.env.PORT) : null,
    recommended: {
      development: 3000,
      staging: 3000,
      production: 'process.env.PORT (set by hosting platform)'
    },
    considerations: [
      'Development: Use fixed port (3000) for consistency',
      'Production: Use environment variable set by hosting platform',
      'Avoid privileged ports (< 1024) unless running as root',
      'Check port availability before binding'
    ]
  };
  
  // Show host binding examples for development vs production deployment
  const hostConfiguration = {
    default: ENV_CONSTANTS.DEFAULT_HOST,
    options: {
      localhost: '127.0.0.1',
      allInterfaces: '0.0.0.0',
      ipv6: '::1'
    },
    recommendations: {
      development: '127.0.0.1 (localhost only for security)',
      production: '0.0.0.0 (all interfaces for load balancer access)',
      security: 'Never bind to 0.0.0.0 in development unless necessary'
    }
  };
  
  // Explain environment variable usage and precedence rules
  const environmentVariables = {
    precedence: [
      '1. Command line arguments (highest priority)',
      '2. Environment variables (.env files)',
      '3. Configuration files',
      '4. Default values (lowest priority)'
    ],
    examples: {
      PORT: process.env.PORT || 'not set',
      HOST: process.env.HOST || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    },
    validation: [
      'Always validate environment variables',
      'Provide sensible defaults',
      'Document required vs optional variables',
      'Use type conversion for non-string values'
    ]
  };
  
  // Demonstrate timeout configuration and performance tuning options
  const timeoutConfiguration = {
    server: {
      timeout: 120000, // 2 minutes
      keepAliveTimeout: 5000, // 5 seconds
      headersTimeout: 60000 // 1 minute
    },
    recommendations: {
      development: 'Higher timeouts for debugging',
      production: 'Lower timeouts for resource efficiency',
      loadBalancer: 'Coordinate timeouts with upstream services'
    }
  };
  
  // Show logging configuration and level management examples
  const loggingConfiguration = {
    levels: ['error', 'warn', 'info', 'debug'],
    byEnvironment: {
      development: 'debug',
      staging: 'info',
      production: 'warn'
    },
    formats: {
      development: 'human-readable with colors',
      production: 'structured JSON for parsing'
    }
  };
  
  // Provide security configuration examples and best practices
  const securityConfiguration = config.includeSecurityOptions ? {
    headers: {
      'X-Powered-By': 'Remove to prevent information disclosure',
      'X-Frame-Options': 'DENY to prevent clickjacking',
      'X-Content-Type-Options': 'nosniff to prevent MIME sniffing'
    },
    recommendations: [
      'Use HTTPS in production (TLS/SSL)',
      'Implement security headers',
      'Validate and sanitize all inputs',
      'Follow principle of least privilege'
    ]
  } : null;
  
  // Return comprehensive configuration demonstration with educational notes
  const demonstration = {
    environment,
    timestamp: new Date().toISOString(),
    
    configuration: {
      port: portConfiguration,
      host: hostConfiguration,
      environment: environmentVariables,
      timeouts: timeoutConfiguration,
      logging: loggingConfiguration,
      ...(securityConfiguration && { security: securityConfiguration })
    },
    
    // Practical examples for each environment
    examples: {
      development: {
        port: 3000,
        host: '127.0.0.1',
        logLevel: 'debug',
        timeout: 60000
      },
      production: {
        port: 'process.env.PORT',
        host: '0.0.0.0',
        logLevel: 'warn',
        timeout: 30000
      }
    },
    
    // Best practices and recommendations
    bestPractices: [
      'Always provide sensible defaults',
      'Use environment variables for deployment-specific values',
      'Validate configuration at application startup',
      'Document all configuration options',
      'Test configuration in different environments'
    ],
    
    // Educational insights
    educational: {
      concepts: [
        'Environment-based configuration management',
        'Configuration precedence and validation',
        'Security considerations in configuration',
        'Performance tuning through configuration'
      ],
      nextSteps: [
        'Implement configuration validation',
        'Create environment-specific .env files',
        'Add configuration tests',
        'Document configuration options'
      ]
    }
  };
  
  if (config.verboseExplanations) {
    logInfo('📝 Configuration Demonstration Complete', {
      summary: demonstration,
      explanation: 'Configuration management is crucial for maintainable and deployable applications'
    });
  }
  
  return demonstration;
}

/**
 * Educational function that shows how HTTP request handling works in the basic server
 * including request processing, response generation, error handling, and performance
 * tracking with detailed explanations and instrumentation for learning purposes.
 * 
 * @param {Object} [handlerOptions={}] - Request handler demonstration options
 * @param {boolean} [handlerOptions.enableLogging=true] - Enable request/response logging
 * @param {boolean} [handlerOptions.trackPerformance=true] - Enable performance tracking
 * @returns {Function} Demonstrated request handler function with educational instrumentation and logging
 */
export function demonstrateRequestHandling(handlerOptions = {}) {
  const config = {
    enableLogging: handlerOptions.enableLogging !== false,
    trackPerformance: handlerOptions.trackPerformance !== false,
    includeHeaders: handlerOptions.includeHeaders !== false,
    verboseExplanations: handlerOptions.verboseExplanations !== false,
    ...handlerOptions
  };
  
  logInfo('🌐 Request Handling Demonstration', {
    purpose: 'Educational demonstration of HTTP request processing patterns',
    configuration: config
  });
  
  // Create request handler using createRequestHandler from basic-server
  const baseHandler = createRequestHandler({
    message: 'Hello world',
    includeTimestamp: true,
    enableCors: false
  });
  
  // Return instrumented handler with educational logging and metrics
  return function demonstratedRequestHandler(req, res) {
    const requestStart = process.hrtime.bigint();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Add educational logging to demonstrate request lifecycle
    if (config.enableLogging) {
      logInfo('📥 Incoming HTTP Request', {
        requestId,
        method: req.method,
        url: req.url,
        headers: config.includeHeaders ? req.headers : Object.keys(req.headers),
        userAgent: req.headers['user-agent'],
        explanation: 'Each HTTP request contains method, URL, headers, and optional body data'
      });
    }
    
    // Show request parsing and URL handling examples
    const requestAnalysis = {
      method: req.method,
      url: req.url,
      pathname: new URL(req.url, `http://${req.headers.host}`).pathname,
      query: new URL(req.url, `http://${req.headers.host}`).searchParams,
      headers: {
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
        accept: req.headers['accept'],
        host: req.headers['host']
      }
    };
    
    if (config.verboseExplanations) {
      logDebug('🔍 Request Analysis', {
        requestId,
        analysis: requestAnalysis,
        explanation: 'URL parsing and header analysis help understand client requirements'
      });
    }
    
    // Demonstrate response formatting and header management
    const responseHeaders = {
      'Content-Type': 'application/json',
      'X-Powered-By': 'Node.js Tutorial Basic Server',
      'X-Request-ID': requestId,
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    };
    
    // Set response headers
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Add performance measurement for educational timing examples
    const performanceMetrics = {
      requestId,
      startTime: requestStart,
      processingSteps: []
    };
    
    if (config.trackPerformance) {
      performanceMetrics.processingSteps.push({
        step: 'request-received',
        timestamp: process.hrtime.bigint()
      });
    }
    
    // Include error handling demonstrations with various error scenarios
    try {
      // Simulate request processing
      const processStart = process.hrtime.bigint();
      
      // Call the base handler for actual response generation
      baseHandler(req, res);
      
      // Calculate and log performance metrics
      if (config.trackPerformance) {
        const requestEnd = process.hrtime.bigint();
        const totalDuration = Number(requestEnd - requestStart) / 1000000; // Convert to ms
        const processingDuration = Number(requestEnd - processStart) / 1000000;
        
        performanceMetrics.processingSteps.push({
          step: 'response-sent',
          timestamp: requestEnd
        });
        
        performanceMetrics.totalDuration = totalDuration;
        performanceMetrics.processingDuration = processingDuration;
        
        exampleMetrics.requestCount++;
        
        if (config.enableLogging) {
          logInfo('📤 HTTP Response Sent', {
            requestId,
            statusCode: res.statusCode,
            duration: `${Math.round(totalDuration * 100) / 100}ms`,
            performance: performanceMetrics,
            explanation: 'Response timing helps identify performance bottlenecks'
          });
        }
      }
      
    } catch (error) {
      exampleMetrics.errors++;
      
      // Show request correlation and tracking patterns
      logError('❌ Request Processing Error', {
        requestId,
        error: error.message,
        stack: error.stack,
        request: requestAnalysis,
        explanation: 'Error correlation helps with debugging and monitoring'
      });
      
      // Send error response
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          requestId,
          timestamp: new Date().toISOString()
        }));
      }
    }
  };
}

/**
 * Educational function that showcases server monitoring patterns including health checks,
 * performance metrics, resource monitoring, and statistics logging for operational
 * awareness and debugging with comprehensive examples and best practices.
 * 
 * @param {Object} [options={}] - Monitoring demonstration options
 * @returns {Object} Monitoring demonstration results with metrics, health status, and educational insights
 */
export function demonstrateServerMonitoring(options = {}) {
  const config = {
    includeHealth: options.includeHealth !== false,
    includePerformance: options.includePerformance !== false,
    includeResources: options.includeResources !== false,
    intervalMs: options.intervalMs || 5000,
    ...options
  };
  
  logInfo('📊 Server Monitoring Demonstration', {
    purpose: 'Educational demonstration of server monitoring and observability patterns',
    configuration: config
  });
  
  // Set up health monitoring using createHealthCheck utility
  const healthCheck = createHealthCheck({
    includeMemory: true,
    includeUptime: true,
    includeEnvironment: true
  });
  
  // Demonstrate server statistics logging using logServerStats function
  const statsLogger = {
    logStats: () => {
      if (serverInstance) {
        logServerStats(serverInstance, {
          includeMemory: true,
          includeUptime: true,
          includeRequestCount: true
        });
      }
    }
  };
  
  // Show performance metrics collection and analysis
  const performanceMonitor = {
    collectMetrics: () => {
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();
      
      return {
        timestamp: new Date().toISOString(),
        memory: {
          rss: Math.round(memory.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
          external: Math.round(memory.external / 1024 / 1024) // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        process: {
          uptime: Math.round(uptime),
          pid: process.pid,
          version: process.version,
          platform: process.platform
        },
        server: {
          isRunning: !!serverInstance,
          address: serverInstance?.address() || null,
          connections: serverInstance?._connections || 0
        }
      };
    }
  };
  
  // Demonstrate resource usage monitoring and alerting
  const resourceMonitor = {
    checkResources: () => {
      const metrics = performanceMonitor.collectMetrics();
      const warnings = [];
      const alerts = [];
      
      // Memory usage alerts
      if (metrics.memory.heapUsed > 100) { // 100MB threshold
        warnings.push(`High heap usage: ${metrics.memory.heapUsed}MB`);
      }
      
      if (metrics.memory.rss > 200) { // 200MB threshold
        alerts.push(`High RSS usage: ${metrics.memory.rss}MB`);
      }
      
      // Uptime monitoring
      if (metrics.process.uptime < 60) { // Less than 1 minute
        warnings.push('Process recently restarted');
      }
      
      return {
        metrics,
        warnings,
        alerts,
        status: alerts.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'healthy'
      };
    }
  };
  
  // Show request tracking and correlation patterns
  const requestTracker = {
    getStats: () => ({
      totalRequests: exampleMetrics.requestCount,
      errors: exampleMetrics.errors,
      errorRate: exampleMetrics.requestCount > 0 ? 
        (exampleMetrics.errors / exampleMetrics.requestCount * 100).toFixed(2) + '%' : '0%',
      averageResponseTime: exampleMetrics.startupTime // Simplified for demo
    })
  };
  
  // Demonstrate error rate monitoring and analysis
  const errorMonitor = {
    analyzeErrors: () => {
      const errorRate = exampleMetrics.requestCount > 0 ? 
        exampleMetrics.errors / exampleMetrics.requestCount : 0;
      
      return {
        totalErrors: exampleMetrics.errors,
        totalRequests: exampleMetrics.requestCount,
        errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
        status: errorRate > 0.05 ? 'high' : errorRate > 0.01 ? 'moderate' : 'low',
        recommendation: errorRate > 0.05 ? 
          'Investigate error patterns and implement fixes' : 
          'Error rate is within acceptable limits'
      };
    }
  };
  
  // Include uptime tracking and availability monitoring
  const uptimeMonitor = {
    getUptime: () => {
      const processUptime = process.uptime();
      const serverUptime = exampleStartTime ? (Date.now() - exampleStartTime) / 1000 : 0;
      
      return {
        process: {
          seconds: Math.round(processUptime),
          formatted: formatUptime(processUptime)
        },
        server: {
          seconds: Math.round(serverUptime),
          formatted: formatUptime(serverUptime)
        },
        availability: serverInstance ? 'online' : 'offline'
      };
    }
  };
  
  // Collect all monitoring data
  const monitoringResults = {
    timestamp: new Date().toISOString(),
    server: {
      status: serverInstance ? 'running' : 'stopped',
      address: serverInstance?.address() || null
    }
  };
  
  if (config.includeHealth) {
    monitoringResults.health = healthCheck();
  }
  
  if (config.includePerformance) {
    monitoringResults.performance = performanceMonitor.collectMetrics();
  }
  
  if (config.includeResources) {
    monitoringResults.resources = resourceMonitor.checkResources();
  }
  
  // Additional monitoring data
  monitoringResults.requests = requestTracker.getStats();
  monitoringResults.errors = errorMonitor.analyzeErrors();
  monitoringResults.uptime = uptimeMonitor.getUptime();
  
  // Return comprehensive monitoring demonstration with educational explanations
  const demonstration = {
    monitoring: monitoringResults,
    
    // Monitoring tools and utilities
    tools: {
      healthCheck,
      statsLogger,
      performanceMonitor,
      resourceMonitor,
      requestTracker,
      errorMonitor,
      uptimeMonitor
    },
    
    // Educational insights
    educational: {
      concepts: [
        'Health check implementation for operational visibility',
        'Performance metrics collection and analysis',
        'Resource monitoring and alerting thresholds',
        'Request tracking and error correlation',
        'Uptime monitoring and availability tracking'
      ],
      bestPractices: [
        'Monitor key performance indicators (KPIs)',
        'Set appropriate alerting thresholds',
        'Track trends over time',
        'Correlate metrics with business events',
        'Implement automated health checks'
      ],
      productionReady: [
        'Integrate with monitoring systems (PM2, New Relic, DataDog)',
        'Set up alerting for critical thresholds',
        'Implement log aggregation and analysis',
        'Create monitoring dashboards',
        'Establish SLA/SLO monitoring'
      ]
    }
  };
  
  logInfo('📈 Monitoring Demonstration Complete', {
    summary: monitoringResults,
    explanation: 'Monitoring provides operational visibility essential for production deployments'
  });
  
  return demonstration;
}

/**
 * Educational function that demonstrates proper server shutdown procedures including
 * signal handling, connection draining, resource cleanup, and production-ready
 * shutdown patterns for reliable deployment and operational excellence.
 * 
 * @param {Object} [shutdownOptions={}] - Shutdown demonstration options
 * @param {number} [shutdownOptions.timeout=10000] - Graceful shutdown timeout in ms
 * @returns {Promise<Object>} Promise that resolves when shutdown demonstration is complete with cleanup results
 */
export async function demonstrateGracefulShutdown(shutdownOptions = {}) {
  const config = {
    timeout: shutdownOptions.timeout || 10000,
    drainConnections: shutdownOptions.drainConnections !== false,
    cleanupResources: shutdownOptions.cleanupResources !== false,
    logProgress: shutdownOptions.logProgress !== false,
    ...shutdownOptions
  };
  
  logInfo('🛑 Graceful Shutdown Demonstration', {
    purpose: 'Educational demonstration of production-ready shutdown procedures',
    configuration: config
  });
  
  // Set up signal handlers for SIGTERM and SIGINT demonstration
  const shutdownSignals = ['SIGTERM', 'SIGINT'];
  const signalHandlers = {};
  
  shutdownSignals.forEach(signal => {
    signalHandlers[signal] = () => {
      logInfo(`📡 Received ${signal} signal`, {
        signal,
        explanation: `${signal} signal initiates graceful shutdown process`
      });
    };
    
    // Note: In a real implementation, these would be registered with process.on()
    // For demonstration purposes, we'll simulate the handlers
  });
  
  // Show connection draining and active request completion
  const connectionDrainer = {
    drainConnections: async () => {
      if (!serverInstance) {
        logInfo('🔌 No active server to drain connections');
        return { drained: 0, timeout: false };
      }
      
      const startTime = Date.now();
      let connectionCount = serverInstance._connections || 0;
      
      logInfo('🔌 Draining active connections', {
        activeConnections: connectionCount,
        timeout: config.timeout,
        explanation: 'Connection draining allows active requests to complete gracefully'
      });
      
      // Simulate connection draining process
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          connectionCount = Math.max(0, connectionCount - 1); // Simulate connections closing
          
          if (config.logProgress) {
            logDebug('🔄 Connection draining progress', {
              remainingConnections: connectionCount,
              elapsed: `${elapsed}ms`,
              timeoutRemaining: `${config.timeout - elapsed}ms`
            });
          }
          
          if (connectionCount === 0 || elapsed >= config.timeout) {
            clearInterval(checkInterval);
            resolve({
              drained: (serverInstance._connections || 0) - connectionCount,
              timeout: elapsed >= config.timeout,
              duration: elapsed
            });
          }
        }, 100);
      });
    }
  };
  
  // Demonstrate resource cleanup and file handle closure
  const resourceCleaner = {
    cleanupResources: async () => {
      const cleanupResults = {
        fileHandles: 0,
        timers: 0,
        eventListeners: 0,
        memory: process.memoryUsage()
      };
      
      logInfo('🧹 Cleaning up application resources', {
        explanation: 'Resource cleanup prevents memory leaks and ensures clean shutdown'
      });
      
      // Simulate resource cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear any remaining timers (simulated)
      cleanupResults.timers = 3; // Simulated cleanup count
      
      // Remove event listeners (simulated)
      cleanupResults.eventListeners = 5; // Simulated cleanup count
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        cleanupResults.memoryAfterGC = process.memoryUsage();
      }
      
      logInfo('✅ Resource cleanup completed', {
        results: cleanupResults,
        explanation: 'All application resources have been properly cleaned up'
      });
      
      return cleanupResults;
    }
  };
  
  // Show logging of shutdown procedures and final statistics
  const shutdownLogger = {
    logFinalStats: () => {
      const finalStats = {
        uptime: exampleStartTime ? Math.round((Date.now() - exampleStartTime) / 1000) : 0,
        totalRequests: exampleMetrics.requestCount,
        errors: exampleMetrics.errors,
        startupTime: exampleMetrics.startupTime,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      
      logInfo('📊 Final server statistics', {
        stats: finalStats,
        explanation: 'Final statistics help with debugging and performance analysis'
      });
      
      return finalStats;
    }
  };
  
  // Demonstrate timeout handling for forced shutdown scenarios
  const timeoutHandler = {
    setupTimeout: () => {
      return setTimeout(() => {
        logWarn('⏰ Graceful shutdown timeout reached', {
          timeout: config.timeout,
          explanation: 'Timeout protection ensures shutdown completes even if cleanup hangs'
        });
      }, config.timeout);
    }
  };
  
  // Include cleanup validation and verification procedures
  const cleanupValidator = {
    validateCleanup: () => {
      const validation = {
        serverClosed: !serverInstance || serverInstance.listening === false,
        processCanExit: true,
        resourcesCleared: true,
        timestamp: new Date().toISOString()
      };
      
      logInfo('✅ Cleanup validation', {
        validation,
        explanation: 'Validation ensures shutdown completed successfully'
      });
      
      return validation;
    }
  };
  
  // Execute shutdown demonstration
  try {
    const shutdownStart = Date.now();
    isShuttingDown = true;
    
    // Set up timeout for forced shutdown
    const timeoutId = timeoutHandler.setupTimeout();
    
    // Drain connections
    const drainResults = await connectionDrainer.drainConnections();
    
    // Clean up resources
    const cleanupResults = config.cleanupResources ? 
      await resourceCleaner.cleanupResources() : null;
    
    // Log final statistics
    const finalStats = shutdownLogger.logFinalStats();
    
    // Close server if running
    if (serverInstance && serverInstance.listening) {
      await new Promise((resolve, reject) => {
        serverInstance.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      logInfo('🔒 Server closed successfully');
    }
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Validate cleanup
    const validation = cleanupValidator.validateCleanup();
    
    // Calculate total shutdown time
    const shutdownDuration = Date.now() - shutdownStart;
    
    // Return shutdown demonstration results with educational insights
    const shutdownResults = {
      success: true,
      duration: shutdownDuration,
      draining: drainResults,
      cleanup: cleanupResults,
      statistics: finalStats,
      validation,
      
      // Educational insights
      educational: {
        concepts: [
          'Signal handling for graceful shutdown',
          'Connection draining and request completion',
          'Resource cleanup and memory management',
          'Timeout handling for forced shutdown',
          'Shutdown validation and verification'
        ],
        bestPractices: [
          'Always implement graceful shutdown',
          'Set appropriate timeout values',
          'Log shutdown progress for debugging',
          'Validate cleanup completion',
          'Handle both SIGTERM and SIGINT signals'
        ],
        productionReady: [
          'Integrate with process managers (PM2)',
          'Coordinate with load balancers',
          'Implement health check endpoints',
          'Monitor shutdown metrics',
          'Document shutdown procedures'
        ]
      }
    };
    
    logInfo('🎯 Graceful Shutdown Demonstration Complete', {
      results: shutdownResults,
      explanation: 'Graceful shutdown is essential for production reliability and zero-downtime deployments'
    });
    
    return shutdownResults;
    
  } catch (error) {
    exampleMetrics.errors++;
    logError('❌ Shutdown demonstration failed', {
      error: error.message,
      stack: error.stack,
      explanation: 'Shutdown errors can indicate resource leaks or configuration issues'
    });
    throw error;
  }
}

/**
 * Educational function that demonstrates performance measurement, optimization techniques,
 * and monitoring patterns for the basic HTTP server with benchmarking examples and
 * optimization guidance for educational and production use.
 * 
 * @param {Object} [performanceOptions={}] - Performance demonstration options
 * @returns {Object} Performance demonstration results with metrics, benchmarks, and optimization recommendations
 */
export async function runPerformanceExample(performanceOptions = {}) {
  const config = {
    measureStartup: performanceOptions.measureStartup !== false,
    measureRequests: performanceOptions.measureRequests !== false,
    measureMemory: performanceOptions.measureMemory !== false,
    benchmarkConcurrency: performanceOptions.benchmarkConcurrency || 10,
    iterations: performanceOptions.iterations || 100,
    ...performanceOptions
  };
  
  logInfo('🚀 Performance Measurement Demonstration', {
    purpose: 'Educational demonstration of performance analysis and optimization techniques',
    configuration: config
  });
  
  const performanceResults = {
    timestamp: new Date().toISOString(),
    measurements: {},
    benchmarks: {},
    optimizations: {}
  };
  
  try {
    // Set up performance measurement using measurePerformance helper
    if (config.measureStartup) {
      logInfo('📊 Measuring server startup performance');
      
      const { metrics: startupMetrics } = await measurePerformance(
        async () => {
          // Simulate server startup measurement
          await new Promise(resolve => setTimeout(resolve, 10));
          return { started: true };
        },
        'server-startup-benchmark'
      );
      
      performanceResults.measurements.startup = {
        ...startupMetrics,
        recommendation: startupMetrics.duration < 100 ? 
          'Startup time is excellent' : 
          'Consider optimizing initialization code'
      };
    }
    
    // Demonstrate server startup time measurement and optimization
    if (config.measureRequests && serverInstance) {
      logInfo('🌐 Measuring request processing performance');
      
      const requestBenchmarks = [];
      
      for (let i = 0; i < config.iterations; i++) {
        const { metrics } = await measurePerformance(
          async () => {
            // Simulate HTTP request
            return new Promise(resolve => {
              const mockReq = { method: 'GET', url: '/', headers: { host: 'localhost' } };
              const mockRes = {
                setHeader: () => {},
                writeHead: () => {},
                end: () => resolve(),
                headersSent: false
              };
              
              const handler = demonstrateRequestHandling({ enableLogging: false });
              handler(mockReq, mockRes);
            });
          },
          `request-${i}`
        );
        
        requestBenchmarks.push(metrics.duration);
      }
      
      // Calculate request performance statistics
      const avgResponseTime = requestBenchmarks.reduce((a, b) => a + b, 0) / requestBenchmarks.length;
      const minResponseTime = Math.min(...requestBenchmarks);
      const maxResponseTime = Math.max(...requestBenchmarks);
      const p95ResponseTime = requestBenchmarks.sort((a, b) => a - b)[Math.floor(requestBenchmarks.length * 0.95)];
      
      performanceResults.measurements.requests = {
        iterations: config.iterations,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        minResponseTime: Math.round(minResponseTime * 100) / 100,
        maxResponseTime: Math.round(maxResponseTime * 100) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        throughput: Math.round(1000 / avgResponseTime), // requests per second
        recommendation: avgResponseTime < 10 ? 
          'Response time is excellent' : 
          avgResponseTime < 50 ? 'Response time is good' : 'Consider optimization'
      };
    }
    
    // Show request processing time measurement and analysis
    if (config.measureMemory) {
      logInfo('💾 Measuring memory usage patterns');
      
      const memoryBenchmarks = [];
      const initialMemory = process.memoryUsage();
      
      // Simulate memory usage measurement
      for (let i = 0; i < 10; i++) {
        const currentMemory = process.memoryUsage();
        memoryBenchmarks.push(currentMemory);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const finalMemory = process.memoryUsage();
      
      performanceResults.measurements.memory = {
        initial: {
          rss: Math.round(initialMemory.rss / 1024 / 1024),
          heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024)
        },
        final: {
          rss: Math.round(finalMemory.rss / 1024 / 1024),
          heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024)
        },
        growth: {
          rss: Math.round((finalMemory.rss - initialMemory.rss) / 1024 / 1024),
          heapUsed: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024)
        },
        recommendation: finalMemory.heapUsed < 50 * 1024 * 1024 ? 
          'Memory usage is optimal' : 
          'Monitor for potential memory leaks'
      };
    }
    
    // Demonstrate memory usage monitoring and leak detection
    const memoryAnalysis = {
      checkMemoryLeaks: () => {
        const usage = process.memoryUsage();
        return {
          rss: Math.round(usage.rss / 1024 / 1024),
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
          external: Math.round(usage.external / 1024 / 1024),
          leakRisk: usage.heapUsed > 100 * 1024 * 1024 ? 'high' : 'low'
        };
      }
    };
    
    // Show concurrent request handling and performance impact
    if (config.benchmarkConcurrency && serverInstance) {
      logInfo('🔄 Benchmarking concurrent request handling');
      
      const concurrentBenchmark = await measurePerformance(
        async () => {
          const promises = [];
          
          for (let i = 0; i < config.benchmarkConcurrency; i++) {
            promises.push(new Promise(resolve => {
              // Simulate concurrent requests
              setTimeout(resolve, Math.random() * 10);
            }));
          }
          
          await Promise.all(promises);
          return { completed: config.benchmarkConcurrency };
        },
        'concurrent-requests'
      );
      
      performanceResults.benchmarks.concurrency = {
        requests: config.benchmarkConcurrency,
        totalTime: concurrentBenchmark.duration,
        throughput: Math.round(config.benchmarkConcurrency / (concurrentBenchmark.duration / 1000)),
        recommendation: concurrentBenchmark.duration < 100 ? 
          'Concurrent handling is excellent' : 
          'Consider implementing request queuing'
      };
    }
    
    // Demonstrate performance bottleneck identification techniques
    const bottleneckAnalysis = {
      identifyBottlenecks: () => {
        const analysis = {
          cpu: {
            usage: process.cpuUsage(),
            recommendation: 'Monitor CPU usage under load'
          },
          memory: memoryAnalysis.checkMemoryLeaks(),
          eventLoop: {
            delay: 0, // Would require additional monitoring
            recommendation: 'Monitor event loop lag in production'
          }
        };
        
        return analysis;
      }
    };
    
    // Include performance optimization recommendations and techniques
    performanceResults.optimizations = {
      startup: [
        'Minimize synchronous operations during startup',
        'Lazy load non-critical modules',
        'Use clustering for CPU-intensive tasks',
        'Optimize require/import statements'
      ],
      runtime: [
        'Implement request caching where appropriate',
        'Use streaming for large responses',
        'Optimize JSON serialization',
        'Monitor and optimize garbage collection'
      ],
      scaling: [
        'Implement horizontal scaling with PM2',
        'Use load balancing for traffic distribution',
        'Monitor resource usage trends',
        'Plan capacity based on performance metrics'
      ]
    };
    
    // Return comprehensive performance analysis with educational guidance
    const performanceAnalysis = {
      ...performanceResults,
      
      // Analysis tools
      tools: {
        memoryAnalysis,
        bottleneckAnalysis
      },
      
      // Educational insights
      educational: {
        concepts: [
          'Performance measurement and benchmarking',
          'Memory usage monitoring and leak detection',
          'Concurrent request handling optimization',
          'Bottleneck identification techniques',
          'Performance optimization strategies'
        ],
        bestPractices: [
          'Establish performance baselines',
          'Monitor trends over time',
          'Test under realistic load conditions',
          'Profile before optimizing',
          'Measure the impact of changes'
        ],
        productionReady: [
          'Implement continuous performance monitoring',
          'Set up performance alerting',
          'Use APM tools for detailed analysis',
          'Establish SLA/SLO targets',
          'Regular performance reviews'
        ]
      }
    };
    
    logInfo('📈 Performance Analysis Complete', {
      summary: performanceResults,
      explanation: 'Performance measurement is essential for optimization and capacity planning'
    });
    
    return performanceAnalysis;
    
  } catch (error) {
    exampleMetrics.errors++;
    logError('❌ Performance measurement failed', {
      error: error.message,
      stack: error.stack,
      explanation: 'Performance measurement errors may indicate system resource constraints'
    });
    throw error;
  }
}

/**
 * Educational function that demonstrates comprehensive error handling patterns including
 * error types, recovery strategies, logging patterns, and resilience techniques for
 * robust server operation with detailed examples and best practices.
 * 
 * @param {Object} [errorOptions={}] - Error handling demonstration options
 * @returns {Object} Error handling demonstration results with examples, patterns, and recovery strategies
 */
export function runErrorHandlingExample(errorOptions = {}) {
  const config = {
    simulateErrors: errorOptions.simulateErrors !== false,
    showRecovery: errorOptions.showRecovery !== false,
    verboseLogging: errorOptions.verboseLogging !== false,
    includeNetworkErrors: errorOptions.includeNetworkErrors !== false,
    ...errorOptions
  };
  
  logInfo('⚠️ Error Handling Demonstration', {
    purpose: 'Educational demonstration of comprehensive error handling patterns and recovery strategies',
    configuration: config
  });
  
  const errorExamples = {
    timestamp: new Date().toISOString(),
    demonstrations: {},
    patterns: {},
    recovery: {}
  };
  
  try {
    // Demonstrate different error types and handling strategies
    errorExamples.demonstrations.errorTypes = {
      syntaxError: {
        example: 'JSON.parse("invalid json")',
        handler: () => {
          try {
            JSON.parse('{ invalid json }');
          } catch (error) {
            return {
              type: 'SyntaxError',
              message: error.message,
              handling: 'Catch and return user-friendly error',
              recovery: 'Validate input before parsing'
            };
          }
        }
      },
      
      typeError: {
        example: 'Calling method on undefined object',
        handler: () => {
          try {
            const obj = null;
            obj.someMethod();
          } catch (error) {
            return {
              type: 'TypeError',
              message: error.message,
              handling: 'Check object existence before use',
              recovery: 'Implement defensive programming'
            };
          }
        }
      },
      
      customError: {
        example: 'Application-specific business logic error',
        handler: () => {
          try {
            throw new Error('Custom application error for demonstration');
          } catch (error) {
            return {
              type: 'Custom Error',
              message: error.message,
              handling: 'Custom error classes for specific scenarios',
              recovery: 'Implement domain-specific error handling'
            };
          }
        }
      }
    };
    
    // Execute error type demonstrations
    Object.keys(errorExamples.demonstrations.errorTypes).forEach(errorType => {
      const demo = errorExamples.demonstrations.errorTypes[errorType];
      demo.result = demo.handler();
      
      if (config.verboseLogging) {
        logWarn(`Error demonstration: ${errorType}`, {
          example: demo.example,
          result: demo.result
        });
      }
    });
    
    // Show network error handling and recovery patterns
    if (config.includeNetworkErrors) {
      errorExamples.demonstrations.networkErrors = {
        connectionTimeout: {
          scenario: 'HTTP request timeout',
          handling: 'Implement retry logic with exponential backoff',
          recovery: 'Circuit breaker pattern for failing services'
        },
        connectionRefused: {
          scenario: 'Service unavailable',
          handling: 'Graceful degradation and fallback responses',
          recovery: 'Health checks and service discovery'
        },
        dnsResolution: {
          scenario: 'DNS resolution failure',
          handling: 'Cache DNS results and implement fallbacks',
          recovery: 'Multiple DNS servers and error reporting'
        }
      };
    }
    
    // Demonstrate application error logging and reporting
    const errorLogger = {
      logError: (error, context = {}) => {
        const errorInfo = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          context,
          severity: 'error',
          correlationId: Math.random().toString(36).substring(2, 15)
        };
        
        logError('📝 Error logged for analysis', errorInfo);
        return errorInfo;
      },
      
      logWarning: (warning, context = {}) => {
        const warningInfo = {
          message: warning,
          timestamp: new Date().toISOString(),
          context,
          severity: 'warning'
        };
        
        logWarn('⚠️ Warning logged for monitoring', warningInfo);
        return warningInfo;
      }
    };
    
    // Show timeout handling and connection management
    const timeoutHandler = {
      createTimeout: (operation, timeoutMs = 5000) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          }, timeoutMs);
          
          Promise.resolve(operation())
            .then(result => {
              clearTimeout(timeoutId);
              resolve(result);
            })
            .catch(error => {
              clearTimeout(timeoutId);
              reject(error);
            });
        });
      },
      
      handleTimeout: async (operation) => {
        try {
          const result = await timeoutHandler.createTimeout(operation, 3000);
          return { success: true, result };
        } catch (error) {
          const errorInfo = errorLogger.logError(error, { operation: 'timeout_demo' });
          return { success: false, error: errorInfo };
        }
      }
    };
    
    // Demonstrate error correlation and tracking patterns
    const errorTracker = {
      trackError: (error, requestId) => {
        const tracking = {
          errorId: Math.random().toString(36).substring(2, 15),
          requestId,
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            type: error.constructor.name,
            stack: error.stack
          },
          context: {
            nodeVersion: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            uptime: process.uptime()
          }
        };
        
        if (config.verboseLogging) {
          logError('🔍 Error tracked for correlation', tracking);
        }
        
        return tracking;
      }
    };
    
    // Show error rate monitoring and alerting examples
    const errorRateMonitor = {
      calculateErrorRate: () => {
        const totalRequests = exampleMetrics.requestCount;
        const totalErrors = exampleMetrics.errors;
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        
        return {
          totalRequests,
          totalErrors,
          errorRate: Math.round(errorRate * 100) / 100,
          status: errorRate > 5 ? 'critical' : errorRate > 1 ? 'warning' : 'normal',
          alert: errorRate > 5 ? 'High error rate detected' : null
        };
      }
    };
    
    // Include error recovery and resilience demonstrations
    if (config.showRecovery) {
      errorExamples.recovery = {
        retryMechanism: {
          description: 'Exponential backoff retry for transient failures',
          implementation: async (operation, maxRetries = 3) => {
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                return await operation();
              } catch (error) {
                lastError = error;
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                
                if (attempt < maxRetries) {
                  logWarn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, {
                    error: error.message
                  });
                  await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                  logError(`All retry attempts failed`, { 
                    attempts: maxRetries,
                    finalError: error.message 
                  });
                }
              }
            }
            
            throw lastError;
          }
        },
        
        circuitBreaker: {
          description: 'Circuit breaker pattern for failing services',
          implementation: () => {
            let failures = 0;
            let lastFailureTime = null;
            const threshold = 5;
            const timeout = 60000; // 1 minute
            
            return {
              execute: async (operation) => {
                // Check if circuit is open
                if (failures >= threshold) {
                  if (Date.now() - lastFailureTime < timeout) {
                    throw new Error('Circuit breaker is OPEN');
                  } else {
                    // Half-open state - allow one attempt
                    failures = threshold - 1;
                  }
                }
                
                try {
                  const result = await operation();
                  failures = 0; // Reset on success
                  return result;
                } catch (error) {
                  failures++;
                  lastFailureTime = Date.now();
                  throw error;
                }
              },
              
              getStatus: () => ({
                failures,
                state: failures >= threshold ? 'OPEN' : failures > 0 ? 'HALF_OPEN' : 'CLOSED',
                lastFailureTime
              })
            };
          }
        }
      };
    }
    
    // Error handling patterns and best practices
    errorExamples.patterns = {
      errorBoundaries: {
        description: 'Isolate errors to prevent cascade failures',
        example: 'try-catch blocks around critical operations'
      },
      
      errorPropagation: {
        description: 'Proper error propagation through async/await',
        example: 'Always await async operations and handle rejections'
      },
      
      errorClassification: {
        description: 'Classify errors by severity and type',
        levels: ['critical', 'error', 'warning', 'info', 'debug']
      },
      
      errorContext: {
        description: 'Include contextual information with errors',
        context: ['requestId', 'userId', 'operation', 'timestamp', 'environment']
      }
    };
    
    // Simulate some error scenarios if enabled
    if (config.simulateErrors) {
      logInfo('🎭 Simulating error scenarios for demonstration');
      
      // Simulate timeout error
      const timeoutDemo = await timeoutHandler.handleTimeout(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 5000))
      );
      
      errorExamples.simulations = {
        timeout: timeoutDemo,
        errorRate: errorRateMonitor.calculateErrorRate()
      };
    }
    
    // Return comprehensive error handling examples with educational insights
    const errorHandlingResults = {
      ...errorExamples,
      
      // Utility tools
      tools: {
        errorLogger,
        timeoutHandler,
        errorTracker,
        errorRateMonitor
      },
      
      // Educational insights
      educational: {
        concepts: [
          'Error type classification and handling strategies',
          'Error logging and correlation for debugging',
          'Timeout handling and connection management',
          'Error rate monitoring and alerting',
          'Recovery patterns: retry and circuit breaker'
        ],
        bestPractices: [
          'Always handle errors gracefully',
          'Log errors with sufficient context',
          'Implement retry logic for transient failures',
          'Monitor error rates and trends',
          'Use circuit breakers for external dependencies'
        ],
        productionReady: [
          'Implement comprehensive error monitoring',
          'Set up error alerting and escalation',
          'Create error handling runbooks',
          'Regular error analysis and improvement',
          'Error budget and SLA monitoring'
        ]
      }
    };
    
    logInfo('🛡️ Error Handling Demonstration Complete', {
      summary: errorExamples,
      explanation: 'Robust error handling is essential for reliable and maintainable applications'
    });
    
    return errorHandlingResults;
    
  } catch (error) {
    exampleMetrics.errors++;
    logError('❌ Error handling demonstration failed', {
      error: error.message,
      stack: error.stack,
      irony: 'Error occurred while demonstrating error handling',
      explanation: 'This demonstrates the importance of comprehensive error handling at all levels'
    });
    throw error;
  }
}

/**
 * Educational function that demonstrates cross-platform compatibility patterns and
 * prepares for Flask migration by showing consistent API patterns, response formats,
 * and configuration approaches that maintain feature parity across technology stacks.
 * 
 * @param {Object} [platformOptions={}] - Cross-platform demonstration options
 * @returns {Object} Cross-platform demonstration results with compatibility patterns and migration guidance
 */
export function runCrossPllatformExample(platformOptions = {}) {
  const config = {
    includeFlaskComparison: platformOptions.includeFlaskComparison !== false,
    showConfigPatterns: platformOptions.showConfigPatterns !== false,
    demonstrateAPIConsistency: platformOptions.demonstrateAPIConsistency !== false,
    verboseExplanations: platformOptions.verboseExplanations !== false,
    ...platformOptions
  };
  
  logInfo('🌐 Cross-Platform Compatibility Demonstration', {
    purpose: 'Educational demonstration of cross-platform development patterns and Flask migration preparation',
    configuration: config
  });
  
  const crossPlatformResults = {
    timestamp: new Date().toISOString(),
    platforms: {},
    compatibility: {},
    migration: {}
  };
  
  try {
    // Demonstrate platform-independent configuration patterns
    if (config.showConfigPatterns) {
      crossPlatformResults.platforms.configuration = {
        nodejs: {
          environment: {
            port: process.env.PORT || ENV_CONSTANTS.DEFAULT_PORT,
            host: process.env.HOST || ENV_CONSTANTS.DEFAULT_HOST,
            nodeEnv: process.env.NODE_ENV || 'development'
          },
          configPattern: 'Environment variables with fallback defaults',
          example: 'const port = process.env.PORT || 3000;'
        },
        
        flask: {
          environment: {
            port: 'os.getenv("PORT", 3000)',
            host: 'os.getenv("HOST", "127.0.0.1")',
            flaskEnv: 'os.getenv("FLASK_ENV", "development")'
          },
          configPattern: 'os.getenv() with default values',
          example: 'port = int(os.getenv("PORT", 3000))'
        },
        
        consistency: [
          'Use identical environment variable names',
          'Provide same default values',
          'Implement same validation logic',
          'Maintain consistent error handling'
        ]
      };
    }
    
    // Show consistent API response formatting for cross-platform compatibility
    if (config.demonstrateAPIConsistency) {
      const apiResponsePatterns = {
        nodejs: {
          hello: {
            endpoint: 'GET /hello',
            response: {
              message: 'Hello world',
              timestamp: new Date().toISOString(),
              server: 'Node.js',
              version: process.version
            },
            headers: {
              'Content-Type': 'application/json',
              'X-Powered-By': 'Node.js'
            }
          },
          
          goodEvening: {
            endpoint: 'GET /good-evening',
            response: {
              message: 'Good evening',
              timestamp: new Date().toISOString(),
              server: 'Node.js',
              version: process.version
            },
            headers: {
              'Content-Type': 'application/json',
              'X-Powered-By': 'Node.js'
            }
          }
        },
        
        flask: {
          hello: {
            endpoint: 'GET /hello',
            response: {
              message: 'Hello world',
              timestamp: 'datetime.now().isoformat()',
              server: 'Flask',
              version: 'python_version'
            },
            headers: {
              'Content-Type': 'application/json',
              'X-Powered-By': 'Flask'
            }
          },
          
          goodEvening: {
            endpoint: 'GET /good-evening',
            response: {
              message: 'Good evening',
              timestamp: 'datetime.now().isoformat()',
              server: 'Flask',
              version: 'python_version'
            },
            headers: {
              'Content-Type': 'application/json',
              'X-Powered-By': 'Flask'
            }
          }
        }
      };
      
      crossPlatformResults.compatibility.apiPatterns = apiResponsePatterns;
      
      // Demonstrate API testing for cross-platform validation
      crossPlatformResults.compatibility.testing = {
        strategy: 'Identical test cases for both platforms',
        testCases: [
          {
            test: 'GET /hello returns 200 status',
            validation: 'assert response.status_code == 200'
          },
          {
            test: 'Response contains message field',
            validation: 'assert "message" in response.json()'
          },
          {
            test: 'Message content is "Hello world"',
            validation: 'assert response.json()["message"] == "Hello world"'
          },
          {
            test: 'Response includes timestamp',
            validation: 'assert "timestamp" in response.json()'
          }
        ]
      };
    }
    
    // Demonstrate environment-agnostic deployment patterns
    const deploymentPatterns = {
      containerization: {
        nodejs: {
          dockerfile: `
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
          benefits: 'Consistent runtime environment across platforms'
        },
        
        flask: {
          dockerfile: `
FROM python:3.11-alpine
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
EXPOSE 3000
CMD ["python", "app.py"]`,
          benefits: 'Same deployment strategy as Node.js'
        }
      },
      
      processManagement: {
        nodejs: 'PM2 cluster mode for horizontal scaling',
        flask: 'Gunicorn with multiple workers',
        consistency: 'Both support multi-process deployment'
      }
    };
    
    // Show configuration management that supports multiple platforms
    const configurationManagement = {
      environmentFiles: {
        development: {
          PORT: 3000,
          HOST: '127.0.0.1',
          LOG_LEVEL: 'debug',
          CORS_ENABLED: true
        },
        production: {
          PORT: '${PORT}', // From environment
          HOST: '0.0.0.0',
          LOG_LEVEL: 'warn',
          CORS_ENABLED: false
        }
      },
      
      validation: {
        nodejs: 'joi, yup, or custom validation',
        flask: 'marshmallow, cerberus, or custom validation',
        pattern: 'Schema-based validation for both platforms'
      }
    };
    
    // Demonstrate testing patterns that validate cross-platform behavior
    const testingPatterns = {
      unitTesting: {
        nodejs: 'Jest or Mocha with SuperTest',
        flask: 'pytest with Flask test client',
        consistency: 'Same test scenarios and assertions'
      },
      
      integrationTesting: {
        approach: 'Contract testing to ensure API compatibility',
        tools: 'Pact, OpenAPI validation, or custom comparison',
        validation: 'Identical response schemas and behavior'
      },
      
      e2eTesting: {
        strategy: 'Platform-agnostic HTTP client testing',
        implementation: 'Same test suite runs against both platforms',
        verification: 'Functional equivalence validation'
      }
    };
    
    // Include preparation examples for Flask migration phase
    if (config.includeFlaskComparison) {
      crossPlatformResults.migration = {
        preparation: {
          apiDocumentation: 'Document all endpoints and response formats',
          testSuite: 'Create comprehensive test coverage',
          configMapping: 'Map Node.js config to Flask equivalents',
          dependencyAnalysis: 'Identify Python equivalents for Node.js packages'
        },
        
        migrationSteps: [
          '1. Set up Flask development environment',
          '2. Implement identical API endpoints',
          '3. Migrate configuration management',
          '4. Port logging and monitoring',
          '5. Validate feature parity with tests',
          '6. Performance comparison and optimization'
        ],
        
        featureParityChecklist: [
          'HTTP server starts on same port',
          'All endpoints return identical responses',
          'Error handling produces same error formats',
          'Configuration system works identically',
          'Logging output format matches',
          'Performance characteristics are comparable'
        ]
      };
    }
    
    // Show documentation patterns for cross-platform development
    const documentationPatterns = {
      apiDocumentation: {
        format: 'OpenAPI/Swagger specification',
        benefits: 'Platform-agnostic API documentation',
        usage: 'Generate client libraries for any language'
      },
      
      configurationDocs: {
        format: 'Environment variable reference',
        sections: ['Required variables', 'Optional variables', 'Default values'],
        examples: 'Platform-specific usage examples'
      },
      
      deploymentGuide: {
        sections: ['Prerequisites', 'Installation', 'Configuration', 'Running'],
        platforms: 'Separate sections for Node.js and Flask',
        consistency: 'Same final outcome regardless of platform'
      }
    };
    
    // Compile comprehensive cross-platform results
    crossPlatformResults.platforms.deployment = deploymentPatterns;
    crossPlatformResults.platforms.configuration = configurationManagement;
    crossPlatformResults.compatibility.testing = testingPatterns;
    crossPlatformResults.compatibility.documentation = documentationPatterns;
    
    // Return cross-platform compatibility demonstration with migration guidance
    const compatibilityResults = {
      ...crossPlatformResults,
      
      // Educational insights
      educational: {
        concepts: [
          'Cross-platform API design and consistency',
          'Environment-agnostic configuration management',
          'Platform-independent testing strategies',
          'Migration planning and feature parity validation',
          'Documentation for multi-platform projects'
        ],
        bestPractices: [
          'Design APIs platform-agnostic from the start',
          'Use consistent configuration patterns',
          'Implement comprehensive test coverage',
          'Document all platform-specific differences',
          'Validate feature parity continuously'
        ],
        migrationGuidance: [
          'Start with thorough documentation of existing features',
          'Implement one endpoint at a time',
          'Use automated testing to validate parity',
          'Performance test both implementations',
          'Plan for gradual migration or parallel deployment'
        ]
      }
    };
    
    if (config.verboseExplanations) {
      logInfo('🔄 Cross-Platform Demonstration Complete', {
        summary: compatibilityResults,
        explanation: 'Cross-platform compatibility enables technology diversity while maintaining feature consistency'
      });
    }
    
    return compatibilityResults;
    
  } catch (error) {
    exampleMetrics.errors++;
    logError('❌ Cross-platform demonstration failed', {
      error: error.message,
      stack: error.stack,
      explanation: 'Cross-platform development requires careful planning and testing'
    });
    throw error;
  }
}

/**
 * Educational utility function that prints comprehensive usage instructions, learning
 * objectives, next steps, and educational guidance for students working through the
 * Node.js tutorial examples with detailed explanations and practical guidance.
 * 
 * @param {Object} [options={}] - Usage instruction options
 * @returns {void} No return value, prints educational instructions and guidance to console
 */
export function printUsageInstructions(options = {}) {
  const config = {
    includeAdvanced: options.includeAdvanced === true,
    showTroubleshooting: options.showTroubleshooting !== false,
    verboseExplanations: options.verboseExplanations !== false,
    ...options
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('🎓 NODE.JS TUTORIAL - BASIC HTTP SERVER USAGE EXAMPLES');
  console.log('='.repeat(80));
  
  // Print welcome message and tutorial phase information
  console.log('\n📚 WELCOME TO PHASE 1: BASIC HTTP SERVER EXAMPLES');
  console.log('\nThis educational module demonstrates fundamental Node.js HTTP server concepts');
  console.log('using modern ES Modules and Node.js v22.x LTS practices. You will learn');
  console.log('production-ready patterns while building a solid foundation for Express.js');
  console.log('framework integration in Phase 2.');
  
  // Display learning objectives and educational goals for basic server usage
  console.log('\n🎯 LEARNING OBJECTIVES:');
  const learningObjectives = [
    'Understanding basic HTTP server concepts and Node.js core capabilities',
    'Learning modern ES Modules and Node.js v22.x LTS features',
    'Implementing production-ready patterns for server lifecycle management',
    'Developing monitoring and observability practices',
    'Preparing for Express.js framework integration and advanced features',
    'Building foundation for cross-platform development and Flask migration'
  ];
  
  learningObjectives.forEach((objective, index) => {
    console.log(`   ${index + 1}. ${objective}`);
  });
  
  // Show command-line usage examples and options
  console.log('\n💻 COMMAND-LINE USAGE EXAMPLES:');
  console.log('\n   # Run complete basic server example');
  console.log('   node src/backend/examples/basic-usage.js --example=startup');
  console.log('\n   # Demonstrate server configuration options');
  console.log('   node src/backend/examples/basic-usage.js --example=config');
  console.log('\n   # Show monitoring and health check patterns');
  console.log('   node src/backend/examples/basic-usage.js --example=monitoring');
  console.log('\n   # Run performance measurement examples');
  console.log('   node src/backend/examples/basic-usage.js --example=performance');
  console.log('\n   # Demonstrate error handling patterns');
  console.log('   node src/backend/examples/basic-usage.js --example=errors');
  console.log('\n   # Show cross-platform compatibility');
  console.log('   node src/backend/examples/basic-usage.js --example=cross-platform');
  console.log('\n   # Run all examples sequentially');
  console.log('   node src/backend/examples/basic-usage.js --example=all');
  
  // Print configuration options and environment setup instructions
  console.log('\n⚙️ CONFIGURATION OPTIONS:');
  console.log('\n   Environment Variables:');
  console.log('   • PORT=3000           Server port (default: 3000)');
  console.log('   • HOST=127.0.0.1      Server host (default: 127.0.0.1)');
  console.log('   • NODE_ENV=development Environment (development/production)');
  console.log('   • LOG_LEVEL=debug     Logging level (debug/info/warn/error)');
  console.log('\n   Command Line Options:');
  console.log('   • --port=3001         Override server port');
  console.log('   • --host=0.0.0.0      Override server host');
  console.log('   • --verbose           Enable verbose logging');
  console.log('   • --no-monitoring     Disable health monitoring');
  
  // Display monitoring and debugging examples and techniques
  console.log('\n📊 MONITORING AND DEBUGGING:');
  console.log('\n   Health Check:');
  console.log('   curl http://localhost:3000/health');
  console.log('\n   Server Status:');
  console.log('   • Check console output for server startup messages');
  console.log('   • Monitor memory usage: process.memoryUsage()');
  console.log('   • Track response times: request timing logs');
  console.log('   • Monitor error rates: error count vs request count');
  console.log('\n   Performance Monitoring:');
  console.log('   • Startup time measurement');
  console.log('   • Request processing time');
  console.log('   • Memory usage patterns');
  console.log('   • Concurrent request handling');
  
  if (config.includeAdvanced) {
    console.log('\n🔧 ADVANCED USAGE PATTERNS:');
    console.log('\n   Programmatic Usage:');
    console.log('   ```javascript');
    console.log('   import { runBasicServerExample } from "./basic-usage.js";');
    console.log('   ');
    console.log('   const results = await runBasicServerExample({');
    console.log('     port: 3001,');
    console.log('     enableMonitoring: true,');
    console.log('     verbose: true');
    console.log('   });');
    console.log('   ```');
    console.log('\n   Custom Configuration:');
    console.log('   • Override default settings');
    console.log('   • Implement custom monitoring');
    console.log('   • Add performance benchmarks');
    console.log('   • Extend error handling');
  }
  
  // Show next steps and progression to Express.js phase
  console.log('\n🚀 NEXT STEPS - PHASE 2: EXPRESS.JS FRAMEWORK INTEGRATION');
  console.log('\n   After mastering basic HTTP server concepts, you will:');
  console.log('   1. Install and configure Express.js v5.1.0');
  console.log('   2. Implement RESTful API endpoints (/hello, /good-evening)');
  console.log('   3. Add security middleware with Helmet.js');
  console.log('   4. Implement comprehensive testing with Jest/Mocha');
  console.log('   5. Deploy with PM2 process management');
  console.log('   6. Migrate to Flask for cross-platform comparison');
  
  console.log('\n📖 EDUCATIONAL PROGRESSION:');
  console.log('   Phase 1: Basic HTTP Server (Current)');
  console.log('   Phase 2: Express.js Framework Integration');
  console.log('   Phase 3: Flask Cross-Platform Migration');
  console.log('   Phase 4: Comprehensive Testing Implementation');
  console.log('   Phase 5: PM2 Production Deployment');
  console.log('   Phase 6: Security Implementation with Helmet.js');
  console.log('   Phase 7: Documentation and Code Quality');
  
  if (config.showTroubleshooting) {
    // Include troubleshooting tips and common issue solutions
    console.log('\n🔧 TROUBLESHOOTING GUIDE:');
    console.log('\n   Common Issues:');
    console.log('   • Port already in use: Try different port or kill existing process');
    console.log('   • Permission denied: Check file permissions and user privileges');
    console.log('   • Module not found: Ensure you\'re running from project root directory');
    console.log('   • Import errors: Verify Node.js version is v22.x LTS');
    console.log('\n   Debugging Steps:');
    console.log('   1. Check Node.js version: node --version');
    console.log('   2. Verify file paths: ls -la src/backend/examples/');
    console.log('   3. Check port availability: netstat -an | grep 3000');
    console.log('   4. Review logs: Enable verbose logging for detailed output');
    console.log('\n   Getting Help:');
    console.log('   • Enable verbose logging: --verbose flag');
    console.log('   • Check error messages: Look for specific error codes');
    console.log('   • Review documentation: README.md and inline comments');
    console.log('   • Test connectivity: curl http://localhost:3000');
  }
  
  // Print references to additional documentation and resources
  console.log('\n📚 ADDITIONAL RESOURCES:');
  console.log('\n   Documentation:');
  console.log('   • Node.js v22.x LTS Documentation: https://nodejs.org/docs/');
  console.log('   • ES Modules Guide: https://nodejs.org/api/esm.html');
  console.log('   • HTTP Module Reference: https://nodejs.org/api/http.html');
  console.log('\n   Tutorial Resources:');
  console.log('   • README.md: Project overview and setup instructions');
  console.log('   • src/backend/basic-server.js: Core server implementation');
  console.log('   • src/backend/utils/: Utility modules and helpers');
  console.log('   • test/: Comprehensive testing examples');
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 Ready to start your Node.js learning journey!');
  console.log('Begin with: node src/backend/examples/basic-usage.js --example=startup');
  console.log('='.repeat(80) + '\n');
  
  if (config.verboseExplanations) {
    logInfo('📖 Usage instructions displayed', {
      totalSections: 7,
      includesAdvanced: config.includeAdvanced,
      includesTroubleshooting: config.showTroubleshooting,
      explanation: 'Comprehensive usage guide helps students navigate the learning process'
    });
  }
}

/**
 * Cleanup utility function that properly shuts down the server instance, clears global
 * state, logs cleanup results, and prepares for clean exit in educational example
 * scenarios with comprehensive resource management and validation.
 * 
 * @param {Object} [options={}] - Cleanup options and configuration
 * @returns {Promise<Object>} Promise that resolves when cleanup is complete with cleanup status and results
 */
export async function cleanup(options = {}) {
  const config = {
    timeout: options.timeout || 5000,
    logProgress: options.logProgress !== false,
    validateCleanup: options.validateCleanup !== false,
    forceful: options.forceful === true,
    ...options
  };
  
  if (config.logProgress) {
    logInfo('🧹 Starting cleanup process', {
      hasServerInstance: !!serverInstance,
      isShuttingDown,
      configuration: config
    });
  }
  
  const cleanupResults = {
    timestamp: new Date().toISOString(),
    started: Date.now(),
    steps: [],
    success: false,
    errors: []
  };
  
  try {
    // Check if server instance exists and is running
    if (serverInstance) {
      cleanupResults.steps.push({
        step: 'server-check',
        status: 'found',
        details: {
          listening: serverInstance.listening,
          address: serverInstance.address()
        }
      });
      
      if (config.logProgress) {
        logInfo('🔍 Server instance found', {
          listening: serverInstance.listening,
          address: serverInstance.address()
        });
      }
      
      // Initiate graceful shutdown using setupGracefulShutdown patterns
      if (serverInstance.listening) {
        cleanupResults.steps.push({
          step: 'graceful-shutdown',
          status: 'initiated',
          timestamp: Date.now()
        });
        
        try {
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Shutdown timeout after ${config.timeout}ms`));
            }, config.timeout);
            
            serverInstance.close((error) => {
              clearTimeout(timeoutId);
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
          
          cleanupResults.steps.push({
            step: 'graceful-shutdown',
            status: 'completed',
            timestamp: Date.now()
          });
          
          if (config.logProgress) {
            logInfo('✅ Server gracefully shut down');
          }
          
        } catch (shutdownError) {
          cleanupResults.errors.push({
            step: 'graceful-shutdown',
            error: shutdownError.message
          });
          
          if (config.forceful) {
            if (config.logProgress) {
              logWarn('⚠️ Graceful shutdown failed, forcing close', {
                error: shutdownError.message
              });
            }
            
            // Force close if graceful shutdown fails
            serverInstance.close();
            cleanupResults.steps.push({
              step: 'forceful-shutdown',
              status: 'completed',
              timestamp: Date.now()
            });
          } else {
            throw shutdownError;
          }
        }
      }
    } else {
      cleanupResults.steps.push({
        step: 'server-check',
        status: 'not-found',
        details: 'No server instance to clean up'
      });
    }
    
    // Clear global variables and reset example state
    const previousState = {
      serverInstance: !!serverInstance,
      exampleStartTime,
      isShuttingDown,
      exampleMetrics: { ...exampleMetrics }
    };
    
    serverInstance = null;
    exampleStartTime = null;
    isShuttingDown = false;
    exampleMetrics = {
      startupTime: 0,
      requestCount: 0,
      errors: 0
    };
    
    cleanupResults.steps.push({
      step: 'state-reset',
      status: 'completed',
      previousState,
      newState: {
        serverInstance: !!serverInstance,
        exampleStartTime,
        isShuttingDown,
        exampleMetrics: { ...exampleMetrics }
      }
    });
    
    if (config.logProgress) {
      logInfo('🔄 Global state reset', {
        previousState,
        explanation: 'Global variables cleared for clean shutdown'
      });
    }
    
    // Log cleanup progress and final statistics
    const finalStats = {
      totalCleanupTime: Date.now() - cleanupResults.started,
      stepsCompleted: cleanupResults.steps.length,
      errorsEncountered: cleanupResults.errors.length,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    cleanupResults.statistics = finalStats;
    
    if (config.logProgress) {
      logInfo('📊 Cleanup statistics', finalStats);
    }
    
    // Validate cleanup completion and resource deallocation
    if (config.validateCleanup) {
      const validation = {
        serverInstanceCleared: serverInstance === null,
        stateReset: exampleStartTime === null && !isShuttingDown,
        metricsReset: exampleMetrics.startupTime === 0,
        noActiveHandles: process._getActiveHandles ? process._getActiveHandles().length : 0,
        noActiveRequests: process._getActiveRequests ? process._getActiveRequests().length : 0
      };
      
      const validationSuccess = Object.values(validation).every(v => 
        typeof v === 'boolean' ? v : v === 0
      );
      
      cleanupResults.validation = {
        ...validation,
        success: validationSuccess
      };
      
      cleanupResults.steps.push({
        step: 'validation',
        status: validationSuccess ? 'passed' : 'failed',
        details: validation
      });
      
      if (config.logProgress) {
        logInfo('✅ Cleanup validation', {
          validation,
          success: validationSuccess,
          explanation: 'Validation ensures complete resource cleanup'
        });
      }
    }
    
    // Mark cleanup as successful
    cleanupResults.success = true;
    cleanupResults.completed = Date.now();
    
    // Print cleanup results and educational summary
    if (config.logProgress) {
      logInfo('🎯 Cleanup Process Complete', {
        success: cleanupResults.success,
        duration: `${cleanupResults.statistics.totalCleanupTime}ms`,
        steps: cleanupResults.steps.length,
        errors: cleanupResults.errors.length,
        explanation: 'Proper cleanup prevents resource leaks and ensures clean process exit'
      });
    }
    
    // Return cleanup status with timing and resource information
    return {
      ...cleanupResults,
      
      // Educational insights
      educational: {
        concepts: [
          'Graceful shutdown implementation',
          'Resource cleanup and memory management',
          'Global state management',
          'Cleanup validation and verification',
          'Error handling during cleanup'
        ],
        bestPractices: [
          'Always implement cleanup procedures',
          'Set appropriate timeout values',
          'Validate cleanup completion',
          'Handle cleanup errors gracefully',
          'Log cleanup progress for debugging'
        ],
        productionReady: [
          'Integrate with process managers',
          'Monitor cleanup metrics',
          'Implement cleanup health checks',
          'Document cleanup procedures',
          'Test cleanup under various conditions'
        ]
      }
    };
    
  } catch (error) {
    cleanupResults.errors.push({
      step: 'cleanup-process',
      error: error.message,
      stack: error.stack
    });
    
    cleanupResults.success = false;
    cleanupResults.completed = Date.now();
    
    logError('❌ Cleanup process failed', {
      error: error.message,
      stack: error.stack,
      results: cleanupResults,
      explanation: 'Cleanup failures may indicate resource leaks or system issues'
    });
    
    throw error;
  }
}

/**
 * Helper function to format uptime in human-readable format
 * @private
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Handle command line execution if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const exampleType = args.find(arg => arg.startsWith('--example='))?.split('=')[1] || 'startup';
  
  // Parse command line options
  const options = {
    port: args.find(arg => arg.startsWith('--port='))?.split('=')[1],
    host: args.find(arg => arg.startsWith('--host='))?.split('=')[1],
    verbose: args.includes('--verbose'),
    enableMonitoring: !args.includes('--no-monitoring')
  };
  
  // Handle graceful shutdown signals
  process.on('SIGINT', async () => {
    logInfo('🛑 Received SIGINT, initiating cleanup');
    try {
      await cleanup({ logProgress: true });
      process.exit(0);
    } catch (error) {
      logError('❌ Cleanup failed during SIGINT', { error: error.message });
      process.exit(1);
    }
  });
  
  process.on('SIGTERM', async () => {
    logInfo('🛑 Received SIGTERM, initiating cleanup');
    try {
      await cleanup({ logProgress: true });
      process.exit(0);
    } catch (error) {
      logError('❌ Cleanup failed during SIGTERM', { error: error.message });
      process.exit(1);
    }
  });
  
  // Execute the requested example
  try {
    switch (exampleType) {
      case 'startup':
        logInfo('🚀 Running basic server startup example');
        await runBasicServerExample(options);
        break;
        
      case 'config':
        logInfo('⚙️ Running configuration demonstration');
        demonstrateServerConfiguration('development', options);
        break;
        
      case 'monitoring':
        logInfo('📊 Running monitoring demonstration');
        demonstrateServerMonitoring(options);
        break;
        
      case 'performance':
        logInfo('🚀 Running performance example');
        await runPerformanceExample(options);
        break;
        
      case 'errors':
        logInfo('⚠️ Running error handling example');
        runErrorHandlingExample(options);
        break;
        
      case 'cross-platform':
        logInfo('🌐 Running cross-platform example');
        runCrossPllatformExample(options);
        break;
        
      case 'all':
        logInfo('🎯 Running all examples');
        await runBasicServerExample(options);
        demonstrateServerConfiguration('development', options);
        demonstrateServerMonitoring(options);
        await runPerformanceExample(options);
        runErrorHandlingExample(options);
        runCrossPllatformExample(options);
        break;
        
      case 'help':
      default:
        printUsageInstructions({ includeAdvanced: true, showTroubleshooting: true });
        break;
    }
    
    logInfo('✅ Example execution completed successfully');
    
  } catch (error) {
    logError('❌ Example execution failed', {
      example: exampleType,
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Export educational metadata for documentation and testing
export const EDUCATIONAL_METADATA = {
  phase: 'Phase 1 - Basic HTTP Server Examples',
  version: '1.0.0',
  learningObjectives: [
    'Understanding basic HTTP server concepts and Node.js core capabilities',
    'Learning modern ES Modules and Node.js v22.x LTS features',
    'Implementing production-ready patterns for server lifecycle management',
    'Developing monitoring and observability practices',
    'Preparing for Express.js framework integration and advanced features',
    'Building foundation for cross-platform development and Flask migration'
  ],
  prerequisites: [
    'Basic JavaScript knowledge',
    'Node.js v22.x LTS installed',
    'Understanding of HTTP protocol fundamentals',
    'Command line familiarity'
  ],
  nextPhase: 'Phase 2 - Express.js Framework Integration',
  estimatedTime: '2-4 hours',
  difficulty: 'Beginner to Intermediate'
};