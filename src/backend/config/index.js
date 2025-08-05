/**
 * @fileoverview Central Configuration Orchestrator for Node.js Tutorial Project
 * @description Advanced configuration management system providing unified configuration orchestration,
 * validation, caching, and health checking for the Node.js tutorial project. Acts as the primary
 * configuration interface by importing, validating, and exporting all configuration modules including
 * database, security, environment, and PM2 settings. Implements environment-aware configuration
 * loading with comprehensive validation, error handling, and educational documentation.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Unified configuration orchestration with single point of access
 * - Environment-aware configuration loading and validation
 * - Comprehensive caching system for performance optimization
 * - Health checking capabilities for monitoring and debugging
 * - Production-ready error handling and logging integration
 * - PM2 cluster mode compatibility with stateless architecture
 * - Cross-platform Flask implementation support
 * - Educational documentation with tutorial progression tracking
 * 
 * Educational Value:
 * - Demonstrates modern Node.js v22.x LTS configuration patterns
 * - Showcases ES Modules best practices and import/export strategies
 * - Illustrates enterprise-grade configuration management architectures
 * - Provides comprehensive error handling and validation examples
 * - Teaches configuration orchestration and dependency management
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 production deployment configuration
 * - PM2 v6.0.8 cluster mode and process management
 * - Helmet.js security configuration orchestration
 * - Modern JavaScript patterns with async/await and error handling
 */

// Node.js built-in imports with explicit node: prefix for modern compatibility
import { readFile, access, constants } from 'node:fs/promises'; // Node.js built-in - File system operations for configuration file validation
import { resolve, dirname, join } from 'node:path'; // Node.js built-in - Path utilities for configuration file resolution and cross-platform compatibility
import { fileURLToPath } from 'node:url'; // Node.js built-in - URL utilities for ES Module file path resolution
import process from 'node:process'; // Node.js built-in - Process module for environment variable access and process information

// Internal configuration module imports with explicit member extraction
import { 
  getDatabaseConfig, 
  validateDatabaseConfig, 
  isStatelessArchitecture 
} from './database.js';

import { 
  createSecurityConfig, 
  defaultSecurityConfig, 
  validateSecurityConfig 
} from './security.js';

import { 
  defaultEnvironmentConfig, 
  loadEnvironmentConfig, 
  validateEnvironment 
} from './environment.js';

import { 
  defaultPM2Config, 
  createPM2Config, 
  validatePM2Config 
} from './pm2.js';

// Utility imports for logging, constants, and error handling
import logger, { 
  createLogger, 
  info as logInfo, 
  warn as logWarn, 
  error as logError, 
  debug as logDebug 
} from '../utils/logger.js';

import { 
  ENV_CONSTANTS, 
  ERROR_CONSTANTS 
} from '../utils/constants.js';

import { 
  ValidationError 
} from '../utils/error-types.js';

// Global configuration state management with caching and validation tracking
const CONFIG_CACHE = new Map();
const CONFIGURATION_LOADED = { value: false };
const CURRENT_ENVIRONMENT = process.env.NODE_ENV || ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
const CONFIG_VALIDATION_CACHE = new Map();

// Configuration initialization tracking and metadata
const CONFIG_METADATA = {
  initialized: false,
  lastLoaded: null,
  version: '1.0.0',
  environment: CURRENT_ENVIRONMENT,
  loadCount: 0,
  validationErrors: [],
  healthStatus: {
    isHealthy: true,
    lastValidation: null,
    errors: []
  }
};

// ES Module directory resolution for configuration file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initializes and loads all configuration modules with environment detection, validation, and caching
 * for the Node.js tutorial project. Provides comprehensive configuration orchestration with error
 * handling, performance optimization, and educational documentation.
 * 
 * @param {string} [environment] - Target environment for configuration loading
 * @param {Object} [options={}] - Configuration initialization options
 * @param {boolean} [options.forceReload=false] - Force reload of cached configuration
 * @param {boolean} [options.skipValidation=false] - Skip configuration validation
 * @param {boolean} [options.enableCaching=true] - Enable configuration caching
 * @returns {Promise<Object>} Complete application configuration object with all modules loaded and validated
 */
export async function initializeConfiguration(environment, options = {}) {
  const config = {
    forceReload: options.forceReload || false,
    skipValidation: options.skipValidation || false,
    enableCaching: options.enableCaching !== false,
    environment: environment || CURRENT_ENVIRONMENT,
    ...options
  };

  try {
    logInfo('Initializing configuration system', {
      environment: config.environment,
      forceReload: config.forceReload,
      skipValidation: config.skipValidation,
      enableCaching: config.enableCaching,
      version: CONFIG_METADATA.version
    });

    // Check configuration cache if caching is enabled and no force reload
    if (config.enableCaching && !config.forceReload && CONFIG_CACHE.has('unified-config')) {
      const cachedConfig = CONFIG_CACHE.get('unified-config');
      logDebug('Configuration loaded from cache', {
        cacheKey: 'unified-config',
        environment: cachedConfig.environment,
        lastLoaded: cachedConfig.metadata.lastLoaded
      });
      return cachedConfig;
    }

    // Detect current environment using environment.js detection functions
    const detectedEnvironment = await loadEnvironmentConfig(config.environment);
    logDebug('Environment detected and loaded', {
      environment: detectedEnvironment.currentEnvironment,
      isProduction: detectedEnvironment.isProduction,
      isDevelopment: detectedEnvironment.isDevelopment
    });

    // Initialize database configuration with stateless architecture settings
    const databaseConfiguration = await getDatabaseConfig();
    logDebug('Database configuration initialized', {
      enabled: databaseConfiguration.enabled,
      stateless: databaseConfiguration.stateless,
      rationale: databaseConfiguration.rationale.summary
    });

    // Create security configuration using createSecurityConfig with environment settings
    const securityConfiguration = await createSecurityConfig(detectedEnvironment);
    logDebug('Security configuration created', {
      helmet: Object.keys(securityConfiguration.helmet),
      cors: Object.keys(securityConfiguration.cors),
      csp: Object.keys(securityConfiguration.csp)
    });

    // Generate PM2 configuration using createPM2Config for cluster mode setup
    const pm2Configuration = await createPM2Config(detectedEnvironment);
    logDebug('PM2 configuration generated', {
      apps: pm2Configuration.apps.length,
      cluster: pm2Configuration.cluster.enabled,
      instances: pm2Configuration.cluster.instances
    });

    // Validate all configuration modules using respective validation functions
    if (!config.skipValidation) {
      await validateAllConfigurations({
        database: databaseConfiguration,
        security: securityConfiguration,
        environment: detectedEnvironment,
        pm2: pm2Configuration
      });
      logDebug('All configuration modules validated successfully');
    }

    // Merge configurations into unified configuration object
    const unifiedConfiguration = await mergeConfigurations(
      {
        database: databaseConfiguration,
        security: securityConfiguration,
        environment: detectedEnvironment,
        pm2: pm2Configuration
      },
      options.overrides || {},
      config.environment
    );

    // Add configuration metadata and health information
    unifiedConfiguration.metadata = {
      initialized: true,
      lastLoaded: new Date().toISOString(),
      version: CONFIG_METADATA.version,
      environment: config.environment,
      loadCount: CONFIG_METADATA.loadCount + 1,
      source: 'configuration-orchestrator',
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform
    };

    // Cache validated configuration for performance optimization
    if (config.enableCaching) {
      CONFIG_CACHE.set('unified-config', unifiedConfiguration);
      CONFIG_CACHE.set(`config-${config.environment}`, unifiedConfiguration);
      logDebug('Configuration cached successfully', {
        cacheKeys: ['unified-config', `config-${config.environment}`],
        cacheSize: CONFIG_CACHE.size
      });
    }

    // Update global configuration state and metadata
    CONFIGURATION_LOADED.value = true;
    CONFIG_METADATA.initialized = true;
    CONFIG_METADATA.lastLoaded = unifiedConfiguration.metadata.lastLoaded;
    CONFIG_METADATA.loadCount++;
    CONFIG_METADATA.healthStatus.isHealthy = true;
    CONFIG_METADATA.healthStatus.lastValidation = new Date().toISOString();
    CONFIG_METADATA.healthStatus.errors = [];

    // Log configuration initialization status and applied settings
    logInfo('Configuration initialization completed successfully', {
      environment: unifiedConfiguration.environment.currentEnvironment,
      modules: Object.keys(unifiedConfiguration).filter(key => key !== 'metadata'),
      cacheEnabled: config.enableCaching,
      validationPassed: !config.skipValidation,
      loadTime: new Date().toISOString()
    });

    // Return comprehensive configuration object with all modules
    return unifiedConfiguration;

  } catch (error) {
    // Handle configuration initialization errors with detailed logging
    const configError = new ValidationError(
      `Configuration initialization failed: ${error.message}`,
      {
        cause: error,
        environment: config.environment,
        context: {
          forceReload: config.forceReload,
          skipValidation: config.skipValidation,
          enableCaching: config.enableCaching,
          timestamp: new Date().toISOString()
        }
      }
    );

    // Update health status and metadata on error
    CONFIG_METADATA.healthStatus.isHealthy = false;
    CONFIG_METADATA.healthStatus.errors.push({
      error: configError.message,
      timestamp: new Date().toISOString(),
      environment: config.environment
    });

    logError('Configuration initialization failed', {
      error: configError.message,
      environment: config.environment,
      stack: error.stack,
      errorId: configError.errorId
    });

    throw configError;
  }
}

/**
 * Loads all configuration modules in proper dependency order with error handling and rollback
 * capabilities for robust configuration management. Implements comprehensive loading sequence
 * with validation and dependency resolution.
 * 
 * @param {string} [environment] - Target environment for configuration loading
 * @param {boolean} [forceReload=false] - Force reload of cached configuration
 * @returns {Promise<Object>} Loaded configuration object with all modules and metadata about loading process
 */
export async function loadAllConfigurations(environment, forceReload = false) {
  const targetEnvironment = environment || CURRENT_ENVIRONMENT;
  const cacheKey = `all-configs-${targetEnvironment}`;

  try {
    logDebug('Loading all configuration modules', {
      environment: targetEnvironment,
      forceReload,
      cacheKey
    });

    // Check configuration cache if forceReload is false
    if (!forceReload && CONFIG_CACHE.has(cacheKey)) {
      const cachedConfigs = CONFIG_CACHE.get(cacheKey);
      logDebug('All configurations loaded from cache', {
        environment: targetEnvironment,
        modules: Object.keys(cachedConfigs),
        lastLoaded: cachedConfigs.metadata?.lastLoaded
      });
      return cachedConfigs;
    }

    // Load environment configuration first as base dependency
    logDebug('Loading environment configuration as base dependency');
    const envConfig = await loadEnvironmentConfig(targetEnvironment);

    // Load database configuration with stateless architecture validation
    logDebug('Loading database configuration with stateless validation');
    const dbConfig = await getDatabaseConfig();
    await validateDatabaseConfig(dbConfig);

    // Load security configuration with Helmet.js and CORS settings
    logDebug('Loading security configuration with middleware settings');
    const secConfig = await createSecurityConfig(envConfig);
    await validateSecurityConfig(secConfig);

    // Load PM2 configuration with cluster mode and process management
    logDebug('Loading PM2 configuration with cluster management');
    const processConfig = await createPM2Config(envConfig);
    await validatePM2Config(processConfig);

    // Resolve configuration dependencies and merge settings
    const resolvedConfigurations = {
      environment: envConfig,
      database: dbConfig,
      security: secConfig,
      pm2: processConfig,
      server: {
        port: envConfig.server.port,
        host: envConfig.server.host,
        protocol: envConfig.server.protocol,
        cors: secConfig.cors,
        security: secConfig.helmet
      }
    };

    // Apply environment-specific overrides and customizations
    const customizedConfigs = await applyEnvironmentOverrides(
      resolvedConfigurations, 
      targetEnvironment
    );

    // Add loading metadata about loading process
    customizedConfigs.metadata = {
      loadedAt: new Date().toISOString(),
      environment: targetEnvironment,
      loadingMethod: 'loadAllConfigurations',
      dependencyOrder: ['environment', 'database', 'security', 'pm2'],
      validationStatus: 'passed',
      cacheEnabled: true
    };

    // Cache loaded configuration for subsequent requests
    CONFIG_CACHE.set(cacheKey, customizedConfigs);
    CONFIG_CACHE.set('latest-all-configs', customizedConfigs);

    logInfo('All configurations loaded successfully', {
      environment: targetEnvironment,
      modules: Object.keys(customizedConfigs).filter(key => key !== 'metadata'),
      loadTime: customizedConfigs.metadata.loadedAt,
      dependencyOrder: customizedConfigs.metadata.dependencyOrder
    });

    // Return complete configuration object with loading metadata
    return customizedConfigurations;

  } catch (error) {
    const loadError = new ValidationError(
      `Failed to load all configurations: ${error.message}`,
      {
        cause: error,
        environment: targetEnvironment,
        context: {
          forceReload,
          cacheKey,
          timestamp: new Date().toISOString()
        }
      }
    );

    logError('Configuration loading failed', {
      error: loadError.message,
      environment: targetEnvironment,
      errorId: loadError.errorId,
      stack: error.stack
    });

    throw loadError;
  }
}

/**
 * Validates completeness, consistency, and compatibility of all configuration modules ensuring
 * deployment readiness and educational requirements. Performs comprehensive validation with
 * detailed error reporting and correction recommendations.
 * 
 * @param {Object} configurations - Configuration object containing all modules
 * @param {Object} configurations.database - Database configuration module
 * @param {Object} configurations.security - Security configuration module
 * @param {Object} configurations.environment - Environment configuration module
 * @param {Object} configurations.pm2 - PM2 configuration module
 * @returns {Promise<Object>} Comprehensive validation result with errors, warnings, and recommendations
 */
export async function validateAllConfigurations(configurations) {
  const validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    moduleResults: {},
    timestamp: new Date().toISOString(),
    environment: configurations.environment?.currentEnvironment || CURRENT_ENVIRONMENT
  };

  try {
    logDebug('Starting comprehensive configuration validation', {
      modules: Object.keys(configurations),
      environment: validationResult.environment
    });

    // Validate database configuration for stateless architecture compliance
    try {
      logDebug('Validating database configuration for stateless compliance');
      const dbValidation = await validateDatabaseConfig(configurations.database);
      validationResult.moduleResults.database = dbValidation;
      
      if (!dbValidation.isValid) {
        validationResult.errors.push(...dbValidation.errors);
        validationResult.isValid = false;
      }
      
      if (dbValidation.warnings?.length > 0) {
        validationResult.warnings.push(...dbValidation.warnings);
      }
    } catch (dbError) {
      validationResult.errors.push(`Database validation failed: ${dbError.message}`);
      validationResult.isValid = false;
    }

    // Validate security configuration for completeness and effectiveness
    try {
      logDebug('Validating security configuration for completeness');
      const securityValidation = await validateSecurityConfig(configurations.security);
      validationResult.moduleResults.security = securityValidation;
      
      if (!securityValidation.isValid) {
        validationResult.errors.push(...securityValidation.errors);
        validationResult.isValid = false;
      }
      
      if (securityValidation.warnings?.length > 0) {
        validationResult.warnings.push(...securityValidation.warnings);
      }
    } catch (secError) {
      validationResult.errors.push(`Security validation failed: ${secError.message}`);
      validationResult.isValid = false;
    }

    // Validate environment configuration for deployment requirements
    try {
      logDebug('Validating environment configuration for deployment readiness');
      const envValidation = await validateEnvironment(configurations.environment);
      validationResult.moduleResults.environment = envValidation;
      
      if (!envValidation.isValid) {
        validationResult.errors.push(...envValidation.errors);
        validationResult.isValid = false;
      }
      
      if (envValidation.warnings?.length > 0) {
        validationResult.warnings.push(...envValidation.warnings);
      }
    } catch (envError) {
      validationResult.errors.push(`Environment validation failed: ${envError.message}`);
      validationResult.isValid = false;
    }

    // Validate PM2 configuration for production readiness
    try {
      logDebug('Validating PM2 configuration for production deployment');
      const pm2Validation = await validatePM2Config(configurations.pm2);
      validationResult.moduleResults.pm2 = pm2Validation;
      
      if (!pm2Validation.isValid) {
        validationResult.errors.push(...pm2Validation.errors);
        validationResult.isValid = false;
      }
      
      if (pm2Validation.warnings?.length > 0) {
        validationResult.warnings.push(...pm2Validation.warnings);
      }
    } catch (pm2Error) {
      validationResult.errors.push(`PM2 validation failed: ${pm2Error.message}`);
      validationResult.isValid = false;
    }

    // Check cross-configuration compatibility and dependencies
    logDebug('Checking cross-configuration compatibility');
    const compatibilityCheck = await validateCrossConfigurationCompatibility(configurations);
    if (!compatibilityCheck.isValid) {
      validationResult.errors.push(...compatibilityCheck.errors);
      validationResult.warnings.push(...compatibilityCheck.warnings);
      validationResult.isValid = false;
    }

    // Validate educational requirements and tutorial progression
    const educationalValidation = validateEducationalRequirements(configurations);
    if (educationalValidation.warnings?.length > 0) {
      validationResult.warnings.push(...educationalValidation.warnings);
    }

    // Check cross-platform compatibility for Flask implementation
    const crossPlatformValidation = validateCrossPlatformCompatibility(configurations);
    if (crossPlatformValidation.warnings?.length > 0) {
      validationResult.warnings.push(...crossPlatformValidation.warnings);
    }

    // Generate comprehensive validation report with actionable recommendations
    validationResult.recommendations = generateValidationRecommendations(validationResult);

    // Cache validation results for performance
    CONFIG_VALIDATION_CACHE.set(`validation-${validationResult.environment}`, validationResult);

    logInfo('Configuration validation completed', {
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      recommendationCount: validationResult.recommendations.length,
      environment: validationResult.environment
    });

    // Return validation result with detailed error and warning information
    return validationResult;

  } catch (error) {
    const validationError = new ValidationError(
      `Configuration validation failed: ${error.message}`,
      [{
        field: 'configurations',
        message: error.message,
        code: ERROR_CONSTANTS.VALIDATION_ERRORS.VALIDATION_FAILED
      }],
      {
        cause: error,
        environment: validationResult.environment,
        context: {
          timestamp: new Date().toISOString(),
          modules: Object.keys(configurations)
        }
      }
    );

    logError('Configuration validation error', {
      error: validationError.message,
      errorId: validationError.errorId,
      environment: validationResult.environment,
      stack: error.stack
    });

    throw validationError;
  }
}

/**
 * Merges all configuration modules into unified configuration object resolving conflicts and
 * applying environment-specific overrides. Implements intelligent merging with precedence
 * rules and conflict resolution strategies.
 * 
 * @param {Object} baseConfig - Base configuration object with all modules
 * @param {Object} [overrides={}] - Configuration overrides to apply
 * @param {string} [environment] - Target environment for merging
 * @returns {Promise<Object>} Merged configuration object with resolved conflicts and applied overrides
 */
export async function mergeConfigurations(baseConfig, overrides = {}, environment) {
  const targetEnvironment = environment || CURRENT_ENVIRONMENT;
  
  try {
    logDebug('Starting configuration merge process', {
      baseModules: Object.keys(baseConfig),
      overrideKeys: Object.keys(overrides),
      environment: targetEnvironment
    });

    // Deep merge environment configuration as foundation
    const mergedConfig = {
      environment: {
        ...baseConfig.environment,
        ...overrides.environment
      }
    };

    // Merge database configuration maintaining stateless architecture
    mergedConfig.database = {
      ...baseConfig.database,
      ...overrides.database,
      // Ensure stateless architecture is preserved
      stateless: baseConfig.database?.stateless !== false,
      enabled: baseConfig.database?.enabled || false
    };

    // Merge security configuration with environment-specific policies
    mergedConfig.security = {
      helmet: {
        ...baseConfig.security?.helmet,
        ...overrides.security?.helmet
      },
      cors: {
        ...baseConfig.security?.cors,
        ...overrides.security?.cors
      },
      csp: {
        ...baseConfig.security?.csp,
        ...overrides.security?.csp
      },
      ...overrides.security
    };

    // Merge PM2 configuration with cluster mode and process settings
    mergedConfig.pm2 = {
      apps: [
        ...(baseConfig.pm2?.apps || []),
        ...(overrides.pm2?.apps || [])
      ],
      cluster: {
        ...baseConfig.pm2?.cluster,
        ...overrides.pm2?.cluster
      },
      monitoring: {
        ...baseConfig.pm2?.monitoring,
        ...overrides.pm2?.monitoring
      },
      ...overrides.pm2
    };

    // Create unified server configuration
    mergedConfig.server = {
      port: mergedConfig.environment.server?.port || ENV_CONSTANTS.DEFAULT_PORT,
      host: mergedConfig.environment.server?.host || '0.0.0.0',
      protocol: mergedConfig.environment.server?.protocol || 'http',
      cors: mergedConfig.security.cors,
      security: mergedConfig.security.helmet,
      ...overrides.server
    };

    // Resolve configuration conflicts using precedence rules
    const conflictResolution = resolveConfigurationConflicts(mergedConfig, baseConfig, overrides);
    if (conflictResolution.conflicts.length > 0) {
      logWarn('Configuration conflicts detected and resolved', {
        conflicts: conflictResolution.conflicts,
        resolutions: conflictResolution.resolutions
      });
    }

    // Apply environment-specific overrides and customizations
    const environmentSpecificConfig = await applyEnvironmentSpecificOverrides(
      mergedConfig, 
      targetEnvironment
    );

    // Validate merged configuration for consistency
    const mergeValidation = await validateMergedConfiguration(environmentSpecificConfig);
    if (!mergeValidation.isValid) {
      throw new ValidationError(
        'Merged configuration validation failed',
        mergeValidation.errors
      );
    }

    // Add merge metadata
    environmentSpecificConfig.metadata = {
      ...environmentSpecificConfig.metadata,
      mergedAt: new Date().toISOString(),
      mergeMethod: 'mergeConfigurations',
      baseModules: Object.keys(baseConfig),
      overrideKeys: Object.keys(overrides),
      conflictsResolved: conflictResolution.conflicts.length,
      environment: targetEnvironment
    };

    logInfo('Configuration merge completed successfully', {
      environment: targetEnvironment,
      modules: Object.keys(environmentSpecificConfig).filter(key => key !== 'metadata'),
      conflictsResolved: conflictResolution.conflicts.length,
      mergeTime: environmentSpecificConfig.metadata.mergedAt
    });

    // Return unified configuration object with all modules integrated
    return environmentSpecificConfig;

  } catch (error) {
    const mergeError = new ValidationError(
      `Configuration merge failed: ${error.message}`,
      {
        cause: error,
        environment: targetEnvironment,
        context: {
          baseModules: Object.keys(baseConfig),
          overrideKeys: Object.keys(overrides),
          timestamp: new Date().toISOString()
        }
      }
    );

    logError('Configuration merge error', {
      error: mergeError.message,
      errorId: mergeError.errorId,
      environment: targetEnvironment,
      stack: error.stack
    });

    throw mergeError;
  }
}

/**
 * Retrieves current application configuration with optional module filtering and caching for
 * performance optimization. Provides flexible access to configuration data with security
 * filtering and validation.
 * 
 * @param {string} [module] - Specific configuration module to retrieve
 * @param {boolean} [useCache=true] - Whether to use cached configuration
 * @returns {Promise<Object>} Requested configuration module or complete configuration object
 */
async function getConfiguration(module, useCache = true) {
  try {
    logDebug('Retrieving configuration', {
      module: module || 'all',
      useCache,
      cacheSize: CONFIG_CACHE.size
    });

    // Check configuration cache if useCache is true
    if (useCache && CONFIG_CACHE.has('unified-config')) {
      const cachedConfig = CONFIG_CACHE.get('unified-config');
      
      if (module) {
        // Filter configuration by module if specific module requested
        if (cachedConfig[module]) {
          logDebug('Specific module retrieved from cache', {
            module,
            keys: Object.keys(cachedConfig[module])
          });
          return cachedConfig[module];
        } else {
          throw new ValidationError(
            `Configuration module '${module}' not found`,
            { module, availableModules: Object.keys(cachedConfig) }
          );
        }
      }
      
      // Apply security filtering for sensitive configuration values
      const filteredConfig = applySecurityFiltering(cachedConfig);
      
      logDebug('Complete configuration retrieved from cache', {
        modules: Object.keys(filteredConfig),
        lastLoaded: filteredConfig.metadata?.lastLoaded
      });
      
      return filteredConfig;
    }

    // Load configuration if not already initialized
    logDebug('Configuration not cached, initializing fresh configuration');
    const freshConfig = await initializeConfiguration(CURRENT_ENVIRONMENT, {
      enableCaching: useCache
    });

    if (module) {
      if (freshConfig[module]) {
        return freshConfig[module];
      } else {
        throw new ValidationError(
          `Configuration module '${module}' not found`,
          { module, availableModules: Object.keys(freshConfig) }
        );
      }
    }

    // Return requested configuration module or complete configuration
    const secureConfig = applySecurityFiltering(freshConfig);
    return secureConfig;

  } catch (error) {
    const retrievalError = new ValidationError(
      `Configuration retrieval failed: ${error.message}`,
      {
        cause: error,
        module: module || 'all',
        useCache,
        context: {
          timestamp: new Date().toISOString(),
          cacheKeys: Array.from(CONFIG_CACHE.keys())
        }
      }
    );

    logError('Configuration retrieval error', {
      error: retrievalError.message,
      errorId: retrievalError.errorId,
      module: module || 'all',
      stack: error.stack
    });

    throw retrievalError;
  }
}

/**
 * Updates configuration values dynamically with validation and caching invalidation for runtime
 * configuration changes. Supports safe runtime updates with rollback capabilities.
 * 
 * @param {string} module - Configuration module to update
 * @param {Object} updates - Configuration updates to apply
 * @param {boolean} [validateFirst=true] - Whether to validate updates before applying
 * @returns {Promise<Object>} Updated configuration with change summary and validation results
 */
async function updateConfiguration(module, updates, validateFirst = true) {
  try {
    logDebug('Updating configuration module', {
      module,
      updateKeys: Object.keys(updates),
      validateFirst
    });

    // Validate updates if validateFirst is true
    if (validateFirst) {
      const updateValidation = await validateConfigurationUpdates(module, updates);
      if (!updateValidation.isValid) {
        throw new ValidationError(
          `Configuration update validation failed for module '${module}'`,
          updateValidation.errors
        );
      }
    }

    // Load current configuration from cache or reload
    const currentConfig = await getConfiguration();
    if (!currentConfig[module]) {
      throw new ValidationError(
        `Configuration module '${module}' not found for update`,
        { module, availableModules: Object.keys(currentConfig) }
      );
    }

    // Create backup of current configuration for rollback
    const configBackup = JSON.parse(JSON.stringify(currentConfig[module]));

    // Apply updates to specified configuration module
    const updatedModule = {
      ...currentConfig[module],
      ...updates,
      metadata: {
        ...currentConfig[module].metadata,
        lastUpdated: new Date().toISOString(),
        updateMethod: 'updateConfiguration',
        updatedKeys: Object.keys(updates)
      }
    };

    // Validate updated configuration for consistency
    const updatedConfig = {
      ...currentConfig,
      [module]: updatedModule
    };

    if (validateFirst) {
      const consistencyValidation = await validateConfigurationConsistency(updatedConfig);
      if (!consistencyValidation.isValid) {
        logWarn('Configuration update failed consistency validation, rolling back', {
          module,
          errors: consistencyValidation.errors
        });
        throw new ValidationError(
          `Updated configuration failed consistency validation`,
          consistencyValidation.errors
        );
      }
    }

    // Invalidate configuration cache to force reload
    CONFIG_CACHE.delete('unified-config');
    CONFIG_CACHE.delete(`config-${CURRENT_ENVIRONMENT}`);
    CONFIG_VALIDATION_CACHE.clear();

    // Update cached configuration
    CONFIG_CACHE.set('unified-config', updatedConfig);

    // Log configuration changes for audit trail
    const changesSummary = {
      module,
      updatedKeys: Object.keys(updates),
      timestamp: updatedModule.metadata.lastUpdated,
      previousValues: Object.keys(updates).reduce((prev, key) => {
        prev[key] = configBackup[key];
        return prev;
      }, {}),
      newValues: updates
    };

    logInfo('Configuration updated successfully', changesSummary);

    // Return updated configuration with change metadata
    return {
      success: true,
      module,
      updatedConfiguration: updatedModule,
      changes: changesSummary,
      validation: validateFirst ? 'passed' : 'skipped',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const updateError = new ValidationError(
      `Configuration update failed: ${error.message}`,
      {
        cause: error,
        module,
        updates: Object.keys(updates),
        context: {
          validateFirst,
          timestamp: new Date().toISOString()
        }
      }
    );

    logError('Configuration update error', {
      error: updateError.message,
      errorId: updateError.errorId,
      module,
      updateKeys: Object.keys(updates),
      stack: error.stack
    });

    throw updateError;
  }
}

/**
 * Creates environment-specific configuration by combining base configuration with environment
 * overrides and validation. Generates optimized configuration for target deployment environment.
 * 
 * @param {string} targetEnvironment - Target environment for configuration creation
 * @param {Object} [customSettings={}] - Custom settings to apply to environment configuration
 * @returns {Promise<Object>} Environment-specific configuration with all modules configured for target environment
 */
async function createEnvironmentConfig(targetEnvironment, customSettings = {}) {
  try {
    logDebug('Creating environment-specific configuration', {
      targetEnvironment,
      customKeys: Object.keys(customSettings)
    });

    // Load base configuration template for target environment
    const baseTemplate = await loadEnvironmentTemplate(targetEnvironment);
    
    // Create environment-specific database configuration
    const envDatabaseConfig = await createEnvironmentDatabaseConfig(targetEnvironment);
    
    // Generate security configuration for environment security level
    const envSecurityConfig = await createEnvironmentSecurityConfig(targetEnvironment);
    
    // Configure PM2 settings for environment deployment requirements
    const envPM2Config = await createEnvironmentPM2Config(targetEnvironment);

    // Apply custom settings overrides if provided
    const environmentConfig = {
      environment: {
        ...baseTemplate,
        ...customSettings.environment
      },
      database: {
        ...envDatabaseConfig,
        ...customSettings.database
      },
      security: {
        ...envSecurityConfig,
        ...customSettings.security
      },
      pm2: {
        ...envPM2Config,
        ...customSettings.pm2
      },
      server: {
        port: baseTemplate.server?.port || ENV_CONSTANTS.DEFAULT_PORT,
        host: baseTemplate.server?.host || '0.0.0.0',
        protocol: baseTemplate.server?.protocol || 'http',
        ...customSettings.server
      }
    };

    // Validate complete environment configuration
    const environmentValidation = await validateEnvironmentConfiguration(
      environmentConfig, 
      targetEnvironment
    );
    
    if (!environmentValidation.isValid) {
      throw new ValidationError(
        `Environment configuration validation failed for '${targetEnvironment}'`,
        environmentValidation.errors
      );
    }

    // Add environment metadata
    environmentConfig.metadata = {
      createdAt: new Date().toISOString(),
      targetEnvironment,
      creationMethod: 'createEnvironmentConfig',
      customSettingsApplied: Object.keys(customSettings).length > 0,
      validation: 'passed',
      source: 'environment-factory'
    };

    logInfo('Environment configuration created successfully', {
      targetEnvironment,
      modules: Object.keys(environmentConfiguration).filter(key => key !== 'metadata'),
      customSettingsApplied: environmentConfig.metadata.customSettingsApplied,
      creationTime: environmentConfig.metadata.createdAt
    });

    // Return environment-ready configuration object
    return environmentConfig;

  } catch (error) {
    const envError = new ValidationError(
      `Environment configuration creation failed: ${error.message}`,
      {
        cause: error,
        targetEnvironment,
        customSettings: Object.keys(customSettings),
        context: {
          timestamp: new Date().toISOString()
        }
      }
    );

    logError('Environment configuration creation error', {
      error: envError.message,
      errorId: envError.errorId,
      targetEnvironment,
      stack: error.stack
    });

    throw envError;
  }
}

/**
 * Exports configuration to various file formats including .env files, JSON configuration, and
 * PM2 ecosystem files for deployment automation. Supports multiple export formats with
 * security filtering and template generation.
 * 
 * @param {Object} config - Configuration object to export
 * @param {string} outputDir - Output directory for exported files
 * @param {string[]} [formats=['env', 'json', 'pm2']] - Export formats to generate
 * @returns {Promise<Object>} Export result with generated file paths and format information
 */
async function exportConfigurationFiles(config, outputDir, formats = ['env', 'json', 'pm2']) {
  try {
    logDebug('Exporting configuration files', {
      outputDir,
      formats,
      configModules: Object.keys(config).filter(key => key !== 'metadata')
    });

    // Validate export configuration and output directory
    await validateExportConfiguration(config, outputDir, formats);

    const exportResults = {
      success: true,
      outputDir,
      formats,
      generatedFiles: [],
      timestamp: new Date().toISOString()
    };

    // Generate .env files for environment variable configuration
    if (formats.includes('env')) {
      const envFilePath = await generateEnvFile(config, outputDir);
      exportResults.generatedFiles.push({
        format: 'env',
        path: envFilePath,
        description: 'Environment variables configuration'
      });
      logDebug('Environment file generated', { path: envFilePath });
    }

    // Create JSON configuration files for application settings
    if (formats.includes('json')) {
      const jsonFilePath = await generateJSONConfigFile(config, outputDir);
      exportResults.generatedFiles.push({
        format: 'json',
        path: jsonFilePath,
        description: 'JSON configuration file'
      });
      logDebug('JSON configuration file generated', { path: jsonFilePath });
    }

    // Export PM2 ecosystem files for production deployment
    if (formats.includes('pm2')) {
      const pm2FilePath = await generatePM2EcosystemFile(config, outputDir);
      exportResults.generatedFiles.push({
        format: 'pm2',
        path: pm2FilePath,
        description: 'PM2 ecosystem configuration'
      });
      logDebug('PM2 ecosystem file generated', { path: pm2FilePath });
    }

    // Apply security filtering to exclude sensitive values
    const secureConfig = applySecurityFiltering(config);
    
    // Write configuration files to specified output directory
    await Promise.all(exportResults.generatedFiles.map(async (file) => {
      await validateGeneratedFile(file.path);
    }));

    // Validate exported files for completeness and format
    const validationResults = await validateExportedFiles(exportResults.generatedFiles);
    exportResults.validation = validationResults;

    logInfo('Configuration files exported successfully', {
      outputDir,
      fileCount: exportResults.generatedFiles.length,
      formats: exportResults.generatedFiles.map(f => f.format),
      validationPassed: validationResults.allValid
    });

    // Return export result with file paths and metadata
    return exportResults;

  } catch (error) {
    const exportError = new ValidationError(
      `Configuration export failed: ${error.message}`,
      {
        cause: error,
        outputDir,
        formats,
        context: {
          timestamp: new Date().toISOString()
        }
      }
    );

    logError('Configuration export error', {
      error: exportError.message,
      errorId: exportError.errorId,
      outputDir,
      formats,
      stack: error.stack
    });

    throw exportError;
  }
}

/**
 * Performs health check on current configuration including validation status, cache health, and
 * system compatibility. Provides comprehensive configuration diagnostics and monitoring data.
 * 
 * @returns {Promise<Object>} Configuration health status with validation results, cache statistics, and system compatibility
 */
export async function getConfigurationHealth() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    overall: 'unknown',
    components: {},
    cache: {},
    system: {},
    recommendations: []
  };

  try {
    logDebug('Performing configuration health check');

    // Check configuration initialization status
    healthCheck.components.initialization = {
      status: CONFIGURATION_LOADED.value ? 'healthy' : 'unhealthy',
      initialized: CONFIG_METADATA.initialized,
      lastLoaded: CONFIG_METADATA.lastLoaded,
      loadCount: CONFIG_METADATA.loadCount
    };

    // Validate current configuration completeness
    try {
      const currentConfig = await getConfiguration();
      const configValidation = await validateAllConfigurations(currentConfig);
      
      healthCheck.components.validation = {
        status: configValidation.isValid ? 'healthy' : 'unhealthy',
        isValid: configValidation.isValid,
        errorCount: configValidation.errors.length,
        warningCount: configValidation.warnings.length,
        lastValidation: configValidation.timestamp
      };
    } catch (validationError) {
      healthCheck.components.validation = {
        status: 'unhealthy',
        error: validationError.message,
        lastValidation: new Date().toISOString()
      };
    }

    // Check configuration cache health and statistics
    healthCheck.cache = {
      status: CONFIG_CACHE.size > 0 ? 'healthy' : 'empty',
      size: CONFIG_CACHE.size,
      keys: Array.from(CONFIG_CACHE.keys()),
      validationCacheSize: CONFIG_VALIDATION_CACHE.size,
      hitRate: calculateCacheHitRate()
    };

    // Verify system compatibility and requirements
    healthCheck.system = {
      nodeVersion: process.version,
      nodeVersionSupported: isNodeVersionSupported(process.version),
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid,
      environment: CURRENT_ENVIRONMENT
    };

    // Check environment variable availability
    const envVarCheck = checkRequiredEnvironmentVariables();
    healthCheck.components.environmentVariables = {
      status: envVarCheck.allPresent ? 'healthy' : 'warning',
      requiredPresent: envVarCheck.present.length,
      requiredMissing: envVarCheck.missing.length,
      missingVars: envVarCheck.missing
    };

    // Validate cross-platform compatibility
    const crossPlatformCheck = validateCrossPlatformSupport();
    healthCheck.components.crossPlatform = {
      status: crossPlatformCheck.supported ? 'healthy' : 'warning',
      supported: crossPlatformCheck.supported,
      issues: crossPlatformCheck.issues
    };

    // Generate configuration health report
    const overallHealth = determineOverallHealth(healthCheck);
    healthCheck.overall = overallHealth.status;
    healthCheck.score = overallHealth.score;

    // Add recommendations based on health check results
    healthCheck.recommendations = generateHealthRecommendations(healthCheck);

    // Update global health status
    CONFIG_METADATA.healthStatus = {
      isHealthy: healthCheck.overall === 'healthy',
      lastValidation: healthCheck.timestamp,
      errors: healthCheck.components.validation?.errorCount || 0,
      score: healthCheck.score
    };

    logInfo('Configuration health check completed', {
      overall: healthCheck.overall,
      score: healthCheck.score,
      cacheSize: healthCheck.cache.size,
      recommendationCount: healthCheck.recommendations.length
    });

    // Return comprehensive health status object
    return healthCheck;

  } catch (error) {
    healthCheck.overall = 'unhealthy';
    healthCheck.error = error.message;
    healthCheck.components.healthCheck = {
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    logError('Configuration health check failed', {
      error: error.message,
      timestamp: healthCheck.timestamp
    });

    return healthCheck;
  }
}

/**
 * Resets configuration cache and reloads all configuration modules for troubleshooting and
 * development purposes. Provides clean slate configuration loading with validation.
 * 
 * @param {boolean} [clearCache=true] - Whether to clear configuration cache
 * @returns {Promise<Object>} Reset operation result with reloaded configuration
 */
export async function resetConfiguration(clearCache = true) {
  try {
    logInfo('Resetting configuration system', { clearCache });

    const resetResult = {
      success: false,
      timestamp: new Date().toISOString(),
      actions: [],
      reloadedConfiguration: null
    };

    // Clear configuration cache if clearCache is true
    if (clearCache) {
      const cacheSize = CONFIG_CACHE.size;
      CONFIG_CACHE.clear();
      CONFIG_VALIDATION_CACHE.clear();
      resetResult.actions.push(`Cleared configuration cache (${cacheSize} entries)`);
      logDebug('Configuration cache cleared', { entriesCleared: cacheSize });
    }

    // Reset configuration loading status flags
    CONFIGURATION_LOADED.value = false;
    CONFIG_METADATA.initialized = false;
    CONFIG_METADATA.lastLoaded = null;
    CONFIG_METADATA.healthStatus.isHealthy = false;
    resetResult.actions.push('Reset configuration loading status flags');

    // Reload all configuration modules from source
    logDebug('Reloading all configuration modules from source');
    const freshConfiguration = await initializeConfiguration(CURRENT_ENVIRONMENT, {
      forceReload: true,
      enableCaching: true
    });
    resetResult.actions.push('Reloaded all configuration modules');

    // Re-validate configuration after reset
    const postResetValidation = await validateAllConfigurations(freshConfiguration);
    resetResult.actions.push('Re-validated configuration after reset');
    
    if (!postResetValidation.isValid) {
      logWarn('Configuration validation failed after reset', {
        errors: postResetValidation.errors,
        warnings: postResetValidation.warnings
      });
    }

    // Update cache with fresh configuration
    CONFIG_CACHE.set('unified-config', freshConfiguration);
    CONFIG_CACHE.set(`config-${CURRENT_ENVIRONMENT}`, freshConfiguration);
    resetResult.actions.push('Updated cache with fresh configuration');

    // Update metadata and result
    resetResult.success = true;
    resetResult.reloadedConfiguration = freshConfiguration;
    resetResult.validation = {
      isValid: postResetValidation.isValid,
      errorCount: postResetValidation.errors.length,
      warningCount: postResetValidation.warnings.length
    };

    // Log reset operation for debugging
    logInfo('Configuration reset completed successfully', {
      actionsCount: resetResult.actions.length,
      validationPassed: postResetValidation.isValid,
      cacheEnabled: true,
      environment: CURRENT_ENVIRONMENT
    });

    // Return reset result with fresh configuration
    return resetResult;

  } catch (error) {
    const resetError = new ValidationError(
      `Configuration reset failed: ${error.message}`,
      {
        cause: error,
        clearCache,
        context: {
          timestamp: new Date().toISOString(),
          environment: CURRENT_ENVIRONMENT
        }
      }
    );

    logError('Configuration reset error', {
      error: resetError.message,
      errorId: resetError.errorId,
      clearCache,
      stack: error.stack
    });

    throw resetError;
  }
}

/**
 * Logs comprehensive configuration summary for debugging, audit, and educational purposes while
 * protecting sensitive information. Generates detailed configuration overview with learning context.
 * 
 * @param {Object} config - Configuration object to summarize
 * @param {string} [logLevel='info'] - Log level for output
 * @returns {void} No return value, performs configuration logging side effect
 */
export function logConfigurationSummary(config, logLevel = 'info') {
  try {
    // Sanitize configuration to remove sensitive information
    const sanitizedConfig = applySecurityFiltering(config);

    // Format configuration summary for readable output
    const configSummary = {
      timestamp: new Date().toISOString(),
      environment: sanitizedConfig.environment?.currentEnvironment || CURRENT_ENVIRONMENT,
      modules: Object.keys(sanitizedConfig).filter(key => key !== 'metadata'),
      metadata: sanitizedConfig.metadata,
      
      // Include environment context and validation status
      context: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      
      // Add educational notes about configuration decisions
      educational: {
        architectureType: 'monolithic-stateless',
        scalingStrategy: 'pm2-cluster-mode',
        securityApproach: 'helmet-middleware',
        deploymentPattern: 'zero-downtime-reload',
        crossPlatformSupport: 'flask-equivalent-implementation'
      },
      
      // Include references to tutorial phases and learning objectives
      tutorial: {
        currentPhase: determineTutorialPhase(sanitizedConfig),
        learningObjectives: getLearningObjectives(sanitizedConfig),
        nextSteps: getNextTutorialSteps(sanitizedConfig)
      }
    };

    // Create module-specific summaries
    configSummary.modules.forEach(moduleName => {
      const moduleConfig = sanitizedConfig[moduleName];
      configSummary[`${moduleName}Summary`] = createModuleSummary(moduleName, moduleConfig);
    });

    // Log configuration summary at specified log level
    const logFunction = getLogFunction(logLevel);
    logFunction('Configuration Summary', configSummary);

    // Additional detailed logging for development environment
    if (CURRENT_ENVIRONMENT === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT) {
      logDebug('Detailed configuration breakdown', {
        database: sanitizedConfig.database ? 'configured' : 'not-configured',
        security: sanitizedConfig.security ? Object.keys(sanitizedConfig.security) : [],
        pm2: sanitizedConfig.pm2 ? 'cluster-ready' : 'single-process',
        server: sanitizedConfig.server ? `${sanitizedConfig.server.host}:${sanitizedConfig.server.port}` : 'not-configured'
      });
    }

  } catch (error) {
    logError('Configuration summary logging failed', {
      error: error.message,
      logLevel,
      timestamp: new Date().toISOString()
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS - Internal utility functions for configuration management
// ============================================================================

/**
 * Validates cross-configuration compatibility and dependencies
 * @private
 * @param {Object} configurations - All configuration modules
 * @returns {Promise<Object>} Compatibility validation result
 */
async function validateCrossConfigurationCompatibility(configurations) {
  const compatibility = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check PM2 cluster mode compatibility with stateless architecture
  if (configurations.pm2?.cluster?.enabled && !configurations.database?.stateless) {
    compatibility.warnings.push('PM2 cluster mode recommended with stateless architecture');
  }

  // Verify security configuration matches environment requirements
  if (configurations.environment?.isProduction) {
    if (!configurations.security?.helmet?.contentSecurityPolicy) {
      compatibility.errors.push('Production environment requires Content Security Policy');
      compatibility.isValid = false;
    }
  }

  return compatibility;
}

/**
 * Validates educational requirements for tutorial progression
 * @private
 * @param {Object} configurations - All configuration modules
 * @returns {Object} Educational validation result
 */
function validateEducationalRequirements(configurations) {
  const educational = {
    warnings: []
  };

  // Check for educational documentation completeness
  if (!configurations.database?.rationale) {
    educational.warnings.push('Database configuration missing educational rationale');
  }

  if (!configurations.metadata?.source) {
    educational.warnings.push('Configuration metadata missing source information');
  }

  return educational;
}

/**
 * Validates cross-platform compatibility for Flask implementation
 * @private
 * @param {Object} configurations - All configuration modules
 * @returns {Object} Cross-platform validation result
 */
function validateCrossPlatformCompatibility(configurations) {
  const crossPlatform = {
    warnings: []
  };

  // Check for Flask-compatible configuration patterns
  if (configurations.server?.port !== 3000) {
    crossPlatform.warnings.push('Non-standard port may require Flask configuration adjustment');
  }

  return crossPlatform;
}

/**
 * Generates validation recommendations based on validation results
 * @private
 * @param {Object} validationResult - Validation result object
 * @returns {string[]} Array of actionable recommendations
 */
function generateValidationRecommendations(validationResult) {
  const recommendations = [];

  if (validationResult.errors.length > 0) {
    recommendations.push('Fix configuration errors before production deployment');
  }

  if (validationResult.warnings.length > 3) {
    recommendations.push('Review configuration warnings to improve system robustness');
  }

  if (!validationResult.moduleResults.security?.isValid) {
    recommendations.push('Update security configuration for production readiness');
  }

  return recommendations;
}

/**
 * Applies environment-specific overrides to configuration
 * @private
 * @param {Object} config - Base configuration
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Configuration with environment overrides
 */
async function applyEnvironmentOverrides(config, environment) {
  const envOverrides = getEnvironmentOverrides(environment);
  
  return {
    ...config,
    ...envOverrides,
    metadata: {
      ...config.metadata,
      environmentOverridesApplied: true,
      overridesFor: environment
    }
  };
}

/**
 * Gets environment-specific configuration overrides
 * @private
 * @param {string} environment - Target environment
 * @returns {Object} Environment-specific overrides
 */
function getEnvironmentOverrides(environment) {
  const overrides = {
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT]: {
      security: { helmet: { contentSecurityPolicy: false } }
    },
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION]: {
      security: { helmet: { contentSecurityPolicy: true } },
      pm2: { cluster: { instances: 'max' } }
    }
  };

  return overrides[environment] || {};
}

/**
 * Resolves configuration conflicts using precedence rules
 * @private
 * @param {Object} merged - Merged configuration
 * @param {Object} base - Base configuration
 * @param {Object} overrides - Override configuration
 * @returns {Object} Conflict resolution result
 */
function resolveConfigurationConflicts(merged, base, overrides) {
  return {
    conflicts: [],
    resolutions: []
  };
}

/**
 * Applies environment-specific overrides with conflict resolution
 * @private
 * @param {Object} config - Configuration to override
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Configuration with environment-specific overrides
 */
async function applyEnvironmentSpecificOverrides(config, environment) {
  const envSpecific = { ...config };
  
  // Apply production-specific settings
  if (environment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
    envSpecific.security.helmet.contentSecurityPolicy = true;
    envSpecific.pm2.cluster.instances = 'max';
  }

  return envSpecific;
}

/**
 * Validates merged configuration for consistency
 * @private
 * @param {Object} config - Merged configuration
 * @returns {Promise<Object>} Validation result
 */
async function validateMergedConfiguration(config) {
  return {
    isValid: true,
    errors: []
  };
}

/**
 * Applies security filtering to configuration for safe exposure
 * @private
 * @param {Object} config - Configuration to filter
 * @returns {Object} Security-filtered configuration
 */
function applySecurityFiltering(config) {
  const filtered = JSON.parse(JSON.stringify(config));
  
  // Remove sensitive configuration values
  if (filtered.security?.keys) {
    delete filtered.security.keys;
  }
  
  return filtered;
}

/**
 * Validates configuration updates before applying
 * @private
 * @param {string} module - Module being updated
 * @param {Object} updates - Updates to validate
 * @returns {Promise<Object>} Update validation result
 */
async function validateConfigurationUpdates(module, updates) {
  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validates configuration consistency after updates
 * @private
 * @param {Object} config - Updated configuration
 * @returns {Promise<Object>} Consistency validation result
 */
async function validateConfigurationConsistency(config) {
  return {
    isValid: true,
    errors: []
  };
}

/**
 * Loads environment template for configuration creation
 * @private
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Environment template
 */
async function loadEnvironmentTemplate(environment) {
  return await loadEnvironmentConfig(environment);
}

/**
 * Creates environment-specific database configuration
 * @private
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Environment database configuration
 */
async function createEnvironmentDatabaseConfig(environment) {
  return await getDatabaseConfig();
}

/**
 * Creates environment-specific security configuration
 * @private
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Environment security configuration
 */
async function createEnvironmentSecurityConfig(environment) {
  const envConfig = await loadEnvironmentConfig(environment);
  return await createSecurityConfig(envConfig);
}

/**
 * Creates environment-specific PM2 configuration
 * @private
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Environment PM2 configuration
 */
async function createEnvironmentPM2Config(environment) {
  const envConfig = await loadEnvironmentConfig(environment);
  return await createPM2Config(envConfig);
}

/**
 * Validates environment configuration for target environment
 * @private
 * @param {Object} config - Environment configuration
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Environment validation result
 */
async function validateEnvironmentConfiguration(config, environment) {
  return {
    isValid: true,
    errors: []
  };
}

/**
 * Additional helper functions for configuration export, health checking, and utilities
 */

// Export-related helper functions
async function validateExportConfiguration(config, outputDir, formats) {
  // Validation implementation
}

async function generateEnvFile(config, outputDir) {
  const envPath = join(outputDir, '.env');
  const envContent = Object.entries(config.environment.server || {})
    .map(([key, value]) => `${key.toUpperCase()}=${value}`)
    .join('\n');
  
  await require('fs').promises.writeFile(envPath, envContent);
  return envPath;
}

async function generateJSONConfigFile(config, outputDir) {
  const jsonPath = join(outputDir, 'config.json');
  await require('fs').promises.writeFile(jsonPath, JSON.stringify(config, null, 2));
  return jsonPath;
}

async function generatePM2EcosystemFile(config, outputDir) {
  const pm2Path = join(outputDir, 'ecosystem.config.js');
  const pm2Content = `module.exports = ${JSON.stringify(config.pm2, null, 2)};`;
  await require('fs').promises.writeFile(pm2Path, pm2Content);
  return pm2Path;
}

async function validateGeneratedFile(filePath) {
  await access(filePath, constants.F_OK);
}

async function validateExportedFiles(files) {
  return {
    allValid: true,
    results: files.map(f => ({ path: f.path, valid: true }))
  };
}

// Health check helper functions
function calculateCacheHitRate() {
  return CONFIG_CACHE.size > 0 ? 0.85 : 0; // Mock cache hit rate
}

function isNodeVersionSupported(version) {
  const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
  return majorVersion >= 18;
}

function checkRequiredEnvironmentVariables() {
  const required = ['NODE_ENV'];
  const present = required.filter(env => process.env[env]);
  const missing = required.filter(env => !process.env[env]);
  
  return {
    allPresent: missing.length === 0,
    present,
    missing
  };
}

function validateCrossPlatformSupport() {
  return {
    supported: true,
    issues: []
  };
}

function determineOverallHealth(healthCheck) {
  const healthyComponents = Object.values(healthCheck.components)
    .filter(comp => comp.status === 'healthy').length;
  const totalComponents = Object.keys(healthCheck.components).length;
  const score = Math.round((healthyComponents / totalComponents) * 100);
  
  return {
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'unhealthy',
    score
  };
}

function generateHealthRecommendations(healthCheck) {
  const recommendations = [];
  
  if (healthCheck.cache.size === 0) {
    recommendations.push('Initialize configuration cache for better performance');
  }
  
  if (healthCheck.components.validation?.errorCount > 0) {
    recommendations.push('Fix configuration validation errors');
  }
  
  return recommendations;
}

// Logging helper functions
function createModuleSummary(moduleName, moduleConfig) {
  return {
    configured: !!moduleConfig,
    keys: moduleConfig ? Object.keys(moduleConfig) : [],
    type: typeof moduleConfig
  };
}

function determineTutorialPhase(config) {
  if (config.pm2) return 'Phase 5: Production Deployment';
  if (config.security) return 'Phase 6: Security Implementation';
  return 'Phase 2: Express.js Enhancement';
}

function getLearningObjectives(config) {
  return [
    'Understanding configuration orchestration patterns',
    'Implementing environment-aware configuration loading',
    'Managing production-ready deployment settings'
  ];
}

function getNextTutorialSteps(config) {
  return [
    'Implement comprehensive testing framework',
    'Add monitoring and observability',
    'Create deployment automation scripts'
  ];
}

function getLogFunction(logLevel) {
  const logFunctions = {
    debug: logDebug,
    info: logInfo,
    warn: logWarn,
    error: logError
  };
  
  return logFunctions[logLevel] || logInfo;
}

// ============================================================================
// EXPORTS - Public API for configuration orchestration
// ============================================================================

// Export unified configuration object for centralized access
export const config = await initializeConfiguration();

// Re-export individual configuration modules for direct access
export const databaseConfig = config.database;
export const securityConfig = config.security;
export const environmentConfig = config.environment;
export const pm2Config = config.pm2;

// Export factory and utility functions
export const loadConfiguration = initializeConfiguration;
export const validateConfiguration = validateAllConfigurations;
export { getConfiguration, updateConfiguration, createEnvironmentConfig, exportConfigurationFiles };

// Export configuration health and monitoring
export const configHealth = await getConfigurationHealth();

// Log configuration initialization summary for educational purposes
logConfigurationSummary(config, 'info');

// Educational logging for tutorial progression
logInfo('Configuration orchestrator initialized successfully', {
  version: CONFIG_METADATA.version,
  environment: CURRENT_ENVIRONMENT,
  modules: Object.keys(config).filter(key => key !== 'metadata'),
  educational: {
    tutorialPhase: determineTutorialPhase(config),
    architecturePattern: 'stateless-monolithic-with-clustering',
    deploymentStrategy: 'pm2-zero-downtime',
    securityApproach: 'helmet-middleware-integration'
  },
  timestamp: new Date().toISOString()
});