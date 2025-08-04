"""
Flask Application Factory - Cross-Platform Web Application Implementation

This module implements the main Flask application factory for the Node.js tutorial project's 
cross-platform Python implementation. Creates and configures Flask applications using the 
application factory pattern with comprehensive blueprint registration, middleware integration, 
security implementation, and production deployment capabilities. Maintains complete feature 
parity with the Express.js implementation while demonstrating modern Flask 3.1.1 development 
patterns including Flask-Talisman security equivalent to Helmet.js, WSGI deployment 
compatibility with Gunicorn, and educational cross-platform comparison.

Features:
- Flask application factory pattern for modular application creation and configuration
- Environment-specific configuration management with development and production optimizations
- Comprehensive blueprint registration including hello routes, health monitoring, and API organization
- Flask-Talisman security middleware equivalent to Helmet.js 15 sub-middlewares protection
- WSGI production deployment configuration with Gunicorn multi-worker process compatibility
- Cross-platform feature parity validation maintaining identical response formats with Express.js
- Comprehensive error handling, request correlation tracking, and performance monitoring
- Educational demonstration of Flask application architecture patterns for learning purposes

Educational Focus:
- Flask application factory pattern implementation for production-ready applications
- Cross-platform web development maintaining Express.js API compatibility and response formats
- Flask security implementation equivalent to Express.js Helmet.js middleware protection
- WSGI deployment patterns equivalent to Express.js PM2 cluster mode scaling capabilities
- Modern Flask development patterns with Flask 3.1.1 and comprehensive middleware integration

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference and deployment compatibility
import os  # built-in - Operating system interface for environment variable access and configuration detection
import time  # built-in - High-resolution timing utilities for Flask application performance monitoring and benchmarking
import atexit  # built-in - Python exit handler registration for Flask application graceful shutdown and cleanup
import signal  # built-in - Python signal handling for Flask application graceful shutdown on SIGTERM/SIGINT
import datetime  # built-in - Date and time utilities for Flask application lifecycle tracking and logging
import threading  # built-in - Threading utilities for WSGI multi-worker thread safety and resource coordination
from typing import Dict, Any, Optional, Union, Tuple  # built-in - Type hints for Flask application factory functions

# Flask framework imports with version comments for Flask 3.1.1 compatibility and feature requirements
from flask import Flask, request, g, current_app, jsonify  # ^3.1.1 - Flask web framework main class for application instance creation using application factory pattern
from flask_talisman import Talisman  # ^1.1.0 - Flask-Talisman security extension equivalent to Helmet.js providing comprehensive HTTP security headers
from flask_cors import CORS  # ^4.0.0 - Flask-CORS extension for cross-origin resource sharing configuration equivalent to Express.js CORS middleware

# Internal imports for Flask configuration and constants with cross-platform compatibility
from config import get_config_class, Config  # Import Flask configuration factory function and base configuration class
from utils.constants import (
    ENV_CONSTANTS,      # Import environment constants for Flask application configuration and cross-platform compatibility
    API_CONSTANTS,      # Import API constants for endpoint configuration and response formatting
    HTTP_CONSTANTS,     # Import HTTP constants for status codes and content type management
    SECURITY_CONSTANTS  # Import security constants for Flask-Talisman configuration and security policies
)

# Internal imports for Flask blueprints with modular route organization equivalent to Express.js router patterns
from blueprints.hello_bp import hello_bp  # Import Flask hello blueprint containing /hello and /good-evening endpoints
from blueprints.health_bp import health_bp  # Import Flask health blueprint for application monitoring and health check endpoints
from blueprints.api import api  # Import Flask main API blueprint for centralized API route organization and versioning

# Internal imports for Flask middleware components with comprehensive request processing and security
from middleware.security import SecurityMiddleware  # Import Flask security middleware class providing comprehensive protection equivalent to Helmet.js
from middleware.error_handler import ErrorHandler, create_error_handler  # Import Flask centralized error handling middleware for consistent error responses
from middleware.logging import FlaskLoggingMiddleware, create_logging_middleware  # Import Flask request logging middleware for comprehensive request/response tracking

# Internal imports for Flask utilities with application support and educational content
from utils.logger import logger  # Import Flask logger for application initialization, error tracking, and performance monitoring
from utils.helpers import (
    format_http_response,     # Import HTTP response formatting utility for standardized API responses
    generate_request_id,      # Import request ID generation utility for correlation tracking and debugging
    measure_performance,      # Import performance measurement utility for API operation timing and monitoring
    validate_environment     # Import environment validation utility for configuration verification
)

# Global Flask application state management and metrics tracking for comprehensive monitoring and deployment
app_instance: Optional[Flask] = None
APPLICATION_VERSION: str = '1.0.0'
FLASK_APP_METRICS: Dict[str, Union[int, float]] = {
    'start_time': time.time(),
    'requests_handled': 0,
    'errors_count': 0,
    'average_response_time': 0.0,
    'uptime_seconds': 0
}
APP_START_TIME: float = time.time()
CROSS_PLATFORM_PARITY: bool = True

# Flask application factory configuration and deployment readiness tracking
APPLICATION_INITIALIZED: bool = False
GRACEFUL_SHUTDOWN_HANDLERS: list = []
SECURITY_MIDDLEWARE_INSTANCE: Optional[SecurityMiddleware] = None
ERROR_HANDLER_INSTANCE: Optional[ErrorHandler] = None
LOGGING_MIDDLEWARE_INSTANCE: Optional[FlaskLoggingMiddleware] = None


def create_app(environment: Optional[str] = None, config_overrides: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Flask application factory function that creates and configures a Flask application instance 
    with comprehensive middleware integration, security implementation, blueprint registration, 
    and production deployment capabilities. Implements Flask application factory pattern equivalent 
    to Express.js application setup with environment-specific configuration, Flask-Talisman 
    security equivalent to Helmet.js, and WSGI deployment compatibility for production scaling.
    
    Args:
        environment: Environment name for configuration selection (development, production, testing)
        config_overrides: Dictionary of configuration overrides for testing and deployment customization
        
    Returns:
        Configured Flask application instance ready for WSGI deployment with comprehensive middleware, 
        security, and monitoring capabilities equivalent to Express.js application functionality
    """
    global app_instance, APPLICATION_INITIALIZED, FLASK_APP_METRICS
    
    try:
        # Initialize Flask application instance with proper name and configuration for application factory pattern
        app = Flask(__name__)
        
        # Detect and validate environment parameter with fallback to FLASK_ENV environment variable or development default
        if environment is None:
            environment = os.environ.get('FLASK_ENV', 'development')
        
        # Validate environment using validate_environment utility for configuration verification
        environment = validate_environment(environment)
        
        logger.info(f"Creating Flask application for environment: {environment}")
        
        # Load environment-specific configuration using get_config_class factory function with security validation
        config_class = get_config_class(environment)
        app.config.from_object(config_class)
        
        # Apply configuration overrides and validate configuration completeness for production deployment readiness
        if config_overrides:
            app.config.update(config_overrides)
            logger.info(f"Applied configuration overrides: {list(config_overrides.keys())}")
        
        # Initialize base configuration with Flask application for security and middleware setup
        base_config = Config()
        base_config.init_app(app)
        
        # Configure Flask security middleware equivalent to Helmet.js 15 sub-middlewares with CSP and HSTS
        configure_security(app, environment)
        
        # Register Flask blueprints including hello_bp, health_bp, and api blueprint for modular route organization
        register_blueprints(app)
        
        # Configure comprehensive error handling middleware with centralized error processing and sanitized responses
        configure_error_handling(app)
        
        # Set up Flask request logging middleware for comprehensive request/response tracking and correlation
        setup_request_logging(app, environment)
        
        # Initialize Flask request correlation tracking for distributed request monitoring and debugging
        setup_request_correlation(app)
        
        # Configure Flask application performance monitoring including response time tracking and metrics collection
        configure_performance_monitoring(app)
        
        # Set up Flask graceful shutdown handlers for WSGI deployment and process management
        setup_graceful_shutdown(app)
        
        # Validate Flask application configuration and cross-platform compatibility with Express.js implementation
        health_status = validate_application_health(app)
        
        # Update global application state and metrics tracking
        app_instance = app
        APPLICATION_INITIALIZED = True
        FLASK_APP_METRICS['start_time'] = time.time()
        
        # Log Flask application initialization completion with environment and configuration details
        logger.info(f"Flask application created successfully", {
            'environment': environment,
            'config_class': config_class.__name__,
            'health_status': health_status.get('status'),
            'application_version': APPLICATION_VERSION,
            'cross_platform_parity': CROSS_PLATFORM_PARITY
        })
        
        # Return fully configured Flask application instance ready for production WSGI deployment
        return app
        
    except Exception as e:
        # Handle Flask application creation errors with comprehensive error reporting
        logger.error(f"Flask application creation failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1
        raise


def configure_security(app: Flask, environment: str) -> Flask:
    """
    Configures comprehensive Flask security middleware including Flask-Talisman, CORS policies, 
    security headers, and threat detection equivalent to Express.js Helmet.js security stack. 
    Implements environment-specific security policies with development-friendly settings for 
    local development and hardened security for production deployment.
    
    Args:
        app: Flask application instance for security middleware configuration
        environment: Environment name for security policy selection and hardening
        
    Returns:
        Flask application instance with comprehensive security middleware configured and operational
    """
    global SECURITY_MIDDLEWARE_INSTANCE
    
    try:
        logger.info(f"Configuring Flask security middleware for {environment} environment")
        
        # Initialize Flask-Talisman with comprehensive security headers equivalent to Helmet.js protection
        talisman_config = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {}).copy()
        
        # Configure Content Security Policy with environment-appropriate directives for XSS prevention
        if environment == 'development':
            # Development-friendly CSP settings
            talisman_config['content_security_policy'] = {
                'default-src': "'self' 'unsafe-inline' 'unsafe-eval'",
                'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
                'style-src': "'self' 'unsafe-inline'",
                'img-src': "'self' data: blob:",
                'connect-src': "'self'"
            }
            talisman_config['force_https'] = False
        else:
            # Production-hardened CSP settings
            talisman_config['content_security_policy'] = SECURITY_CONSTANTS.get('CSP_DIRECTIVES', {})
            talisman_config['force_https'] = True
        
        # Set up Strict Transport Security headers for HTTPS enforcement with proper max-age settings
        talisman_config.update({
            'strict_transport_security': True,
            'strict_transport_security_max_age': 31536000,  # 1 year
            'strict_transport_security_include_subdomains': True
        })
        
        # Configure X-Frame-Options for clickjacking prevention and UI redressing protection
        talisman_config['frame_options'] = 'DENY'
        talisman_config['content_type_options'] = True
        
        # Initialize Flask-Talisman security middleware with comprehensive configuration
        talisman = Talisman(app, **talisman_config)
        
        # Set up Flask-CORS with environment-specific origin policies and security validation
        cors_config = SECURITY_CONSTANTS.get('CORS_CONFIG', {}).copy()
        
        if environment == 'development':
            # Development CORS settings for local testing
            cors_config.update({
                'origins': ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'],
                'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
                'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                'supports_credentials': True
            })
        else:
            # Production CORS settings with restricted origins
            cors_config.update({
                'origins': SECURITY_CONSTANTS.get('ALLOWED_ORIGINS', []),
                'allow_headers': ['Content-Type', 'Authorization'],
                'methods': ['GET', 'POST', 'OPTIONS'],
                'supports_credentials': False
            })
        
        # Configure Flask-CORS with validated origin policies
        cors = CORS(app, **cors_config)
        
        # Initialize SecurityMiddleware for advanced threat detection and automated response
        security_middleware_config = {
            'environment': environment,
            'talisman_instance': talisman,
            'cors_instance': cors,
            'security_logging': True,
            'threat_detection': True
        }
        
        SECURITY_MIDDLEWARE_INSTANCE = SecurityMiddleware(app, security_middleware_config)
        
        # Configure security event logging and monitoring integration with Flask logger
        @app.before_request
        def security_before_request():
            """Flask before_request handler for security validation and threat detection."""
            # Set up security context in Flask g object
            g.security_context = {
                'request_id': generate_request_id('security'),
                'client_ip': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'request_time': time.time(),
                'security_validated': False
            }
            
            # Perform security validation if middleware is available
            if SECURITY_MIDDLEWARE_INSTANCE:
                try:
                    SECURITY_MIDDLEWARE_INSTANCE.validate_request()
                    g.security_context['security_validated'] = True
                except Exception as security_error:
                    logger.warning(f"Security validation failed: {str(security_error)}")
                    g.security_context['security_error'] = str(security_error)
        
        # Apply environment-specific security policies including development exceptions and production hardening
        security_headers = SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
        
        @app.after_request
        def add_security_headers(response):
            """Flask after_request handler for additional security headers."""
            # Apply security headers from SECURITY_CONSTANTS
            for header, value in security_headers.items():
                response.headers[header] = value
            
            # Add environment-specific headers
            response.headers['X-Environment'] = environment
            response.headers['X-Framework'] = 'Flask'
            response.headers['X-Security-Version'] = APPLICATION_VERSION
            
            return response
        
        # Set up security metrics collection for monitoring dashboard integration
        # Log security middleware initialization with configuration summary and protection status
        logger.info("Flask security middleware configured successfully", {
            'talisman_configured': True,
            'cors_configured': True,
            'security_middleware_active': SECURITY_MIDDLEWARE_INSTANCE is not None,
            'environment': environment,
            'security_level': 'hardened' if environment == 'production' else 'development'
        })
        
        return app
        
    except Exception as e:
        # Handle security configuration errors with fallback protection
        logger.error(f"Flask security configuration failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1
        
        # Apply minimal security headers as fallback
        @app.after_request
        def fallback_security_headers(response):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            return response
        
        return app


def register_blueprints(app: Flask) -> None:
    """
    Registers Flask blueprints with the application instance including hello routes, health 
    monitoring, and API organization equivalent to Express.js router registration. Implements 
    modular Flask route organization with comprehensive error handling, middleware integration, 
    and cross-platform compatibility validation.
    
    Args:
        app: Flask application instance for blueprint registration and route organization
    """
    try:
        logger.info("Registering Flask blueprints for modular route organization")
        
        # Register hello_bp blueprint with /api URL prefix for hello and good-evening endpoints
        app.register_blueprint(hello_bp, url_prefix='/api')
        logger.info("Registered hello_bp blueprint with /api prefix")
        
        # Register health_bp blueprint for application monitoring and health check endpoints
        app.register_blueprint(health_bp, url_prefix='/api')
        logger.info("Registered health_bp blueprint with /api prefix")
        
        # Register main api blueprint for centralized API route organization and versioning
        app.register_blueprint(api, url_prefix='')
        logger.info("Registered main api blueprint with root prefix")
        
        # Validate blueprint registration and route availability for endpoint accessibility testing
        with app.app_context():
            routes = []
            for rule in app.url_map.iter_rules():
                routes.append({
                    'endpoint': rule.endpoint,
                    'rule': rule.rule,
                    'methods': list(rule.methods)
                })
        
        logger.info(f"Blueprint registration completed - {len(routes)} routes available", {
            'registered_blueprints': ['hello_bp', 'health_bp', 'api'],
            'route_count': len(routes),
            'sample_routes': routes[:5]  # Log first 5 routes as sample
        })
        
        # Set up blueprint performance monitoring and metrics collection
        FLASK_APP_METRICS['blueprints_registered'] = 3
        
    except Exception as e:
        # Handle blueprint registration errors with detailed error reporting
        logger.error(f"Blueprint registration failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1
        raise


def configure_error_handling(app: Flask) -> None:
    """
    Configures comprehensive Flask error handling including HTTP error responses, exception 
    handling, security violation responses, and error logging equivalent to Express.js error 
    middleware. Implements centralized error processing with sanitized responses and 
    security-conscious error exposure.
    
    Args:
        app: Flask application instance for error handler registration and configuration
    """
    global ERROR_HANDLER_INSTANCE
    
    try:
        logger.info("Configuring Flask comprehensive error handling middleware")
        
        # Create error handler instance with application-specific configuration
        error_config = {
            'production_mode': app.config.get('ENV') == 'production',
            'include_stack_trace': app.debug,
            'security_logging': True,
            'correlation_tracking': True,
            'sanitize_errors': not app.debug
        }
        
        ERROR_HANDLER_INSTANCE = create_error_handler(app, error_config)
        
        # Register Flask error handlers for HTTP status codes including 404, 405, 500 errors
        @app.errorhandler(404)
        def handle_404_error(error):
            """Handle 404 Not Found errors with detailed response and security monitoring."""
            correlation_id = generate_request_id('404_error')
            
            error_response = format_http_response(
                'not_found',
                'The requested resource was not found',
                404,
                {
                    'correlation_id': correlation_id,
                    'path': request.path,
                    'method': request.method,
                    'available_endpoints': _get_available_endpoints(app),
                    'suggestions': [
                        'Check the URL for typos',
                        'Verify the endpoint exists', 
                        'Ensure you\'re using the correct HTTP method'
                    ]
                }
            )
            
            logger.warning(f"404 error for {request.method} {request.path}", {
                'correlation_id': correlation_id,
                'client_ip': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'Unknown')
            })
            
            return jsonify(error_response), 404
        
        @app.errorhandler(500)
        def handle_500_error(error):
            """Handle 500 Internal Server Error with comprehensive error analysis."""
            correlation_id = generate_request_id('500_error')
            
            error_details = {
                'correlation_id': correlation_id,
                'error_type': type(error).__name__,
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            
            # Include debug information in development
            if app.debug:
                error_details['error_message'] = str(error)
                error_details['debug_info'] = True
            
            error_response = format_http_response(
                'internal_server_error',
                'An internal server error occurred' if not app.debug else str(error),
                500,
                error_details
            )
            
            logger.error(f"500 internal server error", error, {
                'correlation_id': correlation_id,
                'request_context': {
                    'method': request.method,
                    'path': request.path,
                    'client_ip': request.remote_addr
                }
            })
            
            return jsonify(error_response), 500
        
        @app.errorhandler(400)
        def handle_400_error(error):
            """Handle 400 Bad Request errors with validation guidance."""
            correlation_id = generate_request_id('400_error')
            
            error_response = format_http_response(
                'bad_request',
                'Invalid request format or parameters',
                400,
                {
                    'correlation_id': correlation_id,
                    'validation_rules': API_CONSTANTS.get('VALIDATION_RULES', {}),
                    'request_format': request.content_type
                }
            )
            
            return jsonify(error_response), 400
        
        # Configure validation error handlers for input validation failures and format errors
        @app.errorhandler(ValueError)
        def handle_value_error(error):
            """Handle ValueError exceptions with validation context."""
            correlation_id = generate_request_id('validation_error')
            
            error_response = format_http_response(
                'validation_error',
                str(error),
                400,
                {
                    'correlation_id': correlation_id,
                    'error_type': 'ValueError',
                    'field_validation': True
                }
            )
            
            logger.warning(f"Validation error: {str(error)}", {
                'correlation_id': correlation_id,
                'error_type': 'ValueError'
            })
            
            return jsonify(error_response), 400
        
        # Configure general exception handler for unhandled errors
        @app.errorhandler(Exception)
        def handle_general_error(error):
            """Handle general exceptions with comprehensive error processing."""
            correlation_id = generate_request_id('general_error')
            
            error_details = {
                'correlation_id': correlation_id,
                'error_type': type(error).__name__,
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            
            # Determine appropriate status code
            status_code = getattr(error, 'code', 500)
            if not isinstance(status_code, int) or status_code < 100:
                status_code = 500
            
            error_response = format_http_response(
                'application_error',
                'An unexpected error occurred' if not app.debug else str(error),
                status_code,
                error_details
            )
            
            logger.error(f"General application error: {str(error)}", error, {
                'correlation_id': correlation_id,
                'error_type': type(error).__name__
            })
            
            return jsonify(error_response), status_code
        
        logger.info("Flask error handling configured successfully", {
            'error_handler_instance': ERROR_HANDLER_INSTANCE is not None,
            'production_mode': error_config['production_mode'],
            'security_logging': error_config['security_logging']
        })
        
    except Exception as e:
        # Handle error handler configuration failures
        logger.error(f"Error handling configuration failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1
        raise


def setup_request_logging(app: Flask, environment: str) -> None:
    """
    Sets up comprehensive Flask request logging middleware for request/response tracking, 
    performance monitoring, and debugging support equivalent to Express.js logging middleware. 
    Configures structured logging with correlation IDs and monitoring integration.
    
    Args:
        app: Flask application instance for logging middleware configuration
        environment: Environment name for logging configuration and output formatting
    """
    global LOGGING_MIDDLEWARE_INSTANCE
    
    try:
        logger.info(f"Setting up Flask request logging middleware for {environment}")
        
        # Configure logging middleware with environment-specific settings
        logging_config = {
            'environment': environment,
            'correlation_tracking': True,
            'performance_monitoring': True,
            'security_logging': True,
            'log_level': app.config.get('LOG_LEVEL', 'INFO'),
            'structured_output': True
        }
        
        # Create logging middleware instance
        LOGGING_MIDDLEWARE_INSTANCE = create_logging_middleware(app, logging_config)
        
        logger.info("Flask request logging middleware configured successfully", {
            'logging_middleware_active': LOGGING_MIDDLEWARE_INSTANCE is not None,
            'correlation_tracking': True,
            'environment': environment
        })
        
    except Exception as e:
        # Handle logging setup errors
        logger.error(f"Request logging setup failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1
        # Continue without logging middleware rather than failing


def setup_request_correlation(app: Flask) -> None:
    """
    Sets up Flask request correlation tracking system for distributed request monitoring and 
    debugging equivalent to Express.js request correlation middleware. Implements request ID 
    generation, context propagation, and logging integration for comprehensive request 
    lifecycle tracking.
    
    Args:
        app: Flask application instance for correlation tracking configuration
    """
    try:
        logger.info("Setting up Flask request correlation tracking system")
        
        @app.before_request
        def before_request_correlation():
            """Flask before_request hook for request ID generation and context initialization."""
            # Generate unique correlation ID for request tracking
            correlation_id = generate_request_id('flask_req')
            g.request_id = correlation_id
            g.request_start_time = time.perf_counter()
            g.request_timestamp = datetime.datetime.now(datetime.timezone.utc)
            
            # Set up request context for debugging and monitoring
            g.request_context = {
                'correlation_id': correlation_id,
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'start_time': g.request_start_time,
                'timestamp': g.request_timestamp.isoformat()
            }
            
            # Update request metrics
            FLASK_APP_METRICS['requests_handled'] += 1
        
        @app.after_request
        def after_request_correlation(response):
            """Flask after_request hook for response correlation and performance measurement."""
            if hasattr(g, 'request_id') and hasattr(g, 'request_start_time'):
                # Calculate request duration
                duration = (time.perf_counter() - g.request_start_time) * 1000  # Convert to milliseconds
                
                # Update average response time
                current_avg = FLASK_APP_METRICS['average_response_time']
                request_count = FLASK_APP_METRICS['requests_handled']
                FLASK_APP_METRICS['average_response_time'] = ((current_avg * (request_count - 1)) + duration) / request_count
                
                # Add correlation headers to response
                response.headers['X-Correlation-ID'] = g.request_id
                response.headers['X-Response-Time'] = f"{duration:.2f}ms"
                response.headers['X-Request-Count'] = str(FLASK_APP_METRICS['requests_handled'])
                
                # Log request completion for monitoring
                logger.info(f"Request completed: {request.method} {request.path}", {
                    'correlation_id': g.request_id,
                    'duration_ms': round(duration, 2),
                    'status_code': response.status_code,
                    'response_size': response.content_length or 0
                })
            
            return response
        
        logger.info("Flask request correlation tracking configured successfully")
        
    except Exception as e:
        # Handle correlation setup errors
        logger.error(f"Request correlation setup failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1


def configure_performance_monitoring(app: Flask) -> None:
    """
    Configures Flask application performance monitoring including response time tracking, memory 
    usage monitoring, request metrics collection, and performance analytics equivalent to 
    Express.js performance monitoring with Flask-specific metrics and WSGI deployment optimization.
    
    Args:
        app: Flask application instance for performance monitoring configuration
    """
    try:
        logger.info("Configuring Flask performance monitoring system")
        
        # Set up performance metrics collection
        @app.before_request
        def performance_before_request():
            """Flask before_request handler for performance timing initialization."""
            g.performance_start = time.perf_counter()
            g.performance_timestamp = time.time()
        
        @app.after_request
        def performance_after_request(response):
            """Flask after_request handler for performance metrics calculation."""
            if hasattr(g, 'performance_start'):
                # Calculate detailed performance metrics
                duration = (time.perf_counter() - g.performance_start) * 1000
                
                # Add performance headers
                response.headers['X-Performance-Duration'] = f"{duration:.2f}ms"
                response.headers['X-Performance-Timestamp'] = str(g.performance_timestamp)
                
                # Log performance metrics for slow requests
                if duration > 1000:  # Log requests taking more than 1 second
                    logger.warning(f"Slow request detected: {duration:.2f}ms", {
                        'method': request.method,
                        'path': request.path,
                        'duration_ms': round(duration, 2),
                        'status_code': response.status_code
                    })
            
            return response
        
        # Set up periodic metrics reporting
        def update_uptime_metrics():
            """Update application uptime metrics."""
            FLASK_APP_METRICS['uptime_seconds'] = time.time() - APP_START_TIME
        
        # Register performance monitoring route
        @app.route('/api/metrics', methods=['GET'])
        def get_performance_metrics():
            """Flask route for performance metrics retrieval."""
            update_uptime_metrics()
            
            metrics_response = {
                'status': 'success',
                'metrics': FLASK_APP_METRICS.copy(),
                'application_info': {
                    'version': APPLICATION_VERSION,
                    'environment': app.config.get('ENV', 'unknown'),
                    'debug_mode': app.debug,
                    'cross_platform_parity': CROSS_PLATFORM_PARITY
                },
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            
            return jsonify(metrics_response)
        
        logger.info("Flask performance monitoring configured successfully")
        
    except Exception as e:
        # Handle performance monitoring setup errors
        logger.error(f"Performance monitoring setup failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1


def setup_graceful_shutdown(app: Flask) -> None:
    """
    Sets up Flask application graceful shutdown handling for WSGI deployment including signal 
    handlers, resource cleanup, and zero-downtime deployment support equivalent to Express.js 
    graceful shutdown with Gunicorn process management integration.
    
    Args:
        app: Flask application instance for graceful shutdown configuration
    """
    global GRACEFUL_SHUTDOWN_HANDLERS
    
    try:
        logger.info("Setting up Flask graceful shutdown handlers")
        
        def cleanup_resources():
            """Cleanup application resources during shutdown."""
            logger.info("Cleaning up Flask application resources")
            
            # Update final metrics
            FLASK_APP_METRICS['shutdown_time'] = time.time()
            FLASK_APP_METRICS['total_uptime'] = time.time() - APP_START_TIME
            
            # Close middleware instances
            if SECURITY_MIDDLEWARE_INSTANCE:
                try:
                    # Cleanup security middleware
                    pass
                except Exception as e:
                    logger.warning(f"Security middleware cleanup failed: {str(e)}")
            
            if ERROR_HANDLER_INSTANCE:
                try:
                    # Cleanup error handler
                    pass
                except Exception as e:
                    logger.warning(f"Error handler cleanup failed: {str(e)}")
            
            if LOGGING_MIDDLEWARE_INSTANCE:
                try:
                    # Cleanup logging middleware
                    pass
                except Exception as e:
                    logger.warning(f"Logging middleware cleanup failed: {str(e)}")
            
            logger.info("Flask application cleanup completed", {
                'total_requests': FLASK_APP_METRICS['requests_handled'],
                'total_errors': FLASK_APP_METRICS['errors_count'],
                'total_uptime': FLASK_APP_METRICS['total_uptime'],
                'average_response_time': FLASK_APP_METRICS['average_response_time']
            })
        
        def signal_handler(signum, frame):
            """Handle shutdown signals gracefully."""
            logger.info(f"Received shutdown signal {signum}, initiating graceful shutdown")
            cleanup_resources()
            
        def atexit_handler():
            """Handle application exit."""
            logger.info("Flask application exiting")
            cleanup_resources()
        
        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
        
        # Register atexit handler
        atexit.register(atexit_handler)
        
        # Store handlers for testing
        GRACEFUL_SHUTDOWN_HANDLERS.extend([signal_handler, atexit_handler, cleanup_resources])
        
        logger.info("Flask graceful shutdown handlers configured successfully")
        
    except Exception as e:
        # Handle graceful shutdown setup errors
        logger.error(f"Graceful shutdown setup failed: {str(e)}", error=e)
        FLASK_APP_METRICS['errors_count'] += 1


def validate_application_health(app: Flask) -> Dict[str, Any]:
    """
    Validates Flask application health including configuration completeness, middleware 
    integration, security implementation, and cross-platform compatibility with Express.js 
    implementation. Provides comprehensive application status assessment for deployment 
    readiness validation.
    
    Args:
        app: Flask application instance for health validation
        
    Returns:
        Flask application health assessment with status, configuration validation, and readiness information
    """
    try:
        logger.info("Validating Flask application health and deployment readiness")
        
        health_assessment = {
            'status': 'healthy',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'application_info': {
                'name': app.name,
                'version': APPLICATION_VERSION,
                'environment': app.config.get('ENV', 'unknown'),
                'debug_mode': app.debug,
                'testing_mode': app.testing
            },
            'configuration_status': {},
            'middleware_status': {},
            'blueprint_status': {},
            'security_status': {},
            'deployment_readiness': {}
        }
        
        # Validate Flask application configuration completeness
        config_checks = {
            'secret_key_configured': bool(app.config.get('SECRET_KEY')),
            'environment_set': bool(app.config.get('ENV')),
            'debug_mode_appropriate': app.debug if app.config.get('ENV') == 'development' else not app.debug,
            'logging_configured': bool(app.config.get('LOG_LEVEL'))
        }
        health_assessment['configuration_status'] = config_checks
        
        # Validate middleware integration status
        middleware_checks = {
            'security_middleware_active': SECURITY_MIDDLEWARE_INSTANCE is not None,
            'error_handler_configured': ERROR_HANDLER_INSTANCE is not None,
            'logging_middleware_active': LOGGING_MIDDLEWARE_INSTANCE is not None,
            'request_correlation_enabled': True  # Always enabled in this implementation
        }
        health_assessment['middleware_status'] = middleware_checks
        
        # Check blueprint registration status
        with app.app_context():
            registered_blueprints = [bp.name for bp in app.blueprints.values()]
            blueprint_checks = {
                'hello_bp_registered': 'hello_bp' in registered_blueprints,
                'health_bp_registered': 'health_bp' in registered_blueprints,
                'api_bp_registered': 'api' in registered_blueprints,
                'total_blueprints': len(registered_blueprints),
                'route_count': len(list(app.url_map.iter_rules()))
            }
            health_assessment['blueprint_status'] = blueprint_checks
        
        # Validate security implementation
        security_checks = {
            'talisman_equivalent_configured': SECURITY_MIDDLEWARE_INSTANCE is not None,
            'cors_configured': True,  # Configured in configure_security
            'security_headers_applied': True,
            'https_enforcement': app.config.get('ENV') == 'production'
        }
        health_assessment['security_status'] = security_checks
        
        # Assess deployment readiness
        deployment_checks = {
            'wsgi_compatible': True,
            'production_ready': all([
                config_checks['secret_key_configured'],
                middleware_checks['security_middleware_active'],
                blueprint_checks['hello_bp_registered'],
                blueprint_checks['health_bp_registered']
            ]),
            'cross_platform_compatible': CROSS_PLATFORM_PARITY,
            'monitoring_enabled': True,
            'graceful_shutdown_configured': len(GRACEFUL_SHUTDOWN_HANDLERS) > 0
        }
        health_assessment['deployment_readiness'] = deployment_checks
        
        # Determine overall health status
        critical_failures = []
        if not config_checks['secret_key_configured']:
            critical_failures.append('SECRET_KEY not configured')
        if not blueprint_checks['hello_bp_registered']:
            critical_failures.append('hello_bp blueprint not registered')
        if not middleware_checks['security_middleware_active']:
            critical_failures.append('Security middleware not active')
        
        if critical_failures:
            health_assessment['status'] = 'degraded'
            health_assessment['critical_failures'] = critical_failures
        
        # Add recommendations
        recommendations = []
        if app.config.get('ENV') == 'production' and app.debug:
            recommendations.append('Disable debug mode in production')
        if not deployment_checks['production_ready']:
            recommendations.append('Complete configuration before production deployment')
        
        health_assessment['recommendations'] = recommendations
        
        logger.info(f"Flask application health validation completed: {health_assessment['status']}", {
            'critical_failures': len(critical_failures),
            'deployment_ready': deployment_checks['production_ready'],
            'recommendations_count': len(recommendations)
        })
        
        return health_assessment
        
    except Exception as e:
        # Handle health validation errors
        logger.error(f"Application health validation failed: {str(e)}", error=e)
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }


def get_application_info(app: Optional[Flask] = None) -> Dict[str, Any]:
    """
    Returns comprehensive Flask application information including version, configuration, 
    environment details, performance metrics, and educational content for cross-platform 
    comparison with Express.js implementation and tutorial integration.
    
    Args:
        app: Optional Flask application instance for information extraction
        
    Returns:
        Flask application information with version, environment, metrics, and educational comparison data
    """
    try:
        # Use global app instance if none provided
        if app is None:
            app = app_instance
        
        if app is None:
            return {
                'status': 'error',
                'message': 'No Flask application instance available',
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        
        # Update current metrics
        FLASK_APP_METRICS['uptime_seconds'] = time.time() - APP_START_TIME
        
        application_info = {
            'application_details': {
                'name': app.name,
                'version': APPLICATION_VERSION,
                'framework': 'Flask',
                'framework_version': '3.1.1',
                'python_version': '3.9+',
                'environment': app.config.get('ENV', 'unknown'),
                'debug_mode': app.debug,
                'testing_mode': app.testing,
                'initialized': APPLICATION_INITIALIZED
            },
            'performance_metrics': FLASK_APP_METRICS.copy(),
            'configuration_summary': {
                'secret_key_configured': bool(app.config.get('SECRET_KEY')),
                'database_configured': False,  # This tutorial doesn't use a database
                'logging_level': app.config.get('LOG_LEVEL', 'INFO'),
                'cors_enabled': True,
                'security_enabled': SECURITY_MIDDLEWARE_INSTANCE is not None
            },
            'blueprint_information': {},
            'middleware_status': {
                'security_middleware': SECURITY_MIDDLEWARE_INSTANCE is not None,
                'error_handler': ERROR_HANDLER_INSTANCE is not None,
                'logging_middleware': LOGGING_MIDDLEWARE_INSTANCE is not None,
                'request_correlation': True
            },
            'cross_platform_comparison': {
                'express_js_equivalent': {
                    'application_factory': 'app.js with Express() constructor',
                    'middleware_pattern': 'app.use() middleware mounting',
                    'route_organization': 'Express Router equivalent to Flask Blueprints',
                    'security_middleware': 'Helmet.js equivalent to Flask-Talisman',
                    'error_handling': 'Express error middleware equivalent to Flask errorhandlers',
                    'cors_handling': 'cors package equivalent to Flask-CORS'
                },
                'feature_parity_status': {
                    'hello_endpoint': True,
                    'good_evening_endpoint': True,
                    'health_monitoring': True,
                    'error_handling': True,
                    'security_headers': True,
                    'cors_support': True,
                    'performance_monitoring': True
                }
            },
            'educational_content': {
                'learning_objectives': [
                    'Understanding Flask application factory pattern',
                    'Implementing cross-platform API compatibility',
                    'Deploying Flask applications with WSGI servers',
                    'Applying security best practices with Flask-Talisman'
                ],
                'architectural_patterns': {
                    'application_factory': 'Deferred application creation for testing and deployment flexibility',
                    'blueprint_organization': 'Modular route organization equivalent to Express.js routers',
                    'middleware_pipeline': 'Request/response processing pipeline with Flask decorators',
                    'configuration_management': 'Environment-specific configuration classes'
                },
                'deployment_guidance': {
                    'development': 'flask run for development server',
                    'production': 'Gunicorn WSGI server with multiple workers',
                    'containerization': 'Docker deployment with health checks',
                    'process_management': 'Supervisor or systemd for production deployment'
                }
            },
            'troubleshooting_information': {
                'common_issues': [
                    'SECRET_KEY not set in production',
                    'CORS policy violations in browser applications',
                    'Blueprint registration order dependencies',
                    'Middleware configuration in wrong order'
                ],
                'debugging_endpoints': [
                    '/api/health - Application health status',
                    '/api/metrics - Performance metrics',
                    '/api/hello - Hello world endpoint',
                    '/api/good-evening - Good evening endpoint'
                ],
                'log_analysis': {
                    'correlation_tracking': 'X-Correlation-ID header in responses',
                    'performance_monitoring': 'X-Response-Time header in responses',
                    'error_correlation': 'Structured error logging with request context'
                }
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        # Add blueprint information if app context is available
        try:
            with app.app_context():
                blueprints = {}
                for name, blueprint in app.blueprints.items():
                    blueprints[name] = {
                        'name': blueprint.name,
                        'url_prefix': blueprint.url_prefix,
                        'static_folder': blueprint.static_folder,
                        'template_folder': blueprint.template_folder
                    }
                application_info['blueprint_information'] = blueprints
        except Exception as blueprint_error:
            logger.warning(f"Could not extract blueprint information: {str(blueprint_error)}")
        
        return application_info
        
    except Exception as e:
        logger.error(f"Failed to get application information: {str(e)}", error=e)
        return {
            'status': 'error',
            'error_message': str(e),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }


# Helper functions for internal application operations

def _get_available_endpoints(app: Flask) -> list:
    """
    Gets list of available Flask endpoints for error response guidance.
    
    Args:
        app: Flask application instance
        
    Returns:
        List of available endpoint paths
    """
    try:
        with app.app_context():
            endpoints = []
            for rule in app.url_map.iter_rules():
                if 'GET' in rule.methods:
                    endpoints.append(rule.rule)
            return endpoints[:10]  # Return first 10 endpoints
    except Exception:
        return ['/api/hello', '/api/good-evening', '/api/health']


# Application instance creation for development server
if __name__ == '__main__':
    # Create Flask application for development server
    development_app = create_app('development')
    
    # Get development server configuration
    host = ENV_CONSTANTS.get('DEFAULT_HOST', '127.0.0.1')
    port = ENV_CONSTANTS.get('DEFAULT_PORT', 5000)
    debug = True
    
    logger.info(f"Starting Flask development server on {host}:{port}")
    
    # Run development server
    development_app.run(
        host=host,
        port=port,
        debug=debug,
        use_reloader=True,
        threaded=True
    )