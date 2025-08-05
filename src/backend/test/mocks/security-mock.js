/**
 * Mock Security Configuration for Testing
 * Provides minimal security config to bypass complex initialization
 */

export const defaultSecurityConfig = {
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
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  }
};

// Mock CSP functions
export function createContentSecurityPolicy(config = {}) {
  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"]
    }
  };
}

export function createDevelopmentCspPolicy(config = {}) {
  return createContentSecurityPolicy(config);
}

export function createProductionCspPolicy(config = {}) {
  return createContentSecurityPolicy(config);
}

// Mock Helmet functions
export function createHelmetConfig(environment = 'test') {
  return defaultSecurityConfig.helmet;
}

export function createSecurityConfig(environment = 'test') {
  return defaultSecurityConfig;
}

export default defaultSecurityConfig;