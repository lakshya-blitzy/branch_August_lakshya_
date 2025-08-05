/**
 * @fileoverview PM2 Log Management and Monitoring Script
 * @description Comprehensive PM2 log management script that provides centralized log viewing,
 * filtering, rotation management, and real-time log streaming capabilities for the Node.js
 * tutorial application. This script serves as the primary interface for PM2 log operations
 * including log file access, centralized log monitoring, log rotation management, and
 * diagnostic log analysis for both development and production environments.
 * 
 * Integrates with PM2's built-in log facilities, provides educational demonstrations of
 * production logging practices, and supports cross-platform log management for Express.js
 * and Flask implementations. Features real-time log streaming, log aggregation across
 * cluster processes, performance log analysis, security event monitoring, and automated
 * log management workflows for comprehensive production deployment support.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Real-time PM2 log streaming with cluster aggregation
 * - Advanced log filtering and search capabilities
 * - Automated log rotation and retention management
 * - Comprehensive log analysis with pattern detection
 * - Security event monitoring and alerting
 * - Performance metrics extraction from logs
 * - Zero-downtime deployment log continuity
 * - Cross-platform Flask compatibility
 * - Educational demonstrations of production logging
 * 
 * Technology Integration:
 * - PM2 v5.3.0 with built-in log facilities and cluster support
 * - Node.js v22.x LTS with ES Modules and async/await patterns
 * - Express.js v5.1.0 production logging integration
 * - Helmet.js security middleware logging integration
 * - Structured JSON logging with correlation tracking
 * - Environment-aware configuration management
 */

// External library imports with version compatibility
import pm2 from 'pm2'; // PM2 v5.3.0 - Process manager API for log operations and cluster coordination
import fs from 'node:fs/promises'; // Node.js built-in - File system module for log file operations and manipulation
import path from 'node:path'; // Node.js built-in - Path utilities for log file path resolution and directory management
import readline from 'node:readline'; // Node.js built-in - Readline module for interactive log viewing and user input handling
import util from 'node:util'; // Node.js built-in - Utilities for log formatting, object inspection, and debugging output
import { EventEmitter } from 'node:events'; // Node.js built-in - Event emitter for real-time log streaming and event-driven processing

// Internal imports from project modules with specific functionality
import {
  pm2LogConfig,
  generateLogConfig,
  validateLogConfig
} from '../pm2/logs.config.js';

import logger, {
  createRequestLogger,
  formatLogMessage
} from '../utils/logger.js';

import {
  PM2_CONSTANTS,
  API_CONSTANTS
} from '../utils/constants.js';

import {
  environmentConfig,
  currentEnvironment,
  isProduction,
  isDevelopment
} from '../config/environment.js';

import {
  pm2Config
} from '../pm2/pm2.config.js';

import {
  getSystemInfo,
  measurePerformance
} from '../utils/helpers.js';

import {
  BaseError,
  PM2Error,
  ValidationError,
  createErrorResponse
} from '../utils/error-types.js';

// Global PM2 log management configuration and state tracking
const PM2_APP_NAME = process.env.PM2_APP_NAME || 'nodejs-tutorial-app';
const LOG_STREAM_BUFFER_SIZE = parseInt(process.env.LOG_BUFFER_SIZE) || 1000;
const DEFAULT_LOG_LINES = parseInt(process.env.DEFAULT_LOG_LINES) || 100;
const LOG_FOLLOW_MODE = process.env.LOG_FOLLOW === 'true' || false;
const ACTIVE_LOG_STREAMS = new Map(); // Active log streaming sessions with connection management

// Log management statistics and metrics for monitoring
const LOG_STATS = {
  totalLogsViewed: 0,
  activeStreams: 0,
  rotationsPerformed: 0,
  analysisRuns: 0,
  lastActivity: new Date().toISOString()
};

/**
 * Views PM2 application logs with filtering, pagination, and real-time streaming capabilities.
 * Supports multiple output formats, log level filtering, and time-based log retrieval for
 * comprehensive log analysis and monitoring across PM2 cluster processes.
 * 
 * Provides educational demonstrations of production log viewing patterns while supporting
 * both development debugging and production monitoring workflows. Integrates with PM2's
 * built-in log facilities for optimal performance and reliability.
 * 
 * @param {Object} logOptions - Log viewing configuration options
 * @param {string} [logOptions.appName] - PM2 application name to view logs for
 * @param {number} [logOptions.lines] - Number of log lines to retrieve
 * @param {string} [logOptions.level] - Log level filter (error, warn, info, debug)
 * @param {string} [logOptions.startTime] - Start time for log retrieval (ISO string)
 * @param {string} [logOptions.endTime] - End time for log retrieval (ISO string)
 * @param {boolean} [logOptions.follow] - Enable real-time log following
 * @param {string} [logOptions.format] - Output format (console, json, structured)
 * @param {string} [logOptions.search] - Search term for log filtering
 * @param {Object} [logOptions.processFilter] - Filter by specific process IDs or names
 * @returns {Promise} Promise that resolves with formatted log output or starts real-time streaming
 */
export async function viewLogs(logOptions = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'logs' });
  
  try {
    logger.info('Starting PM2 log viewing operation', {
      requestId,
      options: logOptions,
      environment: currentEnvironment,
      appName: logOptions.appName || PM2_APP_NAME
    });

    // Validate log viewing options and apply default configuration
    const config = await validateAndProcessLogOptions(logOptions, requestId);
    
    // Connect to PM2 daemon and verify application existence
    await connectToPM2();
    const appInfo = await verifyApplicationExists(config.appName);
    
    // Determine log sources based on cluster mode and process configuration
    const logSources = await determineLogSources(appInfo, config);
    
    // Apply log filtering based on level, time range, and search criteria
    const filteredLogs = await applyLogFiltering(logSources, config, requestId);
    
    // Configure output format for console, JSON, or structured display
    const outputFormat = configureOutputFormat(config.format, config);
    
    if (config.follow) {
      // Set up real-time streaming if follow mode is enabled
      return await setupRealTimeLogging(config, filteredLogs, outputFormat, requestId);
    } else {
      // Implement pagination for large log files and historical data
      const paginatedLogs = await implementPagination(filteredLogs, config);
      
      // Aggregate logs from multiple worker processes in cluster mode
      const aggregatedLogs = await aggregateClusterLogs(paginatedLogs, appInfo);
      
      // Apply syntax highlighting and formatting for improved readability
      const formattedOutput = await formatLogOutput(aggregatedLogs, outputFormat, config);
      
      // Update statistics and performance metrics
      LOG_STATS.totalLogsViewed += aggregatedLogs.length;
      LOG_STATS.lastActivity = new Date().toISOString();
      
      const duration = Date.now() - startTime;
      logger.info('PM2 log viewing completed', {
        requestId,
        duration,
        logsReturned: aggregatedLogs.length,
        appName: config.appName,
        format: config.format
      });

      return {
        success: true,
        logs: formattedOutput,
        metadata: {
          totalLogs: aggregatedLogs.length,
          duration,
          requestId,
          appName: config.appName,
          sources: logSources.length,
          timestamp: new Date().toISOString()
        }
      };
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to view PM2 logs', error, {
      requestId,
      duration,
      options: logOptions
    });

    throw new PM2Error(
      `Failed to view logs: ${error.message}`,
      'log-view',
      {
        requestId,
        originalError: error,
        options: logOptions,
        duration
      }
    );
  } finally {
    // Clean up PM2 connection if needed
    await disconnectFromPM2();
  }
}

/**
 * Establishes real-time log streaming from PM2 processes with live updates, filtering,
 * and multi-process aggregation. Provides continuous monitoring capabilities for production
 * deployment monitoring and real-time debugging across cluster processes.
 * 
 * Creates event-driven log streaming with buffer management, error recovery, and
 * connection health monitoring for reliable production log monitoring.
 * 
 * @param {string} appName - PM2 application name for log streaming
 * @param {Object} streamOptions - Stream configuration options
 * @param {Array} [streamOptions.processes] - Specific process IDs to stream from
 * @param {string} [streamOptions.level] - Log level filter for streaming
 * @param {number} [streamOptions.bufferSize] - Stream buffer size for high-volume logs
 * @param {boolean} [streamOptions.correlation] - Enable log correlation across processes
 * @param {Function} [streamOptions.onLog] - Callback function for each log entry
 * @param {Function} [streamOptions.onError] - Callback function for stream errors
 * @returns {EventEmitter} Event emitter for real-time log streaming with control methods
 */
export async function streamLogs(appName = PM2_APP_NAME, streamOptions = {}) {
  const requestId = logger.generateRequestId({ prefix: 'stream' });
  const streamId = `stream-${requestId}-${Date.now()}`;
  
  try {
    logger.info('Initializing PM2 log streaming', {
      requestId,
      streamId,
      appName,
      options: streamOptions
    });

    // Initialize PM2 log streaming connection with application identification
    await connectToPM2();
    const appInfo = await verifyApplicationExists(appName);
    
    // Configure real-time log aggregation across all cluster worker processes
    const streamConfig = await configureStreamSettings(streamOptions, appInfo, requestId);
    
    // Create event emitter for log streaming with control methods
    const logStream = new EventEmitter();
    
    // Set up log filtering and formatting for streaming output
    const filterConfig = setupStreamFiltering(streamConfig);
    
    // Implement buffer management for high-volume log streaming
    const bufferManager = createStreamBuffer(streamConfig.bufferSize || LOG_STREAM_BUFFER_SIZE);
    
    // Configure stream error handling and automatic reconnection
    const errorHandler = setupStreamErrorHandling(logStream, streamConfig, requestId);
    
    // Set up log correlation and process identification in stream output
    const correlationTracker = initializeLogCorrelation(appInfo, streamConfig);
    
    // Implement stream rate limiting and backpressure management
    const rateLimiter = createStreamRateLimiter(streamConfig);
    
    // Start PM2 log streaming for all relevant processes
    const pm2Stream = await startPM2LogStream(appInfo, streamConfig);
    
    // Process incoming log data with filtering and correlation
    pm2Stream.on('data', async (chunk) => {
      try {
        const logEntries = await processLogChunk(chunk, filterConfig, correlationTracker);
        
        for (const entry of logEntries) {
          // Apply rate limiting and buffer management
          if (rateLimiter.checkLimit(entry)) {
            bufferManager.add(entry);
            
            // Emit formatted log entry with correlation data
            logStream.emit('log', {
              ...entry,
              streamId,
              timestamp: new Date().toISOString(),
              correlation: correlationTracker.getCorrelation(entry)
            });
          }
        }
        
        // Emit buffer flush events for batch processing
        if (bufferManager.shouldFlush()) {
          logStream.emit('flush', bufferManager.flush());
        }
        
      } catch (processingError) {
        errorHandler.handleError(processingError, 'data-processing');
      }
    });
    
    // Handle stream events and state management
    pm2Stream.on('error', (streamError) => {
      errorHandler.handleError(streamError, 'stream-error');
    });
    
    pm2Stream.on('end', () => {
      logger.info('PM2 log stream ended', { requestId, streamId, appName });
      logStream.emit('end');
    });
    
    // Configure stream monitoring and health checking
    const healthMonitor = setupStreamHealthMonitoring(logStream, streamConfig);
    
    // Add control methods to the stream
    logStream.start = () => {
      LOG_STATS.activeStreams++;
      logger.info('Log stream started', { requestId, streamId, appName });
      return logStream;
    };
    
    logStream.stop = async () => {
      try {
        await pm2Stream.destroy();
        healthMonitor.stop();
        correlationTracker.cleanup();
        bufferManager.clear();
        ACTIVE_LOG_STREAMS.delete(streamId);
        LOG_STATS.activeStreams = Math.max(0, LOG_STATS.activeStreams - 1);
        
        logger.info('Log stream stopped', { requestId, streamId, appName });
        logStream.emit('stopped');
      } catch (stopError) {
        logger.error('Error stopping log stream', stopError, { requestId, streamId });
      }
    };
    
    logStream.pause = () => {
      pm2Stream.pause();
      logStream.emit('paused');
    };
    
    logStream.resume = () => {
      pm2Stream.resume();
      logStream.emit('resumed');
    };
    
    logStream.getStats = () => ({
      streamId,
      appName,
      startTime: streamConfig.startTime,
      logsProcessed: bufferManager.getTotalProcessed(),
      bufferSize: bufferManager.getCurrentSize(),
      correlationCount: correlationTracker.getActiveCorrelations(),
      isActive: !pm2Stream.destroyed
    });
    
    // Store active stream for management
    ACTIVE_LOG_STREAMS.set(streamId, {
      stream: logStream,
      config: streamConfig,
      startTime: new Date().toISOString(),
      appName
    });
    
    // Return configured event emitter with real-time log streaming capabilities
    logger.info('PM2 log streaming initialized successfully', {
      requestId,
      streamId,
      appName,
      processes: streamConfig.processes?.length || 'all'
    });
    
    return logStream.start();

  } catch (error) {
    logger.error('Failed to initialize PM2 log streaming', error, {
      requestId,
      appName,
      options: streamOptions
    });

    throw new PM2Error(
      `Failed to start log streaming: ${error.message}`,
      'stream-start',
      {
        requestId,
        appName,
        originalError: error,
        options: streamOptions
      }
    );
  }
}

/**
 * Manages PM2 log file rotation including manual rotation triggers, size-based rotation,
 * time-based rotation, and log archival. Integrates with PM2's log rotation capabilities
 * and provides educational demonstrations of production log management practices.
 * 
 * Supports both manual and automated rotation with comprehensive backup management,
 * compression options, and retention policies for production log management.
 * 
 * @param {Object} rotationOptions - Log rotation configuration options
 * @param {string} [rotationOptions.appName] - PM2 application name for rotation
 * @param {string} [rotationOptions.type] - Rotation type (manual, size, time, auto)
 * @param {string} [rotationOptions.maxSize] - Maximum log file size before rotation
 * @param {string} [rotationOptions.maxAge] - Maximum log file age before rotation
 * @param {boolean} [rotationOptions.compress] - Enable log compression after rotation
 * @param {number} [rotationOptions.keepFiles] - Number of rotated files to retain
 * @param {boolean} [rotationOptions.backup] - Create backup before rotation
 * @returns {Promise} Promise resolving with rotation results including file statistics and archive information
 */
export async function rotateLogs(rotationOptions = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'rotate' });
  
  try {
    logger.info('Starting PM2 log rotation operation', {
      requestId,
      options: rotationOptions,
      environment: currentEnvironment
    });

    // Validate rotation options and check current log file status
    const config = await validateRotationOptions(rotationOptions, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(config.appName);
    const logFiles = await identifyLogFiles(appInfo, config);
    
    // Check current log file sizes and rotation needs
    const rotationPlan = await createRotationPlan(logFiles, config, requestId);
    
    if (rotationPlan.needsRotation.length === 0) {
      logger.info('No log files require rotation', {
        requestId,
        appName: config.appName,
        totalFiles: logFiles.length
      });
      
      return {
        success: true,
        rotated: false,
        message: 'No files needed rotation',
        files: logFiles.map(f => ({ path: f.path, size: f.size, lastModified: f.lastModified }))
      };
    }
    
    // Stop log streaming temporarily to prevent data loss during rotation
    const activeStreams = await pauseActiveStreams(config.appName);
    
    let rotationResults = [];
    
    try {
      for (const fileInfo of rotationPlan.needsRotation) {
        logger.debug('Rotating log file', {
          requestId,
          file: fileInfo.path,
          size: fileInfo.size,
          type: config.type
        });
        
        // Create backup if requested
        let backupPath = null;
        if (config.backup) {
          backupPath = await createLogBackup(fileInfo, config, requestId);
        }
        
        // Execute PM2 log rotation using built-in rotation capabilities
        const rotationResult = await executeLogRotation(fileInfo, config, requestId);
        
        // Archive old log files with compression and timestamp naming
        const archiveResult = await archiveRotatedLog(fileInfo, rotationResult, config);
        
        // Update log configuration with new file paths and settings
        await updateLogConfiguration(fileInfo, rotationResult, config);
        
        rotationResults.push({
          originalFile: fileInfo.path,
          rotatedFile: rotationResult.rotatedPath,
          archivePath: archiveResult.archivePath,
          backupPath,
          originalSize: fileInfo.size,
          compressed: archiveResult.compressed,
          compressionRatio: archiveResult.compressionRatio,
          timestamp: new Date().toISOString()
        });
      }
      
      // Clean up old log archives based on retention policies
      const cleanupResult = await cleanupOldArchives(config, requestId);
      
      // Update log rotation metrics and tracking information
      LOG_STATS.rotationsPerformed++;
      LOG_STATS.lastActivity = new Date().toISOString();
      
      // Generate rotation summary report with file statistics
      const summary = generateRotationSummary(rotationResults, cleanupResult, startTime);
      
      logger.info('PM2 log rotation completed successfully', {
        requestId,
        filesRotated: rotationResults.length,
        totalSize: summary.totalOriginalSize,
        spaceSaved: summary.spaceSaved,
        duration: summary.duration
      });
      
      return {
        success: true,
        rotated: true,
        summary,
        files: rotationResults,
        cleanup: cleanupResult,
        requestId,
        timestamp: new Date().toISOString()
      };
      
    } finally {
      // Restart log streaming and monitoring after successful rotation
      await resumeActiveStreams(activeStreams);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('PM2 log rotation failed', error, {
      requestId,
      duration,
      options: rotationOptions
    });

    throw new PM2Error(
      `Log rotation failed: ${error.message}`,
      'log-rotation',
      {
        requestId,
        originalError: error,
        options: rotationOptions,
        duration
      }
    );
  } finally {
    await disconnectFromPM2();
  }
}

/**
 * Performs comprehensive log analysis including error pattern detection, performance
 * metric extraction, security event identification, and trend analysis across PM2
 * cluster processes for operational insights and monitoring.
 * 
 * Provides educational demonstrations of production log analysis techniques while
 * generating actionable insights for system optimization and monitoring.
 * 
 * @param {Object} analysisOptions - Log analysis configuration options
 * @param {string} [analysisOptions.appName] - PM2 application name for analysis
 * @param {string} [analysisOptions.timeRange] - Time range for analysis (1h, 24h, 7d)
 * @param {Array} [analysisOptions.metrics] - Specific metrics to analyze
 * @param {boolean} [analysisOptions.includePatterns] - Include pattern detection
 * @param {boolean} [analysisOptions.includeSecurity] - Include security analysis
 * @param {boolean} [analysisOptions.includePerformance] - Include performance metrics
 * @param {string} [analysisOptions.outputFormat] - Output format (json, report, dashboard)
 * @returns {Object} Comprehensive log analysis report with patterns, metrics, insights, and recommendations
 */
export async function analyzeLogs(analysisOptions = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'analyze' });
  
  try {
    logger.info('Starting comprehensive log analysis', {
      requestId,
      options: analysisOptions,
      environment: currentEnvironment
    });

    // Load and parse log files from specified time range and sources
    const config = await validateAnalysisOptions(analysisOptions, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(config.appName);
    const analysisTimeframe = calculateAnalysisTimeframe(config.timeRange);
    
    // Extract structured log data and identify log entry patterns
    const logData = await extractLogDataForAnalysis(appInfo, analysisTimeframe, requestId);
    const structuredData = await parseStructuredLogData(logData, config);
    
    const analysisResults = {
      summary: {
        requestId,
        appName: config.appName,
        timeRange: analysisTimeframe,
        totalLogs: logData.length,
        analysisStart: new Date(startTime).toISOString(),
        duration: null // Will be set at end
      },
      patterns: {},
      metrics: {},
      insights: [],
      recommendations: []
    };
    
    // Analyze error frequencies, patterns, and correlation with system events
    if (config.includePatterns !== false) {
      logger.debug('Analyzing error patterns and frequencies', { requestId });
      analysisResults.patterns = await analyzeErrorPatterns(structuredData, config, requestId);
    }
    
    // Extract performance metrics including response times and resource usage
    if (config.includePerformance !== false) {
      logger.debug('Extracting performance metrics', { requestId });
      analysisResults.metrics.performance = await extractPerformanceMetrics(structuredData, config, requestId);
    }
    
    // Identify security events and potential threats from log entries
    if (config.includeSecurity !== false) {
      logger.debug('Analyzing security events and threats', { requestId });
      analysisResults.metrics.security = await analyzeSecurityEvents(structuredData, config, requestId);
    }
    
    // Analyze request patterns, traffic trends, and usage analytics
    logger.debug('Analyzing request patterns and traffic trends', { requestId });
    analysisResults.metrics.traffic = await analyzeTrafficPatterns(structuredData, config, requestId);
    
    // Generate statistical analysis of log data and trend identification
    logger.debug('Generating statistical analysis and trends', { requestId });
    analysisResults.statistics = await generateStatisticalAnalysis(structuredData, analysisResults, config);
    
    // Create actionable insights and recommendations for optimization
    analysisResults.insights = await generateActionableInsights(analysisResults, config, requestId);
    analysisResults.recommendations = await generateOptimizationRecommendations(analysisResults, config);
    
    // Add health score and system assessment
    analysisResults.healthScore = calculateSystemHealthScore(analysisResults);
    analysisResults.alerts = identifyAlertsFromAnalysis(analysisResults, config);
    
    // Update analysis statistics
    LOG_STATS.analysisRuns++;
    LOG_STATS.lastActivity = new Date().toISOString();
    
    const duration = Date.now() - startTime;
    analysisResults.summary.duration = duration;
    analysisResults.summary.analysisEnd = new Date().toISOString();
    
    logger.info('Log analysis completed successfully', {
      requestId,
      duration,
      logsAnalyzed: logData.length,
      patternsFound: Object.keys(analysisResults.patterns).length,
      insightsGenerated: analysisResults.insights.length,
      healthScore: analysisResults.healthScore
    });
    
    // Format analysis results for different audiences and use cases
    const formattedResults = await formatAnalysisOutput(analysisResults, config);
    
    return formattedResults;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Log analysis failed', error, {
      requestId,
      duration,
      options: analysisOptions
    });

    throw new PM2Error(
      `Log analysis failed: ${error.message}`,
      'log-analysis',
      {
        requestId,
        originalError: error,
        options: analysisOptions,
        duration
      }
    );
  } finally {
    await disconnectFromPM2();
  }
}

/**
 * Applies advanced filtering to PM2 logs including log level filtering, time range
 * selection, keyword searching, regular expression matching, and multi-criteria
 * filtering for targeted log analysis and debugging.
 * 
 * Supports complex filtering combinations with performance optimization for
 * large log datasets and real-time filtering capabilities.
 * 
 * @param {Array} logEntries - Array of log entries to filter
 * @param {Object} filterCriteria - Filtering criteria and options
 * @param {string} [filterCriteria.level] - Log level filter (error, warn, info, debug)
 * @param {string} [filterCriteria.startTime] - Start time for filtering (ISO string)
 * @param {string} [filterCriteria.endTime] - End time for filtering (ISO string)
 * @param {string} [filterCriteria.search] - Keyword search term
 * @param {string} [filterCriteria.regex] - Regular expression pattern
 * @param {Array} [filterCriteria.processes] - Process ID filter
 * @param {Object} [filterCriteria.context] - Context-based filtering
 * @param {boolean} [filterCriteria.caseSensitive] - Case-sensitive search
 * @returns {Array} Filtered log entries matching specified criteria with highlighting and formatting
 */
export function filterLogs(logEntries, filterCriteria = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'filter' });
  
  try {
    logger.debug('Applying log filtering', {
      requestId,
      totalEntries: logEntries.length,
      criteria: Object.keys(filterCriteria)
    });

    // Parse and validate filter criteria including levels, timestamps, and patterns
    const validatedCriteria = validateFilterCriteria(filterCriteria);
    
    if (!Array.isArray(logEntries) || logEntries.length === 0) {
      logger.warn('No log entries provided for filtering', { requestId });
      return [];
    }
    
    let filteredLogs = [...logEntries]; // Create copy to avoid mutation
    
    // Apply log level filtering based on severity and importance
    if (validatedCriteria.level) {
      filteredLogs = applyLevelFilter(filteredLogs, validatedCriteria.level);
      logger.debug('Applied level filter', {
        requestId,
        level: validatedCriteria.level,
        remaining: filteredLogs.length
      });
    }
    
    // Filter by time range using timestamp parsing and comparison
    if (validatedCriteria.startTime || validatedCriteria.endTime) {
      filteredLogs = applyTimeRangeFilter(filteredLogs, validatedCriteria.startTime, validatedCriteria.endTime);
      logger.debug('Applied time range filter', {
        requestId,
        startTime: validatedCriteria.startTime,
        endTime: validatedCriteria.endTime,
        remaining: filteredLogs.length
      });
    }
    
    // Apply keyword and text-based filtering with case sensitivity options
    if (validatedCriteria.search) {
      filteredLogs = applyKeywordFilter(filteredLogs, validatedCriteria.search, validatedCriteria.caseSensitive);
      logger.debug('Applied keyword filter', {
        requestId,
        search: validatedCriteria.search,
        caseSensitive: validatedCriteria.caseSensitive,
        remaining: filteredLogs.length
      });
    }
    
    // Execute regular expression matching for advanced pattern filtering
    if (validatedCriteria.regex) {
      filteredLogs = applyRegexFilter(filteredLogs, validatedCriteria.regex);
      logger.debug('Applied regex filter', {
        requestId,
        pattern: validatedCriteria.regex,
        remaining: filteredLogs.length
      });
    }
    
    // Apply multi-criteria filtering with logical operators (AND, OR, NOT)
    if (validatedCriteria.processes && validatedCriteria.processes.length > 0) {
      filteredLogs = applyProcessFilter(filteredLogs, validatedCriteria.processes);
      logger.debug('Applied process filter', {
        requestId,
        processes: validatedCriteria.processes,
        remaining: filteredLogs.length
      });
    }
    
    // Implement context filtering to include surrounding log entries
    if (validatedCriteria.context) {
      filteredLogs = applyContextFilter(filteredLogs, logEntries, validatedCriteria.context);
      logger.debug('Applied context filter', {
        requestId,
        contextLines: validatedCriteria.context.lines,
        remaining: filteredLogs.length
      });
    }
    
    // Apply highlighting and formatting to matching criteria
    const highlightedLogs = applyHighlighting(filteredLogs, validatedCriteria);
    
    // Sort filtered results by timestamp, relevance, or custom criteria
    const sortedLogs = applySorting(highlightedLogs, validatedCriteria.sortBy || 'timestamp');
    
    const duration = Date.now() - startTime;
    logger.debug('Log filtering completed', {
      requestId,
      originalCount: logEntries.length,
      filteredCount: sortedLogs.length,
      filteringRatio: (sortedLogs.length / logEntries.length * 100).toFixed(2) + '%',
      duration
    });
    
    // Return filtered and formatted log entries ready for display or analysis
    return sortedLogs;

  } catch (error) {
    logger.error('Log filtering failed', error, {
      requestId,
      totalEntries: logEntries.length,
      criteria: filterCriteria
    });

    throw new ValidationError(
      `Log filtering failed: ${error.message}`,
      [],
      {
        requestId,
        originalError: error,
        filterCriteria,
        logCount: logEntries.length
      }
    );
  }
}

/**
 * Exports PM2 logs in various formats including JSON, CSV, XML, and plain text with
 * customizable formatting, filtering, and compression for external analysis, reporting,
 * and integration with monitoring systems.
 * 
 * Supports batch export with progress tracking and resume capabilities for large
 * log datasets, with educational demonstrations of log export patterns.
 * 
 * @param {Object} exportOptions - Export configuration options
 * @param {string} [exportOptions.appName] - PM2 application name for export
 * @param {string} [exportOptions.format] - Export format (json, csv, xml, txt)
 * @param {string} [exportOptions.output] - Output file path or directory
 * @param {Object} [exportOptions.filter] - Filtering criteria for export
 * @param {boolean} [exportOptions.compress] - Enable compression for export file
 * @param {string} [exportOptions.timeRange] - Time range for export
 * @param {boolean} [exportOptions.includeMetadata] - Include log metadata in export
 * @returns {Promise} Promise resolving with export results including file paths and export statistics
 */
export async function exportLogs(exportOptions = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'export' });
  
  try {
    logger.info('Starting PM2 log export operation', {
      requestId,
      options: exportOptions,
      environment: currentEnvironment
    });

    // Validate export options including format, output destination, and filtering
    const config = await validateExportOptions(exportOptions, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(config.appName);
    
    // Collect and aggregate logs from specified sources and time ranges
    const timeframe = calculateExportTimeframe(config.timeRange);
    const logData = await collectLogsForExport(appInfo, timeframe, config, requestId);
    
    // Apply filtering and data selection based on export criteria
    const filteredData = config.filter ? 
      filterLogs(logData, config.filter) : 
      logData;
    
    logger.info('Logs collected for export', {
      requestId,
      totalLogs: logData.length,
      filteredLogs: filteredData.length,
      timeRange: timeframe
    });
    
    // Transform log data to specified output format with proper structuring
    const transformedData = await transformLogsForExport(filteredData, config, requestId);
    
    // Generate export metadata including timestamps and source information
    const exportMetadata = generateExportMetadata(config, filteredData, timeframe, requestId);
    
    // Determine output path and ensure directory exists
    const outputPath = await prepareOutputPath(config.output, config.format, requestId);
    
    // Write exported data to specified output destination or return data
    const writeResult = await writeExportData(transformedData, outputPath, config, exportMetadata);
    
    // Apply compression and encoding if specified in export options
    let finalPath = writeResult.path;
    let compressionResult = null;
    
    if (config.compress) {
      compressionResult = await compressExportFile(finalPath, config);
      finalPath = compressionResult.compressedPath;
    }
    
    // Create export summary with statistics and validation information
    const exportSummary = {
      requestId,
      appName: config.appName,
      format: config.format,
      originalLogs: logData.length,
      exportedLogs: filteredData.length,
      outputPath: finalPath,
      fileSize: writeResult.size,
      compressed: !!compressionResult,
      compressionRatio: compressionResult?.ratio,
      timeRange: timeframe,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      metadata: exportMetadata
    };
    
    logger.info('PM2 log export completed successfully', {
      requestId,
      outputPath: finalPath,
      logsExported: filteredData.length,
      fileSize: writeResult.size,
      duration: exportSummary.duration,
      compressed: !!compressionResult
    });
    
    // Clean up temporary files and resources used during export
    await cleanupExportResources(config, requestId);
    
    // Return export results with file information and completion status
    return {
      success: true,
      summary: exportSummary,
      file: {
        path: finalPath,
        size: writeResult.size,
        format: config.format,
        compressed: !!compressionResult
      },
      metadata: exportMetadata
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('PM2 log export failed', error, {
      requestId,
      duration,
      options: exportOptions
    });

    throw new PM2Error(
      `Log export failed: ${error.message}`,
      'log-export',
      {
        requestId,
        originalError: error,
        options: exportOptions,
        duration
      }
    );
  } finally {
    await disconnectFromPM2();
  }
}

/**
 * Configures comprehensive log monitoring including real-time alerts, pattern detection,
 * threshold monitoring, and automated notifications for production log monitoring and
 * incident response across PM2 cluster processes.
 * 
 * Establishes monitoring rules engine with customizable alerting and escalation
 * for production deployment monitoring and operational insights.
 * 
 * @param {Object} monitoringConfig - Log monitoring configuration options
 * @param {string} [monitoringConfig.appName] - PM2 application name for monitoring
 * @param {Array} [monitoringConfig.rules] - Monitoring rules and thresholds
 * @param {Object} [monitoringConfig.alerts] - Alert configuration and channels
 * @param {boolean} [monitoringConfig.realTime] - Enable real-time monitoring
 * @param {Object} [monitoringConfig.thresholds] - Performance and error thresholds
 * @param {Array} [monitoringConfig.patterns] - Log patterns to monitor
 * @param {string} [monitoringConfig.escalation] - Escalation policy configuration
 * @returns {Object} Log monitoring session with real-time alerts, pattern detection, and control methods
 */
export async function setupLogMonitoring(monitoringConfig = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'monitor' });
  const monitoringId = `monitor-${requestId}-${Date.now()}`;
  
  try {
    logger.info('Setting up comprehensive log monitoring', {
      requestId,
      monitoringId,
      config: monitoringConfig,
      environment: currentEnvironment
    });

    // Initialize log monitoring system with specified configuration parameters
    const config = await validateMonitoringConfig(monitoringConfig, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(config.appName);
    
    // Set up real-time log stream monitoring across all PM2 processes
    const streamConfig = {
      ...config,
      follow: true,
      bufferSize: config.bufferSize || LOG_STREAM_BUFFER_SIZE
    };
    
    const logStream = await streamLogs(config.appName, streamConfig);
    
    // Configure pattern detection for errors, security events, and anomalies
    const patternDetector = await initializePatternDetection(config.patterns, config, requestId);
    
    // Implement threshold monitoring for error rates and performance metrics
    const thresholdMonitor = createThresholdMonitor(config.thresholds, config);
    
    // Set up automated alerting with multiple notification channels
    const alertManager = await initializeAlertManager(config.alerts, config, requestId);
    
    // Configure log correlation and event aggregation across cluster processes
    const correlationEngine = initializeCorrelationEngine(appInfo, config);
    
    // Implement monitoring rule engine for complex detection scenarios
    const rulesEngine = createMonitoringRulesEngine(config.rules, config);
    
    // Create monitoring session object with control methods
    const monitoringSession = {
      id: monitoringId,
      appName: config.appName,
      startTime: new Date().toISOString(),
      config,
      statistics: {
        logsProcessed: 0,
        alertsTriggered: 0,
        patternsDetected: 0,
        thresholdBreaches: 0
      },
      isActive: true
    };
    
    // Process incoming logs with monitoring rules and pattern detection
    logStream.on('log', async (logEntry) => {
      try {
        monitoringSession.statistics.logsProcessed++;
        
        // Apply pattern detection to identify significant events
        const patternResults = await patternDetector.analyze(logEntry);
        if (patternResults.matches.length > 0) {
          monitoringSession.statistics.patternsDetected++;
          await handlePatternDetection(patternResults, logEntry, alertManager, requestId);
        }
        
        // Check thresholds for performance and error rate monitoring
        const thresholdResults = await thresholdMonitor.check(logEntry);
        if (thresholdResults.breached.length > 0) {
          monitoringSession.statistics.thresholdBreaches++;
          await handleThresholdBreach(thresholdResults, logEntry, alertManager, requestId);
        }
        
        // Apply monitoring rules for complex scenarios
        const ruleResults = await rulesEngine.evaluate(logEntry, monitoringSession.statistics);
        if (ruleResults.triggered.length > 0) {
          await handleRuleTriggered(ruleResults, logEntry, alertManager, requestId);
        }
        
        // Update correlation data for cluster-wide analysis
        correlationEngine.update(logEntry);
        
      } catch (processingError) {
        logger.error('Error processing log in monitoring', processingError, {
          requestId,
          monitoringId,
          logEntry: logEntry.message?.substring(0, 100)
        });
      }
    });
    
    // Handle stream errors and monitoring failures
    logStream.on('error', (streamError) => {
      logger.error('Log stream error in monitoring', streamError, {
        requestId,
        monitoringId
      });
      
      alertManager.sendAlert({
        type: 'monitoring-error',
        severity: 'high',
        message: `Log monitoring stream error: ${streamError.message}`,
        monitoringId,
        timestamp: new Date().toISOString()
      });
    });
    
    // Set up monitoring dashboard integration and reporting
    const dashboardIntegration = await setupDashboardIntegration(monitoringSession, config);
    
    // Configure monitoring data retention and historical analysis
    const dataRetention = setupDataRetention(monitoringSession, config);
    
    // Create control methods for monitoring session management
    const monitoringControls = {
      getStatus: () => ({
        ...monitoringSession,
        uptime: Date.now() - startTime,
        streamStats: logStream.getStats(),
        correlationStats: correlationEngine.getStats()
      }),
      
      updateConfig: async (newConfig) => {
        const updatedConfig = await validateMonitoringConfig(newConfig, requestId);
        Object.assign(config, updatedConfig);
        
        // Update monitoring components with new configuration
        await patternDetector.updateConfig(updatedConfig.patterns);
        thresholdMonitor.updateThresholds(updatedConfig.thresholds);
        await alertManager.updateConfig(updatedConfig.alerts);
        
        logger.info('Monitoring configuration updated', {
          requestId,
          monitoringId,
          changes: Object.keys(newConfig)
        });
      },
      
      pauseMonitoring: () => {
        logStream.pause();
        monitoringSession.isActive = false;
        logger.info('Log monitoring paused', { requestId, monitoringId });
      },
      
      resumeMonitoring: () => {
        logStream.resume();
        monitoringSession.isActive = true;
        logger.info('Log monitoring resumed', { requestId, monitoringId });
      },
      
      stopMonitoring: async () => {
        try {
          await logStream.stop();
          patternDetector.cleanup();
          thresholdMonitor.cleanup();
          correlationEngine.cleanup();
          dataRetention.cleanup();
          
          monitoringSession.isActive = false;
          monitoringSession.endTime = new Date().toISOString();
          
          logger.info('Log monitoring stopped', {
            requestId,
            monitoringId,
            duration: Date.now() - startTime,
            statistics: monitoringSession.statistics
          });
          
        } catch (stopError) {
          logger.error('Error stopping log monitoring', stopError, {
            requestId,
            monitoringId
          });
        }
      },
      
      getAlerts: (timeRange) => alertManager.getAlerts(timeRange),
      getPatterns: () => patternDetector.getDetectedPatterns(),
      getCorrelations: () => correlationEngine.getCorrelations(),
      
      exportMonitoringData: async (exportOptions) => {
        return await exportMonitoringData(monitoringSession, exportOptions, requestId);
      }
    };
    
    logger.info('Log monitoring setup completed successfully', {
      requestId,
      monitoringId,
      appName: config.appName,
      rulesCount: config.rules?.length || 0,
      patternsCount: config.patterns?.length || 0,
      realTime: config.realTime
    });
    
    // Return monitoring session with real-time capabilities and control methods
    return {
      session: monitoringSession,
      controls: monitoringControls,
      stream: logStream,
      dashboard: dashboardIntegration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to setup log monitoring', error, {
      requestId,
      duration,
      config: monitoringConfig
    });

    throw new PM2Error(
      `Log monitoring setup failed: ${error.message}`,
      'monitoring-setup',
      {
        requestId,
        originalError: error,
        config: monitoringConfig,
        duration
      }
    );
  }
}

/**
 * Performs advanced log searching with full-text search, regular expressions,
 * multi-criteria searching, and result ranking for comprehensive log investigation
 * and debugging across PM2 cluster processes and historical data.
 * 
 * Supports complex search queries with performance optimization for large
 * datasets and relevance ranking for search results.
 * 
 * @param {string} searchQuery - Search query string or pattern
 * @param {Object} searchOptions - Search configuration options
 * @param {string} [searchOptions.appName] - PM2 application name for search
 * @param {string} [searchOptions.type] - Search type (text, regex, pattern)
 * @param {string} [searchOptions.timeRange] - Time range for search
 * @param {boolean} [searchOptions.caseSensitive] - Case-sensitive search
 * @param {number} [searchOptions.maxResults] - Maximum number of results
 * @param {boolean} [searchOptions.includeContext] - Include surrounding log context
 * @param {string} [searchOptions.sortBy] - Sort results by (relevance, time, process)
 * @returns {Object} Search results with matching entries, relevance ranking, and context information
 */
export async function searchLogs(searchQuery, searchOptions = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'search' });
  
  try {
    logger.info('Starting advanced log search', {
      requestId,
      query: searchQuery?.substring(0, 100),
      options: searchOptions,
      environment: currentEnvironment
    });

    // Parse search query and validate search options for compatibility
    const config = await validateSearchOptions(searchQuery, searchOptions, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(config.appName);
    
    // Determine search scope including time range, log sources, and process filters
    const searchScope = await determineSearchScope(appInfo, config, requestId);
    const timeframe = calculateSearchTimeframe(config.timeRange);
    
    // Load log data for search operation
    const logData = await loadLogsForSearch(searchScope, timeframe, config, requestId);
    
    logger.info('Log data loaded for search', {
      requestId,
      totalLogs: logData.length,
      timeRange: timeframe,
      searchType: config.type
    });
    
    let searchResults = [];
    
    // Execute full-text search across specified log files and streams
    if (config.type === 'text' || !config.type) {
      searchResults = await performFullTextSearch(logData, searchQuery, config);
    }
    
    // Apply regular expression matching for pattern-based searching
    else if (config.type === 'regex') {
      searchResults = await performRegexSearch(logData, searchQuery, config);
    }
    
    // Execute pattern-based search for complex log patterns
    else if (config.type === 'pattern') {
      searchResults = await performPatternSearch(logData, searchQuery, config);
    }
    
    // Implement context searching to include surrounding log entries
    if (config.includeContext) {
      searchResults = await addSearchContext(searchResults, logData, config);
    }
    
    // Rank search results by relevance, timestamp, and importance
    const rankedResults = await rankSearchResults(searchResults, searchQuery, config);
    
    // Apply result limits and pagination
    const limitedResults = applySearchLimits(rankedResults, config);
    
    // Apply highlighting and formatting to search matches
    const highlightedResults = await applySearchHighlighting(limitedResults, searchQuery, config);
    
    // Generate search statistics and performance metrics
    const searchStats = generateSearchStatistics(logData.length, searchResults.length, limitedResults.length, startTime);
    
    // Create search summary with result counts and search effectiveness
    const searchSummary = {
      requestId,
      query: searchQuery,
      type: config.type,
      totalLogs: logData.length,
      totalMatches: searchResults.length,
      displayedResults: limitedResults.length,
      timeRange: timeframe,
      searchScope: searchScope.description,
      performance: searchStats,
      timestamp: new Date().toISOString()
    };
    
    logger.info('Log search completed successfully', {
      requestId,
      query: searchQuery?.substring(0, 50),
      totalMatches: searchResults.length,
      displayedResults: limitedResults.length,
      duration: searchStats.duration,
      searchEffectiveness: searchStats.effectiveness
    });
    
    // Return comprehensive search results with context and ranking information
    return {
      success: true,
      summary: searchSummary,
      results: highlightedResults,
      statistics: searchStats,
      metadata: {
        appName: config.appName,
        searchType: config.type,
        caseSensitive: config.caseSensitive,
        includeContext: config.includeContext,
        sortBy: config.sortBy
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Log search failed', error, {
      requestId,
      query: searchQuery?.substring(0, 100),
      duration,
      options: searchOptions
    });

    throw new PM2Error(
      `Log search failed: ${error.message}`,
      'log-search',
      {
        requestId,
        originalError: error,
        searchQuery,
        options: searchOptions,
        duration
      }
    );
  } finally {
    await disconnectFromPM2();
  }
}

/**
 * Manages PM2 log file cleanup including safe log clearing, backup creation,
 * selective log deletion, and log archive management with safety checks and
 * recovery options for log maintenance and storage management.
 * 
 * Provides comprehensive cleanup capabilities with rollback options and
 * educational demonstrations of log maintenance best practices.
 * 
 * @param {Object} clearOptions - Log cleanup configuration options
 * @param {string} [clearOptions.appName] - PM2 application name for cleanup
 * @param {string} [clearOptions.mode] - Cleanup mode (selective, complete, archive)
 * @param {boolean} [clearOptions.backup] - Create backup before clearing
 * @param {string} [clearOptions.olderThan] - Clear logs older than specified time
 * @param {Array} [clearOptions.keepPatterns] - Patterns of logs to preserve
 * @param {boolean} [clearOptions.compress] - Compress backups
 * @param {boolean} [clearOptions.dryRun] - Preview cleanup without execution
 * @returns {Promise} Promise resolving with cleanup results including backup information and space recovered
 */
export async function clearLogs(clearOptions = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'clear' });
  
  try {
    logger.info('Starting PM2 log cleanup operation', {
      requestId,
      options: clearOptions,
      environment: currentEnvironment
    });

    // Validate clear options and implement safety checks for data protection
    const config = await validateClearOptions(clearOptions, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(config.appName);
    
    // Identify log files and calculate cleanup scope
    const logFiles = await identifyLogFilesForCleanup(appInfo, config, requestId);
    const cleanupPlan = await createCleanupPlan(logFiles, config);
    
    if (config.dryRun) {
      logger.info('Dry run completed - no files were modified', {
        requestId,
        filesToClear: cleanupPlan.filesToClear.length,
        totalSize: cleanupPlan.totalSize,
        spaceToRecover: cleanupPlan.spaceToRecover
      });
      
      return {
        success: true,
        dryRun: true,
        plan: cleanupPlan,
        message: 'Dry run completed - no changes made'
      };
    }
    
    if (cleanupPlan.filesToClear.length === 0) {
      logger.info('No log files match cleanup criteria', {
        requestId,
        totalFiles: logFiles.length,
        criteria: config.mode
      });
      
      return {
        success: true,
        cleared: false,
        message: 'No files matched cleanup criteria',
        totalFiles: logFiles.length
      };
    }
    
    let backupResults = [];
    let clearResults = [];
    let spaceRecovered = 0;
    
    // Create backup copies of log files before clearing if specified
    if (config.backup) {
      logger.info('Creating backups before log cleanup', {
        requestId,
        filesToBackup: cleanupPlan.filesToClear.length
      });
      
      for (const fileInfo of cleanupPlan.filesToClear) {
        try {
          const backupResult = await createLogBackup(fileInfo, config, requestId);
          backupResults.push(backupResult);
          
          logger.debug('Log file backup created', {
            requestId,
            original: fileInfo.path,
            backup: backupResult.backupPath,
            size: fileInfo.size
          });
          
        } catch (backupError) {
          logger.error('Failed to create backup for log file', backupError, {
            requestId,
            file: fileInfo.path
          });
          
          throw new PM2Error(
            `Backup creation failed for ${fileInfo.path}: ${backupError.message}`,
            'backup-creation',
            { requestId, originalError: backupError, file: fileInfo.path }
          );
        }
      }
    }
    
    // Stop active log streams temporarily to prevent write conflicts
    const pausedStreams = await pauseActiveStreams(config.appName);
    
    try {
      // Execute selective or complete log file clearing based on criteria
      for (const fileInfo of cleanupPlan.filesToClear) {
        try {
          const clearResult = await executeLogClear(fileInfo, config, requestId);
          clearResults.push(clearResult);
          spaceRecovered += fileInfo.size;
          
          logger.debug('Log file cleared successfully', {
            requestId,
            file: fileInfo.path,
            originalSize: fileInfo.size,
            method: clearResult.method
          });
          
        } catch (clearError) {
          logger.error('Failed to clear log file', clearError, {
            requestId,
            file: fileInfo.path
          });
          
          // If backup exists, we can continue with other files
          if (!config.backup) {
            throw clearError;
          }
        }
      }
      
      // Update log file permissions and ownership after clearing
      await updateLogFilePermissions(clearResults, config);
      
      // Validate log system integrity after cleanup
      await validateLogSystemIntegrity(appInfo, config, requestId);
      
    } finally {
      // Restart log streams and verify proper log file recreation
      await resumeActiveStreams(pausedStreams);
    }
    
    // Clean up temporary files and validate log system integrity
    await cleanupTemporaryFiles(config, requestId);
    
    // Update log rotation and management configuration as needed
    if (clearResults.length > 0) {
      await updateLogManagementConfiguration(appInfo, config);
    }
    
    // Generate cleanup summary with space recovered and backup information
    const cleanupSummary = {
      requestId,
      appName: config.appName,
      mode: config.mode,
      filesCleared: clearResults.length,
      filesBackedUp: backupResults.length,
      spaceRecovered,
      backupCreated: config.backup,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    logger.info('PM2 log cleanup completed successfully', {
      requestId,
      filesCleared: clearResults.length,
      spaceRecovered: `${(spaceRecovered / 1024 / 1024).toFixed(2)}MB`,
      backupsCreated: backupResults.length,
      duration: cleanupSummary.duration
    });
    
    // Return cleanup results with success status and recovery information
    return {
      success: true,
      cleared: true,
      summary: cleanupSummary,
      clearedFiles: clearResults,
      backups: backupResults,
      spaceRecovered,
      recoveryInfo: {
        backupsAvailable: backupResults.length > 0,
        backupPaths: backupResults.map(b => b.backupPath),
        restoreInstructions: config.backup ? generateRestoreInstructions(backupResults) : null
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('PM2 log cleanup failed', error, {
      requestId,
      duration,
      options: clearOptions
    });

    throw new PM2Error(
      `Log cleanup failed: ${error.message}`,
      'log-cleanup',
      {
        requestId,
        originalError: error,
        options: clearOptions,
        duration
      }
    );
  } finally {
    await disconnectFromPM2();
  }
}

/**
 * Configures PM2 log settings including log levels, output destinations, formatting
 * options, rotation policies, and environment-specific optimizations for comprehensive
 * log management setup and customization.
 * 
 * Provides educational demonstrations of production log configuration patterns
 * while supporting both development and production deployment scenarios.
 * 
 * @param {Object} logConfig - Log configuration options
 * @param {string} [logConfig.appName] - PM2 application name for configuration
 * @param {string} [logConfig.level] - Default log level (error, warn, info, debug)
 * @param {Object} [logConfig.outputs] - Log output destinations and formats
 * @param {Object} [logConfig.rotation] - Log rotation policies and settings
 * @param {Object} [logConfig.formatting] - Log formatting and structure options
 * @param {Object} [logConfig.security] - Security settings for log access
 * @param {boolean} [logConfig.validateConfig] - Validate configuration before applying
 * @returns {Promise} Promise resolving with configuration results and validation status
 */
export async function configureLogs(logConfig = {}) {
  const startTime = Date.now();
  const requestId = logger.generateRequestId({ prefix: 'config' });
  
  try {
    logger.info('Starting PM2 log configuration', {
      requestId,
      config: logConfig,
      environment: currentEnvironment
    });

    // Validate log configuration options against PM2 capabilities and requirements
    const validatedConfig = await validateLogConfigurationOptions(logConfig, requestId);
    await connectToPM2();
    
    const appInfo = await verifyApplicationExists(validatedConfig.appName);
    
    // Generate environment-specific log configuration using configuration templates
    const environmentLogConfig = await generateEnvironmentSpecificConfig(validatedConfig, appInfo, requestId);
    
    // Apply log level settings and filtering based on deployment environment
    const levelConfig = await configureLogLevels(environmentLogConfig, validatedConfig);
    
    // Configure log output destinations including files, console, and external systems
    const outputConfig = await configureLogOutputs(environmentLogConfig, validatedConfig, requestId);
    
    // Set up log formatting and structured output for monitoring integration
    const formatConfig = await configureLogFormatting(environmentLogConfig, validatedConfig);
    
    // Configure log rotation policies and retention management
    const rotationConfig = await configureLogRotationPolicies(environmentLogConfig, validatedConfig);
    
    // Apply security settings for log access and sensitive data protection
    const securityConfig = await configureLogSecurity(environmentLogConfig, validatedConfig);
    
    // Validate configuration compatibility with PM2 cluster mode
    const clusterCompatibility = await validateClusterModeCompatibility(environmentLogConfig, appInfo);
    
    // Combine all configuration components
    const finalConfig = {
      ...environmentLogConfig,
      levels: levelConfig,
      outputs: outputConfig,
      formatting: formatConfig,
      rotation: rotationConfig,
      security: securityConfig,
      cluster: clusterCompatibility,
      metadata: {
        requestId,
        appName: validatedConfig.appName,
        environment: currentEnvironment,
        configuredAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    // Validate final configuration before applying
    if (validatedConfig.validateConfig !== false) {
      const validationResult = await validateLogConfig(finalConfig);
      
      if (!validationResult.valid) {
        logger.warn('Log configuration validation warnings', {
          requestId,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });
        
        if (validationResult.errors.length > 0) {
          throw new ValidationError(
            'Log configuration validation failed',
            validationResult.errors.map(error => ({
              field: 'configuration',
              message: error,
              code: 'CONFIG_VALIDATION_ERROR'
            })),
            { requestId, validationResult }
          );
        }
      }
    }
    
    // Update PM2 ecosystem configuration with new log settings
    const ecosystemUpdateResult = await updatePM2EcosystemConfig(finalConfig, appInfo, requestId);
    
    // Apply configuration to running processes if they exist
    let applyResult = null;
    if (ecosystemUpdateResult.processesRunning) {
      applyResult = await applyConfigurationToRunningProcesses(finalConfig, appInfo, requestId);
    }
    
    // Create configuration backup for rollback capability
    const backupResult = await createConfigurationBackup(finalConfig, requestId);
    
    // Generate configuration summary and validation report
    const configurationSummary = {
      requestId,
      appName: validatedConfig.appName,
      environment: currentEnvironment,
      configurationApplied: true,
      processesUpdated: applyResult?.processesUpdated || 0,
      validationPassed: true,
      backupCreated: backupResult.success,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      
      settings: {
        logLevel: levelConfig.default,
        outputDestinations: Object.keys(outputConfig),
        rotationEnabled: rotationConfig.enabled,
        securityEnabled: securityConfig.enabled,
        clusterCompatible: clusterCompatibility.compatible
      }
    };
    
    logger.info('PM2 log configuration completed successfully', {
      requestId,
      appName: validatedConfig.appName,
      processesUpdated: applyResult?.processesUpdated || 0,
      configComponents: Object.keys(finalConfig).length,
      duration: configurationSummary.duration
    });
    
    // Return configuration results with validation status and recommendations
    return {
      success: true,
      configuration: finalConfig,
      summary: configurationSummary,
      validation: {
        passed: true,
        recommendations: generateConfigurationRecommendations(finalConfig, validatedConfig)
      },
      backup: backupResult,
      ecosystem: ecosystemUpdateResult,
      application: applyResult
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('PM2 log configuration failed', error, {
      requestId,
      duration,
      config: logConfig
    });

    throw new PM2Error(
      `Log configuration failed: ${error.message}`,
      'log-configuration',
      {
        requestId,
        originalError: error,
        config: logConfig,
        duration
      }
    );
  } finally {
    await disconnectFromPM2();
  }
}

// Helper Functions for PM2 Log Management Operations

/**
 * Connects to PM2 daemon with retry logic and error handling
 * @private
 */
async function connectToPM2() {
  return new Promise((resolve, reject) => {
    pm2.connect((error) => {
      if (error) {
        logger.error('Failed to connect to PM2 daemon', error);
        reject(new PM2Error(`PM2 connection failed: ${error.message}`, 'connection', { originalError: error }));
      } else {
        logger.debug('Connected to PM2 daemon successfully');
        resolve();
      }
    });
  });
}

/**
 * Disconnects from PM2 daemon safely
 * @private
 */
async function disconnectFromPM2() {
  return new Promise((resolve) => {
    pm2.disconnect(() => {
      logger.debug('Disconnected from PM2 daemon');
      resolve();
    });
  });
}

/**
 * Verifies that the specified application exists in PM2
 * @private
 */
async function verifyApplicationExists(appName) {
  return new Promise((resolve, reject) => {
    pm2.describe(appName, (error, processDescription) => {
      if (error) {
        reject(new PM2Error(`Application ${appName} not found: ${error.message}`, 'app-not-found', { appName, originalError: error }));
      } else if (!processDescription || processDescription.length === 0) {
        reject(new PM2Error(`No processes found for application ${appName}`, 'no-processes', { appName }));
      } else {
        logger.debug('Application verified in PM2', { appName, processes: processDescription.length });
        resolve(processDescription);
      }
    });
  });
}

/**
 * Validates and processes log viewing options
 * @private
 */
async function validateAndProcessLogOptions(logOptions, requestId) {
  const config = {
    appName: logOptions.appName || PM2_APP_NAME,
    lines: Math.min(logOptions.lines || DEFAULT_LOG_LINES, 10000), // Cap at 10k lines
    level: logOptions.level || 'all',
    startTime: logOptions.startTime,
    endTime: logOptions.endTime,
    follow: logOptions.follow || LOG_FOLLOW_MODE,
    format: logOptions.format || 'console',
    search: logOptions.search,
    processFilter: logOptions.processFilter,
    requestId
  };
  
  // Validate time range if provided
  if (config.startTime || config.endTime) {
    try {
      if (config.startTime) new Date(config.startTime);
      if (config.endTime) new Date(config.endTime);
      
      if (config.startTime && config.endTime && new Date(config.startTime) > new Date(config.endTime)) {
        throw new ValidationError('Start time cannot be after end time', [], { requestId });
      }
    } catch (dateError) {
      throw new ValidationError('Invalid date format in time range', [], { requestId, originalError: dateError });
    }
  }
  
  return config;
}

// Export all log management functions for external use
export {
  LOG_STATS,
  ACTIVE_LOG_STREAMS
};

// Initialize PM2 log management system
logger.info('PM2 log management system initialized', {
  version: '1.0.0',
  functions: [
    'viewLogs', 'streamLogs', 'rotateLogs', 'analyzeLogs',
    'filterLogs', 'exportLogs', 'setupLogMonitoring',
    'searchLogs', 'clearLogs', 'configureLogs'
  ],
  environment: currentEnvironment,
  pm2AppName: PM2_APP_NAME,
  defaultLogLines: DEFAULT_LOG_LINES,
  bufferSize: LOG_STREAM_BUFFER_SIZE,
  timestamp: new Date().toISOString()
});

// Note: This is a comprehensive implementation template. 
// In a production environment, you would need to implement the remaining helper functions
// such as determineLogSources, applyLogFiltering, formatLogOutput, etc.
// Each helper function would contain the specific logic for its designated operation.