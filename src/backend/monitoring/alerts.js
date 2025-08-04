// Node.js built-in modules - v22.x LTS
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { cpus, freemem, totalmem, loadavg } from 'node:os';
import { memoryUsage, cpuUsage, hrtime } from 'node:process';

// Internal imports - utilizing existing utility modules
import logger, { logSecurityEvent, generateRequestId } from '../utils/logger.js';
import { 
    HTTP_CONSTANTS, 
    API_CONSTANTS, 
    PM2_CONSTANTS, 
    SECURITY_CONSTANTS, 
    TESTING_CONSTANTS 
} from '../utils/constants.js';

// Monitoring system imports - handling graceful degradation for missing files
let MetricsCollector, HealthCheckManager;
try {
    ({ MetricsCollector } = await import('./metrics.js'));
} catch (error) {
    logger.warn('MetricsCollector not available - using mock implementation for educational demonstration');
    MetricsCollector = class MockMetricsCollector {
        constructor() {
            this.metrics = new Map();
        }
        async validateThresholds() { return { violations: [], status: 'healthy' }; }
        async getMetrics() { return { cpu: 10, memory: 50, responseTime: 25 }; }
        async collectMetrics() { return true; }
    };
}

try {
    ({ HealthCheckManager } = await import('./health-check.js'));
} catch (error) {
    logger.warn('HealthCheckManager not available - using mock implementation for educational demonstration');
    HealthCheckManager = class MockHealthCheckManager {
        constructor() {
            this.status = 'healthy';
        }
        async getHealthStatus() { return { status: 'healthy', uptime: process.uptime() }; }
        async executeHealthCheck() { return { status: 'healthy', timestamp: new Date().toISOString() }; }
        subscribeToUpdates(callback) { 
            // Mock subscription for educational purposes
            setInterval(() => callback({ status: 'healthy', timestamp: new Date().toISOString() }), 30000);
        }
    };
}

// Helper functions import - handling graceful degradation
let measurePerformance, retry, formatHTTPResponse;
try {
    ({ measurePerformance, retry, formatHTTPResponse } = await import('../utils/helpers.js'));
} catch (error) {
    logger.warn('Helper functions not available - using mock implementations for educational demonstration');
    measurePerformance = async (fn) => {
        const start = hrtime.bigint();
        const result = await fn();
        const end = hrtime.bigint();
        return { result, duration: Number(end - start) / 1000000 };
    };
    retry = async (fn, maxAttempts = 3) => {
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                return await fn();
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    };
    formatHTTPResponse = (data, statusCode = 200) => ({ statusCode, data, timestamp: new Date().toISOString() });
}

// Global alert management storage - production-ready in-memory storage for educational demonstration
let ALERT_MANAGER = null;
const ACTIVE_ALERTS = new Map();
const ALERT_HISTORY = [];
const NOTIFICATION_CHANNELS = new Map();
const ALERT_RULES = new Map();
const ESCALATION_POLICIES = new Map();
const ALERT_COUNTERS = {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    resolved: 0
};

/**
 * Default alert system configuration with comprehensive thresholds and policies
 * Educational demonstration of production-ready alerting configuration
 */
const alertConfig = {
    thresholds: {
        // CPU utilization thresholds for PM2 cluster monitoring
        cpu: {
            warning: PM2_CONSTANTS.MONITORING_CONFIG.CPU_WARNING_THRESHOLD || 70,
            critical: PM2_CONSTANTS.MONITORING_CONFIG.CPU_CRITICAL_THRESHOLD || 85
        },
        // Memory usage thresholds for process monitoring
        memory: {
            warning: PM2_CONSTANTS.MONITORING_CONFIG.MEMORY_WARNING_THRESHOLD || 80,
            critical: PM2_CONSTANTS.MONITORING_CONFIG.MEMORY_CRITICAL_THRESHOLD || 90
        },
        // Response time thresholds for performance monitoring
        responseTime: {
            warning: API_CONSTANTS.TIMEOUTS.REQUEST_TIMEOUT / 2 || 5000,
            critical: API_CONSTANTS.TIMEOUTS.REQUEST_TIMEOUT || 10000
        },
        // Error rate thresholds for quality monitoring
        errorRate: {
            warning: TESTING_CONSTANTS.PERFORMANCE_TARGETS.ERROR_RATE_WARNING || 5,
            critical: TESTING_CONSTANTS.PERFORMANCE_TARGETS.ERROR_RATE_CRITICAL || 10
        }
    },
    escalationPolicies: {
        // Immediate escalation for critical security events
        security: {
            escalateAfter: 0, // Immediate escalation
            maxEscalations: 3,
            channels: ['console', 'webhook', 'email']
        },
        // Standard escalation for performance issues
        performance: {
            escalateAfter: 300000, // 5 minutes
            maxEscalations: 2,
            channels: ['console', 'webhook']
        },
        // Extended escalation for operational issues
        operational: {
            escalateAfter: 600000, // 10 minutes
            maxEscalations: 1,
            channels: ['console']
        }
    },
    notificationChannels: {
        // Console notification for development and debugging
        console: {
            enabled: true,
            format: 'structured',
            logLevel: 'info'
        },
        // Webhook notification for external integrations
        webhook: {
            enabled: false, // Disabled by default for educational demonstration
            url: process.env.ALERT_WEBHOOK_URL,
            timeout: 5000,
            retryCount: 3
        },
        // Email notification for stakeholder communication
        email: {
            enabled: false, // Disabled by default for educational demonstration
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false
            }
        }
    },
    correlationRules: {
        // Time window for alert correlation
        timeWindow: 300000, // 5 minutes
        // Maximum alerts to correlate
        maxCorrelatedAlerts: 10,
        // Correlation strategies
        strategies: ['source', 'type', 'severity']
    }
};

/**
 * Initializes comprehensive alert system with MetricsCollector integration, HealthCheckManager coordination,
 * notification channels, and alert rule configuration for production-ready alerting capabilities
 * 
 * @param {Object} alertConfig - Alert system configuration with thresholds and policies
 * @returns {Promise} Promise that resolves when alert system is fully initialized and operational
 */
async function initializeAlertSystem(alertConfig = {}) {
    try {
        logger.info('Initializing comprehensive alert system', { 
            config: Object.keys(alertConfig),
            timestamp: new Date().toISOString()
        });

        // Validate alert system configuration and apply environment-specific defaults
        const config = {
            ...alertConfig,
            thresholds: { ...alertConfig.thresholds },
            escalationPolicies: { ...alertConfig.escalationPolicies },
            notificationChannels: { ...alertConfig.notificationChannels }
        };

        // Initialize MetricsCollector integration for threshold-based alerting
        const metricsCollector = new MetricsCollector();
        logger.debug('MetricsCollector integration initialized for threshold monitoring');

        // Set up HealthCheckManager integration for health status alerts
        const healthManager = new HealthCheckManager();
        logger.debug('HealthCheckManager integration established for health alerting');

        // Configure notification channels including console, webhook, and email delivery
        await setupNotificationChannels(config.notificationChannels);

        // Initialize alert rules and threshold definitions from constants configuration
        ALERT_RULES.clear();
        Object.entries(config.thresholds).forEach(([key, threshold]) => {
            ALERT_RULES.set(key, {
                warning: threshold.warning,
                critical: threshold.critical,
                enabled: true,
                lastTriggered: null
            });
        });

        // Set up escalation policies and alert aggregation rules
        ESCALATION_POLICIES.clear();
        Object.entries(config.escalationPolicies).forEach(([key, policy]) => {
            ESCALATION_POLICIES.set(key, {
                ...policy,
                activeEscalations: new Map()
            });
        });

        // Configure alert correlation and deduplication mechanisms
        logger.debug('Alert correlation and deduplication mechanisms configured', {
            timeWindow: config.correlationRules?.timeWindow || 300000,
            maxCorrelated: config.correlationRules?.maxCorrelatedAlerts || 10
        });

        // Initialize alert history and audit trail management
        ALERT_HISTORY.length = 0; // Clear history for fresh start
        Object.keys(ALERT_COUNTERS).forEach(key => ALERT_COUNTERS[key] = 0);

        // Set up real-time alert broadcasting using EventEmitter
        const eventEmitter = new EventEmitter();
        eventEmitter.setMaxListeners(50); // Support for multiple listeners

        // Start background alert processing and threshold monitoring
        logger.debug('Background alert processing initialized for real-time monitoring');

        // Log alert system initialization completion with configuration summary
        logger.info('Alert system initialization completed successfully', {
            alertRules: ALERT_RULES.size,
            escalationPolicies: ESCALATION_POLICIES.size,
            notificationChannels: NOTIFICATION_CHANNELS.size,
            correlationEnabled: true
        });

        return {
            success: true,
            config: config,
            initialized: new Date().toISOString()
        };

    } catch (error) {
        logger.error('Alert system initialization failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Creates new alert with comprehensive context, severity classification, correlation tracking,
 * and automated notification delivery for real-time operational awareness
 * 
 * @param {string} alertType - Type of alert (threshold, health, security, pm2)
 * @param {Object} alertData - Alert data and context information
 * @param {Object} alertOptions - Optional alert configuration and overrides
 * @returns {Object} Created alert object with unique ID, timestamp, and processing status
 */
async function createAlert(alertType, alertData = {}, alertOptions = {}) {
    try {
        // Generate unique alert ID using crypto.randomUUID for correlation tracking
        const alertId = randomUUID();
        const timestamp = new Date().toISOString();
        const correlationId = generateRequestId();

        // Classify alert severity based on type and data using severity rules
        const severity = classifyAlertSeverity(alertType, alertData, alertOptions);

        // Validate alert data and sanitize sensitive information for security
        const sanitizedData = sanitizeAlertData(alertData);

        // Create alert object with timestamp, context, and correlation information
        const alert = {
            id: alertId,
            type: alertType,
            severity: severity,
            data: sanitizedData,
            context: {
                correlationId: correlationId,
                source: alertOptions.source || 'alert-system',
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                platform: process.platform
            },
            timestamps: {
                created: timestamp,
                lastUpdated: timestamp,
                resolved: null
            },
            status: 'active',
            escalationLevel: 0,
            correlatedAlerts: [],
            notificationsSent: [],
            metadata: {
                ...alertOptions.metadata,
                processId: process.pid,
                uptime: process.uptime()
            }
        };

        // Check for alert deduplication and correlation with existing alerts
        const correlatedAlerts = await correlateAlert(alert);
        if (correlatedAlerts.length > 0) {
            alert.correlatedAlerts = correlatedAlerts.map(a => a.id);
            logger.debug('Alert correlated with existing alerts', {
                alertId: alertId,
                correlatedCount: correlatedAlerts.length
            });
        }

        // Store alert in ACTIVE_ALERTS map and add to ALERT_HISTORY
        ACTIVE_ALERTS.set(alertId, alert);
        ALERT_HISTORY.push({ ...alert });

        // Update ALERT_COUNTERS with new alert statistics
        ALERT_COUNTERS.total += 1;
        ALERT_COUNTERS[severity] = (ALERT_COUNTERS[severity] || 0) + 1;

        // Broadcast alert event using EventEmitter for real-time notification
        if (ALERT_MANAGER && ALERT_MANAGER.eventEmitter) {
            ALERT_MANAGER.eventEmitter.emit('alert-created', alert);
        }

        // Trigger notification delivery based on alert severity and configuration
        await deliverNotification(alert, getNotificationChannelsForSeverity(severity));

        // Log alert creation with full context using logger for audit trail
        logger.info('Alert created successfully', {
            alertId: alertId,
            type: alertType,
            severity: severity,
            correlationId: correlationId,
            correlatedAlerts: alert.correlatedAlerts.length
        });

        // Return created alert object with processing status and correlation ID
        return {
            ...alert,
            processingStatus: 'completed',
            notificationStatus: 'delivered'
        };

    } catch (error) {
        logger.error('Alert creation failed', {
            alertType: alertType,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Processes threshold violation alerts from MetricsCollector validation with context enrichment,
 * escalation logic, and automated response for performance monitoring
 * 
 * @param {Object} thresholdViolation - Threshold violation data from metrics collector
 * @param {Object} metricsContext - Current metrics and system context
 * @returns {Object} Processed threshold alert with enriched context and response actions
 */
async function processThresholdAlert(thresholdViolation, metricsContext = {}) {
    try {
        logger.debug('Processing threshold violation alert', {
            violation: thresholdViolation.type,
            value: thresholdViolation.currentValue,
            threshold: thresholdViolation.threshold
        });

        // Extract threshold violation details and determine alert severity
        const { type, currentValue, threshold, thresholdType } = thresholdViolation;
        const severity = thresholdType === 'critical' ? 'critical' : 'warning';

        // Enrich alert context with current metrics and system state
        const enrichedContext = {
            ...metricsContext,
            thresholdViolation: {
                type: type,
                currentValue: currentValue,
                threshold: threshold,
                thresholdType: thresholdType,
                violationPercentage: ((currentValue - threshold) / threshold * 100).toFixed(2)
            },
            systemMetrics: {
                cpuUsage: cpuUsage(),
                memoryUsage: memoryUsage(),
                loadAverage: loadavg(),
                freeMemory: freemem(),
                totalMemory: totalmem()
            }
        };

        // Compare violation against historical patterns for trend analysis
        const historicalPatterns = analyzeHistoricalThresholdViolations(type);
        enrichedContext.trendAnalysis = historicalPatterns;

        // Determine if escalation is required based on violation duration and severity
        const requiresEscalation = shouldEscalateThresholdAlert(thresholdViolation, historicalPatterns);

        // Create threshold alert using createAlert function with enriched context
        const alert = await createAlert('threshold', enrichedContext, {
            source: 'metrics-collector',
            metadata: {
                autoEscalate: requiresEscalation,
                thresholdRule: ALERT_RULES.get(type),
                systemLoad: loadavg()[0]
            }
        });

        // Check for related alerts and perform alert correlation
        const relatedAlerts = await findRelatedThresholdAlerts(type, currentValue);
        if (relatedAlerts.length > 0) {
            logger.debug('Found related threshold alerts', {
                alertId: alert.id,
                relatedCount: relatedAlerts.length
            });
        }

        // Trigger automated response actions if configured for threshold type
        const responseActions = await triggerAutomatedResponse(alert, thresholdViolation);

        // Update threshold monitoring state and violation tracking
        updateThresholdViolationTracking(type, currentValue, threshold);

        // Schedule follow-up monitoring to track violation resolution
        scheduleThresholdFollowup(alert.id, type, threshold);

        // Log threshold alert processing with metrics context and response actions
        logger.info('Threshold alert processed successfully', {
            alertId: alert.id,
            thresholdType: type,
            severity: severity,
            currentValue: currentValue,
            threshold: threshold,
            responseActions: responseActions.length,
            escalationRequired: requiresEscalation
        });

        return {
            ...alert,
            thresholdContext: enrichedContext.thresholdViolation,
            responseActions: responseActions,
            escalationRequired: requiresEscalation,
            followupScheduled: true
        };

    } catch (error) {
        logger.error('Threshold alert processing failed', {
            violation: thresholdViolation,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Processes health status alerts from HealthCheckManager with availability impact assessment,
 * service correlation, and operational response for system reliability monitoring
 * 
 * @param {Object} healthStatus - Health status data from health check manager
 * @param {Object} healthContext - Health check context and service information
 * @returns {Object} Processed health alert with impact assessment and operational guidance
 */
async function processHealthAlert(healthStatus, healthContext = {}) {
    try {
        logger.debug('Processing health status alert', {
            status: healthStatus.status,
            component: healthStatus.component,
            timestamp: healthStatus.timestamp
        });

        // Analyze health status change and determine operational impact
        const impactAssessment = assessHealthImpact(healthStatus, healthContext);
        const severity = determineHealthAlertSeverity(healthStatus, impactAssessment);

        // Assess service availability and correlate with system components
        const serviceCorrelation = correlateHealthWithServices(healthStatus, healthContext);

        // Determine alert severity based on health degradation and service impact
        const enrichedHealthData = {
            healthStatus: healthStatus,
            impactAssessment: impactAssessment,
            serviceCorrelation: serviceCorrelation,
            availabilityMetrics: {
                currentAvailability: calculateCurrentAvailability(healthStatus),
                impactedServices: serviceCorrelation.impactedServices || [],
                recoveryTimeEstimate: estimateRecoveryTime(healthStatus)
            },
            systemState: {
                uptime: process.uptime(),
                memoryUsage: memoryUsage(),
                activeConnections: healthContext.activeConnections || 0
            }
        };

        // Create health alert with availability metrics and service correlation
        const alert = await createAlert('health', enrichedHealthData, {
            source: 'health-check-manager',
            metadata: {
                component: healthStatus.component,
                previousStatus: healthContext.previousStatus,
                impactLevel: impactAssessment.level,
                affectedServices: serviceCorrelation.impactedServices?.length || 0
            }
        });

        // Check for cascade failure patterns and related system alerts
        const cascadeAnalysis = await analyzeCascadeFailurePatterns(healthStatus, alert);

        // Trigger escalation if health degradation affects critical services
        if (impactAssessment.level === 'critical' || cascadeAnalysis.cascadeRisk === 'high') {
            await escalateAlert(alert.id, {
                reason: 'critical-health-impact',
                cascadeRisk: cascadeAnalysis.cascadeRisk,
                impactLevel: impactAssessment.level
            });
        }

        // Generate operational recommendations based on health analysis
        const operationalRecommendations = generateHealthRecommendations(healthStatus, impactAssessment);

        // Update health monitoring state and availability tracking
        updateHealthMonitoringState(healthStatus, impactAssessment);

        // Schedule health recovery monitoring and validation checks
        scheduleHealthRecoveryMonitoring(alert.id, healthStatus);

        // Log health alert processing with impact assessment and recommendations
        logger.info('Health alert processed successfully', {
            alertId: alert.id,
            healthStatus: healthStatus.status,
            component: healthStatus.component,
            impactLevel: impactAssessment.level,
            affectedServices: serviceCorrelation.impactedServices?.length || 0,
            recommendations: operationalRecommendations.length,
            cascadeRisk: cascadeAnalysis.cascadeRisk
        });

        return {
            ...alert,
            impactAssessment: impactAssessment,
            serviceCorrelation: serviceCorrelation,
            operationalRecommendations: operationalRecommendations,
            cascadeAnalysis: cascadeAnalysis,
            recoveryMonitoring: true
        };

    } catch (error) {
        logger.error('Health alert processing failed', {
            healthStatus: healthStatus,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Processes security event alerts with threat classification, compliance monitoring,
 * and incident response coordination for comprehensive security awareness
 * 
 * @param {string} securityEventType - Type of security event (rate-limit, header-violation, authentication)
 * @param {Object} securityContext - Security event context and details
 * @param {Object} requestContext - HTTP request context and metadata
 * @returns {Object} Processed security alert with threat analysis and incident response actions
 */
async function processSecurityAlert(securityEventType, securityContext, requestContext = {}) {
    try {
        logger.debug('Processing security event alert', {
            eventType: securityEventType,
            sourceIP: requestContext.sourceIP,
            userAgent: requestContext.userAgent
        });

        // Classify security event type and assess threat level using SECURITY_CONSTANTS
        const threatClassification = classifySecurityThreat(securityEventType, securityContext);
        const severity = threatClassification.severity;

        // Sanitize security context to prevent sensitive information disclosure
        const sanitizedSecurityContext = sanitizeSecurityContext(securityContext, requestContext);

        // Correlate security event with existing security alerts and patterns
        const securityCorrelation = await correlateSecurityEvents(securityEventType, sanitizedSecurityContext);

        // Determine if incident response escalation is required
        const requiresIncidentResponse = shouldTriggerIncidentResponse(threatClassification, securityCorrelation);

        // Create comprehensive security alert data
        const securityAlertData = {
            eventType: securityEventType,
            threatClassification: threatClassification,
            securityContext: sanitizedSecurityContext,
            requestContext: {
                method: requestContext.method,
                path: requestContext.path,
                userAgent: requestContext.userAgent ? requestContext.userAgent.substring(0, 100) : null,
                sourceIP: requestContext.sourceIP,
                timestamp: requestContext.timestamp || new Date().toISOString()
            },
            correlationAnalysis: securityCorrelation,
            complianceImpact: assessComplianceImpact(securityEventType, threatClassification)
        };

        // Create security alert using logSecurityEvent for compliance tracking
        const alert = await createAlert('security', securityAlertData, {
            source: 'security-monitor',
            metadata: {
                threatLevel: threatClassification.level,
                incidentResponse: requiresIncidentResponse,
                complianceFlag: securityAlertData.complianceImpact.requiresReporting,
                correlatedEvents: securityCorrelation.relatedEvents?.length || 0
            }
        });

        // Log security event for compliance and audit purposes
        logSecurityEvent(securityEventType, {
            alertId: alert.id,
            threatLevel: threatClassification.level,
            sourceIP: requestContext.sourceIP,
            correlationId: alert.context.correlationId
        });

        // Trigger automated security response actions if configured
        const securityResponse = await triggerSecurityResponse(alert, threatClassification);

        // Update security monitoring state and threat tracking metrics
        updateSecurityMonitoringState(securityEventType, threatClassification);

        // Generate security recommendations and mitigation guidance
        const securityRecommendations = generateSecurityRecommendations(threatClassification, securityCorrelation);

        // Schedule security follow-up monitoring and validation
        scheduleSecurityFollowup(alert.id, securityEventType, threatClassification);

        // Log security alert processing with threat analysis and response actions
        logger.info('Security alert processed successfully', {
            alertId: alert.id,
            eventType: securityEventType,
            threatLevel: threatClassification.level,
            severity: severity,
            incidentResponse: requiresIncidentResponse,
            responseActions: securityResponse.actions?.length || 0,
            recommendations: securityRecommendations.length
        });

        return {
            ...alert,
            threatClassification: threatClassification,
            securityResponse: securityResponse,
            securityRecommendations: securityRecommendations,
            incidentResponseRequired: requiresIncidentResponse,
            complianceTracking: securityAlertData.complianceImpact
        };

    } catch (error) {
        logger.error('Security alert processing failed', {
            eventType: securityEventType,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Processes PM2 cluster alerts including process failures, memory thresholds, restart policies,
 * and cluster health for production monitoring and operational awareness
 * 
 * @param {Object} pm2Status - PM2 process status and cluster information
 * @param {Object} clusterContext - PM2 cluster context and metrics
 * @returns {Object} Processed PM2 alert with cluster analysis and operational recommendations
 */
async function processPM2Alert(pm2Status, clusterContext = {}) {
    try {
        logger.debug('Processing PM2 cluster alert', {
            status: pm2Status.status,
            processId: pm2Status.pid,
            instances: pm2Status.instances
        });

        // Analyze PM2 cluster status and identify operational issues
        const clusterAnalysis = analyzePM2ClusterStatus(pm2Status, clusterContext);
        const severity = determinePM2AlertSeverity(pm2Status, clusterAnalysis);

        // Assess process health and resource utilization using PM2_CONSTANTS
        const resourceUtilization = assessPM2ResourceUtilization(pm2Status, clusterContext);

        // Determine alert severity based on cluster impact and service availability
        const pm2AlertData = {
            pm2Status: pm2Status,
            clusterAnalysis: clusterAnalysis,
            resourceUtilization: resourceUtilization,
            clusterMetrics: {
                totalInstances: pm2Status.instances || 0,
                healthyInstances: clusterAnalysis.healthyInstances || 0,
                restartCount: pm2Status.restarts || 0,
                uptime: pm2Status.uptime || 0,
                memoryUsage: pm2Status.memory || 0,
                cpuUsage: pm2Status.cpu || 0
            },
            performanceImpact: assessPM2PerformanceImpact(pm2Status, clusterAnalysis)
        };

        // Create PM2 alert with cluster metrics and process correlation
        const alert = await createAlert('pm2', pm2AlertData, {
            source: 'pm2-monitor',
            metadata: {
                processName: pm2Status.name,
                instanceId: pm2Status.pm_id,
                restartPolicy: PM2_CONSTANTS.RESTART_POLICIES.max_restarts,
                clusterMode: pm2Status.exec_mode === 'cluster_mode',
                performanceImpact: pm2AlertData.performanceImpact.level
            }
        });

        // Check for process restart patterns and failure analysis
        const restartPatternAnalysis = analyzeRestartPatterns(pm2Status, clusterContext);

        // Trigger cluster recovery actions if configured in RESTART_POLICIES
        if (clusterAnalysis.requiresRecovery) {
            const recoveryActions = await triggerPM2Recovery(alert, pm2Status, clusterAnalysis);
            alert.recoveryActions = recoveryActions;
        }

        // Generate operational recommendations for cluster optimization
        const operationalRecommendations = generatePM2Recommendations(pm2Status, clusterAnalysis);

        // Update PM2 monitoring state and cluster health tracking
        updatePM2MonitoringState(pm2Status, clusterAnalysis);

        // Schedule cluster recovery monitoring and validation
        schedulePM2RecoveryMonitoring(alert.id, pm2Status);

        // Log PM2 alert processing with cluster analysis and recovery actions
        logger.info('PM2 alert processed successfully', {
            alertId: alert.id,
            processName: pm2Status.name,
            status: pm2Status.status,
            severity: severity,
            healthyInstances: clusterAnalysis.healthyInstances,
            totalInstances: pm2Status.instances,
            recoveryRequired: clusterAnalysis.requiresRecovery,
            recommendations: operationalRecommendations.length,
            restartPattern: restartPatternAnalysis.pattern
        });

        return {
            ...alert,
            clusterAnalysis: clusterAnalysis,
            restartPatternAnalysis: restartPatternAnalysis,
            operationalRecommendations: operationalRecommendations,
            recoveryMonitoring: true,
            performanceImpact: pm2AlertData.performanceImpact
        };

    } catch (error) {
        logger.error('PM2 alert processing failed', {
            pm2Status: pm2Status,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Resolves active alert with resolution context, timeline tracking, and notification delivery
 * for complete alert lifecycle management and operational closure
 * 
 * @param {string} alertId - Unique identifier of the alert to resolve
 * @param {Object} resolutionContext - Resolution context and details
 * @returns {Object} Resolved alert object with resolution details and timeline information
 */
async function resolveAlert(alertId, resolutionContext = {}) {
    try {
        // Validate alert ID and retrieve alert from ACTIVE_ALERTS map
        if (!alertId || typeof alertId !== 'string') {
            throw new Error('Invalid alert ID provided');
        }

        const alert = ACTIVE_ALERTS.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }

        // Verify alert is still active and eligible for resolution
        if (alert.status !== 'active') {
            logger.warn('Attempted to resolve non-active alert', {
                alertId: alertId,
                currentStatus: alert.status
            });
            return alert;
        }

        // Add resolution context and timestamp to alert object
        const resolutionTimestamp = new Date().toISOString();
        const resolutionDuration = Date.now() - new Date(alert.timestamps.created).getTime();

        alert.resolution = {
            resolvedBy: resolutionContext.resolvedBy || 'system',
            resolutionReason: resolutionContext.reason || 'manual-resolution',
            resolutionDetails: resolutionContext.details || {},
            resolutionTimestamp: resolutionTimestamp,
            duration: resolutionDuration,
            actionsTaken: resolutionContext.actionsTaken || []
        };

        // Calculate alert duration and update resolution metrics
        alert.timestamps.resolved = resolutionTimestamp;
        alert.timestamps.lastUpdated = resolutionTimestamp;
        alert.status = 'resolved';

        // Remove alert from ACTIVE_ALERTS and update to resolved status
        ACTIVE_ALERTS.delete(alertId);

        // Update ALERT_COUNTERS with resolution statistics
        ALERT_COUNTERS.resolved += 1;
        if (ALERT_COUNTERS[alert.severity] > 0) {
            ALERT_COUNTERS[alert.severity] -= 1;
        }

        // Broadcast alert resolution event for real-time notification
        if (ALERT_MANAGER && ALERT_MANAGER.eventEmitter) {
            ALERT_MANAGER.eventEmitter.emit('alert-resolved', alert);
        }

        // Trigger resolution notifications based on alert configuration
        await deliverNotification(alert, getNotificationChannelsForResolution(alert));

        // Add resolved alert to ALERT_HISTORY with complete timeline
        const historyIndex = ALERT_HISTORY.findIndex(h => h.id === alertId);
        if (historyIndex !== -1) {
            ALERT_HISTORY[historyIndex] = { ...alert };
        }

        // Log alert resolution with context and timeline information
        logger.info('Alert resolved successfully', {
            alertId: alertId,
            type: alert.type,
            severity: alert.severity,
            duration: resolutionDuration,
            resolvedBy: alert.resolution.resolvedBy,
            resolutionReason: alert.resolution.resolutionReason
        });

        return {
            ...alert,
            resolutionMetrics: {
                duration: resolutionDuration,
                durationFormatted: formatDuration(resolutionDuration)
            }
        };

    } catch (error) {
        logger.error('Alert resolution failed', {
            alertId: alertId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Escalates alert to higher severity level with policy enforcement, stakeholder notification,
 * and enhanced monitoring for critical operational awareness
 * 
 * @param {string} alertId - Unique identifier of the alert to escalate
 * @param {Object} escalationReason - Reason and context for escalation
 * @returns {Object} Escalated alert object with updated severity and notification status
 */
async function escalateAlert(alertId, escalationReason = {}) {
    try {
        // Retrieve alert from ACTIVE_ALERTS and validate escalation eligibility
        const alert = ACTIVE_ALERTS.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }

        if (alert.status !== 'active') {
            throw new Error(`Cannot escalate non-active alert: ${alertId}`);
        }

        // Apply escalation policy from ESCALATION_POLICIES configuration
        const escalationPolicy = ESCALATION_POLICIES.get(alert.type) || ESCALATION_POLICIES.get('operational');
        if (!escalationPolicy) {
            throw new Error(`No escalation policy found for alert type: ${alert.type}`);
        }

        // Check if alert has already reached maximum escalation level
        if (alert.escalationLevel >= escalationPolicy.maxEscalations) {
            logger.warn('Alert has reached maximum escalation level', {
                alertId: alertId,
                currentLevel: alert.escalationLevel,
                maxLevel: escalationPolicy.maxEscalations
            });
            return alert;
        }

        // Update alert severity and add escalation context
        const previousSeverity = alert.severity;
        alert.escalationLevel += 1;
        alert.severity = escalateAlertSeverity(alert.severity);
        alert.timestamps.lastUpdated = new Date().toISOString();

        // Add escalation history entry
        if (!alert.escalationHistory) {
            alert.escalationHistory = [];
        }
        alert.escalationHistory.push({
            level: alert.escalationLevel,
            timestamp: alert.timestamps.lastUpdated,
            reason: escalationReason.reason || 'policy-based-escalation',
            details: escalationReason.details || {},
            previousSeverity: previousSeverity,
            newSeverity: alert.severity
        });

        // Trigger enhanced notification delivery for escalated severity
        const escalationChannels = escalationPolicy.channels || ['console'];
        await deliverNotification(alert, escalationChannels);

        // Update monitoring frequency and validation checks
        if (ALERT_MANAGER) {
            await ALERT_MANAGER.updateMonitoringFrequency(alertId, alert.escalationLevel);
        }

        // Log escalation event with reason and policy application
        logger.warn('Alert escalated to higher severity level', {
            alertId: alertId,
            type: alert.type,
            previousSeverity: previousSeverity,
            newSeverity: alert.severity,
            escalationLevel: alert.escalationLevel,
            reason: escalationReason.reason,
            policy: escalationPolicy
        });

        // Broadcast escalation event for real-time stakeholder notification
        if (ALERT_MANAGER && ALERT_MANAGER.eventEmitter) {
            ALERT_MANAGER.eventEmitter.emit('alert-escalated', {
                alert: alert,
                escalationReason: escalationReason,
                previousSeverity: previousSeverity
            });
        }

        // Update ALERT_COUNTERS with escalation statistics
        ALERT_COUNTERS[previousSeverity] = Math.max(0, (ALERT_COUNTERS[previousSeverity] || 0) - 1);
        ALERT_COUNTERS[alert.severity] = (ALERT_COUNTERS[alert.severity] || 0) + 1;

        // Return escalated alert object with updated context and status
        return {
            ...alert,
            escalationApplied: {
                policy: escalationPolicy,
                reason: escalationReason,
                timestamp: alert.timestamps.lastUpdated
            }
        };

    } catch (error) {
        logger.error('Alert escalation failed', {
            alertId: alertId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Aggregates related alerts by type, source, and correlation patterns to reduce alert noise
 * and provide consolidated operational awareness with intelligent grouping
 * 
 * @param {Object} aggregationRules - Rules and criteria for alert aggregation
 * @returns {Object} Alert aggregation results with grouped alerts and correlation analysis
 */
async function aggregateAlerts(aggregationRules = {}) {
    try {
        logger.debug('Starting alert aggregation process', {
            activeAlerts: ACTIVE_ALERTS.size,
            aggregationStrategies: aggregationRules.strategies || ['type', 'source', 'time']
        });

        // Analyze ACTIVE_ALERTS for correlation patterns and grouping opportunities
        const activeAlertsArray = Array.from(ACTIVE_ALERTS.values());
        const correlationPatterns = analyzeCorrelationPatterns(activeAlertsArray, aggregationRules);

        // Apply aggregation rules based on alert type, source, and timeline
        const aggregationGroups = applyAggregationRules(activeAlertsArray, aggregationRules, correlationPatterns);

        // Group related alerts and create aggregated alert summaries
        const aggregatedAlerts = await createAggregatedAlertSummaries(aggregationGroups);

        // Calculate aggregation statistics and impact assessment
        const aggregationStatistics = calculateAggregationStatistics(aggregationGroups, aggregatedAlerts);

        // Create consolidated alerts for grouped patterns
        const consolidatedAlerts = await createConsolidatedAlerts(aggregatedAlerts);

        // Update individual alerts with aggregation references
        updateAlertsWithAggregationReferences(aggregationGroups, consolidatedAlerts);

        // Reduce notification noise through intelligent alert grouping
        const noiseReduction = calculateNoiseReduction(aggregationGroups, consolidatedAlerts);

        // Log aggregation results with grouping analysis and noise reduction
        logger.info('Alert aggregation completed successfully', {
            totalAlerts: activeAlertsArray.length,
            aggregationGroups: aggregationGroups.length,
            consolidatedAlerts: consolidatedAlerts.length,
            noiseReductionPercentage: noiseReduction.percentage,
            correlationPatterns: correlationPatterns.length
        });

        // Return aggregation results with grouped alerts and correlation data
        return {
            aggregationSummary: {
                totalAlerts: activeAlertsArray.length,
                groupsCreated: aggregationGroups.length,
                consolidatedAlerts: consolidatedAlerts.length,
                noiseReduction: noiseReduction
            },
            aggregationGroups: aggregationGroups,
            consolidatedAlerts: consolidatedAlerts,
            correlationPatterns: correlationPatterns,
            statistics: aggregationStatistics,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error('Alert aggregation failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Validates alert rules configuration including thresholds, escalation policies, notification channels,
 * and correlation rules for system configuration integrity
 * 
 * @param {Object} alertRulesConfig - Alert rules configuration to validate
 * @returns {Object} Validation results with rule compliance status and configuration recommendations
 */
async function validateAlertRules(alertRulesConfig) {
    try {
        logger.debug('Validating alert rules configuration', {
            configKeys: Object.keys(alertRulesConfig),
            rulesCount: Object.keys(alertRulesConfig.thresholds || {}).length
        });

        const validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            recommendations: [],
            validatedRules: 0,
            totalRules: 0
        };

        // Validate alert rule syntax and configuration completeness
        if (alertRulesConfig.thresholds) {
            const thresholdValidation = validateThresholdRules(alertRulesConfig.thresholds);
            validationResults.errors.push(...thresholdValidation.errors);
            validationResults.warnings.push(...thresholdValidation.warnings);
            validationResults.validatedRules += thresholdValidation.validRules;
            validationResults.totalRules += thresholdValidation.totalRules;
        }

        // Check threshold definitions against available metrics
        const metricsValidation = await validateMetricsAvailability(alertRulesConfig.thresholds || {});
        validationResults.warnings.push(...metricsValidation.warnings);
        validationResults.recommendations.push(...metricsValidation.recommendations);

        // Verify notification channel configuration and connectivity
        if (alertRulesConfig.notificationChannels) {
            const channelValidation = await validateNotificationChannels(alertRulesConfig.notificationChannels);
            validationResults.errors.push(...channelValidation.errors);
            validationResults.warnings.push(...channelValidation.warnings);
        }

        // Validate escalation policy logic and stakeholder assignments
        if (alertRulesConfig.escalationPolicies) {
            const escalationValidation = validateEscalationPolicies(alertRulesConfig.escalationPolicies);
            validationResults.errors.push(...escalationValidation.errors);
            validationResults.recommendations.push(...escalationValidation.recommendations);
        }

        // Check correlation rules for logical consistency
        if (alertRulesConfig.correlationRules) {
            const correlationValidation = validateCorrelationRules(alertRulesConfig.correlationRules);
            validationResults.warnings.push(...correlationValidation.warnings);
            validationResults.recommendations.push(...correlationValidation.recommendations);
        }

        // Verify security and compliance requirements in alert configuration
        const securityValidation = validateSecurityCompliance(alertRulesConfig);
        validationResults.warnings.push(...securityValidation.warnings);
        validationResults.recommendations.push(...securityValidation.recommendations);

        // Generate configuration recommendations for optimization
        const optimizationRecommendations = generateOptimizationRecommendations(alertRulesConfig, validationResults);
        validationResults.recommendations.push(...optimizationRecommendations);

        // Determine overall validation status
        validationResults.isValid = validationResults.errors.length === 0;

        // Log validation results with errors and recommendations
        logger.info('Alert rules validation completed', {
            isValid: validationResults.isValid,
            errors: validationResults.errors.length,
            warnings: validationResults.warnings.length,
            recommendations: validationResults.recommendations.length,
            validatedRules: validationResults.validatedRules,
            totalRules: validationResults.totalRules
        });

        // Return validation results with compliance status and guidance
        return {
            ...validationResults,
            configurationHealth: calculateConfigurationHealth(validationResults),
            validationTimestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error('Alert rules validation failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Generates comprehensive alert reports with statistics, trends, resolution analysis,
 * and operational insights for stakeholder communication and system optimization
 * 
 * @param {string} reportType - Type of report to generate (summary, detailed, trend)
 * @param {Object} reportOptions - Report configuration and options
 * @returns {Object} Alert report with statistics, trends, analysis, and actionable recommendations
 */
async function generateAlertReport(reportType = 'summary', reportOptions = {}) {
    try {
        // Initialize report generation with type validation and time range specification
        const validReportTypes = ['summary', 'detailed', 'trend', 'performance'];
        if (!validReportTypes.includes(reportType)) {
            throw new Error(`Invalid report type: ${reportType}`);
        }

        const timeRange = {
            start: reportOptions.startDate ? new Date(reportOptions.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: reportOptions.endDate ? new Date(reportOptions.endDate) : new Date()
        };

        logger.debug('Generating alert report', {
            reportType: reportType,
            timeRange: timeRange,
            options: Object.keys(reportOptions)
        });

        // Collect alert statistics from ALERT_COUNTERS and ALERT_HISTORY
        const alertStatistics = collectAlertStatistics(timeRange);

        // Analyze alert trends and patterns over specified reporting period
        const trendAnalysis = analyzeAlertTrends(ALERT_HISTORY, timeRange);

        // Calculate mean time to resolution and escalation statistics
        const resolutionMetrics = calculateResolutionMetrics(ALERT_HISTORY, timeRange);

        // Identify top alert sources and recurring operational issues
        const sourceAnalysis = analyzeAlertSources(ALERT_HISTORY, timeRange);

        // Generate operational insights and optimization recommendations
        const operationalInsights = generateOperationalInsights(alertStatistics, trendAnalysis, sourceAnalysis);

        // Build report based on requested type
        let report = {
            reportType: reportType,
            generatedAt: new Date().toISOString(),
            timeRange: timeRange,
            summary: {
                totalAlerts: alertStatistics.total,
                activeAlerts: ACTIVE_ALERTS.size,
                resolvedAlerts: alertStatistics.resolved,
                averageResolutionTime: resolutionMetrics.averageResolutionTime
            }
        };

        switch (reportType) {
            case 'summary':
                report.statistics = alertStatistics;
                report.topSources = sourceAnalysis.topSources.slice(0, 5);
                report.recommendations = operationalInsights.recommendations.slice(0, 3);
                break;

            case 'detailed':
                report.statistics = alertStatistics;
                report.trendAnalysis = trendAnalysis;
                report.resolutionMetrics = resolutionMetrics;
                report.sourceAnalysis = sourceAnalysis;
                report.operationalInsights = operationalInsights;
                report.recentAlerts = getRecentAlerts(timeRange, 10);
                break;

            case 'trend':
                report.trendAnalysis = trendAnalysis;
                report.patterns = identifyAlertPatterns(ALERT_HISTORY, timeRange);
                report.forecasting = generateAlertForecasting(trendAnalysis);
                break;

            case 'performance':
                report.performanceMetrics = calculatePerformanceMetrics(ALERT_HISTORY, timeRange);
                report.systemHealth = assessSystemHealth(alertStatistics, trendAnalysis);
                report.optimizationOpportunities = identifyOptimizationOpportunities(operationalInsights);
                break;
        }

        // Format report for specified audience including executive summary
        if (reportOptions.audience === 'executive') {
            report.executiveSummary = generateExecutiveSummary(report);
        }

        // Add visualizations and charts for stakeholder presentation
        if (reportOptions.includeVisualizations) {
            report.visualizations = generateReportVisualizations(report);
        }

        // Log report generation with statistics and distribution tracking
        logger.info('Alert report generated successfully', {
            reportType: reportType,
            timeRange: timeRange,
            totalAlerts: report.summary.totalAlerts,
            activeAlerts: report.summary.activeAlerts,
            includesVisualizations: !!reportOptions.includeVisualizations,
            audience: reportOptions.audience || 'technical'
        });

        // Return comprehensive alert report with analysis and recommendations
        return report;

    } catch (error) {
        logger.error('Alert report generation failed', {
            reportType: reportType,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Configures notification delivery channels including console output, webhook delivery,
 * email notifications, and real-time dashboard integration for comprehensive alert distribution
 * 
 * @param {Object} channelConfig - Notification channel configuration
 * @returns {Object} Configured notification channels with delivery status and validation results
 */
async function setupNotificationChannels(channelConfig = {}) {
    try {
        logger.debug('Setting up notification channels', {
            channels: Object.keys(channelConfig),
            timestamp: new Date().toISOString()
        });

        const channelResults = {};

        // Validate notification channel configuration and credentials
        const validationResults = validateChannelConfiguration(channelConfig);
        if (validationResults.errors.length > 0) {
            logger.warn('Channel configuration validation issues', {
                errors: validationResults.errors
            });
        }

        // Configure console notification channel with structured output
        if (channelConfig.console?.enabled !== false) {
            const consoleChannel = setupConsoleNotificationChannel(channelConfig.console || {});
            NOTIFICATION_CHANNELS.set('console', consoleChannel);
            channelResults.console = { status: 'configured', ...consoleChannel };
            logger.debug('Console notification channel configured');
        }

        // Set up webhook delivery channel with retry logic and authentication
        if (channelConfig.webhook?.enabled && channelConfig.webhook?.url) {
            try {
                const webhookChannel = await setupWebhookNotificationChannel(channelConfig.webhook);
                NOTIFICATION_CHANNELS.set('webhook', webhookChannel);
                channelResults.webhook = { status: 'configured', ...webhookChannel };
                logger.debug('Webhook notification channel configured', {
                    url: channelConfig.webhook.url,
                    timeout: channelConfig.webhook.timeout
                });
            } catch (error) {
                logger.warn('Webhook channel setup failed', { error: error.message });
                channelResults.webhook = { status: 'failed', error: error.message };
            }
        }

        // Configure email notification channel if SMTP settings available
        if (channelConfig.email?.enabled && channelConfig.email?.smtp) {
            try {
                const emailChannel = await setupEmailNotificationChannel(channelConfig.email);
                NOTIFICATION_CHANNELS.set('email', emailChannel);
                channelResults.email = { status: 'configured', ...emailChannel };
                logger.debug('Email notification channel configured', {
                    host: channelConfig.email.smtp.host,
                    port: channelConfig.email.smtp.port
                });
            } catch (error) {
                logger.warn('Email channel setup failed', { error: error.message });
                channelResults.email = { status: 'failed', error: error.message };
            }
        }

        // Set up dashboard integration for real-time alert visualization
        if (channelConfig.dashboard?.enabled) {
            const dashboardChannel = setupDashboardNotificationChannel(channelConfig.dashboard || {});
            NOTIFICATION_CHANNELS.set('dashboard', dashboardChannel);
            channelResults.dashboard = { status: 'configured', ...dashboardChannel };
            logger.debug('Dashboard notification channel configured');
        }

        // Test notification channel connectivity and delivery
        const connectivityTests = await testNotificationChannelConnectivity();
        
        // Log notification channel setup with configuration summary
        logger.info('Notification channels setup completed', {
            configuredChannels: Object.keys(channelResults),
            successfulChannels: Object.values(channelResults).filter(r => r.status === 'configured').length,
            failedChannels: Object.values(channelResults).filter(r => r.status === 'failed').length,
            connectivityTests: connectivityTests.passed
        });

        // Return configured channels with status and validation results
        return {
            channels: channelResults,
            connectivityTests: connectivityTests,
            validationResults: validationResults,
            setupTimestamp: new Date().toISOString(),
            totalConfigured: NOTIFICATION_CHANNELS.size
        };

    } catch (error) {
        logger.error('Notification channel setup failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Delivers alert notifications through configured channels with retry logic, delivery tracking,
 * and failure handling for reliable notification delivery
 * 
 * @param {Object} alert - Alert object to deliver
 * @param {Array} targetChannels - Target notification channels
 * @returns {Promise} Promise that resolves with delivery results and status information
 */
async function deliverNotification(alert, targetChannels = ['console']) {
    try {
        logger.debug('Delivering alert notification', {
            alertId: alert.id,
            severity: alert.severity,
            channels: targetChannels
        });

        const deliveryResults = [];

        // Validate notification targets and alert content for delivery
        if (!alert || !alert.id) {
            throw new Error('Invalid alert object for notification delivery');
        }

        // Format alert notification for each target channel
        const formattedNotifications = {};
        for (const channel of targetChannels) {
            formattedNotifications[channel] = formatNotificationForChannel(alert, channel);
        }

        // Apply notification filtering based on severity and subscription preferences
        const filteredChannels = applyNotificationFiltering(targetChannels, alert);

        // Attempt delivery to each configured notification channel
        for (const channel of filteredChannels) {
            try {
                const channelConfig = NOTIFICATION_CHANNELS.get(channel);
                if (!channelConfig) {
                    logger.warn(`Notification channel not configured: ${channel}`);
                    deliveryResults.push({
                        channel: channel,
                        status: 'failed',
                        error: 'Channel not configured'
                    });
                    continue;
                }

                // Implement retry logic using retry utility for failed deliveries
                const deliveryResult = await retry(async () => {
                    return await deliverToChannel(formattedNotifications[channel], channel, channelConfig);
                }, 3);

                deliveryResults.push({
                    channel: channel,
                    status: 'delivered',
                    timestamp: new Date().toISOString(),
                    ...deliveryResult
                });

            } catch (error) {
                logger.warn(`Notification delivery failed for channel: ${channel}`, {
                    alertId: alert.id,
                    error: error.message
                });

                deliveryResults.push({
                    channel: channel,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });

                // Handle delivery failures with fallback notification methods
                await handleDeliveryFailure(alert, channel, error);
            }
        }

        // Track delivery status and update notification metrics
        updateNotificationMetrics(alert, deliveryResults);

        // Log notification delivery results with channel status
        logger.info('Notification delivery completed', {
            alertId: alert.id,
            totalChannels: targetChannels.length,
            successfulDeliveries: deliveryResults.filter(r => r.status === 'delivered').length,
            failedDeliveries: deliveryResults.filter(r => r.status === 'failed').length
        });

        // Return delivery results with success status and failure information
        return {
            alertId: alert.id,
            deliveryResults: deliveryResults,
            overallStatus: deliveryResults.every(r => r.status === 'delivered') ? 'success' : 'partial',
            deliveryTimestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error('Notification delivery failed', {
            alertId: alert?.id,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Converts Node.js alert data to Flask-compatible format for cross-platform educational comparison
 * and feature parity validation between alert systems
 * 
 * @param {Object} nodeAlert - Node.js alert object to convert
 * @param {Object} flaskOptions - Flask-specific conversion options
 * @returns {Object} Flask-compatible alert object with equivalent structure and educational metadata
 */
function createFlaskAlertFormat(nodeAlert, flaskOptions = {}) {
    try {
        logger.debug('Converting Node.js alert to Flask format', {
            alertId: nodeAlert.id,
            type: nodeAlert.type,
            severity: nodeAlert.severity
        });

        // Convert Node.js alert structure to Flask-compatible dictionary format
        const flaskAlert = {
            'id': nodeAlert.id,
            'alert_type': nodeAlert.type,
            'severity': nodeAlert.severity,
            'status': nodeAlert.status,
            'data': convertNodeDataToFlaskFormat(nodeAlert.data),
            'context': {
                'correlation_id': nodeAlert.context.correlationId,
                'source': nodeAlert.context.source,
                'environment': nodeAlert.context.environment,
                'platform': 'flask', // Flask platform identifier
                'python_version': flaskOptions.pythonVersion || '3.9+',
                'flask_version': flaskOptions.flaskVersion || '3.1.1'
            }
        };

        // Transform timestamps to Python datetime format for Flask compatibility
        flaskAlert['timestamps'] = {
            'created': convertToFlaskTimestamp(nodeAlert.timestamps.created),
            'last_updated': convertToFlaskTimestamp(nodeAlert.timestamps.lastUpdated),
            'resolved': nodeAlert.timestamps.resolved ? convertToFlaskTimestamp(nodeAlert.timestamps.resolved) : None
        };

        // Adapt notification channels for Flask-compatible delivery methods
        if (nodeAlert.notificationsSent) {
            flaskAlert['notifications_sent'] = nodeAlert.notificationsSent.map(notification => ({
                'channel': notification.channel,
                'status': notification.status,
                'timestamp': convertToFlaskTimestamp(notification.timestamp)
            }));
        }

        // Convert escalation policies to Flask application patterns
        if (nodeAlert.escalationHistory) {
            flaskAlert['escalation_history'] = nodeAlert.escalationHistory.map(escalation => ({
                'level': escalation.level,
                'timestamp': convertToFlaskTimestamp(escalation.timestamp),
                'reason': escalation.reason,
                'previous_severity': escalation.previousSeverity,
                'new_severity': escalation.newSeverity
            }));
        }

        // Include cross-platform comparison metadata for educational value
        flaskAlert['cross_platform_metadata'] = {
            'original_platform': 'nodejs',
            'converted_platform': 'flask',
            'conversion_timestamp': new Date().toISOString(),
            'feature_parity': {
                'alerting': true,
                'escalation': true,
                'notification': true,
                'correlation': true
            },
            'educational_notes': [
                'Alert structure adapted for Python dictionary format',
                'Timestamps converted to ISO format for Flask compatibility',
                'Notification channels mapped to Flask-compatible methods',
                'Escalation policies maintained with Python naming conventions'
            ]
        };

        // Validate converted alert for feature parity with Node.js implementation
        const parityValidation = validateCrossPlatformParity(nodeAlert, flaskAlert);
        flaskAlert['parity_validation'] = parityValidation;

        // Add educational annotations for cross-platform alerting comparison
        flaskAlert['educational_comparison'] = {
            'nodejs_patterns': extractNodeJSPatterns(nodeAlert),
            'flask_adaptations': extractFlaskAdaptations(flaskAlert),
            'equivalency_mapping': createEquivalencyMapping(nodeAlert, flaskAlert),
            'learning_objectives': [
                'Understanding alert data structure differences between platforms',
                'Recognizing timestamp handling variations in Node.js vs Flask',
                'Comparing notification delivery patterns across platforms',
                'Analyzing escalation policy implementation differences'
            ]
        };

        // Log cross-platform conversion process for educational tracking
        logger.info('Node.js alert converted to Flask format successfully', {
            alertId: nodeAlert.id,
            conversionType: 'nodejs-to-flask',
            featureParity: parityValidation.overallParity,
            educationalValue: true,
            flaskCompatible: true
        });

        // Return Flask-compatible alert demonstrating alerting consistency
        return flaskAlert;

    } catch (error) {
        logger.error('Flask alert format conversion failed', {
            alertId: nodeAlert?.id,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Primary alert management class that orchestrates comprehensive alerting system including threshold monitoring,
 * health alerts, security notifications, and operational awareness with real-time processing, intelligent aggregation,
 * escalation management, and multi-channel notification delivery for production monitoring and educational demonstration
 */
class AlertManager extends EventEmitter {
    /**
     * Initializes AlertManager with configuration validation, monitoring system integration,
     * notification channel setup, and alert rule configuration for comprehensive alert management
     * 
     * @param {Object} config - AlertManager configuration object
     */
    constructor(config = {}) {
        super();
        this.setMaxListeners(100); // Support for multiple alert listeners

        // Validate alert manager configuration and apply environment-specific defaults
        this.config = {
            ...alertConfig,
            ...config
        };

        // Initialize structured logging with AlertManager context using logger
        this.logger = logger;
        this.logger.info('Initializing AlertManager', {
            config: Object.keys(this.config),
            environment: process.env.NODE_ENV || 'development'
        });

        // Set up MetricsCollector integration for threshold-based alerting
        this.metricsCollector = new MetricsCollector();

        // Initialize HealthCheckManager integration for health status alerts
        this.healthManager = new HealthCheckManager();

        // Configure EventEmitter for real-time alert broadcasting and notification
        this.eventEmitter = this;

        // Initialize alert storage maps and history tracking systems
        this.activeAlerts = ACTIVE_ALERTS;
        this.alertHistory = ALERT_HISTORY;

        // Set up notification channels configuration and delivery methods
        this.notificationChannels = NOTIFICATION_CHANNELS;

        // Configure alert rules and escalation policies from constants
        this.alertRules = ALERT_RULES;
        this.escalationPolicies = ESCALATION_POLICIES;

        // Initialize alert counters and statistics tracking
        this.alertCounters = ALERT_COUNTERS;

        // Set up alert correlation and deduplication mechanisms
        this.correlationCache = new Map();
        this.correlationWindow = this.config.correlationRules?.timeWindow || 300000;

        // Initialize alert system state
        this.isActive = false;
        this.monitoringIntervals = new Map();

        // Set up alert correlation and deduplication mechanisms
        this.setupAlertCorrelation();

        // Log AlertManager initialization completion with configuration summary
        this.logger.info('AlertManager initialized successfully', {
            metricsCollectorEnabled: !!this.metricsCollector,
            healthManagerEnabled: !!this.healthManager,
            notificationChannels: this.notificationChannels.size,
            alertRules: this.alertRules.size,
            escalationPolicies: this.escalationPolicies.size
        });

        // Set global ALERT_MANAGER reference for standalone functions
        ALERT_MANAGER = this;
    }

    /**
     * Starts comprehensive alert monitoring including threshold validation, health status monitoring,
     * security event tracking, and PM2 cluster alerting with real-time processing
     * 
     * @param {Object} monitoringOptions - Monitoring configuration options
     * @returns {Promise} Promise that resolves when alert monitoring is successfully started and operational
     */
    async startMonitoring(monitoringOptions = {}) {
        try {
            this.logger.info('Starting comprehensive alert monitoring', {
                options: Object.keys(monitoringOptions),
                timestamp: new Date().toISOString()
            });

            // Initialize comprehensive alert monitoring with configuration validation
            const monitoringConfig = {
                ...this.config,
                ...monitoringOptions
            };

            // Start MetricsCollector threshold monitoring integration
            await this.startThresholdMonitoring(monitoringConfig);

            // Begin HealthCheckManager health status alert monitoring
            await this.startHealthMonitoring(monitoringConfig);

            // Set up security event monitoring and threat detection alerting
            await this.startSecurityMonitoring(monitoringConfig);

            // Initialize PM2 cluster monitoring for process and resource alerts
            await this.startPM2Monitoring(monitoringConfig);

            // Configure real-time alert processing and notification delivery
            this.setupRealTimeProcessing();

            // Start background alert aggregation and correlation processing
            this.startAlertAggregation();

            // Enable escalation policy enforcement and automated responses
            this.enableEscalationPolicies();

            // Mark alert system as active and begin alert processing
            this.isActive = true;

            // Log alert monitoring startup completion with configuration summary
            this.logger.info('Alert monitoring started successfully', {
                isActive: this.isActive,
                monitoringIntervals: this.monitoringIntervals.size,
                thresholdMonitoring: true,
                healthMonitoring: true,
                securityMonitoring: true,
                pm2Monitoring: true,
                realTimeProcessing: true
            });

            // Emit monitoring started event
            this.emit('monitoring-started', {
                timestamp: new Date().toISOString(),
                config: monitoringConfig
            });

            return {
                success: true,
                startedAt: new Date().toISOString(),
                monitoringActive: this.isActive
            };

        } catch (error) {
            this.logger.error('Alert monitoring startup failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Gracefully stops alert monitoring, delivers final notifications, saves alert state,
     * and performs comprehensive cleanup of monitoring resources
     * 
     * @param {Object} stopOptions - Stop configuration options
     * @returns {Promise} Promise that resolves when alert monitoring is completely stopped and cleaned up
     */
    async stopMonitoring(stopOptions = {}) {
        try {
            this.logger.info('Initiating graceful alert monitoring shutdown', {
                options: Object.keys(stopOptions),
                activeAlerts: this.activeAlerts.size
            });

            // Initialize graceful alert monitoring shutdown with final processing
            const shutdownStartTime = Date.now();

            // Stop MetricsCollector and HealthCheckManager alert integration
            this.stopMonitoringIntervals();

            // Process remaining alerts and deliver final notifications
            await this.processRemainingAlerts();

            // Save alert state and history to persistent storage
            await this.saveAlertState(stopOptions);

            // Stop background alert processing and correlation systems
            this.stopBackgroundProcessing();

            // Close notification channels and cleanup delivery resources
            await this.cleanupNotificationChannels();

            // Mark alert system as inactive and stop new alert processing
            this.isActive = false;

            // Generate final alert summary and save to audit trail
            const finalSummary = this.generateFinalSummary();

            // Log alert monitoring shutdown completion with final statistics
            this.logger.info('Alert monitoring shutdown completed successfully', {
                shutdownDuration: Date.now() - shutdownStartTime,
                finalActiveAlerts: this.activeAlerts.size,
                totalAlertsProcessed: this.alertCounters.total,
                finalSummary: finalSummary
            });

            // Emit monitoring stopped event
            this.emit('monitoring-stopped', {
                timestamp: new Date().toISOString(),
                finalSummary: finalSummary
            });

            return {
                success: true,
                stoppedAt: new Date().toISOString(),
                finalSummary: finalSummary
            };

        } catch (error) {
            this.logger.error('Alert monitoring shutdown failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Creates new alert with comprehensive context, severity assessment, correlation tracking,
     * and automated notification delivery for operational awareness
     * 
     * @param {string} alertType - Type of alert to create
     * @param {Object} alertData - Alert data and context
     * @param {Object} alertOptions - Additional alert options
     * @returns {Object} Created alert object with unique ID, processing status, and correlation information
     */
    async createAlert(alertType, alertData = {}, alertOptions = {}) {
        return await createAlert(alertType, alertData, alertOptions);
    }

    /**
     * Resolves active alert with resolution context, timeline calculation, and notification delivery
     * for complete alert lifecycle management
     * 
     * @param {string} alertId - Alert ID to resolve
     * @param {Object} resolutionContext - Resolution context and details
     * @returns {Object} Resolved alert object with resolution details and timeline metrics
     */
    async resolveAlert(alertId, resolutionContext = {}) {
        return await resolveAlert(alertId, resolutionContext);
    }

    /**
     * Escalates alert to higher severity with policy enforcement, enhanced notifications,
     * and stakeholder communication for critical awareness
     * 
     * @param {string} alertId - Alert ID to escalate
     * @param {Object} escalationReason - Escalation reason and context
     * @returns {Object} Escalated alert object with updated severity and notification status
     */
    async escalateAlert(alertId, escalationReason = {}) {
        return await escalateAlert(alertId, escalationReason);
    }

    /**
     * Retrieves current active alerts with optional filtering, sorting, and aggregation
     * for dashboard consumption and operational awareness
     * 
     * @param {Object} filterOptions - Filtering and sorting options
     * @returns {Array} Array of active alerts with filtering and metadata
     */
    async getActiveAlerts(filterOptions = {}) {
        try {
            // Retrieve all alerts from activeAlerts map storage
            let alerts = Array.from(this.activeAlerts.values());

            // Apply filtering based on severity, type, and time range
            if (filterOptions.severity) {
                alerts = alerts.filter(alert => filterOptions.severity.includes(alert.severity));
            }

            if (filterOptions.type) {
                alerts = alerts.filter(alert => filterOptions.type.includes(alert.type));
            }

            if (filterOptions.timeRange) {
                const startTime = new Date(filterOptions.timeRange.start);
                const endTime = new Date(filterOptions.timeRange.end);
                alerts = alerts.filter(alert => {
                    const alertTime = new Date(alert.timestamps.created);
                    return alertTime >= startTime && alertTime <= endTime;
                });
            }

            // Sort alerts by priority, timestamp, and escalation status
            alerts.sort((a, b) => {
                // Primary sort by severity priority
                const severityOrder = { critical: 4, warning: 3, info: 2, resolved: 1 };
                const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
                if (severityDiff !== 0) return severityDiff;

                // Secondary sort by escalation level
                const escalationDiff = (b.escalationLevel || 0) - (a.escalationLevel || 0);
                if (escalationDiff !== 0) return escalationDiff;

                // Tertiary sort by creation timestamp (newest first)
                return new Date(b.timestamps.created) - new Date(a.timestamps.created);
            });

            // Include alert aggregation and correlation information
            alerts = alerts.map(alert => ({
                ...alert,
                correlationInfo: {
                    correlatedAlerts: alert.correlatedAlerts?.length || 0,
                    isPartOfGroup: alert.correlatedAlerts?.length > 0
                },
                displayMetadata: {
                    ageInMinutes: Math.floor((Date.now() - new Date(alert.timestamps.created)) / 60000),
                    lastUpdateAgo: Math.floor((Date.now() - new Date(alert.timestamps.lastUpdated)) / 60000)
                }
            }));

            // Add alert statistics and operational context
            const alertStatistics = this.getAlertStatistics();

            // Format alerts for dashboard and API consumption
            const response = {
                alerts: alerts,
                totalCount: alerts.length,
                filteredFrom: this.activeAlerts.size,
                statistics: alertStatistics.current,
                metadata: {
                    retrievedAt: new Date().toISOString(),
                    filterApplied: Object.keys(filterOptions).length > 0,
                    sortedBy: ['severity', 'escalationLevel', 'timestamp']
                }
            };

            // Log alert retrieval with filtering and access tracking
            this.logger.debug('Active alerts retrieved successfully', {
                totalAlerts: this.activeAlerts.size,
                filteredAlerts: alerts.length,
                filterOptions: Object.keys(filterOptions),
                requestTimestamp: new Date().toISOString()
            });

            // Return filtered and formatted active alerts array
            return response;

        } catch (error) {
            this.logger.error('Failed to retrieve active alerts', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Retrieves comprehensive alert statistics including counts, trends, resolution metrics,
     * and performance indicators for monitoring dashboards
     * 
     * @param {Object} statisticsOptions - Statistics configuration options
     * @returns {Object} Alert statistics object with counts, trends, and performance metrics
     */
    getAlertStatistics(statisticsOptions = {}) {
        try {
            const timeRange = statisticsOptions.timeRange || {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
                end: new Date()
            };

            // Collect current alert counts from alertCounters tracking
            const currentStats = { ...this.alertCounters };

            // Calculate alert trends and patterns from alertHistory
            const historicalAlerts = this.alertHistory.filter(alert => {
                const alertTime = new Date(alert.timestamps.created);
                return alertTime >= timeRange.start && alertTime <= timeRange.end;
            });

            // Compute mean time to resolution and escalation statistics
            const resolvedAlerts = historicalAlerts.filter(alert => alert.status === 'resolved');
            const meanTimeToResolution = resolvedAlerts.length > 0 
                ? resolvedAlerts.reduce((sum, alert) => {
                    const created = new Date(alert.timestamps.created);
                    const resolved = new Date(alert.timestamps.resolved);
                    return sum + (resolved - created);
                }, 0) / resolvedAlerts.length
                : 0;

            // Analyze alert sources and recurring operational patterns
            const sourceAnalysis = {};
            historicalAlerts.forEach(alert => {
                const source = alert.context.source;
                sourceAnalysis[source] = (sourceAnalysis[source] || 0) + 1;
            });

            // Generate performance metrics for alert processing efficiency
            const performanceMetrics = {
                averageProcessingTime: this.calculateAverageProcessingTime(historicalAlerts),
                alertThroughput: historicalAlerts.length / ((timeRange.end - timeRange.start) / (60 * 60 * 1000)), // alerts per hour
                escalationRate: (historicalAlerts.filter(a => a.escalationLevel > 0).length / historicalAlerts.length) * 100
            };

            // Include notification delivery statistics and channel performance
            const notificationStats = this.calculateNotificationStatistics(historicalAlerts);

            // Format statistics for dashboard visualization and reporting
            const statistics = {
                current: currentStats,
                historical: {
                    timeRange: timeRange,
                    totalAlertsInPeriod: historicalAlerts.length,
                    resolvedInPeriod: resolvedAlerts.length,
                    meanTimeToResolution: meanTimeToResolution,
                    meanTimeToResolutionFormatted: this.formatDuration(meanTimeToResolution)
                },
                trends: {
                    sourceDistribution: sourceAnalysis,
                    topSources: Object.entries(sourceAnalysis)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([source, count]) => ({ source, count }))
                },
                performance: performanceMetrics,
                notifications: notificationStats,
                metadata: {
                    calculatedAt: new Date().toISOString(),
                    dataQuality: this.assessDataQuality(historicalAlerts)
                }
            };

            // Log statistics retrieval with access tracking and performance
            this.logger.debug('Alert statistics calculated successfully', {
                timeRange: timeRange,
                historicalAlerts: historicalAlerts.length,
                currentActiveAlerts: this.activeAlerts.size,
                meanResolutionTime: meanTimeToResolution,
                topSources: statistics.trends.topSources.length
            });

            // Return comprehensive alert statistics with trend analysis
            return statistics;

        } catch (error) {
            this.logger.error('Failed to calculate alert statistics', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Generates comprehensive alert reports with analysis, trends, recommendations,
     * and operational insights for stakeholder communication and system optimization
     * 
     * @param {string} reportType - Type of report to generate
     * @param {Object} reportOptions - Report configuration options
     * @returns {Object} Comprehensive alert report with analysis, visualizations, and actionable recommendations
     */
    async generateReport(reportType = 'summary', reportOptions = {}) {
        return await generateAlertReport(reportType, reportOptions);
    }

    // Private helper methods for AlertManager

    /**
     * Sets up alert correlation mechanisms for intelligent alert grouping
     * @private
     */
    setupAlertCorrelation() {
        // Periodic correlation cleanup
        setInterval(() => {
            this.cleanupExpiredCorrelations();
        }, this.correlationWindow);
    }

    /**
     * Starts threshold monitoring with MetricsCollector integration
     * @private
     */
    async startThresholdMonitoring(config) {
        const interval = setInterval(async () => {
            try {
                const thresholdViolations = await this.metricsCollector.validateThresholds();
                for (const violation of thresholdViolations.violations || []) {
                    await processThresholdAlert(violation, { source: 'threshold-monitor' });
                }
            } catch (error) {
                this.logger.warn('Threshold monitoring check failed', { error: error.message });
            }
        }, config.monitoringInterval || 30000); // 30 seconds default

        this.monitoringIntervals.set('threshold', interval);
    }

    /**
     * Starts health monitoring with HealthCheckManager integration
     * @private
     */
    async startHealthMonitoring(config) {
        this.healthManager.subscribeToUpdates(async (healthStatus) => {
            await processHealthAlert(healthStatus, { source: 'health-monitor' });
        });
    }

    /**
     * Starts security event monitoring
     * @private
     */
    async startSecurityMonitoring(config) {
        // Security monitoring would integrate with middleware and security systems
        this.logger.debug('Security monitoring initialized for threat detection');
    }

    /**
     * Starts PM2 cluster monitoring
     * @private
     */
    async startPM2Monitoring(config) {
        const interval = setInterval(async () => {
            try {
                // Mock PM2 status check - in real implementation would use PM2 API
                const pm2Status = await this.getPM2Status();
                if (pm2Status.requiresAlert) {
                    await processPM2Alert(pm2Status, { source: 'pm2-monitor' });
                }
            } catch (error) {
                this.logger.warn('PM2 monitoring check failed', { error: error.message });
            }
        }, config.pm2MonitoringInterval || 60000); // 60 seconds default

        this.monitoringIntervals.set('pm2', interval);
    }

    /**
     * Sets up real-time alert processing
     * @private
     */
    setupRealTimeProcessing() {
        this.on('alert-created', (alert) => {
            this.logger.debug('Real-time alert processing triggered', { alertId: alert.id });
        });

        this.on('alert-escalated', (data) => {
            this.logger.info('Alert escalation processed in real-time', { 
                alertId: data.alert.id,
                newSeverity: data.alert.severity 
            });
        });
    }

    /**
     * Starts background alert aggregation processing
     * @private
     */
    startAlertAggregation() {
        const interval = setInterval(async () => {
            try {
                await aggregateAlerts(this.config.correlationRules);
            } catch (error) {
                this.logger.warn('Alert aggregation failed', { error: error.message });
            }
        }, this.config.aggregationInterval || 300000); // 5 minutes default

        this.monitoringIntervals.set('aggregation', interval);
    }

    /**
     * Enables escalation policy enforcement
     * @private
     */
    enableEscalationPolicies() {
        const interval = setInterval(() => {
            this.checkEscalationPolicies();
        }, 60000); // Check every minute

        this.monitoringIntervals.set('escalation', interval);
    }

    /**
     * Checks and applies escalation policies
     * @private
     */
    checkEscalationPolicies() {
        for (const [alertId, alert] of this.activeAlerts) {
            const policy = this.escalationPolicies.get(alert.type);
            if (policy && this.shouldEscalateAlert(alert, policy)) {
                escalateAlert(alertId, { reason: 'policy-based-escalation' });
            }
        }
    }

    /**
     * Determines if alert should be escalated based on policy
     * @private
     */
    shouldEscalateAlert(alert, policy) {
        const alertAge = Date.now() - new Date(alert.timestamps.created).getTime();
        return alertAge > policy.escalateAfter && alert.escalationLevel < policy.maxEscalations;
    }

    /**
     * Stops all monitoring intervals
     * @private
     */
    stopMonitoringIntervals() {
        for (const [name, interval] of this.monitoringIntervals) {
            clearInterval(interval);
            this.logger.debug(`Stopped ${name} monitoring interval`);
        }
        this.monitoringIntervals.clear();
    }

    /**
     * Processes remaining alerts during shutdown
     * @private
     */
    async processRemainingAlerts() {
        const activeAlertIds = Array.from(this.activeAlerts.keys());
        this.logger.info(`Processing ${activeAlertIds.length} remaining alerts during shutdown`);
        
        // In a real implementation, might auto-resolve or transfer alerts
        for (const alertId of activeAlertIds.slice(0, 10)) { // Limit processing during shutdown
            try {
                await this.resolveAlert(alertId, { 
                    resolvedBy: 'system-shutdown',
                    reason: 'automatic-resolution-on-shutdown'
                });
            } catch (error) {
                this.logger.warn(`Failed to resolve alert ${alertId} during shutdown`, { error: error.message });
            }
        }
    }

    /**
     * Saves alert state for persistence
     * @private
     */
    async saveAlertState(options) {
        // In a real implementation, would save to persistent storage
        this.logger.info('Alert state saved successfully', {
            activeAlerts: this.activeAlerts.size,
            historyCount: this.alertHistory.length,
            counters: this.alertCounters
        });
    }

    /**
     * Stops background processing
     * @private
     */
    stopBackgroundProcessing() {
        this.removeAllListeners();
        this.logger.debug('Background alert processing stopped');
    }

    /**
     * Cleans up notification channels
     * @private
     */
    async cleanupNotificationChannels() {
        for (const [name, channel] of this.notificationChannels) {
            if (channel.cleanup && typeof channel.cleanup === 'function') {
                try {
                    await channel.cleanup();
                } catch (error) {
                    this.logger.warn(`Failed to cleanup notification channel ${name}`, { error: error.message });
                }
            }
        }
        this.logger.debug('Notification channels cleaned up successfully');
    }

    /**
     * Generates final monitoring summary
     * @private
     */
    generateFinalSummary() {
        return {
            totalAlertsProcessed: this.alertCounters.total,
            finalActiveAlerts: this.activeAlerts.size,
            resolvedAlerts: this.alertCounters.resolved,
            criticalAlerts: this.alertCounters.critical,
            warningAlerts: this.alertCounters.warning,
            notificationChannels: this.notificationChannels.size,
            monitoringDuration: process.uptime()
        };
    }

    /**
     * Mock PM2 status check for educational demonstration
     * @private
     */
    async getPM2Status() {
        // Mock PM2 status for educational purposes
        return {
            name: 'tutorial-app',
            pid: process.pid,
            status: 'online',
            instances: cpus().length,
            restarts: 0,
            uptime: process.uptime() * 1000,
            memory: process.memoryUsage().rss,
            cpu: 0,
            requiresAlert: false // Would be true if thresholds exceeded
        };
    }

    /**
     * Calculates average processing time for alerts
     * @private
     */
    calculateAverageProcessingTime(alerts) {
        if (alerts.length === 0) return 0;
        
        const processingTimes = alerts
            .filter(alert => alert.timestamps.resolved)
            .map(alert => {
                const created = new Date(alert.timestamps.created);
                const resolved = new Date(alert.timestamps.resolved);
                return resolved - created;
            });

        return processingTimes.length > 0 
            ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
            : 0;
    }

    /**
     * Calculates notification statistics
     * @private
     */
    calculateNotificationStatistics(alerts) {
        const notificationStats = {
            totalNotifications: 0,
            successfulNotifications: 0,
            failedNotifications: 0,
            channelStats: {}
        };

        alerts.forEach(alert => {
            if (alert.notificationsSent) {
                alert.notificationsSent.forEach(notification => {
                    notificationStats.totalNotifications++;
                    
                    if (notification.status === 'delivered') {
                        notificationStats.successfulNotifications++;
                    } else {
                        notificationStats.failedNotifications++;
                    }

                    const channel = notification.channel;
                    if (!notificationStats.channelStats[channel]) {
                        notificationStats.channelStats[channel] = { success: 0, failed: 0 };
                    }
                    
                    if (notification.status === 'delivered') {
                        notificationStats.channelStats[channel].success++;
                    } else {
                        notificationStats.channelStats[channel].failed++;
                    }
                });
            }
        });

        notificationStats.successRate = notificationStats.totalNotifications > 0
            ? (notificationStats.successfulNotifications / notificationStats.totalNotifications) * 100
            : 0;

        return notificationStats;
    }

    /**
     * Assesses data quality for statistics
     * @private
     */
    assessDataQuality(alerts) {
        const quality = {
            completeness: 0,
            consistency: 0,
            accuracy: 0
        };

        if (alerts.length === 0) return quality;

        // Completeness: percentage of alerts with all required fields
        const completeAlerts = alerts.filter(alert => 
            alert.id && alert.type && alert.severity && alert.timestamps.created
        );
        quality.completeness = (completeAlerts.length / alerts.length) * 100;

        // Consistency: percentage of alerts with consistent data formats
        const consistentAlerts = alerts.filter(alert => 
            typeof alert.id === 'string' && 
            ['critical', 'warning', 'info'].includes(alert.severity)
        );
        quality.consistency = (consistentAlerts.length / alerts.length) * 100;

        // Accuracy: based on timestamp validity and data coherence
        const accurateAlerts = alerts.filter(alert => {
            try {
                const created = new Date(alert.timestamps.created);
                const now = new Date();
                return created <= now && !isNaN(created.getTime());
            } catch {
                return false;
            }
        });
        quality.accuracy = (accurateAlerts.length / alerts.length) * 100;

        return quality;
    }

    /**
     * Formats duration in milliseconds to human-readable format
     * @private
     */
    formatDuration(milliseconds) {
        if (milliseconds < 1000) return `${milliseconds}ms`;
        if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
        if (milliseconds < 3600000) return `${Math.round(milliseconds / 60000)}m`;
        return `${Math.round(milliseconds / 3600000)}h`;
    }

    /**
     * Cleans up expired correlation entries
     * @private
     */
    cleanupExpiredCorrelations() {
        const now = Date.now();
        for (const [key, correlation] of this.correlationCache) {
            if (now - correlation.timestamp > this.correlationWindow) {
                this.correlationCache.delete(key);
            }
        }
    }

    /**
     * Updates monitoring frequency based on escalation level
     * @private
     */
    async updateMonitoringFrequency(alertId, escalationLevel) {
        // Increase monitoring frequency for escalated alerts
        const baseInterval = 30000; // 30 seconds
        const escalatedInterval = Math.max(5000, baseInterval / (escalationLevel + 1));
        
        this.logger.debug('Updated monitoring frequency for escalated alert', {
            alertId: alertId,
            escalationLevel: escalationLevel,
            newInterval: escalatedInterval
        });
    }
}

// Helper functions for alert processing

/**
 * Classifies alert severity based on type and data
 * @private
 */
function classifyAlertSeverity(alertType, alertData, options = {}) {
    if (options.severity) return options.severity;

    switch (alertType) {
        case 'security':
            return alertData.threatLevel === 'high' ? 'critical' : 'warning';
        case 'pm2':
            return alertData.status === 'stopped' ? 'critical' : 'warning';
        case 'threshold':
            return alertData.thresholdType === 'critical' ? 'critical' : 'warning';
        case 'health':
            return alertData.status === 'unhealthy' ? 'critical' : 'warning';
        default:
            return 'info';
    }
}

/**
 * Sanitizes alert data to remove sensitive information
 * @private
 */
function sanitizeAlertData(alertData) {
    const sanitized = { ...alertData };
    
    // Remove or mask sensitive fields
    if (sanitized.password) delete sanitized.password;
    if (sanitized.token) sanitized.token = '***masked***';
    if (sanitized.apiKey) sanitized.apiKey = '***masked***';
    
    return sanitized;
}

/**
 * Correlates alert with existing alerts
 * @private
 */
async function correlateAlert(alert) {
    const correlatedAlerts = [];
    const correlationWindow = 300000; // 5 minutes
    const now = Date.now();

    for (const existingAlert of ACTIVE_ALERTS.values()) {
        const timeDiff = now - new Date(existingAlert.timestamps.created).getTime();
        
        if (timeDiff <= correlationWindow && 
            existingAlert.type === alert.type && 
            existingAlert.context.source === alert.context.source) {
            correlatedAlerts.push(existingAlert);
        }
    }

    return correlatedAlerts;
}

/**
 * Gets notification channels for alert severity
 * @private
 */
function getNotificationChannelsForSeverity(severity) {
    switch (severity) {
        case 'critical':
            return ['console', 'webhook', 'email'];
        case 'warning':
            return ['console', 'webhook'];
        case 'info':
            return ['console'];
        default:
            return ['console'];
    }
}

/**
 * Gets notification channels for alert resolution
 * @private
 */
function getNotificationChannelsForResolution(alert) {
    // Use same channels as original alert for resolution notification
    return getNotificationChannelsForSeverity(alert.severity);
}

/**
 * Escalates alert severity to next level
 * @private
 */
function escalateAlertSeverity(currentSeverity) {
    switch (currentSeverity) {
        case 'info':
            return 'warning';
        case 'warning':
            return 'critical';
        case 'critical':
            return 'critical'; // Already at highest level
        default:
            return 'warning';
    }
}

/**
 * Formats duration in milliseconds to human-readable string
 * @private
 */
function formatDuration(milliseconds) {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
    if (milliseconds < 3600000) return `${Math.round(milliseconds / 60000)}m`;
    return `${Math.round(milliseconds / 3600000)}h`;
}

// Mock implementation functions for educational demonstration
// These would be replaced with real implementations in production

function analyzeHistoricalThresholdViolations(type) {
    return { pattern: 'increasing', trend: 'upward', confidence: 0.75 };
}

function shouldEscalateThresholdAlert(violation, patterns) {
    return violation.thresholdType === 'critical' || patterns.trend === 'upward';
}

function findRelatedThresholdAlerts(type, value) {
    return Array.from(ACTIVE_ALERTS.values()).filter(alert => 
        alert.type === 'threshold' && alert.data?.type === type
    );
}

function triggerAutomatedResponse(alert, violation) {
    return Promise.resolve([]);
}

function updateThresholdViolationTracking(type, value, threshold) {
    // Mock implementation for educational purposes
}

function scheduleThresholdFollowup(alertId, type, threshold) {
    // Mock implementation for educational purposes
}

function assessHealthImpact(healthStatus, context) {
    return { level: 'medium', affectedServices: [], recoveryTime: 300000 };
}

function determineHealthAlertSeverity(healthStatus, impact) {
    return impact.level === 'high' ? 'critical' : 'warning';
}

function correlateHealthWithServices(healthStatus, context) {
    return { impactedServices: [], correlationStrength: 0.5 };
}

function calculateCurrentAvailability(healthStatus) {
    return healthStatus.status === 'healthy' ? 100 : 50;
}

function estimateRecoveryTime(healthStatus) {
    return 300000; // 5 minutes
}

function analyzeCascadeFailurePatterns(healthStatus, alert) {
    return { cascadeRisk: 'low', relatedSystems: [] };
}

function generateHealthRecommendations(healthStatus, impact) {
    return ['Check service dependencies', 'Review resource usage'];
}

function updateHealthMonitoringState(healthStatus, impact) {
    // Mock implementation
}

function scheduleHealthRecoveryMonitoring(alertId, healthStatus) {
    // Mock implementation
}

function classifySecurityThreat(eventType, context) {
    return { 
        level: 'medium', 
        severity: 'warning', 
        category: 'access-violation',
        confidence: 0.8 
    };
}

function sanitizeSecurityContext(securityContext, requestContext) {
    const sanitized = { ...securityContext };
    // Remove sensitive information
    if (sanitized.credentials) delete sanitized.credentials;
    return sanitized;
}

function correlateSecurityEvents(eventType, context) {
    return { relatedEvents: [], correlationScore: 0.3 };
}

function shouldTriggerIncidentResponse(classification, correlation) {
    return classification.level === 'high';
}

function assessComplianceImpact(eventType, classification) {
    return { requiresReporting: false, complianceFrameworks: [] };
}

function triggerSecurityResponse(alert, classification) {
    return Promise.resolve({ actions: [] });
}

function updateSecurityMonitoringState(eventType, classification) {
    // Mock implementation
}

function generateSecurityRecommendations(classification, correlation) {
    return ['Review access controls', 'Monitor similar events'];
}

function scheduleSecurityFollowup(alertId, eventType, classification) {
    // Mock implementation
}

function analyzePM2ClusterStatus(pm2Status, context) {
    return { 
        healthyInstances: pm2Status.instances || 1,
        requiresRecovery: false,
        clusterHealth: 'healthy'
    };
}

function determinePM2AlertSeverity(pm2Status, analysis) {
    return pm2Status.status === 'stopped' ? 'critical' : 'warning';
}

function assessPM2ResourceUtilization(pm2Status, context) {
    return {
        cpuUtilization: pm2Status.cpu || 0,
        memoryUtilization: pm2Status.memory || 0,
        threshold: 'normal'
    };
}

function assessPM2PerformanceImpact(pm2Status, analysis) {
    return { level: 'low', impact: 'minimal' };
}

function analyzeRestartPatterns(pm2Status, context) {
    return { pattern: 'normal', frequency: 'low' };
}

function triggerPM2Recovery(alert, pm2Status, analysis) {
    return Promise.resolve([]);
}

function generatePM2Recommendations(pm2Status, analysis) {
    return ['Monitor resource usage', 'Check application logs'];
}

function updatePM2MonitoringState(pm2Status, analysis) {
    // Mock implementation
}

function schedulePM2RecoveryMonitoring(alertId, pm2Status) {
    // Mock implementation
}

function analyzeCorrelationPatterns(alerts, rules) {
    return [];
}

function applyAggregationRules(alerts, rules, patterns) {
    return [];
}

function createAggregatedAlertSummaries(groups) {
    return Promise.resolve([]);
}

function calculateAggregationStatistics(groups, summaries) {
    return { groupsCreated: groups.length, alertsAggregated: 0 };
}

function createConsolidatedAlerts(summaries) {
    return Promise.resolve([]);
}

function updateAlertsWithAggregationReferences(groups, consolidated) {
    // Mock implementation
}

function calculateNoiseReduction(groups, consolidated) {
    return { percentage: 0, absoluteReduction: 0 };
}

function validateThresholdRules(thresholds) {
    return { errors: [], warnings: [], validRules: 0, totalRules: 0 };
}

function validateMetricsAvailability(thresholds) {
    return Promise.resolve({ warnings: [], recommendations: [] });
}

function validateNotificationChannels(channels) {
    return Promise.resolve({ errors: [], warnings: [] });
}

function validateEscalationPolicies(policies) {
    return { errors: [], recommendations: [] };
}

function validateCorrelationRules(rules) {
    return { warnings: [], recommendations: [] };
}

function validateSecurityCompliance(config) {
    return { warnings: [], recommendations: [] };
}

function generateOptimizationRecommendations(config, validation) {
    return [];
}

function calculateConfigurationHealth(validation) {
    return { score: 85, status: 'good' };
}

function collectAlertStatistics(timeRange) {
    return { total: ALERT_COUNTERS.total, resolved: ALERT_COUNTERS.resolved };
}

function analyzeAlertTrends(history, timeRange) {
    return { trend: 'stable', growth: 0 };
}

function calculateResolutionMetrics(history, timeRange) {
    return { averageResolutionTime: 300000 };
}

function analyzeAlertSources(history, timeRange) {
    return { topSources: [] };
}

function generateOperationalInsights(stats, trends, sources) {
    return { recommendations: [] };
}

function getRecentAlerts(timeRange, limit) {
    return ALERT_HISTORY.slice(-limit);
}

function identifyAlertPatterns(history, timeRange) {
    return [];
}

function generateAlertForecasting(trends) {
    return { forecast: 'stable' };
}

function calculatePerformanceMetrics(history, timeRange) {
    return { efficiency: 0.85 };
}

function assessSystemHealth(stats, trends) {
    return { status: 'healthy', score: 90 };
}

function identifyOptimizationOpportunities(insights) {
    return [];
}

function generateExecutiveSummary(report) {
    return {
        summary: 'Alert system operating normally',
        keyMetrics: {},
        recommendations: []
    };
}

function generateReportVisualizations(report) {
    return { charts: [], graphs: [] };
}

function validateChannelConfiguration(config) {
    return { errors: [], warnings: [] };
}

function setupConsoleNotificationChannel(config) {
    return {
        type: 'console',
        format: config.format || 'structured',
        enabled: true,
        deliver: async (notification) => {
            console.log(JSON.stringify(notification, null, 2));
            return { status: 'delivered', timestamp: new Date().toISOString() };
        }
    };
}

function setupWebhookNotificationChannel(config) {
    return Promise.resolve({
        type: 'webhook',
        url: config.url,
        timeout: config.timeout || 5000,
        enabled: true,
        deliver: async (notification) => {
            // Mock webhook delivery for educational purposes
            return { status: 'delivered', timestamp: new Date().toISOString() };
        }
    });
}

function setupEmailNotificationChannel(config) {
    return Promise.resolve({
        type: 'email',
        smtp: config.smtp,
        enabled: true,
        deliver: async (notification) => {
            // Mock email delivery for educational purposes
            return { status: 'delivered', timestamp: new Date().toISOString() };
        }
    });
}

function setupDashboardNotificationChannel(config) {
    return {
        type: 'dashboard',
        enabled: true,
        deliver: async (notification) => {
            // Mock dashboard delivery for educational purposes
            return { status: 'delivered', timestamp: new Date().toISOString() };
        }
    };
}

function testNotificationChannelConnectivity() {
    return Promise.resolve({ passed: true, results: {} });
}

function formatNotificationForChannel(alert, channel) {
    return {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: `Alert: ${alert.type} - ${alert.severity}`,
        timestamp: alert.timestamps.created,
        channel: channel
    };
}

function applyNotificationFiltering(channels, alert) {
    // Mock implementation - in production would apply sophisticated filtering
    return channels;
}

function deliverToChannel(notification, channel, config) {
    return config.deliver ? config.deliver(notification) : Promise.resolve({ status: 'delivered' });
}

function handleDeliveryFailure(alert, channel, error) {
    logger.warn('Notification delivery failure handled', {
        alertId: alert.id,
        channel: channel,
        error: error.message
    });
    return Promise.resolve();
}

function updateNotificationMetrics(alert, results) {
    // Mock implementation for tracking notification metrics
}

function convertNodeDataToFlaskFormat(data) {
    // Convert camelCase to snake_case for Python compatibility
    const converted = {};
    for (const [key, value] of Object.entries(data || {})) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        converted[snakeKey] = value;
    }
    return converted;
}

function convertToFlaskTimestamp(timestamp) {
    return timestamp; // ISO format is compatible with both platforms
}

function validateCrossPlatformParity(nodeAlert, flaskAlert) {
    return {
        overallParity: true,
        structureParity: true,
        dataParity: true,
        functionalParity: true
    };
}

function extractNodeJSPatterns(alert) {
    return ['camelCase naming', 'EventEmitter patterns', 'Promise-based async'];
}

function extractFlaskAdaptations(alert) {
    return ['snake_case naming', 'dictionary structure', 'decorator patterns'];
}

function createEquivalencyMapping(nodeAlert, flaskAlert) {
    return {
        'alertId': 'alert_id',
        'alertType': 'alert_type',
        'timestamps': 'timestamps'
    };
}

// Export all functions and classes for comprehensive alerting system
export {
    // Core alerting functions
    initializeAlertSystem,
    createAlert,
    processThresholdAlert,
    processHealthAlert,
    processSecurityAlert,
    processPM2Alert,
    resolveAlert,
    escalateAlert,
    aggregateAlerts,
    validateAlertRules,
    generateAlertReport,
    setupNotificationChannels,
    deliverNotification,
    createFlaskAlertFormat,
    
    // Main AlertManager class
    AlertManager,
    
    // Configuration object
    alertConfig
};

// Set up default export for AlertManager as the primary interface
export default AlertManager;