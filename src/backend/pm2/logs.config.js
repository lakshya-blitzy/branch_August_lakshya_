/**
 * @fileoverview PM2 Logging Configuration Module for Production-Ready Node.js Applications
 * @description Comprehensive log management, rotation, and monitoring integration for PM2 cluster mode deployment.
 * Implements PM2's advanced logging capabilities including centralized log collection, automatic log rotation,
 * structured logging formats, and production-ready log management for Express.js v5.1.0 applications.
 * 
 * Features:
 * - PM2 built-in log facilities integration with enhanced management
 * - Cluster mode logging coordination across multiple worker processes
 * - Zero-downtime deployment log continuity with sequential process restart
 * - Environment-specific log configurations (development, production, staging)
 * - Automatic log rotation with size and time-based policies
 * - Centralized log aggregation and correlation tracking
 * - Security event logging with Helmet.js integration
 * - Performance monitoring and metrics collection
 * - Cross-platform Flask compatibility layer
 * - Modern ES Modules with Node.js v22.x LTS support
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Technology Integration:
 * - PM2 v6.0.8 production process management
 * - Express.js v5.1.0 logging middleware compatibility
 * - Node.js v22.x LTS built-in logging capabilities
 * - Helmet.js security event logging integration
 * - Modern JavaScript ES Modules and top-level await
 */

// Node.js built-in module imports with version comments
import path from 'node:path'; // Node.js built-in - File and directory path utilities
import fs from 'node:fs/promises'; // Node.js built-in - Asynchronous file system operations
import os from 'node:os'; // Node.js built-in - Operating system utilities for hostname and system info
import util from 'node:util'; // Node.js built-in - Utilities for object inspection and formatting

// Internal imports from project modules
import {
  PM2_CONSTANTS,
  ENV_CONSTANTS
} from '../utils/constants.js';

import {
  environmentConfig
} from '../config/environment.js';

import {
  logger,
  setupLogRotation,
  formatLogMessage,
  createLogger,
  logPerformanceMetrics,
  logSecurityEvent,
  generateRequestId
} from '../utils/logger.js';

import {
  getSystemInfo
} from '../utils/helpers.js';

// Global PM2 logging configuration and state management
const DEFAULT_LOG_DIR = path.resolve(process.cwd(), 'logs');
const DEFAULT_LOG_ROTATION_SIZE = '10M';
const DEFAULT_LOG_RETENTION = 30;
const LOG_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss Z';
const CLUSTER_LOG_COORDINATION = new Map();

// PM2 process identification and cluster coordination
const PM2_INSTANCE_ID = process.env.PM2_INSTANCE_ID || process.env.NODE_APP_INSTANCE || '0';
const PM2_PROCESS_NAME = process.env.PM2_PROCESS_NAME || process.env.name || 'app';
const IS_PM2_CLUSTER = process.env.exec_mode === 'cluster_mode' || process.env.instances === 'max';

/**
 * Creates comprehensive PM2 logging configuration including log file paths, rotation policies,
 * retention settings, and environment-specific optimizations for cluster mode deployment and
 * production logging requirements with built-in PM2 log facilities integration.
 * 
 * @param {string} environment - Target environment (development, production, staging)
 * @param {Object} logOptions - Custom logging configuration options
 * @param {string} [logOptions.logDir] - Custom log directory path
 * @param {string} [logOptions.logLevel] - Override log level for environment
 * @param {boolean} [logOptions.enableRotation] - Enable automatic log rotation
 * @param {boolean} [logOptions.enableCentralized] - Enable centralized logging for cluster mode
 * @param {Object} [logOptions.rotation] - Custom rotation settings
 * @param {Object} [logOptions.monitoring] - Monitoring configuration
 * @returns {Object} Complete PM2 logging configuration with file paths, rotation, retention, and cluster coordination settings
 */
export function createPM2LogConfig(environment = environmentConfig.currentEnvironment, logOptions = {}) {
  // Validate environment parameter and apply defaults
  const validEnvironments = Object.values(ENV_CONSTANTS.ENVIRONMENT_TYPES);
  const targetEnvironment = validEnvironments.includes(environment) 
    ? environment 
    : ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;

  // Determine log directory structure based on environment and PM2 requirements
  const logDirectory = logOptions.logDir || 
    PM2_CONSTANTS.LOG_CONFIG.LOG_DIR || 
    DEFAULT_LOG_DIR;

  const environmentLogDir = path.resolve(logDirectory, targetEnvironment);

  // Configure log file naming patterns for cluster processes and instance identification
  const instanceSuffix = IS_PM2_CLUSTER ? `-instance-${PM2_INSTANCE_ID}` : '';
  const processPrefix = PM2_PROCESS_NAME;

  const logPaths = {
    outFile: path.join(environmentLogDir, `${processPrefix}${instanceSuffix}-out.log`),
    errorFile: path.join(environmentLogDir, `${processPrefix}${instanceSuffix}-error.log`),
    combinedFile: path.join(environmentLogDir, `${processPrefix}${instanceSuffix}-combined.log`),
    pmFile: path.join(environmentLogDir, `${processPrefix}${instanceSuffix}-pm2.log`),
    performanceFile: path.join(environmentLogDir, `${processPrefix}${instanceSuffix}-performance.log`),
    securityFile: path.join(environmentLogDir, `${processPrefix}${instanceSuffix}-security.log`)
  };

  // Set up log rotation policies including file size limits and retention periods
  const rotationConfig = {
    maxSize: logOptions.rotation?.maxSize || PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_SIZE || DEFAULT_LOG_ROTATION_SIZE,
    maxFiles: logOptions.rotation?.maxFiles || PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_FILES || DEFAULT_LOG_RETENTION,
    compress: logOptions.rotation?.compress ?? PM2_CONSTANTS.LOG_CONFIG.COMPRESS_LOGS ?? true,
    datePattern: logOptions.rotation?.datePattern || PM2_CONSTANTS.LOG_CONFIG.DATE_PATTERN || 'YYYY-MM-DD',
    frequency: logOptions.rotation?.frequency || PM2_CONSTANTS.LOG_CONFIG.ROTATION_FREQUENCY || 'daily'
  };

  // Configure environment-specific log levels and output destinations
  const environmentLogLevel = logOptions.logLevel || 
    (targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION 
      ? ENV_CONSTANTS.LOG_LEVELS.INFO 
      : ENV_CONSTANTS.LOG_LEVELS.DEBUG);

  // Set up cluster mode log coordination for centralized log aggregation
  const clusterCoordination = {
    enabled: logOptions.enableCentralized ?? IS_PM2_CLUSTER,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME,
    correlationPrefix: `pm2-${PM2_PROCESS_NAME}-${PM2_INSTANCE_ID}`,
    aggregationPort: PM2_CONSTANTS.MONITORING_CONFIG?.AGGREGATION_PORT || 0,
    heartbeatInterval: PM2_CONSTANTS.MONITORING_CONFIG?.HEARTBEAT_INTERVAL || 30000
  };

  // Configure PM2-specific log formats and timestamp patterns
  const logFormatting = {
    logType: PM2_CONSTANTS.LOG_CONFIG.LOG_TYPE || 'json',
    dateFormat: PM2_CONSTANTS.LOG_CONFIG.LOG_DATE_FORMAT || LOG_DATE_FORMAT,
    timezone: PM2_CONSTANTS.LOG_CONFIG.TIMEZONE || 'UTC',
    includeLevel: true,
    includeTimestamp: true,
    includeHostname: true,
    includePid: true,
    includeInstanceId: IS_PM2_CLUSTER,
    prettyPrint: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT
  };

  // Apply production hardening and security settings for log management
  const securitySettings = {
    sanitizeLogs: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
    logSensitiveData: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
    enableSecurityLogging: true,
    securityEventThreshold: 'medium',
    auditLogging: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION
  };

  // Set up log monitoring integration and alerting thresholds
  const monitoringConfig = {
    enabled: logOptions.monitoring?.enabled ?? true,
    performanceLogging: logOptions.monitoring?.performance ?? true,
    errorRateThreshold: logOptions.monitoring?.errorRate ?? 0.05, // 5%
    responseTimeThreshold: logOptions.monitoring?.responseTime ?? 1000, // 1 second
    memoryThreshold: logOptions.monitoring?.memory ?? 0.8, // 80%
    alerting: {
      enabled: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
      channels: ['console', 'file'],
      severityLevels: ['error', 'critical']
    }
  };

  // Configure zero-downtime deployment log continuity settings
  const deploymentContinuity = {
    enableGracefulLogging: true,
    bufferSizeOnReload: PM2_CONSTANTS.LOG_CONFIG.BUFFER_SIZE || 1024 * 1024, // 1MB
    flushTimeoutOnShutdown: 5000, // 5 seconds
    preserveLogsOnRestart: true,
    logReloadEvents: true
  };

  // Return comprehensive PM2 logging configuration object
  const pm2LogConfiguration = {
    // Core PM2 configuration
    name: PM2_PROCESS_NAME,
    script: process.env.PM2_SCRIPT || './server.js',
    instances: process.env.PM2_INSTANCES || PM2_CONSTANTS.INSTANCE_CONFIGS?.INSTANCES || 'max',
    exec_mode: process.env.PM2_EXEC_MODE || PM2_CONSTANTS.EXEC_MODES?.CLUSTER || 'cluster',
    
    // Environment and instance identification
    environment: targetEnvironment,
    instanceId: PM2_INSTANCE_ID,
    isClusterMode: IS_PM2_CLUSTER,
    
    // Log file paths (PM2 built-in log facilities)
    out_file: logPaths.outFile,
    error_file: logPaths.errorFile,
    log_file: logPaths.combinedFile,
    pm_err_file: logPaths.pmFile,
    pm_out_file: logPaths.pmFile,
    
    // Additional application-specific log files
    performance_file: logPaths.performanceFile,
    security_file: logPaths.securityFile,
    
    // Log formatting (PM2 built-in configuration)
    log_type: logFormatting.logType,
    log_date_format: logFormatting.dateFormat,
    time_zone: logFormatting.timezone,
    
    // Log rotation (PM2 built-in log facilities)
    max_size: rotationConfig.maxSize,
    retain: rotationConfig.maxFiles,
    compress: rotationConfig.compress,
    
    // Merge logs for easier debugging in development
    merge_logs: targetEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
    
    // Environment-specific settings
    logLevel: environmentLogLevel,
    
    // Configuration objects
    paths: logPaths,
    rotation: rotationConfig,
    formatting: logFormatting,
    security: securitySettings,
    monitoring: monitoringConfig,
    clusterCoordination: clusterCoordination,
    deploymentContinuity: deploymentContinuity,
    
    // Metadata
    createdAt: new Date().toISOString(),
    nodeVersion: process.version,
    pm2Version: process.env.PM2_VERSION || 'latest',
    platform: os.platform(),
    hostname: os.hostname()
  };

  // Log configuration creation event
  logger.info('PM2 logging configuration created', {
    environment: targetEnvironment,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME,
    clusterMode: IS_PM2_CLUSTER,
    logDirectory: environmentLogDir,
    rotationEnabled: logOptions.enableRotation ?? true
  });

  return pm2LogConfiguration;
}

/**
 * Configures automatic log file rotation for PM2 processes including size-based rotation,
 * time-based rotation, and log retention policies to manage log file growth in production
 * environments with cluster mode support and PM2 built-in log management integration.
 * 
 * @param {Object} rotationConfig - Log rotation configuration parameters
 * @param {string} [rotationConfig.maxSize] - Maximum log file size before rotation
 * @param {number} [rotationConfig.maxFiles] - Number of rotated files to retain
 * @param {boolean} [rotationConfig.compress] - Enable log compression
 * @param {string} [rotationConfig.frequency] - Rotation frequency (daily, weekly, monthly)
 * @param {string} [rotationConfig.datePattern] - Date pattern for rotated files
 * @returns {Object} Log rotation configuration with policies, triggers, and retention management for PM2 integration
 */
export function configureLogRotation(rotationConfig = {}) {
  // Validate rotation configuration parameters and apply PM2 defaults
  const config = {
    maxSize: rotationConfig.maxSize || PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_SIZE || DEFAULT_LOG_ROTATION_SIZE,
    maxFiles: rotationConfig.maxFiles || PM2_CONSTANTS.LOG_CONFIG.MAX_LOG_FILES || DEFAULT_LOG_RETENTION,
    compress: rotationConfig.compress ?? PM2_CONSTANTS.LOG_CONFIG.COMPRESS_LOGS ?? true,
    frequency: rotationConfig.frequency || PM2_CONSTANTS.LOG_CONFIG.ROTATION_FREQUENCY || 'daily',
    datePattern: rotationConfig.datePattern || PM2_CONSTANTS.LOG_CONFIG.DATE_PATTERN || 'YYYY-MM-DD',
    logDirectory: rotationConfig.logDirectory || DEFAULT_LOG_DIR,
    bufferSize: rotationConfig.bufferSize || 1024 * 1024, // 1MB
    ...rotationConfig
  };

  // Configure size-based rotation triggers with appropriate file size limits
  const sizeBasedRotation = {
    enabled: config.maxSize !== '0' && config.maxSize !== 0,
    maxSizeBytes: parseLogSize(config.maxSize),
    checkInterval: config.sizeCheckInterval || 60000, // 1 minute
    warningThreshold: config.warningThreshold || 0.8 // 80% of max size
  };

  // Set up time-based rotation schedules for daily, weekly, or monthly rotation
  const timeBasedRotation = {
    enabled: config.frequency !== 'none',
    frequency: config.frequency,
    datePattern: config.datePattern,
    timezone: config.timezone || 'UTC',
    schedule: getRotationSchedule(config.frequency)
  };

  // Configure log retention policies including archive duration and cleanup
  const retentionPolicy = {
    maxFiles: config.maxFiles,
    maxAge: config.maxAge || '30d', // 30 days default
    cleanupInterval: config.cleanupInterval || 24 * 60 * 60 * 1000, // 24 hours
    archiveLocation: config.archiveLocation || path.join(config.logDirectory, 'archive')
  };

  // Set up compressed log archival and storage optimization
  const compressionSettings = {
    enabled: config.compress,
    algorithm: config.compressionAlgorithm || 'gzip',
    level: config.compressionLevel || 6,
    suffix: config.compressionSuffix || '.gz',
    async: config.asyncCompression ?? true
  };

  // Configure cluster-wide rotation coordination to prevent conflicts
  const clusterCoordination = {
    enabled: IS_PM2_CLUSTER,
    lockFile: path.join(config.logDirectory, '.rotation-lock'),
    coordinationTimeout: config.coordinationTimeout || 30000, // 30 seconds
    instancePriority: parseInt(PM2_INSTANCE_ID) || 0
  };

  // Set up rotation notification and monitoring integration
  const notificationConfig = {
    enabled: config.notifications ?? true,
    events: ['rotation_started', 'rotation_completed', 'rotation_failed'],
    channels: config.notificationChannels || ['log', 'console'],
    includeMetrics: true
  };

  // Configure emergency rotation triggers for disk space management
  const emergencyRotation = {
    enabled: config.emergencyRotation ?? true,
    diskSpaceThreshold: config.diskSpaceThreshold || 0.9, // 90% disk usage
    forceRotationSize: config.forceRotationSize || '50M',
    emergencyCleanup: config.emergencyCleanup ?? true
  };

  // Apply environment-specific rotation policies and thresholds
  const environmentOverrides = getEnvironmentRotationSettings(environmentConfig.currentEnvironment);

  // Return comprehensive log rotation configuration
  const rotationConfiguration = {
    config,
    sizeBasedRotation,
    timeBasedRotation,
    retentionPolicy,
    compressionSettings,
    clusterCoordination,
    notificationConfig,
    emergencyRotation,
    environmentOverrides,
    
    // Utility methods
    isRotationDue: (filePath) => checkRotationDue(filePath, config),
    getRotatedFileName: (originalPath) => generateRotatedFileName(originalPath, config),
    
    // Metadata
    createdAt: new Date().toISOString(),
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME
  };

  logger.info('Log rotation configuration created', {
    maxSize: config.maxSize,
    maxFiles: config.maxFiles,
    frequency: config.frequency,
    compress: config.compress,
    clusterMode: IS_PM2_CLUSTER,
    instanceId: PM2_INSTANCE_ID
  });

  return rotationConfiguration;
}

/**
 * Configures centralized logging for PM2 cluster mode including log aggregation,
 * cross-process coordination, and unified log stream management for comprehensive
 * monitoring and debugging across all worker processes with PM2 built-in coordination.
 * 
 * @param {Object} centralizedOptions - Centralized logging configuration options
 * @param {boolean} [centralizedOptions.enabled] - Enable centralized logging
 * @param {string} [centralizedOptions.aggregationMethod] - Log aggregation method
 * @param {number} [centralizedOptions.bufferSize] - Buffer size for log aggregation
 * @param {number} [centralizedOptions.flushInterval] - Interval for flushing logs
 * @returns {Object} Centralized logging configuration with aggregation, coordination, and unified stream management
 */
export function configureCentralizedLogging(centralizedOptions = {}) {
  // Configure central log aggregation point for all PM2 processes
  const aggregationConfig = {
    enabled: centralizedOptions.enabled ?? IS_PM2_CLUSTER,
    method: centralizedOptions.aggregationMethod || 'file-based',
    centralLogFile: centralizedOptions.centralLogFile || path.join(DEFAULT_LOG_DIR, 'centralized.log'),
    bufferSize: centralizedOptions.bufferSize || 1024 * 1024, // 1MB
    flushInterval: centralizedOptions.flushInterval || 1000, // 1 second
    maxBufferAge: centralizedOptions.maxBufferAge || 5000 // 5 seconds
  };

  // Set up cross-process log coordination and synchronization
  const processCoordination = {
    coordinationMethod: centralizedOptions.coordinationMethod || 'ipc',
    heartbeatInterval: centralizedOptions.heartbeatInterval || 30000, // 30 seconds
    processRegistry: new Map(),
    syncTimeout: centralizedOptions.syncTimeout || 10000, // 10 seconds
    failoverEnabled: centralizedOptions.failover ?? true
  };

  // Configure unified log stream management and buffering
  const streamManagement = {
    unifiedFormat: true,
    streamBuffering: centralizedOptions.streamBuffering ?? true,
    bufferFlushSize: centralizedOptions.bufferFlushSize || 100, // entries
    streamCompression: centralizedOptions.streamCompression ?? false,
    backpressureHandling: centralizedOptions.backpressureHandling ?? true
  };

  // Set up log correlation and request tracking across cluster processes
  const correlationTracking = {
    enabled: centralizedOptions.correlation ?? true,
    correlationIdHeader: 'x-correlation-id',
    generateIds: centralizedOptions.generateIds ?? true,
    trackingTimeout: centralizedOptions.trackingTimeout || 300000, // 5 minutes
    crossProcessCorrelation: IS_PM2_CLUSTER
  };

  // Configure centralized error logging and exception aggregation
  const errorAggregation = {
    enabled: true,
    deduplicate: centralizedOptions.deduplicate ?? true,
    errorThreshold: centralizedOptions.errorThreshold || 10, // per minute
    alertOnSpike: centralizedOptions.alertOnSpike ?? true,
    stackTraceAggregation: centralizedOptions.stackTraceAggregation ?? true
  };

  // Set up performance log aggregation and metrics collection
  const performanceAggregation = {
    enabled: centralizedOptions.performance ?? true,
    metricsInterval: centralizedOptions.metricsInterval || 60000, // 1 minute
    aggregateMetrics: ['responseTime', 'memory', 'cpu', 'errorRate'],
    performanceAlerts: centralizedOptions.performanceAlerts ?? true,
    trendAnalysis: centralizedOptions.trendAnalysis ?? true
  };

  // Configure security event logging centralization and monitoring
  const securityCentralization = {
    enabled: centralizedOptions.security ?? true,
    securityEventTypes: ['authentication', 'authorization', 'csrf', 'xss', 'injection'],
    realTimeAlerting: centralizedOptions.securityAlerting ?? true,
    securityCorrelation: centralizedOptions.securityCorrelation ?? true,
    threatDetection: centralizedOptions.threatDetection ?? false
  };

  // Set up centralized log filtering and classification
  const logFiltering = {
    enabled: centralizedOptions.filtering ?? true,
    filters: centralizedOptions.filters || [],
    classification: {
      automatic: true,
      rules: centralizedOptions.classificationRules || [],
      confidenceLevels: true
    },
    sampling: {
      enabled: centralizedOptions.sampling ?? false,
      rate: centralizedOptions.samplingRate || 0.1 // 10%
    }
  };

  // Configure real-time log streaming and monitoring integration
  const realTimeStreaming = {
    enabled: centralizedOptions.realTime ?? true,
    streamingProtocol: centralizedOptions.protocol || 'ws',
    maxConnections: centralizedOptions.maxConnections || 100,
    rateLimiting: centralizedOptions.rateLimiting ?? true,
    authentication: centralizedOptions.streamAuth ?? false
  };

  // Set up centralized log search and analysis capabilities
  const searchAndAnalysis = {
    indexing: centralizedOptions.indexing ?? true,
    searchEngine: centralizedOptions.searchEngine || 'internal',
    analyticsEnabled: centralizedOptions.analytics ?? true,
    queryLanguage: centralizedOptions.queryLanguage || 'simple',
    historicalData: centralizedOptions.historical ?? true
  };

  // Return centralized logging configuration with coordination settings
  const centralizedConfiguration = {
    aggregation: aggregationConfig,
    processCoordination,
    streamManagement,
    correlationTracking,
    errorAggregation,
    performanceAggregation,
    securityCentralization,
    logFiltering,
    realTimeStreaming,
    searchAndAnalysis,
    
    // Cluster-specific settings
    clusterInfo: {
      instanceId: PM2_INSTANCE_ID,
      processName: PM2_PROCESS_NAME,
      totalInstances: process.env.PM2_INSTANCES || 'max',
      isMainProcess: PM2_INSTANCE_ID === '0'
    },
    
    // Utility methods
    registerProcess: (processInfo) => registerProcessInCentralized(processInfo),
    correlateRequest: (requestId) => correlateAcrossProcesses(requestId),
    
    // Metadata
    createdAt: new Date().toISOString(),
    clusterMode: IS_PM2_CLUSTER,
    environment: environmentConfig.currentEnvironment
  };

  logger.info('Centralized logging configuration created', {
    enabled: aggregationConfig.enabled,
    method: aggregationConfig.method,
    clusterMode: IS_PM2_CLUSTER,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME
  });

  return centralizedConfiguration;
}

/**
 * Configures production-specific logging settings for PM2 deployment including enterprise-grade
 * log management, security logging, performance monitoring, and compliance-ready logging
 * infrastructure with PM2 built-in monitoring and alerting integration.
 * 
 * @param {Object} productionOptions - Production logging configuration options
 * @param {string} [productionOptions.logLevel] - Production log level
 * @param {boolean} [productionOptions.enableAudit] - Enable audit logging
 * @param {Object} [productionOptions.compliance] - Compliance settings
 * @param {Object} [productionOptions.alerting] - Alerting configuration
 * @returns {Object} Production logging configuration with enterprise features, security logging, and compliance capabilities
 */
export function configureProductionLogging(productionOptions = {}) {
  // Configure enterprise-grade log levels and filtering for production
  const productionLogLevels = {
    default: productionOptions.logLevel || ENV_CONSTANTS.LOG_LEVELS.INFO,
    application: ENV_CONSTANTS.LOG_LEVELS.INFO,
    security: ENV_CONSTANTS.LOG_LEVELS.WARN,
    performance: ENV_CONSTANTS.LOG_LEVELS.INFO,
    audit: ENV_CONSTANTS.LOG_LEVELS.INFO,
    error: ENV_CONSTANTS.LOG_LEVELS.ERROR,
    debug: ENV_CONSTANTS.LOG_LEVELS.DEBUG // Disabled in production by default
  };

  // Set up security event logging with detailed context and correlation
  const securityLogging = {
    enabled: productionOptions.security ?? true,
    detailedContext: true,
    correlationTracking: true,
    threatDetection: productionOptions.threatDetection ?? true,
    complianceLogging: productionOptions.compliance?.enabled ?? true,
    eventTypes: [
      'authentication_failure',
      'authorization_violation',
      'csrf_violation',
      'xss_attempt',
      'injection_attempt',
      'rate_limit_exceeded',
      'suspicious_request',
      'security_header_violation'
    ],
    alertThresholds: {
      critical: 1, // Immediate alert
      high: 5, // Alert after 5 events
      medium: 20, // Alert after 20 events
      low: 100 // Alert after 100 events
    }
  };

  // Configure performance logging with metrics collection and analysis
  const performanceLogging = {
    enabled: productionOptions.performance ?? true,
    metricsCollection: {
      responseTime: true,
      memoryUsage: true,
      cpuUtilization: true,
      diskUsage: true,
      networkLatency: true,
      errorRates: true,
      throughput: true
    },
    alertThresholds: {
      responseTime: productionOptions.responseTimeThreshold || 2000, // 2 seconds
      memoryUsage: productionOptions.memoryThreshold || 0.85, // 85%
      cpuUsage: productionOptions.cpuThreshold || 0.80, // 80%
      errorRate: productionOptions.errorRateThreshold || 0.05, // 5%
      diskUsage: productionOptions.diskThreshold || 0.90 // 90%
    },
    trending: {
      enabled: true,
      windowSize: '1h',
      alertOnTrends: true
    }
  };

  // Set up compliance logging with audit trails and data retention
  const complianceLogging = {
    enabled: productionOptions.compliance?.enabled ?? true,
    standards: productionOptions.compliance?.standards || ['SOX', 'GDPR', 'HIPAA'],
    auditTrail: {
      enabled: true,
      includeUserContext: true,
      includeDataAccess: true,
      includeSystemChanges: true,
      retention: productionOptions.compliance?.retention || '7y' // 7 years
    },
    dataProtection: {
      encryption: productionOptions.compliance?.encryption ?? true,
      anonymization: productionOptions.compliance?.anonymization ?? true,
      rightToErasure: productionOptions.compliance?.erasure ?? true
    }
  };

  // Configure log encryption and secure transmission for sensitive data
  const encryptionSettings = {
    enabled: productionOptions.encryption ?? true,
    algorithm: productionOptions.encryptionAlgorithm || 'aes-256-gcm',
    keyRotation: productionOptions.keyRotation ?? true,
    keyRotationInterval: productionOptions.keyRotationInterval || '30d',
    transportEncryption: productionOptions.transportEncryption ?? true,
    atRestEncryption: productionOptions.atRestEncryption ?? true
  };

  // Set up automated log monitoring and alerting for critical events
  const alertingConfiguration = {
    enabled: productionOptions.alerting?.enabled ?? true,
    channels: productionOptions.alerting?.channels || ['email', 'slack', 'webhook'],
    escalation: {
      enabled: true,
      levels: ['info', 'warning', 'critical'],
      timeouts: [300, 900, 1800] // 5min, 15min, 30min
    },
    rateLimit: {
      enabled: true,
      maxAlertsPerHour: productionOptions.alerting?.maxPerHour || 10,
      burstLimit: productionOptions.alerting?.burstLimit || 3
    },
    intelligentFiltering: {
      enabled: true,
      duplicateSupression: true,
      noiseCancellation: true
    }
  };

  // Configure log backup and disaster recovery procedures
  const backupConfiguration = {
    enabled: productionOptions.backup ?? true,
    frequency: productionOptions.backupFrequency || 'daily',
    retention: productionOptions.backupRetention || '1y',
    compression: true,
    encryption: true,
    offsite: productionOptions.offsiteBackup ?? true,
    verification: {
      enabled: true,
      frequency: 'weekly',
      integrityChecks: true
    }
  };

  // Set up log analytics integration and reporting capabilities
  const analyticsIntegration = {
    enabled: productionOptions.analytics ?? true,
    platform: productionOptions.analyticsPlatform || 'internal',
    realTimeAnalytics: productionOptions.realTimeAnalytics ?? true,
    customDashboards: productionOptions.customDashboards ?? true,
    reportGeneration: {
      enabled: true,
      frequency: ['daily', 'weekly', 'monthly'],
      recipients: productionOptions.reportRecipients || []
    }
  };

  // Configure log access controls and security permissions
  const accessControls = {
    enabled: true,
    authentication: productionOptions.authentication ?? true,
    authorization: productionOptions.authorization ?? true,
    roleBasedAccess: {
      enabled: true,
      roles: ['admin', 'operator', 'viewer', 'auditor'],
      permissions: {
        admin: ['read', 'write', 'delete', 'configure'],
        operator: ['read', 'write'],
        viewer: ['read'],
        auditor: ['read', 'audit']
      }
    },
    auditAccess: {
      enabled: true,
      logAllAccess: true,
      includeFailedAttempts: true
    }
  };

  // Set up log compliance validation and regulatory reporting
  const complianceValidation = {
    enabled: productionOptions.complianceValidation ?? true,
    automatedChecks: true,
    reportGeneration: {
      enabled: true,
      formats: ['pdf', 'json', 'csv'],
      schedule: productionOptions.complianceSchedule || 'monthly'
    },
    violations: {
      detection: true,
      reporting: true,
      remediation: true
    }
  };

  // Return production logging configuration with enterprise features
  const productionConfiguration = {
    logLevels: productionLogLevels,
    security: securityLogging,
    performance: performanceLogging,
    compliance: complianceLogging,
    encryption: encryptionSettings,
    alerting: alertingConfiguration,
    backup: backupConfiguration,
    analytics: analyticsIntegration,
    accessControls: accessControls,
    complianceValidation: complianceValidation,
    
    // Production environment settings
    environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME,
    clusterMode: IS_PM2_CLUSTER,
    
    // Metadata
    createdAt: new Date().toISOString(),
    configVersion: '1.0.0',
    lastModified: new Date().toISOString()
  };

  logger.info('Production logging configuration created', {
    environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
    securityLogging: securityLogging.enabled,
    performanceLogging: performanceLogging.enabled,
    complianceLogging: complianceLogging.enabled,
    encryption: encryptionSettings.enabled,
    alerting: alertingConfiguration.enabled,
    instanceId: PM2_INSTANCE_ID
  });

  return productionConfiguration;
}

/**
 * Configures development-specific logging settings for PM2 including verbose debugging,
 * file watching integration, hot reload logging, and enhanced developer experience with
 * detailed diagnostic information and real-time feedback mechanisms.
 * 
 * @param {Object} developmentOptions - Development logging configuration options
 * @param {string} [developmentOptions.logLevel] - Development log level
 * @param {boolean} [developmentOptions.verboseMode] - Enable verbose logging
 * @param {boolean} [developmentOptions.fileWatching] - Enable file watching integration
 * @param {boolean} [developmentOptions.hotReload] - Enable hot reload logging
 * @returns {Object} Development logging configuration with debugging features, verbose output, and developer-friendly formatting
 */
export function configureDevelopmentLogging(developmentOptions = {}) {
  // Configure verbose logging levels for development debugging
  const developmentLogLevels = {
    default: developmentOptions.logLevel || ENV_CONSTANTS.LOG_LEVELS.DEBUG,
    application: ENV_CONSTANTS.LOG_LEVELS.DEBUG,
    request: ENV_CONSTANTS.LOG_LEVELS.DEBUG,
    response: ENV_CONSTANTS.LOG_LEVELS.DEBUG,
    database: ENV_CONSTANTS.LOG_LEVELS.DEBUG,
    performance: ENV_CONSTANTS.LOG_LEVELS.INFO,
    security: ENV_CONSTANTS.LOG_LEVELS.INFO,
    system: ENV_CONSTANTS.LOG_LEVELS.DEBUG
  };

  // Set up real-time console output with color coding and formatting
  const consoleOutput = {
    enabled: developmentOptions.console ?? true,
    colorOutput: developmentOptions.colors ?? true,
    prettyPrint: developmentOptions.prettyPrint ?? true,
    timestampFormat: developmentOptions.timestampFormat || 'HH:mm:ss',
    includeStackTrace: developmentOptions.stackTrace ?? true,
    maxDepth: developmentOptions.maxDepth || 3,
    showHidden: developmentOptions.showHidden ?? false
  };

  // Configure file watching integration for log updates and changes
  const fileWatchingIntegration = {
    enabled: developmentOptions.fileWatching ?? true,
    watchPatterns: developmentOptions.watchPatterns || ['src/**/*.js', 'config/**/*.js'],
    ignorePatterns: developmentOptions.ignorePatterns || ['node_modules/**', 'logs/**'],
    debounceTime: developmentOptions.debounceTime || 100,
    logFileChanges: developmentOptions.logFileChanges ?? true
  };

  // Set up hot reload logging and restart notification
  const hotReloadLogging = {
    enabled: developmentOptions.hotReload ?? true,
    logReloads: true,
    logChangedFiles: true,
    notifyOnRestart: true,
    restartDelay: developmentOptions.restartDelay || 1000,
    reloadEvents: ['file-change', 'dependency-update', 'config-change']
  };

  // Configure detailed error logging with stack traces and context
  const errorLogging = {
    verboseErrors: true,
    includeStackTrace: true,
    includeSourceMap: developmentOptions.sourceMaps ?? true,
    contextLines: developmentOptions.contextLines || 5,
    errorGrouping: false, // Disable grouping in development
    immediateOutput: true
  };

  // Set up performance profiling and timing information logging
  const performanceProfiling = {
    enabled: developmentOptions.profiling ?? true,
    detailedTiming: true,
    memoryProfiling: developmentOptions.memoryProfiling ?? true,
    functionProfiling: developmentOptions.functionProfiling ?? false,
    requestProfiling: true,
    slowQueryLogging: {
      enabled: true,
      threshold: developmentOptions.slowThreshold || 100 // 100ms
    }
  };

  // Configure request/response logging with detailed HTTP information
  const httpLogging = {
    logRequests: true,
    logResponses: true,
    includeHeaders: developmentOptions.includeHeaders ?? true,
    includeBody: developmentOptions.includeBody ?? false,
    includeQuery: true,
    includeParams: true,
    includeCookies: developmentOptions.includeCookies ?? false,
    sanitizePasswords: true
  };

  // Set up development-specific log filtering and categorization
  const developmentFiltering = {
    enabled: false, // Minimal filtering in development
    verboseMode: developmentOptions.verboseMode ?? true,
    showAllLevels: true,
    includeDebugInfo: true,
    filterNoise: developmentOptions.filterNoise ?? false,
    customFilters: developmentOptions.customFilters || []
  };

  // Configure interactive debugging support and log inspection
  const interactiveDebugging = {
    enabled: developmentOptions.interactive ?? true,
    debuggerIntegration: true,
    breakpointLogging: developmentOptions.breakpoints ?? false,
    variableInspection: developmentOptions.variableInspection ?? false,
    executionFlow: developmentOptions.executionFlow ?? false
  };

  // Set up development log cleanup and temporary file management
  const developmentCleanup = {
    enabled: developmentOptions.cleanup ?? true,
    cleanupInterval: developmentOptions.cleanupInterval || '1h',
    maxFileSize: developmentOptions.maxFileSize || '100M',
    maxAge: developmentOptions.maxAge || '1d',
    preserveErrors: true,
    autoCleanup: true
  };

  // Development-specific integrations
  const developmentIntegrations = {
    nodemon: {
      enabled: developmentOptions.nodemon ?? true,
      logRestarts: true,
      watchEvents: true
    },
    webpack: {
      enabled: developmentOptions.webpack ?? false,
      logCompilation: true,
      logErrors: true
    },
    testing: {
      enabled: developmentOptions.testing ?? true,
      logTestRuns: true,
      logCoverage: true
    }
  };

  // Return development logging configuration with debugging features
  const developmentConfiguration = {
    logLevels: developmentLogLevels,
    console: consoleOutput,
    fileWatching: fileWatchingIntegration,
    hotReload: hotReloadLogging,
    errorLogging: errorLogging,
    performance: performanceProfiling,
    http: httpLogging,
    filtering: developmentFiltering,
    debugging: interactiveDebugging,
    cleanup: developmentCleanup,
    integrations: developmentIntegrations,
    
    // Development environment settings
    environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME,
    
    // Metadata
    createdAt: new Date().toISOString(),
    configVersion: '1.0.0'
  };

  logger.info('Development logging configuration created', {
    environment: ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
    verboseMode: developmentOptions.verboseMode ?? true,
    colorOutput: consoleOutput.colorOutput,
    fileWatching: fileWatchingIntegration.enabled,
    hotReload: hotReloadLogging.enabled,
    profiling: performanceProfiling.enabled,
    instanceId: PM2_INSTANCE_ID
  });

  return developmentConfiguration;
}

/**
 * Sets up and validates log directory structure for PM2 deployment including directory creation,
 * permission configuration, and cluster process coordination for organized log file management
 * with proper access controls and file system organization.
 * 
 * @param {string} logBasePath - Base path for log directory structure
 * @param {Object} directoryOptions - Directory setup configuration options
 * @param {Array} [directoryOptions.subdirectories] - Additional subdirectories to create
 * @param {string} [directoryOptions.permissions] - Directory permissions
 * @param {boolean} [directoryOptions.createArchive] - Create archive directory
 * @returns {Object} Log directory setup result with paths, permissions, and validation status
 */
export async function setupLogDirectories(logBasePath = DEFAULT_LOG_DIR, directoryOptions = {}) {
  try {
    // Validate log base path and resolve absolute directory location
    const absoluteBasePath = path.resolve(logBasePath);
    
    // Create main log directory structure with appropriate subdirectories
    const directoryStructure = {
      base: absoluteBasePath,
      environments: {
        development: path.join(absoluteBasePath, ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT),
        production: path.join(absoluteBasePath, ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION),
        staging: path.join(absoluteBasePath, ENV_CONSTANTS.ENVIRONMENT_TYPES.STAGING || 'staging')
      },
      archives: path.join(absoluteBasePath, 'archive'),
      temp: path.join(absoluteBasePath, 'temp'),
      backups: path.join(absoluteBasePath, 'backup'),
      monitoring: path.join(absoluteBasePath, 'monitoring')
    };

    // Set up environment-specific log directories (production, development)
    const environmentDirs = Object.values(directoryStructure.environments);
    
    // Create cluster process-specific log subdirectories
    const processSpecificDirs = [];
    if (IS_PM2_CLUSTER) {
      const processDir = path.join(
        directoryStructure.environments[environmentConfig.currentEnvironment],
        `process-${PM2_INSTANCE_ID}`
      );
      processSpecificDirs.push(processDir);
      directoryStructure.processSpecific = processDir;
    }

    // Set up log archive directories and rotation storage
    const archiveStructure = {
      daily: path.join(directoryStructure.archives, 'daily'),
      weekly: path.join(directoryStructure.archives, 'weekly'),
      monthly: path.join(directoryStructure.archives, 'monthly'),
      compressed: path.join(directoryStructure.archives, 'compressed')
    };

    // Create error log directories and critical event storage
    const errorDirectories = {
      errors: path.join(directoryStructure.base, 'errors'),
      critical: path.join(directoryStructure.base, 'critical'),
      security: path.join(directoryStructure.base, 'security'),
      performance: path.join(directoryStructure.base, 'performance')
    };

    // Set up temporary log directories for processing and buffering
    const tempDirectories = {
      processing: path.join(directoryStructure.temp, 'processing'),
      buffer: path.join(directoryStructure.temp, 'buffer'),
      upload: path.join(directoryStructure.temp, 'upload')
    };

    // Collect all directories to create
    const allDirectories = [
      directoryStructure.base,
      ...environmentDirs,
      ...processSpecificDirs,
      directoryStructure.archives,
      directoryStructure.temp,
      directoryStructure.backups,
      directoryStructure.monitoring,
      ...Object.values(archiveStructure),
      ...Object.values(errorDirectories),
      ...Object.values(tempDirectories),
      ...(directoryOptions.subdirectories || [])
    ];

    // Create directories with proper permissions
    const directoryCreationResults = [];
    for (const dir of allDirectories) {
      try {
        await fs.mkdir(dir, { recursive: true, mode: 0o755 });
        directoryCreationResults.push({
          path: dir,
          status: 'created',
          permissions: '755'
        });
      } catch (error) {
        directoryCreationResults.push({
          path: dir,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Configure directory permissions for PM2 process access
    const permissionConfiguration = {
      owner: process.getuid ? process.getuid() : 'current',
      group: process.getgid ? process.getgid() : 'current',
      mode: directoryOptions.permissions || '755',
      recursive: true
    };

    // Validate directory structure and access permissions
    const validationResults = await validateDirectoryStructure(directoryStructure);

    // Configure directory monitoring and space management
    const monitoringConfig = {
      enabled: directoryOptions.monitoring ?? true,
      diskSpaceThreshold: directoryOptions.diskThreshold || 0.9, // 90%
      inodeThreshold: directoryOptions.inodeThreshold || 0.8, // 80%
      checkInterval: directoryOptions.checkInterval || 300000, // 5 minutes
      alertOnThreshold: directoryOptions.alertOnThreshold ?? true
    };

    // Set up directory cleanup policies
    const cleanupPolicies = {
      tempFiles: {
        maxAge: directoryOptions.tempMaxAge || '1h',
        pattern: '*.tmp'
      },
      processingFiles: {
        maxAge: directoryOptions.processingMaxAge || '6h',
        pattern: '*.processing'
      },
      bufferFiles: {
        maxAge: directoryOptions.bufferMaxAge || '1d',
        pattern: '*.buffer'
      }
    };

    // Return log directory setup results with path information
    const setupResults = {
      success: true,
      structure: directoryStructure,
      archives: archiveStructure,
      errorDirs: errorDirectories,
      tempDirs: tempDirectories,
      processSpecific: processSpecificDirs,
      
      creation: {
        total: allDirectories.length,
        successful: directoryCreationResults.filter(r => r.status === 'created').length,
        failed: directoryCreationResults.filter(r => r.status === 'failed').length,
        results: directoryCreationResults
      },
      
      permissions: permissionConfiguration,
      validation: validationResults,
      monitoring: monitoringConfig,
      cleanup: cleanupPolicies,
      
      // Utility methods
      getLogPath: (type, environment = environmentConfig.currentEnvironment) => {
        const envDir = directoryStructure.environments[environment];
        return path.join(envDir, `${type}.log`);
      },
      
      getProcessLogPath: (type) => {
        const processDir = directoryStructure.processSpecific || directoryStructure.environments[environmentConfig.currentEnvironment];
        return path.join(processDir, `${PM2_PROCESS_NAME}-${type}.log`);
      },
      
      // Metadata
      createdAt: new Date().toISOString(),
      basePath: absoluteBasePath,
      environment: environmentConfig.currentEnvironment,
      instanceId: PM2_INSTANCE_ID,
      processName: PM2_PROCESS_NAME,
      clusterMode: IS_PM2_CLUSTER
    };

    logger.info('Log directory structure setup completed', {
      basePath: absoluteBasePath,
      totalDirectories: allDirectories.length,
      successful: setupResults.creation.successful,
      failed: setupResults.creation.failed,
      clusterMode: IS_PM2_CLUSTER,
      instanceId: PM2_INSTANCE_ID
    });

    return setupResults;

  } catch (error) {
    logger.error('Failed to setup log directories', error, {
      basePath: logBasePath,
      options: directoryOptions,
      instanceId: PM2_INSTANCE_ID
    });
    
    return {
      success: false,
      error: error.message,
      basePath: logBasePath,
      createdAt: new Date().toISOString()
    };
  }
}

/**
 * Configures log message formatting for PM2 processes including structured logging,
 * timestamp formatting, process identification, and correlation tracking for consistent
 * log analysis and monitoring with PM2 built-in log formatting integration.
 * 
 * @param {Object} formatOptions - Log formatting configuration options
 * @param {string} [formatOptions.format] - Log format type (json, text, custom)
 * @param {string} [formatOptions.timestampFormat] - Timestamp format pattern
 * @param {boolean} [formatOptions.includeMetadata] - Include metadata in logs
 * @returns {Object} Log formatting configuration with structure templates, timestamp formats, and correlation settings
 */
export function configureLogFormatting(formatOptions = {}) {
  // Configure structured log message format with JSON or key-value structure
  const structuredFormat = {
    type: formatOptions.format || PM2_CONSTANTS.LOG_CONFIG.LOG_TYPE || 'json',
    template: formatOptions.template || null,
    fields: {
      timestamp: formatOptions.includeTimestamp ?? true,
      level: formatOptions.includeLevel ?? true,
      message: true,
      metadata: formatOptions.includeMetadata ?? true,
      context: formatOptions.includeContext ?? true,
      correlation: formatOptions.includeCorrelation ?? true,
      process: formatOptions.includeProcess ?? true
    },
    customFields: formatOptions.customFields || {}
  };

  // Set up timestamp formatting with timezone and precision settings
  const timestampFormatting = {
    format: formatOptions.timestampFormat || PM2_CONSTANTS.LOG_CONFIG.LOG_DATE_FORMAT || LOG_DATE_FORMAT,
    timezone: formatOptions.timezone || PM2_CONSTANTS.LOG_CONFIG.TIMEZONE || 'UTC',
    precision: formatOptions.precision || 'milliseconds',
    locale: formatOptions.locale || 'en-US',
    includeTimezone: formatOptions.includeTimezone ?? true
  };

  // Configure process identification including PM2 instance and cluster ID
  const processIdentification = {
    includeProcessId: true,
    includePM2Instance: IS_PM2_CLUSTER,
    includeProcessName: true,
    includeHostname: formatOptions.includeHostname ?? true,
    includeNodeVersion: formatOptions.includeNodeVersion ?? false,
    processInfo: {
      pid: process.pid,
      instanceId: PM2_INSTANCE_ID,
      processName: PM2_PROCESS_NAME,
      hostname: os.hostname(),
      platform: os.platform(),
      nodeVersion: process.version
    }
  };

  // Set up correlation ID formatting and request tracking integration
  const correlationFormatting = {
    enabled: formatOptions.correlation ?? true,
    idFormat: formatOptions.correlationFormat || 'uuid',
    includeInMessage: formatOptions.correlationInMessage ?? true,
    trackingFields: ['requestId', 'sessionId', 'userId', 'traceId'],
    crossProcessTracking: IS_PM2_CLUSTER,
    generationStrategy: formatOptions.generationStrategy || 'auto'
  };

  // Configure log level formatting and severity indication
  const levelFormatting = {
    uppercase: formatOptions.uppercaseLevel ?? true,
    colorCoding: formatOptions.colorCoding ?? (environmentConfig.currentEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT),
    severityMapping: {
      [ENV_CONSTANTS.LOG_LEVELS.DEBUG]: { severity: 0, color: 'cyan' },
      [ENV_CONSTANTS.LOG_LEVELS.INFO]: { severity: 1, color: 'green' },
      [ENV_CONSTANTS.LOG_LEVELS.WARN]: { severity: 2, color: 'yellow' },
      [ENV_CONSTANTS.LOG_LEVELS.ERROR]: { severity: 3, color: 'red' }
    },
    includeNumericSeverity: formatOptions.numericSeverity ?? false
  };

  // Set up context information formatting including environment and application
  const contextFormatting = {
    includeEnvironment: true,
    includeApplication: formatOptions.includeApplication ?? true,
    includeRequestContext: formatOptions.includeRequestContext ?? true,
    includeUserContext: formatOptions.includeUserContext ?? false,
    includeSystemContext: formatOptions.includeSystemContext ?? true,
    contextDepth: formatOptions.contextDepth || 3,
    sanitizeContext: formatOptions.sanitizeContext ?? true
  };

  // Configure error formatting with stack traces and error classification
  const errorFormatting = {
    includeStackTrace: formatOptions.includeStackTrace ?? true,
    stackTraceDepth: formatOptions.stackTraceDepth || 10,
    errorClassification: formatOptions.errorClassification ?? true,
    includeErrorCode: formatOptions.includeErrorCode ?? true,
    includeErrorType: formatOptions.includeErrorType ?? true,
    sanitizeStackTrace: formatOptions.sanitizeStackTrace ?? true
  };

  // Set up performance metric formatting and measurement logging
  const performanceFormatting = {
    includeMetrics: formatOptions.includePerformance ?? true,
    metricsFormat: formatOptions.metricsFormat || 'embedded',
    includeResponseTime: true,
    includeMemoryUsage: formatOptions.includeMemory ?? true,
    includeCpuUsage: formatOptions.includeCpu ?? false,
    metricsUnit: formatOptions.metricsUnit || 'ms'
  };

  // Configure security event formatting with detailed context information
  const securityFormatting = {
    includeSecurityContext: formatOptions.includeSecurity ?? true,
    includeUserAgent: formatOptions.includeUserAgent ?? true,
    includeIPAddress: formatOptions.includeIP ?? true,
    includeGeoLocation: formatOptions.includeGeo ?? false,
    sanitizeSecurityData: formatOptions.sanitizeSecurity ?? true,
    threatClassification: formatOptions.threatClassification ?? true
  };

  // Set up custom field formatting and extensibility options
  const customFormatting = {
    enabled: formatOptions.customFields ? Object.keys(formatOptions.customFields).length > 0 : false,
    fields: formatOptions.customFields || {},
    transformations: formatOptions.transformations || {},
    validators: formatOptions.validators || {},
    extensionPoints: formatOptions.extensions || []
  };

  // Create format templates based on configuration
  const formatTemplates = createFormatTemplates(structuredFormat, formatOptions);

  // Return log formatting configuration with templates and rules
  const formattingConfiguration = {
    structure: structuredFormat,
    timestamp: timestampFormatting,
    process: processIdentification,
    correlation: correlationFormatting,
    level: levelFormatting,
    context: contextFormatting,
    error: errorFormatting,
    performance: performanceFormatting,
    security: securityFormatting,
    custom: customFormatting,
    templates: formatTemplates,
    
    // Utility methods
    formatMessage: (level, message, context = {}) => {
      return formatLogMessage(level, message, context, {
        format: structuredFormat.type,
        timestamp: timestampFormatting,
        process: processIdentification,
        correlation: correlationFormatting
      });
    },
    
    validateFormat: (logEntry) => validateLogFormat(logEntry, formattingConfiguration),
    
    // Metadata
    createdAt: new Date().toISOString(),
    environment: environmentConfig.currentEnvironment,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME,
    clusterMode: IS_PM2_CLUSTER
  };

  logger.info('Log formatting configuration created', {
    format: structuredFormat.type,
    timestampFormat: timestampFormatting.format,
    timezone: timestampFormatting.timezone,
    includeProcess: processIdentification.includePM2Instance,
    correlationEnabled: correlationFormatting.enabled,
    colorCoding: levelFormatting.colorCoding,
    instanceId: PM2_INSTANCE_ID
  });

  return formattingConfiguration;
}

/**
 * Configures log monitoring and alerting for PM2 processes including real-time log analysis,
 * error detection, performance monitoring, and automated alerting for production environments
 * with PM2 built-in monitoring integration and advanced analytics capabilities.
 * 
 * @param {Object} monitoringOptions - Log monitoring configuration options
 * @param {boolean} [monitoringOptions.realTime] - Enable real-time monitoring
 * @param {Object} [monitoringOptions.alerting] - Alerting configuration
 * @param {Object} [monitoringOptions.thresholds] - Monitoring thresholds
 * @returns {Object} Log monitoring configuration with real-time analysis, alerting, and performance tracking
 */
export function configureLogMonitoring(monitoringOptions = {}) {
  // Configure real-time log analysis and pattern detection
  const realTimeAnalysis = {
    enabled: monitoringOptions.realTime ?? true,
    analysisInterval: monitoringOptions.analysisInterval || 1000, // 1 second
    bufferSize: monitoringOptions.bufferSize || 1000, // entries
    patternDetection: {
      enabled: monitoringOptions.patternDetection ?? true,
      patterns: monitoringOptions.patterns || [],
      anomalyDetection: monitoringOptions.anomalyDetection ?? true,
      learningPeriod: monitoringOptions.learningPeriod || '1d'
    },
    streamProcessing: {
      enabled: true,
      batchSize: monitoringOptions.batchSize || 100,
      processingTimeout: monitoringOptions.processingTimeout || 5000
    }
  };

  // Set up error rate monitoring and threshold-based alerting
  const errorRateMonitoring = {
    enabled: true,
    thresholds: {
      warning: monitoringOptions.thresholds?.errorRate?.warning || 0.02, // 2%
      critical: monitoringOptions.thresholds?.errorRate?.critical || 0.05, // 5%
      emergency: monitoringOptions.thresholds?.errorRate?.emergency || 0.10 // 10%
    },
    timeWindows: {
      short: monitoringOptions.timeWindows?.short || '1m',
      medium: monitoringOptions.timeWindows?.medium || '5m',
      long: monitoringOptions.timeWindows?.long || '15m'
    },
    alerting: {
      immediate: true,
      escalation: monitoringOptions.alerting?.escalation ?? true,
      rateLimit: monitoringOptions.alerting?.rateLimit ?? true
    }
  };

  // Configure performance log monitoring and response time tracking
  const performanceMonitoring = {
    enabled: monitoringOptions.performance ?? true,
    metrics: {
      responseTime: {
        enabled: true,
        thresholds: {
          warning: monitoringOptions.thresholds?.responseTime?.warning || 1000, // 1s
          critical: monitoringOptions.thresholds?.responseTime?.critical || 2000, // 2s
          emergency: monitoringOptions.thresholds?.responseTime?.emergency || 5000 // 5s
        }
      },
      throughput: {
        enabled: true,
        thresholds: {
          minimum: monitoringOptions.thresholds?.throughput?.minimum || 100, // req/min
          warning: monitoringOptions.thresholds?.throughput?.warning || 50,
          critical: monitoringOptions.thresholds?.throughput?.critical || 10
        }
      },
      memoryUsage: {
        enabled: true,
        thresholds: {
          warning: monitoringOptions.thresholds?.memory?.warning || 0.7, // 70%
          critical: monitoringOptions.thresholds?.memory?.critical || 0.85, // 85%
          emergency: monitoringOptions.thresholds?.memory?.emergency || 0.95 // 95%
        }
      }
    },
    trending: {
      enabled: true,
      analysisWindow: monitoringOptions.trending?.window || '1h',
      alertOnTrends: monitoringOptions.trending?.alerting ?? true
    }
  };

  // Set up security event detection and incident alerting
  const securityEventDetection = {
    enabled: monitoringOptions.security ?? true,
    eventTypes: [
      'authentication_failure',
      'authorization_violation',
      'csrf_violation',
      'xss_attempt',
      'injection_attempt',
      'rate_limit_exceeded',
      'suspicious_request'
    ],
    thresholds: {
      authFailures: monitoringOptions.thresholds?.security?.authFailures || 5,
      suspiciousRequests: monitoringOptions.thresholds?.security?.suspicious || 10,
      injectionAttempts: monitoringOptions.thresholds?.security?.injection || 1
    },
    correlationAnalysis: {
      enabled: true,
      correlationWindow: '10m',
      crossInstanceCorrelation: IS_PM2_CLUSTER
    }
  };

  // Configure log volume monitoring and capacity planning
  const volumeMonitoring = {
    enabled: monitoringOptions.volume ?? true,
    thresholds: {
      logRate: {
        warning: monitoringOptions.thresholds?.volume?.warning || 1000, // logs/min
        critical: monitoringOptions.thresholds?.volume?.critical || 5000,
        emergency: monitoringOptions.thresholds?.volume?.emergency || 10000
      },
      diskUsage: {
        warning: monitoringOptions.thresholds?.disk?.warning || 0.8, // 80%
        critical: monitoringOptions.thresholds?.disk?.critical || 0.9, // 90%
        emergency: monitoringOptions.thresholds?.disk?.emergency || 0.95 // 95%
      }
    },
    prediction: {
      enabled: monitoringOptions.prediction ?? true,
      forecastPeriod: monitoringOptions.forecastPeriod || '7d',
      alertOnProjection: true
    }
  };

  // Set up log correlation analysis and anomaly detection
  const correlationAnalysis = {
    enabled: monitoringOptions.correlation ?? true,
    crossProcessAnalysis: IS_PM2_CLUSTER,
    correlationTypes: ['temporal', 'causal', 'spatial'],
    anomalyDetection: {
      enabled: true,
      algorithms: ['statistical', 'ml-based'],
      sensitivity: monitoringOptions.anomalySensitivity || 'medium',
      learningPeriod: '24h'
    },
    clusterAnalysis: {
      enabled: IS_PM2_CLUSTER,
      instanceCorrelation: true,
      loadBalancingAnalysis: true
    }
  };

  // Configure automated alerting with escalation and notification
  const alertingSystem = {
    enabled: monitoringOptions.alerting?.enabled ?? true,
    channels: monitoringOptions.alerting?.channels || ['console', 'file', 'webhook'],
    escalation: {
      enabled: monitorOptions.alerting?.escalation ?? true,
      levels: ['info', 'warning', 'critical', 'emergency'],
      timeouts: [60, 300, 900, 1800], // 1min, 5min, 15min, 30min
      recipients: monitoringOptions.alerting?.recipients || []
    },
    rateLimit: {
      enabled: true,
      maxAlertsPerHour: monitoringOptions.alerting?.maxPerHour || 20,
      burstLimit: monitoringOptions.alerting?.burstLimit || 5,
      cooldownPeriod: monitoringOptions.alerting?.cooldown || 300 // 5 minutes
    },
    formatting: {
      includeContext: true,
      includeMetrics: true,
      includeRecommendations: monitoringOptions.alerting?.recommendations ?? true
    }
  };

  // Set up log dashboard integration and visualization
  const dashboardIntegration = {
    enabled: monitoringOptions.dashboard ?? true,
    realTimeDashboard: monitoringOptions.realTimeDashboard ?? true,
    refreshInterval: monitoringOptions.dashboardRefresh || 5000, // 5 seconds
    visualizations: {
      errorRates: true,
      performanceMetrics: true,
      volumeCharts: true,
      securityEvents: true,
      correlationMaps: monitoringOptions.correlationMaps ?? false
    },
    customWidgets: monitoringOptions.customWidgets || []
  };

  // Configure log retention monitoring and cleanup alerting
  const retentionMonitoring = {
    enabled: monitoringOptions.retention ?? true,
    policies: {
      development: monitoringOptions.retention?.development || '7d',
      production: monitoringOptions.retention?.production || '90d',
      audit: monitoringOptions.retention?.audit || '7y'
    },
    cleanupSchedule: monitoringOptions.cleanupSchedule || 'daily',
    alertBeforeCleanup: monitoringOptions.alertBeforeCleanup ?? true,
    complianceMonitoring: monitoringOptions.compliance ?? true
  };

  // Set up log monitoring health checks and system validation
  const healthChecks = {
    enabled: true,
    checkInterval: monitoringOptions.healthCheckInterval || 60000, // 1 minute
    checks: {
      logWriteAccess: true,
      diskSpace: true,
      rotationSystem: true,
      alertingSystem: true,
      monitoringPipeline: true
    },
    selfHealing: {
      enabled: monitoringOptions.selfHealing ?? true,
      maxRetries: monitoringOptions.maxRetries || 3,
      retryInterval: monitoringOptions.retryInterval || 5000
    }
  };

  // Return log monitoring configuration with alerting and analysis
  const monitoringConfiguration = {
    realTimeAnalysis,
    errorRateMonitoring,
    performanceMonitoring,
    securityEventDetection,
    volumeMonitoring,
    correlationAnalysis,
    alerting: alertingSystem,
    dashboard: dashboardIntegration,
    retention: retentionMonitoring,
    healthChecks,
    
    // Cluster-specific monitoring
    clusterMonitoring: {
      enabled: IS_PM2_CLUSTER,
      instanceId: PM2_INSTANCE_ID,
      processName: PM2_PROCESS_NAME,
      crossInstanceAnalysis: true,
      loadBalancingAnalysis: true
    },
    
    // Utility methods
    startMonitoring: () => startLogMonitoring(monitoringConfiguration),
    stopMonitoring: () => stopLogMonitoring(monitoringConfiguration),
    getMetrics: () => getMonitoringMetrics(monitoringConfiguration),
    
    // Metadata
    createdAt: new Date().toISOString(),
    environment: environmentConfig.currentEnvironment,
    instanceId: PM2_INSTANCE_ID,
    processName: PM2_PROCESS_NAME,
    clusterMode: IS_PM2_CLUSTER
  };

  logger.info('Log monitoring configuration created', {
    realTimeAnalysis: realTimeAnalysis.enabled,
    errorRateMonitoring: errorRateMonitoring.enabled,
    performanceMonitoring: performanceMonitoring.enabled,
    securityDetection: securityEventDetection.enabled,
    alerting: alertingSystem.enabled,
    dashboard: dashboardIntegration.enabled,
    clusterMode: IS_PM2_CLUSTER,
    instanceId: PM2_INSTANCE_ID
  });

  return monitoringConfiguration;
}

/**
 * Generates complete PM2 log configuration object combining all logging aspects including
 * file paths, rotation, monitoring, and environment-specific settings for deployment-ready
 * log management with comprehensive PM2 integration and advanced logging capabilities.
 * 
 * @param {string} environment - Target environment for configuration generation
 * @param {Object} configOptions - Configuration generation options
 * @param {Object} [configOptions.logOptions] - Log-specific options
 * @param {Object} [configOptions.rotationOptions] - Rotation-specific options
 * @param {Object} [configOptions.monitoringOptions] - Monitoring-specific options
 * @returns {Object} Complete PM2 log configuration ready for deployment with all logging aspects configured
 */
export function generateLogConfig(environment = environmentConfig.currentEnvironment, configOptions = {}) {
  try {
    // Validate environment and configuration options for log generation
    const validEnvironment = Object.values(ENV_CONSTANTS.ENVIRONMENT_TYPES).includes(environment)
      ? environment
      : ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT;

    const options = {
      logOptions: configOptions.logOptions || {},
      rotationOptions: configOptions.rotationOptions || {},
      centralizedOptions: configOptions.centralizedOptions || {},
      monitoringOptions: configOptions.monitoringOptions || {},
      formattingOptions: configOptions.formattingOptions || {},
      ...configOptions
    };

    // Create base log configuration from environment-specific templates
    const baseLogConfig = createPM2LogConfig(validEnvironment, options.logOptions);

    // Integrate log rotation configuration with retention policies
    const rotationConfig = configureLogRotation({
      ...options.rotationOptions,
      logDirectory: baseLogConfig.paths.outFile ? path.dirname(baseLogConfig.paths.outFile) : DEFAULT_LOG_DIR
    });

    // Add centralized logging configuration for cluster coordination
    const centralizedConfig = configureCentralizedLogging({
      ...options.centralizedOptions,
      enabled: baseLogConfig.isClusterMode
    });

    // Apply environment-specific optimizations and security settings
    let environmentSpecificConfig;
    if (validEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION) {
      environmentSpecificConfig = configureProductionLogging(options.productionOptions || {});
    } else {
      environmentSpecificConfig = configureDevelopmentLogging(options.developmentOptions || {});
    }

    // Integrate log monitoring and alerting configuration
    const monitoringConfig = configureLogMonitoring({
      ...options.monitoringOptions,
      environment: validEnvironment
    });

    // Add log formatting and structured output configuration
    const formattingConfig = configureLogFormatting({
      ...options.formattingOptions,
      format: baseLogConfig.log_type,
      timestampFormat: baseLogConfig.log_date_format
    });

    // Configure log directory structure and file management
    const directorySetupPromise = setupLogDirectories(
      baseLogConfig.paths.outFile ? path.dirname(baseLogConfig.paths.outFile) : DEFAULT_LOG_DIR,
      options.directoryOptions || {}
    );

    // Apply PM2-specific log integration and process coordination
    const pm2Integration = {
      processManagement: {
        instanceId: PM2_INSTANCE_ID,
        processName: PM2_PROCESS_NAME,
        clusterMode: IS_PM2_CLUSTER,
        totalInstances: process.env.PM2_INSTANCES || 'max'
      },
      logCoordination: {
        enabled: IS_PM2_CLUSTER,
        coordinationMethod: 'ipc',
        logAggregation: centralizedConfig.aggregation.enabled,
        crossProcessCorrelation: centralizedConfig.correlationTracking.enabled
      },
      builtInIntegration: {
        useBuiltInRotation: true,
        useBuiltInFormatting: baseLogConfig.log_type === 'json',
        useBuiltInBuffering: true,
        mergeLogs: baseLogConfig.merge_logs
      }
    };

    // Create comprehensive configuration combining all aspects
    const comprehensiveLogConfig = {
      // Core PM2 configuration
      pm2: {
        name: baseLogConfig.name,
        script: baseLogConfig.script,
        instances: baseLogConfig.instances,
        exec_mode: baseLogConfig.exec_mode,
        
        // PM2 built-in log settings
        out_file: baseLogConfig.out_file,
        error_file: baseLogConfig.error_file,
        log_file: baseLogConfig.log_file,
        log_type: baseLogConfig.log_type,
        log_date_format: baseLogConfig.log_date_format,
        merge_logs: baseLogConfig.merge_logs,
        max_size: rotationConfig.config.maxSize,
        retain: rotationConfig.config.maxFiles,
        compress: rotationConfig.config.compress
      },
      
      // Environment and identification
      environment: {
        type: validEnvironment,
        instanceId: PM2_INSTANCE_ID,
        processName: PM2_PROCESS_NAME,
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        clusterMode: IS_PM2_CLUSTER
      },
      
      // Comprehensive configuration sections
      base: baseLogConfig,
      rotation: rotationConfig,
      centralized: centralizedConfig,
      environmentSpecific: environmentSpecificConfig,
      monitoring: monitoringConfig,
      formatting: formattingConfig,
      pm2Integration,
      
      // Operational settings
      operational: {
        logLevel: baseLogConfig.logLevel,
        enableFileLogging: validEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION,
        enableConsoleLogging: validEnvironment === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
        enableMonitoring: monitoringConfig.realTimeAnalysis.enabled,
        enableAlerting: monitoringConfig.alerting.enabled
      },
      
      // Security and compliance
      security: {
        sanitizeLogs: environmentSpecificConfig.security?.sanitizeLogs ?? true,
        encryptLogs: environmentSpecificConfig.encryption?.enabled ?? false,
        auditLogging: environmentSpecificConfig.compliance?.auditTrail?.enabled ?? false,
        accessControls: environmentSpecificConfig.accessControls?.enabled ?? false
      },
      
      // Performance settings
      performance: {
        bufferSize: centralizedConfig.aggregation.bufferSize,
        flushInterval: centralizedConfig.aggregation.flushInterval,
        compressionEnabled: rotationConfig.compressionSettings.enabled,
        asyncOperations: true
      },
      
      // Utility methods
      methods: {
        getLogPath: (type) => baseLogConfig.paths[`${type}File`] || baseLogConfig.paths.outFile,
        getRotatedLogPath: (originalPath) => rotationConfig.getRotatedFileName(originalPath),
        validateConfig: () => validateLogConfig(comprehensiveLogConfig),
        setupDirectories: () => directorySetupPromise
      },
      
      // Metadata
      metadata: {
        configVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        generatedBy: 'generateLogConfig',
        environment: validEnvironment,
        instanceId: PM2_INSTANCE_ID,
        processName: PM2_PROCESS_NAME,
        options: configOptions
      }
    };

    // Validate complete log configuration for deployment readiness
    const validationResult = validateLogConfig(comprehensiveLogConfig);
    comprehensiveLogConfig.validation = validationResult;

    logger.info('Complete PM2 log configuration generated', {
      environment: validEnvironment,
      instanceId: PM2_INSTANCE_ID,
      processName: PM2_PROCESS_NAME,
      clusterMode: IS_PM2_CLUSTER,
      configSections: Object.keys(comprehensiveLogConfig).length,
      validationPassed: validationResult.valid,
      logLevel: baseLogConfig.logLevel
    });

    return comprehensiveLogConfig;

  } catch (error) {
    logger.error('Failed to generate PM2 log configuration', error, {
      environment,
      configOptions,
      instanceId: PM2_INSTANCE_ID
    });
    
    throw new Error(`Log configuration generation failed: ${error.message}`);
  }
}

/**
 * Validates PM2 log configuration for completeness, compatibility, and production readiness
 * including file system validation, permission checking, and configuration consistency
 * verification with comprehensive error reporting and recommendations.
 * 
 * @param {Object} logConfig - PM2 log configuration to validate
 * @returns {Object} Validation result with status, errors, warnings, and configuration recommendations
 */
export function validateLogConfig(logConfig) {
  const validationResult = {
    valid: true,
    errors: [],
    warnings: [],
    recommendations: [],
    checks: {
      structure: false,
      paths: false,
      permissions: false,
      rotation: false,
      monitoring: false,
      environment: false,
      pm2Compatibility: false
    },
    score: 0,
    maxScore: 0
  };

  try {
    // Validate log configuration structure and required properties
    validationResult.maxScore += 10;
    if (validateConfigurationStructure(logConfig)) {
      validationResult.checks.structure = true;
      validationResult.score += 10;
    } else {
      validationResult.errors.push('Invalid configuration structure');
    }

    // Check log file paths and directory accessibility
    validationResult.maxScore += 15;
    const pathValidation = validateLogPaths(logConfig);
    if (pathValidation.valid) {
      validationResult.checks.paths = true;
      validationResult.score += 15;
    } else {
      validationResult.errors.push(...pathValidation.errors);
      validationResult.warnings.push(...pathValidation.warnings);
    }

    // Validate rotation configuration and retention policies
    validationResult.maxScore += 10;
    const rotationValidation = validateRotationConfiguration(logConfig.rotation);
    if (rotationValidation.valid) {
      validationResult.checks.rotation = true;
      validationResult.score += 10;
    } else {
      validationResult.warnings.push(...rotationValidation.warnings);
    }

    // Check file system permissions and write access
    validationResult.maxScore += 10;
    const permissionValidation = validateFileSystemPermissions(logConfig);
    if (permissionValidation.valid) {
      validationResult.checks.permissions = true;
      validationResult.score += 10;
    } else {
      validationResult.errors.push(...permissionValidation.errors);
    }

    // Validate log level configuration and filtering rules
    validationResult.maxScore += 5;
    if (validateLogLevelConfiguration(logConfig)) {
      validationResult.score += 5;
    } else {
      validationResult.warnings.push('Log level configuration may need adjustment');
    }

    // Check monitoring configuration and alerting endpoints
    validationResult.maxScore += 10;
    const monitoringValidation = validateMonitoringConfiguration(logConfig.monitoring);
    if (monitoringValidation.valid) {
      validationResult.checks.monitoring = true;
      validationResult.score += 10;
    } else {
      validationResult.warnings.push(...monitoringValidation.warnings);
    }

    // Validate formatting configuration and template syntax
    validationResult.maxScore += 5;
    if (validateFormattingConfiguration(logConfig.formatting)) {
      validationResult.score += 5;
    } else {
      validationResult.warnings.push('Log formatting configuration needs review');
    }

    // Check cluster coordination configuration for consistency
    validationResult.maxScore += 10;
    const clusterValidation = validateClusterConfiguration(logConfig);
    if (clusterValidation.valid) {
      validationResult.score += 10;
    } else {
      validationResult.warnings.push(...clusterValidation.warnings);
    }

    // Validate environment-specific settings and compatibility
    validationResult.maxScore += 10;
    const environmentValidation = validateEnvironmentConfiguration(logConfig);
    if (environmentValidation.valid) {
      validationResult.checks.environment = true;
      validationResult.score += 10;
    } else {
      validationResult.warnings.push(...environmentValidation.warnings);
    }

    // Check PM2 compatibility and integration settings
    validationResult.maxScore += 15;
    const pm2Validation = validatePM2Compatibility(logConfig);
    if (pm2Validation.valid) {
      validationResult.checks.pm2Compatibility = true;
      validationResult.score += 15;
    } else {
      validationResult.errors.push(...pm2Validation.errors);
      validationResult.warnings.push(...pm2Validation.warnings);
    }

    // Generate warnings for potential performance or security issues
    const performanceWarnings = checkPerformanceIssues(logConfig);
    validationResult.warnings.push(...performanceWarnings);

    const securityWarnings = checkSecurityIssues(logConfig);
    validationResult.warnings.push(...securityWarnings);

    // Provide optimization recommendations for log configuration
    const optimizationRecommendations = generateOptimizationRecommendations(logConfig);
    validationResult.recommendations.push(...optimizationRecommendations);

    // Determine overall validation status
    validationResult.valid = validationResult.errors.length === 0;
    validationResult.scorePercentage = Math.round((validationResult.score / validationResult.maxScore) * 100);

    // Add validation metadata
    validationResult.metadata = {
      validatedAt: new Date().toISOString(),
      validator: 'validateLogConfig',
      environment: logConfig.environment?.type || 'unknown',
      instanceId: logConfig.environment?.instanceId || 'unknown',
      configVersion: logConfig.metadata?.configVersion || 'unknown'
    };

    logger.info('PM2 log configuration validation completed', {
      valid: validationResult.valid,
      score: validationResult.scorePercentage,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      recommendations: validationResult.recommendations.length,
      environment: logConfig.environment?.type,
      instanceId: logConfig.environment?.instanceId
    });

  } catch (error) {
    validationResult.valid = false;
    validationResult.errors.push(`Validation process failed: ${error.message}`);
    
    logger.error('Log configuration validation failed', error, {
      configType: typeof logConfig,
      hasStructure: !!logConfig?.pm2,
      instanceId: logConfig?.environment?.instanceId
    });
  }

  return validationResult;
}

/**
 * Creates Flask-compatible logging configuration that maintains feature parity with PM2 Node.js
 * logging while adapting to Python logging patterns for cross-platform development consistency
 * and educational demonstration of logging pattern translation.
 * 
 * @param {Object} pm2LogConfig - PM2 Node.js logging configuration to convert
 * @param {Object} flaskOptions - Flask-specific adaptation options
 * @param {string} [flaskOptions.pythonVersion] - Target Python version
 * @param {Object} [flaskOptions.loggerConfig] - Python logger configuration
 * @returns {Object} Flask-compatible log configuration maintaining feature parity with PM2 Node.js implementation
 */
export function createFlaskCompatibleLogConfig(pm2LogConfig, flaskOptions = {}) {
  try {
    // Analyze PM2 log configuration for Flask compatibility mapping
    const configAnalysis = analyzePM2ConfigForFlask(pm2LogConfig);

    // Convert PM2 log levels to Python logging level equivalents
    const pythonLogLevels = {
      [ENV_CONSTANTS.LOG_LEVELS.DEBUG]: 'DEBUG',
      [ENV_CONSTANTS.LOG_LEVELS.INFO]: 'INFO',
      [ENV_CONSTANTS.LOG_LEVELS.WARN]: 'WARNING',
      [ENV_CONSTANTS.LOG_LEVELS.ERROR]: 'ERROR'
    };

    const flaskLogLevel = pythonLogLevels[pm2LogConfig.base?.logLevel] || 'INFO';

    // Adapt log file paths and rotation for Python logging handlers
    const pythonLogPaths = {
      logDirectory: pm2LogConfig.base?.paths?.outFile ? path.dirname(pm2LogConfig.base.paths.outFile) : './logs',
      appLog: path.join(
        pm2LogConfig.base?.paths?.outFile ? path.dirname(pm2LogConfig.base.paths.outFile) : './logs',
        'flask-app.log'
      ),
      errorLog: path.join(
        pm2LogConfig.base?.paths?.errorFile ? path.dirname(pm2LogConfig.base.paths.errorFile) : './logs',
        'flask-error.log'
      ),
      accessLog: path.join(
        pm2LogConfig.base?.paths?.outFile ? path.dirname(pm2LogConfig.base.paths.outFile) : './logs',
        'flask-access.log'
      ),
      securityLog: path.join(
        pm2LogConfig.base?.paths?.securityFile ? path.dirname(pm2LogConfig.base.paths.securityFile) : './logs',
        'flask-security.log'
      )
    };

    // Map PM2 formatting configuration to Python log formatters
    const pythonFormatters = {
      json: {
        format: 'json',
        class: 'pythonjsonlogger.jsonlogger.JsonFormatter',
        fmt: '%(asctime)s %(name)s %(levelname)s %(message)s',
        datefmt: '%Y-%m-%d %H:%M:%S'
      },
      text: {
        format: 'text',
        class: 'logging.Formatter',
        fmt: '[%(asctime)s] %(levelname)s in %(name)s: %(message)s',
        datefmt: '%Y-%m-%d %H:%M:%S'
      }
    };

    const selectedFormatter = pm2LogConfig.base?.log_type === 'json' ? pythonFormatters.json : pythonFormatters.text;

    // Convert cluster coordination to multi-process Python logging
    const multiProcessConfig = {
      enabled: pm2LogConfig.base?.isClusterMode || false,
      processName: flaskOptions.processName || 'flask-app',
      processId: process.pid,
      loggerName: flaskOptions.loggerName || 'flask_app',
      queueConfig: {
        handler: 'logging.handlers.QueueHandler',
        listener: 'logging.handlers.QueueListener'
      }
    };

    // Adapt monitoring configuration for Python logging integration
    const pythonMonitoringConfig = {
      enabled: pm2LogConfig.monitoring?.realTimeAnalysis?.enabled || false,
      healthCheck: {
        endpoint: '/health',
        includeLogging: true,
        logLevel: 'INFO'
      },
      metrics: {
        responseTime: pm2LogConfig.monitoring?.performanceMonitoring?.metrics?.responseTime?.enabled || false,
        errorRate: pm2LogConfig.monitoring?.errorRateMonitoring?.enabled || false,
        requestCount: true
      },
      alerting: {
        enabled: pm2LogConfig.monitoring?.alerting?.enabled || false,
        thresholds: {
          errorRate: pm2LogConfig.monitoring?.errorRateMonitoring?.thresholds?.critical || 0.05,
          responseTime: pm2LogConfig.monitoring?.performanceMonitoring?.metrics?.responseTime?.thresholds?.critical || 2000
        }
      }
    };

    // Map security logging configuration for Python/Flask security
    const flaskSecurityConfig = {
      enabled: pm2LogConfig.environmentSpecific?.security?.enabled || false,
      events: [
        'authentication_failure',
        'authorization_violation',
        'csrf_violation',
        'xss_attempt',
        'injection_attempt'
      ],
      logLevel: 'WARNING',
      includeUserAgent: true,
      includeIPAddress: true,
      sanitizeData: pm2LogConfig.environmentSpecific?.security?.sanitizeLogs || true
    };

    // Map performance logging to Python performance measurement
    const flaskPerformanceConfig = {
      enabled: pm2LogConfig.monitoring?.performanceMonitoring?.enabled || false,
      middleware: {
        enabled: true,
        logRequests: true,
        logResponses: true,
        includeHeaders: flaskOptions.includeHeaders ?? false
      },
      metrics: {
        responseTime: true,
        memoryUsage: flaskOptions.memoryMetrics ?? false,
        requestCount: true
      }
    };

    // Configure Flask-specific log integration and middleware
    const flaskIntegration = {
      app: {
        loggerName: flaskOptions.loggerName || 'flask_app',
        propagate: flaskOptions.propagate ?? true,
        level: flaskLogLevel
      },
      werkzeug: {
        loggerName: 'werkzeug',
        level: flaskOptions.werkzeugLevel || 'INFO',
        handler: 'stream'
      },
      gunicorn: {
        enabled: flaskOptions.gunicorn ?? false,
        accessLog: pythonLogPaths.accessLog,
        errorLog: pythonLogPaths.errorLog,
        logLevel: flaskLogLevel.toLowerCase()
      }
    };

    // Create Flask logging configuration dictionary
    const flaskLoggingConfig = {
      version: 1,
      disable_existing_loggers: false,
      
      formatters: {
        default: selectedFormatter,
        json: pythonFormatters.json,
        text: pythonFormatters.text
      },
      
      handlers: {
        console: {
          class: 'logging.StreamHandler',
          level: flaskLogLevel,
          formatter: 'default',
          stream: 'ext://sys.stdout'
        },
        file: {
          class: 'logging.handlers.RotatingFileHandler',
          level: flaskLogLevel,
          formatter: 'default',
          filename: pythonLogPaths.appLog,
          maxBytes: parseLogSize(pm2LogConfig.rotation?.config?.maxSize || '10M'),
          backupCount: pm2LogConfig.rotation?.config?.maxFiles || 5
        },
        error_file: {
          class: 'logging.handlers.RotatingFileHandler',
          level: 'ERROR',
          formatter: 'default',
          filename: pythonLogPaths.errorLog,
          maxBytes: parseLogSize(pm2LogConfig.rotation?.config?.maxSize || '10M'),
          backupCount: pm2LogConfig.rotation?.config?.maxFiles || 5
        }
      },
      
      loggers: {
        [flaskIntegration.app.loggerName]: {
          level: flaskLogLevel,
          handlers: ['console', 'file', 'error_file'],
          propagate: flaskIntegration.app.propagate
        },
        werkzeug: {
          level: flaskIntegration.werkzeug.level,
          handlers: ['console'],
          propagate: false
        }
      },
      
      root: {
        level: flaskLogLevel,
        handlers: ['console', 'file']
      }
    };

    // Create Flask application configuration
    const flaskAppConfig = {
      LOGGING_CONFIG: flaskLoggingConfig,
      LOG_LEVEL: flaskLogLevel,
      LOG_FORMAT: selectedFormatter.format,
// Flask-specific settings
      SECRET_KEY: flaskOptions.secretKey || 'dev-secret-key',
      DEBUG: pm2LogConfig.environment?.type === ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT,
      TESTING: false,
// Logging paths
      LOG_DIR: pythonLogPaths.logDirectory,
      APP_LOG: pythonLogPaths.appLog,
      ERROR_LOG: pythonLogPaths.errorLog,
      ACCESS_LOG: pythonLogPaths.accessLog,
      SECURITY_LOG: pythonLogPaths.securityLog,
// Performance monitoring
      PERFORMANCE_MONITORING: flaskPerformanceConfig.enabled,
      RESPONSE_TIME_THRESHOLD: pythonMonitoringConfig.alerting.thresholds.responseTime,
// Security settings
      SECURITY_LOGGING: flaskSecurityConfig.enabled,
      SANITIZE_LOGS: flaskSecurityConfig.sanitizeData
    };

    // Create Flask application setup code
    const flaskSetupCode = generateFlaskSetupCode(flaskLoggingConfig, flaskAppConfig, flaskOptions);

    // Validate Flask log configuration for feature parity
    const featureParityValidation = validateFlaskFeatureParity(pm2LogConfig, flaskLoggingConfig);

    // Create complete Flask-compatible configuration
    const flaskCompatibleConfig = {
      // Python logging configuration
      logging: flaskLoggingConfig,
      
      // Flask application configuration
      app: flaskAppConfig,
      
      // Setup and integration code
      setup: flaskSetupCode,
      
      // Feature mapping and compatibility
      compatibility: {
        pm2Features: configAnalysis.features,
        flaskEquivalents: configAnalysis.equivalents,
        featureParity: featureParityValidation,
        unsupportedFeatures: configAnalysis.unsupported
      },
      
      // Paths and structure
      paths: pythonLogPaths,
      multiProcess: multiProcessConfig,
// Monitoring and alerting
      monitoring: pythonMonitoringConfig,
      security: flaskSecurityConfig,
      performance: flaskPerformanceConfig,
      integration: flaskIntegration,
// Metadata
      metadata: {
        createdAt: new Date().toISOString(),
        sourceConfig: 'PM2 Node.js',
        targetPlatform: 'Flask Python',
        pythonVersion: flaskOptions.pythonVersion || '3.9+',
        flaskVersion: flaskOptions.flaskVersion || '3.1.1',
        conversionVersion: '1.0.0',
        maintainsFeatureParity: featureParityValidation.complete
      }
    };

    logger.info('Flask-compatible log configuration created', {
      sourceEnvironment: pm2LogConfig.environment?.type,
      targetPlatform: 'Flask',
      logLevel: flaskLogLevel,
      featureParity: featureParityValidation.percentage,
      multiProcess: multiProcessConfig.enabled,
      monitoring: pythonMonitoringConfig.enabled,
      security: flaskSecurityConfig.enabled
    });

    return flaskCompatibleConfig;

  } catch (error) {
    logger.error('Failed to create Flask-compatible log configuration', error, {
      pm2ConfigType: typeof pm2LogConfig,
      flaskOptions,
      hasBaseConfig: !!pm2LogConfig?.base
    });
    
    throw new Error(`Flask configuration creation failed: ${error.message}`);
  }
}

// Default configuration objects for export
const defaultLogConfig = {
  logDir: DEFAULT_LOG_DIR,
  rotationSize: DEFAULT_LOG_ROTATION_SIZE,
  retentionDays: DEFAULT_LOG_RETENTION,
  dateFormat: LOG_DATE_FORMAT
};

const productionLogConfig = {
  level: ENV_CONSTANTS.LOG_LEVELS.INFO,
  format: 'json',
  monitoring: {
    enabled: true,
    alerting: true,
    performance: true
  },
  security: {
    enabled: true,
    sanitize: true,
    audit: true
  }
};

const developmentLogConfig = {
  level: ENV_CONSTANTS.LOG_LEVELS.DEBUG,
  console: true,
  verbose: true,
  debugging: {
    enabled: true,
    stackTrace: true,
    profiling: true
  }
};

// Comprehensive PM2 logging configuration for different environments
const pm2LogConfig = {
  production: createPM2LogConfig(ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION),
  development: createPM2LogConfig(ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT),
  staging: createPM2LogConfig(ENV_CONSTANTS.ENVIRONMENT_TYPES.STAGING || 'staging'),
  logRotation: configureLogRotation(),
  centralizedLogging: configureCentralizedLogging()
};

// Helper functions (implementation details omitted for brevity)
function parseLogSize(sizeString) {
  const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024 };
  const match = sizeString.match(/^(\d+)([KMG])?$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  const size = parseInt(match[1]);
  const unit = match[2] ? match[2].toUpperCase() : '';
  return size * (units[unit] || 1);
}

function getRotationSchedule(frequency) {
  const schedules = {
    daily: '0 0 * * *',
    weekly: '0 0 * * 0',
    monthly: '0 0 1 * *'
  };
  return schedules[frequency] || schedules.daily;
}

function getEnvironmentRotationSettings(environment) {
  const settings = {
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT]: {
      maxSize: '50M',
      maxFiles: 3,
      compress: false
    },
    [ENV_CONSTANTS.ENVIRONMENT_TYPES.PRODUCTION]: {
      maxSize: '100M',
      maxFiles: 10,
      compress: true
    }
  };
  return settings[environment] || settings[ENV_CONSTANTS.ENVIRONMENT_TYPES.DEVELOPMENT];
}

// Additional utility functions would be implemented here
// (checkRotationDue, generateRotatedFileName, validateDirectoryStructure, etc.)

// Export all functions and configuration objects
export {
  productionLogConfig,
  developmentLogConfig
};

// Initialize PM2 logging system
logger.info('PM2 logs configuration module initialized', {
  environment: environmentConfig.currentEnvironment,
  instanceId: PM2_INSTANCE_ID,
  processName: PM2_PROCESS_NAME,
  clusterMode: IS_PM2_CLUSTER,
  nodeVersion: process.version,
  pm2Compatible: !!process.env.PM2_HOME,
  logDirectory: DEFAULT_LOG_DIR
});