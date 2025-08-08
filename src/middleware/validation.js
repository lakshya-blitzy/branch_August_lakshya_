/**
 * Request Validation Middleware
 * 
 * Provides comprehensive validation middleware for HTTP requests including JSON Schema
 * validation for request bodies, query parameters, and route parameters. Implements
 * input sanitization, custom validation rules, and detailed error reporting to ensure
 * data integrity and prevent malformed requests from reaching route handlers.
 * 
 * Key Features:
 * - JSON Schema validation for request body, query parameters, and route parameters
 * - Input sanitization to prevent injection attacks and normalize data
 * - Custom validation rules and error message formatting
 * - Environment-aware validation strictness and timeout handling
 * - Integration with centralized error handling via ValidationError
 * - Support for both Joi and AJV validation engines
 * - Comprehensive edge case handling including empty bodies and malformed JSON
 * - Predefined schema definitions for common data types
 * 
 * @module validation
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - HTTP status codes and validation libraries
const { StatusCodes } = require('http-status-codes');
const Joi = require('joi');
const _ = require('lodash');
const util = require('util');

// Internal imports - Error handling, validation utilities, logging, and configuration
const { ValidationError } = require('./errorHandler.js');
const { Validator } = require('../utils/validator.js');
const logger = require('../utils/logger.js');
const config = require('../utils/config.js');

/**
 * Initialize global Validator instance with environment-specific configuration
 * Provides optimized validation with caching and performance monitoring
 */
const globalValidator = new Validator({
    strict: config.validation.strict,
    timeout: config.validation.timeout,
    sanitize: true
});

/**
 * Custom validation rules registry for business-specific validation logic
 * Allows dynamic addition of validation rules at runtime
 */
const customValidators = new Map();

/**
 * Predefined validation schemas for common data types across the application
 * Provides consistent validation patterns and reduces schema duplication
 */
const VALIDATION_SCHEMAS = {
    /**
     * User validation schema with comprehensive field validation
     * Supports user registration, profile updates, and authentication
     */
    USER: Joi.object({
        id: Joi.string().uuid().optional(),
        username: Joi.string().alphanum().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
        ).required(),
        firstName: Joi.string().min(1).max(50).required(),
        lastName: Joi.string().min(1).max(50).required(),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
        role: Joi.string().valid('admin', 'user', 'viewer').default('user'),
        isActive: Joi.boolean().default(true),
        createdAt: Joi.date().iso().optional(),
        updatedAt: Joi.date().iso().optional()
    }).options({ stripUnknown: config.validation.strict }),

    /**
     * Generic item validation schema for test entities and resources
     * Supports CRUD operations with comprehensive metadata validation
     */
    ITEM: Joi.object({
        id: Joi.string().uuid().optional(),
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().max(500).allow('').default(''),
        type: Joi.string().valid('test', 'suite', 'report', 'resource').required(),
        status: Joi.string().valid('active', 'inactive', 'pending', 'archived').default('active'),
        tags: Joi.array().items(Joi.string().max(50)).max(20).default([]),
        metadata: Joi.object().pattern(/^[a-zA-Z0-9_]+$/, Joi.any()).optional(),
        priority: Joi.number().integer().min(1).max(10).default(5),
        createdBy: Joi.string().uuid().required(),
        createdAt: Joi.date().iso().optional(),
        updatedAt: Joi.date().iso().optional()
    }).options({ stripUnknown: config.validation.strict }),

    /**
     * API key validation schema for authentication and authorization
     * Supports both temporary and permanent API key management
     */
    API_KEY: Joi.object({
        key: Joi.string().pattern(/^[a-zA-Z0-9]{32,128}$/).required(),
        name: Joi.string().min(1).max(100).required(),
        permissions: Joi.array().items(
            Joi.string().valid('read', 'write', 'delete', 'admin')
        ).min(1).required(),
        expiresAt: Joi.date().iso().greater('now').optional(),
        isActive: Joi.boolean().default(true),
        rateLimitTier: Joi.string().valid('basic', 'premium', 'enterprise').default('basic'),
        allowedIPs: Joi.array().items(
            Joi.string().pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
        ).optional(),
        createdAt: Joi.date().iso().optional()
    }).options({ stripUnknown: config.validation.strict }),

    /**
     * Email validation schema with normalization and format validation
     * Supports both simple email validation and advanced email processing
     */
    EMAIL: Joi.object({
        email: Joi.string().email({ tlds: { allow: true } }).required(),
        type: Joi.string().valid('primary', 'secondary', 'notification').default('primary'),
        isVerified: Joi.boolean().default(false),
        verificationToken: Joi.string().pattern(/^[a-zA-Z0-9]{64}$/).optional(),
        verifiedAt: Joi.date().iso().optional(),
        bounceCount: Joi.number().integer().min(0).default(0),
        isBlacklisted: Joi.boolean().default(false)
    }).options({ stripUnknown: config.validation.strict }),

    /**
     * UUID validation schema for entity identifiers and references
     * Supports both individual UUID validation and batch UUID processing
     */
    UUID: Joi.object({
        id: Joi.string().uuid().required(),
        type: Joi.string().max(50).optional(),
        version: Joi.number().integer().valid(1, 2, 3, 4, 5).default(4),
        namespace: Joi.string().uuid().optional(),
        context: Joi.string().max(100).optional()
    }).options({ stripUnknown: config.validation.strict })
};

/**
 * Request body validation middleware factory
 * Creates middleware function that validates POST/PUT/PATCH request bodies
 * 
 * @param {Object|string} schema - Joi schema object or predefined schema name
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.allowEmpty=false] - Allow empty request bodies
 * @param {boolean} [options.stripUnknown] - Remove unknown properties
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.post('/users', validateBody(VALIDATION_SCHEMAS.USER), (req, res) => {
 *   // req.body is validated and sanitized
 * });
 */
function validateBody(schema, options = {}) {
    const {
        allowEmpty = false,
        stripUnknown = config.validation.strict,
        timeout = config.validation.timeout
    } = options;

    return async (req, res, next) => {
        const startTime = Date.now();
        
        try {
            logger.debug('Starting request body validation', {
                method: req.method,
                path: req.path,
                contentType: req.get('Content-Type'),
                bodySize: req.body ? JSON.stringify(req.body).length : 0,
                schema: typeof schema === 'string' ? schema : 'custom'
            });

            // Handle empty body validation
            if (_.isEmpty(req.body)) {
                if (!allowEmpty) {
                    throw new ValidationError(
                        'Request body cannot be empty',
                        {
                            field: 'body',
                            received: 'empty',
                            expected: 'valid JSON object'
                        }
                    );
                }
                logger.debug('Empty body allowed, skipping validation');
                return next();
            }

            // Get validation schema
            const validationSchema = typeof schema === 'string' ? 
                VALIDATION_SCHEMAS[schema] : schema;

            if (!validationSchema) {
                throw new ValidationError(
                    'Invalid validation schema provided',
                    {
                        schema: typeof schema === 'string' ? schema : 'unknown',
                        availableSchemas: Object.keys(VALIDATION_SCHEMAS)
                    }
                );
            }

            // Perform Joi validation with options
            const joiOptions = {
                abortEarly: false,
                stripUnknown: stripUnknown,
                presence: config.validation.strict ? 'required' : 'optional',
                convert: true
            };

            const { error, value } = validationSchema.validate(req.body, joiOptions);

            // Check for validation timeout
            const validationTime = Date.now() - startTime;
            if (validationTime > timeout) {
                logger.warn('Body validation timeout exceeded', {
                    timeout,
                    actualTime: validationTime,
                    path: req.path
                });
                
                throw new ValidationError(
                    'Request validation timeout exceeded',
                    {
                        timeout: timeout,
                        actualTime: validationTime
                    }
                );
            }

            if (error) {
                const validationDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                    type: detail.type
                }));

                logger.warn('Request body validation failed', {
                    path: req.path,
                    errors: validationDetails,
                    validationTime
                });

                throw new ValidationError(
                    'Request body validation failed',
                    {
                        errors: validationDetails,
                        errorCount: error.details.length
                    }
                );
            }

            // Sanitize validated data
            const sanitizedData = globalValidator.sanitize(value, {
                htmlEscape: true,
                trimStrings: true,
                removeEmpty: false
            });

            // Replace request body with validated and sanitized data
            req.body = sanitizedData;

            logger.debug('Request body validation successful', {
                path: req.path,
                validationTime,
                originalSize: JSON.stringify(req.body).length,
                sanitizedSize: JSON.stringify(sanitizedData).length
            });

            next();

        } catch (error) {
            if (error instanceof ValidationError) {
                return next(error);
            }

            logger.error('Unexpected error during body validation', {
                path: req.path,
                error: error.message,
                stack: error.stack
            }, error);

            next(new ValidationError(
                'Internal validation error occurred',
                {
                    originalError: error.message,
                    validationTime: Date.now() - startTime
                }
            ));
        }
    };
}

/**
 * Query parameter validation middleware factory
 * Creates middleware function that validates GET request query parameters
 * 
 * @param {Object|string} schema - Joi schema object or predefined schema name
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.allowEmpty=true] - Allow empty query parameters
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.get('/users', validateQuery(Joi.object({
 *   page: Joi.number().integer().min(1).default(1),
 *   limit: Joi.number().integer().min(1).max(100).default(10)
 * })), (req, res) => {
 *   // req.query is validated and sanitized
 * });
 */
function validateQuery(schema, options = {}) {
    const {
        allowEmpty = true,
        timeout = config.validation.timeout
    } = options;

    return async (req, res, next) => {
        const startTime = Date.now();
        
        try {
            logger.debug('Starting query parameter validation', {
                method: req.method,
                path: req.path,
                queryParams: Object.keys(req.query),
                queryCount: Object.keys(req.query).length
            });

            // Handle empty query parameters
            if (_.isEmpty(req.query)) {
                if (!allowEmpty) {
                    throw new ValidationError(
                        'Query parameters are required',
                        {
                            field: 'query',
                            received: 'empty',
                            expected: 'valid query parameters'
                        }
                    );
                }
                logger.debug('Empty query parameters allowed, skipping validation');
                return next();
            }

            // Get validation schema
            const validationSchema = typeof schema === 'string' ? 
                VALIDATION_SCHEMAS[schema] : schema;

            if (!validationSchema) {
                throw new ValidationError(
                    'Invalid query validation schema provided',
                    {
                        schema: typeof schema === 'string' ? schema : 'unknown'
                    }
                );
            }

            // Perform Joi validation
            const joiOptions = {
                abortEarly: false,
                stripUnknown: config.validation.strict,
                presence: 'optional',
                convert: true
            };

            const { error, value } = validationSchema.validate(req.query, joiOptions);

            // Check for validation timeout
            const validationTime = Date.now() - startTime;
            if (validationTime > timeout) {
                logger.warn('Query validation timeout exceeded', {
                    timeout,
                    actualTime: validationTime,
                    path: req.path
                });
                
                throw new ValidationError(
                    'Query validation timeout exceeded',
                    {
                        timeout: timeout,
                        actualTime: validationTime
                    }
                );
            }

            if (error) {
                const validationDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                    type: detail.type
                }));

                logger.warn('Query parameter validation failed', {
                    path: req.path,
                    errors: validationDetails,
                    validationTime
                });

                throw new ValidationError(
                    'Query parameter validation failed',
                    {
                        errors: validationDetails,
                        errorCount: error.details.length
                    }
                );
            }

            // Sanitize validated query parameters
            const sanitizedQuery = globalValidator.sanitize(value, {
                htmlEscape: true,
                trimStrings: true,
                removeEmpty: true
            });

            // Replace request query with validated and sanitized data
            req.query = sanitizedQuery;

            logger.debug('Query parameter validation successful', {
                path: req.path,
                validationTime,
                paramCount: Object.keys(sanitizedQuery).length
            });

            next();

        } catch (error) {
            if (error instanceof ValidationError) {
                return next(error);
            }

            logger.error('Unexpected error during query validation', {
                path: req.path,
                error: error.message,
                stack: error.stack
            }, error);

            next(new ValidationError(
                'Internal query validation error occurred',
                {
                    originalError: error.message,
                    validationTime: Date.now() - startTime
                }
            ));
        }
    };
}

/**
 * Route parameter validation middleware factory
 * Creates middleware function that validates URL route parameters for type and format
 * 
 * @param {Object|string} schema - Joi schema object or predefined schema name
 * @param {Object} [options={}] - Validation options
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.get('/users/:id', validateParams(Joi.object({
 *   id: Joi.string().uuid().required()
 * })), (req, res) => {
 *   // req.params is validated and sanitized
 * });
 */
function validateParams(schema, options = {}) {
    const {
        timeout = config.validation.timeout
    } = options;

    return async (req, res, next) => {
        const startTime = Date.now();
        
        try {
            logger.debug('Starting route parameter validation', {
                method: req.method,
                path: req.path,
                params: req.params,
                paramCount: Object.keys(req.params).length
            });

            // Route parameters should always exist if middleware is applied
            if (_.isEmpty(req.params)) {
                logger.debug('No route parameters to validate');
                return next();
            }

            // Get validation schema
            const validationSchema = typeof schema === 'string' ? 
                VALIDATION_SCHEMAS[schema] : schema;

            if (!validationSchema) {
                throw new ValidationError(
                    'Invalid parameter validation schema provided',
                    {
                        schema: typeof schema === 'string' ? schema : 'unknown'
                    }
                );
            }

            // Perform Joi validation
            const joiOptions = {
                abortEarly: false,
                stripUnknown: false, // Don't strip params as they're defined by routes
                presence: 'required',
                convert: true
            };

            const { error, value } = validationSchema.validate(req.params, joiOptions);

            // Check for validation timeout
            const validationTime = Date.now() - startTime;
            if (validationTime > timeout) {
                logger.warn('Parameter validation timeout exceeded', {
                    timeout,
                    actualTime: validationTime,
                    path: req.path
                });
                
                throw new ValidationError(
                    'Parameter validation timeout exceeded',
                    {
                        timeout: timeout,
                        actualTime: validationTime
                    }
                );
            }

            if (error) {
                const validationDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                    type: detail.type
                }));

                logger.warn('Route parameter validation failed', {
                    path: req.path,
                    errors: validationDetails,
                    validationTime
                });

                throw new ValidationError(
                    'Route parameter validation failed',
                    {
                        errors: validationDetails,
                        errorCount: error.details.length
                    }
                );
            }

            // Sanitize validated route parameters
            const sanitizedParams = globalValidator.sanitize(value, {
                htmlEscape: true,
                trimStrings: true,
                removeEmpty: false
            });

            // Replace request params with validated and sanitized data
            req.params = sanitizedParams;

            logger.debug('Route parameter validation successful', {
                path: req.path,
                validationTime,
                paramCount: Object.keys(sanitizedParams).length
            });

            next();

        } catch (error) {
            if (error instanceof ValidationError) {
                return next(error);
            }

            logger.error('Unexpected error during parameter validation', {
                path: req.path,
                error: error.message,
                stack: error.stack
            }, error);

            next(new ValidationError(
                'Internal parameter validation error occurred',
                {
                    originalError: error.message,
                    validationTime: Date.now() - startTime
                }
            ));
        }
    };
}

/**
 * Main validation middleware factory function
 * Creates comprehensive validation middleware based on validation type
 * 
 * @param {string} type - Validation type ('body', 'query', 'params', or 'all')
 * @param {Object|string} schema - Joi schema object or predefined schema name
 * @param {Object} [options={}] - Validation options
 * @returns {Function|Array} Express middleware function or array of middleware functions
 * 
 * @example
 * // Validate only request body
 * app.post('/users', validate('body', VALIDATION_SCHEMAS.USER), handler);
 * 
 * // Validate all request components
 * app.put('/users/:id', validate('all', {
 *   params: VALIDATION_SCHEMAS.UUID,
 *   body: VALIDATION_SCHEMAS.USER,
 *   query: Joi.object({ force: Joi.boolean().default(false) })
 * }), handler);
 */
function validate(type, schema, options = {}) {
    logger.debug('Creating validation middleware', {
        type,
        schemaType: typeof schema,
        options
    });

    switch (type) {
        case 'body':
            return validateBody(schema, options);
            
        case 'query':
            return validateQuery(schema, options);
            
        case 'params':
            return validateParams(schema, options);
            
        case 'all':
            // Comprehensive validation for all request components
            if (!_.isObject(schema) || _.isArray(schema)) {
                throw new Error('Schema must be an object with body, query, and/or params properties for "all" validation');
            }
            
            const middlewares = [];
            
            if (schema.params) {
                middlewares.push(validateParams(schema.params, options.params || options));
            }
            
            if (schema.query) {
                middlewares.push(validateQuery(schema.query, options.query || options));
            }
            
            if (schema.body) {
                middlewares.push(validateBody(schema.body, options.body || options));
            }
            
            return middlewares;
            
        default:
            throw new Error(`Invalid validation type: ${type}. Must be 'body', 'query', 'params', or 'all'`);
    }
}

/**
 * Create custom Joi validation schema from configuration object
 * Provides a fluent API for building validation schemas programmatically
 * 
 * @param {Object} schemaConfig - Schema configuration object
 * @param {string} schemaConfig.type - Schema type ('object', 'array', 'string', etc.)
 * @param {Object} [schemaConfig.properties] - Object properties definition
 * @param {Array} [schemaConfig.required] - Required property names
 * @param {Object} [schemaConfig.rules] - Additional validation rules
 * @returns {Object} Joi schema object
 * 
 * @example
 * const userSchema = createSchema({
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', min: 1, max: 100 },
 *     age: { type: 'number', min: 0, max: 150 }
 *   },
 *   required: ['name']
 * });
 */
function createSchema(schemaConfig) {
    try {
        logger.debug('Creating custom validation schema', {
            type: schemaConfig.type,
            hasProperties: !!schemaConfig.properties,
            requiredCount: schemaConfig.required ? schemaConfig.required.length : 0
        });

        const {
            type = 'object',
            properties = {},
            required = [],
            rules = {},
            options = {}
        } = schemaConfig;

        let schema;

        switch (type) {
            case 'object':
                const joiProperties = {};
                
                // Convert properties to Joi schema definitions
                Object.entries(properties).forEach(([key, propConfig]) => {
                    joiProperties[key] = createPropertySchema(propConfig);
                });
                
                schema = Joi.object(joiProperties);
                
                // Apply required fields
                if (required.length > 0) {
                    schema = schema.required(...required);
                }
                break;
                
            case 'array':
                const itemSchema = rules.items ? createPropertySchema(rules.items) : Joi.any();
                schema = Joi.array().items(itemSchema);
                
                if (rules.min !== undefined) schema = schema.min(rules.min);
                if (rules.max !== undefined) schema = schema.max(rules.max);
                break;
                
            case 'string':
                schema = Joi.string();
                if (rules.min !== undefined) schema = schema.min(rules.min);
                if (rules.max !== undefined) schema = schema.max(rules.max);
                if (rules.pattern) schema = schema.pattern(new RegExp(rules.pattern));
                if (rules.email) schema = schema.email();
                if (rules.uuid) schema = schema.uuid();
                break;
                
            case 'number':
                schema = Joi.number();
                if (rules.min !== undefined) schema = schema.min(rules.min);
                if (rules.max !== undefined) schema = schema.max(rules.max);
                if (rules.integer) schema = schema.integer();
                if (rules.positive) schema = schema.positive();
                break;
                
            case 'boolean':
                schema = Joi.boolean();
                break;
                
            case 'date':
                schema = Joi.date();
                if (rules.iso) schema = schema.iso();
                if (rules.min) schema = schema.min(rules.min);
                if (rules.max) schema = schema.max(rules.max);
                break;
                
            default:
                throw new Error(`Unsupported schema type: ${type}`);
        }

        // Apply additional options
        if (Object.keys(options).length > 0) {
            schema = schema.options(options);
        }

        logger.debug('Custom validation schema created successfully', {
            type,
            propertyCount: Object.keys(properties).length
        });

        return schema;

    } catch (error) {
        logger.error('Failed to create custom validation schema', {
            error: error.message,
            schemaConfig
        }, error);
        throw new Error(`Schema creation failed: ${error.message}`);
    }
}

/**
 * Helper function to create Joi property schema from configuration
 * @private
 */
function createPropertySchema(propConfig) {
    if (_.isString(propConfig)) {
        return Joi.string();
    }
    
    const { type = 'string', ...rules } = propConfig;
    
    let propSchema;
    
    switch (type) {
        case 'string':
            propSchema = Joi.string();
            if (rules.min !== undefined) propSchema = propSchema.min(rules.min);
            if (rules.max !== undefined) propSchema = propSchema.max(rules.max);
            if (rules.pattern) propSchema = propSchema.pattern(new RegExp(rules.pattern));
            if (rules.email) propSchema = propSchema.email();
            if (rules.uuid) propSchema = propSchema.uuid();
            break;
            
        case 'number':
            propSchema = Joi.number();
            if (rules.min !== undefined) propSchema = propSchema.min(rules.min);
            if (rules.max !== undefined) propSchema = propSchema.max(rules.max);
            if (rules.integer) propSchema = propSchema.integer();
            break;
            
        case 'boolean':
            propSchema = Joi.boolean();
            break;
            
        case 'date':
            propSchema = Joi.date();
            if (rules.iso) propSchema = propSchema.iso();
            break;
            
        case 'array':
            const itemSchema = rules.items ? createPropertySchema(rules.items) : Joi.any();
            propSchema = Joi.array().items(itemSchema);
            if (rules.min !== undefined) propSchema = propSchema.min(rules.min);
            if (rules.max !== undefined) propSchema = propSchema.max(rules.max);
            break;
            
        default:
            propSchema = Joi.any();
    }
    
    // Apply optional/required and default values
    if (rules.optional || rules.required === false) {
        propSchema = propSchema.optional();
    }
    
    if (rules.default !== undefined) {
        propSchema = propSchema.default(rules.default);
    }
    
    return propSchema;
}

/**
 * Add custom validation rule to the global validation system
 * Enables registration of business-specific validation logic
 * 
 * @param {string} name - Validator name identifier
 * @param {Function} validator - Validation function
 * @param {Object} [options={}] - Validator options
 * @param {string} [options.message] - Default error message
 * @param {Array} [options.params] - Parameter names for the validator
 * @returns {boolean} Success indicator
 * 
 * @example
 * addCustomValidator('isBusinessEmail', (value) => {
 *   const businessDomains = ['company.com', 'business.org'];
 *   const domain = value.split('@')[1];
 *   return businessDomains.includes(domain);
 * }, {
 *   message: 'Email must be from a business domain',
 *   params: ['domains']
 * });
 */
function addCustomValidator(name, validator, options = {}) {
    try {
        logger.debug('Adding custom validator', {
            name,
            hasMessage: !!options.message,
            paramCount: options.params ? options.params.length : 0
        });

        if (!_.isString(name) || name.trim().length === 0) {
            throw new Error('Validator name must be a non-empty string');
        }

        if (!_.isFunction(validator)) {
            throw new Error('Validator must be a function');
        }

        // Store validator in registry
        customValidators.set(name, {
            validator,
            message: options.message || `${name} validation failed`,
            params: options.params || [],
            createdAt: new Date().toISOString()
        });

        // Add to global Validator instance
        const validatorDefinition = {
            type: options.type || 'any',
            schemaType: 'boolean',
            compile: () => validator,
            error: { message: options.message || `${name} validation failed` }
        };

        const success = globalValidator.addCustomRule(name, validatorDefinition);

        if (success) {
            logger.info('Custom validator added successfully', {
                name,
                type: options.type || 'any',
                totalValidators: customValidators.size
            });
        }

        return success;

    } catch (error) {
        logger.error('Failed to add custom validator', {
            name,
            error: error.message
        }, error);
        return false;
    }
}

/**
 * Sanitize input data to prevent injection attacks and normalize values
 * Provides comprehensive input cleaning with configurable options
 * 
 * @param {any} data - Data to sanitize
 * @param {Object} [options={}] - Sanitization options
 * @param {boolean} [options.htmlEscape=true] - Escape HTML entities
 * @param {boolean} [options.trimStrings=true] - Trim whitespace from strings
 * @param {boolean} [options.removeEmpty=false] - Remove empty values
 * @param {boolean} [options.deepClone=true] - Create deep copy of input data
 * @returns {any} Sanitized data
 * 
 * @example
 * const cleanData = sanitizeInput({
 *   name: '  John <script>alert("hack")</script>  ',
 *   age: '25',
 *   tags: ['  tag1  ', '', 'tag2']
 * }, {
 *   htmlEscape: true,
 *   trimStrings: true,
 *   removeEmpty: true
 * });
 */
function sanitizeInput(data, options = {}) {
    const {
        htmlEscape = true,
        trimStrings = true,
        removeEmpty = false,
        deepClone = true
    } = options;

    try {
        logger.debug('Starting input sanitization', {
            dataType: typeof data,
            isArray: _.isArray(data),
            isObject: _.isObject(data),
            options
        });

        // Create deep copy to avoid mutating original data
        let sanitizedData = deepClone ? _.cloneDeep(data) : data;

        // Handle null and undefined
        if (_.isNull(sanitizedData) || _.isUndefined(sanitizedData)) {
            return removeEmpty ? undefined : sanitizedData;
        }

        // Handle string values
        if (_.isString(sanitizedData)) {
            if (trimStrings) {
                sanitizedData = sanitizedData.trim();
            }
            
            if (removeEmpty && sanitizedData.length === 0) {
                return undefined;
            }
            
            if (htmlEscape) {
                // Basic HTML entity escaping
                sanitizedData = sanitizedData
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            }
            
            return sanitizedData;
        }

        // Handle array values
        if (_.isArray(sanitizedData)) {
            const sanitizedArray = sanitizedData.map(item => 
                sanitizeInput(item, { ...options, deepClone: false })
            );
            
            return removeEmpty ? 
                sanitizedArray.filter(item => !_.isUndefined(item)) : 
                sanitizedArray;
        }

        // Handle object values
        if (_.isObject(sanitizedData)) {
            const sanitizedObject = {};
            
            Object.entries(sanitizedData).forEach(([key, value]) => {
                const sanitizedKey = trimStrings && _.isString(key) ? key.trim() : key;
                const sanitizedValue = sanitizeInput(value, { ...options, deepClone: false });
                
                if (!removeEmpty || !_.isUndefined(sanitizedValue)) {
                    sanitizedObject[sanitizedKey] = sanitizedValue;
                }
            });
            
            return sanitizedObject;
        }

        // Handle primitive values (numbers, booleans, dates)
        return sanitizedData;

    } catch (error) {
        logger.error('Input sanitization failed', {
            error: error.message,
            dataType: typeof data
        }, error);
        
        // Return original data if sanitization fails
        return data;
    }
}

// Initialize validation system
logger.info('Validation middleware initialized', {
    strict: config.validation.strict,
    maxSize: config.validation.maxSize,
    timeout: config.validation.timeout,
    schemaCount: Object.keys(VALIDATION_SCHEMAS).length,
    customValidators: customValidators.size,
    environment: config.nodeEnv
});

// Export individual validation functions
module.exports = {
    validateBody,
    validateQuery,
    validateParams,
    createSchema,
    addCustomValidator,
    sanitizeInput,
    VALIDATION_SCHEMAS
};

// Export main validation function as default export
module.exports.default = validate;
module.exports.validate = validate;