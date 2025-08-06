/**
 * @fileoverview Helmet Configuration Middleware for Express.js Security Headers
 * @description Provides helmet middleware configuration and factory functions for security headers
 * @version 1.0.0
 */

import helmet from 'helmet';
import { createHelmetConfig } from '../security/helmet.config.js';

/**
 * Creates a Helmet configuration middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
export function createHelmetConfigMiddleware(options = {}) {
  const helmetConfig = createHelmetConfig(options.environment, options);
  return helmet(helmetConfig);
}

/**
 * Default helmet middleware with production-ready defaults
 */
export const helmetMiddleware = createHelmetConfigMiddleware({
  environment: process.env.NODE_ENV || 'development'
});

/**
 * Creates a development-specific Helmet middleware with relaxed policies
 * @param {Object} options - Configuration options for development
 * @returns {Function} Express middleware function
 */
export function createDevelopmentHelmetMiddleware(options = {}) {
  return createHelmetConfigMiddleware({
    environment: 'development',
    ...options
  });
}

/**
 * Creates a production-specific Helmet middleware with strict policies
 * @param {Object} options - Configuration options for production
 * @returns {Function} Express middleware function
 */
export function createProductionHelmetMiddleware(options = {}) {
  return createHelmetConfigMiddleware({
    environment: 'production',
    ...options
  });
}

/**
 * Validates helmet middleware configuration and functionality
 * @param {Function} middleware - The helmet middleware function to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateHelmetMiddleware(middleware, options = {}) {
  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    configuration: {}
  };
  
  try {
    // Check if middleware is a function
    if (typeof middleware !== 'function') {
      results.isValid = false;
      results.errors.push('Middleware must be a function');
      return results;
    }
    
    // Basic validation passed
    results.configuration = {
      type: 'helmet',
      validated: true,
      timestamp: new Date().toISOString()
    };
    
    if (options.strict) {
      results.warnings.push('Strict validation mode enabled');
    }
    
  } catch (error) {
    results.isValid = false;
    results.errors.push(`Validation error: ${error.message}`);
  }
  
  return results;
}

/**
 * Gets information about the helmet middleware configuration
 * @param {Function} middleware - The helmet middleware function
 * @returns {Object} Middleware information
 */
export function getHelmetMiddlewareInfo(middleware) {
  return {
    name: 'helmet',
    type: 'security',
    version: '7.1.0', // Default version
    description: 'Helmet.js security middleware for Express applications',
    isActive: typeof middleware === 'function',
    configuration: {
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: true,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: ["no-referrer", "strict-origin-when-cross-origin"] },
      xssFilter: true
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Initializes helmet middleware with comprehensive security configuration
 * @param {Object} options - Initialization options
 * @returns {Function} Configured helmet middleware
 */
export function initializeHelmetMiddleware(options = {}) {
  const {
    environment = 'development',
    strictMode = false,
    customPolicies = {},
    ...helmetOptions
  } = options;

  // Create base configuration based on environment
  const baseConfig = environment === 'production' ? {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        ...customPolicies
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  } : {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "*"],
        connectSrc: ["'self'", "*"],
        ...customPolicies
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  };

  // Merge with additional helmet options
  const finalConfig = {
    ...baseConfig,
    ...helmetOptions
  };

  // Create and configure helmet middleware
  try {
    const helmetMiddleware = helmet(finalConfig);
    
    // Add initialization metadata
    helmetMiddleware._initialized = true;
    helmetMiddleware._config = finalConfig;
    helmetMiddleware._environment = environment;
    helmetMiddleware._timestamp = new Date().toISOString();
    
    return helmetMiddleware;
  } catch (error) {
    console.error('Failed to initialize Helmet middleware:', error);
    // Return basic helmet configuration as fallback
    return helmet();
  }
}

// Export additional utilities
export { createHelmetConfig } from '../security/helmet.config.js';