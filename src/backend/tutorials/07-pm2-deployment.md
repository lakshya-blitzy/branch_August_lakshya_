# PM2 Deployment Tutorial - Phase 7

Welcome to Phase 7 of the Node.js Tutorial Project! This comprehensive tutorial builds upon the Express.js implementation from Phase 2 and Flask migration from Phase 6, demonstrating production-ready process management using PM2 cluster mode that can increase performance by a factor of x10 on 16-core machines through built-in load balancing and horizontal scaling.

## Prerequisites and Phase 6 Review

Before diving into PM2 deployment, ensure you have completed the following prerequisites:

### Required Completions
- ✅ **Phase 2**: Express.js implementation with middleware stack and routing
- ✅ **Phase 6**: Flask migration completion and cross-platform validation
- ✅ **Node.js v22.x LTS**: Installation and ES Modules understanding
- ✅ **Express.js v5.1.0**: Middleware composition and production patterns

### System Requirements
```bash
# Verify Node.js version (minimum v22.x LTS)
node --version

# Verify npm availability
npm --version

# Check system resources for optimal PM2 performance
echo "CPU Cores: $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "Unknown")"
echo "Available Memory: $(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "Check manually")"
```

### Phase 6 Validation
Ensure your Phase 6 Flask implementation successfully demonstrates cross-platform compatibility:
```bash
# Validate Express.js application is functional
cd src/backend
node express-server.js

# Test endpoints
curl http://localhost:3000/hello
curl http://localhost:3000/good-evening
curl http://localhost:3000/health
```

## PM2 Process Manager Overview

PM2 (Process Manager 2) is a production-ready process manager for Node.js applications that provides advanced features for deployment, monitoring, and scaling.

### Core PM2 Capabilities

#### 1. Cluster Mode Architecture
PM2's cluster mode utilizes Node.js's built-in cluster module to spawn multiple worker processes that share the same server port:

```javascript
// PM2 Cluster Mode Benefits (from ecosystem.config.js)
const clusterBenefits = {
  loadBalancing: 'Built-in round-robin load balancer',
  performanceGain: 'x10 improvement on 16-core machines',
  failureRecovery: 'Automatic restart of failed workers',
  zeroDowntime: 'Seamless application updates',
  resourceUtilization: 'Full CPU core utilization'
};
```

#### 2. Built-in Load Balancer
PM2 includes a sophisticated load balancer that distributes HTTP/TCP/UDP queries across worker processes:
- **Round-robin algorithm** for even request distribution
- **Automatic failover** when worker processes crash
- **Health checking** to remove unhealthy workers from rotation
- **Session persistence** options for stateful applications

#### 3. Zero-Downtime Deployment
The `pm2 reload` command enables continuous service availability during updates:
```bash
# Traditional restart (downtime)
pm2 restart app

# Zero-downtime reload
pm2 reload app
```

### PM2 vs Traditional Process Management

| Feature | Traditional | PM2 Cluster Mode |
|---------|-------------|------------------|
| Process Count | 1 | CPU cores (max efficiency) |
| Load Balancing | None | Built-in round-robin |
| Failure Recovery | Manual restart | Automatic restart |
| Monitoring | Manual | Built-in dashboard |
| Deployment | Downtime required | Zero-downtime capable |
| Performance | Single-threaded | Multi-core utilization |

## PM2 Installation and Environment Setup

### Global PM2 Installation

```bash
# Install PM2 globally
npm install -g pm2@latest

# Verify installation
pm2 --version

# Check PM2 status (should show empty process list initially)
pm2 list

# Verify PM2 commands are available
pm2 --help
```

### PM2 System Integration

```bash
# Generate startup script for system boot
pm2 startup

# This command will output system-specific instructions like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u yourusername --hp /home/yourusername

# Execute the generated command (example for systemd)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Save current PM2 process list
pm2 save
```

### Development Environment Setup

Create a basic PM2 ecosystem file to test functionality:

```bash
# Create ecosystem config directory
mkdir -p src/backend/pm2

# Test PM2 with a simple configuration
cat > src/backend/pm2/test.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'test-app',
    script: '../express-server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
EOF

# Test PM2 startup
pm2 start src/backend/pm2/test.config.js

# Monitor the process
pm2 monit

# Stop and delete test process
pm2 delete test-app
```

## PM2 Ecosystem Configuration

The ecosystem configuration file is the cornerstone of PM2 deployment, centralizing all application and deployment settings.

### Master Ecosystem Configuration

Based on the imported `ecosystem.config.js`, here's the comprehensive configuration structure:

```javascript
// src/backend/pm2/ecosystem.config.js
import { createPM2Config, productionConfig } from '../config/pm2.js';
import { environmentConfig, isProduction } from '../config/environment.js';
import { ENV_CONSTANTS } from '../utils/constants.js';
import os from 'node:os';

/**
 * Master PM2 Ecosystem Configuration
 * Demonstrates comprehensive application definitions and environment-specific deployment settings
 */

// Determine optimal instance count based on environment and CPU cores
const getInstanceCount = (environment) => {
  if (environment === 'production') {
    return 'max'; // Use all CPU cores for maximum performance
  } else if (environment === 'staging') {
    return Math.max(2, Math.floor(os.cpus().length / 2)); // Half cores for staging
  } else {
    return 1; // Single instance for development
  }
};

// Production application configuration with cluster mode
const productionApp = {
  name: 'nodejs-tutorial-prod',
  script: '../app.js',
  instances: getInstanceCount('production'),
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  max_restarts: 10,
  min_uptime: '10s',
  autorestart: true,
  watch: false,
  env: {
    NODE_ENV: 'production',
    PORT: environmentConfig.server.port || 3000,
    PM2_SERVE_PATH: '.',
    PM2_SERVE_PORT: 8080,
    PM2_SERVE_SPA: 'true'
  },
  error_file: './logs/pm2-error.log',
  out_file: './logs/pm2-out.log',
  log_file: './logs/pm2-combined.log',
  time: true,
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  // Health check configuration
  health_check_grace_period: 3000,
  // Performance monitoring
  pmx: true,
  // Deployment hooks
  post_update: ['npm install', 'npm run build'],
  // Advanced cluster configuration
  listen_timeout: 3000,
  kill_timeout: 5000,
  // Resource limits
  max_old_space_size: 1024
};

// Development application configuration with file watching
const developmentApp = {
  name: 'nodejs-tutorial-dev',
  script: '../app.js',
  instances: 1,
  exec_mode: 'fork',
  watch: true,
  watch_delay: 1000,
  ignore_watch: [
    'node_modules',
    'logs',
    '*.log',
    '.git',
    '.pm2',
    'uploads',
    'temp'
  ],
  max_memory_restart: '500M',
  autorestart: true,
  env: {
    NODE_ENV: 'development',
    PORT: 3000,
    DEBUG: 'app:*'
  },
  error_file: './logs/pm2-dev-error.log',
  out_file: './logs/pm2-dev-out.log',
  log_file: './logs/pm2-dev-combined.log',
  time: true,
  source_map_support: true
};

// Comprehensive deployment configuration
const deploymentConfig = {
  production: {
    user: 'deploy',
    host: ['server1.example.com', 'server2.example.com'],
    ref: 'origin/main',
    repo: 'git@github.com:yourorg/nodejs-tutorial.git',
    path: '/var/www/nodejs-tutorial',
    'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env production',
    'post-setup': 'ls -la'
  },
  staging: {
    user: 'deploy',
    host: 'staging.example.com',
    ref: 'origin/develop',
    repo: 'git@github.com:yourorg/nodejs-tutorial.git',
    path: '/var/www/nodejs-tutorial-staging',
    'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env staging'
  }
};

// Master ecosystem configuration export
export const masterEcosystem = {
  apps: [
    // Choose app configuration based on environment
    isProduction ? productionApp : developmentApp
  ],
  deploy: deploymentConfig
};

// Factory function to create ecosystem configuration
export function createEcosystemConfig(environment, options = {}) {
  const config = createPM2Config(environment);
  
  return {
    apps: [{
      name: options.appName || `nodejs-tutorial-${environment}`,
      script: options.scriptPath || '../app.js',
      ...config,
      ...options
    }],
    deploy: environment === 'production' ? deploymentConfig : undefined
  };
}

export default masterEcosystem;
```

### Environment-Specific Configuration

Create specialized configurations for different deployment environments:

```javascript
// Development configuration with file watching
export const developmentConfig = {
  instances: 1,
  exec_mode: 'fork',
  watch: true,
  watch_delay: 1000,
  ignore_watch: ['node_modules', 'logs', '*.log'],
  env: {
    NODE_ENV: 'development',
    DEBUG: 'app:*'
  }
};

// Staging configuration with limited clustering
export const stagingConfig = {
  instances: Math.max(2, Math.floor(os.cpus().length / 2)),
  exec_mode: 'cluster',
  max_memory_restart: '750M',
  env: {
    NODE_ENV: 'staging',
    PORT: 3001
  }
};

// Production configuration with full optimization
export const productionConfig = {
  instances: 'max',
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  max_restarts: 10,
  min_uptime: '10s',
  autorestart: true,
  env: {
    NODE_ENV: 'production',
    PORT: 3000
  }
};
```

### Configuration Validation

Add validation to ensure ecosystem configuration integrity:

```javascript
// Configuration validation function
export function validateEcosystemConfig(config) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate required fields
  if (!config.apps || !Array.isArray(config.apps)) {
    validation.errors.push('Apps array is required');
    validation.isValid = false;
  }

  config.apps?.forEach((app, index) => {
    if (!app.name) {
      validation.errors.push(`App ${index}: name is required`);
      validation.isValid = false;
    }
    
    if (!app.script) {
      validation.errors.push(`App ${index}: script path is required`);
      validation.isValid = false;
    }

    // Validate cluster mode configuration
    if (app.exec_mode === 'cluster' && !app.instances) {
      validation.warnings.push(`App ${index}: instances not specified for cluster mode`);
    }

    // Validate memory limits
    if (app.max_memory_restart) {
      const memoryPattern = /^\d+[MGK]B?$/i;
      if (!memoryPattern.test(app.max_memory_restart)) {
        validation.warnings.push(`App ${index}: invalid memory limit format`);
      }
    }
  });

  return validation;
}
```

## PM2 Cluster Mode Implementation

Cluster mode is PM2's flagship feature, enabling horizontal scaling and load balancing across multiple CPU cores.

### Understanding Cluster Mode Architecture

```javascript
// Cluster mode implementation overview
const clusterModeArchitecture = {
  masterProcess: {
    role: 'Process coordinator and load balancer',
    responsibilities: [
      'Spawn and manage worker processes',
      'Distribute incoming requests via round-robin',
      'Monitor worker health and restart failed processes',
      'Handle graceful shutdown and reload operations'
    ]
  },
  workerProcesses: {
    count: 'Equal to CPU cores (configurable)',
    isolation: 'Separate memory space per worker',
    communication: 'IPC (Inter-Process Communication)',
    failureImpact: 'Isolated - one worker failure doesn\'t affect others'
  },
  loadBalancer: {
    algorithm: 'Round-robin by default',
    stickySession: 'Optional IP-based session affinity',
    healthChecking: 'Automatic unhealthy worker removal'
  }
};
```

### Cluster Mode Configuration

```javascript
// Advanced cluster configuration
export const clusterConfig = {
  // Basic cluster settings
  instances: 'max', // Use all available CPU cores
  exec_mode: 'cluster',
  
  // Instance management
  increment_var: 'PORT',
  instance_var: 'INSTANCE_ID',
  
  // Load balancing configuration
  listen_timeout: 3000,
  kill_timeout: 5000,
  
  // Worker process limits
  max_restarts: 10,
  min_uptime: '10s',
  restart_delay: 4000,
  
  // Memory management
  max_memory_restart: '1G',
  
  // Health monitoring
  health_check_grace_period: 3000,
  
  // Cluster-specific environment variables
  env: {
    NODE_ENV: 'production',
    CLUSTER_MODE: 'true',
    WORKER_PROCESS: 'true'
  }
};
```

### Demonstrating Cluster Mode Performance

Create a performance demonstration script:

```javascript
// src/backend/examples/cluster-performance-demo.js
import cluster from 'node:cluster';
import os from 'node:os';
import http from 'node:http';

/**
 * Demonstrates PM2 cluster mode performance benefits
 * Shows x10 performance improvement on 16-core machines
 */

export function demonstrateClusterMode() {
  const cpuCount = os.cpus().length;
  
  console.log(`🖥️  System Information:`);
  console.log(`   CPU Cores: ${cpuCount}`);
  console.log(`   Expected Performance Gain: ${calculatePerformanceGain(cpuCount)}x`);
  
  if (cluster.isPrimary) {
    console.log(`🎯 Starting ${cpuCount} worker processes...`);
    
    // Fork workers equal to CPU count
    for (let i = 0; i < cpuCount; i++) {
      const worker = cluster.fork();
      console.log(`   Worker ${worker.process.pid} started`);
    }
    
    // Monitor worker events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`❌ Worker ${worker.process.pid} died with code ${code}`);
      console.log('🔄 Starting replacement worker...');
      cluster.fork();
    });
    
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.process.pid} is online`);
    });
    
  } else {
    // Worker process - handle HTTP requests
    const server = http.createServer((req, res) => {
      // Simulate CPU-intensive work
      const start = Date.now();
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random();
      }
      
      const processingTime = Date.now() - start;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Cluster mode demonstration',
        worker: process.pid,
        processingTime,
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }));
    });
    
    server.listen(3000, () => {
      console.log(`🔧 Worker ${process.pid} listening on port 3000`);
    });
  }
}

function calculatePerformanceGain(cpuCount) {
  if (cpuCount >= 16) return 10; // Documented x10 improvement on 16+ cores
  if (cpuCount >= 8) return Math.floor(cpuCount * 0.8);
  if (cpuCount >= 4) return Math.floor(cpuCount * 0.7);
  return Math.max(2, cpuCount);
}

// Performance benchmarking utility
export async function benchmarkClusterPerformance(options = {}) {
  const {
    requestCount = 1000,
    concurrency = 10,
    targetUrl = 'http://localhost:3000'
  } = options;
  
  console.log(`🚀 Benchmarking cluster performance:`);
  console.log(`   Requests: ${requestCount}`);
  console.log(`   Concurrency: ${concurrency}`);
  console.log(`   Target: ${targetUrl}`);
  
  const startTime = Date.now();
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    workersUsed: new Set(),
    requestsPerSecond: 0
  };
  
  // Implementation would use a load testing library
  // This is a simplified demonstration
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  results.requestsPerSecond = results.totalRequests / duration;
  
  console.log(`📊 Benchmark Results:`);
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Requests/sec: ${results.requestsPerSecond.toFixed(2)}`);
  console.log(`   Success rate: ${(results.successfulRequests / results.totalRequests * 100).toFixed(2)}%`);
  console.log(`   Workers utilized: ${results.workersUsed.size}`);
  
  return results;
}
```

### Starting Applications in Cluster Mode

```bash
# Start application in cluster mode using ecosystem file
pm2 start ecosystem.config.js --env production

# Start with specific instance count
pm2 start app.js -i 4 --name "tutorial-cluster"

# Start with maximum instances (all CPU cores)
pm2 start app.js -i max --name "tutorial-max"

# Monitor cluster workers
pm2 monit

# Check process list
pm2 list

# View detailed process information
pm2 describe tutorial-cluster
```

### Cluster Mode Monitoring

```bash
# Real-time monitoring dashboard
pm2 monit

# Process status overview
pm2 status

# Memory usage across workers
pm2 list --sort memory

# CPU usage monitoring
pm2 list --sort cpu

# Restart specific worker
pm2 restart tutorial-cluster:0

# Scale cluster up/down
pm2 scale tutorial-cluster +2  # Add 2 more workers
pm2 scale tutorial-cluster 6   # Scale to exactly 6 workers
```

## Zero-Downtime Deployment with PM2

Zero-downtime deployment is critical for production applications to maintain service availability during updates.

### Understanding PM2 Reload vs Restart

```javascript
// Deployment operation comparison
const deploymentOperations = {
  restart: {
    operation: 'pm2 restart app',
    behavior: 'Stop all processes → Start all processes',
    downtime: 'Yes (several seconds)',
    useCase: 'Development, major configuration changes',
    riskLevel: 'High (service interruption)'
  },
  reload: {
    operation: 'pm2 reload app',
    behavior: 'Rolling restart of workers one by one',
    downtime: 'No (seamless transition)',
    useCase: 'Production deployments',
    riskLevel: 'Low (continuous availability)'
  },
  gracefulReload: {
    operation: 'pm2 gracefulReload app',
    behavior: 'Wait for connections to close before restarting',
    downtime: 'Minimal (connection draining)',
    useCase: 'Production with long-running connections',
    riskLevel: 'Very Low (graceful transition)'
  }
};
```

### Implementing Zero-Downtime Deployment

```javascript
// Zero-downtime deployment implementation
export function demonstrateZeroDowntimeDeployment() {
  console.log('🔄 Zero-Downtime Deployment Process:');
  console.log('');
  
  // Step 1: Pre-deployment validation
  console.log('1️⃣ Pre-deployment Validation');
  console.log('   ✅ Health check current application');
  console.log('   ✅ Validate new application code');
  console.log('   ✅ Run automated tests');
  console.log('   ✅ Check system resources');
  console.log('');
  
  // Step 2: Rolling update process
  console.log('2️⃣ Rolling Update Process');
  console.log('   🔄 Worker 1: Stop → Update → Start → Health Check');
  console.log('   🔄 Worker 2: Stop → Update → Start → Health Check');
  console.log('   🔄 Worker N: Stop → Update → Start → Health Check');
  console.log('   📊 Load balancer redistributes traffic automatically');
  console.log('');
  
  // Step 3: Post-deployment validation
  console.log('3️⃣ Post-deployment Validation');
  console.log('   ✅ All workers healthy and responsive');
  console.log('   ✅ Load balancer routing correctly');
  console.log('   ✅ Application functionality verified');
  console.log('   ✅ Performance metrics within acceptable range');
  console.log('');
  
  // Deployment commands
  console.log('📋 Zero-Downtime Deployment Commands:');
  console.log('');
  console.log('# Standard zero-downtime reload');
  console.log('pm2 reload ecosystem.config.js --env production');
  console.log('');
  console.log('# Graceful reload with connection draining');
  console.log('pm2 gracefulReload nodejs-tutorial-prod');
  console.log('');
  console.log('# Reload with update timeout');
  console.log('pm2 reload nodejs-tutorial-prod --update-env');
  console.log('');
  console.log('# Deploy with git integration');
  console.log('pm2 deploy production update');
}
```

### Deployment Hooks and Validation

```javascript
// Advanced deployment configuration with hooks
export const deploymentHooks = {
  apps: [{
    name: 'nodejs-tutorial-prod',
    script: './app.js',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Pre-deployment hooks
    pre_deploy: [
      'git pull origin main',
      'npm ci --production',
      'npm run build',
      'npm run test:smoke'
    ],
    
    // Post-deployment hooks
    post_deploy: [
      'pm2 reload ecosystem.config.js --env production',
      'sleep 5',
      'curl -f http://localhost:3000/health || exit 1',
      'echo "Deployment successful"'
    ],
    
    // Deployment validation
    post_update: [
      'npm install --production',
      'npm run build',
      'npm run test:integration'
    ],
    
    // Health check configuration
    health_check_grace_period: 3000,
    
    // Graceful shutdown handling
    listen_timeout: 3000,
    kill_timeout: 5000,
    
    // Environment variables for deployment tracking
    env_production: {
      NODE_ENV: 'production',
      DEPLOYMENT_ID: process.env.DEPLOYMENT_ID || Date.now().toString(),
      BUILD_VERSION: process.env.BUILD_VERSION || 'latest'
    }
  }]
};
```

### Deployment Monitoring and Rollback

```bash
# Monitor deployment progress
pm2 logs --follow

# Check deployment health
pm2 describe nodejs-tutorial-prod

# Validate all workers are healthy
pm2 status | grep "online"

# Performance check after deployment
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Rollback if issues detected
pm2 deploy production revert

# Emergency rollback (previous version)
pm2 restart nodejs-tutorial-prod --update-env
```

### Creating Deployment Scripts

```bash
#!/bin/bash
# deploy.sh - Zero-downtime deployment script

set -e

echo "🚀 Starting zero-downtime deployment..."

# Pre-deployment checks
echo "1️⃣ Pre-deployment validation..."
pm2 describe nodejs-tutorial-prod > /dev/null || {
  echo "❌ Application not running, starting fresh deployment"
  pm2 start ecosystem.config.js --env production
  exit 0
}

# Health check before deployment
echo "🩺 Checking application health..."
curl -f http://localhost:3000/health || {
  echo "❌ Application unhealthy before deployment"
  exit 1
}

# Record current deployment for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "📝 Current commit: $CURRENT_COMMIT"

# Update code
echo "📥 Updating application code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Run tests
echo "🧪 Running smoke tests..."
npm run test:smoke

# Zero-downtime reload
echo "🔄 Performing zero-downtime reload..."
pm2 reload ecosystem.config.js --env production

# Post-deployment validation
echo "✅ Post-deployment validation..."
sleep 5

# Health check after deployment
curl -f http://localhost:3000/health || {
  echo "❌ Application unhealthy after deployment, rolling back..."
  git reset --hard $CURRENT_COMMIT
  pm2 reload ecosystem.config.js --env production
  exit 1
}

echo "🎉 Zero-downtime deployment completed successfully!"
pm2 status
```

## PM2 Monitoring and Health Checks

Comprehensive monitoring is essential for production deployments to ensure application health and performance.

### Built-in PM2 Monitoring

```javascript
// PM2 monitoring integration
export function demonstrateMonitoringIntegration() {
  console.log('📊 PM2 Monitoring Capabilities:');
  console.log('');
  
  const monitoringFeatures = {
    realTimeMetrics: {
      description: 'Live process statistics and resource usage',
      command: 'pm2 monit',
      metrics: [
        'CPU usage per worker',
        'Memory consumption',
        'Request per minute',
        'Loop delay',
        'Active handles',
        'HTTP mean latency'
      ]
    },
    
    processManagement: {
      description: 'Process lifecycle monitoring',
      command: 'pm2 list',
      information: [
        'Process status (online/stopped/errored)',
        'Uptime tracking',
        'Restart count',
        'CPU and memory usage',
        'Process ID (PID)',
        'Watching status'
      ]
    },
    
    logAggregation: {
      description: 'Centralized log management',
      command: 'pm2 logs',
      features: [
        'Real-time log streaming',
        'Error and output separation',
        'Log rotation and archiving',
        'Log filtering and search',
        'JSON log formatting',
        'Remote log aggregation'
      ]
    },
    
    healthChecking: {
      description: 'Application health validation',
      implementation: 'Custom health check endpoints',
      features: [
        'HTTP endpoint monitoring',
        'Response time tracking',
        'Error rate monitoring',
        'Dependency health checks',
        'Database connectivity',
        'External service validation'
      ]
    }
  };
  
  Object.entries(monitoringFeatures).forEach(([feature, config]) => {
    console.log(`🔍 ${feature.toUpperCase()}`);
    console.log(`   Description: ${config.description}`);
    if (config.command) console.log(`   Command: ${config.command}`);
    if (config.metrics) {
      console.log('   Metrics:');
      config.metrics.forEach(metric => console.log(`     • ${metric}`));
    }
    if (config.features) {
      console.log('   Features:');
      config.features.forEach(feature => console.log(`     • ${feature}`));
    }
    console.log('');
  });
}
```

### Custom Health Check Implementation

```javascript
// src/backend/monitoring/health-check.js
import express from 'express';
import os from 'node:os';

/**
 * Comprehensive health check implementation for PM2 monitoring
 */
export function createHealthCheck(app) {
  // Basic health endpoint
  app.get('/health', (req, res) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      worker: {
        pid: process.pid,
        ppid: process.ppid,
        platform: process.platform,
        nodeVersion: process.version
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      system: {
        loadAverage: os.loadavg(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
        cpuCount: os.cpus().length
      }
    };
    
    res.status(200).json(healthData);
  });
  
  // Detailed health endpoint with dependency checks
  app.get('/health/detailed', async (req, res) => {
    const healthChecks = {
      application: await checkApplicationHealth(),
      database: await checkDatabaseHealth(),
      externalServices: await checkExternalServices(),
      fileSystem: await checkFileSystemHealth(),
      network: await checkNetworkHealth()
    };
    
    const overall = Object.values(healthChecks).every(check => check.status === 'healthy');
    
    const response = {
      status: overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      worker: process.pid,
      uptime: process.uptime()
    };
    
    res.status(overall ? 200 : 503).json(response);
  });
  
  // Readiness endpoint for load balancer
  app.get('/ready', (req, res) => {
    const ready = checkReadiness();
    res.status(ready ? 200 : 503).json({
      ready,
      timestamp: new Date().toISOString(),
      worker: process.pid
    });
  });
  
  // Liveness endpoint for process health
  app.get('/live', (req, res) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      worker: process.pid,
      uptime: process.uptime()
    });
  });
}

async function checkApplicationHealth() {
  try {
    // Check critical application components
    return {
      status: 'healthy',
      message: 'Application core functionality operational',
      details: {
        routes: 'accessible',
        middleware: 'functional',
        errorHandling: 'operational'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Application health check failed',
      error: error.message
    };
  }
}

async function checkDatabaseHealth() {
  try {
    // Database connectivity check would go here
    return {
      status: 'healthy',
      message: 'Database connectivity verified',
      responseTime: Math.random() * 10 // Simulated
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database health check failed',
      error: error.message
    };
  }
}

async function checkExternalServices() {
  // External service health checks
  return {
    status: 'healthy',
    message: 'External services operational',
    services: {
      api: 'connected',
      cache: 'operational'
    }
  };
}

async function checkFileSystemHealth() {
  try {
    const stats = await import('node:fs/promises').then(fs => fs.stat('.'));
    return {
      status: 'healthy',
      message: 'File system accessible',
      writable: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'File system check failed',
      error: error.message
    };
  }
}

async function checkNetworkHealth() {
  // Network connectivity checks
  return {
    status: 'healthy',
    message: 'Network connectivity verified',
    latency: Math.random() * 5
  };
}

function checkReadiness() {
  // Application readiness logic
  return process.uptime() > 10; // Ready after 10 seconds uptime
}
```

### PM2 Plus Integration (Optional)

```javascript
// PM2 Plus monitoring integration
export const pm2PlusIntegration = {
  // Link application to PM2 Plus for advanced monitoring
  pmx: true,
  
  // Custom metrics
  customMetrics: {
    'Active Users': () => getActiveUserCount(),
    'Database Queries/min': () => getDatabaseQueriesPerMinute(),
    'Cache Hit Rate': () => getCacheHitRate(),
    'Response Time P95': () => getResponseTimeP95()
  },
  
  // Alerts configuration
  alerts: {
    cpu: 80,      // Alert when CPU > 80%
    memory: 1024, // Alert when memory > 1GB
    requests: 1000 // Alert when requests/min > 1000
  },
  
  // Exception reporting
  exceptions: true,
  
  // Transaction tracing
  tracing: {
    enabled: true,
    ignore: ['/health', '/metrics', '/favicon.ico']
  }
};

// Simulated metric functions (replace with real implementations)
function getActiveUserCount() { return Math.floor(Math.random() * 100); }
function getDatabaseQueriesPerMinute() { return Math.floor(Math.random() * 500); }
function getCacheHitRate() { return (Math.random() * 100).toFixed(2); }
function getResponseTimeP95() { return Math.floor(Math.random() * 200); }
```

## Production Optimization and Configuration

Production environments require specific optimizations for performance, security, and reliability.

### Production-Optimized Ecosystem Configuration

```javascript
// Production-optimized configuration
export const productionOptimizedConfig = {
  apps: [{
    name: 'nodejs-tutorial-prod',
    script: './app.js',
    cwd: '/var/www/nodejs-tutorial',
    
    // Cluster configuration for maximum performance
    instances: 'max',
    exec_mode: 'cluster',
    
    // Memory management
    max_memory_restart: '1G',
    memory_limit: '1.5G',
    
    // Process resilience
    max_restarts: 15,
    min_uptime: '60s',
    restart_delay: 4000,
    
    // Auto-restart on crash
    autorestart: true,
    
    // Process monitoring
    watch: false, // Disabled in production
    ignore_watch: [],
    
    // Logging configuration
    log_type: 'json',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/nodejs-tutorial/error.log',
    out_file: '/var/log/nodejs-tutorial/out.log',
    log_file: '/var/log/nodejs-tutorial/combined.log',
    merge_logs: true,
    time: true,
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=1024',
      UV_THREADPOOL_SIZE: 128,
      PORT: 3000,
      
      // Performance optimization
      NODE_CLUSTER_SCHED_POLICY: 'rr', // Round-robin
      
      // Security
      HELMET_ENABLED: 'true',
      CORS_ENABLED: 'true',
      
      // Monitoring
      ENABLE_METRICS: 'true',
      HEALTH_CHECK_INTERVAL: '30000'
    },
    
    // Advanced options
    vizion: false, // Disable versioning in production
    pmx: true,     // Enable monitoring
    
    // Process management
    listen_timeout: 8000,
    kill_timeout: 1600,
    
    // Graceful shutdown
    shutdown_with_message: true,
    
    // Source maps (disabled for performance)
    source_map_support: false,
    
    // Instance variables
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT',
    
    // Deployment hooks
    post_update: [
      'npm install --only=production',
      'npm run build:production',
      'npm run test:production'
    ]
  }]
};
```

### Resource Optimization

```javascript
// Resource optimization strategies
export const resourceOptimization = {
  memory: {
    strategy: 'Optimized memory usage with automatic restart thresholds',
    configuration: {
      max_memory_restart: '1G',
      // V8 heap optimization
      nodeOptions: '--max-old-space-size=1024 --optimize-for-size',
      // Memory leak prevention
      restartCron: '0 2 * * *', // Daily restart at 2 AM
      monitoring: true
    }
  },
  
  cpu: {
    strategy: 'Maximum CPU utilization through cluster mode',
    configuration: {
      instances: 'max',
      exec_mode: 'cluster',
      // CPU affinity (Linux only)
      node_args: '--trace-warnings',
      // Thread pool optimization
      threadPoolSize: 128
    }
  },
  
  network: {
    strategy: 'Optimized network handling and connection management',
    configuration: {
      // Keep-alive settings
      keepAliveTimeout: 65000,
      headersTimeout: 66000,
      // Connection limits
      maxConnections: 1000,
      timeout: 30000
    }
  },
  
  fileSystem: {
    strategy: 'Efficient file system operations and logging',
    configuration: {
      // Log rotation
      maxLogSize: '100M',
      retainLogs: 5,
      // Temp file cleanup
      cleanupInterval: '24h'
    }
  }
};
```

### Security Hardening

```javascript
// Production security configuration
export const securityHardening = {
  processIsolation: {
    // Run with limited privileges
    uid: 'nodejs',
    gid: 'nodejs',
    
    // Process limits
    max_old_space_size: 1024,
    max_executable_size: 256
  },
  
  networkSecurity: {
    // Bind to specific interface
    host: '127.0.0.1',
    port: 3000,
    
    // SSL/TLS termination at load balancer
    trustProxy: true
  },
  
  fileSystemSecurity: {
    // Restricted file access
    cwd: '/var/www/nodejs-tutorial',
    
    // Log file permissions
    logPermissions: '640',
    
    // Prevent file watching vulnerabilities
    watch: false
  },
  
  environmentSecurity: {
    // Sanitized environment variables
    env_production: {
      NODE_ENV: 'production',
      // Remove development variables
      DEBUG: undefined,
      NODE_DEBUG: undefined
    }
  }
};
```

### Performance Monitoring

```javascript
// Production performance monitoring
export const performanceMonitoring = {
  metrics: {
    collection: 'Real-time performance metrics collection',
    retention: '30 days',
    aggregation: '1 minute intervals'
  },
  
  alerts: {
    responseTime: {
      threshold: '500ms',
      action: 'Scale up cluster'
    },
    errorRate: {
      threshold: '5%',
      action: 'Alert operations team'
    },
    memoryUsage: {
      threshold: '80%',
      action: 'Restart worker'
    },
    cpuUsage: {
      threshold: '90%',
      action: 'Scale horizontally'
    }
  },
  
  healthChecks: {
    interval: '30s',
    timeout: '5s',
    retries: 3,
    endpoints: ['/health', '/ready', '/live']
  },
  
  logging: {
    level: 'info',
    format: 'json',
    structured: true,
    correlation: true,
    sampling: 0.1 // Sample 10% of requests
  }
};
```

## Express.js Integration with PM2

Integrating Express.js applications with PM2 requires specific considerations for cluster mode compatibility and production deployment.

### Express.js Application Factory

```javascript
// Express.js application optimized for PM2 deployment
import express from 'express';
import { createHealthCheck } from './monitoring/health-check.js';

export function createExpressApp() {
  const app = express();
  
  // Trust proxy settings for PM2 cluster mode
  app.set('trust proxy', true);
  
  // Disable Express.js server header for security
  app.disable('x-powered-by');
  
  // Middleware stack configuration
  configureMiddleware(app);
  
  // Route configuration
  configureRoutes(app);
  
  // Health check endpoints
  createHealthCheck(app);
  
  // Error handling
  configureErrorHandling(app);
  
  return app;
}

function configureMiddleware(app) {
  // Security middleware (Helmet.js)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }));
  
  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }));
  
  // Compression for performance
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  }));
  
  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request correlation tracking
  app.use((req, res, next) => {
    req.correlationId = req.headers['x-request-id'] || generateRequestId();
    res.set('X-Request-ID', req.correlationId);
    next();
  });
}

function configureRoutes(app) {
  // Hello world endpoint
  app.get('/hello', (req, res) => {
    res.json({
      message: 'Hello world',
      worker: process.pid,
      instance: process.env.INSTANCE_ID || 0,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  });
  
  // Good evening endpoint
  app.get('/good-evening', (req, res) => {
    res.json({
      message: 'Good evening',
      worker: process.pid,
      instance: process.env.INSTANCE_ID || 0,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  });
  
  // Process information endpoint
  app.get('/process-info', (req, res) => {
    res.json({
      pid: process.pid,
      ppid: process.ppid,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        INSTANCE_ID: process.env.INSTANCE_ID,
        PM2_HOME: process.env.PM2_HOME
      }
    });
  });
}

function configureErrorHandling(app) {
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  });
  
  // Global error handler
  app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    
    res.status(statusCode).json({
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      worker: process.pid
    });
    
    // Log error for monitoring
    console.error('Application Error:', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      worker: process.pid
    });
  });
}
```

### Graceful Shutdown Handling

```javascript
// Graceful shutdown implementation for PM2 compatibility
export function setupGracefulShutdown(server) {
  const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        console.error('Error during server close:', err);
        process.exit(1);
      }
      
      console.log('Server closed successfully');
      
      // Cleanup resources
      cleanup()
        .then(() => {
          console.log('Cleanup completed, exiting...');
          process.exit(0);
        })
        .catch((cleanupErr) => {
          console.error('Cleanup failed:', cleanupErr);
          process.exit(1);
        });
    });
    
    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('Forced exit after 30 seconds');
      process.exit(1);
    }, 30000);
  };
  
  // Handle process signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
  
  // Handle PM2 graceful reload
  process.on('message', (message) => {
    if (message === 'shutdown') {
      gracefulShutdown('PM2_SHUTDOWN');
    }
  });
}

async function cleanup() {
  // Cleanup operations
  console.log('Performing cleanup operations...');
  
  // Close database connections
  // await database.close();
  
  // Clear intervals and timeouts
  // clearInterval(healthCheckInterval);
  
  // Flush logs
  // await logger.flush();
  
  console.log('Cleanup operations completed');
}
```

### Server Startup with PM2 Integration

```javascript
// Main server startup file optimized for PM2
import { createExpressApp } from './express-server.js';
import { setupGracefulShutdown } from './shutdown.js';

// Create Express application
const app = createExpressApp();

// Start server
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => {
  const address = server.address();
  console.log(`🚀 Server started successfully:`, {
    url: `http://${address.address}:${address.port}`,
    worker: process.pid,
    instance: process.env.INSTANCE_ID || 0,
    environment: process.env.NODE_ENV || 'development',
    cluster: !!process.env.PM2_HOME,
    timestamp: new Date().toISOString()
  });
  
  // Notify PM2 that the process is ready
  if (process.send) {
    process.send('ready');
  }
});

// Setup graceful shutdown
setupGracefulShutdown(server);

// Handle server startup errors
server.on('error', (error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

export { server, app };
```

## PM2 Command Line Interface and Automation

Mastering PM2 CLI commands is essential for efficient production deployment and management.

### Essential PM2 Commands

```bash
# Application Management
pm2 start app.js                    # Start application
pm2 start ecosystem.config.js       # Start using ecosystem file
pm2 start app.js --name myapp       # Start with custom name
pm2 start app.js -i max             # Start in cluster mode (all cores)
pm2 start app.js -i 4               # Start with 4 instances

# Process Control
pm2 restart myapp                   # Restart application (with downtime)
pm2 reload myapp                    # Zero-downtime restart
pm2 gracefulReload myapp            # Graceful zero-downtime restart
pm2 stop myapp                      # Stop application
pm2 delete myapp                    # Stop and remove application

# Scaling
pm2 scale myapp +3                  # Add 3 more instances
pm2 scale myapp 8                   # Scale to exactly 8 instances
pm2 scale myapp --                  # Scale down by 1

# Information and Monitoring
pm2 list                            # List all processes
pm2 status                          # Same as list
pm2 describe myapp                  # Detailed process information
pm2 monit                          # Real-time monitoring dashboard
pm2 logs                           # Stream all logs
pm2 logs myapp                     # Stream specific app logs
pm2 logs --follow                  # Follow logs in real-time

# Log Management
pm2 flush                          # Clear all logs
pm2 flush myapp                    # Clear specific app logs
pm2 reloadLogs                     # Reload log configuration

# Environment Management
pm2 start ecosystem.config.js --env production
pm2 restart myapp --update-env     # Restart with updated environment

# Deployment
pm2 deploy production setup        # Initial deployment setup
pm2 deploy production update       # Deploy latest changes
pm2 deploy production revert       # Revert to previous deployment

# Process Management
pm2 startup                        # Generate startup script
pm2 save                          # Save current process list
pm2 resurrect                     # Restore saved process list
pm2 unstartup                     # Disable startup script

# System Integration
pm2 install pm2-logrotate          # Install log rotation module
pm2 install pm2-server-monit       # Install system monitoring

# Advanced Commands
pm2 sendSignal SIGUSR2 myapp       # Send custom signal
pm2 trigger myapp restart          # Trigger custom action
pm2 prettylist                     # Formatted process list
pm2 jlist                          # JSON formatted list
```

### Automation Scripts

#### Deployment Automation Script

```bash
#!/bin/bash
# automated-deploy.sh - Comprehensive deployment automation

set -euo pipefail

# Configuration
APP_NAME="nodejs-tutorial"
ECOSYSTEM_FILE="ecosystem.config.js"
HEALTH_ENDPOINT="http://localhost:3000/health"
DEPLOYMENT_TIMEOUT=300
LOG_FILE="/var/log/pm2-deploy.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if PM2 is installed
    pm2 --version > /dev/null || error_exit "PM2 not installed"
    
    # Check if ecosystem file exists
    [ -f "$ECOSYSTEM_FILE" ] || error_exit "Ecosystem file not found: $ECOSYSTEM_FILE"
    
    # Check if application is currently running
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        log "Application is currently running"
        CURRENT_STATUS="running"
    else
        log "Application is not running"
        CURRENT_STATUS="stopped"
    fi
    
    # Check system resources
    FREE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$FREE_MEMORY" -lt 512 ]; then
        log "WARNING: Low free memory: ${FREE_MEMORY}MB"
    fi
    
    log "Pre-deployment checks completed"
}

# Deploy application
deploy_application() {
    log "Starting application deployment..."
    
    if [ "$CURRENT_STATUS" = "running" ]; then
        log "Performing zero-downtime reload..."
        pm2 reload "$ECOSYSTEM_FILE" --env production || error_exit "Failed to reload application"
    else
        log "Starting fresh application..."
        pm2 start "$ECOSYSTEM_FILE" --env production || error_exit "Failed to start application"
    fi
    
    log "Application deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            log "Health check passed"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log "Health check attempt $attempts/$max_attempts failed, retrying..."
        sleep 10
    done
    
    error_exit "Health check failed after $max_attempts attempts"
}

# Post-deployment validation
post_deployment_validation() {
    log "Starting post-deployment validation..."
    
    # Check process status
    local process_count
    process_count=$(pm2 list | grep "$APP_NAME" | grep "online" | wc -l)
    
    if [ "$process_count" -eq 0 ]; then
        error_exit "No online processes found"
    fi
    
    log "Found $process_count online processes"
    
    # Performance check
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "$HEALTH_ENDPOINT")
    
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        log "WARNING: High response time: ${response_time}s"
    else
        log "Response time acceptable: ${response_time}s"
    fi
    
    log "Post-deployment validation completed"
}

# Rollback function
rollback() {
    log "Starting rollback procedure..."
    
    # Stop current deployment
    pm2 stop "$APP_NAME" || log "WARNING: Failed to stop application during rollback"
    
    # Revert to previous version (if using git)
    if [ -d ".git" ]; then
        git reset --hard HEAD~1 || log "WARNING: Git rollback failed"
    fi
    
    # Restart application
    pm2 start "$ECOSYSTEM_FILE" --env production || error_exit "Rollback failed: Cannot start application"
    
    # Verify rollback
    sleep 10
    if curl -f "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        log "Rollback completed successfully"
    else
        error_exit "Rollback failed: Application unhealthy"
    fi
}

# Main deployment workflow
main() {
    log "========================================="
    log "Starting automated deployment workflow"
    log "========================================="
    
    # Trap errors and attempt rollback
    trap 'log "Deployment failed, attempting rollback..."; rollback' ERR
    
    pre_deployment_checks
    deploy_application
    health_check
    post_deployment_validation
    
    # Save PM2 process list
    pm2 save || log "WARNING: Failed to save PM2 process list"
    
    log "========================================="
    log "Deployment completed successfully!"
    log "========================================="
    
    # Display final status
    pm2 status
}

# Execute main function
main "$@"
```

#### Health Monitoring Script

```bash
#!/bin/bash
# health-monitor.sh - Continuous health monitoring

HEALTH_ENDPOINT="http://localhost:3000/health"
CHECK_INTERVAL=30
LOG_FILE="/var/log/health-monitor.log"
ALERT_THRESHOLD=3

failed_checks=0

while true; do
    timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    
    if curl -f "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        echo "[$timestamp] Health check PASSED" >> "$LOG_FILE"
        failed_checks=0
    else
        failed_checks=$((failed_checks + 1))
        echo "[$timestamp] Health check FAILED (${failed_checks}/${ALERT_THRESHOLD})" >> "$LOG_FILE"
        
        if [ $failed_checks -ge $ALERT_THRESHOLD ]; then
            echo "[$timestamp] ALERT: Application unhealthy, restarting..." >> "$LOG_FILE"
            pm2 restart nodejs-tutorial
            failed_checks=0
        fi
    fi
    
    sleep $CHECK_INTERVAL
done
```

### PM2 Configuration Management

```bash
#!/bin/bash
# pm2-config-manager.sh - PM2 configuration management utility

COMMAND="$1"
ENVIRONMENT="${2:-development}"

case "$COMMAND" in
    "validate")
        echo "Validating PM2 configuration..."
        pm2 start ecosystem.config.js --env "$ENVIRONMENT" --dry-run
        ;;
        
    "backup")
        echo "Backing up PM2 configuration..."
        pm2 save
        cp ~/.pm2/dump.pm2 "backup-$(date +%Y%m%d-%H%M%S).pm2"
        ;;
        
    "restore")
        BACKUP_FILE="$3"
        echo "Restoring PM2 configuration from $BACKUP_FILE..."
        cp "$BACKUP_FILE" ~/.pm2/dump.pm2
        pm2 resurrect
        ;;
        
    "status")
        echo "PM2 Status Report"
        echo "================="
        pm2 jlist | jq '.[] | {name: .name, status: .pm2_env.status, cpu: .monit.cpu, memory: .monit.memory}'
        ;;
        
    *)
        echo "Usage: $0 {validate|backup|restore|status} [environment] [backup_file]"
        exit 1
        ;;
esac
```

## Performance Testing and Benchmarking

Testing PM2 cluster mode performance is crucial to validate the x10 performance improvement on multi-core systems.

### Load Testing Setup

```bash
# Install load testing tools
npm install -g autocannon loadtest

# Basic performance test
autocannon -c 100 -d 30 http://localhost:3000/hello

# Comprehensive load test
loadtest -c 50 --rps 200 -t 60 http://localhost:3000/hello
```

### Performance Benchmarking Script

```bash
#!/bin/bash
# performance-benchmark.sh - Comprehensive performance testing

# Configuration
TARGET_URL="http://localhost:3000"
TEST_DURATION=60
CONCURRENCY_LEVELS=(1 10 50 100 200)
RESULTS_DIR="benchmark-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create results directory
mkdir -p "$RESULTS_DIR"

log() {
    echo "[$(date +'%H:%M:%S')] $1"
}

# Single process benchmark
benchmark_single_process() {
    log "Starting single process benchmark..."
    
    # Stop cluster and start single instance
    pm2 delete nodejs-tutorial 2>/dev/null || true
    pm2 start app.js --name nodejs-tutorial-single
    
    sleep 10
    
    # Run tests with different concurrency levels
    for concurrency in "${CONCURRENCY_LEVELS[@]}"; do
        log "Testing single process with $concurrency concurrent connections..."
        
        autocannon \
            -c "$concurrency" \
            -d "$TEST_DURATION" \
            -j \
            "$TARGET_URL/hello" \
            > "$RESULTS_DIR/single-${concurrency}c-${TIMESTAMP}.json"
        
        sleep 5
    done
    
    pm2 delete nodejs-tutorial-single
}

# Cluster mode benchmark
benchmark_cluster_mode() {
    log "Starting cluster mode benchmark..."
    
    # Start cluster mode
    pm2 start ecosystem.config.js --env production
    
    sleep 15
    
    # Run tests with different concurrency levels
    for concurrency in "${CONCURRENCY_LEVELS[@]}"; do
        log "Testing cluster mode with $concurrency concurrent connections..."
        
        autocannon \
            -c "$concurrency" \
            -d "$TEST_DURATION" \
            -j \
            "$TARGET_URL/hello" \
            > "$RESULTS_DIR/cluster-${concurrency}c-${TIMESTAMP}.json"
        
        sleep 5
    done
}

# Generate comparison report
generate_report() {
    log "Generating performance comparison report..."
    
    cat > "$RESULTS_DIR/report-${TIMESTAMP}.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>PM2 Performance Benchmark Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .improvement { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <h1>PM2 Cluster Mode Performance Benchmark</h1>
    <p>Test Date: $(date)</p>
    <p>Test Duration: ${TEST_DURATION} seconds per test</p>
    <p>CPU Cores: $(nproc)</p>
    
    <h2>Performance Comparison</h2>
    <table>
        <tr>
            <th>Concurrency</th>
            <th>Single Process (req/s)</th>
            <th>Cluster Mode (req/s)</th>
            <th>Improvement Factor</th>
        </tr>
EOF

    for concurrency in "${CONCURRENCY_LEVELS[@]}"; do
        single_rps=$(jq -r '.requests.mean' "$RESULTS_DIR/single-${concurrency}c-${TIMESTAMP}.json" 2>/dev/null || echo "N/A")
        cluster_rps=$(jq -r '.requests.mean' "$RESULTS_DIR/cluster-${concurrency}c-${TIMESTAMP}.json" 2>/dev/null || echo "N/A")
        
        if [[ "$single_rps" != "N/A" && "$cluster_rps" != "N/A" ]]; then
            improvement=$(echo "scale=2; $cluster_rps / $single_rps" | bc)
        else
            improvement="N/A"
        fi
        
        cat >> "$RESULTS_DIR/report-${TIMESTAMP}.html" << EOF
        <tr>
            <td>${concurrency}</td>
            <td>${single_rps}</td>
            <td>${cluster_rps}</td>
            <td class="improvement">${improvement}x</td>
        </tr>
EOF
    done
    
    cat >> "$RESULTS_DIR/report-${TIMESTAMP}.html" << 'EOF'
    </table>
    
    <h2>System Information</h2>
    <ul>
        <li>CPU Cores: $(nproc)</li>
        <li>Memory: $(free -h | grep Mem | awk '{print $2}')</li>
        <li>Node.js Version: $(node --version)</li>
        <li>PM2 Version: $(pm2 --version)</li>
    </ul>
</body>
</html>
EOF

    log "Report generated: $RESULTS_DIR/report-${TIMESTAMP}.html"
}

# Main execution
main() {
    log "Starting comprehensive performance benchmark"
    log "CPU Cores: $(nproc)"
    log "Results will be saved to: $RESULTS_DIR"
    
    benchmark_single_process
    benchmark_cluster_mode
    generate_report
    
    log "Benchmark completed successfully!"
    log "View report: open $RESULTS_DIR/report-${TIMESTAMP}.html"
}

main "$@"
```

### Performance Monitoring Script

```javascript
// performance-monitor.js - Real-time performance monitoring
import os from 'node:os';
import process from 'node:process';

export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      interval: options.interval || 5000,
      logToFile: options.logToFile || false,
      logFile: options.logFile || 'performance.log',
      ...options
    };
    
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimeTotal: 0,
      startTime: Date.now()
    };
    
    this.systemMetrics = {
      initialCpuUsage: process.cpuUsage(),
      initialTime: process.hrtime()
    };
  }
  
  start() {
    console.log('🚀 Performance monitoring started');
    
    setInterval(() => {
      this.collectMetrics();
      this.logMetrics();
    }, this.options.interval);
  }
  
  collectMetrics() {
    const currentTime = Date.now();
    const uptime = (currentTime - this.metrics.startTime) / 1000;
    
    // System metrics
    const currentCpuUsage = process.cpuUsage(this.systemMetrics.initialCpuUsage);
    const currentTime_hr = process.hrtime(this.systemMetrics.initialTime);
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / (currentTime_hr[0] * 1000000 + currentTime_hr[1] / 1000) * 100;
    
    const memoryUsage = process.memoryUsage();
    const loadAverage = os.loadavg();
    
    return {
      timestamp: new Date().toISOString(),
      uptime,
      process: {
        pid: process.pid,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        cpu: {
          user: currentCpuUsage.user,
          system: currentCpuUsage.system,
          percent: cpuPercent.toFixed(2)
        }
      },
      system: {
        loadAverage: loadAverage.map(load => load.toFixed(2)),
        freeMemory: Math.round(os.freemem() / 1024 / 1024),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
        cpuCount: os.cpus().length
      },
      application: {
        requests: this.metrics.requests,
        responses: this.metrics.responses,
        errors: this.metrics.errors,
        averageResponseTime: this.metrics.responses > 0 
          ? (this.metrics.responseTimeTotal / this.metrics.responses).toFixed(2)
          : 0,
        requestsPerSecond: (this.metrics.requests / uptime).toFixed(2),
        errorRate: this.metrics.requests > 0 
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
          : 0
      }
    };
  }
  
  logMetrics() {
    const metrics = this.collectMetrics();
    
    console.log(`📊 Performance Metrics [${metrics.timestamp}]`);
    console.log(`   Process: PID ${metrics.process.pid}, Memory: ${metrics.process.memory.heapUsed}MB, CPU: ${metrics.process.cpu.percent}%`);
    console.log(`   System: Load: [${metrics.system.loadAverage.join(', ')}], Memory: ${metrics.system.freeMemory}MB free`);
    console.log(`   Application: ${metrics.application.requestsPerSecond} req/s, ${metrics.application.averageResponseTime}ms avg, ${metrics.application.errorRate}% errors`);
    console.log('');
    
    if (this.options.logToFile) {
      // Write to log file
      require('fs').appendFileSync(this.options.logFile, JSON.stringify(metrics) + '\n');
    }
  }
  
  recordRequest() {
    this.metrics.requests++;
  }
  
  recordResponse(responseTime) {
    this.metrics.responses++;
    this.metrics.responseTimeTotal += responseTime;
  }
  
  recordError() {
    this.metrics.errors++;
  }
}

// Usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new PerformanceMonitor({ interval: 10000 });
  monitor.start();
}
```

## Troubleshooting and Best Practices

Common PM2 deployment issues and their solutions, along with production best practices.

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Problem: Application fails to start
# Solution: Check logs and configuration

# Check PM2 logs
pm2 logs nodejs-tutorial --lines 50

# Verify ecosystem configuration
pm2 start ecosystem.config.js --dry-run

# Check file permissions
ls -la app.js
ls -la ecosystem.config.js

# Verify Node.js compatibility
node --version
node app.js  # Test direct execution
```

#### 2. Memory Leaks and High Memory Usage

```bash
# Problem: Memory usage continuously increases
# Solution: Configure memory limits and monitoring

# Set memory restart threshold
pm2 start app.js --max-memory-restart 1G

# Monitor memory usage
pm2 monit

# Enable heap snapshots
pm2 start app.js --node-args="--inspect"

# Force garbage collection
pm2 trigger nodejs-tutorial gc
```

#### 3. Cluster Mode Issues

```bash
# Problem: Cluster workers not distributing load evenly
# Solution: Check cluster configuration and load balancing

# Verify cluster mode is active
pm2 describe nodejs-tutorial

# Check worker distribution
pm2 list | grep nodejs-tutorial

# Test load distribution
for i in {1..10}; do curl http://localhost:3000/process-info; done

# Restart cluster with updated configuration
pm2 reload ecosystem.config.js
```

#### 4. Zero-Downtime Deployment Failures

```bash
# Problem: pm2 reload causes service interruption
# Solution: Configure graceful shutdown and health checks

# Enable graceful shutdown in application
# (See graceful shutdown implementation above)

# Use graceful reload instead of standard reload
pm2 gracefulReload nodejs-tutorial

# Configure health check grace period
# Add to ecosystem.config.js:
# health_check_grace_period: 3000

# Monitor reload process
pm2 logs --follow &
pm2 reload nodejs-tutorial
```

#### 5. Log Management Issues

```bash
# Problem: Log files growing too large
# Solution: Configure log rotation

# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 5
pm2 set pm2-logrotate:compress true

# Manual log rotation
pm2 reloadLogs

# Clear logs
pm2 flush nodejs-tutorial
```

### Production Best Practices

#### 1. Environment Configuration

```javascript
// Best practices for environment configuration
export const productionBestPractices = {
  environment: {
    // Use environment-specific configurations
    NODE_ENV: 'production',
    
    // Optimize Node.js performance
    NODE_OPTIONS: '--max-old-space-size=1024',
    UV_THREADPOOL_SIZE: 128,
    
    // Security considerations
    NODE_TLS_REJECT_UNAUTHORIZED: '1',
    
    // Disable development features
    DEBUG: undefined,
    NODE_DEBUG: undefined
  },
  
  pm2Configuration: {
    // Use specific instance count instead of 'max' for predictability
    instances: process.env.PM2_INSTANCES || require('os').cpus().length,
    
    // Configure restart policies
    max_restarts: 10,
    min_uptime: '60s',
    restart_delay: 4000,
    
    // Memory management
    max_memory_restart: '1G',
    
    // Disable file watching in production
    watch: false,
    
    // Configure logging
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }
};
```

#### 2. Monitoring and Alerting

```javascript
// Production monitoring configuration
export const monitoringBestPractices = {
  healthChecks: {
    // Implement comprehensive health checks
    endpoints: ['/health', '/ready', '/live'],
    interval: 30000,
    timeout: 5000,
    retries: 3
  },
  
  metrics: {
    // Collect key performance indicators
    responseTime: 'Track P50, P95, P99 response times',
    errorRate: 'Monitor error percentage',
    throughput: 'Track requests per second',
    availability: 'Monitor uptime percentage'
  },
  
  alerting: {
    // Configure alerting thresholds
    highCpuUsage: '> 80% for 5 minutes',
    highMemoryUsage: '> 90% for 2 minutes',
    highErrorRate: '> 5% for 1 minute',
    slowResponseTime: '> 1000ms average for 2 minutes'
  },
  
  logging: {
    // Structured logging with correlation IDs
    format: 'json',
    level: 'info',
    correlationTracking: true,
    errorAggregation: true
  }
};
```

#### 3. Security Hardening

```javascript
// Security best practices for PM2 deployment
export const securityBestPractices = {
  processIsolation: {
    // Run PM2 processes with limited privileges
    user: 'pm2user',
    group: 'pm2group',
    
    // Limit process capabilities
    capabilities: ['CAP_NET_BIND_SERVICE'],
    
    // Use process namespaces (Linux)
    namespace: true
  },
  
  fileSystemSecurity: {
    // Restrict file system access
    cwd: '/opt/app',
    readOnlyRootFilesystem: true,
    
    // Secure log file permissions
    logFileMode: '640',
    logFileOwner: 'pm2user:pm2group'
  },
  
  networkSecurity: {
    // Bind to specific interfaces
    host: '127.0.0.1',
    
    // Use reverse proxy for SSL termination
    trustProxy: true,
    
    // Configure security headers
    securityHeaders: true
  },
  
  environmentSecurity: {
    // Sanitize environment variables
    removeDevVariables: ['DEBUG', 'NODE_DEBUG'],
    
    // Use secrets management
    secretsSource: 'external',
    
    // Validate configuration
    configValidation: true
  }
};
```

#### 4. Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance benchmarks acceptable

### Configuration
- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] SSL certificates valid
- [ ] Database migrations applied

### Infrastructure
- [ ] Server resources adequate
- [ ] Load balancer configured
- [ ] Monitoring systems active
- [ ] Backup systems operational

### PM2 Configuration
- [ ] Ecosystem file validated
- [ ] Memory limits appropriate
- [ ] Log rotation configured
- [ ] Health checks implemented

## Post-Deployment Checklist

### Verification
- [ ] All processes online
- [ ] Health checks passing
- [ ] Load balancing functional
- [ ] Monitoring active

### Performance
- [ ] Response times acceptable
- [ ] Error rates normal
- [ ] Resource utilization optimal
- [ ] Scaling working properly

### Security
- [ ] Security headers present
- [ ] Authentication working
- [ ] HTTPS functioning
- [ ] Access logs recording

### Documentation
- [ ] Deployment documented
- [ ] Runbook updated
- [ ] Team notified
- [ ] Change log updated
```

#### 5. Maintenance Procedures

```bash
#!/bin/bash
# maintenance-procedures.sh - Regular maintenance tasks

# Daily maintenance
daily_maintenance() {
    echo "Performing daily maintenance..."
    
    # Check application health
    pm2 status
    
    # Check log file sizes
    du -sh /var/log/pm2/*.log
    
    # Monitor memory usage
    pm2 list --sort memory
    
    # Check for stuck processes
    pm2 jlist | jq '.[] | select(.pm2_env.restart_time > 10)'
}

# Weekly maintenance
weekly_maintenance() {
    echo "Performing weekly maintenance..."
    
    # Restart applications to clear memory leaks
    pm2 gracefulReload all
    
    # Rotate logs
    pm2 reloadLogs
    
    # Update PM2
    npm update -g pm2
    
    # Save current configuration
    pm2 save
}

# Monthly maintenance
monthly_maintenance() {
    echo "Performing monthly maintenance..."
    
    # Full system restart (maintenance window)
    pm2 stop all
    pm2 start ecosystem.config.js --env production
    
    # Clean old logs
    find /var/log/pm2 -name "*.log.*" -mtime +30 -delete
    
    # Performance review
    generate_performance_report
}

# Execute based on parameter
case "$1" in
    "daily")   daily_maintenance ;;
    "weekly")  weekly_maintenance ;;
    "monthly") monthly_maintenance ;;
    *)         echo "Usage: $0 {daily|weekly|monthly}" ;;
esac
```

## Next Steps and Phase 8 Preparation

Congratulations! You've successfully completed Phase 7 and mastered PM2 deployment with cluster mode, zero-downtime deployment, and production optimization.

### Phase 7 Summary

You have accomplished:

✅ **PM2 Installation and Configuration**: Installed PM2 globally and configured ecosystem files
✅ **Cluster Mode Implementation**: Deployed applications with x10 performance improvement on multi-core systems
✅ **Zero-Downtime Deployment**: Implemented seamless application updates with PM2 reload
✅ **Production Optimization**: Applied enterprise-grade configurations and monitoring
✅ **Performance Testing**: Validated cluster mode benefits through comprehensive benchmarking
✅ **Troubleshooting Skills**: Learned common issues and production best practices

### Key Skills Acquired

**Technical Skills:**
- PM2 process manager installation and configuration
- Cluster mode implementation with horizontal scaling  
- Zero-downtime deployment using PM2 reload functionality
- Production optimization and configuration management
- Performance monitoring and health check integration
- Automated deployment scripting and CI/CD integration

**Conceptual Understanding:**
- PM2 process management architecture and cluster mode benefits
- Load balancing and horizontal scaling strategies
- Zero-downtime deployment patterns and continuous availability
- Production monitoring and observability practices
- Enterprise deployment patterns and automation

### Phase 8 Preparation: Comprehensive Production Practices

Phase 8 will build upon your PM2 deployment expertise to implement comprehensive production practices including:

#### Security Hardening
- **SSL/TLS Configuration**: HTTPS implementation and certificate management
- **Security Headers**: Advanced security middleware and vulnerability prevention  
- **Authentication & Authorization**: JWT tokens, OAuth2, and role-based access control
- **Input Validation**: Request sanitization and XSS/CSRF protection
- **Security Monitoring**: Intrusion detection and security event logging

#### Advanced Monitoring & Observability  
- **Application Performance Monitoring (APM)**: Distributed tracing and performance analytics
- **Centralized Logging**: ELK stack integration and log aggregation
- **Metrics Collection**: Custom metrics, alerting, and dashboard creation
- **Error Tracking**: Error aggregation, analysis, and notification systems
- **Business Metrics**: KPI tracking and business intelligence integration

#### Infrastructure as Code
- **Container Deployment**: Docker containerization and orchestration
- **Cloud Deployment**: AWS/Azure/GCP deployment strategies
- **Infrastructure Automation**: Terraform and cloud formation templates
- **CI/CD Pipelines**: GitHub Actions, Jenkins, and automated testing
- **Environment Management**: Staging, production, and blue-green deployments

### Validation Framework

Before proceeding to Phase 8, validate your Phase 7 implementation:

```bash
# Validation checklist
echo "Phase 7 Validation Checklist"
echo "============================="

# 1. PM2 Installation
pm2 --version && echo "✅ PM2 installed" || echo "❌ PM2 not installed"

# 2. Cluster Mode
pm2 list | grep -q "cluster" && echo "✅ Cluster mode active" || echo "❌ Cluster mode not active"

# 3. Zero-Downtime Deployment
pm2 reload nodejs-tutorial && echo "✅ Zero-downtime reload works" || echo "❌ Reload failed"

# 4. Health Checks
curl -f http://localhost:3000/health && echo "✅ Health checks working" || echo "❌ Health checks failed"

# 5. Performance Monitoring
pm2 monit --help && echo "✅ Monitoring available" || echo "❌ Monitoring not available"

# 6. Production Configuration
grep -q "production" ecosystem.config.js && echo "✅ Production config present" || echo "❌ Production config missing"

echo ""
echo "If all items show ✅, you're ready for Phase 8!"
```

### Resources for Continued Learning

**Official Documentation:**
- [PM2 Official Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

**Advanced Topics:**
- PM2 Plus for enterprise monitoring
- PM2 with Docker and Kubernetes
- Multi-server deployment with PM2
- Advanced load balancing strategies
- Performance optimization techniques

**Community Resources:**
- PM2 GitHub Repository
- Node.js Community
- DevOps and Production Deployment Forums

### Final Notes

You've now mastered production-ready process management with PM2, enabling your Node.js applications to achieve:

- **10x Performance Improvement**: Through cluster mode on multi-core systems
- **Zero-Downtime Deployments**: Ensuring continuous service availability
- **Enterprise-Grade Monitoring**: Comprehensive health checks and metrics
- **Production Optimization**: Memory management, logging, and security
- **Automated Operations**: Deployment scripts and maintenance procedures

This foundation prepares you for Phase 8, where you'll implement comprehensive production practices including advanced security, monitoring, and infrastructure automation.

**Ready to proceed to Phase 8: Comprehensive Production Practices!** 🚀

---

*This tutorial is part of the Node.js Tutorial Project educational series. For questions, issues, or contributions, please refer to the project documentation and community guidelines.*