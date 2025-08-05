/**
 * Mock Constants for Testing
 * Provides minimal constants to bypass complex initialization
 */

export const DEFAULT_TIMEOUT = 30000;
export const MAX_REQUEST_SIZE = '10mb';
export const CURRENT_NODE_VERSION = 'v20.19.4';

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
  HTTP_METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    OPTIONS: 'OPTIONS',
    HEAD: 'HEAD',
    CONNECT: 'CONNECT',
    TRACE: 'TRACE'
  },
  CONTENT_TYPES: {
    JSON: 'application/json',
    HTML: 'text/html',
    PLAIN_TEXT: 'text/plain',
    XML: 'application/xml',
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    MULTIPART_FORM: 'multipart/form-data',
    OCTET_STREAM: 'application/octet-stream'
  }
};

export const SECURITY_CONSTANTS = {
  HEADERS: {
    CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
    STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',
    X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
    X_FRAME_OPTIONS: 'X-Frame-Options',
    X_XSS_PROTECTION: 'X-XSS-Protection'
  },
  CSP_DIRECTIVES: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    FONT_SRC: ["'self'", 'https://fonts.gstatic.com'],
    IMG_SRC: ["'self'", 'data:', 'https:'],
    CONNECT_SRC: ["'self'"],
    FRAME_SRC: ["'none'"],
    OBJECT_SRC: ["'none'"],
    MEDIA_SRC: ["'self'"],
    MANIFEST_SRC: ["'self'"],
    WORKER_SRC: ["'self'"],
    FORM_ACTION: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
    BASE_URI: ["'self'"],
    UPGRADE_INSECURE_REQUESTS: []
  },
  SECURITY_HEADERS: {
    CONTENT_SECURITY_POLICY: true,
    CROSS_ORIGIN_EMBEDDER_POLICY: false,
    CROSS_ORIGIN_OPENER_POLICY: true,
    CROSS_ORIGIN_RESOURCE_POLICY: { policy: 'cross-origin' },
    DNS_PREFETCH_CONTROL: true,
    EXPECT_CT: false,
    FRAMEGUARD: { action: 'deny' },
    HIDE_POWERED_BY: true,
    HSTS: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    IE_NO_OPEN: true,
    NO_SNIFF: true,
    ORIGIN_AGENT_CLUSTER: true,
    PERMITTED_CROSS_DOMAIN_POLICIES: false,
    REFERRER_POLICY: { policy: 'no-referrer' },
    XSS_FILTER: true
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

export const API_CONSTANTS = {
  ENDPOINTS: {
    HELLO: '/hello',
    GOOD_EVENING: '/good-evening',
    HEALTH: '/health',
    API_BASE: '/api',
    API_V1: '/api/v1',
    STATUS: '/status',
    METRICS: '/metrics',
    DOCS: '/docs',
    NOT_FOUND: '*',
    ERROR: '/error'
  },
  RESPONSE_FORMATS: {
    JSON: 'application/json',
    HTML: 'text/html',
    TEXT: 'text/plain'
  },
  METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    OPTIONS: 'OPTIONS'
  },
  RESPONSES: {
    HELLO_WORLD: {
      status: 'success',
      endpoint: '/hello',
      method: 'GET'
    },
    GOOD_EVENING: {
      status: 'success',
      endpoint: '/good-evening',
      method: 'GET'
    },
    HEALTH_CHECK: {
      status: 'healthy',
      endpoint: '/health',
      method: 'GET'
    },
    ERROR_RESPONSE: {
      status: 'error',
      endpoint: null,
      method: null
    }
  },
  TIMEOUTS: {
    REQUEST_TIMEOUT: 30000,
    RESPONSE_TIMEOUT: 10000,
    CONNECTION_TIMEOUT: 5000
  },
  ERROR_MESSAGES: {
    ROUTE_NOT_FOUND: 'The requested route was not found',
    METHOD_NOT_ALLOWED: 'HTTP method not allowed for this endpoint',
    INTERNAL_ERROR: 'Internal server error occurred',
    BAD_REQUEST: 'Invalid request format or parameters',
    TIMEOUT: 'Request timeout exceeded',
    PAYLOAD_TOO_LARGE: 'Request payload exceeds maximum size limit',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
    UNAUTHORIZED: 'Authentication is required to access this resource.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
    NOT_IMPLEMENTED: 'This feature has not been implemented yet.',
    CONFIGURATION_ERROR: 'A configuration error occurred. Please contact support.'
  }
};

export const FLASK_CONSTANTS = {
  COMPATIBILITY_MAP: {
    EXPRESS_TO_FLASK: {
      'app.get()': 'app.route(methods=["GET"])',
      'app.post()': 'app.route(methods=["POST"])',
      'app.listen()': 'app.run()',
      'res.json()': 'jsonify()',
      'res.status()': 'return response, status_code',
      'req.params': 'request.args',
      'req.body': 'request.get_json()'
    },
    PORT_MAPPING: {
      NODE_DEFAULT: 3000,
      FLASK_DEFAULT: 5000,
      UNIFIED_PORT: 3000
    }
  },
  WSGI_CONFIG: {
    WSGI_SERVER: 'gunicorn',
    WORKERS: 4,
    WORKER_CLASS: 'sync',
    WORKER_CONNECTIONS: 1000,
    MAX_REQUESTS: 1000,
    MAX_REQUESTS_JITTER: 50,
    TIMEOUT: 30,
    KEEPALIVE: 2,
    BIND: '0.0.0.0:3000',
    PRELOAD_APP: true,
    LOG_LEVEL: 'info',
    ACCESS_LOG: '-',
    ERROR_LOG: '-'
  },
  FILE_MAPPING: {
    'app.js': 'app.py',
    'server.js': 'app.py',
    'routes/*.js': 'routes/*.py'
  }
};

export const TUTORIAL_CONSTANTS = {
  PHASES: {
    PHASE_1: {
      name: 'Basic HTTP Server',
      description: 'Foundation HTTP server using Node.js core modules',
      objectives: ['HTTP server creation', 'Request/response handling', 'Basic error handling'],
      files: ['basic-server.js'],
      dependencies: ['Node.js core HTTP module'],
      completion_criteria: ['Server starts on port 3000', 'Returns "Hello world" response']
    }
  },
  LEARNING_OBJECTIVES: {
    PRIMARY: ['HTTP fundamentals', 'Express.js mastery', 'Production deployment'],
    SECONDARY: ['Security implementation', 'Performance optimization', 'Cross-platform migration']
  }
};