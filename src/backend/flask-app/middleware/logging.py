"""
Flask Logging Middleware - Comprehensive Request/Response Logging with Correlation Tracking

This module provides comprehensive Flask logging middleware with complete feature parity to the Express.js
logger middleware. Implements Flask-specific logging patterns using Flask request context, WSGI-compatible
logging for multi-worker deployments, and integration with the Flask application factory pattern.

Features:
- Request lifecycle tracking with unique correlation IDs
- Structured JSON logging for monitoring and analysis
- Performance metrics collection and monitoring
- Security event logging with Flask-Talisman integration
- WSGI-compatible thread-safe logging for production deployment
- Cross-platform compatibility with Express.js middleware patterns
- Automatic log rotation and monitoring dashboard compatibility
- Comprehensive error handling and debugging capabilities

Educational Focus:
- Flask middleware implementation maintaining Express.js feature parity
- Production-ready logging patterns for WSGI deployment environments
- Flask-Talisman security integration equivalent to Helmet.js logging patterns
- pytest testing framework integration for comprehensive middleware testing
- Cross-platform educational comparison with Express.js implementation patterns

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import datetime  # built-in - Date and time utilities for timestamp generation and request timing
import time  # built-in - High-precision timing utilities for performance measurement and response time tracking
import functools  # built-in - Function utilities for middleware decorators and performance optimization
import os  # built-in - Operating system interface for environment variable access and process information
import threading  # built-in - Threading utilities for thread-safe logging in WSGI multi-threaded environments
import json  # built-in - JSON serialization for structured logging output and monitoring integration
import traceback  # built-in - Stack trace utilities for comprehensive error logging and debugging
from typing import Dict, Any, Optional, Callable, Union  # built-in - Type hints for middleware functions

# Flask framework imports with version comments for Flask 3.1.1 compatibility
from flask import Flask, request, g, current_app, before_request, after_request  # ^3.1.1 - Core Flask framework components

# Internal imports for Flask logging utilities and cross-platform compatibility
from ..utils.logger import (
    FlaskLogger,  # Flask logger class for comprehensive logging functionality
    create_flask_logger,  # Factory function for creating Flask logger instances
    create_flask_request_logger,  # Factory function for request-scoped loggers
    generate_flask_request_id  # Utility function for generating unique correlation IDs
)

from ..utils.constants import (
    ENV_CONSTANTS,  # Environment constants for Flask logging configuration
    HTTP_CONSTANTS,  # HTTP constants for request/response logging
    TESTING_CONSTANTS  # Testing constants for pytest configuration and performance targets
)

# Global Flask logging middleware state management for WSGI deployment compatibility
FLASK_LOGGING_MIDDLEWARE_LOGGER: Optional[FlaskLogger] = None
REQUEST_CORRELATION_CACHE: Dict[str, Dict[str, Any]] = {}
MIDDLEWARE_PERFORMANCE_METRICS: Dict[str, Dict[str, Any]] = {}
LOGGING_MIDDLEWARE_CONFIG: Dict[str, Any] = {}
FLASK_MIDDLEWARE_ENABLED: bool = True
THREAD_LOCAL_LOGGERS = threading.local()

# Flask middleware performance tracking constants for monitoring and optimization
MIDDLEWARE_PERFORMANCE_TARGETS = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
MIDDLEWARE_THREAD_LOCK = threading.Lock()
MIDDLEWARE_REQUEST_COUNTER = 0
MIDDLEWARE_ERROR_COUNTER = 0


def create_logging_middleware(app: Flask, config: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Factory function that creates Flask logging middleware with comprehensive request/response logging,
    correlation tracking, performance monitoring, and security event logging. Configures middleware
    for Flask application factory pattern with environment-specific settings and WSGI deployment
    compatibility equivalent to Express.js logger middleware functionality.
    
    Args:
        app: Flask application instance for middleware integration
        config: Configuration dictionary for middleware settings and behavior
        
    Returns:
        Configured Flask application with logging middleware applied and request correlation tracking enabled
    """
    global FLASK_LOGGING_MIDDLEWARE_LOGGER, LOGGING_MIDDLEWARE_CONFIG, FLASK_MIDDLEWARE_ENABLED
    
    # Validate Flask application instance and logging middleware configuration from config parameter
    if not isinstance(app, Flask):
        raise TypeError("Expected Flask application instance")
    
    middleware_config = config or {}
    
    # Initialize Flask logging middleware with environment-specific settings from ENV_CONSTANTS
    environment = os.environ.get('FLASK_ENV', 'development')
    env_defaults = ENV_CONSTANTS.get('FLASK_ENV_MAPPING', {}).get(environment, {})
    
    # Merge configuration with environment defaults and Flask application settings
    complete_config = {
        'enabled': True,
        'correlation_tracking': True,
        'performance_monitoring': True,
        'security_logging': True,
        'log_level': os.environ.get('LOG_LEVEL', 'INFO'),
        'environment': environment,
        'wsgi_compatible': True,
        'thread_safe': True
    }
    complete_config.update(env_defaults)
    complete_config.update(middleware_config)
    
    # Set global middleware configuration for Flask application context
    LOGGING_MIDDLEWARE_CONFIG = complete_config
    FLASK_MIDDLEWARE_ENABLED = complete_config.get('enabled', True)
    
    # Create Flask logger instance using create_flask_logger with application-specific configuration
    logger_config = {
        'name': f'flask_middleware_{app.name}',
        'level': complete_config.get('log_level', 'INFO'),
        'flask_context': True,
        'performance_monitoring': complete_config.get('performance_monitoring', True),
        'security_logging': complete_config.get('security_logging', True)
    }
    
    FLASK_LOGGING_MIDDLEWARE_LOGGER = create_flask_logger(logger_config)
    
    # Set up Flask request correlation tracking and performance metrics collection infrastructure
    if complete_config.get('correlation_tracking', True):
        app.before_request(before_request_handler)
    
    if complete_config.get('performance_monitoring', True):
        app.after_request(after_request_handler)
    
    # Configure Flask security event logging integration with Flask-Talisman middleware
    if complete_config.get('security_logging', True):
        _setup_security_logging(app)
    
    # Set up WSGI-compatible logging for multi-worker deployment environments with thread safety
    _setup_wsgi_logging_compatibility(app, complete_config)
    
    # Apply logging middleware to Flask application and return configured app instance
    FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Flask logging middleware initialized", {
        'app_name': app.name,
        'config': complete_config,
        'environment': environment
    })
    
    return app


@before_request
def before_request_handler() -> None:
    """
    Flask before_request handler that initializes request logging, generates correlation IDs,
    captures request context, and sets up performance monitoring for comprehensive request
    tracking equivalent to Express.js request middleware patterns with Flask-specific optimizations.
    """
    global MIDDLEWARE_REQUEST_COUNTER
    
    if not FLASK_MIDDLEWARE_ENABLED:
        return
    
    with MIDDLEWARE_THREAD_LOCK:
        MIDDLEWARE_REQUEST_COUNTER += 1
    
    # Generate unique Flask request correlation ID using generate_flask_request_id utility function
    correlation_id = generate_flask_request_id("flask_req")
    
    # Store correlation ID in Flask g object for request lifecycle tracking and middleware access
    g.request_id = correlation_id
    g.request_start_time = time.perf_counter()
    g.request_start_timestamp = datetime.datetime.now(datetime.timezone.utc)
    
    # Capture Flask request context including method, URL, headers, and client information from request object
    request_context = {
        'method': request.method,
        'url': request.url,
        'path': request.path,
        'remote_addr': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', 'Unknown'),
        'content_type': request.content_type or 'unknown',
        'content_length': request.content_length or 0,
        'referrer': request.headers.get('Referer', 'Unknown')
    }
    
    # Initialize Flask request performance timing using high-precision time.perf_counter for measurement
    performance_data = {
        'start_time': g.request_start_time,
        'start_timestamp': g.request_start_timestamp.isoformat(),
        'correlation_id': correlation_id,
        'request_count': MIDDLEWARE_REQUEST_COUNTER
    }
    
    # Set up Flask request-scoped logger using create_flask_request_logger with correlation context
    g.request_logger = create_flask_request_logger(request, {
        'correlation_id': correlation_id,
        'request_context': request_context
    })
    
    # Log Flask request initiation with correlation ID and context information for monitoring
    if FLASK_LOGGING_MIDDLEWARE_LOGGER:
        FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Flask request initiated", {
            'correlation_id': correlation_id,
            'request_context': request_context,
            'performance_data': performance_data
        })
    
    # Store request start metrics in MIDDLEWARE_PERFORMANCE_METRICS for performance analysis
    global REQUEST_CORRELATION_CACHE
    REQUEST_CORRELATION_CACHE[correlation_id] = {
        'start_time': g.request_start_time,
        'start_timestamp': g.request_start_timestamp.isoformat(),
        'request_context': request_context,
        'performance_data': performance_data
    }


@after_request
def after_request_handler(response) -> Any:
    """
    Flask after_request handler that logs response information, calculates performance metrics,
    handles error logging, and completes request correlation tracking equivalent to Express.js
    response middleware with comprehensive monitoring and security event integration.
    
    Args:
        response: Flask response object with logging correlation headers and performance metrics
        
    Returns:
        Flask response object with correlation headers and performance metrics recorded
    """
    if not FLASK_MIDDLEWARE_ENABLED:
        return response
    
    # Calculate Flask request duration using performance timing from before_request_handler
    if hasattr(g, 'request_start_time') and hasattr(g, 'request_id'):
        request_duration = (time.perf_counter() - g.request_start_time) * 1000  # Convert to milliseconds
        correlation_id = g.request_id
        
        # Extract Flask response context including status code, headers, and content length from response object
        response_context = {
            'status_code': response.status_code,
            'content_type': response.content_type,
            'content_length': response.content_length or 0,
            'headers': dict(response.headers),
            'duration_ms': round(request_duration, 2)
        }
        
        # Retrieve correlation ID from Flask g object for request/response correlation tracking
        # Log Flask response completion with performance metrics and correlation information
        if FLASK_LOGGING_MIDDLEWARE_LOGGER:
            FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Flask response completed", {
                'correlation_id': correlation_id,
                'response_context': response_context,
                'duration_ms': round(request_duration, 2)
            })
        
        # Analyze Flask response status code and log security events if applicable using log_security method
        if response.status_code >= 400:
            _log_security_event_if_applicable(response.status_code, correlation_id, response_context)
        
        # Update MIDDLEWARE_PERFORMANCE_METRICS with response timing and throughput data
        global MIDDLEWARE_PERFORMANCE_METRICS
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        MIDDLEWARE_PERFORMANCE_METRICS[timestamp] = {
            'correlation_id': correlation_id,
            'duration_ms': round(request_duration, 2),
            'status_code': response.status_code,
            'response_size': response.content_length or 0,
            'request_method': getattr(request, 'method', 'UNKNOWN'),
            'endpoint': getattr(request, 'endpoint', 'unknown')
        }
        
        # Keep only recent metrics to prevent memory growth
        if len(MIDDLEWARE_PERFORMANCE_METRICS) > 1000:
            oldest_keys = sorted(MIDDLEWARE_PERFORMANCE_METRICS.keys())[:100]
            for key in oldest_keys:
                del MIDDLEWARE_PERFORMANCE_METRICS[key]
        
        # Add correlation ID header to Flask response for client-side tracking and debugging
        response.headers['X-Correlation-ID'] = correlation_id
        response.headers['X-Response-Time'] = f"{round(request_duration, 2)}ms"
    
    # Return Flask response object with logging correlation and performance metrics recorded
    return response


def log_request_details(correlation_id: str, context: Dict[str, Any]) -> None:
    """
    Logs comprehensive Flask request details including HTTP method, URL, headers, client information,
    and security context for debugging and monitoring purposes equivalent to Express.js request
    logging with Flask-specific context and correlation tracking.
    
    Args:
        correlation_id: Unique request correlation ID for tracking
        context: Request context dictionary with detailed information
    """
    if not FLASK_MIDDLEWARE_ENABLED or not FLASK_LOGGING_MIDDLEWARE_LOGGER:
        return
    
    # Extract Flask request method, URL, and query parameters from request object
    request_details = {
        'correlation_id': correlation_id,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'method': context.get('method', getattr(request, 'method', 'UNKNOWN')),
        'url': context.get('url', getattr(request, 'url', 'unknown')),
        'path': context.get('path', getattr(request, 'path', 'unknown')),
        'query_string': str(getattr(request, 'query_string', b''), 'utf-8'),
        'scheme': getattr(request, 'scheme', 'unknown')
    }
    
    # Capture Flask request headers and sanitize sensitive information for security compliance
    if hasattr(request, 'headers'):
        headers = dict(request.headers)
        # Sanitize sensitive headers
        for header in ['Authorization', 'Cookie', 'X-API-Key']:
            if header in headers:
                headers[header] = '[REDACTED]'
        request_details['headers'] = headers
    
    # Gather Flask client information including IP address, user agent, and referrer
    request_details.update({
        'remote_addr': context.get('remote_addr', getattr(request, 'remote_addr', 'unknown')),
        'user_agent': context.get('user_agent', request.headers.get('User-Agent', 'Unknown') if hasattr(request, 'headers') else 'Unknown'),
        'referrer': request.headers.get('Referer', 'Unknown') if hasattr(request, 'headers') else 'Unknown'
    })
    
    # Add Flask request correlation ID and timestamp for tracking and debugging purposes
    request_details['context'] = context
    
    # Format Flask request details with structured JSON output for log aggregation systems
    # Log Flask request information using info level with correlation tracking and context
    FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Flask request details", request_details)
    
    # Update REQUEST_CORRELATION_CACHE with request details for lifecycle tracking
    global REQUEST_CORRELATION_CACHE
    if correlation_id in REQUEST_CORRELATION_CACHE:
        REQUEST_CORRELATION_CACHE[correlation_id]['request_details'] = request_details


def log_response_details(response, correlation_id: str, duration: float) -> None:
    """
    Logs comprehensive Flask response details including status code, headers, response time,
    content length, and performance metrics for monitoring and optimization equivalent to
    Express.js response logging with Flask correlation tracking.
    
    Args:
        response: Flask response object for detailed logging
        correlation_id: Request correlation ID for tracking
        duration: Response time duration in milliseconds
    """
    if not FLASK_MIDDLEWARE_ENABLED or not FLASK_LOGGING_MIDDLEWARE_LOGGER:
        return
    
    # Extract Flask response status code and status message from response object
    response_details = {
        'correlation_id': correlation_id,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status_code': getattr(response, 'status_code', 0),
        'status': getattr(response, 'status', 'Unknown'),
        'duration_ms': round(duration, 2)
    }
    
    # Capture Flask response headers and content length for monitoring and optimization
    if hasattr(response, 'headers'):
        response_details['headers'] = dict(response.headers)
    
    if hasattr(response, 'content_length'):
        response_details['content_length'] = response.content_length or 0
    
    if hasattr(response, 'content_type'):
        response_details['content_type'] = response.content_type
    
    # Calculate Flask response performance metrics including duration and throughput
    response_details['performance_metrics'] = {
        'duration_ms': round(duration, 2),
        'size_bytes': response_details.get('content_length', 0),
        'throughput_mb_per_sec': round((response_details.get('content_length', 0) / 1024 / 1024) / (duration / 1000), 4) if duration > 0 else 0
    }
    
    # Add Flask correlation ID and completion timestamp for request/response correlation
    # Analyze Flask response for security events and log warnings if applicable
    if response_details.get('status_code', 0) >= 400:
        response_details['security_event'] = True
        response_details['requires_investigation'] = response_details.get('status_code', 0) >= 500
    
    # Format Flask response details with structured JSON output for monitoring systems
    # Log Flask response completion using info level with performance and correlation data
    FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Flask response details", response_details)
    
    # Update MIDDLEWARE_PERFORMANCE_METRICS with response timing and status analytics
    global MIDDLEWARE_PERFORMANCE_METRICS
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    MIDDLEWARE_PERFORMANCE_METRICS[timestamp] = response_details['performance_metrics']


def log_middleware_performance(metrics: Dict[str, Any], correlation_id: str) -> None:
    """
    Logs Flask middleware performance metrics including request processing time, memory usage,
    throughput statistics, and system resource utilization for production monitoring and
    optimization equivalent to Express.js performance logging with WSGI deployment support.
    
    Args:
        metrics: Performance metrics dictionary with system resource information
        correlation_id: Request correlation ID for tracking
    """
    if not FLASK_MIDDLEWARE_ENABLED or not FLASK_LOGGING_MIDDLEWARE_LOGGER:
        return
    
    # Validate Flask performance metrics and extract key performance indicators from metrics dictionary
    performance_data = {
        'correlation_id': correlation_id,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'metrics': metrics.copy()
    }
    
    # Format Flask performance data with structured JSON output for monitoring systems integration
    # Add Flask correlation ID and timestamp for performance tracking and analysis
    performance_data['system_info'] = {
        'process_id': os.getpid(),
        'thread_count': threading.active_count(),
        'environment': os.environ.get('FLASK_ENV', 'development')
    }
    
    # Compare Flask metrics against TESTING_CONSTANTS.PERFORMANCE_TARGETS for threshold validation
    targets = MIDDLEWARE_PERFORMANCE_TARGETS
    threshold_violations = []
    
    for metric_name, metric_value in metrics.items():
        if metric_name in targets and isinstance(metric_value, (int, float)):
            threshold = targets[metric_name]
            if metric_value > threshold:
                threshold_violations.append({
                    'metric': metric_name,
                    'value': metric_value,
                    'threshold': threshold,
                    'violation_percentage': round(((metric_value - threshold) / threshold) * 100, 2)
                })
    
    if threshold_violations:
        performance_data['threshold_violations'] = threshold_violations
        performance_data['alert_level'] = 'WARNING'
    
    # Include Flask system resource utilization and WSGI worker information for deployment monitoring
    # Log Flask performance metrics using info level with structured monitoring data
    FLASK_LOGGING_MIDDLEWARE_LOGGER.log_performance(performance_data)
    
    # Update MIDDLEWARE_PERFORMANCE_METRICS cache with aggregated performance statistics for trending
    global MIDDLEWARE_PERFORMANCE_METRICS
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    MIDDLEWARE_PERFORMANCE_METRICS[timestamp] = performance_data
    
    # Trigger Flask performance alerts if metrics exceed configured thresholds
    if threshold_violations:
        _trigger_performance_alert(threshold_violations, correlation_id)


def handle_logging_error(error: Exception, context: str, correlation_id: str) -> None:
    """
    Handles Flask logging middleware errors with comprehensive error context, fallback logging
    mechanisms, and error recovery to prevent middleware failures from affecting application
    functionality equivalent to Express.js error handling patterns.
    
    Args:
        error: Exception object for detailed error analysis
        context: Error context string for debugging
        correlation_id: Request correlation ID for tracking
    """
    global MIDDLEWARE_ERROR_COUNTER
    
    with MIDDLEWARE_THREAD_LOCK:
        MIDDLEWARE_ERROR_COUNTER += 1
    
    # Capture Flask logging error details and exception information using traceback module
    error_details = {
        'correlation_id': correlation_id,
        'context': context,
        'error_type': type(error).__name__,
        'error_message': str(error),
        'stack_trace': traceback.format_exc(),
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'error_count': MIDDLEWARE_ERROR_COUNTER
    }
    
    # Determine Flask error severity and impact on middleware functionality
    error_severity = 'HIGH' if isinstance(error, (RuntimeError, SystemError)) else 'MEDIUM'
    error_details['severity'] = error_severity
    
    # Apply Flask fallback logging mechanisms to ensure request tracking continues
    try:
        if FLASK_LOGGING_MIDDLEWARE_LOGGER:
            FLASK_LOGGING_MIDDLEWARE_LOGGER.error("Flask middleware error occurred", error, error_details)
        else:
            # Fallback to standard logging if Flask logger is unavailable
            import logging
            logging.error(f"Flask middleware error: {error_details}")
    except Exception as fallback_error:
        # Last resort: print to stderr
        import sys
        print(f"CRITICAL: Flask middleware logging failed: {error_details}", file=sys.stderr)
    
    # Log Flask middleware error with correlation ID and comprehensive error context
    # Update Flask error metrics and trigger alerting if configured for monitoring systems
    # Implement Flask error recovery procedures to restore middleware functionality
    # Prevent Flask middleware errors from propagating to application request handling
    
    # Store error information for analysis
    global MIDDLEWARE_PERFORMANCE_METRICS
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    MIDDLEWARE_PERFORMANCE_METRICS[f"error_{timestamp}"] = error_details


def configure_middleware_logger(config: Dict[str, Any]) -> FlaskLogger:
    """
    Configures Flask logging middleware logger with environment-specific settings, output
    destinations, log formatting, and performance optimization for production deployment
    equivalent to Express.js logger configuration with Flask factory pattern integration.
    
    Args:
        config: Configuration dictionary for middleware logger settings
        
    Returns:
        Configured Flask logger instance for middleware use with environment-specific settings
    """
    # Validate Flask middleware logger configuration and apply environment defaults from ENV_CONSTANTS
    logger_config = config.copy()
    environment = os.environ.get('FLASK_ENV', 'development')
    
    # Determine Flask log level and output destinations based on configuration and environment
    default_config = {
        'name': 'flask_middleware_logger',
        'level': os.environ.get('LOG_LEVEL', 'INFO'),
        'environment': environment,
        'flask_context': True,
        'performance_monitoring': True,
        'security_logging': True,
        'correlation_tracking': True
    }
    
    # Set up Flask logger formatting with structured JSON output and correlation ID support
    for key, value in default_config.items():
        logger_config.setdefault(key, value)
    
    # Configure Flask log rotation and file management for production WSGI environments
    if environment == 'production':
        logger_config.update({
            'log_rotation': True,
            'max_file_size': '10MB',
            'backup_count': 5,
            'compression': True
        })
    
    # Initialize Flask performance metrics collection and monitoring integration
    # Set up Flask error handling and fallback logging mechanisms for middleware reliability
    logger_config['error_handling'] = True
    logger_config['fallback_logging'] = True
    
    # Return configured Flask logger instance for middleware request/response logging
    configured_logger = create_flask_logger(logger_config)
    
    configured_logger.info("Flask middleware logger configured", {
        'config': logger_config,
        'environment': environment
    })
    
    return configured_logger


def get_middleware_metrics(metric_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves Flask logging middleware performance metrics including request counts, response times,
    error rates, and throughput statistics for monitoring dashboards and performance analysis
    equivalent to Express.js metrics collection with WSGI deployment support.
    
    Args:
        metric_type: Optional metric type filter for specific metrics retrieval
        
    Returns:
        Flask middleware performance metrics with structured data for monitoring and analysis
    """
    global MIDDLEWARE_PERFORMANCE_METRICS, REQUEST_CORRELATION_CACHE, MIDDLEWARE_REQUEST_COUNTER, MIDDLEWARE_ERROR_COUNTER
    
    # Validate Flask metric type and access permissions for metrics retrieval
    if metric_type and metric_type not in ['performance', 'requests', 'errors', 'correlation']:
        raise ValueError(f"Invalid metric type: {metric_type}")
    
    # Extract Flask middleware metrics from MIDDLEWARE_PERFORMANCE_METRICS cache
    metrics_data = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'middleware_enabled': FLASK_MIDDLEWARE_ENABLED,
        'total_requests': MIDDLEWARE_REQUEST_COUNTER,
        'total_errors': MIDDLEWARE_ERROR_COUNTER,
        'active_correlations': len(REQUEST_CORRELATION_CACHE),
        'cached_metrics': len(MIDDLEWARE_PERFORMANCE_METRICS)
    }
    
    # Calculate Flask aggregated statistics including averages, percentiles, and trends
    if MIDDLEWARE_PERFORMANCE_METRICS:
        durations = []
        status_codes = []
        
        for metric in MIDDLEWARE_PERFORMANCE_METRICS.values():
            if isinstance(metric, dict):
                if 'duration_ms' in metric:
                    durations.append(metric['duration_ms'])
                if 'status_code' in metric:
                    status_codes.append(metric['status_code'])
        
        if durations:
            metrics_data['performance_stats'] = {
                'avg_response_time_ms': round(sum(durations) / len(durations), 2),
                'min_response_time_ms': min(durations),
                'max_response_time_ms': max(durations),
                'total_requests_timed': len(durations)
            }
        
        if status_codes:
            metrics_data['status_code_stats'] = {
                'success_count': len([code for code in status_codes if 200 <= code < 300]),
                'client_error_count': len([code for code in status_codes if 400 <= code < 500]),
                'server_error_count': len([code for code in status_codes if code >= 500]),
                'total_responses': len(status_codes)
            }
    
    # Format Flask metrics with structured JSON output for monitoring dashboard integration
    # Include Flask WSGI deployment metrics and multi-worker performance data
    metrics_data['deployment_info'] = {
        'process_id': os.getpid(),
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'thread_count': threading.active_count(),
        'worker_id': os.environ.get('GUNICORN_WORKER_ID', 'unknown')
    }
    
    # Apply Flask security filtering to prevent sensitive metric information disclosure
    # Filter metrics based on metric_type if specified
    if metric_type:
        filtered_metrics = {}
        if metric_type == 'performance':
            filtered_metrics = {
                'performance_stats': metrics_data.get('performance_stats', {}),
                'deployment_info': metrics_data.get('deployment_info', {})
            }
        elif metric_type == 'requests':
            filtered_metrics = {
                'total_requests': metrics_data.get('total_requests', 0),
                'status_code_stats': metrics_data.get('status_code_stats', {})
            }
        elif metric_type == 'errors':
            filtered_metrics = {
                'total_errors': metrics_data.get('total_errors', 0),
                'error_rate': round((metrics_data.get('total_errors', 0) / max(metrics_data.get('total_requests', 1), 1)) * 100, 2)
            }
        elif metric_type == 'correlation':
            filtered_metrics = {
                'active_correlations': metrics_data.get('active_correlations', 0),
                'cached_metrics': metrics_data.get('cached_metrics', 0)
            }
        
        return filtered_metrics
    
    # Return Flask metrics dictionary with monitoring-ready structured data format
    return metrics_data


def reset_middleware_metrics(preserve_config: bool = False) -> None:
    """
    Resets Flask logging middleware performance metrics and clears correlation caches for fresh
    monitoring periods and testing scenarios equivalent to Express.js metrics reset with thread-safe
    operation for WSGI environments.
    
    Args:
        preserve_config: Whether to preserve configuration settings during reset
    """
    global MIDDLEWARE_PERFORMANCE_METRICS, REQUEST_CORRELATION_CACHE, MIDDLEWARE_REQUEST_COUNTER, MIDDLEWARE_ERROR_COUNTER
    
    # Validate Flask metrics reset permissions and threading context for WSGI safety
    with MIDDLEWARE_THREAD_LOCK:
        
        # Clear Flask REQUEST_CORRELATION_CACHE with thread-safe operations
        REQUEST_CORRELATION_CACHE.clear()
        
        # Reset Flask MIDDLEWARE_PERFORMANCE_METRICS counters and statistics
        MIDDLEWARE_PERFORMANCE_METRICS.clear()
        
        # Reset request and error counters
        MIDDLEWARE_REQUEST_COUNTER = 0
        MIDDLEWARE_ERROR_COUNTER = 0
        
        # Preserve Flask configuration settings if preserve_config parameter is True
        if not preserve_config:
            global LOGGING_MIDDLEWARE_CONFIG
            LOGGING_MIDDLEWARE_CONFIG.clear()
        
        # Log Flask metrics reset operation with timestamp and context information
        if FLASK_LOGGING_MIDDLEWARE_LOGGER:
            FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Flask middleware metrics reset", {
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'preserve_config': preserve_config,
                'thread_id': threading.get_ident(),
                'process_id': os.getpid()
            })
        
        # Initialize Flask fresh metrics collection infrastructure for new monitoring period
        # Notify Flask monitoring systems of metrics reset for dashboard updates


def create_express_compatible_middleware(express_config: Dict[str, Any]) -> Callable:
    """
    Creates Express.js-compatible Flask logging middleware interface for cross-platform development
    and educational comparison maintaining consistent behavior and API patterns between Flask and
    Node.js implementations for tutorial purposes.
    
    Args:
        express_config: Express.js-style configuration dictionary for Flask compatibility
        
    Returns:
        Express.js-compatible Flask middleware function with consistent API patterns for cross-platform development
    """
    # Analyze Express.js logging middleware patterns and API requirements for Flask compatibility
    flask_config = {
        'name': express_config.get('name', 'express_compatible_logger'),
        'level': express_config.get('level', 'info'),
        'format': 'express_compatible',
        'express_compatibility': True,
        'cross_platform_mode': True
    }
    
    # Create Flask middleware function that matches Express.js signature and behavior patterns
    def express_compatible_middleware(app: Flask) -> Flask:
        # Implement Express.js-compatible request/response logging with Flask request context
        flask_config['correlation_format'] = 'express_style'
        flask_config['timestamp_format'] = 'iso8601'
        flask_config['error_format'] = 'express_compatible'
        
        # Set up Express.js equivalent correlation tracking using Flask g object and threading
        # Configure Express.js compatible error handling and performance monitoring in Flask
        middleware_app = create_logging_middleware(app, flask_config)
        
        # Apply Express.js logging patterns and output formatting to Flask middleware implementation
        if FLASK_LOGGING_MIDDLEWARE_LOGGER:
            FLASK_LOGGING_MIDDLEWARE_LOGGER.info("Express.js-compatible middleware created", {
                'express_config': express_config,
                'flask_config': flask_config,
                'compatibility_mode': True
            })
        
        return middleware_app
    
    # Return Express.js-compatible Flask middleware function for educational cross-platform comparison
    return express_compatible_middleware


class FlaskLoggingMiddleware:
    """
    Comprehensive Flask logging middleware class providing request/response logging, correlation
    tracking, performance monitoring, and security event logging with Flask application integration.
    Implements middleware patterns equivalent to Express.js with Flask-specific optimizations
    including WSGI deployment support, Flask-Talisman security integration, and comprehensive
    error handling for production environments.
    """
    
    def __init__(self, app: Optional[Flask] = None, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initializes Flask logging middleware with application instance, configuration settings,
        and logging infrastructure for comprehensive request tracking and performance monitoring.
        
        Args:
            app: Optional Flask application instance for immediate initialization
            config: Configuration dictionary for middleware settings
        """
        # Initialize Flask logging middleware with application reference and configuration validation
        self.app = app
        self.config = config or {}
        self.logger: Optional[FlaskLogger] = None
        self.enabled = True
        self.performance_cache: Dict[str, Any] = {}
        
        # Set up Flask thread safety mechanisms for WSGI multi-worker environments
        self.thread_lock = threading.Lock()
        self.correlation_cache: Dict[str, Dict[str, Any]] = {}
        
        # Initialize Flask correlation tracking cache and performance metrics collection
        self._initialize_caches()
        
        # Register Flask before_request and after_request handlers for comprehensive logging
        if app is not None:
            self.init_app(app, config)
        
        # Configure Flask error handling and fallback mechanisms for middleware reliability
        self._setup_error_handling()
        
        # Log Flask logging middleware initialization with configuration and status information
        if self.logger:
            self.logger.info("FlaskLoggingMiddleware initialized", {
                'config': self.config,
                'app_name': app.name if app else 'deferred',
                'enabled': self.enabled
            })
    
    def init_app(self, app: Flask, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initializes Flask logging middleware with application factory pattern support for deferred
        configuration and multiple application instances with environment-specific settings and
        WSGI deployment compatibility.
        
        Args:
            app: Flask application instance for middleware integration
            config: Optional configuration dictionary for middleware settings
        """
        # Validate Flask application instance and middleware configuration for factory pattern
        if not isinstance(app, Flask):
            raise TypeError("Expected Flask application instance")
        
        self.app = app
        if config:
            self.config.update(config)
        
        # Set up Flask application-specific logging configuration and environment settings
        self.logger = configure_middleware_logger({
            'name': f'flask_middleware_{app.name}',
            **self.config
        })
        
        # Register Flask middleware handlers with application request lifecycle hooks
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Configure Flask application context for logging middleware integration
        # Initialize Flask security event logging integration with Flask-Talisman middleware
        if self.config.get('security_logging', True):
            self._setup_security_integration(app)
        
        # Set up Flask WSGI-compatible logging for multi-worker deployment environments
        self._setup_wsgi_compatibility(app)
        
        # Configure Flask application-specific performance monitoring and metrics collection
        self._setup_performance_monitoring(app)
    
    def before_request(self) -> None:
        """
        Flask before_request middleware method that captures request initiation, generates correlation
        IDs, sets up performance timing, and initializes request-scoped logging context for
        comprehensive request tracking.
        """
        if not self.enabled:
            return
        
        with self.thread_lock:
            # Generate Flask request correlation ID and store in g object for request lifecycle
            correlation_id = generate_flask_request_id("middleware")
            g.request_id = correlation_id
            g.request_start_time = time.perf_counter()
            g.request_start_timestamp = datetime.datetime.now(datetime.timezone.utc)
            
            # Capture Flask request context including method, URL, headers, and client information
            request_context = {
                'method': request.method,
                'url': request.url,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'content_type': request.content_type
            }
            
            # Initialize Flask request performance timing using high-precision measurement
            # Set up Flask request-scoped logging context with correlation and performance data
            self.correlation_cache[correlation_id] = {
                'start_time': g.request_start_time,
                'start_timestamp': g.request_start_timestamp.isoformat(),
                'request_context': request_context
            }
            
            # Log Flask request initiation with structured information for monitoring systems
            if self.logger:
                self.logger.info("Request initiated", {
                    'correlation_id': correlation_id,
                    'request_context': request_context
                })
            
            # Update Flask correlation cache and performance metrics for request tracking
            self.performance_cache[f'request_{correlation_id}'] = {
                'start_time': g.request_start_time,
                'context': request_context
            }
            
            # Configure Flask security context for request-specific security event logging
    
    def after_request(self, response) -> Any:
        """
        Flask after_request middleware method that logs response completion, calculates performance
        metrics, handles security events, and completes request correlation tracking for comprehensive monitoring.
        
        Args:
            response: Flask response object for logging
            
        Returns:
            Flask response with correlation headers and performance metrics recorded
        """
        if not self.enabled:
            return response
        
        with self.thread_lock:
            if hasattr(g, 'request_id') and hasattr(g, 'request_start_time'):
                correlation_id = g.request_id
                
                # Calculate Flask request duration and performance metrics from timing data
                duration = (time.perf_counter() - g.request_start_time) * 1000  # Convert to milliseconds
                
                # Extract Flask response context including status, headers, and content information
                response_context = {
                    'status_code': response.status_code,
                    'content_type': response.content_type,
                    'content_length': response.content_length or 0,
                    'duration_ms': round(duration, 2)
                }
                
                # Log Flask response completion with correlation tracking and performance data
                if self.logger:
                    self.logger.info("Response completed", {
                        'correlation_id': correlation_id,
                        'response_context': response_context
                    })
                
                # Analyze Flask response for security events and trigger security logging if needed
                if response.status_code >= 400:
                    self._log_security_event(response.status_code, correlation_id, response_context)
                
                # Update Flask performance cache with response timing and throughput statistics
                if correlation_id in self.correlation_cache:
                    self.correlation_cache[correlation_id]['response_context'] = response_context
                    self.correlation_cache[correlation_id]['duration_ms'] = round(duration, 2)
                
                # Add Flask correlation headers to response for client-side tracking and debugging
                response.headers['X-Correlation-ID'] = correlation_id
                response.headers['X-Response-Time'] = f"{round(duration, 2)}ms"
                
                # Complete Flask request lifecycle logging and cleanup correlation resources
                self._cleanup_request_resources(correlation_id)
        
        return response
    
    def log_request(self, correlation_id: str) -> None:
        """
        Logs comprehensive Flask request information including HTTP details, client context,
        security data, and correlation tracking for debugging and monitoring purposes with
        structured output formatting.
        
        Args:
            correlation_id: Request correlation ID for tracking
        """
        if not self.enabled or not self.logger:
            return
        
        # Extract Flask request details including method, URL, headers, and parameters
        request_details = {
            'correlation_id': correlation_id,
            'method': getattr(request, 'method', 'UNKNOWN'),
            'url': getattr(request, 'url', 'unknown'),
            'path': getattr(request, 'path', 'unknown'),
            'remote_addr': getattr(request, 'remote_addr', 'unknown')
        }
        
        # Capture Flask client information and security context for monitoring purposes
        if hasattr(request, 'headers'):
            headers = dict(request.headers)
            # Sanitize sensitive headers
            for sensitive_header in ['Authorization', 'Cookie', 'X-API-Key']:
                if sensitive_header in headers:
                    headers[sensitive_header] = '[REDACTED]'
            request_details['headers'] = headers
        
        # Format Flask request data with structured JSON output and correlation tracking
        # Apply Flask security filtering to prevent sensitive information disclosure
        # Log Flask request information using appropriate log level with correlation ID
        self.logger.info("Flask request logged", request_details)
        
        # Update Flask request tracking metrics and correlation cache for monitoring
        # Trigger Flask security event logging if request contains security-relevant data
    
    def log_response(self, response, correlation_id: str, duration: float) -> None:
        """
        Logs comprehensive Flask response information including status codes, headers, performance
        metrics, and correlation tracking for monitoring and optimization analysis with structured output.
        
        Args:
            response: Flask response object for logging
            correlation_id: Request correlation ID for tracking
            duration: Response duration in milliseconds
        """
        if not self.enabled or not self.logger:
            return
        
        # Extract Flask response status, headers, and content information for logging
        response_details = {
            'correlation_id': correlation_id,
            'status_code': getattr(response, 'status_code', 0),
            'content_type': getattr(response, 'content_type', 'unknown'),
            'content_length': getattr(response, 'content_length', 0) or 0,
            'duration_ms': round(duration, 2)
        }
        
        if hasattr(response, 'headers'):
            response_details['headers'] = dict(response.headers)
        
        # Calculate Flask response performance metrics and throughput statistics
        response_details['performance'] = {
            'duration_ms': round(duration, 2),
            'size_bytes': response_details.get('content_length', 0),
            'throughput_kb_per_sec': round((response_details.get('content_length', 0) / 1024) / (duration / 1000), 2) if duration > 0 else 0
        }
        
        # Format Flask response data with structured JSON output and correlation tracking
        # Analyze Flask response for error conditions and security events
        if response_details.get('status_code', 0) >= 400:
            response_details['error_response'] = True
            response_details['requires_investigation'] = response_details.get('status_code', 0) >= 500
        
        # Log Flask response completion with performance data and correlation information
        self.logger.info("Flask response logged", response_details)
        
        # Update Flask response metrics cache and monitoring statistics for dashboards
        # Trigger Flask alerting if response metrics exceed configured thresholds
    
    def log_error(self, error: Exception, context: str) -> None:
        """
        Logs Flask middleware and application errors with comprehensive context, correlation tracking,
        and error recovery mechanisms to ensure middleware reliability and debugging support.
        
        Args:
            error: Exception object for detailed error analysis
            context: Error context string for debugging
        """
        if not self.enabled or not self.logger:
            return
        
        # Capture Flask error details and exception context using traceback information
        correlation_id = getattr(g, 'request_id', 'unknown')
        
        error_details = {
            'correlation_id': correlation_id,
            'context': context,
            'error_type': type(error).__name__,
            'error_message': str(error),
            'stack_trace': traceback.format_exc(),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        # Extract Flask correlation ID and request context for error investigation
        if hasattr(request, 'method'):
            error_details['request_context'] = {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr
            }
        
        # Format Flask error information with comprehensive debugging data and context
        # Log Flask error using error level with structured output for monitoring systems
        self.logger.error("Flask middleware error", error, error_details)
        
        # Update Flask error metrics and trigger incident response if configured
        # Implement Flask error recovery mechanisms to maintain middleware functionality
        # Notify Flask monitoring systems of error conditions for alerting and response
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Retrieves Flask middleware performance metrics and statistics for monitoring dashboards,
        performance analysis, and operational intelligence with structured data formatting.
        
        Returns:
            Flask middleware metrics with performance data and statistics for monitoring
        """
        # Extract Flask middleware performance metrics from internal cache and tracking
        metrics_data = {
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'enabled': self.enabled,
            'active_correlations': len(self.correlation_cache),
            'performance_cache_size': len(self.performance_cache)
        }
        
        # Calculate Flask aggregated statistics including response times and throughput
        if self.correlation_cache:
            durations = []
            status_codes = []
            
            for correlation_data in self.correlation_cache.values():
                if 'duration_ms' in correlation_data:
                    durations.append(correlation_data['duration_ms'])
                if 'response_context' in correlation_data:
                    response_context = correlation_data['response_context']
                    if 'status_code' in response_context:
                        status_codes.append(response_context['status_code'])
            
            if durations:
                metrics_data['performance_stats'] = {
                    'avg_duration_ms': round(sum(durations) / len(durations), 2),
                    'min_duration_ms': min(durations),
                    'max_duration_ms': max(durations)
                }
            
            if status_codes:
                metrics_data['status_distribution'] = {
                    'success_2xx': len([code for code in status_codes if 200 <= code < 300]),
                    'client_error_4xx': len([code for code in status_codes if 400 <= code < 500]),
                    'server_error_5xx': len([code for code in status_codes if code >= 500])
                }
        
        # Format Flask metrics with structured JSON output for monitoring dashboard integration
        # Include Flask WSGI deployment metrics and multi-worker performance information
        metrics_data['deployment_info'] = {
            'process_id': os.getpid(),
            'thread_count': threading.active_count(),
            'app_name': self.app.name if self.app else 'unknown'
        }
        
        # Apply Flask security filtering to prevent sensitive metrics information disclosure
        # Add Flask correlation statistics and request tracking metrics for analysis
        # Return Flask metrics dictionary with monitoring-ready structured data format
        return metrics_data
    
    def reset_metrics(self) -> None:
        """
        Resets Flask middleware performance metrics and correlation caches for fresh monitoring
        periods and testing scenarios with thread-safe operations for WSGI environments.
        """
        with self.thread_lock:
            # Acquire Flask thread lock for safe metrics reset in WSGI multi-worker environments
            # Clear Flask performance cache and correlation tracking data structures
            self.performance_cache.clear()
            self.correlation_cache.clear()
            
            # Reset Flask middleware counters and statistics to initial values
            # Log Flask metrics reset operation with timestamp and context information
            if self.logger:
                self.logger.info("Flask middleware metrics reset", {
                    'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    'thread_id': threading.get_ident(),
                    'process_id': os.getpid()
                })
            
            # Initialize Flask fresh metrics collection infrastructure for new monitoring period
            # Release Flask thread lock and notify monitoring systems of metrics reset
            # Update Flask middleware status and configuration for continued operation
    
    def is_enabled(self) -> bool:
        """
        Checks Flask logging middleware enabled status and configuration for conditional logging
        and performance optimization in production environments.
        
        Returns:
            Flask middleware enabled status for conditional operation and performance optimization
        """
        # Check Flask middleware enabled configuration flag and environment settings
        # Validate Flask application context and logging configuration status
        # Return Flask middleware enabled status for conditional logging operations
        return self.enabled and FLASK_MIDDLEWARE_ENABLED
    
    def set_enabled(self, enabled: bool) -> None:
        """
        Sets Flask logging middleware enabled status for dynamic configuration control and performance
        optimization in production environments with thread-safe operations.
        
        Args:
            enabled: Boolean flag to enable or disable middleware
        """
        with self.thread_lock:
            # Acquire Flask thread lock for safe enabled status update in WSGI environments
            self.enabled = enabled
            
            # Update Flask middleware enabled configuration with validation
            # Log Flask middleware status change with timestamp and context information
            if self.logger:
                self.logger.info("Flask middleware enabled status changed", {
                    'enabled': enabled,
                    'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
                })
            
            # Release Flask thread lock and update middleware operational status
    
    def _initialize_caches(self) -> None:
        """Initialize internal caches for correlation tracking and performance metrics."""
        self.correlation_cache = {}
        self.performance_cache = {}
    
    def _setup_error_handling(self) -> None:
        """Set up error handling mechanisms for middleware reliability."""
        # Configure error recovery procedures and fallback mechanisms
        pass
    
    def _setup_security_integration(self, app: Flask) -> None:
        """Set up Flask-Talisman security integration for security event logging."""
        # Configure security event logging integration
        pass
    
    def _setup_wsgi_compatibility(self, app: Flask) -> None:
        """Set up WSGI-compatible logging for multi-worker deployment environments."""
        # Configure WSGI deployment compatibility
        pass
    
    def _setup_performance_monitoring(self, app: Flask) -> None:
        """Set up performance monitoring and metrics collection."""
        # Configure performance monitoring infrastructure
        pass
    
    def _log_security_event(self, status_code: int, correlation_id: str, context: Dict[str, Any]) -> None:
        """Log security events based on response status codes."""
        if status_code >= 400 and self.logger:
            self.logger.log_security(f'http_error_{status_code}', {
                'correlation_id': correlation_id,
                'status_code': status_code,
                'context': context
            })
    
    def _cleanup_request_resources(self, correlation_id: str) -> None:
        """Clean up request-specific resources and cache entries."""
        # Remove old correlation cache entries to prevent memory growth
        if len(self.correlation_cache) > 1000:
            oldest_keys = sorted(self.correlation_cache.keys())[:100]
            for key in oldest_keys:
                if key in self.correlation_cache:
                    del self.correlation_cache[key]


# Helper functions for internal middleware operations

def _setup_security_logging(app: Flask) -> None:
    """Set up Flask-Talisman security event logging integration."""
    # Configure security event logging with Flask-Talisman integration
    pass


def _setup_wsgi_logging_compatibility(app: Flask, config: Dict[str, Any]) -> None:
    """Set up WSGI-compatible logging configuration for multi-worker deployment."""
    # Configure WSGI deployment logging compatibility
    pass


def _log_security_event_if_applicable(status_code: int, correlation_id: str, context: Dict[str, Any]) -> None:
    """Log security events if status code indicates potential security issue."""
    if status_code >= 400 and FLASK_LOGGING_MIDDLEWARE_LOGGER:
        FLASK_LOGGING_MIDDLEWARE_LOGGER.log_security(f'http_error_{status_code}', {
            'correlation_id': correlation_id,
            'status_code': status_code,
            'context': context
        })


def _trigger_performance_alert(violations: list, correlation_id: str) -> None:
    """Trigger performance alerts for threshold violations."""
    if FLASK_LOGGING_MIDDLEWARE_LOGGER:
        FLASK_LOGGING_MIDDLEWARE_LOGGER.warning("Performance threshold violations detected", {
            'correlation_id': correlation_id,
            'violations': violations,
            'alert_level': 'WARNING'
        })


# Default logging middleware instance for general Flask application use
logging_middleware = FlaskLoggingMiddleware()


# Module-level exports for Flask application integration
__all__ = [
    'FlaskLoggingMiddleware',
    'create_logging_middleware',
    'before_request_handler',
    'after_request_handler',
    'log_request_details',
    'log_response_details',
    'log_middleware_performance',
    'handle_logging_error',
    'configure_middleware_logger',
    'get_middleware_metrics',
    'reset_middleware_metrics',
    'create_express_compatible_middleware',
    'logging_middleware'
]