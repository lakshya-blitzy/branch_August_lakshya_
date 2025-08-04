/**
 * @fileoverview Comprehensive Helper Utilities Module for Node.js Tutorial Project
 * @description Advanced utility functions providing performance measurement, retry mechanisms,
 * health checking, and test client creation for Express.js v5.1.0 applications.
 * Implements modern patterns with PM2 cluster mode support, educational insights,
 * security-first design, and cross-platform Flask compatibility.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - High-precision performance measurement using process.hrtime.bigint()
 * - Intelligent retry mechanisms with exponential backoff and jitter
 * - Comprehensive health check validation for build environments
 * - Advanced test client creation with request correlation tracking
 * - Security-first input validation and error handling
 * - Educational insights and learning recommendations
 * - PM2 cluster mode compatibility and production readiness
 * - Cross-platform Flask compatibility interface
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 compatibility and testing utilities
 * - PM2 v6.0.8 process management integration
 * - Jest/Mocha testing framework support
 * - Helmet.js security middleware compatibility
 * - Cross-platform development patterns
 */

// Node.js built-in module imports with version comments
import { createServer } from 'node:http'; // Node.js built-in - HTTP server creation for test clients
import { request } from 'node:https'; // Node.js built-in - HTTPS request capabilities for health checks
import { spawn, exec } from 'node:child_process'; // Node.js built-in - Child process management for health validation
import { existsSync } from 'node:fs'; // Node.js built-in - File system checks for dependency validation
import { resolve, join } from 'node:path'; // Node.js built-in - Path resolution for configuration and dependency checks
import { cpus, freemem, totalmem, loadavg } from 'node:os'; // Node.js built-in - System resource monitoring
import { promisify } from 'node:util'; // Node.js built-in - Promise conversion utilities
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic utilities for secure ID generation

// Internal imports from project modules
import logger from './logger.js';
import { 
  ENV_CONSTANTS, 
  HTTP_CONSTANTS, 
  API_CONSTANTS,
  TESTING_CONSTANTS,
  PM2_CONSTANTS,
  ERROR_CONSTANTS 
} from './constants.js';

// Promisify child process functions for async/await usage
const execAsync = promisify(exec);

// Global performance tracking and metrics collection
const PERFORMANCE_REGISTRY = new Map(); // Active performance measurements
const HEALTH_CHECK_CACHE = new Map(); // Cached health check results
const RETRY_STATISTICS = new Map(); // Retry operation statistics
const TEST_CLIENT_POOL = new Set(); // Active test client instances

/**
 * Creates high-precision performance measurement utility for tracking execution time,
 * resource usage, and optimization analysis. Supports nested measurements, correlation tracking,
 * and educational insights for performance optimization learning objectives.
 * 
 * @param {Object} [options={}] - Performance measurement configuration options
 * @param {string} [options.name] - Measurement name for tracking and reporting
 * @param {boolean} [options.trackMemory=true] - Enable memory usage tracking
 * @param {boolean} [options.trackCpu=false] - Enable CPU usage monitoring
 * @param {string} [options.correlationId] - Request correlation ID for distributed tracing
 * @param {Object} [options.metadata] - Additional metadata for measurement context
 * @returns {Function} Performance measurement function that returns metrics when called
 */
export function measurePerformance(options = {}) {
  // Validate and sanitize input parameters
  const config = {
    name: options.name || `perf-${crypto.randomBytes(8).toString('hex')}`,
    trackMemory: options.trackMemory !== false,
    trackCpu: options.trackCpu === true,
    correlationId: options.correlationId || null,
    metadata: options.metadata || {},
    startTime: process.hrtime.bigint(), // High-precision timestamp
    startMemory: options.trackMemory ? process.memoryUsage() : null,
    startCpu: options.trackCpu ? process.cpuUsage() : null,
    ...options
  };

  // Store measurement in registry for global tracking
  PERFORMANCE_REGISTRY.set(config.name, {
    ...config,
    status: 'active',
    timestamp: Date.now()
  });

  logger.debug('Performance measurement started', {
    name: config.name,
    correlationId: config.correlationId,
    trackMemory: config.trackMemory,
    trackCpu: config.trackCpu,
    metadata: config.metadata
  });

  /**
   * Completes performance measurement and returns comprehensive metrics
   * @param {Object} [endOptions={}] - End measurement options
   * @returns {Object} Detailed performance metrics and analysis
   */
  return function completePerformanceMeasurement(endOptions = {}) {
    try {
      // Calculate execution time with nanosecond precision
      const endTime = process.hrtime.bigint();
      const durationNanoseconds = endTime - config.startTime;
      const durationMilliseconds = Number(durationNanoseconds) / 1000000;
      const durationSeconds = durationMilliseconds / 1000;

      // Collect memory usage metrics if enabled
      let memoryMetrics = null;
      if (config.trackMemory) {
        const endMemory = process.memoryUsage();
        memoryMetrics = {
          heapUsedDelta: endMemory.heapUsed - config.startMemory.heapUsed,
          heapTotalDelta: endMemory.heapTotal - config.startMemory.heapTotal,
          externalDelta: endMemory.external - config.startMemory.external,
          arrayBuffersDelta: endMemory.arrayBuffers - config.startMemory.arrayBuffers,
          startMemory: config.startMemory,
          endMemory,
          peakMemoryUsage: Math.max(config.startMemory.heapUsed, endMemory.heapUsed),
          memoryEfficiency: (config.startMemory.heapUsed / endMemory.heapUsed) * 100
        };
      }

      // Collect CPU usage metrics if enabled
      let cpuMetrics = null;
      if (config.trackCpu) {
        const endCpu = process.cpuUsage(config.startCpu);
        cpuMetrics = {
          userCpuTime: endCpu.user,
          systemCpuTime: endCpu.system,
          totalCpuTime: endCpu.user + endCpu.system,
          cpuUtilization: ((endCpu.user + endCpu.system) / (durationNanoseconds / 1000)) * 100
        };
      }

      // Collect system resource information
      const systemMetrics = {
        loadAverage: loadavg(),
        freeMemory: freemem(),
        totalMemory: totalmem(),
        cpuCount: cpus().length,
        uptime: process.uptime(),
        pid: process.pid
      };

      // Build comprehensive performance metrics object
      const performanceMetrics = {
        name: config.name,
        correlationId: config.correlationId,
        timing: {
          startTime: config.startTime,
          endTime,
          durationNanoseconds: Number(durationNanoseconds),
          durationMilliseconds,
          durationSeconds,
          isSlowOperation: durationMilliseconds > TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD
        },
        memory: memoryMetrics,
        cpu: cpuMetrics,
        system: systemMetrics,
        metadata: {
          ...config.metadata,
          ...endOptions.metadata,
          environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch
        },
        educational: {
          insights: generatePerformanceInsights(durationMilliseconds, memoryMetrics, cpuMetrics),
          recommendations: generatePerformanceRecommendations(durationMilliseconds, memoryMetrics)
        },
        timestamp: Date.now()
      };

      // Update registry with completed measurement
      PERFORMANCE_REGISTRY.set(config.name, {
        ...PERFORMANCE_REGISTRY.get(config.name),
        status: 'completed',
        metrics: performanceMetrics,
        completedAt: Date.now()
      });

      // Log performance results with appropriate level
      if (performanceMetrics.timing.isSlowOperation) {
        logger.warn('Slow operation detected', {
          name: config.name,
          duration: durationMilliseconds,
          threshold: TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD,
          correlationId: config.correlationId
        });
      } else {
        logger.debug('Performance measurement completed', {
          name: config.name,
          duration: durationMilliseconds,
          correlationId: config.correlationId
        });
      }

      // Emit performance event for monitoring systems
      process.emit('performance-measurement', performanceMetrics);

      return performanceMetrics;

    } catch (error) {
      logger.error('Performance measurement failed', error, {
        name: config.name,
        correlationId: config.correlationId
      });

      // Return error-safe metrics
      return {
        name: config.name,
        correlationId: config.correlationId,
        error: error.message,
        timing: {
          durationMilliseconds: -1,
          failed: true
        },
        timestamp: Date.now()
      };
    } finally {
      // Clean up registry entry after delay to prevent memory leaks
      setTimeout(() => {
        PERFORMANCE_REGISTRY.delete(config.name);
      }, 60000); // Clean up after 1 minute
    }
  };
}

/**
 * Implements intelligent retry mechanism with exponential backoff, jitter, and error recovery
 * strategies for failed operations. Supports circuit breaker patterns, custom retry conditions,
 * and comprehensive failure analysis for educational debugging and optimization insights.
 * 
 * @param {Function} operation - Async operation to retry on failure
 * @param {Object} [options={}] - Retry configuration options
 * @param {number} [options.maxAttempts=3] - Maximum number of retry attempts
 * @param {number} [options.baseDelay=1000] - Base delay between retries in milliseconds
 * @param {number} [options.maxDelay=30000] - Maximum delay between retries
 * @param {number} [options.backoffMultiplier=2] - Exponential backoff multiplier
 * @param {number} [options.jitterMax=0.1] - Maximum jitter as percentage of delay
 * @param {Function} [options.retryCondition] - Custom function to determine if error should trigger retry
 * @param {Function} [options.onRetry] - Callback function called before each retry attempt
 * @param {string} [options.operationName] - Operation name for logging and tracking
 * @param {string} [options.correlationId] - Request correlation ID for distributed tracing
 * @returns {Promise} Promise that resolves with operation result or rejects with final error
 */
export async function retry(operation, options = {}) {
  // Validate input parameters and set defaults
  if (typeof operation !== 'function') {
    throw new Error('Operation must be a function');
  }

  const config = {
    maxAttempts: Math.max(1, Math.min(options.maxAttempts || 3, 10)), // Limit to 10 attempts max
    baseDelay: Math.max(100, options.baseDelay || 1000), // Minimum 100ms delay
    maxDelay: Math.max(options.baseDelay || 1000, options.maxDelay || 30000),
    backoffMultiplier: Math.max(1.1, Math.min(options.backoffMultiplier || 2, 5)), // Limit multiplier
    jitterMax: Math.max(0, Math.min(options.jitterMax || 0.1, 0.5)), // Max 50% jitter
    retryCondition: options.retryCondition || defaultRetryCondition,
    onRetry: options.onRetry || null,
    operationName: options.operationName || 'unknown-operation',
    correlationId: options.correlationId || crypto.randomBytes(8).toString('hex'),
    timeout: options.timeout || 60000, // 60 second default timeout
    ...options
  };

  // Initialize retry tracking and statistics
  const retryStats = {
    operationName: config.operationName,
    correlationId: config.correlationId,
    attempts: [],
    totalAttempts: 0,
    totalDelay: 0,
    started: Date.now(),
    completed: null,
    succeeded: false,
    finalError: null
  };

  // Store retry statistics for analysis
  RETRY_STATISTICS.set(config.correlationId, retryStats);

  logger.info('Retry operation started', {
    operationName: config.operationName,
    correlationId: config.correlationId,
    maxAttempts: config.maxAttempts,
    baseDelay: config.baseDelay
  });

  let lastError = null;
  let attempt = 0;

  while (attempt < config.maxAttempts) {
    attempt++;
    const attemptStart = Date.now();

    try {
      logger.debug('Retry attempt starting', {
        operationName: config.operationName,
        correlationId: config.correlationId,
        attempt,
        maxAttempts: config.maxAttempts
      });

      // Execute operation with timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout after ${config.timeout}ms`)), config.timeout);
      });

      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      // Operation succeeded
      const attemptDuration = Date.now() - attemptStart;
      retryStats.attempts.push({
        attempt,
        succeeded: true,
        duration: attemptDuration,
        timestamp: Date.now()
      });
      retryStats.totalAttempts = attempt;
      retryStats.completed = Date.now();
      retryStats.succeeded = true;

      logger.info('Retry operation succeeded', {
        operationName: config.operationName,
        correlationId: config.correlationId,
        attempt,
        duration: attemptDuration,
        totalDuration: retryStats.completed - retryStats.started
      });

      // Generate educational insights for successful operations
      const insights = generateRetryInsights(retryStats, config, true);
      if (insights.length > 0) {
        logger.debug('Retry operation insights', {
          operationName: config.operationName,
          correlationId: config.correlationId,
          insights
        });
      }

      // Clean up statistics after delay
      setTimeout(() => RETRY_STATISTICS.delete(config.correlationId), 300000); // 5 minutes

      return result;

    } catch (error) {
      lastError = error;
      const attemptDuration = Date.now() - attemptStart;

      // Record failed attempt
      retryStats.attempts.push({
        attempt,
        succeeded: false,
        error: error.message,
        duration: attemptDuration,
        timestamp: Date.now()
      });

      logger.debug('Retry attempt failed', {
        operationName: config.operationName,
        correlationId: config.correlationId,
        attempt,
        error: error.message,
        duration: attemptDuration
      });

      // Check if we should retry this error
      const shouldRetry = await config.retryCondition(error, attempt, config);
      if (!shouldRetry || attempt >= config.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
      const jitter = cappedDelay * config.jitterMax * Math.random();
      const finalDelay = Math.round(cappedDelay + jitter);

      retryStats.totalDelay += finalDelay;

      logger.debug('Retry delay calculated', {
        operationName: config.operationName,
        correlationId: config.correlationId,
        attempt,
        delay: finalDelay,
        exponentialDelay,
        jitter: Math.round(jitter)
      });

      // Call retry callback if provided
      if (config.onRetry) {
        try {
          await config.onRetry(error, attempt, finalDelay, config);
        } catch (callbackError) {
          logger.warn('Retry callback failed', {
            operationName: config.operationName,
            correlationId: config.correlationId,
            callbackError: callbackError.message
          });
        }
      }

      // Wait before next attempt
      await sleep(finalDelay);
    }
  }

  // All attempts failed - finalize statistics and throw error
  retryStats.totalAttempts = attempt;
  retryStats.completed = Date.now();
  retryStats.succeeded = false;
  retryStats.finalError = lastError.message;

  logger.error('Retry operation failed after all attempts', lastError, {
    operationName: config.operationName,
    correlationId: config.correlationId,
    totalAttempts: attempt,
    totalDuration: retryStats.completed - retryStats.started,
    totalDelay: retryStats.totalDelay
  });

  // Generate educational insights for failed operations
  const insights = generateRetryInsights(retryStats, config, false);
  if (insights.length > 0) {
    logger.debug('Retry failure insights', {
      operationName: config.operationName,
      correlationId: config.correlationId,
      insights
    });
  }

  // Create enhanced error with retry information
  const retryError = new Error(`Operation failed after ${attempt} attempts: ${lastError.message}`);
  retryError.name = 'RetryExhaustedError';
  retryError.originalError = lastError;
  retryError.retryStats = retryStats;
  retryError.correlationId = config.correlationId;

  // Clean up statistics after delay
  setTimeout(() => RETRY_STATISTICS.delete(config.correlationId), 300000); // 5 minutes

  throw retryError;
}

/**
 * Creates comprehensive health check utility for validating build environment readiness,
 * dependency availability, system resources, and configuration correctness. Supports
 * custom health check definitions, caching, and educational diagnostic information.
 * 
 * @param {Object} [options={}] - Health check configuration options
 * @param {Array} [options.checks] - Array of custom health check definitions
 * @param {boolean} [options.enableCaching=true] - Enable health check result caching
 * @param {number} [options.cacheTimeout=30000] - Cache timeout in milliseconds
 * @param {boolean} [options.checkDependencies=true] - Enable dependency validation
 * @param {boolean} [options.checkSystemResources=true] - Enable system resource checks
 * @param {boolean} [options.checkConfiguration=true] - Enable configuration validation
 * @param {Object} [options.thresholds] - Custom threshold values for resource checks
 * @param {string} [options.correlationId] - Request correlation ID for tracking
 * @returns {Function} Health check executor function that returns comprehensive health status
 */
export function createHealthCheck(options = {}) {
  // Validate and configure health check options
  const config = {
    checks: Array.isArray(options.checks) ? options.checks : [],
    enableCaching: options.enableCaching !== false,
    cacheTimeout: Math.max(5000, options.cacheTimeout || 30000), // Minimum 5 second cache
    checkDependencies: options.checkDependencies !== false,
    checkSystemResources: options.checkSystemResources !== false,
    checkConfiguration: options.checkConfiguration !== false,
    thresholds: {
      memoryUsageThreshold: 85, // Percentage
      cpuLoadThreshold: 80, // Percentage
      diskSpaceThreshold: 90, // Percentage
      maxResponseTime: 5000, // Milliseconds
      ...options.thresholds
    },
    correlationId: options.correlationId || crypto.randomBytes(8).toString('hex'),
    timeout: options.timeout || 10000, // 10 second default timeout
    ...options
  };

  logger.debug('Health check system created', {
    correlationId: config.correlationId,
    checksCount: config.checks.length,
    caching: config.enableCaching,
    cacheTimeout: config.cacheTimeout
  });

  /**
   * Executes comprehensive health check validation
   * @param {Object} [executeOptions={}] - Execution-specific options
   * @returns {Promise<Object>} Comprehensive health check results with status and diagnostics
   */
  return async function executeHealthCheck(executeOptions = {}) {
    const executionId = crypto.randomBytes(8).toString('hex');
    const startTime = Date.now();
    
    logger.info('Health check execution started', {
      correlationId: config.correlationId,
      executionId,
      caching: config.enableCaching
    });

    // Check cache if enabled
    const cacheKey = `health-check-${config.correlationId}`;
    if (config.enableCaching && HEALTH_CHECK_CACHE.has(cacheKey)) {
      const cached = HEALTH_CHECK_CACHE.get(cacheKey);
      if (Date.now() - cached.timestamp < config.cacheTimeout) {
        logger.debug('Health check returning cached results', {
          correlationId: config.correlationId,
          executionId,
          cacheAge: Date.now() - cached.timestamp
        });
        return { ...cached.results, fromCache: true };
      }
    }

    const healthResults = {
      correlationId: config.correlationId,
      executionId,
      timestamp: new Date().toISOString(),
      startTime,
      endTime: null,
      duration: null,
      overallStatus: 'unknown',
      healthScore: 0,
      checks: {
        system: null,
        dependencies: null,
        configuration: null,
        custom: []
      },
      resources: {
        memory: null,
        cpu: null,
        disk: null,
        network: null
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT
      },
      educational: {
        insights: [],
        recommendations: [],
        diagnostics: []
      },
      errors: [],
      warnings: []
    };

    try {
      // Execute system resource checks
      if (config.checkSystemResources) {
        healthResults.checks.system = await executeSystemChecks(config, healthResults);
      }

      // Execute dependency validation
      if (config.checkDependencies) {
        healthResults.checks.dependencies = await executeDependencyChecks(config, healthResults);
      }

      // Execute configuration validation
      if (config.checkConfiguration) {
        healthResults.checks.configuration = await executeConfigurationChecks(config, healthResults);
      }

      // Execute custom health checks
      for (const customCheck of config.checks) {
        try {
          const customResult = await executeCustomHealthCheck(customCheck, config, healthResults);
          healthResults.checks.custom.push(customResult);
        } catch (error) {
          healthResults.errors.push(`Custom check '${customCheck.name}' failed: ${error.message}`);
          healthResults.checks.custom.push({
            name: customCheck.name,
            status: 'failed',
            error: error.message,
            duration: 0
          });
        }
      }

      // Calculate overall health status and score
      const healthAnalysis = calculateOverallHealth(healthResults, config);
      healthResults.overallStatus = healthAnalysis.status;
      healthResults.healthScore = healthAnalysis.score;
      healthResults.educational.insights = healthAnalysis.insights;
      healthResults.educational.recommendations = healthAnalysis.recommendations;
      healthResults.educational.diagnostics = healthAnalysis.diagnostics;

      // Complete timing information
      healthResults.endTime = Date.now();
      healthResults.duration = healthResults.endTime - startTime;

      // Cache results if enabled
      if (config.enableCaching) {
        HEALTH_CHECK_CACHE.set(cacheKey, {
          results: { ...healthResults },
          timestamp: Date.now()
        });

        // Clean up old cache entries
        setTimeout(() => {
          for (const [key, value] of HEALTH_CHECK_CACHE.entries()) {
            if (Date.now() - value.timestamp > config.cacheTimeout * 2) {
              HEALTH_CHECK_CACHE.delete(key);
            }
          }
        }, config.cacheTimeout);
      }

      logger.info('Health check execution completed', {
        correlationId: config.correlationId,
        executionId,
        duration: healthResults.duration,
        status: healthResults.overallStatus,
        score: healthResults.healthScore,
        errors: healthResults.errors.length,
        warnings: healthResults.warnings.length
      });

      return healthResults;

    } catch (error) {
      healthResults.endTime = Date.now();
      healthResults.duration = healthResults.endTime - startTime;
      healthResults.overallStatus = 'failed';
      healthResults.errors.push(`Health check execution failed: ${error.message}`);

      logger.error('Health check execution failed', error, {
        correlationId: config.correlationId,
        executionId,
        duration: healthResults.duration
      });

      return healthResults;
    }
  };
}

/**
 * Creates advanced test client for API testing with request correlation tracking,
 * performance monitoring, security validation, and educational debugging capabilities.
 * Supports both HTTP and HTTPS protocols with comprehensive assertion helpers.
 * 
 * @param {Object} [options={}] - Test client configuration options
 * @param {string} [options.baseUrl] - Base URL for all requests
 * @param {number} [options.timeout=10000] - Request timeout in milliseconds
 * @param {Object} [options.defaultHeaders] - Default headers for all requests
 * @param {boolean} [options.followRedirects=true] - Enable automatic redirect following
 * @param {boolean} [options.validateSsl=true] - Enable SSL certificate validation
 * @param {boolean} [options.trackPerformance=true] - Enable performance tracking
 * @param {string} [options.correlationId] - Request correlation ID for tracking
 * @param {Object} [options.auth] - Authentication configuration
 * @returns {Object} Test client instance with request methods and utilities
 */
export function createTestClient(options = {}) {
  // Validate and configure test client options
  const config = {
    baseUrl: options.baseUrl || `http://localhost:${ENV_CONSTANTS.DEFAULT_PORT}`,
    timeout: Math.max(1000, options.timeout || 10000), // Minimum 1 second timeout
    defaultHeaders: {
      'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      'Accept': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      'User-Agent': `Node.js-Tutorial-Test-Client/${process.version}`,
      ...options.defaultHeaders
    },
    followRedirects: options.followRedirects !== false,
    validateSsl: options.validateSsl !== false,
    trackPerformance: options.trackPerformance !== false,
    correlationId: options.correlationId || crypto.randomBytes(8).toString('hex'),
    auth: options.auth || null,
    maxRetries: Math.max(0, Math.min(options.maxRetries || 0, 3)), // Max 3 retries
    retryDelay: Math.max(100, options.retryDelay || 1000),
    ...options
  };

  // Parse base URL components
  const baseUrlParts = new URL(config.baseUrl);
  const isHttps = baseUrlParts.protocol === 'https:';
  const defaultPort = isHttps ? 443 : 80;
  const port = baseUrlParts.port || defaultPort;
  const hostname = baseUrlParts.hostname;

  // Initialize test client tracking
  const clientStats = {
    clientId: config.correlationId,
    created: Date.now(),
    requests: 0,
    responses: 0,
    errors: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    requests_by_method: new Map(),
    requests_by_status: new Map()
  };

  TEST_CLIENT_POOL.add(clientStats);

  logger.debug('Test client created', {
    clientId: config.correlationId,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
    trackPerformance: config.trackPerformance
  });

  /**
   * Makes HTTP request with comprehensive tracking and validation
   * @private
   */
  async function makeRequest(method, path, requestOptions = {}) {
    const requestId = crypto.randomBytes(8).toString('hex');
    const startTime = Date.now();
    
    // Build complete request configuration
    const requestConfig = {
      method: method.toUpperCase(),
      path: path.startsWith('/') ? path : `/${path}`,
      headers: {
        ...config.defaultHeaders,
        ...requestOptions.headers,
        'X-Request-ID': requestId,
        'X-Client-ID': config.correlationId
      },
      timeout: requestOptions.timeout || config.timeout,
      body: requestOptions.body || null,
      query: requestOptions.query || null
    };

    // Add authentication if configured
    if (config.auth) {
      if (config.auth.type === 'bearer' && config.auth.token) {
        requestConfig.headers['Authorization'] = `Bearer ${config.auth.token}`;
      } else if (config.auth.type === 'basic' && config.auth.username && config.auth.password) {
        const credentials = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
        requestConfig.headers['Authorization'] = `Basic ${credentials}`;
      }
    }

    // Update client statistics
    clientStats.requests++;
    const methodCount = clientStats.requests_by_method.get(method) || 0;
    clientStats.requests_by_method.set(method, methodCount + 1);

    logger.debug('Test client request starting', {
      clientId: config.correlationId,
      requestId,
      method: requestConfig.method,
      path: requestConfig.path,
      timeout: requestConfig.timeout
    });

    try {
      // Create performance measurement if enabled
      let perfMeasurement = null;
      if (config.trackPerformance) {
        perfMeasurement = measurePerformance({
          name: `test-request-${requestId}`,
          correlationId: config.correlationId,
          metadata: {
            method: requestConfig.method,
            path: requestConfig.path,
            clientId: config.correlationId
          }
        });
      }

      // Build full URL with query parameters
      let fullUrl = `${config.baseUrl}${requestConfig.path}`;
      if (requestConfig.query) {
        const queryString = new URLSearchParams(requestConfig.query).toString();
        fullUrl += `?${queryString}`;
      }

      // Prepare request body if provided
      let requestBody = null;
      if (requestConfig.body) {
        if (typeof requestConfig.body === 'object') {
          requestBody = JSON.stringify(requestConfig.body);
          requestConfig.headers['Content-Length'] = Buffer.byteLength(requestBody);
        } else {
          requestBody = requestConfig.body;
          requestConfig.headers['Content-Length'] = Buffer.byteLength(requestBody);
        }
      }

      // Create HTTP/HTTPS request
      const requestModule = isHttps ? await import('node:https') : await import('node:http');
      
      const response = await new Promise((resolve, reject) => {
        const request = requestModule.request(fullUrl, {
          method: requestConfig.method,
          headers: requestConfig.headers,
          timeout: requestConfig.timeout,
          rejectUnauthorized: config.validateSsl
        }, (response) => {
          let responseBody = '';
          
          response.on('data', (chunk) => {
            responseBody += chunk;
          });
          
          response.on('end', () => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Parse response body
            let parsedBody = responseBody;
            try {
              if (response.headers['content-type']?.includes('application/json')) {
                parsedBody = JSON.parse(responseBody);
              }
            } catch (parseError) {
              // Keep raw body if JSON parsing fails
            }
            
            // Build response object
            const responseObject = {
              status: response.statusCode,
              statusText: response.statusMessage,
              headers: response.headers,
              body: parsedBody,
              rawBody: responseBody,
              responseTime,
              requestId,
              clientId: config.correlationId,
              request: {
                method: requestConfig.method,
                url: fullUrl,
                headers: requestConfig.headers,
                body: requestConfig.body
              }
            };
            
            resolve(responseObject);
          });
        });
        
        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error(`Request timeout after ${requestConfig.timeout}ms`));
        });
        
        // Write request body if provided
        if (requestBody) {
          request.write(requestBody);
        }
        
        request.end();
      });

      // Update client statistics
      clientStats.responses++;
      clientStats.totalResponseTime += response.responseTime;
      clientStats.averageResponseTime = clientStats.totalResponseTime / clientStats.responses;
      
      const statusCount = clientStats.requests_by_status.get(response.status) || 0;
      clientStats.requests_by_status.set(response.status, statusCount + 1);

      // Complete performance measurement
      if (perfMeasurement) {
        const perfResults = perfMeasurement({
          metadata: {
            status: response.status,
            responseTime: response.responseTime,
            success: response.status < 400
          }
        });
        response.performance = perfResults;
      }

      logger.debug('Test client request completed', {
        clientId: config.correlationId,
        requestId,
        status: response.status,
        responseTime: response.responseTime,
        bodyLength: response.rawBody.length
      });

      return response;

    } catch (error) {
      clientStats.errors++;
      const responseTime = Date.now() - startTime;

      logger.error('Test client request failed', error, {
        clientId: config.correlationId,
        requestId,
        method: requestConfig.method,
        path: requestConfig.path,
        responseTime
      });

      // Enhanced error with request context
      const enhancedError = new Error(`Request failed: ${error.message}`);
      enhancedError.name = 'TestClientRequestError';
      enhancedError.originalError = error;
      enhancedError.requestId = requestId;
      enhancedError.clientId = config.correlationId;
      enhancedError.responseTime = responseTime;
      enhancedError.request = requestConfig;

      throw enhancedError;
    }
  }

  // Create test client interface with HTTP methods and utilities
  const testClient = {
    // HTTP method shortcuts
    get: (path, options = {}) => makeRequest('GET', path, options),
    post: (path, options = {}) => makeRequest('POST', path, options),
    put: (path, options = {}) => makeRequest('PUT', path, options),
    patch: (path, options = {}) => makeRequest('PATCH', path, options),
    delete: (path, options = {}) => makeRequest('DELETE', path, options),
    head: (path, options = {}) => makeRequest('HEAD', path, options),
    options: (path, options = {}) => makeRequest('OPTIONS', path, options),

    // Generic request method
    request: makeRequest,

    // Client configuration and metadata
    config,
    clientId: config.correlationId,
    baseUrl: config.baseUrl,

    // Statistics and monitoring
    getStats: () => ({ ...clientStats }),
    
    // Utility methods
    setDefaultHeader: (name, value) => {
      config.defaultHeaders[name] = value;
      logger.debug('Default header updated', { clientId: config.correlationId, header: name });
    },
    
    removeDefaultHeader: (name) => {
      delete config.defaultHeaders[name];
      logger.debug('Default header removed', { clientId: config.correlationId, header: name });
    },

    // Authentication methods
    setAuth: (authConfig) => {
      config.auth = authConfig;
      logger.debug('Authentication configured', { 
        clientId: config.correlationId, 
        type: authConfig?.type 
      });
    },

    clearAuth: () => {
      config.auth = null;
      logger.debug('Authentication cleared', { clientId: config.correlationId });
    },

    // Health and connectivity checks
    healthCheck: async () => {
      try {
        const response = await makeRequest('GET', '/health', { timeout: 5000 });
        return {
          healthy: response.status === 200,
          status: response.status,
          responseTime: response.responseTime,
          body: response.body
        };
      } catch (error) {
        return {
          healthy: false,
          error: error.message,
          responseTime: error.responseTime || -1
        };
      }
    },

    // Cleanup and resource management
    destroy: () => {
      TEST_CLIENT_POOL.delete(clientStats);
      logger.debug('Test client destroyed', {
        clientId: config.correlationId,
        totalRequests: clientStats.requests,
        totalErrors: clientStats.errors,
        averageResponseTime: clientStats.averageResponseTime
      });
    }
  };

  return testClient;
}

// Private helper functions

/**
 * Default retry condition function
 * @private
 */
function defaultRetryCondition(error, attempt, config) {
  // Don't retry on validation errors or client errors (4xx)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return false;
  }
  
  // Retry on network errors, timeouts, and server errors (5xx)
  return error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' || 
         error.code === 'ENOTFOUND' ||
         error.code === 'ECONNREFUSED' ||
         (error.statusCode && error.statusCode >= 500);
}

/**
 * Sleep utility function
 * @private
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates performance insights based on metrics
 * @private
 */
function generatePerformanceInsights(duration, memoryMetrics, cpuMetrics) {
  const insights = [];
  
  if (duration > TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD) {
    insights.push({
      type: 'performance-slow',
      message: `Operation took ${duration}ms, exceeding threshold of ${TESTING_CONSTANTS.PERFORMANCE_TARGETS.RESPONSE_TIME_THRESHOLD}ms`,
      recommendation: 'Consider optimizing the operation or increasing timeout limits'
    });
  }
  
  if (memoryMetrics && memoryMetrics.heapUsedDelta > 50 * 1024 * 1024) { // 50MB
    insights.push({
      type: 'memory-usage',
      message: `Operation consumed ${Math.round(memoryMetrics.heapUsedDelta / 1024 / 1024)}MB of memory`,
      recommendation: 'Monitor for memory leaks and consider memory optimization'
    });
  }
  
  if (cpuMetrics && cpuMetrics.cpuUtilization > 80) {
    insights.push({
      type: 'cpu-intensive',
      message: `Operation used ${Math.round(cpuMetrics.cpuUtilization)}% CPU`,
      recommendation: 'Consider breaking down CPU-intensive operations'
    });
  }
  
  return insights;
}

/**
 * Generates performance recommendations
 * @private
 */
function generatePerformanceRecommendations(duration, memoryMetrics) {
  const recommendations = [];
  
  if (duration < 10) {
    recommendations.push('Excellent performance - operation completed very quickly');
  } else if (duration < 100) {
    recommendations.push('Good performance - operation completed within acceptable time');
  } else if (duration < 1000) {
    recommendations.push('Moderate performance - consider optimization for better user experience');
  } else {
    recommendations.push('Slow performance - optimization recommended for production use');
  }
  
  return recommendations;
}

/**
 * Generates retry operation insights
 * @private
 */
function generateRetryInsights(retryStats, config, succeeded) {
  const insights = [];
  
  if (succeeded && retryStats.totalAttempts > 1) {
    insights.push({
      type: 'resilience-success',
      message: `Operation succeeded after ${retryStats.totalAttempts} attempts`,
      educational: 'Retry mechanisms improve application resilience and user experience'
    });
  }
  
  if (!succeeded) {
    insights.push({
      type: 'retry-exhausted',
      message: `Operation failed after ${retryStats.totalAttempts} attempts`,
      educational: 'Consider adjusting retry parameters or investigating root cause'
    });
  }
  
  if (retryStats.totalDelay > 10000) { // 10 seconds
    insights.push({
      type: 'high-delay',
      message: `Total retry delay was ${retryStats.totalDelay}ms`,
      educational: 'High retry delays may impact user experience - consider timeout adjustments'
    });
  }
  
  return insights;
}

/**
 * Executes system resource health checks
 * @private
 */
async function executeSystemChecks(config, healthResults) {
  const systemChecks = {
    status: 'checking',
    checks: {},
    warnings: [],
    errors: []
  };

  try {
    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const totalMemory = totalmem();
    const memoryUsagePercent = (memoryUsage.heapUsed / totalMemory) * 100;
    
    systemChecks.checks.memory = {
      status: memoryUsagePercent < config.thresholds.memoryUsageThreshold ? 'healthy' : 'warning',
      usage: memoryUsage,
      usagePercent: Math.round(memoryUsagePercent),
      threshold: config.thresholds.memoryUsageThreshold,
      totalMemory
    };

    if (memoryUsagePercent >= config.thresholds.memoryUsageThreshold) {
      systemChecks.warnings.push(`High memory usage: ${Math.round(memoryUsagePercent)}%`);
      healthResults.warnings.push(`System memory usage is high (${Math.round(memoryUsagePercent)}%)`);
    }

    // CPU load check
    const loadAverage = loadavg();
    const cpuCount = cpus().length;
    const loadPercent = (loadAverage[0] / cpuCount) * 100;
    
    systemChecks.checks.cpu = {
      status: loadPercent < config.thresholds.cpuLoadThreshold ? 'healthy' : 'warning',
      loadAverage,
      loadPercent: Math.round(loadPercent),
      threshold: config.thresholds.cpuLoadThreshold,
      cpuCount
    };

    if (loadPercent >= config.thresholds.cpuLoadThreshold) {
      systemChecks.warnings.push(`High CPU load: ${Math.round(loadPercent)}%`);
      healthResults.warnings.push(`System CPU load is high (${Math.round(loadPercent)}%)`);
    }

    // Process uptime check
    const uptime = process.uptime();
    systemChecks.checks.uptime = {
      status: 'healthy',
      uptime,
      uptimeFormatted: formatUptime(uptime)
    };

    systemChecks.status = systemChecks.warnings.length === 0 ? 'healthy' : 'warning';
    
  } catch (error) {
    systemChecks.status = 'failed';
    systemChecks.errors.push(error.message);
    healthResults.errors.push(`System checks failed: ${error.message}`);
  }

  return systemChecks;
}

/**
 * Executes dependency validation checks
 * @private
 */
async function executeDependencyChecks(config, healthResults) {
  const dependencyChecks = {
    status: 'checking',
    checks: {},
    warnings: [],
    errors: []
  };

  try {
    // Node.js version check
    const nodeVersion = process.version;
    const requiredVersion = ENV_CONSTANTS.NODE_VERSIONS.MINIMUM_SUPPORTED;
    const versionValid = compareVersions(nodeVersion, requiredVersion) >= 0;
    
    dependencyChecks.checks.nodeVersion = {
      status: versionValid ? 'healthy' : 'failed',
      current: nodeVersion,
      required: requiredVersion,
      valid: versionValid
    };

    if (!versionValid) {
      dependencyChecks.errors.push(`Node.js version ${nodeVersion} below required ${requiredVersion}`);
      healthResults.errors.push(`Incompatible Node.js version: ${nodeVersion}`);
    }

    // Package.json existence check
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJsonExists = existsSync(packageJsonPath);
    
    dependencyChecks.checks.packageJson = {
      status: packageJsonExists ? 'healthy' : 'failed',
      path: packageJsonPath,
      exists: packageJsonExists
    };

    if (!packageJsonExists) {
      dependencyChecks.errors.push('package.json not found');
      healthResults.errors.push('Missing package.json file');
    }

    // Node modules check
    const nodeModulesPath = resolve(process.cwd(), 'node_modules');
    const nodeModulesExists = existsSync(nodeModulesPath);
    
    dependencyChecks.checks.nodeModules = {
      status: nodeModulesExists ? 'healthy' : 'warning',
      path: nodeModulesPath,
      exists: nodeModulesExists
    };

    if (!nodeModulesExists) {
      dependencyChecks.warnings.push('node_modules directory not found');
      healthResults.warnings.push('Dependencies may not be installed (missing node_modules)');
    }

    dependencyChecks.status = dependencyChecks.errors.length === 0 ? 
      (dependencyChecks.warnings.length === 0 ? 'healthy' : 'warning') : 'failed';
    
  } catch (error) {
    dependencyChecks.status = 'failed';
    dependencyChecks.errors.push(error.message);
    healthResults.errors.push(`Dependency checks failed: ${error.message}`);
  }

  return dependencyChecks;
}

/**
 * Executes configuration validation checks
 * @private
 */
async function executeConfigurationChecks(config, healthResults) {
  const configChecks = {
    status: 'checking',
    checks: {},
    warnings: [],
    errors: []
  };

  try {
    // Environment configuration check
    const environment = process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
    configChecks.checks.environment = {
      status: 'healthy',
      current: environment,
      valid: Object.values(ENV_CONSTANTS.ENVIRONMENT_TYPES).includes(environment)
    };

    // Port configuration check
    const port = process.env.PORT || ENV_CONSTANTS.DEFAULT_PORT;
    const portNumber = parseInt(port);
    const portValid = !isNaN(portNumber) && portNumber > 0 && portNumber < 65536;
    
    configChecks.checks.port = {
      status: portValid ? 'healthy' : 'failed',
      current: port,
      parsed: portNumber,
      valid: portValid
    };

    if (!portValid) {
      configChecks.errors.push(`Invalid port configuration: ${port}`);
      healthResults.errors.push(`Invalid port number: ${port}`);
    }

    // Log level configuration check
    const logLevel = process.env.LOG_LEVEL || ENV_CONSTANTS.LOG_LEVELS.INFO;
    const logLevelValid = Object.values(ENV_CONSTANTS.LOG_LEVELS).includes(logLevel);
    
    configChecks.checks.logLevel = {
      status: logLevelValid ? 'healthy' : 'warning',
      current: logLevel,
      valid: logLevelValid
    };

    if (!logLevelValid) {
      configChecks.warnings.push(`Invalid log level: ${logLevel}`);
      healthResults.warnings.push(`Unrecognized log level: ${logLevel}`);
    }

    configChecks.status = configChecks.errors.length === 0 ? 
      (configChecks.warnings.length === 0 ? 'healthy' : 'warning') : 'failed';
    
  } catch (error) {
    configChecks.status = 'failed';
    configChecks.errors.push(error.message);
    healthResults.errors.push(`Configuration checks failed: ${error.message}`);
  }

  return configChecks;
}

/**
 * Executes custom health check
 * @private
 */
async function executeCustomHealthCheck(check, config, healthResults) {
  const startTime = Date.now();
  
  try {
    const result = await check.fn();
    const duration = Date.now() - startTime;
    
    return {
      name: check.name,
      status: result.status || 'healthy',
      result,
      duration,
      timestamp: Date.now()
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      name: check.name,
      status: 'failed',
      error: error.message,
      duration,
      timestamp: Date.now()
    };
  }
}

/**
 * Calculates overall health status and score
 * @private
 */
function calculateOverallHealth(healthResults, config) {
  let totalScore = 0;
  let maxScore = 0;
  const insights = [];
  const recommendations = [];
  const diagnostics = [];

  // Calculate scores for each check category
  const categories = ['system', 'dependencies', 'configuration'];
  for (const category of categories) {
    const check = healthResults.checks[category];
    if (check) {
      maxScore += 100;
      
      if (check.status === 'healthy') {
        totalScore += 100;
      } else if (check.status === 'warning') {
        totalScore += 70;
        insights.push(`${category} checks have warnings that should be addressed`);
      } else if (check.status === 'failed') {
        totalScore += 0;
        recommendations.push(`Fix critical ${category} issues immediately`);
      }
    }
  }

  // Add custom checks to score
  for (const customCheck of healthResults.checks.custom) {
    maxScore += 100;
    
    if (customCheck.status === 'healthy') {
      totalScore += 100;
    } else if (customCheck.status === 'warning') {
      totalScore += 70;
    } else {
      totalScore += 0;
    }
  }

  // Calculate final score
  const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Determine overall status
  let overallStatus = 'healthy';
  if (healthResults.errors.length > 0) {
    overallStatus = 'failed';
  } else if (healthResults.warnings.length > 0 || finalScore < 90) {
    overallStatus = 'warning';
  }

  // Generate educational insights
  if (finalScore >= 95) {
    insights.push('Excellent system health - all checks passed successfully');
  } else if (finalScore >= 80) {
    insights.push('Good system health with minor issues to address');
  } else if (finalScore >= 60) {
    insights.push('System health needs attention - several issues detected');
  } else {
    insights.push('Poor system health - immediate action required');
  }

  // Generate diagnostics
  diagnostics.push(`Health score: ${finalScore}/100`);
  diagnostics.push(`Total checks: ${categories.length + healthResults.checks.custom.length}`);
  diagnostics.push(`Errors: ${healthResults.errors.length}`);
  diagnostics.push(`Warnings: ${healthResults.warnings.length}`);

  return {
    status: overallStatus,
    score: finalScore,
    insights,
    recommendations,
    diagnostics
  };
}

/**
 * Compares version strings
 * @private
 */
function compareVersions(version1, version2) {
  const v1parts = version1.replace(/^v/, '').split('.').map(Number);
  const v2parts = version2.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
}

/**
 * Formats uptime in human-readable format
 * @private
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

// Cleanup function for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Helpers module cleanup initiated');
  
  // Clear all registries and caches
  PERFORMANCE_REGISTRY.clear();
  HEALTH_CHECK_CACHE.clear();
  RETRY_STATISTICS.clear();
  TEST_CLIENT_POOL.clear();
  
  logger.info('Helpers module cleanup completed');
});

// Export all utility functions
export default {
  measurePerformance,
  retry,
  createHealthCheck,
  createTestClient
};

/**
 * Module Summary:
 * 
 * This comprehensive helpers utilities module provides advanced functionality for
 * performance measurement, retry mechanisms, health checking, and test client creation
 * in the Node.js tutorial project. It demonstrates production-ready patterns with
 * educational insights and cross-platform compatibility.
 * 
 * Key Features:
 * - High-precision performance measurement with detailed metrics
 * - Intelligent retry mechanisms with exponential backoff and jitter
 * - Comprehensive health check validation for build environments
 * - Advanced test client with correlation tracking and performance monitoring
 * - Security-first input validation and error handling
 * - Educational insights and learning recommendations
 * - PM2 cluster mode compatibility and production readiness
 * 
 * Educational Value:
 * - Demonstrates modern async/await patterns and Promise handling
 * - Showcases error handling and retry strategies
 * - Illustrates performance monitoring and optimization techniques
 * - Provides insights into health checking and system validation
 * - Shows test client creation and API testing patterns
 * 
 * Production Features:
 * - Memory-efficient resource management with cleanup procedures
 * - Comprehensive logging with correlation tracking
 * - Graceful error handling and recovery mechanisms
 * - Performance optimization and monitoring capabilities
 * - Security validation and input sanitization
 * - Cross-platform compatibility considerations
 */