"""
Flask Mock HTTP Response Fixtures Module - Comprehensive Testing Framework

This module provides comprehensive mock HTTP response fixtures for Flask application testing
with standardized response objects for all API endpoints including /hello, /good-evening,
and /health. Implements complete feature parity with Express.js mock responses including
success responses, error responses, security scenarios, performance test responses, and
cross-platform compatibility validation.

Designed for pytest testing framework with consistent mock data for unit testing, integration
testing, security testing (Flask-Talisman equivalent to Helmet.js), and production deployment
validation. Features educational response examples demonstrating proper HTTP status codes,
security headers, JSON formatting, Flask response patterns, and error handling equivalent
to Express.js patterns for cross-platform educational comparison.

Educational Focus:
- Flask vs Express.js cross-platform compatibility testing and validation
- Flask-Talisman security testing equivalent to Helmet.js security middleware
- pytest framework integration with comprehensive Flask testing scenarios
- Production deployment testing with Flask WSGI performance characteristics
- Educational comparison between Flask and Express.js response patterns

Features:
- Comprehensive mock responses for all Flask API endpoints with complete test coverage
- Flask-Talisman security header validation equivalent to Helmet.js protection
- Cross-platform compatibility testing with Express.js response format validation
- Performance testing responses with Flask WSGI timing and resource usage metrics
- Error handling validation with comprehensive HTTP error scenarios and Flask patterns
- Educational content for Flask vs Express.js framework comparison and learning

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import datetime  # built-in - Date and time utilities for timestamps in mock responses
import uuid  # built-in - UUID generation for unique request identifiers and correlation IDs
import json  # built-in - JSON processing for mock response serialization and validation
import copy  # built-in - Deep copying utilities for creating immutable mock responses
import time  # built-in - High-resolution timing utilities for performance mock responses

# Internal imports for Flask configuration and constants integration
from ...utils.constants import (
    HTTP_CONSTANTS,  # HTTP protocol constants for creating realistic mock responses
    API_CONSTANTS,   # API constants for generating realistic mock responses
    SECURITY_CONSTANTS,  # Security constants for Flask-Talisman mock response generation
    EXPRESS_CONSTANTS    # Express.js compatibility constants for cross-platform testing
)

# Import logger for mock response generation tracking and debugging
from ...utils.logger import logger

# Global constants for Flask mock response configuration and management
MOCK_RESPONSES_VERSION = '1.0.0'
FLASK_MOCK_CACHE = dict()
EXPRESS_COMPATIBILITY_CACHE = dict()
RESPONSE_TEMPLATES = dict()
MOCK_METADATA = {'timestamp': time.time(), 'framework': 'Flask'}

# Mock implementations for missing test_data functions to maintain compatibility
def get_api_endpoint_data(endpoint: str, options: dict = None) -> dict:
    """
    Mock implementation for API endpoint test data generation.
    Generates realistic test data for Flask API endpoints based on endpoint type.
    """
    options = options or {}
    base_data = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'endpoint': endpoint,
        'framework': 'Flask',
        'version': MOCK_RESPONSES_VERSION
    }
    
    if endpoint == '/hello':
        base_data.update({
            'message': 'Hello world',
            'greeting_type': 'hello',
            'response_data': {'greeting': 'Hello world', 'timestamp': base_data['timestamp']}
        })
    elif endpoint == '/good-evening':
        base_data.update({
            'message': 'Good evening',
            'greeting_type': 'evening',
            'response_data': {'greeting': 'Good evening', 'timestamp': base_data['timestamp']}
        })
    elif endpoint == '/health':
        base_data.update({
            'status': 'healthy',
            'uptime': time.time(),
            'response_data': {
                'status': 'healthy',
                'timestamp': base_data['timestamp'],
                'uptime_seconds': time.time()
            }
        })
    
    return base_data

def get_security_test_data(security_type: str, options: dict = None) -> dict:
    """
    Mock implementation for security test data generation.
    Generates Flask-Talisman security testing data equivalent to Helmet.js.
    """
    options = options or {}
    security_data = {
        'security_type': security_type,
        'framework': 'Flask',
        'talisman_equivalent': True,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    if security_type == 'csp_violation':
        security_data.update({
            'violation_type': 'Content Security Policy',
            'blocked_uri': 'inline',
            'directive': 'script-src'
        })
    elif security_type == 'xss_attempt':
        security_data.update({
            'attack_type': 'Cross-Site Scripting',
            'blocked_content': '<script>alert("xss")</script>',
            'protection_method': 'Flask-Talisman'
        })
    elif security_type == 'hsts_enforcement':
        security_data.update({
            'security_mechanism': 'HTTP Strict Transport Security',
            'max_age': 31536000,
            'include_subdomains': True
        })
    
    return security_data

def get_cross_platform_test_data(platform: str, options: dict = None) -> dict:
    """
    Mock implementation for cross-platform test data generation.
    Generates Flask vs Express.js compatibility validation data.
    """
    options = options or {}
    platform_data = {
        'platform': platform,
        'comparison_framework': 'Express.js' if platform == 'Flask' else 'Flask',
        'compatibility_version': MOCK_RESPONSES_VERSION,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    if platform == 'Flask':
        platform_data.update({
            'features': ['WSGI', 'Flask-Talisman', 'Werkzeug', 'Jinja2'],
            'deployment': 'Gunicorn/uWSGI',
            'testing_framework': 'pytest'
        })
    elif platform == 'Express.js':
        platform_data.update({
            'features': ['Node.js', 'Helmet.js', 'Express Router', 'EJS'],
            'deployment': 'PM2/Forever',
            'testing_framework': 'Jest/Mocha'
        })
    
    return platform_data


def create_mock_response(response_config: dict, options: dict = None) -> dict:
    """
    Factory function for creating standardized Flask mock HTTP response objects with proper
    status codes, headers, JSON body content, and metadata for comprehensive testing scenarios
    across all Flask API endpoints. Maintains compatibility with Express.js mock response format
    for cross-platform educational comparison.
    
    Args:
        response_config: Configuration dictionary with status, headers, data, and metadata
        options: Additional options for response customization and framework compatibility
        
    Returns:
        Standardized Flask mock response object with status, headers, data, and metadata properties
    """
    # Initialize Flask response object with status code, headers, and JSON data structure
    options = options or {}
    correlation_id = str(uuid.uuid4())
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    mock_response = {
        'status_code': response_config.get('status_code', 200),
        'headers': {},
        'data': response_config.get('data', {}),
        'metadata': {
            'correlation_id': correlation_id,
            'timestamp': timestamp,
            'framework': 'Flask',
            'version': MOCK_RESPONSES_VERSION,
            'mock_type': 'flask_test_response'
        }
    }
    
    # Apply Flask-Talisman security headers using SECURITY_CONSTANTS for comprehensive protection
    security_headers = SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
    mock_response['headers'].update(security_headers)
    
    # Format response data using Flask JSON response patterns for consistency
    content_type = HTTP_CONSTANTS.get('CONTENT_TYPES', {}).get('JSON', 'application/json')
    mock_response['headers']['Content-Type'] = content_type
    
    # Add request metadata including timestamp, correlation ID, and Flask-specific tracking
    mock_response['headers']['X-Correlation-ID'] = correlation_id
    mock_response['headers']['X-Framework'] = 'Flask'
    mock_response['headers']['X-Mock-Version'] = MOCK_RESPONSES_VERSION
    
    # Include performance metrics and timing information for Flask performance testing
    if options.get('include_performance', True):
        mock_response['metadata']['performance'] = {
            'response_time_ms': options.get('response_time_ms', 50),
            'memory_usage_mb': options.get('memory_usage_mb', 25),
            'cpu_usage_percent': options.get('cpu_usage_percent', 5)
        }
    
    # Add educational metadata for tutorial learning and cross-platform comparison
    if options.get('educational_mode', True):
        mock_response['metadata']['educational'] = {
            'flask_patterns': True,
            'express_compatibility': True,
            'security_demonstration': True,
            'learning_objectives': response_config.get('learning_objectives', [])
        }
    
    # Cache response object in FLASK_MOCK_CACHE for efficient reuse and performance optimization
    cache_key = f"{response_config.get('endpoint', 'unknown')}_{correlation_id}"
    FLASK_MOCK_CACHE[cache_key] = copy.deepcopy(mock_response)
    
    logger.debug("Mock response created", {
        'correlation_id': correlation_id,
        'status_code': mock_response['status_code'],
        'endpoint': response_config.get('endpoint', 'unknown')
    })
    
    # Return standardized Flask mock response object ready for pytest fixture integration
    return mock_response


def generate_variation_responses(endpoint: str, base_response: dict, variation_config: dict) -> dict:
    """
    Generates multiple Flask response variations for a single endpoint including success cases,
    error scenarios, edge cases, and boundary conditions for comprehensive test coverage and
    validation. Creates Flask-specific response variations maintaining Express.js compatibility
    for educational comparison.
    
    Args:
        endpoint: API endpoint path for variation generation
        base_response: Base response object for variation creation
        variation_config: Configuration for variation types and scenarios
        
    Returns:
        Collection of Flask response variations with different scenarios and content
    """
    variations = {}
    
    # Create base success response variation with standard 200 status code and Flask JSON formatting
    variations['success'] = copy.deepcopy(base_response)
    variations['success']['status_code'] = HTTP_CONSTANTS.get('STATUS_CODES', {}).get('OK', 200)
    variations['success']['metadata']['variation_type'] = 'success'
    
    # Generate Flask-specific error response variations with 4xx and 5xx status codes
    error_codes = [400, 401, 403, 404, 405, 500, 502, 503]
    variations['errors'] = {}
    
    for error_code in error_codes:
        error_response = copy.deepcopy(base_response)
        error_response['status_code'] = error_code
        error_response['data'] = {
            'error': True,
            'error_code': error_code,
            'message': HTTP_CONSTANTS.get('STATUS_MESSAGES', {}).get(error_code, 'Unknown Error'),
            'endpoint': endpoint,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        error_response['metadata']['variation_type'] = 'error'
        error_response['metadata']['error_code'] = error_code
        variations['errors'][str(error_code)] = error_response
    
    # Create edge case responses including empty data, None values, and boundary conditions
    variations['edge_cases'] = {
        'empty_data': create_mock_response({
            'status_code': 200,
            'data': {},
            'endpoint': endpoint
        }),
        'null_response': create_mock_response({
            'status_code': 204,
            'data': None,
            'endpoint': endpoint
        }),
        'large_payload': create_mock_response({
            'status_code': 200,
            'data': {'large_data': 'x' * 1000},
            'endpoint': endpoint
        })
    }
    
    # Generate performance test responses with Flask timing information and WSGI metrics
    variations['performance'] = {
        'fast_response': create_mock_response({
            'status_code': 200,
            'data': base_response.get('data', {}),
            'endpoint': endpoint
        }, {'response_time_ms': 10, 'memory_usage_mb': 15}),
        'slow_response': create_mock_response({
            'status_code': 200,
            'data': base_response.get('data', {}),
            'endpoint': endpoint
        }, {'response_time_ms': 500, 'memory_usage_mb': 50})
    }
    
    # Create security test responses with Flask-Talisman header configurations
    variations['security'] = generate_security_variations(endpoint, base_response)
    
    # Generate cross-platform compatibility responses for Flask vs Express.js testing
    variations['cross_platform'] = {
        'flask_specific': create_mock_response({
            'status_code': 200,
            'data': dict(base_response.get('data', {}), **{'framework': 'Flask'}),
            'endpoint': endpoint
        }),
        'express_compatible': create_mock_response({
            'status_code': 200,
            'data': dict(base_response.get('data', {}), **{'framework': 'Express.js'}),
            'endpoint': endpoint
        })
    }
    
    logger.info("Response variations generated", {
        'endpoint': endpoint,
        'variation_count': sum(len(v) if isinstance(v, dict) else 1 for v in variations.values()),
        'variation_types': list(variations.keys())
    })
    
    return variations


def create_cross_platform_response(base_response: dict, platform: str, platform_options: dict) -> dict:
    """
    Creates platform-specific mock responses for Flask implementation ensuring identical response
    formats, status codes, headers, and content with Express.js implementation for cross-platform
    compatibility validation and educational demonstration of framework equivalence.
    
    Args:
        base_response: Base response object for platform-specific customization
        platform: Target platform identifier ('Flask' or 'Express.js')
        platform_options: Platform-specific configuration options
        
    Returns:
        Platform-specific Flask mock response with framework-appropriate formatting and metadata
    """
    # Clone base response object for Flask-specific customization maintaining data integrity
    platform_response = copy.deepcopy(base_response)
    
    # Apply Flask-specific header formatting and content type handling
    if platform == 'Flask':
        platform_response['headers']['Server'] = 'Flask/3.1.1'
        platform_response['headers']['X-Powered-By'] = 'Flask'
        platform_response['metadata']['platform'] = 'Flask'
        platform_response['metadata']['wsgi_server'] = platform_options.get('wsgi_server', 'Werkzeug')
        
        # Add Flask-Talisman security headers
        talisman_headers = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
        platform_response['headers'].update(talisman_headers.get('response_headers', {}))
        
    elif platform == 'Express.js':
        platform_response['headers']['Server'] = 'Express'
        platform_response['headers']['X-Powered-By'] = 'Express'
        platform_response['metadata']['platform'] = 'Express.js'
        platform_response['metadata']['node_version'] = platform_options.get('node_version', '18.x')
        
        # Add Helmet.js security headers for comparison
        helmet_headers = EXPRESS_CONSTANTS.get('HELMET_EQUIVALENT', {})
        platform_response['headers'].update(helmet_headers.get('security_headers', {}))
    
    # Adjust response timing and metadata for Flask performance characteristics
    if platform == 'Flask':
        platform_response['metadata']['deployment'] = {
            'server': 'Gunicorn',
            'workers': platform_options.get('workers', 4),
            'worker_class': 'sync'
        }
    
    # Add Flask-specific educational information including Flask-Talisman vs Helmet.js comparison
    platform_response['metadata']['educational_comparison'] = {
        'framework_comparison': f"{platform} vs {'Express.js' if platform == 'Flask' else 'Flask'}",
        'security_middleware': 'Flask-Talisman' if platform == 'Flask' else 'Helmet.js',
        'testing_framework': 'pytest' if platform == 'Flask' else 'Jest/Mocha',
        'deployment_method': 'WSGI' if platform == 'Flask' else 'Node.js'
    }
    
    # Ensure identical functional behavior between Flask and Express.js platforms
    compatibility_mapping = EXPRESS_CONSTANTS.get('COMPATIBILITY_MAPPING', {})
    if platform in compatibility_mapping:
        platform_response['metadata']['feature_parity'] = compatibility_mapping[platform]
    
    # Include platform comparison metadata for educational analysis
    platform_response['metadata']['cross_platform_validation'] = {
        'response_format_compatible': True,
        'status_code_identical': True,
        'headers_equivalent': True,
        'data_structure_matching': True
    }
    
    logger.info("Cross-platform response created", {
        'platform': platform,
        'compatibility_features': platform_response['metadata'].get('feature_parity', {}),
        'educational_mode': True
    })
    
    return platform_response


def validate_mock_response(mock_response: dict, validation_rules: dict) -> dict:
    """
    Validates Flask mock response objects against HTTP standards, Flask framework requirements,
    Flask-Talisman security policies, and educational criteria ensuring all mock responses meet
    quality and compatibility requirements for reliable testing execution.
    
    Args:
        mock_response: Mock response object for validation
        validation_rules: Validation rules and criteria for response quality
        
    Returns:
        Validation result with status, warnings, errors, and recommendations
    """
    validation_result = {
        'status': 'valid',
        'errors': [],
        'warnings': [],
        'recommendations': [],
        'validation_timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    # Validate HTTP status code against standard HTTP specifications
    status_code = mock_response.get('status_code')
    valid_status_codes = HTTP_CONSTANTS.get('STATUS_CODES', {}).values()
    if status_code not in valid_status_codes:
        validation_result['errors'].append(f"Invalid HTTP status code: {status_code}")
        validation_result['status'] = 'invalid'
    
    # Check Flask response headers for Flask-Talisman security compliance
    headers = mock_response.get('headers', {})
    required_security_headers = SECURITY_CONSTANTS.get('REQUIRED_HEADERS', [])
    
    for required_header in required_security_headers:
        if required_header not in headers:
            validation_result['warnings'].append(f"Missing security header: {required_header}")
    
    # Validate JSON structure and content type consistency
    content_type = headers.get('Content-Type', '')
    data = mock_response.get('data')
    
    if 'application/json' in content_type and data is not None:
        try:
            json.dumps(data)
        except (TypeError, ValueError) as e:
            validation_result['errors'].append(f"Invalid JSON data structure: {str(e)}")
            validation_result['status'] = 'invalid'
    
    # Check cross-platform compatibility and format consistency
    metadata = mock_response.get('metadata', {})
    if not metadata.get('educational_comparison'):
        validation_result['recommendations'].append("Consider adding educational comparison metadata")
    
    # Validate educational content and metadata completeness
    if validation_rules.get('educational_mode', True):
        educational_fields = ['flask_patterns', 'express_compatibility', 'security_demonstration']
        educational_data = metadata.get('educational', {})
        
        for field in educational_fields:
            if not educational_data.get(field):
                validation_result['warnings'].append(f"Missing educational field: {field}")
    
    # Check performance testing metadata and timing information
    performance_data = metadata.get('performance', {})
    if validation_rules.get('performance_validation', True):
        required_metrics = ['response_time_ms', 'memory_usage_mb', 'cpu_usage_percent']
        for metric in required_metrics:
            if metric not in performance_data:
                validation_result['recommendations'].append(f"Consider adding performance metric: {metric}")
    
    # Generate validation report with errors, warnings, and recommendations
    validation_result['summary'] = {
        'total_errors': len(validation_result['errors']),
        'total_warnings': len(validation_result['warnings']),
        'total_recommendations': len(validation_result['recommendations']),
        'overall_quality': 'high' if validation_result['status'] == 'valid' and len(validation_result['warnings']) == 0 else 'medium'
    }
    
    logger.debug("Mock response validated", {
        'validation_status': validation_result['status'],
        'error_count': len(validation_result['errors']),
        'warning_count': len(validation_result['warnings'])
    })
    
    return validation_result


def generate_security_variations(endpoint: str, base_response: dict) -> dict:
    """
    Helper function to generate security-related response variations for Flask-Talisman testing.
    """
    security_variations = {}
    
    # CSP violation scenario
    csp_response = copy.deepcopy(base_response)
    csp_response['status_code'] = 403
    csp_response['data'] = get_security_test_data('csp_violation')
    csp_response['headers']['Content-Security-Policy-Report-Only'] = "default-src 'self'"
    security_variations['csp_violation'] = csp_response
    
    # XSS protection scenario
    xss_response = copy.deepcopy(base_response)
    xss_response['status_code'] = 403
    xss_response['data'] = get_security_test_data('xss_attempt')
    xss_response['headers']['X-XSS-Protection'] = '1; mode=block'
    security_variations['xss_protection'] = xss_response
    
    # HSTS enforcement scenario
    hsts_response = copy.deepcopy(base_response)
    hsts_response['data'] = get_security_test_data('hsts_enforcement')
    hsts_response['headers']['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    security_variations['hsts_enforcement'] = hsts_response
    
    return security_variations


def initialize_flask_mock_responses(config: dict) -> dict:
    """
    Initializes all Flask mock response fixtures by creating standardized responses for each
    endpoint, generating test variations, setting up cross-platform responses, and preparing
    response cache for pytest test execution with comprehensive Flask testing scenarios.
    
    Args:
        config: Initialization configuration with endpoint definitions and test scenarios
        
    Returns:
        Initialized Flask mock response collection with all endpoints and variations
    """
    # Load Flask endpoint definitions and response templates from API_CONSTANTS
    endpoints = API_CONSTANTS.get('ENDPOINTS', {})
    responses_collection = {}
    
    # Generate base Flask mock responses for all API endpoints
    for endpoint_name, endpoint_config in endpoints.items():
        endpoint_path = endpoint_config.get('path', f'/{endpoint_name}')
        
        # Get endpoint-specific test data
        endpoint_data = get_api_endpoint_data(endpoint_path)
        
        # Create base response for endpoint
        base_response_config = {
            'status_code': 200,
            'data': endpoint_data.get('response_data', {}),
            'endpoint': endpoint_path
        }
        
        base_response = create_mock_response(base_response_config)
        
        # Generate variations for comprehensive testing
        variation_config = config.get('variations', {})
        variations = generate_variation_responses(endpoint_path, base_response, variation_config)
        
        responses_collection[endpoint_name] = {
            'base': base_response,
            'variations': variations
        }
    
    # Set up Flask-Talisman security testing responses
    security_config = config.get('security', {})
    responses_collection['security'] = get_security_mock_responses(security_config)
    
    # Initialize Flask performance testing responses
    performance_config = config.get('performance', {})
    responses_collection['performance'] = get_performance_mock_responses(performance_config)
    
    # Generate cross-platform compatibility responses
    cross_platform_config = config.get('cross_platform', {})
    responses_collection['cross_platform'] = get_cross_platform_mock_responses(cross_platform_config)
    
    # Cache all Flask responses in FLASK_MOCK_CACHE for performance optimization
    for category, category_responses in responses_collection.items():
        cache_key = f"category_{category}"
        FLASK_MOCK_CACHE[cache_key] = copy.deepcopy(category_responses)
    
    logger.info("Flask mock responses initialized", {
        'total_categories': len(responses_collection),
        'cache_size': len(FLASK_MOCK_CACHE),
        'initialization_timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    })
    
    return responses_collection


def get_hello_mock_responses(options: dict = None) -> dict:
    """
    Generates comprehensive mock responses for Flask /hello endpoint including success responses,
    error scenarios, security configurations, and performance variations for complete Flask
    endpoint testing coverage equivalent to Express.js hello endpoint testing.
    
    Args:
        options: Configuration options for hello endpoint response generation
        
    Returns:
        Complete set of Flask /hello endpoint mock responses with all scenarios
    """
    options = options or {}
    endpoint_data = get_api_endpoint_data('/hello', options)
    
    # Generate successful Flask /hello response with 200 status code
    success_response = create_mock_response({
        'status_code': 200,
        'data': {
            'message': 'Hello world',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'endpoint': '/hello',
            'framework': 'Flask'
        },
        'endpoint': '/hello',
        'learning_objectives': ['Flask routing', 'JSON responses', 'HTTP status codes']
    })
    
    # Create Flask error responses for /hello endpoint
    error_responses = {
        'not_found': create_mock_response({
            'status_code': 404,
            'data': {
                'error': True,
                'message': 'Endpoint not found',
                'endpoint': '/hello'
            },
            'endpoint': '/hello'
        }),
        'method_not_allowed': create_mock_response({
            'status_code': 405,
            'data': {
                'error': True,
                'message': 'Method not allowed',
                'allowed_methods': ['GET']
            },
            'endpoint': '/hello'
        }),
        'internal_error': create_mock_response({
            'status_code': 500,
            'data': {
                'error': True,
                'message': 'Internal server error',
                'error_id': str(uuid.uuid4())
            },
            'endpoint': '/hello'
        })
    }
    
    # Generate Flask-Talisman security responses
    security_responses = generate_security_variations('/hello', success_response)
    
    # Create performance test responses
    performance_responses = {
        'fast': create_mock_response({
            'status_code': 200,
            'data': endpoint_data.get('response_data', {}),
            'endpoint': '/hello'
        }, {'response_time_ms': 15, 'memory_usage_mb': 20}),
        'slow': create_mock_response({
            'status_code': 200,
            'data': endpoint_data.get('response_data', {}),
            'endpoint': '/hello'
        }, {'response_time_ms': 300, 'memory_usage_mb': 45})
    }
    
    # Generate cross-platform compatibility responses
    cross_platform_responses = {
        'flask': create_cross_platform_response(success_response, 'Flask', options),
        'express_compatible': create_cross_platform_response(success_response, 'Express.js', options)
    }
    
    return {
        'success': success_response,
        'error': error_responses,
        'variations': generate_variation_responses('/hello', success_response, options),
        'security': security_responses,
        'performance': performance_responses,
        'cross_platform': cross_platform_responses
    }


def get_good_evening_mock_responses(options: dict = None) -> dict:
    """
    Generates comprehensive mock responses for Flask /good-evening endpoint including success
    responses, error scenarios, security configurations, and performance variations for complete
    Flask endpoint testing coverage equivalent to Express.js good-evening endpoint testing.
    
    Args:
        options: Configuration options for good-evening endpoint response generation
        
    Returns:
        Complete set of Flask /good-evening endpoint mock responses with all scenarios
    """
    options = options or {}
    endpoint_data = get_api_endpoint_data('/good-evening', options)
    
    # Generate successful Flask /good-evening response with 200 status code
    success_response = create_mock_response({
        'status_code': 200,
        'data': {
            'message': 'Good evening',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'endpoint': '/good-evening',
            'framework': 'Flask',
            'greeting_time': 'evening'
        },
        'endpoint': '/good-evening',
        'learning_objectives': ['Flask routing', 'Evening greetings', 'Time-based responses']
    })
    
    # Create Flask error responses for /good-evening endpoint
    error_responses = {
        'validation_error': create_mock_response({
            'status_code': 400,
            'data': {
                'error': True,
                'message': 'Invalid request parameters',
                'validation_errors': ['Time parameter invalid']
            },
            'endpoint': '/good-evening'
        }),
        'server_error': create_mock_response({
            'status_code': 500,
            'data': {
                'error': True,
                'message': 'Server processing error',
                'error_code': 'EVENING_SERVICE_ERROR'
            },
            'endpoint': '/good-evening'
        })
    }
    
    # Generate Flask-Talisman security responses
    security_responses = generate_security_variations('/good-evening', success_response)
    
    # Create performance test responses with Flask response time metrics
    performance_responses = {
        'optimized': create_mock_response({
            'status_code': 200,
            'data': endpoint_data.get('response_data', {}),
            'endpoint': '/good-evening'
        }, {'response_time_ms': 12, 'memory_usage_mb': 18}),
        'heavy_load': create_mock_response({
            'status_code': 200,
            'data': endpoint_data.get('response_data', {}),
            'endpoint': '/good-evening'
        }, {'response_time_ms': 450, 'memory_usage_mb': 60})
    }
    
    # Generate cross-platform compatibility responses
    cross_platform_responses = {
        'flask_implementation': create_cross_platform_response(success_response, 'Flask', options),
        'express_equivalent': create_cross_platform_response(success_response, 'Express.js', options)
    }
    
    return {
        'success': success_response,
        'error': error_responses,
        'variations': generate_variation_responses('/good-evening', success_response, options),
        'security': security_responses,
        'performance': performance_responses,
        'cross_platform': cross_platform_responses
    }


def get_health_mock_responses(options: dict = None) -> dict:
    """
    Generates comprehensive mock responses for Flask health check endpoints including healthy/
    unhealthy states, performance metrics, system information, and monitoring data for complete
    Flask application health testing coverage equivalent to Express.js health monitoring.
    
    Args:
        options: Configuration options for health check response generation
        
    Returns:
        Complete set of Flask health check mock responses with status and metrics scenarios
    """
    options = options or {}
    current_time = time.time()
    
    # Generate healthy Flask application response
    healthy_response = create_mock_response({
        'status_code': 200,
        'data': {
            'status': 'healthy',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'uptime_seconds': current_time - (current_time - 3600),  # 1 hour uptime
            'memory_usage': {
                'used_mb': 45,
                'available_mb': 955,
                'percentage': 4.5
            },
            'system_info': {
                'python_version': '3.9.18',
                'flask_version': '3.1.1',
                'workers': 4
            },
            'checks': {
                'database': 'N/A - Stateless application',
                'external_services': 'N/A - No external dependencies',
                'file_system': 'healthy'
            }
        },
        'endpoint': '/health'
    })
    
    # Create unhealthy Flask application responses
    unhealthy_response = create_mock_response({
        'status_code': 503,
        'data': {
            'status': 'unhealthy',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'errors': [
                'High memory usage detected',
                'Response time threshold exceeded'
            ],
            'memory_usage': {
                'used_mb': 850,
                'available_mb': 150,
                'percentage': 85.0
            },
            'system_info': {
                'python_version': '3.9.18',
                'flask_version': '3.1.1',
                'workers': 4
            }
        },
        'endpoint': '/health'
    })
    
    # Generate Flask performance metrics responses
    metrics_response = create_mock_response({
        'status_code': 200,
        'data': {
            'metrics': {
                'requests_per_second': 125.5,
                'average_response_time_ms': 45.2,
                'error_rate_percentage': 0.1,
                'active_connections': 23,
                'total_requests': 15420,
                'total_errors': 15
            },
            'wsgi_metrics': {
                'worker_processes': 4,
                'requests_per_worker': 3855,
                'worker_memory_mb': [45, 48, 52, 41]
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/health/metrics'
    })
    
    # Create detailed health information response
    detailed_response = create_mock_response({
        'status_code': 200,
        'data': {
            'application': {
                'name': 'Flask Tutorial Application',
                'version': '1.0.0',
                'environment': 'development',
                'debug_mode': True
            },
            'system': {
                'platform': 'Linux',
                'python_version': '3.9.18',
                'flask_version': '3.1.1',
                'wsgi_server': 'Werkzeug'
            },
            'performance': {
                'uptime_seconds': current_time - (current_time - 7200),  # 2 hours uptime
                'cpu_usage_percent': 12.5,
                'memory_usage_mb': 48,
                'disk_usage_percent': 25.3
            },
            'security': {
                'talisman_enabled': True,
                'security_headers_active': True,
                'csp_policy_active': True
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/health/detailed'
    })
    
    # Create quick health check response
    quick_check_response = create_mock_response({
        'status_code': 200,
        'data': {
            'status': 'ok',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/health/quick'
    })
    
    return {
        'healthy': healthy_response,
        'unhealthy': unhealthy_response,
        'metrics': metrics_response,
        'detailed': detailed_response,
        'quick_check': quick_check_response
    }


def get_security_mock_responses(options: dict = None) -> dict:
    """
    Generates comprehensive security mock responses for Flask-Talisman validation including CSP
    directives, security headers, attack scenarios, and vulnerability testing equivalent to
    Helmet.js security testing for educational security demonstration and comprehensive security
    testing coverage.
    
    Args:
        options: Configuration options for security response generation
        
    Returns:
        Complete set of Flask security mock responses with CSP, headers, and attack scenarios
    """
    options = options or {}
    
    # Generate Flask-Talisman security header responses
    talisman_headers_response = create_mock_response({
        'status_code': 200,
        'data': {
            'security_framework': 'Flask-Talisman',
            'helmet_equivalent': True,
            'active_protections': [
                'Content Security Policy',
                'HTTP Strict Transport Security',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'X-XSS-Protection',
                'Referrer-Policy'
            ],
            'configuration': SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {}),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/security/headers'
    })
    
    # Add comprehensive security headers
    security_headers = SECURITY_CONSTANTS.get('SECURITY_HEADERS', {})
    talisman_headers_response['headers'].update(security_headers)
    
    # Create Content Security Policy responses
    csp_violation_response = create_mock_response({
        'status_code': 403,
        'data': {
            'violation_type': 'Content Security Policy',
            'blocked_uri': 'inline',
            'violated_directive': 'script-src',
            'security_data': get_security_test_data('csp_violation'),
            'educational_note': 'Flask-Talisman CSP equivalent to Helmet.js CSP protection',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/security/csp'
    })
    
    # Generate XSS protection responses
    xss_attempt_response = create_mock_response({
        'status_code': 403,
        'data': {
            'attack_type': 'Cross-Site Scripting Attempt',
            'protection_method': 'Flask-Talisman XSS Protection',
            'blocked_content': '<script>alert("xss")</script>',
            'security_data': get_security_test_data('xss_attempt'),
            'educational_comparison': 'Flask-Talisman vs Helmet.js XSS protection',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/security/xss'
    })
    
    # Create CORS policy responses
    cors_validation_response = create_mock_response({
        'status_code': 200,
        'data': {
            'cors_policy': 'Flask-CORS with Talisman integration',
            'allowed_origins': ['http://localhost:3000', 'http://localhost:5000'],
            'allowed_methods': ['GET', 'POST', 'PUT', 'DELETE'],
            'allowed_headers': ['Content-Type', 'Authorization'],
            'credentials_allowed': False,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/security/cors'
    })
    
    # Generate HSTS enforcement responses
    hsts_enforcement_response = create_mock_response({
        'status_code': 200,
        'data': {
            'hsts_policy': 'HTTP Strict Transport Security',
            'max_age_seconds': 31536000,
            'include_subdomains': True,
            'preload': True,
            'security_data': get_security_test_data('hsts_enforcement'),
            'educational_note': 'Flask-Talisman HSTS equivalent to Helmet.js HSTS protection',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/security/hsts'
    })
    
    return {
        'talisman_headers': talisman_headers_response,
        'csp_violation': csp_violation_response,
        'xss_attempt': xss_attempt_response,
        'cors_validation': cors_validation_response,
        'hsts_enforcement': hsts_enforcement_response
    }


def get_error_mock_responses(options: dict = None) -> dict:
    """
    Generates comprehensive error mock responses for Flask error handling validation including
    HTTP errors, validation errors, system errors, and security violation scenarios for complete
    Flask error middleware testing coverage and educational error handling demonstration.
    
    Args:
        options: Configuration options for error response generation
        
    Returns:
        Complete set of Flask error mock responses with HTTP, validation, system, and security errors
    """
    options = options or {}
    
    # Generate Flask HTTP error responses
    not_found_response = create_mock_response({
        'status_code': 404,
        'data': {
            'error': True,
            'error_type': 'NotFound',
            'message': 'The requested resource was not found',
            'error_code': 'RESOURCE_NOT_FOUND',
            'endpoint': options.get('endpoint', '/unknown'),
            'suggestions': [
                'Check the URL for typos',
                'Verify the endpoint exists',
                'Review API documentation'
            ],
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/error/404'
    })
    
    # Create method not allowed error response
    method_not_allowed_response = create_mock_response({
        'status_code': 405,
        'data': {
            'error': True,
            'error_type': 'MethodNotAllowed',
            'message': 'The HTTP method is not allowed for this endpoint',
            'error_code': 'METHOD_NOT_ALLOWED',
            'allowed_methods': ['GET', 'POST'],
            'requested_method': options.get('method', 'PUT'),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/error/405'
    })
    
    # Generate internal server error response
    internal_error_response = create_mock_response({
        'status_code': 500,
        'data': {
            'error': True,
            'error_type': 'InternalServerError',
            'message': 'An internal server error occurred',
            'error_code': 'INTERNAL_SERVER_ERROR',
            'error_id': str(uuid.uuid4()),
            'debug_info': 'Error details available in server logs',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/error/500'
    })
    
    # Create validation error response
    validation_error_response = create_mock_response({
        'status_code': 400,
        'data': {
            'error': True,
            'error_type': 'ValidationError',
            'message': 'Request validation failed',
            'error_code': 'VALIDATION_FAILED',
            'validation_errors': [
                {'field': 'email', 'message': 'Invalid email format'},
                {'field': 'age', 'message': 'Age must be a positive integer'}
            ],
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/error/validation'
    })
    
    # Generate rate limiting error response
    rate_limited_response = create_mock_response({
        'status_code': 429,
        'data': {
            'error': True,
            'error_type': 'RateLimitExceeded',
            'message': 'Too many requests. Please try again later.',
            'error_code': 'RATE_LIMIT_EXCEEDED',
            'retry_after_seconds': 60,
            'requests_remaining': 0,
            'reset_time': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/error/rate-limit'
    })
    
    return {
        'not_found': not_found_response,
        'method_not_allowed': method_not_allowed_response,
        'internal_error': internal_error_response,
        'validation_error': validation_error_response,
        'rate_limited': rate_limited_response
    }


def get_performance_mock_responses(options: dict = None) -> dict:
    """
    Helper function to generate performance testing mock responses.
    """
    options = options or {}
    
    # Fast response scenario
    fast_response = create_mock_response({
        'status_code': 200,
        'data': {
            'performance_type': 'fast_response',
            'message': 'Optimized response',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/performance/fast'
    }, {'response_time_ms': 10, 'memory_usage_mb': 15})
    
    # Slow response scenario
    slow_response = create_mock_response({
        'status_code': 200,
        'data': {
            'performance_type': 'slow_response',
            'message': 'Heavy processing response',
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/performance/slow'
    }, {'response_time_ms': 500, 'memory_usage_mb': 80})
    
    # Load test scenario
    load_test_response = create_mock_response({
        'status_code': 200,
        'data': {
            'performance_type': 'load_test',
            'concurrent_requests': 100,
            'average_response_time_ms': 75,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/performance/load'
    })
    
    # WSGI metrics scenario
    wsgi_metrics_response = create_mock_response({
        'status_code': 200,
        'data': {
            'wsgi_metrics': {
                'worker_count': 4,
                'requests_per_worker': 250,
                'worker_memory_usage': [45, 52, 38, 61],
                'worker_cpu_usage': [12.5, 15.2, 8.7, 18.3]
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/performance/wsgi'
    })
    
    # Concurrent requests scenario
    concurrent_requests_response = create_mock_response({
        'status_code': 200,
        'data': {
            'concurrent_handling': {
                'max_concurrent_requests': 500,
                'current_active_requests': 45,
                'queue_length': 5,
                'thread_pool_size': 20
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/performance/concurrent'
    })
    
    return {
        'fast_response': fast_response,
        'slow_response': slow_response,
        'load_test': load_test_response,
        'wsgi_metrics': wsgi_metrics_response,
        'concurrent_requests': concurrent_requests_response
    }


def get_cross_platform_mock_responses(options: dict = None) -> dict:
    """
    Helper function to generate cross-platform compatibility mock responses.
    """
    options = options or {}
    
    # Flask implementation specific response
    flask_implementation = create_mock_response({
        'status_code': 200,
        'data': {
            'framework': 'Flask',
            'version': '3.1.1',
            'features': ['WSGI', 'Flask-Talisman', 'Werkzeug', 'Jinja2'],
            'deployment': 'Gunicorn/uWSGI',
            'testing_framework': 'pytest',
            'cross_platform_data': get_cross_platform_test_data('Flask'),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/cross-platform/flask'
    })
    
    # Express.js compatibility response
    express_compatibility = create_mock_response({
        'status_code': 200,
        'data': {
            'framework': 'Express.js',
            'compatibility_mode': True,
            'flask_equivalent': True,
            'features': ['Node.js', 'Helmet.js', 'Express Router', 'EJS'],
            'deployment': 'PM2/Forever',
            'testing_framework': 'Jest/Mocha',
            'cross_platform_data': get_cross_platform_test_data('Express.js'),
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/cross-platform/express'
    })
    
    # Feature parity validation response
    feature_parity = create_mock_response({
        'status_code': 200,
        'data': {
            'parity_validation': {
                'routing': 'equivalent',
                'middleware': 'equivalent',
                'security': 'Flask-Talisman vs Helmet.js',
                'testing': 'pytest vs Jest/Mocha',
                'deployment': 'WSGI vs Node.js'
            },
            'compatibility_score': 95.5,
            'differences': [
                'Language: Python vs JavaScript',
                'Runtime: WSGI vs Node.js Event Loop',
                'Templating: Jinja2 vs EJS'
            ],
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/cross-platform/parity'
    })
    
    # Framework comparison response
    framework_comparison = create_mock_response({
        'status_code': 200,
        'data': {
            'comparison': {
                'flask_advantages': [
                    'Explicit configuration',
                    'Flexible architecture',
                    'Strong Python ecosystem'
                ],
                'express_advantages': [
                    'Non-blocking I/O',
                    'Large JavaScript ecosystem',
                    'JSON-native processing'
                ],
                'common_features': [
                    'RESTful API support',
                    'Middleware architecture',
                    'Security middleware',
                    'Testing frameworks'
                ]
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/cross-platform/comparison'
    })
    
    # Educational content response
    educational_content = create_mock_response({
        'status_code': 200,
        'data': {
            'educational_objectives': [
                'Understanding framework differences',
                'Cross-platform development concepts',
                'Security middleware comparison',
                'Testing strategy alignment'
            ],
            'learning_resources': {
                'flask_documentation': 'https://flask.palletsprojects.com/',
                'express_documentation': 'https://expressjs.com/',
                'security_comparison': 'Flask-Talisman vs Helmet.js',
                'testing_comparison': 'pytest vs Jest/Mocha'
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        'endpoint': '/cross-platform/educational'
    })
    
    return {
        'flask_implementation': flask_implementation,
        'express_compatibility': express_compatibility,
        'feature_parity': feature_parity,
        'framework_comparison': framework_comparison,
        'educational_content': educational_content
    }


# Initialize default mock response collections for immediate use
default_config = {
    'variations': {'include_edge_cases': True, 'include_performance': True},
    'security': {'include_talisman': True, 'include_csp': True},
    'performance': {'include_wsgi_metrics': True, 'include_timing': True},
    'cross_platform': {'include_express_comparison': True, 'educational_mode': True}
}

# Create exported response collections
hello_responses = get_hello_mock_responses(default_config)
good_evening_responses = get_good_evening_mock_responses(default_config)
health_responses = get_health_mock_responses(default_config)
error_responses = get_error_mock_responses(default_config)
security_responses = get_security_mock_responses(default_config)
performance_responses = get_performance_mock_responses(default_config)
cross_platform_responses = get_cross_platform_mock_responses(default_config)

# Log initialization completion
logger.info("Flask mock responses module initialized", {
    'response_collections': [
        'hello_responses',
        'good_evening_responses', 
        'health_responses',
        'error_responses',
        'security_responses',
        'performance_responses',
        'cross_platform_responses'
    ],
    'total_mock_responses': len(FLASK_MOCK_CACHE),
    'version': MOCK_RESPONSES_VERSION,
    'framework': 'Flask',
    'initialization_timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
})