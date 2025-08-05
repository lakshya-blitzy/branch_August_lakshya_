/**
 * @fileoverview Security Headers Middleware for Node.js Tutorial Project
 * @description Express.js middleware that applies essential HTTP security headers
 * including Content-Security-Policy, Strict-Transport-Security, X-Frame-Options,
 * X-Content-Type-Options, and Referrer-Policy for protection against common web attacks.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

import { defaultEnvironmentConfig } from '../config/environment.js';
import { securityTestData } from '../test/fixtures/test-data.js';

/**
 * Security headers configuration based on test requirements
 */
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Origin-Agent-Cluster': '?1',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '0'
};

/**
 * Express middleware that applies security headers to all responses
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export default function securityHeaders(req, res, next) {
  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([headerName, headerValue]) => {
    res.setHeader(headerName, headerValue);
  });

  // Remove X-Powered-By header for security (if method exists)
  if (typeof res.removeHeader === 'function') {
    res.removeHeader('X-Powered-By');
  }

  next();
}

/**
 * Validates that required security headers are present in response headers
 * 
 * @param {Object} headers - Response headers object
 * @returns {boolean} True if all required headers are present
 */
export function validateSecurityHeaders(headers) {
  const requiredHeaders = securityTestData.securityHeaders.requiredHeaders;
  
  // Check that all required headers are present
  for (const requiredHeader of requiredHeaders) {
    if (!headers[requiredHeader]) {
      return false;
    }
  }

  // Check that forbidden headers are not present
  const forbiddenHeaders = securityTestData.securityHeaders.forbiddenHeaders;
  for (const forbiddenHeader of forbiddenHeaders) {
    if (headers[forbiddenHeader]) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a security helper object for testing
 * 
 * @returns {Object} Security helper with validation functions
 */
export function createSecurityHelper() {
  return {
    validateSecurityHeaders
  };
}