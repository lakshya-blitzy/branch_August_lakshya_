/**
 * @fileoverview Central Utilities Index Module for Node.js Tutorial Project
 * @description Centralized utilities index that exports all utility functions, classes, constants,
 * and logging capabilities for the Node.js tutorial project. Serves as the main entry point
 * for the utilities package, providing a clean and organized interface for consuming utility
 * modules throughout the application. Re-exports constants management, error handling classes,
 * helper functions, and logging utilities to support Express.js v5.1.0 applications, PM2
 * cluster mode deployments, cross-platform Flask compatibility, comprehensive security
 * implementations, and educational development patterns.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Architecture:
 * - Modern ES Modules architecture following Node.js v22.x LTS standards
 * - Centralized utility management with namespace-based organization
 * - Express.js v5.1.0 compatible utility functions and middleware support
 * - PM2 cluster mode compatible utilities for production deployment
 * - Cross-platform Flask compatibility utilities for educational comparison
 * - Comprehensive security utilities for Helmet.js integration
 * - Production-ready error handling and logging capabilities
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 enhanced security and promise-based error handling
 * - PM2 v6.0.8 cluster mode and process management compatibility
 * - Helmet.js v8.1.0 security middleware utilities
 * - Jest/Mocha testing framework compatibility utilities
 * - Cross-platform development support for Node.js/Flask feature parity
 * 
 * Export Categories:
 * - Constants: Application configuration and system constants
 * - Error Types: Custom error classes and error handling utilities
 * - Helper Functions: HTTP utilities, security functions, and testing support
 * - Logging: Structured logging, performance monitoring, and security event logging
 * 
 * Educational Value:
 * - Demonstrates modern Node.js module organization patterns
 * - Showcases centralized utility management best practices
 * - Provides comprehensive utility re-export patterns
 * - Illustrates production-ready Node.js application architecture
 */

// Internal utility module imports using namespace imports for comprehensive re-export
// All imports use relative paths to local utility modules within the utils package

/**
 * Import all constants from the comprehensive constants module
 * Provides environment configuration, HTTP protocol constants, API definitions,
 * security configurations, PM2 settings, testing constants, error definitions,
 * Flask compatibility constants, and tutorial-specific configurations
 */
import * as constantsModule from './constants.js';

/**
 * Import all error types and error handling utilities from the error types module
 * Provides custom error classes (BaseError, HTTPError, ValidationError, SecurityError, PM2Error),
 * error creation utilities, error validation functions, error formatting utilities,
 * and comprehensive error management capabilities for production applications
 */
import * as errorTypesModule from './error-types.js';

/**
 * Import all helper utility functions from the helpers module
 * Provides HTTP response formatting, input sanitization, email validation,
 * performance measurement, retry mechanisms, health check utilities, Flask compatibility,
 * test data generation, mock response creation, security token generation,
 * deep cloning utilities, and user agent parsing for comprehensive application support
 */
import * as helpersModule from './helpers.js';

/**
 * Import all logging utilities and logger instances from the logger module
 * Provides structured logging capabilities, request correlation tracking,
 * performance metrics logging, security event logging, request lifecycle tracking,
 * Flask-compatible logging interfaces, log rotation management, and production-ready
 * logging infrastructure for comprehensive application monitoring and debugging
 */
import * as loggerModule from './logger.js';

// ============================================================================
// CONSTANTS RE-EXPORTS
// ============================================================================

/**
 * Environment configuration constants for server setup and runtime configuration
 * Includes default port settings, host configuration, environment type definitions,
 * and log level configurations for development, staging, and production environments
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { ENV_CONSTANTS } from './utils/index.js';
 * const port = process.env.PORT || ENV_CONSTANTS.DEFAULT_PORT;
 * const environment = ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;
 */
export const ENV_CONSTANTS = constantsModule.ENV_CONSTANTS;

/**
 * HTTP protocol constants for status codes, methods, content types, and header management
 * Provides comprehensive HTTP specification constants for Express.js v5.1.0 applications,
 * including status code definitions, HTTP method constants, content type specifications,
 * and standard HTTP header definitions for consistent HTTP protocol implementation
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { HTTP_CONSTANTS } from './utils/index.js';
 * res.status(HTTP_CONSTANTS.STATUS_CODES.SUCCESS).json({ status: 'ok' });
 */
export const HTTP_CONSTANTS = constantsModule.HTTP_CONSTANTS;

/**
 * API endpoint definitions, standardized responses, and error message constants
 * Provides centralized API configuration including endpoint path definitions,
 * standardized API response formats, consistent error message templates,
 * and API versioning constants for maintainable REST API development
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { API_CONSTANTS } from './utils/index.js';
 * app.get(API_CONSTANTS.ENDPOINTS.HELLO, (req, res) => {
 *   res.json(API_CONSTANTS.RESPONSES.SUCCESS);
 * });
 */
export const API_CONSTANTS = constantsModule.API_CONSTANTS;

/**
 * Security configuration constants for Helmet.js integration and security policies
 * Includes Content Security Policy directives, security header configurations,
 * CORS policy settings, and comprehensive security middleware configurations
 * for production-ready security implementation with Express.js applications
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { SECURITY_CONSTANTS } from './utils/index.js';
 * app.use(helmet({
 *   contentSecurityPolicy: SECURITY_CONSTANTS.CSP_DIRECTIVES
 * }));
 */
export const SECURITY_CONSTANTS = constantsModule.SECURITY_CONSTANTS;

/**
 * PM2 process management constants for cluster mode and production deployment
 * Provides execution mode configurations, instance management settings,
 * monitoring configurations, and cluster mode optimization settings
 * for enterprise-grade Node.js application deployment with PM2
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { PM2_CONSTANTS } from './utils/index.js';
 * module.exports = {
 *   apps: [{
 *     exec_mode: PM2_CONSTANTS.EXEC_MODES.CLUSTER,
 *     instances: PM2_CONSTANTS.INSTANCE_CONFIGS.MAX
 *   }]
 * };
 */
export const PM2_CONSTANTS = constantsModule.PM2_CONSTANTS;

/**
 * Testing framework constants for Jest and Mocha integration
 * Includes test configuration settings, testing environment constants,
 * test data generation parameters, and testing utility configurations
 * for comprehensive test suite development and continuous integration
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { TESTING_CONSTANTS } from './utils/index.js';
 * const testTimeout = TESTING_CONSTANTS.TIMEOUTS.DEFAULT;
 */
export const TESTING_CONSTANTS = constantsModule.TESTING_CONSTANTS;

/**
 * Error handling constants for error classification and management
 * Provides error type definitions, error severity levels, error code mappings,
 * and error handling configuration constants for consistent error management
 * across the application with proper error classification and reporting
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { ERROR_CONSTANTS } from './utils/index.js';
 * const errorType = ERROR_CONSTANTS.TYPES.VALIDATION;
 */
export const ERROR_CONSTANTS = constantsModule.ERROR_CONSTANTS;

/**
 * Flask cross-platform compatibility constants for feature parity validation
 * Includes Flask-equivalent configurations, response format mappings,
 * cross-platform validation settings, and compatibility testing constants
 * for maintaining feature parity between Node.js Express and Python Flask implementations
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { FLASK_CONSTANTS } from './utils/index.js';
 * const flaskPort = FLASK_CONSTANTS.DEFAULT_PORT;
 */
export const FLASK_CONSTANTS = constantsModule.FLASK_CONSTANTS;

/**
 * Tutorial-specific constants for educational development patterns
 * Provides tutorial configuration settings, learning objective constants,
 * educational resource definitions, and tutorial progression parameters
 * for structured learning experiences and educational content delivery
 * 
 * @type {Object}
 * @readonly
 * @example
 * import { TUTORIAL_CONSTANTS } from './utils/index.js';
 * const phase = TUTORIAL_CONSTANTS.PHASES.EXPRESS_INTEGRATION;
 */
export const TUTORIAL_CONSTANTS = constantsModule.TUTORIAL_CONSTANTS;

// ============================================================================
// ERROR HANDLING RE-EXPORTS
// ============================================================================

/**
 * Base error class for custom error type foundation with enhanced functionality
 * Provides core error handling capabilities including error serialization,
 * structured error data management, error context tracking, and foundation
 * for all custom error types in the application with consistent error interfaces
 * 
 * @class BaseError
 * @extends Error
 * @example
 * import { BaseError } from './utils/index.js';
 * class CustomError extends BaseError {
 *   constructor(message, code) {
 *     super(message, code);
 *     this.name = 'CustomError';
 *   }
 * }
 */
export const BaseError = errorTypesModule.BaseError;

/**
 * HTTP-specific error class for Express.js error handling with status codes and headers
 * Provides HTTP status code management, custom header support, Express.js middleware
 * integration, and HTTP-specific error response formatting for RESTful API error handling
 * 
 * @class HTTPError
 * @extends BaseError
 * @example
 * import { HTTPError } from './utils/index.js';
 * throw new HTTPError('Not Found', 404, { 'Content-Type': 'application/json' });
 */
export const HTTPError = errorTypesModule.HTTPError;

/**
 * Validation error class for input validation failures with field-level error details
 * Provides form validation error management, field-specific error tracking,
 * validation error aggregation, and structured validation error reporting
 * for comprehensive input validation and user feedback systems
 * 
 * @class ValidationError
 * @extends BaseError
 * @example
 * import { ValidationError } from './utils/index.js';
 * const error = new ValidationError('Validation failed');
 * error.addFieldError('email', 'Invalid email format');
 */
export const ValidationError = errorTypesModule.ValidationError;

/**
 * Security error class for authentication failures and security policy violations
 * Provides security event tracking, authentication error management,
 * authorization failure handling, and security incident logging
 * for comprehensive security monitoring and incident response
 * 
 * @class SecurityError
 * @extends BaseError
 * @example
 * import { SecurityError } from './utils/index.js';
 * throw new SecurityError('Authentication failed', 'AUTH_FAILURE');
 */
export const SecurityError = errorTypesModule.SecurityError;

/**
 * PM2 error class for process management failures and cluster mode issues
 * Provides process management error tracking, cluster mode error handling,
 * PM2-specific error reporting, and production deployment error management
 * for robust process management and deployment monitoring
 * 
 * @class PM2Error
 * @extends BaseError
 * @example
 * import { PM2Error } from './utils/index.js';
 * throw new PM2Error('Cluster restart failed', 'CLUSTER_ERROR');
 */
export const PM2Error = errorTypesModule.PM2Error;

/**
 * Factory function for creating standardized error response objects
 * Provides consistent error response formatting, error serialization,
 * client-safe error transformation, and standardized error API responses
 * for maintaining consistent error response patterns across the application
 * 
 * @function createErrorResponse
 * @param {Error} error - Error object to format
 * @param {Object} options - Response formatting options
 * @returns {Object} Standardized error response object
 * @example
 * import { createErrorResponse } from './utils/index.js';
 * const response = createErrorResponse(error, { includeStack: false });
 */
export const createErrorResponse = errorTypesModule.createErrorResponse;

/**
 * Utility for determining if errors are operational or programming errors
 * Provides error classification logic, operational error identification,
 * error handling strategy determination, and error recovery guidance
 * for intelligent error handling and appropriate error response strategies
 * 
 * @function isOperationalError
 * @param {Error} error - Error object to classify
 * @returns {boolean} True if error is operational, false if programming error
 * @example
 * import { isOperationalError } from './utils/index.js';
 * if (isOperationalError(error)) {
 *   res.status(error.statusCode).json(createErrorResponse(error));
 * } else {
 *   logger.error('Programming error detected', error);
 * }
 */
export const isOperationalError = errorTypesModule.isOperationalError;

/**
 * Utility for sanitizing error objects for safe client transmission
 * Provides error data sanitization, sensitive information removal,
 * client-safe error transformation, and production error filtering
 * for secure error response handling without information disclosure
 * 
 * @function sanitizeErrorForResponse
 * @param {Error} error - Error object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized error object safe for client transmission
 * @example
 * import { sanitizeErrorForResponse } from './utils/index.js';
 * const safeError = sanitizeErrorForResponse(error, { includeStack: false });
 */
export const sanitizeErrorForResponse = errorTypesModule.sanitizeErrorForResponse;

/**
 * Utility for classifying error severity levels for monitoring and alerting
 * Provides error severity classification, alert level determination,
 * monitoring priority assignment, and incident response prioritization
 * for intelligent error monitoring and appropriate response escalation
 * 
 * @function classifyErrorSeverity
 * @param {Error} error - Error object to classify
 * @returns {string} Error severity level (low, medium, high, critical)
 * @example
 * import { classifyErrorSeverity } from './utils/index.js';
 * const severity = classifyErrorSeverity(error);
 * if (severity === 'critical') {
 *   alertingSystem.sendImmediateAlert(error);
 * }
 */
export const classifyErrorSeverity = errorTypesModule.classifyErrorSeverity;

/**
 * Factory function for creating errors from error codes with consistent formatting
 * Provides error code mapping, standardized error creation, error template system,
 * and consistent error message formatting for maintainable error management
 * 
 * @function createErrorFromCode
 * @param {string} errorCode - Error code identifier
 * @param {Object} context - Additional error context
 * @returns {Error} Created error object with appropriate type and formatting
 * @example
 * import { createErrorFromCode } from './utils/index.js';
 * const error = createErrorFromCode('VALIDATION_FAILED', { field: 'email' });
 */
export const createErrorFromCode = errorTypesModule.createErrorFromCode;

/**
 * Utility for formatting errors for comprehensive logging and debugging
 * Provides error logging formatting, stack trace processing, error context extraction,
 * and structured error logging for comprehensive debugging and incident analysis
 * 
 * @function formatErrorForLogging
 * @param {Error} error - Error object to format
 * @param {Object} context - Additional logging context
 * @returns {Object} Formatted error object optimized for logging systems
 * @example
 * import { formatErrorForLogging } from './utils/index.js';
 * const logEntry = formatErrorForLogging(error, { requestId: 'req-123' });
 * logger.error('Request failed', logEntry);
 */
export const formatErrorForLogging = errorTypesModule.formatErrorForLogging;

/**
 * Utility for validating error instances and error object integrity
 * Provides error object validation, error type verification, error property checking,
 * and error instance integrity validation for robust error handling systems
 * 
 * @function validateErrorInstance
 * @param {Error} error - Error object to validate
 * @returns {boolean} True if error object is valid and properly formed
 * @example
 * import { validateErrorInstance } from './utils/index.js';
 * if (validateErrorInstance(error)) {
 *   processError(error);
 * } else {
 *   logger.warn('Invalid error object received', { error });
 * }
 */
export const validateErrorInstance = errorTypesModule.validateErrorInstance;

// ============================================================================
// HELPER FUNCTIONS RE-EXPORTS
// ============================================================================

/**
 * HTTP response formatting utility for standardized API responses with security headers
 * Provides consistent response formatting, security header application, content type management,
 * and Express.js v5.1.0 compatible response handling for RESTful API development
 * 
 * @function formatHTTPResponse
 * @param {Object} data - Response data object
 * @param {Object} options - Response formatting options
 * @returns {Object} Formatted HTTP response with appropriate headers and structure
 * @example
 * import { formatHTTPResponse } from './utils/index.js';
 * const response = formatHTTPResponse({ message: 'Hello world' }, { statusCode: 200 });
 */
export const formatHTTPResponse = helpersModule.formatHTTPResponse;

/**
 * Input sanitization utility for XSS prevention and security vulnerability protection
 * Provides comprehensive input sanitization, XSS attack prevention, SQL injection protection,
 * and malicious input filtering for secure user input processing and data validation
 * 
 * @function sanitizeInput
 * @param {string} input - User input string to sanitize
 * @param {Object} options - Sanitization options and rules
 * @returns {string} Sanitized input string safe for processing and storage
 * @example
 * import { sanitizeInput } from './utils/index.js';
 * const safeInput = sanitizeInput(userInput, { allowHtml: false, maxLength: 255 });
 */
export const sanitizeInput = helpersModule.sanitizeInput;

/**
 * Email validation utility with comprehensive format checking and DNS resolution
 * Provides email format validation, domain verification, DNS record checking,
 * and disposable email detection for robust email address validation systems
 * 
 * @function validateEmail
 * @param {string} email - Email address to validate
 * @param {Object} options - Validation options and settings
 * @returns {Promise<boolean>} True if email is valid and deliverable
 * @example
 * import { validateEmail } from './utils/index.js';
 * const isValid = await validateEmail('user@example.com', { checkDns: true });
 */
export const validateEmail = helpersModule.validateEmail;

/**
 * Performance measurement utility for execution time tracking and resource monitoring
 * Provides high-resolution timing, performance metrics collection, execution profiling,
 * and resource usage monitoring for application optimization and performance analysis
 * 
 * @function measurePerformance
 * @param {Function} operation - Function to measure performance of
 * @param {Object} options - Performance measurement options
 * @returns {Promise<Object>} Performance metrics including execution time and resource usage
 * @example
 * import { measurePerformance } from './utils/index.js';
 * const metrics = await measurePerformance(async () => {
 *   return await someExpensiveOperation();
 * });
 */
export const measurePerformance = helpersModule.measurePerformance;

/**
 * Async operation retry utility with exponential backoff and circuit breaker pattern
 * Provides retry logic implementation, exponential backoff strategies, circuit breaker pattern,
 * and failure recovery mechanisms for resilient asynchronous operation handling
 * 
 * @function retry
 * @param {Function} operation - Async operation to retry
 * @param {Object} options - Retry configuration options
 * @returns {Promise<*>} Result of successful operation execution
 * @example
 * import { retry } from './utils/index.js';
 * const result = await retry(() => apiCall(), {
 *   attempts: 3,
 *   delay: 1000,
 *   backoff: 'exponential'
 * });
 */
export const retry = helpersModule.retry;

/**
 * Health check utility factory for system monitoring and load balancer integration
 * Provides health check endpoint creation, system status monitoring, dependency checking,
 * and load balancer compatible health reporting for production deployment monitoring
 * 
 * @function createHealthCheck
 * @param {Object} dependencies - System dependencies to check
 * @param {Object} options - Health check configuration options
 * @returns {Function} Health check middleware function for Express.js integration
 * @example
 * import { createHealthCheck } from './utils/index.js';
 * const healthCheck = createHealthCheck({ database: db, redis: cache });
 * app.get('/health', healthCheck);
 */
export const createHealthCheck = helpersModule.createHealthCheck;

/**
 * Cross-platform compatibility utility for Express.js to Flask response conversion
 * Provides response format conversion, cross-platform data transformation,
 * Flask compatibility layer, and feature parity validation for educational comparison
 * 
 * @function convertToFlaskFormat
 * @param {Object} expressResponse - Express.js response object
 * @param {Object} options - Conversion options and settings
 * @returns {Object} Flask-compatible response object for cross-platform validation
 * @example
 * import { convertToFlaskFormat } from './utils/index.js';
 * const flaskResponse = convertToFlaskFormat(expressResponse, { includeHeaders: true });
 */
export const convertToFlaskFormat = helpersModule.convertToFlaskFormat;

/**
 * Test data generation utility for comprehensive testing scenarios and edge cases
 * Provides test data factory functions, edge case generation, test scenario creation,
 * and comprehensive test data management for thorough application testing
 * 
 * @function generateTestData
 * @param {string} dataType - Type of test data to generate
 * @param {Object} options - Test data generation options
 * @returns {*} Generated test data matching specified type and requirements
 * @example
 * import { generateTestData } from './utils/index.js';
 * const testUser = generateTestData('user', { includeEmail: true, includePassword: false });
 */
export const generateTestData = helpersModule.generateTestData;

/**
 * Mock response utility for Jest and Mocha testing frameworks
 * Provides mock response creation, testing utilities, HTTP response mocking,
 * and test framework integration for comprehensive unit and integration testing
 * 
 * @function createMockResponse
 * @param {Object} responseData - Mock response data
 * @param {Object} options - Mock response configuration options
 * @returns {Object} Mock response object compatible with testing frameworks
 * @example
 * import { createMockResponse } from './utils/index.js';
 * const mockRes = createMockResponse({ message: 'success' }, { statusCode: 200 });
 */
export const createMockResponse = helpersModule.createMockResponse;

/**
 * Secure token generation utility for authentication and security applications
 * Provides cryptographically secure token generation, token format management,
 * security token creation, and authentication token utilities for secure applications
 * 
 * @function generateSecureToken
 * @param {Object} options - Token generation options and configuration
 * @returns {string} Cryptographically secure token for authentication or security purposes
 * @example
 * import { generateSecureToken } from './utils/index.js';
 * const authToken = generateSecureToken({ length: 32, encoding: 'hex' });
 */
export const generateSecureToken = helpersModule.generateSecureToken;

/**
 * Deep object cloning utility with circular reference handling
 * Provides deep object cloning, circular reference detection, complex object duplication,
 * and memory-safe object copying for data manipulation and object management
 * 
 * @function deepClone
 * @param {*} object - Object to clone deeply
 * @param {Object} options - Cloning options and configuration
 * @returns {*} Deep clone of input object with circular reference handling
 * @example
 * import { deepClone } from './utils/index.js';
 * const clonedObject = deepClone(originalObject, { preservePrototype: true });
 */
export const deepClone = helpersModule.deepClone;

/**
 * User agent parsing utility for browser detection and security analysis
 * Provides user agent string parsing, browser detection, device identification,
 * and security analysis capabilities for request monitoring and security assessment
 * 
 * @function parseUserAgent
 * @param {string} userAgent - User agent string to parse
 * @param {Object} options - Parsing options and configuration
 * @returns {Object} Parsed user agent information including browser, OS, and device details
 * @example
 * import { parseUserAgent } from './utils/index.js';
 * const clientInfo = parseUserAgent(req.headers['user-agent'], { includeDevice: true });
 */
export const parseUserAgent = helpersModule.parseUserAgent;

// ============================================================================
// LOGGING UTILITIES RE-EXPORTS
// ============================================================================

/**
 * Default logger instance with debug, info, warn, error methods for application logging
 * Provides structured logging capabilities, request correlation tracking, performance monitoring,
 * and production-ready logging infrastructure with environment-aware configuration
 * 
 * @object logger
 * @example
 * import { logger } from './utils/index.js';
 * logger.info('Application started', { port: 3000, environment: 'production' });
 */
export const logger = loggerModule.logger;

/**
 * Logger factory function for creating custom logger instances with specific configuration
 * Provides customizable logger creation, environment-specific configuration, log level management,
 * and specialized logging instances for different application components and contexts
 * 
 * @function createLogger
 * @param {Object} options - Logger configuration options
 * @returns {Object} Configured logger instance with specialized settings
 * @example
 * import { createLogger } from './utils/index.js';
 * const apiLogger = createLogger({ name: 'api', level: 'debug', enableFileLogging: true });
 */
export const createLogger = loggerModule.createLogger;

/**
 * Utility for generating unique request correlation IDs for distributed request tracking
 * Provides request correlation ID generation, distributed tracing support, request lifecycle tracking,
 * and cross-service request correlation for comprehensive request monitoring and debugging
 * 
 * @function generateRequestId
 * @param {Object} options - Request ID generation options
 * @returns {string} Unique correlation ID for request tracking across system boundaries
 * @example
 * import { generateRequestId } from './utils/index.js';
 * const correlationId = generateRequestId({ prefix: 'api', includeTimestamp: true });
 */
export const generateRequestId = loggerModule.generateRequestId;

/**
 * Performance logging function for recording metrics and resource utilization
 * Provides performance metrics logging, resource usage tracking, execution time monitoring,
 * and system performance analysis for application optimization and monitoring
 * 
 * @function logPerformanceMetrics
 * @param {Object} metrics - Performance metrics to log
 * @param {Object} context - Additional logging context
 * @returns {void} Performs performance metrics logging side effect
 * @example
 * import { logPerformanceMetrics } from './utils/index.js';
 * logPerformanceMetrics({ responseTime: 125, memoryUsage: 45.2 }, { endpoint: '/api/users' });
 */
export const logPerformanceMetrics = loggerModule.logPerformanceMetrics;

/**
 * Security event logging function for authentication failures and security monitoring
 * Provides security event tracking, authentication failure logging, security incident recording,
 * and security monitoring capabilities for comprehensive security audit and incident response
 * 
 * @function logSecurityEvent
 * @param {string} eventType - Type of security event
 * @param {Object} securityContext - Security-related context information
 * @param {Object} requestContext - Request context information
 * @returns {void} Performs security event logging side effect
 * @example
 * import { logSecurityEvent } from './utils/index.js';
 * logSecurityEvent('authentication-failure', { userId: 'user123' }, { ip: '192.168.1.1' });
 */
export const logSecurityEvent = loggerModule.logSecurityEvent;

/**
 * Factory for creating request-scoped loggers with correlation tracking and context
 * Provides request-scoped logging, correlation ID management, request lifecycle tracking,
 * and contextual logging capabilities for comprehensive request monitoring and debugging
 * 
 * @function createRequestLogger
 * @param {Object} request - HTTP request object
 * @param {Object} options - Logger configuration options
 * @returns {Object} Request-scoped logger with embedded correlation tracking
 * @example
 * import { createRequestLogger } from './utils/index.js';
 * const requestLogger = createRequestLogger(req, { includeHeaders: false });
 * requestLogger.info('Processing request', { action: 'validate-input' });
 */
export const createRequestLogger = loggerModule.createRequestLogger;

/**
 * Utility for formatting log messages with consistent structure and metadata
 * Provides structured log formatting, timestamp management, correlation ID inclusion,
 * and consistent log entry formatting for log aggregation systems and analysis tools
 * 
 * @function formatLogMessage
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context information
 * @param {Object} options - Formatting options
 * @returns {string} Formatted log message with structured output
 * @example
 * import { formatLogMessage } from './utils/index.js';
 * const formattedLog = formatLogMessage('info', 'User logged in', { userId: 'user123' });
 */
export const formatLogMessage = loggerModule.formatLogMessage;

/**
 * Utility for configuring automatic log file rotation with size limits and retention
 * Provides log rotation management, file size monitoring, log retention policies,
 * and automated log file management for production logging infrastructure
 * 
 * @function setupLogRotation
 * @param {Object} rotationConfig - Log rotation configuration
 * @returns {Promise<Object>} Log rotation monitoring and management system
 * @example
 * import { setupLogRotation } from './utils/index.js';
 * await setupLogRotation({ maxSize: '100M', maxFiles: 10, compress: true });
 */
export const setupLogRotation = loggerModule.setupLogRotation;

/**
 * Flask-compatible logging interface for cross-platform development and feature parity
 * Provides Flask-style logging interface, cross-platform compatibility, consistent logging patterns,
 * and educational comparison utilities for Node.js to Flask migration and feature validation
 * 
 * @function createFlaskCompatibleLogger
 * @param {Object} flaskConfig - Flask compatibility configuration
 * @returns {Object} Flask-compatible logger interface with consistent behavior
 * @example
 * import { createFlaskCompatibleLogger } from './utils/index.js';
 * const flaskLogger = createFlaskCompatibleLogger({ format: 'flask-style' });
 * flaskLogger.info('Flask-compatible log message');
 */
export const createFlaskCompatibleLogger = loggerModule.createFlaskCompatibleLogger;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export providing comprehensive utilities access
 * Aggregates all utility categories into a single export object for convenient access
 * when importing the entire utilities module as a single namespace
 * 
 * @default
 * @example
 * import utils from './utils/index.js';
 * utils.logger.info('Using default export');
 * const response = utils.formatHTTPResponse(data);
 */
export default {
  // Constants
  ENV_CONSTANTS,
  HTTP_CONSTANTS,
  API_CONSTANTS,
  SECURITY_CONSTANTS,
  PM2_CONSTANTS,
  TESTING_CONSTANTS,
  ERROR_CONSTANTS,
  FLASK_CONSTANTS,
  TUTORIAL_CONSTANTS,
  
  // Error Types
  BaseError,
  HTTPError,
  ValidationError,
  SecurityError,
  PM2Error,
  createErrorResponse,
  isOperationalError,
  sanitizeErrorForResponse,
  classifyErrorSeverity,
  createErrorFromCode,
  formatErrorForLogging,
  validateErrorInstance,
  
  // Helper Functions
  formatHTTPResponse,
  sanitizeInput,
  validateEmail,
  measurePerformance,
  retry,
  createHealthCheck,
  convertToFlaskFormat,
  generateTestData,
  createMockResponse,
  generateSecureToken,
  deepClone,
  parseUserAgent,
  
  // Logging Utilities
  logger,
  createLogger,
  generateRequestId,
  logPerformanceMetrics,
  logSecurityEvent,
  createRequestLogger,
  formatLogMessage,
  setupLogRotation,
  createFlaskCompatibleLogger
};