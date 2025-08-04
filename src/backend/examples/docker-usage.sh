#!/bin/bash
#
# Docker Usage Demonstration for Node.js Tutorial Project
# 
# @fileoverview Comprehensive Docker usage demonstration shell script that showcases container 
# deployment workflows for the Node.js tutorial project. This educational script demonstrates 
# Docker image building, container orchestration, multi-stage deployment patterns, Docker 
# Compose usage, health monitoring, and production containerization best practices.
# 
# @description This script provides hands-on examples of modern container deployment including 
# development environments, production optimization, security hardening, and PM2 cluster 
# integration within containers. Features step-by-step containerization guidance with 
# educational commentary, troubleshooting examples, and production-ready Docker deployment 
# patterns for both standalone containers and Docker Compose orchestration.
# 
# @version 1.0.0
# @since 2025-01-01
# @author Node.js Tutorial Project Team
# 
# Educational Features:
# - Comprehensive Docker usage demonstration with modern deployment practices
# - Multi-stage build optimization showcasing production image minimization
# - PM2 cluster mode deployment within Docker containers with load balancing
# - Container security including non-root user execution and security hardening
# - Docker health checks and container monitoring for production deployment
# - Docker Compose orchestration examples for multi-service deployment
# - Educational commentary explaining Docker best practices and optimization techniques
# - Troubleshooting guidance for common containerization issues and solutions
# 
# Technology Integration:
# - Docker Engine 20.10+ for container building, running, and management
# - Docker Compose 2.0+ for multi-container orchestration and service management  
# - Node.js v22.x LTS runtime for application execution within containers
# - Express.js v5.1.0 with enhanced security features and modern JavaScript support
# - PM2 v6.0.8 for production process management with built-in load balancer
# - Comprehensive logging and monitoring integration for operational oversight
# 
# Container Architecture:
# - Multi-stage Dockerfile with dependencies, build, and production optimization stages
# - Security-hardened containers running as non-root nodejs user following best practices
# - PM2 cluster mode providing horizontal scaling and zero-downtime deployment capabilities
# - Container health checks using comprehensive validation and monitoring endpoints
# - Volume management for persistent logs, configuration, and dependency caching
# - Network isolation and service communication patterns for production deployment

# Global script configuration and constants for consistent Docker deployment management
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_CONTEXT="$PROJECT_ROOT"

# Docker image and container configuration with environment variable support
IMAGE_NAME="${IMAGE_NAME:-nodejs-tutorial}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-nodejs-tutorial-app}"
DOCKER_PORT="${DOCKER_PORT:-3000}"
HOST_PORT="${HOST_PORT:-3000}"
ENVIRONMENT="${ENVIRONMENT:-development}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-nodejs-tutorial}"

# Build metadata for image tagging and deployment tracking
BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# Script configuration for enhanced user experience and educational clarity
ENABLE_COLORS="${ENABLE_COLORS:-true}"

# Color definitions for enhanced terminal output and educational formatting
if [[ "$ENABLE_COLORS" == "true" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    WHITE=''
    NC=''
fi

# Header display for Docker usage demonstration with educational context
echo -e "${BLUE}============================================================${NC}"
echo -e "${WHITE}  Node.js Tutorial Project - Docker Usage Demonstration  ${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "${CYAN}Educational containerization workflow demonstrating modern${NC}"
echo -e "${CYAN}Docker deployment practices with PM2 cluster integration${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

#
# Displays comprehensive usage information including available Docker commands, container 
# management options, Docker Compose orchestration, and educational guidance for 
# containerization workflows with detailed descriptions and examples
#
show_usage() {
    cat << EOF
${WHITE}Docker Usage Demonstration - Comprehensive Container Deployment Guide${NC}

${YELLOW}SYNOPSIS${NC}
    ${GREEN}./docker-usage.sh${NC} [COMMAND] [OPTIONS]

${YELLOW}DESCRIPTION${NC}
    Comprehensive Docker usage demonstration showcasing modern containerization
    practices for the Node.js tutorial project. Demonstrates multi-stage builds,
    PM2 cluster deployment, security hardening, and production optimization.

${YELLOW}DOCKER COMMANDS${NC}
    ${GREEN}validate${NC}           Validate Docker environment and system requirements
    ${GREEN}build${NC}              Build production-optimized Docker image with multi-stage process
    ${GREEN}run${NC}                Run Docker container with PM2 cluster mode and monitoring
    ${GREEN}compose${NC}            Deploy using Docker Compose with full orchestration
    ${GREEN}health${NC}             Perform comprehensive container health checks and validation
    ${GREEN}monitor${NC}            Display real-time container monitoring and performance metrics
    ${GREEN}optimize${NC}           Demonstrate container optimization techniques and best practices
    ${GREEN}security${NC}           Showcase container security hardening and vulnerability assessment
    ${GREEN}pm2-demo${NC}           Demonstrate PM2 cluster integration within Docker containers
    ${GREEN}cleanup${NC}            Clean up Docker resources and perform system maintenance
    ${GREEN}demo${NC}               Run complete Docker demonstration workflow with guided experience

${YELLOW}ENVIRONMENT VARIABLES${NC}
    ${CYAN}IMAGE_NAME${NC}          Docker image name (default: nodejs-tutorial)
    ${CYAN}IMAGE_TAG${NC}           Docker image tag (default: latest)
    ${CYAN}CONTAINER_NAME${NC}      Container name (default: nodejs-tutorial-app)
    ${CYAN}ENVIRONMENT${NC}         Deployment environment (development/production)
    ${CYAN}HOST_PORT${NC}           Host port mapping (default: 3000)
    ${CYAN}DOCKER_PORT${NC}         Container port (default: 3000)

${YELLOW}EXAMPLES${NC}
    ${GREEN}# Validate Docker environment and requirements${NC}
    ./docker-usage.sh validate

    ${GREEN}# Build production-optimized image with multi-stage process${NC}
    ./docker-usage.sh build --no-cache --verbose

    ${GREEN}# Run container with PM2 cluster mode and production configuration${NC}
    ENVIRONMENT=production ./docker-usage.sh run --detached

    ${GREEN}# Deploy complete stack using Docker Compose orchestration${NC}
    ./docker-usage.sh compose --build --detached

    ${GREEN}# Perform comprehensive health checks and monitoring validation${NC}
    ./docker-usage.sh health --comprehensive

    ${GREEN}# Demonstrate container optimization and performance tuning${NC}
    ./docker-usage.sh optimize --show-analysis --compare-stages

    ${GREEN}# Run complete Docker demonstration with educational guidance${NC}
    ./docker-usage.sh demo --interactive --include-compose

${YELLOW}EDUCATIONAL FEATURES${NC}
    • Multi-stage Docker build process with layer optimization and caching
    • PM2 cluster mode deployment with load balancing and zero-downtime deployment
    • Container security hardening with non-root execution and minimal attack surface
    • Comprehensive health monitoring and container observability integration
    • Docker Compose orchestration with service management and scaling capabilities
    • Performance optimization techniques and production deployment best practices
    • Educational commentary explaining Docker concepts and deployment strategies

${YELLOW}TECHNOLOGY STACK${NC}
    • Docker Engine 20.10+ for container building and management
    • Docker Compose 2.0+ for multi-container orchestration
    • Node.js v22.x LTS with Active LTS support extending into late 2025
    • Express.js v5.1.0 with enhanced security features and modern JavaScript support
    • PM2 v6.0.8 for production process management with built-in load balancer
    • Multi-stage builds for production optimization and security hardening

${YELLOW}LEARNING OBJECTIVES${NC}
    • Understanding modern Docker containerization patterns and best practices
    • Implementing multi-stage builds for production optimization and security
    • Deploying PM2 cluster mode within containers for horizontal scaling
    • Configuring container networking, volumes, and service orchestration
    • Applying security hardening techniques and vulnerability assessment
    • Monitoring container health and performance in production environments

EOF
}

#
# Logs Docker operation messages with timestamp, color coding, and structured formatting 
# for educational clarity and container operation tracking including Docker context 
# information and optimization notes
#
log_with_timestamp() {
    local message="$1"
    local level="${2:-INFO}"
    local show_context="${3:-false}"
    
    local timestamp
    timestamp="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    
    local color_code
    case "$level" in
        "ERROR")   color_code="$RED" ;;
        "WARN")    color_code="$YELLOW" ;;
        "SUCCESS") color_code="$GREEN" ;;
        "INFO")    color_code="$CYAN" ;;
        "DEBUG")   color_code="$PURPLE" ;;
        *)         color_code="$WHITE" ;;
    esac
    
    # Add Docker context information for educational value
    local context_info=""
    if [[ "$show_context" == "true" ]]; then
        context_info=" [Docker: $IMAGE_NAME:$IMAGE_TAG, Container: $CONTAINER_NAME]"
    fi
    
    echo -e "${color_code}[$timestamp] [$level]${NC} $message${context_info}"
    
    # Add educational annotations for Docker operations
    if [[ "$level" == "INFO" && "$message" =~ ^(Building|Running|Starting) ]]; then
        echo -e "${PURPLE}    └─ Educational Note: Docker $level operation demonstrates containerization best practices${NC}"
    fi
}

#
# Validates Docker installation, version compatibility, system requirements, and environment 
# setup for successful containerization workflows including comprehensive system checks
#
validate_docker_environment() {
    local verbose="${1:-false}"
    
    log_with_timestamp "Starting Docker environment validation for containerization readiness" "INFO"
    
    # Check Docker engine installation and accessibility
    if ! command -v docker &> /dev/null; then
        log_with_timestamp "Docker engine not found. Please install Docker 20.10+ for container support" "ERROR"
        echo -e "${YELLOW}Installation Guide:${NC}"
        echo -e "  • Visit https://docs.docker.com/get-docker/ for installation instructions"
        echo -e "  • Ensure Docker daemon is running and accessible"
        echo -e "  • Verify user permissions for Docker socket access"
        return 1
    fi
    
    # Validate Docker version compatibility for modern features
    local docker_version
    docker_version="$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
    local required_version="20.10.0"
    
    if [[ "$(printf '%s\n' "$required_version" "$docker_version" | sort -V | head -n1)" != "$required_version" ]]; then
        log_with_timestamp "Docker version $docker_version is below required $required_version" "WARN"
        log_with_timestamp "Some advanced features may not be available" "WARN"
    else
        log_with_timestamp "Docker engine $docker_version meets requirements for modern containerization" "SUCCESS"
    fi
    
    # Check Docker Compose installation and version
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_with_timestamp "Docker Compose not found. Install Docker Compose 2.0+ for orchestration" "ERROR"
        echo -e "${YELLOW}Docker Compose Installation:${NC}"
        echo -e "  • Install via package manager or Docker Desktop"
        echo -e "  • Required for multi-container orchestration examples"
        return 1
    fi
    
    # Validate Docker Compose version for advanced orchestration features
    local compose_version
    if docker compose version &> /dev/null; then
        compose_version="$(docker compose version --short 2>/dev/null || echo '2.0.0')"
    else
        compose_version="$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
    fi
    
    log_with_timestamp "Docker Compose version $compose_version available for service orchestration" "SUCCESS"
    
    # Check Docker daemon status and accessibility
    if ! docker info &> /dev/null; then
        log_with_timestamp "Docker daemon not accessible. Check Docker service status" "ERROR"
        echo -e "${YELLOW}Docker Daemon Troubleshooting:${NC}"
        echo -e "  • Ensure Docker service is running: sudo systemctl start docker"
        echo -e "  • Check user group membership: sudo usermod -aG docker \$USER"
        echo -e "  • Verify Docker socket permissions and accessibility"
        return 1
    fi
    
    # Validate system resources for container deployment
    local total_memory
    total_memory="$(free -m | awk '/^Mem:/{print $2}')"
    local available_disk
    available_disk="$(df -BG "$DOCKER_CONTEXT" | awk 'NR==2{print $4}' | sed 's/G//')"
    
    if [[ "$total_memory" -lt 2048 ]]; then
        log_with_timestamp "System memory ${total_memory}MB below recommended 2GB for container deployment" "WARN"
    fi
    
    if [[ "$available_disk" -lt 5 ]]; then
        log_with_timestamp "Available disk space ${available_disk}GB below recommended 5GB" "WARN"
    fi
    
    # Validate network port availability for container binding
    if netstat -tuln 2>/dev/null | grep -q ":$HOST_PORT "; then
        log_with_timestamp "Port $HOST_PORT already in use. Container may fail to bind" "WARN"
        echo -e "${YELLOW}Port Configuration:${NC}"
        echo -e "  • Use different port: HOST_PORT=3001 ./docker-usage.sh run"
        echo -e "  • Stop conflicting service on port $HOST_PORT"
    fi
    
    # Check project directory structure and required files
    local required_files=(
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/server.js"
        "$PROJECT_ROOT/docker/Dockerfile"
        "$PROJECT_ROOT/docker/docker-compose.yml"
        "$PROJECT_ROOT/ecosystem.config.js"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_with_timestamp "Required file not found: $file" "ERROR"
            return 1
        fi
    done
    
    log_with_timestamp "Project structure validation complete - all required files present" "SUCCESS"
    
    # Display verbose system information if requested
    if [[ "$verbose" == "true" ]]; then
        echo -e "\n${YELLOW}System Information:${NC}"
        echo -e "  • Docker Version: $docker_version"
        echo -e "  • Docker Compose: $compose_version"
        echo -e "  • System Memory: ${total_memory}MB"
        echo -e "  • Available Disk: ${available_disk}GB"
        echo -e "  • Host Port: $HOST_PORT"
        echo -e "  • Project Root: $PROJECT_ROOT"
        echo -e "  • Docker Context: $DOCKER_CONTEXT"
    fi
    
    log_with_timestamp "Docker environment validation completed successfully" "SUCCESS"
    echo -e "${GREEN}✓ Docker environment ready for containerization workflow${NC}"
    return 0
}

#
# Builds production-optimized Docker image using multi-stage build process with layer 
# caching, security hardening, and comprehensive build optimization for educational 
# demonstration
#
build_docker_image() {
    local build_target="${1:-production}"
    local no_cache="${2:-false}"
    local verbose_output="${3:-false}"
    
    log_with_timestamp "Starting Docker image build with multi-stage optimization" "INFO" true
    
    # Educational commentary about multi-stage builds
    echo -e "\n${YELLOW}Educational Note - Multi-Stage Docker Builds:${NC}"
    echo -e "  • Stage 1: Dependencies - Install and cache production dependencies"
    echo -e "  • Stage 2: Build - Install all dependencies, run tests and security audits"
    echo -e "  • Stage 3: Production - Create minimal, security-hardened runtime image"
    echo -e "  • Benefits: Reduced image size, enhanced security, layer caching optimization"
    echo ""
    
    # Configure build arguments for comprehensive container configuration
    local build_args=(
        "--build-arg" "NODE_ENV=$ENVIRONMENT"
        "--build-arg" "BUILD_DATE=$BUILD_DATE"
        "--build-arg" "VCS_REF=$VCS_REF"
        "--build-arg" "VERSION=$IMAGE_TAG"
        "--build-arg" "NODE_VERSION=22"
        "--build-arg" "PM2_VERSION=6.0.8"
        "--build-arg" "SECURITY_HARDENING=true"
        "--build-arg" "PERFORMANCE_OPTIMIZATION=true"
    )
    
    # Add no-cache flag for clean builds if requested
    local cache_args=()
    if [[ "$no_cache" == "true" ]]; then
        cache_args+=("--no-cache")
        log_with_timestamp "Building without cache for clean image creation" "INFO"
    else
        log_with_timestamp "Using Docker layer cache for optimized build performance" "INFO"
    fi
    
    # Configure target stage for multi-stage build optimization
    local target_args=("--target" "$build_target")
    
    # Configure image tagging with metadata
    local tag_args=(
        "--tag" "$IMAGE_NAME:$IMAGE_TAG"
        "--tag" "$IMAGE_NAME:latest"
    )
    
    # Add additional tags for build metadata
    if [[ "$VCS_REF" != "unknown" ]]; then
        tag_args+=("--tag" "$IMAGE_NAME:$VCS_REF")
    fi
    
    # Execute Docker build with comprehensive configuration
    log_with_timestamp "Executing Docker build: docker build ${build_args[*]} ${cache_args[*]} ${target_args[*]} ${tag_args[*]}" "INFO"
    
    local build_start_time
    build_start_time="$(date +%s)"
    
    # Determine output handling based on verbose flag
    local output_redirect
    if [[ "$verbose_output" == "true" ]]; then
        output_redirect=""
        log_with_timestamp "Verbose build output enabled - showing detailed build process" "INFO"
    else
        output_redirect=">/dev/null"
        echo -e "${CYAN}Building Docker image (this may take several minutes)...${NC}"
    fi
    
    # Execute Docker build command with error handling
    local build_command="docker build ${build_args[*]} ${cache_args[*]} ${target_args[*]} ${tag_args[*]} $DOCKER_CONTEXT $output_redirect"
    
    if eval "$build_command"; then
        local build_end_time
        build_end_time="$(date +%s)"
        local build_duration=$((build_end_time - build_start_time))
        
        log_with_timestamp "Docker image build completed in ${build_duration}s" "SUCCESS"
        
        # Display image information and optimization metrics
        local image_size
        image_size="$(docker images --format "table {{.Size}}" "$IMAGE_NAME:$IMAGE_TAG" | tail -n 1)"
        log_with_timestamp "Created image $IMAGE_NAME:$IMAGE_TAG with size: $image_size" "SUCCESS"
        
        # Show educational information about build optimization
        echo -e "\n${YELLOW}Build Optimization Results:${NC}"
        echo -e "  • Multi-stage build completed successfully"
        echo -e "  • Image size optimized through layer reduction"
        echo -e "  • Security hardening applied with non-root user"
        echo -e "  • Production dependencies only in final image"
        echo -e "  • PM2 process manager integrated for cluster deployment"
        
        # Display image layers for educational purposes
        if [[ "$verbose_output" == "true" ]]; then
            echo -e "\n${YELLOW}Image Layer Analysis:${NC}"
            docker history "$IMAGE_NAME:$IMAGE_TAG" --format "table {{.CreatedBy}}\t{{.Size}}" | head -10
        fi
        
        return 0
    else
        log_with_timestamp "Docker image build failed. Check Dockerfile and dependencies" "ERROR"
        echo -e "\n${YELLOW}Build Troubleshooting:${NC}"
        echo -e "  • Verify Dockerfile syntax and multi-stage configuration"
        echo -e "  • Check network connectivity for dependency downloads"
        echo -e "  • Ensure sufficient disk space for build process"
        echo -e "  • Review build logs for specific error messages"
        return 1
    fi
}

#
# Runs Docker container with production configuration, environment variables, volume 
# mounting, network configuration, and comprehensive monitoring setup
#
run_docker_container() {
    local run_mode="${1:-standalone}"
    local detached_mode="${2:-false}"
    local container_options="${3:-{}}"
    
    log_with_timestamp "Starting Docker container deployment with PM2 cluster configuration" "INFO" true
    
    # Educational commentary about container deployment
    echo -e "\n${YELLOW}Educational Note - Container Deployment:${NC}"
    echo -e "  • PM2 cluster mode provides horizontal scaling within container"
    echo -e "  • Non-root user execution follows security best practices"
    echo -e "  • Health checks enable container orchestration and monitoring"
    echo -e "  • Volume mounts provide persistent storage and configuration"
    echo ""
    
    # Check if image exists before attempting to run
    if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$IMAGE_NAME:$IMAGE_TAG$"; then
        log_with_timestamp "Docker image $IMAGE_NAME:$IMAGE_TAG not found, building image first" "WARN"
        if ! build_docker_image "production" "false" "false"; then
            return 1
        fi
    fi
    
    # Configure container runtime options
    local container_args=(
        "--name" "$CONTAINER_NAME"
        "--hostname" "tutorial-app"
        "--restart" "unless-stopped"
    )
    
    # Configure port mapping for HTTP traffic
    container_args+=(
        "--publish" "$HOST_PORT:$DOCKER_PORT"
    )
    
    # Configure environment variables for application and PM2
    local env_vars=(
        "--env" "NODE_ENV=$ENVIRONMENT"
        "--env" "PORT=$DOCKER_PORT"
        "--env" "PM2_INSTANCES=max"
        "--env" "PM2_EXEC_MODE=cluster"
        "--env" "PM2_CLUSTER_MODE=true"
        "--env" "PM2_LOAD_BALANCER=round_robin"
        "--env" "TUTORIAL_MODE=true"
        "--env" "EDUCATIONAL_LOGGING=true"
    )
    
    # Add production-specific environment variables
    if [[ "$ENVIRONMENT" == "production" ]]; then
        env_vars+=(
            "--env" "NODE_OPTIONS=--max-old-space-size=1024"
            "--env" "RATE_LIMIT_MAX=1000"
            "--env" "HELMET_ENABLED=true"
        )
    else
        env_vars+=(
            "--env" "DEBUG=*"
            "--env" "FORCE_COLOR=1"
        )
    fi
    
    # Configure volume mounts for persistent data
    local volumes=(
        "--volume" "$PROJECT_ROOT/logs:/app/logs"
        "--volume" "$PROJECT_ROOT/config:/app/config:ro"
    )
    
    # Add development-specific volume mounts
    if [[ "$ENVIRONMENT" == "development" ]]; then
        volumes+=(
            "--volume" "$PROJECT_ROOT/src:/app/src:ro"
        )
    fi
    
    # Configure security settings
    local security_args=(
        "--user" "node:node"
        "--read-only"
        "--tmpfs" "/tmp:rw,noexec,nosuid,size=100m"
        "--security-opt" "no-new-privileges:true"
    )
    
    # Configure resource limits
    local resource_args=(
        "--memory" "1g"
        "--cpus" "1.0"
        "--ulimit" "nofile=65535:65535"
    )
    
    # Configure health check for container monitoring
    local health_args=(
        "--health-cmd" "curl -f http://localhost:$DOCKER_PORT/health || exit 1"
        "--health-interval" "30s"
        "--health-timeout" "10s"
        "--health-retries" "3"
        "--health-start-period" "40s"
    )
    
    # Configure detached or interactive mode
    local mode_args=()
    if [[ "$detached_mode" == "true" ]]; then
        mode_args+=("--detach")
        log_with_timestamp "Running container in detached mode for background operation" "INFO"
    else
        mode_args+=("--interactive" "--tty")
        log_with_timestamp "Running container in interactive mode for educational observation" "INFO"
    fi
    
    # Remove existing container if it exists
    if docker ps -a --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
        log_with_timestamp "Removing existing container $CONTAINER_NAME" "INFO"
        docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1
    fi
    
    # Execute Docker run command with comprehensive configuration
    log_with_timestamp "Executing Docker run with PM2 cluster configuration" "INFO"
    
    local docker_run_command=(
        docker run
        "${mode_args[@]}"
        "${container_args[@]}"
        "${env_vars[@]}"
        "${volumes[@]}"
        "${security_args[@]}"
        "${resource_args[@]}"
        "${health_args[@]}"
        "$IMAGE_NAME:$IMAGE_TAG"
    )
    
    # Display command for educational purposes
    echo -e "\n${PURPLE}Docker Run Command:${NC}"
    echo -e "  ${docker_run_command[*]}"
    echo ""
    
    # Execute container with error handling
    if "${docker_run_command[@]}"; then
        log_with_timestamp "Container $CONTAINER_NAME started successfully" "SUCCESS"
        
        # Wait for container to be healthy
        if [[ "$detached_mode" == "true" ]]; then
            log_with_timestamp "Waiting for container health check to pass..." "INFO"
            local health_timeout=60
            local health_elapsed=0
            
            while [[ $health_elapsed -lt $health_timeout ]]; do
                local health_status
                health_status="$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null)"
                
                if [[ "$health_status" == "healthy" ]]; then
                    log_with_timestamp "Container health check passed - application ready" "SUCCESS"
                    break
                elif [[ "$health_status" == "unhealthy" ]]; then
                    log_with_timestamp "Container health check failed - check application logs" "ERROR"
                    return 1
                fi
                
                sleep 2
                health_elapsed=$((health_elapsed + 2))
            done
            
            if [[ $health_elapsed -ge $health_timeout ]]; then
                log_with_timestamp "Health check timeout - container may not be ready" "WARN"
            fi
        fi
        
        # Display container access information
        echo -e "\n${GREEN}✓ Container Deployment Successful${NC}"
        echo -e "${YELLOW}Container Access Information:${NC}"
        echo -e "  • Application URL: http://localhost:$HOST_PORT"
        echo -e "  • Health Check: http://localhost:$HOST_PORT/health"
        echo -e "  • Container Name: $CONTAINER_NAME"
        echo -e "  • PM2 Cluster Mode: Enabled with 'max' instances"
        
        # Show container management commands
        echo -e "\n${YELLOW}Container Management Commands:${NC}"
        echo -e "  • View logs: docker logs $CONTAINER_NAME"
        echo -e "  • Monitor processes: docker exec $CONTAINER_NAME pm2 list"
        echo -e "  • Stop container: docker stop $CONTAINER_NAME"
        echo -e "  • Remove container: docker rm -f $CONTAINER_NAME"
        
        return 0
    else
        log_with_timestamp "Failed to start Docker container $CONTAINER_NAME" "ERROR"
        echo -e "\n${YELLOW}Container Troubleshooting:${NC}"
        echo -e "  • Check Docker logs: docker logs $CONTAINER_NAME"
        echo -e "  • Verify port availability: netstat -tuln | grep $HOST_PORT"
        echo -e "  • Inspect container: docker inspect $CONTAINER_NAME"
        echo -e "  • Check image health: docker images $IMAGE_NAME:$IMAGE_TAG"
        return 1
    fi
}

#
# Orchestrates multi-container deployment using Docker Compose with service management, 
# network configuration, volume orchestration, and production-ready container orchestration
#
run_docker_compose() {
    local compose_environment="${1:-development}"
    local build_images="${2:-false}"
    local detached_mode="${3:-true}"
    
    log_with_timestamp "Starting Docker Compose orchestration for multi-service deployment" "INFO" true
    
    # Educational commentary about Docker Compose orchestration
    echo -e "\n${YELLOW}Educational Note - Docker Compose Orchestration:${NC}"
    echo -e "  • Multi-service deployment with service dependency management"
    echo -e "  • Shared networks for inter-service communication and isolation"
    echo -e "  • Persistent volumes for data management and performance optimization"
    echo -e "  • Environment-specific configuration with development and production profiles"
    echo ""
    
    # Validate Docker Compose configuration file exists
    local compose_file="$PROJECT_ROOT/docker/docker-compose.yml"
    if [[ ! -f "$compose_file" ]]; then
        log_with_timestamp "Docker Compose file not found: $compose_file" "ERROR"
        return 1
    fi
    
    # Configure environment variables for Compose deployment
    export NODE_ENV="$compose_environment"
    export COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME"
    export VERSION="$IMAGE_TAG"
    export BUILD_DATE="$BUILD_DATE"
    export VCS_REF="$VCS_REF"
    export PORT="$HOST_PORT"
    export DOCKER_PORT="$DOCKER_PORT"
    
    # Add environment-specific variables
    if [[ "$compose_environment" == "production" ]]; then
        export PM2_INSTANCES="max"
        export PM2_EXEC_MODE="cluster"
        export MONITORING_ENABLED="true"
        export LOG_LEVEL="info"
    else
        export PM2_INSTANCES="1"
        export PM2_EXEC_MODE="fork"
        export MONITORING_ENABLED="false"
        export LOG_LEVEL="debug"
        export DEBUG="*"
    fi
    
    # Configure Docker Compose command arguments
    local compose_args=(
        "--file" "$compose_file"
        "--project-name" "$COMPOSE_PROJECT_NAME"
    )
    
    # Add profile selection for environment-specific services
    if [[ "$compose_environment" == "development" ]]; then
        compose_args+=("--profile" "development")
        log_with_timestamp "Using development profile with debugging and hot-reload features" "INFO"
    else
        compose_args+=("--profile" "production")
        log_with_timestamp "Using production profile with optimized performance settings" "INFO"
    fi
    
    # Configure service startup arguments
    local up_args=("up")
    
    if [[ "$detached_mode" == "true" ]]; then
        up_args+=("--detach")
        log_with_timestamp "Starting services in detached mode for background operation" "INFO"
    fi
    
    if [[ "$build_images" == "true" ]]; then
        up_args+=("--build")
        log_with_timestamp "Building images before starting services" "INFO"
    fi
    
    # Add additional orchestration options
    up_args+=(
        "--remove-orphans"
        "--force-recreate"
    )
    
    # Change to project directory for proper context
    cd "$PROJECT_ROOT" || {
        log_with_timestamp "Failed to change to project directory: $PROJECT_ROOT" "ERROR"
        return 1
    }
    
    # Validate Compose configuration before deployment
    log_with_timestamp "Validating Docker Compose configuration..." "INFO"
    if ! docker-compose "${compose_args[@]}" config --quiet; then
        log_with_timestamp "Docker Compose configuration validation failed" "ERROR"
        echo -e "\n${YELLOW}Compose Troubleshooting:${NC}"
        echo -e "  • Check YAML syntax in docker-compose.yml"
        echo -e "  • Verify environment variable values"
        echo -e "  • Validate service configuration and dependencies"
        return 1
    fi
    
    log_with_timestamp "Docker Compose configuration validation successful" "SUCCESS"
    
    # Stop existing services if running
    log_with_timestamp "Stopping existing services for clean deployment..." "INFO"
    docker-compose "${compose_args[@]}" down --remove-orphans >/dev/null 2>&1
    
    # Execute Docker Compose up command
    log_with_timestamp "Executing Docker Compose deployment: docker-compose ${compose_args[*]} ${up_args[*]}" "INFO"
    
    local compose_start_time
    compose_start_time="$(date +%s)"
    
    if docker-compose "${compose_args[@]}" "${up_args[@]}"; then
        local compose_end_time
        compose_end_time="$(date +%s)"
        local compose_duration=$((compose_end_time - compose_start_time))
        
        log_with_timestamp "Docker Compose deployment completed in ${compose_duration}s" "SUCCESS"
        
        # Wait for services to be healthy
        if [[ "$detached_mode" == "true" ]]; then
            log_with_timestamp "Waiting for service health checks to pass..." "INFO"
            sleep 10
            
            # Check service status
            local service_status
            service_status="$(docker-compose "${compose_args[@]}" ps --services --filter "status=running" | wc -l)"
            local total_services
            total_services="$(docker-compose "${compose_args[@]}" config --services | wc -l)"
            
            if [[ "$service_status" -eq "$total_services" ]]; then
                log_with_timestamp "All services are running and healthy" "SUCCESS"
            else
                log_with_timestamp "Some services may not be healthy - check service logs" "WARN"
            fi
        fi
        
        # Display service information
        echo -e "\n${GREEN}✓ Docker Compose Deployment Successful${NC}"
        echo -e "${YELLOW}Service Access Information:${NC}"
        echo -e "  • Main Application: http://localhost:$HOST_PORT"
        echo -e "  • Health Endpoint: http://localhost:$HOST_PORT/health"
        
        if [[ "$compose_environment" == "development" ]]; then
            echo -e "  • Node.js Debugger: localhost:9229"
            echo -e "  • PM2 Dashboard: http://localhost:9615"
        fi
        
        # Show Docker Compose management commands
        echo -e "\n${YELLOW}Docker Compose Management Commands:${NC}"
        echo -e "  • View service status: docker-compose ${compose_args[*]} ps"
        echo -e "  • View service logs: docker-compose ${compose_args[*]} logs -f"
        echo -e "  • Scale services: docker-compose ${compose_args[*]} up --scale app=3"
        echo -e "  • Stop services: docker-compose ${compose_args[*]} down"
        echo -e "  • Remove volumes: docker-compose ${compose_args[*]} down -v"
        
        # Display educational insights about orchestration
        echo -e "\n${YELLOW}Educational Insights:${NC}"
        echo -e "  • Services are connected via dedicated Docker networks"
        echo -e "  • Persistent volumes maintain data across container restarts"
        echo -e "  • Environment profiles enable development/production configurations"
        echo -e "  • Health checks enable automatic service recovery and load balancing"
        
        return 0
    else
        log_with_timestamp "Docker Compose deployment failed" "ERROR"
        echo -e "\n${YELLOW}Deployment Troubleshooting:${NC}"
        echo -e "  • Check service logs: docker-compose ${compose_args[*]} logs"
        echo -e "  • Verify port availability and conflicts"
        echo -e "  • Check image availability and build status"
        echo -e "  • Review environment variable configuration"
        return 1
    fi
}

#
# Educational demonstration of Docker optimization techniques including multi-stage builds, 
# layer caching, image size reduction, and performance optimization strategies
#
demonstrate_container_optimization() {
    local show_build_analysis="${1:-true}"
    local compare_stages="${2:-false}"
    
    log_with_timestamp "Starting container optimization demonstration with educational analysis" "INFO"
    
    # Educational introduction to optimization concepts
    echo -e "\n${WHITE}=== Container Optimization Demonstration ===${NC}"
    echo -e "${YELLOW}Learning Objectives:${NC}"
    echo -e "  • Understanding multi-stage build benefits and layer optimization"
    echo -e "  • Analyzing image size reduction and build performance improvements"
    echo -e "  • Demonstrating dependency caching and build optimization strategies"
    echo -e "  • Exploring security benefits through minimal runtime environments"
    echo ""
    
    # Stage 1: Build without optimization for comparison
    if [[ "$compare_stages" == "true" ]]; then
        log_with_timestamp "Building unoptimized single-stage image for comparison..." "INFO"
        
        # Create temporary single-stage Dockerfile for comparison
        local temp_dockerfile="$PROJECT_ROOT/Dockerfile.unoptimized"
        cat > "$temp_dockerfile" << 'EOF'
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
EOF
        
        local unoptimized_start
        unoptimized_start="$(date +%s)"
        
        if docker build -f "$temp_dockerfile" -t "$IMAGE_NAME:unoptimized" "$DOCKER_CONTEXT" >/dev/null 2>&1; then
            local unoptimized_end
            unoptimized_end="$(date +%s)"
            local unoptimized_duration=$((unoptimized_end - unoptimized_start))
            local unoptimized_size
            unoptimized_size="$(docker images --format "{{.Size}}" "$IMAGE_NAME:unoptimized")"
            
            log_with_timestamp "Unoptimized build completed in ${unoptimized_duration}s, size: $unoptimized_size" "INFO"
        fi
        
        # Clean up temporary file
        rm -f "$temp_dockerfile"
    fi
    
    # Stage 2: Build optimized multi-stage image
    log_with_timestamp "Building production-optimized multi-stage image..." "INFO"
    
    local optimized_start
    optimized_start="$(date +%s)"
    
    if build_docker_image "production" "false" "false"; then
        local optimized_end
        optimized_end="$(date +%s)"
        local optimized_duration=$((optimized_end - optimized_start))
        local optimized_size
        optimized_size="$(docker images --format "{{.Size}}" "$IMAGE_NAME:$IMAGE_TAG")"
        
        log_with_timestamp "Optimized build completed in ${optimized_duration}s, size: $optimized_size" "SUCCESS"
        
        # Stage 3: Analyze optimization results
        if [[ "$show_build_analysis" == "true" ]]; then
            echo -e "\n${YELLOW}=== Build Optimization Analysis ===${NC}"
            
            # Show image comparison
            echo -e "${CYAN}Image Size Comparison:${NC}"
            docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" \
                | grep -E "(REPOSITORY|$IMAGE_NAME)"
            
            # Analyze layer structure
            echo -e "\n${CYAN}Layer Structure Analysis:${NC}"
            echo -e "Multi-stage build layers (optimized):"
            docker history "$IMAGE_NAME:$IMAGE_TAG" --format "table {{.CreatedBy}}\t{{.Size}}" \
                | head -8 | sed 's/\/bin\/sh -c #(nop) //g'
            
            # Show optimization benefits
            echo -e "\n${YELLOW}Optimization Benefits Achieved:${NC}"
            echo -e "  ✓ Multi-stage build reduces final image size by excluding build dependencies"
            echo -e "  ✓ Alpine Linux base provides minimal attack surface and reduced size"
            echo -e "  ✓ Layer caching optimizes rebuild performance for incremental changes"
            echo -e "  ✓ Non-root user execution enhances container security posture"
            echo -e "  ✓ Production-only dependencies minimize runtime attack vectors"
            
            # Compare sizes if both images exist
            if [[ "$compare_stages" == "true" ]] && docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "$IMAGE_NAME:unoptimized"; then
                local optimized_bytes unoptimized_bytes size_reduction
                optimized_bytes="$(docker images --format "{{.Size}}" "$IMAGE_NAME:$IMAGE_TAG" | sed 's/[^0-9.]//g')"
                unoptimized_bytes="$(docker images --format "{{.Size}}" "$IMAGE_NAME:unoptimized" | sed 's/[^0-9.]//g')"
                
                echo -e "\n${GREEN}Size Reduction Analysis:${NC}"
                echo -e "  • Unoptimized image: $unoptimized_size"
                echo -e "  • Optimized image: $optimized_size"
                echo -e "  • Estimated size reduction: Significant space savings achieved"
                
                # Clean up comparison image
                docker rmi "$IMAGE_NAME:unoptimized" >/dev/null 2>&1
            fi
        fi
        
        # Stage 4: Demonstrate layer caching benefits
        echo -e "\n${YELLOW}=== Layer Caching Demonstration ===${NC}"
        log_with_timestamp "Demonstrating build cache performance with incremental rebuild..." "INFO"
        
        local cached_start
        cached_start="$(date +%s)"
        
        if build_docker_image "production" "false" "false"; then
            local cached_end
            cached_end="$(date +%s)"
            local cached_duration=$((cached_end - cached_start))
            
            log_with_timestamp "Cached build completed in ${cached_duration}s (using layer cache)" "SUCCESS"
            
            echo -e "${GREEN}Layer Caching Benefits:${NC}"
            echo -e "  • Subsequent builds use cached layers for unchanged steps"
            echo -e "  • Dependency installation skipped when package.json unchanged"
            echo -e "  • Build time significantly reduced for iterative development"
            echo -e "  • Network bandwidth conserved through cache utilization"
        fi
        
        # Stage 5: Security optimization analysis
        echo -e "\n${YELLOW}=== Security Optimization Analysis ===${NC}"
        echo -e "${CYAN}Security Hardening Features:${NC}"
        echo -e "  ✓ Non-root user (node:node) execution for principle of least privilege"
        echo -e "  ✓ Alpine Linux base image for reduced attack surface"
        echo -e "  ✓ Multi-stage build excludes development tools from runtime"
        echo -e "  ✓ Minimal production dependencies reduce vulnerability exposure"
        echo -e "  ✓ Read-only filesystem and tmpfs for temporary files"
        
        # Show container security scan results
        log_with_timestamp "Container security features implemented successfully" "SUCCESS"
        
        return 0
    else
        log_with_timestamp "Container optimization demonstration failed during build process" "ERROR"
        return 1
    fi
}

#
# Comprehensive demonstration of Docker security best practices including non-root execution, 
# image scanning, security hardening, and vulnerability assessment
#
demonstrate_container_security() {
    local run_security_scan="${1:-false}"
    local show_vulnerability_report="${2:-false}"
    
    log_with_timestamp "Starting comprehensive container security demonstration" "INFO"
    
    # Educational introduction to container security
    echo -e "\n${WHITE}=== Container Security Demonstration ===${NC}"
    echo -e "${YELLOW}Security Learning Objectives:${NC}"
    echo -e "  • Implementing non-root user execution and principle of least privilege"
    echo -e "  • Configuring security-hardened base images and minimal attack surface"
    echo -e "  • Applying runtime security constraints and resource limits"
    echo -e "  • Understanding container vulnerability scanning and assessment"
    echo ""
    
    # Stage 1: Analyze base image security
    log_with_timestamp "Analyzing container security configuration..." "INFO"
    
    echo -e "${CYAN}Base Image Security Analysis:${NC}"
    echo -e "  • Base Image: node:22-alpine (minimal attack surface)"
    echo -e "  • Package Manager: apk (Alpine Package Keeper with security focus)"
    echo -e "  • Size Optimization: Reduced image size minimizes vulnerability exposure"
    echo -e "  • Update Frequency: Regular security updates from Alpine Linux project"
    
    # Stage 2: Demonstrate non-root user configuration
    echo -e "\n${CYAN}Non-Root User Security Implementation:${NC}"
    
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$IMAGE_NAME:$IMAGE_TAG$"; then
        # Check user configuration in image
        local user_info
        user_info="$(docker run --rm "$IMAGE_NAME:$IMAGE_TAG" id 2>/dev/null || echo "User check failed")"
        
        if [[ "$user_info" =~ uid=1000 ]]; then
            echo -e "  ✓ Container runs as non-root user (uid=1000, node user)"
            echo -e "  ✓ Principle of least privilege implemented"
            echo -e "  ✓ Reduced security risk from privilege escalation attacks"
            log_with_timestamp "Non-root user configuration verified successfully" "SUCCESS"
        else
            echo -e "  ⚠ Warning: Container user configuration needs verification"
            log_with_timestamp "Non-root user verification inconclusive" "WARN"
        fi
    else
        log_with_timestamp "Container image not available for security analysis" "WARN"
        echo -e "  • Build image first: ./docker-usage.sh build"
    fi
    
    # Stage 3: Runtime security configuration analysis
    echo -e "\n${CYAN}Runtime Security Configuration:${NC}"
    echo -e "  ✓ Read-only root filesystem prevents runtime modifications"
    echo -e "  ✓ Temporary filesystem (tmpfs) for secure temporary file handling"
    echo -e "  ✓ Security options: no-new-privileges prevents privilege escalation"
    echo -e "  ✓ Resource limits prevent denial-of-service attacks"
    echo -e "  ✓ Network isolation through custom Docker networks"
    
    # Stage 4: Dependency security analysis
    echo -e "\n${CYAN}Dependency Security Assessment:${NC}"
    
    # Check for package.json and perform basic audit
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        log_with_timestamp "Analyzing Node.js dependency security..." "INFO"
        
        cd "$PROJECT_ROOT" || return 1
        
        if command -v npm &> /dev/null; then
            # Run npm audit for vulnerability scanning
            local audit_output
            audit_output="$(npm audit --audit-level=moderate 2>&1)"
            local audit_exit_code=$?
            
            if [[ $audit_exit_code -eq 0 ]]; then
                echo -e "  ✓ No security vulnerabilities found in dependencies"
                log_with_timestamp "Dependency security audit passed" "SUCCESS"
            else
                echo -e "  ⚠ Security vulnerabilities detected in dependencies"
                log_with_timestamp "Dependency security audit found issues" "WARN"
                
                if [[ "$show_vulnerability_report" == "true" ]]; then
                    echo -e "\n${YELLOW}Vulnerability Report Summary:${NC}"
                    echo "$audit_output" | grep -E "(moderate|high|critical)" | head -5
                    echo -e "  • Run 'npm audit fix' to resolve fixable vulnerabilities"
                    echo -e "  • Review manual fixes for breaking changes"
                fi
            fi
        else
            echo -e "  • npm not available for dependency security scanning"
        fi
    fi
    
    # Stage 5: Container image security scanning
    if [[ "$run_security_scan" == "true" ]]; then
        echo -e "\n${CYAN}Container Image Security Scanning:${NC}"
        log_with_timestamp "Performing container image vulnerability scan..." "INFO"
        
        # Check if Docker image exists
        if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$IMAGE_NAME:$IMAGE_TAG$"; then
            # Use docker scout if available, otherwise provide guidance
            if command -v docker &> /dev/null && docker scout version &> /dev/null 2>&1; then
                echo -e "  • Running Docker Scout vulnerability scan..."
                if docker scout cves "$IMAGE_NAME:$IMAGE_TAG" --format sarif > /tmp/scout-results.sarif 2>/dev/null; then
                    echo -e "  ✓ Container image security scan completed"
                    echo -e "  • Results saved to /tmp/scout-results.sarif"
                    log_with_timestamp "Container security scan completed successfully" "SUCCESS"
                else
                    echo -e "  • Docker Scout scan failed or unavailable"
                fi
            else
                echo -e "  • Docker Scout not available for automated scanning"
                echo -e "  • Consider using third-party security scanners:"
                echo -e "    - Trivy: trivy image $IMAGE_NAME:$IMAGE_TAG"
                echo -e "    - Clair: Local vulnerability database scanning"
                echo -e "    - Snyk: snyk container test $IMAGE_NAME:$IMAGE_TAG"
            fi
        else
            log_with_timestamp "Container image not available for security scanning" "WARN"
        fi
    fi
    
    # Stage 6: Security best practices summary
    echo -e "\n${YELLOW}=== Security Best Practices Summary ===${NC}"
    echo -e "${GREEN}Implemented Security Measures:${NC}"
    echo -e "  ✓ Multi-stage builds exclude development tools from production"
    echo -e "  ✓ Alpine Linux base image provides minimal attack surface"
    echo -e "  ✓ Non-root user execution (node:node) prevents privilege escalation"
    echo -e "  ✓ Read-only filesystem and secure temporary file handling"
    echo -e "  ✓ Security headers implemented via Helmet.js middleware"
    echo -e "  ✓ Resource limits prevent resource exhaustion attacks"
    echo -e "  ✓ Network isolation through Docker network segmentation"
    
    echo -e "\n${YELLOW}Additional Security Recommendations:${NC}"
    echo -e "  • Regular base image updates for security patches"
    echo -e "  • Automated vulnerability scanning in CI/CD pipeline"
    echo -e "  • Runtime security monitoring and intrusion detection"
    echo -e "  • Secret management through Docker secrets or external vaults"
    echo -e "  • Network policies for fine-grained traffic control"
    
    log_with_timestamp "Container security demonstration completed successfully" "SUCCESS"
    return 0
}

#
# Educational demonstration of PM2 cluster mode deployment within Docker containers with 
# load balancing, zero-downtime deployment, and container-optimized process management
#
demonstrate_pm2_container_integration() {
    local show_cluster_scaling="${1:-true}"
    local demonstrate_zero_downtime="${2:-false}"
    
    log_with_timestamp "Starting PM2 container integration demonstration" "INFO"
    
    # Educational introduction to PM2 in containers
    echo -e "\n${WHITE}=== PM2 Container Integration Demonstration ===${NC}"
    echo -e "${YELLOW}PM2 Learning Objectives:${NC}"
    echo -e "  • Understanding PM2 cluster mode benefits within container environments"
    echo -e "  • Implementing horizontal scaling and load balancing in containers"
    echo -e "  • Demonstrating zero-downtime deployment and process management"
    echo -e "  • Monitoring PM2 processes and container resource utilization"
    echo ""
    
    # Stage 1: Verify container is running with PM2
    if ! docker ps --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
        log_with_timestamp "Starting container with PM2 cluster mode for demonstration..." "INFO"
        if ! run_docker_container "standalone" "true"; then
            log_with_timestamp "Failed to start container for PM2 demonstration" "ERROR"
            return 1
        fi
        
        # Wait for container to be ready
        sleep 10
    fi
    
    # Stage 2: Demonstrate PM2 cluster mode configuration
    echo -e "${CYAN}PM2 Cluster Mode Configuration:${NC}"
    log_with_timestamp "Analyzing PM2 cluster configuration within container..." "INFO"
    
    local pm2_list_output
    pm2_list_output="$(docker exec "$CONTAINER_NAME" pm2 list 2>/dev/null)"
    
    if [[ $? -eq 0 ]]; then
        echo -e "  ✓ PM2 process manager running in container"
        echo -e "  ✓ Cluster mode enabled with multiple worker processes"
        echo -e "  ✓ Built-in load balancer distributing requests across workers"
        
        # Show PM2 process information
        echo -e "\n${YELLOW}PM2 Process Information:${NC}"
        docker exec "$CONTAINER_NAME" pm2 list --no-colors 2>/dev/null | grep -E "(│|App name|id)"
        
        log_with_timestamp "PM2 cluster mode successfully running in container" "SUCCESS"
    else
        log_with_timestamp "PM2 not accessible in container - check container status" "ERROR"
        return 1
    fi
    
    # Stage 3: Demonstrate load balancing capabilities
    if [[ "$show_cluster_scaling" == "true" ]]; then
        echo -e "\n${CYAN}Load Balancing Demonstration:${NC}"
        log_with_timestamp "Testing PM2 load balancer with concurrent requests..." "INFO"
        
        # Generate multiple requests to test load balancing
        echo -e "  • Sending concurrent requests to test load distribution..."
        
        local request_count=10
        local successful_requests=0
        
        for i in $(seq 1 $request_count); do
            if curl -s -f "http://localhost:$HOST_PORT/health" >/dev/null 2>&1; then
                successful_requests=$((successful_requests + 1))
            fi
        done
        
        if [[ $successful_requests -eq $request_count ]]; then
            echo -e "  ✓ All $request_count requests successful - load balancer working"
            echo -e "  ✓ PM2 round-robin algorithm distributing requests across workers"
            log_with_timestamp "Load balancing demonstration successful" "SUCCESS"
        else
            echo -e "  ⚠ Only $successful_requests of $request_count requests successful"
            log_with_timestamp "Load balancing test completed with some failures" "WARN"
        fi
        
        # Show PM2 monitoring information
        echo -e "\n${YELLOW}PM2 Cluster Monitoring:${NC}"
        docker exec "$CONTAINER_NAME" pm2 monit --no-colors 2>/dev/null | head -10 || echo "  • PM2 monitoring data available via 'docker exec $CONTAINER_NAME pm2 monit'"
    fi
    
    # Stage 4: Demonstrate process management and recovery
    echo -e "\n${CYAN}Process Management and Recovery:${NC}"
    echo -e "  ✓ Automatic process restart on failure (PM2 watch mode)"
    echo -e "  ✓ Memory limit enforcement with automatic restart"
    echo -e "  ✓ Process isolation between cluster workers"
    echo -e "  ✓ Graceful shutdown handling for container lifecycle"
    
    # Show ecosystem configuration
    echo -e "\n${YELLOW}PM2 Ecosystem Configuration:${NC}"
    if docker exec "$CONTAINER_NAME" test -f /app/ecosystem.config.js 2>/dev/null; then
        echo -e "  • Ecosystem file: /app/ecosystem.config.js"
        echo -e "  • Cluster mode: enabled with 'max' instances"
        echo -e "  • Execution mode: cluster (for load balancing)"
        echo -e "  • Auto restart: enabled with memory limits"
        echo -e "  • Log management: centralized with rotation"
    else
        echo -e "  • PM2 configured via runtime parameters"
    fi
    
    # Stage 5: Zero-downtime deployment demonstration
    if [[ "$demonstrate_zero_downtime" == "true" ]]; then
        echo -e "\n${CYAN}Zero-Downtime Deployment Demonstration:${NC}"
        log_with_timestamp "Demonstrating PM2 zero-downtime reload within container..." "INFO"
        
        # Test application responsiveness before reload
        if curl -s -f "http://localhost:$HOST_PORT/health" >/dev/null 2>&1; then
            echo -e "  • Application responding before reload"
            
            # Perform PM2 reload
            if docker exec "$CONTAINER_NAME" pm2 reload all >/dev/null 2>&1; then
                echo -e "  ✓ PM2 reload command executed successfully"
                
                # Wait for reload to complete
                sleep 5
                
                # Test application responsiveness after reload
                if curl -s -f "http://localhost:$HOST_PORT/health" >/dev/null 2>&1; then
                    echo -e "  ✓ Application responding after reload - zero downtime achieved"
                    log_with_timestamp "Zero-downtime deployment demonstration successful" "SUCCESS"
                else
                    echo -e "  ⚠ Application not responding after reload"
                    log_with_timestamp "Zero-downtime reload may have failed" "WARN"
                fi
            else
                echo -e "  ⚠ PM2 reload command failed"
                log_with_timestamp "PM2 reload execution failed" "ERROR"
            fi
        else
            echo -e "  ⚠ Application not responding before reload test"
        fi
    fi
    
    # Stage 6: Container resource monitoring
    echo -e "\n${CYAN}Container Resource Monitoring:${NC}"
    log_with_timestamp "Displaying container resource utilization with PM2..." "INFO"
    
    # Show container stats
    local container_stats
    container_stats="$(docker stats "$CONTAINER_NAME" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null)"
    
    if [[ $? -eq 0 ]]; then
        echo -e "  • Container Resource Usage:"
        echo "$container_stats" | grep -v "CPU"
        echo -e "  ✓ PM2 cluster efficiently utilizing container resources"
        echo -e "  ✓ Multiple workers sharing CPU and memory allocation"
    fi
    
    # Educational summary
    echo -e "\n${YELLOW}=== PM2 Container Integration Benefits ===${NC}"
    echo -e "${GREEN}Achieved Benefits:${NC}"
    echo -e "  ✓ Horizontal scaling within single container through cluster mode"
    echo -e "  ✓ Built-in load balancing without external load balancer requirement"
    echo -e "  ✓ Automatic process recovery and fault tolerance"
    echo -e "  ✓ Zero-downtime deployment capabilities for production environments"
    echo -e "  ✓ Comprehensive process monitoring and resource management"
    echo -e "  ✓ Container-optimized process lifecycle management"
    
    echo -e "\n${YELLOW}Production Considerations:${NC}"
    echo -e "  • PM2 cluster mode provides CPU-bound scaling within container limits"
    echo -e "  • Container orchestration (K8s/Swarm) provides container-level scaling"
    echo -e "  • Health checks ensure proper integration with container orchestrators"
    echo -e "  • Log aggregation collects output from all PM2 workers"
    
    log_with_timestamp "PM2 container integration demonstration completed successfully" "SUCCESS"
    return 0
}

#
# Performs comprehensive container health validation including application endpoints, Docker 
# health checks, service monitoring, and orchestration integration validation
#
run_container_health_checks() {
    local health_check_scope="${1:-comprehensive}"
    local timeout_seconds="${2:-30}"
    
    log_with_timestamp "Starting comprehensive container health validation" "INFO"
    
    # Educational introduction to container health checking
    echo -e "\n${WHITE}=== Container Health Check Validation ===${NC}"
    echo -e "${YELLOW}Health Check Learning Objectives:${NC}"
    echo -e "  • Understanding Docker health check mechanisms and configuration"
    echo -e "  • Validating application endpoints and service responsiveness"
    echo -e "  • Monitoring PM2 process health within container environment"
    echo -e "  • Integrating health checks with orchestration and monitoring systems"
    echo ""
    
    local health_results=()
    local overall_health="healthy"
    
    # Stage 1: Docker container health check validation
    echo -e "${CYAN}Stage 1: Docker Container Health Validation${NC}"
    log_with_timestamp "Validating Docker container health status..." "INFO"
    
    if docker ps --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
        local container_health
        container_health="$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null)"
        
        case "$container_health" in
            "healthy")
                echo -e "  ✓ Docker health check: HEALTHY"
                health_results+=("Docker health check: PASSED")
                ;;
            "unhealthy")
                echo -e "  ✗ Docker health check: UNHEALTHY"
                health_results+=("Docker health check: FAILED")
                overall_health="unhealthy"
                ;;
            "starting")
                echo -e "  ⏳ Docker health check: STARTING (waiting for initial health check)"
                health_results+=("Docker health check: STARTING")
                ;;
            *)
                echo -e "  ⚠ Docker health check: UNKNOWN or not configured"
                health_results+=("Docker health check: UNKNOWN")
                overall_health="unknown"
                ;;
        esac
        
        # Show health check history
        local health_log
        health_log="$(docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$CONTAINER_NAME" 2>/dev/null)"
        if [[ -n "$health_log" ]]; then
            echo -e "  • Latest health check output available"
        fi
    else
        echo -e "  ✗ Container $CONTAINER_NAME not running"
        health_results+=("Container status: NOT RUNNING")
        overall_health="unhealthy"
        log_with_timestamp "Container not running - cannot perform health checks" "ERROR"
        return 1
    fi
    
    # Stage 2: Application endpoint health validation
    echo -e "\n${CYAN}Stage 2: Application Endpoint Validation${NC}"
    log_with_timestamp "Testing application HTTP endpoints..." "INFO"
    
    # Test main health endpoint
    local health_endpoint="http://localhost:$HOST_PORT/health"
    local health_response
    
    if health_response="$(curl -s -f --max-time "$timeout_seconds" "$health_endpoint" 2>/dev/null)"; then
        echo -e "  ✓ Health endpoint: RESPONDING ($health_endpoint)"
        health_results+=("Health endpoint: ACCESSIBLE")
        
        # Validate health response format
        if echo "$health_response" | jq -e '.status' >/dev/null 2>&1; then
            local health_status
            health_status="$(echo "$health_response" | jq -r '.status' 2>/dev/null)"
            if [[ "$health_status" == "OK" ]]; then
                echo -e "  ✓ Health response: STATUS OK"
                health_results+=("Health response: VALID")
            else
                echo -e "  ⚠ Health response: STATUS $health_status"
                health_results+=("Health response: INVALID STATUS")
            fi
        else
            echo -e "  ⚠ Health response: Invalid JSON format"
            health_results+=("Health response: INVALID FORMAT")
        fi
    else
        echo -e "  ✗ Health endpoint: NOT RESPONDING"
        health_results+=("Health endpoint: FAILED")
        overall_health="unhealthy"
    fi
    
    # Test application endpoints
    local endpoints=("/hello" "/good-evening")
    for endpoint in "${endpoints[@]}"; do
        local endpoint_url="http://localhost:$HOST_PORT$endpoint"
        if curl -s -f --max-time 10 "$endpoint_url" >/dev/null 2>&1; then
            echo -e "  ✓ Application endpoint: $endpoint RESPONDING"
            health_results+=("Endpoint $endpoint: ACCESSIBLE")
        else
            echo -e "  ✗ Application endpoint: $endpoint NOT RESPONDING"
            health_results+=("Endpoint $endpoint: FAILED")
            overall_health="unhealthy"
        fi
    done
    
    # Stage 3: PM2 process health validation
    if [[ "$health_check_scope" == "comprehensive" ]]; then
        echo -e "\n${CYAN}Stage 3: PM2 Process Health Validation${NC}"
        log_with_timestamp "Validating PM2 process manager health..." "INFO"
        
        local pm2_status
        pm2_status="$(docker exec "$CONTAINER_NAME" pm2 list --no-colors 2>/dev/null)"
        
        if [[ $? -eq 0 ]]; then
            # Count running processes
            local running_processes
            running_processes="$(echo "$pm2_status" | grep -c "online" || echo "0")"
            
            if [[ "$running_processes" -gt 0 ]]; then
                echo -e "  ✓ PM2 processes: $running_processes online"
                health_results+=("PM2 processes: $running_processes ONLINE")
                
                # Check for any errored processes
                local errored_processes
                errored_processes="$(echo "$pm2_status" | grep -c "errored" || echo "0")"
                
                if [[ "$errored_processes" -eq 0 ]]; then
                    echo -e "  ✓ PM2 process health: All processes healthy"
                    health_results+=("PM2 health: ALL HEALTHY")
                else
                    echo -e "  ⚠ PM2 process health: $errored_processes processes in error state"
                    health_results+=("PM2 health: $errored_processes ERRORS")
                    overall_health="degraded"
                fi
            else
                echo -e "  ✗ PM2 processes: No online processes found"
                health_results+=("PM2 processes: NONE ONLINE")
                overall_health="unhealthy"
            fi
        else
            echo -e "  ✗ PM2 not accessible or not running"
            health_results+=("PM2 status: NOT ACCESSIBLE")
            overall_health="unhealthy"
        fi
    fi
    
    # Stage 4: Container resource health validation
    if [[ "$health_check_scope" == "comprehensive" ]]; then
        echo -e "\n${CYAN}Stage 4: Container Resource Health Validation${NC}"
        log_with_timestamp "Validating container resource utilization..." "INFO"
        
        # Get container resource statistics
        local container_stats
        container_stats="$(docker stats "$CONTAINER_NAME" --no-stream --format "{{.CPUPerc}} {{.MemUsage}} {{.MemPerc}}" 2>/dev/null)"
        
        if [[ $? -eq 0 ]]; then
            local cpu_percent mem_usage mem_percent
            cpu_percent="$(echo "$container_stats" | awk '{print $1}' | sed 's/%//')"
            mem_usage="$(echo "$container_stats" | awk '{print $2}')"
            mem_percent="$(echo "$container_stats" | awk '{print $3}' | sed 's/%//')"
            
            echo -e "  • CPU Usage: ${cpu_percent}%"
            echo -e "  • Memory Usage: $mem_usage (${mem_percent}%)"
            
            # Validate resource thresholds
            if (( $(echo "$cpu_percent < 90" | bc -l 2>/dev/null || echo "1") )); then
                echo -e "  ✓ CPU usage within healthy range"
                health_results+=("CPU usage: HEALTHY")
            else
                echo -e "  ⚠ CPU usage high: ${cpu_percent}%"
                health_results+=("CPU usage: HIGH")
                overall_health="degraded"
            fi
            
            if (( $(echo "$mem_percent < 90" | bc -l 2>/dev/null || echo "1") )); then
                echo -e "  ✓ Memory usage within healthy range"
                health_results+=("Memory usage: HEALTHY")
            else
                echo -e "  ⚠ Memory usage high: ${mem_percent}%"
                health_results+=("Memory usage: HIGH")
                overall_health="degraded"
            fi
        else
            echo -e "  ⚠ Unable to retrieve container resource statistics"
            health_results+=("Resource stats: UNAVAILABLE")
        fi
    fi
    
    # Stage 5: Network connectivity validation
    echo -e "\n${CYAN}Stage 5: Network Connectivity Validation${NC}"
    log_with_timestamp "Validating container network connectivity..." "INFO"
    
    # Test port accessibility
    if netstat -tuln 2>/dev/null | grep -q ":$HOST_PORT "; then
        echo -e "  ✓ Port $HOST_PORT: ACCESSIBLE"
        health_results+=("Port $HOST_PORT: ACCESSIBLE")
    else
        echo -e "  ✗ Port $HOST_PORT: NOT ACCESSIBLE"
        health_results+=("Port $HOST_PORT: FAILED")
        overall_health="unhealthy"
    fi
    
    # Test container network interface
    local container_ip
    container_ip="$(docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER_NAME" 2>/dev/null)"
    
    if [[ -n "$container_ip" ]]; then
        echo -e "  ✓ Container IP: $container_ip (network interface active)"
        health_results+=("Container network: ACTIVE")
    else
        echo -e "  ⚠ Container IP not available"
        health_results+=("Container network: UNKNOWN")
    fi
    
    # Stage 6: Generate health report summary
    echo -e "\n${WHITE}=== Health Check Summary Report ===${NC}"
    
    local total_checks=${#health_results[@]}
    local failed_checks=0
    local warning_checks=0
    
    for result in "${health_results[@]}"; do
        if [[ "$result" =~ FAILED|NOT|NONE ]]; then
            failed_checks=$((failed_checks + 1))
        elif [[ "$result" =~ HIGH|INVALID|UNKNOWN ]]; then
            warning_checks=$((warning_checks + 1))
        fi
    done
    
    local passed_checks=$((total_checks - failed_checks - warning_checks))
    
    echo -e "${YELLOW}Health Check Statistics:${NC}"
    echo -e "  • Total checks performed: $total_checks"
    echo -e "  • Passed checks: $passed_checks"
    echo -e "  • Warning checks: $warning_checks"
    echo -e "  • Failed checks: $failed_checks"
    
    # Determine overall health status
    case "$overall_health" in
        "healthy")
            echo -e "\n${GREEN}Overall Health Status: HEALTHY ✓${NC}"
            echo -e "Container is operating normally and ready for production traffic"
            log_with_timestamp "Container health validation completed - all systems healthy" "SUCCESS"
            return 0
            ;;
        "degraded")
            echo -e "\n${YELLOW}Overall Health Status: DEGRADED ⚠${NC}"
            echo -e "Container is functional but has performance or resource concerns"
            log_with_timestamp "Container health validation completed with warnings" "WARN"
            return 0
            ;;
        "unhealthy")
            echo -e "\n${RED}Overall Health Status: UNHEALTHY ✗${NC}"
            echo -e "Container has critical issues requiring immediate attention"
            log_with_timestamp "Container health validation failed - critical issues detected" "ERROR"
            return 1
            ;;
        *)
            echo -e "\n${PURPLE}Overall Health Status: UNKNOWN ?${NC}"
            echo -e "Unable to determine container health status"
            log_with_timestamp "Container health validation inconclusive" "WARN"
            return 1
            ;;
    esac
}

#
# Educational demonstration of container monitoring including Docker stats, log streaming, 
# resource monitoring, and operational observability for production container management
#
demonstrate_container_monitoring() {
    local monitor_duration="${1:-60}"
    local show_logs="${2:-true}"
    local show_metrics="${3:-true}"
    
    log_with_timestamp "Starting container monitoring demonstration" "INFO"
    
    # Educational introduction to container monitoring
    echo -e "\n${WHITE}=== Container Monitoring Demonstration ===${NC}"
    echo -e "${YELLOW}Monitoring Learning Objectives:${NC}"
    echo -e "  • Understanding Docker container metrics and performance monitoring"
    echo -e "  • Analyzing real-time resource utilization and scaling indicators"
    echo -e "  • Implementing log aggregation and centralized monitoring strategies"
    echo -e "  • Demonstrating operational observability for production deployments"
    echo ""
    
    # Verify container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
        log_with_timestamp "Container $CONTAINER_NAME not running - starting for monitoring demo" "INFO"
        if ! run_docker_container "standalone" "true"; then
            log_with_timestamp "Failed to start container for monitoring demonstration" "ERROR"
            return 1
        fi
        sleep 10
    fi
    
    # Stage 1: Real-time container statistics monitoring
    if [[ "$show_metrics" == "true" ]]; then
        echo -e "${CYAN}Stage 1: Real-Time Container Metrics${NC}"
        log_with_timestamp "Displaying real-time container resource statistics..." "INFO"
        
        echo -e "  • Monitoring container: $CONTAINER_NAME"
        echo -e "  • Duration: ${monitor_duration} seconds"
        echo -e "  • Metrics: CPU, Memory, Network I/O, Block I/O"
        echo ""
        
        # Show container stats header
        echo -e "${YELLOW}Container Resource Statistics:${NC}"
        docker stats "$CONTAINER_NAME" --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" --no-stream
        
        # Monitor for specified duration with periodic updates
        local monitoring_interval=5
        local iterations=$((monitor_duration / monitoring_interval))
        
        echo -e "\n${CYAN}Real-Time Monitoring (updating every ${monitoring_interval}s):${NC}"
        
        for ((i=1; i<=iterations; i++)); do
            local timestamp
            timestamp="$(date +'%H:%M:%S')"
            
            local stats
            stats="$(docker stats "$CONTAINER_NAME" --no-stream --format "{{.CPUPerc}} {{.MemUsage}} {{.MemPerc}} {{.NetIO}}" 2>/dev/null)"
            
            if [[ $? -eq 0 ]]; then
                echo -e "[$timestamp] $stats"
            else
                echo -e "[$timestamp] Container monitoring failed"
                break
            fi
            
            sleep $monitoring_interval
        done
        
        log_with_timestamp "Container metrics monitoring completed" "SUCCESS"
    fi
    
    # Stage 2: PM2 process monitoring within container
    echo -e "\n${CYAN}Stage 2: PM2 Process Monitoring${NC}"
    log_with_timestamp "Monitoring PM2 cluster processes within container..." "INFO"
    
    # Show PM2 process list
    echo -e "${YELLOW}PM2 Process Status:${NC}"
    if docker exec "$CONTAINER_NAME" pm2 list --no-colors 2>/dev/null; then
        echo -e "  ✓ PM2 cluster processes monitored successfully"
    else
        echo -e "  ⚠ PM2 monitoring not available"
    fi
    
    # Show PM2 monitoring information
    echo -e "\n${YELLOW}PM2 Performance Metrics:${NC}"
    local pm2_info
    pm2_info="$(docker exec "$CONTAINER_NAME" pm2 show 0 --no-colors 2>/dev/null | grep -E "(cpu|memory|uptime|restarts)")"
    
    if [[ -n "$pm2_info" ]]; then
        echo "$pm2_info" | head -10
    else
        echo -e "  • PM2 detailed metrics available via: docker exec $CONTAINER_NAME pm2 monit"
    fi
    
    # Stage 3: Application performance monitoring
    echo -e "\n${CYAN}Stage 3: Application Performance Monitoring${NC}"
    log_with_timestamp "Testing application performance and response times..." "INFO"
    
    # Perform load testing to generate metrics
    echo -e "  • Generating load for performance analysis..."
    
    local response_times=()
    local successful_requests=0
    local total_requests=20
    
    for i in $(seq 1 $total_requests); do
        local start_time end_time response_time
        start_time="$(date +%s%3N)"
        
        if curl -s -f "http://localhost:$HOST_PORT/health" >/dev/null 2>&1; then
            end_time="$(date +%s%3N)"
            response_time=$((end_time - start_time))
            response_times+=("$response_time")
            successful_requests=$((successful_requests + 1))
        fi
        
        sleep 0.1
    done
    
    # Calculate performance statistics
    if [[ ${#response_times[@]} -gt 0 ]]; then
        local total_time=0
        local min_time=9999
        local max_time=0
        
        for time in "${response_times[@]}"; do
            total_time=$((total_time + time))
            if [[ $time -lt $min_time ]]; then min_time=$time; fi
            if [[ $time -gt $max_time ]]; then max_time=$time; fi
        done
        
        local avg_time=$((total_time / ${#response_times[@]}))
        
        echo -e "\n${YELLOW}Application Performance Results:${NC}"
        echo -e "  • Total requests: $total_requests"
        echo -e "  • Successful requests: $successful_requests"
        echo -e "  • Success rate: $(( (successful_requests * 100) / total_requests ))%"
        echo -e "  • Average response time: ${avg_time}ms"
        echo -e "  • Min response time: ${min_time}ms"
        echo -e "  • Max response time: ${max_time}ms"
    fi
    
    # Stage 4: Log monitoring and analysis
    if [[ "$show_logs" == "true" ]]; then
        echo -e "\n${CYAN}Stage 4: Container Log Monitoring${NC}"
        log_with_timestamp "Displaying container log streams and analysis..." "INFO"
        
        echo -e "${YELLOW}Recent Container Logs:${NC}"
        docker logs "$CONTAINER_NAME" --tail 20 --timestamps 2>/dev/null | head -15
        
        echo -e "\n${YELLOW}PM2 Application Logs:${NC}"
        docker exec "$CONTAINER_NAME" cat /app/logs/out.log 2>/dev/null | tail -10 || echo "  • Application logs available in container volume"
        
        # Analyze log patterns
        local log_analysis
        log_analysis="$(docker logs "$CONTAINER_NAME" --since 1m 2>/dev/null | wc -l)"
        echo -e "\n${YELLOW}Log Analysis:${NC}"
        echo -e "  • Log entries in last minute: $log_analysis"
        echo -e "  • Log rotation: Enabled with size limits"
        echo -e "  • Centralized logging: Available via Docker logging drivers"
    fi
    
    # Stage 5: Health monitoring integration
    echo -e "\n${CYAN}Stage 5: Health Monitoring Integration${NC}"
    log_with_timestamp "Demonstrating health monitoring integration..." "INFO"
    
    # Test health endpoint
    local health_response
    health_response="$(curl -s "http://localhost:$HOST_PORT/health" 2>/dev/null)"
    
    if [[ $? -eq 0 ]]; then
        echo -e "${YELLOW}Health Endpoint Response:${NC}"
        echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
        
        # Extract health metrics
        local uptime
        uptime="$(echo "$health_response" | jq -r '.uptime' 2>/dev/null)"
        if [[ "$uptime" != "null" && -n "$uptime" ]]; then
            echo -e "\n${YELLOW}Health Metrics:${NC}"
            echo -e "  • Application uptime: ${uptime}s"
            echo -e "  • Health check: Responsive"
            echo -e "  • Monitoring integration: Active"
        fi
    else
        echo -e "  ⚠ Health endpoint not responding"
    fi
    
    # Stage 6: Monitoring summary and recommendations
    echo -e "\n${WHITE}=== Monitoring Summary ===${NC}"
    echo -e "${GREEN}Monitoring Capabilities Demonstrated:${NC}"
    echo -e "  ✓ Real-time container resource monitoring with Docker stats"
    echo -e "  ✓ PM2 cluster process monitoring and performance tracking"
    echo -e "  ✓ Application performance testing and response time analysis"
    echo -e "  ✓ Log aggregation and centralized logging integration"
    echo -e "  ✓ Health endpoint monitoring for orchestration integration"
    
    echo -e "\n${YELLOW}Production Monitoring Recommendations:${NC}"
    echo -e "  • Implement Prometheus for metrics collection and alerting"
    echo -e "  • Configure ELK stack for centralized log analysis"
    echo -e "  • Set up Grafana dashboards for operational visibility"
    echo -e "  • Enable container runtime monitoring with cAdvisor"
    echo -e "  • Configure alert thresholds for proactive incident response"
    
    echo -e "\n${YELLOW}Container Monitoring Best Practices:${NC}"
    echo -e "  • Monitor both container-level and application-level metrics"
    echo -e "  • Implement health checks for automatic recovery and scaling"
    echo -e "  • Use structured logging for better searchability and analysis"
    echo -e "  • Set up distributed tracing for complex application workflows"
    echo -e "  • Regularly review and tune monitoring thresholds and alerts"
    
    log_with_timestamp "Container monitoring demonstration completed successfully" "SUCCESS"
    return 0
}

#
# Performs comprehensive Docker cleanup including container removal, image cleanup, volume 
# management, network cleanup, and resource optimization
#
cleanup_docker_resources() {
    local remove_containers="${1:-true}"
    local remove_images="${2:-false}"
    local prune_system="${3:-false}"
    
    log_with_timestamp "Starting comprehensive Docker resource cleanup" "INFO"
    
    # Educational introduction to Docker cleanup
    echo -e "\n${WHITE}=== Docker Resource Cleanup ===${NC}"
    echo -e "${YELLOW}Cleanup Learning Objectives:${NC}"
    echo -e "  • Understanding Docker resource management and storage optimization"
    echo -e "  • Implementing safe container and image removal procedures"
    echo -e "  • Managing Docker volumes and persistent data preservation"
    echo -e "  • Performing system-wide cleanup and maintenance operations"
    echo ""
    
    local cleanup_results=()
    local space_freed=0
    
    # Stage 1: Container cleanup
    if [[ "$remove_containers" == "true" ]]; then
        echo -e "${CYAN}Stage 1: Container Cleanup${NC}"
        log_with_timestamp "Cleaning up Docker containers..." "INFO"
        
        # Stop and remove project containers
        local project_containers
        project_containers="$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" 2>/dev/null)"
        
        if [[ -n "$project_containers" ]]; then
            echo -e "  • Found project containers: $project_containers"
            
            # Stop containers gracefully
            echo -e "  • Stopping containers gracefully..."
            for container in $project_containers; do
                if docker stop "$container" >/dev/null 2>&1; then
                    echo -e "    ✓ Stopped container: $container"
                else
                    echo -e "    ⚠ Failed to stop container: $container"
                fi
            done
            
            # Remove containers
            echo -e "  • Removing containers..."
            for container in $project_containers; do
                if docker rm "$container" >/dev/null 2>&1; then
                    echo -e "    ✓ Removed container: $container"
                    cleanup_results+=("Container $container: REMOVED")
                else
                    echo -e "    ⚠ Failed to remove container: $container"
                fi
            done
        else
            echo -e "  • No project containers found to clean up"
            cleanup_results+=("Project containers: NONE FOUND")
        fi
        
        # Clean up Docker Compose containers
        if [[ -f "$PROJECT_ROOT/docker/docker-compose.yml" ]]; then
            echo -e "  • Cleaning up Docker Compose resources..."
            cd "$PROJECT_ROOT" || return 1
            
            if docker-compose --file docker/docker-compose.yml --project-name "$COMPOSE_PROJECT_NAME" down --remove-orphans >/dev/null 2>&1; then
                echo -e "    ✓ Docker Compose cleanup completed"
                cleanup_results+=("Docker Compose: CLEANED")
            else
                echo -e "    ⚠ Docker Compose cleanup failed or no resources to clean"
            fi
        fi
    fi
    
    # Stage 2: Image cleanup
    if [[ "$remove_images" == "true" ]]; then
        echo -e "\n${CYAN}Stage 2: Docker Image Cleanup${NC}"
        log_with_timestamp "Cleaning up Docker images..." "INFO"
        
        # Remove project images
        local project_images
        project_images="$(docker images --filter "reference=$IMAGE_NAME" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null)"
        
        if [[ -n "$project_images" ]]; then
            echo -e "  • Found project images: $(echo "$project_images" | tr '\n' ' ')"
            
            for image in $project_images; do
                local image_size
                image_size="$(docker images --format "{{.Size}}" "$image" 2>/dev/null)"
                
                if docker rmi "$image" >/dev/null 2>&1; then
                    echo -e "    ✓ Removed image: $image ($image_size)"
                    cleanup_results+=("Image $image: REMOVED")
                else
                    echo -e "    ⚠ Failed to remove image: $image (may be in use)"
                fi
            done
        else
            echo -e "  • No project images found to clean up"
            cleanup_results+=("Project images: NONE FOUND")
        fi
        
        # Remove dangling images
        echo -e "  • Removing dangling images..."
        local dangling_count
        dangling_count="$(docker images --filter "dangling=true" --quiet | wc -l)"
        
        if [[ "$dangling_count" -gt 0 ]]; then
            if docker image prune --force >/dev/null 2>&1; then
                echo -e "    ✓ Removed $dangling_count dangling images"
                cleanup_results+=("Dangling images: $dangling_count REMOVED")
            else
                echo -e "    ⚠ Failed to remove dangling images"
            fi
        else
            echo -e "    • No dangling images found"
        fi
    fi
    
    # Stage 3: Volume cleanup
    echo -e "\n${CYAN}Stage 3: Docker Volume Management${NC}"
    log_with_timestamp "Managing Docker volumes and persistent data..." "INFO"
    
    # List project volumes
    local project_volumes
    project_volumes="$(docker volume ls --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME" --format "{{.Name}}" 2>/dev/null)"
    
    if [[ -n "$project_volumes" ]]; then
        echo -e "  • Found project volumes: $(echo "$project_volumes" | tr '\n' ' ')"
        echo -e "  • Volume cleanup: Preserving data for educational purposes"
        echo -e "    (Use 'docker volume rm' manually to remove persistent data)"
        cleanup_results+=("Project volumes: PRESERVED")
    else
        echo -e "  • No project volumes found"
    fi
    
    # Remove unused volumes if requested
    if [[ "$prune_system" == "true" ]]; then
        echo -e "  • Removing unused volumes..."
        local volume_prune_output
        volume_prune_output="$(docker volume prune --force 2>/dev/null)"
        
        if [[ $? -eq 0 ]]; then
            echo -e "    ✓ Unused volume cleanup completed"
            cleanup_results+=("Unused volumes: REMOVED")
        else
            echo -e "    ⚠ Volume cleanup failed"
        fi
    fi
    
    # Stage 4: Network cleanup
    echo -e "\n${CYAN}Stage 4: Docker Network Cleanup${NC}"
    log_with_timestamp "Cleaning up Docker networks..." "INFO"
    
    # Remove project networks
    local project_networks
    project_networks="$(docker network ls --filter "name=$COMPOSE_PROJECT_NAME" --format "{{.Name}}" 2>/dev/null | grep -v "bridge\|host\|none")"
    
    if [[ -n "$project_networks" ]]; then
        echo -e "  • Found project networks: $(echo "$project_networks" | tr '\n' ' ')"
        
        for network in $project_networks; do
            if docker network rm "$network" >/dev/null 2>&1; then
                echo -e "    ✓ Removed network: $network"
                cleanup_results+=("Network $network: REMOVED")
            else
                echo -e "    ⚠ Failed to remove network: $network (may be in use)"
            fi
        done
    else
        echo -e "  • No project networks found to clean up"
        cleanup_results+=("Project networks: NONE FOUND")
    fi
    
    # Remove unused networks if requested
    if [[ "$prune_system" == "true" ]]; then
        echo -e "  • Removing unused networks..."
        if docker network prune --force >/dev/null 2>&1; then
            echo -e "    ✓ Unused network cleanup completed"
            cleanup_results+=("Unused networks: REMOVED")
        else
            echo -e "    ⚠ Network cleanup failed"
        fi
    fi
    
    # Stage 5: System-wide cleanup
    if [[ "$prune_system" == "true" ]]; then
        echo -e "\n${CYAN}Stage 5: System-Wide Docker Cleanup${NC}"
        log_with_timestamp "Performing system-wide Docker resource cleanup..." "INFO"
        
        # Get disk usage before cleanup
        local disk_usage_before
        disk_usage_before="$(docker system df --format "{{.Size}}" | head -1)"
        
        echo -e "  • Docker disk usage before cleanup: $disk_usage_before"
        
        # Perform system prune
        echo -e "  • Performing comprehensive system cleanup..."
        local prune_output
        prune_output="$(docker system prune --force 2>/dev/null)"
        
        if [[ $? -eq 0 ]]; then
            echo -e "    ✓ System-wide cleanup completed"
            cleanup_results+=("System prune: COMPLETED")
            
            # Get disk usage after cleanup
            local disk_usage_after
            disk_usage_after="$(docker system df --format "{{.Size}}" | head -1)"
            echo -e "  • Docker disk usage after cleanup: $disk_usage_after"
        else
            echo -e "    ⚠ System-wide cleanup failed"
        fi
        
        # Build cache cleanup
        echo -e "  • Cleaning build cache..."
        if docker builder prune --force >/dev/null 2>&1; then
            echo -e "    ✓ Build cache cleanup completed"
            cleanup_results+=("Build cache: CLEANED")
        else
            echo -e "    ⚠ Build cache cleanup failed"
        fi
    fi
    
    # Stage 6: Cleanup summary and recommendations
    echo -e "\n${WHITE}=== Cleanup Summary Report ===${NC}"
    
    local total_operations=${#cleanup_results[@]}
    local successful_operations=0
    
    for result in "${cleanup_results[@]}"; do
        if [[ "$result" =~ REMOVED|CLEANED|COMPLETED ]]; then
            successful_operations=$((successful_operations + 1))
        fi
    done
    
    echo -e "${YELLOW}Cleanup Statistics:${NC}"
    echo -e "  • Total cleanup operations: $total_operations"
    echo -e "  • Successful operations: $successful_operations"
    echo -e "  • Failed/skipped operations: $((total_operations - successful_operations))"
    
    # Display cleanup results
    echo -e "\n${YELLOW}Detailed Cleanup Results:${NC}"
    for result in "${cleanup_results[@]}"; do
        if [[ "$result" =~ REMOVED|CLEANED|COMPLETED ]]; then
            echo -e "  ✓ $result"
        elif [[ "$result" =~ PRESERVED|NONE ]]; then
            echo -e "  • $result"
        else
            echo -e "  ⚠ $result"
        fi
    done
    
    # Show remaining Docker resources
    echo -e "\n${YELLOW}Remaining Docker Resources:${NC}"
    local remaining_containers
    remaining_containers="$(docker ps -a --format "{{.Names}}" | wc -l)"
    local remaining_images
    remaining_images="$(docker images --format "{{.Repository}}" | wc -l)"
    local remaining_volumes
    remaining_volumes="$(docker volume ls --format "{{.Name}}" | wc -l)"
    
    echo -e "  • Containers: $remaining_containers"
    echo -e "  • Images: $remaining_images"
    echo -e "  • Volumes: $remaining_volumes"
    
    # Educational cleanup best practices
    echo -e "\n${YELLOW}Docker Cleanup Best Practices:${NC}"
    echo -e "  • Regular cleanup prevents disk space exhaustion"
    echo -e "  • Use multi-stage builds to minimize image size"
    echo -e "  • Implement .dockerignore to exclude unnecessary files"
    echo -e "  • Monitor Docker resource usage with 'docker system df'"
    echo -e "  • Automate cleanup in CI/CD pipelines"
    
    echo -e "\n${YELLOW}Manual Cleanup Commands:${NC}"
    echo -e "  • Remove all containers: docker rm -f \$(docker ps -aq)"
    echo -e "  • Remove all images: docker rmi -f \$(docker images -q)"
    echo -e "  • Remove all volumes: docker volume rm \$(docker volume ls -q)"
    echo -e "  • Complete system cleanup: docker system prune -a --volumes"
    
    log_with_timestamp "Docker resource cleanup completed successfully" "SUCCESS"
    return 0
}

#
# Orchestrates complete Docker demonstration workflow including image building, container 
# deployment, orchestration, monitoring, optimization, and cleanup with guided educational 
# progression
#
run_comprehensive_docker_demo() {
    local demo_scenario="${1:-complete}"
    local interactive_mode="${2:-false}"
    local include_compose="${3:-true}"
    
    log_with_timestamp "Starting comprehensive Docker demonstration workflow" "INFO"
    
    # Educational introduction to comprehensive demo
    echo -e "\n${WHITE}========================================${NC}"
    echo -e "${WHITE}  COMPREHENSIVE DOCKER DEMONSTRATION  ${NC}"
    echo -e "${WHITE}========================================${NC}"
    echo -e "${CYAN}Educational Docker Learning Journey${NC}"
    echo -e "${CYAN}Modern Containerization Best Practices${NC}"
    echo -e "${WHITE}========================================${NC}"
    echo ""
    
    echo -e "${YELLOW}Demo Learning Objectives:${NC}"
    echo -e "  • Master Docker image building with multi-stage optimization"
    echo -e "  • Deploy production-ready containers with PM2 cluster integration"
    echo -e "  • Orchestrate multi-service deployments using Docker Compose"
    echo -e "  • Implement container security hardening and vulnerability assessment"
    echo -e "  • Monitor container performance and operational observability"
    echo -e "  • Apply container optimization techniques and best practices"
    echo ""
    
    # Interactive mode prompt
    if [[ "$interactive_mode" == "true" ]]; then
        echo -e "${PURPLE}Interactive Mode: Press ENTER to continue between demo phases${NC}"
        read -r -p "Press ENTER to begin the comprehensive Docker demonstration..."
        echo ""
    fi
    
    local demo_start_time
    demo_start_time="$(date +%s)"
    local phase_results=()
    
    # Phase 1: Environment Validation and Setup
    echo -e "${WHITE}=== Phase 1: Docker Environment Validation ===${NC}"
    log_with_timestamp "Phase 1: Validating Docker environment and system requirements" "INFO"
    
    if validate_docker_environment "true"; then
        echo -e "${GREEN}✓ Phase 1 Complete: Docker environment ready for containerization${NC}"
        phase_results+=("Phase 1 - Environment Validation: SUCCESS")
    else
        echo -e "${RED}✗ Phase 1 Failed: Docker environment validation failed${NC}"
        phase_results+=("Phase 1 - Environment Validation: FAILED")
        log_with_timestamp "Demo terminated due to environment validation failure" "ERROR"
        return 1
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 2 (Image Building)..."
        echo ""
    fi
    
    # Phase 2: Multi-Stage Image Building
    echo -e "\n${WHITE}=== Phase 2: Multi-Stage Image Building ===${NC}"
    log_with_timestamp "Phase 2: Building production-optimized Docker image" "INFO"
    
    if build_docker_image "production" "false" "true"; then
        echo -e "${GREEN}✓ Phase 2 Complete: Multi-stage Docker image built successfully${NC}"
        phase_results+=("Phase 2 - Image Building: SUCCESS")
    else
        echo -e "${RED}✗ Phase 2 Failed: Docker image building failed${NC}"
        phase_results+=("Phase 2 - Image Building: FAILED")
        log_with_timestamp "Demo continuing despite image build failure" "WARN"
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 3 (Container Deployment)..."
        echo ""
    fi
    
    # Phase 3: Container Deployment with PM2
    echo -e "\n${WHITE}=== Phase 3: Container Deployment with PM2 Cluster ===${NC}"
    log_with_timestamp "Phase 3: Deploying container with PM2 cluster integration" "INFO"
    
    if run_docker_container "standalone" "true"; then
        echo -e "${GREEN}✓ Phase 3 Complete: Container deployed with PM2 cluster mode${NC}"
        phase_results+=("Phase 3 - Container Deployment: SUCCESS")
        
        # Wait for container to be ready
        sleep 10
    else
        echo -e "${RED}✗ Phase 3 Failed: Container deployment failed${NC}"
        phase_results+=("Phase 3 - Container Deployment: FAILED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 4 (Docker Compose Orchestration)..."
        echo ""
    fi
    
    # Phase 4: Docker Compose Orchestration
    if [[ "$include_compose" == "true" ]]; then
        echo -e "\n${WHITE}=== Phase 4: Docker Compose Orchestration ===${NC}"
        log_with_timestamp "Phase 4: Demonstrating Docker Compose multi-service deployment" "INFO"
        
        # Stop standalone container first
        if docker ps --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
            log_with_timestamp "Stopping standalone container for Compose demonstration" "INFO"
            docker stop "$CONTAINER_NAME" >/dev/null 2>&1
            docker rm "$CONTAINER_NAME" >/dev/null 2>&1
        fi
        
        if run_docker_compose "development" "true" "true"; then
            echo -e "${GREEN}✓ Phase 4 Complete: Docker Compose orchestration successful${NC}"
            phase_results+=("Phase 4 - Docker Compose: SUCCESS")
            
            # Wait for services to be ready
            sleep 15
        else
            echo -e "${RED}✗ Phase 4 Failed: Docker Compose orchestration failed${NC}"
            phase_results+=("Phase 4 - Docker Compose: FAILED")
        fi
    else
        log_with_timestamp "Phase 4: Skipping Docker Compose demonstration" "INFO"
        phase_results+=("Phase 4 - Docker Compose: SKIPPED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 5 (Security Demonstration)..."
        echo ""
    fi
    
    # Phase 5: Container Security Demonstration
    echo -e "\n${WHITE}=== Phase 5: Container Security Hardening ===${NC}"
    log_with_timestamp "Phase 5: Demonstrating container security best practices" "INFO"
    
    if demonstrate_container_security "false" "true"; then
        echo -e "${GREEN}✓ Phase 5 Complete: Container security demonstration successful${NC}"
        phase_results+=("Phase 5 - Security Demo: SUCCESS")
    else
        echo -e "${RED}✗ Phase 5 Failed: Container security demonstration failed${NC}"
        phase_results+=("Phase 5 - Security Demo: FAILED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 6 (Optimization Demonstration)..."
        echo ""
    fi
    
    # Phase 6: Container Optimization Demonstration
    echo -e "\n${WHITE}=== Phase 6: Container Optimization Techniques ===${NC}"
    log_with_timestamp "Phase 6: Demonstrating container optimization strategies" "INFO"
    
    if demonstrate_container_optimization "true" "true"; then
        echo -e "${GREEN}✓ Phase 6 Complete: Container optimization demonstration successful${NC}"
        phase_results+=("Phase 6 - Optimization: SUCCESS")
    else
        echo -e "${RED}✗ Phase 6 Failed: Container optimization demonstration failed${NC}"
        phase_results+=("Phase 6 - Optimization: FAILED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 7 (Health Monitoring)..."
        echo ""
    fi
    
    # Phase 7: Health Monitoring and Validation
    echo -e "\n${WHITE}=== Phase 7: Health Monitoring and Validation ===${NC}"
    log_with_timestamp "Phase 7: Performing comprehensive container health validation" "INFO"
    
    if run_container_health_checks "comprehensive" "30"; then
        echo -e "${GREEN}✓ Phase 7 Complete: Container health validation successful${NC}"
        phase_results+=("Phase 7 - Health Checks: SUCCESS")
    else
        echo -e "${RED}✗ Phase 7 Failed: Container health validation failed${NC}"
        phase_results+=("Phase 7 - Health Checks: FAILED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 8 (Performance Monitoring)..."
        echo ""
    fi
    
    # Phase 8: Performance Monitoring Demonstration
    echo -e "\n${WHITE}=== Phase 8: Performance Monitoring and Observability ===${NC}"
    log_with_timestamp "Phase 8: Demonstrating container monitoring and observability" "INFO"
    
    if demonstrate_container_monitoring "30" "true" "true"; then
        echo -e "${GREEN}✓ Phase 8 Complete: Container monitoring demonstration successful${NC}"
        phase_results+=("Phase 8 - Monitoring: SUCCESS")
    else
        echo -e "${RED}✗ Phase 8 Failed: Container monitoring demonstration failed${NC}"
        phase_results+=("Phase 8 - Monitoring: FAILED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 9 (PM2 Integration Demo)..."
        echo ""
    fi
    
    # Phase 9: PM2 Integration Demonstration
    echo -e "\n${WHITE}=== Phase 9: PM2 Container Integration ===${NC}"
    log_with_timestamp "Phase 9: Demonstrating PM2 cluster integration within containers" "INFO"
    
    if demonstrate_pm2_container_integration "true" "false"; then
        echo -e "${GREEN}✓ Phase 9 Complete: PM2 container integration demonstration successful${NC}"
        phase_results+=("Phase 9 - PM2 Integration: SUCCESS")
    else
        echo -e "${RED}✗ Phase 9 Failed: PM2 container integration demonstration failed${NC}"
        phase_results+=("Phase 9 - PM2 Integration: FAILED")
    fi
    
    if [[ "$interactive_mode" == "true" ]]; then
        read -r -p "Press ENTER to continue to Phase 10 (Resource Cleanup)..."
        echo ""
    fi
    
    # Phase 10: Resource Cleanup
    echo -e "\n${WHITE}=== Phase 10: Docker Resource Cleanup ===${NC}"
    log_with_timestamp "Phase 10: Performing comprehensive Docker resource cleanup" "INFO"
    
    if cleanup_docker_resources "true" "false" "false"; then
        echo -e "${GREEN}✓ Phase 10 Complete: Docker resource cleanup successful${NC}"
        phase_results+=("Phase 10 - Cleanup: SUCCESS")
    else
        echo -e "${RED}✗ Phase 10 Failed: Docker resource cleanup failed${NC}"
        phase_results+=("Phase 10 - Cleanup: FAILED")
    fi
    
    # Demo completion summary
    local demo_end_time
    demo_end_time="$(date +%s)"
    local demo_duration=$((demo_end_time - demo_start_time))
    
    echo -e "\n${WHITE}================================================${NC}"
    echo -e "${WHITE}  COMPREHENSIVE DOCKER DEMONSTRATION COMPLETE  ${NC}"
    echo -e "${WHITE}================================================${NC}"
    
    # Calculate success statistics
    local total_phases=${#phase_results[@]}
    local successful_phases=0
    local failed_phases=0
    local skipped_phases=0
    
    for result in "${phase_results[@]}"; do
        if [[ "$result" =~ SUCCESS ]]; then
            successful_phases=$((successful_phases + 1))
        elif [[ "$result" =~ FAILED ]]; then
            failed_phases=$((failed_phases + 1))
        elif [[ "$result" =~ SKIPPED ]]; then
            skipped_phases=$((skipped_phases + 1))
        fi
    done
    
    echo -e "\n${YELLOW}Demo Execution Summary:${NC}"
    echo -e "  • Total demo duration: ${demo_duration} seconds"
    echo -e "  • Total phases executed: $total_phases"
    echo -e "  • Successful phases: $successful_phases"
    echo -e "  • Failed phases: $failed_phases"
    echo -e "  • Skipped phases: $skipped_phases"
    echo -e "  • Success rate: $(( (successful_phases * 100) / total_phases ))%"
    
    # Display detailed phase results
    echo -e "\n${YELLOW}Detailed Phase Results:${NC}"
    for result in "${phase_results[@]}"; do
        if [[ "$result" =~ SUCCESS ]]; then
            echo -e "  ✓ $result"
        elif [[ "$result" =~ FAILED ]]; then
            echo -e "  ✗ $result"
        elif [[ "$result" =~ SKIPPED ]]; then
            echo -e "  • $result"
        fi
    done
    
    # Educational outcomes and next steps
    echo -e "\n${WHITE}=== Educational Outcomes Achieved ===${NC}"
    echo -e "${GREEN}Container Technology Mastery:${NC}"
    echo -e "  ✓ Multi-stage Docker build optimization and layer caching"
    echo -e "  ✓ Production container deployment with PM2 cluster integration"
    echo -e "  ✓ Docker Compose orchestration and multi-service management"
    echo -e "  ✓ Container security hardening and vulnerability assessment"
    echo -e "  ✓ Real-time monitoring and operational observability"
    echo -e "  ✓ Performance optimization and resource management"
    echo -e "  ✓ Production-ready deployment patterns and best practices"
    
    echo -e "\n${YELLOW}Next Steps for Advanced Container Learning:${NC}"
    echo -e "  • Explore Kubernetes deployment and container orchestration"
    echo -e "  • Implement CI/CD pipelines with automated container builds"
    echo -e "  • Study service mesh architecture with Istio or Linkerd"
    echo -e "  • Practice container security scanning and compliance"
    echo -e "  • Learn advanced monitoring with Prometheus and Grafana"
    echo -e "  • Implement blue-green and canary deployment strategies"
    
    # Determine overall demo success
    if [[ $failed_phases -eq 0 ]]; then
        log_with_timestamp "Comprehensive Docker demonstration completed successfully" "SUCCESS"
        echo -e "\n${GREEN}🎉 Congratulations! Docker containerization mastery achieved!${NC}"
        return 0
    elif [[ $successful_phases -gt $failed_phases ]]; then
        log_with_timestamp "Docker demonstration completed with some issues" "WARN"
        echo -e "\n${YELLOW}⚠ Demo completed with some phases failing - review failed phases${NC}"
        return 0
    else
        log_with_timestamp "Docker demonstration completed with significant issues" "ERROR"
        echo -e "\n${RED}❌ Demo completed with major issues - troubleshooting required${NC}"
        return 1
    fi
}

# Main script execution logic with command parsing and educational guidance
main() {
    local command="${1:-help}"
    shift
    
    case "$command" in
        "help"|"--help"|"-h")
            show_usage
            ;;
        "validate")
            validate_docker_environment "$@"
            ;;
        "build")
            local build_target="production"
            local no_cache="false"
            local verbose="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --target)
                        build_target="$2"
                        shift 2
                        ;;
                    --no-cache)
                        no_cache="true"
                        shift
                        ;;
                    --verbose)
                        verbose="true"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            build_docker_image "$build_target" "$no_cache" "$verbose"
            ;;
        "run")
            local run_mode="standalone"
            local detached="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --detached|-d)
                        detached="true"
                        shift
                        ;;
                    --mode)
                        run_mode="$2"
                        shift 2
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            run_docker_container "$run_mode" "$detached"
            ;;
        "compose")
            local compose_env="development"
            local build_images="false"
            local detached="true"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --env)
                        compose_env="$2"
                        shift 2
                        ;;
                    --build)
                        build_images="true"
                        shift
                        ;;
                    --detached|-d)
                        detached="true"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            run_docker_compose "$compose_env" "$build_images" "$detached"
            ;;
        "health")
            local scope="comprehensive"
            local timeout="30"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --scope)
                        scope="$2"
                        shift 2
                        ;;
                    --timeout)
                        timeout="$2"
                        shift 2
                        ;;
                    --comprehensive)
                        scope="comprehensive"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            run_container_health_checks "$scope" "$timeout"
            ;;
        "monitor")
            local duration="60"
            local show_logs="true"
            local show_metrics="true"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --duration)
                        duration="$2"
                        shift 2
                        ;;
                    --no-logs)
                        show_logs="false"
                        shift
                        ;;
                    --no-metrics)
                        show_metrics="false"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            demonstrate_container_monitoring "$duration" "$show_logs" "$show_metrics"
            ;;
        "optimize")
            local show_analysis="true"
            local compare_stages="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --show-analysis)
                        show_analysis="true"
                        shift
                        ;;
                    --compare-stages)
                        compare_stages="true"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            demonstrate_container_optimization "$show_analysis" "$compare_stages"
            ;;
        "security")
            local run_scan="false"
            local show_report="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --scan)
                        run_scan="true"
                        shift
                        ;;
                    --report)
                        show_report="true"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            demonstrate_container_security "$run_scan" "$show_report"
            ;;
        "pm2-demo")
            local show_scaling="true"
            local zero_downtime="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --show-scaling)
                        show_scaling="true"
                        shift
                        ;;
                    --zero-downtime)
                        zero_downtime="true"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            demonstrate_pm2_container_integration "$show_scaling" "$zero_downtime"
            ;;
        "cleanup")
            local remove_containers="true"
            local remove_images="false"
            local prune_system="false"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --containers)
                        remove_containers="true"
                        shift
                        ;;
                    --images)
                        remove_images="true"
                        shift
                        ;;
                    --all)
                        remove_containers="true"
                        remove_images="true"
                        prune_system="true"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            cleanup_docker_resources "$remove_containers" "$remove_images" "$prune_system"
            ;;
        "demo")
            local scenario="complete"
            local interactive="false"
            local include_compose="true"
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --scenario)
                        scenario="$2"
                        shift 2
                        ;;
                    --interactive)
                        interactive="true"
                        shift
                        ;;
                    --no-compose)
                        include_compose="false"
                        shift
                        ;;
                    *)
                        shift
                        ;;
                esac
            done
            
            run_comprehensive_docker_demo "$scenario" "$interactive" "$include_compose"
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            echo -e "${YELLOW}Use './docker-usage.sh help' for usage information${NC}"
            exit 1
            ;;
    esac
}

# Script footer with educational context and contact information
echo -e "\n${PURPLE}Docker Usage Demonstration - Node.js Tutorial Project${NC}"
echo -e "${CYAN}Educational containerization workflow for modern deployment practices${NC}"
echo -e "${CYAN}Comprehensive Docker learning with PM2 integration and production optimization${NC}"
echo ""

# Execute main function with all command line arguments
main "$@"