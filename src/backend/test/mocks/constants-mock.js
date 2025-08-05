/**
 * Mock Constants for Testing
 * Provides minimal constants to bypass complex initialization
 */

export const ENV_CONSTANTS = {
  ENVIRONMENT_TYPES: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    STAGING: 'staging',
    TEST: 'test'
  },
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  }
};

export const HTTP_CONSTANTS = {
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },
  HEADERS: {
    CONTENT_TYPE: 'content-type',
    AUTHORIZATION: 'authorization',
    X_POWERED_BY: 'x-powered-by'
  },
  METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    OPTIONS: 'OPTIONS'
  }
};

export const SECURITY_CONSTANTS = {
  HEADERS: {
    CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
    STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',
    X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
    X_FRAME_OPTIONS: 'X-Frame-Options',
    X_XSS_PROTECTION: 'X-XSS-Protection'
  }
};

export const PERFORMANCE_CONSTANTS = {
  RESPONSE_TIME_THRESHOLDS: {
    FAST: 50,
    ACCEPTABLE: 100,
    SLOW: 200,
    CRITICAL: 500
  },
  MEMORY_THRESHOLDS: {
    LOW: 50,
    MEDIUM: 100,
    HIGH: 200,
    CRITICAL: 500
  }
};

export const PM2_CONSTANTS = {
  EXEC_MODES: {
    FORK: 'fork',
    CLUSTER: 'cluster'
  },
  INSTANCES: {
    MAX: 'max',
    AUTO: 0
  }
};

export const TESTING_CONSTANTS = {
  TIMEOUTS: {
    UNIT: 5000,
    INTEGRATION: 10000,
    E2E: 30000
  },
  PORTS: {
    TEST_START: 3001,
    TEST_END: 3099
  }
};

export const ERROR_CONSTANTS = {
  TYPES: {
    VALIDATION_ERROR: 'ValidationError',
    CONFIGURATION_ERROR: 'ConfigurationError',
    NETWORK_ERROR: 'NetworkError',
    SECURITY_ERROR: 'SecurityError',
    PM2_ERROR: 'PM2Error',
    STARTUP_ERROR: 'StartupError'
  },
  CODES: {
    INVALID_CONFIG: 'INVALID_CONFIG',
    PORT_IN_USE: 'PORT_IN_USE',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    TIMEOUT: 'TIMEOUT',
    CONNECTION_REFUSED: 'CONNECTION_REFUSED'
  },
  MESSAGES: {
    SERVER_START_FAILED: 'Failed to start server',
    CONFIG_VALIDATION_FAILED: 'Configuration validation failed',
    DEPENDENCY_NOT_FOUND: 'Required dependency not found'
  }
};