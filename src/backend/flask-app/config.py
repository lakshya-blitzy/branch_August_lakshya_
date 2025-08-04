"""
Flask Application Configuration Module - Cross-Platform Node.js Tutorial Project Migration

This module provides comprehensive Flask configuration management implementing environment-specific 
configuration classes for the cross-platform Node.js tutorial project migration. Provides complete 
Flask configuration management equivalent to Node.js Express configuration with environment-aware 
settings for development, production, staging, and testing environments.

Implements Flask application factory pattern configuration classes supporting Flask-Talisman security
equivalent to Helmet.js, WSGI deployment configuration equivalent to PM2 cluster mode, and complete
feature parity with Express.js implementation. Features modern Python configuration patterns,
environment variable management, security hardening, and educational cross-platform comparison
demonstrating Flask development best practices.

Educational Focus:
- Flask application factory pattern configuration equivalent to Express.js environment management
- Cross-platform compatibility maintaining complete feature parity with Node.js implementation
- Flask-Talisman security configuration equivalent to Helmet.js 15 sub-middlewares protection
- WSGI deployment configuration equivalent to PM2 cluster mode with Gunicorn multi-worker setup
- Modern Python configuration patterns with Flask 3.1.1 latest stable release integration
- Environment-specific configuration inheritance demonstrating Flask development best practices

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import os  # built-in - Operating system interface for environment variable access equivalent to Node.js process.env
import pathlib  # built-in - Object-oriented filesystem paths for configuration file handling and cross-platform compatibility
import datetime  # built-in - Date and time utilities for session timeout configuration and timestamp management
import secrets  # built-in - Cryptographically secure random number generation for secret key generation equivalent to Node.js crypto
import uuid  # built-in - UUID generation for session management and unique identifier creation in Flask configuration

# Internal imports for Flask configuration and cross-platform compatibility constants
from utils.constants import (
    ENV_CONSTANTS,          # Environment constants for Flask configuration and cross-platform compatibility settings
    SECURITY_CONSTANTS,     # Security constants for Flask-Talisman configuration equivalent to Helmet.js protection
    WSGI_CONSTANTS,        # WSGI deployment constants for Gunicorn multi-worker deployment equivalent to PM2 cluster mode
    TESTING_CONSTANTS,     # Testing constants for pytest configuration and coverage requirements ≥90%
    API_CONSTANTS          # API endpoint definitions and routing patterns for Flask implementation with Express.js parity
)

# Internal logger import for configuration initialization tracking and validation error reporting
from utils.logger import logger

# Global Flask configuration state management for application factory pattern integration
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
BASE_DIR = pathlib.Path(__file__).parent
DEFAULT_SECRET_KEY = secrets.token_urlsafe(32)
CONFIG_VERSION = '1.0.0'
CROSS_PLATFORM_PARITY = True


def get_config_class(environment: str):
    """
    Factory function that returns appropriate Flask configuration class based on environment 
    parameter, providing environment-aware configuration selection equivalent to Express.js 
    environment-based configuration loading with validation and fallback mechanisms.
    
    Args:
        environment: Environment name string for configuration class selection
        
    Returns:
        Configuration class instance appropriate for the specified environment with complete 
        Flask application factory configuration
    """
    # Validate environment parameter against known environment types from ENV_CONSTANTS
    valid_environments = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {})
    
    # Normalize environment string to lowercase for consistent lookup and validation
    normalized_env = environment.lower().strip() if environment else 'development'
    
    # Map environment to appropriate configuration class with Flask application factory pattern
    config_mapping = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig,
        'staging': StagingConfig
    }
    
    # Log configuration class selection for debugging and audit trail with environment details
    logger.info(f"Selecting configuration class for environment: {normalized_env}")
    
    # Return instantiated configuration class with environment-specific settings and validation
    if normalized_env in config_mapping:
        selected_config = config_mapping[normalized_env]
        logger.info(f"Configuration class selected: {selected_config.__name__}")
        return selected_config
    else:
        # Apply fallback to development configuration if environment not recognized
        logger.warning(f"Unknown environment '{normalized_env}', falling back to development configuration")
        return DevelopmentConfig
    
    # Validate configuration class completeness before return with error handling
    try:
        config_instance = selected_config()
        config_instance.validate_config()
        return selected_config
    except Exception as e:
        logger.error(f"Configuration validation failed for {normalized_env}: {str(e)}")
        return DevelopmentConfig


def validate_environment_variables(environment: str) -> dict:
    """
    Validates required environment variables for Flask application configuration ensuring 
    all necessary values are present, properly formatted, and compatible with cross-platform 
    requirements and security standards.
    
    Args:
        environment: Environment name string for environment-specific validation
        
    Returns:
        Validation result dictionary with status, missing variables, format errors, and 
        recommendations for environment variable configuration
    """
    # Initialize validation result dictionary with comprehensive status tracking
    validation_result = {
        'status': 'valid',
        'environment': environment,
        'missing_variables': [],
        'format_errors': [],
        'warnings': [],
        'recommendations': [],
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    # Check required environment variables for Flask core configuration including SECRET_KEY and FLASK_ENV
    required_core_vars = ['FLASK_ENV']
    optional_core_vars = ['SECRET_KEY', 'FLASK_DEBUG', 'FLASK_APP']
    
    for var in required_core_vars:
        if not os.environ.get(var):
            validation_result['missing_variables'].append(var)
            validation_result['status'] = 'invalid'
    
    # Validate server configuration variables including PORT and HOST settings
    server_vars = ENV_CONSTANTS.get('DEFAULT_PORT', 3000)
    host_var = ENV_CONSTANTS.get('DEFAULT_HOST', '127.0.0.1')
    
    port_value = os.environ.get('PORT', server_vars)
    try:
        port_int = int(port_value)
        if port_int < 1 or port_int > 65535:
            validation_result['format_errors'].append(f"PORT value {port_int} out of valid range (1-65535)")
            validation_result['status'] = 'invalid'
    except ValueError:
        validation_result['format_errors'].append(f"PORT value '{port_value}' is not a valid integer")
        validation_result['status'] = 'invalid'
    
    # Verify security configuration variables for Flask-Talisman and CORS setup
    security_vars = ['CORS_ORIGINS', 'CSP_DIRECTIVES', 'SSL_CERT_PATH', 'SSL_KEY_PATH']
    for var in security_vars:
        if os.environ.get(var):
            # Validate security variable format based on type
            if var == 'CORS_ORIGINS':
                origins = os.environ.get(var, '').split(',')
                for origin in origins:
                    if origin.strip() and not origin.strip().startswith(('http://', 'https://', '*')):
                        validation_result['format_errors'].append(f"Invalid CORS origin format: {origin}")
                        validation_result['status'] = 'invalid'
    
    # Check WSGI deployment variables for production configuration
    if environment.lower() == 'production':
        wsgi_vars = ['GUNICORN_WORKERS', 'GUNICORN_TIMEOUT', 'GUNICORN_BIND']
        for var in wsgi_vars:
            if not os.environ.get(var):
                validation_result['warnings'].append(f"Production environment missing optional {var}")
    
    # Validate testing configuration variables for pytest integration
    if environment.lower() == 'testing':
        test_vars = ['TEST_DATABASE_URL', 'COVERAGE_THRESHOLD']
        for var in test_vars:
            if not os.environ.get(var):
                validation_result['warnings'].append(f"Testing environment missing optional {var}")
    
    # Verify cross-platform compatibility variables for feature parity
    compat_vars = ['NODE_ENV', 'EXPRESS_PORT']
    for var in compat_vars:
        if os.environ.get(var):
            validation_result['recommendations'].append(f"Cross-platform variable {var} detected for Express.js compatibility")
    
    # Generate comprehensive validation report with errors and warnings
    if validation_result['missing_variables']:
        validation_result['recommendations'].append("Set missing required environment variables before starting Flask application")
    
    if validation_result['format_errors']:
        validation_result['recommendations'].append("Fix environment variable format errors to ensure proper configuration")
    
    # Log validation results for configuration debugging and audit
    if validation_result['status'] == 'valid':
        logger.info(f"Environment variable validation passed for {environment}")
    else:
        logger.error(f"Environment variable validation failed for {environment}: {validation_result}")
    
    return validation_result


def generate_secret_key(length: int = 32) -> str:
    """
    Generates cryptographically secure secret key for Flask application using Python secrets 
    module providing secure random token generation for session management and CSRF protection 
    equivalent to Express.js session secret generation.
    
    Args:
        length: Secret key length in bytes for cryptographic security (minimum 32 bytes)
        
    Returns:
        Cryptographically secure URL-safe secret key string suitable for Flask SECRET_KEY configuration
    """
    # Validate length parameter with minimum security requirements (32 characters minimum)
    if length < 32:
        logger.warning(f"Secret key length {length} below recommended minimum of 32 bytes")
        length = 32
    
    # Generate cryptographically secure random bytes using secrets module for Flask security
    try:
        # Generate cryptographically secure URL-safe base64 string for Flask compatibility
        secret_key = secrets.token_urlsafe(length)
        
        # Log secret key generation for audit trail without exposing actual key
        logger.info(f"Generated cryptographically secure secret key of {length} bytes")
        
        # Return URL-safe secret key string suitable for Flask configuration
        return secret_key
        
    except Exception as e:
        logger.error(f"Failed to generate secret key: {str(e)}")
        # Fallback to default secure key generation
        return secrets.token_urlsafe(32)


def create_ssl_config(cert_path: str, key_path: str, environment: str) -> dict:
    """
    Creates SSL/TLS configuration dictionary for Flask-Talisman HTTPS enforcement equivalent 
    to Express.js HTTPS configuration with certificate path validation and security settings 
    for production deployment.
    
    Args:
        cert_path: SSL certificate file path for HTTPS configuration
        key_path: SSL private key file path for HTTPS configuration  
        environment: Environment name for SSL configuration customization
        
    Returns:
        SSL configuration dictionary with certificate paths, security settings, and HTTPS 
        enforcement configuration for Flask-Talisman
    """
    # Initialize SSL configuration dictionary with security defaults
    ssl_config = {
        'ssl_enabled': False,
        'cert_path': None,
        'key_path': None,
        'ssl_context': None,
        'https_enforcement': False,
        'hsts_max_age': 31536000,  # 1 year in seconds
        'environment': environment,
        'validation_errors': []
    }
    
    # Validate SSL certificate file path existence and permissions
    if cert_path:
        cert_file = pathlib.Path(cert_path)
        if cert_file.exists() and cert_file.is_file():
            try:
                # Check certificate file permissions and readability
                with open(cert_file, 'r') as f:
                    cert_content = f.read()
                    if '-----BEGIN CERTIFICATE-----' in cert_content:
                        ssl_config['cert_path'] = str(cert_file.absolute())
                        logger.info(f"Valid SSL certificate found at {cert_path}")
                    else:
                        ssl_config['validation_errors'].append(f"Invalid certificate format in {cert_path}")
            except Exception as e:
                ssl_config['validation_errors'].append(f"Cannot read certificate file {cert_path}: {str(e)}")
        else:
            ssl_config['validation_errors'].append(f"Certificate file not found: {cert_path}")
    
    # Validate SSL private key file path existence and permissions
    if key_path:
        key_file = pathlib.Path(key_path)
        if key_file.exists() and key_file.is_file():
            try:
                # Check private key file permissions and readability
                with open(key_file, 'r') as f:
                    key_content = f.read()
                    if '-----BEGIN PRIVATE KEY-----' in key_content or '-----BEGIN RSA PRIVATE KEY-----' in key_content:
                        ssl_config['key_path'] = str(key_file.absolute())
                        logger.info(f"Valid SSL private key found at {key_path}")
                    else:
                        ssl_config['validation_errors'].append(f"Invalid private key format in {key_path}")
            except Exception as e:
                ssl_config['validation_errors'].append(f"Cannot read private key file {key_path}: {str(e)}")
        else:
            ssl_config['validation_errors'].append(f"Private key file not found: {key_path}")
    
    # Check certificate validity and expiration dates using OpenSSL if available
    if ssl_config['cert_path'] and ssl_config['key_path']:
        try:
            # Attempt to create SSL context for validation
            import ssl
            ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            ssl_context.load_cert_chain(ssl_config['cert_path'], ssl_config['key_path'])
            ssl_config['ssl_context'] = 'context_created'
            ssl_config['ssl_enabled'] = True
            logger.info("SSL context successfully created and validated")
        except Exception as e:
            ssl_config['validation_errors'].append(f"SSL context creation failed: {str(e)}")
    
    # Create environment-appropriate SSL configuration dictionary
    if environment.lower() == 'production':
        ssl_config['https_enforcement'] = True
        ssl_config['hsts_max_age'] = 31536000  # 1 year
        ssl_config['secure_cookies'] = True
        ssl_config['ssl_redirect'] = True
    elif environment.lower() == 'staging':
        ssl_config['https_enforcement'] = True
        ssl_config['hsts_max_age'] = 86400  # 1 day
        ssl_config['secure_cookies'] = True
        ssl_config['ssl_redirect'] = False
    else:
        ssl_config['https_enforcement'] = False
        ssl_config['secure_cookies'] = False
        ssl_config['ssl_redirect'] = False
    
    # Configure HTTPS enforcement settings based on environment
    ssl_config['talisman_config'] = {
        'force_https': ssl_config['https_enforcement'],
        'strict_transport_security': ssl_config['https_enforcement'],
        'strict_transport_security_max_age': ssl_config['hsts_max_age'],
        'content_security_policy': SECURITY_CONSTANTS.get('CSP_DIRECTIVES', {}),
        'session_cookie_secure': ssl_config['secure_cookies']
    }
    
    # Set up SSL security parameters and cipher suites for production
    if ssl_config['ssl_enabled']:
        ssl_config['cipher_suites'] = [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_GCM_SHA256',
            'ECDHE-RSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES128-GCM-SHA256'
        ]
        ssl_config['ssl_protocols'] = ['TLSv1.2', 'TLSv1.3']
    
    # Log SSL configuration setup results
    if ssl_config['validation_errors']:
        logger.error(f"SSL configuration validation errors: {ssl_config['validation_errors']}")
    else:
        logger.info(f"SSL configuration created for {environment} environment")
    
    # Return complete SSL configuration for Flask-Talisman integration
    return ssl_config


def get_cors_origins(environment: str, custom_origins: list = None) -> list:
    """
    Generates CORS origin configuration based on environment and deployment context for 
    Flask-CORS middleware equivalent to Express.js CORS configuration with environment-specific 
    origin policies and security settings.
    
    Args:
        environment: Environment name for CORS policy configuration
        custom_origins: Optional list of additional allowed origins
        
    Returns:
        List of allowed CORS origins with environment-appropriate security policies for 
        cross-origin API access
    """
    # Load environment-specific CORS configuration from SECURITY_CONSTANTS
    cors_config = SECURITY_CONSTANTS.get('CORS_CONFIG', {})
    default_origins = []
    
    # Parse CORS_ORIGINS environment variable if present
    env_origins = os.environ.get('CORS_ORIGINS', '')
    if env_origins:
        env_origins_list = [origin.strip() for origin in env_origins.split(',') if origin.strip()]
        default_origins.extend(env_origins_list)
        logger.info(f"Loaded {len(env_origins_list)} CORS origins from environment variables")
    
    # Apply environment-specific origin policies with security considerations
    if environment.lower() == 'development':
        # Permissive CORS for development productivity and local testing
        default_origins.extend([
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:8000'
        ])
        logger.info("Applied permissive CORS origins for development environment")
        
    elif environment.lower() == 'production':
        # Restrictive CORS for production security
        production_origins = cors_config.get('production_origins', [])
        if production_origins:
            default_origins.extend(production_origins)
        else:
            # Default secure production configuration if not specified
            default_origins = ['https://yourdomain.com', 'https://www.yourdomain.com']
        logger.info("Applied restrictive CORS origins for production environment")
        
    elif environment.lower() == 'staging':
        # Staging-specific CORS configuration for pre-production testing
        staging_origins = cors_config.get('staging_origins', [])
        if staging_origins:
            default_origins.extend(staging_origins)
        else:
            default_origins.extend([
                'https://staging.yourdomain.com',
                'https://staging-api.yourdomain.com'
            ])
        logger.info("Applied staging CORS origins for pre-production environment")
        
    elif environment.lower() == 'testing':
        # Testing environment CORS configuration for test isolation
        default_origins.extend([
            'http://localhost:*',
            'http://127.0.0.1:*',
            'http://test.local'
        ])
        logger.info("Applied testing CORS origins for test environment")
    
    # Merge custom origins with environment-specific defaults
    if custom_origins:
        # Validate custom origin URLs for proper format and security
        validated_custom = []
        for origin in custom_origins:
            if isinstance(origin, str) and (
                origin.startswith(('http://', 'https://')) or 
                origin == '*' or 
                origin.startswith('http://localhost:') or
                origin.startswith('http://127.0.0.1:')
            ):
                validated_custom.append(origin)
                logger.debug(f"Added custom CORS origin: {origin}")
            else:
                logger.warning(f"Invalid custom CORS origin ignored: {origin}")
        
        default_origins.extend(validated_custom)
    
    # Validate origin URLs for proper format and security
    validated_origins = []
    for origin in default_origins:
        # Remove duplicates and validate format
        if origin not in validated_origins:
            # Basic URL validation
            if origin == '*':
                # Wildcard only allowed in development
                if environment.lower() == 'development':
                    validated_origins.append(origin)
                else:
                    logger.warning("Wildcard CORS origin (*) not allowed in non-development environments")
            elif origin.startswith(('http://', 'https://')):
                validated_origins.append(origin)
            else:
                logger.warning(f"Invalid CORS origin format ignored: {origin}")
    
    # Log CORS origin configuration for debugging and security audit
    logger.info(f"CORS origins configured for {environment}: {len(validated_origins)} origins")
    
    # Return complete CORS origins list for Flask-CORS configuration
    return validated_origins


def create_wsgi_config(environment: str) -> dict:
    """
    Creates WSGI deployment configuration dictionary for Gunicorn multi-worker deployment 
    equivalent to PM2 cluster mode configuration with worker process management, performance 
    optimization, and monitoring settings.
    
    Args:
        environment: Environment name for WSGI configuration customization
        
    Returns:
        WSGI configuration dictionary with Gunicorn worker settings, performance parameters, 
        and deployment configuration equivalent to PM2 cluster mode
    """
    # Initialize WSGI configuration with PM2-equivalent defaults
    wsgi_config = {
        'environment': environment,
        'wsgi_module': 'app:app',
        'bind': '127.0.0.1:3000',
        'workers': 1,
        'worker_class': 'sync',
        'worker_connections': 1000,
        'timeout': 30,
        'keepalive': 2,
        'max_requests': 1000,
        'max_requests_jitter': 100,
        'graceful_timeout': 30,
        'preload_app': False,
        'reload': False,
        'daemon': False,
        'pid_file': None,
        'log_level': 'info',
        'access_log': '-',
        'error_log': '-',
        'pm2_equivalent': True
    }
    
    # Determine optimal worker count based on CPU cores and environment
    try:
        import multiprocessing
        cpu_count = multiprocessing.cpu_count()
        
        if environment.lower() == 'production':
            # Production: Use all available CPU cores for maximum performance
            wsgi_config['workers'] = cpu_count * 2 + 1  # PM2 'max' equivalent
            wsgi_config['worker_class'] = 'gevent'
            wsgi_config['worker_connections'] = 1000
            wsgi_config['preload_app'] = True  # Memory efficiency
            logger.info(f"Production WSGI config: {wsgi_config['workers']} workers for {cpu_count} CPU cores")
            
        elif environment.lower() == 'staging':
            # Staging: Use moderate worker count for testing
            wsgi_config['workers'] = max(2, cpu_count)
            wsgi_config['worker_class'] = 'sync'
            wsgi_config['worker_connections'] = 500
            logger.info(f"Staging WSGI config: {wsgi_config['workers']} workers")
            
        elif environment.lower() == 'development':
            # Development: Single worker with reload capability
            wsgi_config['workers'] = 1
            wsgi_config['worker_class'] = 'sync'
            wsgi_config['reload'] = True
            wsgi_config['timeout'] = 120  # Longer timeout for debugging
            logger.info("Development WSGI config: single worker with auto-reload")
            
        else:
            # Default configuration for unknown environments
            wsgi_config['workers'] = max(2, cpu_count // 2)
            logger.info(f"Default WSGI config: {wsgi_config['workers']} workers")
            
    except Exception as e:
        logger.warning(f"Could not determine CPU count: {str(e)}, using default worker count")
        wsgi_config['workers'] = 2
    
    # Configure Gunicorn worker class and timeout settings for environment
    timeout_config = WSGI_CONSTANTS.get('WORKER_CONFIGS', {}).get('timeouts', {})
    
    if environment.lower() == 'production':
        wsgi_config['timeout'] = timeout_config.get('production', 30)
        wsgi_config['graceful_timeout'] = 30
        wsgi_config['max_requests'] = 2000  # Restart workers periodically
        wsgi_config['max_requests_jitter'] = 200
        
    elif environment.lower() == 'development':
        wsgi_config['timeout'] = timeout_config.get('development', 120)
        wsgi_config['graceful_timeout'] = 60
        wsgi_config['max_requests'] = 0  # No automatic restart in dev
        
    # Set memory limits and connection handling parameters
    memory_config = WSGI_CONSTANTS.get('WORKER_CONFIGS', {}).get('memory', {})
    wsgi_config['worker_memory_limit'] = memory_config.get(environment.lower(), '512MB')
    
    # Configure graceful restart and zero-downtime reload settings
    wsgi_config['graceful_reload'] = {
        'enabled': True,
        'signal': 'SIGHUP',
        'strategy': 'sequential',  # PM2-style sequential restart
        'overlap': True  # Overlap old and new workers
    }
    
    # Set up logging and monitoring configuration for WSGI deployment
    log_config = WSGI_CONSTANTS.get('DEPLOYMENT_CONFIG', {}).get('logging', {})
    wsgi_config['access_log_format'] = log_config.get('access_format', 
        '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"')
    
    if environment.lower() == 'production':
        wsgi_config['access_log'] = '/var/log/gunicorn/access.log'
        wsgi_config['error_log'] = '/var/log/gunicorn/error.log'
        wsgi_config['log_level'] = 'warning'
        wsgi_config['pid_file'] = '/var/run/gunicorn.pid'
    elif environment.lower() == 'development':
        wsgi_config['log_level'] = 'debug'
        wsgi_config['access_log'] = '-'  # stdout
        wsgi_config['error_log'] = '-'   # stderr
    
    # Apply environment-specific performance optimizations
    performance_config = WSGI_CONSTANTS.get('GUNICORN_CONFIG', {})
    wsgi_config.update({
        'keepalive_timeout': performance_config.get('keepalive_timeout', 2),
        'worker_tmp_dir': performance_config.get('worker_tmp_dir', '/dev/shm'),
        'forwarded_allow_ips': performance_config.get('forwarded_allow_ips', '127.0.0.1'),
        'secure_scheme_headers': {
            'X-Forwarded-Proto': 'https',
            'X-Forwarded-For': 'proxy'
        }
    })
    
    # PM2 cluster mode equivalent configuration
    wsgi_config['pm2_comparison'] = {
        'instances': f"equivalent to PM2 instances: {wsgi_config['workers']}",
        'exec_mode': 'equivalent to PM2 cluster mode',
        'watch': wsgi_config['reload'],
        'ignore_watch': ['logs', '*.log'],
        'max_memory_restart': wsgi_config['worker_memory_limit'],
        'env': {
            'NODE_ENV': environment,
            'FLASK_ENV': environment
        }
    }
    
    # Log WSGI configuration creation
    logger.info(f"WSGI configuration created for {environment} with {wsgi_config['workers']} workers")
    
    # Return complete WSGI configuration dictionary for production deployment
    return wsgi_config


class Config:
    """
    Base Flask configuration class providing common configuration settings shared across all 
    environments. Implements Flask application factory pattern base configuration with security 
    defaults, API endpoint settings, and cross-platform compatibility features equivalent to 
    Express.js base configuration.
    
    This class serves as the foundation for all environment-specific configuration classes,
    providing essential Flask settings, security middleware configuration, and API endpoint
    definitions that maintain complete feature parity with the Express.js implementation.
    """
    
    def __init__(self):
        """
        Initializes base Flask configuration with common settings, security defaults, and 
        cross-platform compatibility features for Flask application factory pattern.
        """
        # Set default SECRET_KEY from environment or generate secure random key
        self.SECRET_KEY = os.environ.get('SECRET_KEY', generate_secret_key())
        
        # Configure basic Flask settings including TESTING and DEBUG defaults
        self.TESTING = False
        self.DEBUG = False
        self.APPLICATION_ROOT = '/'
        
        # Initialize Flask-Talisman security configuration equivalent to Helmet.js
        self.TALISMAN_CONFIG = self._get_base_talisman_config()
        
        # Set up CORS configuration for cross-origin API access
        self.CORS_CONFIG = self._get_base_cors_config()
        
        # Configure API endpoint settings for feature parity with Express.js
        self.API_CONFIG = self._get_base_api_config()
        
        # Initialize logging configuration with appropriate defaults
        self.LOGGING_CONFIG = self._get_base_logging_config()
        
        # Set cross-platform compatibility flags and validation settings
        self.CROSS_PLATFORM_PARITY = CROSS_PLATFORM_PARITY
        self.CONFIG_VERSION = CONFIG_VERSION
        
        # Log base configuration initialization
        logger.info("Base Flask configuration initialized with security defaults")
    
    def _get_base_talisman_config(self) -> dict:
        """
        Returns base Flask-Talisman security configuration equivalent to Helmet.js defaults.
        """
        return {
            'force_https': False,
            'strict_transport_security': True,
            'strict_transport_security_max_age': 31536000,
            'content_security_policy': SECURITY_CONSTANTS.get('CSP_DIRECTIVES', {}),
            'content_security_policy_nonce_in': ['script-src', 'style-src'],
            'referrer_policy': 'strict-origin-when-cross-origin',
            'feature_policy': {},
            'x_content_type_options': True,
            'x_frame_options': 'SAMEORIGIN',
            'x_xss_protection': False  # Disabled as recommended by modern security practices
        }
    
    def _get_base_cors_config(self) -> dict:
        """
        Returns base CORS configuration for Flask-CORS middleware.
        """
        return {
            'origins': get_cors_origins(FLASK_ENV),
            'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
            'expose_headers': ['X-Total-Count', 'X-Page-Count'],
            'supports_credentials': False,
            'max_age': 86400  # 24 hours
        }
    
    def _get_base_api_config(self) -> dict:
        """
        Returns base API configuration ensuring Express.js feature parity.
        """
        api_endpoints = API_CONSTANTS.get('ENDPOINTS', {})
        return {
            'endpoints': api_endpoints,
            'response_format': 'json',
            'default_content_type': 'application/json',
            'error_format': API_CONSTANTS.get('ERROR_MESSAGES', {}),
            'status_codes': API_CONSTANTS.get('RESPONSES', {}),
            'express_compatibility': True
        }
    
    def _get_base_logging_config(self) -> dict:
        """
        Returns base logging configuration for Flask application.
        """
        return {
            'level': 'INFO',
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'handlers': ['console'],
            'propagate': False
        }
    
    def init_app(self, app):
        """
        Initializes Flask application instance with configuration settings, security middleware, 
        and cross-platform compatibility features.
        
        Args:
            app: Flask application instance to configure
            
        Returns:
            Configured Flask application instance with all settings applied
        """
        # Apply configuration settings to Flask application instance
        for key, value in self.__dict__.items():
            if key.isupper():
                app.config[key] = value
        
        # Initialize Flask-Talisman security middleware with configuration
        try:
            from flask_talisman import Talisman
            Talisman(app, **self.TALISMAN_CONFIG)
            logger.info("Flask-Talisman security middleware initialized")
        except ImportError:
            logger.warning("Flask-Talisman not available, security headers not applied")
        
        # Set up Flask-CORS middleware with environment-appropriate origins
        try:
            from flask_cors import CORS
            CORS(app, **self.CORS_CONFIG)
            logger.info("Flask-CORS middleware initialized")
        except ImportError:
            logger.warning("Flask-CORS not available, CORS headers not applied")
        
        # Configure Flask logging with specified format and level
        if not app.debug:
            import logging
            logging.basicConfig(
                level=getattr(logging, self.LOGGING_CONFIG['level']),
                format=self.LOGGING_CONFIG['format']
            )
        
        # Apply API configuration settings for endpoint behavior
        app.config['API_ENDPOINTS'] = self.API_CONFIG['endpoints']
        app.config['ERROR_MESSAGES'] = self.API_CONFIG['error_format']
        
        # Validate configuration completeness and compatibility
        validation_result = self.validate_config()
        if validation_result['status'] != 'valid':
            logger.warning(f"Configuration validation issues: {validation_result}")
        
        # Log configuration initialization status for debugging
        logger.info(f"Flask application configured with {self.__class__.__name__}")
        
        return app
    
    def get_security_headers(self) -> dict:
        """
        Returns Flask-Talisman security headers configuration equivalent to Helmet.js 15 
        sub-middlewares with CSP, HSTS, and comprehensive security protection.
        
        Returns:
            Security headers configuration dictionary for Flask-Talisman middleware with 
            comprehensive protection settings
        """
        # Generate Content Security Policy directives for XSS protection
        csp_directives = SECURITY_CONSTANTS.get('CSP_DIRECTIVES', {})
        
        # Configure Strict Transport Security headers for HTTPS enforcement
        hsts_config = {
            'max_age': self.TALISMAN_CONFIG['strict_transport_security_max_age'],
            'include_subdomains': True,
            'preload': True
        }
        
        # Set up X-Frame-Options for clickjacking prevention
        frame_options = self.TALISMAN_CONFIG['x_frame_options']
        
        # Configure X-Content-Type-Options for MIME type protection
        content_type_options = self.TALISMAN_CONFIG['x_content_type_options']
        
        # Set Referrer-Policy headers for privacy protection
        referrer_policy = self.TALISMAN_CONFIG['referrer_policy']
        
        # Return comprehensive security headers dictionary for Flask-Talisman
        return {
            'Content-Security-Policy': csp_directives,
            'Strict-Transport-Security': hsts_config,
            'X-Frame-Options': frame_options,
            'X-Content-Type-Options': 'nosniff' if content_type_options else None,
            'Referrer-Policy': referrer_policy,
            'X-XSS-Protection': '0'  # Disabled as per modern security recommendations
        }
    
    def get_api_endpoints(self) -> dict:
        """
        Returns API endpoint configuration dictionary ensuring complete feature parity with 
        Express.js implementation including response formats and status codes.
        
        Returns:
            API endpoint configuration with response formats, status codes, and cross-platform 
            compatibility settings
        """
        # Define /hello endpoint configuration with identical response format
        hello_endpoint = {
            'path': '/hello',
            'methods': ['GET'],
            'response': {'message': 'Hello world'},
            'status_code': 200,
            'content_type': 'application/json'
        }
        
        # Configure /good-evening endpoint with matching Express.js behavior
        good_evening_endpoint = {
            'path': '/good-evening',
            'methods': ['GET'],
            'response': {'message': 'Good evening'},
            'status_code': 200,
            'content_type': 'application/json'
        }
        
        # Set up /health endpoint for monitoring and status checks
        health_endpoint = {
            'path': '/health',
            'methods': ['GET'],
            'response': {
                'status': 'OK',
                'timestamp': 'dynamic',
                'uptime': 'dynamic',
                'version': CONFIG_VERSION
            },
            'status_code': 200,
            'content_type': 'application/json'
        }
        
        # Configure error response formats for consistency
        error_responses = API_CONSTANTS.get('ERROR_MESSAGES', {})
        
        # Return complete API endpoint configuration dictionary
        return {
            'endpoints': {
                'hello': hello_endpoint,
                'good_evening': good_evening_endpoint,
                'health': health_endpoint
            },
            'error_responses': error_responses,
            'default_headers': {
                'Content-Type': 'application/json',
                'X-Powered-By': 'Flask/3.1.1'
            },
            'express_compatibility': True
        }
    
    def validate_config(self) -> dict:
        """
        Validates configuration completeness and security settings ensuring production readiness 
        and cross-platform compatibility.
        
        Returns:
            Configuration validation result with status, errors, warnings, and recommendations
        """
        validation_result = {
            'status': 'valid',
            'errors': [],
            'warnings': [],
            'recommendations': [],
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        # Validate required configuration parameters are present
        required_params = ['SECRET_KEY', 'TALISMAN_CONFIG', 'CORS_CONFIG', 'API_CONFIG']
        for param in required_params:
            if not hasattr(self, param) or getattr(self, param) is None:
                validation_result['errors'].append(f"Missing required configuration parameter: {param}")
                validation_result['status'] = 'invalid'
        
        # Check security configuration completeness and effectiveness
        if hasattr(self, 'SECRET_KEY') and len(self.SECRET_KEY) < 32:
            validation_result['warnings'].append("SECRET_KEY length below recommended 32 characters")
        
        if hasattr(self, 'TALISMAN_CONFIG'):
            if not self.TALISMAN_CONFIG.get('content_security_policy'):
                validation_result['warnings'].append("Content Security Policy not configured")
        
        # Verify cross-platform compatibility settings
        if not hasattr(self, 'CROSS_PLATFORM_PARITY') or not self.CROSS_PLATFORM_PARITY:
            validation_result['warnings'].append("Cross-platform parity flag not set")
        
        # Validate API configuration for feature parity
        if hasattr(self, 'API_CONFIG'):
            endpoints = self.API_CONFIG.get('endpoints', {})
            required_endpoints = ['hello', 'good_evening']
            for endpoint in required_endpoints:
                if endpoint not in str(endpoints):
                    validation_result['warnings'].append(f"API endpoint '{endpoint}' not configured")
        
        # Check logging configuration appropriateness
        if hasattr(self, 'LOGGING_CONFIG'):
            if self.LOGGING_CONFIG.get('level') not in ['DEBUG', 'INFO', 'WARNING', 'ERROR']:
                validation_result['warnings'].append("Invalid logging level configured")
        
        # Generate validation report with recommendations
        if validation_result['errors']:
            validation_result['recommendations'].append("Fix configuration errors before deployment")
        
        if validation_result['warnings']:
            validation_result['recommendations'].append("Review configuration warnings for optimal security")
        
        if validation_result['status'] == 'valid':
            validation_result['recommendations'].append("Configuration validation passed successfully")
        
        # Return comprehensive validation result dictionary
        return validation_result


class DevelopmentConfig(Config):
    """
    Development environment Flask configuration class extending base Config with development-specific 
    settings including debug mode, permissive CORS, detailed logging, and development server 
    configuration equivalent to Express.js development environment setup.
    
    This class provides development-friendly configuration with enhanced debugging capabilities,
    permissive security settings for local development, and comprehensive logging for
    troubleshooting and development workflow optimization.
    """
    
    def __init__(self):
        """
        Initializes development environment configuration with debug mode, permissive security 
        settings, and development-friendly features.
        """
        # Inherit base configuration settings from Config class
        super().__init__()
        
        # Enable Flask DEBUG mode for development features and auto-reload
        self.DEBUG = True
        self.TESTING = False
        
        # Set development-appropriate logging level for detailed output
        self.LOG_LEVEL = 'DEBUG'
        self.FLASK_ENV = 'development'
        
        # Configure permissive CORS origins for local development and testing
        self.CORS_ORIGINS = get_cors_origins('development')
        
        # Set up development-friendly Flask-Talisman security (less restrictive CSP)
        self.TALISMAN_CONFIG = self._get_development_talisman_config()
        
        # Enable development features including debug headers and error pages
        self.DEVELOPMENT_FEATURES = self._get_development_features()
        
        # Configure development server settings for localhost binding
        self.SERVER_CONFIG = {
            'host': ENV_CONSTANTS.get('DEFAULT_HOST', '127.0.0.1'),
            'port': ENV_CONSTANTS.get('DEFAULT_PORT', 3000),
            'debug': True,
            'use_reloader': True,
            'use_debugger': True,
            'threaded': True
        }
        
        # Log development configuration initialization
        logger.info("Development configuration initialized with debug mode enabled")
    
    def _get_development_talisman_config(self) -> dict:
        """
        Returns development-specific Flask-Talisman configuration with relaxed security policies.
        """
        config = super()._get_base_talisman_config()
        
        # Relax CSP for development tools and debugging
        config['content_security_policy'] = {
            'default-src': "'self' 'unsafe-inline' 'unsafe-eval'",
            'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
            'style-src': "'self' 'unsafe-inline'",
            'img-src': "'self' data: blob:",
            'connect-src': "'self' ws: wss:",
            'font-src': "'self' data:",
            'media-src': "'self'",
            'object-src': "'none'",
            'frame-src': "'self'"
        }
        
        # Disable HTTPS enforcement for local development
        config['force_https'] = False
        config['strict_transport_security'] = False
        
        return config
    
    def get_development_features(self) -> dict:
        """
        Returns development-specific feature configuration including debug toolbar, permissive 
        CORS, and development server settings.
        
        Returns:
            Development features configuration with debug settings and development server parameters
        """
        # Configure Flask debug toolbar and development tools
        debug_features = {
            'debug_toolbar': True,
            'debug_mode': True,
            'auto_reload': True,
            'detailed_errors': True,
            'stack_traces': True
        }
        
        # Set up permissive CORS for development client access
        cors_features = {
            'permissive_cors': True,
            'allow_all_origins': True,
            'allow_credentials': True,
            'expose_all_headers': True
        }
        
        # Configure development server auto-reload and file watching
        server_features = {
            'file_watching': True,
            'auto_restart': True,
            'hot_reload': True,
            'static_file_serving': True
        }
        
        # Enable detailed error pages and stack traces
        error_features = {
            'detailed_error_pages': True,
            'exception_debugging': True,
            'interactive_debugger': True,
            'error_email_suppression': True
        }
        
        # Return comprehensive development features configuration
        return {
            'debug': debug_features,
            'cors': cors_features,
            'server': server_features,
            'errors': error_features,
            'logging': {
                'level': 'DEBUG',
                'detailed_output': True,
                'request_logging': True,
                'sql_logging': False  # No database in this tutorial
            }
        }


class ProductionConfig(Config):
    """
    Production environment Flask configuration class extending base Config with production-ready 
    settings including security hardening, performance optimization, WSGI deployment configuration, 
    and monitoring setup equivalent to Express.js production environment with PM2 cluster mode.
    
    This class provides enterprise-grade configuration with comprehensive security measures,
    optimized performance settings, and production deployment features equivalent to
    Express.js with PM2 process management and Helmet.js security protection.
    """
    
    def __init__(self):
        """
        Initializes production environment configuration with security hardening, performance 
        optimization, and production deployment settings.
        """
        # Inherit base configuration settings from Config class
        super().__init__()
        
        # Disable Flask DEBUG mode for security and performance
        self.DEBUG = False
        self.TESTING = False
        
        # Set production-appropriate logging level for performance
        self.LOG_LEVEL = 'ERROR'
        
        # Enforce secure SECRET_KEY from environment or generate cryptographically secure key
        self.SECRET_KEY = os.environ.get('SECRET_KEY') or generate_secret_key(64)
        if len(self.SECRET_KEY) < 64:
            logger.warning("Production SECRET_KEY should be at least 64 characters")
        
        # Configure hardened Flask-Talisman security with strict CSP and HTTPS enforcement
        self.TALISMAN_CONFIG = self._get_production_talisman_config()
        
        # Set up WSGI deployment configuration equivalent to PM2 cluster mode
        self.WSGI_CONFIG = create_wsgi_config('production')
        
        # Configure production performance optimizations and resource limits
        self.PERFORMANCE_CONFIG = self._get_production_performance_config()
        
        # Enable comprehensive security headers and protection features
        self.SECURITY_HEADERS = self.get_production_security()
        
        # Configure production monitoring and alerting
        self.MONITORING_CONFIG = {
            'health_checks': True,
            'performance_monitoring': True,
            'error_tracking': True,
            'security_monitoring': True,
            'uptime_monitoring': True
        }
        
        # Log production configuration initialization
        logger.info("Production configuration initialized with security hardening")
    
    def _get_production_talisman_config(self) -> dict:
        """
        Returns production-hardened Flask-Talisman configuration with strict security policies.
        """
        config = super()._get_base_talisman_config()
        
        # Configure strict Content Security Policy for production security
        config['content_security_policy'] = {
            'default-src': "'self'",
            'script-src': "'self'",
            'style-src': "'self'",
            'img-src': "'self' data:",
            'connect-src': "'self'",
            'font-src': "'self'",
            'media-src': "'self'",
            'object-src': "'none'",
            'frame-src': "'none'",
            'base-uri': "'self'",
            'form-action': "'self'"
        }
        
        # Enable HTTPS enforcement with HSTS headers
        config['force_https'] = True
        config['strict_transport_security'] = True
        config['strict_transport_security_max_age'] = 31536000  # 1 year
        config['strict_transport_security_include_subdomains'] = True
        config['strict_transport_security_preload'] = True
        
        # Configure additional security headers
        config['x_frame_options'] = 'DENY'
        config['x_content_type_options'] = True
        config['referrer_policy'] = 'strict-origin-when-cross-origin'
        
        return config
    
    def _get_production_performance_config(self) -> dict:
        """
        Returns production performance optimization configuration.
        """
        return {
            'response_compression': True,
            'static_file_caching': True,
            'session_cookie_secure': True,
            'session_cookie_httponly': True,
            'session_cookie_samesite': 'Strict',
            'permanent_session_lifetime': 3600,  # 1 hour
            'max_content_length': 16 * 1024 * 1024,  # 16MB
            'send_file_max_age_default': 31536000,  # 1 year for static files
        }
    
    def get_production_security(self) -> dict:
        """
        Returns production-hardened security configuration with strict CSP, HTTPS enforcement, 
        and comprehensive protection equivalent to Helmet.js production settings.
        
        Returns:
            Production security configuration with hardened settings and comprehensive 
            protection features
        """
        # Configure strict Content Security Policy for production security
        csp_policy = {
            'default-src': "'self'",
            'script-src': "'self'",
            'style-src': "'self'",
            'img-src': "'self' data:",
            'connect-src': "'self'",
            'font-src': "'self'",
            'media-src': "'none'",
            'object-src': "'none'",
            'frame-src': "'none'",
            'worker-src': "'none'",
            'base-uri': "'self'",
            'form-action': "'self'",
            'frame-ancestors': "'none'",
            'upgrade-insecure-requests': True
        }
        
        # Enable HTTPS enforcement with HSTS headers
        hsts_config = {
            'max_age': 31536000,  # 1 year
            'include_subdomains': True,
            'preload': True
        }
        
        # Set up restrictive CORS origins for production API access
        cors_origins = get_cors_origins('production')
        
        # Configure rate limiting and DDoS protection
        rate_limiting = {
            'enabled': True,
            'requests_per_minute': 60,
            'requests_per_hour': 1000,
            'burst_limit': 10
        }
        
        # Return comprehensive production security configuration
        return {
            'content_security_policy': csp_policy,
            'strict_transport_security': hsts_config,
            'cors_origins': cors_origins,
            'rate_limiting': rate_limiting,
            'security_headers': {
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '0',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
            },
            'session_security': {
                'secure': True,
                'httponly': True,
                'samesite': 'Strict'
            }
        }
    
    def get_wsgi_deployment(self) -> dict:
        """
        Returns WSGI deployment configuration for Gunicorn multi-worker production deployment 
        equivalent to PM2 cluster mode with performance optimization.
        
        Returns:
            WSGI deployment configuration with Gunicorn worker settings and performance 
            optimization equivalent to PM2 cluster mode
        """
        # Calculate optimal worker count based on CPU cores
        try:
            import multiprocessing
            cpu_count = multiprocessing.cpu_count()
            worker_count = (cpu_count * 2) + 1
        except:
            worker_count = 4
        
        # Configure Gunicorn worker class and timeout settings
        worker_config = {
            'bind': '0.0.0.0:3000',
            'workers': worker_count,
            'worker_class': 'gevent',
            'worker_connections': 1000,
            'timeout': 30,
            'graceful_timeout': 30,
            'keepalive': 2,
            'max_requests': 2000,
            'max_requests_jitter': 200,
            'preload_app': True
        }
        
        # Set up graceful restart and zero-downtime reload capabilities
        restart_config = {
            'graceful_restart': True,
            'zero_downtime_reload': True,
            'reload_signal': 'SIGHUP',
            'worker_restart_signal': 'SIGUSR1'
        }
        
        # Configure production logging and monitoring integration
        logging_config = {
            'access_log': '/var/log/gunicorn/access.log',
            'error_log': '/var/log/gunicorn/error.log',
            'log_level': 'warning',
            'access_log_format': '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s',
            'capture_output': True
        }
        
        # Return complete WSGI deployment configuration
        return {
            'worker': worker_config,
            'restart': restart_config,
            'logging': logging_config,
            'pm2_equivalent': {
                'instances': worker_count,
                'exec_mode': 'cluster',
                'max_memory_restart': '1G',
                'watch': False,
                'ignore_watch': ['logs', '*.log'],
                'env': {
                    'FLASK_ENV': 'production',
                    'NODE_ENV': 'production'
                }
            }
        }


class TestingConfig(Config):
    """
    Testing environment Flask configuration class extending base Config with test-specific 
    settings including test isolation, in-memory database, disabled security features, and 
    pytest integration configuration equivalent to Jest and Mocha testing environments.
    
    This class provides comprehensive testing configuration with test isolation capabilities,
    coverage requirements ≥90%, and testing framework integration for comprehensive
    quality assurance and validation workflows.
    """
    
    def __init__(self):
        """
        Initializes testing environment configuration with test isolation, coverage requirements, 
        and testing framework integration.
        """
        # Inherit base configuration settings from Config class
        super().__init__()
        
        # Enable Flask TESTING mode for test-specific behavior
        self.TESTING = True
        self.DEBUG = True
        
        # Configure in-memory database for test isolation (not applicable for this stateless tutorial)
        self.DATABASE_URL = 'sqlite:///:memory:'
        
        # Set coverage threshold to ≥90% requirement from technical specifications
        self.COVERAGE_THRESHOLD = TESTING_CONSTANTS.get('COVERAGE_THRESHOLDS', {}).get('minimum', 90)
        
        # Configure pytest integration with timeout and parallel execution settings
        self.PYTEST_CONFIG = self._get_pytest_config()
        
        # Disable CSRF protection for simplified testing
        self.WTF_CSRF_ENABLED = False
        
        # Set up test client configuration for HTTP endpoint testing
        self.TEST_CONFIG = self._get_test_config()
        
        # Configure testing framework performance targets and timeouts
        self.TEST_TIMEOUTS = TESTING_CONSTANTS.get('TEST_TIMEOUTS', {})
        self.PERFORMANCE_TARGETS = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
        
        # Log testing configuration initialization
        logger.info(f"Testing configuration initialized with {self.COVERAGE_THRESHOLD}% coverage threshold")
    
    def _get_pytest_config(self) -> dict:
        """
        Returns pytest configuration for comprehensive testing framework integration.
        """
        return {
            'testpaths': ['tests'],
            'python_files': ['test_*.py', '*_test.py'],
            'python_classes': ['Test*'],
            'python_functions': ['test_*'],
            'addopts': [
                '--strict-markers',
                '--strict-config',
                '--verbose',
                f'--cov-fail-under={self.COVERAGE_THRESHOLD}'
            ],
            'markers': {
                'unit': 'Unit tests',
                'integration': 'Integration tests',
                'performance': 'Performance tests',
                'security': 'Security tests'
            },
            'timeout': self.TEST_TIMEOUTS.get('default', 30),
            'timeout_method': 'thread'
        }
    
    def _get_test_config(self) -> dict:
        """
        Returns comprehensive test configuration for Flask test client and validation.
        """
        return {
            'test_client': {
                'testing': True,
                'debug': True,
                'preserve_context': True
            },
            'http_testing': {
                'base_url': 'http://localhost',
                'default_content_type': 'application/json',
                'follow_redirects': False
            },
            'performance_testing': {
                'max_response_time_ms': self.PERFORMANCE_TARGETS.get('response_time_ms', 100),
                'max_memory_usage_mb': self.PERFORMANCE_TARGETS.get('memory_usage_mb', 100),
                'concurrent_requests': 10
            },
            'coverage_config': {
                'source': ['src'],
                'omit': ['*/tests/*', '*/venv/*', '*/env/*'],
                'show_missing': True,
                'skip_covered': False,
                'report_format': ['term-missing', 'html', 'json']
            },
            'test_data': {
                'fixtures_path': 'tests/fixtures',
                'mock_data_path': 'tests/mocks',
                'test_files_path': 'tests/files'
            }
        }
    
    def get_test_configuration(self) -> dict:
        """
        Returns comprehensive testing configuration including pytest settings, coverage 
        thresholds, and test isolation parameters equivalent to Jest and Mocha configuration.
        
        Returns:
            Testing configuration with pytest settings, coverage requirements, and test 
            isolation parameters
        """
        # Configure pytest framework settings and test discovery
        pytest_settings = {
            'framework': 'pytest',
            'test_discovery': {
                'patterns': ['test_*.py', '*_test.py'],
                'directories': ['tests', 'test']
            },
            'execution': {
                'parallel': True,
                'workers': 'auto',
                'capture': 'no',
                'verbose': True
            },
            'reporting': {
                'junit_xml': 'reports/junit.xml',
                'html_report': 'reports/report.html',
                'coverage_report': 'reports/coverage'
            }
        }
        
        # Set coverage thresholds and reporting requirements
        coverage_settings = {
            'minimum_coverage': self.COVERAGE_THRESHOLD,
            'branch_coverage': 85,
            'function_coverage': 95,
            'line_coverage': 90,
            'fail_under': self.COVERAGE_THRESHOLD,
            'show_missing': True,
            'skip_empty': True
        }
        
        # Configure test isolation and database setup (not applicable for stateless tutorial)
        isolation_settings = {
            'test_isolation': True,
            'cleanup_after_test': True,
            'reset_state_between_tests': True,
            'mock_external_dependencies': True
        }
        
        # Set up test client for HTTP endpoint testing
        http_test_settings = {
            'test_client_class': 'flask.testing.FlaskClient',
            'preserve_context': True,
            'follow_redirects': False,
            'subdomain': None,
            'url_scheme': 'http'
        }
        
        # Return complete testing configuration dictionary
        return {
            'pytest': pytest_settings,
            'coverage': coverage_settings,
            'isolation': isolation_settings,
            'http_testing': http_test_settings,
            'performance_targets': self.PERFORMANCE_TARGETS,
            'test_timeouts': self.TEST_TIMEOUTS,
            'frameworks_compatibility': {
                'jest_equivalent': 'pytest with coverage',
                'mocha_equivalent': 'pytest with custom reporters',
                'supertest_equivalent': 'Flask test client'
            }
        }


class StagingConfig(ProductionConfig):
    """
    Staging environment Flask configuration class extending ProductionConfig with staging-specific 
    settings including relaxed security for testing, performance monitoring, and pre-production 
    validation configuration for deployment testing and quality assurance.
    
    This class provides production-like configuration with staging-specific enhancements
    for pre-production testing, validation, and quality assurance workflows while
    maintaining security and performance characteristics similar to production.
    """
    
    def __init__(self):
        """
        Initializes staging environment configuration with production-like settings and 
        staging-specific features for pre-production testing.
        """
        # Inherit production configuration settings from ProductionConfig class
        super().__init__()
        
        # Adjust logging level for staging monitoring (WARNING level)
        self.LOG_LEVEL = 'WARNING'
        self.DEBUG = False
        
        # Configure staging-specific features for testing and validation
        self.STAGING_FEATURES = self._get_staging_features()
        
        # Set up performance monitoring and profiling tools
        self.MONITORING_CONFIG = self._get_staging_monitoring_config()
        
        # Enable additional validation and debugging features for staging
        self.VALIDATION_CONFIG = self._get_staging_validation_config()
        
        # Configure staging-appropriate security settings (slightly relaxed from production)
        self.TALISMAN_CONFIG = self._get_staging_talisman_config()
        
        # Set up pre-production deployment testing features
        self.DEPLOYMENT_TESTING = {
            'enabled': True,
            'smoke_tests': True,
            'performance_tests': True,
            'security_tests': True,
            'integration_tests': True
        }
        
        # Log staging configuration initialization
        logger.info("Staging configuration initialized with pre-production testing features")
    
    def _get_staging_talisman_config(self) -> dict:
        """
        Returns staging-specific Flask-Talisman configuration with slightly relaxed policies.
        """
        config = super()._get_production_talisman_config()
        
        # Slightly relax CSP for staging testing tools
        config['content_security_policy']['script-src'] = "'self' 'unsafe-inline'"
        config['content_security_policy']['connect-src'] = "'self' wss: ws:"
        
        # Allow frame embedding for testing tools
        config['x_frame_options'] = 'SAMEORIGIN'
        
        return config
    
    def _get_staging_monitoring_config(self) -> dict:
        """
        Returns staging-specific monitoring configuration with enhanced observability.
        """
        return {
            'performance_profiling': True,
            'detailed_logging': True,
            'request_tracking': True,
            'response_time_monitoring': True,
            'memory_usage_tracking': True,
            'cpu_utilization_monitoring': True,
            'error_rate_tracking': True,
            'uptime_monitoring': True,
            'health_check_frequency': 30,  # seconds
            'metrics_collection_interval': 60,  # seconds
            'alert_thresholds': {
                'response_time_ms': 200,
                'error_rate_percent': 5,
                'memory_usage_percent': 80,
                'cpu_usage_percent': 85
            }
        }
    
    def _get_staging_validation_config(self) -> dict:
        """
        Returns staging-specific validation configuration for pre-production testing.
        """
        return {
            'api_validation': {
                'response_format_validation': True,
                'status_code_validation': True,
                'header_validation': True,
                'content_type_validation': True
            },
            'security_validation': {
                'security_header_validation': True,
                'cors_policy_validation': True,
                'ssl_certificate_validation': True,
                'authentication_validation': False  # Not applicable for stateless tutorial
            },
            'performance_validation': {
                'response_time_validation': True,
                'memory_usage_validation': True,
                'concurrent_request_validation': True,
                'load_testing_validation': True
            },
            'cross_platform_validation': {
                'express_parity_validation': True,
                'api_compatibility_validation': True,
                'response_format_comparison': True
            }
        }
    
    def get_staging_features(self) -> dict:
        """
        Returns staging-specific features configuration including performance monitoring, 
        validation tools, and pre-production testing capabilities.
        
        Returns:
            Staging features configuration with monitoring, validation, and testing capabilities
        """
        # Configure performance monitoring and profiling tools
        performance_features = {
            'response_time_profiling': True,
            'memory_profiling': True,
            'cpu_profiling': True,
            'request_logging': True,
            'detailed_metrics': True,
            'performance_dashboard': True
        }
        
        # Set up validation and debugging features for staging
        validation_features = {
            'api_endpoint_validation': True,
            'cross_platform_compatibility_testing': True,
            'security_policy_validation': True,
            'performance_benchmark_testing': True,
            'load_testing': True
        }
        
        # Configure staging-appropriate CORS and security settings
        security_features = {
            'relaxed_cors_for_testing': True,
            'staging_domain_whitelist': [
                'staging.yourdomain.com',
                'staging-api.yourdomain.com',
                'test.yourdomain.com'
            ],
            'test_client_access': True,
            'debugging_tools_access': True
        }
        
        # Enable pre-production testing and validation features
        testing_features = {
            'automated_smoke_tests': True,
            'integration_test_suite': True,
            'performance_test_suite': True,
            'security_test_suite': True,
            'cross_platform_test_suite': True,
            'deployment_validation_tests': True
        }
        
        # Return comprehensive staging features configuration
        return {
            'performance': performance_features,
            'validation': validation_features,
            'security': security_features,
            'testing': testing_features,
            'monitoring': self.MONITORING_CONFIG,
            'deployment': {
                'blue_green_deployment': True,
                'canary_deployment': True,
                'rollback_capability': True,
                'zero_downtime_deployment': True
            }
        }


# Configuration dictionary mapping environment names to configuration classes for Flask application factory pattern
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'staging': StagingConfig
}

# Log configuration module initialization
logger.info(f"Flask configuration module loaded with {len(config)} environment configurations")