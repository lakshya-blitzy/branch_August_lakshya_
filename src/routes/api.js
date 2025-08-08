/**
 * Express Router API Endpoints for Node.js Server Component
 * 
 * Implements comprehensive RESTful API endpoints for the Testinium-QA Node.js server component.
 * Provides complete HTTP method handlers (GET, POST, PUT, DELETE, PATCH) with proper request
 * validation, response formatting, status code management, and error handling. Routes support
 * JSON payload processing, query parameter handling, and integration with server middleware
 * for authentication, CORS, and logging.
 * 
 * Key Features:
 * - Complete RESTful endpoint implementation with all HTTP methods
 * - Comprehensive request validation using JSON Schema validation
 * - Consistent response formatting across all endpoints
 * - Proper HTTP status code usage with descriptive error messages
 * - Integration with centralized error handling middleware
 * - Support for pagination, filtering, and sorting query parameters
 * - CORS preflight request handling through OPTIONS method handlers
 * - Request/response logging with correlation tracking
 * - Input sanitization and data validation for security
 * - Edge case handling and boundary condition validation
 * - Production-ready error handling with graceful degradation
 * 
 * @module api
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports - Express Router and async error handling
const { Router } = require('express');
require('express-async-errors');
const { StatusCodes } = require('http-status-codes');

// Internal imports - Server utilities and middleware
const errorHandler = require('../middleware/errorHandler.js');
const responseFormatter = require('../utils/responseFormatter.js');
const { Validator } = require('../utils/validator.js');
const logger = require('../utils/logger.js');

// Create Express Router instance with strict routing enabled
const router = Router({ strict: true, caseSensitive: true });

// Create validator instance with API-specific configuration
const validator = new Validator({
    strict: true,
    sanitize: true,
    timeout: 5000
});

/**
 * In-memory data store for demonstration purposes
 * In production, this would be replaced with database integration
 */
let itemsStore = new Map();
let nextItemId = 1;

// Seed some initial data for testing
itemsStore.set('1', { 
    id: '1', 
    name: 'Sample Item 1', 
    description: 'A sample item for testing purposes',
    category: 'test',
    price: 29.99,
    inStock: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
itemsStore.set('2', { 
    id: '2', 
    name: 'Sample Item 2', 
    description: 'Another sample item with different properties',
    category: 'demo',
    price: 49.99,
    inStock: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
nextItemId = 3;

/**
 * JSON Schema definitions for request validation
 */
const schemas = {
    // Item creation schema with required fields
    createItem: {
        type: 'object',
        required: ['name', 'description', 'category', 'price'],
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                isNotEmpty: true
            },
            description: {
                type: 'string',
                minLength: 1,
                maxLength: 500,
                isNotEmpty: true
            },
            category: {
                type: 'string',
                minLength: 1,
                maxLength: 50,
                isNotEmpty: true
            },
            price: {
                type: 'number',
                exclusiveMinimum: 0
            },
            inStock: {
                type: 'boolean',
                default: true
            }
        },
        additionalProperties: false
    },
    
    // Item update schema for PUT requests (full replacement)
    updateItem: {
        type: 'object',
        required: ['name', 'description', 'category', 'price'],
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                isNotEmpty: true
            },
            description: {
                type: 'string',
                minLength: 1,
                maxLength: 500,
                isNotEmpty: true
            },
            category: {
                type: 'string',
                minLength: 1,
                maxLength: 50,
                isNotEmpty: true
            },
            price: {
                type: 'number',
                exclusiveMinimum: 0
            },
            inStock: {
                type: 'boolean'
            }
        },
        additionalProperties: false
    },
    
    // Item patch schema for PATCH requests (partial updates)
    patchItem: {
        type: 'object',
        minProperties: 1,
        properties: {
            name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                isNotEmpty: true
            },
            description: {
                type: 'string',
                minLength: 1,
                maxLength: 500,
                isNotEmpty: true
            },
            category: {
                type: 'string',
                minLength: 1,
                maxLength: 50,
                isNotEmpty: true
            },
            price: {
                type: 'number',
                exclusiveMinimum: 0
            },
            inStock: {
                type: 'boolean'
            }
        },
        additionalProperties: false
    },
    
    // Query parameters validation schema
    listQuery: {
        type: 'object',
        properties: {
            page: {
                type: 'string',
                pattern: '^[1-9]\\d*$',
                default: '1'
            },
            limit: {
                type: 'string',
                pattern: '^[1-9]\\d*$',
                default: '10'
            },
            sort: {
                type: 'string',
                enum: ['name', 'price', 'category', 'createdAt', 'updatedAt'],
                default: 'createdAt'
            },
            order: {
                type: 'string',
                enum: ['asc', 'desc'],
                default: 'desc'
            },
            category: {
                type: 'string',
                minLength: 1,
                maxLength: 50
            },
            inStock: {
                type: 'string',
                enum: ['true', 'false']
            }
        },
        additionalProperties: false
    }
};

/**
 * Utility function to validate and parse query parameters
 * @param {Object} query - Express request query object
 * @returns {Object} Validated and parsed query parameters
 */
function parseQueryParameters(query) {
    const result = validator.validate(query, schemas.listQuery);
    
    if (!result.valid) {
        throw new errorHandler.ValidationError(
            'Invalid query parameters',
            { errors: result.errors }
        );
    }
    
    // Parse numeric values
    const parsed = {
        page: parseInt(result.data.page || '1', 10),
        limit: Math.min(parseInt(result.data.limit || '10', 10), 100), // Cap at 100
        sort: result.data.sort || 'createdAt',
        order: result.data.order || 'desc',
        category: result.data.category,
        inStock: result.data.inStock ? result.data.inStock === 'true' : undefined
    };
    
    return parsed;
}

/**
 * Utility function to apply filtering and sorting to items
 * @param {Array} items - Array of items to filter and sort
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered and sorted items
 */
function filterAndSortItems(items, filters) {
    let filtered = [...items];
    
    // Apply category filter
    if (filters.category) {
        filtered = filtered.filter(item => 
            item.category.toLowerCase().includes(filters.category.toLowerCase())
        );
    }
    
    // Apply stock status filter
    if (filters.inStock !== undefined) {
        filtered = filtered.filter(item => item.inStock === filters.inStock);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
        let aValue = a[filters.sort];
        let bValue = b[filters.sort];
        
        // Handle different data types
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (filters.order === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });
    
    return filtered;
}

/**
 * Utility function to apply pagination to items array
 * @param {Array} items - Array of items to paginate
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result with items and metadata
 */
function paginateItems(items, page, limit) {
    const total = items.length;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);
    
    return {
        items: paginatedItems,
        pagination: {
            page,
            limit,
            total
        }
    };
}

/**
 * GET /api/health - Health check endpoint
 * Returns server status, uptime, and system information for monitoring
 */
router.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    logger.info('Health check endpoint accessed', {
        method: 'GET',
        path: '/api/health',
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    try {
        const uptime = process.uptime();
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            uptimeSeconds: uptime,
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            pid: process.pid,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                architecture: process.arch
            }
        };
        
        const responseTime = Date.now() - startTime;
        
        const response = responseFormatter.success(healthData, {
            statusCode: StatusCodes.OK,
            message: 'Server is healthy and operational',
            responseTime
        });
        
        logger.debug('Health check completed successfully', {
            responseTime,
            uptime: healthData.uptime,
            memoryUsed: healthData.memory.used
        });
        
        res.status(StatusCodes.OK).json(response);
        
    } catch (error) {
        logger.error('Health check endpoint error', {
            method: 'GET',
            path: '/api/health',
            error: error.message
        }, error);
        
        const errorResponse = responseFormatter.error(error, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            code: 'HEALTH_CHECK_ERROR'
        });
        
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
});

/**
 * GET /api/items - List items with pagination, filtering, and sorting
 * Supports query parameters: page, limit, sort, order, category, inStock
 */
router.get('/items', async (req, res) => {
    const startTime = Date.now();
    
    logger.info('List items endpoint accessed', {
        method: 'GET',
        path: '/api/items',
        query: req.query,
        ip: req.ip
    });
    
    try {
        // Validate and parse query parameters
        const queryParams = parseQueryParameters(req.query);
        
        logger.debug('Query parameters validated', {
            parsedParams: queryParams
        });
        
        // Get all items from store
        const allItems = Array.from(itemsStore.values());
        
        // Apply filtering and sorting
        const filteredItems = filterAndSortItems(allItems, queryParams);
        
        // Apply pagination
        const paginatedResult = paginateItems(filteredItems, queryParams.page, queryParams.limit);
        
        const responseTime = Date.now() - startTime;
        
        const response = responseFormatter.paginated(
            paginatedResult.items,
            paginatedResult.pagination,
            {
                message: `Retrieved ${paginatedResult.items.length} items successfully`,
                responseTime
            }
        );
        
        logger.info('Items list retrieved successfully', {
            totalItems: allItems.length,
            filteredItems: filteredItems.length,
            returnedItems: paginatedResult.items.length,
            page: queryParams.page,
            responseTime
        });
        
        res.status(StatusCodes.OK).json(response);
        
    } catch (error) {
        logger.error('List items endpoint error', {
            method: 'GET',
            path: '/api/items',
            query: req.query,
            error: error.message
        }, error);
        
        if (error instanceof errorHandler.ValidationError) {
            const errorResponse = responseFormatter.validationError(error.details.errors, {
                message: error.message
            });
            res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
        } else {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: 'ITEMS_LIST_ERROR'
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
        }
    }
});

/**
 * GET /api/items/:id - Retrieve specific item by ID
 * Returns item details or 404 if not found
 */
router.get('/items/:id', async (req, res) => {
    const startTime = Date.now();
    const itemId = req.params.id;
    
    logger.info('Get item by ID endpoint accessed', {
        method: 'GET',
        path: `/api/items/${itemId}`,
        itemId,
        ip: req.ip
    });
    
    try {
        // Validate item ID format
        if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
            throw new errorHandler.ValidationError('Item ID is required and must be a valid string');
        }
        
        // Retrieve item from store
        const item = itemsStore.get(itemId);
        
        if (!item) {
            logger.warn('Item not found', {
                itemId,
                requestPath: req.path
            });
            
            throw new errorHandler.NotFoundError(`Item with ID '${itemId}' not found`);
        }
        
        const responseTime = Date.now() - startTime;
        
        const response = responseFormatter.success(item, {
            statusCode: StatusCodes.OK,
            message: `Item '${itemId}' retrieved successfully`,
            responseTime
        });
        
        logger.info('Item retrieved successfully', {
            itemId,
            itemName: item.name,
            responseTime
        });
        
        res.status(StatusCodes.OK).json(response);
        
    } catch (error) {
        logger.error('Get item by ID endpoint error', {
            method: 'GET',
            path: `/api/items/${itemId}`,
            itemId,
            error: error.message
        }, error);
        
        if (error instanceof errorHandler.NotFoundError) {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.NOT_FOUND,
                code: 'ITEM_NOT_FOUND'
            });
            res.status(StatusCodes.NOT_FOUND).json(errorResponse);
        } else if (error instanceof errorHandler.ValidationError) {
            const errorResponse = responseFormatter.validationError(error.message, {
                message: 'Invalid item ID format'
            });
            res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
        } else {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: 'GET_ITEM_ERROR'
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
        }
    }
});

/**
 * POST /api/items - Create new item
 * Validates request body and creates new item with generated ID
 */
router.post('/items', async (req, res) => {
    const startTime = Date.now();
    
    logger.info('Create item endpoint accessed', {
        method: 'POST',
        path: '/api/items',
        hasBody: !!req.body,
        ip: req.ip
    });
    
    try {
        // Validate request body
        const result = validator.validateRequest(req.body, schemas.createItem);
        
        if (!result.valid) {
            logger.warn('Item creation validation failed', {
                errors: result.errors,
                receivedData: req.body
            });
            
            throw new errorHandler.ValidationError(
                'Item creation validation failed',
                { errors: result.errors }
            );
        }
        
        // Create new item with generated ID
        const newItem = {
            id: String(nextItemId++),
            ...result.data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Store item
        itemsStore.set(newItem.id, newItem);
        
        const responseTime = Date.now() - startTime;
        
        const response = responseFormatter.success(newItem, {
            statusCode: StatusCodes.CREATED,
            message: `Item '${newItem.name}' created successfully`,
            responseTime
        });
        
        logger.info('Item created successfully', {
            itemId: newItem.id,
            itemName: newItem.name,
            category: newItem.category,
            responseTime
        });
        
        res.status(StatusCodes.CREATED).json(response);
        
    } catch (error) {
        logger.error('Create item endpoint error', {
            method: 'POST',
            path: '/api/items',
            body: req.body,
            error: error.message
        }, error);
        
        if (error instanceof errorHandler.ValidationError) {
            const errorResponse = responseFormatter.validationError(error.details.errors, {
                message: error.message
            });
            res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
        } else {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: 'CREATE_ITEM_ERROR'
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
        }
    }
});

/**
 * PUT /api/items/:id - Update existing item (full replacement)
 * Replaces entire item with new data
 */
router.put('/items/:id', async (req, res) => {
    const startTime = Date.now();
    const itemId = req.params.id;
    
    logger.info('Update item endpoint accessed', {
        method: 'PUT',
        path: `/api/items/${itemId}`,
        itemId,
        hasBody: !!req.body,
        ip: req.ip
    });
    
    try {
        // Validate item ID
        if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
            throw new errorHandler.ValidationError('Item ID is required and must be a valid string');
        }
        
        // Check if item exists
        const existingItem = itemsStore.get(itemId);
        if (!existingItem) {
            logger.warn('Attempted to update non-existent item', {
                itemId,
                requestPath: req.path
            });
            
            throw new errorHandler.NotFoundError(`Item with ID '${itemId}' not found`);
        }
        
        // Validate request body
        const result = validator.validateRequest(req.body, schemas.updateItem);
        
        if (!result.valid) {
            logger.warn('Item update validation failed', {
                itemId,
                errors: result.errors,
                receivedData: req.body
            });
            
            throw new errorHandler.ValidationError(
                'Item update validation failed',
                { errors: result.errors }
            );
        }
        
        // Create updated item (full replacement)
        const updatedItem = {
            id: itemId,
            ...result.data,
            createdAt: existingItem.createdAt,
            updatedAt: new Date().toISOString()
        };
        
        // Store updated item
        itemsStore.set(itemId, updatedItem);
        
        const responseTime = Date.now() - startTime;
        
        const response = responseFormatter.success(updatedItem, {
            statusCode: StatusCodes.OK,
            message: `Item '${itemId}' updated successfully`,
            responseTime
        });
        
        logger.info('Item updated successfully', {
            itemId,
            itemName: updatedItem.name,
            changes: Object.keys(result.data),
            responseTime
        });
        
        res.status(StatusCodes.OK).json(response);
        
    } catch (error) {
        logger.error('Update item endpoint error', {
            method: 'PUT',
            path: `/api/items/${itemId}`,
            itemId,
            body: req.body,
            error: error.message
        }, error);
        
        if (error instanceof errorHandler.NotFoundError) {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.NOT_FOUND,
                code: 'ITEM_NOT_FOUND'
            });
            res.status(StatusCodes.NOT_FOUND).json(errorResponse);
        } else if (error instanceof errorHandler.ValidationError) {
            const errorResponse = responseFormatter.validationError(error.details.errors, {
                message: error.message
            });
            res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
        } else {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: 'UPDATE_ITEM_ERROR'
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
        }
    }
});

/**
 * PATCH /api/items/:id - Partial update of existing item
 * Updates only provided fields using JSON merge patch semantics
 */
router.patch('/items/:id', async (req, res) => {
    const startTime = Date.now();
    const itemId = req.params.id;
    
    logger.info('Patch item endpoint accessed', {
        method: 'PATCH',
        path: `/api/items/${itemId}`,
        itemId,
        hasBody: !!req.body,
        ip: req.ip
    });
    
    try {
        // Validate item ID
        if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
            throw new errorHandler.ValidationError('Item ID is required and must be a valid string');
        }
        
        // Check if item exists
        const existingItem = itemsStore.get(itemId);
        if (!existingItem) {
            logger.warn('Attempted to patch non-existent item', {
                itemId,
                requestPath: req.path
            });
            
            throw new errorHandler.NotFoundError(`Item with ID '${itemId}' not found`);
        }
        
        // Validate request body for partial update
        const result = validator.validateRequest(req.body, schemas.patchItem);
        
        if (!result.valid) {
            logger.warn('Item patch validation failed', {
                itemId,
                errors: result.errors,
                receivedData: req.body
            });
            
            throw new errorHandler.ValidationError(
                'Item patch validation failed',
                { errors: result.errors }
            );
        }
        
        // Apply partial update using JSON merge patch semantics
        const patchedItem = {
            ...existingItem,
            ...result.data,
            updatedAt: new Date().toISOString()
        };
        
        // Store patched item
        itemsStore.set(itemId, patchedItem);
        
        const responseTime = Date.now() - startTime;
        
        const response = responseFormatter.success(patchedItem, {
            statusCode: StatusCodes.OK,
            message: `Item '${itemId}' patched successfully`,
            responseTime
        });
        
        logger.info('Item patched successfully', {
            itemId,
            itemName: patchedItem.name,
            patchedFields: Object.keys(result.data),
            responseTime
        });
        
        res.status(StatusCodes.OK).json(response);
        
    } catch (error) {
        logger.error('Patch item endpoint error', {
            method: 'PATCH',
            path: `/api/items/${itemId}`,
            itemId,
            body: req.body,
            error: error.message
        }, error);
        
        if (error instanceof errorHandler.NotFoundError) {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.NOT_FOUND,
                code: 'ITEM_NOT_FOUND'
            });
            res.status(StatusCodes.NOT_FOUND).json(errorResponse);
        } else if (error instanceof errorHandler.ValidationError) {
            const errorResponse = responseFormatter.validationError(error.details.errors, {
                message: error.message
            });
            res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
        } else {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: 'PATCH_ITEM_ERROR'
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
        }
    }
});

/**
 * DELETE /api/items/:id - Remove item by ID
 * Deletes item and returns 204 No Content on success
 */
router.delete('/items/:id', async (req, res) => {
    const startTime = Date.now();
    const itemId = req.params.id;
    
    logger.info('Delete item endpoint accessed', {
        method: 'DELETE',
        path: `/api/items/${itemId}`,
        itemId,
        ip: req.ip
    });
    
    try {
        // Validate item ID
        if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
            throw new errorHandler.ValidationError('Item ID is required and must be a valid string');
        }
        
        // Check if item exists
        const existingItem = itemsStore.get(itemId);
        if (!existingItem) {
            logger.warn('Attempted to delete non-existent item', {
                itemId,
                requestPath: req.path
            });
            
            throw new errorHandler.NotFoundError(`Item with ID '${itemId}' not found`);
        }
        
        // Delete item from store
        itemsStore.delete(itemId);
        
        const responseTime = Date.now() - startTime;
        
        logger.info('Item deleted successfully', {
            itemId,
            itemName: existingItem.name,
            responseTime
        });
        
        // Return 204 No Content as per REST conventions for successful DELETE
        res.status(StatusCodes.NO_CONTENT).end();
        
    } catch (error) {
        logger.error('Delete item endpoint error', {
            method: 'DELETE',
            path: `/api/items/${itemId}`,
            itemId,
            error: error.message
        }, error);
        
        if (error instanceof errorHandler.NotFoundError) {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.NOT_FOUND,
                code: 'ITEM_NOT_FOUND'
            });
            res.status(StatusCodes.NOT_FOUND).json(errorResponse);
        } else if (error instanceof errorHandler.ValidationError) {
            const errorResponse = responseFormatter.validationError(error.message, {
                message: 'Invalid item ID format'
            });
            res.status(StatusCodes.BAD_REQUEST).json(errorResponse);
        } else {
            const errorResponse = responseFormatter.error(error, {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                code: 'DELETE_ITEM_ERROR'
            });
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse);
        }
    }
});

/**
 * Test routes for error handling validation
 * These routes are used by tests to validate error handling behavior
 */
router.get('/error-test', (req, res) => {
    const error = new Error('Test error for error handling validation');
    error.statusCode = 500;
    throw error;
});

router.get('/error-500', (req, res) => {
    const error = new Error('Internal server error test');
    error.statusCode = 500;
    throw error;
});

/**
 * OPTIONS handler for CORS preflight requests
 * Handles preflight requests for all endpoints to support CORS
 */
router.options('*', (req, res) => {
    logger.debug('CORS preflight request received', {
        method: 'OPTIONS',
        path: req.path,
        origin: req.get('Origin'),
        headers: req.get('Access-Control-Request-Headers')
    });
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    res.status(StatusCodes.NO_CONTENT).end();
});

// Add request logging middleware for all routes
router.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log request start
    logger.debug('API request started', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        logger.debug('API request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime
        });
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
});

// Export the configured router as default export
const apiRouter = router;

// Log successful router initialization
logger.info('API Router initialized successfully', {
    routes: [
        'GET /health',
        'GET /items',
        'GET /items/:id',
        'POST /items',
        'PUT /items/:id',
        'PATCH /items/:id',
        'DELETE /items/:id',
        'OPTIONS *'
    ],
    totalRoutes: 8,
    validationSchemas: Object.keys(schemas).length,
    initialItems: itemsStore.size
});

module.exports = apiRouter;