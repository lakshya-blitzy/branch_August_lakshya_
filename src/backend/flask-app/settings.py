"""
Flask Application Settings Management Module - Cross-Platform Node.js Tutorial Project Migration

This module provides simplified configuration and settings override functionality for the Node.js 
tutorial project's cross-platform implementation. Implements environment-aware settings management 
with validation, dynamic configuration loading, and runtime settings adjustment capabilities. 

Serves as a bridge between the comprehensive config.py configuration classes and application-specific 
settings, providing a simplified interface for Flask application configuration management while 
maintaining complete feature parity with Express.js environment variables and settings patterns.

Designed for educational demonstration of Flask configuration management patterns and production 
deployment settings optimization with comprehensive validation, caching, and runtime modification 
capabilities for enterprise-grade Flask application factory pattern integration.

Educational Focus:
- Flask settings management equivalent to Express.js environment configuration patterns
- Environment-aware configuration with development, production, staging, and testing support
- Dynamic settings loading and runtime modification capabilities for Flask applications
- Comprehensive validation and error handling for production deployment scenarios
- Simplified interface for Flask application factory pattern integration
- Cross-platform compatibility demonstrating Flask development best practices

Author: Flask Tutorial Implementation Team  
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports with version comments for cross-platform compatibility
import os  # built-in - Operating system interface for environment variable access equivalent to Node.js process.env
import sys  # built-in - System-specific parameters and functions for Python version detection and system settings
import pathlib  # built-in - Object-oriented filesystem paths for configuration file handling and settings file management
import json  # built-in - JSON serialization for settings export, import, and configuration file management
import functools  # built-in - Function utilities for caching settings and performance optimization
from typing import Any, Dict, List, Optional, Union, Type, Callable  # built-in - Type hints for settings management functions and configuration validation

# Internal imports for Flask configuration classes and constants
from config import Config, config, get_config_class, validate_environment_variables  # Import base configuration class for settings validation and configuration inheritance patterns in Flask application factory
from utils.constants import (
    ENV_CONSTANTS,          # Import environment constants for default Flask server settings and environment type validation
    FLASK_CONSTANTS,        # Import Flask-specific constants for settings validation and application configuration management
    SECURITY_CONSTANTS,     # Import security constants for Flask-Talisman settings equivalent to Helmet.js configuration
    PERFORMANCE_CONSTANTS   # Import performance constants for settings optimization and monitoring thresholds
)
from utils.logger import logger  # Import Flask logger for settings management operations, validation logging, and configuration change tracking

# Global settings management state variables for Flask application configuration caching and optimization
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
SETTINGS_CACHE = dict()
DEFAULT_SETTINGS = dict()
ENVIRONMENT_OVERRIDES = dict()
SETTINGS_LOADED = False


@functools.lru_cache(maxsize=128)
def load_settings(environment: str = None, overrides: dict = None) -> dict:
    """
    Loads Flask application settings from environment variables, configuration files, and defaults 
    with comprehensive validation and caching for optimal performance. Provides simplified settings 
    management interface equivalent to Express.js environment configuration with Flask-specific 
    optimizations.
    
    Args:
        environment (str): Target environment name for configuration selection (development, production, staging, testing)
        overrides (dict): Optional dictionary of setting overrides for runtime configuration modification
        
    Returns:
        dict: Complete settings dictionary with environment-specific values, defaults, and validation 
              status for Flask application configuration
    """
    global SETTINGS_CACHE, DEFAULT_SETTINGS, ENVIRONMENT_OVERRIDES, SETTINGS_LOADED
    
    # Validate environment parameter against ENVIRONMENT_TYPES from constants
    if environment is None:
        environment = FLASK_ENV
    
    environment = environment.lower().strip()
    valid_environments = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {})
    
    if environment not in ['development', 'production', 'staging', 'testing']:
        logger.warning(f"Invalid environment '{environment}', defaulting to development")
        environment = 'development'
    
    # Load base configuration from config.py using appropriate environment class
    try:
        config_class = get_config_class(environment)
        config_instance = config_class()
        
        # Initialize base settings from configuration class
        base_settings = {
            'FLASK_ENV': environment,
            'SECRET_KEY': getattr(config_instance, 'SECRET_KEY', os.environ.get('SECRET_KEY')),
            'DEBUG': getattr(config_instance, 'DEBUG', False),
            'TESTING': getattr(config_instance, 'TESTING', False),
            'PORT': ENV_CONSTANTS.get('DEFAULT_PORT', 3000),
            'HOST': ENV_CONSTANTS.get('DEFAULT_HOST', '127.0.0.1'),
            'APPLICATION_ROOT': getattr(config_instance, 'APPLICATION_ROOT', '/'),
            'CONFIG_VERSION': getattr(config_instance, 'CONFIG_VERSION', '1.0.0')
        }
        
        logger.info(f"Base configuration loaded for {environment} environment")
        
    except Exception as e:
        logger.error(f"Failed to load base configuration for {environment}: {str(e)}")
        # Fallback to minimal configuration
        base_settings = {
            'FLASK_ENV': environment,
            'SECRET_KEY': os.environ.get('SECRET_KEY', 'dev-secret-key'),
            'DEBUG': environment == 'development',
            'TESTING': environment == 'testing',
            'PORT': 3000,
            'HOST': '127.0.0.1'
        }
    
    # Read environment variables and apply settings overrides
    env_settings = {}
    for key, default_value in base_settings.items():
        env_value = os.environ.get(key)
        if env_value is not None:
            # Type conversion for common settings
            if key in ['PORT', 'DEBUG', 'TESTING']:
                try:
                    if key == 'PORT':
                        env_settings[key] = int(env_value)
                    elif key in ['DEBUG', 'TESTING']:
                        env_settings[key] = env_value.lower() in ('true', '1', 'yes', 'on')
                    else:
                        env_settings[key] = env_value
                except ValueError:
                    logger.warning(f"Invalid environment value for {key}: {env_value}, using default")
                    env_settings[key] = default_value
            else:
                env_settings[key] = env_value
        else:
            env_settings[key] = default_value
    
    # Merge default settings with environment-specific overrides
    merged_settings = {**base_settings, **env_settings}
    
    # Apply runtime overrides if provided
    if overrides:
        # Validate override keys and values
        validated_overrides = {}
        for key, value in overrides.items():
            if key in merged_settings or key.startswith('CUSTOM_'):
                validated_overrides[key] = value
                logger.debug(f"Applied override setting: {key}")
            else:
                logger.warning(f"Unknown override setting ignored: {key}")
        
        merged_settings.update(validated_overrides)
        ENVIRONMENT_OVERRIDES.update(validated_overrides)
    
    # Validate all settings using validation rules from constants
    validation_result = validate_settings(merged_settings, environment)
    if validation_result['status'] != 'valid':
        logger.warning(f"Settings validation warnings: {validation_result['warnings']}")
        if validation_result['errors']:
            logger.error(f"Settings validation errors: {validation_result['errors']}")
    
    # Cache settings for performance optimization in production
    cache_key = f"{environment}_{hash(str(sorted(overrides.items())) if overrides else 'no_overrides')}"
    SETTINGS_CACHE[cache_key] = merged_settings
    DEFAULT_SETTINGS.update(base_settings)
    SETTINGS_LOADED = True
    
    # Log settings loading completion with environment and override information
    override_count = len(overrides) if overrides else 0
    logger.info(f"Settings loaded for {environment} environment with {override_count} overrides")
    
    # Return complete validated settings dictionary for Flask application use
    return merged_settings


def get_setting(setting_key: str, default_value: Any = None, expected_type: Type = None) -> Any:
    """
    Retrieves specific setting value with type validation, default fallback, and environment 
    override support. Provides simplified access to Flask configuration values equivalent to 
    Express.js app.get() with comprehensive validation.
    
    Args:
        setting_key (str): Configuration key name to retrieve from settings cache or environment
        default_value (Any): Default value to return if setting not found in configuration
        expected_type (Type): Optional type validation for returned setting value
        
    Returns:
        Any: Setting value with proper type validation and default fallback handling for Flask 
             configuration access
    """
    global SETTINGS_CACHE, DEFAULT_SETTINGS
    
    # Check SETTINGS_CACHE for cached setting value for performance
    cache_hit = False
    for cache_key, cached_settings in SETTINGS_CACHE.items():
        if setting_key in cached_settings:
            setting_value = cached_settings[setting_key]
            cache_hit = True
            break
    
    if not cache_hit:
        # Validate setting_key against known configuration keys
        known_keys = ['FLASK_ENV', 'SECRET_KEY', 'DEBUG', 'TESTING', 'PORT', 'HOST', 'APPLICATION_ROOT']
        if setting_key not in known_keys and not setting_key.startswith('CUSTOM_'):
            logger.debug(f"Unknown setting key requested: {setting_key}")
        
        # Load setting from environment variables with type conversion
        env_value = os.environ.get(setting_key)
        if env_value is not None:
            setting_value = env_value
            logger.debug(f"Setting {setting_key} loaded from environment")
        else:
            # Apply default_value if setting not found in environment
            setting_value = default_value
            logger.debug(f"Setting {setting_key} using default value")
    
    # Validate returned value against expected_type if provided
    if expected_type is not None and setting_value is not None:
        try:
            if expected_type == int:
                setting_value = int(setting_value)
            elif expected_type == bool:
                if isinstance(setting_value, str):
                    setting_value = setting_value.lower() in ('true', '1', 'yes', 'on')
                else:
                    setting_value = bool(setting_value)
            elif expected_type == str:
                setting_value = str(setting_value)
            elif expected_type == float:
                setting_value = float(setting_value)
            
            logger.debug(f"Setting {setting_key} validated as {expected_type.__name__}")
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Type validation failed for {setting_key}: {str(e)}, using raw value")
    
    # Log setting access for debugging and configuration tracking
    logger.debug(f"Retrieved setting {setting_key} = {setting_value}")
    
    # Cache validated setting value for future access
    if not cache_hit:
        # Update cache with new setting
        cache_key = f"runtime_{FLASK_ENV}"
        if cache_key not in SETTINGS_CACHE:
            SETTINGS_CACHE[cache_key] = {}
        SETTINGS_CACHE[cache_key][setting_key] = setting_value
    
    # Return properly typed setting value for Flask application use
    return setting_value


def set_setting(setting_key: str, setting_value: Any, persist: bool = False) -> bool:
    """
    Sets Flask application setting value with validation, type checking, and environment 
    awareness. Provides runtime configuration management equivalent to Express.js app.set() 
    with comprehensive validation and persistence options.
    
    Args:
        setting_key (str): Configuration key name to set in application settings
        setting_value (Any): Value to assign to the specified setting key
        persist (bool): Whether to persist setting to environment variables for process lifetime
        
    Returns:
        bool: Success status indicating whether setting was successfully updated with validation 
              and persistence handling
    """
    global SETTINGS_CACHE, ENVIRONMENT_OVERRIDES
    
    try:
        # Validate setting_key against known configuration keys from constants
        valid_keys = ['FLASK_ENV', 'SECRET_KEY', 'DEBUG', 'TESTING', 'PORT', 'HOST', 'APPLICATION_ROOT']
        if setting_key not in valid_keys and not setting_key.startswith('CUSTOM_'):
            logger.warning(f"Setting unknown key: {setting_key}")
        
        # Validate setting_value type and format using validation rules
        if setting_key == 'PORT':
            try:
                port_value = int(setting_value)
                if port_value < 1 or port_value > 65535:
                    logger.error(f"Invalid port value: {port_value}")
                    return False
                setting_value = port_value
            except (ValueError, TypeError):
                logger.error(f"Port must be integer, got: {type(setting_value)}")
                return False
        
        elif setting_key in ['DEBUG', 'TESTING']:
            if isinstance(setting_value, str):
                setting_value = setting_value.lower() in ('true', '1', 'yes', 'on')
            else:
                setting_value = bool(setting_value)
        
        elif setting_key == 'FLASK_ENV':
            if setting_value not in ['development', 'production', 'staging', 'testing']:
                logger.error(f"Invalid Flask environment: {setting_value}")
                return False
        
        # Check if setting modification is allowed in current environment
        current_env = FLASK_ENV
        if current_env == 'production' and setting_key in ['DEBUG', 'TESTING']:
            if setting_value:
                logger.warning(f"Attempting to enable {setting_key} in production environment")
        
        # Update SETTINGS_CACHE with new validated value
        for cache_key in SETTINGS_CACHE:
            if cache_key.startswith(current_env) or cache_key.startswith('runtime'):
                SETTINGS_CACHE[cache_key][setting_key] = setting_value
        
        # Create cache entry if none exists
        runtime_cache_key = f"runtime_{current_env}"
        if runtime_cache_key not in SETTINGS_CACHE:
            SETTINGS_CACHE[runtime_cache_key] = {}
        SETTINGS_CACHE[runtime_cache_key][setting_key] = setting_value
        
        # Update environment overrides tracking
        ENVIRONMENT_OVERRIDES[setting_key] = setting_value
        
        # Persist setting to environment variables if persist flag is True
        if persist:
            os.environ[setting_key] = str(setting_value)
            logger.info(f"Setting {setting_key} persisted to environment")
        
        # Log setting change for audit trail and configuration tracking
        logger.info(f"Setting updated: {setting_key} = {setting_value} (persist={persist})")
        
        # Trigger configuration reload if required by setting type
        if setting_key in ['FLASK_ENV', 'SECRET_KEY']:
            logger.info("Core setting changed, consider reloading application configuration")
        
        # Return success status indicating setting update completion
        return True
        
    except Exception as e:
        logger.error(f"Failed to set setting {setting_key}: {str(e)}")
        return False


def validate_settings(settings_dict: dict, environment: str) -> dict:
    """
    Validates all Flask application settings against defined rules, types, and constraints with 
    comprehensive error reporting. Ensures settings compatibility with Flask application factory 
    pattern and production deployment requirements.
    
    Args:
        settings_dict (dict): Dictionary of settings to validate against configuration rules
        environment (str): Environment context for validation (development, production, staging, testing)
        
    Returns:
        dict: Validation results with status, errors, warnings, and recommendations for Flask 
              settings configuration
    """
    # Initialize validation results dictionary with default structure
    validation_result = {
        'status': 'valid',
        'errors': [],
        'warnings': [],
        'recommendations': [],
        'environment': environment,
        'validated_settings': len(settings_dict),
        'timestamp': f"{sys.version_info.major}.{sys.version_info.minor}"
    }
    
    # Validate required settings are present for Flask application factory
    required_settings = ['FLASK_ENV', 'SECRET_KEY', 'DEBUG', 'TESTING']
    for required_key in required_settings:
        if required_key not in settings_dict or settings_dict[required_key] is None:
            validation_result['errors'].append(f"Missing required setting: {required_key}")
            validation_result['status'] = 'invalid'
    
    # Check setting types and formats against validation rules from constants
    if 'SECRET_KEY' in settings_dict:
        secret_key = settings_dict['SECRET_KEY']
        if isinstance(secret_key, str):
            if len(secret_key) < 32:
                validation_result['warnings'].append("SECRET_KEY length below recommended 32 characters")
            if secret_key == 'dev-secret-key':
                validation_result['warnings'].append("Using default development SECRET_KEY")
        else:
            validation_result['errors'].append("SECRET_KEY must be string")
            validation_result['status'] = 'invalid'
    
    if 'PORT' in settings_dict:
        port = settings_dict['PORT']
        try:
            port_int = int(port)
            if port_int < 1 or port_int > 65535:
                validation_result['errors'].append(f"PORT {port_int} out of valid range (1-65535)")
                validation_result['status'] = 'invalid'
        except (ValueError, TypeError):
            validation_result['errors'].append(f"PORT must be integer, got: {type(port)}")
            validation_result['status'] = 'invalid'
    
    # Validate environment-specific settings and constraints
    if environment == 'production':
        if settings_dict.get('DEBUG', False):
            validation_result['warnings'].append("DEBUG enabled in production environment")
        if settings_dict.get('TESTING', False):
            validation_result['warnings'].append("TESTING enabled in production environment")
        
        # Check for production-specific requirements
        if not settings_dict.get('SECRET_KEY') or settings_dict.get('SECRET_KEY') == 'dev-secret-key':
            validation_result['errors'].append("Production environment requires secure SECRET_KEY")
            validation_result['status'] = 'invalid'
    
    elif environment == 'development':
        if not settings_dict.get('DEBUG', True):
            validation_result['recommendations'].append("Consider enabling DEBUG in development")
    
    elif environment == 'testing':
        if not settings_dict.get('TESTING', False):
            validation_result['warnings'].append("TESTING not enabled in testing environment")
    
    # Check Flask security settings including Flask-Talisman configuration
    security_settings = ['CORS_ORIGINS', 'CSP_DIRECTIVES', 'SECURITY_HEADERS']
    for security_setting in security_settings:
        if security_setting in settings_dict:
            validation_result['recommendations'].append(f"Security setting {security_setting} configured")
    
    # Validate WSGI deployment settings for production compatibility
    wsgi_settings = ['GUNICORN_WORKERS', 'GUNICORN_TIMEOUT', 'WSGI_MODULE']
    for wsgi_setting in wsgi_settings:
        if wsgi_setting in settings_dict:
            validation_result['recommendations'].append(f"WSGI setting {wsgi_setting} configured")
    
    # Compile validation errors, warnings, and recommendations
    if validation_result['errors']:
        validation_result['recommendations'].append("Fix validation errors before deployment")
    
    if validation_result['warnings']:
        validation_result['recommendations'].append("Review validation warnings for optimal configuration")
    
    # Log validation completion with summary of issues found
    logger.info(f"Settings validation completed for {environment}: {validation_result['status']}")
    if validation_result['errors']:
        logger.error(f"Validation errors: {validation_result['errors']}")
    if validation_result['warnings']:
        logger.warning(f"Validation warnings: {validation_result['warnings']}")
    
    # Return comprehensive validation results for settings assessment
    return validation_result


def export_settings(export_format: str, output_path: str, exclude_sensitive: list = None) -> dict:
    """
    Exports Flask application settings to various formats including JSON, environment variables, 
    and configuration files for deployment automation and configuration management with Flask 
    application factory compatibility.
    
    Args:
        export_format (str): Output format for settings export (json, env, yaml)
        output_path (str): File path for exported settings output
        exclude_sensitive (list): List of sensitive setting keys to exclude from export
        
    Returns:
        dict: Export operation results with file paths, format information, and export statistics 
              for Flask configuration management
    """
    # Validate export_format parameter against supported formats (json, env, yaml)
    supported_formats = ['json', 'env', 'yaml']
    if export_format.lower() not in supported_formats:
        error_msg = f"Unsupported export format: {export_format}. Supported: {supported_formats}"
        logger.error(error_msg)
        return {'status': 'error', 'message': error_msg}
    
    # Load current settings from SETTINGS_CACHE with environment context
    current_settings = {}
    for cache_key, cached_settings in SETTINGS_CACHE.items():
        current_settings.update(cached_settings)
    
    # If no cached settings, load defaults
    if not current_settings:
        current_settings = load_settings()
    
    # Filter sensitive settings based on exclude_sensitive list for security
    if exclude_sensitive is None:
        exclude_sensitive = ['SECRET_KEY', 'DATABASE_URL', 'API_KEYS']
    
    filtered_settings = {}
    for key, value in current_settings.items():
        if key not in exclude_sensitive:
            filtered_settings[key] = value
        else:
            logger.debug(f"Excluded sensitive setting from export: {key}")
    
    try:
        # Format settings according to specified export format requirements
        output_path = pathlib.Path(output_path)
        export_result = {
            'status': 'success',
            'format': export_format.lower(),
            'output_path': str(output_path),
            'settings_count': len(filtered_settings),
            'excluded_count': len(exclude_sensitive),
            'file_size': 0
        }
        
        if export_format.lower() == 'json':
            # Export as JSON format
            json_data = json.dumps(filtered_settings, indent=2, sort_keys=True)
            
            # Create output file with proper permissions and security considerations
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write formatted settings to output file with atomic operations
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(json_data)
            
            export_result['file_size'] = output_path.stat().st_size
            
        elif export_format.lower() == 'env':
            # Export as environment variables format
            env_lines = []
            for key, value in filtered_settings.items():
                # Escape special characters and quote values
                if isinstance(value, bool):
                    env_value = 'true' if value else 'false'
                elif isinstance(value, (int, float)):
                    env_value = str(value)
                else:
                    env_value = f'"{str(value)}"'
                
                env_lines.append(f"{key}={env_value}")
            
            env_content = '\n'.join(sorted(env_lines))
            
            # Create output file with proper permissions
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(env_content)
            
            export_result['file_size'] = output_path.stat().st_size
            
        elif export_format.lower() == 'yaml':
            # Export as YAML format (basic implementation)
            yaml_lines = []
            for key, value in sorted(filtered_settings.items()):
                if isinstance(value, str):
                    yaml_lines.append(f"{key}: '{value}'")
                elif isinstance(value, bool):
                    yaml_lines.append(f"{key}: {str(value).lower()}")
                else:
                    yaml_lines.append(f"{key}: {value}")
            
            yaml_content = '\n'.join(yaml_lines)
            
            # Create output file with proper permissions
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(yaml_content)
            
            export_result['file_size'] = output_path.stat().st_size
        
        # Log export operation completion with file information
        logger.info(f"Settings exported to {output_path} in {export_format} format")
        logger.info(f"Exported {len(filtered_settings)} settings, excluded {len(exclude_sensitive)} sensitive")
        
        # Return export results with file paths and operation statistics
        return export_result
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'message': f"Export failed: {str(e)}",
            'format': export_format,
            'output_path': str(output_path)
        }
        logger.error(f"Settings export failed: {str(e)}")
        return error_result


def import_settings(import_path: str, merge_strategy: str = 'update', validate_imported: bool = True) -> dict:
    """
    Imports Flask application settings from external files or configuration sources with validation 
    and merge strategies. Supports configuration management and deployment automation for Flask 
    application factory pattern.
    
    Args:
        import_path (str): File path to import settings from (supports json, env, yaml formats)
        merge_strategy (str): Strategy for merging imported settings ('update', 'replace', 'merge')
        validate_imported (bool): Whether to validate imported settings before applying
        
    Returns:
        dict: Import operation results with merged settings, validation status, and import 
              statistics for Flask configuration
    """
    # Validate import_path file existence and accessibility
    import_file = pathlib.Path(import_path)
    if not import_file.exists():
        error_msg = f"Import file not found: {import_path}"
        logger.error(error_msg)
        return {'status': 'error', 'message': error_msg}
    
    if not import_file.is_file():
        error_msg = f"Import path is not a file: {import_path}"
        logger.error(error_msg)
        return {'status': 'error', 'message': error_msg}
    
    try:
        # Parse imported file based on file format (json, yaml, env)
        file_extension = import_file.suffix.lower()
        imported_settings = {}
        
        if file_extension == '.json':
            with open(import_file, 'r', encoding='utf-8') as f:
                imported_settings = json.load(f)
                
        elif file_extension in ['.env', '.txt']:
            # Parse environment file format
            with open(import_file, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        try:
                            key, value = line.split('=', 1)
                            # Remove quotes from value
                            value = value.strip('"\'')
                            
                            # Type conversion
                            if value.lower() in ('true', 'false'):
                                imported_settings[key] = value.lower() == 'true'
                            elif value.isdigit():
                                imported_settings[key] = int(value)
                            else:
                                imported_settings[key] = value
                                
                        except ValueError:
                            logger.warning(f"Invalid line {line_num} in {import_path}: {line}")
                            
        elif file_extension in ['.yaml', '.yml']:
            # Basic YAML parsing (simplified implementation)
            with open(import_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip().strip('\'"')
                        
                        # Type conversion
                        if value.lower() in ('true', 'false'):
                            imported_settings[key] = value.lower() == 'true'
                        elif value.isdigit():
                            imported_settings[key] = int(value)
                        else:
                            imported_settings[key] = value
        else:
            error_msg = f"Unsupported file format: {file_extension}"
            logger.error(error_msg)
            return {'status': 'error', 'message': error_msg}
        
        # Validate imported settings if validate_imported flag is True
        validation_result = {'status': 'valid', 'errors': [], 'warnings': []}
        if validate_imported:
            validation_result = validate_settings(imported_settings, FLASK_ENV)
            if validation_result['status'] == 'invalid':
                logger.warning(f"Imported settings validation failed: {validation_result['errors']}")
        
        # Apply merge_strategy to combine with existing settings
        global SETTINGS_CACHE, ENVIRONMENT_OVERRIDES
        
        current_settings = {}
        for cache_key, cached_settings in SETTINGS_CACHE.items():
            current_settings.update(cached_settings)
        
        if merge_strategy == 'replace':
            # Replace all current settings with imported ones
            merged_settings = imported_settings.copy()
            
        elif merge_strategy == 'update':
            # Update current settings with imported ones (imported takes precedence)
            merged_settings = current_settings.copy()
            merged_settings.update(imported_settings)
            
        elif merge_strategy == 'merge':
            # Merge settings with conflict resolution (current takes precedence)
            merged_settings = imported_settings.copy()
            for key, value in current_settings.items():
                if key not in merged_settings:
                    merged_settings[key] = value
        else:
            error_msg = f"Invalid merge strategy: {merge_strategy}"
            logger.error(error_msg)
            return {'status': 'error', 'message': error_msg}
        
        # Update SETTINGS_CACHE with merged configuration values
        cache_key = f"imported_{FLASK_ENV}"
        SETTINGS_CACHE[cache_key] = merged_settings
        ENVIRONMENT_OVERRIDES.update(imported_settings)
        
        # Prepare import results with merge statistics
        import_result = {
            'status': 'success',
            'import_path': str(import_file),
            'file_format': file_extension,
            'merge_strategy': merge_strategy,
            'imported_count': len(imported_settings),
            'merged_count': len(merged_settings),
            'validation': validation_result,
            'imported_keys': list(imported_settings.keys())
        }
        
        # Log import operation completion with merge statistics
        logger.info(f"Settings imported from {import_path} using {merge_strategy} strategy")
        logger.info(f"Imported {len(imported_settings)} settings, merged to {len(merged_settings)} total")
        
        # Trigger settings reload if significant changes detected
        if len(imported_settings) > len(current_settings) * 0.5:
            logger.info("Significant settings changes detected, consider reloading application")
        
        # Return import results with merge status and validation information
        return import_result
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'message': f"Import failed: {str(e)}",
            'import_path': str(import_file)
        }
        logger.error(f"Settings import failed: {str(e)}")
        return error_result


def get_environment_settings(target_environment: str, include_base: bool = True) -> dict:
    """
    Retrieves environment-specific Flask settings with inheritance and override capabilities. 
    Provides environment-aware configuration management equivalent to Express.js environment-based 
    configuration with Flask application factory integration.
    
    Args:
        target_environment (str): Environment name for settings retrieval (development, production, staging, testing)
        include_base (bool): Whether to include base configuration settings in the result
        
    Returns:
        dict: Environment-specific settings with inheritance and override resolution for Flask 
              application configuration
    """
    # Validate target_environment against ENVIRONMENT_TYPES from constants
    valid_environments = ['development', 'production', 'staging', 'testing']
    if target_environment not in valid_environments:
        logger.error(f"Invalid target environment: {target_environment}")
        return {}
    
    # Load base configuration class using config.py environment mapping
    try:
        config_class = get_config_class(target_environment)
        config_instance = config_class()
        
        # Extract environment-specific settings from configuration class
        environment_settings = {}
        
        # Get all configuration attributes
        for attr_name in dir(config_instance):
            if not attr_name.startswith('_') and attr_name.isupper():
                attr_value = getattr(config_instance, attr_name)
                if not callable(attr_value):
                    environment_settings[attr_name] = attr_value
        
        logger.info(f"Loaded {len(environment_settings)} settings from {config_class.__name__}")
        
    except Exception as e:
        logger.error(f"Failed to load configuration for {target_environment}: {str(e)}")
        environment_settings = {}
    
    # Apply environment inheritance if include_base flag is True
    if include_base:
        # Load base configuration settings
        try:
            base_config = Config()
            base_settings = {}
            
            for attr_name in dir(base_config):
                if not attr_name.startswith('_') and attr_name.isupper():
                    attr_value = getattr(base_config, attr_name)
                    if not callable(attr_value):
                        base_settings[attr_name] = attr_value
            
            # Merge base settings with environment-specific ones (environment takes precedence)
            inherited_settings = base_settings.copy()
            inherited_settings.update(environment_settings)
            environment_settings = inherited_settings
            
            logger.debug(f"Applied base configuration inheritance for {target_environment}")
            
        except Exception as e:
            logger.warning(f"Failed to apply base inheritance: {str(e)}")
    
    # Resolve setting overrides and conflicts using precedence rules
    # Precedence: Environment Variables > Environment Overrides > Configuration Class > Base Config
    
    # Apply environment variable overrides
    env_overrides = {}
    for key in environment_settings.keys():
        env_value = os.environ.get(key)
        if env_value is not None:
            # Type conversion for known settings
            if key in ['PORT', 'DEBUG', 'TESTING']:
                try:
                    if key == 'PORT':
                        env_overrides[key] = int(env_value)
                    elif key in ['DEBUG', 'TESTING']:
                        env_overrides[key] = env_value.lower() in ('true', '1', 'yes', 'on')
                    else:
                        env_overrides[key] = env_value
                except ValueError:
                    env_overrides[key] = env_value
            else:
                env_overrides[key] = env_value
    
    if env_overrides:
        environment_settings.update(env_overrides)
        logger.debug(f"Applied {len(env_overrides)} environment variable overrides")
    
    # Apply runtime environment overrides
    if ENVIRONMENT_OVERRIDES:
        applicable_overrides = {k: v for k, v in ENVIRONMENT_OVERRIDES.items() 
                              if k in environment_settings or k.startswith('CUSTOM_')}
        environment_settings.update(applicable_overrides)
        logger.debug(f"Applied {len(applicable_overrides)} runtime overrides")
    
    # Add environment metadata
    environment_settings['_ENVIRONMENT'] = target_environment
    environment_settings['_INCLUDE_BASE'] = include_base
    environment_settings['_SETTINGS_COUNT'] = len(environment_settings) - 2  # Exclude metadata
    
    # Log environment settings compilation with inheritance information
    logger.info(f"Compiled {len(environment_settings)} settings for {target_environment} environment")
    
    # Cache environment settings for performance optimization
    cache_key = f"env_{target_environment}_{include_base}"
    SETTINGS_CACHE[cache_key] = environment_settings
    
    # Return complete environment-specific settings dictionary
    return environment_settings


def create_settings_manager(environment: str = None, manager_config: dict = None) -> 'SettingsManager':
    """
    Factory function that creates SettingsManager instance with environment-specific configuration 
    and caching for simplified Flask settings management equivalent to Express.js configuration 
    management patterns.
    
    Args:
        environment (str): Environment name for SettingsManager configuration (development, production, staging, testing)
        manager_config (dict): Optional configuration dictionary for SettingsManager initialization
        
    Returns:
        SettingsManager: Configured SettingsManager instance with environment-specific settings 
                        and Flask application factory compatibility
    """
    # Validate environment parameter and manager configuration
    if environment is None:
        environment = FLASK_ENV
    
    if environment not in ['development', 'production', 'staging', 'testing']:
        logger.warning(f"Invalid environment for SettingsManager: {environment}, using development")
        environment = 'development'
    
    if manager_config is None:
        manager_config = {}
    
    # Load environment-specific settings using load_settings function
    try:
        initial_settings = load_settings(environment)
        logger.info(f"Loaded {len(initial_settings)} initial settings for SettingsManager")
    except Exception as e:
        logger.error(f"Failed to load initial settings: {str(e)}")
        initial_settings = {'FLASK_ENV': environment}
    
    # Create SettingsManager instance with configuration and settings
    try:
        settings_manager = SettingsManager(
            environment=environment,
            initial_settings=initial_settings
        )
        
        # Apply manager configuration options
        if 'cache_enabled' in manager_config:
            settings_manager.cache_enabled = manager_config['cache_enabled']
        
        if 'validation_rules' in manager_config:
            settings_manager.validation_rules.update(manager_config['validation_rules'])
        
        # Initialize caching and validation systems for performance
        if settings_manager.cache_enabled:
            cache_key = f"manager_{environment}"
            SETTINGS_CACHE[cache_key] = initial_settings.copy()
            logger.debug("SettingsManager cache initialized")
        
        # Set up change tracking and notification capabilities
        if hasattr(settings_manager, 'change_listeners'):
            logger.debug("SettingsManager change tracking initialized")
        
        # Log settings manager creation with configuration summary
        logger.info(f"SettingsManager created for {environment} environment")
        logger.debug(f"Manager config: cache_enabled={settings_manager.cache_enabled}")
        
        # Return configured SettingsManager instance for Flask application use
        return settings_manager
        
    except Exception as e:
        logger.error(f"Failed to create SettingsManager: {str(e)}")
        # Return minimal SettingsManager instance
        return SettingsManager(environment, {'FLASK_ENV': environment})


class SettingsManager:
    """
    Comprehensive Flask settings management class providing simplified configuration interface, 
    validation, caching, and runtime modification capabilities. Designed for Flask application 
    factory pattern integration with environment-aware settings management equivalent to Express.js 
    configuration patterns.
    
    This class provides enterprise-grade settings management with comprehensive validation, caching, 
    change notification, and runtime modification capabilities for Flask applications. Supports 
    development, production, staging, and testing environments with appropriate security and 
    performance optimizations for each deployment scenario.
    """
    
    def __init__(self, environment: str, initial_settings: dict = None):
        """
        Initializes SettingsManager with environment-specific configuration, validation rules, 
        and caching capabilities for Flask application settings management.
        
        Args:
            environment (str): Target environment for settings management (development, production, staging, testing)
            initial_settings (dict): Initial settings dictionary for SettingsManager configuration
        """
        # Validate environment parameter against ENVIRONMENT_TYPES
        if environment not in ['development', 'production', 'staging', 'testing']:
            logger.warning(f"Invalid environment '{environment}', defaulting to development")
            environment = 'development'
        
        self.environment = environment
        
        # Initialize settings dictionary with environment-specific defaults
        if initial_settings is None:
            initial_settings = load_settings(environment)
        
        self.settings = initial_settings.copy()
        
        # Load validation rules from constants for setting types and constraints
        self.validation_rules = {
            'SECRET_KEY': {'type': str, 'min_length': 32, 'required': True},
            'PORT': {'type': int, 'min_value': 1, 'max_value': 65535, 'required': True},
            'DEBUG': {'type': bool, 'required': True},
            'TESTING': {'type': bool, 'required': True},
            'FLASK_ENV': {'type': str, 'choices': ['development', 'production', 'staging', 'testing'], 'required': True}
        }
        
        # Set up caching system for performance optimization
        self.cache = {}
        self.cache_enabled = True
        
        # Initialize change listener system for setting updates
        self.change_listeners = []
        
        # Load initial settings and apply validation
        try:
            validation_result = self.validate()
            if validation_result['status'] != 'valid':
                logger.warning(f"Initial settings validation issues: {validation_result}")
        except Exception as e:
            logger.error(f"Initial validation failed: {str(e)}")
        
        # Log SettingsManager initialization with environment and settings summary
        logger.info(f"SettingsManager initialized for {environment} with {len(self.settings)} settings")
    
    def get(self, key: str, default: Any = None, expected_type: Type = None) -> Any:
        """
        Retrieves setting value with type validation, default fallback, and caching for optimal 
        performance in Flask applications.
        
        Args:
            key (str): Setting key name to retrieve from settings dictionary
            default (Any): Default value to return if setting key not found
            expected_type (Type): Optional type validation for returned setting value
            
        Returns:
            Any: Setting value with type validation and default fallback for Flask configuration access
        """
        # Check cache for setting value if caching enabled
        if self.cache_enabled and key in self.cache:
            cached_value = self.cache[key]
            logger.debug(f"Retrieved {key} from cache")
            return cached_value
        
        # Validate key against known setting keys
        if key not in self.settings and not key.startswith('CUSTOM_'):
            logger.debug(f"Unknown setting key requested: {key}")
        
        # Retrieve setting from environment variables or settings dict
        if key in self.settings:
            value = self.settings[key]
        else:
            # Check environment variables as fallback
            env_value = os.environ.get(key)
            if env_value is not None:
                value = env_value
                logger.debug(f"Retrieved {key} from environment variables")
            else:
                # Apply default value if setting not found
                value = default
                logger.debug(f"Using default value for {key}")
        
        # Validate value type if expected_type provided
        if expected_type is not None and value is not None:
            try:
                if expected_type == int:
                    value = int(value)
                elif expected_type == bool:
                    if isinstance(value, str):
                        value = value.lower() in ('true', '1', 'yes', 'on')
                    else:
                        value = bool(value)
                elif expected_type == str:
                    value = str(value)
                elif expected_type == float:
                    value = float(value)
                
                logger.debug(f"Type validated {key} as {expected_type.__name__}")
                
            except (ValueError, TypeError) as e:
                logger.warning(f"Type validation failed for {key}: {str(e)}")
                value = default
        
        # Cache validated value for future access
        if self.cache_enabled:
            self.cache[key] = value
        
        # Return properly typed setting value
        return value
    
    def set(self, key: str, value: Any, notify_listeners: bool = True, validate: bool = True) -> bool:
        """
        Sets setting value with validation, change notification, and persistence options for 
        runtime Flask configuration management.
        
        Args:
            key (str): Setting key name to update in settings dictionary
            value (Any): New value to assign to the specified setting key
            notify_listeners (bool): Whether to notify registered change listeners of the update
            validate (bool): Whether to validate the new setting value before applying
            
        Returns:
            bool: Success status indicating whether setting was successfully updated with validation
        """
        try:
            # Validate key and value if validate flag is True
            if validate:
                if key in self.validation_rules:
                    rule = self.validation_rules[key]
                    
                    # Type validation
                    if 'type' in rule:
                        expected_type = rule['type']
                        if not isinstance(value, expected_type):
                            try:
                                if expected_type == int:
                                    value = int(value)
                                elif expected_type == bool:
                                    if isinstance(value, str):
                                        value = value.lower() in ('true', '1', 'yes', 'on')
                                    else:
                                        value = bool(value)
                                elif expected_type == str:
                                    value = str(value)
                            except (ValueError, TypeError):
                                logger.error(f"Cannot convert {key} value to {expected_type.__name__}")
                                return False
                    
                    # Value constraints validation
                    if 'min_value' in rule and isinstance(value, (int, float)):
                        if value < rule['min_value']:
                            logger.error(f"{key} value {value} below minimum {rule['min_value']}")
                            return False
                    
                    if 'max_value' in rule and isinstance(value, (int, float)):
                        if value > rule['max_value']:
                            logger.error(f"{key} value {value} above maximum {rule['max_value']}")
                            return False
                    
                    if 'min_length' in rule and isinstance(value, str):
                        if len(value) < rule['min_length']:
                            logger.error(f"{key} length {len(value)} below minimum {rule['min_length']}")
                            return False
                    
                    if 'choices' in rule:
                        if value not in rule['choices']:
                            logger.error(f"{key} value {value} not in allowed choices {rule['choices']}")
                            return False
            
            # Update settings dictionary with new value
            old_value = self.settings.get(key)
            self.settings[key] = value
            
            # Clear cache entry for updated setting
            if self.cache_enabled and key in self.cache:
                del self.cache[key]
            
            # Notify change listeners if notify_listeners is True
            if notify_listeners and self.change_listeners:
                change_event = {
                    'key': key,
                    'old_value': old_value,
                    'new_value': value,
                    'timestamp': f"{sys.version_info.major}.{sys.version_info.minor}",
                    'environment': self.environment
                }
                
                for listener in self.change_listeners:
                    try:
                        if callable(listener.get('func')):
                            # Check if listener is filtered for this key
                            filter_keys = listener.get('filter_keys', [])
                            if not filter_keys or key in filter_keys:
                                listener['func'](change_event)
                    except Exception as e:
                        logger.error(f"Change listener error: {str(e)}")
            
            # Log setting change for audit trail
            logger.info(f"Setting updated: {key} = {value} (environment: {self.environment})")
            
            # Return success status
            return True
            
        except Exception as e:
            logger.error(f"Failed to set {key}: {str(e)}")
            return False
    
    def update(self, updates: dict, validate_all: bool = True, notify_listeners: bool = True) -> dict:
        """
        Updates multiple settings with batch validation and change notification for efficient 
        Flask configuration management.
        
        Args:
            updates (dict): Dictionary of key-value pairs to update in settings
            validate_all (bool): Whether to validate all updates before applying any changes
            notify_listeners (bool): Whether to notify change listeners of batch update
            
        Returns:
            dict: Update results with success status, validation errors, and change summary
        """
        update_result = {
            'status': 'success',
            'updated_count': 0,
            'failed_count': 0,
            'validation_errors': [],
            'updated_keys': [],
            'failed_keys': []
        }
        
        try:
            # Validate all updates if validate_all flag is True
            if validate_all:
                for key, value in updates.items():
                    if key in self.validation_rules:
                        rule = self.validation_rules[key]
                        
                        # Type validation
                        if 'type' in rule and not isinstance(value, rule['type']):
                            try:
                                expected_type = rule['type']
                                if expected_type == int:
                                    int(value)
                                elif expected_type == bool:
                                    if isinstance(value, str):
                                        value.lower() in ('true', '1', 'yes', 'on')
                                elif expected_type == str:
                                    str(value)
                            except (ValueError, TypeError):
                                error_msg = f"Invalid type for {key}: expected {rule['type'].__name__}"
                                update_result['validation_errors'].append(error_msg)
                
                if update_result['validation_errors']:
                    update_result['status'] = 'validation_failed'
                    logger.error(f"Batch update validation failed: {update_result['validation_errors']}")
                    return update_result
            
            # Apply updates to settings dictionary in transaction
            successful_updates = {}
            failed_updates = {}
            
            for key, value in updates.items():
                try:
                    old_value = self.settings.get(key)
                    
                    # Set individual setting without triggering listeners yet
                    if self.set(key, value, notify_listeners=False, validate=not validate_all):
                        successful_updates[key] = {'old': old_value, 'new': value}
                        update_result['updated_count'] += 1
                        update_result['updated_keys'].append(key)
                    else:
                        failed_updates[key] = value
                        update_result['failed_count'] += 1
                        update_result['failed_keys'].append(key)
                        
                except Exception as e:
                    failed_updates[key] = value
                    update_result['failed_count'] += 1
                    update_result['failed_keys'].append(key)
                    logger.error(f"Failed to update {key}: {str(e)}")
            
            # Clear affected cache entries
            if self.cache_enabled:
                for key in successful_updates.keys():
                    if key in self.cache:
                        del self.cache[key]
            
            # Notify change listeners of batch update
            if notify_listeners and self.change_listeners and successful_updates:
                batch_event = {
                    'type': 'batch_update',
                    'updates': successful_updates,
                    'updated_count': update_result['updated_count'],
                    'timestamp': f"{sys.version_info.major}.{sys.version_info.minor}",
                    'environment': self.environment
                }
                
                for listener in self.change_listeners:
                    try:
                        if callable(listener.get('func')):
                            listener['func'](batch_event)
                    except Exception as e:
                        logger.error(f"Batch update listener error: {str(e)}")
            
            # Log batch update with change summary
            logger.info(f"Batch update completed: {update_result['updated_count']} successful, {update_result['failed_count']} failed")
            
            # Return update results with validation status
            return update_result
            
        except Exception as e:
            update_result['status'] = 'error'
            update_result['error_message'] = str(e)
            logger.error(f"Batch update failed: {str(e)}")
            return update_result
    
    def validate(self, strict_mode: bool = False) -> dict:
        """
        Validates current settings against defined rules and constraints with comprehensive error 
        reporting for Flask configuration.
        
        Args:
            strict_mode (bool): Whether to apply strict validation rules and fail on warnings
            
        Returns:
            dict: Validation results with errors, warnings, and recommendations for settings configuration
        """
        validation_result = {
            'status': 'valid',
            'errors': [],
            'warnings': [],
            'recommendations': [],
            'environment': self.environment,
            'strict_mode': strict_mode,
            'validated_count': len(self.settings)
        }
        
        # Apply validation rules to all current settings
        for key, rule in self.validation_rules.items():
            if rule.get('required', False) and key not in self.settings:
                validation_result['errors'].append(f"Required setting missing: {key}")
                validation_result['status'] = 'invalid'
                continue
            
            if key in self.settings:
                value = self.settings[key]
                
                # Type validation
                if 'type' in rule:
                    expected_type = rule['type']
                    if not isinstance(value, expected_type):
                        validation_result['errors'].append(f"{key} type mismatch: expected {expected_type.__name__}, got {type(value).__name__}")
                        validation_result['status'] = 'invalid'
                
                # Value constraints
                if 'min_value' in rule and isinstance(value, (int, float)):
                    if value < rule['min_value']:
                        validation_result['errors'].append(f"{key} value {value} below minimum {rule['min_value']}")
                        validation_result['status'] = 'invalid'
                
                if 'max_value' in rule and isinstance(value, (int, float)):
                    if value > rule['max_value']:
                        validation_result['errors'].append(f"{key} value {value} above maximum {rule['max_value']}")
                        validation_result['status'] = 'invalid'
                
                if 'min_length' in rule and isinstance(value, str):
                    if len(value) < rule['min_length']:
                        validation_result['warnings'].append(f"{key} length {len(value)} below recommended {rule['min_length']}")
                        if strict_mode:
                            validation_result['status'] = 'invalid'
                
                if 'choices' in rule and value not in rule['choices']:
                    validation_result['errors'].append(f"{key} value {value} not in allowed choices {rule['choices']}")
                    validation_result['status'] = 'invalid'
        
        # Check required settings presence for Flask application
        flask_required = ['FLASK_ENV', 'SECRET_KEY']
        for required_key in flask_required:
            if required_key not in self.settings:
                validation_result['errors'].append(f"Flask required setting missing: {required_key}")
                validation_result['status'] = 'invalid'
        
        # Validate setting types and constraints
        if 'SECRET_KEY' in self.settings:
            secret_key = self.settings['SECRET_KEY']
            if isinstance(secret_key, str):
                if len(secret_key) < 32:
                    validation_result['warnings'].append("SECRET_KEY length below recommended 32 characters")
                if secret_key == 'dev-secret-key' and self.environment == 'production':
                    validation_result['errors'].append("Production environment requires secure SECRET_KEY")
                    validation_result['status'] = 'invalid'
        
        # Check environment-specific requirements
        if self.environment == 'production':
            if self.settings.get('DEBUG', False):
                validation_result['warnings'].append("DEBUG enabled in production environment")
                if strict_mode:
                    validation_result['status'] = 'invalid'
            
            if self.settings.get('TESTING', False):
                validation_result['warnings'].append("TESTING enabled in production environment")
                if strict_mode:
                    validation_result['status'] = 'invalid'
        
        # Compile validation results with recommendations
        if validation_result['errors']:
            validation_result['recommendations'].append("Fix validation errors before deployment")
        
        if validation_result['warnings']:
            validation_result['recommendations'].append("Review validation warnings for optimal configuration")
        
        if validation_result['status'] == 'valid':
            validation_result['recommendations'].append("Settings validation passed successfully")
        
        # Log validation completion with summary
        logger.info(f"Settings validation completed: {validation_result['status']}")
        if validation_result['errors']:
            logger.error(f"Validation errors: {validation_result['errors']}")
        if validation_result['warnings']:
            logger.warning(f"Validation warnings: {validation_result['warnings']}")
        
        # Return comprehensive validation report
        return validation_result
    
    def export(self, format: str, output_path: str, exclude_keys: list = None) -> dict:
        """
        Exports settings to specified format with filtering and security considerations for Flask 
        configuration management.
        
        Args:
            format (str): Export format (json, env, yaml)
            output_path (str): Output file path for exported settings
            exclude_keys (list): List of setting keys to exclude from export
            
        Returns:
            dict: Export results with file information and export statistics
        """
        return export_settings(format, output_path, exclude_keys or ['SECRET_KEY'])
    
    def reload(self, clear_cache: bool = True, notify_listeners: bool = True) -> dict:
        """
        Reloads settings from environment variables and configuration sources with cache invalidation 
        for dynamic Flask configuration.
        
        Args:
            clear_cache (bool): Whether to clear the settings cache before reloading
            notify_listeners (bool): Whether to notify change listeners of reload operation
            
        Returns:
            dict: Reload results with change summary and validation status
        """
        reload_result = {
            'status': 'success',
            'changes_detected': 0,
            'new_settings': [],
            'updated_settings': [],
            'removed_settings': []
        }
        
        try:
            # Clear cache if clear_cache flag is True
            if clear_cache and self.cache_enabled:
                self.cache.clear()
                logger.debug("Settings cache cleared")
            
            # Store current settings for comparison
            old_settings = self.settings.copy()
            
            # Reload settings from environment and configuration
            new_settings = load_settings(self.environment)
            
            # Compare old and new settings to detect changes
            for key, new_value in new_settings.items():
                if key not in old_settings:
                    reload_result['new_settings'].append(key)
                    reload_result['changes_detected'] += 1
                elif old_settings[key] != new_value:
                    reload_result['updated_settings'].append(key)
                    reload_result['changes_detected'] += 1
            
            for key in old_settings:
                if key not in new_settings:
                    reload_result['removed_settings'].append(key)
                    reload_result['changes_detected'] += 1
            
            # Update settings dictionary
            self.settings = new_settings
            
            # Validate reloaded settings
            validation_result = self.validate()
            reload_result['validation'] = validation_result
            
            # Notify change listeners of reload
            if notify_listeners and self.change_listeners:
                reload_event = {
                    'type': 'reload',
                    'changes_detected': reload_result['changes_detected'],
                    'new_settings': reload_result['new_settings'],
                    'updated_settings': reload_result['updated_settings'],
                    'removed_settings': reload_result['removed_settings'],
                    'timestamp': f"{sys.version_info.major}.{sys.version_info.minor}",
                    'environment': self.environment
                }
                
                for listener in self.change_listeners:
                    try:
                        if callable(listener.get('func')):
                            listener['func'](reload_event)
                    except Exception as e:
                        logger.error(f"Reload listener error: {str(e)}")
            
            # Log reload operation with change summary
            logger.info(f"Settings reloaded: {reload_result['changes_detected']} changes detected")
            
            # Return reload results with validation status
            return reload_result
            
        except Exception as e:
            reload_result['status'] = 'error'
            reload_result['error_message'] = str(e)
            logger.error(f"Settings reload failed: {str(e)}")
            return reload_result
    
    def add_change_listener(self, listener_func: Callable, filter_keys: list = None) -> str:
        """
        Adds change listener function for setting update notifications enabling reactive Flask 
        configuration management.
        
        Args:
            listener_func (Callable): Function to call when settings change
            filter_keys (list): Optional list of setting keys to filter notifications
            
        Returns:
            str: Listener ID for future reference and removal
        """
        # Validate listener function callable
        if not callable(listener_func):
            logger.error("Listener function must be callable")
            return None
        
        # Generate unique listener ID
        import uuid
        listener_id = str(uuid.uuid4())[:8]
        
        # Add listener to change_listeners list with filter
        listener_entry = {
            'id': listener_id,
            'func': listener_func,
            'filter_keys': filter_keys or [],
            'added_timestamp': f"{sys.version_info.major}.{sys.version_info.minor}"
        }
        
        self.change_listeners.append(listener_entry)
        
        # Log listener registration
        filter_info = f"filtered to {len(filter_keys)} keys" if filter_keys else "unfiltered"
        logger.info(f"Change listener {listener_id} registered ({filter_info})")
        
        # Return listener ID for reference
        return listener_id
    
    def remove_change_listener(self, listener_id: str) -> bool:
        """
        Removes change listener by ID for cleanup and memory management in Flask applications.
        
        Args:
            listener_id (str): Unique identifier of the listener to remove
            
        Returns:
            bool: Success status indicating whether listener was successfully removed
        """
        # Find listener by ID in change_listeners list
        for i, listener in enumerate(self.change_listeners):
            if listener['id'] == listener_id:
                # Remove listener from list if found
                removed_listener = self.change_listeners.pop(i)
                
                # Log listener removal
                logger.info(f"Change listener {listener_id} removed")
                
                # Return success status
                return True
        
        # Listener not found
        logger.warning(f"Change listener {listener_id} not found for removal")
        return False


# Create default settings manager instance pre-configured for the Flask tutorial application
settings = create_settings_manager(FLASK_ENV, {
    'cache_enabled': True,
    'validation_rules': {
        'PORT': {'type': int, 'min_value': 1, 'max_value': 65535, 'required': True},
        'SECRET_KEY': {'type': str, 'min_length': 32, 'required': True}
    }
})

# Log settings module initialization completion
logger.info(f"Flask settings module initialized with default manager for {FLASK_ENV} environment")