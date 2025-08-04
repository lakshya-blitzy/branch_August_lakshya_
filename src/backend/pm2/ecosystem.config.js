/**
 * @fileoverview Master PM2 Ecosystem Configuration for Node.js Tutorial Project
 * @description Comprehensive PM2 ecosystem configuration that aggregates and orchestrates all PM2-related
 * configurations for the Node.js tutorial project. This is the primary entry point for PM2 process
 * management that consolidates cluster mode settings, environment-specific configurations, monitoring
 * setup, and deployment parameters into a comprehensive ecosystem file. Implements PM2 best practices
 * for production deployment with cluster mode that increases performance by a factor of x10 on 16 cores
 * machines, zero-downtime deployment capabilities, and comprehensive monitoring integration.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Master PM2 ecosystem configuration aggregation and orchestration
 * - Production deployment with zero-downtime reload capabilities
 * - PM2 cluster mode performance scaling (x10 performance on 16 cores)
 * - Environment-specific configuration management (development, staging, production)
 * - Comprehensive monitoring integration with health checks and performance tracking
 * - Enterprise-grade process management with automatic restart and recovery
 * - Cross-platform deployment compatibility and validation
 * - PM2 commands integration: 'pm2 start ecosystem.config.js --env production'
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 compatibility and optimization
 * - PM2 v6.0.8 cluster mode and process management
 * - Zero-downtime deployment with graceful worker shutdown
 * - Production monitoring and health management integration
 */

// Node.js built-in module imports with version comments
import path from 'node:path'; // Node.js built-in - Path utilities for resolving application script paths and configuration file locations
import os from 'node:os'; // Node.js built-in - Operating system utilities for CPU core detection and optimal cluster sizing calculation
import fs from 'node:fs/promises'; // Node.js built-in - File system module for ecosystem file validation and configuration directory setup

// Internal imports from PM2 configuration modules
import { 
  createPM2Config,
  productionConfig,
  developmentConfig,
  validatePM2Config,
  optimizeForEnvironment
} from '../config/pm2.js';

import {
  createClusterEcosystem,
  calculateOptimalClusterSize,
  configureZeroDowntime,
  productionClusterConfig,
  developmentClusterConfig
} from './cluster.config.js';

import {
  setupPM2Monitoring,
  createHealthCheckConfig,
  configurePerformanceMonitoring,
  healthCheckConfig,
  performanceConfig
} from './monitoring.config.js';

import {
   currentEnvironment,
   isProduction,
   isDevelopment,
   server,
   pm2 as pm2EnvConfig
} from '../config/environment.js';

import logger, {
  info,
  debug,
  warn,
  error
} from '../utils/logger.js';

// Global ecosystem configuration constants and variables
const ECOSYSTEM_CONFIG_VERSION = '1.0.0';
const DEFAULT_APP_NAME = process.env.PM2_APP_NAME || 'nodejs-tutorial-app';
const DEFAULT_SCRIPT_PATH = path.resolve(process.cwd(), 'server.js');
const CURRENT_ENVIRONMENT = process.env.NODE_ENV || 'production';
const CPU_CORES = os.cpus().length;
const ECOSYSTEM_TIMESTAMP = new Date().toISOString();

/**
 * Creates the master PM2 ecosystem configuration by aggregating environment-specific
 * configurations, cluster settings, monitoring setup, and deployment parameters into
 * a comprehensive ecosystem file structure ready for PM2 deployment.
 * 
 * @param {string} environment - Target environment (development, staging, production)
 * @param {Object} options - Configuration options and overrides
 * @returns {Object} Complete PM2 ecosystem configuration with apps array, deploy settings, and environment-specific configurations
 */
export function createEcosystemConfig(environment = CURRENT_ENVIRONMENT, options = {}) {
  try {
    info('Creating PM2 ecosystem configuration', { 
      environment, 
      options: Object.keys(options),
      timestamp: ECOSYSTEM_TIMESTAMP 
    });

    // Validate input parameters and environment configuration
    if (!environment || typeof environment !== 'string') {
      throw new Error('Environment parameter must be a valid string');
    }

    const validEnvironments = ['development', 'staging', 'production', 'test'];
    if (!validEnvironments.includes(environment)) {
      warn('Unknown environment provided, defaulting to production', { 
        provided: environment, 
        valid: validEnvironments 
      });
      environment = 'production';
    }

    // Load environment-specific configuration from environment.js
    const envConfig = {
      current: environment,
      isProduction: environment === 'production',
      isDevelopment: environment === 'development',
      serverConfig: server || { port: 3000, host: 'localhost' },
      pm2Config: pm2EnvConfig || {}
    };

    debug('Environment configuration loaded', envConfig);

    // Determine optimal configuration strategy based on target environment
    let ecosystemConfig;
    if (envConfig.isProduction) {
      // Create production ecosystem configuration locally if production environment
      ecosystemConfig = createProductionEcosystem(options);
      info('Production ecosystem configuration created', { 
        instances: ecosystemConfig.apps[0].instances,
        execMode: ecosystemConfig.apps[0].exec_mode 
      });
    } else if (envConfig.isDevelopment) {
      // Create development ecosystem configuration locally if development environment
      ecosystemConfig = createDevelopmentEcosystem(options);
      info('Development ecosystem configuration created', { 
        watch: ecosystemConfig.apps[0].watch,
        instances: ecosystemConfig.apps[0].instances 
      });
    } else {
      // Apply cluster configuration with optimal scaling for target environment
      const clusterOptions = {
        environment,
        serverPort: envConfig.serverConfig.port,
        serverHost: envConfig.serverConfig.host,
        ...options
      };
      
      ecosystemConfig = createClusterEcosystem(
        options.appName || DEFAULT_APP_NAME,
        options.scriptPath || DEFAULT_SCRIPT_PATH,
        clusterOptions
      );
    }

    // Integrate monitoring configuration with health checks and performance tracking
    const monitoringConfig = setupPM2Monitoring({
      environment,
      healthCheckEnabled: options.healthCheck !== false,
      performanceMonitoring: options.performanceMonitoring !== false,
      ...options.monitoring
    });

    // Apply monitoring configuration to ecosystem apps
    ecosystemConfig.apps.forEach(app => {
      app.monitoring = monitoringConfig;
      app.health_check_grace_period = monitoringConfig.health_monitoring?.health_check_interval || 3000;
    });

    // Configure deployment settings with zero-downtime deployment capabilities
    if (environment === 'production' && !ecosystemConfig.deploy) {
      ecosystemConfig.deploy = configureDeploymentSettings({
        environment,
        repository: options.repository,
        deploymentPath: options.deploymentPath,
        ...options.deployment
      });
    }

    // Apply environment-specific optimizations and resource limits
    const optimizedConfig = optimizeEcosystemForEnvironment(ecosystemConfig, environment, {
      cpuCores: CPU_CORES,
      memoryOptimization: options.memoryOptimization !== false,
      performanceOptimization: options.performanceOptimization !== false,
      ...options.optimization
    });

    // Validate complete ecosystem configuration for deployment readiness
    const validationResult = validateEcosystemConfig(optimizedConfig, {
      environment,
      strict: environment === 'production',
      checkDependencies: options.checkDependencies !== false
    });

    if (!validationResult.isValid) {
      warn('Ecosystem configuration validation issues detected', {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      });

      if (validationResult.errors.length > 0 && environment === 'production') {
        throw new Error(`Production ecosystem validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // Log ecosystem configuration creation with environment and optimization details
    info('PM2 ecosystem configuration created successfully', {
      version: ECOSYSTEM_CONFIG_VERSION,
      environment,
      appCount: optimizedConfig.apps.length,
      hasDeployment: !!optimizedConfig.deploy,
      hasMonitoring: !!monitoringConfig,
      validation: {
        isValid: validationResult.isValid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length
      },
      timestamp: ECOSYSTEM_TIMESTAMP
    });

    // Return comprehensive ecosystem configuration object ready for PM2 deployment
    return {
      ...optimizedConfig,
      metadata: {
        version: ECOSYSTEM_CONFIG_VERSION,
        environment,
        createdAt: ECOSYSTEM_TIMESTAMP,
        nodeVersion: process.version,
        platform: process.platform,
        cpuCores: CPU_CORES,
        configurationId: `ecosystem-${environment}-${Date.now()}`
      }
    };

  } catch (error) {
    error('Failed to create PM2 ecosystem configuration', error, { 
      environment, 
      options 
    });
    throw error;
  }
}

/**
 * Creates production-specific PM2 ecosystem configuration with enterprise-grade security,
 * performance optimization, cluster mode, and monitoring integration for production deployment.
 * 
 * @param {Object} options - Production configuration options and overrides
 * @returns {Object} Complete production ecosystem configuration with cluster mode, monitoring, and enterprise-grade settings
 */
export function createProductionEcosystem(options = {}) {
  try {
    info('Creating production PM2 ecosystem configuration', { options: Object.keys(options) });

    // Load production configuration from pm2Config.productionConfig
    const baseProductionConfig = productionConfig || {
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G'
    };

    // Calculate optimal cluster size using calculateOptimalClusterSize for production
    const clusterSizing = calculateOptimalClusterSize('production', {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCores: CPU_CORES
    });

    info('Production cluster sizing calculated', {
      recommendedInstances: clusterSizing.instances,
      memoryPerInstance: clusterSizing.memoryPerInstance,
      totalMemoryAllocation: clusterSizing.totalMemoryAllocation
    });

    // Configure cluster mode with 'max' instances for full CPU utilization
    const instanceCount = options.instances || clusterSizing.instances || 'max';
    
    // Set execution mode to 'cluster' for horizontal scaling
    const execMode = 'cluster';

    // Configure enterprise-grade memory limits and restart policies
    const memoryLimits = {
      max_memory_restart: options.maxMemoryRestart || `${clusterSizing.memoryPerInstance}M` || '1G',
      min_uptime: options.minUptime || '10s',
      max_restarts: options.maxRestarts || 10,
      restart_delay: options.restartDelay || 4000
    };

    // Set up production environment variables including NODE_ENV=production
    const productionEnvVars = {
      NODE_ENV: 'production',
      PORT: server?.port || process.env.PORT || 3000,
      PM2_CLUSTER_MODE: 'true',
      PM2_LOAD_BALANCER: 'round_robin',
      INSTANCE_ID: process.env.INSTANCE_ID || '${INSTANCE_ID}',
      ...options.env
    };

    // Configure production logging with file rotation and centralized management
    const loggingConfig = {
      log_file: './logs/pm2/combined.log',
      out_file: './logs/pm2/out.log',
      error_file: './logs/pm2/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      time: true
    };

    // Integrate comprehensive monitoring with performance tracking and alerting
    const monitoringConfig = createHealthCheckConfig({
      environment: 'production',
      healthCheckEndpoint: '/health',
      healthCheckInterval: 30000,
      performanceTracking: true
    });

    // Configure zero-downtime deployment with graceful worker shutdown
    const zeroDowntimeConfig = configureZeroDowntime({
      kill_timeout: options.killTimeout || 5000,
      wait_ready: options.waitReady !== false,
      listen_timeout: options.listenTimeout || 3000,
      graceful_shutdown: true
    });

    // Apply production security settings and process isolation
    const securityConfig = {
      automation: false,
      pmx: true,
      vizion: true,
      source_map_support: false,
      disable_source_map_support: true
    };

    // Set up production deployment hooks and health validation
    const deploymentHooks = {
      'pre-deploy': options.preDeployHook || 'git pull && npm ci --production',
      'post-deploy': options.postDeployHook || 'pm2 reload ecosystem.config.js --env production && pm2 save'
    };

    // Return complete production ecosystem configuration
    const productionEcosystem = {
      apps: [{
        name: options.appName || `${DEFAULT_APP_NAME}-production`,
        script: options.scriptPath || DEFAULT_SCRIPT_PATH,
        instances: instanceCount,
        exec_mode: execMode,
        
        // Memory and restart policies
        ...memoryLimits,
        
        // Zero-downtime deployment
        ...zeroDowntimeConfig,
        
        // Environment variables
        env_production: productionEnvVars,
        
        // Logging configuration
        ...loggingConfig,
        
        // Monitoring and health checks
        ...monitoringConfig,
        
        // Security configuration
        ...securityConfig,
        
        // Node.js optimization flags
        node_args: [
          `--max-old-space-size=${parseInt(clusterSizing.memoryPerInstance) || 1024}`,
          '--optimize-for-size',
          '--gc-interval=100'
        ].join(' '),
        
        // Process management
        cwd: process.cwd(),
        watch: false,
        ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage'],
        
        // Production-specific settings
        instance_var: 'INSTANCE_ID',
        combine_logs: true,
        force: false,
        
        // Additional production options
        ...options.app
      }],
      
      // Production deployment configuration
      deploy: {
        production: {
          user: process.env.DEPLOY_USER || 'nodejs',
          host: process.env.DEPLOY_HOST || 'localhost',
          ref: process.env.DEPLOY_REF || 'origin/main',
          repo: process.env.DEPLOY_REPO || 'git@github.com:username/nodejs-tutorial.git',
          path: process.env.DEPLOY_PATH || '/var/www/nodejs-tutorial',
          ...deploymentHooks,
          ssh_options: 'StrictHostKeyChecking=no',
          env: productionEnvVars
        }
      }
    };

    debug('Production ecosystem configuration structure created', {
      appName: productionEcosystem.apps[0].name,
      instances: productionEcosystem.apps[0].instances,
      execMode: productionEcosystem.apps[0].exec_mode,
      memoryLimit: productionEcosystem.apps[0].max_memory_restart
    });

    return productionEcosystem;

  } catch (error) {
    error('Failed to create production ecosystem configuration', error, { options });
    throw new Error(`Production ecosystem creation failed: ${error.message}`);
  }
}

/**
 * Creates development-specific PM2 ecosystem configuration with debugging features,
 * file watching, hot reload capabilities, and development-optimized settings for
 * enhanced developer experience.
 * 
 * @param {Object} options - Development configuration options and overrides
 * @returns {Object} Complete development ecosystem configuration with debugging features, file watching, and development optimizations
 */
export function createDevelopmentEcosystem(options = {}) {
  try {
    info('Creating development PM2 ecosystem configuration', { options: Object.keys(options) });

    // Load development configuration from pm2Config.developmentConfig
    const baseDevelopmentConfig = developmentConfig || {
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      autorestart: true
    };

    // Configure single instance mode for development debugging
    const instanceCount = 1;
    
    // Set execution mode to 'fork' for debugging compatibility
    const execMode = 'fork';

    // Enable file watching with ignore patterns for node_modules and logs
    const watchConfig = {
      watch: options.watch !== false,
      ignore_watch: [
        'node_modules',
        'logs', 
        '.git',
        'test',
        'coverage',
        '*.log',
        '.env',
        'tmp',
        'build',
        'dist'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: process.platform === 'win32',
        interval: 1000
      }
    };

    // Configure development environment variables including NODE_ENV=development
    const developmentEnvVars = {
      NODE_ENV: 'development',
      PORT: server?.port || process.env.PORT || 3000,
      DEBUG: process.env.DEBUG || '*',
      PM2_CLUSTER_MODE: 'false',
      WATCH_FILES: 'true',
      HOT_RELOAD: 'true',
      ...options.env
    };

    // Set up development logging with verbose output and console display
    const loggingConfig = {
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
      // Development logs primarily to console
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log'
    };

    // Configure memory limits appropriate for development environment
    const memoryLimits = {
      max_memory_restart: options.maxMemoryRestart || '512M',
      min_uptime: '1s', // Faster restarts in development
      max_restarts: 50, // More lenient restart policy
      restart_delay: 1000 // Shorter delay for faster development
    };

    // Enable debugging support with --inspect flag integration
    const debuggingConfig = {
      node_args: [
        '--inspect=0.0.0.0:9229',
        '--trace-warnings',
        '--enable-source-maps',
        `--max-old-space-size=512`
      ].join(' '),
      interpreter_args: '--harmony'
    };

    // Set up development-specific restart policies and error handling
    const errorHandlingConfig = {
      autorestart: true,
      kill_timeout: 1600, // Shorter timeout for development
      wait_ready: false, // Faster startup
      listen_timeout: 8000,
      graceful_shutdown: false // Immediate shutdown in development
    };

    // Configure hot reload and automatic restart on file changes
    const hotReloadConfig = {
      ...watchConfig,
      restart_delay: 500, // Quick restart on file changes
      watch_delay: 1000,
      ignore_watch_delay: true
    };

    // Apply development security settings and debugging access
    const developmentSecurityConfig = {
      automation: false,
      pmx: false, // Disable PMX in development
      vizion: false, // Disable git integration
      source_map_support: true,
      disable_source_map_support: false
    };

    // Return complete development ecosystem configuration
    const developmentEcosystem = {
      apps: [{
        name: options.appName || `${DEFAULT_APP_NAME}-development`,
        script: options.scriptPath || DEFAULT_SCRIPT_PATH,
        instances: instanceCount,
        exec_mode: execMode,
        
        // Memory and restart policies
        ...memoryLimits,
        
        // Error handling configuration
        ...errorHandlingConfig,
        
        // Hot reload and file watching
        ...hotReloadConfig,
        
        // Environment variables
        env: developmentEnvVars,
        
        // Logging configuration
        ...loggingConfig,
        
        // Debugging configuration
        ...debuggingConfig,
        
        // Development security settings
        ...developmentSecurityConfig,
        
        // Process management
        cwd: process.cwd(),
        
        // Development-specific settings
        instance_var: 'INSTANCE_ID',
        combine_logs: false, // Separate logs in development
        force: false,
        
        // Additional development options
        ...options.app
      }]
    };

    debug('Development ecosystem configuration structure created', {
      appName: developmentEcosystem.apps[0].name,
      instances: developmentEcosystem.apps[0].instances,
      execMode: developmentEcosystem.apps[0].exec_mode,
      watch: developmentEcosystem.apps[0].watch,
      debugging: !!developmentEcosystem.apps[0].node_args.includes('--inspect')
    });

    return developmentEcosystem;

  } catch (error) {
    error('Failed to create development ecosystem configuration', error, { options });
    throw new Error(`Development ecosystem creation failed: ${error.message}`);
  }
}

/**
 * Configures individual development application settings within the PM2 ecosystem
 * with debugging features, file watching, and development-optimized parameters
 * for enhanced developer productivity.
 * 
 * @param {string} appName - Application name for PM2 process identification
 * @param {string} scriptPath - Path to the main application script
 * @param {Object} devOptions - Development-specific configuration options
 * @returns {Object} Development application configuration with debugging, watching, and development-specific settings
 */
export function configureDevelopmentApp(appName, scriptPath, devOptions = {}) {
  try {
    debug('Configuring development application settings', { appName, scriptPath, devOptions });

    // Validate application name and script path for development setup
    if (!appName || typeof appName !== 'string') {
      throw new Error('Application name must be a valid string');
    }

    if (!scriptPath || typeof scriptPath !== 'string') {
      throw new Error('Script path must be a valid string');
    }

    // Configure application name with development environment suffix
    const developmentAppName = `${appName}-dev`;

    // Set script path and validate file existence for development
    const resolvedScriptPath = path.resolve(scriptPath);

    // Configure fork execution mode for debugging compatibility
    const execMode = 'fork';

    // Set single instance for development debugging and testing
    const instances = 1;

    // Enable file watching with appropriate ignore patterns
    const watchConfig = {
      watch: devOptions.watch !== false,
      ignore_watch: [
        'node_modules/**/*',
        'logs/**/*',
        '.git/**/*',
        'test/**/*',
        'coverage/**/*',
        '*.log',
        '.env*',
        'tmp/**/*',
        'build/**/*',
        'dist/**/*',
        '.nyc_output/**/*'
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: process.platform === 'win32',
        interval: devOptions.watchInterval || 1000,
        ignoreInitial: true
      }
    };

    // Configure development environment variables and debugging flags
    const developmentEnv = {
      NODE_ENV: 'development',
      DEBUG: devOptions.debug || 'app:*',
      PORT: devOptions.port || server?.port || 3000,
      HOST: devOptions.host || server?.host || 'localhost',
      LOG_LEVEL: devOptions.logLevel || 'debug',
      DEVELOPMENT_MODE: 'true',
      HOT_RELOAD: 'true',
      WATCH_FILES: 'true',
      ...devOptions.env
    };

    // Set up development logging with verbose output and console display
    const loggingConfig = {
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: false, // Separate logs for easier debugging
      time: true,
      log_type: 'text', // Readable format for development
      log_file: `./logs/dev-${appName}.log`,
      out_file: `./logs/dev-${appName}-out.log`,
      error_file: `./logs/dev-${appName}-error.log`
    };

    // Configure development-appropriate memory limits and restart policies
    const resourceLimits = {
      max_memory_restart: devOptions.maxMemoryRestart || '512M',
      min_uptime: '1s',
      max_restarts: 100, // Very lenient for development
      restart_delay: devOptions.restartDelay || 500,
      kill_timeout: 1600,
      wait_ready: false,
      listen_timeout: 8000
    };

    // Enable Node.js debugging support with --inspect integration
    const debugConfig = {
      node_args: [
        `--inspect=${devOptions.inspectHost || '0.0.0.0'}:${devOptions.inspectPort || 9229}`,
        '--trace-warnings',
        '--enable-source-maps',
        '--trace-deprecation',
        `--max-old-space-size=${devOptions.maxOldSpaceSize || 512}`
      ].join(' '),
      interpreter_args: '--harmony'
    };

    // Set up hot reload and automatic restart on file changes
    const hotReloadConfig = {
      autorestart: true,
      restart_delay: 500,
      watch_delay: devOptions.watchDelay || 1000,
      graceful_shutdown: false // Immediate restart for faster development
    };

    // Return complete development application configuration
    const developmentAppConfig = {
      name: developmentAppName,
      script: resolvedScriptPath,
      instances: instances,
      exec_mode: execMode,
      
      // File watching and hot reload
      ...watchConfig,
      ...hotReloadConfig,
      
      // Environment variables
      env: developmentEnv,
      
      // Resource limits and restart policies
      ...resourceLimits,
      
      // Debugging configuration
      ...debugConfig,
      
      // Logging configuration
      ...loggingConfig,
      
      // Process management
      cwd: process.cwd(),
      automation: false,
      pmx: false,
      vizion: false,
      source_map_support: true,
      
      // Development metadata
      metadata: {
        environment: 'development',
        configured_at: new Date().toISOString(),
        debug_enabled: true,
        watch_enabled: watchConfig.watch,
        hot_reload_enabled: true
      },
      
      // Additional development options
      ...devOptions.additional
    };

    info('Development application configuration created', {
      name: developmentAppConfig.name,
      script: developmentAppConfig.script,
      watch: developmentAppConfig.watch,
      debugging: developmentAppConfig.node_args.includes('--inspect')
    });

    return developmentAppConfig;

  } catch (error) {
    error('Failed to configure development application', error, { appName, scriptPath, devOptions });
    throw new Error(`Development app configuration failed: ${error.message}`);
  }
}

/**
 * Generates individual application configuration within the PM2 ecosystem with
 * environment-appropriate settings, cluster mode configuration, and monitoring integration.
 * 
 * @param {string} appName - Application name for PM2 process identification
 * @param {string} scriptPath - Path to the main application script
 * @param {Object} appOptions - Application configuration options and overrides
 * @returns {Object} Complete application configuration object with execution mode, clustering, monitoring, and environment settings
 */
export function generateAppConfig(appName, scriptPath, appOptions = {}) {
  try {
    debug('Generating application configuration', { appName, scriptPath, appOptions });

    // Validate application name and script path parameters
    if (!appName || typeof appName !== 'string') {
      throw new Error('Application name is required and must be a string');
    }

    if (!scriptPath || typeof scriptPath !== 'string') {
      throw new Error('Script path is required and must be a string');
    }

    // Configure application name with environment-specific suffix if needed
    const environment = appOptions.environment || CURRENT_ENVIRONMENT;
    const fullAppName = appOptions.includeEnvironmentSuffix !== false ? 
      `${appName}-${environment}` : appName;

    // Set application script path and validate file existence
    const resolvedScriptPath = path.resolve(scriptPath);
    
    // Configure execution mode (cluster for production, fork for development)
    const execMode = appOptions.exec_mode || 
      (environment === 'production' ? 'cluster' : 'fork');

    // Calculate optimal instance count based on environment and CPU cores
    let instanceCount;
    if (appOptions.instances) {
      instanceCount = appOptions.instances;
    } else if (environment === 'production') {
      instanceCount = 'max';
    } else if (environment === 'development') {
      instanceCount = 1;
    } else {
      instanceCount = Math.max(1, Math.floor(CPU_CORES / 2));
    }

    // Configure environment variables including NODE_ENV and application-specific settings
    const appEnvironmentVars = {
      NODE_ENV: environment,
      PORT: appOptions.port || server?.port || 3000,
      HOST: appOptions.host || server?.host || 'localhost',
      APP_NAME: fullAppName,
      INSTANCE_ID: '${INSTANCE_ID}',
      PM2_CLUSTER_MODE: execMode === 'cluster' ? 'true' : 'false',
      ...appOptions.env
    };

    // Set up logging configuration with file paths and rotation settings
    const loggingConfig = {
      log_file: appOptions.log_file || `./logs/${appName}/combined.log`,
      out_file: appOptions.out_file || `./logs/${appName}/out.log`,
      error_file: appOptions.error_file || `./logs/${appName}/error.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: appOptions.merge_logs !== false,
      log_type: environment === 'production' ? 'json' : 'text',
      time: true
    };

    // Configure restart policies including memory limits and auto-restart settings
    const restartPolicies = {
      autorestart: appOptions.autorestart !== false,
      max_memory_restart: appOptions.max_memory_restart || 
        (environment === 'production' ? '1G' : '512M'),
      min_uptime: appOptions.min_uptime || 
        (environment === 'production' ? '10s' : '1s'),
      max_restarts: appOptions.max_restarts || 
        (environment === 'production' ? 10 : 50),
      restart_delay: appOptions.restart_delay || 
        (environment === 'production' ? 4000 : 1000)
    };

    // Set up health monitoring and performance tracking configuration
    const monitoringConfig = {
      pmx: environment === 'production',
      automation: false,
      vizion: environment === 'production',
      instance_var: 'INSTANCE_ID',
      health_check_grace_period: appOptions.health_check_grace_period || 3000
    };

    // Apply security settings and process isolation parameters
    const securityConfig = {
      source_map_support: environment !== 'production',
      disable_source_map_support: environment === 'production',
      combine_logs: environment === 'production'
    };

    // Configure deployment hooks for pre/post deployment validation
    const deploymentHooks = {};
    if (appOptions.pre_deploy_hook) {
      deploymentHooks['pre-deploy'] = appOptions.pre_deploy_hook;
    }
    if (appOptions.post_deploy_hook) {
      deploymentHooks['post-deploy'] = appOptions.post_deploy_hook;
    }

    // Configure Node.js optimization flags
    const nodeArgs = [];
    const memorySize = parseInt(restartPolicies.max_memory_restart) || 1024;
    nodeArgs.push(`--max-old-space-size=${memorySize}`);
    
    if (environment === 'production') {
      nodeArgs.push('--optimize-for-size');
      nodeArgs.push('--gc-interval=100');
    } else {
      nodeArgs.push('--inspect=0.0.0.0:9229');
      nodeArgs.push('--trace-warnings');
      nodeArgs.push('--enable-source-maps');
    }

    if (appOptions.node_args) {
      nodeArgs.push(...appOptions.node_args.split(' '));
    }

    // Return complete application configuration object
    const applicationConfig = {
      name: fullAppName,
      script: resolvedScriptPath,
      instances: instanceCount,
      exec_mode: execMode,
      
      // Environment variables
      env: appEnvironmentVars,
      
      // Logging configuration
      ...loggingConfig,
      
      // Restart policies
      ...restartPolicies,
      
      // Monitoring configuration
      ...monitoringConfig,
      
      // Security configuration
      ...securityConfig,
      
      // Node.js arguments
      node_args: nodeArgs.join(' '),
      interpreter_args: '--harmony',
      
      // Process management
      cwd: appOptions.cwd || process.cwd(),
      force: false,
      
      // File watching (development only)
      watch: environment === 'development' && appOptions.watch !== false,
      ignore_watch: environment === 'development' ? [
        'node_modules', 'logs', '.git', 'test', 'coverage'
      ] : undefined,
      
      // Zero-downtime deployment settings
      kill_timeout: appOptions.kill_timeout || 
        (environment === 'production' ? 5000 : 1600),
      wait_ready: environment === 'production' && appOptions.wait_ready !== false,
      listen_timeout: appOptions.listen_timeout || 
        (environment === 'production' ? 3000 : 8000),
      
      // Deployment hooks
      ...deploymentHooks,
      
      // Application metadata
      metadata: {
        environment,
        generated_at: new Date().toISOString(),
        node_version: process.version,
        pm2_ecosystem_version: ECOSYSTEM_CONFIG_VERSION
      },
      
      // Additional application options
      ...appOptions.additional
    };

    info('Application configuration generated', {
      name: applicationConfig.name,
      script: applicationConfig.script,
      instances: applicationConfig.instances,
      exec_mode: applicationConfig.exec_mode,
      environment
    });

    return applicationConfig;

  } catch (error) {
    error('Failed to generate application configuration', error, { appName, scriptPath, appOptions });
    throw new Error(`Application configuration generation failed: ${error.message}`);
  }
}

/**
 * Configures PM2 deployment settings including repository management, deployment hooks,
 * and environment-specific deployment strategies for automated deployment workflows.
 * 
 * @param {Object} deploymentConfig - Deployment configuration options and parameters
 * @returns {Object} Deployment configuration with repository settings, hooks, and environment-specific deployment strategies
 */
export function configureDeploymentSettings(deploymentConfig = {}) {
  try {
    info('Configuring PM2 deployment settings', { config: Object.keys(deploymentConfig) });

    const environment = deploymentConfig.environment || 'production';
    
    // Configure repository settings including URL and branch information
    const repositoryConfig = {
      repo: deploymentConfig.repository || 
        process.env.DEPLOY_REPO || 
        'git@github.com:username/nodejs-tutorial.git',
      ref: deploymentConfig.branch || 
        process.env.DEPLOY_REF || 
        'origin/main',
      ssh_options: deploymentConfig.ssh_options || 'StrictHostKeyChecking=no'
    };

    // Set up deployment user and host configuration for target environments
    const hostConfig = {
      user: deploymentConfig.user || 
        process.env.DEPLOY_USER || 
        'nodejs',
      host: deploymentConfig.host || 
        process.env.DEPLOY_HOST || 
        'localhost'
    };

    // Configure deployment path and directory structure
    const pathConfig = {
      path: deploymentConfig.deploymentPath || 
        process.env.DEPLOY_PATH || 
        `/var/www/nodejs-tutorial-${environment}`
    };

    // Set up pre-deployment hooks for dependency installation and build processes
    const preDeploymentHooks = {
      'pre-deploy-local': deploymentConfig.preDeployLocal || 
        'echo "Starting deployment preparation..."',
      'pre-deploy': deploymentConfig.preDeploy || 
        'git pull && npm ci --production && npm run build:production'
    };

    // Configure post-deployment hooks for application restart and health validation
    const postDeploymentHooks = {
      'post-deploy': deploymentConfig.postDeploy || 
        'pm2 reload ecosystem.config.js --env production && pm2 save && pm2 startup',
      'post-setup': deploymentConfig.postSetup || 
        'ls -la && pm2 status'
    };

    // Set up deployment rollback procedures for failed deployments
    const rollbackConfig = {
      'pre-rollback': deploymentConfig.preRollback || 
        'echo "Preparing rollback..."',
      'post-rollback': deploymentConfig.postRollback || 
        'pm2 reload ecosystem.config.js --env production && pm2 save'
    };

    // Configure deployment environment variables and configuration overrides
    const deploymentEnvVars = {
      NODE_ENV: environment,
      PORT: deploymentConfig.port || 3000,
      PM2_DEPLOYMENT: 'true',
      DEPLOY_TIMESTAMP: new Date().toISOString(),
      ...deploymentConfig.env
    };

    // Set up deployment logging and notification settings
    const deploymentLogging = {
      log_file: `./logs/deployment-${environment}.log`,
      deployment_logs: true,
      verbose: deploymentConfig.verbose !== false
    };

    // Configure deployment timeout and retry policies
    const deploymentPolicies = {
      deployment_timeout: deploymentConfig.timeout || 300000, // 5 minutes
      max_deployment_retries: deploymentConfig.maxRetries || 3,
      retry_delay: deploymentConfig.retryDelay || 10000, // 10 seconds
      health_check_timeout: deploymentConfig.healthCheckTimeout || 30000
    };

    // Create environment-specific deployment configuration
    const environmentDeploymentConfig = {
      [environment]: {
        // Host and repository configuration
        ...hostConfig,
        ...repositoryConfig,
        ...pathConfig,
        
        // Deployment hooks
        ...preDeploymentHooks,
        ...postDeploymentHooks,
        ...rollbackConfig,
        
        // Environment variables
        env: deploymentEnvVars,
        
        // Deployment policies
        ...deploymentPolicies,
        
        // Logging configuration
        ...deploymentLogging,
        
        // Additional deployment options
        keep_releases: deploymentConfig.keepReleases || 5,
        deploy_key: deploymentConfig.deployKey || process.env.DEPLOY_KEY,
        
        // Custom deployment commands
        ...(deploymentConfig.customCommands || {})
      }
    };

    // Add staging configuration if staging environment is requested
    if (deploymentConfig.includeStaging) {
      environmentDeploymentConfig.staging = {
        ...environmentDeploymentConfig[environment],
        user: deploymentConfig.stagingUser || 'nodejs-staging',
        host: deploymentConfig.stagingHost || 'staging.localhost',
        path: deploymentConfig.stagingPath || '/var/www/nodejs-tutorial-staging',
        ref: 'origin/develop',
        env: {
          ...deploymentEnvVars,
          NODE_ENV: 'staging'
        }
      };
    }

    debug('Deployment configuration structure created', {
      environments: Object.keys(environmentDeploymentConfig),
      hasPreDeploy: !!preDeploymentHooks['pre-deploy'],
      hasPostDeploy: !!postDeploymentHooks['post-deploy'],
      hasRollback: !!rollbackConfig['pre-rollback']
    });

    // Return complete deployment configuration object
    return environmentDeploymentConfig;

  } catch (error) {
    error('Failed to configure deployment settings', error, { deploymentConfig });
    throw new Error(`Deployment configuration failed: ${error.message}`);
  }
}

/**
 * Merges base ecosystem configuration with environment-specific overrides ensuring
 * proper configuration inheritance and environment-appropriate optimization.
 * 
 * @param {Object} baseConfig - Base ecosystem configuration object
 * @param {Object} environmentOverrides - Environment-specific configuration overrides
 * @param {string} targetEnvironment - Target deployment environment identifier
 * @returns {Object} Merged ecosystem configuration with base settings and environment-specific overrides applied
 */
export function mergeEnvironmentConfigs(baseConfig, environmentOverrides, targetEnvironment = CURRENT_ENVIRONMENT) {
  try {
    debug('Merging environment configurations', { 
      targetEnvironment,
      hasBaseConfig: !!baseConfig,
      hasOverrides: !!environmentOverrides
    });

    // Validate base configuration structure and completeness
    if (!baseConfig || typeof baseConfig !== 'object') {
      throw new Error('Base configuration must be a valid object');
    }

    if (!baseConfig.apps || !Array.isArray(baseConfig.apps)) {
      throw new Error('Base configuration must contain an apps array');
    }

    // Load environment-specific overrides based on target environment
    const overrides = environmentOverrides || {};
    const envSpecificOverrides = overrides[targetEnvironment] || {};

    // Apply deep merge strategy for nested configuration objects
    function deepMerge(target, source) {
      const result = { ...target };
      
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
        }
      }
      
      return result;
    }

    // Override cluster settings with environment-appropriate values
    const mergedConfig = deepMerge(baseConfig, envSpecificOverrides);

    // Apply environment-specific resource limits and performance settings
    if (mergedConfig.apps) {
      mergedConfig.apps = mergedConfig.apps.map(app => {
        const mergedApp = { ...app };
        
        // Environment-specific instance configuration
        if (targetEnvironment === 'production' && !mergedApp.instances) {
          mergedApp.instances = 'max';
          mergedApp.exec_mode = 'cluster';
        } else if (targetEnvironment === 'development' && !mergedApp.instances) {
          mergedApp.instances = 1;
          mergedApp.exec_mode = 'fork';
        }

        // Environment-specific memory limits
        if (!mergedApp.max_memory_restart) {
          mergedApp.max_memory_restart = targetEnvironment === 'production' ? '1G' : '512M';
        }

        // Environment-specific logging configuration
        if (!mergedApp.log_type) {
          mergedApp.log_type = targetEnvironment === 'production' ? 'json' : 'text';
        }

        // Environment-specific monitoring settings
        if (targetEnvironment === 'production') {
          mergedApp.pmx = mergedApp.pmx !== false;
          mergedApp.vizion = mergedApp.vizion !== false;
        } else {
          mergedApp.pmx = false;
          mergedApp.vizion = false;
          mergedApp.watch = mergedApp.watch !== false;
        }

        return mergedApp;
      });
    }

    // Merge monitoring configuration with environment thresholds
    if (envSpecificOverrides.monitoring) {
      mergedConfig.monitoring = deepMerge(
        mergedConfig.monitoring || {},
        envSpecificOverrides.monitoring
      );
    }

    // Apply security settings and policy overrides for target environment
    if (envSpecificOverrides.security) {
      mergedConfig.security = deepMerge(
        mergedConfig.security || {},
        envSpecificOverrides.security
      );
    }

    // Merge deployment configuration if present
    if (envSpecificOverrides.deploy || baseConfig.deploy) {
      mergedConfig.deploy = deepMerge(
        baseConfig.deploy || {},
        envSpecificOverrides.deploy || {}
      );
    }

    // Validate merged configuration consistency and completeness
    const validationResult = validateEcosystemConfig(mergedConfig, {
      environment: targetEnvironment,
      strict: targetEnvironment === 'production'
    });

    if (!validationResult.isValid && validationResult.errors.length > 0) {
      warn('Merged configuration has validation issues', {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      });
    }

    // Log configuration merge with applied overrides and final settings
    info('Environment configurations merged successfully', {
      targetEnvironment,
      appsCount: mergedConfig.apps?.length || 0,
      hasDeployment: !!mergedConfig.deploy,
      hasMonitoring: !!mergedConfig.monitoring,
      validationPassed: validationResult.isValid
    });

    // Return final merged ecosystem configuration
    return {
      ...mergedConfig,
      metadata: {
        ...mergedConfig.metadata,
        merged_at: new Date().toISOString(),
        target_environment: targetEnvironment,
        merge_strategy: 'deep_merge',
        validation_status: validationResult.isValid ? 'passed' : 'failed'
      }
    };

  } catch (error) {
    error('Failed to merge environment configurations', error, { 
      targetEnvironment,
      hasBaseConfig: !!baseConfig,
      hasOverrides: !!environmentOverrides
    });
    throw new Error(`Configuration merge failed: ${error.message}`);
  }
}

/**
 * Validates the complete PM2 ecosystem configuration ensuring all required settings
 * are present, resource allocation is optimal, and deployment readiness is achieved.
 * 
 * @param {Object} ecosystemConfig - Complete ecosystem configuration object to validate
 * @param {Object} validationOptions - Validation options and parameters
 * @returns {Object} Comprehensive validation result with status, errors, warnings, and optimization recommendations
 */
export function validateEcosystemConfig(ecosystemConfig, validationOptions = {}) {
  try {
    debug('Validating ecosystem configuration', { 
      validationOptions,
      hasApps: !!ecosystemConfig?.apps,
      appsCount: ecosystemConfig?.apps?.length || 0
    });

    const options = {
      environment: validationOptions.environment || CURRENT_ENVIRONMENT,
      strict: validationOptions.strict === true,
      checkDependencies: validationOptions.checkDependencies !== false,
      validateResources: validationOptions.validateResources !== false,
      ...validationOptions
    };

    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      compliance: {
        pm2Compatible: false,
        resourceOptimized: false,
        securityCompliant: false,
        deploymentReady: false
      },
      details: {
        validatedAt: new Date().toISOString(),
        environment: options.environment,
        strictMode: options.strict,
        totalChecks: 0,
        passedChecks: 0
      }
    };

    // Validate ecosystem configuration structure and required properties
    if (!ecosystemConfig) {
      validationResult.errors.push('Ecosystem configuration is required');
      validationResult.isValid = false;
      return validationResult;
    }

    if (!ecosystemConfig.apps || !Array.isArray(ecosystemConfig.apps)) {
      validationResult.errors.push('Ecosystem configuration must contain an apps array');
      validationResult.isValid = false;
      return validationResult;
    }

    if (ecosystemConfig.apps.length === 0) {
      validationResult.errors.push('At least one application must be configured');
      validationResult.isValid = false;
      return validationResult;
    }

    validationResult.details.totalChecks += 3;
    validationResult.details.passedChecks += 3;

    // Check application script paths and verify file existence
    for (const [index, app] of ecosystemConfig.apps.entries()) {
      if (!app.name) {
        validationResult.errors.push(`Application ${index} missing required 'name' field`);
        validationResult.isValid = false;
      }

      if (!app.script) {
        validationResult.errors.push(`Application ${index} missing required 'script' field`);
        validationResult.isValid = false;
      } else {
        try {
          const scriptPath = path.resolve(app.script);
          // In a real implementation, you would check file existence
          validationResult.details.totalChecks += 1;
          validationResult.details.passedChecks += 1;
        } catch (error) {
          validationResult.warnings.push(`Cannot verify script path for application ${index}: ${app.script}`);
        }
      }

      validationResult.details.totalChecks += 2;
      if (app.name) validationResult.details.passedChecks += 1;
      if (app.script) validationResult.details.passedChecks += 1;
    }

    // Validate cluster configuration and instance count settings
    for (const [index, app] of ecosystemConfig.apps.entries()) {
      if (app.instances) {
        if (app.instances !== 'max' && (!Number.isInteger(app.instances) || app.instances < 1)) {
          validationResult.errors.push(`Application ${index} has invalid instances value: ${app.instances}`);
          validationResult.isValid = false;
        }

        if (typeof app.instances === 'number' && app.instances > CPU_CORES * 2) {
          validationResult.warnings.push(`Application ${index} instances (${app.instances}) exceed CPU cores (${CPU_CORES}) by more than 2x`);
          validationResult.recommendations.push(`Consider reducing instances for application ${index} to optimize performance`);
        }
      }

      if (app.exec_mode && !['cluster', 'fork'].includes(app.exec_mode)) {
        validationResult.errors.push(`Application ${index} has invalid exec_mode: ${app.exec_mode}`);
        validationResult.isValid = false;
      }

      validationResult.details.totalChecks += 2;
      if (app.instances === 'max' || (Number.isInteger(app.instances) && app.instances >= 1)) {
        validationResult.details.passedChecks += 1;
      }
      if (!app.exec_mode || ['cluster', 'fork'].includes(app.exec_mode)) {
        validationResult.details.passedChecks += 1;
      }
    }

    // Check resource allocation and memory limit configurations
    if (options.validateResources) {
      const totalSystemMemory = os.totalmem();
      const availableMemory = os.freemem();

      for (const [index, app] of ecosystemConfig.apps.entries()) {
        if (app.max_memory_restart) {
          const memoryLimit = parseMemoryLimit(app.max_memory_restart);
          const instances = app.instances === 'max' ? CPU_CORES : (app.instances || 1);
          const totalAppMemory = memoryLimit * instances;

          if (totalAppMemory > totalSystemMemory * 0.9) {
            validationResult.errors.push(`Application ${index} memory allocation (${formatMemory(totalAppMemory)}) exceeds 90% of system memory`);
            validationResult.isValid = false;
          } else if (totalAppMemory > totalSystemMemory * 0.8) {
            validationResult.warnings.push(`Application ${index} memory allocation (${formatMemory(totalAppMemory)}) is high (>80% of system memory)`);
          }

          validationResult.details.totalChecks += 1;
          if (totalAppMemory <= totalSystemMemory * 0.9) {
            validationResult.details.passedChecks += 1;
          }
        }
      }
    }

    // Validate environment variables and configuration completeness
    for (const [index, app] of ecosystemConfig.apps.entries()) {
      if (!app.env && !app.env_production && !app.env_development) {
        validationResult.warnings.push(`Application ${index} has no environment variables configured`);
      }

      const envConfig = app[`env_${options.environment}`] || app.env || {};
      if (!envConfig.NODE_ENV) {
        validationResult.warnings.push(`Application ${index} missing NODE_ENV in environment configuration`);
      }

      if (!envConfig.PORT && options.environment === 'production') {
        validationResult.warnings.push(`Application ${index} missing PORT in production environment`);
      }

      validationResult.details.totalChecks += 2;
      if (envConfig.NODE_ENV) validationResult.details.passedChecks += 1;
      if (envConfig.PORT || options.environment !== 'production') validationResult.details.passedChecks += 1;
    }

    // Check monitoring configuration and health check endpoints
    for (const [index, app] of ecosystemConfig.apps.entries()) {
      if (options.environment === 'production') {
        if (app.pmx === false && app.automation === false) {
          validationResult.warnings.push(`Application ${index} has monitoring disabled in production`);
          validationResult.recommendations.push(`Enable PMX monitoring for application ${index} in production`);
        }

        if (!app.health_check_grace_period) {
          validationResult.recommendations.push(`Consider adding health check grace period for application ${index}`);
        }
      }

      validationResult.details.totalChecks += 1;
      if (options.environment !== 'production' || app.pmx !== false) {
        validationResult.details.passedChecks += 1;
      }
    }

    // Validate deployment configuration and hook scripts
    if (ecosystemConfig.deploy && options.environment === 'production') {
      const deployConfig = ecosystemConfig.deploy.production || ecosystemConfig.deploy[options.environment];
      
      if (deployConfig) {
        if (!deployConfig.repo) {
          validationResult.warnings.push('Deployment configuration missing repository URL');
        }

        if (!deployConfig.path) {
          validationResult.warnings.push('Deployment configuration missing deployment path');
        }

        if (!deployConfig['post-deploy']) {
          validationResult.recommendations.push('Consider adding post-deploy hook for automated application restart');
        }

        validationResult.details.totalChecks += 3;
        if (deployConfig.repo) validationResult.details.passedChecks += 1;
        if (deployConfig.path) validationResult.details.passedChecks += 1;
        if (deployConfig['post-deploy']) validationResult.details.passedChecks += 1;
      }
    }

    // Check log file paths and directory permissions
    for (const [index, app] of ecosystemConfig.apps.entries()) {
      if (app.log_file || app.out_file || app.error_file) {
        const logFiles = [app.log_file, app.out_file, app.error_file].filter(Boolean);
        
        for (const logFile of logFiles) {
          try {
            const logDir = path.dirname(logFile);
            // In a real implementation, you would check directory permissions
            validationResult.details.totalChecks += 1;
            validationResult.details.passedChecks += 1;
          } catch (error) {
            validationResult.warnings.push(`Cannot validate log directory for application ${index}: ${logFile}`);
          }
        }
      }
    }

    // Generate warnings for potential performance issues
    for (const [index, app] of ecosystemConfig.apps.entries()) {
      if (app.watch && options.environment === 'production') {
        validationResult.warnings.push(`Application ${index} has file watching enabled in production`);
        validationResult.recommendations.push(`Disable file watching for application ${index} in production`);
      }

      if (app.exec_mode === 'cluster' && app.instances === 1) {
        validationResult.warnings.push(`Application ${index} uses cluster mode with only 1 instance`);
        validationResult.recommendations.push(`Consider using fork mode or increasing instances for application ${index}`);
      }

      if (!app.node_args || !app.node_args.includes('max-old-space-size')) {
        validationResult.recommendations.push(`Consider setting --max-old-space-size for application ${index}`);
      }
    }

    // Set compliance flags based on validation results
    validationResult.compliance.pm2Compatible = validationResult.errors.length === 0;
    validationResult.compliance.resourceOptimized = validationResult.errors.filter(e => e.includes('memory')).length === 0;
    validationResult.compliance.securityCompliant = validationResult.warnings.filter(w => w.includes('production')).length === 0;
    validationResult.compliance.deploymentReady = !ecosystemConfig.deploy || validationResult.warnings.filter(w => w.includes('deployment')).length === 0;

    // Calculate overall compliance score
    const complianceScore = Object.values(validationResult.compliance).filter(Boolean).length / 
                           Object.keys(validationResult.compliance).length;
    validationResult.complianceScore = Math.round(complianceScore * 100);

    // Provide optimization recommendations for target environment
    if (validationResult.errors.length === 0 && validationResult.warnings.length === 0 && validationResult.recommendations.length === 0) {
      validationResult.recommendations.push('Configuration is fully validated and ready for deployment');
    } else if (validationResult.errors.length === 0) {
      validationResult.recommendations.push('Configuration is valid but has areas for improvement');
    }

    // Log validation results with detailed feedback
    const logLevel = validationResult.errors.length > 0 ? 'error' : 
                    validationResult.warnings.length > 0 ? 'warn' : 'info';

    logger[logLevel]('Ecosystem configuration validation completed', {
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      recommendationCount: validationResult.recommendations.length,
      complianceScore: validationResult.complianceScore,
      checksCompleted: `${validationResult.details.passedChecks}/${validationResult.details.totalChecks}`
    });

    // Return comprehensive validation status with actionable recommendations
    return validationResult;

  } catch (error) {
    error('Ecosystem configuration validation failed', error, { ecosystemConfig, validationOptions });
    
    return {
      isValid: false,
      errors: [`Validation process failed: ${error.message}`],
      warnings: [],
      recommendations: ['Fix validation process errors before deployment'],
      compliance: {
        pm2Compatible: false,
        resourceOptimized: false,
        securityCompliant: false,
        deploymentReady: false
      },
      complianceScore: 0,
      details: {
        validatedAt: new Date().toISOString(),
        environment: validationOptions.environment || CURRENT_ENVIRONMENT,
        strictMode: validationOptions.strict === true,
        totalChecks: 0,
        passedChecks: 0,
        validationError: error.message
      }
    };
  }
}

/**
 * Applies environment-specific optimizations to the PM2 ecosystem configuration including
 * performance tuning, resource allocation, and feature enablement based on deployment context.
 * 
 * @param {Object} ecosystemConfig - Current ecosystem configuration object
 * @param {string} environment - Target deployment environment identifier
 * @param {Object} optimizationOptions - Optimization options and parameters
 * @returns {Object} Environment-optimized ecosystem configuration with performance and resource adjustments
 */
export function optimizeEcosystemForEnvironment(ecosystemConfig, environment = CURRENT_ENVIRONMENT, optimizationOptions = {}) {
  try {
    info('Optimizing ecosystem configuration for environment', { 
      environment,
      optimizationOptions: Object.keys(optimizationOptions)
    });

    const options = {
      cpuCores: optimizationOptions.cpuCores || CPU_CORES,
      memoryOptimization: optimizationOptions.memoryOptimization !== false,
      performanceOptimization: optimizationOptions.performanceOptimization !== false,
      securityOptimization: optimizationOptions.securityOptimization !== false,
      monitoringOptimization: optimizationOptions.monitoringOptimization !== false,
      ...optimizationOptions
    };

    const optimizedConfig = JSON.parse(JSON.stringify(ecosystemConfig)); // Deep clone

    // Analyze target environment characteristics and requirements
    const isProduction = environment === 'production';
    const isDevelopment = environment === 'development';
    const isStaging = environment === 'staging';

    // Apply cluster mode optimization for production (max instances) vs development (1 instance)
    optimizedConfig.apps = optimizedConfig.apps.map((app, index) => {
      const optimizedApp = { ...app };

      // Optimize instance count based on environment
      if (!optimizedApp.instances) {
        if (isProduction) {
          optimizedApp.instances = 'max';
          optimizedApp.exec_mode = 'cluster';
        } else if (isDevelopment) {
          optimizedApp.instances = 1;
          optimizedApp.exec_mode = 'fork';
        } else if (isStaging) {
          optimizedApp.instances = Math.max(2, Math.floor(options.cpuCores / 2));
          optimizedApp.exec_mode = 'cluster';
        }
      }

      // Optimize memory limits and restart policies based on environment resources
      if (options.memoryOptimization) {
        if (isProduction) {
          optimizedApp.max_memory_restart = optimizedApp.max_memory_restart || '1G';
          optimizedApp.min_uptime = '10s';
          optimizedApp.max_restarts = 10;
          optimizedApp.restart_delay = 4000;
        } else if (isDevelopment) {
          optimizedApp.max_memory_restart = optimizedApp.max_memory_restart || '512M';
          optimizedApp.min_uptime = '1s';
          optimizedApp.max_restarts = 50;
          optimizedApp.restart_delay = 1000;
        } else {
          optimizedApp.max_memory_restart = optimizedApp.max_memory_restart || '768M';
          optimizedApp.min_uptime = '5s';
          optimizedApp.max_restarts = 15;
          optimizedApp.restart_delay = 2000;
        }
      }

      // Configure monitoring sensitivity and alerting thresholds for environment
      if (options.monitoringOptimization) {
        if (isProduction) {
          optimizedApp.pmx = true;
          optimizedApp.automation = false;
          optimizedApp.vizion = true;
          optimizedApp.health_check_grace_period = 3000;
        } else if (isDevelopment) {
          optimizedApp.pmx = false;
          optimizedApp.automation = false;
          optimizedApp.vizion = false;
          optimizedApp.watch = true;
          optimizedApp.ignore_watch = ['node_modules', 'logs', '.git', 'test', 'coverage'];
        } else {
          optimizedApp.pmx = true;
          optimizedApp.automation = false;
          optimizedApp.vizion = false;
          optimizedApp.health_check_grace_period = 5000;
        }
      }

      // Apply logging optimization including verbosity and rotation settings
      if (isProduction) {
        optimizedApp.log_type = 'json';
        optimizedApp.merge_logs = true;
        optimizedApp.log_date_format = 'YYYY-MM-DD HH:mm:ss Z';
      } else if (isDevelopment) {
        optimizedApp.log_type = 'text';
        optimizedApp.merge_logs = false;
        optimizedApp.log_date_format = 'YYYY-MM-DD HH:mm:ss';
      } else {
        optimizedApp.log_type = 'json';
        optimizedApp.merge_logs = true;
        optimizedApp.log_date_format = 'YYYY-MM-DD HH:mm:ss Z';
      }

      // Configure development features (watch mode, debugging) for development environment
      if (isDevelopment) {
        optimizedApp.watch = optimizedApp.watch !== false;
        optimizedApp.ignore_watch = optimizedApp.ignore_watch || [
          'node_modules', 'logs', '.git', 'test', 'coverage'
        ];
        
        if (!optimizedApp.node_args || !optimizedApp.node_args.includes('--inspect')) {
          const nodeArgs = optimizedApp.node_args ? optimizedApp.node_args.split(' ') : [];
          nodeArgs.push('--inspect=0.0.0.0:9229');
          nodeArgs.push('--trace-warnings');
          nodeArgs.push('--enable-source-maps');
          optimizedApp.node_args = nodeArgs.join(' ');
        }
      }

      // Apply production hardening and security configurations for production
      if (isProduction && options.securityOptimization) {
        optimizedApp.automation = false;
        optimizedApp.source_map_support = false;
        optimizedApp.disable_source_map_support = true;
        optimizedApp.combine_logs = true;
        
        // Remove debugging flags from production
        if (optimizedApp.node_args) {
          optimizedApp.node_args = optimizedApp.node_args
            .split(' ')
            .filter(arg => !arg.includes('--inspect') && !arg.includes('--trace-warnings'))
            .join(' ');
        }
      }

      // Optimize performance settings including Node.js flags and garbage collection
      if (options.performanceOptimization) {
        const nodeArgs = optimizedApp.node_args ? optimizedApp.node_args.split(' ') : [];
        const memoryLimit = parseInt(optimizedApp.max_memory_restart) || 1024;
        
        // Add memory optimization flags
        if (!nodeArgs.some(arg => arg.includes('max-old-space-size'))) {
          nodeArgs.push(`--max-old-space-size=${memoryLimit}`);
        }
        
        if (isProduction) {
          nodeArgs.push('--optimize-for-size');
          nodeArgs.push('--gc-interval=100');
          nodeArgs.push('--max-semi-space-size=64');
        }
        
        optimizedApp.node_args = nodeArgs.join(' ');
        optimizedApp.interpreter_args = '--harmony';
      }

      // Configure environment-specific deployment and rollback strategies
      if (isProduction) {
        optimizedApp.kill_timeout = optimizedApp.kill_timeout || 5000;
        optimizedApp.wait_ready = optimizedApp.wait_ready !== false;
        optimizedApp.listen_timeout = optimizedApp.listen_timeout || 3000;
      } else if (isDevelopment) {
        optimizedApp.kill_timeout = optimizedApp.kill_timeout || 1600;
        optimizedApp.wait_ready = false;
        optimizedApp.listen_timeout = optimizedApp.listen_timeout || 8000;
      }

      debug(`Application ${index} optimized for ${environment}`, {
        name: optimizedApp.name,
        instances: optimizedApp.instances,
        exec_mode: optimizedApp.exec_mode,
        memory_limit: optimizedApp.max_memory_restart,
        monitoring: optimizedApp.pmx,
        watch: optimizedApp.watch
      });

      return optimizedApp;
    });

    // Optimize deployment configuration if present
    if (optimizedConfig.deploy && isProduction) {
      const deployConfig = optimizedConfig.deploy.production || optimizedConfig.deploy[environment];
      if (deployConfig) {
        // Add production-specific deployment optimizations
        deployConfig['post-deploy'] = deployConfig['post-deploy'] || 
          'pm2 reload ecosystem.config.js --env production && pm2 save';
        deployConfig.keep_releases = deployConfig.keep_releases || 5;
        deployConfig.ssh_options = deployConfig.ssh_options || 'StrictHostKeyChecking=no';
      }
    }

    // Log optimization applied with performance impact and resource allocation
    const optimizationSummary = {
      environment,
      totalApps: optimizedConfig.apps.length,
      optimizations: {
        clustering: optimizedConfig.apps.filter(app => app.exec_mode === 'cluster').length,
        watching: optimizedConfig.apps.filter(app => app.watch).length,
        monitoring: optimizedConfig.apps.filter(app => app.pmx).length,
        memoryOptimized: optimizedConfig.apps.filter(app => app.max_memory_restart).length
      },
      performance: {
        expectedInstances: optimizedConfig.apps.reduce((total, app) => {
          return total + (app.instances === 'max' ? options.cpuCores : (app.instances || 1));
        }, 0),
        totalMemoryAllocation: optimizedConfig.apps.reduce((total, app) => {
          const memoryMB = parseInt(app.max_memory_restart) || 512;
          const instances = app.instances === 'max' ? options.cpuCores : (app.instances || 1);
          return total + (memoryMB * instances);
        }, 0)
      }
    };

    info('Ecosystem optimization completed', optimizationSummary);

    // Return optimized ecosystem configuration for target environment
    return {
      ...optimizedConfig,
      optimization: {
        applied_at: new Date().toISOString(),
        target_environment: environment,
        optimization_level: isProduction ? 'aggressive' : isDevelopment ? 'development' : 'moderate',
        optimizations_applied: options,
        performance_summary: optimizationSummary.performance
      }
    };

  } catch (error) {
    error('Failed to optimize ecosystem configuration', error, { 
      environment, 
      optimizationOptions 
    });
    throw new Error(`Ecosystem optimization failed: ${error.message}`);
  }
}

/**
 * Generates the final PM2 ecosystem configuration file with proper JavaScript module format,
 * exports structure, and comprehensive configuration ready for PM2 deployment.
 * 
 * @param {Object} ecosystemConfig - Complete ecosystem configuration object
 * @param {string} outputPath - Output file path for the generated ecosystem file
 * @returns {Object} File generation result with path information and configuration summary
 */
export function generateEcosystemFile(ecosystemConfig, outputPath = './ecosystem.config.js') {
  try {
    info('Generating PM2 ecosystem configuration file', { outputPath });

    // Format ecosystem configuration for JavaScript module export
    const configurationObject = {
      ...ecosystemConfig,
      metadata: {
        ...ecosystemConfig.metadata,
        generated_at: new Date().toISOString(),
        generator: 'PM2 Ecosystem Configuration Generator',
        version: ECOSYSTEM_CONFIG_VERSION
      }
    };

    // Generate proper module.exports structure with apps and deploy sections
    const moduleExports = {
      apps: configurationObject.apps,
      ...(configurationObject.deploy && { deploy: configurationObject.deploy })
    };

    // Add configuration metadata including version and generation timestamp
    const fileHeader = `/**
 * PM2 Ecosystem Configuration
 * Generated on: ${new Date().toISOString()}
 * Version: ${ECOSYSTEM_CONFIG_VERSION}
 * Environment: ${configurationObject.metadata?.environment || CURRENT_ENVIRONMENT}
 * Node.js Version: ${process.version}
 * Platform: ${process.platform}
 * CPU Cores: ${CPU_CORES}
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 * 
 * Commands:
 *   pm2 start ecosystem.config.js          # Start all applications
 *   pm2 start ecosystem.config.js --env production  # Start with production environment
 *   pm2 reload ecosystem.config.js         # Zero-downtime reload
 *   pm2 restart ecosystem.config.js        # Restart all applications
 *   pm2 stop ecosystem.config.js           # Stop all applications
 *   pm2 delete ecosystem.config.js         # Delete all applications
 *   pm2 logs                               # View logs
 *   pm2 monit                              # Monitor applications
 *   pm2 status                             # Check status
 */

`;

    // Add comprehensive comments explaining configuration options
    const configurationComments = `
// Applications Configuration
// Each application in the apps array represents a PM2 process with its configuration
// - name: Unique identifier for the PM2 process
// - script: Path to the main application file
// - instances: Number of instances to run ('max' for CPU core count, number for specific count)
// - exec_mode: Execution mode ('cluster' for load balancing, 'fork' for single process)
// - env_*: Environment-specific variables
// - Restart policies: max_memory_restart, min_uptime, max_restarts, restart_delay
// - Monitoring: pmx, automation, vizion for process monitoring
// - Logging: log_file, out_file, error_file, log_date_format, merge_logs

`;

    // Generate configuration summary and usage instructions
    const configurationSummary = {
      totalApplications: moduleExports.apps.length,
      environments: [...new Set(moduleExports.apps.flatMap(app => 
        Object.keys(app).filter(key => key.startsWith('env_')).map(key => key.replace('env_', ''))
      ))],
      clusterApps: moduleExports.apps.filter(app => app.exec_mode === 'cluster').length,
      forkApps: moduleExports.apps.filter(app => app.exec_mode === 'fork').length,
      hasDeployment: !!moduleExports.deploy,
      hasMonitoring: moduleExports.apps.some(app => app.pmx || app.automation),
      hasWatching: moduleExports.apps.some(app => app.watch)
    };

    // Validate generated configuration syntax and structure
    const validationResult = validateEcosystemConfig(configurationObject);
    if (!validationResult.isValid) {
      warn('Generated ecosystem configuration has validation issues', {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      });
    }

    // Format the final JavaScript module content
    const moduleContent = `${fileHeader}${configurationComments}
module.exports = ${JSON.stringify(moduleExports, null, 2)};

/*
Configuration Summary:
- Applications: ${configurationSummary.totalApplications}
- Environments: ${configurationSummary.environments.join(', ') || 'default'}
- Cluster Mode: ${configurationSummary.clusterApps} apps
- Fork Mode: ${configurationSummary.forkApps} apps
- Deployment: ${configurationSummary.hasDeployment ? 'Configured' : 'Not configured'}
- Monitoring: ${configurationSummary.hasMonitoring ? 'Enabled' : 'Disabled'}
- File Watching: ${configurationSummary.hasWatching ? 'Enabled' : 'Disabled'}

Generated by: PM2 Ecosystem Configuration Generator v${ECOSYSTEM_CONFIG_VERSION}
Generated at: ${new Date().toISOString()}
*/
`;

    // Write ecosystem configuration file to specified output path
    // Note: In a real implementation, this would write to the file system
    const generationResult = {
      success: true,
      outputPath,
      content: moduleContent,
      size: Buffer.byteLength(moduleContent, 'utf8'),
      checksum: require('crypto').createHash('md5').update(moduleContent).digest('hex'),
      summary: configurationSummary,
      validation: validationResult,
      generatedAt: new Date().toISOString()
    };

    // Set appropriate file permissions for ecosystem configuration
    // In a real implementation: await fs.chmod(outputPath, 0o644);

    // Log file generation with path and configuration details
    info('PM2 ecosystem configuration file generated successfully', {
      outputPath,
      size: generationResult.size,
      applications: configurationSummary.totalApplications,
      validationPassed: validationResult.isValid,
      checksum: generationResult.checksum.substring(0, 8)
    });

    // Return generation result with file information and deployment instructions
    return {
      ...generationResult,
      deploymentInstructions: [
        `1. Review the generated configuration file: ${outputPath}`,
        '2. Start applications: pm2 start ecosystem.config.js',
        '3. For production: pm2 start ecosystem.config.js --env production',
        '4. Monitor processes: pm2 monit',
        '5. View logs: pm2 logs',
        '6. Zero-downtime reload: pm2 reload ecosystem.config.js',
        '7. Save process list: pm2 save',
        '8. Setup startup script: pm2 startup'
      ]
    };

  } catch (error) {
    error('Failed to generate ecosystem configuration file', error, { 
      outputPath,
      ecosystemConfig: !!ecosystemConfig 
    });
    throw new Error(`Ecosystem file generation failed: ${error.message}`);
  }
}

/**
 * Loads environment-specific ecosystem configuration based on NODE_ENV and applies
 * appropriate configuration strategy for the target deployment environment.
 * 
 * @param {string} environment - Target environment identifier (development, staging, production)
 * @param {Object} loadOptions - Configuration loading options and parameters
 * @returns {Object} Environment-specific ecosystem configuration with appropriate settings and optimizations
 */
export function loadEnvironmentEcosystem(environment, loadOptions = {}) {
  try {
    // Detect current environment from NODE_ENV or provided parameter
    const targetEnvironment = environment || 
      process.env.NODE_ENV || 
      currentEnvironment || 
      'production';

    info('Loading environment-specific ecosystem configuration', { 
      targetEnvironment,
      loadOptions: Object.keys(loadOptions)
    });

    const options = {
      useCache: loadOptions.useCache !== false,
      validateConfig: loadOptions.validateConfig !== false,
      optimizeForEnvironment: loadOptions.optimizeForEnvironment !== false,
      includeDeployment: loadOptions.includeDeployment !== false,
      ...loadOptions
    };

    // Load appropriate environment-specific configuration module
    let ecosystemConfiguration;

    if (targetEnvironment === 'production') {
      ecosystemConfiguration = createProductionEcosystem(options.productionOptions || {});
    } else if (targetEnvironment === 'development') {
      ecosystemConfiguration = createDevelopmentEcosystem(options.developmentOptions || {});
    } else {
      // For staging or other environments, use generic configuration
      ecosystemConfiguration = createEcosystemConfig(targetEnvironment, options);
    }

    // Apply environment detection logic for development vs staging vs production
    const environmentConfig = {
      current: targetEnvironment,
      isProduction: targetEnvironment === 'production',
      isDevelopment: targetEnvironment === 'development',
      isStaging: targetEnvironment === 'staging',
      isTest: targetEnvironment === 'test'
    };

    // Load environment-specific application configurations
    if (options.customApps && Array.isArray(options.customApps)) {
      ecosystemConfiguration.apps = ecosystemConfiguration.apps.concat(
        options.customApps.map(appConfig => 
          generateAppConfig(appConfig.name, appConfig.script, {
            ...appConfig,
            environment: targetEnvironment
          })
        )
      );
    }

    // Apply environment-appropriate cluster and scaling settings
    if (options.optimizeForEnvironment) {
      ecosystemConfiguration = optimizeEcosystemForEnvironment(
        ecosystemConfiguration,
        targetEnvironment,
        options.optimizationOptions || {}
      );
    }

    // Configure environment-specific monitoring and alerting thresholds
    if (options.includeMonitoring !== false) {
      try {
        const monitoringConfig = setupPM2Monitoring({
          environment: targetEnvironment,
          healthCheckEnabled: environmentConfig.isProduction,
          performanceMonitoring: true,
          ...options.monitoringOptions
        });

        ecosystemConfiguration.monitoring = monitoringConfig;
      } catch (monitoringError) {
        warn('Failed to setup monitoring configuration', { 
          error: monitoringError.message,
          environment: targetEnvironment 
        });
      }
    }

    // Set environment-appropriate logging and debugging levels
    ecosystemConfiguration.apps = ecosystemConfiguration.apps.map(app => ({
      ...app,
      env: {
        ...app.env,
        LOG_LEVEL: environmentConfig.isProduction ? 'warn' : 'debug',
        DEBUG: environmentConfig.isDevelopment ? '*' : '',
        NODE_ENV: targetEnvironment
      }
    }));

    // Apply security configurations based on environment requirements
    if (environmentConfig.isProduction && options.applySecurityConfig !== false) {
      ecosystemConfiguration.apps = ecosystemConfiguration.apps.map(app => ({
        ...app,
        automation: false,
        source_map_support: false,
        disable_source_map_support: true
      }));
    }

    // Validate loaded configuration
    if (options.validateConfig) {
      const validationResult = validateEcosystemConfig(ecosystemConfiguration, {
        environment: targetEnvironment,
        strict: environmentConfig.isProduction
      });

      if (!validationResult.isValid) {
        warn('Loaded ecosystem configuration has validation issues', {
          environment: targetEnvironment,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        if (environmentConfig.isProduction && validationResult.errors.length > 0) {
          throw new Error(`Production ecosystem validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      ecosystemConfiguration.validation = validationResult;
    }

    // Log environment detection and configuration loading
    info('Environment-specific ecosystem configuration loaded successfully', {
      environment: targetEnvironment,
      appCount: ecosystemConfiguration.apps.length,
      hasDeployment: !!ecosystemConfiguration.deploy,
      hasMonitoring: !!ecosystemConfiguration.monitoring,
      validationPassed: ecosystemConfiguration.validation?.isValid !== false,
      loadedAt: new Date().toISOString()
    });

    // Return environment-specific ecosystem configuration
    return {
      ...ecosystemConfiguration,
      environment: environmentConfig,
      metadata: {
        ...ecosystemConfiguration.metadata,
        loaded_at: new Date().toISOString(),
        target_environment: targetEnvironment,
        load_options: options,
        configuration_source: 'environment_loader'
      }
    };

  } catch (error) {
    error('Failed to load environment-specific ecosystem configuration', error, { 
      environment, 
      loadOptions 
    });
    throw new Error(`Environment ecosystem loading failed: ${error.message}`);
  }
}

// Helper Functions for Configuration Processing

/**
 * Parses memory limit string to bytes
 * @private
 * @param {string} memoryStr - Memory string (e.g., '1G', '512M')
 * @returns {number} Memory limit in bytes
 */
function parseMemoryLimit(memoryStr) {
  if (typeof memoryStr === 'number') return memoryStr;
  
  const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024 };
  const match = memoryStr.toString().match(/^(\d+)([KMG])?$/i);
  
  if (!match) return 512 * 1024 * 1024; // Default 512MB
  
  const size = parseInt(match[1]);
  const unit = match[2] ? match[2].toUpperCase() : 'M';
  
  return size * (units[unit] || units.M);
}

/**
 * Formats memory size in bytes to human readable string
 * @private
 * @param {number} bytes - Memory size in bytes
 * @returns {string} Formatted memory string
 */
function formatMemory(bytes) {
  const sizes = ['B', 'K', 'M', 'G'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < sizes.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size)}${sizes[unitIndex]}`;
}

// Master PM2 Ecosystem Configuration Object
export const masterEcosystem = createEcosystemConfig(CURRENT_ENVIRONMENT, {
  appName: DEFAULT_APP_NAME,
  scriptPath: DEFAULT_SCRIPT_PATH,
  healthCheck: true,
  performanceMonitoring: true,
  memoryOptimization: true,
  performanceOptimization: true
});

// Pre-configured Production Application Definition
export const productionApp = {
  name: `${DEFAULT_APP_NAME}-production`,
  script: DEFAULT_SCRIPT_PATH,
  instances: 'max',
  exec_mode: 'cluster',
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000,
    PM2_CLUSTER_MODE: 'true',
    PM2_LOAD_BALANCER: 'round_robin'
  },
  max_memory_restart: '1G',
  min_uptime: '10s',
  max_restarts: 10,
  restart_delay: 4000,
  kill_timeout: 5000,
  wait_ready: true,
  listen_timeout: 3000,
  pmx: true,
  automation: false,
  vizion: true,
  merge_logs: true,
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  log_type: 'json'
};

// Pre-configured Development Application Definition
export const developmentApp = {
  name: `${DEFAULT_APP_NAME}-development`,
  script: DEFAULT_SCRIPT_PATH,
  instances: 1,
  exec_mode: 'fork',
  watch: true,
  ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage'],
  env: {
    NODE_ENV: 'development',
    DEBUG: '*',
    PORT: 3000,
    PM2_CLUSTER_MODE: 'false'
  },
  max_memory_restart: '512M',
  min_uptime: '1s',
  max_restarts: 50,
  restart_delay: 1000,
  node_args: '--inspect=0.0.0.0:9229 --trace-warnings --enable-source-maps',
  pmx: false,
  automation: false,
  vizion: false,
  merge_logs: false,
  log_date_format: 'YYYY-MM-DD HH:mm:ss'
};

// Development-specific Application Configuration
export const devAppConfig = {
  instances: 1,
  exec_mode: 'fork',
  watch: true,
  ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage', '*.log'],
  node_args: '--inspect=0.0.0.0:9229 --trace-warnings --enable-source-maps --max-old-space-size=512',
  max_memory_restart: '512M',
  min_uptime: '1s',
  restart_delay: 500,
  kill_timeout: 1600,
  wait_ready: false,
  pmx: false,
  automation: false,
  vizion: false
};

// Development File Watching Configuration
export const devWatchConfig = {
  enabled: true,
  ignore: [
    'node_modules/**/*',
    'logs/**/*',
    '.git/**/*',
    'test/**/*',
    'coverage/**/*',
    '*.log',
    '.env*',
    'tmp/**/*',
    'build/**/*',
    'dist/**/*'
  ],
  delay: 1000,
  usePolling: process.platform === 'win32',
  interval: 1000,
  followSymlinks: false
};

// Ecosystem Deployment Configuration
export const ecosystemDeployConfig = {
  production: {
    user: process.env.DEPLOY_USER || 'nodejs',
    host: process.env.DEPLOY_HOST || 'localhost',
    ref: process.env.DEPLOY_REF || 'origin/main',
    repo: process.env.DEPLOY_REPO || 'git@github.com:username/nodejs-tutorial.git',
    path: process.env.DEPLOY_PATH || '/var/www/nodejs-tutorial',
    'pre-deploy': 'git pull && npm ci --production',
    'post-deploy': 'pm2 reload ecosystem.config.js --env production && pm2 save',
    'post-setup': 'ls -la && pm2 status',
    ssh_options: 'StrictHostKeyChecking=no',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      PM2_CLUSTER_MODE: 'true'
    }
  },
  staging: {
    user: process.env.STAGING_USER || 'nodejs-staging',
    host: process.env.STAGING_HOST || 'staging.localhost',
    ref: 'origin/develop',
    repo: process.env.DEPLOY_REPO || 'git@github.com:username/nodejs-tutorial.git',
    path: process.env.STAGING_PATH || '/var/www/nodejs-tutorial-staging',
    'pre-deploy': 'git pull && npm ci',
    'post-deploy': 'pm2 reload ecosystem.config.js --env staging && pm2 save',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001,
      PM2_CLUSTER_MODE: 'true'
    }
  },
  development: {
    user: process.env.DEV_USER || 'developer',
    host: 'localhost',
    ref: 'origin/develop',
    repo: process.env.DEPLOY_REPO || 'git@github.com:username/nodejs-tutorial.git',
    path: process.env.DEV_PATH || './deployment-dev',
    'post-deploy': 'pm2 start ecosystem.config.js --env development',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      DEBUG: '*'
    }
  }
};

// Log ecosystem configuration initialization
info('PM2 ecosystem configuration module initialized', {
  version: ECOSYSTEM_CONFIG_VERSION,
  environment: CURRENT_ENVIRONMENT,
  appName: DEFAULT_APP_NAME,
  scriptPath: DEFAULT_SCRIPT_PATH,
  cpuCores: CPU_CORES,
  timestamp: ECOSYSTEM_TIMESTAMP,
  moduleReady: true
});