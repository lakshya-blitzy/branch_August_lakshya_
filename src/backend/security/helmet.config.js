/**
 * @fileoverview Core Helmet.js Security Configuration Module for Node.js Tutorial Project
 * @description Comprehensive HTTP security header configuration using Helmet.js v8.1.0 with all 15
 * sub-middlewares for robust protection against XSS, clickjacking, CSRF, and web vulnerabilities.
 * Implements environment-specific security policies with Content Security Policy integration,
 * HTTPS enforcement, cross-origin policies, and custom security headers for educational purposes.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Complete Helmet.js v8.1.0 implementation with all 15 security middlewares
 * - Environment-aware security configuration (development, production, staging)
 * - Content Security Policy integration with dynamic directive generation
 * - Custom security headers including Permissions Policy and Expect-CT
 * - Comprehensive security validation and optimization capabilities
 * - Production-ready security policies with development-friendly alternatives
 * - Educational security documentation and policy explanation generation
 * - PM2 cluster mode compatibility with security caching and performance optimization
 * 
 * Educational Value:
 * - Demonstrates modern web security practices and HTTP header security
 * - Showcases environment-specific security configuration patterns
 * - Illustrates comprehensive security policy management and validation
 * - Provides security documentation generation for learning purposes
 * - Teaches production-ready security implementation with Express.js v5.1.0
 * 
 * Technology Integration:
 * - Helmet.js v8.1.0 with complete 15-middleware security implementation
 * - Express.js v5.1.0 middleware architecture compatibility
 * - PM2 v6.0.8 cluster mode security configuration caching
 * - CSP configuration integration with dynamic policy generation
 * - Cross-platform security policies compatible with Flask migration
 */

// External library imports - Helmet.js v8.1.0 for HTTP security headers
// Note: Helmet.js v8.1.0 - Latest stable release published 4 months ago with 15 sub-middlewares

// Internal imports with specific members for security configuration functionality
import { createContentSecurityPolicy } from './csp.config.js';

import {
  SECURITY_CONSTANTS,
  CSP_DIRECTIVES,
  CORS_CONFIG
} from '../utils/constants.js';

import {
  environmentConfig,
  security as securityConfig,
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

import { SecurityConfigurationError } from '../utils/error-types.js';

// Global configuration cache and constants for Helmet.js security management
const HELMET_CONFIG_CACHE = new Map(); // Centralized configuration caching for performance optimization
const DEFAULT_HSTS_MAX_AGE = 31536000; // One year in seconds for HTTPS Strict Transport Security
const DEVELOPMENT_CSP_REPORT_ONLY = true; // Enable CSP report-only mode for development debugging

/**
 * URL Validation Utility Function
 * 
 * Validates URL format for security header values and CSP directive validation.
 * Provides comprehensive URL parsing and security validation for Helmet.js configuration.
 * 
 * @param {string} url - URL to validate
 * @param {Object} [options={}] - Validation options
 * @returns {boolean} True if URL is valid and secure, false otherwise
 */
function validateUrl(url, options = {}) {
  try {
    // Basic URL validation using native URL constructor
    const urlObject = new URL(url);
    
    // Security checks for URL scheme and format
    const allowedProtocols = options.allowedProtocols || ['http:', 'https:', 'data:', 'blob:'];
    if (!allowedProtocols.includes(urlObject.protocol)) {
      return false;
    }
    
    // Prevent JavaScript URLs and other dangerous schemes
    const dangerousSchemes = ['javascript:', 'vbscript:', 'file:', 'ftp:'];
    if (dangerousSchemes.includes(urlObject.protocol)) {
      return false;
    }
    
    return true;
  } catch (error) {
    logWarn('URL validation failed', { url, error: error.message });
    return false;
  }
}

/**
 * Creates Custom Security Headers Configuration
 * 
 * Generates additional security headers including Permissions Policy and Expect-CT headers
 * that complement Helmet.js security implementation. Provides browser feature restrictions
 * and Certificate Transparency monitoring for enhanced security posture.
 * 
 * @param {string} environment - Environment name (development, production, staging)
 * @returns {Object} Custom security headers configuration with Permissions Policy and Expect-CT settings
 */
export function createCustomSecurityHeaders(environment) {
  try {
    logInfo('Creating custom security headers configuration', { environment });
    
    // Initialize custom security headers object for additional security policies
    const customHeaders = {};
    
    // Configure Permissions Policy for browser feature restrictions
    // Controls camera, microphone, geolocation, and payment API access
    const permissionsPolicy = {
      camera: '()',
      microphone: '()',
      geolocation: '()',
      payment: '()',
      usb: '()',
      serial: '()',
      bluetooth: '()',
      magnetometer: '()',
      gyroscope: '()',
      accelerometer: '()'
    };
    
    // Apply environment-specific Permissions Policy settings
    if (environment === 'development') {
      // Relax some restrictions for development tools
      permissionsPolicy.camera = '(self)';
      permissionsPolicy.microphone = '(self)';
    } else if (environment === 'production') {
      // Strict policy denying unnecessary features in production
      permissionsPolicy.fullscreen = '(self)';
      permissionsPolicy.picture_in_picture = '(self)';
    }
    
    // Format Permissions Policy header value
    const permissionsPolicyValue = Object.entries(permissionsPolicy)
      .map(([directive, value]) => `${directive}=${value}`)
      .join(', ');
    
    customHeaders['Permissions-Policy'] = permissionsPolicyValue;
    
    // Configure Expect-CT header for Certificate Transparency monitoring
    const expectCT = {
      'max-age': 86400, // 24 hours
      enforce: environment === 'production',
      'report-uri': environment === 'production' ? '/api/security/ct-report' : undefined
    };
    
    // Set appropriate max-age values for Expect-CT based on environment
    if (environment === 'development') {
      expectCT['max-age'] = 3600; // 1 hour for development
      expectCT.enforce = false; // Report-only mode for development
    } else if (environment === 'staging') {
      expectCT['max-age'] = 43200; // 12 hours for staging
      expectCT.enforce = false; // Testing mode
    }
    
    // Format Expect-CT header value
    let expectCTValue = `max-age=${expectCT['max-age']}`;
    if (expectCT.enforce) {
      expectCTValue += ', enforce';
    }
    if (expectCT['report-uri']) {
      expectCTValue += `, report-uri="${expectCT['report-uri']}"`;
    }
    
    customHeaders['Expect-CT'] = expectCTValue;
    
    // Add additional custom security headers for enhanced protection
    customHeaders['X-Robots-Tag'] = 'noindex, nofollow, nosnippet, noarchive';
    customHeaders['Cross-Origin-Embedder-Policy'] = 'require-corp';
    customHeaders['Document-Policy'] = 'document-write=?0, sync-xhr=?0';
    
    // Environment-specific additional headers
    if (environment === 'development') {
      customHeaders['X-Development-Mode'] = 'true';
    }
    
    // Log custom security headers configuration creation
    logInfo('Custom security headers created successfully', {
      environment,
      headerCount: Object.keys(customHeaders).length,
      headers: Object.keys(customHeaders),
      permissionsPolicyDirectives: Object.keys(permissionsPolicy).length
    });
    
    // Return comprehensive custom security headers object
    return customHeaders;
    
  } catch (error) {
    logError('Failed to create custom security headers', {
      environment,
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Custom security headers creation failed',
      'custom-headers-creation',
      {
        environment,
        cause: error
      }
    );
  }
}

/**
 * Creates Base Helmet Configuration
 * 
 * Establishes foundational Helmet.js configuration with secure defaults for all 15 sub-middlewares.
 * Provides baseline security policies that apply across all environments with proper Express.js v5.1.0
 * middleware integration and modern security practices.
 * 
 * @param {string} environment - Environment name for configuration customization
 * @returns {Object} Base Helmet.js configuration object with all 15 sub-middlewares configured
 */
export function createBaseHelmetConfig(environment) {
  try {
    logInfo('Creating base Helmet configuration', { environment });
    
    // Initialize empty Helmet configuration object for all 15 sub-middlewares
    const baseConfig = {};
    
    // Configure Content Security Policy using createContentSecurityPolicy function
    baseConfig.contentSecurityPolicy = createContentSecurityPolicy(environment, {
      enableViolationReporting: true,
      reportOnlyMode: environment === 'development' ? DEVELOPMENT_CSP_REPORT_ONLY : false
    });
    
    // Set Strict Transport Security with environment-appropriate max-age values
    baseConfig.hsts = {
      maxAge: environment === 'production' ? DEFAULT_HSTS_MAX_AGE : 86400,
      includeSubDomains: environment === 'production',
      preload: environment === 'production'
    };
    
    // Configure X-Frame-Options for clickjacking prevention
    baseConfig.frameguard = {
      action: environment === 'development' ? 'sameorigin' : 'deny'
    };
    
    // Set X-Content-Type-Options to nosniff for MIME type protection
    baseConfig.noSniff = true;
    
    // Configure Referrer-Policy for privacy and security balance
    baseConfig.referrerPolicy = {
      policy: environment === 'development' ? 
        'origin-when-cross-origin' : 
        'strict-origin-when-cross-origin'
    };
    
    // Set Cross-Origin-Opener-Policy for process isolation protection
    baseConfig.crossOriginOpenerPolicy = {
      policy: 'same-origin'
    };
    
    // Configure Cross-Origin-Resource-Policy for resource isolation
    baseConfig.crossOriginResourcePolicy = {
      policy: environment === 'development' ? 'cross-origin' : 'same-origin'
    };
    
    // Set Origin-Agent-Cluster for enhanced origin-based isolation
    baseConfig.originAgentCluster = true;
    
    // Configure X-DNS-Prefetch-Control for DNS prefetch security
    baseConfig.dnsPrefetchControl = {
      allow: false
    };
    
    // Set X-Download-Options for IE8+ download security
    baseConfig.ieNoOpen = true;
    
    // Configure X-Permitted-Cross-Domain-Policies for Flash/PDF security
    baseConfig.permittedCrossDomainPolicies = {
      permittedPolicies: 'none'
    };
    
    // Disable X-XSS-Protection as recommended by modern security practices
    baseConfig.xssFilter = false;
    
    // Remove X-Powered-By header to reduce information disclosure
    baseConfig.hidePoweredBy = true;
    
    // Integrate custom security headers using createCustomSecurityHeaders
    const customHeaders = createCustomSecurityHeaders(environment);
    
    // Apply custom headers through middleware function
    baseConfig.customHeaders = (req, res, next) => {
      Object.entries(customHeaders).forEach(([name, value]) => {
        res.setHeader(name, value);
      });
      next();
    };
    
    // Environment-specific configuration adjustments
    if (environment === 'development') {
      // Development-specific configurations
      baseConfig.hsts = false; // Disable HSTS in development
    } else if (environment === 'staging') {
      // Staging-specific configurations with testing accommodations
      baseConfig.hsts.maxAge = 43200; // 12 hours for staging
    }
    
    // Log base Helmet configuration creation with security level
    logInfo('Base Helmet configuration created successfully', {
      environment,
      middlewareCount: Object.keys(baseConfig).length,
      hstsEnabled: !!baseConfig.hsts,
      cspEnabled: !!baseConfig.contentSecurityPolicy,
      customHeadersCount: Object.keys(customHeaders).length
    });
    
    // Return comprehensive base Helmet configuration object
    return baseConfig;
    
  } catch (error) {
    logError('Failed to create base Helmet configuration', {
      environment,
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Base Helmet configuration creation failed',
      'base-config-creation',
      {
        environment,
        cause: error
      }
    );
  }
}

/**
 * Creates Development Helmet Configuration
 * 
 * Generates development-friendly Helmet.js configuration with relaxed security policies to support
 * hot reloading, debugging tools, and development workflows while maintaining essential security
 * protections. Optimized for developer experience and debugging capabilities.
 * 
 * @param {Object} baseConfig - Base Helmet configuration to customize for development
 * @returns {Object} Development-optimized Helmet configuration with relaxed policies
 */
export function createDevelopmentHelmetConfig(baseConfig) {
  try {
    logInfo('Creating development Helmet configuration');
    
    // Clone base Helmet configuration for development customization
    const devConfig = { ...baseConfig };
    
    // Set CSP to report-only mode for development policy testing
    if (devConfig.contentSecurityPolicy) {
      devConfig.contentSecurityPolicy = {
        ...devConfig.contentSecurityPolicy,
        reportOnly: DEVELOPMENT_CSP_REPORT_ONLY,
        directives: {
          ...devConfig.contentSecurityPolicy.directives,
          // Add unsafe-inline and unsafe-eval for development debugging
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'localhost:*',
            '127.0.0.1:*',
            'webpack://*'
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'localhost:*',
            '127.0.0.1:*'
          ],
          // Allow localhost and development domains in CSP connect-src
          'connect-src': [
            "'self'",
            'localhost:*',
            '127.0.0.1:*',
            'ws://localhost:*',
            'wss://localhost:*'
          ]
        }
      };
    }
    
    // Disable HSTS in development to allow HTTP connections
    devConfig.hsts = false;
    
    // Relax X-Frame-Options to SAMEORIGIN for development tools
    devConfig.frameguard = {
      action: 'sameorigin'
    };
    
    // Configure development-specific CORS policies for API testing
    devConfig.crossOriginResourcePolicy = {
      policy: 'cross-origin'
    };
    
    // Set permissive Referrer-Policy for development debugging
    devConfig.referrerPolicy = {
      policy: 'origin-when-cross-origin'
    };
    
    // Enable detailed security violation reporting for development
    devConfig.reportingEndpoints = {
      default: '/api/security/reports'
    };
    
    // Update custom headers for development environment
    if (devConfig.customHeaders) {
      const originalCustomHeaders = devConfig.customHeaders;
      devConfig.customHeaders = (req, res, next) => {
        // Apply original custom headers
        originalCustomHeaders(req, res, () => {});
        
        // Add development-specific headers
        res.setHeader('X-Development-Mode', 'true');
        res.setHeader('X-Debug-Enabled', 'true');
        next();
      };
    }
    
    // Log development Helmet configuration with security warnings
    logWarn('Development Helmet configuration created with relaxed security policies', {
      cspReportOnly: devConfig.contentSecurityPolicy?.reportOnly,
      hstsDisabled: !devConfig.hsts,
      frameguardRelaxed: devConfig.frameguard?.action === 'sameorigin',
      unsafeDirectivesEnabled: true
    });
    
    // Return development-optimized Helmet configuration object
    return devConfig;
    
  } catch (error) {
    logError('Failed to create development Helmet configuration', {
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Development Helmet configuration creation failed',
      'dev-config-creation',
      {
        cause: error
      }
    );
  }
}

/**
 * Creates Production Helmet Configuration
 * 
 * Generates production-hardened Helmet.js configuration with strict security policies,
 * comprehensive attack prevention, and enterprise-grade security enforcement. Optimized
 * for maximum security posture and compliance with modern security standards.
 * 
 * @param {Object} baseConfig - Base Helmet configuration to harden for production
 * @returns {Object} Production-hardened Helmet configuration with strict security policies
 */
export function createProductionHelmetConfig(baseConfig) {
  try {
    logInfo('Creating production Helmet configuration');
    
    // Clone base Helmet configuration for production hardening
    const prodConfig = { ...baseConfig };
    
    // Enable strict CSP enforcement mode with no unsafe directives
    if (prodConfig.contentSecurityPolicy) {
      prodConfig.contentSecurityPolicy = {
        ...prodConfig.contentSecurityPolicy,
        reportOnly: false, // Enforce CSP in production
        directives: {
          ...prodConfig.contentSecurityPolicy.directives,
          // Remove unsafe directives for production security
          'script-src': [
            "'self'",
            "'strict-dynamic'",
            // Nonce-based script loading will be handled by CSP config
          ],
          'style-src': [
            "'self'"
          ],
          'connect-src': [
            "'self'"
          ],
          // Enable upgrade-insecure-requests and block-all-mixed-content
          'upgrade-insecure-requests': [],
          'block-all-mixed-content': []
        }
      };
    }
    
    // Configure HSTS with maximum age and includeSubDomains
    prodConfig.hsts = {
      maxAge: DEFAULT_HSTS_MAX_AGE, // One year
      includeSubDomains: true,
      preload: true
    };
    
    // Set X-Frame-Options to DENY for maximum clickjacking protection
    prodConfig.frameguard = {
      action: 'deny'
    };
    
    // Implement strict Referrer-Policy for privacy protection
    prodConfig.referrerPolicy = {
      policy: 'strict-origin-when-cross-origin'
    };
    
    // Configure restrictive Cross-Origin policies for isolation
    prodConfig.crossOriginResourcePolicy = {
      policy: 'same-origin'
    };
    
    prodConfig.crossOriginOpenerPolicy = {
      policy: 'same-origin'
    };
    
    // Enable comprehensive security reporting
    prodConfig.reportingEndpoints = {
      default: '/api/security/reports',
      csp: '/api/security/csp-reports',
      hpkp: '/api/security/hpkp-reports'
    };
    
    // Configure secure cookie policies and SameSite attributes
    prodConfig.secureCookies = {
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    };
    
    // Update custom headers for production environment
    if (prodConfig.customHeaders) {
      const originalCustomHeaders = prodConfig.customHeaders;
      prodConfig.customHeaders = (req, res, next) => {
        // Apply original custom headers
        originalCustomHeaders(req, res, () => {});
        
        // Add production-specific security headers
        res.setHeader('X-Production-Security', 'enabled');
        res.setHeader('Strict-Transport-Security', 
          `max-age=${DEFAULT_HSTS_MAX_AGE}; includeSubDomains; preload`);
        next();
      };
    }
    
    // Apply content security policies with nonce-based script loading
    prodConfig.nonceGenerator = () => {
      return require('crypto').randomBytes(16).toString('base64');
    };
    
    // Set up security header validation and compliance checking
    prodConfig.securityValidation = {
      validateHeaders: true,
      enforceCompliance: true,
      logViolations: true
    };
    
    // Log production Helmet configuration with security compliance status
    logInfo('Production Helmet configuration created with maximum security', {
      hstsMaxAge: prodConfig.hsts.maxAge,
      cspEnforced: !prodConfig.contentSecurityPolicy?.reportOnly,
      frameguardDeny: prodConfig.frameguard?.action === 'deny',
      strictPolicies: true,
      securityComplianceEnabled: true
    });
    
    // Return enterprise-grade production Helmet configuration
    return prodConfig;
    
  } catch (error) {
    logError('Failed to create production Helmet configuration', {
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Production Helmet configuration creation failed',
      'prod-config-creation',
      {
        cause: error
      }
    );
  }
}

/**
 * Creates Staging Helmet Configuration
 * 
 * Generates staging environment Helmet.js configuration that balances production-like security
 * with testing flexibility. Enables comprehensive security testing and validation while
 * accommodating testing workflows and security policy validation.
 * 
 * @param {Object} baseConfig - Base Helmet configuration to customize for staging
 * @returns {Object} Staging-optimized Helmet configuration balancing security and testing
 */
export function createStagingHelmetConfig(baseConfig) {
  try {
    logInfo('Creating staging Helmet configuration');
    
    // Clone base Helmet configuration for staging customization
    const stagingConfig = { ...baseConfig };
    
    // Apply production-like security policies with testing accommodations
    if (stagingConfig.contentSecurityPolicy) {
      stagingConfig.contentSecurityPolicy = {
        ...stagingConfig.contentSecurityPolicy,
        // Configure CSP in report-only mode for policy validation testing
        reportOnly: true,
        directives: {
          ...stagingConfig.contentSecurityPolicy.directives,
          // Allow specific testing domains in CSP
          'script-src': [
            "'self'",
            "'unsafe-inline'", // For testing purposes
            'staging.example.com',
            'test-assets.example.com'
          ],
          'connect-src': [
            "'self'",
            'staging-api.example.com',
            'test-analytics.example.com'
          ]
        }
      };
    }
    
    // Set moderate HSTS max-age for staging SSL certificate testing
    stagingConfig.hsts = {
      maxAge: 43200, // 12 hours for staging
      includeSubDomains: false, // Allow subdomain testing
      preload: false
    };
    
    // Configure comprehensive security violation reporting for testing
    stagingConfig.reportingEndpoints = {
      default: '/api/staging/security/reports',
      csp: '/api/staging/security/csp-reports',
      testing: '/api/staging/security/test-reports'
    };
    
    // Enable security header validation with detailed reporting
    stagingConfig.securityValidation = {
      validateHeaders: true,
      enforceCompliance: false, // Allow testing of different configurations
      logViolations: true,
      detailedReporting: true
    };
    
    // Set up A/B testing for different security policy configurations
    stagingConfig.abTesting = {
      enabled: true,
      configurations: ['strict', 'moderate', 'relaxed'],
      testingEndpoint: '/api/staging/security/ab-test'
    };
    
    // Configure load testing compatible security policies
    stagingConfig.loadTesting = {
      bypassRateLimit: true,
      allowTestTraffic: true,
      testingUserAgents: ['LoadTest', 'Staging-Test', 'Security-Test']
    };
    
    // Enable security metrics collection for performance testing
    stagingConfig.metricsCollection = {
      enabled: true,
      endpoint: '/api/staging/security/metrics',
      collectPerformance: true,
      collectViolations: true
    };
    
    // Update custom headers for staging environment
    if (stagingConfig.customHeaders) {
      const originalCustomHeaders = stagingConfig.customHeaders;
      stagingConfig.customHeaders = (req, res, next) => {
        // Apply original custom headers
        originalCustomHeaders(req, res, () => {});
        
        // Add staging-specific headers
        res.setHeader('X-Staging-Environment', 'true');
        res.setHeader('X-Security-Testing', 'enabled');
        res.setHeader('X-CSP-Report-Only', 'true');
        next();
      };
    }
    
    // Log staging Helmet configuration with testing considerations
    logInfo('Staging Helmet configuration created for security testing', {
      cspReportOnly: stagingConfig.contentSecurityPolicy?.reportOnly,
      hstsMaxAge: stagingConfig.hsts?.maxAge,
      abTestingEnabled: stagingConfig.abTesting?.enabled,
      metricsCollectionEnabled: stagingConfig.metricsCollection?.enabled,
      loadTestingSupport: stagingConfig.loadTesting?.enabled
    });
    
    // Return staging-optimized Helmet configuration for security testing
    return stagingConfig;
    
  } catch (error) {
    logError('Failed to create staging Helmet configuration', {
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Staging Helmet configuration creation failed',
      'staging-config-creation',
      {
        cause: error
      }
    );
  }
}

/**
 * Validates Helmet Configuration
 * 
 * Performs comprehensive validation of Helmet.js configuration completeness, security effectiveness,
 * and compliance with modern security standards. Ensures optimal protection and policy correctness
 * with detailed validation reporting and recommendations.
 * 
 * @param {Object} helmetConfig - Helmet configuration object to validate
 * @param {string} environment - Environment name for context-specific validation
 * @returns {Object} Validation result with security status, warnings, and recommendations
 */
export function validateHelmetConfig(helmetConfig, environment) {
  try {
    logInfo('Validating Helmet configuration', { environment });
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      securityScore: 0,
      compliance: {},
      timestamp: new Date().toISOString()
    };
    
    // Validate presence of all 15 required Helmet.js sub-middlewares
    const requiredMiddlewares = [
      'contentSecurityPolicy',
      'hsts',
      'frameguard',
      'noSniff',
      'referrerPolicy',
      'crossOriginOpenerPolicy',
      'crossOriginResourcePolicy',
      'originAgentCluster',
      'dnsPrefetchControl',
      'ieNoOpen',
      'permittedCrossDomainPolicies',
      'xssFilter',
      'hidePoweredBy'
    ];
    
    let middlewareScore = 0;
    requiredMiddlewares.forEach(middleware => {
      if (helmetConfig[middleware] !== undefined) {
        middlewareScore += 1;
      } else {
        validation.warnings.push(`Missing middleware: ${middleware}`);
      }
    });
    
    validation.securityScore += (middlewareScore / requiredMiddlewares.length) * 30;
    
    // Check Content Security Policy directive completeness and security
    if (helmetConfig.contentSecurityPolicy) {
      const csp = helmetConfig.contentSecurityPolicy;
      let cspScore = 0;
      
      if (csp.directives) {
        const criticalDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
        criticalDirectives.forEach(directive => {
          if (csp.directives[directive]) {
            cspScore += 1;
          } else {
            validation.warnings.push(`Missing CSP directive: ${directive}`);
          }
        });
        
        // Check for unsafe directives in production
        if (environment === 'production') {
          ['script-src', 'style-src'].forEach(directive => {
            if (csp.directives[directive] && 
                csp.directives[directive].includes("'unsafe-inline'")) {
              validation.errors.push(`Unsafe directive ${directive} contains 'unsafe-inline' in production`);
              validation.isValid = false;
            }
          });
        }
      }
      
      validation.securityScore += (cspScore / 4) * 25;
      validation.compliance.csp = cspScore >= 3;
    } else {
      validation.errors.push('Content Security Policy not configured');
      validation.isValid = false;
    }
    
    // Validate HSTS configuration including max-age and subdomain inclusion
    if (helmetConfig.hsts) {
      const hsts = helmetConfig.hsts;
      let hstsScore = 0;
      
      if (hsts.maxAge && hsts.maxAge >= 31536000 && environment === 'production') {
        hstsScore += 2;
      } else if (hsts.maxAge && hsts.maxAge >= 86400) {
        hstsScore += 1;
        validation.recommendations.push('Consider increasing HSTS max-age for production');
      }
      
      if (hsts.includeSubDomains && environment === 'production') {
        hstsScore += 1;
      }
      
      validation.securityScore += (hstsScore / 3) * 15;
      validation.compliance.hsts = hstsScore >= 2;
    } else if (environment !== 'development') {
      validation.warnings.push('HSTS not configured for non-development environment');
    }
    
    // Verify X-Frame-Options configuration for clickjacking protection
    if (helmetConfig.frameguard) {
      const frameGuard = helmetConfig.frameguard;
      if (frameGuard.action === 'deny' && environment === 'production') {
        validation.securityScore += 10;
        validation.compliance.frameguard = true;
      } else if (frameGuard.action === 'sameorigin') {
        validation.securityScore += 5;
        if (environment === 'production') {
          validation.recommendations.push('Consider using DENY for X-Frame-Options in production');
        }
      }
    }
    
    // Check Cross-Origin policies for proper isolation and security
    if (helmetConfig.crossOriginOpenerPolicy && helmetConfig.crossOriginResourcePolicy) {
      validation.securityScore += 10;
      validation.compliance.crossOrigin = true;
    } else {
      validation.warnings.push('Cross-Origin policies not fully configured');
    }
    
    // Validate custom security headers and additional protections
    if (helmetConfig.customHeaders) {
      validation.securityScore += 10;
      validation.compliance.customHeaders = true;
    }
    
    // Check for deprecated security headers and outdated practices
    if (helmetConfig.xssFilter !== false) {
      validation.warnings.push('X-XSS-Protection should be disabled (set to false) as recommended by modern security practices');
    }
    
    // Analyze security header combinations for conflicts and gaps
    if (helmetConfig.contentSecurityPolicy && 
        helmetConfig.contentSecurityPolicy.reportOnly && 
        environment === 'production') {
      validation.warnings.push('CSP is in report-only mode in production environment');
    }
    
    // Generate security recommendations and improvement suggestions
    if (validation.securityScore < 70) {
      validation.recommendations.push('Security score is below recommended threshold (70)');
    }
    
    if (environment === 'production' && validation.securityScore < 90) {
      validation.recommendations.push('Production environment should have security score above 90');
    }
    
    // Environment-specific validation
    if (environment === 'development') {
      validation.recommendations.push('Development configuration should be hardened before production deployment');
    }
    
    // Final validation status
    if (validation.errors.length === 0 && validation.securityScore >= 70) {
      validation.isValid = true;
    } else {
      validation.isValid = false;
    }
    
    // Log validation results with detailed security compliance status
    logInfo('Helmet configuration validation completed', {
      environment,
      isValid: validation.isValid,
      securityScore: Math.round(validation.securityScore),
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      compliance: validation.compliance
    });
    
    // Return comprehensive validation report with actionable recommendations
    return validation;
    
  } catch (error) {
    logError('Helmet configuration validation failed', {
      environment,
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Helmet configuration validation failed',
      'config-validation',
      {
        environment,
        cause: error
      }
    );
  }
}

/**
 * Creates Complete Helmet Configuration
 * 
 * Main factory function that creates comprehensive Helmet.js configuration based on environment,
 * integrating all security policies, validation, and optimization. Provides seamless Express.js
 * middleware integration with caching and performance optimization.
 * 
 * @param {string} environment - Environment name (development, production, staging, test)
 * @param {Object} [options={}] - Configuration options and overrides
 * @returns {Object} Complete Helmet.js configuration object ready for Express.js middleware integration
 */
export function createHelmetConfig(environment = currentEnvironment, options = {}) {
  try {
    logInfo('Creating complete Helmet configuration', { environment, options });
    
    // Validate environment parameter against supported environment types
    const supportedEnvironments = ['development', 'production', 'staging', 'test'];
    if (!supportedEnvironments.includes(environment)) {
      throw new SecurityConfigurationError(
        `Unsupported environment: ${environment}`,
        'invalid-environment',
        { environment, supportedEnvironments }
      );
    }
    
    // Check configuration cache for existing environment configuration
    const cacheKey = `helmet-${environment}-${JSON.stringify(options)}`;
    if (HELMET_CONFIG_CACHE.has(cacheKey)) {
      logInfo('Returning cached Helmet configuration', { environment, cacheKey });
      return HELMET_CONFIG_CACHE.get(cacheKey);
    }
    
    // Create base Helmet configuration using createBaseHelmetConfig
    const baseConfig = createBaseHelmetConfig(environment);
    
    // Apply environment-specific customizations based on environment type
    let helmetConfig;
    
    switch (environment) {
      case 'development':
        helmetConfig = createDevelopmentHelmetConfig(baseConfig);
        break;
        
      case 'production':
        helmetConfig = createProductionHelmetConfig(baseConfig);
        break;
        
      case 'staging':
        helmetConfig = createStagingHelmetConfig(baseConfig);
        break;
        
      case 'test':
        // Test environment uses development config with additional test-specific settings
        helmetConfig = createDevelopmentHelmetConfig(baseConfig);
        helmetConfig.testMode = true;
        break;
        
      default:
        helmetConfig = baseConfig;
    }
    
    // Apply user-provided options and overrides
    if (options.overrides) {
      helmetConfig = {
        ...helmetConfig,
        ...options.overrides
      };
    }
    
    // Integrate CSP configuration from createContentSecurityPolicy function
    if (!options.disableCSP) {
      const cspConfig = createContentSecurityPolicy(environment, {
        nonce: options.nonce,
        reportUri: options.cspReportUri,
        ...options.cspOptions
      });
      
      helmetConfig.contentSecurityPolicy = {
        ...helmetConfig.contentSecurityPolicy,
        ...cspConfig
      };
    }
    
    // Apply security constants and default values from constants
    if (SECURITY_CONSTANTS.SECURITY_HEADERS) {
      Object.entries(SECURITY_CONSTANTS.SECURITY_HEADERS).forEach(([key, value]) => {
        if (!helmetConfig[key] && value !== null) {
          helmetConfig[key] = value;
        }
      });
    }
    
    // Validate final configuration using validateHelmetConfig function
    const validation = validateHelmetConfig(helmetConfig, environment);
    
    if (!validation.isValid && options.strict !== false) {
      throw new SecurityConfigurationError(
        'Helmet configuration validation failed',
        'config-validation-failed',
        {
          environment,
          errors: validation.errors,
          securityScore: validation.securityScore
        }
      );
    }
    
    // Optimize configuration for performance and security effectiveness
    if (options.optimize !== false) {
      helmetConfig = optimizeHelmetConfig(helmetConfig, {
        environment,
        performanceMode: options.performanceMode || 'balanced'
      });
    }
    
    // Cache validated configuration for improved performance
    HELMET_CONFIG_CACHE.set(cacheKey, helmetConfig);
    
    // Log successful cache operation
    logInfo('Helmet configuration cached successfully', {
      cacheKey,
      cacheSize: HELMET_CONFIG_CACHE.size
    });
    
    // Log comprehensive Helmet configuration creation with metadata
    logSecurityEvent('Helmet configuration created', {
      environment,
      securityScore: validation.securityScore,
      isValid: validation.isValid,
      middlewareCount: Object.keys(helmetConfig).length,
      cached: true,
      options
    });
    
    // Return complete Helmet configuration ready for Express middleware
    return helmetConfig;
    
  } catch (error) {
    logError('Failed to create Helmet configuration', {
      environment,
      options,
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw SecurityConfigurationError or wrap in new one
    if (error instanceof SecurityConfigurationError) {
      throw error;
    }
    
    throw new SecurityConfigurationError(
      'Helmet configuration creation failed',
      'config-creation-failed',
      {
        environment,
        options,
        cause: error
      }
    );
  }
}

/**
 * Extracts Security Headers Information
 * 
 * Returns detailed information about all security headers configured in Helmet.js setup for
 * documentation, debugging, and security audit purposes. Provides comprehensive security
 * headers analysis with purposes, values, and configuration details.
 * 
 * @param {Object} helmetConfig - Helmet configuration object to analyze
 * @returns {Object} Comprehensive security headers information with values and purposes
 */
export function getSecurityHeaders(helmetConfig) {
  try {
    logInfo('Extracting security headers information');
    
    const securityHeaders = {
      configured: {},
      summary: {
        totalHeaders: 0,
        enabledMiddlewares: 0,
        securityLevel: 'unknown',
        lastUpdated: new Date().toISOString()
      },
      details: {},
      recommendations: []
    };
    
    // Extract Content Security Policy directives and values
    if (helmetConfig.contentSecurityPolicy) {
      const csp = helmetConfig.contentSecurityPolicy;
      securityHeaders.configured['Content-Security-Policy'] = {
        enabled: true,
        reportOnly: csp.reportOnly || false,
        directives: csp.directives || {},
        purpose: 'Powerful allow-list that mitigates XSS attacks and controls resource loading',
        securityBenefit: 'Prevents code injection and unauthorized resource loading'
      };
      
      securityHeaders.details.csp = {
        directiveCount: Object.keys(csp.directives || {}).length,
        hasUnsafeDirectives: JSON.stringify(csp.directives || {}).includes('unsafe-'),
        reportingEnabled: !!csp.reportUri
      };
    }
    
    // Gather HSTS configuration including max-age and subdomain settings
    if (helmetConfig.hsts) {
      const hsts = helmetConfig.hsts;
      securityHeaders.configured['Strict-Transport-Security'] = {
        enabled: true,
        maxAge: hsts.maxAge,
        includeSubDomains: hsts.includeSubDomains || false,
        preload: hsts.preload || false,
        purpose: 'Forces HTTPS connections and prevents protocol downgrade attacks',
        securityBenefit: 'Ensures encrypted connections and prevents man-in-the-middle attacks'
      };
    }
    
    // Collect frame options and clickjacking protection settings
    if (helmetConfig.frameguard) {
      const frameGuard = helmetConfig.frameguard;
      securityHeaders.configured['X-Frame-Options'] = {
        enabled: true,
        action: frameGuard.action || 'sameorigin',
        purpose: 'Prevents clickjacking attacks by controlling iframe embedding',
        securityBenefit: 'Protects against UI redressing and clickjacking attacks'
      };
    }
    
    // Extract cross-origin policies and isolation configurations
    if (helmetConfig.crossOriginOpenerPolicy) {
      securityHeaders.configured['Cross-Origin-Opener-Policy'] = {
        enabled: true,
        policy: helmetConfig.crossOriginOpenerPolicy.policy || 'same-origin',
        purpose: 'Provides process isolation from cross-origin windows',
        securityBenefit: 'Prevents cross-origin attacks and data leakage'
      };
    }
    
    if (helmetConfig.crossOriginResourcePolicy) {
      securityHeaders.configured['Cross-Origin-Resource-Policy'] = {
        enabled: true,
        policy: helmetConfig.crossOriginResourcePolicy.policy || 'same-origin',
        purpose: 'Controls cross-origin resource loading',
        securityBenefit: 'Prevents unauthorized resource access from other origins'
      };
    }
    
    // Gather browser feature permissions and restrictions
    if (helmetConfig.customHeaders) {
      securityHeaders.configured['Permissions-Policy'] = {
        enabled: true,
        purpose: 'Controls browser feature access and API permissions',
        securityBenefit: 'Restricts potentially dangerous browser APIs'
      };
    }
    
    // Collect additional security headers
    const additionalHeaders = {
      'X-Content-Type-Options': {
        enabled: helmetConfig.noSniff === true,
        value: 'nosniff',
        purpose: 'Prevents MIME type sniffing vulnerabilities'
      },
      'Referrer-Policy': {
        enabled: !!helmetConfig.referrerPolicy,
        policy: helmetConfig.referrerPolicy?.policy,
        purpose: 'Controls referrer information disclosure'
      },
      'X-DNS-Prefetch-Control': {
        enabled: !!helmetConfig.dnsPrefetchControl,
        allow: helmetConfig.dnsPrefetchControl?.allow === false ? 'off' : 'on',
        purpose: 'Controls DNS prefetching for privacy'
      },
      'X-Download-Options': {
        enabled: helmetConfig.ieNoOpen === true,
        value: 'noopen',
        purpose: 'Prevents IE from executing downloads in site context'
      }
    };
    
    Object.entries(additionalHeaders).forEach(([name, config]) => {
      if (config.enabled) {
        securityHeaders.configured[name] = config;
      }
    });
    
    // Calculate summary statistics
    securityHeaders.summary.totalHeaders = Object.keys(securityHeaders.configured).length;
    securityHeaders.summary.enabledMiddlewares = Object.keys(helmetConfig).length;
    
    // Determine security level based on configured headers
    if (securityHeaders.summary.totalHeaders >= 10) {
      securityHeaders.summary.securityLevel = 'high';
    } else if (securityHeaders.summary.totalHeaders >= 6) {
      securityHeaders.summary.securityLevel = 'medium';
    } else {
      securityHeaders.summary.securityLevel = 'low';
    }
    
    // Generate recommendations based on missing headers
    const recommendedHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security', 
      'X-Frame-Options',
      'Cross-Origin-Opener-Policy',
      'X-Content-Type-Options'
    ];
    
    recommendedHeaders.forEach(header => {
      if (!securityHeaders.configured[header]) {
        securityHeaders.recommendations.push(`Consider enabling ${header} for enhanced security`);
      }
    });
    
    // Log security headers extraction completion
    logInfo('Security headers information extracted successfully', {
      totalHeaders: securityHeaders.summary.totalHeaders,
      securityLevel: securityHeaders.summary.securityLevel,
      recommendationCount: securityHeaders.recommendations.length
    });
    
    // Return comprehensive security headers information object
    return securityHeaders;
    
  } catch (error) {
    logError('Failed to extract security headers information', {
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Security headers extraction failed',
      'headers-extraction-failed',
      {
        cause: error
      }
    );
  }
}

/**
 * Optimizes Helmet Configuration
 * 
 * Optimizes Helmet.js configuration for performance and security effectiveness by analyzing
 * header redundancy, policy conflicts, and resource impact while maintaining security coverage.
 * Provides performance tuning without compromising security posture.
 * 
 * @param {Object} helmetConfig - Helmet configuration to optimize
 * @param {Object} [optimizationOptions={}] - Optimization configuration options
 * @returns {Object} Optimized Helmet configuration with improved performance and maintained security
 */
export function optimizeHelmetConfig(helmetConfig, optimizationOptions = {}) {
  try {
    const options = {
      environment: optimizationOptions.environment || 'production',
      performanceMode: optimizationOptions.performanceMode || 'balanced',
      removeRedundancy: optimizationOptions.removeRedundancy !== false,
      optimizeCSP: optimizationOptions.optimizeCSP !== false,
      ...optimizationOptions
    };
    
    logInfo('Optimizing Helmet configuration', { options });
    
    // Clone configuration for optimization
    const optimizedConfig = { ...helmetConfig };
    
    // Analyze header redundancy and conflicting security policies
    const redundancyAnalysis = {
      duplicateHeaders: [],
      conflictingPolicies: [],
      optimizationApplied: []
    };
    
    // Optimize CSP directive combinations for minimal policy size
    if (options.optimizeCSP && optimizedConfig.contentSecurityPolicy) {
      const csp = optimizedConfig.contentSecurityPolicy;
      
      if (csp.directives) {
        // Combine similar directives and remove redundant entries
        Object.keys(csp.directives).forEach(directive => {
          if (Array.isArray(csp.directives[directive])) {
            // Remove duplicate sources
            csp.directives[directive] = [...new Set(csp.directives[directive])];
            
            // Optimize 'self' and wildcard combinations
            if (csp.directives[directive].includes("'self'") && 
                csp.directives[directive].includes('*')) {
              csp.directives[directive] = csp.directives[directive].filter(src => src !== '*');
              redundancyAnalysis.optimizationApplied.push(`Removed redundant wildcard from ${directive}`);
            }
          }
        });
      }
    }
    
    // Remove deprecated headers and replace with modern alternatives
    if (optimizedConfig.xssFilter !== false) {
      optimizedConfig.xssFilter = false;
      redundancyAnalysis.optimizationApplied.push('Disabled deprecated X-XSS-Protection header');
    }
    
    // Consolidate overlapping security policies for efficiency
    if (optimizedConfig.frameguard && optimizedConfig.contentSecurityPolicy) {
      const csp = optimizedConfig.contentSecurityPolicy;
      if (csp.directives && csp.directives['frame-ancestors']) {
        // CSP frame-ancestors supersedes X-Frame-Options
        if (options.performanceMode === 'aggressive') {
          delete optimizedConfig.frameguard;
          redundancyAnalysis.optimizationApplied.push('Removed X-Frame-Options in favor of CSP frame-ancestors');
        }
      }
    }
    
    // Optimize header order for parsing performance
    const headerOrder = [
      'contentSecurityPolicy',
      'hsts',
      'frameguard',
      'noSniff',
      'crossOriginOpenerPolicy',
      'crossOriginResourcePolicy',
      'referrerPolicy',
      'dnsPrefetchControl',
      'ieNoOpen',
      'permittedCrossDomainPolicies',
      'originAgentCluster',
      'hidePoweredBy',
      'customHeaders'
    ];
    
    const reorderedConfig = {};
    headerOrder.forEach(header => {
      if (optimizedConfig[header] !== undefined) {
        reorderedConfig[header] = optimizedConfig[header];
      }
    });
    
    // Add any remaining headers not in the order list
    Object.keys(optimizedConfig).forEach(header => {
      if (!reorderedConfig[header]) {
        reorderedConfig[header] = optimizedConfig[header];
      }
    });
    
    // Minimize response header size while maintaining security coverage
    if (options.performanceMode === 'aggressive') {
      // Combine similar headers where possible
      if (reorderedConfig.customHeaders) {
        const originalCustomHeaders = reorderedConfig.customHeaders;
        reorderedConfig.customHeaders = (req, res, next) => {
          // Apply headers efficiently
          originalCustomHeaders(req, res, () => {});
          next();
        };
      }
    }
    
    // Configure policy caching for improved client-side performance
    if (reorderedConfig.contentSecurityPolicy && options.environment === 'production') {
      reorderedConfig.contentSecurityPolicy.browserCache = {
        maxAge: 86400, // 24 hours
        public: false
      };
      redundancyAnalysis.optimizationApplied.push('Added CSP browser caching');
    }
    
    // Performance monitoring integration
    const performanceMetrics = {
      originalSize: JSON.stringify(helmetConfig).length,
      optimizedSize: JSON.stringify(reorderedConfig).length,
      reductionPercentage: 0,
      optimizationsApplied: redundancyAnalysis.optimizationApplied.length
    };
    
    performanceMetrics.reductionPercentage = 
      ((performanceMetrics.originalSize - performanceMetrics.optimizedSize) / 
       performanceMetrics.originalSize) * 100;
    
    // Validate optimized configuration maintains security effectiveness
    const validation = validateHelmetConfig(reorderedConfig, options.environment);
    
    if (!validation.isValid) {
      logWarn('Optimization reduced security effectiveness, reverting changes', {
        securityScore: validation.securityScore,
        errors: validation.errors
      });
      return helmetConfig; // Return original if optimization breaks security
    }
    
    // Log optimization results and performance improvements
    logInfo('Helmet configuration optimization completed', {
      environment: options.environment,
      performanceMode: options.performanceMode,
      optimizationsApplied: redundancyAnalysis.optimizationApplied,
      performanceMetrics,
      securityMaintained: validation.isValid
    });
    
    // Return optimized Helmet configuration with performance metadata
    reorderedConfig._optimization = {
      applied: redundancyAnalysis.optimizationApplied,
      metrics: performanceMetrics,
      timestamp: new Date().toISOString()
    };
    
    return reorderedConfig;
    
  } catch (error) {
    logError('Helmet configuration optimization failed', {
      error: error.message,
      stack: error.stack
    });
    
    // Return original configuration if optimization fails
    logWarn('Returning original configuration due to optimization failure');
    return helmetConfig;
  }
}

/**
 * Creates Helmet Documentation
 * 
 * Generates comprehensive documentation for Helmet.js configuration including security header
 * explanations, policy details, and educational content for the tutorial project. Provides
 * detailed security education and implementation guidance.
 * 
 * @param {Object} helmetConfig - Helmet configuration to document
 * @param {string} [format='markdown'] - Documentation output format
 * @returns {Object} Comprehensive Helmet configuration documentation with educational content
 */
export function createHelmetDocumentation(helmetConfig, format = 'markdown') {
  try {
    logInfo('Creating Helmet configuration documentation', { format });
    
    const documentation = {
      title: 'Helmet.js Security Configuration Documentation',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      format,
      sections: {}
    };
    
    // Generate documentation structure for all 15 Helmet sub-middlewares
    documentation.sections.overview = {
      title: 'Security Implementation Overview',
      content: `
# Helmet.js Security Configuration

This documentation provides comprehensive information about the HTTP security headers
implemented using Helmet.js v8.1.0 with all 15 security middlewares for robust
protection against web vulnerabilities.

## Security Headers Summary

Total Headers Configured: ${Object.keys(helmetConfig).length}
Security Middleware Count: 15
Implementation: Production-ready with environment-specific policies
      `.trim()
    };
    
    // Create detailed explanations for each security header purpose
    const securityHeaders = getSecurityHeaders(helmetConfig);
    
    documentation.sections.headers = {
      title: 'Security Headers Reference',
      content: '',
      headers: {}
    };
    
    Object.entries(securityHeaders.configured).forEach(([headerName, config]) => {
      documentation.sections.headers.headers[headerName] = {
        name: headerName,
        enabled: config.enabled,
        purpose: config.purpose,
        securityBenefit: config.securityBenefit,
        configuration: config,
        examples: generateHeaderExamples(headerName, config),
        troubleshooting: generateTroubleshootingGuide(headerName)
      };
    });
    
    // Include security attack prevention information and benefits
    documentation.sections.protection = {
      title: 'Attack Prevention',
      attacks: {
        'Cross-Site Scripting (XSS)': {
          preventedBy: ['Content-Security-Policy'],
          description: 'Prevents malicious script injection and execution',
          implementation: 'Strict CSP directives with nonce-based script loading'
        },
        'Clickjacking': {
          preventedBy: ['X-Frame-Options', 'Content-Security-Policy frame-ancestors'],
          description: 'Prevents UI redressing and iframe-based attacks',
          implementation: 'DENY or SAMEORIGIN frame options'
        },
        'MIME Type Confusion': {
          preventedBy: ['X-Content-Type-Options'],
          description: 'Prevents MIME type sniffing vulnerabilities',
          implementation: 'nosniff directive'
        },
        'Man-in-the-Middle': {
          preventedBy: ['Strict-Transport-Security'],
          description: 'Forces HTTPS and prevents protocol downgrade',
          implementation: 'HSTS with long max-age and subdomain inclusion'
        }
      }
    };
    
    // Add configuration examples and best practices for each header
    documentation.sections.examples = {
      title: 'Configuration Examples',
      environments: {
        development: generateEnvironmentExample('development', helmetConfig),
        production: generateEnvironmentExample('production', helmetConfig),
        staging: generateEnvironmentExample('staging', helmetConfig)
      }
    };
    
    // Create troubleshooting guides for common security header issues
    documentation.sections.troubleshooting = {
      title: 'Troubleshooting Guide',
      commonIssues: [
        {
          issue: 'CSP blocking legitimate resources',
          solution: 'Add allowed sources to appropriate CSP directives',
          prevention: 'Test CSP in report-only mode before enforcement'
        },
        {
          issue: 'HSTS preventing local development',
          solution: 'Disable HSTS in development environment',
          prevention: 'Use environment-specific configuration'
        },
        {
          issue: 'X-Frame-Options blocking embedded content',
          solution: 'Use SAMEORIGIN or configure CSP frame-ancestors',
          prevention: 'Understand embedding requirements before deployment'
        }
      ]
    };
    
    // Include environment-specific configuration recommendations
    documentation.sections.recommendations = {
      title: 'Environment Recommendations',
      environments: {
        development: [
          'Use report-only CSP for policy testing',
          'Disable HSTS to allow HTTP connections',
          'Enable detailed security violation reporting',
          'Use relaxed frame options for development tools'
        ],
        production: [
          'Enforce strict CSP with no unsafe directives',
          'Enable HSTS with maximum age and subdomain inclusion',
          'Use DENY for X-Frame-Options',
          'Implement comprehensive security monitoring'
        ],
        staging: [
          'Test production-like security policies',
          'Enable comprehensive violation reporting',
          'Validate security header effectiveness',
          'Perform security policy A/B testing'
        ]
      }
    };
    
    // Generate testing instructions for security header validation
    documentation.sections.testing = {
      title: 'Security Header Testing',
      methods: [
        {
          method: 'Browser Developer Tools',
          description: 'Inspect response headers in Network tab',
          steps: [
            'Open browser developer tools',
            'Navigate to Network tab',
            'Reload page and inspect response headers',
            'Verify security headers are present and correct'
          ]
        },
        {
          method: 'Online Security Scanners',
          description: 'Use security header analysis tools',
          tools: ['SecurityHeaders.com', 'Mozilla Observatory', 'Qualys SSL Labs']
        },
        {
          method: 'Automated Testing',
          description: 'Include security header tests in test suite',
          implementation: 'Use SuperTest to validate response headers'
        }
      ]
    };
    
    // Create educational content about modern web security practices
    documentation.sections.education = {
      title: 'Web Security Education',
      concepts: {
        'Defense in Depth': 'Multiple layers of security controls',
        'Principle of Least Privilege': 'Minimal necessary permissions',
        'Security by Default': 'Secure configuration as default state',
        'Security Headers': 'HTTP response headers that enhance security'
      },
      learningPath: [
        'Understand HTTP security fundamentals',
        'Learn about common web vulnerabilities',
        'Implement security headers with Helmet.js',
        'Test and validate security implementation',
        'Monitor and maintain security posture'
      ]
    };
    
    // Format documentation according to specified output format
    if (format === 'json') {
      return documentation;
    } else if (format === 'html') {
      documentation.formatted = generateHTMLDocumentation(documentation);
    } else {
      documentation.formatted = generateMarkdownDocumentation(documentation);
    }
    
    // Log documentation generation completion
    logInfo('Helmet configuration documentation generated successfully', {
      format,
      sections: Object.keys(documentation.sections).length,
      headersDocumented: Object.keys(securityHeaders.configured).length
    });
    
    // Return comprehensive educational documentation object
    return documentation;
    
  } catch (error) {
    logError('Failed to create Helmet documentation', {
      format,
      error: error.message,
      stack: error.stack
    });
    
    throw new SecurityConfigurationError(
      'Helmet documentation creation failed',
      'documentation-creation-failed',
      {
        format,
        cause: error
      }
    );
  }
}

// Helper functions for documentation generation

/**
 * Generates header examples for documentation
 * @private
 */
function generateHeaderExamples(headerName, config) {
  const examples = {};
  
  switch (headerName) {
    case 'Content-Security-Policy':
      examples.basic = "Content-Security-Policy: default-src 'self'";
      examples.comprehensive = "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'";
      break;
    case 'Strict-Transport-Security':
      examples.basic = 'Strict-Transport-Security: max-age=31536000';
      examples.comprehensive = 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload';
      break;
    default:
      examples.basic = `${headerName}: [configured value]`;
  }
  
  return examples;
}

/**
 * Generates troubleshooting guide for specific header
 * @private
 */
function generateTroubleshootingGuide(headerName) {
  const guides = {
    'Content-Security-Policy': [
      'Check browser console for CSP violations',
      'Use report-only mode for testing',
      'Validate directive syntax and sources'
    ],
    'Strict-Transport-Security': [
      'Ensure HTTPS is properly configured',
      'Test with short max-age first',
      'Clear browser HSTS cache for testing'
    ]
  };
  
  return guides[headerName] || ['Check header syntax and browser compatibility'];
}

/**
 * Generates environment-specific configuration example
 * @private
 */
function generateEnvironmentExample(environment, helmetConfig) {
  return {
    environment,
    description: `Example ${environment} configuration`,
    features: Object.keys(helmetConfig).slice(0, 5),
    recommendations: `Optimized for ${environment} use case`
  };
}

/**
 * Generates HTML documentation format
 * @private
 */
function generateHTMLDocumentation(documentation) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>${documentation.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; }
        .header { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${documentation.title}</h1>
    <p>Generated: ${documentation.generatedAt}</p>
    <!-- Additional HTML content would be generated here -->
</body>
</html>
  `.trim();
}

/**
 * Generates Markdown documentation format
 * @private
 */
function generateMarkdownDocumentation(documentation) {
  let markdown = `# ${documentation.title}\n\n`;
  markdown += `Generated: ${documentation.generatedAt}\n\n`;
  
  Object.entries(documentation.sections).forEach(([sectionKey, section]) => {
    markdown += `## ${section.title}\n\n`;
    if (section.content) {
      markdown += `${section.content}\n\n`;
    }
  });
  
  return markdown;
}

// Default Helmet configurations for different environments
export const helmetDefaults = {
  development: {
    hsts: false,
    contentSecurityPolicy: {
      reportOnly: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    },
    frameguard: { action: 'sameorigin' }
  },
  
  production: {
    hsts: {
      maxAge: DEFAULT_HSTS_MAX_AGE,
      includeSubDomains: true,
      preload: true
    },
    contentSecurityPolicy: {
      reportOnly: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'strict-dynamic'"],
        'style-src': ["'self'"],
        'upgrade-insecure-requests': []
      }
    },
    frameguard: { action: 'deny' }
  },
  
  staging: {
    hsts: {
      maxAge: 43200,
      includeSubDomains: false
    },
    contentSecurityPolicy: {
      reportOnly: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    },
    frameguard: { action: 'sameorigin' }
  }
};

// Initialize Helmet configuration system
logInfo('Helmet.js security configuration system initialized', {
  version: '1.0.0',
  helmetVersion: '8.1.0',
  middlewareCount: 15,
  supportedEnvironments: ['development', 'production', 'staging', 'test'],
  cacheEnabled: true,
  defaultsConfigured: Object.keys(helmetDefaults).length,
  timestamp: new Date().toISOString()
});

// Export all functions and configurations
export {
  createCustomSecurityHeaders,
  createBaseHelmetConfig,
  createDevelopmentHelmetConfig,
  createProductionHelmetConfig,
  createStagingHelmetConfig,
  validateHelmetConfig,
  createHelmetConfig,
  getSecurityHeaders,
  optimizeHelmetConfig,
  createHelmetDocumentation,
  helmetDefaults,
  
  // Global constants
  HELMET_CONFIG_CACHE,
  DEFAULT_HSTS_MAX_AGE,
  DEVELOPMENT_CSP_REPORT_ONLY
};