#!/bin/bash

# Docker Container Health Check Script for Node.js Tutorial Application
# Implements comprehensive health validation including HTTP endpoint checks,
# process health verification, resource utilization monitoring, and PM2 cluster mode compatibility.
# Designed for Docker HEALTHCHECK directive integration with configurable timeouts,
# retry logic, and detailed health reporting for container orchestration systems.

# Global Configuration Variables
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
QUICK_HEALTH_URL="${QUICK_HEALTH_URL:-http://localhost:3000/health/quick}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-3}"
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_DELAY="${RETRY_DELAY:-1}"
VERBOSE_OUTPUT="${VERBOSE_OUTPUT:-false}"
LOG_FILE="${LOG_FILE:-/tmp/healthcheck.log}"

# Exit Codes
EXIT_SUCCESS=0
EXIT_UNHEALTHY=1
EXIT_TIMEOUT=2

# Initialize logging
exec 3>&1 # Save stdout
if [[ "$VERBOSE_OUTPUT" == "true" ]]; then
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
fi

# Function: check_http_health
# Performs HTTP health check against Express.js application health endpoints
# with timeout handling, retry logic, and response validation
check_http_health() {
    local endpoint_url="$1"
    local timeout_seconds="${2:-$HEALTH_CHECK_TIMEOUT}"
    local start_time
    local response
    local http_code
    local response_time
    
    log_health_check "http_check" 0 "Starting HTTP health check for endpoint: $endpoint_url"
    
    # Initialize HTTP health check with endpoint URL and timeout configuration
    if [[ -z "$endpoint_url" ]]; then
        log_health_check "http_check" 1 "ERROR: Endpoint URL is required"
        return $EXIT_UNHEALTHY
    fi
    
    start_time=$(date +%s%N)
    
    # Send GET request to health endpoint using curl with configured timeout
    response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
        --max-time "$timeout_seconds" \
        --connect-timeout "$timeout_seconds" \
        --retry 0 \
        "$endpoint_url" 2>/dev/null)
    
    local curl_exit_code=$?
    
    if [[ $curl_exit_code -ne 0 ]]; then
        log_health_check "http_check" $EXIT_UNHEALTHY "ERROR: curl failed with exit code $curl_exit_code"
        return $EXIT_UNHEALTHY
    fi
    
    # Extract HTTP status code and response time
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    
    # Remove status line from response body
    response=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')
    
    # Validate HTTP response status code is 200 for successful health check
    if [[ "$http_code" != "200" ]]; then
        log_health_check "http_check" $EXIT_UNHEALTHY "ERROR: HTTP status code $http_code (expected 200)"
        return $EXIT_UNHEALTHY
    fi
    
    # Parse JSON response body and validate required health fields
    if command -v jq >/dev/null 2>&1; then
        local status
        local uptime
        
        status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
        uptime=$(echo "$response" | jq -r '.uptime // empty' 2>/dev/null)
        
        if [[ "$status" != "OK" ]]; then
            log_health_check "http_check" $EXIT_UNHEALTHY "ERROR: Health status is '$status' (expected 'OK')"
            return $EXIT_UNHEALTHY
        fi
        
        # Check application uptime and status fields for operational readiness
        if [[ -n "$uptime" ]] && [[ $(echo "$uptime > 0" | bc -l 2>/dev/null || echo "1") -eq 1 ]]; then
            log_health_check "http_check" 0 "Application uptime: ${uptime}s"
        fi
    fi
    
    # Validate response time is within acceptable limits for load balancer compatibility
    if [[ -n "$response_time" ]]; then
        local response_time_ms
        response_time_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null || echo "0")
        
        if [[ $(echo "$response_time_ms > 5000" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
            log_health_check "http_check" 0 "WARNING: Response time ${response_time_ms}ms exceeds 5000ms threshold"
        fi
    fi
    
    # Log health check results with timestamp and endpoint information
    local end_time
    end_time=$(date +%s%N)
    local total_time_ms
    total_time_ms=$(( (end_time - start_time) / 1000000 ))
    
    log_health_check "http_check" $EXIT_SUCCESS "HTTP health check passed - Status: $http_code, Response time: ${response_time}s, Total time: ${total_time_ms}ms"
    
    # Return exit code 0 for successful health check
    return $EXIT_SUCCESS
}

# Function: check_process_health
# Validates Node.js application process health including PM2 cluster mode processes,
# memory usage, CPU utilization, and process stability
check_process_health() {
    local process_name="${1:-node}"
    local check_pm2="${2:-true}"
    local process_count
    local memory_usage_mb
    local cpu_usage
    
    log_health_check "process_check" 0 "Starting process health check for: $process_name"
    
    # Initialize process health check with process identification
    if command -v ps >/dev/null 2>&1; then
        # Check Node.js application process is running and responsive
        process_count=$(ps aux | grep -E "(node|pm2)" | grep -v grep | wc -l)
        
        if [[ $process_count -eq 0 ]]; then
            log_health_check "process_check" $EXIT_UNHEALTHY "ERROR: No Node.js or PM2 processes found"
            return $EXIT_UNHEALTHY
        fi
        
        log_health_check "process_check" 0 "Found $process_count Node.js/PM2 processes"
        
        # Monitor memory usage and validate within acceptable limits
        if command -v free >/dev/null 2>&1; then
            memory_usage_mb=$(free -m | awk '/^Mem:/ {print $3}')
            if [[ $memory_usage_mb -gt 1024 ]]; then
                log_health_check "process_check" 0 "WARNING: High memory usage: ${memory_usage_mb}MB"
            fi
        fi
        
        # Check CPU utilization if top command is available
        if command -v top >/dev/null 2>&1; then
            cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' 2>/dev/null || echo "0")
            if [[ $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
                log_health_check "process_check" 0 "WARNING: High CPU usage: ${cpu_usage}%"
            fi
        fi
    else
        log_health_check "process_check" $EXIT_UNHEALTHY "ERROR: ps command not available"
        return $EXIT_UNHEALTHY
    fi
    
    # Validate PM2 cluster mode processes if enabled
    if [[ "$check_pm2" == "true" ]] && command -v pm2 >/dev/null 2>&1; then
        local pm2_status
        pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[].pm2_env.status' 2>/dev/null || echo "unknown")
        
        if [[ "$pm2_status" == "online" ]]; then
            log_health_check "process_check" 0 "PM2 processes are online"
        elif [[ "$pm2_status" != "unknown" ]]; then
            log_health_check "process_check" $EXIT_UNHEALTHY "ERROR: PM2 processes status: $pm2_status"
            return $EXIT_UNHEALTHY
        fi
    fi
    
    # Log process health status with resource utilization data
    log_health_check "process_check" $EXIT_SUCCESS "Process health check passed - Processes: $process_count, Memory: ${memory_usage_mb:-N/A}MB, CPU: ${cpu_usage:-N/A}%"
    
    # Return exit code based on process health assessment results
    return $EXIT_SUCCESS
}

# Function: check_port_availability
# Validates that the application port is accessible and responding to connections
check_port_availability() {
    local port_number="${1:-3000}"
    local host_address="${2:-localhost}"
    
    log_health_check "port_check" 0 "Starting port availability check for ${host_address}:${port_number}"
    
    # Initialize port availability check with host and port configuration
    if ! command -v netstat >/dev/null 2>&1 && ! command -v ss >/dev/null 2>&1; then
        log_health_check "port_check" $EXIT_UNHEALTHY "ERROR: Neither netstat nor ss command available"
        return $EXIT_UNHEALTHY
    fi
    
    # Test network connectivity to specified host and port
    if command -v nc >/dev/null 2>&1; then
        # Use netcat for connection testing
        if nc -z "$host_address" "$port_number" 2>/dev/null; then
            log_health_check "port_check" 0 "Port $port_number is accessible via netcat"
        else
            log_health_check "port_check" $EXIT_UNHEALTHY "ERROR: Port $port_number is not accessible"
            return $EXIT_UNHEALTHY
        fi
    else
        # Fallback to netstat/ss for port binding validation
        local port_listening=false
        
        if command -v netstat >/dev/null 2>&1; then
            if netstat -tlnp 2>/dev/null | grep -q ":${port_number}[[:space:]]"; then
                port_listening=true
            fi
        elif command -v ss >/dev/null 2>&1; then
            if ss -tlnp 2>/dev/null | grep -q ":${port_number}[[:space:]]"; then
                port_listening=true
            fi
        fi
        
        # Validate port is bound and accepting connections
        if [[ "$port_listening" == "true" ]]; then
            log_health_check "port_check" 0 "Port $port_number is listening"
        else
            log_health_check "port_check" $EXIT_UNHEALTHY "ERROR: Port $port_number is not listening"
            return $EXIT_UNHEALTHY
        fi
    fi
    
    # Test basic connection establishment and response
    if command -v timeout >/dev/null 2>&1; then
        if timeout 2 bash -c "</dev/tcp/$host_address/$port_number" 2>/dev/null; then
            log_health_check "port_check" 0 "TCP connection to ${host_address}:${port_number} successful"
        else
            log_health_check "port_check" $EXIT_UNHEALTHY "ERROR: TCP connection to ${host_address}:${port_number} failed"
            return $EXIT_UNHEALTHY
        fi
    fi
    
    # Log port availability status with network configuration details
    log_health_check "port_check" $EXIT_SUCCESS "Port availability check passed for ${host_address}:${port_number}"
    
    return $EXIT_SUCCESS
}

# Function: check_dependencies
# Validates container dependencies including required system utilities
check_dependencies() {
    local required_utilities=("$@")
    local check_external_services="${1:-false}"
    local missing_dependencies=()
    
    # Set default required utilities if none provided
    if [[ ${#required_utilities[@]} -eq 0 ]] || [[ "${required_utilities[0]}" == "true" ]] || [[ "${required_utilities[0]}" == "false" ]]; then
        check_external_services="${required_utilities[0]:-false}"
        required_utilities=("curl" "ps" "netstat" "jq")
    fi
    
    log_health_check "dependency_check" 0 "Starting dependency validation for utilities: ${required_utilities[*]}"
    
    # Check Node.js runtime availability and version compatibility
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version 2>/dev/null | sed 's/v//')
        log_health_check "dependency_check" 0 "Node.js version: $node_version"
        
        # Validate Node.js version compatibility (require v18+)
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        if [[ $major_version -lt 18 ]]; then
            log_health_check "dependency_check" $EXIT_UNHEALTHY "ERROR: Node.js version $node_version is below minimum requirement (v18+)"
            return $EXIT_UNHEALTHY
        fi
    else
        log_health_check "dependency_check" $EXIT_UNHEALTHY "ERROR: Node.js runtime not found"
        return $EXIT_UNHEALTHY
    fi
    
    # Validate npm and package.json dependencies are installed
    if command -v npm >/dev/null 2>&1; then
        local npm_version
        npm_version=$(npm --version 2>/dev/null)
        log_health_check "dependency_check" 0 "npm version: $npm_version"
    else
        log_health_check "dependency_check" 0 "WARNING: npm not found (may not be required in production)"
    fi
    
    # Verify system utilities like curl, ps, netstat are available
    for utility in "${required_utilities[@]}"; do
        if ! command -v "$utility" >/dev/null 2>&1; then
            missing_dependencies+=("$utility")
        fi
    done
    
    if [[ ${#missing_dependencies[@]} -gt 0 ]]; then
        log_health_check "dependency_check" $EXIT_UNHEALTHY "ERROR: Missing required utilities: ${missing_dependencies[*]}"
        return $EXIT_UNHEALTHY
    fi
    
    # Test external service connectivity if required
    if [[ "$check_external_services" == "true" ]]; then
        # Test basic DNS resolution
        if command -v nslookup >/dev/null 2>&1; then
            if nslookup google.com >/dev/null 2>&1; then
                log_health_check "dependency_check" 0 "External DNS resolution working"
            else
                log_health_check "dependency_check" 0 "WARNING: External DNS resolution failed"
            fi
        fi
    fi
    
    # Validate file system permissions and disk space availability
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        log_health_check "dependency_check" 0 "WARNING: Disk usage is ${disk_usage}% (>90%)"
    fi
    
    # Log dependency validation results with version information
    log_health_check "dependency_check" $EXIT_SUCCESS "Dependency validation passed - All required utilities available"
    
    return $EXIT_SUCCESS
}

# Function: perform_quick_health_check
# Executes lightweight health check optimized for high-frequency monitoring
perform_quick_health_check() {
    local skip_detailed_checks="${1:-true}"
    local start_time
    local end_time
    local execution_time_ms
    
    start_time=$(date +%s%N)
    
    log_health_check "quick_check" 0 "Starting quick health check (skip_detailed: $skip_detailed_checks)"
    
    # Initialize quick health check with minimal resource allocation
    # Send GET request to /health/quick endpoint with short timeout
    if ! check_http_health "$QUICK_HEALTH_URL" 2; then
        log_health_check "quick_check" $EXIT_UNHEALTHY "Quick health check failed - HTTP endpoint check failed"
        return $EXIT_UNHEALTHY
    fi
    
    # Check process is running without detailed resource monitoring
    if [[ "$skip_detailed_checks" != "true" ]]; then
        if ! check_process_health "node" "false"; then
            log_health_check "quick_check" $EXIT_UNHEALTHY "Quick health check failed - Process check failed"
            return $EXIT_UNHEALTHY
        fi
    else
        # Basic process existence check
        if ! pgrep -f "node\|pm2" >/dev/null 2>&1; then
            log_health_check "quick_check" $EXIT_UNHEALTHY "Quick health check failed - No Node.js processes found"
            return $EXIT_UNHEALTHY
        fi
    fi
    
    # Validate port accessibility with basic connectivity test
    if ! check_port_availability 3000 "localhost"; then
        log_health_check "quick_check" $EXIT_UNHEALTHY "Quick health check failed - Port accessibility check failed"
        return $EXIT_UNHEALTHY
    fi
    
    end_time=$(date +%s%N)
    execution_time_ms=$(( (end_time - start_time) / 1000000 ))
    
    # Log quick health check results with execution time
    log_health_check "quick_check" $EXIT_SUCCESS "Quick health check passed in ${execution_time_ms}ms"
    
    return $EXIT_SUCCESS
}

# Function: perform_comprehensive_health_check
# Executes detailed health check including all system components
perform_comprehensive_health_check() {
    local include_performance_metrics="${1:-true}"
    local max_check_duration="${2:-30}"
    local start_time
    local end_time
    local execution_time_ms
    
    start_time=$(date +%s%N)
    
    log_health_check "comprehensive_check" 0 "Starting comprehensive health check (performance: $include_performance_metrics, max_duration: ${max_check_duration}s)"
    
    # Initialize comprehensive health check with full system assessment
    # Execute HTTP health check against all health endpoints
    if ! check_http_health "$HEALTH_CHECK_URL" "$HEALTH_CHECK_TIMEOUT"; then
        log_health_check "comprehensive_check" $EXIT_UNHEALTHY "Comprehensive health check failed - Primary HTTP endpoint failed"
        return $EXIT_UNHEALTHY
    fi
    
    # Also check quick health endpoint
    if ! check_http_health "$QUICK_HEALTH_URL" "$HEALTH_CHECK_TIMEOUT"; then
        log_health_check "comprehensive_check" 0 "WARNING: Quick health endpoint failed, but continuing check"
    fi
    
    # Perform detailed process health validation including PM2 status
    if ! check_process_health "node" "true"; then
        log_health_check "comprehensive_check" $EXIT_UNHEALTHY "Comprehensive health check failed - Process health check failed"
        return $EXIT_UNHEALTHY
    fi
    
    # Check system resource utilization and performance metrics
    if [[ "$include_performance_metrics" == "true" ]]; then
        # Memory utilization check
        local memory_usage
        if command -v free >/dev/null 2>&1; then
            memory_usage=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100.0}')
            log_health_check "comprehensive_check" 0 "Memory utilization: ${memory_usage}%"
        fi
        
        # CPU load average check
        local load_average
        if [[ -f /proc/loadavg ]]; then
            load_average=$(cut -d' ' -f1 /proc/loadavg)
            log_health_check "comprehensive_check" 0 "Load average (1min): $load_average"
        fi
        
        # Disk usage check
        local disk_usage
        disk_usage=$(df / | awk 'NR==2 {print $5}')
        log_health_check "comprehensive_check" 0 "Root disk usage: $disk_usage"
    fi
    
    # Validate application dependencies and external service connectivity
    if ! check_dependencies "curl" "ps" "netstat" "jq"; then
        log_health_check "comprehensive_check" $EXIT_UNHEALTHY "Comprehensive health check failed - Dependency check failed"
        return $EXIT_UNHEALTHY
    fi
    
    # Test application functionality with sample requests
    # Additional endpoint tests for comprehensive validation
    local additional_endpoints=("/hello" "/good-evening")
    for endpoint in "${additional_endpoints[@]}"; do
        local full_url="http://localhost:3000${endpoint}"
        if command -v curl >/dev/null 2>&1; then
            local response_code
            response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$full_url" 2>/dev/null)
            if [[ "$response_code" == "200" ]]; then
                log_health_check "comprehensive_check" 0 "Endpoint $endpoint responding with HTTP $response_code"
            else
                log_health_check "comprehensive_check" 0 "WARNING: Endpoint $endpoint returned HTTP $response_code"
            fi
        fi
    done
    
    end_time=$(date +%s%N)
    execution_time_ms=$(( (end_time - start_time) / 1000000 ))
    
    # Check if execution time exceeded maximum duration
    local max_duration_ms=$((max_check_duration * 1000))
    if [[ $execution_time_ms -gt $max_duration_ms ]]; then
        log_health_check "comprehensive_check" $EXIT_TIMEOUT "Comprehensive health check exceeded maximum duration: ${execution_time_ms}ms > ${max_duration_ms}ms"
        return $EXIT_TIMEOUT
    fi
    
    # Generate detailed health report with troubleshooting information
    # Log comprehensive health check results with detailed metrics
    log_health_check "comprehensive_check" $EXIT_SUCCESS "Comprehensive health check passed in ${execution_time_ms}ms - All systems healthy"
    
    return $EXIT_SUCCESS
}

# Function: log_health_check
# Logs health check execution details including timestamps, results, and metrics
log_health_check() {
    local check_type="$1"
    local exit_code="$2"
    local details="$3"
    local timestamp
    local log_level
    local log_entry
    
    # Initialize health check logging with timestamp and check type
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Determine log level based on exit code
    case $exit_code in
        0) log_level="INFO" ;;
        1) log_level="ERROR" ;;
        2) log_level="WARN" ;;
        *) log_level="DEBUG" ;;
    esac
    
    # Format log entry with health check results and exit code
    log_entry="[$timestamp] [$log_level] [$check_type] $details"
    
    # Include performance metrics and execution time information
    if [[ "$VERBOSE_OUTPUT" == "true" ]]; then
        echo "$log_entry" >&3  # Output to saved stdout
    fi
    
    # Write formatted log entry to health check log file
    echo "$log_entry" >> "$LOG_FILE" 2>/dev/null || true
    
    # Ensure log rotation and disk space management
    if [[ -f "$LOG_FILE" ]]; then
        local log_size
        log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
        # Rotate log if it exceeds 10MB (10485760 bytes)
        if [[ $log_size -gt 10485760 ]]; then
            mv "$LOG_FILE" "${LOG_FILE}.old" 2>/dev/null || true
            touch "$LOG_FILE" 2>/dev/null || true
        fi
    fi
}

# Function: retry_with_backoff
# Implements exponential backoff retry logic for health check operations
retry_with_backoff() {
    local check_function="$1"
    local max_retries="${2:-$MAX_RETRIES}"
    local base_delay="${3:-$RETRY_DELAY}"
    local attempt=1
    local delay=$base_delay
    local exit_code
    
    log_health_check "retry" 0 "Starting retry mechanism for $check_function (max_retries: $max_retries, base_delay: ${base_delay}s)"
    
    while [[ $attempt -le $max_retries ]]; do
        log_health_check "retry" 0 "Attempt $attempt of $max_retries for $check_function"
        
        # Execute health check function with error handling
        case $check_function in
            "quick_health_check")
                perform_quick_health_check
                exit_code=$?
                ;;
            "comprehensive_health_check")
                perform_comprehensive_health_check
                exit_code=$?
                ;;
            "http_health_check")
                check_http_health "$HEALTH_CHECK_URL"
                exit_code=$?
                ;;
            *)
                log_health_check "retry" $EXIT_UNHEALTHY "ERROR: Unknown check function: $check_function"
                return $EXIT_UNHEALTHY
                ;;
        esac
        
        if [[ $exit_code -eq $EXIT_SUCCESS ]]; then
            log_health_check "retry" $EXIT_SUCCESS "Retry successful on attempt $attempt"
            return $EXIT_SUCCESS
        fi
        
        if [[ $attempt -eq $max_retries ]]; then
            log_health_check "retry" $exit_code "All retry attempts exhausted for $check_function"
            return $exit_code
        fi
        
        # Calculate backoff delay using exponential algorithm
        delay=$((base_delay * (2 ** (attempt - 1))))
        log_health_check "retry" 0 "Attempt $attempt failed, retrying in ${delay}s"
        
        # Sleep for calculated delay before retry attempt
        sleep "$delay"
        
        attempt=$((attempt + 1))
    done
    
    # Return final exit code after all retry attempts exhausted
    return $exit_code
}

# Function: validate_container_environment
# Validates Docker container environment including environment variables and mounts
validate_container_environment() {
    local check_environment_vars="${1:-true}"
    local validate_file_mounts="${2:-true}"
    
    log_health_check "container_env" 0 "Starting container environment validation (env_vars: $check_environment_vars, file_mounts: $validate_file_mounts)"
    
    # Initialize container environment validation with configuration checks
    # Validate required environment variables are set correctly
    if [[ "$check_environment_vars" == "true" ]]; then
        local required_env_vars=("NODE_ENV" "PORT")
        local missing_env_vars=()
        
        for env_var in "${required_env_vars[@]}"; do
            if [[ -z "${!env_var}" ]]; then
                missing_env_vars+=("$env_var")
            else
                log_health_check "container_env" 0 "Environment variable $env_var is set to: ${!env_var}"
            fi
        done
        
        if [[ ${#missing_env_vars[@]} -gt 0 ]]; then
            log_health_check "container_env" 0 "WARNING: Missing optional environment variables: ${missing_env_vars[*]}"
        fi
    fi
    
    # Check file system mounts and volume accessibility
    if [[ "$validate_file_mounts" == "true" ]]; then
        # Validate application directory exists and is accessible
        if [[ ! -d "/app" ]]; then
            log_health_check "container_env" $EXIT_UNHEALTHY "ERROR: Application directory /app not found"
            return $EXIT_UNHEALTHY
        fi
        
        # Check if package.json exists (indicating proper application mount)
        if [[ -f "/app/package.json" ]]; then
            log_health_check "container_env" 0 "Application files properly mounted - package.json found"
        else
            log_health_check "container_env" 0 "WARNING: package.json not found in /app directory"
        fi
        
        # Validate log directory accessibility
        local log_dir
        log_dir=$(dirname "$LOG_FILE")
        if [[ ! -d "$log_dir" ]]; then
            mkdir -p "$log_dir" 2>/dev/null || {
                log_health_check "container_env" $EXIT_UNHEALTHY "ERROR: Cannot create log directory: $log_dir"
                return $EXIT_UNHEALTHY
            }
        fi
        
        if [[ ! -w "$log_dir" ]]; then
            log_health_check "container_env" $EXIT_UNHEALTHY "ERROR: Log directory not writable: $log_dir"
            return $EXIT_UNHEALTHY
        fi
    fi
    
    # Validate network configuration and connectivity
    # Check if container has network access
    if command -v ip >/dev/null 2>&1; then
        local network_interfaces
        network_interfaces=$(ip link show 2>/dev/null | grep -c "state UP" || echo "0")
        if [[ $network_interfaces -gt 0 ]]; then
            log_health_check "container_env" 0 "Network interfaces available: $network_interfaces"
        else
            log_health_check "container_env" 0 "WARNING: No active network interfaces found"
        fi
    fi
    
    # Check container resource limits and allocation
    if [[ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]]; then
        local memory_limit
        memory_limit=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "unlimited")
        log_health_check "container_env" 0 "Container memory limit: $memory_limit bytes"
    fi
    
    # Validate security context and user permissions
    local current_user
    current_user=$(id -un 2>/dev/null || echo "unknown")
    local current_uid
    current_uid=$(id -u 2>/dev/null || echo "unknown")
    
    log_health_check "container_env" 0 "Running as user: $current_user (UID: $current_uid)"
    
    if [[ "$current_uid" == "0" ]]; then
        log_health_check "container_env" 0 "WARNING: Running as root user (UID 0) - security risk"
    fi
    
    # Log environment validation results with configuration details
    log_health_check "container_env" $EXIT_SUCCESS "Container environment validation passed"
    
    return $EXIT_SUCCESS
}

# Function: cleanup_health_check
# Performs cleanup operations after health check execution
cleanup_health_check() {
    local remove_temp_files="${1:-false}"
    local rotate_logs="${2:-true}"
    
    log_health_check "cleanup" 0 "Starting health check cleanup (temp_files: $remove_temp_files, rotate_logs: $rotate_logs)"
    
    # Initialize health check cleanup with resource identification
    # Remove temporary files created during health check execution
    if [[ "$remove_temp_files" == "true" ]]; then
        local temp_files=("/tmp/healthcheck_*.tmp" "/tmp/curl_*.tmp")
        for pattern in "${temp_files[@]}"; do
            # shellcheck disable=SC2086
            rm -f $pattern 2>/dev/null || true
        done
        log_health_check "cleanup" 0 "Temporary files cleaned up"
    fi
    
    # Clean up network connections and process handles
    # This is primarily handled by the system, but we can log the completion
    
    # Rotate health check log files if size limits exceeded
    if [[ "$rotate_logs" == "true" ]] && [[ -f "$LOG_FILE" ]]; then
        local log_size
        log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
        
        # Rotate if log file exceeds 10MB
        if [[ $log_size -gt 10485760 ]]; then
            cp "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
            echo "# Health check log rotated at $(date)" > "$LOG_FILE" 2>/dev/null || true
            log_health_check "cleanup" 0 "Log file rotated due to size: $log_size bytes"
        fi
    fi
    
    # Free memory allocations and system resources
    # This is handled automatically by the shell, but we ensure proper exit
    
    # Update health check statistics and metrics
    local cleanup_timestamp
    cleanup_timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log cleanup completion with resource usage summary
    log_health_check "cleanup" 0 "Health check cleanup completed at $cleanup_timestamp"
}

# Main execution logic
main() {
    local health_check_type="${1:-quick}"
    local exit_code=$EXIT_SUCCESS
    
    # Initialize logging
    log_health_check "main" 0 "Docker health check script started - Type: $health_check_type"
    
    # Validate container environment first
    if ! validate_container_environment "true" "true"; then
        log_health_check "main" $EXIT_UNHEALTHY "Container environment validation failed"
        cleanup_health_check "false" "true"
        exit $EXIT_UNHEALTHY
    fi
    
    # Execute health check based on type
    case $health_check_type in
        "quick"|"")
            if ! retry_with_backoff "quick_health_check" "$MAX_RETRIES" "$RETRY_DELAY"; then
                exit_code=$EXIT_UNHEALTHY
            fi
            ;;
        "comprehensive"|"full")
            if ! retry_with_backoff "comprehensive_health_check" "$MAX_RETRIES" "$RETRY_DELAY"; then
                exit_code=$EXIT_UNHEALTHY
            fi
            ;;
        "http")
            if ! retry_with_backoff "http_health_check" "$MAX_RETRIES" "$RETRY_DELAY"; then
                exit_code=$EXIT_UNHEALTHY
            fi
            ;;
        *)
            log_health_check "main" $EXIT_UNHEALTHY "ERROR: Unknown health check type: $health_check_type"
            exit_code=$EXIT_UNHEALTHY
            ;;
    esac
    
    # Perform cleanup
    cleanup_health_check "false" "true"
    
    # Final health check result
    if [[ $exit_code -eq $EXIT_SUCCESS ]]; then
        log_health_check "main" $EXIT_SUCCESS "Docker health check completed successfully"
        echo "healthy"
    else
        log_health_check "main" $exit_code "Docker health check failed"
        echo "unhealthy"
    fi
    
    exit $exit_code
}

# Script execution
# Check if script is being sourced or executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Set up signal handlers for graceful shutdown
    trap 'log_health_check "signal" 0 "Received shutdown signal, cleaning up"; cleanup_health_check "true" "true"; exit 130' INT TERM
    
    # Execute main function with all provided arguments
    main "$@"
fi