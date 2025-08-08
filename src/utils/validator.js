/**
 * Request Validation Utility
 * 
 * Comprehensive JSON Schema validation implementation for input sanitization and data 
 * integrity verification across all API endpoints. Provides reusable validation functions
 * for common data types, custom validation rules, and clear error messages for validation
 * failures with support for nested object validation, array validation, and optional 
 * field handling.
 * 
 * Key Features:
 * - JSON Schema Draft 7 validation using AJV
 * - Input sanitization and data type validation
 * - Custom business logic validation rules
 * - Comprehensive error reporting with detailed messages
 * - Boundary condition and edge case validation
 * - Performance-optimized validation compilation
 * - Environment-aware validation strictness
 * - Integration with existing response formatting system
 * 
 * @module validator
 * @version 1.0.0
 * @author Blitzy Agent
 */

// Internal imports - Environment configuration and utilities
const config = require('./config.js');
const logger = require('./logger.js');
const responseFormatter = require('./responseFormatter.js');

// External imports - JSON Schema validation and string validation
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const util = require('util');
const validator = require('validator');

/**
 * AJV instance configuration for comprehensive JSON Schema validation
 * Configured with security and performance optimizations
 */
const ajv = new Ajv({
    allErrors: true,              // Collect all validation errors
    removeAdditional: true,       // Remove additional properties in strict mode
    useDefaults: true,           // Use default values from schema
    coerceTypes: true,           // Type coercion for common cases
    strict: config.validation.strict, // Environment-based strict mode
    validateFormats: true,       // Enable format validation
    code: {
        esm: false,              // CommonJS compatibility
        optimize: true           // Enable code optimization
    },
    verbose: config.isDevelopment // Detailed error info in development
});

// Add format validators (email, date, uri, etc.)
addFormats(ajv);

/**
 * Custom AJV keywords for business-specific validation rules
 */
ajv.addKeyword({
    keyword: 'isNotEmpty',
    type: 'string',
    schemaType: 'boolean',
    compile: (schemaVal) => {
        return function validate(data) {
            return !schemaVal || (typeof data === 'string' && data.trim().length > 0);
        };
    },
    error: {
        message: 'must not be empty'
    }
});

ajv.addKeyword({
    keyword: 'minAge',
    type: 'string',
    schemaType: 'number',
    compile: (schemaVal) => {
        return function validate(data) {
            const date = new Date(data);
            const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            return age >= schemaVal;
        };
    },
    error: {
        message: (cxt) => `must be at least ${cxt.schema} years old`
    }
});

ajv.addKeyword({
    keyword: 'strongPassword',
    type: 'string',
    schemaType: 'boolean',
    compile: (schemaVal) => {
        return function validate(data) {
            if (!schemaVal) return true;
            
            // Strong password: min 8 chars, uppercase, lowercase, number, special char
            const hasMinLength = data.length >= 8;
            const hasUppercase = /[A-Z]/.test(data);
            const hasLowercase = /[a-z]/.test(data);
            const hasNumber = /\d/.test(data);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data);
            
            return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
        };
    },
    error: {
        message: 'must contain at least 8 characters with uppercase, lowercase, number, and special character'
    }
});

/**
 * Compiled validation schema cache for performance optimization
 * Prevents recompilation of frequently used schemas
 */
const schemaCache = new Map();

/**
 * Common validation schemas for reuse across the application
 */
const commonSchemas = {
    email: {
        type: 'string',
        format: 'email',
        minLength: 5,
        maxLength: 254
    },
    
    password: {
        type: 'string',
        minLength: 8,
        maxLength: 128,
        strongPassword: config.validation.strict
    },
    
    uuid: {
        type: 'string',
        format: 'uuid'
    },
    
    url: {
        type: 'string',
        format: 'uri',
        maxLength: 2048
    },
    
    phoneNumber: {
        type: 'string',
        pattern: '^[+]?[1-9]\\d{1,14}$',
        minLength: 7,
        maxLength: 17
    },
    
    positiveInteger: {
        type: 'integer',
        minimum: 1
    },
    
    paginationLimit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10
    },
    
    paginationOffset: {
        type: 'integer',
        minimum: 0,
        default: 0
    }
};

/**
 * Register common schemas with AJV for reference
 */
Object.entries(commonSchemas).forEach(([name, schema]) => {
    ajv.addSchema(schema, name);
});

/**
 * Validates a complete request payload against a JSON schema
 * 
 * @param {any} data - Request data to validate
 * @param {Object} schema - JSON Schema object or schema reference
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.sanitize=true] - Whether to sanitize input
 * @param {boolean} [options.strict] - Override global strict mode
 * @param {number} [options.timeout] - Validation timeout in milliseconds
 * @returns {Object} Validation result with data and errors
 * 
 * @example
 * const result = validateRequest(
 *   { email: 'test@example.com', age: 25 },
 *   {
 *     type: 'object',
 *     required: ['email'],
 *     properties: {
 *       email: { $ref: 'email' },
 *       age: { type: 'integer', minimum: 18 }
 *     }
 *   }
 * );
 */
function validateRequest(data, schema, options = {}) {
    const startTime = Date.now();
    
    try {
        logger.debug('Starting request validation', {
            dataType: typeof data,
            schemaType: typeof schema,
            options: options
        });

        // Input sanitization if enabled
        let sanitizedData = data;
        if (options.sanitize !== false) {
            sanitizedData = sanitizeInput(data);
        }

        // Validate against schema
        const validationResult = validateSchema(sanitizedData, schema, options);
        
        const responseTime = Date.now() - startTime;
        
        // Check for timeout
        if (options.timeout && responseTime > options.timeout) {
            logger.warn('Validation timeout exceeded', {
                timeout: options.timeout,
                actualTime: responseTime
            });
            
            return {
                valid: false,
                data: null,
                errors: [formatValidationErrors(['Validation timeout exceeded'])],
                metadata: {
                    responseTime,
                    timeout: true
                }
            };
        }

        logger.debug('Request validation completed', {
            valid: validationResult.valid,
            errorCount: validationResult.errors ? validationResult.errors.length : 0,
            responseTime
        });

        return {
            ...validationResult,
            metadata: {
                responseTime,
                strict: config.validation.strict,
                environment: config.environment
            }
        };

    } catch (error) {
        logger.error('Request validation failed with error', {
            error: error.message,
            stack: error.stack
        }, error);

        return {
            valid: false,
            data: null,
            errors: [formatValidationErrors(['Internal validation error'])],
            metadata: {
                responseTime: Date.now() - startTime,
                error: true
            }
        };
    }
}

/**
 * Validates data against a JSON schema with compilation caching
 * 
 * @param {any} data - Data to validate
 * @param {Object|string} schema - JSON Schema object or reference
 * @param {Object} [options={}] - Validation options
 * @returns {Object} Validation result
 */
function validateSchema(data, schema, options = {}) {
    try {
        // Generate cache key for schema
        const cacheKey = typeof schema === 'string' ? schema : JSON.stringify(schema);
        
        // Get or compile validation function
        let validate;
        if (schemaCache.has(cacheKey)) {
            validate = schemaCache.get(cacheKey);
        } else {
            validate = ajv.compile(schema);
            schemaCache.set(cacheKey, validate);
            
            logger.debug('Compiled and cached new validation schema', {
                cacheKey: cacheKey.substring(0, 50) + '...',
                cacheSize: schemaCache.size
            });
        }

        // Perform validation
        const valid = validate(data);
        
        if (valid) {
            return {
                valid: true,
                data: data,
                errors: null
            };
        } else {
            const formattedErrors = formatValidationErrors(validate.errors);
            
            logger.debug('Schema validation failed', {
                errorCount: validate.errors.length,
                errors: validate.errors
            });

            return {
                valid: false,
                data: null,
                errors: formattedErrors
            };
        }

    } catch (error) {
        logger.error('Schema validation error', {
            error: error.message
        }, error);

        return {
            valid: false,
            data: null,
            errors: [formatValidationErrors(['Schema validation error: ' + error.message])]
        };
    }
}

/**
 * Validates string values with comprehensive rules and sanitization
 * 
 * @param {any} value - Value to validate as string
 * @param {Object} [rules={}] - Validation rules
 * @param {number} [rules.minLength] - Minimum length
 * @param {number} [rules.maxLength] - Maximum length
 * @param {string} [rules.pattern] - RegExp pattern string
 * @param {boolean} [rules.allowEmpty=false] - Allow empty strings
 * @param {boolean} [rules.trim=true] - Trim whitespace
 * @returns {Object} Validation result
 */
function validateString(value, rules = {}) {
    const {
        minLength = 0,
        maxLength = 10000,
        pattern = null,
        allowEmpty = false,
        trim = true
    } = rules;

    try {
        // Type validation
        if (!util.isString(value)) {
            return {
                valid: false,
                data: null,
                errors: ['Value must be a string']
            };
        }

        // Trim if enabled
        let processedValue = trim ? value.trim() : value;

        // Empty check
        if (!allowEmpty && processedValue.length === 0) {
            return {
                valid: false,
                data: null,
                errors: ['String cannot be empty']
            };
        }

        // Length validation
        if (processedValue.length < minLength) {
            return {
                valid: false,
                data: null,
                errors: [`String must be at least ${minLength} characters long`]
            };
        }

        if (processedValue.length > maxLength) {
            return {
                valid: false,
                data: null,
                errors: [`String must not exceed ${maxLength} characters`]
            };
        }

        // Pattern validation
        if (pattern && !new RegExp(pattern).test(processedValue)) {
            return {
                valid: false,
                data: null,
                errors: ['String does not match required pattern']
            };
        }

        return {
            valid: true,
            data: processedValue,
            errors: null
        };

    } catch (error) {
        logger.error('String validation error', { error: error.message }, error);
        return {
            valid: false,
            data: null,
            errors: ['String validation failed']
        };
    }
}

/**
 * Validates number values with range and type checking
 * 
 * @param {any} value - Value to validate as number
 * @param {Object} [rules={}] - Validation rules
 * @param {number} [rules.min] - Minimum value
 * @param {number} [rules.max] - Maximum value
 * @param {boolean} [rules.integer=false] - Must be integer
 * @param {boolean} [rules.positive=false] - Must be positive
 * @returns {Object} Validation result
 */
function validateNumber(value, rules = {}) {
    const {
        min = Number.MIN_SAFE_INTEGER,
        max = Number.MAX_SAFE_INTEGER,
        integer = false,
        positive = false
    } = rules;

    try {
        // Type checking with coercion attempt
        let numValue;
        if (util.isNumber(value)) {
            numValue = value;
        } else if (util.isString(value) && validator.isNumeric(value)) {
            numValue = parseFloat(value);
        } else {
            return {
                valid: false,
                data: null,
                errors: ['Value must be a valid number']
            };
        }

        // NaN and Infinity checks
        if (!Number.isFinite(numValue)) {
            return {
                valid: false,
                data: null,
                errors: ['Value must be a finite number']
            };
        }

        // Integer validation
        if (integer && !Number.isInteger(numValue)) {
            return {
                valid: false,
                data: null,
                errors: ['Value must be an integer']
            };
        }

        // Positive validation
        if (positive && numValue <= 0) {
            return {
                valid: false,
                data: null,
                errors: ['Value must be positive']
            };
        }

        // Range validation
        if (numValue < min) {
            return {
                valid: false,
                data: null,
                errors: [`Value must be at least ${min}`]
            };
        }

        if (numValue > max) {
            return {
                valid: false,
                data: null,
                errors: [`Value must not exceed ${max}`]
            };
        }

        return {
            valid: true,
            data: numValue,
            errors: null
        };

    } catch (error) {
        logger.error('Number validation error', { error: error.message }, error);
        return {
            valid: false,
            data: null,
            errors: ['Number validation failed']
        };
    }
}

/**
 * Validates email addresses with comprehensive format checking
 * 
 * @param {any} value - Email value to validate
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.normalize=true] - Normalize email format
 * @param {boolean} [options.allowDisplayName=false] - Allow display names
 * @returns {Object} Validation result
 */
function validateEmail(value, options = {}) {
    const {
        normalize = true,
        allowDisplayName = false
    } = options;

    try {
        // Basic type check
        if (!util.isString(value)) {
            return {
                valid: false,
                data: null,
                errors: ['Email must be a string']
            };
        }

        const trimmedValue = value.trim();

        // Empty check
        if (trimmedValue.length === 0) {
            return {
                valid: false,
                data: null,
                errors: ['Email cannot be empty']
            };
        }

        // Length validation
        if (trimmedValue.length > 254) {
            return {
                valid: false,
                data: null,
                errors: ['Email address too long']
            };
        }

        // Format validation using validator library
        if (!validator.isEmail(trimmedValue, { allow_display_name: allowDisplayName })) {
            return {
                valid: false,
                data: null,
                errors: ['Invalid email format']
            };
        }

        // Normalize email if requested
        let processedEmail = trimmedValue;
        if (normalize) {
            try {
                processedEmail = validator.normalizeEmail(trimmedValue, {
                    gmail_lowercase: true,
                    gmail_remove_dots: false,
                    outlookdotcom_lowercase: true,
                    yahoo_lowercase: true
                });
            } catch (normalizeError) {
                logger.warn('Email normalization failed, using original', {
                    email: trimmedValue,
                    error: normalizeError.message
                });
                processedEmail = trimmedValue;
            }
        }

        return {
            valid: true,
            data: processedEmail,
            errors: null
        };

    } catch (error) {
        logger.error('Email validation error', { error: error.message }, error);
        return {
            valid: false,
            data: null,
            errors: ['Email validation failed']
        };
    }
}

/**
 * Validates date values with format and range checking
 * 
 * @param {any} value - Date value to validate
 * @param {Object} [rules={}] - Validation rules
 * @param {Date|string} [rules.min] - Minimum date
 * @param {Date|string} [rules.max] - Maximum date
 * @param {string} [rules.format='iso'] - Expected date format
 * @returns {Object} Validation result
 */
function validateDate(value, rules = {}) {
    const {
        min = null,
        max = null,
        format = 'iso'
    } = rules;

    try {
        let dateValue;

        // Parse date based on input type
        if (value instanceof Date) {
            dateValue = value;
        } else if (util.isString(value)) {
            // Attempt to parse string as date
            dateValue = new Date(value);
        } else {
            return {
                valid: false,
                data: null,
                errors: ['Value must be a valid date']
            };
        }

        // Check if date is valid
        if (isNaN(dateValue.getTime())) {
            return {
                valid: false,
                data: null,
                errors: ['Invalid date format']
            };
        }

        // Format validation for ISO strings
        if (format === 'iso' && util.isString(value)) {
            const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
            if (!isoPattern.test(value)) {
                return {
                    valid: false,
                    data: null,
                    errors: ['Date must be in ISO 8601 format']
                };
            }
        }

        // Range validation
        if (min) {
            const minDate = new Date(min);
            if (dateValue < minDate) {
                return {
                    valid: false,
                    data: null,
                    errors: [`Date must be after ${minDate.toISOString()}`]
                };
            }
        }

        if (max) {
            const maxDate = new Date(max);
            if (dateValue > maxDate) {
                return {
                    valid: false,
                    data: null,
                    errors: [`Date must be before ${maxDate.toISOString()}`]
                };
            }
        }

        return {
            valid: true,
            data: dateValue,
            errors: null
        };

    } catch (error) {
        logger.error('Date validation error', { error: error.message }, error);
        return {
            valid: false,
            data: null,
            errors: ['Date validation failed']
        };
    }
}

/**
 * Validates array values with element validation and constraints
 * 
 * @param {any} value - Array value to validate
 * @param {Object} [rules={}] - Validation rules
 * @param {number} [rules.minLength=0] - Minimum array length
 * @param {number} [rules.maxLength=1000] - Maximum array length
 * @param {Object} [rules.itemSchema] - Schema for array elements
 * @param {boolean} [rules.unique=false] - Elements must be unique
 * @returns {Object} Validation result
 */
function validateArray(value, rules = {}) {
    const {
        minLength = 0,
        maxLength = 1000,
        itemSchema = null,
        unique = false
    } = rules;

    try {
        // Type validation
        if (!util.isArray(value)) {
            return {
                valid: false,
                data: null,
                errors: ['Value must be an array']
            };
        }

        // Length validation
        if (value.length < minLength) {
            return {
                valid: false,
                data: null,
                errors: [`Array must contain at least ${minLength} items`]
            };
        }

        if (value.length > maxLength) {
            return {
                valid: false,
                data: null,
                errors: [`Array must not contain more than ${maxLength} items`]
            };
        }

        // Uniqueness validation
        if (unique) {
            const seen = new Set();
            for (const item of value) {
                const serialized = JSON.stringify(item);
                if (seen.has(serialized)) {
                    return {
                        valid: false,
                        data: null,
                        errors: ['Array items must be unique']
                    };
                }
                seen.add(serialized);
            }
        }

        // Element validation
        if (itemSchema) {
            const validatedItems = [];
            const itemErrors = [];

            for (let i = 0; i < value.length; i++) {
                const itemResult = validateSchema(value[i], itemSchema);
                if (itemResult.valid) {
                    validatedItems.push(itemResult.data);
                } else {
                    itemErrors.push(`Item ${i}: ${itemResult.errors.join(', ')}`);
                }
            }

            if (itemErrors.length > 0) {
                return {
                    valid: false,
                    data: null,
                    errors: itemErrors
                };
            }

            return {
                valid: true,
                data: validatedItems,
                errors: null
            };
        }

        return {
            valid: true,
            data: value,
            errors: null
        };

    } catch (error) {
        logger.error('Array validation error', { error: error.message }, error);
        return {
            valid: false,
            data: null,
            errors: ['Array validation failed']
        };
    }
}

/**
 * Validates object values with property validation and constraints
 * 
 * @param {any} value - Object value to validate
 * @param {Object} [schema={}] - JSON Schema for object validation
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.allowAdditional=true] - Allow additional properties
 * @param {boolean} [options.strict=false] - Strict validation mode
 * @returns {Object} Validation result
 */
function validateObject(value, schema = {}, options = {}) {
    const {
        allowAdditional = !config.validation.strict,
        strict = config.validation.strict
    } = options;

    try {
        // Type validation
        if (!util.isObject(value) || util.isArray(value) || value === null) {
            return {
                valid: false,
                data: null,
                errors: ['Value must be a plain object']
            };
        }

        // Create comprehensive schema
        const objectSchema = {
            type: 'object',
            additionalProperties: allowAdditional,
            ...schema
        };

        // Use schema validation for comprehensive object validation
        return validateSchema(value, objectSchema, { strict });

    } catch (error) {
        logger.error('Object validation error', { error: error.message }, error);
        return {
            valid: false,
            data: null,
            errors: ['Object validation failed']
        };
    }
}

/**
 * Sanitizes input data to prevent injection attacks and normalize values
 * 
 * @param {any} data - Data to sanitize
 * @param {Object} [options={}] - Sanitization options
 * @param {boolean} [options.htmlEscape=true] - Escape HTML entities
 * @param {boolean} [options.trimStrings=true] - Trim whitespace from strings
 * @param {boolean} [options.removeEmpty=false] - Remove empty values
 * @returns {any} Sanitized data
 */
function sanitizeInput(data, options = {}) {
    const {
        htmlEscape = true,
        trimStrings = true,
        removeEmpty = false
    } = options;

    try {
        if (data === null || data === undefined) {
            return removeEmpty ? undefined : data;
        }

        if (util.isString(data)) {
            let sanitized = data;
            
            // Trim whitespace
            if (trimStrings) {
                sanitized = sanitized.trim();
            }
            
            // Remove if empty and option set
            if (removeEmpty && sanitized.length === 0) {
                return undefined;
            }
            
            // HTML escape
            if (htmlEscape) {
                sanitized = validator.escape(sanitized);
            }
            
            return sanitized;
        }

        if (util.isArray(data)) {
            const sanitized = data.map(item => sanitizeInput(item, options));
            return removeEmpty ? sanitized.filter(item => item !== undefined) : sanitized;
        }

        if (util.isObject(data)) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                const sanitizedValue = sanitizeInput(value, options);
                if (!removeEmpty || sanitizedValue !== undefined) {
                    sanitized[key] = sanitizedValue;
                }
            }
            return sanitized;
        }

        // Numbers, booleans, and other primitives
        return data;

    } catch (error) {
        logger.error('Input sanitization error', { error: error.message }, error);
        return data; // Return original data if sanitization fails
    }
}

/**
 * Creates a JSON schema from configuration parameters
 * 
 * @param {Object} config - Schema configuration
 * @param {string} config.type - Schema type (object, array, string, etc.)
 * @param {Object} [config.properties] - Object properties definition
 * @param {Array} [config.required] - Required property names
 * @param {Object} [config.items] - Array items schema
 * @param {Object} [config.additionalProperties] - Additional properties behavior
 * @returns {Object} JSON Schema object
 */
function createSchema(config) {
    try {
        const {
            type = 'object',
            properties = {},
            required = [],
            items = null,
            additionalProperties = !config.validation?.strict,
            ...otherProps
        } = config;

        const schema = {
            type,
            ...otherProps
        };

        // Object-specific properties
        if (type === 'object') {
            schema.properties = properties;
            schema.additionalProperties = additionalProperties;
            
            if (required.length > 0) {
                schema.required = required;
            }
        }

        // Array-specific properties
        if (type === 'array' && items) {
            schema.items = items;
        }

        logger.debug('Created validation schema', {
            type,
            hasProperties: Object.keys(properties).length > 0,
            requiredCount: required.length,
            hasItems: !!items
        });

        return schema;

    } catch (error) {
        logger.error('Schema creation error', { error: error.message }, error);
        throw new Error(`Failed to create validation schema: ${error.message}`);
    }
}

/**
 * Formats validation errors into consistent, user-friendly messages
 * 
 * @param {Array|string} errors - Validation errors from AJV or custom validation
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.includeDetails=true] - Include detailed error information
 * @returns {Array} Formatted error messages
 */
function formatValidationErrors(errors, options = {}) {
    const { includeDetails = config.isDevelopment } = options;

    try {
        if (!errors) {
            return [];
        }

        // Handle string errors
        if (util.isString(errors)) {
            return [errors];
        }

        // Handle array of errors (AJV format or custom)
        if (util.isArray(errors)) {
            return errors.map(error => {
                if (util.isString(error)) {
                    return error;
                }

                // AJV error format
                if (error.instancePath !== undefined) {
                    const path = error.instancePath || 'root';
                    const field = path.replace(/^\//, '').replace(/\//g, '.');
                    const message = error.message || 'validation failed';
                    
                    if (includeDetails) {
                        return `${field || 'Field'} ${message} (received: ${JSON.stringify(error.data)})`;
                    } else {
                        return `${field || 'Field'} ${message}`;
                    }
                }

                // Custom error format
                if (error.field && error.message) {
                    return `${error.field} ${error.message}`;
                }

                // Generic error handling
                return error.message || util.inspect(error);
            });
        }

        // Single error object
        if (util.isObject(errors)) {
            if (errors.message) {
                return [errors.message];
            }
            return [util.inspect(errors)];
        }

        return ['Unknown validation error'];

    } catch (error) {
        logger.error('Error formatting validation errors', { error: error.message }, error);
        return ['Error formatting validation messages'];
    }
}

/**
 * Validator Class - Main validation interface providing comprehensive validation capabilities
 * 
 * Provides a class-based interface for validation operations with instance-specific
 * configuration, schema management, and custom rule registration. Supports both
 * static methods for simple validation and instance methods for complex validation
 * workflows with custom schemas and business rules.
 * 
 * @class Validator
 */
class Validator {
    /**
     * Creates a new Validator instance with custom configuration
     * 
     * @param {Object} [options={}] - Validator configuration options
     * @param {boolean} [options.strict] - Enable strict validation mode
     * @param {number} [options.timeout] - Validation timeout in milliseconds
     * @param {boolean} [options.sanitize=true] - Auto-sanitize inputs
     * @param {Object} [options.customFormats] - Custom format validators
     */
    constructor(options = {}) {
        this.options = {
            strict: options.strict ?? config.validation.strict,
            timeout: options.timeout ?? config.validation.timeout,
            sanitize: options.sanitize !== false,
            customFormats: options.customFormats || {}
        };

        // Create instance-specific AJV instance
        this.ajv = new Ajv({
            allErrors: true,
            removeAdditional: this.options.strict,
            useDefaults: true,
            coerceTypes: !this.options.strict,
            strict: this.options.strict,
            validateFormats: true
        });

        // Add formats and custom keywords
        addFormats(this.ajv);
        this._addCustomKeywords();
        this._addCustomFormats();

        // Instance-specific schema cache
        this.schemaCache = new Map();

        logger.info('Validator instance created', {
            strict: this.options.strict,
            timeout: this.options.timeout,
            sanitize: this.options.sanitize
        });
    }

    /**
     * Add custom AJV keywords to instance
     * @private
     */
    _addCustomKeywords() {
        // Copy keywords from global AJV instance
        this.ajv.addKeyword({
            keyword: 'isNotEmpty',
            type: 'string',
            schemaType: 'boolean',
            compile: (schemaVal) => {
                return function validate(data) {
                    return !schemaVal || (typeof data === 'string' && data.trim().length > 0);
                };
            },
            error: { message: 'must not be empty' }
        });

        this.ajv.addKeyword({
            keyword: 'strongPassword',
            type: 'string',
            schemaType: 'boolean',
            compile: (schemaVal) => {
                return function validate(data) {
                    if (!schemaVal) return true;
                    const hasMinLength = data.length >= 8;
                    const hasUppercase = /[A-Z]/.test(data);
                    const hasLowercase = /[a-z]/.test(data);
                    const hasNumber = /\d/.test(data);
                    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data);
                    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
                };
            },
            error: { message: 'must contain at least 8 characters with uppercase, lowercase, number, and special character' }
        });
    }

    /**
     * Add custom format validators to instance
     * @private
     */
    _addCustomFormats() {
        Object.entries(this.options.customFormats).forEach(([name, formatFn]) => {
            this.ajv.addFormat(name, formatFn);
        });
    }

    /**
     * Validates data using instance configuration
     * 
     * @param {any} data - Data to validate
     * @param {Object|string} schema - Validation schema
     * @param {Object} [options={}] - Validation options
     * @returns {Object} Validation result
     */
    validate(data, schema, options = {}) {
        const mergedOptions = { ...this.options, ...options };
        
        try {
            logger.debug('Instance validation started', {
                dataType: typeof data,
                schemaType: typeof schema,
                options: mergedOptions
            });

            // Use instance-specific validation
            const cacheKey = typeof schema === 'string' ? schema : JSON.stringify(schema);
            
            let validate;
            if (this.schemaCache.has(cacheKey)) {
                validate = this.schemaCache.get(cacheKey);
            } else {
                validate = this.ajv.compile(schema);
                this.schemaCache.set(cacheKey, validate);
            }

            // Sanitize input if enabled
            let processedData = data;
            if (mergedOptions.sanitize) {
                processedData = sanitizeInput(data);
            }

            const valid = validate(processedData);
            
            if (valid) {
                return {
                    valid: true,
                    data: processedData,
                    errors: null
                };
            } else {
                return {
                    valid: false,
                    data: null,
                    errors: formatValidationErrors(validate.errors)
                };
            }

        } catch (error) {
            logger.error('Instance validation error', { error: error.message }, error);
            return {
                valid: false,
                data: null,
                errors: ['Validation failed: ' + error.message]
            };
        }
    }

    /**
     * Validates request data with instance configuration
     * 
     * @param {any} data - Request data to validate
     * @param {Object} schema - Request schema
     * @param {Object} [options={}] - Validation options
     * @returns {Object} Validation result with metadata
     */
    validateRequest(data, schema, options = {}) {
        const startTime = Date.now();
        const mergedOptions = { ...this.options, ...options };

        try {
            const result = this.validate(data, schema, mergedOptions);
            const responseTime = Date.now() - startTime;

            // Timeout check
            if (mergedOptions.timeout && responseTime > mergedOptions.timeout) {
                logger.warn('Instance validation timeout', {
                    timeout: mergedOptions.timeout,
                    responseTime
                });

                return {
                    valid: false,
                    data: null,
                    errors: ['Validation timeout exceeded'],
                    metadata: {
                        responseTime,
                        timeout: true,
                        instance: true
                    }
                };
            }

            return {
                ...result,
                metadata: {
                    responseTime,
                    strict: mergedOptions.strict,
                    sanitized: mergedOptions.sanitize,
                    instance: true
                }
            };

        } catch (error) {
            logger.error('Instance request validation error', { error: error.message }, error);
            return {
                valid: false,
                data: null,
                errors: ['Request validation failed'],
                metadata: {
                    responseTime: Date.now() - startTime,
                    error: true,
                    instance: true
                }
            };
        }
    }

    /**
     * Adds a schema to the instance cache for reuse
     * 
     * @param {string} name - Schema identifier
     * @param {Object} schema - JSON Schema object
     * @returns {boolean} Success indicator
     */
    addSchema(name, schema) {
        try {
            this.ajv.addSchema(schema, name);
            logger.debug('Schema added to instance', {
                name,
                type: schema.type || 'unknown'
            });
            return true;
        } catch (error) {
            logger.error('Failed to add schema to instance', {
                name,
                error: error.message
            }, error);
            return false;
        }
    }

    /**
     * Adds a custom validation rule to the instance
     * 
     * @param {string} keyword - Rule keyword
     * @param {Object} definition - Rule definition
     * @returns {boolean} Success indicator
     */
    addCustomRule(keyword, definition) {
        try {
            this.ajv.addKeyword({
                keyword,
                ...definition
            });
            
            logger.debug('Custom rule added to instance', {
                keyword,
                type: definition.type || 'any'
            });
            
            return true;
        } catch (error) {
            logger.error('Failed to add custom rule to instance', {
                keyword,
                error: error.message
            }, error);
            return false;
        }
    }

    /**
     * Sanitizes input using instance configuration
     * 
     * @param {any} data - Data to sanitize
     * @param {Object} [options={}] - Sanitization options
     * @returns {any} Sanitized data
     */
    sanitize(data, options = {}) {
        const mergedOptions = { ...this.options, ...options };
        return sanitizeInput(data, mergedOptions);
    }

    /**
     * Formats validation errors using instance configuration
     * 
     * @param {Array|string} errors - Validation errors
     * @param {Object} [options={}] - Formatting options
     * @returns {Array} Formatted error messages
     */
    formatErrors(errors, options = {}) {
        const mergedOptions = { 
            includeDetails: config.isDevelopment,
            ...options 
        };
        return formatValidationErrors(errors, mergedOptions);
    }

    /**
     * Clears the instance schema cache
     * 
     * @returns {number} Number of schemas removed
     */
    clearCache() {
        const count = this.schemaCache.size;
        this.schemaCache.clear();
        
        logger.debug('Instance schema cache cleared', {
            removedSchemas: count
        });
        
        return count;
    }

    /**
     * Gets instance statistics and configuration
     * 
     * @returns {Object} Instance information
     */
    getInfo() {
        return {
            strict: this.options.strict,
            timeout: this.options.timeout,
            sanitize: this.options.sanitize,
            cacheSize: this.schemaCache.size,
            customFormats: Object.keys(this.options.customFormats),
            environment: config.environment
        };
    }
}

// Initialize performance monitoring
logger.info('Validator module initialized', {
    ajvVersion: ajv.version || 'unknown',
    cacheSize: schemaCache.size,
    commonSchemas: Object.keys(commonSchemas).length,
    strict: config.validation.strict,
    maxSize: config.validation.maxSize,
    timeout: config.validation.timeout
});

// Export individual functions for modular usage
module.exports = {
    // Main validation functions
    validateRequest,
    validateSchema,
    
    // Type-specific validation functions
    validateString,
    validateNumber,
    validateEmail,
    validateDate,
    validateArray,
    validateObject,
    
    // Utility functions
    sanitizeInput,
    createSchema,
    formatValidationErrors,
    
    // Main Validator class (default export)
    Validator,
    
    // Constants and utilities
    commonSchemas,
    schemaCache: {
        size: () => schemaCache.size,
        clear: () => schemaCache.clear(),
        has: (key) => schemaCache.has(key)
    }
};

// Set Validator as the default export
module.exports.default = Validator;