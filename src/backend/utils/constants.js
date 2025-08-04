/**
 * @fileoverview Comprehensive Constants Module for Node.js Tutorial Project
 * @description Centralized constant management for all application-wide constants
 * supporting Express.js v5.1.0, PM2 production deployment, security implementation,
 * testing frameworks, and cross-platform Flask compatibility.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates modern ES Modules constant organization patterns
 * - Showcases environment-aware configuration management
 * - Implements production-ready security constant definitions
 * - Provides comprehensive HTTP protocol constant specifications
 * - Supports cross-platform development with Flask compatibility constants
 * 
 * Technology Stack:
 * - Node.js v22.x LTS with ES Modules support
 * - Express.js v5.1.0 with enhanced security features
 * - PM2 v6.0.8 for production process management
 * - Helmet.js v8.1.0 for security header management
 * - Jest/Mocha testing frameworks with comprehensive coverage
 * 
 * Architecture:
 * - Stateless design optimized for PM2 cluster mode
 * - Immutable constants to prevent runtime modification
 * - Organized for efficient lookup and minimal traversal
 * - Designed for horizontal scaling with zero-downtime deployment
 */

// Global constants accessible throughout the application
export const DEFAULT_TIMEOUT = 30000; // 30 seconds default timeout for all operations
export const MAX_REQUEST_SIZE = '10mb'; // Maximum HTTP request body size
export const CURRENT_NODE_VERSION = process.version; // Current Node.js runtime version

/**
 * Environment Configuration Constants
 * @description Environment-specific settings for server setup, logging, and runtime detection
 * @educational_value Demonstrates environment-aware configuration management patterns
 */
export const ENV_CONSTANTS = Object.freeze({
  // Default server configuration
  DEFAULT_PORT: 3000,
  DEFAULT_HOST: '0.0.0.0', // Bind to all network interfaces for production
  
  // Environment type detection and configuration
  ENVIRONMENT_TYPES: Object.freeze({
    DEVELOPMENT: 'development',
    TESTING: 'test',
    STAGING: 'staging',
    PRODUCTION: 'production',
    LOCAL: 'local'
  }),
  
  // Logging level configuration for different environments
  LOG_LEVELS: Object.freeze({
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    HTTP: 'http',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
    SILLY: 'silly'
  }),
  
  // Node.js version compatibility matrix
  NODE_VERSIONS: Object.freeze({
    MINIMUM_SUPPORTED: '18.0.0',
    RECOMMENDED_LTS: '22.0.0',
    CURRENT_VERSION: process.version,
    MOCHA_MINIMUM: '18.18.0', // Mocha v11.0.0+ requirement
    EXPRESS_MINIMUM: '18.0.0', // Express v5+ requirement
    PM2_MINIMUM: '12.0.0' // PM2 compatibility
  })
});

/**
 * HTTP Protocol Constants
 * @description Complete HTTP protocol specifications for status codes, methods, content types, and headers
 * @educational_value Teaches HTTP protocol fundamentals and web standards compliance
 */
export const HTTP_CONSTANTS = Object.freeze({
  // HTTP status codes with semantic meanings
  STATUS_CODES: Object.freeze({
    // 2xx Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    
    // 3xx Redirection
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,
    
    // 4xx Client Error
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    
    // 5xx Server Error
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  }),
  
  // HTTP methods for RESTful API design
  HTTP_METHODS: Object.freeze({
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS',
    CONNECT: 'CONNECT',
    TRACE: 'TRACE'
  }),
  
  // Content-Type headers for different response formats
  CONTENT_TYPES: Object.freeze({
    JSON: 'application/json',
    HTML: 'text/html',
    PLAIN_TEXT: 'text/plain',
    XML: 'application/xml',
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
    MULTIPART_FORM: 'multipart/form-data',
    OCTET_STREAM: 'application/octet-stream',
    PDF: 'application/pdf',
    CSS: 'text/css',
    JAVASCRIPT: 'application/javascript',
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    SVG: 'image/svg+xml'
  }),
  
  // Standard HTTP headers for request/response handling
  HEADERS: Object.freeze({
    // Request headers
    AUTHORIZATION: 'Authorization',
    CONTENT_TYPE: 'Content-Type',
    CONTENT_LENGTH: 'Content-Length',
    CONTENT_ENCODING: 'Content-Encoding',
    ACCEPT: 'Accept',
    ACCEPT_ENCODING: 'Accept-Encoding',
    ACCEPT_LANGUAGE: 'Accept-Language',
    USER_AGENT: 'User-Agent',
    REFERER: 'Referer',
    HOST: 'Host',
    
    // Response headers
    SET_COOKIE: 'Set-Cookie',
    LOCATION: 'Location',
    CACHE_CONTROL: 'Cache-Control',
    EXPIRES: 'Expires',
    ETAG: 'ETag',
    LAST_MODIFIED: 'Last-Modified',
    
    // Security headers (managed by Helmet.js)
    CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
    STRICT_TRANSPORT_SECURITY: 'Strict-Transport-Security',
    X_FRAME_OPTIONS: 'X-Frame-Options',
    X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
    X_XSS_PROTECTION: 'X-XSS-Protection'
  }),
  
  // Protocol versions and configurations
  PROTOCOLS: Object.freeze({
    HTTP: 'http',
    HTTPS: 'https',
    HTTP_1_0: 'HTTP/1.0',
    HTTP_1_1: 'HTTP/1.1',
    HTTP_2: 'HTTP/2',
    DEFAULT_HTTP_PORT: 80,
    DEFAULT_HTTPS_PORT: 443
  })
});

/**
 * API Design Constants
 * @description RESTful API endpoint definitions, standardized responses, and request configuration
 * @educational_value Demonstrates RESTful API design principles and best practices
 */
export const API_CONSTANTS = Object.freeze({
  // API endpoint definitions following RESTful conventions
  ENDPOINTS: Object.freeze({
    // Tutorial project specific endpoints
    HELLO: '/hello',
    GOOD_EVENING: '/good-evening',
    HEALTH: '/health',
    
    // Standard API endpoints for future expansion
    API_BASE: '/api',
    API_V1: '/api/v1',
    STATUS: '/status',
    METRICS: '/metrics',
    DOCS: '/docs',
    
    // Error handling endpoints
    NOT_FOUND: '*',
    ERROR: '/error'
  }),
  
  // Standardized API response formats
  RESPONSES: Object.freeze({
    SUCCESS: {
      status: 'success',
      message: 'Request completed successfully'
    },
    ERROR: {
      status: 'error',
      message: 'An error occurred processing the request'
    },
    HELLO_WORLD: {
      message: 'Hello world',
      timestamp: () => new Date().toISOString(),
      version: '1.0.0'
    },
    GOOD_EVENING: {
      message: 'Good evening',
      timestamp: () => new Date().toISOString(),
      version: '1.0.0'
    },
    HEALTH_CHECK: {
      status: 'OK',
      uptime: () => process.uptime(),
      timestamp: () => new Date().toISOString(),
      version: process.version,
      environment: () => process.env.NODE_ENV || 'development'
    }
  }),
  
  // Comprehensive error message catalog
  ERROR_MESSAGES: Object.freeze({
    ROUTE_NOT_FOUND: 'The requested route was not found',
    METHOD_NOT_ALLOWED: 'HTTP method not allowed for this endpoint',
    INTERNAL_ERROR: 'Internal server error occurred',
    BAD_REQUEST: 'Invalid request format or parameters',
    TIMEOUT: 'Request timeout exceeded',
    PAYLOAD_TOO_LARGE: 'Request payload exceeds maximum size limit',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
  }),
  
  // Request size and rate limiting configuration
  REQUEST_LIMITS: Object.freeze({
    MAX_JSON_SIZE: '1mb',
    MAX_URL_ENCODED_SIZE: '1mb',
    MAX_MULTIPART_SIZE: '10mb',
    MAX_FIELD_SIZE: '1mb',
    MAX_FIELDS: 1000,
    MAX_FILES: 10,
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100
  }),
  
  // Timeout configurations for different operations
  TIMEOUTS: Object.freeze({
    REQUEST_TIMEOUT: 30000, // 30 seconds
    KEEP_ALIVE_TIMEOUT: 5000, // 5 seconds
    HEADERS_TIMEOUT: 60000, // 60 seconds
    SERVER_TIMEOUT: 120000, // 2 minutes
    GRACEFUL_SHUTDOWN: 10000 // 10 seconds
  })
});

/**
 * Security Configuration Constants
 * @description Comprehensive security settings for Helmet.js, CSP directives, CORS policies, and SSL
 * @educational_value Teaches modern web security practices and threat mitigation strategies
 */
export const SECURITY_CONSTANTS = Object.freeze({
  // Content Security Policy directives for XSS prevention
  CSP_DIRECTIVES: Object.freeze({
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
  }),
  
  // Security headers configuration for Helmet.js
  SECURITY_HEADERS: Object.freeze({
    CONTENT_SECURITY_POLICY: true,
    CROSS_ORIGIN_EMBEDDER_POLICY: false,
    CROSS_ORIGIN_OPENER_POLICY: true,
    CROSS_ORIGIN_RESOURCE_POLICY: { policy: 'cross-origin' },
    DNS_PREFETCH_CONTROL: true,
    EXPECT_CT: false,
    FRAMEGUARD: { action: 'deny' },
    HIDE_POWERED_BY: true,
    HSTS: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    IE_NO_OPEN: true,
    NO_SNIFF: true,
    ORIGIN_AGENT_CLUSTER: true,
    PERMITTED_CROSS_DOMAIN_POLICIES: false,
    REFERRER_POLICY: { policy: 'no-referrer' },
    XSS_FILTER: false // Disabled as recommended by Helmet.js
  }),
  
  // CORS (Cross-Origin Resource Sharing) configuration
  CORS_CONFIG: Object.freeze({
    ORIGIN: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    EXPOSED_HEADERS: ['X-Total-Count', 'X-Request-ID'],
    CREDENTIALS: false,
    MAX_AGE: 86400, // 24 hours
    PREFLIGHT_CONTINUE: false,
    OPTIONS_SUCCESS_STATUS: 204
  }),
  
  // Rate limiting configuration for DDoS protection
  RATE_LIMIT_CONFIG: Object.freeze({
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // Limit each IP to 100 requests per windowMs
    MESSAGE: 'Too many requests from this IP, please try again later',
    STANDARD_HEADERS: true, // Return rate limit info in the `RateLimit-*` headers
    LEGACY_HEADERS: false, // Disable the `X-RateLimit-*` headers
    SKIP_SUCCESSFUL_REQUESTS: false,
    SKIP_FAILED_REQUESTS: false,
    REQUEST_PROPERTY_NAME: 'rateLimit'
  }),
  
  // SSL/TLS configuration for HTTPS
  SSL_CONFIG: Object.freeze({
    MIN_VERSION: 'TLSv1.2',
    MAX_VERSION: 'TLSv1.3',
    CIPHER_SUITES: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384'
    ],
    HONOR_CIPHER_ORDER: true,
    SESSION_TIMEOUT: 300, // 5 minutes
    SESSION_ID_CONTEXT: 'nodejs-tutorial'
  })
});

/**
 * PM2 Process Management Constants
 * @description Configuration for PM2 cluster mode, instance management, monitoring, and restart policies
 * @educational_value Demonstrates production process management and scaling strategies
 */
export const PM2_CONSTANTS = Object.freeze({
  // PM2 execution modes for different deployment scenarios
  EXEC_MODES: Object.freeze({
    FORK: 'fork', // Single instance mode
    CLUSTER: 'cluster', // Multi-instance load-balanced mode
    FORK_MODE: 'fork_mode', // Legacy fork mode
    CLUSTER_MODE: 'cluster_mode' // Legacy cluster mode
  }),
  
  // Instance configuration for different environments
  INSTANCE_CONFIGS: Object.freeze({
    DEVELOPMENT: {
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'test', 'coverage'],
      max_memory_restart: '1G',
      node_args: '--inspect'
    },
    PRODUCTION: {
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      min_uptime: '10s',
      max_restarts: 10
    },
    STAGING: {
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '5s',
      max_restarts: 5
    }
  }),
  
  // Monitoring and health check configuration
  MONITORING_CONFIG: Object.freeze({
    MONIT: true, // Enable monitoring
    PM2_SERVE_ENABLE: false, // Disable PM2 web interface for security
    PM2_SERVE_PORT: 8080,
    PM2_SERVE_PASSWORD: null,
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    MEMORY_THRESHOLD: 1024, // MB
    CPU_THRESHOLD: 80, // Percentage
    RESTART_DELAY: 4000, // 4 seconds
    AUTO_DUMP: true // Auto dump PM2 processes
  }),
  
  // Logging configuration for PM2 managed processes
  LOG_CONFIG: Object.freeze({
    OUT_FILE: './logs/out.log',
    ERROR_FILE: './logs/error.log',
    COMBINED_LOG_FILE: './logs/combined.log',
    LOG_DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss Z',
    LOG_TYPE: 'json',
    MERGE_LOGS: true,
    MAX_LOG_SIZE: '10M',
    MAX_LOG_FILES: 5,
    COMPRESS_LOGS: true,
    LOG_ROTATION: {
      interval: '1d', // Daily rotation
      max: '7d', // Keep 7 days of logs
      compress: true
    }
  }),
  
  // Restart policies for different failure scenarios
  RESTART_POLICIES: Object.freeze({
    AUTO_RESTART: {
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    },
    EXPONENTIAL_BACKOFF: {
      exp_backoff_restart_delay: 100,
      max_restarts: 15,
      min_uptime: '1m'
    },
    MEMORY_RESTART: {
      max_memory_restart: '1G',
      kill_timeout: 5000
    },
    GRACEFUL_SHUTDOWN: {
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    }
  })
});

/**
 * Testing Framework Constants
 * @description Configuration for Jest and Mocha frameworks, coverage thresholds, and test settings
 * @educational_value Teaches comprehensive testing strategies and quality metrics
 */
export const TESTING_CONSTANTS = Object.freeze({
  // Testing framework configurations
  FRAMEWORKS: Object.freeze({
    JEST: {
      name: 'Jest',
      version: 'latest',
      description: 'All-in-one testing framework with built-in features',
      testEnvironment: 'node',
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/test/**'
      ],
      testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
      ],
      coverageDirectory: 'coverage',
      verbose: true,
      testTimeout: 10000
    },
    MOCHA: {
      name: 'Mocha',
      version: 'latest',
      description: 'Flexible testing framework with modular approach',
      timeout: 10000,
      recursive: true,
      reporter: 'spec',
      require: ['test/helpers/setup.js'],
      grep: '',
      bail: false,
      retries: 0
    }
  }),
  
  // Code coverage thresholds for quality assurance
  COVERAGE_THRESHOLDS: Object.freeze({
    GLOBAL: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    },
    CRITICAL_FILES: {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    },
    UTILITIES: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85
    },
    MINIMUM_ACCEPTABLE: {
      branches: 70,
      functions: 80,
      lines: 75,
      statements: 75
    }
  }),
  
  // Performance targets for test execution
  PERFORMANCE_TARGETS: Object.freeze({
    UNIT_TEST_TIMEOUT: 5000, // 5 seconds per unit test
    INTEGRATION_TEST_TIMEOUT: 15000, // 15 seconds per integration test
    E2E_TEST_TIMEOUT: 30000, // 30 seconds per end-to-end test
    TOTAL_SUITE_TIME: 300000, // 5 minutes for complete test suite
    RESPONSE_TIME_THRESHOLD: 100, // Max 100ms response time
    MEMORY_USAGE_THRESHOLD: 512, // Max 512MB memory usage during tests
    CONCURRENT_REQUESTS: 100, // Test with 100 concurrent requests
    LOAD_TEST_DURATION: 60000 // 1 minute load test duration
  }),
  
  // Test timeout configurations for different test types
  TEST_TIMEOUTS: Object.freeze({
    UNIT_TESTS: 5000,
    INTEGRATION_TESTS: 15000,
    E2E_TESTS: 30000,
    PERFORMANCE_TESTS: 60000,
    LOAD_TESTS: 120000,
    BROWSER_TESTS: 45000,
    API_TESTS: 10000,
    DATABASE_TESTS: 20000
  }),
  
  // Mock and test data configuration
  MOCK_CONFIG: Object.freeze({
    MOCK_RESPONSES: {
      HELLO_WORLD: { message: 'Hello world', status: 200 },
      GOOD_EVENING: { message: 'Good evening', status: 200 },
      NOT_FOUND: { error: 'Route not found', status: 404 },
      SERVER_ERROR: { error: 'Internal server error', status: 500 }
    },
    TEST_PORTS: {
      HTTP_TEST_PORT: 3001,
      HTTPS_TEST_PORT: 3443,
      ALTERNATIVE_PORT: 3002
    },
    FIXTURES_PATH: './test/fixtures',
    HELPERS_PATH: './test/helpers',
    COVERAGE_PATH: './coverage',
    REPORTS_PATH: './test-reports'
  })
});

/**
 * Error Handling Constants
 * @description Comprehensive error management including types, codes, messages, and validation errors
 * @educational_value Demonstrates structured error handling and debugging practices
 */
export const ERROR_CONSTANTS = Object.freeze({
  // Error type categorization for better error handling
  ERROR_TYPES: Object.freeze({
    VALIDATION_ERROR: 'ValidationError',
    AUTHENTICATION_ERROR: 'AuthenticationError',
    AUTHORIZATION_ERROR: 'AuthorizationError',
    NOT_FOUND_ERROR: 'NotFoundError',
    CONFLICT_ERROR: 'ConflictError',
    RATE_LIMIT_ERROR: 'RateLimitError',
    TIMEOUT_ERROR: 'TimeoutError',
    NETWORK_ERROR: 'NetworkError',
    DATABASE_ERROR: 'DatabaseError',
    CONFIGURATION_ERROR: 'ConfigurationError',
    INTERNAL_ERROR: 'InternalError'
  }),
  
  // Standardized error codes for API responses
  ERROR_CODES: Object.freeze({
    // Client errors (4xx)
    BAD_REQUEST: 'ERR_BAD_REQUEST',
    UNAUTHORIZED: 'ERR_UNAUTHORIZED',
    FORBIDDEN: 'ERR_FORBIDDEN',
    NOT_FOUND: 'ERR_NOT_FOUND',
    METHOD_NOT_ALLOWED: 'ERR_METHOD_NOT_ALLOWED',
    TIMEOUT: 'ERR_REQUEST_TIMEOUT',
    PAYLOAD_TOO_LARGE: 'ERR_PAYLOAD_TOO_LARGE',
    UNSUPPORTED_MEDIA: 'ERR_UNSUPPORTED_MEDIA_TYPE',
    RATE_LIMITED: 'ERR_RATE_LIMITED',
    
    // Server errors (5xx)
    INTERNAL_ERROR: 'ERR_INTERNAL_SERVER',
    NOT_IMPLEMENTED: 'ERR_NOT_IMPLEMENTED',
    BAD_GATEWAY: 'ERR_BAD_GATEWAY',
    SERVICE_UNAVAILABLE: 'ERR_SERVICE_UNAVAILABLE',
    GATEWAY_TIMEOUT: 'ERR_GATEWAY_TIMEOUT',
    
    // Application specific errors
    ROUTE_NOT_FOUND: 'ERR_ROUTE_NOT_FOUND',
    INVALID_ENDPOINT: 'ERR_INVALID_ENDPOINT',
    CONFIGURATION_ERROR: 'ERR_CONFIGURATION',
    DEPENDENCY_ERROR: 'ERR_DEPENDENCY'
  }),
  
  // User-friendly error messages
  ERROR_MESSAGES: Object.freeze({
    ROUTE_NOT_FOUND: 'The requested route could not be found. Please check the URL and try again.',
    METHOD_NOT_ALLOWED: 'The HTTP method used is not allowed for this endpoint.',
    INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
    BAD_REQUEST: 'The request could not be understood. Please check your request format.',
    UNAUTHORIZED: 'Authentication is required to access this resource.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    TIMEOUT: 'The request took too long to process. Please try again.',
    PAYLOAD_TOO_LARGE: 'The request payload is too large. Please reduce the size and try again.',
    RATE_LIMITED: 'Too many requests. Please wait before making another request.',
    SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
    NOT_IMPLEMENTED: 'This feature has not been implemented yet.',
    CONFIGURATION_ERROR: 'A configuration error occurred. Please contact support.'
  }),
  
  // Input validation error messages
  VALIDATION_ERRORS: Object.freeze({
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format provided',
    INVALID_TYPE: 'Invalid data type',
    OUT_OF_RANGE: 'Value is out of acceptable range',
    TOO_SHORT: 'Value is too short',
    TOO_LONG: 'Value is too long',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_URL: 'Invalid URL format',
    INVALID_DATE: 'Invalid date format',
    INVALID_NUMBER: 'Invalid number format'
  }),
  
  // Security-related error messages
  SECURITY_ERRORS: Object.freeze({
    CSRF_TOKEN_INVALID: 'Invalid CSRF token',
    CORS_VIOLATION: 'CORS policy violation',
    XSS_ATTEMPT: 'Cross-site scripting attempt detected',
    SQL_INJECTION_ATTEMPT: 'SQL injection attempt detected',
    PATH_TRAVERSAL_ATTEMPT: 'Path traversal attempt detected',
    SUSPICIOUS_ACTIVITY: 'Suspicious activity detected',
    IP_BLOCKED: 'IP address has been blocked',
    ACCOUNT_LOCKED: 'Account has been temporarily locked'
  })
});

/**
 * Flask Compatibility Constants
 * @description Cross-platform compatibility constants for Flask migration and feature parity
 * @educational_value Demonstrates cross-platform development patterns and framework translation
 */
export const FLASK_CONSTANTS = Object.freeze({
  // Node.js to Flask compatibility mapping
  COMPATIBILITY_MAP: Object.freeze({
    EXPRESS_TO_FLASK: {
      'app.get()': 'app.route(methods=["GET"])',
      'app.post()': 'app.route(methods=["POST"])',
      'app.listen()': 'app.run()',
      'res.json()': 'jsonify()',
      'res.status()': 'return response, status_code',
      'req.params': 'request.args',
      'req.body': 'request.get_json()',
      'middleware': '@app.before_request'
    },
    PORT_MAPPING: {
      NODE_DEFAULT: 3000,
      FLASK_DEFAULT: 5000,
      UNIFIED_PORT: 3000 // Use same port for consistency
    },
    ENVIRONMENT_VARIABLES: {
      NODE_ENV: 'FLASK_ENV',
      PORT: 'PORT',
      DEBUG: 'FLASK_DEBUG'
    }
  }),
  
  // Response format standardization between platforms
  RESPONSE_FORMATS: Object.freeze({
    SUCCESS_RESPONSE: {
      node_format: '{ "message": "success", "data": {} }',
      flask_format: '{ "message": "success", "data": {} }',
      unified_structure: {
        message: 'string',
        data: 'object',
        timestamp: 'ISO string',
        version: 'string'
      }
    },
    ERROR_RESPONSE: {
      node_format: '{ "error": "message", "code": "ERR_CODE" }',
      flask_format: '{ "error": "message", "code": "ERR_CODE" }',
      unified_structure: {
        error: 'string',
        code: 'string',
        timestamp: 'ISO string',
        trace_id: 'string'
      }
    }
  }),
  
  // Error code mapping between Node.js and Flask
  ERROR_MAPPINGS: Object.freeze({
    HTTP_STATUS_CODES: {
      200: { node: 'OK', flask: 'OK' },
      404: { node: 'Not Found', flask: 'Not Found' },
      500: { node: 'Internal Server Error', flask: 'Internal Server Error' }
    },
    EXCEPTION_MAPPING: {
      'ValidationError': 'werkzeug.exceptions.BadRequest',
      'NotFoundError': 'werkzeug.exceptions.NotFound',
      'InternalError': 'werkzeug.exceptions.InternalServerError',
      'TimeoutError': 'werkzeug.exceptions.RequestTimeout'
    }
  }),
  
  // WSGI configuration for Flask deployment
  WSGI_CONFIG: Object.freeze({
    WSGI_SERVER: 'gunicorn', // Production WSGI server
    WORKERS: 4, // Number of worker processes
    WORKER_CLASS: 'sync', // Worker class type
    WORKER_CONNECTIONS: 1000, // Max connections per worker
    MAX_REQUESTS: 1000, // Max requests before worker restart
    MAX_REQUESTS_JITTER: 50, // Randomize worker restart
    TIMEOUT: 30, // Worker timeout in seconds
    KEEPALIVE: 2, // Keepalive timeout
    BIND: '0.0.0.0:3000', // Bind address and port
    PRELOAD_APP: true, // Preload application for memory efficiency
    LOG_LEVEL: 'info',
    ACCESS_LOG: '-', // Log to stdout
    ERROR_LOG: '-' // Log to stderr
  })
});

/**
 * Tutorial-Specific Constants
 * @description Educational constants for tutorial phases, learning objectives, and validation rules
 * @educational_value Provides structured learning progression and educational framework
 */
export const TUTORIAL_CONSTANTS = Object.freeze({
  // Tutorial progression phases
  PHASES: Object.freeze({
    PHASE_1: {
      name: 'Basic HTTP Server',
      description: 'Foundation HTTP server using Node.js core modules',
      objectives: ['HTTP server creation', 'Request/response handling', 'Basic error handling'],
      files: ['basic-server.js'],
      dependencies: ['Node.js core HTTP module'],
      completion_criteria: ['Server starts on port 3000', 'Returns "Hello world" response']
    },
    PHASE_2: {
      name: 'Express.js Framework Integration',
      description: 'Enhanced server with Express.js framework',
      objectives: ['Framework integration', 'Routing', 'Middleware'],
      files: ['express-server.js', 'routes/index.js'],
      dependencies: ['Express.js v5.1.0'],
      completion_criteria: ['Multiple endpoints functional', 'Middleware operational']
    },
    PHASE_3: {
      name: 'Cross-Platform Flask Migration',
      description: 'Feature-equivalent Flask implementation',
      objectives: ['Cross-platform development', 'Framework comparison', 'API parity'],
      files: ['flask-server.py', 'requirements.txt'],
      dependencies: ['Python 3.9+', 'Flask 3.1.1'],
      completion_criteria: ['Identical API responses', 'Same port configuration']
    },
    PHASE_4: {
      name: 'Comprehensive Testing',
      description: 'Complete testing suite implementation',
      objectives: ['Unit testing', 'Integration testing', 'Coverage reporting'],
      files: ['test/*.test.js', 'jest.config.js'],
      dependencies: ['Jest or Mocha', 'SuperTest'],
      completion_criteria: ['90%+ code coverage', 'All tests passing']
    },
    PHASE_5: {
      name: 'Production Deployment',
      description: 'PM2 process management and production readiness',
      objectives: ['Process management', 'Load balancing', 'Monitoring'],
      files: ['ecosystem.config.js', 'pm2.config.js'],
      dependencies: ['PM2 v6.0.8'],
      completion_criteria: ['Cluster mode operational', 'Zero-downtime deployment']
    },
    PHASE_6: {
      name: 'Security Implementation',
      description: 'Comprehensive security measures',
      objectives: ['Security headers', 'Input validation', 'Threat mitigation'],
      files: ['security/helmet-config.js', 'middleware/security.js'],
      dependencies: ['Helmet.js v8.1.0'],
      completion_criteria: ['Security headers implemented', 'Vulnerability scan clean']
    },
    PHASE_7: {
      name: 'Documentation and Deployment',
      description: 'Complete documentation and deployment guides',
      objectives: ['Code documentation', 'Setup guides', 'Best practices'],
      files: ['README.md', 'docs/*.md'],
      dependencies: ['JSDoc', 'Markdown'],
      completion_criteria: ['Complete documentation', 'Deployment guides available']
    }
  }),
  
  // Learning objectives for each tutorial component
  LEARNING_OBJECTIVES: Object.freeze({
    HTTP_FUNDAMENTALS: [
      'Understand HTTP request/response cycle',
      'Learn HTTP status codes and headers',
      'Implement basic server functionality',
      'Handle different HTTP methods'
    ],
    FRAMEWORK_INTEGRATION: [
      'Compare framework vs vanilla approaches',
      'Implement routing and middleware',
      'Understand framework architecture',
      'Apply modern JavaScript patterns'
    ],
    CROSS_PLATFORM_DEVELOPMENT: [
      'Translate concepts between languages',
      'Maintain API compatibility',
      'Understand framework differences',
      'Implement equivalent functionality'
    ],
    TESTING_STRATEGIES: [
      'Write comprehensive unit tests',
      'Implement integration testing',
      'Achieve meaningful code coverage',
      'Understand testing best practices'
    ],
    PRODUCTION_DEPLOYMENT: [
      'Configure process management',
      'Implement load balancing',
      'Set up monitoring and logging',
      'Ensure high availability'
    ],
    SECURITY_PRACTICES: [
      'Implement security headers',
      'Understand common vulnerabilities',
      'Apply input validation',
      'Configure HTTPS and CSP'
    ]
  }),
  
  // Example responses for educational demonstration
  EXAMPLE_RESPONSES: Object.freeze({
    BASIC_HELLO: {
      endpoint: '/hello',
      method: 'GET',
      response: { message: 'Hello world' },
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    },
    GOOD_EVENING: {
      endpoint: '/good-evening',
      method: 'GET',
      response: { message: 'Good evening' },
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    },
    HEALTH_CHECK: {
      endpoint: '/health',
      method: 'GET',
      response: {
        status: 'OK',
        uptime: 123.45,
        timestamp: '2025-01-01T00:00:00.000Z',
        version: 'v22.0.0'
      },
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    },
    NOT_FOUND: {
      endpoint: '/invalid-route',
      method: 'GET',
      response: { error: 'Route not found' },
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  }),
  
  // Validation rules for tutorial implementation
  VALIDATION_RULES: Object.freeze({
    SERVER_STARTUP: {
      port_binding: 'Server must bind to port 3000',
      startup_time: 'Server must start within 5 seconds',
      graceful_shutdown: 'Server must handle termination signals',
      error_handling: 'Server must handle startup errors gracefully'
    },
    API_ENDPOINTS: {
      response_format: 'All responses must be valid JSON',
      status_codes: 'Appropriate HTTP status codes required',
      headers: 'Correct Content-Type headers must be set',
      timing: 'Response time must be under 100ms'
    },
    CROSS_PLATFORM_PARITY: {
      identical_responses: 'Node.js and Flask must return identical responses',
      same_endpoints: 'All endpoints must be available in both implementations',
      consistent_behavior: 'Error handling must be consistent across platforms',
      performance_parity: 'Response times should be within 50% variance'
    },
    TESTING_REQUIREMENTS: {
      coverage_threshold: 'Minimum 90% code coverage required',
      test_passing: 'All tests must pass consistently',
      performance_tests: 'Response time tests must validate < 100ms',
      error_scenarios: 'All error conditions must be tested'
    },
    PRODUCTION_READINESS: {
      process_management: 'PM2 cluster mode must be functional',
      zero_downtime: 'Deployments must support zero-downtime updates',
      monitoring: 'Health checks must be implemented',
      logging: 'Comprehensive logging must be configured'
    },
    SECURITY_COMPLIANCE: {
      security_headers: 'All security headers must be properly configured',
      input_validation: 'All inputs must be validated and sanitized',
      vulnerability_scan: 'No critical vulnerabilities allowed',
      https_ready: 'Application must support HTTPS deployment'
    }
  })
});

// Freeze all exported constants to prevent modification
Object.freeze(ENV_CONSTANTS);
Object.freeze(HTTP_CONSTANTS);
Object.freeze(API_CONSTANTS);
Object.freeze(SECURITY_CONSTANTS);
Object.freeze(PM2_CONSTANTS);
Object.freeze(TESTING_CONSTANTS);
Object.freeze(ERROR_CONSTANTS);
Object.freeze(FLASK_CONSTANTS);
Object.freeze(TUTORIAL_CONSTANTS);

/**
 * Module Summary:
 * 
 * This comprehensive constants module provides centralized management for all
 * application-wide constants in the Node.js tutorial project. It demonstrates
 * modern ES Modules patterns, production-ready constant organization, and
 * educational best practices for constant management.
 * 
 * Key Features:
 * - Environment-aware configuration management
 * - Complete HTTP protocol constant specifications
 * - RESTful API design constants and standards
 * - Comprehensive security configuration for Helmet.js
 * - PM2 production deployment and process management constants
 * - Testing framework configuration for Jest and Mocha
 * - Structured error handling and debugging constants
 * - Cross-platform Flask compatibility mappings
 * - Tutorial-specific educational constants and validation rules
 * 
 * Educational Value:
 * - Demonstrates centralized constant management patterns
 * - Showcases modern JavaScript constant organization
 * - Provides comprehensive HTTP and web standards coverage
 * - Illustrates production-ready security constant definitions
 * - Shows process management and scaling configuration
 * - Demonstrates cross-platform development considerations
 * 
 * Production Features:
 * - Immutable constants to prevent runtime modification
 * - Organized for efficient lookup and minimal traversal
 * - Memory-efficient frozen objects for optimal performance
 * - Comprehensive coverage of all application concerns
 * - Designed for horizontal scaling with PM2 cluster mode
 * - Security-first approach with comprehensive threat coverage
 */