/**
 * @fileoverview Helmet Configuration Middleware for Express.js Security Headers
 * @description Provides helmet middleware configuration and factory functions for security headers
 * @version 1.0.0
 */

import helmet from 'helmet';
import { createHelmetConfig } from '../security/helmet.config.js';

/**
 * Creates a Helmet configuration middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
export function createHelmetConfigMiddleware(options = {}) {
  const helmetConfig = createHelmetConfig(options.environment, options);
  return helmet(helmetConfig);
}

/**
 * Default helmet middleware with production-ready defaults
 */
export const helmetMiddleware = createHelmetConfigMiddleware({
  environment: process.env.NODE_ENV || 'development'
});

// Export additional utilities
export { createHelmetConfig } from '../security/helmet.config.js';