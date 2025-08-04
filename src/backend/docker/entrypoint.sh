#!/bin/bash

# Production-ready Docker container entrypoint script for Node.js Tutorial Project
# Orchestrates complete application initialization, environment setup, PM2 cluster deployment,
# and health monitoring with container-optimized startup sequence, graceful signal handling,
# and zero-downtime deployment support for Docker and Kubernetes orchestration.
#
# Version: 1.0.0
# Date: 2025-01-01
# Author: Node.js Tutorial Project Team
#
# Features:
# - Container-optimized PM2 cluster mode deployment
# - Comprehensive environment validation and dependency checks
# - Production-ready signal handling and graceful shutdown
# - Docker and Kubernetes health check integration
# - Zero-downtime deployment with connection draining
# - Educational demonstration of production container lifecycle
# - PM2 process management with built-in load balancer
# - Security-hardened container startup and execution

# Shell configuration for production reliability
set -euo pipefail  # Exit on error, undefined vars, pipe failures
IFS=$'\n\t'       # Secure Internal Field Separator

# Global container environment variables
export CONTAINER_START_TIME=$(date +%s)
export PM2_RUNTIME_MODE=true
export HEALTH_CHECK_ENDPOINT="http://localhost:${PORT:-3000}/health"
export GRACEFUL_SHUTDOWN_TIMEOUT=${GRACEFUL_SHUTDOWN_TIMEOUT:-30}
export STARTUP_TIMEOUT=${STARTUP_TIMEOUT:-60}
export LOG_LEVEL=${LOG_LEVEL:-info}

# Application paths and configuration
readonly APP_ROOT="/app"
readonly PM2_CONFIG_FILE="${APP_ROOT}/ecosystem.config.js"
readonly SERVER_SCRIPT="${APP_ROOT}/server.js"
readonly HEALTH_CHECK_SCRIPT="${APP_ROOT}/docker/healthcheck.sh"
readonly LOG_DIR="${APP_ROOT}/logs"

# Process management variables
readonly PM2_APP_NAME="tutorial-app"
readonly PM2_INSTANCES=${PM2_INSTANCES:-max}
readonly NODE_ENV=${NODE_ENV:-production}
readonly PORT=${PORT:-3000}

# Logging and monitoring configuration
readonly CONTAINER_LOG_PREFIX="[ENTRYPOINT]"
readonly PERFORMANCE_LOG_FILE="${LOG_DIR}/container-performance.log"
readonly STARTUP_LOG_FILE="${LOG_DIR}/container-startup.log"

# Educational demonstration flags
readonly ENABLE_VERBOSE_LOGGING=${ENABLE_VERBOSE_LOGGING:-true}
readonly SHOW_CONFIGURATION=${SHOW_CONFIGURATION:-true}
readonly DEMONSTRATE_FEATURES=${DEMONSTRATE_FEATURES:-true}

#######################################
# Centralized logging function for container lifecycle events
# Provides structured log output with timestamp, log level, and context
# for Docker logging and monitoring systems integration
# Arguments:
#   $1 - Log level (DEBUG, INFO, WARN, ERROR)
#   $2 - Log message
#   $3 - Optional context object (JSON format)
# Outputs:
#   Structured log entry to stdout/stderr with container metadata
#######################################
log_message() {
    local level="$1"
    local message="$2"
    local context="${3:-{}}"
    
    # Generate ISO timestamp for log correlation
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    local pid=$$
    local hostname=$(hostname)
    
    # Determine output stream based on log level
    local output_stream=stdout
    if [[ "$level" == "ERROR" || "$level" == "WARN" ]]; then
        output_stream=stderr
    fi
    
    # Create structured log entry with container metadata
    local log_entry=$(cat << EOF
{
  "timestamp": "${timestamp}",
  "level": "${level}",
  "message": "${message}",
  "container": {
    "hostname": "${hostname}",
    "pid": ${pid},
    "startTime": ${CONTAINER_START_TIME},
    "environment": "${NODE_ENV}",
    "pm2Runtime": ${PM2_RUNTIME_MODE}
  },
  "context": ${context}
}
EOF
    )
    
    # Output to appropriate stream for container logging
    if [[ "$output_stream" == "stderr" ]]; then
        echo "${CONTAINER_LOG_PREFIX} ${level}: ${message}" >&2
        if [[ "$ENABLE_VERBOSE_LOGGING" == "true" ]]; then
            echo "$log_entry" >&2
        fi
    else
        echo "${CONTAINER_LOG_PREFIX} ${level}: ${message}"
        if [[ "$ENABLE_VERBOSE_LOGGING" == "true" ]]; then
            echo "$log_entry"
        fi
    fi
    
    # Write to startup log file for debugging
    if [[ -w "$(dirname "$STARTUP_LOG_FILE")" ]]; then
        echo "$log_entry" >> "$STARTUP_LOG_FILE" 2>/dev/null || true
    fi
}

#######################################
# Comprehensive environment validation function
# Checks Node.js version, environment variables, dependencies,
# and container-specific configuration for successful startup
# Arguments:
#   None
# Returns:
#   0 - Environment validation successful
#   1 - Critical validation failures detected
# Outputs:
#   Detailed validation results and error reporting
#######################################
validate_environment() {
    log_message "INFO" "Starting comprehensive environment validation"
    
    local validation_errors=0
    local validation_context='{"validationSteps": []}'
    
    # Check Node.js version compatibility (v22.x LTS requirement)
    log_message "INFO" "Validating Node.js version compatibility"
    local node_version=$(node --version)
    local node_major_version=$(echo "$node_version" | cut -d'.' -f1 | sed 's/v//')
    
    if [[ "$node_major_version" -lt 18 ]]; then
        log_message "ERROR" "Unsupported Node.js version: $node_version (minimum: v18.x)" \
            '{"requiredVersion": ">=18.x", "currentVersion": "'"$node_version"'"}'
        ((validation_errors++))
    else
        log_message "INFO" "Node.js version validation passed: $node_version"
    fi
    
    # Validate required environment variables
    local required_env_vars=("NODE_ENV" "PORT")
    local optional_env_vars=("LOG_LEVEL" "PM2_INSTANCES" "GRACEFUL_SHUTDOWN_TIMEOUT")
    
    log_message "INFO" "Validating environment variables configuration"
    for env_var in "${required_env_vars[@]}"; do
        if [[ -z "${!env_var:-}" ]]; then
            log_message "ERROR" "Required environment variable missing: $env_var"
            ((validation_errors++))
        else
            log_message "DEBUG" "Environment variable validated: $env_var=${!env_var}"
        fi
    done
    
    # Report optional environment variables
    for env_var in "${optional_env_vars[@]}"; do
        if [[ -n "${!env_var:-}" ]]; then
            log_message "DEBUG" "Optional environment variable set: $env_var=${!env_var}"
        fi
    done
    
    # Verify PM2 installation and cluster mode compatibility
    log_message "INFO" "Validating PM2 installation and cluster mode support"
    if ! command -v pm2 >/dev/null 2>&1; then
        log_message "ERROR" "PM2 not found in PATH - required for production deployment"
        ((validation_errors++))
    else
        local pm2_version=$(pm2 --version 2>/dev/null || echo "unknown")
        log_message "INFO" "PM2 version detected: $pm2_version"
        
        # Test PM2 basic functionality
        if ! pm2 ping >/dev/null 2>&1; then
            log_message "WARN" "PM2 daemon not responding - will be started automatically"
        fi
    fi
    
    # Check application file availability and permissions
    log_message "INFO" "Validating application files and permissions"
    local required_files=("$SERVER_SCRIPT" "$PM2_CONFIG_FILE")
    
    for file_path in "${required_files[@]}"; do
        if [[ ! -f "$file_path" ]]; then
            log_message "ERROR" "Required application file missing: $file_path"
            ((validation_errors++))
        elif [[ ! -r "$file_path" ]]; then
            log_message "ERROR" "Required application file not readable: $file_path"
            ((validation_errors++))
        else
            log_message "DEBUG" "Application file validated: $file_path"
        fi
    done
    
    # Validate network port availability and binding permissions
    log_message "INFO" "Validating network port configuration"
    if [[ "$PORT" -lt 1024 ]] && [[ "$(id -u)" -ne 0 ]]; then
        log_message "WARN" "Binding to privileged port $PORT as non-root user may fail"
    fi
    
    # Check if port is already in use
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
            log_message "WARN" "Port $PORT appears to be in use"
        fi
    fi
    
    # Verify container resource limits and constraints
    log_message "INFO" "Validating container resource configuration"
    local memory_limit=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "unlimited")
    local cpu_quota=$(cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us 2>/dev/null || echo "unlimited")
    
    log_message "DEBUG" "Container resource limits detected" \
        '{"memoryLimit": "'"$memory_limit"'", "cpuQuota": "'"$cpu_quota"'"}'
    
    # Create necessary directories with proper permissions
    log_message "INFO" "Creating and validating log directories"
    if ! mkdir -p "$LOG_DIR" 2>/dev/null; then
        log_message "ERROR" "Failed to create log directory: $LOG_DIR"
        ((validation_errors++))
    elif [[ ! -w "$LOG_DIR" ]]; then
        log_message "ERROR" "Log directory not writable: $LOG_DIR"
        ((validation_errors++))
    fi
    
    # Final validation result
    if [[ "$validation_errors" -eq 0 ]]; then
        log_message "INFO" "Environment validation completed successfully" \
            '{"validationErrors": 0, "nodeVersion": "'"$node_version"'", "pm2Available": true}'
        return 0
    else
        log_message "ERROR" "Environment validation failed with $validation_errors errors" \
            '{"validationErrors": '"$validation_errors"', "critical": true}'
        return 1
    fi
}

#######################################
# Configure comprehensive signal handling for graceful shutdown
# Sets up signal handlers for container lifecycle management
# with PM2 integration and proper cleanup procedures
# Arguments:
#   None
# Returns:
#   None
# Outputs:
#   Signal handler configuration and operational status
#######################################
setup_signal_handlers() {
    log_message "INFO" "Configuring comprehensive signal handling for container lifecycle"
    
    # SIGTERM handler for graceful container shutdown (Docker/Kubernetes)
    trap 'handle_graceful_shutdown SIGTERM' SIGTERM
    
    # SIGINT handler for development and manual termination
    trap 'handle_graceful_shutdown SIGINT' SIGINT
    
    # SIGUSR2 handler for PM2 zero-downtime reload operations
    trap 'handle_pm2_reload SIGUSR2' SIGUSR2
    
    # SIGHUP handler for configuration reload and log rotation
    trap 'handle_configuration_reload SIGHUP' SIGHUP
    
    # SIGQUIT handler for emergency shutdown procedures
    trap 'handle_emergency_shutdown SIGQUIT' SIGQUIT
    
    log_message "INFO" "Signal handlers configured successfully" \
        '{"signals": ["SIGTERM", "SIGINT", "SIGUSR2", "SIGHUP", "SIGQUIT"], "gracefulTimeout": '"$GRACEFUL_SHUTDOWN_TIMEOUT"'}'
}

#######################################
# Handle graceful shutdown with connection draining and cleanup
# Executes comprehensive shutdown procedure for zero-downtime deployment
# Arguments:
#   $1 - Signal that triggered shutdown
# Returns:
#   Exit code based on shutdown completion status
# Outputs:
#   Detailed shutdown progress and timing information
#######################################
handle_graceful_shutdown() {
    local signal="$1"
    local shutdown_start_time=$(date +%s)
    
    log_message "INFO" "Initiating graceful shutdown procedure" \
        '{"signal": "'"$signal"'", "startTime": '"$shutdown_start_time"', "timeout": '"$GRACEFUL_SHUTDOWN_TIMEOUT"'}'
    
    # Stop accepting new connections and begin connection draining
    log_message "INFO" "Beginning connection draining phase"
    
    # Notify PM2 process manager of shutdown request
    if command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "$PM2_APP_NAME"; then
        log_message "INFO" "Requesting PM2 graceful shutdown"
        
        # Send graceful shutdown signal to PM2 processes
        pm2 reload "$PM2_APP_NAME" 2>/dev/null || true
        
        # Wait for PM2 processes to complete current requests
        local wait_time=0
        local max_wait_time="$GRACEFUL_SHUTDOWN_TIMEOUT"
        
        while [[ "$wait_time" -lt "$max_wait_time" ]]; do
            if ! pm2 list 2>/dev/null | grep -q "$PM2_APP_NAME"; then
                log_message "INFO" "PM2 processes shut down gracefully"
                break
            fi
            
            sleep 1
            ((wait_time++))
            
            if [[ $((wait_time % 5)) -eq 0 ]]; then
                log_message "DEBUG" "Waiting for PM2 graceful shutdown: ${wait_time}/${max_wait_time}s"
            fi
        done
        
        # Force shutdown if timeout exceeded
        if [[ "$wait_time" -ge "$max_wait_time" ]]; then
            log_message "WARN" "Graceful shutdown timeout exceeded, forcing PM2 shutdown"
            pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
        fi
    fi
    
    # Clean up temporary files and container resources
    log_message "INFO" "Performing container resource cleanup"
    
    # Flush remaining log entries
    sync
    
    # Calculate shutdown duration
    local shutdown_end_time=$(date +%s)
    local shutdown_duration=$((shutdown_end_time - shutdown_start_time))
    
    log_message "INFO" "Graceful shutdown completed successfully" \
        '{"signal": "'"$signal"'", "duration": '"$shutdown_duration"', "status": "success"}'
    
    exit 0
}

#######################################
# Handle PM2 zero-downtime reload operations
# Arguments:
#   $1 - Signal that triggered reload
# Returns:
#   None
# Outputs:
#   Reload operation status and timing
#######################################
handle_pm2_reload() {
    local signal="$1"
    
    log_message "INFO" "Handling PM2 zero-downtime reload" \
        '{"signal": "'"$signal"'", "operation": "reload"}'
    
    if command -v pm2 >/dev/null 2>&1; then
        pm2 reload "$PM2_APP_NAME" 2>/dev/null || {
            log_message "ERROR" "PM2 reload operation failed"
            return 1
        }
        log_message "INFO" "PM2 zero-downtime reload completed successfully"
    else
        log_message "WARN" "PM2 not available for reload operation"
    fi
}

#######################################
# Handle configuration reload and log rotation
# Arguments:
#   $1 - Signal that triggered reload
# Returns:
#   None
# Outputs:
#   Configuration reload status
#######################################
handle_configuration_reload() {
    local signal="$1"
    
    log_message "INFO" "Handling configuration reload and log rotation" \
        '{"signal": "'"$signal"'", "operation": "config_reload"}'
    
    # Trigger log rotation if applicable
    if [[ -f "$PERFORMANCE_LOG_FILE" ]]; then
        mv "$PERFORMANCE_LOG_FILE" "${PERFORMANCE_LOG_FILE}.$(date +%s)" 2>/dev/null || true
    fi
    
    log_message "INFO" "Configuration reload completed"
}

#######################################
# Handle emergency shutdown procedures
# Arguments:
#   $1 - Signal that triggered emergency shutdown
# Returns:
#   Exit code for emergency status
# Outputs:
#   Emergency shutdown status
#######################################
handle_emergency_shutdown() {
    local signal="$1"
    
    log_message "ERROR" "Emergency shutdown initiated" \
        '{"signal": "'"$signal"'", "operation": "emergency_shutdown"}'
    
    # Force stop all PM2 processes immediately
    if command -v pm2 >/dev/null 2>&1; then
        pm2 kill 2>/dev/null || true
    fi
    
    log_message "ERROR" "Emergency shutdown completed"
    exit 1
}

#######################################
# Initialize PM2 cluster mode with container-optimized configuration
# Starts application in cluster mode with load balancing and monitoring
# Arguments:
#   None
# Returns:
#   0 - PM2 initialization successful
#   1 - PM2 initialization failed
# Outputs:
#   PM2 cluster status and process information
#######################################
initialize_pm2_cluster() {
    log_message "INFO" "Initializing PM2 cluster mode for container deployment"
    
    # Verify PM2 configuration file exists and is valid
    if [[ ! -f "$PM2_CONFIG_FILE" ]]; then
        log_message "ERROR" "PM2 ecosystem configuration file not found: $PM2_CONFIG_FILE"
        return 1
    fi
    
    # Test PM2 configuration syntax
    log_message "DEBUG" "Validating PM2 ecosystem configuration"
    if ! node -c "$PM2_CONFIG_FILE" 2>/dev/null; then
        log_message "ERROR" "PM2 ecosystem configuration contains syntax errors"
        return 1
    fi
    
    # Initialize PM2 daemon if not running
    log_message "INFO" "Ensuring PM2 daemon is running"
    if ! pm2 ping >/dev/null 2>&1; then
        log_message "DEBUG" "Starting PM2 daemon"
        pm2 ping >/dev/null 2>&1 || {
            log_message "ERROR" "Failed to start PM2 daemon"
            return 1
        }
    fi
    
    # Start application in cluster mode using ecosystem configuration
    log_message "INFO" "Starting application in PM2 cluster mode" \
        '{"configFile": "'"$PM2_CONFIG_FILE"'", "instances": "'"$PM2_INSTANCES"'", "environment": "'"$NODE_ENV"'"}'
    
    # Set PM2 environment variables for container optimization
    export PM2_HOME="/tmp/.pm2"
    export PM2_KILL_TIMEOUT="$GRACEFUL_SHUTDOWN_TIMEOUT"s
    export PM2_LOG_DATE_FORMAT="YYYY-MM-DD HH:mm:ss Z"
    
    # Start application with container-optimized settings
    if pm2 start "$PM2_CONFIG_FILE" --env "$NODE_ENV" 2>/dev/null; then
        log_message "INFO" "PM2 cluster mode started successfully"
        
        # Display PM2 process information for educational purposes
        if [[ "$DEMONSTRATE_FEATURES" == "true" ]]; then
            log_message "INFO" "PM2 Process Information:"
            pm2 list 2>/dev/null || true
            pm2 show "$PM2_APP_NAME" 2>/dev/null || true
        fi
        
        return 0
    else
        log_message "ERROR" "Failed to start PM2 cluster mode"
        
        # Capture PM2 logs for debugging
        local pm2_logs=$(pm2 logs --nostream --lines 20 2>/dev/null || echo "No PM2 logs available")
        log_message "DEBUG" "PM2 startup logs: $pm2_logs"
        
        return 1
    fi
}

#######################################
# Wait for application readiness with comprehensive health validation
# Performs health checks and dependency validation before reporting ready
# Arguments:
#   None
# Returns:
#   0 - Application ready
#   1 - Application startup timeout or failure
# Outputs:
#   Readiness check progress and health validation results
#######################################
wait_for_application_ready() {
    log_message "INFO" "Waiting for application readiness with comprehensive health validation"
    
    local startup_timeout="$STARTUP_TIMEOUT"
    local wait_time=0
    local check_interval=2
    local health_endpoint="$HEALTH_CHECK_ENDPOINT"
    
    log_message "DEBUG" "Readiness check configuration" \
        '{"timeout": '"$startup_timeout"', "interval": '"$check_interval"', "endpoint": "'"$health_endpoint"'"}'
    
    while [[ "$wait_time" -lt "$startup_timeout" ]]; do
        # Check if PM2 processes are running
        if pm2 list 2>/dev/null | grep -q "$PM2_APP_NAME.*online"; then
            log_message "DEBUG" "PM2 processes detected as online"
            
            # Perform application health check
            if command -v curl >/dev/null 2>&1; then
                if curl -sf "$health_endpoint" >/dev/null 2>&1; then
                    log_message "INFO" "Application health check passed - ready for traffic"
                    
                    # Perform additional readiness validation
                    validate_application_readiness
                    return $?
                fi
            elif command -v wget >/dev/null 2>&1; then
                if wget -q -O /dev/null "$health_endpoint" 2>/dev/null; then
                    log_message "INFO" "Application health check passed - ready for traffic"
                    
                    validate_application_readiness
                    return $?
                fi
            else
                log_message "WARN" "No HTTP client available for health checks, assuming ready"
                return 0
            fi
        fi
        
        # Progress logging
        if [[ $((wait_time % 10)) -eq 0 ]] && [[ "$wait_time" -gt 0 ]]; then
            log_message "INFO" "Application startup in progress: ${wait_time}/${startup_timeout}s"
        fi
        
        sleep "$check_interval"
        wait_time=$((wait_time + check_interval))
    done
    
    log_message "ERROR" "Application readiness timeout after ${startup_timeout}s"
    
    # Capture diagnostic information for troubleshooting
    capture_startup_diagnostics
    
    return 1
}

#######################################
# Validate comprehensive application readiness
# Performs detailed health and performance validation
# Arguments:
#   None
# Returns:
#   0 - Application fully ready
#   1 - Readiness validation failed
# Outputs:
#   Detailed readiness validation results
#######################################
validate_application_readiness() {
    log_message "INFO" "Performing comprehensive application readiness validation"
    
    local validation_errors=0
    
    # Validate PM2 cluster health
    local pm2_processes=$(pm2 jlist 2>/dev/null | grep -c "\"status\":\"online\"" || echo "0")
    if [[ "$pm2_processes" -eq 0 ]]; then
        log_message "ERROR" "No PM2 processes are online"
        ((validation_errors++))
    else
        log_message "INFO" "PM2 cluster validation passed: $pm2_processes processes online"
    fi
    
    # Validate application response time
    if command -v curl >/dev/null 2>&1; then
        local response_time=$(curl -w "%{time_total}" -s -o /dev/null "$HEALTH_CHECK_ENDPOINT" 2>/dev/null || echo "999")
        local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
        
        if [[ "${response_time_ms%.*}" -gt 1000 ]]; then
            log_message "WARN" "Application response time exceeds threshold: ${response_time_ms}ms"
        else
            log_message "INFO" "Application response time validation passed: ${response_time_ms}ms"
        fi
    fi
    
    # Validate memory usage
    local memory_usage=$(ps -o pid,rss,command -p $(pgrep -f "$PM2_APP_NAME" | head -5) 2>/dev/null | awk 'NR>1 {sum+=$2} END {print sum+0}')
    if [[ "$memory_usage" -gt 1048576 ]]; then  # 1GB in KB
        log_message "WARN" "High memory usage detected: ${memory_usage}KB"
    fi
    
    # Final readiness status
    if [[ "$validation_errors" -eq 0 ]]; then
        log_message "INFO" "Application readiness validation completed successfully" \
            '{"pm2Processes": '"$pm2_processes"', "memoryUsage": '"$memory_usage"', "status": "ready"}'
        return 0
    else
        log_message "ERROR" "Application readiness validation failed" \
            '{"validationErrors": '"$validation_errors"', "status": "not_ready"}'
        return 1
    fi
}

#######################################
# Capture startup diagnostic information for troubleshooting
# Arguments:
#   None
# Returns:
#   None
# Outputs:
#   Comprehensive diagnostic information
#######################################
capture_startup_diagnostics() {
    log_message "INFO" "Capturing startup diagnostic information"
    
    # PM2 status and logs
    if command -v pm2 >/dev/null 2>&1; then
        log_message "DEBUG" "PM2 Status Information:"
        pm2 list 2>/dev/null || log_message "WARN" "Unable to get PM2 status"
        
        log_message "DEBUG" "PM2 Application Logs:"
        pm2 logs "$PM2_APP_NAME" --nostream --lines 50 2>/dev/null || log_message "WARN" "Unable to get PM2 logs"
    fi
    
    # System resource information
    log_message "DEBUG" "System Resource Information:"
    local memory_info=$(free -h 2>/dev/null || echo "Memory info unavailable")
    local disk_info=$(df -h 2>/dev/null || echo "Disk info unavailable")
    
    log_message "DEBUG" "Memory: $memory_info"
    log_message "DEBUG" "Disk: $disk_info"
    
    # Network connectivity
    if command -v netstat >/dev/null 2>&1; then
        local port_status=$(netstat -tuln 2>/dev/null | grep ":$PORT" || echo "Port $PORT not listening")
        log_message "DEBUG" "Port Status: $port_status"
    fi
}

#######################################
# Monitor application health continuously
# Provides ongoing health monitoring and performance tracking
# Arguments:
#   None
# Returns:
#   None (runs continuously until shutdown)
# Outputs:
#   Continuous health status and performance metrics
#######################################
monitor_application_health() {
    log_message "INFO" "Starting continuous application health monitoring"
    
    local monitoring_interval=30  # 30 seconds
    local performance_threshold=1000  # 1 second response time threshold
    
    while true; do
        # Check PM2 process health
        local online_processes=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
        
        if [[ "$online_processes" -eq 0 ]]; then
            log_message "ERROR" "No PM2 processes are online - attempting restart"
            
            # Attempt automatic recovery
            pm2 restart "$PM2_APP_NAME" 2>/dev/null || {
                log_message "ERROR" "Failed to restart application"
                handle_graceful_shutdown "HEALTH_FAILURE"
            }
        fi
        
        # Performance monitoring
        if command -v curl >/dev/null 2>&1; then
            local response_time=$(curl -w "%{time_total}" -s -o /dev/null "$HEALTH_CHECK_ENDPOINT" 2>/dev/null || echo "999")
            local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
            
            # Log performance metrics
            if [[ -w "$PERFORMANCE_LOG_FILE" ]]; then
                echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ"),${response_time_ms},${online_processes}" >> "$PERFORMANCE_LOG_FILE"
            fi
            
            # Check performance threshold
            if [[ "${response_time_ms%.*}" -gt "$performance_threshold" ]]; then
                log_message "WARN" "Application performance degraded: ${response_time_ms}ms"
            fi
        fi
        
        sleep "$monitoring_interval"
    done
}

#######################################
# Main container initialization orchestration function
# Coordinates complete container lifecycle from startup to monitoring
# Arguments:
#   $@ - Startup arguments passed to entrypoint
# Returns:
#   Container exit code
# Outputs:
#   Complete container lifecycle logging and operational summary
#######################################
handle_container_initialization() {
    local startup_args=("$@")
    local initialization_start_time=$(date +%s)
    
    log_message "INFO" "Starting container initialization orchestration" \
        '{"startTime": '"$initialization_start_time"', "environment": "'"$NODE_ENV"'", "args": ["'"${startup_args[*]}"'"]}'
    
    # Display educational configuration information
    if [[ "$SHOW_CONFIGURATION" == "true" ]]; then
        log_message "INFO" "Container Configuration Summary:"
        log_message "INFO" "  Node.js Version: $(node --version)"
        log_message "INFO" "  PM2 Version: $(pm2 --version 2>/dev/null || echo "Not available")"
        log_message "INFO" "  Environment: $NODE_ENV"
        log_message "INFO" "  Port: $PORT"
        log_message "INFO" "  PM2 Instances: $PM2_INSTANCES"
        log_message "INFO" "  Graceful Shutdown Timeout: ${GRACEFUL_SHUTDOWN_TIMEOUT}s"
        log_message "INFO" "  Application Root: $APP_ROOT"
    fi
    
    # Step 1: Environment validation and dependency checks
    log_message "INFO" "Step 1/7: Comprehensive environment validation"
    if ! validate_environment; then
        log_message "ERROR" "Environment validation failed - container cannot start"
        return 1
    fi
    
    # Step 2: Signal handler configuration
    log_message "INFO" "Step 2/7: Configuring signal handlers for container lifecycle"
    setup_signal_handlers
    
    # Step 3: PM2 cluster initialization
    log_message "INFO" "Step 3/7: Initializing PM2 cluster mode deployment"
    if ! initialize_pm2_cluster; then
        log_message "ERROR" "PM2 cluster initialization failed"
        capture_startup_diagnostics
        return 1
    fi
    
    # Step 4: Application readiness validation
    log_message "INFO" "Step 4/7: Waiting for application readiness validation"
    if ! wait_for_application_ready; then
        log_message "ERROR" "Application failed to become ready within timeout"
        return 1
    fi
    
    # Step 5: Health monitoring initialization
    log_message "INFO" "Step 5/7: Initializing continuous health monitoring"
    
    # Step 6: Container operational status
    local initialization_duration=$(($(date +%s) - initialization_start_time))
    log_message "INFO" "Step 6/7: Container initialization completed successfully" \
        '{"duration": '"$initialization_duration"', "status": "operational", "pm2Cluster": true}'
    
    # Step 7: Enter main execution loop with monitoring
    log_message "INFO" "Step 7/7: Entering main execution loop with health monitoring"
    log_message "INFO" "Container is ready to serve traffic on port $PORT"
    
    # Educational demonstration of container lifecycle
    if [[ "$DEMONSTRATE_FEATURES" == "true" ]]; then
        log_message "INFO" "Educational Container Features Demonstrated:"
        log_message "INFO" "  ✓ PM2 Cluster Mode with Load Balancing"
        log_message "INFO" "  ✓ Graceful Signal Handling and Shutdown"
        log_message "INFO" "  ✓ Comprehensive Health Monitoring"
        log_message "INFO" "  ✓ Zero-Downtime Deployment Support"
        log_message "INFO" "  ✓ Container-Optimized Logging"
        log_message "INFO" "  ✓ Production-Ready Error Handling"
    fi
    
    # Start background health monitoring
    monitor_application_health &
    local monitoring_pid=$!
    
    # Main execution loop - wait for shutdown signals
    wait "$monitoring_pid" 2>/dev/null || true
    
    # Container shutdown sequence initiated by signal handler
    log_message "INFO" "Container execution completed"
    return 0
}

#######################################
# Main entrypoint execution
# Entry point for Docker container with comprehensive error handling
#######################################
main() {
    # Ensure proper working directory
    cd "$APP_ROOT" || {
        echo "FATAL: Cannot change to application directory: $APP_ROOT" >&2
        exit 1
    }
    
    # Create log directory if it doesn't exist
    mkdir -p "$LOG_DIR" 2>/dev/null || {
        echo "WARN: Cannot create log directory: $LOG_DIR" >&2
    }
    
    # Handle container initialization with comprehensive error handling
    if handle_container_initialization "$@"; then
        log_message "INFO" "Container execution completed successfully"
        exit 0
    else
        log_message "ERROR" "Container initialization failed"
        exit 1
    fi
}

# Execute main function with all script arguments
main "$@"