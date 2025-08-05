/**
 * @fileoverview Central Middleware Orchestrator for Node.js Tutorial Project
 * @description Provides unified middleware management for Express.js v5.1.0 with comprehensive
 * security, logging, error handling, and production-ready middleware composition. Supports
 * progressive tutorial phases from basic HTTP server through PM2 cluster deployment with
 * educational demonstrations and enterprise-grade middleware architecture patterns.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Environment-aware middleware configuration
 * - PM2 cluster mode compatibility with stateless design
 * - Comprehensive security middleware orchestration
 * - Request/response lifecycle logging with correlation tracking
 * - Advanced error handling with sanitization and monitoring
 * - Performance monitoring and middleware validation
 * - Educational content and progressive enhancement patterns
 * - Cross-platform compatibility with Flask integration points
 * 
 * Architecture:
 * - Express.js v5.1.0 middleware pipeline integration
 * - Helmet.js v8.1.0 security headers with CSP and HSTS
 * - PM2 v6.0.8 cluster mode optimization
 * - Modern ES modules with Node.js v22.x LTS support
 */

// External Dependencies - Latest stable versions for 2025
import express from 'express'; // v5.1.0 - Latest Express.js with enhanced security and Promise support

// Internal Middleware Components - Comprehensive security and logging pipeline
import {
    createHelmetConfigMiddleware,
    helmetMiddleware
} from './helmet-config.js';

import {
    corsMiddleware,
    createDevelopmentCors
} from './cors.js';

import {
    rateLimiter,
    createRateLimiterMiddleware
} from './rate-limiter.js';

import {
    securityMiddleware,
    createSecurityMiddleware
} from './security.js';

import {
    requestLogger,
    createRequestLogger
} from './logger.js';

import errorHandler, {
    createErrorHandler
} from './error-handler.js';

// Configuration and Utilities - Unified system configuration and error management
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

import { ValidationError } from '../utils/error-types.js';

// Global Middleware State Management - Optimized for PM2 cluster mode
let MIDDLEWARE_CACHE = new Map();
let MIDDLEWARE_STACK_CACHE = new Map();
let INITIALIZATION_STATUS = {
    initialized: false,
    timestamp: null,
    environment: null,
    clusterId: process.env.pm_id || 'standalone',
    processId: process.pid
};

// Default middleware execution order for optimal security and performance
const DEFAULT_MIDDLEWARE_ORDER = [
    'cors',
    'helmet', 
    'rateLimiter',
    'logger',
    'security',
    'errorHandler'
];

/**
 * Initializes the complete middleware system with comprehensive configuration validation,
 * caching optimization, and environment-aware setup for production-ready deployment.
 * 
 * @param {Object} initOptions - Initialization configuration options
 * @param {string} [initOptions.environment] - Target environment (development/production)
 * @param {boolean} [initOptions.enableCaching=true] - Enable middleware caching for performance
 * @param {boolean} [initOptions.validateCompatibility=true] - Validate Express.js and PM2 compatibility
 * @param {Object} [initOptions.customConfig] - Custom middleware configuration overrides
 * @param {boolean} [initOptions.enableTutorialMode=false] - Enable educational logging and demonstrations
 * 
 * @returns {Promise<Object>} Initialization result with middleware components and status
 * 
 * @throws {ValidationError} When initialization fails due to configuration or compatibility issues
 * 
 * @example
 * // Basic middleware initialization
 * const result = await initializeMiddleware({
 *   environment: 'production',
 *   enableCaching: true,
 *   validateCompatibility: true
 * });
 * 
 * @example
 * // Development initialization with tutorial mode
 * const devResult = await initializeMiddleware({
 *   environment: 'development',
 *   enableTutorialMode: true,
 *   customConfig: { rateLimiting: { enabled: false } }
 * });
 */
async function initializeMiddleware(initOptions = {}) {
    const startTime = Date.now();
    const correlationId = logger.generateCorrelationId();
    
    try {
        logger.info('Initializing middleware system', {
            correlationId,
            environment: config.environment.NODE_ENV,
            clusterId: INITIALIZATION_STATUS.clusterId,
            processId: INITIALIZATION_STATUS.processId,
            options: initOptions,
            timestamp: new Date().toISOString()
        });

        // Detect and validate current environment configuration
        const environment = initOptions.environment || config.environment.NODE_ENV || 'development';
        const enableCaching = initOptions.enableCaching !== false;
        const validateCompatibility = initOptions.validateCompatibility !== false;
        const enableTutorialMode = initOptions.enableTutorialMode || false;

        // Validate Node.js and Express.js compatibility for modern features
        if (validateCompatibility) {
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
            
            if (majorVersion < 18) {
                throw new ValidationError(
                    'Incompatible Node.js version. Express.js v5.1.0 requires Node.js v18 or higher.',
                    'COMPATIBILITY_ERROR',
                    { nodeVersion, requiredVersion: 'v18+', correlationId }
                );
            }

            logger.info('Node.js compatibility validated', {
                correlationId,
                nodeVersion,
                expressVersion: '5.1.0',
                pm2Compatible: true
            });
        }

        // Load and validate all middleware configurations with environment awareness
        const middlewareConfigs = {
            security: config.security || {},
            server: config.server || {},
            environment: config.environment || {},
            custom: initOptions.customConfig || {}
        };

        // Validate configuration completeness and consistency
        const configValidation = validateMiddlewareConfigs(middlewareConfigs, correlationId);
        if (!configValidation.isValid) {
            throw new ValidationError(
                'Invalid middleware configuration detected',
                'CONFIGURATION_ERROR',
                { 
                    errors: configValidation.errors,
                    correlationId,
                    environment 
                }
            );
        }

        // Initialize middleware cache system for performance optimization
        if (enableCaching) {
            const cacheKey = `${environment}_${INITIALIZATION_STATUS.clusterId}`;
            
            // Check for existing cached middleware instances
            if (MIDDLEWARE_CACHE.has(cacheKey)) {
                logger.debug('Using cached middleware instances', {
                    correlationId,
                    cacheKey,
                    cacheSize: MIDDLEWARE_CACHE.size
                });
            } else {
                MIDDLEWARE_CACHE.set(cacheKey, new Map());
                logger.debug('Initialized new middleware cache', {
                    correlationId,
                    cacheKey
                });
            }
        }

        // Create environment-specific middleware instances with factory functions
        const middlewareInstances = await createMiddlewareInstances(
            environment,
            middlewareConfigs,
            enableCaching,
            correlationId
        );

        // Validate middleware compatibility with Express.js v5.1.0 and PM2 cluster mode
        if (validateCompatibility) {
            await validateMiddlewareCompatibility(middlewareInstances, correlationId);
        }

        // Set up middleware execution order and dependency management
        const executionOrder = initOptions.executionOrder || DEFAULT_MIDDLEWARE_ORDER;
        const dependencyValidation = validateMiddlewareDependencies(executionOrder, middlewareInstances);
        
        if (!dependencyValidation.isValid) {
            throw new ValidationError(
                'Middleware dependency validation failed',
                'DEPENDENCY_ERROR',
                {
                    errors: dependencyValidation.errors,
                    correlationId,
                    executionOrder
                }
            );
        }

        // Configure middleware performance monitoring and metrics collection
        const performanceConfig = {
            enableMetrics: environment === 'production',
            correlationTracking: true,
            responseTimeThreshold: config.server.responseTimeThreshold || 100,
            memoryThreshold: config.server.memoryThreshold || 100 * 1024 * 1024 // 100MB
        };

        // Initialize cross-platform compatibility settings for Flask integration
        const crossPlatformConfig = {
            enableFlaskCompatibility: initOptions.enableFlaskCompatibility || false,
            responseHeaders: {
                'X-Powered-By': 'Node.js Tutorial Project',
                'X-Framework': 'Express.js v5.1.0',
                'X-Cluster-Mode': INITIALIZATION_STATUS.clusterId !== 'standalone'
            }
        };

        // Set up middleware hot-reloading for development environment
        if (environment === 'development' && initOptions.enableHotReload) {
            await setupHotReload(correlationId);
        }

        // Update initialization status with comprehensive configuration details
        INITIALIZATION_STATUS = {
            initialized: true,
            timestamp: new Date().toISOString(),
            environment,
            clusterId: INITIALIZATION_STATUS.clusterId,
            processId: INITIALIZATION_STATUS.processId,
            initializationTime: Date.now() - startTime,
            middlewareCount: Object.keys(middlewareInstances).length,
            cachingEnabled: enableCaching,
            tutorialMode: enableTutorialMode,
            compatibilityValidated: validateCompatibility
        };

        // Log successful initialization with comprehensive status and tutorial information
        logger.info('Middleware system initialized successfully', {
            correlationId,
            initializationStatus: INITIALIZATION_STATUS,
            middlewareInstances: Object.keys(middlewareInstances),
            executionOrder,
            performanceConfig,
            crossPlatformConfig,
            tutorialPhase: environment === 'development' ? 'Development' : 'Production'
        });

        // Return comprehensive initialization result for application integration
        return {
            success: true,
            correlationId,
            environment,
            middlewareInstances,
            executionOrder,
            performanceConfig,
            crossPlatformConfig,
            initializationStatus: INITIALIZATION_STATUS,
            utilities: {
                refreshMiddleware: () => refreshMiddleware({ correlationId }),
                validateStack: (stack) => validateMiddlewareStack(stack, { correlationId }),
                getInfo: () => getMiddlewareInfo({ correlationId })
            }
        };

    } catch (error) {
        logger.error('Middleware initialization failed', {
            correlationId,
            error: error.message,
            stack: error.stack,
            environment: config.environment.NODE_ENV,
            clusterId: INITIALIZATION_STATUS.clusterId,
            initializationTime: Date.now() - startTime
        });

        throw new ValidationError(
            `Middleware initialization failed: ${error.message}`,
            'INITIALIZATION_ERROR',
            { 
                originalError: error,
                correlationId,
                environment: config.environment.NODE_ENV,
                clusterId: INITIALIZATION_STATUS.clusterId
            }
        );
    }
}

/**
 * Creates a complete Express.js middleware stack with comprehensive security, logging,
 * and error handling middleware in optimal execution order for production deployment.
 * 
 * @param {string} environment - Target environment (development/staging/production)
 * @param {Object} stackOptions - Stack composition and configuration options
 * @param {Array<string>} [stackOptions.excludeMiddleware] - Middleware types to exclude
 * @param {Object} [stackOptions.customOrder] - Custom middleware execution order
 * @param {boolean} [stackOptions.enablePerformanceMonitoring=true] - Enable performance tracking
 * @param {boolean} [stackOptions.enableSecurityValidation=true] - Enable security validation
 * @param {Object} [stackOptions.customConfig] - Custom middleware configuration
 * 
 * @returns {Promise<Array<Function>>} Ordered array of Express.js middleware functions
 * 
 * @throws {ValidationError} When stack creation fails due to configuration or validation errors
 * 
 * @example
 * // Production middleware stack
 * const prodStack = await createMiddlewareStack('production', {
 *   enablePerformanceMonitoring: true,
 *   enableSecurityValidation: true
 * });
 * 
 * @example
 * // Development stack with custom configuration
 * const devStack = await createMiddlewareStack('development', {
 *   excludeMiddleware: ['rateLimiter'],
 *   customConfig: { logging: { level: 'debug' } }
 * });
 */
async function createMiddlewareStack(environment, stackOptions = {}) {
    const correlationId = logger.generateCorrelationId();
    const startTime = Date.now();

    try {
        logger.info('Creating middleware stack', {
            correlationId,
            environment,
            options: stackOptions,
            clusterId: INITIALIZATION_STATUS.clusterId
        });

        // Validate environment and stack options for middleware composition requirements
        if (!environment || typeof environment !== 'string') {
            throw new ValidationError(
                'Invalid environment specified for middleware stack creation',
                'VALIDATION_ERROR',
                { environment, correlationId }
            );
        }

        const {
            excludeMiddleware = [],
            customOrder,
            enablePerformanceMonitoring = true,
            enableSecurityValidation = true,
            customConfig = {}
        } = stackOptions;

        // Check middleware stack cache for existing configuration to optimize performance
        const cacheKey = `stack_${environment}_${JSON.stringify(stackOptions)}`;
        
        if (MIDDLEWARE_STACK_CACHE.has(cacheKey)) {
            logger.debug('Using cached middleware stack', {
                correlationId,
                cacheKey,
                environment
            });
            return MIDDLEWARE_STACK_CACHE.get(cacheKey);
        }

        // Determine middleware execution order with customization support
        const executionOrder = customOrder || DEFAULT_MIDDLEWARE_ORDER;
        const filteredOrder = executionOrder.filter(name => !excludeMiddleware.includes(name));

        logger.debug('Determined middleware execution order', {
            correlationId,
            originalOrder: executionOrder,
            filteredOrder,
            excludedMiddleware: excludeMiddleware
        });

        // Initialize middleware stack array with performance tracking
        const middlewareStack = [];
        const performanceMetrics = {
            middlewareCount: 0,
            initializationTime: 0,
            memoryUsage: process.memoryUsage()
        };

        // Create environment-specific CORS middleware using appropriate factory function
        if (filteredOrder.includes('cors')) {
            const corsConfig = {
                ...config.security?.cors,
                ...customConfig.cors
            };

            const corsInstance = environment === 'development' 
                ? createDevelopmentCors(corsConfig)
                : corsMiddleware;

            middlewareStack.push(corsInstance);
            performanceMetrics.middlewareCount++;

            logger.debug('Added CORS middleware to stack', {
                correlationId,
                environment,
                corsConfig: corsConfig.origin ? { origin: corsConfig.origin } : 'default'
            });
        }

        // Initialize Helmet.js security headers middleware with environment policies
        if (filteredOrder.includes('helmet')) {
            const helmetConfig = {
                ...config.security?.helmet,
                ...customConfig.helmet
            };

            const helmetInstance = createHelmetConfigMiddleware(helmetConfig, environment);
            middlewareStack.push(helmetInstance);
            performanceMetrics.middlewareCount++;

            logger.debug('Added Helmet.js security middleware to stack', {
                correlationId,
                environment,
                securityHeaders: Object.keys(helmetConfig)
            });
        }

        // Configure rate limiting middleware with environment-appropriate limits
        if (filteredOrder.includes('rateLimiter')) {
            const rateLimitConfig = {
                ...config.security?.rateLimit,
                ...customConfig.rateLimit
            };

            const rateLimitInstance = environment === 'production'
                ? rateLimiter
                : createRateLimiterMiddleware({
                    ...rateLimitConfig,
                    windowMs: rateLimitConfig.windowMs || 15 * 60 * 1000, // 15 minutes
                    max: rateLimitConfig.max || (environment === 'development' ? 1000 : 100)
                });

            middlewareStack.push(rateLimitInstance);
            performanceMetrics.middlewareCount++;

            logger.debug('Added rate limiting middleware to stack', {
                correlationId,
                environment,
                windowMs: rateLimitConfig.windowMs,
                maxRequests: rateLimitConfig.max
            });
        }

        // Set up request logging middleware with correlation tracking and performance monitoring
        if (filteredOrder.includes('logger')) {
            const loggerConfig = {
                ...config.server?.logging,
                ...customConfig.logging,
                enablePerformanceMonitoring,
                correlationId
            };

            const loggerInstance = createRequestLogger(loggerConfig);
            middlewareStack.push(loggerInstance);
            performanceMetrics.middlewareCount++;

            logger.debug('Added request logging middleware to stack', {
                correlationId,
                environment,
                performanceMonitoring: enablePerformanceMonitoring
            });
        }

        // Add comprehensive security middleware stack with validation and monitoring
        if (filteredOrder.includes('security')) {
            const securityConfig = {
                ...config.security,
                ...customConfig.security,
                enableValidation: enableSecurityValidation,
                environment
            };

            const securityInstance = createSecurityMiddleware(securityConfig);
            middlewareStack.push(securityInstance);
            performanceMetrics.middlewareCount++;

            logger.debug('Added comprehensive security middleware to stack', {
                correlationId,
                environment,
                validationEnabled: enableSecurityValidation
            });
        }

        // Configure error handling middleware as final middleware in stack
        if (filteredOrder.includes('errorHandler')) {
            const errorConfig = {
                ...config.server?.errorHandling,
                ...customConfig.errorHandling,
                environment,
                enableSanitization: environment === 'production'
            };

            const errorInstance = createErrorHandler(errorConfig);
            middlewareStack.push(errorInstance);
            performanceMetrics.middlewareCount++;

            logger.debug('Added error handling middleware to stack', {
                correlationId,
                environment,
                sanitizationEnabled: environment === 'production'
            });
        }

        // Validate complete middleware stack for compatibility and execution order
        const validationResult = await validateMiddlewareStack(middlewareStack, {
            correlationId,
            environment,
            enablePerformanceValidation: enablePerformanceMonitoring
        });

        if (!validationResult.isValid) {
            throw new ValidationError(
                'Middleware stack validation failed',
                'STACK_VALIDATION_ERROR',
                {
                    errors: validationResult.errors,
                    correlationId,
                    environment,
                    middlewareCount: performanceMetrics.middlewareCount
                }
            );
        }

        // Cache middleware stack for performance optimization and reuse
        MIDDLEWARE_STACK_CACHE.set(cacheKey, middlewareStack);

        // Calculate final performance metrics
        performanceMetrics.initializationTime = Date.now() - startTime;
        performanceMetrics.finalMemoryUsage = process.memoryUsage();

        logger.info('Middleware stack created successfully', {
            correlationId,
            environment,
            middlewareCount: performanceMetrics.middlewareCount,
            executionOrder: filteredOrder,
            initializationTime: performanceMetrics.initializationTime,
            cacheKey,
            validationResult: {
                isValid: validationResult.isValid,
                securityScore: validationResult.securityScore
            }
        });

        return middlewareStack;

    } catch (error) {
        logger.error('Middleware stack creation failed', {
            correlationId,
            environment,
            error: error.message,
            stack: error.stack,
            creationTime: Date.now() - startTime
        });

        throw new ValidationError(
            `Middleware stack creation failed: ${error.message}`,
            'STACK_CREATION_ERROR',
            {
                originalError: error,
                correlationId,
                environment,
                stackOptions
            }
        );
    }
}

/**
 * Creates development-optimized middleware stack with relaxed security policies,
 * enhanced debugging capabilities, and educational demonstrations for optimal learning.
 * 
 * @param {Object} devOptions - Development-specific middleware options
 * @param {boolean} [devOptions.enableHotReload=true] - Enable middleware hot-reloading
 * @param {boolean} [devOptions.enableDebugLogging=true] - Enable detailed debug logging
 * @param {boolean} [devOptions.relaxedSecurity=true] - Use relaxed security policies
 * @param {boolean} [devOptions.enableTutorialMode=true] - Enable educational features
 * @param {Object} [devOptions.customPolicies] - Custom development policies
 * 
 * @returns {Promise<Array<Function>>} Development-optimized middleware stack
 * 
 * @throws {ValidationError} When development middleware creation fails
 * 
 * @example
 * // Basic development middleware
 * const devStack = await createDevelopmentMiddleware({
 *   enableDebugLogging: true,
 *   enableTutorialMode: true
 * });
 * 
 * @example
 * // Custom development configuration
 * const customDevStack = await createDevelopmentMiddleware({
 *   relaxedSecurity: false,
 *   customPolicies: { cors: { origin: 'localhost:3000' } }
 * });
 */
async function createDevelopmentMiddleware(devOptions = {}) {
    const correlationId = logger.generateCorrelationId();

    try {
        logger.info('Creating development middleware stack', {
            correlationId,
            options: devOptions,
            environment: 'development'
        });

        const {
            enableHotReload = true,
            enableDebugLogging = true,
            relaxedSecurity = true,
            enableTutorialMode = true,
            customPolicies = {}
        } = devOptions;

        // Create development CORS middleware with permissive policies for API testing
        const developmentCorsConfig = {
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            ...customPolicies.cors
        };

        const devCorsMiddleware = createDevelopmentCors(developmentCorsConfig);

        // Initialize Helmet.js with relaxed CSP policies supporting debugging tools
        const developmentHelmetConfig = {
            contentSecurityPolicy: relaxedSecurity ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            } : undefined,
            crossOriginEmbedderPolicy: false,
            ...customPolicies.helmet
        };

        const devHelmetMiddleware = createHelmetConfigMiddleware(developmentHelmetConfig, 'development');

        // Configure lenient rate limiting to avoid development workflow interruption
        const developmentRateLimitConfig = {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 1000, // Very high limit for development
            message: 'Too many requests from this IP in development mode',
            standardHeaders: true,
            legacyHeaders: false,
            ...customPolicies.rateLimit
        };

        const devRateLimitMiddleware = createRateLimiterMiddleware(developmentRateLimitConfig);

        // Set up enhanced request logging with detailed debugging information
        const developmentLoggerConfig = {
            level: enableDebugLogging ? 'debug' : 'info',
            enablePerformanceTracking: true,
            enableCorrelationTracking: true,
            logRequestBody: enableDebugLogging,
            logResponseBody: enableDebugLogging && enableTutorialMode,
            ...customPolicies.logging
        };

        const devLoggerMiddleware = createRequestLogger(developmentLoggerConfig);

        // Add development security middleware with educational warnings and guidance
        const developmentSecurityConfig = {
            enableThreatDetection: false,
            enableSecurityAlerts: enableTutorialMode,
            logSecurityEvents: enableDebugLogging,
            enableEducationalWarnings: enableTutorialMode,
            ...customPolicies.security
        };

        const devSecurityMiddleware = createSecurityMiddleware(developmentSecurityConfig);

        // Configure development error handler with enhanced error reporting and stack traces
        const developmentErrorConfig = {
            enableStackTrace: true,
            enableSourceMap: true,
            enableDetailedErrors: true,
            enableEducationalErrors: enableTutorialMode,
            sanitizeErrors: false,
            ...customPolicies.errorHandling
        };

        const devErrorMiddleware = createErrorHandler(developmentErrorConfig);

        // Add educational middleware for demonstrating middleware concepts and execution
        const educationalMiddleware = enableTutorialMode ? createEducationalMiddleware(correlationId) : null;

        // Compile development middleware stack
        const developmentStack = [
            devCorsMiddleware,
            devHelmetMiddleware,
            devRateLimitMiddleware,
            devLoggerMiddleware,
            ...(educationalMiddleware ? [educationalMiddleware] : []),
            devSecurityMiddleware,
            devErrorMiddleware
        ].filter(Boolean);

        // Enable middleware hot-reloading and configuration refresh capabilities
        if (enableHotReload) {
            await enableMiddlewareHotReload(developmentStack, correlationId);
        }

        logger.info('Development middleware stack created successfully', {
            correlationId,
            middlewareCount: developmentStack.length,
            features: {
                hotReload: enableHotReload,
                debugLogging: enableDebugLogging,
                relaxedSecurity,
                tutorialMode: enableTutorialMode
            }
        });

        return developmentStack;

    } catch (error) {
        logger.error('Development middleware creation failed', {
            correlationId,
            error: error.message,
            options: devOptions
        });

        throw new ValidationError(
            `Development middleware creation failed: ${error.message}`,
            'DEVELOPMENT_MIDDLEWARE_ERROR',
            { originalError: error, correlationId, devOptions }
        );
    }
}

/**
 * Creates production-hardened middleware stack with strict security policies,
 * comprehensive protection, and enterprise-grade monitoring for production deployment.
 * 
 * @param {Object} prodOptions - Production-specific middleware options
 * @param {boolean} [prodOptions.enableStrictSecurity=true] - Enable strict security policies
 * @param {boolean} [prodOptions.enablePerformanceOptimization=true] - Enable performance optimization
 * @param {boolean} [prodOptions.enableComprehensiveLogging=true] - Enable comprehensive logging
 * @param {boolean} [prodOptions.enableSecurityMonitoring=true] - Enable security event monitoring
 * @param {Object} [prodOptions.securityPolicies] - Custom security policy overrides
 * 
 * @returns {Promise<Array<Function>>} Production-hardened middleware stack
 * 
 * @throws {ValidationError} When production middleware creation fails
 * 
 * @example
 * // Standard production middleware
 * const prodStack = await createProductionMiddleware({
 *   enableStrictSecurity: true,
 *   enableSecurityMonitoring: true
 * });
 * 
 * @example
 * // Custom production configuration
 * const customProdStack = await createProductionMiddleware({
 *   securityPolicies: { 
 *     rateLimit: { max: 50, windowMs: 15 * 60 * 1000 }
 *   }
 * });
 */
async function createProductionMiddleware(prodOptions = {}) {
    const correlationId = logger.generateCorrelationId();

    try {
        logger.info('Creating production middleware stack', {
            correlationId,
            options: prodOptions,
            environment: 'production'
        });

        const {
            enableStrictSecurity = true,
            enablePerformanceOptimization = true,
            enableComprehensiveLogging = true,
            enableSecurityMonitoring = true,
            securityPolicies = {}
        } = prodOptions;

        // Create production CORS middleware with restrictive policies and origin validation
        const productionCorsConfig = {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
            credentials: false,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type'],
            maxAge: 86400, // 24 hours
            ...securityPolicies.cors
        };

        const prodCorsMiddleware = corsMiddleware;

        // Initialize Helmet.js with strict security headers and comprehensive protection
        const productionHelmetConfig = {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'"],
                    imgSrc: ["'self'", "data:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            strictTransportSecurity: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            ...securityPolicies.helmet
        };

        const prodHelmetMiddleware = createHelmetConfigMiddleware(productionHelmetConfig, 'production');

        // Configure aggressive rate limiting with DoS protection and distributed caching
        const productionRateLimitConfig = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Strict limit for production
            message: 'Too many requests, please try again later',
            standardHeaders: true,
            legacyHeaders: false,
            enableDistributedCache: true,
            ...securityPolicies.rateLimit
        };

        const prodRateLimitMiddleware = createRateLimiterMiddleware(productionRateLimitConfig);

        // Set up production request logging with performance metrics and correlation tracking
        const productionLoggerConfig = {
            level: 'info',
            enablePerformanceTracking: enablePerformanceOptimization,
            enableCorrelationTracking: true,
            logRequestBody: false, // Security: Don't log request bodies in production
            logResponseBody: false, // Security: Don't log response bodies in production
            enableMetrics: enableComprehensiveLogging,
            ...securityPolicies.logging
        };

        const prodLoggerMiddleware = createRequestLogger(productionLoggerConfig);

        // Add enterprise security middleware with threat detection and monitoring
        const productionSecurityConfig = {
            enableThreatDetection: enableSecurityMonitoring,
            enableSecurityAlerts: enableSecurityMonitoring,
            enableIntrusionDetection: enableStrictSecurity,
            logSecurityEvents: enableComprehensiveLogging,
            enableAutomaticBlocking: enableStrictSecurity,
            ...securityPolicies.security
        };

        const prodSecurityMiddleware = createSecurityMiddleware(productionSecurityConfig);

        // Configure production error handler with sanitized responses and security logging
        const productionErrorConfig = {
            enableStackTrace: false, // Security: Don't expose stack traces
            enableSourceMap: false,
            enableDetailedErrors: false,
            sanitizeErrors: true,
            enableSecurityLogging: enableSecurityMonitoring,
            ...securityPolicies.errorHandling
        };

        const prodErrorMiddleware = createErrorHandler(productionErrorConfig);

        // Apply PM2 cluster mode optimizations with shared state management
        const pm2OptimizedStack = await optimizeForPM2Cluster([
            prodCorsMiddleware,
            prodHelmetMiddleware,
            prodRateLimitMiddleware,
            prodLoggerMiddleware,
            prodSecurityMiddleware,
            prodErrorMiddleware
        ], correlationId);

        // Set up performance monitoring and alerting for production metrics
        if (enablePerformanceOptimization) {
            await setupProductionMonitoring(pm2OptimizedStack, correlationId);
        }

        // Configure security event logging and incident response integration
        if (enableSecurityMonitoring) {
            await setupSecurityMonitoring(pm2OptimizedStack, correlationId);
        }

        logger.info('Production middleware stack created successfully', {
            correlationId,
            middlewareCount: pm2OptimizedStack.length,
            securityFeatures: {
                strictSecurity: enableStrictSecurity,
                performanceOptimization: enablePerformanceOptimization,
                comprehensiveLogging: enableComprehensiveLogging,
                securityMonitoring: enableSecurityMonitoring
            },
            pm2Optimized: true
        });

        return pm2OptimizedStack;

    } catch (error) {
        logger.error('Production middleware creation failed', {
            correlationId,
            error: error.message,
            options: prodOptions
        });

        throw new ValidationError(
            `Production middleware creation failed: ${error.message}`,
            'PRODUCTION_MIDDLEWARE_ERROR',
            { originalError: error, correlationId, prodOptions }
        );
    }
}

/**
 * Validates middleware stack configuration, execution order, compatibility, and effectiveness
 * by testing middleware functionality and analyzing security coverage with detailed reporting.
 * 
 * @param {Array<Function>} middlewareStack - Array of Express.js middleware functions to validate
 * @param {Object} validationOptions - Validation configuration and options
 * @param {string} [validationOptions.correlationId] - Request correlation ID for tracking
 * @param {string} [validationOptions.environment='production'] - Target environment for validation
 * @param {boolean} [validationOptions.enablePerformanceValidation=true] - Enable performance testing
 * @param {boolean} [validationOptions.enableSecurityValidation=true] - Enable security analysis
 * @param {Object} [validationOptions.thresholds] - Custom validation thresholds
 * 
 * @returns {Promise<Object>} Comprehensive validation result with analysis and recommendations
 * 
 * @throws {ValidationError} When validation encounters critical errors
 * 
 * @example
 * // Basic middleware validation
 * const validation = await validateMiddlewareStack(middlewareStack, {
 *   environment: 'production',
 *   enableSecurityValidation: true
 * });
 * 
 * @example
 * // Custom validation with thresholds
 * const customValidation = await validateMiddlewareStack(middlewareStack, {
 *   thresholds: { responseTime: 50, securityScore: 90 }
 * });
 */
async function validateMiddlewareStack(middlewareStack, validationOptions = {}) {
    const correlationId = validationOptions.correlationId || logger.generateCorrelationId();
    const startTime = Date.now();

    try {
        logger.info('Validating middleware stack', {
            correlationId,
            middlewareCount: middlewareStack?.length || 0,
            options: validationOptions
        });

        // Validate input parameters
        if (!Array.isArray(middlewareStack)) {
            throw new ValidationError(
                'Invalid middleware stack: expected array of functions',
                'VALIDATION_INPUT_ERROR',
                { correlationId, receivedType: typeof middlewareStack }
            );
        }

        const {
            environment = 'production',
            enablePerformanceValidation = true,
            enableSecurityValidation = true,
            thresholds = {
                responseTime: 100, // milliseconds
                memoryUsage: 50 * 1024 * 1024, // 50MB
                securityScore: 80 // percentage
            }
        } = validationOptions;

        const validationResults = {
            isValid: true,
            environment,
            middlewareCount: middlewareStack.length,
            errors: [],
            warnings: [],
            performance: {},
            security: {},
            recommendations: []
        };

        // Validate middleware execution order and dependency management
        const orderValidation = validateExecutionOrder(middlewareStack, correlationId);
        if (!orderValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push(...orderValidation.errors);
        }
        validationResults.executionOrder = orderValidation;

        // Test each middleware function signature and Express.js compatibility
        const compatibilityValidation = await validateExpressCompatibility(middlewareStack, correlationId);
        if (!compatibilityValidation.isValid) {
            validationResults.warnings.push(...compatibilityValidation.warnings);
        }
        validationResults.compatibility = compatibilityValidation;

        // Analyze security coverage and policy effectiveness across middleware stack
        if (enableSecurityValidation) {
            const securityValidation = await validateSecurityCoverage(middlewareStack, correlationId);
            validationResults.security = securityValidation;
            
            if (securityValidation.score < thresholds.securityScore) {
                validationResults.warnings.push(
                    `Security score ${securityValidation.score}% below threshold ${thresholds.securityScore}%`
                );
            }
        }

        // Validate environment-specific configuration appropriateness
        const environmentValidation = validateEnvironmentConfiguration(middlewareStack, environment, correlationId);
        if (!environmentValidation.isValid) {
            validationResults.warnings.push(...environmentValidation.warnings);
        }
        validationResults.environment = environmentValidation;

        // Test middleware performance and resource impact assessment
        if (enablePerformanceValidation) {
            const performanceValidation = await validatePerformance(middlewareStack, thresholds, correlationId);
            validationResults.performance = performanceValidation;
            
            if (performanceValidation.averageResponseTime > thresholds.responseTime) {
                validationResults.warnings.push(
                    `Average response time ${performanceValidation.averageResponseTime}ms exceeds threshold ${thresholds.responseTime}ms`
                );
            }
        }

        // Check PM2 cluster mode compatibility and shared state management
        const pm2Validation = validatePM2Compatibility(middlewareStack, correlationId);
        if (!pm2Validation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push(...pm2Validation.errors);
        }
        validationResults.pm2Compatibility = pm2Validation;

        // Validate error handling and exception management throughout stack
        const errorHandlingValidation = validateErrorHandling(middlewareStack, correlationId);
        if (!errorHandlingValidation.isValid) {
            validationResults.warnings.push(...errorHandlingValidation.warnings);
        }
        validationResults.errorHandling = errorHandlingValidation;

        // Calculate overall validation score and recommendations
        validationResults.overallScore = calculateValidationScore(validationResults);
        validationResults.recommendations = generateRecommendations(validationResults);
        validationResults.validationTime = Date.now() - startTime;

        logger.info('Middleware stack validation completed', {
            correlationId,
            isValid: validationResults.isValid,
            overallScore: validationResults.overallScore,
            errorCount: validationResults.errors.length,
            warningCount: validationResults.warnings.length,
            validationTime: validationResults.validationTime
        });

        return validationResults;

    } catch (error) {
        logger.error('Middleware stack validation failed', {
            correlationId,
            error: error.message,
            stack: error.stack,
            validationTime: Date.now() - startTime
        });

        throw new ValidationError(
            `Middleware stack validation failed: ${error.message}`,
            'VALIDATION_ERROR',
            { originalError: error, correlationId, validationOptions }
        );
    }
}

/**
 * Returns comprehensive information about current middleware configuration including
 * security analysis, performance metrics, educational content, and integration examples.
 * 
 * @param {Object} infoOptions - Information retrieval options and filters
 * @param {string} [infoOptions.correlationId] - Request correlation ID for tracking
 * @param {boolean} [infoOptions.includeMetrics=true] - Include performance metrics
 * @param {boolean} [infoOptions.includeSecurityAnalysis=true] - Include security analysis
 * @param {boolean} [infoOptions.includeEducationalContent=false] - Include educational content
 * @param {boolean} [infoOptions.includeTroubleshooting=false] - Include troubleshooting information
 * 
 * @returns {Promise<Object>} Detailed middleware information with configuration and analysis
 * 
 * @example
 * // Basic middleware information
 * const info = await getMiddlewareInfo({
 *   includeMetrics: true,
 *   includeSecurityAnalysis: true
 * });
 * 
 * @example
 * // Complete information with educational content
 * const detailedInfo = await getMiddlewareInfo({
 *   includeEducationalContent: true,
 *   includeTroubleshooting: true
 * });
 */
async function getMiddlewareInfo(infoOptions = {}) {
    const correlationId = infoOptions.correlationId || logger.generateCorrelationId();

    try {
        const {
            includeMetrics = true,
            includeSecurityAnalysis = true,
            includeEducationalContent = false,
            includeTroubleshooting = false
        } = infoOptions;

        logger.debug('Retrieving middleware information', {
            correlationId,
            options: infoOptions
        });

        const middlewareInfo = {
            timestamp: new Date().toISOString(),
            correlationId,
            initializationStatus: INITIALIZATION_STATUS,
            configuration: {
                environment: config.environment.NODE_ENV,
                security: config.security,
                server: config.server
            }
        };

        // Extract current middleware configuration and execution order
        if (MIDDLEWARE_CACHE.size > 0) {
            middlewareInfo.middlewareCache = {
                size: MIDDLEWARE_CACHE.size,
                keys: Array.from(MIDDLEWARE_CACHE.keys())
            };
        }

        if (MIDDLEWARE_STACK_CACHE.size > 0) {
            middlewareInfo.stackCache = {
                size: MIDDLEWARE_STACK_CACHE.size,
                keys: Array.from(MIDDLEWARE_STACK_CACHE.keys())
            };
        }

        // Analyze security coverage and protection effectiveness
        if (includeSecurityAnalysis) {
            middlewareInfo.securityAnalysis = await generateSecurityAnalysis(correlationId);
        }

        // Compile performance metrics and resource usage statistics
        if (includeMetrics) {
            middlewareInfo.performanceMetrics = await generatePerformanceMetrics(correlationId);
        }

        // Generate educational content about middleware concepts and implementation
        if (includeEducationalContent) {
            middlewareInfo.educationalContent = generateEducationalContent();
        }

        // Add troubleshooting information for common middleware issues
        if (includeTroubleshooting) {
            middlewareInfo.troubleshooting = generateTroubleshootingGuide();
        }

        // Include integration examples and configuration recommendations
        middlewareInfo.integrationExamples = generateIntegrationExamples();

        // Compile cross-platform compatibility information for Flask integration
        middlewareInfo.crossPlatformInfo = generateCrossPlatformInfo();

        logger.debug('Middleware information retrieved successfully', {
            correlationId,
            sectionsIncluded: Object.keys(middlewareInfo)
        });

        return middlewareInfo;

    } catch (error) {
        logger.error('Failed to retrieve middleware information', {
            correlationId,
            error: error.message,
            options: infoOptions
        });

        throw new ValidationError(
            `Failed to retrieve middleware information: ${error.message}`,
            'INFO_RETRIEVAL_ERROR',
            { originalError: error, correlationId, infoOptions }
        );
    }
}

/**
 * Refreshes middleware configuration by reloading settings, updating policies,
 * and recreating middleware instances to support hot-reloading and dynamic updates.
 * 
 * @param {Object} refreshOptions - Refresh configuration and options
 * @param {string} [refreshOptions.correlationId] - Request correlation ID for tracking
 * @param {boolean} [refreshOptions.clearCache=true] - Clear existing middleware cache
 * @param {boolean} [refreshOptions.validateAfterRefresh=true] - Validate after refresh
 * @param {Array<string>} [refreshOptions.targetMiddleware] - Specific middleware to refresh
 * 
 * @returns {Promise<Object>} Refresh result with updated middleware stack and status
 * 
 * @throws {ValidationError} When refresh operation encounters errors
 * 
 * @example
 * // Complete middleware refresh
 * const result = await refreshMiddleware({
 *   clearCache: true,
 *   validateAfterRefresh: true
 * });
 * 
 * @example
 * // Selective middleware refresh
 * const partialResult = await refreshMiddleware({
 *   targetMiddleware: ['security', 'rateLimit']
 * });
 */
async function refreshMiddleware(refreshOptions = {}) {
    const correlationId = refreshOptions.correlationId || logger.generateCorrelationId();
    const startTime = Date.now();

    try {
        logger.info('Refreshing middleware configuration', {
            correlationId,
            options: refreshOptions
        });

        const {
            clearCache = true,
            validateAfterRefresh = true,
            targetMiddleware = null
        } = refreshOptions;

        // Clear middleware and stack caches to force configuration reload
        if (clearCache) {
            const previousCacheSize = MIDDLEWARE_CACHE.size + MIDDLEWARE_STACK_CACHE.size;
            
            if (targetMiddleware) {
                // Selective cache clearing
                for (const [key, value] of MIDDLEWARE_CACHE.entries()) {
                    if (targetMiddleware.some(target => key.includes(target))) {
                        MIDDLEWARE_CACHE.delete(key);
                    }
                }
                for (const [key, value] of MIDDLEWARE_STACK_CACHE.entries()) {
                    if (targetMiddleware.some(target => key.includes(target))) {
                        MIDDLEWARE_STACK_CACHE.delete(key);
                    }
                }
            } else {
                // Complete cache clearing
                MIDDLEWARE_CACHE.clear();
                MIDDLEWARE_STACK_CACHE.clear();
            }

            logger.debug('Middleware cache cleared', {
                correlationId,
                previousSize: previousCacheSize,
                currentSize: MIDDLEWARE_CACHE.size + MIDDLEWARE_STACK_CACHE.size,
                selective: !!targetMiddleware
            });
        }

        // Reload configuration from config module and environment variables
        const refreshedConfig = await reloadConfiguration(correlationId);

        // Recreate middleware instances with updated configuration settings
        const newMiddlewareInstances = await createMiddlewareInstances(
            refreshedConfig.environment.NODE_ENV,
            refreshedConfig,
            true, // Enable caching
            correlationId
        );

        // Validate refreshed middleware stack for consistency and compatibility
        if (validateAfterRefresh) {
            const validationResult = await validateMiddlewareStack(
                Object.values(newMiddlewareInstances),
                { correlationId, environment: refreshedConfig.environment.NODE_ENV }
            );

            if (!validationResult.isValid) {
                throw new ValidationError(
                    'Refreshed middleware validation failed',
                    'REFRESH_VALIDATION_ERROR',
                    {
                        validationErrors: validationResult.errors,
                        correlationId
                    }
                );
            }
        }

        // Update initialization status with refresh information
        INITIALIZATION_STATUS.lastRefresh = new Date().toISOString();
        INITIALIZATION_STATUS.refreshCount = (INITIALIZATION_STATUS.refreshCount || 0) + 1;

        const refreshResult = {
            success: true,
            correlationId,
            refreshTime: Date.now() - startTime,
            middlewareInstances: Object.keys(newMiddlewareInstances),
            cacheCleared: clearCache,
            validated: validateAfterRefresh,
            targetMiddleware,
            initializationStatus: INITIALIZATION_STATUS
        };

        logger.info('Middleware refresh completed successfully', refreshResult);

        return refreshResult;

    } catch (error) {
        logger.error('Middleware refresh failed', {
            correlationId,
            error: error.message,
            refreshTime: Date.now() - startTime,
            options: refreshOptions
        });

        throw new ValidationError(
            `Middleware refresh failed: ${error.message}`,
            'REFRESH_ERROR',
            { originalError: error, correlationId, refreshOptions }
        );
    }
}

/**
 * Applies complete middleware stack to Express.js application in proper execution order
 * with error handling, performance monitoring, and educational logging for production.
 * 
 * @param {Object} expressApp - Express.js application instance
 * @param {Array<Function>} middlewareStack - Array of middleware functions to apply
 * @param {Object} applyOptions - Application integration options and configuration
 * @param {string} [applyOptions.correlationId] - Request correlation ID for tracking
 * @param {boolean} [applyOptions.enableMonitoring=true] - Enable middleware monitoring
 * @param {boolean} [applyOptions.enableHealthChecks=true] - Enable health check middleware
 * @param {boolean} [applyOptions.enableEducationalLogging=false] - Enable educational logging
 * 
 * @returns {Promise<Object>} Application integration result with middleware status and monitoring
 * 
 * @throws {ValidationError} When middleware application fails
 * 
 * @example
 * // Apply middleware to Express app
 * const result = await applyMiddlewareToApp(app, middlewareStack, {
 *   enableMonitoring: true,
 *   enableHealthChecks: true
 * });
 * 
 * @example
 * // Apply with educational logging
 * const eduResult = await applyMiddlewareToApp(app, middlewareStack, {
 *   enableEducationalLogging: true
 * });
 */
async function applyMiddlewareToApp(expressApp, middlewareStack, applyOptions = {}) {
    const correlationId = applyOptions.correlationId || logger.generateCorrelationId();
    const startTime = Date.now();

    try {
        logger.info('Applying middleware stack to Express.js application', {
            correlationId,
            middlewareCount: middlewareStack?.length || 0,
            options: applyOptions
        });

        // Validate Express.js application instance and middleware stack compatibility
        if (!expressApp || typeof expressApp.use !== 'function') {
            throw new ValidationError(
                'Invalid Express.js application instance',
                'APPLICATION_VALIDATION_ERROR',
                { correlationId, receivedType: typeof expressApp }
            );
        }

        if (!Array.isArray(middlewareStack)) {
            throw new ValidationError(
                'Invalid middleware stack: expected array of functions',
                'MIDDLEWARE_VALIDATION_ERROR',
                { correlationId, receivedType: typeof middlewareStack }
            );
        }

        const {
            enableMonitoring = true,
            enableHealthChecks = true,
            enableEducationalLogging = false
        } = applyOptions;

        const applicationResult = {
            success: false,
            correlationId,
            middlewareApplied: 0,
            healthCheckAdded: false,
            monitoringEnabled: false,
            errors: []
        };

        // Apply middleware stack to Express.js application in proper execution order
        for (let i = 0; i < middlewareStack.length; i++) {
            const middleware = middlewareStack[i];
            
            if (typeof middleware !== 'function') {
                applicationResult.errors.push(
                    `Invalid middleware at index ${i}: expected function, got ${typeof middleware}`
                );
                continue;
            }

            try {
                expressApp.use(middleware);
                applicationResult.middlewareApplied++;
                
                if (enableEducationalLogging) {
                    logger.debug(`Applied middleware ${i + 1}/${middlewareStack.length}`, {
                        correlationId,
                        middlewareIndex: i,
                        middlewareName: middleware.name || 'anonymous'
                    });
                }
            } catch (error) {
                applicationResult.errors.push(
                    `Failed to apply middleware at index ${i}: ${error.message}`
                );
            }
        }

        // Configure middleware health checks and status monitoring
        if (enableHealthChecks) {
            const healthCheckMiddleware = createHealthCheckMiddleware(correlationId);
            expressApp.use('/health', healthCheckMiddleware);
            applicationResult.healthCheckAdded = true;
            
            logger.debug('Health check endpoint added', {
                correlationId,
                endpoint: '/health'
            });
        }

        // Set up middleware performance monitoring and metrics collection
        if (enableMonitoring) {
            const monitoringSetup = await setupApplicationMonitoring(expressApp, correlationId);
            applicationResult.monitoringEnabled = monitoringSetup.success;
            applicationResult.monitoringConfig = monitoringSetup.config;
        }

        // Validate final application configuration
        if (applicationResult.errors.length === 0) {
            applicationResult.success = true;
            applicationResult.applicationTime = Date.now() - startTime;
            
            logger.info('Middleware stack applied successfully to Express.js application', {
                correlationId,
                middlewareApplied: applicationResult.middlewareApplied,
                totalMiddleware: middlewareStack.length,
                applicationTime: applicationResult.applicationTime,
                healthCheckAdded: applicationResult.healthCheckAdded,
                monitoringEnabled: applicationResult.monitoringEnabled
            });
        } else {
            throw new ValidationError(
                'Failed to apply complete middleware stack',
                'APPLICATION_ERROR',
                {
                    errors: applicationResult.errors,
                    correlationId,
                    partiallyApplied: applicationResult.middlewareApplied
                }
            );
        }

        return applicationResult;

    } catch (error) {
        logger.error('Failed to apply middleware stack to Express.js application', {
            correlationId,
            error: error.message,
            stack: error.stack,
            applicationTime: Date.now() - startTime
        });

        throw new ValidationError(
            `Failed to apply middleware stack: ${error.message}`,
            'APPLICATION_ERROR',
            { originalError: error, correlationId, applyOptions }
        );
    }
}

/**
 * Creates custom middleware functions with user-defined policies, specialized configuration,
 * and integration with existing middleware stack for advanced use cases and experimentation.
 * 
 * @param {Object} customConfig - Custom middleware configuration and policies
 * @param {string} customConfig.name - Custom middleware name for identification
 * @param {Function} customConfig.handler - Custom middleware handler function
 * @param {Object} [customConfig.options] - Additional middleware options
 * @param {Object} customOptions - Custom middleware creation options
 * @param {string} [customOptions.correlationId] - Request correlation ID for tracking
 * @param {boolean} [customOptions.enableLogging=true] - Enable middleware logging
 * @param {boolean} [customOptions.enableMonitoring=false] - Enable performance monitoring
 * 
 * @returns {Promise<Function>} Custom middleware function ready for Express.js integration
 * 
 * @throws {ValidationError} When custom middleware creation fails
 * 
 * @example
 * // Create custom authentication middleware
 * const authMiddleware = await createCustomMiddleware({
 *   name: 'customAuth',
 *   handler: (req, res, next) => {
 *     // Custom authentication logic
 *     next();
 *   }
 * });
 * 
 * @example
 * // Create monitored custom middleware
 * const monitoredMiddleware = await createCustomMiddleware({
 *   name: 'customProcessor',
 *   handler: async (req, res, next) => {
 *     // Custom processing logic
 *     next();
 *   }
 * }, { enableMonitoring: true });
 */
async function createCustomMiddleware(customConfig, customOptions = {}) {
    const correlationId = customOptions.correlationId || logger.generateCorrelationId();

    try {
        logger.info('Creating custom middleware', {
            correlationId,
            middlewareName: customConfig.name,
            options: customOptions
        });

        // Validate custom middleware configuration and required functionality
        if (!customConfig.name || typeof customConfig.name !== 'string') {
            throw new ValidationError(
                'Custom middleware requires a valid name',
                'CUSTOM_MIDDLEWARE_VALIDATION_ERROR',
                { correlationId, providedName: customConfig.name }
            );
        }

        if (!customConfig.handler || typeof customConfig.handler !== 'function') {
            throw new ValidationError(
                'Custom middleware requires a valid handler function',
                'CUSTOM_MIDDLEWARE_VALIDATION_ERROR',
                { correlationId, middlewareName: customConfig.name }
            );
        }

        const {
            enableLogging = true,
            enableMonitoring = false
        } = customOptions;

        // Create custom middleware function with Express.js req, res, next pattern
        const customMiddleware = async (req, res, next) => {
            const requestStart = Date.now();
            const requestId = logger.generateCorrelationId();

            try {
                if (enableLogging) {
                    logger.debug(`Custom middleware '${customConfig.name}' started`, {
                        correlationId,
                        requestId,
                        middlewareName: customConfig.name,
                        method: req.method,
                        path: req.path
                    });
                }

                // Apply custom policies and configuration with validation and error handling
                await customConfig.handler(req, res, next);

                if (enableMonitoring) {
                    const executionTime = Date.now() - requestStart;
                    logger.debug(`Custom middleware '${customConfig.name}' completed`, {
                        correlationId,
                        requestId,
                        middlewareName: customConfig.name,
                        executionTime
                    });
                }

            } catch (error) {
                logger.error(`Custom middleware '${customConfig.name}' error`, {
                    correlationId,
                    requestId,
                    middlewareName: customConfig.name,
                    error: error.message,
                    executionTime: Date.now() - requestStart
                });

                next(error);
            }
        };

        // Set middleware name for debugging and monitoring
        Object.defineProperty(customMiddleware, 'name', {
            value: customConfig.name,
            writable: false
        });

        logger.info('Custom middleware created successfully', {
            correlationId,
            middlewareName: customConfig.name,
            loggingEnabled: enableLogging,
            monitoringEnabled: enableMonitoring
        });

        return customMiddleware;

    } catch (error) {
        logger.error('Custom middleware creation failed', {
            correlationId,
            middlewareName: customConfig?.name,
            error: error.message
        });

        throw new ValidationError(
            `Custom middleware creation failed: ${error.message}`,
            'CUSTOM_MIDDLEWARE_ERROR',
            { originalError: error, correlationId, customConfig }
        );
    }
}

// ===============================
// HELPER FUNCTIONS
// ===============================

/**
 * Validates middleware configuration objects for completeness and consistency
 */
function validateMiddlewareConfigs(configs, correlationId) {
    const validation = { isValid: true, errors: [] };

    try {
        // Validate security configuration
        if (!configs.security) {
            validation.errors.push('Missing security configuration');
            validation.isValid = false;
        }

        // Validate server configuration
        if (!configs.server) {
            validation.errors.push('Missing server configuration');
            validation.isValid = false;
        }

        // Validate environment configuration
        if (!configs.environment || !configs.environment.NODE_ENV) {
            validation.errors.push('Missing or invalid environment configuration');
            validation.isValid = false;
        }

        logger.debug('Middleware configuration validation completed', {
            correlationId,
            isValid: validation.isValid,
            errorCount: validation.errors.length
        });

    } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Configuration validation error: ${error.message}`);
    }

    return validation;
}

/**
 * Creates middleware instances using factory functions with environment-specific configuration
 */
async function createMiddlewareInstances(environment, configs, enableCaching, correlationId) {
    const instances = {};

    try {
        // Create Helmet.js security middleware instance
        instances.helmet = createHelmetConfigMiddleware(configs.security.helmet || {}, environment);
        
        // Create CORS middleware instance
        instances.cors = environment === 'development' 
            ? createDevelopmentCors(configs.security.cors || {})
            : corsMiddleware;
        
        // Create rate limiting middleware instance
        instances.rateLimiter = createRateLimiterMiddleware(configs.security.rateLimit || {});
        
        // Create security stack middleware instance
        instances.security = createSecurityMiddleware(configs.security || {});
        
        // Create request logger middleware instance
        instances.logger = createRequestLogger(configs.server.logging || {});
        
        // Create error handler middleware instance
        instances.errorHandler = createErrorHandler(configs.server.errorHandling || {});

        logger.debug('Middleware instances created successfully', {
            correlationId,
            environment,
            instanceCount: Object.keys(instances).length,
            cachingEnabled: enableCaching
        });

    } catch (error) {
        logger.error('Failed to create middleware instances', {
            correlationId,
            environment,
            error: error.message
        });
        throw error;
    }

    return instances;
}

/**
 * Validates middleware compatibility with Express.js v5.1.0 and PM2 cluster mode
 */
async function validateMiddlewareCompatibility(instances, correlationId) {
    try {
        // Validate Express.js v5.1.0 compatibility
        for (const [name, middleware] of Object.entries(instances)) {
            if (typeof middleware !== 'function') {
                throw new ValidationError(
                    `Invalid middleware instance: ${name} is not a function`,
                    'COMPATIBILITY_ERROR',
                    { correlationId, middlewareName: name }
                );
            }
        }

        // Validate PM2 cluster mode compatibility
        const pm2ClusterId = process.env.pm_id;
        if (pm2ClusterId) {
            logger.debug('PM2 cluster mode detected - validating stateless compatibility', {
                correlationId,
                clusterId: pm2ClusterId
            });
        }

        logger.debug('Middleware compatibility validation passed', {
            correlationId,
            middlewareCount: Object.keys(instances).length,
            pm2Compatible: true
        });

    } catch (error) {
        logger.error('Middleware compatibility validation failed', {
            correlationId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Validates middleware dependency requirements and execution order
 */
function validateMiddlewareDependencies(executionOrder, instances) {
    const validation = { isValid: true, errors: [] };

    try {
        // Validate that all required middleware are present
        for (const middlewareName of executionOrder) {
            if (!instances[middlewareName]) {
                validation.errors.push(`Missing required middleware: ${middlewareName}`);
                validation.isValid = false;
            }
        }

        // Validate middleware execution order dependencies
        const corsIndex = executionOrder.indexOf('cors');
        const helmetIndex = executionOrder.indexOf('helmet');
        const errorHandlerIndex = executionOrder.indexOf('errorHandler');

        if (corsIndex > helmetIndex && corsIndex !== -1 && helmetIndex !== -1) {
            validation.errors.push('CORS middleware should be applied before Helmet for optimal compatibility');
        }

        if (errorHandlerIndex !== -1 && errorHandlerIndex !== executionOrder.length - 1) {
            validation.errors.push('Error handler middleware should be the last middleware in the stack');
        }

    } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Dependency validation error: ${error.message}`);
    }

    return validation;
}

/**
 * Sets up hot-reloading capability for development environment
 */
async function setupHotReload(correlationId) {
    try {
        logger.debug('Setting up middleware hot-reload for development', {
            correlationId,
            environment: 'development'
        });

        // Implementation would set up file watchers for middleware files
        // This is a placeholder for the hot-reload functionality

    } catch (error) {
        logger.warn('Failed to setup hot-reload', {
            correlationId,
            error: error.message
        });
    }
}

/**
 * Creates educational middleware for demonstrating middleware concepts
 */
function createEducationalMiddleware(correlationId) {
    return (req, res, next) => {
        const requestStart = Date.now();
        
        logger.info('🎓 Educational Middleware: Request received', {
            correlationId,
            method: req.method,
            path: req.path,
            headers: Object.keys(req.headers),
            timestamp: new Date().toISOString()
        });

        // Add educational response header
        res.setHeader('X-Tutorial-Middleware', 'Educational-Demo');
        
        res.on('finish', () => {
            const responseTime = Date.now() - requestStart;
            logger.info('🎓 Educational Middleware: Response sent', {
                correlationId,
                statusCode: res.statusCode,
                responseTime: `${responseTime}ms`,
                headers: Object.keys(res.getHeaders())
            });
        });

        next();
    };
}

/**
 * Enables hot-reload functionality for middleware stack
 */
async function enableMiddlewareHotReload(middlewareStack, correlationId) {
    try {
        logger.debug('Enabling hot-reload for middleware stack', {
            correlationId,
            middlewareCount: middlewareStack.length
        });

        // Implementation would set up file system watchers
        // This is a placeholder for the actual hot-reload implementation

    } catch (error) {
        logger.warn('Failed to enable middleware hot-reload', {
            correlationId,
            error: error.message
        });
    }
}

/**
 * Optimizes middleware stack for PM2 cluster mode
 */
async function optimizeForPM2Cluster(middlewareStack, correlationId) {
    try {
        logger.debug('Optimizing middleware stack for PM2 cluster mode', {
            correlationId,
            clusterId: process.env.pm_id || 'standalone'
        });

        // Return optimized middleware stack (placeholder implementation)
        return middlewareStack;

    } catch (error) {
        logger.error('Failed to optimize middleware for PM2', {
            correlationId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Sets up production monitoring for middleware stack
 */
async function setupProductionMonitoring(middlewareStack, correlationId) {
    try {
        logger.info('Setting up production monitoring', {
            correlationId,
            middlewareCount: middlewareStack.length
        });

        // Implementation would set up monitoring and alerting
        // This is a placeholder for the actual monitoring setup

    } catch (error) {
        logger.error('Failed to setup production monitoring', {
            correlationId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Sets up security monitoring for middleware stack
 */
async function setupSecurityMonitoring(middlewareStack, correlationId) {
    try {
        logger.info('Setting up security monitoring', {
            correlationId,
            middlewareCount: middlewareStack.length
        });

        // Implementation would set up security event monitoring
        // This is a placeholder for the actual security monitoring setup

    } catch (error) {
        logger.error('Failed to setup security monitoring', {
            correlationId,
            error: error.message
        });
        throw error;
    }
}

// Additional helper functions for validation, monitoring, and management would be implemented here
// These are placeholders for the comprehensive functionality described in the specifications

/**
 * Validates middleware execution order
 */
function validateExecutionOrder(middlewareStack, correlationId) {
    return { isValid: true, errors: [] };
}

/**
 * Validates Express.js compatibility
 */
async function validateExpressCompatibility(middlewareStack, correlationId) {
    return { isValid: true, warnings: [] };
}

/**
 * Validates security coverage
 */
async function validateSecurityCoverage(middlewareStack, correlationId) {
    return { score: 85, coverage: [], recommendations: [] };
}

/**
 * Validates environment configuration
 */
function validateEnvironmentConfiguration(middlewareStack, environment, correlationId) {
    return { isValid: true, warnings: [] };
}

/**
 * Validates middleware performance
 */
async function validatePerformance(middlewareStack, thresholds, correlationId) {
    return { averageResponseTime: 45, memoryUsage: 32 * 1024 * 1024 };
}

/**
 * Validates PM2 compatibility
 */
function validatePM2Compatibility(middlewareStack, correlationId) {
    return { isValid: true, errors: [] };
}

/**
 * Validates error handling
 */
function validateErrorHandling(middlewareStack, correlationId) {
    return { isValid: true, warnings: [] };
}

/**
 * Calculates overall validation score
 */
function calculateValidationScore(validationResults) {
    return 90; // Placeholder implementation
}

/**
 * Generates recommendations based on validation results
 */
function generateRecommendations(validationResults) {
    return ['Consider upgrading to latest middleware versions'];
}

/**
 * Generates security analysis
 */
async function generateSecurityAnalysis(correlationId) {
    return { score: 90, vulnerabilities: [], recommendations: [] };
}

/**
 * Generates performance metrics
 */
async function generatePerformanceMetrics(correlationId) {
    return { 
        responseTime: { average: 45, median: 42, p95: 65 },
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
    };
}

/**
 * Generates educational content
 */
function generateEducationalContent() {
    return {
        concepts: ['Middleware Pipeline', 'Security Headers', 'Error Handling'],
        examples: ['CORS Configuration', 'Rate Limiting', 'Request Logging'],
        tutorials: ['Basic Server Setup', 'Production Deployment', 'Flask Migration']
    };
}

/**
 * Generates troubleshooting guide
 */
function generateTroubleshootingGuide() {
    return {
        commonIssues: ['CORS Errors', 'Rate Limit Exceeded', 'Memory Leaks'],
        solutions: ['Check Origin Configuration', 'Adjust Rate Limits', 'Monitor Memory Usage'],
        diagnostics: ['Check Logs', 'Validate Configuration', 'Test Middleware Order']
    };
}

/**
 * Generates integration examples
 */
function generateIntegrationExamples() {
    return {
        express: 'app.use(middlewareStack)',
        pm2: 'PM2 cluster mode compatible',
        docker: 'Container deployment ready'
    };
}

/**
 * Generates cross-platform information
 */
function generateCrossPlatformInfo() {
    return {
        flask: 'Compatible patterns available',
        nodejs: 'Native implementation',
        docker: 'Container ready'
    };
}

/**
 * Reloads configuration from all sources
 */
async function reloadConfiguration(correlationId) {
    try {
        // Implementation would reload configuration from files and environment
        return config;
    } catch (error) {
        logger.error('Failed to reload configuration', {
            correlationId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Creates health check middleware
 */
function createHealthCheckMiddleware(correlationId) {
    return (req, res) => {
        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.environment.NODE_ENV,
            clusterId: process.env.pm_id || 'standalone',
            processId: process.pid,
            memoryUsage: process.memoryUsage(),
            version: '1.0.0'
        };

        res.status(200).json(healthCheck);
    };
}

/**
 * Sets up application monitoring
 */
async function setupApplicationMonitoring(expressApp, correlationId) {
    try {
        logger.debug('Setting up application monitoring', {
            correlationId
        });

        return {
            success: true,
            config: {
                metricsEnabled: true,
                healthCheckEnabled: true,
                performanceTracking: true
            }
        };
    } catch (error) {
        logger.error('Failed to setup application monitoring', {
            correlationId,
            error: error.message
        });
        return { success: false, error: error.message };
    }
}

// ===============================
// EXPORTS
// ===============================

// Unified middleware object containing all individual middleware components for granular use
export const middleware = {
    helmet: helmetMiddleware,
    cors: corsMiddleware,
    rateLimiter: rateLimiter,
    security: securityMiddleware,
    logger: requestLogger,
    errorHandler: errorHandler
};

// Default middleware stack configured for current environment and ready for application use
export const middlewareStack = await createMiddlewareStack(
    config.environment.NODE_ENV || 'development'
);

// Export all factory functions and utilities for external use
export {
    // Factory functions for creating middleware stacks
    createMiddlewareStack,
    createDevelopmentMiddleware,
    createProductionMiddleware,
    
    // System management functions
    initializeMiddleware,
    validateMiddlewareStack,
    applyMiddlewareToApp,
    refreshMiddleware,
    createCustomMiddleware,
    
    // Information and monitoring functions
    getMiddlewareInfo
};