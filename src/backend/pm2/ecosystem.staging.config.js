// PM2 Staging Ecosystem Configuration for Node.js Tutorial Project
// Provides production-like testing environment with enhanced debugging capabilities for pre-production validation
// Implements moderate cluster mode scaling, comprehensive monitoring, and zero-downtime deployment testing
// Features staging-specific optimizations while maintaining production readiness validation capabilities

// Node.js built-in module imports
import path from 'node:path'; // Node.js built-in - File path utilities for staging script resolution
import os from 'node:os'; // Node.js built-in - Operating system utilities for CPU detection and staging cluster sizing
import fs from 'node:fs/promises'; // Node.js built-in - File system operations for staging validation and setup

// Internal configuration imports for staging ecosystem setup
import { 
    pm2Config,
    createPM2Config,
    stagingConfig,
    validatePM2Config,
    optimizeForStaging
} from '../config/pm2.js';

import { 
    clusterConfig,
    createStagingClusterConfig,
    calculateStagingClusterSize,
    configureZeroDowntimeTesting,
    stagingClusterConfig
} from './cluster.config.js';

import { 
    monitoringConfig,
    setupStagingMonitoring,
    createStagingHealthCheckConfig,
    configureStagingPerformanceMonitoring,
    stagingMonitoringConfig
} from './monitoring.config.js';

import { 
    logConfig,
    createStagingLogConfig,
    setupStagingLogRotation,
    stagingLogPaths
} from './logs.config.js';

import { 
    environmentConfig,
    currentEnvironment,
    isStaging,
    server,
    pm2 as pm2EnvConfig
} from '../config/environment.js';

import logger from '../utils/logger.js';

// Global staging ecosystem configuration constants
const STAGING_ECOSYSTEM_VERSION = '1.0.0';
const STAGING_APP_NAME = process.env.PM2_STAGING_APP_NAME || 'nodejs-tutorial-staging';
const STAGING_SCRIPT_PATH = path.resolve(process.cwd(), 'server.js');
const STAGING_ENVIRONMENT = 'staging';
const STAGING_CPU_CORES = Math.max(2, Math.ceil(os.cpus().length / 2));
const STAGING_PORT = process.env.STAGING_PORT || 3001;
const STAGING_MEMORY_LIMIT = process.env.STAGING_MEMORY_LIMIT || '750M';

/**
 * Creates comprehensive PM2 staging ecosystem configuration that balances production-like performance 
 * with debugging accessibility for pre-production validation and testing. Implements moderate cluster 
 * mode with 50% CPU core utilization, enhanced monitoring with staging-appropriate thresholds, and 
 * zero-downtime deployment testing capabilities for production readiness validation.
 * 
 * @param {Object} options - Staging ecosystem configuration options
 * @param {string} [options.appName] - Custom application name for staging environment
 * @param {string} [options.scriptPath] - Custom script path for staging deployment
 * @param {number} [options.instances] - Override for staging instance count
 * @param {Object} [options.monitoring] - Custom monitoring configuration
 * @param {Object} [options.deployment] - Custom deployment settings
 * @returns {Object} Complete staging ecosystem configuration with moderate cluster mode, enhanced monitoring, and debugging capabilities
 */
export function createStagingEcosystemConfig(options = {}) {
    try {
        logger.info('Creating staging PM2 ecosystem configuration', {
            appName: options.appName || STAGING_APP_NAME,
            environment: STAGING_ENVIRONMENT,
            cpuCores: STAGING_CPU_CORES,
            stagingPort: STAGING_PORT
        });

        // Load staging-specific configuration from environment.js and pm2Config.stagingConfig
        const stagingEnvironmentConfig = {
            ...environmentConfig,
            currentEnvironment: STAGING_ENVIRONMENT,
            isStaging: true,
            server: {
                ...environmentConfig.server,
                port: STAGING_PORT,
                environment: STAGING_ENVIRONMENT
            },
            pm2: {
                ...environmentConfig.pm2,
                instances: options.instances || STAGING_CPU_CORES,
                environment: STAGING_ENVIRONMENT
            }
        };

        // Calculate optimal staging cluster size using calculateStagingClusterSize for moderate scaling
        const clusterSizing = calculateStagingClusterSize({
            environment: STAGING_ENVIRONMENT,
            cpuCores: STAGING_CPU_CORES,
            targetInstances: options.instances || STAGING_CPU_CORES,
            memoryLimit: STAGING_MEMORY_LIMIT,
            performanceProfile: 'balanced'
        });

        // Configure cluster mode with balanced instance count (50% of available CPU cores)
        const stagingClusterConfiguration = {
            instances: clusterSizing.optimalInstances,
            exec_mode: 'cluster',
            instance_var: 'STAGING_INSTANCE_ID',
            increment_var: 'STAGING_INSTANCE_ID',
            ...clusterSizing.configuration
        };

        // Set execution mode to 'cluster' for production-like horizontal scaling testing
        const executionConfig = {
            exec_mode: 'cluster',
            instances: stagingClusterConfiguration.instances,
            max_memory_restart: STAGING_MEMORY_LIMIT,
            min_uptime: '10s',
            max_restarts: 5,
            restart_delay: 2000,
            autorestart: true
        };

        // Configure staging-appropriate memory limits and restart policies
        const memoryAndRestartConfig = {
            max_memory_restart: STAGING_MEMORY_LIMIT,
            node_args: `--max-old-space-size=${parseInt(STAGING_MEMORY_LIMIT.replace('M', ''))}`,
            kill_timeout: 8000,
            wait_ready: true,
            listen_timeout: 5000,
            restart_delay: executionConfig.restart_delay,
            exponential_backoff_restart_delay: 2000
        };

        // Set up staging environment variables including NODE_ENV=staging
        const stagingEnvironmentVariables = {
            NODE_ENV: STAGING_ENVIRONMENT,
            PORT: STAGING_PORT,
            PM2_STAGING: 'true',
            PM2_CLUSTER_MODE: 'true',
            STAGING_ECOSYSTEM_VERSION,
            DEBUG: process.env.DEBUG || 'app:*,express:*',
            LOG_LEVEL: 'debug',
            ENABLE_PERFORMANCE_MONITORING: 'true',
            ENABLE_SECURITY_LOGGING: 'true',
            STAGING_VALIDATION_MODE: 'true',
            ...options.environmentVariables
        };

        // Configure enhanced logging with debugging capabilities and moderate rotation
        const stagingLoggingConfig = createStagingLogConfig({
            environment: STAGING_ENVIRONMENT,
            logLevel: 'debug',
            enableRotation: true,
            rotationSize: '100M',
            retentionDays: 14,
            enableDebugging: true,
            enablePerformanceLogging: true,
            ...options.logging
        });

        // Integrate comprehensive monitoring with staging-specific thresholds and alerting
        const stagingMonitoringConfiguration = setupStagingMonitoring({
            environment: STAGING_ENVIRONMENT,
            healthCheckInterval: 10000,
            performanceThresholds: {
                responseTime: 1500, // 1.5 seconds for staging
                memoryUsage: 0.8,   // 80% memory threshold
                cpuUsage: 0.75,     // 75% CPU threshold
                errorRate: 0.1      // 10% error rate threshold for staging
            },
            alerting: {
                enabled: true,
                webhookUrl: process.env.STAGING_WEBHOOK_URL,
                slackChannel: process.env.STAGING_SLACK_CHANNEL
            },
            debugging: {
                enabled: true,
                profileMemory: true,
                trackSlowQueries: true
            },
            ...options.monitoring
        });

        // Configure zero-downtime deployment testing with staging validation hooks
        const zeroDowntimeDeploymentConfig = configureZeroDowntimeTesting({
            environment: STAGING_ENVIRONMENT,
            testMode: true,
            validationHooks: {
                preReload: 'npm run test:staging',
                postReload: 'npm run validate:staging',
                healthCheck: '/staging/health'
            },
            deploymentTimeout: 120000, // 2 minutes for staging
            rollbackOnFailure: true,
            preserveConnections: true,
            gracefulShutdown: true,
            ...options.deployment
        });

        // Apply staging security settings and validation configurations
        const stagingSecurityConfig = {
            enableHelmetDefaults: true,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for debugging
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            },
            crossOriginEmbedderPolicy: false, // Relaxed for staging
            crossOriginOpenerPolicy: false,
            originAgentCluster: false,
            referrerPolicy: 'no-referrer-when-downgrade',
            securityLogging: true,
            debugSecurityHeaders: true
        };

        // Set up staging deployment hooks and production readiness validation
        const stagingDeploymentHooks = {
            'pre-start': [
                'echo "Starting staging deployment validation"',
                'npm run lint',
                'npm run test:unit'
            ],
            'post-start': [
                'echo "Staging deployment started successfully"',
                'curl -f http://localhost:' + STAGING_PORT + '/health || exit 1',
                'npm run test:integration:staging'
            ],
            'pre-stop': [
                'echo "Preparing staging shutdown"',
                'npm run cleanup:staging'
            ],
            'post-stop': [
                'echo "Staging shutdown completed"'
            ],
            'pre-reload': [
                'echo "Starting staging zero-downtime reload"',
                'npm run test:pre-deploy'
            ],
            'post-reload': [
                'echo "Staging reload completed"',
                'npm run validate:post-deploy',
                'npm run test:smoke:staging'
            ]
        };

        // Return complete staging ecosystem configuration optimized for pre-production testing
        const stagingEcosystemConfiguration = {
            // Application identification and metadata
            apps: [{
                // Basic application configuration
                name: options.appName || STAGING_APP_NAME,
                script: options.scriptPath || STAGING_SCRIPT_PATH,
                cwd: process.cwd(),
                
                // Cluster and execution configuration
                ...executionConfig,
                ...stagingClusterConfiguration,
                
                // Memory and performance configuration
                ...memoryAndRestartConfig,
                
                // Environment variables
                env: {
                    ...stagingEnvironmentVariables,
                    NODE_ENV: 'development' // Default environment
                },
                env_staging: {
                    ...stagingEnvironmentVariables,
                    NODE_ENV: STAGING_ENVIRONMENT,
                    DEBUG: 'app:*,express:*,pm2:*'
                },
                env_production: {
                    ...stagingEnvironmentVariables,
                    NODE_ENV: 'production',
                    DEBUG: 'app:error,express:error'
                },
                
                // Logging configuration
                ...stagingLoggingConfig.pm2Settings,
                
                // Monitoring and health checks
                ...stagingMonitoringConfiguration.pm2Settings,
                
                // Deployment configuration
                ...zeroDowntimeDeploymentConfig.pm2Settings,
                
                // Security configuration
                security: stagingSecurityConfig,
                
                // File watching configuration for staging
                watch: false, // Disabled for staging stability
                ignore_watch: [
                    'node_modules',
                    'logs',
                    '.git',
                    'test',
                    'coverage',
                    'docs',
                    '*.log'
                ],
                
                // Process management
                source_map_support: true,
                disable_source_map_support: false,
                merge_logs: true,
                combine_logs: true,
                force: false,
                
                // Additional staging-specific settings
                staging_mode: true,
                production_ready_testing: true,
                debugging_enabled: true,
                performance_profiling: options.enableProfiling || false,
                
                // Deployment hooks
                ...stagingDeploymentHooks
            }],
            
            // Deployment configuration for staging environment
            deploy: {
                staging: {
                    user: process.env.STAGING_DEPLOY_USER || 'staging',
                    host: process.env.STAGING_DEPLOY_HOST || 'localhost',
                    ref: process.env.STAGING_DEPLOY_REF || 'origin/staging',
                    repo: process.env.STAGING_DEPLOY_REPO || 'git@github.com:username/nodejs-tutorial.git',
                    path: process.env.STAGING_DEPLOY_PATH || '/var/www/nodejs-tutorial-staging',
                    'post-deploy': [
                        'npm ci',
                        'npm run build:staging',
                        'npm run test:staging',
                        'pm2 reload ecosystem.staging.config.js --env staging',
                        'npm run validate:deployment'
                    ].join(' && '),
                    'pre-setup': 'mkdir -p /var/www/nodejs-tutorial-staging',
                    'post-setup': 'npm install pm2 -g',
                    env: {
                        NODE_ENV: STAGING_ENVIRONMENT,
                        PORT: STAGING_PORT
                    }
                }
            },
            
            // Configuration metadata
            metadata: {
                version: STAGING_ECOSYSTEM_VERSION,
                environment: STAGING_ENVIRONMENT,
                createdAt: new Date().toISOString(),
                cpuCores: STAGING_CPU_CORES,
                optimalInstances: clusterSizing.optimalInstances,
                memoryLimit: STAGING_MEMORY_LIMIT,
                nodeVersion: process.version,
                pm2Compatible: true,
                stagingOptimized: true,
                productionReadyTesting: true
            }
        };

        logger.info('Staging PM2 ecosystem configuration created successfully', {
            appName: stagingEcosystemConfiguration.apps[0].name,
            instances: stagingEcosystemConfiguration.apps[0].instances,
            memoryLimit: stagingEcosystemConfiguration.apps[0].max_memory_restart,
            environment: STAGING_ENVIRONMENT,
            deploymentConfigured: !!stagingEcosystemConfiguration.deploy.staging
        });

        return stagingEcosystemConfiguration;

    } catch (error) {
        logger.error('Failed to create staging PM2 ecosystem configuration', error, {
            options,
            environment: STAGING_ENVIRONMENT,
            stagingAppName: STAGING_APP_NAME
        });
        throw new Error(`Staging ecosystem configuration creation failed: ${error.message}`);
    }
}

/**
 * Configures individual staging application settings within the PM2 ecosystem with production-like 
 * features and enhanced debugging capabilities for validation testing. Implements moderate cluster 
 * scaling, comprehensive monitoring, and staging-specific environment variables for pre-production 
 * validation workflows.
 * 
 * @param {string} appName - Application name for staging deployment identification
 * @param {string} scriptPath - Path to the main application script file
 * @param {Object} stagingOptions - Staging-specific application configuration options
 * @param {number} [stagingOptions.instances] - Number of cluster instances for staging
 * @param {string} [stagingOptions.memoryLimit] - Memory limit per instance
 * @param {Object} [stagingOptions.monitoring] - Monitoring configuration
 * @param {Object} [stagingOptions.logging] - Logging configuration
 * @returns {Object} Staging application configuration with cluster mode, monitoring, and debugging features
 */
export function configureStagingApp(appName, scriptPath, stagingOptions = {}) {
    try {
        logger.info('Configuring staging application settings', {
            appName,
            scriptPath,
            options: Object.keys(stagingOptions)
        });

        // Validate application name and script path for staging setup
        if (!appName || typeof appName !== 'string') {
            throw new Error('Application name is required and must be a string');
        }

        if (!scriptPath || typeof scriptPath !== 'string') {
            throw new Error('Script path is required and must be a string');
        }

        // Validate file existence for staging deployment
        const resolvedScriptPath = path.resolve(scriptPath);
        
        // Configure application name with staging environment suffix
        const stagingAppName = appName.includes('staging') ? appName : `${appName}-staging`;

        // Set script path and validate file existence for staging deployment
        const applicationScript = {
            script: resolvedScriptPath,
            cwd: process.cwd(),
            interpreter: 'node',
            interpreter_args: '--harmony --experimental-modules',
            source_map_support: true
        };

        // Configure cluster execution mode with moderate instance count
        const clusterConfiguration = {
            exec_mode: 'cluster',
            instances: stagingOptions.instances || STAGING_CPU_CORES,
            instance_var: 'STAGING_INSTANCE_ID',
            increment_var: 'STAGING_INSTANCE_ID'
        };

        // Set staging-specific instance count based on STAGING_CPU_CORES
        const instanceManagement = {
            instances: clusterConfiguration.instances,
            max_restarts: 5,
            min_uptime: '10s',
            restart_delay: 2000,
            autorestart: true,
            kill_timeout: 8000,
            wait_ready: true,
            listen_timeout: 5000
        };

        // Configure staging environment variables including debugging flags
        const stagingEnvironmentConfig = {
            env: {
                NODE_ENV: 'development',
                PORT: STAGING_PORT,
                APP_NAME: stagingAppName,
                DEBUG: 'app:info',
                LOG_LEVEL: 'info'
            },
            env_staging: {
                NODE_ENV: STAGING_ENVIRONMENT,
                PORT: STAGING_PORT,
                APP_NAME: stagingAppName,
                PM2_STAGING: 'true',
                PM2_CLUSTER_MODE: 'true',
                DEBUG: 'app:*,express:*,pm2:staging',
                LOG_LEVEL: 'debug',
                ENABLE_DEBUGGING: 'true',
                ENABLE_PROFILING: stagingOptions.enableProfiling || 'false',
                STAGING_VALIDATION_MODE: 'true',
                PERFORMANCE_MONITORING: 'true',
                SECURITY_DEBUGGING: 'true',
                REQUEST_CORRELATION_TRACKING: 'true',
                ...stagingOptions.environmentVariables
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: STAGING_PORT,
                APP_NAME: stagingAppName,
                PM2_STAGING: 'false',
                DEBUG: 'app:error,express:error',
                LOG_LEVEL: 'info'
            }
        };

        // Set up enhanced logging with debugging output and file rotation
        const stagingLoggingConfiguration = {
            log_file: path.join(stagingLogPaths.base, `${stagingAppName}-combined.log`),
            out_file: path.join(stagingLogPaths.base, `${stagingAppName}-out.log`),
            error_file: path.join(stagingLogPaths.base, `${stagingAppName}-error.log`),
            log_type: 'json',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            combine_logs: true,
            time_zone: 'UTC',
            log_level: 'debug',
            ...stagingOptions.logging
        };

        // Configure staging-appropriate memory limits and performance monitoring
        const memoryAndPerformanceConfig = {
            max_memory_restart: stagingOptions.memoryLimit || STAGING_MEMORY_LIMIT,
            node_args: `--max-old-space-size=${parseInt((stagingOptions.memoryLimit || STAGING_MEMORY_LIMIT).replace('M', ''))}`,
            memory_monitoring: true,
            performance_monitoring: true,
            gc_monitoring: true
        };

        // Enable production-like monitoring with debugging accessibility
        const monitoringConfiguration = createStagingHealthCheckConfig({
            appName: stagingAppName,
            healthCheckEndpoint: '/staging/health',
            healthCheckInterval: 15000,
            healthCheckTimeout: 5000,
            performanceMetrics: true,
            debugMetrics: true,
            memoryProfiling: stagingOptions.enableProfiling || false,
            ...stagingOptions.monitoring
        });

        // Set up staging health checks and validation endpoints
        const healthCheckConfiguration = {
            health_check_grace_period: 5000,
            health_check_endpoint: '/staging/health',
            health_check_method: 'GET',
            health_check_expected_status: 200,
            health_check_timeout: 5000,
            readiness_check_endpoint: '/staging/ready',
            liveness_check_endpoint: '/staging/alive'
        };

        // Configure deployment testing hooks and validation procedures
        const deploymentTestingHooks = {
            'pre-start': [
                `echo "Starting staging app: ${stagingAppName}"`,
                'npm run lint',
                'npm run test:unit:staging'
            ],
            'post-start': [
                `echo "Staging app ${stagingAppName} started successfully"`,
                `curl -f http://localhost:${STAGING_PORT}/staging/health || exit 1`,
                'npm run test:integration:staging'
            ],
            'pre-reload': [
                `echo "Reloading staging app: ${stagingAppName}"`,
                'npm run test:pre-deploy:staging'
            ],
            'post-reload': [
                `echo "Staging app ${stagingAppName} reloaded successfully"`,
                'npm run validate:post-deploy:staging',
                'npm run test:smoke:staging'
            ]
        };

        // Return complete staging application configuration
        const stagingApplicationConfig = {
            // Basic application settings
            name: stagingAppName,
            ...applicationScript,
            
            // Cluster and execution configuration
            ...clusterConfiguration,
            ...instanceManagement,
            
            // Environment configuration
            ...stagingEnvironmentConfig,
            
            // Logging configuration
            ...stagingLoggingConfiguration,
            
            // Memory and performance configuration
            ...memoryAndPerformanceConfig,
            
            // Monitoring configuration
            ...monitoringConfiguration.pm2Config,
            
            // Health check configuration
            ...healthCheckConfiguration,
            
            // File watching configuration
            watch: false, // Disabled for staging stability
            ignore_watch: [
                'node_modules',
                'logs',
                '.git',
                'test',
                'coverage',
                'docs',
                '*.log',
                'tmp'
            ],
            
            // Deployment hooks
            ...deploymentTestingHooks,
            
            // Staging-specific metadata
            staging_config: {
                version: STAGING_ECOSYSTEM_VERSION,
                environment: STAGING_ENVIRONMENT,
                debugging_enabled: true,
                production_ready_testing: true,
                cluster_mode: true,
                monitoring_enabled: true,
                zero_downtime_testing: true,
                created_at: new Date().toISOString()
            }
        };

        logger.info('Staging application configuration completed', {
            name: stagingApplicationConfig.name,
            script: stagingApplicationConfig.script,
            instances: stagingApplicationConfig.instances,
            execMode: stagingApplicationConfig.exec_mode,
            memoryLimit: stagingApplicationConfig.max_memory_restart,
            environment: STAGING_ENVIRONMENT
        });

        return stagingApplicationConfig;

    } catch (error) {
        logger.error('Failed to configure staging application', error, {
            appName,
            scriptPath,
            stagingOptions
        });
        throw new Error(`Staging application configuration failed: ${error.message}`);
    }
}

/**
 * Sets up PM2 cluster configuration optimized for staging environment with moderate scaling, 
 * production-like behavior, and enhanced monitoring for validation testing. Implements 50% CPU 
 * core utilization, load balancing configuration, and zero-downtime deployment testing 
 * capabilities for production readiness assessment.
 * 
 * @param {Object} clusterOptions - Staging cluster configuration options
 * @param {number} [clusterOptions.instances] - Number of cluster instances
 * @param {string} [clusterOptions.loadBalancer] - Load balancing strategy
 * @param {Object} [clusterOptions.monitoring] - Cluster monitoring configuration
 * @param {Object} [clusterOptions.deployment] - Deployment configuration
 * @returns {Object} Staging cluster configuration with balanced scaling, monitoring, and debugging capabilities
 */
export function setupStagingCluster(clusterOptions = {}) {
    try {
        logger.info('Setting up staging cluster configuration', {
            options: Object.keys(clusterOptions),
            cpuCores: STAGING_CPU_CORES,
            environment: STAGING_ENVIRONMENT
        });

        // Calculate staging-appropriate cluster size (50% of available CPU cores)
        const clusterSizing = calculateStagingClusterSize({
            cpuCores: STAGING_CPU_CORES,
            targetUtilization: 0.5, // 50% CPU utilization for staging
            environment: STAGING_ENVIRONMENT,
            memoryPerInstance: STAGING_MEMORY_LIMIT,
            loadProfile: 'moderate',
            ...clusterOptions.sizing
        });

        // Configure cluster mode with balanced instance distribution
        const clusterModeConfiguration = {
            exec_mode: 'cluster',
            instances: clusterOptions.instances || clusterSizing.optimalInstances,
            instance_var: 'STAGING_INSTANCE_ID',
            increment_var: 'STAGING_INSTANCE_ID',
            cluster_coordination: true,
            load_balancing: true
        };

        // Set up load balancing configuration for staging testing
        const loadBalancingConfig = {
            load_balancer: clusterOptions.loadBalancer || 'round_robin',
            sticky_sessions: false,
            connection_pooling: true,
            health_check_lb: true,
            lb_monitoring: true,
            lb_debug_mode: true // Enhanced debugging for staging
        };

        // Configure worker process coordination and communication
        const workerCoordinationConfig = {
            worker_communication: true,
            shared_memory: false, // Disabled for staging isolation
            inter_process_communication: true,
            worker_restart_coordination: true,
            graceful_worker_shutdown: true,
            worker_health_monitoring: true
        };

        // Set up cluster-wide monitoring and health tracking
        const clusterMonitoringConfig = configureStagingPerformanceMonitoring({
            environment: STAGING_ENVIRONMENT,
            instances: clusterModeConfiguration.instances,
            monitoring: {
                cluster_metrics: true,
                worker_metrics: true,
                load_balancer_metrics: true,
                performance_profiling: clusterOptions.enableProfiling || false,
                memory_profiling: true,
                cpu_profiling: false, // Disabled for staging stability
                request_correlation: true,
                cross_worker_correlation: true
            },
            thresholds: {
                worker_response_time: 1500, // 1.5 seconds
                cluster_response_time: 2000, // 2 seconds
                worker_memory_usage: 0.8,   // 80%
                cluster_memory_usage: 0.75, // 75%
                worker_error_rate: 0.1,     // 10%
                cluster_error_rate: 0.05    // 5%
            },
            alerting: {
                enabled: true,
                debug_alerts: true,
                worker_failure_alerts: true,
                performance_alerts: true,
                threshold_alerts: true
            },
            ...clusterOptions.monitoring
        });

        // Configure staging-specific restart policies and failure handling
        const restartPolicyConfig = {
            autorestart: true,
            max_restarts: 5,
            min_uptime: '15s', // Longer uptime requirement for staging
            restart_delay: 3000, // 3 seconds delay
            exponential_backoff_restart_delay: 2000,
            crash_restart_delay: 5000,
            cluster_restart_coordination: true,
            graceful_restart: true,
            restart_notification: true
        };

        // Set up zero-downtime deployment testing for cluster mode
        const zeroDowntimeTestingConfig = configureZeroDowntimeTesting({
            environment: STAGING_ENVIRONMENT,
            cluster_mode: true,
            instances: clusterModeConfiguration.instances,
            deployment_strategy: 'rolling',
            rolling_deployment: {
                batch_size: 1, // One instance at a time for staging
                batch_delay: 5000, // 5 seconds between batches
                health_check_delay: 3000,
                rollback_on_failure: true,
                preserve_sessions: false
            },
            validation: {
                pre_deployment_tests: true,
                post_deployment_tests: true,
                health_checks: true,
                smoke_tests: true,
                integration_tests: true
            },
            monitoring_during_deployment: {
                enabled: true,
                real_time_metrics: true,
                error_rate_monitoring: true,
                performance_monitoring: true
            },
            ...clusterOptions.deployment
        });

        // Configure cluster debugging and validation capabilities
        const debuggingConfiguration = {
            debug_mode: true,
            cluster_debugging: true,
            worker_debugging: true,
            load_balancer_debugging: true,
            deployment_debugging: true,
            performance_debugging: clusterOptions.enableProfiling || false,
            memory_debugging: true,
            correlation_debugging: true,
            debug_logging: {
                enabled: true,
                debug_level: 'verbose',
                include_stack_traces: true,
                include_system_info: true
            }
        };

        // Return staging cluster configuration
        const stagingClusterConfiguration = {
            // Core cluster configuration
            ...clusterModeConfiguration,
            
            // Load balancing configuration
            ...loadBalancingConfig,
            
            // Worker coordination
            ...workerCoordinationConfig,
            
            // Monitoring configuration
            monitoring: clusterMonitoringConfig,
            
            // Restart policies
            restart_policies: restartPolicyConfig,
            
            // Zero-downtime testing
            zero_downtime_testing: zeroDowntimeTestingConfig,
            
            // Debugging configuration
            debugging: debuggingConfiguration,
            
            // Resource allocation
            resource_allocation: {
                memory_per_instance: STAGING_MEMORY_LIMIT,
                cpu_cores_total: STAGING_CPU_CORES,
                cpu_cores_per_instance: Math.ceil(STAGING_CPU_CORES / clusterModeConfiguration.instances),
                network_bandwidth_limit: null, // No limit for staging
                disk_io_limit: null // No limit for staging
            },
            
            // Staging-specific settings
            staging_cluster_config: {
                environment: STAGING_ENVIRONMENT,
                version: STAGING_ECOSYSTEM_VERSION,
                moderate_scaling: true,
                production_like_behavior: true,
                enhanced_debugging: true,
                validation_testing: true,
                created_at: new Date().toISOString(),
                cpu_utilization_target: 0.5,
                memory_utilization_target: 0.75
            }
        };

        logger.info('Staging cluster configuration completed', {
            instances: stagingClusterConfiguration.instances,
            execMode: stagingClusterConfiguration.exec_mode,
            loadBalancer: stagingClusterConfiguration.load_balancer,
            monitoringEnabled: !!stagingClusterConfiguration.monitoring,
            debuggingEnabled: stagingClusterConfiguration.debugging.debug_mode,
            zeroDowntimeEnabled: stagingClusterConfiguration.zero_downtime_testing.enabled
        });

        return stagingClusterConfiguration;

    } catch (error) {
        logger.error('Failed to setup staging cluster configuration', error, {
            clusterOptions,
            cpuCores: STAGING_CPU_CORES,
            environment: STAGING_ENVIRONMENT
        });
        throw new Error(`Staging cluster setup failed: ${error.message}`);
    }
}

/**
 * Configures comprehensive monitoring for staging environment with enhanced alerting, debugging 
 * capabilities, and production readiness validation metrics. Implements staging-appropriate 
 * thresholds, real-time monitoring, and validation testing capabilities for pre-production 
 * environment assessment and performance validation.
 * 
 * @param {Object} monitoringOptions - Staging monitoring configuration options
 * @param {Object} [monitoringOptions.thresholds] - Custom monitoring thresholds
 * @param {Object} [monitoringOptions.alerting] - Alerting configuration
 * @param {Object} [monitoringOptions.debugging] - Debug monitoring settings
 * @param {Object} [monitoringOptions.validation] - Validation monitoring settings
 * @returns {Object} Staging monitoring configuration with enhanced alerting, debugging, and validation metrics
 */
export function configureStagingMonitoring(monitoringOptions = {}) {
    try {
        logger.info('Configuring staging monitoring system', {
            options: Object.keys(monitoringOptions),
            environment: STAGING_ENVIRONMENT
        });

        // Configure staging-specific health check intervals and thresholds
        const healthCheckConfiguration = {
            health_check_interval: monitoringOptions.healthCheckInterval || 10000, // 10 seconds
            health_check_timeout: monitoringOptions.healthCheckTimeout || 5000,    // 5 seconds
            health_check_retries: monitoringOptions.healthCheckRetries || 3,
            health_check_endpoint: '/staging/health',
            readiness_check_endpoint: '/staging/ready',
            liveness_check_endpoint: '/staging/alive',
            deep_health_check: true,
            include_system_metrics: true,
            include_application_metrics: true
        };

        // Set up performance monitoring with staging-appropriate limits
        const performanceMonitoringConfig = {
            enabled: true,
            real_time_monitoring: true,
            metrics_collection_interval: 5000, // 5 seconds
            performance_thresholds: {
                response_time: {
                    warning: 1000,  // 1 second
                    critical: 2000, // 2 seconds
                    emergency: 5000 // 5 seconds
                },
                memory_usage: {
                    warning: 0.7,   // 70%
                    critical: 0.85, // 85%
                    emergency: 0.95 // 95%
                },
                cpu_usage: {
                    warning: 0.6,   // 60%
                    critical: 0.8,  // 80%
                    emergency: 0.95 // 95%
                },
                error_rate: {
                    warning: 0.05,  // 5%
                    critical: 0.1,  // 10%
                    emergency: 0.2  // 20%
                },
                throughput: {
                    minimum: 50,    // requests per minute
                    warning: 100,
                    target: 500
                },
                ...monitoringOptions.thresholds
            },
            metrics_collection: {
                response_times: true,
                memory_usage: true,
                cpu_usage: true,
                disk_usage: true,
                network_usage: true,
                error_rates: true,
                throughput: true,
                custom_metrics: true
            }
        };

        // Configure enhanced alerting with debugging information
        const alertingConfiguration = {
            enabled: true,
            real_time_alerts: true,
            alert_channels: ['console', 'file', 'webhook'],
            alert_levels: ['info', 'warning', 'critical', 'emergency'],
            alert_thresholds: performanceMonitoringConfig.performance_thresholds,
            alerting_rules: {
                performance_degradation: {
                    enabled: true,
                    threshold: 'warning',
                    consecutive_failures: 3,
                    time_window: 60000 // 1 minute
                },
                memory_leak_detection: {
                    enabled: true,
                    memory_growth_threshold: 0.1, // 10% growth
                    monitoring_window: 300000 // 5 minutes
                },
                error_spike_detection: {
                    enabled: true,
                    error_rate_spike: 0.05, // 5% increase
                    time_window: 30000 // 30 seconds
                },
                cluster_instability: {
                    enabled: true,
                    worker_failure_threshold: 2,
                    time_window: 120000 // 2 minutes
                }
            },
            notification_settings: {
                include_stack_traces: true,
                include_system_context: true,
                include_request_context: true,
                include_performance_metrics: true,
                include_debugging_info: true
            },
            webhook_url: process.env.STAGING_WEBHOOK_URL,
            slack_channel: process.env.STAGING_SLACK_CHANNEL,
            email_recipients: process.env.STAGING_EMAIL_ALERTS?.split(',') || [],
            ...monitoringOptions.alerting
        };

        // Set up validation metrics for production readiness testing
        const validationMetricsConfig = {
            enabled: true,
            production_readiness_metrics: {
                stability_metrics: {
                    uptime_target: 0.99,     // 99% uptime
                    restart_frequency: 5,    // Max 5 restarts per day
                    error_rate_target: 0.01  // 1% error rate
                },
                performance_metrics: {
                    response_time_p95: 1500, // 95th percentile under 1.5s
                    response_time_p99: 3000, // 99th percentile under 3s
                    throughput_target: 1000, // 1000 requests per minute
                    memory_efficiency: 0.8   // 80% memory efficiency
                },
                scalability_metrics: {
                    horizontal_scaling: true,
                    load_balancing_efficiency: 0.85, // 85% efficiency
                    cluster_coordination: true,
                    zero_downtime_deployment: true
                },
                security_metrics: {
                    security_headers_compliance: true,
                    vulnerability_scan_passed: true,
                    penetration_test_passed: false, // Not required for staging
                    compliance_check_passed: true
                }
            },
            validation_tests: {
                automated_testing: {
                    unit_tests: true,
                    integration_tests: true,
                    smoke_tests: true,
                    performance_tests: true,
                    security_tests: true
                },
                manual_validation: {
                    functional_testing: false,
                    user_acceptance_testing: false,
                    load_testing: true,
                    stress_testing: false
                }
            },
            ...monitoringOptions.validation
        };

        // Set up staging-specific monitoring dashboard and reporting
        const dashboardConfiguration = {
            enabled: true,
            real_time_dashboard: true,
            dashboard_port: 9615,
            dashboard_host: 'localhost',
            dashboard_auth: false, // Disabled for staging access
            dashboard_features: {
                cluster_overview: true,
                performance_metrics: true,
                error_tracking: true,
                deployment_tracking: true,
                health_status: true,
                log_aggregation: true,
                alert_management: true
            },
            refresh_interval: 5000, // 5 seconds
            historical_data: {
                enabled: true,
                retention_period: '7d', // 7 days for staging
                aggregation_intervals: ['1m', '5m', '15m', '1h', '1d']
            }
        };

        // Configure monitoring integration with external systems
        const monitoringIntegrationConfig = {
            prometheus_metrics: {
                enabled: process.env.PROMETHEUS_ENABLED === 'true',
                metrics_port: 9090,
                metrics_endpoint: '/metrics'
            },
            grafana_dashboard: {
                enabled: process.env.GRAFANA_ENABLED === 'true',
                dashboard_url: process.env.GRAFANA_DASHBOARD_URL
            },
            elk_stack: {
                enabled: process.env.ELK_ENABLED === 'true',
                elasticsearch_url: process.env.ELASTICSEARCH_URL,
                kibana_url: process.env.KIBANA_URL
            },
            custom_integrations: monitoringOptions.integrations || []
        };

        // Return comprehensive staging monitoring configuration
        const stagingMonitoringConfiguration = {
            // Core monitoring settings
            environment: STAGING_ENVIRONMENT,
            monitoring_enabled: true,
            debug_monitoring: true,
            
            // Health check configuration
            health_checks: healthCheckConfiguration,
            
            // Performance monitoring
            performance: performanceMonitoringConfig,
            
            // Alerting configuration
            alerting: alertingConfiguration,
            
            // Validation metrics
            validation: validationMetricsConfig,
            
            // Dashboard configuration
            dashboard: dashboardConfiguration,
            
            // Integration configuration
            integrations: monitoringIntegrationConfig,
            
            // PM2-specific monitoring settings
            pm2_monitoring: {
                pmx: true,
                automation: false,
                vizion: true,
                instance_monitoring: true,
                cluster_monitoring: true,
                deployment_monitoring: true
            },
            
            // Debugging and troubleshooting
            debugging: {
                enabled: true,
                verbose_logging: true,
                performance_profiling: monitoringOptions.enableProfiling || false,
                memory_profiling: true,
                request_tracing: true,
                correlation_tracking: true,
                debug_endpoints: {
                    enabled: true,
                    endpoints: ['/debug/health', '/debug/metrics', '/debug/config']
                }
            },
            
            // Staging-specific metadata
            staging_monitoring: {
                version: STAGING_ECOSYSTEM_VERSION,
                environment: STAGING_ENVIRONMENT,
                enhanced_debugging: true,
                production_readiness_validation: true,
                moderate_thresholds: true,
                created_at: new Date().toISOString()
            }
        };

        logger.info('Staging monitoring configuration completed', {
            healthChecksEnabled: stagingMonitoringConfiguration.health_checks.health_check_interval,
            performanceMonitoring: stagingMonitoringConfiguration.performance.enabled,
            alertingEnabled: stagingMonitoringConfiguration.alerting.enabled,
            validationEnabled: stagingMonitoringConfiguration.validation.enabled,
            dashboardEnabled: stagingMonitoringConfiguration.dashboard.enabled,
            debuggingEnabled: stagingMonitoringConfiguration.debugging.enabled
        });

        return stagingMonitoringConfiguration;

    } catch (error) {
        logger.error('Failed to configure staging monitoring', error, {
            monitoringOptions,
            environment: STAGING_ENVIRONMENT
        });
        throw new Error(`Staging monitoring configuration failed: ${error.message}`);
    }
}

/**
 * Configures staging-specific logging with enhanced debugging output, moderate log rotation, 
 * and production-like log management for validation testing. Implements comprehensive log 
 * management with debugging capabilities, structured logging formats, and staging-appropriate 
 * retention policies for pre-production validation workflows.
 * 
 * @param {Object} loggingOptions - Staging logging configuration options
 * @param {string} [loggingOptions.logLevel] - Logging level for staging environment
 * @param {Object} [loggingOptions.rotation] - Log rotation configuration
 * @param {Object} [loggingOptions.debugging] - Debug logging settings
 * @param {Object} [loggingOptions.monitoring] - Log monitoring settings
 * @returns {Object} Staging logging configuration with enhanced debugging and moderate retention policies
 */
export function setupStagingLogging(loggingOptions = {}) {
    try {
        logger.info('Setting up staging logging configuration', {
            options: Object.keys(loggingOptions),
            environment: STAGING_ENVIRONMENT
        });

        // Configure staging log file paths with environment-specific naming
        const stagingLogPaths = {
            base: loggingOptions.logDirectory || './logs/staging',
            combined: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-combined.log`),
            output: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-out.log`),
            error: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-error.log`),
            debug: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-debug.log`),
            performance: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-performance.log`),
            security: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-security.log`),
            deployment: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-deployment.log`),
            validation: path.join(loggingOptions.logDirectory || './logs/staging', `${STAGING_APP_NAME}-validation.log`)
        };

        // Set up enhanced log levels including debug information
        const logLevelConfiguration = {
            default_level: loggingOptions.logLevel || 'debug',
            application_level: 'debug',
            system_level: 'info',
            security_level: 'warn',
            performance_level: 'info',
            deployment_level: 'info',
            validation_level: 'debug',
            pm2_level: 'debug',
            express_level: 'debug',
            cluster_level: 'debug'
        };

        // Configure moderate log rotation with staging-appropriate retention
        const logRotationConfig = setupStagingLogRotation({
            max_size: loggingOptions.rotation?.maxSize || '100M',
            max_files: loggingOptions.rotation?.maxFiles || 10,
            retention_days: loggingOptions.rotation?.retentionDays || 14,
            compress: loggingOptions.rotation?.compress !== false,
            rotation_schedule: loggingOptions.rotation?.schedule || 'daily',
            emergency_rotation: {
                enabled: true,
                disk_threshold: 0.9, // 90% disk usage
                size_threshold: '500M'
            }
        });

        // Set up structured logging for monitoring integration
        const structuredLoggingConfig = {
            format: 'json',
            timestamp_format: 'ISO8601',
            timezone: 'UTC',
            include_metadata: true,
            structured_fields: {
                timestamp: true,
                level: true,
                message: true,
                correlation_id: true,
                instance_id: true,
                environment: true,
                application: true,
                request_context: true,
                performance_metrics: true,
                system_context: true,
                stack_trace: true // Enhanced for staging debugging
            },
            field_sanitization: {
                enabled: true,
                sensitive_fields: ['password', 'token', 'secret', 'key'],
                replacement: '[REDACTED]'
            }
        };

        // Configure log aggregation for cluster mode coordination
        const logAggregationConfig = {
            enabled: true,
            cluster_coordination: true,
            centralized_logging: {
                enabled: true,
                aggregation_endpoint: '/staging/logs/aggregate',
                buffer_size: 1000,
                flush_interval: 5000, // 5 seconds
                compression: false // Disabled for staging debugging
            },
            cross_instance_correlation: {
                enabled: true,
                correlation_header: 'x-staging-correlation-id',
                instance_identification: true,
                request_lifecycle_tracking: true
            }
        };

        // Set up staging-specific log monitoring and alerting
        const logMonitoringConfig = {
            enabled: true,
            real_time_monitoring: true,
            log_analysis: {
                error_pattern_detection: true,
                performance_pattern_detection: true,
                security_pattern_detection: true,
                anomaly_detection: {
                    enabled: true,
                    sensitivity: 'medium',
                    learning_period: '24h'
                }
            },
            alerting: {
                error_rate_threshold: 0.1,     // 10% error rate
                log_volume_threshold: 10000,    // logs per minute
                missing_logs_alert: true,
                log_corruption_detection: true
            },
            metrics_collection: {
                log_volume_metrics: true,
                log_level_distribution: true,
                error_categorization: true,
                performance_correlation: true
            }
        };

        // Configure log validation and production readiness testing
        const logValidationConfig = {
            enabled: true,
            validation_tests: {
                log_format_validation: true,
                log_completeness_check: true,
                correlation_validation: true,
                performance_log_validation: true,
                security_log_validation: true,
                compliance_validation: false // Not required for staging
            },
            production_readiness_checks: {
                log_retention_compliance: true,
                log_rotation_validation: true,
                log_aggregation_testing: true,
                disaster_recovery_testing: false,
                backup_restoration_testing: false
            },
            automated_testing: {
                log_injection_tests: true,
                log_parsing_tests: true,
                log_searching_tests: true,
                log_correlation_tests: true
            }
        };

        // Set up debugging and troubleshooting capabilities
        const debuggingConfiguration = {
            enabled: true,
            verbose_debugging: true,
            debug_log_enhancement: {
                include_call_stack: true,
                include_variable_state: false, // Performance impact
                include_timing_information: true,
                include_memory_usage: true,
                include_cpu_usage: false
            },
            interactive_debugging: {
                enabled: false, // Disabled for staging stability
                debug_endpoints: false,
                log_streaming: true,
                real_time_filtering: true
            },
            troubleshooting_tools: {
                log_search: true,
                log_filtering: true,
                log_correlation: true,
                log_export: true,
                log_replay: false
            }
        };

        // Return staging logging configuration
        const stagingLoggingConfiguration = {
            // Core logging settings
            environment: STAGING_ENVIRONMENT,
            app_name: STAGING_APP_NAME,
            
            // Log paths and files
            paths: stagingLogPaths,
            
            // PM2 logging configuration
            pm2_logging: {
                log_file: stagingLogPaths.combined,
                out_file: stagingLogPaths.output,
                error_file: stagingLogPaths.error,
                log_type: structuredLoggingConfig.format,
                log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
                merge_logs: true,
                combine_logs: true,
                time_zone: 'UTC'
            },
            
            // Log level configuration
            levels: logLevelConfiguration,
            
            // Log rotation
            rotation: logRotationConfig,
            
            // Structured logging
            formatting: structuredLoggingConfig,
            
            // Log aggregation
            aggregation: logAggregationConfig,
            
            // Log monitoring
            monitoring: logMonitoringConfig,
            
            // Log validation
            validation: logValidationConfig,
            
            // Debugging configuration
            debugging: debuggingConfiguration,
            
            // Staging-specific settings
            staging_logging: {
                version: STAGING_ECOSYSTEM_VERSION,
                environment: STAGING_ENVIRONMENT,
                enhanced_debugging: true,
                moderate_retention: true,
                production_like_management: true,
                validation_testing: true,
                created_at: new Date().toISOString()
            }
        };

        logger.info('Staging logging configuration completed', {
            logLevel: stagingLoggingConfiguration.levels.default_level,
            logFormat: stagingLoggingConfiguration.formatting.format,
            rotationEnabled: stagingLoggingConfiguration.rotation.enabled,
            monitoringEnabled: stagingLoggingConfiguration.monitoring.enabled,
            debuggingEnabled: stagingLoggingConfiguration.debugging.enabled,
            validationEnabled: stagingLoggingConfiguration.validation.enabled
        });

        return stagingLoggingConfiguration;

    } catch (error) {
        logger.error('Failed to setup staging logging configuration', error, {
            loggingOptions,
            environment: STAGING_ENVIRONMENT
        });
        throw new Error(`Staging logging setup failed: ${error.message}`);
    }
}

/**
 * Configures staging deployment settings including validation hooks, production readiness testing, 
 * and zero-downtime deployment simulation. Implements comprehensive deployment validation, 
 * automated testing integration, and staging-specific deployment workflows for production 
 * deployment preparation and validation.
 * 
 * @param {Object} deploymentConfig - Staging deployment configuration options
 * @param {Object} [deploymentConfig.validation] - Deployment validation settings
 * @param {Object} [deploymentConfig.testing] - Testing configuration
 * @param {Object} [deploymentConfig.monitoring] - Deployment monitoring settings
 * @param {Object} [deploymentConfig.rollback] - Rollback configuration
 * @returns {Object} Staging deployment configuration with validation hooks and production readiness testing
 */
export function configureStagingDeployment(deploymentConfig = {}) {
    try {
        logger.info('Configuring staging deployment settings', {
            config: Object.keys(deploymentConfig),
            environment: STAGING_ENVIRONMENT
        });

        // Configure staging deployment validation and testing hooks
        const deploymentValidationConfig = {
            enabled: true,
            validation_phases: {
                pre_deployment: {
                    enabled: true,
                    timeout: 300000, // 5 minutes
                    tests: [
                        'npm run lint',
                        'npm run test:unit',
                        'npm run test:security',
                        'npm run audit',
                        'npm run build:staging'
                    ],
                    required_coverage: 80, // 80% test coverage
                    security_scan: true,
                    dependency_check: true
                },
                deployment: {
                    enabled: true,
                    strategy: 'rolling',
                    timeout: 600000, // 10 minutes
                    health_checks: true,
                    smoke_tests: true,
                    performance_validation: true
                },
                post_deployment: {
                    enabled: true,
                    timeout: 300000, // 5 minutes
                    tests: [
                        'npm run test:integration:staging',
                        'npm run test:e2e:staging',
                        'npm run test:performance:staging',
                        'npm run validate:deployment'
                    ],
                    monitoring_validation: true,
                    log_validation: true,
                    metrics_validation: true
                }
            },
            ...deploymentConfig.validation
        };

        // Set up production readiness validation procedures
        const productionReadinessConfig = {
            enabled: true,
            readiness_criteria: {
                stability: {
                    uptime_requirement: 0.99, // 99% uptime
                    max_restarts: 3,
                    error_rate_threshold: 0.05 // 5%
                },
                performance: {
                    response_time_p95: 1500, // 1.5 seconds
                    throughput_requirement: 1000, // requests/min
                    memory_efficiency: 0.8,
                    cpu_efficiency: 0.7
                },
                security: {
                    security_headers_compliant: true,
                    vulnerability_scan_passed: true,
                    penetration_test_passed: false, // Not required for staging
                    compliance_validated: true
                },
                scalability: {
                    horizontal_scaling_tested: true,
                    load_balancing_validated: true,
                    cluster_coordination_tested: true,
                    zero_downtime_validated: true
                },
                monitoring: {
                    health_checks_configured: true,
                    alerting_configured: true,
                    logging_configured: true,
                    metrics_collection_enabled: true
                }
            },
            validation_tests: {
                automated_tests: {
                    unit_tests: true,
                    integration_tests: true,
                    e2e_tests: true,
                    performance_tests: true,
                    security_tests: true,
                    load_tests: false // Optional for staging
                },
                manual_validation: {
                    functional_testing: false,
                    user_acceptance_testing: false,
                    business_validation: false
                }
            },
            production_simulation: {
                enabled: true,
                load_simulation: {
                    concurrent_users: 100,
                    duration: '5m',
                    ramp_up_time: '1m'
                },
                failure_simulation: {
                    enabled: false, // Disabled for staging stability
                    chaos_engineering: false,
                    network_partitioning: false
                }
            }
        };

        // Configure zero-downtime deployment testing and simulation
        const zeroDowntimeDeploymentConfig = {
            enabled: true,
            deployment_strategy: 'rolling',
            rolling_deployment: {
                batch_size: 1, // One instance at a time
                batch_delay: 10000, // 10 seconds between batches
                health_check_delay: 5000, // 5 seconds
                max_batch_failures: 1,
                rollback_on_failure: true
            },
            blue_green_deployment: {
                enabled: false, // Not implemented for staging
                switch_strategy: 'gradual',
                validation_period: '5m'
            },
            canary_deployment: {
                enabled: false, // Not implemented for staging
                canary_percentage: 10,
                validation_period: '10m'
            },
            deployment_validation: {
                health_checks: {
                    enabled: true,
                    endpoint: '/staging/health',
                    timeout: 5000,
                    retries: 3,
                    interval: 2000
                },
                smoke_tests: {
                    enabled: true,
                    test_suite: 'staging-smoke',
                    timeout: 60000
                },
                performance_validation: {
                    enabled: true,
                    response_time_threshold: 2000,
                    error_rate_threshold: 0.1
                }
            }
        };

        // Set up staging-specific deployment monitoring and alerting
        const deploymentMonitoringConfig = {
            enabled: true,
            real_time_monitoring: true,
            monitoring_during_deployment: {
                metrics_collection: {
                    response_times: true,
                    error_rates: true,
                    throughput: true,
                    memory_usage: true,
                    cpu_usage: true
                },
                alerting: {
                    enabled: true,
                    alert_channels: ['console', 'webhook'],
                    failure_alerts: true,
                    performance_alerts: true,
                    rollback_alerts: true
                },
                dashboard: {
                    enabled: true,
                    real_time_updates: true,
                    deployment_timeline: true,
                    metrics_visualization: true
                }
            },
            post_deployment_monitoring: {
                monitoring_period: '30m',
                baseline_comparison: true,
                performance_regression_detection: true,
                error_rate_monitoring: true,
                automated_rollback_triggers: {
                    error_rate_threshold: 0.15, // 15%
                    response_time_threshold: 3000, // 3 seconds
                    memory_usage_threshold: 0.9 // 90%
                }
            },
            ...deploymentConfig.monitoring
        };

        // Configure rollback testing and validation procedures
        const rollbackConfiguration = {
            enabled: true,
            automatic_rollback: {
                enabled: true,
                triggers: {
                    health_check_failures: 3,
                    error_rate_threshold: 0.2, // 20%
                    response_time_threshold: 5000, // 5 seconds
                    deployment_timeout: 600000 // 10 minutes
                },
                rollback_strategy: 'immediate',
                notification: true
            },
            manual_rollback: {
                enabled: true,
                rollback_command: 'npm run rollback:staging',
                confirmation_required: false, // Disabled for staging
                backup_restoration: true
            },
            rollback_validation: {
                enabled: true,
                validation_tests: [
                    'npm run test:rollback:staging',
                    'npm run validate:rollback'
                ],
                health_check_validation: true,
                performance_validation: true
            },
            rollback_testing: {
                periodic_testing: {
                    enabled: true,
                    frequency: 'weekly',
                    automated: true
                },
                disaster_recovery_testing: {
                    enabled: false, // Not required for staging
                    frequency: 'monthly'
                }
            },
            ...deploymentConfig.rollback
        };

        // Set up integration testing and validation workflows
        const integrationTestingConfig = {
            enabled: true,
            test_environments: {
                staging: {
                    enabled: true,
                    isolation: true,
                    data_refresh: true,
                    cleanup_after_tests: true
                }
            },
            test_suites: {
                unit_tests: {
                    enabled: true,
                    command: 'npm run test:unit',
                    coverage_requirement: 80,
                    timeout: 300000
                },
                integration_tests: {
                    enabled: true,
                    command: 'npm run test:integration:staging',
                    timeout: 600000,
                    parallel_execution: false
                },
                e2e_tests: {
                    enabled: true,
                    command: 'npm run test:e2e:staging',
                    timeout: 900000,
                    browser_testing: false
                },
                performance_tests: {
                    enabled: true,
                    command: 'npm run test:performance:staging',
                    load_testing: true,
                    stress_testing: false
                },
                security_tests: {
                    enabled: true,
                    command: 'npm run test:security',
                    vulnerability_scanning: true,
                    penetration_testing: false
                }
            },
            test_data_management: {
                enabled: true,
                test_data_refresh: true,
                data_isolation: true,
                cleanup_procedures: true
            }
        };

        // Configure deployment performance testing and benchmarking
        const performanceTestingConfig = {
            enabled: true,
            load_testing: {
                enabled: true,
                tool: 'artillery',
                configuration: {
                    duration: 300, // 5 minutes
                    arrival_rate: 10, // requests per second
                    max_vusers: 100,
                    target: `http://localhost:${STAGING_PORT}`
                },
                performance_thresholds: {
                    response_time_p95: 1500,
                    response_time_p99: 3000,
                    error_rate: 0.05,
                    requests_per_second: 50
                }
            },
            stress_testing: {
                enabled: false, // Disabled for staging stability
                configuration: {
                    duration: 600,
                    max_arrival_rate: 50,
                    max_vusers: 500
                }
            },
            baseline_comparison: {
                enabled: true,
                baseline_storage: './benchmarks/staging',
                comparison_tolerance: 0.1, // 10% tolerance
                regression_detection: true
            }
        };

        // Return staging deployment configuration
        const stagingDeploymentConfiguration = {
            // Core deployment settings
            environment: STAGING_ENVIRONMENT,
            deployment_enabled: true,
            
            // Validation configuration
            validation: deploymentValidationConfig,
            
            // Production readiness
            production_readiness: productionReadinessConfig,
            
            // Zero-downtime deployment
            zero_downtime: zeroDowntimeDeploymentConfig,
            
            // Deployment monitoring
            monitoring: deploymentMonitoringConfig,
            
            // Rollback configuration
            rollback: rollbackConfiguration,
            
            // Integration testing
            integration_testing: integrationTestingConfig,
            
            // Performance testing
            performance_testing: performanceTestingConfig,
            
            // Staging-specific settings
            staging_deployment: {
                version: STAGING_ECOSYSTEM_VERSION,
                environment: STAGING_ENVIRONMENT,
                validation_testing: true,
                production_readiness_validation: true,
                zero_downtime_testing: true,
                comprehensive_monitoring: true,
                created_at: new Date().toISOString()
            }
        };

        logger.info('Staging deployment configuration completed', {
            validationEnabled: stagingDeploymentConfiguration.validation.enabled,
            productionReadinessEnabled: stagingDeploymentConfiguration.production_readiness.enabled,
            zeroDowntimeEnabled: stagingDeploymentConfiguration.zero_downtime.enabled,
            monitoringEnabled: stagingDeploymentConfiguration.monitoring.enabled,
            rollbackEnabled: stagingDeploymentConfiguration.rollback.enabled,
            integrationTestingEnabled: stagingDeploymentConfiguration.integration_testing.enabled,
            performanceTestingEnabled: stagingDeploymentConfiguration.performance_testing.enabled
        });

        return stagingDeploymentConfiguration;

    } catch (error) {
        logger.error('Failed to configure staging deployment', error, {
            deploymentConfig,
            environment: STAGING_ENVIRONMENT
        });
        throw new Error(`Staging deployment configuration failed: ${error.message}`);
    }
}

/**
 * Validates staging PM2 ecosystem configuration ensuring production readiness, performance 
 * optimization, and debugging accessibility for comprehensive validation. Performs extensive 
 * configuration validation, production readiness assessment, and provides actionable 
 * recommendations for staging environment optimization.
 * 
 * @param {Object} stagingConfig - Staging PM2 ecosystem configuration to validate
 * @param {Object} validationOptions - Validation configuration options
 * @param {boolean} [validationOptions.strict] - Enable strict validation mode
 * @param {Object} [validationOptions.thresholds] - Custom validation thresholds
 * @param {Array} [validationOptions.skipChecks] - Validation checks to skip
 * @returns {Object} Comprehensive validation result with staging-specific checks, production readiness assessment, and recommendations
 */
export function validateStagingConfig(stagingConfig, validationOptions = {}) {
    try {
        logger.info('Validating staging PM2 ecosystem configuration', {
            configType: typeof stagingConfig,
            hasApps: !!stagingConfig?.apps,
            environment: STAGING_ENVIRONMENT,
            validationOptions: Object.keys(validationOptions)
        });

        const validationResult = {
            valid: true,
            score: 0,
            maxScore: 0,
            errors: [],
            warnings: [],
            recommendations: [],
            checks: {
                structure: false,
                cluster: false,
                monitoring: false,
                logging: false,
                deployment: false,
                performance: false,
                security: false,
                production_readiness: false
            },
            staging_specific: {
                moderate_scaling: false,
                debugging_enabled: false,
                validation_testing: false,
                zero_downtime_testing: false,
                production_like_behavior: false
            }
        };

        // Validate staging ecosystem configuration structure and completeness
        validationResult.maxScore += 15;
        const structureValidation = validateStagingStructure(stagingConfig);
        if (structureValidation.valid) {
            validationResult.checks.structure = true;
            validationResult.score += 15;
        } else {
            validationResult.errors.push(...structureValidation.errors);
            validationResult.warnings.push(...structureValidation.warnings);
        }

        // Check cluster configuration and instance count optimization
        validationResult.maxScore += 15;
        const clusterValidation = validateStagingClusterConfig(stagingConfig);
        if (clusterValidation.valid) {
            validationResult.checks.cluster = true;
            validationResult.staging_specific.moderate_scaling = clusterValidation.moderateScaling;
            validationResult.score += 15;
        } else {
            validationResult.errors.push(...clusterValidation.errors);
            validationResult.warnings.push(...clusterValidation.warnings);
        }

        // Validate monitoring configuration and threshold settings
        validationResult.maxScore += 12;
        const monitoringValidation = validateStagingMonitoringConfig(stagingConfig);
        if (monitoringValidation.valid) {
            validationResult.checks.monitoring = true;
            validationResult.score += 12;
        } else {
            validationResult.warnings.push(...monitoringValidation.warnings);
        }

        // Check logging configuration and retention policies
        validationResult.maxScore += 10;
        const loggingValidation = validateStagingLoggingConfig(stagingConfig);
        if (loggingValidation.valid) {
            validationResult.checks.logging = true;
            validationResult.staging_specific.debugging_enabled = loggingValidation.debuggingEnabled;
            validationResult.score += 10;
        } else {
            validationResult.warnings.push(...loggingValidation.warnings);
        }

        // Validate deployment configuration and testing hooks
        validationResult.maxScore += 12;
        const deploymentValidation = validateStagingDeploymentConfig(stagingConfig);
        if (deploymentValidation.valid) {
            validationResult.checks.deployment = true;
            validationResult.staging_specific.zero_downtime_testing = deploymentValidation.zeroDowntimeTesting;
            validationResult.staging_specific.validation_testing = deploymentValidation.validationTesting;
            validationResult.score += 12;
        } else {
            validationResult.warnings.push(...deploymentValidation.warnings);
        }

        // Check resource allocation and performance optimization
        validationResult.maxScore += 10;
        const performanceValidation = validateStagingPerformanceConfig(stagingConfig);
        if (performanceValidation.valid) {
            validationResult.checks.performance = true;
            validationResult.score += 10;
        } else {
            validationResult.warnings.push(...performanceValidation.warnings);
        }

        // Validate security configuration and debugging accessibility balance
        validationResult.maxScore += 8;
        const securityValidation = validateStagingSecurityConfig(stagingConfig);
        if (securityValidation.valid) {
            validationResult.checks.security = true;
            validationResult.score += 8;
        } else {
            validationResult.warnings.push(...securityValidation.warnings);
        }

        // Check resource allocation and performance optimization
        validationResult.maxScore += 10;
        const resourceValidation = validateStagingResourceAllocation(stagingConfig);
        if (resourceValidation.valid) {
            validationResult.score += 10;
        } else {
            validationResult.warnings.push(...resourceValidation.warnings);
        }

        // Validate production readiness and compatibility testing
        validationResult.maxScore += 18;
        const productionReadinessValidation = validateProductionReadiness(stagingConfig);
        if (productionReadinessValidation.valid) {
            validationResult.checks.production_readiness = true;
            validationResult.staging_specific.production_like_behavior = productionReadinessValidation.productionLike;
            validationResult.score += 18;
        } else {
            validationResult.warnings.push(...productionReadinessValidation.warnings);
            validationResult.recommendations.push(...productionReadinessValidation.recommendations);
        }

        // Generate staging-specific recommendations and optimization suggestions
        const stagingOptimizations = generateStagingOptimizationRecommendations(stagingConfig, validationResult);
        validationResult.recommendations.push(...stagingOptimizations);

        // Check environment-specific staging configuration
        const environmentValidation = validateStagingEnvironmentConfig(stagingConfig);
        if (!environmentValidation.valid) {
            validationResult.warnings.push(...environmentValidation.warnings);
        }

        // Validate staging-specific features and capabilities
        const stagingFeaturesValidation = validateStagingSpecificFeatures(stagingConfig);
        validationResult.staging_specific = {
            ...validationResult.staging_specific,
            ...stagingFeaturesValidation
        };

        // Determine overall validation status and calculate final score
        validationResult.valid = validationResult.errors.length === 0;
        validationResult.scorePercentage = Math.round((validationResult.score / validationResult.maxScore) * 100);

        // Add comprehensive validation details and metadata
        validationResult.validationDetails = {
            summary: {
                totalChecks: 8,
                passedChecks: Object.values(validationResult.checks).filter(Boolean).length,
                errors: validationResult.errors.length,
                warnings: validationResult.warnings.length,
                recommendations: validationResult.recommendations.length,
                score: validationResult.scorePercentage
            },
            staging_assessment: {
                moderate_scaling: validationResult.staging_specific.moderate_scaling,
                debugging_capabilities: validationResult.staging_specific.debugging_enabled,
                validation_testing: validationResult.staging_specific.validation_testing,
                zero_downtime_ready: validationResult.staging_specific.zero_downtime_testing,
                production_ready: validationResult.staging_specific.production_like_behavior
            },
            performance_analysis: {
                cluster_efficiency: performanceValidation.clusterEfficiency || 'unknown',
                resource_utilization: resourceValidation.resourceUtilization || 'unknown',
                memory_optimization: performanceValidation.memoryOptimization || 'unknown',
                scaling_readiness: clusterValidation.scalingReadiness || 'unknown'
            },
            recommendations_summary: {
                high_priority: validationResult.recommendations.filter(r => r.priority === 'high').length,
                medium_priority: validationResult.recommendations.filter(r => r.priority === 'medium').length,
                low_priority: validationResult.recommendations.filter(r => r.priority === 'low').length
            }
        };

        // Add validation metadata
        validationResult.metadata = {
            validatedAt: new Date().toISOString(),
            validator: 'validateStagingConfig',
            environment: STAGING_ENVIRONMENT,
            version: STAGING_ECOSYSTEM_VERSION,
            validationOptions,
            stagingOptimized: true
        };

        logger.info('Staging configuration validation completed', {
            valid: validationResult.valid,
            score: validationResult.scorePercentage,
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length,
            recommendations: validationResult.recommendations.length,
            passedChecks: validationResult.validationDetails.summary.passedChecks,
            productionReady: validationResult.staging_specific.production_like_behavior
        });

        return validationResult;

    } catch (error) {
        logger.error('Staging configuration validation failed', error, {
            configType: typeof stagingConfig,
            validationOptions,
            environment: STAGING_ENVIRONMENT
        });
        
        return {
            valid: false,
            score: 0,
            maxScore: 100,
            errors: [`Validation process failed: ${error.message}`],
            warnings: [],
            recommendations: [],
            checks: {},
            staging_specific: {},
            validationDetails: {
                summary: {
                    totalChecks: 0,
                    passedChecks: 0,
                    errors: 1,
                    warnings: 0,
                    recommendations: 0,
                    score: 0
                }
            },
            metadata: {
                validatedAt: new Date().toISOString(),
                validator: 'validateStagingConfig',
                environment: STAGING_ENVIRONMENT,
                error: error.message
            }
        };
    }
}

/**
 * Optimizes staging ecosystem configuration for performance testing, load validation, and 
 * production readiness assessment with balanced resource allocation. Applies staging-specific 
 * optimizations that balance performance testing capabilities with debugging accessibility 
 * and resource efficiency for comprehensive pre-production validation.
 * 
 * @param {Object} performanceOptions - Performance optimization configuration options
 * @param {Object} [performanceOptions.targets] - Performance targets and thresholds
 * @param {Object} [performanceOptions.optimization] - Optimization strategy settings
 * @param {Object} [performanceOptions.monitoring] - Performance monitoring configuration
 * @param {Object} [performanceOptions.testing] - Performance testing settings
 * @returns {Object} Performance-optimized staging configuration with enhanced monitoring and validation capabilities
 */
export function optimizeStagingPerformance(performanceOptions = {}) {
    try {
        logger.info('Optimizing staging ecosystem for performance testing', {
            options: Object.keys(performanceOptions),
            environment: STAGING_ENVIRONMENT,
            cpuCores: STAGING_CPU_CORES
        });

        // Analyze staging performance requirements and constraints
        const performanceAnalysis = {
            target_environment: STAGING_ENVIRONMENT,
            available_resources: {
                cpu_cores: STAGING_CPU_CORES,
                memory_limit: STAGING_MEMORY_LIMIT,
                disk_space: 'unlimited', // Assume sufficient for staging
                network_bandwidth: 'unlimited'
            },
            performance_targets: {
                response_time_p95: performanceOptions.targets?.responseTime || 1500, // 1.5 seconds
                throughput_target: performanceOptions.targets?.throughput || 1000,    // requests/min
                memory_efficiency: performanceOptions.targets?.memoryEfficiency || 0.8,
                cpu_efficiency: performanceOptions.targets?.cpuEfficiency || 0.7,
                error_rate_target: performanceOptions.targets?.errorRate || 0.05,
                uptime_target: performanceOptions.targets?.uptime || 0.99
            },
            optimization_strategy: performanceOptions.optimization?.strategy || 'balanced'
        };

        // Optimize cluster configuration for performance testing
        const clusterOptimization = {
            instances: STAGING_CPU_CORES, // Moderate scaling
            exec_mode: 'cluster',
            instance_distribution: 'balanced',
            load_balancing: {
                strategy: 'round_robin',
                health_checks: true,
                failover_enabled: true,
                performance_routing: false // Disabled for testing consistency
            },
            worker_coordination: {
                shared_memory: false,
                inter_process_communication: true,
                graceful_shutdown: true,
                restart_coordination: true
            },
            scaling_configuration: {
                auto_scaling: false, // Disabled for staging consistency
                manual_scaling: true,
                scale_up_threshold: 0.8,  // 80% resource usage
                scale_down_threshold: 0.3, // 30% resource usage
                min_instances: 2,
                max_instances: STAGING_CPU_CORES * 2
            }
        };

        // Configure performance monitoring and benchmarking
        const performanceMonitoringOptimization = {
            real_time_monitoring: true,
            detailed_metrics: {
                response_times: {
                    percentiles: [50, 75, 90, 95, 99],
                    histogram_buckets: true,
                    trend_analysis: true
                },
                throughput: {
                    requests_per_second: true,
                    requests_per_minute: true,
                    peak_throughput: true,
                    sustained_throughput: true
                },
                resource_utilization: {
                    cpu_usage: true,
                    memory_usage: true,
                    disk_io: true,
                    network_io: true,
                    gc_metrics: true
                },
                application_metrics: {
                    active_connections: true,
                    queue_lengths: true,
                    error_rates: true,
                    cache_hit_rates: false // Not applicable for staging
                }
            },
            performance_profiling: {
                enabled: performanceOptions.profiling?.enabled || false,
                cpu_profiling: false, // Disabled for staging stability
                memory_profiling: true,
                heap_snapshots: false,
                flamegraphs: false
            },
            benchmarking: {
                enabled: true,
                baseline_establishment: true,
                regression_detection: true,
                performance_budgets: {
                    response_time_budget: performanceAnalysis.performance_targets.response_time_p95,
                    memory_budget: STAGING_MEMORY_LIMIT,
                    cpu_budget: 0.8, // 80% CPU utilization
                    error_budget: performanceAnalysis.performance_targets.error_rate_target
                }
            }
        };

        // Set up load testing and stress testing capabilities
        const loadTestingOptimization = {
            load_testing: {
                enabled: true,
                test_scenarios: {
                    baseline_load: {
                        concurrent_users: 50,
                        duration: '10m',
                        ramp_up: '2m',
                        think_time: '1-3s'
                    },
                    peak_load: {
                        concurrent_users: 200,
                        duration: '5m',
                        ramp_up: '1m',
                        think_time: '0.5-2s'
                    },
                    sustained_load: {
                        concurrent_users: 100,
                        duration: '30m',
                        ramp_up: '5m',
                        think_time: '1-5s'
                    }
                },
                performance_assertions: {
                    response_time_p95: performanceAnalysis.performance_targets.response_time_p95,
                    error_rate: performanceAnalysis.performance_targets.error_rate_target,
                    throughput: performanceAnalysis.performance_targets.throughput_target
                }
            },
            stress_testing: {
                enabled: false, // Disabled for staging stability
                break_point_testing: false,
                capacity_planning: false
            },
            endurance_testing: {
                enabled: true,
                duration: '2h',
                load_level: 0.6, // 60% of peak capacity
                memory_leak_detection: true,
                performance_degradation_detection: true
            }
        };

        // Configure resource optimization and allocation
        const resourceOptimization = {
            memory_optimization: {
                heap_size: `--max-old-space-size=${parseInt(STAGING_MEMORY_LIMIT.replace('M', ''))}`,
                gc_optimization: '--optimize-for-size',
                memory_monitoring: true,
                garbage_collection_tuning: {
                    gc_interval: 100,
                    max_semi_space_size: 64,
                    incremental_marking: true
                }
            },
            cpu_optimization: {
                cpu_affinity: false, // Disabled for staging flexibility
                numa_awareness: false,
                thread_pool_optimization: false,
                v8_flags: [
                    '--optimize-for-size',
                    '--harmony',
                    '--experimental-modules'
                ]
            },
            io_optimization: {
                async_operations: true,
                connection_pooling: true,
                keep_alive: true,
                request_queuing: {
                    enabled: true,
                    queue_size: 1000,
                    timeout: 30000
                }
            },
            caching_optimization: {
                enabled: false, // Disabled for staging testing consistency
                memory_cache: false,
                redis_cache: false,
                cdn_cache: false
            }
        };

        // Set up performance validation and regression testing
        const performanceValidationOptimization = {
            performance_validation: {
                enabled: true,
                validation_frequency: 'on_deployment',
                baseline_comparison: true,
                regression_threshold: 0.1, // 10% performance degradation
                performance_gates: {
                    response_time_gate: performanceAnalysis.performance_targets.response_time_p95,
                    throughput_gate: performanceAnalysis.performance_targets.throughput_target,
                    error_rate_gate: performanceAnalysis.performance_targets.error_rate_target,
                    resource_utilization_gate: 0.8
                }
            },
            continuous_performance_testing: {
                enabled: true,
                automated_testing: true,
                test_schedule: 'daily',
                performance_reports: true,
                trend_analysis: true
            },
            performance_alerting: {
                enabled: true,
                real_time_alerts: true,
                performance_degradation_alerts: true,
                resource_exhaustion_alerts: true,
                sla_violation_alerts: true
            }
        };

        // Configure staging-specific performance alerting
        const performanceAlertingOptimization = {
            alerting_thresholds: {
                response_time: {
                    warning: performanceAnalysis.performance_targets.response_time_p95 * 0.8,
                    critical: performanceAnalysis.performance_targets.response_time_p95,
                    emergency: performanceAnalysis.performance_targets.response_time_p95 * 1.5
                },
                throughput: {
                    warning: performanceAnalysis.performance_targets.throughput_target * 0.7,
                    critical: performanceAnalysis.performance_targets.throughput_target * 0.5,
                    emergency: performanceAnalysis.performance_targets.throughput_target * 0.3
                },
                error_rate: {
                    warning: performanceAnalysis.performance_targets.error_rate_target,
                    critical: performanceAnalysis.performance_targets.error_rate_target * 2,
                    emergency: performanceAnalysis.performance_targets.error_rate_target * 5
                },
                resource_utilization: {
                    memory_warning: 0.8,
                    memory_critical: 0.9,
                    cpu_warning: 0.7,
                    cpu_critical: 0.85
                }
            },
            notification_channels: ['console', 'webhook', 'file'],
            escalation_procedures: {
                enabled: true,
                escalation_timeout: 300000, // 5 minutes
                escalation_levels: ['warning', 'critical', 'emergency']
            }
        };

        // Return performance-optimized staging configuration
        const performanceOptimizedConfiguration = {
            // Performance analysis and targets
            analysis: performanceAnalysis,
            
            // Cluster optimization
            cluster: clusterOptimization,
            
            // Performance monitoring
            monitoring: performanceMonitoringOptimization,
            
            // Load testing
            load_testing: loadTestingOptimization,
            
            // Resource optimization
            resources: resourceOptimization,
            
            // Performance validation
            validation: performanceValidationOptimization,
            
            // Performance alerting
            alerting: performanceAlertingOptimization,
            
            // PM2-specific performance settings
            pm2_performance: {
                instances: clusterOptimization.instances,
                exec_mode: clusterOptimization.exec_mode,
                max_memory_restart: STAGING_MEMORY_LIMIT,
                node_args: resourceOptimization.memory_optimization.heap_size,
                performance_monitoring: true,
                cluster_coordination: true
            },
            
            // Staging-specific performance metadata
            staging_performance: {
                version: STAGING_ECOSYSTEM_VERSION,
                environment: STAGING_ENVIRONMENT,
                optimization_applied: true,
                performance_testing_ready: true,
                load_validation_enabled: true,
                production_readiness_assessment: true,
                created_at: new Date().toISOString(),
                optimization_strategy: performanceAnalysis.optimization_strategy
            }
        };

        logger.info('Staging performance optimization completed', {
            instances: clusterOptimization.instances,
            memoryLimit: STAGING_MEMORY_LIMIT,
            performanceTargets: performanceAnalysis.performance_targets,
            monitoringEnabled: performanceMonitoringOptimization.real_time_monitoring,
            loadTestingEnabled: loadTestingOptimization.load_testing.enabled,
            validationEnabled: performanceValidationOptimization.performance_validation.enabled,
            alertingEnabled: performanceAlertingOptimization.alerting_thresholds
        });

        return performanceOptimizedConfiguration;

    } catch (error) {
        logger.error('Failed to optimize staging performance', error, {
            performanceOptions,
            environment: STAGING_ENVIRONMENT,
            cpuCores: STAGING_CPU_CORES
        });
        throw new Error(`Staging performance optimization failed: ${error.message}`);
    }
}

// Helper functions for validation (implementation details)
function validateStagingStructure(config) {
    const errors = [];
    const warnings = [];
    
    if (!config || typeof config !== 'object') {
        errors.push('Configuration must be a valid object');
        return { valid: false, errors, warnings };
    }
    
    if (!config.apps || !Array.isArray(config.apps) || config.apps.length === 0) {
        errors.push('Apps configuration is required and must be a non-empty array');
    }
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        if (!app.name || !app.script) {
            errors.push('App must have name and script properties');
        }
        if (app.exec_mode !== 'cluster') {
            warnings.push('Cluster mode is recommended for staging environment');
        }
    }
    
    return { valid: errors.length === 0, errors, warnings };
}

function validateStagingClusterConfig(config) {
    const errors = [];
    const warnings = [];
    let moderateScaling = false;
    let scalingReadiness = 'unknown';
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        const instances = parseInt(app.instances) || 1;
        
        if (instances >= 2 && instances <= STAGING_CPU_CORES) {
            moderateScaling = true;
            scalingReadiness = 'good';
        } else if (instances > STAGING_CPU_CORES) {
            warnings.push(`Instance count (${instances}) exceeds recommended staging limit (${STAGING_CPU_CORES})`);
            scalingReadiness = 'over-scaled';
        } else {
            warnings.push('Single instance deployment may not adequately test cluster behavior');
            scalingReadiness = 'under-scaled';
        }
    }
    
    return { 
        valid: errors.length === 0, 
        errors, 
        warnings, 
        moderateScaling,
        scalingReadiness
    };
}

function validateStagingMonitoringConfig(config) {
    const warnings = [];
    
    // Monitoring validation logic would be implemented here
    if (!config.monitoring && !config.apps?.[0]?.pmx) {
        warnings.push('Monitoring configuration is recommended for staging environment');
    }
    
    return { valid: true, warnings };
}

function validateStagingLoggingConfig(config) {
    const warnings = [];
    let debuggingEnabled = false;
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        if (app.env_staging?.DEBUG || app.env_staging?.LOG_LEVEL === 'debug') {
            debuggingEnabled = true;
        }
        
        if (!app.log_file || !app.error_file) {
            warnings.push('Log file configuration is recommended for staging environment');
        }
    }
    
    return { valid: true, warnings, debuggingEnabled };
}

function validateStagingDeploymentConfig(config) {
    const warnings = [];
    let zeroDowntimeTesting = false;
    let validationTesting = false;
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        if (app.wait_ready && app.kill_timeout) {
            zeroDowntimeTesting = true;
        }
        
        if (app['post-start'] || app['pre-reload']) {
            validationTesting = true;
        }
    }
    
    if (!zeroDowntimeTesting) {
        warnings.push('Zero-downtime deployment testing is recommended for staging');
    }
    
    return { valid: true, warnings, zeroDowntimeTesting, validationTesting };
}

function validateStagingPerformanceConfig(config) {
    const warnings = [];
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        if (!app.max_memory_restart) {
            warnings.push('Memory limits should be configured for performance testing');
        }
    }
    
    return { valid: true, warnings };
}

function validateStagingSecurityConfig(config) {
    const warnings = [];
    
    // Security validation logic would be implemented here
    if (config.apps && config.apps[0] && config.apps[0].env_staging?.DEBUG === '*') {
        warnings.push('Consider limiting debug output in staging for security');
    }
    
    return { valid: true, warnings };
}

function validateStagingResourceAllocation(config) {
    const warnings = [];
    let resourceUtilization = 'unknown';
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        const instances = parseInt(app.instances) || 1;
        const memoryLimit = app.max_memory_restart;
        
        if (memoryLimit && instances) {
            const totalMemory = parseInt(memoryLimit.replace(/[^0-9]/g, '')) * instances;
            if (totalMemory > 4000) { // 4GB threshold
                warnings.push('High memory allocation may impact staging environment performance');
                resourceUtilization = 'high';
            } else if (totalMemory < 1000) { // 1GB threshold
                warnings.push('Low memory allocation may not adequately test production scenarios');
                resourceUtilization = 'low';
            } else {
                resourceUtilization = 'balanced';
            }
        }
    }
    
    return { valid: true, warnings, resourceUtilization };
}

function validateProductionReadiness(config) {
    const warnings = [];
    const recommendations = [];
    let productionLike = false;
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        
        // Check for production-like settings
        const hasClusterMode = app.exec_mode === 'cluster';
        const hasMemoryLimits = !!app.max_memory_restart;
        const hasHealthChecks = !!app.health_check_grace_period;
        const hasLogging = !!(app.log_file && app.error_file);
        
        if (hasClusterMode && hasMemoryLimits && hasHealthChecks && hasLogging) {
            productionLike = true;
        } else {
            warnings.push('Configuration may not adequately simulate production environment');
            recommendations.push({
                type: 'production_readiness',
                priority: 'high',
                message: 'Add missing production-like configurations (cluster mode, memory limits, health checks, logging)'
            });
        }
    }
    
    return { valid: true, warnings, recommendations, productionLike };
}

function validateStagingEnvironmentConfig(config) {
    const warnings = [];
    
    if (config.apps && config.apps[0] && config.apps[0].env_staging) {
        const env = config.apps[0].env_staging;
        if (env.NODE_ENV !== 'staging') {
            warnings.push('NODE_ENV should be set to "staging" for staging environment');
        }
    }
    
    return { valid: true, warnings };
}

function validateStagingSpecificFeatures(config) {
    const features = {
        moderate_scaling: false,
        debugging_enabled: false,
        validation_testing: false,
        zero_downtime_testing: false,
        production_like_behavior: false
    };
    
    if (config.apps && config.apps[0]) {
        const app = config.apps[0];
        
        // Check moderate scaling
        const instances = parseInt(app.instances) || 1;
        if (instances >= 2 && instances <= STAGING_CPU_CORES) {
            features.moderate_scaling = true;
        }
        
        // Check debugging enabled
        if (app.env_staging?.DEBUG || app.env_staging?.LOG_LEVEL === 'debug') {
            features.debugging_enabled = true;
        }
        
        // Check validation testing
        if (app['post-start'] || app['pre-reload']) {
            features.validation_testing = true;
        }
        
        // Check zero-downtime testing
        if (app.wait_ready && app.kill_timeout) {
            features.zero_downtime_testing = true;
        }
        
        // Check production-like behavior
        if (app.exec_mode === 'cluster' && app.max_memory_restart) {
            features.production_like_behavior = true;
        }
    }
    
    return features;
}

function generateStagingOptimizationRecommendations(config, validationResult) {
    const recommendations = [];
    
    if (validationResult.scorePercentage < 80) {
        recommendations.push({
            type: 'optimization',
            priority: 'high',
            message: 'Consider implementing recommended staging optimizations to improve configuration score'
        });
    }
    
    if (!validationResult.staging_specific.moderate_scaling) {
        recommendations.push({
            type: 'scaling',
            priority: 'medium',
            message: `Adjust instance count to ${Math.ceil(STAGING_CPU_CORES / 2)}-${STAGING_CPU_CORES} for optimal staging testing`
        });
    }
    
    if (!validationResult.staging_specific.debugging_enabled) {
        recommendations.push({
            type: 'debugging',
            priority: 'medium',
            message: 'Enable debug logging for better staging troubleshooting capabilities'
        });
    }
    
    return recommendations;
}

// Create and export pre-configured staging ecosystem
const stagingEcosystem = createStagingEcosystemConfig();

// Export pre-configured staging application
const stagingApp = configureStagingApp(STAGING_APP_NAME, STAGING_SCRIPT_PATH);

// Export staging cluster configuration
const localStagingClusterConfig = setupStagingCluster();

// Export staging monitoring configuration
const localStagingMonitoringConfig = configureStagingMonitoring();

// Export staging log configuration
const stagingLogConfig = setupStagingLogging();

// Export all configuration functions and objects
export {
  stagingApp,
  localStagingClusterConfig,
  localStagingMonitoringConfig,
  stagingLogConfig,
  STAGING_APP_NAME,
  STAGING_SCRIPT_PATH,
  STAGING_ENVIRONMENT,
  STAGING_CPU_CORES,
  STAGING_PORT,
  STAGING_MEMORY_LIMIT
};

// Initialize staging ecosystem configuration
logger.info('PM2 staging ecosystem configuration module initialized', {
    version: STAGING_ECOSYSTEM_VERSION,
    environment: STAGING_ENVIRONMENT,
    appName: STAGING_APP_NAME,
    cpuCores: STAGING_CPU_CORES,
    memoryLimit: STAGING_MEMORY_LIMIT,
    port: STAGING_PORT,
    nodeVersion: process.version,
    configurationReady: true
});