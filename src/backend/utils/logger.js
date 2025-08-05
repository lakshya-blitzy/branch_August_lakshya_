/**
 * @fileoverview Comprehensive Logging Utility Module for Node.js Tutorial Project
 * @description Advanced logging system providing structured logging, request correlation tracking,
 * performance monitoring, and production-ready capabilities for Express.js v5.1.0 applications.
 * Implements modern logging patterns with PM2 cluster mode support, environment-aware log levels,
 * security event logging, and cross-platform compatibility with Flask implementations.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Structured JSON logging with correlation tracking
 * - PM2 cluster mode compatible logging
 * - Request lifecycle tracking with unique correlation IDs
 * - Performance metrics logging and monitoring
 * - Security event logging for Helmet.js integration
 * - Cross-platform Flask-compatible logging interface
 * - Automatic log rotation and file management
 * - Environment-aware log level configuration
 * - Production-ready error handling and fallback mechanisms
 * 
 * Technology Integration:
 * - Express.js v5.1.0 middleware compatibility
 * - PM2 v6.0.8 process management integration
 * - Helmet.js security event logging
 * - Node.js v22.x LTS built-in modules
 * - ES Modules with top-level await support
 */

// Node.js built-in module imports with version comments
import util from 'node:util'; // Node.js built-in - Object inspection and formatting utilities
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic functionality for secure ID generation
import fs from 'node:fs/promises'; // Node.js built-in - Asynchronous file system operations
import path from 'node:path'; // Node.js built-in - File and directory path utilities
import os from 'node:os'; // Node.js built-in - Operating system related utilities

// Internal imports from constants module
import {
  ENV_CONSTANTS,
  PM2_CONSTANTS,
  HTTP_CONSTANTS
} from './constants.js';

// Global logging configuration and state management
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || ENV_CONSTANTS.LOG_LEVELS.INFO;
const LOG_STREAMS = new Map(); // Active log file streams for different log types
const REQUEST_CORRELATION_MAP = new Map(); // Request correlation tracking
const PERFORMANCE_METRICS = { // Application-wide performance metrics
  requests: 0,
  errors: 0,
  totalTime: 0,
  averageResponseTime: 0,
  startTime: Date.now()
};
const LOG_FORMATTERS = new Map(); // Custom log formatting functions

/**
 * Determines if logging should occur for the specified level
 * @private
 * @param {string} level - Log level to check
 * @returns {boolean} Whether logging should occur for this level
 */
function shouldLog(level) {
  const levels = Object.values(ENV_CONSTANTS.LOG_LEVELS);
  const currentIndex = levels.indexOf(CURRENT_LOG_LEVEL);
  const targetIndex = levels.indexOf(level);
  return targetIndex <= currentIndex;
}

/**
 * Gets system information for log context
 * @private
 * @returns {Object} System information object
 */
function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version,
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    loadAverage: os.loadavg()
  };
}

/**
 * Sanitizes log data to prevent sensitive information disclosure
 * @private
 * @param {Object} data - Log data to sanitize
 * @returns {Object} Sanitized log data
 */
function sanitizeLogData(data) {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...data };
  const seen = new WeakSet();
  
  function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    // Check for circular references
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }
    seen.add(obj);
    
    const result = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return sanitizeObject(sanitized);
}

/**
 * Ensures log directory exists and creates it if necessary
 * @private
 * @param {string} logPath - Path to log file
 * @returns {Promise<void>}
 */
async function ensureLogDirectory(logPath) {
  try {
    const directory = path.dirname(logPath);
    await fs.mkdir(directory, { recursive: true });
  } catch (error) {
    // Fallback to console if directory creation fails
    console.error('Failed to create log directory:', error.message);
  }
}

/**
 * Factory function that creates a logger instance with environment-specific configuration,
 * log level management, and output destination setup. Supports console logging for development
 * and file logging for production with PM2 integration and structured output formatting.
 * 
 * @param {Object} options - Logger configuration options
 * @param {string} [options.level] - Log level override
 * @param {string} [options.name] - Logger instance name
 * @param {boolean} [options.enableFileLogging] - Enable file output
 * @param {string} [options.logDirectory] - Custom log directory
 * @param {Object} [options.metadata] - Additional metadata for all log entries
 * @returns {Object} Configured logger instance with debug, info, warn, error methods and context management
 */
function createLogger(options = {}) {
  const config = {
    level: options.level || CURRENT_LOG_LEVEL,
    name: options.name || 'app',
    enableFileLogging: options.enableFileLogging ?? (process.env.NODE_ENV === 'production'),
    logDirectory: options.logDirectory || './logs',
    metadata: options.metadata || {},
    environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
    ...options
  };

  // Create logger instance with all logging methods
  const logger = {
    debug: (message, context = {}) => debug(message, { ...context, logger: config.name }),
    info: (message, context = {}) => info(message, { ...context, logger: config.name }),
    warn: (message, context = {}) => warn(message, { ...context, logger: config.name }),
    error: (message, error = null, context = {}) => logError(message, error, { ...context, logger: config.name }),
    config,
    name: config.name
  };

  // Set up file logging for production environments
  if (config.enableFileLogging) {
    setupLogRotation({
      logDirectory: config.logDirectory,
      maxSize: PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_SIZE,
      maxFiles: PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_FILES,
      compress: PM2_CONSTANTS.LOG_CONFIG.COMPRESS_LOGS
    }).catch(error => {
      console.error('Failed to setup log rotation:', error.message);
    });
  }

  return logger;
}

/**
 * Logs debug-level messages with detailed context information for development debugging
 * and troubleshooting. Only outputs in development environment or when explicitly enabled
 * to prevent production log pollution while providing comprehensive debugging information.
 * 
 * @param {string} message - Debug message to log
 * @param {Object} [context={}] - Additional context information
 * @returns {void} No return value, performs logging side effect
 */
function debug(message, context = {}) {
  if (!shouldLog(ENV_CONSTANTS.LOG_LEVELS.DEBUG)) return;

  const logEntry = formatLogMessage(ENV_CONSTANTS.LOG_LEVELS.DEBUG, message, {
    ...context,
    debugInfo: {
      stack: new Error().stack,
      system: getSystemInfo(),
      performance: {
        ...PERFORMANCE_METRICS,
        timestamp: Date.now()
      }
    }
  });

  // Output to console in development, file in production
  if (process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT) {
    console.debug('\x1b[36m[DEBUG]\x1b[0m', util.inspect(logEntry, { colors: true, depth: 3 }));
  } else {
    writeToLogFile('debug.log', logEntry);
  }
}

/**
 * Logs informational messages for general application flow, request processing,
 * and system events. Provides balanced logging for both development and production
 * environments with structured output and correlation tracking for operational monitoring.
 * 
 * @param {string} message - Informational message to log
 * @param {Object} [context={}] - Additional context information
 * @returns {void} No return value, performs logging side effect
 */
function info(message, context = {}) {
  if (!shouldLog(ENV_CONSTANTS.LOG_LEVELS.INFO)) return;

  const logEntry = formatLogMessage(ENV_CONSTANTS.LOG_LEVELS.INFO, message, context);

  // Increment request counter if this is a request-related log
  if (context.requestId || context.method || context.url) {
    PERFORMANCE_METRICS.requests++;
  }

  // Output to console with color coding
  console.info('\x1b[32m[INFO]\x1b[0m', message, context.requestId ? `[${context.requestId}]` : '');
  
  // Write to file in production
  if (process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    writeToLogFile('app.log', logEntry);
  }
}

/**
 * Logs warning messages for potential issues, deprecated usage, configuration problems,
 * and recoverable errors. Provides important operational information for monitoring
 * systems and administrators while maintaining system functionality.
 * 
 * @param {string} message - Warning message to log
 * @param {Object} [context={}] - Additional context information
 * @returns {void} No return value, performs logging side effect
 */
function warn(message, context = {}) {
  if (!shouldLog(ENV_CONSTANTS.LOG_LEVELS.WARN)) return;

  const logEntry = formatLogMessage(ENV_CONSTANTS.LOG_LEVELS.WARN, message, {
    ...context,
    warningType: context.warningType || 'general',
    severity: context.severity || 'medium'
  });

  // Output to console with warning color
  console.warn('\x1b[33m[WARN]\x1b[0m', message, context);
  
  // Always write warnings to file for investigation
  writeToLogFile('warnings.log', logEntry);

  // Trigger alerting for high-severity warnings in production
  if (context.severity === 'high' && process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    // Integration point for alerting systems
    process.emit('warning-alert', { message, context, logEntry });
  }
}

/**
 * Logs error messages with comprehensive error context, stack traces, and correlation
 * information for debugging and incident response. Provides critical error information
 * for production monitoring, alerting systems, and error tracking workflows.
 * 
 * @param {string} message - Error message to log
 * @param {Error} [error=null] - Error object with stack trace
 * @param {Object} [context={}] - Additional context information
 * @returns {void} No return value, performs logging side effect
 */
function logError(message, error = null, context = {}) {
  PERFORMANCE_METRICS.errors++;

  const errorContext = {
    ...context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    } : null,
    system: getSystemInfo(),
    timestamp: new Date().toISOString()
  };

  const logEntry = formatLogMessage(ENV_CONSTANTS.LOG_LEVELS.ERROR, message, errorContext);

  // Output to console with error color
  console.error('\x1b[31m[ERROR]\x1b[0m', message);
  if (error && error.stack) {
    console.error('\x1b[31m[ERROR STACK]\x1b[0m', error.stack);
  } else if (error) {
    console.error('\x1b[31m[ERROR DETAILS]\x1b[0m', error.toString());
  }

  // Always write errors to dedicated error log
  writeToLogFile('errors.log', logEntry);

  // Emit error event for monitoring systems
  process.emit('application-error', { message, error, context: errorContext, logEntry });
}

/**
 * Generates unique request correlation IDs using cryptographically secure random values
 * for tracking requests across distributed systems, microservices, and PM2 cluster processes.
 * Supports request lifecycle tracking and debugging across system boundaries.
 * 
 * @param {Object} [options={}] - ID generation options
 * @param {string} [options.prefix] - Prefix for the generated ID
 * @param {number} [options.length] - Length of random component
 * @returns {string} Unique request correlation ID for distributed request tracking
 */
function generateRequestId(options = {}) {
  const config = {
    prefix: options.prefix || 'req',
    length: options.length || 16,
    includeTimestamp: options.includeTimestamp !== false,
    includePid: options.includePid !== false,
    ...options
  };

  try {
    // Generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(config.length);
    const randomComponent = randomBytes.toString('hex');
    
    // Build correlation ID components
    const components = [config.prefix];
    
    if (config.includeTimestamp) {
      components.push(Date.now().toString(36));
    }
    
    if (config.includePid) {
      components.push(process.pid.toString(36));
    }
    
    components.push(randomComponent);
    
    const correlationId = components.join('-');
    
    // Store in correlation map for lifecycle tracking
    REQUEST_CORRELATION_MAP.set(correlationId, {
      createdAt: Date.now(),
      pid: process.pid,
      metadata: options.metadata || {}
    });
    
    return correlationId;
  } catch (error) {
    // Fallback to timestamp-based ID if crypto fails
    const fallbackId = `${config.prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    warn('Failed to generate secure request ID, using fallback', { error: error.message, fallbackId });
    return fallbackId;
  }
}

/**
 * Logs performance metrics including response times, memory usage, CPU utilization,
 * and throughput measurements for production monitoring and optimization. Integrates
 * with PM2 monitoring and provides structured performance data for analysis.
 * 
 * @param {Object} metrics - Performance metrics to log
 * @param {Object} [context={}] - Additional context information
 * @returns {void} No return value, performs performance logging side effect
 */
function logPerformanceMetrics(metrics, context = {}) {
  const performanceData = {
    ...metrics,
    system: getSystemInfo(),
    application: {
      ...PERFORMANCE_METRICS,
      averageResponseTime: PERFORMANCE_METRICS.requests > 0 
        ? PERFORMANCE_METRICS.totalTime / PERFORMANCE_METRICS.requests 
        : 0
    },
    timestamp: Date.now(),
    ...context
  };

  // Update global performance metrics
  if (metrics.responseTime) {
    PERFORMANCE_METRICS.totalTime += metrics.responseTime;
  }

  const logEntry = formatLogMessage(ENV_CONSTANTS.LOG_LEVELS.INFO, 'Performance metrics recorded', {
    type: 'performance',
    metrics: performanceData
  });

  // Check performance thresholds and trigger warnings
  const responseTimeThreshold = 1000; // 1 second
  const memoryThreshold = 1024 * 1024 * 1024; // 1GB
  
  if (metrics.responseTime > responseTimeThreshold) {
    warn('Slow response time detected', {
      responseTime: metrics.responseTime,
      threshold: responseTimeThreshold,
      ...context
    });
  }

  if (performanceData.system.memory.heapUsed > memoryThreshold) {
    warn('High memory usage detected', {
      memoryUsage: performanceData.system.memory.heapUsed,
      threshold: memoryThreshold,
      ...context
    });
  }

  // Output performance metrics
  info('Performance metrics', performanceData);
  writeToLogFile('performance.log', logEntry);
}

/**
 * Logs security events including authentication failures, authorization violations,
 * suspicious requests, and security policy breaches with enhanced context for security
 * monitoring and incident response. Integrates with Helmet.js security middleware.
 * 
 * @param {string} eventType - Type of security event
 * @param {Object} securityContext - Security-related context information
 * @param {Object} [requestContext={}] - Request context information
 * @returns {void} No return value, performs security logging side effect
 */
function logSecurityEvent(eventType, securityContext, requestContext = {}) {
  // Sanitize security context to prevent sensitive data exposure
  const sanitizedContext = sanitizeLogData(securityContext);
  
  const securityLogEntry = {
    type: 'security',
    eventType,
    severity: determineSeverity(eventType),
    securityContext: sanitizedContext,
    requestContext: sanitizeLogData(requestContext),
    system: {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      ip: requestContext.ip || 'unknown',
      userAgent: requestContext.userAgent || 'unknown'
    },
    correlationId: requestContext.correlationId || generateRequestId({ prefix: 'sec' })
  };

  const logEntry = formatLogMessage(ENV_CONSTANTS.LOG_LEVELS.WARN, `Security event: ${eventType}`, securityLogEntry);

  // Security events always go to console and security log file
  console.warn('\x1b[35m[SECURITY]\x1b[0m', eventType, sanitizedContext);
  writeToLogFile('security.log', logEntry);

  // Emit security event for monitoring systems
  process.emit('security-event', securityLogEntry);

  // High-severity security events trigger immediate alerts
  if (securityLogEntry.severity === 'critical' || securityLogEntry.severity === 'high') {
    process.emit('security-alert', securityLogEntry);
  }
}

/**
 * Determines security event severity based on event type
 * @private
 * @param {string} eventType - Security event type
 * @returns {string} Severity level (low, medium, high, critical)
 */
function determineSeverity(eventType) {
  const severityMap = {
    'csrf-violation': 'high',
    'xss-attempt': 'high',
    'sql-injection': 'critical',
    'rate-limit-exceeded': 'medium',
    'authentication-failure': 'medium',
    'authorization-violation': 'high',
    'suspicious-request': 'medium',
    'security-header-violation': 'low',
    'cors-violation': 'medium'
  };
  
  return severityMap[eventType] || 'medium';
}

/**
 * Factory function that creates request-scoped logger instances with correlation tracking,
 * performance monitoring, and contextual information for comprehensive request lifecycle
 * logging. Supports Express.js middleware integration and Flask compatibility.
 * 
 * @param {Object} request - HTTP request object
 * @param {Object} [options={}] - Logger options
 * @returns {Object} Request-scoped logger with correlation tracking and context management
 */
function createRequestLogger(request, options = {}) {
  // Safely access request headers
  const headers = request.headers || {};
  
  const correlationId = generateRequestId({ 
    prefix: 'req',
    metadata: { 
      method: request.method, 
      url: request.url,
      userAgent: headers['user-agent'] || 'unknown'
    }
  });

  const requestContext = {
    correlationId,
    method: request.method,
    url: request.url,
    headers: sanitizeLogData(headers),
    ip: request.ip || request.connection?.remoteAddress,
    userAgent: headers['user-agent'] || 'unknown',
    timestamp: Date.now(),
    startTime: process.hrtime.bigint()
  };

  // Store request context for lifecycle tracking
  REQUEST_CORRELATION_MAP.set(correlationId, {
    ...REQUEST_CORRELATION_MAP.get(correlationId),
    requestContext
  });

  // Create request-scoped logger with embedded context
  const requestLogger = {
    debug: (message, context = {}) => debug(message, { ...requestContext, ...context }),
    info: (message, context = {}) => info(message, { ...requestContext, ...context }),
    warn: (message, context = {}) => warn(message, { ...requestContext, ...context }),
    error: (message, error = null, context = {}) => logError(message, error, { ...requestContext, ...context }),
    
    // Request-specific logging methods
    logRequest: () => {
      info('Request started', {
        type: 'request-start',
        ...requestContext
      });
    },
    
    logResponse: (statusCode, responseTime) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - requestContext.startTime) / 1000000; // Convert to ms
      
      logPerformanceMetrics({
        responseTime: responseTime || duration,
        statusCode,
        type: 'request-complete'
      }, requestContext);
      
      info('Request completed', {
        type: 'request-end',
        statusCode,
        responseTime: responseTime || duration,
        ...requestContext
      });
    },
    
    logSecurityEvent: (eventType, securityContext) => {
      logSecurityEvent(eventType, securityContext, requestContext);
    },
    
    correlationId,
    requestContext
  };

  return requestLogger;
}

/**
 * Formats log messages with consistent structure including timestamp, log level,
 * correlation ID, and contextual information for structured logging and parsing
 * by log aggregation systems. Supports multiple output formats.
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [context={}] - Additional context
 * @param {Object} [options={}] - Formatting options
 * @returns {string} Formatted log message with structured output ready for logging destinations
 */
function formatLogMessage(level, message, context = {}, options = {}) {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
  
  // Ensure level is a string to prevent toUpperCase errors
  const levelStr = typeof level === 'string' ? level : String(level || 'INFO');
  
  const baseLogEntry = {
    timestamp,
    level: levelStr.toUpperCase(),
    message,
    environment,
    pid: process.pid,
    hostname: os.hostname(),
    nodeVersion: process.version
  };

  // Add correlation ID if available
  if (context.correlationId) {
    baseLogEntry.correlationId = context.correlationId;
  }

  // Add request context if available
  if (context.method && context.url) {
    baseLogEntry.request = {
      method: context.method,
      url: context.url,
      ip: context.ip,
      userAgent: context.userAgent
    };
  }

  // Add sanitized context
  const sanitizedContext = sanitizeLogData(context);
  const logEntry = { ...baseLogEntry, ...sanitizedContext };

  // Format based on environment and options
  const format = options.format || (environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? 'json' : 'pretty');
  
  if (format === 'json') {
    return JSON.stringify(logEntry);
  } else {
    // Pretty format for development
    const correlationTag = logEntry.correlationId ? ` [${logEntry.correlationId}]` : '';
    const levelStr = typeof level === 'string' ? level : String(level || 'INFO');
    return `${timestamp} [${levelStr.toUpperCase()}]${correlationTag} ${message}`;
  }
}

/**
 * Configures automatic log file rotation with size limits, retention policies,
 * and compression to manage log file growth in production environments.
 * Integrates with PM2 log management and file system monitoring.
 * 
 * @param {Object} rotationConfig - Log rotation configuration
 * @returns {Object} Log rotation configuration with monitoring and cleanup procedures
 */
async function setupLogRotation(rotationConfig) {
  const config = {
    logDirectory: rotationConfig.logDirectory || './logs',
    maxSize: rotationConfig.maxSize || '10M',
    maxFiles: rotationConfig.maxFiles || 5,
    compress: rotationConfig.compress !== false,
    checkInterval: rotationConfig.checkInterval || 60000, // 1 minute
    ...rotationConfig
  };

  try {
    // Ensure log directory exists
    await ensureLogDirectory(config.logDirectory);

    // Parse max size to bytes
    const maxSizeBytes = parseSize(config.maxSize);

    // Set up rotation monitoring
    const rotationMonitor = {
      config,
      maxSizeBytes,
      
      async checkRotation(logFileName) {
        const logPath = path.join(config.logDirectory, logFileName);
        
        try {
          const stats = await fs.stat(logPath);
          if (stats.size > maxSizeBytes) {
            await this.rotateLog(logPath);
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            warn('Failed to check log file for rotation', { 
              error: error.message, 
              logPath 
            });
          }
        }
      },
      
      async rotateLog(logPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = `${logPath}.${timestamp}`;
        
        try {
          await fs.rename(logPath, rotatedPath);
          info('Log file rotated', { originalPath: logPath, rotatedPath });
          
          if (config.compress) {
            await this.compressLog(rotatedPath);
          }
          
          await this.cleanupOldLogs(path.dirname(logPath), path.basename(logPath));
        } catch (error) {
          logError('Failed to rotate log file', error, { logPath });
        }
      },
      
      async compressLog(logPath) {
        // Placeholder for compression logic
        // In production, you might use zlib or external compression tools
        info('Log compression placeholder', { logPath });
      },
      
      async cleanupOldLogs(directory, baseName) {
        try {
          const files = await fs.readdir(directory);
          const logFiles = files
            .filter(file => file.startsWith(baseName) && file !== baseName)
            .sort()
            .reverse();
          
          if (logFiles.length > config.maxFiles) {
            const filesToDelete = logFiles.slice(config.maxFiles);
            
            for (const file of filesToDelete) {
              const filePath = path.join(directory, file);
              await fs.unlink(filePath);
              info('Old log file deleted', { filePath });
            }
          }
        } catch (error) {
          warn('Failed to cleanup old log files', { 
            error: error.message, 
            directory, 
            baseName 
          });
        }
      }
    };

    // Start rotation monitoring interval
    const rotationInterval = setInterval(() => {
      ['app.log', 'errors.log', 'security.log', 'performance.log', 'debug.log', 'warnings.log']
        .forEach(logFile => rotationMonitor.checkRotation(logFile));
    }, config.checkInterval);

    // Cleanup interval on process exit
    process.on('exit', () => {
      clearInterval(rotationInterval);
    });

    info('Log rotation system initialized', config);
    return rotationMonitor;
    
  } catch (error) {
    logError('Failed to setup log rotation', error, { config });
    throw error;
  }
}

/**
 * Parses size string to bytes
 * @private
 * @param {string} sizeStr - Size string (e.g., '10M', '1G')
 * @returns {number} Size in bytes
 */
function parseSize(sizeStr) {
  const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024 };
  const match = sizeStr.match(/^(\d+)([KMG])?$/i);
  
  if (!match) {
    return 10 * 1024 * 1024; // Default 10MB
  }
  
  const size = parseInt(match[1]);
  const unit = match[2] ? match[2].toUpperCase() : '';
  
  return size * (units[unit] || 1);
}

/**
 * Creates Flask-compatible logging interface and formatting for cross-platform
 * development and feature parity testing between Node.js and Python implementations.
 * Maintains consistent logging patterns and output formats across technology stacks.
 * 
 * @param {Object} [flaskConfig={}] - Flask compatibility configuration
 * @returns {Object} Flask-compatible logger interface with consistent formatting and behavior
 */
function createFlaskCompatibleLogger(flaskConfig = {}) {
  const config = {
    format: flaskConfig.format || 'flask-style',
    timezone: flaskConfig.timezone || 'UTC',
    levelMapping: {
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARNING: 'WARN',
      ERROR: 'ERROR',
      CRITICAL: 'ERROR'
    },
    ...flaskConfig
  };

  // Flask-style timestamp formatting
  function formatFlaskTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
  }

  // Flask-style log entry formatting
  function formatFlaskLogEntry(level, message, context = {}) {
    const timestamp = formatFlaskTimestamp();
    const flaskLevel = config.levelMapping[level] || level;
    const loggerName = context.logger || 'app';
    
    // Flask format: [timestamp] level in logger: message
    const flaskMessage = `[${timestamp}] ${flaskLevel} in ${loggerName}: ${message}`;
    
    return {
      formatted: flaskMessage,
      structured: {
        timestamp: new Date().toISOString(),
        level: flaskLevel,
        logger: loggerName,
        message,
        context: sanitizeLogData(context),
        platform: 'node-flask-compat'
      }
    };
  }

  // Flask-compatible logger interface
  const flaskLogger = {
    debug: (message, context = {}) => {
      const entry = formatFlaskLogEntry('DEBUG', message, context);
      console.debug(entry.formatted);
      debug(message, { ...context, flaskCompat: true });
    },
    
    info: (message, context = {}) => {
      const entry = formatFlaskLogEntry('INFO', message, context);
      console.info(entry.formatted);
      info(message, { ...context, flaskCompat: true });
    },
    
    warning: (message, context = {}) => {
      const entry = formatFlaskLogEntry('WARNING', message, context);
      console.warn(entry.formatted);
      warn(message, { ...context, flaskCompat: true });
    },
    
    error: (message, error = null, context = {}) => {
      const entry = formatFlaskLogEntry('ERROR', message, context);
      console.error(entry.formatted);
      logError(message, error, { ...context, flaskCompat: true });
    },
    
    critical: (message, error = null, context = {}) => {
      const entry = formatFlaskLogEntry('CRITICAL', message, context);
      console.error(`[CRITICAL] ${entry.formatted}`);
      logError(message, error, { ...context, flaskCompat: true, severity: 'critical' });
    },
    
    // Flask-compatible utility methods
    getLogger: (name) => createFlaskCompatibleLogger({ ...config, defaultLogger: name }),
    
    setLevel: (level) => {
      process.env.LOG_LEVEL = level;
      info('Flask-compatible log level changed', { newLevel: level });
    },
    
    // Cross-platform validation
    validateCompatibility: () => {
      const testMessages = [
        { level: 'debug', message: 'Flask compatibility test - debug' },
        { level: 'info', message: 'Flask compatibility test - info' },
        { level: 'warning', message: 'Flask compatibility test - warning' },
        { level: 'error', message: 'Flask compatibility test - error' }
      ];
      
      testMessages.forEach(({ level, message }) => {
        flaskLogger[level](message, { test: true, platform: 'node-flask-compat' });
      });
      
      return {
        compatible: true,
        timestamp: new Date().toISOString(),
        platform: 'Node.js with Flask compatibility layer'
      };
    }
  };

  info('Flask-compatible logger created', config);
  return flaskLogger;
}

/**
 * Writes log entry to specified log file
 * @private
 * @param {string} fileName - Log file name
 * @param {string} logEntry - Formatted log entry
 */
async function writeToLogFile(fileName, logEntry) {
  if (process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT) {
    return; // Skip file writing in development
  }

  try {
    const logDirectory = PM2_CONSTANTS.LOG_CONFIG.OUT_FILE ? 
      path.dirname(PM2_CONSTANTS.LOG_CONFIG.OUT_FILE) : './logs';
    
    await ensureLogDirectory(logDirectory);
    
    const logPath = path.join(logDirectory, fileName);
    const formattedEntry = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
    
    await fs.appendFile(logPath, formattedEntry + '\n', 'utf8');
  } catch (error) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', error.message);
    console.error('Log entry:', logEntry);
  }
}

// Create default logger instance for immediate use
const logger = createLogger({
  name: 'default',
  enableFileLogging: process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION
});

// Export default logger instance and all utility functions
export default logger;
export {
  logger,
  createLogger,
  debug,
  info,
  warn,
  logError as error,
  generateRequestId,
  logPerformanceMetrics,
  logSecurityEvent,
  createRequestLogger,
  formatLogMessage,
  setupLogRotation,
  createFlaskCompatibleLogger
};

// Initialize performance metrics tracking
info('Logging system initialized', {
  environment: process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
  logLevel: CURRENT_LOG_LEVEL,
  pid: process.pid,
  nodeVersion: process.version,
  pm2Compatible: !!process.env.PM2_HOME,
  fileLoggingEnabled: process.env.NODE_ENV === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION
});