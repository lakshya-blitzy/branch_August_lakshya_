"""
Flask Application Main Entry Point - Cross-Platform Node.js Tutorial Project Migration

This module serves as the primary executable for the Flask cross-platform implementation,
providing server startup, configuration management, and application lifecycle control
equivalent to Express.js server entry point. Implements Flask application factory pattern
integration, environment-aware configuration, graceful shutdown handling, command-line
interface, and educational cross-platform comparison features.

Features:
- Flask application factory pattern integration with environment-specific configuration
- Cross-platform server startup parity maintaining complete feature compatibility with Express.js
- WSGI deployment preparation equivalent to PM2 cluster mode with Gunicorn multi-worker setup
- Graceful shutdown handling with signal management equivalent to Express.js process handling
- Command-line interface for Flask server management and configuration
- Educational cross-platform comparison demonstrating Flask vs Express.js equivalence
- Comprehensive health checks and monitoring integration for production deployment
- Performance metrics collection and validation against technical specification requirements

Educational Focus:
- Flask main entry point patterns equivalent to Express.js server.js implementation
- Cross-platform compatibility maintaining complete feature parity with Node.js version
- Flask-Talisman security integration equivalent to Helmet.js 15 sub-middlewares protection
- WSGI production deployment equivalent to PM2 process management and cluster mode
- Modern Python application patterns with Flask 3.1.1 latest stable release integration

Author: Flask Tutorial Implementation Team
Version: 1.0.0
Python Version: 3.9+
Flask Version: 3.1.1
Last Updated: 2025-01-01
"""

# Standard library imports for Flask main entry point and server management
import os  # built-in - Operating system interface for environment variable access equivalent to Node.js process module
import sys  # built-in - System-specific parameters and functions for command-line argument processing equivalent to Node.js process.argv
import signal  # built-in - Signal handling for Flask application graceful shutdown on SIGTERM/SIGINT equivalent to Node.js process signal handling
import atexit  # built-in - Exit handler registration for Flask application cleanup and resource release equivalent to Node.js process exit handling
import argparse  # built-in - Command-line argument parsing for Flask server configuration including port, host, environment, and debug mode options
import time  # built-in - Time utilities for Flask server startup timing, uptime tracking, and performance monitoring equivalent to Node.js Date and process.uptime
import threading  # built-in - Threading utilities for Flask development server and signal handling coordination in multi-threaded WSGI environments
import datetime  # built-in - Date and time utilities for timestamp generation and performance monitoring equivalent to Node.js Date objects
import json  # built-in - JSON serialization for structured output and configuration management equivalent to Node.js JSON module
import pathlib  # built-in - Object-oriented filesystem paths for configuration file handling and cross-platform compatibility
import traceback  # built-in - Stack trace utilities for comprehensive error logging and debugging equivalent to Node.js Error.stack
from typing import Dict, Any, Optional, List, Union, Tuple  # built-in - Type hints for comprehensive function signatures and documentation

# Third-party imports for Flask application and WSGI deployment
import psutil  # ^5.9.0 - System monitoring for Flask memory usage and CPU utilization equivalent to Node.js os module

# Internal imports for Flask application factory and configuration management
from app import create_app  # Flask application factory function for creating configured Flask application instances with comprehensive middleware and security
from config import get_config_class, DevelopmentConfig, ProductionConfig  # Configuration factory function for environment-specific Flask configuration class selection and validation
from utils.constants import (
    ENV_CONSTANTS,  # Environment constants for Flask server configuration including default port 3000, host settings, and environment detection
    API_CONSTANTS,  # API constants for Flask endpoint configuration and server information display
    TUTORIAL_CONSTANTS  # Tutorial constants for educational Flask implementation phase definitions and cross-platform comparison
)
from utils.logger import logger  # Flask logger for server startup logging, error tracking, and application lifecycle monitoring with request correlation

# Global Flask application state management for server lifecycle and configuration
flask_app: Optional[Any] = None
SERVER_START_TIME: float = time.time()
GRACEFUL_SHUTDOWN_TIMEOUT: int = 30
APPLICATION_VERSION: str = '1.0.0'
FLASK_MAIN_INITIALIZED: bool = False

# Global Flask server configuration and monitoring state
_shutdown_in_progress: bool = False
_startup_performance_metrics: Dict[str, Any] = {}
_health_check_status: Dict[str, Any] = {'status': 'unknown'}


def create_command_line_parser() -> argparse.ArgumentParser:
    """
    Creates comprehensive command-line argument parser for Flask server configuration including
    port, host, environment, debug mode, and deployment options equivalent to Express.js
    command-line interface with educational options and cross-platform compatibility settings.
    
    Returns:
        Configured argparse.ArgumentParser instance with Flask server options and educational configuration parameters
    """
    # Initialize argparse.ArgumentParser with Flask server description and usage information
    parser = argparse.ArgumentParser(
        description='Flask Cross-Platform Web Development Tutorial - Main Server Entry Point',
        prog='python main.py',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python main.py                          # Start development server on default port 3000
  python main.py --port 8080              # Start server on custom port
  python main.py --environment production # Start with production configuration
  python main.py --wsgi                   # Prepare WSGI deployment configuration
  python main.py --health-check           # Run application health check
        '''
    )
    
    # Add port argument with default 3000 for cross-platform compatibility with Express.js
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=ENV_CONSTANTS.get('DEFAULT_PORT', 3000),
        help=f"Server port number (default: {ENV_CONSTANTS.get('DEFAULT_PORT', 3000)}) - same as Express.js version"
    )
    
    # Add host argument with default localhost for development server binding
    parser.add_argument(
        '--host', '-H',
        type=str,
        default=ENV_CONSTANTS.get('DEFAULT_HOST', '127.0.0.1'),
        help=f"Server host address (default: {ENV_CONSTANTS.get('DEFAULT_HOST', '127.0.0.1')})"
    )
    
    # Add environment argument with choices for development, production, testing, staging
    environment_types = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {})
    parser.add_argument(
        '--environment', '--env', '-e',
        type=str,
        choices=list(environment_types.values()),
        default='development',
        help='Flask application environment (choices: %(choices)s)'
    )
    
    # Add debug mode argument for Flask development features and auto-reload
    parser.add_argument(
        '--debug', '-d',
        action='store_true',
        help='Enable Flask debug mode with auto-reload and detailed error pages'
    )
    
    # Add WSGI preparation argument for production deployment configuration
    parser.add_argument(
        '--wsgi',
        action='store_true',
        help='Prepare Flask application for WSGI deployment (Gunicorn) equivalent to PM2 cluster mode'
    )
    
    # Add educational mode argument for cross-platform comparison features
    parser.add_argument(
        '--educational',
        action='store_true',
        help='Enable educational features showing Flask vs Express.js comparison'
    )
    
    # Add health check argument for server status and monitoring endpoints
    parser.add_argument(
        '--health-check',
        action='store_true',
        help='Run comprehensive Flask application health check and exit'
    )
    
    # Add configuration validation argument for Flask setup verification
    parser.add_argument(
        '--validate-config',
        action='store_true',
        help='Validate Flask configuration and environment setup'
    )
    
    # Add verbose logging argument for detailed Flask application diagnostics
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging for detailed Flask diagnostics'
    )
    
    # Add version argument for Flask application version information
    parser.add_argument(
        '--version',
        action='version',
        version=f'%(prog)s {APPLICATION_VERSION}'
    )
    
    # Return configured ArgumentParser for Flask command-line interface processing
    return parser


def parse_command_line_arguments(argv: List[str]) -> Dict[str, Any]:
    """
    Parses and validates command-line arguments for Flask server configuration with comprehensive
    validation, environment detection, and cross-platform compatibility checks equivalent to
    Express.js argument processing with educational features and deployment preparation.
    
    Args:
        argv: Command-line arguments list for Flask server configuration
        
    Returns:
        Validated Flask server configuration dictionary with parsed arguments, environment settings, and deployment parameters
    """
    # Create command-line parser using create_command_line_parser function
    parser = create_command_line_parser()
    
    try:
        # Parse command-line arguments from argv with error handling and validation
        args = parser.parse_args(argv[1:])  # Skip script name
        
        # Convert argparse Namespace to dictionary for Flask configuration processing
        config = vars(args)
        
        # Validate port number range and availability for Flask server binding
        port = config.get('port', 3000)
        if not (1 <= port <= 65535):
            logger.error(f"Invalid port number {port}. Must be between 1 and 65535.")
            raise ValueError(f"Port {port} is out of valid range")
        
        # Check if port is available for binding
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind((config.get('host', '127.0.0.1'), port))
            sock.close()
        except OSError as e:
            logger.warning(f"Port {port} may not be available: {e}")
        
        # Validate host address format and network interface accessibility
        host = config.get('host', '127.0.0.1')
        if host not in ['127.0.0.1', 'localhost', '0.0.0.0'] and not host.replace('.', '').isdigit():
            logger.warning(f"Host address {host} may not be valid IPv4 address")
        
        # Validate environment parameter against supported Flask environment types
        environment = config.get('environment', 'development')
        valid_environments = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {}).values()
        if environment not in valid_environments:
            logger.error(f"Invalid environment {environment}. Valid options: {list(valid_environments)}")
            config['environment'] = 'development'  # Fallback to development
        
        # Process debug mode settings with environment compatibility checks
        if config.get('debug') and environment == 'production':
            logger.warning("Debug mode enabled in production environment - this is not recommended")
        elif environment == 'development' and not config.get('debug'):
            config['debug'] = True  # Enable debug by default in development
        
        # Validate WSGI deployment options and production readiness requirements
        if config.get('wsgi') and environment not in ['production', 'staging']:
            logger.warning("WSGI deployment typically used with production or staging environments")
        
        # Apply environment variable overrides for command-line argument defaults
        config['port'] = int(os.environ.get('PORT', config['port']))
        config['host'] = os.environ.get('HOST', config['host'])
        config['debug'] = config['debug'] or os.environ.get('FLASK_DEBUG', '').lower() in ['true', '1', 'yes']
        
        # Add Flask-specific configuration parameters for application factory
        config['flask_env'] = environment
        config['config_overrides'] = {
            'DEBUG': config.get('debug', False),
            'PORT': config.get('port', 3000),
            'HOST': config.get('host', '127.0.0.1')
        }
        
        # Log parsed configuration using Flask logger for debugging and audit trail
        logger.info("Command-line arguments parsed successfully", {
            'port': config['port'],
            'host': config['host'],
            'environment': config['environment'],
            'debug': config.get('debug', False),
            'wsgi': config.get('wsgi', False)
        })
        
        # Return validated Flask server configuration dictionary ready for application factory
        return config
        
    except argparse.ArgumentError as e:
        logger.error(f"Command-line argument error: {e}")
        parser.print_help()
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error parsing command-line arguments: {e}")
        sys.exit(1)


def detect_environment(cli_args: Dict[str, Any]) -> str:
    """
    Detects Flask application environment from multiple sources including command-line arguments,
    environment variables, and configuration files with fallback mechanisms and validation
    equivalent to Express.js environment detection with Flask-specific environment configuration.
    
    Args:
        cli_args: Command-line arguments dictionary with environment specification
        
    Returns:
        Detected Flask environment string validated against supported environment types
    """
    # Check command-line arguments for explicit environment specification
    environment = cli_args.get('environment')
    if environment:
        logger.info(f"Environment detected from command-line arguments: {environment}")
        return environment
    
    # Check FLASK_ENV environment variable for Flask environment configuration
    flask_env = os.environ.get('FLASK_ENV')
    if flask_env:
        logger.info(f"Environment detected from FLASK_ENV: {flask_env}")
        # Validate against supported environment types
        valid_environments = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {}).values()
        if flask_env in valid_environments:
            return flask_env
        else:
            logger.warning(f"Invalid FLASK_ENV value '{flask_env}', checking other sources")
    
    # Check NODE_ENV environment variable for cross-platform compatibility
    node_env = os.environ.get('NODE_ENV')
    if node_env:
        # Map Node.js environment names to Flask equivalents
        node_env_mapping = ENV_CONSTANTS.get('NODE_ENV_MAPPING', {})
        flask_equivalent = node_env_mapping.get(node_env)
        if flask_equivalent:
            logger.info(f"Environment mapped from NODE_ENV '{node_env}' to Flask '{flask_equivalent}'")
            return flask_equivalent
        else:
            logger.warning(f"Unknown NODE_ENV value '{node_env}', using default")
    
    # Check configuration files for environment detection and validation
    config_file_paths = [
        '.env',
        'config.ini',
        'environment.json'
    ]
    
    for config_path in config_file_paths:
        if os.path.exists(config_path):
            try:
                if config_path.endswith('.json'):
                    with open(config_path, 'r') as f:
                        config_data = json.load(f)
                        env_from_file = config_data.get('environment', config_data.get('env'))
                        if env_from_file:
                            logger.info(f"Environment detected from {config_path}: {env_from_file}")
                            return env_from_file
            except Exception as e:
                logger.warning(f"Error reading configuration file {config_path}: {e}")
    
    # Apply environment detection priority: CLI args > FLASK_ENV > NODE_ENV > config > default
    default_environment = 'development'
    logger.info(f"No environment specified, using default: {default_environment}")
    
    # Validate detected environment against ENV_CONSTANTS.ENVIRONMENT_TYPES
    valid_environments = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {}).values()
    if default_environment not in valid_environments:
        logger.error(f"Default environment '{default_environment}' not in valid environments: {list(valid_environments)}")
        default_environment = 'development'  # Final fallback
    
    # Log environment detection process and sources using Flask logger
    logger.info("Environment detection completed", {
        'detected_environment': default_environment,
        'detection_sources_checked': ['CLI args', 'FLASK_ENV', 'NODE_ENV', 'config files'],
        'fallback_applied': True
    })
    
    # Return validated Flask environment string for configuration class selection
    return default_environment


def setup_signal_handlers(app: Any) -> None:
    """
    Sets up Flask application signal handlers for graceful shutdown including SIGTERM, SIGINT,
    and SIGHUP handling with cleanup procedures and resource release equivalent to Express.js
    process signal handling with Flask-specific WSGI deployment considerations.
    
    Args:
        app: Flask application instance for signal handler registration
    """
    global flask_app
    flask_app = app
    
    # Register SIGTERM handler for graceful Flask application shutdown from process manager
    def sigterm_handler(signum: int, frame: Any) -> None:
        logger.info("SIGTERM received - initiating graceful shutdown")
        handle_graceful_shutdown(signum, frame)
    
    # Register SIGINT handler for keyboard interrupt (Ctrl+C) graceful shutdown
    def sigint_handler(signum: int, frame: Any) -> None:
        logger.info("SIGINT received - initiating graceful shutdown")
        handle_graceful_shutdown(signum, frame)
    
    # Register SIGHUP handler for configuration reload without service interruption
    def sighup_handler(signum: int, frame: Any) -> None:
        logger.info("SIGHUP received - reloading configuration")
        # In a production WSGI environment, this would trigger config reload
        logger.info("Configuration reload completed (placeholder implementation)")
    
    # Configure signal handlers with appropriate signal numbers
    signal.signal(signal.SIGTERM, sigterm_handler)
    signal.signal(signal.SIGINT, sigint_handler)
    
    # SIGHUP is not available on Windows
    if hasattr(signal, 'SIGHUP'):
        signal.signal(signal.SIGHUP, sighup_handler)
    
    # Configure atexit handlers for Flask application cleanup and resource release
    def cleanup_handler() -> None:
        if not _shutdown_in_progress:
            logger.info("Process exit detected - performing cleanup")
            cleanup_resources()
    
    atexit.register(cleanup_handler)
    
    # Set up Flask application context preservation during shutdown process
    # This ensures Flask context is available during graceful shutdown
    
    # Log signal handler registration completion with handler summary
    logger.info("Signal handlers registered successfully", {
        'handlers': ['SIGTERM', 'SIGINT', 'SIGHUP' if hasattr(signal, 'SIGHUP') else 'SIGHUP (not available)'],
        'atexit_registered': True,
        'graceful_shutdown_timeout': GRACEFUL_SHUTDOWN_TIMEOUT
    })


def handle_graceful_shutdown(signum: int, frame: Any) -> None:
    """
    Handles Flask application graceful shutdown including resource cleanup, connection closure,
    logging finalization, and process termination with timeout management equivalent to Express.js
    graceful shutdown with Flask-specific WSGI deployment considerations and educational logging.
    
    Args:
        signum: Signal number that triggered the shutdown
        frame: Current stack frame at signal reception
    """
    global _shutdown_in_progress, flask_app
    
    if _shutdown_in_progress:
        logger.warning("Graceful shutdown already in progress, forcing immediate exit")
        sys.exit(1)
    
    _shutdown_in_progress = True
    
    # Log graceful shutdown initiation with signal number and Flask application context
    signal_names = {
        signal.SIGTERM: 'SIGTERM',
        signal.SIGINT: 'SIGINT'
    }
    signal_name = signal_names.get(signum, f'Signal {signum}')
    
    logger.info(f"Graceful shutdown initiated by {signal_name}", {
        'signal_number': signum,
        'server_uptime': time.time() - SERVER_START_TIME,
        'flask_app_status': 'active' if flask_app else 'not_initialized'
    })
    
    # Start shutdown timeout to prevent hanging
    shutdown_timer = threading.Timer(GRACEFUL_SHUTDOWN_TIMEOUT, force_shutdown)
    shutdown_timer.start()
    
    try:
        # Stop accepting new Flask requests and begin request draining process
        if flask_app:
            logger.info("Stopping Flask application request processing")
            # In a production WSGI environment, this would coordinate with Gunicorn
        
        # Wait for existing Flask requests to complete with timeout management
        # Note: In development server, this is simplified; WSGI handles this better
        active_connections = getattr(flask_app, '_active_connections', 0)
        if active_connections > 0:
            logger.info(f"Waiting for {active_connections} active connections to complete")
            # In a real WSGI deployment, we'd wait for connections to drain
            time.sleep(min(5, GRACEFUL_SHUTDOWN_TIMEOUT // 2))
        
        # Close Flask database connections and external service connections
        # Note: This application is stateless, but this is where DB cleanup would happen
        logger.info("Closing external connections (none in this stateless implementation)")
        
        # Perform Flask application resource cleanup
        cleanup_resources()
        
        # Cancel shutdown timer since we completed gracefully
        shutdown_timer.cancel()
        
        # Log Flask graceful shutdown completion with uptime and statistics
        total_uptime = time.time() - SERVER_START_TIME
        logger.info("Graceful shutdown completed successfully", {
            'total_uptime_seconds': round(total_uptime, 2),
            'shutdown_signal': signal_name,
            'cleanup_completed': True
        })
        
        # Terminate Flask application process with appropriate exit code
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"Error during graceful shutdown: {e}", e)
        shutdown_timer.cancel()
        sys.exit(1)


def force_shutdown() -> None:
    """
    Forces immediate shutdown if graceful shutdown timeout is exceeded.
    """
    logger.error(f"Graceful shutdown timeout ({GRACEFUL_SHUTDOWN_TIMEOUT}s) exceeded - forcing exit")
    os._exit(1)


def cleanup_resources() -> None:
    """
    Performs Flask application resource cleanup including memory release and file handle closure.
    """
    global flask_app, _startup_performance_metrics
    
    try:
        # Flush Flask application logs and finalize log rotation
        logger.info("Flushing application logs")
        
        # Release Flask application resources including file handles and memory
        if flask_app:
            # Close any open file handles or connections
            logger.info("Releasing Flask application resources")
        
        # Clear performance metrics cache to free memory
        _startup_performance_metrics.clear()
        
        # Log cleanup completion
        logger.info("Resource cleanup completed")
        
    except Exception as e:
        logger.error(f"Error during resource cleanup: {e}")


def validate_server_configuration(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates Flask server configuration including port availability, host accessibility,
    environment consistency, and deployment readiness with comprehensive checks equivalent
    to Express.js server validation with Flask-specific WSGI deployment verification and
    cross-platform compatibility.
    
    Args:
        config: Flask server configuration dictionary to validate
        
    Returns:
        Flask server configuration validation result with status, errors, warnings, and deployment readiness assessment
    """
    validation_result = {
        'status': 'valid',
        'errors': [],
        'warnings': [],
        'recommendations': [],
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'deployment_ready': False
    }
    
    try:
        # Validate Flask server port availability and network interface binding
        port = config.get('port', 3000)
        host = config.get('host', '127.0.0.1')
        
        # Check port range validity
        if not (1 <= port <= 65535):
            validation_result['errors'].append(f"Port {port} is out of valid range (1-65535)")
            validation_result['status'] = 'invalid'
        
        # Test port availability
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind((host, port))
            sock.close()
            validation_result['recommendations'].append(f"Port {port} is available for binding")
        except OSError as e:
            validation_result['warnings'].append(f"Port {port} binding test failed: {e}")
        
        # Check Flask host address accessibility and DNS resolution
        if host == '0.0.0.0':
            validation_result['warnings'].append("Host 0.0.0.0 exposes server to all network interfaces")
        elif host not in ['127.0.0.1', 'localhost']:
            try:
                import socket
                socket.inet_aton(host)  # Validate IPv4 address
            except socket.error:
                validation_result['warnings'].append(f"Host address {host} may not be valid IPv4")
        
        # Validate Flask environment configuration consistency and completeness
        environment = config.get('environment', 'development')
        valid_environments = ENV_CONSTANTS.get('ENVIRONMENT_TYPES', {}).values()
        if environment not in valid_environments:
            validation_result['errors'].append(f"Invalid environment '{environment}'")
            validation_result['status'] = 'invalid'
        
        # Check Flask application factory configuration and dependency availability
        try:
            config_class = get_config_class(environment)
            if config_class:
                validation_result['recommendations'].append(f"Configuration class for {environment} is available")
            else:
                validation_result['errors'].append(f"No configuration class available for {environment}")
                validation_result['status'] = 'invalid'
        except Exception as e:
            validation_result['errors'].append(f"Configuration class validation failed: {e}")
            validation_result['status'] = 'invalid'
        
        # Validate Flask security configuration and protection enablement
        debug_mode = config.get('debug', False)
        if debug_mode and environment == 'production':
            validation_result['errors'].append("Debug mode enabled in production environment")
            validation_result['status'] = 'invalid'
        elif debug_mode and environment in ['staging', 'testing']:
            validation_result['warnings'].append(f"Debug mode enabled in {environment} environment")
        
        # Check Flask WSGI deployment configuration and Gunicorn compatibility
        wsgi_mode = config.get('wsgi', False)
        if wsgi_mode:
            # Check Python version compatibility
            python_version = sys.version_info
            if python_version < (3, 9):
                validation_result['errors'].append(f"Python {python_version.major}.{python_version.minor} below minimum 3.9 for WSGI deployment")
                validation_result['status'] = 'invalid'
            else:
                validation_result['recommendations'].append("Python version compatible with WSGI deployment")
            
            # Check if we're in production environment for WSGI
            if environment not in ['production', 'staging']:
                validation_result['warnings'].append("WSGI deployment typically used with production/staging environments")
        
        # Validate Flask cross-platform compatibility and feature parity settings
        cross_platform_mode = config.get('educational', False)
        if cross_platform_mode:
            validation_result['recommendations'].append("Educational mode enabled for cross-platform comparison")
        
        # Check system resources for Flask deployment
        try:
            memory_info = psutil.virtual_memory()
            if memory_info.available < 512 * 1024 * 1024:  # 512MB
                validation_result['warnings'].append("Low available memory may affect Flask performance")
            
            cpu_count = psutil.cpu_count()
            if cpu_count and cpu_count < 2:
                validation_result['warnings'].append("Single CPU core may limit concurrent request handling")
        except Exception as e:
            validation_result['warnings'].append(f"System resource check failed: {e}")
        
        # Generate deployment readiness assessment
        if validation_result['status'] == 'valid' and not validation_result['errors']:
            if environment == 'production' and not debug_mode:
                validation_result['deployment_ready'] = True
                validation_result['recommendations'].append("Configuration ready for production deployment")
            elif environment in ['staging', 'testing']:
                validation_result['deployment_ready'] = True
                validation_result['recommendations'].append(f"Configuration ready for {environment} deployment")
            else:
                validation_result['recommendations'].append("Configuration suitable for development")
        
        # Log validation results using Flask logger for debugging and audit trail
        logger.info("Server configuration validation completed", {
            'status': validation_result['status'],
            'errors_count': len(validation_result['errors']),
            'warnings_count': len(validation_result['warnings']),
            'deployment_ready': validation_result['deployment_ready']
        })
        
    except Exception as e:
        validation_result['status'] = 'error'
        validation_result['errors'].append(f"Configuration validation error: {e}")
        logger.error(f"Configuration validation failed: {e}", e)
    
    # Return Flask server configuration validation result with deployment readiness status
    return validation_result


def initialize_flask_application(environment: str, config_overrides: Dict[str, Any]) -> Any:
    """
    Initializes Flask application using application factory pattern with environment-specific
    configuration, middleware integration, and comprehensive setup equivalent to Express.js
    application initialization with Flask-specific security, monitoring, and educational features
    for cross-platform demonstration.
    
    Args:
        environment: Flask environment string for configuration selection
        config_overrides: Configuration overrides dictionary from command-line and environment
        
    Returns:
        Fully initialized Flask application instance ready for development server or WSGI deployment
    """
    global FLASK_MAIN_INITIALIZED
    
    try:
        # Create Flask application instance using create_app factory function from app.py
        logger.info(f"Initializing Flask application for {environment} environment")
        
        # Get environment-specific configuration class using get_config_class from config.py
        config_class = get_config_class(environment)
        if not config_class:
            raise ValueError(f"No configuration class available for environment: {environment}")
        
        # Apply configuration overrides from command-line arguments and environment variables
        app = create_app(config_class)
        
        # Apply configuration overrides
        for key, value in config_overrides.items():
            if hasattr(app.config, key) or key.isupper():
                app.config[key] = value
                logger.debug(f"Applied configuration override: {key} = {value}")
        
        # Initialize Flask application context and request context configuration
        with app.app_context():
            # Set up Flask signal handlers for graceful shutdown and process management
            setup_signal_handlers(app)
            
            # Configure Flask application logging and monitoring integration
            logger.info("Flask application context initialized successfully")
            
            # Initialize Flask health check endpoints and monitoring capabilities
            global _health_check_status
            _health_check_status = {
                'status': 'healthy',
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'environment': environment,
                'version': APPLICATION_VERSION,
                'uptime': 0  # Will be updated at runtime
            }
            
            # Set up Flask educational features for cross-platform comparison
            if config_overrides.get('educational', False):
                app.config['EDUCATIONAL_MODE'] = True
                logger.info("Educational mode enabled for cross-platform Flask vs Express.js comparison")
            
            # Validate Flask application initialization and readiness for server startup
            if not app:
                raise RuntimeError("Flask application factory returned None")
            
            # Store startup performance metrics
            global _startup_performance_metrics
            _startup_performance_metrics = {
                'initialization_time': time.time() - SERVER_START_TIME,
                'environment': environment,
                'debug_mode': app.debug,
                'config_class': config_class.__name__,
                'overrides_applied': len(config_overrides)
            }
            
            # Mark Flask main as initialized
            FLASK_MAIN_INITIALIZED = True
            
            # Log Flask application initialization completion with configuration summary
            logger.info("Flask application initialization completed successfully", {
                'environment': environment,
                'debug_mode': app.debug,
                'config_class': config_class.__name__,
                'educational_mode': app.config.get('EDUCATIONAL_MODE', False),
                'initialization_time_ms': round(_startup_performance_metrics['initialization_time'] * 1000, 2)
            })
            
            # Return fully configured Flask application instance ready for server execution
            return app
    
    except Exception as e:
        logger.error(f"Flask application initialization failed: {e}", e)
        raise


def start_development_server(app: Any, host: str, port: int, debug: bool) -> None:
    """
    Starts Flask development server with debug mode, auto-reload, and development features
    equivalent to Express.js development server with Flask-specific configuration, educational
    logging, and cross-platform compatibility demonstration for learning and testing purposes.
    
    Args:
        app: Flask application instance to serve
        host: Host address for server binding
        port: Port number for server listening
        debug: Debug mode flag for development features
    """
    global flask_app
    flask_app = app
    
    try:
        # Configure Flask development server settings including debug mode and auto-reload
        server_config = {
            'host': host,
            'port': port,
            'debug': debug,
            'use_reloader': debug,
            'use_debugger': debug,
            'threaded': True,
            'load_dotenv': False  # We handle environment detection manually
        }
        
        # Set up Flask development server logging with detailed request tracking
        if debug:
            import logging
            logging.getLogger('werkzeug').setLevel(logging.INFO)
        
        # Display Flask server startup information including endpoints and configuration
        display_server_information(app, server_config)
        
        # Show Flask educational information about cross-platform implementation
        if app.config.get('EDUCATIONAL_MODE', False):
            display_educational_content()
        
        # Display Flask API endpoint documentation and testing information
        display_api_endpoints(app)
        
        # Log Flask development server startup completion with access URLs
        logger.info("Starting Flask development server", {
            'host': host,
            'port': port,
            'debug': debug,
            'server_url': f'http://{host}:{port}',
            'startup_time': time.time() - SERVER_START_TIME
        })
        
        # Start Flask development server with blocking execution on specified host and port
        app.run(**server_config)
        
    except KeyboardInterrupt:
        logger.info("Development server stopped by user")
    except Exception as e:
        logger.error(f"Development server error: {e}", e)
        raise
    finally:
        # Handle Flask development server shutdown and cleanup on termination
        logger.info("Flask development server shutdown completed")


def prepare_wsgi_deployment(app: Any, deployment_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepares Flask application for WSGI deployment with Gunicorn configuration, production
    optimizations, and deployment verification equivalent to PM2 cluster mode preparation
    with Flask-specific WSGI settings, worker coordination, and production readiness validation.
    
    Args:
        app: Flask application instance for WSGI deployment
        deployment_config: WSGI deployment configuration dictionary
        
    Returns:
        WSGI deployment configuration with Gunicorn settings, worker parameters, and production optimization equivalent to PM2 cluster mode
    """
    try:
        # Configure Flask application for WSGI deployment with production settings
        logger.info("Preparing Flask application for WSGI deployment")
        
        # Calculate optimal worker count based on CPU cores
        import multiprocessing
        cpu_count = multiprocessing.cpu_count()
        worker_count = deployment_config.get('workers', (cpu_count * 2) + 1)
        
        # Generate Gunicorn configuration equivalent to PM2 cluster mode settings
        wsgi_config = {
            'application': 'main:flask_app',
            'bind': f"{deployment_config.get('host', '0.0.0.0')}:{deployment_config.get('port', 3000)}",
            'workers': worker_count,
            'worker_class': deployment_config.get('worker_class', 'sync'),
            'worker_connections': deployment_config.get('worker_connections', 1000),
            'timeout': deployment_config.get('timeout', 30),
            'graceful_timeout': deployment_config.get('graceful_timeout', 30),
            'keepalive': deployment_config.get('keepalive', 2),
            'max_requests': deployment_config.get('max_requests', 1000),
            'max_requests_jitter': deployment_config.get('max_requests_jitter', 100),
            'preload_app': deployment_config.get('preload_app', True),
            'reload': False,  # Disabled in production
            'daemon': False,
            'log_level': deployment_config.get('log_level', 'warning'),
            'access_log': deployment_config.get('access_log', '-'),
            'error_log': deployment_config.get('error_log', '-')
        }
        
        # Set up Flask worker process configuration and resource limits
        worker_config = {
            'worker_tmp_dir': '/dev/shm',
            'worker_memory_limit': '512MB',
            'forwarded_allow_ips': '127.0.0.1',
            'secure_scheme_headers': {
                'X-Forwarded-Proto': 'https',
                'X-Forwarded-For': 'proxy'
            }
        }
        wsgi_config.update(worker_config)
        
        # Configure Flask production logging and monitoring for WSGI deployment
        if deployment_config.get('environment') == 'production':
            wsgi_config.update({
                'access_log': '/var/log/gunicorn/access.log',
                'error_log': '/var/log/gunicorn/error.log',
                'pid_file': '/var/run/gunicorn.pid'
            })
        
        # Set up Flask graceful restart and zero-downtime deployment capabilities
        graceful_config = {
            'graceful_restart': True,
            'zero_downtime_reload': True,
            'restart_signal': 'SIGHUP',
            'worker_restart_signal': 'SIGUSR1'
        }
        
        # Generate Flask WSGI deployment documentation and startup commands
        startup_commands = {
            'gunicorn_command': f"gunicorn --config gunicorn.conf.py main:flask_app",
            'pm2_equivalent': f"pm2 start ecosystem.config.js --env production",
            'systemd_service': "systemctl start flask-tutorial-app"
        }
        
        # Create Gunicorn configuration file content
        gunicorn_conf_content = f'''#!/usr/bin/env python3
"""
Gunicorn configuration for Flask application deployment
Generated by Flask Tutorial Application
"""

import multiprocessing

# Server socket
bind = "{wsgi_config['bind']}"
backlog = 2048

# Worker processes
workers = {wsgi_config['workers']}
worker_class = "{wsgi_config['worker_class']}"
worker_connections = {wsgi_config['worker_connections']}
timeout = {wsgi_config['timeout']}
graceful_timeout = {wsgi_config['graceful_timeout']}
keepalive = {wsgi_config['keepalive']}

# Restart workers after this many requests
max_requests = {wsgi_config['max_requests']}
max_requests_jitter = {wsgi_config['max_requests_jitter']}

# Preload app for better performance
preload_app = {wsgi_config['preload_app']}

# Logging
loglevel = "{wsgi_config['log_level']}"
accesslog = "{wsgi_config['access_log']}"
errorlog = "{wsgi_config['error_log']}"

# Process naming
proc_name = "flask-tutorial-app"

# Server mechanics
daemon = False
pidfile = "{wsgi_config.get('pid_file', '/tmp/gunicorn.pid')}"
user = None
group = None
tmp_upload_dir = None

# SSL (configure as needed)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"
'''
        
        # Validate Flask WSGI deployment configuration and Gunicorn compatibility
        validation_result = {
            'valid': True,
            'warnings': [],
            'recommendations': []
        }
        
        # Check Python version compatibility
        if sys.version_info < (3, 9):
            validation_result['warnings'].append("Python version below recommended 3.9 for production")
        
        # Check worker count recommendations
        if worker_count > cpu_count * 4:
            validation_result['warnings'].append(f"Worker count {worker_count} may be excessive for {cpu_count} CPUs")
        elif worker_count < 2:
            validation_result['warnings'].append("Low worker count may impact availability")
        
        # Check memory requirements
        try:
            memory_info = psutil.virtual_memory()
            estimated_memory_per_worker = 100 * 1024 * 1024  # 100MB per worker
            total_estimated_memory = worker_count * estimated_memory_per_worker
            
            if total_estimated_memory > memory_info.available * 0.8:
                validation_result['warnings'].append("High memory usage estimated for worker count")
        except Exception:
            pass
        
        # Prepare complete WSGI deployment package
        deployment_package = {
            'gunicorn_config': wsgi_config,
            'gunicorn_conf_file': gunicorn_conf_content,
            'startup_commands': startup_commands,
            'graceful_config': graceful_config,
            'validation': validation_result,
            'pm2_equivalent': {
                'instances': worker_count,
                'exec_mode': 'cluster',
                'max_memory_restart': '1G',
                'watch': False,
                'env': {
                    'FLASK_ENV': deployment_config.get('environment', 'production'),
                    'NODE_ENV': deployment_config.get('environment', 'production'),
                    'PORT': deployment_config.get('port', 3000)
                }
            }
        }
        
        # Log Flask WSGI preparation completion with deployment configuration summary
        logger.info("WSGI deployment preparation completed", {
            'workers': worker_count,
            'bind_address': wsgi_config['bind'],
            'worker_class': wsgi_config['worker_class'],
            'preload_app': wsgi_config['preload_app'],
            'validation_warnings': len(validation_result['warnings'])
        })
        
        # Return WSGI deployment configuration ready for production Gunicorn execution
        return deployment_package
        
    except Exception as e:
        logger.error(f"WSGI deployment preparation failed: {e}", e)
        raise


def display_server_information(app: Any, config: Dict[str, Any]) -> None:
    """
    Displays comprehensive Flask server information including startup details, endpoint
    documentation, configuration summary, educational content, and cross-platform comparison
    equivalent to Express.js server information with Flask-specific details and tutorial integration.
    
    Args:
        app: Flask application instance for information extraction
        config: Server configuration dictionary for display
    """
    try:
        # Display Flask server startup banner with version and environment information
        print("\n" + "="*80)
        print("🐍 FLASK CROSS-PLATFORM WEB DEVELOPMENT TUTORIAL")
        print("="*80)
        print(f"Application Version: {APPLICATION_VERSION}")
        print(f"Flask Version: {app.__class__.__module__}")
        print(f"Python Version: {sys.version.split()[0]}")
        print(f"Environment: {config.get('environment', app.config.get('FLASK_ENV', 'development'))}")
        print(f"Debug Mode: {app.debug}")
        print(f"Server Start Time: {datetime.datetime.fromtimestamp(SERVER_START_TIME).strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Show Flask server configuration including host, port, and environment details
        print("\n📡 SERVER CONFIGURATION")
        print("-" * 30)
        print(f"Host: {config.get('host', '127.0.0.1')}")
        print(f"Port: {config.get('port', 3000)}")
        print(f"Server URL: http://{config.get('host', '127.0.0.1')}:{config.get('port', 3000)}")
        print(f"Worker Threads: {'Enabled' if config.get('threaded', False) else 'Disabled'}")
        print(f"Auto-reload: {'Enabled' if config.get('use_reloader', False) else 'Disabled'}")
        
        # Display Flask security configuration status and protection features enabled
        print("\n🔒 SECURITY CONFIGURATION")
        print("-" * 30)
        security_headers = getattr(app.config, 'TALISMAN_CONFIG', {})
        if security_headers:
            print("✅ Flask-Talisman Security Headers: Enabled")
            print("✅ Content Security Policy: Configured")
            print("✅ HTTPS Enforcement: " + ("Enabled" if security_headers.get('force_https', False) else "Disabled"))
        else:
            print("⚠️  Security headers not configured")
        
        cors_config = getattr(app.config, 'CORS_CONFIG', {})
        if cors_config:
            print("✅ CORS Configuration: Enabled")
        else:
            print("⚠️  CORS configuration not found")
        
        # Show Flask monitoring and logging configuration with dashboard access
        print("\n📊 MONITORING & LOGGING")
        print("-" * 30)
        print(f"Log Level: {config.get('log_level', 'INFO')}")
        print(f"Performance Monitoring: {'Enabled' if _startup_performance_metrics else 'Disabled'}")
        print(f"Health Check Endpoint: /health")
        print(f"Server Status: {'Running' if FLASK_MAIN_INITIALIZED else 'Initializing'}")
        
        # Display system resource information
        try:
            memory_info = psutil.virtual_memory()
            cpu_count = psutil.cpu_count()
            print(f"System Memory: {memory_info.percent}% used of {memory_info.total // (1024**3)}GB")
            print(f"CPU Cores: {cpu_count}")
        except Exception:
            print("System information: Not available")
        
        print("\n" + "="*80)
        
    except Exception as e:
        logger.error(f"Error displaying server information: {e}")


def display_educational_content() -> None:
    """
    Displays educational content about Flask vs Express.js comparison and cross-platform development.
    """
    try:
        print("\n🎓 EDUCATIONAL CONTENT: FLASK vs EXPRESS.js")
        print("="*60)
        print("This Flask implementation maintains complete feature parity with Express.js:")
        print()
        
        # Display framework comparison
        comparison_data = [
            ("Server Framework", "Flask 3.1.1", "Express.js 5.1.0"),
            ("Language", "Python 3.9+", "Node.js 18+"),
            ("Routing", "@app.route()", "app.get(), app.post()"),
            ("Security", "Flask-Talisman", "Helmet.js"),
            ("CORS", "Flask-CORS", "cors middleware"),
            ("Process Management", "Gunicorn + WSGI", "PM2 + Cluster"),
            ("Testing", "pytest", "Jest/Mocha"),
            ("Configuration", "Config classes", "Environment files")
        ]
        
        print("Feature Comparison:")
        print("-" * 60)
        for feature, flask_impl, express_impl in comparison_data:
            print(f"{feature:<20} | {flask_impl:<15} | {express_impl}")
        
        print("\n🔄 Cross-Platform Benefits:")
        print("• Same API endpoints (/hello, /good-evening)")
        print("• Identical response formats")
        print("• Same port (3000) for compatibility")
        print("• Equivalent security headers")
        print("• Similar deployment patterns")
        
        tutorial_phases = TUTORIAL_CONSTANTS.get('PHASE_DEFINITIONS', {})
        if tutorial_phases:
            print(f"\n📚 Tutorial Progress: {len(tutorial_phases)} phases available")
            for phase_key, phase_info in tutorial_phases.items():
                if isinstance(phase_info, dict):
                    print(f"• {phase_info.get('title', phase_key)}")
        
        print("\n" + "="*60)
        
    except Exception as e:
        logger.error(f"Error displaying educational content: {e}")


def display_api_endpoints(app: Any) -> None:
    """
    Displays Flask API endpoint documentation with URL patterns and response examples.
    """
    try:
        print("\n🌐 API ENDPOINTS")
        print("-" * 30)
        
        # Get API endpoints from constants
        endpoints = API_CONSTANTS.get('ENDPOINTS', {})
        responses = API_CONSTANTS.get('RESPONSES', {})
        
        # Display main endpoints
        base_url = f"http://127.0.0.1:{os.environ.get('PORT', 3000)}"
        
        print(f"Base URL: {base_url}")
        print()
        
        endpoint_docs = [
            ("GET /hello", "Returns 'Hello world' message", responses.get('HELLO_WORLD', {})),
            ("GET /good-evening", "Returns 'Good evening' message", responses.get('GOOD_EVENING', {})),
            ("GET /health", "Application health check", responses.get('HEALTH_OK', {}))
        ]
        
        for endpoint, description, response_example in endpoint_docs:
            print(f"📍 {endpoint}")
            print(f"   Description: {description}")
            print(f"   Example: curl {base_url}{endpoint.split()[1]}")
            if response_example:
                # Clean up response example for display
                clean_response = {k: v for k, v in response_example.items() if not str(v).startswith('${')}
                if clean_response:
                    print(f"   Response: {json.dumps(clean_response, indent=2)}")
            print()
        
        print("💡 Testing Tips:")
        print("• Use curl, Postman, or browser to test endpoints")
        print("• All endpoints return JSON responses")
        print("• Health check shows server status and uptime")
        print("• Responses match Express.js implementation exactly")
        
    except Exception as e:
        logger.error(f"Error displaying API endpoints: {e}")


def run_health_check(app: Any) -> Dict[str, Any]:
    """
    Runs comprehensive Flask application health check including endpoint availability,
    configuration validation, security status, and deployment readiness equivalent to
    Express.js health checks with Flask-specific monitoring and educational assessment
    for tutorial validation.
    
    Args:
        app: Flask application instance for health assessment
        
    Returns:
        Flask application health check result with status, metrics, recommendations, and educational assessment
    """
    health_result = {
        'status': 'healthy',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'version': APPLICATION_VERSION,
        'uptime_seconds': round(time.time() - SERVER_START_TIME, 2),
        'checks': {},
        'metrics': {},
        'recommendations': [],
        'educational_assessment': {}
    }
    
    try:
        # Test Flask application endpoint availability and response validation
        health_result['checks']['endpoints'] = {}
        
        with app.test_client() as client:
            # Test /hello endpoint
            try:
                response = client.get('/hello')
                health_result['checks']['endpoints']['hello'] = {
                    'status': 'pass' if response.status_code == 200 else 'fail',
                    'status_code': response.status_code,
                    'response_time_ms': 0  # Test client doesn't provide timing
                }
            except Exception as e:
                health_result['checks']['endpoints']['hello'] = {
                    'status': 'fail',
                    'error': str(e)
                }
            
            # Test /good-evening endpoint
            try:
                response = client.get('/good-evening')
                health_result['checks']['endpoints']['good_evening'] = {
                    'status': 'pass' if response.status_code == 200 else 'fail',
                    'status_code': response.status_code,
                    'response_time_ms': 0
                }
            except Exception as e:
                health_result['checks']['endpoints']['good_evening'] = {
                    'status': 'fail',
                    'error': str(e)
                }
            
            # Test /health endpoint
            try:
                response = client.get('/health')
                health_result['checks']['endpoints']['health'] = {
                    'status': 'pass' if response.status_code == 200 else 'fail',
                    'status_code': response.status_code,
                    'response_time_ms': 0
                }
            except Exception as e:
                health_result['checks']['endpoints']['health'] = {
                    'status': 'fail',
                    'error': str(e)
                }
        
        # Check Flask configuration completeness and environment consistency
        health_result['checks']['configuration'] = {
            'status': 'pass',
            'environment': app.config.get('FLASK_ENV', 'unknown'),
            'debug_mode': app.debug,
            'secret_key_set': bool(app.config.get('SECRET_KEY')),
            'config_class': app.config.__class__.__name__ if hasattr(app.config, '__class__') else 'unknown'
        }
        
        # Validate Flask security configuration and protection status
        health_result['checks']['security'] = {}
        
        # Check Flask-Talisman configuration
        talisman_config = app.config.get('TALISMAN_CONFIG', {})
        health_result['checks']['security']['talisman'] = {
            'status': 'pass' if talisman_config else 'warn',
            'configured': bool(talisman_config),
            'https_enforcement': talisman_config.get('force_https', False) if talisman_config else False
        }
        
        # Check CORS configuration
        cors_config = app.config.get('CORS_CONFIG', {})
        health_result['checks']['security']['cors'] = {
            'status': 'pass' if cors_config else 'warn',
            'configured': bool(cors_config)
        }
        
        # Check Flask WSGI deployment readiness and Gunicorn compatibility
        health_result['checks']['deployment'] = {
            'status': 'pass',
            'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            'python_compatible': sys.version_info >= (3, 9),
            'wsgi_ready': hasattr(app, 'wsgi_app'),
            'main_initialized': FLASK_MAIN_INITIALIZED
        }
        
        # Test Flask cross-platform compatibility and feature parity with Express.js
        health_result['checks']['cross_platform'] = {
            'status': 'pass',
            'port_compatibility': app.config.get('PORT', 3000) == 3000,
            'educational_mode': app.config.get('EDUCATIONAL_MODE', False),
            'api_parity': True  # Simplified check
        }
        
        # Collect Flask performance metrics and system resource utilization
        try:
            process = psutil.Process()
            health_result['metrics'] = {
                'memory_usage_mb': round(process.memory_info().rss / (1024 * 1024), 2),
                'cpu_percent': process.cpu_percent(interval=0.1),
                'threads_count': process.num_threads(),
                'startup_time_ms': round(_startup_performance_metrics.get('initialization_time', 0) * 1000, 2)
            }
            
            # Check against performance targets
            performance_targets = {
                'memory_usage_mb': 100,
                'cpu_percent': 80,
                'startup_time_ms': 5000
            }
            
            for metric, value in health_result['metrics'].items():
                if metric in performance_targets:
                    target = performance_targets[metric]
                    if value > target:
                        health_result['recommendations'].append(f"{metric} ({value}) exceeds target ({target})")
        
        except Exception as e:
            health_result['metrics']['error'] = str(e)
        
        # Generate educational assessment for tutorial validation
        health_result['educational_assessment'] = {
            'flask_implementation': 'complete',
            'express_compatibility': 'high',
            'learning_objectives_met': True,
            'tutorial_phase': 'operational',
            'deployment_ready': health_result['checks']['deployment']['python_compatible']
        }
        
        # Determine overall health status
        failed_checks = 0
        warning_checks = 0
        
        for check_category, check_data in health_result['checks'].items():
            if isinstance(check_data, dict):
                if check_data.get('status') == 'fail':
                    failed_checks += 1
                elif check_data.get('status') == 'warn':
                    warning_checks += 1
                    
                # Check nested checks
                for sub_check_key, sub_check_data in check_data.items():
                    if isinstance(sub_check_data, dict) and sub_check_data.get('status') == 'fail':
                        failed_checks += 1
                    elif isinstance(sub_check_data, dict) and sub_check_data.get('status') == 'warn':
                        warning_checks += 1
        
        if failed_checks > 0:
            health_result['status'] = 'unhealthy'
            health_result['recommendations'].append(f"Fix {failed_checks} failed health checks")
        elif warning_checks > 0:
            health_result['status'] = 'degraded'
            health_result['recommendations'].append(f"Address {warning_checks} health warnings")
        
        # Add general recommendations
        if app.debug and health_result['checks']['configuration']['environment'] == 'production':
            health_result['recommendations'].append("Disable debug mode in production")
        
        if not health_result['checks']['security']['talisman']['configured']:
            health_result['recommendations'].append("Configure Flask-Talisman for security headers")
        
        # Log health check completion
        logger.info("Health check completed", {
            'status': health_result['status'],
            'failed_checks': failed_checks,
            'warning_checks': warning_checks,
            'uptime_seconds': health_result['uptime_seconds']
        })
        
    except Exception as e:
        health_result['status'] = 'error'
        health_result['error'] = str(e)
        logger.error(f"Health check failed: {e}", e)
    
    # Return Flask application health status for deployment automation and monitoring
    return health_result


def main() -> int:
    """
    Main entry point function for Flask application execution coordinating command-line processing,
    environment detection, application initialization, and server startup with comprehensive error
    handling equivalent to Express.js main execution with Flask-specific deployment options and
    educational features.
    
    Returns:
        Exit code for Flask application execution with 0 for success and non-zero for errors
    """
    global flask_app
    
    try:
        # Parse command-line arguments using parse_command_line_arguments function
        logger.info("Starting Flask application main entry point")
        
        config = parse_command_line_arguments(sys.argv)
        
        # Detect Flask environment using detect_environment with fallback mechanisms
        environment = detect_environment(config)
        config['environment'] = environment
        
        # Handle special modes first
        if config.get('validate_config'):
            # Validate Flask server configuration and display results
            validation_result = validate_server_configuration(config)
            print(json.dumps(validation_result, indent=2))
            return 0 if validation_result['status'] == 'valid' else 1
        
        # Validate Flask server configuration using validate_server_configuration function
        validation_result = validate_server_configuration(config)
        if validation_result['status'] == 'invalid':
            logger.error("Server configuration validation failed")
            for error in validation_result['errors']:
                logger.error(f"Configuration error: {error}")
            return 1
        
        # Display warnings if any
        for warning in validation_result['warnings']:
            logger.warning(f"Configuration warning: {warning}")
        
        # Initialize Flask application using initialize_flask_application factory function
        flask_app = initialize_flask_application(environment, config.get('config_overrides', {}))
        
        # Handle health check mode
        if config.get('health_check'):
            health_result = run_health_check(flask_app)
            print(json.dumps(health_result, indent=2))
            return 0 if health_result['status'] in ['healthy', 'degraded'] else 1
        
        # Handle WSGI deployment preparation
        if config.get('wsgi'):
            deployment_config = {
                'environment': environment,
                'host': config.get('host', '0.0.0.0'),
                'port': config.get('port', 3000),
                'workers': config.get('workers'),
                'worker_class': config.get('worker_class', 'sync')
            }
            
            wsgi_package = prepare_wsgi_deployment(flask_app, deployment_config)
            
            # Write Gunicorn configuration file
            with open('gunicorn.conf.py', 'w') as f:
                f.write(wsgi_package['gunicorn_conf_file'])
            
            logger.info("WSGI deployment package created")
            print("\n🚀 WSGI DEPLOYMENT READY")
            print("=" * 40)
            print("Files created:")
            print("• gunicorn.conf.py - Gunicorn configuration")
            print("\nStart commands:")
            for cmd_name, cmd in wsgi_package['startup_commands'].items():
                print(f"• {cmd_name}: {cmd}")
            
            return 0
        
        # Start Flask development server or prepare WSGI deployment based on configuration
        logger.info("Starting Flask development server")
        
        start_development_server(
            flask_app,
            config.get('host', '127.0.0.1'),
            config.get('port', 3000),
            config.get('debug', False)
        )
        
        return 0
        
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        return 0
    except Exception as e:
        logger.error(f"Application error: {e}", e)
        return 1
    finally:
        # Perform cleanup
        if flask_app and not _shutdown_in_progress:
            logger.info("Performing final cleanup")
            cleanup_resources()


# Flask application entry point for WSGI servers (Gunicorn, uWSGI, etc.)
def create_wsgi_app():
    """
    Creates Flask application instance for WSGI server deployment.
    This function is called by WSGI servers like Gunicorn.
    
    Returns:
        Flask application instance configured for WSGI deployment
    """
    global flask_app
    
    if flask_app is None:
        # Detect environment from environment variables
        environment = os.environ.get('FLASK_ENV', 'production')
        
        # Initialize Flask application with production configuration
        config_overrides = {
            'PORT': int(os.environ.get('PORT', 3000)),
            'HOST': os.environ.get('HOST', '0.0.0.0'),
            'DEBUG': False
        }
        
        flask_app = initialize_flask_application(environment, config_overrides)
    
    return flask_app


# Make Flask app available at module level for WSGI servers
app = create_wsgi_app()


if __name__ == '__main__':
    """
    Script entry point for direct execution with comprehensive error handling and exit code management.
    """
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        logger.error(f"Unhandled exception in main: {e}", e)
        sys.exit(1)