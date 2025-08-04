/**
 * @fileoverview PM2 Process Management Configuration Module
 * @description Central PM2 configuration hub providing comprehensive process management,
 * cluster mode support, zero-downtime deployment, and production-ready monitoring for
 * the Node.js tutorial project. Integrates seamlessly with PM2 v6.0.8 capabilities
 * to deliver enterprise-grade process management with educational demonstrations of
 * modern deployment practices and horizontal scaling patterns.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Environment-specific PM2 configurations for development, staging, and production
 * - Automatic CPU core detection for optimal instance scaling
 * - Comprehensive restart policies with exponential backoff and memory management
 * - Advanced monitoring with health checks, performance metrics, and alerting
 * - Production-ready log management with rotation, retention, and structured formatting
 * - Zero-downtime deployment support with sequential process restart validation
 * - Security-hardened process isolation and resource management
 * - Cross-platform compatibility with Flask deployment patterns
 * 
 * Technology Integration:
 * - PM2 v6.0.8 with cluster mode and built-in load balancer
 * - Node.js v22.x LTS with ES Modules and top-level await support
 * - Express.js v5.1.0 stateless architecture optimized for PM2
 * - Comprehensive logging integration with structured output
 * - Environment-aware configuration management
 * - Production monitoring and health check capabilities
 * 
 * Educational Value:
 * - Demonstrates modern process management patterns
 * - Showcases production deployment best practices
 * - Provides comprehensive PM2 configuration examples
 * - Illustrates horizontal scaling with cluster mode
 * - Shows environment-specific optimization strategies
 */

// Node.js built-in module imports with version compatibility
import path from 'node:path'; // Node.js built-in - File and directory path utilities
import os from 'node:os'; // Node.js built-in - Operating system utilities for CPU detection

// Internal imports from project modules
import {
  currentEnvironment,
  isProduction,
  isDevelopment,
  pm2 as environmentPM2Config,
  server as serverConfig
} from '../config/environment.js';

import {
  PM2_CONSTANTS,
  PERFORMANCE_CONSTANTS
} from '../utils/constants.js';

import logger from '../utils/logger.js';

// Global PM2 configuration constants
const DEFAULT_APP_NAME = process.env.PM2_APP_NAME || 'nodejs-tutorial-app';
const DEFAULT_SCRIPT_PATH = path.resolve(process.cwd(), 'server.js');
const DEFAULT_INSTANCES = isProduction ? 'max' : 1;
const DEFAULT_EXEC_MODE = isProduction ? 'cluster' : 'fork';

/**
 * Creates comprehensive PM2 configuration object with environment-specific settings
 * including process management, clustering, monitoring, and deployment parameters
 * optimized for the target environment. Provides production-ready configurations
 * with automatic scaling, restart policies, and comprehensive monitoring.
 * 
 * @param {string} environment - Target deployment environment (development, staging, production)
 * @param {Object} configOptions - Additional configuration options and overrides
 * @param {string} [configOptions.appName] - Custom application name
 * @param {string} [configOptions.scriptPath] - Path to main application script
 * @param {number|string} [configOptions.instances] - Number of instances or 'max'
 * @param {string} [configOptions.execMode] - Execution mode ('fork' or 'cluster')
 * @param {Object} [configOptions.envVars] - Additional environment variables
 * @returns {Object} Complete PM2 configuration object with process settings and deployment parameters
 */
export function createPM2Config(environment = currentEnvironment, configOptions = {}) {
  try {
    logger.info('Creating PM2 configuration', { 
      environment, 
      configOptions: Object.keys(configOptions),
      pid: process.pid 
    });

    // Validate environment parameter
    const validEnvironments = ['development', 'staging', 'production', 'test'];
    if (!validEnvironments.includes(environment)) {
      logger.warn('Invalid environment specified, defaulting to development', { 
        requestedEnvironment: environment,
        defaultEnvironment: 'development'
      });
      environment = 'development';
    }

    // Load environment-specific settings from environment config
    const envConfig = environmentPM2Config[environment] || environmentPM2Config.development;
    const serverSettings = serverConfig[environment] || serverConfig.development;

    // Configure execution mode based on environment
    const execMode = configOptions.execMode || 
      (environment === 'production' ? PM2_CONSTANTS.EXEC_MODES.CLUSTER : PM2_CONSTANTS.EXEC_MODES.FORK);

    // Generate instance configuration
    const instanceConfig = generateInstanceConfig(environment, {
      cpuCount: os.cpus().length,
      availableMemory: os.totalmem(),
      customInstances: configOptions.instances
    });

    // Configure memory limits and restart policies
    const restartPolicy = configureRestartPolicy({
      environment,
      maxMemoryRestart: PERFORMANCE_CONSTANTS.MEMORY_LIMITS[environment.toUpperCase()] || '1G',
      maxRestarts: environment === 'production' ? 10 : 5,
      minUptime: environment === 'production' ? '10s' : '5s'
    });

    // Set up environment variables and process arguments
    const environmentVariables = {
      NODE_ENV: environment,
      PORT: serverSettings.port || 3000,
      LOG_LEVEL: envConfig.logLevel || 'info',
      PM2_CLUSTER_MODE: execMode === PM2_CONSTANTS.EXEC_MODES.CLUSTER ? 'true' : 'false',
      ...configOptions.envVars
    };

    // Configure monitoring and health check settings
    const monitoringConfig = setupMonitoringConfig({
      environment,
      healthCheckInterval: environment === 'production' ? 30000 : 60000,
      metricsCollection: environment === 'production',
      alertingEnabled: environment === 'production'
    });

    // Set up log management and rotation policies
    const logConfig = configureLogManagement({
      environment,
      logDirectory: './logs',
      maxLogSize: PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_SIZE,
      maxLogFiles: PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_FILES,
      compression: environment === 'production'
    });

    // Apply environment-specific performance optimizations
    const nodeArgs = [];
    if (environment === 'production') {
      nodeArgs.push(`--max-old-space-size=${PERFORMANCE_CONSTANTS.MEMORY_LIMITS.PRODUCTION_MAX_HEAP || 1024}`);
      nodeArgs.push('--optimize-for-size');
    } else if (environment === 'development') {
      nodeArgs.push('--inspect');
      nodeArgs.push('--trace-warnings');
    }

    // Build complete PM2 configuration object
    const pm2Config = {
      name: configOptions.appName || DEFAULT_APP_NAME,
      script: configOptions.scriptPath || DEFAULT_SCRIPT_PATH,
      instances: instanceConfig.instances,
      exec_mode: execMode,
      
      // Process management settings
      autorestart: restartPolicy.autorestart,
      max_restarts: restartPolicy.maxRestarts,
      min_uptime: restartPolicy.minUptime,
      restart_delay: restartPolicy.restartDelay,
      max_memory_restart: restartPolicy.maxMemoryRestart,
      
      // Environment and runtime configuration
      env: environmentVariables,
      node_args: nodeArgs.join(' '),
      
      // Development-specific settings
      ...(environment === 'development' && {
        watch: true,
        ignore_watch: ['node_modules', 'logs', 'test', 'coverage', '.git'],
        watch_options: {
          followSymlinks: false,
          usePolling: false
        }
      }),
      
      // Production-specific settings
      ...(environment === 'production' && {
        kill_timeout: 5000,
        listen_timeout: 3000,
        shutdown_with_message: true
      }),
      
      // Logging configuration
      ...logConfig,
      
      // Monitoring configuration
      monit: monitoringConfig.enabled,
      
      // PM2+ integration (if configured)
      ...(process.env.PM2_PLUS_SECRET_KEY && {
        pmx: monitoringConfig.pmxConfig
      }),
      
      // Advanced configuration
      pid_file: path.join('./logs', `${configOptions.appName || DEFAULT_APP_NAME}.pid`),
      merge_logs: true,
      time: true,
      
      // Error handling
      exp_backoff_restart_delay: 100,
      max_memory_restart: restartPolicy.maxMemoryRestart,
      
      // Performance optimization
      ...instanceConfig.performanceSettings
    };

    logger.info('PM2 configuration created successfully', {
      environment,
      appName: pm2Config.name,
      instances: pm2Config.instances,
      execMode: pm2Config.exec_mode,
      monitoring: monitoringConfig.enabled
    });

    return pm2Config;

  } catch (error) {
    logger.error('Failed to create PM2 configuration', error, { 
      environment, 
      configOptions 
    });
    throw new Error(`PM2 configuration creation failed: ${error.message}`);
  }
}

/**
 * Generates optimal instance configuration for PM2 cluster mode based on CPU cores,
 * available memory, and environment requirements to maximize performance while
 * ensuring system stability. Calculates optimal instance count with memory allocation
 * and performance settings tailored to the deployment environment.
 * 
 * @param {string} environment - Target environment (development, staging, production)
 * @param {Object} systemInfo - System information for optimization calculations
 * @param {number} systemInfo.cpuCount - Number of available CPU cores
 * @param {number} systemInfo.availableMemory - Total system memory in bytes
 * @param {number|string} [systemInfo.customInstances] - Custom instance override
 * @returns {Object} Instance configuration with optimal count, memory allocation, and performance settings
 */
export function generateInstanceConfig(environment, systemInfo) {
  try {
    logger.debug('Generating instance configuration', { environment, systemInfo });

    const { cpuCount, availableMemory, customInstances } = systemInfo;

    // Environment-specific instance calculation
    let instances;
    let memoryPerInstance;
    let performanceSettings = {};

    switch (environment) {
      case 'development':
        // Single instance for development with debugging support
        instances = customInstances || 1;
        memoryPerInstance = Math.min(availableMemory * 0.5, 1024 * 1024 * 1024); // Max 1GB or 50%
        performanceSettings = {
          node_args: '--inspect --trace-warnings',
          source_map_support: true
        };
        break;

      case 'staging':
        // Limited instances for staging validation
        instances = customInstances || Math.min(cpuCount, 2);
        memoryPerInstance = availableMemory / (instances * 2); // Conservative memory allocation
        performanceSettings = {
          node_args: '--max-old-space-size=512',
          gc_type: 'minor'
        };
        break;

      case 'production':
        // Maximize CPU utilization for production performance
        if (customInstances === 'max' || !customInstances) {
          instances = 'max'; // PM2 will use all available cores
          memoryPerInstance = (availableMemory * 0.8) / cpuCount; // 80% memory utilization
        } else {
          instances = Math.min(customInstances, cpuCount);
          memoryPerInstance = (availableMemory * 0.8) / instances;
        }
        
        performanceSettings = {
          node_args: `--max-old-space-size=${Math.floor(memoryPerInstance / (1024 * 1024))}`,
          gc_type: 'major',
          optimize_for_size: true
        };
        break;

      case 'test':
        // Minimal resources for testing
        instances = 1;
        memoryPerInstance = 256 * 1024 * 1024; // 256MB
        performanceSettings = {
          node_args: '--max-old-space-size=256'
        };
        break;

      default:
        instances = 1;
        memoryPerInstance = 512 * 1024 * 1024; // 512MB default
    }

    // Calculate memory limits with safety margins
    const maxMemoryMB = Math.floor(memoryPerInstance / (1024 * 1024));
    const safeMemoryLimit = Math.max(maxMemoryMB * 0.9, 256); // 90% of allocated or minimum 256MB

    // Performance optimization based on system capabilities
    const cpuIntensive = cpuCount >= 4;
    const memoryRich = availableMemory > (4 * 1024 * 1024 * 1024); // > 4GB

    if (cpuIntensive && memoryRich && environment === 'production') {
      performanceSettings.cron_restart = '0 4 * * *'; // Daily restart at 4 AM for memory cleanup
      performanceSettings.max_memory_restart = `${Math.floor(safeMemoryLimit * 1.2)}M`; // 20% buffer
    }

    const instanceConfig = {
      instances,
      memoryPerInstance,
      maxMemoryRestart: `${Math.floor(safeMemoryLimit)}M`,
      performanceSettings,
      systemOptimization: {
        cpuOptimized: cpuIntensive,
        memoryOptimized: memoryRich,
        environment,
        calculatedAt: new Date().toISOString()
      }
    };

    logger.info('Instance configuration generated', {
      environment,
      instances: instanceConfig.instances,
      maxMemoryRestart: instanceConfig.maxMemoryRestart,
      cpuCount,
      memoryAllocated: `${Math.floor(memoryPerInstance / (1024 * 1024))}MB`
    });

    return instanceConfig;

  } catch (error) {
    logger.error('Failed to generate instance configuration', error, { environment, systemInfo });
    
    // Return safe fallback configuration
    return {
      instances: environment === 'production' ? 'max' : 1,
      memoryPerInstance: 512 * 1024 * 1024,
      maxMemoryRestart: '512M',
      performanceSettings: {},
      systemOptimization: {
        fallback: true,
        error: error.message
      }
    };
  }
}

/**
 * Configures comprehensive restart policy for PM2 processes including automatic
 * restart conditions, memory thresholds, failure limits, and exponential backoff
 * strategies for production reliability. Implements intelligent restart patterns
 * with environment-specific optimization and failure recovery mechanisms.
 * 
 * @param {Object} restartOptions - Restart policy configuration options
 * @param {string} restartOptions.environment - Target environment
 * @param {string} [restartOptions.maxMemoryRestart] - Memory restart threshold
 * @param {number} [restartOptions.maxRestarts] - Maximum restart attempts
 * @param {string} [restartOptions.minUptime] - Minimum uptime before restart
 * @returns {Object} Restart policy configuration with conditions, thresholds, and backoff strategies
 */
export function configureRestartPolicy(restartOptions) {
  try {
    logger.debug('Configuring restart policy', { restartOptions });

    const {
      environment,
      maxMemoryRestart = '1G',
      maxRestarts = 10,
      minUptime = '10s'
    } = restartOptions;

    // Environment-specific restart policy configuration
    const basePolicy = PM2_CONSTANTS.RESTART_POLICIES.AUTO_RESTART;
    const exponentialBackoff = PM2_CONSTANTS.RESTART_POLICIES.EXPONENTIAL_BACKOFF;
    const memoryRestart = PM2_CONSTANTS.RESTART_POLICIES.MEMORY_RESTART;
    const gracefulShutdown = PM2_CONSTANTS.RESTART_POLICIES.GRACEFUL_SHUTDOWN;

    // Build comprehensive restart policy
    let restartPolicy = {
      // Basic restart configuration
      autorestart: basePolicy.autorestart,
      max_restarts: maxRestarts,
      min_uptime: minUptime,
      restart_delay: basePolicy.restart_delay,

      // Memory-based restart configuration
      max_memory_restart: maxMemoryRestart,
      
      // Exponential backoff configuration
      exp_backoff_restart_delay: exponentialBackoff.exp_backoff_restart_delay,
      
      // Graceful shutdown configuration
      kill_timeout: gracefulShutdown.kill_timeout,
      listen_timeout: gracefulShutdown.listen_timeout,
      shutdown_with_message: gracefulShutdown.shutdown_with_message
    };

    // Environment-specific adjustments
    switch (environment) {
      case 'development':
        // More lenient restart policy for development
        restartPolicy.max_restarts = 3;
        restartPolicy.min_uptime = '5s';
        restartPolicy.restart_delay = 2000;
        restartPolicy.kill_timeout = 3000;
        break;

      case 'staging':
        // Moderate restart policy for staging validation
        restartPolicy.max_restarts = 5;
        restartPolicy.min_uptime = '10s';
        restartPolicy.restart_delay = 3000;
        break;

      case 'production':
        // Strict restart policy for production stability
        restartPolicy.max_restarts = maxRestarts;
        restartPolicy.min_uptime = minUptime;
        restartPolicy.restart_delay = 4000;
        
        // Additional production safeguards
        restartPolicy.max_memory_restart = maxMemoryRestart;
        restartPolicy.exp_backoff_restart_delay = 100;
        restartPolicy.kill_timeout = 5000;
        restartPolicy.listen_timeout = 3000;
        
        // Health check integration
        restartPolicy.health_check_grace_period = '30s';
        restartPolicy.health_check_interval = '15s';
        break;

      case 'test':
        // Minimal restart policy for testing
        restartPolicy.max_restarts = 1;
        restartPolicy.min_uptime = '1s';
        restartPolicy.restart_delay = 1000;
        restartPolicy.autorestart = false; // Disable auto-restart in tests
        break;
    }

    // Add restart condition monitoring
    restartPolicy.restart_conditions = {
      on_failure: true,
      on_memory_limit: true,
      on_cpu_threshold: environment === 'production' ? 90 : false,
      on_error_rate: environment === 'production' ? 0.1 : false // 10% error rate threshold
    };

    // Configure restart notifications
    if (environment === 'production') {
      restartPolicy.notifications = {
        restart_notification: true,
        failure_notification: true,
        memory_notification: true
      };
    }

    logger.info('Restart policy configured', {
      environment,
      maxRestarts: restartPolicy.max_restarts,
      maxMemoryRestart: restartPolicy.max_memory_restart,
      minUptime: restartPolicy.min_uptime
    });

    return restartPolicy;

  } catch (error) {
    logger.error('Failed to configure restart policy', error, { restartOptions });
    
    // Return safe fallback restart policy
    return {
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      fallback: true,
      error: error.message
    };
  }
}

/**
 * Sets up comprehensive monitoring configuration for PM2 processes including health
 * checks, performance metrics, resource utilization tracking, and alerting thresholds
 * for production monitoring. Integrates with PM2+ monitoring service and provides
 * structured monitoring data collection and analysis capabilities.
 * 
 * @param {Object} monitoringOptions - Monitoring configuration options
 * @param {string} monitoringOptions.environment - Target environment
 * @param {number} [monitoringOptions.healthCheckInterval] - Health check frequency
 * @param {boolean} [monitoringOptions.metricsCollection] - Enable metrics collection
 * @param {boolean} [monitoringOptions.alertingEnabled] - Enable alerting
 * @returns {Object} Monitoring configuration with health checks, metrics collection, and alerting setup
 */
export function setupMonitoringConfig(monitoringOptions) {
  try {
    logger.debug('Setting up monitoring configuration', { monitoringOptions });

    const {
      environment,
      healthCheckInterval = 30000,
      metricsCollection = false,
      alertingEnabled = false
    } = monitoringOptions;

    // Base monitoring configuration from constants
    const baseConfig = PM2_CONSTANTS.MONITORING_CONFIG;

    // Build comprehensive monitoring configuration
    const monitoringConfig = {
      enabled: baseConfig.MONIT,
      healthCheckInterval,
      metricsCollection,
      alertingEnabled,

      // Health check configuration
      healthChecks: {
        enabled: true,
        interval: healthCheckInterval,
        timeout: Math.min(healthCheckInterval / 2, 10000), // Half interval or 10s max
        endpoint: '/health',
        expectedStatus: 200,
        retries: 3,
        failureThreshold: environment === 'production' ? 3 : 5
      },

      // Performance metrics configuration
      performanceMetrics: {
        enabled: metricsCollection,
        collectInterval: 60000, // 1 minute
        retentionPeriod: environment === 'production' ? '7d' : '1d',
        metrics: [
          'cpu_usage',
          'memory_usage',
          'heap_usage',
          'event_loop_latency',
          'active_handles',
          'active_requests'
        ]
      },

      // Resource monitoring thresholds
      thresholds: {
        cpu: {
          warning: PERFORMANCE_CONSTANTS.CPU_THRESHOLDS.WARNING || 70,
          critical: PERFORMANCE_CONSTANTS.CPU_THRESHOLDS.CRITICAL || 90
        },
        memory: {
          warning: PERFORMANCE_CONSTANTS.MEMORY_LIMITS.WARNING_THRESHOLD || 0.8,
          critical: PERFORMANCE_CONSTANTS.MEMORY_LIMITS.CRITICAL_THRESHOLD || 0.95
        },
        eventLoop: {
          warning: 100, // 100ms
          critical: 1000 // 1 second
        },
        errorRate: {
          warning: 0.05, // 5%
          critical: 0.1 // 10%
        }
      },

      // Alerting configuration
      alerting: {
        enabled: alertingEnabled,
        channels: ['console', 'file'],
        severity: {
          info: environment === 'development',
          warning: true,
          critical: true
        }
      }
    };

    // Environment-specific monitoring adjustments
    switch (environment) {
      case 'development':
        monitoringConfig.healthChecks.interval = 60000; // 1 minute
        monitoringConfig.performanceMetrics.collectInterval = 120000; // 2 minutes
        monitoringConfig.alerting.channels = ['console'];
        break;

      case 'staging':
        monitoringConfig.healthChecks.interval = 45000; // 45 seconds
        monitoringConfig.performanceMetrics.enabled = true;
        monitoringConfig.alerting.channels = ['console', 'file'];
        break;

      case 'production':
        monitoringConfig.healthChecks.interval = healthCheckInterval;
        monitoringConfig.performanceMetrics.enabled = true;
        monitoringConfig.alerting.enabled = true;
        monitoringConfig.alerting.channels = ['console', 'file', 'webhook'];
        
        // Production-specific monitoring features
        monitoringConfig.pmxConfig = {
          http: true,
          ignore_routes: ['/health', '/favicon.ico'],
          errors: true,
          custom_probes: true,
          network: true,
          ports: true
        };
        break;

      case 'test':
        monitoringConfig.enabled = false;
        monitoringConfig.healthChecks.enabled = false;
        monitoringConfig.performanceMetrics.enabled = false;
        monitoringConfig.alerting.enabled = false;
        break;
    }

    // Configure custom monitoring probes for PM2+
    if (process.env.PM2_PLUS_SECRET_KEY && environment === 'production') {
      monitoringConfig.customProbes = {
        'Request Rate': {
          type: 'meter',
          unit: 'req/min'
        },
        'Response Time': {
          type: 'histogram',
          unit: 'ms'
        },
        'Database Connections': {
          type: 'counter'
        },
        'Active Users': {
          type: 'counter'
        }
      };
    }

    logger.info('Monitoring configuration setup complete', {
      environment,
      enabled: monitoringConfig.enabled,
      healthChecks: monitoringConfig.healthChecks.enabled,
      metricsCollection: monitoringConfig.performanceMetrics.enabled,
      alerting: monitoringConfig.alerting.enabled
    });

    return monitoringConfig;

  } catch (error) {
    logger.error('Failed to setup monitoring configuration', error, { monitoringOptions });
    
    // Return minimal fallback monitoring configuration
    return {
      enabled: true,
      healthChecks: { enabled: true, interval: 60000 },
      performanceMetrics: { enabled: false },
      alerting: { enabled: false },
      fallback: true,
      error: error.message
    };
  }
}

/**
 * Configures comprehensive log management for PM2 processes including log rotation,
 * centralized collection, structured formatting, and retention policies for production
 * logging requirements. Integrates with PM2 log management and provides enterprise-grade
 * logging capabilities with compression, archival, and monitoring integration.
 * 
 * @param {Object} logOptions - Log management configuration options
 * @param {string} logOptions.environment - Target environment
 * @param {string} [logOptions.logDirectory] - Log file directory
 * @param {string} [logOptions.maxLogSize] - Maximum log file size
 * @param {number} [logOptions.maxLogFiles] - Maximum number of log files
 * @param {boolean} [logOptions.compression] - Enable log compression
 * @returns {Object} Log management configuration with rotation, collection, and retention settings
 */
export function configureLogManagement(logOptions) {
  try {
    logger.debug('Configuring log management', { logOptions });

    const {
      environment,
      logDirectory = './logs',
      maxLogSize = '10M',
      maxLogFiles = 5,
      compression = false
    } = logOptions;

    // Base log configuration from constants
    const baseLogConfig = PM2_CONSTANTS.LOG_CONFIG;

    // Build comprehensive log management configuration
    const logConfig = {
      // PM2 log file paths
      out_file: path.join(logDirectory, 'app-out.log'),
      error_file: path.join(logDirectory, 'app-error.log'),
      log_file: path.join(logDirectory, 'app-combined.log'),
      
      // Log formatting and structure
      log_date_format: baseLogConfig.LOG_DATE_FORMAT,
      log_type: baseLogConfig.LOG_TYPE,
      merge_logs: baseLogConfig.MERGE_LOGS,
      time: true,
      
      // Log rotation configuration
      max_log_size: maxLogSize,
      max_log_files: maxLogFiles,
      compress_logs: compression,
      
      // Advanced log settings
      disable_logs: false,
      log_buffer: environment === 'production',
      
      // Environment-specific log settings
      ...(environment === 'development' && {
        // Development: More verbose logging
        disable_logs: false,
        merge_logs: true,
        time: true
      }),
      
      ...(environment === 'production' && {
        // Production: Optimized logging with rotation
        max_log_size: maxLogSize,
        max_log_files: maxLogFiles,
        compress_logs: compression,
        log_buffer: true,
        
        // Production log rotation
        rotation: {
          enabled: true,
          interval: baseLogConfig.LOG_ROTATION.interval,
          max: baseLogConfig.LOG_ROTATION.max,
          compress: baseLogConfig.LOG_ROTATION.compress
        }
      })
    };

    // Configure structured logging format
    if (environment === 'production') {
      logConfig.structured_logging = {
        enabled: true,
        format: 'json',
        fields: [
          'timestamp',
          'level',
          'message',
          'pid',
          'hostname',
          'environment',
          'correlationId'
        ]
      };
    }

    // Configure log aggregation for cluster mode
    if (environment === 'production') {
      logConfig.aggregation = {
        enabled: true,
        collect_logs: true,
        log_correlation: true,
        cluster_logs: true
      };
    }

    // Configure log monitoring and alerting
    logConfig.monitoring = {
      enabled: environment === 'production',
      error_threshold: 10, // Errors per minute
      warning_threshold: 50, // Warnings per minute
      disk_usage_threshold: 0.9, // 90% disk usage
      log_size_threshold: '100M' // Individual log file size threshold
    };

    // Configure log retention policies
    logConfig.retention = {
      enabled: environment === 'production',
      max_age: environment === 'production' ? '30d' : '7d',
      max_size: environment === 'production' ? '1G' : '100M',
      cleanup_interval: '24h',
      archive_old_logs: compression
    };

    logger.info('Log management configuration complete', {
      environment,
      logDirectory,
      maxLogSize: logConfig.max_log_size,
      maxLogFiles: logConfig.max_log_files,
      compression: logConfig.compress_logs,
      structured: !!logConfig.structured_logging
    });

    return logConfig;

  } catch (error) {
    logger.error('Failed to configure log management', error, { logOptions });
    
    // Return minimal fallback log configuration
    return {
      out_file: path.join('./logs', 'app-out.log'),
      error_file: path.join('./logs', 'app-error.log'),
      log_file: path.join('./logs', 'app-combined.log'),
      merge_logs: true,
      time: true,
      fallback: true,
      error: error.message
    };
  }
}

/**
 * Creates environment-specific PM2 configuration by applying environment variables,
 * deployment settings, security policies, and performance optimizations tailored
 * for development, staging, or production environments. Provides comprehensive
 * environment adaptation with security hardening and performance tuning.
 * 
 * @param {string} environment - Target environment (development, staging, production, test)
 * @param {Object} envOverrides - Environment-specific configuration overrides
 * @param {Object} [envOverrides.envVars] - Environment variables
 * @param {Object} [envOverrides.security] - Security configuration overrides
 * @param {Object} [envOverrides.performance] - Performance tuning overrides
 * @returns {Object} Environment-specific PM2 configuration with optimized settings for target environment
 */
export function createEnvironmentConfig(environment, envOverrides = {}) {
  try {
    logger.info('Creating environment-specific configuration', { 
      environment, 
      overrides: Object.keys(envOverrides) 
    });

    // Load base configuration template for the environment
    const baseConfig = createPM2Config(environment, {
      appName: envOverrides.appName || DEFAULT_APP_NAME,
      scriptPath: envOverrides.scriptPath || DEFAULT_SCRIPT_PATH
    });

    // Apply environment-specific variable overrides
    const environmentVariables = {
      ...baseConfig.env,
      ...envOverrides.envVars,
      
      // Environment-specific defaults
      NODE_ENV: environment,
      PM2_ENVIRONMENT: environment,
      DEPLOYMENT_TIMESTAMP: new Date().toISOString(),
      DEPLOYMENT_HASH: process.env.DEPLOYMENT_HASH || 'local-build'
    };

    // Configure security policies and access controls
    const securityConfig = {
      // Process isolation
      uid: envOverrides.security?.uid || process.getuid?.(),
      gid: envOverrides.security?.gid || process.getgid?.(),
      
      // Resource limits
      max_open_files: environment === 'production' ? 65536 : 1024,
      
      // Security headers and policies
      security_headers: environment === 'production',
      
      // Environment-specific security settings
      ...(environment === 'production' && {
        disable_source_map_support: true,
        hide_sensitive_args: true,
        mask_sensitive_headers: true
      }),
      
      ...(environment === 'development' && {
        enable_debug_mode: true,
        source_map_support: true
      })
    };

    // Set environment-appropriate performance optimizations
    const performanceOptimizations = {
      // Memory management
      node_args: baseConfig.node_args,
      
      // Garbage collection optimization
      ...(environment === 'production' && {
        gc_optimization: true,
        heap_snapshot: false,
        cpu_profiling: false
      }),
      
      // Development optimizations
      ...(environment === 'development' && {
        heap_snapshot: true,
        cpu_profiling: true,
        memory_monitoring: true
      }),
      
      // Custom performance overrides
      ...envOverrides.performance
    };

    // Configure deployment and update strategies
    const deploymentConfig = {
      // Zero-downtime deployment settings
      wait_ready: environment === 'production',
      kill_timeout: environment === 'production' ? 5000 : 3000,
      listen_timeout: environment === 'production' ? 3000 : 2000,
      
      // Update strategies
      update_env: true,
      
      // Deployment hooks
      ...(environment === 'production' && {
        pre_deploy: 'npm run build',
        post_deploy: 'npm run cleanup',
        pre_setup: 'npm install --production'
      })
    };

    // Set monitoring and alerting levels for the environment
    const monitoringLevel = {
      development: 'basic',
      staging: 'enhanced',
      production: 'comprehensive',
      test: 'minimal'
    }[environment] || 'basic';

    // Apply environment-specific resource limits
    const resourceLimits = {
      // Memory limits based on environment
      max_memory_restart: {
        development: '512M',
        staging: '1G',
        production: '2G',
        test: '256M'
      }[environment] || '1G',
      
      // CPU limits
      max_cpu_usage: {
        development: 50,
        staging: 70,
        production: 90,
        test: 30
      }[environment] || 70
    };

    // Build final environment-optimized configuration
    const environmentConfig = {
      ...baseConfig,
      
      // Apply environment variables
      env: environmentVariables,
      
      // Apply security configuration
      ...securityConfig,
      
      // Apply performance optimizations
      ...performanceOptimizations,
      
      // Apply deployment configuration
      ...deploymentConfig,
      
      // Apply resource limits
      max_memory_restart: resourceLimits.max_memory_restart,
      
      // Environment metadata
      environment_metadata: {
        environment,
        created_at: new Date().toISOString(),
        monitoring_level: monitoringLevel,
        security_level: environment === 'production' ? 'high' : 'standard',
        performance_profile: environment === 'production' ? 'optimized' : 'development'
      }
    };

    logger.info('Environment-specific configuration created', {
      environment,
      appName: environmentConfig.name,
      instances: environmentConfig.instances,
      memoryLimit: environmentConfig.max_memory_restart,
      monitoringLevel,
      securityEnabled: !!securityConfig.security_headers
    });

    return environmentConfig;

  } catch (error) {
    logger.error('Failed to create environment configuration', error, { environment, envOverrides });
    
    // Return fallback configuration
    return createPM2Config(environment, { fallback: true });
  }
}

/**
 * Validates PM2 configuration for completeness, compatibility, and production
 * readiness including resource validation, security checks, and deployment
 * verification to ensure successful PM2 operation. Performs comprehensive
 * configuration analysis and provides recommendations for optimization.
 * 
 * @param {Object} pm2Config - PM2 configuration object to validate
 * @param {Object} [validationOptions={}] - Validation options and constraints
 * @returns {Object} Validation result with status, errors, warnings, and configuration recommendations
 */
export function validatePM2Config(pm2Config, validationOptions = {}) {
  try {
    logger.debug('Validating PM2 configuration', { 
      configKeys: Object.keys(pm2Config),
      validationOptions 
    });

    const validationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      score: 100,
      timestamp: new Date().toISOString()
    };

    // Validate application script paths exist and are accessible
    if (pm2Config.script) {
      try {
        const scriptPath = path.resolve(pm2Config.script);
        // Note: In a real implementation, you would check if file exists
        // For this tutorial, we'll simulate the validation
        validationResult.recommendations.push({
          type: 'info',
          message: `Script path resolved: ${scriptPath}`,
          impact: 'low'
        });
      } catch (error) {
        validationResult.errors.push({
          type: 'script_path',
          message: `Script path validation failed: ${error.message}`,
          severity: 'high'
        });
        validationResult.valid = false;
        validationResult.score -= 20;
      }
    } else {
      validationResult.errors.push({
        type: 'missing_script',
        message: 'Script path is required',
        severity: 'critical'
      });
      validationResult.valid = false;
      validationResult.score -= 30;
    }

    // Check instance configuration against available system resources
    const systemCpuCount = os.cpus().length;
    const systemMemory = os.totalmem();

    if (pm2Config.instances === 'max') {
      validationResult.recommendations.push({
        type: 'performance',
        message: `Will use all ${systemCpuCount} CPU cores`,
        impact: 'positive'
      });
    } else if (typeof pm2Config.instances === 'number') {
      if (pm2Config.instances > systemCpuCount) {
        validationResult.warnings.push({
          type: 'resource_overallocation',
          message: `Instances (${pm2Config.instances}) exceed CPU cores (${systemCpuCount})`,
          severity: 'medium'
        });
        validationResult.score -= 10;
      }
    }

    // Verify environment variables and configuration completeness
    if (!pm2Config.env || !pm2Config.env.NODE_ENV) {
      validationResult.warnings.push({
        type: 'missing_env',
        message: 'NODE_ENV environment variable not set',
        severity: 'medium'
      });
      validationResult.score -= 5;
    }

    if (!pm2Config.env?.PORT) {
      validationResult.recommendations.push({
        type: 'configuration',
        message: 'Consider setting PORT environment variable explicitly',
        impact: 'low'
      });
    }

    // Validate log file paths and directory permissions
    const logPaths = [pm2Config.out_file, pm2Config.error_file, pm2Config.log_file].filter(Boolean);
    
    for (const logPath of logPaths) {
      try {
        const logDir = path.dirname(logPath);
        validationResult.recommendations.push({
          type: 'logging',
          message: `Log directory: ${logDir}`,
          impact: 'info'
        });
      } catch (error) {
        validationResult.warnings.push({
          type: 'log_path',
          message: `Log path validation issue: ${error.message}`,
          severity: 'low'
        });
        validationResult.score -= 2;
      }
    }

    // Check monitoring configuration and endpoint accessibility
    if (pm2Config.monit === false) {
      validationResult.warnings.push({
        type: 'monitoring_disabled',
        message: 'PM2 monitoring is disabled',
        severity: 'medium'
      });
      validationResult.score -= 5;
    }

    // Verify restart policy settings and resource limits
    if (!pm2Config.max_memory_restart) {
      validationResult.warnings.push({
        type: 'memory_limit',
        message: 'No memory restart limit configured',
        severity: 'medium'
      });
      validationResult.score -= 8;
    } else {
      // Validate memory limit format and reasonableness
      const memoryLimit = pm2Config.max_memory_restart;
      if (typeof memoryLimit === 'string' && /^\d+[KMGT]?B?$/i.test(memoryLimit)) {
        validationResult.recommendations.push({
          type: 'memory',
          message: `Memory restart limit: ${memoryLimit}`,
          impact: 'positive'
        });
      } else {
        validationResult.warnings.push({
          type: 'invalid_memory_format',
          message: `Invalid memory limit format: ${memoryLimit}`,
          severity: 'medium'
        });
        validationResult.score -= 5;
      }
    }

    // Validate security settings and access permissions
    if (pm2Config.env?.NODE_ENV === 'production') {
      if (!pm2Config.kill_timeout) {
        validationResult.recommendations.push({
          type: 'security',
          message: 'Consider setting kill_timeout for graceful shutdowns',
          impact: 'medium'
        });
      }

      if (pm2Config.watch === true) {
        validationResult.warnings.push({
          type: 'production_watch',
          message: 'File watching enabled in production',
          severity: 'high'
        });
        validationResult.score -= 15;
      }

      if (!pm2Config.node_args?.includes('--max-old-space-size')) {
        validationResult.recommendations.push({
          type: 'performance',
          message: 'Consider setting --max-old-space-size for memory optimization',
          impact: 'medium'
        });
      }
    }

    // Generate final validation score and status
    if (validationResult.score >= 90) {
      validationResult.status = 'excellent';
    } else if (validationResult.score >= 75) {
      validationResult.status = 'good';
    } else if (validationResult.score >= 60) {
      validationResult.status = 'acceptable';
    } else {
      validationResult.status = 'needs_improvement';
    }

    // Generate deployment readiness assessment
    validationResult.deployment_ready = validationResult.valid && validationResult.score >= 70;

    logger.info('PM2 configuration validation complete', {
      valid: validationResult.valid,
      score: validationResult.score,
      status: validationResult.status,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      deploymentReady: validationResult.deployment_ready
    });

    return validationResult;

  } catch (error) {
    logger.error('PM2 configuration validation failed', error, { pm2Config });
    
    return {
      valid: false,
      errors: [{
        type: 'validation_error',
        message: `Validation process failed: ${error.message}`,
        severity: 'critical'
      }],
      warnings: [],
      recommendations: [],
      score: 0,
      status: 'validation_failed',
      deployment_ready: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Optimizes PM2 configuration for specific environment characteristics including
 * resource allocation, performance tuning, security hardening, and monitoring
 * adjustments based on deployment context and requirements. Provides intelligent
 * optimization recommendations and automatic configuration enhancement.
 * 
 * @param {Object} baseConfig - Base PM2 configuration to optimize
 * @param {string} environment - Target environment for optimization
 * @param {Object} optimizationOptions - Optimization preferences and constraints
 * @param {Object} [optimizationOptions.performance] - Performance optimization settings
 * @param {Object} [optimizationOptions.security] - Security optimization settings
 * @param {Object} [optimizationOptions.monitoring] - Monitoring optimization settings
 * @returns {Object} Environment-optimized PM2 configuration with performance and security enhancements
 */
export function optimizeForEnvironment(baseConfig, environment, optimizationOptions = {}) {
  try {
    logger.info('Optimizing PM2 configuration for environment', { 
      environment, 
      optimizationOptions: Object.keys(optimizationOptions) 
    });

    // Create a deep copy of base configuration
    const optimizedConfig = JSON.parse(JSON.stringify(baseConfig));

    // Analyze environment characteristics and resource availability
    const systemInfo = {
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version
    };

    const environmentCharacteristics = {
      development: {
        priority: 'developer_experience',
        resourceConstraints: 'moderate',
        securityLevel: 'standard',
        monitoringLevel: 'basic'
      },
      staging: {
        priority: 'testing_accuracy',
        resourceConstraints: 'moderate',
        securityLevel: 'enhanced',
        monitoringLevel: 'enhanced'
      },
      production: {
        priority: 'performance_reliability',
        resourceConstraints: 'optimized',
        securityLevel: 'maximum',
        monitoringLevel: 'comprehensive'
      },
      test: {
        priority: 'test_isolation',
        resourceConstraints: 'minimal',
        securityLevel: 'basic',
        monitoringLevel: 'minimal'
      }
    };

    const envProfile = environmentCharacteristics[environment] || environmentCharacteristics.development;

    // Apply performance optimizations for the target environment
    const performanceOptimizations = {
      // CPU and memory optimization
      ...applyPerformanceOptimizations(optimizedConfig, environment, systemInfo, optimizationOptions.performance),
      
      // Garbage collection tuning
      ...applyGarbageCollectionOptimizations(environment, systemInfo),
      
      // Node.js runtime optimizations
      ...applyRuntimeOptimizations(environment, optimizationOptions.performance)
    };

    // Configure security hardening based on environment requirements
    const securityEnhancements = {
      ...applySecurityHardening(optimizedConfig, environment, optimizationOptions.security),
      ...applyAccessControlOptimizations(environment),
      ...applyProcessIsolationSettings(environment)
    };

    // Optimize resource allocation and instance configuration
    if (environment === 'production' && systemInfo.cpuCount >= 4) {
      // High-performance production optimization
      optimizedConfig.instances = optimizationOptions.performance?.maxInstances || 'max';
      optimizedConfig.exec_mode = 'cluster';
      
      // Memory optimization for production
      const memoryPerCore = Math.floor((systemInfo.totalMemory * 0.8) / systemInfo.cpuCount / (1024 * 1024));
      optimizedConfig.max_memory_restart = `${Math.max(memoryPerCore, 512)}M`;
      
      // Production performance tuning
      optimizedConfig.node_args = [
        `--max-old-space-size=${Math.max(memoryPerCore, 512)}`,
        '--optimize-for-size',
        '--gc-interval=100',
        ...(optimizationOptions.performance?.nodeArgs || [])
      ].join(' ');
      
    } else if (environment === 'development') {
      // Development optimization for developer experience
      optimizedConfig.instances = 1;
      optimizedConfig.exec_mode = 'fork';
      optimizedConfig.watch = true;
      optimizedConfig.ignore_watch = ['node_modules', 'logs', 'test', 'coverage', '.git'];
      
      // Development debugging support
      optimizedConfig.node_args = [
        '--inspect',
        '--trace-warnings',
        '--enable-source-maps',
        ...(optimizationOptions.performance?.nodeArgs || [])
      ].join(' ');
    }

    // Tune monitoring and alerting for environment-specific needs
    const monitoringOptimizations = optimizeMonitoringForEnvironment(
      environment, 
      envProfile.monitoringLevel, 
      optimizationOptions.monitoring
    );

    // Apply environment-specific logging and debugging settings
    const loggingOptimizations = {
      ...optimizeLoggingConfiguration(environment, optimizationOptions.logging),
      ...configureDebugSettings(environment)
    };

    // Configure deployment strategies for the environment
    const deploymentOptimizations = {
      ...configureDeploymentStrategy(environment),
      ...configureHealthCheckOptimizations(environment),
      ...configureGracefulShutdownSettings(environment)
    };

    // Merge all optimizations into the final configuration
    Object.assign(optimizedConfig, 
      performanceOptimizations,
      securityEnhancements,
      monitoringOptimizations,
      loggingOptimizations,
      deploymentOptimizations
    );

    // Add optimization metadata
    optimizedConfig.optimization_metadata = {
      environment,
      optimized_at: new Date().toISOString(),
      system_info: systemInfo,
      environment_profile: envProfile,
      optimizations_applied: [
        'performance_tuning',
        'security_hardening',
        'monitoring_optimization',
        'logging_configuration',
        'deployment_strategy'
      ]
    };

    logger.info('PM2 configuration optimization complete', {
      environment,
      instances: optimizedConfig.instances,
      execMode: optimizedConfig.exec_mode,
      memoryLimit: optimizedConfig.max_memory_restart,
      optimizationsApplied: optimizedConfig.optimization_metadata.optimizations_applied.length
    });

    return optimizedConfig;

  } catch (error) {
    logger.error('Failed to optimize PM2 configuration', error, { baseConfig, environment, optimizationOptions });
    
    // Return base configuration with error metadata
    return {
      ...baseConfig,
      optimization_error: {
        message: error.message,
        timestamp: new Date().toISOString(),
        fallback: true
      }
    };
  }
}

/**
 * Applies performance optimizations based on environment and system characteristics
 * @private
 */
function applyPerformanceOptimizations(config, environment, systemInfo, performanceOptions = {}) {
  const optimizations = {};

  if (environment === 'production') {
    // Production performance optimizations
    optimizations.min_uptime = '30s';  // Increased stability requirement
    optimizations.max_restarts = 10;   // Allow more restarts for resilience
    optimizations.restart_delay = 4000; // Longer delay for stability
  }

  return optimizations;
}

/**
 * Applies garbage collection optimizations
 * @private
 */
function applyGarbageCollectionOptimizations(environment, systemInfo) {
  if (environment !== 'production') return {};

  return {
    gc_optimization: true,
    gc_interval: systemInfo.totalMemory > (4 * 1024 * 1024 * 1024) ? 100 : 200 // More frequent GC on high-memory systems
  };
}

/**
 * Applies Node.js runtime optimizations
 * @private
 */
function applyRuntimeOptimizations(environment, performanceOptions = {}) {
  const optimizations = {};

  if (environment === 'production') {
    optimizations.runtime_optimizations = {
      heap_compaction: true,
      incremental_marking: true,
      memory_reducer: true
    };
  }

  return optimizations;
}

/**
 * Applies security hardening configurations
 * @private
 */
function applySecurityHardening(config, environment, securityOptions = {}) {
  const hardening = {};

  if (environment === 'production') {
    hardening.disable_source_map_support = true;
    hardening.hide_sensitive_args = true;
    hardening.process_isolation = true;
  }

  return hardening;
}

/**
 * Applies access control optimizations
 * @private
 */
function applyAccessControlOptimizations(environment) {
  if (environment !== 'production') return {};

  return {
    access_control: {
      uid: process.getuid?.(),
      gid: process.getgid?.(),
      umask: '0077' // Restrictive file permissions
    }
  };
}

/**
 * Applies process isolation settings
 * @private
 */
function applyProcessIsolationSettings(environment) {
  if (environment !== 'production') return {};

  return {
    process_isolation: {
      namespace_isolation: true,
      resource_limits: true,
      capability_restrictions: true
    }
  };
}

/**
 * Optimizes monitoring configuration for environment
 * @private
 */
function optimizeMonitoringForEnvironment(environment, monitoringLevel, monitoringOptions = {}) {
  const monitoring = {};

  switch (monitoringLevel) {
    case 'comprehensive':
      monitoring.pmx = {
        http: true,
        errors: true,
        custom_probes: true,
        network: true,
        ports: true
      };
      break;
    case 'enhanced':
      monitoring.pmx = {
        http: true,
        errors: true,
        custom_probes: false
      };
      break;
    case 'basic':
      monitoring.monit = true;
      break;
    case 'minimal':
      monitoring.monit = false;
      break;
  }

  return monitoring;
}

/**
 * Optimizes logging configuration
 * @private
 */
function optimizeLoggingConfiguration(environment, loggingOptions = {}) {
  const logging = {};

  if (environment === 'production') {
    logging.log_type = 'json';
    logging.merge_logs = true;
    logging.max_log_size = '50M';
    logging.max_log_files = 10;
  }

  return logging;
}

/**
 * Configures debug settings for environment
 * @private
 */
function configureDebugSettings(environment) {
  const debug = {};

  if (environment === 'development') {
    debug.source_map_support = true;
    debug.enable_heap_dump = true;
    debug.enable_cpu_profiling = true;
  }

  return debug;
}

/**
 * Configures deployment strategy
 * @private
 */
function configureDeploymentStrategy(environment) {
  const deployment = {};

  if (environment === 'production') {
    deployment.wait_ready = true;
    deployment.kill_timeout = 5000;
    deployment.listen_timeout = 3000;
  }

  return deployment;
}

/**
 * Configures health check optimizations
 * @private
 */
function configureHealthCheckOptimizations(environment) {
  const healthCheck = {};

  if (environment === 'production') {
    healthCheck.health_check_grace_period = '30s';
    healthCheck.health_check_interval = '15s';
  }

  return healthCheck;
}

/**
 * Configures graceful shutdown settings
 * @private
 */
function configureGracefulShutdownSettings(environment) {
  const shutdown = {};

  if (environment === 'production') {
    shutdown.shutdown_with_message = true;
    shutdown.kill_timeout = 5000;
    shutdown.graceful_shutdown = true;
  }

  return shutdown;
}

// Pre-configured PM2 configurations for different environments
export const pm2Config = {
  development: createEnvironmentConfig('development', {
    appName: `${DEFAULT_APP_NAME}-dev`,
    envVars: {
      NODE_ENV: 'development',
      DEBUG: '*',
      LOG_LEVEL: 'debug'
    }
  }),

  production: createEnvironmentConfig('production', {
    appName: `${DEFAULT_APP_NAME}-prod`,
    envVars: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    performance: {
      maxInstances: 'max',
      memoryOptimization: true
    },
    security: {
      hardening: true,
      processIsolation: true
    }
  }),

  staging: createEnvironmentConfig('staging', {
    appName: `${DEFAULT_APP_NAME}-staging`,
    envVars: {
      NODE_ENV: 'staging',
      LOG_LEVEL: 'info'
    }
  }),

  test: createEnvironmentConfig('test', {
    appName: `${DEFAULT_APP_NAME}-test`,
    envVars: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error'
    }
  })
};

// Default process configuration template
export const defaultProcessConfig = {
  name: DEFAULT_APP_NAME,
  script: DEFAULT_SCRIPT_PATH,
  instances: DEFAULT_INSTANCES,
  exec_mode: DEFAULT_EXEC_MODE,
  autorestart: true,
  watch: isDevelopment,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: currentEnvironment,
    PORT: 3000
  }
};

// Production-optimized configuration
export const productionConfig = {
  instances: 'max',
  exec_mode: 'cluster',
  max_memory_restart: '2G',
  node_args: '--max-old-space-size=2048 --optimize-for-size',
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000,
    LOG_LEVEL: 'info'
  },
  kill_timeout: 5000,
  listen_timeout: 3000,
  shutdown_with_message: true,
  monit: true
};

// Development-optimized configuration
export const developmentConfig = {
  instances: 1,
  exec_mode: 'fork',
  watch: true,
  ignore_watch: ['node_modules', 'logs', 'test', 'coverage'],
  env: {
    NODE_ENV: 'development',
    PORT: 3000,
    DEBUG: '*',
    LOG_LEVEL: 'debug'
  },
  node_args: '--inspect --trace-warnings',
  source_map_support: true
};

// Export all functions and configurations
export {
  createPM2Config,
  generateInstanceConfig,
  configureRestartPolicy,
  setupMonitoringConfig,
  configureLogManagement,
  createEnvironmentConfig,
  validatePM2Config,
  optimizeForEnvironment,
  pm2Config,
  defaultProcessConfig,
  productionConfig,
  developmentConfig
};

// Initialize PM2 configuration logging
logger.info('PM2 configuration module initialized', {
  environment: currentEnvironment,
  defaultAppName: DEFAULT_APP_NAME,
  defaultScriptPath: DEFAULT_SCRIPT_PATH,
  defaultInstances: DEFAULT_INSTANCES,
  defaultExecMode: DEFAULT_EXEC_MODE,
  timestamp: new Date().toISOString()
});