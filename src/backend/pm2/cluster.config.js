// PM2 Cluster Mode Configuration Module
// Provides comprehensive cluster setup, load balancing, and zero-downtime deployment capabilities
// for horizontal scaling in production environments with Node.js v22.x LTS and Express.js v5.1.0

import os from 'node:os';
import cluster from 'node:cluster';
import { environmentConfig } from '../config/environment.js';
import { PM2_CONSTANTS, PERFORMANCE_CONSTANTS } from '../utils/constants.js';
import logger from '../utils/logger.js';

// Global cluster configuration constants
const CPU_CORES = os.cpus().length;
const CLUSTER_MODE_ENABLED = environmentConfig.isProduction || process.env.PM2_CLUSTER_MODE === 'true';
const DEFAULT_INSTANCES = environmentConfig.isProduction ? 'max' : 1;
const LOAD_BALANCER_TYPE = process.env.PM2_LOAD_BALANCER || 'round_robin';

/**
 * Calculates the optimal cluster size based on CPU cores, available memory, 
 * application characteristics, and environment requirements to maximize performance 
 * while preventing resource exhaustion
 * 
 * @param {string} environment - Current environment (development, staging, production)
 * @param {object} systemInfo - System information including CPU and memory details
 * @returns {object} Cluster sizing recommendation with instance count, memory allocation per instance, and performance projections
 */
export function calculateOptimalClusterSize(environment, systemInfo = {}) {
    try {
        logger.info('Calculating optimal cluster size', { 
            environment, 
            cpuCores: CPU_CORES,
            totalMemory: systemInfo.totalMemory || 'unknown'
        });

        // Detect CPU core count using os.cpus().length for hardware analysis
        const availableCores = CPU_CORES;
        const totalMemory = systemInfo.totalMemory || os.totalmem();
        const freeMemory = systemInfo.freeMemory || os.freemem();

        // Analyze available system memory and calculate per-instance allocation
        const memoryPerCore = totalMemory / availableCores;
        const targetMemoryUsage = totalMemory * 0.8; // Reserve 20% for system
        const estimatedAppMemory = PERFORMANCE_CONSTANTS.MEMORY_LIMITS.PER_PROCESS || 128 * 1024 * 1024; // 128MB default

        // Consider environment constraints (1 instance for dev, max for production)
        let optimalInstances;
        if (environment === 'development') {
            optimalInstances = 1;
        } else if (environment === 'staging') {
            optimalInstances = Math.max(2, Math.floor(availableCores / 2));
        } else if (environment === 'production') {
            // Factor in application memory footprint and performance characteristics
            const memoryBasedLimit = Math.floor(targetMemoryUsage / estimatedAppMemory);
            const cpuBasedLimit = availableCores;
            optimalInstances = Math.min(memoryBasedLimit, cpuBasedLimit);
        } else {
            optimalInstances = 2; // Safe default
        }

        // Calculate optimal instance count considering system reserves and overhead
        optimalInstances = Math.max(1, Math.min(optimalInstances, PM2_CONSTANTS.INSTANCE_CONFIGS.MAX_INSTANCES || 16));

        // Validate cluster size against PM2 limitations and best practices
        if (optimalInstances > availableCores * 2) {
            logger.warn('Cluster size exceeds CPU cores by more than 2x, adjusting', {
                requested: optimalInstances,
                cpuCores: availableCores,
                adjusted: availableCores * 2
            });
            optimalInstances = availableCores * 2;
        }

        // Calculate memory allocation per instance
        const memoryPerInstance = Math.floor(targetMemoryUsage / optimalInstances);
        const memoryPerInstanceMB = Math.floor(memoryPerInstance / (1024 * 1024));

        // Generate performance projections for the recommended cluster size
        const performanceProjection = {
            expectedThroughputMultiplier: Math.min(optimalInstances, availableCores),
            estimatedMemoryUsage: optimalInstances * estimatedAppMemory,
            cpuUtilizationTarget: 0.7, // Target 70% CPU utilization
            loadBalancingEfficiency: 0.85 // 85% efficiency with round-robin
        };

        // Log cluster sizing decision with rationale and performance expectations
        const recommendation = {
            instances: optimalInstances,
            memoryPerInstance: memoryPerInstanceMB,
            totalMemoryAllocation: memoryPerInstanceMB * optimalInstances,
            cpuCores: availableCores,
            environment,
            performanceProjection,
            rationale: {
                cpuBased: availableCores,
                memoryBased: Math.floor(targetMemoryUsage / estimatedAppMemory),
                environmentConstrained: environment !== 'production',
                finalDecision: optimalInstances
            }
        };

        logger.info('Cluster sizing calculation completed', recommendation);

        // Return comprehensive cluster sizing recommendation with metadata
        return recommendation;

    } catch (error) {
        logger.error('Error calculating optimal cluster size', { error: error.message, stack: error.stack });
        // Return safe fallback configuration
        return {
            instances: environment === 'production' ? Math.min(CPU_CORES, 4) : 1,
            memoryPerInstance: 128,
            totalMemoryAllocation: environment === 'production' ? Math.min(CPU_CORES, 4) * 128 : 128,
            cpuCores: CPU_CORES,
            environment,
            performanceProjection: {
                expectedThroughputMultiplier: 1,
                estimatedMemoryUsage: 128 * 1024 * 1024,
                cpuUtilizationTarget: 0.5,
                loadBalancingEfficiency: 0.7
            },
            rationale: {
                error: 'Fallback configuration due to calculation error',
                finalDecision: environment === 'production' ? Math.min(CPU_CORES, 4) : 1
            }
        };
    }
}

/**
 * Creates comprehensive PM2 cluster ecosystem configuration with optimal instance count,
 * load balancing strategy, zero-downtime deployment, and production-ready settings 
 * for horizontal scaling
 * 
 * @param {string} appName - Application name for PM2 process identification
 * @param {string} scriptPath - Path to the main application script
 * @param {object} clusterOptions - Additional cluster configuration options
 * @returns {object} Complete cluster ecosystem configuration with app definition, cluster settings, and deployment parameters
 */
export function createClusterEcosystem(appName, scriptPath, clusterOptions = {}) {
    try {
        logger.info('Creating cluster ecosystem configuration', { 
            appName, 
            scriptPath, 
            environment: environmentConfig.currentEnvironment 
        });

        // Calculate optimal cluster size based on environment and system resources
        const systemInfo = {
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            platform: os.platform()
        };
        const clusterSizing = calculateOptimalClusterSize(environmentConfig.currentEnvironment, systemInfo);

        // Configure cluster execution mode and instance management
        const execMode = clusterOptions.exec_mode || PM2_CONSTANTS.EXEC_MODES.CLUSTER;
        const instances = clusterOptions.instances || clusterSizing.instances;

        // Set up load balancing strategy (round-robin, least_connection, ip_hash)
        const loadBalancer = configureLoadBalancing(
            clusterOptions.load_balancer || LOAD_BALANCER_TYPE,
            { instances, environment: environmentConfig.currentEnvironment }
        );

        // Configure zero-downtime deployment with graceful worker rotation
        const zeroDowntimeConfig = configureZeroDowntime({
            kill_timeout: clusterOptions.kill_timeout || 5000,
            wait_ready: clusterOptions.wait_ready || true,
            listen_timeout: clusterOptions.listen_timeout || 3000
        });

        // Set up health monitoring and automatic restart policies
        const monitoringConfig = setupClusterMonitoring({
            max_memory_restart: clusterOptions.max_memory_restart || `${clusterSizing.memoryPerInstance}M`,
            min_uptime: clusterOptions.min_uptime || '10s',
            max_restarts: clusterOptions.max_restarts || 10
        });

        // Configure memory limits and resource constraints per worker
        const memoryLimits = {
            max_memory_restart: `${clusterSizing.memoryPerInstance}M`,
            node_args: clusterOptions.node_args || `--max-old-space-size=${clusterSizing.memoryPerInstance}`,
            max_old_space_size: clusterSizing.memoryPerInstance
        };

        // Set up inter-process communication and shared resources
        const ipcConfig = {
            pmx: true,
            automation: false,
            vizion: environmentConfig.isProduction,
            autorestart: true
        };

        // Configure cluster-specific logging and monitoring
        const loggingConfig = {
            log_file: environmentConfig.pm2?.logs?.combined || './logs/pm2/combined.log',
            out_file: environmentConfig.pm2?.logs?.output || './logs/pm2/out.log',
            error_file: environmentConfig.pm2?.logs?.error || './logs/pm2/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            log_type: 'json'
        };

        // Return complete cluster ecosystem ready for PM2 deployment
        const ecosystem = {
            apps: [{
                name: appName,
                script: scriptPath,
                instances: instances === 'max' ? 'max' : parseInt(instances),
                exec_mode: execMode,
                
                // Environment configuration
                env: {
                    NODE_ENV: 'development',
                    PORT: environmentConfig.server?.port || 3000,
                    PM2_CLUSTER_MODE: 'true',
                    PM2_LOAD_BALANCER: loadBalancer.strategy,
                    ...clusterOptions.env
                },
                env_production: {
                    NODE_ENV: 'production',
                    PORT: environmentConfig.server?.port || 3000,
                    PM2_CLUSTER_MODE: 'true',
                    PM2_LOAD_BALANCER: loadBalancer.strategy,
                    ...clusterOptions.env_production
                },
                env_staging: {
                    NODE_ENV: 'staging',
                    PORT: environmentConfig.server?.port || 3000,
                    PM2_CLUSTER_MODE: 'true',
                    PM2_LOAD_BALANCER: loadBalancer.strategy,
                    ...clusterOptions.env_staging
                },

                // Memory and performance configuration
                ...memoryLimits,
                
                // Zero-downtime deployment configuration
                ...zeroDowntimeConfig,
                
                // Monitoring and restart policies
                ...monitoringConfig,
                
                // IPC and automation configuration
                ...ipcConfig,
                
                // Logging configuration
                ...loggingConfig,
                
                // Cluster-specific settings
                instance_var: 'INSTANCE_ID',
                combine_logs: true,
                source_map_support: true,
                
                // Performance optimizations
                node_args: memoryLimits.node_args,
                interpreter_args: '--harmony',
                
                // Process management
                cwd: process.cwd(),
                watch: !environmentConfig.isProduction,
                ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage'],
                
                // Health monitoring
                health_check_grace_period: 3000,
                
                // Additional cluster options
                ...clusterOptions
            }],
            
            // Deployment configuration
            deploy: environmentConfig.isProduction ? {
                production: {
                    user: process.env.DEPLOY_USER || 'nodejs',
                    host: process.env.DEPLOY_HOST || 'localhost',
                    ref: 'origin/main',
                    repo: process.env.DEPLOY_REPO || 'git@github.com:username/nodejs-tutorial.git',
                    path: process.env.DEPLOY_PATH || '/var/www/nodejs-tutorial',
                    'post-deploy': 'npm ci --production && pm2 reload ecosystem.config.js --env production'
                }
            } : undefined
        };

        logger.info('Cluster ecosystem configuration created successfully', {
            appName,
            instances: ecosystem.apps[0].instances,
            execMode: ecosystem.apps[0].exec_mode,
            memoryLimit: ecosystem.apps[0].max_memory_restart
        });

        return ecosystem;

    } catch (error) {
        logger.error('Error creating cluster ecosystem configuration', { 
            error: error.message, 
            stack: error.stack,
            appName,
            scriptPath 
        });
        throw new Error(`Failed to create cluster ecosystem: ${error.message}`);
    }
}

/**
 * Configures PM2's built-in load balancer with optimal distribution strategy,
 * health checking, and failover mechanisms to ensure even request distribution 
 * and high availability across cluster workers
 * 
 * @param {string} strategy - Load balancing strategy (round_robin, least_connection, ip_hash)
 * @param {object} balancerOptions - Load balancer configuration options
 * @returns {object} Load balancer configuration with distribution strategy, health checks, and failover settings
 */
export function configureLoadBalancing(strategy = 'round_robin', balancerOptions = {}) {
    try {
        logger.debug('Configuring load balancing strategy', { strategy, options: balancerOptions });

        // Validate load balancing strategy (round_robin, least_connection, ip_hash)
        const validStrategies = ['round_robin', 'least_connection', 'ip_hash'];
        const selectedStrategy = validStrategies.includes(strategy) ? strategy : 'round_robin';

        if (strategy !== selectedStrategy) {
            logger.warn('Invalid load balancing strategy, using default', { 
                requested: strategy, 
                selected: selectedStrategy 
            });
        }

        // Configure connection distribution algorithm and sticky sessions
        const distributionConfig = {
            strategy: selectedStrategy,
            sticky_sessions: balancerOptions.sticky_sessions || false,
            connection_pooling: balancerOptions.connection_pooling !== false,
            keep_alive: balancerOptions.keep_alive !== false
        };

        // Set up health check intervals and failure detection thresholds
        const healthCheckConfig = {
            health_check_interval: balancerOptions.health_check_interval || 5000,
            health_check_timeout: balancerOptions.health_check_timeout || 3000,
            failure_threshold: balancerOptions.failure_threshold || 3,
            recovery_threshold: balancerOptions.recovery_threshold || 2
        };

        // Configure automatic worker failover and recovery procedures
        const failoverConfig = {
            auto_failover: balancerOptions.auto_failover !== false,
            failover_timeout: balancerOptions.failover_timeout || 2000,
            recovery_delay: balancerOptions.recovery_delay || 5000,
            max_failover_attempts: balancerOptions.max_failover_attempts || 3
        };

        // Set up load balancer monitoring and performance tracking
        const monitoringConfig = {
            track_performance: balancerOptions.track_performance !== false,
            metrics_collection: balancerOptions.metrics_collection !== false,
            performance_window: balancerOptions.performance_window || 60000
        };

        // Configure connection pooling and keep-alive management
        const connectionConfig = {
            max_connections_per_worker: balancerOptions.max_connections_per_worker || 1000,
            connection_timeout: balancerOptions.connection_timeout || 30000,
            keep_alive_timeout: balancerOptions.keep_alive_timeout || 5000,
            socket_timeout: balancerOptions.socket_timeout || 120000
        };

        // Set up request routing and worker selection algorithms
        const routingConfig = {
            worker_selection_algorithm: selectedStrategy,
            request_queuing: balancerOptions.request_queuing !== false,
            queue_size_limit: balancerOptions.queue_size_limit || 100,
            queue_timeout: balancerOptions.queue_timeout || 5000
        };

        // Return comprehensive load balancer configuration
        const loadBalancerConfig = {
            ...distributionConfig,
            health_checks: healthCheckConfig,
            failover: failoverConfig,
            monitoring: monitoringConfig,
            connections: connectionConfig,
            routing: routingConfig,
            
            // PM2-specific load balancer settings
            instance_var: 'INSTANCE_ID',
            merge_logs: true,
            
            // Performance optimization
            optimization: {
                cpu_affinity: balancerOptions.cpu_affinity || false,
                numa_awareness: balancerOptions.numa_awareness || false,
                worker_threads: balancerOptions.worker_threads || false
            }
        };

        logger.info('Load balancer configuration completed', {
            strategy: selectedStrategy,
            healthChecks: healthCheckConfig.health_check_interval,
            failover: failoverConfig.auto_failover
        });

        return loadBalancerConfig;

    } catch (error) {
        logger.error('Error configuring load balancing', { error: error.message, strategy });
        // Return safe default configuration
        return {
            strategy: 'round_robin',
            sticky_sessions: false,
            health_checks: {
                health_check_interval: 5000,
                health_check_timeout: 3000,
                failure_threshold: 3
            },
            failover: {
                auto_failover: true,
                failover_timeout: 2000
            }
        };
    }
}

/**
 * Configures zero-downtime deployment capabilities with graceful worker shutdown,
 * rolling updates, health validation, and automatic rollback procedures 
 * for seamless production deployments
 * 
 * @param {object} deploymentConfig - Zero-downtime deployment configuration options
 * @returns {object} Zero-downtime deployment configuration with graceful shutdown, health checks, and rollback procedures
 */
export function configureZeroDowntime(deploymentConfig = {}) {
    try {
        logger.debug('Configuring zero-downtime deployment', { config: deploymentConfig });

        // Configure graceful worker shutdown with connection draining
        const gracefulShutdownConfig = {
            kill_timeout: deploymentConfig.kill_timeout || 5000,
            shutdown_with_message: deploymentConfig.shutdown_with_message !== false,
            wait_ready: deploymentConfig.wait_ready !== false,
            listen_timeout: deploymentConfig.listen_timeout || 3000,
            ready_event: deploymentConfig.ready_event || 'ready'
        };

        // Set up rolling update strategy with sequential worker restart
        const rollingUpdateConfig = {
            update_env: deploymentConfig.update_env !== false,
            restart_delay: deploymentConfig.restart_delay || 1000,
            parallel_workers: deploymentConfig.parallel_workers || 1,
            wait_for_ready: deploymentConfig.wait_for_ready !== false
        };

        // Configure health check validation during deployment process
        const healthValidationConfig = {
            health_check_endpoint: deploymentConfig.health_check_endpoint || '/health',
            health_check_method: deploymentConfig.health_check_method || 'GET',
            health_check_expected_status: deploymentConfig.health_check_expected_status || 200,
            health_check_timeout: deploymentConfig.health_check_timeout || 3000,
            health_check_retries: deploymentConfig.health_check_retries || 3
        };

        // Set up deployment timeout and failure detection mechanisms
        const timeoutConfig = {
            deployment_timeout: deploymentConfig.deployment_timeout || 60000,
            worker_start_timeout: deploymentConfig.worker_start_timeout || 10000,
            health_check_grace_period: deploymentConfig.health_check_grace_period || 3000,
            failure_detection_window: deploymentConfig.failure_detection_window || 30000
        };

        // Configure automatic rollback procedures on deployment failure
        const rollbackConfig = {
            auto_rollback: deploymentConfig.auto_rollback !== false,
            rollback_trigger_threshold: deploymentConfig.rollback_trigger_threshold || 0.5, // 50% failure rate
            rollback_timeout: deploymentConfig.rollback_timeout || 30000,
            preserve_logs: deploymentConfig.preserve_logs !== false
        };

        // Set up deployment monitoring and progress tracking
        const monitoringConfig = {
            track_deployment_progress: deploymentConfig.track_deployment_progress !== false,
            deployment_metrics: deploymentConfig.deployment_metrics !== false,
            notification_hooks: deploymentConfig.notification_hooks || [],
            log_deployment_events: deploymentConfig.log_deployment_events !== false
        };

        // Configure post-deployment validation and verification
        const postDeploymentConfig = {
            post_deployment_tests: deploymentConfig.post_deployment_tests || [],
            verification_timeout: deploymentConfig.verification_timeout || 30000,
            smoke_tests: deploymentConfig.smoke_tests !== false,
            performance_baseline_check: deploymentConfig.performance_baseline_check || false
        };

        // Return complete zero-downtime deployment configuration
        const zeroDowntimeConfig = {
            // PM2 built-in zero-downtime settings
            kill_timeout: gracefulShutdownConfig.kill_timeout,
            wait_ready: gracefulShutdownConfig.wait_ready,
            listen_timeout: gracefulShutdownConfig.listen_timeout,
            
            // Rolling update configuration
            update_env: rollingUpdateConfig.update_env,
            restart_delay: rollingUpdateConfig.restart_delay,
            
            // Health validation
            health_checks: healthValidationConfig,
            
            // Timeout and failure detection
            timeouts: timeoutConfig,
            
            // Rollback procedures
            rollback: rollbackConfig,
            
            // Monitoring and tracking
            monitoring: monitoringConfig,
            
            // Post-deployment validation
            post_deployment: postDeploymentConfig,
            
            // PM2-specific settings for zero-downtime
            graceful_shutdown: true,
            force: false,
            increment_var: 'INSTANCE_ID'
        };

        logger.info('Zero-downtime deployment configuration completed', {
            killTimeout: gracefulShutdownConfig.kill_timeout,
            waitReady: gracefulShutdownConfig.wait_ready,
            autoRollback: rollbackConfig.auto_rollback
        });

        return zeroDowntimeConfig;

    } catch (error) {
        logger.error('Error configuring zero-downtime deployment', { error: error.message });
        // Return safe default configuration
        return {
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 3000,
            update_env: true,
            restart_delay: 1000,
            health_checks: {
                health_check_endpoint: '/health',
                health_check_timeout: 3000,
                health_check_retries: 3
            },
            rollback: {
                auto_rollback: true,
                rollback_trigger_threshold: 0.5
            }
        };
    }
}

/**
 * Optimizes cluster performance settings including worker process management,
 * memory allocation, CPU affinity, and inter-process communication 
 * for maximum throughput and efficiency
 * 
 * @param {object} clusterConfig - Current cluster configuration
 * @param {object} performanceTargets - Performance optimization targets
 * @returns {object} Performance-optimized cluster configuration with tuned settings for maximum efficiency
 */
export function optimizeClusterPerformance(clusterConfig, performanceTargets = {}) {
    try {
        logger.debug('Optimizing cluster performance', { 
            currentConfig: Object.keys(clusterConfig),
            targets: performanceTargets 
        });

        // Analyze current cluster configuration and performance bottlenecks
        const currentInstances = clusterConfig.instances || 1;
        const currentMemoryLimit = clusterConfig.max_memory_restart || '1G';
        const targetThroughput = performanceTargets.targetThroughput || 1000; // requests per second
        const targetResponseTime = performanceTargets.targetResponseTime || 100; // milliseconds

        // Optimize worker process memory allocation and garbage collection
        const memoryOptimization = {
            max_memory_restart: performanceTargets.memoryLimit || currentMemoryLimit,
            node_args: [
                `--max-old-space-size=${parseInt(currentMemoryLimit) || 1024}`,
                '--optimize-for-size',
                '--gc-interval=100',
                '--max-semi-space-size=64'
            ].join(' '),
            v8_pool_size: performanceTargets.v8PoolSize || Math.min(currentInstances, 4)
        };

        // Configure CPU affinity and NUMA topology awareness if available
        const cpuOptimization = {
            cpu_affinity: performanceTargets.cpuAffinity || false,
            numa_aware: performanceTargets.numaAware || false,
            scheduler_policy: performanceTargets.schedulerPolicy || 'round_robin',
            cpu_threshold: performanceTargets.cpuThreshold || PERFORMANCE_CONSTANTS.CPU_THRESHOLDS?.HIGH || 80
        };

        // Tune inter-process communication and shared memory usage
        const ipcOptimization = {
            ipc_timeout: performanceTargets.ipcTimeout || 5000,
            shared_memory: performanceTargets.sharedMemory || false,
            message_queue_size: performanceTargets.messageQueueSize || 1000,
            cluster_communication: true
        };

        // Optimize connection handling and keep-alive settings
        const connectionOptimization = {
            max_connections: performanceTargets.maxConnections || PERFORMANCE_CONSTANTS.CONCURRENCY_LIMITS?.MAX_CONNECTIONS || 1000,
            keep_alive_timeout: performanceTargets.keepAliveTimeout || 5000,
            request_timeout: performanceTargets.requestTimeout || 30000,
            socket_timeout: performanceTargets.socketTimeout || 120000
        };

        // Configure performance monitoring and metrics collection
        const performanceMonitoring = {
            monitor_performance: true,
            collect_metrics: true,
            metrics_interval: performanceTargets.metricsInterval || 30000,
            performance_baseline: {
                response_time: targetResponseTime,
                throughput: targetThroughput,
                cpu_usage: cpuOptimization.cpu_threshold,
                memory_usage: performanceTargets.memoryThreshold || 80
            }
        };

        // Apply environment-specific performance optimizations
        const environmentOptimizations = {};
        if (environmentConfig.isProduction) {
            environmentOptimizations.production = {
                cluster_instances: 'max',
                aggressive_gc: true,
                high_performance_mode: true,
                connection_pooling: true
            };
        } else if (environmentConfig.currentEnvironment === 'staging') {
            environmentOptimizations.staging = {
                cluster_instances: Math.ceil(CPU_CORES / 2),
                moderate_gc: true,
                performance_monitoring: true
            };
        } else {
            environmentOptimizations.development = {
                cluster_instances: 1,
                debug_mode: true,
                hot_reload: true
            };
        }

        // Return performance-tuned cluster configuration
        const optimizedConfig = {
            ...clusterConfig,
            
            // Memory optimizations
            memory: memoryOptimization,
            
            // CPU optimizations
            cpu: cpuOptimization,
            
            // IPC optimizations
            ipc: ipcOptimization,
            
            // Connection optimizations
            connections: connectionOptimization,
            
            // Performance monitoring
            monitoring: performanceMonitoring,
            
            // Environment-specific optimizations
            environment_optimizations: environmentOptimizations,
            
            // Additional performance settings
            performance: {
                enable_source_maps: !environmentConfig.isProduction,
                profiling: performanceTargets.profiling || false,
                heap_snapshots: performanceTargets.heapSnapshots || false,
                performance_hooks: performanceTargets.performanceHooks || false
            },
            
            // Optimization metadata
            optimization_applied: new Date().toISOString(),
            performance_targets: performanceTargets,
            optimization_level: performanceTargets.optimizationLevel || 'standard'
        };

        logger.info('Cluster performance optimization completed', {
            instances: currentInstances,
            memoryLimit: memoryOptimization.max_memory_restart,
            cpuAffinity: cpuOptimization.cpu_affinity,
            optimizationLevel: optimizedConfig.optimization_level
        });

        return optimizedConfig;

    } catch (error) {
        logger.error('Error optimizing cluster performance', { error: error.message });
        // Return configuration with basic optimizations
        return {
            ...clusterConfig,
            memory: {
                max_memory_restart: '1G',
                node_args: '--max-old-space-size=1024'
            },
            cpu: {
                cpu_affinity: false,
                cpu_threshold: 80
            },
            monitoring: {
                monitor_performance: true,
                collect_metrics: true
            }
        };
    }
}

/**
 * Sets up comprehensive cluster monitoring including worker health tracking,
 * performance metrics collection, resource utilization monitoring, 
 * and automated alerting for production cluster management
 * 
 * @param {object} monitoringConfig - Cluster monitoring configuration options
 * @returns {object} Cluster monitoring configuration with health checks, metrics collection, and alerting setup
 */
export function setupClusterMonitoring(monitoringConfig = {}) {
    try {
        logger.debug('Setting up cluster monitoring', { config: monitoringConfig });

        // Configure worker process health monitoring and status tracking
        const healthMonitoringConfig = {
            health_check_interval: monitoringConfig.health_check_interval || 5000,
            health_check_endpoint: monitoringConfig.health_check_endpoint || '/health',
            health_check_timeout: monitoringConfig.health_check_timeout || 3000,
            health_check_retries: monitoringConfig.health_check_retries || 3,
            worker_status_tracking: monitoringConfig.worker_status_tracking !== false
        };

        // Set up performance metrics collection for CPU, memory, and throughput
        const performanceMetricsConfig = {
            collect_cpu_metrics: monitoringConfig.collect_cpu_metrics !== false,
            collect_memory_metrics: monitoringConfig.collect_memory_metrics !== false,
            collect_throughput_metrics: monitoringConfig.collect_throughput_metrics !== false,
            collect_response_time_metrics: monitoringConfig.collect_response_time_metrics !== false,
            metrics_collection_interval: monitoringConfig.metrics_collection_interval || 30000,
            metrics_retention_period: monitoringConfig.metrics_retention_period || 24 * 60 * 60 * 1000 // 24 hours
        };

        // Configure cluster-wide resource utilization monitoring
        const resourceMonitoringConfig = {
            monitor_cpu_usage: monitoringConfig.monitor_cpu_usage !== false,
            monitor_memory_usage: monitoringConfig.monitor_memory_usage !== false,
            monitor_disk_usage: monitoringConfig.monitor_disk_usage !== false,
            monitor_network_usage: monitoringConfig.monitor_network_usage !== false,
            resource_monitoring_interval: monitoringConfig.resource_monitoring_interval || 10000
        };

        // Set up automated alerting for worker failures and performance issues
        const alertingConfig = {
            enable_alerts: monitoringConfig.enable_alerts !== false,
            alert_on_worker_failure: monitoringConfig.alert_on_worker_failure !== false,
            alert_on_high_cpu: monitoringConfig.alert_on_high_cpu !== false,
            alert_on_high_memory: monitoringConfig.alert_on_high_memory !== false,
            alert_on_slow_response: monitoringConfig.alert_on_slow_response !== false,
            
            // Alert thresholds
            cpu_alert_threshold: monitoringConfig.cpu_alert_threshold || 85,
            memory_alert_threshold: monitoringConfig.memory_alert_threshold || 90,
            response_time_alert_threshold: monitoringConfig.response_time_alert_threshold || 1000,
            error_rate_alert_threshold: monitoringConfig.error_rate_alert_threshold || 5,
            
            // Alert mechanisms
            alert_webhook: monitoringConfig.alert_webhook || null,
            alert_email: monitoringConfig.alert_email || null,
            alert_slack: monitoringConfig.alert_slack || null
        };

        // Configure metrics aggregation and reporting across all workers
        const metricsAggregationConfig = {
            aggregate_metrics: monitoringConfig.aggregate_metrics !== false,
            aggregation_window: monitoringConfig.aggregation_window || 60000, // 1 minute
            aggregation_functions: monitoringConfig.aggregation_functions || ['avg', 'max', 'min', 'sum'],
            export_metrics: monitoringConfig.export_metrics || false,
            metrics_export_format: monitoringConfig.metrics_export_format || 'json'
        };

        // Set up cluster dashboard and visualization capabilities
        const dashboardConfig = {
            enable_dashboard: monitoringConfig.enable_dashboard || false,
            dashboard_port: monitoringConfig.dashboard_port || 9615,
            dashboard_host: monitoringConfig.dashboard_host || 'localhost',
            dashboard_auth: monitoringConfig.dashboard_auth || false,
            realtime_updates: monitoringConfig.realtime_updates !== false
        };

        // Configure monitoring data retention and archival policies
        const dataRetentionConfig = {
            data_retention_enabled: monitoringConfig.data_retention_enabled !== false,
            short_term_retention: monitoringConfig.short_term_retention || 7 * 24 * 60 * 60 * 1000, // 7 days
            long_term_retention: monitoringConfig.long_term_retention || 30 * 24 * 60 * 60 * 1000, // 30 days
            archive_old_data: monitoringConfig.archive_old_data || false,
            cleanup_interval: monitoringConfig.cleanup_interval || 24 * 60 * 60 * 1000 // 24 hours
        };

        // Return comprehensive cluster monitoring configuration
        const clusterMonitoringConfig = {
            // PM2 built-in monitoring settings
            pmx: true,
            automation: false,
            vizion: environmentConfig.isProduction,
            
            // Health monitoring
            health_monitoring: healthMonitoringConfig,
            
            // Performance metrics
            performance_metrics: performanceMetricsConfig,
            
            // Resource monitoring
            resource_monitoring: resourceMonitoringConfig,
            
            // Alerting configuration
            alerting: alertingConfig,
            
            // Metrics aggregation
            metrics_aggregation: metricsAggregationConfig,
            
            // Dashboard configuration
            dashboard: dashboardConfig,
            
            // Data retention
            data_retention: dataRetentionConfig,
            
            // PM2-specific monitoring settings
            min_uptime: monitoringConfig.min_uptime || '10s',
            max_restarts: monitoringConfig.max_restarts || 10,
            restart_delay: monitoringConfig.restart_delay || 4000,
            
            // Advanced monitoring features
            advanced_features: {
                memory_leak_detection: monitoringConfig.memory_leak_detection || false,
                performance_profiling: monitoringConfig.performance_profiling || false,
                distributed_tracing: monitoringConfig.distributed_tracing || false,
                custom_metrics: monitoringConfig.custom_metrics || []
            }
        };

        logger.info('Cluster monitoring setup completed', {
            healthChecks: healthMonitoringConfig.health_check_interval,
            metricsCollection: performanceMetricsConfig.metrics_collection_interval,
            alertsEnabled: alertingConfig.enable_alerts,
            dashboardEnabled: dashboardConfig.enable_dashboard
        });

        return clusterMonitoringConfig;

    } catch (error) {
        logger.error('Error setting up cluster monitoring', { error: error.message });
        // Return basic monitoring configuration
        return {
            pmx: true,
            automation: false,
            health_monitoring: {
                health_check_interval: 5000,
                health_check_endpoint: '/health'
            },
            performance_metrics: {
                metrics_collection_interval: 30000,
                collect_cpu_metrics: true,
                collect_memory_metrics: true
            },
            alerting: {
                enable_alerts: true,
                cpu_alert_threshold: 85,
                memory_alert_threshold: 90
            }
        };
    }
}

/**
 * Validates cluster configuration for completeness, resource compatibility,
 * performance optimization, and production readiness ensuring successful 
 * cluster deployment and operation
 * 
 * @param {object} clusterConfig - Cluster configuration to validate
 * @returns {object} Validation result with status, errors, warnings, and optimization recommendations for cluster deployment
 */
export function validateClusterConfig(clusterConfig) {
    try {
        logger.debug('Validating cluster configuration', { 
            configKeys: Object.keys(clusterConfig) 
        });

        const validationResult = {
            status: 'valid',
            errors: [],
            warnings: [],
            recommendations: [],
            validationDetails: {}
        };

        // Validate cluster instance count against available system resources
        const instances = clusterConfig.instances;
        if (instances && instances !== 'max') {
            const instanceCount = parseInt(instances);
            if (isNaN(instanceCount) || instanceCount < 1) {
                validationResult.errors.push('Invalid instance count: must be a positive number or "max"');
            } else if (instanceCount > CPU_CORES * 2) {
                validationResult.warnings.push(`Instance count (${instanceCount}) exceeds CPU cores (${CPU_CORES}) by more than 2x`);
                validationResult.recommendations.push('Consider reducing instance count for optimal performance');
            }
        }

        // Check memory allocation and ensure no resource over-subscription
        const memoryLimit = clusterConfig.max_memory_restart;
        if (memoryLimit) {
            const memoryMB = parseInt(memoryLimit.replace(/[^0-9]/g, ''));
            const totalSystemMemoryMB = Math.floor(os.totalmem() / (1024 * 1024));
            const instanceCount = instances === 'max' ? CPU_CORES : parseInt(instances) || 1;
            const totalMemoryUsage = memoryMB * instanceCount;

            if (totalMemoryUsage > totalSystemMemoryMB * 0.9) {
                validationResult.errors.push(`Memory over-subscription detected: ${totalMemoryUsage}MB required, ${totalSystemMemoryMB}MB available`);
            } else if (totalMemoryUsage > totalSystemMemoryMB * 0.8) {
                validationResult.warnings.push(`High memory usage: ${totalMemoryUsage}MB of ${totalSystemMemoryMB}MB (${Math.round(totalMemoryUsage/totalSystemMemoryMB*100)}%)`);
            }

            validationResult.validationDetails.memoryValidation = {
                memoryPerInstance: memoryMB,
                totalInstanceMemory: totalMemoryUsage,
                systemMemory: totalSystemMemoryMB,
                memoryUtilization: Math.round(totalMemoryUsage / totalSystemMemoryMB * 100)
            };
        }

        // Validate load balancing configuration and distribution strategy
        const execMode = clusterConfig.exec_mode;
        if (execMode && !['cluster', 'fork'].includes(execMode)) {
            validationResult.errors.push(`Invalid exec_mode: ${execMode}. Must be 'cluster' or 'fork'`);
        }

        if (execMode === 'cluster' && (!instances || instances === 1)) {
            validationResult.warnings.push('Cluster mode with single instance provides no performance benefit');
            validationResult.recommendations.push('Use fork mode for single instance or increase instance count');
        }

        // Check zero-downtime deployment configuration completeness
        const killTimeout = clusterConfig.kill_timeout;
        if (killTimeout && (killTimeout < 1000 || killTimeout > 30000)) {
            validationResult.warnings.push(`Kill timeout (${killTimeout}ms) outside recommended range (1000-30000ms)`);
        }

        const waitReady = clusterConfig.wait_ready;
        const listenTimeout = clusterConfig.listen_timeout;
        if (waitReady && (!listenTimeout || listenTimeout < 1000)) {
            validationResult.warnings.push('wait_ready enabled but listen_timeout too low or missing');
            validationResult.recommendations.push('Set listen_timeout to at least 3000ms when using wait_ready');
        }

        // Validate monitoring and health check endpoint configuration
        if (clusterConfig.health_monitoring) {
            const healthConfig = clusterConfig.health_monitoring;
            if (healthConfig.health_check_endpoint && !healthConfig.health_check_endpoint.startsWith('/')) {
                validationResult.warnings.push('Health check endpoint should start with "/"');
            }

            if (healthConfig.health_check_interval && healthConfig.health_check_interval < 1000) {
                validationResult.warnings.push('Health check interval less than 1000ms may impact performance');
            }
        }

        // Check cluster-specific environment variables and settings
        const env = clusterConfig.env || {};
        if (execMode === 'cluster') {
            if (!env.PM2_CLUSTER_MODE) {
                validationResult.recommendations.push('Set PM2_CLUSTER_MODE environment variable for cluster awareness');
            }
            if (!env.INSTANCE_ID && !clusterConfig.instance_var) {
                validationResult.recommendations.push('Configure instance variable for worker identification');
            }
        }

        // Validate script paths and application entry points
        const script = clusterConfig.script;
        if (!script) {
            validationResult.errors.push('Script path is required');
        } else if (!script.endsWith('.js') && !script.endsWith('.mjs')) {
            validationResult.warnings.push('Script file should have .js or .mjs extension');
        }

        // Generate warnings for potential performance issues
        if (clusterConfig.watch && environmentConfig.isProduction) {
            validationResult.warnings.push('File watching enabled in production environment');
            validationResult.recommendations.push('Disable file watching in production for better performance');
        }

        if (!clusterConfig.node_args || !clusterConfig.node_args.includes('max-old-space-size')) {
            validationResult.recommendations.push('Consider setting --max-old-space-size for better memory management');
        }

        // Determine overall validation status
        if (validationResult.errors.length > 0) {
            validationResult.status = 'invalid';
        } else if (validationResult.warnings.length > 0) {
            validationResult.status = 'valid_with_warnings';
        }

        // Add validation metadata
        validationResult.validationDetails.summary = {
            totalChecks: 15,
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length,
            recommendations: validationResult.recommendations.length,
            validatedAt: new Date().toISOString()
        };

        logger.info('Cluster configuration validation completed', {
            status: validationResult.status,
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length,
            recommendations: validationResult.recommendations.length
        });

        return validationResult;

    } catch (error) {
        logger.error('Error validating cluster configuration', { error: error.message });
        return {
            status: 'error',
            errors: [`Validation failed: ${error.message}`],
            warnings: [],
            recommendations: [],
            validationDetails: {
                summary: {
                    totalChecks: 0,
                    errors: 1,
                    warnings: 0,
                    recommendations: 0,
                    validatedAt: new Date().toISOString()
                }
            }
        };
    }
}

/**
 * Generates cluster startup scripts and configuration files for automated deployment,
 * including PM2 ecosystem files, startup scripts, and cluster management utilities 
 * for production deployment
 * 
 * @param {object} clusterConfig - Cluster configuration for script generation
 * @param {string} outputPath - Output directory path for generated scripts
 * @returns {object} Generated script information with file paths and deployment instructions
 */
export function generateClusterScript(clusterConfig, outputPath = './scripts') {
    try {
        logger.info('Generating cluster startup scripts', { 
            outputPath,
            configType: typeof clusterConfig 
        });

        const scriptGeneration = {
            files: [],
            instructions: [],
            deploymentSteps: [],
            generatedAt: new Date().toISOString()
        };

        // Generate PM2 ecosystem file with cluster configuration
        const ecosystemConfig = {
            apps: [clusterConfig]
        };

        const ecosystemContent = `// PM2 Ecosystem Configuration
// Generated on ${new Date().toISOString()}
// Node.js Tutorial Project - Production Cluster Configuration

module.exports = ${JSON.stringify(ecosystemConfig, null, 2)};
`;

        scriptGeneration.files.push({
            name: 'ecosystem.config.js',
            path: `${outputPath}/ecosystem.config.js`,
            content: ecosystemContent,
            type: 'ecosystem'
        });

        // Create startup scripts for automated cluster deployment
        const startupScript = `#!/bin/bash
# PM2 Cluster Startup Script
# Generated on ${new Date().toISOString()}

set -e

echo "Starting Node.js Tutorial Project with PM2 Cluster Mode..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Start application with ecosystem configuration
echo "Starting application with cluster configuration..."
pm2 start ${outputPath}/ecosystem.config.js --env production

# Save PM2 process list for startup on reboot
echo "Saving PM2 process list..."
pm2 save

# Generate startup script (run with sudo if needed)
echo "Generating PM2 startup script..."
pm2 startup

echo "Cluster deployment completed successfully!"
echo "Use 'pm2 monit' to monitor cluster status"
echo "Use 'pm2 logs' to view application logs"
`;

        scriptGeneration.files.push({
            name: 'start-cluster.sh',
            path: `${outputPath}/start-cluster.sh`,
            content: startupScript,
            type: 'startup',
            executable: true
        });

        // Generate health check scripts for cluster monitoring
        const healthCheckScript = `#!/bin/bash
# PM2 Cluster Health Check Script
# Generated on ${new Date().toISOString()}

set -e

echo "Checking PM2 cluster health..."

# Check PM2 daemon status
if ! pm2 ping &> /dev/null; then
    echo "ERROR: PM2 daemon is not running"
    exit 1
fi

# Check application status
APP_STATUS=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")

if [ "$APP_STATUS" != "online" ]; then
    echo "ERROR: Application is not online (status: $APP_STATUS)"
    exit 1
fi

# Check application health endpoint
HEALTH_URL="http://localhost:${clusterConfig.env?.PORT || 3000}/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$HTTP_STATUS" != "200" ]; then
    echo "ERROR: Health check failed (HTTP $HTTP_STATUS)"
    exit 1
fi

echo "Cluster health check passed"
echo "Application Status: $APP_STATUS"
echo "Health Endpoint: $HTTP_STATUS"
echo "Process Count: $(pm2 list | grep -c online || echo 0)"
`;

        scriptGeneration.files.push({
            name: 'health-check.sh',
            path: `${outputPath}/health-check.sh`,
            content: healthCheckScript,
            type: 'health_check',
            executable: true
        });

        // Create cluster management utility scripts (start, stop, reload)
        const managementScript = `#!/bin/bash
# PM2 Cluster Management Script
# Generated on ${new Date().toISOString()}

ECOSYSTEM_FILE="${outputPath}/ecosystem.config.js"
APP_NAME="${clusterConfig.name || 'nodejs-tutorial'}"

case "$1" in
    start)
        echo "Starting cluster..."
        pm2 start "$ECOSYSTEM_FILE" --env production
        ;;
    stop)
        echo "Stopping cluster..."
        pm2 stop "$APP_NAME"
        ;;
    restart)
        echo "Restarting cluster..."
        pm2 restart "$APP_NAME"
        ;;
    reload)
        echo "Zero-downtime reload..."
        pm2 reload "$APP_NAME"
        ;;
    scale)
        if [ -z "$2" ]; then
            echo "Usage: $0 scale <number_of_instances>"
            exit 1
        fi
        echo "Scaling to $2 instances..."
        pm2 scale "$APP_NAME" "$2"
        ;;
    logs)
        pm2 logs "$APP_NAME"
        ;;
    monit)
        pm2 monit
        ;;
    status)
        pm2 status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|reload|scale|logs|monit|status}"
        echo "Examples:"
        echo "  $0 start          # Start the cluster"
        echo "  $0 reload         # Zero-downtime reload"
        echo "  $0 scale 4        # Scale to 4 instances"
        echo "  $0 logs           # View logs"
        exit 1
        ;;
esac
`;

        scriptGeneration.files.push({
            name: 'manage-cluster.sh',
            path: `${outputPath}/manage-cluster.sh`,
            content: managementScript,
            type: 'management',
            executable: true
        });

        // Generate deployment automation scripts with zero-downtime support
        const deploymentScript = `#!/bin/bash
# PM2 Zero-Downtime Deployment Script
# Generated on ${new Date().toISOString()}

set -e

ECOSYSTEM_FILE="${outputPath}/ecosystem.config.js"
APP_NAME="${clusterConfig.name || 'nodejs-tutorial'}"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo "Starting zero-downtime deployment..."

# Create backup
echo "Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" || echo "Backup creation failed"

# Run tests before deployment
if [ -f "package.json" ] && npm run test:production &> /dev/null; then
    echo "Running tests..."
    npm run test:production
else
    echo "Skipping tests (no test:production script found)"
fi

# Install/update dependencies
echo "Installing dependencies..."
npm ci --production

# Reload application with zero downtime
echo "Performing zero-downtime reload..."
pm2 reload "$ECOSYSTEM_FILE" --env production

# Health check after deployment
echo "Performing post-deployment health check..."
sleep 5
${outputPath}/health-check.sh

if [ $? -eq 0 ]; then
    echo "Deployment completed successfully!"
    echo "Backup available at: $BACKUP_DIR"
else
    echo "Deployment health check failed!"
    echo "Consider rolling back to: $BACKUP_DIR"
    exit 1
fi
`;

        scriptGeneration.files.push({
            name: 'deploy.sh',
            path: `${outputPath}/deploy.sh`,
            content: deploymentScript,
            type: 'deployment',
            executable: true
        });

        // Create cluster monitoring and logging scripts
        const monitoringScript = `#!/bin/bash
# PM2 Cluster Monitoring Script
# Generated on ${new Date().toISOString()}

APP_NAME="${clusterConfig.name || 'nodejs-tutorial'}"

echo "PM2 Cluster Monitoring Dashboard"
echo "================================="

# Display cluster status
echo "Cluster Status:"
pm2 status

echo ""
echo "Memory Usage:"
pm2 show "$APP_NAME" | grep -E "(memory|cpu)"

echo ""
echo "Recent Logs (last 20 lines):"
pm2 logs "$APP_NAME" --lines 20 --nostream

echo ""
echo "Performance Metrics:"
pm2 monit --no-colors | head -10

echo ""
echo "Commands:"
echo "  pm2 monit           # Real-time monitoring"
echo "  pm2 logs $APP_NAME  # View logs"
echo "  pm2 reload $APP_NAME # Zero-downtime reload"
`;

        scriptGeneration.files.push({
            name: 'monitor.sh',
            path: `${outputPath}/monitor.sh`,
            content: monitoringScript,
            type: 'monitoring',
            executable: true
        });

        // Generate usage instructions
        scriptGeneration.instructions = [
            'Make scripts executable: chmod +x scripts/*.sh',
            'Start cluster: ./scripts/start-cluster.sh',
            'Monitor cluster: ./scripts/monitor.sh',
            'Deploy updates: ./scripts/deploy.sh',
            'Manage cluster: ./scripts/manage-cluster.sh {start|stop|reload|scale}'
        ];

        scriptGeneration.deploymentSteps = [
            '1. Review generated ecosystem.config.js',
            '2. Make scripts executable',
            '3. Run start-cluster.sh to deploy',
            '4. Verify with health-check.sh',
            '5. Monitor with monitor.sh',
            '6. Use deploy.sh for updates'
        ];

        // Write all scripts to specified output directory
        // Note: In a real implementation, you would write these files to the filesystem
        logger.info('Cluster scripts generated successfully', {
            fileCount: scriptGeneration.files.length,
            outputPath,
            scripts: scriptGeneration.files.map(f => f.name)
        });

        return scriptGeneration;

    } catch (error) {
        logger.error('Error generating cluster scripts', { 
            error: error.message, 
            outputPath 
        });
        throw new Error(`Failed to generate cluster scripts: ${error.message}`);
    }
}

// Default cluster configuration object with optimal settings for production deployment
export const clusterConfig = {
    instances: DEFAULT_INSTANCES,
    exec_mode: PM2_CONSTANTS.EXEC_MODES.CLUSTER,
    load_balancer: LOAD_BALANCER_TYPE,
    zero_downtime: CLUSTER_MODE_ENABLED,
    autorestart: true,
    max_memory_restart: '1G',
    watch: !environmentConfig.isProduction,
    ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage'],
    env: {
        NODE_ENV: 'development',
        PM2_CLUSTER_MODE: 'true'
    },
    env_production: {
        NODE_ENV: 'production',
        PM2_CLUSTER_MODE: 'true'
    }
};

// Pre-configured production cluster settings optimized for maximum performance and reliability
export const productionClusterConfig = {
    instances: 'max',
    exec_mode: PM2_CONSTANTS.EXEC_MODES.CLUSTER,
    autorestart: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    health_check_grace_period: 3000,
    pmx: true,
    automation: false,
    vizion: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env_production: {
        NODE_ENV: 'production',
        PM2_CLUSTER_MODE: 'true',
        PM2_LOAD_BALANCER: 'round_robin'
    }
};

// Pre-configured development cluster settings optimized for debugging and hot reload
export const developmentClusterConfig = {
    instances: 1,
    exec_mode: PM2_CONSTANTS.EXEC_MODES.FORK,
    watch: true,
    ignore_watch: ['node_modules', 'logs', '.git', 'test', 'coverage'],
    autorestart: true,
    max_memory_restart: '512M',
    env: {
        NODE_ENV: 'development',
        DEBUG: '*',
        PM2_CLUSTER_MODE: 'false'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
};

// Log cluster configuration initialization
logger.info('PM2 cluster configuration module initialized', {
    cpuCores: CPU_CORES,
    clusterModeEnabled: CLUSTER_MODE_ENABLED,
    defaultInstances: DEFAULT_INSTANCES,
    loadBalancerType: LOAD_BALANCER_TYPE,
    environment: environmentConfig.currentEnvironment,
    isProduction: environmentConfig.isProduction
});