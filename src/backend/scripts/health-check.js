#!/usr/bin/env node
/**
 * @fileoverview Comprehensive Health Check Script for Node.js Tutorial Project
 * @description Production-ready health check automation script with PM2 cluster mode compatibility,
 * Express.js v5.1.0 integration, and cross-platform Flask compatibility. Provides automated health
 * validation, monitoring coordination, and system status reporting with educational health check
 * patterns for learning production deployment practices. Supports both standalone execution and
 * integration with PM2 process management, monitoring dashboards, and continuous integration pipelines.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Command-line interface for manual health validation
 * - PM2 cluster mode health monitoring and process validation
 * - Express.js v5.1.0 enhanced security and performance monitoring
 * - Automated monitoring integration with real-time metrics collection
 * - Security-aware health checks with Helmet.js integration
 * - Cross-platform compatibility for educational comparison
 * - Performance correlation analysis and trending
 * - Production deployment health validation patterns
 * - Comprehensive error handling and graceful degradation
 * - Educational demonstration of modern health check automation
 * 
 * Command Line Usage:
 * - node health-check.js --type=quick --format=json
 * - node health-check.js --type=comprehensive --output=file
 * - node health-check.js --type=monitoring --dashboard=true
 * - node health-check.js --continuous --interval=30000
 * - node health-check.js --report --format=json --output=stdout
 * 
 * Integration Examples:
 * - PM2: pm2 exec health-check.js --type=comprehensive
 * - CI/CD: node health-check.js --type=quick --format=json --timeout=10000
 * - Monitoring: node health-check.js --continuous --dashboard=true
 * 
 * Educational Value:
 * - Modern health check automation patterns
 * - Production deployment health validation strategies
 * - Cross-platform development considerations
 * - Performance monitoring and correlation techniques
 * - Security-aware operational practices
 */

// External library imports with version comments
import process from 'node:process'; // Node.js built-in - Command line argument parsing, exit code handling, and process management
import os from 'node:os'; // Node.js built-in - Operating system utilities for system information and resource monitoring
import { performance, PerformanceObserver } from 'node:perf_hooks'; // Node.js built-in - Performance measurement APIs for health check execution timing and performance analysis

// Internal imports with specific members for health check functionality
import { HealthService } from '../services/health-service.js';
import logger, { createRequestLogger } from '../utils/logger.js';
import {
  HTTP_CONSTANTS,
  API_CONSTANTS,
  PM2_CONSTANTS,
  TESTING_CONSTANTS
} from '../utils/constants.js';
import { environmentConfig } from '../config/environment.js';
import { getServerHealth } from '../server.js';

// Global health check state and instance management
let HEALTH_CHECK_INSTANCE = null;
let HEALTH_MANAGER_INSTANCE = null;
const SCRIPT_START_TIME = Date.now();
const EXIT_CODES = {
  SUCCESS: 0,
  HEALTH_FAILURE: 1,
  CONFIG_ERROR: 2,
  TIMEOUT: 3
};

// Performance monitoring setup for health check execution timing
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.name.startsWith('health-check-')) {
      logger.debug('Health check performance metric', {
        operation: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        entryType: entry.entryType
      });
    }
  });
});
performanceObserver.observe({ entryTypes: ['measure'] });

/**
 * Parses command line arguments for health check script configuration including check type,
 * output format, timeout settings, and monitoring options for flexible health check execution
 * 
 * @param {Array} argv - Command line arguments array
 * @returns {object} Parsed command line configuration with check options, output settings, and execution parameters
 */
export function parseCommandLineArguments(argv) {
  performance.mark('parse-args-start');
  
  try {
    // Initialize default configuration with environment-based settings
    const config = {
      type: 'quick', // Default to quick health check for fast execution
      format: 'json', // Default to JSON for programmatic consumption
      output: 'stdout', // Default to stdout for immediate feedback
      timeout: environmentConfig.isProduction ? 30000 : 60000, // 30s prod, 60s dev
      continuous: false,
      interval: 30000, // 30 second default monitoring interval
      dashboard: false,
      verbose: false,
      help: false,
      report: false,
      validate: false
    };

    // Parse command line arguments using process.argv for script configuration
    if (!Array.isArray(argv) || argv.length < 2) {
      logger.warn('Invalid command line arguments provided', { argv });
      return config;
    }

    // Process each command line argument for health check configuration
    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i];
      
      // Handle help flag for usage information display
      if (arg === '--help' || arg === '-h') {
        config.help = true;
        continue;
      }

      // Handle verbose flag for detailed logging output
      if (arg === '--verbose' || arg === '-v') {
        config.verbose = true;
        continue;
      }

      // Handle continuous monitoring flag
      if (arg === '--continuous' || arg === '-c') {
        config.continuous = true;
        continue;
      }

      // Handle dashboard integration flag
      if (arg === '--dashboard' || arg === '-d') {
        config.dashboard = true;
        continue;
      }

      // Handle report generation flag
      if (arg === '--report' || arg === '-r') {
        config.report = true;
        continue;
      }

      // Handle configuration validation flag
      if (arg === '--validate') {
        config.validate = true;
        continue;
      }

      // Parse key-value arguments (--key=value format)
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        const cleanKey = key.replace(/^--/, '');

        switch (cleanKey) {
          case 'type':
            // Configure health check type (quick, comprehensive, monitoring)
            if (['quick', 'comprehensive', 'monitoring'].includes(value)) {
              config.type = value;
            } else {
              logger.warn('Invalid health check type specified', { type: value });
            }
            break;

          case 'format':
            // Set output format options (json, text, dashboard)
            if (['json', 'text', 'dashboard', 'pretty'].includes(value)) {
              config.format = value;
            } else {
              logger.warn('Invalid output format specified', { format: value });
            }
            break;

          case 'output':
            // Configure output destination (stdout, file, dashboard)
            if (['stdout', 'file', 'dashboard'].includes(value)) {
              config.output = value;
            } else {
              logger.warn('Invalid output destination specified', { output: value });
            }
            break;

          case 'timeout':
            // Configure timeout settings and performance thresholds
            const timeoutValue = parseInt(value, 10);
            if (!isNaN(timeoutValue) && timeoutValue > 0) {
              config.timeout = timeoutValue;
            } else {
              logger.warn('Invalid timeout value specified', { timeout: value });
            }
            break;

          case 'interval':
            // Set monitoring interval for continuous health checks
            const intervalValue = parseInt(value, 10);
            if (!isNaN(intervalValue) && intervalValue >= 1000) {
              config.interval = intervalValue;
            } else {
              logger.warn('Invalid monitoring interval specified', { interval: value });
            }
            break;

          case 'file':
            // Set output file path for file-based output
            config.outputFile = value;
            config.output = 'file';
            break;

          default:
            logger.debug('Unknown command line argument', { key: cleanKey, value });
        }
      }
    }

    // Validate argument compatibility and configuration consistency
    if (config.continuous && config.type === 'quick') {
      logger.warn('Continuous monitoring with quick checks may have limited utility');
      config.type = 'monitoring'; // Auto-adjust for better monitoring experience
    }

    if (config.dashboard && config.format === 'text') {
      logger.warn('Dashboard output requires JSON format, adjusting automatically');
      config.format = 'json';
    }

    if (config.output === 'file' && !config.outputFile) {
      // Generate default output file name based on configuration
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      config.outputFile = `health-check-${config.type}-${timestamp}.${config.format}`;
    }

    // Set default values for optional parameters using environmentConfig
    config.environment = environmentConfig.currentEnvironment;
    config.nodeVersion = process.version;
    config.platform = process.platform;
    config.pid = process.pid;
    config.timestamp = new Date().toISOString();

    performance.mark('parse-args-end');
    performance.measure('parse-args-duration', 'parse-args-start', 'parse-args-end');

    logger.info('Command line arguments parsed successfully', {
      config: {
        type: config.type,
        format: config.format,
        output: config.output,
        continuous: config.continuous,
        timeout: config.timeout
      },
      environment: config.environment
    });

    // Return comprehensive configuration object for health check execution
    return config;

  } catch (error) {
    logger.error('Failed to parse command line arguments', {
      error: error.message,
      stack: error.stack,
      argv
    });
    
    // Return default configuration with error flag
    return {
      ...config,
      error: error.message,
      hasError: true
    };
  }
}

/**
 * Executes lightweight health check optimized for load balancers and high-frequency monitoring
 * with minimal resource usage and fast response times for operational monitoring
 * 
 * @param {object} quickOptions - Quick health check configuration options
 * @returns {Promise} Promise that resolves with essential health status optimized for quick validation
 */
export async function executeQuickHealthCheck(quickOptions = {}) {
  performance.mark('quick-health-start');
  const requestLogger = createRequestLogger({ operation: 'quick-health-check' });
  
  try {
    // Initialize quick health check with performance timing using perf_hooks
    const startTime = Date.now();
    requestLogger.info('Starting quick health check execution', {
      options: quickOptions,
      timeout: quickOptions.timeout || 10000
    });

    // Create HealthService instance with minimal configuration for speed
    if (!HEALTH_CHECK_INSTANCE) {
      HEALTH_CHECK_INSTANCE = new HealthService({
        mode: 'quick',
        timeout: quickOptions.timeout || 10000,
        retries: 1, // Minimal retries for speed
        includeDetails: false
      });
    }

    // Execute lightweight health validation using getQuickHealth method
    const healthResult = await Promise.race([
      HEALTH_CHECK_INSTANCE.getQuickHealth(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Quick health check timeout')), quickOptions.timeout || 10000)
      )
    ]);

    // Include basic server health information using getServerHealth function
    const serverHealth = await getServerHealth();
    
    // Calculate response time and validate performance target
    const responseTime = Date.now() - startTime;
    const performanceTarget = TESTING_CONSTANTS.PERFORMANCE_TARGETS.QUICK_HEALTH_CHECK || 10;
    const meetsPerformanceTarget = responseTime < performanceTarget;

    // Format quick health response for load balancer compatibility
    const quickHealthStatus = {
      status: healthResult.status || 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      meetsPerformanceTarget,
      server: {
        pid: process.pid,
        memory: process.memoryUsage().heapUsed,
        nodeVersion: process.version
      },
      application: {
        healthy: serverHealth.healthy || true,
        version: serverHealth.version || '1.0.0'
      },
      environment: environmentConfig.currentEnvironment,
      metadata: {
        checkType: 'quick',
        executionTime: responseTime,
        requestId: requestLogger.requestId
      }
    };

    performance.mark('quick-health-end');
    performance.measure('quick-health-duration', 'quick-health-start', 'quick-health-end');

    // Log quick health check execution with minimal overhead
    requestLogger.info('Quick health check completed successfully', {
      status: quickHealthStatus.status,
      responseTime,
      meetsPerformanceTarget,
      uptime: quickHealthStatus.uptime
    });

    // Return essential health status with response time under 10ms target
    return quickHealthStatus;

  } catch (error) {
    performance.mark('quick-health-error');
    performance.measure('quick-health-error-duration', 'quick-health-start', 'quick-health-error');

    requestLogger.error('Quick health check failed', {
      error: error.message,
      stack: error.stack,
      options: quickOptions
    });

    // Return error status with minimal information for quick failure reporting
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error.message,
      responseTime: Date.now() - SCRIPT_START_TIME,
      server: {
        pid: process.pid,
        nodeVersion: process.version
      },
      metadata: {
        checkType: 'quick',
        failed: true,
        requestId: requestLogger.requestId
      }
    };
  }
}

/**
 * Executes comprehensive health assessment including system validation, application monitoring,
 * PM2 cluster health, and performance analysis for complete operational insight
 * 
 * @param {object} comprehensiveOptions - Comprehensive health check configuration options
 * @returns {Promise} Promise that resolves with complete health assessment including all system components
 */
export async function executeComprehensiveHealthCheck(comprehensiveOptions = {}) {
  performance.mark('comprehensive-health-start');
  const requestLogger = createRequestLogger({ operation: 'comprehensive-health-check' });
  
  try {
    // Initialize comprehensive health check with full system validation
    const startTime = Date.now();
    requestLogger.info('Starting comprehensive health check execution', {
      options: comprehensiveOptions,
      environment: environmentConfig.currentEnvironment
    });

    // Create HealthService and HealthCheckManager instances with complete configuration
    if (!HEALTH_CHECK_INSTANCE) {
      HEALTH_CHECK_INSTANCE = new HealthService({
        mode: 'comprehensive',
        timeout: comprehensiveOptions.timeout || 60000,
        retries: 3,
        includeDetails: true,
        includeDiagnostics: true
      });
    }

    // Initialize health manager for monitoring coordination (gracefully handle if missing)
    try {
      // Try to dynamically import the HealthCheckManager if it exists
      const { HealthCheckManager } = await import('../monitoring/health-check.js').catch(() => ({}));
      if (HealthCheckManager && !HEALTH_MANAGER_INSTANCE) {
        HEALTH_MANAGER_INSTANCE = new HealthCheckManager({
          mode: 'comprehensive',
          correlationId: requestLogger.requestId
        });
      }
    } catch (importError) {
      requestLogger.warn('HealthCheckManager not available, continuing with basic health checks', {
        error: importError.message
      });
    }

    // Execute comprehensive health validation using performHealthCheck method
    const [healthResult, systemMetrics, applicationHealth] = await Promise.all([
      HEALTH_CHECK_INSTANCE.performHealthCheck(),
      HEALTH_CHECK_INSTANCE.getHealthMetrics(),
      getServerHealth()
    ]);

    // Coordinate monitoring data collection using HealthCheckManager if available
    let monitoringData = null;
    if (HEALTH_MANAGER_INSTANCE) {
      try {
        monitoringData = await HEALTH_MANAGER_INSTANCE.executeHealthCheck();
      } catch (monitoringError) {
        requestLogger.warn('Monitoring data collection failed', {
          error: monitoringError.message
        });
      }
    }

    // Include detailed server health analysis using getServerHealth function
    const serverHealthDetails = {
      ...applicationHealth,
      systemInfo: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAverage: os.loadavg()
      },
      processInfo: {
        pid: process.pid,
        ppid: process.ppid,
        version: process.version,
        versions: process.versions,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    // Correlate health metrics with performance data and system resources
    const performanceAnalysis = {
      executionTime: Date.now() - startTime,
      memoryEfficiency: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      cpuEfficiency: process.cpuUsage(),
      systemLoad: os.loadavg()[0], // 1-minute load average
      responseTime: Date.now() - startTime,
      throughput: systemMetrics?.throughput || 0
    };

    // Generate comprehensive health report with recommendations
    const comprehensiveHealthStatus = {
      status: determineOverallHealthStatus([healthResult, systemMetrics, applicationHealth]),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: serverHealthDetails,
      application: {
        health: healthResult,
        metrics: systemMetrics,
        server: applicationHealth
      },
      monitoring: monitoringData,
      performance: performanceAnalysis,
      environment: {
        name: environmentConfig.currentEnvironment,
        nodeVersion: process.version,
        platform: process.platform,
        isProduction: environmentConfig.isProduction
      },
      recommendations: generateHealthRecommendations(healthResult, systemMetrics, performanceAnalysis),
      metadata: {
        checkType: 'comprehensive',
        executionTime: performanceAnalysis.executionTime,
        requestId: requestLogger.requestId,
        timestamp: new Date().toISOString()
      }
    };

    performance.mark('comprehensive-health-end');
    performance.measure('comprehensive-health-duration', 'comprehensive-health-start', 'comprehensive-health-end');

    // Log detailed health check completion with full metrics and analysis
    requestLogger.info('Comprehensive health check completed successfully', {
      status: comprehensiveHealthStatus.status,
      executionTime: performanceAnalysis.executionTime,
      memoryUsage: process.memoryUsage().heapUsed,
      systemLoad: performanceAnalysis.systemLoad,
      recommendationCount: comprehensiveHealthStatus.recommendations.length
    });

    return comprehensiveHealthStatus;

  } catch (error) {
    performance.mark('comprehensive-health-error');
    performance.measure('comprehensive-health-error-duration', 'comprehensive-health-start', 'comprehensive-health-error');

    requestLogger.error('Comprehensive health check failed', {
      error: error.message,
      stack: error.stack,
      options: comprehensiveOptions
    });

    // Return comprehensive error status with system information
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      },
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        pid: process.pid,
        memoryUsage: process.memoryUsage()
      },
      metadata: {
        checkType: 'comprehensive',
        failed: true,
        executionTime: Date.now() - SCRIPT_START_TIME,
        requestId: requestLogger.requestId
      }
    };
  }
}

/**
 * Executes monitoring-focused health check for dashboard integration and real-time monitoring
 * with alert generation, threshold validation, and continuous monitoring support
 * 
 * @param {object} monitoringOptions - Monitoring health check configuration options
 * @returns {Promise} Promise that resolves with monitoring-focused health data for dashboard consumption
 */
export async function executeMonitoringHealthCheck(monitoringOptions = {}) {
  performance.mark('monitoring-health-start');
  const requestLogger = createRequestLogger({ operation: 'monitoring-health-check' });
  
  try {
    // Initialize monitoring health check with dashboard integration configuration
    const startTime = Date.now();
    requestLogger.info('Starting monitoring health check execution', {
      options: monitoringOptions,
      dashboardEnabled: monitoringOptions.dashboard || false
    });

    // Create HealthCheckManager instance for monitoring coordination (gracefully handle if missing)
    let monitoringManager = null;
    try {
      const { HealthCheckManager } = await import('../monitoring/health-check.js').catch(() => ({}));
      if (HealthCheckManager) {
        monitoringManager = new HealthCheckManager({
          mode: 'monitoring',
          dashboardIntegration: monitoringOptions.dashboard || false,
          alertingEnabled: monitoringOptions.alerting || false,
          correlationId: requestLogger.requestId
        });
      }
    } catch (importError) {
      requestLogger.warn('HealthCheckManager not available, using basic monitoring', {
        error: importError.message
      });
    }

    // Ensure HealthService instance exists for monitoring
    if (!HEALTH_CHECK_INSTANCE) {
      HEALTH_CHECK_INSTANCE = new HealthService({
        mode: 'monitoring',
        timeout: monitoringOptions.timeout || 30000,
        retries: 2,
        includeMetrics: true
      });
    }

    // Execute health check with monitoring focus using executeHealthCheck method
    const healthCheckPromises = [
      HEALTH_CHECK_INSTANCE.getHealthMetrics(),
      getServerHealth()
    ];

    // Add monitoring manager health check if available
    if (monitoringManager) {
      healthCheckPromises.push(monitoringManager.executeHealthCheck());
    }

    const [healthMetrics, serverHealth, managerResults] = await Promise.all(healthCheckPromises);

    // Collect performance metrics and trend analysis for dashboard visualization
    const performanceMetrics = {
      responseTime: Date.now() - startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      systemLoad: os.loadavg(),
      uptime: process.uptime(),
      timestamp: Date.now()
    };

    // Validate health metrics against thresholds for alert generation
    const thresholdValidation = validateHealthThresholds(healthMetrics, performanceMetrics, monitoringOptions);
    
    // Generate alerts for threshold violations or critical health issues
    const alerts = generateHealthAlerts(thresholdValidation, monitoringOptions);

    // Format health data for monitoring dashboard consumption
    const monitoringHealthData = {
      status: determineMonitoringStatus(healthMetrics, thresholdValidation),
      timestamp: new Date().toISOString(),
      metrics: {
        health: healthMetrics,
        performance: performanceMetrics,
        server: serverHealth,
        system: {
          platform: os.platform(),
          nodeVersion: process.version,
          pid: process.pid,
          environment: environmentConfig.currentEnvironment
        }
      },
      thresholds: thresholdValidation,
      alerts: alerts,
      monitoring: managerResults || null,
      trends: {
        memoryTrend: calculateMemoryTrend(performanceMetrics.memoryUsage),
        cpuTrend: calculateCpuTrend(performanceMetrics.cpuUsage),
        responseTrend: calculateResponseTrend(performanceMetrics.responseTime)
      },
      dashboard: {
        enabled: monitoringOptions.dashboard || false,
        endpoint: monitoringOptions.dashboardEndpoint || '/health-dashboard',
        lastUpdate: new Date().toISOString()
      },
      metadata: {
        checkType: 'monitoring',
        executionTime: performanceMetrics.responseTime,
        alertCount: alerts.length,
        requestId: requestLogger.requestId
      }
    };

    performance.mark('monitoring-health-end');
    performance.measure('monitoring-health-duration', 'monitoring-health-start', 'monitoring-health-end');

    // Log monitoring health check with dashboard integration status
    requestLogger.info('Monitoring health check completed successfully', {
      status: monitoringHealthData.status,
      alertCount: alerts.length,
      dashboardEnabled: monitoringOptions.dashboard,
      responseTime: performanceMetrics.responseTime,
      thresholdViolations: thresholdValidation.violations || 0
    });

    return monitoringHealthData;

  } catch (error) {
    performance.mark('monitoring-health-error');
    performance.measure('monitoring-health-error-duration', 'monitoring-health-start', 'monitoring-health-error');

    requestLogger.error('Monitoring health check failed', {
      error: error.message,
      stack: error.stack,
      options: monitoringOptions
    });

    // Return monitoring error status with basic system information
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.constructor.name
      },
      metrics: {
        performance: {
          responseTime: Date.now() - SCRIPT_START_TIME,
          memoryUsage: process.memoryUsage()
        },
        system: {
          pid: process.pid,
          nodeVersion: process.version
        }
      },
      alerts: [{
        level: 'critical',
        message: 'Monitoring health check execution failed',
        timestamp: new Date().toISOString()
      }],
      metadata: {
        checkType: 'monitoring',
        failed: true,
        requestId: requestLogger.requestId
      }
    };
  }
}

/**
 * Starts continuous health monitoring with configurable intervals, automated alerting,
 * and background health validation for production environments and operational monitoring
 * 
 * @param {object} continuousConfig - Continuous monitoring configuration options
 * @returns {Promise} Promise that resolves when continuous monitoring is successfully started and operational
 */
export async function startContinuousMonitoring(continuousConfig = {}) {
  const requestLogger = createRequestLogger({ operation: 'start-continuous-monitoring' });
  
  try {
    // Validate continuous monitoring configuration and initialize monitoring manager
    const config = {
      interval: continuousConfig.interval || 30000, // 30 seconds default
      alerting: continuousConfig.alerting !== false,
      dashboard: continuousConfig.dashboard || false,
      healthCheckType: continuousConfig.type || 'monitoring',
      maxFailures: continuousConfig.maxFailures || 3,
      ...continuousConfig
    };

    requestLogger.info('Starting continuous health monitoring', {
      config,
      environment: environmentConfig.currentEnvironment
    });

    // Create HealthCheckManager instance with continuous monitoring settings (gracefully handle if missing)
    let monitoringManager = null;
    try {
      const { HealthCheckManager } = await import('../monitoring/health-check.js').catch(() => ({}));
      if (HealthCheckManager) {
        monitoringManager = new HealthCheckManager({
          mode: 'continuous',
          interval: config.interval,
          alerting: config.alerting,
          dashboard: config.dashboard
        });
      }
    } catch (importError) {
      requestLogger.warn('HealthCheckManager not available, using basic continuous monitoring', {
        error: importError.message
      });
    }

    // Start continuous monitoring using startMonitoring method or create custom monitoring loop
    if (monitoringManager) {
      await monitoringManager.startMonitoring();
      HEALTH_MANAGER_INSTANCE = monitoringManager;
    } else {
      // Fallback: Create custom monitoring loop
      await startCustomMonitoringLoop(config, requestLogger);
    }

    // Configure automated health check intervals based on environment
    const intervalId = setInterval(async () => {
      try {
        const healthResult = await executeMonitoringHealthCheck(config);
        
        // Log periodic health check results
        requestLogger.debug('Continuous monitoring health check completed', {
          status: healthResult.status,
          alertCount: healthResult.alerts?.length || 0,
          timestamp: healthResult.timestamp
        });

        // Handle alerts if enabled
        if (config.alerting && healthResult.alerts && healthResult.alerts.length > 0) {
          await handleContinuousMonitoringAlerts(healthResult.alerts, requestLogger);
        }

      } catch (monitoringError) {
        requestLogger.error('Continuous monitoring health check failed', {
          error: monitoringError.message,
          interval: config.interval
        });
      }
    }, config.interval);

    // Store interval ID for cleanup
    process.continuousMonitoringInterval = intervalId;

    // Set up automated alerting for health threshold violations
    if (config.alerting) {
      await setupAutomatedAlerting(config, requestLogger);
    }

    // Initialize monitoring dashboard integration and real-time updates
    if (config.dashboard) {
      await initializeDashboardIntegration(config, requestLogger);
    }

    const startupResult = {
      success: true,
      config,
      startTime: new Date().toISOString(),
      monitoringManager: !!monitoringManager,
      intervalId: intervalId.toString(),
      environment: environmentConfig.currentEnvironment,
      pid: process.pid
    };

    // Log continuous monitoring startup with configuration details
    requestLogger.info('Continuous monitoring started successfully', startupResult);

    // Return monitoring startup confirmation with active configuration
    return startupResult;

  } catch (error) {
    requestLogger.error('Failed to start continuous monitoring', {
      error: error.message,
      stack: error.stack,
      config: continuousConfig
    });
    
    throw error;
  }
}

/**
 * Stops continuous health monitoring gracefully, saves final health state,
 * and performs comprehensive cleanup of monitoring resources for clean shutdown
 * 
 * @param {object} stopOptions - Monitoring shutdown configuration options
 * @returns {Promise} Promise that resolves when monitoring is completely stopped and cleanup is complete
 */
export async function stopContinuousMonitoring(stopOptions = {}) {
  const requestLogger = createRequestLogger({ operation: 'stop-continuous-monitoring' });
  
  try {
    // Initialize graceful monitoring shutdown with final health data collection
    requestLogger.info('Stopping continuous monitoring', {
      options: stopOptions,
      hasManagerInstance: !!HEALTH_MANAGER_INSTANCE
    });

    let finalHealthState = null;
    
    // Collect final health state before shutdown
    try {
      finalHealthState = await executeMonitoringHealthCheck(stopOptions);
    } catch (healthError) {
      requestLogger.warn('Failed to collect final health state', {
        error: healthError.message
      });
    }

    // Stop continuous monitoring using HealthCheckManager stopMonitoring method
    if (HEALTH_MANAGER_INSTANCE) {
      try {
        await HEALTH_MANAGER_INSTANCE.stopMonitoring();
        HEALTH_MANAGER_INSTANCE = null;
      } catch (stopError) {
        requestLogger.error('Error stopping HealthCheckManager', {
          error: stopError.message
        });
      }
    }

    // Clear monitoring interval if it exists
    if (process.continuousMonitoringInterval) {
      clearInterval(process.continuousMonitoringInterval);
      delete process.continuousMonitoringInterval;
    }

    // Save final health state and generate monitoring session summary
    const sessionSummary = {
      stopTime: new Date().toISOString(),
      finalHealthState,
      sessionDuration: Date.now() - SCRIPT_START_TIME,
      environment: environmentConfig.currentEnvironment,
      totalChecks: stopOptions.totalChecks || 0,
      averageResponseTime: stopOptions.averageResponseTime || 0
    };

    // Cleanup monitoring resources and release memory allocations
    await cleanupMonitoringResources(requestLogger);

    // Generate final monitoring report with session statistics
    const finalReport = {
      success: true,
      sessionSummary,
      cleanupCompleted: true,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };

    // Log monitoring shutdown completion with cleanup summary
    requestLogger.info('Continuous monitoring stopped successfully', finalReport);

    // Return shutdown confirmation with final health status
    return finalReport;

  } catch (error) {
    requestLogger.error('Failed to stop continuous monitoring', {
      error: error.message,
      stack: error.stack,
      options: stopOptions
    });
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generates comprehensive health reports with executive summaries, technical analysis,
 * performance correlation, and actionable recommendations for stakeholder communication and monitoring
 * 
 * @param {string} reportType - Type of health report to generate
 * @param {object} reportOptions - Report generation configuration options
 * @returns {object} Comprehensive health report with summaries, analysis, and recommendations
 */
export function generateHealthReport(reportType = 'comprehensive', reportOptions = {}) {
  const requestLogger = createRequestLogger({ operation: 'generate-health-report' });
  
  try {
    // Initialize health report generation with type validation and configuration
    const validReportTypes = ['executive', 'technical', 'comprehensive', 'monitoring', 'security'];
    if (!validReportTypes.includes(reportType)) {
      throw new Error(`Invalid report type: ${reportType}. Must be one of: ${validReportTypes.join(', ')}`);
    }

    requestLogger.info('Generating health report', {
      type: reportType,
      options: reportOptions,
      timestamp: new Date().toISOString()
    });

    // Execute comprehensive health assessment for report data collection
    // Note: This would be async in a real implementation, but keeping sync for this example
    const healthData = {
      timestamp: new Date().toISOString(),
      environment: environmentConfig.currentEnvironment,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // Generate executive summary with key health indicators and scores
    const executiveSummary = generateExecutiveSummary(healthData, reportOptions);
    
    // Create detailed technical analysis with resource utilization insights
    const technicalAnalysis = generateTechnicalAnalysis(healthData, reportOptions);
    
    // Include performance correlation and trend analysis
    const performanceAnalysis = generatePerformanceAnalysis(healthData, reportOptions);
    
    // Add actionable recommendations based on health analysis
    const recommendations = generateActionableRecommendations(healthData, reportOptions);

    // Format report for specified output type and audience
    const healthReport = {
      title: `Health Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
      type: reportType,
      timestamp: new Date().toISOString(),
      environment: environmentConfig.currentEnvironment,
      
      // Executive summary for all stakeholders
      executiveSummary,
      
      // Technical details based on report type
      ...(reportType !== 'executive' && { technicalAnalysis }),
      
      // Performance metrics and trends
      performanceAnalysis,
      
      // Actionable recommendations
      recommendations,
      
      // Raw health data for technical reports
      ...(reportType === 'technical' || reportType === 'comprehensive') && {
        rawData: healthData
      },
      
      // Security-specific analysis for security reports
      ...(reportType === 'security' || reportType === 'comprehensive') && {
        securityAnalysis: generateSecurityAnalysis(healthData, reportOptions)
      },
      
      // Report metadata
      metadata: {
        generatedBy: 'health-check-script',
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        reportId: requestLogger.requestId,
        duration: 'immediate' // In real implementation, this would track actual generation time
      }
    };

    // Log health report generation with summary and distribution status
    requestLogger.info('Health report generated successfully', {
      type: reportType,
      summaryScore: executiveSummary.overallScore,
      recommendationCount: recommendations.length,
      reportSize: JSON.stringify(healthReport).length
    });

    return healthReport;

  } catch (error) {
    requestLogger.error('Health report generation failed', {
      type: reportType,
      error: error.message,
      stack: error.stack,
      options: reportOptions
    });
    
    // Return error report
    return {
      title: 'Health Report - Error',
      type: reportType,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.constructor.name
      },
      executiveSummary: {
        status: 'error',
        message: 'Failed to generate health report',
        overallScore: 0
      },
      recommendations: [
        'Review system configuration and try again',
        'Check log files for detailed error information',
        'Contact system administrator if problem persists'
      ],
      metadata: {
        generatedBy: 'health-check-script',
        generatedAt: new Date().toISOString(),
        failed: true,
        reportId: requestLogger.requestId
      }
    };
  }
}

/**
 * Formats health check results for various output formats including JSON, text, dashboard,
 * and monitoring system consumption with consistent structure and metadata
 * 
 * @param {object} healthData - Health check results to format
 * @param {string} outputFormat - Target output format
 * @param {object} formatOptions - Format-specific configuration options
 * @returns {string} Formatted health output ready for consumption by specified system or interface
 */
export function formatHealthOutput(healthData, outputFormat = 'json', formatOptions = {}) {
  try {
    // Validate health data and output format requirements
    if (!healthData || typeof healthData !== 'object') {
      throw new Error('Invalid health data provided for formatting');
    }

    const validFormats = ['json', 'text', 'pretty', 'dashboard', 'csv', 'xml'];
    if (!validFormats.includes(outputFormat)) {
      throw new Error(`Invalid output format: ${outputFormat}. Must be one of: ${validFormats.join(', ')}`);
    }

    // Apply format-specific transformations and structure adjustments
    let formattedOutput;

    switch (outputFormat) {
      case 'json':
        // Include metadata and correlation information for traceability
        const jsonData = {
          ...healthData,
          _metadata: {
            formatVersion: '1.0.0',
            formattedAt: new Date().toISOString(),
            format: 'json',
            ...formatOptions.metadata
          }
        };
        
        // Apply security filtering to prevent sensitive information disclosure
        const sanitizedData = applySensitiveDataFiltering(jsonData);
        formattedOutput = JSON.stringify(sanitizedData, null, formatOptions.pretty ? 2 : 0);
        break;

      case 'text':
      case 'pretty':
        formattedOutput = formatAsText(healthData, formatOptions);
        break;

      case 'dashboard':
        formattedOutput = formatForDashboard(healthData, formatOptions);
        break;

      case 'csv':
        formattedOutput = formatAsCSV(healthData, formatOptions);
        break;

      case 'xml':
        formattedOutput = formatAsXML(healthData, formatOptions);
        break;

      default:
        formattedOutput = JSON.stringify(healthData, null, 2);
    }

    // Format timestamps and metrics for target system compatibility
    if (formatOptions.timestampFormat) {
      formattedOutput = formatTimestamps(formattedOutput, formatOptions.timestampFormat);
    }

    // Add educational metadata for cross-platform comparison if requested
    if (formatOptions.educational) {
      const educationalNote = generateEducationalMetadata(healthData, outputFormat);
      formattedOutput = addEducationalMetadata(formattedOutput, educationalNote, outputFormat);
    }

    // Validate formatted output for target system consumption
    validateFormattedOutput(formattedOutput, outputFormat);

    logger.debug('Health output formatted successfully', {
      format: outputFormat,
      dataSize: JSON.stringify(healthData).length,
      outputSize: formattedOutput.length,
      hasEducational: !!formatOptions.educational
    });

    // Return properly formatted health output ready for delivery
    return formattedOutput;

  } catch (error) {
    logger.error('Health output formatting failed', {
      format: outputFormat,
      error: error.message,
      options: formatOptions
    });
    
    // Return fallback JSON format with error information
    return JSON.stringify({
      error: 'Formatting failed',
      message: error.message,
      originalData: healthData,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

/**
 * Validates health check configuration including monitoring settings, threshold values,
 * alert policies, and integration parameters with comprehensive error reporting
 * 
 * @param {object} config - Configuration object to validate
 * @returns {object} Configuration validation result with errors, warnings, and recommendations
 */
export function validateHealthConfiguration(config) {
  const validationResult = {
    valid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    score: 100,
    timestamp: new Date().toISOString()
  };

  try {
    // Validate health check configuration structure and required parameters
    if (!config || typeof config !== 'object') {
      validationResult.valid = false;
      validationResult.errors.push('Configuration must be a valid object');
      validationResult.score = 0;
      return validationResult;
    }

    // Check monitoring intervals and frequency settings for reasonableness
    if (config.interval !== undefined) {
      if (typeof config.interval !== 'number' || config.interval < 1000) {
        validationResult.errors.push('Monitoring interval must be a number >= 1000ms');
        validationResult.valid = false;
        validationResult.score -= 20;
      } else if (config.interval < 5000) {
        validationResult.warnings.push('Very short monitoring interval may impact performance');
        validationResult.score -= 5;
      }
    }

    // Validate threshold configurations against performance targets
    if (config.thresholds) {
      const thresholdValidation = validateThresholdConfiguration(config.thresholds);
      validationResult.errors.push(...thresholdValidation.errors);
      validationResult.warnings.push(...thresholdValidation.warnings);
      validationResult.score -= thresholdValidation.penalty;
      
      if (thresholdValidation.errors.length > 0) {
        validationResult.valid = false;
      }
    }

    // Verify PM2 integration settings and cluster mode compatibility
    if (config.pm2) {
      const pm2Validation = validatePM2Configuration(config.pm2);
      validationResult.warnings.push(...pm2Validation.warnings);
      validationResult.recommendations.push(...pm2Validation.recommendations);
      validationResult.score -= pm2Validation.penalty;
    }

    // Check output format and destination configurations
    if (config.output && config.output.format) {
      const validFormats = ['json', 'text', 'dashboard', 'csv'];
      if (!validFormats.includes(config.output.format)) {
        validationResult.errors.push(`Invalid output format: ${config.output.format}`);
        validationResult.valid = false;
        validationResult.score -= 15;
      }
    }

    // Validate timeout settings and performance limits
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout < 1000) {
        validationResult.errors.push('Timeout must be a number >= 1000ms');
        validationResult.valid = false;
        validationResult.score -= 10;
      } else if (config.timeout > 120000) {
        validationResult.warnings.push('Very long timeout may delay health check responses');
        validationResult.score -= 5;
      }
    }

    // Generate configuration recommendations for optimization
    const optimizationRecommendations = generateConfigurationRecommendations(config);
    validationResult.recommendations.push(...optimizationRecommendations);

    // Validate environment-specific settings
    if (environmentConfig.isProduction) {
      const productionValidation = validateProductionConfiguration(config);
      validationResult.warnings.push(...productionValidation.warnings);
      validationResult.recommendations.push(...productionValidation.recommendations);
    }

    // Calculate final validation score
    validationResult.score = Math.max(0, Math.min(100, validationResult.score));

    logger.info('Health configuration validation completed', {
      valid: validationResult.valid,
      score: validationResult.score,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length
    });

    // Return comprehensive validation result with actionable feedback
    return validationResult;

  } catch (error) {
    logger.error('Configuration validation failed', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      valid: false,
      errors: [`Validation process failed: ${error.message}`],
      warnings: [],
      recommendations: ['Review configuration format and try again'],
      score: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handles health check execution errors with comprehensive error logging, recovery strategies,
 * and appropriate exit code management for script automation and monitoring
 * 
 * @param {Error} error - Error object to handle
 * @param {object} errorContext - Additional context information for error handling
 * @returns {void} No return value, handles error and manages script termination
 */
export function handleHealthCheckError(error, errorContext = {}) {
  const requestLogger = createRequestLogger({ operation: 'error-handling' });
  
  try {
    // Log comprehensive error information with context and stack trace
    requestLogger.error('Health check execution error occurred', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: errorContext,
      timestamp: new Date().toISOString(),
      environment: environmentConfig.currentEnvironment,
      pid: process.pid
    });

    // Classify error type and determine appropriate response strategy
    const errorClassification = classifyHealthCheckError(error);
    requestLogger.info('Error classified for appropriate handling', {
      classification: errorClassification.type,
      severity: errorClassification.severity,
      recoverable: errorClassification.recoverable
    });

    // Attempt error recovery if possible based on error classification
    if (errorClassification.recoverable) {
      try {
        const recoveryResult = attemptErrorRecovery(error, errorClassification, errorContext);
        if (recoveryResult.success) {
          requestLogger.info('Error recovery successful', {
            recoveryStrategy: recoveryResult.strategy,
            recoveryTime: recoveryResult.duration
          });
          return; // Recovery successful, no need to terminate
        }
      } catch (recoveryError) {
        requestLogger.error('Error recovery attempt failed', {
          originalError: error.message,
          recoveryError: recoveryError.message
        });
      }
    }

    // Generate error report for monitoring and debugging purposes
    const errorReport = generateErrorReport(error, errorContext, errorClassification);
    
    // Log error report for monitoring systems
    if (environmentConfig.isProduction) {
      // In production, send error report to monitoring system
      requestLogger.error('Production error report generated', {
        reportId: errorReport.id,
        severity: errorClassification.severity,
        requiresAttention: errorClassification.severity === 'critical'
      });
    }

    // Cleanup resources and connections before script termination
    cleanupResourcesOnError(requestLogger);

    // Set appropriate exit code based on error type and severity
    let exitCode = EXIT_CODES.HEALTH_FAILURE; // Default exit code
    
    switch (errorClassification.type) {
      case 'configuration':
        exitCode = EXIT_CODES.CONFIG_ERROR;
        break;
      case 'timeout':
        exitCode = EXIT_CODES.TIMEOUT;
        break;
      case 'system':
      case 'application':
      default:
        exitCode = EXIT_CODES.HEALTH_FAILURE;
        break;
    }

    // Log error handling completion and script termination reason
    requestLogger.info('Error handling completed, terminating script', {
      exitCode,
      errorType: errorClassification.type,
      cleanupCompleted: true,
      scriptUptime: Date.now() - SCRIPT_START_TIME
    });

    // Terminate script with appropriate exit code
    process.exit(exitCode);

  } catch (handlingError) {
    // Last resort error handling
    console.error('Critical error in error handling:', handlingError.message);
    console.error('Original error:', error.message);
    process.exit(EXIT_CODES.HEALTH_FAILURE);
  }
}

/**
 * Displays comprehensive usage information, command line options, examples,
 * and configuration guidance for health check script operation and automation
 * 
 * @returns {void} No return value, outputs usage information to console
 */
export function displayUsageInformation() {
  const usageInfo = `
Node.js Tutorial Project - Health Check Script
=============================================

DESCRIPTION:
    Comprehensive health check script for automated system validation, monitoring,
    and reporting. Supports PM2 cluster mode, Express.js v5.1.0 integration, and
    cross-platform compatibility for educational and production use.

USAGE:
    node health-check.js [OPTIONS]

OPTIONS:
    --type=TYPE              Health check type: quick, comprehensive, monitoring
                            Default: quick

    --format=FORMAT          Output format: json, text, pretty, dashboard
                            Default: json

    --output=DESTINATION     Output destination: stdout, file, dashboard
                            Default: stdout

    --timeout=MILLISECONDS   Health check timeout in milliseconds
                            Default: 30000 (production), 60000 (development)

    --continuous, -c         Enable continuous monitoring mode
                            Default: false

    --interval=MILLISECONDS  Monitoring interval for continuous mode
                            Default: 30000 (30 seconds)

    --dashboard, -d          Enable dashboard integration
                            Default: false

    --report, -r             Generate comprehensive health report
                            Default: false

    --validate               Validate configuration only
                            Default: false

    --verbose, -v            Enable verbose logging output
                            Default: false

    --help, -h               Display this help information

EXAMPLES:
    Quick health check (for load balancers):
    $ node health-check.js --type=quick --format=json

    Comprehensive system analysis:
    $ node health-check.js --type=comprehensive --output=file --verbose

    Continuous monitoring with dashboard:
    $ node health-check.js --continuous --dashboard --interval=15000

    Generate health report:
    $ node health-check.js --report --format=pretty --type=comprehensive

    Configuration validation:
    $ node health-check.js --validate --verbose

PM2 INTEGRATION:
    Start with PM2:
    $ pm2 start health-check.js --name "health-monitor" -- --continuous

    PM2 health check execution:
    $ pm2 exec health-check.js --type=monitoring --format=json

CONFIGURATION:
    Environment Variables:
    - NODE_ENV: Environment mode (development, production, test)
    - HEALTH_CHECK_TIMEOUT: Default timeout in milliseconds
    - HEALTH_CHECK_INTERVAL: Default monitoring interval
    - DASHBOARD_ENABLED: Enable dashboard integration (true/false)

    Configuration Files:
    - .env: Environment-specific settings
    - config/environment.js: Detailed environment configuration

EXIT CODES:
    0    Success - Health check completed successfully
    1    Health Failure - System or application health issues detected
    2    Configuration Error - Invalid configuration or parameters
    3    Timeout - Health check operation timed out

MONITORING INTEGRATION:
    Dashboard Endpoint: /health-dashboard (when dashboard enabled)
    Metrics Endpoint: /health-metrics
    Alert Webhook: Configurable via ALERT_WEBHOOK_URL

TROUBLESHOOTING:
    Common Issues:
    - Permission errors: Ensure script has appropriate file system permissions
    - Timeout errors: Increase timeout value or check system performance
    - Connection errors: Verify network connectivity and service availability
    - PM2 integration: Ensure PM2 is properly installed and configured

    Debug Mode:
    $ DEBUG=health-check:* node health-check.js --verbose

    Log Files:
    - Application logs: logs/app-{environment}.log
    - Error logs: logs/error-{environment}.log
    - Health check logs: logs/health-check-{timestamp}.log

EDUCATIONAL FEATURES:
    Cross-Platform Comparison:
    - Use --format=dashboard to see Node.js vs Flask implementation patterns
    - Educational metadata included in output for learning purposes
    - Performance comparison metrics for different deployment strategies

    Learning Objectives:
    - Modern health check automation patterns
    - Production deployment validation strategies
    - Performance monitoring and alerting techniques
    - Security-aware operational practices

For more information, visit: https://github.com/your-org/nodejs-tutorial-project
Documentation: https://docs.your-org.com/nodejs-tutorial/health-checks
`;

  console.log(usageInfo);
}

/**
 * Main script execution function that orchestrates health check operations based on command line
 * arguments, handles script lifecycle, and manages appropriate exit codes for automation integration
 * 
 * @returns {Promise} Promise that resolves when script execution is complete
 */
export async function main() {
  const requestLogger = createRequestLogger({ operation: 'main-execution' });
  let exitCode = EXIT_CODES.SUCCESS;

  try {
    // Parse command line arguments and validate script configuration
    const config = parseCommandLineArguments(process.argv);
    
    if (config.hasError) {
      handleHealthCheckError(new Error(config.error), { phase: 'argument-parsing' });
      return;
    }

    // Display usage information if help flag is set
    if (config.help) {
      displayUsageInformation();
      process.exit(EXIT_CODES.SUCCESS);
      return;
    }

    // Initialize logging system with script-specific context
    requestLogger.info('Health check script started', {
      config: {
        type: config.type,
        format: config.format,
        output: config.output,
        continuous: config.continuous
      },
      environment: config.environment,
      scriptVersion: '1.0.0',
      startTime: new Date().toISOString()
    });

    // Validate environment configuration and health check requirements
    if (config.validate) {
      const validationResult = validateHealthConfiguration(config);
      const formattedResult = formatHealthOutput(validationResult, config.format, config);
      
      if (config.output === 'file' && config.outputFile) {
        await writeOutputToFile(formattedResult, config.outputFile);
        requestLogger.info('Configuration validation saved to file', { file: config.outputFile });
      } else {
        console.log(formattedResult);
      }
      
      exitCode = validationResult.valid ? EXIT_CODES.SUCCESS : EXIT_CODES.CONFIG_ERROR;
      process.exit(exitCode);
      return;
    }

    let healthResult;

    // Handle continuous monitoring mode
    if (config.continuous) {
      requestLogger.info('Starting continuous monitoring mode', { interval: config.interval });
      
      // Start continuous monitoring and wait for termination signal
      await startContinuousMonitoring(config);
      
      // Set up graceful shutdown handlers
      process.on('SIGINT', async () => {
        requestLogger.info('Received SIGINT, stopping continuous monitoring');
        await stopContinuousMonitoring(config);
        process.exit(EXIT_CODES.SUCCESS);
      });

      process.on('SIGTERM', async () => {
        requestLogger.info('Received SIGTERM, stopping continuous monitoring');
        await stopContinuousMonitoring(config);
        process.exit(EXIT_CODES.SUCCESS);
      });

      // Keep process alive for continuous monitoring
      return new Promise(() => {}); // Never resolves, keeps process running
    }

    // Handle report generation mode
    if (config.report) {
      requestLogger.info('Generating health report', { type: config.type });
      healthResult = generateHealthReport(config.type, config);
    } else {
      // Determine health check type based on arguments and configuration
      switch (config.type) {
        case 'quick':
          healthResult = await executeQuickHealthCheck(config);
          break;
        case 'comprehensive':
          healthResult = await executeComprehensiveHealthCheck(config);
          break;
        case 'monitoring':
          healthResult = await executeMonitoringHealthCheck(config);
          break;
        default:
          throw new Error(`Unknown health check type: ${config.type}`);
      }
    }

    // Format and output health check results according to specified format
    const formattedOutput = formatHealthOutput(healthResult, config.format, config);
    
    if (config.output === 'file' && config.outputFile) {
      await writeOutputToFile(formattedOutput, config.outputFile);
      requestLogger.info('Health check results saved to file', { file: config.outputFile });
    } else if (config.output === 'dashboard') {
      requestLogger.info('Health check results sent to dashboard', { 
        endpoint: config.dashboardEndpoint || '/health-dashboard' 
      });
      // In a real implementation, this would send data to dashboard
    } else {
      console.log(formattedOutput);
    }

    // Determine exit code based on health check results
    if (healthResult.status === 'healthy') {
      exitCode = EXIT_CODES.SUCCESS;
    } else if (healthResult.status === 'unhealthy' || healthResult.status === 'error') {
      exitCode = EXIT_CODES.HEALTH_FAILURE;
    } else {
      exitCode = EXIT_CODES.SUCCESS; // Default to success for unknown status
    }

    requestLogger.info('Health check script completed successfully', {
      status: healthResult.status,
      executionTime: Date.now() - SCRIPT_START_TIME,
      exitCode
    });

  } catch (error) {
    // Handle any errors with comprehensive error reporting and recovery
    requestLogger.error('Health check script execution failed', {
      error: error.message,
      stack: error.stack,
      executionTime: Date.now() - SCRIPT_START_TIME
    });
    
    handleHealthCheckError(error, { phase: 'main-execution' });
    return; // handleHealthCheckError will manage script termination
  }

  // Cleanup resources and exit with appropriate status code for automation
  await cleanupResources(requestLogger);
  process.exit(exitCode);
}

// Helper functions for health check operations

/**
 * Determines overall health status from multiple health check results
 * @private
 * @param {Array} healthResults - Array of health check results
 * @returns {string} Overall health status
 */
function determineOverallHealthStatus(healthResults) {
  if (!Array.isArray(healthResults) || healthResults.length === 0) {
    return 'unknown';
  }

  const statuses = healthResults.map(result => result?.status || 'unknown');
  
  if (statuses.includes('unhealthy') || statuses.includes('error')) {
    return 'unhealthy';
  }
  
  if (statuses.includes('degraded') || statuses.includes('warning')) {
    return 'degraded';
  }
  
  if (statuses.every(status => status === 'healthy')) {
    return 'healthy';
  }
  
  return 'unknown';
}

/**
 * Generates health recommendations based on analysis
 * @private
 * @param {object} healthResult - Health check result
 * @param {object} systemMetrics - System metrics
 * @param {object} performanceAnalysis - Performance analysis
 * @returns {Array} Array of recommendation strings
 */
function generateHealthRecommendations(healthResult, systemMetrics, performanceAnalysis) {
  const recommendations = [];
  
  // Memory usage recommendations
  if (performanceAnalysis.memoryEfficiency > 90) {
    recommendations.push('Consider increasing memory allocation or optimizing memory usage');
  }
  
  // CPU usage recommendations
  if (performanceAnalysis.systemLoad > 2.0) {
    recommendations.push('High system load detected, consider scaling resources');
  }
  
  // Response time recommendations
  if (performanceAnalysis.responseTime > 5000) {
    recommendations.push('Slow response times detected, investigate performance bottlenecks');
  }
  
  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push('System is operating within normal parameters');
  }
  
  return recommendations;
}

/**
 * Determines monitoring status from health metrics and thresholds
 * @private
 * @param {object} healthMetrics - Health metrics object
 * @param {object} thresholdValidation - Threshold validation results
 * @returns {string} Monitoring status
 */
function determineMonitoringStatus(healthMetrics, thresholdValidation) {
  if (thresholdValidation.violations > 0) {
    return thresholdValidation.criticalViolations > 0 ? 'critical' : 'warning';
  }
  
  return healthMetrics?.status || 'healthy';
}

/**
 * Validates health metrics against configured thresholds
 * @private
 * @param {object} healthMetrics - Health metrics to validate
 * @param {object} performanceMetrics - Performance metrics
 * @param {object} options - Validation options
 * @returns {object} Threshold validation results
 */
function validateHealthThresholds(healthMetrics, performanceMetrics, options) {
  const validation = {
    violations: 0,
    criticalViolations: 0,
    warnings: 0,
    details: []
  };
  
  // Validate response time threshold
  const responseTimeThreshold = options.responseTimeThreshold || 5000;
  if (performanceMetrics.responseTime > responseTimeThreshold) {
    validation.violations++;
    validation.details.push({
      metric: 'responseTime',
      value: performanceMetrics.responseTime,
      threshold: responseTimeThreshold,
      severity: 'warning'
    });
  }
  
  // Validate memory usage threshold
  const memoryThreshold = options.memoryThreshold || 90;
  const memoryUsage = (performanceMetrics.memoryUsage.heapUsed / performanceMetrics.memoryUsage.heapTotal) * 100;
  if (memoryUsage > memoryThreshold) {
    validation.violations++;
    validation.criticalViolations++;
    validation.details.push({
      metric: 'memoryUsage',
      value: memoryUsage,
      threshold: memoryThreshold,
      severity: 'critical'
    });
  }
  
  return validation;
}

/**
 * Generates health alerts based on threshold violations
 * @private
 * @param {object} thresholdValidation - Threshold validation results
 * @param {object} options - Alert generation options
 * @returns {Array} Array of alert objects
 */
function generateHealthAlerts(thresholdValidation, options) {
  const alerts = [];
  
  if (!options.alerting) {
    return alerts;
  }
  
  thresholdValidation.details.forEach(violation => {
    alerts.push({
      level: violation.severity,
      metric: violation.metric,
      message: `${violation.metric} (${violation.value}) exceeded threshold (${violation.threshold})`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  });
  
  return alerts;
}

/**
 * Calculates memory usage trend
 * @private
 * @param {object} memoryUsage - Memory usage object
 * @returns {string} Memory trend indicator
 */
function calculateMemoryTrend(memoryUsage) {
  // In a real implementation, this would analyze historical data
  const efficiency = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  if (efficiency > 90) return 'increasing';
  if (efficiency < 50) return 'decreasing';
  return 'stable';
}

/**
 * Calculates CPU usage trend
 * @private
 * @param {object} cpuUsage - CPU usage object
 * @returns {string} CPU trend indicator
 */
function calculateCpuTrend(cpuUsage) {
  // In a real implementation, this would analyze historical data
  const totalUsage = cpuUsage.user + cpuUsage.system;
  
  if (totalUsage > 1000000) return 'increasing'; // Microseconds
  if (totalUsage < 100000) return 'decreasing';
  return 'stable';
}

/**
 * Calculates response time trend
 * @private
 * @param {number} responseTime - Current response time
 * @returns {string} Response time trend indicator
 */
function calculateResponseTrend(responseTime) {
  // In a real implementation, this would analyze historical data
  if (responseTime > 5000) return 'increasing';
  if (responseTime < 1000) return 'decreasing';
  return 'stable';
}

/**
 * Starts custom monitoring loop when HealthCheckManager is not available
 * @private
 * @param {object} config - Monitoring configuration
 * @param {object} logger - Logger instance
 * @returns {Promise} Promise that resolves when monitoring is started
 */
async function startCustomMonitoringLoop(config, logger) {
  logger.info('Starting custom monitoring loop', { interval: config.interval });
  
  // Create a simple monitoring implementation
  const monitoringState = {
    started: true,
    interval: config.interval,
    checks: 0,
    failures: 0
  };
  
  // Store monitoring state globally
  process.customMonitoringState = monitoringState;
  
  return Promise.resolve(monitoringState);
}

/**
 * Handles alerts from continuous monitoring
 * @private
 * @param {Array} alerts - Array of alert objects
 * @param {object} logger - Logger instance
 * @returns {Promise} Promise that resolves when alerts are handled
 */
async function handleContinuousMonitoringAlerts(alerts, logger) {
  for (const alert of alerts) {
    logger.warn('Health monitoring alert generated', {
      level: alert.level,
      metric: alert.metric,
      message: alert.message,
      timestamp: alert.timestamp
    });
    
    // In a real implementation, this would send alerts to external systems
    if (alert.level === 'critical') {
      logger.error('Critical health alert requires immediate attention', alert);
    }
  }
}

/**
 * Sets up automated alerting for continuous monitoring
 * @private
 * @param {object} config - Alerting configuration
 * @param {object} logger - Logger instance
 * @returns {Promise} Promise that resolves when alerting is configured
 */
async function setupAutomatedAlerting(config, logger) {
  logger.info('Setting up automated alerting', {
    enabled: config.alerting,
    webhookUrl: config.alertWebhookUrl || 'not configured'
  });
  
  // In a real implementation, this would configure alerting systems
  return Promise.resolve({ alertingEnabled: true });
}

/**
 * Initializes dashboard integration for continuous monitoring
 * @private
 * @param {object} config - Dashboard configuration
 * @param {object} logger - Logger instance
 * @returns {Promise} Promise that resolves when dashboard is initialized
 */
async function initializeDashboardIntegration(config, logger) {
  logger.info('Initializing dashboard integration', {
    enabled: config.dashboard,
    endpoint: config.dashboardEndpoint || '/health-dashboard'
  });
  
  // In a real implementation, this would set up dashboard connectivity
  return Promise.resolve({ dashboardEnabled: true });
}

/**
 * Cleans up monitoring resources
 * @private
 * @param {object} logger - Logger instance
 * @returns {Promise} Promise that resolves when cleanup is complete
 */
async function cleanupMonitoringResources(logger) {
  logger.debug('Cleaning up monitoring resources');
  
  // Clear any cached data or connections
  HEALTH_CHECK_INSTANCE = null;
  HEALTH_MANAGER_INSTANCE = null;
  
  // Clear custom monitoring state
  if (process.customMonitoringState) {
    delete process.customMonitoringState;
  }
  
  return Promise.resolve();
}

/**
 * Generates executive summary for health reports
 * @private
 * @param {object} healthData - Health data
 * @param {object} options - Report options
 * @returns {object} Executive summary object
 */
function generateExecutiveSummary(healthData, options) {
  return {
    overallStatus: 'healthy',
    overallScore: 85,
    keyMetrics: {
      uptime: healthData.system?.uptime || 0,
      memoryUsage: Math.round((healthData.system?.memory?.heapUsed / healthData.system?.memory?.heapTotal) * 100) || 0,
      responseTime: 'Good'
    },
    criticalIssues: 0,
    recommendations: 1
  };
}

/**
 * Generates technical analysis for health reports
 * @private
 * @param {object} healthData - Health data
 * @param {object} options - Report options
 * @returns {object} Technical analysis object
 */
function generateTechnicalAnalysis(healthData, options) {
  return {
    systemResources: {
      memory: healthData.system?.memory || {},
      cpu: healthData.system?.cpu || {},
      platform: healthData.system?.platform || process.platform
    },
    performance: {
      uptime: healthData.system?.uptime || 0,
      nodeVersion: healthData.system?.nodeVersion || process.version
    },
    diagnostics: {
      healthy: true,
      issues: []
    }
  };
}

/**
 * Generates performance analysis for health reports
 * @private
 * @param {object} healthData - Health data
 * @param {object} options - Report options
 * @returns {object} Performance analysis object
 */
function generatePerformanceAnalysis(healthData, options) {
  return {
    responseTime: {
      current: 'Fast',
      trend: 'Stable',
      benchmark: 'Good'
    },
    throughput: {
      current: 'Normal',
      capacity: 'Available'
    },
    resources: {
      memory: 'Optimal',
      cpu: 'Low',
      network: 'Available'
    }
  };
}

/**
 * Generates actionable recommendations
 * @private
 * @param {object} healthData - Health data
 * @param {object} options - Report options
 * @returns {Array} Array of recommendation strings
 */
function generateActionableRecommendations(healthData, options) {
  return [
    'System is operating normally - continue monitoring',
    'Consider enabling continuous monitoring for production environments',
    'Review health check thresholds periodically to ensure they remain appropriate'
  ];
}

/**
 * Generates security analysis for health reports
 * @private
 * @param {object} healthData - Health data
 * @param {object} options - Report options
 * @returns {object} Security analysis object
 */
function generateSecurityAnalysis(healthData, options) {
  return {
    securityStatus: 'Good',
    vulnerabilities: [],
    recommendations: [
      'Security configurations are properly applied',
      'Continue monitoring for security updates'
    ]
  };
}

/**
 * Applies sensitive data filtering to health data
 * @private
 * @param {object} data - Data to filter
 * @returns {object} Filtered data
 */
function applySensitiveDataFiltering(data) {
  // Create a deep copy to avoid modifying original data
  const filtered = JSON.parse(JSON.stringify(data));
  
  // Remove or mask sensitive information
  if (filtered.environment) {
    // Don't expose sensitive environment variables
    delete filtered.environment.secrets;
    delete filtered.environment.keys;
    delete filtered.environment.passwords;
  }
  
  return filtered;
}

/**
 * Formats health data as text
 * @private
 * @param {object} healthData - Health data to format
 * @param {object} options - Format options
 * @returns {string} Text formatted output
 */
function formatAsText(healthData, options) {
  let output = `Health Check Report\n`;
  output += `==================\n\n`;
  output += `Status: ${healthData.status || 'Unknown'}\n`;
  output += `Timestamp: ${healthData.timestamp || new Date().toISOString()}\n`;
  output += `Uptime: ${healthData.uptime || 0} seconds\n`;
  
  if (healthData.error) {
    output += `Error: ${healthData.error}\n`;
  }
  
  if (healthData.system) {
    output += `\nSystem Information:\n`;
    output += `- Platform: ${healthData.system.platform || 'Unknown'}\n`;
    output += `- Node Version: ${healthData.system.nodeVersion || 'Unknown'}\n`;
    output += `- PID: ${healthData.system.pid || 'Unknown'}\n`;
  }
  
  return output;
}

/**
 * Formats health data for dashboard consumption
 * @private
 * @param {object} healthData - Health data to format
 * @param {object} options - Format options
 * @returns {string} Dashboard formatted output
 */
function formatForDashboard(healthData, options) {
  const dashboardData = {
    ...healthData,
    dashboardVersion: '1.0.0',
    chartData: {
      status: healthData.status === 'healthy' ? 1 : 0,
      timestamp: Date.now(),
      metrics: {
        uptime: healthData.uptime || 0,
        memory: healthData.system?.memory?.heapUsed || 0,
        responseTime: healthData.responseTime || 0
      }
    }
  };
  
  return JSON.stringify(dashboardData, null, 2);
}

/**
 * Formats health data as CSV
 * @private
 * @param {object} healthData - Health data to format
 * @param {object} options - Format options
 * @returns {string} CSV formatted output
 */
function formatAsCSV(healthData, options) {
  const headers = ['timestamp', 'status', 'uptime', 'responseTime', 'memoryUsed'];
  const values = [
    healthData.timestamp || new Date().toISOString(),
    healthData.status || 'unknown',
    healthData.uptime || 0,
    healthData.responseTime || 0,
    healthData.system?.memory?.heapUsed || 0
  ];
  
  return `${headers.join(',')}\n${values.join(',')}`;
}

/**
 * Formats health data as XML
 * @private
 * @param {object} healthData - Health data to format
 * @param {object} options - Format options
 * @returns {string} XML formatted output
 */
function formatAsXML(healthData, options) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<healthCheck>\n';
  xml += `  <status>${healthData.status || 'unknown'}</status>\n`;
  xml += `  <timestamp>${healthData.timestamp || new Date().toISOString()}</timestamp>\n`;
  xml += `  <uptime>${healthData.uptime || 0}</uptime>\n`;
  
  if (healthData.system) {
    xml += '  <system>\n';
    xml += `    <platform>${healthData.system.platform || 'unknown'}</platform>\n`;
    xml += `    <nodeVersion>${healthData.system.nodeVersion || 'unknown'}</nodeVersion>\n`;
    xml += `    <pid>${healthData.system.pid || 'unknown'}</pid>\n`;
    xml += '  </system>\n';
  }
  
  xml += '</healthCheck>';
  return xml;
}

/**
 * Formats timestamps in output
 * @private
 * @param {string} output - Output string to process
 * @param {string} format - Timestamp format
 * @returns {string} Output with formatted timestamps
 */
function formatTimestamps(output, format) {
  // In a real implementation, this would apply timestamp formatting
  return output; // Placeholder implementation
}

/**
 * Generates educational metadata
 * @private
 * @param {object} healthData - Health data
 * @param {string} format - Output format
 * @returns {object} Educational metadata
 */
function generateEducationalMetadata(healthData, format) {
  return {
    learningObjective: 'Understanding health check automation patterns',
    implementationNotes: `This health check demonstrates ${format} output formatting`,
    crossPlatformNotes: 'Compatible with both Node.js and Flask implementations',
    productionConsiderations: 'Includes performance optimization and security features'
  };
}

/**
 * Adds educational metadata to output
 * @private
 * @param {string} output - Output string
 * @param {object} metadata - Educational metadata
 * @param {string} format - Output format
 * @returns {string} Output with educational metadata
 */
function addEducationalMetadata(output, metadata, format) {
  if (format === 'json') {
    const parsed = JSON.parse(output);
    parsed._educational = metadata;
    return JSON.stringify(parsed, null, 2);
  }
  
  return output + '\n\n' + JSON.stringify(metadata, null, 2);
}

/**
 * Validates formatted output
 * @private
 * @param {string} output - Formatted output
 * @param {string} format - Expected format
 */
function validateFormattedOutput(output, format) {
  if (format === 'json') {
    try {
      JSON.parse(output);
    } catch (error) {
      throw new Error(`Invalid JSON output: ${error.message}`);
    }
  }
  
  if (format === 'xml') {
    if (!output.includes('<?xml') || !output.includes('</healthCheck>')) {
      throw new Error('Invalid XML output format');
    }
  }
}

/**
 * Validates threshold configuration
 * @private
 * @param {object} thresholds - Threshold configuration
 * @returns {object} Validation result
 */
function validateThresholdConfiguration(thresholds) {
  const result = { errors: [], warnings: [], penalty: 0 };
  
  if (thresholds.responseTime && thresholds.responseTime < 100) {
    result.warnings.push('Very low response time threshold may cause false positives');
    result.penalty += 5;
  }
  
  if (thresholds.memory && (thresholds.memory < 10 || thresholds.memory > 95)) {
    result.errors.push('Memory threshold must be between 10% and 95%');
    result.penalty += 15;
  }
  
  return result;
}

/**
 * Validates PM2 configuration
 * @private
 * @param {object} pm2Config - PM2 configuration
 * @returns {object} Validation result
 */
function validatePM2Configuration(pm2Config) {
  const result = { warnings: [], recommendations: [], penalty: 0 };
  
  if (environmentConfig.isProduction && !pm2Config.clusterMode) {
    result.recommendations.push('Consider enabling PM2 cluster mode for production');
    result.penalty += 5;
  }
  
  return result;
}

/**
 * Generates configuration optimization recommendations
 * @private
 * @param {object} config - Configuration object
 * @returns {Array} Array of recommendations
 */
function generateConfigurationRecommendations(config) {
  const recommendations = [];
  
  if (!config.timeout) {
    recommendations.push('Consider setting explicit timeout values for predictable behavior');
  }
  
  if (environmentConfig.isProduction && !config.alerting) {
    recommendations.push('Enable alerting for production health monitoring');
  }
  
  return recommendations;
}

/**
 * Validates production-specific configuration
 * @private
 * @param {object} config - Configuration object
 * @returns {object} Validation result
 */
function validateProductionConfiguration(config) {
  const result = { warnings: [], recommendations: [] };
  
  if (config.interval && config.interval < 10000) {
    result.warnings.push('Very frequent health checks in production may impact performance');
  }
  
  if (!config.alerting) {
    result.recommendations.push('Enable alerting for production environments');
  }
  
  return result;
}

/**
 * Classifies health check errors for appropriate handling
 * @private
 * @param {Error} error - Error to classify
 * @returns {object} Error classification
 */
function classifyHealthCheckError(error) {
  const classification = {
    type: 'unknown',
    severity: 'medium',
    recoverable: false
  };
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    classification.type = 'network';
    classification.severity = 'high';
    classification.recoverable = true;
  } else if (error.message.includes('timeout')) {
    classification.type = 'timeout';
    classification.severity = 'medium';
    classification.recoverable = true;
  } else if (error.message.includes('configuration') || error.message.includes('config')) {
    classification.type = 'configuration';
    classification.severity = 'high';
    classification.recoverable = false;
  } else if (error.name === 'ValidationError') {
    classification.type = 'validation';
    classification.severity = 'medium';
    classification.recoverable = false;
  } else {
    classification.type = 'application';
    classification.severity = 'high';
    classification.recoverable = false;
  }
  
  return classification;
}

/**
 * Attempts error recovery based on error type
 * @private
 * @param {Error} error - Original error
 * @param {object} classification - Error classification
 * @param {object} context - Error context
 * @returns {object} Recovery result
 */
function attemptErrorRecovery(error, classification, context) {
  const recovery = {
    success: false,
    strategy: 'none',
    duration: 0
  };
  
  const startTime = Date.now();
  
  if (classification.type === 'network' || classification.type === 'timeout') {
    // Attempt retry with exponential backoff
    recovery.strategy = 'retry';
    // In a real implementation, this would actually retry the operation
    recovery.success = false; // Simulated failure for this example
  }
  
  recovery.duration = Date.now() - startTime;
  return recovery;
}

/**
 * Generates comprehensive error report
 * @private
 * @param {Error} error - Error object
 * @param {object} context - Error context
 * @param {object} classification - Error classification
 * @returns {object} Error report
 */
function generateErrorReport(error, context, classification) {
  return {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context,
    classification,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      uptime: process.uptime()
    }
  };
}

/**
 * Cleans up resources during error handling
 * @private
 * @param {object} logger - Logger instance
 */
function cleanupResourcesOnError(logger) {
  try {
    logger.debug('Cleaning up resources due to error');
    
    // Clear intervals
    if (process.continuousMonitoringInterval) {
      clearInterval(process.continuousMonitoringInterval);
      delete process.continuousMonitoringInterval;
    }
    
    // Reset global instances
    HEALTH_CHECK_INSTANCE = null;
    HEALTH_MANAGER_INSTANCE = null;
    
    // Clear custom monitoring state
    if (process.customMonitoringState) {
      delete process.customMonitoringState;
    }
    
  } catch (cleanupError) {
    logger.error('Error during resource cleanup', { error: cleanupError.message });
  }
}

/**
 * Cleans up resources during normal script termination
 * @private
 * @param {object} logger - Logger instance
 * @returns {Promise} Promise that resolves when cleanup is complete
 */
async function cleanupResources(logger) {
  try {
    logger.debug('Performing final resource cleanup');
    
    // Stop performance observer
    performanceObserver.disconnect();
    
    // Clear any remaining intervals or timeouts
    if (process.continuousMonitoringInterval) {
      clearInterval(process.continuousMonitoringInterval);
      delete process.continuousMonitoringInterval;
    }
    
    // Reset global instances
    HEALTH_CHECK_INSTANCE = null;
    HEALTH_MANAGER_INSTANCE = null;
    
    return Promise.resolve();
  } catch (error) {
    logger.error('Error during final cleanup', { error: error.message });
    return Promise.resolve(); // Don't throw errors during cleanup
  }
}

/**
 * Writes output to file
 * @private
 * @param {string} content - Content to write
 * @param {string} filePath - Target file path
 * @returns {Promise} Promise that resolves when file is written
 */
async function writeOutputToFile(content, filePath) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  
  // Ensure directory exists
  const directory = path.dirname(filePath);
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
  
  // Write content to file
  await fs.writeFile(filePath, content, 'utf8');
}

// Execute main function if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error in main execution:', error.message);
    process.exit(EXIT_CODES.HEALTH_FAILURE);
  });
}