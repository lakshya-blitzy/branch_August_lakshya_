"""
Flask CORS (Cross-Origin Resource Sharing) Middleware Implementation

This module provides comprehensive Flask CORS middleware equivalent to Express.js CORS 
middleware with Flask-CORS integration, environment-aware security policies, and WSGI 
production deployment compatibility. Features dynamic origin validation, environment-specific 
CORS policies from permissive development to strict production security, comprehensive 
violation logging, and educational demonstration of modern web security standards.

Supports Flask-Talisman security integration, request correlation tracking, and complete 
feature parity with Express.js CORS implementation for consistent API behavior and 
educational cross-platform comparison.

Educational Focus:
- Flask-CORS middleware integration patterns equivalent to Express.js CORS middleware
- Cross-platform CORS development maintaining complete feature parity
- Environment-aware CORS configuration from development to production
- Flask security implementation using Flask-CORS with Flask-Talisman integration
- WSGI deployment CORS coordination equivalent to PM2 cluster mode
- Comprehensive CORS security logging and violation tracking

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for educational reference
import os  # built-in - Operating system interface for environment variables equivalent to Node.js process.env
import re  # built-in - Regular expression module for origin pattern matching and domain validation
import functools  # built-in - Function utilities for CORS middleware decorator creation and composition
import datetime  # built-in - Date and time utilities for timezone-aware Flask logging equivalent to Node.js Date
import uuid  # built-in - UUID generation for request correlation IDs equivalent to Node.js crypto.randomUUID
import time  # built-in - High-precision timing for performance measurement equivalent to Node.js process.hrtime
import json  # built-in - JSON serialization for structured log output equivalent to Node.js JSON
from typing import Dict, Any, Optional, Union, Callable, List, Tuple  # built-in - Type hints for Flask functions

# Flask framework imports with version comments for Flask 3.1.1 compatibility
from flask import Flask, request, g, current_app  # ^3.1.1 - Core Flask components for request context access
from flask_cors import CORS  # ^5.0.0 - Flask-CORS extension for comprehensive cross-origin resource sharing

# Internal imports for Flask configuration and cross-platform compatibility
from ..config import Config, get_cors_origins, ENVIRONMENT  # Flask configuration classes for environment-specific CORS policies
from ..utils.constants import (
    SECURITY_CONSTANTS,  # Security constants for Flask-CORS configuration and Flask-Talisman integration
    HTTP_CONSTANTS,  # HTTP constants for Flask request/response logging and method validation
    EXPRESS_CONSTANTS  # Express.js compatibility constants for educational cross-platform comparison
)
from ..utils.logger import logger  # Flask logger for CORS configuration events and security violations

# Global Flask CORS middleware state management for WSGI deployment compatibility
CORS_MIDDLEWARE_VERSION = '1.0.0'
CORS_VIOLATION_COUNTER = {}
DEFAULT_CORS_OPTIONS = {'supports_credentials': False, 'intercept_exceptions': True}
CORS_MIDDLEWARE_INITIALIZED = False
CROSS_PLATFORM_PARITY_MODE = True


class CORSMiddleware:
    """
    Comprehensive Flask CORS middleware class that provides cross-origin resource sharing 
    functionality equivalent to Express.js CORS middleware. Integrates Flask-CORS with Flask 
    application factory pattern, environment-specific security policies, and production 
    deployment capabilities.
    
    Features dynamic origin validation, comprehensive logging, security integration with 
    Flask-Talisman, and educational cross-platform compatibility demonstration. Supports 
    WSGI deployment with multi-worker coordination and performance optimization for 
    high-traffic production environments.
    
    This class provides thread-safe CORS middleware for Flask applications with automatic 
    environment detection, security policy enforcement, and comprehensive monitoring 
    equivalent to Express.js CORS middleware for complete feature parity.
    """
    
    def __init__(self, app: Flask = None, config: Dict[str, Any] = None) -> None:
        """
        Initializes Flask CORS middleware with environment-specific configuration, security 
        policies, and comprehensive monitoring capabilities equivalent to Express.js CORS 
        middleware setup.
        
        Args:
            app: Flask application instance for CORS middleware integration
            config: CORS configuration dictionary with security policies and options
        """
        # Initialize Flask application reference and CORS configuration parameters
        self.app = app
        self.config = config or {}
        
        # Set up Flask-CORS instance and environment-specific configuration
        self.cors_instance = None
        self.cors_options = {}
        self.environment = ENVIRONMENT
        
        # Initialize Flask CORS middleware state management and monitoring
        self.is_initialized = False
        self.violation_stats = {}
        self.performance_metrics = {}
        self.security_policies = {}
        
        # Load environment-specific CORS configuration from Flask configuration classes
        self._load_environment_configuration()
        
        # Set up Flask-CORS instance with security policies and origin validation
        self._initialize_cors_configuration()
        
        # Configure integration with Flask-Talisman security middleware
        self._setup_security_integration()
        
        # Initialize performance monitoring and metrics collection for production deployment
        self._initialize_performance_monitoring()
        
        # Apply Flask CORS middleware to application if provided during initialization
        if app is not None:
            self.apply_to_app(app)
        
        # Log Flask CORS middleware initialization with configuration summary
        logger.info("Flask CORS middleware initialized", {
            'environment': self.environment,
            'cors_options': self._sanitize_config_for_logging(self.cors_options),
            'security_policies': list(self.security_policies.keys()),
            'performance_monitoring': True
        })
    
    def _load_environment_configuration(self) -> None:
        """
        Loads environment-specific CORS configuration from Flask configuration classes 
        and security constants for appropriate policy selection and enforcement.
        """
        # Load Flask configuration CORS settings for environment-specific policies
        flask_config = Config()
        cors_config = getattr(flask_config, 'CORS_CONFIG', {})
        
        # Extract environment-specific origin policies using get_cors_origins utility
        allowed_origins = get_cors_origins()
        
        # Apply security constants for Flask-CORS configuration and Flask-Talisman integration
        security_config = SECURITY_CONSTANTS.get('CORS_CONFIG', {})
        
        # Merge configuration sources with environment-specific overrides and security policies
        self.config.update({
            'environment': self.environment,
            'allowed_origins': allowed_origins,
            'security_config': security_config,
            'flask_config': cors_config
        })
        
        # Configure Express.js compatibility constants for educational cross-platform comparison
        express_mapping = EXPRESS_CONSTANTS.get('MIDDLEWARE_EQUIVALENT', {})
        cors_mapping = express_mapping.get('cors_middleware', {})
        
        # Set up cross-platform feature parity validation and response format consistency
        self.config.update({
            'express_compatibility': cors_mapping,
            'cross_platform_mode': CROSS_PLATFORM_PARITY_MODE,
            'feature_parity_validation': True
        })
    
    def _initialize_cors_configuration(self) -> None:
        """
        Initializes Flask-CORS configuration with environment-specific policies, security 
        settings, and performance optimization based on deployment requirements.
        """
        # Create base CORS options from DEFAULT_CORS_OPTIONS and environment configuration
        self.cors_options = DEFAULT_CORS_OPTIONS.copy()
        
        # Configure environment-specific CORS policies using create_cors_options factory
        environment_options = create_cors_options(self.environment, self.config)
        self.cors_options.update(environment_options)
        
        # Set up origin validation patterns using regex matching for security enforcement
        origins_config = self.config.get('allowed_origins', [])
        if isinstance(origins_config, list):
            self.cors_options['origins'] = origins_config
        else:
            self.cors_options['origins'] = [origins_config] if origins_config else ['*']
        
        # Configure allowed methods and headers based on security requirements and API needs
        self.cors_options.update({
            'methods': self.config.get('allowed_methods', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
            'allow_headers': self.config.get('allowed_headers', ['Content-Type', 'Authorization', 'X-Requested-With']),
            'expose_headers': self.config.get('expose_headers', ['X-Total-Count', 'X-Request-ID'])
        })
        
        # Apply performance optimization settings for WSGI deployment and high-traffic environments
        if self.environment == 'production':
            self.cors_options.update({
                'max_age': 3600,  # Preflight cache duration for performance optimization
                'vary_header': True,  # Proper Vary header handling for caching
                'automatic_options': True  # Automatic OPTIONS method handling
            })
        
        # Configure development-specific settings for debugging and educational purposes
        elif self.environment == 'development':
            self.cors_options.update({
                'max_age': 86400,  # Longer cache for development convenience
                'send_wildcard': True,  # Permissive origin handling for development
                'automatic_options': True  # Enhanced debugging with automatic OPTIONS
            })
    
    def _setup_security_integration(self) -> None:
        """
        Sets up security integration with Flask-Talisman middleware and comprehensive 
        security policy enforcement for coordinated HTTP security protection.
        """
        # Load Flask-Talisman security policies from SECURITY_CONSTANTS configuration
        talisman_config = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
        helmet_equivalent = SECURITY_CONSTANTS.get('HELMET_EQUIVALENT_CONFIG', {})
        
        # Configure CORS integration with Flask-Talisman security headers and policies
        self.security_policies = {
            'talisman_integration': talisman_config,
            'helmet_equivalent': helmet_equivalent,
            'cors_security_headers': SECURITY_CONSTANTS.get('SECURITY_HEADERS', {}),
            'violation_tracking': True,
            'security_logging': True
        }
        
        # Set up security event tracking and violation monitoring for comprehensive audit
        self.violation_stats = {
            'origin_violations': 0,
            'method_violations': 0,
            'header_violations': 0,
            'preflight_violations': 0,
            'total_violations': 0
        }
        
        # Configure security validation patterns for origin checking and policy enforcement
        security_patterns = {
            'trusted_origins': self._compile_origin_patterns(self.cors_options.get('origins', [])),
            'allowed_methods': set(self.cors_options.get('methods', [])),
            'security_headers': set(SECURITY_CONSTANTS.get('REQUIRED_HEADERS', []))
        }
        
        self.security_policies['validation_patterns'] = security_patterns
    
    def _initialize_performance_monitoring(self) -> None:
        """
        Initializes performance monitoring and metrics collection for CORS middleware 
        optimization and production deployment analysis with WSGI compatibility.
        """
        # Set up performance metrics collection for request processing and response timing
        self.performance_metrics = {
            'request_count': 0,
            'preflight_count': 0,
            'violation_count': 0,
            'average_response_time': 0.0,
            'cache_hit_rate': 0.0,
            'initialization_time': time.time()
        }
        
        # Configure performance optimization settings for high-traffic environments
        optimization_config = {
            'origin_validation_cache': {},
            'preflight_cache': {},
            'performance_tracking': True,
            'wsgi_optimization': True
        }
        
        self.config.update({
            'performance_optimization': optimization_config,
            'monitoring_enabled': True,
            'metrics_collection': True
        })
    
    def apply_to_app(self, app: Flask) -> Flask:
        """
        Applies Flask-CORS middleware to Flask application instance with comprehensive 
        configuration, security integration, and monitoring setup equivalent to Express.js 
        CORS middleware application.
        
        Args:
            app: Flask application instance for CORS middleware integration
            
        Returns:
            Flask application with CORS middleware applied providing cross-origin protection
        """
        # Validate Flask application instance and CORS configuration parameters
        if not isinstance(app, Flask):
            raise TypeError("Expected Flask application instance for CORS middleware integration")
        
        # Store Flask application reference and update application context
        self.app = app
        
        # Configure Flask-CORS instance with environment-specific policies and security settings
        try:
            self.cors_instance = CORS(app, **self.cors_options)
            logger.info("Flask-CORS instance created successfully", {
                'cors_options': self._sanitize_config_for_logging(self.cors_options)
            })
        except Exception as error:
            logger.error("Failed to initialize Flask-CORS instance", error, {
                'cors_options': self.cors_options,
                'app_name': app.name
            })
            raise
        
        # Set up CORS violation logging and security event tracking
        self._setup_violation_tracking(app)
        
        # Configure integration with Flask-Talisman security middleware
        self._configure_talisman_integration(app)
        
        # Initialize performance monitoring and metrics collection
        self._setup_performance_monitoring(app)
        
        # Set up error handling and sanitization for CORS violations
        self._configure_error_handling(app)
        
        # Mark CORS middleware as initialized and ready for production deployment
        self.is_initialized = True
        global CORS_MIDDLEWARE_INITIALIZED
        CORS_MIDDLEWARE_INITIALIZED = True
        
        # Log successful CORS middleware application with configuration validation
        logger.info("Flask CORS middleware applied successfully", {
            'app_name': app.name,
            'environment': self.environment,
            'security_integration': bool(self.security_policies),
            'performance_monitoring': bool(self.performance_metrics)
        })
        
        return app
    
    def configure_origins(self, custom_origins: List[str] = None) -> Dict[str, Any]:
        """
        Configures CORS origin policies based on environment and security requirements 
        including dynamic origin validation, pattern matching, and comprehensive security 
        enforcement for cross-origin access control.
        
        Args:
            custom_origins: List of custom origin patterns for origin validation
            
        Returns:
            Origin configuration with validation patterns and security policies
        """
        # Load environment-specific origin policies from Flask configuration
        base_origins = get_cors_origins() or []
        
        # Parse and validate custom origins for proper format and security compliance
        if custom_origins:
            validated_origins = self._validate_origin_list(custom_origins)
            origins = list(set(base_origins + validated_origins))
        else:
            origins = base_origins
        
        # Configure regex patterns for dynamic origin validation and domain matching
        origin_patterns = self._compile_origin_patterns(origins)
        
        # Apply environment-specific security policies for origin validation
        security_config = {
            'strict_validation': self.environment == 'production',
            'wildcard_allowed': self.environment == 'development',
            'subdomain_matching': True,
            'case_sensitive': False
        }
        
        # Set up origin validation caching for improved performance
        validation_cache = self.config.get('performance_optimization', {}).get('origin_validation_cache', {})
        
        # Configure comprehensive origin configuration for Flask-CORS integration
        origin_config = {
            'origins': origins,
            'patterns': origin_patterns,
            'security': security_config,
            'cache': validation_cache,
            'validation_function': self._create_origin_validator(origin_patterns, security_config)
        }
        
        # Update CORS options with new origin configuration
        self.cors_options['origins'] = origins
        
        # Log origin configuration update with security validation
        logger.info("CORS origins configured", {
            'origin_count': len(origins),
            'security_config': security_config,
            'cache_enabled': bool(validation_cache)
        })
        
        return origin_config
    
    def handle_preflight(self, request_obj: Any) -> Dict[str, Any]:
        """
        Handles CORS preflight requests with comprehensive validation, security checking, 
        and optimized response generation including caching and performance optimization 
        for production environments.
        
        Args:
            request_obj: Flask request object for preflight validation
            
        Returns:
            CORS preflight response with appropriate headers and security validation
        """
        # Extract preflight request details for comprehensive validation
        origin = request_obj.headers.get('Origin')
        method = request_obj.headers.get('Access-Control-Request-Method')
        headers = request_obj.headers.get('Access-Control-Request-Headers', '')
        
        # Generate request correlation ID for preflight tracking and debugging
        correlation_id = self._generate_correlation_id()
        g.request_id = correlation_id
        
        # Validate preflight request origin against configured security policies
        origin_valid = self._validate_origin(origin)
        if not origin_valid:
            self._log_cors_violation('preflight_origin_violation', {
                'origin': origin,
                'correlation_id': correlation_id,
                'validation_result': 'origin_rejected'
            })
            return self._create_preflight_error_response('Invalid origin', 403)
        
        # Check requested methods against allowed methods configuration
        method_valid = self._validate_method(method)
        if not method_valid:
            self._log_cors_violation('preflight_method_violation', {
                'method': method,
                'correlation_id': correlation_id,
                'allowed_methods': self.cors_options.get('methods', [])
            })
            return self._create_preflight_error_response('Method not allowed', 405)
        
        # Validate request headers against allowed headers configuration
        headers_valid = self._validate_headers(headers)
        if not headers_valid:
            self._log_cors_violation('preflight_headers_violation', {
                'headers': headers,
                'correlation_id': correlation_id,
                'allowed_headers': self.cors_options.get('allow_headers', [])
            })
            return self._create_preflight_error_response('Headers not allowed', 400)
        
        # Generate appropriate CORS response headers based on security policies
        response_headers = self._generate_preflight_headers(origin, method, headers)
        
        # Configure preflight response caching for performance optimization
        cache_duration = self.cors_options.get('max_age', 3600)
        response_headers['Access-Control-Max-Age'] = str(cache_duration)
        
        # Update preflight metrics and performance tracking
        self.performance_metrics['preflight_count'] += 1
        self._update_performance_metrics('preflight_success', {
            'origin': origin,
            'method': method,
            'headers': headers
        })
        
        # Log successful preflight request handling with security validation
        logger.info("CORS preflight handled successfully", {
            'correlation_id': correlation_id,
            'origin': origin,
            'method': method,
            'headers': headers,
            'cache_duration': cache_duration
        })
        
        # Return optimized preflight response with comprehensive security headers
        return {
            'status_code': 200,
            'headers': response_headers,
            'correlation_id': correlation_id,
            'cache_duration': cache_duration
        }
    
    def validate_request(self, request_obj: Any) -> Dict[str, Any]:
        """
        Validates incoming CORS requests against security policies including comprehensive 
        origin checking, method validation, header analysis, and credentials verification 
        for complete security enforcement.
        
        Args:
            request_obj: Flask request object for comprehensive validation
            
        Returns:
            Request validation result with security status and recommendations
        """
        # Extract request origin, method, and headers for security validation
        origin = request_obj.headers.get('Origin')
        method = request_obj.method
        headers = dict(request_obj.headers)
        
        # Generate correlation ID for request tracking and debugging
        correlation_id = self._generate_correlation_id()
        g.request_id = correlation_id
        
        # Initialize comprehensive validation result with security context
        validation_result = {
            'correlation_id': correlation_id,
            'origin': origin,
            'method': method,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'valid': True,
            'violations': [],
            'security_recommendations': []
        }
        
        # Validate origin against environment-specific whitelist and security policies
        if origin:
            origin_validation = self._validate_origin_comprehensive(origin)
            validation_result.update(origin_validation)
            
            if not origin_validation['valid']:
                validation_result['valid'] = False
                validation_result['violations'].append('origin_validation_failed')
        
        # Check HTTP method against allowed methods configuration and API requirements
        method_validation = self._validate_method_comprehensive(method)
        validation_result.update(method_validation)
        
        if not method_validation['valid']:
            validation_result['valid'] = False
            validation_result['violations'].append('method_validation_failed')
        
        # Validate request headers against security policies and allowed headers
        headers_validation = self._validate_headers_comprehensive(headers)
        validation_result.update(headers_validation)
        
        if not headers_validation['valid']:
            validation_result['valid'] = False
            validation_result['violations'].append('headers_validation_failed')
        
        # Verify credentials handling compliance with HTTPS enforcement
        credentials_validation = self._validate_credentials_handling(request_obj)
        validation_result.update(credentials_validation)
        
        if not credentials_validation['valid']:
            validation_result['valid'] = False
            validation_result['violations'].append('credentials_validation_failed')
        
        # Generate comprehensive security recommendations based on validation results
        if validation_result['violations']:
            recommendations = self._generate_security_recommendations(validation_result['violations'])
            validation_result['security_recommendations'] = recommendations
        
        # Log validation results and security violations for monitoring
        if validation_result['valid']:
            logger.info("CORS request validated successfully", validation_result)
        else:
            logger.warning("CORS request validation failed", validation_result)
            self._log_cors_violation('request_validation_failed', validation_result)
        
        # Update request validation metrics and tracking
        self.performance_metrics['request_count'] += 1
        if not validation_result['valid']:
            self.performance_metrics['violation_count'] += 1
        
        return validation_result
    
    def get_cors_status(self) -> Dict[str, Any]:
        """
        Returns comprehensive CORS middleware status including configuration details, 
        security metrics, performance data, and educational information for monitoring 
        and learning assessment.
        
        Returns:
            Complete CORS status report with configuration, metrics, and educational content
        """
        # Collect current CORS configuration including origin policies and methods
        configuration_status = {
            'version': CORS_MIDDLEWARE_VERSION,
            'environment': self.environment,
            'initialized': self.is_initialized,
            'cors_options': self._sanitize_config_for_logging(self.cors_options),
            'security_policies': list(self.security_policies.keys()),
            'performance_optimization': bool(self.config.get('performance_optimization'))
        }
        
        # Gather security metrics including violation statistics and policy enforcement
        security_status = {
            'violation_stats': self.violation_stats.copy(),
            'security_integration': {
                'talisman_enabled': bool(self.security_policies.get('talisman_integration')),
                'helmet_equivalent': bool(self.security_policies.get('helmet_equivalent')),
                'violation_tracking': self.security_policies.get('violation_tracking', False)
            },
            'origin_validation': {
                'patterns_configured': len(self.security_policies.get('validation_patterns', {}).get('trusted_origins', [])),
                'strict_validation': self.environment == 'production'
            }
        }
        
        # Include performance metrics and optimization status
        performance_status = {
            'metrics': self.performance_metrics.copy(),
            'optimization': {
                'caching_enabled': bool(self.config.get('performance_optimization', {}).get('origin_validation_cache')),
                'wsgi_optimization': self.config.get('performance_optimization', {}).get('wsgi_optimization', False),
                'preflight_caching': bool(self.cors_options.get('max_age'))
            }
        }
        
        # Add cross-platform compatibility status for educational comparison
        compatibility_status = {
            'express_compatibility': self.config.get('cross_platform_mode', False),
            'feature_parity_validation': self.config.get('feature_parity_validation', False),
            'educational_mode': CROSS_PLATFORM_PARITY_MODE
        }
        
        # Generate educational content explaining CORS concepts and Flask implementation
        educational_content = {
            'cors_concepts': {
                'origin_validation': 'Cross-origin request source verification',
                'preflight_requests': 'OPTIONS request handling for complex CORS requests',
                'security_headers': 'HTTP headers for cross-origin access control'
            },
            'flask_cors_benefits': {
                'middleware_integration': 'Seamless Flask application factory pattern support',
                'security_enforcement': 'Environment-specific security policy enforcement',
                'production_optimization': 'WSGI deployment compatibility and performance optimization'
            }
        }
        
        # Include troubleshooting guidance for common CORS issues
        troubleshooting_info = {
            'common_issues': {
                'origin_mismatch': 'Verify origin configuration matches request source',
                'method_not_allowed': 'Check allowed methods configuration',
                'headers_blocked': 'Validate allowed headers configuration',
                'credentials_error': 'Ensure HTTPS for credential-enabled requests'
            },
            'debugging_tips': {
                'enable_debug_logging': 'Set FLASK_ENV=development for detailed logging',
                'check_request_headers': 'Inspect browser network tab for CORS headers',
                'validate_configuration': 'Use get_cors_status() for configuration review'
            }
        }
        
        # Compile comprehensive CORS status report
        status_report = {
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'configuration': configuration_status,
            'security': security_status,
            'performance': performance_status,
            'compatibility': compatibility_status,
            'educational': educational_content,
            'troubleshooting': troubleshooting_info,
            'status': 'operational' if self.is_initialized else 'not_initialized'
        }
        
        return status_report
    
    def update_configuration(self, new_config: Dict[str, Any]) -> bool:
        """
        Updates CORS middleware configuration dynamically including origin policies, 
        security settings, and performance parameters for runtime configuration management.
        
        Args:
            new_config: New CORS configuration dictionary with updated settings
            
        Returns:
            True if configuration update successful, False if validation failed
        """
        try:
            # Validate new CORS configuration parameters for security compliance
            validation_result = self._validate_configuration(new_config)
            if not validation_result['valid']:
                logger.error("CORS configuration validation failed", None, {
                    'validation_errors': validation_result['errors'],
                    'provided_config': new_config
                })
                return False
            
            # Backup current configuration for rollback capability
            backup_config = {
                'cors_options': self.cors_options.copy(),
                'config': self.config.copy(),
                'security_policies': self.security_policies.copy()
            }
            
            # Update origin policies and validation patterns while maintaining security
            if 'origins' in new_config:
                origins_config = self.configure_origins(new_config['origins'])
                self.config['origins_config'] = origins_config
            
            # Refresh allowed methods and headers configuration
            if 'methods' in new_config:
                self.cors_options['methods'] = new_config['methods']
            
            if 'headers' in new_config:
                self.cors_options['allow_headers'] = new_config['headers']
            
            # Update security integration with Flask-Talisman middleware
            if 'security_policies' in new_config:
                self.security_policies.update(new_config['security_policies'])
            
            # Refresh performance optimization settings and caching configuration
            if 'performance_optimization' in new_config:
                performance_config = self.config.get('performance_optimization', {})
                performance_config.update(new_config['performance_optimization'])
                self.config['performance_optimization'] = performance_config
            
            # Apply updated configuration to Flask-CORS instance if available
            if self.cors_instance and self.app:
                try:
                    # Reinitialize Flask-CORS with updated configuration
                    self.cors_instance = CORS(self.app, **self.cors_options)
                except Exception as error:
                    # Rollback configuration on Flask-CORS initialization failure
                    self.cors_options = backup_config['cors_options']
                    self.config = backup_config['config']
                    self.security_policies = backup_config['security_policies']
                    
                    logger.error("Flask-CORS reinitialization failed, configuration rolled back", error, {
                        'attempted_config': new_config
                    })
                    return False
            
            # Validate updated configuration integrity and cross-platform compatibility
            integrity_check = self._validate_configuration_integrity()
            if not integrity_check['valid']:
                logger.warning("Configuration integrity check warnings", {
                    'warnings': integrity_check['warnings']
                })
            
            # Log successful configuration update with changes summary
            logger.info("CORS configuration updated successfully", {
                'updated_fields': list(new_config.keys()),
                'integrity_check': integrity_check['valid'],
                'cors_instance_reinitialized': bool(self.cors_instance)
            })
            
            return True
            
        except Exception as error:
            logger.error("CORS configuration update failed", error, {
                'attempted_config': new_config
            })
            return False
    
    def log_violation(self, violation_type: str, violation_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Logs CORS security violations with comprehensive context, correlation tracking, 
        and security event management for monitoring, compliance, and incident response.
        
        Args:
            violation_type: Security violation type classification
            violation_context: Violation context dictionary with security event details
            
        Returns:
            Violation logging result with correlation ID and security event details
        """
        # Generate correlation ID for violation tracking across WSGI workers
        correlation_id = violation_context.get('correlation_id') or self._generate_correlation_id()
        
        # Classify violation type and determine appropriate security response level
        violation_classification = self._classify_violation_severity(violation_type)
        
        # Extract and sanitize violation context for security logging
        sanitized_context = self._sanitize_violation_context(violation_context)
        
        # Format security event with structured output for monitoring systems
        security_event = {
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'correlation_id': correlation_id,
            'violation_type': violation_type,
            'classification': violation_classification,
            'severity': violation_classification['severity'],
            'context': sanitized_context,
            'environment': self.environment,
            'middleware_version': CORS_MIDDLEWARE_VERSION
        }
        
        # Update violation statistics and security metrics for trending
        self._update_violation_statistics(violation_type)
        
        # Trigger security alerts if violation thresholds exceed configured limits
        if self._should_trigger_security_alert(violation_type):
            self._trigger_security_alert(violation_type, security_event)
        
        # Log violation using appropriate security logging method
        if violation_classification['severity'] == 'high':
            logger.error(f"High severity CORS violation: {violation_type}", None, security_event)
        elif violation_classification['severity'] == 'medium':
            logger.warning(f"Medium severity CORS violation: {violation_type}", security_event)
        else:
            logger.info(f"Low severity CORS violation: {violation_type}", security_event)
        
        # Log to specialized security event tracking if configured
        if self.security_policies.get('security_logging'):
            logger.log_security_event(violation_type, security_event)
        
        # Return logging result with correlation tracking for security management
        return {
            'correlation_id': correlation_id,
            'logged': True,
            'classification': violation_classification,
            'alert_triggered': self._should_trigger_security_alert(violation_type),
            'timestamp': security_event['timestamp']
        }
    
    # Helper methods for internal CORS middleware operations
    
    def _compile_origin_patterns(self, origins: List[str]) -> List[Any]:
        """
        Compiles origin patterns into regex objects for efficient origin validation.
        """
        patterns = []
        for origin in origins:
            if origin == '*':
                continue  # Wildcard handled separately
            
            # Escape special regex characters and convert to pattern
            pattern = re.escape(origin).replace(r'\*', '.*')
            patterns.append(re.compile(f'^{pattern}$', re.IGNORECASE))
        
        return patterns
    
    def _validate_origin_list(self, origins: List[str]) -> List[str]:
        """
        Validates and sanitizes origin list for security compliance.
        """
        validated = []
        for origin in origins:
            if isinstance(origin, str) and origin.strip():
                # Basic URL validation for origin format
                if origin == '*' or origin.startswith(('http://', 'https://')):
                    validated.append(origin.strip())
        
        return validated
    
    def _create_origin_validator(self, patterns: List[Any], security_config: Dict[str, Any]) -> Callable:
        """
        Creates origin validation function based on patterns and security configuration.
        """
        def validate_origin(origin: str) -> bool:
            if not origin:
                return False
            
            # Check wildcard allowance for development environments
            if security_config.get('wildcard_allowed') and '*' in self.cors_options.get('origins', []):
                return True
            
            # Validate against compiled regex patterns
            for pattern in patterns:
                if pattern.match(origin):
                    return True
            
            return False
        
        return validate_origin
    
    def _validate_origin(self, origin: str) -> bool:
        """
        Validates single origin against configured patterns and security policies.
        """
        if not origin:
            return False
        
        origins = self.cors_options.get('origins', [])
        
        # Check for wildcard permission
        if '*' in origins:
            return True
        
        # Check exact match
        if origin in origins:
            return True
        
        # Check regex patterns if configured
        patterns = self.security_policies.get('validation_patterns', {}).get('trusted_origins', [])
        for pattern in patterns:
            if pattern.match(origin):
                return True
        
        return False
    
    def _validate_method(self, method: str) -> bool:
        """
        Validates HTTP method against allowed methods configuration.
        """
        if not method:
            return False
        
        allowed_methods = self.cors_options.get('methods', [])
        return method.upper() in [m.upper() for m in allowed_methods]
    
    def _validate_headers(self, headers: str) -> bool:
        """
        Validates request headers against allowed headers configuration.
        """
        if not headers:
            return True  # No headers to validate
        
        header_list = [h.strip().lower() for h in headers.split(',')]
        allowed_headers = [h.lower() for h in self.cors_options.get('allow_headers', [])]
        
        return all(header in allowed_headers for header in header_list)
    
    def _validate_origin_comprehensive(self, origin: str) -> Dict[str, Any]:
        """
        Performs comprehensive origin validation with detailed results.
        """
        result = {
            'valid': False,
            'origin': origin,
            'validation_details': {}
        }
        
        if self._validate_origin(origin):
            result['valid'] = True
            result['validation_details']['matched_pattern'] = 'origin_validated'
        else:
            result['validation_details']['rejection_reason'] = 'origin_not_in_whitelist'
        
        return result
    
    def _validate_method_comprehensive(self, method: str) -> Dict[str, Any]:
        """
        Performs comprehensive method validation with detailed results.
        """
        result = {
            'valid': False,
            'method': method,
            'validation_details': {}
        }
        
        if self._validate_method(method):
            result['valid'] = True
            result['validation_details']['allowed'] = True
        else:
            result['validation_details']['rejection_reason'] = 'method_not_allowed'
            result['validation_details']['allowed_methods'] = self.cors_options.get('methods', [])
        
        return result
    
    def _validate_headers_comprehensive(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """
        Performs comprehensive headers validation with detailed results.
        """
        result = {
            'valid': True,
            'headers': headers,
            'validation_details': {}
        }
        
        # Check for CORS-specific headers
        cors_headers = headers.get('Access-Control-Request-Headers', '')
        if cors_headers and not self._validate_headers(cors_headers):
            result['valid'] = False
            result['validation_details']['rejected_headers'] = cors_headers
        
        return result
    
    def _validate_credentials_handling(self, request_obj: Any) -> Dict[str, Any]:
        """
        Validates credentials handling compliance with security requirements.
        """
        result = {
            'valid': True,
            'validation_details': {}
        }
        
        # Check HTTPS requirement for credential requests in production
        if self.environment == 'production':
            if request_obj.headers.get('Access-Control-Request-Credentials'):
                if not request_obj.is_secure:
                    result['valid'] = False
                    result['validation_details']['https_required'] = True
        
        return result
    
    def _generate_preflight_headers(self, origin: str, method: str, headers: str) -> Dict[str, str]:
        """
        Generates appropriate CORS preflight response headers.
        """
        response_headers = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': method,
            'Access-Control-Allow-Headers': headers or '',
            'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
        }
        
        # Add credentials support if configured
        if self.cors_options.get('supports_credentials'):
            response_headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response_headers
    
    def _create_preflight_error_response(self, message: str, status_code: int) -> Dict[str, Any]:
        """
        Creates error response for failed preflight requests.
        """
        return {
            'status_code': status_code,
            'message': message,
            'headers': {'Content-Type': 'application/json'},
            'error': True
        }
    
    def _generate_correlation_id(self) -> str:
        """
        Generates unique correlation ID for request tracking.
        """
        return f"cors_{uuid.uuid4().hex[:8]}_{int(time.time() * 1000)}"
    
    def _log_cors_violation(self, violation_type: str, context: Dict[str, Any]) -> None:
        """
        Logs CORS violation with security event tracking.
        """
        self.log_violation(violation_type, context)
    
    def _sanitize_config_for_logging(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes configuration for safe logging without exposing sensitive data.
        """
        sanitized = {}
        for key, value in config.items():
            if 'secret' in key.lower() or 'password' in key.lower():
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_config_for_logging(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _setup_violation_tracking(self, app: Flask) -> None:
        """
        Sets up violation tracking and monitoring for the Flask application.
        """
        # Initialize violation tracking in application context
        if not hasattr(app, 'cors_violations'):
            app.cors_violations = {}
    
    def _configure_talisman_integration(self, app: Flask) -> None:
        """
        Configures integration with Flask-Talisman security middleware.
        """
        # Check if Flask-Talisman is available and configure integration
        try:
            talisman_config = self.security_policies.get('talisman_integration', {})
            if talisman_config:
                logger.info("Flask-Talisman integration configured", {
                    'talisman_config': talisman_config
                })
        except ImportError:
            logger.warning("Flask-Talisman not available, skipping integration")
    
    def _setup_performance_monitoring(self, app: Flask) -> None:
        """
        Sets up performance monitoring for CORS middleware.
        """
        # Initialize performance monitoring in application context
        if not hasattr(app, 'cors_performance'):
            app.cors_performance = self.performance_metrics
    
    def _configure_error_handling(self, app: Flask) -> None:
        """
        Configures error handling for CORS-related errors.
        """
        @app.errorhandler(400)
        def handle_cors_bad_request(error):
            return handle_cors_error(error, g.get('request_id'), {'error_type': 'bad_request'})
        
        @app.errorhandler(403)
        def handle_cors_forbidden(error):
            return handle_cors_error(error, g.get('request_id'), {'error_type': 'forbidden'})
        
        @app.errorhandler(405)
        def handle_cors_method_not_allowed(error):
            return handle_cors_error(error, g.get('request_id'), {'error_type': 'method_not_allowed'})
    
    def _update_performance_metrics(self, metric_type: str, context: Dict[str, Any]) -> None:
        """
        Updates performance metrics for monitoring and optimization.
        """
        current_time = time.time()
        
        if metric_type == 'preflight_success':
            self.performance_metrics['preflight_count'] += 1
        elif metric_type == 'request_processed':
            self.performance_metrics['request_count'] += 1
        
        # Update cache hit rate if applicable
        if 'cache_hit' in context:
            cache_hits = self.performance_metrics.get('cache_hits', 0) + (1 if context['cache_hit'] else 0)
            total_requests = self.performance_metrics.get('request_count', 1)
            self.performance_metrics['cache_hit_rate'] = cache_hits / total_requests
    
    def _validate_configuration(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates CORS configuration for security and compliance.
        """
        result = {
            'valid': True,
            'errors': []
        }
        
        # Validate origins configuration
        if 'origins' in config:
            if not isinstance(config['origins'], list):
                result['valid'] = False
                result['errors'].append('Origins must be a list')
        
        # Validate methods configuration
        if 'methods' in config:
            valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH']
            invalid_methods = [m for m in config['methods'] if m not in valid_methods]
            if invalid_methods:
                result['valid'] = False
                result['errors'].append(f'Invalid methods: {invalid_methods}')
        
        return result
    
    def _validate_configuration_integrity(self) -> Dict[str, Any]:
        """
        Validates configuration integrity and consistency.
        """
        result = {
            'valid': True,
            'warnings': []
        }
        
        # Check for potential security issues
        origins = self.cors_options.get('origins', [])
        if '*' in origins and self.environment == 'production':
            result['warnings'].append('Wildcard origin in production environment')
        
        return result
    
    def _classify_violation_severity(self, violation_type: str) -> Dict[str, str]:
        """
        Classifies violation severity for appropriate response.
        """
        severity_map = {
            'origin_violation': {'severity': 'high', 'category': 'security'},
            'method_violation': {'severity': 'medium', 'category': 'access'},
            'headers_violation': {'severity': 'low', 'category': 'headers'},
            'preflight_violation': {'severity': 'medium', 'category': 'preflight'}
        }
        
        return severity_map.get(violation_type, {'severity': 'medium', 'category': 'unknown'})
    
    def _sanitize_violation_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes violation context for safe logging.
        """
        sanitized = {}
        for key, value in context.items():
            if 'authorization' in key.lower() or 'token' in key.lower():
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _update_violation_statistics(self, violation_type: str) -> None:
        """
        Updates violation statistics for monitoring and trending.
        """
        self.violation_stats[violation_type] = self.violation_stats.get(violation_type, 0) + 1
        self.violation_stats['total_violations'] = self.violation_stats.get('total_violations', 0) + 1
        
        # Update global violation counter
        global CORS_VIOLATION_COUNTER
        CORS_VIOLATION_COUNTER[violation_type] = CORS_VIOLATION_COUNTER.get(violation_type, 0) + 1
    
    def _should_trigger_security_alert(self, violation_type: str) -> bool:
        """
        Determines if security alert should be triggered based on violation thresholds.
        """
        threshold = 10  # Alert after 10 violations of same type
        current_count = self.violation_stats.get(violation_type, 0)
        return current_count >= threshold
    
    def _trigger_security_alert(self, violation_type: str, security_event: Dict[str, Any]) -> None:
        """
        Triggers security alert for high-frequency violations.
        """
        logger.error("CORS security alert triggered", None, {
            'alert_type': 'high_frequency_violations',
            'violation_type': violation_type,
            'event_details': security_event
        })
    
    def _generate_security_recommendations(self, violations: List[str]) -> List[str]:
        """
        Generates security recommendations based on validation violations.
        """
        recommendations = []
        
        if 'origin_validation_failed' in violations:
            recommendations.append('Review and update allowed origins configuration')
        
        if 'method_validation_failed' in violations:
            recommendations.append('Verify allowed HTTP methods configuration')
        
        if 'headers_validation_failed' in violations:
            recommendations.append('Check allowed headers configuration')
        
        return recommendations


# Flask CORS middleware factory functions for environment-specific configuration

def configure_cors_for_environment(app: Flask, options: Dict[str, Any] = None) -> Flask:
    """
    Configures Flask-CORS middleware based on the current environment with appropriate 
    security policies, origin validation, and performance optimization. Creates 
    environment-specific CORS configuration using security policies that range from 
    permissive development settings to strict production security controls equivalent 
    to Express.js environment-aware CORS configuration.
    
    Args:
        app: Flask application instance for CORS middleware integration
        options: Custom CORS options dictionary for configuration override
        
    Returns:
        Flask application instance with configured CORS middleware applied
    """
    # Detect current environment using Flask configuration classes
    environment = ENVIRONMENT or 'development'
    
    # Create environment-specific CORS configuration using Flask-CORS
    cors_config = create_cors_options(environment, options or {})
    
    # Apply custom options and overrides from input parameters
    if options:
        cors_config.update(options)
    
    # Set up CORS violation logging and security event tracking
    cors_config['logging_enabled'] = True
    cors_config['violation_tracking'] = True
    
    # Configure error handling for CORS failures with appropriate response sanitization
    cors_config['error_handling'] = True
    
    # Initialize request correlation tracking for CORS request debugging
    cors_config['correlation_tracking'] = True
    
    # Apply performance optimizations including preflight caching
    if environment == 'production':
        cors_config.update(optimize_cors_performance(None, {'caching': True}))
    
    # Integrate CORS configuration with Flask-Talisman security policies
    security_integration = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
    cors_config['security_integration'] = security_integration
    
    # Initialize and apply CORS middleware to Flask application
    cors_middleware = CORSMiddleware(app, cors_config)
    
    # Log CORS middleware configuration initialization
    logger.info("Flask CORS middleware configured for environment", {
        'environment': environment,
        'cors_config': cors_middleware._sanitize_config_for_logging(cors_config),
        'security_integration': bool(security_integration)
    })
    
    return app


def handle_cors_error(error: Exception, request_id: str = None, cors_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Handles CORS-related errors including origin violations, method restrictions, and 
    header policy breaches with comprehensive logging, security event tracking, and 
    appropriate error responses based on environment security requirements equivalent 
    to Express.js CORS error handling patterns.
    
    Args:
        error: Exception object for detailed error analysis
        request_id: Request correlation ID for error tracking
        cors_context: CORS context dictionary with violation details
        
    Returns:
        CORS error response with appropriate status code and security logging
    """
    # Analyze CORS error type and determine appropriate security response level
    error_type = type(error).__name__
    error_message = str(error)
    
    # Generate request correlation ID for error tracking if not provided
    correlation_id = request_id or f"error_{uuid.uuid4().hex[:8]}"
    
    # Sanitize error response based on environment to prevent information disclosure
    if ENVIRONMENT == 'production':
        sanitized_message = 'CORS policy violation'
        include_details = False
    else:
        sanitized_message = error_message
        include_details = True
    
    # Format error context for comprehensive logging
    error_context = {
        'correlation_id': correlation_id,
        'error_type': error_type,
        'error_message': error_message,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'environment': ENVIRONMENT
    }
    
    if cors_context:
        error_context.update(cors_context)
    
    # Update CORS violation counters and security metrics
    global CORS_VIOLATION_COUNTER
    violation_key = f"error_{error_type.lower()}"
    CORS_VIOLATION_COUNTER[violation_key] = CORS_VIOLATION_COUNTER.get(violation_key, 0) + 1
    
    # Log security event using Flask logger with comprehensive context
    logger.error(f"CORS error handled: {error_type}", error, error_context)
    
    # Trigger security alerts if violation thresholds are exceeded
    if CORS_VIOLATION_COUNTER[violation_key] >= 5:
        logger.warning("High frequency CORS errors detected", {
            'error_type': error_type,
            'count': CORS_VIOLATION_COUNTER[violation_key],
            'correlation_id': correlation_id
        })
    
    # Format appropriate HTTP error response with CORS-compliant headers
    error_response = {
        'error': True,
        'message': sanitized_message,
        'correlation_id': correlation_id,
        'timestamp': error_context['timestamp']
    }
    
    if include_details:
        error_response['details'] = {
            'error_type': error_type,
            'cors_context': cors_context
        }
    
    # Determine appropriate HTTP status code based on error type
    status_code = 400  # Default bad request
    if 'origin' in error_message.lower():
        status_code = 403  # Forbidden for origin violations
    elif 'method' in error_message.lower():
        status_code = 405  # Method not allowed
    
    return {
        'status_code': status_code,
        'response': error_response,
        'headers': {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlation_id
        }
    }


def create_cors_options(environment: str, custom_options: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Creates comprehensive Flask-CORS options dictionary by merging environment-specific 
    defaults, security requirements, and custom overrides for optimal cross-origin 
    protection and functionality balance in different deployment environments equivalent 
    to Express.js CORS options creation.
    
    Args:
        environment: Environment name for configuration selection
        custom_options: Custom CORS options for configuration override
        
    Returns:
        Complete Flask-CORS options dictionary with origin validation and security policies
    """
    # Load environment-specific CORS defaults from Flask configuration classes
    base_options = DEFAULT_CORS_OPTIONS.copy()
    
    # Configure origin validation function with environment-appropriate policies
    allowed_origins = get_cors_origins()
    base_options['origins'] = allowed_origins or ['*']
    
    # Set up allowed methods and headers based on environment security level
    if environment == 'production':
        # Strict production CORS configuration with minimal attack surface
        base_options.update({
            'methods': ['GET', 'POST', 'PUT', 'DELETE'],
            'allow_headers': ['Content-Type', 'Authorization'],
            'expose_headers': ['X-Total-Count'],
            'supports_credentials': False,
            'max_age': 3600,  # 1 hour preflight cache
            'send_wildcard': False,
            'vary_header': True
        })
    
    elif environment == 'development':
        # Permissive development CORS configuration for debugging
        base_options.update({
            'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
            'allow_headers': ['*'],
            'expose_headers': ['*'],
            'supports_credentials': True,
            'max_age': 86400,  # 24 hour preflight cache
            'send_wildcard': True,
            'automatic_options': True
        })
    
    else:
        # Balanced configuration for testing and staging environments
        base_options.update({
            'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
            'expose_headers': ['X-Total-Count', 'X-Request-ID'],
            'supports_credentials': False,
            'max_age': 7200,  # 2 hour preflight cache
            'send_wildcard': False
        })
    
    # Apply custom options and overrides while maintaining security requirements
    if custom_options:
        # Validate custom options for security compliance
        validated_options = {}
        for key, value in custom_options.items():
            if key in ['origins', 'methods', 'allow_headers', 'max_age']:
                validated_options[key] = value
        
        base_options.update(validated_options)
    
    # Configure credentials handling with HTTPS enforcement in production
    if environment == 'production' and base_options.get('supports_credentials'):
        base_options['automatic_options'] = False  # Manual preflight handling for security
    
    # Add CORS violation tracking and security event logging
    base_options.update({
        'violation_tracking': True,
        'security_logging': True,
        'performance_monitoring': True
    })
    
    # Configure Flask-CORS specific options for optimal integration
    base_options.update({
        'intercept_exceptions': True,
        'automatic_options': base_options.get('automatic_options', True),
        'vary_header': base_options.get('vary_header', True)
    })
    
    # Log CORS options creation with environment and security context
    logger.info("CORS options created", {
        'environment': environment,
        'origins_count': len(base_options['origins']) if isinstance(base_options['origins'], list) else 1,
        'methods_count': len(base_options['methods']),
        'credentials_support': base_options['supports_credentials']
    })
    
    return base_options


def validate_cors_request(flask_request: Any, cors_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates incoming CORS requests against Flask security policies including origin 
    verification, method validation, and header checking with comprehensive logging 
    and violation tracking for security monitoring and compliance equivalent to 
    Express.js CORS request validation.
    
    Args:
        flask_request: Flask request object for comprehensive validation
        cors_config: CORS configuration dictionary with security policies
        
    Returns:
        CORS validation result with security status and detailed analysis
    """
    # Extract origin, method, and headers from Flask request object
    origin = flask_request.headers.get('Origin')
    method = flask_request.method
    headers = dict(flask_request.headers)
    
    # Generate correlation ID for request tracking and debugging
    correlation_id = f"validate_{uuid.uuid4().hex[:8]}"
    
    # Initialize comprehensive validation result with security context
    validation_result = {
        'correlation_id': correlation_id,
        'valid': True,
        'violations': [],
        'recommendations': [],
        'security_analysis': {},
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    # Validate request origin against environment-specific whitelist policies
    if origin:
        allowed_origins = cors_config.get('origins', [])
        origin_valid = False
        
        if '*' in allowed_origins:
            origin_valid = True
        elif origin in allowed_origins:
            origin_valid = True
        else:
            # Check regex patterns for dynamic origin validation
            for allowed_origin in allowed_origins:
                if '*' in allowed_origin:
                    pattern = re.escape(allowed_origin).replace(r'\*', '.*')
                    if re.match(f'^{pattern}$', origin, re.IGNORECASE):
                        origin_valid = True
                        break
        
        if not origin_valid:
            validation_result['valid'] = False
            validation_result['violations'].append('origin_not_allowed')
            validation_result['security_analysis']['origin_violation'] = {
                'provided': origin,
                'allowed': allowed_origins
            }
    
    # Check HTTP method against allowed methods configuration
    allowed_methods = cors_config.get('methods', [])
    if method not in allowed_methods:
        validation_result['valid'] = False
        validation_result['violations'].append('method_not_allowed')
        validation_result['security_analysis']['method_violation'] = {
            'provided': method,
            'allowed': allowed_methods
        }
    
    # Validate request headers against security policy and allowed headers
    if 'Access-Control-Request-Headers' in headers:
        requested_headers = headers['Access-Control-Request-Headers'].split(',')
        requested_headers = [h.strip().lower() for h in requested_headers]
        allowed_headers = [h.lower() for h in cors_config.get('allow_headers', [])]
        
        if '*' not in allowed_headers:
            invalid_headers = [h for h in requested_headers if h not in allowed_headers]
            if invalid_headers:
                validation_result['valid'] = False
                validation_result['violations'].append('headers_not_allowed')
                validation_result['security_analysis']['headers_violation'] = {
                    'invalid': invalid_headers,
                    'allowed': cors_config.get('allow_headers', [])
                }
    
    # Verify credentials handling compliance with HTTPS requirements
    if cors_config.get('supports_credentials'):
        if not flask_request.is_secure and ENVIRONMENT == 'production':
            validation_result['valid'] = False
            validation_result['violations'].append('credentials_require_https')
            validation_result['security_analysis']['credentials_violation'] = {
                'issue': 'HTTPS required for credential requests in production'
            }
    
    # Generate comprehensive validation report with security recommendations
    if validation_result['violations']:
        recommendations = []
        if 'origin_not_allowed' in validation_result['violations']:
            recommendations.append('Update allowed origins configuration or verify request origin')
        if 'method_not_allowed' in validation_result['violations']:
            recommendations.append('Add required HTTP method to allowed methods list')
        if 'headers_not_allowed' in validation_result['violations']:
            recommendations.append('Include required headers in allowed headers configuration')
        if 'credentials_require_https' in validation_result['violations']:
            recommendations.append('Use HTTPS for requests with credentials in production')
        
        validation_result['recommendations'] = recommendations
    
    # Log validation results and security violations for monitoring
    if validation_result['valid']:
        logger.info("CORS request validated successfully", validation_result)
    else:
        logger.warning("CORS request validation failed", validation_result)
    
    return validation_result


def log_cors_activity(activity_type: str, request_context: Dict[str, Any], cors_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Logs CORS-related activities including successful requests, policy violations, and 
    security events with structured output for monitoring, debugging, and compliance 
    tracking in production environments and educational analysis equivalent to Express.js 
    CORS activity logging.
    
    Args:
        activity_type: CORS activity type classification for structured logging
        request_context: Flask request context dictionary for activity tracking
        cors_context: CORS context dictionary with activity-specific information
        
    Returns:
        Logging result with correlation ID and structured activity data
    """
    # Generate request correlation ID for distributed request tracking
    correlation_id = request_context.get('correlation_id') or f"activity_{uuid.uuid4().hex[:8]}"
    
    # Classify CORS activity type and determine appropriate logging level
    activity_classification = {
        'request_processed': {'level': 'info', 'category': 'request'},
        'preflight_handled': {'level': 'info', 'category': 'preflight'},
        'origin_validated': {'level': 'info', 'category': 'security'},
        'violation_detected': {'level': 'warning', 'category': 'security'},
        'configuration_updated': {'level': 'info', 'category': 'configuration'},
        'performance_metric': {'level': 'debug', 'category': 'performance'}
    }
    
    classification = activity_classification.get(activity_type, {'level': 'info', 'category': 'general'})
    
    # Extract and sanitize request context for security logging
    sanitized_request_context = {}
    for key, value in request_context.items():
        if 'authorization' not in key.lower() and 'token' not in key.lower():
            sanitized_request_context[key] = value
        else:
            sanitized_request_context[key] = '[REDACTED]'
    
    # Format CORS activity with structured output for monitoring systems
    activity_data = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'correlation_id': correlation_id,
        'activity_type': activity_type,
        'classification': classification,
        'environment': ENVIRONMENT,
        'request_context': sanitized_request_context,
        'cors_context': cors_context or {},
        'middleware_version': CORS_MIDDLEWARE_VERSION
    }
    
    # Include timestamp, environment, security policy context, and compliance information
    activity_data.update({
        'compliance_info': {
            'environment_specific': True,
            'security_policies_applied': bool(cors_context),
            'violation_tracking_enabled': True
        }
    })
    
    # Log using appropriate Flask logging method based on activity severity
    log_level = classification['level']
    log_message = f"CORS activity: {activity_type}"
    
    if log_level == 'debug':
        logger.debug(log_message, activity_data)
    elif log_level == 'info':
        logger.info(log_message, activity_data)
    elif log_level == 'warning':
        logger.warning(log_message, activity_data)
    else:
        logger.info(log_message, activity_data)
    
    # Update CORS activity metrics and monitoring counters
    global CORS_VIOLATION_COUNTER
    metric_key = f"activity_{activity_type}"
    CORS_VIOLATION_COUNTER[metric_key] = CORS_VIOLATION_COUNTER.get(metric_key, 0) + 1
    
    # Return logging result with correlation tracking for request lifecycle monitoring
    return {
        'correlation_id': correlation_id,
        'logged': True,
        'activity_type': activity_type,
        'classification': classification,
        'timestamp': activity_data['timestamp'],
        'metrics_updated': True
    }


def optimize_cors_performance(cors_middleware: Callable = None, performance_options: Dict[str, Any] = None) -> Callable:
    """
    Optimizes Flask-CORS middleware performance through caching, efficient origin 
    validation, preflight optimization, and request processing enhancements while 
    maintaining security effectiveness and policy compliance for WSGI deployment 
    environments.
    
    Args:
        cors_middleware: Flask-CORS middleware callable for optimization
        performance_options: Performance optimization options dictionary
        
    Returns:
        Performance-optimized Flask-CORS middleware with caching and efficiency
    """
    # Initialize performance optimization configuration with default settings
    optimization_config = {
        'origin_validation_cache': True,
        'preflight_response_cache': True,
        'efficient_pattern_matching': True,
        'request_correlation_tracking': True,
        'performance_metrics_collection': True,
        'wsgi_worker_coordination': True
    }
    
    # Apply custom performance options and overrides from input parameters
    if performance_options:
        optimization_config.update(performance_options)
    
    # Implement origin validation caching for improved performance
    origin_cache = {}
    cache_ttl = optimization_config.get('cache_ttl', 3600)  # 1 hour default
    
    def cached_origin_validator(origin: str, allowed_origins: List[str]) -> bool:
        """Cached origin validation function for performance optimization."""
        cache_key = f"{origin}:{hash(tuple(sorted(allowed_origins)))}"
        
        # Check cache for existing validation result
        if cache_key in origin_cache:
            cache_entry = origin_cache[cache_key]
            if time.time() - cache_entry['timestamp'] < cache_ttl:
                return cache_entry['valid']
        
        # Perform validation and cache result
        valid = False
        if '*' in allowed_origins or origin in allowed_origins:
            valid = True
        else:
            for allowed_origin in allowed_origins:
                if '*' in allowed_origin:
                    pattern = re.escape(allowed_origin).replace(r'\*', '.*')
                    if re.match(f'^{pattern}$', origin, re.IGNORECASE):
                        valid = True
                        break
        
        # Cache validation result with timestamp
        origin_cache[cache_key] = {
            'valid': valid,
            'timestamp': time.time()
        }
        
        return valid
    
    # Optimize preflight request handling and response caching
    preflight_cache = {}
    
    def cached_preflight_handler(origin: str, method: str, headers: str) -> Dict[str, Any]:
        """Cached preflight response handler for performance optimization."""
        cache_key = f"{origin}:{method}:{headers}"
        
        # Check cache for existing preflight response
        if cache_key in preflight_cache:
            cache_entry = preflight_cache[cache_key]
            if time.time() - cache_entry['timestamp'] < cache_ttl:
                return cache_entry['response']
        
        # Generate preflight response and cache result
        response = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': method,
            'Access-Control-Allow-Headers': headers,
            'Access-Control-Max-Age': str(cache_ttl)
        }
        
        preflight_cache[cache_key] = {
            'response': response,
            'timestamp': time.time()
        }
        
        return response
    
    # Add request correlation tracking for performance monitoring
    def performance_tracking_middleware(request_obj: Any) -> Dict[str, Any]:
        """Performance tracking middleware for request processing analysis."""
        start_time = time.time()
        correlation_id = f"perf_{uuid.uuid4().hex[:8]}"
        
        # Track request processing metrics
        processing_metrics = {
            'correlation_id': correlation_id,
            'start_time': start_time,
            'origin': request_obj.headers.get('Origin'),
            'method': request_obj.method,
            'cache_hit': False
        }
        
        return processing_metrics
    
    # Configure efficient error handling with minimal performance impact
    def optimized_error_handler(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """Optimized error handling for minimal performance impact."""
        return {
            'error': True,
            'message': 'CORS policy violation',
            'correlation_id': context.get('correlation_id'),
            'timestamp': time.time()
        }
    
    # Set up performance metrics collection and monitoring
    performance_metrics = {
        'cache_hits': 0,
        'cache_misses': 0,
        'average_response_time': 0.0,
        'total_requests': 0,
        'optimization_enabled': True
    }
    
    # Apply middleware-level optimizations for WSGI multi-worker compatibility
    def wsgi_optimized_cors_middleware(app: Flask) -> Flask:
        """WSGI-optimized CORS middleware for multi-worker deployment."""
        
        # Initialize performance optimization in application context
        if not hasattr(app, 'cors_optimization'):
            app.cors_optimization = {
                'origin_cache': origin_cache,
                'preflight_cache': preflight_cache,
                'performance_metrics': performance_metrics,
                'cached_validators': {
                    'origin_validator': cached_origin_validator,
                    'preflight_handler': cached_preflight_handler
                }
            }
        
        # Log performance optimization initialization
        logger.info("CORS performance optimization applied", {
            'optimization_config': optimization_config,
            'cache_enabled': optimization_config.get('origin_validation_cache'),
            'wsgi_optimization': optimization_config.get('wsgi_worker_coordination')
        })
        
        return app
    
    # Return optimized Flask-CORS middleware if provided, otherwise return optimization functions
    if cors_middleware:
        return wsgi_optimized_cors_middleware
    else:
        return {
            'cached_origin_validator': cached_origin_validator,
            'cached_preflight_handler': cached_preflight_handler,
            'performance_tracking': performance_tracking_middleware,
            'optimized_error_handler': optimized_error_handler,
            'wsgi_middleware': wsgi_optimized_cors_middleware,
            'performance_metrics': performance_metrics
        }


def create_development_cors(dev_options: Dict[str, Any] = None) -> Callable:
    """
    Creates development-friendly Flask-CORS middleware with relaxed security policies, 
    enhanced logging, and debugging capabilities to support hot reloading, development 
    tools, and cross-origin testing while maintaining essential security protections 
    for educational purposes.
    
    Args:
        dev_options: Development-specific CORS options for customization
        
    Returns:
        Development-optimized Flask-CORS middleware with debugging and educational features
    """
    # Configure permissive origin policies for local development servers
    development_config = {
        'origins': ['*'],  # Allow all origins for development convenience
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
        'allow_headers': ['*'],  # Allow all headers for development tools
        'expose_headers': ['*'],  # Expose all headers for debugging
        'supports_credentials': True,  # Enable credentials for development testing
        'max_age': 86400,  # 24-hour cache for development convenience
        'send_wildcard': True,  # Wildcard origin support
        'automatic_options': True,  # Automatic OPTIONS handling
        'vary_header': True  # Proper Vary header for development tools
    }
    
    # Apply custom development options and overrides from input parameters
    if dev_options:
        development_config.update(dev_options)
    
    # Enable comprehensive CORS logging for development debugging
    development_config.update({
        'debug_logging': True,
        'verbose_violations': True,
        'educational_logging': True,
        'cross_platform_comparison': True
    })
    
    # Allow additional development headers and methods for development tools
    development_headers = [
        'Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRFToken',
        'X-Forwarded-For', 'X-Real-IP', 'User-Agent', 'Accept', 'Accept-Language',
        'Accept-Encoding', 'Connection', 'Upgrade', 'Sec-WebSocket-Key',
        'Sec-WebSocket-Version', 'Sec-WebSocket-Extensions'
    ]
    
    if development_config.get('allow_headers') == ['*']:
        development_config['allow_headers'] = development_headers
    
    # Set up development-specific error responses with detailed information
    def development_error_handler(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """Development error handler with detailed debugging information."""
        return {
            'error': True,
            'message': str(error),
            'type': type(error).__name__,
            'context': context,
            'debugging_info': {
                'cors_config': development_config,
                'request_details': context.get('request_context', {}),
                'recommendations': [
                    'Check browser console for CORS error details',
                    'Verify request origin matches allowed origins',
                    'Ensure request method is in allowed methods list',
                    'Validate request headers against allowed headers'
                ]
            },
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    
    # Configure CORS for hot reloading and development tools compatibility
    development_config.update({
        'hot_reload_support': True,
        'webpack_dev_server_compatible': True,
        'browser_dev_tools_support': True
    })
    
    # Add educational logging for CORS learning and framework comparison
    def educational_cors_logger(activity: str, context: Dict[str, Any]) -> None:
        """Educational CORS logger for learning and cross-platform comparison."""
        educational_context = {
            'activity': activity,
            'educational_note': f"Development CORS: {activity}",
            'cors_concepts': {
                'origin_validation': 'Permissive for development convenience',
                'preflight_handling': 'Automatic OPTIONS method processing',
                'credential_support': 'Enabled for development testing'
            },
            'express_js_equivalent': {
                'middleware': 'cors({ origin: true, credentials: true })',
                'behavior': 'Similar permissive development configuration'
            },
            'learning_points': [
                'Development CORS policies are more permissive than production',
                'Wildcard origins (*) should not be used in production',
                'Credential support requires careful security consideration'
            ]
        }
        
        educational_context.update(context)
        logger.info(f"Educational CORS: {activity}", educational_context)
    
    # Create development CORS middleware factory function
    def create_development_middleware(app: Flask) -> Flask:
        """Creates and configures development CORS middleware for Flask application."""
        
        # Initialize development CORS middleware with educational features
        development_middleware = CORSMiddleware(app, development_config)
        
        # Set up enhanced development logging and debugging
        if not hasattr(app, 'cors_development_features'):
            app.cors_development_features = {
                'educational_logging': educational_cors_logger,
                'error_handler': development_error_handler,
                'debug_config': development_config,
                'hot_reload_compatible': True
            }
        
        # Configure development-specific request tracking and debugging
        @app.before_request
        def cors_development_tracking():
            """Development request tracking for CORS debugging."""
            if request.method == 'OPTIONS':
                educational_cors_logger('preflight_request', {
                    'origin': request.headers.get('Origin'),
                    'method': request.headers.get('Access-Control-Request-Method'),
                    'headers': request.headers.get('Access-Control-Request-Headers')
                })
        
        # Log development CORS middleware initialization
        logger.info("Development CORS middleware created", {
            'config': development_config,
            'educational_features': True,
            'hot_reload_support': True,
            'debugging_enabled': True
        })
        
        return app
    
    return create_development_middleware


def create_production_cors(prod_options: Dict[str, Any] = None) -> Callable:
    """
    Creates production-hardened Flask-CORS middleware with strict security policies, 
    minimal attack surface, comprehensive monitoring, and enterprise-grade protection 
    against cross-origin attacks while enabling necessary business functionality for 
    WSGI deployment.
    
    Args:
        prod_options: Production-specific CORS options for customization
        
    Returns:
        Production-hardened Flask-CORS middleware with enterprise security and monitoring
    """
    # Configure strict origin whitelist with only approved production domains
    production_config = {
        'origins': get_cors_origins() or [],  # Strict origin whitelist from configuration
        'methods': ['GET', 'POST', 'PUT', 'DELETE'],  # Minimal required methods
        'allow_headers': ['Content-Type', 'Authorization'],  # Essential headers only
        'expose_headers': ['X-Total-Count'],  # Minimal response headers
        'supports_credentials': False,  # Disabled by default for security
        'max_age': 3600,  # 1-hour preflight cache for performance
        'send_wildcard': False,  # No wildcard origins in production
        'automatic_options': False,  # Manual preflight handling for security
        'vary_header': True  # Proper caching headers
    }
    
    # Apply custom production options with security validation
    if prod_options:
        # Validate production options for security compliance
        validated_options = {}
        
        # Strict validation for production origins
        if 'origins' in prod_options:
            origins = prod_options['origins']
            if isinstance(origins, list) and '*' not in origins:
                validated_options['origins'] = origins
        
        # Validate methods against security requirements
        if 'methods' in prod_options:
            safe_methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD']
            validated_methods = [m for m in prod_options['methods'] if m in safe_methods]
            validated_options['methods'] = validated_methods
        
        # Validate headers for production security
        if 'allow_headers' in prod_options:
            safe_headers = [
                'Content-Type', 'Authorization', 'X-Requested-With',
                'Accept', 'Accept-Language', 'Content-Language'
            ]
            validated_headers = [h for h in prod_options['allow_headers'] if h in safe_headers]
            validated_options['allow_headers'] = validated_headers
        
        production_config.update(validated_options)
    
    # Implement comprehensive CORS violation monitoring and alerting
    violation_monitor = {
        'violation_threshold': 10,  # Alert after 10 violations
        'violation_counts': {},
        'alert_triggered': False,
        'monitoring_enabled': True
    }
    
    def production_violation_handler(violation_type: str, context: Dict[str, Any]) -> None:
        """Production violation handler with enterprise monitoring and alerting."""
        violation_monitor['violation_counts'][violation_type] = \
            violation_monitor['violation_counts'].get(violation_type, 0) + 1
        
        # Trigger security alerts if thresholds exceeded
        if violation_monitor['violation_counts'][violation_type] >= violation_monitor['violation_threshold']:
            if not violation_monitor['alert_triggered']:
                logger.error("Production CORS security alert", None, {
                    'alert_type': 'high_frequency_violations',
                    'violation_type': violation_type,
                    'count': violation_monitor['violation_counts'][violation_type],
                    'context': context,
                    'severity': 'HIGH'
                })
                violation_monitor['alert_triggered'] = True
    
    # Apply minimal error information disclosure for production security
    def production_error_handler(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """Production error handler with minimal information disclosure."""
        # Log detailed error information for internal monitoring
        logger.error("Production CORS error", error, {
            'error_type': type(error).__name__,
            'context': context,
            'security_classification': 'PRODUCTION_CORS_VIOLATION'
        })
        
        # Return minimal error information to client
        return {
            'error': True,
            'message': 'Access denied',
            'code': 'CORS_POLICY_VIOLATION',
            'timestamp': time.time()
        }
    
    # Set up security event logging for compliance and monitoring
    def production_security_logger(event_type: str, context: Dict[str, Any]) -> None:
        """Production security event logger for compliance and monitoring."""
        security_event = {
            'event_type': event_type,
            'severity': 'MEDIUM',
            'source': 'flask_cors_middleware',
            'environment': 'production',
            'context': context,
            'compliance_relevant': True,
            'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        logger.log_security_event(event_type, security_event)
    
    # Configure WSGI multi-worker compatibility for production deployment
    wsgi_config = {
        'worker_coordination': True,
        'shared_violation_tracking': True,
        'distributed_caching': True,
        'process_isolation': True
    }
    
    # Apply performance optimizations for high-traffic production environments
    performance_config = {
        'origin_validation_cache': True,
        'preflight_response_cache': True,
        'cache_size_limit': 1000,  # Limit cache size for memory efficiency
        'cache_ttl': 3600,  # 1-hour cache duration
        'efficient_pattern_matching': True
    }
    
    # Create production CORS middleware factory function
    def create_production_middleware(app: Flask) -> Flask:
        """Creates and configures production CORS middleware for Flask application."""
        
        # Initialize production CORS middleware with security hardening
        production_middleware = CORSMiddleware(app, production_config)
        
        # Set up enterprise monitoring and security features
        if not hasattr(app, 'cors_production_features'):
            app.cors_production_features = {
                'violation_monitor': violation_monitor,
                'security_logger': production_security_logger,
                'error_handler': production_error_handler,
                'wsgi_config': wsgi_config,
                'performance_config': performance_config
            }
        
        # Configure production security event tracking
        @app.before_request
        def cors_production_monitoring():
            """Production request monitoring for security compliance."""
            origin = request.headers.get('Origin')
            if origin and origin not in production_config['origins']:
                production_security_logger('unauthorized_origin_attempt', {
                    'origin': origin,
                    'method': request.method,
                    'path': request.path,
                    'user_agent': request.headers.get('User-Agent')
                })
        
        # Set up production error handling with security focus
        @app.errorhandler(403)
        def handle_production_cors_forbidden(error):
            return production_error_handler(error, {'type': 'forbidden_access'})
        
        # Log production CORS middleware initialization with security summary
        logger.info("Production CORS middleware created", {
            'origins_count': len(production_config['origins']),
            'methods_count': len(production_config['methods']),
            'security_features': ['violation_monitoring', 'security_logging', 'minimal_disclosure'],
            'wsgi_optimized': True,
            'compliance_enabled': True
        })
        
        return app
    
    return create_production_middleware


def create_cors_middleware(config_options: Dict[str, Any] = None) -> Callable:
    """
    Factory function that creates Flask-CORS middleware instance with environment-specific 
    configuration, security integration, and performance optimization. Provides the main 
    entry point for CORS middleware creation with comprehensive feature parity to Express.js 
    CORS implementation.
    
    Args:
        config_options: CORS configuration options dictionary for middleware customization
        
    Returns:
        Configured Flask-CORS middleware ready for Flask application integration
    """
    # Validate configuration options and environment settings
    environment = ENVIRONMENT or 'development'
    config = config_options or {}
    
    # Load environment-specific configuration from Flask configuration classes
    base_config = create_cors_options(environment, config)
    
    # Apply performance optimizations for WSGI deployment and production environments
    if environment == 'production':
        optimization_functions = optimize_cors_performance(None, config.get('performance', {}))
        base_config['optimization_functions'] = optimization_functions
    
    # Configure integration with Flask-Talisman security middleware
    talisman_config = SECURITY_CONSTANTS.get('TALISMAN_CONFIG', {})
    if talisman_config:
        base_config['talisman_integration'] = talisman_config
    
    # Set up logging and monitoring capabilities for security tracking
    base_config.update({
        'activity_logging': True,
        'violation_tracking': True,
        'performance_monitoring': True,
        'correlation_tracking': True
    })
    
    # Validate CORS middleware configuration for security effectiveness
    validation_result = _validate_cors_configuration(base_config)
    if not validation_result['valid']:
        logger.error("CORS middleware configuration validation failed", None, {
            'validation_errors': validation_result['errors'],
            'provided_config': config
        })
        raise ValueError(f"Invalid CORS configuration: {validation_result['errors']}")
    
    # Create Flask-CORS middleware factory function based on environment
    if environment == 'development':
        middleware_factory = create_development_cors(config)
    elif environment == 'production':
        middleware_factory = create_production_cors(config)
    else:
        # Create standard middleware for testing/staging environments
        def create_standard_middleware(app: Flask) -> Flask:
            """Creates standard CORS middleware for testing/staging environments."""
            cors_middleware = CORSMiddleware(app, base_config)
            
            logger.info("Standard CORS middleware created", {
                'environment': environment,
                'config': base_config,
                'security_integration': bool(talisman_config)
            })
            
            return app
        
        middleware_factory = create_standard_middleware
    
    # Return configured Flask-CORS middleware ready for application integration
    logger.info("CORS middleware factory created", {
        'environment': environment,
        'middleware_type': f"{environment}_cors_middleware",
        'configuration_valid': validation_result['valid'],
        'feature_parity': CROSS_PLATFORM_PARITY_MODE
    })
    
    return middleware_factory


def get_cors_status(app: Flask = None, status_options: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Returns comprehensive status of Flask-CORS middleware including configuration details, 
    security policies, violation statistics, and educational information for monitoring, 
    debugging, and learning assessment equivalent to Express.js CORS status reporting.
    
    Args:
        app: Flask application instance for status inspection
        status_options: Status reporting options for customization
        
    Returns:
        Detailed CORS middleware status report with configuration, metrics, and educational content
    """
    # Collect Flask-CORS configuration including origin policies and methods
    configuration_status = {
        'middleware_version': CORS_MIDDLEWARE_VERSION,
        'environment': ENVIRONMENT,
        'global_initialization': CORS_MIDDLEWARE_INITIALIZED,
        'cross_platform_mode': CROSS_PLATFORM_PARITY_MODE
    }
    
    # Include Flask application-specific configuration if available
    if app and hasattr(app, 'cors_middleware'):
        cors_middleware = app.cors_middleware
        configuration_status.update({
            'app_initialized': cors_middleware.is_initialized,
            'cors_options': cors_middleware._sanitize_config_for_logging(cors_middleware.cors_options),
            'security_policies': list(cors_middleware.security_policies.keys())
        })
    
    # Gather violation statistics and security metrics for monitoring
    security_status = {
        'global_violations': CORS_VIOLATION_COUNTER.copy(),
        'violation_tracking_enabled': True,
        'security_integration': {
            'talisman_available': bool(SECURITY_CONSTANTS.get('TALISMAN_CONFIG')),
            'helmet_equivalent': bool(SECURITY_CONSTANTS.get('HELMET_EQUIVALENT_CONFIG')),
            'security_headers': list(SECURITY_CONSTANTS.get('SECURITY_HEADERS', {}).keys())
        }
    }
    
    # Include performance metrics and optimization status for production analysis
    performance_status = {
        'optimization_available': True,
        'wsgi_compatible': True,
        'caching_supported': True,
        'metrics_collection': True
    }
    
    # Add cross-platform compatibility status comparing with Express.js functionality
    compatibility_status = {
        'express_js_equivalent': EXPRESS_CONSTANTS.get('MIDDLEWARE_EQUIVALENT', {}).get('cors_middleware', {}),
        'feature_parity_maintained': CROSS_PLATFORM_PARITY_MODE,
        'api_compatibility': {
            'cors_configuration': 'Equivalent patterns maintained',
            'violation_handling': 'Consistent error responses',
            'performance_optimization': 'Similar caching strategies'
        }
    }
    
    # Generate educational content explaining Flask-CORS architecture and benefits
    educational_content = {
        'flask_cors_concepts': {
            'middleware_integration': 'Flask application factory pattern support',
            'environment_awareness': 'Development vs production configuration',
            'security_enforcement': 'Origin validation and policy enforcement',
            'wsgi_compatibility': 'Multi-worker deployment support'
        },
        'benefits_over_basic_cors': {
            'comprehensive_logging': 'Request correlation and violation tracking',
            'security_integration': 'Flask-Talisman coordination for complete protection',
            'performance_optimization': 'Caching and efficient validation for production',
            'educational_value': 'Cross-platform comparison with Express.js patterns'
        },
        'production_advantages': {
            'enterprise_monitoring': 'Comprehensive violation tracking and alerting',
            'wsgi_optimization': 'Multi-worker coordination and process isolation',
            'security_hardening': 'Minimal attack surface and information disclosure'
        }
    }
    
    # Include troubleshooting information for common CORS configuration issues
    troubleshooting_info = {
        'common_configuration_issues': {
            'origin_mismatch': {
                'description': 'Request origin not in allowed origins list',
                'solution': 'Update origins configuration or verify request source',
                'debug_command': 'get_cors_status() to check current origins'
            },
            'method_not_allowed': {
                'description': 'HTTP method not in allowed methods list',
                'solution': 'Add required method to allowed methods configuration',
                'debug_command': 'Check cors_options[\'methods\'] in status report'
            },
            'headers_blocked': {
                'description': 'Request headers not in allowed headers list',
                'solution': 'Include required headers in allow_headers configuration',
                'debug_command': 'Inspect browser network tab for CORS headers'
            }
        },
        'debugging_steps': [
            'Enable development environment for detailed logging',
            'Check browser console for CORS error messages',
            'Verify request origin matches configured origins',
            'Validate HTTP method and headers against configuration',
            'Review Flask application logs for violation details'
        ],
        'performance_troubleshooting': {
            'slow_cors_validation': 'Enable caching with optimize_cors_performance()',
            'high_memory_usage': 'Review cache size limits in production configuration',
            'wsgi_coordination_issues': 'Check worker process isolation and coordination'
        }
    }
    
    # Add WSGI deployment status and multi-worker coordination information
    wsgi_status = {
        'deployment_ready': True,
        'multi_worker_support': True,
        'process_coordination': 'Supported through caching and state management',
        'zero_downtime_compatible': True,
        'pm2_equivalent_features': {
            'process_isolation': 'WSGI worker process separation',
            'load_balancing': 'Request distribution across workers',
            'health_monitoring': 'Performance metrics and violation tracking'
        }
    }
    
    # Compile comprehensive CORS status for monitoring dashboard and operational insights
    status_report = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'configuration': configuration_status,
        'security': security_status,
        'performance': performance_status,
        'compatibility': compatibility_status,
        'educational': educational_content,
        'troubleshooting': troubleshooting_info,
        'wsgi_deployment': wsgi_status,
        'overall_status': 'operational' if CORS_MIDDLEWARE_INITIALIZED else 'available',
        'recommendations': _generate_status_recommendations(configuration_status, security_status)
    }
    
    # Apply custom status options if provided
    if status_options:
        if status_options.get('detailed', True):
            # Include detailed information by default
            pass
        
        if status_options.get('security_only'):
            # Return only security-related status
            status_report = {
                'security': security_status,
                'violations': CORS_VIOLATION_COUNTER,
                'timestamp': status_report['timestamp']
            }
    
    return status_report


# Helper functions for internal CORS middleware operations and validation

def _validate_cors_configuration(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates CORS configuration for security compliance and completeness.
    """
    validation_result = {
        'valid': True,
        'errors': [],
        'warnings': []
    }
    
    # Validate origins configuration
    if 'origins' in config:
        origins = config['origins']
        if not isinstance(origins, list):
            validation_result['valid'] = False
            validation_result['errors'].append('Origins must be a list')
        elif '*' in origins and len(origins) > 1:
            validation_result['warnings'].append('Wildcard origin with specific origins may be redundant')
    
    # Validate methods configuration
    if 'methods' in config:
        valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH']
        invalid_methods = [m for m in config['methods'] if m not in valid_methods]
        if invalid_methods:
            validation_result['valid'] = False
            validation_result['errors'].append(f'Invalid HTTP methods: {invalid_methods}')
    
    # Validate security configuration
    if config.get('supports_credentials') and '*' in config.get('origins', []):
        validation_result['valid'] = False
        validation_result['errors'].append('Credentials cannot be used with wildcard origins')
    
    return validation_result


def _generate_status_recommendations(config_status: Dict[str, Any], security_status: Dict[str, Any]) -> List[str]:
    """
    Generates recommendations based on current CORS configuration and security status.
    """
    recommendations = []
    
    # Environment-specific recommendations
    environment = config_status.get('environment')
    if environment == 'development':
        recommendations.append('Consider restricting origins for production deployment')
    elif environment == 'production':
        if not security_status.get('security_integration', {}).get('talisman_available'):
            recommendations.append('Consider integrating Flask-Talisman for comprehensive security')
    
    # Security recommendations based on violation statistics
    violations = security_status.get('global_violations', {})
    if violations.get('origin_violations', 0) > 10:
        recommendations.append('High origin violations detected - review allowed origins configuration')
    
    if violations.get('method_violations', 0) > 5:
        recommendations.append('Method violations detected - validate allowed methods configuration')
    
    # Performance recommendations
    if not config_status.get('optimization_enabled', False):
        recommendations.append('Enable performance optimization for better response times')
    
    return recommendations


# Initialize default CORS middleware instance for module-level access
logger.info("Flask CORS middleware module initialized", {
    'version': CORS_MIDDLEWARE_VERSION,
    'cross_platform_mode': CROSS_PLATFORM_PARITY_MODE,
    'environment_support': ['development', 'production', 'testing', 'staging'],
    'express_js_compatibility': True
})