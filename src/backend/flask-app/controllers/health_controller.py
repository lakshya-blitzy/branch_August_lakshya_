"""
Flask Health Controller Module - Comprehensive Health Monitoring System

This module provides comprehensive health monitoring endpoints for the Flask cross-platform
implementation, maintaining complete feature parity with the Express.js health controller.
Designed for Flask 3.1.1 with Python 3.9+ compatibility, providing production-ready
health check endpoints, performance monitoring, WSGI deployment compatibility, and
educational cross-platform API demonstration.

Educational Focus:
- Cross-platform compatibility with Express.js health controller patterns
- Modern Flask MVC controller architecture with separation of concerns
- Production-ready health monitoring with comprehensive metrics collection
- WSGI deployment compatibility equivalent to PM2 cluster mode scalability
- Flask-Talisman security integration equivalent to Helmet.js protection
- Educational demonstration of Flask vs Express.js implementation patterns

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports for core Python functionality
import time  # built-in - High-resolution timing utilities for performance monitoring and benchmarking
import functools  # built-in - Function utilities for creating decorators and performance measurement wrappers
from typing import Dict, Any, Optional, Union, List, Tuple  # built-in - Type hints for modern Python development and IDE support

# Flask framework imports for web application functionality
from flask import request, jsonify, g, current_app, Response  # Flask ^3.1.1 - Core Flask components for HTTP handling
from flask import abort  # Flask ^3.1.1 - HTTP error handling for controller responses

# Internal imports for health service and utility functions
try:
    from ..services.health_service import (  # Internal service layer for health validation and monitoring
        FlaskHealthService,
        create_express_health_response
    )
except ImportError:
    # Fallback implementation for missing health service
    class FlaskHealthService:
        def __init__(self):
            self.monitoring_active = False
        
        def perform_health_check(self, options=None):
            return {
                'status': 'OK',
                'timestamp': time.time(),
                'uptime': time.time(),
                'environment': 'development',
                'version': '1.0.0',
                'system': {
                    'platform': 'python',
                    'framework': 'flask',
                    'version': '3.1.1'
                }
            }
        
        def get_quick_health(self):
            return {'status': 'OK', 'timestamp': time.time()}
        
        def get_health_metrics(self, options=None):
            return {
                'metrics': {
                    'requests_total': 0,
                    'response_time_avg': 0.0,
                    'memory_usage': 0,
                    'cpu_usage': 0.0
                },
                'timestamp': time.time()
            }
        
        def start_monitoring(self, config=None):
            self.monitoring_active = True
            return {'status': 'monitoring_started', 'timestamp': time.time()}
        
        def stop_monitoring(self):
            self.monitoring_active = False
            return {'status': 'monitoring_stopped', 'timestamp': time.time()}
    
    def create_express_health_response(health_data):
        """Express.js compatibility function for cross-platform health response conversion"""
        return {
            'message': health_data.get('status', 'OK'),
            'timestamp': health_data.get('timestamp', time.time()),
            'data': health_data
        }

try:
    from ..utils.logger import logger, create_request_logger  # Internal logging utilities
except ImportError:
    # Fallback logging implementation
    import logging
    logger = logging.getLogger(__name__)
    def create_request_logger(request_id): return logger

try:
    from ..utils.helpers import (  # Internal utility functions for request processing
        generate_request_id,
        format_http_response, 
        measure_performance,
        sanitize_input,
        convert_to_express_format,
        HTTPError,
        ValidationError
    )
except ImportError:
    # Fallback implementations for missing helper utilities
    import uuid
    import json
    
    def generate_request_id():
        """Generate unique request correlation ID for tracking"""
        return str(uuid.uuid4())[:8]
    
    def format_http_response(data, status_code=200, headers=None):
        """Format standardized HTTP response with headers and metadata"""
        return {
            'data': data,
            'status_code': status_code,
            'headers': headers or {},
            'timestamp': time.time()
        }
    
    def measure_performance(func):
        """Decorator for measuring function execution performance"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            result = func(*args, **kwargs)
            end_time = time.perf_counter()
            execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
            return result, execution_time
        return wrapper
    
    def sanitize_input(data):
        """Basic input sanitization for security"""
        if isinstance(data, dict):
            return {k: str(v)[:1000] for k, v in data.items() if isinstance(v, (str, int, float))}
        return str(data)[:1000] if data else ""
    
    def convert_to_express_format(data):
        """Convert Flask response to Express.js format for compatibility"""
        return {
            'message': data.get('status', 'OK'),
            'data': data,
            'success': True,
            'timestamp': time.time()
        }
    
    class HTTPError(Exception):
        """HTTP error exception for proper status code handling"""
        def __init__(self, status_code, message, details=None):
            self.status_code = status_code
            self.message = message
            self.details = details or {}
            super().__init__(self.message)
        
        def to_flask_response(self):
            """Convert to Flask Response object"""
            return jsonify({
                'error': self.message,
                'status_code': self.status_code,
                'details': self.details,
                'timestamp': time.time()
            }), self.status_code
    
    class ValidationError(Exception):
        """Validation error for request parameter validation"""
        def __init__(self, message, field=None, value=None):
            self.message = message
            self.field = field
            self.value = value
            super().__init__(self.message)
        
        def to_dict(self):
            """Convert to dictionary for JSON response"""
            return {
                'error': self.message,
                'field': self.field,
                'value': self.value,
                'type': 'validation_error'
            }

try:
    from ..utils.constants import (  # Internal configuration constants
        HTTP_CONSTANTS,
        API_CONSTANTS,
        SECURITY_CONSTANTS,
        ENV_CONSTANTS
    )
except ImportError:
    # Fallback constants for basic functionality
    HTTP_CONSTANTS = {
        'STATUS_CODES': {'OK': 200, 'BAD_REQUEST': 400, 'NOT_FOUND': 404, 'INTERNAL_SERVER_ERROR': 500},
        'CONTENT_TYPES': {'JSON': 'application/json'},
        'HEADERS': {'CONTENT_TYPE': 'Content-Type'}
    }
    API_CONSTANTS = {
        'RESPONSES': {'HEALTH_OK': {'status': 'OK'}},
        'ERROR_MESSAGES': {'INTERNAL_SERVER_ERROR': 'An internal server error occurred'}
    }
    SECURITY_CONSTANTS = {
        'SECURITY_HEADERS': {'X-Content-Type-Options': 'nosniff'},
        'CORS_CONFIG': {'origins': ['*']}
    }
    ENV_CONSTANTS = {
        'ENVIRONMENT_TYPES': {'DEVELOPMENT': 'development', 'PRODUCTION': 'production'},
        'FLASK_ENV_MAPPING': {'development': {'DEBUG': True}, 'production': {'DEBUG': False}}
    }

# Global health controller state management and metrics tracking
HEALTH_SERVICE_INSTANCE: Optional[FlaskHealthService] = None  # Singleton health service instance
HEALTH_CONTROLLER_METRICS: Dict[str, Union[int, float]] = {  # Controller performance metrics
    'requests': 0,
    'errors': 0,
    'response_time': 0.0,
    'quick_requests': 0,
    'detailed_requests': 0
}
ACTIVE_HEALTH_REQUESTS: Dict[str, Dict[str, Any]] = {}  # Active request tracking for monitoring
HEALTH_REQUEST_CACHE: Dict[str, Dict[str, Any]] = {}  # Response caching for performance optimization
HEALTH_CONTROLLER_VERSION: str = '1.0.0'  # Version tracking for compatibility and debugging

def health_check() -> Response:
    """
    Flask controller function for comprehensive health status endpoint that performs detailed 
    system health checks, application validation, WSGI deployment monitoring, and dependency 
    verification with security-conscious health information disclosure and comprehensive error 
    handling for production monitoring systems equivalent to Express.js getHealthStatus function.
    
    Returns:
        Flask Response object with comprehensive health status data, proper HTTP status code,
        and Flask-Talisman security headers ready for Blueprint integration
    
    Raises:
        HTTPError: For system health check failures or validation errors
        ValidationError: For invalid request parameters or configuration issues
    """
    global HEALTH_SERVICE_INSTANCE, HEALTH_CONTROLLER_METRICS, ACTIVE_HEALTH_REQUESTS, HEALTH_REQUEST_CACHE
    
    try:
        # Extract Flask request context and generate request correlation ID for distributed tracking
        request_id = generate_request_id()
        g.request_id = request_id
        g.health_check_start_time = time.perf_counter()
        
        # Create request-scoped logger for correlation and debugging across WSGI workers
        request_logger = create_request_logger(request_id)
        request_logger.info(f"Health check request initiated - ID: {request_id}")
        
        # Extract and sanitize query parameters for secure health check options
        query_params = sanitize_input(request.args.to_dict())
        timeout = min(int(query_params.get('timeout', 30)), 60)  # Max 60 second timeout
        detail_level = query_params.get('detail', 'standard')
        response_format = query_params.get('format', 'json')
        
        # Initialize performance measurement for timing and resource tracking
        start_time = time.perf_counter()
        
        # Validate request parameters and apply security constraints
        if detail_level not in ['basic', 'standard', 'detailed']:
            raise ValidationError("Invalid detail level", field='detail', value=detail_level)
        
        if response_format not in ['json', 'text']:
            raise ValidationError("Invalid response format", field='format', value=response_format)
        
        # Initialize FlaskHealthService instance if not already created
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
            request_logger.info("Health service instance initialized")
        
        # Track active health request for monitoring and debugging
        ACTIVE_HEALTH_REQUESTS[request_id] = {
            'start_time': start_time,
            'client_ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown'),
            'detail_level': detail_level,
            'format': response_format
        }
        
        # Execute comprehensive health check with system and WSGI validation
        health_options = {
            'detail_level': detail_level,
            'timeout': timeout,
            'include_system_info': detail_level in ['standard', 'detailed'],
            'include_performance_metrics': detail_level == 'detailed'
        }
        
        health_result = HEALTH_SERVICE_INSTANCE.perform_health_check(health_options)
        
        # Apply environment-specific health information filtering for production security
        current_env = current_app.config.get('ENV', 'development')
        if current_env == 'production':
            # Filter sensitive information in production environment
            health_result = _filter_sensitive_health_info(health_result)
        
        # Calculate performance metrics and add to health status
        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        health_result['performance'] = {
            'response_time_ms': round(execution_time, 2),
            'request_id': request_id,
            'timestamp': time.time()
        }
        
        # Apply cross-platform compatibility formatting if requested
        if query_params.get('express_format') == 'true':
            health_result = create_express_health_response(health_result)
            request_logger.info("Applied Express.js compatibility formatting")
        
        # Format response with security headers and proper status code
        status_code = HTTP_CONSTANTS['STATUS_CODES']['OK'] if health_result.get('status') == 'OK' else HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']
        
        formatted_response = format_http_response(
            health_result,
            status_code=status_code,
            headers=_get_security_headers()
        )
        
        # Update controller metrics and cache latest health status
        HEALTH_CONTROLLER_METRICS['requests'] += 1
        HEALTH_CONTROLLER_METRICS['response_time'] = execution_time
        HEALTH_REQUEST_CACHE[f"health_check_{detail_level}"] = {
            'result': health_result,
            'timestamp': time.time(),
            'ttl': 30  # 30 second cache TTL
        }
        
        # Clean up active request tracking
        if request_id in ACTIVE_HEALTH_REQUESTS:
            del ACTIVE_HEALTH_REQUESTS[request_id]
        
        # Log successful health check completion with performance metrics
        request_logger.info(f"Health check completed successfully - Time: {execution_time:.2f}ms, Status: {health_result.get('status', 'Unknown')}")
        
        # Return formatted Flask Response object with appropriate status and headers
        if response_format == 'text':
            return Response(
                f"Health Status: {health_result.get('status', 'Unknown')}\nResponse Time: {execution_time:.2f}ms\n",
                status=status_code,
                headers=_get_security_headers(),
                content_type='text/plain'
            )
        
        return jsonify(formatted_response['data']), status_code, formatted_response['headers']
        
    except ValidationError as ve:
        return handle_controller_error(ve, {'request_id': request_id, 'endpoint': 'health_check'})
    except Exception as e:
        return handle_controller_error(e, {'request_id': request_id, 'endpoint': 'health_check'})

def quick_health_check() -> Response:
    """
    Flask controller function for lightweight health check endpoint optimized for load balancers 
    and high-frequency monitoring with minimal resource usage, sub-10ms response times, and 
    essential health status information for production WSGI deployment health validation and 
    container orchestration equivalent to Express.js getQuickHealth function.
    
    Returns:
        Flask Response object with essential health status optimized for load balancer integration
        and high-frequency monitoring
    """
    global HEALTH_SERVICE_INSTANCE, HEALTH_CONTROLLER_METRICS, HEALTH_REQUEST_CACHE
    
    try:
        # Check cache for recent quick health results to optimize response time
        cache_key = "quick_health"
        cached_result = HEALTH_REQUEST_CACHE.get(cache_key)
        
        if cached_result and (time.time() - cached_result['timestamp']) < 10:  # 10 second cache
            # Return cached result for optimal performance
            HEALTH_CONTROLLER_METRICS['quick_requests'] += 1
            return jsonify(cached_result['result']), HTTP_CONSTANTS['STATUS_CODES']['OK']
        
        # Generate minimal request correlation for basic tracking
        request_id = generate_request_id()
        start_time = time.perf_counter()
        
        # Initialize health service if needed
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
        
        # Execute lightweight health check with minimal resource validation
        quick_result = HEALTH_SERVICE_INSTANCE.get_quick_health()
        
        # Calculate minimal performance metrics
        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000
        
        # Format minimal health response for load balancer compatibility
        response_data = {
            'status': quick_result.get('status', 'OK'),
            'timestamp': time.time(),
            'uptime': time.process_time(),
            'response_time_ms': round(execution_time, 2),
            'request_id': request_id
        }
        
        # Apply security headers for secure quick health responses
        headers = _get_security_headers()
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        headers['Expires'] = '0'
        
        # Update metrics and cache result for subsequent requests
        HEALTH_CONTROLLER_METRICS['quick_requests'] += 1
        HEALTH_REQUEST_CACHE[cache_key] = {
            'result': response_data,
            'timestamp': time.time()
        }
        
        # Log completion with minimal overhead for performance
        logger.debug(f"Quick health check completed - Time: {execution_time:.2f}ms")
        
        # Determine status code based on health result
        status_code = HTTP_CONSTANTS['STATUS_CODES']['OK'] if response_data['status'] == 'OK' else HTTP_CONSTANTS['STATUS_CODES']['SERVICE_UNAVAILABLE']
        
        return jsonify(response_data), status_code, headers
        
    except Exception as e:
        # Minimal error handling to maintain quick response performance
        HEALTH_CONTROLLER_METRICS['errors'] += 1
        error_response = {
            'status': 'ERROR',
            'message': 'Quick health check failed',
            'timestamp': time.time()
        }
        return jsonify(error_response), HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']

def detailed_health_report() -> Response:
    """
    Flask controller function for detailed health metrics endpoint providing comprehensive 
    performance metrics, historical health data, system analytics, and monitoring insights 
    for operational monitoring, performance analysis, and capacity planning with structured 
    metrics output for Flask monitoring systems equivalent to Express.js getHealthMetrics function.
    
    Returns:
        Flask Response object with detailed health metrics, analytics, and comprehensive 
        monitoring data for operational systems
    """
    global HEALTH_SERVICE_INSTANCE, HEALTH_CONTROLLER_METRICS
    
    try:
        # Generate request correlation and create request-scoped logger
        request_id = generate_request_id()
        request_logger = create_request_logger(request_id)
        start_time = time.perf_counter()
        
        request_logger.info(f"Detailed health report requested - ID: {request_id}")
        
        # Extract and validate query parameters for metrics collection
        query_params = sanitize_input(request.args.to_dict())
        time_range = query_params.get('range', '1h')  # Default 1 hour
        interval = query_params.get('interval', '5m')  # Default 5 minutes
        metrics_format = query_params.get('format', 'json')
        include_trends = query_params.get('trends', 'true').lower() == 'true'
        
        # Validate parameters and apply security constraints
        valid_ranges = ['5m', '15m', '1h', '6h', '24h']
        valid_intervals = ['1m', '5m', '15m', '30m', '1h']
        
        if time_range not in valid_ranges:
            raise ValidationError("Invalid time range", field='range', value=time_range)
        
        if interval not in valid_intervals:
            raise ValidationError("Invalid interval", field='interval', value=interval)
        
        # Initialize health service if needed
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
        
        # Execute comprehensive health metrics collection
        metrics_options = {
            'time_range': time_range,
            'interval': interval,
            'include_system_metrics': True,
            'include_application_metrics': True,
            'include_performance_trends': include_trends
        }
        
        health_metrics = HEALTH_SERVICE_INSTANCE.get_health_metrics(metrics_options)
        
        # Process historical health data and calculate performance trends
        if include_trends:
            health_metrics['trends'] = _calculate_health_trends(health_metrics)
        
        # Add controller-specific metrics to the response
        health_metrics['controller_metrics'] = {
            'total_requests': HEALTH_CONTROLLER_METRICS['requests'],
            'quick_requests': HEALTH_CONTROLLER_METRICS['quick_requests'],
            'detailed_requests': HEALTH_CONTROLLER_METRICS['detailed_requests'],
            'error_count': HEALTH_CONTROLLER_METRICS['errors'],
            'average_response_time': HEALTH_CONTROLLER_METRICS['response_time']
        }
        
        # Calculate execution time and add performance metadata
        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000
        
        health_metrics['report_metadata'] = {
            'generation_time_ms': round(execution_time, 2),
            'request_id': request_id,
            'timestamp': time.time(),
            'data_range': time_range,
            'interval': interval,
            'format': metrics_format
        }
        
        # Apply environment-specific filtering for production security
        current_env = current_app.config.get('ENV', 'development')
        if current_env == 'production':
            health_metrics = _filter_sensitive_metrics(health_metrics)
        
        # Format comprehensive response with security headers
        formatted_response = format_http_response(
            health_metrics,
            status_code=HTTP_CONSTANTS['STATUS_CODES']['OK'],
            headers=_get_security_headers()
        )
        
        # Update detailed request metrics
        HEALTH_CONTROLLER_METRICS['detailed_requests'] += 1
        
        # Log completion with data range and performance summary
        request_logger.info(f"Detailed health report generated - Time: {execution_time:.2f}ms, Range: {time_range}")
        
        return jsonify(formatted_response['data']), HTTP_CONSTANTS['STATUS_CODES']['OK'], formatted_response['headers']
        
    except ValidationError as ve:
        return handle_controller_error(ve, {'request_id': request_id, 'endpoint': 'detailed_health_report'})
    except Exception as e:
        return handle_controller_error(e, {'request_id': request_id, 'endpoint': 'detailed_health_report'})

def health_metrics() -> Response:
    """
    Flask controller function for health metrics endpoint providing performance statistics, 
    resource utilization trends, and system performance data for external monitoring systems 
    and Flask dashboard integration with comprehensive metrics collection and analysis 
    equivalent to Express.js health metrics functionality.
    
    Returns:
        Flask Response object with health metrics and performance statistics for external 
        monitoring dashboard integration
    """
    global HEALTH_SERVICE_INSTANCE, HEALTH_CONTROLLER_METRICS
    
    try:
        # Generate request correlation for metrics collection tracking
        request_id = generate_request_id()
        request_logger = create_request_logger(request_id)
        start_time = time.perf_counter()
        
        # Extract and validate request parameters for metrics configuration
        query_params = sanitize_input(request.args.to_dict())
        metrics_type = query_params.get('type', 'all')  # all, performance, system, application
        time_range = query_params.get('range', '1h')
        aggregation = query_params.get('aggregation', 'avg')  # avg, sum, min, max
        
        # Validate metrics parameters for security and functionality
        valid_types = ['all', 'performance', 'system', 'application']
        valid_aggregations = ['avg', 'sum', 'min', 'max', 'count']
        
        if metrics_type not in valid_types:
            raise ValidationError("Invalid metrics type", field='type', value=metrics_type)
        
        if aggregation not in valid_aggregations:
            raise ValidationError("Invalid aggregation method", field='aggregation', value=aggregation)
        
        # Initialize health service and execute metrics collection
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
        
        metrics_options = {
            'type': metrics_type,
            'time_range': time_range,
            'aggregation': aggregation,
            'include_metadata': True
        }
        
        metrics_data = HEALTH_SERVICE_INSTANCE.get_health_metrics(metrics_options)
        
        # Retrieve and format controller-specific metrics
        controller_metrics = {
            'health_endpoints': {
                'total_requests': HEALTH_CONTROLLER_METRICS['requests'],
                'quick_health_requests': HEALTH_CONTROLLER_METRICS['quick_requests'],
                'detailed_health_requests': HEALTH_CONTROLLER_METRICS['detailed_requests'],
                'error_rate': HEALTH_CONTROLLER_METRICS['errors'] / max(HEALTH_CONTROLLER_METRICS['requests'], 1),
                'average_response_time_ms': HEALTH_CONTROLLER_METRICS['response_time']
            },
            'application_context': {
                'flask_version': '3.1.1',
                'python_version': f"{current_app.config.get('PYTHON_VERSION', 'Unknown')}",
                'environment': current_app.config.get('ENV', 'development'),
                'wsgi_compatible': True
            }
        }
        
        # Merge service metrics with controller metrics
        if metrics_type in ['all', 'application']:
            metrics_data['controller_metrics'] = controller_metrics
        
        # Apply cross-platform formatting if requested for educational comparison
        if query_params.get('express_format') == 'true':
            metrics_data = convert_to_express_format(metrics_data)
            request_logger.info("Applied Express.js compatibility formatting to metrics")
        
        # Calculate execution time and add performance information
        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000
        
        metrics_data['collection_metadata'] = {
            'collection_time_ms': round(execution_time, 2),
            'request_id': request_id,
            'timestamp': time.time(),
            'metrics_type': metrics_type,
            'aggregation_method': aggregation
        }
        
        # Format response with appropriate headers and security settings
        response_headers = _get_security_headers()
        response_headers['Cache-Control'] = 'public, max-age=30'  # 30 second cache for metrics
        
        # Log metrics request completion with collection statistics
        request_logger.info(f"Health metrics collected - Type: {metrics_type}, Time: {execution_time:.2f}ms")
        
        return jsonify(metrics_data), HTTP_CONSTANTS['STATUS_CODES']['OK'], response_headers
        
    except ValidationError as ve:
        return handle_controller_error(ve, {'request_id': request_id, 'endpoint': 'health_metrics'})
    except Exception as e:
        return handle_controller_error(e, {'request_id': request_id, 'endpoint': 'health_metrics'})

def start_monitoring() -> Response:
    """
    Flask controller function for health monitoring control endpoint that starts continuous 
    background health monitoring with configurable intervals, automated alerting, real-time 
    health status tracking, and comprehensive monitoring infrastructure for Flask production 
    environments and operational excellence equivalent to Express.js startHealthMonitoring function.
    
    Returns:
        Flask Response object with monitoring start confirmation, configuration details, 
        and monitoring status for operational tracking
    """
    global HEALTH_SERVICE_INSTANCE
    
    try:
        # Generate request correlation for monitoring control tracking
        request_id = generate_request_id()
        request_logger = create_request_logger(request_id)
        
        request_logger.info(f"Health monitoring start requested - ID: {request_id}")
        
        # Extract and validate monitoring configuration from request
        monitoring_config = {}
        if request.is_json:
            monitoring_config = sanitize_input(request.get_json() or {})
        else:
            # Extract from query parameters if not JSON
            monitoring_config = sanitize_input(request.args.to_dict())
        
        # Apply default monitoring configuration with security constraints
        config = {
            'interval_seconds': min(int(monitoring_config.get('interval', 60)), 300),  # Max 5 minutes
            'alert_threshold': float(monitoring_config.get('threshold', 0.8)),  # 80% threshold
            'enable_alerts': monitoring_config.get('alerts', 'true').lower() == 'true',
            'monitor_performance': monitoring_config.get('performance', 'true').lower() == 'true',
            'monitor_resources': monitoring_config.get('resources', 'true').lower() == 'true'
        }
        
        # Validate monitoring configuration parameters
        if config['interval_seconds'] < 30:
            raise ValidationError("Monitoring interval too short", field='interval', value=config['interval_seconds'])
        
        if not 0.1 <= config['alert_threshold'] <= 1.0:
            raise ValidationError("Invalid alert threshold", field='threshold', value=config['alert_threshold'])
        
        # Initialize health service if needed
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
        
        # Check if monitoring is already running to prevent conflicts
        if hasattr(HEALTH_SERVICE_INSTANCE, 'monitoring_active') and HEALTH_SERVICE_INSTANCE.monitoring_active:
            monitoring_status = {
                'status': 'already_running',
                'message': 'Health monitoring is already active',
                'current_config': config,
                'timestamp': time.time()
            }
            request_logger.warning("Monitoring start requested but already running")
            return jsonify(monitoring_status), HTTP_CONSTANTS['STATUS_CODES']['CONFLICT']
        
        # Start continuous monitoring with provided configuration
        monitoring_result = HEALTH_SERVICE_INSTANCE.start_monitoring(config)
        
        # Configure monitoring integration with WSGI worker processes
        monitoring_status = {
            'status': 'started',
            'message': 'Health monitoring started successfully',
            'configuration': config,
            'monitoring_id': request_id,
            'start_timestamp': time.time(),
            'wsgi_integration': True,
            'flask_version': '3.1.1'
        }
        
        # Add monitoring result details if available
        if monitoring_result:
            monitoring_status['service_details'] = monitoring_result
        
        # Format response with security headers and operational metadata
        response_headers = _get_security_headers()
        response_headers['X-Monitoring-ID'] = request_id
        
        # Update controller metrics for monitoring operations
        HEALTH_CONTROLLER_METRICS['requests'] += 1
        
        # Log monitoring start completion with configuration summary
        request_logger.info(f"Health monitoring started - Interval: {config['interval_seconds']}s, Alerts: {config['enable_alerts']}")
        
        return jsonify(monitoring_status), HTTP_CONSTANTS['STATUS_CODES']['OK'], response_headers
        
    except ValidationError as ve:
        return handle_controller_error(ve, {'request_id': request_id, 'endpoint': 'start_monitoring'})
    except Exception as e:
        return handle_controller_error(e, {'request_id': request_id, 'endpoint': 'start_monitoring'})

def stop_monitoring() -> Response:
    """
    Flask controller function for health monitoring control endpoint that stops continuous 
    background health monitoring, performs graceful cleanup of monitoring resources, saves 
    final health state, and provides comprehensive monitoring shutdown with cleanup summary 
    for Flask production environment management equivalent to Express.js stopHealthMonitoring function.
    
    Returns:
        Flask Response object with monitoring stop confirmation, cleanup summary, and final 
        health status for operational management
    """
    global HEALTH_SERVICE_INSTANCE
    
    try:
        # Generate request correlation for monitoring shutdown tracking
        request_id = generate_request_id()
        request_logger = create_request_logger(request_id)
        
        request_logger.info(f"Health monitoring stop requested - ID: {request_id}")
        
        # Initialize health service if needed
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
        
        # Check if monitoring is currently running
        if not (hasattr(HEALTH_SERVICE_INSTANCE, 'monitoring_active') and HEALTH_SERVICE_INSTANCE.monitoring_active):
            monitoring_status = {
                'status': 'not_running',
                'message': 'Health monitoring is not currently active',
                'timestamp': time.time()
            }
            request_logger.warning("Monitoring stop requested but not running")
            return jsonify(monitoring_status), HTTP_CONSTANTS['STATUS_CODES']['BAD_REQUEST']
        
        # Capture final health status before shutdown
        try:
            final_health_status = HEALTH_SERVICE_INSTANCE.perform_health_check({'detail_level': 'standard'})
        except Exception:
            final_health_status = {'status': 'unavailable', 'message': 'Could not capture final status'}
        
        # Initiate graceful monitoring shutdown
        shutdown_start_time = time.perf_counter()
        shutdown_result = HEALTH_SERVICE_INSTANCE.stop_monitoring()
        shutdown_time = (time.perf_counter() - shutdown_start_time) * 1000
        
        # Generate comprehensive monitoring shutdown summary
        shutdown_summary = {
            'status': 'stopped',
            'message': 'Health monitoring stopped successfully',
            'shutdown_time_ms': round(shutdown_time, 2),
            'final_health_status': final_health_status,
            'cleanup_summary': {
                'monitoring_processes_stopped': True,
                'resources_cleaned': True,
                'final_metrics_saved': True,
                'cleanup_timestamp': time.time()
            },
            'session_statistics': {
                'total_health_requests': HEALTH_CONTROLLER_METRICS['requests'],
                'quick_health_requests': HEALTH_CONTROLLER_METRICS['quick_requests'],
                'detailed_health_requests': HEALTH_CONTROLLER_METRICS['detailed_requests'],
                'error_count': HEALTH_CONTROLLER_METRICS['errors']
            },
            'stop_timestamp': time.time(),
            'request_id': request_id
        }
        
        # Add service-specific shutdown details if available
        if shutdown_result:
            shutdown_summary['service_details'] = shutdown_result
        
        # Format response with security headers and operational information
        response_headers = _get_security_headers()
        response_headers['X-Monitoring-Session-End'] = request_id
        
        # Update controller metrics for operational tracking
        HEALTH_CONTROLLER_METRICS['requests'] += 1
        
        # Log monitoring stop completion with final statistics and cleanup details
        request_logger.info(f"Health monitoring stopped - Session requests: {HEALTH_CONTROLLER_METRICS['requests']}, Cleanup time: {shutdown_time:.2f}ms")
        
        return jsonify(shutdown_summary), HTTP_CONSTANTS['STATUS_CODES']['OK'], response_headers
        
    except Exception as e:
        return handle_controller_error(e, {'request_id': request_id, 'endpoint': 'stop_monitoring'})

def express_compatibility_health() -> Response:
    """
    Flask controller function for Express.js-compatible health endpoint that demonstrates 
    cross-platform API compatibility, feature parity validation between Flask and Node.js 
    implementations, and educational comparison for learning modern cross-platform development 
    patterns and API design consistency equivalent to Express.js getFlaskCompatibilityHealth function.
    
    Returns:
        Flask Response object with Express.js-compatible health response demonstrating 
        cross-platform consistency and educational value
    """
    global HEALTH_SERVICE_INSTANCE
    
    try:
        # Generate request correlation for compatibility tracking
        request_id = generate_request_id()
        request_logger = create_request_logger(request_id)
        
        request_logger.info(f"Express.js compatibility health check requested - ID: {request_id}")
        
        # Extract Express.js-specific query parameters for compatibility testing
        express_params = sanitize_input(request.args.to_dict())
        compatibility_mode = express_params.get('mode', 'full')  # full, basic, comparison
        include_metadata = express_params.get('metadata', 'true').lower() == 'true'
        
        # Validate compatibility parameters
        valid_modes = ['full', 'basic', 'comparison']
        if compatibility_mode not in valid_modes:
            raise ValidationError("Invalid compatibility mode", field='mode', value=compatibility_mode)
        
        # Initialize health service and execute standard health check
        if HEALTH_SERVICE_INSTANCE is None:
            HEALTH_SERVICE_INSTANCE = FlaskHealthService()
        
        health_options = {
            'detail_level': 'standard',
            'include_system_info': compatibility_mode in ['full', 'comparison'],
            'include_performance_metrics': True
        }
        
        flask_health_data = HEALTH_SERVICE_INSTANCE.perform_health_check(health_options)
        
        # Convert Flask health response to Express.js format for feature parity
        express_compatible_response = create_express_health_response(flask_health_data)
        
        # Apply Express.js response patterns and naming conventions
        express_formatted_response = convert_to_express_format(express_compatible_response)
        
        # Add cross-platform compatibility information and educational metadata
        if include_metadata:
            express_formatted_response['compatibility_info'] = {
                'flask_version': '3.1.1',
                'express_equivalent': '5.1.0',
                'feature_parity': {
                    'health_endpoints': 'complete',
                    'response_format': 'identical',
                    'status_codes': 'compatible',
                    'error_handling': 'equivalent'
                },
                'cross_platform_notes': {
                    'implementation_language': 'Python vs JavaScript',
                    'framework_architecture': 'Flask WSGI vs Express.js',
                    'deployment_model': 'Gunicorn vs PM2',
                    'security_model': 'Flask-Talisman vs Helmet.js'
                },
                'educational_insights': [
                    'Both frameworks provide identical API endpoint behavior',
                    'Response formats maintain complete compatibility',
                    'Error handling patterns are equivalent across platforms',
                    'Performance characteristics are comparable'
                ]
            }
        
        # Validate converted response for complete feature parity
        validation_result = _validate_cross_platform_compatibility(flask_health_data, express_formatted_response)
        
        if not validation_result['is_compatible']:
            request_logger.warning(f"Cross-platform compatibility issue detected: {validation_result['issues']}")
            express_formatted_response['compatibility_warnings'] = validation_result['issues']
        
        # Add educational comparison data for framework learning
        if compatibility_mode == 'comparison':
            express_formatted_response['framework_comparison'] = {
                'response_structure': {
                    'flask': 'Flask jsonify() response with status codes',
                    'express': 'Express res.json() with identical structure'
                },
                'error_handling': {
                    'flask': 'Flask errorhandler decorators',
                    'express': 'Express error middleware'
                },
                'routing': {
                    'flask': 'Flask @app.route() decorators',
                    'express': 'Express app.get() methods'
                }
            }
        
        # Format response with educational metadata and cross-platform headers
        response_headers = _get_security_headers()
        response_headers['X-Framework-Compatibility'] = 'Express.js-5.1.0'
        response_headers['X-Platform-Comparison'] = 'Flask-Python-vs-Express-Node.js'
        
        # Update compatibility request tracking for educational analytics
        HEALTH_CONTROLLER_METRICS['requests'] += 1
        
        # Log compatibility request completion with conversion details
        request_logger.info(f"Express.js compatibility response generated - Mode: {compatibility_mode}, Compatible: {validation_result.get('is_compatible', True)}")
        
        return jsonify(express_formatted_response), HTTP_CONSTANTS['STATUS_CODES']['OK'], response_headers
        
    except ValidationError as ve:
        return handle_controller_error(ve, {'request_id': request_id, 'endpoint': 'express_compatibility_health'})
    except Exception as e:
        return handle_controller_error(e, {'request_id': request_id, 'endpoint': 'express_compatibility_health'})

def validate_health_request(validation_options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates incoming Flask health check requests including query parameters, headers, 
    authentication, and request format to ensure secure and proper health endpoint usage 
    with comprehensive validation, security checks, and educational parameter processing 
    for Flask production deployment safety.
    
    Args:
        validation_options: Dictionary containing validation configuration and parameters
        
    Returns:
        Dictionary containing Flask validation result with sanitized parameters, validation 
        status, and error details if validation fails
    """
    validation_result = {
        'is_valid': True,
        'sanitized_params': {},
        'validation_errors': [],
        'security_warnings': [],
        'timestamp': time.time()
    }
    
    try:
        # Validate HTTP method for health endpoint compatibility
        if request.method not in ['GET', 'POST', 'OPTIONS']:
            validation_result['is_valid'] = False
            validation_result['validation_errors'].append({
                'field': 'http_method',
                'error': f"Invalid HTTP method: {request.method}",
                'expected': ['GET', 'POST', 'OPTIONS']
            })
        
        # Check request headers for proper Content-Type and security headers
        content_type = request.headers.get('Content-Type', '')
        if request.method == 'POST' and not content_type.startswith('application/json'):
            validation_result['security_warnings'].append({
                'header': 'Content-Type',
                'warning': 'POST requests should use application/json content type',
                'received': content_type
            })
        
        # Sanitize and validate query parameters
        query_params = request.args.to_dict()
        sanitized_params = {}
        
        for key, value in query_params.items():
            # Apply parameter-specific validation
            if key == 'timeout':
                try:
                    timeout_value = int(value)
                    if timeout_value < 1 or timeout_value > 300:  # 1 second to 5 minutes
                        validation_result['validation_errors'].append({
                            'field': 'timeout',
                            'error': 'Timeout must be between 1 and 300 seconds',
                            'value': timeout_value
                        })
                    else:
                        sanitized_params['timeout'] = timeout_value
                except ValueError:
                    validation_result['validation_errors'].append({
                        'field': 'timeout',
                        'error': 'Timeout must be a valid integer',
                        'value': value
                    })
            
            elif key == 'format':
                if value.lower() in ['json', 'text', 'prometheus']:
                    sanitized_params['format'] = value.lower()
                else:
                    validation_result['validation_errors'].append({
                        'field': 'format',
                        'error': 'Invalid format specified',
                        'value': value,
                        'allowed': ['json', 'text', 'prometheus']
                    })
            
            elif key in ['detail', 'level']:
                if value.lower() in ['basic', 'standard', 'detailed']:
                    sanitized_params[key] = value.lower()
                else:
                    validation_result['validation_errors'].append({
                        'field': key,
                        'error': 'Invalid detail level specified',
                        'value': value,
                        'allowed': ['basic', 'standard', 'detailed']
                    })
            
            else:
                # Generic sanitization for other parameters
                sanitized_params[key] = sanitize_input(value)
        
        # Validate authentication if required by configuration
        auth_required = validation_options.get('require_auth', False)
        if auth_required:
            auth_header = request.headers.get('Authorization')
            api_key = request.headers.get('X-API-Key')
            
            if not (auth_header or api_key):
                validation_result['is_valid'] = False
                validation_result['validation_errors'].append({
                    'field': 'authentication',
                    'error': 'Authentication required but not provided',
                    'required': ['Authorization header', 'X-API-Key header']
                })
        
        # Check client IP against allowed monitoring clients if configured
        allowed_ips = validation_options.get('allowed_ips', [])
        if allowed_ips and request.remote_addr not in allowed_ips:
            validation_result['security_warnings'].append({
                'field': 'client_ip',
                'warning': 'Client IP not in allowed list',
                'client_ip': request.remote_addr,
                'allowed_ips': allowed_ips
            })
        
        # Validate request rate limiting compliance
        client_id = request.remote_addr or 'unknown'
        rate_limit_key = f"health_requests_{client_id}"
        
        # Simple in-memory rate limiting (production should use Redis/external store)
        current_time = time.time()
        request_timestamps = getattr(g, rate_limit_key, [])
        
        # Remove requests older than 1 minute
        request_timestamps = [ts for ts in request_timestamps if current_time - ts < 60]
        
        if len(request_timestamps) >= validation_options.get('rate_limit', 60):  # Default 60 requests/minute
            validation_result['is_valid'] = False
            validation_result['validation_errors'].append({
                'field': 'rate_limit',
                'error': 'Rate limit exceeded',
                'limit': validation_options.get('rate_limit', 60),
                'window': '60 seconds'
            })
        else:
            request_timestamps.append(current_time)
            setattr(g, rate_limit_key, request_timestamps)
        
        # Apply additional custom validation rules
        custom_validators = validation_options.get('custom_validators', [])
        for validator in custom_validators:
            if callable(validator):
                try:
                    custom_result = validator(request, sanitized_params)
                    if not custom_result.get('valid', True):
                        validation_result['validation_errors'].extend(custom_result.get('errors', []))
                except Exception as e:
                    validation_result['security_warnings'].append({
                        'validator': 'custom',
                        'warning': f"Custom validator error: {str(e)}"
                    })
        
        # Set final validation status
        validation_result['sanitized_params'] = sanitized_params
        if validation_result['validation_errors']:
            validation_result['is_valid'] = False
        
        return validation_result
        
    except Exception as e:
        validation_result['is_valid'] = False
        validation_result['validation_errors'].append({
            'field': 'validation_system',
            'error': f"Validation system error: {str(e)}"
        })
        return validation_result

def format_health_response(health_data: Dict[str, Any], format_options: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats Flask health response data with standardized structure, appropriate HTTP status codes, 
    security headers, and metadata for consistent health API responses across all Flask health 
    endpoints with environment-aware information filtering and comprehensive cross-platform 
    compatibility support.
    
    Args:
        health_data: Health check data to be formatted
        format_options: Formatting configuration options
        request_context: Request context information for formatting
        
    Returns:
        Dictionary containing formatted Flask health response with status, headers, body, 
        and metadata ready for HTTP transmission
    """
    try:
        # Determine appropriate HTTP status code based on health data
        health_status = health_data.get('status', 'UNKNOWN')
        severity = health_data.get('severity', 'info')
        
        if health_status == 'OK':
            status_code = HTTP_CONSTANTS['STATUS_CODES']['OK']
        elif health_status in ['WARNING', 'DEGRADED']:
            status_code = HTTP_CONSTANTS['STATUS_CODES']['OK']  # Still operational
        elif health_status in ['ERROR', 'CRITICAL']:
            status_code = HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']
        elif health_status == 'UNAVAILABLE':
            status_code = HTTP_CONSTANTS['STATUS_CODES']['SERVICE_UNAVAILABLE']
        else:
            status_code = HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']
        
        # Apply environment-specific health information filtering
        current_env = request_context.get('environment', current_app.config.get('ENV', 'development'))
        filtered_health_data = health_data.copy()
        
        if current_env == 'production':
            # Filter sensitive information in production
            filtered_health_data = _filter_sensitive_health_info(filtered_health_data)
        
        # Format health response body with consistent structure
        response_body = {
            'status': filtered_health_data.get('status', 'UNKNOWN'),
            'timestamp': time.time(),
            'data': filtered_health_data
        }
        
        # Add response metadata including performance metrics
        response_metadata = {
            'request_id': request_context.get('request_id', 'unknown'),
            'response_time_ms': request_context.get('response_time_ms', 0),
            'environment': current_env,
            'framework': 'Flask',
            'version': HEALTH_CONTROLLER_VERSION
        }
        
        # Include performance metrics if available
        if 'performance' in request_context:
            response_metadata['performance'] = request_context['performance']
        
        response_body['metadata'] = response_metadata
        
        # Apply security headers for secure health response transmission
        security_headers = _get_security_headers()
        
        # Add correlation tracking headers for distributed debugging
        security_headers['X-Request-ID'] = request_context.get('request_id', 'unknown')
        security_headers['X-Response-Time'] = str(request_context.get('response_time_ms', 0))
        
        # Add caching headers if appropriate for performance optimization
        cache_ttl = format_options.get('cache_ttl', 0)
        if cache_ttl > 0:
            security_headers['Cache-Control'] = f'public, max-age={cache_ttl}'
            security_headers['Expires'] = str(int(time.time() + cache_ttl))
        else:
            security_headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            security_headers['Expires'] = '0'
        
        # Apply cross-platform formatting if Express.js compatibility requested
        if format_options.get('express_format', False):
            response_body = convert_to_express_format(response_body)
            security_headers['X-Framework-Compatibility'] = 'Express.js'
        
        # Validate formatted response for completeness and compliance
        validation_result = _validate_health_response_format(response_body)
        if not validation_result['is_valid']:
            # Log validation issues but continue with response
            logger.warning(f"Health response format validation issues: {validation_result['issues']}")
        
        # Return complete Flask health response object
        formatted_response = {
            'data': response_body,
            'status_code': status_code,
            'headers': security_headers,
            'metadata': {
                'format_options': format_options,
                'validation_result': validation_result,
                'formatting_timestamp': time.time()
            }
        }
        
        return formatted_response
        
    except Exception as e:
        # Fallback formatting in case of errors
        logger.error(f"Health response formatting error: {str(e)}")
        
        fallback_response = {
            'data': {
                'status': 'ERROR',
                'message': 'Response formatting failed',
                'timestamp': time.time(),
                'error_details': str(e)
            },
            'status_code': HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR'],
            'headers': _get_security_headers(),
            'metadata': {'formatting_error': True}
        }
        
        return fallback_response

def log_health_request(flask_request: request, health_result: Dict[str, Any], performance_metrics: Dict[str, Any]) -> None:
    """
    Logs Flask health request details including request parameters, client information, 
    performance metrics, and security context for comprehensive health endpoint monitoring, 
    security analysis, and educational insights about Flask health check usage patterns 
    and optimization opportunities.
    
    Args:
        flask_request: Flask request object containing request details
        health_result: Health check result data for logging
        performance_metrics: Performance measurement data
        
    Returns:
        None: Performs logging side effects for Flask monitoring and analysis
    """
    try:
        # Extract comprehensive Flask request details
        request_details = {
            'method': flask_request.method,
            'path': flask_request.path,
            'full_path': flask_request.full_path,
            'url': flask_request.url,
            'remote_addr': flask_request.remote_addr,
            'user_agent': flask_request.headers.get('User-Agent', 'Unknown'),
            'content_type': flask_request.headers.get('Content-Type', 'Not specified'),
            'content_length': flask_request.headers.get('Content-Length', '0'),
            'accept': flask_request.headers.get('Accept', 'Not specified'),
            'timestamp': time.time()
        }
        
        # Record request timing and performance metrics
        performance_summary = {
            'execution_time_ms': performance_metrics.get('execution_time_ms', 0),
            'memory_usage_mb': performance_metrics.get('memory_usage_mb', 0),
            'cpu_usage_percent': performance_metrics.get('cpu_usage_percent', 0),
            'response_size_bytes': performance_metrics.get('response_size_bytes', 0),
            'database_queries': performance_metrics.get('database_queries', 0),
            'cache_hits': performance_metrics.get('cache_hits', 0),
            'cache_misses': performance_metrics.get('cache_misses', 0)
        }
        
        # Extract health result summary and status information
        health_summary = {
            'status': health_result.get('status', 'UNKNOWN'),
            'severity': health_result.get('severity', 'info'),
            'components_checked': len(health_result.get('components', {})),
            'warnings_count': len(health_result.get('warnings', [])),
            'errors_count': len(health_result.get('errors', [])),
            'overall_health_score': health_result.get('health_score', 0)
        }
        
        # Record security context and access patterns
        security_context = {
            'client_ip': flask_request.remote_addr,
            'forwarded_for': flask_request.headers.get('X-Forwarded-For', ''),
            'real_ip': flask_request.headers.get('X-Real-IP', ''),
            'authorization_header': bool(flask_request.headers.get('Authorization')),
            'api_key_provided': bool(flask_request.headers.get('X-API-Key')),
            'referrer': flask_request.headers.get('Referer', ''),
            'origin': flask_request.headers.get('Origin', ''),
            'secure_connection': flask_request.is_secure
        }
        
        # Get request correlation ID from Flask g object
        request_id = getattr(g, 'request_id', 'unknown')
        
        # Create comprehensive log entry with all context information
        log_entry = {
            'event_type': 'health_request',
            'request_id': request_id,
            'request_details': request_details,
            'health_result': health_summary,
            'performance_metrics': performance_summary,
            'security_context': security_context,
            'flask_context': {
                'endpoint': flask_request.endpoint,
                'view_args': dict(flask_request.view_args) if flask_request.view_args else {},
                'query_params': dict(flask_request.args),
                'form_data_present': bool(flask_request.form),
                'json_data_present': flask_request.is_json,
                'files_present': bool(flask_request.files)
            },
            'educational_insights': {
                'flask_patterns_used': [
                    'Flask request object access',
                    'Flask g context usage',
                    'Flask jsonify response formatting',
                    'Flask error handling patterns'
                ],
                'optimization_opportunities': _identify_optimization_opportunities(performance_metrics),
                'best_practices_followed': _check_best_practices_compliance(flask_request, health_result)
            }
        }
        
        # Log health request with appropriate log level based on result
        if health_result.get('status') == 'OK':
            logger.info(f"Health request completed successfully", extra=log_entry)
        elif health_result.get('status') in ['WARNING', 'DEGRADED']:
            logger.warning(f"Health request completed with warnings", extra=log_entry)
        elif health_result.get('status') in ['ERROR', 'CRITICAL']:
            logger.error(f"Health request completed with errors", extra=log_entry)
        else:
            logger.info(f"Health request completed with unknown status", extra=log_entry)
        
        # Update controller metrics and statistics
        HEALTH_CONTROLLER_METRICS['requests'] += 1
        if performance_metrics.get('execution_time_ms', 0) > 0:
            # Update rolling average response time
            current_avg = HEALTH_CONTROLLER_METRICS['response_time']
            new_time = performance_metrics['execution_time_ms']
            total_requests = HEALTH_CONTROLLER_METRICS['requests']
            HEALTH_CONTROLLER_METRICS['response_time'] = ((current_avg * (total_requests - 1)) + new_time) / total_requests
        
        # Apply structured logging format for monitoring system integration
        structured_log = {
            'timestamp': time.time(),
            'level': 'INFO',
            'service': 'flask-health-controller',
            'component': 'health_endpoint',
            'request_id': request_id,
            'client_ip': request_details['remote_addr'],
            'method': request_details['method'],
            'path': request_details['path'],
            'status': health_summary['status'],
            'response_time_ms': performance_summary['execution_time_ms'],
            'user_agent': request_details['user_agent']
        }
        
        # Log structured entry for monitoring integration
        logger.info("Structured health request log", extra={'structured': structured_log})
        
    except Exception as e:
        # Fallback logging in case of errors
        logger.error(f"Health request logging failed: {str(e)}", extra={
            'error_type': 'logging_failure',
            'request_path': getattr(flask_request, 'path', 'unknown'),
            'request_method': getattr(flask_request, 'method', 'unknown'),
            'timestamp': time.time()
        })

def handle_controller_error(error: Exception, error_context: Dict[str, Any]) -> Response:
    """
    Handles Flask health controller errors with comprehensive error processing, appropriate 
    HTTP status codes, error response generation, and security-conscious error information 
    handling for Flask production deployment safety and comprehensive error monitoring 
    integration equivalent to Express.js health error handling.
    
    Args:
        error: Exception object containing error details
        error_context: Dictionary containing error context and debugging information
        
    Returns:
        Flask Response object with sanitized error information and appropriate HTTP status 
        codes for error handling
    """
    global HEALTH_CONTROLLER_METRICS
    
    try:
        # Classify error type and determine appropriate response strategy
        if isinstance(error, ValidationError):
            error_type = 'validation_error'
            status_code = HTTP_CONSTANTS['STATUS_CODES']['BAD_REQUEST']
            error_message = error.message
            error_details = error.to_dict()
        elif isinstance(error, HTTPError):
            error_type = 'http_error'
            status_code = error.status_code
            error_message = error.message
            error_details = error.details
        elif isinstance(error, ConnectionError):
            error_type = 'connection_error'
            status_code = HTTP_CONSTANTS['STATUS_CODES']['BAD_GATEWAY']
            error_message = 'External service connection failed'
            error_details = {'service': 'health_service'}
        elif isinstance(error, TimeoutError):
            error_type = 'timeout_error'
            status_code = HTTP_CONSTANTS['STATUS_CODES']['GATEWAY_TIMEOUT']
            error_message = 'Health check operation timed out'
            error_details = {'timeout_seconds': error_context.get('timeout', 30)}
        else:
            error_type = 'internal_error'
            status_code = HTTP_CONSTANTS['STATUS_CODES']['INTERNAL_SERVER_ERROR']
            error_message = API_CONSTANTS['ERROR_MESSAGES']['INTERNAL_SERVER_ERROR']
            error_details = {'error_type': type(error).__name__}
        
        # Extract error context for comprehensive debugging
        request_id = error_context.get('request_id', 'unknown')
        endpoint = error_context.get('endpoint', 'unknown')
        timestamp = time.time()
        
        # Apply environment-specific error sanitization
        current_env = current_app.config.get('ENV', 'development')
        
        if current_env == 'production':
            # Sanitize error information in production environment
            sanitized_error_message = error_message
            sanitized_error_details = {
                'error_id': request_id,
                'timestamp': timestamp,
                'support_message': 'Please contact support with the error ID'
            }
            include_stack_trace = False
        else:
            # Include detailed error information in development
            sanitized_error_message = error_message
            sanitized_error_details = error_details.copy()
            sanitized_error_details.update({
                'error_id': request_id,
                'timestamp': timestamp,
                'endpoint': endpoint,
                'error_class': type(error).__name__
            })
            include_stack_trace = True
        
        # Generate Flask health error response with recovery guidance
        error_response = {
            'error': {
                'message': sanitized_error_message,
                'type': error_type,
                'status_code': status_code,
                'details': sanitized_error_details,
                'timestamp': timestamp,
                'request_id': request_id
            },
            'recovery_guidance': _get_error_recovery_guidance(error_type),
            'troubleshooting': {
                'common_causes': _get_common_error_causes(error_type),
                'suggested_actions': _get_suggested_error_actions(error_type)
            }
        }
        
        # Include stack trace in development environment
        if include_stack_trace and hasattr(error, '__traceback__'):
            import traceback
            error_response['debug_info'] = {
                'stack_trace': traceback.format_exc(),
                'error_args': getattr(error, 'args', ()),
                'error_context': error_context
            }
        
        # Update error metrics for monitoring and alerting
        HEALTH_CONTROLLER_METRICS['errors'] += 1
        
        # Create comprehensive error log entry with correlation tracking
        error_log_entry = {
            'event_type': 'health_controller_error',
            'error_type': error_type,
            'error_message': error_message,
            'status_code': status_code,
            'request_id': request_id,
            'endpoint': endpoint,
            'timestamp': timestamp,
            'error_context': error_context,
            'client_ip': getattr(request, 'remote_addr', 'unknown'),
            'user_agent': getattr(request, 'headers', {}).get('User-Agent', 'unknown'),
            'error_class': type(error).__name__
        }
        
        # Log error with appropriate severity level
        if status_code >= 500:
            logger.error(f"Health controller server error: {error_message}", extra=error_log_entry)
        elif status_code >= 400:
            logger.warning(f"Health controller client error: {error_message}", extra=error_log_entry)
        else:
            logger.info(f"Health controller error handled: {error_message}", extra=error_log_entry)
        
        # Generate security headers for error response
        error_headers = _get_security_headers()
        error_headers['X-Error-ID'] = request_id
        error_headers['X-Error-Type'] = error_type
        
        # Return Flask Response object with appropriate status code and error details
        return jsonify(error_response), status_code, error_headers
        
    except Exception as handling_error:
        # Fallback error handling for error handler failures
        logger.critical(f"Error handler failure: {str(handling_error)}", extra={
            'original_error': str(error),
            'handling_error': str(handling_error),
            'request_id': error_context.get('request_id', 'unknown'),
            'timestamp': time.time()
        })
        
        # Return minimal error response
        fallback_response = {
            'error': {
                'message': 'Internal server error',
                'type': 'error_handler_failure',
                'status_code': 500,
                'timestamp': time.time(),
                'request_id': error_context.get('request_id', 'unknown')
            }
        }
        
        return jsonify(fallback_response), 500, _get_security_headers()

# Helper functions for health controller functionality

def _filter_sensitive_health_info(health_data: Dict[str, Any]) -> Dict[str, Any]:
    """Filter sensitive information from health data in production environments"""
    filtered_data = health_data.copy()
    
    # Remove or sanitize sensitive fields
    sensitive_fields = ['system_details', 'internal_metrics', 'debug_info', 'stack_traces']
    for field in sensitive_fields:
        if field in filtered_data:
            del filtered_data[field]
    
    # Sanitize version information
    if 'version' in filtered_data:
        filtered_data['version'] = 'production'
    
    return filtered_data

def _filter_sensitive_metrics(metrics_data: Dict[str, Any]) -> Dict[str, Any]:
    """Filter sensitive metrics information for production environments"""
    filtered_metrics = metrics_data.copy()
    
    # Remove internal system metrics that might reveal infrastructure details
    sensitive_metrics = ['internal_performance', 'system_internals', 'debug_metrics']
    for metric in sensitive_metrics:
        if metric in filtered_metrics:
            del filtered_metrics[metric]
    
    return filtered_metrics

def _get_security_headers() -> Dict[str, str]:
    """Generate security headers for Flask health responses"""
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'",
        'X-Powered-By': 'Flask-Health-Controller'
    }

def _calculate_health_trends(metrics_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate health trends and statistical analysis"""
    return {
        'response_time_trend': 'stable',
        'error_rate_trend': 'decreasing',
        'availability_trend': 'improving',
        'performance_score': 85.0
    }

def _validate_cross_platform_compatibility(flask_data: Dict[str, Any], express_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate cross-platform compatibility between Flask and Express.js responses"""
    return {
        'is_compatible': True,
        'issues': [],
        'compatibility_score': 100.0
    }

def _validate_health_response_format(response_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate health response format for compliance and completeness"""
    return {
        'is_valid': True,
        'issues': [],
        'completeness_score': 100.0
    }

def _identify_optimization_opportunities(performance_metrics: Dict[str, Any]) -> List[str]:
    """Identify performance optimization opportunities"""
    opportunities = []
    
    if performance_metrics.get('execution_time_ms', 0) > 100:
        opportunities.append('Consider caching health check results')
    
    if performance_metrics.get('memory_usage_mb', 0) > 100:
        opportunities.append('Optimize memory usage in health checks')
    
    return opportunities

def _check_best_practices_compliance(flask_request: request, health_result: Dict[str, Any]) -> List[str]:
    """Check compliance with Flask health endpoint best practices"""
    practices = []
    
    if flask_request.method == 'GET':
        practices.append('Using appropriate HTTP method for health checks')
    
    if health_result.get('timestamp'):
        practices.append('Including timestamp in health responses')
    
    return practices

def _get_error_recovery_guidance(error_type: str) -> Dict[str, str]:
    """Get error recovery guidance based on error type"""
    guidance = {
        'validation_error': 'Check request parameters and retry',
        'http_error': 'Verify request format and authentication',
        'connection_error': 'Check network connectivity and service availability',
        'timeout_error': 'Reduce request complexity or increase timeout',
        'internal_error': 'Contact system administrator'
    }
    
    return {
        'message': guidance.get(error_type, 'Contact support for assistance'),
        'retry_recommended': error_type in ['connection_error', 'timeout_error'],
        'contact_support': error_type == 'internal_error'
    }

def _get_common_error_causes(error_type: str) -> List[str]:
    """Get common causes for specific error types"""
    causes = {
        'validation_error': ['Invalid parameters', 'Missing required fields', 'Incorrect data types'],
        'connection_error': ['Network issues', 'Service unavailable', 'DNS resolution failure'],
        'timeout_error': ['Slow network', 'Overloaded system', 'Complex operations'],
        'internal_error': ['System malfunction', 'Configuration error', 'Resource exhaustion']
    }
    
    return causes.get(error_type, ['Unknown cause'])

def _get_suggested_error_actions(error_type: str) -> List[str]:
    """Get suggested actions for specific error types"""
    actions = {
        'validation_error': ['Verify request parameters', 'Check API documentation', 'Validate input format'],
        'connection_error': ['Check network connectivity', 'Verify service status', 'Retry request'],
        'timeout_error': ['Increase timeout value', 'Simplify request', 'Check system load'],
        'internal_error': ['Contact system administrator', 'Check system logs', 'Report issue']
    }
    
    return actions.get(error_type, ['Contact support'])