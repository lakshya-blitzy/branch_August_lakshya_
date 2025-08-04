"""
Flask Error Handling Middleware - Comprehensive Cross-Platform Error Processing

This module provides comprehensive Flask error handling middleware equivalent to Express.js
error middleware, maintaining complete feature parity with centralized error processing,
standardized error responses, security violation handling, and production-ready error
management for Flask 3.1.1 with Python 3.9+ compatibility.

Features:
- Comprehensive Flask error handling middleware with centralized error processing
- Security violation handling for Flask-Talisman policy violations and threats  
- Standardized error responses maintaining cross-platform API compatibility
- Production-ready error management for Gunicorn multi-worker WSGI deployment
- Flask-specific error handling patterns with Flask request context integration
- Educational demonstration of Flask error handling architecture equivalent to Express.js
- Complete integration with Flask application factory pattern for centralized processing
- Structured error responses with correlation tracking and performance monitoring
- Security audit trails with Flask-Talisman integration and threat response
- Comprehensive logging with correlation tracking for distributed Flask logging

Educational Focus:
- Flask cross-platform error handling implementation maintaining Express.js feature parity
- Modern Flask error handler patterns with Flask 3.1.1 integration and WSGI compatibility
- Flask-Talisman security integration equivalent to Helmet.js security error handling
- Production deployment readiness for Gunicorn multi-worker environments
- pytest testing framework integration for comprehensive error scenario coverage

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import time  # built-in - Python time utilities for error timestamps and performance measurement
import datetime  # built-in - Python datetime utilities for error timestamp formatting and timezone-aware tracking
import traceback  # built-in - Python stack trace utilities for comprehensive Flask error debugging and exception analysis
import sys  # built-in - Python system utilities for Flask error handling and exception information extraction
import json  # built-in - JSON serialization for Flask structured error responses and error data formatting
import functools  # built-in - Python function utilities for Flask error handler decorators and middleware optimization
from typing import Dict, Any, Optional, Union, Tuple, Callable  # built-in - Type hints for Flask error handler functions

# Flask framework imports with version comments for Flask 3.1.1 compatibility
from flask import Flask, request, g, jsonify, abort, current_app  # ^3.1.1 - Flask web framework for application context, error handlers, and WSGI integration

# Internal imports for Flask constants, logger, and cross-platform compatibility
from ..utils.constants import (
    ERROR_CONSTANTS,  # Flask error constants for standardized error codes and messages
    HTTP_CONSTANTS,   # HTTP constants for Flask error response status codes and content types
    API_CONSTANTS,    # API constants for standardized Flask error messages and validation rules
    SECURITY_CONSTANTS  # Security constants for Flask-Talisman security error handling
)
from ..utils.logger import (
    logger,  # Flask logger for error logging, security event tracking, and audit trail
    log_flask_security_event,  # Flask security event logging function
    generate_flask_request_id  # Flask request ID generation for error correlation tracking
)

# Global Flask error handler state management for WSGI deployment compatibility
ERROR_HANDLER_INSTANCE: Optional['ErrorHandler'] = None
ERROR_CORRELATION_CACHE: Dict[str, Any] = {}
ERROR_METRICS_COUNTER: int = 0
SECURITY_VIOLATION_TRACKER: Dict[str, Any] = {}
FLASK_ERROR_HANDLER_VERSION: str = '1.0.0'


class ValidationError(Exception):
    """
    Flask validation error class for handling input validation failures and parameter checking
    equivalent to Express.js validation errors with detailed field-level error reporting.
    
    Provides comprehensive validation error information including field errors, validation rules,
    and client guidance for Flask API endpoints with structured error response formatting.
    """
    
    def __init__(self, message: str, field_errors: Optional[Dict[str, Any]] = None, status_code: int = 400) -> None:
        """
        Initializes ValidationError with message, field errors, and HTTP status code.
        
        Args:
            message: Validation error message for client guidance
            field_errors: Dictionary of field-specific validation errors
            status_code: HTTP status code for validation error response
        """
        super().__init__(message)
        self.message = message
        self.field_errors = field_errors or {}
        self.status_code = status_code
        self.error_type = 'validation_error'
        self.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Converts ValidationError to dictionary for JSON serialization and Flask response formatting.
        
        Returns:
            Dictionary representation of validation error with field details and guidance
        """
        return {
            'error': self.error_type,
            'message': self.message,
            'field_errors': self.field_errors,
            'status_code': self.status_code,
            'timestamp': self.timestamp,
            'validation_rules': API_CONSTANTS.get('VALIDATION_RULES', {}),
            'suggestions': self._generate_validation_suggestions()
        }
    
    def _generate_validation_suggestions(self) -> List[str]:
        """
        Generates helpful validation suggestions for client applications.
        """
        suggestions = []
        if self.field_errors:
            suggestions.append("Please check the highlighted fields and correct the validation errors")
            for field, error in self.field_errors.items():
                suggestions.append(f"Field '{field}': {error}")
        else:
            suggestions.append("Please verify that all required fields are provided and in the correct format")
        return suggestions


class HTTPError(Exception):
    """
    Flask HTTP error class for handling HTTP status code errors and protocol-level failures
    equivalent to Express.js HTTP errors with proper status code mapping and response formatting.
    
    Provides comprehensive HTTP error information including status codes, headers, and
    troubleshooting guidance for Flask client applications.
    """
    
    def __init__(self, status_code: int, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> None:
        """
        Initializes HTTPError with status code, message, and additional details.
        
        Args:
            status_code: HTTP status code for protocol-level error
            message: Optional custom error message
            details: Additional error details and context information
        """
        self.status_code = status_code
        self.details = details or {}
        self.error_type = 'http_error'
        self.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Get error information from HTTP_CONSTANTS
        http_error_info = ERROR_CONSTANTS.get('HTTP_ERRORS', {}).get(status_code, {})
        self.message = message or http_error_info.get('message', f'HTTP {status_code} Error')
        self.error_name = http_error_info.get('name', f'HTTP {status_code}')
        self.error_category = http_error_info.get('category', 'unknown')
        
        super().__init__(self.message)
    
    def to_flask_response(self) -> Tuple[Dict[str, Any], int]:
        """
        Converts HTTPError to Flask response tuple with JSON error response and status code.
        
        Returns:
            Tuple of (error_dict, status_code) for Flask response formatting
        """
        error_response = {
            'error': self.error_type,
            'name': self.error_name,
            'message': self.message,
            'status_code': self.status_code,
            'category': self.error_category,
            'timestamp': self.timestamp,
            'details': self.details
        }
        
        # Add helpful guidance for common HTTP errors
        if self.status_code == 404:
            error_response['suggestions'] = [
                "Check the URL path for typos",
                "Verify that the endpoint exists",
                "Ensure you're using the correct HTTP method"
            ]
        elif self.status_code == 401:
            error_response['suggestions'] = [
                "Provide valid authentication credentials",
                "Check if your session has expired",
                "Verify API key or token validity"
            ]
        elif self.status_code == 403:
            error_response['suggestions'] = [
                "Verify you have permission to access this resource",
                "Check your user role and permissions",
                "Contact administrator if access should be granted"
            ]
        
        return error_response, self.status_code


def format_http_response(error_type: str, message: str, status_code: int, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Formats Flask HTTP response with standardized structure including error code, message, timestamp,
    correlation ID, and debugging information using consistent formatting patterns equivalent to
    Express.js error response formatting with Flask-specific response structure.
    
    Args:
        error_type: Type of error for classification and handling
        message: Error message for client communication
        status_code: HTTP status code for protocol compliance
        details: Additional error details and context information
        
    Returns:
        Standardized Flask error response object with consistent structure ready for JSON serialization
    """
    # Generate Flask error correlation ID for tracking and debugging
    correlation_id = generate_flask_request_id("error")
    
    # Create standardized error response structure with Flask formatting
    response = {
        'error': error_type,
        'message': message,
        'status_code': status_code,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'correlation_id': correlation_id,
        'version': FLASK_ERROR_HANDLER_VERSION
    }
    
    # Add additional details if provided
    if details:
        response['details'] = details
    
    # Include Flask request context if available
    try:
        if request:
            response['request_info'] = {
                'method': request.method,
                'path': request.path,
                'endpoint': request.endpoint
            }
    except RuntimeError:
        pass  # No Flask request context available
    
    # Add environment-specific information
    try:
        if current_app:
            response['environment'] = {
                'debug': current_app.debug,
                'testing': current_app.testing
            }
    except RuntimeError:
        pass  # No Flask application context available
    
    return response


def sanitize_security_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes Flask security context for safe error logging without exposing sensitive
    security information including authentication tokens, session data, and internal
    security configurations.
    
    Args:
        context: Security context dictionary with potentially sensitive information
        
    Returns:
        Sanitized security context safe for logging and error responses
    """
    sanitized = {}
    sensitive_fields = [
        'password', 'token', 'secret', 'key', 'auth', 'session',
        'cookie', 'credential', 'api_key', 'private_key'
    ]
    
    for key, value in context.items():
        key_lower = key.lower()
        
        # Check if field contains sensitive information
        if any(sensitive_field in key_lower for sensitive_field in sensitive_fields):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_security_context(value)
        elif isinstance(value, str) and len(value) > 200:
            # Truncate very long strings that might contain sensitive data
            sanitized[key] = value[:200] + '...[TRUNCATED]'
        else:
            sanitized[key] = value
    
    return sanitized


def generate_request_id() -> str:
    """
    Generates unique Flask request ID for error correlation tracking and distributed logging
    coordination across WSGI worker processes.
    
    Returns:
        Unique Flask request correlation ID for tracking and linking related errors
    """
    return generate_flask_request_id("req")


class ErrorHandler:
    """
    Main Flask error handling middleware class providing comprehensive error processing,
    security violation handling, standardized error responses, and production-ready error
    management equivalent to Express.js error middleware with Flask-specific error handling
    patterns, WSGI deployment compatibility, and integration with Flask application factory
    pattern for centralized error processing.
    
    Implements Flask errorhandler decorators, custom exception handling, security violation
    processing, and comprehensive error logging with correlation tracking for monitoring
    and debugging in production WSGI environments.
    """
    
    def __init__(self, app: Optional[Flask] = None, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initializes Flask ErrorHandler with comprehensive error handling configuration including
        HTTP status code handlers, security violation processing, and production-ready error
        management for WSGI deployment environments.
        
        Args:
            app: Flask application instance for error handler registration
            config: Error handler configuration dictionary with environment-specific settings
        """
        # Initialize Flask application reference and configuration
        self.app = app
        self.config = config or self._get_default_config()
        
        # Set up error handler registry for different error types and HTTP status codes
        self.error_handlers: Dict[Union[int, type], Callable] = {}
        
        # Initialize error metrics tracking and correlation cache for monitoring
        self.error_metrics: Dict[str, Any] = {
            'total_errors': 0,
            'error_by_type': {},
            'error_by_status_code': {},
            'security_violations': 0,
            'performance_metrics': {}
        }
        
        # Set up correlation cache for request tracking and debugging
        self.correlation_cache: Dict[str, Any] = {}
        
        # Configure production mode settings based on Flask environment
        self.production_mode = self.config.get('production_mode', False)
        
        # Initialize security configuration for Flask-Talisman integration
        self.security_config = self.config.get('security_config', {})
        
        # Initialize Flask error logging integration
        self.logger = logger.child({'name': 'error_handler', 'config': self.config})
        
        # Register Flask application error handlers if app provided
        if app:
            self.init_app(app)
        
        # Log error handler initialization
        self.logger.info("Flask ErrorHandler initialized", {
            'config': self.config,
            'production_mode': self.production_mode,
            'version': FLASK_ERROR_HANDLER_VERSION
        })
    
    def _get_default_config(self) -> Dict[str, Any]:
        """
        Generates default Flask error handler configuration based on environment and constants.
        """
        return {
            'production_mode': current_app.config.get('ENV') == 'production' if current_app else False,
            'include_stack_trace': True,  # Set to False in production
            'include_request_info': True,
            'security_logging': True,
            'performance_monitoring': True,
            'correlation_tracking': True,
            'sanitize_errors': True,
            'error_response_format': 'json',
            'security_config': SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
        }
    
    def init_app(self, app: Flask, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initializes Flask application with error handling middleware using application factory
        pattern integration for comprehensive error processing and monitoring.
        
        Args:
            app: Flask application instance for error handler registration
            config: Optional configuration override for application-specific settings
        """
        # Update configuration if provided
        if config:
            self.config.update(config)
        
        # Store Flask application reference
        self.app = app
        
        # Register Flask error handlers for comprehensive error processing
        self.register_error_handlers(app)
        
        # Set up Flask before_request and after_request hooks for error context
        self._setup_request_hooks(app)
        
        # Configure Flask error metrics collection and monitoring
        self._setup_error_metrics(app)
        
        # Log Flask error handler initialization completion
        self.logger.info("Flask ErrorHandler initialized for application", {
            'app_name': app.name,
            'debug_mode': app.debug,
            'testing_mode': app.testing
        })
    
    def register_error_handlers(self, app: Flask) -> None:
        """
        Registers Flask application error handlers for HTTP status codes and custom exceptions
        with comprehensive error processing including security violations and validation errors.
        
        Args:
            app: Flask application instance for error handler registration
        """
        # Register Flask HTTP status code error handlers
        app.errorhandler(404)(self.process_404_error)
        app.errorhandler(500)(self.process_500_error)
        app.errorhandler(400)(lambda e: self.handle_error(e, {'error_type': 'bad_request'}))
        app.errorhandler(401)(lambda e: self.handle_error(e, {'error_type': 'unauthorized'}))
        app.errorhandler(403)(lambda e: self.handle_error(e, {'error_type': 'forbidden'}))
        app.errorhandler(405)(lambda e: self.handle_error(e, {'error_type': 'method_not_allowed'}))
        app.errorhandler(429)(lambda e: self.handle_error(e, {'error_type': 'rate_limit_exceeded'}))
        
        # Register Flask custom exception handlers
        app.errorhandler(ValidationError)(self.process_validation_error)
        app.errorhandler(HTTPError)(lambda e: self.handle_error(e, {'error_type': 'http_error'}))
        
        # Register Flask general Exception handler for unhandled application errors
        app.errorhandler(Exception)(lambda e: self.handle_error(e, {'error_type': 'application_error'}))
        
        # Log Flask error handler registration completion
        self.logger.info("Flask error handlers registered", {
            'handlers_count': len(self.error_handlers),
            'status_code_handlers': [404, 500, 400, 401, 403, 405, 429],
            'exception_handlers': ['ValidationError', 'HTTPError', 'Exception']
        })
    
    def handle_error(self, error: Exception, error_context: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, Any], int]:
        """
        Central Flask error handling method that processes all error types with appropriate routing
        to specific handlers including error classification, correlation tracking, and monitoring.
        
        Args:
            error: Exception object for comprehensive error analysis
            error_context: Additional context dictionary for error processing
            
        Returns:
            Flask Response tuple with error response and appropriate HTTP status code
        """
        # Generate Flask error correlation ID for tracking
        correlation_id = generate_request_id()
        
        # Extract error context and classify error type
        context = error_context or {}
        context['correlation_id'] = correlation_id
        context['timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Add Flask request context for debugging
        context.update(self.get_error_context())
        
        # Classify error type and determine appropriate handler
        if isinstance(error, ValidationError):
            return self.process_validation_error(error)
        elif isinstance(error, HTTPError):
            return error.to_flask_response()
        elif hasattr(error, 'code') and error.code:
            # Flask HTTP error with status code
            return self._handle_http_status_error(error, context)
        else:
            # General application error
            return self._handle_application_error(error, context)
    
    def process_404_error(self, error: Any) -> Tuple[Dict[str, Any], int]:
        """
        Processes Flask 404 Not Found errors with security analysis and standardized response
        formatting including request correlation tracking and potential security scanning detection.
        
        Args:
            error: Flask 404 error object for processing
            
        Returns:
            Flask Response tuple with 404 error response and JSON formatting
        """
        # Generate Flask error correlation ID
        correlation_id = generate_request_id()
        
        # Extract Flask request information for 404 analysis
        request_info = {}
        try:
            if request:
                request_info = {
                    'method': request.method,
                    'path': request.path,
                    'url': request.url,
                    'remote_addr': request.remote_addr,
                    'user_agent': request.headers.get('User-Agent', 'Unknown')
                }
        except RuntimeError:
            pass
        
        # Analyze for potential security scanning patterns
        security_analysis = self._analyze_404_for_security_threats(request_info)
        
        # Format 404 error response with helpful guidance
        error_response = format_http_response(
            'not_found',
            'The requested resource was not found',
            404,
            {
                'request_info': request_info,
                'security_analysis': security_analysis,
                'available_endpoints': self._get_available_endpoints(),
                'suggestions': [
                    "Check the URL for typos",
                    "Verify the endpoint exists",
                    "Ensure you're using the correct HTTP method"
                ]
            }
        )
        error_response['correlation_id'] = correlation_id
        
        # Log 404 error with security context
        self.logger.warning("404 Not Found error", {
            'correlation_id': correlation_id,
            'request_info': request_info,
            'security_analysis': security_analysis
        })
        
        # Update error metrics
        self.update_error_metrics('404', error_response)
        
        return error_response, 404
    
    def process_500_error(self, error: Any) -> Tuple[Dict[str, Any], int]:
        """
        Processes Flask 500 Internal Server Error with comprehensive error analysis and production-safe
        response formatting including stack trace capture and incident response coordination.
        
        Args:
            error: Flask 500 error object for comprehensive analysis
            
        Returns:
            Flask Response tuple with 500 error response and sanitized information
        """
        # Generate Flask error correlation ID for incident tracking
        correlation_id = generate_request_id()
        
        # Capture comprehensive error information
        error_details = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'correlation_id': correlation_id
        }
        
        # Include stack trace in development, sanitize in production
        if not self.production_mode and self.config.get('include_stack_trace', True):
            error_details['stack_trace'] = traceback.format_exc()
        
        # Extract Flask request context and system state
        context = self.get_error_context()
        error_details.update(context)
        
        # Sanitize error information for production safety
        if self.production_mode:
            error_details = self._sanitize_error_details(error_details)
        
        # Format 500 error response with appropriate information disclosure
        message = "Internal server error occurred" if self.production_mode else str(error)
        error_response = format_http_response(
            'internal_server_error',
            message,
            500,
            error_details
        )
        
        # Log comprehensive error information for debugging
        self.logger.error("500 Internal Server Error", error, {
            'correlation_id': correlation_id,
            'error_details': error_details,
            'system_state': self._get_system_state()
        })
        
        # Update error metrics and trigger alerting
        self.update_error_metrics('500', error_response)
        
        return error_response, 500
    
    def process_validation_error(self, validation_error: ValidationError) -> Tuple[Dict[str, Any], int]:
        """
        Processes Flask validation errors with detailed field-level error reporting and client
        guidance including validation rule information and input format specifications.
        
        Args:
            validation_error: ValidationError instance with field-level details
            
        Returns:
            Flask Response tuple with 400 validation error response and detailed field errors
        """
        # Generate Flask error correlation ID
        correlation_id = generate_request_id()
        
        # Extract validation error details
        validation_dict = validation_error.to_dict()
        validation_dict['correlation_id'] = correlation_id
        
        # Add Flask request context for validation debugging
        try:
            if request:
                validation_dict['request_data'] = {
                    'method': request.method,
                    'content_type': request.content_type,
                    'data_size': len(request.get_data()) if request.get_data() else 0
                }
        except RuntimeError:
            pass
        
        # Log validation error for API improvement analysis
        self.logger.warning("Validation error", {
            'correlation_id': correlation_id,
            'field_errors': validation_error.field_errors,
            'validation_rules': API_CONSTANTS.get('VALIDATION_RULES', {})
        })
        
        # Update validation error metrics
        self.update_error_metrics('validation', validation_dict)
        
        return validation_dict, validation_error.status_code
    
    def process_security_error(self, security_violation: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Processes Flask security violations with audit trail logging and protective response
        measures including Flask-Talisman policy enforcement and threat detection.
        
        Args:
            security_violation: Security violation context dictionary for investigation
            
        Returns:
            Flask Response tuple with security error response and protective measures
        """
        # Generate Flask security correlation ID
        correlation_id = generate_request_id()
        
        # Classify security violation severity and type
        violation_type = security_violation.get('type', 'unknown')
        severity = self._classify_security_violation_severity(violation_type)
        
        # Sanitize security context for safe logging
        sanitized_context = sanitize_security_context(security_violation)
        
        # Determine appropriate HTTP status code based on violation type
        status_code = self._get_security_violation_status_code(violation_type)
        
        # Format security error response with minimal information disclosure
        error_response = format_http_response(
            'security_violation',
            'Security policy violation detected',
            status_code,
            {
                'violation_type': violation_type,
                'severity': severity,
                'correlation_id': correlation_id,
                'security_guidance': self._get_security_guidance(violation_type)
            }
        )
        
        # Log comprehensive security violation for audit trail
        log_flask_security_event(violation_type, sanitized_context, {
            'correlation_id': correlation_id,
            'status_code': status_code,
            'severity': severity
        })
        
        # Update security violation metrics and tracking
        global SECURITY_VIOLATION_TRACKER
        SECURITY_VIOLATION_TRACKER[correlation_id] = {
            'type': violation_type,
            'severity': severity,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        self.update_error_metrics('security', error_response)
        
        return error_response, status_code
    
    def update_error_metrics(self, error_type: str, error_data: Dict[str, Any]) -> None:
        """
        Updates Flask error metrics and monitoring data for dashboard integration including
        error rates, patterns, and trend analysis for operational monitoring.
        
        Args:
            error_type: Error type classification for metrics categorization
            error_data: Error data dictionary for metrics analysis
        """
        global ERROR_METRICS_COUNTER
        ERROR_METRICS_COUNTER += 1
        
        # Update error metrics by type
        if error_type not in self.error_metrics['error_by_type']:
            self.error_metrics['error_by_type'][error_type] = 0
        self.error_metrics['error_by_type'][error_type] += 1
        
        # Update error metrics by status code
        status_code = error_data.get('status_code')
        if status_code:
            if status_code not in self.error_metrics['error_by_status_code']:
                self.error_metrics['error_by_status_code'][status_code] = 0
            self.error_metrics['error_by_status_code'][status_code] += 1
        
        # Update total error counter
        self.error_metrics['total_errors'] += 1
        
        # Track security violations separately
        if error_type == 'security':
            self.error_metrics['security_violations'] += 1
        
        # Update performance metrics
        self.error_metrics['performance_metrics'] = {
            'last_error_timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'error_rate': self.error_metrics['total_errors'] / max(time.time() - self._get_start_time(), 1),
            'most_common_error': max(self.error_metrics['error_by_type'].items(), key=lambda x: x[1])[0] if self.error_metrics['error_by_type'] else None
        }
        
        # Log metrics update for monitoring
        self.logger.debug("Error metrics updated", {
            'error_type': error_type,
            'total_errors': self.error_metrics['total_errors'],
            'error_rate': self.error_metrics['performance_metrics']['error_rate']
        })
    
    def get_error_context(self) -> Dict[str, Any]:
        """
        Retrieves comprehensive Flask error context including request information, system state,
        and debugging data for error analysis and investigation.
        
        Returns:
            Comprehensive Flask error context with request and system information for debugging
        """
        context = {
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'handler_version': FLASK_ERROR_HANDLER_VERSION,
            'production_mode': self.production_mode
        }
        
        # Add Flask request context if available
        try:
            if request:
                context['request'] = {
                    'method': request.method,
                    'url': request.url,
                    'path': request.path,
                    'endpoint': request.endpoint,
                    'remote_addr': request.remote_addr,
                    'user_agent': request.headers.get('User-Agent', 'Unknown'),
                    'content_type': request.content_type,
                    'content_length': request.content_length
                }
        except RuntimeError:
            pass  # No Flask request context available
        
        # Add Flask application context if available
        try:
            if current_app:
                context['application'] = {
                    'name': current_app.name,
                    'debug': current_app.debug,
                    'testing': current_app.testing,
                    'env': current_app.config.get('ENV', 'unknown')
                }
        except RuntimeError:
            pass  # No Flask application context available
        
        # Add system state information
        context['system'] = self._get_system_state()
        
        return context
    
    def _setup_request_hooks(self, app: Flask) -> None:
        """
        Sets up Flask before_request and after_request hooks for error context management.
        """
        @app.before_request
        def before_request():
            # Generate request correlation ID
            g.request_id = generate_request_id()
            g.request_start_time = time.time()
        
        @app.after_request
        def after_request(response):
            # Calculate request duration
            if hasattr(g, 'request_start_time'):
                duration = (time.time() - g.request_start_time) * 1000  # Convert to milliseconds
                response.headers['X-Response-Time'] = f"{duration:.2f}ms"
            
            # Add correlation ID to response headers
            if hasattr(g, 'request_id'):
                response.headers['X-Correlation-ID'] = g.request_id
            
            return response
    
    def _setup_error_metrics(self, app: Flask) -> None:
        """
        Sets up Flask error metrics collection and monitoring integration.
        """
        # Initialize error metrics start time
        self._start_time = time.time()
        
        # Set up periodic metrics reporting (in production environment)
        if self.production_mode:
            self._schedule_metrics_reporting()
    
    def _get_start_time(self) -> float:
        """
        Gets error handler start time for metrics calculation.
        """
        return getattr(self, '_start_time', time.time())
    
    def _handle_http_status_error(self, error: Any, context: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Handles Flask HTTP status errors with appropriate response formatting.
        """
        status_code = getattr(error, 'code', 500)
        description = getattr(error, 'description', 'HTTP Error')
        
        error_response = format_http_response(
            'http_error',
            description,
            status_code,
            context
        )
        
        return error_response, status_code
    
    def _handle_application_error(self, error: Exception, context: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Handles general Flask application errors with comprehensive analysis.
        """
        error_details = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'module': getattr(error, '__module__', 'unknown')
        }
        
        if not self.production_mode:
            error_details['stack_trace'] = traceback.format_exc()
        
        context.update(error_details)
        
        error_response = format_http_response(
            'application_error',
            "An unexpected error occurred" if self.production_mode else str(error),
            500,
            context
        )
        
        return error_response, 500
    
    def _analyze_404_for_security_threats(self, request_info: Dict[str, Any]) -> Dict[str, str]:
        """
        Analyzes 404 requests for potential security scanning patterns.
        """
        path = request_info.get('path', '')
        user_agent = request_info.get('user_agent', '')
        
        threat_indicators = []
        
        # Check for common vulnerability scanning patterns
        scanning_patterns = [
            '/admin', '/wp-admin', '/phpmyadmin', '/.env', '/config',
            '/backup', '/test', '/api/v1', '/.git', '/robots.txt'
        ]
        
        if any(pattern in path for pattern in scanning_patterns):
            threat_indicators.append('potential_vulnerability_scanning')
        
        # Check for suspicious user agents
        if 'bot' in user_agent.lower() or 'scanner' in user_agent.lower():
            threat_indicators.append('automated_scanning_tool')
        
        return {
            'threat_level': 'medium' if threat_indicators else 'low',
            'indicators': threat_indicators,
            'recommendation': 'monitor_for_patterns' if threat_indicators else 'normal_404'
        }
    
    def _get_available_endpoints(self) -> List[str]:
        """
        Gets list of available Flask endpoints for 404 error guidance.
        """
        try:
            if current_app:
                return [rule.rule for rule in current_app.url_map.iter_rules()]
        except RuntimeError:
            pass
        
        return ['/', '/hello', '/good-evening', '/health']
    
    def _sanitize_error_details(self, error_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes error details for production safety.
        """
        sanitized = error_details.copy()
        
        # Remove sensitive information in production
        if 'stack_trace' in sanitized:
            del sanitized['stack_trace']
        
        # Sanitize system information
        if 'system' in sanitized:
            system_info = sanitized['system']
            sanitized['system'] = {
                'timestamp': system_info.get('timestamp'),
                'handler_version': system_info.get('handler_version')
            }
        
        return sanitized
    
    def _classify_security_violation_severity(self, violation_type: str) -> str:
        """
        Classifies security violation severity for appropriate response.
        """
        severity_map = {
            'csrf_violation': 'high',
            'xss_attempt': 'high',
            'sql_injection': 'critical',
            'path_traversal': 'high',
            'rate_limit_exceeded': 'medium',
            'authentication_failure': 'medium',
            'authorization_violation': 'high',
            'talisman_violation': 'medium'
        }
        return severity_map.get(violation_type, 'medium')
    
    def _get_security_violation_status_code(self, violation_type: str) -> int:
        """
        Gets appropriate HTTP status code for security violations.
        """
        status_map = {
            'csrf_violation': 403,
            'xss_attempt': 400,
            'sql_injection': 400,
            'path_traversal': 403,
            'rate_limit_exceeded': 429,
            'authentication_failure': 401,
            'authorization_violation': 403,
            'talisman_violation': 400
        }
        return status_map.get(violation_type, 400)
    
    def _get_security_guidance(self, violation_type: str) -> List[str]:
        """
        Gets security guidance for different violation types.
        """
        guidance_map = {
            'csrf_violation': [
                "Include valid CSRF token in your request",
                "Ensure proper CSRF protection is enabled",
                "Check request headers and form data"
            ],
            'rate_limit_exceeded': [
                "Reduce request frequency",
                "Implement proper request throttling",
                "Contact support if limits are too restrictive"
            ],
            'authentication_failure': [
                "Provide valid authentication credentials",
                "Check if your session has expired",
                "Verify API key or token"
            ]
        }
        return guidance_map.get(violation_type, ["Follow security best practices"])
    
    def _get_system_state(self) -> Dict[str, Any]:
        """
        Gets current system state for error context.
        """
        return {
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'process_id': os.getpid() if hasattr(os, 'getpid') else 'unknown',
            'python_version': sys.version,
            'flask_version': FLASK_ERROR_HANDLER_VERSION
        }
    
    def _schedule_metrics_reporting(self) -> None:
        """
        Schedules periodic error metrics reporting for monitoring systems.
        """
        # This would integrate with APM tools in production
        pass


# Factory functions for Flask error handler creation and management

def create_error_handler(app: Flask, error_config: Optional[Dict[str, Any]] = None) -> ErrorHandler:
    """
    Factory function that creates comprehensive Flask error handling middleware with centralized
    error processing, security violation handling, and standardized error responses equivalent
    to Express.js error middleware. Provides environment-aware error configurations and
    production-ready error handling for WSGI deployment.
    
    Args:
        app: Flask application instance for error handler integration
        error_config: Error handler configuration dictionary with environment settings
        
    Returns:
        Configured Flask error handler middleware instance with comprehensive error processing
    """
    # Validate Flask application instance and configuration
    if not isinstance(app, Flask):
        raise ValueError("Invalid Flask application instance provided")
    
    # Apply default configuration with environment-specific settings
    config = error_config or {}
    
    # Determine environment-specific configuration
    environment = app.config.get('ENV', 'development')
    if environment == 'production':
        config.setdefault('production_mode', True)
        config.setdefault('include_stack_trace', False)
        config.setdefault('sanitize_errors', True)
    else:
        config.setdefault('production_mode', False)
        config.setdefault('include_stack_trace', True)
        config.setdefault('sanitize_errors', False)
    
    # Configure security integration
    config.setdefault('security_config', SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {}))
    config.setdefault('security_logging', True)
    
    # Set up monitoring and correlation tracking
    config.setdefault('performance_monitoring', True)
    config.setdefault('correlation_tracking', True)
    
    # Create and initialize Flask error handler
    error_handler = ErrorHandler(app, config)
    
    # Store global reference for module-level functions
    global ERROR_HANDLER_INSTANCE
    ERROR_HANDLER_INSTANCE = error_handler
    
    # Log error handler creation
    logger.info("Flask error handler created", {
        'app_name': app.name,
        'environment': environment,
        'configuration': config
    })
    
    return error_handler


# Module-level error handling functions for Flask application integration

def handle_404_error(error: Any) -> Tuple[Dict[str, Any], int]:
    """
    Handles Flask 404 Not Found errors with standardized response formatting, request correlation
    tracking, and security monitoring for unmatched routes equivalent to Express.js 404 handling.
    
    Args:
        error: Flask 404 error object for processing
        
    Returns:
        Flask Response tuple with JSON error response and 404 status code
    """
    global ERROR_HANDLER_INSTANCE
    
    if ERROR_HANDLER_INSTANCE:
        return ERROR_HANDLER_INSTANCE.process_404_error(error)
    
    # Fallback 404 handling if no error handler instance exists
    error_response = format_http_response(
        'not_found',
        'The requested resource was not found',
        404,
        {'fallback_handler': True}
    )
    
    logger.warning("404 error handled by fallback handler", {'error': str(error)})
    return error_response, 404


def handle_500_error(error: Any) -> Tuple[Dict[str, Any], int]:
    """
    Handles Flask 500 Internal Server Error with comprehensive error analysis, stack trace capture,
    and incident response for production Flask applications equivalent to Express.js 500 handling.
    
    Args:
        error: Flask 500 error object for comprehensive analysis
        
    Returns:
        Flask Response tuple with sanitized error response and 500 status code
    """
    global ERROR_HANDLER_INSTANCE
    
    if ERROR_HANDLER_INSTANCE:
        return ERROR_HANDLER_INSTANCE.process_500_error(error)
    
    # Fallback 500 handling if no error handler instance exists
    error_response = format_http_response(
        'internal_server_error',
        'An internal server error occurred',
        500,
        {'fallback_handler': True}
    )
    
    logger.error("500 error handled by fallback handler", error, {'error_details': str(error)})
    return error_response, 500


def handle_validation_error(validation_error: ValidationError) -> Tuple[Dict[str, Any], int]:
    """
    Handles Flask validation errors with detailed field-level error reporting and client guidance
    equivalent to Express.js validation error handling with comprehensive Flask error processing.
    
    Args:
        validation_error: ValidationError exception instance for processing
        
    Returns:
        Flask Response tuple with detailed validation error response and 400 status code
    """
    global ERROR_HANDLER_INSTANCE
    
    if ERROR_HANDLER_INSTANCE:
        return ERROR_HANDLER_INSTANCE.process_validation_error(validation_error)
    
    # Fallback validation error handling
    validation_dict = validation_error.to_dict()
    validation_dict['fallback_handler'] = True
    
    logger.warning("Validation error handled by fallback handler", {
        'field_errors': validation_error.field_errors,
        'message': validation_error.message
    })
    
    return validation_dict, validation_error.status_code


def handle_security_error(security_violation: Dict[str, Any], flask_request: Any = None) -> Tuple[Dict[str, Any], int]:
    """
    Handles Flask security violations with comprehensive security audit trail and automated response
    equivalent to Express.js security error handling with Flask-specific security integration.
    
    Args:
        security_violation: Security violation context dictionary for investigation
        flask_request: Flask request object for security context analysis
        
    Returns:
        Flask Response tuple with security error response and appropriate HTTP status code
    """
    global ERROR_HANDLER_INSTANCE
    
    if ERROR_HANDLER_INSTANCE:
        return ERROR_HANDLER_INSTANCE.process_security_error(security_violation)
    
    # Fallback security error handling
    violation_type = security_violation.get('type', 'unknown')
    status_code = 403  # Default to Forbidden for security violations
    
    error_response = format_http_response(
        'security_violation',
        'Security policy violation detected',
        status_code,
        {
            'violation_type': violation_type,
            'fallback_handler': True
        }
    )
    
    # Log security event
    log_flask_security_event(violation_type, security_violation, {
        'fallback_handler': True,
        'status_code': status_code
    })
    
    return error_response, status_code


def handle_http_error(http_error: HTTPError) -> Tuple[Dict[str, Any], int]:
    """
    Handles Flask HTTPError exceptions with proper status code mapping and standardized response
    formatting equivalent to Express.js HTTP error handling with Flask-specific error processing.
    
    Args:
        http_error: HTTPError exception instance for processing
        
    Returns:
        Flask Response tuple with HTTP error response and appropriate status code
    """
    return http_error.to_flask_response()


def handle_application_error(app_error: Exception) -> Tuple[Dict[str, Any], int]:
    """
    Handles general Flask application errors with comprehensive error analysis and production-safe
    error response formatting equivalent to Express.js application error handling.
    
    Args:
        app_error: General Exception for application error processing
        
    Returns:
        Flask Response tuple with application error response and 500 status code
    """
    global ERROR_HANDLER_INSTANCE
    
    if ERROR_HANDLER_INSTANCE:
        return ERROR_HANDLER_INSTANCE.handle_error(app_error, {'error_type': 'application_error'})
    
    # Fallback application error handling
    error_response = format_http_response(
        'application_error',
        'An unexpected application error occurred',
        500,
        {
            'error_type': type(app_error).__name__,
            'fallback_handler': True
        }
    )
    
    logger.error("Application error handled by fallback handler", app_error)
    return error_response, 500


def format_error_response(error_type: str, error_message: str, status_code: int, error_details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Formats Flask error responses with standardized structure including error code, message,
    timestamp, correlation ID, and debugging information using consistent formatting patterns.
    
    Args:
        error_type: Error type classification for response formatting
        error_message: Error message for client communication
        status_code: HTTP status code for protocol compliance
        error_details: Additional error details and context information
        
    Returns:
        Standardized Flask error response object with consistent structure
    """
    return format_http_response(error_type, error_message, status_code, error_details)


def log_error_event(error_type: str, error_context: Dict[str, Any], request_context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs Flask error events with comprehensive context information including request details,
    system state, and correlation tracking for monitoring and incident response.
    
    Args:
        error_type: Error type classification for logging categorization
        error_context: Error context dictionary with detailed information
        request_context: Flask request context dictionary for debugging
    """
    # Combine error and request context
    complete_context = error_context.copy()
    if request_context:
        complete_context.update(request_context)
    
    # Add correlation ID and timestamp
    complete_context['correlation_id'] = generate_request_id()
    complete_context['timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Log error event with appropriate severity
    if error_type in ['security_violation', 'critical_error']:
        logger.error(f"Critical error event: {error_type}", None, complete_context)
    elif error_type in ['validation_error', '404', 'client_error']:
        logger.warning(f"Client error event: {error_type}", complete_context)
    else:
        logger.info(f"Error event: {error_type}", complete_context)


def create_error_correlation(flask_request: Any, error_type: str) -> str:
    """
    Creates Flask error correlation tracking including request ID generation and distributed
    logging coordination for comprehensive error investigation across WSGI worker processes.
    
    Args:
        flask_request: Flask request object for correlation context
        error_type: Error type for correlation categorization
        
    Returns:
        Flask error correlation ID for tracking and linking related errors
    """
    # Generate unique correlation ID
    correlation_id = generate_request_id()
    
    # Store correlation information in cache
    global ERROR_CORRELATION_CACHE
    ERROR_CORRELATION_CACHE[correlation_id] = {
        'error_type': error_type,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'request_info': {
            'method': getattr(flask_request, 'method', 'UNKNOWN'),
            'path': getattr(flask_request, 'path', 'unknown'),
            'remote_addr': getattr(flask_request, 'remote_addr', 'unknown')
        } if flask_request else {}
    }
    
    # Store in Flask g object if available
    try:
        g.error_correlation_id = correlation_id
    except RuntimeError:
        pass  # No Flask application context available
    
    return correlation_id


def sanitize_error_context(error_context: Dict[str, Any], sanitization_options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Sanitizes Flask error context information for safe logging and client responses by removing
    sensitive data while preserving essential debugging information.
    
    Args:
        error_context: Error context dictionary with potentially sensitive information
        sanitization_options: Options for customizing sanitization behavior
        
    Returns:
        Sanitized Flask error context safe for logging and client responses
    """
    options = sanitization_options or {}
    sanitized = {}
    
    # Define sensitive field patterns
    sensitive_patterns = [
        'password', 'secret', 'token', 'key', 'auth', 'session',
        'cookie', 'credential', 'private', 'confidential'
    ]
    
    for key, value in error_context.items():
        key_lower = key.lower()
        
        # Check if field is sensitive
        if any(pattern in key_lower for pattern in sensitive_patterns):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_error_context(value, options)
        elif isinstance(value, str) and len(value) > 500:
            # Truncate very long strings
            sanitized[key] = value[:500] + '...[TRUNCATED]'
        elif isinstance(value, (list, tuple)):
            # Sanitize list/tuple elements
            sanitized[key] = [sanitize_error_context(item, options) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value
    
    return sanitized


def get_error_metrics(time_range: str = '1h', metrics_options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Retrieves Flask error metrics including error rates, types, patterns, and performance impact
    for monitoring dashboard integration and error analysis.
    
    Args:
        time_range: Time range for metrics collection ('1h', '24h', '7d', etc.)
        metrics_options: Options for customizing metrics collection
        
    Returns:
        Comprehensive Flask error metrics with rates, patterns, and analysis
    """
    global ERROR_HANDLER_INSTANCE, ERROR_METRICS_COUNTER, SECURITY_VIOLATION_TRACKER
    
    # Get current timestamp for metrics calculation
    current_time = datetime.datetime.now(datetime.timezone.utc)
    
    # Calculate time range boundaries
    time_ranges = {
        '1h': datetime.timedelta(hours=1),
        '24h': datetime.timedelta(days=1),
        '7d': datetime.timedelta(days=7),
        '30d': datetime.timedelta(days=30)
    }
    time_delta = time_ranges.get(time_range, datetime.timedelta(hours=1))
    start_time = current_time - time_delta
    
    # Collect basic metrics
    metrics = {
        'time_range': time_range,
        'start_time': start_time.isoformat(),
        'end_time': current_time.isoformat(),
        'total_errors': ERROR_METRICS_COUNTER,
        'security_violations': len(SECURITY_VIOLATION_TRACKER),
        'error_handler_version': FLASK_ERROR_HANDLER_VERSION
    }
    
    # Add detailed metrics if error handler instance exists
    if ERROR_HANDLER_INSTANCE:
        handler_metrics = ERROR_HANDLER_INSTANCE.error_metrics
        metrics.update({
            'error_by_type': handler_metrics.get('error_by_type', {}),
            'error_by_status_code': handler_metrics.get('error_by_status_code', {}),
            'performance_metrics': handler_metrics.get('performance_metrics', {}),
            'error_rate': handler_metrics.get('performance_metrics', {}).get('error_rate', 0)
        })
    
    # Add security metrics
    security_metrics = {}
    for correlation_id, violation in SECURITY_VIOLATION_TRACKER.items():
        violation_type = violation.get('type', 'unknown')
        if violation_type not in security_metrics:
            security_metrics[violation_type] = 0
        security_metrics[violation_type] += 1
    
    metrics['security_metrics'] = security_metrics
    
    # Calculate trends and recommendations
    metrics['recommendations'] = _generate_error_recommendations(metrics)
    
    return metrics


def _generate_error_recommendations(metrics: Dict[str, Any]) -> List[str]:
    """
    Generates error handling recommendations based on metrics analysis.
    """
    recommendations = []
    
    # Check error rate
    error_rate = metrics.get('error_rate', 0)
    if error_rate > 0.1:  # More than 10% error rate
        recommendations.append("High error rate detected - investigate common error patterns")
    
    # Check security violations
    security_violations = metrics.get('security_violations', 0)
    if security_violations > 10:
        recommendations.append("Multiple security violations detected - review security policies")
    
    # Check most common errors
    error_by_type = metrics.get('error_by_type', {})
    if error_by_type:
        most_common = max(error_by_type.items(), key=lambda x: x[1])
        if most_common[1] > 50:  # More than 50 occurrences
            recommendations.append(f"High frequency of {most_common[0]} errors - investigate root cause")
    
    if not recommendations:
        recommendations.append("Error patterns within normal range - continue monitoring")
    
    return recommendations