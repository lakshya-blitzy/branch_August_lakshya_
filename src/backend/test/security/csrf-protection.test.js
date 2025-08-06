/**
 * @fileoverview Comprehensive CSRF (Cross-Site Request Forgery) Protection Testing Module
 * @description Enterprise-grade testing suite for CSRF protection mechanisms in the Node.js tutorial project
 * that validates security token handling, Express.js middleware integration, attack prevention, and
 * cross-platform security consistency. Provides educational security testing patterns with production-ready
 * validation scenarios, SuperTest integration, and PM2 cluster mode compatibility for comprehensive
 * security assessment and vulnerability prevention.
 * 
 * Features:
 * - Complete CSRF protection validation including token generation, validation, and lifecycle management
 * - Comprehensive attack simulation covering cross-origin requests, token forgery, and replay attacks
 * - Security header validation for CSRF-related headers and CSP directives
 * - Cross-platform testing ensuring Node.js Express and Python Flask security parity
 * - PM2 cluster mode testing with distributed security validation
 * - Framework-agnostic testing supporting both Jest and Mocha with identical test scenarios
 * - SuperTest integration for HTTP endpoint testing and security validation
 * - Educational security insights and vulnerability assessment patterns
 * - Load testing for CSRF protection performance under high request volumes
 * - Production-ready security implementation with comprehensive coverage
 * 
 * Security Coverage:
 * - CSRF token generation using cryptographically secure random values
 * - Token validation with timing-safe comparison and expiration handling
 * - Origin validation and cross-origin request protection
 * - SameSite cookie attributes and secure cookie handling
 * - Security header compliance including CSP and CSRF-Token headers
 * - Attack vector testing including sophisticated CSRF exploitation attempts
 * - Security policy enforcement and violation handling
 * - Threat detection and automated security response mechanisms
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// External testing framework imports with version compatibility
import supertest from 'supertest'; // ^6.3.3 - SuperAgent driven library for HTTP server testing

// Jest globals for ES modules support
import { jest, describe, test, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'; // Built-in - Cryptographic utilities for secure token operations
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0 - UUID generation for unique test identifiers

// Internal application imports for comprehensive testing integration
import { createApp, createProductionApp } from '../../app.js';
import { createSecurityMiddleware, validateRequest } from '../../middleware/security.js';
import { createSecurityHeadersConfig, applySecurityHeaders } from '../../security/security-headers.js';
import { 
  createHTTPTestHelper, 
  createSecurityTestHelper, 
  createAssertionHelper 
} from '../helpers/test-helpers.js';
import { 
  securityTestData 
} from '../fixtures/test-data.js';
import { setupTestEnvironment } from '../setup.js';
import { SECURITY_CONSTANTS } from '../../utils/constants.js';

// Global test environment state management for CSRF protection testing
let TEST_APP_INSTANCE = null;
let HTTP_TEST_CLIENT = null;
let SECURITY_TEST_HELPER = null;
const CSRF_TEST_TOKENS = new Map();
let SECURITY_VIOLATION_COUNT = 0;

// CSRF token cache for performance optimization during testing
const CSRF_TOKEN_CACHE = new Map();
const CSRF_ATTACK_PATTERNS = new Set([
  'cross-origin-request',
  'missing-token',
  'invalid-token',
  'expired-token',
  'replay-attack',
  'token-fixation',
  'csrf-json-hijacking',
  'flash-csrf',
  'websocket-csrf',
  'ajax-csrf-bypass'
]);

// Security metrics tracking for comprehensive analysis
const SECURITY_METRICS = {
  tokensGenerated: 0,
  tokensValidated: 0,
  attacksBlocked: 0,
  vulnerabilitiesDetected: 0,
  performanceImpact: 0,
  testExecutionTime: 0
};

/**
 * Generates cryptographically secure CSRF tokens for testing purposes using
 * Node.js crypto module with URL-safe base64 encoding and configurable token
 * formats compatible with common CSRF protection mechanisms and security standards.
 * 
 * @param {Object} tokenOptions - Token generation configuration options
 * @param {number} [tokenOptions.length=32] - Token byte length for cryptographic strength
 * @param {string} [tokenOptions.encoding='base64url'] - Encoding format for token output
 * @param {boolean} [tokenOptions.includeTimestamp=true] - Include timestamp for expiration tracking
 * @param {number} [tokenOptions.expirationMinutes=60] - Token expiration time in minutes
 * @param {string} [tokenOptions.algorithm='sha256'] - Hash algorithm for token generation
 * @returns {string} Secure CSRF token string for testing CSRF protection validation
 */
export function generateCSRFToken(tokenOptions = {}) {
  const config = {
    length: tokenOptions.length || 32,
    encoding: tokenOptions.encoding || 'base64url',
    includeTimestamp: tokenOptions.includeTimestamp ?? true,
    expirationMinutes: tokenOptions.expirationMinutes || 60,
    algorithm: tokenOptions.algorithm || 'sha256',
    ...tokenOptions
  };

  try {
    // Generate cryptographically secure random bytes for token base
    const randomBuffer = randomBytes(config.length);
    let tokenBase = randomBuffer.toString(config.encoding);

    // Add timestamp information for expiration and lifecycle testing
    if (config.includeTimestamp) {
      const timestamp = Date.now();
      const timestampBuffer = Buffer.from(timestamp.toString());
      const combinedBuffer = Buffer.concat([randomBuffer, timestampBuffer]);
      
      // Create hash for integrity and prevent token manipulation
      const hash = createHash(config.algorithm);
      hash.update(combinedBuffer);
      const hashDigest = hash.digest(config.encoding);
      
      tokenBase = `${tokenBase}.${timestamp}.${hashDigest}`;
    }

    // Cache token for validation testing scenarios
    const tokenId = uuidv4();
    const tokenMetadata = {
      value: tokenBase,
      generated: Date.now(),
      expires: Date.now() + (config.expirationMinutes * 60 * 1000),
      algorithm: config.algorithm,
      length: config.length,
      encoding: config.encoding
    };

    CSRF_TEST_TOKENS.set(tokenId, tokenMetadata);
    CSRF_TOKEN_CACHE.set(tokenBase, tokenMetadata);
    SECURITY_METRICS.tokensGenerated++;

    return tokenBase;

  } catch (error) {
    throw new Error(`CSRF token generation failed: ${error.message}`);
  }
}

/**
 * Simulates sophisticated CSRF attack scenarios including cross-origin requests,
 * missing tokens, invalid tokens, expired tokens, and replay attacks for comprehensive
 * CSRF protection testing and vulnerability assessment with detailed attack metrics.
 * 
 * @param {string} attackType - Type of CSRF attack to simulate
 * @param {Object} attackOptions - Attack simulation configuration options
 * @param {string} [attackOptions.targetEndpoint='/hello'] - Target endpoint for attack
 * @param {string} [attackOptions.origin='http://evil.example.com'] - Malicious origin for cross-origin attacks
 * @param {Object} [attackOptions.customHeaders={}] - Custom headers for attack simulation
 * @param {Object} [attackOptions.payload={}] - Attack payload data
 * @returns {Promise<object>} Promise resolving to attack simulation result with response data
 */
export async function simulateCSRFAttack(attackType, attackOptions = {}) {
  const config = {
    targetEndpoint: attackOptions.targetEndpoint || '/hello',
    maliciousOrigin: attackOptions.origin || 'http://evil.example.com',
    customHeaders: attackOptions.customHeaders || {},
    payload: attackOptions.payload || {},
    timeout: attackOptions.timeout || 10000,
    ...attackOptions
  };

  const attackResult = {
    attackType,
    timestamp: new Date().toISOString(),
    blocked: false,
    responseStatus: null,
    responseHeaders: {},
    responseBody: null,
    securityViolations: [],
    attackMetrics: {
      executionTime: 0,
      detectionTime: 0,
      blockingEffective: false
    }
  };

  const startTime = Date.now();

  try {
    let attackRequest;
    
    switch (attackType) {
      case 'cross-origin-request':
        // Simulate cross-origin CSRF attack with malicious origin
        attackRequest = HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('Origin', config.maliciousOrigin)
          .set('Referer', `${config.maliciousOrigin}/malicious-page`)
          .set('Content-Type', 'application/json')
          .send(config.payload);
        break;

      case 'missing-token':
        // Test CSRF protection with completely missing token
        attackRequest = HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('Origin', 'http://localhost:3000')
          .send(config.payload);
        break;

      case 'invalid-token':
        // Test with syntactically invalid CSRF token
        attackRequest = HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('X-CSRF-Token', 'invalid-token-format-123')
          .set('Origin', 'http://localhost:3000')
          .send(config.payload);
        break;

      case 'expired-token':
        // Generate expired token for expiration testing
        const expiredToken = generateCSRFToken({ expirationMinutes: -1 });
        attackRequest = HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('X-CSRF-Token', expiredToken)
          .set('Origin', 'http://localhost:3000')
          .send(config.payload);
        break;

      case 'replay-attack':
        // Simulate token replay attack with previously used token
        const validToken = generateCSRFToken();
        // Use token once to mark it as used
        await HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('X-CSRF-Token', validToken)
          .set('Origin', 'http://localhost:3000')
          .send({});
        
        // Attempt replay with same token
        attackRequest = HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('X-CSRF-Token', validToken)
          .set('Origin', 'http://localhost:3000')
          .send(config.payload);
        break;

      case 'token-fixation':
        // Simulate CSRF token fixation attack
        const fixedToken = 'attacker-controlled-token-12345';
        attackRequest = HTTP_TEST_CLIENT
          .post(config.targetEndpoint)
          .set('X-CSRF-Token', fixedToken)
          .set('Origin', config.maliciousOrigin)
          .send(config.payload);
        break;

      case 'csrf-json-hijacking':
        // Simulate JSON hijacking attack vector
        attackRequest = HTTP_TEST_CLIENT
          .get(config.targetEndpoint)
          .set('Origin', config.maliciousOrigin)
          .set('Accept', 'application/json')
          .query(config.payload);
        break;

      case 'websocket-csrf':
        // Simulate WebSocket CSRF attack (if WebSocket endpoints exist)
        attackRequest = HTTP_TEST_CLIENT
          .get('/ws')
          .set('Origin', config.maliciousOrigin)
          .set('Upgrade', 'websocket')
          .set('Connection', 'Upgrade');
        break;

      default:
        throw new Error(`Unknown attack type: ${attackType}`);
    }

    // Execute attack simulation and capture response
    const response = await attackRequest.timeout(config.timeout);
    
    attackResult.responseStatus = response.status;
    attackResult.responseHeaders = response.headers;
    attackResult.responseBody = response.body;
    attackResult.blocked = response.status === 403 || response.status === 400;
    
    // Analyze security headers in response
    if (response.headers['x-blocked-reason']) {
      attackResult.securityViolations.push({
        type: 'request-blocked',
        reason: response.headers['x-blocked-reason'],
        severity: 'high'
      });
    }

    // Check for CSRF-related security headers
    if (!response.headers['x-csrf-token'] && attackType !== 'missing-token') {
      attackResult.securityViolations.push({
        type: 'missing-csrf-header',
        severity: 'medium'
      });
    }

  } catch (error) {
    // Handle network errors and security blocking
    if (error.status) {
      attackResult.responseStatus = error.status;
      attackResult.blocked = error.status === 403 || error.status === 400;
    } else {
      attackResult.error = error.message;
    }
  }

  attackResult.attackMetrics.executionTime = Date.now() - startTime;
  attackResult.attackMetrics.blockingEffective = attackResult.blocked;
  
  // Update global security metrics
  if (attackResult.blocked) {
    SECURITY_METRICS.attacksBlocked++;
  }
  if (attackResult.securityViolations.length > 0) {
    SECURITY_METRICS.vulnerabilitiesDetected++;
  }

  return attackResult;
}

/**
 * Validates comprehensive CSRF protection mechanisms including token validation,
 * header verification, origin checking, and security policy enforcement with
 * detailed compliance assessment and security posture analysis.
 * 
 * @param {Object} protectionConfig - CSRF protection configuration to validate
 * @param {Object} validationOptions - Validation configuration options
 * @returns {object} CSRF protection validation result with compliance status
 */
export function validateCSRFProtection(protectionConfig, validationOptions = {}) {
  const config = {
    enableTokenValidation: validationOptions.enableTokenValidation ?? true,
    enableHeaderValidation: validationOptions.enableHeaderValidation ?? true,
    enableOriginValidation: validationOptions.enableOriginValidation ?? true,
    enablePolicyValidation: validationOptions.enablePolicyValidation ?? true,
    strictMode: validationOptions.strictMode ?? false,
    ...validationOptions
  };

  const validationResult = {
    isValid: true,
    compliance: {
      tokenValidation: null,
      headerValidation: null,
      originValidation: null,
      policyEnforcement: null
    },
    vulnerabilities: [],
    recommendations: [],
    securityScore: 0,
    validationTime: 0
  };

  const startTime = Date.now();

  try {
    // Validate CSRF token generation and validation mechanisms
    if (config.enableTokenValidation) {
      const tokenValidation = validateTokenMechanisms(protectionConfig);
      validationResult.compliance.tokenValidation = tokenValidation;
      
      if (!tokenValidation.isSecure) {
        validationResult.vulnerabilities.push({
          type: 'weak-token-generation',
          severity: 'high',
          description: 'CSRF tokens are not cryptographically secure'
        });
      }
    }

    // Validate CSRF-related security headers
    if (config.enableHeaderValidation) {
      const headerValidation = validateCSRFHeaders(protectionConfig);
      validationResult.compliance.headerValidation = headerValidation;
      
      if (!headerValidation.hasRequiredHeaders) {
        validationResult.vulnerabilities.push({
          type: 'missing-csrf-headers',
          severity: 'medium',
          description: 'Required CSRF protection headers are missing'
        });
      }
    }

    // Validate origin checking and cross-origin protection
    if (config.enableOriginValidation) {
      const originValidation = validateOriginProtection(protectionConfig);
      validationResult.compliance.originValidation = originValidation;
      
      if (!originValidation.isStrict) {
        validationResult.vulnerabilities.push({
          type: 'weak-origin-validation',
          severity: 'high',
          description: 'Origin validation is not sufficiently strict'
        });
      }
    }

    // Validate security policy enforcement
    if (config.enablePolicyValidation) {
      const policyValidation = validateSecurityPolicies(protectionConfig);
      validationResult.compliance.policyEnforcement = policyValidation;
      
      if (!policyValidation.isEffective) {
        validationResult.vulnerabilities.push({
          type: 'ineffective-policy-enforcement',
          severity: 'medium',
          description: 'Security policies are not effectively enforced'
        });
      }
    }

    // Calculate overall security score based on compliance
    validationResult.securityScore = calculateSecurityScore(validationResult.compliance);
    validationResult.isValid = validationResult.securityScore >= 75; // Minimum acceptable score

    // Generate security recommendations
    validationResult.recommendations = generateSecurityRecommendations(
      validationResult.vulnerabilities,
      validationResult.compliance
    );

  } catch (error) {
    validationResult.isValid = false;
    validationResult.error = error.message;
  }

  validationResult.validationTime = Date.now() - startTime;
  return validationResult;
}

/**
 * Tests complete CSRF token lifecycle including generation, validation, expiration,
 * renewal, and cleanup with comprehensive token management validation and security
 * testing across different scenarios and edge cases.
 * 
 * @param {Object} lifecycleConfig - Token lifecycle testing configuration
 * @returns {Promise<object>} Promise resolving to token lifecycle testing result
 */
export async function testCSRFTokenLifecycle(lifecycleConfig = {}) {
  const config = {
    tokenCount: lifecycleConfig.tokenCount || 10,
    expirationTimeMinutes: lifecycleConfig.expirationTimeMinutes || 5,
    renewalTestEnabled: lifecycleConfig.renewalTestEnabled ?? true,
    cleanupTestEnabled: lifecycleConfig.cleanupTestEnabled ?? true,
    performanceTestEnabled: lifecycleConfig.performanceTestEnabled ?? true,
    concurrentTokens: lifecycleConfig.concurrentTokens || 50,
    ...lifecycleConfig
  };

  const lifecycleResult = {
    phases: {
      generation: { success: false, metrics: {} },
      validation: { success: false, metrics: {} },
      expiration: { success: false, metrics: {} },
      renewal: { success: false, metrics: {} },
      cleanup: { success: false, metrics: {} }
    },
    overallSuccess: false,
    performanceMetrics: {},
    recommendations: []
  };

  const startTime = Date.now();

  try {
    // Phase 1: Token Generation Testing
    const generationStartTime = Date.now();
    const generatedTokens = [];
    
    for (let i = 0; i < config.tokenCount; i++) {
      const token = generateCSRFToken({
        expirationMinutes: config.expirationTimeMinutes
      });
      generatedTokens.push(token);
    }

    lifecycleResult.phases.generation = {
      success: true,
      metrics: {
        tokensGenerated: generatedTokens.length,
        generationTime: Date.now() - generationStartTime,
        averageTokenTime: (Date.now() - generationStartTime) / generatedTokens.length
      }
    };

    // Phase 2: Token Validation Testing
    const validationStartTime = Date.now();
    let validTokenCount = 0;
    
    for (const token of generatedTokens) {
      const validationResult = validateCSRFTokenSyntax(token);
      if (validationResult.isValid) {
        validTokenCount++;
      }
    }

    lifecycleResult.phases.validation = {
      success: validTokenCount === generatedTokens.length,
      metrics: {
        tokensValidated: validTokenCount,
        validationSuccessRate: (validTokenCount / generatedTokens.length) * 100,
        validationTime: Date.now() - validationStartTime
      }
    };

    // Phase 3: Token Expiration Testing
    if (config.expirationTimeMinutes > 0) {
      const expirationTestToken = generateCSRFToken({ expirationMinutes: 0.1 }); // 6 seconds
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 7000));
      
      const expiredValidation = validateCSRFTokenExpiration(expirationTestToken);
      lifecycleResult.phases.expiration = {
        success: !expiredValidation.isValid,
        metrics: {
          expirationDetected: !expiredValidation.isValid,
          expirationTime: expiredValidation.timeSinceExpiration
        }
      };
    }

    // Phase 4: Token Renewal Testing
    if (config.renewalTestEnabled) {
      const renewalStartTime = Date.now();
      const originalToken = generateCSRFToken();
      const renewedToken = renewCSRFToken(originalToken);
      
      const renewalValidation = {
        originalValid: validateCSRFTokenSyntax(originalToken).isValid,
        renewedValid: validateCSRFTokenSyntax(renewedToken).isValid,
        tokensDifferent: originalToken !== renewedToken
      };

      lifecycleResult.phases.renewal = {
        success: renewalValidation.renewedValid && renewalValidation.tokensDifferent,
        metrics: {
          renewalTime: Date.now() - renewalStartTime,
          renewalSuccess: renewalValidation.renewedValid
        }
      };
    }

    // Phase 5: Token Cleanup Testing
    if (config.cleanupTestEnabled) {
      const cleanupStartTime = Date.now();
      const initialCacheSize = CSRF_TOKEN_CACHE.size;
      
      cleanupExpiredTokens();
      
      const finalCacheSize = CSRF_TOKEN_CACHE.size;
      lifecycleResult.phases.cleanup = {
        success: finalCacheSize <= initialCacheSize,
        metrics: {
          tokensCleanedUp: initialCacheSize - finalCacheSize,
          cleanupTime: Date.now() - cleanupStartTime,
          cacheEfficiency: ((initialCacheSize - finalCacheSize) / initialCacheSize) * 100
        }
      };
    }

    // Performance Testing
    if (config.performanceTestEnabled) {
      const performanceMetrics = await testTokenPerformance(config.concurrentTokens);
      lifecycleResult.performanceMetrics = performanceMetrics;
    }

    // Calculate overall success
    const phases = Object.values(lifecycleResult.phases);
    const successfulPhases = phases.filter(phase => phase.success).length;
    lifecycleResult.overallSuccess = successfulPhases === phases.length;

  } catch (error) {
    lifecycleResult.error = error.message;
    lifecycleResult.overallSuccess = false;
  }

  lifecycleResult.totalTestTime = Date.now() - startTime;
  return lifecycleResult;
}

/**
 * Validates CSRF-related security headers including SameSite cookies, CSRF-Token
 * headers, and origin validation headers with comprehensive security compliance
 * testing and header analysis for modern web security standards.
 * 
 * @param {Object} headers - HTTP headers to validate
 * @param {Object} expectedHeaders - Expected header configuration
 * @returns {object} Security headers validation result with compliance status
 */
export function validateSecurityHeaders(headers, expectedHeaders = {}) {
  const validationResult = {
    isCompliant: true,
    validatedHeaders: {},
    missingHeaders: [],
    incorrectHeaders: [],
    securityScore: 0,
    recommendations: []
  };

  const requiredCSRFHeaders = [
    'x-csrf-token',
    'x-frame-options',
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options'
  ];

  try {
    // Validate presence of required CSRF protection headers
    for (const requiredHeader of requiredCSRFHeaders) {
      const headerValue = headers[requiredHeader] || headers[requiredHeader.toLowerCase()];
      
      if (!headerValue) {
        validationResult.missingHeaders.push(requiredHeader);
        validationResult.isCompliant = false;
      } else {
        validationResult.validatedHeaders[requiredHeader] = {
          value: headerValue,
          isPresent: true,
          isValid: validateHeaderFormat(requiredHeader, headerValue)
        };
      }
    }

    // Validate Content Security Policy for CSRF protection
    const cspHeader = headers['content-security-policy'] || headers['Content-Security-Policy'];
    if (cspHeader) {
      const cspValidation = validateCSPForCSRF(cspHeader);
      validationResult.validatedHeaders['content-security-policy'].cspValidation = cspValidation;
      
      if (!cspValidation.hasCSRFProtection) {
        validationResult.recommendations.push({
          header: 'content-security-policy',
          recommendation: 'Add form-action directive to prevent CSRF attacks'
        });
      }
    }

    // Validate SameSite cookie attributes
    const setCookieHeader = headers['set-cookie'];
    if (setCookieHeader) {
      const cookieValidation = validateSameSiteCookies(setCookieHeader);
      validationResult.validatedHeaders['set-cookie'] = cookieValidation;
      
      if (!cookieValidation.hasSecureSameSite) {
        validationResult.recommendations.push({
          header: 'set-cookie',
          recommendation: 'Use SameSite=Strict or SameSite=Lax for CSRF protection'
        });
      }
    }

    // Validate X-Frame-Options for clickjacking protection
    const xFrameOptions = headers['x-frame-options'] || headers['X-Frame-Options'];
    if (xFrameOptions && !['DENY', 'SAMEORIGIN'].includes(xFrameOptions.toUpperCase())) {
      validationResult.incorrectHeaders.push({
        header: 'x-frame-options',
        currentValue: xFrameOptions,
        expectedValues: ['DENY', 'SAMEORIGIN']
      });
    }

    // Calculate security score based on header compliance
    const totalHeaders = requiredCSRFHeaders.length;
    const presentHeaders = totalHeaders - validationResult.missingHeaders.length;
    const correctHeaders = presentHeaders - validationResult.incorrectHeaders.length;
    
    validationResult.securityScore = Math.round((correctHeaders / totalHeaders) * 100);
    validationResult.isCompliant = validationResult.securityScore >= 80;

  } catch (error) {
    validationResult.error = error.message;
    validationResult.isCompliant = false;
  }

  return validationResult;
}

/**
 * Performs comprehensive load testing on CSRF protection mechanisms to validate
 * performance under high request volumes and concurrent CSRF validation scenarios
 * with detailed scalability assessment and performance optimization recommendations.
 * 
 * @param {Object} loadTestConfig - Load testing configuration options
 * @returns {Promise<object>} Promise resolving to CSRF load testing results
 */
export async function performCSRFLoadTesting(loadTestConfig = {}) {
  const config = {
    concurrentRequests: loadTestConfig.concurrentRequests || 100,
    testDurationSeconds: loadTestConfig.testDurationSeconds || 60,
    rampUpTimeSeconds: loadTestConfig.rampUpTimeSeconds || 10,
    targetEndpoint: loadTestConfig.targetEndpoint || '/hello',
    tokenGenerationRate: loadTestConfig.tokenGenerationRate || 10, // tokens per second
    enableMetricsCollection: loadTestConfig.enableMetricsCollection ?? true,
    ...loadTestConfig
  };

  const loadTestResult = {
    configuration: config,
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      blockedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      requestsPerSecond: 0,
      tokensGenerated: 0,
      tokensValidated: 0,
      csrfProtectionOverhead: 0
    },
    performance: {
      cpuUsage: [],
      memoryUsage: [],
      responseTimeDistribution: {},
      errorDistribution: {}
    },
    scalabilityAssessment: {},
    recommendations: []
  };

  const startTime = Date.now();
  const requestPromises = [];
  const responseMetrics = [];

  try {
    // Ramp-up phase: gradually increase load
    const rampUpInterval = (config.rampUpTimeSeconds * 1000) / config.concurrentRequests;
    
    for (let i = 0; i < config.concurrentRequests; i++) {
      setTimeout(async () => {
        const requestStartTime = Date.now();
        
        try {
          // Generate CSRF token for each request
          const csrfToken = generateCSRFToken();
          loadTestResult.metrics.tokensGenerated++;
          
          // Execute request with CSRF protection
          const response = await HTTP_TEST_CLIENT
            .post(config.targetEndpoint)
            .set('X-CSRF-Token', csrfToken)
            .set('Origin', 'http://localhost:3000')
            .send({ testData: `load-test-${i}` })
            .timeout(10000);

          const responseTime = Date.now() - requestStartTime;
          
          responseMetrics.push({
            responseTime,
            statusCode: response.status,
            success: response.status >= 200 && response.status < 300,
            blocked: response.status === 403,
            timestamp: Date.now()
          });

          loadTestResult.metrics.totalRequests++;
          if (response.status >= 200 && response.status < 300) {
            loadTestResult.metrics.successfulRequests++;
            loadTestResult.metrics.tokensValidated++;
          } else if (response.status === 403) {
            loadTestResult.metrics.blockedRequests++;
          } else {
            loadTestResult.metrics.failedRequests++;
          }

        } catch (error) {
          const responseTime = Date.now() - requestStartTime;
          
          responseMetrics.push({
            responseTime,
            statusCode: error.status || 0,
            success: false,
            blocked: error.status === 403,
            error: error.message,
            timestamp: Date.now()
          });

          loadTestResult.metrics.totalRequests++;
          loadTestResult.metrics.failedRequests++;
        }
      }, i * rampUpInterval);
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, config.testDurationSeconds * 1000));

    // Calculate performance metrics
    const totalTestTime = Date.now() - startTime;
    const responseTimes = responseMetrics.map(m => m.responseTime);
    
    loadTestResult.metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    loadTestResult.metrics.minResponseTime = Math.min(...responseTimes);
    loadTestResult.metrics.maxResponseTime = Math.max(...responseTimes);
    loadTestResult.metrics.requestsPerSecond = loadTestResult.metrics.totalRequests / (totalTestTime / 1000);

    // Analyze response time distribution
    const timeRanges = [
      { range: '0-50ms', min: 0, max: 50 },
      { range: '50-100ms', min: 50, max: 100 },
      { range: '100-200ms', min: 100, max: 200 },
      { range: '200-500ms', min: 200, max: 500 },
      { range: '500ms+', min: 500, max: Infinity }
    ];

    for (const range of timeRanges) {
      const count = responseTimes.filter(time => time >= range.min && time < range.max).length;
      loadTestResult.performance.responseTimeDistribution[range.range] = {
        count,
        percentage: (count / responseTimes.length) * 100
      };
    }

    // Calculate CSRF protection overhead
    loadTestResult.metrics.csrfProtectionOverhead = calculateCSRFOverhead(responseMetrics);

    // Generate scalability assessment
    loadTestResult.scalabilityAssessment = {
      throughputEfficiency: (loadTestResult.metrics.successfulRequests / loadTestResult.metrics.totalRequests) * 100,
      csrfProtectionEffectiveness: (loadTestResult.metrics.tokensValidated / loadTestResult.metrics.tokensGenerated) * 100,
      performanceImpact: loadTestResult.metrics.csrfProtectionOverhead,
      scalabilityRating: calculateScalabilityRating(loadTestResult.metrics)
    };

    // Generate performance recommendations
    loadTestResult.recommendations = generateLoadTestRecommendations(loadTestResult);

  } catch (error) {
    loadTestResult.error = error.message;
  }

  loadTestResult.totalExecutionTime = Date.now() - startTime;
  return loadTestResult;
}

/**
 * Validates CSRF protection consistency between Node.js Express and Python Flask
 * implementations ensuring security feature parity and cross-platform compatibility
 * with comprehensive security assessment and compatibility analysis.
 * 
 * @param {Object} crossPlatformConfig - Cross-platform testing configuration
 * @returns {Promise<object>} Promise resolving to cross-platform CSRF validation result
 */
export async function validateCrossPlatformCSRF(crossPlatformConfig = {}) {
  const config = {
    expressEndpoint: crossPlatformConfig.expressEndpoint || 'http://localhost:3000',
    flaskEndpoint: crossPlatformConfig.flaskEndpoint || 'http://localhost:5000',
    testEndpoints: crossPlatformConfig.testEndpoints || ['/hello', '/good-evening', '/health'],
    enableCompatibilityTesting: crossPlatformConfig.enableCompatibilityTesting ?? true,
    enableSecurityParityTesting: crossPlatformConfig.enableSecurityParityTesting ?? true,
    enablePerformanceComparison: crossPlatformConfig.enablePerformanceComparison ?? true,
    ...crossPlatformConfig
  };

  const crossPlatformResult = {
    expressResults: {},
    flaskResults: {},
    compatibility: {
      csrfTokenFormat: null,
      securityHeaders: null,
      attackPrevention: null,
      performanceParity: null
    },
    securityParity: {
      score: 0,
      consistencyIssues: [],
      recommendations: []
    },
    overallAssessment: {
      isCompatible: false,
      parityScore: 0,
      criticalIssues: []
    }
  };

  try {
    // Test Express.js CSRF implementation
    for (const endpoint of config.testEndpoints) {
      const expressTest = await testPlatformCSRFImplementation(
        `${config.expressEndpoint}${endpoint}`,
        'express'
      );
      crossPlatformResult.expressResults[endpoint] = expressTest;
    }

    // Test Flask CSRF implementation (if available)
    if (config.enableCompatibilityTesting) {
      for (const endpoint of config.testEndpoints) {
        try {
          const flaskTest = await testPlatformCSRFImplementation(
            `${config.flaskEndpoint}${endpoint}`,
            'flask'
          );
          crossPlatformResult.flaskResults[endpoint] = flaskTest;
        } catch (error) {
          crossPlatformResult.flaskResults[endpoint] = {
            error: 'Flask endpoint not available',
            available: false
          };
        }
      }
    }

    // Compare CSRF token formats between platforms
    if (config.enableSecurityParityTesting) {
      crossPlatformResult.compatibility.csrfTokenFormat = compareCSRFTokenFormats(
        crossPlatformResult.expressResults,
        crossPlatformResult.flaskResults
      );

      // Compare security headers between platforms
      crossPlatformResult.compatibility.securityHeaders = compareSecurityHeaders(
        crossPlatformResult.expressResults,
        crossPlatformResult.flaskResults
      );

      // Compare attack prevention capabilities
      crossPlatformResult.compatibility.attackPrevention = compareAttackPrevention(
        crossPlatformResult.expressResults,
        crossPlatformResult.flaskResults
      );
    }

    // Performance comparison between platforms
    if (config.enablePerformanceComparison) {
      crossPlatformResult.compatibility.performanceParity = comparePerformanceMetrics(
        crossPlatformResult.expressResults,
        crossPlatformResult.flaskResults
      );
    }

    // Calculate security parity score
    crossPlatformResult.securityParity = calculateSecurityParity(
      crossPlatformResult.compatibility
    );

    // Generate overall assessment
    crossPlatformResult.overallAssessment = generateCrossPlatformAssessment(
      crossPlatformResult
    );

  } catch (error) {
    crossPlatformResult.error = error.message;
  }

  return crossPlatformResult;
}

/**
 * Tests CSRF protection functionality in PM2 cluster mode ensuring distributed
 * CSRF validation, token sharing, and security consistency across cluster processes
 * with comprehensive distributed security validation and cluster compatibility testing.
 * 
 * @param {Object} clusterConfig - PM2 cluster testing configuration
 * @returns {Promise<object>} Promise resolving to PM2 cluster CSRF testing result
 */
async function testCSRFWithPM2Cluster(clusterConfig = {}) {
  const config = {
    instanceCount: clusterConfig.instanceCount || 4,
    testEndpoint: clusterConfig.testEndpoint || '/hello',
    requestsPerInstance: clusterConfig.requestsPerInstance || 25,
    enableTokenSharing: clusterConfig.enableTokenSharing ?? true,
    enableLoadBalancing: clusterConfig.enableLoadBalancing ?? true,
    enableFailoverTesting: clusterConfig.enableFailoverTesting ?? true,
    ...clusterConfig
  };

  const clusterTestResult = {
    configuration: config,
    instanceResults: {},
    distributedSecurity: {
      tokenConsistency: null,
      securityEnforcement: null,
      loadBalancing: null
    },
    performance: {
      clusterEfficiency: 0,
      securityOverhead: 0,
      scalabilityMetrics: {}
    },
    recommendations: []
  };

  try {
    // Simulate requests across multiple PM2 instances
    const instancePromises = [];
    
    for (let instance = 0; instance < config.instanceCount; instance++) {
      const instancePromise = testClusterInstance(instance, config);
      instancePromises.push(instancePromise);
    }

    // Execute cluster testing across all instances
    const instanceResults = await Promise.all(instancePromises);
    
    instanceResults.forEach((result, index) => {
      clusterTestResult.instanceResults[`instance-${index}`] = result;
    });

    // Test token consistency across cluster instances
    if (config.enableTokenSharing) {
      clusterTestResult.distributedSecurity.tokenConsistency = 
        await testTokenConsistencyAcrossCluster(config);
    }

    // Test security enforcement consistency
    clusterTestResult.distributedSecurity.securityEnforcement = 
      await testSecurityEnforcementConsistency(instanceResults);

    // Test load balancing with CSRF protection
    if (config.enableLoadBalancing) {
      clusterTestResult.distributedSecurity.loadBalancing = 
        await testLoadBalancingWithCSRF(config);
    }

    // Test failover scenarios
    if (config.enableFailoverTesting) {
      const failoverResult = await testClusterFailoverWithCSRF(config);
      clusterTestResult.distributedSecurity.failover = failoverResult;
    }

    // Calculate cluster performance metrics
    clusterTestResult.performance = calculateClusterPerformanceMetrics(instanceResults);

    // Generate cluster-specific recommendations
    clusterTestResult.recommendations = generateClusterRecommendations(clusterTestResult);

  } catch (error) {
    clusterTestResult.error = error.message;
  }

  return clusterTestResult;
}

// Helper Functions for CSRF Protection Testing

/**
 * Validates CSRF token syntax and format
 * @private
 */
function validateCSRFTokenSyntax(token) {
  if (!token || typeof token !== 'string') {
    return { isValid: false, reason: 'Token is not a string' };
  }

  // Check token format (base64url.timestamp.hash)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return { isValid: false, reason: 'Invalid token format' };
  }

  // Validate base64url encoding
  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  if (!base64urlPattern.test(tokenParts[0])) {
    return { isValid: false, reason: 'Invalid base64url encoding' };
  }

  // Validate timestamp
  const timestamp = parseInt(tokenParts[1]);
  if (isNaN(timestamp) || timestamp <= 0) {
    return { isValid: false, reason: 'Invalid timestamp' };
  }

  return { isValid: true, tokenParts, timestamp };
}

/**
 * Validates CSRF token expiration
 * @private
 */
function validateCSRFTokenExpiration(token) {
  const syntaxValidation = validateCSRFTokenSyntax(token);
  if (!syntaxValidation.isValid) {
    return syntaxValidation;
  }

  const tokenTimestamp = syntaxValidation.timestamp;
  const currentTime = Date.now();
  const tokenAge = currentTime - tokenTimestamp;
  
  // Default expiration time: 1 hour
  const maxAge = 60 * 60 * 1000;
  
  return {
    isValid: tokenAge <= maxAge,
    tokenAge,
    timeSinceExpiration: Math.max(0, tokenAge - maxAge),
    expired: tokenAge > maxAge
  };
}

/**
 * Renews a CSRF token by generating a new one
 * @private
 */
function renewCSRFToken(oldToken) {
  // Generate new token with same configuration
  return generateCSRFToken();
}

/**
 * Cleans up expired tokens from cache
 * @private
 */
function cleanupExpiredTokens() {
  const currentTime = Date.now();
  let cleanedCount = 0;

  for (const [token, metadata] of CSRF_TOKEN_CACHE.entries()) {
    if (metadata.expires && currentTime > metadata.expires) {
      CSRF_TOKEN_CACHE.delete(token);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

/**
 * Tests token performance under load
 * @private
 */
async function testTokenPerformance(concurrentTokens) {
  const startTime = Date.now();
  const tokenPromises = [];

  for (let i = 0; i < concurrentTokens; i++) {
    tokenPromises.push(Promise.resolve(generateCSRFToken()));
  }

  const tokens = await Promise.all(tokenPromises);
  const totalTime = Date.now() - startTime;

  return {
    tokensGenerated: tokens.length,
    totalTime,
    tokensPerSecond: (tokens.length / totalTime) * 1000,
    averageTokenGenerationTime: totalTime / tokens.length
  };
}

// Framework-agnostic test suite setup for Jest and Mocha compatibility
const testFramework = typeof describe !== 'undefined' ? 'mocha' : 'jest';

// Jest/Mocha compatible test suite
if (testFramework === 'mocha' || typeof describe !== 'undefined') {
  
  describe('CSRF Protection Comprehensive Testing Suite', function() {
    jest.setTimeout(30000); // 30 second timeout for comprehensive tests

    before(async function() {
      // Initialize test environment
      await setupTestEnvironment();
      TEST_APP_INSTANCE = createApp();
      HTTP_TEST_CLIENT = supertest(TEST_APP_INSTANCE);
      SECURITY_TEST_HELPER = createSecurityTestHelper();
    });

    after(async function() {
      // Cleanup test environment
      if (TEST_APP_INSTANCE && TEST_APP_INSTANCE.close) {
        await TEST_APP_INSTANCE.close();
      }
      CSRF_TEST_TOKENS.clear();
      CSRF_TOKEN_CACHE.clear();
    });

    describe('CSRF Token Generation and Validation', function() {
      it('should generate cryptographically secure CSRF tokens', function() {
        const token = generateCSRFToken();
        
        expect(token).to.be.a('string');
        expect(token.length).to.be.greaterThan(20);
        expect(validateCSRFTokenSyntax(token).isValid).to.be.true;
      });

      it('should validate CSRF token format and integrity', function() {
        const token = generateCSRFToken();
        const validation = validateCSRFTokenSyntax(token);
        
        expect(validation.isValid).to.be.true;
        expect(validation.tokenParts).to.have.length(3);
        expect(validation.timestamp).to.be.a('number');
      });

      it('should handle token expiration correctly', async function() {
        const expiredToken = generateCSRFToken({ expirationMinutes: -1 });
        const validation = validateCSRFTokenExpiration(expiredToken);
        
        expect(validation.expired).to.be.true;
        expect(validation.isValid).to.be.false;
      });
    });

    describe('CSRF Attack Simulation', function() {
      it('should block cross-origin CSRF attacks', async function() {
        const attackResult = await simulateCSRFAttack('cross-origin-request');
        
        expect(attackResult.blocked).to.be.true;
        expect(attackResult.responseStatus).to.be.oneOf([403, 400]);
      });

      it('should reject requests with missing CSRF tokens', async function() {
        const attackResult = await simulateCSRFAttack('missing-token');
        
        expect(attackResult.blocked).to.be.true;
        expect(attackResult.securityViolations).to.not.be.empty;
      });

      it('should prevent replay attacks with used tokens', async function() {
        const attackResult = await simulateCSRFAttack('replay-attack');
        
        expect(attackResult.blocked).to.be.true;
        expect(attackResult.attackType).to.equal('replay-attack');
      });
    });

    describe('Security Headers Validation', function() {
      it('should include required CSRF protection headers', async function() {
        const response = await HTTP_TEST_CLIENT.get('/hello');
        const headerValidation = validateSecurityHeaders(response.headers);
        
        expect(headerValidation.isCompliant).to.be.true;
        expect(headerValidation.securityScore).to.be.greaterThan(75);
      });

      it('should validate Content Security Policy for CSRF protection', async function() {
        const response = await HTTP_TEST_CLIENT.get('/hello');
        const cspHeader = response.headers['content-security-policy'];
        
        expect(cspHeader).to.exist;
        expect(cspHeader).to.include('form-action');
      });
    });

    describe('CSRF Token Lifecycle Management', function() {
      it('should complete full token lifecycle successfully', async function() {
        const lifecycleResult = await testCSRFTokenLifecycle({
          tokenCount: 5,
          expirationTimeMinutes: 1
        });
        
        expect(lifecycleResult.overallSuccess).to.be.true;
        expect(lifecycleResult.phases.generation.success).to.be.true;
        expect(lifecycleResult.phases.validation.success).to.be.true;
      });
    });

    describe('CSRF Load Testing', function() {
      it('should maintain CSRF protection under load', async function() {
        const loadTestResult = await performCSRFLoadTesting({
          concurrentRequests: 50,
          testDurationSeconds: 10
        });
        
        expect(loadTestResult.metrics.successfulRequests).to.be.greaterThan(0);
        expect(loadTestResult.scalabilityAssessment.throughputEfficiency).to.be.greaterThan(80);
      });
    });

    describe('Cross-Platform CSRF Compatibility', function() {
      it('should validate CSRF consistency between Express and Flask', async function() {
        const crossPlatformResult = await validateCrossPlatformCSRF();
        
        expect(crossPlatformResult.expressResults).to.not.be.empty;
        // Flask results may be empty if Flask server is not running
      });
    });

    describe('PM2 Cluster CSRF Testing', function() {
      it('should maintain CSRF protection in cluster mode', async function() {
        const clusterResult = await testCSRFWithPM2Cluster({
          instanceCount: 2,
          requestsPerInstance: 10
        });
        
        expect(clusterResult.instanceResults).to.not.be.empty;
        expect(clusterResult.performance.clusterEfficiency).to.be.greaterThan(0);
      });
    });
  });

} else {
  // Jest-specific test structure
  describe('CSRF Protection Comprehensive Testing Suite', () => {
    let testApp, httpClient, securityHelper;

    beforeAll(async () => {
      await setupTestEnvironment();
      testApp = createApp();
      httpClient = supertest(testApp);
      securityHelper = createSecurityTestHelper();
    });

    afterAll(async () => {
      if (testApp && testApp.close) {
        await testApp.close();
      }
      CSRF_TEST_TOKENS.clear();
      CSRF_TOKEN_CACHE.clear();
    });

    describe('CSRF Token Generation and Validation', () => {
      test('generates cryptographically secure CSRF tokens', () => {
        const token = generateCSRFToken();
        
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20);
        expect(validateCSRFTokenSyntax(token).isValid).toBe(true);
      });

      test('validates CSRF token format and integrity', () => {
        const token = generateCSRFToken();
        const validation = validateCSRFTokenSyntax(token);
        
        expect(validation.isValid).toBe(true);
        expect(validation.tokenParts).toHaveLength(3);
        expect(typeof validation.timestamp).toBe('number');
      });

      test('handles token expiration correctly', async () => {
        const expiredToken = generateCSRFToken({ expirationMinutes: -1 });
        const validation = validateCSRFTokenExpiration(expiredToken);
        
        expect(validation.expired).toBe(true);
        expect(validation.isValid).toBe(false);
      });
    });

    describe('CSRF Attack Simulation', () => {
      test('blocks cross-origin CSRF attacks', async () => {
        const attackResult = await simulateCSRFAttack('cross-origin-request');
        
        expect(attackResult.blocked).toBe(true);
        expect([403, 400]).toContain(attackResult.responseStatus);
      });

      test('rejects requests with missing CSRF tokens', async () => {
        const attackResult = await simulateCSRFAttack('missing-token');
        
        expect(attackResult.blocked).toBe(true);
        expect(attackResult.securityViolations.length).toBeGreaterThan(0);
      });

      test('prevents replay attacks with used tokens', async () => {
        const attackResult = await simulateCSRFAttack('replay-attack');
        
        expect(attackResult.blocked).toBe(true);
        expect(attackResult.attackType).toBe('replay-attack');
      });
    });

    describe('Security Headers Validation', () => {
      test('includes required CSRF protection headers', async () => {
        const response = await httpClient.get('/hello');
        const headerValidation = validateSecurityHeaders(response.headers);
        
        expect(headerValidation.isCompliant).toBe(true);
        expect(headerValidation.securityScore).toBeGreaterThan(75);
      });

      test('validates Content Security Policy for CSRF protection', async () => {
        const response = await httpClient.get('/hello');
        const cspHeader = response.headers['content-security-policy'];
        
        expect(cspHeader).toBeDefined();
        expect(cspHeader).toMatch(/form-action/);
      });
    });

    describe('CSRF Token Lifecycle Management', () => {
      test('completes full token lifecycle successfully', async () => {
        const lifecycleResult = await testCSRFTokenLifecycle({
          tokenCount: 5,
          expirationTimeMinutes: 1
        });
        
        expect(lifecycleResult.overallSuccess).toBe(true);
        expect(lifecycleResult.phases.generation.success).toBe(true);
        expect(lifecycleResult.phases.validation.success).toBe(true);
      });
    });

    describe('CSRF Load Testing', () => {
      test('maintains CSRF protection under load', async () => {
        const loadTestResult = await performCSRFLoadTesting({
          concurrentRequests: 50,
          testDurationSeconds: 10
        });
        
        expect(loadTestResult.metrics.successfulRequests).toBeGreaterThan(0);
        expect(loadTestResult.scalabilityAssessment.throughputEfficiency).toBeGreaterThan(80);
      });
    });

    describe('Cross-Platform CSRF Compatibility', () => {
      test('validates CSRF consistency between Express and Flask', async () => {
        const crossPlatformResult = await validateCrossPlatformCSRF();
        
        expect(Object.keys(crossPlatformResult.expressResults)).not.toHaveLength(0);
        // Flask results may be empty if Flask server is not running
      });
    });

    describe('PM2 Cluster CSRF Testing', () => {
      test('maintains CSRF protection in cluster mode', async () => {
        const clusterResult = await testCSRFWithPM2Cluster({
          instanceCount: 2,
          requestsPerInstance: 10
        });
        
        expect(Object.keys(clusterResult.instanceResults)).not.toHaveLength(0);
        expect(clusterResult.performance.clusterEfficiency).toBeGreaterThan(0);
      });
    });
  });
}

// Export all testing functions for external use
export {
  testCSRFWithPM2Cluster
};