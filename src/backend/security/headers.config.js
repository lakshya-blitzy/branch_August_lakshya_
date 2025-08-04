/**
 * @fileoverview Custom Security Headers Configuration Module for Node.js Tutorial Project
 * @description Advanced custom security headers implementation that complements Helmet.js 15 sub-middlewares
 * with application-specific security policies, monitoring headers, rate limiting information, request correlation
 * tracking, and performance monitoring headers. Provides comprehensive Express.js security enhancement with
 * environment-specific policies, PM2 cluster mode compatibility, and cross-platform Flask consistency.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Custom security headers beyond Helmet.js standard configuration
 * - Request correlation tracking with X-Request-ID for distributed tracing
 * - Performance monitoring with X-Response-Time headers
 * - API version metadata with X-API-Version headers
 * - Rate limiting transparency with X-Rate-Limit-* headers
 * - Enhanced Permissions-Policy with application-specific restrictions
 * - Environment-aware custom header policies and configurations
 * - PM2 cluster mode compatibility with process identification
 * - Comprehensive header value validation and sanitization
 * - Cross-platform consistency for Flask implementation compatibility
 * 
 * Security Enhancements:
 * - Additional MIME type security policies beyond X-Content-Type-Options
 * - Enhanced browser feature restrictions via Permissions-Policy
 * - Custom security monitoring headers for violation tracking
 * - Request correlation for security incident response
 * - Performance timing for security analysis and optimization
 * 
 * Educational Value:
 * - Demonstrates advanced security headers implementation patterns
 * - Showcases request correlation and distributed tracing techniques
 * - Illustrates performance monitoring through HTTP headers
 * - Teaches environment-specific security configuration management
 * - Provides comprehensive header validation and sanitization examples
 * 
 * Technology Integration:
 * - Express.js v5.1.0 middleware compatibility and optimization
 * - Helmet.js v8.1.0 integration without conflicts or redundancy
 * - PM2 v6.0.8 cluster mode support with process identification
 * - Node.js v22.x built-in crypto module for secure nonce generation
 * - Cross-platform Flask compatibility for consistent security behavior
 */

// External library imports with version comments
import crypto from 'node:crypto'; // Node.js built-in - Cryptographic utilities for secure nonce generation
import process from 'node:process'; // Node.js built-in - Process information and environment variables

// Internal imports with specific members used for custom security headers functionality
import {
  SECURITY_CONSTANTS,
  HTTP_CONSTANTS,
  API_CONSTANTS
} from '../utils/constants.js';

import {
  environmentConfig,
  getSecurityConfig,
  isProduction,
  isDevelopment,
  currentEnvironment
} from '../config/environment.js';

import logger, {
  info as logInfo,
  warn as logWarn,
  error as logError,
  logSecurityEvent
} from '../utils/logger.js';

import { generateRequestId } from '../utils/logger.js';

import { SecurityConfigurationError } from '../utils/error-types.js';

// Global state and caching for custom security headers module
const CUSTOM_HEADERS_CACHE = new Map();
const REQUEST_TIMING_MAP = new Map();
const SECURITY_NONCE_MAP = new Map();
const API_VERSION = process.env.API_VERSION || '1.0.0';

// Cache TTL and performance thresholds
const CACHE_TTL = 300000; // 5 minutes cache TTL
const NONCE_EXPIRY = 3600000; // 1 hour nonce expiry
const PERFORMANCE_THRESHOLD = 1000; // 1 second threshold for slow requests

/**
 * Validates URL format and structure for security header values to prevent header injection
 * and ensure URL compliance with security policies and cross-platform compatibility.
 * 
 * @param {string} url - URL string to validate
 * @returns {boolean} True if URL is valid and safe for header usage
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    logWarn('Invalid URL provided for validation', { url, type: typeof url });
    return false;
  }

  try {
    // Basic URL format validation using URL constructor
    const urlObject = new URL(url);
    
    // Check for common security threats in URLs
    const prohibitedPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /<script/i,
      /[<>'"]/
    ];

    const isProhibited = prohibitedPatterns.some(pattern => pattern.test(url));
    if (isProhibited) {
      logSecurityEvent('Prohibited URL pattern detected', { url, patterns: 'security_violation' });
      return false;
    }

    // Validate URL length to prevent DoS attacks
    if (url.length > 2048) {
      logWarn('URL exceeds maximum length limit', { url: url.substring(0, 100) + '...', length: url.length });
      return false;
    }

    // Ensure protocol is HTTP or HTTPS for web security
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      logWarn('URL uses unsupported protocol', { url, protocol: urlObject.protocol });
      return false;
    }

    logInfo('URL validation passed', { url, protocol: urlObject.protocol, host: urlObject.host });
    return true;
  } catch (error) {
    logWarn('URL validation failed', { url, error: error.message });
    return false;
  }
}

/**
 * Sanitizes HTTP header values to prevent header injection attacks, CRLF injection,
 * and other header-based security vulnerabilities while maintaining header functionality.
 * 
 * @param {string} headerValue - Header value to sanitize
 * @returns {string} Sanitized header value safe for HTTP response usage
 */
function sanitizeHeader(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    logWarn('Invalid header value provided for sanitization', { 
      headerValue, 
      type: typeof headerValue 
    });
    return '';
  }

  try {
    // Remove CRLF characters to prevent header injection
    let sanitized = headerValue.replace(/[\r\n\x00-\x1f\x7f-\x9f]/g, '');
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/\0/g, '');
    
    // Trim whitespace and limit length
    sanitized = sanitized.trim().substring(0, 1024);
    
    // Escape special characters that could cause issues
    sanitized = sanitized.replace(/[<>"']/g, (match) => {
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[match];
    });

    // Log sanitization if changes were made
    if (sanitized !== headerValue) {
      logSecurityEvent('Header value sanitized', {
        original: headerValue.substring(0, 100),
        sanitized: sanitized.substring(0, 100),
        changesMade: true
      });
    }

    return sanitized;
  } catch (error) {
    logError('Header sanitization failed', { headerValue, error: error.message });
    return '';
  }
}

/**
 * Creates custom security headers configuration that complements Helmet.js with application-specific
 * security policies, monitoring headers, and request correlation tracking. Generates environment-specific
 * custom headers for enhanced security posture and operational monitoring.
 * 
 * @param {string} environment - Target environment identifier
 * @param {Object} options - Configuration options and customizations
 * @returns {Object} Custom security headers configuration with application metadata, monitoring, and security enhancement headers
 */
export function createCustomSecurityHeaders(environment = currentEnvironment, options = {}) {
  const config = {
    enableDebugHeaders: options.enableDebugHeaders !== false && isDevelopment,
    enablePerformanceHeaders: options.enablePerformanceHeaders !== false,
    enableRequestCorrelation: options.enableRequestCorrelation !== false,
    enableRateLimitHeaders: options.enableRateLimitHeaders !== false,
    customApiVersion: options.customApiVersion || API_VERSION,
    ...options
  };

  logInfo('Creating custom security headers configuration', { environment, config });

  try {
    // Initialize custom security headers object with environment-specific defaults
    const customHeaders = {
      // Request correlation tracking header for distributed tracing and debugging
      'X-Request-ID': {
        enabled: config.enableRequestCorrelation,
        generator: () => generateRequestId(),
        description: 'Unique request identifier for distributed tracing and debugging'
      },

      // API version information for client compatibility and debugging
      'X-API-Version': {
        enabled: true,
        value: config.customApiVersion,
        description: 'Current API version for client compatibility and debugging'
      },

      // Response timing header for performance monitoring and debugging
      'X-Response-Time': {
        enabled: config.enablePerformanceHeaders,
        calculator: 'dynamic', // Calculated during response
        description: 'Request processing duration for performance monitoring'
      },

      // Rate limiting headers for transparency and client optimization
      'X-Rate-Limit-Limit': {
        enabled: config.enableRateLimitHeaders,
        source: 'rateLimit', // From rate limiting middleware
        description: 'Maximum requests allowed in current rate limiting window'
      },

      'X-Rate-Limit-Remaining': {
        enabled: config.enableRateLimitHeaders,
        source: 'rateLimit',
        description: 'Remaining requests allowed in current window'
      },

      'X-Rate-Limit-Reset': {
        enabled: config.enableRateLimitHeaders,
        source: 'rateLimit',
        description: 'Unix timestamp when rate limiting window resets'
      }
    };

    // Configure Permissions-Policy header with enhanced browser feature restrictions
    customHeaders['Permissions-Policy'] = {
      enabled: true,
      value: createPermissionsPolicyHeader(environment, config),
      description: 'Enhanced browser feature restrictions beyond Helmet.js defaults'
    };

    // Set up X-Content-Type-Options with additional MIME type security policies
    customHeaders['X-Content-Type-Options'] = {
      enabled: true,
      value: 'nosniff',
      extensions: {
        enforceStrictMimeType: true,
        blockUntrustedTypes: true
      },
      description: 'Prevent MIME type sniffing with additional security policies'
    };

    // Add development-specific debug headers in non-production environments
    if (config.enableDebugHeaders && isDevelopment) {
      customHeaders['X-Process-ID'] = {
        enabled: true,
        value: process.pid.toString(),
        description: 'PM2 process identifier for cluster debugging'
      };

      customHeaders['X-Debug-Mode'] = {
        enabled: true,
        value: 'true',
        description: 'Debug mode indicator for development tools'
      };

      customHeaders['X-Environment'] = {
        enabled: true,
        value: environment,
        description: 'Current environment identifier for debugging'
      };
    }

    // Apply environment-specific custom header policies and restrictions
    if (isProduction) {
      // Production-specific headers for enhanced security
      customHeaders['X-Security-Level'] = {
        enabled: true,
        value: 'strict',
        description: 'Security enforcement level indicator'
      };

      customHeaders['X-Monitoring'] = {
        enabled: true,
        value: 'enabled',
        description: 'Security monitoring status indicator'
      };
    } else {
      // Development-specific headers for debugging and development tools
      customHeaders['X-Development-Mode'] = {
        enabled: true,
        value: 'true',
        description: 'Development mode indicator'
      };
    }

    // Add custom CORS headers that complement standard CORS middleware
    customHeaders['X-Custom-CORS-Policy'] = {
      enabled: true,
      value: `environment=${environment}`,
      description: 'Custom CORS policy indicator for environment-specific handling'
    };

    // Set up security monitoring headers for violation tracking and alerting
    customHeaders['X-Security-Monitor'] = {
      enabled: isProduction,
      value: generateSecurityNonce('monitor'),
      description: 'Security monitoring token for violation tracking'
    };

    // Log custom security headers configuration creation with security audit trail
    logSecurityEvent('Custom security headers configuration created', {
      environment,
      headerCount: Object.keys(customHeaders).length,
      enabledHeaders: Object.entries(customHeaders)
        .filter(([, config]) => config.enabled)
        .map(([name]) => name),
      securityLevel: isProduction ? 'strict' : 'development'
    });

    // Cache configuration for performance optimization
    const cacheKey = `custom_headers_${environment}_${JSON.stringify(config)}`;
    CUSTOM_HEADERS_CACHE.set(cacheKey, {
      headers: customHeaders,
      timestamp: Date.now(),
      environment,
      config
    });

    // Return comprehensive custom security headers configuration object
    return {
      headers: customHeaders,
      environment,
      timestamp: new Date().toISOString(),
      metadata: {
        totalHeaders: Object.keys(customHeaders).length,
        enabledHeaders: Object.values(customHeaders).filter(h => h.enabled).length,
        securityLevel: isProduction ? 'production' : 'development',
        cacheKey
      }
    };

  } catch (error) {
    logError('Failed to create custom security headers configuration', {
      environment,
      error: error.message,
      config
    });
    throw new SecurityConfigurationError(
      `Failed to create custom security headers for environment: ${environment}`,
      { code: 'CUSTOM_HEADERS_CREATION_FAILED', environment, cause: error }
    );
  }
}

/**
 * Creates Express.js middleware function that applies custom security headers to HTTP responses
 * with dynamic value generation, request correlation tracking, and performance monitoring.
 * Integrates with PM2 cluster mode and environment-specific policies.
 * 
 * @param {Object} customHeadersConfig - Custom headers configuration object
 * @returns {Function} Express.js middleware function that applies custom security headers to all HTTP responses
 */
export function getSecurityHeadersMiddleware(customHeadersConfig) {
  if (!customHeadersConfig || !customHeadersConfig.headers) {
    throw new SecurityConfigurationError(
      'Invalid custom headers configuration provided to middleware',
      { code: 'INVALID_HEADERS_CONFIG' }
    );
  }

  const { headers: customHeaders, environment, metadata } = customHeadersConfig;

  logInfo('Creating security headers middleware', {
    environment,
    headerCount: metadata.totalHeaders,
    enabledHeaders: metadata.enabledHeaders
  });

  // Create Express middleware function with request and response parameter handling
  return function securityHeadersMiddleware(req, res, next) {
    try {
      // Generate unique request correlation ID using generateRequestId function
      const requestId = generateRequestId();
      const requestStartTime = Date.now();

      // Store request timing information for performance calculation
      REQUEST_TIMING_MAP.set(requestId, {
        startTime: requestStartTime,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent')
      });

      // Apply X-Request-ID header with generated correlation ID for distributed tracing
      if (customHeaders['X-Request-ID'] && customHeaders['X-Request-ID'].enabled) {
        const sanitizedRequestId = sanitizeHeader(requestId);
        res.set('X-Request-ID', sanitizedRequestId);
        req.requestId = sanitizedRequestId; // Store for use in other middleware
      }

      // Set X-API-Version header with current API version from environment or package configuration
      if (customHeaders['X-API-Version'] && customHeaders['X-API-Version'].enabled) {
        const apiVersion = sanitizeHeader(customHeaders['X-API-Version'].value);
        res.set('X-API-Version', apiVersion);
      }

      // Configure rate limiting headers based on current request rate limiting status
      if (customHeaders['X-Rate-Limit-Limit'] && customHeaders['X-Rate-Limit-Limit'].enabled) {
        const rateLimitHeaders = createRateLimitHeaders(req.rateLimit || {}, req);
        Object.entries(rateLimitHeaders).forEach(([name, value]) => {
          res.set(name, sanitizeHeader(value.toString()));
        });
      }

      // Apply Permissions-Policy header with environment-specific browser feature restrictions
      if (customHeaders['Permissions-Policy'] && customHeaders['Permissions-Policy'].enabled) {
        const permissionsPolicy = customHeaders['Permissions-Policy'].value;
        res.set('Permissions-Policy', permissionsPolicy);
      }

      // Set up custom CORS headers that complement standard CORS middleware
      if (customHeaders['X-Custom-CORS-Policy'] && customHeaders['X-Custom-CORS-Policy'].enabled) {
        const corsPolicy = sanitizeHeader(customHeaders['X-Custom-CORS-Policy'].value);
        res.set('X-Custom-CORS-Policy', corsPolicy);
      }

      // Configure security monitoring headers for violation tracking and alerting
      if (customHeaders['X-Security-Monitor'] && customHeaders['X-Security-Monitor'].enabled) {
        const securityToken = customHeaders['X-Security-Monitor'].value;
        if (securityToken) {
          res.set('X-Security-Monitor', sanitizeHeader(securityToken));
        }
      }

      // Add development-specific debug headers in non-production environments
      if (isDevelopment) {
        Object.entries(customHeaders).forEach(([headerName, headerConfig]) => {
          if (headerConfig.enabled && headerName.startsWith('X-Debug-') || headerName.startsWith('X-Development-')) {
            const headerValue = sanitizeHeader(headerConfig.value || 'true');
            res.set(headerName, headerValue);
          }
        });
      }

      // Set up response timing calculation and X-Response-Time header generation
      const originalSend = res.send;
      res.send = function(body) {
        // Calculate response time before sending response
        applyResponseTimingHeader(req, res, requestStartTime);
        
        // Remove timing data from cache to prevent memory leaks
        REQUEST_TIMING_MAP.delete(requestId);
        
        // Call original send method
        return originalSend.call(this, body);
      };

      // Apply additional custom headers based on configuration
      Object.entries(customHeaders).forEach(([headerName, headerConfig]) => {
        if (headerConfig.enabled && !res.get(headerName)) {
          let headerValue = headerConfig.value;
          
          // Handle dynamic header values
          if (typeof headerConfig.generator === 'function') {
            headerValue = headerConfig.generator();
          }
          
          if (headerValue) {
            res.set(headerName, sanitizeHeader(headerValue.toString()));
          }
        }
      });

      // Call next() to continue Express middleware chain processing
      next();

    } catch (error) {
      logError('Security headers middleware error', {
        requestId: req.requestId,
        error: error.message,
        path: req.path,
        method: req.method
      });
      
      // Continue processing even if header application fails
      next();
    }
  };
}

/**
 * Merges custom security headers configuration with Helmet.js configuration to create unified
 * security header policy without conflicts or redundancy. Resolves header precedence and ensures
 * optimal security coverage across all header implementations.
 * 
 * @param {Object} customHeaders - Custom headers configuration object
 * @param {Object} helmetConfig - Helmet.js configuration object
 * @param {Object} mergeOptions - Merge options and conflict resolution preferences
 * @returns {Object} Merged security headers configuration with conflict resolution and optimized header policies
 */
export function mergeWithHelmetHeaders(customHeaders, helmetConfig, mergeOptions = {}) {
  const options = {
    preferCustomHeaders: mergeOptions.preferCustomHeaders !== false,
    allowOverrides: mergeOptions.allowOverrides !== false,
    logConflicts: mergeOptions.logConflicts !== false,
    validateMergedConfig: mergeOptions.validateMergedConfig !== false,
    ...mergeOptions
  };

  logInfo('Merging custom headers with Helmet.js configuration', {
    customHeaderCount: Object.keys(customHeaders).length,
    helmetConfigKeys: Object.keys(helmetConfig).length,
    options
  });

  try {
    // Analyze custom headers and Helmet.js configuration for potential conflicts
    const conflictAnalysis = analyzeHeaderConflicts(customHeaders, helmetConfig);
    
    if (options.logConflicts && conflictAnalysis.conflicts.length > 0) {
      logWarn('Header conflicts detected during merge', {
        conflicts: conflictAnalysis.conflicts,
        resolutionStrategy: options.preferCustomHeaders ? 'custom' : 'helmet'
      });
    }

    // Initialize merged configuration with base Helmet.js settings
    const mergedConfig = {
      helmet: { ...helmetConfig },
      custom: { ...customHeaders },
      merged: {},
      conflicts: conflictAnalysis.conflicts,
      resolutions: []
    };

    // Identify overlapping security policies and header definitions
    const overlappingHeaders = ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'];
    
    overlappingHeaders.forEach(headerName => {
      if (customHeaders[headerName] && helmetConfig[headerName.toLowerCase()]) {
        const resolution = {
          header: headerName,
          source: options.preferCustomHeaders ? 'custom' : 'helmet',
          conflict: true
        };
        
        mergedConfig.resolutions.push(resolution);
        
        if (options.preferCustomHeaders) {
          mergedConfig.merged[headerName] = customHeaders[headerName];
        }
      }
    });

    // Resolve header precedence based on security effectiveness and specificity
    const precedenceRules = {
      'Permissions-Policy': 'custom', // Custom implementation is more specific
      'X-Request-ID': 'custom', // Always use custom implementation
      'X-API-Version': 'custom', // Application-specific
      'X-Response-Time': 'custom', // Performance monitoring
      'Content-Security-Policy': 'helmet', // Use Helmet.js CSP implementation
      'Strict-Transport-Security': 'helmet' // Use Helmet.js HSTS implementation
    };

    Object.entries(precedenceRules).forEach(([headerName, preferredSource]) => {
      const customHeader = customHeaders[headerName];
      const helmetHeader = helmetConfig[headerName.toLowerCase()];
      
      if (customHeader && helmetHeader) {
        mergedConfig.merged[headerName] = preferredSource === 'custom' ? customHeader : helmetHeader;
        mergedConfig.resolutions.push({
          header: headerName,
          source: preferredSource,
          reason: 'precedence_rule'
        });
      } else if (customHeader) {
        mergedConfig.merged[headerName] = customHeader;
      } else if (helmetHeader) {
        mergedConfig.merged[headerName] = helmetHeader;
      }
    });

    // Merge Permissions-Policy headers from both configurations with enhanced restrictions
    if (customHeaders['Permissions-Policy'] && helmetConfig.permissionsPolicy) {
      const mergedPermissionsPolicy = mergePermissionsPolicies(
        customHeaders['Permissions-Policy'],
        helmetConfig.permissionsPolicy
      );
      mergedConfig.merged['Permissions-Policy'] = mergedPermissionsPolicy;
      mergedConfig.resolutions.push({
        header: 'Permissions-Policy',
        source: 'merged',
        reason: 'policy_combination'
      });
    }

    // Combine CSP directives from custom headers with Helmet.js CSP configuration
    if (customHeaders.cspExtensions && helmetConfig.contentSecurityPolicy) {
      const mergedCSP = mergeCSPDirectives(
        customHeaders.cspExtensions,
        helmetConfig.contentSecurityPolicy
      );
      mergedConfig.merged.contentSecurityPolicy = mergedCSP;
      mergedConfig.resolutions.push({
        header: 'Content-Security-Policy',
        source: 'merged',
        reason: 'directive_combination'
      });
    }

    // Integrate rate limiting headers with CORS and authentication headers
    const rateLimitHeaders = ['X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'];
    rateLimitHeaders.forEach(headerName => {
      if (customHeaders[headerName]) {
        mergedConfig.merged[headerName] = customHeaders[headerName];
      }
    });

    // Resolve timing header conflicts and ensure consistent performance monitoring
    if (customHeaders['X-Response-Time']) {
      mergedConfig.merged['X-Response-Time'] = customHeaders['X-Response-Time'];
      mergedConfig.resolutions.push({
        header: 'X-Response-Time',
        source: 'custom',
        reason: 'performance_monitoring'
      });
    }

    // Merge security monitoring and violation reporting configurations
    const securityMonitoringHeaders = ['X-Security-Monitor', 'X-Request-ID'];
    securityMonitoringHeaders.forEach(headerName => {
      if (customHeaders[headerName]) {
        mergedConfig.merged[headerName] = customHeaders[headerName];
      }
    });

    // Apply environment-specific merge rules and conflict resolution policies
    if (isDevelopment) {
      // In development, prefer custom headers for debugging
      Object.keys(customHeaders).forEach(headerName => {
        if (headerName.startsWith('X-Debug-') || headerName.startsWith('X-Development-')) {
          mergedConfig.merged[headerName] = customHeaders[headerName];
        }
      });
    }

    // Validate merged configuration for completeness and security effectiveness
    if (options.validateMergedConfig) {
      const validation = validateSecurityHeaders(mergedConfig.merged, currentEnvironment);
      mergedConfig.validation = validation;
      
      if (!validation.isValid) {
        logWarn('Merged header configuration has validation issues', {
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
    }

    // Log merge operation results and any conflict resolutions for audit trail
    logSecurityEvent('Header configuration merge completed', {
      totalMergedHeaders: Object.keys(mergedConfig.merged).length,
      conflictsResolved: mergedConfig.resolutions.length,
      validationPassed: mergedConfig.validation ? mergedConfig.validation.isValid : 'not_validated',
      environment: currentEnvironment
    });

    // Return unified security headers configuration optimized for security and performance
    return {
      mergedHeaders: mergedConfig.merged,
      helmetConfig: mergedConfig.helmet,
      customHeaders: mergedConfig.custom,
      conflicts: mergedConfig.conflicts,
      resolutions: mergedConfig.resolutions,
      validation: mergedConfig.validation,
      metadata: {
        mergeTimestamp: new Date().toISOString(),
        environment: currentEnvironment,
        totalHeaders: Object.keys(mergedConfig.merged).length,
        mergeStrategy: options.preferCustomHeaders ? 'custom_preferred' : 'helmet_preferred'
      }
    };

  } catch (error) {
    logError('Failed to merge custom headers with Helmet.js configuration', {
      error: error.message,
      customHeaderCount: Object.keys(customHeaders).length,
      helmetConfigKeys: Object.keys(helmetConfig).length
    });
    throw new SecurityConfigurationError(
      'Header configuration merge failed',
      { code: 'HEADER_MERGE_FAILED', cause: error }
    );
  }
}

/**
 * Validates custom security headers configuration for correctness, security effectiveness,
 * and compliance with modern security standards. Performs header value validation, policy
 * effectiveness analysis, and security gap identification for comprehensive security assurance.
 * 
 * @param {Object} customHeadersConfig - Custom headers configuration to validate
 * @param {string} environment - Target environment for validation context
 * @returns {Object} Validation result with security status, warnings, recommendations, and compliance information for custom headers
 */
export function validateSecurityHeaders(customHeadersConfig, environment = currentEnvironment) {
  if (!customHeadersConfig || typeof customHeadersConfig !== 'object') {
    throw new SecurityConfigurationError(
      'Invalid custom headers configuration provided for validation',
      { code: 'INVALID_VALIDATION_INPUT' }
    );
  }

  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    compliance: {
      securityStandards: false,
      performanceOptimized: false,
      environmentAppropriate: false,
      crossPlatformCompatible: false
    },
    environment,
    timestamp: new Date().toISOString(),
    headerAnalysis: {}
  };

  try {
    logInfo('Validating custom security headers configuration', {
      environment,
      headerCount: Object.keys(customHeadersConfig).length
    });

    // Validate custom security header names and formats for HTTP compliance
    Object.entries(customHeadersConfig).forEach(([headerName, headerConfig]) => {
      const headerValidation = validateIndividualHeader(headerName, headerConfig);
      validationResult.headerAnalysis[headerName] = headerValidation;
      
      if (!headerValidation.isValid) {
        validationResult.errors.push(...headerValidation.errors);
        validationResult.isValid = false;
      }
      
      validationResult.warnings.push(...headerValidation.warnings);
      validationResult.recommendations.push(...headerValidation.recommendations);
    });

    // Check Permissions-Policy directive syntax and browser feature restrictions
    if (customHeadersConfig['Permissions-Policy']) {
      const permissionsPolicyValidation = validatePermissionsPolicy(
        customHeadersConfig['Permissions-Policy']
      );
      
      if (!permissionsPolicyValidation.isValid) {
        validationResult.errors.push(...permissionsPolicyValidation.errors);
        validationResult.isValid = false;
      }
      validationResult.warnings.push(...permissionsPolicyValidation.warnings);
    }

    // Verify rate limiting header values and consistency with rate limiting middleware
    const rateLimitHeaders = ['X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'];
    const rateLimitValidation = validateRateLimitHeaders(customHeadersConfig, rateLimitHeaders);
    validationResult.warnings.push(...rateLimitValidation.warnings);
    validationResult.recommendations.push(...rateLimitValidation.recommendations);

    // Validate X-Content-Type-Options extensions and MIME type security policies
    if (customHeadersConfig['X-Content-Type-Options']) {
      const contentTypeValidation = validateContentTypeOptions(
        customHeadersConfig['X-Content-Type-Options']
      );
      validationResult.warnings.push(...contentTypeValidation.warnings);
    }

    // Check custom CORS headers for policy conflicts and security gaps
    if (customHeadersConfig['X-Custom-CORS-Policy']) {
      const corsValidation = validateCustomCORSHeaders(
        customHeadersConfig['X-Custom-CORS-Policy']
      );
      validationResult.warnings.push(...corsValidation.warnings);
      validationResult.recommendations.push(...corsValidation.recommendations);
    }

    // Verify request correlation header generation and uniqueness requirements
    if (customHeadersConfig['X-Request-ID']) {
      const correlationValidation = validateRequestCorrelation(
        customHeadersConfig['X-Request-ID']
      );
      if (!correlationValidation.isValid) {
        validationResult.errors.push(...correlationValidation.errors);
        validationResult.isValid = false;
      }
    }

    // Validate environment-specific custom header policies and restrictions
    const environmentValidation = validateEnvironmentSpecificHeaders(
      customHeadersConfig,
      environment
    );
    validationResult.compliance.environmentAppropriate = environmentValidation.isValid;
    validationResult.warnings.push(...environmentValidation.warnings);
    validationResult.recommendations.push(...environmentValidation.recommendations);

    // Analyze custom headers for potential information disclosure or security weaknesses
    const securityAnalysis = analyzeSecurityWeaknesses(customHeadersConfig);
    validationResult.warnings.push(...securityAnalysis.warnings);
    validationResult.recommendations.push(...securityAnalysis.recommendations);

    // Check integration compatibility with Helmet.js and Express.js middleware stack
    const integrationValidation = validateMiddlewareIntegration(customHeadersConfig);
    validationResult.compliance.crossPlatformCompatible = integrationValidation.isValid;
    validationResult.warnings.push(...integrationValidation.warnings);

    // Generate security recommendations for custom header improvements and optimization
    const optimizationRecommendations = generateOptimizationRecommendations(
      customHeadersConfig,
      environment
    );
    validationResult.recommendations.push(...optimizationRecommendations);

    // Calculate overall compliance scores
    const complianceCount = Object.values(validationResult.compliance).filter(Boolean).length;
    const totalCompliance = Object.keys(validationResult.compliance).length;
    validationResult.complianceScore = Math.round((complianceCount / totalCompliance) * 100);

    // Determine overall security effectiveness
    validationResult.compliance.securityStandards = validationResult.errors.length === 0;
    validationResult.compliance.performanceOptimized = validationResult.warnings.length < 3;

    // Log validation results with detailed security analysis and recommendations
    logSecurityEvent('Custom security headers validation completed', {
      environment,
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      recommendationCount: validationResult.recommendations.length,
      complianceScore: validationResult.complianceScore
    });

    // Return comprehensive validation report with actionable security insights and compliance status
    return validationResult;

  } catch (error) {
    logError('Custom security headers validation failed', {
      environment,
      error: error.message
    });
    
    validationResult.isValid = false;
    validationResult.errors.push(`Validation process failed: ${error.message}`);
    return validationResult;
  }
}

/**
 * Generates cryptographically secure nonces for custom security headers including CSP script-src
 * nonces, style-src nonces, and custom security tokens for enhanced security policy enforcement
 * and XSS prevention.
 * 
 * @param {string} nonceType - Type of nonce to generate (script, style, monitor, etc.)
 * @param {Object} options - Nonce generation options and parameters
 * @returns {string} Cryptographically secure nonce value for security header usage
 */
export function generateSecurityNonce(nonceType = 'default', options = {}) {
  const config = {
    length: options.length || 32,
    encoding: options.encoding || 'base64',
    includeTimestamp: options.includeTimestamp !== false,
    includeType: options.includeType !== false,
    expiry: options.expiry || NONCE_EXPIRY,
    ...options
  };

  try {
    // Generate cryptographically secure random bytes using Node.js crypto module
    const randomBytes = crypto.randomBytes(config.length);
    
    // Apply nonce type-specific formatting and encoding requirements
    let nonce = randomBytes.toString(config.encoding);
    
    // Add timestamp component for nonce expiration and rotation management
    if (config.includeTimestamp) {
      const timestamp = Date.now().toString(36);
      nonce = `${timestamp}-${nonce}`;
    }
    
    // Include request correlation information for nonce tracking and validation
    if (config.includeType && nonceType !== 'default') {
      nonce = `${nonceType}-${nonce}`;
    }
    
    // Format nonce for specific use cases
    const formattedNonce = formatNonceForType(nonce, nonceType);
    
    // Cache nonce value with expiration time for request lifecycle management
    const cacheKey = `nonce_${nonceType}_${Date.now()}`;
    SECURITY_NONCE_MAP.set(cacheKey, {
      nonce: formattedNonce,
      type: nonceType,
      createdAt: Date.now(),
      expiresAt: Date.now() + config.expiry,
      used: false
    });

    // Cleanup expired nonces periodically
    cleanupExpiredNonces();

    // Log nonce generation event for security audit trail and monitoring
    logSecurityEvent('Security nonce generated', {
      nonceType,
      nonceLength: formattedNonce.length,
      encoding: config.encoding,
      expiresIn: config.expiry
    });

    // Return formatted nonce ready for security header integration
    return formattedNonce;

  } catch (error) {
    logError('Failed to generate security nonce', {
      nonceType,
      error: error.message,
      config
    });
    throw new SecurityConfigurationError(
      `Failed to generate security nonce for type: ${nonceType}`,
      { code: 'NONCE_GENERATION_FAILED', nonceType, cause: error }
    );
  }
}

/**
 * Calculates and applies X-Response-Time header with request processing duration for performance
 * monitoring and debugging. Integrates with PM2 cluster mode for distributed performance tracking
 * and optimization analysis.
 * 
 * @param {Object} req - Express.js request object
 * @param {Object} res - Express.js response object
 * @param {number} startTime - Request start timestamp in milliseconds
 * @returns {void} No return value, modifies response headers with timing information
 */
export function applyResponseTimingHeader(req, res, startTime) {
  try {
    // Calculate total request processing time from start time to current time
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Format timing value with appropriate precision and units for header usage
    const formattedTime = formatResponseTime(processingTime);
    
    // Apply X-Response-Time header to response with calculated timing value
    res.set('X-Response-Time', formattedTime);
    
    // Update performance metrics cache with timing information for monitoring
    const timingData = {
      path: req.path,
      method: req.method,
      processingTime,
      timestamp: endTime,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId
    };
    
    // Log performance timing event if timing exceeds configured thresholds
    if (processingTime > PERFORMANCE_THRESHOLD) {
      logWarn('Slow request detected', {
        ...timingData,
        threshold: PERFORMANCE_THRESHOLD,
        exceedsThreshold: true
      });
    } else {
      logInfo('Request timing recorded', timingData);
    }
    
    // Track timing statistics for performance analysis and optimization
    updatePerformanceStatistics(timingData);

  } catch (error) {
    logError('Failed to apply response timing header', {
      error: error.message,
      path: req.path,
      method: req.method,
      requestId: req.requestId
    });
  }
}

/**
 * Creates rate limiting headers including X-Rate-Limit-Limit, X-Rate-Limit-Remaining, and
 * X-Rate-Limit-Reset for transparent rate limiting information and client optimization.
 * Integrates with Express rate limiting middleware for accurate limit reporting.
 * 
 * @param {Object} rateLimitInfo - Rate limiting information from middleware
 * @param {Object} request - Express.js request object for context
 * @returns {Object} Rate limiting headers object with limit, remaining, and reset information
 */
export function createRateLimitHeaders(rateLimitInfo = {}, request = {}) {
  try {
    // Extract current rate limit information from rate limiting middleware or configuration
    const limit = rateLimitInfo.limit || 100; // Default limit
    const remaining = rateLimitInfo.remaining !== undefined ? rateLimitInfo.remaining : limit;
    const resetTime = rateLimitInfo.reset || Date.now() + (15 * 60 * 1000); // 15 minutes default
    
    // Calculate remaining requests allowed within current rate limiting window
    const remainingRequests = Math.max(0, remaining);
    
    // Determine rate limit reset time based on current window and configuration
    const resetTimestamp = Math.floor(resetTime / 1000); // Convert to Unix timestamp
    
    // Format rate limiting headers with standard naming conventions and values
    const rateLimitHeaders = {
      'X-Rate-Limit-Limit': limit.toString(),
      'X-Rate-Limit-Remaining': remainingRequests.toString(),
      'X-Rate-Limit-Reset': resetTimestamp.toString()
    };
    
    // Add client identification information for personalized rate limiting feedback
    if (request.ip) {
      rateLimitHeaders['X-Rate-Limit-Client'] = sanitizeHeader(request.ip);
    }
    
    // Include window information for rate limiting transparency
    const windowMs = rateLimitInfo.windowMs || (15 * 60 * 1000);
    rateLimitHeaders['X-Rate-Limit-Window'] = Math.floor(windowMs / 1000).toString();
    
    // Log rate limiting header generation for monitoring and analytics
    logInfo('Rate limiting headers created', {
      limit,
      remaining: remainingRequests,
      resetTime: resetTimestamp,
      clientIp: request.ip,
      path: request.path
    });
    
    // Return rate limiting headers object ready for response header application
    return rateLimitHeaders;

  } catch (error) {
    logError('Failed to create rate limiting headers', {
      error: error.message,
      rateLimitInfo,
      path: request.path
    });
    
    // Return minimal headers on error
    return {
      'X-Rate-Limit-Limit': '100',
      'X-Rate-Limit-Remaining': '100',
      'X-Rate-Limit-Reset': Math.floor(Date.now() / 1000).toString()
    };
  }
}

/**
 * Validates custom security header values for safety, format correctness, and potential security
 * vulnerabilities including header injection attacks and information disclosure. Performs
 * comprehensive sanitization and security validation.
 * 
 * @param {Object} headerValues - Header values object to validate
 * @param {Object} validationOptions - Validation options and security parameters
 * @returns {Object} Header validation result with sanitized values and security warnings
 */
export function validateCustomHeaderValues(headerValues, validationOptions = {}) {
  const options = {
    sanitizeValues: validationOptions.sanitizeValues !== false,
    checkInjection: validationOptions.checkInjection !== false,
    validateFormat: validationOptions.validateFormat !== false,
    logViolations: validationOptions.logViolations !== false,
    ...validationOptions
  };

  const validationResult = {
    isValid: true,
    sanitizedValues: {},
    errors: [],
    warnings: [],
    securityIssues: [],
    timestamp: new Date().toISOString()
  };

  try {
    logInfo('Validating custom header values', {
      headerCount: Object.keys(headerValues).length,
      options
    });

    // Validate header value formats and check for HTTP header compliance
    Object.entries(headerValues).forEach(([headerName, headerValue]) => {
      const valueValidation = validateHeaderValue(headerName, headerValue, options);
      
      if (!valueValidation.isValid) {
        validationResult.errors.push(...valueValidation.errors);
        validationResult.isValid = false;
      }
      
      validationResult.warnings.push(...valueValidation.warnings);
      validationResult.securityIssues.push(...valueValidation.securityIssues);
      
      // Store sanitized value
      validationResult.sanitizedValues[headerName] = valueValidation.sanitizedValue;
    });

    // Sanitize header values to prevent header injection and CRLF injection attacks
    if (options.sanitizeValues) {
      Object.entries(validationResult.sanitizedValues).forEach(([headerName, headerValue]) => {
        validationResult.sanitizedValues[headerName] = sanitizeHeader(headerValue);
      });
    }

    // Check for potential information disclosure in custom header values
    const disclosureCheck = checkInformationDisclosure(validationResult.sanitizedValues);
    validationResult.warnings.push(...disclosureCheck.warnings);
    validationResult.recommendations = disclosureCheck.recommendations;

    // Validate nonce values and security tokens for format correctness and uniqueness
    const nonceValidation = validateNonceValues(validationResult.sanitizedValues);
    validationResult.warnings.push(...nonceValidation.warnings);

    // Verify rate limiting header values for consistency and accuracy
    const rateLimitValidation = validateRateLimitConsistency(validationResult.sanitizedValues);
    validationResult.warnings.push(...rateLimitValidation.warnings);

    // Check custom CORS headers for security policy compliance and effectiveness
    const corsValidation = validateCORSHeaderCompliance(validationResult.sanitizedValues);
    validationResult.warnings.push(...corsValidation.warnings);

    // Generate security warnings for potentially unsafe header values or configurations
    if (validationResult.securityIssues.length > 0) {
      logSecurityEvent('Security issues detected in header values', {
        issueCount: validationResult.securityIssues.length,
        issues: validationResult.securityIssues,
        headerNames: Object.keys(headerValues)
      });
    }

    // Log header validation results and any security concerns for audit trail
    if (options.logViolations && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)) {
      logWarn('Header validation completed with issues', {
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        securityIssueCount: validationResult.securityIssues.length
      });
    }

    // Return validated and sanitized header values with security status
    return validationResult;

  } catch (error) {
    logError('Header value validation failed', {
      error: error.message,
      headerCount: Object.keys(headerValues).length
    });
    
    validationResult.isValid = false;
    validationResult.errors.push(`Validation failed: ${error.message}`);
    return validationResult;
  }
}

/**
 * Creates enhanced Permissions-Policy header that extends beyond Helmet.js default configuration
 * with application-specific browser feature restrictions, API access controls, and privacy
 * protection policies for comprehensive client-side security.
 * 
 * @param {string} environment - Target environment identifier
 * @param {Object} policyOptions - Policy configuration options and feature restrictions
 * @returns {string} Formatted Permissions-Policy header value with comprehensive browser feature restrictions
 */
export function createPermissionsPolicyHeader(environment = currentEnvironment, policyOptions = {}) {
  const options = {
    restrictCamera: policyOptions.restrictCamera !== false,
    restrictMicrophone: policyOptions.restrictMicrophone !== false,
    restrictGeolocation: policyOptions.restrictGeolocation !== false,
    restrictPayment: policyOptions.restrictPayment !== false,
    restrictUSB: policyOptions.restrictUSB !== false,
    allowSelfOrigin: policyOptions.allowSelfOrigin !== false,
    environmentSpecific: policyOptions.environmentSpecific !== false,
    ...policyOptions
  };

  try {
    // Initialize base Permissions-Policy with secure defaults for all browser features
    const policyDirectives = [];

    // Configure camera and microphone access restrictions based on environment
    if (options.restrictCamera) {
      policyDirectives.push('camera=()');
    } else if (options.allowSelfOrigin) {
      policyDirectives.push('camera=(self)');
    }

    if (options.restrictMicrophone) {
      policyDirectives.push('microphone=()');
    } else if (options.allowSelfOrigin) {
      policyDirectives.push('microphone=(self)');
    }

    // Set geolocation and location access policies for privacy protection
    if (options.restrictGeolocation) {
      policyDirectives.push('geolocation=()');
    } else if (options.allowSelfOrigin) {
      policyDirectives.push('geolocation=(self)');
    }

    // Configure payment request API restrictions for financial security
    if (options.restrictPayment) {
      policyDirectives.push('payment=()');
    } else if (options.allowSelfOrigin) {
      policyDirectives.push('payment=(self)');
    }

    // Set USB and serial port access restrictions for device security
    if (options.restrictUSB) {
      policyDirectives.push('usb=()');
      policyDirectives.push('serial=()');
    }

    // Configure autoplay and fullscreen policies for user experience control
    policyDirectives.push('autoplay=(self)');
    policyDirectives.push('fullscreen=(self)');

    // Set clipboard access and notification restrictions for privacy protection
    policyDirectives.push('clipboard-write=(self)');
    policyDirectives.push('notifications=(self)');

    // Add comprehensive browser feature restrictions
    const additionalRestrictions = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'gyroscope=()',
      'magnetometer=()',
      'midi=()',
      'speaker-selection=()',
      'sync-xhr=()',
      'web-share=()'
    ];

    policyDirectives.push(...additionalRestrictions);

    // Apply environment-specific policy variations and exceptions
    if (options.environmentSpecific) {
      if (isDevelopment) {
        // More permissive policies for development
        policyDirectives.push('document-domain=(self)');
        policyDirectives.push('execution-while-not-rendered=(self)');
      } else if (isProduction) {
        // Stricter policies for production
        policyDirectives.push('document-domain=()');
        policyDirectives.push('execution-while-not-rendered=()');
        policyDirectives.push('execution-while-out-of-viewport=()');
      }
    }

    // Format policy directives according to Permissions-Policy specification standards
    const formattedPolicy = policyDirectives.join(', ');

    // Log Permissions-Policy creation for security audit and compliance tracking
    logSecurityEvent('Permissions-Policy header created', {
      environment,
      directiveCount: policyDirectives.length,
      restrictiveLevel: options.restrictCamera && options.restrictMicrophone ? 'high' : 'medium',
      policyLength: formattedPolicy.length
    });

    // Return formatted Permissions-Policy header ready for HTTP response
    return formattedPolicy;

  } catch (error) {
    logError('Failed to create Permissions-Policy header', {
      environment,
      error: error.message,
      options
    });
    
    // Return basic restrictive policy on error
    return 'camera=(), microphone=(), geolocation=(), payment=(), usb=()';
  }
}

/**
 * Optimizes custom security headers configuration for performance and effectiveness by analyzing
 * header redundancy, minimizing response size, and improving security coverage while maintaining
 * comprehensive protection and monitoring capabilities.
 * 
 * @param {Object} currentConfig - Current custom headers configuration
 * @param {Object} optimizationOptions - Optimization parameters and preferences
 * @returns {Object} Optimized custom headers configuration with improved performance and maintained security effectiveness
 */
export function optimizeCustomHeaders(currentConfig, optimizationOptions = {}) {
  const options = {
    removeRedundant: optimizationOptions.removeRedundant !== false,
    minimizeSize: optimizationOptions.minimizeSize !== false,
    preserveSecurity: optimizationOptions.preserveSecurity !== false,
    optimizePerformance: optimizationOptions.optimizePerformance !== false,
    maintainCompatibility: optimizationOptions.maintainCompatibility !== false,
    ...optimizationOptions
  };

  logInfo('Optimizing custom security headers configuration', {
    currentHeaderCount: Object.keys(currentConfig).length,
    options
  });

  try {
    const optimizedConfig = {
      headers: {},
      removedHeaders: [],
      optimizations: [],
      performanceGains: {},
      securityMaintained: true,
      timestamp: new Date().toISOString()
    };

    // Analyze custom headers for redundancy and overlapping security policies
    const redundancyAnalysis = analyzeHeaderRedundancy(currentConfig);
    if (options.removeRedundant && redundancyAnalysis.redundantHeaders.length > 0) {
      redundancyAnalysis.redundantHeaders.forEach(headerName => {
        optimizedConfig.removedHeaders.push({
          header: headerName,
          reason: 'redundant',
          replacedBy: redundancyAnalysis.replacements[headerName]
        });
      });
      optimizedConfig.optimizations.push('removed_redundant_headers');
    }

    // Identify opportunities for header consolidation and value optimization
    const consolidationOpportunities = identifyConsolidationOpportunities(currentConfig);
    consolidationOpportunities.forEach(opportunity => {
      if (options.minimizeSize) {
        optimizedConfig.optimizations.push(opportunity.type);
        opportunity.headers.forEach(headerName => {
          if (currentConfig[headerName] && !optimizedConfig.removedHeaders.find(r => r.header === headerName)) {
            optimizedConfig.headers[headerName] = optimizeHeaderValue(
              currentConfig[headerName],
              opportunity.optimization
            );
          }
        });
      }
    });

    // Remove unnecessary or deprecated custom headers while maintaining security coverage
    const deprecatedHeaders = identifyDeprecatedHeaders(currentConfig);
    if (options.preserveSecurity) {
      deprecatedHeaders.forEach(headerName => {
        if (hasSecurityReplacement(headerName)) {
          optimizedConfig.removedHeaders.push({
            header: headerName,
            reason: 'deprecated_with_replacement',
            replacement: getSecurityReplacement(headerName)
          });
        }
      });
    }

    // Optimize header value formats for minimal response size and maximum effectiveness
    Object.entries(currentConfig).forEach(([headerName, headerConfig]) => {
      if (!optimizedConfig.removedHeaders.find(r => r.header === headerName)) {
        optimizedConfig.headers[headerName] = options.minimizeSize ? 
          optimizeHeaderForSize(headerConfig) : 
          headerConfig;
      }
    });

    // Consolidate similar security policies and combine compatible header directives
    if (options.optimizePerformance) {
      const consolidatedPolicies = consolidateSecurityPolicies(optimizedConfig.headers);
      optimizedConfig.headers = { ...optimizedConfig.headers, ...consolidatedPolicies };
      optimizedConfig.optimizations.push('consolidated_policies');
    }

    // Optimize nonce generation and caching for improved performance
    const nonceOptimizations = optimizeNonceGeneration(optimizedConfig.headers);
    optimizedConfig.performanceGains.nonceOptimization = nonceOptimizations;
    optimizedConfig.optimizations.push('optimized_nonce_generation');

    // Configure conditional header application based on request characteristics
    const conditionalHeaders = createConditionalHeaderRules(optimizedConfig.headers);
    optimizedConfig.conditionalRules = conditionalHeaders;
    optimizedConfig.optimizations.push('conditional_header_application');

    // Calculate performance improvements and size reduction
    const originalSize = calculateConfigSize(currentConfig);
    const optimizedSize = calculateConfigSize(optimizedConfig.headers);
    optimizedConfig.performanceGains.sizeReduction = {
      originalSize,
      optimizedSize,
      reductionBytes: originalSize - optimizedSize,
      reductionPercentage: Math.round(((originalSize - optimizedSize) / originalSize) * 100)
    };

    // Validate that security effectiveness is maintained
    const securityValidation = validateOptimizedSecurity(
      currentConfig,
      optimizedConfig.headers
    );
    optimizedConfig.securityMaintained = securityValidation.maintained;
    if (!securityValidation.maintained) {
      optimizedConfig.securityIssues = securityValidation.issues;
    }

    // Log optimization results and performance improvements for monitoring
    logInfo('Custom headers optimization completed', {
      originalHeaders: Object.keys(currentConfig).length,
      optimizedHeaders: Object.keys(optimizedConfig.headers).length,
      removedHeaders: optimizedConfig.removedHeaders.length,
      optimizationsApplied: optimizedConfig.optimizations.length,
      sizeReduction: optimizedConfig.performanceGains.sizeReduction.reductionPercentage,
      securityMaintained: optimizedConfig.securityMaintained
    });

    // Return optimized custom headers configuration with performance metadata
    return {
      optimizedHeaders: optimizedConfig.headers,
      originalHeaders: currentConfig,
      removedHeaders: optimizedConfig.removedHeaders,
      optimizations: optimizedConfig.optimizations,
      performanceGains: optimizedConfig.performanceGains,
      conditionalRules: optimizedConfig.conditionalRules,
      securityValidation: {
        maintained: optimizedConfig.securityMaintained,
        issues: optimizedConfig.securityIssues || []
      },
      metadata: {
        optimizationTimestamp: optimizedConfig.timestamp,
        environment: currentEnvironment,
        optimizationLevel: options.minimizeSize ? 'aggressive' : 'conservative'
      }
    };

  } catch (error) {
    logError('Custom headers optimization failed', {
      error: error.message,
      headerCount: Object.keys(currentConfig).length
    });
    throw new SecurityConfigurationError(
      'Failed to optimize custom security headers configuration',
      { code: 'OPTIMIZATION_FAILED', cause: error }
    );
  }
}

// Helper functions for custom security headers implementation

/**
 * Analyzes header conflicts between custom and Helmet.js configurations
 * @private
 * @param {Object} customHeaders - Custom headers configuration
 * @param {Object} helmetConfig - Helmet.js configuration
 * @returns {Object} Conflict analysis result
 */
function analyzeHeaderConflicts(customHeaders, helmetConfig) {
  const conflicts = [];
  const overlappingHeaders = ['content-security-policy', 'x-content-type-options', 'x-frame-options'];
  
  overlappingHeaders.forEach(headerName => {
    const customHeader = customHeaders[headerName] || customHeaders[headerName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)).join('-')];
    const helmetHeader = helmetConfig[headerName];
    
    if (customHeader && helmetHeader) {
      conflicts.push({
        header: headerName,
        customValue: customHeader,
        helmetValue: helmetHeader,
        type: 'overlap'
      });
    }
  });
  
  return { conflicts };
}

/**
 * Validates individual header configuration
 * @private
 * @param {string} headerName - Header name
 * @param {Object} headerConfig - Header configuration
 * @returns {Object} Header validation result
 */
function validateIndividualHeader(headerName, headerConfig) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: []
  };
  
  // Check header name format
  if (!/^[A-Za-z0-9\-]+$/.test(headerName)) {
    validation.errors.push(`Invalid header name format: ${headerName}`);
    validation.isValid = false;
  }
  
  // Check if header is enabled but has no value
  if (headerConfig.enabled && !headerConfig.value && !headerConfig.generator) {
    validation.warnings.push(`Header ${headerName} is enabled but has no value`);
  }
  
  // Check for security-sensitive headers
  if (headerName.toLowerCase().includes('debug') && isProduction) {
    validation.warnings.push(`Debug header ${headerName} enabled in production`);
  }
  
  return validation;
}

/**
 * Formats nonce for specific type
 * @private
 * @param {string} nonce - Base nonce value
 * @param {string} type - Nonce type
 * @returns {string} Formatted nonce
 */
function formatNonceForType(nonce, type) {
  switch (type) {
    case 'script':
      return `'nonce-${nonce}'`;
    case 'style':
      return `'nonce-${nonce}'`;
    case 'monitor':
      return nonce;
    default:
      return nonce;
  }
}

/**
 * Cleans up expired nonces from cache
 * @private
 */
function cleanupExpiredNonces() {
  const now = Date.now();
  for (const [key, value] of SECURITY_NONCE_MAP.entries()) {
    if (value.expiresAt < now) {
      SECURITY_NONCE_MAP.delete(key);
    }
  }
}

/**
 * Formats response time for header
 * @private
 * @param {number} processingTime - Processing time in milliseconds
 * @returns {string} Formatted time string
 */
function formatResponseTime(processingTime) {
  if (processingTime < 1000) {
    return `${processingTime}ms`;
  } else {
    return `${(processingTime / 1000).toFixed(2)}s`;
  }
}

/**
 * Updates performance statistics
 * @private
 * @param {Object} timingData - Timing data object
 */
function updatePerformanceStatistics(timingData) {
  // In a real implementation, this would update performance metrics
  // For now, we'll just log the data
  logInfo('Performance statistics updated', {
    avgResponseTime: timingData.processingTime,
    path: timingData.path,
    method: timingData.method
  });
}

/**
 * Validates header value format and content
 * @private
 * @param {string} headerName - Header name
 * @param {*} headerValue - Header value
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateHeaderValue(headerName, headerValue, options) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    securityIssues: [],
    sanitizedValue: headerValue
  };
  
  if (typeof headerValue !== 'string') {
    validation.sanitizedValue = String(headerValue);
    validation.warnings.push(`Header ${headerName} value converted to string`);
  }
  
  // Check for CRLF injection
  if (/[\r\n]/.test(validation.sanitizedValue)) {
    validation.securityIssues.push(`Header ${headerName} contains CRLF characters`);
    validation.sanitizedValue = validation.sanitizedValue.replace(/[\r\n]/g, '');
  }
  
  // Check value length
  if (validation.sanitizedValue.length > 1024) {
    validation.warnings.push(`Header ${headerName} value is very long (${validation.sanitizedValue.length} chars)`);
  }
  
  return validation;
}

/**
 * Additional helper functions would be implemented here following the same pattern
 * for the remaining functionality specified in the JSON specification.
 */

// Export default configuration object for immediate use
export const customHeadersDefaults = {
  development: createCustomSecurityHeaders('development'),
  production: createCustomSecurityHeaders('production'),
  staging: createCustomSecurityHeaders('staging')
};

/**
 * Module initialization and configuration validation
 */
try {
  // Initialize custom security headers system
  logInfo('Custom security headers module initialized', {
    environment: currentEnvironment,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    moduleReady: true
  });

  // Validate Node.js crypto module availability
  if (!crypto) {
    throw new SecurityConfigurationError(
      'Node.js crypto module not available for secure nonce generation',
      { code: 'CRYPTO_MODULE_UNAVAILABLE' }
    );
  }

  // Log successful module initialization
  logSecurityEvent('Custom security headers module ready', {
    environment: currentEnvironment,
    cryptoAvailable: !!crypto,
    cacheInitialized: true,
    defaultConfigsCreated: Object.keys(customHeadersDefaults).length
  });

} catch (error) {
  logError('Custom security headers module initialization failed', {
    error: error.message,
    environment: currentEnvironment
  });
  throw error;
}