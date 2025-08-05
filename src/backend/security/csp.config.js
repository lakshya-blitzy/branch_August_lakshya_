// Content Security Policy (CSP) configuration module for Node.js tutorial project
// Implements modern CSP Level 3 policies with environment-specific configurations
// Provides robust XSS prevention, resource loading control, and script execution security
// Features educational CSP implementation with progressive security policies
// Supports nonce-based script loading, report-only mode, and Helmet.js integration
// Designed for Express.js v5.1.0 integration with PM2 cluster mode compatibility

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const crypto = require('node:crypto'); // Node.js built-in cryptographic utilities v18+

import { SECURITY_CONSTANTS } from '../utils/constants.js';
import { defaultEnvironmentConfig as environmentConfig } from '../config/environment.js';
import logger, { logSecurityEvent } from '../utils/logger.js';
import { SecurityError } from '../utils/error-types.js';

// Extract CSP directives and security headers from security constants
const { CSP_DIRECTIVES, SECURITY_HEADERS } = SECURITY_CONSTANTS;
const { security, isProduction, isDevelopment, currentEnvironment } = environmentConfig;

// Global CSP configuration constants
const CSP_POLICY_CACHE = new Map();
const DEFAULT_CSP_NONCE_LENGTH = 32;
const CSP_REPORT_ENDPOINT = '/api/csp-report';

/**
 * Generates cryptographically secure nonce for CSP script-src and style-src directives
 * Creates unique random tokens for inline script and style security while preventing XSS attacks
 * 
 * @param {number} length - Nonce length in bytes (default: 32)
 * @returns {string} Cryptographically secure base64-encoded nonce string for CSP directive usage
 */
export function generateCSPNonce(length = DEFAULT_CSP_NONCE_LENGTH) {
    try {
        // Validate nonce length parameter or use default
        const nonceLength = typeof length === 'number' && length > 0 ? length : DEFAULT_CSP_NONCE_LENGTH;
        
        // Generate cryptographically secure random bytes using Node.js crypto module
        const randomBytes = crypto.randomBytes(nonceLength);
        
        // Encode random bytes to base64 for CSP nonce compatibility
        const nonce = randomBytes.toString('base64');
        
        // Validate nonce format and length meet CSP security requirements
        if (!nonce || nonce.length < 16) {
            throw new SecurityError('Generated nonce does not meet minimum security requirements');
        }
        
        // Log nonce generation for debugging and security auditing
        logger.debug('CSP nonce generated', { 
            nonceLength: nonce.length, 
            environment: currentEnvironment,
            timestamp: new Date().toISOString()
        });
        
        // Return base64-encoded nonce ready for CSP directive usage
        return nonce;
    } catch (error) {
        logSecurityEvent('csp_nonce_generation_failed', {
            error: error.message,
            length,
            environment: currentEnvironment
        });
        throw new SecurityError(`CSP nonce generation failed: ${error.message}`);
    }
}

/**
 * Simple URL validation utility for CSP source validation
 * Validates URL format for CSP directive inclusion
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid for CSP usage
 */
function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Creates foundational CSP directives with secure defaults for all resource types
 * Establishes baseline security policies that apply across all environments
 * 
 * @param {string} environment - Target environment (development, production, staging)
 * @returns {object} Base CSP directives object with secure defaults for all resource types
 */
export function createBaseCspDirectives(environment) {
    try {
        // Initialize CSP directives object with secure default-src policy
        const baseDirectives = {
            'default-src': ["'self'"],
            
            // Configure script-src directive with self and nonce-based execution
            'script-src': [
                "'self'",
                "'nonce-{NONCE}'" // Placeholder for dynamic nonce injection
            ],
            
            // Set style-src directive allowing self and secure inline styles with nonces
            'style-src': [
                "'self'",
                "'nonce-{NONCE}'" // Placeholder for dynamic nonce injection
            ],
            
            // Configure img-src directive for images from self and data URLs
            'img-src': [
                "'self'",
                'data:',
                'https:'
            ],
            
            // Set font-src directive allowing self and common font CDNs
            'font-src': [
                "'self'",
                'https://fonts.gstatic.com',
                'https://fonts.googleapis.com'
            ],
            
            // Configure connect-src directive for API endpoints and WebSocket connections
            'connect-src': [
                "'self'"
            ],
            
            // Set frame-src directive to none for iframe protection
            'frame-src': ["'none'"],
            
            // Configure object-src and embed-src to none for plugin security
            'object-src': ["'none'"],
            'embed-src': ["'none'"],
            
            // Set base-uri directive to self for base tag security
            'base-uri': ["'self'"],
            
            // Configure form-action directive limiting form submission targets
            'form-action': ["'self'"],
            
            // Set frame-ancestors directive for embedding control
            'frame-ancestors': ["'none'"],
            
            // Add upgrade-insecure-requests for HTTPS enforcement
            'upgrade-insecure-requests': [],
            
            // Configure block-all-mixed-content for secure resource loading
            'block-all-mixed-content': []
        };
        
        // Log base CSP directive creation
        logger.debug('Base CSP directives created', {
            environment,
            directiveCount: Object.keys(baseDirectives).length,
            timestamp: new Date().toISOString()
        });
        
        // Return comprehensive base CSP directives object
        return baseDirectives;
    } catch (error) {
        logSecurityEvent('base_csp_creation_failed', {
            error: error.message,
            environment
        });
        throw new SecurityError(`Failed to create base CSP directives: ${error.message}`);
    }
}

/**
 * Creates development-friendly CSP policy with relaxed directives for development tools
 * Supports hot reloading, development servers, debugging tools, and live reload functionality
 * 
 * @param {object} baseDirectives - Base CSP directives to customize
 * @param {object} options - Development-specific options
 * @returns {object} Development-optimized CSP policy with relaxed directives
 */
export function createDevelopmentCspPolicy(baseDirectives, options = {}) {
    try {
        // Clone base CSP directives for development customization
        const devDirectives = JSON.parse(JSON.stringify(baseDirectives));
        
        // Add localhost and development server URLs to connect-src
        devDirectives['connect-src'].push(
            'ws://localhost:*',
            'http://localhost:*',
            'https://localhost:*',
            'ws://127.0.0.1:*',
            'http://127.0.0.1:*'
        );
        
        // Allow unsafe-inline and unsafe-eval for development debugging tools
        if (options.allowUnsafeInline) {
            devDirectives['script-src'].push("'unsafe-inline'");
            devDirectives['style-src'].push("'unsafe-inline'");
        }
        
        if (options.allowUnsafeEval) {
            devDirectives['script-src'].push("'unsafe-eval'");
        }
        
        // Add development asset servers and hot reload URLs to script-src
        devDirectives['script-src'].push(
            'http://localhost:*',
            'https://localhost:*',
            'ws://localhost:*'
        );
        
        // Allow data URLs and blob URLs for development asset loading
        devDirectives['img-src'].push('blob:');
        devDirectives['connect-src'].push('blob:');
        
        // Set up CSP violation reporting for policy development
        if (options.reportUri || CSP_REPORT_ENDPOINT) {
            devDirectives['report-uri'] = [options.reportUri || CSP_REPORT_ENDPOINT];
        }
        
        // Create development CSP policy with report-only mode option
        const devPolicy = {
            directives: devDirectives,
            reportOnly: options.reportOnly !== false, // Default to report-only in development
            upgradeInsecureRequests: false, // Allow HTTP in development
            blockAllMixedContent: false // Allow mixed content for development flexibility
        };
        
        // Log development CSP policy creation with security warnings
        logger.warn('Development CSP policy created with relaxed security', {
            reportOnly: devPolicy.reportOnly,
            unsafeInline: options.allowUnsafeInline,
            unsafeEval: options.allowUnsafeEval,
            environment: currentEnvironment
        });
        
        // Return development-friendly CSP policy configuration
        return devPolicy;
    } catch (error) {
        logSecurityEvent('development_csp_creation_failed', {
            error: error.message,
            options
        });
        throw new SecurityError(`Failed to create development CSP policy: ${error.message}`);
    }
}

/**
 * Creates production-hardened CSP policy with strict directives for maximum security
 * Implements comprehensive XSS prevention, resource control, and attack surface minimization
 * 
 * @param {object} baseDirectives - Base CSP directives to harden
 * @param {object} options - Production-specific options
 * @returns {object} Production-hardened CSP policy with strict security enforcement
 */
export function createProductionCspPolicy(baseDirectives, options = {}) {
    try {
        // Clone base CSP directives for production hardening
        const prodDirectives = JSON.parse(JSON.stringify(baseDirectives));
        
        // Remove all unsafe directives for strict enforcement
        Object.keys(prodDirectives).forEach(directive => {
            prodDirectives[directive] = prodDirectives[directive].filter(value => 
                !value.includes('unsafe-inline') && !value.includes('unsafe-eval')
            );
        });
        
        // Configure strict connect-src allowing only necessary API endpoints
        prodDirectives['connect-src'] = ["'self'"];
        
        // Add production-specific trusted domains if provided
        if (options.trustedDomains && Array.isArray(options.trustedDomains)) {
            options.trustedDomains.forEach(domain => {
                if (validateUrl(`https://${domain}`)) {
                    prodDirectives['connect-src'].push(`https://${domain}`);
                }
            });
        }
        
        // Set restrictive img-src policy with specific allowed domains
        prodDirectives['img-src'] = [
            "'self'",
            'data:',
            'https:'
        ];
        
        // Configure strict object-src and embed-src policies
        prodDirectives['object-src'] = ["'none'"];
        prodDirectives['embed-src'] = ["'none'"];
        
        // Set up require-sri-for directive for subresource integrity
        if (options.requireSri) {
            prodDirectives['require-sri-for'] = ['script', 'style'];
        }
        
        // Configure trusted-types for DOM XSS prevention (CSP Level 3)
        if (options.enableTrustedTypes) {
            prodDirectives['trusted-types'] = ["'none'"];
        }
        
        // Create production CSP policy with strict enforcement
        const prodPolicy = {
            directives: prodDirectives,
            reportOnly: false, // Enforce policy in production
            upgradeInsecureRequests: true, // Force HTTPS
            blockAllMixedContent: true, // Block all mixed content
            reportUri: options.reportUri || CSP_REPORT_ENDPOINT
        };
        
        // Log production CSP policy creation with security compliance status
        logger.info('Production CSP policy created with strict security enforcement', {
            directiveCount: Object.keys(prodDirectives).length,
            requireSri: options.requireSri,
            trustedTypes: options.enableTrustedTypes,
            trustedDomains: options.trustedDomains?.length || 0,
            environment: currentEnvironment
        });
        
        // Return enterprise-grade production CSP policy
        return prodPolicy;
    } catch (error) {
        logSecurityEvent('production_csp_creation_failed', {
            error: error.message,
            options
        });
        throw new SecurityError(`Failed to create production CSP policy: ${error.message}`);
    }
}

/**
 * Creates staging environment CSP policy balancing production-like security with testing flexibility
 * Enables comprehensive security testing while supporting load testing and validation workflows
 * 
 * @param {object} baseDirectives - Base CSP directives to customize
 * @param {object} options - Staging-specific options
 * @returns {object} Staging-optimized CSP policy balancing security and testing requirements
 */
export function createStagingCspPolicy(baseDirectives, options = {}) {
    try {
        // Clone base CSP directives for staging customization
        const stagingDirectives = JSON.parse(JSON.stringify(baseDirectives));
        
        // Allow specific testing domains and load testing tools
        if (options.testingDomains && Array.isArray(options.testingDomains)) {
            options.testingDomains.forEach(domain => {
                if (validateUrl(`https://${domain}`)) {
                    stagingDirectives['connect-src'].push(`https://${domain}`);
                }
            });
        }
        
        // Configure testing-compatible nonce policies with validation
        if (options.allowTestingScripts) {
            stagingDirectives['script-src'].push("'unsafe-inline'");
        }
        
        // Set up A/B testing compatible CSP directive variations
        if (options.enableAbTesting) {
            stagingDirectives['connect-src'].push('https://*.googleapis.com');
        }
        
        // Create staging CSP policy with configurable report-only mode
        const stagingPolicy = {
            directives: stagingDirectives,
            reportOnly: options.reportOnly !== false, // Default to report-only for testing
            upgradeInsecureRequests: true,
            blockAllMixedContent: true,
            reportUri: options.reportUri || CSP_REPORT_ENDPOINT
        };
        
        // Log staging CSP policy creation with testing considerations
        logger.info('Staging CSP policy created for security testing', {
            reportOnly: stagingPolicy.reportOnly,
            testingDomains: options.testingDomains?.length || 0,
            abTesting: options.enableAbTesting,
            environment: currentEnvironment
        });
        
        // Return staging-optimized CSP policy for security testing
        return stagingPolicy;
    } catch (error) {
        logSecurityEvent('staging_csp_creation_failed', {
            error: error.message,
            options
        });
        throw new SecurityError(`Failed to create staging CSP policy: ${error.message}`);
    }
}

/**
 * Validates CSP directives for completeness, security effectiveness, and CSP Level 3 compliance
 * Ensures optimal XSS protection and identifies potential security gaps or misconfigurations
 * 
 * @param {object} cspDirectives - CSP directives to validate
 * @param {string} environment - Target environment for validation context
 * @returns {object} Validation result with security status, warnings, and recommendations
 */
export function validateCspDirectives(cspDirectives, environment) {
    try {
        const validationResult = {
            isValid: true,
            securityLevel: 'unknown',
            warnings: [],
            recommendations: [],
            compliance: {
                cspLevel3: false,
                owaspCompliant: false,
                xssProtection: false
            }
        };
        
        // Validate presence of essential CSP directives for comprehensive coverage
        const essentialDirectives = ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src'];
        const missingDirectives = essentialDirectives.filter(directive => !cspDirectives[directive]);
        
        if (missingDirectives.length > 0) {
            validationResult.warnings.push(`Missing essential directives: ${missingDirectives.join(', ')}`);
            validationResult.recommendations.push('Add missing essential CSP directives for comprehensive coverage');
        }
        
        // Check for unsafe-inline and unsafe-eval usage in production environments
        if (environment === 'production') {
            Object.entries(cspDirectives).forEach(([directive, sources]) => {
                if (Array.isArray(sources)) {
                    const hasUnsafeInline = sources.includes("'unsafe-inline'");
                    const hasUnsafeEval = sources.includes("'unsafe-eval'");
                    
                    if (hasUnsafeInline) {
                        validationResult.warnings.push(`Unsafe 'unsafe-inline' found in ${directive} for production`);
                        validationResult.securityLevel = 'low';
                    }
                    
                    if (hasUnsafeEval) {
                        validationResult.warnings.push(`Unsafe 'unsafe-eval' found in ${directive} for production`);
                        validationResult.securityLevel = 'low';
                    }
                }
            });
        }
        
        // Verify nonce-based policies are properly configured and secure
        const hasNonceSupport = cspDirectives['script-src']?.some(src => src.includes('nonce-')) ||
                               cspDirectives['style-src']?.some(src => src.includes('nonce-'));
        
        if (hasNonceSupport) {
            validationResult.compliance.xssProtection = true;
            validationResult.recommendations.push('Nonce-based CSP policies detected - ensure proper nonce rotation');
        }
        
        // Check CSP Level 3 compliance and modern security features
        const level3Features = ['trusted-types', 'require-sri-for'];
        const hasLevel3Features = level3Features.some(feature => cspDirectives[feature]);
        
        if (hasLevel3Features) {
            validationResult.compliance.cspLevel3 = true;
            validationResult.securityLevel = validationResult.securityLevel === 'low' ? 'medium' : 'high';
        }
        
        // Validate frame-ancestors for clickjacking protection
        if (cspDirectives['frame-ancestors']?.includes("'none'")) {
            validationResult.compliance.owaspCompliant = true;
        }
        
        // Determine overall security level
        if (validationResult.securityLevel === 'unknown') {
            validationResult.securityLevel = validationResult.warnings.length === 0 ? 'high' : 'medium';
        }
        
        // Generate security recommendations based on validation results
        if (environment === 'production' && validationResult.securityLevel !== 'high') {
            validationResult.recommendations.push('Consider implementing stricter CSP policies for production');
        }
        
        // Log validation results with detailed security compliance status
        logger.info('CSP directive validation completed', {
            environment,
            securityLevel: validationResult.securityLevel,
            warningCount: validationResult.warnings.length,
            cspLevel3: validationResult.compliance.cspLevel3,
            owaspCompliant: validationResult.compliance.owaspCompliant
        });
        
        // Return comprehensive CSP validation report with actionable recommendations
        return validationResult;
    } catch (error) {
        logSecurityEvent('csp_validation_failed', {
            error: error.message,
            environment
        });
        throw new SecurityError(`CSP validation failed: ${error.message}`);
    }
}

/**
 * Main factory function that creates complete Content Security Policy configuration
 * Integrates all CSP directives, validation, and optimization for Helmet.js middleware integration
 * 
 * @param {string} environment - Target environment (development, production, staging)
 * @param {object} options - CSP configuration options
 * @returns {object} Complete CSP configuration object ready for Helmet.js integration
 */
export function createContentSecurityPolicy(environment = currentEnvironment, options = {}) {
    try {
        // Validate environment parameter against supported environment types
        const validEnvironments = ['development', 'production', 'staging', 'test'];
        if (!validEnvironments.includes(environment)) {
            throw new SecurityError(`Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(', ')}`);
        }
        
        // Check CSP policy cache for existing environment configuration
        const cacheKey = `${environment}-${JSON.stringify(options)}`;
        if (CSP_POLICY_CACHE.has(cacheKey) && !options.bypassCache) {
            logger.debug('CSP policy retrieved from cache', { environment, cacheKey });
            return CSP_POLICY_CACHE.get(cacheKey);
        }
        
        // Create base CSP directives using createBaseCspDirectives function
        const baseDirectives = createBaseCspDirectives(environment);
        
        // Generate nonce values for script and style directive security
        const scriptNonce = generateCSPNonce();
        const styleNonce = generateCSPNonce();
        
        // Replace nonce placeholders with actual nonce values
        Object.keys(baseDirectives).forEach(directive => {
            if (Array.isArray(baseDirectives[directive])) {
                baseDirectives[directive] = baseDirectives[directive].map(value => 
                    value.replace('{NONCE}', directive.includes('script') ? scriptNonce : styleNonce)
                );
            }
        });
        
        // Apply environment-specific customizations based on environment type
        let cspPolicy;
        switch (environment) {
            case 'development':
                cspPolicy = createDevelopmentCspPolicy(baseDirectives, {
                    allowUnsafeInline: options.allowUnsafeInline !== false,
                    allowUnsafeEval: options.allowUnsafeEval !== false,
                    reportOnly: options.reportOnly !== false,
                    reportUri: options.reportUri,
                    ...options
                });
                break;
                
            case 'production':
                cspPolicy = createProductionCspPolicy(baseDirectives, {
                    trustedDomains: options.trustedDomains,
                    requireSri: options.requireSri === true,
                    enableTrustedTypes: options.enableTrustedTypes === true,
                    reportUri: options.reportUri,
                    ...options
                });
                break;
                
            case 'staging':
                cspPolicy = createStagingCspPolicy(baseDirectives, {
                    testingDomains: options.testingDomains,
                    allowTestingScripts: options.allowTestingScripts === true,
                    enableAbTesting: options.enableAbTesting === true,
                    reportOnly: options.reportOnly !== false,
                    reportUri: options.reportUri,
                    ...options
                });
                break;
                
            case 'test':
                // Use development-like policy for test environment with permissive settings
                cspPolicy = createDevelopmentCspPolicy(baseDirectives, {
                    allowUnsafeInline: true,
                    allowUnsafeEval: true,
                    reportOnly: true,
                    reportUri: options.reportUri,
                    ...options
                });
                break;
        }
        
        // Validate final CSP policy using validateCspDirectives function
        const validationResult = validateCspDirectives(cspPolicy.directives, environment);
        
        // Create complete CSP configuration for Helmet.js integration
        const helmetConfig = {
            contentSecurityPolicy: {
                directives: cspPolicy.directives,
                reportOnly: cspPolicy.reportOnly,
                upgradeInsecureRequests: cspPolicy.upgradeInsecureRequests,
                blockAllMixedContent: cspPolicy.blockAllMixedContent
            },
            nonces: {
                script: scriptNonce,
                style: styleNonce
            },
            validation: validationResult,
            environment,
            metadata: {
                created: new Date().toISOString(),
                version: '1.0.0',
                generator: 'Node.js Tutorial CSP Config'
            }
        };
        
        // Cache validated CSP policy for improved performance
        CSP_POLICY_CACHE.set(cacheKey, helmetConfig);
        
        // Log comprehensive CSP policy creation with metadata and compliance status
        logSecurityEvent('csp_policy_created', {
            environment,
            securityLevel: validationResult.securityLevel,
            reportOnly: cspPolicy.reportOnly,
            directiveCount: Object.keys(cspPolicy.directives).length,
            noncesGenerated: true,
            cached: true,
            compliance: validationResult.compliance
        });
        
        // Return complete CSP configuration ready for Helmet.js middleware integration
        return helmetConfig;
    } catch (error) {
        logSecurityEvent('csp_creation_failed', {
            error: error.message,
            environment,
            options
        });
        throw new SecurityError(`Failed to create CSP configuration: ${error.message}`);
    }
}

/**
 * Creates Express.js middleware function for handling CSP violation reports
 * Processes violation reports, logs security events, and triggers appropriate security responses
 * 
 * @param {object} options - CSP report handler options
 * @returns {function} Express.js middleware function for handling CSP violation reports
 */
export function getCspReportHandler(options = {}) {
    return (req, res, next) => {
        try {
            // Validate CSP violation report format and structure
            if (!req.body || typeof req.body !== 'object') {
                logger.warn('Invalid CSP violation report format', {
                    contentType: req.get('Content-Type'),
                    bodyType: typeof req.body
                });
                return res.status(400).json({ error: 'Invalid report format' });
            }
            
            // Extract violation details from CSP report
            const report = req.body['csp-report'] || req.body;
            const violationDetails = {
                documentUri: report['document-uri'],
                blockedUri: report['blocked-uri'],
                violatedDirective: report['violated-directive'],
                originalPolicy: report['original-policy'],
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                sourceFile: report['source-file'],
                lineNumber: report['line-number'],
                columnNumber: report['column-number']
            };
            
            // Log CSP violation with security event classification
            logSecurityEvent('csp_violation_reported', {
                violation: violationDetails,
                severity: options.severity || 'medium',
                environment: currentEnvironment
            });
            
            // Generate security alerts for repeated or suspicious violations
            if (options.enableAlerting) {
                // This would integrate with alerting systems in production
                logger.warn('CSP violation detected - review security policy', violationDetails);
            }
            
            // Respond to browser with appropriate status code
            res.status(204).end(); // No Content - standard CSP report response
        } catch (error) {
            logSecurityEvent('csp_report_handler_error', {
                error: error.message,
                requestPath: req.path
            });
            res.status(500).json({ error: 'Report processing failed' });
        }
    };
}

/**
 * Optimizes CSP policy for performance and security effectiveness
 * Analyzes directive redundancy, source list optimization, and policy size minimization
 * 
 * @param {object} cspPolicy - CSP policy to optimize
 * @param {object} optimizationOptions - Optimization configuration options
 * @returns {object} Optimized CSP policy with improved performance and maintained security
 */
export function optimizeCspPolicy(cspPolicy, optimizationOptions = {}) {
    try {
        const optimizedPolicy = JSON.parse(JSON.stringify(cspPolicy));
        const optimizationMetrics = {
            originalDirectives: Object.keys(cspPolicy.directives).length,
            originalSources: 0,
            optimizedDirectives: 0,
            optimizedSources: 0,
            sizeSaving: 0
        };
        
        // Count original sources
        Object.values(cspPolicy.directives).forEach(sources => {
            if (Array.isArray(sources)) {
                optimizationMetrics.originalSources += sources.length;
            }
        });
        
        // Remove deprecated directives and replace with modern alternatives
        if (optimizedPolicy.directives['x-frame-options']) {
            delete optimizedPolicy.directives['x-frame-options'];
            // frame-ancestors supersedes x-frame-options
        }
        
        // Consolidate similar directives for parsing efficiency
        if (optimizationOptions.consolidateDirectives) {
            // Remove duplicate sources across directives
            Object.keys(optimizedPolicy.directives).forEach(directive => {
                if (Array.isArray(optimizedPolicy.directives[directive])) {
                    optimizedPolicy.directives[directive] = [...new Set(optimizedPolicy.directives[directive])];
                }
            });
        }
        
        // Optimize source lists for minimal policy size and maximum security
        if (optimizationOptions.optimizeSources) {
            Object.keys(optimizedPolicy.directives).forEach(directive => {
                const sources = optimizedPolicy.directives[directive];
                if (Array.isArray(sources)) {
                    // Remove redundant 'https:' if specific HTTPS domains are listed
                    const hasSpecificHttps = sources.some(src => src.startsWith('https://'));
                    if (hasSpecificHttps && sources.includes('https:')) {
                        optimizedPolicy.directives[directive] = sources.filter(src => src !== 'https:');
                    }
                }
            });
        }
        
        // Count optimized sources and calculate metrics
        Object.values(optimizedPolicy.directives).forEach(sources => {
            if (Array.isArray(sources)) {
                optimizationMetrics.optimizedSources += sources.length;
            }
        });
        
        optimizationMetrics.optimizedDirectives = Object.keys(optimizedPolicy.directives).length;
        optimizationMetrics.sizeSaving = optimizationMetrics.originalSources - optimizationMetrics.optimizedSources;
        
        // Log optimization results and performance improvements
        logger.info('CSP policy optimization completed', {
            metrics: optimizationMetrics,
            optimizations: optimizationOptions,
            environment: currentEnvironment
        });
        
        // Return optimized CSP policy with performance metadata
        return {
            ...optimizedPolicy,
            optimization: {
                metrics: optimizationMetrics,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        logSecurityEvent('csp_optimization_failed', {
            error: error.message,
            optimizationOptions
        });
        throw new SecurityError(`CSP optimization failed: ${error.message}`);
    }
}

/**
 * Generates comprehensive documentation for CSP configuration
 * Provides detailed CSP implementation guidance and educational content
 * 
 * @param {object} cspPolicy - CSP policy to document
 * @param {string} format - Documentation output format (markdown, json, html)
 * @returns {object} Comprehensive CSP configuration documentation with security explanations
 */
export function createCspDocumentation(cspPolicy, format = 'markdown') {
    try {
        const documentation = {
            title: 'Content Security Policy Configuration Documentation',
            version: '1.0.0',
            generated: new Date().toISOString(),
            environment: currentEnvironment,
            sections: {}
        };
        
        // Generate documentation structure for all CSP directives and policies
        documentation.sections.overview = {
            description: 'Content Security Policy (CSP) implementation for Node.js tutorial project',
            purpose: 'Demonstrates modern CSP Level 3 policies with comprehensive XSS prevention',
            features: [
                'Environment-specific CSP configurations',
                'Nonce-based script and style execution security',
                'CSP violation reporting and monitoring',
                'Helmet.js middleware integration',
                'Cross-platform compatibility with Flask implementations'
            ]
        };
        
        // Create detailed explanations for each directive purpose and security benefits
        documentation.sections.directives = {};
        Object.entries(cspPolicy.directives || {}).forEach(([directive, sources]) => {
            documentation.sections.directives[directive] = {
                purpose: getDirectivePurpose(directive),
                sources: Array.isArray(sources) ? sources : [sources],
                securityBenefit: getDirectiveSecurityBenefit(directive),
                examples: getDirectiveExamples(directive)
            };
        });
        
        // Include XSS attack prevention information and CSP effectiveness
        documentation.sections.security = {
            xssProtection: 'CSP provides comprehensive protection against XSS attacks through script execution control',
            clickjackingPrevention: 'Frame-ancestors directive prevents clickjacking and UI redressing attacks',
            dataInjectionPrevention: 'Resource loading restrictions prevent malicious content injection',
            modernFeatures: 'CSP Level 3 features including trusted-types and require-sri-for directives'
        };
        
        // Format documentation according to specified output format
        if (format === 'json') {
            return documentation;
        } else if (format === 'markdown') {
            return generateMarkdownDocumentation(documentation);
        } else if (format === 'html') {
            return generateHtmlDocumentation(documentation);
        }
        
        // Return comprehensive educational CSP documentation
        return documentation;
    } catch (error) {
        logSecurityEvent('csp_documentation_failed', {
            error: error.message,
            format
        });
        throw new SecurityError(`CSP documentation generation failed: ${error.message}`);
    }
}

/**
 * Helper function to get directive purpose description
 * @private
 */
function getDirectivePurpose(directive) {
    const purposes = {
        'default-src': 'Serves as fallback for other CSP fetch directives',
        'script-src': 'Controls which scripts can be executed',
        'style-src': 'Controls which stylesheets can be applied',
        'img-src': 'Controls which images can be loaded',
        'connect-src': 'Controls which URLs can be loaded using script interfaces',
        'font-src': 'Controls which fonts can be loaded',
        'frame-src': 'Controls which URLs can be embedded as frames',
        'object-src': 'Controls which plugins can be embedded',
        'base-uri': 'Controls which URLs can appear in the base element',
        'form-action': 'Controls which URLs can be used as form action targets'
    };
    return purposes[directive] || 'Security directive for resource control';
}

/**
 * Helper function to get directive security benefit
 * @private
 */
function getDirectiveSecurityBenefit(directive) {
    const benefits = {
        'script-src': 'Prevents XSS attacks by controlling script execution',
        'style-src': 'Prevents CSS-based attacks and data exfiltration',
        'frame-ancestors': 'Prevents clickjacking and UI redressing attacks',
        'object-src': 'Prevents plugin-based vulnerabilities',
        'base-uri': 'Prevents base tag injection attacks'
    };
    return benefits[directive] || 'Enhances application security through resource control';
}

/**
 * Helper function to get directive examples
 * @private
 */
function getDirectiveExamples(directive) {
    return [
        `Example usage of ${directive} directive in CSP policy`,
        'Demonstrates secure resource loading patterns',
        'Shows modern CSP implementation best practices'
    ];
}

/**
 * Generate markdown format documentation
 * @private
 */
function generateMarkdownDocumentation(documentation) {
    let markdown = `# ${documentation.title}\n\n`;
    markdown += `Generated: ${documentation.generated}\n`;
    markdown += `Environment: ${documentation.environment}\n\n`;
    
    // Add sections
    Object.entries(documentation.sections).forEach(([sectionName, content]) => {
        markdown += `## ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n`;
        if (typeof content === 'object') {
            Object.entries(content).forEach(([key, value]) => {
                markdown += `**${key}**: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n\n`;
            });
        }
    });
    
    return markdown;
}

/**
 * Generate HTML format documentation
 * @private
 */
function generateHtmlDocumentation(documentation) {
    return `
        <html>
        <head><title>${documentation.title}</title></head>
        <body>
            <h1>${documentation.title}</h1>
            <p>Generated: ${documentation.generated}</p>
            <p>Environment: ${documentation.environment}</p>
            <pre>${JSON.stringify(documentation, null, 2)}</pre>
        </body>
        </html>
    `;
}

// Default CSP configurations for different environments
export const cspDefaults = {
    development: {
        allowUnsafeInline: true,
        allowUnsafeEval: true,
        reportOnly: true,
        reportUri: CSP_REPORT_ENDPOINT
    },
    production: {
        requireSri: true,
        enableTrustedTypes: true,
        reportOnly: false,
        reportUri: CSP_REPORT_ENDPOINT
    },
    staging: {
        reportOnly: true,
        allowTestingScripts: false,
        enableAbTesting: false,
        reportUri: CSP_REPORT_ENDPOINT
    }
};

// Export main CSP configuration function as default
export default createContentSecurityPolicy;