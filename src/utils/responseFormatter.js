/**
 * API Response Formatting Utility
 * 
 * Provides consistent response structure across all endpoints with proper status codes,
 * headers, and response body formatting. Supports success, error, validation error,
 * and paginated responses with metadata including timestamps and request IDs.
 * 
 * Features:
 * - Complete HTTP verb support with structured JSON responses
 * - Consistent error formatting for client-appropriate error responses
 * - Support for all HTTP status codes
 * - Graceful handling of null and undefined values
 * - Request tracing with timestamps and request IDs
 * - Type-safe response validation and sanitization
 * 
 * @module responseFormatter
 * @version 1.0.0
 */

const util = require('util');

/**
 * HTTP Status Code Constants
 * Comprehensive mapping of HTTP status codes for consistent response formatting
 */
const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 4xx Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * Response Type Constants
 * Defines standard response types for consistent formatting
 */
const RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  PAGINATED: 'paginated'
};

/**
 * Generates a unique request ID for tracing purposes
 * @returns {string} Unique request identifier
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates ISO timestamp for response metadata
 * @returns {string} ISO 8601 formatted timestamp
 */
function generateTimestamp() {
  return new Date().toISOString();
}

/**
 * Sanitizes data by removing null and undefined values
 * Handles nested objects and arrays gracefully, with circular reference protection
 * @param {any} data - Data to sanitize
 * @param {WeakSet} [visited] - Set to track visited objects for circular reference detection
 * @returns {any} Sanitized data
 */
function sanitizeData(data, visited = new WeakSet()) {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (util.isArray(data)) {
    // Check for circular reference in arrays
    if (visited.has(data)) {
      return '[Circular]';
    }
    visited.add(data);
    
    const sanitizedArray = data
      .filter(item => item !== null && item !== undefined)
      .map(item => sanitizeData(item, visited));
    
    visited.delete(data);
    return sanitizedArray;
  }
  
  if (util.isObject(data) && !Buffer.isBuffer(data) && !(data instanceof Date)) {
    // Check for circular reference in objects
    if (visited.has(data)) {
      return '[Circular]';
    }
    visited.add(data);
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        sanitized[key] = sanitizeData(value, visited);
      }
    }
    
    visited.delete(data);
    return sanitized;
  }
  
  return data;
}

/**
 * Validates and formats response metadata
 * @param {Object} options - Metadata options
 * @returns {Object} Formatted metadata
 */
function createMetadata(options = {}) {
  const {
    requestId = generateRequestId(),
    timestamp = generateTimestamp(),
    responseTime,
    version = '1.0.0',
    environment = process.env.NODE_ENV || 'development'
  } = options;
  
  const metadata = {
    requestId,
    timestamp,
    version,
    environment
  };
  
  if (responseTime !== undefined && typeof responseTime === 'number') {
    metadata.responseTime = `${responseTime}ms`;
  }
  
  return metadata;
}

/**
 * Formats successful API responses with consistent structure
 * 
 * @param {any} data - Response data payload
 * @param {Object} options - Response options
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} [options.message] - Success message
 * @param {string} [options.requestId] - Request identifier for tracing
 * @param {number} [options.responseTime] - Response time in milliseconds
 * @param {Object} [options.meta] - Additional metadata
 * @returns {Object} Formatted success response
 * 
 * @example
 * success({ userId: 123, name: 'John Doe' }, { message: 'User retrieved successfully' })
 * // Returns:
 * // {
 * //   success: true,
 * //   data: { userId: 123, name: 'John Doe' },
 * //   message: 'User retrieved successfully',
 * //   statusCode: 200,
 * //   metadata: { requestId: 'req_...', timestamp: '2024-...', ... }
 * // }
 */
function success(data = null, options = {}) {
  const {
    statusCode = HTTP_STATUS.OK,
    message = 'Request successful',
    requestId,
    responseTime,
    meta = {}
  } = options;
  
  // Validate status code is in 2xx range
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Invalid success status code: ${statusCode}. Must be in 2xx range.`);
  }
  
  const sanitizedData = sanitizeData(data);
  const metadata = createMetadata({ requestId, responseTime, ...meta });
  
  return {
    success: true,
    data: sanitizedData,
    message,
    statusCode,
    type: RESPONSE_TYPES.SUCCESS,
    metadata
  };
}

/**
 * Formats error API responses with consistent structure
 * 
 * @param {string|Error} error - Error message or Error object
 * @param {Object} options - Error response options
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} [options.code] - Error code for client identification
 * @param {Object} [options.details] - Additional error details
 * @param {string} [options.requestId] - Request identifier for tracing
 * @param {number} [options.responseTime] - Response time in milliseconds
 * @param {Object} [options.meta] - Additional metadata
 * @returns {Object} Formatted error response
 * 
 * @example
 * error('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' })
 * // Returns:
 * // {
 * //   success: false,
 * //   error: {
 * //     message: 'User not found',
 * //     code: 'USER_NOT_FOUND',
 * //     details: null
 * //   },
 * //   statusCode: 404,
 * //   metadata: { requestId: 'req_...', timestamp: '2024-...', ... }
 * // }
 */
function error(error, options = {}) {
  const {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code,
    details = null,
    requestId,
    responseTime,
    meta = {}
  } = options;
  
  // Validate status code is in 4xx or 5xx range
  if (statusCode < 400 || statusCode >= 600) {
    throw new Error(`Invalid error status code: ${statusCode}. Must be in 4xx or 5xx range.`);
  }
  
  let errorMessage;
  let errorStack;
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'An unexpected error occurred';
  }
  
  const metadata = createMetadata({ requestId, responseTime, ...meta });
  
  const errorResponse = {
    success: false,
    error: {
      message: errorMessage,
      code: code || 'INTERNAL_ERROR',
      details: sanitizeData(details)
    },
    statusCode,
    type: RESPONSE_TYPES.ERROR,
    metadata
  };
  
  // Include stack trace and detailed error inspection in development environment
  if (errorStack && process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = errorStack;
    
    // Add detailed error inspection for debugging
    if (error instanceof Error && error.cause) {
      errorResponse.error.cause = util.inspect(error.cause, { depth: 3, colors: false });
    }
  }
  
  return errorResponse;
}

/**
 * Formats validation error responses with detailed field-level errors
 * 
 * @param {Array|Object|string} validationErrors - Validation error details
 * @param {Object} options - Validation error response options
 * @param {string} [options.message] - Main validation error message
 * @param {string} [options.requestId] - Request identifier for tracing
 * @param {number} [options.responseTime] - Response time in milliseconds
 * @param {Object} [options.meta] - Additional metadata
 * @returns {Object} Formatted validation error response
 * 
 * @example
 * validationError([
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'password', message: 'Password too short' }
 * ])
 * // Returns:
 * // {
 * //   success: false,
 * //   error: {
 * //     message: 'Validation failed',
 * //     code: 'VALIDATION_ERROR',
 * //     details: {
 * //       fields: [
 * //         { field: 'email', message: 'Invalid email format' },
 * //         { field: 'password', message: 'Password too short' }
 * //       ],
 * //       count: 2
 * //     }
 * //   },
 * //   statusCode: 422,
 * //   metadata: { ... }
 * // }
 */
function validationError(validationErrors, options = {}) {
  const {
    message = 'Validation failed',
    requestId,
    responseTime,
    meta = {}
  } = options;
  
  let formattedErrors;
  let errorCount = 0;
  
  if (util.isArray(validationErrors)) {
    formattedErrors = validationErrors.map(err => sanitizeData(err));
    errorCount = formattedErrors.length;
  } else if (util.isObject(validationErrors)) {
    formattedErrors = sanitizeData(validationErrors);
    errorCount = Object.keys(formattedErrors).length;
  } else if (typeof validationErrors === 'string') {
    formattedErrors = [{ message: validationErrors }];
    errorCount = 1;
  } else {
    formattedErrors = [{ message: 'Unknown validation error' }];
    errorCount = 1;
  }
  
  const metadata = createMetadata({ requestId, responseTime, ...meta });
  
  return {
    success: false,
    error: {
      message,
      code: 'VALIDATION_ERROR',
      details: {
        fields: formattedErrors,
        count: errorCount
      }
    },
    statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    type: RESPONSE_TYPES.VALIDATION_ERROR,
    metadata
  };
}

/**
 * Formats multiple errors into a single response structure
 * 
 * @param {Array} errors - Array of error objects
 * @param {Object} options - Error formatting options
 * @param {number} [options.statusCode=400] - HTTP status code
 * @param {string} [options.message] - Main error message
 * @param {string} [options.requestId] - Request identifier for tracing
 * @param {number} [options.responseTime] - Response time in milliseconds
 * @param {Object} [options.meta] - Additional metadata
 * @returns {Object} Formatted multiple errors response
 * 
 * @example
 * formatErrors([
 *   { type: 'authentication', message: 'Invalid token' },
 *   { type: 'authorization', message: 'Insufficient permissions' }
 * ])
 * // Returns:
 * // {
 * //   success: false,
 * //   error: {
 * //     message: 'Multiple errors occurred',
 * //     code: 'MULTIPLE_ERRORS',
 * //     details: {
 * //       errors: [...],
 * //       count: 2
 * //     }
 * //   },
 * //   statusCode: 400,
 * //   metadata: { ... }
 * // }
 */
function formatErrors(errors, options = {}) {
  const {
    statusCode = HTTP_STATUS.BAD_REQUEST,
    message = 'Multiple errors occurred',
    requestId,
    responseTime,
    meta = {}
  } = options;
  
  // Validate status code is in 4xx or 5xx range
  if (statusCode < 400 || statusCode >= 600) {
    throw new Error(`Invalid error status code: ${statusCode}. Must be in 4xx or 5xx range.`);
  }
  
  const formattedErrors = util.isArray(errors) 
    ? errors.map(err => sanitizeData(err))
    : [sanitizeData(errors)];
  
  const metadata = createMetadata({ requestId, responseTime, ...meta });
  
  return {
    success: false,
    error: {
      message,
      code: 'MULTIPLE_ERRORS',
      details: {
        errors: formattedErrors,
        count: formattedErrors.length
      }
    },
    statusCode,
    type: RESPONSE_TYPES.ERROR,
    metadata
  };
}

/**
 * Formats paginated response data with pagination metadata
 * 
 * @param {Array} data - Array of data items for current page
 * @param {Object} pagination - Pagination information
 * @param {number} pagination.page - Current page number
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total number of items
 * @param {Object} options - Paginated response options
 * @param {string} [options.message] - Success message
 * @param {string} [options.requestId] - Request identifier for tracing
 * @param {number} [options.responseTime] - Response time in milliseconds
 * @param {Object} [options.meta] - Additional metadata
 * @returns {Object} Formatted paginated response
 * 
 * @example
 * paginated(
 *   [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
 *   { page: 1, limit: 10, total: 25 }
 * )
 * // Returns:
 * // {
 * //   success: true,
 * //   data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
 * //   pagination: {
 * //     page: 1,
 * //     limit: 10,
 * //     total: 25,
 * //     totalPages: 3,
 * //     hasNext: true,
 * //     hasPrev: false
 * //   },
 * //   statusCode: 200,
 * //   metadata: { ... }
 * // }
 */
function paginated(data, pagination, options = {}) {
  const {
    message = 'Data retrieved successfully',
    requestId,
    responseTime,
    meta = {}
  } = options;
  
  const { page, limit, total } = pagination;
  
  // Validate pagination parameters
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Limit must be a positive integer');
  }
  if (!Number.isInteger(total) || total < 0) {
    throw new Error('Total must be a non-negative integer');
  }
  
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);
  
  const sanitizedData = sanitizeData(data);
  const metadata = createMetadata({ requestId, responseTime, ...meta });
  
  return {
    success: true,
    data: sanitizedData,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      startIndex: total > 0 ? startIndex : 0,
      endIndex: total > 0 ? endIndex : 0,
      itemsOnPage: util.isArray(sanitizedData) ? sanitizedData.length : 0
    },
    statusCode: HTTP_STATUS.OK,
    type: RESPONSE_TYPES.PAGINATED,
    metadata
  };
}

/**
 * Response Formatter Object
 * Central object containing all response formatting methods
 * 
 * Provides a unified interface for all response formatting operations
 * with consistent method signatures and behavior across all endpoints.
 * 
 * @type {Object}
 */
const responseFormatter = {
  /**
   * Format successful responses
   * @see success function documentation
   */
  success,
  
  /**
   * Format error responses  
   * @see error function documentation
   */
  error,
  
  /**
   * Format validation error responses
   * @see validationError function documentation
   */
  validationError,
  
  /**
   * Format multiple errors into single response
   * @see formatErrors function documentation
   */
  formatErrors,
  
  /**
   * Format paginated response data
   * @see paginated function documentation
   */
  paginated,
  
  /**
   * HTTP Status Code Constants
   * Provides access to standard HTTP status codes for consistency
   */
  HTTP_STATUS,
  
  /**
   * Response Type Constants
   * Provides access to standard response type identifiers
   */
  RESPONSE_TYPES,
  
  /**
   * Utility method to sanitize data
   * Removes null and undefined values from response data
   * @param {any} data - Data to sanitize
   * @returns {any} Sanitized data
   */
  sanitizeData,
  
  /**
   * Utility method to generate request IDs
   * Creates unique identifiers for request tracing
   * @returns {string} Unique request identifier
   */
  generateRequestId,
  
  /**
   * Utility method to generate timestamps
   * Creates ISO 8601 formatted timestamps
   * @returns {string} ISO timestamp
   */
  generateTimestamp,
  
  /**
   * Creates metadata object with default values
   * @param {Object} options - Metadata options
   * @returns {Object} Formatted metadata
   */
  createMetadata,
  
  /**
   * Utility method for debugging complex objects
   * Provides detailed object inspection for development environments
   * @param {any} object - Object to inspect
   * @param {Object} options - Inspection options
   * @returns {string} Formatted object representation
   */
  inspect: (object, options = {}) => {
    const defaultOptions = {
      depth: 3,
      colors: process.env.NODE_ENV === 'development',
      compact: false,
      showHidden: false
    };
    return util.inspect(object, { ...defaultOptions, ...options });
  }
};

// Freeze the responseFormatter object to prevent modifications
Object.freeze(responseFormatter);

/**
 * Module Exports
 * 
 * Exports both individual functions and the main responseFormatter object
 * to support different import patterns and usage preferences.
 * 
 * Individual function exports allow for selective imports:
 * const { success, error } = require('./responseFormatter');
 * 
 * Default object export provides unified interface:
 * const responseFormatter = require('./responseFormatter');
 * responseFormatter.success(data);
 */

module.exports = responseFormatter;
module.exports.success = success;
module.exports.error = error;
module.exports.validationError = validationError;
module.exports.formatErrors = formatErrors;
module.exports.paginated = paginated;
module.exports.HTTP_STATUS = HTTP_STATUS;
module.exports.RESPONSE_TYPES = RESPONSE_TYPES;
module.exports.sanitizeData = sanitizeData;
module.exports.generateRequestId = generateRequestId;
module.exports.generateTimestamp = generateTimestamp;
module.exports.createMetadata = createMetadata;
module.exports.inspect = responseFormatter.inspect;
