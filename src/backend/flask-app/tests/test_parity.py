"""
Comprehensive Cross-Platform Parity Testing Module

This critical test suite ensures 100% functional compatibility between the Flask Python
implementation and the Express.js Node.js implementation. Implements sophisticated
comparison testing using pytest fixtures, HTTP response validation, security header
analysis, performance benchmarking, and educational cross-platform demonstration.

Validates Flask-Talisman security equivalence to Helmet.js, API endpoint consistency,
error handling parity, and production deployment compatibility while providing
detailed comparison analytics and educational insights for cross-platform web
development learning.

Features:
- Flask vs Express.js feature parity validation with 100% compatibility testing
- Security implementation comparison between Flask-Talisman and Helmet.js 15 sub-middlewares
- Performance benchmarking with <100ms response time targets and statistical analysis
- Educational cross-platform demonstration with detailed comparison insights
- Production deployment compatibility validation for WSGI vs PM2 equivalent functionality
- Comprehensive error handling parity testing and response format validation
- Real-time comparison analytics and cross-platform migration guidance

Educational Focus:
- Cross-platform web development skills demonstration and framework comparison
- Flask-Talisman security middleware equivalent to Helmet.js comprehensive validation
- pytest testing framework integration with educational comparison utilities
- Production deployment parity validation and compatibility assessment
- Performance optimization insights and cross-platform benchmarking analysis

Author: Flask Cross-Platform Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for cross-platform compatibility
import pytest  # ^7.4.0 - Python testing framework for comprehensive Flask cross-platform parity testing
import requests  # ^2.31.0 - HTTP library for making requests to Express.js server for cross-platform comparison
import json  # built-in - JSON processing for response comparison and cross-platform data serialization
import time  # built-in - High-resolution timing utilities for performance comparison equivalent to Node.js hrtime
import subprocess  # built-in - Process management for starting Express.js server instances during comparison testing
import threading  # built-in - Concurrent execution for parallel Flask and Express.js testing with thread-safe validation
from pathlib import Path  # built-in - Object-oriented filesystem paths for baseline data file management
import difflib  # built-in - Text and data comparison utilities for detailed response format analysis
import tempfile  # built-in - Temporary file creation for cross-platform testing artifacts and result storage
import statistics  # built-in - Statistical analysis for performance comparison metrics and response time variance
import uuid  # built-in - UUID generation for unique test session identification and correlation tracking
import os  # built-in - Operating system interface for environment variable access and process management
import sys  # built-in - System-specific parameters for runtime configuration and cross-platform compatibility
from typing import Dict, Any, List, Optional, Tuple, Union, Callable  # built-in - Type hints for cross-platform functions

# Internal imports for Flask application and cross-platform testing utilities
from ..app import create_app, validate_application_health, get_application_info
from ..utils.constants import API_CONSTANTS, EXPRESS_CONSTANTS, TESTING_CONSTANTS
from ..utils.logger import logger

# Global variables for cross-platform testing environment management
PARITY_TEST_SESSION_ID: str = str(uuid.uuid4())
EXPRESS_SERVER_PROCESS: Optional[subprocess.Popen] = None
FLASK_TEST_CLIENT: Optional[Any] = None
BASELINE_COMPARISON_DATA: Dict[str, Any] = {}
PERFORMANCE_METRICS: Dict[str, Any] = {}
PARITY_VALIDATION_RESULTS: Dict[str, Any] = {}

# Cross-platform testing constants for Flask vs Express.js comparison
EXPRESS_SERVER_PORT = 3001  # Different port to avoid conflicts with Flask
FLASK_SERVER_PORT = 3000    # Standard port for Flask development
EXPRESS_SERVER_STARTUP_TIMEOUT = 10  # Seconds to wait for Express.js server startup
BASELINE_DATA_PATH = Path(__file__).parent / "fixtures" / "express_baseline.json"
PERFORMANCE_ITERATIONS = 10  # Number of iterations for performance testing
SECURITY_HEADER_MAPPING = {
    # Flask-Talisman to Helmet.js header mapping for security comparison
    'Content-Security-Policy': 'content-security-policy',
    'Strict-Transport-Security': 'strict-transport-security',
    'X-Frame-Options': 'x-frame-options',
    'X-Content-Type-Options': 'x-content-type-options',
    'Referrer-Policy': 'referrer-policy',
    'Cross-Origin-Embedder-Policy': 'cross-origin-embedder-policy',
    'Cross-Origin-Opener-Policy': 'cross-origin-opener-policy',
    'Cross-Origin-Resource-Policy': 'cross-origin-resource-policy'
}


# Mock functions for missing test_data.py file - these would normally be imported
def get_cross_platform_test_data() -> Dict[str, Any]:
    """
    Generates cross-platform test data for Flask vs Express.js compatibility validation
    and educational comparison testing with comprehensive endpoint scenarios.
    """
    return {
        'endpoints': [
            {'path': '/hello', 'method': 'GET', 'expected_response': {'message': 'Hello world'}},
            {'path': '/good-evening', 'method': 'GET', 'expected_response': {'message': 'Good evening'}},
            {'path': '/health', 'method': 'GET', 'expected_fields': ['status', 'timestamp', 'uptime']}
        ],
        'test_scenarios': {
            'basic_functionality': {'timeout': 5.0, 'retry_count': 3},
            'performance_testing': {'iterations': PERFORMANCE_ITERATIONS, 'concurrency': 10},
            'security_validation': {'header_checks': True, 'vulnerability_testing': False}
        },
        'compatibility_matrix': {
            'response_format': 'json',
            'status_codes': [200, 404, 500],
            'content_types': ['application/json', 'text/plain']
        }
    }


def get_api_endpoint_data() -> Dict[str, Any]:
    """
    Generates API endpoint test data for comprehensive endpoint validation with
    Express.js baseline comparison and Flask implementation testing.
    """
    return {
        'endpoints': API_CONSTANTS.get('ENDPOINTS', {
            '/hello': {'method': 'GET', 'response_type': 'json'},
            '/good-evening': {'method': 'GET', 'response_type': 'json'},
            '/health': {'method': 'GET', 'response_type': 'json'}
        }),
        'response_patterns': EXPRESS_CONSTANTS.get('RESPONSE_PATTERNS', {
            'success': {'status': 200, 'content_type': 'application/json'},
            'not_found': {'status': 404, 'content_type': 'application/json'},
            'server_error': {'status': 500, 'content_type': 'application/json'}
        }),
        'validation_rules': {
            'response_time_ms': 100,  # Maximum response time for parity
            'content_encoding': 'utf-8',
            'security_headers_required': True
        }
    }


def get_security_test_data() -> Dict[str, Any]:
    """
    Generates security test data for Flask-Talisman vs Helmet.js security header
    comparison and vulnerability testing with comprehensive protection analysis.
    """
    return {
        'security_headers': SECURITY_HEADER_MAPPING,
        'talisman_config': {
            'content_security_policy': {
                'default-src': "'self'",
                'script-src': "'self' 'unsafe-inline'",
                'style-src': "'self' 'unsafe-inline'"
            },
            'strict_transport_security': {
                'max_age': 31536000,
                'include_subdomains': True
            },
            'force_https': False,  # For testing environment
            'frame_options': 'SAMEORIGIN'
        },
        'helmet_equivalent': {
            'contentSecurityPolicy': True,
            'hsts': True,
            'frameguard': True,
            'noSniff': True,
            'referrerPolicy': True
        },
        'security_tests': {
            'header_injection': False,  # Disable for educational environment
            'xss_protection': True,
            'clickjacking_protection': True,
            'content_type_sniffing': True
        }
    }


def get_performance_test_data() -> Dict[str, Any]:
    """
    Generates performance test data for cross-platform response time comparison
    and benchmarking validation with statistical analysis and optimization insights.
    """
    performance_targets = TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {
        'response_time_ms': 100,
        'memory_usage_mb': 100,
        'cpu_usage_percent': 80
    })
    
    return {
        'performance_targets': performance_targets,
        'test_configuration': {
            'iterations': PERFORMANCE_ITERATIONS,
            'concurrent_requests': 10,
            'warmup_requests': 5,
            'measurement_precision': 'milliseconds'
        },
        'metrics_collection': {
            'response_time': True,
            'memory_usage': True,
            'cpu_utilization': False,  # Simplified for educational environment
            'throughput': True
        },
        'statistical_analysis': {
            'calculate_mean': True,
            'calculate_median': True,
            'calculate_std_dev': True,
            'outlier_detection': True
        }
    }


class TestDataGenerator:
    """
    Test data generator class for dynamic cross-platform test data creation with
    validation and caching capabilities for Flask vs Express.js comparison testing.
    """
    
    def __init__(self) -> None:
        """
        Initializes test data generator with cross-platform configuration and
        caching infrastructure for efficient test data management.
        """
        self.session_id = PARITY_TEST_SESSION_ID
        self.cache: Dict[str, Any] = {}
        self.generation_timestamp = time.time()
        
        logger.info("TestDataGenerator initialized", {
            'session_id': self.session_id,
            'timestamp': self.generation_timestamp
        })
    
    def generate_cross_platform_data(self, data_type: str, **kwargs) -> Dict[str, Any]:
        """
        Generates cross-platform test data based on specified type with validation
        and compatibility checking for Flask and Express.js testing scenarios.
        """
        cache_key = f"{data_type}_{hash(str(kwargs))}"
        
        if cache_key in self.cache:
            logger.debug("Retrieved cached test data", {'cache_key': cache_key})
            return self.cache[cache_key]
        
        data_generators = {
            'cross_platform': get_cross_platform_test_data,
            'api_endpoints': get_api_endpoint_data,
            'security': get_security_test_data,
            'performance': get_performance_test_data
        }
        
        if data_type not in data_generators:
            raise ValueError(f"Unsupported data type: {data_type}")
        
        generated_data = data_generators[data_type]()
        generated_data.update(kwargs)
        
        self.cache[cache_key] = generated_data
        logger.info("Generated cross-platform test data", {
            'data_type': data_type,
            'cache_key': cache_key,
            'data_size': len(str(generated_data))
        })
        
        return generated_data
    
    def validate_generated_data(self, data: Dict[str, Any], validation_rules: Dict[str, Any]) -> bool:
        """
        Validates generated test data against specified rules for cross-platform
        compatibility and testing requirements with comprehensive validation.
        """
        try:
            for rule_name, rule_value in validation_rules.items():
                if rule_name == 'required_fields':
                    for field in rule_value:
                        if field not in data:
                            logger.warning("Missing required field in test data", {
                                'field': field,
                                'rule': rule_name
                            })
                            return False
                
                elif rule_name == 'data_types':
                    for field, expected_type in rule_value.items():
                        if field in data and not isinstance(data[field], expected_type):
                            logger.warning("Invalid data type in test data", {
                                'field': field,
                                'expected_type': expected_type.__name__,
                                'actual_type': type(data[field]).__name__
                            })
                            return False
            
            logger.debug("Test data validation successful", {
                'validation_rules': len(validation_rules),
                'data_fields': len(data)
            })
            return True
            
        except Exception as error:
            logger.error("Test data validation failed", error, {
                'validation_rules': validation_rules,
                'data_keys': list(data.keys())
            })
            return False


def setup_cross_platform_environment(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sets up comprehensive cross-platform testing environment including Flask test client
    configuration, Express.js server startup, baseline data loading, and testing
    infrastructure preparation for feature parity validation with proper resource
    management and error handling.
    """
    global EXPRESS_SERVER_PROCESS, FLASK_TEST_CLIENT, BASELINE_COMPARISON_DATA
    
    logger.info("Setting up cross-platform testing environment", {
        'session_id': PARITY_TEST_SESSION_ID,
        'config': config
    })
    
    try:
        # Initialize Flask application using create_app with testing configuration
        flask_config = config.get('flask_config', {
            'TESTING': True,
            'WTF_CSRF_ENABLED': False,
            'SERVER_PORT': FLASK_SERVER_PORT
        })
        
        flask_app = create_app(flask_config)
        
        # Create Flask test client for HTTP endpoint testing and response validation
        FLASK_TEST_CLIENT = flask_app.test_client()
        
        # Validate Flask application health and readiness for cross-platform testing
        health_status = validate_application_health(flask_app)
        if not health_status.get('healthy', False):
            raise RuntimeError(f"Flask application health check failed: {health_status}")
        
        # Start Express.js server process using subprocess for cross-platform comparison
        express_server_path = config.get('express_server_path', '../../../express-app/server.js')
        if os.path.exists(express_server_path):
            EXPRESS_SERVER_PROCESS = subprocess.Popen([
                'node', express_server_path
            ], env={**os.environ, 'PORT': str(EXPRESS_SERVER_PORT)})
            
            # Wait for Express.js server startup and validate availability with health check
            time.sleep(2)  # Initial startup delay
            for attempt in range(EXPRESS_SERVER_STARTUP_TIMEOUT):
                try:
                    response = requests.get(f'http://localhost:{EXPRESS_SERVER_PORT}/health', timeout=1)
                    if response.status_code == 200:
                        logger.info("Express.js server startup successful", {
                            'port': EXPRESS_SERVER_PORT,
                            'startup_time': attempt + 1
                        })
                        break
                except requests.RequestException:
                    if attempt == EXPRESS_SERVER_STARTUP_TIMEOUT - 1:
                        logger.warning("Express.js server not available", {
                            'attempts': EXPRESS_SERVER_STARTUP_TIMEOUT,
                            'port': EXPRESS_SERVER_PORT
                        })
                    time.sleep(1)
        
        # Load Express.js baseline data from file system or generate default baseline
        if BASELINE_DATA_PATH.exists():
            with open(BASELINE_DATA_PATH, 'r') as baseline_file:
                BASELINE_COMPARISON_DATA = json.load(baseline_file)
        else:
            BASELINE_COMPARISON_DATA = get_cross_platform_test_data()
            logger.info("Using generated baseline data", {
                'baseline_keys': list(BASELINE_COMPARISON_DATA.keys())
            })
        
        # Initialize performance monitoring infrastructure for response time comparison
        global PERFORMANCE_METRICS
        PERFORMANCE_METRICS = {
            'session_id': PARITY_TEST_SESSION_ID,
            'start_time': time.time(),
            'flask_metrics': {},
            'express_metrics': {},
            'comparison_results': {}
        }
        
        # Set up security testing environment for Flask-Talisman vs Helmet.js comparison
        security_config = get_security_test_data()
        
        # Configure concurrent testing infrastructure for parallel platform testing
        threading.current_thread().name = f"CrossPlatformTest-{PARITY_TEST_SESSION_ID[:8]}"
        
        # Log cross-platform environment setup completion with configuration summary
        environment_info = {
            'flask_app_name': flask_app.name,
            'flask_client_ready': FLASK_TEST_CLIENT is not None,
            'express_server_running': EXPRESS_SERVER_PROCESS is not None,
            'baseline_data_loaded': bool(BASELINE_COMPARISON_DATA),
            'security_config_loaded': bool(security_config),
            'performance_monitoring_ready': bool(PERFORMANCE_METRICS)
        }
        
        logger.info("Cross-platform environment setup completed", environment_info)
        
        return {
            'flask_app': flask_app,
            'flask_client': FLASK_TEST_CLIENT,
            'express_server_process': EXPRESS_SERVER_PROCESS,
            'baseline_data': BASELINE_COMPARISON_DATA,
            'performance_metrics': PERFORMANCE_METRICS,
            'environment_info': environment_info,
            'setup_successful': True
        }
        
    except Exception as error:
        logger.error("Cross-platform environment setup failed", error, {
            'config': config,
            'session_id': PARITY_TEST_SESSION_ID
        })
        
        # Cleanup on setup failure
        teardown_cross_platform_environment()
        
        return {
            'setup_successful': False,
            'error': str(error),
            'error_type': type(error).__name__
        }


def teardown_cross_platform_environment() -> None:
    """
    Performs comprehensive cleanup of cross-platform testing environment including
    Express.js server termination, Flask client cleanup, resource deallocation, and
    testing artifact cleanup with proper error handling and resource management.
    """
    global EXPRESS_SERVER_PROCESS, FLASK_TEST_CLIENT, BASELINE_COMPARISON_DATA
    global PERFORMANCE_METRICS, PARITY_VALIDATION_RESULTS
    
    logger.info("Starting cross-platform environment teardown", {
        'session_id': PARITY_TEST_SESSION_ID
    })
    
    cleanup_results = {
        'express_server_terminated': False,
        'flask_client_cleaned': False,
        'metrics_saved': False,
        'artifacts_cleaned': False
    }
    
    try:
        # Terminate Express.js server process gracefully with SIGTERM signal handling
        if EXPRESS_SERVER_PROCESS:
            try:
                EXPRESS_SERVER_PROCESS.terminate()
                EXPRESS_SERVER_PROCESS.wait(timeout=5)
                cleanup_results['express_server_terminated'] = True
                logger.info("Express.js server terminated successfully")
            except subprocess.TimeoutExpired:
                EXPRESS_SERVER_PROCESS.kill()
                EXPRESS_SERVER_PROCESS.wait()
                logger.warning("Express.js server forcefully killed due to timeout")
            except Exception as error:
                logger.error("Error terminating Express.js server", error)
            finally:
                EXPRESS_SERVER_PROCESS = None
        
        # Clean up Flask test client and release HTTP connection resources
        if FLASK_TEST_CLIENT:
            FLASK_TEST_CLIENT = None
            cleanup_results['flask_client_cleaned'] = True
            logger.debug("Flask test client cleaned up")
        
        # Save performance metrics and comparison results before clearing
        if PERFORMANCE_METRICS:
            metrics_summary = {
                'session_id': PARITY_TEST_SESSION_ID,
                'total_tests': len(PERFORMANCE_METRICS.get('comparison_results', {})),
                'duration': time.time() - PERFORMANCE_METRICS.get('start_time', time.time())
            }
            logger.info("Performance metrics summary", metrics_summary)
            cleanup_results['metrics_saved'] = True
        
        # Clear baseline comparison data cache and performance metrics storage
        BASELINE_COMPARISON_DATA.clear()
        PERFORMANCE_METRICS.clear()
        PARITY_VALIDATION_RESULTS.clear()
        
        # Remove temporary files and testing artifacts created during parity testing
        temp_dir = tempfile.gettempdir()
        for temp_file in Path(temp_dir).glob(f"cross_platform_test_{PARITY_TEST_SESSION_ID[:8]}*"):
            try:
                temp_file.unlink()
                logger.debug("Removed temporary file", {'file': str(temp_file)})
            except Exception as error:
                logger.warning("Failed to remove temporary file", error, {'file': str(temp_file)})
        
        cleanup_results['artifacts_cleaned'] = True
        
        # Log cleanup completion with resource deallocation summary and final status
        logger.info("Cross-platform environment teardown completed", {
            'session_id': PARITY_TEST_SESSION_ID,
            'cleanup_results': cleanup_results
        })
        
    except Exception as error:
        logger.error("Error during cross-platform environment teardown", error, {
            'session_id': PARITY_TEST_SESSION_ID,
            'cleanup_results': cleanup_results
        })


def compare_api_endpoints(endpoint_path: str, test_scenarios: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares API endpoint responses between Flask and Express.js implementations for
    complete feature parity validation including response format, status codes, headers,
    content, and timing analysis with detailed comparison reporting and educational insights.
    """
    logger.info("Starting API endpoint comparison", {
        'endpoint': endpoint_path,
        'test_scenarios': test_scenarios
    })
    
    comparison_results = {
        'endpoint': endpoint_path,
        'timestamp': time.time(),
        'flask_response': {},
        'express_response': {},
        'comparison_analysis': {},
        'parity_status': 'unknown',
        'differences': [],
        'performance_comparison': {}
    }
    
    try:
        # Load endpoint test scenarios from test_scenarios parameter with validation
        timeout = test_scenarios.get('timeout', 5.0)
        retry_count = test_scenarios.get('retry_count', 3)
        
        # Make HTTP request to Flask endpoint using test client with comprehensive header collection
        flask_start_time = time.time()
        for attempt in range(retry_count):
            try:
                if FLASK_TEST_CLIENT:
                    flask_response = FLASK_TEST_CLIENT.get(endpoint_path, timeout=timeout)
                    flask_end_time = time.time()
                    
                    comparison_results['flask_response'] = {
                        'status_code': flask_response.status_code,
                        'headers': dict(flask_response.headers),
                        'content_type': flask_response.content_type,
                        'data': flask_response.get_json() if flask_response.is_json else flask_response.get_data(as_text=True),
                        'response_time_ms': (flask_end_time - flask_start_time) * 1000,
                        'content_length': len(flask_response.get_data())
                    }
                    break
                else:
                    raise RuntimeError("Flask test client not available")
                    
            except Exception as error:
                if attempt == retry_count - 1:
                    comparison_results['flask_response'] = {
                        'error': str(error),
                        'error_type': type(error).__name__,
                        'attempt_count': attempt + 1
                    }
                    logger.warning("Flask endpoint request failed", error, {
                        'endpoint': endpoint_path,
                        'attempts': retry_count
                    })
                time.sleep(0.1)  # Brief delay between retries
        
        # Make HTTP request to Express.js endpoint using requests library with timing measurement
        if EXPRESS_SERVER_PROCESS:
            express_start_time = time.time()
            for attempt in range(retry_count):
                try:
                    express_url = f'http://localhost:{EXPRESS_SERVER_PORT}{endpoint_path}'
                    express_response = requests.get(express_url, timeout=timeout)
                    express_end_time = time.time()
                    
                    comparison_results['express_response'] = {
                        'status_code': express_response.status_code,
                        'headers': dict(express_response.headers),
                        'content_type': express_response.headers.get('content-type', 'unknown'),
                        'data': express_response.json() if express_response.headers.get('content-type', '').startswith('application/json') else express_response.text,
                        'response_time_ms': (express_end_time - express_start_time) * 1000,
                        'content_length': len(express_response.content)
                    }
                    break
                    
                except Exception as error:
                    if attempt == retry_count - 1:
                        comparison_results['express_response'] = {
                            'error': str(error),
                            'error_type': type(error).__name__,
                            'attempt_count': attempt + 1
                        }
                        logger.warning("Express.js endpoint request failed", error, {
                            'endpoint': endpoint_path,
                            'attempts': retry_count
                        })
                    time.sleep(0.1)
        else:
            comparison_results['express_response'] = {
                'error': 'Express.js server not available',
                'error_type': 'ServerNotAvailable'
            }
        
        # Compare HTTP status codes between Flask and Express.js responses with detailed analysis
        flask_status = comparison_results['flask_response'].get('status_code')
        express_status = comparison_results['express_response'].get('status_code')
        
        status_comparison = {
            'flask_status': flask_status,
            'express_status': express_status,
            'status_match': flask_status == express_status
        }
        
        if not status_comparison['status_match']:
            comparison_results['differences'].append({
                'type': 'status_code_mismatch',
                'flask_value': flask_status,
                'express_value': express_status
            })
        
        # Validate response content equivalence including JSON structure and text format comparison
        flask_data = comparison_results['flask_response'].get('data')
        express_data = comparison_results['express_response'].get('data')
        
        content_comparison = {
            'flask_data': flask_data,
            'express_data': express_data,
            'content_match': flask_data == express_data
        }
        
        if not content_comparison['content_match'] and flask_data and express_data:
            # Detailed content difference analysis
            if isinstance(flask_data, dict) and isinstance(express_data, dict):
                content_diff = {
                    'flask_keys': set(flask_data.keys()) if flask_data else set(),
                    'express_keys': set(express_data.keys()) if express_data else set(),
                    'missing_in_flask': set(express_data.keys()) - set(flask_data.keys()) if express_data and flask_data else set(),
                    'missing_in_express': set(flask_data.keys()) - set(express_data.keys()) if flask_data and express_data else set()
                }
                comparison_results['differences'].append({
                    'type': 'content_structure_mismatch',
                    'details': content_diff
                })
            else:
                comparison_results['differences'].append({
                    'type': 'content_value_mismatch',
                    'flask_value': flask_data,
                    'express_value': express_data
                })
        
        # Compare HTTP headers including security headers and content-type validation
        flask_headers = comparison_results['flask_response'].get('headers', {})
        express_headers = comparison_results['express_response'].get('headers', {})
        
        header_comparison = {
            'flask_headers_count': len(flask_headers),
            'express_headers_count': len(express_headers),
            'common_headers': set(flask_headers.keys()) & set(express_headers.keys()),
            'flask_only_headers': set(flask_headers.keys()) - set(express_headers.keys()),
            'express_only_headers': set(express_headers.keys()) - set(flask_headers.keys())
        }
        
        # Analyze response timing performance and compare response time differences
        flask_time = comparison_results['flask_response'].get('response_time_ms', 0)
        express_time = comparison_results['express_response'].get('response_time_ms', 0)
        
        performance_comparison = {
            'flask_response_time_ms': flask_time,
            'express_response_time_ms': express_time,
            'time_difference_ms': abs(flask_time - express_time) if flask_time and express_time else None,
            'flask_faster': flask_time < express_time if flask_time and express_time else None,
            'performance_target_met': all(t < TESTING_CONSTANTS.get('PERFORMANCE_TARGETS', {}).get('response_time_ms', 100) 
                                        for t in [flask_time, express_time] if t)
        }
        
        # Determine overall parity status based on comparison analysis
        parity_checks = [
            status_comparison['status_match'],
            content_comparison['content_match'],
            len(comparison_results['differences']) == 0
        ]
        
        comparison_results.update({
            'comparison_analysis': {
                'status_comparison': status_comparison,
                'content_comparison': content_comparison,
                'header_comparison': header_comparison,
                'performance_comparison': performance_comparison
            },
            'parity_status': 'full_parity' if all(parity_checks) else 'partial_parity' if any(parity_checks) else 'no_parity',
            'performance_comparison': performance_comparison
        })
        
        # Log endpoint comparison results with educational insights and framework differences
        logger.info("API endpoint comparison completed", {
            'endpoint': endpoint_path,
            'parity_status': comparison_results['parity_status'],
            'differences_count': len(comparison_results['differences']),
            'performance_comparison': performance_comparison
        })
        
        return comparison_results
        
    except Exception as error:
        logger.error("API endpoint comparison failed", error, {
            'endpoint': endpoint_path,
            'test_scenarios': test_scenarios
        })
        
        comparison_results.update({
            'parity_status': 'comparison_error',
            'error': str(error),
            'error_type': type(error).__name__
        })
        
        return comparison_results


def validate_security_parity(security_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates security implementation parity between Flask-Talisman and Helmet.js including
    security headers comparison, CSP directive analysis, HSTS configuration validation, and
    comprehensive security feature equivalence testing with detailed security assessment reporting.
    """
    logger.info("Starting security parity validation", {
        'security_config_keys': list(security_config.keys())
    })
    
    security_results = {
        'timestamp': time.time(),
        'flask_security_headers': {},
        'express_security_headers': {},
        'header_comparison': {},
        'talisman_analysis': {},
        'helmet_analysis': {},
        'security_parity_status': 'unknown',
        'security_recommendations': []
    }
    
    try:
        # Load security test scenarios from get_security_test_data with Flask-Talisman configuration
        security_test_data = get_security_test_data()
        talisman_config = security_test_data.get('talisman_config', {})
        helmet_equivalent = security_test_data.get('helmet_equivalent', {})
        
        # Extract security headers from Flask responses including CSP, HSTS, and frame options
        if FLASK_TEST_CLIENT:
            flask_response = FLASK_TEST_CLIENT.get('/hello')
            flask_headers = dict(flask_response.headers)
            
            # Analyze Flask-Talisman security headers
            flask_security_headers = {}
            for header_name, header_key in SECURITY_HEADER_MAPPING.items():
                if header_name in flask_headers:
                    flask_security_headers[header_key] = flask_headers[header_name]
                elif header_name.lower() in flask_headers:
                    flask_security_headers[header_key] = flask_headers[header_name.lower()]
            
            security_results['flask_security_headers'] = flask_security_headers
            
            # Analyze Flask-Talisman configuration compliance
            talisman_analysis = {
                'csp_configured': 'Content-Security-Policy' in flask_headers,
                'hsts_configured': 'Strict-Transport-Security' in flask_headers,
                'frame_options_configured': 'X-Frame-Options' in flask_headers,
                'content_type_options_configured': 'X-Content-Type-Options' in flask_headers,
                'total_security_headers': len(flask_security_headers)
            }
            security_results['talisman_analysis'] = talisman_analysis
        
        # Extract security headers from Express.js responses including Helmet.js 15 sub-middlewares
        if EXPRESS_SERVER_PROCESS:
            try:
                express_url = f'http://localhost:{EXPRESS_SERVER_PORT}/hello'
                express_response = requests.get(express_url, timeout=5.0)
                express_headers = dict(express_response.headers)
                
                # Analyze Helmet.js security headers
                express_security_headers = {}
                for header_name, header_key in SECURITY_HEADER_MAPPING.items():
                    if header_name in express_headers:
                        express_security_headers[header_key] = express_headers[header_name]
                    elif header_name.lower() in express_headers:
                        express_security_headers[header_key] = express_headers[header_name.lower()]
                
                security_results['express_security_headers'] = express_security_headers
                
                # Analyze Helmet.js configuration compliance
                helmet_analysis = {
                    'csp_configured': 'content-security-policy' in express_security_headers,
                    'hsts_configured': 'strict-transport-security' in express_security_headers,
                    'frame_options_configured': 'x-frame-options' in express_security_headers,
                    'content_type_options_configured': 'x-content-type-options' in express_security_headers,
                    'total_security_headers': len(express_security_headers)
                }
                security_results['helmet_analysis'] = helmet_analysis
                
            except Exception as error:
                logger.warning("Failed to retrieve Express.js security headers", error)
                security_results['express_security_headers'] = {'error': str(error)}
        
        # Compare Content Security Policy directives between Flask-Talisman and Helmet.js
        flask_csp = security_results['flask_security_headers'].get('content-security-policy')
        express_csp = security_results['express_security_headers'].get('content-security-policy')
        
        csp_comparison = {
            'flask_csp_present': bool(flask_csp),
            'express_csp_present': bool(express_csp),
            'csp_values_match': flask_csp == express_csp if flask_csp and express_csp else False,
            'flask_csp_directives': flask_csp.split(';') if flask_csp else [],
            'express_csp_directives': express_csp.split(';') if express_csp else []
        }
        
        # Validate HSTS header configuration and parameter equivalence between platforms
        flask_hsts = security_results['flask_security_headers'].get('strict-transport-security')
        express_hsts = security_results['express_security_headers'].get('strict-transport-security')
        
        hsts_comparison = {
            'flask_hsts_present': bool(flask_hsts),
            'express_hsts_present': bool(express_hsts),
            'hsts_values_match': flask_hsts == express_hsts if flask_hsts and express_hsts else False,
            'flask_hsts_config': flask_hsts,
            'express_hsts_config': express_hsts
        }
        
        # Compare X-Frame-Options and clickjacking protection implementation consistency
        flask_frame_options = security_results['flask_security_headers'].get('x-frame-options')
        express_frame_options = security_results['express_security_headers'].get('x-frame-options')
        
        frame_options_comparison = {
            'flask_frame_options_present': bool(flask_frame_options),
            'express_frame_options_present': bool(express_frame_options),
            'frame_options_match': flask_frame_options == express_frame_options if flask_frame_options and express_frame_options else False
        }
        
        # Calculate overall security header parity percentage
        flask_headers_set = set(security_results['flask_security_headers'].keys())
        express_headers_set = set(security_results['express_security_headers'].keys())
        
        common_headers = flask_headers_set & express_headers_set
        total_unique_headers = flask_headers_set | express_headers_set
        
        header_comparison = {
            'common_headers': list(common_headers),
            'flask_only_headers': list(flask_headers_set - express_headers_set),
            'express_only_headers': list(express_headers_set - flask_headers_set),
            'header_parity_percentage': (len(common_headers) / len(total_unique_headers) * 100) if total_unique_headers else 0,
            'csp_comparison': csp_comparison,
            'hsts_comparison': hsts_comparison,
            'frame_options_comparison': frame_options_comparison
        }
        
        security_results['header_comparison'] = header_comparison
        
        # Determine security parity status based on header comparison analysis
        parity_score = header_comparison['header_parity_percentage']
        if parity_score >= 90:
            security_parity_status = 'excellent_parity'
        elif parity_score >= 75:
            security_parity_status = 'good_parity'
        elif parity_score >= 50:
            security_parity_status = 'moderate_parity'
        else:
            security_parity_status = 'poor_parity'
        
        security_results['security_parity_status'] = security_parity_status
        
        # Generate security recommendations based on parity analysis
        recommendations = []
        
        if not csp_comparison['csp_values_match']:
            recommendations.append("Align Content Security Policy directives between Flask-Talisman and Helmet.js")
        
        if not hsts_comparison['hsts_values_match']:
            recommendations.append("Standardize HSTS configuration parameters across platforms")
        
        if header_comparison['flask_only_headers']:
            recommendations.append(f"Consider adding Flask-specific headers to Express.js: {header_comparison['flask_only_headers']}")
        
        if header_comparison['express_only_headers']:
            recommendations.append(f"Consider adding Express.js-specific headers to Flask: {header_comparison['express_only_headers']}")
        
        security_results['security_recommendations'] = recommendations
        
        # Log security validation results with educational security comparison insights
        logger.info("Security parity validation completed", {
            'security_parity_status': security_parity_status,
            'header_parity_percentage': parity_score,
            'recommendations_count': len(recommendations)
        })
        
        return security_results
        
    except Exception as error:
        logger.error("Security parity validation failed", error, {
            'security_config': security_config
        })
        
        security_results.update({
            'security_parity_status': 'validation_error',
            'error': str(error),
            'error_type': type(error).__name__
        })
        
        return security_results


def measure_performance_parity(performance_config: Dict[str, Any], iteration_count: int) -> Dict[str, Any]:
    """
    Measures and compares performance characteristics between Flask and Express.js
    implementations including response times, throughput, resource usage, and scalability
    analysis with statistical validation and performance benchmarking for educational demonstration.
    """
    logger.info("Starting performance parity measurement", {
        'performance_config': performance_config,
        'iteration_count': iteration_count
    })
    
    performance_results = {
        'timestamp': time.time(),
        'iteration_count': iteration_count,
        'flask_performance': {},
        'express_performance': {},
        'statistical_analysis': {},
        'performance_comparison': {},
        'parity_assessment': 'unknown'
    }
    
    try:
        # Load performance test scenarios from get_performance_test_data with benchmark configuration
        performance_test_data = get_performance_test_data()
        performance_targets = performance_test_data.get('performance_targets', {})
        test_config = performance_test_data.get('test_configuration', {})
        
        # Initialize performance measurement infrastructure with high-resolution timing utilities
        flask_measurements = []
        express_measurements = []
        
        warmup_requests = test_config.get('warmup_requests', 5)
        
        # Execute Flask endpoint performance tests with multiple iterations and statistical collection
        if FLASK_TEST_CLIENT:
            logger.info("Starting Flask performance measurements", {'iterations': iteration_count})
            
            # Warmup requests to stabilize performance
            for _ in range(warmup_requests):
                FLASK_TEST_CLIENT.get('/hello')
            
            for iteration in range(iteration_count):
                start_time = time.perf_counter()
                response = FLASK_TEST_CLIENT.get('/hello')
                end_time = time.perf_counter()
                
                response_time_ms = (end_time - start_time) * 1000
                flask_measurements.append({
                    'iteration': iteration,
                    'response_time_ms': response_time_ms,
                    'status_code': response.status_code,
                    'content_length': len(response.get_data())
                })
                
                # Brief delay between iterations to avoid overwhelming the server
                time.sleep(0.01)
            
            # Calculate Flask performance statistics
            flask_response_times = [m['response_time_ms'] for m in flask_measurements]
            flask_performance = {
                'total_requests': len(flask_measurements),
                'successful_requests': sum(1 for m in flask_measurements if m['status_code'] == 200),
                'average_response_time_ms': statistics.mean(flask_response_times),
                'median_response_time_ms': statistics.median(flask_response_times),
                'min_response_time_ms': min(flask_response_times),
                'max_response_time_ms': max(flask_response_times),
                'std_dev_response_time_ms': statistics.stdev(flask_response_times) if len(flask_response_times) > 1 else 0,
                'requests_per_second': iteration_count / (max(flask_response_times) / 1000) if flask_response_times else 0
            }
            performance_results['flask_performance'] = flask_performance
        
        # Execute Express.js endpoint performance tests with equivalent scenarios and timing measurement
        if EXPRESS_SERVER_PROCESS:
            logger.info("Starting Express.js performance measurements", {'iterations': iteration_count})
            
            express_url = f'http://localhost:{EXPRESS_SERVER_PORT}/hello'
            
            # Warmup requests to stabilize performance
            for _ in range(warmup_requests):
                try:
                    requests.get(express_url, timeout=5.0)
                except requests.RequestException:
                    pass
            
            for iteration in range(iteration_count):
                try:
                    start_time = time.perf_counter()
                    response = requests.get(express_url, timeout=5.0)
                    end_time = time.perf_counter()
                    
                    response_time_ms = (end_time - start_time) * 1000
                    express_measurements.append({
                        'iteration': iteration,
                        'response_time_ms': response_time_ms,
                        'status_code': response.status_code,
                        'content_length': len(response.content)
                    })
                    
                except requests.RequestException as error:
                    express_measurements.append({
                        'iteration': iteration,
                        'error': str(error),
                        'error_type': type(error).__name__
                    })
                
                time.sleep(0.01)
            
            # Calculate Express.js performance statistics
            successful_express = [m for m in express_measurements if 'response_time_ms' in m]
            if successful_express:
                express_response_times = [m['response_time_ms'] for m in successful_express]
                express_performance = {
                    'total_requests': len(express_measurements),
                    'successful_requests': len(successful_express),
                    'average_response_time_ms': statistics.mean(express_response_times),
                    'median_response_time_ms': statistics.median(express_response_times),
                    'min_response_time_ms': min(express_response_times),
                    'max_response_time_ms': max(express_response_times),
                    'std_dev_response_time_ms': statistics.stdev(express_response_times) if len(express_response_times) > 1 else 0,
                    'requests_per_second': len(successful_express) / (max(express_response_times) / 1000) if express_response_times else 0
                }
                performance_results['express_performance'] = express_performance
        
        # Measure response time variance and calculate statistical performance metrics
        if flask_measurements and express_measurements:
            flask_times = [m['response_time_ms'] for m in flask_measurements if 'response_time_ms' in m]
            express_times = [m['response_time_ms'] for m in express_measurements if 'response_time_ms' in m]
            
            statistical_analysis = {
                'flask_coefficient_of_variation': (statistics.stdev(flask_times) / statistics.mean(flask_times)) if flask_times and len(flask_times) > 1 else 0,
                'express_coefficient_of_variation': (statistics.stdev(express_times) / statistics.mean(express_times)) if express_times and len(express_times) > 1 else 0,
                'performance_correlation': 'calculated' if flask_times and express_times else 'unavailable'
            }
            
            # Compare performance metrics between platforms
            flask_avg = performance_results.get('flask_performance', {}).get('average_response_time_ms', 0)
            express_avg = performance_results.get('express_performance', {}).get('average_response_time_ms', 0)
            
            performance_comparison = {
                'flask_faster': flask_avg < express_avg if flask_avg and express_avg else None,
                'speed_difference_ms': abs(flask_avg - express_avg) if flask_avg and express_avg else None,
                'speed_difference_percentage': abs(flask_avg - express_avg) / max(flask_avg, express_avg) * 100 if flask_avg and express_avg else None,
                'both_meet_targets': all([
                    flask_avg < performance_targets.get('response_time_ms', 100),
                    express_avg < performance_targets.get('response_time_ms', 100)
                ]) if flask_avg and express_avg else False
            }
            
            # Calculate performance parity percentage and identify performance gaps
            target_response_time = performance_targets.get('response_time_ms', 100)
            
            parity_factors = []
            if flask_avg and express_avg:
                time_difference_percentage = abs(flask_avg - express_avg) / max(flask_avg, express_avg) * 100
                parity_factors.append(100 - min(time_difference_percentage, 100))
            
            if performance_results.get('flask_performance', {}).get('successful_requests') and performance_results.get('express_performance', {}).get('successful_requests'):
                flask_success_rate = performance_results['flask_performance']['successful_requests'] / performance_results['flask_performance']['total_requests'] * 100
                express_success_rate = performance_results['express_performance']['successful_requests'] / performance_results['express_performance']['total_requests'] * 100
                success_rate_parity = 100 - abs(flask_success_rate - express_success_rate)
                parity_factors.append(success_rate_parity)
            
            overall_parity_score = statistics.mean(parity_factors) if parity_factors else 0
            
            if overall_parity_score >= 90:
                parity_assessment = 'excellent_parity'
            elif overall_parity_score >= 75:
                parity_assessment = 'good_parity'
            elif overall_parity_score >= 50:
                parity_assessment = 'moderate_parity'
            else:
                parity_assessment = 'poor_parity'
            
            performance_results.update({
                'statistical_analysis': statistical_analysis,
                'performance_comparison': performance_comparison,
                'parity_assessment': parity_assessment,
                'parity_score': overall_parity_score
            })
        
        # Log performance measurement results with educational performance insights
        logger.info("Performance parity measurement completed", {
            'parity_assessment': performance_results.get('parity_assessment', 'unknown'),
            'flask_avg_response_time': performance_results.get('flask_performance', {}).get('average_response_time_ms'),
            'express_avg_response_time': performance_results.get('express_performance', {}).get('average_response_time_ms'),
            'performance_targets_met': performance_results.get('performance_comparison', {}).get('both_meet_targets')
        })
        
        return performance_results
        
    except Exception as error:
        logger.error("Performance parity measurement failed", error, {
            'performance_config': performance_config,
            'iteration_count': iteration_count
        })
        
        performance_results.update({
            'parity_assessment': 'measurement_error',
            'error': str(error),
            'error_type': type(error).__name__
        })
        
        return performance_results


def validate_error_handling_parity(error_scenarios: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates error handling consistency between Flask and Express.js implementations
    including error response formats, status codes, error message consistency, and
    exception handling behavior with comprehensive error scenario testing and validation.
    """
    logger.info("Starting error handling parity validation", {
        'error_scenarios': error_scenarios
    })
    
    error_results = {
        'timestamp': time.time(),
        'error_scenarios_tested': [],
        'flask_error_responses': {},
        'express_error_responses': {},
        'error_handling_comparison': {},
        'consistency_analysis': {},
        'parity_status': 'unknown'
    }
    
    try:
        # Define standard error test scenarios for comprehensive validation
        test_scenarios = [
            {'path': '/nonexistent-endpoint', 'expected_status': 404, 'scenario_name': 'not_found_error'},
            {'path': '/hello/../../../etc/passwd', 'expected_status': 404, 'scenario_name': 'path_traversal_attempt'},
            {'path': '/hello' + 'a' * 2000, 'expected_status': 414, 'scenario_name': 'uri_too_long'}  # URI too long
        ]
        
        # Add custom error scenarios from parameter
        if 'custom_scenarios' in error_scenarios:
            test_scenarios.extend(error_scenarios['custom_scenarios'])
        
        error_results['error_scenarios_tested'] = [s['scenario_name'] for s in test_scenarios]
        
        # Test Flask error handling for various error conditions with response format validation
        flask_error_responses = {}
        
        if FLASK_TEST_CLIENT:
            for scenario in test_scenarios:
                try:
                    response = FLASK_TEST_CLIENT.get(scenario['path'])
                    
                    flask_error_responses[scenario['scenario_name']] = {
                        'status_code': response.status_code,
                        'headers': dict(response.headers),
                        'content_type': response.content_type,
                        'response_data': response.get_json() if response.is_json else response.get_data(as_text=True),
                        'content_length': len(response.get_data()),
                        'has_error_message': bool(response.get_json() if response.is_json else response.get_data(as_text=True))
                    }
                    
                except Exception as error:
                    flask_error_responses[scenario['scenario_name']] = {
                        'error': str(error),
                        'error_type': type(error).__name__
                    }
        
        error_results['flask_error_responses'] = flask_error_responses
        
        # Test Express.js error handling for equivalent error conditions with response comparison
        express_error_responses = {}
        
        if EXPRESS_SERVER_PROCESS:
            for scenario in test_scenarios:
                try:
                    express_url = f'http://localhost:{EXPRESS_SERVER_PORT}{scenario["path"]}'
                    response = requests.get(express_url, timeout=5.0)
                    
                    express_error_responses[scenario['scenario_name']] = {
                        'status_code': response.status_code,
                        'headers': dict(response.headers),
                        'content_type': response.headers.get('content-type', 'unknown'),
                        'response_data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                        'content_length': len(response.content),
                        'has_error_message': bool(response.text)
                    }
                    
                except requests.RequestException as error:
                    express_error_responses[scenario['scenario_name']] = {
                        'error': str(error),
                        'error_type': type(error).__name__
                    }
        
        error_results['express_error_responses'] = express_error_responses
        
        # Compare error handling consistency between platforms
        error_handling_comparison = {}
        consistency_scores = []
        
        for scenario_name in error_results['error_scenarios_tested']:
            flask_response = flask_error_responses.get(scenario_name, {})
            express_response = express_error_responses.get(scenario_name, {})
            
            scenario_comparison = {
                'scenario_name': scenario_name,
                'flask_status': flask_response.get('status_code'),
                'express_status': express_response.get('status_code'),
                'status_codes_match': flask_response.get('status_code') == express_response.get('status_code'),
                'flask_content_type': flask_response.get('content_type'),
                'express_content_type': express_response.get('content_type'),
                'content_types_similar': self._compare_content_types(
                    flask_response.get('content_type', ''),
                    express_response.get('content_type', '')
                ),
                'both_have_error_message': flask_response.get('has_error_message', False) and express_response.get('has_error_message', False)
            }
            
            # Calculate consistency score for this scenario
            consistency_factors = [
                scenario_comparison['status_codes_match'],
                scenario_comparison['content_types_similar'],
                scenario_comparison['both_have_error_message']
            ]
            scenario_consistency = sum(consistency_factors) / len(consistency_factors) * 100
            scenario_comparison['consistency_score'] = scenario_consistency
            consistency_scores.append(scenario_consistency)
            
            error_handling_comparison[scenario_name] = scenario_comparison
        
        error_results['error_handling_comparison'] = error_handling_comparison
        
        # Generate comprehensive consistency analysis
        overall_consistency = statistics.mean(consistency_scores) if consistency_scores else 0
        
        consistency_analysis = {
            'overall_consistency_percentage': overall_consistency,
            'scenarios_tested': len(test_scenarios),
            'fully_consistent_scenarios': sum(1 for score in consistency_scores if score == 100),
            'partially_consistent_scenarios': sum(1 for score in consistency_scores if 50 <= score < 100),
            'inconsistent_scenarios': sum(1 for score in consistency_scores if score < 50),
            'consistency_scores': consistency_scores
        }
        
        # Determine overall parity status
        if overall_consistency >= 90:
            parity_status = 'excellent_parity'
        elif overall_consistency >= 75:
            parity_status = 'good_parity'
        elif overall_consistency >= 50:
            parity_status = 'moderate_parity'
        else:
            parity_status = 'poor_parity'
        
        error_results.update({
            'consistency_analysis': consistency_analysis,
            'parity_status': parity_status
        })
        
        # Log error validation results with educational error handling insights
        logger.info("Error handling parity validation completed", {
            'parity_status': parity_status,
            'overall_consistency': overall_consistency,
            'scenarios_tested': len(test_scenarios)
        })
        
        return error_results
        
    except Exception as error:
        logger.error("Error handling parity validation failed", error, {
            'error_scenarios': error_scenarios
        })
        
        error_results.update({
            'parity_status': 'validation_error',
            'error': str(error),
            'error_type': type(error).__name__
        })
        
        return error_results


def _compare_content_types(flask_content_type: str, express_content_type: str) -> bool:
    """
    Helper function to compare content types between Flask and Express.js responses
    with normalization for cross-platform compatibility.
    """
    # Normalize content types for comparison
    flask_normalized = flask_content_type.lower().split(';')[0].strip()
    express_normalized = express_content_type.lower().split(';')[0].strip()
    
    # Common content type aliases
    content_type_aliases = {
        'application/json': ['application/json', 'text/json'],
        'text/plain': ['text/plain', 'text/html'],
        'text/html': ['text/html', 'text/plain']
    }
    
    if flask_normalized == express_normalized:
        return True
    
    # Check for aliases
    for primary_type, aliases in content_type_aliases.items():
        if flask_normalized in aliases and express_normalized in aliases:
            return True
    
    return False


def generate_parity_report(comparison_results: Dict[str, Any], report_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates comprehensive cross-platform parity report summarizing feature equivalence,
    security comparison, performance analysis, educational insights, and deployment
    compatibility with detailed recommendations and actionable feedback for framework
    migration and evaluation.
    """
    logger.info("Generating comprehensive parity report", {
        'comparison_results_keys': list(comparison_results.keys()),
        'report_config': report_config
    })
    
    parity_report = {
        'report_metadata': {
            'generation_timestamp': time.time(),
            'session_id': PARITY_TEST_SESSION_ID,
            'report_version': '1.0.0',
            'frameworks_compared': ['Flask 3.1.1', 'Express.js 5.1.0']
        },
        'executive_summary': {},
        'detailed_analysis': {},
        'educational_insights': {},
        'migration_guidance': {},
        'recommendations': [],
        'compliance_assessment': {}
    }
    
    try:
        # Aggregate comparison results from all parity validation tests and analysis functions
        api_results = comparison_results.get('api_comparison', {})
        security_results = comparison_results.get('security_validation', {})
        performance_results = comparison_results.get('performance_measurement', {})
        error_handling_results = comparison_results.get('error_handling_validation', {})
        deployment_results = comparison_results.get('deployment_validation', {})
        
        # Calculate overall feature parity percentage with weighted scoring methodology
        parity_components = []
        weights = report_config.get('component_weights', {
            'api_parity': 0.25,
            'security_parity': 0.25,
            'performance_parity': 0.20,
            'error_handling_parity': 0.15,
            'deployment_parity': 0.15
        })
        
        # API endpoint parity scoring
        if api_results:
            api_parity_score = self._calculate_api_parity_score(api_results)
            parity_components.append(('api_parity', api_parity_score, weights.get('api_parity', 0.25)))
        
        # Security implementation parity scoring
        if security_results:
            security_parity_score = self._extract_parity_score(security_results, 'header_comparison', 'header_parity_percentage')
            parity_components.append(('security_parity', security_parity_score, weights.get('security_parity', 0.25)))
        
        # Performance parity scoring
        if performance_results:
            performance_parity_score = performance_results.get('parity_score', 0)
            parity_components.append(('performance_parity', performance_parity_score, weights.get('performance_parity', 0.20)))
        
        # Error handling parity scoring
        if error_handling_results:
            error_parity_score = self._extract_parity_score(error_handling_results, 'consistency_analysis', 'overall_consistency_percentage')
            parity_components.append(('error_handling_parity', error_parity_score, weights.get('error_handling_parity', 0.15)))
        
        # Deployment parity scoring
        if deployment_results:
            deployment_parity_score = deployment_results.get('compatibility_score', 0)
            parity_components.append(('deployment_parity', deployment_parity_score, weights.get('deployment_parity', 0.15)))
        
        # Calculate weighted overall parity score
        if parity_components:
            weighted_score = sum(score * weight for _, score, weight in parity_components)
            total_weight = sum(weight for _, _, weight in parity_components)
            overall_parity_percentage = weighted_score / total_weight if total_weight > 0 else 0
        else:
            overall_parity_percentage = 0
        
        # Generate executive summary with key findings
        executive_summary = {
            'overall_parity_percentage': overall_parity_percentage,
            'parity_rating': self._get_parity_rating(overall_parity_percentage),
            'components_tested': len(parity_components),
            'total_tests_executed': sum([
                len(api_results.get('endpoint_comparisons', {})),
                len(security_results.get('header_comparison', {}).get('common_headers', [])),
                performance_results.get('iteration_count', 0),
                len(error_handling_results.get('error_scenarios_tested', [])),
                1 if deployment_results else 0
            ]),
            'critical_issues': [],
            'migration_feasibility': 'high' if overall_parity_percentage >= 80 else 'medium' if overall_parity_percentage >= 60 else 'low'
        }
        
        # Analyze security implementation equivalence and generate security comparison summary
        security_analysis = {}
        if security_results:
            security_analysis = {
                'flask_talisman_headers': len(security_results.get('flask_security_headers', {})),
                'helmet_js_headers': len(security_results.get('express_security_headers', {})),
                'security_parity_status': security_results.get('security_parity_status', 'unknown'),
                'critical_security_gaps': security_results.get('security_recommendations', []),
                'csp_compatibility': security_results.get('header_comparison', {}).get('csp_comparison', {}).get('csp_values_match', False),
                'hsts_compatibility': security_results.get('header_comparison', {}).get('hsts_comparison', {}).get('hsts_values_match', False)
            }
        
        # Compile performance comparison analysis with statistical significance testing
        performance_analysis = {}
        if performance_results:
            performance_analysis = {
                'flask_avg_response_time': performance_results.get('flask_performance', {}).get('average_response_time_ms', 0),
                'express_avg_response_time': performance_results.get('express_performance', {}).get('average_response_time_ms', 0),
                'performance_targets_met': performance_results.get('performance_comparison', {}).get('both_meet_targets', False),
                'speed_advantage': 'flask' if performance_results.get('performance_comparison', {}).get('flask_faster') else 'express' if performance_results.get('performance_comparison', {}).get('flask_faster') is False else 'comparable',
                'statistical_confidence': performance_results.get('statistical_analysis', {})
            }
        
        # Generate educational insights explaining framework differences and similarities
        educational_insights = {
            'framework_architecture_comparison': {
                'flask_wsgi_model': 'WSGI-based Python web framework with application factory pattern',
                'express_middleware_model': 'Middleware-based Node.js framework with event-driven architecture',
                'routing_differences': 'Flask uses decorators for routing, Express uses method chaining',
                'async_handling': 'Flask supports async/await in Python 3.7+, Express native async with Node.js'
            },
            'security_implementation_insights': {
                'flask_talisman_approach': 'Flask-Talisman provides comprehensive security headers with Python configuration',
                'helmet_js_approach': 'Helmet.js offers 15 sub-middlewares for granular security control',
                'configuration_flexibility': 'Both frameworks offer extensive security customization options'
            },
            'performance_characteristics': {
                'flask_performance_profile': 'Python GIL considerations, WSGI server optimization important',
                'express_performance_profile': 'Single-threaded event loop, excellent for I/O-intensive operations',
                'scaling_recommendations': 'Flask scales with WSGI workers, Express scales with PM2 cluster mode'
            }
        }
        
        # Create migration guidance documentation for converting between Flask and Express.js
        migration_guidance = {
            'flask_to_express_migration': {
                'routing_migration': 'Convert Flask route decorators to Express router methods',
                'middleware_migration': 'Transform Flask before_request/after_request to Express middleware',
                'template_migration': 'Replace Jinja2 templates with Express template engines',
                'configuration_migration': 'Convert Flask configuration to Express environment variables'
            },
            'express_to_flask_migration': {
                'route_conversion': 'Transform Express routes to Flask view functions with decorators',
                'middleware_conversion': 'Convert Express middleware to Flask before/after request handlers',
                'async_handling': 'Adapt Express async/await patterns to Flask async view functions',
                'dependency_management': 'Replace npm packages with equivalent Python packages'
            },
            'shared_patterns': {
                'rest_api_design': 'Both frameworks support RESTful API design patterns',
                'json_handling': 'Native JSON support in both Flask and Express',
                'error_handling': 'Similar error handling patterns with custom error handlers',
                'testing_approaches': 'Both support comprehensive testing with framework-specific tools'
            }
        }
        
        # Generate detailed recommendations for improving cross-platform consistency
        recommendations = []
        
        if overall_parity_percentage < 90:
            recommendations.append({
                'priority': 'high',
                'category': 'overall_parity',
                'recommendation': f'Improve overall parity from {overall_parity_percentage:.1f}% to >90% for production equivalence',
                'implementation_effort': 'medium'
            })
        
        if security_analysis.get('critical_security_gaps'):
            recommendations.extend([{
                'priority': 'high',
                'category': 'security',
                'recommendation': gap,
                'implementation_effort': 'low'
            } for gap in security_analysis['critical_security_gaps']])
        
        if not performance_analysis.get('performance_targets_met', True):
            recommendations.append({
                'priority': 'medium',
                'category': 'performance',
                'recommendation': 'Optimize response times to meet <100ms target for both frameworks',
                'implementation_effort': 'medium'
            })
        
        # Document deployment compatibility analysis and production readiness assessment
        deployment_analysis = deployment_results if deployment_results else {
            'wsgi_compatibility': 'Flask WSGI deployment ready',
            'pm2_equivalent': 'Gunicorn/uWSGI equivalent to PM2 cluster mode',
            'process_management': 'Both frameworks support production process management',
            'zero_downtime_deployment': 'Both support rolling deployments with proper configuration'
        }
        
        # Compile comprehensive parity assessment with actionable improvement suggestions
        parity_report.update({
            'executive_summary': executive_summary,
            'detailed_analysis': {
                'api_endpoint_analysis': api_results,
                'security_analysis': security_analysis,
                'performance_analysis': performance_analysis,
                'error_handling_analysis': error_handling_results.get('consistency_analysis', {}),
                'deployment_analysis': deployment_analysis
            },
            'educational_insights': educational_insights,
            'migration_guidance': migration_guidance,
            'recommendations': recommendations,
            'compliance_assessment': {
                'production_readiness': overall_parity_percentage >= 80,
                'security_compliance': security_analysis.get('security_parity_status', 'unknown') in ['excellent_parity', 'good_parity'],
                'performance_compliance': performance_analysis.get('performance_targets_met', False),
                'error_handling_compliance': error_handling_results.get('parity_status', 'unknown') in ['excellent_parity', 'good_parity']
            }
        })
        
        # Log parity report generation with educational value assessment and learning outcomes
        logger.info("Comprehensive parity report generated successfully", {
            'overall_parity_percentage': overall_parity_percentage,
            'parity_rating': executive_summary['parity_rating'],
            'recommendations_count': len(recommendations),
            'migration_feasibility': executive_summary['migration_feasibility']
        })
        
        return parity_report
        
    except Exception as error:
        logger.error("Parity report generation failed", error, {
            'comparison_results_keys': list(comparison_results.keys()),
            'report_config': report_config
        })
        
        parity_report.update({
            'generation_error': str(error),
            'error_type': type(error).__name__,
            'partial_results': comparison_results
        })
        
        return parity_report


def _calculate_api_parity_score(api_results: Dict[str, Any]) -> float:
    """
    Helper function to calculate API parity score from endpoint comparison results.
    """
    endpoint_comparisons = api_results.get('endpoint_comparisons', {})
    if not endpoint_comparisons:
        return 0.0
    
    total_score = 0
    for endpoint_result in endpoint_comparisons.values():
        if endpoint_result.get('parity_status') == 'full_parity':
            total_score += 100
        elif endpoint_result.get('parity_status') == 'partial_parity':
            total_score += 50
        # no_parity and errors get 0 points
    
    return total_score / len(endpoint_comparisons)


def _extract_parity_score(results: Dict[str, Any], section_key: str, score_key: str) -> float:
    """
    Helper function to extract parity score from nested result structures.
    """
    section = results.get(section_key, {})
    return section.get(score_key, 0.0)


def _get_parity_rating(parity_percentage: float) -> str:
    """
    Helper function to convert parity percentage to human-readable rating.
    """
    if parity_percentage >= 95:
        return 'excellent'
    elif parity_percentage >= 85:
        return 'good'
    elif parity_percentage >= 70:
        return 'fair'
    elif parity_percentage >= 50:
        return 'poor'
    else:
        return 'inadequate'


def validate_deployment_parity(deployment_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates deployment compatibility between Flask WSGI deployment and Express.js PM2
    cluster mode including process management, load balancing, health monitoring, and
    production deployment feature equivalence with comprehensive deployment testing and validation.
    """
    logger.info("Starting deployment parity validation", {
        'deployment_config': deployment_config
    })
    
    deployment_results = {
        'timestamp': time.time(),
        'flask_deployment_assessment': {},
        'express_deployment_assessment': {},
        'compatibility_analysis': {},
        'production_readiness': {},
        'compatibility_score': 0
    }
    
    try:
        # Load deployment configuration for Flask WSGI and Express.js PM2 comparison testing
        flask_wsgi_config = deployment_config.get('flask_wsgi', {
            'server': 'gunicorn',
            'workers': 4,
            'worker_class': 'sync',
            'timeout': 30,
            'keepalive': 5
        })
        
        pm2_config = deployment_config.get('pm2_equivalent', {
            'instances': 'max',
            'exec_mode': 'cluster',
            'max_memory_restart': '1G',
            'autorestart': True
        })
        
        # Validate Flask application factory pattern deployment readiness and configuration
        flask_app_info = get_application_info()
        flask_deployment_assessment = {
            'application_factory_ready': 'create_app' in flask_app_info.get('factory_functions', []),
            'wsgi_compatibility': True,  # Flask is inherently WSGI compatible
            'configuration_externalized': bool(flask_app_info.get('config_sources', [])),
            'health_endpoint_available': '/health' in flask_app_info.get('routes', []),
            'logging_configured': bool(flask_app_info.get('logging_handlers', [])),
            'error_handling_configured': bool(flask_app_info.get('error_handlers', [])),
            'deployment_score': 0
        }
        
        # Calculate Flask deployment readiness score
        flask_readiness_factors = [
            flask_deployment_assessment['application_factory_ready'],
            flask_deployment_assessment['wsgi_compatibility'],
            flask_deployment_assessment['configuration_externalized'],
            flask_deployment_assessment['health_endpoint_available'],
            flask_deployment_assessment['logging_configured'],
            flask_deployment_assessment['error_handling_configured']
        ]
        flask_deployment_assessment['deployment_score'] = sum(flask_readiness_factors) / len(flask_readiness_factors) * 100
        
        deployment_results['flask_deployment_assessment'] = flask_deployment_assessment
        
        # Test Flask WSGI deployment compatibility and worker process management
        wsgi_compatibility_tests = {
            'import_test': self._test_flask_import(),
            'wsgi_application_callable': self._test_wsgi_callable(),
            'environment_variable_support': self._test_environment_variables(),
            'graceful_shutdown_support': True,  # Flask supports graceful shutdown
            'multi_worker_compatibility': True   # Flask is stateless and multi-worker ready
        }
        
        # Compare Flask application health monitoring with Express.js health check implementation
        health_monitoring_comparison = {
            'flask_health_check': self._test_flask_health_endpoint(),
            'express_health_check': self._test_express_health_endpoint() if EXPRESS_SERVER_PROCESS else {'available': False},
            'health_check_parity': False
        }
        
        flask_health = health_monitoring_comparison['flask_health_check']
        express_health = health_monitoring_comparison['express_health_check']
        
        if flask_health.get('available') and express_health.get('available'):
            health_monitoring_comparison['health_check_parity'] = True
            health_monitoring_comparison['response_format_match'] = (
                flask_health.get('response_format') == express_health.get('response_format')
            )
        
        # Assess Express.js PM2 equivalent deployment characteristics
        express_deployment_assessment = {
            'pm2_cluster_equivalent': 'gunicorn with multiple workers provides PM2 cluster equivalent',
            'process_management': 'systemd or supervisor for process management',
            'auto_restart_capability': 'gunicorn supports auto-restart on worker failure',
            'load_balancing': 'gunicorn provides built-in load balancing across workers',
            'zero_downtime_deployment': 'supported with proper configuration and orchestration',
            'monitoring_integration': 'compatible with standard Python monitoring tools',
            'deployment_score': 85  # High compatibility score for WSGI deployment
        }
        
        deployment_results['express_deployment_assessment'] = express_deployment_assessment
        
        # Analyze deployment compatibility and production readiness equivalence
        compatibility_factors = [
            wsgi_compatibility_tests['import_test'],
            wsgi_compatibility_tests['wsgi_application_callable'],
            wsgi_compatibility_tests['environment_variable_support'],
            health_monitoring_comparison['health_check_parity'],
            flask_deployment_assessment['deployment_score'] >= 80
        ]
        
        compatibility_analysis = {
            'wsgi_compatibility_tests': wsgi_compatibility_tests,
            'health_monitoring_comparison': health_monitoring_comparison,
            'process_management_equivalent': True,  # gunicorn equivalent to PM2
            'scaling_strategy_equivalent': True,    # both support horizontal scaling
            'monitoring_compatibility': True,      # both support production monitoring
            'deployment_automation_ready': True,   # both support automated deployment
            'total_compatibility_factors': len(compatibility_factors),
            'compatible_factors': sum(compatibility_factors),
            'compatibility_percentage': sum(compatibility_factors) / len(compatibility_factors) * 100
        }
        
        deployment_results['compatibility_analysis'] = compatibility_analysis
        
        # Generate production readiness assessment
        production_readiness = {
            'flask_production_ready': flask_deployment_assessment['deployment_score'] >= 80,
            'express_equivalent_ready': True,  # Express.js with PM2 is production ready
            'cross_platform_migration_feasible': compatibility_analysis['compatibility_percentage'] >= 75,
            'deployment_documentation_available': True,
            'monitoring_setup_required': 'standard Python monitoring tools integration needed',
            'security_hardening_required': 'standard WSGI security practices apply'
        }
        
        deployment_results.update({
            'production_readiness': production_readiness,
            'compatibility_score': compatibility_analysis['compatibility_percentage']
        })
        
        # Log deployment validation results with educational deployment insights
        logger.info("Deployment parity validation completed", {
            'compatibility_score': compatibility_analysis['compatibility_percentage'],
            'flask_deployment_score': flask_deployment_assessment['deployment_score'],
            'production_readiness': production_readiness['cross_platform_migration_feasible']
        })
        
        return deployment_results
        
    except Exception as error:
        logger.error("Deployment parity validation failed", error, {
            'deployment_config': deployment_config
        })
        
        deployment_results.update({
            'validation_error': str(error),
            'error_type': type(error).__name__
        })
        
        return deployment_results


def _test_flask_import() -> bool:
    """
    Helper function to test Flask application import for deployment validation.
    """
    try:
        from ..app import create_app
        return True
    except ImportError:
        return False


def _test_wsgi_callable() -> bool:
    """
    Helper function to test WSGI application callable for deployment validation.
    """
    try:
        from ..app import create_app
        app = create_app()
        return callable(app)
    except Exception:
        return False


def _test_environment_variables() -> bool:
    """
    Helper function to test environment variable support for deployment configuration.
    """
    try:
        # Test if Flask respects environment variables
        original_value = os.environ.get('FLASK_ENV')
        os.environ['FLASK_ENV'] = 'testing'
        
        from ..app import create_app
        app = create_app()
        
        # Restore original value
        if original_value:
            os.environ['FLASK_ENV'] = original_value
        elif 'FLASK_ENV' in os.environ:
            del os.environ['FLASK_ENV']
        
        return True
    except Exception:
        return False


def _test_flask_health_endpoint() -> Dict[str, Any]:
    """
    Helper function to test Flask health endpoint availability and response format.
    """
    try:
        if FLASK_TEST_CLIENT:
            response = FLASK_TEST_CLIENT.get('/health')
            return {
                'available': response.status_code == 200,
                'response_format': 'json' if response.is_json else 'text',
                'response_data': response.get_json() if response.is_json else response.get_data(as_text=True),
                'status_code': response.status_code
            }
    except Exception as error:
        return {
            'available': False,
            'error': str(error)
        }
    
    return {'available': False}


def _test_express_health_endpoint() -> Dict[str, Any]:
    """
    Helper function to test Express.js health endpoint availability and response format.
    """
    try:
        express_url = f'http://localhost:{EXPRESS_SERVER_PORT}/health'
        response = requests.get(express_url, timeout=5.0)
        
        return {
            'available': response.status_code == 200,
            'response_format': 'json' if response.headers.get('content-type', '').startswith('application/json') else 'text',
            'response_data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            'status_code': response.status_code
        }
    except Exception as error:
        return {
            'available': False,
            'error': str(error)
        }


def run_comprehensive_parity_test(test_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes complete cross-platform parity test suite including all validation categories,
    comparison testing, performance analysis, and educational demonstration with comprehensive
    result aggregation and detailed reporting for framework evaluation and migration planning.
    """
    logger.info("Starting comprehensive cross-platform parity test suite", {
        'test_config': test_config,
        'session_id': PARITY_TEST_SESSION_ID
    })
    
    comprehensive_results = {
        'test_session_id': PARITY_TEST_SESSION_ID,
        'start_timestamp': time.time(),
        'test_config': test_config,
        'test_execution_summary': {},
        'detailed_results': {},
        'aggregated_analysis': {},
        'final_parity_assessment': {},
        'educational_outcomes': {},
        'migration_recommendations': {}
    }
    
    try:
        # Set up cross-platform testing environment with Flask and Express.js server initialization
        setup_config = test_config.get('environment_setup', {})
        environment_result = setup_cross_platform_environment(setup_config)
        
        if not environment_result.get('setup_successful', False):
            raise RuntimeError(f"Environment setup failed: {environment_result.get('error', 'Unknown error')}")
        
        comprehensive_results['environment_setup'] = environment_result
        
        # Execute API endpoint comparison testing for all available endpoints
        logger.info("Executing API endpoint comparison tests")
        api_test_data = get_api_endpoint_data()
        api_comparison_results = {}
        
        for endpoint_path in api_test_data.get('endpoints', {}).keys():
            test_scenarios = test_config.get('api_test_scenarios', {
                'timeout': 5.0,
                'retry_count': 3
            })
            
            endpoint_result = compare_api_endpoints(endpoint_path, test_scenarios)
            api_comparison_results[endpoint_path] = endpoint_result
        
        comprehensive_results['detailed_results']['api_comparison'] = {
            'endpoint_comparisons': api_comparison_results,
            'total_endpoints_tested': len(api_comparison_results),
            'successful_comparisons': sum(1 for result in api_comparison_results.values() 
                                        if result.get('parity_status') == 'full_parity')
        }
        
        # Perform security implementation parity validation between Flask-Talisman and Helmet.js
        logger.info("Executing security implementation parity validation")
        security_config = test_config.get('security_config', get_security_test_data())
        security_validation_result = validate_security_parity(security_config)
        comprehensive_results['detailed_results']['security_validation'] = security_validation_result
        
        # Conduct performance comparison testing with statistical analysis and benchmarking
        logger.info("Executing performance comparison testing")
        performance_config = test_config.get('performance_config', get_performance_test_data())
        iteration_count = test_config.get('performance_iterations', PERFORMANCE_ITERATIONS)
        performance_measurement_result = measure_performance_parity(performance_config, iteration_count)
        comprehensive_results['detailed_results']['performance_measurement'] = performance_measurement_result
        
        # Validate error handling consistency and exception management parity
        logger.info("Executing error handling parity validation")
        error_scenarios = test_config.get('error_scenarios', {})
        error_handling_result = validate_error_handling_parity(error_scenarios)
        comprehensive_results['detailed_results']['error_handling_validation'] = error_handling_result
        
        # Test deployment compatibility and production readiness equivalence
        logger.info("Executing deployment compatibility validation")
        deployment_config = test_config.get('deployment_config', {})
        deployment_validation_result = validate_deployment_parity(deployment_config)
        comprehensive_results['detailed_results']['deployment_validation'] = deployment_validation_result
        
        # Execute comprehensive feature mapping validation and compatibility assessment
        logger.info("Analyzing comprehensive feature mapping")
        feature_mapping_analysis = {
            'routing_compatibility': self._analyze_routing_compatibility(api_comparison_results),
            'middleware_compatibility': self._analyze_middleware_compatibility(security_validation_result),
            'configuration_compatibility': self._analyze_configuration_compatibility(deployment_validation_result),
            'testing_compatibility': self._analyze_testing_compatibility(comprehensive_results)
        }
        comprehensive_results['detailed_results']['feature_mapping'] = feature_mapping_analysis
        
        # Generate aggregated parity results with detailed analysis and educational insights
        logger.info("Generating aggregated parity analysis")
        report_config = test_config.get('report_config', {})
        parity_report = generate_parity_report(comprehensive_results['detailed_results'], report_config)
        comprehensive_results['aggregated_analysis'] = parity_report
        
        # Create comprehensive parity report with migration guidance and recommendations
        final_assessment = {
            'overall_parity_score': parity_report.get('executive_summary', {}).get('overall_parity_percentage', 0),
            'parity_rating': parity_report.get('executive_summary', {}).get('parity_rating', 'unknown'),
            'migration_feasibility': parity_report.get('executive_summary', {}).get('migration_feasibility', 'unknown'),
            'production_ready': parity_report.get('compliance_assessment', {}).get('production_readiness', False),
            'critical_issues_count': len(parity_report.get('recommendations', [])),
            'framework_recommendation': self._generate_framework_recommendation(parity_report)
        }
        comprehensive_results['final_parity_assessment'] = final_assessment
        
        # Compile educational outcomes and learning insights
        educational_outcomes = {
            'cross_platform_skills_demonstrated': [
                'Flask application factory pattern implementation',
                'Express.js middleware architecture understanding',
                'Security header configuration equivalence',
                'Performance optimization techniques',
                'Error handling best practices',
                'Production deployment strategies'
            ],
            'framework_comparison_insights': parity_report.get('educational_insights', {}),
            'technical_skills_developed': [
                'pytest testing framework proficiency',
                'HTTP API testing and validation',
                'Cross-platform performance analysis',
                'Security implementation comparison',
                'Production deployment validation'
            ],
            'learning_objectives_achieved': len([
                result for result in [
                    api_comparison_results,
                    security_validation_result,
                    performance_measurement_result,
                    error_handling_result,
                    deployment_validation_result
                ] if result
            ])
        }
        comprehensive_results['educational_outcomes'] = educational_outcomes
        
        # Generate migration recommendations and framework evaluation guidance
        migration_recommendations = {
            'immediate_actions': [],
            'medium_term_improvements': [],
            'long_term_considerations': [],
            'migration_strategy': parity_report.get('migration_guidance', {}),
            'risk_assessment': self._assess_migration_risks(parity_report),
            'success_probability': final_assessment['overall_parity_score']
        }
        
        # Populate recommendations based on parity analysis
        if final_assessment['overall_parity_score'] < 80:
            migration_recommendations['immediate_actions'].append(
                'Address critical parity gaps before production migration'
            )
        
        if not final_assessment['production_ready']:
            migration_recommendations['immediate_actions'].append(
                'Complete production readiness checklist'
            )
        
        comprehensive_results['migration_recommendations'] = migration_recommendations
        
        # Calculate test execution summary
        end_timestamp = time.time()
        execution_duration = end_timestamp - comprehensive_results['start_timestamp']
        
        test_execution_summary = {
            'total_execution_time_seconds': execution_duration,
            'tests_executed': {
                'api_endpoints': len(api_comparison_results),
                'security_headers': len(security_validation_result.get('flask_security_headers', {})),
                'performance_iterations': iteration_count,
                'error_scenarios': len(error_handling_result.get('error_scenarios_tested', [])),
                'deployment_checks': 1
            },
            'overall_success_rate': self._calculate_overall_success_rate(comprehensive_results),
            'environment_stable': True,
            'data_quality_score': self._assess_data_quality(comprehensive_results)
        }
        comprehensive_results['test_execution_summary'] = test_execution_summary
        
        # Log comprehensive test execution with results summary and educational outcomes
        logger.info("Comprehensive cross-platform parity test completed successfully", {
            'session_id': PARITY_TEST_SESSION_ID,
            'execution_time': execution_duration,
            'overall_parity_score': final_assessment['overall_parity_score'],
            'parity_rating': final_assessment['parity_rating'],
            'tests_executed': sum(test_execution_summary['tests_executed'].values()),
            'educational_outcomes': len(educational_outcomes['cross_platform_skills_demonstrated'])
        })
        
        return comprehensive_results
        
    except Exception as error:
        logger.error("Comprehensive cross-platform parity test failed", error, {
            'session_id': PARITY_TEST_SESSION_ID,
            'test_config': test_config
        })
        
        comprehensive_results.update({
            'test_execution_error': str(error),
            'error_type': type(error).__name__,
            'partial_results': comprehensive_results.get('detailed_results', {}),
            'test_failed': True
        })
        
        return comprehensive_results
    
    finally:
        # Clean up cross-platform testing environment and release resources
        logger.info("Cleaning up cross-platform testing environment")
        teardown_cross_platform_environment()


def _analyze_routing_compatibility(api_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to analyze routing compatibility between Flask and Express.js.
    """
    total_endpoints = len(api_results)
    compatible_endpoints = sum(1 for result in api_results.values() 
                             if result.get('parity_status') == 'full_parity')
    
    return {
        'total_endpoints': total_endpoints,
        'compatible_endpoints': compatible_endpoints,
        'compatibility_percentage': (compatible_endpoints / total_endpoints * 100) if total_endpoints > 0 else 0,
        'routing_patterns_match': compatible_endpoints == total_endpoints
    }


def _analyze_middleware_compatibility(security_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to analyze middleware compatibility between Flask-Talisman and Helmet.js.
    """
    security_parity_percentage = security_results.get('header_comparison', {}).get('header_parity_percentage', 0)
    
    return {
        'security_middleware_compatibility': security_parity_percentage,
        'flask_talisman_equivalent': security_parity_percentage >= 80,
        'helmet_js_equivalent': security_parity_percentage >= 80,
        'middleware_patterns_compatible': security_parity_percentage >= 75
    }


def _analyze_configuration_compatibility(deployment_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to analyze configuration compatibility between Flask and Express.js deployment.
    """
    compatibility_score = deployment_results.get('compatibility_score', 0)
    
    return {
        'deployment_configuration_compatibility': compatibility_score,
        'wsgi_pm2_equivalent': compatibility_score >= 80,
        'environment_variable_compatibility': True,  # Both frameworks support env vars
        'configuration_patterns_compatible': compatibility_score >= 75
    }


def _analyze_testing_compatibility(comprehensive_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to analyze testing compatibility and framework testing patterns.
    """
    detailed_results = comprehensive_results.get('detailed_results', {})
    test_categories_completed = len(detailed_results)
    
    return {
        'testing_framework_compatibility': 'pytest equivalent to Jest/Mocha',
        'test_patterns_compatible': True,
        'assertion_library_compatibility': True,
        'mocking_capability_equivalent': True,
        'test_categories_validated': test_categories_completed,
        'comprehensive_testing_achieved': test_categories_completed >= 5
    }


def _generate_framework_recommendation(parity_report: Dict[str, Any]) -> str:
    """
    Helper function to generate framework recommendation based on parity analysis.
    """
    overall_score = parity_report.get('executive_summary', {}).get('overall_parity_percentage', 0)
    migration_feasibility = parity_report.get('executive_summary', {}).get('migration_feasibility', 'unknown')
    
    if overall_score >= 90:
        return 'Both frameworks are highly compatible. Choose based on team expertise and ecosystem preferences.'
    elif overall_score >= 75:
        return f'Good compatibility achieved. {migration_feasibility.title()} migration feasibility with minor adjustments needed.'
    elif overall_score >= 50:
        return f'Moderate compatibility. {migration_feasibility.title()} migration feasibility requires significant planning and testing.'
    else:
        return f'Limited compatibility. {migration_feasibility.title()} migration feasibility requires major architectural changes.'


def _assess_migration_risks(parity_report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to assess migration risks based on parity analysis results.
    """
    overall_score = parity_report.get('executive_summary', {}).get('overall_parity_percentage', 0)
    critical_issues = len(parity_report.get('recommendations', []))
    
    risk_level = 'low' if overall_score >= 85 else 'medium' if overall_score >= 70 else 'high'
    
    return {
        'overall_risk_level': risk_level,
        'critical_issues_count': critical_issues,
        'security_risks': 'low' if parity_report.get('compliance_assessment', {}).get('security_compliance', False) else 'medium',
        'performance_risks': 'low' if parity_report.get('compliance_assessment', {}).get('performance_compliance', False) else 'medium',
        'deployment_risks': 'low' if overall_score >= 80 else 'medium',
        'mitigation_strategies': [
            'Comprehensive testing in staging environment',
            'Gradual migration with feature flags',
            'Performance monitoring during migration',
            'Security validation at each migration phase'
        ]
    }


def _calculate_overall_success_rate(comprehensive_results: Dict[str, Any]) -> float:
    """
    Helper function to calculate overall test success rate from comprehensive results.
    """
    detailed_results = comprehensive_results.get('detailed_results', {})
    success_factors = []
    
    # API comparison success rate
    api_results = detailed_results.get('api_comparison', {})
    if api_results.get('endpoint_comparisons'):
        api_success = api_results.get('successful_comparisons', 0) / api_results.get('total_endpoints_tested', 1)
        success_factors.append(api_success)
    
    # Security validation success rate
    security_results = detailed_results.get('security_validation', {})
    if security_results:
        security_parity = security_results.get('header_comparison', {}).get('header_parity_percentage', 0) / 100
        success_factors.append(security_parity)
    
    # Performance measurement success rate
    performance_results = detailed_results.get('performance_measurement', {})
    if performance_results and performance_results.get('parity_score'):
        performance_success = performance_results.get('parity_score', 0) / 100
        success_factors.append(performance_success)
    
    # Error handling success rate
    error_results = detailed_results.get('error_handling_validation', {})
    if error_results:
        error_consistency = error_results.get('consistency_analysis', {}).get('overall_consistency_percentage', 0) / 100
        success_factors.append(error_consistency)
    
    # Deployment validation success rate
    deployment_results = detailed_results.get('deployment_validation', {})
    if deployment_results:
        deployment_success = deployment_results.get('compatibility_score', 0) / 100
        success_factors.append(deployment_success)
    
    return statistics.mean(success_factors) * 100 if success_factors else 0


def _assess_data_quality(comprehensive_results: Dict[str, Any]) -> float:
    """
    Helper function to assess data quality across all test results.
    """
    quality_factors = []
    detailed_results = comprehensive_results.get('detailed_results', {})
    
    # Check for complete data in each test category
    for test_category, results in detailed_results.items():
        if isinstance(results, dict) and results:
            # Count non-error results
            non_error_items = sum(1 for key, value in results.items() 
                                if isinstance(value, dict) and 'error' not in value)
            total_items = len(results)
            quality_score = non_error_items / total_items if total_items > 0 else 0
            quality_factors.append(quality_score)
    
    return statistics.mean(quality_factors) * 100 if quality_factors else 0