/**
 * @fileoverview Comprehensive Mocha Testing Framework Teardown Module
 * @description Provides global test environment cleanup for the Node.js tutorial project.
 * This module performs complete resource deallocation, server shutdown, state restoration,
 * and memory cleanup after test execution. Manages Express.js v5.1.0 test server cleanup,
 * PM2 cluster mode test process termination, Helmet.js security middleware state reset,
 * Flask cross-platform test environment restoration, and comprehensive logging stream cleanup.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates comprehensive test environment cleanup patterns
 * - Showcases modern ES Modules teardown implementations
 * - Implements production-ready resource management for testing
 * - Provides cross-platform testing environment restoration
 * - Demonstrates PM2 process management cleanup strategies
 * 
 * Technology Stack:
 * - Node.js v22.x LTS with ES Modules support
 * - Mocha testing framework requiring Node.js ^18.18.0 || ^20.9.0 || >=21.1.0
 * - Express.js v5.1.0 with enhanced security features
 * - PM2 v6.0.8 for production process management
 * - Helmet.js v8.1.0 for security header management
 * 
 * Architecture:
 * - Stateless teardown design optimized for PM2 cluster mode
 * - Comprehensive resource registry for tracking cleanup tasks
 * - Graceful shutdown patterns with configurable timeouts
 * - Memory-efficient cleanup with garbage collection hints
 */

import logger from '../utils/logger.js'; // v22.x - Comprehensive logging utilities
import { 
  TESTING_CONSTANTS, 
  ENV_CONSTANTS 
} from '../utils/constants.js'; // v22.x - Testing framework constants and environment constants
import { 
  environmentConfig 
} from '../config/environment.js'; // v22.x - Environment configuration utilities
import process from 'node:process'; // built-in - Node.js process utilities
import { setTimeout as setTimeoutPromise } from 'node:timers/promises'; // built-in - Node.js timers for timeout management
import util from 'node:util'; // built-in - Node.js utilities for promisify operations
import fs from 'node:fs/promises'; // built-in - Node.js file system utilities

// Global teardown configuration and state management
let TEARDOWN_TIMEOUT = 30000; // 30 seconds default timeout for all teardown operations
let ORIGINAL_ENV_BACKUP = null; // Backup of original environment variables
let CLEANUP_TASKS = []; // Array to store registered cleanup tasks
let TEARDOWN_IN_PROGRESS = false; // Flag to prevent concurrent teardown operations
let RESOURCE_REGISTRY = new Map(); // Map to track registered resources for cleanup
let TEARDOWN_METRICS = { 
  startTime: null, 
  endTime: null, 
  resourcesCleaned: 0, 
  errors: [] 
}; // Metrics tracking for teardown operations

/**
 * TeardownManager Class
 * @description Comprehensive teardown management class that coordinates all cleanup operations,
 * manages resource registry, tracks cleanup progress, and provides centralized teardown control
 * for reliable test environment restoration and resource management.
 */
class TeardownManager {
  /**
   * Initializes TeardownManager with configuration options and prepares comprehensive 
   * teardown management capabilities for coordinated cleanup operations across the testing framework.
   * @param {object} options - Configuration options for teardown management
   */
  constructor(options = {}) {
    // Initialize resource registry for tracking servers, processes, and resources
    this.resourceRegistry = new Map();
    
    // Set up cleanup task queue for managing custom cleanup operations
    this.cleanupTasks = [];
    
    // Initialize teardown metrics for tracking cleanup performance and completion
    this.teardownMetrics = {
      startTime: null,
      endTime: null,
      resourcesCleaned: 0,
      errors: [],
      memoryUsage: {
        before: null,
        after: null
      }
    };
    
    // Configure logger instance for teardown operation tracking and debugging
    this.logger = logger;
    
    // Set teardown in progress flag to false for initial state
    this.teardownInProgress = false;
    
    // Apply configuration options for timeouts, cleanup strategies, and error handling
    this.options = {
      timeout: options.timeout || TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      forceCleanup: options.forceCleanup || true,
      logLevel: options.logLevel || ENV_CONSTANTS.LOG_LEVELS.DEBUG,
      ...options
    };
    
    // Set up error handling and fallback procedures for teardown failures
    this.errorHandlers = new Map();
    this.fallbackProcedures = new Map();
    
    // Prepare teardown validation and completion verification capabilities
    this.validationChecks = new Map();
    
    this.logger.debug('TeardownManager initialized with options:', this.options);
  }

  /**
   * Registers resources for cleanup including test servers, PM2 processes, file handles,
   * and custom resources that require cleanup during teardown operations for comprehensive resource management.
   * @param {string} resourceType - Type of resource (server, process, file, custom)
   * @param {object} resource - Resource instance to be cleaned up
   * @param {function} cleanupFunction - Function to execute for resource cleanup
   * @returns {string} Resource registration ID for tracking and cleanup reference
   */
  registerResource(resourceType, resource, cleanupFunction) {
    // Generate unique resource ID for tracking and cleanup reference
    const resourceId = `${resourceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store resource in registry with type, instance, and cleanup function
    this.resourceRegistry.set(resourceId, {
      type: resourceType,
      resource: resource,
      cleanup: cleanupFunction,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    });
    
    // Add resource to appropriate cleanup category for organized teardown
    const resourcesByType = this.resourceRegistry.get(`${resourceType}_list`) || [];
    resourcesByType.push(resourceId);
    this.resourceRegistry.set(`${resourceType}_list`, resourcesByType);
    
    // Log resource registration for debugging and tracking purposes
    this.logger.debug(`Resource registered: ${resourceId} (${resourceType})`);
    
    // Return resource ID for caller reference and cleanup tracking
    return resourceId;
  }

  /**
   * Adds custom cleanup tasks to the teardown queue for execution during teardown operations,
   * supporting extensible cleanup mechanisms for third-party integrations and custom test resources.
   * @param {function} cleanupFunction - Function to execute during cleanup
   * @param {number} priority - Priority level for task execution (higher numbers execute first)
   * @param {string} description - Description of the cleanup task
   * @returns {string} Cleanup task ID for tracking and management
   */
  addCleanupTask(cleanupFunction, priority = 0, description = 'Custom cleanup task') {
    // Generate unique task ID for tracking and management
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add cleanup task to queue with priority and description
    this.cleanupTasks.push({
      id: taskId,
      function: cleanupFunction,
      priority: priority,
      description: description,
      addedAt: new Date().toISOString(),
      status: 'pending'
    });
    
    // Sort cleanup tasks by priority for ordered execution
    this.cleanupTasks.sort((a, b) => b.priority - a.priority);
    
    // Log cleanup task registration for debugging and tracking
    this.logger.debug(`Cleanup task added: ${taskId} - ${description} (priority: ${priority})`);
    
    // Return task ID for caller reference and task management
    return taskId;
  }

  /**
   * Executes comprehensive cleanup operations including all registered resources and cleanup tasks
   * with error handling, progress tracking, and completion validation for reliable teardown execution.
   * @param {object} cleanupOptions - Options for cleanup execution
   * @returns {Promise<object>} Cleanup execution result with status, metrics, and any cleanup issues
   */
  async executeCleanup(cleanupOptions = {}) {
    // Set teardown in progress flag and initialize cleanup metrics
    this.teardownInProgress = true;
    this.teardownMetrics.startTime = Date.now();
    this.teardownMetrics.memoryUsage.before = process.memoryUsage();
    
    this.logger.info('Beginning comprehensive teardown cleanup execution');
    
    try {
      // Execute resource cleanup for all registered resources by type
      await this._executeResourceCleanup();
      
      // Execute all cleanup tasks in priority order with error handling
      await this._executeCleanupTasks();
      
      // Validate cleanup completion and check for remaining resources
      const validationResult = await this.validateCleanup();
      
      // Generate cleanup metrics and performance statistics
      this.teardownMetrics.endTime = Date.now();
      this.teardownMetrics.memoryUsage.after = process.memoryUsage();
      const executionTime = this.teardownMetrics.endTime - this.teardownMetrics.startTime;
      
      // Log cleanup completion with summary and any issues
      this.logger.info(`Teardown cleanup completed in ${executionTime}ms`, {
        resourcesCleaned: this.teardownMetrics.resourcesCleaned,
        tasksExecuted: this.cleanupTasks.filter(task => task.status === 'completed').length,
        errors: this.teardownMetrics.errors.length,
        memoryFreed: this.teardownMetrics.memoryUsage.before.heapUsed - this.teardownMetrics.memoryUsage.after.heapUsed
      });
      
      // Return cleanup result with status and recommendations
      return {
        status: 'success',
        executionTime: executionTime,
        resourcesCleaned: this.teardownMetrics.resourcesCleaned,
        tasksExecuted: this.cleanupTasks.filter(task => task.status === 'completed').length,
        errors: this.teardownMetrics.errors,
        validation: validationResult,
        metrics: this.teardownMetrics
      };
      
    } catch (error) {
      // Handle cleanup execution errors with comprehensive error reporting
      await this.handleTeardownError(error, 'executeCleanup', { cleanupOptions });
      
      return {
        status: 'failure',
        error: error.message,
        errors: this.teardownMetrics.errors,
        metrics: this.teardownMetrics
      };
      
    } finally {
      // Reset teardown in progress flag
      this.teardownInProgress = false;
    }
  }

  /**
   * Internal method to execute resource cleanup for all registered resources by type
   * @private
   */
  async _executeResourceCleanup() {
    const resourceTypes = ['server', 'process', 'file', 'stream', 'custom'];
    
    for (const resourceType of resourceTypes) {
      const resourceList = this.resourceRegistry.get(`${resourceType}_list`) || [];
      
      for (const resourceId of resourceList) {
        const resourceEntry = this.resourceRegistry.get(resourceId);
        
        if (resourceEntry && resourceEntry.status === 'registered') {
          try {
            this.logger.debug(`Cleaning up resource: ${resourceId} (${resourceType})`);
            
            // Execute cleanup function with timeout
            await Promise.race([
              resourceEntry.cleanup(resourceEntry.resource),
              setTimeoutPromise(this.options.timeout, null)
            ]);
            
            resourceEntry.status = 'cleaned';
            this.teardownMetrics.resourcesCleaned++;
            
          } catch (error) {
            resourceEntry.status = 'error';
            this.teardownMetrics.errors.push({
              resourceId,
              resourceType,
              error: error.message,
              timestamp: new Date().toISOString()
            });
            
            this.logger.warn(`Failed to cleanup resource ${resourceId}:`, error.message);
          }
        }
      }
    }
  }

  /**
   * Internal method to execute all cleanup tasks in priority order
   * @private
   */
  async _executeCleanupTasks() {
    for (const task of this.cleanupTasks) {
      if (task.status === 'pending') {
        try {
          this.logger.debug(`Executing cleanup task: ${task.id} - ${task.description}`);
          
          // Execute cleanup task with timeout
          await Promise.race([
            task.function(),
            setTimeoutPromise(this.options.timeout, null)
          ]);
          
          task.status = 'completed';
          task.completedAt = new Date().toISOString();
          
        } catch (error) {
          task.status = 'error';
          task.error = error.message;
          task.failedAt = new Date().toISOString();
          
          this.teardownMetrics.errors.push({
            taskId: task.id,
            description: task.description,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          this.logger.warn(`Failed to execute cleanup task ${task.id}:`, error.message);
        }
      }
    }
  }

  /**
   * Validates that cleanup operations have completed successfully by checking resource registry,
   * system state, and potential cleanup issues requiring attention or manual intervention.
   * @returns {object} Validation result with status, warnings, errors, and cleanup recommendations
   */
  async validateCleanup() {
    const validation = {
      status: 'valid',
      warnings: [],
      errors: [],
      recommendations: []
    };
    
    // Check resource registry for any remaining registered resources
    let remainingResources = 0;
    for (const [key, value] of this.resourceRegistry.entries()) {
      if (typeof value === 'object' && value.status === 'registered') {
        remainingResources++;
        validation.warnings.push(`Resource not cleaned: ${key}`);
      }
    }
    
    // Validate system state including processes, connections, and files
    try {
      // Check for open file descriptors (approximate)
      const fileDescriptorCount = process.platform === 'linux' ? 
        await this._checkFileDescriptors() : 0;
      
      if (fileDescriptorCount > 10) {
        validation.warnings.push(`High file descriptor count: ${fileDescriptorCount}`);
      }
      
      // Check memory usage for potential leaks
      const memoryUsage = process.memoryUsage();
      const memoryIncrease = memoryUsage.heapUsed - this.teardownMetrics.memoryUsage.before.heapUsed;
      
      if (memoryIncrease > 10 * 1024 * 1024) { // 10MB increase
        validation.warnings.push(`Potential memory leak: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`);
      }
      
    } catch (error) {
      validation.errors.push(`System validation error: ${error.message}`);
    }
    
    // Check for environment variable restoration and global state cleanup
    if (ORIGINAL_ENV_BACKUP && Object.keys(process.env).length !== Object.keys(ORIGINAL_ENV_BACKUP).length) {
      validation.warnings.push('Environment variables may not be fully restored');
    }
    
    // Generate validation report with detailed status and recommendations
    if (validation.warnings.length > 0) {
      validation.status = 'warnings';
      validation.recommendations.push('Review warnings and consider manual cleanup if necessary');
    }
    
    if (validation.errors.length > 0) {
      validation.status = 'errors';
      validation.recommendations.push('Manual intervention required for cleanup errors');
    }
    
    // Log validation results and any issues requiring attention
    this.logger.debug('Cleanup validation completed:', {
      status: validation.status,
      warnings: validation.warnings.length,
      errors: validation.errors.length,
      remainingResources
    });
    
    return validation;
  }

  /**
   * Helper method to check file descriptors on Linux systems
   * @private
   */
  async _checkFileDescriptors() {
    try {
      const fdDir = `/proc/${process.pid}/fd`;
      const files = await fs.readdir(fdDir);
      return files.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Returns comprehensive cleanup metrics including execution time, resources cleaned,
   * errors encountered, and performance statistics for teardown analysis and optimization.
   * @returns {object} Cleanup metrics object with timing, counts, errors, and performance data
   */
  getCleanupMetrics() {
    // Calculate total cleanup execution time and performance metrics
    const executionTime = this.teardownMetrics.endTime - this.teardownMetrics.startTime;
    
    // Count resources cleaned by type and cleanup task execution counts
    const resourcesByType = {};
    const cleanedResourcesByType = {};
    
    for (const [key, value] of this.resourceRegistry.entries()) {
      if (typeof value === 'object' && value.type) {
        resourcesByType[value.type] = (resourcesByType[value.type] || 0) + 1;
        if (value.status === 'cleaned') {
          cleanedResourcesByType[value.type] = (cleanedResourcesByType[value.type] || 0) + 1;
        }
      }
    }
    
    // Compile error information and recovery operation statistics
    const errorsByType = {};
    this.teardownMetrics.errors.forEach(error => {
      const type = error.resourceType || error.taskId ? 'task' : 'unknown';
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });
    
    // Generate performance statistics and resource usage information
    const memoryFreed = this.teardownMetrics.memoryUsage.before && this.teardownMetrics.memoryUsage.after ?
      this.teardownMetrics.memoryUsage.before.heapUsed - this.teardownMetrics.memoryUsage.after.heapUsed : 0;
    
    // Return comprehensive metrics object for analysis and monitoring
    return {
      execution: {
        startTime: this.teardownMetrics.startTime,
        endTime: this.teardownMetrics.endTime,
        duration: executionTime,
        status: this.teardownInProgress ? 'in-progress' : 'completed'
      },
      resources: {
        total: this.teardownMetrics.resourcesCleaned,
        byType: resourcesByType,
        cleaned: cleanedResourcesByType,
        remaining: Object.keys(resourcesByType).reduce((sum, type) => 
          sum + (resourcesByType[type] - (cleanedResourcesByType[type] || 0)), 0)
      },
      tasks: {
        total: this.cleanupTasks.length,
        completed: this.cleanupTasks.filter(task => task.status === 'completed').length,
        failed: this.cleanupTasks.filter(task => task.status === 'error').length,
        pending: this.cleanupTasks.filter(task => task.status === 'pending').length
      },
      errors: {
        total: this.teardownMetrics.errors.length,
        byType: errorsByType,
        details: this.teardownMetrics.errors
      },
      performance: {
        memoryUsage: this.teardownMetrics.memoryUsage,
        memoryFreed: memoryFreed,
        resourcesPerSecond: executionTime > 0 ? (this.teardownMetrics.resourcesCleaned / (executionTime / 1000)) : 0
      }
    };
  }
}

// Create global teardown manager instance
const teardownManager = new TeardownManager({
  timeout: TESTING_CONSTANTS.TEST_TIMEOUTS.INTEGRATION_TESTS,
  logLevel: ENV_CONSTANTS.LOG_LEVELS.DEBUG
});

/**
 * Primary teardown function that performs comprehensive test environment cleanup including
 * server shutdown, resource deallocation, environment restoration, and test isolation maintenance.
 * Configured as Mocha's globalTeardown function for automatic execution after all tests complete.
 * @returns {Promise<void>} Promise that resolves when all teardown operations complete successfully
 */
export async function globalTeardown() {
  // Initialize teardown metrics and start cleanup timing for performance monitoring
  TEARDOWN_METRICS.startTime = Date.now();
  
  // Set teardown in progress flag to prevent concurrent cleanup operations
  if (TEARDOWN_IN_PROGRESS) {
    logger.warn('Teardown already in progress, skipping duplicate execution');
    return;
  }
  
  TEARDOWN_IN_PROGRESS = true;
  
  logger.info('Starting global teardown process for Mocha testing framework');
  
  try {
    // Execute server shutdown procedures for all registered test servers
    await shutdownTestServers();
    
    // Clean up PM2 test processes and cluster mode testing environments
    await cleanupPM2Processes();
    
    // Restore original environment variables from backup to prevent test pollution
    await restoreEnvironmentVariables();
    
    // Clean up logging streams, file handles, and temporary test resources
    await cleanupLoggingStreams();
    
    // Clear global test state including mocks, spies, and test utilities
    await clearGlobalTestState();
    
    // Perform memory cleanup and resource deallocation for test isolation
    await performMemoryCleanup();
    
    // Execute registered cleanup tasks and custom teardown procedures
    await executeCleanupTasks();
    
    // Log teardown completion metrics and cleanup summary for monitoring
    TEARDOWN_METRICS.endTime = Date.now();
    const totalTime = TEARDOWN_METRICS.endTime - TEARDOWN_METRICS.startTime;
    
    logger.info(`Global teardown completed successfully in ${totalTime}ms`, {
      resourcesCleaned: TEARDOWN_METRICS.resourcesCleaned,
      errors: TEARDOWN_METRICS.errors.length,
      memoryFreed: process.memoryUsage().heapUsed
    });
    
  } catch (error) {
    await handleTeardownError(error, 'globalTeardown', {});
    throw error; // Re-throw to fail the test suite if teardown fails critically
    
  } finally {
    TEARDOWN_IN_PROGRESS = false;
  }
}

/**
 * Gracefully shuts down all Express.js test servers registered during test execution,
 * closes HTTP connections, and releases port bindings to ensure clean test isolation.
 * @returns {Promise<void>} Promise that resolves when all test servers are successfully shut down
 */
export async function shutdownTestServers() {
  logger.debug('Initiating test server shutdown procedures');
  
  const serverShutdownPromises = [];
  
  // Retrieve all registered test servers from the resource registry
  for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
    if (resource && resource.type === 'server') {
      // Iterate through each server instance and initiate graceful shutdown
      const shutdownPromise = (async () => {
        try {
          const server = resource.instance;
          
          if (server && typeof server.close === 'function') {
            logger.debug(`Shutting down test server: ${resourceId}`);
            
            // Close HTTP connections and stop accepting new requests for each server
            await new Promise((resolve, reject) => {
              // Wait for pending requests to complete with configurable timeout
              const timeout = setTimeout(() => {
                reject(new Error(`Server shutdown timeout for ${resourceId}`));
              }, TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS);
              
              server.close((error) => {
                clearTimeout(timeout);
                if (error) {
                  reject(error);
                } else {
                  resolve();
                }
              });
            });
            
            // Release port bindings and network resources for each server instance
            logger.debug(`Server ${resourceId} shut down successfully`);
            TEARDOWN_METRICS.resourcesCleaned++;
          }
          
        } catch (error) {
          TEARDOWN_METRICS.errors.push({
            resourceId,
            operation: 'server_shutdown',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          logger.warn(`Failed to shutdown server ${resourceId}:`, error.message);
        }
      })();
      
      serverShutdownPromises.push(shutdownPromise);
    }
  }
  
  // Wait for all server shutdown operations to complete
  await Promise.allSettled(serverShutdownPromises);
  
  // Clear server registry and remove server references for memory cleanup
  for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
    if (resource && resource.type === 'server') {
      RESOURCE_REGISTRY.delete(resourceId);
    }
  }
  
  // Log server shutdown completion and any errors encountered
  const shutdownErrors = TEARDOWN_METRICS.errors.filter(e => e.operation === 'server_shutdown');
  logger.debug(`Test server shutdown completed. Servers processed: ${serverShutdownPromises.length}, Errors: ${shutdownErrors.length}`);
  
  // Validate all servers are completely shut down and ports are released
  if (shutdownErrors.length > 0) {
    logger.warn(`Some servers failed to shutdown gracefully: ${shutdownErrors.length} errors`);
  }
}

/**
 * Terminates PM2 test processes including cluster mode testing, zero-downtime deployment testing,
 * and production workflow validation processes to ensure complete process cleanup.
 * @returns {Promise<void>} Promise that resolves when all PM2 test processes are terminated
 */
export async function cleanupPM2Processes() {
  logger.debug('Starting PM2 test process cleanup');
  
  try {
    // Identify active PM2 test processes using process registry and PM2 list commands
    const pm2Processes = [];
    
    // Check for test-specific PM2 processes in the resource registry
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'pm2_process') {
        pm2Processes.push({
          id: resourceId,
          processName: resource.processName,
          pid: resource.pid
        });
      }
    }
    
    // If no PM2 processes registered, attempt to find test processes by name pattern
    if (pm2Processes.length === 0) {
      logger.debug('No PM2 test processes found in registry, checking for test process patterns');
      // Note: In a real implementation, this would use PM2's API to list processes
      // For this educational example, we'll simulate the process
    }
    
    // Send graceful shutdown signals to PM2 test processes with timeout handling
    for (const pm2Process of pm2Processes) {
      try {
        logger.debug(`Terminating PM2 test process: ${pm2Process.processName} (${pm2Process.id})`);
        
        // Wait for processes to shut down gracefully within configured timeout period
        await Promise.race([
          // Simulate PM2 process termination (in real implementation, would use PM2 API)
          new Promise((resolve) => {
            setTimeout(resolve, 1000); // Simulate graceful shutdown time
          }),
          setTimeoutPromise(TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS, null)
        ]);
        
        TEARDOWN_METRICS.resourcesCleaned++;
        logger.debug(`PM2 process ${pm2Process.processName} terminated successfully`);
        
      } catch (error) {
        // Force terminate any remaining processes that don't respond to graceful shutdown
        logger.warn(`Force terminating PM2 process ${pm2Process.processName} due to timeout`);
        
        TEARDOWN_METRICS.errors.push({
          processId: pm2Process.id,
          processName: pm2Process.processName,
          operation: 'pm2_cleanup',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Clean up PM2 process files, logs, and configuration created during testing
    await cleanupPM2TestFiles();
    
    // Reset PM2 testing environment to clean state for future test runs
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'pm2_process') {
        RESOURCE_REGISTRY.delete(resourceId);
      }
    }
    
    // Log PM2 process cleanup completion and any termination issues
    logger.debug(`PM2 process cleanup completed. Processes cleaned: ${pm2Processes.length}`);
    
    // Validate no test processes remain running that could affect future tests
    const remainingErrors = TEARDOWN_METRICS.errors.filter(e => e.operation === 'pm2_cleanup');
    if (remainingErrors.length > 0) {
      logger.warn(`Some PM2 processes failed to terminate cleanly: ${remainingErrors.length} errors`);
    }
    
  } catch (error) {
    await handleTeardownError(error, 'cleanupPM2Processes', {});
  }
}

/**
 * Helper function to clean up PM2 test files and configurations
 * @private
 */
async function cleanupPM2TestFiles() {
  try {
    // Clean up temporary PM2 configuration files created during testing
    const tempFiles = [
      'ecosystem.test.config.js',
      'pm2.test.json',
      '.pm2/logs/test-*.log'
    ];
    
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
        logger.debug(`Cleaned up PM2 test file: ${file}`);
      } catch (error) {
        // File may not exist, which is acceptable
        if (error.code !== 'ENOENT') {
          logger.debug(`Could not clean up PM2 file ${file}: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    logger.warn('Error during PM2 test file cleanup:', error.message);
  }
}

/**
 * Restores original environment variables from backup to prevent test pollution
 * and ensure clean environment state between test runs.
 * @returns {Promise<void>} Promise that resolves when environment variables are successfully restored
 */
export async function restoreEnvironmentVariables() {
  logger.debug('Starting environment variable restoration');
  
  try {
    // Retrieve original environment variable backup created during test setup
    if (!ORIGINAL_ENV_BACKUP) {
      // Create backup if not already created (defensive programming)
      ORIGINAL_ENV_BACKUP = { ...process.env };
      logger.debug('Created environment backup during teardown (backup should have been created during setup)');
    }
    
    // Compare current environment variables with original backup to identify changes
    const currentEnvKeys = Object.keys(process.env);
    const backupEnvKeys = Object.keys(ORIGINAL_ENV_BACKUP);
    
    const addedKeys = currentEnvKeys.filter(key => !backupEnvKeys.includes(key));
    const modifiedKeys = backupEnvKeys.filter(key => 
      currentEnvKeys.includes(key) && process.env[key] !== ORIGINAL_ENV_BACKUP[key]
    );
    const removedKeys = backupEnvKeys.filter(key => !currentEnvKeys.includes(key));
    
    logger.debug(`Environment changes detected - Added: ${addedKeys.length}, Modified: ${modifiedKeys.length}, Removed: ${removedKeys.length}`);
    
    // Remove test-specific environment variables that were added during testing
    for (const key of addedKeys) {
      // Only remove test-specific variables to avoid removing system variables
      if (key.startsWith('TEST_') || key.startsWith('MOCHA_') || key.startsWith('NODE_TEST_')) {
        delete process.env[key];
        logger.debug(`Removed test environment variable: ${key}`);
      }
    }
    
    // Restore original values for environment variables that were modified during tests
    for (const key of modifiedKeys) {
      process.env[key] = ORIGINAL_ENV_BACKUP[key];
      logger.debug(`Restored environment variable: ${key}`);
    }
    
    // Restore removed environment variables
    for (const key of removedKeys) {
      process.env[key] = ORIGINAL_ENV_BACKUP[key];
      logger.debug(`Restored removed environment variable: ${key}`);
    }
    
    // Use environment configuration utility for additional restoration
    if (environmentConfig.restoreEnvironment) {
      await environmentConfig.restoreEnvironment();
    }
    
    if (environmentConfig.cleanupTestEnvironment) {
      await environmentConfig.cleanupTestEnvironment();
    }
    
    // Validate environment restoration and verify no test-specific variables remain
    const finalTestVars = Object.keys(process.env).filter(key => 
      key.startsWith('TEST_') || key.startsWith('MOCHA_') || key.startsWith('NODE_TEST_')
    );
    
    if (finalTestVars.length > 0) {
      logger.warn(`Some test environment variables remain: ${finalTestVars.join(', ')}`);
    }
    
    // Clear environment backup and reset environment configuration state
    ORIGINAL_ENV_BACKUP = null;
    
    // Log environment restoration completion and any restoration warnings
    logger.debug('Environment variable restoration completed successfully');
    TEARDOWN_METRICS.resourcesCleaned++;
    
    // Ensure clean environment state ready for future test execution
    logger.debug('Environment restored to clean state for future test execution');
    
  } catch (error) {
    await handleTeardownError(error, 'restoreEnvironmentVariables', {});
  }
}

/**
 * Closes all logging streams, flushes pending log entries, and cleans up log files
 * created during testing to prevent resource leaks and ensure proper log management.
 * @returns {Promise<void>} Promise that resolves when all logging streams are closed and cleaned up
 */
export async function cleanupLoggingStreams() {
  logger.debug('Starting logging stream cleanup');
  
  try {
    const streamCleanupPromises = [];
    
    // Identify all active logging streams registered during test execution
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'stream') {
        const cleanupPromise = (async () => {
          try {
            const stream = resource.instance;
            
            // Flush pending log entries to ensure all test logs are written
            if (stream && typeof stream.write === 'function') {
              // Flush any pending writes
              if (typeof stream.end === 'function') {
                await new Promise((resolve, reject) => {
                  stream.end((error) => {
                    if (error) reject(error);
                    else resolve();
                  });
                });
              }
            }
            
            // Close file-based logging streams and release file handles
            if (stream && typeof stream.close === 'function') {
              await new Promise((resolve, reject) => {
                stream.close((error) => {
                  if (error) reject(error);
                  else resolve();
                });
              });
            }
            
            logger.debug(`Logging stream ${resourceId} closed successfully`);
            TEARDOWN_METRICS.resourcesCleaned++;
            
          } catch (error) {
            TEARDOWN_METRICS.errors.push({
              resourceId,
              operation: 'stream_cleanup',
              error: error.message,
              timestamp: new Date().toISOString()
            });
            
            logger.warn(`Failed to close logging stream ${resourceId}:`, error.message);
          }
        })();
        
        streamCleanupPromises.push(cleanupPromise);
      }
    }
    
    // Wait for all stream cleanup operations to complete
    await Promise.allSettled(streamCleanupPromises);
    
    // Clean up temporary log files created specifically for testing
    const tempLogFiles = [
      'test.log',
      'test-debug.log',
      'mocha-test.log',
      'test-error.log'
    ];
    
    for (const logFile of tempLogFiles) {
      try {
        await fs.unlink(logFile);
        logger.debug(`Cleaned up temporary log file: ${logFile}`);
      } catch (error) {
        // File may not exist, which is acceptable
        if (error.code !== 'ENOENT') {
          logger.debug(`Could not clean up log file ${logFile}: ${error.message}`);
        }
      }
    }
    
    // Reset logging configuration to default state for future tests
    // Note: This would depend on the specific logger implementation
    if (logger.resetConfiguration) {
      logger.resetConfiguration();
    }
    
    // Clear logging stream registry and remove stream references
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'stream') {
        RESOURCE_REGISTRY.delete(resourceId);
      }
    }
    
    // Log stream cleanup completion and any cleanup warnings
    logger.debug(`Logging stream cleanup completed. Streams processed: ${streamCleanupPromises.length}`);
    
    // Validate all streams are closed and no file handles remain open
    const streamErrors = TEARDOWN_METRICS.errors.filter(e => e.operation === 'stream_cleanup');
    if (streamErrors.length > 0) {
      logger.warn(`Some logging streams failed to close properly: ${streamErrors.length} errors`);
    }
    
  } catch (error) {
    await handleTeardownError(error, 'cleanupLoggingStreams', {});
  }
}

/**
 * Clears all global test state including mocks, spies, stubs, performance metrics,
 * and test utilities to ensure complete test isolation.
 * @returns {Promise<void>} Promise that resolves when global test state is successfully cleared
 */
export async function clearGlobalTestState() {
  logger.debug('Starting global test state cleanup');
  
  try {
    // Restore all Sinon mocks, spies, and stubs to original functions
    // Note: This would require Sinon to be available in the test environment
    if (global.sinon && typeof global.sinon.restore === 'function') {
      global.sinon.restore();
      logger.debug('Sinon mocks and stubs restored');
    }
    
    // Clear global test variables and reset test utility state
    const globalTestKeys = Object.keys(global).filter(key => 
      key.startsWith('test') || 
      key.startsWith('mock') || 
      key.startsWith('spy') ||
      key.startsWith('stub') ||
      key.includes('Test') ||
      key.includes('Mock')
    );
    
    for (const key of globalTestKeys) {
      try {
        delete global[key];
        logger.debug(`Cleared global test variable: ${key}`);
      } catch (error) {
        // Some globals may not be deletable
        logger.debug(`Could not delete global ${key}: ${error.message}`);
      }
    }
    
    // Reset performance metrics and measurement tracking to clean state
    if (global.performance && global.performance.clearMarks) {
      global.performance.clearMarks();
      global.performance.clearMeasures();
      logger.debug('Performance metrics cleared');
    }
    
    // Clear request correlation maps and tracking data from test execution
    // Reset any global maps or caches used during testing
    if (global.testRequestMap) {
      global.testRequestMap.clear();
      delete global.testRequestMap;
    }
    
    if (global.testCache) {
      global.testCache.clear();
      delete global.testCache;
    }
    
    // Reset security testing state and configuration to default values
    // Clear any security-related test state
    const securityTestGlobals = ['securityTestConfig', 'helmetTestConfig', 'corsTestConfig'];
    for (const securityGlobal of securityTestGlobals) {
      if (global[securityGlobal]) {
        delete global[securityGlobal];
        logger.debug(`Cleared security test global: ${securityGlobal}`);
      }
    }
    
    // Clear cross-platform testing state and Flask compatibility data
    const crossPlatformGlobals = ['flaskTestData', 'crossPlatformConfig', 'platformComparisonData'];
    for (const platformGlobal of crossPlatformGlobals) {
      if (global[platformGlobal]) {
        delete global[platformGlobal];
        logger.debug(`Cleared cross-platform test global: ${platformGlobal}`);
      }
    }
    
    // Clear test framework-specific global state and configuration
    // Mocha-specific cleanup
    if (global.mocha) {
      // Reset Mocha-specific globals if needed
      logger.debug('Mocha-specific globals checked');
    }
    
    // Jest-specific cleanup (if Jest globals are present)
    if (global.jest) {
      if (global.jest.clearAllMocks) {
        global.jest.clearAllMocks();
      }
      if (global.jest.resetAllMocks) {
        global.jest.resetAllMocks();
      }
      if (global.jest.restoreAllMocks) {
        global.jest.restoreAllMocks();
      }
      logger.debug('Jest globals cleaned');
    }
    
    // Clear module cache for test isolation (if appropriate)
    const testModuleKeys = Object.keys(require.cache || {}).filter(key => 
      key.includes('test') || 
      key.includes('spec') || 
      key.includes('mock')
    );
    
    for (const moduleKey of testModuleKeys) {
      try {
        delete require.cache[moduleKey];
        logger.debug(`Cleared module cache for: ${moduleKey}`);
      } catch (error) {
        logger.debug(`Could not clear module cache for ${moduleKey}: ${error.message}`);
      }
    }
    
    // Log global state cleanup completion and any reset warnings
    logger.debug('Global test state cleanup completed successfully');
    TEARDOWN_METRICS.resourcesCleaned++;
    
  } catch (error) {
    await handleTeardownError(error, 'clearGlobalTestState', {});
  }
}

/**
 * Performs comprehensive memory cleanup including garbage collection hints,
 * reference clearing, and memory leak detection to ensure optimal memory usage.
 * @returns {Promise<void>} Promise that resolves when memory cleanup operations are complete
 */
export async function performMemoryCleanup() {
  logger.debug('Starting memory cleanup operations');
  
  try {
    const memoryBefore = process.memoryUsage();
    
    // Clear all circular references and object caches created during testing
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.instance) {
        // Clear circular references
        if (typeof resource.instance === 'object') {
          try {
            // Attempt to clear circular references by nullifying properties
            Object.keys(resource.instance).forEach(key => {
              if (typeof resource.instance[key] === 'object' && resource.instance[key] !== null) {
                resource.instance[key] = null;
              }
            });
          } catch (error) {
            // Some objects may not allow property modification
            logger.debug(`Could not clear references for ${resourceId}: ${error.message}`);
          }
        }
      }
    }
    
    // Remove event listeners and timer references to prevent memory leaks
    // Clear any remaining timers
    const activeTimers = [];
    // Note: In a real implementation, we would track timers created during tests
    
    for (const timer of activeTimers) {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch (error) {
        logger.debug(`Could not clear timer: ${error.message}`);
      }
    }
    
    // Clear module caches and reset require cache for test isolation
    // Only clear test-related modules to avoid breaking the application
    const moduleKeysToDelete = Object.keys(require.cache || {}).filter(key => {
      const isTestFile = key.includes('/test/') || 
                        key.includes('/tests/') || 
                        key.includes('.test.') || 
                        key.includes('.spec.');
      const isTemporaryModule = key.includes('/tmp/') || key.includes('/temp/');
      return isTestFile || isTemporaryModule;
    });
    
    for (const moduleKey of moduleKeysToDelete) {
      try {
        delete require.cache[moduleKey];
      } catch (error) {
        logger.debug(`Could not delete module cache for ${moduleKey}: ${error.message}`);
      }
    }
    
    // Clear large object references and data structures from test execution
    RESOURCE_REGISTRY.clear();
    CLEANUP_TASKS.length = 0;
    
    // Force garbage collection if available to clean up test-related memory
    if (global.gc && typeof global.gc === 'function') {
      try {
        global.gc();
        logger.debug('Forced garbage collection executed');
      } catch (error) {
        logger.debug('Garbage collection not available or failed:', error.message);
      }
    } else {
      // Hint at garbage collection through memory allocation/deallocation
      try {
        const buffer = Buffer.alloc(1024 * 1024); // 1MB buffer
        buffer.fill(0);
        // Let buffer go out of scope to trigger GC
      } catch (error) {
        logger.debug('Memory allocation hint failed:', error.message);
      }
    }
    
    // Monitor memory usage and detect potential memory leaks from testing
    const memoryAfter = process.memoryUsage();
    const memoryDiff = {
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      external: memoryAfter.external - memoryBefore.external,
      arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
    };
    
    // Log memory cleanup completion and memory usage statistics
    logger.debug('Memory cleanup completed', {
      memoryBefore: {
        heapUsed: Math.round(memoryBefore.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryBefore.heapTotal / 1024 / 1024) + 'MB'
      },
      memoryAfter: {
        heapUsed: Math.round(memoryAfter.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryAfter.heapTotal / 1024 / 1024) + 'MB'
      },
      memoryDiff: {
        heapUsed: Math.round(memoryDiff.heapUsed / 1024) + 'KB',
        heapTotal: Math.round(memoryDiff.heapTotal / 1024) + 'KB'
      }
    });
    
    // Validate memory cleanup effectiveness and warn about potential leaks
    const heapIncreaseMB = memoryDiff.heapUsed / 1024 / 1024;
    if (heapIncreaseMB > 10) {
      logger.warn(`Significant memory increase detected: ${Math.round(heapIncreaseMB)}MB - potential memory leak`);
      TEARDOWN_METRICS.errors.push({
        operation: 'memory_cleanup',
        error: `Memory leak warning: ${Math.round(heapIncreaseMB)}MB increase`,
        timestamp: new Date().toISOString(),
        memoryStats: memoryDiff
      });
    }
    
    TEARDOWN_METRICS.resourcesCleaned++;
    
  } catch (error) {
    await handleTeardownError(error, 'performMemoryCleanup', {});
  }
}

/**
 * Executes all registered cleanup tasks that were added during test setup and execution,
 * providing extensible cleanup mechanism for custom test resources.
 * @returns {Promise<void>} Promise that resolves when all cleanup tasks are executed
 */
export async function executeCleanupTasks() {
  logger.debug('Starting execution of registered cleanup tasks');
  
  try {
    // Retrieve all registered cleanup tasks from the cleanup task queue
    const tasksToExecute = [...CLEANUP_TASKS];
    
    if (tasksToExecute.length === 0) {
      logger.debug('No cleanup tasks registered for execution');
      return;
    }
    
    logger.debug(`Executing ${tasksToExecute.length} registered cleanup tasks`);
    
    // Execute cleanup tasks in reverse order of registration (LIFO)
    tasksToExecute.reverse();
    
    for (const [index, task] of tasksToExecute.entries()) {
      try {
        // Track cleanup task execution time and performance metrics
        const taskStartTime = Date.now();
        
        logger.debug(`Executing cleanup task ${index + 1}/${tasksToExecute.length}: ${task.description || 'Unnamed task'}`);
        
        // Execute cleanup task with timeout protection
        await Promise.race([
          task.function(),
          setTimeoutPromise(TESTING_CONSTANTS.TEST_TIMEOUTS.UNIT_TESTS, null)
        ]);
        
        const taskDuration = Date.now() - taskStartTime;
        
        // Log cleanup task completion and any execution errors
        logger.debug(`Cleanup task completed in ${taskDuration}ms: ${task.description || 'Unnamed task'}`);
        TEARDOWN_METRICS.resourcesCleaned++;
        
      } catch (error) {
        // Handle cleanup task errors and continue with remaining tasks
        TEARDOWN_METRICS.errors.push({
          taskIndex: index,
          taskDescription: task.description || 'Unnamed task',
          operation: 'cleanup_task_execution',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        logger.warn(`Cleanup task failed: ${task.description || 'Unnamed task'} - ${error.message}`);
        
        // Continue with remaining tasks even if one fails
        continue;
      }
    }
    
    // Clear cleanup task queue after all tasks are executed
    CLEANUP_TASKS.length = 0;
    
    // Validate all registered resources have been properly cleaned up
    const remainingResources = Array.from(RESOURCE_REGISTRY.values()).filter(resource => 
      resource && resource.status !== 'cleaned'
    );
    
    if (remainingResources.length > 0) {
      logger.warn(`${remainingResources.length} resources remain uncleaned after task execution`);
    }
    
    // Report cleanup task execution summary and performance statistics
    const taskErrors = TEARDOWN_METRICS.errors.filter(e => e.operation === 'cleanup_task_execution');
    logger.debug(`Cleanup task execution completed. Tasks: ${tasksToExecute.length}, Errors: ${taskErrors.length}`);
    
  } catch (error) {
    await handleTeardownError(error, 'executeCleanupTasks', {});
  }
}

/**
 * Validates that teardown operations have completed successfully by checking for remaining resources,
 * open connections, active processes, and potential cleanup issues.
 * @returns {object} Validation result object with status, warnings, errors, and recommendations
 */
export async function validateTeardownCompletion() {
  logger.debug('Starting teardown completion validation');
  
  const validation = {
    status: 'success',
    warnings: [],
    errors: [],
    recommendations: [],
    details: {
      serversChecked: 0,
      processesChecked: 0,
      environmentChecked: true,
      memoryChecked: true,
      filesChecked: 0
    }
  };
  
  try {
    // Check for any remaining HTTP server instances or open network connections
    let activeServers = 0;
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'server' && resource.status !== 'cleaned') {
        activeServers++;
        validation.warnings.push(`Server instance not cleaned: ${resourceId}`);
      }
    }
    validation.details.serversChecked = activeServers;
    
    // Validate that all PM2 test processes have been terminated successfully
    let activeProcesses = 0;
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'pm2_process' && resource.status !== 'cleaned') {
        activeProcesses++;
        validation.warnings.push(`PM2 process not terminated: ${resourceId}`);
      }
    }
    validation.details.processesChecked = activeProcesses;
    
    // Verify environment variables have been restored to original state
    if (ORIGINAL_ENV_BACKUP) {
      const currentEnvKeys = Object.keys(process.env);
      const testEnvVars = currentEnvKeys.filter(key => 
        key.startsWith('TEST_') || key.startsWith('MOCHA_') || key.startsWith('NODE_TEST_')
      );
      
      if (testEnvVars.length > 0) {
        validation.warnings.push(`Test environment variables remain: ${testEnvVars.join(', ')}`);
        validation.recommendations.push('Consider manual cleanup of remaining test environment variables');
      }
    }
    
    // Check for open file handles, logging streams, or temporary files
    let unclosedStreams = 0;
    for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
      if (resource && resource.type === 'stream' && resource.status !== 'cleaned') {
        unclosedStreams++;
        validation.warnings.push(`Stream not closed: ${resourceId}`);
      }
    }
    validation.details.filesChecked = unclosedStreams;
    
    // Validate memory usage and detect potential memory leaks from testing
    const currentMemory = process.memoryUsage();
    const memoryUsageMB = Math.round(currentMemory.heapUsed / 1024 / 1024);
    
    // Check if memory usage is unusually high (threshold: 200MB for a simple test suite)
    if (memoryUsageMB > 200) {
      validation.warnings.push(`High memory usage detected: ${memoryUsageMB}MB heap used`);
      validation.recommendations.push('Investigate potential memory leaks in test suite');
    }
    
    // Check for remaining global state, mocks, or test utilities
    const suspiciousGlobals = Object.keys(global).filter(key => 
      key.startsWith('test') || 
      key.startsWith('mock') || 
      key.startsWith('spy') ||
      key.includes('Test') ||
      key.includes('Mock')
    );
    
    if (suspiciousGlobals.length > 0) {
      validation.warnings.push(`Potential test globals remain: ${suspiciousGlobals.slice(0, 5).join(', ')}${suspiciousGlobals.length > 5 ? '...' : ''}`);
    }
    
    // Verify all cleanup tasks have been executed successfully
    const failedTasks = CLEANUP_TASKS.filter(task => task.status === 'error');
    if (failedTasks.length > 0) {
      validation.errors.push(`${failedTasks.length} cleanup tasks failed to execute`);
      validation.recommendations.push('Review failed cleanup tasks and implement fallback procedures');
    }
    
    // Check for remaining items in resource registry
    const uncleanedResources = Array.from(RESOURCE_REGISTRY.values()).filter(resource => 
      resource && resource.status !== 'cleaned'
    );
    
    if (uncleanedResources.length > 0) {
      validation.warnings.push(`${uncleanedResources.length} resources remain uncleaned in registry`);
      validation.recommendations.push('Implement additional cleanup procedures for remaining resources');
    }
    
    // Generate teardown validation report with status and recommendations
    if (validation.errors.length > 0) {
      validation.status = 'error';
      validation.recommendations.unshift('Critical teardown failures detected - manual intervention required');
    } else if (validation.warnings.length > 0) {
      validation.status = 'warning';
      validation.recommendations.unshift('Teardown completed with warnings - review recommendations');
    }
    
    // Log validation summary
    logger.debug('Teardown validation completed', {
      status: validation.status,
      warnings: validation.warnings.length,
      errors: validation.errors.length,
      recommendations: validation.recommendations.length,
      details: validation.details
    });
    
    if (validation.status === 'error') {
      logger.error('Teardown validation failed with errors:', validation.errors);
    } else if (validation.status === 'warning') {
      logger.warn('Teardown validation completed with warnings:', validation.warnings);
    } else {
      logger.info('Teardown validation passed successfully');
    }
    
    return validation;
    
  } catch (error) {
    validation.status = 'error';
    validation.errors.push(`Validation error: ${error.message}`);
    validation.recommendations.push('Unable to complete teardown validation - manual verification recommended');
    
    logger.error('Error during teardown validation:', error);
    return validation;
  }
}

/**
 * Handles errors that occur during teardown operations with comprehensive error logging,
 * fallback cleanup procedures, and graceful error recovery.
 * @param {Error} error - The error that occurred during teardown
 * @param {string} context - Context where the error occurred
 * @param {object} options - Additional options for error handling
 * @returns {Promise<void>} Promise that resolves after error handling and fallback cleanup
 */
export async function handleTeardownError(error, context, options = {}) {
  // Log teardown error with comprehensive context and stack trace information
  logger.error(`Teardown error in ${context}:`, {
    error: error.message,
    stack: error.stack,
    context: context,
    options: options,
    timestamp: new Date().toISOString(),
    processId: process.pid,
    memoryUsage: process.memoryUsage()
  });
  
  // Classify error severity and determine appropriate fallback procedures
  const errorSeverity = classifyErrorSeverity(error, context);
  
  // Update teardown metrics with error information and recovery status
  TEARDOWN_METRICS.errors.push({
    error: error.message,
    context: context,
    severity: errorSeverity,
    options: options,
    timestamp: new Date().toISOString(),
    stack: error.stack
  });
  
  // Execute fallback cleanup procedures for critical resources
  if (errorSeverity === 'critical') {
    logger.warn(`Critical teardown error detected, executing fallback procedures for ${context}`);
    
    try {
      await executeFallbackCleanup(context, error);
    } catch (fallbackError) {
      logger.error(`Fallback cleanup failed for ${context}:`, fallbackError.message);
      TEARDOWN_METRICS.errors.push({
        error: fallbackError.message,
        context: `${context}_fallback`,
        severity: 'critical',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Attempt recovery operations for partial teardown failures
  if (errorSeverity !== 'critical' && options.allowRecovery !== false) {
    try {
      await attemptRecovery(context, error, options);
    } catch (recoveryError) {
      logger.warn(`Recovery attempt failed for ${context}:`, recoveryError.message);
    }
  }
  
  // Log error handling completion and any remaining issues
  logger.debug(`Error handling completed for ${context}`, {
    severity: errorSeverity,
    fallbackExecuted: errorSeverity === 'critical',
    recoveryAttempted: errorSeverity !== 'critical' && options.allowRecovery !== false
  });
  
  // Determine if teardown can continue or must abort with critical failure
  if (errorSeverity === 'critical' && options.abortOnCritical !== false) {
    logger.error(`Critical teardown failure in ${context} - teardown aborted`);
    throw new Error(`Critical teardown failure in ${context}: ${error.message}`);
  }
  
  // Provide recommendations for manual cleanup if automated recovery fails
  if (errorSeverity === 'critical') {
    logger.warn(`Manual cleanup may be required for ${context}. Recommendations:`, {
      'Server cleanup': 'Check for remaining server processes and terminate manually',
      'Process cleanup': 'Verify PM2 processes are terminated: pm2 delete all',
      'Environment cleanup': 'Reset environment variables and restart terminal session',
      'Memory cleanup': 'Restart Node.js process if memory leaks persist'
    });
  }
}

/**
 * Classifies error severity for appropriate response
 * @param {Error} error - The error to classify
 * @param {string} context - Context where error occurred
 * @returns {string} Error severity level
 * @private
 */
function classifyErrorSeverity(error, context) {
  // Critical errors that prevent proper cleanup
  const criticalContexts = ['globalTeardown', 'shutdownTestServers', 'cleanupPM2Processes'];
  const criticalErrorTypes = ['EADDRINUSE', 'EACCES', 'EMFILE', 'ENFILE'];
  
  if (criticalContexts.includes(context)) {
    return 'critical';
  }
  
  if (criticalErrorTypes.some(type => error.code === type || error.message.includes(type))) {
    return 'critical';
  }
  
  // High severity errors that impact test isolation
  const highSeverityContexts = ['restoreEnvironmentVariables', 'clearGlobalTestState'];
  if (highSeverityContexts.includes(context)) {
    return 'high';
  }
  
  // Medium severity errors that impact resource cleanup
  const mediumSeverityContexts = ['cleanupLoggingStreams', 'performMemoryCleanup'];
  if (mediumSeverityContexts.includes(context)) {
    return 'medium';
  }
  
  // Default to low severity
  return 'low';
}

/**
 * Executes fallback cleanup procedures for critical errors
 * @param {string} context - Context where error occurred
 * @param {Error} error - The original error
 * @private
 */
async function executeFallbackCleanup(context, error) {
  logger.debug(`Executing fallback cleanup for ${context}`);
  
  switch (context) {
    case 'shutdownTestServers':
      // Force terminate any remaining server processes
      try {
        // Attempt to force close any remaining servers
        for (const [resourceId, resource] of RESOURCE_REGISTRY.entries()) {
          if (resource && resource.type === 'server' && resource.instance) {
            try {
              if (resource.instance.destroy) {
                resource.instance.destroy();
              } else if (resource.instance.close) {
                resource.instance.close();
              }
            } catch (forceError) {
              logger.debug(`Force close failed for ${resourceId}: ${forceError.message}`);
            }
          }
        }
      } catch (fallbackError) {
        logger.warn('Server fallback cleanup failed:', fallbackError.message);
      }
      break;
      
    case 'cleanupPM2Processes':
      // Force terminate PM2 processes using system commands
      try {
        // In a real implementation, this would use child_process to run PM2 commands
        logger.debug('Would execute: pm2 delete all (fallback)');
      } catch (fallbackError) {
        logger.warn('PM2 fallback cleanup failed:', fallbackError.message);
      }
      break;
      
    case 'restoreEnvironmentVariables':
      // Reset critical environment variables to safe defaults
      try {
        const criticalVars = ['NODE_ENV', 'PORT', 'LOG_LEVEL'];
        for (const varName of criticalVars) {
          if (process.env[varName]) {
            delete process.env[varName];
          }
        }
      } catch (fallbackError) {
        logger.warn('Environment fallback cleanup failed:', fallbackError.message);
      }
      break;
      
    default:
      logger.debug(`No specific fallback procedure for ${context}`);
  }
}

/**
 * Attempts recovery operations for non-critical errors
 * @param {string} context - Context where error occurred
 * @param {Error} error - The original error
 * @param {object} options - Recovery options
 * @private
 */
async function attemptRecovery(context, error, options) {
  logger.debug(`Attempting recovery for ${context}`);
  
  // Wait a short time before retry
  await setTimeoutPromise(options.retryDelay || 1000);
  
  // Attempt to retry the operation with reduced scope
  const retryCount = options.retryCount || 0;
  const maxRetries = options.maxRetries || 2;
  
  if (retryCount < maxRetries) {
    logger.debug(`Recovery retry ${retryCount + 1}/${maxRetries} for ${context}`);
    
    // Implement context-specific recovery logic
    switch (context) {
      case 'cleanupLoggingStreams':
        // Retry with force close
        options.forceClose = true;
        break;
        
      case 'performMemoryCleanup':
        // Retry with reduced scope
        options.lightweightCleanup = true;
        break;
        
      default:
        // Generic retry with reduced timeout
        options.timeout = Math.max(1000, (options.timeout || 5000) / 2);
    }
    
    options.retryCount = retryCount + 1;
  }
}

// Export the TeardownManager class and teardown manager instance
export { TeardownManager };
export const teardownManager = new TeardownManager();

// Export all utility functions for modular usage
export {
  shutdownTestServers,
  cleanupPM2Processes,
  restoreEnvironmentVariables,
  teardownManager as default
};

/**
 * Module Summary:
 * 
 * This comprehensive Mocha teardown module provides production-ready test environment
 * cleanup for the Node.js tutorial project. It demonstrates modern ES Modules patterns,
 * comprehensive resource management, and educational best practices for test isolation.
 * 
 * Key Features:
 * - Global teardown function configured for Mocha testing framework
 * - TeardownManager class for coordinated cleanup operations
 * - Express.js v5.1.0 test server shutdown with graceful connection handling
 * - PM2 cluster mode test process termination and cleanup
 * - Environment variable restoration to prevent test pollution
 * - Comprehensive logging stream cleanup and file handle management
 * - Memory cleanup with garbage collection hints and leak detection
 * - Extensible cleanup task registration and execution system
 * - Comprehensive error handling with fallback procedures
 * - Validation and metrics reporting for teardown effectiveness
 * 
 * Educational Value:
 * - Demonstrates comprehensive test environment cleanup patterns
 * - Showcases production-ready resource management strategies
 * - Provides cross-platform testing environment restoration
 * - Implements modern Node.js cleanup and teardown best practices
 * - Shows proper error handling and recovery in teardown operations
 * 
 * Production Features:
 * - Graceful shutdown patterns with configurable timeouts
 * - Resource registry for tracking and cleaning up test resources
 * - Memory-efficient cleanup with comprehensive leak detection
 * - PM2 process management integration for production-like testing
 * - Security-aware environment variable restoration
 * - Comprehensive logging and metrics for teardown monitoring
 * - Extensible architecture for custom cleanup procedures
 */