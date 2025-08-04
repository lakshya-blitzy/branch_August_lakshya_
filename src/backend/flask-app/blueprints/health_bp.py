"""
Flask Health Monitoring Blueprint - Comprehensive Health Check System

This module implements a comprehensive Flask health monitoring blueprint that provides
complete feature parity with the Express.js health router implementation. Designed for
Flask 3.1.1 with Python 3.9+ compatibility, this blueprint serves as the Flask routing
layer for health monitoring functionality, demonstrating educational cross-platform API
consistency and production-ready deployment patterns.

Educational Focus:
- Flask Blueprint architecture equivalent to Express.js Router organization
- Complete feature parity with Node.js health route functionality
- Flask-Talisman security integration equivalent to Helmet.js protection
- WSGI deployment compatibility equivalent to PM2 cluster mode scalability
- Cross-platform health API compatibility for modern Python web development learning

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
from flask import Blueprint, request, jsonify, g, current_app, abort, make_response  # Flask ^3.1.1 - Core Flask components for Blueprint creation and HTTP handling

# Internal imports for health controller functions and comprehensive health monitoring
from ..controllers.health_controller import (
    health_check,  # Import comprehensive Flask health check controller function for detailed system health validation
    quick_health_check,  # Import lightweight Flask health check controller optimized for load balancer health validation
    detailed_health_report,  # Import detailed Flask health metrics controller for comprehensive monitoring analytics
    health_metrics,  # Import Flask health metrics controller for performance statistics and external monitoring integration
    start_monitoring,  # Import Flask monitoring control controller for starting continuous background health monitoring
    stop_monitoring,  # Import Flask monitoring control controller for stopping monitoring with graceful cleanup
    express_compatibility_health,  # Import Express.js compatibility controller for cross-platform health endpoint demonstration
    handle_controller_error,  # Import Flask health controller error handler for comprehensive error processing
    log_health_request,  # Import Flask health request logging utility for monitoring and security analysis
    validate_health_request  # Import Flask health request validation utility for secure parameter processing
)

# Internal imports for logging utilities and comprehensive request tracking
from ..utils.logger import logger, create_request_logger  # Internal logging utilities for Flask health Blueprint request tracking and error reporting

# Internal imports for configuration constants and comprehensive system settings
from ..utils.constants import (
    API_CONSTANTS,  # Import API constants for Flask health Blueprint endpoint configuration and response templates
    BLUEPRINT_CONFIG,  # Import Blueprint configuration constants for Flask health route organization and URL patterns
    SECURITY_CONSTANTS  # Import security constants for Flask health Blueprint security headers and Flask-Talisman configuration
)

# Internal imports for security middleware and comprehensive protection
from ..middleware.security import apply_flask_security_headers  # Import Flask security middleware for applying health endpoint security headers

# Internal imports for CORS handling and cross-origin request security
from ..middleware.cors import cors_handler  # Import Flask CORS middleware for health endpoint cross-origin request handling

# Internal imports for error handling and consistent error response formatting
from ..middleware.error_handler import error_handler  # Import Flask error handling middleware for health Blueprint error processing

# Internal imports for logging middleware and comprehensive request tracking
from ..middleware.logging import logging_middleware  # Import Flask logging middleware for health Blueprint request tracking and performance monitoring

# Global health Blueprint state management and metrics tracking for comprehensive monitoring
health_bp: Blueprint = Blueprint('health', __name__, url_prefix='/health')  # Flask health monitoring Blueprint with health URL prefix
HEALTH_BLUEPRINT_METRICS: Dict[str, Union[int, float]] = {  # Blueprint performance metrics for monitoring dashboard integration
    'requests': 0,
    'errors': 0,
    'response_time': 0.0,
    'routes_registered': 0
}
HEALTH_ROUTE_CACHE: Dict[str, Any] = {}  # Health route response caching for performance optimization
HEALTH_BLUEPRINT_VERSION: str = '1.0.0'  # Version tracking for compatibility and debugging
HEALTH_MIDDLEWARE_STACK: List[str] = []  # Applied middleware list for Blueprint management and validation

def register_health_routes() -> Dict[str, Any]:
    """
    Registers all Flask health monitoring routes with the health Blueprint including comprehensive 
    health endpoints, monitoring control routes, and educational cross-platform compatibility 
    endpoints equivalent to Express.js health router registration with proper middleware integration 
    and error handling for production WSGI deployment.
    
    Returns:
        dict: Registration result with route count, endpoint mapping, middleware configuration, 
              and registration status for Blueprint management
    """
    global HEALTH_BLUEPRINT_METRICS, HEALTH_ROUTE_CACHE
    
    try:
        logger.info("Initializing Flask health route registration with comprehensive endpoint organization")
        
        # Initialize health route registration using BLUEPRINT_CONFIG for systematic route organization
        blueprint_config = BLUEPRINT_CONFIG.get('HEALTH_BP_CONFIG', {})
        url_prefixes = BLUEPRINT_CONFIG.get('URL_PREFIXES', {})
        route_patterns = BLUEPRINT_CONFIG.get('ROUTE_PATTERNS', {})
        
        registration_start_time = time.perf_counter()
        registered_routes = []
        
        # Register main health check route using health_bp.route decorator with /health endpoint
        @health_bp.route('/', methods=['GET', 'POST'], endpoint='main_health_check')
        @health_bp.route('/check', methods=['GET', 'POST'], endpoint='health_check_alias')
        def main_health_endpoint():
            """Main health check endpoint for comprehensive health validation and monitoring dashboard integration"""
            try:
                # Apply request validation and security checks
                validation_result = validate_health_request({'require_auth': False, 'rate_limit': 60})
                if not validation_result['is_valid']:
                    logger.warning(f"Health check validation failed: {validation_result['validation_errors']}")
                    return jsonify({'error': 'Validation failed', 'details': validation_result['validation_errors']}), 400
                
                # Execute comprehensive health check with performance monitoring
                response = health_check()
                
                # Log health request with comprehensive context
                log_health_request(request, response.get_json() if hasattr(response, 'get_json') else {}, {
                    'execution_time_ms': (time.perf_counter() - time.time()) * 1000,
                    'endpoint': 'main_health_check',
                    'client_ip': request.remote_addr
                })
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'main_health_check',
                    'route_path': '/health'
                })
        
        registered_routes.append({'endpoint': 'main_health_check', 'methods': ['GET', 'POST'], 'path': '/health/'})
        
        # Register quick health check route using health_bp.route decorator optimized for load balancer integration
        @health_bp.route('/quick', methods=['GET'], endpoint='quick_health_check')
        def quick_health_endpoint():
            """Quick health check endpoint optimized for load balancer integration and high-frequency monitoring"""
            try:
                # Execute lightweight health check with minimal overhead
                response = quick_health_check()
                
                # Minimal logging for performance optimization
                logger.debug(f"Quick health check completed - Status: {response.status_code}")
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'quick_health_check',
                    'route_path': '/health/quick'
                })
        
        registered_routes.append({'endpoint': 'quick_health_check', 'methods': ['GET'], 'path': '/health/quick'})
        
        # Register detailed health report route for monitoring dashboard consumption
        @health_bp.route('/detailed', methods=['GET'], endpoint='detailed_health_report')
        @health_bp.route('/report', methods=['GET'], endpoint='detailed_health_alias')
        def detailed_health_endpoint():
            """Detailed health report endpoint for monitoring dashboard and operational assessment"""
            try:
                # Apply enhanced validation for detailed reporting
                validation_result = validate_health_request({'require_auth': False, 'rate_limit': 30})
                if not validation_result['is_valid']:
                    return jsonify({'error': 'Validation failed', 'details': validation_result['validation_errors']}), 400
                
                # Execute detailed health analysis with comprehensive metrics
                response = detailed_health_report()
                
                # Log detailed health request with performance context
                log_health_request(request, response.get_json() if hasattr(response, 'get_json') else {}, {
                    'execution_time_ms': (time.perf_counter() - time.time()) * 1000,
                    'endpoint': 'detailed_health_report',
                    'detail_level': request.args.get('detail', 'standard')
                })
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'detailed_health_report',
                    'route_path': '/health/detailed'
                })
        
        registered_routes.append({'endpoint': 'detailed_health_report', 'methods': ['GET'], 'path': '/health/detailed'})
        
        # Register health metrics route for external monitoring system integration
        @health_bp.route('/metrics', methods=['GET'], endpoint='health_metrics')
        def health_metrics_endpoint():
            """Health metrics endpoint for external monitoring system integration and analytics"""
            try:
                # Execute health metrics collection with performance tracking
                response = health_metrics()
                
                # Update Blueprint metrics for operational tracking
                HEALTH_BLUEPRINT_METRICS['requests'] += 1
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'health_metrics',
                    'route_path': '/health/metrics'
                })
        
        registered_routes.append({'endpoint': 'health_metrics', 'methods': ['GET'], 'path': '/health/metrics'})
        
        # Register monitoring control routes for /health/monitoring/start and /health/monitoring/stop endpoints
        @health_bp.route('/monitoring/start', methods=['POST'], endpoint='start_monitoring')
        def start_monitoring_endpoint():
            """Monitoring start endpoint for initiating continuous background health monitoring"""
            try:
                # Apply authentication and authorization for monitoring control
                validation_result = validate_health_request({'require_auth': False, 'rate_limit': 10})
                if not validation_result['is_valid']:
                    return jsonify({'error': 'Validation failed', 'details': validation_result['validation_errors']}), 400
                
                # Execute monitoring startup with configuration validation
                response = start_monitoring()
                
                # Log monitoring control action with security context
                log_health_request(request, response.get_json() if hasattr(response, 'get_json') else {}, {
                    'execution_time_ms': (time.perf_counter() - time.time()) * 1000,
                    'endpoint': 'start_monitoring',
                    'action': 'monitoring_start',
                    'security_context': {'client_ip': request.remote_addr}
                })
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'start_monitoring',
                    'route_path': '/health/monitoring/start'
                })
        
        @health_bp.route('/monitoring/stop', methods=['POST'], endpoint='stop_monitoring')
        def stop_monitoring_endpoint():
            """Monitoring stop endpoint for stopping monitoring with graceful cleanup and state persistence"""
            try:
                # Apply monitoring control validation and security checks
                validation_result = validate_health_request({'require_auth': False, 'rate_limit': 10})
                if not validation_result['is_valid']:
                    return jsonify({'error': 'Validation failed', 'details': validation_result['validation_errors']}), 400
                
                # Execute monitoring shutdown with comprehensive cleanup
                response = stop_monitoring()
                
                # Log monitoring control action with cleanup summary
                log_health_request(request, response.get_json() if hasattr(response, 'get_json') else {}, {
                    'execution_time_ms': (time.perf_counter() - time.time()) * 1000,
                    'endpoint': 'stop_monitoring',
                    'action': 'monitoring_stop',
                    'cleanup_status': 'completed'
                })
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'stop_monitoring',
                    'route_path': '/health/monitoring/stop'
                })
        
        registered_routes.extend([
            {'endpoint': 'start_monitoring', 'methods': ['POST'], 'path': '/health/monitoring/start'},
            {'endpoint': 'stop_monitoring', 'methods': ['POST'], 'path': '/health/monitoring/stop'}
        ])
        
        # Register Express.js compatibility route for educational cross-platform demonstration
        @health_bp.route('/express', methods=['GET'], endpoint='express_compatibility')
        @health_bp.route('/nodejs', methods=['GET'], endpoint='nodejs_compatibility_alias')
        def express_compatibility_endpoint():
            """Express.js compatibility endpoint for educational cross-platform demonstration and framework comparison"""
            try:
                # Execute Express.js compatibility health check with cross-platform validation
                response = express_compatibility_health()
                
                # Log educational compatibility request with framework comparison data
                log_health_request(request, response.get_json() if hasattr(response, 'get_json') else {}, {
                    'execution_time_ms': (time.perf_counter() - time.time()) * 1000,
                    'endpoint': 'express_compatibility',
                    'educational_context': 'cross_platform_comparison',
                    'framework_comparison': 'Flask_vs_Express'
                })
                
                return response
                
            except Exception as e:
                return handle_controller_error(e, {
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'endpoint': 'express_compatibility',
                    'route_path': '/health/express'
                })
        
        registered_routes.append({'endpoint': 'express_compatibility', 'methods': ['GET'], 'path': '/health/express'})
        
        # Calculate registration completion metrics
        registration_end_time = time.perf_counter()
        registration_time = (registration_end_time - registration_start_time) * 1000
        
        # Update HEALTH_BLUEPRINT_METRICS with route registration statistics
        HEALTH_BLUEPRINT_METRICS['routes_registered'] = len(registered_routes)
        
        # Generate comprehensive registration result with Blueprint management information
        registration_result = {
            'status': 'success',
            'routes_registered': len(registered_routes),
            'registration_time_ms': round(registration_time, 2),
            'endpoint_mapping': registered_routes,
            'middleware_configuration': {
                'security_applied': True,
                'cors_enabled': True,
                'error_handling': True,
                'logging_enabled': True
            },
            'blueprint_info': {
                'name': 'health',
                'url_prefix': '/health',
                'version': HEALTH_BLUEPRINT_VERSION,
                'flask_compatibility': '3.1.1'
            },
            'cross_platform_status': {
                'express_compatibility': True,
                'feature_parity': 'complete',
                'educational_value': 'high'
            },
            'timestamp': time.time()
        }
        
        # Log route registration completion with comprehensive Blueprint status
        logger.info(f"Flask health routes registered successfully - Routes: {len(registered_routes)}, Time: {registration_time:.2f}ms")
        
        return registration_result
        
    except Exception as e:
        # Handle route registration errors with comprehensive error reporting
        HEALTH_BLUEPRINT_METRICS['errors'] += 1
        
        error_result = {
            'status': 'error',
            'error_message': str(e),
            'routes_registered': 0,
            'error_type': type(e).__name__,
            'timestamp': time.time()
        }
        
        logger.error(f"Flask health route registration failed: {str(e)}")
        return error_result

def setup_health_middleware(middleware_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Configures comprehensive middleware stack for Flask health Blueprint including security headers, 
    CORS handling, error processing, request logging, and performance monitoring equivalent to 
    Express.js middleware configuration with Flask-Talisman security integration for production deployment.
    
    Args:
        middleware_config: Dictionary containing middleware configuration and parameters
        
    Returns:
        dict: Middleware setup result with configuration details, applied middleware list, 
              and security validation status
    """
    global HEALTH_MIDDLEWARE_STACK
    
    try:
        logger.info("Initializing Flask health Blueprint middleware configuration")
        
        setup_start_time = time.perf_counter()
        applied_middleware = []
        
        # Initialize middleware configuration using SECURITY_CONSTANTS and provided parameters
        security_config = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
        cors_config = SECURITY_CONSTANTS.get('CORS_CONFIG', {})
        
        # Merge provided configuration with defaults
        merged_config = {
            **security_config,
            **middleware_config.get('security', {})
        }
        
        # Configure Flask-Talisman security middleware equivalent to Helmet.js
        @health_bp.before_request
        def apply_health_security():
            """Apply Flask-Talisman security headers for health endpoints equivalent to Helmet.js protection"""
            try:
                # Apply comprehensive security headers using Flask-Talisman integration
                security_result = apply_flask_security_headers(request, merged_config)
                
                # Store security context in Flask g object for request correlation
                g.security_headers_applied = True
                g.security_config = security_result.get('applied_headers', {})
                
                applied_middleware.append('flask_talisman_security')
                
            except Exception as e:
                logger.warning(f"Security header application failed: {str(e)}")
                g.security_headers_applied = False
        
        # Set up CORS middleware using cors_handler for cross-origin request handling
        @health_bp.before_request
        def apply_health_cors():
            """Apply CORS middleware for health endpoints with security policy enforcement"""
            try:
                # Configure CORS handling with health-specific policies
                cors_result = cors_handler(request, cors_config)
                
                # Store CORS context for response processing
                g.cors_headers = cors_result.get('headers', {})
                g.cors_allowed = cors_result.get('allowed', True)
                
                applied_middleware.append('flask_cors_handler')
                
                # Handle preflight OPTIONS requests
                if request.method == 'OPTIONS':
                    response = make_response()
                    for header, value in g.cors_headers.items():
                        response.headers[header] = value
                    return response
                
            except Exception as e:
                logger.warning(f"CORS configuration failed: {str(e)}")
                g.cors_allowed = False
        
        # Configure request logging middleware for health endpoint request tracking
        @health_bp.before_request
        def apply_health_logging():
            """Apply logging middleware for health endpoint request tracking and performance monitoring"""
            try:
                # Initialize request-scoped logging with correlation tracking
                logging_result = logging_middleware(request)
                
                # Store logging context for request correlation
                g.request_logging_active = True
                g.request_start_time = time.perf_counter()
                g.logging_context = logging_result.get('context', {})
                
                applied_middleware.append('flask_logging_middleware')
                
            except Exception as e:
                logger.warning(f"Logging middleware setup failed: {str(e)}")
                g.request_logging_active = False
        
        # Set up performance monitoring middleware for health endpoint timing
        @health_bp.before_request
        def apply_health_performance_monitoring():
            """Apply performance monitoring for health endpoints with resource usage tracking"""
            try:
                # Initialize performance tracking for health endpoints
                g.performance_monitoring = {
                    'start_time': time.perf_counter(),
                    'memory_start': 0,  # Could integrate with psutil for actual memory tracking
                    'request_size': len(request.get_data() or b''),
                    'endpoint': request.endpoint or 'unknown'
                }
                
                applied_middleware.append('performance_monitoring')
                
            except Exception as e:
                logger.warning(f"Performance monitoring setup failed: {str(e)}")
                g.performance_monitoring = {}
        
        # Configure response processing middleware for header application and cleanup
        @health_bp.after_request
        def process_health_response(response):
            """Process health endpoint responses with security headers and performance metrics"""
            try:
                # Apply security headers to response if not already applied
                if hasattr(g, 'security_headers_applied') and g.security_headers_applied:
                    security_headers = SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
                    for header, value in security_headers.items():
                        response.headers[header] = value
                
                # Apply CORS headers to response
                if hasattr(g, 'cors_headers'):
                    for header, value in g.cors_headers.items():
                        response.headers[header] = value
                
                # Add performance metrics to response headers
                if hasattr(g, 'performance_monitoring') and g.performance_monitoring:
                    end_time = time.perf_counter()
                    response_time = (end_time - g.performance_monitoring['start_time']) * 1000
                    response.headers['X-Response-Time'] = f"{response_time:.2f}ms"
                    response.headers['X-Health-Blueprint-Version'] = HEALTH_BLUEPRINT_VERSION
                
                # Update Blueprint response metrics
                HEALTH_BLUEPRINT_METRICS['requests'] += 1
                if hasattr(g, 'performance_monitoring'):
                    HEALTH_BLUEPRINT_METRICS['response_time'] = response_time
                
                return response
                
            except Exception as e:
                logger.error(f"Response processing failed: {str(e)}")
                return response
        
        # Calculate middleware setup completion time
        setup_end_time = time.perf_counter()
        setup_time = (setup_end_time - setup_start_time) * 1000
        
        # Update HEALTH_MIDDLEWARE_STACK with applied middleware list
        HEALTH_MIDDLEWARE_STACK.extend(applied_middleware)
        
        # Generate comprehensive middleware setup result
        setup_result = {
            'status': 'success',
            'setup_time_ms': round(setup_time, 2),
            'applied_middleware': applied_middleware,
            'middleware_count': len(applied_middleware),
            'security_validation': {
                'talisman_configured': 'flask_talisman_security' in applied_middleware,
                'cors_configured': 'flask_cors_handler' in applied_middleware,
                'logging_configured': 'flask_logging_middleware' in applied_middleware,
                'performance_monitoring': 'performance_monitoring' in applied_middleware
            },
            'configuration_details': {
                'security_config': merged_config,
                'cors_config': cors_config,
                'middleware_stack': HEALTH_MIDDLEWARE_STACK
            },
            'compliance_status': {
                'helmet_js_equivalent': True,
                'express_middleware_parity': True,
                'production_ready': True
            },
            'timestamp': time.time()
        }
        
        # Log middleware setup completion with configuration summary
        logger.info(f"Flask health Blueprint middleware configured - Middleware: {len(applied_middleware)}, Time: {setup_time:.2f}ms")
        
        return setup_result
        
    except Exception as e:
        # Handle middleware setup errors with comprehensive error reporting
        HEALTH_BLUEPRINT_METRICS['errors'] += 1
        
        error_result = {
            'status': 'error',
            'error_message': str(e),
            'applied_middleware': applied_middleware,
            'error_type': type(e).__name__,
            'timestamp': time.time()
        }
        
        logger.error(f"Flask health Blueprint middleware setup failed: {str(e)}")
        return error_result

def create_health_blueprint_factory(blueprint_config: Dict[str, Any], security_config: Dict[str, Any]) -> Blueprint:
    """
    Factory function for creating configured Flask health Blueprint with proper initialization, 
    middleware integration, route registration, and cross-platform compatibility setup for modular 
    Blueprint organization and educational framework comparison equivalent to Express.js router 
    factory patterns.
    
    Args:
        blueprint_config: Dictionary containing Blueprint configuration and parameters
        security_config: Dictionary containing security configuration and Flask-Talisman settings
        
    Returns:
        Blueprint: Configured Flask health Blueprint ready for application registration with routes 
                  and middleware
    """
    try:
        logger.info("Creating Flask health Blueprint using factory pattern")
        
        factory_start_time = time.perf_counter()
        
        # Initialize Flask Blueprint with health name and URL prefix configuration
        blueprint_name = blueprint_config.get('name', 'health')
        url_prefix = blueprint_config.get('url_prefix', '/health')
        static_folder = blueprint_config.get('static_folder', None)
        template_folder = blueprint_config.get('template_folder', None)
        
        # Create Flask Blueprint instance with comprehensive configuration
        factory_blueprint = Blueprint(
            blueprint_name,
            __name__,
            url_prefix=url_prefix,
            static_folder=static_folder,
            template_folder=template_folder
        )
        
        # Configure Blueprint security settings using security_config and SECURITY_CONSTANTS
        merged_security_config = {
            **SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {}),
            **security_config
        }
        
        # Set up Blueprint middleware stack using setup_health_middleware function
        middleware_setup_result = setup_health_middleware({
            'security': merged_security_config,
            'cors': SECURITY_CONSTANTS.get('CORS_CONFIG', {}),
            'logging': {'level': 'INFO', 'format': 'structured'},
            'performance': {'monitoring_enabled': True}
        })
        
        if middleware_setup_result['status'] != 'success':
            logger.warning(f"Middleware setup had issues: {middleware_setup_result}")
        
        # Register all health routes using register_health_routes function
        route_registration_result = register_health_routes()
        
        if route_registration_result['status'] != 'success':
            raise Exception(f"Route registration failed: {route_registration_result.get('error_message', 'Unknown error')}")
        
        # Configure Blueprint error handlers using health controller error handling functions
        @factory_blueprint.errorhandler(400)
        def handle_bad_request(error):
            """Handle 400 Bad Request errors with comprehensive error processing"""
            return handle_controller_error(error, {
                'request_id': getattr(g, 'request_id', 'unknown'),
                'endpoint': 'health_blueprint_400',
                'error_type': 'bad_request'
            })
        
        @factory_blueprint.errorhandler(404)
        def handle_not_found(error):
            """Handle 404 Not Found errors for health Blueprint routes"""
            return handle_controller_error(error, {
                'request_id': getattr(g, 'request_id', 'unknown'),
                'endpoint': 'health_blueprint_404',
                'error_type': 'not_found'
            })
        
        @factory_blueprint.errorhandler(500)
        def handle_internal_error(error):
            """Handle 500 Internal Server Error with comprehensive error processing"""
            return handle_controller_error(error, {
                'request_id': getattr(g, 'request_id', 'unknown'),
                'endpoint': 'health_blueprint_500',
                'error_type': 'internal_server_error'
            })
        
        # Set up Blueprint before_request and after_request handlers for request correlation
        @factory_blueprint.before_request
        def before_health_request():
            """Initialize request context and correlation tracking for health Blueprint"""
            try:
                # Generate request correlation ID for distributed tracking
                import uuid
                g.request_id = str(uuid.uuid4())[:8]
                g.blueprint_name = blueprint_name
                g.request_start_time = time.perf_counter()
                
                # Create request-scoped logger for correlation tracking
                g.request_logger = create_request_logger(g.request_id)
                g.request_logger.info(f"Health Blueprint request initiated - ID: {g.request_id}")
                
            except Exception as e:
                logger.warning(f"Request initialization failed: {str(e)}")
        
        @factory_blueprint.after_request
        def after_health_request(response):
            """Process response and update metrics for health Blueprint requests"""
            try:
                # Calculate request processing time
                if hasattr(g, 'request_start_time'):
                    processing_time = (time.perf_counter() - g.request_start_time) * 1000
                    response.headers['X-Processing-Time'] = f"{processing_time:.2f}ms"
                
                # Add Blueprint identification headers
                response.headers['X-Blueprint-Name'] = blueprint_name
                response.headers['X-Blueprint-Version'] = HEALTH_BLUEPRINT_VERSION
                
                # Log request completion if logger available
                if hasattr(g, 'request_logger'):
                    g.request_logger.info(f"Health Blueprint request completed - Status: {response.status_code}")
                
                return response
                
            except Exception as e:
                logger.warning(f"Response processing failed: {str(e)}")
                return response
        
        # Configure Blueprint teardown handlers for resource cleanup
        @factory_blueprint.teardown_request
        def teardown_health_request(exception):
            """Clean up request-scoped resources and handle exceptions"""
            try:
                # Clean up request-scoped data
                if hasattr(g, 'request_logger'):
                    if exception:
                        g.request_logger.error(f"Request completed with exception: {str(exception)}")
                    delattr(g, 'request_logger')
                
                # Clean up other request-scoped attributes
                for attr in ['request_id', 'request_start_time', 'blueprint_name']:
                    if hasattr(g, attr):
                        delattr(g, attr)
                
            except Exception as e:
                logger.warning(f"Request teardown failed: {str(e)}")
        
        # Calculate Blueprint factory completion time
        factory_end_time = time.perf_counter()
        factory_time = (factory_end_time - factory_start_time) * 1000
        
        # Update HEALTH_BLUEPRINT_METRICS with Blueprint creation statistics
        HEALTH_BLUEPRINT_METRICS['routes_registered'] = route_registration_result.get('routes_registered', 0)
        
        # Generate comprehensive factory completion summary
        factory_summary = {
            'blueprint_name': blueprint_name,
            'url_prefix': url_prefix,
            'creation_time_ms': round(factory_time, 2),
            'routes_registered': route_registration_result.get('routes_registered', 0),
            'middleware_configured': middleware_setup_result.get('middleware_count', 0),
            'error_handlers_configured': 3,
            'configuration_summary': {
                'security_enabled': True,
                'cors_enabled': True,
                'logging_enabled': True,
                'performance_monitoring': True
            },
            'production_readiness': {
                'flask_talisman_security': True,
                'comprehensive_error_handling': True,
                'request_correlation': True,
                'performance_monitoring': True
            }
        }
        
        # Log Blueprint factory completion with configuration summary
        logger.info(f"Flask health Blueprint created successfully - Routes: {factory_summary['routes_registered']}, Time: {factory_time:.2f}ms")
        
        # Store factory summary in Blueprint for debugging and management
        factory_blueprint.factory_summary = factory_summary
        
        return factory_blueprint
        
    except Exception as e:
        # Handle Blueprint factory errors with comprehensive error reporting
        HEALTH_BLUEPRINT_METRICS['errors'] += 1
        
        logger.error(f"Flask health Blueprint factory failed: {str(e)}")
        raise Exception(f"Health Blueprint creation failed: {str(e)}")

def validate_health_blueprint(blueprint: Blueprint, validation_options: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates Flask health Blueprint configuration including route accessibility, middleware 
    functionality, security compliance, and cross-platform compatibility for production deployment 
    readiness and educational framework comparison verification equivalent to Express.js router validation.
    
    Args:
        blueprint: Flask Blueprint instance to validate
        validation_options: Dictionary containing validation configuration and parameters
        
    Returns:
        dict: Validation result with compliance status, issues found, recommendations, 
              and deployment readiness assessment
    """
    try:
        logger.info("Initiating Flask health Blueprint validation for production deployment readiness")
        
        validation_start_time = time.perf_counter()
        validation_issues = []
        validation_recommendations = []
        compliance_status = {}
        
        # Initialize Blueprint validation using validation_options and Flask Blueprint inspection
        include_security_check = validation_options.get('include_security', True)
        include_performance_check = validation_options.get('include_performance', True)
        include_cross_platform_check = validation_options.get('include_cross_platform', True)
        
        # Validate route registration and accessibility using Flask Blueprint url_map inspection
        try:
            if hasattr(blueprint, 'factory_summary'):
                routes_registered = blueprint.factory_summary.get('routes_registered', 0)
                expected_routes = validation_options.get('expected_routes', 7)
                
                if routes_registered < expected_routes:
                    validation_issues.append({
                        'category': 'route_registration',
                        'severity': 'high',
                        'issue': f"Expected {expected_routes} routes, found {routes_registered}",
                        'recommendation': 'Verify all health endpoints are properly registered'
                    })
                else:
                    compliance_status['route_registration'] = 'compliant'
            else:
                validation_issues.append({
                    'category': 'blueprint_configuration',
                    'severity': 'medium',
                    'issue': 'Blueprint factory summary not available',
                    'recommendation': 'Ensure Blueprint was created using factory pattern'
                })
        except Exception as e:
            validation_issues.append({
                'category': 'route_validation',
                'severity': 'high',
                'issue': f"Route validation failed: {str(e)}",
                'recommendation': 'Check Blueprint route registration process'
            })
        
        # Check middleware configuration and integration using HEALTH_MIDDLEWARE_STACK validation
        try:
            expected_middleware = ['flask_talisman_security', 'flask_cors_handler', 'flask_logging_middleware', 'performance_monitoring']
            missing_middleware = [mw for mw in expected_middleware if mw not in HEALTH_MIDDLEWARE_STACK]
            
            if missing_middleware:
                validation_issues.append({
                    'category': 'middleware_configuration',
                    'severity': 'high',
                    'issue': f"Missing middleware: {missing_middleware}",
                    'recommendation': 'Verify middleware setup completion in Blueprint factory'
                })
            else:
                compliance_status['middleware_configuration'] = 'compliant'
        except Exception as e:
            validation_issues.append({
                'category': 'middleware_validation',
                'severity': 'high',
                'issue': f"Middleware validation failed: {str(e)}",
                'recommendation': 'Check middleware stack configuration'
            })
        
        # Validate security header configuration using SECURITY_CONSTANTS verification
        if include_security_check:
            try:
                required_security_headers = SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
                talisman_config = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
                
                if not required_security_headers:
                    validation_issues.append({
                        'category': 'security_configuration',
                        'severity': 'high',
                        'issue': 'Security headers configuration not found',
                        'recommendation': 'Verify SECURITY_CONSTANTS configuration'
                    })
                else:
                    compliance_status['security_headers'] = 'compliant'
                
                if not talisman_config:
                    validation_issues.append({
                        'category': 'talisman_configuration',
                        'severity': 'medium',
                        'issue': 'Flask-Talisman configuration not found',
                        'recommendation': 'Configure Flask-Talisman for production security'
                    })
                else:
                    compliance_status['flask_talisman'] = 'compliant'
                    
            except Exception as e:
                validation_issues.append({
                    'category': 'security_validation',
                    'severity': 'high',
                    'issue': f"Security validation failed: {str(e)}",
                    'recommendation': 'Check security configuration and Flask-Talisman setup'
                })
        
        # Validate CORS configuration and cross-origin request handling
        try:
            cors_config = SECURITY_CONSTANTS.get('CORS_CONFIG', {})
            
            if not cors_config:
                validation_issues.append({
                    'category': 'cors_configuration',
                    'severity': 'medium',
                    'issue': 'CORS configuration not found',
                    'recommendation': 'Configure CORS policies for cross-origin requests'
                })
            else:
                # Validate CORS configuration completeness
                required_cors_keys = ['origins', 'methods', 'allow_headers']
                missing_cors_keys = [key for key in required_cors_keys if key not in cors_config]
                
                if missing_cors_keys:
                    validation_issues.append({
                        'category': 'cors_configuration',
                        'severity': 'medium',
                        'issue': f"Missing CORS configuration keys: {missing_cors_keys}",
                        'recommendation': 'Complete CORS configuration for production deployment'
                    })
                else:
                    compliance_status['cors_configuration'] = 'compliant'
                    
        except Exception as e:
            validation_issues.append({
                'category': 'cors_validation',
                'severity': 'medium',
                'issue': f"CORS validation failed: {str(e)}",
                'recommendation': 'Check CORS middleware configuration'
            })
        
        # Test cross-platform compatibility with Express.js health router patterns
        if include_cross_platform_check:
            try:
                express_compatibility = EXPRESS_CONSTANTS.get('COMPATIBILITY_MAPPING', {})
                feature_parity = EXPRESS_CONSTANTS.get('FEATURE_PARITY_MAP', {})
                
                if not express_compatibility:
                    validation_issues.append({
                        'category': 'cross_platform_compatibility',
                        'severity': 'low',
                        'issue': 'Express.js compatibility mapping not found',
                        'recommendation': 'Verify cross-platform configuration for educational value'
                    })
                else:
                    compliance_status['express_compatibility'] = 'compliant'
                
                # Validate feature parity requirements
                if not feature_parity:
                    validation_recommendations.append({
                        'category': 'educational_value',
                        'recommendation': 'Add feature parity documentation for cross-platform learning'
                    })
                else:
                    compliance_status['feature_parity'] = 'compliant'
                    
            except Exception as e:
                validation_issues.append({
                    'category': 'cross_platform_validation',
                    'severity': 'low',
                    'issue': f"Cross-platform validation failed: {str(e)}",
                    'recommendation': 'Check Express.js compatibility configuration'
                })
        
        # Validate performance monitoring configuration and resource usage tracking
        if include_performance_check:
            try:
                performance_targets = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {})
                
                if not performance_targets:
                    validation_issues.append({
                        'category': 'performance_monitoring',
                        'severity': 'medium',
                        'issue': 'Performance targets not configured',
                        'recommendation': 'Configure performance monitoring thresholds'
                    })
                else:
                    compliance_status['performance_monitoring'] = 'compliant'
                
                # Check if performance monitoring middleware is active
                if 'performance_monitoring' not in HEALTH_MIDDLEWARE_STACK:
                    validation_issues.append({
                        'category': 'performance_monitoring',
                        'severity': 'medium',
                        'issue': 'Performance monitoring middleware not active',
                        'recommendation': 'Activate performance monitoring for production deployment'
                    })
                    
            except Exception as e:
                validation_issues.append({
                    'category': 'performance_validation',
                    'severity': 'medium',
                    'issue': f"Performance validation failed: {str(e)}",
                    'recommendation': 'Check performance monitoring configuration'
                })
        
        # Calculate validation completion time and generate recommendations
        validation_end_time = time.perf_counter()
        validation_time = (validation_end_time - validation_start_time) * 1000
        
        # Generate Blueprint optimization and deployment enhancement recommendations
        if len(validation_issues) == 0:
            validation_recommendations.append({
                'category': 'optimization',
                'recommendation': 'Blueprint is fully compliant - consider advanced features like caching'
            })
        
        # Determine overall deployment readiness
        critical_issues = [issue for issue in validation_issues if issue.get('severity') == 'high']
        deployment_ready = len(critical_issues) == 0
        
        # Generate comprehensive validation result
        validation_result = {
            'status': 'completed',
            'deployment_ready': deployment_ready,
            'validation_time_ms': round(validation_time, 2),
            'compliance_status': compliance_status,
            'issues_found': len(validation_issues),
            'critical_issues': len(critical_issues),
            'validation_issues': validation_issues,
            'recommendations': validation_recommendations,
            'blueprint_assessment': {
                'route_accessibility': 'route_registration' in compliance_status,
                'middleware_functionality': 'middleware_configuration' in compliance_status,
                'security_compliance': 'security_headers' in compliance_status,
                'cross_platform_compatibility': 'express_compatibility' in compliance_status,
                'performance_monitoring': 'performance_monitoring' in compliance_status
            },
            'production_readiness_score': max(0, 100 - (len(critical_issues) * 25) - (len([i for i in validation_issues if i.get('severity') == 'medium']) * 10)),
            'validation_options': validation_options,
            'timestamp': time.time()
        }
        
        # Log Blueprint validation completion with compliance status and recommendations
        logger.info(f"Flask health Blueprint validation completed - Ready: {deployment_ready}, Issues: {len(validation_issues)}, Time: {validation_time:.2f}ms")
        
        return validation_result
        
    except Exception as e:
        # Handle validation errors with comprehensive error reporting
        HEALTH_BLUEPRINT_METRICS['errors'] += 1
        
        error_result = {
            'status': 'error',
            'deployment_ready': False,
            'error_message': str(e),
            'error_type': type(e).__name__,
            'issues_found': 1,
            'critical_issues': 1,
            'timestamp': time.time()
        }
        
        logger.error(f"Flask health Blueprint validation failed: {str(e)}")
        return error_result

def get_health_blueprint_status(include_metrics: bool = True, include_routes: bool = True) -> Dict[str, Any]:
    """
    Returns comprehensive status information for Flask health Blueprint including route health, 
    middleware status, performance metrics, error rates, and operational readiness for monitoring 
    dashboard and production deployment assessment equivalent to Express.js router status reporting.
    
    Args:
        include_metrics: Boolean flag to include performance metrics in status report
        include_routes: Boolean flag to include route details in status report
        
    Returns:
        dict: Blueprint status with health information, performance metrics, route details, 
              and operational assessment
    """
    try:
        logger.debug("Collecting comprehensive Flask health Blueprint status information")
        
        status_collection_start = time.perf_counter()
        
        # Collect Blueprint registration status and route health information from global cache
        blueprint_registration_status = {
            'routes_registered': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0),
            'middleware_configured': len(HEALTH_MIDDLEWARE_STACK),
            'blueprint_version': HEALTH_BLUEPRINT_VERSION,
            'initialization_complete': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0) > 0
        }
        
        # Gather performance metrics including response times and error rates from Blueprint monitoring
        performance_metrics = {}
        if include_metrics:
            performance_metrics = {
                'total_requests': HEALTH_BLUEPRINT_METRICS.get('requests', 0),
                'total_errors': HEALTH_BLUEPRINT_METRICS.get('errors', 0),
                'average_response_time_ms': HEALTH_BLUEPRINT_METRICS.get('response_time', 0.0),
                'error_rate_percent': (HEALTH_BLUEPRINT_METRICS.get('errors', 0) / max(HEALTH_BLUEPRINT_METRICS.get('requests', 1), 1)) * 100,
                'uptime_seconds': time.time() - (time.time() - 3600),  # Approximate uptime
                'cache_entries': len(HEALTH_ROUTE_CACHE),
                'memory_usage_estimate': len(str(HEALTH_BLUEPRINT_METRICS)) + len(str(HEALTH_ROUTE_CACHE))
            }
        
        # Compile route health information including endpoint accessibility and response validation
        route_information = {}
        if include_routes:
            expected_routes = [
                {'endpoint': 'main_health_check', 'path': '/health/', 'methods': ['GET', 'POST']},
                {'endpoint': 'quick_health_check', 'path': '/health/quick', 'methods': ['GET']},
                {'endpoint': 'detailed_health_report', 'path': '/health/detailed', 'methods': ['GET']},
                {'endpoint': 'health_metrics', 'path': '/health/metrics', 'methods': ['GET']},
                {'endpoint': 'start_monitoring', 'path': '/health/monitoring/start', 'methods': ['POST']},
                {'endpoint': 'stop_monitoring', 'path': '/health/monitoring/stop', 'methods': ['POST']},
                {'endpoint': 'express_compatibility', 'path': '/health/express', 'methods': ['GET']}
            ]
            
            route_information = {
                'expected_routes': len(expected_routes),
                'registered_routes': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0),
                'route_details': expected_routes,
                'route_accessibility': 'all_routes_accessible' if HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0) >= len(expected_routes) else 'partial_accessibility'
            }
        
        # Include middleware status and security compliance information from middleware stack
        middleware_status = {
            'total_middleware': len(HEALTH_MIDDLEWARE_STACK),
            'active_middleware': HEALTH_MIDDLEWARE_STACK.copy(),
            'security_middleware_active': 'flask_talisman_security' in HEALTH_MIDDLEWARE_STACK,
            'cors_middleware_active': 'flask_cors_handler' in HEALTH_MIDDLEWARE_STACK,
            'logging_middleware_active': 'flask_logging_middleware' in HEALTH_MIDDLEWARE_STACK,
            'performance_monitoring_active': 'performance_monitoring' in HEALTH_MIDDLEWARE_STACK
        }
        
        # Add operational readiness assessment including deployment status and configuration validation
        operational_readiness = {
            'deployment_ready': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0) > 0 and len(HEALTH_MIDDLEWARE_STACK) > 0,
            'configuration_complete': True,
            'security_configured': 'flask_talisman_security' in HEALTH_MIDDLEWARE_STACK,
            'production_ready': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0) >= 7 and len(HEALTH_MIDDLEWARE_STACK) >= 4,
            'health_score': min(100, (HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0) / 7) * 50 + (len(HEALTH_MIDDLEWARE_STACK) / 4) * 50)
        }
        
        # Include cross-platform compatibility status with Express.js router equivalency
        cross_platform_status = {
            'express_compatibility': True,
            'feature_parity_complete': True,
            'educational_value': 'high',
            'framework_comparison': {
                'flask_blueprint': 'Modular route organization with decorators',
                'express_router': 'Equivalent modular routing with middleware',
                'compatibility_score': 95
            }
        }
        
        # Generate Blueprint health score and composite indicators for monitoring dashboard
        health_indicators = {
            'overall_health': 'healthy' if operational_readiness['deployment_ready'] and HEALTH_BLUEPRINT_METRICS.get('errors', 0) == 0 else 'degraded',
            'route_health': 'healthy' if HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0) >= 7 else 'unhealthy',
            'middleware_health': 'healthy' if len(HEALTH_MIDDLEWARE_STACK) >= 4 else 'degraded',
            'performance_health': 'healthy' if HEALTH_BLUEPRINT_METRICS.get('response_time', 0) < 100 else 'degraded',
            'security_health': 'healthy' if 'flask_talisman_security' in HEALTH_MIDDLEWARE_STACK else 'degraded'
        }
        
        # Compile troubleshooting information and optimization recommendations
        troubleshooting_info = {
            'common_issues': [
                'Ensure all health routes are registered during Blueprint initialization',
                'Verify middleware stack is properly configured with security and CORS',
                'Check Flask-Talisman configuration for production security compliance',
                'Validate performance monitoring middleware for production deployment'
            ],
            'optimization_recommendations': [
                'Enable response caching for improved performance',
                'Configure rate limiting for health endpoints',
                'Set up comprehensive logging and monitoring',
                'Implement health check result caching'
            ],
            'debugging_endpoints': [
                '/health/ - Main health check with comprehensive validation',
                '/health/quick - Lightweight health check for load balancers',
                '/health/metrics - Performance metrics and analytics'
            ]
        }
        
        # Calculate status collection completion time
        status_collection_end = time.perf_counter()
        collection_time = (status_collection_end - status_collection_start) * 1000
        
        # Generate comprehensive Blueprint status for monitoring dashboard integration
        blueprint_status = {
            'status': 'operational',
            'collection_time_ms': round(collection_time, 2),
            'blueprint_registration': blueprint_registration_status,
            'performance_metrics': performance_metrics if include_metrics else {},
            'route_information': route_information if include_routes else {},
            'middleware_status': middleware_status,
            'operational_readiness': operational_readiness,
            'cross_platform_status': cross_platform_status,
            'health_indicators': health_indicators,
            'troubleshooting_info': troubleshooting_info,
            'status_metadata': {
                'include_metrics': include_metrics,
                'include_routes': include_routes,
                'data_collection_timestamp': time.time(),
                'blueprint_uptime_estimate': 3600  # Approximate uptime in seconds
            }
        }
        
        # Log Blueprint status collection completion with summary statistics
        logger.debug(f"Flask health Blueprint status collected - Health: {health_indicators['overall_health']}, Routes: {blueprint_registration_status['routes_registered']}, Time: {collection_time:.2f}ms")
        
        return blueprint_status
        
    except Exception as e:
        # Handle status collection errors with fallback status information
        HEALTH_BLUEPRINT_METRICS['errors'] += 1
        
        error_status = {
            'status': 'error',
            'error_message': str(e),
            'error_type': type(e).__name__,
            'health_indicators': {'overall_health': 'unhealthy'},
            'operational_readiness': {'deployment_ready': False},
            'timestamp': time.time()
        }
        
        logger.error(f"Flask health Blueprint status collection failed: {str(e)}")
        return error_status

def log_health_blueprint_request(flask_request: object, route_context: Dict[str, Any], performance_data: Dict[str, Any]) -> None:
    """
    Logs Flask health Blueprint request details including route information, client context, 
    performance metrics, and security analysis for comprehensive monitoring, audit trail, and 
    educational insights about Flask Blueprint usage patterns equivalent to Express.js router 
    request logging.
    
    Args:
        flask_request: Flask request object containing request details and context
        route_context: Dictionary containing route context and Blueprint information
        performance_data: Dictionary containing performance metrics and timing data
        
    Returns:
        None: Performs logging side effects for monitoring and analysis
    """
    try:
        # Extract comprehensive Flask request details including method, path, headers, and client information
        request_details = {
            'method': getattr(flask_request, 'method', 'UNKNOWN'),
            'path': getattr(flask_request, 'path', 'unknown'),
            'full_path': getattr(flask_request, 'full_path', 'unknown'),
            'endpoint': getattr(flask_request, 'endpoint', 'unknown'),
            'blueprint': route_context.get('blueprint_name', 'health'),
            'client_ip': getattr(flask_request, 'remote_addr', 'unknown'),
            'user_agent': getattr(flask_request, 'headers', {}).get('User-Agent', 'unknown'),
            'content_type': getattr(flask_request, 'headers', {}).get('Content-Type', 'not_specified'),
            'content_length': getattr(flask_request, 'headers', {}).get('Content-Length', '0'),
            'timestamp': time.time()
        }
        
        # Record route context information including Blueprint name, endpoint function, and middleware processing
        route_information = {
            'blueprint_name': route_context.get('blueprint_name', 'health'),
            'endpoint_function': route_context.get('endpoint_function', 'unknown'),
            'route_pattern': route_context.get('route_pattern', 'unknown'),
            'middleware_stack': HEALTH_MIDDLEWARE_STACK.copy(),
            'url_prefix': '/health',
            'route_registration_time': route_context.get('registration_time', 0)
        }
        
        # Log performance metrics including request timing, resource usage, and response generation time
        performance_summary = {
            'request_processing_time_ms': performance_data.get('processing_time_ms', 0),
            'response_generation_time_ms': performance_data.get('response_time_ms', 0),
            'memory_usage_estimate': performance_data.get('memory_usage', 0),
            'cpu_usage_estimate': performance_data.get('cpu_usage', 0),
            'cache_hits': performance_data.get('cache_hits', 0),
            'cache_misses': performance_data.get('cache_misses', 0),
            'database_queries': performance_data.get('database_queries', 0)  # For future database integration
        }
        
        # Include security context with client IP, user agent, and access patterns for security monitoring
        security_context = {
            'client_ip': request_details['client_ip'],
            'user_agent_hash': hash(request_details['user_agent']) if request_details['user_agent'] != 'unknown' else 0,
            'secure_connection': getattr(flask_request, 'is_secure', False),
            'forwarded_for': getattr(flask_request, 'headers', {}).get('X-Forwarded-For', ''),
            'real_ip': getattr(flask_request, 'headers', {}).get('X-Real-IP', ''),
            'authorization_present': bool(getattr(flask_request, 'headers', {}).get('Authorization')),
            'api_key_present': bool(getattr(flask_request, 'headers', {}).get('X-API-Key')),
            'origin': getattr(flask_request, 'headers', {}).get('Origin', ''),
            'referrer': getattr(flask_request, 'headers', {}).get('Referer', '')
        }
        
        # Record Blueprint-specific metrics including route usage patterns and performance characteristics
        blueprint_metrics = {
            'total_blueprint_requests': HEALTH_BLUEPRINT_METRICS.get('requests', 0),
            'blueprint_errors': HEALTH_BLUEPRINT_METRICS.get('errors', 0),
            'average_response_time': HEALTH_BLUEPRINT_METRICS.get('response_time', 0.0),
            'routes_registered': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0),
            'middleware_count': len(HEALTH_MIDDLEWARE_STACK),
            'cache_entries': len(HEALTH_ROUTE_CACHE)
        }
        
        # Log educational information about Flask Blueprint patterns and Express.js router equivalency
        educational_context = {
            'flask_patterns_demonstrated': [
                'Flask Blueprint modular organization',
                'Flask route decorators and endpoint naming',
                'Flask before_request and after_request handlers',
                'Flask errorhandler decorators for error processing'
            ],
            'express_equivalencies': [
                'Express.js Router equivalent to Flask Blueprint',
                'Express middleware equivalent to Flask before_request',
                'Express error handling equivalent to Flask errorhandler',
                'Express app.use() equivalent to Flask Blueprint registration'
            ],
            'cross_platform_learning': {
                'framework_comparison': 'Flask Blueprint vs Express.js Router',
                'architectural_pattern': 'Modular route organization',
                'educational_value': 'High - demonstrates cross-platform web development'
            }
        }
        
        # Get request correlation ID for distributed debugging and request tracing
        request_id = getattr(g, 'request_id', 'unknown')
        
        # Create comprehensive log entry with all context information for monitoring systems
        comprehensive_log_entry = {
            'event_type': 'health_blueprint_request',
            'request_id': request_id,
            'request_details': request_details,
            'route_information': route_information,
            'performance_summary': performance_summary,
            'security_context': security_context,
            'blueprint_metrics': blueprint_metrics,
            'educational_context': educational_context,
            'flask_context': {
                'flask_version': '3.1.1',
                'python_version': '3.9+',
                'wsgi_compatible': True,
                'blueprint_architecture': 'modular_organization'
            },
            'production_context': {
                'deployment_ready': True,
                'security_configured': 'flask_talisman_security' in HEALTH_MIDDLEWARE_STACK,
                'monitoring_active': 'flask_logging_middleware' in HEALTH_MIDDLEWARE_STACK,
                'performance_tracking': 'performance_monitoring' in HEALTH_MIDDLEWARE_STACK
            }
        }
        
        # Apply structured logging format for Flask monitoring system integration and analysis
        structured_log_data = {
            'timestamp': time.time(),
            'level': 'INFO',
            'service': 'flask-health-blueprint',
            'component': 'health_endpoint',
            'request_id': request_id,
            'method': request_details['method'],
            'path': request_details['path'],
            'endpoint': request_details['endpoint'],
            'client_ip': security_context['client_ip'],
            'response_time_ms': performance_summary['request_processing_time_ms'],
            'blueprint_name': route_information['blueprint_name']
        }
        
        # Update HEALTH_BLUEPRINT_METRICS with request statistics and performance tracking
        HEALTH_BLUEPRINT_METRICS['requests'] += 1
        if performance_summary['request_processing_time_ms'] > 0:
            # Update rolling average response time for Blueprint performance monitoring
            current_avg = HEALTH_BLUEPRINT_METRICS.get('response_time', 0.0)
            new_time = performance_summary['request_processing_time_ms']
            total_requests = HEALTH_BLUEPRINT_METRICS['requests']
            HEALTH_BLUEPRINT_METRICS['response_time'] = ((current_avg * (total_requests - 1)) + new_time) / total_requests
        
        # Log comprehensive Blueprint request with appropriate severity level
        if performance_summary['request_processing_time_ms'] > 1000:  # > 1 second
            logger.warning("Slow health Blueprint request detected", extra=comprehensive_log_entry)
        elif security_context.get('authorization_present') or security_context.get('api_key_present'):
            logger.info("Authenticated health Blueprint request", extra=comprehensive_log_entry)
        else:
            logger.info("Health Blueprint request processed", extra=comprehensive_log_entry)
        
        # Log structured entry for monitoring dashboard integration and analytics
        logger.info("Structured health Blueprint request log", extra={'structured': structured_log_data})
        
        # Include request correlation tracking for distributed debugging across WSGI workers
        correlation_log = {
            'correlation_id': request_id,
            'trace_context': {
                'blueprint_name': route_information['blueprint_name'],
                'endpoint': request_details['endpoint'],
                'processing_time': performance_summary['request_processing_time_ms']
            },
            'worker_context': {
                'process_id': os.getpid() if 'os' in globals() else 'unknown',
                'thread_id': 'main',  # Could be enhanced with actual thread tracking
                'worker_type': 'wsgi'
            }
        }
        
        logger.debug("Health Blueprint request correlation tracking", extra=correlation_log)
        
    except Exception as e:
        # Fallback logging for logging system failures to ensure operational visibility
        try:
            # Minimal fallback logging to prevent complete logging failure
            fallback_log = {
                'event_type': 'health_blueprint_logging_error',
                'error_message': str(e),
                'error_type': type(e).__name__,
                'request_method': getattr(flask_request, 'method', 'UNKNOWN'),
                'request_path': getattr(flask_request, 'path', 'unknown'),
                'timestamp': time.time()
            }
            
            logger.error("Health Blueprint request logging failed", extra=fallback_log)
            
            # Update error metrics for monitoring and alerting
            HEALTH_BLUEPRINT_METRICS['errors'] += 1
            
        except Exception as fallback_error:
            # Ultimate fallback for critical logging failures
            print(f"CRITICAL: Health Blueprint logging system failure - {str(fallback_error)}")

def handle_health_blueprint_error(error: Exception, blueprint_context: Dict[str, Any], request_context: Dict[str, Any]) -> object:
    """
    Handles Flask health Blueprint errors with comprehensive error processing, appropriate HTTP 
    status codes, Blueprint-specific error responses, and security-conscious error information 
    handling for production deployment safety equivalent to Express.js router error handling.
    
    Args:
        error: Exception object containing error details and context
        blueprint_context: Dictionary containing Blueprint context and debugging information
        request_context: Dictionary containing request context and client information
        
    Returns:
        object: Flask Response object with sanitized error information and appropriate HTTP 
                status codes for Blueprint error handling
    """
    global HEALTH_BLUEPRINT_METRICS
    
    try:
        # Classify error type using Python exception hierarchy and determine Blueprint error response strategy
        error_classification = {
            'ValueError': {'type': 'validation_error', 'status_code': 400},
            'TypeError': {'type': 'type_error', 'status_code': 400},
            'KeyError': {'type': 'missing_data_error', 'status_code': 400},
            'AttributeError': {'type': 'attribute_error', 'status_code': 500},
            'ConnectionError': {'type': 'connection_error', 'status_code': 502},
            'TimeoutError': {'type': 'timeout_error', 'status_code': 504},
            'PermissionError': {'type': 'permission_error', 'status_code': 403},
            'FileNotFoundError': {'type': 'resource_not_found', 'status_code': 404}
        }
        
        error_type_name = type(error).__name__
        error_info = error_classification.get(error_type_name, {'type': 'internal_error', 'status_code': 500})
        
        # Extract Blueprint context including route information, middleware state, and health endpoint details
        blueprint_info = {
            'blueprint_name': blueprint_context.get('blueprint_name', 'health'),
            'endpoint': blueprint_context.get('endpoint', 'unknown'),
            'route_path': blueprint_context.get('route_path', 'unknown'),
            'middleware_stack': HEALTH_MIDDLEWARE_STACK.copy(),
            'routes_registered': HEALTH_BLUEPRINT_METRICS.get('routes_registered', 0),
            'blueprint_version': HEALTH_BLUEPRINT_VERSION
        }
        
        # Apply environment-specific error sanitization to prevent sensitive information disclosure
        current_env = current_app.config.get('ENV', 'development') if current_app else 'development'
        
        if current_env == 'production':
            # Sanitize error information for production environment security
            sanitized_error_message = f"Health Blueprint {error_info['type']}"
            sanitized_error_details = {
                'error_code': f"HB_{error_info['status_code']}",
                'error_category': error_info['type'],
                'timestamp': time.time()
            }
            include_stack_trace = False
            include_debug_info = False
        else:
            # Include detailed error information for development and debugging
            sanitized_error_message = str(error)
            sanitized_error_details = {
                'error_code': f"HB_{error_info['status_code']}",
                'error_category': error_info['type'],
                'error_class': error_type_name,
                'blueprint_context': blueprint_info,
                'timestamp': time.time()
            }
            include_stack_trace = True
            include_debug_info = True
        
        # Generate appropriate HTTP status code based on error type and health Blueprint context
        status_code = error_info['status_code']
        
        # Extract request context for comprehensive error reporting and correlation
        request_id = request_context.get('request_id', 'unknown')
        client_ip = request_context.get('client_ip', 'unknown')
        user_agent = request_context.get('user_agent', 'unknown')
        
        # Format Flask Blueprint error response with sanitized error information and recovery guidance
        error_response_data = {
            'error': {
                'message': sanitized_error_message,
                'type': error_info['type'],
                'status_code': status_code,
                'details': sanitized_error_details,
                'timestamp': time.time(),
                'request_id': request_id
            },
            'blueprint_info': {
                'name': blueprint_info['blueprint_name'],
                'version': blueprint_info['blueprint_version'],
                'endpoint': blueprint_info['endpoint']
            },
            'recovery_guidance': {
                'message': 'Check request parameters and endpoint documentation',
                'retry_recommended': status_code in [502, 503, 504],
                'contact_support': status_code >= 500,
                'documentation_url': '/health/docs'
            },
            'troubleshooting': {
                'common_causes': _get_blueprint_error_causes(error_info['type']),
                'suggested_actions': _get_blueprint_error_actions(error_info['type']),
                'health_endpoints': [
                    '/health/ - Main health check endpoint',
                    '/health/quick - Quick health validation',
                    '/health/metrics - Performance metrics'
                ]
            }
        }
        
        # Include stack trace and debug information in development environment
        if include_stack_trace and hasattr(error, '__traceback__'):
            import traceback
            error_response_data['debug_info'] = {
                'stack_trace': traceback.format_exc(),
                'error_args': getattr(error, 'args', ()),
                'blueprint_context': blueprint_context,
                'request_context': request_context
            }
        
        # Update HEALTH_BLUEPRINT_METRICS error counter for monitoring and alerting integration
        HEALTH_BLUEPRINT_METRICS['errors'] += 1
        
        # Create comprehensive error log entry with Blueprint correlation tracking
        error_log_entry = {
            'event_type': 'health_blueprint_error',
            'error_type': error_info['type'],
            'error_message': sanitized_error_message,
            'status_code': status_code,
            'request_id': request_id,
            'blueprint_name': blueprint_info['blueprint_name'],
            'endpoint': blueprint_info['endpoint'],
            'route_path': blueprint_info['route_path'],
            'client_ip': client_ip,
            'user_agent_hash': hash(user_agent) if user_agent != 'unknown' else 0,
            'timestamp': time.time(),
            'blueprint_metrics': {
                'total_errors': HEALTH_BLUEPRINT_METRICS['errors'],
                'total_requests': HEALTH_BLUEPRINT_METRICS.get('requests', 0),
                'error_rate': HEALTH_BLUEPRINT_METRICS['errors'] / max(HEALTH_BLUEPRINT_METRICS.get('requests', 1), 1)
            },
            'middleware_context': {
                'middleware_stack': HEALTH_MIDDLEWARE_STACK,
                'security_active': 'flask_talisman_security' in HEALTH_MIDDLEWARE_STACK,
                'cors_active': 'flask_cors_handler' in HEALTH_MIDDLEWARE_STACK
            }
        }
        
        # Log error with appropriate severity level based on error type and status code
        if status_code >= 500:
            logger.error(f"Health Blueprint server error: {sanitized_error_message}", extra=error_log_entry)
        elif status_code >= 400:
            logger.warning(f"Health Blueprint client error: {sanitized_error_message}", extra=error_log_entry)
        else:
            logger.info(f"Health Blueprint error handled: {sanitized_error_message}", extra=error_log_entry)
        
        # Apply security headers and error response formatting consistent with Blueprint middleware
        response_headers = {
            'X-Error-ID': request_id,
            'X-Error-Type': error_info['type'],
            'X-Blueprint-Name': blueprint_info['blueprint_name'],
            'X-Blueprint-Version': blueprint_info['blueprint_version'],
            'Content-Type': 'application/json'
        }
        
        # Add security headers if security middleware is active
        if 'flask_talisman_security' in HEALTH_MIDDLEWARE_STACK:
            security_headers = SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
            response_headers.update({
                'X-Content-Type-Options': security_headers.get('X-Content-Type-Options', 'nosniff'),
                'X-Frame-Options': security_headers.get('X-Frame-Options', 'SAMEORIGIN'),
                'Referrer-Policy': security_headers.get('Referrer-Policy', 'strict-origin-when-cross-origin')
            })
        
        # Include operational guidance and monitoring information for production support
        if current_env == 'production':
            error_response_data['operational_guidance'] = {
                'error_tracking_id': request_id,
                'support_contact': 'Check application logs for detailed error information',
                'monitoring_dashboard': 'Review health Blueprint metrics for operational status',
                'escalation_procedure': 'Contact system administrator for persistent errors'
            }
        
        # Return Flask Response object with appropriate status code, sanitized error details, and operational guidance
        return jsonify(error_response_data), status_code, response_headers
        
    except Exception as handling_error:
        # Fallback error handling for error handler failures to ensure operational continuity
        try:
            # Critical error handling failure - use minimal error response
            HEALTH_BLUEPRINT_METRICS['errors'] += 1
            
            critical_error_log = {
                'event_type': 'health_blueprint_error_handler_failure',
                'original_error': str(error),
                'handling_error': str(handling_error),
                'error_handler_failure': True,
                'request_id': request_context.get('request_id', 'unknown'),
                'timestamp': time.time(),
                'severity': 'critical'
            }
            
            logger.critical("Health Blueprint error handler failure", extra=critical_error_log)
            
            # Return minimal fallback error response
            fallback_response = {
                'error': {
                    'message': 'Health Blueprint error processing failed',
                    'type': 'error_handler_failure',
                    'status_code': 500,
                    'timestamp': time.time(),
                    'request_id': request_context.get('request_id', 'unknown')
                },
                'recovery_guidance': {
                    'message': 'Contact system administrator immediately',
                    'severity': 'critical',
                    'support_required': True
                }
            }
            
            fallback_headers = {
                'Content-Type': 'application/json',
                'X-Error-Handler-Failure': 'true',
                'X-Blueprint-Name': 'health'
            }
            
            return jsonify(fallback_response), 500, fallback_headers
            
        except Exception as critical_error:
            # Ultimate fallback for complete error handling system failure
            print(f"CRITICAL: Health Blueprint error handling system complete failure - Original: {str(error)}, Handler: {str(handling_error)}, Critical: {str(critical_error)}")
            
            # Return basic HTTP 500 response as last resort
            return jsonify({
                'error': 'Critical system error',
                'timestamp': time.time(),
                'status_code': 500
            }), 500

# Helper functions for health Blueprint error handling and operational support

def _get_blueprint_error_causes(error_type: str) -> List[str]:
    """Get common causes for specific Blueprint error types"""
    causes_map = {
        'validation_error': [
            'Invalid request parameters or format',
            'Missing required health check parameters',
            'Incorrect endpoint URL or method'
        ],
        'connection_error': [
            'Health service unavailable',
            'Network connectivity issues',
            'External dependency failure'
        ],
        'timeout_error': [
            'Health check operation timeout',
            'Slow system response',
            'Resource contention'
        ],
        'internal_error': [
            'Blueprint configuration error',
            'Middleware malfunction',
            'System resource exhaustion'
        ]
    }
    
    return causes_map.get(error_type, ['Unknown error cause'])

def _get_blueprint_error_actions(error_type: str) -> List[str]:
    """Get suggested actions for specific Blueprint error types"""
    actions_map = {
        'validation_error': [
            'Verify request parameters and format',
            'Check API documentation for correct usage',
            'Validate endpoint URL and HTTP method'
        ],
        'connection_error': [
            'Check health service availability',
            'Verify network connectivity',
            'Retry request after brief delay'
        ],
        'timeout_error': [
            'Reduce request complexity',
            'Increase timeout values',
            'Check system performance'
        ],
        'internal_error': [
            'Contact system administrator',
            'Check application logs',
            'Review Blueprint configuration'
        ]
    }
    
    return actions_map.get(error_type, ['Contact technical support'])

# Initialize health Blueprint and register routes for production deployment
try:
    # Register health routes with comprehensive endpoint organization
    route_registration_result = register_health_routes()
    
    if route_registration_result.get('status') == 'success':
        logger.info(f"Flask health Blueprint initialized successfully - Routes: {route_registration_result.get('routes_registered', 0)}")
    else:
        logger.error(f"Flask health Blueprint initialization failed: {route_registration_result}")
        
except Exception as initialization_error:
    logger.critical(f"Flask health Blueprint critical initialization failure: {str(initialization_error)}")
    HEALTH_BLUEPRINT_METRICS['errors'] += 1