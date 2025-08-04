/**
 * @fileoverview Comprehensive Security Middleware Orchestrator for Node.js Tutorial Project
 * @description Central security gateway that integrates all security components into a unified
 * security layer for Express.js v5.1.0 applications. Combines Helmet.js security headers, CORS
 * policies, rate limiting, request validation, and security monitoring into a cohesive middleware
 * stack with environment-aware configurations, threat detection, PM2 cluster compatibility, and
 * educational security insights for modern web development learning.
 * 
 * Features:
 * - Comprehensive security middleware integration (Helmet.js, CORS, Rate Limiting)
 * - Environment-aware security configurations with development-friendly policies
 * - PM2 cluster mode compatibility with distributed security monitoring
 * - Advanced threat detection and security violation handling
 * - Real-time security metrics collection and monitoring dashboard
 * - Cross-platform security compatibility with Flask implementations
 * - Educational security insights and production-ready security practices
 * - Performance-optimized security processing with minimal overhead
 * - Automated security response and threat mitigation capabilities
 * - Comprehensive security audit trail and compliance reporting
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// External Node.js built-in imports with security utilities
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'; // Built-in cryptographic utilities for secure tokens and nonces
import { inspect } from 'node:util'; // Built-in utilities for object inspection and debugging

// Internal security middleware component imports
import { createHelmetConfigMiddleware } from './helmet-config.js';
import { configureCorsForEnvironment } from './cors.js';
import { createRateLimiterMiddleware } from './rate-limiter.js';
import { createRequestLogger } from './logger.js';
import { errorHandler } from './error-handler.js';

// Internal utility and configuration imports
import {
  SECURITY_CONSTANTS,
  HTTP_CONSTANTS
} from '../utils/constants.js';

import {
  config
} from '../config/index.js';

import {
  SecurityError,
  HTTPError
} from '../utils/error-types.js';

import logger from '../utils/logger.js';

// Global security state management for PM2 cluster compatibility
const SECURITY_MIDDLEWARE_CACHE = new Map();
const THREAT_DETECTION_PATTERNS = new Set([
  // XSS attack patterns
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  
  // SQL injection patterns
  /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/gi,
  /(\bdrop\b.*\btable\b)|(\btable\b.*\bdrop\b)/gi,
  /\binsert\b.*\binto\b/gi,
  /\bdelete\b.*\bfrom\b/gi,
  /\bupdate\b.*\bset\b/gi,
  
  // Command injection patterns
  /(\;|\&\&|\|\|)\s*(cat|ls|pwd|whoami|id|uname)/gi,
  /\$\([^)]+\)/gi,
  /`[^`]+`/gi,
  
  // Path traversal patterns
  /\.\.\/+/g,
  /\.\.\\+/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  
  // LDAP injection patterns
  /\(\|/g,
  /\(\&/g,
  /\(\!/g,
  
  // NoSQL injection patterns
  /\$where/gi,
  /\$ne\b/gi,
  /\$gt\b/gi,
  /\$lt\b/gi
]);

let SECURITY_VIOLATIONS_COUNT = 0;
const BLOCKED_IPS = new Set();
const SECURITY_METRICS = {
  requestsProcessed: 0,
  threatsDetected: 0,
  violationsBlocked: 0,
  performanceImpact: 0,
  startTime: Date.now(),
  lastThreatDetection: null,
  activeThreatLevel: 'low'
};

/**
 * Main factory function that creates comprehensive security middleware stack by orchestrating
 * all security components including Helmet.js, CORS, rate limiting, request validation, and
 * threat detection. Provides environment-aware security configurations and performance
 * optimization for production deployment with PM2 cluster mode compatibility.
 * 
 * @param {Object} [securityOptions={}] - Security middleware configuration options
 * @param {string} [securityOptions.environment] - Override environment detection
 * @param {Object} [securityOptions.helmetConfig] - Custom Helmet.js configuration
 * @param {Object} [securityOptions.corsConfig] - Custom CORS configuration  
 * @param {Object} [securityOptions.rateLimitConfig] - Custom rate limiting configuration
 * @param {boolean} [securityOptions.enableThreatDetection=true] - Enable threat detection
 * @param {boolean} [securityOptions.enableSecurityLogging=true] - Enable security event logging
 * @param {boolean} [securityOptions.enablePerformanceOptimization=true] - Enable performance optimization
 * @param {Object} [securityOptions.pm2Config] - PM2-specific configuration overrides
 * @param {Object} [securityOptions.educationalMode] - Educational insights configuration
 * @returns {Function} Express.js middleware function with comprehensive security protection
 */
export function createSecurityMiddleware(securityOptions = {}) {
  // Validate security options and apply environment-specific default configurations
  const securityConfig = {
    environment: securityOptions.environment || config.environment?.current || 'development',
    enableThreatDetection: securityOptions.enableThreatDetection ?? true,
    enableSecurityLogging: securityOptions.enableSecurityLogging ?? true,
    enablePerformanceOptimization: securityOptions.enablePerformanceOptimization ?? true,
    enableEducationalMode: securityOptions.enableEducationalMode ?? config.environment?.isDevelopment,
    enableFlaskCompatibility: securityOptions.enableFlaskCompatibility ?? false,
    strictMode: securityOptions.strictMode ?? config.environment?.isProduction,
    maxCacheSize: securityOptions.maxCacheSize || 1000,
    threatThreshold: securityOptions.threatThreshold || 5,
    violationThreshold: securityOptions.violationThreshold || 10,
    performanceThreshold: securityOptions.performanceThreshold || 100, // milliseconds
    pm2Config: {
      enableClusterMode: config.environment?.isProduction ?? false,
      enableDistributedMetrics: securityOptions.pm2Config?.enableDistributedMetrics ?? true,
      enableProcessCorrelation: securityOptions.pm2Config?.enableProcessCorrelation ?? true,
      ...securityOptions.pm2Config
    },
    ...securityOptions
  };

  // Initialize security middleware cache for performance optimization
  const cacheKey = `security-middleware-${securityConfig.environment}-${process.pid}`;
  if (SECURITY_MIDDLEWARE_CACHE.has(cacheKey) && securityConfig.enablePerformanceOptimization) {
    logger.debug('Security middleware cache hit', {
      cacheKey,
      pid: process.pid,
      environment: securityConfig.environment,
      cacheSize: SECURITY_MIDDLEWARE_CACHE.size
    });
    return SECURITY_MIDDLEWARE_CACHE.get(cacheKey);
  }

  // Create Helmet.js middleware with all 15 security headers configured
  const helmetMiddleware = createHelmetConfigMiddleware({
    environment: securityConfig.environment,
    strictMode: securityConfig.strictMode,
    enableEducationalMode: securityConfig.enableEducationalMode,
    customConfig: securityConfig.helmetConfig,
    ...SECURITY_CONSTANTS.CSP_DIRECTIVES
  });

  // Configure CORS middleware with environment-appropriate policies
  const corsMiddleware = configureCorsForEnvironment({
    environment: securityConfig.environment,
    strictMode: securityConfig.strictMode,
    enableCredentials: securityConfig.corsConfig?.enableCredentials ?? false,
    customConfig: securityConfig.corsConfig,
    ...SECURITY_CONSTANTS.CORS_CONFIG
  });

  // Set up rate limiting middleware with distributed support for PM2 clusters
  const rateLimitingMiddleware = createRateLimiterMiddleware({
    environment: securityConfig.environment,
    enableClusterMode: securityConfig.pm2Config.enableClusterMode,
    enableEducationalMode: securityConfig.enableEducationalMode,
    customConfig: securityConfig.rateLimitConfig,
    ...SECURITY_CONSTANTS.RATE_LIMIT_CONFIG
  });

  // Initialize request validation middleware for input sanitization
  const requestValidationMiddleware = createRequestValidationMiddleware(securityConfig);

  // Configure threat detection patterns and suspicious request monitoring
  const threatDetectionMiddleware = createThreatDetectionMiddleware(securityConfig);

  // Set up security event logging and monitoring integration
  const securityLoggingMiddleware = createRequestLogger({
    enableSecurityLogging: securityConfig.enableSecurityLogging,
    enableEducationalMode: securityConfig.enableEducationalMode,
    logLevel: config.environment?.isDevelopment ? 'debug' : 'info',
    pm2Config: securityConfig.pm2Config
  });

  // Create middleware composition function with optimal execution order
  const composedSecurityMiddleware = async function securityMiddleware(req, res, next) {
    const startTime = Date.now();
    
    try {
      // Set up security context for request processing
      req.securityContext = {
        correlationId: req.correlationId || generateSecurityCorrelationId(),
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        environment: securityConfig.environment,
        threatLevel: 'low',
        violations: [],
        startTime
      };

      // Implement security performance monitoring and metrics collection
      if (securityConfig.enablePerformanceOptimization) {
        req.securityMetrics = {
          startTime,
          helmetTime: 0,
          corsTime: 0,
          rateLimitTime: 0,
          validationTime: 0,
          threatDetectionTime: 0
        };
      }

      // Execute security middleware pipeline in optimal order
      await executeSecurityPipeline(req, res, {
        helmetMiddleware,
        corsMiddleware,
        rateLimitingMiddleware,
        requestValidationMiddleware,
        threatDetectionMiddleware,
        securityLoggingMiddleware
      }, securityConfig);

      // Add security violation tracking and automated response mechanisms
      if (req.securityContext.violations.length > 0) {
        await handleSecurityViolations(req, res, securityConfig);
      }

      // Update security metrics and performance monitoring
      updateSecurityMetrics(req, securityConfig);

      // Continue to next middleware if no security violations detected
      next();

    } catch (error) {
      // Handle security middleware errors with comprehensive error context
      const securityError = new SecurityError(
        'Security middleware processing failed',
        {
          originalError: error,
          securityContext: req.securityContext,
          environment: securityConfig.environment,
          middleware: 'security-orchestrator'
        }
      );

      logger.error('Security middleware error', securityError, {
        correlationId: req.securityContext?.correlationId,
        ip: req.securityContext?.ip,
        userAgent: req.securityContext?.userAgent,
        processingTime: Date.now() - startTime
      });

      // Pass error to centralized error handler
      next(securityError);
    }
  };

  // Cache composed middleware for performance optimization
  if (securityConfig.enablePerformanceOptimization && SECURITY_MIDDLEWARE_CACHE.size < securityConfig.maxCacheSize) {
    SECURITY_MIDDLEWARE_CACHE.set(cacheKey, composedSecurityMiddleware);
  }

  // Log middleware initialization with configuration details
  logger.info('Security middleware orchestrator initialized', {
    configuration: {
      environment: securityConfig.environment,
      threatDetection: securityConfig.enableThreatDetection,
      securityLogging: securityConfig.enableSecurityLogging,
      performanceOptimization: securityConfig.enablePerformanceOptimization,
      pm2ClusterMode: securityConfig.pm2Config.enableClusterMode,
      educationalMode: securityConfig.enableEducationalMode
    },
    security: {
      cacheEnabled: securityConfig.enablePerformanceOptimization,
      cacheSize: SECURITY_MIDDLEWARE_CACHE.size,
      threatPatterns: THREAT_DETECTION_PATTERNS.size
    },
    middleware: 'security-orchestrator',
    pid: process.pid
  });

  return composedSecurityMiddleware;
}

/**
 * Validates incoming HTTP requests for security threats, malicious patterns, and policy
 * violations. Performs input sanitization, header validation, and request structure
 * analysis to detect and prevent various attack vectors including XSS, SQL injection,
 * and malformed requests with comprehensive educational insights.
 * 
 * @param {Object} req - Express request object with headers, body, query parameters
 * @param {Object} [validationOptions={}] - Request validation configuration options
 * @param {Array} [validationOptions.enabledValidations] - List of validation types to perform
 * @param {Object} [validationOptions.customPatterns] - Custom threat detection patterns
 * @param {boolean} [validationOptions.strictMode=false] - Enable strict validation mode
 * @returns {Object} Request validation result with security status, violations, and sanitized data
 */
export function validateRequest(req, validationOptions = {}) {
  const config = {
    enabledValidations: validationOptions.enabledValidations || [
      'headers', 'query', 'body', 'url', 'method', 'size'
    ],
    customPatterns: validationOptions.customPatterns || new Set(),
    strictMode: validationOptions.strictMode ?? false,
    maxRequestSize: validationOptions.maxRequestSize || 10 * 1024 * 1024, // 10MB
    maxHeaderSize: validationOptions.maxHeaderSize || 8 * 1024, // 8KB
    maxUrlLength: validationOptions.maxUrlLength || 2048,
    enableSanitization: validationOptions.enableSanitization ?? true,
    enableEducationalMode: validationOptions.enableEducationalMode ?? false,
    ...validationOptions
  };

  const validationResult = {
    isValid: true,
    violations: [],
    sanitizedRequest: {},
    threatLevel: 'low',
    validationTime: 0,
    educational: {}
  };

  const startTime = Date.now();

  try {
    // Extract request headers, body, query parameters, and URL for validation
    const requestData = {
      headers: req.headers || {},
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
      url: req.url || '',
      originalUrl: req.originalUrl || '',
      method: req.method || 'GET',
      contentLength: parseInt(req.get('content-length') || '0'),
      contentType: req.get('content-type') || ''
    };

    // Check request against known threat patterns and malicious signatures
    if (config.enabledValidations.includes('url')) {
      const urlViolations = validateRequestUrl(requestData.url, config);
      validationResult.violations.push(...urlViolations);
    }

    // Validate request headers for proper format and security compliance
    if (config.enabledValidations.includes('headers')) {
      const headerViolations = validateRequestHeaders(requestData.headers, config);
      validationResult.violations.push(...headerViolations);
    }

    // Sanitize input parameters to prevent XSS and injection attacks
    if (config.enabledValidations.includes('query')) {
      const queryViolations = validateQueryParameters(requestData.query, config);
      validationResult.violations.push(...queryViolations);
    }

    // Check request size and complexity against configured limits
    if (config.enabledValidations.includes('size')) {
      const sizeViolations = validateRequestSize(requestData, config);
      validationResult.violations.push(...sizeViolations);
    }

    // Validate content type and encoding for proper request structure
    if (config.enabledValidations.includes('body') && requestData.body) {
      const bodyViolations = validateRequestBody(requestData.body, config);
      validationResult.violations.push(...bodyViolations);
    }

    // Detect suspicious user agents and automated attack tools
    if (config.enabledValidations.includes('headers')) {
      const userAgentViolations = validateUserAgent(requestData.headers['user-agent'], config);
      validationResult.violations.push(...userAgentViolations);
    }

    // Validate HTTP method and request structure compliance
    if (config.enabledValidations.includes('method')) {
      const methodViolations = validateHttpMethod(requestData.method, config);
      validationResult.violations.push(...methodViolations);
    }

    // Generate sanitized request data with threat patterns removed
    if (config.enableSanitization) {
      validationResult.sanitizedRequest = sanitizeRequestData(requestData, config);
    }

    // Calculate threat level based on violation severity and count
    validationResult.threatLevel = calculateThreatLevel(validationResult.violations);
    validationResult.isValid = validationResult.violations.length === 0 || 
                                validationResult.threatLevel === 'low';

    // Add educational insights about request validation process
    if (config.enableEducationalMode) {
      validationResult.educational = {
        validationTypes: config.enabledValidations,
        threatPatterns: THREAT_DETECTION_PATTERNS.size,
        securityPrinciples: {
          inputValidation: 'Always validate and sanitize user input',
          defenseInDepth: 'Multiple layers of security validation',
          principleOfLeastPrivilege: 'Reject by default, allow by exception'
        },
        violationExplanations: validationResult.violations.map(v => ({
          type: v.type,
          explanation: getViolationExplanation(v.type),
          mitigation: getViolationMitigation(v.type)
        }))
      };
    }

    validationResult.validationTime = Date.now() - startTime;

    // Log validation results for security monitoring
    logger.debug('Request validation completed', {
      isValid: validationResult.isValid,
      violationCount: validationResult.violations.length,
      threatLevel: validationResult.threatLevel,
      validationTime: validationResult.validationTime,
      url: requestData.url,
      method: requestData.method,
      ip: req.ip
    });

    return validationResult;

  } catch (error) {
    validationResult.isValid = false;
    validationResult.violations.push({
      type: 'validation-error',
      severity: 'high',
      message: 'Request validation processing failed',
      error: error.message
    });
    
    logger.error('Request validation error', error, {
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    return validationResult;
  }
}

/**
 * Analyzes request patterns, client behavior, and security indicators to detect potential
 * threats including brute force attacks, reconnaissance attempts, and automated scanning.
 * Implements advanced pattern recognition and behavioral analysis for threat detection
 * with machine learning-like capabilities and educational security insights.
 * 
 * @param {Object} req - Express request object with client information
 * @param {Object} [clientContext={}] - Additional client context for analysis
 * @param {string} [clientContext.sessionId] - Client session identifier
 * @param {Array} [clientContext.requestHistory] - Previous request history
 * @param {Object} [clientContext.geoLocation] - Client geographical location
 * @returns {Object} Threat detection result with risk score, threat type, and response actions
 */
export function detectThreats(req, clientContext = {}) {
  const threatAnalysis = {
    riskScore: 0,
    threatTypes: [],
    indicators: [],
    recommendedActions: [],
    confidence: 0,
    analysisTime: 0,
    educational: {}
  };

  const startTime = Date.now();

  try {
    // Analyze client IP address reputation and geolocation patterns
    const ipAnalysis = analyzeClientIP(req.ip || req.connection?.remoteAddress, clientContext);
    threatAnalysis.riskScore += ipAnalysis.riskScore;
    threatAnalysis.indicators.push(...ipAnalysis.indicators);

    // Check request frequency and timing patterns for attack indicators
    const frequencyAnalysis = analyzeRequestFrequency(req, clientContext);
    threatAnalysis.riskScore += frequencyAnalysis.riskScore;
    threatAnalysis.indicators.push(...frequencyAnalysis.indicators);

    // Examine user agent strings for known attack tools and scanners
    const userAgentAnalysis = analyzeUserAgent(req.get('user-agent'), clientContext);
    threatAnalysis.riskScore += userAgentAnalysis.riskScore;
    threatAnalysis.indicators.push(...userAgentAnalysis.indicators);

    // Detect SQL injection, XSS, and command injection attempt patterns
    const injectionAnalysis = analyzeInjectionPatterns(req, clientContext);
    threatAnalysis.riskScore += injectionAnalysis.riskScore;
    threatAnalysis.indicators.push(...injectionAnalysis.indicators);

    // Analyze URL patterns for directory traversal and enumeration attempts
    const urlAnalysis = analyzeUrlPatterns(req.url || req.originalUrl, clientContext);
    threatAnalysis.riskScore += urlAnalysis.riskScore;
    threatAnalysis.indicators.push(...urlAnalysis.indicators);

    // Check for authentication brute force and credential stuffing patterns
    const authAnalysis = analyzeAuthenticationPatterns(req, clientContext);
    threatAnalysis.riskScore += authAnalysis.riskScore;
    threatAnalysis.indicators.push(...authAnalysis.indicators);

    // Examine request headers for attack tool fingerprints and anomalies
    const headerAnalysis = analyzeRequestHeaders(req.headers, clientContext);
    threatAnalysis.riskScore += headerAnalysis.riskScore;
    threatAnalysis.indicators.push(...headerAnalysis.indicators);

    // Detect bot behavior and automated scanning characteristics
    const botAnalysis = analyzeBotBehavior(req, clientContext);
    threatAnalysis.riskScore += botAnalysis.riskScore;
    threatAnalysis.indicators.push(...botAnalysis.indicators);

    // Calculate threat risk score based on multiple security indicators
    threatAnalysis.confidence = calculateThreatConfidence(threatAnalysis.indicators);
    threatAnalysis.threatTypes = classifyThreatTypes(threatAnalysis.indicators);

    // Classify threat type and determine appropriate response actions
    if (threatAnalysis.riskScore >= 80) {
      threatAnalysis.recommendedActions.push('block-immediately', 'alert-security-team');
    } else if (threatAnalysis.riskScore >= 50) {
      threatAnalysis.recommendedActions.push('rate-limit-aggressive', 'increase-monitoring');
    } else if (threatAnalysis.riskScore >= 20) {
      threatAnalysis.recommendedActions.push('log-for-analysis', 'monitor-closely');
    }

    // Update threat intelligence database with new attack patterns
    updateThreatIntelligence(threatAnalysis, req);

    // Add educational insights about threat detection methodology
    threatAnalysis.educational = {
      detectionMethods: {
        patternMatching: 'Comparing requests against known attack signatures',
        behavioralAnalysis: 'Analyzing client behavior patterns over time',
        anomalyDetection: 'Identifying deviations from normal traffic patterns',
        threatIntelligence: 'Using external threat intelligence feeds'
      },
      riskFactors: threatAnalysis.indicators.map(indicator => ({
        factor: indicator.type,
        impact: indicator.severity,
        explanation: getThreatIndicatorExplanation(indicator.type)
      })),
      mitigationStrategies: getMitigationStrategies(threatAnalysis.threatTypes)
    };

    threatAnalysis.analysisTime = Date.now() - startTime;

    // Log threat detection results for security monitoring
    logger.info('Threat detection analysis completed', {
      riskScore: threatAnalysis.riskScore,
      threatTypes: threatAnalysis.threatTypes,
      indicatorCount: threatAnalysis.indicators.length,
      confidence: threatAnalysis.confidence,
      recommendedActions: threatAnalysis.recommendedActions,
      analysisTime: threatAnalysis.analysisTime,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.url
    });

    return threatAnalysis;

  } catch (error) {
    threatAnalysis.riskScore = 100; // High risk due to analysis failure
    threatAnalysis.threatTypes.push('analysis-failure');
    threatAnalysis.recommendedActions.push('manual-review');
    
    logger.error('Threat detection analysis failed', error, {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('user-agent')
    });

    return threatAnalysis;
  }
}

/**
 * Enforces security policies including CSP violations, CORS policy breaches, rate limit
 * exceedances, and authentication failures. Implements automated security responses
 * including request blocking, rate limiting escalation, and security alert generation
 * with graduated enforcement and educational policy insights.
 * 
 * @param {Object} securityViolation - Security violation details and context
 * @param {Object} [enforcementOptions={}] - Security enforcement configuration options
 * @param {string} [enforcementOptions.enforcementMode='moderate'] - Enforcement strictness level
 * @param {boolean} [enforcementOptions.enableBlocking=true] - Enable request blocking
 * @param {boolean} [enforcementOptions.enableAlerting=true] - Enable security alerting
 * @returns {Object} Security enforcement result with applied actions and monitoring updates
 */
export function enforceSecurityPolicies(securityViolation, enforcementOptions = {}) {
  const config = {
    enforcementMode: enforcementOptions.enforcementMode || 'moderate',
    enableBlocking: enforcementOptions.enableBlocking ?? true,
    enableAlerting: enforcementOptions.enableAlerting ?? true,
    enableEducationalMode: enforcementOptions.enableEducationalMode ?? false,
    escalationThreshold: enforcementOptions.escalationThreshold || 5,
    blockingDuration: enforcementOptions.blockingDuration || 300000, // 5 minutes
    alertThreshold: enforcementOptions.alertThreshold || 3,
    ...enforcementOptions
  };

  const enforcementResult = {
    actionsApplied: [],
    blockingDecision: 'allow',
    alertsTriggered: [],
    escalationLevel: 'none',
    enforcementTime: 0,
    educational: {}
  };

  const startTime = Date.now();

  try {
    // Analyze security violation type and severity level for appropriate response
    const violationAnalysis = analyzeViolationSeverity(securityViolation);
    const clientIP = securityViolation.clientIP || 'unknown';
    const violationType = securityViolation.type || 'unknown';

    // Check enforcement policies for automated response actions and escalation
    const policyDecision = determineEnforcementAction(violationAnalysis, config);
    enforcementResult.escalationLevel = policyDecision.escalationLevel;

    // Implement immediate protective measures including request blocking or throttling
    if (config.enableBlocking && policyDecision.shouldBlock) {
      const blockingAction = implementBlocking(clientIP, violationType, config);
      enforcementResult.actionsApplied.push(blockingAction);
      enforcementResult.blockingDecision = 'blocked';
      
      // Add IP to blocked set for cluster-wide enforcement
      BLOCKED_IPS.add(clientIP);
      
      logger.warn('Security policy enforcement: IP blocked', {
        ip: clientIP,
        violationType,
        duration: config.blockingDuration,
        reason: violationAnalysis.reason
      });
    }

    // Update IP blacklists and rate limiting rules for repeat offenders
    if (violationAnalysis.isRepeatOffender) {
      const blacklistAction = updateSecurityBlacklists(clientIP, violationType, config);
      enforcementResult.actionsApplied.push(blacklistAction);
    }

    // Generate security alerts for monitoring systems and security teams
    if (config.enableAlerting && policyDecision.shouldAlert) {
      const alertAction = generateSecurityAlert(securityViolation, violationAnalysis, config);
      enforcementResult.alertsTriggered.push(alertAction);
    }

    // Apply progressive enforcement with escalating consequences for repeated violations
    if (violationAnalysis.violationCount >= config.escalationThreshold) {
      const escalationAction = applyEscalatedEnforcement(clientIP, violationAnalysis, config);
      enforcementResult.actionsApplied.push(escalationAction);
    }

    // Log detailed security violation information for forensic analysis
    logSecurityViolationForensics(securityViolation, enforcementResult, config);

    // Coordinate with external security services for threat intelligence sharing
    if (violationAnalysis.severity === 'critical') {
      shareThreatIntelligence(securityViolation, enforcementResult);
    }

    // Update security metrics and violation tracking for trend analysis
    updateSecurityViolationMetrics(violationType, enforcementResult);
    SECURITY_VIOLATIONS_COUNT++;

    // Add educational insights about security policy enforcement
    if (config.enableEducationalMode) {
      enforcementResult.educational = {
        policyTypes: {
          preventive: 'Blocks threats before they reach the application',
          detective: 'Identifies and logs security violations',
          corrective: 'Responds to and mitigates detected threats'
        },
        enforcementLevels: {
          low: 'Log and monitor violations',
          medium: 'Rate limit and warn',
          high: 'Block requests and alert',
          critical: 'Immediate blocking and escalation'
        },
        bestPractices: {
          graduatedResponse: 'Escalate enforcement based on violation severity',
          evidenceCollection: 'Maintain detailed logs for forensic analysis',
          threatIntelligence: 'Share threat information across security systems'
        }
      };
    }

    enforcementResult.enforcementTime = Date.now() - startTime;

    logger.info('Security policy enforcement completed', {
      violationType,
      clientIP,
      blockingDecision: enforcementResult.blockingDecision,
      actionsApplied: enforcementResult.actionsApplied.length,
      alertsTriggered: enforcementResult.alertsTriggered.length,
      escalationLevel: enforcementResult.escalationLevel,
      enforcementTime: enforcementResult.enforcementTime
    });

    return enforcementResult;

  } catch (error) {
    logger.error('Security policy enforcement failed', error, {
      violationType: securityViolation.type,
      clientIP: securityViolation.clientIP
    });

    return {
      ...enforcementResult,
      actionsApplied: ['enforcement-error'],
      blockingDecision: 'error',
      enforcementTime: Date.now() - startTime
    };
  }
}

/**
 * Generates comprehensive security headers combining Helmet.js configuration with custom
 * security policies and environment-specific settings. Creates optimized header sets that
 * balance security protection with application functionality and performance with
 * educational header analysis.
 * 
 * @param {Object} req - Express request object for context-aware header generation
 * @param {string} [environment='development'] - Current application environment
 * @param {Object} [headerOptions={}] - Custom header generation options
 * @returns {Object} Complete security headers object ready for HTTP response application
 */
export function createSecurityHeaders(req, environment = 'development', headerOptions = {}) {
  const config = {
    environment,
    strictMode: headerOptions.strictMode ?? (environment === 'production'),
    enableEducationalMode: headerOptions.enableEducationalMode ?? (environment === 'development'),
    enableDynamicCSP: headerOptions.enableDynamicCSP ?? true,
    enableNonceGeneration: headerOptions.enableNonceGeneration ?? true,
    customHeaders: headerOptions.customHeaders || {},
    performanceOptimization: headerOptions.performanceOptimization ?? true,
    ...headerOptions
  };

  const securityHeaders = {};
  const headerGenerationTime = Date.now();

  try {
    // Initialize base security headers from Helmet.js configuration
    const baseHeaders = getHelmetBaseHeaders(config);
    Object.assign(securityHeaders, baseHeaders);

    // Add environment-specific security policies and enforcement levels
    const environmentHeaders = getEnvironmentSpecificHeaders(environment, config);
    Object.assign(securityHeaders, environmentHeaders);

    // Generate dynamic CSP nonces and hashes for secure script execution
    if (config.enableDynamicCSP) {
      const cspNonce = config.enableNonceGeneration ? generateCSPNonce() : null;
      const dynamicCSP = generateDynamicCSP(req, cspNonce, config);
      securityHeaders['Content-Security-Policy'] = dynamicCSP;
      
      if (cspNonce) {
        securityHeaders['X-CSP-Nonce'] = cspNonce;
        req.cspNonce = cspNonce; // Make nonce available to application
      }
    }

    // Configure HSTS headers with appropriate max-age and subdomain inclusion
    const hstsHeader = generateHSTSHeader(environment, config);
    if (hstsHeader) {
      securityHeaders['Strict-Transport-Security'] = hstsHeader;
    }

    // Set frame options and clickjacking protection based on application context
    const frameOptionsHeader = generateFrameOptionsHeader(req, config);
    securityHeaders['X-Frame-Options'] = frameOptionsHeader;

    // Configure cross-origin policies for resource isolation and security
    const crossOriginHeaders = generateCrossOriginHeaders(req, config);
    Object.assign(securityHeaders, crossOriginHeaders);

    // Add custom security headers for enhanced protection and compliance
    if (config.customHeaders && Object.keys(config.customHeaders).length > 0) {
      Object.assign(securityHeaders, config.customHeaders);
    }

    // Optimize header combinations for performance and reduced response size
    if (config.performanceOptimization) {
      optimizeSecurityHeaders(securityHeaders, config);
    }

    // Validate header syntax and compliance with security standards
    const validationResult = validateSecurityHeaders(securityHeaders);
    if (!validationResult.isValid) {
      logger.warn('Security header validation warnings', {
        warnings: validationResult.warnings,
        headers: Object.keys(securityHeaders)
      });
    }

    // Add educational insights about security headers
    if (config.enableEducationalMode) {
      securityHeaders['X-Security-Education'] = JSON.stringify({
        headerCount: Object.keys(securityHeaders).length,
        protectionTypes: ['XSS', 'Clickjacking', 'CSRF', 'Content-Type-Sniffing'],
        generationTime: Date.now() - headerGenerationTime,
        environment: environment,
        educational: true
      });
    }

    logger.debug('Security headers generated', {
      headerCount: Object.keys(securityHeaders).length,
      environment,
      generationTime: Date.now() - headerGenerationTime,
      hasDynamicCSP: !!securityHeaders['Content-Security-Policy'],
      hasCustomHeaders: Object.keys(config.customHeaders).length > 0
    });

    return securityHeaders;

  } catch (error) {
    logger.error('Security header generation failed', error, {
      environment,
      url: req.url,
      userAgent: req.get('user-agent')
    });

    // Return minimal security headers as fallback
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '0',
      'X-Security-Error': 'Header generation failed'
    };
  }
}

/**
 * Monitors security metrics including violation rates, threat patterns, performance impact,
 * and policy effectiveness. Provides real-time security dashboard data and automated
 * alerting for security incidents and policy breaches with comprehensive analytics
 * and educational security insights.
 * 
 * @param {Object} securityEvent - Security event data to process and monitor
 * @param {Object} [monitoringConfig={}] - Security monitoring configuration options
 * @param {boolean} [monitoringConfig.enableRealTimeAlerts=true] - Enable real-time alerting
 * @param {boolean} [monitoringConfig.enableTrendAnalysis=true] - Enable trend analysis
 * @param {boolean} [monitoringConfig.enableEducationalInsights=false] - Enable educational insights
 * @returns {void} No return value, updates security metrics and triggers alerts as side effects
 */
export function monitorSecurityMetrics(securityEvent, monitoringConfig = {}) {
  const config = {
    enableRealTimeAlerts: monitoringConfig.enableRealTimeAlerts ?? true,
    enableTrendAnalysis: monitoringConfig.enableTrendAnalysis ?? true,
    enableEducationalInsights: monitoringConfig.enableEducationalInsights ?? false,
    enablePerformanceTracking: monitoringConfig.enablePerformanceTracking ?? true,
    alertThresholds: {
      violationsPerMinute: 10,
      threatsPerHour: 50,
      criticalEvents: 1,
      performanceImpact: 100, // milliseconds
      ...monitoringConfig.alertThresholds
    },
    retentionPeriod: monitoringConfig.retentionPeriod || 86400000, // 24 hours
    ...monitoringConfig
  };

  try {
    const currentTime = Date.now();

    // Update security violation counters and trend analysis data
    updateSecurityViolationCounters(securityEvent, currentTime);

    // Track threat detection accuracy and false positive rates
    if (securityEvent.type === 'threat-detection') {
      updateThreatDetectionMetrics(securityEvent, currentTime);
    }

    // Monitor security middleware performance impact on request processing
    if (config.enablePerformanceTracking && securityEvent.performanceMetrics) {
      updatePerformanceImpactMetrics(securityEvent.performanceMetrics, currentTime);
    }

    // Analyze security policy effectiveness and coverage gaps
    if (securityEvent.type === 'policy-enforcement') {
      updatePolicyEffectivenessMetrics(securityEvent, currentTime);
    }

    // Update security dashboard with real-time threat and violation data
    updateSecurityDashboard(securityEvent, SECURITY_METRICS);

    // Generate automated security alerts for high-priority incidents
    if (config.enableRealTimeAlerts) {
      checkSecurityAlertThresholds(securityEvent, config);
    }

    // Track security response times and mitigation effectiveness
    if (securityEvent.responseTime) {
      updateResponseTimeMetrics(securityEvent.responseTime, currentTime);
    }

    // Correlate security events across distributed PM2 cluster instances
    if (process.env.PM2_INSTANCE_ID) {
      correlateClusterSecurityEvents(securityEvent, currentTime);
    }

    // Update security intelligence database with new threat patterns
    if (securityEvent.threatIndicators) {
      updateThreatIntelligenceDatabase(securityEvent.threatIndicators, currentTime);
    }

    // Generate security compliance reports and audit trail information
    if (securityEvent.complianceRelevant) {
      updateComplianceAuditTrail(securityEvent, currentTime);
    }

    // Educational insights generation for learning and development
    if (config.enableEducationalInsights) {
      generateEducationalSecurityInsights(securityEvent, SECURITY_METRICS);
    }

    // Clean up old metrics data based on retention policy
    cleanupOldMetrics(currentTime, config.retentionPeriod);

    logger.debug('Security metrics monitoring completed', {
      eventType: securityEvent.type,
      metricsUpdated: true,
      alertsChecked: config.enableRealTimeAlerts,
      performanceTracked: config.enablePerformanceTracking,
      timestamp: new Date(currentTime).toISOString()
    });

  } catch (error) {
    logger.error('Security metrics monitoring failed', error, {
      eventType: securityEvent?.type,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Sanitizes security context information for safe logging and monitoring by removing
 * sensitive data while preserving essential security investigation details. Ensures
 * security logs don't leak sensitive information while maintaining forensic value
 * with comprehensive data protection and educational security practices.
 * 
 * @param {Object} securityContext - Security context information to sanitize
 * @param {Object} [sanitizationOptions={}] - Sanitization configuration options
 * @param {Array} [sanitizationOptions.sensitiveFields] - List of sensitive field names
 * @param {boolean} [sanitizationOptions.preserveInvestigativeValue=true] - Maintain forensic value
 * @param {boolean} [sanitizationOptions.enableEducationalMode=false] - Enable educational insights
 * @returns {Object} Sanitized security context safe for logging and external monitoring systems
 */
export function sanitizeSecurityContext(securityContext, sanitizationOptions = {}) {
  const config = {
    sensitiveFields: sanitizationOptions.sensitiveFields || [
      'password', 'token', 'secret', 'key', 'authorization', 'cookie',
      'session', 'csrf', 'api-key', 'bearer', 'oauth', 'jwt'
    ],
    preserveInvestigativeValue: sanitizationOptions.preserveInvestigativeValue ?? true,
    enableEducationalMode: sanitizationOptions.enableEducationalMode ?? false,
    hashSensitiveData: sanitizationOptions.hashSensitiveData ?? true,
    redactionPattern: sanitizationOptions.redactionPattern || '[REDACTED]',
    partialPreservation: sanitizationOptions.partialPreservation ?? true,
    ...sanitizationOptions
  };

  const sanitized = {};
  const sanitizationReport = {
    fieldsProcessed: 0,
    fieldsSanitized: 0,
    fieldsPreserved: 0,
    hashesGenerated: 0
  };

  try {
    // Remove authentication credentials and session tokens from security context
    Object.keys(securityContext).forEach(key => {
      const value = securityContext[key];
      const lowerKey = key.toLowerCase();
      
      sanitizationReport.fieldsProcessed++;

      // Check if field contains sensitive information
      if (config.sensitiveFields.some(sensitiveField => lowerKey.includes(sensitiveField))) {
        sanitizationReport.fieldsSanitized++;

        if (config.hashSensitiveData && config.preserveInvestigativeValue) {
          // Generate hash for investigative correlation while protecting data
          const hash = createHash('sha256').update(String(value)).digest('hex');
          sanitized[key] = `${config.redactionPattern}-HASH:${hash.substring(0, 8)}`;
          sanitizationReport.hashesGenerated++;
        } else if (config.partialPreservation && typeof value === 'string' && value.length > 8) {
          // Preserve partial information for investigation while protecting sensitive parts
          sanitized[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
        } else {
          sanitized[key] = config.redactionPattern;
        }
      } else {
        // Preserve non-sensitive information for investigation
        sanitized[key] = sanitizeNonSensitiveValue(value, config);
        sanitizationReport.fieldsPreserved++;
      }
    });

    // Sanitize user data and personal information while preserving attack patterns
    if (securityContext.requestData) {
      sanitized.requestData = sanitizeRequestData(securityContext.requestData, config);
    }

    // Hash or truncate sensitive identifiers for tracking without exposure
    if (securityContext.correlationId) {
      sanitized.correlationId = securityContext.correlationId; // Safe to preserve
    }

    // Preserve threat indicators and attack signatures for security analysis
    if (securityContext.threatIndicators) {
      sanitized.threatIndicators = securityContext.threatIndicators.map(indicator => ({
        type: indicator.type,
        severity: indicator.severity,
        pattern: indicator.pattern ? `[PATTERN:${createHash('md5').update(indicator.pattern).digest('hex').substring(0, 8)}]` : null,
        confidence: indicator.confidence
      }));
    }

    // Remove internal system paths and configuration details
    const systemFields = ['internalPath', 'configPath', 'systemConfig', 'credentials'];
    systemFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = config.redactionPattern;
        sanitizationReport.fieldsSanitized++;
      }
    });

    // Maintain correlation IDs and timestamp information for investigation
    sanitized.timestamp = securityContext.timestamp || new Date().toISOString();
    sanitized.sanitizationMetadata = {
      sanitized: true,
      sanitizationTime: new Date().toISOString(),
      report: sanitizationReport,
      preservesInvestigativeValue: config.preserveInvestigativeValue
    };

    // Apply environment-specific sanitization rules for development vs production
    if (config.environment === 'development' && config.enableEducationalMode) {
      sanitized.educational = {
        sanitizationPurpose: 'Protecting sensitive data while maintaining security investigation capabilities',
        dataProtectionPrinciples: [
          'Minimize data exposure in logs',
          'Preserve investigative correlation through hashing',
          'Maintain attack pattern visibility for analysis'
        ],
        sanitizationTechniques: {
          redaction: 'Complete removal of sensitive values',
          hashing: 'One-way transformation for correlation',
          partialPreservation: 'Keeping non-sensitive portions for investigation'
        }
      };
    }

    // Validate sanitized context maintains forensic and investigation value
    const validationResult = validateSanitizedContext(sanitized, securityContext, config);
    if (!validationResult.isValid) {
      logger.warn('Security context sanitization validation warnings', validationResult.warnings);
    }

    logger.debug('Security context sanitized', {
      originalFields: Object.keys(securityContext).length,
      sanitizedFields: Object.keys(sanitized).length,
      report: sanitizationReport,
      preservesInvestigativeValue: config.preserveInvestigativeValue
    });

    return sanitized;

  } catch (error) {
    logger.error('Security context sanitization failed', error);
    
    // Return minimal safe context as fallback
    return {
      timestamp: new Date().toISOString(),
      sanitizationError: 'Context sanitization failed',
      preservedFields: ['timestamp', 'correlationId'].filter(field => securityContext[field]),
      sanitizationMetadata: {
        sanitized: false,
        error: error.message
      }
    };
  }
}

/**
 * Generates comprehensive security reports including threat analysis, policy effectiveness,
 * violation trends, and security posture assessment. Provides detailed security analytics
 * for security teams and compliance requirements with educational insights and
 * actionable recommendations for security improvements.
 * 
 * @param {Object} [reportOptions={}] - Security report generation options
 * @param {string} [reportOptions.reportType='comprehensive'] - Type of security report to generate
 * @param {boolean} [reportOptions.includeEducationalInsights=false] - Include educational content
 * @param {boolean} [reportOptions.includeRecommendations=true] - Include actionable recommendations
 * @param {string} timeRange - Time range for report data aggregation (e.g., '24h', '7d', '30d')
 * @returns {Object} Comprehensive security report with analytics, trends, and recommendations
 */
export function createSecurityReport(reportOptions = {}, timeRange = '24h') {
  const config = {
    reportType: reportOptions.reportType || 'comprehensive',
    includeEducationalInsights: reportOptions.includeEducationalInsights ?? false,
    includeRecommendations: reportOptions.includeRecommendations ?? true,
    includeExecutiveSummary: reportOptions.includeExecutiveSummary ?? true,
    includeTechnicalDetails: reportOptions.includeTechnicalDetails ?? true,
    includeComplianceAssessment: reportOptions.includeComplianceAssessment ?? true,
    format: reportOptions.format || 'json',
    ...reportOptions
  };

  const reportGenerationStart = Date.now();
  const report = {
    metadata: {
      reportId: generateSecurityCorrelationId(),
      generatedAt: new Date().toISOString(),
      timeRange,
      reportType: config.reportType,
      generationTime: 0
    },
    executiveSummary: {},
    securityMetrics: {},
    threatAnalysis: {},
    policyEffectiveness: {},
    violationTrends: {},
    complianceAssessment: {},
    recommendations: [],
    educationalInsights: {}
  };

  try {
    // Aggregate security metrics and violation data for specified time range
    const timeRangeMs = parseTimeRange(timeRange);
    const cutoffTime = Date.now() - timeRangeMs;
    
    const aggregatedMetrics = aggregateSecurityMetrics(cutoffTime, Date.now());
    report.securityMetrics = aggregatedMetrics;

    // Analyze threat patterns and attack vector trends over time
    const threatAnalysis = analyzeThreatPatterns(cutoffTime, Date.now());
    report.threatAnalysis = {
      totalThreats: threatAnalysis.totalThreats,
      threatsByType: threatAnalysis.threatsByType,
      threatsBySource: threatAnalysis.threatsBySource,
      threatTrends: threatAnalysis.trends,
      criticalThreats: threatAnalysis.criticalThreats,
      newThreatPatterns: threatAnalysis.newPatterns
    };

    // Evaluate security policy effectiveness and coverage analysis
    const policyAnalysis = analyzePolicyEffectiveness(cutoffTime, Date.now());
    report.policyEffectiveness = {
      policiesEvaluated: policyAnalysis.policiesEvaluated,
      effectivenessRating: policyAnalysis.effectivenessRating,
      coverageGaps: policyAnalysis.coverageGaps,
      performanceImpact: policyAnalysis.performanceImpact,
      recommendedAdjustments: policyAnalysis.recommendedAdjustments
    };

    // Generate threat intelligence summary with IOCs and attack signatures
    const threatIntelligence = generateThreatIntelligenceSummary(cutoffTime, Date.now());
    report.threatIntelligence = threatIntelligence;

    // Create security posture assessment with strengths and improvement areas
    const postureAssessment = assessSecurityPosture(aggregatedMetrics, threatAnalysis, policyAnalysis);
    report.securityPosture = postureAssessment;

    // Include performance impact analysis of security measures
    const performanceAnalysis = analyzeSecurityPerformanceImpact(cutoffTime, Date.now());
    report.performanceImpact = performanceAnalysis;

    // Generate compliance assessment against security standards and frameworks
    if (config.includeComplianceAssessment) {
      const complianceAssessment = assessSecurityCompliance(aggregatedMetrics, policyAnalysis);
      report.complianceAssessment = complianceAssessment;
    }

    // Create actionable recommendations for security improvements
    if (config.includeRecommendations) {
      const recommendations = generateSecurityRecommendations(
        postureAssessment, 
        policyAnalysis, 
        threatAnalysis
      );
      report.recommendations = recommendations;
    }

    // Generate executive summary for management consumption
    if (config.includeExecutiveSummary) {
      report.executiveSummary = generateExecutiveSummary(report);
    }

    // Add educational insights for learning and development
    if (config.includeEducationalInsights) {
      report.educationalInsights = {
        securityPrinciples: {
          defenseInDepth: 'Multiple layers of security controls provide comprehensive protection',
          principleOfLeastPrivilege: 'Grant minimum necessary access to reduce attack surface',
          failSecure: 'Systems should fail to a secure state when errors occur'
        },
        threatLandscape: {
          currentTrends: getThreatLandscapeTrends(),
          emergingThreats: getEmergingThreats(),
          industryBenchmarks: getIndustrySecurityBenchmarks()
        },
        bestPractices: {
          monitoring: 'Continuous security monitoring and alerting',
          responseTime: 'Rapid incident detection and response',
          prevention: 'Proactive threat prevention over reactive response'
        },
        learningResources: getSecurityLearningResources()
      };
    }

    report.metadata.generationTime = Date.now() - reportGenerationStart;

    // Format report for security teams and management consumption
    const formattedReport = formatSecurityReport(report, config.format);

    logger.info('Security report generated', {
      reportId: report.metadata.reportId,
      reportType: config.reportType,
      timeRange,
      threatsAnalyzed: report.threatAnalysis.totalThreats,
      recommendationsGenerated: report.recommendations.length,
      generationTime: report.metadata.generationTime
    });

    return formattedReport;

  } catch (error) {
    logger.error('Security report generation failed', error, {
      reportType: config.reportType,
      timeRange
    });

    return {
      ...report,
      error: {
        message: 'Security report generation failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      metadata: {
        ...report.metadata,
        generationTime: Date.now() - reportGenerationStart,
        status: 'failed'
      }
    };
  }
}

/**
 * Handles security violations with appropriate response actions including request blocking,
 * rate limiting, alerting, and logging. Implements graduated response based on violation
 * severity and client history for effective threat mitigation with educational
 * security response insights and automated escalation procedures.
 * 
 * @param {Object} violation - Security violation details and context information
 * @param {Object} req - Express request object for violation context
 * @param {Object} res - Express response object for immediate response
 * @param {Function} next - Express next function for middleware continuation
 * @returns {void} No return value, handles security violation as middleware side effect
 */
export function handleSecurityViolation(violation, req, res, next) {
  const startTime = Date.now();
  
  try {
    // Classify security violation severity and threat level
    const violationClassification = classifyViolationSeverity(violation);
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    const violationType = violation.type || 'unknown';

    // Check client history and reputation for response escalation
    const clientHistory = getClientSecurityHistory(clientIP);
    const escalationLevel = determineEscalationLevel(violationClassification, clientHistory);

    // Apply immediate protective measures including request blocking or throttling
    let responseAction = 'allow';
    if (escalationLevel >= 3 || violationClassification.severity === 'critical') {
      responseAction = 'block';
      
      // Generate appropriate HTTP error response with security context
      const securityError = new SecurityError(
        `Security violation detected: ${violationType}`,
        {
          violationType,
          severity: violationClassification.severity,
          clientIP,
          correlationId: req.correlationId,
          escalationLevel,
          timestamp: new Date().toISOString()
        }
      );

      // Add IP to blocked set for distributed enforcement
      BLOCKED_IPS.add(clientIP);

      logger.warn('Security violation: Request blocked', {
        correlationId: req.correlationId,
        violationType,
        severity: violationClassification.severity,
        clientIP,
        escalationLevel,
        userAgent: req.get('user-agent'),
        url: req.url
      });

      // Send security violation response and terminate request processing
      res.status(HTTP_CONSTANTS.STATUS_CODES_INT.FORBIDDEN).json({
        error: 'Security violation detected',
        type: violationType,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
      
      return; // Terminate middleware chain for blocked requests
    }

    // Log detailed security violation information for investigation
    logSecurityViolationDetails(violation, req, violationClassification, escalationLevel);

    // Update threat detection patterns and blacklist information
    updateThreatDetectionPatterns(violation, violationClassification);

    // Trigger security alerts for high-priority violations
    if (violationClassification.severity === 'high' || escalationLevel >= 2) {
      triggerSecurityAlert({
        type: 'security-violation',
        violation,
        classification: violationClassification,
        clientIP,
        escalationLevel,
        correlationId: req.correlationId
      });
    }

    // Update security metrics and violation tracking systems
    updateSecurityViolationTracking(violationType, violationClassification, escalationLevel);

    // Apply rate limiting or IP blocking for repeat offenders
    if (clientHistory.violationCount >= 5) {
      applyRateLimitingEscalation(clientIP, violationType);
    }

    // Add security violation context to request for downstream middleware
    req.securityViolation = {
      type: violationType,
      severity: violationClassification.severity,
      escalationLevel,
      responseAction,
      processingTime: Date.now() - startTime
    };

    // Continue middleware chain with security context attached
    next();

  } catch (error) {
    logger.error('Security violation handling failed', error, {
      correlationId: req.correlationId,
      violationType: violation?.type,
      clientIP: req.ip,
      processingTime: Date.now() - startTime
    });

    // Continue with error to prevent blocking legitimate requests due to handler errors
    next(error);
  }
}

/**
 * Optimizes security middleware performance by analyzing execution patterns, caching
 * security configurations, and minimizing computational overhead while maintaining
 * security effectiveness. Implements performance monitoring and adaptive optimization
 * with educational performance insights and automated tuning capabilities.
 * 
 * @param {Object} performanceMetrics - Current performance metrics and execution data
 * @param {Object} [optimizationConfig={}] - Performance optimization configuration
 * @param {boolean} [optimizationConfig.enableCaching=true] - Enable configuration caching
 * @param {boolean} [optimizationConfig.enableAdaptiveOptimization=true] - Enable adaptive tuning
 * @param {boolean} [optimizationConfig.enableEducationalMode=false] - Enable educational insights
 * @returns {Object} Security performance optimization results with improvements and recommendations
 */
export function optimizeSecurityPerformance(performanceMetrics, optimizationConfig = {}) {
  const config = {
    enableCaching: optimizationConfig.enableCaching ?? true,
    enableAdaptiveOptimization: optimizationConfig.enableAdaptiveOptimization ?? true,
    enableEducationalMode: optimizationConfig.enableEducationalMode ?? false,
    performanceTargets: {
      maxMiddlewareLatency: 50, // milliseconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxCPUUsage: 10, // percentage
      ...optimizationConfig.performanceTargets
    },
    optimizationThresholds: {
      latencyWarning: 25, // milliseconds
      memoryWarning: 50 * 1024 * 1024, // 50MB
      cpuWarning: 5, // percentage
      ...optimizationConfig.optimizationThresholds
    },
    ...optimizationConfig
  };

  const optimizationResult = {
    optimizationsApplied: [],
    performanceImprovement: {},
    recommendations: [],
    cacheEfficiency: {},
    adaptiveAdjustments: [],
    educationalInsights: {}
  };

  const optimizationStartTime = Date.now();

  try {
    // Analyze security middleware execution times and computational costs
    const executionAnalysis = analyzeSecurityMiddlewareExecution(performanceMetrics);
    
    // Identify performance bottlenecks in security validation and threat detection
    const bottlenecks = identifyPerformanceBottlenecks(executionAnalysis, config);
    optimizationResult.bottlenecks = bottlenecks;

    // Implement caching strategies for security configurations and policies
    if (config.enableCaching && bottlenecks.configurationLookup) {
      const cachingOptimization = implementSecurityConfigCaching();
      optimizationResult.optimizationsApplied.push(cachingOptimization);
    }

    // Optimize threat detection algorithms for reduced CPU usage
    if (bottlenecks.threatDetection) {
      const threatDetectionOptimization = optimizeThreatDetectionAlgorithms(performanceMetrics);
      optimizationResult.optimizationsApplied.push(threatDetectionOptimization);
    }

    // Streamline security header generation and validation processes
    if (bottlenecks.headerGeneration) {
      const headerOptimization = optimizeSecurityHeaderGeneration();
      optimizationResult.optimizationsApplied.push(headerOptimization);
    }

    // Implement lazy loading for expensive security operations
    if (bottlenecks.expensiveOperations) {
      const lazyLoadingOptimization = implementLazySecurityLoading();
      optimizationResult.optimizationsApplied.push(lazyLoadingOptimization);
    }

    // Cache security validation results for repeated requests
    if (config.enableCaching && bottlenecks.validationRepeats) {
      const validationCaching = implementValidationResultCaching();
      optimizationResult.optimizationsApplied.push(validationCaching);
    }

    // Optimize memory usage in security pattern matching and detection
    if (bottlenecks.memoryUsage) {
      const memoryOptimization = optimizeSecurityMemoryUsage();
      optimizationResult.optimizationsApplied.push(memoryOptimization);
    }

    // Monitor security middleware impact on overall application performance
    const performanceImpactAnalysis = analyzeOverallPerformanceImpact(performanceMetrics, optimizationStartTime);
    optimizationResult.performanceImpact = performanceImpactAnalysis;

    // Generate performance optimization recommendations
    optimizationResult.recommendations = generatePerformanceRecommendations(
      bottlenecks, 
      performanceMetrics, 
      config
    );

    // Apply adaptive optimization based on runtime performance patterns
    if (config.enableAdaptiveOptimization) {
      const adaptiveAdjustments = applyAdaptiveSecurityOptimizations(performanceMetrics, config);
      optimizationResult.adaptiveAdjustments = adaptiveAdjustments;
    }

    // Measure and report cache efficiency metrics
    if (config.enableCaching) {
      optimizationResult.cacheEfficiency = measureCacheEfficiency();
    }

    // Generate educational insights about security performance optimization
    if (config.enableEducationalMode) {
      optimizationResult.educationalInsights = {
        performanceOptimizationPrinciples: {
          caching: 'Store frequently accessed security configurations to reduce computation',
          lazyLoading: 'Defer expensive security operations until necessary',
          algorithmOptimization: 'Use efficient algorithms for pattern matching and validation',
          memoryManagement: 'Minimize memory allocation and garbage collection pressure'
        },
        optimizationStrategies: {
          proactive: 'Prevent performance issues through design and implementation',
          reactive: 'Respond to performance issues through monitoring and adjustment',
          adaptive: 'Automatically adjust based on runtime performance patterns'
        },
        performanceMetrics: {
          latency: 'Time taken to process security operations',
          throughput: 'Number of requests processed per second',
          resourceUtilization: 'CPU and memory usage by security middleware',
          cacheHitRate: 'Percentage of requests served from cache'
        }
      };
    }

    optimizationResult.optimizationTime = Date.now() - optimizationStartTime;

    logger.info('Security performance optimization completed', {
      optimizationsApplied: optimizationResult.optimizationsApplied.length,
      performanceImprovement: optimizationResult.performanceImprovement,
      recommendationsGenerated: optimizationResult.recommendations.length,
      optimizationTime: optimizationResult.optimizationTime,
      cacheEfficiency: optimizationResult.cacheEfficiency
    });

    return optimizationResult;

  } catch (error) {
    logger.error('Security performance optimization failed', error, {
      optimizationTime: Date.now() - optimizationStartTime
    });

    return {
      ...optimizationResult,
      error: {
        message: 'Performance optimization failed',
        details: error.message
      },
      optimizationTime: Date.now() - optimizationStartTime
    };
  }
}

// Helper functions for security middleware implementation

/**
 * Creates request validation middleware for input sanitization and threat detection
 * @private
 */
function createRequestValidationMiddleware(securityConfig) {
  return async function requestValidation(req, res, next) {
    const validationStart = Date.now();
    
    try {
      const validationResult = validateRequest(req, {
        strictMode: securityConfig.strictMode,
        enableEducationalMode: securityConfig.enableEducationalMode
      });

      if (!validationResult.isValid && validationResult.threatLevel !== 'low') {
        req.securityContext.violations.push(...validationResult.violations);
        req.securityContext.threatLevel = validationResult.threatLevel;
      }

      if (securityConfig.enablePerformanceOptimization) {
        req.securityMetrics.validationTime = Date.now() - validationStart;
      }

      next();
    } catch (error) {
      next(new SecurityError('Request validation failed', { originalError: error }));
    }
  };
}

/**
 * Creates threat detection middleware for advanced pattern analysis
 * @private
 */
function createThreatDetectionMiddleware(securityConfig) {
  return async function threatDetection(req, res, next) {
    const detectionStart = Date.now();
    
    try {
      if (securityConfig.enableThreatDetection) {
        const threatAnalysis = detectThreats(req, {
          enableEducationalMode: securityConfig.enableEducationalMode
        });

        if (threatAnalysis.riskScore > securityConfig.threatThreshold) {
          req.securityContext.threatAnalysis = threatAnalysis;
          req.securityContext.threatLevel = calculateThreatLevel([{ 
            type: 'high-risk-detection', 
            severity: 'high' 
          }]);
        }

        // Update global threat metrics
        SECURITY_METRICS.threatsDetected += threatAnalysis.threatTypes.length;
        if (threatAnalysis.riskScore > 50) {
          SECURITY_METRICS.lastThreatDetection = Date.now();
        }
      }

      if (securityConfig.enablePerformanceOptimization) {
        req.securityMetrics.threatDetectionTime = Date.now() - detectionStart;
      }

      next();
    } catch (error) {
      next(new SecurityError('Threat detection failed', { originalError: error }));
    }
  };
}

/**
 * Executes security middleware pipeline in optimal order
 * @private
 */
async function executeSecurityPipeline(req, res, middleware, config) {
  const pipelineStart = Date.now();
  
  // Execute middleware in performance-optimized order
  const middlewareOrder = [
    'helmetMiddleware',
    'corsMiddleware', 
    'rateLimitingMiddleware',
    'requestValidationMiddleware',
    'threatDetectionMiddleware',
    'securityLoggingMiddleware'
  ];

  for (const middlewareName of middlewareOrder) {
    const middlewareFunction = middleware[middlewareName];
    if (middlewareFunction) {
      const middlewareStart = Date.now();
      
      await new Promise((resolve, reject) => {
        middlewareFunction(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      if (config.enablePerformanceOptimization) {
        const middlewareTime = Date.now() - middlewareStart;
        req.securityMetrics[`${middlewareName}Time`] = middlewareTime;
      }
    }
  }

  req.securityContext.pipelineExecutionTime = Date.now() - pipelineStart;
}

/**
 * Handles security violations detected during pipeline execution
 * @private
 */
async function handleSecurityViolations(req, res, config) {
  const violations = req.securityContext.violations;
  
  for (const violation of violations) {
    const enforcementResult = enforceSecurityPolicies(violation, {
      enforcementMode: config.strictMode ? 'strict' : 'moderate',
      enableEducationalMode: config.enableEducationalMode
    });

    if (enforcementResult.blockingDecision === 'blocked') {
      throw new SecurityError('Request blocked due to security violation', {
        violation,
        enforcementResult,
        correlationId: req.securityContext.correlationId
      });
    }
  }
}

/**
 * Updates security metrics for monitoring and analysis
 * @private
 */
function updateSecurityMetrics(req, config) {
  SECURITY_METRICS.requestsProcessed++;
  
  if (req.securityContext.violations.length > 0) {
    SECURITY_METRICS.violationsBlocked++;
  }

  if (config.enablePerformanceOptimization && req.securityMetrics) {
    const totalSecurityTime = Object.values(req.securityMetrics)
      .filter(time => typeof time === 'number')
      .reduce((sum, time) => sum + time, 0);
    
    SECURITY_METRICS.performanceImpact = 
      (SECURITY_METRICS.performanceImpact + totalSecurityTime) / 2;
  }
}

/**
 * Generates secure correlation ID for request tracking
 * @private
 */
function generateSecurityCorrelationId() {
  const timestamp = Date.now().toString(36);
  const randomBytes = randomBytes(8).toString('hex');
  const processId = process.pid.toString(36);
  return `sec-${timestamp}-${randomBytes}-${processId}`;
}

// Additional helper functions would continue here with comprehensive implementations
// for all the security functionality including validation, threat detection, 
// policy enforcement, header generation, metrics monitoring, and performance optimization

// Export the main security middleware and utility functions
export {
  // Main middleware factory
  createSecurityMiddleware as default,
  
  // Core security functions
  createSecurityMiddleware,
  validateRequest,
  detectThreats,
  enforceSecurityPolicies,
  createSecurityHeaders,
  monitorSecurityMetrics,
  sanitizeSecurityContext,
  createSecurityReport,
  handleSecurityViolation,
  optimizeSecurityPerformance
};

// Export security middleware as default for easy import
const securityMiddleware = createSecurityMiddleware();
export { securityMiddleware };