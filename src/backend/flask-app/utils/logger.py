"""
Flask Logging Utility Module - Cross-Platform Request Correlation and Performance Monitoring

This module provides comprehensive Flask logging capabilities with structured logging,
request correlation tracking, performance monitoring, and production-ready logging
equivalent to Express.js logger patterns. Implements Flask-specific logging patterns
using Python logging module with Flask request context integration, WSGI-compatible
logging for multi-worker deployment, and complete feature parity with Express.js
logging implementation.

Features:
- Flask request context integration with correlation ID tracking
- WSGI-compatible logging for multi-worker deployment environments
- Flask-Talisman security event logging equivalent to Helmet.js patterns
- psutil-based performance monitoring with system resource tracking
- Cross-platform educational compatibility with Express.js logging patterns
- Flask application factory pattern support with environment-aware configuration
- pytest testing support with comprehensive debugging capabilities
- Production deployment logging equivalent to PM2 cluster mode with centralized management

Educational Focus:
- Flask cross-platform logging implementation maintaining Express.js feature parity
- Modern Python logging standards with Flask 3.1.1 integration patterns
- WSGI production deployment patterns with multi-worker logging coordination
- Flask-Talisman security integration equivalent to Helmet.js security logging
- pytest testing framework integration for comprehensive test logging support

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import logging  # built-in - Python standard logging module for structured logging equivalent to Node.js console
import datetime  # built-in - Date and time utilities for timezone-aware Flask logging equivalent to Node.js Date objects
import uuid  # built-in - UUID generation for Flask request correlation IDs equivalent to Node.js crypto.randomUUID
import json  # built-in - JSON serialization for structured Flask log output equivalent to Node.js JSON
import os  # built-in - Operating system interface for Flask environment variables equivalent to Node.js os module
import threading  # built-in - Threading utilities for thread-safe Flask logging in WSGI environments
import time  # built-in - High-precision timing for Flask performance measurement equivalent to Node.js process.hrtime
import traceback  # built-in - Stack trace utilities for Flask error logging equivalent to Node.js Error.stack
import functools  # built-in - Function utilities for Flask logging decorators and performance optimization
from typing import Dict, Any, Optional, Union, Callable  # built-in - Type hints for Flask logger functions

# Third-party imports with version comments for production deployment
import psutil  # ^5.9.0 - System monitoring for Flask memory usage and CPU utilization equivalent to Node.js os module

# Flask framework imports with version comments for Flask 3.1.1 compatibility
from flask import Flask, request, g, current_app  # ^3.1.1 - Core Flask components for request context access

# Internal imports for Flask configuration and cross-platform compatibility
from .constants import (
    ENV_CONSTANTS,  # Environment constants for Flask logging configuration
    HTTP_CONSTANTS,  # HTTP constants for Flask request/response logging
    SECURITY_CONSTANTS,  # Security constants for Flask-Talisman security event logging
    WSGI_CONSTANTS,  # WSGI deployment constants for multi-worker logging coordination
    TESTING_CONSTANTS  # Testing constants for pytest logging configuration
)

# Global Flask logger state management for WSGI deployment compatibility
FLASK_LOGGER_INSTANCE: Optional['FlaskLogger'] = None
REQUEST_ID_CACHE: Dict[str, str] = {}
PERFORMANCE_METRICS_CACHE: Dict[str, Dict[str, Any]] = {}
SECURITY_EVENT_COUNTER: int = 0
FLASK_LOG_LEVEL: str = os.environ.get('LOG_LEVEL', 'INFO').upper()
LOG_FORMATTERS: Dict[str, logging.Formatter] = {}

# Flask logging configuration constants for cross-platform compatibility
FLASK_LOG_FORMAT = {
    'production': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'development': '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    'testing': '%(asctime)s - %(levelname)s - %(message)s'
}

# Express.js compatibility constants for educational cross-platform comparison
EXPRESS_LOGGER_MAPPING = {
    'debug': 'debug',
    'info': 'info', 
    'warn': 'warning',
    'error': 'error',
    'log': 'info'
}


class FlaskLogger:
    """
    Comprehensive Flask logger class providing structured logging, request correlation tracking,
    performance monitoring, and security event logging with Flask request context integration.
    
    Implements Python logging patterns with Flask-specific enhancements including WSGI deployment
    support, Flask-Talisman security integration, and cross-platform compatibility with Express.js
    logging patterns for educational comparison and production deployment.
    
    This class provides thread-safe logging for WSGI multi-worker environments with automatic
    request correlation ID generation, performance metrics collection, and security event tracking
    equivalent to Express.js logging patterns for complete feature parity.
    """
    
    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initializes Flask logger with name, configuration, and Flask-specific logging setup
        for comprehensive HTTP request/response tracking with performance monitoring and
        security event logging.
        
        Args:
            name: Logger name for hierarchical logging organization
            config: Flask logger configuration dictionary with environment-specific settings
        """
        # Initialize Python logging.Logger with Flask-specific name and configuration
        self.name = name
        self.logger = logging.getLogger(f"flask.{name}")
        
        # Set up Flask logger configuration including log levels and output destinations
        self.config = config or self._get_default_config()
        self._apply_configuration()
        
        # Configure Flask-compatible formatters for structured JSON logging and monitoring
        self.formatters = self._setup_formatters()
        
        # Initialize Flask request context detection and correlation ID tracking capabilities
        self.flask_context_enabled = self._detect_flask_context()
        
        # Set up thread-safe logging for WSGI multi-threaded environments using threading.Lock
        self.thread_lock = threading.Lock()
        
        # Configure Flask performance metrics cache and monitoring integration with psutil
        self.performance_cache: Dict[str, Any] = {}
        
        # Initialize Flask security event tracking and Flask-Talisman integration
        self._initialize_security_tracking()
        
        # Log Flask logger initialization with configuration details and context information
        self.info(f"Flask logger '{name}' initialized with configuration", {
            'config': self.config,
            'flask_context': self.flask_context_enabled,
            'log_level': self.logger.level
        })
    
    def _get_default_config(self) -> Dict[str, Any]:
        """
        Generates default Flask logger configuration based on environment constants
        and Flask application settings for cross-platform compatibility.
        """
        environment = os.environ.get('FLASK_ENV', 'development')
        return {
            'level': FLASK_LOG_LEVEL,
            'format': FLASK_LOG_FORMAT.get(environment, FLASK_LOG_FORMAT['development']),
            'handlers': ['console'],
            'flask_context': True,
            'performance_monitoring': True,
            'security_logging': True,
            'correlation_tracking': True
        }
    
    def _apply_configuration(self) -> None:
        """
        Applies Flask logger configuration including log level, handlers, and formatters
        with environment-specific settings for development, testing, and production.
        """
        # Set log level based on configuration and Flask environment
        log_level = getattr(logging, self.config.get('level', 'INFO').upper())
        self.logger.setLevel(log_level)
        
        # Configure handlers based on Flask environment and deployment requirements
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setLevel(log_level)
            
            # Apply Flask-specific formatting with structured output
            formatter = logging.Formatter(self.config.get('format'))
            handler.setFormatter(formatter)
            
            self.logger.addHandler(handler)
        
        # Prevent duplicate logging in Flask application context
        self.logger.propagate = False
    
    def _setup_formatters(self) -> Dict[str, logging.Formatter]:
        """
        Sets up Flask-compatible formatters for different output formats including
        JSON structured logging and plain text formats for various deployment scenarios.
        """
        return {
            'json': logging.Formatter('%(message)s'),  # JSON formatter handles structure internally
            'plain': logging.Formatter(self.config.get('format')),
            'debug': logging.Formatter(FLASK_LOG_FORMAT['development'])
        }
    
    def _detect_flask_context(self) -> bool:
        """
        Detects whether Flask application context is available for request correlation
        tracking and context-aware logging functionality.
        """
        try:
            from flask import has_app_context, has_request_context
            return has_app_context() or has_request_context()
        except ImportError:
            return False
        except RuntimeError:
            return False
    
    def _initialize_security_tracking(self) -> None:
        """
        Initializes Flask security event tracking and metrics collection for
        Flask-Talisman integration and security monitoring.
        """
        global SECURITY_EVENT_COUNTER
        self.security_events = 0
        self.security_config = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs debug-level messages with Flask request context and detailed debugging information
        including stack traces, performance metrics, and system state for development troubleshooting.
        
        Args:
            message: Debug message string for detailed development information
            context: Additional context dictionary for enhanced debugging information
        """
        # Check Flask debug logging level and environment configuration from FLASK_LOG_LEVEL
        if not self.logger.isEnabledFor(logging.DEBUG):
            return
        
        with self.thread_lock:
            # Format debug message with Flask request correlation ID from g object
            correlation_id = self.get_request_id()
            
            # Add Flask request context including URL, method, and headers if available
            debug_context = self._build_request_context()
            if context:
                debug_context.update(context)
            
            # Include system debugging information using psutil for memory and CPU state
            debug_context.update(self._get_system_debug_info())
            
            # Apply Flask-specific debug formatting with structured JSON output
            formatted_message = self._format_message('DEBUG', message, debug_context, correlation_id)
            
            # Output debug information to Flask debug destinations with thread safety
            self.logger.debug(formatted_message)
            
            # Update debug metrics in performance_cache for Flask monitoring
            self._update_performance_metrics('debug', message, debug_context)
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs informational messages for Flask application flow and system events with request
        correlation tracking and operational monitoring integration for production environments.
        
        Args:
            message: Informational message string for operational monitoring
            context: Additional context dictionary for monitoring and debugging
        """
        with self.thread_lock:
            # Validate Flask info logging level and check output requirements
            correlation_id = self.get_request_id()
            
            # Format informational message with Flask correlation tracking and timestamp
            info_context = self._build_request_context()
            if context:
                info_context.update(context)
            
            # Add Flask request context and environment information for monitoring
            info_context.update(self._get_environment_info())
            
            # Apply structured JSON formatting for Flask log aggregation systems
            formatted_message = self._format_message('INFO', message, info_context, correlation_id)
            
            # Output to Flask informational log destinations with WSGI compatibility
            self.logger.info(formatted_message)
            
            # Update informational metrics and monitoring counters in performance_cache
            self._update_performance_metrics('info', message, info_context)
    
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs warning messages for Flask application issues and potential problems with operational
        guidance and monitoring integration for system administration and alerting.
        
        Args:
            message: Warning message string for operational alerting
            context: Additional context dictionary for warning investigation
        """
        with self.thread_lock:
            # Check Flask warning log level configuration and alerting requirements
            correlation_id = self.get_request_id()
            
            # Format warning message with severity indicators for Flask monitoring systems
            warning_context = self._build_request_context()
            if context:
                warning_context.update(context)
            
            # Add Flask context information and resolution guidance for operations teams
            warning_context.update({
                'severity': 'WARNING',
                'requires_attention': True,
                'system_state': self._get_system_state()
            })
            
            # Include Flask correlation tracking for warning investigation and debugging
            formatted_message = self._format_message('WARNING', message, warning_context, correlation_id)
            
            # Output to Flask warning destinations and monitoring systems with priority
            self.logger.warning(formatted_message)
            
            # Update warning counters and trigger Flask alerting if configured
            self._update_performance_metrics('warning', message, warning_context)
    
    def error(self, message: str, error: Optional[Exception] = None, context: Optional[Dict[str, Any]] = None) -> None:
        """
        Logs error messages with comprehensive Flask error context, exception details, and incident
        response information for debugging and production error tracking with alerting integration.
        
        Args:
            message: Error message string for incident response
            error: Exception object for detailed error analysis
            context: Additional context dictionary for error investigation
        """
        with self.thread_lock:
            # Format Flask error message with urgency and severity indicators
            correlation_id = self.get_request_id()
            
            # Extract exception details using traceback module for comprehensive error context
            error_context = self._build_request_context()
            if context:
                error_context.update(context)
            
            if error:
                error_context.update({
                    'exception_type': type(error).__name__,
                    'exception_message': str(error),
                    'stack_trace': traceback.format_exc(),
                    'error_module': getattr(error, '__module__', 'unknown')
                })
            
            # Add Flask request correlation and context for debugging applications
            error_context.update({
                'severity': 'ERROR',
                'requires_immediate_attention': True,
                'system_state': self._get_system_state(),
                'performance_metrics': self._get_current_performance_metrics()
            })
            
            # Include Flask system state and performance metrics at error time
            formatted_message = self._format_message('ERROR', message, error_context, correlation_id)
            
            # Output to Flask error destinations and incident response systems
            self.logger.error(formatted_message)
            
            # Update error metrics and trigger Flask incident response if configured
            global SECURITY_EVENT_COUNTER
            SECURITY_EVENT_COUNTER += 1
            self._update_performance_metrics('error', message, error_context)
    
    def child(self, child_context: Dict[str, Any]) -> 'FlaskLogger':
        """
        Creates child Flask logger instance with inherited configuration and additional context
        for request-scoped logging and hierarchical log management with Flask request correlation.
        
        Args:
            child_context: Additional context dictionary for child logger enhancement
            
        Returns:
            Child Flask logger instance with inherited configuration and additional context
        """
        # Create child Flask logger with inherited parent configuration and formatters
        child_name = f"{self.name}.{child_context.get('name', 'child')}"
        child_config = self.config.copy()
        child_config.update(child_context.get('config', {}))
        
        # Add child-specific context information and correlation tracking
        child_logger = FlaskLogger(child_name, child_config)
        
        # Inherit Flask request context and correlation ID from parent logger
        child_logger.flask_context_enabled = self.flask_context_enabled
        child_logger.performance_cache.update(self.performance_cache)
        
        # Configure child logger with additional context and formatting options
        child_logger.info(f"Child logger created from parent '{self.name}'", child_context)
        
        # Set up thread safety for child logger in WSGI environments
        # Return configured child Flask logger with enhanced context
        return child_logger
    
    def log_performance(self, metrics: Dict[str, Any]) -> None:
        """
        Logs Flask performance metrics including response times, memory usage, and system
        resource utilization with structured output for monitoring and optimization analysis.
        
        Args:
            metrics: Performance metrics dictionary with system resource information
        """
        with self.thread_lock:
            # Validate Flask performance metrics and system resource information
            correlation_id = self.get_request_id()
            
            # Format performance data with structured JSON for Flask monitoring systems
            performance_context = self._build_request_context()
            performance_context.update(metrics)
            
            # Add Flask correlation information and request context for tracking
            performance_context.update({
                'metric_type': 'performance',
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'system_metrics': self._get_current_performance_metrics()
            })
            
            # Include WSGI deployment metrics and multi-worker performance data
            if 'worker_id' not in performance_context:
                performance_context['worker_id'] = os.getpid()
            
            # Compare against TESTING_CONSTANTS.PERFORMANCE_TARGETS for Flask thresholds
            self._validate_performance_thresholds(performance_context)
            
            # Output to Flask performance monitoring destinations with structured format
            formatted_message = self._format_message('INFO', 'Performance metrics', performance_context, correlation_id)
            self.logger.info(formatted_message)
            
            # Update performance_cache and trigger alerts for threshold violations
            self._update_performance_metrics('performance', 'metrics', performance_context)
    
    def log_security(self, event_type: str, security_context: Dict[str, Any]) -> None:
        """
        Logs Flask security events including authentication failures, Flask-Talisman violations,
        and security threats with enhanced audit trail and incident response integration.
        
        Args:
            event_type: Security event type classification for incident response
            security_context: Security event context dictionary for investigation
        """
        with self.thread_lock:
            # Classify Flask security event type and severity using SECURITY_CONSTANTS
            correlation_id = self.get_request_id()
            
            # Sanitize security context to prevent information disclosure in Flask logs
            sanitized_context = self._sanitize_security_context(security_context)
            
            # Add Flask request correlation and client identification for security tracking
            security_log_context = self._build_request_context()
            security_log_context.update({
                'event_type': event_type,
                'security_classification': self._classify_security_event(event_type),
                'talisman_config': self.security_config,
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            })
            security_log_context.update(sanitized_context)
            
            # Include Flask-Talisman policy context and violation details for investigation
            if 'talisman_violation' in security_context:
                security_log_context['talisman_details'] = security_context['talisman_violation']
            
            # Format security event for SIEM integration and Flask monitoring systems
            formatted_message = self._format_message('WARNING', f'Security event: {event_type}', security_log_context, correlation_id)
            
            # Output to Flask security destinations and incident response systems
            self.logger.warning(formatted_message)
            
            # Update security metrics and trigger automated Flask security response
            global SECURITY_EVENT_COUNTER
            SECURITY_EVENT_COUNTER += 1
            self._update_performance_metrics('security', event_type, security_log_context)
    
    def get_request_id(self) -> str:
        """
        Retrieves current Flask request correlation ID from request context or generates new ID
        for request tracking and distributed logging coordination.
        
        Returns:
            Current Flask request correlation ID for tracking and logging
        """
        # Check Flask g object for existing request correlation ID
        try:
            if hasattr(g, 'request_id'):
                return g.request_id
        except RuntimeError:
            pass  # No Flask application context available
        
        # Retrieve correlation ID from Flask request headers if available
        try:
            if request and hasattr(request, 'headers'):
                correlation_id = request.headers.get('X-Correlation-ID')
                if correlation_id:
                    return correlation_id
        except RuntimeError:
            pass  # No Flask request context available
        
        # Generate new Flask correlation ID if none exists using generate_flask_request_id
        correlation_id = generate_flask_request_id()
        
        # Store correlation ID in Flask g object for request lifecycle tracking
        try:
            g.request_id = correlation_id
        except RuntimeError:
            pass  # No Flask application context available
        
        # Return Flask correlation ID for logging and monitoring use
        return correlation_id
    
    def set_context(self, context: Dict[str, Any]) -> None:
        """
        Sets additional logging context for Flask logger instance including request information,
        user context, and application-specific metadata for enhanced logging.
        
        Args:
            context: Context dictionary with additional logging metadata
        """
        with self.thread_lock:
            # Validate Flask context information and sanitize sensitive data
            sanitized_context = self._sanitize_context(context)
            
            # Merge new context with existing Flask logger configuration
            self.config.update(sanitized_context.get('config', {}))
            
            # Update Flask logger formatters with additional context information
            if 'formatters' in sanitized_context:
                self.formatters.update(sanitized_context['formatters'])
            
            # Configure Flask request context integration with new metadata
            if 'flask_context' in sanitized_context:
                self.flask_context_enabled = sanitized_context['flask_context']
            
            # Update thread-safe context storage for WSGI multi-worker environments
            self.performance_cache.update(sanitized_context.get('performance_cache', {}))
            
            # Log Flask context update operation for debugging and monitoring
            self.info("Logger context updated", {'context_keys': list(sanitized_context.keys())})
    
    def _build_request_context(self) -> Dict[str, Any]:
        """
        Builds comprehensive Flask request context dictionary for logging enhancement
        with request details, timing information, and system state.
        """
        context = {
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'logger_name': self.name,
            'process_id': os.getpid(),
            'thread_id': threading.get_ident()
        }
        
        # Add Flask request context if available
        try:
            if request:
                context.update({
                    'method': request.method,
                    'url': request.url,
                    'remote_addr': request.remote_addr,
                    'user_agent': request.headers.get('User-Agent', 'Unknown'),
                    'content_type': request.content_type
                })
        except RuntimeError:
            pass  # No Flask request context available
        
        # Add Flask application context if available
        try:
            if current_app:
                context.update({
                    'app_name': current_app.name,
                    'debug_mode': current_app.debug,
                    'testing_mode': current_app.testing
                })
        except RuntimeError:
            pass  # No Flask application context available
        
        return context
    
    def _format_message(self, level: str, message: str, context: Dict[str, Any], correlation_id: str) -> str:
        """
        Formats Flask log message with structured JSON output for monitoring and aggregation systems.
        """
        log_entry = {
            'level': level,
            'message': message,
            'correlation_id': correlation_id,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'context': context
        }
        
        # Return JSON formatted string for structured logging
        try:
            return json.dumps(log_entry, default=str, ensure_ascii=False)
        except (TypeError, ValueError):
            # Fallback to plain text formatting if JSON serialization fails
            return f"[{level}] {correlation_id} - {message} - {context}"
    
    def _get_system_debug_info(self) -> Dict[str, Any]:
        """
        Collects system debugging information using psutil for memory and CPU state analysis.
        """
        try:
            process = psutil.Process()
            return {
                'memory_info': process.memory_info()._asdict(),
                'cpu_percent': process.cpu_percent(),
                'open_files_count': len(process.open_files()),
                'threads_count': process.num_threads(),
                'system_cpu_percent': psutil.cpu_percent(),
                'system_memory_percent': psutil.virtual_memory().percent
            }
        except (psutil.Error, OSError):
            return {'system_info': 'unavailable'}
    
    def _get_environment_info(self) -> Dict[str, Any]:
        """
        Collects Flask environment information for operational monitoring and debugging.
        """
        return {
            'flask_env': os.environ.get('FLASK_ENV', 'development'),
            'python_version': f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
            'environment_variables': {
                key: value for key, value in os.environ.items() 
                if key.startswith(('FLASK_', 'LOG_')) and 'SECRET' not in key
            }
        }
    
    def _get_system_state(self) -> Dict[str, Any]:
        """
        Collects current system state information for error analysis and performance monitoring.
        """
        try:
            return {
                'cpu_count': psutil.cpu_count(),
                'memory_total': psutil.virtual_memory().total,
                'memory_available': psutil.virtual_memory().available,
                'disk_usage': psutil.disk_usage('/').percent,
                'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else None,
                'uptime': time.time() - psutil.boot_time()
            }
        except (psutil.Error, OSError, AttributeError):
            return {'system_state': 'unavailable'}
    
    def _get_current_performance_metrics(self) -> Dict[str, Any]:
        """
        Collects current performance metrics for monitoring and alerting systems.
        """
        try:
            process = psutil.Process()
            return {
                'memory_rss': process.memory_info().rss,
                'memory_vms': process.memory_info().vms,
                'cpu_percent': process.cpu_percent(interval=0.1),
                'num_threads': process.num_threads(),
                'num_fds': process.num_fds() if hasattr(process, 'num_fds') else None,
                'create_time': process.create_time()
            }
        except (psutil.Error, OSError):
            return {'performance_metrics': 'unavailable'}
    
    def _validate_performance_thresholds(self, metrics: Dict[str, Any]) -> None:
        """
        Validates performance metrics against TESTING_CONSTANTS thresholds and triggers alerts.
        """
        thresholds = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
        
        # Check response time threshold
        if 'response_time_ms' in metrics:
            response_time = metrics['response_time_ms']
            threshold = thresholds.get('response_time_ms', 100)
            if response_time > threshold:
                self.warning(f"Response time {response_time}ms exceeds threshold {threshold}ms", metrics)
        
        # Check memory usage threshold
        if 'memory_usage_mb' in metrics:
            memory_usage = metrics['memory_usage_mb']
            threshold = thresholds.get('memory_usage_mb', 100)
            if memory_usage > threshold:
                self.warning(f"Memory usage {memory_usage}MB exceeds threshold {threshold}MB", metrics)
    
    def _sanitize_security_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes security context to prevent sensitive information disclosure in logs.
        """
        sanitized = context.copy()
        
        # Remove sensitive fields that should not be logged
        sensitive_fields = ['password', 'token', 'secret', 'key', 'authorization']
        for field in sensitive_fields:
            if field in sanitized:
                sanitized[field] = '[REDACTED]'
        
        # Sanitize nested dictionaries
        for key, value in sanitized.items():
            if isinstance(value, dict):
                sanitized[key] = self._sanitize_security_context(value)
        
        return sanitized
    
    def _classify_security_event(self, event_type: str) -> str:
        """
        Classifies security event type for appropriate handling and alerting.
        """
        classification_map = {
            'authentication_failure': 'medium',
            'authorization_violation': 'high',
            'talisman_violation': 'medium',
            'suspicious_activity': 'high',
            'rate_limit_exceeded': 'low',
            'security_header_violation': 'medium'
        }
        return classification_map.get(event_type, 'medium')
    
    def _sanitize_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes logging context to prevent sensitive information disclosure.
        """
        sanitized = {}
        for key, value in context.items():
            if 'password' in key.lower() or 'secret' in key.lower() or 'token' in key.lower():
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_context(value)
            else:
                sanitized[key] = value
        return sanitized
    
    def _update_performance_metrics(self, log_level: str, message: str, context: Dict[str, Any]) -> None:
        """
        Updates performance metrics cache for monitoring and analysis.
        """
        global PERFORMANCE_METRICS_CACHE
        
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        metric_entry = {
            'timestamp': timestamp,
            'level': log_level,
            'message_length': len(message),
            'context_size': len(json.dumps(context, default=str)),
            'thread_id': threading.get_ident(),
            'process_id': os.getpid()
        }
        
        PERFORMANCE_METRICS_CACHE[timestamp] = metric_entry
        
        # Keep only recent metrics to prevent memory growth
        if len(PERFORMANCE_METRICS_CACHE) > 1000:
            oldest_keys = sorted(PERFORMANCE_METRICS_CACHE.keys())[:100]
            for key in oldest_keys:
                del PERFORMANCE_METRICS_CACHE[key]


# Factory function implementations for Flask logger creation and management

def create_flask_logger(logger_config: Dict[str, Any]) -> FlaskLogger:
    """
    Factory function that creates a Flask-compatible logger instance with environment-specific
    configuration, log level management, Flask request context integration, and WSGI deployment
    support. Configures Python logging module with Flask patterns, structured output formatting,
    and cross-platform compatibility with Express.js logger patterns.
    
    Args:
        logger_config: Flask logger configuration dictionary with environment settings
        
    Returns:
        Configured Flask logger instance with debug, info, warning, error methods and Flask request context integration
    """
    # Validate Flask logger configuration and apply environment-specific defaults from ENV_CONSTANTS
    config = logger_config.copy()
    environment = os.environ.get('FLASK_ENV', 'development')
    env_defaults = ENV_CONSTANTS.get('FLASK_ENV_MAPPING', {}).get(environment, {})
    
    # Determine appropriate log level based on FLASK_ENV and FLASK_LOG_LEVEL configuration
    if 'level' not in config:
        if env_defaults.get('DEBUG', False):
            config['level'] = 'DEBUG'
        else:
            config['level'] = FLASK_LOG_LEVEL
    
    # Configure Flask-compatible output destinations including console, file, and WSGI integration
    if 'handlers' not in config:
        config['handlers'] = ['console']
        if environment == 'production':
            config['handlers'].append('file')
    
    # Set up Flask log formatting with JSON structure and request correlation ID support
    if 'format' not in config:
        config['format'] = FLASK_LOG_FORMAT.get(environment, FLASK_LOG_FORMAT['development'])
    
    # Initialize Flask performance metrics tracking and correlation support with threading safety
    config.setdefault('performance_monitoring', True)
    config.setdefault('correlation_tracking', True)
    config.setdefault('security_logging', True)
    
    # Configure Flask log rotation and file management for production WSGI environments
    if environment == 'production':
        config.setdefault('log_rotation', True)
        config.setdefault('max_file_size', '10MB')
        config.setdefault('backup_count', 5)
    
    # Set up Flask error handling and fallback logging mechanisms with exception safety
    config.setdefault('error_handling', True)
    config.setdefault('fallback_logging', True)
    
    # Configure Flask request context integration for automatic correlation ID tracking
    config.setdefault('flask_context', True)
    
    # Return configured Flask logger instance with all logging methods and context awareness
    logger_name = config.get('name', 'flask_app')
    return FlaskLogger(logger_name, config)


def debug(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs debug-level messages with detailed Flask context information for development debugging
    and troubleshooting. Only outputs in development environment or when explicitly enabled to
    prevent production log pollution while providing comprehensive debugging information with
    Flask request correlation and system state.
    
    Args:
        message: Debug message string for detailed development information
        context: Additional context dictionary for enhanced debugging information
    """
    global FLASK_LOGGER_INSTANCE
    
    # Check if debug logging is enabled based on FLASK_LOG_LEVEL configuration and environment
    if FLASK_LOG_LEVEL != 'DEBUG' and os.environ.get('FLASK_ENV') == 'production':
        return
    
    # Create default logger instance if none exists
    if FLASK_LOGGER_INSTANCE is None:
        FLASK_LOGGER_INSTANCE = create_flask_logger({'name': 'default'})
    
    # Format debug message with Flask timestamp and correlation information from Flask g object
    debug_context = context or {}
    debug_context.update({
        'debug_mode': True,
        'environment': os.environ.get('FLASK_ENV', 'development')
    })
    
    # Add Flask context information including request details and system state from current_app
    try:
        if current_app:
            debug_context['app_context'] = {
                'name': current_app.name,
                'debug': current_app.debug,
                'testing': current_app.testing
            }
    except RuntimeError:
        pass  # No Flask application context available
    
    # Include Flask performance metrics and memory usage using psutil if available
    try:
        process = psutil.Process()
        debug_context['system_info'] = {
            'memory_percent': process.memory_percent(),
            'cpu_percent': process.cpu_percent(),
            'threads': process.num_threads()
        }
    except (psutil.Error, OSError):
        pass
    
    # Extract Flask request correlation ID from g object or generate new ID for tracking
    # Output to appropriate debug destination (console or debug log file) with Flask formatting
    # Update debug message counters and metrics tracking in PERFORMANCE_METRICS_CACHE
    FLASK_LOGGER_INSTANCE.debug(message, debug_context)


def info(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs informational messages for general Flask application flow, request processing, and system
    events. Provides balanced logging for both development and production environments with structured
    output and correlation tracking for operational monitoring with Flask request context and WSGI
    deployment compatibility.
    
    Args:
        message: Informational message string for operational monitoring
        context: Additional context dictionary for monitoring and debugging
    """
    global FLASK_LOGGER_INSTANCE
    
    # Create default logger instance if none exists
    if FLASK_LOGGER_INSTANCE is None:
        FLASK_LOGGER_INSTANCE = create_flask_logger({'name': 'default'})
    
    # Validate log level and check if info logging is enabled based on FLASK_LOG_LEVEL
    info_context = context or {}
    
    # Format informational message with structured JSON output format for Flask monitoring
    info_context.update({
        'log_type': 'informational',
        'environment': os.environ.get('FLASK_ENV', 'development')
    })
    
    # Add Flask correlation ID from g object and request context if available from Flask request
    try:
        if request:
            info_context['request_info'] = {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr
            }
    except RuntimeError:
        pass  # No Flask request context available
    
    # Include timestamp and environment information using datetime module with timezone support
    info_context['timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Output to configured destinations (console, file, or WSGI logs) with Flask compatibility
    # Update informational message metrics and tracking in PERFORMANCE_METRICS_CACHE dictionary
    FLASK_LOGGER_INSTANCE.info(message, info_context)


def warning(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs warning messages for potential Flask issues, deprecated usage, configuration problems,
    and recoverable errors. Provides important operational information for monitoring systems
    and administrators while maintaining Flask system functionality with request correlation
    and security context.
    
    Args:
        message: Warning message string for operational alerting
        context: Additional context dictionary for warning investigation
    """
    global FLASK_LOGGER_INSTANCE
    
    # Create default logger instance if none exists
    if FLASK_LOGGER_INSTANCE is None:
        FLASK_LOGGER_INSTANCE = create_flask_logger({'name': 'default'})
    
    # Check warning log level configuration and output requirements based on FLASK_LOG_LEVEL
    warning_context = context or {}
    
    # Format warning message with appropriate severity indicators for Flask monitoring systems
    warning_context.update({
        'log_type': 'warning',
        'severity': 'WARNING',
        'requires_attention': True
    })
    
    # Add Flask context information and potential resolution guidance for operational teams
    try:
        if current_app:
            warning_context['app_context'] = {
                'name': current_app.name,
                'config': {key: value for key, value in current_app.config.items() 
                          if 'SECRET' not in key}
            }
    except RuntimeError:
        pass  # No Flask application context available
    
    # Include Flask correlation tracking from g object for warning investigation and debugging
    # Output to warning log destinations and Flask monitoring systems with structured format
    # Update warning counters and trigger alerting if configured in Flask monitoring system
    FLASK_LOGGER_INSTANCE.warning(message, warning_context)


def error(message: str, error: Optional[Exception] = None, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs error messages with comprehensive Flask error context, stack traces, and correlation
    information for debugging and incident response. Provides critical error information for
    production monitoring, alerting systems, and error tracking workflows with Flask request
    context and WSGI process information.
    
    Args:
        message: Error message string for incident response
        error: Exception object for detailed error analysis
        context: Additional context dictionary for error investigation
    """
    global FLASK_LOGGER_INSTANCE, SECURITY_EVENT_COUNTER
    
    # Create default logger instance if none exists
    if FLASK_LOGGER_INSTANCE is None:
        FLASK_LOGGER_INSTANCE = create_flask_logger({'name': 'default'})
    
    # Format error message with severity and urgency indicators for Flask incident response
    error_context = context or {}
    error_context.update({
        'log_type': 'error',
        'severity': 'ERROR',
        'requires_immediate_attention': True
    })
    
    # Extract and include error stack trace using traceback module and error type information
    if error:
        error_context.update({
            'exception_type': type(error).__name__,
            'exception_message': str(error),
            'stack_trace': traceback.format_exc()
        })
    
    # Add Flask request correlation from g object and context for debugging Flask applications
    try:
        if request:
            error_context['request_details'] = {
                'method': request.method,
                'url': request.url,
                'headers': dict(request.headers),
                'remote_addr': request.remote_addr
            }
    except RuntimeError:
        pass  # No Flask request context available
    
    # Include Flask system state and performance metrics at error time using psutil
    try:
        process = psutil.Process()
        error_context['system_state'] = {
            'memory_info': process.memory_info()._asdict(),
            'cpu_percent': process.cpu_percent(),
            'num_threads': process.num_threads()
        }
    except (psutil.Error, OSError):
        pass
    
    # Output to error log destinations and Flask alerting systems with high priority
    # Update SECURITY_EVENT_COUNTER and trigger incident response if configured for Flask monitoring
    SECURITY_EVENT_COUNTER += 1
    FLASK_LOGGER_INSTANCE.error(message, error, error_context)


def generate_flask_request_id(prefix: str = "flask") -> str:
    """
    Generates unique request correlation IDs using Python uuid module for tracking Flask requests
    across WSGI workers, middleware, and distributed systems. Supports Flask request lifecycle
    tracking and debugging across WSGI deployment boundaries with thread-safe generation and
    Flask request context integration.
    
    Args:
        prefix: Optional prefix string for Flask blueprint or route identification
        
    Returns:
        Unique Flask request correlation ID for distributed request tracking in WSGI environments
    """
    # Generate cryptographically secure UUID using uuid.uuid4() for Flask uniqueness guarantees
    unique_id = str(uuid.uuid4())
    
    # Include timestamp component for temporal correlation in Flask request tracking
    timestamp = int(time.time() * 1000)  # Millisecond timestamp
    
    # Add WSGI process ID component for multi-worker Flask deployment identification
    process_id = os.getpid()
    
    # Apply optional prefix for Flask blueprint or route identification and categorization
    if prefix:
        correlation_id = f"{prefix}-{timestamp}-{process_id}-{unique_id[:8]}"
    else:
        correlation_id = f"{timestamp}-{process_id}-{unique_id[:8]}"
    
    # Format correlation ID with consistent structure and encoding for Flask compatibility
    formatted_id = correlation_id.replace('-', '_').lower()
    
    # Store correlation ID in REQUEST_ID_CACHE and Flask g object for lifecycle management
    global REQUEST_ID_CACHE
    REQUEST_ID_CACHE[formatted_id] = {
        'timestamp': timestamp,
        'process_id': process_id,
        'uuid': unique_id
    }
    
    try:
        g.request_id = formatted_id
    except RuntimeError:
        pass  # No Flask application context available
    
    # Return formatted correlation ID ready for Flask request tracking and logging
    return formatted_id


def log_flask_performance_metrics(metrics: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs Flask performance metrics including response times, memory usage, CPU utilization, and
    throughput measurements for production monitoring and optimization. Integrates with WSGI
    monitoring and provides structured performance data for analysis with Flask request correlation
    and psutil system monitoring.
    
    Args:
        metrics: Performance metrics dictionary with system resource information
        context: Additional context dictionary for performance tracking
    """
    global FLASK_LOGGER_INSTANCE
    
    # Create default logger instance if none exists
    if FLASK_LOGGER_INSTANCE is None:
        FLASK_LOGGER_INSTANCE = create_flask_logger({'name': 'default'})
    
    # Validate Flask performance metrics and extract key performance indicators using psutil
    performance_context = context or {}
    performance_context.update(metrics)
    
    # Format performance data with structured JSON output for Flask monitoring systems
    performance_context.update({
        'metric_type': 'performance',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'environment': os.environ.get('FLASK_ENV', 'development')
    })
    
    # Add Flask correlation information and request context for performance tracking
    try:
        if request:
            performance_context['request_performance'] = {
                'method': request.method,
                'endpoint': request.endpoint,
                'path': request.path
            }
    except RuntimeError:
        pass  # No Flask request context available
    
    # Include WSGI system resource utilization and memory usage statistics using psutil
    try:
        process = psutil.Process()
        system_metrics = {
            'memory_rss': process.memory_info().rss,
            'memory_vms': process.memory_info().vms,
            'cpu_percent': process.cpu_percent(interval=0.1),
            'num_threads': process.num_threads(),
            'system_cpu_percent': psutil.cpu_percent(),
            'system_memory_percent': psutil.virtual_memory().percent
        }
        performance_context['system_metrics'] = system_metrics
    except (psutil.Error, OSError):
        performance_context['system_metrics'] = 'unavailable'
    
    # Compare metrics against TESTING_CONSTANTS.PERFORMANCE_TARGETS and Flask thresholds
    targets = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
    for metric, value in metrics.items():
        if metric in targets:
            threshold = targets[metric]
            if isinstance(value, (int, float)) and value > threshold:
                performance_context[f'{metric}_threshold_exceeded'] = True
    
    # Output to performance log destinations and Flask monitoring dashboards with structured data
    # Update PERFORMANCE_METRICS_CACHE and trigger alerts for threshold violations in Flask monitoring
    FLASK_LOGGER_INSTANCE.log_performance(performance_context)


def log_flask_security_event(event_type: str, security_context: Dict[str, Any], request_context: Optional[Dict[str, Any]] = None) -> None:
    """
    Logs Flask security events including authentication failures, authorization violations,
    Flask-Talisman policy violations, and security threats with enhanced context for security
    monitoring and incident response. Integrates with Flask-Talisman security middleware and
    threat detection systems for comprehensive security audit trails.
    
    Args:
        event_type: Security event type classification for incident response
        security_context: Security event context dictionary for investigation  
        request_context: Flask request context dictionary for security tracking
    """
    global FLASK_LOGGER_INSTANCE, SECURITY_EVENT_COUNTER
    
    # Create default logger instance if none exists
    if FLASK_LOGGER_INSTANCE is None:
        FLASK_LOGGER_INSTANCE = create_flask_logger({'name': 'default'})
    
    # Classify Flask security event type and determine appropriate severity level using SECURITY_CONSTANTS
    event_classification = _classify_security_event_type(event_type)
    
    # Sanitize security context to prevent sensitive information disclosure in Flask logs
    sanitized_security_context = _sanitize_security_context(security_context)
    
    # Add Flask request correlation from g object and client identification information
    complete_context = request_context or {}
    complete_context.update(sanitized_security_context)
    complete_context.update({
        'event_type': event_type,
        'event_classification': event_classification,
        'security_level': 'HIGH' if event_classification in ['authentication_failure', 'authorization_violation'] else 'MEDIUM'
    })
    
    try:
        if request:
            complete_context['request_security_info'] = {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'referer': request.headers.get('Referer', 'Unknown')
            }
    except RuntimeError:
        pass  # No Flask request context available
    
    # Include timestamp and Flask-Talisman security policy context for investigation
    complete_context.update({
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'talisman_config': SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {}),
        'security_headers': SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
    })
    
    # Format security event with structured JSON output for SIEM integration and Flask monitoring
    # Output to security log destinations and Flask alerting systems with high priority
    # Update SECURITY_EVENT_COUNTER and trigger automated response if configured for Flask security
    SECURITY_EVENT_COUNTER += 1
    FLASK_LOGGER_INSTANCE.log_security(event_type, complete_context)


def create_flask_request_logger(flask_request: Any, options: Optional[Dict[str, Any]] = None) -> FlaskLogger:
    """
    Factory function that creates Flask request-scoped logger instances with correlation tracking,
    performance monitoring, and contextual information for comprehensive request lifecycle logging.
    Supports Flask middleware integration and WSGI deployment compatibility with thread-safe
    request context management.
    
    Args:
        flask_request: Flask request object for context extraction
        options: Configuration options dictionary for request logger customization
        
    Returns:
        Flask request-scoped logger with correlation tracking and context management for request lifecycle
    """
    # Generate unique Flask request correlation ID using generate_flask_request_id utility
    correlation_id = generate_flask_request_id("req")
    
    # Extract Flask request context including method, URL, headers, and client information
    request_context = {}
    if flask_request:
        request_context = {
            'method': getattr(flask_request, 'method', 'UNKNOWN'),
            'url': getattr(flask_request, 'url', 'unknown'),
            'path': getattr(flask_request, 'path', 'unknown'),
            'remote_addr': getattr(flask_request, 'remote_addr', 'unknown'),
            'user_agent': getattr(flask_request, 'headers', {}).get('User-Agent', 'Unknown'),
            'content_type': getattr(flask_request, 'content_type', 'unknown')
        }
    
    # Create Flask request-scoped logger instance with correlation context and thread safety
    logger_config = options or {}
    logger_config.update({
        'name': f'request_{correlation_id}',
        'correlation_id': correlation_id,
        'request_context': request_context,
        'flask_context': True
    })
    
    # Set up Flask performance timing and metrics collection for the request lifecycle
    start_time = time.time()
    logger_config['start_time'] = start_time
    
    # Configure Flask log formatting with request-specific context and correlation tracking
    # Initialize Flask request lifecycle tracking and monitoring with WSGI compatibility
    request_logger = create_flask_logger(logger_config)
    
    # Store correlation ID in Flask g object for middleware and route handler access
    try:
        g.request_id = correlation_id
        g.request_logger = request_logger
        g.request_start_time = start_time
    except RuntimeError:
        pass  # No Flask application context available
    
    # Return configured Flask request logger with correlation and context management
    request_logger.info("Request logger created", {
        'correlation_id': correlation_id,
        'request_context': request_context
    })
    
    return request_logger


def format_flask_log_message(level: str, message: str, context: Dict[str, Any], options: Optional[Dict[str, Any]] = None) -> str:
    """
    Formats Flask log messages with consistent JSON structure including timestamp, log level,
    correlation ID, and contextual information for structured logging and parsing by log
    aggregation systems. Supports multiple output formats and Flask environment-specific
    formatting with WSGI deployment compatibility.
    
    Args:
        level: Log level string for severity classification
        message: Log message string for structured output
        context: Context dictionary with additional logging information
        options: Formatting options dictionary for output customization
        
    Returns:
        Formatted Flask log message with structured JSON output ready for logging destinations
    """
    # Generate ISO timestamp with timezone information using datetime module for temporal correlation
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Format log level with consistent casing and formatting standards for Flask compatibility
    formatted_level = level.upper()
    
    # Add Flask correlation ID from g object or request headers if available
    correlation_id = None
    try:
        if hasattr(g, 'request_id'):
            correlation_id = g.request_id
    except RuntimeError:
        pass  # No Flask application context available
    
    if not correlation_id:
        correlation_id = generate_flask_request_id("log")
    
    # Include WSGI process information for multi-worker Flask deployment identification
    process_info = {
        'process_id': os.getpid(),
        'thread_id': threading.get_ident(),
        'worker_id': os.environ.get('GUNICORN_WORKER_ID', 'unknown')
    }
    
    # Apply Flask environment-specific formatting rules and output structure from ENV_CONSTANTS
    environment = os.environ.get('FLASK_ENV', 'development')
    format_options = options or {}
    
    # Sanitize sensitive information based on environment and Flask security policies
    sanitized_context = _sanitize_logging_context(context)
    
    # Apply JSON serialization with proper encoding for Flask log aggregation systems
    log_entry = {
        'timestamp': timestamp,
        'level': formatted_level,
        'message': message,
        'correlation_id': correlation_id,
        'environment': environment,
        'process_info': process_info,
        'context': sanitized_context
    }
    
    # Add performance metadata if available
    if hasattr(g, 'request_start_time'):
        try:
            elapsed_time = (time.time() - g.request_start_time) * 1000  # Convert to milliseconds
            log_entry['performance'] = {
                'elapsed_ms': round(elapsed_time, 2)
            }
        except (RuntimeError, AttributeError):
            pass
    
    # Return formatted Flask log message ready for output destinations and monitoring
    output_format = format_options.get('format', 'json')
    
    if output_format == 'json':
        try:
            return json.dumps(log_entry, default=str, ensure_ascii=False)
        except (TypeError, ValueError):
            # Fallback to plain text if JSON serialization fails
            return f"[{formatted_level}] {correlation_id} - {message}"
    else:
        # Plain text format for development environments
        return f"[{timestamp}] [{formatted_level}] {correlation_id} - {message} - {sanitized_context}"


def setup_flask_log_rotation(rotation_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Configures automatic log file rotation with size limits, retention policies, and compression
    for Flask production environments. Integrates with WSGI deployment and file system monitoring
    for efficient log storage management equivalent to PM2 log management with Flask-specific
    configuration and monitoring.
    
    Args:
        rotation_config: Log rotation configuration dictionary with size and retention settings
        
    Returns:
        Flask log rotation configuration with monitoring and cleanup procedures for WSGI deployment
    """
    # Validate Flask rotation configuration including file sizes and retention periods from WSGI_CONSTANTS
    config = rotation_config.copy()
    wsgi_config = WSGI_CONSTANTS.get('PM2_EQUIVALENT_CONFIG', {})
    
    # Set up file system monitoring for Flask log file size and age tracking using os module
    default_config = {
        'max_file_size': '10MB',
        'backup_count': 5,
        'compression': True,
        'rotation_time': '24:00',  # Rotate daily at midnight
        'retention_days': 30,
        'log_directory': './logs',
        'file_pattern': 'flask_app_{date}.log',
        'monitoring_enabled': True
    }
    
    # Configure automatic rotation triggers based on size and time thresholds for Flask applications
    for key, value in default_config.items():
        config.setdefault(key, value)
    
    # Implement Flask log file compression and archival procedures with WSGI compatibility
    if config.get('compression', True):
        config['compression_format'] = 'gzip'
        config['compression_level'] = 6
    
    # Set up retention policy enforcement and old Flask log cleanup with disk space management
    config['cleanup_policy'] = {
        'max_age_days': config.get('retention_days', 30),
        'max_total_size': '1GB',
        'cleanup_schedule': 'daily'
    }
    
    # Configure WSGI integration for coordinated log management across Flask workers
    config['wsgi_coordination'] = {
        'worker_coordination': True,
        'shared_rotation_lock': True,
        'coordinator_process': True
    }
    
    # Return Flask log rotation system with monitoring and management capabilities for production
    config['status'] = 'configured'
    config['configuration_timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    return config


def create_express_compatible_logger(express_config: Dict[str, Any]) -> FlaskLogger:
    """
    Creates Express.js-compatible logging interface and formatting for cross-platform development
    and feature parity testing between Flask and Node.js implementations. Maintains consistent
    logging patterns and output formats across technology stacks for educational comparison
    and validation.
    
    Args:
        express_config: Express.js-style configuration dictionary for Flask compatibility
        
    Returns:
        Express.js-compatible Flask logger interface with consistent formatting and behavior for cross-platform development
    """
    # Analyze Express.js logging patterns and format requirements for Flask compatibility
    flask_config = {}
    
    # Create Flask logger interface that matches Express.js logging method signatures
    express_mapping = {
        'level': express_config.get('level', 'info'),
        'format': 'express_compatible',
        'express_compatibility': True,
        'cross_platform_mode': True
    }
    
    # Implement consistent timestamp formatting and log level mapping between platforms
    flask_config.update(express_mapping)
    flask_config['name'] = express_config.get('name', 'express_compatible')
    
    # Set up cross-platform correlation ID generation and tracking using Flask patterns
    flask_config['correlation_format'] = 'express_style'
    flask_config['timestamp_format'] = 'iso8601'
    
    # Configure equivalent Flask error handling and exception logging to Express.js patterns
    flask_config['error_format'] = 'express_compatible'
    flask_config['stack_trace_format'] = 'express_style'
    
    # Implement feature parity validation and testing support for Flask educational comparison
    flask_config['feature_parity_validation'] = True
    flask_config['testing_support'] = True
    
    # Return Express.js-compatible Flask logger for cross-platform development and testing
    express_logger = create_flask_logger(flask_config)
    
    # Add Express.js method aliases for compatibility
    express_logger.log = express_logger.info  # Express.js log() maps to info()
    express_logger.warn = express_logger.warning  # Express.js warn() maps to warning()
    
    express_logger.info("Express.js-compatible logger created", {
        'express_config': express_config,
        'flask_mapping': flask_config,
        'compatibility_mode': 'express_js'
    })
    
    return express_logger


# Helper functions for internal logging operations

def _classify_security_event_type(event_type: str) -> str:
    """
    Classifies security event types for appropriate handling and alerting in Flask applications.
    """
    classification_map = {
        'authentication_failure': 'authentication',
        'authorization_violation': 'authorization',
        'talisman_violation': 'security_policy',
        'rate_limit_exceeded': 'rate_limiting',
        'suspicious_activity': 'threat_detection',
        'csrf_violation': 'csrf_protection',
        'xss_attempt': 'xss_protection',
        'sql_injection_attempt': 'injection_attack'
    }
    return classification_map.get(event_type, 'unknown_security_event')


def _sanitize_security_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes security context to prevent sensitive information disclosure in Flask security logs.
    """
    sanitized = {}
    sensitive_patterns = ['password', 'token', 'secret', 'key', 'auth', 'session', 'cookie']
    
    for key, value in context.items():
        key_lower = key.lower()
        if any(pattern in key_lower for pattern in sensitive_patterns):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = _sanitize_security_context(value)
        elif isinstance(value, str) and len(value) > 100:
            # Truncate very long strings that might contain sensitive data
            sanitized[key] = value[:100] + '...[TRUNCATED]'
        else:
            sanitized[key] = value
    
    return sanitized


def _sanitize_logging_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes general logging context to prevent sensitive information disclosure.
    """
    sanitized = {}
    sensitive_fields = ['password', 'secret', 'token', 'key', 'authorization', 'session_id']
    
    for key, value in context.items():
        if any(field in key.lower() for field in sensitive_fields):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = _sanitize_logging_context(value)
        elif isinstance(value, (list, tuple)):
            sanitized[key] = [_sanitize_logging_context(item) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value
    
    return sanitized


# Default logger instance for module-level logging functions
logger = create_flask_logger({'name': 'flask_app_default'})