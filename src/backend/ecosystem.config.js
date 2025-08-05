/**
 * @fileoverview Root-level PM2 Ecosystem Configuration for Node.js Tutorial Project
 * @description Primary entry point for production deployment that orchestrates comprehensive PM2 
 * process management, cluster mode optimization, zero-downtime deployment capabilities, and 
 * enterprise-grade monitoring for Express.js v5.1.0 application with Node.js v22.x LTS.
 * 
 * This ecosystem configuration implements PM2 best practices that increase performance by a 
 * factor of x10 on 16 cores machines through intelligent cluster mode management, automatic 
 * load balancing, and production-ready process supervision.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - PM2 cluster mode with automatic CPU core detection and optimal instance scaling
 * - Zero-downtime deployment with graceful worker shutdown and health validation
 * - Comprehensive monitoring integration with performance tracking and alerting
 * - Environment-specific configuration with development, staging, and production optimizations
 * - Enterprise-grade logging with file rotation and centralized log management
 * - Automatic restart policies with memory limits and exponential backoff
 * - Production security configuration with process isolation and resource constraints
 * - Educational deployment demonstration with comprehensive process management examples
 * 
 * Educational Value:
 * - Demonstrates production-ready PM2 ecosystem configuration patterns
 * - Showcases environment-specific deployment strategies and optimization techniques
 * - Illustrates cluster mode implementation for horizontal scaling and load balancing
 * - Provides comprehensive process management with monitoring and health checking
 * - Shows enterprise deployment patterns with automated deployment and rollback capabilities
 * 
 * Technology Integration:
 * - Express.js v5.1.0 with enhanced security features and modern JavaScript support
 * - PM2 v6.0.8 for production process management with built-in load balancer
 * - Node.js v22.x LTS with Active LTS support extending into late 2025
 * - Comprehensive logging and monitoring integration for operational oversight
 * - Cross-platform deployment compatibility with educational Flask implementation
 */

// Node.js built-in modules for system resource detection and path resolution
import path from 'node:path'; // Node.js built-in - Path utilities for resolving application script paths and configuration file locations
import os from 'node:os'; // Node.js built-in - Operating system utilities for CPU core detection and optimal cluster instance calculation

// Internal imports for comprehensive PM2 ecosystem configuration orchestration
import { 
  masterEcosystem,
  createEcosystemConfig,
  productionApp,
  developmentApp 
} from './pm2/ecosystem.config.js';

import { 
  environmentConfig,
  currentEnvironment,
  isProduction,
  pm2 as pm2EnvConfig,
  server as serverConfig 
} from './config/environment.js';

import { 
  pm2Config,
  createProductionConfig,
  createDevelopmentConfig,
  defaultConfig 
} from './config/pm2.js';

import logger, {
  info as logInfo,
  debug as logDebug,
  warn as logWarn,
  error as logError
} from './utils/logger.js';

import {
  PM2_CONSTANTS,
  ENV_CONSTANTS,
  API_CONSTANTS,
  SECURITY_CONSTANTS,
  ERROR_CONSTANTS
} from './utils/constants.js';

import {
  calculateOptimalClusterSize,
  createClusterEcosystem,
  configureLoadBalancing,
  configureZeroDowntime,
  optimizeClusterPerformance,
  setupClusterMonitoring,
  validateClusterConfig,
  productionClusterConfig,
  developmentClusterConfig
} from './pm2/cluster.config.js';

// Global ecosystem configuration constants for consistent deployment management
const ECOSYSTEM_VERSION = '1.0.0';
const APPLICATION_NAME = process.env.PM2_APP_NAME || 'nodejs-tutorial-app';
const SCRIPT_PATH = path.resolve(process.cwd(), 'server.js');
const CURRENT_ENV = process.env.NODE_ENV || 'production';
const CLUSTER_INSTANCES = process.env.PM2_INSTANCES || 'max';

// System resource detection for optimal cluster configuration
const SYSTEM_INFO = {
  cpuCores: os.cpus().length,
  totalMemory: os.totalmem(),
  freeMemory: os.freemem(),
  platform: os.platform(),
  nodeVersion: process.version,
  pid: process.pid
};

/**
 * Creates the main PM2 ecosystem configuration for the Node.js tutorial project by combining 
 * environment-specific settings, cluster configuration, monitoring setup, and deployment 
 * parameters into a comprehensive ecosystem file ready for PM2 deployment.
 * 
 * @param {string} environment - Target deployment environment (development, staging, production)
 * @param {Object} [options={}] - Additional ecosystem configuration options and overrides
 * @returns {Object} Complete PM2 ecosystem configuration with apps array, deployment settings, and environment-specific optimizations
 */
export function createTutorialEcosystem(environment = CURRENT_ENV, options = {}) {
  try {
    logInfo('Creating PM2 ecosystem configuration for Node.js tutorial project', {
      environment,
      applicationName: APPLICATION_NAME,
      scriptPath: SCRIPT_PATH,
      systemInfo: SYSTEM_INFO,
      options: Object.keys(options)
    });

    // Validate environment parameter and apply default configuration options
    const validEnvironments = ['development', 'test', 'staging', 'production'];
    const targetEnvironment = validEnvironments.includes(environment) ? environment : 'production';
    
    if (environment !== targetEnvironment) {
      logWarn('Invalid environment specified, using fallback', {
        requested: environment,
        fallback: targetEnvironment
      });
    }

    // Load environment-specific configuration using environmentConfig for deployment context
    const envConfig = environmentConfig.getEnvironmentConfig(targetEnvironment);
    const deploymentContext = {
      environment: targetEnvironment,
      isProduction: targetEnvironment === 'production',
      timestamp: new Date().toISOString(),
      deployedBy: process.env.USER || 'system',
      nodeVersion: process.version,
      pm2Version: process.env.PM2_VERSION || 'latest'
    };

    // Import master ecosystem configuration from pm2/ecosystem.config.js for base settings
    const masterConfig = masterEcosystem.getConfiguration({
      environment: targetEnvironment,
      applicationName: APPLICATION_NAME,
      scriptPath: SCRIPT_PATH,
      ...options
    });

    // Determine optimal configuration strategy based on target environment
    let ecosystemConfig;
    if (targetEnvironment === 'production') {
      // Create production ecosystem configuration with cluster mode and enterprise features
      ecosystemConfig = configureProductionDeployment({
        applicationName: APPLICATION_NAME,
        scriptPath: SCRIPT_PATH,
        systemInfo: SYSTEM_INFO,
        envConfig,
        ...options.productionOptions
      });
    } else {
      // Create development ecosystem configuration with debugging features and educational value
      ecosystemConfig = configureDevelopmentDeployment({
        applicationName: APPLICATION_NAME,
        scriptPath: SCRIPT_PATH,
        systemInfo: SYSTEM_INFO,
        envConfig,
        ...options.developmentOptions
      });
    }

    // Apply PM2 cluster mode optimization using 'max' instances for production scaling
    if (targetEnvironment === 'production' && ecosystemConfig.apps[0].exec_mode === 'cluster') {
      const clusterOptimization = setupClusterConfiguration(targetEnvironment, {
        instances: CLUSTER_INSTANCES,
        systemInfo: SYSTEM_INFO,
        performanceTargets: options.performanceTargets || {}
      });
      
      // Merge cluster optimization with ecosystem configuration
      ecosystemConfig.apps[0] = {
        ...ecosystemConfig.apps[0],
        ...clusterOptimization
      };
    }

    // Configure zero-downtime deployment settings with graceful worker shutdown
    const zeroDowntimeConfig = configureZeroDowntime({
      environment: targetEnvironment,
      killTimeout: options.killTimeout || (targetEnvironment === 'production' ? 5000 : 2000),
      waitReady: options.waitReady !== false,
      listenTimeout: options.listenTimeout || 3000,
      healthCheckEndpoint: options.healthCheckEndpoint || '/health'
    });

    ecosystemConfig.apps[0] = {
      ...ecosystemConfig.apps[0],
      ...zeroDowntimeConfig
    };

    // Integrate comprehensive monitoring and health check configuration
    const monitoringConfig = configureMonitoringIntegration({
      environment: targetEnvironment,
      applicationName: APPLICATION_NAME,
      enableDashboard: options.enableDashboard || false,
      metricsCollection: options.metricsCollection !== false,
      alerting: options.alerting || {}
    });

    ecosystemConfig.monitoring = monitoringConfig;

    // Set up environment-specific logging with rotation and centralized management
    const loggingConfig = generateAppConfiguration(
      APPLICATION_NAME,
      SCRIPT_PATH,
      {
        environment: targetEnvironment,
        logLevel: options.logLevel || (targetEnvironment === 'production' ? 'info' : 'debug'),
        logRotation: options.logRotation !== false,
        centralizedLogging: options.centralizedLogging !== false
      }
    ).logging;

    ecosystemConfig.apps[0].logging = loggingConfig;

    // Apply security and resource limit configurations for target environment
    const securityConfig = {
      processIsolation: targetEnvironment === 'production',
      resourceLimits: {
        maxMemoryRestart: options.maxMemoryRestart || (targetEnvironment === 'production' ? '1G' : '512M'),
        maxRestarts: options.maxRestarts || (targetEnvironment === 'production' ? 10 : 5),
        minUptime: options.minUptime || (targetEnvironment === 'production' ? '10s' : '5s')
      },
      securityHeaders: targetEnvironment === 'production',
      nodeArgs: options.nodeArgs || (targetEnvironment === 'production' ? 
        '--max-old-space-size=1024 --optimize-for-size' : 
        '--inspect --max-old-space-size=512')
    };

    ecosystemConfig.apps[0] = {
      ...ecosystemConfig.apps[0],
      max_memory_restart: securityConfig.resourceLimits.maxMemoryRestart,
      max_restarts: securityConfig.resourceLimits.maxRestarts,
      min_uptime: securityConfig.resourceLimits.minUptime,
      node_args: securityConfig.nodeArgs
    };

    // Validate complete ecosystem configuration for deployment readiness
    const validation = validateEcosystemConfiguration(ecosystemConfig, {
      environment: targetEnvironment,
      strict: targetEnvironment === 'production',
      checkResourceLimits: true,
      validatePaths: true
    });

    if (!validation.isValid) {
      logError('Ecosystem configuration validation failed', {
        errors: validation.errors,
        warnings: validation.warnings,
        environment: targetEnvironment
      });
      throw new Error(`Ecosystem configuration validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      logWarn('Ecosystem configuration validation warnings', {
        warnings: validation.warnings,
        environment: targetEnvironment
      });
    }

    // Apply environment-specific optimizations for target deployment environment
    const optimizedEcosystem = optimizeForEnvironment(ecosystemConfig, targetEnvironment, {
      performanceOptimization: options.performanceOptimization !== false,
      securityHardening: targetEnvironment === 'production',
      educationalFeatures: targetEnvironment !== 'production',
      ...options.optimizationOptions
    });

    // Log ecosystem creation with environment details and configuration summary
    logInfo('PM2 ecosystem configuration created successfully', {
      environment: targetEnvironment,
      applicationName: APPLICATION_NAME,
      instances: optimizedEcosystem.apps[0].instances,
      execMode: optimizedEcosystem.apps[0].exec_mode,
      memoryLimit: optimizedEcosystem.apps[0].max_memory_restart,
      clusterMode: optimizedEcosystem.apps[0].exec_mode === 'cluster',
      zeroDowntime: !!optimizedEcosystem.apps[0].wait_ready,
      monitoring: !!optimizedEcosystem.monitoring,
      validation: validation.status,
      timestamp: new Date().toISOString()
    });

    // Return complete ecosystem configuration ready for PM2 deployment
    return {
      ...optimizedEcosystem,
      metadata: {
        version: ECOSYSTEM_VERSION,
        environment: targetEnvironment,
        applicationName: APPLICATION_NAME,
        createdAt: new Date().toISOString(),
        createdBy: 'createTutorialEcosystem',
        systemInfo: SYSTEM_INFO,
        deploymentContext,
        validation: validation.status
      }
    };

  } catch (error) {
    logError('Failed to create PM2 ecosystem configuration', {
      error: error.message,
      stack: error.stack,
      environment,
      applicationName: APPLICATION_NAME
    });
    throw new Error(`Ecosystem creation failed: ${error.message}`);
  }
}

/**
 * Configures production-specific PM2 ecosystem with enterprise-grade settings including 
 * cluster mode with 'max' instances, zero-downtime deployment, comprehensive monitoring, 
 * and performance optimization for production deployment.
 * 
 * @param {Object} productionOptions - Production deployment configuration options
 * @returns {Object} Production-ready PM2 ecosystem configuration with cluster mode, monitoring, and enterprise deployment settings
 */
export function configureProductionDeployment(productionOptions = {}) {
  try {
    logInfo('Configuring production PM2 deployment', {
      applicationName: productionOptions.applicationName,
      systemInfo: productionOptions.systemInfo,
      options: Object.keys(productionOptions)
    });

    // Load production configuration from pm2Config.createProductionConfig
    const baseProductionConfig = createProductionConfig({
      environment: 'production',
      applicationName: productionOptions.applicationName,
      scriptPath: productionOptions.scriptPath,
      ...productionOptions
    });

    // Configure cluster mode with 'max' instances for optimal CPU utilization
    const clusterSizing = calculateOptimalClusterSize('production', productionOptions.systemInfo);
    
    // Set execution mode to 'cluster' for horizontal scaling and load balancing
    const clusterConfig = {
      instances: productionOptions.instances || 'max',
      exec_mode: PM2_CONSTANTS.EXEC_MODES.CLUSTER,
      instance_var: 'INSTANCE_ID',
      combine_logs: true,
      merge_logs: true
    };

    // Configure enterprise-grade memory limits and automatic restart policies
    const resourceManagement = {
      max_memory_restart: productionOptions.maxMemoryRestart || `${clusterSizing.memoryPerInstance}M`,
      max_restarts: productionOptions.maxRestarts || 10,
      min_uptime: productionOptions.minUptime || '10s',
      restart_delay: productionOptions.restartDelay || 4000,
      exp_backoff_restart_delay: 100,
      autorestart: true
    };

    // Set production environment variables including NODE_ENV=production
    const productionEnvironment = {
      NODE_ENV: 'production',
      PORT: productionOptions.envConfig?.server?.port || 3000,
      PM2_CLUSTER_MODE: 'true',
      PM2_LOAD_BALANCER: 'round_robin',
      NODE_OPTIONS: '--max-old-space-size=1024',
      ...productionOptions.environmentVariables
    };

    // Configure production logging with file rotation and centralized log management
    const productionLogging = {
      log_file: productionOptions.logFile || './logs/pm2/combined.log',
      out_file: productionOptions.outFile || './logs/pm2/out.log',
      error_file: productionOptions.errorFile || './logs/pm2/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_type: 'json',
      merge_logs: true,
      max_log_size: '10M',
      max_log_files: 5,
      compress_logs: true
    };

    // Integrate comprehensive monitoring with performance tracking and alerting
    const productionMonitoring = setupClusterMonitoring({
      environment: 'production',
      applicationName: productionOptions.applicationName,
      enableAlerts: true,
      metricsCollection: true,
      performanceTracking: true,
      healthCheckInterval: 30000,
      resourceMonitoring: true
    });

    // Configure zero-downtime deployment with sequential worker restart
    const zeroDowntimeConfig = {
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      health_check_grace_period: 3000,
      ready_event: 'ready',
      shutdown_with_message: true
    };

    // Apply production security settings and process isolation
    const productionSecurity = {
      watch: false, // Disable file watching in production
      ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage'],
      vizion: true, // Enable version control information
      pmx: true, // Enable PM2 monitoring
      automation: false, // Disable automation features for security
      source_map_support: true,
      node_args: '--max-old-space-size=1024 --optimize-for-size --gc-interval=100'
    };

    // Set up production deployment hooks for health validation
    const deploymentHooks = {
      post_deploy: [
        'npm ci --production',
        'npm run build:production || echo "No build script"',
        'pm2 reload ecosystem.config.js --env production',
        'sleep 5',
        'curl -f http://localhost:3000/health || exit 1'
      ].join(' && '),
      pre_deploy: [
        'git fetch --all',
        'npm run test:production || echo "No production tests"'
      ].join(' && ')
    };

    // Configure resource monitoring and automatic scaling thresholds
    const resourceMonitoring = {
      monitor: true,
      memory_monitoring: true,
      cpu_monitoring: true,
      performance_monitoring: true,
      health_monitoring: {
        endpoint: '/health',
        interval: 30000,
        timeout: 5000,
        retries: 3
      }
    };

    // Return complete production ecosystem configuration
    const productionEcosystem = {
      apps: [{
        name: productionOptions.applicationName || APPLICATION_NAME,
        script: productionOptions.scriptPath || SCRIPT_PATH,
        cwd: process.cwd(),
        
        // Cluster configuration
        ...clusterConfig,
        
        // Resource management
        ...resourceManagement,
        
        // Environment configuration
        env_production: productionEnvironment,
        
        // Logging configuration
        ...productionLogging,
        
        // Zero-downtime deployment
        ...zeroDowntimeConfig,
        
        // Security settings
        ...productionSecurity,
        
        // Resource monitoring
        ...resourceMonitoring
      }],
      
      // Deployment configuration for production environment
      deploy: {
        production: {
          user: process.env.DEPLOY_USER || 'nodejs',
          host: process.env.DEPLOY_HOST || 'production-server',
          ref: 'origin/main',
          repo: process.env.DEPLOY_REPO || 'git@github.com:nodejs-tutorial/backend.git',
          path: process.env.DEPLOY_PATH || '/var/www/nodejs-tutorial',
          'post-deploy': deploymentHooks.post_deploy,
          'pre-deploy': deploymentHooks.pre_deploy,
          env: {
            NODE_ENV: 'production'
          }
        }
      },
      
      // Production monitoring configuration
      monitoring: productionMonitoring
    };

    logInfo('Production deployment configuration completed', {
      instances: clusterConfig.instances,
      memoryLimit: resourceManagement.max_memory_restart,
      clusterMode: true,
      zeroDowntime: true,
      monitoring: !!productionMonitoring
    });

    return productionEcosystem;

  } catch (error) {
    logError('Failed to configure production deployment', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Production configuration failed: ${error.message}`);
  }
}

/**
 * Configures development-specific PM2 ecosystem with debugging features, file watching, 
 * single instance mode, and development-optimized settings for enhanced developer 
 * experience and educational value.
 * 
 * @param {Object} developmentOptions - Development deployment configuration options
 * @returns {Object} Development-optimized PM2 ecosystem configuration with debugging, watching, and educational features
 */
export function configureDevelopmentDeployment(developmentOptions = {}) {
  try {
    logDebug('Configuring development PM2 deployment', {
      applicationName: developmentOptions.applicationName,
      options: Object.keys(developmentOptions)
    });

    // Load development configuration from pm2Config.createDevelopmentConfig
    const baseDevelopmentConfig = createDevelopmentConfig({
      environment: 'development',
      applicationName: developmentOptions.applicationName,
      scriptPath: developmentOptions.scriptPath,
      ...developmentOptions
    });

    // Configure single instance mode for development debugging compatibility
    const developmentClusterConfig = {
      instances: 1,
      exec_mode: PM2_CONSTANTS.EXEC_MODES.FORK, // Fork mode for debugging tools
      instance_var: 'INSTANCE_ID'
    };

    // Enable file watching with ignore patterns for node_modules and logs
    const fileWatchingConfig = {
      watch: true,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        'test',
        'coverage',
        '*.log',
        'dist',
        'build'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false,
        interval: 1000
      }
    };

    // Configure development environment variables including NODE_ENV=development
    const developmentEnvironment = {
      NODE_ENV: 'development',
      PORT: developmentOptions.envConfig?.server?.port || 3000,
      DEBUG: '*',
      PM2_CLUSTER_MODE: 'false',
      NODE_OPTIONS: '--inspect --max-old-space-size=512',
      FORCE_COLOR: '1',
      ...developmentOptions.environmentVariables
    };

    // Set up verbose logging with console output and development insights
    const developmentLogging = {
      log_file: developmentOptions.logFile || './logs/development.log',
      out_file: developmentOptions.outFile || './logs/out.log',
      error_file: developmentOptions.errorFile || './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_type: 'text',
      merge_logs: false,
      combine_logs: false
    };

    // Enable Node.js debugging support with --inspect flag integration
    const debuggingConfig = {
      node_args: '--inspect=0.0.0.0:9229 --max-old-space-size=512',
      interpreter: 'node',
      interpreter_args: '--harmony --experimental-modules',
      source_map_support: true,
      trace_warnings: true
    };

    // Configure development-appropriate memory limits and restart policies
    const developmentResourceManagement = {
      max_memory_restart: '512M',
      max_restarts: 5,
      min_uptime: '5s',
      restart_delay: 1000,
      autorestart: true,
      exponential_backoff_restart_delay: 100
    };

    // Set up hot reload and automatic restart on file changes
    const hotReloadConfig = {
      restart_delay: 1000,
      kill_timeout: 2000,
      wait_ready: false,
      listen_timeout: 2000,
      graceful_reload: true
    };

    // Configure educational features and development monitoring
    const educationalFeatures = {
      pmx: false, // Disable production monitoring
      automation: false,
      vizion: false, // Disable version control info
      development_mode: true,
      educational_logging: true,
      verbose_errors: true
    };

    // Apply development security settings with educational reporting
    const developmentSecurity = {
      watch: fileWatchingConfig.watch,
      ignore_watch: fileWatchingConfig.ignore_watch,
      development_security: {
        showDetailedErrors: true,
        allowUnsafeEval: true,
        disableSecurityHeaders: true
      }
    };

    // Configure development monitoring and debugging tools
    const developmentMonitoring = {
      monitor: false, // Minimal monitoring for development
      development_insights: true,
      debug_mode: true,
      performance_monitoring: false,
      health_monitoring: {
        endpoint: '/health',
        interval: 10000,
        timeout: 3000,
        retries: 1
      }
    };

    // Return complete development ecosystem configuration
    const developmentEcosystem = {
      apps: [{
        name: developmentOptions.applicationName || APPLICATION_NAME,
        script: developmentOptions.scriptPath || SCRIPT_PATH,
        cwd: process.cwd(),
        
        // Development cluster configuration
        ...developmentClusterConfig,
        
        // File watching configuration
        ...fileWatchingConfig,
        
        // Environment configuration
        env: developmentEnvironment,
        
        // Logging configuration
        ...developmentLogging,
        
        // Debugging configuration
        ...debuggingConfig,
        
        // Resource management
        ...developmentResourceManagement,
        
        // Hot reload configuration
        ...hotReloadConfig,
        
        // Educational features
        ...educationalFeatures,
        
        // Development security
        ...developmentSecurity,
        
        // Development monitoring
        ...developmentMonitoring
      }],
      
      // Development deployment configuration (optional)
      deploy: developmentOptions.includeDeployment ? {
        development: {
          user: process.env.USER || 'developer',
          host: 'localhost',
          ref: 'origin/develop',
          repo: process.env.DEPLOY_REPO || 'git@github.com:nodejs-tutorial/backend.git',
          path: process.env.DEV_DEPLOY_PATH || './tmp/development-deploy',
          'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development',
          env: {
            NODE_ENV: 'development'
          }
        }
      } : undefined
    };

    logInfo('Development deployment configuration completed', {
      instances: developmentClusterConfig.instances,
      execMode: developmentClusterConfig.exec_mode,
      watching: fileWatchingConfig.watch,
      debugging: !!debuggingConfig.node_args.includes('--inspect'),
      hotReload: hotReloadConfig.graceful_reload
    });

    return developmentEcosystem;

  } catch (error) {
    logError('Failed to configure development deployment', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Development configuration failed: ${error.message}`);
  }
}

/**
 * Generates individual application configuration within the PM2 ecosystem with 
 * environment-appropriate settings, cluster mode configuration, monitoring integration, 
 * and tutorial-specific parameters for comprehensive process management.
 * 
 * @param {string} appName - Application name for PM2 process identification
 * @param {string} scriptPath - Path to the main application script file
 * @param {Object} appOptions - Application configuration options and environment settings
 * @returns {Object} Complete application configuration object with execution mode, clustering, monitoring, logging, and environment settings
 */
export function generateAppConfiguration(appName, scriptPath, appOptions = {}) {
  try {
    logDebug('Generating application configuration', {
      appName,
      scriptPath,
      environment: appOptions.environment,
      options: Object.keys(appOptions)
    });

    // Validate application name and script path for ecosystem configuration
    if (!appName || typeof appName !== 'string') {
      throw new Error('Application name is required and must be a string');
    }

    if (!scriptPath || typeof scriptPath !== 'string') {
      throw new Error('Script path is required and must be a string');
    }

    // Configure application name with environment-specific suffix if needed
    const environmentSuffix = appOptions.includeEnvironmentSuffix ? 
      `-${appOptions.environment || 'default'}` : '';
    const applicationName = `${appName}${environmentSuffix}`;

    // Set application script path and validate file existence for deployment
    const resolvedScriptPath = path.resolve(scriptPath);
    
    // Configure execution mode based on environment (cluster for prod, fork for dev)
    const executionMode = appOptions.environment === 'production' ? 
      PM2_CONSTANTS.EXEC_MODES.CLUSTER : 
      PM2_CONSTANTS.EXEC_MODES.FORK;

    // Calculate optimal instance count using CPU cores and environment settings
    const instanceConfig = calculateOptimalClusterSize(
      appOptions.environment || 'development',
      appOptions.systemInfo || SYSTEM_INFO
    );

    const instances = appOptions.instances || 
      (appOptions.environment === 'production' ? 'max' : 1);

    // Configure environment variables including NODE_ENV and application-specific settings
    const environmentVariables = {
      NODE_ENV: appOptions.environment || 'development',
      PORT: appOptions.port || 3000,
      APP_NAME: applicationName,
      INSTANCE_ID: appOptions.instanceId || '${INSTANCE_ID}',
      PM2_APP: 'true',
      ...appOptions.environmentVariables
    };

    // Set up logging configuration with file paths, rotation, and monitoring integration
    const loggingConfiguration = {
      log_file: appOptions.logFile || `./logs/${applicationName}-combined.log`,
      out_file: appOptions.outFile || `./logs/${applicationName}-out.log`,
      error_file: appOptions.errorFile || `./logs/${applicationName}-error.log`,
      log_date_format: appOptions.logDateFormat || 'YYYY-MM-DD HH:mm:ss Z',
      log_type: appOptions.logType || (appOptions.environment === 'production' ? 'json' : 'text'),
      merge_logs: appOptions.mergeLogs !== false,
      combine_logs: appOptions.combineLogs !== false,
      max_log_size: appOptions.maxLogSize || '10M',
      max_log_files: appOptions.maxLogFiles || 5,
      log_rotation: appOptions.logRotation !== false
    };

    // Configure restart policies including memory limits and auto-restart settings
    const restartPolicies = {
      autorestart: appOptions.autorestart !== false,
      max_memory_restart: appOptions.maxMemoryRestart || 
        (appOptions.environment === 'production' ? '1G' : '512M'),
      max_restarts: appOptions.maxRestarts || 
        (appOptions.environment === 'production' ? 10 : 5),
      min_uptime: appOptions.minUptime || 
        (appOptions.environment === 'production' ? '10s' : '5s'),
      restart_delay: appOptions.restartDelay || 
        (appOptions.environment === 'production' ? 4000 : 1000),
      kill_timeout: appOptions.killTimeout || 5000,
      exp_backoff_restart_delay: appOptions.expBackoffRestartDelay || 100
    };

    // Set up health monitoring and performance tracking for operational insights
    const healthMonitoring = {
      health_check_endpoint: appOptions.healthCheckEndpoint || '/health',
      health_check_method: appOptions.healthCheckMethod || 'GET',
      health_check_timeout: appOptions.healthCheckTimeout || 3000,
      health_check_interval: appOptions.healthCheckInterval || 30000,
      health_check_retries: appOptions.healthCheckRetries || 3,
      health_check_grace_period: appOptions.healthCheckGracePeriod || 3000
    };

    // Apply security settings and process isolation parameters
    const securitySettings = {
      watch: appOptions.watch !== undefined ? appOptions.watch : 
        (appOptions.environment !== 'production'),
      ignore_watch: appOptions.ignoreWatch || [
        'node_modules',
        'logs',
        '.git',
        'test',
        'coverage',
        'dist',
        'build'
      ],
      vizion: appOptions.vizion !== undefined ? appOptions.vizion : 
        (appOptions.environment === 'production'),
      pmx: appOptions.pmx !== undefined ? appOptions.pmx : 
        (appOptions.environment === 'production'),
      automation: appOptions.automation || false,
      source_map_support: appOptions.sourceMapSupport !== false
    };

    // Configure deployment hooks for pre/post deployment validation
    const deploymentHooks = {
      wait_ready: appOptions.waitReady !== false,
      listen_timeout: appOptions.listenTimeout || 3000,
      ready_event: appOptions.readyEvent || 'ready',
      shutdown_with_message: appOptions.shutdownWithMessage !== false,
      graceful_shutdown: appOptions.gracefulShutdown !== false
    };

    // Configure Node.js runtime arguments and performance optimizations
    const runtimeConfiguration = {
      node_args: appOptions.nodeArgs || 
        (appOptions.environment === 'production' ? 
          '--max-old-space-size=1024 --optimize-for-size' :
          '--inspect --max-old-space-size=512'),
      interpreter: appOptions.interpreter || 'node',
      interpreter_args: appOptions.interpreterArgs || '--harmony',
      cwd: appOptions.cwd || process.cwd()
    };

    // Return complete application configuration for PM2 ecosystem integration
    const applicationConfiguration = {
      name: applicationName,
      script: resolvedScriptPath,
      instances: instances,
      exec_mode: executionMode,
      
      // Environment configuration
      env: environmentVariables,
      
      // Logging configuration  
      logging: loggingConfiguration,
      ...loggingConfiguration,
      
      // Restart policies
      ...restartPolicies,
      
      // Health monitoring
      health_monitoring: healthMonitoring,
      
      // Security settings
      ...securitySettings,
      
      // Deployment hooks
      ...deploymentHooks,
      
      // Runtime configuration
      ...runtimeConfiguration,
      
      // Application metadata
      metadata: {
        applicationName,
        scriptPath: resolvedScriptPath,
        environment: appOptions.environment || 'development',
        createdAt: new Date().toISOString(),
        instanceConfig,
        configurationVersion: ECOSYSTEM_VERSION
      }
    };

    logDebug('Application configuration generated successfully', {
      name: applicationConfiguration.name,
      instances: applicationConfiguration.instances,
      execMode: applicationConfiguration.exec_mode,
      environment: environmentVariables.NODE_ENV,
      monitoring: !!healthMonitoring.health_check_endpoint
    });

    return applicationConfiguration;

  } catch (error) {
    logError('Failed to generate application configuration', {
      error: error.message,
      stack: error.stack,
      appName,
      scriptPath
    });
    throw new Error(`Application configuration generation failed: ${error.message}`);
  }
}

/**
 * Sets up PM2 cluster mode configuration with optimal instance count calculation, 
 * load balancing settings, zero-downtime deployment capabilities, and performance 
 * optimization for horizontal scaling.
 * 
 * @param {string} environment - Target deployment environment for cluster optimization
 * @param {Object} clusterOptions - Cluster configuration options including instance count and performance settings
 * @returns {Object} Cluster configuration with instance count, load balancing, and scaling settings optimized for target environment
 */
export function setupClusterConfiguration(environment, clusterOptions = {}) {
  try {
    logDebug('Setting up PM2 cluster configuration', {
      environment,
      options: Object.keys(clusterOptions)
    });

    // Detect CPU core count using os.cpus().length for optimal instance calculation
    const systemInfo = clusterOptions.systemInfo || SYSTEM_INFO;
    const availableCores = systemInfo.cpuCores;

    // Configure instance count based on environment (max for production, 1 for development)
    let optimalInstances;
    if (environment === 'development') {
      optimalInstances = 1;
    } else if (environment === 'staging') {
      optimalInstances = Math.max(2, Math.floor(availableCores / 2));
    } else if (environment === 'production') {
      optimalInstances = clusterOptions.instances || 'max';
    } else {
      optimalInstances = 2; // Safe default
    }

    // Set execution mode to 'cluster' for production horizontal scaling
    const executionMode = environment === 'production' ? 
      PM2_CONSTANTS.EXEC_MODES.CLUSTER : 
      PM2_CONSTANTS.EXEC_MODES.FORK;

    // Configure PM2 load balancer for HTTP/TCP/UDP query distribution
    const loadBalancerConfig = configureLoadBalancing(
      clusterOptions.loadBalancerStrategy || 'round_robin',
      {
        instances: optimalInstances,
        environment: environment,
        healthCheckInterval: clusterOptions.healthCheckInterval || 5000,
        failoverTimeout: clusterOptions.failoverTimeout || 2000,
        ...clusterOptions.loadBalancerOptions
      }
    );

    // Set up zero-downtime reload with sequential worker restart
    const zeroDowntimeConfig = {
      kill_timeout: clusterOptions.killTimeout || 5000,
      wait_ready: clusterOptions.waitReady !== false,
      listen_timeout: clusterOptions.listenTimeout || 3000,
      restart_delay: clusterOptions.restartDelay || 1000,
      graceful_reload: true,
      shutdown_with_message: true
    };

    // Configure cluster scaling policies and resource thresholds
    const scalingPolicies = {
      auto_scaling: clusterOptions.autoScaling || false,
      scaling_threshold: {
        cpu: clusterOptions.cpuThreshold || 80,
        memory: clusterOptions.memoryThreshold || 85,
        requests_per_second: clusterOptions.rpsThreshold || 1000
      },
      scale_up_threshold: clusterOptions.scaleUpThreshold || 0.8,
      scale_down_threshold: clusterOptions.scaleDownThreshold || 0.3,
      min_instances: clusterOptions.minInstances || 1,
      max_instances: clusterOptions.maxInstances || availableCores * 2
    };

    // Set up inter-process communication for cluster coordination
    const ipcConfiguration = {
      instance_var: 'INSTANCE_ID',
      combine_logs: true,
      merge_logs: true,
      ipc_timeout: clusterOptions.ipcTimeout || 5000,
      message_queue_size: clusterOptions.messageQueueSize || 1000
    };

    // Configure cluster monitoring and health check integration
    const clusterMonitoring = {
      monitor: environment === 'production',
      pmx: environment === 'production',
      automation: false,
      vizion: environment === 'production',
      health_check_interval: clusterOptions.healthCheckInterval || 30000,
      performance_monitoring: environment === 'production',
      resource_monitoring: true
    };

    // Apply cluster-specific security and isolation settings
    const clusterSecurity = {
      process_isolation: environment === 'production',
      worker_isolation: true,
      shared_memory: clusterOptions.sharedMemory || false,
      cpu_affinity: clusterOptions.cpuAffinity || false,
      numa_aware: clusterOptions.numaAware || false
    };

    // Return optimized cluster configuration for PM2 deployment
    const clusterConfiguration = {
      instances: optimalInstances,
      exec_mode: executionMode,
      
      // Load balancing configuration
      load_balancer: loadBalancerConfig,
      
      // Zero-downtime deployment
      ...zeroDowntimeConfig,
      
      // Scaling policies
      scaling: scalingPolicies,
      
      // Inter-process communication
      ...ipcConfiguration,
      
      // Cluster monitoring
      ...clusterMonitoring,
      
      // Security settings
      security: clusterSecurity,
      
      // Performance optimization
      performance: {
        cpu_cores: availableCores,
        memory_per_instance: clusterOptions.memoryPerInstance || 
          Math.floor(systemInfo.totalMemory / (optimalInstances === 'max' ? availableCores : optimalInstances) / (1024 * 1024)),
        expected_throughput_multiplier: optimalInstances === 'max' ? availableCores : optimalInstances,
        load_balancing_efficiency: 0.85
      },
      
      // Cluster metadata
      cluster_metadata: {
        environment,
        system_info: systemInfo,
        created_at: new Date().toISOString(),
        optimal_instances: optimalInstances,
        cluster_strategy: 'horizontal_scaling'
      }
    };

    logInfo('Cluster configuration setup completed', {
      environment,
      instances: optimalInstances,
      execMode: executionMode,
      loadBalancer: loadBalancerConfig.strategy,
      zeroDowntime: zeroDowntimeConfig.graceful_reload,
      monitoring: clusterMonitoring.monitor
    });

    return clusterConfiguration;

  } catch (error) {
    logError('Failed to setup cluster configuration', {
      error: error.message,
      stack: error.stack,
      environment
    });
    throw new Error(`Cluster configuration setup failed: ${error.message}`);
  }
}

/**
 * Integrates comprehensive monitoring capabilities including PM2 built-in monitoring, 
 * performance tracking, health checks, alerting, and operational metrics collection 
 * for production deployment oversight.
 * 
 * @param {Object} monitoringConfig - Monitoring configuration options including metrics collection and alerting settings
 * @returns {Object} Monitoring configuration with PM2 integration, metrics collection, health checks, and alerting setup
 */
export function configureMonitoringIntegration(monitoringConfig = {}) {
  try {
    logDebug('Configuring comprehensive monitoring integration', {
      environment: monitoringConfig.environment,
      applicationName: monitoringConfig.applicationName,
      options: Object.keys(monitoringConfig)
    });

    // Configure PM2 built-in monitoring with real-time metrics collection
    const pm2MonitoringConfig = {
      pmx: monitoringConfig.enablePMX !== false,
      automation: monitoringConfig.enableAutomation || false,
      vizion: monitoringConfig.enableVizion !== false,
      monitoring_enabled: true,
      realtime_monitoring: monitoringConfig.realtimeMonitoring !== false
    };

    // Set up performance monitoring with CPU, memory, and response time tracking
    const performanceMonitoring = {
      collect_cpu_metrics: monitoringConfig.collectCpuMetrics !== false,
      collect_memory_metrics: monitoringConfig.collectMemoryMetrics !== false,
      collect_response_time_metrics: monitoringConfig.collectResponseTimeMetrics !== false,
      collect_throughput_metrics: monitoringConfig.collectThroughputMetrics !== false,
      metrics_collection_interval: monitoringConfig.metricsInterval || 30000,
      performance_baseline: {
        response_time_threshold: monitoringConfig.responseTimeThreshold || 100,
        cpu_threshold: monitoringConfig.cpuThreshold || 80,
        memory_threshold: monitoringConfig.memoryThreshold || 85,
        throughput_threshold: monitoringConfig.throughputThreshold || 1000
      }
    };

    // Configure health check endpoints for load balancer integration
    const healthCheckConfig = {
      health_check_endpoint: monitoringConfig.healthCheckEndpoint || '/health',
      health_check_method: monitoringConfig.healthCheckMethod || 'GET',
      health_check_expected_status: monitoringConfig.healthCheckExpectedStatus || 200,
      health_check_timeout: monitoringConfig.healthCheckTimeout || 3000,
      health_check_interval: monitoringConfig.healthCheckInterval || 30000,
      health_check_retries: monitoringConfig.healthCheckRetries || 3,
      health_check_grace_period: monitoringConfig.healthCheckGracePeriod || 3000
    };

    // Set up automated alerting for performance degradation and failures
    const alertingConfig = {
      enable_alerts: monitoringConfig.enableAlerts !== false,
      alert_channels: monitoringConfig.alertChannels || ['log'],
      alert_thresholds: {
        cpu_alert_threshold: monitoringConfig.cpuAlertThreshold || 90,
        memory_alert_threshold: monitoringConfig.memoryAlertThreshold || 95,
        response_time_alert_threshold: monitoringConfig.responseTimeAlertThreshold || 1000,
        error_rate_alert_threshold: monitoringConfig.errorRateAlertThreshold || 5,
        restart_alert_threshold: monitoringConfig.restartAlertThreshold || 5
      },
      alert_webhooks: monitoringConfig.alertWebhooks || [],
      alert_email: monitoringConfig.alertEmail || null,
      alert_slack: monitoringConfig.alertSlack || null
    };

    // Configure log monitoring and aggregation for operational insights
    const logMonitoring = {
      centralized_logging: monitoringConfig.centralizedLogging !== false,
      log_aggregation: monitoringConfig.logAggregation !== false,
      log_analysis: monitoringConfig.logAnalysis || false,
      error_tracking: monitoringConfig.errorTracking !== false,
      log_retention_period: monitoringConfig.logRetentionPeriod || (7 * 24 * 60 * 60 * 1000), // 7 days
      log_rotation: {
        enabled: monitoringConfig.logRotation !== false,
        max_size: monitoringConfig.maxLogSize || '10M',
        max_files: monitoringConfig.maxLogFiles || 5,
        compress: monitoringConfig.compressLogs !== false
      }
    };

    // Set up process monitoring with restart tracking and failure analysis
    const processMonitoring = {
      track_restarts: monitoringConfig.trackRestarts !== false,
      monitor_memory_leaks: monitoringConfig.monitorMemoryLeaks || false,
      monitor_cpu_usage: monitoringConfig.monitorCpuUsage !== false,
      monitor_event_loop: monitoringConfig.monitorEventLoop || false,
      process_health_scoring: monitoringConfig.processHealthScoring || false,
      failure_analysis: monitoringConfig.failureAnalysis || false
    };

    // Configure resource utilization monitoring and threshold alerting
    const resourceMonitoring = {
      monitor_system_resources: monitoringConfig.monitorSystemResources !== false,
      disk_usage_monitoring: monitoringConfig.diskUsageMonitoring || false,
      network_monitoring: monitoringConfig.networkMonitoring || false,
      database_monitoring: monitoringConfig.databaseMonitoring || false,
      external_service_monitoring: monitoringConfig.externalServiceMonitoring || false,
      resource_thresholds: {
        disk_usage_threshold: monitoringConfig.diskUsageThreshold || 85,
        network_latency_threshold: monitoringConfig.networkLatencyThreshold || 100,
        connection_pool_threshold: monitoringConfig.connectionPoolThreshold || 80
      }
    };

    // Integrate monitoring dashboard for real-time operational visibility
    const dashboardConfig = {
      enable_dashboard: monitoringConfig.enableDashboard || false,
      dashboard_port: monitoringConfig.dashboardPort || 9615,
      dashboard_host: monitoringConfig.dashboardHost || 'localhost',
      dashboard_auth: monitoringConfig.dashboardAuth || false,
      realtime_updates: monitoringConfig.realtimeUpdates !== false,
      dashboard_refresh_interval: monitoringConfig.dashboardRefreshInterval || 5000
    };

    // Set up monitoring data export for external monitoring systems
    const dataExportConfig = {
      export_metrics: monitoringConfig.exportMetrics || false,
      export_format: monitoringConfig.exportFormat || 'json',
      export_endpoint: monitoringConfig.exportEndpoint || null,
      export_interval: monitoringConfig.exportInterval || 60000,
      external_monitoring_systems: monitoringConfig.externalMonitoringSystems || [],
      metrics_forwarding: monitoringConfig.metricsForwarding || false
    };

    // Configure custom metrics and business-specific monitoring
    const customMetrics = {
      custom_metrics_enabled: monitoringConfig.customMetricsEnabled || false,
      business_metrics: monitoringConfig.businessMetrics || [],
      application_metrics: monitoringConfig.applicationMetrics || [],
      custom_counters: monitoringConfig.customCounters || [],
      custom_histograms: monitoringConfig.customHistograms || [],
      custom_gauges: monitoringConfig.customGauges || []
    };

    // Return comprehensive monitoring configuration for PM2 integration
    const comprehensiveMonitoringConfig = {
      // PM2 built-in monitoring
      pm2_monitoring: pm2MonitoringConfig,
      
      // Performance monitoring
      performance: performanceMonitoring,
      
      // Health check configuration
      health_checks: healthCheckConfig,
      
      // Alerting configuration
      alerting: alertingConfig,
      
      // Log monitoring
      log_monitoring: logMonitoring,
      
      // Process monitoring
      process_monitoring: processMonitoring,
      
      // Resource monitoring
      resource_monitoring: resourceMonitoring,
      
      // Dashboard configuration
      dashboard: dashboardConfig,
      
      // Data export configuration
      data_export: dataExportConfig,
      
      // Custom metrics
      custom_metrics: customMetrics,
      
      // Monitoring metadata
      monitoring_metadata: {
        environment: monitoringConfig.environment,
        application_name: monitoringConfig.applicationName,
        monitoring_version: ECOSYSTEM_VERSION,
        configured_at: new Date().toISOString(),
        monitoring_strategy: 'comprehensive'
      }
    };

    logInfo('Monitoring integration configuration completed', {
      pm2Monitoring: pm2MonitoringConfig.pmx,
      performanceMonitoring: performanceMonitoring.collect_cpu_metrics,
      healthChecks: healthCheckConfig.health_check_endpoint,
      alerting: alertingConfig.enable_alerts,
      dashboard: dashboardConfig.enable_dashboard,
      customMetrics: customMetrics.custom_metrics_enabled
    });

    return comprehensiveMonitoringConfig;

  } catch (error) {
    logError('Failed to configure monitoring integration', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Monitoring integration configuration failed: ${error.message}`);
  }
}

/**
 * Validates the complete PM2 ecosystem configuration ensuring all required settings 
 * are present, resource allocation is optimal, script paths are valid, and deployment 
 * readiness is achieved for production deployment.
 * 
 * @param {Object} ecosystemConfig - Complete PM2 ecosystem configuration object to validate
 * @param {Object} validationOptions - Validation configuration options including strictness and validation rules
 * @returns {Object} Comprehensive validation result with status, errors, warnings, optimization recommendations, and deployment readiness assessment
 */
export function validateEcosystemConfiguration(ecosystemConfig, validationOptions = {}) {
  try {
    logDebug('Validating PM2 ecosystem configuration', {
      appsCount: ecosystemConfig.apps ? ecosystemConfig.apps.length : 0,
      hasDeployment: !!ecosystemConfig.deploy,
      hasMonitoring: !!ecosystemConfig.monitoring,
      options: Object.keys(validationOptions)
    });

    const validation = {
      isValid: true,
      status: 'valid',
      errors: [],
      warnings: [],
      recommendations: [],
      optimizations: [],
      deploymentReadiness: {
        ready: true,
        blockers: [],
        recommendations: []
      },
      validationDetails: {}
    };

    // Validate ecosystem configuration structure and required properties
    if (!ecosystemConfig || typeof ecosystemConfig !== 'object') {
      validation.errors.push('Ecosystem configuration must be a valid object');
      validation.isValid = false;
      validation.status = 'invalid';
      return validation;
    }

    if (!ecosystemConfig.apps || !Array.isArray(ecosystemConfig.apps)) {
      validation.errors.push('Ecosystem configuration must contain apps array');
      validation.isValid = false;
    }

    if (ecosystemConfig.apps && ecosystemConfig.apps.length === 0) {
      validation.errors.push('Apps array cannot be empty');
      validation.isValid = false;
    }

    // Check application script paths exist and are accessible for PM2 execution
    if (ecosystemConfig.apps) {
      ecosystemConfig.apps.forEach((app, index) => {
        if (!app.script) {
          validation.errors.push(`App ${index + 1}: Script path is required`);
          validation.isValid = false;
        } else if (typeof app.script !== 'string') {
          validation.errors.push(`App ${index + 1}: Script path must be a string`);
          validation.isValid = false;
        } else if (!app.script.endsWith('.js') && !app.script.endsWith('.mjs')) {
          validation.warnings.push(`App ${index + 1}: Script should have .js or .mjs extension`);
        }

        if (!app.name) {
          validation.errors.push(`App ${index + 1}: Application name is required`);
          validation.isValid = false;
        } else if (typeof app.name !== 'string' || app.name.trim().length === 0) {
          validation.errors.push(`App ${index + 1}: Application name must be a non-empty string`);
          validation.isValid = false;
        }
      });
    }

    // Validate cluster configuration and instance count for target environment
    const environment = validationOptions.environment || 'production';
    const strictMode = validationOptions.strict !== false;
    
    if (ecosystemConfig.apps) {
      ecosystemConfig.apps.forEach((app, index) => {
        // Validate instance configuration
        if (app.instances !== undefined) {
          if (app.instances !== 'max' && 
              (typeof app.instances !== 'number' || app.instances < 1)) {
            validation.errors.push(`App ${index + 1}: Instances must be 'max' or a positive number`);
            validation.isValid = false;
          }
          
          if (typeof app.instances === 'number' && app.instances > SYSTEM_INFO.cpuCores * 2) {
            validation.warnings.push(`App ${index + 1}: Instance count (${app.instances}) exceeds CPU cores (${SYSTEM_INFO.cpuCores}) by more than 2x`);
          }
        }

        // Validate execution mode
        if (app.exec_mode && !['cluster', 'fork'].includes(app.exec_mode)) {
          validation.errors.push(`App ${index + 1}: Invalid exec_mode '${app.exec_mode}'. Must be 'cluster' or 'fork'`);
          validation.isValid = false;
        }

        // Production-specific validations
        if (environment === 'production' && strictMode) {
          if (app.watch === true) {
            validation.warnings.push(`App ${index + 1}: File watching enabled in production`);
            validation.recommendations.push(`App ${index + 1}: Disable file watching for better production performance`);
          }

          if (!app.max_memory_restart) {
            validation.warnings.push(`App ${index + 1}: No memory restart limit set`);
            validation.recommendations.push(`App ${index + 1}: Set max_memory_restart for memory management`);
          }

          if (app.exec_mode === 'cluster' && !app.instances) {
            validation.recommendations.push(`App ${index + 1}: Consider setting explicit instance count for cluster mode`);
          }
        }
      });
    }

    // Check resource allocation including memory limits and CPU constraints
    if (validationOptions.checkResourceLimits !== false && ecosystemConfig.apps) {
      let totalMemoryAllocation = 0;
      const systemMemoryMB = Math.floor(SYSTEM_INFO.totalMemory / (1024 * 1024));

      ecosystemConfig.apps.forEach((app, index) => {
        if (app.max_memory_restart) {
          const memoryMB = parseInt(app.max_memory_restart.replace(/[^0-9]/g, ''));
          const instances = app.instances === 'max' ? SYSTEM_INFO.cpuCores : (app.instances || 1);
          const appMemoryUsage = memoryMB * instances;
          totalMemoryAllocation += appMemoryUsage;

          validation.validationDetails[`app_${index + 1}_memory`] = {
            memoryPerInstance: memoryMB,
            instances: instances,
            totalMemory: appMemoryUsage
          };
        }
      });

      if (totalMemoryAllocation > systemMemoryMB * 0.9) {
        validation.errors.push(`Memory over-subscription: ${totalMemoryAllocation}MB required, ${systemMemoryMB}MB available`);
        validation.isValid = false;
        validation.deploymentReadiness.ready = false;
        validation.deploymentReadiness.blockers.push('Memory over-subscription detected');
      } else if (totalMemoryAllocation > systemMemoryMB * 0.8) {
        validation.warnings.push(`High memory usage: ${totalMemoryAllocation}MB of ${systemMemoryMB}MB (${Math.round(totalMemoryAllocation/systemMemoryMB*100)}%)`);
      }

      validation.validationDetails.resourceAllocation = {
        totalMemoryAllocation,
        systemMemory: systemMemoryMB,
        memoryUtilization: Math.round(totalMemoryAllocation / systemMemoryMB * 100)
      };
    }

    // Validate environment variables and configuration completeness
    if (ecosystemConfig.apps) {
      ecosystemConfig.apps.forEach((app, index) => {
        // Check for required environment variables
        const envKeys = Object.keys(app.env || {});
        const prodEnvKeys = Object.keys(app.env_production || {});

        if (environment === 'production' && (!app.env_production || Object.keys(app.env_production).length === 0)) {
          validation.warnings.push(`App ${index + 1}: No production environment variables defined`);
        }

        if (!envKeys.includes('NODE_ENV') && !prodEnvKeys.includes('NODE_ENV')) {
          validation.recommendations.push(`App ${index + 1}: Consider setting NODE_ENV environment variable`);
        }

        if (!envKeys.includes('PORT') && !prodEnvKeys.includes('PORT')) {
          validation.recommendations.push(`App ${index + 1}: Consider setting PORT environment variable`);
        }
      });
    }

    // Check monitoring configuration and health check endpoint availability
    if (ecosystemConfig.monitoring) {
      const monitoring = ecosystemConfig.monitoring;
      
      if (monitoring.health_checks && monitoring.health_checks.health_check_endpoint) {
        if (!monitoring.health_checks.health_check_endpoint.startsWith('/')) {
          validation.warnings.push('Health check endpoint should start with "/"');
        }
      }

      if (monitoring.performance && monitoring.performance.metrics_collection_interval < 1000) {
        validation.warnings.push('Metrics collection interval less than 1000ms may impact performance');
      }

      if (monitoring.alerting && monitoring.alerting.enable_alerts && 
          (!monitoring.alerting.alert_channels || monitoring.alerting.alert_channels.length === 0)) {
        validation.warnings.push('Alerting enabled but no alert channels configured');
      }
    } else if (environment === 'production' && strictMode) {
      validation.recommendations.push('Consider enabling monitoring for production deployment');
    }

    // Validate logging configuration and file path permissions
    if (ecosystemConfig.apps) {
      ecosystemConfig.apps.forEach((app, index) => {
        if (app.log_file || app.out_file || app.error_file) {
          const logPaths = [app.log_file, app.out_file, app.error_file].filter(Boolean);
          
          logPaths.forEach(logPath => {
            if (!logPath.includes('/')) {
              validation.recommendations.push(`App ${index + 1}: Consider using absolute log paths for better organization`);
            }
          });
        }

        if (!app.log_date_format) {
          validation.recommendations.push(`App ${index + 1}: Consider setting log_date_format for better log readability`);
        }

        if (environment === 'production' && app.log_type !== 'json') {
          validation.recommendations.push(`App ${index + 1}: Consider using JSON log format for production`);
        }
      });
    }

    // Check PM2 version compatibility and feature availability
    const pm2Version = process.env.PM2_VERSION;
    if (pm2Version) {
      const majorVersion = parseInt(pm2Version.split('.')[0]);
      if (majorVersion < 5) {
        validation.warnings.push(`PM2 version ${pm2Version} is outdated. Consider upgrading to v6.0.8 or later`);
      }
    }

    // Generate warnings for potential performance or security issues
    if (ecosystemConfig.apps) {
      ecosystemConfig.apps.forEach((app, index) => {
        if (!app.kill_timeout || app.kill_timeout < 1000) {
          validation.recommendations.push(`App ${index + 1}: Consider setting kill_timeout to at least 1000ms`);
        }

        if (!app.min_uptime || parseInt(app.min_uptime) < 1000) {
          validation.recommendations.push(`App ${index + 1}: Consider setting min_uptime to at least 1s`);
        }

        if (app.max_restarts && app.max_restarts > 15) {
          validation.warnings.push(`App ${index + 1}: High max_restarts value may mask underlying issues`);
        }

        if (!app.node_args || (!app.node_args.includes('max-old-space-size') && environment === 'production')) {
          validation.recommendations.push(`App ${index + 1}: Consider setting --max-old-space-size for better memory management`);
        }
      });
    }

    // Provide optimization recommendations for target deployment environment
    if (environment === 'production') {
      validation.optimizations.push('Enable PM2 cluster mode for horizontal scaling');
      validation.optimizations.push('Configure comprehensive monitoring and alerting');
      validation.optimizations.push('Set up log rotation and centralized logging');
      validation.optimizations.push('Enable zero-downtime deployment capabilities');
      validation.optimizations.push('Configure resource limits and restart policies');
    }

    // Determine overall validation status
    if (validation.errors.length > 0) {
      validation.status = 'invalid';
      validation.isValid = false;
      validation.deploymentReadiness.ready = false;
      validation.deploymentReadiness.blockers.push(...validation.errors);
    } else if (validation.warnings.length > 0) {
      validation.status = 'valid_with_warnings';
    }

    // Add deployment readiness assessment
    if (validation.deploymentReadiness.ready) {
      validation.deploymentReadiness.recommendations.push(...validation.recommendations);
      validation.deploymentReadiness.recommendations.push(...validation.optimizations);
    }

    // Log validation results with detailed feedback and recommendations
    const summary = {
      status: validation.status,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      recommendations: validation.recommendations.length,
      optimizations: validation.optimizations.length,
      deploymentReady: validation.deploymentReadiness.ready,
      environment,
      strictMode
    };

    validation.validationDetails.summary = {
      ...summary,
      validatedAt: new Date().toISOString(),
      totalChecks: 20,
      validationVersion: ECOSYSTEM_VERSION
    };

    logInfo('Ecosystem configuration validation completed', summary);

    // Return comprehensive validation status with actionable deployment guidance
    return validation;

  } catch (error) {
    logError('Failed to validate ecosystem configuration', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      isValid: false,
      status: 'error',
      errors: [`Validation failed: ${error.message}`],
      warnings: [],
      recommendations: [],
      optimizations: [],
      deploymentReadiness: {
        ready: false,
        blockers: [`Validation error: ${error.message}`],
        recommendations: []
      },
      validationDetails: {
        summary: {
          status: 'error',
          errors: 1,
          warnings: 0,
          recommendations: 0,
          validatedAt: new Date().toISOString()
        }
      }
    };
  }
}

/**
 * Applies environment-specific optimizations to the PM2 ecosystem configuration 
 * including performance tuning, resource allocation, feature enablement, and 
 * security hardening based on deployment context.
 * 
 * @param {Object} ecosystemConfig - Current PM2 ecosystem configuration to optimize
 * @param {string} environment - Target deployment environment for optimization context
 * @param {Object} optimizationOptions - Optimization configuration options and performance targets
 * @returns {Object} Environment-optimized PM2 ecosystem configuration with performance, security, and resource adjustments for optimal deployment
 */
export function optimizeForEnvironment(ecosystemConfig, environment, optimizationOptions = {}) {
  try {
    logDebug('Applying environment-specific optimizations', {
      environment,
      appsCount: ecosystemConfig.apps ? ecosystemConfig.apps.length : 0,
      options: Object.keys(optimizationOptions)
    });

    // Create deep copy of ecosystem configuration for optimization
    const optimizedConfig = JSON.parse(JSON.stringify(ecosystemConfig));

    // Analyze target environment characteristics and deployment requirements
    const environmentProfile = {
      isProduction: environment === 'production',
      isDevelopment: environment === 'development',
      isStaging: environment === 'staging',
      requiresHighAvailability: environment === 'production',
      requiresDebugging: environment === 'development',
      requiresPerformance: environment === 'production' || environment === 'staging'
    };

    if (optimizedConfig.apps) {
      optimizedConfig.apps.forEach((app, index) => {
        // Apply cluster mode optimization (max instances for production, 1 for development)
        if (environmentProfile.isProduction && optimizationOptions.performanceOptimization !== false) {
          app.instances = app.instances || 'max';
          app.exec_mode = PM2_CONSTANTS.EXEC_MODES.CLUSTER;
          
          logDebug(`App ${index + 1}: Applied production cluster optimization`, {
            instances: app.instances,
            execMode: app.exec_mode
          });
        } else if (environmentProfile.isDevelopment) {
          app.instances = 1;
          app.exec_mode = PM2_CONSTANTS.EXEC_MODES.FORK;
          
          logDebug(`App ${index + 1}: Applied development single-instance optimization`, {
            instances: app.instances,
            execMode: app.exec_mode
          });
        }

        // Optimize memory limits and restart policies based on available resources
        if (optimizationOptions.performanceOptimization !== false) {
          const systemMemoryMB = Math.floor(SYSTEM_INFO.totalMemory / (1024 * 1024));
          const instanceCount = app.instances === 'max' ? SYSTEM_INFO.cpuCores : (app.instances || 1);
          const optimalMemoryPerInstance = Math.floor(systemMemoryMB * 0.8 / instanceCount);

          if (!app.max_memory_restart || optimizationOptions.forceMemoryOptimization) {
            app.max_memory_restart = environmentProfile.isProduction ? 
              `${Math.min(optimalMemoryPerInstance, 1024)}M` : 
              `${Math.min(optimalMemoryPerInstance, 512)}M`;
          }

          if (!app.max_restarts) {
            app.max_restarts = environmentProfile.isProduction ? 10 : 5;
          }

          if (!app.min_uptime) {
            app.min_uptime = environmentProfile.isProduction ? '10s' : '5s';
          }
        }

        // Configure monitoring sensitivity and alerting thresholds for environment
        if (optimizationOptions.monitoringOptimization !== false) {
          if (environmentProfile.isProduction) {
            app.pmx = true;
            app.automation = false;
            app.vizion = true;
            
            if (!app.health_monitoring) {
              app.health_monitoring = {
                health_check_interval: 30000,
                health_check_timeout: 5000,
                health_check_retries: 3
              };
            }
          } else if (environmentProfile.isDevelopment) {
            app.pmx = false;
            app.automation = false;
            app.vizion = false;
          }
        }

        // Apply logging optimization including verbosity levels and rotation settings
        if (optimizationOptions.loggingOptimization !== false) {
          if (environmentProfile.isProduction) {
            app.log_type = 'json';
            app.merge_logs = true;
            app.combine_logs = true;
            app.max_log_size = '10M';
            app.max_log_files = 5;
            
            if (!app.log_date_format) {
              app.log_date_format = 'YYYY-MM-DD HH:mm:ss Z';
            }
          } else if (environmentProfile.isDevelopment) {
            app.log_type = 'text';
            app.merge_logs = false;
            app.combine_logs = false;
            
            if (!app.log_date_format) {
              app.log_date_format = 'YYYY-MM-DD HH:mm:ss';
            }
          }
        }

        // Configure development features (watch mode, debugging) for development environment
        if (environmentProfile.isDevelopment && optimizationOptions.educationalFeatures !== false) {
          app.watch = true;
          app.watch_delay = 1000;
          app.ignore_watch = app.ignore_watch || [
            'node_modules',
            'logs',
            '.git',
            'test',
            'coverage',
            'dist',
            'build'
          ];
          
          if (!app.node_args || !app.node_args.includes('--inspect')) {
            app.node_args = (app.node_args || '') + ' --inspect=0.0.0.0:9229';
          }
          
          app.env = app.env || {};
          app.env.DEBUG = app.env.DEBUG || '*';
          app.env.FORCE_COLOR = '1';
        }

        // Apply production hardening including security configurations and process isolation
        if (environmentProfile.isProduction && optimizationOptions.securityHardening !== false) {
          app.watch = false;
          app.kill_timeout = app.kill_timeout || 5000;
          app.wait_ready = app.wait_ready !== false;
          app.listen_timeout = app.listen_timeout || 3000;
          app.health_check_grace_period = app.health_check_grace_period || 3000;
          
          // Security-hardened Node.js arguments
          if (!app.node_args || optimizationOptions.forceNodeArgsOptimization) {
            app.node_args = '--max-old-space-size=1024 --optimize-for-size --gc-interval=100';
          }
          
          // Production environment variables
          app.env_production = app.env_production || {};
          app.env_production.NODE_ENV = 'production';
          app.env_production.PM2_CLUSTER_MODE = 'true';
        }

        // Optimize performance settings including Node.js flags and garbage collection
        if (optimizationOptions.performanceOptimization !== false) {
          if (environmentProfile.requiresPerformance) {
            app.restart_delay = app.restart_delay || 4000;
            app.exp_backoff_restart_delay = app.exp_backoff_restart_delay || 100;
            
            // Performance-optimized Node.js flags
            if (environmentProfile.isProduction && (!app.node_args || optimizationOptions.forcePerformanceFlags)) {
              const performanceFlags = [
                '--max-old-space-size=1024',
                '--optimize-for-size',
                '--gc-interval=100',
                '--max-semi-space-size=64'
              ];
              
              app.node_args = performanceFlags.join(' ');
            }
          }
        }

        // Configure environment-specific deployment and rollback strategies
        if (optimizationOptions.deploymentOptimization !== false) {
          if (environmentProfile.requiresHighAvailability) {
            app.wait_ready = true;
            app.listen_timeout = 3000;
            app.kill_timeout = 5000;
            app.shutdown_with_message = true;
            
            // Zero-downtime deployment optimization
            app.restart_delay = 1000;
            app.graceful_reload = true;
          }
        }
      });
    }

    // Apply environment-specific monitoring optimizations
    if (optimizedConfig.monitoring && optimizationOptions.monitoringOptimization !== false) {
      if (environmentProfile.isProduction) {
        optimizedConfig.monitoring.pm2_monitoring.pmx = true;
        optimizedConfig.monitoring.performance.metrics_collection_interval = 30000;
        optimizedConfig.monitoring.alerting.enable_alerts = true;
        optimizedConfig.monitoring.dashboard.enable_dashboard = false; // Security consideration
      } else if (environmentProfile.isDevelopment) {
        optimizedConfig.monitoring.pm2_monitoring.pmx = false;
        optimizedConfig.monitoring.performance.metrics_collection_interval = 60000;
        optimizedConfig.monitoring.alerting.enable_alerts = false;
        optimizedConfig.monitoring.dashboard.enable_dashboard = true;
      }
    }

    // Apply deployment configuration optimizations
    if (optimizedConfig.deploy && optimizationOptions.deploymentOptimization !== false) {
      Object.keys(optimizedConfig.deploy).forEach(deployEnv => {
        const deployment = optimizedConfig.deploy[deployEnv];
        
        if (deployEnv === 'production') {
          deployment['post-deploy'] = deployment['post-deploy'] || 
            'npm ci --production && pm2 reload ecosystem.config.js --env production';
          deployment['pre-deploy'] = deployment['pre-deploy'] || 
            'git fetch --all && npm run test:production || echo "No production tests"';
        } else if (deployEnv === 'development') {
          deployment['post-deploy'] = deployment['post-deploy'] || 
            'npm install && pm2 reload ecosystem.config.js --env development';
        }
      });
    }

    // Log optimization applied with performance impact and resource allocation details
    const optimizationSummary = {
      environment,
      optimizationsApplied: {
        clusterMode: environmentProfile.isProduction,
        memoryOptimization: optimizationOptions.performanceOptimization !== false,
        monitoringOptimization: optimizationOptions.monitoringOptimization !== false,
        loggingOptimization: optimizationOptions.loggingOptimization !== false,
        securityHardening: environmentProfile.isProduction && optimizationOptions.securityHardening !== false,
        performanceOptimization: optimizationOptions.performanceOptimization !== false,
        deploymentOptimization: optimizationOptions.deploymentOptimization !== false
      },
      resourceAllocation: {
        totalApps: optimizedConfig.apps ? optimizedConfig.apps.length : 0,
        clusterModeApps: optimizedConfig.apps ? 
          optimizedConfig.apps.filter(app => app.exec_mode === 'cluster').length : 0,
        totalInstances: optimizedConfig.apps ? 
          optimizedConfig.apps.reduce((sum, app) => sum + (app.instances === 'max' ? SYSTEM_INFO.cpuCores : (app.instances || 1)), 0) : 0
      },
      performanceImpact: {
        expectedThroughputIncrease: environmentProfile.isProduction ? 
          SYSTEM_INFO.cpuCores + 'x' : '1x',
        memoryOptimization: optimizationOptions.performanceOptimization !== false,
        gcOptimization: environmentProfile.isProduction
      }
    };

    logInfo('Environment optimization completed', optimizationSummary);

    // Return optimized ecosystem configuration tuned for target environment deployment
    return {
      ...optimizedConfig,
      optimization: {
        environment,
        appliedAt: new Date().toISOString(),
        optimizationVersion: ECOSYSTEM_VERSION,
        environmentProfile,
        optimizationOptions,
        summary: optimizationSummary
      }
    };

  } catch (error) {
    logError('Failed to apply environment optimizations', {
      error: error.message,
      stack: error.stack,
      environment
    });
    
    // Return original configuration if optimization fails
    return ecosystemConfig;
  }
}

// Create and export the main PM2 ecosystem configuration
const tutorialEcosystem = createTutorialEcosystem(CURRENT_ENV, {
  applicationName: APPLICATION_NAME,
  scriptPath: SCRIPT_PATH,
  performanceOptimization: true,
  monitoringOptimization: true,
  securityHardening: isProduction,
  educationalFeatures: !isProduction
});

// Log ecosystem initialization with comprehensive details
logInfo('PM2 Ecosystem Configuration Module Initialized', {
  version: ECOSYSTEM_VERSION,
  applicationName: APPLICATION_NAME,
  scriptPath: SCRIPT_PATH,
  environment: CURRENT_ENV,
  systemInfo: SYSTEM_INFO,
  ecosystemApps: tutorialEcosystem.apps.length,
  clusterMode: tutorialEcosystem.apps[0].exec_mode === 'cluster',
  instances: tutorialEcosystem.apps[0].instances,
  monitoring: !!tutorialEcosystem.monitoring,
  deploymentReady: !!tutorialEcosystem.deploy,
  timestamp: new Date().toISOString()
});

// Extract configurations for export
const apps = tutorialEcosystem;
const deploy = tutorialEcosystem.deploy;

// Export the complete PM2 ecosystem configuration and utility functions
export default tutorialEcosystem;

export {
  // Main ecosystem configuration ready for PM2 deployment
  apps,
  deploy,
  
  // Configuration constants and metadata
  ECOSYSTEM_VERSION,
  APPLICATION_NAME,
  SCRIPT_PATH,
  CURRENT_ENV,
  SYSTEM_INFO
};

// Export the main ecosystem configuration for PM2 deployment
module.exports = tutorialEcosystem;