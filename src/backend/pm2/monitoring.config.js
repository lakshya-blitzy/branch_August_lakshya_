/**
 * @fileoverview PM2 Monitoring Configuration Module
 * @description Configuration utilities for PM2 process monitoring, health checks, and performance tracking
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

/**
 * Sets up PM2 monitoring configuration
 * @param {Object} options - Monitoring options
 * @returns {Object} PM2 monitoring configuration
 */
export function setupPM2Monitoring(options = {}) {
  return {
    enabled: options.enabled ?? true,
    interval: options.interval || 30000,
    metrics: options.metrics || ['cpu', 'memory', 'heap'],
    ...options
  };
}

/**
 * Creates health check configuration for PM2
 * @param {Object} options - Health check options
 * @returns {Object} Health check configuration
 */
export function createHealthCheckConfig(options = {}) {
  return {
    enabled: options.enabled ?? true,
    endpoint: options.endpoint || '/health',
    timeout: options.timeout || 5000,
    interval: options.interval || 60000,
    ...options
  };
}

/**
 * Configures performance monitoring for PM2 processes
 * @param {Object} options - Performance monitoring options
 * @returns {Object} Performance monitoring configuration
 */
export function configurePerformanceMonitoring(options = {}) {
  return {
    enabled: options.enabled ?? true,
    metrics: {
      responseTime: options.responseTime ?? true,
      throughput: options.throughput ?? true,
      errorRate: options.errorRate ?? true,
      memoryUsage: options.memoryUsage ?? true,
      cpuUsage: options.cpuUsage ?? true
    },
    thresholds: {
      responseTime: options.responseTimeThreshold || 1000,
      memoryUsage: options.memoryThreshold || 512 * 1024 * 1024, // 512MB
      cpuUsage: options.cpuThreshold || 80,
      errorRate: options.errorRateThreshold || 0.05 // 5%
    },
    alerts: {
      enabled: options.alertsEnabled ?? true,
      channels: options.alertChannels || ['console'],
      ...options.alerts
    },
    ...options
  };
}

/**
 * Default health check configuration
 */
export const healthCheckConfig = createHealthCheckConfig({
  enabled: true,
  endpoint: '/health',
  timeout: 5000,
  interval: 60000
});

/**
 * Default performance configuration
 */
export const performanceConfig = configurePerformanceMonitoring({
  enabled: true,
  responseTimeThreshold: 1000,
  memoryThreshold: 512 * 1024 * 1024,
  cpuThreshold: 80,
  errorRateThreshold: 0.05
});