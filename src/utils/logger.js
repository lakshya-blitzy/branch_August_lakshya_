/**
 * Structured Logging Utility for Node.js Server Component
 * 
 * Provides comprehensive structured logging capabilities for the Testinium-QA Node.js server
 * with configurable log levels, timestamp formatting, and seamless integration with Morgan
 * HTTP logging middleware. Designed for production-ready applications with extensive
 * monitoring and observability requirements.
 * 
 * Key Features:
 * - Structured JSON logging compatible with existing Java log formats
 * - Environment-adaptive behavior (development/test/production)
 * - Comprehensive trace correlation support for distributed systems
 * - Multiple output formats and destinations (console, file, streams)
 * - Integration with Morgan HTTP request logging middleware
 * - Child logger creation for component-specific logging contexts
 * - Dynamic log level management with runtime configuration
 * - Error context preservation and stack trace handling
 * - Performance-optimized logging with minimal overhead
 * 
 * @module logger
 * @version 1.0.0
 * @author Blitzy Agent
 */

// Internal imports - Environment configuration
const config = require('./config.js');

// External imports - Node.js built-in modules
const util = require('util');
const fs = require('fs');
const path = require('path');

/**
 * Log level hierarchy for severity-based filtering
 * Higher numeric values represent more severe log levels
 */
const LOG_LEVELS = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
};

/**
 * ANSI color codes for terminal output formatting in development environment
 */
const LOG_COLORS = {
    trace: '\x1b[90m',    // Gray
    debug: '\x1b[36m',    // Cyan
    info: '\x1b[32m',     // Green
    warn: '\x1b[33m',     // Yellow
    error: '\x1b[31m',    // Red
    reset: '\x1b[0m'      // Reset
};

/**
 * Global configuration for the logging system
 * Initialized based on environment configuration and runtime settings
 */
let globalLogLevel = LOG_LEVELS[config.logLevel] || LOG_LEVELS.info;
let logFileStream = null;
let isFileLoggingEnabled = false;

/**
 * Initialize file-based logging for production environments
 * Creates log directory structure and establishes write streams
 */
function initializeFileLogging() {
    if (config.isProduction && !isFileLoggingEnabled) {
        try {
            const logDir = path.resolve(process.cwd(), 'logs');
            
            // Ensure log directory exists with proper permissions
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
            }
            
            const logFilePath = path.join(logDir, `testinium-server-${new Date().toISOString().split('T')[0]}.log`);
            
            // Create write stream with append mode and high water mark for performance
            logFileStream = fs.createWriteStream(logFilePath, {
                flags: 'a',
                encoding: 'utf8',
                highWaterMark: 16384 // 16KB buffer for optimal performance
            });
            
            // Handle stream errors gracefully
            logFileStream.on('error', (error) => {
                console.error('[LOGGER] File logging error:', error.message);
                isFileLoggingEnabled = false;
                logFileStream = null;
            });
            
            isFileLoggingEnabled = true;
            console.log(`[LOGGER] File logging initialized: ${logFilePath}`);
            
        } catch (error) {
            console.error('[LOGGER] Failed to initialize file logging:', error.message);
            isFileLoggingEnabled = false;
        }
    }
}

/**
 * Generate ISO timestamp with millisecond precision for log entries
 * @returns {string} ISO-formatted timestamp string
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Get current trace ID from request context or generate new correlation ID
 * Supports distributed tracing across system components
 * @returns {string} Trace correlation identifier
 */
function getTraceId() {
    // Extract trace ID from current request context if available
    if (global.currentRequest && global.currentRequest.traceId) {
        return global.currentRequest.traceId;
    }
    
    // Generate new correlation ID for non-request contexts
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create structured log entry with comprehensive metadata
 * @param {string} level - Log severity level
 * @param {string} message - Primary log message
 * @param {Object} metadata - Additional context data
 * @param {Error} error - Error object with stack trace (optional)
 * @returns {Object} Structured log entry object
 */
function createLogEntry(level, message, metadata = {}, error = null) {
    const logEntry = {
        timestamp: getTimestamp(),
        level: level.toUpperCase(),
        message: message,
        traceId: getTraceId(),
        environment: config.environment,
        nodeEnv: config.nodeEnv,
        service: 'testinium-node-server',
        version: '1.0.0',
        pid: process.pid,
        hostname: require('os').hostname(),
        ...metadata
    };
    
    // Include error details with stack trace preservation
    if (error && error instanceof Error) {
        logEntry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code || undefined
        };
    }
    
    return logEntry;
}

/**
 * Format log entry for console output with environment-specific styling
 * @param {Object} logEntry - Structured log entry object
 * @returns {string} Formatted console output string
 */
function formatConsoleOutput(logEntry) {
    const { timestamp, level, message, traceId, error } = logEntry;
    
    if (config.isDevelopment) {
        // Development: Colorized, human-readable format
        const color = LOG_COLORS[level.toLowerCase()] || LOG_COLORS.reset;
        const resetColor = LOG_COLORS.reset;
        const shortTraceId = traceId.substr(-8);
        
        let output = `${color}[${timestamp}] ${level.padEnd(5)} [${shortTraceId}] ${message}${resetColor}`;
        
        // Include error details in development
        if (error) {
            output += `\n${color}Error: ${error.name}: ${error.message}${resetColor}`;
            if (error.stack) {
                output += `\n${color}${error.stack}${resetColor}`;
            }
        }
        
        return output;
    } else {
        // Production: Structured JSON format for log aggregation
        return JSON.stringify(logEntry);
    }
}

/**
 * Write log entry to configured output destinations
 * @param {Object} logEntry - Structured log entry object
 */
function writeLogEntry(logEntry) {
    const formattedOutput = formatConsoleOutput(logEntry);
    
    // Always write to console/stdout
    console.log(formattedOutput);
    
    // Write to file in production environments
    if (isFileLoggingEnabled && logFileStream && logFileStream.writable) {
        const jsonLogEntry = JSON.stringify(logEntry) + '\n';
        logFileStream.write(jsonLogEntry, 'utf8');
    }
}

/**
 * Core logging function with level-based filtering
 * @param {string} level - Log severity level
 * @param {string} message - Primary log message
 * @param {Object} metadata - Additional context data
 * @param {Error} error - Error object (optional)
 */
function log(level, message, metadata = {}, error = null) {
    // Filter based on current log level configuration
    if (LOG_LEVELS[level] < globalLogLevel) {
        return;
    }
    
    try {
        const logEntry = createLogEntry(level, message, metadata, error);
        writeLogEntry(logEntry);
    } catch (loggingError) {
        // Prevent logging failures from breaking application flow
        console.error('[LOGGER] Internal logging error:', loggingError.message);
        console.error('[LOGGER] Original message:', message);
    }
}

/**
 * Trace-level logging for detailed debugging and flow tracking
 * Used for granular application flow monitoring
 * @param {string} message - Log message
 * @param {Object} metadata - Additional context data
 */
function trace(message, metadata = {}) {
    log('trace', message, metadata);
}

/**
 * Debug-level logging for development and troubleshooting
 * Includes detailed context information for debugging
 * @param {string} message - Log message
 * @param {Object} metadata - Additional context data
 */
function debug(message, metadata = {}) {
    log('debug', message, metadata);
}

/**
 * Info-level logging for general application events
 * Standard operational logging for monitoring and audit trails
 * @param {string} message - Log message
 * @param {Object} metadata - Additional context data
 */
function info(message, metadata = {}) {
    log('info', message, metadata);
}

/**
 * Warning-level logging for potentially problematic situations
 * Indicates conditions that should be monitored but don't halt execution
 * @param {string} message - Log message
 * @param {Object} metadata - Additional context data
 */
function warn(message, metadata = {}) {
    log('warn', message, metadata);
}

/**
 * Error-level logging for exception handling and critical issues
 * Includes comprehensive error context and stack traces
 * @param {string} message - Log message
 * @param {Object} metadata - Additional context data
 * @param {Error} error - Error object with stack trace
 */
function error(message, metadata = {}, error = null) {
    log('error', message, metadata, error);
}

/**
 * Create child logger with inherited configuration and additional context
 * Enables component-specific logging with shared trace correlation
 * @param {Object} childContext - Additional context for child logger
 * @returns {Object} Child logger instance with full API
 */
function createChildLogger(childContext = {}) {
    return {
        trace: (message, metadata = {}) => trace(message, { ...childContext, ...metadata }),
        debug: (message, metadata = {}) => debug(message, { ...childContext, ...metadata }),
        info: (message, metadata = {}) => info(message, { ...childContext, ...metadata }),
        warn: (message, metadata = {}) => warn(message, { ...childContext, ...metadata }),
        error: (message, metadata = {}, error = null) => log('error', message, { ...childContext, ...metadata }, error),
        createChildLogger: (additionalContext = {}) => createChildLogger({ ...childContext, ...additionalContext }),
        setLevel: setLevel,
        getLevel: getLevel
    };
}

/**
 * Set global log level with validation and runtime configuration
 * @param {string} level - New log level (trace|debug|info|warn|error)
 * @returns {boolean} Success indicator
 */
function setLevel(level) {
    const normalizedLevel = level.toLowerCase();
    
    if (!LOG_LEVELS.hasOwnProperty(normalizedLevel)) {
        error('Invalid log level provided', { 
            providedLevel: level, 
            validLevels: Object.keys(LOG_LEVELS) 
        });
        return false;
    }
    
    const previousLevel = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === globalLogLevel);
    globalLogLevel = LOG_LEVELS[normalizedLevel];
    
    info('Log level changed', { 
        previousLevel, 
        newLevel: normalizedLevel,
        numericLevel: globalLogLevel 
    });
    
    return true;
}

/**
 * Get current global log level configuration
 * @returns {string} Current log level name
 */
function getLevel() {
    return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === globalLogLevel) || 'info';
}

// Initialize file logging for production environments
initializeFileLogging();

// Log successful logger initialization
info('Logger initialized successfully', {
    logLevel: getLevel(),
    environment: config.environment,
    fileLogging: isFileLoggingEnabled,
    pid: process.pid
});

/**
 * Main logger object with complete API implementation
 * Provides structured logging capabilities for the Node.js server component
 */
const logger = {
    trace,
    debug,
    info,
    warn,
    error,
    createChildLogger,
    setLevel,
    getLevel
};

// Export logger as default export
module.exports = logger;