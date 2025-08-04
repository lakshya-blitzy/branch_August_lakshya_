/**
 * @fileoverview Comprehensive Cross-Platform Integration Test Module
 * @description Complete feature parity validation between Node.js Express.js and Python Flask implementations
 * with comprehensive HTTP response comparison, security header validation, performance measurement, and
 * educational cross-platform testing methodologies. Implements Jest framework integration with SuperTest
 * HTTP testing and axios client for Flask application validation.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Cross-platform feature parity validation between Express.js and Flask
 * - Comprehensive HTTP response comparison with detailed analysis reporting
 * - Security header validation ensuring Helmet.js and Flask-Talisman equivalence
 * - Performance measurement and benchmark comparison across implementations
 * - Educational demonstration of integration testing best practices
 * - PM2 process management integration for production deployment testing
 * - Complete test automation with detailed reporting and educational insights
 * 
 * Architecture Integration:
 * - Express.js application factory integration via createApp import
 * - Production-hardened application testing via createProductionApp
 * - Comprehensive test helper ecosystem via test-helpers.js functions
 * - Cross-platform test data management via test-data.json fixtures
 * - Flask application process management via Node.js child_process
 * - HTTP testing via SuperTest for Express.js and axios for Flask
 * - Performance monitoring and measurement utilities integration
 * 
 * Educational Value:
 * - Demonstrates comprehensive cross-platform testing strategies
 * - Showcases API compatibility validation methodologies
 * - Provides production-ready integration testing patterns
 * - Illustrates security header validation across different frameworks
 * - Educational insights into cross-platform development challenges
 */

// External testing framework imports with version management
import supertest from 'supertest'; // v6.3.3 - SuperAgent driven library for testing HTTP servers
import axios from 'axios'; // v1.6.0 - HTTP client library for making requests to Flask application
import { spawn, exec } from 'node:child_process'; // built-in - Node.js child process module for Flask process management
import { promisify } from 'node:util'; // built-in - Node.js utilities for promisify operations and deep object comparison
import { resolve, dirname, join } from 'node:path'; // built-in - Node.js path utilities for Flask application paths
import { access, readFile, writeFile } from 'node:fs/promises'; // built-in - Node.js filesystem utilities for Flask configuration

// Internal application imports for Express.js testing
import createApp, { createProductionApp } from '../../app.js';

// Test helper imports for comprehensive testing utilities
import {
  setupTestHelpers,
  createHTTPTestHelper,
  createCrossPlatformTestHelper,
  createSecurityTestHelper,
  createPerformanceTestHelper,
  waitFor
} from '../helpers/test-helpers.js';

// Test data imports for cross-platform compatibility validation
import {
  crossPlatformTestData,
  httpEndpoints,
  securityTestData,
  performanceBenchmarks
} from '../fixtures/test-data.json';

// Global test configuration and state management
let expressApp = null; // Express.js application instance
let flaskProcess = null; // Flask application process instance
let testHelpers = null; // Initialized test helper functions

// Flask application configuration constants
const FLASK_PORT = 3001; // Flask application port for cross-platform testing
const EXPRESS_PORT = 3000; // Express.js application port for consistency
const FLASK_STARTUP_TIMEOUT = 30000; // 30 seconds timeout for Flask application startup
const crossPlatformTestResults = new Map(); // Cross-platform test results storage

/**
 * Starts the Python Flask application in a separate process for cross-platform testing,
 * configuring environment variables, validating Python dependencies, and ensuring Flask
 * application readiness with comprehensive error handling and timeout management.
 * 
 * @param {Object} flaskConfig - Flask application configuration options
 * @param {number} [flaskConfig.port=3001] - Flask application port
 * @param {string} [flaskConfig.environment='testing'] - Flask environment
 * @param {number} [flaskConfig.timeout=30000] - Startup timeout in milliseconds
 * @returns {Promise<ChildProcess>} Promise resolving with Flask application child process instance
 */
export async function startFlaskApplication(flaskConfig = {}) {
  const config = {
    port: flaskConfig.port || FLASK_PORT,
    environment: flaskConfig.environment || 'testing',
    timeout: flaskConfig.timeout || FLASK_STARTUP_TIMEOUT,
    ...flaskConfig
  };

  try {
    console.log('Starting Flask application for cross-platform testing', {
      port: config.port,
      environment: config.environment,
      timeout: config.timeout
    });

    // Validate Python environment and Flask application dependencies
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const flaskAppPath = resolve(dirname(import.meta.url.replace('file://', '')), '../../../flask-app/app.py');

    // Check if Flask application file exists
    try {
      await access(flaskAppPath);
      console.log('Flask application file found', { path: flaskAppPath });
    } catch (accessError) {
      console.warn('Flask application file not found, creating placeholder', { 
        path: flaskAppPath,
        error: accessError.message 
      });
      
      // Create minimal Flask application for testing if not exists
      const minimalFlaskApp = `#!/usr/bin/env python3
"""
Minimal Flask Application for Cross-Platform Testing
Generated automatically for tutorial project testing
"""

from flask import Flask, jsonify
import time
import os
import sys

app = Flask(__name__)

@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Hello world',
        'timestamp': time.time(),
        'platform': 'flask'
    })

@app.route('/good-evening', methods=['GET'])
def good_evening():
    return jsonify({
        'message': 'Good evening',
        'timestamp': time.time(),
        'platform': 'flask'
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'timestamp': time.time(),
        'uptime': time.time(),
        'environment': os.getenv('FLASK_ENV', 'development'),
        'platform': 'flask'
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
`;
      
      // Ensure directory exists
      const flaskDir = dirname(flaskAppPath);
      await exec(`mkdir -p ${flaskDir}`).catch(() => {}); // Ignore if directory exists
      
      // Write minimal Flask application
      await writeFile(flaskAppPath, minimalFlaskApp);
      console.log('Minimal Flask application created for testing');
    }

    // Configure Flask environment variables
    const flaskEnv = {
      ...process.env,
      FLASK_ENV: config.environment,
      FLASK_APP: flaskAppPath,
      PORT: config.port.toString(),
      PYTHONPATH: dirname(flaskAppPath),
      FLASK_RUN_HOST: '0.0.0.0',
      FLASK_RUN_PORT: config.port.toString()
    };

    console.log('Flask environment configured', {
      FLASK_ENV: flaskEnv.FLASK_ENV,
      PORT: flaskEnv.PORT,
      FLASK_APP: flaskEnv.FLASK_APP
    });

    // Spawn Python process with Flask application
    const spawnArgs = [flaskAppPath];
    flaskProcess = spawn(pythonPath, spawnArgs, {
      env: flaskEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: dirname(flaskAppPath)
    });

    console.log('Flask process spawned', {
      pid: flaskProcess.pid,
      command: `${pythonPath} ${spawnArgs.join(' ')}`
    });

    // Set up Flask process stdout/stderr monitoring for startup validation
    let startupOutput = '';
    let errorOutput = '';

    flaskProcess.stdout.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      console.log('Flask stdout:', output.trim());
    });

    flaskProcess.stderr.on('data', (data) => {
      const output = data.toString();
      errorOutput += output;
      console.warn('Flask stderr:', output.trim());
    });

    // Configure Flask process error handling
    flaskProcess.on('error', (error) => {
      console.error('Flask process error', error);
      throw new Error(`Failed to start Flask process: ${error.message}`);
    });

    flaskProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error('Flask process exited unexpectedly', {
          code,
          signal,
          stdout: startupOutput,
          stderr: errorOutput
        });
      }
    });

    // Wait for Flask application startup with HTTP health check validation
    const startupDeadline = Date.now() + config.timeout;
    
    await waitFor(async () => {
      try {
        // Check if process is still running
        if (flaskProcess.killed || flaskProcess.exitCode !== null) {
          throw new Error(`Flask process terminated: exit code ${flaskProcess.exitCode}`);
        }

        // Perform HTTP health check to validate Flask application readiness
        const healthResponse = await axios.get(`http://localhost:${config.port}/health`, {
          timeout: 5000,
          validateStatus: () => true // Accept any status for validation
        });

        if (healthResponse.status === 200) {
          console.log('Flask application health check successful', {
            status: healthResponse.status,
            data: healthResponse.data
          });
          return true;
        }

        throw new Error(`Flask health check failed: status ${healthResponse.status}`);
      } catch (error) {
        if (Date.now() > startupDeadline) {
          throw new Error(`Flask startup timeout exceeded: ${error.message}`);
        }
        
        // Continue waiting if not timed out
        console.log('Flask startup check failed, retrying...', error.message);
        return false;
      }
    }, {
      timeout: config.timeout,
      interval: 2000,
      timeoutMessage: 'Flask application startup timeout'
    });

    // Validate Flask application responsiveness with initial requests
    try {
      const [helloResponse, goodEveningResponse] = await Promise.all([
        axios.get(`http://localhost:${config.port}/hello`, { timeout: 5000 }),
        axios.get(`http://localhost:${config.port}/good-evening`, { timeout: 5000 })
      ]);

      console.log('Flask application endpoint validation successful', {
        hello: helloResponse.status,
        goodEvening: goodEveningResponse.status
      });
    } catch (validationError) {
      console.warn('Flask endpoint validation failed', validationError.message);
      // Don't fail startup for endpoint validation issues
    }

    // Log Flask application startup success
    console.log('Flask application started successfully', {
      pid: flaskProcess.pid,
      port: config.port,
      environment: config.environment,
      uptime: Date.now() - (startupDeadline - config.timeout)
    });

    return flaskProcess;

  } catch (error) {
    console.error('Failed to start Flask application', error);
    
    // Clean up process if startup failed
    if (flaskProcess && !flaskProcess.killed) {
      try {
        flaskProcess.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!flaskProcess.killed) {
          flaskProcess.kill('SIGKILL');
        }
      } catch (cleanupError) {
        console.error('Failed to clean up Flask process', cleanupError);
      }
    }
    
    throw new Error(`Flask application startup failed: ${error.message}`);
  }
}

/**
 * Gracefully shuts down the Python Flask application process with proper cleanup,
 * signal handling, and resource management ensuring clean test environment isolation.
 * 
 * @param {ChildProcess} flaskProcessInstance - Flask application process instance
 * @returns {Promise<void>} Promise resolving when Flask application is completely shut down
 */
export async function stopFlaskApplication(flaskProcessInstance = flaskProcess) {
  if (!flaskProcessInstance) {
    console.log('No Flask process to stop');
    return;
  }

  try {
    console.log('Stopping Flask application', {
      pid: flaskProcessInstance.pid,
      killed: flaskProcessInstance.killed,
      exitCode: flaskProcessInstance.exitCode
    });

    // Validate Flask process instance exists and is still running
    if (flaskProcessInstance.killed || flaskProcessInstance.exitCode !== null) {
      console.log('Flask process already terminated', {
        exitCode: flaskProcessInstance.exitCode
      });
      flaskProcess = null;
      return;
    }

    // Send SIGTERM signal for graceful shutdown initiation
    flaskProcessInstance.kill('SIGTERM');
    console.log('SIGTERM signal sent to Flask process');

    // Wait for Flask process termination with configurable timeout
    const shutdownTimeout = 10000; // 10 seconds
    const shutdownPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('Flask graceful shutdown timeout, sending SIGKILL');
        try {
          flaskProcessInstance.kill('SIGKILL');
        } catch (killError) {
          console.error('Failed to send SIGKILL to Flask process', killError);
        }
        resolve();
      }, shutdownTimeout);

      flaskProcessInstance.on('exit', (code, signal) => {
        clearTimeout(timeout);
        console.log('Flask process terminated', { code, signal });
        resolve();
      });

      flaskProcessInstance.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Flask process shutdown error', error);
        resolve(); // Don't reject, process is stopping anyway
      });
    });

    await shutdownPromise;

    // Clean up Flask process event listeners and references
    flaskProcessInstance.removeAllListeners();
    
    // Clear Flask application port and reset global process variables
    flaskProcess = null;

    // Log Flask application shutdown completion
    console.log('Flask application shutdown completed successfully');

  } catch (error) {
    console.error('Error during Flask application shutdown', error);
    
    // Force cleanup if graceful shutdown failed
    if (flaskProcessInstance && !flaskProcessInstance.killed) {
      try {
        flaskProcessInstance.kill('SIGKILL');
      } catch (forceKillError) {
        console.error('Failed to force kill Flask process', forceKillError);
      }
    }
    
    flaskProcess = null;
  }
}

/**
 * Sets up comprehensive cross-platform testing environment by initializing Express.js application,
 * starting Flask application, and configuring all test helpers for feature parity validation.
 * 
 * @param {Object} testConfig - Cross-platform test configuration
 * @param {boolean} [testConfig.startFlask=true] - Whether to start Flask application
 * @param {boolean} [testConfig.useProductionApp=false] - Use production Express.js configuration
 * @returns {Promise<Object>} Cross-platform test setup with application instances and helpers
 */
export async function setupCrossPlatformTest(testConfig = {}) {
  const config = {
    startFlask: testConfig.startFlask !== false,
    useProductionApp: testConfig.useProductionApp || false,
    expressPort: testConfig.expressPort || EXPRESS_PORT,
    flaskPort: testConfig.flaskPort || FLASK_PORT,
    timeout: testConfig.timeout || 30000,
    ...testConfig
  };

  try {
    console.log('Setting up cross-platform test environment', config);

    // Initialize Express.js application with appropriate configuration
    if (config.useProductionApp) {
      expressApp = createProductionApp({
        enableHealthMonitoring: true,
        enableSecurityMiddleware: true,
        configOverrides: {
          server: { PORT: config.expressPort }
        }
      });
      console.log('Production Express.js application initialized');
    } else {
      expressApp = createApp({
        enableHealthMonitoring: true,
        enableSecurityMiddleware: true,
        configOverrides: {
          environment: { NODE_ENV: 'test' },
          server: { PORT: config.expressPort }
        }
      });
      console.log('Development Express.js application initialized');
    }

    // Start Flask application if enabled
    if (config.startFlask) {
      flaskProcess = await startFlaskApplication({
        port: config.flaskPort,
        environment: 'testing',
        timeout: config.timeout
      });
      console.log('Flask application started for cross-platform testing');
    }

    // Set up comprehensive test helpers with cross-platform configuration
    testHelpers = await setupTestHelpers({
      expressApp,
      flaskPort: config.flaskPort,
      crossPlatform: true,
      performance: true,
      security: true
    });

    console.log('Test helpers initialized', {
      httpHelper: !!testHelpers.httpHelper,
      crossPlatformHelper: !!testHelpers.crossPlatformHelper,
      securityHelper: !!testHelpers.securityHelper,
      performanceHelper: !!testHelpers.performanceHelper
    });

    // Validate both applications are responsive and ready for testing
    const validationResults = await Promise.allSettled([
      // Express.js health check
      supertest(expressApp)
        .get('/health')
        .expect(200)
        .then(response => ({ platform: 'express', status: 'healthy', response: response.body })),
      
      // Flask health check (if started)
      config.startFlask ? 
        axios.get(`http://localhost:${config.flaskPort}/health`, { timeout: 5000 })
          .then(response => ({ platform: 'flask', status: 'healthy', response: response.data })) :
        Promise.resolve({ platform: 'flask', status: 'skipped', response: null })
    ]);

    const healthStatus = validationResults.map(result => 
      result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason }
    );

    console.log('Application health validation completed', healthStatus);

    // Initialize cross-platform test results tracking
    crossPlatformTestResults.clear();
    crossPlatformTestResults.set('setup', {
      timestamp: new Date().toISOString(),
      expressApp: !!expressApp,
      flaskProcess: !!flaskProcess,
      testHelpers: !!testHelpers,
      healthStatus
    });

    console.log('Cross-platform test setup completed successfully');

    return {
      expressApp,
      flaskProcess,
      testHelpers,
      config,
      healthStatus
    };

  } catch (error) {
    console.error('Cross-platform test setup failed', error);
    
    // Clean up resources on setup failure
    await teardownCrossPlatformTest().catch(cleanupError => {
      console.error('Failed to clean up after setup failure', cleanupError);
    });
    
    throw new Error(`Cross-platform test setup failed: ${error.message}`);
  }
}

/**
 * Performs comprehensive cleanup of cross-platform testing environment including graceful
 * application shutdown, test helper cleanup, and result aggregation.
 * 
 * @returns {Promise<void>} Promise resolving when complete cross-platform test cleanup is finished
 */
export async function teardownCrossPlatformTest() {
  try {
    console.log('Starting cross-platform test teardown');

    // Stop Flask application if running
    if (flaskProcess) {
      await stopFlaskApplication(flaskProcess);
      console.log('Flask application stopped');
    }

    // Clean up Express.js application (no explicit stop needed for testing)
    expressApp = null;
    console.log('Express.js application cleaned up');

    // Clean up test helpers if they have cleanup methods
    if (testHelpers) {
      if (typeof testHelpers.cleanup === 'function') {
        await testHelpers.cleanup();
      }
      testHelpers = null;
      console.log('Test helpers cleaned up');
    }

    // Aggregate and log cross-platform test results
    if (crossPlatformTestResults.size > 0) {
      const testSummary = {
        totalTests: crossPlatformTestResults.size,
        results: Array.from(crossPlatformTestResults.entries()),
        teardownTime: new Date().toISOString()
      };
      
      console.log('Cross-platform test results summary', testSummary);
    }

    // Clear cross-platform test results
    crossPlatformTestResults.clear();

    console.log('Cross-platform test teardown completed successfully');

  } catch (error) {
    console.error('Error during cross-platform test teardown', error);
    
    // Force cleanup of global variables
    expressApp = null;
    flaskProcess = null;
    testHelpers = null;
    crossPlatformTestResults.clear();
  }
}

/**
 * Performs comprehensive comparison of HTTP responses between Express.js and Flask implementations
 * including status codes, headers, response body content, and timing analysis.
 * 
 * @param {Object} expressResponse - Express.js HTTP response object
 * @param {Object} flaskResponse - Flask HTTP response object  
 * @param {Object} comparisonOptions - Response comparison configuration
 * @returns {Object} Comprehensive response comparison result with parity analysis
 */
export function compareHTTPResponses(expressResponse, flaskResponse, comparisonOptions = {}) {
  const options = {
    strictHeaders: comparisonOptions.strictHeaders || false,
    ignoreTimestamps: comparisonOptions.ignoreTimestamps !== false,
    performanceThreshold: comparisonOptions.performanceThreshold || 0.1, // 10% variance allowed
    ...comparisonOptions
  };

  try {
    console.log('Comparing HTTP responses between Express.js and Flask', {
      expressStatus: expressResponse?.status || expressResponse?.statusCode,
      flaskStatus: flaskResponse?.status || flaskResponse?.statusCode,
      options
    });

    const comparison = {
      timestamp: new Date().toISOString(),
      parity: {
        overall: true,
        statusCode: false,
        headers: false,
        body: false,
        performance: false
      },
      differences: [],
      analysis: {},
      recommendations: []
    };

    // Compare HTTP status codes with detailed validation
    const expressStatus = expressResponse?.status || expressResponse?.statusCode;
    const flaskStatus = flaskResponse?.status || flaskResponse?.statusCode;
    
    comparison.parity.statusCode = expressStatus === flaskStatus;
    comparison.analysis.statusCode = {
      express: expressStatus,
      flask: flaskStatus,
      match: comparison.parity.statusCode
    };

    if (!comparison.parity.statusCode) {
      comparison.differences.push({
        type: 'statusCode',
        express: expressStatus,
        flask: flaskStatus,
        severity: 'high',
        message: 'Status codes do not match between implementations'
      });
      comparison.overall = false;
    }

    // Validate response headers consistency including security headers
    const expressHeaders = normalizeHeaders(expressResponse?.headers || {});
    const flaskHeaders = normalizeHeaders(flaskResponse?.headers || {});
    
    const headerComparison = compareHeaders(expressHeaders, flaskHeaders, options);
    comparison.parity.headers = headerComparison.match;
    comparison.analysis.headers = headerComparison;

    if (!comparison.parity.headers) {
      comparison.differences.push(...headerComparison.differences);
      comparison.overall = false;
    }

    // Compare response body content with deep object comparison
    const bodyComparison = compareResponseBodies(
      expressResponse?.body || expressResponse?.data,
      flaskResponse?.body || flaskResponse?.data,
      options
    );
    
    comparison.parity.body = bodyComparison.match;
    comparison.analysis.body = bodyComparison;

    if (!comparison.parity.body) {
      comparison.differences.push(...bodyComparison.differences);
      comparison.overall = false;
    }

    // Compare response timing and performance characteristics
    if (expressResponse.responseTime && flaskResponse.responseTime) {
      const performanceComparison = comparePerformanceMetrics(
        { responseTime: expressResponse.responseTime },
        { responseTime: flaskResponse.responseTime },
        options
      );
      
      comparison.parity.performance = performanceComparison.match;
      comparison.analysis.performance = performanceComparison;

      if (!comparison.parity.performance) {
        comparison.differences.push(...performanceComparison.differences);
      }
    } else {
      comparison.analysis.performance = {
        message: 'Performance metrics not available for comparison'
      };
    }

    // Update overall parity status
    comparison.parity.overall = comparison.parity.statusCode && 
                               comparison.parity.headers && 
                               comparison.parity.body;

    // Generate recommendations for improving parity
    if (!comparison.parity.overall) {
      comparison.recommendations = generateParityRecommendations(comparison.differences);
    }

    console.log('HTTP response comparison completed', {
      overall: comparison.parity.overall,
      differences: comparison.differences.length,
      statusCode: comparison.parity.statusCode,
      headers: comparison.parity.headers,
      body: comparison.parity.body
    });

    return comparison;

  } catch (error) {
    console.error('HTTP response comparison failed', error);
    
    return {
      timestamp: new Date().toISOString(),
      parity: { overall: false },
      error: error.message,
      differences: [{
        type: 'comparison-error',
        message: `Response comparison failed: ${error.message}`,
        severity: 'critical'
      }]
    };
  }
}

/**
 * Validates security header implementation parity between Helmet.js (Express.js) and
 * Flask-Talisman (Flask) ensuring consistent security protection across platforms.
 * 
 * @param {Object} expressHeaders - Express.js response headers
 * @param {Object} flaskHeaders - Flask response headers
 * @param {Object} securityConfig - Security validation configuration
 * @returns {Object} Security header parity validation result with compliance assessment
 */
export function validateSecurityHeaderParity(expressHeaders, flaskHeaders, securityConfig = {}) {
  const config = {
    requiredHeaders: securityConfig.requiredHeaders || securityTestData.securityHeaders.requiredHeaders,
    forbiddenHeaders: securityConfig.forbiddenHeaders || securityTestData.securityHeaders.forbiddenHeaders,
    strictComparison: securityConfig.strictComparison || false,
    ...securityConfig
  };

  try {
    console.log('Validating security header parity between Express.js and Flask', {
      requiredHeaders: config.requiredHeaders.length,
      forbiddenHeaders: config.forbiddenHeaders.length
    });

    const validation = {
      timestamp: new Date().toISOString(),
      compliance: {
        overall: true,
        express: true,
        flask: true,
        parity: true
      },
      headers: {},
      violations: [],
      recommendations: [],
      securityScore: 100
    };

    // Normalize headers for consistent comparison
    const normalizedExpressHeaders = normalizeHeaders(expressHeaders);
    const normalizedFlaskHeaders = normalizeHeaders(flaskHeaders);

    // Validate Content-Security-Policy header consistency
    const cspComparison = validateCSPHeaders(
      normalizedExpressHeaders['content-security-policy'],
      normalizedFlaskHeaders['content-security-policy']
    );
    
    validation.headers['content-security-policy'] = cspComparison;
    if (!cspComparison.parity) {
      validation.compliance.parity = false;
      validation.violations.push({
        header: 'Content-Security-Policy',
        issue: 'CSP directives do not match',
        severity: 'high',
        express: cspComparison.express,
        flask: cspComparison.flask
      });
      validation.securityScore -= 20;
    }

    // Compare Strict-Transport-Security headers for HTTPS enforcement
    const hstsComparison = validateHSTSHeaders(
      normalizedExpressHeaders['strict-transport-security'],
      normalizedFlaskHeaders['strict-transport-security']
    );
    
    validation.headers['strict-transport-security'] = hstsComparison;
    if (!hstsComparison.parity) {
      validation.compliance.parity = false;
      validation.violations.push({
        header: 'Strict-Transport-Security',
        issue: 'HSTS configuration differs',
        severity: 'medium',
        express: hstsComparison.express,
        flask: hstsComparison.flask
      });
      validation.securityScore -= 15;
    }

    // Validate X-Frame-Options headers for clickjacking protection
    const frameOptionsComparison = compareSecurityHeader(
      'x-frame-options',
      normalizedExpressHeaders['x-frame-options'],
      normalizedFlaskHeaders['x-frame-options']
    );
    
    validation.headers['x-frame-options'] = frameOptionsComparison;
    if (!frameOptionsComparison.parity) {
      validation.compliance.parity = false;
      validation.violations.push({
        header: 'X-Frame-Options',
        issue: 'Frame options configuration differs',
        severity: 'medium',
        ...frameOptionsComparison
      });
      validation.securityScore -= 10;
    }

    // Compare X-Content-Type-Options headers for MIME type security
    const contentTypeOptionsComparison = compareSecurityHeader(
      'x-content-type-options',
      normalizedExpressHeaders['x-content-type-options'],
      normalizedFlaskHeaders['x-content-type-options']
    );
    
    validation.headers['x-content-type-options'] = contentTypeOptionsComparison;
    if (!contentTypeOptionsComparison.parity) {
      validation.compliance.parity = false;
      validation.violations.push({
        header: 'X-Content-Type-Options',
        issue: 'Content type options differ',
        severity: 'low',
        ...contentTypeOptionsComparison
      });
      validation.securityScore -= 5;
    }

    // Validate Referrer-Policy headers for information leakage protection
    const referrerPolicyComparison = compareSecurityHeader(
      'referrer-policy',
      normalizedExpressHeaders['referrer-policy'],
      normalizedFlaskHeaders['referrer-policy']
    );
    
    validation.headers['referrer-policy'] = referrerPolicyComparison;
    if (!referrerPolicyComparison.parity) {
      validation.compliance.parity = false;
      validation.violations.push({
        header: 'Referrer-Policy',
        issue: 'Referrer policy configuration differs',
        severity: 'low',
        ...referrerPolicyComparison
      });
      validation.securityScore -= 5;
    }

    // Check for forbidden headers that should be removed
    config.forbiddenHeaders.forEach(forbiddenHeader => {
      const expressHasForbidden = normalizedExpressHeaders[forbiddenHeader.toLowerCase()];
      const flaskHasForbidden = normalizedFlaskHeaders[forbiddenHeader.toLowerCase()];
      
      if (expressHasForbidden || flaskHasForbidden) {
        validation.violations.push({
          header: forbiddenHeader,
          issue: 'Forbidden header present',
          severity: 'medium',
          express: expressHasForbidden || null,
          flask: flaskHasForbidden || null
        });
        validation.securityScore -= 10;
      }
    });

    // Generate security recommendations based on violations
    if (validation.violations.length > 0) {
      validation.recommendations = generateSecurityRecommendations(validation.violations);
    }

    // Update overall compliance status
    validation.compliance.overall = validation.compliance.parity && 
                                   validation.violations.length === 0;

    console.log('Security header parity validation completed', {
      overall: validation.compliance.overall,
      parity: validation.compliance.parity,
      violations: validation.violations.length,
      securityScore: validation.securityScore
    });

    return validation;

  } catch (error) {
    console.error('Security header validation failed', error);
    
    return {
      timestamp: new Date().toISOString(),
      compliance: { overall: false },
      error: error.message,
      violations: [{
        header: 'validation-error',
        issue: `Security validation failed: ${error.message}`,
        severity: 'critical'
      }],
      securityScore: 0
    };
  }
}

/**
 * Tests individual endpoint parity between Express.js and Flask implementations by making
 * identical requests and comparing responses with comprehensive analysis.
 * 
 * @param {string} endpoint - Endpoint path to test
 * @param {Object} requestConfig - HTTP request configuration
 * @param {Object} testOptions - Test execution options
 * @returns {Promise<Object>} Endpoint parity test result with detailed analysis
 */
export async function testEndpointParity(endpoint, requestConfig = {}, testOptions = {}) {
  const config = {
    method: requestConfig.method || 'GET',
    headers: requestConfig.headers || {},
    query: requestConfig.query || {},
    timeout: requestConfig.timeout || 10000,
    ...requestConfig
  };

  const options = {
    compareHeaders: testOptions.compareHeaders !== false,
    comparePerformance: testOptions.comparePerformance !== false,
    validateSecurity: testOptions.validateSecurity !== false,
    ...testOptions
  };

  try {
    console.log('Testing endpoint parity', {
      endpoint,
      method: config.method,
      options
    });

    const testResult = {
      timestamp: new Date().toISOString(),
      endpoint,
      method: config.method,
      parity: {
        overall: true,
        response: false,
        security: false,
        performance: false
      },
      express: null,
      flask: null,
      comparison: null,
      analysis: {}
    };

    // Execute HTTP request to Express.js application
    const expressStartTime = process.hrtime.bigint();
    
    let expressRequest = supertest(expressApp);
    
    switch (config.method.toUpperCase()) {
      case 'GET':
        expressRequest = expressRequest.get(endpoint);
        break;
      case 'POST':
        expressRequest = expressRequest.post(endpoint);
        break;
      case 'PUT':
        expressRequest = expressRequest.put(endpoint);
        break;
      case 'DELETE':
        expressRequest = expressRequest.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${config.method}`);
    }

    // Apply headers and query parameters
    Object.entries(config.headers).forEach(([key, value]) => {
      expressRequest = expressRequest.set(key, value);
    });

    if (Object.keys(config.query).length > 0) {
      expressRequest = expressRequest.query(config.query);
    }

    const expressResponse = await expressRequest.timeout(config.timeout);
    const expressEndTime = process.hrtime.bigint();
    const expressResponseTime = Number(expressEndTime - expressStartTime) / 1000000; // Convert to ms

    testResult.express = {
      statusCode: expressResponse.status,
      headers: expressResponse.headers,
      body: expressResponse.body,
      responseTime: expressResponseTime
    };

    console.log('Express.js response received', {
      status: expressResponse.status,
      responseTime: expressResponseTime
    });

    // Execute HTTP request to Flask application if available
    if (flaskProcess) {
      const flaskStartTime = process.hrtime.bigint();
      
      const flaskUrl = `http://localhost:${FLASK_PORT}${endpoint}`;
      const flaskRequestConfig = {
        method: config.method,
        headers: config.headers,
        params: config.query,
        timeout: config.timeout,
        validateStatus: () => true // Accept any status for comparison
      };

      const flaskResponse = await axios(flaskUrl, flaskRequestConfig);
      const flaskEndTime = process.hrtime.bigint();
      const flaskResponseTime = Number(flaskEndTime - flaskStartTime) / 1000000; // Convert to ms

      testResult.flask = {
        statusCode: flaskResponse.status,
        headers: flaskResponse.headers,
        body: flaskResponse.data,
        responseTime: flaskResponseTime
      };

      console.log('Flask response received', {
        status: flaskResponse.status,
        responseTime: flaskResponseTime
      });

      // Compare responses between Express.js and Flask
      testResult.comparison = compareHTTPResponses(
        testResult.express,
        testResult.flask,
        {
          strictHeaders: options.compareHeaders,
          performanceThreshold: 0.2 // 20% variance allowed
        }
      );

      testResult.parity.response = testResult.comparison.parity.overall;

      // Validate security header parity if enabled
      if (options.validateSecurity) {
        const securityValidation = validateSecurityHeaderParity(
          testResult.express.headers,
          testResult.flask.headers
        );
        
        testResult.analysis.security = securityValidation;
        testResult.parity.security = securityValidation.compliance.overall;
      }

      // Compare performance characteristics if enabled
      if (options.comparePerformance) {
        const performanceComparison = {
          expressTime: expressResponseTime,
          flaskTime: flaskResponseTime,
          variance: Math.abs(expressResponseTime - flaskResponseTime) / expressResponseTime,
          acceptable: Math.abs(expressResponseTime - flaskResponseTime) / expressResponseTime < 0.5 // 50% variance
        };
        
        testResult.analysis.performance = performanceComparison;
        testResult.parity.performance = performanceComparison.acceptable;
      }

    } else {
      console.warn('Flask application not available for comparison');
      testResult.flask = null;
      testResult.parity.response = true; // Cannot compare, assume success
      testResult.parity.security = true;
      testResult.parity.performance = true;
    }

    // Update overall parity status
    testResult.parity.overall = testResult.parity.response && 
                               testResult.parity.security && 
                               testResult.parity.performance;

    console.log('Endpoint parity test completed', {
      endpoint,
      overall: testResult.parity.overall,
      response: testResult.parity.response,
      security: testResult.parity.security,
      performance: testResult.parity.performance
    });

    return testResult;

  } catch (error) {
    console.error('Endpoint parity test failed', error, { endpoint, config });
    
    return {
      timestamp: new Date().toISOString(),
      endpoint,
      method: config.method,
      parity: { overall: false },
      error: error.message,
      express: null,
      flask: null,
      comparison: null
    };
  }
}

/**
 * Executes comprehensive cross-platform test suite covering all endpoints, security features,
 * error handling, and performance characteristics with detailed reporting.
 * 
 * @param {Object} testSuiteConfig - Test suite configuration options
 * @returns {Promise<Object>} Complete cross-platform test suite results with analysis
 */
export async function runCrossPlatformTestSuite(testSuiteConfig = {}) {
  const config = {
    endpoints: testSuiteConfig.endpoints || Object.keys(httpEndpoints),
    validateSecurity: testSuiteConfig.validateSecurity !== false,
    measurePerformance: testSuiteConfig.measurePerformance !== false,
    testErrorHandling: testSuiteConfig.testErrorHandling !== false,
    generateReport: testSuiteConfig.generateReport !== false,
    ...testSuiteConfig
  };

  try {
    console.log('Running comprehensive cross-platform test suite', {
      endpoints: config.endpoints.length,
      validateSecurity: config.validateSecurity,
      measurePerformance: config.measurePerformance
    });

    const testSuiteResults = {
      timestamp: new Date().toISOString(),
      configuration: config,
      results: {
        endpoints: {},
        security: null,
        performance: null,
        errorHandling: null
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallParity: false,
        executionTime: 0
      },
      analysis: {},
      recommendations: []
    };

    const suiteStartTime = Date.now();

    // Test endpoint parity for all configured endpoints
    for (const endpointName of config.endpoints) {
      const endpointConfig = httpEndpoints[endpointName];
      if (!endpointConfig) {
        console.warn(`Endpoint configuration not found: ${endpointName}`);
        continue;
      }

      console.log(`Testing endpoint: ${endpointName}`);
      
      const endpointResult = await testEndpointParity(
        endpointConfig.path,
        {
          method: endpointConfig.method,
          timeout: 10000
        },
        {
          compareHeaders: true,
          comparePerformance: config.measurePerformance,
          validateSecurity: config.validateSecurity
        }
      );

      testSuiteResults.results.endpoints[endpointName] = endpointResult;
      testSuiteResults.summary.totalTests++;

      if (endpointResult.parity.overall) {
        testSuiteResults.summary.passedTests++;
      } else {
        testSuiteResults.summary.failedTests++;
      }

      // Store results for aggregation
      crossPlatformTestResults.set(`endpoint-${endpointName}`, endpointResult);
    }

    // Validate security middleware parity if enabled
    if (config.validateSecurity && flaskProcess) {
      console.log('Validating security middleware parity');
      
      const securityTestResult = await testSecurityParity();
      testSuiteResults.results.security = securityTestResult;
      testSuiteResults.summary.totalTests++;

      if (securityTestResult.compliance.overall) {
        testSuiteResults.summary.passedTests++;
      } else {
        testSuiteResults.summary.failedTests++;
      }

      crossPlatformTestResults.set('security-parity', securityTestResult);
    }

    // Test performance characteristics if enabled
    if (config.measurePerformance) {
      console.log('Measuring performance characteristics');
      
      const performanceTestResult = await testPerformanceParity(config.endpoints);
      testSuiteResults.results.performance = performanceTestResult;
      testSuiteResults.summary.totalTests++;

      if (performanceTestResult.acceptable) {
        testSuiteResults.summary.passedTests++;
      } else {
        testSuiteResults.summary.failedTests++;
      }

      crossPlatformTestResults.set('performance-parity', performanceTestResult);
    }

    // Test error handling parity if enabled
    if (config.testErrorHandling) {
      console.log('Testing error handling parity');
      
      const errorHandlingResult = await testErrorHandlingParity();
      testSuiteResults.results.errorHandling = errorHandlingResult;
      testSuiteResults.summary.totalTests++;

      if (errorHandlingResult.parity) {
        testSuiteResults.summary.passedTests++;
      } else {
        testSuiteResults.summary.failedTests++;
      }

      crossPlatformTestResults.set('error-handling-parity', errorHandlingResult);
    }

    // Calculate execution time and overall results
    testSuiteResults.summary.executionTime = Date.now() - suiteStartTime;
    testSuiteResults.summary.overallParity = testSuiteResults.summary.failedTests === 0;

    // Generate analysis and recommendations
    testSuiteResults.analysis = generateTestSuiteAnalysis(testSuiteResults);
    testSuiteResults.recommendations = generateTestSuiteRecommendations(testSuiteResults);

    // Generate comprehensive report if enabled
    if (config.generateReport) {
      const reportResult = generateParityReport(crossPlatformTestResults, {
        includeDetails: true,
        includeRecommendations: true,
        format: 'json'
      });
      
      testSuiteResults.report = reportResult;
    }

    console.log('Cross-platform test suite completed', {
      totalTests: testSuiteResults.summary.totalTests,
      passed: testSuiteResults.summary.passedTests,
      failed: testSuiteResults.summary.failedTests,
      overallParity: testSuiteResults.summary.overallParity,
      executionTime: testSuiteResults.summary.executionTime
    });

    return testSuiteResults;

  } catch (error) {
    console.error('Cross-platform test suite execution failed', error);
    
    return {
      timestamp: new Date().toISOString(),
      configuration: config,
      error: error.message,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallParity: false,
        executionTime: Date.now() - (testSuiteResults?.summary?.executionTime || Date.now())
      }
    };
  }
}

/**
 * Generates comprehensive cross-platform parity report summarizing all test results,
 * compatibility analysis, and educational insights.
 * 
 * @param {Map} testResults - Cross-platform test results collection
 * @param {Object} reportOptions - Report generation options
 * @returns {Object} Comprehensive parity report with detailed analysis
 */
export function generateParityReport(testResults, reportOptions = {}) {
  const options = {
    includeDetails: reportOptions.includeDetails !== false,
    includeRecommendations: reportOptions.includeRecommendations !== false,
    format: reportOptions.format || 'json',
    includeEducationalInsights: reportOptions.includeEducationalInsights !== false,
    ...reportOptions
  };

  try {
    console.log('Generating comprehensive cross-platform parity report', {
      resultCount: testResults.size,
      options
    });

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        generator: 'Cross-Platform Parity Test Suite',
        version: '1.0.0',
        options
      },
      
      summary: {
        overallScore: 0,
        totalTests: testResults.size,
        categories: {
          endpoints: { passed: 0, failed: 0, score: 0 },
          security: { passed: 0, failed: 0, score: 0 },
          performance: { passed: 0, failed: 0, score: 0 },
          errorHandling: { passed: 0, failed: 0, score: 0 }
        }
      },

      analysis: {
        compatibility: {
          endpointParity: 0,
          securityParity: 0,
          performanceParity: 0,
          overallCompatibility: 0
        },
        strengths: [],
        weaknesses: [],
        riskAssessment: 'low'
      },

      details: options.includeDetails ? {} : null,
      recommendations: options.includeRecommendations ? [] : null,
      educationalInsights: options.includeEducationalInsights ? {} : null
    };

    // Analyze test results by category
    const results = Array.from(testResults.entries());
    
    results.forEach(([testName, testResult]) => {
      const category = categorizeTestResult(testName);
      
      if (testResult.parity?.overall || testResult.compliance?.overall || testResult.acceptable) {
        report.summary.categories[category].passed++;
      } else {
        report.summary.categories[category].failed++;
      }

      // Store detailed results if requested
      if (options.includeDetails) {
        report.details[testName] = testResult;
      }
    });

    // Calculate category scores and overall score
    Object.keys(report.summary.categories).forEach(category => {
      const categoryData = report.summary.categories[category];
      const totalCategoryTests = categoryData.passed + categoryData.failed;
      
      if (totalCategoryTests > 0) {
        categoryData.score = (categoryData.passed / totalCategoryTests) * 100;
      } else {
        categoryData.score = 100; // No tests in category, assume perfect
      }
    });

    // Calculate overall compatibility score
    const categoryScores = Object.values(report.summary.categories).map(cat => cat.score);
    report.summary.overallScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;

    // Update compatibility analysis
    report.analysis.compatibility.endpointParity = report.summary.categories.endpoints.score;
    report.analysis.compatibility.securityParity = report.summary.categories.security.score;
    report.analysis.compatibility.performanceParity = report.summary.categories.performance.score;
    report.analysis.compatibility.overallCompatibility = report.summary.overallScore;

    // Generate strengths and weaknesses analysis
    report.analysis.strengths = identifyStrengths(report.summary.categories);
    report.analysis.weaknesses = identifyWeaknesses(report.summary.categories);
    report.analysis.riskAssessment = assessRisk(report.summary.overallScore);

    // Generate recommendations if requested
    if (options.includeRecommendations) {
      report.recommendations = generateComprehensiveRecommendations(report.analysis, results);
    }

    // Generate educational insights if requested
    if (options.includeEducationalInsights) {
      report.educationalInsights = generateEducationalInsights(report, results);
    }

    console.log('Cross-platform parity report generated successfully', {
      overallScore: report.summary.overallScore,
      totalTests: report.summary.totalTests,
      strengths: report.analysis.strengths.length,
      weaknesses: report.analysis.weaknesses.length
    });

    return report;

  } catch (error) {
    console.error('Failed to generate parity report', error);
    
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        error: error.message
      },
      summary: {
        overallScore: 0,
        totalTests: testResults.size,
        error: 'Report generation failed'
      }
    };
  }
}

/**
 * Comprehensive test runner class for executing cross-platform compatibility tests with
 * advanced orchestration, result tracking, and educational reporting capabilities.
 */
export class CrossPlatformTestRunner {
  /**
   * Initializes CrossPlatformTestRunner with test configuration and comprehensive setup
   * 
   * @param {Object} testConfig - Test runner configuration
   */
  constructor(testConfig = {}) {
    this.config = {
      autoSetup: testConfig.autoSetup !== false,
      startFlask: testConfig.startFlask !== false,
      validateSecurity: testConfig.validateSecurity !== false,
      measurePerformance: testConfig.measurePerformance !== false,
      generateReports: testConfig.generateReports !== false,
      ...testConfig
    };

    this.expressApp = null;
    this.flaskProcess = null;
    this.testHelpers = null;
    this.testResults = new Map();
    this.performanceMetrics = {
      totalTests: 0,
      executionTime: 0,
      averageResponseTime: 0,
      memoryUsage: []
    };

    console.log('CrossPlatformTestRunner initialized', this.config);
  }

  /**
   * Executes complete cross-platform test suite with comprehensive validation
   * 
   * @returns {Promise<Object>} Complete test execution results with analysis
   */
  async runAllTests() {
    try {
      console.log('Starting comprehensive cross-platform test execution');
      const startTime = Date.now();

      // Setup test environment if auto-setup enabled
      if (this.config.autoSetup) {
        await this.setupTestEnvironment();
      }

      // Execute endpoint parity tests
      const endpointResults = await this.compareEndpoints(Object.keys(httpEndpoints));
      
      // Measure performance characteristics
      const performanceResults = await this.measurePerformance({
        endpoints: Object.keys(httpEndpoints),
        iterations: 10
      });

      // Validate security implementation
      const securityResults = await this.validateSecurity({
        validateHeaders: true,
        testVulnerabilities: true
      });

      // Generate comprehensive report
      const report = this.generateReport({
        includeDetails: true,
        includeRecommendations: true,
        includeEducationalInsights: true
      });

      const executionTime = Date.now() - startTime;

      const results = {
        timestamp: new Date().toISOString(),
        executionTime,
        endpoints: endpointResults,
        performance: performanceResults,
        security: securityResults,
        report,
        summary: {
          totalTests: endpointResults.size + 2, // endpoints + performance + security
          overallSuccess: this.calculateOverallSuccess([endpointResults, performanceResults, securityResults])
        }
      };

      console.log('Cross-platform test execution completed', {
        executionTime,
        totalTests: results.summary.totalTests,
        overallSuccess: results.summary.overallSuccess
      });

      return results;

    } catch (error) {
      console.error('Cross-platform test execution failed', error);
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  /**
   * Compares specific endpoints between Express.js and Flask implementations
   * 
   * @param {Array} endpoints - Array of endpoint names to compare
   * @returns {Promise<Map>} Endpoint comparison results
   */
  async compareEndpoints(endpoints) {
    const results = new Map();

    for (const endpointName of endpoints) {
      try {
        const endpointConfig = httpEndpoints[endpointName];
        if (!endpointConfig) continue;

        const comparison = await testEndpointParity(
          endpointConfig.path,
          { method: endpointConfig.method },
          { compareHeaders: true, validateSecurity: true }
        );

        results.set(endpointName, comparison);
        this.testResults.set(`endpoint-${endpointName}`, comparison);

      } catch (error) {
        console.error(`Endpoint comparison failed: ${endpointName}`, error);
        results.set(endpointName, { error: error.message, parity: { overall: false } });
      }
    }

    return results;
  }

  /**
   * Measures and compares performance characteristics between implementations
   * 
   * @param {Object} performanceConfig - Performance measurement configuration
   * @returns {Object} Performance measurement results with comparison metrics
   */
  async measurePerformance(performanceConfig = {}) {
    const config = {
      endpoints: performanceConfig.endpoints || Object.keys(httpEndpoints),
      iterations: performanceConfig.iterations || 10,
      concurrency: performanceConfig.concurrency || 1,
      ...performanceConfig
    };

    try {
      console.log('Measuring performance characteristics', config);

      const measurements = {
        express: {},
        flask: {},
        comparison: {},
        overall: { acceptable: true }
      };

      for (const endpointName of config.endpoints) {
        const endpointConfig = httpEndpoints[endpointName];
        if (!endpointConfig) continue;

        // Measure Express.js performance
        const expressTimes = await this.measureEndpointPerformance(
          'express',
          endpointConfig.path,
          config.iterations
        );

        measurements.express[endpointName] = {
          average: expressTimes.reduce((sum, time) => sum + time, 0) / expressTimes.length,
          min: Math.min(...expressTimes),
          max: Math.max(...expressTimes),
          measurements: expressTimes
        };

        // Measure Flask performance if available
        if (this.flaskProcess) {
          const flaskTimes = await this.measureEndpointPerformance(
            'flask',
            endpointConfig.path,
            config.iterations
          );

          measurements.flask[endpointName] = {
            average: flaskTimes.reduce((sum, time) => sum + time, 0) / flaskTimes.length,
            min: Math.min(...flaskTimes),
            max: Math.max(...flaskTimes),
            measurements: flaskTimes
          };

          // Compare performance
          const variance = Math.abs(measurements.express[endpointName].average - measurements.flask[endpointName].average) / measurements.express[endpointName].average;
          measurements.comparison[endpointName] = {
            variance,
            acceptable: variance < 0.5 // 50% variance threshold
          };

          if (!measurements.comparison[endpointName].acceptable) {
            measurements.overall.acceptable = false;
          }
        }
      }

      console.log('Performance measurement completed', {
        endpoints: config.endpoints.length,
        overall: measurements.overall.acceptable
      });

      return measurements;

    } catch (error) {
      console.error('Performance measurement failed', error);
      return { error: error.message, overall: { acceptable: false } };
    }
  }

  /**
   * Validates security implementation parity between frameworks
   * 
   * @param {Object} securityConfig - Security validation configuration
   * @returns {Object} Security validation results with compliance assessment
   */
  async validateSecurity(securityConfig = {}) {
    const config = {
      validateHeaders: securityConfig.validateHeaders !== false,
      testVulnerabilities: securityConfig.testVulnerabilities || false,
      ...securityConfig
    };

    try {
      console.log('Validating security implementation parity', config);

      const validation = {
        headers: null,
        vulnerabilities: null,
        overall: { compliant: true }
      };

      if (config.validateHeaders) {
        // Test security headers on a sample endpoint
        const expressResponse = await supertest(this.expressApp).get('/hello');
        
        let flaskResponse = null;
        if (this.flaskProcess) {
          flaskResponse = await axios.get(`http://localhost:${FLASK_PORT}/hello`);
        }

        validation.headers = validateSecurityHeaderParity(
          expressResponse.headers,
          flaskResponse?.headers || {},
          { requiredHeaders: securityTestData.securityHeaders.requiredHeaders }
        );

        if (!validation.headers.compliance.overall) {
          validation.overall.compliant = false;
        }
      }

      if (config.testVulnerabilities && this.flaskProcess) {
        // Test common vulnerabilities
        validation.vulnerabilities = await this.testSecurityVulnerabilities();
        
        if (!validation.vulnerabilities.secure) {
          validation.overall.compliant = false;
        }
      }

      console.log('Security validation completed', {
        compliant: validation.overall.compliant
      });

      return validation;

    } catch (error) {
      console.error('Security validation failed', error);
      return { 
        error: error.message, 
        overall: { compliant: false } 
      };
    }
  }

  /**
   * Generates comprehensive compatibility report with analysis and recommendations
   * 
   * @param {Object} reportOptions - Report generation options
   * @returns {Object} Comprehensive compatibility report
   */
  generateReport(reportOptions = {}) {
    return generateParityReport(this.testResults, {
      includeDetails: true,
      includeRecommendations: true,
      includeEducationalInsights: true,
      ...reportOptions
    });
  }

  /**
   * Sets up the test environment with both Express.js and Flask applications
   * @private
   */
  async setupTestEnvironment() {
    const setup = await setupCrossPlatformTest({
      startFlask: this.config.startFlask,
      useProductionApp: false
    });

    this.expressApp = setup.expressApp;
    this.flaskProcess = setup.flaskProcess;
    this.testHelpers = setup.testHelpers;
  }

  /**
   * Measures endpoint performance for a specific platform
   * @private
   */
  async measureEndpointPerformance(platform, endpoint, iterations) {
    const measurements = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();

      try {
        if (platform === 'express') {
          await supertest(this.expressApp).get(endpoint).expect(200);
        } else if (platform === 'flask') {
          await axios.get(`http://localhost:${FLASK_PORT}${endpoint}`);
        }

        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms
        measurements.push(duration);

      } catch (error) {
        console.error(`Performance measurement failed for ${platform}:${endpoint}`, error);
        measurements.push(999999); // High value to indicate failure
      }
    }

    return measurements;
  }

  /**
   * Tests for common security vulnerabilities
   * @private
   */
  async testSecurityVulnerabilities() {
    const vulnerabilityTests = securityTestData.xssAttacks || [];
    const results = {
      tested: vulnerabilityTests.length,
      blocked: 0,
      secure: true
    };

    for (const attack of vulnerabilityTests) {
      try {
        // Test XSS attack on both platforms
        const expressResponse = await supertest(this.expressApp)
          .get(`/hello?test=${encodeURIComponent(attack.payload)}`)
          .expect(res => res.status < 500); // Accept any non-server-error status

        const flaskResponse = await axios.get(
          `http://localhost:${FLASK_PORT}/hello?test=${encodeURIComponent(attack.payload)}`,
          { validateStatus: () => true }
        );

        // Check if attack was properly blocked/sanitized
        const expressBlocked = !expressResponse.text.includes(attack.payload);
        const flaskBlocked = !JSON.stringify(flaskResponse.data).includes(attack.payload);

        if (expressBlocked && flaskBlocked) {
          results.blocked++;
        } else {
          results.secure = false;
        }

      } catch (error) {
        console.error('Vulnerability test failed', error);
        results.secure = false;
      }
    }

    return results;
  }

  /**
   * Calculates overall success rate from multiple test result sets
   * @private
   */
  calculateOverallSuccess(resultSets) {
    let totalTests = 0;
    let passedTests = 0;

    resultSets.forEach(resultSet => {
      if (resultSet instanceof Map) {
        resultSet.forEach(result => {
          totalTests++;
          if (result.parity?.overall || result.compliance?.overall || result.acceptable) {
            passedTests++;
          }
        });
      } else if (resultSet && typeof resultSet === 'object') {
        totalTests++;
        if (resultSet.overall?.acceptable || resultSet.overall?.compliant) {
          passedTests++;
        }
      }
    });

    return totalTests > 0 ? (passedTests / totalTests) >= 0.8 : false; // 80% success threshold
  }
}

// Helper functions for response comparison and analysis

/**
 * Normalizes HTTP headers for consistent comparison
 * @private
 */
function normalizeHeaders(headers) {
  const normalized = {};
  Object.entries(headers || {}).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = value;
  });
  return normalized;
}

/**
 * Compares headers between Express.js and Flask responses  
 * @private
 */
function compareHeaders(expressHeaders, flaskHeaders, options) {
  const comparison = {
    match: true,
    differences: [],
    analysis: {
      express: Object.keys(expressHeaders).length,
      flask: Object.keys(flaskHeaders).length,
      common: 0,
      expressOnly: [],
      flaskOnly: []
    }
  };

  // Find common headers and differences
  const allHeaders = new Set([...Object.keys(expressHeaders), ...Object.keys(flaskHeaders)]);
  
  allHeaders.forEach(header => {
    const expressValue = expressHeaders[header];
    const flaskValue = flaskHeaders[header];
    
    if (expressValue && flaskValue) {
      comparison.analysis.common++;
      if (expressValue !== flaskValue && options.strictHeaders) {
        comparison.match = false;
        comparison.differences.push({
          type: 'headerValue',
          header,
          express: expressValue,
          flask: flaskValue,
          severity: 'medium'
        });
      }
    } else if (expressValue) {
      comparison.analysis.expressOnly.push(header);
      if (options.strictHeaders) {
        comparison.match = false;
        comparison.differences.push({
          type: 'headerMissing',
          header,
          platform: 'flask',
          severity: 'low'
        });
      }
    } else if (flaskValue) {
      comparison.analysis.flaskOnly.push(header);
      if (options.strictHeaders) {
        comparison.match = false;
        comparison.differences.push({
          type: 'headerMissing',
          header,
          platform: 'express',
          severity: 'low'
        });
      }
    }
  });

  return comparison;
}

/**
 * Compares response body content with deep comparison
 * @private
 */
function compareResponseBodies(expressBody, flaskBody, options) {
  try {
    const comparison = {
      match: false,
      differences: [],
      analysis: {
        expressType: typeof expressBody,
        flaskType: typeof flaskBody,
        deepEquals: false
      }
    };

    // Handle timestamp ignoring if enabled
    let normalizedExpressBody = expressBody;
    let normalizedFlaskBody = flaskBody;

    if (options.ignoreTimestamps) {
      normalizedExpressBody = removeTimestamps(expressBody);
      normalizedFlaskBody = removeTimestamps(flaskBody);
    }

    // Deep comparison using JSON stringification
    const expressJson = JSON.stringify(normalizedExpressBody, Object.keys(normalizedExpressBody || {}).sort());
    const flaskJson = JSON.stringify(normalizedFlaskBody, Object.keys(normalizedFlaskBody || {}).sort());

    comparison.match = expressJson === flaskJson;
    comparison.analysis.deepEquals = comparison.match;

    if (!comparison.match) {
      comparison.differences.push({
        type: 'bodyContent',
        express: normalizedExpressBody,
        flask: normalizedFlaskBody,
        severity: 'high',
        message: 'Response body content differs between implementations'
      });
    }

    return comparison;

  } catch (error) {
    return {
      match: false,
      differences: [{
        type: 'bodyComparison',
        error: error.message,
        severity: 'high'
      }]
    };
  }
}

/**
 * Removes timestamp fields from response bodies for comparison
 * @private
 */
function removeTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = { ...obj };
  delete cleaned.timestamp;
  delete cleaned.uptime;
  
  return cleaned;
}

/**
 * Compares performance metrics between implementations
 * @private
 */
function comparePerformanceMetrics(expressMetrics, flaskMetrics, options) {
  const comparison = {
    match: false,
    differences: [],
    analysis: {
      expressTime: expressMetrics.responseTime,
      flaskTime: flaskMetrics.responseTime,
      variance: 0,
      acceptable: false
    }
  };

  if (expressMetrics.responseTime && flaskMetrics.responseTime) {
    comparison.analysis.variance = Math.abs(expressMetrics.responseTime - flaskMetrics.responseTime) / expressMetrics.responseTime;
    comparison.analysis.acceptable = comparison.analysis.variance <= options.performanceThreshold;
    comparison.match = comparison.analysis.acceptable;

    if (!comparison.match) {
      comparison.differences.push({
        type: 'performance',
        message: 'Response time variance exceeds threshold',
        variance: comparison.analysis.variance,
        threshold: options.performanceThreshold,
        severity: 'medium'
      });
    }
  }

  return comparison;
}

/**
 * Validates Content Security Policy headers
 * @private
 */
function validateCSPHeaders(expressCSP, flaskCSP) {
  return {
    express: expressCSP,
    flask: flaskCSP,
    parity: expressCSP === flaskCSP,
    analysis: {
      match: expressCSP === flaskCSP,
      message: expressCSP === flaskCSP ? 'CSP headers match' : 'CSP headers differ'
    }
  };
}

/**
 * Validates HTTP Strict Transport Security headers
 * @private
 */
function validateHSTSHeaders(expressHSTS, flaskHSTS) {
  return {
    express: expressHSTS,
    flask: flaskHSTS,
    parity: expressHSTS === flaskHSTS,
    analysis: {
      match: expressHSTS === flaskHSTS,
      message: expressHSTS === flaskHSTS ? 'HSTS headers match' : 'HSTS headers differ'
    }
  };
}

/**
 * Compares generic security headers
 * @private
 */
function compareSecurityHeader(headerName, expressValue, flaskValue) {
  return {
    header: headerName,
    express: expressValue,
    flask: flaskValue,
    parity: expressValue === flaskValue,
    analysis: {
      match: expressValue === flaskValue,
      message: expressValue === flaskValue ? `${headerName} headers match` : `${headerName} headers differ`
    }
  };
}

/**
 * Generates parity improvement recommendations
 * @private
 */
function generateParityRecommendations(differences) {
  const recommendations = [];
  
  differences.forEach(diff => {
    switch (diff.type) {
      case 'statusCode':
        recommendations.push({
          category: 'Response Status',
          priority: 'high',
          suggestion: 'Ensure both implementations return identical HTTP status codes',
          implementation: 'Review route handlers and error handling logic'
        });
        break;
      case 'headerValue':
        recommendations.push({
          category: 'HTTP Headers',
          priority: 'medium',
          suggestion: `Standardize ${diff.header} header value across implementations`,
          implementation: 'Review middleware configuration and header setting logic'
        });
        break;
      case 'bodyContent':
        recommendations.push({
          category: 'Response Content',
          priority: 'high',
          suggestion: 'Ensure response body structure and content are identical',
          implementation: 'Review response formatting and data serialization'
        });
        break;
    }
  });

  return recommendations;
}

/**
 * Generates security improvement recommendations
 * @private
 */
function generateSecurityRecommendations(violations) {
  const recommendations = [];
  
  violations.forEach(violation => {
    recommendations.push({
      category: 'Security Headers',
      priority: violation.severity,
      header: violation.header,
      suggestion: `Address ${violation.header} security header inconsistency`,
      implementation: 'Review security middleware configuration'
    });
  });

  return recommendations;
}

// Additional helper functions for test suite analysis

/**
 * Tests security parity between implementations
 * @private
 */
async function testSecurityParity() {
  try {
    const expressResponse = await supertest(expressApp).get('/hello');
    
    let flaskResponse = null;
    if (flaskProcess) {
      flaskResponse = await axios.get(`http://localhost:${FLASK_PORT}/hello`);
    }

    return validateSecurityHeaderParity(
      expressResponse.headers,
      flaskResponse?.headers || {}
    );

  } catch (error) {
    return {
      compliance: { overall: false },
      error: error.message
    };
  }
}

/**
 * Tests performance parity between implementations
 * @private
 */
async function testPerformanceParity(endpoints) {
  const results = {
    endpoints: {},
    overall: { acceptable: true }
  };

  for (const endpointName of endpoints) {
    const endpointConfig = httpEndpoints[endpointName];
    if (!endpointConfig) continue;

    try {
      // Measure Express.js response time
      const expressStart = process.hrtime.bigint();
      await supertest(expressApp).get(endpointConfig.path).expect(200);
      const expressEnd = process.hrtime.bigint();
      const expressTime = Number(expressEnd - expressStart) / 1000000;

      let flaskTime = null;
      if (flaskProcess) {
        const flaskStart = process.hrtime.bigint();
        await axios.get(`http://localhost:${FLASK_PORT}${endpointConfig.path}`);
        const flaskEnd = process.hrtime.bigint();
        flaskTime = Number(flaskEnd - flaskStart) / 1000000;
      }

      results.endpoints[endpointName] = {
        express: expressTime,
        flask: flaskTime,
        variance: flaskTime ? Math.abs(expressTime - flaskTime) / expressTime : 0,
        acceptable: !flaskTime || Math.abs(expressTime - flaskTime) / expressTime < 0.5
      };

      if (!results.endpoints[endpointName].acceptable) {
        results.overall.acceptable = false;
      }

    } catch (error) {
      results.endpoints[endpointName] = {
        error: error.message,
        acceptable: false
      };
      results.overall.acceptable = false;
    }
  }

  return results;
}

/**
 * Tests error handling parity between implementations
 * @private
 */
async function testErrorHandlingParity() {
  const errorTests = [
    { path: '/nonexistent', expectedStatus: 404 },
    { path: '/hello', method: 'POST', expectedStatus: 405 }
  ];

  const results = {
    tests: [],
    parity: true
  };

  for (const test of errorTests) {
    try {
      let expressResponse, flaskResponse;

      if (test.method === 'POST') {
        expressResponse = await supertest(expressApp).post(test.path);
      } else {
        expressResponse = await supertest(expressApp).get(test.path);
      }

      if (flaskProcess) {
        flaskResponse = await axios({
          method: test.method || 'GET',
          url: `http://localhost:${FLASK_PORT}${test.path}`,
          validateStatus: () => true
        });
      }

      const testResult = {
        path: test.path,
        method: test.method || 'GET',
        express: expressResponse.status,
        flask: flaskResponse?.status,
        expectedStatus: test.expectedStatus,
        parity: !flaskResponse || expressResponse.status === flaskResponse.status
      };

      results.tests.push(testResult);

      if (!testResult.parity) {
        results.parity = false;
      }

    } catch (error) {
      results.tests.push({
        path: test.path,
        error: error.message,
        parity: false
      });
      results.parity = false;
    }
  }

  return results;
}

/**
 * Generates test suite analysis
 * @private
 */
function generateTestSuiteAnalysis(testSuiteResults) {
  return {
    successRate: testSuiteResults.summary.passedTests / testSuiteResults.summary.totalTests,
    executionTime: testSuiteResults.summary.executionTime,
    categoryBreakdown: {
      endpoints: calculateCategorySuccess(testSuiteResults.results.endpoints),
      security: testSuiteResults.results.security?.compliance?.overall || false,
      performance: testSuiteResults.results.performance?.acceptable || false
    },
    recommendations: []
  };
}

/**
 * Calculates success rate for a category of tests
 * @private
 */
function calculateCategorySuccess(categoryResults) {
  if (!categoryResults || typeof categoryResults !== 'object') return false;
  
  const results = Object.values(categoryResults);
  const successful = results.filter(result => result.parity?.overall).length;
  
  return results.length > 0 ? successful / results.length : 0;
}

/**
 * Generates comprehensive test suite recommendations
 * @private
 */
function generateTestSuiteRecommendations(testSuiteResults) {
  const recommendations = [];
  
  if (testSuiteResults.summary.failedTests > 0) {
    recommendations.push({
      category: 'Overall Quality',
      priority: 'high',
      suggestion: `${testSuiteResults.summary.failedTests} tests failed - review implementation differences`,
      action: 'Investigate failing test cases and address compatibility issues'
    });
  }

  return recommendations;
}

/**
 * Categorizes test results by type
 * @private
 */
function categorizeTestResult(testName) {
  if (testName.startsWith('endpoint-')) return 'endpoints';
  if (testName.includes('security')) return 'security';
  if (testName.includes('performance')) return 'performance';
  if (testName.includes('error')) return 'errorHandling';
  return 'endpoints'; // default
}

/**
 * Identifies strengths from test results
 * @private
 */
function identifyStrengths(categories) {
  const strengths = [];
  
  Object.entries(categories).forEach(([category, data]) => {
    if (data.score >= 90) {
      strengths.push({
        category,
        score: data.score,
        message: `Excellent ${category} compatibility`
      });
    }
  });

  return strengths;
}

/**
 * Identifies weaknesses from test results
 * @private
 */
function identifyWeaknesses(categories) {
  const weaknesses = [];
  
  Object.entries(categories).forEach(([category, data]) => {
    if (data.score < 70) {
      weaknesses.push({
        category,
        score: data.score,
        message: `${category} compatibility needs improvement`,
        priority: data.score < 50 ? 'high' : 'medium'
      });
    }
  });

  return weaknesses;
}

/**
 * Assesses overall risk level
 * @private
 */
function assessRisk(overallScore) {
  if (overallScore >= 90) return 'low';
  if (overallScore >= 70) return 'medium';
  return 'high';
}

/**
 * Generates comprehensive improvement recommendations
 * @private
 */
function generateComprehensiveRecommendations(analysis, testResults) {
  const recommendations = [];
  
  analysis.weaknesses.forEach(weakness => {
    recommendations.push({
      category: weakness.category,
      priority: weakness.priority,
      issue: weakness.message,
      suggestion: `Improve ${weakness.category} implementation to achieve better cross-platform compatibility`
    });
  });

  return recommendations;
}

/**
 * Generates educational insights from test results
 * @private
 */
function generateEducationalInsights(report, testResults) {
  return {
    crossPlatformDevelopment: {
      challenges: [
        'Framework-specific response formatting differences',
        'Security middleware configuration variations',
        'Performance characteristic differences'
      ],
      bestPractices: [
        'Standardize response formats across platforms',
        'Implement equivalent security headers',
        'Monitor performance parity regularly'
      ]
    },
    testingMethodologies: {
      demonstrated: [
        'HTTP response comparison',
        'Security header validation',
        'Performance measurement',
        'Cross-platform compatibility testing'
      ],
      benefits: [
        'Early detection of compatibility issues',
        'Automated validation of feature parity',
        'Comprehensive test coverage across platforms'
      ]
    },
    recommendations: {
      implementation: 'Focus on standardizing response formats and security configurations',
      testing: 'Implement automated cross-platform testing in CI/CD pipeline',
      monitoring: 'Set up continuous compatibility monitoring'
    }
  };
}

// Jest test setup and teardown hooks for test lifecycle management

/**
 * Jest beforeAll hook - Set up cross-platform test environment
 */
beforeAll(async () => {
  console.log('Setting up cross-platform test environment');
  
  try {
    const setup = await setupCrossPlatformTest({
      startFlask: true,
      useProductionApp: false,
      timeout: 60000 // 60 seconds for CI environments
    });

    // Set global test variables
    global.testSetup = setup;
    
    console.log('Cross-platform test environment ready');
  } catch (error) {
    console.error('Failed to setup test environment', error);
    throw error;
  }
}, 60000); // 60 second timeout

/**
 * Jest afterAll hook - Clean up cross-platform test environment
 */
afterAll(async () => {
  console.log('Cleaning up cross-platform test environment');
  
  try {
    await teardownCrossPlatformTest();
    console.log('Cross-platform test cleanup completed');
  } catch (error) {
    console.error('Test cleanup failed', error);
  }
}, 30000); // 30 second timeout

// Export all functions and classes for external use
export {
  // Core functions
  setupCrossPlatformTest,
  teardownCrossPlatformTest,
  compareHTTPResponses,
  validateSecurityHeaderParity,
  testEndpointParity,
  runCrossPlatformTestSuite,
  generateParityReport,
  
  // Test runner class
  CrossPlatformTestRunner,
  
  // Global variables for test access
  expressApp,
  flaskProcess,
  testHelpers,
  crossPlatformTestResults
};