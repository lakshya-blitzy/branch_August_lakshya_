/**
 * @fileoverview PM2 Development Ecosystem Configuration Module
 * @description Comprehensive development-optimized PM2 process management configuration
 * providing single-instance execution, file watching, hot reload capabilities, debugging
 * support, and development-friendly logging for enhanced developer experience and rapid
 * iteration cycles in the Node.js tutorial project.
 * 
 * This configuration implements development-specific PM2 settings that facilitate debugging,
 * testing, and rapid development workflow while maintaining compatibility with production
 * PM2 cluster architecture. Features include Node.js Inspector integration, intelligent
 * file watching patterns, development environment variables, and comprehensive logging.
 * 
 * Technology Integration:
 * - PM2 v6.0.8 process management with development optimizations
 * - Node.js v22.x LTS with debugging and hot reload support
 * - Express.js v5.1.0 development middleware integration
 * - ES Modules with development-friendly error handling
 * - Cross-platform development environment compatibility
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// Node.js built-in module imports with version comments
import path from 'node:path'; // Node.js built-in - Path manipulation utilities for script resolution
import process from 'node:process'; // Node.js built-in - Process environment and development configuration

// Internal imports from master ecosystem and configuration modules
import {
  masterEcosystem,
  createDevelopmentEcosystem,
  configureDevelopmentApp,
  developmentApp,
  devAppConfig,
  devWatchConfig
} from './ecosystem.config.js';

import {
  developmentConfig,
  instances,
  exec_mode,
  watch
} from '../config/pm2.js';

import {
  developmentClusterConfig,
  instances as clusterInstances,
  exec_mode as clusterExecMode,
  watch as clusterWatch
} from './cluster.config.js';

import {
  environmentConfig,
  isDevelopment,
  server,
  pm2,
  logging
} from '../config/environment.js';

import logger from '../utils/logger.js';

import {
  DEVELOPMENT_CONSTANTS,
  DEV_PORT,
  DEV_WATCH_PATTERNS,
  DEV_IGNORE_PATTERNS
} from '../utils/constants.js';

// Global development configuration constants
const DEV_APP_NAME = process.env.PM2_DEV_APP_NAME || 'nodejs-tutorial-dev';
const DEV_SCRIPT_PATH = path.resolve(process.cwd(), 'server.js');
const DEV_INSTANCES = 1;
const DEV_EXEC_MODE = 'fork';
const DEV_WATCH_ENABLED = true;
const DEV_NODE_ARGS = '--inspect --max-old-space-size=512';

/**
 * Creates comprehensive development-specific PM2 ecosystem configuration with single 
 * instance execution, file watching, debugging support, and hot reload capabilities 
 * optimized for development workflow and rapid iteration cycles.
 * 
 * @param {Object} [devOptions={}] - Development configuration options
 * @param {string} [devOptions.appName] - Application name override for development
 * @param {string} [devOptions.scriptPath] - Script path override for development entry point
 * @param {boolean} [devOptions.enableWatching] - Enable/disable file watching functionality
 * @param {boolean} [devOptions.enableDebugging] - Enable/disable Node.js debugging features
 * @param {Object} [devOptions.environmentVars] - Additional environment variables for development
 * @returns {Object} Complete development ecosystem configuration with single instance, 
 *                   file watching, debugging, and development-optimized settings
 */
export function createDevelopmentEcosystem(devOptions = {}) {
  try {
    logger.info('Creating development PM2 ecosystem configuration', {
      environment: environmentConfig.currentEnvironment,
      isDevelopment: environmentConfig.isDevelopment,
      options: devOptions
    });

    // Load development configuration from environmentConfig.pm2 for development-specific settings
    const developmentPM2Config = environmentConfig.pm2 || {};
    const developmentServerConfig = environmentConfig.server || {};
    const developmentLoggingConfig = environmentConfig.logging || {};

    // Configure single instance mode (instances: 1) for development debugging compatibility
    const instanceConfig = {
      instances: devOptions.instances || DEV_INSTANCES,
      exec_mode: devOptions.exec_mode || DEV_EXEC_MODE,
      autorestart: devOptions.autorestart !== false,
      max_restarts: devOptions.max_restarts || 3,
      restart_delay: devOptions.restart_delay || 1000
    };

    // Set execution mode to 'fork' for optimal debugging experience and development workflow
    logger.debug('Configuring development execution mode', {
      execMode: instanceConfig.exec_mode,
      instances: instanceConfig.instances,
      debuggingOptimized: true
    });

    // Enable comprehensive file watching with intelligent ignore patterns for node_modules and logs
    const watchingConfig = await setupDevelopmentWatching({
      enabled: devOptions.enableWatching !== false,
      patterns: devOptions.watchPatterns || DEV_WATCH_PATTERNS,
      ignorePatterns: devOptions.ignorePatterns || DEV_IGNORE_PATTERNS,
      watchDelay: devOptions.watchDelay || 1000,
      persistentWatching: true
    });

    // Configure Node.js debugging flags including --inspect for Chrome DevTools integration
    const debuggingConfig = await configureDevelopmentDebugging({
      enabled: devOptions.enableDebugging !== false,
      inspectorPort: devOptions.inspectorPort || 9229,
      maxOldSpaceSize: devOptions.maxOldSpaceSize || 512,
      debugFlags: devOptions.debugFlags || ['--inspect'],
      sourceMaps: devOptions.sourceMaps !== false
    });

    // Set development environment variables including NODE_ENV=development and debugging flags
    const developmentEnvironment = {
      NODE_ENV: 'development',
      PORT: devOptions.port || developmentServerConfig.port || DEV_PORT,
      DEBUG: devOptions.debug || '*',
      PM2_DEV_MODE: 'true',
      DEVELOPMENT_MODE: 'true',
      LOG_LEVEL: 'debug',
      HOT_RELOAD_ENABLED: 'true',
      DEBUGGING_ENABLED: debuggingConfig.enabled.toString(),
      ...devOptions.environmentVars
    };

    // Configure development logging with verbose output and console display for immediate feedback
    const loggingConfig = await createDevelopmentLogging({
      level: 'debug',
      console: true,
      format: 'pretty',
      timestamps: true,
      colors: true,
      outputFile: developmentLoggingConfig.outputFile || './logs/dev/app.log',
      errorFile: developmentLoggingConfig.errorFile || './logs/dev/error.log',
      combinedFile: developmentLoggingConfig.combinedFile || './logs/dev/combined.log'
    });

    // Set development-appropriate memory limits and restart policies for rapid iteration
    const memoryManagement = {
      max_memory_restart: devOptions.maxMemory || '512M',
      node_args: debuggingConfig.nodeArgs,
      kill_timeout: devOptions.killTimeout || 5000,
      wait_ready: devOptions.waitReady || true,
      listen_timeout: devOptions.listenTimeout || 3000
    };

    // Enable hot reload capabilities with automatic restart on file changes
    const hotReloadConfig = {
      watch: watchingConfig.enabled,
      watch_delay: watchingConfig.watchDelay,
      ignore_watch: watchingConfig.ignorePatterns,
      watch_options: watchingConfig.watchOptions,
      restart_on_change: true,
      graceful_restart: true
    };

    // Configure development-specific health monitoring with relaxed thresholds
    const healthMonitoring = {
      min_uptime: devOptions.minUptime || '5s',
      max_restarts: instanceConfig.max_restarts,
      health_check_interval: devOptions.healthCheckInterval || 10000,
      health_check_grace_period: devOptions.healthCheckGracePeriod || 5000
    };

    // Log development ecosystem creation with configuration details and debugging information
    logger.info('Development ecosystem configuration created', {
      appName: devOptions.appName || DEV_APP_NAME,
      scriptPath: devOptions.scriptPath || DEV_SCRIPT_PATH,
      watching: watchingConfig.enabled,
      debugging: debuggingConfig.enabled,
      environment: developmentEnvironment.NODE_ENV,
      port: developmentEnvironment.PORT
    });

    // Return complete development ecosystem configuration ready for PM2 development deployment
    const developmentEcosystem = {
      apps: [{
        // Basic application configuration
        name: devOptions.appName || DEV_APP_NAME,
        script: devOptions.scriptPath || DEV_SCRIPT_PATH,
        cwd: process.cwd(),
        
        // Instance and execution configuration
        ...instanceConfig,
        
        // Environment configuration
        env: developmentEnvironment,
        
        // Memory and performance configuration
        ...memoryManagement,
        
        // File watching and hot reload configuration
        ...hotReloadConfig,
        
        // Logging configuration
        ...loggingConfig,
        
        // Health monitoring configuration
        ...healthMonitoring,
        
        // Development-specific settings
        source_map_support: true,
        merge_logs: true,
        time: true,
        automation: false,
        pmx: false,
        vizion: false,
        
        // Error handling configuration
        error_file: loggingConfig.error_file,
        out_file: loggingConfig.out_file,
        log_file: loggingConfig.log_file,
        log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
        log_type: 'json',
        
        // Process management
        instance_var: 'DEV_INSTANCE_ID',
        increment_var: 'DEV_PORT_INCREMENT',
        
        // Additional development options
        ...devOptions.additionalConfig
      }],
      
      // Development-specific deploy configuration (disabled for local development)
      deploy: undefined
    };

    return developmentEcosystem;

  } catch (error) {
    logger.error('Error creating development ecosystem configuration', {
      error: error.message,
      stack: error.stack,
      options: devOptions
    });
    throw new Error(`Failed to create development ecosystem: ${error.message}`);
  }
}

/**
 * Configures individual development application settings within the PM2 ecosystem with 
 * debugging features, file watching capabilities, and development-optimized parameters 
 * for enhanced developer productivity and rapid iteration cycles.
 * 
 * @param {string} appName - Application name for PM2 process identification
 * @param {string} scriptPath - Path to the main application script entry point
 * @param {Object} [devAppOptions={}] - Development application configuration options
 * @returns {Object} Complete development application configuration with debugging, 
 *                   file watching, hot reload, and development-specific optimizations
 */
export function configureDevelopmentApp(appName, scriptPath, devAppOptions = {}) {
  try {
    logger.debug('Configuring development application settings', {
      appName,
      scriptPath,
      options: devAppOptions
    });

    // Validate application name and script path for development environment setup
    if (!appName || typeof appName !== 'string') {
      throw new Error('Application name is required and must be a string');
    }

    if (!scriptPath || typeof scriptPath !== 'string') {
      throw new Error('Script path is required and must be a string');
    }

    // Configure application name with development environment suffix (-dev)
    const developmentAppName = appName.endsWith('-dev') ? appName : `${appName}-dev`;

    // Set script path to main application entry point (server.js) with path validation
    const resolvedScriptPath = path.resolve(scriptPath);
    logger.debug('Script path resolved', { 
      original: scriptPath, 
      resolved: resolvedScriptPath 
    });

    // Configure fork execution mode for optimal debugging and development experience
    const executionConfig = {
      exec_mode: 'fork',
      instances: 1,
      autorestart: devAppOptions.autorestart !== false,
      max_restarts: devAppOptions.maxRestarts || 5,
      restart_delay: devAppOptions.restartDelay || 1000
    };

    // Set single instance count (1) for development debugging compatibility
    logger.debug('Single instance configuration for debugging compatibility', {
      instances: executionConfig.instances,
      execMode: executionConfig.exec_mode
    });

    // Enable comprehensive file watching with configurable watch patterns and ignore lists
    const fileWatchingConfig = {
      watch: devAppOptions.watch !== false,
      watch_delay: devAppOptions.watchDelay || 1000,
      ignore_watch: devAppOptions.ignoreWatch || [
        'node_modules',
        'logs',
        '.git',
        'test',
        'coverage',
        '*.log',
        '.nyc_output',
        'dist',
        'build'
      ],
      watch_options: {
        persistent: true,
        ignoreInitial: true,
        followSymlinks: false,
        ...devAppOptions.watchOptions
      }
    };

    // Configure development environment variables including NODE_ENV=development and debugging flags
    const developmentEnvironmentVars = {
      NODE_ENV: 'development',
      PORT: devAppOptions.port || server?.port || DEV_PORT,
      DEBUG: devAppOptions.debug || '*',
      PM2_DEV_MODE: 'true',
      DEVELOPMENT_MODE: 'true',
      LOG_LEVEL: 'debug',
      APP_NAME: developmentAppName,
      SCRIPT_PATH: resolvedScriptPath,
      ...devAppOptions.env
    };

    // Set up Node.js debugging support with --inspect flag for Chrome DevTools integration
    const debuggingNodeArgs = [
      '--inspect=' + (devAppOptions.inspectorPort || 9229),
      '--max-old-space-size=' + (devAppOptions.maxOldSpaceSize || 512),
      '--enable-source-maps',
      '--trace-warnings',
      ...(devAppOptions.additionalNodeArgs || [])
    ].join(' ');

    // Configure development logging with verbose output, console display, and structured formatting
    const developmentLogging = {
      log_file: devAppOptions.logFile || './logs/dev/combined.log',
      out_file: devAppOptions.outFile || './logs/dev/out.log',
      error_file: devAppOptions.errorFile || './logs/dev/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      log_type: 'json',
      merge_logs: true,
      time: true
    };

    // Set development-appropriate memory limits (512MB) and lenient restart policies
    const developmentResourceLimits = {
      max_memory_restart: devAppOptions.maxMemory || '512M',
      kill_timeout: devAppOptions.killTimeout || 5000,
      wait_ready: devAppOptions.waitReady !== false,
      listen_timeout: devAppOptions.listenTimeout || 3000
    };

    // Enable automatic restart on file changes with configurable delay for stable hot reload
    const hotReloadSettings = {
      restart_on_change: true,
      graceful_restart: true,
      shutdown_with_message: true,
      ready_event: devAppOptions.readyEvent || 'ready'
    };

    // Configure development health monitoring with relaxed thresholds and debugging information
    const developmentHealthMonitoring = {
      min_uptime: devAppOptions.minUptime || '5s',
      health_check_grace_period: devAppOptions.healthCheckGracePeriod || 5000,
      health_check_interval: devAppOptions.healthCheckInterval || 10000,
      disable_trace: false,
      trace: true
    };

    // Return complete development application configuration optimized for developer experience
    const developmentAppConfig = {
      name: developmentAppName,
      script: resolvedScriptPath,
      cwd: process.cwd(),
      
      // Execution configuration
      ...executionConfig,
      
      // File watching configuration
      ...fileWatchingConfig,
      
      // Environment variables
      env: developmentEnvironmentVars,
      
      // Node.js debugging configuration
      node_args: debuggingNodeArgs,
      
      // Logging configuration
      ...developmentLogging,
      
      // Resource limits
      ...developmentResourceLimits,
      
      // Hot reload settings
      ...hotReloadSettings,
      
      // Health monitoring
      ...developmentHealthMonitoring,
      
      // Development-specific PM2 settings
      source_map_support: true,
      automation: false,
      pmx: false,
      vizion: false,
      instance_var: 'DEV_INSTANCE_ID'
    };

    logger.info('Development application configuration completed', {
      name: developmentAppConfig.name,
      script: developmentAppConfig.script,
      watch: developmentAppConfig.watch,
      debugging: debuggingNodeArgs.includes('--inspect')
    });

    return developmentAppConfig;

  } catch (error) {
    logger.error('Error configuring development application', {
      error: error.message,
      appName,
      scriptPath,
      options: devAppOptions
    });
    throw new Error(`Failed to configure development application: ${error.message}`);
  }
}

/**
 * Configures comprehensive file watching system for development environment with 
 * intelligent ignore patterns, watch delays, and restart policies to enable efficient 
 * hot reload functionality and rapid development iteration.
 * 
 * @param {Object} [watchConfig={}] - File watching configuration options
 * @returns {Object} Development file watching configuration with patterns, ignore rules, 
 *                   delays, and restart policies optimized for development workflow
 */
export function setupDevelopmentWatching(watchConfig = {}) {
  try {
    logger.debug('Setting up development file watching system', { config: watchConfig });

    // Enable file watching with watch: true for automatic application restart on code changes
    const watchingEnabled = watchConfig.enabled !== false;

    // Configure comprehensive ignore patterns for node_modules, logs, test files, and build artifacts
    const defaultIgnorePatterns = [
      'node_modules/**',
      'logs/**',
      '.git/**',
      'test/**',
      'tests/**',
      'coverage/**',
      '.nyc_output/**',
      'dist/**',
      'build/**',
      '*.log',
      '*.tmp',
      '*.pid',
      '.DS_Store',
      'Thumbs.db',
      '.env.local',
      '.env.*.local',
      '*.swp',
      '*.swo',
      '*~',
      '.vscode/**',
      '.idea/**',
      '*.sublime-*'
    ];

    // Set watch patterns to include source code files (.js, .mjs, .json, .env)
    const defaultWatchPatterns = [
      '**/*.js',
      '**/*.mjs',
      '**/*.json',
      '.env',
      '.env.development',
      'package.json',
      'package-lock.json',
      'ecosystem.config.js',
      'src/**/*'
    ];

    const watchPatterns = watchConfig.patterns || defaultWatchPatterns;
    const ignorePatterns = [
      ...defaultIgnorePatterns,
      ...(watchConfig.ignorePatterns || [])
    ];

    // Configure watch delay (1000ms) to prevent excessive restarts during rapid file changes
    const watchDelay = watchConfig.watchDelay || 1000;

    // Set up watch options including persistent watching and recursive directory monitoring
    const watchOptions = {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: watchConfig.depth || 10,
      awaitWriteFinish: {
        stabilityThreshold: watchConfig.stabilityThreshold || 2000,
        pollInterval: watchConfig.pollInterval || 100
      },
      ...watchConfig.watchOptions
    };

    // Configure restart policies specific to file change events with graceful restart
    const restartPolicies = {
      restart_on_change: watchingEnabled,
      graceful_restart: watchConfig.gracefulRestart !== false,
      shutdown_with_message: watchConfig.shutdownWithMessage !== false,
      ready_event: watchConfig.readyEvent || 'ready'
    };

    // Set up watch event logging for debugging file watching behavior and performance
    const watchEventLogging = {
      log_watch_events: watchConfig.logWatchEvents !== false,
      watch_event_log_level: watchConfig.watchEventLogLevel || 'debug',
      log_ignored_files: watchConfig.logIgnoredFiles || false
    };

    // Configure watch exclusions for temporary files, IDE files, and system files
    const exclusionRules = {
      exclude_temporary_files: true,
      exclude_ide_files: true,
      exclude_system_files: true,
      exclude_log_files: true,
      custom_exclusions: watchConfig.customExclusions || []
    };

    // Return comprehensive file watching configuration for development hot reload
    const developmentWatchConfig = {
      enabled: watchingEnabled,
      patterns: watchPatterns,
      ignorePatterns: ignorePatterns,
      watchDelay: watchDelay,
      watchOptions: watchOptions,
      restartPolicies: restartPolicies,
      eventLogging: watchEventLogging,
      exclusionRules: exclusionRules,
      
      // PM2-specific watch configuration
      watch: watchingEnabled,
      watch_delay: watchDelay,
      ignore_watch: ignorePatterns,
      watch_options: watchOptions
    };

    logger.info('Development file watching configured', {
      enabled: watchingEnabled,
      watchDelay: watchDelay,
      patternsCount: watchPatterns.length,
      ignoreCount: ignorePatterns.length
    });

    return developmentWatchConfig;

  } catch (error) {
    logger.error('Error setting up development file watching', {
      error: error.message,
      config: watchConfig
    });
    throw new Error(`Failed to setup development watching: ${error.message}`);
  }
}

/**
 * Configures Node.js debugging capabilities for development environment including 
 * Inspector integration, debug flags, memory settings, and debugging-optimized 
 * runtime configuration for enhanced development experience.
 * 
 * @param {Object} [debugConfig={}] - Development debugging configuration options
 * @returns {Object} Development debugging configuration with Inspector integration, 
 *                   debug flags, and runtime optimizations for debugging workflow
 */
export function configureDevelopmentDebugging(debugConfig = {}) {
  try {
    logger.debug('Configuring Node.js debugging capabilities', { config: debugConfig });

    const debuggingEnabled = debugConfig.enabled !== false;

    // Configure Node.js Inspector with --inspect flag for Chrome DevTools integration
    const inspectorConfig = {
      enabled: debuggingEnabled,
      port: debugConfig.inspectorPort || 9229,
      host: debugConfig.inspectorHost || '127.0.0.1',
      break_on_start: debugConfig.breakOnStart || false
    };

    // Set debug-appropriate memory limits (--max-old-space-size=512) for development
    const memorySettings = {
      maxOldSpaceSize: debugConfig.maxOldSpaceSize || 512,
      maxSemiSpaceSize: debugConfig.maxSemiSpaceSize || 64,
      optimizeForSize: debugConfig.optimizeForSize || false
    };

    // Configure debugging environment variables including DEBUG=* for verbose logging
    const debugEnvironmentVars = {
      DEBUG: debugConfig.debug || '*',
      NODE_DEBUG: debugConfig.nodeDebug || '',
      DEBUG_COLORS: debugConfig.debugColors !== false ? 'true' : 'false',
      DEBUG_DEPTH: debugConfig.debugDepth || '10',
      DEBUG_SHOW_HIDDEN: debugConfig.debugShowHidden || 'false'
    };

    // Set up source map support for debugging TypeScript and transpiled code
    const sourceMappingConfig = {
      enableSourceMaps: debugConfig.sourceMaps !== false,
      sourceMapCacheSize: debugConfig.sourceMapCacheSize || 100,
      sourceMapSupport: true
    };

    // Configure debugging-friendly error stack traces with full path information
    const errorHandlingConfig = {
      traceWarnings: debugConfig.traceWarnings !== false,
      traceDeprecation: debugConfig.traceDeprecation !== false,
      throwDeprecation: debugConfig.throwDeprecation || false,
      traceProcessWarnings: debugConfig.traceProcessWarnings !== false
    };

    // Set up development-specific performance monitoring with debugging metrics
    const performanceMonitoring = {
      enablePerfHooks: debugConfig.enablePerfHooks || false,
      enableCpuProfiling: debugConfig.enableCpuProfiling || false,
      enableHeapProfiling: debugConfig.enableHeapProfiling || false,
      performanceTimeOrigin: debugConfig.performanceTimeOrigin || true
    };

    // Configure debugging output formatting for enhanced readability and analysis
    const outputFormatting = {
      colors: debugConfig.colors !== false,
      timestamps: debugConfig.timestamps !== false,
      prettyPrint: debugConfig.prettyPrint !== false,
      logLevel: debugConfig.logLevel || 'debug'
    };

    // Build Node.js arguments for debugging configuration
    const nodeArgs = [];
    
    if (debuggingEnabled) {
      nodeArgs.push(`--inspect=${inspectorConfig.host}:${inspectorConfig.port}`);
      
      if (inspectorConfig.break_on_start) {
        nodeArgs.push('--inspect-brk');
      }
    }
    
    nodeArgs.push(`--max-old-space-size=${memorySettings.maxOldSpaceSize}`);
    nodeArgs.push(`--max-semi-space-size=${memorySettings.maxSemiSpaceSize}`);
    
    if (sourceMappingConfig.enableSourceMaps) {
      nodeArgs.push('--enable-source-maps');
    }
    
    if (errorHandlingConfig.traceWarnings) {
      nodeArgs.push('--trace-warnings');
    }
    
    if (errorHandlingConfig.traceDeprecation) {
      nodeArgs.push('--trace-deprecation');
    }
    
    if (errorHandlingConfig.throwDeprecation) {
      nodeArgs.push('--throw-deprecation');
    }
    
    if (performanceMonitoring.enablePerfHooks) {
      nodeArgs.push('--perf-basic-prof');
    }
    
    // Add any additional node arguments
    if (debugConfig.additionalNodeArgs) {
      nodeArgs.push(...debugConfig.additionalNodeArgs);
    }

    // Return comprehensive debugging configuration for development environment
    const developmentDebuggingConfig = {
      enabled: debuggingEnabled,
      inspector: inspectorConfig,
      memory: memorySettings,
      environment: debugEnvironmentVars,
      sourceMaps: sourceMappingConfig,
      errorHandling: errorHandlingConfig,
      performance: performanceMonitoring,
      outputFormatting: outputFormatting,
      nodeArgs: nodeArgs.join(' '),
      
      // Additional debugging utilities
      utilities: {
        enableRepl: debugConfig.enableRepl || false,
        enableProfiler: debugConfig.enableProfiler || false,
        enableTracing: debugConfig.enableTracing || false
      }
    };

    logger.info('Development debugging configuration completed', {
      enabled: debuggingEnabled,
      inspectorPort: inspectorConfig.port,
      maxMemory: memorySettings.maxOldSpaceSize,
      sourceMaps: sourceMappingConfig.enableSourceMaps
    });

    return developmentDebuggingConfig;

  } catch (error) {
    logger.error('Error configuring development debugging', {
      error: error.message,
      config: debugConfig
    });
    throw new Error(`Failed to configure development debugging: ${error.message}`);
  }
}

/**
 * Creates development-specific logging configuration with verbose output, console display, 
 * structured formatting, and debugging information to provide immediate feedback and 
 * comprehensive development workflow visibility.
 * 
 * @param {Object} [loggingOptions={}] - Development logging configuration options
 * @returns {Object} Development logging configuration with verbose output, console display, 
 *                   and debugging integration optimized for developer experience
 */
export function createDevelopmentLogging(loggingOptions = {}) {
  try {
    logger.debug('Creating development logging configuration', { options: loggingOptions });

    // Configure verbose logging levels including debug, info, warn, and error for development
    const loggingLevels = {
      level: loggingOptions.level || 'debug',
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        verbose: 4,
        silly: 5
      }
    };

    // Set up console output with structured formatting and colored output for immediate feedback
    const consoleOutput = {
      enabled: loggingOptions.console !== false,
      colorize: loggingOptions.colors !== false,
      timestamp: loggingOptions.timestamps !== false,
      format: loggingOptions.format || 'pretty',
      handleExceptions: loggingOptions.handleExceptions !== false,
      handleRejections: loggingOptions.handleRejections !== false
    };

    // Configure file logging with development-appropriate rotation and retention policies
    const fileLogging = {
      enabled: loggingOptions.fileLogging !== false,
      outputFile: loggingOptions.outputFile || './logs/dev/app.log',
      errorFile: loggingOptions.errorFile || './logs/dev/error.log',
      combinedFile: loggingOptions.combinedFile || './logs/dev/combined.log',
      maxSize: loggingOptions.maxSize || '10m',
      maxFiles: loggingOptions.maxFiles || 5,
      tailable: loggingOptions.tailable !== false,
      zippedArchive: loggingOptions.zippedArchive || false
    };

    // Set up request logging with detailed timing and debugging information
    const requestLogging = {
      enabled: loggingOptions.requestLogging !== false,
      format: loggingOptions.requestFormat || 'combined',
      includeUserAgent: loggingOptions.includeUserAgent !== false,
      includeRemoteAddr: loggingOptions.includeRemoteAddr !== false,
      includeResponseTime: loggingOptions.includeResponseTime !== false,
      buffer: loggingOptions.buffer || false
    };

    // Configure error logging with full stack traces and context information
    const errorLogging = {
      enabled: loggingOptions.errorLogging !== false,
      includeStack: loggingOptions.includeStack !== false,
      stackDepth: loggingOptions.stackDepth || 10,
      includeContext: loggingOptions.includeContext !== false,
      contextDepth: loggingOptions.contextDepth || 3
    };

    // Set up file watching event logging for monitoring hot reload behavior
    const fileWatchLogging = {
      enabled: loggingOptions.fileWatchLogging !== false,
      logLevel: loggingOptions.fileWatchLogLevel || 'debug',
      includeFileDetails: loggingOptions.includeFileDetails !== false,
      logIgnoredFiles: loggingOptions.logIgnoredFiles || false
    };

    // Configure PM2 log integration with development-specific log management
    const pm2LogIntegration = {
      logFile: fileLogging.combinedFile,
      outFile: loggingOptions.outFile || './logs/dev/out.log',
      errorFile: fileLogging.errorFile,
      logDateFormat: loggingOptions.logDateFormat || 'YYYY-MM-DD HH:mm:ss.SSS Z',
      logType: loggingOptions.logType || 'json',
      mergeLogs: loggingOptions.mergeLogs !== false,
      time: loggingOptions.time !== false
    };

    // Return complete development logging configuration for enhanced developer experience
    const developmentLoggingConfig = {
      // Logging levels configuration
      levels: loggingLevels,
      
      // Console output configuration
      console: consoleOutput,
      
      // File logging configuration
      file: fileLogging,
      
      // Request logging configuration
      request: requestLogging,
      
      // Error logging configuration
      error: errorLogging,
      
      // File watch logging configuration
      fileWatch: fileWatchLogging,
      
      // PM2 integration configuration
      pm2: pm2LogIntegration,
      
      // PM2-specific log settings
      log_file: pm2LogIntegration.logFile,
      out_file: pm2LogIntegration.outFile,
      error_file: pm2LogIntegration.errorFile,
      log_date_format: pm2LogIntegration.logDateFormat,
      log_type: pm2LogIntegration.logType,
      merge_logs: pm2LogIntegration.mergeLogs,
      time: pm2LogIntegration.time,
      
      // Additional development logging features
      features: {
        performanceLogging: loggingOptions.performanceLogging !== false,
        memoryLogging: loggingOptions.memoryLogging !== false,
        debugPointLogging: loggingOptions.debugPointLogging !== false,
        moduleLoading: loggingOptions.moduleLoading || false
      }
    };

    logger.info('Development logging configuration created', {
      level: loggingLevels.level,
      console: consoleOutput.enabled,
      fileLogging: fileLogging.enabled,
      requestLogging: requestLogging.enabled
    });

    return developmentLoggingConfig;

  } catch (error) {
    logger.error('Error creating development logging configuration', {
      error: error.message,
      options: loggingOptions
    });
    throw new Error(`Failed to create development logging: ${error.message}`);
  }
}

/**
 * Validates development PM2 configuration ensuring all development-specific settings 
 * are properly configured, debugging features are accessible, and development workflow 
 * requirements are met for optimal developer experience.
 * 
 * @param {Object} devConfig - Development configuration to validate
 * @returns {Object} Development configuration validation result with status, warnings, 
 *                   and optimization recommendations for development workflow
 */
export function validateDevelopmentConfig(devConfig) {
  try {
    logger.debug('Validating development PM2 configuration', {
      configKeys: Object.keys(devConfig)
    });

    const validationResult = {
      status: 'valid',
      errors: [],
      warnings: [],
      recommendations: [],
      validationDetails: {}
    };

    // Validate single instance configuration for development debugging compatibility
    if (devConfig.instances !== 1) {
      validationResult.warnings.push(`Development should use single instance (current: ${devConfig.instances})`);
      validationResult.recommendations.push('Set instances to 1 for optimal debugging experience');
    }

    // Check fork execution mode configuration for optimal debugging experience
    if (devConfig.exec_mode !== 'fork') {
      validationResult.errors.push(`Development must use fork mode (current: ${devConfig.exec_mode})`);
    }

    // Validate file watching configuration including patterns and ignore rules
    if (devConfig.watch !== true) {
      validationResult.warnings.push('File watching is disabled - hot reload will not work');
      validationResult.recommendations.push('Enable file watching for development hot reload');
    }

    if (!devConfig.ignore_watch || !Array.isArray(devConfig.ignore_watch)) {
      validationResult.warnings.push('No ignore watch patterns configured');
      validationResult.recommendations.push('Configure ignore patterns to exclude node_modules and logs');
    }

    // Check Node.js debugging flags and Inspector configuration accessibility
    if (!devConfig.node_args || !devConfig.node_args.includes('--inspect')) {
      validationResult.errors.push('Node.js Inspector not configured - debugging will not be available');
    }

    const inspectorMatch = devConfig.node_args?.match(/--inspect(?:=([^:]+):)?(\d+)?/);
    if (inspectorMatch) {
      const port = inspectorMatch[2] || '9229';
      validationResult.validationDetails.debuggingPort = parseInt(port);
      
      if (parseInt(port) < 1024) {
        validationResult.warnings.push(`Inspector port ${port} requires privileged access`);
      }
    }

    // Validate development environment variables and debugging settings
    if (!devConfig.env || devConfig.env.NODE_ENV !== 'development') {
      validationResult.errors.push('NODE_ENV must be set to "development"');
    }

    if (!devConfig.env?.DEBUG) {
      validationResult.recommendations.push('Set DEBUG environment variable for verbose logging');
    }

    // Check script path existence and permissions for development execution
    const scriptPath = devConfig.script;
    if (!scriptPath) {
      validationResult.errors.push('Script path is required');
    } else if (!scriptPath.endsWith('.js') && !scriptPath.endsWith('.mjs')) {
      validationResult.warnings.push('Script should have .js or .mjs extension');
    }

    // Validate logging configuration for development feedback and debugging
    if (!devConfig.log_file && !devConfig.out_file) {
      validationResult.recommendations.push('Configure log files for development debugging');
    }

    if (devConfig.log_type !== 'json') {
      validationResult.recommendations.push('Use JSON log format for structured logging');
    }

    // Check memory limits and resource settings for development environment
    const memoryLimit = devConfig.max_memory_restart;
    if (memoryLimit) {
      const memoryMB = parseInt(memoryLimit.replace(/[^0-9]/g, ''));
      if (memoryMB > 1024) {
        validationResult.warnings.push(`High memory limit for development: ${memoryMB}MB`);
        validationResult.recommendations.push('Consider lower memory limit for development (512MB)');
      }
      
      validationResult.validationDetails.memoryLimit = memoryMB;
    }

    // Generate development-specific warnings and optimization recommendations
    if (devConfig.instances > 1) {
      validationResult.warnings.push('Multiple instances not recommended for development debugging');
    }

    if (devConfig.max_restarts > 10) {
      validationResult.warnings.push('High restart limit may hide development issues');
    }

    if (!devConfig.kill_timeout || devConfig.kill_timeout < 3000) {
      validationResult.recommendations.push('Set kill_timeout to at least 3000ms for graceful shutdown');
    }

    // Check for development-specific PM2 settings
    if (devConfig.pmx !== false) {
      validationResult.recommendations.push('Disable PMX for development to reduce overhead');
    }

    if (devConfig.automation !== false) {
      validationResult.recommendations.push('Disable automation for development');
    }

    // Determine overall validation status
    if (validationResult.errors.length > 0) {
      validationResult.status = 'invalid';
    } else if (validationResult.warnings.length > 0) {
      validationResult.status = 'valid_with_warnings';
    }

    // Add validation metadata
    validationResult.validationDetails.summary = {
      totalChecks: 20,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      recommendations: validationResult.recommendations.length,
      validatedAt: new Date().toISOString(),
      environment: 'development'
    };

    // Return comprehensive validation result with development workflow assessment
    logger.info('Development configuration validation completed', {
      status: validationResult.status,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      recommendations: validationResult.recommendations.length
    });

    return validationResult;

  } catch (error) {
    logger.error('Error validating development configuration', {
      error: error.message,
      config: devConfig
    });
    return {
      status: 'error',
      errors: [`Validation failed: ${error.message}`],
      warnings: [],
      recommendations: [],
      validationDetails: {
        summary: {
          totalChecks: 0,
          errors: 1,
          warnings: 0,
          recommendations: 0,
          validatedAt: new Date().toISOString(),
          environment: 'development'
        }
      }
    };
  }
}

/**
 * Optimizes development PM2 configuration for enhanced developer productivity including 
 * startup time optimization, resource allocation tuning, and development workflow 
 * efficiency improvements.
 * 
 * @param {Object} devConfig - Current development configuration
 * @param {Object} [performanceOptions={}] - Performance optimization options
 * @returns {Object} Performance-optimized development configuration with enhanced startup 
 *                   time and resource efficiency for rapid development iteration
 */
export function optimizeDevelopmentPerformance(devConfig, performanceOptions = {}) {
  try {
    logger.debug('Optimizing development PM2 configuration for performance', {
      currentConfig: Object.keys(devConfig),
      options: performanceOptions
    });

    const optimizedConfig = { ...devConfig };

    // Optimize application startup time for rapid development iteration cycles
    const startupOptimizations = {
      wait_ready: performanceOptions.waitReady !== false,
      listen_timeout: performanceOptions.listenTimeout || 3000,
      ready_event: performanceOptions.readyEvent || 'ready',
      kill_timeout: performanceOptions.killTimeout || 5000,
      restart_delay: performanceOptions.restartDelay || 500 // Faster restart for development
    };

    // Configure memory allocation for optimal development performance without waste
    const memoryOptimizations = {
      max_memory_restart: performanceOptions.maxMemory || '512M',
      node_args: optimizeNodeArgs(devConfig.node_args, performanceOptions),
      v8_pool_size: performanceOptions.v8PoolSize || 2
    };

    // Optimize file watching patterns to reduce filesystem monitoring overhead
    const watchOptimizations = {
      watch_delay: performanceOptions.watchDelay || 500, // Faster response
      ignore_watch: optimizeIgnorePatterns(devConfig.ignore_watch, performanceOptions),
      watch_options: {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: performanceOptions.stabilityThreshold || 500,
          pollInterval: performanceOptions.pollInterval || 100
        }
      }
    };

    // Configure restart delays to balance responsiveness with stability
    const restartOptimizations = {
      restart_delay: startupOptimizations.restart_delay,
      min_uptime: performanceOptions.minUptime || '3s', // Shorter for development
      max_restarts: performanceOptions.maxRestarts || 5,
      autorestart: true
    };

    // Optimize logging configuration for development feedback without performance impact
    const loggingOptimizations = {
      log_type: 'json',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z'
    };

    // Configure debugging performance settings for enhanced debugging experience
    const debuggingOptimizations = {
      source_map_support: true,
      trace: performanceOptions.enableTrace !== false,
      disable_trace: false
    };

    // Apply development-specific Node.js optimization flags and runtime settings
    const runtimeOptimizations = {
      interpreter_args: performanceOptions.interpreterArgs || '--harmony',
      cwd: process.cwd(),
      automation: false,
      pmx: false,
      vizion: false
    };

    // Apply all optimizations to the configuration
    Object.assign(optimizedConfig, {
      ...startupOptimizations,
      ...memoryOptimizations,
      ...watchOptimizations,
      ...restartOptimizations,
      ...loggingOptimizations,
      ...debuggingOptimizations,
      ...runtimeOptimizations
    });

    // Add performance metadata
    optimizedConfig.performance = {
      optimized: true,
      optimizedAt: new Date().toISOString(),
      optimizations: {
        startup: true,
        memory: true,
        watching: true,
        restart: true,
        logging: true,
        debugging: true,
        runtime: true
      },
      targets: {
        startupTime: performanceOptions.targetStartupTime || 3000,
        restartTime: performanceOptions.targetRestartTime || 1000,
        memoryUsage: performanceOptions.targetMemoryUsage || 512,
        watchLatency: performanceOptions.targetWatchLatency || 500
      }
    };

    // Return performance-optimized development configuration for enhanced productivity
    logger.info('Development performance optimization completed', {
      memoryLimit: optimizedConfig.max_memory_restart,
      watchDelay: optimizedConfig.watch_delay,
      restartDelay: optimizedConfig.restart_delay,
      startupTimeout: optimizedConfig.listen_timeout
    });

    return optimizedConfig;

  } catch (error) {
    logger.error('Error optimizing development performance', {
      error: error.message,
      config: devConfig,
      options: performanceOptions
    });
    return devConfig; // Return original config if optimization fails
  }
}

/**
 * Generates development-specific PM2 scripts including startup commands, debugging utilities, 
 * and development workflow automation scripts for streamlined development environment management.
 * 
 * @param {Object} scriptConfig - Script generation configuration
 * @param {string} outputPath - Output directory path for generated scripts
 * @returns {Object} Generated development scripts with paths and usage instructions 
 *                   for development workflow automation
 */
export function generateDevelopmentScripts(scriptConfig, outputPath = './scripts/dev') {
  try {
    logger.info('Generating development PM2 scripts', {
      outputPath,
      config: scriptConfig
    });

    const scripts = {
      files: [],
      instructions: [],
      generatedAt: new Date().toISOString()
    };

    // Generate PM2 development startup script with proper configuration loading
    const startupScript = `#!/bin/bash
# PM2 Development Startup Script
# Generated on ${new Date().toISOString()}

set -e

echo "Starting Node.js Tutorial Project in Development Mode..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Stop any existing development processes
echo "Stopping existing development processes..."
pm2 delete nodejs-tutorial-dev 2>/dev/null || true

# Start application with development configuration
echo "Starting application in development mode..."
pm2 start ecosystem.development.config.js --env development

# Display development status
echo "Development server started successfully!"
echo "Debug URL: http://localhost:9229"
echo "Application URL: http://localhost:3000"
echo ""
echo "Development Commands:"
echo "  pm2 logs nodejs-tutorial-dev  # View logs"
echo "  pm2 monit                      # Monitor processes"
echo "  pm2 restart nodejs-tutorial-dev # Restart app"
echo "  pm2 stop nodejs-tutorial-dev    # Stop app"
`;

    scripts.files.push({
      name: 'start-dev.sh',
      path: `${outputPath}/start-dev.sh`,
      content: startupScript,
      executable: true
    });

    // Create development debugging script with Inspector integration
    const debugScript = `#!/bin/bash
# PM2 Development Debugging Script
# Generated on ${new Date().toISOString()}

echo "Starting Node.js Tutorial Project with Debug Mode..."

# Start with debugging enabled
pm2 start ecosystem.development.config.js --env development

# Open Chrome DevTools (if available)
if command -v google-chrome &> /dev/null; then
    echo "Opening Chrome DevTools..."
    google-chrome --new-window chrome://inspect &
elif command -v chromium-browser &> /dev/null; then
    echo "Opening Chromium DevTools..."
    chromium-browser --new-window chrome://inspect &
else
    echo "Chrome/Chromium not found. Open chrome://inspect manually"
fi

echo "Debug server started!"
echo "Debug URL: chrome://inspect"
echo "Application URL: http://localhost:3000"
`;

    scripts.files.push({
      name: 'debug-dev.sh',
      path: `${outputPath}/debug-dev.sh`,
      content: debugScript,
      executable: true
    });

    // Generate file watching status and monitoring scripts for development feedback
    const monitorScript = `#!/bin/bash
# PM2 Development Monitoring Script
# Generated on ${new Date().toISOString()}

echo "Development Environment Status"
echo "=============================="

# Check if development process is running
if pm2 list | grep -q "nodejs-tutorial-dev"; then
    echo "✓ Development server is running"
    
    # Show process details
    echo ""
    echo "Process Details:"
    pm2 describe nodejs-tutorial-dev
    
    # Show recent logs
    echo ""
    echo "Recent Logs (last 20 lines):"
    pm2 logs nodejs-tutorial-dev --lines 20 --nostream
    
    # Show memory and CPU usage
    echo ""
    echo "Resource Usage:"
    pm2 monit --no-colors | head -5
else
    echo "✗ Development server is not running"
    echo "Run './start-dev.sh' to start the development server"
fi

echo ""
echo "Development URLs:"
echo "  Application: http://localhost:3000"
echo "  Debug:       chrome://inspect"
echo "  Health:      http://localhost:3000/health"
`;

    scripts.files.push({
      name: 'monitor-dev.sh',
      path: `${outputPath}/monitor-dev.sh`,
      content: monitorScript,
      executable: true
    });

    // Create development log viewing and filtering scripts for debugging workflow
    const logsScript = `#!/bin/bash
# PM2 Development Logs Script
# Generated on ${new Date().toISOString()}

case "$1" in
    tail)
        echo "Tailing development logs..."
        pm2 logs nodejs-tutorial-dev --timestamp
        ;;
    error)
        echo "Showing error logs..."
        pm2 logs nodejs-tutorial-dev --err --lines 50
        ;;
    out)
        echo "Showing output logs..."
        pm2 logs nodejs-tutorial-dev --out --lines 50
        ;;
    clear)
        echo "Clearing development logs..."
        pm2 flush nodejs-tutorial-dev
        echo "Logs cleared"
        ;;
    json)
        echo "Showing JSON formatted logs..."
        pm2 logs nodejs-tutorial-dev --json --lines 20
        ;;
    *)
        echo "Development Logs Utility"
        echo "Usage: $0 {tail|error|out|clear|json}"
        echo ""
        echo "Commands:"
        echo "  tail   - Live tail logs with timestamps"
        echo "  error  - Show error logs only"
        echo "  out    - Show output logs only"
        echo "  clear  - Clear all logs"
        echo "  json   - Show logs in JSON format"
        ;;
esac
`;

    scripts.files.push({
      name: 'logs-dev.sh',
      path: `${outputPath}/logs-dev.sh`,
      content: logsScript,
      executable: true
    });

    // Generate development configuration validation and testing scripts
    const validateScript = `#!/bin/bash
# PM2 Development Configuration Validation Script
# Generated on ${new Date().toISOString()}

echo "Validating Development Configuration..."

# Check if Node.js version is compatible
NODE_VERSION=$(node --version)
echo "Node.js Version: $NODE_VERSION"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "PM2 Version: $PM2_VERSION"
else
    echo "ERROR: PM2 is not installed"
    exit 1
fi

# Validate ecosystem configuration
if [ -f "ecosystem.development.config.js" ]; then
    echo "✓ Development ecosystem configuration found"
    
    # Test configuration syntax
    if node -c ecosystem.development.config.js 2>/dev/null; then
        echo "✓ Configuration syntax is valid"
    else
        echo "✗ Configuration syntax error"
        node -c ecosystem.development.config.js
        exit 1
    fi
else
    echo "✗ Development ecosystem configuration not found"
    exit 1
fi

# Check required directories
echo ""
echo "Checking directories..."
mkdir -p logs/dev
echo "✓ Log directories created"

# Check port availability
if lsof -i:3000 &>/dev/null; then
    echo "⚠ Port 3000 is already in use"
else
    echo "✓ Port 3000 is available"
fi

if lsof -i:9229 &>/dev/null; then
    echo "⚠ Debug port 9229 is already in use"
else
    echo "✓ Debug port 9229 is available"
fi

echo ""
echo "Development environment validation completed!"
`;

    scripts.files.push({
      name: 'validate-dev.sh',
      path: `${outputPath}/validate-dev.sh`,
      content: validateScript,
      executable: true
    });

    // Create development restart and reload scripts for rapid iteration
    const restartScript = `#!/bin/bash
# PM2 Development Restart Script
# Generated on ${new Date().toISOString()}

case "$1" in
    restart)
        echo "Restarting development server..."
        pm2 restart nodejs-tutorial-dev
        echo "Development server restarted"
        ;;
    reload)
        echo "Reloading development server..."
        pm2 reload nodejs-tutorial-dev
        echo "Development server reloaded"
        ;;
    stop)
        echo "Stopping development server..."
        pm2 stop nodejs-tutorial-dev
        echo "Development server stopped"
        ;;
    delete)
        echo "Deleting development process..."
        pm2 delete nodejs-tutorial-dev
        echo "Development process deleted"
        ;;
    *)
        echo "Development Control Script"
        echo "Usage: $0 {restart|reload|stop|delete}"
        echo ""
        echo "Commands:"
        echo "  restart - Restart the development process"
        echo "  reload  - Gracefully reload the process"
        echo "  stop    - Stop the development process"
        echo "  delete  - Delete the development process"
        ;;
esac
`;

    scripts.files.push({
      name: 'control-dev.sh',
      path: `${outputPath}/control-dev.sh`,
      content: restartScript,
      executable: true
    });

    // Generate usage instructions
    scripts.instructions = [
      'Make scripts executable: chmod +x scripts/dev/*.sh',
      'Start development: ./scripts/dev/start-dev.sh',
      'Monitor development: ./scripts/dev/monitor-dev.sh',
      'View logs: ./scripts/dev/logs-dev.sh tail',
      'Debug application: ./scripts/dev/debug-dev.sh',
      'Validate setup: ./scripts/dev/validate-dev.sh',
      'Control processes: ./scripts/dev/control-dev.sh restart'
    ];

    // Write all development scripts to specified output directory
    logger.info('Development scripts generated successfully', {
      fileCount: scripts.files.length,
      outputPath,
      scripts: scripts.files.map(f => f.name)
    });

    return scripts;

  } catch (error) {
    logger.error('Error generating development scripts', {
      error: error.message,
      outputPath,
      config: scriptConfig
    });
    throw new Error(`Failed to generate development scripts: ${error.message}`);
  }
}

/**
 * Optimizes Node.js arguments for development performance
 * @private
 * @param {string} currentArgs - Current node arguments
 * @param {Object} options - Optimization options
 * @returns {string} Optimized node arguments
 */
function optimizeNodeArgs(currentArgs = '', options = {}) {
  const args = currentArgs.split(' ').filter(arg => arg.length > 0);
  const optimizedArgs = [];

  // Ensure debugging is enabled
  if (!args.some(arg => arg.includes('--inspect'))) {
    optimizedArgs.push('--inspect=9229');
  }

  // Set memory limits
  const memorySize = options.maxOldSpaceSize || 512;
  if (!args.some(arg => arg.includes('--max-old-space-size'))) {
    optimizedArgs.push(`--max-old-space-size=${memorySize}`);
  }

  // Enable source maps for development
  if (!args.some(arg => arg.includes('--enable-source-maps'))) {
    optimizedArgs.push('--enable-source-maps');
  }

  // Add trace warnings for better debugging
  if (!args.some(arg => arg.includes('--trace-warnings'))) {
    optimizedArgs.push('--trace-warnings');
  }

  // Combine existing and optimized args
  const combinedArgs = [...args, ...optimizedArgs];
  return [...new Set(combinedArgs)].join(' '); // Remove duplicates
}

/**
 * Optimizes ignore patterns for file watching
 * @private
 * @param {Array} currentPatterns - Current ignore patterns
 * @param {Object} options - Optimization options
 * @returns {Array} Optimized ignore patterns
 */
function optimizeIgnorePatterns(currentPatterns = [], options = {}) {
  const basePatterns = [
    'node_modules/**',
    'logs/**',
    '.git/**',
    'test/**',
    'coverage/**',
    '*.log',
    '*.tmp',
    '.nyc_output/**'
  ];

  const additionalPatterns = options.additionalIgnorePatterns || [];
  return [...new Set([...basePatterns, ...currentPatterns, ...additionalPatterns])];
}

// Create and export default development ecosystem configuration
const developmentEcosystem = await createDevelopmentEcosystem({
  appName: DEV_APP_NAME,
  scriptPath: DEV_SCRIPT_PATH,
  enableWatching: true,
  enableDebugging: true,
  port: DEV_PORT
});

// Pre-configured development application definition optimized for debugging, file watching, and hot reload functionality
export const developmentApp = await configureDevelopmentApp(DEV_APP_NAME, DEV_SCRIPT_PATH, {
  watch: true,
  debug: '*',
  maxOldSpaceSize: 512,
  inspectorPort: 9229
});

// Development file watching configuration with comprehensive patterns and intelligent ignore rules for hot reload functionality
export const devWatchConfig = await setupDevelopmentWatching({
  enabled: true,
  patterns: DEV_WATCH_PATTERNS,
  ignorePatterns: DEV_IGNORE_PATTERNS,
  watchDelay: 1000
});

// Development debugging configuration with Node.js Inspector integration and debugging optimization settings
export const devDebuggingConfig = await configureDevelopmentDebugging({
  enabled: true,
  inspectorPort: 9229,
  maxOldSpaceSize: 512,
  sourceMaps: true
});

// Development logging configuration with verbose output, console display, and debugging-friendly formatting
export const devLoggingConfig = await createDevelopmentLogging({
  level: 'debug',
  console: true,
  format: 'pretty',
  timestamps: true,
  colors: true
});

// Development environment variables configuration with debugging flags and development-specific settings
export const devEnvironmentConfig = {
  NODE_ENV: 'development',
  DEBUG: '*',
  PORT: DEV_PORT,
  DEVELOPMENT_MODE: true,
  LOG_LEVEL: 'debug',
  PM2_DEV_MODE: 'true',
  HOT_RELOAD_ENABLED: 'true',
  DEBUGGING_ENABLED: 'true'
};

// Export all development ecosystem components and utilities
export {
  developmentEcosystem,
  createDevelopmentEcosystem,
  configureDevelopmentApp,
  setupDevelopmentWatching,
  configureDevelopmentDebugging,
  createDevelopmentLogging,
  validateDevelopmentConfig,
  optimizeDevelopmentPerformance,
  generateDevelopmentScripts
};

// Export default development ecosystem configuration
export default developmentEcosystem;

// Log development ecosystem initialization
logger.info('PM2 development ecosystem configuration initialized', {
  appName: DEV_APP_NAME,
  scriptPath: DEV_SCRIPT_PATH,
  instances: DEV_INSTANCES,
  execMode: DEV_EXEC_MODE,
  watchEnabled: DEV_WATCH_ENABLED,
  debugPort: 9229,
  environment: 'development',
  hotReload: true,
  debugging: true
});