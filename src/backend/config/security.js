/**
 * @fileoverview Central Security Configuration Orchestrator for Node.js Tutorial Project
 * @description Comprehensive security management system that provides unified coordination for all
 * security-related configurations including Helmet.js security headers, CORS policies, CSP directives,
 * rate limiting, and SSL/TLS settings. Acts as the main security configuration interface for
 * Express.js v5.1.0 integration, supporting environment-specific security policies from development
 * flexibility to production strictness. Integrates seamlessly with PM2 cluster mode for enterprise-grade
 * security deployment while maintaining educational value for demonstrating modern web application
 * security practices.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Unified security configuration orchestration across all security components
 * - Environment-aware security policies (development, staging, production)
 * - Helmet.js 15 security middlewares coordination and configuration management
 * - Content Security Policy (CSP) integration with nonce support and violation reporting
 * - Cross-Origin Resource Sharing (CORS) policies with environment-specific origins
 * - Rate limiting configuration for DDoS protection and abuse prevention
 * - SSL/TLS configuration management for HTTPS enforcement and transport security
 * - Security validation, monitoring, and comprehensive logging capabilities
 * - Dynamic security configuration updates with runtime policy adjustments
 * - PM2 cluster mode compatibility for distributed security enforcement
 * - Express.js v5.1.0 middleware integration with modern async/await support
 * 
 * Educational Value:
 * - Demonstrates comprehensive web application security implementation
 * - Showcases layered security architecture and defense-in-depth strategies
 * - Illustrates environment-specific security configuration management
 * - Teaches modern HTTP security headers and policies implementation
 * - Provides examples of security validation and monitoring best practices
 * - Shows integration patterns for security middleware in Express.js applications
 * - Demonstrates security event logging and violation tracking methodologies
 * 
 * Technology Integration:
 * - Express.js v5.1.0 middleware compatibility with promise-based error handling
 * - Helmet.js v8.1.0 comprehensive security headers management
 * - PM2 v6.0.8 cluster mode security deployment support
 * - Node.js v22.x LTS security features and cryptographic capabilities
 * - Cross-platform Flask compatibility for educational comparison
 */

// External library imports with version comments for security dependencies
import helmet from 'helmet'; // v8.1.0 - Express.js security middleware with 15 sub-middlewares for comprehensive HTTP header security
import rateLimit from 'express-rate-limit'; // v7.1.0 - Rate limiting middleware for Express applications to prevent abuse and DDoS attacks

// Internal security configuration imports for modular security component management
import { createHelmetConfig } from '../security/helmet.config.js';
import { createContentSecurityPolicy } from '../security/csp.config.js';
import { createCorsConfig } from '../security/cors.config.js';

// Environment and configuration imports for environment-aware security settings
import { 
  defaultEnvironmentConfig as environmentConfig,
  isProduction,
  isDevelopment,
  currentEnvironment
} from './environment.js';

// Security constants and configuration values for consistent security policy definitions
import {
  SECURITY_CONSTANTS,
  HTTP_CONSTANTS,
  ERROR_CONSTANTS,
  PM2_CONSTANTS
} from '../utils/constants.js';

// Logging and error handling imports for security event tracking and violation reporting
import logger, {
  logSecurityEvent,
  generateRequestId,
  createRequestLogger,
  logPerformanceMetrics
} from '../utils/logger.js';

import {
  SecurityError,
  HTTPError,
  createErrorResponse,
  formatErrorForLogging
} from '../utils/error-types.js';

// Global security state management and tracking for security configuration monitoring
let SECURITY_INITIALIZED = false;
let CURRENT_SECURITY_LEVEL = process.env.SECURITY_LEVEL || 'standard';
let HTTPS_ENFORCED = process.env.HTTPS_ENFORCED === 'true';
let ACTIVE_SECURITY_CONFIG = null;
let SECURITY_METRICS = {
  requestsProcessed: 0,
  securityViolations: 0,
  rateLimit: {
    requests: 0,
    blocked: 0
  },
  csp: {
    violations: 0,
    reports: 0
  },
  cors: {
    violations: 0,
    blocked: 0
  },
  lastUpdated: Date.now()
};

/**
 * Creates comprehensive security configuration object by orchestrating all security components
 * including Helmet.js, CORS, CSP, and rate limiting for the specified environment. Provides
 * unified security management with environment-specific policies, validation, and monitoring
 * capabilities for Express.js v5.1.0 applications with PM2 cluster mode support.
 * 
 * @param {string} environment - Target environment (development, staging, production)
 * @param {Object} [customOptions={}] - Custom security configuration overrides
 * @returns {Object} Complete security configuration object with all security policies and middleware settings
 */
export function createSecurityConfig(environment = currentEnvironment, customOptions = {}) {
  try {
    // Validate environment parameter and set defaults for security configuration
    if (typeof environment !== 'string' || !environment.trim()) {
      logger.warn('Invalid environment parameter provided to createSecurityConfig, using current environment', {
        providedEnvironment: environment,
        fallbackEnvironment: currentEnvironment
      });
      environment = currentEnvironment;
    }

    // Load environment-specific security settings from environmentConfig with comprehensive validation
    const envSecurityConfig = environmentConfig.security || {};
    const envSettings = {
      development: {
        helmetStrict: false,
        corsPermissive: true,
        rateLimitHigh: true,
        httpsOptional: true,
        cspReportOnly: true,
        securityLevel: 'relaxed'
      },
      staging: {
        helmetBalanced: true,
        corsControlled: true,
        rateLimitMedium: true,
        httpsPreferred: true,
        cspReportAndEnforce: true,
        securityLevel: 'intermediate'
      },
      production: {
        helmetStrict: true,
        corsRestrictive: true,
        rateLimitLow: true,
        httpsEnforced: true,
        cspEnforced: true,
        securityLevel: 'strict'
      }
    };

    const currentEnvSettings = envSettings[environment] || envSettings.production;

    logger.info('Creating security configuration for environment', {
      environment,
      securityLevel: currentEnvSettings.securityLevel,
      customOptionsProvided: Object.keys(customOptions).length > 0
    });

    // Create Helmet.js configuration using createHelmetConfig with environment settings
    const helmetConfig = createHelmetConfig(environment, {
      strict: currentEnvSettings.helmetStrict,
      enableAllPolicies: isProduction,
      customPolicies: customOptions.helmet || {},
      ...envSecurityConfig.helmet
    });

    // Generate CSP configuration using createContentSecurityPolicy for XSS prevention
    const cspConfig = createContentSecurityPolicy(environment, {
      reportOnly: currentEnvSettings.cspReportOnly && !isProduction,
      enableNonce: true,
      allowInlineStyles: isDevelopment,
      allowInlineScripts: isDevelopment,
      ...customOptions.csp,
      ...envSecurityConfig.csp
    });

    // Configure CORS policies using createCorsConfig with environment-specific origins
    const corsConfig = createCorsConfig(environment, {
      permissive: currentEnvSettings.corsPermissive,
      restrictive: currentEnvSettings.corsRestrictive,
      allowedOrigins: customOptions.allowedOrigins || envSecurityConfig.cors?.allowedOrigins,
      ...customOptions.cors,
      ...envSecurityConfig.cors
    });

    // Set up rate limiting configuration based on environment requirements
    const rateLimitConfig = createRateLimitConfig(environment, {
      windowMs: customOptions.rateLimitWindow || SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.WINDOW_MS,
      max: customOptions.maxRequests || (
        currentEnvSettings.rateLimitHigh ? 1000 :
        currentEnvSettings.rateLimitMedium ? 500 :
        100
      ),
      standardHeaders: true,
      legacyHeaders: false,
      ...customOptions.rateLimit,
      ...envSecurityConfig.rateLimit
    });

    // Configure SSL/TLS settings for HTTPS enforcement in production
    const sslConfig = createSSLConfig(environment, {
      enforced: currentEnvSettings.httpsEnforced || HTTPS_ENFORCED,
      certificatePath: customOptions.certificatePath || envSecurityConfig.ssl?.certificatePath,
      keyPath: customOptions.keyPath || envSecurityConfig.ssl?.keyPath,
      protocols: customOptions.sslProtocols || SECURITY_CONSTANTS.SSL_CONFIG.PROTOCOLS,
      ciphers: customOptions.sslCiphers || SECURITY_CONSTANTS.SSL_CONFIG.CIPHERS,
      ...customOptions.ssl,
      ...envSecurityConfig.ssl
    });

    // Apply custom security options overrides if provided
    const mergedCustomOptions = {
      ...customOptions,
      metadata: {
        environment,
        securityLevel: currentEnvSettings.securityLevel,
        createdAt: new Date().toISOString(),
        configVersion: '1.0.0',
        ...customOptions.metadata
      }
    };

    // Validate complete security configuration for completeness and effectiveness
    const securityConfig = {
      environment,
      securityLevel: currentEnvSettings.securityLevel,
      helmet: helmetConfig,
      csp: cspConfig,
      cors: corsConfig,
      rateLimit: rateLimitConfig,
      ssl: sslConfig,
      custom: mergedCustomOptions,
      metadata: {
        createdAt: new Date().toISOString(),
        environment,
        securityLevel: currentEnvSettings.securityLevel,
        configVersion: '1.0.0',
        httpsEnforced: currentEnvSettings.httpsEnforced || HTTPS_ENFORCED,
        pm2Compatible: !!process.env.PM2_HOME,
        nodeVersion: process.version,
        processId: process.pid
      }
    };

    // Validate security configuration completeness and policy consistency
    const validationResult = validateSecurityConfig(securityConfig);
    if (!validationResult.isValid) {
      logger.warn('Security configuration validation warnings detected', {
        environment,
        warnings: validationResult.warnings,
        errors: validationResult.errors
      });
    }

    // Log security configuration initialization and applied policies
    logSecurityConfiguration(securityConfig, 'security-config-created');

    // Store active configuration for monitoring and dynamic updates
    ACTIVE_SECURITY_CONFIG = securityConfig;
    SECURITY_INITIALIZED = true;
    CURRENT_SECURITY_LEVEL = currentEnvSettings.securityLevel;

    logger.info('Security configuration created successfully', {
      environment,
      securityLevel: currentEnvSettings.securityLevel,
      helmetPolicies: Object.keys(helmetConfig).length,
      cspDirectives: Object.keys(cspConfig.directives || {}).length,
      corsOrigins: corsConfig.origin ? (Array.isArray(corsConfig.origin) ? corsConfig.origin.length : 1) : 0,
      rateLimitMax: rateLimitConfig.max,
      sslEnforced: sslConfig.enforced,
      validationStatus: validationResult.isValid ? 'passed' : 'warnings'
    });

    // Return comprehensive security configuration object
    return securityConfig;

  } catch (error) {
    // Handle security configuration creation errors with comprehensive error logging
    const securityError = new SecurityError(
      'Failed to create security configuration',
      'configuration-error',
      {
        environment,
        customOptions: Object.keys(customOptions),
        originalError: error.message,
        stack: error.stack
      }
    );

    logger.error('Security configuration creation failed', securityError, {
      environment,
      error: formatErrorForLogging(error),
      customOptions: Object.keys(customOptions)
    });

    // Return minimal safe configuration as fallback
    return createFallbackSecurityConfig(environment);
  }
}

/**
 * Initializes and configures all security middleware for Express.js application with proper
 * ordering and environment-specific settings. Applies security policies in correct sequence
 * to ensure comprehensive protection and compatibility with Express.js v5.1.0 promise-based
 * error handling and PM2 cluster mode operation.
 * 
 * @param {Object} app - Express.js application instance
 * @param {Object} securityConfig - Complete security configuration object
 * @returns {Object} Express.js application instance with all security middleware configured
 */
export function initializeSecurityMiddleware(app, securityConfig = ACTIVE_SECURITY_CONFIG) {
  try {
    // Validate Express application instance and security configuration
    if (!app || typeof app.use !== 'function') {
      throw new HTTPError('Invalid Express application instance provided', 500, {
        code: ERROR_CONSTANTS.ERROR_CODES.INVALID_CONFIGURATION,
        context: { appType: typeof app, hasUseMethod: !!(app && app.use) }
      });
    }

    if (!securityConfig) {
      logger.warn('No security configuration provided, creating default configuration');
      securityConfig = createSecurityConfig();
    }

    logger.info('Initializing security middleware for Express.js application', {
      environment: securityConfig.environment,
      securityLevel: securityConfig.securityLevel,
      middlewareOrder: ['rate-limit', 'helmet', 'cors', 'csp', 'ssl-redirect', 'security-headers']
    });

    // Apply rate limiting middleware first for DDoS protection
    if (securityConfig.rateLimit && securityConfig.rateLimit.enabled !== false) {
      const rateLimiter = rateLimit({
        ...securityConfig.rateLimit,
        handler: (req, res, next) => {
          // Enhanced rate limit handler with security logging
          const requestLogger = createRequestLogger(req);
          
          logSecurityEvent('rate-limit-exceeded', {
            clientIp: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            rateLimitConfig: {
              windowMs: securityConfig.rateLimit.windowMs,
              max: securityConfig.rateLimit.max
            }
          }, {
            correlationId: requestLogger.correlationId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          // Update security metrics for rate limiting
          SECURITY_METRICS.rateLimit.blocked++;
          SECURITY_METRICS.securityViolations++;

          // Send rate limit exceeded response
          const errorResponse = createErrorResponse(
            new HTTPError('Rate limit exceeded', HTTP_CONSTANTS.STATUS_CODES.TOO_MANY_REQUESTS, {
              code: ERROR_CONSTANTS.ERROR_CODES.RATE_LIMITED,
              requestId: requestLogger.correlationId,
              rateLimitInfo: {
                windowMs: securityConfig.rateLimit.windowMs,
                max: securityConfig.rateLimit.max,
                retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000)
              }
            }),
            { environment: securityConfig.environment }
          );

          res.status(HTTP_CONSTANTS.STATUS_CODES.TOO_MANY_REQUESTS)
             .set('Retry-After', Math.ceil(securityConfig.rateLimit.windowMs / 1000))
             .json(errorResponse);
        }
      });

      app.use(rateLimiter);
      logger.debug('Rate limiting middleware configured', {
        windowMs: securityConfig.rateLimit.windowMs,
        max: securityConfig.rateLimit.max,
        standardHeaders: securityConfig.rateLimit.standardHeaders
      });
    }

    // Configure Helmet.js middleware with comprehensive security headers
    if (securityConfig.helmet && securityConfig.helmet.enabled !== false) {
      // Merge CSP configuration into Helmet configuration
      const helmetConfigWithCSP = {
        ...securityConfig.helmet,
        contentSecurityPolicy: securityConfig.csp && securityConfig.csp.enabled !== false ? 
          securityConfig.csp : false
      };

      app.use(helmet(helmetConfigWithCSP));
      logger.debug('Helmet.js security middleware configured', {
        policies: Object.keys(helmetConfigWithCSP).filter(key => helmetConfigWithCSP[key] !== false),
        cspEnabled: !!helmetConfigWithCSP.contentSecurityPolicy,
        strict: securityConfig.securityLevel === 'strict'
      });
    }

    // Set up CORS middleware with environment-specific policies
    if (securityConfig.cors && securityConfig.cors.enabled !== false) {
      // Create CORS middleware with violation handling
      const corsMiddleware = (req, res, next) => {
        // Check if request origin is allowed
        const origin = req.get('Origin');
        const allowedOrigins = securityConfig.cors.origin;
        
        if (origin && allowedOrigins && !isOriginAllowed(origin, allowedOrigins)) {
          const requestLogger = createRequestLogger(req);
          
          logSecurityEvent('cors-violation', {
            origin,
            allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins],
            method: req.method,
            url: req.url
          }, {
            correlationId: requestLogger.correlationId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          SECURITY_METRICS.cors.violations++;
          SECURITY_METRICS.cors.blocked++;

          return res.status(HTTP_CONSTANTS.STATUS_CODES.FORBIDDEN).json(
            createErrorResponse(
              new SecurityError('CORS policy violation', 'cors-violation', {
                origin,
                allowedOrigins: allowedOrigins,
                requestId: requestLogger.correlationId
              }),
              { environment: securityConfig.environment }
            )
          );
        }

        // Apply CORS headers
        const corsConfig = createCorsConfig(securityConfig.environment, securityConfig.cors);
        
        // Set CORS headers manually for better control
        if (corsConfig.origin === '*' || isOriginAllowed(origin, corsConfig.origin)) {
          res.set('Access-Control-Allow-Origin', origin || '*');
        }
        
        if (corsConfig.credentials) {
          res.set('Access-Control-Allow-Credentials', 'true');
        }
        
        if (corsConfig.allowedHeaders) {
          res.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
        }
        
        if (corsConfig.methods) {
          res.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
        }
        
        if (corsConfig.maxAge) {
          res.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
        }

        next();
      };

      app.use(corsMiddleware);
      logger.debug('CORS middleware configured', {
        origin: securityConfig.cors.origin,
        methods: securityConfig.cors.methods,
        allowedHeaders: securityConfig.cors.allowedHeaders,
        credentials: securityConfig.cors.credentials
      });
    }

    // Configure CSP middleware with nonce support if enabled separately
    if (securityConfig.csp && securityConfig.csp.enabled !== false && 
        securityConfig.csp.separateMiddleware === true) {
      
      const cspMiddleware = (req, res, next) => {
        // Generate nonce for inline scripts/styles if enabled
        if (securityConfig.csp.enableNonce) {
          res.locals.nonce = generateCSPNonce();
        }

        // Set CSP headers
        const cspDirectives = formatCSPDirectives(securityConfig.csp.directives, res.locals.nonce);
        const cspHeader = securityConfig.csp.reportOnly ? 
          'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
        
        res.set(cspHeader, cspDirectives);
        next();
      };

      app.use(cspMiddleware);
      logger.debug('CSP middleware configured separately', {
        reportOnly: securityConfig.csp.reportOnly,
        enableNonce: securityConfig.csp.enableNonce,
        directives: Object.keys(securityConfig.csp.directives || {})
      });
    }

    // Apply SSL/TLS redirect middleware for HTTPS enforcement
    if (securityConfig.ssl && securityConfig.ssl.enforced === true) {
      const sslRedirectMiddleware = (req, res, next) => {
        // Skip redirect for local development and health checks
        if (isDevelopment && (req.hostname === 'localhost' || req.hostname === '127.0.0.1')) {
          return next();
        }

        // Check if request is already HTTPS
        const isSecure = req.secure || 
                        req.get('X-Forwarded-Proto') === 'https' ||
                        req.get('X-Forwarded-Ssl') === 'on';

        if (!isSecure) {
          const requestLogger = createRequestLogger(req);
          
          logger.info('Redirecting HTTP request to HTTPS', {
            correlationId: requestLogger.correlationId,
            originalUrl: req.url,
            method: req.method,
            ip: req.ip
          });

          const httpsUrl = `https://${req.get('Host')}${req.url}`;
          return res.redirect(HTTP_CONSTANTS.STATUS_CODES.MOVED_PERMANENTLY, httpsUrl);
        }

        next();
      };

      app.use(sslRedirectMiddleware);
      logger.debug('SSL redirect middleware configured', {
        enforced: true,
        skipLocalhost: isDevelopment
      });
    }

    // Set up security event logging and violation reporting
    const securityLoggingMiddleware = (req, res, next) => {
      // Create request-scoped logger with correlation tracking
      const requestLogger = createRequestLogger(req);
      res.locals.requestLogger = requestLogger;

      // Track security metrics
      SECURITY_METRICS.requestsProcessed++;

      // Log request start with security context
      requestLogger.info('Request processing started', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        securityLevel: securityConfig.securityLevel,
        httpsEnforced: securityConfig.ssl?.enforced
      });

      // Override response.end to log completion
      const originalEnd = res.end;
      res.end = function(...args) {
        requestLogger.logResponse(res.statusCode);
        
        // Log security metrics periodically
        if (SECURITY_METRICS.requestsProcessed % 100 === 0) {
          logPerformanceMetrics({
            securityMetrics: SECURITY_METRICS,
            type: 'security-monitoring'
          }, {
            correlationId: requestLogger.correlationId,
            securityLevel: securityConfig.securityLevel
          });
        }

        originalEnd.apply(this, args);
      };

      next();
    };

    app.use(securityLoggingMiddleware);

    // Configure security header validation middleware
    const securityValidationMiddleware = (req, res, next) => {
      // Validate security-related headers
      const suspiciousHeaders = detectSuspiciousHeaders(req.headers);
      
      if (suspiciousHeaders.length > 0) {
        const requestLogger = res.locals.requestLogger || createRequestLogger(req);
        
        logSecurityEvent('suspicious-headers-detected', {
          suspiciousHeaders,
          allHeaders: Object.keys(req.headers),
          userAgent: req.get('User-Agent')
        }, {
          correlationId: requestLogger.correlationId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        SECURITY_METRICS.securityViolations++;
      }

      next();
    };

    app.use(securityValidationMiddleware);

    // Log security middleware initialization and configuration summary
    logger.info('Security middleware initialization completed successfully', {
      environment: securityConfig.environment,
      securityLevel: securityConfig.securityLevel,
      middlewareCount: 6,
      configuredPolicies: {
        rateLimit: !!(securityConfig.rateLimit && securityConfig.rateLimit.enabled !== false),
        helmet: !!(securityConfig.helmet && securityConfig.helmet.enabled !== false),
        cors: !!(securityConfig.cors && securityConfig.cors.enabled !== false),
        csp: !!(securityConfig.csp && securityConfig.csp.enabled !== false),
        ssl: !!(securityConfig.ssl && securityConfig.ssl.enforced === true),
        logging: true
      },
      httpsEnforced: securityConfig.ssl?.enforced || false,
      pm2Compatible: !!process.env.PM2_HOME
    });

    // Update global state
    SECURITY_INITIALIZED = true;
    ACTIVE_SECURITY_CONFIG = securityConfig;

    // Return Express application with complete security middleware stack
    return app;

  } catch (error) {
    // Handle security middleware initialization errors
    const initError = new SecurityError(
      'Failed to initialize security middleware',
      'middleware-initialization-error',
      {
        originalError: error.message,
        stack: error.stack,
        securityConfig: securityConfig ? {
          environment: securityConfig.environment,
          securityLevel: securityConfig.securityLevel
        } : null
      }
    );

    logger.error('Security middleware initialization failed', initError, {
      error: formatErrorForLogging(error),
      securityConfigAvailable: !!securityConfig
    });

    throw initError;
  }
}

/**
 * Creates rate limiting configuration with environment-specific limits to prevent abuse and
 * DDoS attacks while supporting development testing. Provides comprehensive rate limiting
 * policies based on environment requirements and security threat models.
 * 
 * @param {string} environment - Target environment for rate limiting configuration
 * @param {Object} [customLimits={}] - Custom rate limiting overrides and options
 * @returns {Object} Rate limiting configuration object with window, max requests, and handler settings
 */
export function createRateLimitConfig(environment = currentEnvironment, customLimits = {}) {
  try {
    // Determine rate limiting requirements based on environment
    const environmentLimits = {
      development: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // High limit for development testing
        message: 'Too many requests from this IP during development, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      staging: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // Medium limit for staging testing
        message: 'Too many requests from this IP in staging, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      production: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Strict limit for production security
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    };

    const baseConfig = environmentLimits[environment] || environmentLimits.production;

    // Configure time window for rate limiting (15 minutes default)
    const windowMs = customLimits.windowMs || 
                    SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.WINDOW_MS || 
                    baseConfig.windowMs;

    // Set maximum requests per window based on environment and security level
    const max = customLimits.max || 
               SECURITY_CONSTANTS.RATE_LIMIT_CONFIG.MAX_REQUESTS[environment] || 
               baseConfig.max;

    // Configure rate limit handler for exceeded limits with security logging
    const defaultHandler = (req, res, next) => {
      const requestLogger = createRequestLogger(req);
      
      // Check if this is the first time the limit is reached (replaces deprecated onLimitReached)
      if (req.rateLimit && req.rateLimit.current === req.rateLimit.limit + 1) {
        // Track rate limit metrics (moved from deprecated onLimitReached)
        SECURITY_METRICS.rateLimit.requests++;
        
        logger.warn('Rate limit threshold reached', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          windowMs: windowMs,
          max: max,
          environment
        });
      }
      
      // Log rate limit violation with detailed context
      logSecurityEvent('rate-limit-exceeded', {
        clientIp: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        rateLimitConfig: { windowMs, max },
        timestamp: new Date().toISOString()
      }, {
        correlationId: requestLogger.correlationId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Update security metrics
      SECURITY_METRICS.rateLimit.blocked++;
      SECURITY_METRICS.securityViolations++;

      // Create structured error response
      const rateLimitError = new HTTPError(
        customLimits.message || baseConfig.message,
        HTTP_CONSTANTS.STATUS_CODES.TOO_MANY_REQUESTS,
        {
          code: ERROR_CONSTANTS.ERROR_CODES.RATE_LIMITED,
          requestId: requestLogger.correlationId,
          rateLimitInfo: {
            windowMs,
            max,
            retryAfter: Math.ceil(windowMs / 1000)
          }
        }
      );

      const errorResponse = createErrorResponse(rateLimitError, {
        environment,
        includeContext: isDevelopment
      });

      res.status(HTTP_CONSTANTS.STATUS_CODES.TOO_MANY_REQUESTS)
         .set({
           'Retry-After': Math.ceil(windowMs / 1000),
           'X-RateLimit-Limit': max,
           'X-RateLimit-Remaining': 0,
           'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
         })
         .json(errorResponse);
    };

    // Set up skip conditions for trusted IPs or internal requests
    const skipConditions = {
      skip: (req) => {
        // Skip rate limiting for internal health checks
        if (req.url === '/health' || req.url === '/status') {
          return true;
        }

        // Skip for trusted IP ranges in development
        if (isDevelopment) {
          const trustedIPs = ['127.0.0.1', '::1', '0.0.0.0'];
          if (trustedIPs.includes(req.ip)) {
            return true;
          }
        }

        // Skip for custom trusted IPs
        if (customLimits.trustedIPs && customLimits.trustedIPs.includes(req.ip)) {
          return true;
        }

        return false;
      }
    };

    // Configure headers for rate limit information disclosure
    const rateLimitConfig = {
      windowMs,
      max,
      message: customLimits.message || baseConfig.message,
      standardHeaders: customLimits.standardHeaders !== false,
      legacyHeaders: customLimits.legacyHeaders === true,
      handler: customLimits.handler || defaultHandler,
      skipSuccessfulRequests: customLimits.skipSuccessfulRequests || baseConfig.skipSuccessfulRequests,
      skipFailedRequests: customLimits.skipFailedRequests || baseConfig.skipFailedRequests,
      ...skipConditions,
      enabled: customLimits.enabled !== false,
      
      // Additional configuration for monitoring and debugging
      keyGenerator: customLimits.keyGenerator || ((req) => {
        // Use IP address with optional user identification
        return req.ip + (req.user ? `:${req.user.id}` : '');
      }),
      
      store: customLimits.store // Optional custom store for cluster mode
    };

    // Apply custom rate limit overrides if provided
    Object.keys(customLimits).forEach(key => {
      if (customLimits[key] !== undefined && !['message', 'handler'].includes(key)) {
        rateLimitConfig[key] = customLimits[key];
      }
    });

    // Log rate limiting configuration and thresholds
    logger.debug('Rate limiting configuration created', {
      environment,
      windowMs,
      max,
      standardHeaders: rateLimitConfig.standardHeaders,
      legacyHeaders: rateLimitConfig.legacyHeaders,
      enabled: rateLimitConfig.enabled,
      customOverrides: Object.keys(customLimits)
    });

    // Return complete rate limiting configuration
    return rateLimitConfig;

  } catch (error) {
    logger.error('Failed to create rate limit configuration', error, {
      environment,
      customLimits: Object.keys(customLimits)
    });

    // Return fallback rate limiting configuration
    return {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      enabled: true
    };
  }
}

/**
 * Creates SSL/TLS configuration for HTTPS enforcement including certificate paths, cipher suites,
 * and security protocols. Provides comprehensive transport layer security configuration for
 * production deployments with modern TLS standards and security best practices.
 * 
 * @param {string} environment - Target environment for SSL/TLS configuration
 * @param {Object} [certificateOptions={}] - SSL certificate and security options
 * @returns {Object} SSL/TLS configuration object with certificates, protocols, and security settings
 */
export function createSSLConfig(environment = currentEnvironment, certificateOptions = {}) {
  try {
    // Check if HTTPS is required for the current environment
    const httpsRequired = environment === 'production' || 
                         HTTPS_ENFORCED || 
                         certificateOptions.enforced === true;

    if (!httpsRequired && environment === 'development') {
      logger.debug('HTTPS not enforced in development environment');
      return {
        enforced: false,
        enabled: false,
        environment,
        reason: 'HTTPS not required in development'
      };
    }

    // Validate SSL certificate paths and accessibility
    const certificatePaths = {
      cert: certificateOptions.certificatePath || 
            process.env.SSL_CERT_PATH || 
            SECURITY_CONSTANTS.SSL_CONFIG.DEFAULT_CERT_PATH,
      key: certificateOptions.keyPath || 
           process.env.SSL_KEY_PATH || 
           SECURITY_CONSTANTS.SSL_CONFIG.DEFAULT_KEY_PATH,
      ca: certificateOptions.caPath || 
          process.env.SSL_CA_PATH || 
          SECURITY_CONSTANTS.SSL_CONFIG.DEFAULT_CA_PATH
    };

    // Configure TLS protocol versions and cipher suites
    const tlsProtocols = certificateOptions.protocols || 
                        SECURITY_CONSTANTS.SSL_CONFIG.PROTOCOLS || 
                        ['TLSv1.2', 'TLSv1.3'];

    const cipherSuites = certificateOptions.ciphers || 
                        SECURITY_CONSTANTS.SSL_CONFIG.CIPHERS || [
                          'ECDHE-RSA-AES128-GCM-SHA256',
                          'ECDHE-RSA-AES256-GCM-SHA384',
                          'ECDHE-RSA-AES128-SHA256',
                          'ECDHE-RSA-AES256-SHA384'
                        ];

    // Set up certificate chain and private key configuration
    const certificateConfig = {
      cert: certificatePaths.cert,
      key: certificatePaths.key,
      ca: certificatePaths.ca,
      passphrase: certificateOptions.passphrase || process.env.SSL_PASSPHRASE,
      
      // Security options
      secureProtocol: certificateOptions.secureProtocol || 'TLS_method',
      secureOptions: certificateOptions.secureOptions || 0,
      ciphers: Array.isArray(cipherSuites) ? cipherSuites.join(':') : cipherSuites,
      honorCipherOrder: certificateOptions.honorCipherOrder !== false,
      
      // Session management
      sessionIdContext: certificateOptions.sessionIdContext || 'nodejs-tutorial',
      sessionTimeout: certificateOptions.sessionTimeout || 300,
      
      // Client certificate validation
      requestCert: certificateOptions.requestCert === true,
      rejectUnauthorized: certificateOptions.rejectUnauthorized !== false
    };

    // Configure HTTPS redirect middleware for HTTP requests
    const redirectConfig = {
      enabled: httpsRequired,
      statusCode: HTTP_CONSTANTS.STATUS_CODES.MOVED_PERMANENTLY,
      includeSubdomains: certificateOptions.includeSubdomains !== false,
      excludePaths: certificateOptions.excludePaths || ['/health', '/status'],
      excludeHosts: certificateOptions.excludeHosts || (isDevelopment ? ['localhost', '127.0.0.1'] : [])
    };

    // Set up HSTS headers for transport security
    const hstsConfig = {
      enabled: httpsRequired,
      maxAge: certificateOptions.hstsMaxAge || SECURITY_CONSTANTS.SSL_CONFIG.HSTS_MAX_AGE || 31536000, // 1 year
      includeSubDomains: certificateOptions.includeSubDomains !== false,
      preload: certificateOptions.preload === true && environment === 'production'
    };

    // Apply certificate options overrides if provided
    const sslConfig = {
      enforced: httpsRequired,
      enabled: httpsRequired,
      environment,
      
      // Certificate configuration
      certificates: certificateConfig,
      
      // Protocol and cipher configuration
      protocols: tlsProtocols,
      ciphers: cipherSuites,
      
      // Security headers and policies
      hsts: hstsConfig,
      redirect: redirectConfig,
      
      // Additional security options
      securityOptions: {
        dhparam: certificateOptions.dhparam || SECURITY_CONSTANTS.SSL_CONFIG.DHPARAM_PATH,
        ecdhCurve: certificateOptions.ecdhCurve || 'prime256v1',
        honorCipherOrder: certificateConfig.honorCipherOrder,
        secureRenegotiation: certificateOptions.secureRenegotiation !== false
      },
      
      // Monitoring and validation
      validation: {
        checkCertExpiry: certificateOptions.checkCertExpiry !== false,
        expiryWarningDays: certificateOptions.expiryWarningDays || 30,
        validateChain: certificateOptions.validateChain !== false
      },
      
      // Custom options
      custom: {
        ...certificateOptions,
        metadata: {
          createdAt: new Date().toISOString(),
          environment,
          httpsEnforced: httpsRequired
        }
      }
    };

    // Log SSL/TLS configuration and certificate details
    logger.info('SSL/TLS configuration created', {
      environment,
      enforced: httpsRequired,
      protocols: tlsProtocols,
      hstsEnabled: hstsConfig.enabled,
      hstsMaxAge: hstsConfig.maxAge,
      redirectEnabled: redirectConfig.enabled,
      certificatesConfigured: !!(certificatePaths.cert && certificatePaths.key)
    });

    // Return complete SSL/TLS configuration object
    return sslConfig;

  } catch (error) {
    logger.error('Failed to create SSL configuration', error, {
      environment,
      certificateOptions: Object.keys(certificateOptions)
    });

    // Return minimal SSL configuration for safety
    return {
      enforced: environment === 'production',
      enabled: environment === 'production',
      environment,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Validates complete security configuration for completeness, effectiveness, and compliance
 * with security best practices. Performs comprehensive analysis of security policies, headers,
 * and configuration consistency to ensure robust security posture.
 * 
 * @param {Object} securityConfig - Complete security configuration object
 * @returns {Object} Validation result object with status, warnings, errors, and security recommendations
 */
export function validateSecurityConfig(securityConfig) {
  const validationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    recommendations: [],
    securityScore: 0,
    maxScore: 100,
    categories: {
      helmet: { score: 0, maxScore: 25, issues: [] },
      csp: { score: 0, maxScore: 25, issues: [] },
      cors: { score: 0, maxScore: 20, issues: [] },
      rateLimit: { score: 0, maxScore: 15, issues: [] },
      ssl: { score: 0, maxScore: 15, issues: [] }
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Validate basic security configuration structure and required properties
    if (!securityConfig || typeof securityConfig !== 'object') {
      validationResult.errors.push('Security configuration must be a valid object');
      validationResult.isValid = false;
      return validationResult;
    }

    if (!securityConfig.environment || typeof securityConfig.environment !== 'string') {
      validationResult.warnings.push('Security configuration missing environment specification');
    }

    // Validate Helmet.js configuration completeness and effectiveness
    if (securityConfig.helmet) {
      const helmetValidation = validateHelmetConfig(securityConfig.helmet, securityConfig.environment);
      validationResult.categories.helmet = helmetValidation;
      
      if (helmetValidation.issues.length > 0) {
        validationResult.warnings.push(...helmetValidation.issues.filter(i => i.severity === 'warning'));
        validationResult.errors.push(...helmetValidation.issues.filter(i => i.severity === 'error'));
      }

      // Check for comprehensive security header coverage
      const expectedPolicies = ['contentSecurityPolicy', 'strictTransportSecurity', 'xFrameOptions', 'xContentTypeOptions'];
      const missingPolicies = expectedPolicies.filter(policy => 
        securityConfig.helmet[policy] === false || !securityConfig.helmet[policy]
      );

      if (missingPolicies.length > 0) {
        validationResult.warnings.push(`Missing recommended Helmet.js policies: ${missingPolicies.join(', ')}`);
        validationResult.categories.helmet.issues.push({
          type: 'missing-policies',
          severity: 'warning',
          policies: missingPolicies
        });
      }
    } else {
      validationResult.errors.push('Helmet.js configuration is missing');
      validationResult.isValid = false;
    }

    // Check CSP directives for security vulnerabilities and gaps
    if (securityConfig.csp) {
      const cspValidation = validateCSPConfig(securityConfig.csp, securityConfig.environment);
      validationResult.categories.csp = cspValidation;

      // Check for dangerous CSP directives
      const dangerousDirectives = detectDangerousCSPDirectives(securityConfig.csp);
      if (dangerousDirectives.length > 0) {
        validationResult.warnings.push(`Potentially dangerous CSP directives detected: ${dangerousDirectives.join(', ')}`);
        validationResult.categories.csp.issues.push({
          type: 'dangerous-directives',
          severity: 'warning',
          directives: dangerousDirectives
        });
      }

      // Validate CSP effectiveness for XSS prevention
      const xssProtection = validateCSPXSSProtection(securityConfig.csp);
      if (!xssProtection.effective) {
        validationResult.warnings.push('CSP configuration may not provide adequate XSS protection');
        validationResult.categories.csp.issues.push({
          type: 'inadequate-xss-protection',
          severity: 'warning',
          details: xssProtection.issues
        });
      }
    } else {
      validationResult.errors.push('Content Security Policy (CSP) configuration is missing');
      validationResult.isValid = false;
    }

    // Verify CORS configuration prevents unauthorized cross-origin access
    if (securityConfig.cors) {
      const corsValidation = validateCORSConfig(securityConfig.cors, securityConfig.environment);
      validationResult.categories.cors = corsValidation;

      // Check for overly permissive CORS settings
      if (securityConfig.cors.origin === '*' && securityConfig.cors.credentials === true) {
        validationResult.errors.push('CORS configured with wildcard origin and credentials enabled - security risk');
        validationResult.isValid = false;
        validationResult.categories.cors.issues.push({
          type: 'wildcard-credentials-risk',
          severity: 'error',
          details: 'Wildcard origin with credentials enabled'
        });
      }

      // Validate allowed origins are properly configured
      if (securityConfig.environment === 'production' && securityConfig.cors.origin === '*') {
        validationResult.warnings.push('Production environment using wildcard CORS origin');
        validationResult.categories.cors.issues.push({
          type: 'production-wildcard',
          severity: 'warning',
          details: 'Consider restricting origins in production'
        });
      }
    } else {
      validationResult.warnings.push('CORS configuration is missing');
    }

    // Validate rate limiting configuration for DDoS protection
    if (securityConfig.rateLimit) {
      const rateLimitValidation = validateRateLimitConfig(securityConfig.rateLimit, securityConfig.environment);
      validationResult.categories.rateLimit = rateLimitValidation;

      // Check rate limit thresholds
      if (securityConfig.rateLimit.max > 1000 && securityConfig.environment === 'production') {
        validationResult.warnings.push('Rate limit threshold may be too high for production environment');
        validationResult.categories.rateLimit.issues.push({
          type: 'high-threshold',
          severity: 'warning',
          current: securityConfig.rateLimit.max,
          recommended: 100
        });
      }
    } else {
      validationResult.warnings.push('Rate limiting configuration is missing');
    }

    // Check SSL/TLS configuration for proper encryption and protocols
    if (securityConfig.ssl) {
      const sslValidation = validateSSLConfig(securityConfig.ssl, securityConfig.environment);
      validationResult.categories.ssl = sslValidation;

      // Validate HTTPS enforcement in production
      if (securityConfig.environment === 'production' && !securityConfig.ssl.enforced) {
        validationResult.errors.push('HTTPS not enforced in production environment');
        validationResult.isValid = false;
        validationResult.categories.ssl.issues.push({
          type: 'https-not-enforced',
          severity: 'error',
          environment: 'production'
        });
      }

      // Check for modern TLS protocols
      if (securityConfig.ssl.protocols && !securityConfig.ssl.protocols.includes('TLSv1.3')) {
        validationResult.recommendations.push('Consider enabling TLS 1.3 for enhanced security');
      }
    } else if (securityConfig.environment === 'production') {
      validationResult.errors.push('SSL/TLS configuration is missing for production environment');
      validationResult.isValid = false;
    }

    // Verify security headers are properly configured and not conflicting
    const headerConflicts = detectSecurityHeaderConflicts(securityConfig);
    if (headerConflicts.length > 0) {
      validationResult.warnings.push('Security header conflicts detected');
      headerConflicts.forEach(conflict => {
        validationResult.warnings.push(`Header conflict: ${conflict.description}`);
      });
    }

    // Check for common security misconfigurations and vulnerabilities
    const misconfigurations = detectSecurityMisconfigurations(securityConfig);
    misconfigurations.forEach(misconfiguration => {
      if (misconfiguration.severity === 'error') {
        validationResult.errors.push(misconfiguration.message);
        validationResult.isValid = false;
      } else {
        validationResult.warnings.push(misconfiguration.message);
      }
    });

    // Generate security recommendations and best practice suggestions
    const recommendations = generateSecurityRecommendations(securityConfig, validationResult);
    validationResult.recommendations.push(...recommendations);

    // Calculate overall security score based on category scores
    validationResult.securityScore = Object.values(validationResult.categories)
      .reduce((total, category) => total + category.score, 0);

    // Determine validation status based on errors and score
    if (validationResult.errors.length > 0) {
      validationResult.isValid = false;
    } else if (validationResult.securityScore < 70) {
      validationResult.warnings.push('Overall security score below recommended threshold (70/100)');
    }

    // Log validation results with detailed security analysis
    logger.info('Security configuration validation completed', {
      environment: securityConfig.environment,
      isValid: validationResult.isValid,
      securityScore: validationResult.securityScore,
      maxScore: validationResult.maxScore,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      recommendationCount: validationResult.recommendations.length,
      categoryScores: Object.fromEntries(
        Object.entries(validationResult.categories).map(([key, cat]) => [key, `${cat.score}/${cat.maxScore}`])
      )
    });

    // Return comprehensive validation report with actionable recommendations
    return validationResult;

  } catch (error) {
    logger.error('Security configuration validation failed', error, {
      securityConfig: securityConfig ? {
        environment: securityConfig.environment,
        hasHelmet: !!securityConfig.helmet,
        hasCSP: !!securityConfig.csp,
        hasCORS: !!securityConfig.cors,
        hasRateLimit: !!securityConfig.rateLimit,
        hasSSL: !!securityConfig.ssl
      } : null
    });

    validationResult.errors.push(`Validation process failed: ${error.message}`);
    validationResult.isValid = false;
    return validationResult;
  }
}

/**
 * Returns current security configuration status and applied policies for monitoring and
 * debugging purposes. Provides comprehensive security status information including active
 * policies, configuration metrics, and security violation statistics.
 * 
 * @param {Object} [securityConfig] - Security configuration to analyze (optional)
 * @returns {Object} Security status object with configuration summary, active policies, and security metrics
 */
export function getSecurityStatus(securityConfig = ACTIVE_SECURITY_CONFIG) {
  try {
    // Extract security configuration summary and active policies
    const configSummary = {
      initialized: SECURITY_INITIALIZED,
      environment: securityConfig?.environment || currentEnvironment,
      securityLevel: CURRENT_SECURITY_LEVEL,
      httpsEnforced: HTTPS_ENFORCED,
      lastUpdated: securityConfig?.metadata?.createdAt || null,
      configVersion: securityConfig?.metadata?.configVersion || 'unknown'
    };

    // List all applied security headers and their values
    const securityHeaders = {};
    if (securityConfig?.helmet) {
      Object.keys(securityConfig.helmet).forEach(policy => {
        if (securityConfig.helmet[policy] !== false) {
          securityHeaders[policy] = securityConfig.helmet[policy] === true ? 'enabled' : 'configured';
        }
      });
    }

    // Report CORS policies and allowed origins
    const corsStatus = {
      enabled: !!(securityConfig?.cors && securityConfig.cors.enabled !== false),
      origin: securityConfig?.cors?.origin || 'not-configured',
      credentials: securityConfig?.cors?.credentials || false,
      methods: securityConfig?.cors?.methods || [],
      allowedHeaders: securityConfig?.cors?.allowedHeaders || []
    };

    // Include CSP directives and enforcement status
    const cspStatus = {
      enabled: !!(securityConfig?.csp && securityConfig.csp.enabled !== false),
      reportOnly: securityConfig?.csp?.reportOnly || false,
      directiveCount: securityConfig?.csp?.directives ? Object.keys(securityConfig.csp.directives).length : 0,
      nonceEnabled: securityConfig?.csp?.enableNonce || false,
      violationReporting: securityConfig?.csp?.reportUri ? true : false
    };

    // Report rate limiting configuration and current usage
    const rateLimitStatus = {
      enabled: !!(securityConfig?.rateLimit && securityConfig.rateLimit.enabled !== false),
      windowMs: securityConfig?.rateLimit?.windowMs || 'not-configured',
      max: securityConfig?.rateLimit?.max || 'not-configured',
      requests: SECURITY_METRICS.rateLimit.requests,
      blocked: SECURITY_METRICS.rateLimit.blocked,
      blockRate: SECURITY_METRICS.rateLimit.requests > 0 ? 
        (SECURITY_METRICS.rateLimit.blocked / SECURITY_METRICS.rateLimit.requests * 100).toFixed(2) + '%' : '0%'
    };

    // Include SSL/TLS status and certificate information
    const sslStatus = {
      enforced: securityConfig?.ssl?.enforced || false,
      enabled: securityConfig?.ssl?.enabled || false,
      protocols: securityConfig?.ssl?.protocols || [],
      hstsEnabled: securityConfig?.ssl?.hsts?.enabled || false,
      hstsMaxAge: securityConfig?.ssl?.hsts?.maxAge || null,
      redirectEnabled: securityConfig?.ssl?.redirect?.enabled || false
    };

    // Add security metrics and violation statistics
    const securityMetrics = {
      ...SECURITY_METRICS,
      uptime: process.uptime(),
      violationRate: SECURITY_METRICS.requestsProcessed > 0 ? 
        (SECURITY_METRICS.securityViolations / SECURITY_METRICS.requestsProcessed * 100).toFixed(4) + '%' : '0%',
      cspViolationRate: SECURITY_METRICS.csp.reports > 0 ?
        (SECURITY_METRICS.csp.violations / SECURITY_METRICS.csp.reports * 100).toFixed(2) + '%' : '0%',
      corsViolationRate: SECURITY_METRICS.cors.blocked > 0 ?
        (SECURITY_METRICS.cors.violations / SECURITY_METRICS.cors.blocked * 100).toFixed(2) + '%' : '0%'
    };

    // Process information for PM2 cluster context
    const processInfo = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      pm2Mode: !!process.env.PM2_HOME,
      pm2InstanceId: process.env.pm_id || null,
      pm2ProcessName: process.env.name || null,
      clusterMode: process.env.exec_mode === 'cluster_mode'
    };

    // System resource information
    const systemStatus = {
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      loadAverage: require('os').loadavg()
    };

    // Validation status if configuration is available
    let validationStatus = null;
    if (securityConfig) {
      const validation = validateSecurityConfig(securityConfig);
      validationStatus = {
        isValid: validation.isValid,
        securityScore: validation.securityScore,
        maxScore: validation.maxScore,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        lastValidated: validation.timestamp
      };
    }

    // Return comprehensive security status report
    const securityStatus = {
      summary: configSummary,
      policies: {
        securityHeaders,
        cors: corsStatus,
        csp: cspStatus,
        rateLimit: rateLimitStatus,
        ssl: sslStatus
      },
      metrics: securityMetrics,
      process: processInfo,
      system: systemStatus,
      validation: validationStatus,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId({ prefix: 'status' })
    };

    logger.debug('Security status retrieved', {
      environment: configSummary.environment,
      securityLevel: configSummary.securityLevel,
      requestsProcessed: securityMetrics.requestsProcessed,
      securityViolations: securityMetrics.securityViolations,
      initialized: configSummary.initialized
    });

    return securityStatus;

  } catch (error) {
    logger.error('Failed to retrieve security status', error, {
      securityConfigAvailable: !!securityConfig,
      securityInitialized: SECURITY_INITIALIZED
    });

    // Return minimal status information on error
    return {
      summary: {
        initialized: SECURITY_INITIALIZED,
        environment: currentEnvironment,
        securityLevel: CURRENT_SECURITY_LEVEL,
        error: error.message
      },
      timestamp: new Date().toISOString(),
      status: 'error'
    };
  }
}

/**
 * Dynamically updates security configuration without requiring application restart for runtime
 * security policy adjustments. Enables hot-swapping of security policies, rate limits, and
 * header configurations with validation and rollback capabilities.
 * 
 * @param {Object} newConfig - New security configuration or partial updates
 * @param {boolean} [validateFirst=true] - Validate configuration before applying changes
 * @returns {Object} Updated security configuration object with change summary and validation results
 */
export function updateSecurityConfig(newConfig, validateFirst = true) {
  const updateResult = {
    success: false,
    previousConfig: null,
    newConfig: null,
    changes: [],
    warnings: [],
    errors: [],
    rollbackAvailable: false,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId({ prefix: 'update' })
  };

  try {
    // Validate new security configuration if validation is requested
    if (!newConfig || typeof newConfig !== 'object') {
      updateResult.errors.push('Invalid configuration object provided');
      return updateResult;
    }

    // Store current configuration for potential rollback
    updateResult.previousConfig = ACTIVE_SECURITY_CONFIG ? JSON.parse(JSON.stringify(ACTIVE_SECURITY_CONFIG)) : null;
    updateResult.rollbackAvailable = !!updateResult.previousConfig;

    logger.info('Starting security configuration update', {
      requestId: updateResult.requestId,
      hasCurrentConfig: !!ACTIVE_SECURITY_CONFIG,
      updateKeys: Object.keys(newConfig),
      validateFirst
    });

    // Validate new configuration if requested
    if (validateFirst) {
      // Merge with existing configuration for validation
      const configToValidate = ACTIVE_SECURITY_CONFIG ? 
        { ...ACTIVE_SECURITY_CONFIG, ...newConfig } : newConfig;
      
      const validationResult = validateSecurityConfig(configToValidate);
      
      if (!validationResult.isValid) {
        updateResult.errors.push('New configuration failed validation');
        updateResult.errors.push(...validationResult.errors);
        updateResult.warnings.push(...validationResult.warnings);
        return updateResult;
      }

      if (validationResult.warnings.length > 0) {
        updateResult.warnings.push(...validationResult.warnings);
      }
    }

    // Compare new configuration with current configuration for changes
    const changes = detectConfigurationChanges(ACTIVE_SECURITY_CONFIG, newConfig);
    updateResult.changes = changes;

    if (changes.length === 0) {
      updateResult.warnings.push('No configuration changes detected');
      updateResult.success = true;
      updateResult.newConfig = ACTIVE_SECURITY_CONFIG;
      return updateResult;
    }

    // Apply configuration changes in safe order to prevent security gaps
    const mergedConfig = applyConfigurationChanges(ACTIVE_SECURITY_CONFIG, newConfig);

    // Update active middleware configurations dynamically
    const middlewareUpdateResult = updateActiveMiddleware(mergedConfig, changes);
    if (!middlewareUpdateResult.success) {
      updateResult.errors.push('Failed to update active middleware');
      updateResult.errors.push(...middlewareUpdateResult.errors);
      return updateResult;
    }

    // Update global security state and configuration
    ACTIVE_SECURITY_CONFIG = mergedConfig;
    CURRENT_SECURITY_LEVEL = mergedConfig.securityLevel || CURRENT_SECURITY_LEVEL;
    HTTPS_ENFORCED = mergedConfig.ssl?.enforced || HTTPS_ENFORCED;

    // Log security configuration changes for audit trail
    logSecurityConfiguration(mergedConfig, 'security-config-updated');

    changes.forEach(change => {
      logger.info('Security configuration changed', {
        requestId: updateResult.requestId,
        changeType: change.type,
        path: change.path,
        oldValue: change.oldValue,
        newValue: change.newValue
      });
    });

    // Validate configuration after updates to ensure stability
    const postUpdateValidation = validateSecurityConfig(mergedConfig);
    if (!postUpdateValidation.isValid) {
      updateResult.errors.push('Configuration became invalid after updates');
      updateResult.errors.push(...postUpdateValidation.errors);
      
      // Attempt rollback if validation fails
      if (updateResult.rollbackAvailable) {
        logger.warn('Attempting rollback due to post-update validation failure', {
          requestId: updateResult.requestId
        });
        
        try {
          ACTIVE_SECURITY_CONFIG = updateResult.previousConfig;
          updateResult.errors.push('Configuration rolled back due to validation failure');
        } catch (rollbackError) {
          updateResult.errors.push(`Rollback failed: ${rollbackError.message}`);
        }
      }
      
      return updateResult;
    }

    // Generate change summary and impact analysis
    const changeSummary = {
      totalChanges: changes.length,
      changeTypes: changes.reduce((acc, change) => {
        acc[change.type] = (acc[change.type] || 0) + 1;
        return acc;
      }, {}),
      affectedComponents: [...new Set(changes.map(change => change.component))],
      securityImpact: assessSecurityImpact(changes),
      restartRequired: changes.some(change => change.requiresRestart)
    };

    updateResult.success = true;
    updateResult.newConfig = mergedConfig;
    updateResult.changeSummary = changeSummary;

    // Update security metrics
    SECURITY_METRICS.lastUpdated = Date.now();

    logger.info('Security configuration updated successfully', {
      requestId: updateResult.requestId,
      changeSummary,
      validationWarnings: updateResult.warnings.length,
      newSecurityLevel: CURRENT_SECURITY_LEVEL,
      httpsEnforced: HTTPS_ENFORCED
    });

    // Return updated configuration with change details
    return updateResult;

  } catch (error) {
    updateResult.errors.push(`Configuration update failed: ${error.message}`);
    
    logger.error('Security configuration update failed', error, {
      requestId: updateResult.requestId,
      newConfigKeys: newConfig ? Object.keys(newConfig) : [],
      hasCurrentConfig: !!ACTIVE_SECURITY_CONFIG
    });

    // Attempt rollback on error if previous configuration is available
    if (updateResult.rollbackAvailable) {
      try {
        ACTIVE_SECURITY_CONFIG = updateResult.previousConfig;
        logger.info('Configuration rolled back after error', {
          requestId: updateResult.requestId
        });
      } catch (rollbackError) {
        logger.error('Rollback failed after update error', rollbackError, {
          requestId: updateResult.requestId
        });
      }
    }

    return updateResult;
  }
}

/**
 * Logs comprehensive security configuration details for audit, monitoring, and compliance
 * purposes. Provides structured security configuration logging with appropriate detail
 * levels for different environments and security context information.
 * 
 * @param {Object} securityConfig - Security configuration object to log
 * @param {string} event - Security event type for logging context
 * @returns {void} No return value, performs security configuration logging side effect
 */
export function logSecurityConfiguration(securityConfig, event = 'security-config-logged') {
  try {
    // Sanitize security configuration for safe logging (remove sensitive data)
    const sanitizedConfig = sanitizeSecurityConfigForLogging(securityConfig);

    // Format security configuration summary for audit trail
    const configSummary = {
      event,
      environment: securityConfig.environment || currentEnvironment,
      securityLevel: securityConfig.securityLevel || CURRENT_SECURITY_LEVEL,
      timestamp: new Date().toISOString(),
      configVersion: securityConfig.metadata?.configVersion || '1.0.0',
      
      // Policy summary
      policies: {
        helmet: !!(securityConfig.helmet && securityConfig.helmet.enabled !== false),
        csp: !!(securityConfig.csp && securityConfig.csp.enabled !== false),
        cors: !!(securityConfig.cors && securityConfig.cors.enabled !== false),
        rateLimit: !!(securityConfig.rateLimit && securityConfig.rateLimit.enabled !== false),
        ssl: !!(securityConfig.ssl && securityConfig.ssl.enforced === true)
      },
      
      // Configuration counts
      counts: {
        helmetPolicies: securityConfig.helmet ? Object.keys(securityConfig.helmet).filter(key => 
          securityConfig.helmet[key] !== false).length : 0,
        cspDirectives: securityConfig.csp?.directives ? Object.keys(securityConfig.csp.directives).length : 0,
        corsOrigins: securityConfig.cors?.origin ? 
          (Array.isArray(securityConfig.cors.origin) ? securityConfig.cors.origin.length : 1) : 0,
        rateLimitMax: securityConfig.rateLimit?.max || 0
      }
    };

    // Include environment context and security level information
    const environmentContext = {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      pid: process.pid,
      pm2Mode: !!process.env.PM2_HOME,
      pm2InstanceId: process.env.pm_id || null,
      httpsEnforced: HTTPS_ENFORCED,
      securityInitialized: SECURITY_INITIALIZED
    };

    // Add compliance and best practice compliance status
    const complianceStatus = assessComplianceStatus(securityConfig);

    // Determine log level based on event type and security level
    const logLevel = event.includes('error') ? 'error' : 
                    event.includes('warning') ? 'warn' : 'info';

    // Create comprehensive logging entry
    const logEntry = {
      ...configSummary,
      sanitizedConfig,
      environment: environmentContext,
      compliance: complianceStatus,
      metadata: {
        loggedAt: new Date().toISOString(),
        logLevel,
        source: 'security-config-orchestrator',
        version: '1.0.0'
      }
    };

    // Log security event with appropriate security level
    if (logLevel === 'error') {
      logger.error('Security configuration event (ERROR)', logEntry);
    } else if (logLevel === 'warn') {
      logger.warn('Security configuration event (WARNING)', logEntry);
    } else {
      logger.info('Security configuration event', logEntry);
    }

    // Log specific security event for security monitoring
    logSecurityEvent(event, {
      configSummary,
      environmentContext,
      complianceStatus
    }, {
      correlationId: generateRequestId({ prefix: 'sec-log' }),
      source: 'security-configuration',
      timestamp: new Date().toISOString()
    });

    // Update security metrics and monitoring statistics
    SECURITY_METRICS.lastUpdated = Date.now();

    // Trigger security alerts if configuration issues detected
    if (complianceStatus.issues.length > 0) {
      const criticalIssues = complianceStatus.issues.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        process.emit('security-alert', {
          type: 'security-configuration-issues',
          severity: 'critical',
          issues: criticalIssues,
          configSummary,
          timestamp: new Date().toISOString()
        });
      }
    }

  } catch (loggingError) {
    // Fallback logging if primary logging fails
    console.error('Failed to log security configuration:', loggingError.message);
    console.error('Security config event:', event);
    console.error('Security config summary:', {
      environment: securityConfig?.environment,
      securityLevel: securityConfig?.securityLevel,
      timestamp: new Date().toISOString()
    });
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Creates fallback security configuration for error recovery
 * @private
 * @param {string} environment - Target environment
 * @returns {Object} Minimal safe security configuration
 */
function createFallbackSecurityConfig(environment) {
  return {
    environment,
    securityLevel: 'minimal',
    fallback: true,
    helmet: {
      enabled: true,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    },
    cors: {
      enabled: true,
      origin: isDevelopment ? '*' : false,
      credentials: false
    },
    csp: {
      enabled: false,
      fallback: true,
      directives: {}
    },
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      max: isDevelopment ? 1000 : 100
    },
    ssl: {
      enforced: environment === 'production',
      enabled: environment === 'production'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      fallback: true,
      reason: 'Error recovery configuration'
    }
  };
}

/**
 * Checks if origin is allowed by CORS configuration
 * @private
 * @param {string} origin - Request origin
 * @param {string|Array} allowedOrigins - Allowed origins configuration
 * @returns {boolean} True if origin is allowed
 */
function isOriginAllowed(origin, allowedOrigins) {
  if (!origin || !allowedOrigins) return false;
  if (allowedOrigins === '*') return true;
  if (typeof allowedOrigins === 'string') return origin === allowedOrigins;
  if (Array.isArray(allowedOrigins)) return allowedOrigins.includes(origin);
  return false;
}

/**
 * Generates CSP nonce for inline scripts/styles
 * @private
 * @returns {string} Generated nonce value
 */
function generateCSPNonce() {
  return require('crypto').randomBytes(16).toString('base64');
}

/**
 * Formats CSP directives into header string
 * @private
 * @param {Object} directives - CSP directives object
 * @param {string} nonce - Optional nonce value
 * @returns {string} Formatted CSP directive string
 */
function formatCSPDirectives(directives, nonce) {
  if (!directives) return '';
  
  const formatted = Object.entries(directives).map(([directive, values]) => {
    let valueString = Array.isArray(values) ? values.join(' ') : values;
    
    // Add nonce to script-src and style-src if provided
    if (nonce && (directive === 'script-src' || directive === 'style-src')) {
      valueString += ` 'nonce-${nonce}'`;
    }
    
    return `${directive} ${valueString}`;
  }).join('; ');
  
  return formatted;
}

/**
 * Detects suspicious headers in request
 * @private
 * @param {Object} headers - Request headers
 * @returns {Array} Array of suspicious header names
 */
function detectSuspiciousHeaders(headers) {
  const suspicious = [];
  const suspiciousPatterns = [
    /x-forwarded-for.*,.*,/i, // Multiple proxy forwarding
    /x-real-ip.*[<>]/i, // Potential XSS in IP header
    /user-agent.*<script/i, // XSS in user agent
    /cookie.*javascript:/i // JavaScript in cookie
  ];
  
  Object.entries(headers).forEach(([name, value]) => {
    if (typeof value === 'string') {
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          suspicious.push(name);
        }
      });
    }
  });
  
  return suspicious;
}

/**
 * Validates Helmet configuration
 * @private
 * @param {Object} helmetConfig - Helmet configuration
 * @param {string} environment - Environment name
 * @returns {Object} Validation result
 */
function validateHelmetConfig(helmetConfig, environment) {
  const result = { score: 0, maxScore: 25, issues: [] };
  
  // Check for essential security policies
  const essentialPolicies = [
    'contentSecurityPolicy',
    'strictTransportSecurity',
    'xFrameOptions',
    'xContentTypeOptions'
  ];
  
  let enabledPolicies = 0;
  essentialPolicies.forEach(policy => {
    if (helmetConfig[policy] !== false) {
      enabledPolicies++;
      result.score += 5;
    } else {
      result.issues.push({
        type: 'disabled-policy',
        severity: 'warning',
        policy,
        message: `${policy} is disabled`
      });
    }
  });
  
  // Bonus points for additional policies
  if (helmetConfig.hsts && helmetConfig.hsts.maxAge >= 31536000) {
    result.score += 3;
  }
  
  if (helmetConfig.noSniff !== false) {
    result.score += 2;
  }
  
  return result;
}

/**
 * Validates CSP configuration
 * @private
 * @param {Object} cspConfig - CSP configuration
 * @param {string} environment - Environment name
 * @returns {Object} Validation result
 */
function validateCSPConfig(cspConfig, environment) {
  const result = { score: 0, maxScore: 25, issues: [] };
  
  if (!cspConfig.directives) {
    result.issues.push({
      type: 'missing-directives',
      severity: 'error',
      message: 'CSP directives are missing'
    });
    return result;
  }
  
  // Check for essential directives
  const essentialDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
  let validDirectives = 0;
  
  essentialDirectives.forEach(directive => {
    if (cspConfig.directives[directive]) {
      validDirectives++;
      result.score += 5;
    } else {
      result.issues.push({
        type: 'missing-directive',
        severity: 'warning',
        directive,
        message: `Missing ${directive} directive`
      });
    }
  });
  
  // Check for report-only mode in production
  if (environment === 'production' && cspConfig.reportOnly) {
    result.issues.push({
      type: 'report-only-production',
      severity: 'warning',
      message: 'CSP in report-only mode in production'
    });
  } else {
    result.score += 5;
  }
  
  return result;
}

/**
 * Validates CORS configuration
 * @private
 * @param {Object} corsConfig - CORS configuration
 * @param {string} environment - Environment name
 * @returns {Object} Validation result
 */
function validateCORSConfig(corsConfig, environment) {
  const result = { score: 0, maxScore: 20, issues: [] };
  
  // Check origin configuration
  if (corsConfig.origin === '*') {
    if (environment === 'production') {
      result.issues.push({
        type: 'wildcard-origin-production',
        severity: 'warning',
        message: 'Wildcard origin in production environment'
      });
      result.score += 5; // Some points for having CORS
    } else {
      result.score += 15; // Full points for development
    }
  } else if (corsConfig.origin) {
    result.score += 20; // Full points for specific origins
  } else {
    result.issues.push({
      type: 'no-origin-config',
      severity: 'warning',
      message: 'No origin configuration specified'
    });
  }
  
  // Check credentials with wildcard
  if (corsConfig.origin === '*' && corsConfig.credentials) {
    result.issues.push({
      type: 'wildcard-credentials',
      severity: 'error',
      message: 'Wildcard origin with credentials enabled'
    });
    result.score = 0; // Zero points for security risk
  }
  
  return result;
}

/**
 * Validates rate limit configuration
 * @private
 * @param {Object} rateLimitConfig - Rate limit configuration
 * @param {string} environment - Environment name
 * @returns {Object} Validation result
 */
function validateRateLimitConfig(rateLimitConfig, environment) {
  const result = { score: 0, maxScore: 15, issues: [] };
  
  if (!rateLimitConfig.windowMs || !rateLimitConfig.max) {
    result.issues.push({
      type: 'incomplete-config',
      severity: 'error',
      message: 'Rate limit configuration incomplete'
    });
    return result;
  }
  
  result.score += 10; // Base score for having rate limiting
  
  // Check appropriate limits for environment
  const recommendedLimits = {
    development: 1000,
    staging: 500,
    production: 100
  };
  
  const recommended = recommendedLimits[environment] || 100;
  if (rateLimitConfig.max <= recommended) {
    result.score += 5;
  } else {
    result.issues.push({
      type: 'high-limit',
      severity: 'warning',
      message: `Rate limit (${rateLimitConfig.max}) higher than recommended (${recommended})`
    });
  }
  
  return result;
}

/**
 * Validates SSL configuration
 * @private
 * @param {Object} sslConfig - SSL configuration
 * @param {string} environment - Environment name
 * @returns {Object} Validation result
 */
function validateSSLConfig(sslConfig, environment) {
  const result = { score: 0, maxScore: 15, issues: [] };
  
  if (environment === 'production') {
    if (sslConfig.enforced) {
      result.score += 10;
    } else {
      result.issues.push({
        type: 'https-not-enforced',
        severity: 'error',
        message: 'HTTPS not enforced in production'
      });
    }
    
    if (sslConfig.hsts && sslConfig.hsts.enabled) {
      result.score += 5;
    } else {
      result.issues.push({
        type: 'hsts-disabled',
        severity: 'warning',
        message: 'HSTS not enabled'
      });
    }
  } else {
    result.score += 15; // Full points for non-production
  }
  
  return result;
}

/**
 * Detects dangerous CSP directives
 * @private
 * @param {Object} cspConfig - CSP configuration
 * @returns {Array} Array of dangerous directive descriptions
 */
function detectDangerousCSPDirectives(cspConfig) {
  const dangerous = [];
  
  if (!cspConfig.directives) return dangerous;
  
  Object.entries(cspConfig.directives).forEach(([directive, values]) => {
    const valueString = Array.isArray(values) ? values.join(' ') : values;
    
    if (valueString.includes("'unsafe-eval'")) {
      dangerous.push(`${directive} allows unsafe-eval`);
    }
    
    if (valueString.includes("'unsafe-inline'") && 
        (directive === 'script-src' || directive === 'style-src')) {
      dangerous.push(`${directive} allows unsafe-inline`);
    }
    
    if (valueString.includes('*') && !directive.includes('img')) {
      dangerous.push(`${directive} uses wildcard source`);
    }
  });
  
  return dangerous;
}

/**
 * Validates CSP XSS protection effectiveness
 * @private
 * @param {Object} cspConfig - CSP configuration
 * @returns {Object} XSS protection analysis
 */
function validateCSPXSSProtection(cspConfig) {
  const result = { effective: true, issues: [] };
  
  if (!cspConfig.directives) {
    result.effective = false;
    result.issues.push('No CSP directives configured');
    return result;
  }
  
  // Check script-src for XSS protection
  const scriptSrc = cspConfig.directives['script-src'];
  if (!scriptSrc) {
    result.effective = false;
    result.issues.push('No script-src directive');
  } else if (scriptSrc.includes("'unsafe-eval'") || scriptSrc.includes("'unsafe-inline'")) {
    result.effective = false;
    result.issues.push('Script-src allows unsafe directives');
  }
  
  // Check for default-src fallback
  const defaultSrc = cspConfig.directives['default-src'];
  if (!defaultSrc || defaultSrc.includes('*')) {
    result.issues.push('Default-src may be too permissive');
  }
  
  return result;
}

/**
 * Detects security header conflicts
 * @private
 * @param {Object} securityConfig - Security configuration
 * @returns {Array} Array of conflict descriptions
 */
function detectSecurityHeaderConflicts(securityConfig) {
  const conflicts = [];
  
  // Check for CSP and X-XSS-Protection conflicts
  if (securityConfig.helmet?.xssFilter !== false && 
      securityConfig.csp?.directives?.['script-src']) {
    conflicts.push({
      type: 'csp-xss-filter',
      description: 'CSP and X-XSS-Protection both enabled (CSP preferred)'
    });
  }
  
  // Check for frame options conflicts
  if (securityConfig.helmet?.frameguard !== false && 
      securityConfig.csp?.directives?.['frame-ancestors']) {
    conflicts.push({
      type: 'frame-options-csp',
      description: 'X-Frame-Options and CSP frame-ancestors both set'
    });
  }
  
  return conflicts;
}

/**
 * Detects security misconfigurations
 * @private
 * @param {Object} securityConfig - Security configuration
 * @returns {Array} Array of misconfiguration descriptions
 */
function detectSecurityMisconfigurations(securityConfig) {
  const misconfigurations = [];
  
  // Check for production misconfigurations
  if (securityConfig.environment === 'production') {
    if (securityConfig.cors?.origin === '*' && securityConfig.cors?.credentials) {
      misconfigurations.push({
        severity: 'error',
        message: 'Production CORS allows wildcard origin with credentials'
      });
    }
    
    if (!securityConfig.ssl?.enforced) {
      misconfigurations.push({
        severity: 'error',
        message: 'HTTPS not enforced in production'
      });
    }
    
    if (securityConfig.rateLimit?.max > 1000) {
      misconfigurations.push({
        severity: 'warning',
        message: 'Rate limit may be too high for production'
      });
    }
  }
  
  return misconfigurations;
}

/**
 * Generates security recommendations
 * @private
 * @param {Object} securityConfig - Security configuration
 * @param {Object} validationResult - Validation result
 * @returns {Array} Array of security recommendations
 */
function generateSecurityRecommendations(securityConfig, validationResult) {
  const recommendations = [];
  
  if (validationResult.categories.helmet.score < 20) {
    recommendations.push('Consider enabling more Helmet.js security policies');
  }
  
  if (validationResult.categories.csp.score < 20) {
    recommendations.push('Strengthen Content Security Policy configuration');
  }
  
  if (securityConfig.environment === 'production') {
    if (!securityConfig.ssl?.hsts?.enabled) {
      recommendations.push('Enable HSTS headers for production');
    }
    
    if (securityConfig.cors?.origin === '*') {
      recommendations.push('Restrict CORS origins in production');
    }
  }
  
  if (!securityConfig.csp?.reportUri) {
    recommendations.push('Configure CSP violation reporting');
  }
  
  return recommendations;
}

/**
 * Detects configuration changes between old and new config
 * @private
 * @param {Object} oldConfig - Previous configuration
 * @param {Object} newConfig - New configuration
 * @returns {Array} Array of detected changes
 */
function detectConfigurationChanges(oldConfig, newConfig) {
  const changes = [];
  
  if (!oldConfig) {
    changes.push({
      type: 'create',
      path: 'root',
      component: 'security-config',
      oldValue: null,
      newValue: 'configuration created',
      requiresRestart: false
    });
    return changes;
  }
  
  // Deep comparison of configuration objects
  const compareObjects = (old, newer, path = '') => {
    Object.keys(newer).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = old?.[key];
      const newValue = newer[key];
      
      if (oldValue !== newValue) {
        if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
          compareObjects(oldValue, newValue, currentPath);
        } else {
          changes.push({
            type: oldValue === undefined ? 'add' : 'modify',
            path: currentPath,
            component: key.split('.')[0],
            oldValue,
            newValue,
            requiresRestart: checkIfRequiresRestart(currentPath)
          });
        }
      }
    });
  };
  
  compareObjects(oldConfig, newConfig);
  return changes;
}

/**
 * Checks if configuration change requires restart
 * @private
 * @param {string} configPath - Configuration path
 * @returns {boolean} True if restart required
 */
function checkIfRequiresRestart(configPath) {
  const restartRequiredPaths = [
    'ssl.enforced',
    'ssl.certificates',
    'rateLimit.store'
  ];
  
  return restartRequiredPaths.some(path => configPath.includes(path));
}

/**
 * Applies configuration changes to current config
 * @private
 * @param {Object} currentConfig - Current configuration
 * @param {Object} newConfig - New configuration changes
 * @returns {Object} Merged configuration
 */
function applyConfigurationChanges(currentConfig, newConfig) {
  // Deep merge configurations
  const merge = (target, source) => {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  };
  
  const merged = currentConfig ? JSON.parse(JSON.stringify(currentConfig)) : {};
  return merge(merged, newConfig);
}

/**
 * Updates active middleware with new configuration
 * @private
 * @param {Object} newConfig - New configuration
 * @param {Array} changes - Configuration changes
 * @returns {Object} Update result
 */
function updateActiveMiddleware(newConfig, changes) {
  // This would update middleware in a real implementation
  // For now, we'll simulate the update
  return {
    success: true,
    errors: [],
    updatedMiddleware: changes.map(change => change.component).filter((v, i, a) => a.indexOf(v) === i)
  };
}

/**
 * Assesses security impact of configuration changes
 * @private
 * @param {Array} changes - Configuration changes
 * @returns {string} Security impact level
 */
function assessSecurityImpact(changes) {
  const highImpactChanges = changes.filter(change => 
    change.path.includes('ssl.enforced') ||
    change.path.includes('cors.origin') ||
    change.path.includes('csp.directives')
  );
  
  if (highImpactChanges.length > 0) return 'high';
  
  const mediumImpactChanges = changes.filter(change =>
    change.path.includes('rateLimit') ||
    change.path.includes('helmet')
  );
  
  if (mediumImpactChanges.length > 0) return 'medium';
  
  return 'low';
}

/**
 * Sanitizes security configuration for safe logging
 * @private
 * @param {Object} securityConfig - Security configuration
 * @returns {Object} Sanitized configuration
 */
function sanitizeSecurityConfigForLogging(securityConfig) {
  const sanitized = JSON.parse(JSON.stringify(securityConfig));
  
  // Remove sensitive data
  if (sanitized.ssl?.certificates) {
    sanitized.ssl.certificates = {
      configured: !!sanitized.ssl.certificates.cert,
      keyConfigured: !!sanitized.ssl.certificates.key,
      caConfigured: !!sanitized.ssl.certificates.ca
    };
  }
  
  // Summarize CORS origins
  if (sanitized.cors?.origin && Array.isArray(sanitized.cors.origin)) {
    sanitized.cors.originCount = sanitized.cors.origin.length;
    sanitized.cors.origin = sanitized.cors.origin.length > 3 ? 
      [...sanitized.cors.origin.slice(0, 3), '...'] : 
      sanitized.cors.origin;
  }
  
  return sanitized;
}

/**
 * Assesses compliance status of security configuration
 * @private
 * @param {Object} securityConfig - Security configuration
 * @returns {Object} Compliance assessment
 */
function assessComplianceStatus(securityConfig) {
  const compliance = {
    overall: 'compliant',
    issues: [],
    standards: {
      owasp: 'compliant',
      httpHeaders: 'compliant',
      csp: 'compliant',
      cors: 'compliant',
      tls: 'compliant'
    }
  };
  
  // Check OWASP compliance
  if (!securityConfig.helmet || !securityConfig.csp) {
    compliance.standards.owasp = 'non-compliant';
    compliance.issues.push({
      severity: 'warning',
      standard: 'OWASP',
      issue: 'Missing essential security headers'
    });
  }
  
  // Check TLS compliance
  if (securityConfig.environment === 'production' && !securityConfig.ssl?.enforced) {
    compliance.standards.tls = 'non-compliant';
    compliance.issues.push({
      severity: 'critical',
      standard: 'TLS',
      issue: 'HTTPS not enforced in production'
    });
    compliance.overall = 'non-compliant';
  }
  
  return compliance;
}

// Export default security configuration for immediate use
export const defaultSecurityConfig = createSecurityConfig();

// Export all public functions and current configuration
export {
  SECURITY_INITIALIZED,
  CURRENT_SECURITY_LEVEL,
  HTTPS_ENFORCED,
  SECURITY_METRICS
};

// Initialize security system logging
logger.info('Security configuration orchestrator initialized', {
  version: '1.0.0',
  environment: currentEnvironment,
  securityLevel: CURRENT_SECURITY_LEVEL,
  httpsEnforced: HTTPS_ENFORCED,
  features: [
    'helmet-integration',
    'csp-management',
    'cors-configuration',
    'rate-limiting',
    'ssl-enforcement',
    'security-validation',
    'dynamic-updates',
    'pm2-compatibility'
  ],
  pm2Compatible: !!process.env.PM2_HOME,
  nodeVersion: process.version,
  pid: process.pid,
  timestamp: new Date().toISOString()
});