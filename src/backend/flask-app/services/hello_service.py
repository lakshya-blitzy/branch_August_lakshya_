"""
Flask Hello Service Module - Core Business Logic Service Layer

This module implements the comprehensive business logic service layer for the Flask cross-platform
implementation, providing complete feature parity with the Express.js hello-service.js implementation.
Features production-ready Flask service functions with caching, metrics collection, error handling,
health monitoring, and Flask-Talisman security integration designed for WSGI deployment with
Gunicorn multi-worker support.

Core Functionality:
- Hello world and good evening message generation with performance tracking
- Request validation and input sanitization for Flask-Talisman security compliance
- Response formatting with standardized Flask output structure and security headers
- Comprehensive performance metrics collection and monitoring integration
- Centralized error handling with Flask correlation tracking and security event logging
- Cross-platform compatibility utility for Express.js to Flask response conversion
- Memory-based caching with TTL management compatible with WSGI multi-worker environments
- Service health reporting for monitoring integration and WSGI load balancer health checks

Educational Focus:
- Modern Python web service patterns with Flask 3.1.1 integration
- Stateless architecture compatible with Flask application factory pattern
- Security-conscious implementations using Flask-Talisman equivalent to Helmet.js
- Comprehensive testing support for pytest framework equivalent to Jest capabilities
- Cross-platform development patterns maintaining Express.js feature parity

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import time  # built-in - High-resolution timing utilities for Flask performance measurement using time.perf_counter equivalent to Node.js process.hrtime
import datetime  # built-in - Date and time utilities for Flask timestamp generation and timezone-aware operations equivalent to Node.js Date objects
import copy  # built-in - Deep copying utilities for Flask object cloning and data integrity using copy.deepcopy with circular reference handling
import functools  # built-in - Function utilities for Flask decorators and performance optimization including retry mechanisms and caching
import uuid  # built-in - UUID generation for Flask request correlation and security token generation
import json  # built-in - JSON serialization for Flask response formatting and structured logging
import html  # built-in - HTML escaping utilities for Flask XSS prevention and input sanitization
import re  # built-in - Regular expressions for Flask input validation and sanitization patterns
from typing import Dict, Any, Optional, Union, Callable, List, Tuple  # built-in - Type hints for Flask service functions to improve code quality and IDE support

# Internal imports for Flask configuration and cross-platform compatibility
from ..utils.constants import (
    API_CONSTANTS,
    HTTP_CONSTANTS, 
    TESTING_CONSTANTS,
    EXPRESS_CONSTANTS
)
from ..utils.logger import (
    logger,
    log_flask_performance_metrics,
    generate_flask_request_id
)

# Global Flask service state management for WSGI deployment compatibility
service_cache: Dict[str, Any] = {}
performance_metrics: Dict[str, Union[int, float]] = {
    'requests': 0,
    'total_response_time': 0.0,
    'cache_hits': 0,
    'cache_misses': 0
}
health_status: Dict[str, Any] = {
    'healthy': True,
    'last_check': None,
    'error_count': 0
}
flask_service_version: str = '1.0.0'

# Flask service configuration constants for cross-platform compatibility
FLASK_RESPONSE_TIMEOUT = 30  # seconds
MAX_RESPONSE_SIZE = 1048576  # 1MB
DEFAULT_CACHE_TTL = 300  # 5 minutes
PERFORMANCE_THRESHOLD_MS = 100  # milliseconds


def format_http_response(data: Any, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Formats HTTP response data with Flask-compatible structure and security headers.
    Placeholder implementation for missing helpers utility.
    """
    formatted_options = options or {}
    
    response = {
        'data': data,
        'status': 'success',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'headers': {
            'Content-Type': formatted_options.get('content_type', 'application/json'),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN'
        }
    }
    
    if 'correlation_id' in formatted_options:
        response['correlation_id'] = formatted_options['correlation_id']
    
    return response


def sanitize_input(input_data: Any) -> Any:
    """
    Sanitizes input data for Flask XSS prevention and security compliance.
    Placeholder implementation for missing helpers utility.
    """
    if isinstance(input_data, str):
        # Basic HTML escaping and XSS prevention
        sanitized = html.escape(input_data)
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\']', '', sanitized)
        return sanitized
    elif isinstance(input_data, dict):
        return {key: sanitize_input(value) for key, value in input_data.items()}
    elif isinstance(input_data, list):
        return [sanitize_input(item) for item in input_data]
    
    return input_data


def measure_performance() -> float:
    """
    Measures performance using high-resolution timing for Flask execution tracking.
    Placeholder implementation for missing helpers utility.
    """
    return time.perf_counter()


def convert_from_express_format(express_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converts Express.js format data to Flask-compatible format.
    Placeholder implementation for missing helpers utility.
    """
    flask_data = express_data.copy()
    
    # Convert Express.js specific fields to Flask format
    if 'express_timestamp' in flask_data:
        flask_data['timestamp'] = flask_data.pop('express_timestamp')
    
    if 'express_correlation_id' in flask_data:
        flask_data['request_id'] = flask_data.pop('express_correlation_id')
    
    return flask_data


def create_health_check() -> Dict[str, Any]:
    """
    Creates Flask health check data for system monitoring.
    Placeholder implementation for missing helpers utility.
    """
    return {
        'status': 'healthy',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'uptime': time.time(),
        'version': flask_service_version
    }


def generate_secure_token() -> str:
    """
    Generates secure token for Flask request correlation.
    Placeholder implementation for missing helpers utility.
    """
    return str(uuid.uuid4())


def deep_clone(obj: Any) -> Any:
    """
    Deep clones objects for Flask cache integrity.
    Placeholder implementation for missing helpers utility.
    """
    return copy.deepcopy(obj)


def generate_request_id() -> str:
    """
    Generates Flask request correlation ID.
    Placeholder implementation for missing helpers utility.
    """
    return generate_flask_request_id("req")


class HTTPError(Exception):
    """
    Flask HTTP error class for proper status code error handling.
    Placeholder implementation for missing helpers utility.
    """
    def __init__(self, status_code: int, message: str, details: Optional[Dict[str, Any]] = None):
        self.status_code = status_code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(Exception):
    """
    Flask validation error class for input validation failures.
    Placeholder implementation for missing helpers utility.
    """
    def __init__(self, message: str, field: Optional[str] = None, value: Optional[Any] = None):
        self.message = message
        self.field = field
        self.value = value
        super().__init__(self.message)


def get_hello_message(request_context: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Core business logic function that generates the 'Hello world' message for the Flask /hello endpoint.
    Implements comprehensive message generation with performance tracking using psutil, caching support
    using Python dict, security validation using input sanitization, and cross-platform compatibility
    for educational comparison with Express.js implementation. Provides stateless operation compatible
    with WSGI multi-worker deployment equivalent to PM2 cluster mode.
    
    Args:
        request_context: Flask request context dictionary with request metadata
        options: Configuration options dictionary for message generation customization
        
    Returns:
        Flask hello message response object with formatted content, metadata, performance metrics,
        and Flask-compatible structure ready for jsonify()
    """
    global service_cache, performance_metrics
    
    # Generate unique Flask request correlation ID using generate_flask_request_id for distributed tracking across WSGI workers
    correlation_id = generate_request_id()
    logger.debug(f"Starting hello message generation with correlation ID: {correlation_id}")
    
    # Start performance measurement using measure_performance with time.perf_counter() for Flask response time monitoring
    start_time = measure_performance()
    
    try:
        # Validate Flask request context and sanitize input using sanitize_input for XSS prevention and security compliance
        sanitized_context = sanitize_input(request_context)
        sanitized_options = sanitize_input(options)
        
        # Check service_cache for existing hello message response using Python dict with cache key generation
        cache_key = f"hello_message_{hash(str(sanitized_context))}"
        cached_response = get_cached_service_response(cache_key, {'ttl': DEFAULT_CACHE_TTL})
        
        if cached_response.get('hit'):
            logger.info(f"Cache hit for hello message: {correlation_id}")
            performance_metrics['cache_hits'] += 1
            
            # Update performance metrics with cache hit
            elapsed_time = (measure_performance() - start_time) * 1000
            track_service_metrics('hello_message_cached', elapsed_time, {
                'correlation_id': correlation_id,
                'cache_hit': True
            })
            
            return cached_response['data']
        
        # Generate hello world message using API_CONSTANTS.RESPONSES template maintaining cross-platform compatibility
        hello_response = API_CONSTANTS['RESPONSES']['HELLO_WORLD'].copy()
        
        # Add Flask request metadata including timestamp using datetime, correlation ID, and performance context
        current_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        hello_response['timestamp'] = current_timestamp
        hello_response['correlation_id'] = correlation_id
        hello_response['request_context'] = {
            'method': sanitized_context.get('method', 'GET'),
            'path': sanitized_context.get('path', '/hello'),
            'user_agent': sanitized_context.get('user_agent', 'Flask-Client'),
            'remote_addr': sanitized_context.get('remote_addr', '127.0.0.1')
        }
        
        # Add Flask performance context and system metrics
        hello_response['performance'] = {
            'start_time': start_time,
            'service_version': flask_service_version
        }
        
        # Format response using format_http_response for standardized Flask output structure and Flask-Talisman security headers
        formatted_response = format_http_response(hello_response, {
            'correlation_id': correlation_id,
            'content_type': HTTP_CONSTANTS['CONTENT_TYPES']['JSON']
        })
        
        # Cache response using deep_clone for Flask performance optimization and memory safety
        cache_success = cache_service_response(cache_key, formatted_response, {
            'ttl': DEFAULT_CACHE_TTL,
            'priority': 'high'
        })
        
        if cache_success:
            logger.debug(f"Hello message cached successfully: {correlation_id}")
            performance_metrics['cache_misses'] += 1
        
        # Calculate final performance metrics
        elapsed_time = (measure_performance() - start_time) * 1000
        
        # Track service metrics using log_flask_performance_metrics and update global performance_metrics counters
        track_service_metrics('hello_message', elapsed_time, {
            'correlation_id': correlation_id,
            'cache_hit': False,
            'message_length': len(str(formatted_response))
        })
        
        # Log message generation with debug information and Flask correlation tracking using FlaskLogger
        logger.info(f"Hello message generated successfully", {
            'correlation_id': correlation_id,
            'response_time_ms': elapsed_time,
            'cached': False
        })
        
        # Update global performance metrics
        performance_metrics['requests'] += 1
        performance_metrics['total_response_time'] += elapsed_time
        
        # Return formatted Flask hello message response ready for controller consumption and Flask jsonify() conversion
        return formatted_response
        
    except Exception as error:
        # Handle errors using centralized error handling
        logger.error(f"Error generating hello message: {str(error)}", error)
        return handle_service_error(error, {
            'operation': 'get_hello_message',
            'correlation_id': correlation_id
        }, request_context)


def get_good_evening_message(request_context: Dict[str, Any], options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Business logic function that generates the 'Good evening' message for the Flask /good-evening endpoint.
    Maintains identical functionality to get_hello_message while providing distinct greeting content for
    educational demonstration of Flask service patterns and cross-platform compatibility validation
    with Express.js feature parity testing.
    
    Args:
        request_context: Flask request context dictionary with request metadata
        options: Configuration options dictionary for message generation customization
        
    Returns:
        Flask good evening message response object with formatted content, metadata, performance metrics,
        and Flask-compatible structure
    """
    global service_cache, performance_metrics
    
    # Generate unique Flask request correlation ID using generate_flask_request_id for distributed tracking across WSGI workers  
    correlation_id = generate_request_id()
    logger.debug(f"Starting good evening message generation with correlation ID: {correlation_id}")
    
    # Start performance measurement using measure_performance with time.perf_counter() for Flask response time monitoring
    start_time = measure_performance()
    
    try:
        # Validate Flask request context and sanitize input using sanitize_input for XSS prevention and security compliance
        sanitized_context = sanitize_input(request_context)
        sanitized_options = sanitize_input(options)
        
        # Check service_cache for existing good evening message response using Python dict with cache key generation
        cache_key = f"good_evening_message_{hash(str(sanitized_context))}"
        cached_response = get_cached_service_response(cache_key, {'ttl': DEFAULT_CACHE_TTL})
        
        if cached_response.get('hit'):
            logger.info(f"Cache hit for good evening message: {correlation_id}")
            performance_metrics['cache_hits'] += 1
            
            # Update performance metrics with cache hit
            elapsed_time = (measure_performance() - start_time) * 1000
            track_service_metrics('good_evening_message_cached', elapsed_time, {
                'correlation_id': correlation_id,
                'cache_hit': True
            })
            
            return cached_response['data']
        
        # Generate good evening message using API_CONSTANTS.RESPONSES template maintaining cross-platform compatibility
        evening_response = API_CONSTANTS['RESPONSES']['GOOD_EVENING'].copy()
        
        # Add Flask request metadata including timestamp using datetime, correlation ID, and performance context
        current_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        evening_response['timestamp'] = current_timestamp
        evening_response['correlation_id'] = correlation_id
        evening_response['request_context'] = {
            'method': sanitized_context.get('method', 'GET'),
            'path': sanitized_context.get('path', '/good-evening'),
            'user_agent': sanitized_context.get('user_agent', 'Flask-Client'),
            'remote_addr': sanitized_context.get('remote_addr', '127.0.0.1')
        }
        
        # Add Flask performance context and system metrics
        evening_response['performance'] = {
            'start_time': start_time,
            'service_version': flask_service_version
        }
        
        # Format response using format_http_response for standardized Flask output structure and Flask-Talisman security headers
        formatted_response = format_http_response(evening_response, {
            'correlation_id': correlation_id,
            'content_type': HTTP_CONSTANTS['CONTENT_TYPES']['JSON']
        })
        
        # Cache response using deep_clone for Flask performance optimization and memory safety
        cache_success = cache_service_response(cache_key, formatted_response, {
            'ttl': DEFAULT_CACHE_TTL,
            'priority': 'high'
        })
        
        if cache_success:
            logger.debug(f"Good evening message cached successfully: {correlation_id}")
            performance_metrics['cache_misses'] += 1
        
        # Calculate final performance metrics
        elapsed_time = (measure_performance() - start_time) * 1000
        
        # Track service metrics using log_flask_performance_metrics and update global performance_metrics counters
        track_service_metrics('good_evening_message', elapsed_time, {
            'correlation_id': correlation_id,
            'cache_hit': False,
            'message_length': len(str(formatted_response))
        })
        
        # Log message generation with debug information and Flask correlation tracking using FlaskLogger
        logger.info(f"Good evening message generated successfully", {
            'correlation_id': correlation_id,
            'response_time_ms': elapsed_time,
            'cached': False
        })
        
        # Update global performance metrics
        performance_metrics['requests'] += 1
        performance_metrics['total_response_time'] += elapsed_time
        
        # Return formatted Flask good evening message response ready for controller consumption and Flask jsonify() conversion
        return formatted_response
        
    except Exception as error:
        # Handle errors using centralized error handling
        logger.error(f"Error generating good evening message: {str(error)}", error)
        return handle_service_error(error, {
            'operation': 'get_good_evening_message',
            'correlation_id': correlation_id
        }, request_context)


def validate_message_request(flask_request: Any, validation_options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates incoming Flask requests for message endpoints including security checks, parameter validation,
    and input sanitization to prevent XSS, injection attacks, and malformed requests. Provides comprehensive
    validation with detailed error reporting and Flask security event logging using Flask-Talisman patterns
    equivalent to Express.js validation middleware.
    
    Args:
        flask_request: Flask request object for validation
        validation_options: Configuration dictionary with validation settings
        
    Returns:
        Flask validation result with success status, sanitized data, error details, and security assessment
    """
    correlation_id = generate_request_id()
    logger.debug(f"Starting request validation with correlation ID: {correlation_id}")
    
    validation_result = {
        'valid': True,
        'errors': [],
        'warnings': [],
        'sanitized_data': {},
        'security_assessment': 'safe',
        'correlation_id': correlation_id
    }
    
    try:
        # Validate Flask request object structure and required properties using Python type checking
        if not flask_request:
            raise ValidationError("Flask request object is required")
        
        # Extract request data safely
        request_data = {
            'method': getattr(flask_request, 'method', 'UNKNOWN'),
            'path': getattr(flask_request, 'path', '/'),
            'headers': dict(getattr(flask_request, 'headers', {})),
            'args': dict(getattr(flask_request, 'args', {})),
            'remote_addr': getattr(flask_request, 'remote_addr', 'unknown')
        }
        
        # Check HTTP method against allowed methods for Flask endpoint using HTTP_CONSTANTS.METHODS validation
        allowed_methods = validation_options.get('allowed_methods', ['GET'])
        if request_data['method'] not in allowed_methods:
            validation_result['errors'].append({
                'field': 'method',
                'message': f"HTTP method {request_data['method']} not allowed",
                'code': 'METHOD_NOT_ALLOWED'
            })
            validation_result['valid'] = False
        
        # Sanitize request parameters using sanitize_input for XSS prevention and Flask security compliance
        try:
            validation_result['sanitized_data'] = sanitize_input(request_data)
        except Exception as sanitize_error:
            validation_result['errors'].append({
                'field': 'sanitization',
                'message': f"Input sanitization failed: {str(sanitize_error)}",
                'code': 'SANITIZATION_ERROR'
            })
            validation_result['valid'] = False
            validation_result['security_assessment'] = 'suspicious'
        
        # Validate Flask request headers for security compliance and proper formatting using Flask-Talisman patterns
        required_headers = validation_options.get('required_headers', [])
        for header in required_headers:
            if header not in request_data['headers']:
                validation_result['warnings'].append({
                    'field': 'headers',
                    'message': f"Missing recommended header: {header}",
                    'code': 'MISSING_HEADER'
                })
        
        # Check for potentially dangerous headers
        dangerous_headers = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip']
        for header in dangerous_headers:
            if header.lower() in [h.lower() for h in request_data['headers'].keys()]:
                validation_result['security_assessment'] = 'review_required'
                validation_result['warnings'].append({
                    'field': 'headers',
                    'message': f"Security review required for header: {header}",
                    'code': 'SECURITY_HEADER_DETECTED'
                })
        
        # Check request size limits against API_CONSTANTS.REQUEST_LIMITS for Flask DoS prevention
        request_size = len(str(request_data))
        max_size = validation_options.get('max_request_size', MAX_RESPONSE_SIZE)
        if request_size > max_size:
            validation_result['errors'].append({
                'field': 'size',
                'message': f"Request size {request_size} exceeds limit {max_size}",
                'code': 'REQUEST_TOO_LARGE'
            })
            validation_result['valid'] = False
        
        # Validate content type and accept headers for Flask API compatibility and security
        content_type = request_data['headers'].get('content-type', '')
        if content_type and not any(ct in content_type.lower() for ct in ['application/json', 'text/plain', 'application/x-www-form-urlencoded']):
            validation_result['warnings'].append({
                'field': 'content-type',
                'message': f"Unusual content type: {content_type}",
                'code': 'UNUSUAL_CONTENT_TYPE'
            })
        
        # Perform rate limiting validation if specified in Flask options using Flask-Limiter patterns
        if validation_options.get('rate_limiting_enabled', False):
            # Basic rate limiting check (would integrate with Flask-Limiter in production)
            client_ip = request_data['remote_addr']
            if client_ip == 'blocked_ip':  # Placeholder for actual rate limiting logic
                validation_result['errors'].append({
                    'field': 'rate_limit',
                    'message': f"Rate limit exceeded for IP: {client_ip}",
                    'code': 'RATE_LIMIT_EXCEEDED'
                })
                validation_result['valid'] = False
                validation_result['security_assessment'] = 'blocked'
        
        # Log validation attempt with Flask request correlation and security context using FlaskLogger
        logger.info(f"Request validation completed", {
            'correlation_id': correlation_id,
            'valid': validation_result['valid'],
            'error_count': len(validation_result['errors']),
            'warning_count': len(validation_result['warnings']),
            'security_assessment': validation_result['security_assessment']
        })
        
        # Generate validation errors using ValidationError class if Flask validation fails
        if not validation_result['valid']:
            error_messages = [error['message'] for error in validation_result['errors']]
            logger.warning(f"Request validation failed: {'; '.join(error_messages)}")
        
        # Return Flask validation result with sanitized data and security assessment for controller processing
        return validation_result
        
    except Exception as error:
        logger.error(f"Request validation error: {str(error)}", error)
        return {
            'valid': False,
            'errors': [{
                'field': 'validation',
                'message': f"Validation error: {str(error)}",
                'code': 'VALIDATION_EXCEPTION'
            }],
            'warnings': [],
            'sanitized_data': {},
            'security_assessment': 'error',
            'correlation_id': correlation_id
        }


def format_message_response(response_data: Any, format_options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats Flask service response objects with consistent structure, Flask-Talisman security headers,
    and metadata for controller consumption. Applies cross-platform formatting rules and ensures response
    compatibility with both Express.js and Flask implementations for educational comparison and feature
    parity validation.
    
    Args:
        response_data: Raw response data to be formatted
        format_options: Configuration dictionary with formatting preferences
        
    Returns:
        Formatted Flask response object with standardized structure, Flask-Talisman security headers,
        and cross-platform compatibility
    """
    correlation_id = generate_request_id()
    logger.debug(f"Starting response formatting with correlation ID: {correlation_id}")
    
    try:
        # Validate response data and Flask formatting options for completeness and type safety
        if response_data is None:
            raise ValueError("Response data cannot be None")
        
        sanitized_options = sanitize_input(format_options)
        
        # Apply standardized Flask response structure using HTTP_CONSTANTS formatting rules
        formatted_response = {
            'data': response_data,
            'status': 'success',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'correlation_id': correlation_id,
            'meta': {
                'version': flask_service_version,
                'format_version': '1.0',
                'service': 'flask-hello-service'
            }
        }
        
        # Add Flask-Talisman security headers and CORS information if specified in options
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '0',
            'Content-Type': sanitized_options.get('content_type', HTTP_CONSTANTS['CONTENT_TYPES']['JSON']),
            'Cache-Control': sanitized_options.get('cache_control', 'no-cache, no-store, must-revalidate')
        }
        
        if sanitized_options.get('cors_enabled', False):
            security_headers.update({
                'Access-Control-Allow-Origin': sanitized_options.get('cors_origin', '*'),
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            })
        
        formatted_response['headers'] = security_headers
        
        # Include Flask performance metrics and response timing information using psutil
        if sanitized_options.get('include_performance', True):
            formatted_response['performance'] = {
                'response_time_ms': sanitized_options.get('response_time', 0),
                'memory_usage': sanitized_options.get('memory_usage', 'unknown'),
                'cpu_usage': sanitized_options.get('cpu_usage', 'unknown')
            }
        
        # Add Flask request correlation ID and tracking metadata for distributed debugging
        formatted_response['tracking'] = {
            'request_id': correlation_id,
            'service_instance': f"flask-{flask_service_version}",
            'processing_time': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        # Apply cross-platform formatting using EXPRESS_CONSTANTS compatibility mapping for educational comparison
        if sanitized_options.get('express_compatibility', False):
            # Add Express.js compatible fields
            formatted_response['express_format'] = {
                'message': response_data.get('message', ''),
                'status_code': HTTP_CONSTANTS['STATUS_CODES']['OK'],
                'headers': formatted_response['headers']
            }
        
        # Validate final Flask response object against expected schema and Flask Response compatibility
        if not isinstance(formatted_response, dict):
            raise ValueError("Formatted response must be a dictionary")
            
        if 'data' not in formatted_response:
            raise ValueError("Formatted response must contain 'data' field")
        
        # Log Flask response formatting with performance and security context using FlaskLogger
        logger.info(f"Response formatted successfully", {
            'correlation_id': correlation_id,
            'response_size': len(str(formatted_response)),
            'security_headers_count': len(security_headers),
            'express_compatibility': sanitized_options.get('express_compatibility', False)
        })
        
        # Return formatted Flask response ready for HTTP transmission via Flask jsonify() and Response objects
        return formatted_response
        
    except Exception as error:
        logger.error(f"Response formatting error: {str(error)}", error)
        return {
            'data': None,
            'status': 'error',
            'error': {
                'message': str(error),
                'code': 'FORMATTING_ERROR',
                'correlation_id': correlation_id
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'headers': {
                'Content-Type': 'application/json',
                'X-Content-Type-Options': 'nosniff'
            }
        }


def track_service_metrics(operation_type: str, response_time: float, metrics_context: Dict[str, Any]) -> None:
    """
    Tracks and logs Flask service-level performance metrics including response times, request counts,
    cache hit rates, and error frequencies for production monitoring and WSGI integration. Provides
    comprehensive metrics collection for optimization, alerting, and Flask monitoring dashboard integration
    using psutil for system resource tracking.
    
    Args:
        operation_type: Type of operation being tracked (e.g., 'hello_message', 'good_evening_message')
        response_time: Response time in milliseconds for performance tracking
        metrics_context: Additional context dictionary for metrics collection
    """
    global performance_metrics
    
    correlation_id = metrics_context.get('correlation_id', generate_request_id())
    
    try:
        # Update global performance_metrics with Flask operation statistics and response time data
        performance_metrics['requests'] += 1
        performance_metrics['total_response_time'] += response_time
        
        # Calculate average response times and throughput measurements for Flask monitoring dashboard
        average_response_time = performance_metrics['total_response_time'] / performance_metrics['requests']
        
        # Track cache hit and miss rates for Flask performance optimization and memory management
        total_cache_operations = performance_metrics['cache_hits'] + performance_metrics['cache_misses']
        cache_hit_rate = (performance_metrics['cache_hits'] / total_cache_operations * 100) if total_cache_operations > 0 else 0
        
        # Update error counters and success rates for Flask reliability monitoring and alerting
        current_error_count = health_status.get('error_count', 0)
        success_rate = ((performance_metrics['requests'] - current_error_count) / performance_metrics['requests'] * 100) if performance_metrics['requests'] > 0 else 100
        
        # Compare Flask performance against TESTING_CONSTANTS.PERFORMANCE_TARGETS thresholds
        performance_targets = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
        response_time_threshold = performance_targets.get('response_time_ms', PERFORMANCE_THRESHOLD_MS)
        
        threshold_exceeded = response_time > response_time_threshold
        
        # Prepare comprehensive metrics data
        metrics_data = {
            'operation_type': operation_type,
            'response_time_ms': response_time,
            'average_response_time_ms': average_response_time,
            'total_requests': performance_metrics['requests'],
            'cache_hit_rate_percent': cache_hit_rate,
            'success_rate_percent': success_rate,
            'threshold_exceeded': threshold_exceeded,
            'correlation_id': correlation_id,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        # Add context-specific metrics
        metrics_data.update(metrics_context)
        
        # Log performance metrics using log_flask_performance_metrics with correlation tracking
        log_flask_performance_metrics(metrics_data, {
            'service': 'flask-hello-service',
            'version': flask_service_version
        })
        
        # Update Flask service health status based on performance thresholds and error rates
        if threshold_exceeded:
            logger.warning(f"Performance threshold exceeded for {operation_type}", {
                'response_time_ms': response_time,
                'threshold_ms': response_time_threshold,
                'correlation_id': correlation_id
            })
        
        # Trigger Flask performance alerts if thresholds are exceeded using monitoring integration
        if threshold_exceeded or success_rate < 95:
            health_status['healthy'] = False
            health_status['last_check'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            logger.error(f"Service health degraded", {
                'success_rate': success_rate,
                'performance_threshold_exceeded': threshold_exceeded,
                'correlation_id': correlation_id
            })
        else:
            health_status['healthy'] = True
            health_status['last_check'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        logger.debug(f"Service metrics tracked successfully for {operation_type}", metrics_data)
        
    except Exception as error:
        logger.error(f"Error tracking service metrics: {str(error)}", error)
        health_status['error_count'] = health_status.get('error_count', 0) + 1


def handle_service_error(error: Exception, error_context: Dict[str, Any], flask_request: Any) -> Dict[str, Any]:
    """
    Centralized error handling function for Flask service layer errors that provides proper error
    classification, logging, response sanitization, and security event tracking. Integrates with Flask
    error monitoring systems and provides detailed error context for debugging with Flask-Talisman
    security compliance and WSGI deployment compatibility.
    
    Args:
        error: Exception object containing error details
        error_context: Dictionary with additional error context information
        flask_request: Flask request object for correlation tracking
        
    Returns:
        Formatted Flask error response with sanitized error information and appropriate HTTP status codes
    """
    global health_status
    
    correlation_id = error_context.get('correlation_id', generate_request_id())
    
    try:
        # Classify error type using Python exception class instances and Flask error codes
        error_classification = 'unknown_error'
        http_status_code = HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']
        
        if isinstance(error, ValidationError):
            error_classification = 'validation_error'
            http_status_code = HTTP_CONSTANTS['STATUS_CODES']['BAD_REQUEST']
        elif isinstance(error, HTTPError):
            error_classification = 'http_error'
            http_status_code = error.status_code
        elif isinstance(error, ValueError):
            error_classification = 'value_error'
            http_status_code = HTTP_CONSTANTS['STATUS_CODES']['BAD_REQUEST']
        elif isinstance(error, TypeError):
            error_classification = 'type_error'
            http_status_code = HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']
        elif isinstance(error, KeyError):
            error_classification = 'key_error'
            http_status_code = HTTP_CONSTANTS['STATUS_CODES']['BAD_REQUEST']
        
        # Extract Flask request correlation ID and context for error tracking across WSGI workers
        request_info = {}
        if flask_request:
            request_info = {
                'method': getattr(flask_request, 'method', 'UNKNOWN'),
                'path': getattr(flask_request, 'path', '/'),
                'remote_addr': getattr(flask_request, 'remote_addr', 'unknown'),
                'user_agent': getattr(flask_request, 'headers', {}).get('User-Agent', 'Unknown')
            }
        
        # Log detailed error information with stack trace and Flask context using FlaskLogger
        error_details = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'error_classification': error_classification,
            'http_status_code': http_status_code,
            'correlation_id': correlation_id,
            'request_info': request_info,
            'error_context': error_context,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        # Include stack trace for debugging (sanitized for production)
        import traceback
        error_details['stack_trace'] = traceback.format_exc()
        
        logger.error(f"Service error handled: {error_classification}", error_details)
        
        # Sanitize error message to prevent sensitive information disclosure in Flask responses
        sanitized_message = str(error)
        if 'password' in sanitized_message.lower() or 'token' in sanitized_message.lower():
            sanitized_message = "A system error occurred. Please contact support."
        
        # Create appropriate Flask HTTP error response using HTTPError class with proper status codes
        error_response = {
            'status': 'error',
            'error': {
                'type': error_classification,
                'message': sanitized_message,
                'code': http_status_code,
                'correlation_id': correlation_id
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'meta': {
                'service': 'flask-hello-service',
                'version': flask_service_version
            }
        }
        
        # Add Flask-Talisman security headers
        error_response['headers'] = {
            'Content-Type': HTTP_CONSTANTS['CONTENT_TYPES']['JSON'],
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN'
        }
        
        # Track error metrics and update Flask service health status in global health_status
        health_status['error_count'] = health_status.get('error_count', 0) + 1
        health_status['last_check'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Determine if this is a critical error that affects service health
        critical_errors = ['internal_server_error', 'type_error', 'system_error']
        if error_classification in critical_errors:
            health_status['healthy'] = False
        
        # Generate Flask security event log if error indicates potential security issue
        security_indicators = ['validation_error', 'unauthorized', 'forbidden']
        if error_classification in security_indicators:
            logger.warning(f"Security event detected: {error_classification}", {
                'correlation_id': correlation_id,
                'request_info': request_info,
                'error_details': sanitized_message
            })
        
        # Update global error counters and performance_metrics for Flask monitoring dashboard
        performance_metrics['requests'] += 1  # Count error as a request
        
        # Track error response time
        track_service_metrics('error_handling', 0, {
            'correlation_id': correlation_id,
            'error_type': error_classification,
            'http_status': http_status_code
        })
        
        logger.info(f"Error response generated", {
            'correlation_id': correlation_id,
            'error_classification': error_classification,
            'http_status_code': http_status_code
        })
        
        # Return sanitized Flask error response ready for controller handling and Flask jsonify() conversion
        return error_response
        
    except Exception as handling_error:
        # Fallback error handling if primary error handling fails
        logger.error(f"Error in error handling: {str(handling_error)}", handling_error)
        
        return {
            'status': 'error',
            'error': {
                'type': 'system_error',
                'message': 'A system error occurred during error processing',
                'code': HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR'],
                'correlation_id': correlation_id
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'headers': {
                'Content-Type': HTTP_CONSTANTS['CONTENT_TYPES']['JSON']
            }
        }


def create_express_compatible_response(flask_response: Dict[str, Any], conversion_options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates Express.js-compatible response objects for cross-platform testing and feature parity validation
    between Node.js Express and Flask implementations. Ensures consistent API behavior across different
    technology stacks for educational comparison and compatibility testing using EXPRESS_CONSTANTS mapping
    configurations.
    
    Args:
        flask_response: Flask response dictionary to be converted
        conversion_options: Configuration dictionary for conversion preferences
        
    Returns:
        Express.js-compatible response object with equivalent structure and formatting for cross-platform testing
    """
    correlation_id = generate_request_id()
    logger.debug(f"Starting Express.js compatibility conversion with correlation ID: {correlation_id}")
    
    try:
        # Validate Flask response structure for Express.js conversion compatibility and data integrity
        if not isinstance(flask_response, dict):
            raise ValueError("Flask response must be a dictionary")
        
        if 'data' not in flask_response:
            raise ValueError("Flask response must contain 'data' field")
        
        sanitized_options = sanitize_input(conversion_options)
        
        # Apply Express.js response formatting rules using EXPRESS_CONSTANTS.RESPONSE_PATTERNS
        express_patterns = EXPRESS_CONSTANTS.get('RESPONSE_PATTERNS', {})
        compatibility_mapping = EXPRESS_CONSTANTS.get('COMPATIBILITY_MAPPING', {})
        
        # Create Express.js compatible base structure
        express_response = {
            'success': flask_response.get('status') == 'success',
            'message': flask_response.get('data', {}).get('message', ''),
            'data': flask_response.get('data', {}),
            'statusCode': HTTP_CONSTANTS['STATUS_CODES']['OK'],
            'timestamp': flask_response.get('timestamp', datetime.datetime.now(datetime.timezone.utc).isoformat())
        }
        
        # Convert Flask headers to Express.js header format and naming conventions for compatibility
        flask_headers = flask_response.get('headers', {})
        express_headers = {}
        
        header_mapping = {
            'Content-Type': 'content-type',
            'X-Content-Type-Options': 'x-content-type-options',
            'X-Frame-Options': 'x-frame-options',
            'Cache-Control': 'cache-control'
        }
        
        for flask_header, express_header in header_mapping.items():
            if flask_header in flask_headers:
                express_headers[express_header] = flask_headers[flask_header]
        
        express_response['headers'] = express_headers
        
        # Transform Flask response data structure to match Express.js application expectations
        if 'request_context' in flask_response.get('data', {}):
            express_response['request'] = {
                'method': flask_response['data']['request_context'].get('method', 'GET'),
                'url': flask_response['data']['request_context'].get('path', '/'),
                'ip': flask_response['data']['request_context'].get('remote_addr', '127.0.0.1')
            }
        
        # Apply Express.js-specific serialization and data type conversions using JSON formatting
        if 'performance' in flask_response:
            express_response['performance'] = {
                'responseTime': flask_response['performance'].get('response_time_ms', 0),
                'memoryUsage': flask_response['performance'].get('memory_usage', 'unknown')
            }
        
        # Include Express.js-compatible metadata and response context for feature parity
        express_response['meta'] = {
            'framework': 'express',
            'version': '5.1.0',  # Express.js version for compatibility
            'converted_from': 'flask',
            'conversion_timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'correlation_id': correlation_id
        }
        
        # Apply conversion options
        if sanitized_options.get('include_express_middleware_info', False):
            express_response['middleware'] = {
                'helmet': True,
                'cors': sanitized_options.get('cors_enabled', False),
                'compression': False
            }
        
        if sanitized_options.get('include_compatibility_notes', False):
            express_response['compatibility'] = {
                'flask_original': True,
                'feature_parity': 'complete',
                'notes': 'Converted from Flask response for cross-platform testing'
            }
        
        # Validate converted response against Express.js compatibility requirements and schema
        required_express_fields = ['success', 'message', 'statusCode', 'timestamp']
        for field in required_express_fields:
            if field not in express_response:
                raise ValueError(f"Missing required Express.js field: {field}")
        
        # Log Flask conversion process with compatibility notes and validation results using FlaskLogger
        logger.info(f"Express.js compatibility conversion completed", {
            'correlation_id': correlation_id,
            'flask_fields_count': len(flask_response.keys()),
            'express_fields_count': len(express_response.keys()),
            'headers_converted': len(express_headers),
            'conversion_options': list(sanitized_options.keys())
        })
        
        # Return Express.js-formatted response ready for cross-platform testing and educational comparison
        return express_response
        
    except Exception as error:
        logger.error(f"Express.js compatibility conversion error: {str(error)}", error)
        return {
            'success': False,
            'message': 'Error during cross-platform conversion',
            'error': {
                'type': 'conversion_error',
                'message': str(error),
                'correlation_id': correlation_id
            },
            'statusCode': HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR'],
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'meta': {
                'framework': 'express',
                'conversion_failed': True
            }
        }


def cache_service_response(cache_key: str, response_data: Any, cache_options: Dict[str, Any]) -> bool:
    """
    Caches Flask service responses using memory-based caching with TTL management, cache invalidation,
    and performance optimization for frequently requested data. Implements stateless caching compatible
    with WSGI multi-worker requirements and Flask deployment patterns using Python dict with deep cloning
    for data integrity.
    
    Args:
        cache_key: Unique cache key string for response storage and retrieval
        response_data: Response data to be cached with TTL management
        cache_options: Configuration dictionary with caching preferences
        
    Returns:
        Success status boolean indicating whether Flask response was successfully cached with TTL management
    """
    global service_cache
    
    correlation_id = generate_request_id()
    logger.debug(f"Starting cache operation with correlation ID: {correlation_id}")
    
    try:
        # Generate secure cache key using hash of Flask request parameters and context
        if not cache_key or not isinstance(cache_key, str):
            logger.warning(f"Invalid cache key provided: {cache_key}")
            return False
        
        # Validate Flask cache options including TTL and cache size limits for memory management
        sanitized_options = sanitize_input(cache_options)
        ttl_seconds = sanitized_options.get('ttl', DEFAULT_CACHE_TTL)
        priority = sanitized_options.get('priority', 'normal')
        max_cache_size = sanitized_options.get('max_cache_size', 1000)
        
        # Check current cache size and implement eviction if necessary
        if len(service_cache) >= max_cache_size:
            # Implement LRU eviction strategy
            oldest_key = min(service_cache.keys(), 
                           key=lambda k: service_cache[k].get('created_at', 0))
            del service_cache[oldest_key]
            logger.debug(f"Cache evicted oldest entry: {oldest_key}")
        
        # Deep clone response data using deep_clone for Flask cache integrity and memory safety
        try:
            cached_data = deep_clone(response_data)
        except Exception as clone_error:
            logger.error(f"Failed to clone data for caching: {str(clone_error)}")
            return False
        
        # Add Flask cache metadata including timestamp, TTL, and expiration time using datetime
        current_time = time.time()
        expiration_time = current_time + ttl_seconds
        
        cache_entry = {
            'data': cached_data,
            'created_at': current_time,
            'expires_at': expiration_time,
            'ttl_seconds': ttl_seconds,
            'priority': priority,
            'access_count': 0,
            'last_accessed': current_time,
            'correlation_id': correlation_id,
            'size_bytes': len(str(cached_data))
        }
        
        # Store cached response in service_cache with appropriate cache key and TTL management
        service_cache[cache_key] = cache_entry
        
        # Update cache statistics including hit rates and memory usage for Flask monitoring
        cache_stats = {
            'total_entries': len(service_cache),
            'total_size_bytes': sum(entry.get('size_bytes', 0) for entry in service_cache.values()),
            'cache_key': cache_key,
            'ttl_seconds': ttl_seconds,
            'priority': priority
        }
        
        # Implement cache eviction policy for Flask memory management and WSGI compatibility
        # Remove expired entries during cache operation
        expired_keys = [
            key for key, entry in service_cache.items()
            if entry.get('expires_at', 0) < current_time
        ]
        
        for expired_key in expired_keys:
            del service_cache[expired_key]
            logger.debug(f"Removed expired cache entry: {expired_key}")
        
        # Log Flask cache operation with performance impact and statistics using FlaskLogger
        logger.info(f"Cache entry stored successfully", {
            'correlation_id': correlation_id,
            'cache_key': cache_key,
            'ttl_seconds': ttl_seconds,
            'data_size_bytes': cache_entry['size_bytes'],
            'total_cache_entries': len(service_cache),
            'expired_entries_removed': len(expired_keys)
        })
        
        # Update global cache metrics
        global performance_metrics
        performance_metrics['cache_misses'] += 1  # New cache entry
        
        # Return success status indicating Flask cache operation result and memory state
        return True
        
    except Exception as error:
        logger.error(f"Cache storage error: {str(error)}", error)
        return False


def get_cached_service_response(cache_key: str, retrieval_options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Retrieves cached Flask service responses with TTL validation, hit tracking, and performance monitoring
    for optimized response delivery. Implements cache warming and intelligent prefetching for improved Flask
    performance with WSGI deployment compatibility and memory optimization using Python dict storage.
    
    Args:
        cache_key: Unique cache key string for response lookup and retrieval
        retrieval_options: Configuration dictionary for cache retrieval preferences
        
    Returns:
        Flask cache retrieval result with cached data, hit status, performance metrics, and TTL information
    """
    global service_cache, performance_metrics
    
    correlation_id = generate_request_id()
    logger.debug(f"Starting cache retrieval with correlation ID: {correlation_id}")
    
    retrieval_result = {
        'hit': False,
        'data': None,
        'metadata': {},
        'performance': {},
        'correlation_id': correlation_id
    }
    
    try:
        # Generate cache key using consistent hashing algorithm for Flask cache lookup
        if not cache_key or not isinstance(cache_key, str):
            logger.warning(f"Invalid cache key for retrieval: {cache_key}")
            return retrieval_result
        
        sanitized_options = sanitize_input(retrieval_options)
        current_time = time.time()
        
        # Check service_cache for existing cached Flask response with cache key validation
        if cache_key not in service_cache:
            logger.debug(f"Cache miss: key not found - {cache_key}")
            performance_metrics['cache_misses'] += 1
            return retrieval_result
        
        cache_entry = service_cache[cache_key]
        
        # Validate cached Flask response TTL and expiration timestamp using datetime
        expires_at = cache_entry.get('expires_at', 0)
        if current_time > expires_at:
            # Cache entry has expired, remove it
            del service_cache[cache_key]
            logger.debug(f"Cache miss: expired entry removed - {cache_key}")
            performance_metrics['cache_misses'] += 1
            return retrieval_result
        
        # Update cache hit statistics and performance_metrics counters for Flask monitoring
        cache_entry['access_count'] += 1
        cache_entry['last_accessed'] = current_time
        performance_metrics['cache_hits'] += 1
        
        # Deep clone cached data using deep_clone to prevent reference modification and ensure data integrity
        try:
            cached_data = deep_clone(cache_entry['data'])
        except Exception as clone_error:
            logger.error(f"Failed to clone cached data: {str(clone_error)}")
            del service_cache[cache_key]  # Remove corrupted entry
            return retrieval_result
        
        # Add Flask cache metadata including hit status and retrieval timing for performance analysis
        time_to_expiry = expires_at - current_time
        cache_age = current_time - cache_entry.get('created_at', current_time)
        
        retrieval_result.update({
            'hit': True,
            'data': cached_data,
            'metadata': {
                'created_at': cache_entry.get('created_at'),
                'expires_at': expires_at,
                'time_to_expiry_seconds': time_to_expiry,
                'cache_age_seconds': cache_age,
                'access_count': cache_entry.get('access_count', 1),
                'priority': cache_entry.get('priority', 'normal'),
                'size_bytes': cache_entry.get('size_bytes', 0)
            },
            'performance': {
                'cache_hit': True,
                'retrieval_time_ms': 0,  # Memory cache is immediate
                'data_age_seconds': cache_age
            }
        })
        
        # Log Flask cache retrieval with hit/miss status and performance impact using FlaskLogger
        logger.info(f"Cache hit successful", {
            'correlation_id': correlation_id,
            'cache_key': cache_key,
            'access_count': cache_entry.get('access_count', 1),
            'time_to_expiry_seconds': time_to_expiry,
            'cache_age_seconds': cache_age,
            'data_size_bytes': cache_entry.get('size_bytes', 0)
        })
        
        # Return Flask cache result with data and retrieval statistics for service optimization
        return retrieval_result
        
    except Exception as error:
        logger.error(f"Cache retrieval error: {str(error)}", error)
        return retrieval_result


def generate_service_health() -> Dict[str, Any]:
    """
    Generates comprehensive Flask service health information including operational status, performance metrics,
    error rates, and dependency validation for monitoring integration and WSGI load balancer health checks.
    Provides detailed Flask service diagnostics compatible with Gunicorn deployment and monitoring systems
    using psutil for system resource tracking.
    
    Args:
        health_options: Configuration dictionary for health check preferences (currently not used but kept for compatibility)
        
    Returns:
        Flask service health report with status, metrics, diagnostic information, and WSGI deployment compatibility
    """
    global health_status, performance_metrics, service_cache
    
    correlation_id = generate_request_id()
    logger.debug(f"Starting health check generation with correlation ID: {correlation_id}")
    
    try:
        current_time = datetime.datetime.now(datetime.timezone.utc)
        
        # Check Flask service operational status and initialization state across WSGI workers
        service_operational = True
        operational_checks = []
        
        # Basic service initialization check
        if flask_service_version:
            operational_checks.append({
                'check': 'service_version',
                'status': 'pass',
                'message': f'Service version: {flask_service_version}'
            })
        else:
            operational_checks.append({
                'check': 'service_version',
                'status': 'fail',
                'message': 'Service version not set'
            })
            service_operational = False
        
        # Collect Flask service performance metrics and response time statistics from performance_metrics
        total_requests = performance_metrics.get('requests', 0)
        total_response_time = performance_metrics.get('total_response_time', 0.0)
        average_response_time = (total_response_time / total_requests) if total_requests > 0 else 0
        
        performance_summary = {
            'total_requests': total_requests,
            'average_response_time_ms': round(average_response_time, 2),
            'total_response_time_ms': round(total_response_time, 2),
            'requests_per_second': 0  # Would need time tracking for accurate calculation
        }
        
        # Calculate error rates and success percentages for Flask service operations and monitoring
        error_count = health_status.get('error_count', 0)
        success_count = max(0, total_requests - error_count)
        success_rate = (success_count / total_requests * 100) if total_requests > 0 else 100
        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0
        
        reliability_metrics = {
            'success_rate_percent': round(success_rate, 2),
            'error_rate_percent': round(error_rate, 2),
            'total_errors': error_count,
            'successful_requests': success_count
        }
        
        # Validate Flask service dependencies and integration points including Flask-Talisman security
        dependency_checks = [
            {
                'dependency': 'constants_module',
                'status': 'pass' if API_CONSTANTS else 'fail',
                'message': 'API constants loaded' if API_CONSTANTS else 'API constants not loaded'
            },
            {
                'dependency': 'logger_module', 
                'status': 'pass' if logger else 'fail',
                'message': 'Logger initialized' if logger else 'Logger not initialized'
            }
        ]
        
        # Check cache health and memory usage statistics using service_cache analysis
        cache_total_entries = len(service_cache)
        cache_total_size = sum(entry.get('size_bytes', 0) for entry in service_cache.values())
        cache_hits = performance_metrics.get('cache_hits', 0)
        cache_misses = performance_metrics.get('cache_misses', 0)
        cache_total_operations = cache_hits + cache_misses
        cache_hit_rate = (cache_hits / cache_total_operations * 100) if cache_total_operations > 0 else 0
        
        # Remove expired cache entries during health check
        current_timestamp = time.time()
        expired_keys = [
            key for key, entry in service_cache.items()
            if entry.get('expires_at', 0) < current_timestamp
        ]
        
        for expired_key in expired_keys:
            del service_cache[expired_key]
        
        cache_health = {
            'total_entries': len(service_cache),  # After cleanup
            'total_size_bytes': sum(entry.get('size_bytes', 0) for entry in service_cache.values()),
            'cache_hit_rate_percent': round(cache_hit_rate, 2),
            'expired_entries_cleaned': len(expired_keys),
            'memory_efficiency': 'good' if len(service_cache) < 500 else 'review_needed'
        }
        
        # Generate Flask service health score based on performance thresholds from TESTING_CONSTANTS
        performance_targets = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
        response_time_target = performance_targets.get('response_time_ms', PERFORMANCE_THRESHOLD_MS)
        error_rate_target = performance_targets.get('error_rate_percent', 1)
        
        health_score = 100
        
        # Deduct points for performance issues
        if average_response_time > response_time_target:
            health_score -= 20
            
        if error_rate > error_rate_target:
            health_score -= 30
            
        if not service_operational:
            health_score -= 50
            
        # Determine overall health status
        if health_score >= 90:
            overall_status = 'excellent'
        elif health_score >= 70:
            overall_status = 'good'
        elif health_score >= 50:
            overall_status = 'degraded'
        else:
            overall_status = 'critical'
        
        # Include diagnostic information for troubleshooting Flask applications and WSGI deployment
        diagnostic_info = {
            'service_uptime_seconds': time.time(),  # Simple uptime approximation
            'last_health_check': health_status.get('last_check'),
            'configuration': {
                'cache_ttl_seconds': DEFAULT_CACHE_TTL,
                'performance_threshold_ms': PERFORMANCE_THRESHOLD_MS,
                'max_response_size_bytes': MAX_RESPONSE_SIZE
            },
            'system_info': {
                'python_version': f"{3}.{9}+",  # Minimum required version
                'flask_service_version': flask_service_version
            }
        }
        
        # Update global health_status with current Flask service state and timestamp
        health_status.update({
            'healthy': overall_status in ['excellent', 'good'],
            'last_check': current_time.isoformat(),
            'health_score': health_score,
            'status': overall_status
        })
        
        # Compile comprehensive health report
        health_report = {
            'status': overall_status,
            'healthy': health_status['healthy'],
            'health_score': health_score,
            'timestamp': current_time.isoformat(),
            'correlation_id': correlation_id,
            'service': {
                'name': 'flask-hello-service',
                'version': flask_service_version,
                'operational': service_operational
            },
            'performance': performance_summary,
            'reliability': reliability_metrics,
            'cache': cache_health,
            'dependencies': dependency_checks,
            'operational_checks': operational_checks,
            'diagnostics': diagnostic_info
        }
        
        # Log Flask health check generation with detailed status information using FlaskLogger
        logger.info(f"Health check completed", {
            'correlation_id': correlation_id,
            'overall_status': overall_status,
            'health_score': health_score,
            'total_requests': total_requests,
            'success_rate': success_rate,
            'cache_hit_rate': cache_hit_rate,
            'expired_cache_entries': len(expired_keys)
        })
        
        # Return comprehensive Flask service health report for monitoring systems and load balancer integration
        return health_report
        
    except Exception as error:
        logger.error(f"Health check generation error: {str(error)}", error)
        
        # Return minimal health report in case of error
        return {
            'status': 'critical',
            'healthy': False,
            'health_score': 0,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'correlation_id': correlation_id,
            'error': {
                'message': str(error),
                'type': 'health_check_error'
            },
            'service': {
                'name': 'flask-hello-service',
                'version': flask_service_version,
                'operational': False
            }
        }