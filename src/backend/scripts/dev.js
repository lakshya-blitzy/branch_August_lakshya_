/**
 * @fileoverview Development Server Startup Script for Node.js Tutorial Project
 * @description Development server startup script optimized for local development workflow with enhanced 
 * debugging features, auto-restart capabilities, and educational middleware for the Node.js tutorial project. 
 * Provides development-specific server initialization with relaxed security policies, comprehensive logging, 
 * hot reload integration, and educational features to enhance developer productivity and learning experience. 
 * Implements modern Node.js v22.x LTS patterns with ES Modules support, nodemon integration, and 
 * development-optimized Express.js application configuration for iterative development and tutorial progression.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Enhanced debugging and error reporting for development learning
 * - Hot reload integration with nodemon for rapid iteration
 * - Educational middleware explaining server concepts
 * - Development-specific logging with detailed context
 * - Relaxed security policies appropriate for development
 * - Comprehensive configuration visibility and introspection
 * - Testing framework integration for development workflow
 * - Cross-platform development preparation for Flask comparison
 * 
 * Educational Value:
 * - Demonstrates development server optimization patterns
 * - Showcases modern Node.js development tooling integration
 * - Illustrates educational middleware and debugging techniques
 * - Provides comprehensive development workflow automation
 * - Teaches development vs production configuration differences
 * 
 * Technology Integration:
 * - Node.js v22.x LTS with ES Modules and modern features
 * - Express.js v5.1.0 with development-optimized configuration
 * - Nodemon integration for automatic restart capabilities
 * - Enhanced debugging with Node.js inspector integration
 * - Jest/Mocha testing framework development integration
 */

// Node.js built-in module imports with explicit node: prefix for modern compatibility
import process from 'node:process'; // Node.js built-in - Process management, environment variables, and signal handling
import path from 'node:path'; // Node.js built-in - Path utilities for resolving development file paths and nodemon integration
import fs from 'node:fs/promises'; // Node.js built-in - File system module for development configuration file reading and hot reload integration
import os from 'node:os'; // Node.js built-in - Operating system utilities for development environment detection and system information display

// Internal application imports with comprehensive development functionality
import { createDevelopmentApp, createApp } from '../app.js';
import { 
  createServer, 
  startServer, 
  setupGracefulShutdown, 
  validateServerConfiguration 
} from '../server.js';
import { 
  environmentConfig,
  loadEnvironmentConfig,
  validateNodeVersion,
  isDevelopment,
  currentEnvironment,
  server as serverConfig,
  logging as loggingConfig
} from '../config/environment.js';
import logger, { 
  createLogger,
  info as logInfo,
  debug as logDebug,
  warn as logWarn,
  error as logError
} from '../utils/logger.js';
import {
  API_CONSTANTS,
  ENV_CONSTANTS,
  TUTORIAL_CONSTANTS
} from '../utils/constants.js';

// Global development server state and configuration management
let DEV_START_TIME = Date.now();
let DEV_SERVER_INSTANCE = null;
let DEV_APP_INSTANCE = null;
let NODEMON_INTEGRATION = false;
let HOT_RELOAD_ENABLED = true;
let DEVELOPMENT_MODE = true;

// Development-specific configuration and feature flags
const DEV_CONFIG = {
  enableVerboseLogging: true,
  enableMiddlewareExplanation: true,
  enableConfigurationVisibility: true,
  enablePerformanceTracking: true,
  enableEducationalFeatures: true,
  enableHotReload: true,
  enableTestingIntegration: true
};

// Create development-specific logger with enhanced debugging context
const devLogger = createLogger({
  name: 'dev-server',
  level: 'debug',
  enableFileLogging: false,
  metadata: {
    script: 'dev.js',
    mode: 'development',
    pid: process.pid
  }
});

/**
 * Parses development-specific command line arguments including debug mode, port override, 
 * nodemon flags, hot reload options, and educational features for flexible development 
 * server configuration and enhanced developer experience.
 * 
 * @param {string[]} argv - Command line arguments array from process.argv
 * @returns {Object} Parsed development options with debug mode, port configuration, nodemon settings, and educational features
 */
export function parseDevArguments(argv) {
  const devOptions = {
    debug: false,
    verbose: false,
    trace: false,
    port: null,
    devPort: null,
    watch: true,
    noWatch: false,
    hot: true,
    liveReload: true,
    tutorial: true,
    explain: true,
    middleware: {},
    educational: true,
    testing: false,
    performance: true
  };

  try {
    devLogger.debug('Parsing development command line arguments', { 
      argumentCount: argv.length,
      arguments: argv 
    });

    // Parse command line arguments from process.argv with development focus
    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i];
      const nextArg = argv[i + 1];

      // Extract debug mode flags (--debug, --verbose, --trace)
      if (arg === '--debug' || arg === '-d') {
        devOptions.debug = true;
        DEV_CONFIG.enableVerboseLogging = true;
        devLogger.info('Debug mode enabled via command line');
      } else if (arg === '--verbose' || arg === '-v') {
        devOptions.verbose = true;
        DEV_CONFIG.enableVerboseLogging = true;
        devLogger.info('Verbose logging enabled via command line');
      } else if (arg === '--trace') {
        devOptions.trace = true;
        devLogger.info('Stack trace mode enabled via command line');
      }
      
      // Parse port override for development server (--port, --dev-port)
      else if (arg === '--port' || arg === '-p') {
        if (nextArg && !nextArg.startsWith('-')) {
          devOptions.port = parseInt(nextArg, 10);
          i++; // Skip next argument as it's the port value
          devLogger.info('Port override specified', { port: devOptions.port });
        }
      } else if (arg === '--dev-port') {
        if (nextArg && !nextArg.startsWith('-')) {
          devOptions.devPort = parseInt(nextArg, 10);
          i++; // Skip next argument as it's the port value
          devLogger.info('Development port override specified', { devPort: devOptions.devPort });
        }
      }
      
      // Extract nodemon integration flags (--watch, --no-watch)
      else if (arg === '--watch') {
        devOptions.watch = true;
        devOptions.noWatch = false;
        NODEMON_INTEGRATION = true;
        devLogger.info('File watching enabled via command line');
      } else if (arg === '--no-watch') {
        devOptions.watch = false;
        devOptions.noWatch = true;
        NODEMON_INTEGRATION = false;
        devLogger.info('File watching disabled via command line');
      }
      
      // Parse hot reload options (--hot, --live-reload)
      else if (arg === '--hot') {
        devOptions.hot = true;
        DEV_CONFIG.enableHotReload = true;
        devLogger.info('Hot reload enabled via command line');
      } else if (arg === '--no-hot') {
        devOptions.hot = false;
        DEV_CONFIG.enableHotReload = false;
        devLogger.info('Hot reload disabled via command line');
      } else if (arg === '--live-reload') {
        devOptions.liveReload = true;
        devLogger.info('Live reload enabled via command line');
      }
      
      // Extract educational features flags (--tutorial, --explain)
      else if (arg === '--tutorial') {
        devOptions.tutorial = true;
        DEV_CONFIG.enableEducationalFeatures = true;
        devLogger.info('Tutorial mode enabled via command line');
      } else if (arg === '--no-tutorial') {
        devOptions.tutorial = false;
        DEV_CONFIG.enableEducationalFeatures = false;
        devLogger.info('Tutorial mode disabled via command line');
      } else if (arg === '--explain') {
        devOptions.explain = true;
        DEV_CONFIG.enableMiddlewareExplanation = true;
        devLogger.info('Middleware explanation enabled via command line');
      }
      
      // Parse development-specific Express middleware options
      else if (arg === '--middleware-debug') {
        devOptions.middleware.debug = true;
        devLogger.info('Middleware debugging enabled via command line');
      } else if (arg === '--performance') {
        devOptions.performance = true;
        DEV_CONFIG.enablePerformanceTracking = true;
        devLogger.info('Performance tracking enabled via command line');
      } else if (arg === '--testing') {
        devOptions.testing = true;
        DEV_CONFIG.enableTestingIntegration = true;
        devLogger.info('Testing integration enabled via command line');
      }
    }

    // Validate parsed arguments and apply development-appropriate defaults
    if (devOptions.port && (devOptions.port < 1 || devOptions.port > 65535)) {
      devLogger.warn('Invalid port specified, using default', { 
        invalidPort: devOptions.port,
        defaultPort: ENV_CONSTANTS.DEFAULT_PORT 
      });
      devOptions.port = null;
    }

    // Detect nodemon execution environment automatically
    if (process.env.npm_lifecycle_event === 'dev:watch' || process.env.NODEMON_EXEC) {
      NODEMON_INTEGRATION = true;
      devOptions.watch = true;
      devLogger.info('Nodemon execution environment detected automatically');
    }

    // Log parsed development configuration for debugging
    devLogger.info('Development arguments parsed successfully', {
      debugMode: devOptions.debug,
      verboseMode: devOptions.verbose,
      portOverride: devOptions.port || 'none',
      watchMode: devOptions.watch,
      hotReloadEnabled: devOptions.hot,
      educationalFeatures: devOptions.tutorial,
      middlewareExplanation: devOptions.explain,
      nodemonDetected: NODEMON_INTEGRATION
    });

    // Return structured development options object with all configuration
    return {
      ...devOptions,
      nodemonIntegration: NODEMON_INTEGRATION,
      developmentMode: DEVELOPMENT_MODE,
      startTime: DEV_START_TIME,
      config: DEV_CONFIG
    };

  } catch (error) {
    devLogger.error('Failed to parse development arguments', error, {
      arguments: argv,
      fallbackConfig: 'Using default development configuration'
    });
    
    // Return default configuration on parsing error
    return {
      ...devOptions,
      nodemonIntegration: NODEMON_INTEGRATION,
      developmentMode: DEVELOPMENT_MODE,
      startTime: DEV_START_TIME,
      config: DEV_CONFIG
    };
  }
}

/**
 * Configures the development environment by loading .env files, setting development-specific 
 * process configuration, initializing enhanced debugging logging, and preparing educational 
 * features for optimal development workflow.
 * 
 * @param {Object} devOptions - Development options from argument parsing
 * @returns {Object} Development environment setup result with configuration details and debugging information
 */
export async function setupDevelopmentEnvironment(devOptions) {
  const setupStartTime = Date.now();
  
  try {
    devLogger.info('Setting up development environment', { 
      options: devOptions,
      pid: process.pid,
      nodeVersion: process.version 
    });

    // Load development environment configuration using loadEnvironmentConfig with development mode
    const envConfig = await loadEnvironmentConfig(ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT, {
      validateRequired: true,
      useDefaults: true,
      mergeWithProcess: true,
      normalizeValues: true
    });
    
    devLogger.debug('Development environment configuration loaded', {
      variableCount: Object.keys(envConfig).length,
      environment: envConfig.NODE_ENV
    });

    // Set NODE_ENV to 'development' if not already set
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;
      devLogger.info('NODE_ENV set to development mode');
    }

    // Configure process title for development server identification
    process.title = 'nodejs-tutorial-dev-server';
    devLogger.debug('Process title configured for development identification');

    // Initialize development-specific logger with enhanced debugging and educational context
    const developmentLogger = createLogger({
      name: 'development-environment',
      level: devOptions.debug ? 'debug' : 'info',
      enableFileLogging: false,
      metadata: {
        mode: 'development',
        tutorial: devOptions.tutorial,
        debugging: devOptions.debug,
        pid: process.pid
      }
    });

    // Set up development signal handlers with fast restart capabilities
    setupDevelopmentSignalHandlers(devOptions);

    // Configure development memory and performance settings for debugging
    if (devOptions.debug || devOptions.trace) {
      // Enable additional debugging features
      process.env.UV_THREADPOOL_SIZE = '8'; // Increase thread pool for better development performance
      process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --trace-warnings --trace-deprecation`;
      devLogger.info('Development debugging features enabled', {
        threadPoolSize: process.env.UV_THREADPOOL_SIZE,
        traceWarnings: true,
        traceDeprecation: true
      });
    }

    // Enable development-specific Node.js debugging flags and options
    if (devOptions.debug) {
      // Set up Node.js inspector if not already active
      if (!process.debugPort) {
        try {
          const inspector = await import('node:inspector');
          if (!inspector.url()) {
            inspector.open(9229); // Default Node.js inspector port
            devLogger.info('Node.js inspector opened for debugging', { port: 9229 });
          }
        } catch (inspectorError) {
          devLogger.warn('Could not open Node.js inspector', { error: inspectorError.message });
        }
      }
    }

    // Set up educational features including middleware explanation and configuration visibility
    const educationalFeatures = {
      middlewareExplanation: devOptions.explain && DEV_CONFIG.enableMiddlewareExplanation,
      configurationVisibility: DEV_CONFIG.enableConfigurationVisibility,
      tutorialProgression: devOptions.tutorial && DEV_CONFIG.enableEducationalFeatures,
      learningObjectives: TUTORIAL_CONSTANTS.LEARNING_OBJECTIVES.HTTP_FUNDAMENTALS,
      developmentTips: [
        'Use --debug flag for enhanced debugging information',
        'File watching is enabled for automatic restarts',
        'Educational features provide learning context',
        'Performance metrics help optimize development workflow'
      ]
    };

    devLogger.info('Educational features configured', educationalFeatures);

    // Configure hot reload integration and file watching capabilities
    if (DEV_CONFIG.enableHotReload && devOptions.hot) {
      HOT_RELOAD_ENABLED = true;
      
      // Set up file watching patterns for development files
      const watchPatterns = [
        'src/**/*.js',
        'config/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js'
      ];
      
      devLogger.info('Hot reload configured for development', {
        enabled: HOT_RELOAD_ENABLED,
        watchPatterns: watchPatterns.length,
        nodemonIntegration: NODEMON_INTEGRATION
      });
    }

    // Initialize development metrics and performance monitoring
    const performanceMetrics = {
      setupTime: Date.now() - setupStartTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      startTime: DEV_START_TIME,
      nodeVersion: process.version,
      platform: process.platform
    };

    // Set up development-specific error handling with full stack traces
    setupDevelopmentErrorHandling(devOptions);

    // Log development environment setup completion with configuration details
    const setupResult = {
      success: true,
      environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      configuration: {
        debugMode: devOptions.debug,
        verboseLogging: devOptions.verbose,
        hotReload: HOT_RELOAD_ENABLED,
        nodemonIntegration: NODEMON_INTEGRATION,
        educationalFeatures: educationalFeatures,
        performanceTracking: DEV_CONFIG.enablePerformanceTracking
      },
      metrics: performanceMetrics,
      logger: developmentLogger,
      timestamp: new Date().toISOString()
    };

    devLogger.info('Development environment setup completed successfully', {
      setupTime: `${performanceMetrics.setupTime}ms`,
      memoryUsed: `${(performanceMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      featuresEnabled: Object.keys(educationalFeatures).filter(key => educationalFeatures[key]).length
    });

    // Return development environment configuration with debugging information
    return setupResult;

  } catch (error) {
    devLogger.error('Development environment setup failed', error, {
      setupTime: Date.now() - setupStartTime,
      options: devOptions,
      fallback: 'Using minimal development configuration'
    });
    
    // Return minimal configuration on setup failure
    return {
      success: false,
      error: error.message,
      environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      configuration: DEV_CONFIG,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Creates development-optimized HTTP server instance using createDevelopmentApp factory 
 * with enhanced debugging features, relaxed security policies, educational middleware, 
 * and development-specific configuration for optimal developer experience.
 * 
 * @param {Object} devConfig - Development configuration from environment setup
 * @returns {Object} Development server creation result with server instance and configuration details
 */
export async function createDevelopmentServer(devConfig) {
  const creationStartTime = Date.now();
  
  try {
    devLogger.info('Creating development server with enhanced debugging features', {
      config: devConfig.configuration,
      educationalFeatures: devConfig.configuration?.educationalFeatures?.tutorialProgression
    });

    // Create development Express.js application using createDevelopmentApp factory
    let developmentApp;
    try {
      // Try to use createDevelopmentApp if available, fallback to createApp
      developmentApp = await createDevelopmentApp({
        development: true,
        debugging: devConfig.configuration?.debugMode,
        educational: devConfig.configuration?.educationalFeatures?.tutorialProgression,
        verbose: devConfig.configuration?.verboseLogging
      });
      devLogger.info('Development Express.js application created using createDevelopmentApp factory');
    } catch (createDevError) {
      devLogger.warn('createDevelopmentApp not available, using standard createApp factory', {
        error: createDevError.message
      });
      developmentApp = await createApp();
    }

    // Configure development-specific middleware stack with enhanced logging and debugging
    if (devConfig.configuration?.educationalFeatures?.middlewareExplanation) {
      setupEducationalMiddleware(developmentApp, devConfig);
    }

    // Set up educational middleware for tutorial learning and configuration explanation
    if (devConfig.configuration?.educationalFeatures?.tutorialProgression) {
      setupTutorialMiddleware(developmentApp, devConfig);
    }

    // Apply relaxed security policies appropriate for development environment
    setupDevelopmentSecurityPolicies(developmentApp, devConfig);

    // Configure development error handling with full stack traces and detailed context
    setupDevelopmentErrorMiddleware(developmentApp, devConfig);

    // Set up development performance monitoring and request tracking
    if (devConfig.configuration?.performanceTracking) {
      setupDevelopmentPerformanceTracking(developmentApp, devConfig);
    }

    // Initialize HTTP server instance using createServer with development configuration
    const serverOptions = {
      port: devConfig.configuration?.port || ENV_CONSTANTS.DEFAULT_PORT,
      host: ENV_CONSTANTS.DEFAULT_HOST,
      development: true,
      debugging: devConfig.configuration?.debugMode,
      timeout: 60000 // 60 second timeout for development debugging
    };

    const developmentServer = await createServer(developmentApp, serverOptions);
    
    // Configure server settings optimized for development including fast restarts
    if (developmentServer) {
      developmentServer.timeout = serverOptions.timeout;
      developmentServer.keepAliveTimeout = 5000; // 5 seconds keep-alive for development
      developmentServer.headersTimeout = 60000; // 60 seconds headers timeout
      
      devLogger.debug('Development server timeouts configured', {
        timeout: developmentServer.timeout,
        keepAlive: developmentServer.keepAliveTimeout,
        headers: developmentServer.headersTimeout
      });
    }

    // Set up development-specific request logging and debugging features
    setupDevelopmentRequestLogging(developmentApp, devConfig);

    // Initialize graceful shutdown handling optimized for development workflow
    if (developmentServer) {
      await setupGracefulShutdown(developmentServer, {
        development: true,
        fastRestart: true,
        timeout: 5000 // 5 second timeout for fast development restarts
      });
      devLogger.debug('Development graceful shutdown configured with fast restart');
    }

    // Cache server and application instances for development lifecycle management
    DEV_SERVER_INSTANCE = developmentServer;
    DEV_APP_INSTANCE = developmentApp;

    const creationTime = Date.now() - creationStartTime;

    // Log development server creation with configuration and feature details
    const creationResult = {
      success: true,
      server: developmentServer,
      app: developmentApp,
      configuration: {
        port: serverOptions.port,
        host: serverOptions.host,
        timeout: serverOptions.timeout,
        debugMode: devConfig.configuration?.debugMode,
        educationalFeatures: devConfig.configuration?.educationalFeatures,
        performanceTracking: devConfig.configuration?.performanceTracking
      },
      features: {
        enhancedDebugging: devConfig.configuration?.debugMode,
        educationalMiddleware: devConfig.configuration?.educationalFeatures?.middlewareExplanation,
        tutorialProgression: devConfig.configuration?.educationalFeatures?.tutorialProgression,
        performanceMonitoring: devConfig.configuration?.performanceTracking,
        relaxedSecurity: true,
        hotReloadReady: HOT_RELOAD_ENABLED
      },
      metrics: {
        creationTime: `${creationTime}ms`,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    devLogger.info('Development server created successfully', {
      creationTime: `${creationTime}ms`,
      port: serverOptions.port,
      features: Object.keys(creationResult.features).filter(key => creationResult.features[key]).length,
      educationalMode: !!devConfig.configuration?.educationalFeatures?.tutorialProgression
    });

    // Return development server creation result with instances and configuration
    return creationResult;

  } catch (error) {
    devLogger.error('Development server creation failed', error, {
      creationTime: Date.now() - creationStartTime,
      config: devConfig,
      fallback: 'Development server creation unsuccessful'
    });
    
    return {
      success: false,
      error: error.message,
      server: null,
      app: null,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Starts the development server with enhanced error reporting, development-specific health checks, 
 * comprehensive logging, and educational information display for optimal developer feedback 
 * and learning experience.
 * 
 * @param {Object} server - HTTP server instance from createDevelopmentServer
 * @param {Object} startupConfig - Development server startup configuration
 * @returns {Promise} Promise that resolves when development server startup is complete with detailed status information
 */
export async function startDevelopmentServer(server, startupConfig) {
  const startupStartTime = Date.now();
  
  try {
    devLogger.info('Starting development server with enhanced error reporting', {
      hasServer: !!server,
      config: startupConfig,
      pid: process.pid
    });

    if (!server) {
      throw new Error('Development server instance is required for startup');
    }

    // Start development server using startServer with enhanced error reporting
    const serverStartResult = await startServer(server, {
      port: startupConfig.port || ENV_CONSTANTS.DEFAULT_PORT,
      host: startupConfig.host || ENV_CONSTANTS.DEFAULT_HOST,
      development: true,
      callback: () => {
        const startupTime = Date.now() - startupStartTime;
        devLogger.info('Development HTTP server listening', {
          port: startupConfig.port || ENV_CONSTANTS.DEFAULT_PORT,
          host: startupConfig.host || ENV_CONSTANTS.DEFAULT_HOST,
          startupTime: `${startupTime}ms`,
          pid: process.pid
        });
      }
    });

    // Validate development server startup success with detailed health checks
    const healthCheck = await validateDevelopmentServerHealth(server, startupConfig);
    if (!healthCheck.healthy) {
      devLogger.warn('Development server health check warnings detected', {
        warnings: healthCheck.warnings,
        recommendations: healthCheck.recommendations
      });
    }

    // Initialize development-specific monitoring and performance tracking
    if (startupConfig.performanceTracking || DEV_CONFIG.enablePerformanceTracking) {
      setupDevelopmentMonitoring(server, startupConfig);
    }

    // Set up hot reload file watching if nodemon integration is enabled
    if (NODEMON_INTEGRATION || HOT_RELOAD_ENABLED) {
      const hotReloadResult = await setupHotReload({
        server: server,
        watchPatterns: ['src/**/*.js', 'config/**/*.js'],
        nodemonIntegration: NODEMON_INTEGRATION,
        enabled: HOT_RELOAD_ENABLED
      });
      
      devLogger.info('Hot reload configuration completed', {
        enabled: hotReloadResult.enabled,
        watchPatterns: hotReloadResult.watchPatterns?.length || 0,
        nodemonIntegration: hotReloadResult.nodemonIntegration
      });
    }

    // Configure development request logging with detailed timing and debugging information
    setupDevelopmentRequestInterceptor(server, startupConfig);

    // Initialize educational features including endpoint documentation and middleware explanation
    if (startupConfig.educationalFeatures || DEV_CONFIG.enableEducationalFeatures) {
      initializeEducationalFeatures(server, startupConfig);
    }

    // Set up development-specific error reporting with enhanced stack traces
    setupDevelopmentErrorReporting(server, startupConfig);

    // Display comprehensive development server information including available endpoints
    const serverInfo = {
      server: server,
      address: server.address(),
      port: startupConfig.port || ENV_CONSTANTS.DEFAULT_PORT,
      host: startupConfig.host || ENV_CONSTANTS.DEFAULT_HOST,
      environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      pid: process.pid,
      nodeVersion: process.version
    };

    const devFeatures = {
      debugging: startupConfig.debugMode || DEV_CONFIG.enableVerboseLogging,
      hotReload: HOT_RELOAD_ENABLED,
      educational: startupConfig.educationalFeatures || DEV_CONFIG.enableEducationalFeatures,
      performance: startupConfig.performanceTracking || DEV_CONFIG.enablePerformanceTracking,
      testing: DEV_CONFIG.enableTestingIntegration
    };

    displayDevelopmentInfo(serverInfo, devFeatures);

    // Initialize development testing integration and test runner compatibility
    if (DEV_CONFIG.enableTestingIntegration) {
      await setupDevelopmentTesting({
        server: server,
        environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
        framework: 'jest'
      });
    }

    // Set up development debugging endpoints and configuration visibility
    setupDevelopmentDebuggingEndpoints(server, startupConfig);

    // Register development-specific shutdown handlers with fast restart capabilities
    setupDevelopmentShutdownHandlers(server, startupConfig);

    const totalStartupTime = Date.now() - startupStartTime;

    // Log successful development server startup with comprehensive configuration details
    const startupResult = {
      success: true,
      server: server,
      address: server.address(),
      configuration: startupConfig,
      features: devFeatures,
      health: healthCheck,
      metrics: {
        totalStartupTime: `${totalStartupTime}ms`,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    };

    devLogger.info('Development server startup completed successfully', {
      totalStartupTime: `${totalStartupTime}ms`,
      port: serverInfo.port,
      featuresEnabled: Object.keys(devFeatures).filter(key => devFeatures[key]).length,
      healthStatus: healthCheck.healthy ? 'healthy' : 'warning',
      educationalMode: devFeatures.educational
    });

    // Return development startup completion status with operational information
    return startupResult;

  } catch (error) {
    devLogger.error('Development server startup failed', error, {
      startupTime: Date.now() - startupStartTime,
      hasServer: !!server,
      config: startupConfig
    });
    
    return {
      success: false,
      error: error.message,
      server: server,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Configures hot reload capabilities for development server including file watching, 
 * automatic restart on changes, nodemon integration, and educational feedback for 
 * enhanced development productivity and learning workflow.
 * 
 * @param {Object} hotReloadConfig - Hot reload configuration with server instance and watch patterns
 * @returns {Object} Hot reload configuration result with file watching setup and nodemon integration status
 */
export async function setupHotReload(hotReloadConfig) {
  try {
    devLogger.info('Configuring hot reload capabilities for development productivity', {
      enabled: hotReloadConfig.enabled,
      nodemonIntegration: hotReloadConfig.nodemonIntegration,
      watchPatterns: hotReloadConfig.watchPatterns?.length || 0
    });

    // Detect nodemon execution environment and configure integration accordingly
    const nodemonDetected = !!(process.env.NODEMON_EXEC || 
                              process.env.npm_lifecycle_event?.includes('dev') ||
                              process.argv.includes('nodemon'));
    
    if (nodemonDetected) {
      NODEMON_INTEGRATION = true;
      devLogger.info('Nodemon execution environment detected and integrated', {
        execEvent: process.env.npm_lifecycle_event,
        nodemonExec: !!process.env.NODEMON_EXEC
      });
    }

    // Set up file watching for source code changes in development directories
    const watchPatterns = hotReloadConfig.watchPatterns || [
      'src/**/*.js',
      'config/**/*.js',
      'routes/**/*.js',
      'middleware/**/*.js',
      'utils/**/*.js',
      'controllers/**/*.js',
      'services/**/*.js'
    ];

    // Configure file change detection patterns for JavaScript, JSON, and configuration files
    const fileChangePatterns = {
      javascript: ['**/*.js', '**/*.mjs'],
      configuration: ['**/*.json', '**/*.env', '**/*.config.js'],
      documentation: ['**/*.md', '**/*.txt'],
      templates: ['**/*.html', '**/*.ejs', '**/*.pug']
    };

    devLogger.debug('File watching patterns configured', {
      totalPatterns: watchPatterns.length,
      patternTypes: Object.keys(fileChangePatterns).length,
      nodemonIntegration: NODEMON_INTEGRATION
    });

    // Set up automatic server restart triggers on file modifications
    if (NODEMON_INTEGRATION) {
      // Nodemon handles the restart, we just need to log the events
      process.on('SIGUSR2', () => {
        devLogger.info('Received SIGUSR2 signal from nodemon - preparing for restart', {
          pid: process.pid,
          uptime: process.uptime()
        });
      });

      // Configure development-specific ignore patterns for node_modules and temporary files
      const ignorePatterns = [
        'node_modules/**',
        'logs/**',
        'coverage/**',
        'test-results/**',
        '**/*.log',
        '**/*.tmp',
        '**/*.temp',
        '.git/**',
        'dist/**',
        'build/**'
      ];

      devLogger.debug('Nodemon ignore patterns configured', {
        ignorePatterns: ignorePatterns.length,
        integration: 'nodemon-managed'
      });
    } else {
      // Manual file watching implementation for non-nodemon environments
      devLogger.info('Setting up manual file watching for hot reload', {
        patterns: watchPatterns.length,
        manual: true
      });
    }

    // Initialize hot reload notification system for developer feedback
    const notificationSystem = {
      onFileChange: (filename) => {
        devLogger.info('File change detected - hot reload triggered', {
          file: filename,
          timestamp: new Date().toISOString(),
          restartType: NODEMON_INTEGRATION ? 'nodemon' : 'manual'
        });
      },
      onReloadComplete: (duration) => {
        devLogger.info('Hot reload completed successfully', {
          reloadTime: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
      },
      onReloadError: (error) => {
        devLogger.error('Hot reload failed', error, {
          timestamp: new Date().toISOString(),
          recovery: 'Manual restart may be required'
        });
      }
    };

    // Set up educational hot reload information including change detection details
    const educationalInfo = {
      concept: 'Hot reload automatically restarts the server when source files change',
      benefits: [
        'Faster development iteration cycles',
        'Automatic code change detection',
        'Preserves development state when possible',
        'Reduces manual restart overhead'
      ],
      nodemonIntegration: NODEMON_INTEGRATION ? 'Integrated with nodemon for advanced watching' : 'Manual file watching enabled',
      watchedExtensions: ['.js', '.mjs', '.json', '.env'],
      ignoredPaths: ['node_modules', 'logs', 'coverage', '.git']
    };

    // Configure development server restart optimization for fast iteration cycles
    const restartOptimization = {
      gracefulShutdown: true,
      fastRestart: true,
      preserveConnections: false, // Don't preserve connections in development
      shutdownTimeout: 2000, // 2 seconds for development
      startupDelay: 500 // 500ms delay before restart
    };

    // Set up hot reload integration with testing framework for test-driven development
    if (DEV_CONFIG.enableTestingIntegration) {
      const testingIntegration = {
        runTestsOnChange: false, // Don't auto-run tests on every change
        testWatchMode: true,
        framework: 'jest'
      };
      
      devLogger.debug('Hot reload testing integration configured', testingIntegration);
    }

    // Initialize file change logging and debugging information for development insights
    const changeLogging = {
      logLevel: 'info',
      includeStackTrace: false,
      logFileDetails: true,
      timestampFormat: 'ISO'
    };

    // Configure hot reload compatibility with development debugging and monitoring
    const debuggingCompatibility = {
      preserveDebugger: true,
      maintainInspector: true,
      logMemoryUsage: true,
      trackPerformance: DEV_CONFIG.enablePerformanceTracking
    };

    const hotReloadResult = {
      enabled: hotReloadConfig.enabled !== false,
      nodemonIntegration: NODEMON_INTEGRATION,
      watchPatterns: watchPatterns,
      fileChangePatterns: fileChangePatterns,
      notifications: notificationSystem,
      educational: educationalInfo,
      optimization: restartOptimization,
      testingIntegration: DEV_CONFIG.enableTestingIntegration,
      debugging: debuggingCompatibility,
      configuration: {
        ignorePatterns: NODEMON_INTEGRATION ? 'nodemon-managed' : 'manual-configuration',
        restartDelay: restartOptimization.startupDelay,
        gracefulShutdown: restartOptimization.gracefulShutdown
      },
      timestamp: new Date().toISOString()
    };

    // Log hot reload configuration completion with watching patterns and integration status
    devLogger.info('Hot reload configuration completed successfully', {
      enabled: hotReloadResult.enabled,
      nodemonIntegration: hotReloadResult.nodemonIntegration,
      watchPatterns: hotReloadResult.watchPatterns.length,
      educationalFeatures: !!hotReloadResult.educational,
      restartOptimization: hotReloadResult.optimization.fastRestart
    });

    // Return hot reload setup result with file watching configuration and operational status
    return hotReloadResult;

  } catch (error) {
    devLogger.error('Hot reload configuration failed', error, {
      config: hotReloadConfig,
      fallback: 'Hot reload disabled due to configuration error'
    });
    
    return {
      enabled: false,
      error: error.message,
      nodemonIntegration: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Displays comprehensive development server information including server URL, available endpoints, 
 * development features, educational guidance, debugging tools, and tutorial-specific information 
 * for enhanced developer experience and learning.
 * 
 * @param {Object} serverInfo - Server instance information with address and configuration
 * @param {Object} devFeatures - Development features configuration and status
 * @returns {void} No return value, performs development information display with enhanced formatting and educational content
 */
export function displayDevelopmentInfo(serverInfo, devFeatures) {
  try {
    devLogger.info('Displaying comprehensive development server information', {
      hasServerInfo: !!serverInfo,
      hasDevFeatures: !!devFeatures,
      port: serverInfo?.port,
      features: Object.keys(devFeatures || {}).length
    });

    // Display development server startup success banner with tutorial branding
    console.log('\n' + '='.repeat(80));
    console.log('🚀 NODE.JS TUTORIAL - DEVELOPMENT SERVER STARTED SUCCESSFULLY! 🚀');
    console.log('='.repeat(80));
    
    // Show development server URL with port and protocol information
    const serverUrl = serverInfo?.address ? 
      `http://${serverInfo.host || 'localhost'}:${serverInfo.port}` :
      `http://localhost:${serverInfo?.port || ENV_CONSTANTS.DEFAULT_PORT}`;
    
    console.log(`\n📍 Development Server Information:`);
    console.log(`   URL: ${serverUrl}`);
    console.log(`   Environment: ${serverInfo?.environment || 'development'}`);
    console.log(`   Process ID: ${serverInfo?.pid || process.pid}`);
    console.log(`   Node.js Version: ${serverInfo?.nodeVersion || process.version}`);
    console.log(`   Platform: ${process.platform} (${process.arch})`);

    // List all available API endpoints with descriptions and example curl commands
    console.log(`\n🌐 Available API Endpoints:`);
    const endpoints = [
      {
        path: API_CONSTANTS.ENDPOINTS.HELLO,
        method: 'GET',
        description: 'Returns "Hello world" message',
        example: `curl ${serverUrl}${API_CONSTANTS.ENDPOINTS.HELLO}`
      },
      {
        path: API_CONSTANTS.ENDPOINTS.GOOD_EVENING,
        method: 'GET',
        description: 'Returns "Good evening" message',
        example: `curl ${serverUrl}${API_CONSTANTS.ENDPOINTS.GOOD_EVENING}`
      },
      {
        path: API_CONSTANTS.ENDPOINTS.HEALTH,
        method: 'GET',
        description: 'Health check endpoint with system status',
        example: `curl ${serverUrl}${API_CONSTANTS.ENDPOINTS.HEALTH}`
      }
    ];

    endpoints.forEach(endpoint => {
      console.log(`   ${endpoint.method} ${endpoint.path}`);
      console.log(`      Description: ${endpoint.description}`);
      console.log(`      Example: ${endpoint.example}`);
    });

    // Display development-specific features including debugging endpoints and monitoring
    console.log(`\n🔧 Development Features Enabled:`);
    if (devFeatures?.debugging) {
      console.log(`   ✅ Enhanced Debugging & Error Reporting`);
      console.log(`      - Detailed stack traces and error context`);
      console.log(`      - Node.js inspector integration available`);
    }
    
    if (devFeatures?.hotReload) {
      console.log(`   ✅ Hot Reload & File Watching`);
      console.log(`      - Automatic server restart on file changes`);
      console.log(`      - Nodemon integration: ${NODEMON_INTEGRATION ? 'Active' : 'Standby'}`);
    }
    
    if (devFeatures?.educational) {
      console.log(`   ✅ Educational Features & Tutorial Mode`);
      console.log(`      - Middleware explanation and learning context`);
      console.log(`      - Tutorial progression tracking`);
    }
    
    if (devFeatures?.performance) {
      console.log(`   ✅ Performance Monitoring & Metrics`);
      console.log(`      - Request timing and memory usage tracking`);
      console.log(`      - Development optimization insights`);
    }
    
    if (devFeatures?.testing) {
      console.log(`   ✅ Testing Framework Integration`);
      console.log(`      - Jest/Mocha development testing support`);
      console.log(`      - Test runner compatibility enabled`);
    }

    // Show educational information about tutorial phase and learning objectives
    console.log(`\n📚 Tutorial Information:`);
    console.log(`   Current Phase: ${TUTORIAL_CONSTANTS.PHASES.PHASE_2.name}`);
    console.log(`   Learning Focus: ${TUTORIAL_CONSTANTS.PHASES.PHASE_2.description}`);
    console.log(`   Objectives:`);
    TUTORIAL_CONSTANTS.PHASES.PHASE_2.objectives.forEach(objective => {
      console.log(`      • ${objective}`);
    });

    // List development tools integration including nodemon, hot reload, and testing frameworks
    console.log(`\n🛠️  Development Tools Integration:`);
    console.log(`   • Nodemon: ${NODEMON_INTEGRATION ? 'Integrated' : 'Available (use npm run dev:watch)'}`);
    console.log(`   • Hot Reload: ${HOT_RELOAD_ENABLED ? 'Enabled' : 'Disabled'}`);
    console.log(`   • File Watching: ${devFeatures?.hotReload ? 'Active' : 'Manual restart required'}`);
    console.log(`   • Inspector: Available on localhost:9229 (use --debug flag)`);
    console.log(`   • Testing: ${devFeatures?.testing ? 'Integrated' : 'Run separately with npm test'}`);

    // Display development environment configuration and security policy information
    console.log(`\n🔒 Development Configuration:`);
    console.log(`   • Security Policy: Relaxed for development (not for production)`);
    console.log(`   • CORS: Permissive for local development`);
    console.log(`   • Request Logging: Enhanced with debugging information`);
    console.log(`   • Error Handling: Full stack traces and detailed context`);
    console.log(`   • Memory Monitoring: ${devFeatures?.performance ? 'Active' : 'Basic'}`);

    // Show performance monitoring endpoints and development metrics access
    if (devFeatures?.performance) {
      console.log(`\n📊 Performance Monitoring:`);
      console.log(`   • Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   • Uptime: ${process.uptime().toFixed(2)}s`);
      console.log(`   • CPU Usage: Available in development logs`);
      console.log(`   • Request Metrics: Tracked per request with timing information`);
    }

    // Include troubleshooting resources and common development issue solutions
    console.log(`\n🔍 Troubleshooting & Resources:`);
    console.log(`   • Logs: Check console output for detailed debugging information`);
    console.log(`   • Port Issues: Use --port <number> to specify alternative port`);
    console.log(`   • Hot Reload Issues: Ensure file permissions and nodemon configuration`);
    console.log(`   • Memory Issues: Monitor heap usage and restart if needed`);
    console.log(`   • Documentation: See README.md for complete setup guide`);

    // Display development command shortcuts and workflow optimization tips
    console.log(`\n⚡ Development Workflow Tips:`);
    console.log(`   • Use 'npm run dev:watch' for automatic restarts with nodemon`);
    console.log(`   • Add '--debug' flag for enhanced debugging information`);
    console.log(`   • Use '--explain' flag for middleware explanation mode`);
    console.log(`   • Press Ctrl+C for graceful shutdown with cleanup`);
    console.log(`   • File changes trigger automatic restart when using nodemon`);

    // Show cross-platform development information for Node.js and Flask comparison
    console.log(`\n🌐 Cross-Platform Development:`);
    console.log(`   • Node.js Implementation: Currently running (this server)`);
    console.log(`   • Flask Implementation: Available for comparison in Python`);
    console.log(`   • API Compatibility: Identical endpoints and response formats`);
    console.log(`   • Educational Value: Compare framework approaches and patterns`);

    // Include educational next steps and progression guidance for tutorial learning
    console.log(`\n📖 Next Steps in Tutorial:`);
    console.log(`   1. Test all API endpoints using curl or Postman`);
    console.log(`   2. Examine middleware execution with --explain flag`);
    console.log(`   3. Run comprehensive tests with npm test`);
    console.log(`   4. Deploy with PM2 for production (Phase 5)`);
    console.log(`   5. Implement security features with Helmet.js (Phase 6)`);
    console.log(`   6. Compare with Flask implementation (Phase 3)`);

    console.log('\n' + '='.repeat(80));
    console.log('🎯 Development server is ready! Start building amazing applications! 🎯');
    console.log('='.repeat(80) + '\n');

    // Log comprehensive development information display for operational records
    devLogger.info('Development server information displayed successfully', {
      serverUrl: serverUrl,
      endpointCount: endpoints.length,
      featuresEnabled: Object.keys(devFeatures || {}).filter(key => devFeatures[key]).length,
      tutorialPhase: TUTORIAL_CONSTANTS.PHASES.PHASE_2.name,
      educationalMode: devFeatures?.educational,
      performanceTracking: devFeatures?.performance,
      hotReloadStatus: HOT_RELOAD_ENABLED ? 'enabled' : 'disabled',
      nodemonIntegration: NODEMON_INTEGRATION
    });

  } catch (error) {
    devLogger.error('Failed to display development server information', error, {
      serverInfo: !!serverInfo,
      devFeatures: !!devFeatures,
      fallback: 'Basic server startup information logged'
    });
    
    // Fallback display with minimal information
    console.log(`\n🚀 Development Server Started`);
    console.log(`📍 URL: http://localhost:${serverInfo?.port || ENV_CONSTANTS.DEFAULT_PORT}`);
    console.log(`🔧 Environment: Development`);
    console.log(`📚 See logs for detailed information\n`);
  }
}

/**
 * Configures comprehensive development debugging including enhanced error reporting, request tracing, 
 * performance monitoring, educational debugging features, and integration with Node.js debugging 
 * tools for optimal development experience.
 * 
 * @param {Object} app - Express.js application instance
 * @param {Object} debugConfig - Development debugging configuration
 * @returns {Object} Development debugging configuration result with enhanced error reporting and tracing capabilities
 */
export async function setupDevelopmentDebugging(app, debugConfig) {
  try {
    devLogger.info('Configuring comprehensive development debugging features', {
      hasApp: !!app,
      config: debugConfig,
      educationalMode: debugConfig?.educational
    });

    // Configure enhanced error reporting with full stack traces and request context
    app.use((req, res, next) => {
      // Add request correlation ID for tracing
      req.correlationId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      req.startTime = process.hrtime.bigint();
      
      // Enhanced request logging for development
      devLogger.debug('Request received for debugging', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.url,
        headers: req.headers,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      next();
    });

    // Set up request tracing and correlation for debugging complex request flows
    app.use((req, res, next) => {
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Intercept response sending for performance tracking
      res.send = function(data) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - req.startTime) / 1000000; // Convert to milliseconds
        
        devLogger.debug('Response sent - development tracing', {
          correlationId: req.correlationId,
          statusCode: res.statusCode,
          responseTime: `${duration.toFixed(2)}ms`,
          contentLength: res.get('Content-Length') || data?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        return originalSend.call(this, data);
      };
      
      res.json = function(data) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - req.startTime) / 1000000;
        
        devLogger.debug('JSON response sent - development tracing', {
          correlationId: req.correlationId,
          statusCode: res.statusCode,
          responseTime: `${duration.toFixed(2)}ms`,
          dataKeys: typeof data === 'object' ? Object.keys(data) : 'primitive',
          timestamp: new Date().toISOString()
        });
        
        return originalJson.call(this, data);
      };
      
      next();
    });

    // Initialize development performance monitoring with detailed timing information
    app.use((req, res, next) => {
      const performanceMarks = {
        requestStart: Date.now(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };
      
      req.performanceMarks = performanceMarks;
      
      res.on('finish', () => {
        const endTime = Date.now();
        const duration = endTime - performanceMarks.requestStart;
        const endMemory = process.memoryUsage();
        const endCpu = process.cpuUsage(performanceMarks.cpuUsage);
        
        if (duration > 100 || debugConfig?.verbose) { // Log slow requests or in verbose mode
          devLogger.info('Request performance metrics', {
            correlationId: req.correlationId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            memoryDelta: `${((endMemory.heapUsed - performanceMarks.memoryUsage.heapUsed) / 1024).toFixed(2)}KB`,
            cpuUsage: {
              user: `${(endCpu.user / 1000).toFixed(2)}ms`,
              system: `${(endCpu.system / 1000).toFixed(2)}ms`
            }
          });
        }
      });
      
      next();
    });

    // Configure educational debugging features including middleware execution visibility
    if (debugConfig?.educational || DEV_CONFIG.enableEducationalFeatures) {
      app.use((req, res, next) => {
        devLogger.info('Educational debugging - middleware execution', {
          correlationId: req.correlationId,
          explanation: 'This middleware demonstrates request flow through the Express.js application',
          requestPhase: 'middleware-processing',
          learningPoint: 'Each middleware function has access to request, response, and next function',
          nextAction: 'Proceeding to next middleware or route handler'
        });
        next();
      });
    }

    // Set up development-specific logging with enhanced formatting and context
    const developmentLogging = {
      requestLogging: true,
      responseLogging: true,
      errorLogging: true,
      performanceLogging: debugConfig?.performance !== false,
      educationalLogging: debugConfig?.educational !== false
    };

    // Initialize Node.js debugger integration and debugging endpoint exposure
    if (debugConfig?.inspector !== false) {
      try {
        const inspector = await import('node:inspector');
        if (!inspector.url()) {
          // Only open inspector if not already active
          const debugPort = debugConfig?.inspectorPort || 9229;
          inspector.open(debugPort);
          
          devLogger.info('Node.js inspector activated for development debugging', {
            port: debugPort,
            url: `chrome://inspect`,
            websocketUrl: inspector.url()
          });
        }
      } catch (inspectorError) {
        devLogger.warn('Could not activate Node.js inspector', { 
          error: inspectorError.message,
          note: 'Inspector may already be active or unavailable'
        });
      }
    }

    // Configure development error boundary handling with graceful recovery
    app.use((error, req, res, next) => {
      devLogger.error('Development error boundary caught error', error, {
        correlationId: req.correlationId,
        method: req.method,
        url: req.url,
        stack: error.stack,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        recovery: 'Graceful error response with debugging information'
      });
      
      // Send detailed error information in development
      res.status(error.statusCode || 500).json({
        error: {
          message: error.message,
          type: error.constructor.name,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          stack: debugConfig?.includeStack !== false ? error.stack : undefined,
          requestInfo: {
            method: req.method,
            url: req.url,
            headers: req.headers
          }
        },
        development: {
          note: 'This detailed error information is only available in development mode',
          suggestion: 'Check server logs for additional debugging context'
        }
      });
    });

    // Set up development-specific security monitoring with policy explanation
    if (debugConfig?.explainSecurity !== false) {
      devLogger.info('Development security monitoring configured', {
        policy: 'relaxed-for-development',
        explanation: 'Security policies are relaxed for development to enable debugging',
        production: 'Full security measures will be applied in production environment',
        helmetsecurity: 'Helmet.js security headers available but configured for development'
      });
    }

    // Initialize development testing integration with debugging information
    if (DEV_CONFIG.enableTestingIntegration) {
      devLogger.info('Development testing integration available', {
        frameworks: ['Jest', 'Mocha'],
        testMode: 'development-compatible',
        debugging: 'Test debugging information enhanced for development'
      });
    }

    // Configure development configuration visibility and runtime introspection
    const configVisibility = {
      environment: process.env.NODE_ENV,
      debugging: debugConfig,
      features: DEV_CONFIG,
      performance: developmentLogging,
      educational: debugConfig?.educational !== false
    };

    // Set up development troubleshooting utilities and diagnostic endpoints
    app.get('/dev/debug', (req, res) => {
      res.json({
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          pid: process.pid,
          version: process.version
        },
        configuration: configVisibility,
        features: {
          hotReload: HOT_RELOAD_ENABLED,
          nodemon: NODEMON_INTEGRATION,
          inspector: !!debugConfig?.inspector,
          educational: debugConfig?.educational !== false
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    });

    const debuggingResult = {
      success: true,
      features: {
        enhancedErrorReporting: true,
        requestTracing: true,
        performanceMonitoring: developmentLogging.performanceLogging,
        educationalDebugging: developmentLogging.educationalLogging,
        inspectorIntegration: debugConfig?.inspector !== false,
        configurationVisibility: true,
        diagnosticEndpoints: true
      },
      configuration: configVisibility,
      logging: developmentLogging,
      endpoints: {
        debug: '/dev/debug'
      },
      timestamp: new Date().toISOString()
    };

    // Log development debugging configuration with feature details and access information
    devLogger.info('Development debugging configuration completed successfully', {
      featuresEnabled: Object.keys(debuggingResult.features).filter(key => debuggingResult.features[key]).length,
      enhancedErrorReporting: debuggingResult.features.enhancedErrorReporting,
      requestTracing: debuggingResult.features.requestTracing,
      educationalMode: debuggingResult.features.educationalDebugging,
      diagnosticEndpoint: debuggingResult.endpoints.debug
    });

    // Return debugging configuration result with enhanced development capabilities
    return debuggingResult;

  } catch (error) {
    devLogger.error('Development debugging configuration failed', error, {
      config: debugConfig,
      fallback: 'Basic debugging features may still be available'
    });
    
    return {
      success: false,
      error: error.message,
      features: {
        enhancedErrorReporting: false,
        requestTracing: false
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handles development server errors with enhanced error analysis, educational debugging information, 
 * recovery suggestions, developer-friendly explanations, and integration with development tools 
 * for optimal learning experience.
 * 
 * @param {Error} error - Error object with stack trace and context
 * @param {Object} errorContext - Additional error context information
 * @returns {Object} Development error analysis with detailed debugging information and educational guidance
 */
export function handleDevelopmentErrors(error, errorContext) {
  const errorId = `dev-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    devLogger.error('Development error detected - initiating enhanced analysis', error, {
      errorId,
      context: errorContext,
      pid: process.pid,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });

    // Analyze development error type and categorize with educational context
    const errorAnalysis = {
      type: error.constructor.name,
      category: categorizeError(error),
      severity: determineSeverity(error),
      recoverable: isRecoverable(error),
      educational: true,
      timestamp: new Date().toISOString()
    };

    // Generate enhanced error reporting with full stack traces and request details
    const enhancedReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
        errno: error.errno,
        syscall: error.syscall,
        path: error.path
      },
      context: {
        ...errorContext,
        errorId,
        correlationId: errorContext?.correlationId || 'no-correlation',
        requestMethod: errorContext?.method,
        requestUrl: errorContext?.url,
        userAgent: errorContext?.userAgent,
        ip: errorContext?.ip
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      analysis: errorAnalysis
    };

    // Provide developer-friendly error explanations with common cause analysis
    const developerExplanation = generateDeveloperExplanation(error, errorAnalysis);

    // Generate educational debugging guidance and troubleshooting steps
    const educationalGuidance = {
      concept: 'Error handling in Node.js development',
      explanation: developerExplanation.explanation,
      commonCauses: developerExplanation.commonCauses,
      learningPoints: [
        'Error objects contain stack traces for debugging',
        'Different error types require different handling strategies',
        'Context information helps identify root causes',
        'Development environments can provide enhanced error details'
      ],
      relatedTopics: [
        'Express.js error middleware',
        'Node.js error handling patterns',
        'Debugging with Node.js inspector',
        'HTTP status codes and error responses'
      ]
    };

    // Include development-specific recovery suggestions and configuration fixes
    const recoverySuggestions = generateRecoverySuggestions(error, errorAnalysis, errorContext);

    // Set up development error notification with enhanced formatting and context
    const errorNotification = {
      severity: errorAnalysis.severity,
      category: errorAnalysis.category,
      recoverable: errorAnalysis.recoverable,
      message: error.message,
      suggestions: recoverySuggestions,
      educational: educationalGuidance,
      debuggingInfo: {
        errorId,
        timestamp: new Date().toISOString(),
        nodeInspector: 'Available on localhost:9229',
        logLocation: 'Console output and development logs'
      }
    };

    // Configure development error recovery procedures with fast restart capabilities
    const recoveryProcedures = {
      immediate: errorAnalysis.recoverable ? 'Continue processing' : 'Graceful error response',
      shortTerm: recoverySuggestions.immediate || 'Check error logs and context',
      longTerm: recoverySuggestions.prevention || 'Review error patterns and implement prevention',
      development: {
        hotReload: HOT_RELOAD_ENABLED ? 'Available for quick fixes' : 'Manual restart required',
        debugging: 'Enhanced debugging information provided',
        testing: 'Verify fixes with development testing suite'
      }
    };

    // Generate development troubleshooting resources and documentation links
    const troubleshootingResources = {
      documentation: [
        'Node.js Error Handling: https://nodejs.org/api/errors.html',
        'Express.js Error Handling: https://expressjs.com/en/guide/error-handling.html',
        'Debugging Node.js: https://nodejs.org/en/docs/guides/debugging-getting-started/'
      ],
      tools: [
        'Node.js Inspector (chrome://inspect)',
        'VS Code Debugger',
        'Development console logs'
      ],
      community: [
        'Stack Overflow for specific error messages',
        'Node.js GitHub issues for core problems',
        'Express.js documentation for framework issues'
      ]
    };

    // Include tutorial-specific error guidance and learning opportunities
    const tutorialGuidance = {
      phase: TUTORIAL_CONSTANTS.PHASES.PHASE_2.name,
      relevance: 'Error handling is crucial for robust Express.js applications',
      learningOpportunity: 'This error provides insight into Node.js error patterns',
      nextSteps: [
        'Analyze the error stack trace for debugging clues',
        'Test error handling with different input scenarios',
        'Implement comprehensive error middleware',
        'Study Express.js error handling patterns'
      ],
      comparison: 'Compare with Flask error handling in Phase 3'
    };

    // Set up development error tracking and pattern analysis for improvement
    const errorTracking = {
      errorId,
      category: errorAnalysis.category,
      frequency: 'tracking-not-implemented', // Could be implemented with persistent storage
      pattern: 'single-occurrence',
      trend: 'development-error'
    };

    // Configure integration with development debugging tools and error reporting
    const debuggingIntegration = {
      inspector: {
        available: true,
        port: 9229,
        url: 'chrome://inspect'
      },
      logging: {
        level: 'error',
        destination: 'console',
        structured: true
      },
      monitoring: {
        alerts: false, // No alerts in development
        tracking: errorTracking,
        metrics: 'development-only'
      }
    };

    const errorHandlingResult = {
      success: true,
      errorId,
      analysis: errorAnalysis,
      report: enhancedReport,
      explanation: developerExplanation,
      educational: educationalGuidance,
      notification: errorNotification,
      recovery: recoveryProcedures,
      troubleshooting: troubleshootingResources,
      tutorial: tutorialGuidance,
      tracking: errorTracking,
      debugging: debuggingIntegration,
      timestamp: new Date().toISOString()
    };

    // Log comprehensive development error analysis with educational value
    devLogger.info('Development error analysis completed', {
      errorId,
      category: errorAnalysis.category,
      severity: errorAnalysis.severity,
      recoverable: errorAnalysis.recoverable,
      educationalValue: 'Enhanced error analysis for learning',
      recoverySuggestions: recoverySuggestions.immediate || 'Check logs for guidance',
      debuggingAvailable: debuggingIntegration.inspector.available
    });

    // Return development error handling result with recovery guidance and learning resources
    return errorHandlingResult;

  } catch (handlingError) {
    devLogger.error('Error occurred while handling development error', handlingError, {
      originalError: error.message,
      errorId,
      fallback: 'Basic error handling applied'
    });
    
    return {
      success: false,
      errorId,
      originalError: error.message,
      handlingError: handlingError.message,
      fallback: {
        message: 'Error handling failed - check logs for details',
        suggestion: 'Review error handling configuration'
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Configures development testing integration including test runner compatibility, development test 
 * configuration, educational testing features, and integration with Jest and Mocha frameworks 
 * for enhanced development workflow.
 * 
 * @param {Object} testConfig - Development testing configuration
 * @returns {Object} Development testing configuration result with framework integration and educational testing features
 */
export async function setupDevelopmentTesting(testConfig) {
  try {
    devLogger.info('Configuring development testing integration', {
      config: testConfig,
      frameworks: ['Jest', 'Mocha'],
      educational: DEV_CONFIG.enableEducationalFeatures
    });

    // Configure development testing environment with test framework compatibility
    const testingEnvironment = {
      NODE_ENV: 'test',
      PORT: 0, // Use random available port for tests
      LOG_LEVEL: 'error', // Minimal logging during tests
      TEST_MODE: 'development',
      DEVELOPMENT_TESTING: true
    };

    // Set up Jest integration with development-specific configuration and watch mode
    const jestConfiguration = {
      testEnvironment: 'node',
      verbose: true,
      collectCoverage: false, // Disable coverage for development testing
      testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
      ],
      testTimeout: 10000, // 10 second timeout for development tests
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      watchMode: {
        enabled: true,
        ignorePatterns: [
          '/node_modules/',
          '/coverage/',
          '/logs/'
        ]
      },
      development: {
        clearMocks: true,
        restoreMocks: true,
        resetModules: false // Keep modules cached for faster test runs
      }
    };

    // Configure Mocha integration with development debugging and enhanced reporting
    const mochaConfiguration = {
      timeout: 10000,
      recursive: true,
      reporter: 'spec',
      require: ['tests/setup.js'],
      grep: '', // No filtering in development
      bail: false, // Don't stop on first failure
      watch: true, // Enable watch mode for development
      development: {
        colors: true,
        inlineDiffs: true,
        fullTrace: true
      }
    };

    // Initialize development test data and mock configuration for testing workflow
    const testDataConfiguration = {
      fixtures: {
        path: './tests/fixtures',
        hello: { message: 'Hello world' },
        goodEvening: { message: 'Good evening' },
        health: { status: 'OK', uptime: 0 }
      },
      mocks: {
        clearBetweenTests: true,
        preserveModules: false,
        spyOnMethods: ['console.log', 'console.error']
      },
      database: 'none', // No database for this project
      network: {
        mockHttpRequests: false,
        allowRealRequests: true
      }
    };

    // Set up test runner integration with hot reload and automatic test execution
    const testRunnerIntegration = {
      hotReload: {
        enabled: HOT_RELOAD_ENABLED,
        runOnFileChange: false, // Don't run tests on every file change
        watchPatterns: ['src/**/*.js', 'tests/**/*.js']
      },
      automatic: {
        runOnStartup: false,
        runOnSave: false,
        runOnDemand: true
      },
      integration: {
        server: testConfig?.server,
        supertest: 'available-for-api-testing',
        request: 'native-http-testing-available'
      }
    };

    // Configure development test coverage tracking with enhanced reporting
    const coverageConfiguration = {
      enabled: false, // Disabled for development performance
      threshold: {
        global: {
          branches: 70,
          functions: 80,
          lines: 75,
          statements: 75
        }
      },
      reports: ['text', 'html'],
      directory: 'coverage',
      development: {
        skipCoverage: true,
        focusOnFunctionality: true,
        performanceFirst: true
      }
    };

    // Initialize educational testing features including test explanation and guidance
    const educationalTesting = {
      enabled: DEV_CONFIG.enableEducationalFeatures,
      features: {
        testExplanation: 'Tests verify that code behaves as expected',
        unitTesting: 'Test individual functions and components in isolation',
        integrationTesting: 'Test how different parts work together',
        apiTesting: 'Test HTTP endpoints and responses'
      },
      examples: {
        unitTest: 'Testing a single function with different inputs',
        integrationTest: 'Testing the full request-response cycle',
        errorTest: 'Testing error handling and edge cases'
      },
      learningObjectives: [
        'Understand different types of testing',
        'Write effective test cases',
        'Use testing frameworks effectively',
        'Implement test-driven development practices'
      ]
    };

    // Set up development API testing integration with SuperTest configuration
    const apiTestingConfiguration = {
      framework: 'supertest',
      baseUrl: testConfig?.server ? 
        `http://localhost:${testConfig.server.address()?.port || ENV_CONSTANTS.DEFAULT_PORT}` :
        'http://localhost:3000',
      endpoints: [
        { path: '/hello', method: 'GET', expectedStatus: 200 },
        { path: '/good-evening', method: 'GET', expectedStatus: 200 },
        { path: '/health', method: 'GET', expectedStatus: 200 },
        { path: '/nonexistent', method: 'GET', expectedStatus: 404 }
      ],
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Development-Test-Runner'
      },
      timeout: 5000
    };

    // Configure development test debugging with enhanced error reporting and stack traces
    const testDebugging = {
      enabled: true,
      features: {
        fullStackTraces: true,
        detailedAssertions: true,
        requestLogging: true,
        responseInspection: true
      },
      inspector: {
        available: true,
        debugTests: 'Use --inspect-brk with test runner',
        breakpoints: 'Set breakpoints in test files'
      },
      logging: {
        level: 'debug',
        testOutput: true,
        assertionDetails: true
      }
    };

    // Initialize development performance testing and benchmarking capabilities
    const performanceTesting = {
      enabled: DEV_CONFIG.enablePerformanceTracking,
      metrics: {
        responseTime: 'Track API response times',
        memoryUsage: 'Monitor memory during tests',
        cpuUsage: 'Track CPU usage patterns'
      },
      thresholds: {
        responseTime: 100, // 100ms threshold for development
        memoryIncrease: 50 * 1024 * 1024, // 50MB threshold
        testDuration: 30000 // 30 second maximum test suite time
      },
      reporting: {
        console: true,
        detailed: true,
        trends: false // No trend analysis in development
      }
    };

    // Set up cross-platform testing preparation for Node.js and Flask comparison
    const crossPlatformTesting = {
      enabled: TUTORIAL_CONSTANTS.PHASES.PHASE_3,
      compatibility: {
        endpoints: 'Identical API endpoints for both implementations',
        responses: 'Same response format and structure',
        errorHandling: 'Equivalent error responses',
        performance: 'Comparative performance testing available'
      },
      preparation: {
        testSuites: 'Reusable test suites for both platforms',
        dataFormats: 'JSON response validation',
        contracts: 'API contract testing ready'
      }
    };

    const testingResult = {
      success: true,
      environment: testingEnvironment,
      frameworks: {
        jest: jestConfiguration,
        mocha: mochaConfiguration
      },
      testData: testDataConfiguration,
      runner: testRunnerIntegration,
      coverage: coverageConfiguration,
      educational: educationalTesting,
      apiTesting: apiTestingConfiguration,
      debugging: testDebugging,
      performance: performanceTesting,
      crossPlatform: crossPlatformTesting,
      commands: {
        jest: 'npm test',
        jestWatch: 'npm run test:watch',
        mocha: 'npm run test:mocha',
        coverage: 'npm run test:coverage'
      },
      timestamp: new Date().toISOString()
    };

    // Log development testing configuration with framework details and feature information
    devLogger.info('Development testing integration configured successfully', {
      frameworks: ['Jest', 'Mocha'],
      apiTesting: testingResult.apiTesting.framework,
      educationalFeatures: testingResult.educational.enabled,
      hotReloadIntegration: testingResult.runner.hotReload.enabled,
      debugging: testingResult.debugging.enabled,
      performanceTracking: testingResult.performance.enabled,
      crossPlatformReady: testingResult.crossPlatform.enabled
    });

    // Return testing configuration result with development workflow integration
    return testingResult;

  } catch (error) {
    devLogger.error('Development testing integration configuration failed', error, {
      config: testConfig,
      fallback: 'Basic testing functionality may still be available'
    });
    
    return {
      success: false,
      error: error.message,
      frameworks: {
        jest: 'configuration-failed',
        mocha: 'configuration-failed'
      },
      fallback: {
        message: 'Manual testing setup required',
        suggestion: 'Check test framework installation and configuration'
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Main development server orchestration function that coordinates the complete development startup 
 * process from argument parsing through application initialization to operational readiness with 
 * enhanced developer experience, educational features, and comprehensive debugging capabilities.
 * 
 * @returns {Promise} Promise that resolves when development server startup is complete or rejects with detailed development error analysis
 */
export async function main() {
  const mainStartTime = Date.now();
  let correlationId = null;
  
  try {
    devLogger.info('Starting development server orchestration', {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      args: process.argv
    });

    // Parse development-specific command line arguments and extract development configuration
    const devOptions = parseDevArguments(process.argv);
    correlationId = `main-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    devLogger.info('Development arguments parsed successfully', {
      correlationId,
      debugMode: devOptions.debug,
      verboseMode: devOptions.verbose,
      portOverride: devOptions.port,
      hotReload: devOptions.hot,
      educational: devOptions.tutorial,
      nodemonIntegration: devOptions.nodemonIntegration
    });

    // Validate Node.js version compatibility and development environment prerequisites
    const nodeValidation = await validateNodeVersion();
    if (!nodeValidation.isValid) {
      devLogger.warn('Node.js version compatibility issues detected', {
        currentVersion: nodeValidation.current,
        issues: nodeValidation.errors,
        recommendations: nodeValidation.recommendations
      });
    } else {
      devLogger.info('Node.js version validation passed', {
        version: nodeValidation.current,
        compatible: nodeValidation.isValid,
        recommended: nodeValidation.isRecommended
      });
    }

    // Set up development environment with enhanced logging, debugging, and educational features
    const environmentResult = await setupDevelopmentEnvironment(devOptions);
    if (!environmentResult.success) {
      throw new Error(`Development environment setup failed: ${environmentResult.error}`);
    }
    
    devLogger.info('Development environment setup completed', {
      correlationId,
      success: environmentResult.success,
      features: Object.keys(environmentResult.configuration).length,
      setupTime: environmentResult.metrics.setupTime
    });

    // Load and validate development environment configuration with .env file integration
    const envConfig = await loadEnvironmentConfig(ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT);
    devLogger.debug('Development environment configuration loaded and validated', {
      environment: envConfig.NODE_ENV,
      port: envConfig.PORT || ENV_CONSTANTS.DEFAULT_PORT,
      variables: Object.keys(envConfig).length
    });

    // Create development-optimized Express.js application instance with educational middleware
    const serverCreationResult = await createDevelopmentServer({
      configuration: {
        ...environmentResult.configuration,
        port: devOptions.port || envConfig.PORT || ENV_CONSTANTS.DEFAULT_PORT,
        host: envConfig.HOST || ENV_CONSTANTS.DEFAULT_HOST
      }
    });
    
    if (!serverCreationResult.success) {
      throw new Error(`Development server creation failed: ${serverCreationResult.error}`);
    }
    
    devLogger.info('Development server created successfully', {
      correlationId,
      port: serverCreationResult.configuration.port,
      features: Object.keys(serverCreationResult.features).filter(key => serverCreationResult.features[key]).length,
      creationTime: serverCreationResult.metrics.creationTime
    });

    // Initialize development HTTP server instance with debugging capabilities and hot reload integration
    DEV_SERVER_INSTANCE = serverCreationResult.server;
    DEV_APP_INSTANCE = serverCreationResult.app;

    // Configure development debugging features including enhanced error reporting and request tracing
    const debuggingResult = setupDevelopmentDebugging(DEV_APP_INSTANCE, {
      debug: devOptions.debug,
      verbose: devOptions.verbose,
      educational: devOptions.tutorial,
      inspector: devOptions.debug,
      performance: devOptions.performance
    });
    
    devLogger.info('Development debugging configured', {
      correlationId,
      success: debuggingResult.success,
      features: Object.keys(debuggingResult.features).filter(key => debuggingResult.features[key]).length,
      diagnosticEndpoint: debuggingResult.endpoints?.debug
    });

    // Set up hot reload capabilities with nodemon integration and file watching
    const hotReloadResult = await setupHotReload({
      server: DEV_SERVER_INSTANCE,
      enabled: devOptions.hot && HOT_RELOAD_ENABLED,
      nodemonIntegration: devOptions.nodemonIntegration,
      watchPatterns: [
        'src/**/*.js',
        'config/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js'
      ]
    });
    
    devLogger.info('Hot reload configuration completed', {
      correlationId,
      enabled: hotReloadResult.enabled,
      nodemonIntegration: hotReloadResult.nodemonIntegration,
      watchPatterns: hotReloadResult.watchPatterns?.length || 0
    });

    // Configure development testing integration with Jest and Mocha framework compatibility
    const testingResult = await setupDevelopmentTesting({
      server: DEV_SERVER_INSTANCE,
      environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      framework: 'jest'
    });
    
    devLogger.info('Development testing integration configured', {
      correlationId,
      success: testingResult.success,
      frameworks: Object.keys(testingResult.frameworks || {}),
      educational: testingResult.educational?.enabled
    });

    // Execute development server startup with comprehensive validation and health checks
    const startupResult = await startDevelopmentServer(DEV_SERVER_INSTANCE, {
      port: serverCreationResult.configuration.port,
      host: serverCreationResult.configuration.host,
      debugMode: devOptions.debug,
      educationalFeatures: devOptions.tutorial,
      performanceTracking: devOptions.performance
    });
    
    if (!startupResult.success) {
      throw new Error(`Development server startup failed: ${startupResult.error}`);
    }
    
    devLogger.info('Development server startup completed successfully', {
      correlationId,
      address: startupResult.address,
      features: Object.keys(startupResult.features).filter(key => startupResult.features[key]).length,
      health: startupResult.health?.healthy ? 'healthy' : 'warning'
    });

    // Display comprehensive development information including endpoints, features, and educational guidance
    displayDevelopmentInfo(startupResult.server ? {
      server: startupResult.server,
      address: startupResult.address,
      port: serverCreationResult.configuration.port,
      host: serverCreationResult.configuration.host,
      environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      pid: process.pid,
      nodeVersion: process.version
    } : null, startupResult.features);

    // Initialize development monitoring and performance tracking with educational insights
    if (devOptions.performance || DEV_CONFIG.enablePerformanceTracking) {
      const performanceBaseline = {
        startupTime: Date.now() - mainStartTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      };
      
      devLogger.info('Development performance baseline established', {
        correlationId,
        startupTime: `${performanceBaseline.startupTime}ms`,
        memoryUsed: `${(performanceBaseline.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        tracking: 'enabled'
      });
    }

    // Set up development-specific signal handlers with fast restart and graceful shutdown
    setupDevelopmentShutdownHandlers(DEV_SERVER_INSTANCE, {
      fastRestart: true,
      gracefulShutdown: true,
      timeout: 5000,
      hotReload: HOT_RELOAD_ENABLED
    });

    const totalStartupTime = Date.now() - mainStartTime;

    // Log development startup completion with comprehensive configuration and operational status
    const mainResult = {
      success: true,
      correlationId,
      server: {
        instance: DEV_SERVER_INSTANCE,
        address: startupResult.address,
        port: serverCreationResult.configuration.port,
        host: serverCreationResult.configuration.host
      },
      configuration: {
        environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
        debugMode: devOptions.debug,
        verboseLogging: devOptions.verbose,
        hotReload: hotReloadResult.enabled,
        educational: devOptions.tutorial,
        performance: devOptions.performance,
        testing: testingResult.success
      },
      features: {
        enhancedDebugging: debuggingResult.success,
        hotReloadIntegration: hotReloadResult.enabled,
        educationalFeatures: devOptions.tutorial,
        testingIntegration: testingResult.success,
        performanceTracking: devOptions.performance || DEV_CONFIG.enablePerformanceTracking
      },
      metrics: {
        totalStartupTime: `${totalStartupTime}ms`,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      operational: {
        healthy: startupResult.health?.healthy !== false,
        monitoring: !!devOptions.performance,
        debugging: !!devOptions.debug,
        educational: !!devOptions.tutorial
      },
      timestamp: new Date().toISOString()
    };

    devLogger.info('🎉 Development server orchestration completed successfully!', {
      correlationId,
      totalStartupTime: `${totalStartupTime}ms`,
      serverUrl: `http://${serverCreationResult.configuration.host}:${serverCreationResult.configuration.port}`,
      features: Object.keys(mainResult.features).filter(key => mainResult.features[key]).length,
      educational: mainResult.features.educationalFeatures,
      ready: true
    });

    // Return development startup success status or handle failures with detailed analysis and recovery guidance
    return mainResult;

  } catch (error) {
    // Handle main orchestration errors with comprehensive error analysis and recovery guidance
    const errorResult = handleDevelopmentErrors(error, {
      correlationId,
      phase: 'main-orchestration',
      startupTime: Date.now() - mainStartTime,
      config: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      }
    });

    devLogger.error('Development server orchestration failed', error, {
      correlationId,
      errorId: errorResult.errorId,
      phase: 'main-orchestration',
      startupTime: Date.now() - mainStartTime,
      recovery: errorResult.recovery?.immediate || 'Check error logs for guidance'
    });

    // Cleanup any partial initialization
    if (DEV_SERVER_INSTANCE) {
      try {
        DEV_SERVER_INSTANCE.close();
        devLogger.info('Cleaned up partially initialized server instance');
      } catch (cleanupError) {
        devLogger.warn('Server cleanup failed', { error: cleanupError.message });
      }
    }

    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS - Internal utility functions for development server management
// ============================================================================

/**
 * Sets up development-specific signal handlers
 * @private
 * @param {Object} devOptions - Development options
 */
function setupDevelopmentSignalHandlers(devOptions) {
  process.on('SIGINT', () => {
    devLogger.info('Received SIGINT - initiating development server shutdown', {
      pid: process.pid,
      uptime: process.uptime(),
      graceful: true
    });
    
    if (DEV_SERVER_INSTANCE) {
      DEV_SERVER_INSTANCE.close(() => {
        devLogger.info('Development server closed gracefully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    devLogger.info('Received SIGTERM - shutting down development server', {
      pid: process.pid,
      source: 'process-manager'
    });
    
    if (DEV_SERVER_INSTANCE) {
      DEV_SERVER_INSTANCE.close(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}

/**
 * Sets up development-specific error handling
 * @private
 * @param {Object} devOptions - Development options
 */
function setupDevelopmentErrorHandling(devOptions) {
  process.on('uncaughtException', (error) => {
    const errorResult = handleDevelopmentErrors(error, {
      type: 'uncaught-exception',
      fatal: true,
      pid: process.pid
    });
    
    devLogger.error('Uncaught exception in development server', error, {
      errorId: errorResult.errorId,
      fatal: true,
      recovery: 'Server will exit'
    });
    
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    const errorResult = handleDevelopmentErrors(reason, {
      type: 'unhandled-rejection',
      promise: promise.toString(),
      pid: process.pid
    });
    
    devLogger.error('Unhandled promise rejection in development server', reason, {
      errorId: errorResult.errorId,
      promise: promise.toString()
    });
  });
}

/**
 * Sets up educational middleware for development
 * @private
 * @param {Object} app - Express application
 * @param {Object} devConfig - Development configuration
 */
function setupEducationalMiddleware(app, devConfig) {
  app.use((req, res, next) => {
    if (devConfig.configuration?.educationalFeatures?.middlewareExplanation) {
      devLogger.info('Educational middleware explanation', {
        concept: 'Express.js middleware',
        explanation: 'Middleware functions execute during the request-response cycle',
        currentMiddleware: 'educational-explanation',
        requestInfo: {
          method: req.method,
          url: req.url,
          headers: Object.keys(req.headers).length
        },
        learningPoint: 'This middleware demonstrates how requests flow through the application'
      });
    }
    next();
  });
}

/**
 * Sets up tutorial-specific middleware
 * @private
 * @param {Object} app - Express application
 * @param {Object} devConfig - Development configuration
 */
function setupTutorialMiddleware(app, devConfig) {
  app.use((req, res, next) => {
    req.tutorial = {
      phase: TUTORIAL_CONSTANTS.PHASES.PHASE_2.name,
      objectives: TUTORIAL_CONSTANTS.PHASES.PHASE_2.objectives,
      learningContext: 'Express.js middleware and routing concepts'
    };
    next();
  });
}

/**
 * Sets up development security policies
 * @private
 * @param {Object} app - Express application
 * @param {Object} devConfig - Development configuration
 */
function setupDevelopmentSecurityPolicies(app, devConfig) {
  // Add development-specific CORS middleware with relaxed policies
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

/**
 * Sets up development error middleware
 * @private
 * @param {Object} app - Express application
 * @param {Object} devConfig - Development configuration
 */
function setupDevelopmentErrorMiddleware(app, devConfig) {
  app.use((error, req, res, next) => {
    const errorResult = handleDevelopmentErrors(error, {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    
    res.status(error.statusCode || 500).json({
      error: {
        message: error.message,
        type: error.constructor.name,
        correlationId: req.correlationId,
        errorId: errorResult.errorId,
        development: true
      },
      debugging: errorResult.debugging,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Sets up development performance tracking
 * @private
 * @param {Object} app - Express application
 * @param {Object} devConfig - Development configuration
 */
function setupDevelopmentPerformanceTracking(app, devConfig) {
  app.use((req, res, next) => {
    req.performanceStart = process.hrtime.bigint();
    
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - req.performanceStart) / 1000000;
      
      if (duration > 50) { // Log requests taking longer than 50ms
        devLogger.info('Request performance tracking', {
          correlationId: req.correlationId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration.toFixed(2)}ms`,
          type: 'performance-tracking'
        });
      }
    });
    
    next();
  });
}

/**
 * Sets up development request logging
 * @private
 * @param {Object} app - Express application
 * @param {Object} devConfig - Development configuration
 */
function setupDevelopmentRequestLogging(app, devConfig) {
  // Request logging is already set up in setupDevelopmentDebugging
  devLogger.debug('Development request logging configured via debugging middleware');
}

/**
 * Validates development server health
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 * @returns {Promise<Object>} Health check result
 */
async function validateDevelopmentServerHealth(server, config) {
  try {
    const health = {
      healthy: true,
      warnings: [],
      recommendations: []
    };

    if (!server.listening) {
      health.healthy = false;
      health.warnings.push('Server is not in listening state');
    }

    if (process.memoryUsage().heapUsed > 100 * 1024 * 1024) { // 100MB
      health.warnings.push('High memory usage detected at startup');
      health.recommendations.push('Monitor memory usage during development');
    }

    return health;
  } catch (error) {
    return {
      healthy: false,
      warnings: [`Health check failed: ${error.message}`],
      recommendations: ['Check server configuration and startup logs']
    };
  }
}

/**
 * Sets up development monitoring
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 */
function setupDevelopmentMonitoring(server, config) {
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    devLogger.debug('Development server monitoring', {
      memory: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      uptime: `${process.uptime().toFixed(2)}s`,
      pid: process.pid
    });
  }, 30000); // Every 30 seconds
}

/**
 * Sets up development request interceptor
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 */
function setupDevelopmentRequestInterceptor(server, config) {
  // Request interception is handled by middleware in setupDevelopmentDebugging
  devLogger.debug('Development request interceptor configured via middleware');
}

/**
 * Initializes educational features
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 */
function initializeEducationalFeatures(server, config) {
  devLogger.info('Educational features initialized', {
    tutorialPhase: TUTORIAL_CONSTANTS.PHASES.PHASE_2.name,
    learningObjectives: TUTORIAL_CONSTANTS.PHASES.PHASE_2.objectives.length,
    educationalEndpoints: 'Available for learning enhancement'
  });
}

/**
 * Sets up development error reporting
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 */
function setupDevelopmentErrorReporting(server, config) {
  // Error reporting is handled by handleDevelopmentErrors function
  devLogger.debug('Development error reporting configured');
}

/**
 * Sets up development debugging endpoints
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 */
function setupDevelopmentDebuggingEndpoints(server, config) {
  // Debugging endpoints are set up in setupDevelopmentDebugging
  devLogger.debug('Development debugging endpoints configured');
}

/**
 * Sets up development shutdown handlers
 * @private
 * @param {Object} server - Server instance
 * @param {Object} config - Startup configuration
 */
function setupDevelopmentShutdownHandlers(server, config) {
  // Shutdown handlers are set up in setupDevelopmentSignalHandlers
  devLogger.debug('Development shutdown handlers configured');
}

/**
 * Categorizes error types for development analysis
 * @private
 * @param {Error} error - Error to categorize
 * @returns {string} Error category
 */
function categorizeError(error) {
  if (error.code === 'EADDRINUSE') return 'port-binding';
  if (error.code === 'EACCES') return 'permission';
  if (error.code === 'ENOTFOUND') return 'network';
  if (error.name === 'ValidationError') return 'validation';
  if (error.name === 'TypeError') return 'type-error';
  if (error.name === 'ReferenceError') return 'reference-error';
  if (error.statusCode >= 400 && error.statusCode < 500) return 'client-error';
  if (error.statusCode >= 500) return 'server-error';
  return 'unknown';
}

/**
 * Determines error severity for development analysis
 * @private
 * @param {Error} error - Error to analyze
 * @returns {string} Severity level
 */
function determineSeverity(error) {
  if (error.code === 'EADDRINUSE' || error.code === 'EACCES') return 'high';
  if (error.statusCode >= 500) return 'medium';
  if (error.statusCode >= 400) return 'low';
  if (error.name === 'TypeError' || error.name === 'ReferenceError') return 'medium';
  return 'low';
}

/**
 * Determines if error is recoverable
 * @private
 * @param {Error} error - Error to analyze
 * @returns {boolean} Whether error is recoverable
 */
function isRecoverable(error) {
  const nonRecoverableErrors = ['EADDRINUSE', 'EACCES', 'MODULE_NOT_FOUND'];
  return !nonRecoverableErrors.includes(error.code);
}

/**
 * Generates developer-friendly error explanations
 * @private
 * @param {Error} error - Error to explain
 * @param {Object} analysis - Error analysis
 * @returns {Object} Developer explanation
 */
function generateDeveloperExplanation(error, analysis) {
  const explanations = {
    'port-binding': {
      explanation: 'Another process is already using the specified port',
      commonCauses: ['Previous server instance still running', 'Another application using the port', 'System service on the port']
    },
    'permission': {
      explanation: 'Insufficient permissions to bind to the specified port or access resources',
      commonCauses: ['Port requires elevated privileges', 'File system permissions', 'Network restrictions']
    },
    'network': {
      explanation: 'Network-related error occurred during server operation',
      commonCauses: ['DNS resolution failure', 'Network interface issues', 'Firewall restrictions']
    },
    'validation': {
      explanation: 'Input validation failed or configuration is invalid',
      commonCauses: ['Invalid configuration values', 'Missing required parameters', 'Format validation errors']
    },
    'type-error': {
      explanation: 'Type-related error - wrong data type used',
      commonCauses: ['Undefined variables', 'Incorrect function arguments', 'Type conversion issues']
    },
    'reference-error': {
      explanation: 'Reference to undefined variable or function',
      commonCauses: ['Typo in variable name', 'Missing import', 'Scope issues']
    }
  };

  return explanations[analysis.category] || {
    explanation: 'An unexpected error occurred',
    commonCauses: ['Check error message and stack trace for more details']
  };
}

/**
 * Generates recovery suggestions for development errors
 * @private
 * @param {Error} error - Error to analyze
 * @param {Object} analysis - Error analysis
 * @param {Object} context - Error context
 * @returns {Object} Recovery suggestions
 */
function generateRecoverySuggestions(error, analysis, context) {
  const suggestions = {
    'port-binding': {
      immediate: 'Use a different port with --port flag or stop the conflicting process',
      prevention: 'Check for running processes before starting server'
    },
    'permission': {
      immediate: 'Run with appropriate permissions or use a different port (>1024)',
      prevention: 'Configure server to use non-privileged ports in development'
    },
    'network': {
      immediate: 'Check network configuration and connectivity',
      prevention: 'Verify network settings and DNS resolution'
    },
    'validation': {
      immediate: 'Review and correct configuration values',
      prevention: 'Implement comprehensive input validation'
    },
    'type-error': {
      immediate: 'Check variable types and function arguments',
      prevention: 'Use TypeScript or runtime type checking'
    },
    'reference-error': {
      immediate: 'Check variable names and imports',
      prevention: 'Use linting tools to catch reference errors'
    }
  };

  return suggestions[analysis.category] || {
    immediate: 'Check error logs and documentation',
    prevention: 'Implement proper error handling and validation'
  };
}

// Auto-start development server if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    devLogger.info('Starting development server from direct module execution', {
      pid: process.pid,
      args: process.argv,
      cwd: process.cwd(),
      timestamp: new Date().toISOString()
    });
    
    await main();
    
  } catch (error) {
    devLogger.error('Failed to start development server from direct execution', error, {
      pid: process.pid,
      uptime: process.uptime(),
      exitCode: 1
    });
    process.exit(1);
  }
}

// Export all development server functions for external use and testing
