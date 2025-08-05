/**
 * Mock Configuration Index for Testing
 * Provides complete configuration mock to bypass complex initialization
 */

const mockConfig = {
  database: {
    enabled: false,
    stateless: true,
    type: 'mock'
  },
  security: {
    helmet: {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      dnsPrefetchControl: false,
      frameguard: false,
      hidePoweredBy: true,
      hsts: false,
      ieNoOpen: false,
      noSniff: true,
      originAgentCluster: false,
      permittedCrossDomainPolicies: false,
      referrerPolicy: false,
      xssFilter: false
    },
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"]
      }
    }
  },
  environment: {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: 'localhost'
  },
  pm2: {
    name: 'test-server',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    apps: [{
      name: 'test-server',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork'
    }],
    cluster: {
      enabled: false,
      instances: 1
    },
    monitoring: {
      enabled: false
    }
  }
};

// Export main config object
export const config = mockConfig;

// Export individual configs
export const databaseConfig = mockConfig.database;
export const securityConfig = mockConfig.security;
export const environmentConfig = mockConfig.environment;
export const pm2Config = mockConfig.pm2;

// Export configuration functions
export async function initializeConfiguration() {
  return mockConfig;
}

export async function validateConfiguration(config) {
  return {
    isValid: true,
    errors: [],
    warnings: []
  };
}

export function getConfigurationHealth() {
  return {
    status: 'healthy',
    version: '1.0.0',
    environment: 'test'
  };
}

export default config;