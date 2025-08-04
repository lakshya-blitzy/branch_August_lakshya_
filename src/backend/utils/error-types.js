/**
 * @fileoverview Comprehensive Error Type Definitions and Utilities for Node.js Tutorial Project
 * @description Advanced error management system providing standardized error classes, error response
 * formatting, and error handling utilities for Express.js v5.1.0 applications with PM2 cluster mode
 * compatibility. Implements modern JavaScript error patterns with inheritance-based error classification,
 * comprehensive error serialization, and cross-platform compatibility with Flask implementations.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Inheritance-based error classification with operational vs programming error distinction
 * - Express.js v5.1.0 compatible error handling with promise-based error support
 * - PM2 cluster mode compatible error tracking and correlation
 * - Security-conscious error sanitization for production environments
 * - Cross-platform compatibility with Flask error handling patterns
 * - Comprehensive error serialization for API responses and logging
 * - Educational error handling demonstrations for learning purposes
 * - Production-ready error information management and monitoring integration
 * 
 * Educational Value:
 * - Demonstrates modern error handling patterns and classification strategies
 * - Showcases inheritance-based error architecture design
 * - Illustrates security-conscious error information disclosure practices
 * - Provides comprehensive error tracking and correlation methodologies
 * - Teaches production-ready error management and monitoring integration
 * 
 * Technology Integration:
 * - Express.js v5.1.0 error middleware compatibility
 * - PM2 v6.0.8 cluster mode error handling support
 * - Helmet.js security error integration
 * - Node.js v22.x LTS native error handling capabilities
 * - Cross-platform Flask error response compatibility
 */

// External library imports with version comments
import util from 'node:util'; // Node.js built-in - Object inspection and formatting utilities for error debugging
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic functionality for secure error ID generation

// Internal imports with specific members for error handling functionality
import {
  ERROR_CONSTANTS,
  HTTP_CONSTANTS,
  PM2_CONSTANTS
} from './constants.js';

import logger, {
  error as logError,
  warn as logWarn,
  debug as logDebug,
  generateRequestId
} from './logger.js';

// Global error tracking and metrics for monitoring and analysis
const ERROR_REGISTRY = new Map(); // Centralized error instance tracking
const OPERATIONAL_ERROR_TYPES = new Set(['HTTPError', 'ValidationError', 'SecurityError']); // Recoverable error types
const PROGRAMMING_ERROR_TYPES = new Set(['TypeError', 'ReferenceError', 'SyntaxError']); // Bug-indicating error types
const ERROR_METRICS = { // Application-wide error metrics for monitoring
  total: 0,
  byType: {},
  operational: 0,
  programming: 0
};

/**
 * Base Error Class
 * 
 * Base error class that extends native JavaScript Error with enhanced functionality for the Node.js
 * tutorial project. Provides foundation for all custom error types with standardized properties,
 * serialization capabilities, and comprehensive error context management. Implements modern error
 * handling patterns with support for error chaining, correlation tracking, and production-ready
 * error information management.
 */
export class BaseError extends Error {
  /**
   * Initializes BaseError instance with message, context, and enhanced error properties.
   * Sets up error tracking, correlation IDs, and comprehensive error metadata for production
   * debugging and monitoring.
   * 
   * @param {string} message - Error message describing the issue
   * @param {Object} [options={}] - Error configuration options
   * @param {string} [options.code] - Error code for categorization
   * @param {Object} [options.context] - Additional error context
   * @param {boolean} [options.isOperational] - Whether error is operational (recoverable)
   * @param {Error} [options.cause] - Original error that caused this error
   * @param {string} [options.requestId] - Request correlation ID
   */
  constructor(message, options = {}) {
    // Call super constructor with error message to initialize native Error properties
    super(message);
    
    // Set error class name to constructor name for proper error identification
    this.name = this.constructor.name;
    
    // Generate unique error ID using crypto for error tracking and correlation
    this.errorId = crypto.randomUUID();
    
    // Set timestamp for error occurrence tracking and temporal analysis
    this.timestamp = new Date().toISOString();
    
    // Initialize context object with request ID, user context, and system information
    this.context = {
      requestId: options.requestId || generateRequestId({ prefix: 'err' }),
      userContext: options.userContext || {},
      systemInfo: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      ...options.context
    };
    
    // Set isOperational flag to true for operational error classification
    this.isOperational = options.isOperational !== false; // Default to operational
    
    // Initialize error code from options or default to generic error code
    this.code = options.code || ERROR_CONSTANTS.ERROR_CODES.INTERNAL_ERROR;
    
    // Set error cause chain for nested error tracking and debugging
    this.cause = options.cause || null;
    
    // Capture enhanced stack trace with source mapping and context
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Register error in global registry for tracking and analysis
    ERROR_REGISTRY.set(this.errorId, {
      errorType: this.name,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      code: this.code,
      context: this.context
    });
    
    // Update global error metrics for monitoring
    ERROR_METRICS.total++;
    ERROR_METRICS.byType[this.name] = (ERROR_METRICS.byType[this.name] || 0) + 1;
    if (this.isOperational) {
      ERROR_METRICS.operational++;
    } else {
      ERROR_METRICS.programming++;
    }
    
    // Log error creation using logger.debug for development debugging
    logDebug('BaseError instance created', {
      errorId: this.errorId,
      errorType: this.name,
      code: this.code,
      isOperational: this.isOperational,
      context: this.context
    });
  }

  /**
   * Serializes error instance to JSON-compatible object for API responses, logging, and
   * cross-system communication. Provides comprehensive error information while respecting
   * security and environment constraints.
   * 
   * @returns {Object} JSON-serializable error object with all relevant error information and context
   */
  toJSON() {
    // Extract error name, message, and basic error properties
    const errorData = {
      name: this.name,
      message: this.message,
      errorId: this.errorId,
      timestamp: this.timestamp,
      code: this.code,
      isOperational: this.isOperational
    };
    
    // Include sanitized context information appropriate for environment
    errorData.context = {
      requestId: this.context.requestId,
      systemInfo: {
        pid: this.context.systemInfo.pid,
        platform: this.context.systemInfo.platform,
        nodeVersion: this.context.systemInfo.nodeVersion
      }
    };
    
    // Add stack trace information if in development environment
    if (process.env.NODE_ENV === 'development') {
      errorData.stack = this.stack;
    }
    
    // Include error cause chain for nested error debugging
    if (this.cause) {
      errorData.cause = this.cause instanceof BaseError ? 
        this.cause.toJSON() : 
        { message: this.cause.message, name: this.cause.name };
    }
    
    // Return complete JSON-serializable error representation
    return errorData;
  }

  /**
   * Returns string representation of error for console output, logging, and debugging purposes.
   * Provides human-readable error information with context and correlation details.
   * 
   * @returns {string} Formatted string representation of error with context and debugging information
   */
  toString() {
    // Format error name and message for human readability
    let errorString = `${this.name}: ${this.message}`;
    
    // Include error ID and timestamp for correlation tracking
    errorString += ` [${this.errorId}] at ${this.timestamp}`;
    
    // Add context information relevant for debugging
    if (this.context.requestId) {
      errorString += ` (Request: ${this.context.requestId})`;
    }
    
    // Include operational vs programming error classification
    errorString += ` [${this.isOperational ? 'Operational' : 'Programming'} Error]`;
    
    // Format stack trace if available and in development mode
    if (this.stack && process.env.NODE_ENV === 'development') {
      errorString += `\n${this.stack}`;
    }
    
    // Return formatted string representation of complete error
    return errorString;
  }

  /**
   * Updates error context with additional information such as request details, user context,
   * or system state. Allows error enrichment throughout the error handling pipeline.
   * 
   * @param {Object} additionalContext - Additional context to merge with existing context
   * @returns {BaseError} Returns this instance for method chaining
   */
  setContext(additionalContext) {
    // Validate additional context object and properties
    if (typeof additionalContext !== 'object' || additionalContext === null) {
      logWarn('Invalid context provided to setContext', { 
        errorId: this.errorId,
        providedContext: additionalContext 
      });
      return this;
    }
    
    // Merge additional context with existing context information
    this.context = {
      ...this.context,
      ...additionalContext,
      updatedAt: new Date().toISOString()
    };
    
    // Update timestamp to reflect context update time
    this.timestamp = new Date().toISOString();
    
    // Log context update for debugging and tracking purposes
    logDebug('Error context updated', {
      errorId: this.errorId,
      additionalContext,
      updatedContext: this.context
    });
    
    // Return this instance for method chaining support
    return this;
  }

  /**
   * Returns correlation ID for error tracking across distributed systems and request flows.
   * Provides consistent error correlation for debugging and monitoring.
   * 
   * @returns {string} Correlation ID for distributed error tracking and request correlation
   */
  getCorrelationId() {
    // Extract correlation ID from error context or generate new one
    if (this.context.requestId) {
      return this.context.requestId;
    }
    
    // Format correlation ID for cross-system compatibility
    const correlationId = `${this.errorId}-${Date.now()}`;
    
    // Update context with generated correlation ID
    this.context.requestId = correlationId;
    
    // Return correlation ID for distributed debugging and tracking
    return correlationId;
  }
}

/**
 * HTTP Error Class
 * 
 * HTTP-specific error class that extends BaseError with HTTP status codes, headers, and
 * web-specific error handling capabilities. Designed for Express.js v5.1.0 error handling
 * with proper HTTP semantics, status code management, and RESTful API error responses.
 * Provides comprehensive HTTP error context and cross-platform compatibility with Flask implementations.
 */
export class HTTPError extends BaseError {
  /**
   * Initializes HTTPError with HTTP status code, headers, and request context.
   * Sets up HTTP-specific error properties and context for proper REST API error handling.
   * 
   * @param {string} message - HTTP error message
   * @param {number} statusCode - HTTP status code (defaults to 500)
   * @param {Object} [options={}] - HTTP error configuration options
   * @param {Object} [options.headers] - Custom HTTP headers
   * @param {string} [options.method] - HTTP method from request
   * @param {string} [options.url] - Request URL
   * @param {Object} [options.requestContext] - Additional request context
   */
  constructor(message, statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR, options = {}) {
    // Call BaseError constructor with message and options for basic error setup
    super(message, {
      ...options,
      code: options.code || `HTTP_${statusCode}`,
      isOperational: true // HTTP errors are always operational
    });
    
    // Set HTTP status code with validation against HTTP_CONSTANTS.STATUS_CODES
    this.statusCode = statusCode;
    
    // Initialize headers object for HTTP response header management
    this.headers = {
      'Content-Type': HTTP_CONSTANTS.CONTENT_TYPES.JSON,
      ...options.headers
    };
    
    // Extract request method and URL from options for context
    this.method = options.method || 'UNKNOWN';
    this.url = options.url || 'UNKNOWN';
    
    // Set up request context with HTTP-specific information
    this.requestContext = {
      method: this.method,
      url: this.url,
      statusCode: this.statusCode,
      userAgent: options.userAgent,
      ip: options.ip,
      ...options.requestContext
    };
    
    // Validate status code appropriateness for error type and context
    if (statusCode < 400 || statusCode >= 600) {
      logWarn('Invalid HTTP status code for HTTPError', {
        errorId: this.errorId,
        statusCode,
        suggestedRange: '400-599'
      });
    }
    
    // Set error code based on HTTP status code and error classification
    this.code = this.code || this._getErrorCodeFromStatus(statusCode);
    
    // Initialize HTTP-specific error tracking and correlation
    logDebug('HTTPError created', {
      errorId: this.errorId,
      statusCode: this.statusCode,
      method: this.method,
      url: this.url,
      headers: this.headers
    });
  }

  /**
   * Sets HTTP response header for error response with validation and security checks.
   * Supports proper HTTP error response formatting and security header management.
   * 
   * @param {string} name - Header name
   * @param {string} value - Header value
   * @returns {HTTPError} Returns this instance for method chaining
   */
  setHeader(name, value) {
    // Validate header name against HTTP standards and security policies
    if (typeof name !== 'string' || !name.trim()) {
      logWarn('Invalid header name provided to setHeader', {
        errorId: this.errorId,
        headerName: name
      });
      return this;
    }
    
    // Sanitize header value to prevent header injection attacks
    const sanitizedValue = typeof value === 'string' ? 
      value.replace(/[\r\n]/g, '') : String(value);
    
    // Set header in headers object with proper formatting
    this.headers[name] = sanitizedValue;
    
    // Log header setting for debugging and security monitoring
    logDebug('HTTP header set on error', {
      errorId: this.errorId,
      headerName: name,
      headerValue: sanitizedValue
    });
    
    // Return this instance for method chaining support
    return this;
  }

  /**
   * Returns standard HTTP status message for the error status code with fallback for
   * custom status codes. Provides proper HTTP semantics and client understanding.
   * 
   * @returns {string} HTTP status message corresponding to status code
   */
  getStatusMessage() {
    // Status message mapping for common HTTP status codes
    const statusMessages = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      408: 'Request Timeout',
      409: 'Conflict',
      413: 'Payload Too Large',
      415: 'Unsupported Media Type',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    
    // Look up status message from HTTP_CONSTANTS.STATUS_CODES or local mapping
    const message = statusMessages[this.statusCode];
    
    // Provide fallback message for custom or unknown status codes
    if (!message) {
      logWarn('Unknown HTTP status code, using generic message', {
        errorId: this.errorId,
        statusCode: this.statusCode
      });
      return `HTTP Error ${this.statusCode}`;
    }
    
    // Return formatted status message for HTTP response
    return message;
  }

  /**
   * Converts error to HTTP response format suitable for Express.js res.json() or Flask jsonify().
   * Provides standardized HTTP error response structure.
   * 
   * @param {Object} [options={}] - Response formatting options
   * @param {boolean} [options.includeStack] - Include stack trace in response
   * @param {boolean} [options.includeCause] - Include error cause in response
   * @returns {Object} HTTP response object with status, headers, and body ready for transmission
   */
  toHTTPResponse(options = {}) {
    // Create HTTP response object with status code and headers
    const response = {
      status: this.statusCode,
      headers: { ...this.headers }
    };
    
    // Include error message and code in response body
    const body = {
      error: {
        message: this.message,
        code: this.code,
        type: this.name,
        statusCode: this.statusCode,
        statusMessage: this.getStatusMessage()
      }
    };
    
    // Add request correlation information for debugging
    if (this.context.requestId) {
      body.error.requestId = this.context.requestId;
      response.headers['X-Request-ID'] = this.context.requestId;
    }
    
    // Include timestamp and error context appropriate for client
    body.error.timestamp = this.timestamp;
    
    // Add stack trace if requested and in development environment
    if (options.includeStack && process.env.NODE_ENV === 'development') {
      body.error.stack = this.stack;
    }
    
    // Include error cause if requested
    if (options.includeCause && this.cause) {
      body.error.cause = this.cause instanceof BaseError ? 
        this.cause.toJSON() : 
        { message: this.cause.message, name: this.cause.name };
    }
    
    // Format response for cross-platform compatibility
    response.body = body;
    
    // Return complete HTTP response object
    return response;
  }

  /**
   * Gets error code from HTTP status code
   * @private
   * @param {number} statusCode - HTTP status code
   * @returns {string} Error code corresponding to status code
   */
  _getErrorCodeFromStatus(statusCode) {
    const codeMapping = {
      400: ERROR_CONSTANTS.ERROR_CODES.BAD_REQUEST,
      401: ERROR_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      403: ERROR_CONSTANTS.ERROR_CODES.FORBIDDEN,
      404: ERROR_CONSTANTS.ERROR_CODES.NOT_FOUND,
      405: ERROR_CONSTANTS.ERROR_CODES.METHOD_NOT_ALLOWED,
      408: ERROR_CONSTANTS.ERROR_CODES.TIMEOUT,
      413: ERROR_CONSTANTS.ERROR_CODES.PAYLOAD_TOO_LARGE,
      415: ERROR_CONSTANTS.ERROR_CODES.UNSUPPORTED_MEDIA,
      429: ERROR_CONSTANTS.ERROR_CODES.RATE_LIMITED,
      500: ERROR_CONSTANTS.ERROR_CODES.INTERNAL_ERROR,
      501: ERROR_CONSTANTS.ERROR_CODES.NOT_IMPLEMENTED,
      502: ERROR_CONSTANTS.ERROR_CODES.BAD_GATEWAY,
      503: ERROR_CONSTANTS.ERROR_CODES.SERVICE_UNAVAILABLE,
      504: ERROR_CONSTANTS.ERROR_CODES.GATEWAY_TIMEOUT
    };
    
    return codeMapping[statusCode] || ERROR_CONSTANTS.ERROR_CODES.INTERNAL_ERROR;
  }
}

/**
 * Validation Error Class
 * 
 * Validation-specific error class for input validation failures, parameter checking, and
 * data integrity violations. Extends BaseError with field-level validation details,
 * constraint information, and user-friendly validation error reporting. Designed for
 * comprehensive form validation, API parameter validation, and data quality enforcement.
 */
export class ValidationError extends BaseError {
  /**
   * Initializes ValidationError with field-level validation failures and constraint details.
   * Sets up comprehensive validation error context for user-friendly error reporting.
   * 
   * @param {string} message - Validation error message
   * @param {Array} [validationErrors=[]] - Array of field-level validation errors
   * @param {Object} [options={}] - Validation error configuration options
   * @param {Object} [options.validationContext] - Validation schema and constraint information
   * @param {Object} [options.fieldConstraints] - Field-specific constraint definitions
   */
  constructor(message, validationErrors = [], options = {}) {
    // Call BaseError constructor with validation message and options
    super(message, {
      ...options,
      code: options.code || ERROR_CONSTANTS.ERROR_CODES.BAD_REQUEST,
      isOperational: true // Validation errors are always operational
    });
    
    // Initialize validationErrors array with field-level error details
    this.validationErrors = Array.isArray(validationErrors) ? validationErrors : [];
    
    // Create fieldErrors object mapping field names to error messages
    this.fieldErrors = {};
    this.validationErrors.forEach(error => {
      if (error.field) {
        if (!this.fieldErrors[error.field]) {
          this.fieldErrors[error.field] = [];
        }
        this.fieldErrors[error.field].push(error);
      }
    });
    
    // Count total validation errors for summary reporting
    this.errorCount = this.validationErrors.length;
    
    // Set up validation context with schema and constraint information
    this.validationContext = {
      schema: options.schema || null,
      constraints: options.fieldConstraints || {},
      validationRules: options.validationRules || {},
      ...options.validationContext
    };
    
    // Format validation errors for user-friendly presentation
    this._formatValidationErrors();
    
    // Set HTTP status code to 400 Bad Request for validation failures
    this.statusCode = HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST;
    
    // Initialize validation-specific error tracking
    logDebug('ValidationError created', {
      errorId: this.errorId,
      errorCount: this.errorCount,
      fields: Object.keys(this.fieldErrors),
      validationContext: this.validationContext
    });
  }

  /**
   * Adds field-specific validation error with constraint details and user-friendly messaging.
   * Supports dynamic validation error building during validation processes.
   * 
   * @param {string} fieldName - Name of the field that failed validation
   * @param {string} errorMessage - Descriptive error message for the field
   * @param {Object} [constraintDetails={}] - Constraint information and validation rules
   * @returns {ValidationError} Returns this instance for method chaining
   */
  addFieldError(fieldName, errorMessage, constraintDetails = {}) {
    // Validate field name and error message parameters
    if (typeof fieldName !== 'string' || !fieldName.trim()) {
      logWarn('Invalid field name provided to addFieldError', {
        errorId: this.errorId,
        fieldName
      });
      return this;
    }
    
    if (typeof errorMessage !== 'string' || !errorMessage.trim()) {
      logWarn('Invalid error message provided to addFieldError', {
        errorId: this.errorId,
        fieldName,
        errorMessage
      });
      return this;
    }
    
    // Create field error object with details
    const fieldError = {
      field: fieldName,
      message: errorMessage,
      code: constraintDetails.code || ERROR_CONSTANTS.VALIDATION_ERRORS.INVALID_FORMAT,
      value: constraintDetails.value,
      constraint: constraintDetails.constraint,
      expectedType: constraintDetails.expectedType,
      actualType: constraintDetails.actualType,
      timestamp: new Date().toISOString()
    };
    
    // Add field error to validationErrors array with details
    this.validationErrors.push(fieldError);
    
    // Update fieldErrors mapping for field-specific access
    if (!this.fieldErrors[fieldName]) {
      this.fieldErrors[fieldName] = [];
    }
    this.fieldErrors[fieldName].push(fieldError);
    
    // Increment error count for summary tracking
    this.errorCount = this.validationErrors.length;
    
    // Include constraint details for user guidance
    if (constraintDetails.helpText) {
      fieldError.helpText = constraintDetails.helpText;
    }
    
    // Log field error addition for debugging
    logDebug('Field error added to ValidationError', {
      errorId: this.errorId,
      fieldName,
      errorMessage,
      constraintDetails
    });
    
    // Return this instance for method chaining
    return this;
  }

  /**
   * Returns field-specific validation errors in user-friendly format for form error display
   * and API error responses. Provides structured validation feedback.
   * 
   * @param {string} [fieldName] - Specific field name to get errors for (optional)
   * @returns {Array} Array of validation errors for specified field or all fields if no field specified
   */
  getFieldErrors(fieldName) {
    // Filter validation errors by field name if specified
    if (fieldName) {
      return this.fieldErrors[fieldName] || [];
    }
    
    // Format field errors for user-friendly presentation
    const formattedErrors = {};
    
    Object.keys(this.fieldErrors).forEach(field => {
      formattedErrors[field] = this.fieldErrors[field].map(error => ({
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        value: error.value,
        helpText: error.helpText
      }));
    });
    
    // Include constraint information and correction guidance
    return formattedErrors;
  }

  /**
   * Returns validation error summary with total error count, affected fields, and overall
   * validation status. Provides high-level validation feedback.
   * 
   * @returns {Object} Validation error summary with counts, fields, and status information
   */
  getSummary() {
    // Count total validation errors and affected fields
    const affectedFields = Object.keys(this.fieldErrors);
    
    // Identify most common validation error types
    const errorTypeCounts = {};
    this.validationErrors.forEach(error => {
      const code = error.code || 'UNKNOWN';
      errorTypeCounts[code] = (errorTypeCounts[code] || 0) + 1;
    });
    
    const mostCommonError = Object.keys(errorTypeCounts).reduce((a, b) => 
      errorTypeCounts[a] > errorTypeCounts[b] ? a : b, 'NONE');
    
    // Generate overall validation status and severity
    const severity = this.errorCount > 5 ? 'high' : 
                    this.errorCount > 2 ? 'medium' : 'low';
    
    // Create summary object with counts and field information
    const summary = {
      totalErrors: this.errorCount,
      affectedFields: affectedFields.length,
      fieldList: affectedFields,
      errorTypes: errorTypeCounts,
      mostCommonError,
      severity,
      isValid: this.errorCount === 0,
      timestamp: this.timestamp,
      validationContext: {
        hasSchema: !!this.validationContext.schema,
        hasConstraints: Object.keys(this.validationContext.constraints).length > 0
      }
    };
    
    // Return comprehensive validation error summary
    return summary;
  }

  /**
   * Formats validation errors for consistent presentation
   * @private
   */
  _formatValidationErrors() {
    this.validationErrors = this.validationErrors.map(error => {
      if (typeof error === 'string') {
        return {
          field: 'unknown',
          message: error,
          code: ERROR_CONSTANTS.VALIDATION_ERRORS.INVALID_FORMAT,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        field: error.field || 'unknown',
        message: error.message || 'Validation failed',
        code: error.code || ERROR_CONSTANTS.VALIDATION_ERRORS.INVALID_FORMAT,
        value: error.value,
        constraint: error.constraint,
        timestamp: error.timestamp || new Date().toISOString(),
        ...error
      };
    });
  }
}

/**
 * Security Error Class
 * 
 * Security-specific error class for authentication failures, authorization violations,
 * CORS issues, CSP violations, and security policy breaches. Extends BaseError with
 * security context, violation details, and enhanced security logging capabilities.
 * Designed for integration with Helmet.js security middleware and comprehensive security monitoring.
 */
export class SecurityError extends BaseError {
  /**
   * Initializes SecurityError with security violation type, client information, and security context.
   * Sets up comprehensive security error tracking and monitoring.
   * 
   * @param {string} message - Security error message
   * @param {string} securityType - Type of security violation
   * @param {Object} [options={}] - Security error configuration options
   * @param {Object} [options.violationDetails] - Specific violation information
   * @param {string} [options.clientIp] - Client IP address
   * @param {string} [options.userAgent] - Client user agent
   * @param {Object} [options.securityContext] - Additional security context
   */
  constructor(message, securityType, options = {}) {
    // Call BaseError constructor with security message and options
    super(message, {
      ...options,
      code: options.code || ERROR_CONSTANTS.ERROR_CODES.FORBIDDEN,
      isOperational: true // Security errors are operational
    });
    
    // Set security violation type from SECURITY_CONSTANTS.SECURITY_ERRORS
    this.securityType = securityType || 'unknown-violation';
    
    // Extract client IP address and user agent for security tracking
    this.clientIp = options.clientIp || options.ip || 'unknown';
    this.userAgent = options.userAgent || 'unknown';
    
    // Initialize violation details with security policy context
    this.violationDetails = {
      type: this.securityType,
      severity: this._determineSeverity(this.securityType),
      detectedAt: new Date().toISOString(),
      source: 'application',
      ...options.violationDetails
    };
    
    // Set up security context with authentication and authorization details
    this.securityContext = {
      clientIp: this.clientIp,
      userAgent: this.userAgent,
      sessionId: options.sessionId,
      userId: options.userId,
      permissions: options.permissions || [],
      authMethod: options.authMethod,
      requestHeaders: options.requestHeaders ? this._sanitizeHeaders(options.requestHeaders) : {},
      violationHistory: options.violationHistory || [],
      ...options.securityContext
    };
    
    // Configure security-specific error logging and alerting
    this._setupSecurityLogging();
    
    // Set appropriate HTTP status code based on security violation type
    this.statusCode = this._getSecurityStatusCode(this.securityType);
    
    // Initialize security event tracking and correlation
    logDebug('SecurityError created', {
      errorId: this.errorId,
      securityType: this.securityType,
      severity: this.violationDetails.severity,
      clientIp: this.clientIp,
      statusCode: this.statusCode
    });
  }

  /**
   * Sanitizes security error details for safe logging by removing sensitive information
   * while preserving security investigation details. Balances security monitoring needs
   * with information protection.
   * 
   * @returns {Object} Sanitized security error details safe for logging and monitoring systems
   */
  sanitizeForLogging() {
    // Remove sensitive authentication credentials and tokens
    const sanitized = {
      errorId: this.errorId,
      securityType: this.securityType,
      severity: this.violationDetails.severity,
      timestamp: this.timestamp,
      clientIp: this._maskIpAddress(this.clientIp),
      userAgent: this._sanitizeUserAgent(this.userAgent)
    };
    
    // Sanitize user data while preserving security violation patterns
    if (this.securityContext.userId) {
      sanitized.userId = this._hashIdentifier(this.securityContext.userId);
    }
    
    // Keep client identification information for security tracking
    sanitized.fingerprint = this._generateClientFingerprint();
    
    // Preserve violation type and policy details for analysis
    sanitized.violationDetails = {
      type: this.violationDetails.type,
      severity: this.violationDetails.severity,
      source: this.violationDetails.source,
      detectedAt: this.violationDetails.detectedAt
    };
    
    // Include timestamp and correlation information for investigation
    sanitized.correlationId = this.getCorrelationId();
    
    // Return sanitized security error details
    return sanitized;
  }

  /**
   * Generates security alert information for monitoring systems and security teams.
   * Provides structured security incident data for alerting and response workflows.
   * 
   * @param {Object} [alertOptions={}] - Alert configuration options
   * @param {boolean} [alertOptions.includeContext] - Include full security context
   * @param {string} [alertOptions.alertLevel] - Override alert level
   * @returns {Object} Security alert object with incident details, severity, and response recommendations
   */
  getSecurityAlert(alertOptions = {}) {
    // Classify security incident severity based on violation type
    const alertSeverity = alertOptions.alertLevel || this.violationDetails.severity;
    
    // Extract threat indicators and attack patterns
    const threatIndicators = this._analyzeThreatPatterns();
    
    // Generate recommended response actions for security teams
    const responseActions = this._getResponseRecommendations(alertSeverity);
    
    // Include incident correlation and threat intelligence
    const alert = {
      alertId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      severity: alertSeverity,
      type: 'security-violation',
      
      incident: {
        errorId: this.errorId,
        securityType: this.securityType,
        message: this.message,
        source: this.violationDetails.source
      },
      
      threat: {
        clientIp: this.clientIp,
        userAgent: this.userAgent,
        indicators: threatIndicators,
        riskScore: this._calculateRiskScore()
      },
      
      response: {
        recommended: responseActions,
        priority: this._getPriority(alertSeverity),
        escalation: this._getEscalationPath(alertSeverity)
      },
      
      context: alertOptions.includeContext ? this.sanitizeForLogging() : null
    };
    
    // Format alert for security monitoring integration
    return alert;
  }

  /**
   * Determines if security violation should result in client blocking or rate limiting
   * based on severity, patterns, and security policies. Supports automated security response decisions.
   * 
   * @returns {Object} Blocking recommendation with action type, duration, and rationale
   */
  shouldBlock() {
    // Analyze security violation severity and threat level
    const riskScore = this._calculateRiskScore();
    const severity = this.violationDetails.severity;
    
    // Check violation patterns and frequency for escalation
    const violationHistory = this.securityContext.violationHistory || [];
    const recentViolations = violationHistory.filter(v => 
      Date.now() - new Date(v.timestamp).getTime() < 3600000 // Last hour
    ).length;
    
    // Evaluate client reputation and historical behavior
    const reputationScore = this._calculateReputationScore();
    
    // Apply security policy rules for blocking decisions
    let shouldBlock = false;
    let blockDuration = 0;
    let blockReason = '';
    
    // Critical violations - immediate block
    if (severity === 'critical' || riskScore > 90) {
      shouldBlock = true;
      blockDuration = 3600000; // 1 hour
      blockReason = 'Critical security violation detected';
    }
    // High severity with pattern - block
    else if (severity === 'high' && (recentViolations > 3 || reputationScore < 30)) {
      shouldBlock = true;
      blockDuration = 1800000; // 30 minutes
      blockReason = 'High severity violation with suspicious pattern';
    }
    // Medium severity with high frequency - temporary block
    else if (severity === 'medium' && recentViolations > 5) {
      shouldBlock = true;
      blockDuration = 300000; // 5 minutes
      blockReason = 'Repeated security violations';
    }
    
    // Generate blocking recommendation with duration and rationale
    const recommendation = {
      shouldBlock,
      action: shouldBlock ? 'block' : 'monitor',
      duration: blockDuration,
      reason: blockReason,
      riskScore,
      reputationScore,
      violationCount: recentViolations,
      severity,
      timestamp: new Date().toISOString(),
      reviewRequired: severity === 'critical' || riskScore > 95
    };
    
    // Return structured blocking decision information
    return recommendation;
  }

  /**
   * Determines security violation severity
   * @private
   * @param {string} securityType - Security violation type
   * @returns {string} Severity level
   */
  _determineSeverity(securityType) {
    const severityMap = {
      'csrf-violation': 'high',
      'xss-attempt': 'high', 
      'sql-injection': 'critical',
      'path-traversal': 'high',
      'authentication-failure': 'medium',
      'authorization-violation': 'high',
      'rate-limit-exceeded': 'medium',
      'cors-violation': 'medium',
      'csp-violation': 'low',
      'security-header-missing': 'low',
      'suspicious-user-agent': 'medium',
      'malicious-payload': 'high',
      'brute-force-attempt': 'high'
    };
    
    return severityMap[securityType] || 'medium';
  }

  /**
   * Gets HTTP status code for security violation type
   * @private
   * @param {string} securityType - Security violation type
   * @returns {number} HTTP status code
   */
  _getSecurityStatusCode(securityType) {
    const statusMap = {
      'authentication-failure': HTTP_CONSTANTS.STATUS_CODES.UNAUTHORIZED,
      'authorization-violation': HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN,
      'rate-limit-exceeded': HTTP_CONSTANTS.STATUS_CODES.TOO_MANY_REQUESTS,
      'csrf-violation': HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN,
      'cors-violation': HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN,
      'xss-attempt': HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST,
      'sql-injection': HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST,
      'path-traversal': HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN
    };
    
    return statusMap[securityType] || HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN;
  }

  /**
   * Sanitizes request headers for security logging
   * @private
   * @param {Object} headers - Request headers
   * @returns {Object} Sanitized headers
   */
  _sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized = {};
    
    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = headers[key];
      }
    });
    
    return sanitized;
  }

  /**
   * Masks IP address for privacy
   * @private
   * @param {string} ip - IP address
   * @returns {string} Masked IP address
   */
  _maskIpAddress(ip) {
    if (!ip || ip === 'unknown') return 'unknown';
    
    // IPv4 masking
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    
    // IPv6 masking
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::xxxx';
    }
    
    return 'masked';
  }

  /**
   * Sanitizes user agent for logging
   * @private
   * @param {string} userAgent - User agent string
   * @returns {string} Sanitized user agent
   */
  _sanitizeUserAgent(userAgent) {
    if (!userAgent || userAgent === 'unknown') return 'unknown';
    
    // Extract basic browser/OS info, remove detailed version numbers
    return userAgent
      .replace(/\b\d+\.\d+\.\d+\.\d+\b/g, 'x.x.x.x')
      .substring(0, 200);
  }

  /**
   * Generates client fingerprint for tracking
   * @private
   * @returns {string} Client fingerprint hash
   */
  _generateClientFingerprint() {
    const fingerprint = `${this.clientIp}-${this.userAgent}-${this.securityType}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }

  /**
   * Hashes identifier for privacy
   * @private
   * @param {string} identifier - Identifier to hash
   * @returns {string} Hashed identifier
   */
  _hashIdentifier(identifier) {
    return crypto.createHash('sha256').update(identifier.toString()).digest('hex').substring(0, 16);
  }

  /**
   * Analyzes threat patterns
   * @private
   * @returns {Array} Threat indicators
   */
  _analyzeThreatPatterns() {
    const indicators = [];
    
    // Common attack patterns
    if (this.securityType.includes('injection')) {
      indicators.push('injection-attempt');
    }
    
    if (this.securityType.includes('xss')) {
      indicators.push('cross-site-scripting');
    }
    
    if (this.violationDetails.severity === 'critical') {
      indicators.push('critical-threat');
    }
    
    return indicators;
  }

  /**
   * Calculates risk score
   * @private
   * @returns {number} Risk score (0-100)
   */
  _calculateRiskScore() {
    let score = 0;
    
    // Base score by severity
    const severityScores = { low: 20, medium: 50, high: 75, critical: 95 };
    score += severityScores[this.violationDetails.severity] || 50;
    
    // Adjust for violation type
    if (this.securityType.includes('injection')) score += 15;
    if (this.securityType.includes('authentication')) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Calculates reputation score
   * @private
   * @returns {number} Reputation score (0-100)
   */
  _calculateReputationScore() {
    const violationHistory = this.securityContext.violationHistory || [];
    const recentViolations = violationHistory.length;
    
    // Start with good reputation
    let score = 100;
    
    // Decrease based on violation history
    score -= recentViolations * 10;
    
    return Math.max(score, 0);
  }

  /**
   * Gets response recommendations
   * @private
   * @param {string} severity - Alert severity
   * @returns {Array} Response recommendations
   */
  _getResponseRecommendations(severity) {
    const recommendations = [];
    
    switch (severity) {
      case 'critical':
        recommendations.push('immediate-block', 'security-team-alert', 'incident-response');
        break;
      case 'high':
        recommendations.push('temporary-block', 'security-review', 'enhanced-monitoring');
        break;
      case 'medium':
        recommendations.push('rate-limit', 'warning-log', 'pattern-analysis');
        break;
      default:
        recommendations.push('monitor', 'log-event');
    }
    
    return recommendations;
  }

  /**
   * Gets alert priority
   * @private
   * @param {string} severity - Alert severity
   * @returns {string} Priority level
   */
  _getPriority(severity) {
    const priorityMap = {
      critical: 'P1',
      high: 'P2', 
      medium: 'P3',
      low: 'P4'
    };
    
    return priorityMap[severity] || 'P3';
  }

  /**
   * Gets escalation path
   * @private
   * @param {string} severity - Alert severity
   * @returns {string} Escalation path
   */
  _getEscalationPath(severity) {
    const escalationMap = {
      critical: 'security-team-immediate',
      high: 'security-team-1h',
      medium: 'security-team-4h',
      low: 'security-team-24h'
    };
    
    return escalationMap[severity] || 'security-team-24h';
  }

  /**
   * Sets up security-specific logging
   * @private
   */
  _setupSecurityLogging() {
    // Emit security event for monitoring
    process.nextTick(() => {
      process.emit('security-event', {
        type: this.securityType,
        severity: this.violationDetails.severity,
        errorId: this.errorId,
        timestamp: this.timestamp,
        context: this.sanitizeForLogging()
      });
    });
  }
}

/**
 * PM2 Error Class
 * 
 * PM2-specific error class for process management failures, cluster mode issues, deployment
 * problems, and distributed system errors. Extends BaseError with PM2 process context,
 * cluster information, and production deployment error handling capabilities. Designed for
 * comprehensive PM2 integration and production monitoring.
 */
export class PM2Error extends BaseError {
  /**
   * Initializes PM2Error with process operation details, cluster context, and deployment information.
   * Sets up PM2-specific error tracking and process management context.
   * 
   * @param {string} message - PM2 operation error message
   * @param {string} operation - PM2 operation that failed
   * @param {Object} [options={}] - PM2 error configuration options
   * @param {number} [options.processId] - PM2 process ID
   * @param {string} [options.instanceName] - PM2 instance name
   * @param {Object} [options.clusterInfo] - PM2 cluster information
   * @param {Object} [options.deploymentContext] - Deployment context and metadata
   */
  constructor(message, operation, options = {}) {
    // Call BaseError constructor with PM2 operation message and options
    super(message, {
      ...options,
      code: options.code || ERROR_CONSTANTS.ERROR_CODES.SERVICE_UNAVAILABLE,
      isOperational: true // PM2 errors are operational
    });
    
    // Set PM2 operation type from PM2_CONSTANTS.EXEC_MODES
    this.operation = operation || 'unknown-operation';
    
    // Extract process ID and instance name from options or process environment
    this.processId = options.processId || process.env.pm_id || process.pid;
    this.instanceName = options.instanceName || process.env.name || `process-${this.processId}`;
    
    // Initialize cluster information with node count and distribution
    this.clusterInfo = {
      execMode: process.env.exec_mode || PM2_CONSTANTS.EXEC_MODES.FORK,
      instances: process.env.instances || 1,
      nodeId: process.env.NODE_APP_INSTANCE || 0,
      pmId: process.env.pm_id,
      processName: process.env.name,
      ...options.clusterInfo
    };
    
    // Set up deployment context with version and environment details
    this.deploymentContext = {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      deployedAt: process.env.pm_uptime ? new Date(parseInt(process.env.pm_uptime)) : new Date(),
      source: process.env.pm_cwd || process.cwd(),
      nodeVersion: process.version,
      pm2Version: process.env.PM2_VERSION,
      ...options.deploymentContext
    };
    
    // Configure PM2-specific error logging and process monitoring
    this._setupPM2Logging();
    
    // Set appropriate error severity based on operation impact
    this.severity = this._determinePM2Severity(this.operation);
    
    // Initialize PM2 error correlation and process tracking
    logDebug('PM2Error created', {
      errorId: this.errorId,
      operation: this.operation,
      processId: this.processId,
      instanceName: this.instanceName,
      severity: this.severity,
      clusterInfo: this.clusterInfo
    });
  }

  /**
   * Returns comprehensive PM2 process information including status, resource usage,
   * cluster position, and health metrics. Provides process diagnostics for error investigation.
   * 
   * @returns {Object} Complete PM2 process information with status, metrics, and cluster context
   */
  getProcessInfo() {
    // Collect current process status and operational state
    const processStatus = {
      pid: this.processId,
      instanceName: this.instanceName,
      status: this._getProcessStatus(),
      startTime: this.deploymentContext.deployedAt,
      uptime: process.uptime(),
      restarts: process.env.restart_time || 0
    };
    
    // Gather resource usage including CPU and memory utilization
    const resourceUsage = {
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      loadAverage: require('os').loadavg(),
      freeMemory: require('os').freemem(),
      totalMemory: require('os').totalmem()
    };
    
    // Include cluster position and load balancing information
    const clusterPosition = {
      execMode: this.clusterInfo.execMode,
      instances: this.clusterInfo.instances,
      nodeId: this.clusterInfo.nodeId,
      isClusterMode: this.clusterInfo.execMode === PM2_CONSTANTS.EXEC_MODES.CLUSTER,
      isPrimary: this.clusterInfo.nodeId === 0
    };
    
    // Add process health metrics and performance indicators
    const healthMetrics = {
      errorRate: this._calculateErrorRate(),
      responseTime: this._getAverageResponseTime(),
      requestCount: this._getRequestCount(),
      lastHeartbeat: new Date().toISOString(),
      healthScore: this._calculateHealthScore()
    };
    
    // Include deployment context and version information
    const deploymentInfo = {
      environment: this.deploymentContext.environment,
      version: this.deploymentContext.version,
      deployedAt: this.deploymentContext.deployedAt,
      source: this.deploymentContext.source,
      nodeVersion: this.deploymentContext.nodeVersion,
      pm2Version: this.deploymentContext.pm2Version
    };
    
    // Return comprehensive PM2 process diagnostics
    return {
      process: processStatus,
      resources: resourceUsage,
      cluster: clusterPosition,
      health: healthMetrics,
      deployment: deploymentInfo,
      error: {
        errorId: this.errorId,
        operation: this.operation,
        severity: this.severity,
        timestamp: this.timestamp
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determines appropriate recovery action for PM2 error based on operation type, error severity,
   * and cluster impact. Supports automated error recovery and process management.
   * 
   * @param {Object} [recoveryOptions={}] - Recovery configuration options
   * @param {boolean} [recoveryOptions.autoRestart] - Enable automatic restart
   * @param {number} [recoveryOptions.maxRestarts] - Maximum restart attempts
   * @param {boolean} [recoveryOptions.gracefulShutdown] - Use graceful shutdown
   * @returns {Object} Recovery action recommendation with steps, timeline, and impact assessment
   */
  getRecoveryAction(recoveryOptions = {}) {
    const config = {
      autoRestart: recoveryOptions.autoRestart !== false,
      maxRestarts: recoveryOptions.maxRestarts || 5,
      gracefulShutdown: recoveryOptions.gracefulShutdown !== false,
      restartDelay: recoveryOptions.restartDelay || 4000,
      ...recoveryOptions
    };
    
    // Analyze PM2 error type and operation impact on service availability
    const impactAnalysis = this._analyzeServiceImpact();
    
    // Determine if error affects single process or entire cluster
    const clusterImpact = this.affectsCluster();
    
    // Evaluate recovery options including restart, reload, or scale operations
    let recoveryAction = 'monitor';
    let recoverySteps = [];
    let estimatedDowntime = 0;
    
    switch (this.operation) {
      case 'start':
      case 'restart':
        if (impactAnalysis.severity === 'critical') {
          recoveryAction = 'emergency-restart';
          recoverySteps = [
            'Stop problematic process',
            'Clear process locks',
            'Restart with increased timeout',
            'Validate process health'
          ];
          estimatedDowntime = clusterImpact ? 30000 : 5000; // 30s cluster, 5s single
        } else {
          recoveryAction = 'standard-restart';
          recoverySteps = [
            'Graceful process restart',
            'Health check validation',
            'Monitor for stability'
          ];
          estimatedDowntime = 2000;
        }
        break;
        
      case 'reload':
        recoveryAction = 'rolling-restart';
        recoverySteps = [
          'Initiate rolling restart',
          'Process each instance sequentially',
          'Validate cluster health',
          'Complete reload operation'
        ];
        estimatedDowntime = 0; // Zero downtime reload
        break;
        
      case 'scale':
        recoveryAction = 'reconfigure-cluster';
        recoverySteps = [
          'Assess current cluster state',
          'Adjust instance count',
          'Rebalance load distribution',
          'Validate scaling operation'
        ];
        estimatedDowntime = 10000;
        break;
        
      case 'stop':
        recoveryAction = 'investigate-shutdown';
        recoverySteps = [
          'Investigate shutdown cause',
          'Check for resource constraints',
          'Review application logs',
          'Determine restart necessity'
        ];
        estimatedDowntime = 0; // No automatic restart
        break;
        
      default:
        recoveryAction = 'diagnostic-review';
        recoverySteps = [
          'Analyze error details',
          'Check process status',
          'Review system resources',
          'Determine appropriate action'
        ];
        estimatedDowntime = 0;
    }
    
    // Generate recovery timeline and estimated service impact
    const recoveryTimeline = {
      startTime: new Date().toISOString(),
      estimatedDuration: estimatedDowntime + 5000, // Add 5s buffer
      estimatedDowntime,
      affectedInstances: clusterImpact ? this.clusterInfo.instances : 1
    };
    
    // Include rollback options and contingency planning
    const contingencyPlan = {
      rollbackAvailable: this.operation === 'reload' || this.operation === 'restart',
      rollbackSteps: [
        'Stop failed recovery attempt',
        'Restore previous process state',
        'Validate service stability'
      ],
      escalationTrigger: config.maxRestarts,
      emergencyContact: 'ops-team'
    };
    
    // Return structured recovery action plan
    return {
      action: recoveryAction,
      severity: impactAnalysis.severity,
      steps: recoverySteps,
      timeline: recoveryTimeline,
      impact: impactAnalysis,
      contingency: contingencyPlan,
      configuration: config,
      clusterAffected: clusterImpact,
      recommendation: this._getRecoveryRecommendation(recoveryAction, impactAnalysis),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determines if PM2 error affects entire cluster or single process instance.
   * Critical for understanding service impact and recovery planning in cluster mode deployments.
   * 
   * @returns {boolean} True if error affects entire cluster, false if limited to single process
   */
  affectsCluster() {
    // Analyze error operation type and scope of impact
    const clusterAffectingOperations = [
      'cluster-restart',
      'scale',
      'reload-cluster',
      'stop-all',
      'gracefulReload'
    ];
    
    // Check if error originates from cluster management or single process
    const isClusterOperation = clusterAffectingOperations.includes(this.operation) ||
                              this.operation.includes('cluster') ||
                              this.operation.includes('all');
    
    // Evaluate dependencies and shared resources affected by error
    const hasSharedResources = this.clusterInfo.execMode === PM2_CONSTANTS.EXEC_MODES.CLUSTER &&
                              this.clusterInfo.instances > 1;
    
    // Check for critical system-level errors that affect all processes
    const isCriticalSystemError = this.severity === 'critical' &&
                                 (this.operation.includes('memory') ||
                                  this.operation.includes('system') ||
                                  this.operation.includes('resource'));
    
    // Determine cascade effects on other cluster processes
    const hasCascadeEffect = isCriticalSystemError ||
                           this.operation === 'start' && hasSharedResources ||
                           this.operation === 'stop' && this.clusterInfo.isPrimary;
    
    // Return cluster impact assessment for recovery planning
    return isClusterOperation || hasCascadeEffect;
  }

  /**
   * Determines PM2 error severity based on operation type
   * @private
   * @param {string} operation - PM2 operation
   * @returns {string} Severity level
   */
  _determinePM2Severity(operation) {
    const severityMap = {
      'start': 'high',
      'stop': 'medium',
      'restart': 'medium',
      'reload': 'low',
      'scale': 'medium',
      'gracefulReload': 'low',
      'cluster-restart': 'high',
      'memory-limit': 'high',
      'cpu-limit': 'medium',
      'health-check': 'low',
      'deploy': 'high',
      'ecosystem': 'medium'
    };
    
    return severityMap[operation] || 'medium';
  }

  /**
   * Analyzes service impact of PM2 error
   * @private
   * @returns {Object} Service impact analysis
   */
  _analyzeServiceImpact() {
    const analysis = {
      severity: this.severity,
      scope: this.affectsCluster() ? 'cluster' : 'single-process',
      serviceAvailability: 'unknown',
      userImpact: 'minimal'
    };
    
    // Determine service availability impact
    if (this.affectsCluster()) {
      analysis.serviceAvailability = this.severity === 'critical' ? 'degraded' : 'operational';
      analysis.userImpact = this.severity === 'critical' ? 'significant' : 'minimal';
    } else {
      analysis.serviceAvailability = 'operational'; // Other instances handle traffic
      analysis.userImpact = 'minimal';
    }
    
    return analysis;
  }

  /**
   * Gets process status
   * @private
   * @returns {string} Process status
   */
  _getProcessStatus() {
    // In real PM2 environment, this would check actual process status
    return process.env.pm_id ? 'online' : 'unknown';
  }

  /**
   * Calculates error rate
   * @private
   * @returns {number} Error rate percentage
   */
  _calculateErrorRate() {
    // Placeholder - in production would track actual error metrics
    return ERROR_METRICS.total > 0 ? 
      (ERROR_METRICS.total / (ERROR_METRICS.total + 100)) * 100 : 0;
  }

  /**
   * Gets average response time
   * @private
   * @returns {number} Average response time in ms
   */
  _getAverageResponseTime() {
    // Placeholder - in production would track actual response times
    return 50 + Math.random() * 50; // Mock response time
  }

  /**
   * Gets request count
   * @private
   * @returns {number} Request count
   */
  _getRequestCount() {
    // Placeholder - in production would track actual request counts
    return Math.floor(Math.random() * 1000);
  }

  /**
   * Calculates health score
   * @private
   * @returns {number} Health score (0-100)
   */
  _calculateHealthScore() {
    const errorRate = this._calculateErrorRate();
    const baseScore = 100 - errorRate;
    
    // Adjust for severity
    const severityPenalty = {
      low: 0,
      medium: 10,
      high: 20,
      critical: 30
    };
    
    return Math.max(baseScore - (severityPenalty[this.severity] || 0), 0);
  }

  /**
   * Gets recovery recommendation
   * @private
   * @param {string} recoveryAction - Recovery action
   * @param {Object} impactAnalysis - Impact analysis
   * @returns {string} Recovery recommendation
   */
  _getRecoveryRecommendation(recoveryAction, impactAnalysis) {
    if (impactAnalysis.severity === 'critical') {
      return 'Execute recovery immediately with ops team notification';
    } else if (impactAnalysis.scope === 'cluster') {
      return 'Schedule recovery during low-traffic period';
    } else {
      return 'Execute recovery with standard monitoring';
    }
  }

  /**
   * Sets up PM2-specific logging
   * @private
   */
  _setupPM2Logging() {
    // Emit PM2 event for monitoring
    process.nextTick(() => {
      process.emit('pm2-error', {
        operation: this.operation,
        severity: this.severity,
        errorId: this.errorId,
        processId: this.processId,
        timestamp: this.timestamp,
        clusterInfo: this.clusterInfo
      });
    });
  }
}

/**
 * Factory function that creates standardized error response objects with consistent structure,
 * appropriate detail levels for environment, and cross-platform compatibility. Generates error
 * responses suitable for both Express.js and Flask implementations with security-conscious
 * information disclosure and educational value.
 * 
 * @param {Error} error - Error instance to create response for
 * @param {Object} [options={}] - Response creation options
 * @param {string} [options.environment] - Environment for detail level control
 * @param {boolean} [options.includeStack] - Include stack trace in response
 * @param {boolean} [options.sanitize] - Sanitize sensitive information
 * @param {Object} [options.additionalContext] - Additional context to include
 * @returns {Object} Standardized error response object with status, message, code, and context appropriate for environment
 */
export function createErrorResponse(error, options = {}) {
  const config = {
    environment: options.environment || process.env.NODE_ENV || 'development',
    includeStack: options.includeStack !== false && process.env.NODE_ENV === 'development',
    sanitize: options.sanitize !== false,
    includeContext: options.includeContext !== false,
    ...options
  };

  // Extract error type and classification using instanceof checks for custom error classes
  const errorType = error.constructor.name;
  const isCustomError = error instanceof BaseError;
  const isOperational = isCustomError ? error.isOperational : isOperationalError(error);

  // Determine appropriate HTTP status code from error class or default to 500 for unknown errors
  let statusCode = HTTP_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR;
  
  if (error instanceof HTTPError) {
    statusCode = error.statusCode;
  } else if (error instanceof ValidationError) {
    statusCode = HTTP_CONSTANTS.STATUS_CODES.BAD_REQUEST;
  } else if (error instanceof SecurityError) {
    statusCode = error.statusCode || HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN;
  } else if (error instanceof PM2Error) {
    statusCode = HTTP_CONSTANTS.STATUS_CODES.SERVICE_UNAVAILABLE;
  }

  // Generate user-friendly error message using ERROR_CONSTANTS.ERROR_MESSAGES for consistency
  const userMessage = config.sanitize ? 
    sanitizeErrorMessage(error.message, config.environment) :
    error.message;

  // Add error code and type information for client error handling and debugging
  const errorCode = isCustomError ? error.code : 
    ERROR_CONSTANTS.ERROR_CODES.INTERNAL_ERROR;

  // Include request correlation ID using generateRequestId for distributed debugging
  const correlationId = isCustomError && error.context ? 
    error.context.requestId : 
    generateRequestId({ prefix: 'err' });

  // Add timestamp and environment context for error tracking and monitoring
  const timestamp = isCustomError ? error.timestamp : new Date().toISOString();

  // Sanitize error details based on environment using production-safe information disclosure
  const errorDetails = config.sanitize ? 
    sanitizeErrorForResponse(error, { environment: config.environment }) :
    error;

  // Base error response structure
  const response = {
    error: {
      message: userMessage,
      code: errorCode,
      type: errorType,
      timestamp,
      correlationId
    },
    success: false,
    statusCode
  };

  // Include validation details for ValidationError instances with field-level information
  if (error instanceof ValidationError) {
    response.error.validation = {
      fieldErrors: error.getFieldErrors(),
      errorCount: error.errorCount,
      summary: error.getSummary()
    };
  }

  // Add security context for SecurityError instances with sanitized violation details
  if (error instanceof SecurityError) {
    response.error.security = {
      violationType: error.securityType,
      severity: error.violationDetails.severity,
      ...(config.includeContext && { 
        sanitizedContext: error.sanitizeForLogging() 
      })
    };
  }

  // Include PM2 process information for PM2Error instances with cluster context
  if (error instanceof PM2Error) {
    response.error.process = {
      operation: error.operation,
      processId: error.processId,
      instanceName: error.instanceName,
      clusterAffected: error.affectsCluster(),
      ...(config.includeContext && {
        processInfo: error.getProcessInfo()
      })
    };
  }

  // Add stack trace for development environment
  if (config.includeStack && errorDetails.stack) {
    response.error.stack = errorDetails.stack;
  }

  // Include additional context if provided
  if (config.additionalContext) {
    response.error.context = {
      ...response.error.context,
      ...config.additionalContext
    };
  }

  // Add operational vs programming classification
  response.error.isOperational = isOperational;

  // Include environment information for debugging
  if (config.environment === 'development') {
    response.debug = {
      errorId: isCustomError ? error.errorId : undefined,
      environment: config.environment,
      nodeVersion: process.version,
      pid: process.pid
    };
  }

  // Format response object with consistent structure for cross-platform compatibility
  const formattedResponse = {
    ...response,
    meta: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      requestId: correlationId
    }
  };

  // Return standardized error response ready for HTTP transmission
  return formattedResponse;
}

/**
 * Utility function that determines if an error is operational (expected, recoverable) or
 * programming (unexpected, indicates bugs). Critical for error handling strategy decisions
 * including process restart, alerting, and response generation. Supports Express.js v5.1.0
 * error classification patterns.
 * 
 * @param {Error} error - Error instance to classify
 * @returns {boolean} True if error is operational and recoverable, false if it indicates programming bugs or system issues
 */
export function isOperationalError(error) {
  // Check if error is instance of custom operational error classes (BaseError, HTTPError, ValidationError, SecurityError)
  if (error instanceof BaseError) {
    return error.isOperational;
  }

  if (error instanceof HTTPError || 
      error instanceof ValidationError || 
      error instanceof SecurityError) {
    return true;
  }

  // Examine error code and type against OPERATIONAL_ERROR_TYPES set for classification
  if (OPERATIONAL_ERROR_TYPES.has(error.constructor.name)) {
    return true;
  }

  // Check error properties for operational error indicators like isOperational flag
  if (error.isOperational === true) {
    return true;
  }

  // Analyze error origin and stack trace for operational vs programming error patterns
  const operationalPatterns = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEDOUT',
    'ENOTFOUND',
    'EACCES',
    'EMFILE',
    'ENFILE'
  ];

  // Consider PM2Error instances as operational if related to cluster mode or deployment
  if (error instanceof PM2Error) {
    return true;
  }

  // Check system errors like ECONNRESET as operational network errors
  if (error.code && operationalPatterns.includes(error.code)) {
    return true;
  }

  // Check for HTTP-related operational errors
  if (error.status && error.status >= 400 && error.status < 500) {
    return true; // Client errors are operational
  }

  // Classify JavaScript runtime errors as programming errors requiring investigation
  if (PROGRAMMING_ERROR_TYPES.has(error.constructor.name)) {
    return false;
  }

  // Check for common programming error patterns
  const programmingPatterns = [
    'Cannot read property',
    'Cannot set property',
    'is not a function',
    'is not defined',
    'Unexpected token',
    'SyntaxError',
    'ReferenceError'
  ];

  if (programmingPatterns.some(pattern => error.message.includes(pattern))) {
    return false;
  }

  // Return boolean classification for error handling strategy determination
  // Default to operational if uncertain (safer for production)
  return true;
}

/**
 * Sanitizes error objects for safe client response by removing sensitive information,
 * stack traces, internal system details, and security-sensitive data. Ensures production
 * environments don't leak sensitive information while maintaining useful error details
 * for client debugging.
 * 
 * @param {Error} error - Error object to sanitize
 * @param {Object} [environment={}] - Environment configuration for sanitization level
 * @param {string} [environment.environment] - Environment name for sanitization rules
 * @param {boolean} [environment.removeStack] - Remove stack traces
 * @param {boolean} [environment.removePaths] - Remove file system paths
 * @returns {Object} Sanitized error object safe for client transmission with environment-appropriate detail levels
 */
export function sanitizeErrorForResponse(error, environment = {}) {
  const config = {
    environment: environment.environment || process.env.NODE_ENV || 'development',
    removeStack: environment.removeStack !== false,
    removePaths: environment.removePaths !== false,
    removeInternalDetails: environment.removeInternalDetails !== false,
    ...environment
  };

  // Create sanitized error object
  const sanitized = {
    message: error.message,
    name: error.name
  };

  // Remove stack traces and internal system paths from error details
  if (config.environment === 'production' && config.removeStack) {
    // Stack traces removed in production
  } else if (error.stack) {
    sanitized.stack = config.removePaths ? 
      removePaths(error.stack) : 
      error.stack;
  }

  // Sanitize sensitive information from error messages and context
  sanitized.message = sanitizeErrorMessage(error.message, config.environment);

  // Replace internal error codes with public-facing error identifiers
  if (error.code) {
    sanitized.code = sanitizeErrorCode(error.code);
  }

  // Remove database connection strings, file paths, and system configurations
  if (error.config && config.removeInternalDetails) {
    // Remove internal configuration details
  } else if (error.config) {
    sanitized.config = sanitizeConfig(error.config);
  }

  // Sanitize user data and request parameters from error context
  if (error.context) {
    sanitized.context = sanitizeContext(error.context, config);
  }

  // Keep essential debugging information for development environments
  if (config.environment === 'development') {
    sanitized.originalError = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  // Apply security-conscious sanitization for SecurityError instances
  if (error instanceof SecurityError) {
    sanitized.securityType = error.securityType;
    sanitized.severity = error.violationDetails.severity;
    // Remove detailed security context in production
    if (config.environment !== 'development') {
      delete sanitized.securityContext;
    }
  }

  // Remove PM2 internal process details while keeping relevant status information
  if (error instanceof PM2Error) {
    sanitized.operation = error.operation;
    sanitized.processId = error.processId;
    // Remove internal cluster details in production
    if (config.environment === 'production') {
      delete sanitized.clusterInfo;
      delete sanitized.deploymentContext;
    }
  }

  // Ensure validation errors maintain field information without exposing internal validation logic
  if (error instanceof ValidationError) {
    sanitized.fieldErrors = error.getFieldErrors();
    sanitized.errorCount = error.errorCount;
    // Remove internal validation schema details
    if (config.removeInternalDetails) {
      delete sanitized.validationContext;
    }
  }

  // Return sanitized error object ready for safe client transmission
  return sanitized;
}

/**
 * Classifies error severity levels for logging, alerting, and monitoring purposes.
 * Determines appropriate response actions based on error type, impact, and operational
 * vs programming classification. Supports comprehensive error management and production
 * monitoring integration.
 * 
 * @param {Error} error - Error instance to classify
 * @param {Object} [context={}] - Additional context for severity determination
 * @param {string} [context.requestId] - Request correlation ID
 * @param {Object} [context.userContext] - User context information
 * @param {Object} [context.systemContext] - System state context
 * @returns {Object} Error severity classification with level, priority, alerting requirements, and recommended actions
 */
export function classifyErrorSeverity(error, context = {}) {
  // Analyze error type and classification for base severity determination
  let severity = 'medium';
  let priority = 'P3';
  let alertingRequired = false;
  let immediateAction = false;

  // Base severity by error type
  if (error instanceof SecurityError) {
    severity = error.violationDetails.severity;
    alertingRequired = ['high', 'critical'].includes(severity);
    immediateAction = severity === 'critical';
  } else if (error instanceof PM2Error) {
    severity = error.severity;
    alertingRequired = severity === 'critical' || error.affectsCluster();
    immediateAction = error.affectsCluster() && severity === 'critical';
  } else if (error instanceof ValidationError) {
    severity = error.errorCount > 5 ? 'medium' : 'low';
  } else if (error instanceof HTTPError) {
    if (error.statusCode >= 500) {
      severity = 'high';
      alertingRequired = true;
    } else if (error.statusCode >= 400) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
  }

  // Consider error frequency and pattern for severity escalation
  const errorFrequency = getErrorFrequency(error.constructor.name);
  if (errorFrequency > 10) { // More than 10 errors of same type in recent period
    severity = escalateSeverity(severity);
    alertingRequired = true;
  }

  // Evaluate business impact and user experience implications
  const businessImpact = assessBusinessImpact(error, context);
  if (businessImpact === 'critical') {
    severity = 'critical';
    alertingRequired = true;
    immediateAction = true;
  } else if (businessImpact === 'high') {
    severity = escalateSeverity(severity);
    alertingRequired = true;
  }

  // Check security implications for SecurityError instances
  if (error instanceof SecurityError) {
    const securityRisk = error.shouldBlock();
    if (securityRisk.shouldBlock) {
      alertingRequired = true;
      immediateAction = securityRisk.reviewRequired;
    }
  }

  // Assess system stability impact for PM2Error and infrastructure errors
  if (error instanceof PM2Error || isSystemError(error)) {
    const systemImpact = assessSystemImpact(error, context);
    if (systemImpact === 'critical') {
      severity = 'critical';
      alertingRequired = true;
      immediateAction = true;
    }
  }

  // Determine alerting requirements based on severity and error type
  const alertingConfig = {
    required: alertingRequired,
    channels: getAlertingChannels(severity),
    escalation: getEscalationPath(severity),
    sla: getSeveritySLA(severity)
  };

  // Generate recommended response actions for operations teams
  const recommendedActions = generateResponseActions(error, severity, context);

  // Map severity to priority
  const priorityMap = {
    low: 'P4',
    medium: 'P3', 
    high: 'P2',
    critical: 'P1'
  };
  priority = priorityMap[severity] || 'P3';

  // Return comprehensive severity classification with actionable recommendations
  return {
    severity,
    priority,
    level: severity.toUpperCase(),
    score: getSeverityScore(severity),
    
    classification: {
      isOperational: isOperationalError(error),
      errorType: error.constructor.name,
      category: categorizeError(error),
      impact: businessImpact,
      systemImpact: isSystemError(error) ? assessSystemImpact(error, context) : 'none'
    },
    
    alerting: alertingConfig,
    
    response: {
      immediateAction,
      recommended: recommendedActions,
      timeline: getResponseTimeline(severity),
      escalationRequired: immediateAction || severity === 'critical'
    },
    
    monitoring: {
      trackFrequency: true,
      patternAnalysis: errorFrequency > 3,
      healthCheck: severity === 'critical' || error instanceof PM2Error,
      performanceImpact: assessPerformanceImpact(error)
    },
    
    metadata: {
      timestamp: new Date().toISOString(),
      correlationId: context.requestId || (error.context ? error.context.requestId : null),
      errorId: error.errorId || null,
      classification: 'automated'
    }
  };
}

/**
 * Factory function that creates appropriate error instances based on error codes, HTTP status
 * codes, or error type strings. Provides consistent error object creation across the application
 * with proper error class selection and initialization.
 * 
 * @param {string} errorCode - Error code, HTTP status code, or error type string
 * @param {string} [message] - Error message (optional, will use default if not provided)
 * @param {Object} [context={}] - Error context and additional options
 * @returns {Error} Appropriate error class instance based on error code with proper initialization and context
 */
export function createErrorFromCode(errorCode, message, context = {}) {
  // Parse error code and determine appropriate error class type
  let ErrorClass = BaseError;
  let statusCode;
  let errorType;
  let defaultMessage = message;

  // Map HTTP status codes to HTTPError instances with correct status
  if (typeof errorCode === 'number' || /^\d{3}$/.test(errorCode)) {
    statusCode = parseInt(errorCode);
    ErrorClass = HTTPError;
    errorType = 'http';
    defaultMessage = message || getHTTPStatusMessage(statusCode);
  }
  // Create ValidationError instances for validation-related error codes
  else if (errorCode.includes('VALIDATION') || errorCode.includes('BAD_REQUEST')) {
    ErrorClass = ValidationError;
    errorType = 'validation';
    defaultMessage = message || ERROR_CONSTANTS.ERROR_MESSAGES.BAD_REQUEST;
  }
  // Generate SecurityError instances for security violation codes
  else if (errorCode.includes('SECURITY') || errorCode.includes('FORBIDDEN') || errorCode.includes('UNAUTHORIZED')) {
    ErrorClass = SecurityError;
    errorType = 'security';
    defaultMessage = message || ERROR_CONSTANTS.ERROR_MESSAGES.FORBIDDEN;
  }
  // Create PM2Error instances for process management error codes
  else if (errorCode.includes('PM2') || errorCode.includes('PROCESS') || errorCode.includes('CLUSTER')) {
    ErrorClass = PM2Error;
    errorType = 'pm2';
    defaultMessage = message || ERROR_CONSTANTS.ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  }
  // Initialize BaseError instances for general application errors
  else {
    ErrorClass = BaseError;
    errorType = 'general';
    defaultMessage = message || ERROR_CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  // Set error context including request ID, timestamp, and relevant metadata
  const errorContext = {
    code: errorCode,
    type: errorType,
    requestId: context.requestId || generateRequestId({ prefix: 'err' }),
    timestamp: new Date().toISOString(),
    source: 'error-factory',
    ...context
  };

  // Return properly initialized error instance ready for throwing or handling
  try {
    switch (ErrorClass) {
      case HTTPError:
        return new HTTPError(defaultMessage, statusCode, errorContext);
      
      case ValidationError:
        return new ValidationError(defaultMessage, context.validationErrors || [], errorContext);
      
      case SecurityError:
        const securityType = inferSecurityType(errorCode);
        return new SecurityError(defaultMessage, securityType, errorContext);
      
      case PM2Error:
        const operation = inferPM2Operation(errorCode);
        return new PM2Error(defaultMessage, operation, errorContext);
      
      default:
        return new BaseError(defaultMessage, errorContext);
    }
  } catch (creationError) {
    // Fallback to BaseError if specific error creation fails
    logWarn('Failed to create specific error type, falling back to BaseError', {
      originalCode: errorCode,
      targetType: ErrorClass.name,
      creationError: creationError.message
    });
    
    return new BaseError(defaultMessage, {
      ...errorContext,
      fallback: true,
      originalErrorCode: errorCode,
      creationError: creationError.message
    });
  }
}

/**
 * Formats error objects for comprehensive logging with structured data, stack traces,
 * context information, and correlation details. Optimized for production logging systems
 * and debugging workflows with proper information organization.
 * 
 * @param {Error} error - Error object to format for logging
 * @param {Object} [context={}] - Additional context information
 * @param {string} [context.requestId] - Request correlation ID
 * @param {Object} [context.userContext] - User context information
 * @param {Object} [context.performanceMetrics] - Performance metrics at time of error
 * @returns {Object} Formatted error object with structured logging data, context, and debugging information
 */
export function formatErrorForLogging(error, context = {}) {
  // Extract error class type and basic error information
  const errorInfo = {
    name: error.name,
    message: error.message,
    type: error.constructor.name,
    timestamp: new Date().toISOString()
  };

  // Add error-specific properties for custom error types
  if (error instanceof BaseError) {
    errorInfo.errorId = error.errorId;
    errorInfo.code = error.code;
    errorInfo.isOperational = error.isOperational;
    errorInfo.timestamp = error.timestamp;
  }

  // Include complete stack trace and source location details
  if (error.stack) {
    errorInfo.stack = {
      full: error.stack,
      frames: parseStackTrace(error.stack),
      origin: getErrorOrigin(error.stack)
    };
  }

  // Add request context including correlation ID, user context, and timing
  const requestContext = {
    requestId: context.requestId || 
               (error.context ? error.context.requestId : null) ||
               generateRequestId({ prefix: 'log' }),
    userContext: sanitizeUserContext(context.userContext),
    sessionId: context.sessionId,
    userId: context.userId ? hashUserId(context.userId) : null,
    ip: context.ip ? maskIpAddress(context.ip) : null,
    userAgent: context.userAgent ? sanitizeUserAgent(context.userAgent) : null
  };

  // Include system context like memory usage, process ID, and environment
  const systemContext = {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    loadAverage: require('os').loadavg()
  };

  // Format error chain and cause information for nested errors
  const errorChain = [];
  let currentError = error;
  while (currentError) {
    errorChain.push({
      name: currentError.name,
      message: currentError.message,
      type: currentError.constructor.name
    });
    currentError = currentError.cause;
  }

  // Add performance metrics and response time context if available
  const performanceContext = {
    responseTime: context.responseTime,
    cpuUsage: process.cpuUsage(),
    metrics: context.performanceMetrics,
    ...(context.timing && { timing: context.timing })
  };

  // Include security context for SecurityError instances with violation details
  let securityContext = null;
  if (error instanceof SecurityError) {
    securityContext = {
      securityType: error.securityType,
      severity: error.violationDetails.severity,
      violationDetails: error.sanitizeForLogging(),
      clientFingerprint: error._generateClientFingerprint ? error._generateClientFingerprint() : null
    };
  }

  // Include PM2 context for PM2Error instances
  let processContext = null;
  if (error instanceof PM2Error) {
    processContext = {
      operation: error.operation,
      processId: error.processId,
      instanceName: error.instanceName,
      clusterAffected: error.affectsCluster(),
      severity: error.severity
    };
  }

  // Include validation context for ValidationError instances
  let validationContext = null;
  if (error instanceof ValidationError) {
    validationContext = {
      errorCount: error.errorCount,
      fieldErrors: Object.keys(error.fieldErrors),
      summary: error.getSummary()
    };
  }

  // Structure data for compatibility with logging aggregation systems
  const logEntry = {
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    
    error: errorInfo,
    request: requestContext,
    system: systemContext,
    performance: performanceContext,
    
    // Conditional contexts
    ...(securityContext && { security: securityContext }),
    ...(processContext && { process: processContext }),
    ...(validationContext && { validation: validationContext }),
    
    // Error classification and metadata
    classification: {
      isOperational: isOperationalError(error),
      severity: classifyErrorSeverity(error, context),
      category: categorizeError(error)
    },
    
    // Error chain and causality
    errorChain: errorChain.length > 1 ? errorChain : null,
    
    // Additional context
    context: sanitizeLogData(context),
    
    // Debugging aids
    debug: process.env.NODE_ENV === 'development' ? {
      errorObject: util.inspect(error, { depth: 2 }),
      contextObject: util.inspect(context, { depth: 2 })
    } : null
  };

  // Return comprehensive error logging object with all debugging context
  return logEntry;
}

/**
 * Validates that error objects conform to expected error class interfaces and contain
 * required properties. Ensures error objects are properly constructed and contain
 * necessary information for error handling workflows.
 * 
 * @param {Error} error - Error object to validate
 * @param {Object} [validationOptions={}] - Validation configuration options
 * @param {boolean} [validationOptions.strict] - Enable strict validation mode
 * @param {Array} [validationOptions.requiredProperties] - Required properties to check
 * @param {boolean} [validationOptions.validateMethods] - Validate required methods exist
 * @returns {Object} Validation result with status, missing properties, and correction recommendations
 */
export function validateErrorInstance(error, validationOptions = {}) {
  const options = {
    strict: validationOptions.strict === true,
    requiredProperties: validationOptions.requiredProperties || ['name', 'message'],
    validateMethods: validationOptions.validateMethods !== false,
    checkSerialization: validationOptions.checkSerialization !== false,
    ...validationOptions
  };

  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    errorType: error.constructor.name,
    timestamp: new Date().toISOString()
  };

  // Check error instance type and inheritance chain validation
  if (!(error instanceof Error)) {
    validationResult.isValid = false;
    validationResult.errors.push('Object is not an instance of Error');
    return validationResult;
  }

  // Validate required properties are present and correctly typed
  options.requiredProperties.forEach(prop => {
    if (!(prop in error)) {
      validationResult.isValid = false;
      validationResult.errors.push(`Missing required property: ${prop}`);
    } else if (typeof error[prop] === 'undefined') {
      validationResult.warnings.push(`Property ${prop} is undefined`);
    }
  });

  // Check error message format and content appropriateness
  if (error.message) {
    if (typeof error.message !== 'string') {
      validationResult.errors.push('Error message must be a string');
      validationResult.isValid = false;
    } else if (error.message.trim().length === 0) {
      validationResult.warnings.push('Error message is empty');
    } else if (error.message.length > 1000) {
      validationResult.warnings.push('Error message is very long (>1000 chars)');
    }
  }

  // Validate error code and status code consistency
  if (error instanceof HTTPError) {
    if (!error.statusCode || typeof error.statusCode !== 'number') {
      validationResult.errors.push('HTTPError missing valid statusCode');
      validationResult.isValid = false;
    } else if (error.statusCode < 100 || error.statusCode > 599) {
      validationResult.errors.push('HTTPError statusCode out of valid range (100-599)');
      validationResult.isValid = false;
    }
  }

  if (error instanceof ValidationError) {
    if (!Array.isArray(error.validationErrors)) {
      validationResult.errors.push('ValidationError missing validationErrors array');
      validationResult.isValid = false;
    }
    
    if (typeof error.errorCount !== 'number') {
      validationResult.warnings.push('ValidationError missing or invalid errorCount');
    }
  }

  if (error instanceof SecurityError) {
    if (!error.securityType || typeof error.securityType !== 'string') {
      validationResult.errors.push('SecurityError missing securityType');
      validationResult.isValid = false;
    }
    
    if (!error.violationDetails || typeof error.violationDetails !== 'object') {
      validationResult.warnings.push('SecurityError missing violationDetails');
    }
  }

  if (error instanceof PM2Error) {
    if (!error.operation || typeof error.operation !== 'string') {
      validationResult.errors.push('PM2Error missing operation');
      validationResult.isValid = false;
    }
    
    if (!error.processId) {
      validationResult.warnings.push('PM2Error missing processId');
    }
  }

  // Check context properties and metadata completeness
  if (error instanceof BaseError) {
    if (!error.errorId) {
      validationResult.warnings.push('BaseError missing errorId');
    }
    
    if (!error.timestamp) {
      validationResult.warnings.push('BaseError missing timestamp');
    }
    
    if (!error.context || typeof error.context !== 'object') {
      validationResult.warnings.push('BaseError missing context object');
    }
    
    if (typeof error.isOperational !== 'boolean') {
      validationResult.warnings.push('BaseError missing or invalid isOperational flag');
    }
  }

  // Validate serialization capabilities and JSON conversion
  if (options.checkSerialization) {
    try {
      const serialized = JSON.stringify(error);
      if (!serialized || serialized === '{}') {
        validationResult.warnings.push('Error does not serialize meaningful data');
      }
    } catch (serializationError) {
      validationResult.warnings.push(`Error serialization failed: ${serializationError.message}`);
    }

    // Test toJSON method if available
    if (typeof error.toJSON === 'function') {
      try {
        const jsonResult = error.toJSON();
        if (!jsonResult || typeof jsonResult !== 'object') {
          validationResult.warnings.push('toJSON method does not return valid object');
        }
      } catch (toJsonError) {
        validationResult.warnings.push(`toJSON method failed: ${toJsonError.message}`);
      }
    }
  }

  // Check error class specific properties and methods
  if (options.validateMethods) {
    const expectedMethods = {
      BaseError: ['toJSON', 'toString', 'setContext', 'getCorrelationId'],
      HTTPError: ['setHeader', 'getStatusMessage', 'toHTTPResponse'],
      ValidationError: ['addFieldError', 'getFieldErrors', 'getSummary'],
      SecurityError: ['sanitizeForLogging', 'getSecurityAlert', 'shouldBlock'],
      PM2Error: ['getProcessInfo', 'getRecoveryAction', 'affectsCluster']
    };

    const requiredMethods = expectedMethods[error.constructor.name] || [];
    requiredMethods.forEach(method => {
      if (typeof error[method] !== 'function') {
        validationResult.warnings.push(`Missing expected method: ${method}`);
      }
    });
  }

  // Generate recommendations based on validation results
  if (validationResult.errors.length > 0) {
    validationResult.recommendations.push('Fix validation errors before using error object');
  }
  
  if (validationResult.warnings.length > 0) {
    validationResult.recommendations.push('Address warnings to improve error object quality');
  }
  
  if (error instanceof BaseError && !error.context.requestId) {
    validationResult.recommendations.push('Consider adding request correlation ID for better debugging');
  }
  
  if (!error.stack && options.strict) {
    validationResult.recommendations.push('Ensure stack trace is captured for debugging');
  }

  // Return comprehensive validation result with correction guidance
  return validationResult;
}

// Helper functions for error processing and utilities

/**
 * Sanitizes error message for safe display
 * @private
 * @param {string} message - Error message
 * @param {string} environment - Environment name
 * @returns {string} Sanitized message
 */
function sanitizeErrorMessage(message, environment) {
  if (environment === 'production') {
    // In production, use generic messages for sensitive errors
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credential/i
    ];
    
    if (sensitivePatterns.some(pattern => pattern.test(message))) {
      return 'An authentication error occurred';
    }
  }
  
  return message;
}

/**
 * Sanitizes error code for public consumption
 * @private
 * @param {string} code - Error code
 * @returns {string} Sanitized code
 */
function sanitizeErrorCode(code) {
  // Remove internal prefixes or sensitive identifiers
  return code.replace(/^INTERNAL_/, '').replace(/^SECRET_/, '');
}

/**
 * Sanitizes configuration object
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Sanitized configuration
 */
function sanitizeConfig(config) {
  const sanitized = {};
  const sensitiveKeys = ['password', 'secret', 'key', 'token'];
  
  Object.keys(config).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = config[key];
    }
  });
  
  return sanitized;
}

/**
 * Sanitizes context object for logging
 * @private
 * @param {Object} context - Context object
 * @param {Object} config - Sanitization configuration
 * @returns {Object} Sanitized context
 */
function sanitizeContext(context, config) {
  if (!context || typeof context !== 'object') return {};
  
  const sanitized = {};
  
  Object.keys(context).forEach(key => {
    if (key === 'systemInfo' && config.removeInternalDetails) {
      sanitized[key] = {
        pid: context[key].pid,
        platform: context[key].platform,
        nodeVersion: context[key].nodeVersion
      };
    } else if (typeof context[key] === 'object' && context[key] !== null) {
      sanitized[key] = sanitizeLogData(context[key]);
    } else {
      sanitized[key] = context[key];
    }
  });
  
  return sanitized;
}

/**
 * Removes file system paths from stack traces
 * @private
 * @param {string} stack - Stack trace
 * @returns {string} Stack trace with paths removed
 */
function removePaths(stack) {
  return stack.replace(/\/[^:]+\//g, '/[path]/');
}

/**
 * Sanitizes log data to prevent sensitive information disclosure
 * @private
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeLogData(data) {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = Array.isArray(data) ? [] : {};
  
  Object.keys(data).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeLogData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  });
  
  return sanitized;
}

/**
 * Gets HTTP status message for status code
 * @private
 * @param {number} statusCode - HTTP status code
 * @returns {string} Status message
 */
function getHTTPStatusMessage(statusCode) {
  const messages = {
    400: 'Bad Request',
    401: 'Unauthorized', 
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };
  
  return messages[statusCode] || `HTTP Error ${statusCode}`;
}

/**
 * Infers security type from error code
 * @private
 * @param {string} errorCode - Error code
 * @returns {string} Security violation type
 */
function inferSecurityType(errorCode) {
  if (errorCode.includes('CSRF')) return 'csrf-violation';
  if (errorCode.includes('XSS')) return 'xss-attempt';
  if (errorCode.includes('AUTH')) return 'authentication-failure';
  if (errorCode.includes('FORBIDDEN')) return 'authorization-violation';
  return 'security-violation';
}

/**
 * Infers PM2 operation from error code
 * @private
 * @param {string} errorCode - Error code
 * @returns {string} PM2 operation
 */
function inferPM2Operation(errorCode) {
  if (errorCode.includes('START')) return 'start';
  if (errorCode.includes('STOP')) return 'stop';
  if (errorCode.includes('RESTART')) return 'restart';
  if (errorCode.includes('CLUSTER')) return 'cluster-management';
  return 'process-management';
}

/**
 * Gets error frequency for error type
 * @private
 * @param {string} errorType - Error type name
 * @returns {number} Error frequency count
 */
function getErrorFrequency(errorType) {
  return ERROR_METRICS.byType[errorType] || 0;
}

/**
 * Escalates error severity level
 * @private
 * @param {string} currentSeverity - Current severity level
 * @returns {string} Escalated severity level
 */
function escalateSeverity(currentSeverity) {
  const escalationMap = {
    'low': 'medium',
    'medium': 'high', 
    'high': 'critical',
    'critical': 'critical'
  };
  
  return escalationMap[currentSeverity] || currentSeverity;
}

/**
 * Assesses business impact of error
 * @private
 * @param {Error} error - Error instance
 * @param {Object} context - Error context
 * @returns {string} Business impact level
 */
function assessBusinessImpact(error, context) {
  // Critical business impact scenarios
  if (error instanceof PM2Error && error.affectsCluster()) {
    return 'critical';
  }
  
  if (error instanceof SecurityError && error.violationDetails.severity === 'critical') {
    return 'critical';
  }
  
  if (error instanceof HTTPError && error.statusCode >= 500) {
    return 'high';
  }
  
  return 'medium';
}

/**
 * Checks if error is system-level error
 * @private
 * @param {Error} error - Error instance
 * @returns {boolean} True if system error
 */
function isSystemError(error) {
  return error instanceof PM2Error || 
         error.code === 'ECONNRESET' ||
         error.code === 'EMFILE' ||
         error.code === 'ENOMEM';
}

/**
 * Assesses system impact of error
 * @private
 * @param {Error} error - Error instance
 * @param {Object} context - Error context
 * @returns {string} System impact level
 */
function assessSystemImpact(error, context) {
  if (error instanceof PM2Error && error.affectsCluster()) {
    return 'critical';
  }
  
  if (error.code === 'ENOMEM' || error.code === 'EMFILE') {
    return 'critical';
  }
  
  return 'medium';
}

/**
 * Gets alerting channels for severity level
 * @private
 * @param {string} severity - Severity level
 * @returns {Array} Alerting channels
 */
function getAlertingChannels(severity) {
  const channels = {
    'critical': ['email', 'sms', 'slack', 'pager'],
    'high': ['email', 'slack'],
    'medium': ['slack'],
    'low': ['log']
  };
  
  return channels[severity] || ['log'];
}

/**
 * Gets escalation path for severity level
 * @private
 * @param {string} severity - Severity level
 * @returns {string} Escalation path
 */
function getEscalationPath(severity) {
  const paths = {
    'critical': 'immediate-ops-manager',
    'high': 'ops-team-lead', 
    'medium': 'on-call-engineer',
    'low': 'development-team'
  };
  
  return paths[severity] || 'development-team';
}

/**
 * Gets SLA for severity level
 * @private
 * @param {string} severity - Severity level
 * @returns {Object} SLA information
 */
function getSeveritySLA(severity) {
  const slas = {
    'critical': { responseTime: '15m', resolutionTime: '1h' },
    'high': { responseTime: '1h', resolutionTime: '4h' },
    'medium': { responseTime: '4h', resolutionTime: '24h' },
    'low': { responseTime: '24h', resolutionTime: '72h' }
  };
  
  return slas[severity] || slas.medium;
}

/**
 * Generates response actions for error
 * @private
 * @param {Error} error - Error instance
 * @param {string} severity - Severity level
 * @param {Object} context - Error context
 * @returns {Array} Response actions
 */
function generateResponseActions(error, severity, context) {
  const actions = [];
  
  if (severity === 'critical') {
    actions.push('immediate-investigation');
    actions.push('ops-team-notification');
  }
  
  if (error instanceof PM2Error) {
    actions.push('check-process-status');
    actions.push('review-system-resources');
  }
  
  if (error instanceof SecurityError) {
    actions.push('security-team-notification');
    actions.push('audit-security-logs');
  }
  
  actions.push('monitor-error-frequency');
  actions.push('document-resolution');
  
  return actions;
}

/**
 * Gets response timeline for severity level
 * @private
 * @param {string} severity - Severity level
 * @returns {Object} Response timeline
 */
function getResponseTimeline(severity) {
  const timelines = {
    'critical': { acknowledge: '5m', investigate: '15m', resolve: '1h' },
    'high': { acknowledge: '30m', investigate: '1h', resolve: '4h' },
    'medium': { acknowledge: '2h', investigate: '4h', resolve: '24h' },
    'low': { acknowledge: '8h', investigate: '24h', resolve: '72h' }
  };
  
  return timelines[severity] || timelines.medium;
}

/**
 * Gets severity score
 * @private
 * @param {string} severity - Severity level
 * @returns {number} Numeric severity score
 */
function getSeverityScore(severity) {
  const scores = {
    'low': 25,
    'medium': 50,
    'high': 75,
    'critical': 100
  };
  
  return scores[severity] || 50;
}

/**
 * Categorizes error type
 * @private
 * @param {Error} error - Error instance
 * @returns {string} Error category
 */
function categorizeError(error) {
  if (error instanceof ValidationError) return 'input-validation';
  if (error instanceof SecurityError) return 'security';
  if (error instanceof HTTPError) return 'http-protocol';
  if (error instanceof PM2Error) return 'process-management';
  return 'general';
}

/**
 * Assesses performance impact of error
 * @private
 * @param {Error} error - Error instance
 * @returns {string} Performance impact level
 */
function assessPerformanceImpact(error) {
  if (error instanceof PM2Error && error.affectsCluster()) {
    return 'high';
  }
  
  if (error instanceof HTTPError && error.statusCode >= 500) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Sanitizes user context for logging
 * @private
 * @param {Object} userContext - User context
 * @returns {Object} Sanitized user context
 */
function sanitizeUserContext(userContext) {
  if (!userContext) return null;
  
  return {
    userId: userContext.userId ? hashUserId(userContext.userId) : null,
    sessionId: userContext.sessionId ? userContext.sessionId.substring(0, 8) + '...' : null,
    role: userContext.role,
    permissions: userContext.permissions ? userContext.permissions.length : 0
  };
}

/**
 * Hashes user ID for privacy
 * @private
 * @param {string} userId - User ID
 * @returns {string} Hashed user ID
 */
function hashUserId(userId) {
  return crypto.createHash('sha256').update(userId.toString()).digest('hex').substring(0, 12);
}

/**
 * Masks IP address for privacy
 * @private
 * @param {string} ip - IP address
 * @returns {string} Masked IP address
 */
function maskIpAddress(ip) {
  if (!ip) return null;
  
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  
  return 'masked';
}

/**
 * Sanitizes user agent string
 * @private
 * @param {string} userAgent - User agent string
 * @returns {string} Sanitized user agent
 */
function sanitizeUserAgent(userAgent) {
  if (!userAgent) return null;
  
  return userAgent.substring(0, 100);
}

/**
 * Parses stack trace into frames
 * @private
 * @param {string} stack - Stack trace
 * @returns {Array} Stack frames
 */
function parseStackTrace(stack) {
  if (!stack) return [];
  
  return stack
    .split('\n')
    .slice(1) // Remove error message line
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 10); // Limit to top 10 frames
}

/**
 * Gets error origin from stack trace
 * @private
 * @param {string} stack - Stack trace
 * @returns {Object} Error origin information
 */
function getErrorOrigin(stack) {
  if (!stack) return null;
  
  const lines = stack.split('\n');
  if (lines.length < 2) return null;
  
  const originLine = lines[1];
  const match = originLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
  
  if (match) {
    return {
      function: match[1],
      file: match[2],
      line: parseInt(match[3]),
      column: parseInt(match[4])
    };
  }
  
  return { raw: originLine };
}

// Export all error classes and utility functions
export {
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
  
  // Global error tracking
  ERROR_REGISTRY,
  OPERATIONAL_ERROR_TYPES,
  PROGRAMMING_ERROR_TYPES,
  ERROR_METRICS
};

// Initialize error handling system
logger.info('Error handling system initialized', {
  version: '1.0.0',
  errorTypes: ['BaseError', 'HTTPError', 'ValidationError', 'SecurityError', 'PM2Error'],
  operationalTypes: Array.from(OPERATIONAL_ERROR_TYPES),
  programmingTypes: Array.from(PROGRAMMING_ERROR_TYPES),
  environment: process.env.NODE_ENV || 'development',
  pid: process.pid,
  timestamp: new Date().toISOString()
});