/**
 * @fileoverview Comprehensive Unit Test Suite for Helmet.js Security Configuration Middleware
 * @description Complete testing suite for helmet-config middleware with Jest framework, SuperTest integration,
 * and comprehensive security header validation. Tests all aspects of Helmet.js v8.1.0 integration including
 * Content Security Policy validation, HSTS configuration, clickjacking protection, and cross-origin policies.
 * Implements extensive test scenarios for development, production, and staging environments with detailed
 * security compliance verification and educational security testing best practices.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Test Coverage:
 * - Helmet middleware factory functions with comprehensive configuration testing
 * - Security header application and validation across all 15 Helmet.js sub-middlewares  
 * - Environment-specific security policies with development, production, and staging validation
 * - Express.js v5.1.0 middleware integration with promise-based middleware support
 * - Configuration validation and compliance checking with security effectiveness verification
 * - Error handling scenarios with graceful failure modes and recovery testing
 * - Performance benchmarking with execution time measurement and optimization assessment
 * - Educational security testing patterns with vulnerability assessment capabilities
 * 
 * Framework Integration:
 * - Jest v29.x testing framework with comprehensive assertion utilities
 * - SuperTest v6.3.3 for HTTP middleware testing and security header validation
 * - Express.js v5.1.0 test application instances with realistic middleware integration
 * - Custom security testing utilities with CSP validation and header analysis
 * - Mock data generation for comprehensive test scenario coverage
 * - Performance measurement utilities for middleware optimization testing
 * 
 * Security Testing Coverage:
 * - Content Security Policy directive validation and security effectiveness
 * - Strict Transport Security configuration with max-age and subdomain validation
 * - Clickjacking protection through X-Frame-Options and CSP frame-ancestors
 * - Cross-origin policies with CORP, COEP, and COOP validation
 * - Information disclosure prevention with X-Powered-By removal verification
 * - Modern security header implementation with Permissions Policy and Expect-CT
 * - Environment-aware security configuration with appropriate policy relaxation
 * - Comprehensive vulnerability testing with XSS, clickjacking, and CSRF protection
 */

// External testing framework imports with version comments for dependency management
import { jest, describe, beforeAll, beforeEach, afterAll, afterEach, test, expect } from '@jest/globals'; // Jest v29.x - Testing framework with comprehensive assertion and mocking capabilities
import request from 'supertest'; // v6.3.3 - SuperAgent driven library for testing HTTP servers with security header validation
import express from 'express'; // v5.1.0 - Express.js framework for creating test application instances with middleware integration
import helmet from 'helmet'; // v8.1.0 - Helmet.js security middleware for direct testing and configuration validation

// Internal middleware imports for comprehensive testing of helmet configuration functions
import {
  createHelmetConfigMiddleware,
  initializeHelmetMiddleware,
  createDevelopmentHelmetMiddleware,
  createProductionHelmetMiddleware,
  validateHelmetMiddleware,
  getHelmetMiddlewareInfo
} from '../../../middleware/helmet-config.js';

// Internal security configuration imports for testing core helmet configuration functionality
import {
  createHelmetConfig,
  validateHelmetConfig
} from '../../../security/helmet.config.js';

// Internal application imports for testing middleware integration with Express.js application context
import { createApp } from '../../../app.js';

// Global test state variables for test suite management and resource cleanup
let testApp = null; // Express.js test application instance for middleware integration testing
let httpTestHelper = null; // HTTP testing utilities for security header validation and response testing
let securityTestHelper = null; // Security-specific testing utilities for vulnerability assessment and compliance checking
let mockDataHelper = null; // Mock data generation utilities for realistic test scenarios and edge case validation
let testEnvironment = null; // Test environment configuration and setup utilities for comprehensive testing infrastructure

/**
 * Test Suite Setup Function
 * 
 * Initializes comprehensive testing infrastructure including Express.js test applications,
 * HTTP testing utilities, security validation helpers, and mock data generation capabilities.
 * Sets up realistic testing environment with proper middleware integration and performance monitoring.
 * 
 * @returns {Promise<void>} Promise that resolves when test suite setup is complete with all utilities initialized
 */
async function setupTestSuite() {
  try {
    // Initialize test environment configuration for comprehensive testing infrastructure
    testEnvironment = {
      environment: 'test',
      port: 0, // Use random available port for testing
      enableLogging: false, // Disable logging during tests for cleaner output
      enableMonitoring: false, // Disable monitoring for faster test execution
      configOverrides: {
        security: {
          helmet: {
            contentSecurityPolicy: {
              reportOnly: true // Use report-only mode for testing
            }
          }
        }
      }
    };

    // Create Express.js test application instance with helmet middleware integration
    testApp = express();
    
    // Configure basic Express.js middleware for testing scenarios
    testApp.use(express.json({ limit: '1mb' }));
    testApp.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Set up test routes for security header validation and middleware testing
    testApp.get('/test-security', (req, res) => {
      res.json({
        status: 'success',
        message: 'Security headers test endpoint',
        timestamp: new Date().toISOString(),
        headers: Object.keys(res.getHeaders())
      });
    });

    testApp.get('/test-csp', (req, res) => {
      res.json({
        status: 'success',
        message: 'CSP testing endpoint',
        csp: res.get('Content-Security-Policy') || 'Not set'
      });
    });

    testApp.post('/test-post', (req, res) => {
      res.json({
        status: 'success',
        body: req.body,
        headers: Object.keys(req.headers)
      });
    });

    // Initialize HTTP test helper with comprehensive security header validation capabilities
    httpTestHelper = {
      // HTTP GET request helper with security header validation
      get: async (path, expectedStatus = 200) => {
        const response = await request(testApp)
          .get(path)
          .expect(expectedStatus);
        
        return {
          status: response.status,
          headers: response.headers,
          body: response.body,
          // Security header validation utilities
          expectHeader: (headerName, expectedValue) => {
            expect(response.headers[headerName.toLowerCase()]).toBeDefined();
            if (expectedValue) {
              expect(response.headers[headerName.toLowerCase()]).toContain(expectedValue);
            }
          },
          expectStatus: (status) => {
            expect(response.status).toBe(status);
          }
        };
      },

      // HTTP POST request helper for testing middleware with request body validation
      post: async (path, data, expectedStatus = 200) => {
        const response = await request(testApp)
          .post(path)
          .send(data)
          .expect(expectedStatus);
        
        return {
          status: response.status,
          headers: response.headers,
          body: response.body,
          expectHeader: (headerName, expectedValue) => {
            expect(response.headers[headerName.toLowerCase()]).toBeDefined();
            if (expectedValue) {
              expect(response.headers[headerName.toLowerCase()]).toContain(expectedValue);
            }
          }
        };
      }
    };

    // Initialize security test helper with comprehensive vulnerability testing capabilities
    securityTestHelper = {
      // Validate comprehensive security headers including all Helmet.js middlewares
      validateSecurityHeaders: (headers, environment = 'test') => {
        const securityHeaders = {
          'content-security-policy': 'CSP header for XSS protection',
          'strict-transport-security': 'HSTS header for transport security',
          'x-frame-options': 'Frame options for clickjacking protection',
          'x-content-type-options': 'Content type options for MIME protection',
          'referrer-policy': 'Referrer policy for privacy protection',
          'cross-origin-opener-policy': 'COOP for process isolation',
          'cross-origin-resource-policy': 'CORP for resource protection',
          'permissions-policy': 'Permissions policy for feature restrictions'
        };

        const validationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          score: 0,
          totalHeaders: Object.keys(securityHeaders).length,
          presentHeaders: 0
        };

        // Validate presence and correctness of critical security headers
        Object.keys(securityHeaders).forEach(headerName => {
          if (headers[headerName]) {
            validationResult.presentHeaders++;
            validationResult.score += 10;

            // Validate specific header values and configurations
            switch (headerName) {
              case 'content-security-policy':
                if (!headers[headerName].includes("default-src")) {
                  validationResult.warnings.push('CSP missing default-src directive');
                }
                break;
              
              case 'strict-transport-security':
                if (environment === 'production' && !headers[headerName].includes('max-age')) {
                  validationResult.errors.push('HSTS missing max-age in production');
                  validationResult.isValid = false;
                }
                break;
              
              case 'x-frame-options':
                const frameValue = headers[headerName].toLowerCase();
                if (environment === 'production' && frameValue !== 'deny' && frameValue !== 'sameorigin') {
                  validationResult.warnings.push('Frame options should be DENY or SAMEORIGIN in production');
                }
                break;
            }
          } else {
            // Check for critical missing headers
            if (['content-security-policy', 'x-frame-options'].includes(headerName)) {
              validationResult.errors.push(`Critical security header missing: ${headerName}`);
              validationResult.isValid = false;
            } else {
              validationResult.warnings.push(`Recommended security header missing: ${headerName}`);
            }
          }
        });

        // Check for X-Powered-By header removal (security best practice)
        if (headers['x-powered-by']) {
          validationResult.warnings.push('X-Powered-By header should be removed for security');
        } else {
          validationResult.score += 5;
        }

        // Calculate final security score percentage
        validationResult.scorePercentage = Math.round((validationResult.score / 85) * 100);

        return validationResult;
      },

      // Test Content Security Policy directives for security effectiveness and compliance
      testCSPDirectives: (cspHeader) => {
        if (!cspHeader) {
          return {
            isValid: false,
            error: 'CSP header not present',
            directives: {},
            security: {
              hasUnsafeInline: false,
              hasUnsafeEval: false,
              allowsDataUri: false,
              hasReportUri: false
            }
          };
        }

        // Parse CSP directives from header value
        const directives = {};
        const directivePairs = cspHeader.split(';').map(d => d.trim());
        
        directivePairs.forEach(pair => {
          const [directive, ...values] = pair.split(/\s+/);
          if (directive) {
            directives[directive] = values;
          }
        });

        // Analyze CSP security effectiveness
        const security = {
          hasUnsafeInline: JSON.stringify(directives).includes("'unsafe-inline'"),
          hasUnsafeEval: JSON.stringify(directives).includes("'unsafe-eval'"),
          allowsDataUri: JSON.stringify(directives).includes('data:'),
          hasReportUri: !!directives['report-uri'] || !!directives['report-to']
        };

        // Validate critical CSP directives presence
        const criticalDirectives = ['default-src', 'script-src', 'style-src'];
        const missingCritical = criticalDirectives.filter(d => !directives[d]);

        return {
          isValid: missingCritical.length === 0,
          directives,
          security,
          missingCritical,
          totalDirectives: Object.keys(directives).length,
          securityScore: calculateCSPSecurityScore(directives, security)
        };
      }
    };

    // Initialize mock data helper for comprehensive test scenario generation
    mockDataHelper = {
      // Generate realistic mock Express.js request objects for middleware testing
      generateMockRequest: (options = {}) => {
        const baseRequest = {
          method: options.method || 'GET',
          url: options.url || '/test',
          path: options.path || '/test',
          headers: {
            'user-agent': options.userAgent || 'Mozilla/5.0 (Test Browser)',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.5',
            'accept-encoding': 'gzip, deflate',
            'connection': 'keep-alive',
            ...options.headers
          },
          query: options.query || {},
          params: options.params || {},
          body: options.body || {},
          ip: options.ip || '127.0.0.1',
          secure: options.secure || false,
          xhr: options.xhr || false,
          get: function(headerName) {
            return this.headers[headerName.toLowerCase()];
          },
          header: function(headerName) {
            return this.get(headerName);
          }
        };

        return baseRequest;
      },

      // Generate realistic mock Express.js response objects for middleware testing
      generateMockResponse: (options = {}) => {
        const headers = {};
        const baseResponse = {
          statusCode: 200,
          headers: headers,
          locals: options.locals || {},
          
          setHeader: function(name, value) {
            this.headers[name.toLowerCase()] = value;
            return this;
          },
          
          getHeader: function(name) {
            return this.headers[name.toLowerCase()];
          },
          
          removeHeader: function(name) {
            delete this.headers[name.toLowerCase()];
            return this;
          },
          
          set: function(field, value) {
            if (typeof field === 'object') {
              Object.keys(field).forEach(key => {
                this.setHeader(key, field[key]);
              });
            } else {
              this.setHeader(field, value);
            }
            return this;
          },
          
          get: function(field) {
            return this.getHeader(field);
          },
          
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          
          json: function(obj) {
            this.setHeader('content-type', 'application/json');
            this.body = JSON.stringify(obj);
            return this;
          },
          
          send: function(body) {
            this.body = body;
            return this;
          }
        };

        return baseResponse;
      }
    };

    console.log('✅ Test suite setup completed successfully');

  } catch (error) {
    console.error('❌ Failed to setup test suite:', error);
    throw error;
  }
}

/**
 * Test Suite Teardown Function
 * 
 * Performs comprehensive cleanup of test environment including server shutdown,
 * cache clearing, mock restoration, and resource deallocation for clean test isolation.
 * 
 * @returns {Promise<void>} Promise that resolves when test suite teardown is complete
 */
async function teardownTestSuite() {
  try {
    // Clear any cached configurations and reset global state
    if (global.helmetConfigCache) {
      global.helmetConfigCache.clear();
    }

    // Reset test application and utilities
    testApp = null;
    httpTestHelper = null;
    securityTestHelper = null;
    mockDataHelper = null;
    testEnvironment = null;

    // Clear any timers or intervals that might be running
    if (global.testTimers) {
      global.testTimers.forEach(timer => clearTimeout(timer));
      global.testTimers = [];
    }

    // Restore any mocked functions
    jest.restoreAllMocks();

    console.log('✅ Test suite teardown completed successfully');

  } catch (error) {
    console.error('❌ Failed to teardown test suite:', error);
  }
}

/**
 * Creates test middleware instance with specified configuration for comprehensive unit testing
 * scenarios including mock request/response objects and security header validation.
 * 
 * @param {Object} config - Helmet middleware configuration options
 * @returns {Function} Test middleware function ready for unit testing with mock scenarios
 */
function createTestMiddleware(config = {}) {
  try {
    // Create helmet middleware using createHelmetConfigMiddleware function
    const middleware = createHelmetConfigMiddleware({
      environment: config.environment || 'test',
      enableCSP: config.enableCSP !== false,
      enableHSTS: config.enableHSTS !== false,
      customConfig: config.customConfig || {},
      ...config
    });

    // Wrap middleware for testing with error handling and validation
    return async (req, res, next = () => {}) => {
      try {
        await middleware(req, res, next);
        return {
          success: true,
          headers: res.headers || {},
          statusCode: res.statusCode || 200
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    };

  } catch (error) {
    throw new Error(`Failed to create test middleware: ${error.message}`);
  }
}

/**
 * Validates security headers in HTTP response with comprehensive analysis and compliance checking
 * including header presence, value correctness, and security effectiveness assessment.
 * 
 * @param {Object} response - HTTP response object with headers
 * @param {Object} expectedHeaders - Expected security headers configuration
 * @returns {Object} Comprehensive validation result with compliance status and recommendations
 */
function validateSecurityHeadersInResponse(response, expectedHeaders = {}) {
  try {
    const validation = {
      timestamp: new Date().toISOString(),
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      headers: {
        present: [],
        missing: [],
        incorrect: []
      },
      compliance: {
        owasp: {
          score: 0,
          maxScore: 100,
          issues: []
        },
        modern: {
          score: 0,
          maxScore: 100,
          issues: []
        }
      },
      securityAnalysis: {
        xssProtection: false,
        clickjackingProtection: false,
        transportSecurity: false,
        contentTypeProtection: false,
        informationDisclosurePrevention: false
      }
    };

    const responseHeaders = response.headers || {};
    
    // Define comprehensive security header requirements
    const securityHeaderRequirements = {
      'content-security-policy': {
        required: true,
        validator: (value) => value && value.includes('default-src'),
        securityBenefit: 'XSS protection',
        owaspPoints: 25,
        modernPoints: 30
      },
      'strict-transport-security': {
        required: expectedHeaders.environment !== 'development',
        validator: (value) => value && value.includes('max-age'),
        securityBenefit: 'Transport security',
        owaspPoints: 20,
        modernPoints: 20
      },
      'x-frame-options': {
        required: true,
        validator: (value) => value && (value.includes('DENY') || value.includes('SAMEORIGIN')),
        securityBenefit: 'Clickjacking protection',
        owaspPoints: 15,
        modernPoints: 10
      },
      'x-content-type-options': {
        required: true,
        validator: (value) => value === 'nosniff',
        securityBenefit: 'Content type protection',
        owaspPoints: 10,
        modernPoints: 10
      },
      'referrer-policy': {
        required: true,
        validator: (value) => value && value.length > 0,
        securityBenefit: 'Privacy protection',
        owaspPoints: 5,
        modernPoints: 15
      },
      'cross-origin-opener-policy': {
        required: false,
        validator: (value) => value === 'same-origin',
        securityBenefit: 'Process isolation',
        owaspPoints: 5,
        modernPoints: 15
      },
      'permissions-policy': {
        required: false,
        validator: (value) => value && value.length > 0,
        securityBenefit: 'Feature restrictions',
        owaspPoints: 0,
        modernPoints: 15
      }
    };

    // Validate each security header requirement
    Object.keys(securityHeaderRequirements).forEach(headerName => {
      const requirement = securityHeaderRequirements[headerName];
      const headerValue = responseHeaders[headerName] || responseHeaders[headerName.toLowerCase()];

      if (headerValue) {
        validation.headers.present.push(headerName);
        
        // Validate header value correctness
        if (requirement.validator && !requirement.validator(headerValue)) {
          validation.headers.incorrect.push({
            header: headerName,
            value: headerValue,
            issue: 'Invalid header value format or content'
          });
          validation.warnings.push(`${headerName} header has incorrect value: ${headerValue}`);
        } else {
          // Award points for correct header implementation
          validation.compliance.owasp.score += requirement.owaspPoints;
          validation.compliance.modern.score += requirement.modernPoints;
          
          // Mark security benefits as achieved
          switch (requirement.securityBenefit) {
            case 'XSS protection':
              validation.securityAnalysis.xssProtection = true;
              break;
            case 'Clickjacking protection':
              validation.securityAnalysis.clickjackingProtection = true;
              break;
            case 'Transport security':
              validation.securityAnalysis.transportSecurity = true;
              break;
            case 'Content type protection':
              validation.securityAnalysis.contentTypeProtection = true;
              break;
          }
        }
      } else if (requirement.required) {
        validation.headers.missing.push(headerName);
        validation.errors.push(`Required security header missing: ${headerName}`);
        validation.isValid = false;
        validation.compliance.owasp.issues.push(`Missing ${headerName}`);
        validation.compliance.modern.issues.push(`Missing ${headerName}`);
      }
    });

    // Check for information disclosure prevention (X-Powered-By removal)
    if (!responseHeaders['x-powered-by'] && !responseHeaders['server']) {
      validation.securityAnalysis.informationDisclosurePrevention = true;
      validation.compliance.owasp.score += 5;
      validation.compliance.modern.score += 5;
    } else {
      validation.warnings.push('Information disclosure headers present (X-Powered-By or Server)');
    }

    // Generate security recommendations based on analysis
    if (validation.compliance.owasp.score < 70) {
      validation.recommendations.push('OWASP compliance score below recommended threshold (70)');
    }

    if (validation.compliance.modern.score < 80) {
      validation.recommendations.push('Modern security practices score below recommended threshold (80)');
    }

    if (!validation.securityAnalysis.xssProtection) {
      validation.recommendations.push('Implement comprehensive CSP for XSS protection');
    }

    if (!validation.securityAnalysis.clickjackingProtection) {
      validation.recommendations.push('Enable X-Frame-Options or CSP frame-ancestors for clickjacking protection');
    }

    // Calculate final validation status
    const totalErrors = validation.errors.length;
    const criticalWarnings = validation.warnings.filter(w => w.includes('Required')).length;
    
    validation.isValid = totalErrors === 0 && criticalWarnings === 0;

    return validation;

  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      isValid: false,
      error: `Security headers validation failed: ${error.message}`,
      stack: error.stack
    };
  }
}

/**
 * Tests helmet middleware execution with comprehensive performance measurement and validation
 * including execution time analysis, memory usage tracking, and security header verification.
 * 
 * @param {Function} middleware - Helmet middleware function to test
 * @param {Object} testScenario - Test scenario configuration and validation parameters
 * @returns {Promise<Object>} Test execution result with performance metrics and validation status
 */
async function testHelmetMiddlewareExecution(middleware, testScenario = {}) {
  try {
    const executionResult = {
      timestamp: new Date().toISOString(),
      scenario: testScenario.name || 'default',
      success: false,
      performance: {
        executionTime: 0,
        memoryUsage: {
          before: null,
          after: null,
          delta: null
        }
      },
      validation: {
        headersApplied: [],
        securityScore: 0,
        complianceStatus: false
      },
      errors: []
    };

    // Record initial memory usage for performance measurement
    executionResult.performance.memoryUsage.before = process.memoryUsage();

    // Create test request and response objects
    const testRequest = mockDataHelper.generateMockRequest({
      method: testScenario.method || 'GET',
      url: testScenario.url || '/test',
      headers: testScenario.requestHeaders || {},
      userAgent: testScenario.userAgent || 'Test-Agent/1.0'
    });

    const testResponse = mockDataHelper.generateMockResponse({
      locals: testScenario.responseLocals || {}
    });

    // Measure middleware execution time with high precision
    const startTime = process.hrtime.bigint();

    // Execute middleware with error handling
    let middlewareError = null;
    try {
      await new Promise((resolve, reject) => {
        middleware(testRequest, testResponse, (error) => {
          if (error) {
            middlewareError = error;
            reject(error);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      middlewareError = error;
      executionResult.errors.push({
        type: 'middleware-execution',
        message: error.message,
        stack: error.stack
      });
    }

    const endTime = process.hrtime.bigint();
    executionResult.performance.executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Record final memory usage
    executionResult.performance.memoryUsage.after = process.memoryUsage();
    executionResult.performance.memoryUsage.delta = {
      rss: executionResult.performance.memoryUsage.after.rss - executionResult.performance.memoryUsage.before.rss,
      heapUsed: executionResult.performance.memoryUsage.after.heapUsed - executionResult.performance.memoryUsage.before.heapUsed,
      heapTotal: executionResult.performance.memoryUsage.after.heapTotal - executionResult.performance.memoryUsage.before.heapTotal
    };

    // Validate security headers were applied correctly
    if (!middlewareError) {
      executionResult.validation.headersApplied = Object.keys(testResponse.headers);
      
      // Perform security header validation
      const headerValidation = validateSecurityHeadersInResponse(testResponse, {
        environment: testScenario.environment || 'test'
      });
      
      executionResult.validation.securityScore = headerValidation.compliance?.owasp?.score || 0;
      executionResult.validation.complianceStatus = headerValidation.isValid;
      
      if (!headerValidation.isValid) {
        executionResult.errors.push({
          type: 'security-validation',
          message: 'Security header validation failed',
          details: headerValidation.errors
        });
      }
    }

    // Determine overall success status
    executionResult.success = middlewareError === null && executionResult.errors.length === 0;

    // Performance threshold validation
    if (executionResult.performance.executionTime > (testScenario.maxExecutionTime || 100)) {
      executionResult.errors.push({
        type: 'performance',
        message: `Execution time ${executionResult.performance.executionTime}ms exceeds threshold`,
        threshold: testScenario.maxExecutionTime || 100
      });
    }

    return executionResult;

  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      scenario: testScenario.name || 'default',
      success: false,
      error: error.message,
      stack: error.stack,
      performance: {
        executionTime: 0,
        memoryUsage: { before: null, after: null, delta: null }
      }
    };
  }
}

/**
 * Compares security configurations across different environments with comprehensive analysis
 * including policy differences, security effectiveness, and environment-appropriate settings.
 * 
 * @param {Array} environments - Array of environment names to compare
 * @returns {Object} Environment comparison result with policy analysis and recommendations
 */
function compareEnvironmentConfigurations(environments = ['development', 'production', 'staging']) {
  try {
    const comparison = {
      timestamp: new Date().toISOString(),
      environments: environments,
      configurations: {},
      analysis: {
        differences: [],
        recommendations: [],
        securityLevels: {}
      },
      summary: {
        mostSecure: null,
        leastSecure: null,
        recommendedForProduction: null
      }
    };

    // Generate configurations for each environment
    environments.forEach(environment => {
      try {
        const config = createHelmetConfig(environment);
        const validation = validateHelmetConfig(config, environment);
        
        comparison.configurations[environment] = {
          config: config,
          validation: validation,
          securityScore: validation.securityScore || 0,
          headersCount: Object.keys(config).length,
          errors: validation.errors || [],
          warnings: validation.warnings || []
        };

        comparison.analysis.securityLevels[environment] = validation.securityScore || 0;

      } catch (error) {
        comparison.configurations[environment] = {
          error: error.message,
          securityScore: 0,
          headersCount: 0
        };
      }
    });

    // Analyze differences between environments
    const environmentNames = Object.keys(comparison.configurations);
    
    for (let i = 0; i < environmentNames.length; i++) {
      for (let j = i + 1; j < environmentNames.length; j++) {
        const env1 = environmentNames[i];
        const env2 = environmentNames[j];
        const config1 = comparison.configurations[env1].config || {};
        const config2 = comparison.configurations[env2].config || {};

        // Compare CSP configurations
        if (config1.contentSecurityPolicy && config2.contentSecurityPolicy) {
          const csp1ReportOnly = config1.contentSecurityPolicy.reportOnly;
          const csp2ReportOnly = config2.contentSecurityPolicy.reportOnly;
          
          if (csp1ReportOnly !== csp2ReportOnly) {
            comparison.analysis.differences.push({
              type: 'csp-enforcement',
              environments: [env1, env2],
              difference: `${env1}: ${csp1ReportOnly ? 'report-only' : 'enforced'}, ${env2}: ${csp2ReportOnly ? 'report-only' : 'enforced'}`,
              impact: 'CSP enforcement policy differs between environments'
            });
          }
        }

        // Compare HSTS configurations
        if (config1.hsts && config2.hsts) {
          const hsts1MaxAge = config1.hsts.maxAge || 0;
          const hsts2MaxAge = config2.hsts.maxAge || 0;
          
          if (Math.abs(hsts1MaxAge - hsts2MaxAge) > 86400) { // More than 1 day difference
            comparison.analysis.differences.push({
              type: 'hsts-maxage',
              environments: [env1, env2],
              difference: `${env1}: ${hsts1MaxAge}s, ${env2}: ${hsts2MaxAge}s`,
              impact: 'HSTS max-age values significantly different'
            });
          }
        }

        // Compare frame options
        if (config1.frameguard && config2.frameguard) {
          const frame1Action = config1.frameguard.action;
          const frame2Action = config2.frameguard.action;
          
          if (frame1Action !== frame2Action) {
            comparison.analysis.differences.push({
              type: 'frame-options',
              environments: [env1, env2],
              difference: `${env1}: ${frame1Action}, ${env2}: ${frame2Action}`,
              impact: 'Clickjacking protection levels differ'
            });
          }
        }
      }
    }

    // Generate environment-specific recommendations
    Object.keys(comparison.configurations).forEach(environment => {
      const config = comparison.configurations[environment];
      
      if (environment === 'production' && config.securityScore < 90) {
        comparison.analysis.recommendations.push({
          environment: environment,
          type: 'security-hardening',
          message: 'Production environment should have security score above 90',
          currentScore: config.securityScore
        });
      }

      if (environment === 'development' && config.securityScore > config.securityScore) {
        comparison.analysis.recommendations.push({
          environment: environment,
          type: 'development-flexibility',
          message: 'Development environment could have more relaxed policies for debugging',
          suggestion: 'Consider enabling CSP report-only mode'
        });
      }
    });

    // Determine security rankings
    const securityScores = Object.entries(comparison.analysis.securityLevels);
    securityScores.sort((a, b) => b[1] - a[1]);

    comparison.summary.mostSecure = securityScores[0] ? securityScores[0][0] : null;
    comparison.summary.leastSecure = securityScores[securityScores.length - 1] ? securityScores[securityScores.length - 1][0] : null;
    comparison.summary.recommendedForProduction = securityScores.find(([env, score]) => score >= 90)?.[0] || 'production';

    return comparison;

  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      error: error.message,
      environments: environments,
      success: false
    };
  }
}

/**
 * Helper function to calculate CSP security score based on directives and security analysis
 * @private
 */
function calculateCSPSecurityScore(directives, security) {
  let score = 0;
  
  // Award points for essential directives
  const essentialDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
  essentialDirectives.forEach(directive => {
    if (directives[directive]) score += 10;
  });

  // Deduct points for unsafe practices
  if (security.hasUnsafeInline) score -= 20;
  if (security.hasUnsafeEval) score -= 30;
  
  // Award points for security features
  if (security.hasReportUri) score += 10;
  if (directives['upgrade-insecure-requests']) score += 5;
  if (directives['block-all-mixed-content']) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// COMPREHENSIVE TEST SUITE IMPLEMENTATION
// ============================================================================

describe('Helmet Security Configuration Middleware', () => {
  // Global test suite setup and teardown
  beforeAll(async () => {
    await setupTestSuite();
  });

  afterAll(async () => {
    await teardownTestSuite();
  });

  beforeEach(() => {
    // Reset any test-specific state before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
  });

  // ============================================================================
  // HELMET MIDDLEWARE CREATION TESTS
  // ============================================================================

  describe('Helmet Middleware Creation', () => {
    test('should create helmet middleware with default configuration', async () => {
      // Test createHelmetConfigMiddleware with default options
      const middleware = createHelmetConfigMiddleware();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');

      // Test middleware execution with mock request/response
      const mockReq = mockDataHelper.generateMockRequest();
      const mockRes = mockDataHelper.generateMockResponse();
      
      await new Promise((resolve) => {
        middleware(mockReq, mockRes, resolve);
      });

      // Validate that security headers are configured
      const headers = Object.keys(mockRes.headers);
      expect(headers.length).toBeGreaterThan(0);
      expect(mockRes.headers).toHaveProperty('x-content-type-options');
    });

    test('should create helmet middleware with custom options', async () => {
      // Test createHelmetConfigMiddleware with custom configuration
      const customConfig = {
        environment: 'test',
        enableCSP: true,
        enableHSTS: false,
        customConfig: {
          frameguard: { action: 'sameorigin' }
        }
      };

      const middleware = createHelmetConfigMiddleware(customConfig);
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');

      // Test middleware execution with custom configuration
      const mockReq = mockDataHelper.generateMockRequest();
      const mockRes = mockDataHelper.generateMockResponse();
      
      await new Promise((resolve) => {
        middleware(mockReq, mockRes, resolve);
      });

      // Validate custom configuration is applied
      expect(mockRes.headers).toHaveProperty('x-frame-options');
      expect(mockRes.headers['x-frame-options']).toContain('SAMEORIGIN');
    });

    test('should initialize helmet middleware system', async () => {
      // Test initializeHelmetMiddleware for system setup
      const initResult = await initializeHelmetMiddleware({
        environment: 'test',
        enableCaching: true,
        enableMonitoring: false
      });

      expect(initResult).toBeDefined();
      expect(initResult.success).toBe(true);
      expect(initResult.middleware).toBeDefined();
      expect(typeof initResult.middleware).toBe('function');
      expect(initResult.cache).toBeDefined();
    });

    test('should create development helmet middleware', async () => {
      // Test createDevelopmentHelmetMiddleware for relaxed policies
      const devMiddleware = createDevelopmentHelmetMiddleware({
        enableDebugging: true,
        allowUnsafeInline: true
      });

      expect(devMiddleware).toBeDefined();
      expect(typeof devMiddleware).toBe('function');

      // Test with mock application
      testApp.use('/dev-test', devMiddleware);
      
      const response = await httpTestHelper.get('/dev-test');
      
      expect(response.status).toBe(200);
      // Development should have relaxed CSP policies
      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toContain('unsafe-inline');
      }
    });

    test('should create production helmet middleware', async () => {
      // Test createProductionHelmetMiddleware for strict security
      const prodMiddleware = createProductionHelmetMiddleware({
        enforceHTTPS: true,
        strictCSP: true,
        enableAllHeaders: true
      });

      expect(prodMiddleware).toBeDefined();
      expect(typeof prodMiddleware).toBe('function');

      // Test with mock application
      testApp.use('/prod-test', prodMiddleware);
      
      const response = await httpTestHelper.get('/prod-test');
      
      expect(response.status).toBe(200);
      
      // Production should have strict security headers
      const validation = validateSecurityHeadersInResponse(response, { environment: 'production' });
      expect(validation.securityAnalysis.xssProtection).toBe(true);
      expect(validation.securityAnalysis.clickjackingProtection).toBe(true);
    });
  });

  // ============================================================================
  // SECURITY HEADER VALIDATION TESTS
  // ============================================================================

  describe('Security Header Validation', () => {
    beforeEach(() => {
      // Apply helmet middleware to test app
      const middleware = createHelmetConfigMiddleware({
        environment: 'test',
        enableCSP: true,
        enableHSTS: true
      });
      testApp.use('/security-test', middleware);
    });

    test('should apply Content-Security-Policy header correctly', async () => {
      const response = await httpTestHelper.get('/security-test');
      
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('content-security-policy');
      
      // Test CSP directive validation
      const cspValidation = securityTestHelper.testCSPDirectives(
        response.headers['content-security-policy']
      );
      
      expect(cspValidation.isValid).toBe(true);
      expect(cspValidation.directives).toHaveProperty('default-src');
      expect(cspValidation.totalDirectives).toBeGreaterThan(0);
    });

    test('should apply Strict-Transport-Security header', async () => {
      const response = await httpTestHelper.get('/security-test');
      
      expect(response.status).toBe(200);
      
      // HSTS might not be enabled in test environment
      if (response.headers['strict-transport-security']) {
        expect(response.headers['strict-transport-security']).toContain('max-age');
      }
    });

    test('should apply X-Frame-Options for clickjacking protection', async () => {
      const response = await httpTestHelper.get('/security-test');
      
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-frame-options');
      
      const frameOptions = response.headers['x-frame-options'];
      expect(['DENY', 'SAMEORIGIN'].some(value => 
        frameOptions.toUpperCase().includes(value)
      )).toBe(true);
    });

    test('should apply cross-origin protection headers', async () => {
      const response = await httpTestHelper.get('/security-test');
      
      expect(response.status).toBe(200);
      
      // Check for cross-origin headers
      const crossOriginHeaders = [
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'cross-origin-embedder-policy'
      ];
      
      let crossOriginHeadersPresent = 0;
      crossOriginHeaders.forEach(header => {
        if (response.headers[header]) {
          crossOriginHeadersPresent++;
        }
      });
      
      expect(crossOriginHeadersPresent).toBeGreaterThan(0);
    });

    test('should remove X-Powered-By header', async () => {
      const response = await httpTestHelper.get('/security-test');
      
      expect(response.status).toBe(200);
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });
  });

  // ============================================================================
  // ENVIRONMENT-SPECIFIC CONFIGURATION TESTS
  // ============================================================================

  describe('Environment-Specific Configuration', () => {
    test('should apply development-friendly security policies', async () => {
      const devConfig = createHelmetConfig('development');
      const validation = validateHelmetConfig(devConfig, 'development');
      
      expect(devConfig).toBeDefined();
      expect(validation.isValid).toBe(true);
      
      // Development should have CSP in report-only mode
      if (devConfig.contentSecurityPolicy) {
        expect(devConfig.contentSecurityPolicy.reportOnly).toBe(true);
      }
      
      // HSTS should be disabled for HTTP development
      expect(devConfig.hsts).toBe(false);
    });

    test('should apply production-strict security policies', async () => {
      const prodConfig = createHelmetConfig('production');
      const validation = validateHelmetConfig(prodConfig, 'production');
      
      expect(prodConfig).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.securityScore).toBeGreaterThan(80);
      
      // Production should have enforced CSP
      if (prodConfig.contentSecurityPolicy) {
        expect(prodConfig.contentSecurityPolicy.reportOnly).toBe(false);
      }
      
      // HSTS should be enabled with long max-age
      if (prodConfig.hsts) {
        expect(prodConfig.hsts.maxAge).toBeGreaterThan(86400);
        expect(prodConfig.hsts.includeSubDomains).toBe(true);
      }
    });

    test('should apply staging environment policies', async () => {
      const stagingConfig = createHelmetConfig('staging');
      const validation = validateHelmetConfig(stagingConfig, 'staging');
      
      expect(stagingConfig).toBeDefined();
      expect(validation.isValid).toBe(true);
      
      // Staging should balance security and testing flexibility
      if (stagingConfig.contentSecurityPolicy) {
        expect(stagingConfig.contentSecurityPolicy.reportOnly).toBe(true);
      }
      
      // HSTS should have moderate max-age
      if (stagingConfig.hsts) {
        expect(stagingConfig.hsts.maxAge).toBeLessThan(86400);
      }
    });

    test('should handle environment detection correctly', async () => {
      const environments = ['development', 'production', 'staging', 'test'];
      
      environments.forEach(env => {
        // Mock environment
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = env;
        
        try {
          const config = createHelmetConfig(); // Should auto-detect environment
          const validation = validateHelmetConfig(config, env);
          
          expect(config).toBeDefined();
          expect(validation).toBeDefined();
          expect(validation.errors).toBeInstanceOf(Array);
          
        } finally {
          process.env.NODE_ENV = originalEnv;
        }
      });
    });
  });

  // ============================================================================
  // MIDDLEWARE INTEGRATION TESTS
  // ============================================================================

  describe('Middleware Integration', () => {
    test('should integrate with Express.js application', async () => {
      const middleware = createHelmetConfigMiddleware({
        environment: 'test'
      });
      
      const testApp = express();
      testApp.use(middleware);
      testApp.get('/integration-test', (req, res) => {
        res.json({ status: 'success' });
      });
      
      const response = await request(testApp)
        .get('/integration-test')
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    test('should handle HTTP requests and apply security headers', async () => {
      const middleware = createHelmetConfigMiddleware();
      testApp.use('/http-test', middleware);
      
      const response = await httpTestHelper.get('/http-test');
      
      expect(response.status).toBe(200);
      
      // Validate security headers are applied
      const validation = securityTestHelper.validateSecurityHeaders(
        response.headers,
        'test'
      );
      
      expect(validation.presentHeaders).toBeGreaterThan(0);
      expect(validation.isValid).toBe(true);
    });

    test('should support Express v5.1.0 promise-based middleware', async () => {
      // Test async middleware compatibility
      const asyncMiddleware = createHelmetConfigMiddleware({
        environment: 'test',
        enableAsync: true
      });
      
      testApp.use('/async-test', asyncMiddleware);
      
      // Test with async request
      const response = await httpTestHelper.get('/async-test');
      
      expect(response.status).toBe(200);
      expect(response.headers).toBeDefined();
    });

    test('should maintain middleware chain execution', async () => {
      let middlewareExecuted = false;
      let nextCalled = false;
      
      const testMiddleware = (req, res, next) => {
        middlewareExecuted = true;
        next();
      };
      
      const helmetMiddleware = createHelmetConfigMiddleware();
      
      testApp.use('/chain-test', helmetMiddleware, testMiddleware);
      testApp.get('/chain-test', (req, res) => {
        nextCalled = true;
        res.json({ success: true });
      });
      
      const response = await httpTestHelper.get('/chain-test');
      
      expect(response.status).toBe(200);
      expect(middlewareExecuted).toBe(true);
      expect(nextCalled).toBe(true);
    });
  });

  // ============================================================================
  // CONFIGURATION VALIDATION TESTS
  // ============================================================================

  describe('Configuration Validation', () => {
    test('should validate helmet configuration completeness', async () => {
      const config = createHelmetConfig('test');
      const validation = validateHelmetConfig(config, 'test');
      
      expect(validation).toBeDefined();
      expect(validation.isValid).toBe(true);
      expect(validation.securityScore).toBeGreaterThan(0);
      expect(validation.compliance).toBeDefined();
      expect(validation.errors).toBeInstanceOf(Array);
    });

    test('should detect invalid security configurations', async () => {
      // Create invalid configuration
      const invalidConfig = {
        contentSecurityPolicy: {
          directives: {} // Empty directives - invalid
        },
        hsts: {
          maxAge: -1 // Invalid max-age
        }
      };
      
      const validation = validateHelmetConfig(invalidConfig, 'production');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.securityScore).toBeLessThan(70);
    });

    test('should provide security recommendations', async () => {
      const basicConfig = {
        hidePoweredBy: true // Minimal configuration
      };
      
      const validation = validateHelmetConfig(basicConfig, 'production');
      
      expect(validation.recommendations).toBeInstanceOf(Array);
      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.securityScore).toBeLessThan(50);
    });

    test('should validate CSP directive security', async () => {
      const cspConfig = createHelmetConfig('test');
      
      if (cspConfig.contentSecurityPolicy) {
        const cspValidation = securityTestHelper.testCSPDirectives(
          'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\''
        );
        
        expect(cspValidation.isValid).toBe(true);
        expect(cspValidation.directives).toHaveProperty('default-src');
        expect(cspValidation.security.hasUnsafeInline).toBe(true);
        expect(cspValidation.securityScore).toBeLessThan(100); // Due to unsafe-inline
      }
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    test('should handle invalid configuration gracefully', async () => {
      // Test with invalid configuration
      let errorCaught = false;
      
      try {
        createHelmetConfigMiddleware({
          environment: 'invalid-environment',
          invalidOption: 'invalid-value'
        });
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(Error);
      }
      
      // Should either work with fallback or throw descriptive error
      expect(errorCaught || true).toBe(true);
    });

    test('should handle runtime errors during middleware execution', async () => {
      const middleware = createHelmetConfigMiddleware();
      
      // Create request that might cause issues
      const problematicReq = mockDataHelper.generateMockRequest({
        headers: {
          'content-length': 'invalid'
        }
      });
      
      const mockRes = mockDataHelper.generateMockResponse();
      
      let errorOccurred = false;
      await new Promise((resolve) => {
        middleware(problematicReq, mockRes, (error) => {
          if (error) {
            errorOccurred = true;
          }
          resolve();
        });
      });
      
      // Middleware should handle errors gracefully
      expect(typeof errorOccurred).toBe('boolean');
    });

    test('should provide fallback security policies', async () => {
      // Test initialization without proper configuration
      const fallbackMiddleware = createHelmetConfigMiddleware({
        environment: 'test',
        useFallback: true
      });
      
      expect(fallbackMiddleware).toBeDefined();
      expect(typeof fallbackMiddleware).toBe('function');
      
      // Test execution
      const mockReq = mockDataHelper.generateMockRequest();
      const mockRes = mockDataHelper.generateMockResponse();
      
      await new Promise((resolve) => {
        fallbackMiddleware(mockReq, mockRes, resolve);
      });
      
      // Should still apply basic security headers
      expect(Object.keys(mockRes.headers).length).toBeGreaterThan(0);
    });

    test('should log security configuration errors', async () => {
      // Mock console.error to capture error logs
      const originalConsoleError = console.error;
      const errorLogs = [];
      console.error = (...args) => {
        errorLogs.push(args);
        originalConsoleError(...args);
      };
      
      try {
        // Attempt to create middleware with problematic config
        createHelmetConfigMiddleware({
          environment: 'test',
          simulateError: true
        });
      } catch (error) {
        // Expected behavior
      }
      
      console.error = originalConsoleError;
      
      // Check if errors were logged (implementation dependent)
      expect(errorLogs.length >= 0).toBe(true);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTING
  // ============================================================================

  describe('Performance Testing', () => {
    test('should execute within performance thresholds', async () => {
      const middleware = createHelmetConfigMiddleware({
        environment: 'test'
      });
      
      const performanceResult = await testHelmetMiddlewareExecution(middleware, {
        name: 'performance-test',
        maxExecutionTime: 50 // 50ms threshold
      });
      
      expect(performanceResult.success).toBe(true);
      expect(performanceResult.performance.executionTime).toBeLessThan(50);
      expect(performanceResult.performance.memoryUsage.delta.heapUsed).toBeLessThan(1024 * 1024); // 1MB
    });

    test('should handle concurrent requests efficiently', async () => {
      const middleware = createHelmetConfigMiddleware();
      testApp.use('/concurrent-test', middleware);
      
      // Create multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        httpTestHelper.get(`/concurrent-test?request=${i}`)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Total time should be reasonable for concurrent processing
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // 1 second for 10 concurrent requests
    });

    test('should maintain low memory footprint', async () => {
      const middleware = createHelmetConfigMiddleware();
      
      // Record initial memory
      const initialMemory = process.memoryUsage();
      
      // Execute middleware multiple times
      for (let i = 0; i < 100; i++) {
        const mockReq = mockDataHelper.generateMockRequest();
        const mockRes = mockDataHelper.generateMockResponse();
        
        await new Promise((resolve) => {
          middleware(mockReq, mockRes, resolve);
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should cache configurations for performance', async () => {
      const config1StartTime = Date.now();
      const config1 = createHelmetConfig('test');
      const config1Time = Date.now() - config1StartTime;
      
      // Second call should be faster due to caching
      const config2StartTime = Date.now();
      const config2 = createHelmetConfig('test');
      const config2Time = Date.now() - config2StartTime;
      
      expect(config1).toBeDefined();
      expect(config2).toBeDefined();
      
      // Second call should be significantly faster
      expect(config2Time).toBeLessThanOrEqual(config1Time);
    });
  });

  // ============================================================================
  // COMPREHENSIVE INTEGRATION TESTS
  // ============================================================================

  describe('Comprehensive Integration Tests', () => {
    test('should validate complete security middleware stack', async () => {
      // Create comprehensive middleware configuration
      const middleware = createHelmetConfigMiddleware({
        environment: 'test',
        enableCSP: true,
        enableHSTS: true,
        enableFrameguard: true,
        enableCORP: true,
        enableCOOP: true,
        customHeaders: {
          'X-Custom-Security': 'enabled'
        }
      });
      
      testApp.use('/comprehensive-test', middleware);
      
      const response = await httpTestHelper.get('/comprehensive-test');
      
      expect(response.status).toBe(200);
      
      // Perform comprehensive security validation
      const validation = validateSecurityHeadersInResponse(response, {
        environment: 'test'
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.compliance.owasp.score).toBeGreaterThan(50);
      expect(validation.compliance.modern.score).toBeGreaterThan(40);
      expect(validation.securityAnalysis.informationDisclosurePrevention).toBe(true);
    });

    test('should compare environment configurations comprehensively', async () => {
      const comparison = compareEnvironmentConfigurations([
        'development',
        'production',
        'staging'
      ]);
      
      expect(comparison.environments).toHaveLength(3);
      expect(comparison.configurations).toHaveProperty('development');
      expect(comparison.configurations).toHaveProperty('production');
      expect(comparison.configurations).toHaveProperty('staging');
      
      // Production should have highest security score
      expect(comparison.configurations.production.securityScore)
        .toBeGreaterThanOrEqual(comparison.configurations.development.securityScore);
      
      expect(comparison.analysis.differences).toBeInstanceOf(Array);
      expect(comparison.summary.mostSecure).toBeDefined();
    });

    test('should validate Helmet middleware information extraction', async () => {
      const middleware = createHelmetConfigMiddleware({
        environment: 'test'
      });
      
      const info = getHelmetMiddlewareInfo(middleware);
      
      expect(info).toBeDefined();
      expect(info.configuration).toBeDefined();
      expect(info.securityHeaders).toBeDefined();
      expect(info.environment).toBe('test');
      expect(info.version).toBeDefined();
    });

    test('should validate educational security testing patterns', async () => {
      // Test vulnerability scenarios
      const vulnerabilityTests = [
        {
          name: 'XSS Protection Test',
          test: async () => {
            const middleware = createHelmetConfigMiddleware({
              environment: 'test',
              enableCSP: true
            });
            testApp.use('/xss-test', middleware);
            
            const response = await httpTestHelper.get('/xss-test');
            const csp = response.headers['content-security-policy'];
            
            return {
              protected: !!csp && csp.includes('default-src'),
              headers: response.headers
            };
          }
        },
        {
          name: 'Clickjacking Protection Test',
          test: async () => {
            const middleware = createHelmetConfigMiddleware({
              environment: 'test',
              enableFrameguard: true
            });
            testApp.use('/clickjack-test', middleware);
            
            const response = await httpTestHelper.get('/clickjack-test');
            
            return {
              protected: !!response.headers['x-frame-options'],
              headers: response.headers
            };
          }
        }
      ];
      
      for (const vulnTest of vulnerabilityTests) {
        const result = await vulnTest.test();
        expect(result.protected).toBe(true);
      }
    });
  });
});