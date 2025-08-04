"""
Flask Constants Module - Comprehensive Configuration Management

This module provides centralized constant definitions for the Flask cross-platform
implementation, maintaining complete feature parity with the Express.js implementation.
Designed for Flask 3.1.1 with Python 3.9+ compatibility, providing comprehensive
configuration values, environment constants, HTTP protocol definitions, API endpoint
configurations, security settings, and testing parameters.

Educational Focus:
- Cross-platform compatibility with Express.js patterns
- Modern Python constant organization best practices
- Flask application factory pattern support
- Production deployment configuration management
- Testing framework integration constants

Author: Flask Tutorial Implementation Team  
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports
import os  # built-in - Operating system interface for environment variable access and path operations
from typing import Dict, List, Union, Any, Optional, Tuple  # built-in - Type hints for comprehensive constant type definitions and documentation

# Global Flask constants for application initialization and compatibility tracking
CONSTANTS_VERSION: str = '1.0.0'
FLASK_CONSTANTS_INITIALIZED: bool = True
CROSS_PLATFORM_COMPATIBILITY_MODE: bool = True

# Environment configuration constants for Flask application setup equivalent to Express.js environment variables
ENV_CONSTANTS: Dict[str, Union[int, str, Dict[str, Union[str, int, bool]]]] = {
    # Default server configuration matching Express.js defaults
    'DEFAULT_PORT': int(os.getenv('PORT', 3000)),
    'DEFAULT_HOST': str(os.getenv('HOST', '127.0.0.1')),
    
    # Environment type definitions with cross-platform compatibility
    'ENVIRONMENT_TYPES': {
        'DEVELOPMENT': 'development',
        'TESTING': 'testing', 
        'STAGING': 'staging',
        'PRODUCTION': 'production',
        'LOCAL': 'local'
    },
    
    # Node.js to Flask environment mapping for cross-platform compatibility
    'NODE_ENV_MAPPING': {
        'development': 'development',
        'test': 'testing',
        'production': 'production',
        'staging': 'staging'
    },
    
    # Flask-specific environment configuration mapping
    'FLASK_ENV_MAPPING': {
        'development': {
            'DEBUG': True,
            'TESTING': False,
            'SECRET_KEY': 'dev-secret-key-change-in-production',
            'JSON_SORT_KEYS': False
        },
        'testing': {
            'DEBUG': False,
            'TESTING': True,
            'SECRET_KEY': 'test-secret-key',
            'JSON_SORT_KEYS': True,
            'WTF_CSRF_ENABLED': False
        },
        'production': {
            'DEBUG': False,
            'TESTING': False,
            'SECRET_KEY': os.getenv('SECRET_KEY', 'production-secret-key-must-be-set'),
            'JSON_SORT_KEYS': True
        }
    },
    
    # Debug mode configuration equivalent to Express.js debug settings
    'DEBUG_MODES': {
        'FULL_DEBUG': True,
        'MINIMAL_DEBUG': False,
        'NO_DEBUG': False,
        'TEMPLATE_DEBUG': True,
        'SQL_DEBUG': False  # For future database integration phases
    }
}

# HTTP protocol constants for Flask response formatting maintaining complete feature parity with Express.js
HTTP_CONSTANTS: Dict[str, Dict[str, Union[int, str]]] = {
    # HTTP status codes equivalent to Express.js status code handling
    'STATUS_CODES': {
        # Success status codes
        'OK': 200,
        'CREATED': 201,
        'ACCEPTED': 202,
        'NO_CONTENT': 204,
        
        # Redirection status codes
        'MOVED_PERMANENTLY': 301,
        'FOUND': 302,
        'NOT_MODIFIED': 304,
        
        # Client error status codes
        'BAD_REQUEST': 400,
        'UNAUTHORIZED': 401,
        'FORBIDDEN': 403,
        'NOT_FOUND': 404,
        'METHOD_NOT_ALLOWED': 405,
        'NOT_ACCEPTABLE': 406,
        'REQUEST_TIMEOUT': 408,
        'CONFLICT': 409,
        'GONE': 410,
        'UNPROCESSABLE_ENTITY': 422,
        'TOO_MANY_REQUESTS': 429,
        
        # Server error status codes
        'INTERNAL_SERVER_ERROR': 500,
        'NOT_IMPLEMENTED': 501,
        'BAD_GATEWAY': 502,
        'SERVICE_UNAVAILABLE': 503,
        'GATEWAY_TIMEOUT': 504
    },
    
    # Content type definitions for proper response formatting
    'CONTENT_TYPES': {
        'JSON': 'application/json',
        'HTML': 'text/html',
        'PLAIN_TEXT': 'text/plain',
        'XML': 'application/xml',
        'FORM_URLENCODED': 'application/x-www-form-urlencoded',
        'MULTIPART_FORM': 'multipart/form-data',
        'JAVASCRIPT': 'application/javascript',
        'CSS': 'text/css',
        'PNG': 'image/png',
        'JPEG': 'image/jpeg',
        'GIF': 'image/gif',
        'SVG': 'image/svg+xml'
    },
    
    # HTTP headers for proper response configuration
    'HEADERS': {
        'CONTENT_TYPE': 'Content-Type',
        'CONTENT_LENGTH': 'Content-Length',
        'CACHE_CONTROL': 'Cache-Control',
        'EXPIRES': 'Expires',
        'ETAG': 'ETag',
        'LAST_MODIFIED': 'Last-Modified',
        'LOCATION': 'Location',
        'SERVER': 'Server',
        'X_POWERED_BY': 'X-Powered-By',
        'ACCESS_CONTROL_ALLOW_ORIGIN': 'Access-Control-Allow-Origin',
        'ACCESS_CONTROL_ALLOW_METHODS': 'Access-Control-Allow-Methods',
        'ACCESS_CONTROL_ALLOW_HEADERS': 'Access-Control-Allow-Headers'
    },
    
    # HTTP methods for route definition and validation
    'METHODS': {
        'GET': 'GET',
        'POST': 'POST',
        'PUT': 'PUT',
        'DELETE': 'DELETE',
        'PATCH': 'PATCH',
        'HEAD': 'HEAD',
        'OPTIONS': 'OPTIONS',
        'TRACE': 'TRACE'
    },
    
    # Character encoding definitions for international support
    'CHARSET_ENCODING': {
        'UTF8': 'utf-8',
        'UTF16': 'utf-16',
        'ISO_8859_1': 'iso-8859-1',
        'ASCII': 'ascii',
        'DEFAULT': 'utf-8'
    }
}

# API endpoint definitions and response patterns for Flask implementation maintaining feature parity
API_CONSTANTS: Dict[str, Dict[str, Union[str, Dict[str, Union[str, int, List[str]]]]]] = {
    # Endpoint route definitions matching Express.js routes exactly
    'ENDPOINTS': {
        'HELLO': '/hello',
        'GOOD_EVENING': '/good-evening',
        'HEALTH_CHECK': '/health',
        'API_VERSION': '/api/v1',
        'STATUS': '/status',
        'METRICS': '/metrics',
        'DOCS': '/docs',
        'SWAGGER': '/swagger.json'
    },
    
    # Standardized response patterns for API consistency
    'RESPONSES': {
        'HELLO_WORLD': {
            'message': 'Hello world',
            'timestamp': '${timestamp}',
            'status': 'success'
        },
        'GOOD_EVENING': {
            'message': 'Good evening', 
            'timestamp': '${timestamp}',
            'status': 'success'
        },
        'HEALTH_OK': {
            'status': 'OK',
            'uptime': '${uptime}',
            'environment': '${environment}',
            'version': CONSTANTS_VERSION
        },
        'NOT_FOUND': {
            'error': 'Route not found',
            'status': 'error',
            'code': 404
        },
        'INTERNAL_ERROR': {
            'error': 'Internal server error',
            'status': 'error', 
            'code': 500
        }
    },
    
    # Error message templates for consistent error handling
    'ERROR_MESSAGES': {
        'ROUTE_NOT_FOUND': 'The requested route was not found',
        'METHOD_NOT_ALLOWED': 'The requested method is not allowed for this route',
        'INTERNAL_SERVER_ERROR': 'An internal server error occurred',
        'BAD_REQUEST': 'The request could not be processed due to invalid syntax',
        'UNAUTHORIZED': 'Authentication is required to access this resource',
        'FORBIDDEN': 'Access to this resource is forbidden',
        'VALIDATION_ERROR': 'Request validation failed',
        'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded. Please try again later'
    },
    
    # Success message templates for positive responses
    'SUCCESS_MESSAGES': {
        'REQUEST_PROCESSED': 'Request processed successfully',
        'DATA_RETRIEVED': 'Data retrieved successfully',
        'OPERATION_COMPLETED': 'Operation completed successfully',
        'HEALTH_CHECK_PASSED': 'Health check passed',
        'SERVICE_AVAILABLE': 'Service is available and operational'
    },
    
    # Validation rules for request processing
    'VALIDATION_RULES': {
        'MAX_REQUEST_SIZE': 1048576,  # 1MB in bytes
        'ALLOWED_CONTENT_TYPES': ['application/json', 'text/plain', 'application/x-www-form-urlencoded'],
        'REQUIRED_HEADERS': ['Content-Type'],
        'TIMEOUT_SECONDS': 30,
        'MAX_URL_LENGTH': 2048
    }
}

# Security configuration constants for Flask-Talisman equivalent to Helmet.js 15 sub-middlewares
SECURITY_CONSTANTS: Dict[str, Dict[str, Union[str, bool, int, List[str], Dict[str, Union[str, bool]]]]] = {
    # Content Security Policy directives for XSS prevention
    'CSP_DIRECTIVES': {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:", "https:"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
    },
    
    # Security headers configuration equivalent to Helmet.js functionality
    'SECURITY_HEADERS': {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '0',  # Disabled as recommended by Helmet.js
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    
    # CORS configuration for cross-origin request handling
    'CORS_CONFIG': {
        'origins': ['http://localhost:3000', 'http://127.0.0.1:3000'],
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
        'expose_headers': ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        'supports_credentials': False,
        'max_age': 86400  # 24 hours
    },
    
    # Flask-Talisman configuration equivalent to Helmet.js setup
    'TALISMAN_CONFIG': {
        'force_https': False,  # Set to True in production
        'strict_transport_security': True,
        'strict_transport_security_preload': True,
        'strict_transport_security_max_age': 31536000,
        'content_security_policy': True,
        'content_security_policy_report_only': False,
        'referrer_policy': 'strict-origin-when-cross-origin'
    },
    
    # Helmet.js equivalent configuration mapping for educational comparison
    'HELMET_EQUIVALENT_CONFIG': {
        'contentSecurityPolicy': 'CSP_DIRECTIVES',
        'strictTransportSecurity': 'SECURITY_HEADERS.Strict-Transport-Security',
        'xContentTypeOptions': 'SECURITY_HEADERS.X-Content-Type-Options',
        'xFrameOptions': 'SECURITY_HEADERS.X-Frame-Options',
        'xXssProtection': 'SECURITY_HEADERS.X-XSS-Protection',
        'referrerPolicy': 'SECURITY_HEADERS.Referrer-Policy',
        'crossOriginEmbedderPolicy': 'SECURITY_HEADERS.Cross-Origin-Embedder-Policy',
        'crossOriginOpenerPolicy': 'SECURITY_HEADERS.Cross-Origin-Opener-Policy',
        'crossOriginResourcePolicy': 'SECURITY_HEADERS.Cross-Origin-Resource-Policy'
    }
}

# WSGI deployment configuration constants equivalent to PM2 process management
WSGI_CONSTANTS: Dict[str, Dict[str, Union[str, int, bool, List[str]]]] = {
    # WSGI server configuration for production deployment
    'SERVER_CONFIG': {
        'bind': f"{ENV_CONSTANTS['DEFAULT_HOST']}:{ENV_CONSTANTS['DEFAULT_PORT']}",
        'timeout': 30,
        'keepalive': 5,
        'max_requests': 1000,
        'max_requests_jitter': 100,
        'worker_class': 'sync',
        'worker_connections': 1000
    },
    
    # Worker process configuration equivalent to PM2 cluster mode
    'WORKER_CONFIG': {
        'workers': os.cpu_count() or 1,  # Equivalent to PM2 "max" instances
        'worker_tmp_dir': '/dev/shm',
        'threads': 2,
        'max_worker_memory': 1073741824,  # 1GB equivalent to PM2 max_memory_restart
        'worker_class': 'gthread',
        'preload_app': True
    },
    
    # Deployment configuration for various environments
    'DEPLOYMENT_CONFIG': {
        'development': {
            'debug': True,
            'reload': True,
            'workers': 1,
            'log_level': 'debug'
        },
        'testing': {
            'debug': False,
            'reload': False,
            'workers': 1,
            'log_level': 'info'
        },
        'production': {
            'debug': False,
            'reload': False,
            'workers': os.cpu_count() or 1,
            'log_level': 'warning'
        }
    },
    
    # Gunicorn-specific configuration equivalent to PM2 process management
    'GUNICORN_CONFIG': {
        'bind': '0.0.0.0:3000',
        'workers': os.cpu_count() or 1,
        'worker_class': 'sync',
        'worker_connections': 1000,
        'max_requests': 1000,
        'max_requests_jitter': 50,
        'timeout': 30,
        'keepalive': 2,
        'preload_app': True,
        'daemon': False,
        'pidfile': '/tmp/gunicorn.pid',
        'user': None,
        'group': None,
        'tmp_upload_dir': None,
        'secure_scheme_headers': {
            'X-FORWARDED-PROTO': 'https',
            'X-FORWARDED-SSL': 'on'
        }
    },
    
    # PM2 equivalent configuration for educational comparison
    'PM2_EQUIVALENT_CONFIG': {
        'name': 'flask-tutorial-app',
        'script': 'wsgi:app',
        'instances': 'max',  # Equivalent to worker count
        'exec_mode': 'cluster',  # Similar to multiple Gunicorn workers
        'autorestart': True,
        'watch': False,
        'max_memory_restart': '1G',
        'env': {
            'NODE_ENV': 'production',  # Cross-platform environment mapping
            'FLASK_ENV': 'production',
            'PORT': 3000
        },
        'log_file': './logs/combined.log',
        'out_file': './logs/out.log',
        'error_file': './logs/error.log',
        'log_date_format': 'YYYY-MM-DD HH:mm Z'
    }
}

# Testing framework constants for pytest configuration equivalent to Jest/Mocha capabilities
TESTING_CONSTANTS: Dict[str, Dict[str, Union[str, int, float, bool, List[str]]]] = {
    # Testing frameworks configuration and comparison
    'FRAMEWORKS': {
        'PRIMARY': 'pytest',
        'ALTERNATIVE': 'unittest',
        'COVERAGE_TOOL': 'pytest-cov',
        'MOCKING_LIBRARY': 'pytest-mock',
        'HTTP_TESTING': 'pytest-flask',
        'PERFORMANCE_TESTING': 'pytest-benchmark'
    },
    
    # Coverage thresholds equivalent to Jest/Mocha requirements (≥90%)
    'COVERAGE_THRESHOLDS': {
        'lines': 90,
        'statements': 90,
        'branches': 85,
        'functions': 95,
        'missing': 10,  # Maximum allowed missing coverage percentage
        'skip_covered': False,
        'show_missing': True,
        'precision': 2
    },
    
    # Test timeout configuration for various test types
    'TEST_TIMEOUTS': {
        'unit_test': 5,      # 5 seconds for unit tests
        'integration_test': 30,  # 30 seconds for integration tests
        'e2e_test': 60,      # 60 seconds for end-to-end tests
        'performance_test': 120,  # 2 minutes for performance tests
        'load_test': 300     # 5 minutes for load tests
    },
    
    # Performance targets equivalent to Express.js requirements (<100ms response time)
    'PERFORMANCE_TARGETS': {
        'response_time_ms': 100,  # Maximum response time in milliseconds
        'requests_per_second': 1000,  # Minimum throughput requirement
        'memory_usage_mb': 100,   # Maximum memory usage per process
        'cpu_usage_percent': 80,  # Maximum CPU usage percentage
        'error_rate_percent': 1,  # Maximum acceptable error rate
        'availability_percent': 99.9  # Minimum uptime requirement
    },
    
    # Pytest-specific configuration equivalent to Jest/Mocha setup
    'PYTEST_CONFIG': {
        'testpaths': ['tests'],
        'python_files': ['test_*.py', '*_test.py'],
        'python_classes': ['Test*'],
        'python_functions': ['test_*'],
        'addopts': [
            '--verbose',
            '--tb=short',
            '--strict-markers',
            '--cov=src',
            '--cov-report=html',
            '--cov-report=term-missing',
            '--cov-fail-under=90'
        ],
        'markers': [
            'unit: Unit tests',
            'integration: Integration tests',
            'e2e: End-to-end tests',
            'performance: Performance tests',
            'slow: Slow running tests'
        ],
        'filterwarnings': [
            'ignore::DeprecationWarning',
            'ignore::PendingDeprecationWarning'
        ]
    }
}

# Error handling constants for Flask error middleware equivalent to Express.js patterns
ERROR_CONSTANTS: Dict[str, Dict[str, Union[str, int, Dict[str, Union[str, int]]]]] = {
    # HTTP error definitions with detailed descriptions
    'HTTP_ERRORS': {
        400: {
            'name': 'Bad Request',
            'message': 'The server could not understand the request due to invalid syntax',
            'category': 'client_error'
        },
        401: {
            'name': 'Unauthorized',
            'message': 'Authentication is required and has failed or has not yet been provided',
            'category': 'client_error'
        },
        403: {
            'name': 'Forbidden',
            'message': 'The server understood the request but refuses to authorize it',
            'category': 'client_error'
        },
        404: {
            'name': 'Not Found',
            'message': 'The server can not find the requested resource',
            'category': 'client_error'
        },
        405: {
            'name': 'Method Not Allowed',
            'message': 'The request method is known by the server but is not supported',
            'category': 'client_error'
        },
        429: {
            'name': 'Too Many Requests',
            'message': 'The user has sent too many requests in a given amount of time',
            'category': 'client_error'
        },
        500: {
            'name': 'Internal Server Error',
            'message': 'The server has encountered a situation it doesn\'t know how to handle',
            'category': 'server_error'
        },
        502: {
            'name': 'Bad Gateway',
            'message': 'The server received an invalid response from the upstream server',
            'category': 'server_error'
        },
        503: {
            'name': 'Service Unavailable',
            'message': 'The server is not ready to handle the request',
            'category': 'server_error'
        }
    },
    
    # Validation error patterns for request processing
    'VALIDATION_ERRORS': {
        'MISSING_REQUIRED_FIELD': {
            'code': 'VALIDATION_001',
            'message': 'Required field is missing',
            'http_status': 400
        },
        'INVALID_DATA_TYPE': {
            'code': 'VALIDATION_002', 
            'message': 'Invalid data type provided',
            'http_status': 400
        },
        'VALUE_OUT_OF_RANGE': {
            'code': 'VALIDATION_003',
            'message': 'Value is outside acceptable range',
            'http_status': 400
        },
        'INVALID_FORMAT': {
            'code': 'VALIDATION_004',
            'message': 'Data format is invalid',
            'http_status': 400
        },
        'CONSTRAINT_VIOLATION': {
            'code': 'VALIDATION_005',
            'message': 'Data violates system constraints',
            'http_status': 422
        }
    },
    
    # System error patterns for internal issues
    'SYSTEM_ERRORS': {
        'DATABASE_CONNECTION_ERROR': {
            'code': 'SYSTEM_001',
            'message': 'Unable to connect to database',
            'http_status': 500
        },
        'CONFIGURATION_ERROR': {
            'code': 'SYSTEM_002',
            'message': 'System configuration error',
            'http_status': 500
        },
        'EXTERNAL_SERVICE_ERROR': {
            'code': 'SYSTEM_003',
            'message': 'External service unavailable',
            'http_status': 502
        },
        'MEMORY_ERROR': {
            'code': 'SYSTEM_004',
            'message': 'Insufficient memory resources',
            'http_status': 500
        },
        'TIMEOUT_ERROR': {
            'code': 'SYSTEM_005',
            'message': 'Operation timed out',
            'http_status': 504
        }
    },
    
    # Custom application-specific error codes
    'CUSTOM_ERROR_CODES': {
        'FLASK_APP_001': 'Application initialization failed',
        'FLASK_APP_002': 'Route registration error', 
        'FLASK_APP_003': 'Middleware configuration error',
        'FLASK_APP_004': 'Template rendering error',
        'FLASK_APP_005': 'Static file serving error'
    },
    
    # Error response formatting for consistent error responses
    'ERROR_FORMATTING': {
        'include_stack_trace': False,  # Set to True in development
        'include_timestamp': True,
        'include_request_id': True,
        'include_error_code': True,
        'include_suggestions': True,
        'default_error_message': 'An unexpected error occurred'
    }
}

# Express.js compatibility constants for educational cross-platform comparison
EXPRESS_CONSTANTS: Dict[str, Dict[str, Union[str, List[str], Dict[str, str]]]] = {
    # Direct compatibility mapping between Express.js and Flask patterns
    'COMPATIBILITY_MAPPING': {
        'express_app_listen': 'flask_app_run',
        'express_router': 'flask_blueprint',
        'express_middleware': 'flask_before_request',
        'express_error_handler': 'flask_errorhandler',
        'express_static': 'flask_send_static_file',
        'express_json': 'flask_request_json',
        'express_urlencoded': 'flask_request_form',
        'express_cors': 'flask_cors'
    },
    
    # Middleware equivalent mapping for educational purposes
    'MIDDLEWARE_EQUIVALENT': {
        'helmet': 'flask_talisman',
        'cors': 'flask_cors',
        'morgan': 'flask_logging',
        'body_parser': 'flask_request_parsing',
        'compression': 'flask_compress',
        'serve_static': 'flask_static_files',
        'express_rate_limit': 'flask_limiter',
        'express_validator': 'flask_wtf'
    },
    
    # Response pattern equivalencies between platforms
    'RESPONSE_PATTERNS': {
        'res_json': 'jsonify',
        'res_send': 'return_string',
        'res_status': 'response_status_code',
        'res_redirect': 'flask_redirect',
        'res_render': 'flask_render_template',
        'res_cookie': 'flask_set_cookie',
        'res_header': 'flask_response_headers'
    },
    
    # Feature parity validation mapping for testing
    'FEATURE_PARITY_MAP': {
        'http_server': ['Basic HTTP server functionality', 'Flask app.run()'],
        'routing': ['Express.js routing', 'Flask @app.route()'],
        'middleware': ['Express middleware', 'Flask before_request'],
        'error_handling': ['Express error handlers', 'Flask errorhandler'],  
        'static_files': ['Express static', 'Flask static_folder'],
        'json_parsing': ['Express json parser', 'Flask request.get_json()'],
        'template_engine': ['Express view engine', 'Flask Jinja2'],
        'security_headers': ['Helmet.js', 'Flask-Talisman']
    }
}

# Tutorial and educational constants for Flask implementation learning objectives
TUTORIAL_CONSTANTS: Dict[str, Dict[str, Union[str, List[str], Dict[str, Union[str, int]]]]] = {
    # Educational content organization for progressive learning
    'EDUCATIONAL_CONTENT': {
        'course_title': 'Flask Cross-Platform Web Development Tutorial',
        'target_audience': 'Developers learning Flask and cross-platform development',
        'prerequisites': ['Python 3.9+', 'Basic web development knowledge', 'HTTP protocol understanding'],
        'learning_outcomes': [
            'Understand Flask application structure and patterns',
            'Implement cross-platform API compatibility', 
            'Deploy Flask applications with WSGI servers',
            'Apply security best practices with Flask-Talisman',
            'Write comprehensive tests with pytest',
            'Compare Flask and Express.js implementation patterns'
        ]
    },
    
    # Tutorial phase definitions matching the progressive enhancement pattern
    'PHASE_DEFINITIONS': {
        'phase_1': {
            'title': 'Basic Flask Application',
            'description': 'Create simple Flask app equivalent to basic HTTP server',
            'duration_hours': 2,
            'complexity_level': 'Beginner'
        },
        'phase_2': {
            'title': 'Flask Routing and Middleware',
            'description': 'Implement routing and middleware equivalent to Express.js',
            'duration_hours': 3,
            'complexity_level': 'Intermediate'
        },
        'phase_3': {
            'title': 'Cross-Platform Feature Parity',
            'description': 'Ensure complete compatibility with Express.js implementation',
            'duration_hours': 4,
            'complexity_level': 'Intermediate'
        },
        'phase_4': {
            'title': 'Testing Implementation',
            'description': 'Comprehensive testing with pytest and coverage',
            'duration_hours': 3,
            'complexity_level': 'Intermediate'
        },
        'phase_5': {
            'title': 'Production Deployment',
            'description': 'WSGI deployment equivalent to PM2 process management',
            'duration_hours': 4,
            'complexity_level': 'Advanced'
        },
        'phase_6': {
            'title': 'Security Implementation',
            'description': 'Flask-Talisman security equivalent to Helmet.js',
            'duration_hours': 3,
            'complexity_level': 'Advanced'
        },
        'phase_7': {
            'title': 'Documentation and Best Practices',
            'description': 'Complete documentation and production readiness',
            'duration_hours': 2,
            'complexity_level': 'Advanced'
        }
    },
    
    # Learning objectives for each tutorial component
    'LEARNING_OBJECTIVES': {
        'flask_fundamentals': [
            'Understand Flask application factory pattern',
            'Master Flask routing and URL building',
            'Implement Flask blueprints for modular design',
            'Configure Flask environments and settings'
        ],
        'cross_platform_development': [
            'Compare Flask and Express.js architectural patterns',
            'Implement identical API endpoints across platforms',
            'Maintain response format consistency',
            'Validate feature parity through testing'
        ],
        'production_deployment': [
            'Configure Gunicorn WSGI server',
            'Implement process management strategies',
            'Set up production logging and monitoring', 
            'Deploy with containerization options'
        ],
        'security_implementation': [
            'Configure Flask-Talisman security headers',
            'Implement CORS policies',
            'Apply input validation and sanitization',
            'Set up security monitoring and alerting'
        ]
    },
    
    # Documentation configuration for tutorial maintenance
    'DOCUMENTATION_CONFIG': {
        'format': 'markdown',
        'auto_generation': True,
        'include_code_examples': True,
        'include_comparisons': True,
        'update_frequency': 'per_phase_completion',
        'review_cycle': 'monthly',
        'version_control': True,
        'multilingual_support': False,
        'interactive_examples': True
    }
}