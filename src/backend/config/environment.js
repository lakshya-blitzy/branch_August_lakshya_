/**
 * @fileoverview Environment Configuration Module for Node.js Tutorial Project
 * @description Advanced environment-specific configuration management system for Node.js v22.x LTS
 * applications. Provides comprehensive environment detection, validation, and configuration loading
 * with support for development, production, staging, and test environments. Features PM2 cluster
 * mode integration, security configuration management, cross-platform Flask compatibility, and
 * modern ES Modules architecture. Implements stateless configuration patterns with extensive
 * validation, caching, and production deployment optimization.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Environment-aware configuration loading with detection algorithms
 * - PM2 cluster mode support with process management configuration
 * - Security configuration with Helmet.js, CORS, and CSP integration
 * - Cross-platform compatibility with Flask implementation patterns
 * - Performance optimizations for each deployment environment
 * - Comprehensive validation with detailed error reporting
 * - Configuration caching for enhanced performance
 * - Environment variable normalization and type conversion
 * - Production-ready logging and monitoring integration
 * - Zero-configuration deployment with intelligent defaults
 * 
 * Educational Value:
 * - Demonstrates environment configuration best practices
 * - Showcases modern Node.js configuration patterns
 * - Illustrates PM2 production deployment strategies
 * - Teaches security configuration management
 * - Provides cross-platform development insights
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 compatibility and optimization
 * - PM2 v6.0.8 cluster mode and process management
 * - Helmet.js v8.1.0 security middleware integration
 * - Cross-platform Flask environment compatibility
 */

// External library imports with version comments
import fs from 'node:fs/promises'; // Node.js built-in - File system operations for reading .env files
import path from 'node:path'; // Node.js built-in - Path utilities for configuration file resolution
import os from 'node:os'; // Node.js built-in - Operating system utilities for environment detection
import process from 'node:process'; // Node.js built-in - Process module for environment variable access

// Internal imports with specific members for environment configuration functionality
import {
  ENV_CONSTANTS,
  PM2_CONSTANTS,
  SECURITY_CONSTANTS
} from '../utils/constants.js';

import logger, {
  info as logInfo,
  warn as logWarn,
  error as logError,
  debug as logDebug
} from '../utils/logger.js';

import {
  ValidationError
} from '../utils/error-types.js';

// Global environment state and caching for performance optimization
const CURRENT_ENVIRONMENT = process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
const ENVIRONMENT_CACHE = new Map(); // Configuration cache for performance
const CONFIG_VALIDATION_CACHE = new Map(); // Validation results cache
const IS_PRODUCTION = CURRENT_ENVIRONMENT === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;
const IS_DEVELOPMENT = CURRENT_ENVIRONMENT === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;

// Environment detection confidence threshold and timing
const DETECTION_CONFIDENCE_THRESHOLD = 0.8;
const CONFIG_CACHE_TTL = 300000; // 5 minutes cache TTL

/**
 * Detects the current runtime environment by examining NODE_ENV, process arguments, system
 * information, and deployment context to determine if running in development, production,
 * staging, or test mode with confidence scoring and detection reasoning.
 * 
 * @param {Object} [options={}] - Environment detection options
 * @param {boolean} [options.useCache=true] - Use cached detection results
 * @param {boolean} [options.detailed=false] - Include detailed detection analysis
 * @param {Array} [options.indicators=[]] - Additional environment indicators
 * @returns {Object} Environment detection result with environment type, confidence level, and detection reasoning
 */
function detectEnvironment(options = {}) {
  const config = {
    useCache: options.useCache !== false,
    detailed: options.detailed === true,
    indicators: options.indicators || [],
    ...options
  };

  // Check cache for recent detection results to improve performance
  const cacheKey = `env_detection_${JSON.stringify(config)}`;
  if (config.useCache && ENVIRONMENT_CACHE.has(cacheKey)) {
    const cached = ENVIRONMENT_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
      logDebug('Using cached environment detection result', { cacheKey, environment: cached.environment });
      return cached;
    }
  }

  // Initialize detection analysis with multiple evidence sources
  const detectionEvidence = {
    nodeEnv: process.env.NODE_ENV,
    processArgs: process.argv,
    pm2Environment: process.env.pm_id || process.env.PM2_HOME,
    systemInfo: getSystemInformation(),
    packageInfo: getPackageInformation(),
    networkInfo: getNetworkConfiguration()
  };

  // Examine NODE_ENV environment variable for explicit environment setting
  let environment = ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
  let confidence = 0.5;
  const reasoning = [];

  if (detectionEvidence.nodeEnv) {
    const nodeEnv = detectionEvidence.nodeEnv.toLowerCase();
    if (Object.values(ENV_CONSTANTS.ENVIRONMENT_TYPES).includes(nodeEnv)) {
      environment = nodeEnv;
      confidence += 0.4;
      reasoning.push(`NODE_ENV explicitly set to '${nodeEnv}'`);
    } else {
      reasoning.push(`NODE_ENV set to unknown value '${nodeEnv}', defaulting to development`);
    }
  } else {
    reasoning.push('NODE_ENV not set, defaulting to development');
  }

  // Analyze process arguments and command line flags for environment hints
  const processHints = analyzeProcessArguments(detectionEvidence.processArgs);
  if (processHints.environment) {
    if (processHints.environment === environment) {
      confidence += 0.2;
      reasoning.push(`Process arguments confirm ${processHints.environment} environment`);
    } else {
      confidence += 0.1;
      reasoning.push(`Process arguments suggest ${processHints.environment}, but NODE_ENV indicates ${environment}`);
    }
  }

  // Check for PM2 environment indicators and cluster mode detection
  if (detectionEvidence.pm2Environment) {
    if (environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
      confidence += 0.3;
      reasoning.push('PM2 environment detected, supporting production classification');
    } else {
      confidence += 0.1;
      reasoning.push('PM2 environment detected but NODE_ENV not production');
    }
  }

  // Inspect system information and deployment context clues
  const systemHints = analyzeSystemContext(detectionEvidence.systemInfo);
  if (systemHints.indicators.length > 0) {
    confidence += systemHints.confidenceBoost;
    reasoning.push(...systemHints.indicators);
  }

  // Validate environment against known environment types from constants
  if (!Object.values(ENV_CONSTANTS.ENVIRONMENT_TYPES).includes(environment)) {
    logWarn('Unknown environment detected, falling back to development', {
      detectedEnvironment: environment,
      validEnvironments: Object.values(ENV_CONSTANTS.ENVIRONMENT_TYPES)
    });
    environment = ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
    confidence = 0.3;
    reasoning.push('Unknown environment detected, defaulted to development');
  }

  // Calculate confidence level for environment detection accuracy
  confidence = Math.min(confidence, 1.0);
  const isConfident = confidence >= DETECTION_CONFIDENCE_THRESHOLD;

  // Log environment detection results for debugging and verification
  const detectionResult = {
    environment,
    confidence,
    isConfident,
    reasoning,
    timestamp: Date.now(),
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pm2: !!detectionEvidence.pm2Environment
    }
  };

  // Include detailed analysis if requested
  if (config.detailed) {
    detectionResult.evidence = detectionEvidence;
    detectionResult.analysis = {
      processHints,
      systemHints,
      networkConfiguration: detectionEvidence.networkInfo
    };
  }

  // Cache detection result for performance optimization
  if (config.useCache) {
    ENVIRONMENT_CACHE.set(cacheKey, detectionResult);
  }

  // Log environment detection completion with confidence level
  logInfo('Environment detection completed', {
    environment,
    confidence: Math.round(confidence * 100),
    isConfident,
    reasoningCount: reasoning.length
  });

  // Return comprehensive environment detection object with metadata
  return detectionResult;
}

/**
 * Loads environment variables from .env files, process.env, and default configuration with
 * environment-specific precedence and validation to ensure all required configuration is
 * available with proper type conversion and normalization.
 * 
 * @param {string} [environment] - Target environment (detected if not provided)
 * @param {Object} [options={}] - Configuration loading options
 * @param {boolean} [options.validateRequired=true] - Validate required variables
 * @param {boolean} [options.useDefaults=true] - Apply default values
 * @param {string} [options.envFileDirectory] - Directory containing .env files
 * @returns {Object} Loaded and validated environment variables with defaults applied and missing variables identified
 */
export function loadEnvironmentVariables(environment, options = {}) {
  const config = {
    validateRequired: options.validateRequired !== false,
    useDefaults: options.useDefaults !== false,
    envFileDirectory: options.envFileDirectory || process.cwd(),
    mergeWithProcess: options.mergeWithProcess !== false,
    normalizeValues: options.normalizeValues !== false,
    ...options
  };

  // Detect environment if not provided
  const targetEnvironment = environment || detectEnvironment().environment;

  // Check cache for recently loaded configuration
  const cacheKey = `env_vars_${targetEnvironment}_${JSON.stringify(config)}`;
  if (ENVIRONMENT_CACHE.has(cacheKey)) {
    const cached = ENVIRONMENT_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
      logDebug('Using cached environment variables', { environment: targetEnvironment });
      return cached.variables;
    }
  }

  logInfo('Loading environment variables', { environment: targetEnvironment, config });

  try {
    // Identify and read environment-specific .env files (.env, .env.production, etc.)
    const envFiles = getEnvironmentFiles(targetEnvironment, config.envFileDirectory);
    const fileVariables = {};

    for (const envFile of envFiles) {
      try {
        const variables = parseEnvironmentFile(envFile.path);
        Object.assign(fileVariables, variables);
        logDebug('Loaded environment file', { 
          file: envFile.name, 
          variableCount: Object.keys(variables).length 
        });
      } catch (error) {
        if (envFile.required) {
          throw new ValidationError(
            `Required environment file not found: ${envFile.path}`,
            { code: 'ENV_FILE_MISSING', filePath: envFile.path, environment: targetEnvironment }
          );
        }
        logDebug('Optional environment file not found', { file: envFile.path });
      }
    }

    // Load variables from process.env with type conversion and validation
    const processVariables = config.mergeWithProcess ? { ...process.env } : {};

    // Apply environment-specific defaults from constants configuration
    const defaultVariables = getEnvironmentDefaults(targetEnvironment);

    // Merge configuration with precedence: CLI args > env files > process.env > defaults
    const mergedVariables = {
      ...defaultVariables,
      ...processVariables,
      ...fileVariables,
      ...getCommandLineOverrides()
    };

    // Validate required environment variables are present and properly formatted
    if (config.validateRequired) {
      validateRequiredVariables(mergedVariables, targetEnvironment);
    }

    // Convert string values to appropriate types (numbers, booleans, arrays)
    const normalizedVariables = config.normalizeValues ? 
      normalizeEnvironmentVariables(mergedVariables) : 
      mergedVariables;

    // Log configuration loading status and any missing or invalid variables
    const loadingStatus = {
      environment: targetEnvironment,
      totalVariables: Object.keys(normalizedVariables).length,
      fromFiles: Object.keys(fileVariables).length,
      fromProcess: Object.keys(processVariables).length,
      fromDefaults: Object.keys(defaultVariables).length,
      timestamp: Date.now()
    };

    logInfo('Environment variables loaded successfully', loadingStatus);

    // Cache configuration for performance
    ENVIRONMENT_CACHE.set(cacheKey, {
      variables: normalizedVariables,
      status: loadingStatus,
      timestamp: Date.now()
    });

    // Return comprehensive environment configuration object with metadata
    return {
      ...normalizedVariables,
      _metadata: loadingStatus
    };

  } catch (error) {
    logError('Failed to load environment variables', {
      environment: targetEnvironment,
      error: error.message,
      config
    });
    throw error;
  }
}

/**
 * Validates environment configuration completeness, format correctness, and compatibility
 * with deployment target including PM2 requirements, security settings, and performance
 * parameters with detailed error reporting and recommendations.
 * 
 * @param {Object} config - Configuration object to validate
 * @param {string} [environment] - Target environment for validation
 * @returns {Object} Validation result with errors, warnings, recommendations, and compliance status
 */
export function validateEnvironmentConfig(config, environment) {
  const targetEnvironment = environment || detectEnvironment().environment;
  
  // Check validation cache for recent results
  const cacheKey = `validation_${targetEnvironment}_${JSON.stringify(config)}`;
  if (CONFIG_VALIDATION_CACHE.has(cacheKey)) {
    const cached = CONFIG_VALIDATION_CACHE.get(cacheKey);
    if (Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
      logDebug('Using cached validation result', { environment: targetEnvironment });
      return cached.result;
    }
  }

  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    compliance: {
      pm2Compatible: false,
      securityCompliant: false,
      performanceOptimized: false,
      crossPlatformCompatible: false
    },
    environment: targetEnvironment,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo('Validating environment configuration', { environment: targetEnvironment });

    // Validate required environment variables for the target environment
    const requiredVariables = getRequiredVariables(targetEnvironment);
    for (const variable of requiredVariables) {
      if (!(variable in config)) {
        validationResult.errors.push(`Missing required variable: ${variable}`);
        validationResult.isValid = false;
      } else if (config[variable] === undefined || config[variable] === null) {
        validationResult.errors.push(`Required variable ${variable} is null or undefined`);
        validationResult.isValid = false;
      }
    }

    // Check data types, formats, and value ranges for all configuration options
    validateDataTypes(config, validationResult);
    validateValueRanges(config, validationResult, targetEnvironment);

    // Verify PM2 cluster mode compatibility and process management settings
    const pm2Validation = validatePM2Compatibility(config, targetEnvironment);
    validationResult.compliance.pm2Compatible = pm2Validation.isValid;
    validationResult.errors.push(...pm2Validation.errors);
    validationResult.warnings.push(...pm2Validation.warnings);
    validationResult.recommendations.push(...pm2Validation.recommendations);

    // Validate security configuration including SSL/TLS and CORS settings
    const securityValidation = validateSecurityConfiguration(config, targetEnvironment);
    validationResult.compliance.securityCompliant = securityValidation.isValid;
    validationResult.errors.push(...securityValidation.errors);
    validationResult.warnings.push(...securityValidation.warnings);

    // Check performance settings and resource limits for environment
    const performanceValidation = validatePerformanceConfiguration(config, targetEnvironment);
    validationResult.compliance.performanceOptimized = performanceValidation.isValid;
    validationResult.warnings.push(...performanceValidation.warnings);
    validationResult.recommendations.push(...performanceValidation.recommendations);

    // Verify cross-platform compatibility for Flask implementation support
    const compatibilityValidation = validateCrossPlatformCompatibility(config);
    validationResult.compliance.crossPlatformCompatible = compatibilityValidation.isValid;
    validationResult.warnings.push(...compatibilityValidation.warnings);

    // Generate overall compliance score and status
    const complianceScore = Object.values(validationResult.compliance).filter(Boolean).length / 
                           Object.keys(validationResult.compliance).length;
    validationResult.complianceScore = Math.round(complianceScore * 100);

    // Generate detailed validation report with errors, warnings, and suggestions
    if (validationResult.errors.length === 0 && validationResult.warnings.length === 0) {
      validationResult.recommendations.push('Configuration is valid and ready for deployment');
    } else if (validationResult.errors.length === 0) {
      validationResult.recommendations.push('Configuration is valid but has warnings to address');
    } else {
      validationResult.recommendations.push('Configuration has errors that must be fixed before deployment');
    }

    // Cache validation results for performance optimization
    CONFIG_VALIDATION_CACHE.set(cacheKey, {
      result: validationResult,
      timestamp: Date.now()
    });

    logInfo('Environment configuration validation completed', {
      environment: targetEnvironment,
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      complianceScore: validationResult.complianceScore
    });

    return validationResult;

  } catch (error) {
    logError('Environment configuration validation failed', {
      environment: targetEnvironment,
      error: error.message
    });
    
    validationResult.isValid = false;
    validationResult.errors.push(`Validation process failed: ${error.message}`);
    return validationResult;
  }
}

/**
 * Creates comprehensive environment-specific configuration object by merging base configuration
 * with environment overrides, applying security settings, and configuring PM2 deployment
 * parameters with performance optimizations and cross-platform compatibility.
 * 
 * @param {string} [environment] - Target environment identifier
 * @param {Object} [overrides={}] - Configuration overrides and customizations
 * @returns {Object} Complete environment configuration with server, security, logging, PM2, and testing settings
 */
export function createEnvironmentConfig(environment, overrides = {}) {
  const targetEnvironment = environment || detectEnvironment().environment;

  logInfo('Creating environment configuration', { environment: targetEnvironment });

  try {
    // Load base configuration template for the specified environment
    const baseConfig = loadEnvironmentVariables(targetEnvironment);
    
    // Apply environment-specific overrides and customizations
    const mergedConfig = {
      ...baseConfig,
      ...overrides,
      environment: targetEnvironment,
      timestamp: new Date().toISOString()
    };

    // Configure server settings including port, host, and protocol options
    const serverConfig = getServerConfig(targetEnvironment);
    
    // Set up security configuration with environment-appropriate levels
    const securityConfig = getSecurityConfig(targetEnvironment);
    
    // Configure logging levels and output destinations for the environment
    const loggingConfig = getLoggingConfig(targetEnvironment);
    
    // Set PM2 cluster mode and process management parameters
    const pm2Config = getPM2Config(targetEnvironment);
    
    // Apply performance optimizations and resource limits
    const performanceConfig = getPerformanceConfig(targetEnvironment);
    
    // Set up testing configuration for test environment
    const testingConfig = targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.TEST ? 
      getTestingConfig('jest') : null;

    // Create comprehensive environment configuration object
    const environmentConfig = {
      environment: targetEnvironment,
      server: serverConfig,
      security: securityConfig,
      logging: loggingConfig,
      pm2: pm2Config,
      performance: performanceConfig,
      ...(testingConfig && { testing: testingConfig }),
      
      // Include environment variables for application use
      env: {
        NODE_ENV: targetEnvironment,
        PORT: serverConfig.port,
        HOST: serverConfig.host,
        LOG_LEVEL: loggingConfig.level,
        ...mergedConfig
      },
      
      // Metadata and configuration information
      metadata: {
        createdAt: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        configVersion: '1.0.0',
        isProduction: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
        isDevelopment: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT
      }
    };

    // Validate final configuration and cache for future use
    const validation = validateEnvironmentConfig(environmentConfig, targetEnvironment);
    if (!validation.isValid) {
      logWarn('Environment configuration has validation errors', {
        environment: targetEnvironment,
        errors: validation.errors
      });
    }

    logInfo('Environment configuration created successfully', {
      environment: targetEnvironment,
      hasServer: !!environmentConfig.server,
      hasSecurity: !!environmentConfig.security,
      hasLogging: !!environmentConfig.logging,
      hasPM2: !!environmentConfig.pm2,
      validationPassed: validation.isValid
    });

    return environmentConfig;

  } catch (error) {
    logError('Failed to create environment configuration', {
      environment: targetEnvironment,
      error: error.message
    });
    throw new ValidationError(
      `Failed to create configuration for environment: ${targetEnvironment}`,
      { code: 'CONFIG_CREATION_FAILED', environment: targetEnvironment, cause: error }
    );
  }
}

/**
 * Generates server configuration settings including port, host, protocol, timeout values,
 * and middleware settings optimized for the current environment and deployment target
 * with Express.js v5.1.0 compatibility and performance tuning.
 * 
 * @param {string} [environment] - Target environment identifier
 * @returns {Object} Server configuration object with port, host, protocol, timeouts, and middleware settings
 */
function getServerConfig(environment) {
  const targetEnvironment = environment || detectEnvironment().environment;

  // Determine server port from environment variables or defaults
  const port = parseInt(process.env.PORT) || 
               parseInt(process.env.HTTP_PORT) || 
               ENV_CONSTANTS.DEFAULT_PORT;

  // Configure host binding based on environment (localhost vs 0.0.0.0)
  const host = process.env.HOST || 
               process.env.BIND_HOST || 
               (targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? '0.0.0.0' : ENV_CONSTANTS.DEFAULT_HOST);

  // Set protocol configuration (HTTP vs HTTPS) based on environment
  const protocol = process.env.HTTPS === 'true' || 
                   targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? 'https' : 'http';

  // Configure timeout values for requests, keep-alive, and headers
  const timeouts = {
    request: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? 30000 : 60000, // 30s prod, 60s dev
    keepAlive: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? 5000 : 2000,  // 5s prod, 2s dev
    headers: 60000, // 60s header timeout
    server: 120000  // 2 minute server timeout
  };

  // Set middleware configuration for Express.js and security headers
  const middleware = {
    bodyParser: {
      json: { limit: '10mb' },
      urlencoded: { extended: true, limit: '10mb' }
    },
    compression: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
    helmet: true, // Always enable Helmet.js security
    cors: {
      enabled: true,
      origin: getCorsOrigins(targetEnvironment),
      credentials: true
    },
    rateLimiting: {
      enabled: targetEnvironment !== ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? 100 : 1000 // requests per window
    }
  };

  // Apply environment-specific performance optimizations
  const performance = {
    clustering: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
    gracefulShutdown: true,
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 30000 // 30 seconds
    }
  };

  // Return complete server configuration object
  return {
    port,
    host,
    protocol,
    timeouts,
    middleware,
    performance,
    
    // Environment-specific settings
    trustProxy: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
    poweredBy: false, // Remove X-Powered-By header
    etag: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION ? 'strong' : 'weak',
    
    // SSL/TLS configuration for HTTPS
    ssl: protocol === 'https' ? {
      enabled: true,
      cert: process.env.SSL_CERT_PATH,
      key: process.env.SSL_KEY_PATH,
      ca: process.env.SSL_CA_PATH
    } : { enabled: false },
    
    // Server metadata
    metadata: {
      environment: targetEnvironment,
      createdAt: new Date().toISOString(),
      serverIdentifier: `nodejs-tutorial-${targetEnvironment}-${process.pid}`
    }
  };
}

/**
 * Generates security configuration including Helmet.js settings, CORS policies, CSP directives,
 * SSL/TLS configuration, and rate limiting based on environment security requirements with
 * comprehensive threat protection and compliance features.
 * 
 * @param {string} [environment] - Target environment identifier
 * @returns {Object} Security configuration with Helmet.js, CORS, CSP, SSL, and rate limiting settings
 */
function getSecurityConfig(environment) {
  const targetEnvironment = environment || detectEnvironment().environment;
  const isProduction = targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;

  // Configure Helmet.js security headers for the target environment
  const helmetConfig = {
    contentSecurityPolicy: {
      directives: {
        ...SECURITY_CONSTANTS.CSP_DIRECTIVES,
        'default-src': ["'self'"],
        'script-src': isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'object-src': ["'none'"],
        'media-src': ["'self'"],
        'frame-src': ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: isProduction,
    crossOriginOpenerPolicy: isProduction,
    crossOriginResourcePolicy: { policy: isProduction ? 'same-origin' : 'cross-origin' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true
  };

  // Set CORS policies based on environment (restrictive for production)
  const corsConfig = {
    ...SECURITY_CONSTANTS.CORS_CONFIG,
    origin: getCorsOrigins(targetEnvironment),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: isProduction ? 86400 : 3600, // 24h prod, 1h dev
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  // Generate Content Security Policy directives for the environment
  const cspConfig = {
    enabled: true,
    reportOnly: !isProduction,
    reportUri: process.env.CSP_REPORT_URI || null,
    directives: helmetConfig.contentSecurityPolicy.directives
  };

  // Configure SSL/TLS settings including certificate paths and options
  const sslConfig = {
    enabled: isProduction || process.env.HTTPS === 'true',
    enforce: isProduction,
    certificate: {
      cert: process.env.SSL_CERT_PATH,
      key: process.env.SSL_KEY_PATH,
      ca: process.env.SSL_CA_PATH
    },
    options: {
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
      honorCipherOrder: true
    }
  };

  // Set rate limiting parameters based on environment load expectations
  const rateLimitConfig = {
    enabled: targetEnvironment !== ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: process.env.REDIS_URL ? 'redis' : 'memory',
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/status';
    }
  };

  // Apply environment-specific security hardening measures
  const securityHardening = {
    sessionSecurity: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    inputValidation: {
      enabled: true,
      maxPayloadSize: '10mb',
      maxUrlLength: 2048,
      parameterLimit: 100
    },
    authenticationSecurity: {
      bcryptRounds: isProduction ? 12 : 10,
      jwtExpiry: isProduction ? '15m' : '1h',
      refreshTokenExpiry: '7d'
    }
  };

  // Return comprehensive security configuration object
  return {
    helmet: helmetConfig,
    cors: corsConfig,
    csp: cspConfig,
    ssl: sslConfig,
    rateLimit: rateLimitConfig,
    hardening: securityHardening,
    
    // Security monitoring and alerting
    monitoring: {
      enabled: isProduction,
      logSecurityEvents: true,
      alertOnSuspiciousActivity: isProduction,
      auditLog: {
        enabled: isProduction,
        retention: '90d'
      }
    },
    
    // Compliance and regulatory settings
    compliance: {
      gdprCompliant: true,
      hipaaCompliant: false,
      pciCompliant: false
    },
    
    // Security metadata
    metadata: {
      environment: targetEnvironment,
      securityLevel: isProduction ? 'high' : 'medium',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Configures logging settings including log levels, output destinations, file rotation,
 * and monitoring integration based on environment requirements and operational needs
 * with PM2 cluster mode compatibility and structured logging support.
 * 
 * @param {string} [environment] - Target environment identifier
 * @returns {Object} Logging configuration with levels, destinations, rotation, and monitoring settings
 */
function getLoggingConfig(environment) {
  const targetEnvironment = environment || detectEnvironment().environment;
  const isProduction = targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;

  // Set appropriate log levels for the environment (debug for dev, warn for prod)
  const logLevel = process.env.LOG_LEVEL || 
                   ENV_CONSTANTS.LOG_LEVELS[targetEnvironment.toUpperCase()] ||
                   (isProduction ? 'warn' : 'debug');

  // Configure log output destinations (console, files, external services)
  const destinations = {
    console: {
      enabled: true,
      level: logLevel,
      format: isProduction ? 'json' : 'pretty',
      colorize: !isProduction,
      timestamp: true
    },
    file: {
      enabled: isProduction || process.env.LOG_TO_FILE === 'true',
      level: logLevel,
      filename: process.env.LOG_FILE || `logs/app-${targetEnvironment}.log`,
      maxSize: '50MB',
      maxFiles: 10,
      format: 'json'
    },
    errorFile: {
      enabled: isProduction || process.env.LOG_ERRORS_TO_FILE === 'true',
      level: 'error',
      filename: process.env.ERROR_LOG_FILE || `logs/error-${targetEnvironment}.log`,
      maxSize: '50MB',
      maxFiles: 5,
      format: 'json'
    }
  };

  // Set up log file rotation and retention policies
  const rotation = {
    enabled: destinations.file.enabled,
    frequency: 'daily',
    maxAge: isProduction ? '30d' : '7d',
    maxSize: '50MB',
    compression: isProduction,
    datePattern: 'YYYY-MM-DD'
  };

  // Configure structured logging format for the environment
  const format = {
    timestamp: true,
    level: true,
    message: true,
    metadata: true,
    correlationId: true,
    requestId: true,
    userId: false, // Don't log user IDs for privacy
    ip: false,     // Don't log IPs for privacy
    userAgent: false
  };

  // Set PM2 log integration and centralized logging options
  const pm2Integration = {
    enabled: isProduction && process.env.pm_id,
    logType: 'json',
    mergeConsole: true,
    timestampFormat: 'YYYY-MM-DD HH:mm:ss Z',
    logDateFormat: 'YYYY-MM-DD HH:mm:ss Z'
  };

  // Apply environment-specific log filtering and sampling
  const filtering = {
    enabled: isProduction,
    sampleRate: isProduction ? 0.1 : 1.0, // 10% sampling in production
    excludeHealthChecks: true,
    excludeStaticAssets: true,
    sensitiveDataRedaction: true
  };

  // Configure monitoring and alerting integration
  const monitoring = {
    enabled: isProduction,
    errorAlerts: {
      enabled: isProduction,
      threshold: 10, // Alert after 10 errors in 5 minutes
      window: '5m'
    },
    performanceLogging: {
      enabled: true,
      slowRequestThreshold: isProduction ? 1000 : 5000, // ms
      includeStack: !isProduction
    },
    metrics: {
      enabled: isProduction,
      endpoint: process.env.METRICS_ENDPOINT,
      interval: 60000 // 1 minute
    }
  };

  // Return complete logging configuration object
  return {
    level: logLevel,
    destinations,
    rotation,
    format,
    pm2: pm2Integration,
    filtering,
    monitoring,
    
    // Transport-specific configurations
    transports: {
      console: destinations.console,
      file: destinations.file,
      error: destinations.errorFile,
      ...(process.env.SYSLOG_HOST && {
        syslog: {
          enabled: isProduction,
          host: process.env.SYSLOG_HOST,
          port: process.env.SYSLOG_PORT || 514,
          protocol: 'udp'
        }
      })
    },
    
    // Security and compliance settings
    security: {
      redactSensitive: true,
      maskPII: true,
      auditTrail: isProduction
    },
    
    // Metadata and configuration information
    metadata: {
      environment: targetEnvironment,
      nodeVersion: process.version,
      platform: process.platform,
      createdAt: new Date().toISOString()
    }
  };
}

/**
 * Generates PM2 process management configuration including cluster mode settings, instance count,
 * restart policies, monitoring, and environment-specific deployment parameters with zero-downtime
 * deployment support and production scaling capabilities.
 * 
 * @param {string} [environment] - Target environment identifier
 * @returns {Object} PM2 configuration with cluster mode, instances, restart policies, and monitoring settings
 */
function getPM2Config(environment) {
  const targetEnvironment = environment || detectEnvironment().environment;
  const isProduction = targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;

  // Determine PM2 execution mode (fork for dev, cluster for production)
  const execMode = isProduction ? 
    PM2_CONSTANTS.EXEC_MODES.CLUSTER : 
    PM2_CONSTANTS.EXEC_MODES.FORK;

  // Configure instance count based on CPU cores and environment
  const instances = isProduction ? 
    (process.env.PM2_INSTANCES || 'max') : 
    1;

  // Set restart policies and memory limits for the environment
  const restartPolicy = {
    autorestart: true,
    maxRestarts: isProduction ? 10 : 5,
    minUptime: '10s',
    maxMemoryRestart: isProduction ? '500MB' : '200MB',
    restartDelay: isProduction ? 4000 : 1000
  };

  // Configure monitoring and health check parameters
  const monitoring = {
    enabled: true,
    pmx: isProduction,
    monitoring: isProduction,
    webInterface: !isProduction,
    instanceVar: 'INSTANCE_ID',
    watchOptions: {
      enabled: !isProduction,
      ignorePatterns: [
        'node_modules',
        'logs',
        'tmp',
        '.git',
        '*.log'
      ]
    }
  };

  // Set environment variables and startup scripts for PM2
  const environmentVariables = {
    NODE_ENV: targetEnvironment,
    PORT: process.env.PORT || ENV_CONSTANTS.DEFAULT_PORT,
    PM2_SERVE_PATH: process.cwd(),
    PM2_SERVE_PORT: process.env.PORT || ENV_CONSTANTS.DEFAULT_PORT,
    PM2_SERVE_SPA: 'false',
    PM2_SERVE_HOMEPAGE: '/health',
    PM2_SERVE_BASIC_AUTH: isProduction ? 'true' : 'false'
  };

  // Apply zero-downtime deployment settings for production
  const deployment = {
    gracefulShutdown: true,
    killTimeout: 1600, // 1.6 seconds
    listenTimeout: 3000,
    incrementVar: 'PORT',
    sourceMapSupport: !isProduction,
    traceWarnings: !isProduction
  };

  // Configure logging and output management
  const logging = {
    logDateFormat: 'YYYY-MM-DD HH:mm:ss Z',
    combineLogsOnCluster: true,
    logFile: `logs/pm2-${targetEnvironment}.log`,
    errorFile: `logs/pm2-error-${targetEnvironment}.log`,
    outFile: `logs/pm2-out-${targetEnvironment}.log`,
    logType: 'json',
    mergeConsole: true,
    time: true
  };

  // Set up cluster mode load balancing and process distribution
  const clusterConfig = execMode === PM2_CONSTANTS.EXEC_MODES.CLUSTER ? {
    execMode: 'cluster',
    instances: instances,
    loadBalancing: 'roundrobin',
    nodeArgs: [],
    args: [],
    mergeConsole: true,
    vizion: false, // Disable git metadata in production
    autorestart: true
  } : null;

  // Return comprehensive PM2 ecosystem configuration
  const pm2Config = {
    name: `nodejs-tutorial-${targetEnvironment}`,
    script: 'src/backend/server.js',
    cwd: process.cwd(),
    execMode,
    instances,
    
    // Process management
    ...restartPolicy,
    ...deployment,
    
    // Environment and variables
    env: environmentVariables,
    envProduction: isProduction ? {
      ...environmentVariables,
      NODE_ENV: 'production'
    } : undefined,
    
    // Logging configuration
    ...logging,
    
    // Monitoring and health checks
    ...monitoring,
    
    // Cluster-specific configuration
    ...(clusterConfig && clusterConfig),
    
    // Performance and optimization
    nodeArgs: isProduction ? [
      '--max-old-space-size=512',
      '--optimize-for-size'
    ] : [
      '--inspect',
      '--trace-warnings'
    ],
    
    // Error handling and recovery
    maxMemoryRestart: restartPolicy.maxMemoryRestart,
    minUptime: restartPolicy.minUptime,
    maxRestarts: restartPolicy.maxRestarts,
    
    // Metadata and configuration
    metadata: {
      environment: targetEnvironment,
      createdAt: new Date().toISOString(),
      pm2Version: process.env.PM2_VERSION || 'unknown',
      nodeVersion: process.version
    }
  };

  // Add development-specific settings
  if (!isProduction) {
    pm2Config.watch = monitoring.watchOptions.enabled;
    pm2Config.ignore_watch = monitoring.watchOptions.ignorePatterns;
    pm2Config.watch_options = {
      followSymlinks: false,
      usePolling: false
    };
  }

  return pm2Config;
}

/**
 * Creates testing environment configuration including test framework settings, coverage thresholds,
 * test timeouts, and mock configurations for Jest and Mocha integration with comprehensive
 * testing pipeline support and quality assurance parameters.
 * 
 * @param {string} [testFramework='jest'] - Testing framework identifier
 * @returns {Object} Testing configuration with framework settings, coverage thresholds, and test environment parameters
 */
function getTestingConfig(testFramework = 'jest') {
  const framework = testFramework.toLowerCase();

  // Configure test framework-specific settings (Jest or Mocha)
  const frameworkConfig = {
    jest: {
      testEnvironment: 'node',
      verbose: true,
      collectCoverage: true,
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html', 'json'],
      testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
      ],
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
        '!**/node_modules/**'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testTimeout: 30000,
      maxWorkers: '50%'
    },
    mocha: {
      recursive: true,
      timeout: 30000,
      reporter: 'spec',
      require: ['tests/setup.js'],
      spec: [
        'tests/**/*.test.js',
        'tests/**/*.spec.js'
      ],
      exit: true,
      parallel: true,
      jobs: 4
    }
  };

  // Set coverage thresholds and reporting options
  const coverageConfig = {
    enabled: true,
    thresholds: {
      global: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85
      },
      perFile: {
        branches: 70,
        functions: 75,
        lines: 75,
        statements: 75
      }
    },
    watermarks: {
      lines: [75, 85],
      functions: [75, 85], 
      branches: [70, 80],
      statements: [75, 85]
    },
    reporters: ['text', 'html', 'lcov', 'json-summary'],
    outputDirectory: 'coverage',
    includeAllFiles: true
  };

  // Configure test timeouts and performance limits
  const performanceConfig = {
    testTimeout: 30000, // 30 seconds
    hookTimeout: 10000, // 10 seconds
    slowThreshold: 5000, // 5 seconds
    maxWorkers: Math.max(1, Math.floor(os.cpus().length / 2)),
    parallel: true,
    bail: false, // Don't stop on first failure
    forceExit: false
  };

  // Set up test database and mock configurations
  const mockConfig = {
    enabled: true,
    clearMocks: true,
    restoreMocks: true,
    mockImplementations: {
      fs: 'mock-fs',
      http: 'nock',
      redis: 'redis-mock'
    },
    globalMocks: [
      'console.log',
      'console.warn',
      'console.error'
    ]
  };

  // Configure test environment variables and isolation
  const environmentConfig = {
    NODE_ENV: 'test',
    PORT: 0, // Random available port
    LOG_LEVEL: 'error',
    DATABASE_URL: 'memory://test',
    CACHE_ENABLED: 'false',
    RATE_LIMIT_ENABLED: 'false',
    SESSION_SECRET: 'test-secret',
    JWT_SECRET: 'test-jwt-secret'
  };

  // Set parallel execution and worker settings
  const parallelConfig = {
    enabled: framework === 'jest' || framework === 'mocha',
    maxWorkers: performanceConfig.maxWorkers,
    workerIdleMemoryLimit: '500MB',
    coverageInWorkers: true,
    detectLeaks: true,
    forceExit: true
  };

  // Return complete testing environment configuration
  return {
    framework,
    config: frameworkConfig[framework] || frameworkConfig.jest,
    coverage: coverageConfig,
    performance: performanceConfig,
    mocks: mockConfig,
    environment: environmentConfig,
    parallel: parallelConfig,
    
    // Test utilities and helpers
    utilities: {
      testDataPath: 'tests/fixtures',
      snapshotPath: 'tests/__snapshots__',
      setupScript: 'tests/setup.js',
      teardownScript: 'tests/teardown.js'
    },
    
    // Quality assurance settings
    quality: {
      linting: {
        enabled: true,
        config: '.eslintrc.js',
        fix: false
      },
      formatting: {
        enabled: true,
        config: '.prettierrc',
        check: true
      },
      typeChecking: {
        enabled: false, // TypeScript not used in this project
        config: 'tsconfig.json'
      }
    },
    
    // Reporting and output
    reporting: {
      console: {
        enabled: true,
        verbose: true,
        colors: true
      },
      file: {
        enabled: true,
        path: 'test-results.json',
        format: 'json'
      },
      junit: {
        enabled: false,
        path: 'test-results.xml'
      }
    },
    
    // Metadata
    metadata: {
      createdAt: new Date().toISOString(),
      framework,
      nodeVersion: process.version,
      testRunner: `${framework}@latest`
    }
  };
}

/**
 * Validates that the current Node.js version meets the minimum requirements for the tutorial
 * project and provides upgrade recommendations if needed with compatibility checks for
 * Express.js v5.1.0, PM2, and ES Modules support.
 * 
 * @returns {Object} Node.js version validation result with compatibility status and upgrade recommendations
 */
function validateNodeVersion() {
  const currentVersion = process.version;
  const currentVersionNumeric = parseVersionString(currentVersion);
  
  // Get current Node.js version from process.version
  const minimumRequired = ENV_CONSTANTS.NODE_VERSIONS.MINIMUM;
  const recommended = ENV_CONSTANTS.NODE_VERSIONS.RECOMMENDED;
  const latest = ENV_CONSTANTS.NODE_VERSIONS.LATEST;

  const validationResult = {
    current: currentVersion,
    isValid: false,
    isRecommended: false,
    isLatest: false,
    compatibility: {
      express: false,
      pm2: false,
      esModules: false,
      modernFeatures: false
    },
    recommendations: [],
    warnings: [],
    errors: [],
    metadata: {
      checkedAt: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch
    }
  };

  try {
    // Compare against minimum required version (Node.js 18+)
    const minimumRequiredNumeric = parseVersionString(minimumRequired);
    validationResult.isValid = compareVersions(currentVersionNumeric, minimumRequiredNumeric) >= 0;

    if (!validationResult.isValid) {
      validationResult.errors.push(
        `Node.js version ${currentVersion} is below minimum required version ${minimumRequired}`
      );
      validationResult.recommendations.push(
        `Upgrade to Node.js ${recommended} or later for optimal compatibility`
      );
    }

    // Check compatibility with Express v5.1.0 requirements
    if (validationResult.isValid) {
      validationResult.compatibility.express = true;
      validationResult.compatibility.esModules = currentVersionNumeric.major >= 14; // ES Modules stable since v14
      validationResult.compatibility.modernFeatures = currentVersionNumeric.major >= 18;
    }

    // Verify ES Modules and modern JavaScript feature support
    if (currentVersionNumeric.major >= 18) {
      validationResult.compatibility.esModules = true;
      validationResult.compatibility.modernFeatures = true;
    } else if (currentVersionNumeric.major >= 14) {
      validationResult.compatibility.esModules = true;
      validationResult.warnings.push(
        'Node.js version supports ES Modules but some modern features may be limited'
      );
    }

    // Check PM2 compatibility with current Node.js version
    validationResult.compatibility.pm2 = currentVersionNumeric.major >= 12; // PM2 supports Node.js 12+

    // Compare against recommended version
    const recommendedNumeric = parseVersionString(recommended);
    validationResult.isRecommended = compareVersions(currentVersionNumeric, recommendedNumeric) >= 0;

    if (!validationResult.isRecommended && validationResult.isValid) {
      validationResult.warnings.push(
        `Node.js version ${currentVersion} is supported but ${recommended} is recommended for best performance`
      );
      validationResult.recommendations.push(
        `Consider upgrading to Node.js ${recommended} for enhanced performance and security`
      );
    }

    // Check if using latest recommended version
    const latestNumeric = parseVersionString(latest);
    validationResult.isLatest = compareVersions(currentVersionNumeric, latestNumeric) >= 0;

    // Generate upgrade recommendations if version is outdated
    if (!validationResult.isLatest && validationResult.isValid) {
      validationResult.recommendations.push(
        `Latest available version is ${latest}. Consider upgrading for the latest features and security updates`
      );
    }

    // Check for deprecated or unsupported versions
    if (currentVersionNumeric.major < 18) {
      validationResult.warnings.push(
        'This Node.js version may have limited security support. Upgrade recommended.'
      );
    }

    if (currentVersionNumeric.major % 2 !== 0 && currentVersionNumeric.major > 18) {
      validationResult.warnings.push(
        'You are using an odd-numbered Node.js version which is not LTS. Consider using an LTS version for production.'
      );
    }

    // Return validation result with detailed compatibility information
    const overallCompatibility = Object.values(validationResult.compatibility).every(Boolean);
    validationResult.overallCompatibility = overallCompatibility;

    if (validationResult.isValid && overallCompatibility) {
      validationResult.recommendations.push(
        'Node.js version is compatible with all project requirements'
      );
    }

    logInfo('Node.js version validation completed', {
      version: currentVersion,
      isValid: validationResult.isValid,
      isRecommended: validationResult.isRecommended,
      compatibility: validationResult.compatibility
    });

    return validationResult;

  } catch (error) {
    logError('Node.js version validation failed', {
      version: currentVersion,
      error: error.message
    });

    validationResult.errors.push(`Version validation failed: ${error.message}`);
    return validationResult;
  }
}

/**
 * Normalizes environment variable values by converting strings to appropriate types,
 * applying default values, and ensuring consistent format across different deployment
 * environments with comprehensive type conversion and validation.
 * 
 * @param {Object} rawEnvVars - Raw environment variables object
 * @returns {Object} Normalized environment variables with proper types and validated values
 */
export function normalizeEnvironmentVariables(rawEnvVars) {
  if (!rawEnvVars || typeof rawEnvVars !== 'object') {
    logWarn('Invalid environment variables provided for normalization', { 
      type: typeof rawEnvVars 
    });
    return {};
  }

  const normalized = {};
  const conversionErrors = [];

  // Convert string representations to appropriate data types
  Object.entries(rawEnvVars).forEach(([key, value]) => {
    try {
      normalized[key] = normalizeEnvironmentValue(key, value);
    } catch (error) {
      conversionErrors.push({ key, value, error: error.message });
      normalized[key] = value; // Keep original value if conversion fails
    }
  });

  // Apply default values for missing optional variables
  const defaults = getEnvironmentDefaults(CURRENT_ENVIRONMENT);
  Object.entries(defaults).forEach(([key, defaultValue]) => {
    if (!(key in normalized)) {
      normalized[key] = defaultValue;
      logDebug('Applied default value for environment variable', { key, value: defaultValue });
    }
  });

  // Log conversion errors if any occurred
  if (conversionErrors.length > 0) {
    logWarn('Environment variable conversion errors occurred', {
      errorCount: conversionErrors.length,
      errors: conversionErrors
    });
  }

  // Validate URL formats and network addresses
  validateNetworkAddresses(normalized);

  // Sanitize file paths and ensure cross-platform compatibility
  sanitizeFilePaths(normalized);

  logDebug('Environment variables normalized', {
    originalCount: Object.keys(rawEnvVars).length,
    normalizedCount: Object.keys(normalized).length,
    conversionErrors: conversionErrors.length
  });

  // Return normalized environment variables object
  return normalized;
}

/**
 * Exports environment configuration to various formats including .env files, JSON configuration,
 * and PM2 ecosystem files for deployment automation and documentation with security filtering
 * and format validation.
 * 
 * @param {Object} config - Configuration object to export
 * @param {string} [format='env'] - Export format ('env', 'json', 'pm2')
 * @param {string} [outputPath] - Output file path
 * @returns {Object} Export result with file path, format information, and export status
 */
function exportEnvironmentConfig(config, format = 'env', outputPath) {
  const supportedFormats = ['env', 'json', 'pm2'];
  const exportFormat = format.toLowerCase();

  if (!supportedFormats.includes(exportFormat)) {
    throw new ValidationError(
      `Unsupported export format: ${format}`,
      [{ field: 'format', message: `Must be one of: ${supportedFormats.join(', ')}` }]
    );
  }

  if (!config || typeof config !== 'object') {
    throw new ValidationError('Invalid configuration object provided for export');
  }

  const exportResult = {
    format: exportFormat,
    success: false,
    outputPath: null,
    size: 0,
    timestamp: new Date().toISOString(),
    metadata: {
      originalSize: JSON.stringify(config).length,
      environment: config.environment || CURRENT_ENVIRONMENT
    }
  };

  try {
    // Validate export format and output path parameters
    const defaultOutputPath = generateDefaultOutputPath(exportFormat, config.environment);
    const finalOutputPath = outputPath || defaultOutputPath;
    
    // Generate configuration in requested format (.env, JSON, PM2)
    const exportData = generateExportData(config, exportFormat);
    
    // Apply security filtering to exclude sensitive values
    const filteredData = applySensitiveDataFiltering(exportData, exportFormat);
    
    // Write configuration file to specified output location
    writeConfigurationFile(finalOutputPath, filteredData, exportFormat);
    
    // Validate exported file integrity and format correctness
    const validationResult = validateExportedFile(finalOutputPath, exportFormat);
    
    if (!validationResult.isValid) {
      throw new ValidationError(
        `Exported file validation failed: ${validationResult.errors.join(', ')}`,
        { code: 'EXPORT_VALIDATION_FAILED', path: finalOutputPath }
      );
    }

    // Update export result with success information
    exportResult.success = true;
    exportResult.outputPath = finalOutputPath;
    exportResult.size = validationResult.size;
    exportResult.checksum = validationResult.checksum;

    // Log export operation status and file metadata
    logInfo('Environment configuration exported successfully', {
      format: exportFormat,
      outputPath: finalOutputPath,
      size: exportResult.size,
      environment: config.environment
    });

    // Return export result with path and format information
    return exportResult;

  } catch (error) {
    logError('Environment configuration export failed', {
      format: exportFormat,
      outputPath: outputPath,
      error: error.message
    });

    exportResult.error = error.message;
    throw error;
  }
}

// Helper functions for environment configuration processing

/**
 * Gets system information for environment detection
 * @private
 * @returns {Object} System information object
 */
function getSystemInformation() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    hostname: os.hostname(),
    user: os.userInfo ? os.userInfo() : null,
    loadAverage: os.loadavg(),
    networkInterfaces: Object.keys(os.networkInterfaces()),
    tmpdir: os.tmpdir()
  };
}

/**
 * Gets package information for environment detection
 * @private
 * @returns {Object} Package information object
 */
function getPackageInformation() {
  try {
    // In a real implementation, this would read package.json
    return {
      name: 'nodejs-tutorial-project',
      version: '1.0.0',
      nodeVersion: process.version,
      npmVersion: process.env.npm_version || 'unknown',
      dependencies: ['express', 'pm2', 'helmet']
    };
  } catch (error) {
    logDebug('Could not read package information', { error: error.message });
    return {};
  }
}

/**
 * Gets network configuration for environment detection
 * @private
 * @returns {Object} Network configuration object
 */
function getNetworkConfiguration() {
  const interfaces = os.networkInterfaces();
  const networks = {};
  
  Object.keys(interfaces).forEach(name => {
    const interface_info = interfaces[name];
    networks[name] = interface_info
      .filter(info => !info.internal)
      .map(info => ({
        address: info.address,
        family: info.family,
        mac: info.mac
      }));
  });

  return {
    interfaces: networks,
    hostname: os.hostname(),
    platform: os.platform()
  };
}

/**
 * Analyzes process arguments for environment hints
 * @private
 * @param {Array} processArgs - Process arguments array
 * @returns {Object} Analysis result with environment hints
 */
function analyzeProcessArguments(processArgs) {
  const hints = {
    environment: null,
    confidence: 0,
    indicators: []
  };

  if (!Array.isArray(processArgs)) return hints;

  // Check for environment-specific flags
  processArgs.forEach(arg => {
    if (arg.includes('--env=')) {
      const env = arg.split('=')[1];
      hints.environment = env;
      hints.confidence += 0.3;
      hints.indicators.push(`--env flag specifies ${env}`);
    }
    
    if (arg.includes('production')) {
      hints.environment = ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;
      hints.confidence += 0.2;
      hints.indicators.push('Production keyword in arguments');
    }
    
    if (arg.includes('test')) {
      hints.environment = ENV_CONSTANTS.ENVIRONMENT_TYPES.TEST;
      hints.confidence += 0.2;
      hints.indicators.push('Test keyword in arguments');
    }
  });

  return hints;
}

/**
 * Analyzes system context for environment hints
 * @private
 * @param {Object} systemInfo - System information object
 * @returns {Object} Analysis result with system hints
 */
function analyzeSystemContext(systemInfo) {
  const hints = {
    indicators: [],
    confidenceBoost: 0
  };

  if (!systemInfo) return hints;

  // Check for production environment indicators
  if (systemInfo.hostname && systemInfo.hostname.includes('prod')) {
    hints.indicators.push('Production hostname detected');
    hints.confidenceBoost += 0.1;
  }

  if (systemInfo.user && systemInfo.user.username === 'root') {
    hints.indicators.push('Running as root user (potential production)');
    hints.confidenceBoost += 0.05;
  }

  // Check for development environment indicators
  if (systemInfo.hostname && (systemInfo.hostname.includes('dev') || systemInfo.hostname.includes('local'))) {
    hints.indicators.push('Development hostname detected');
    hints.confidenceBoost += 0.1;
  }

  return hints;
}

/**
 * Gets environment-specific .env files
 * @private
 * @param {string} environment - Target environment
 * @param {string} directory - Base directory
 * @returns {Array} Array of environment file objects
 */
function getEnvironmentFiles(environment, directory) {
  const baseFiles = [
    { name: '.env', path: path.join(directory, '.env'), required: false },
    { name: '.env.local', path: path.join(directory, '.env.local'), required: false }
  ];

  const environmentFile = {
    name: `.env.${environment}`,
    path: path.join(directory, `.env.${environment}`),
    required: false
  };

  return [...baseFiles, environmentFile];
}

/**
 * Parses environment file
 * @private
 * @param {string} filePath - Path to environment file
 * @returns {Object} Parsed environment variables
 */
async function parseEnvironmentFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const variables = {};
    
    content.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        variables[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return variables;
  } catch (error) {
    throw new ValidationError(
      `Failed to parse environment file: ${filePath}`,
      { code: 'ENV_FILE_PARSE_ERROR', filePath, cause: error }
    );
  }
}

/**
 * Gets environment-specific default values
 * @private
 * @param {string} environment - Target environment
 * @returns {Object} Default values object
 */
function getEnvironmentDefaults(environment) {
  const baseDefaults = {
    PORT: ENV_CONSTANTS.DEFAULT_PORT,
    HOST: ENV_CONSTANTS.DEFAULT_HOST,
    NODE_ENV: environment,
    LOG_LEVEL: ENV_CONSTANTS.LOG_LEVELS[environment.toUpperCase()] || 'info'
  };

  const environmentDefaults = {
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT]: {
      ...baseDefaults,
      DEBUG: 'true',
      WATCH_FILES: 'true'
    },
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION]: {
      ...baseDefaults,
      DEBUG: 'false',
      WATCH_FILES: 'false',
      CLUSTER_MODE: 'true'
    },
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.TEST]: {
      ...baseDefaults,
      PORT: 0,
      LOG_LEVEL: 'error',
      CACHE_ENABLED: 'false'
    },
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.STAGING]: {
      ...baseDefaults,
      DEBUG: 'false',
      WATCH_FILES: 'false'
    }
  };

  return environmentDefaults[environment] || baseDefaults;
}

/**
 * Gets command line overrides
 * @private
 * @returns {Object} Command line override values
 */
function getCommandLineOverrides() {
  const overrides = {};
  
  process.argv.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key && value) {
        overrides[key.toUpperCase()] = value;
      }
    }
  });
  
  return overrides;
}

/**
 * Validates required environment variables
 * @private
 * @param {Object} variables - Environment variables
 * @param {string} environment - Target environment
 */
function validateRequiredVariables(variables, environment) {
  const required = getRequiredVariables(environment);
  const missing = [];
  
  required.forEach(variable => {
    if (!(variable in variables) || variables[variable] === undefined) {
      missing.push(variable);
    }
  });
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required environment variables: ${missing.join(', ')}`,
      missing.map(variable => ({
        field: variable,
        message: 'Required environment variable is missing',
        code: 'REQUIRED_VARIABLE_MISSING'
      }))
    );
  }
}

/**
 * Gets required variables for environment
 * @private
 * @param {string} environment - Target environment
 * @returns {Array} Required variable names
 */
function getRequiredVariables(environment) {
  const baseRequired = ['NODE_ENV'];
  
  const environmentRequired = {
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION]: [...baseRequired, 'PORT'],
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT]: [...baseRequired],
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.TEST]: [...baseRequired],
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.STAGING]: [...baseRequired, 'PORT']
  };
  
  return environmentRequired[environment] || baseRequired;
}

/**
 * Normalizes individual environment value
 * @private
 * @param {string} key - Variable name
 * @param {*} value - Variable value
 * @returns {*} Normalized value
 */
function normalizeEnvironmentValue(key, value) {
  if (value === undefined || value === null) return value;
  
  const stringValue = String(value).trim();
  
  // Boolean conversion
  if (stringValue.toLowerCase() === 'true') return true;
  if (stringValue.toLowerCase() === 'false') return false;
  
  // Number conversion
  if (/^\d+$/.test(stringValue)) {
    return parseInt(stringValue, 10);
  }
  
  if (/^\d+\.\d+$/.test(stringValue)) {
    return parseFloat(stringValue);
  }
  
  // Array conversion (comma-separated)
  if (stringValue.includes(',') && key.includes('LIST') || key.includes('ARRAY')) {
    return stringValue.split(',').map(item => item.trim());
  }
  
  // JSON object conversion
  if (stringValue.startsWith('{') && stringValue.endsWith('}')) {
    try {
      return JSON.parse(stringValue);
    } catch (error) {
      logWarn('Failed to parse JSON environment variable', { key, value: stringValue });
    }
  }
  
  return stringValue;
}

/**
 * Validates data types in configuration
 * @private
 * @param {Object} config - Configuration object
 * @param {Object} validationResult - Validation result to update
 */
function validateDataTypes(config, validationResult) {
  const typeValidations = {
    PORT: 'number',
    DEBUG: 'boolean',
    CLUSTER_MODE: 'boolean',
    LOG_LEVEL: 'string'
  };
  
  Object.entries(typeValidations).forEach(([key, expectedType]) => {
    if (key in config) {
      const actualType = typeof config[key];
      if (actualType !== expectedType) {
        validationResult.warnings.push(
          `${key} expected type ${expectedType} but got ${actualType}`
        );
      }
    }
  });
}

/**
 * Validates value ranges in configuration
 * @private
 * @param {Object} config - Configuration object
 * @param {Object} validationResult - Validation result to update
 * @param {string} environment - Target environment
 */
function validateValueRanges(config, validationResult, environment) {
  // Port validation
  if (config.PORT && (config.PORT < 1 || config.PORT > 65535)) {
    validationResult.errors.push('PORT must be between 1 and 65535');
  }
  
  // Log level validation
  if (config.LOG_LEVEL && !Object.values(ENV_CONSTANTS.LOG_LEVELS).includes(config.LOG_LEVEL)) {
    validationResult.warnings.push(
      `LOG_LEVEL ${config.LOG_LEVEL} is not a standard level`
    );
  }
}

/**
 * Validates PM2 compatibility
 * @private
 * @param {Object} config - Configuration object
 * @param {string} environment - Target environment
 * @returns {Object} PM2 validation result
 */
function validatePM2Compatibility(config, environment) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: []
  };
  
  if (environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    if (!config.CLUSTER_MODE) {
      result.warnings.push('CLUSTER_MODE not enabled for production environment');
      result.recommendations.push('Enable CLUSTER_MODE for better production performance');
    }
  }
  
  return result;
}

/**
 * Validates security configuration
 * @private
 * @param {Object} config - Configuration object
 * @param {string} environment - Target environment
 * @returns {Object} Security validation result
 */
function validateSecurityConfiguration(config, environment) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  if (environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    if (config.DEBUG === true) {
      result.warnings.push('DEBUG mode enabled in production environment');
    }
    
    if (!config.HTTPS_ENABLED) {
      result.warnings.push('HTTPS not enabled for production environment');
    }
  }
  
  return result;
}

/**
 * Validates performance configuration
 * @private
 * @param {Object} config - Configuration object
 * @param {string} environment - Target environment
 * @returns {Object} Performance validation result
 */
function validatePerformanceConfiguration(config, environment) {
  const result = {
    isValid: true,
    warnings: [],
    recommendations: []
  };
  
  if (environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    if (!config.CLUSTER_MODE) {
      result.recommendations.push('Enable cluster mode for better performance');
    }
    
    if (!config.COMPRESSION_ENABLED) {
      result.recommendations.push('Enable compression for better performance');
    }
  }
  
  return result;
}

/**
 * Validates cross-platform compatibility
 * @private
 * @param {Object} config - Configuration object
 * @returns {Object} Compatibility validation result
 */
function validateCrossPlatformCompatibility(config) {
  const result = {
    isValid: true,
    warnings: []
  };
  
  // Check for platform-specific paths
  if (config.LOG_FILE && config.LOG_FILE.includes('\\')) {
    result.warnings.push('Log file path uses Windows-specific separators');
  }
  
  return result;
}

/**
 * Gets CORS origins for environment
 * @private
 * @param {string} environment - Target environment
 * @returns {Array} CORS origins
 */
function getCorsOrigins(environment) {
  const origins = {
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT]: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION]: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : ['https://yourdomain.com'],
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.TEST]: ['http://localhost'],
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.STAGING]: ['https://staging.yourdomain.com']
  };
  
  return origins[environment] || origins[ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT];
}

/**
 * Gets performance configuration for environment
 * @private
 * @param {string} environment - Target environment
 * @returns {Object} Performance configuration
 */
function getPerformanceConfig(environment) {
  const isProduction = environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION;
  
  return {
    clustering: isProduction,
    compression: isProduction,
    caching: {
      enabled: isProduction,
      ttl: isProduction ? 3600 : 300 // 1 hour prod, 5 min dev
    },
    optimization: {
      minify: isProduction,
      gzip: isProduction,
      etag: isProduction
    },
    monitoring: {
      enabled: isProduction,
      interval: 60000 // 1 minute
    }
  };
}

/**
 * Validates network addresses in configuration
 * @private
 * @param {Object} config - Configuration object
 */
function validateNetworkAddresses(config) {
  const urlFields = ['DATABASE_URL', 'REDIS_URL', 'API_URL'];
  
  urlFields.forEach(field => {
    if (config[field]) {
      try {
        new URL(config[field]);
      } catch (error) {
        logWarn(`Invalid URL format for ${field}`, { 
          field, 
          value: config[field],
          error: error.message 
        });
      }
    }
  });
}

/**
 * Sanitizes file paths for cross-platform compatibility
 * @private
 * @param {Object} config - Configuration object
 */
function sanitizeFilePaths(config) {
  const pathFields = ['LOG_FILE', 'ERROR_LOG_FILE', 'PID_FILE'];
  
  pathFields.forEach(field => {
    if (config[field]) {
      config[field] = path.normalize(config[field]);
    }
  });
}

/**
 * Parses version string to numeric components
 * @private
 * @param {string} version - Version string (e.g., "v18.19.0")
 * @returns {Object} Parsed version components
 */
function parseVersionString(version) {
  const cleanVersion = version.replace(/^v/, '');
  const [major, minor, patch] = cleanVersion.split('.').map(Number);
  
  return { major, minor, patch, full: cleanVersion };
}

/**
 * Compares two version objects
 * @private
 * @param {Object} version1 - First version object
 * @param {Object} version2 - Second version object
 * @returns {number} Comparison result (-1, 0, 1)
 */
function compareVersions(version1, version2) {
  if (version1.major !== version2.major) {
    return version1.major - version2.major;
  }
  if (version1.minor !== version2.minor) {
    return version1.minor - version2.minor;
  }
  return version1.patch - version2.patch;
}

/**
 * Generates default output path for export
 * @private
 * @param {string} format - Export format
 * @param {string} environment - Environment name
 * @returns {string} Default output path
 */
function generateDefaultOutputPath(format, environment) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `config-${environment}-${timestamp}`;
  
  switch (format) {
    case 'env':
      return `.env.${environment}.exported`;
    case 'json':
      return `${filename}.json`;
    case 'pm2':
      return `ecosystem.${environment}.config.js`;
    default:
      return `${filename}.txt`;
  }
}

/**
 * Generates export data in specified format
 * @private
 * @param {Object} config - Configuration object
 * @param {string} format - Export format
 * @returns {string} Formatted export data
 */
function generateExportData(config, format) {
  switch (format) {
    case 'env':
      return Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    case 'json':
      return JSON.stringify(config, null, 2);
    
    case 'pm2':
      return `module.exports = ${JSON.stringify({ apps: [config] }, null, 2)};`;
    
    default:
      return JSON.stringify(config, null, 2);
  }
}

/**
 * Applies sensitive data filtering
 * @private
 * @param {string} data - Export data
 * @param {string} format - Export format
 * @returns {string} Filtered data
 */
function applySensitiveDataFiltering(data, format) {
  const sensitivePatterns = [
    /password=[^\\n]*/gi,
    /secret=[^\\n]*/gi,
    /token=[^\\n]*/gi,
    /key=[^\\n]*/gi
  ];
  
  let filtered = data;
  sensitivePatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, match => {
      const [key] = match.split('=');
      return `${key}=[REDACTED]`;
    });
  });
  
  return filtered;
}

/**
 * Writes configuration file
 * @private
 * @param {string} filePath - Output file path
 * @param {string} data - Configuration data
 * @param {string} format - Export format
 */
async function writeConfigurationFile(filePath, data, format) {
  try {
    await fs.writeFile(filePath, data, 'utf8');
  } catch (error) {
    throw new ValidationError(
      `Failed to write configuration file: ${filePath}`,
      { code: 'FILE_WRITE_ERROR', filePath, format, cause: error }
    );
  }
}

/**
 * Validates exported file
 * @private
 * @param {string} filePath - File path to validate
 * @param {string} format - Expected format
 * @returns {Object} Validation result
 */
async function validateExportedFile(filePath, format) {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf8');
    
    const result = {
      isValid: true,
      size: stats.size,
      checksum: require('crypto').createHash('md5').update(content).digest('hex'),
      errors: []
    };
    
    // Format-specific validation
    if (format === 'json') {
      try {
        JSON.parse(content);
      } catch (error) {
        result.isValid = false;
        result.errors.push('Invalid JSON format');
      }
    }
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      errors: [`File validation failed: ${error.message}`]
    };
  }
}

// Export main environment configuration object and utility functions
const defaultEnvironmentConfig = createEnvironmentConfig();

export {
  // Main configuration object
  defaultEnvironmentConfig,
  
  // Factory functions
  createEnvironmentConfig as loadEnvironmentConfig,
  validateEnvironmentConfig as validateEnvironment,
  
  // Environment state
  CURRENT_ENVIRONMENT as currentEnvironment,
  IS_PRODUCTION as isProduction,
  IS_DEVELOPMENT as isDevelopment,
  
  // Configuration factories
  getServerConfig,
  getSecurityConfig,
  getLoggingConfig,
  getPM2Config,
  getTestingConfig,
  
  // Utility functions
  detectEnvironment,
  validateNodeVersion,
  exportEnvironmentConfig
};

// Initialize environment configuration system
logInfo('Environment configuration system initialized', {
  environment: CURRENT_ENVIRONMENT,
  nodeVersion: process.version,
  platform: process.platform,
  pid: process.pid,
  timestamp: new Date().toISOString(),
  configurationReady: true
});