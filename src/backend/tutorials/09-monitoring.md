# Phase 9: Comprehensive Monitoring Implementation

Welcome to Phase 9 of the Node.js tutorial series! In this phase, you'll learn how to implement advanced monitoring patterns that are essential for production-ready applications. We'll cover health checks, PM2 process monitoring, performance metrics collection, and real-time alerting systems.

## Table of Contents

1. [Introduction](#introduction)
2. [Health Check Implementation](#health-check-implementation)
3. [PM2 Monitoring Setup](#pm2-monitoring-setup)
4. [Metrics Collection](#metrics-collection)
5. [Performance Monitoring](#performance-monitoring)
6. [Cross-Platform Comparison](#cross-platform-comparison)
7. [Production Deployment](#production-deployment)
8. [Conclusion](#conclusion)

## Introduction

### Why Monitoring Matters

Monitoring Node.js applications effectively is no longer optional—it's essential for ensuring performance, reliability, and a smooth user experience. With PM2's built-in monitoring capabilities and custom health check implementation, we can create robust monitoring systems without complex infrastructure.

### What You'll Learn

- Implement comprehensive health check endpoints
- Configure PM2's built-in monitoring features
- Create custom metrics collection systems
- Build performance monitoring dashboards
- Set up automated alerting mechanisms
- Compare monitoring approaches between Node.js and Flask

### Prerequisites

- Completed Phases 1-8 of the tutorial series
- Node.js v22.x LTS installed
- Express.js v5.1.0 application running
- PM2 process manager configured
- Basic understanding of HTTP status codes and JSON responses

## Health Check Implementation

### Basic Health Check Endpoint

Health checks are fundamental for monitoring application availability and readiness. Let's implement a comprehensive health check system:

```javascript
// Import the HealthCheckManager from our monitoring system
import { HealthCheckManager } from '../monitoring/health-check.js';

const healthCheckManager = new HealthCheckManager();

// Basic health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthCheckManager.getHealthStatus();
    
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      ...healthStatus
    };
    
    res.status(200).json(healthCheck);
  } catch (error) {
    const healthCheck = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    };
    
    res.status(503).json(healthCheck);
  }
});

// Detailed health check with dependency validation
app.get('/health/detailed', async (req, res) => {
  try {
    const healthReport = await healthCheckManager.generateHealthReport();
    res.status(200).json(healthReport);
  } catch (error) {
    res.status(503).json({
      status: 'UNHEALTHY',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Advanced Health Monitoring

The HealthCheckManager provides comprehensive monitoring capabilities:

```javascript
// Start continuous health monitoring
await healthCheckManager.startMonitoring({
  interval: 30000, // Check every 30 seconds
  thresholds: {
    memory: 500 * 1024 * 1024, // Max 500MB memory usage
    cpu: 80, // Max 80% CPU usage
    responseTime: 100 // Max 100ms response time
  }
});

// Execute specific health checks
const systemHealth = await healthCheckManager.executeHealthCheck();
console.log('System Health:', systemHealth);
```

### Health Check Best Practices

1. **Response Time Tracking**: Monitor the response time of your server to identify performance bottlenecks
2. **Uptime Monitoring**: Track application uptime to measure reliability
3. **Status Code Validation**: Ensure consistent HTTP status codes (200 for healthy, 503 for unhealthy)
4. **Timestamp Inclusion**: Always include timestamps for log correlation and debugging

## PM2 Monitoring Setup

### Built-in PM2 Monitoring Features

PM2 provides comprehensive monitoring capabilities out of the box. Here's how to leverage them effectively:

```javascript
// Import PM2Monitor for advanced monitoring configuration
import { PM2Monitor } from '../pm2/monitoring.config.js';

const pm2Monitor = new PM2Monitor({
  application: 'tutorial-app',
  instances: 'max', // Utilize all CPU cores
  monitoring: {
    enabled: true,
    interval: 5000, // Monitor every 5 seconds
    alerts: true
  }
});

// Start PM2 monitoring
await pm2Monitor.startMonitoring();

// Collect process metrics
const processMetrics = await pm2Monitor.collectProcessMetrics();
console.log('Process Metrics:', processMetrics);

// Get cluster-wide metrics
const clusterMetrics = await pm2Monitor.getClusterMetrics();
console.log('Cluster Performance:', clusterMetrics);
```

### PM2 Configuration for Production Monitoring

Create a comprehensive PM2 ecosystem configuration:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tutorial-app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Memory management
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Monitoring configuration
    monitoring: true,
    pmx: true,
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      MONITORING_ENABLED: true
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONITORING_ENABLED: true,
      LOG_LEVEL: 'info'
    },
    
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced monitoring
    instance_var: 'INSTANCE_ID',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
```

### Real-time PM2 Monitoring Commands

Essential PM2 monitoring commands for production:

```bash
# Real-time monitoring dashboard
pm2 monit

# Process status overview
pm2 list

# Detailed process information
pm2 describe tutorial-app

# Memory and CPU usage
pm2 info tutorial-app

# Log streaming
pm2 logs tutorial-app --lines 100

# Restart with zero downtime
pm2 reload tutorial-app

# Reset restart counter
pm2 reset tutorial-app
```

### Threshold Validation and Alerting

Implement automated threshold validation:

```javascript
// Validate system thresholds
const thresholdResults = await pm2Monitor.validateThresholds({
  memory: {
    warning: 750 * 1024 * 1024, // 750MB warning
    critical: 1000 * 1024 * 1024 // 1GB critical
  },
  cpu: {
    warning: 70, // 70% CPU warning
    critical: 90  // 90% CPU critical
  },
  responseTime: {
    warning: 100, // 100ms warning
    critical: 500 // 500ms critical
  }
});

if (thresholdResults.hasWarnings) {
  console.warn('Performance warnings detected:', thresholdResults.warnings);
}

if (thresholdResults.hasCritical) {
  console.error('Critical thresholds exceeded:', thresholdResults.critical);
  // Trigger alerts or automated recovery actions
}
```

## Metrics Collection

### Custom Metrics Implementation

The MetricsCollector provides comprehensive application metrics:

```javascript
// Import MetricsCollector for custom metrics
import { MetricsCollector } from '../monitoring/metrics.js';

const metricsCollector = new MetricsCollector({
  collectionInterval: 10000, // Collect every 10 seconds
  enablePersistence: true,
  outputFormat: 'json'
});

// Start metrics collection
await metricsCollector.startCollection();

// Collect comprehensive metrics
const currentMetrics = await metricsCollector.collectMetrics();
console.log('Application Metrics:', currentMetrics);

// Validate against thresholds
const thresholdValidation = await metricsCollector.validateThresholds({
  responseTime: 100,
  memoryUsage: 500 * 1024 * 1024,
  errorRate: 0.01 // 1% error rate threshold
});

// Export metrics for external monitoring systems
const exportedMetrics = await metricsCollector.exportMetrics('prometheus');
```

### Application Performance Metrics

Key metrics to monitor in your Node.js application:

```javascript
// Request/Response metrics middleware
app.use((req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
    
    // Record metrics
    metricsCollector.recordMetric('http_request_duration', responseTime, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
    
    metricsCollector.recordMetric('http_requests_total', 1, {
      method: req.method,
      status_code: res.statusCode
    });
  });
  
  next();
});

// Memory usage tracking
setInterval(() => {
  const memUsage = process.memoryUsage();
  metricsCollector.recordMetric('memory_usage_bytes', memUsage.heapUsed, {
    type: 'heap_used'
  });
  metricsCollector.recordMetric('memory_usage_bytes', memUsage.heapTotal, {
    type: 'heap_total'
  });
  metricsCollector.recordMetric('memory_usage_bytes', memUsage.rss, {
    type: 'rss'
  });
}, 30000);
```

### Metrics Dashboard Integration

Create endpoints for metrics consumption:

```javascript
// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await metricsCollector.exportMetrics('prometheus');
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// JSON metrics endpoint
app.get('/metrics/json', async (req, res) => {
  try {
    const metrics = await metricsCollector.collectMetrics();
    res.json({
      timestamp: new Date().toISOString(),
      metrics: metrics,
      collection_interval: metricsCollector.getCollectionInterval()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});
```

## Performance Monitoring

### Advanced Performance Tracking

Implement comprehensive performance monitoring with the PerformanceMonitor:

```javascript
// Import performance monitoring utilities
import { 
  PerformanceMonitor, 
  measureResponseTime, 
  trackApplicationUptime 
} from '../monitoring/performance.js';

const performanceMonitor = new PerformanceMonitor({
  enabledMetrics: ['responseTime', 'throughput', 'errorRate', 'uptime'],
  samplingRate: 1.0, // Monitor 100% of requests
  alertThresholds: {
    responseTime: 100, // 100ms
    errorRate: 0.05,   // 5%
    memoryUsage: 512 * 1024 * 1024 // 512MB
  }
});

// Start performance monitoring
await performanceMonitor.startMonitoring();

// Get current performance metrics
const performanceMetrics = await performanceMonitor.getPerformanceMetrics();
console.log('Performance Data:', performanceMetrics);

// Generate comprehensive performance report
const performanceReport = await performanceMonitor.generatePerformanceReport();
```

### Response Time Measurement

Implement precise response time tracking:

```javascript
// Middleware for response time tracking
app.use(async (req, res, next) => {
  const responseTimeData = await measureResponseTime(req, res, async () => {
    next();
  });
  
  // Log performance data
  console.log(`${req.method} ${req.path} - ${responseTimeData.duration}ms`);
  
  // Record in performance monitor
  performanceMonitor.recordResponseTime(responseTimeData.duration, {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode
  });
});
```

### Application Uptime Tracking

Monitor application availability and uptime:

```javascript
// Track application uptime
const uptimeTracker = trackApplicationUptime({
  startTime: Date.now(),
  checkInterval: 60000, // Check every minute
  persistToFile: true,
  filePath: './logs/uptime.log'
});

// Get uptime statistics
app.get('/uptime', (req, res) => {
  const uptimeStats = uptimeTracker.getUptimeStats();
  res.json({
    current_uptime: process.uptime(),
    uptime_percentage: uptimeStats.percentage,
    total_downtime: uptimeStats.totalDowntime,
    last_restart: uptimeStats.lastRestart,
    restart_count: uptimeStats.restartCount
  });
});
```

### Performance Benchmarking

Implement application benchmarking capabilities:

```javascript
// Benchmark application performance
app.get('/benchmark', async (req, res) => {
  try {
    const benchmarkResults = await performanceMonitor.benchmarkApplication({
      duration: 30000, // 30 second benchmark
      concurrency: 10,  // 10 concurrent requests
      endpoints: ['/hello', '/good-evening', '/health']
    });
    
    res.json({
      benchmark_completed_at: new Date().toISOString(),
      results: benchmarkResults,
      recommendations: generatePerformanceRecommendations(benchmarkResults)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Benchmark failed',
      message: error.message
    });
  }
});

function generatePerformanceRecommendations(results) {
  const recommendations = [];
  
  if (results.averageResponseTime > 100) {
    recommendations.push('Consider optimizing response time - current average exceeds 100ms');
  }
  
  if (results.errorRate > 0.01) {
    recommendations.push('Error rate is above 1% - investigate error sources');
  }
  
  if (results.memoryUsage > 500 * 1024 * 1024) {
    recommendations.push('Memory usage is high - consider memory optimization');
  }
  
  return recommendations;
}
```

## Cross-Platform Comparison

### Flask Monitoring Implementation

To demonstrate cross-platform monitoring capabilities, here's the equivalent Flask implementation:

```python
# Flask health check implementation
from flask import Flask, jsonify
import time
import psutil
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/health')
def health_check():
    try:
        # Collect system metrics
        memory_info = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        health_data = {
            'status': 'OK',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'uptime': time.time() - psutil.boot_time(),
            'environment': os.environ.get('FLASK_ENV', 'development'),
            'memory': {
                'total': memory_info.total,
                'available': memory_info.available,
                'percent': memory_info.percent
            },
            'cpu': {
                'percent': cpu_percent,
                'count': psutil.cpu_count()
            }
        }
        
        return jsonify(health_data), 200
        
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'error': str(e)
        }), 503

@app.route('/metrics')
def metrics():
    """Prometheus-compatible metrics endpoint"""
    try:
        memory_info = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent()
        
        metrics_text = f"""# HELP python_memory_usage_bytes Memory usage in bytes
# TYPE python_memory_usage_bytes gauge
python_memory_usage_bytes{{type="used"}} {memory_info.used}
python_memory_usage_bytes{{type="available"}} {memory_info.available}

# HELP python_cpu_usage_percent CPU usage percentage
# TYPE python_cpu_usage_percent gauge
python_cpu_usage_percent {cpu_percent}

# HELP python_uptime_seconds Application uptime in seconds
# TYPE python_uptime_seconds counter
python_uptime_seconds {time.time() - psutil.boot_time()}
"""
        
        return metrics_text, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate metrics'}), 500
```

### Monitoring Feature Comparison

| Feature | Node.js + PM2 | Flask + Gunicorn | Advantage |
|---------|---------------|------------------|-----------|
| Process Management | PM2 cluster mode with built-in load balancer | Gunicorn workers with manual configuration | Node.js - Automatic scaling and load balancing |
| Health Checks | Express middleware with async/await | Flask decorators with synchronous responses | Node.js - Better async handling |
| Metrics Collection | Native Node.js process APIs | psutil library for system metrics | Flask - More comprehensive system metrics |
| Real-time Monitoring | PM2 `monit` command with live dashboard | Manual implementation required | Node.js - Built-in monitoring tools |
| Memory Management | V8 garbage collection with automatic optimization | Python memory management with manual tuning | Node.js - Automatic memory optimization |
| Performance Scaling | PM2 cluster mode (x10 performance increase) | Gunicorn workers (linear scaling) | Node.js - Superior scaling performance |

### Implementation Consistency

Both implementations maintain identical API interfaces:

```javascript
// Node.js endpoint testing
const nodeResponse = await fetch('http://localhost:3000/health');
const nodeHealth = await nodeResponse.json();

// Flask endpoint testing  
const flaskResponse = await fetch('http://localhost:5000/health');
const flaskHealth = await flaskResponse.json();

// Validate response consistency
console.assert(nodeHealth.status === flaskHealth.status);
console.assert(typeof nodeHealth.uptime === typeof flaskHealth.uptime);
console.assert(nodeHealth.timestamp && flaskHealth.timestamp);
```

## Production Deployment

### PM2 Production Configuration

Configure PM2 for production monitoring with advanced features:

```javascript
// Advanced production ecosystem configuration
module.exports = {
  apps: [{
    name: 'tutorial-app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Performance optimization
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024 --optimize-for-size',
    
    // Monitoring and observability
    monitoring: true,
    pmx: true,
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_restarts: 5,
    min_uptime: '10s',
    
    // Environment configuration
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      LOG_LEVEL: 'info',
      MONITORING_ENABLED: true,
      METRICS_INTERVAL: 30000,
      HEALTH_CHECK_PATH: '/health'
    },
    
    // Advanced logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_type: 'json',
    merge_logs: true,
    
    // Instance management
    instance_var: 'INSTANCE_ID',
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Source map support for better debugging
    source_map_support: true,
    
    // Custom startup script
    startup_script: './scripts/startup.sh',
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};
```

### Production Monitoring Best Practices

1. **Health Check Strategy**:
   ```javascript
   // Implement multiple health check levels
   app.get('/health/liveness', livenessCheck);  // Basic aliveness
   app.get('/health/readiness', readinessCheck); // Service readiness
   app.get('/health/deep', deepHealthCheck);     // Comprehensive check
   ```

2. **Alerting Configuration**:
   ```javascript
   const alertingConfig = {
     memory: {
       warning: 800 * 1024 * 1024, // 800MB
       critical: 1000 * 1024 * 1024 // 1GB
     },
     cpu: {
       warning: 75,  // 75% CPU
       critical: 90  // 90% CPU
     },
     responseTime: {
       warning: 200,  // 200ms
       critical: 500  // 500ms
     },
     errorRate: {
       warning: 0.02, // 2%
       critical: 0.05 // 5%
     }
   };
   ```

3. **Log Management**:
   ```bash
   # Install PM2 log rotation
   pm2 install pm2-logrotate
   
   # Configure log rotation
   pm2 set pm2-logrotate:max_size 100M
   pm2 set pm2-logrotate:retain 30
   pm2 set pm2-logrotate:compress true
   ```

4. **Startup Integration**:
   ```bash
   # Generate startup script
   pm2 startup
   
   # Save PM2 configuration
   pm2 save
   
   # Test startup script
   sudo systemctl status pm2-$USER
   ```

### Monitoring Dashboard Setup

Create a comprehensive monitoring dashboard:

```javascript
// Dashboard endpoint
app.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      system: await getSystemMetrics(),
      application: await getApplicationMetrics(),
      pm2: await getPM2Metrics(),
      health: await getHealthStatus(),
      performance: await getPerformanceMetrics()
    };
    
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({
      error: 'Dashboard data collection failed',
      message: error.message
    });
  }
});

async function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    loadAverage: os.loadavg(),
    platform: os.platform(),
    nodeVersion: process.version
  };
}

async function getApplicationMetrics() {
  return await metricsCollector.collectMetrics();
}

async function getPM2Metrics() {
  return await pm2Monitor.getClusterMetrics();
}

async function getHealthStatus() {
  return await healthCheckManager.getHealthStatus();
}

async function getPerformanceMetrics() {
  return await performanceMonitor.getPerformanceMetrics();
}
```

## Conclusion

### What You've Accomplished

In Phase 9, you've successfully implemented a comprehensive monitoring system that includes:

1. **Health Check System**: Robust health monitoring with multiple check levels
2. **PM2 Integration**: Production-ready process monitoring and management
3. **Metrics Collection**: Custom metrics collection and threshold validation
4. **Performance Monitoring**: Advanced performance tracking and benchmarking
5. **Cross-Platform Knowledge**: Understanding differences between Node.js and Flask monitoring
6. **Production Deployment**: Enterprise-grade monitoring configuration

### Key Monitoring Principles

1. **Proactive Monitoring**: Monitor applications before issues occur
2. **Comprehensive Metrics**: Collect system, application, and business metrics
3. **Threshold-Based Alerting**: Set appropriate warning and critical thresholds
4. **Zero-Downtime Operations**: Use PM2 reload for continuous availability
5. **Performance Optimization**: Use monitoring data to optimize application performance

### Next Steps

- **Phase 10**: Implement advanced security monitoring and audit logging
- **Phase 11**: Add distributed tracing and observability
- **Phase 12**: Integrate with external monitoring platforms (Prometheus, Grafana)

### Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Performance Monitoring](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Health Check Patterns](https://microservices.io/patterns/observability/health-check-api.html)

Congratulations on completing Phase 9! Your application now has enterprise-grade monitoring capabilities that will help ensure reliability, performance, and maintainability in production environments.

---

*This tutorial is part of the comprehensive Node.js learning series. Continue to Phase 10 to explore advanced security monitoring and audit logging patterns.*

export const monitoringTutorialContent = {
  introduction: `# Phase 9: Comprehensive Monitoring Implementation

Welcome to Phase 9 of the Node.js tutorial series! In this phase, you'll learn how to implement advanced monitoring patterns that are essential for production-ready applications. We'll cover health checks, PM2 process monitoring, performance metrics collection, and real-time alerting systems.

## Why Monitoring Matters

Monitoring Node.js applications effectively is no longer optional—it's essential for ensuring performance, reliability, and a smooth user experience. With PM2's built-in monitoring capabilities and custom health check implementation, we can create robust monitoring systems without complex infrastructure.`,

  healthCheckSection: `## Health Check Implementation

### Basic Health Check Endpoint

Health checks are fundamental for monitoring application availability and readiness. The HealthCheckManager provides comprehensive monitoring capabilities including:

- Real-time health status reporting
- Dependency validation and monitoring
- Performance threshold checking
- Automated health report generation

Key features include startMonitoring(), executeHealthCheck(), getHealthStatus(), and generateHealthReport() methods for complete health management.`,

  pm2MonitoringSection: `## PM2 Monitoring Setup

### Built-in PM2 Monitoring Features

PM2 provides comprehensive monitoring capabilities out of the box. The PM2Monitor offers:

- Real-time process metrics collection
- Cluster-wide performance monitoring  
- Automated threshold validation and alerting
- Zero-downtime deployment monitoring

Essential capabilities include startMonitoring(), collectProcessMetrics(), getClusterMetrics(), and validateThresholds() for production-ready process management.`,

  metricsCollectionSection: `## Metrics Collection

### Custom Metrics Implementation

The MetricsCollector provides comprehensive application metrics including:

- HTTP request/response metrics tracking
- Memory and CPU usage monitoring  
- Custom business metrics collection
- Prometheus-compatible metrics export

Core functionality includes collectMetrics(), validateThresholds(), startCollection(), and exportMetrics() for complete observability.`,

  performanceMonitoringSection: `## Performance Monitoring

### Advanced Performance Tracking

The PerformanceMonitor with measureResponseTime and trackApplicationUptime utilities provides:

- Precise response time measurement
- Application uptime tracking and statistics
- Performance benchmarking capabilities
- Automated performance report generation

Key methods include startMonitoring(), getPerformanceMetrics(), benchmarkApplication(), and generatePerformanceReport() for comprehensive performance analysis.`,

  crossPlatformComparison: `## Cross-Platform Comparison

### Flask vs Node.js Monitoring

Comparing monitoring implementations between Node.js + PM2 and Flask + Gunicorn:

**Node.js Advantages:**
- PM2 cluster mode with built-in load balancer
- Automatic scaling and process management
- Superior async handling for health checks
- Built-in monitoring tools and dashboard

**Flask Advantages:**  
- More comprehensive system metrics via psutil
- Simpler deployment for basic applications
- Extensive Python ecosystem for monitoring tools

Both maintain identical API interfaces for consistent monitoring endpoints.`,

  productionDeployment: `## Production Deployment

### PM2 Production Configuration

Advanced production monitoring setup includes:

- Cluster mode with automatic load balancing
- Memory limits and automatic restart policies
- Comprehensive logging and log rotation
- Health check integration and startup scripts

Best practices include multi-level health checks, threshold-based alerting, proper log management, and startup integration for enterprise-grade reliability.`,

  conclusion: `## Conclusion

### What You've Accomplished

You've successfully implemented:
- Robust health check system with multiple check levels
- PM2 integration for production-ready process monitoring
- Custom metrics collection and threshold validation  
- Advanced performance tracking and benchmarking
- Cross-platform monitoring knowledge
- Enterprise-grade monitoring configuration

Your application now has comprehensive monitoring capabilities essential for production environments.`
};

export const codeExamples = {
  basicHealthCheck: `// Basic health check implementation
import { HealthCheckManager } from '../monitoring/health-check.js';

const healthCheckManager = new HealthCheckManager();

app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthCheckManager.getHealthStatus();
    
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      ...healthStatus
    };
    
    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});`,

  pm2MonitoringSetup: `// PM2 monitoring configuration
import { PM2Monitor } from '../pm2/monitoring.config.js';

const pm2Monitor = new PM2Monitor({
  application: 'tutorial-app',
  instances: 'max',
  monitoring: {
    enabled: true,
    interval: 5000,
    alerts: true
  }
});

// Start monitoring and collect metrics
await pm2Monitor.startMonitoring();
const processMetrics = await pm2Monitor.collectProcessMetrics();
const clusterMetrics = await pm2Monitor.getClusterMetrics();

// Validate thresholds
const thresholdResults = await pm2Monitor.validateThresholds({
  memory: { warning: 750 * 1024 * 1024, critical: 1000 * 1024 * 1024 },
  cpu: { warning: 70, critical: 90 },
  responseTime: { warning: 100, critical: 500 }
});`,

  metricsCollectionExample: `// Comprehensive metrics collection
import { MetricsCollector } from '../monitoring/metrics.js';

const metricsCollector = new MetricsCollector({
  collectionInterval: 10000,
  enablePersistence: true,
  outputFormat: 'json'
});

// Start collection and gather metrics
await metricsCollector.startCollection();
const metrics = await metricsCollector.collectMetrics();

// Validate thresholds and export
const validation = await metricsCollector.validateThresholds({
  responseTime: 100,
  memoryUsage: 500 * 1024 * 1024,
  errorRate: 0.01
});

const exportedMetrics = await metricsCollector.exportMetrics('prometheus');

// Request metrics middleware
app.use((req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
    metricsCollector.recordMetric('http_request_duration', responseTime, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  
  next();
});`,

  performanceMonitoringExample: `// Advanced performance monitoring
import { 
  PerformanceMonitor,
  measureResponseTime,
  trackApplicationUptime 
} from '../monitoring/performance.js';

const performanceMonitor = new PerformanceMonitor({
  enabledMetrics: ['responseTime', 'throughput', 'errorRate', 'uptime'],
  samplingRate: 1.0,
  alertThresholds: {
    responseTime: 100,
    errorRate: 0.05,
    memoryUsage: 512 * 1024 * 1024
  }
});

// Start monitoring and collect data
await performanceMonitor.startMonitoring();
const metrics = await performanceMonitor.getPerformanceMetrics();
const report = await performanceMonitor.generatePerformanceReport();

// Response time measurement middleware
app.use(async (req, res, next) => {
  const responseTimeData = await measureResponseTime(req, res, async () => {
    next();
  });
  
  performanceMonitor.recordResponseTime(responseTimeData.duration, {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode
  });
});

// Uptime tracking
const uptimeTracker = trackApplicationUptime({
  startTime: Date.now(),
  checkInterval: 60000,
  persistToFile: true,
  filePath: './logs/uptime.log'
});`,

  flaskMonitoringComparison: `# Flask monitoring implementation for comparison
from flask import Flask, jsonify
import time
import psutil
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/health')
def health_check():
    try:
        memory_info = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        health_data = {
            'status': 'OK',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'uptime': time.time() - psutil.boot_time(),
            'environment': os.environ.get('FLASK_ENV', 'development'),
            'memory': {
                'total': memory_info.total,
                'available': memory_info.available,
                'percent': memory_info.percent
            },
            'cpu': {
                'percent': cpu_percent,
                'count': psutil.cpu_count()
            }
        }
        
        return jsonify(health_data), 200
        
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'error': str(e)
        }), 503

@app.route('/metrics')
def metrics():
    """Prometheus-compatible metrics endpoint"""
    memory_info = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent()
    
    return f"""# HELP python_memory_usage_bytes Memory usage
python_memory_usage_bytes{{type="used"}} {memory_info.used}
# HELP python_cpu_usage_percent CPU usage
python_cpu_usage_percent {cpu_percent}
""", 200, {'Content-Type': 'text/plain; charset=utf-8'}`
};

export const tutorialExercises = [
  {
    title: "Health Check Implementation",
    description: "Implement a comprehensive health check system with multiple endpoints and dependency validation",
    difficulty: "Intermediate",
    timeEstimate: "45 minutes",
    objectives: [
      "Create basic /health endpoint with system metrics",
      "Implement /health/detailed with dependency checks", 
      "Add /health/liveness and /health/readiness endpoints",
      "Configure automatic health monitoring with thresholds"
    ],
    hints: [
      "Use HealthCheckManager.getHealthStatus() for basic checks",
      "Leverage HealthCheckManager.generateHealthReport() for detailed analysis",
      "Set appropriate HTTP status codes (200 for healthy, 503 for unhealthy)",
      "Include timestamps and uptime in all health responses"
    ],
    validation: [
      "Health endpoints return proper JSON responses",
      "Error conditions return appropriate HTTP status codes",
      "Health checks complete within 2 seconds",
      "System metrics are accurately reported"
    ]
  },
  {
    title: "PM2 Cluster Monitoring",
    description: "Configure PM2 for production monitoring with cluster mode and automated alerting",
    difficulty: "Advanced",
    timeEstimate: "60 minutes", 
    objectives: [
      "Create comprehensive PM2 ecosystem configuration",
      "Implement cluster-wide metrics collection",
      "Set up threshold-based alerting system",
      "Configure automatic restart and recovery policies"
    ],
    hints: [
      "Use PM2Monitor.startMonitoring() for initialization",
      "Configure memory limits with max_memory_restart",
      "Set up proper logging with log rotation",
      "Test zero-downtime deployment with pm2 reload"
    ],
    validation: [
      "PM2 cluster mode runs with max CPU utilization",
      "Process metrics are collected every 5 seconds",
      "Memory threshold alerts trigger correctly",
      "Zero-downtime reload completes successfully"
    ]
  },
  {
    title: "Metrics Collection",
    description: "Build a custom metrics collection system with Prometheus export capabilities",
    difficulty: "Advanced",
    timeEstimate: "75 minutes",
    objectives: [
      "Implement HTTP request/response metrics tracking",
      "Create memory and CPU usage monitoring",
      "Build Prometheus-compatible metrics endpoint",
      "Set up automated threshold validation"
    ],
    hints: [
      "Use MetricsCollector.startCollection() for initialization",
      "Record metrics in middleware for all HTTP requests",
      "Export metrics using MetricsCollector.exportMetrics('prometheus')",
      "Validate thresholds every collection interval"
    ],
    validation: [
      "Metrics are collected for all HTTP requests",
      "/metrics endpoint returns Prometheus format",
      "Memory and CPU metrics update regularly",
      "Threshold validation triggers appropriate alerts"
    ]
  },
  {
    title: "Performance Benchmarking",
    description: "Implement comprehensive performance monitoring and benchmarking system",
    difficulty: "Expert",
    timeEstimate: "90 minutes",
    objectives: [
      "Create response time measurement middleware",
      "Implement application uptime tracking",
      "Build automated performance benchmarking",
      "Generate performance optimization recommendations"
    ],
    hints: [
      "Use measureResponseTime() for precise timing",
      "Track uptime with trackApplicationUptime()",
      "Benchmark with PerformanceMonitor.benchmarkApplication()",
      "Generate recommendations based on threshold analysis"
    ],
    validation: [
      "Response times are measured accurately",
      "Uptime statistics are maintained persistently",
      "Benchmarking completes successfully",
      "Performance recommendations are generated"
    ]
  },
  {
    title: "Cross-Platform Monitoring Comparison",
    description: "Compare monitoring implementations between Node.js and Flask platforms",
    difficulty: "Intermediate",
    timeEstimate: "60 minutes",
    objectives: [
      "Implement equivalent Flask health check endpoints",
      "Compare system metrics collection approaches",
      "Validate API response consistency",
      "Document platform-specific advantages"
    ],
    hints: [
      "Use psutil for Python system metrics",
      "Maintain identical JSON response formats",
      "Test both platforms with same validation criteria",
      "Document performance and feature differences"
    ],
    validation: [
      "Flask endpoints return identical response structure",
      "System metrics are accurate on both platforms",
      "Response times are comparable between implementations",
      "Feature comparison is documented thoroughly"
    ]
  }
];

export const monitoringBestPractices = {
  healthCheckPatterns: [
    {
      pattern: "Multi-Level Health Checks",
      description: "Implement liveness, readiness, and detailed health check endpoints",
      implementation: "Create /health/liveness for basic aliveness, /health/readiness for service readiness, /health/deep for comprehensive dependency checks",
      benefits: ["Better debugging capabilities", "Granular monitoring", "Kubernetes compatibility"]
    },
    {
      pattern: "Response Time Tracking", 
      description: "Monitor server response times to identify performance bottlenecks",
      implementation: "Include response time measurement in health check responses and track trends over time",
      benefits: ["Performance optimization insights", "SLA monitoring", "User experience validation"]
    },
    {
      pattern: "Dependency Validation",
      description: "Check external dependencies and services in health endpoints",
      implementation: "Validate database connections, external APIs, and critical services in detailed health checks",
      benefits: ["Early problem detection", "Root cause analysis", "Service reliability monitoring"]
    },
    {
      pattern: "Status Code Consistency",
      description: "Use consistent HTTP status codes for different health states",
      implementation: "Return 200 for healthy, 503 for unhealthy, 429 for rate limited, 500 for errors",
      benefits: ["Load balancer compatibility", "Monitoring tool integration", "Clear status communication"]
    }
  ],

  pm2ProductionConfig: {
    clusterMode: {
      instances: "max",
      execMode: "cluster",
      description: "Utilize all CPU cores with automatic load balancing",
      benefits: ["Maximum performance utilization", "Fault tolerance", "Automatic scaling"]
    },
    memoryManagement: {
      maxMemoryRestart: "1G",
      nodeArgs: "--max-old-space-size=1024",
      description: "Automatic restart on memory threshold to prevent memory leaks",
      benefits: ["Memory leak prevention", "Consistent performance", "Automatic recovery"]
    },
    monitoring: {
      enabled: true,
      pmx: true,
      description: "Enable built-in PM2 monitoring and PMX integration",
      benefits: ["Real-time metrics", "Performance insights", "Process health tracking"]
    },
    logging: {
      logFile: "./logs/combined.log",
      logRotation: true,
      description: "Centralized logging with automatic rotation",
      benefits: ["Log management", "Debugging capabilities", "Audit trail"]
    }
  },

  metricsThresholds: {
    responseTime: {
      warning: 100,
      critical: 500,
      unit: "milliseconds",
      description: "HTTP response time thresholds for performance monitoring"
    },
    memoryUsage: {
      warning: 750 * 1024 * 1024,
      critical: 1024 * 1024 * 1024,
      unit: "bytes", 
      description: "Memory usage thresholds for process management"
    },
    cpuUsage: {
      warning: 70,
      critical: 90,
      unit: "percentage",
      description: "CPU utilization thresholds for performance monitoring"
    },
    errorRate: {
      warning: 0.02,
      critical: 0.05,
      unit: "percentage",
      description: "Application error rate thresholds for reliability monitoring"
    }
  },

  performanceTargets: {
    responseTime: {
      target: 50,
      acceptable: 100,
      unit: "milliseconds",
      description: "Target response times for optimal user experience"
    },
    throughput: {
      target: 1000,
      acceptable: 500,
      unit: "requests per second",
      description: "Request handling capacity targets"
    },
    availability: {
      target: 99.9,
      acceptable: 99.5,
      unit: "percentage",
      description: "Service availability targets for SLA compliance"
    },
    memoryEfficiency: {
      target: 100,
      acceptable: 200,
      unit: "MB per process",
      description: "Memory usage efficiency targets"
    }
  },

  alertingStrategies: [
    {
      strategy: "Threshold-Based Alerting",
      description: "Configure alerts based on performance and resource thresholds",
      implementation: "Set warning and critical thresholds for key metrics with appropriate escalation",
      useCase: "Memory usage, CPU utilization, response time monitoring"
    },
    {
      strategy: "Trend-Based Alerting",
      description: "Alert on metric trends rather than absolute values",
      implementation: "Monitor rate of change in metrics over time windows",
      useCase: "Gradual memory leaks, performance degradation, error rate increases"
    },
    {
      strategy: "Composite Alerting",
      description: "Combine multiple metrics for intelligent alerting",
      implementation: "Alert when multiple related metrics exceed thresholds simultaneously",
      useCase: "System overload detection, cascade failure prevention"
    },
    {
      strategy: "Anomaly Detection",
      description: "Use statistical analysis to detect unusual patterns",
      implementation: "Compare current metrics against historical baselines",
      useCase: "Unusual traffic patterns, performance anomalies, security events"
    }
  ]
};