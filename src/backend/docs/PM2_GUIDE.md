# PM2 Process Manager Guide

> **Comprehensive PM2 Deployment Guide for Node.js Tutorial Project**  
> Production-ready PM2 cluster mode setup with zero-downtime deployment capabilities and enterprise-grade process management for Express.js v5.1.0 applications

## Table of Contents

1. [Introduction & Overview](#introduction--overview)
2. [PM2 Installation & Setup](#pm2-installation--setup)
3. [Ecosystem Configuration](#ecosystem-configuration)
4. [Cluster Mode Setup](#cluster-mode-setup)
5. [Zero-Downtime Deployment](#zero-downtime-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Best Practices](#best-practices)
10. [Educational Examples](#educational-examples)

---

## Introduction & Overview

### What is PM2?

PM2 is an advanced production process manager for Node.js applications that keeps applications alive forever, reloads them without downtime, and facilitates common system administration tasks. PM2 is particularly powerful for Node.js applications as it provides:

- **Cluster Mode**: Increases performance by a factor of **x10 on 16 cores machines** through built-in load balancing
- **Zero-Downtime Deployment**: Graceful reload functionality ensuring continuous service availability
- **Process Management**: Automatic restart, monitoring, and health checks
- **Production Optimization**: Memory management, CPU optimization, and resource limits

### Educational Objectives

This guide serves as **Phase 5: PM2 Production Deployment** of the Node.js Tutorial Project and aims to teach:

1. **Production Deployment Patterns**: Understanding modern deployment strategies with PM2
2. **Cluster Mode Implementation**: Horizontal scaling through process multiplication
3. **Zero-Downtime Operations**: Maintaining service availability during updates
4. **Process Monitoring**: Real-time application health and performance tracking
5. **Performance Optimization**: Achieving maximum throughput with resource efficiency
6. **Operational Excellence**: Production-ready deployment and maintenance procedures

### Prerequisites

- **Node.js v22.x LTS**: Required for Express.js v5.1.0 compatibility
- **Express.js v5.1.0**: Enhanced security and performance features
- **npm**: Package manager for PM2 installation
- **Basic HTTP Server**: Completed Phase 1 and Phase 2 of the tutorial
- **System Administration**: Basic understanding of process management

### Performance Targets

| Metric | Target Value | Method |
|--------|--------------|--------|
| **Performance Boost** | x10 on 16 cores machines | PM2 cluster mode |
| **Deployment Time** | < 5 seconds | Zero-downtime reload |
| **Process Restart** | < 2 seconds | Individual worker restart |
| **Health Check** | < 100ms | Monitoring endpoints |
| **Log Processing** | < 5% overhead | Optimized logging |

---

## PM2 Installation & Setup

### Global PM2 Installation

PM2 should be installed globally to manage processes system-wide:

```bash
# Install PM2 globally
npm install -g pm2@latest

# Verify installation
pm2 --version
# Expected: 6.0.8 or higher

# Check PM2 status
pm2 status
```

### Node.js Version Verification

Ensure Node.js v22.x LTS compatibility:

```bash
# Verify Node.js version
node --version
# Expected: v22.x.x (LTS)

# Check npm version
npm --version
# Expected: 10.x.x or higher
```

### System Prerequisites Validation

```bash
# Check available CPU cores
node -e "console.log('CPU Cores:', require('os').cpus().length)"

# Check available memory
node -e "console.log('Memory:', Math.round(require('os').totalmem() / 1024 / 1024 / 1024), 'GB')"

# Verify PM2 can start processes
pm2 start --help
```

### PM2 Environment Setup

```bash
# Set PM2 home directory (optional)
export PM2_HOME=~/.pm2

# Generate startup script for system boot
pm2 startup

# Save current PM2 process list
pm2 save
```

### Installation Troubleshooting

**Common Issues:**

1. **Permission Errors**: Use `sudo` for global installation or use Node Version Manager (nvm)
2. **PATH Issues**: Ensure npm global bin directory is in PATH
3. **Node.js Version**: PM2 requires Node.js 12.x or higher (recommended: 22.x LTS)

```bash
# Fix permission issues (Linux/macOS)
sudo npm install -g pm2

# Alternative: use npx (no global installation)
npx pm2 --version

# Check npm global path
npm config get prefix
```

---

## Ecosystem Configuration

### Understanding Ecosystem Files

PM2 ecosystem files (`ecosystem.config.js`) provide declarative configuration for applications, enabling consistent deployments across environments.

### Basic Ecosystem Configuration

Create `src/backend/pm2/ecosystem.config.js`:

```javascript
/**
 * PM2 Ecosystem Configuration for Node.js Tutorial Project
 * Production-ready deployment with cluster mode and monitoring
 */

module.exports = {
  apps: [{
    // Application identification
    name: 'nodejs-tutorial-app',
    script: '../server.js',
    
    // Cluster mode configuration
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    
    // Process management
    autorestart: true,
    max_restarts: 15,
    restart_delay: 4000,
    max_memory_restart: '1G',
    
    // Environment configuration
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      PM2_SERVE_PATH: '.',
      PM2_SERVE_PORT: 3000
    },
    
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring and health checks
    monitoring: true,
    health_check_grace_period: 3000,
    
    // Advanced features
    source_map_support: true,
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT'
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server'],
      ref: 'origin/main',
      repo: 'git@github.com:username/nodejs-tutorial.git',
      path: '/var/www/nodejs-tutorial',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### Environment-Specific Configuration

#### Development Configuration

```javascript
// Development optimized settings
const developmentConfig = {
  name: 'nodejs-tutorial-dev',
  script: '../server.js',
  instances: 1, // Single instance for debugging
  exec_mode: 'fork',
  autorestart: false, // Disable for debugging
  watch: true, // Enable file watching
  watch_delay: 1000,
  ignore_watch: ['node_modules', 'logs', '.git'],
  env: {
    NODE_ENV: 'development',
    DEBUG: '*',
    PORT: 3000
  }
};
```

#### Production Configuration

```javascript
// Production optimized settings
const productionConfig = {
  name: 'nodejs-tutorial-prod',
  script: '../server.js',
  instances: 'max', // Use all CPU cores
  exec_mode: 'cluster',
  autorestart: true,
  max_restarts: 15,
  restart_delay: 4000,
  max_memory_restart: '1G',
  kill_timeout: 5000,
  listen_timeout: 3000,
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000
  },
  node_args: [
    '--max-old-space-size=1024',
    '--optimize-for-size'
  ]
};
```

### Dynamic Configuration Generation

```javascript
/**
 * Dynamic ecosystem configuration based on environment
 */
const os = require('os');

function createEcosystemConfig(environment = 'production') {
  const cpuCores = os.cpus().length;
  const isProduction = environment === 'production';
  
  return {
    apps: [{
      name: `nodejs-tutorial-${environment}`,
      script: '../server.js',
      
      // Intelligent instance scaling
      instances: isProduction ? 'max' : 1,
      exec_mode: isProduction ? 'cluster' : 'fork',
      
      // Environment-specific process management
      autorestart: isProduction,
      max_restarts: isProduction ? 15 : 3,
      restart_delay: isProduction ? 4000 : 1000,
      max_memory_restart: isProduction ? '1G' : '512M',
      
      // Environment variables
      env: {
        NODE_ENV: environment,
        PORT: 3000,
        PM2_CLUSTER_MODE: isProduction,
        PM2_INSTANCE_COUNT: isProduction ? cpuCores : 1
      },
      
      // Development features
      watch: !isProduction,
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs'],
      
      // Logging
      log_file: `./logs/${environment}-combined.log`,
      error_file: `./logs/${environment}-error.log`,
      out_file: `./logs/${environment}-out.log`,
      
      // Production optimizations
      source_map_support: isProduction,
      treekill: isProduction,
      pmx: isProduction
    }]
  };
}

module.exports = createEcosystemConfig(process.env.NODE_ENV || 'production');
```

### Configuration Validation

```javascript
/**
 * Validate ecosystem configuration
 */
function validateEcosystemConfig(config) {
  const errors = [];
  
  if (!config.apps || !Array.isArray(config.apps)) {
    errors.push('Missing or invalid apps array');
  }
  
  config.apps.forEach((app, index) => {
    if (!app.name) errors.push(`App ${index}: Missing name`);
    if (!app.script) errors.push(`App ${index}: Missing script`);
    if (!app.instances) errors.push(`App ${index}: Missing instances`);
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

## Cluster Mode Setup

### Understanding Cluster Mode

PM2's cluster mode utilizes Node.js cluster module to create multiple worker processes that share the same server port. This provides:

- **Load Balancing**: Built-in round-robin load balancer
- **Performance Scaling**: Linear performance increase with CPU cores
- **Fault Tolerance**: Process isolation prevents single point of failure
- **Zero-Downtime**: Individual worker restart without service interruption

### Cluster Mode Configuration

#### Basic Cluster Setup

```javascript
// Basic cluster configuration
{
  name: 'nodejs-tutorial-cluster',
  script: '../server.js',
  instances: 'max', // Use all available CPU cores
  exec_mode: 'cluster',
  
  // Cluster-specific settings
  instance_var: 'INSTANCE_ID',
  increment_var: 'PORT',
  
  // Load balancing (automatic with cluster mode)
  // PM2 uses round-robin by default
}
```

#### Advanced Cluster Configuration

```javascript
/**
 * Advanced cluster configuration with optimizations
 */
{
  name: 'nodejs-tutorial-advanced',
  script: '../server.js',
  
  // Intelligent instance scaling
  instances: calculateOptimalInstances(),
  exec_mode: 'cluster',
  
  // Cluster optimization
  cluster_mode: true,
  instance_var: 'INSTANCE_ID',
  increment_var: 'PORT',
  
  // Process management
  kill_retry_time: 100,
  windowsHide: true,
  automation: false,
  
  // Performance tuning
  node_args: [
    '--max-old-space-size=1024',
    '--optimize-for-size'
  ],
  
  // Environment variables for cluster
  env: {
    NODE_ENV: 'production',
    CLUSTER_MODE: 'true',
    WORKER_ID: '${PM2_INSTANCE_ID}'
  }
}

function calculateOptimalInstances() {
  const cpuCores = require('os').cpus().length;
  const memoryGB = Math.round(require('os').totalmem() / 1024 / 1024 / 1024);
  
  // Conservative approach: use 80% of cores, ensure memory availability
  const maxInstances = Math.floor(cpuCores * 0.8);
  const memoryBasedLimit = Math.floor(memoryGB / 1); // 1GB per instance
  
  return Math.min(maxInstances, memoryBasedLimit, cpuCores);
}
```

### Load Balancing Strategies

PM2 automatically handles load balancing in cluster mode:

#### Round-Robin Load Balancing (Default)

```javascript
// PM2 automatically distributes requests across workers
// No additional configuration needed
{
  instances: 'max',
  exec_mode: 'cluster'
  // Load balancing is automatic
}
```

#### Custom Load Balancing Logic

```javascript
// server.js - Express application with cluster awareness
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);
  
  // Fork workers
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Replace dead worker
  });
} else {
  // Worker process
  import app from './app.js';
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening on port ${port}`);
  });
}
```

### Performance Optimization for Cluster Mode

#### Memory Management

```javascript
{
  // Memory optimization
  max_memory_restart: '1G', // Restart if memory exceeds 1GB
  node_args: [
    '--max-old-space-size=1024', // V8 heap limit
    '--optimize-for-size' // Optimize for memory usage
  ],
  
  // Garbage collection optimization
  env: {
    NODE_OPTIONS: '--max-old-space-size=1024 --expose-gc'
  }
}
```

#### CPU Optimization

```javascript
{
  // CPU optimization
  instances: 'max', // Use all CPU cores
  exec_mode: 'cluster',
  
  // Process scheduling
  cron_restart: '0 2 * * *', // Daily restart at 2 AM
  min_uptime: '10s', // Minimum uptime before restart
  max_restarts: 10, // Maximum restart attempts
  
  // CPU affinity (Linux only)
  env: {
    UV_THREADPOOL_SIZE: '128' // Increase thread pool
  }
}
```

### Cluster Mode Validation

```bash
# Start application in cluster mode
pm2 start ecosystem.config.js --env production

# Verify cluster mode is active
pm2 list
# Should show multiple instances with same name

# Check load balancing
pm2 monit
# Monitor CPU and memory across instances

# Test load distribution
for i in {1..100}; do curl http://localhost:3000/hello; done
```

### Monitoring Cluster Performance

```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# Load balancing statistics
pm2 show nodejs-tutorial-app

# Performance metrics
pm2 describe nodejs-tutorial-app
```

---

## Zero-Downtime Deployment

### Understanding Zero-Downtime Deployment

Zero-downtime deployment ensures continuous service availability during application updates by:

- **Sequential Restart**: Restarting workers one at a time
- **Health Validation**: Ensuring new instances are healthy before proceeding
- **Automatic Rollback**: Reverting to previous version on failure
- **Traffic Management**: Maintaining request handling during updates

### PM2 Reload vs Restart

#### PM2 Reload (Zero-Downtime)

```bash
# Zero-downtime reload
pm2 reload ecosystem.config.js

# Reload specific app
pm2 reload nodejs-tutorial-app

# Reload with environment
pm2 reload ecosystem.config.js --env production
```

#### PM2 Restart (With Downtime)

```bash
# Standard restart (brief downtime)
pm2 restart nodejs-tutorial-app

# Restart all applications
pm2 restart all
```

### Deployment Hooks Configuration

```javascript
/**
 * Deployment hooks for zero-downtime deployment
 */
{
  name: 'nodejs-tutorial-app',
  script: '../server.js',
  
  // Pre-deployment validation
  pre_reload: [
    'echo "Starting pre-deployment validation..."',
    'npm run test:production',
    'npm run lint',
    'echo "Pre-deployment validation completed"'
  ].join(' && '),
  
  // Post-deployment validation
  post_reload: [
    'echo "Starting post-deployment validation..."',
    'sleep 5', // Wait for application startup
    'curl -f http://localhost:3000/health || exit 1',
    'echo "Post-deployment validation completed"'
  ].join(' && '),
  
  // Error handling
  on_error: [
    'echo "Deployment error detected"',
    'pm2 logs --lines 100 --nostream',
    'echo "Initiating rollback..."'
  ].join(' && ')
}
```

### Advanced Deployment Strategy

```javascript
/**
 * Advanced zero-downtime deployment with health checks
 */
async function deployWithHealthChecks() {
  try {
    console.log('🚀 Starting zero-downtime deployment...');
    
    // 1. Pre-deployment validation
    await preDeploymentChecks();
    
    // 2. Graceful reload with health monitoring
    await gracefulReload();
    
    // 3. Post-deployment validation
    await postDeploymentValidation();
    
    console.log('✅ Deployment completed successfully');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    await rollbackDeployment();
    process.exit(1);
  }
}

async function preDeploymentChecks() {
  // Run tests
  console.log('Running pre-deployment tests...');
  await execAsync('npm run test:production');
  
  // Check application health
  console.log('Checking current application health...');
  const healthCheck = await fetch('http://localhost:3000/health');
  if (!healthCheck.ok) {
    throw new Error('Current application is unhealthy');
  }
}

async function gracefulReload() {
  console.log('Initiating graceful reload...');
  
  // Use PM2 reload for zero-downtime
  await execAsync('pm2 reload ecosystem.config.js --env production');
  
  // Wait for processes to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));
}

async function postDeploymentValidation() {
  console.log('Validating deployment...');
  
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        console.log('✅ Health check passed');
        return;
      }
    } catch (error) {
      console.log(`⏳ Health check attempt ${attempts + 1}/${maxAttempts}`);
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Post-deployment health check failed');
}
```

### Deployment Scripts

#### Simple Deployment Script

```bash
#!/bin/bash
# deploy.sh - Simple zero-downtime deployment

set -e

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Run tests
npm run test:production

# Reload application with zero-downtime
pm2 reload ecosystem.config.js --env production

# Verify deployment
sleep 5
curl -f http://localhost:3000/health

echo "✅ Deployment completed successfully"
```

#### Advanced Deployment Script

```bash
#!/bin/bash
# advanced-deploy.sh - Production deployment with rollback

set -e

DEPLOY_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/tmp/nodejs-tutorial-backup"

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

# Error handling
handle_error() {
  log "❌ ERROR: Deployment failed at step: $1"
  log "📋 Recent logs:"
  pm2 logs --lines 20 --nostream
  log "🔄 Initiating rollback..."
  rollback_deployment
  exit 1
}

# Pre-deployment backup
backup_current() {
  log "📦 Creating backup..."
  mkdir -p "$BACKUP_DIR"
  cp -r . "$BACKUP_DIR/" || handle_error "backup_creation"
}

# Deployment process
deploy() {
  log "🚀 Starting advanced deployment..."
  
  # Backup current state
  backup_current
  
  # Update code
  log "📥 Pulling latest code..."
  git pull origin main || handle_error "git_pull"
  
  # Install dependencies
  log "📦 Installing dependencies..."
  npm ci --production || handle_error "npm_install"
  
  # Run comprehensive tests
  log "🧪 Running tests..."
  npm run test:production || handle_error "testing"
  
  # Security scan
  log "🔒 Running security audit..."
  npm audit --audit-level moderate || handle_error "security_audit"
  
  # Zero-downtime reload
  log "🔄 Performing zero-downtime reload..."
  pm2 reload ecosystem.config.js --env production || handle_error "pm2_reload"
  
  # Wait for stabilization
  log "⏳ Waiting for application stabilization..."
  sleep 10
  
  # Health validation
  log "🏥 Validating application health..."
  for i in {1..30}; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
      log "✅ Health check passed"
      break
    fi
    if [ $i -eq 30 ]; then
      handle_error "health_check"
    fi
    sleep 2
  done
  
  # Performance validation
  log "🚀 Running performance validation..."
  curl -o /dev/null -s -w "Response time: %{time_total}s\n" http://localhost:3000/hello
  
  log "🎉 Deployment completed successfully!"
  cleanup_backup
}

# Rollback function
rollback_deployment() {
  log "🔄 Rolling back to previous version..."
  if [ -d "$BACKUP_DIR" ]; then
    cp -r "$BACKUP_DIR/"* .
    pm2 reload ecosystem.config.js --env production
    log "✅ Rollback completed"
  else
    log "❌ No backup found for rollback"
  fi
}

# Cleanup
cleanup_backup() {
  rm -rf "$BACKUP_DIR"
  log "🧹 Backup cleaned up"
}

# Execute deployment
deploy
```

### Blue-Green Deployment Strategy

```javascript
/**
 * Blue-Green deployment configuration
 */
module.exports = {
  apps: [
    {
      name: 'nodejs-tutorial-blue',
      script: '../server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DEPLOYMENT_COLOR: 'blue'
      }
    },
    {
      name: 'nodejs-tutorial-green',
      script: '../server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DEPLOYMENT_COLOR: 'green'
      }
    }
  ]
};
```

```bash
# Blue-Green deployment script
#!/bin/bash

CURRENT_COLOR=$(curl -s http://localhost:3000/deployment-info | jq -r '.color')
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")
NEW_PORT=$([ "$NEW_COLOR" = "blue" ] && echo "3000" || echo "3001")

echo "Current: $CURRENT_COLOR, Deploying to: $NEW_COLOR"

# Deploy to inactive environment
pm2 start nodejs-tutorial-$NEW_COLOR

# Validate new environment
curl -f http://localhost:$NEW_PORT/health

# Switch traffic (requires load balancer configuration)
# Update load balancer to point to $NEW_PORT

# Stop old environment
pm2 stop nodejs-tutorial-$CURRENT_COLOR
```

---

## Monitoring & Logging

### PM2 Built-in Monitoring

#### Real-time Process Monitoring

```bash
# Real-time monitoring dashboard
pm2 monit

# Process status overview
pm2 status

# Detailed process information
pm2 show nodejs-tutorial-app

# Process description with metrics
pm2 describe nodejs-tutorial-app
```

#### Process List and Status

```bash
# List all processes
pm2 list

# List in JSON format
pm2 jlist

# Process tree view
pm2 prettylist

# Process status with uptime
pm2 status
```

### Advanced Monitoring Configuration

```javascript
/**
 * Advanced monitoring configuration
 */
{
  name: 'nodejs-tutorial-monitored',
  script: '../server.js',
  
  // Enable monitoring features
  monitoring: true,
  pmx: true, // Enable PMX monitoring
  
  // Health check configuration
  health_check_grace_period: 3000,
  health_check_retries: 3,
  
  // Performance monitoring
  trace: true, // Enable tracing
  profiling: true, // Enable profiling
  
  // Custom metrics
  env: {
    PMX_ENABLED: 'true',
    MONITORING_ENABLED: 'true'
  }
}
```

### Custom Health Checks

```javascript
// server.js - Express health check endpoint
import express from 'express';
import os from 'os';

const app = express();

// Comprehensive health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: os.loadavg()
    },
    process: {
      pid: process.pid,
      instanceId: process.env.INSTANCE_ID,
      nodeVersion: process.version
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024)
    }
  };
  
  // Health check logic
  const memoryUsagePercent = (healthData.memory.used / healthData.memory.total) * 100;
  const isHealthy = memoryUsagePercent < 90 && healthData.uptime > 10;
  
  res.status(isHealthy ? 200 : 503).json({
    ...healthData,
    healthy: isHealthy
  });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    process: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      pid: process.pid
    },
    system: {
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus().length
    }
  });
});
```

### Logging Configuration

#### Basic Logging Setup

```javascript
/**
 * Basic logging configuration
 */
{
  // Log file configuration
  log_file: './logs/combined.log',
  out_file: './logs/out.log',
  error_file: './logs/error.log',
  
  // Log formatting
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  combine_logs: true,
  
  // Log rotation (requires pm2-logrotate)
  max_log_size: '100M',
  max_log_files: 10
}
```

#### Advanced Logging with Rotation

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true
```

#### Structured Logging Implementation

```javascript
// utils/logger.js - Structured logging
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      processId: process.pid,
      instanceId: process.env.INSTANCE_ID,
      ...meta
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'nodejs-tutorial',
    version: process.env.npm_package_version
  },
  transports: [
    // Error log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10
    }),
    
    // Combined log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10
    }),
    
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export default logger;
```

### Log Management Commands

```bash
# View real-time logs
pm2 logs

# View logs for specific app
pm2 logs nodejs-tutorial-app

# View last N lines
pm2 logs --lines 100

# View logs without streaming
pm2 logs --nostream

# Clear all logs
pm2 flush

# View error logs only
pm2 logs --err

# View output logs only
pm2 logs --out
```

### External Monitoring Integration

#### PM2 Plus Integration

```bash
# Link to PM2 Plus (PM2 Enterprise Monitoring)
pm2 link <secret_key> <public_key>

# Monitor with PM2 Plus
pm2 monitor

# Unlink from PM2 Plus
pm2 unlink
```

#### Custom Monitoring Integration

```javascript
// monitoring/metrics.js - Custom metrics collection
import pmx from 'pmx';

// Initialize PMX
pmx.init({
  http: true, // HTTP routes logging
  errors: true, // Exception logging
  profiling: true, // Enable profiling
  custom_probes: true, // Enable custom probes
  network: true, // Network monitoring
  ports: true // Port monitoring
});

// Custom metrics
const probe = pmx.probe();

// Memory usage probe
const memoryProbe = probe.metric({
  name: 'Memory Usage',
  value: () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
});

// Request counter
const requestCounter = probe.counter({
  name: 'HTTP Requests'
});

// Response time histogram
const responseTimeHistogram = probe.histogram({
  name: 'HTTP Response Time',
  measurement: 'mean'
});

// Active connections gauge
const activeConnections = probe.metric({
  name: 'Active Connections',
  value: () => require('os').loadavg()[0]
});

// Custom actions
pmx.action('Force GC', (reply) => {
  if (global.gc) {
    global.gc();
    reply({ success: true, message: 'Garbage collection forced' });
  } else {
    reply({ success: false, message: 'GC not exposed' });
  }
});

export { requestCounter, responseTimeHistogram };
```

### Performance Monitoring Dashboard

```javascript
// monitoring/dashboard.js - Performance dashboard
import express from 'express';
import os from 'os';

const router = express.Router();

// Dashboard endpoint
router.get('/dashboard', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime()
    },
    pm2: {
      instanceId: process.env.INSTANCE_ID,
      clusterMode: process.env.CLUSTER_MODE === 'true',
      environment: process.env.NODE_ENV
    }
  };
  
  res.json(metrics);
});

export default router;
```

---

## Performance Optimization

### CPU Optimization

#### Cluster Mode Performance

```javascript
/**
 * CPU-optimized cluster configuration
 */
{
  name: 'nodejs-tutorial-cpu-optimized',
  script: '../server.js',
  
  // Optimal instance configuration
  instances: 'max', // Use all CPU cores
  exec_mode: 'cluster',
  
  // CPU-specific optimizations
  node_args: [
    '--max-old-space-size=1024', // Optimize V8 heap
    '--optimize-for-size', // Optimize for memory efficiency
    '--max-semi-space-size=64', // Optimize new space
    '--max-executable-size=128' // Optimize executable size
  ],
  
  // Process scheduling
  cron_restart: '0 2 * * *', // Daily restart at 2 AM
  min_uptime: '10s', // Minimum uptime before restart
  
  // Environment variables for performance
  env: {
    UV_THREADPOOL_SIZE: '128', // Increase thread pool
    NODE_OPTIONS: '--max-old-space-size=1024'
  }
}
```

#### Load Balancing Optimization

```javascript
// server.js - Optimized for load balancing
import cluster from 'cluster';
import os from 'os';
import app from './app.js';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers for optimal performance`);
  
  // Fork workers equal to CPU cores
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    
    // Worker-specific optimizations
    worker.on('message', (msg) => {
      if (msg.cmd === 'performance_report') {
        console.log(`Worker ${worker.id} performance:`, msg.data);
      }
    });
  }
  
  // Graceful worker replacement
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Starting a new worker');
    cluster.fork();
  });
  
  // Performance monitoring
  setInterval(() => {
    const workers = Object.values(cluster.workers);
    workers.forEach(worker => {
      worker.send({ cmd: 'performance_check' });
    });
  }, 30000); // Check every 30 seconds
  
} else {
  // Worker process optimizations
  const port = process.env.PORT || 3000;
  
  // Optimize worker performance
  process.on('message', (msg) => {
    if (msg.cmd === 'performance_check') {
      process.send({
        cmd: 'performance_report',
        data: {
          pid: process.pid,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }
      });
    }
  });
  
  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening on port ${port}`);
  });
}
```

### Memory Optimization

#### Memory Management Configuration

```javascript
/**
 * Memory-optimized configuration
 */
{
  name: 'nodejs-tutorial-memory-optimized',
  script: '../server.js',
  
  // Memory management
  max_memory_restart: '1G', // Restart at 1GB memory usage
  
  // V8 memory optimization
  node_args: [
    '--max-old-space-size=1024', // 1GB heap limit
    '--max-new-space-size=256', // 256MB new space
    '--max-executable-size=128', // 128MB executable size
    '--optimize-for-size', // Optimize for memory usage
    '--gc-interval=100', // Garbage collection interval
    '--expose-gc' // Expose garbage collection
  ],
  
  // Memory monitoring
  env: {
    NODE_OPTIONS: '--max-old-space-size=1024 --expose-gc',
    FORCE_GC_INTERVAL: '300000' // Force GC every 5 minutes
  }
}
```

#### Memory Leak Prevention

```javascript
// utils/memory-monitor.js - Memory monitoring utility
class MemoryMonitor {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.8; // 80% memory threshold
    this.interval = options.interval || 30000; // 30 seconds
    this.gcThreshold = options.gcThreshold || 0.7; // 70% GC threshold
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.interval);
  }
  
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usagePercent = usage.heapUsed / totalMemory;
    
    console.log(`Memory usage: ${Math.round(usagePercent * 100)}%`);
    
    // Force garbage collection if needed
    if (usagePercent > this.gcThreshold && global.gc) {
      console.log('Forcing garbage collection...');
      global.gc();
    }
    
    // Warning for high memory usage
    if (usagePercent > this.threshold) {
      console.warn(`High memory usage detected: ${Math.round(usagePercent * 100)}%`);
      
      // Send alert (implement your alerting logic)
      this.sendMemoryAlert(usagePercent);
    }
  }
  
  sendMemoryAlert(usagePercent) {
    // Implement alerting logic (email, webhook, etc.)
    console.error(`ALERT: Memory usage critical: ${Math.round(usagePercent * 100)}%`);
  }
  
  getMemoryReport() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    };
  }
}

export default MemoryMonitor;
```

### Network Performance Optimization

#### Connection Pooling

```javascript
// utils/connection-pool.js - HTTP connection optimization
import http from 'http';
import https from 'https';

// HTTP Agent with keep-alive
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000
});

// HTTPS Agent with keep-alive
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000
});

export { httpAgent, httpsAgent };
```

#### Express Performance Optimization

```javascript
// app.js - Express performance optimizations
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';

const app = express();

// Enable gzip compression
app.use(compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Security headers with performance considerations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Performance middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`);
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.url} - ${responseTime}ms`);
    }
  });
  
  next();
});

// Cache static resources
app.use(express.static('public', {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

export default app;
```

### Performance Benchmarking

#### Load Testing Script

```bash
#!/bin/bash
# performance-test.sh - Load testing script

echo "🚀 Starting performance tests..."

# Install dependencies
npm install -g autocannon

# Basic load test
echo "📊 Running basic load test..."
autocannon -c 100 -d 30 http://localhost:3000/hello

# Cluster mode performance test
echo "📊 Testing cluster mode performance..."
autocannon -c 200 -d 60 http://localhost:3000/hello

# Memory stress test
echo "📊 Running memory stress test..."
autocannon -c 500 -d 120 http://localhost:3000/hello

# Generate report
echo "📋 Generating performance report..."
autocannon -c 100 -d 30 --json http://localhost:3000/hello > performance-report.json

echo "✅ Performance tests completed"
```

#### Performance Monitoring Integration

```javascript
// monitoring/performance.js - Performance tracking
import EventEmitter from 'events';

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now()
    };
    
    this.startMonitoring();
  }
  
  trackRequest(req, res, next) {
    const startTime = Date.now();
    this.metrics.requests++;
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.metrics.responses++;
      this.metrics.responseTimes.push(responseTime);
      
      // Keep only last 1000 response times
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
      }
      
      // Emit performance event
      this.emit('response', {
        responseTime,
        statusCode: res.statusCode,
        url: req.url,
        method: req.method
      });
    });
    
    res.on('error', () => {
      this.metrics.errors++;
      this.emit('error', { url: req.url, method: req.method });
    });
    
    next();
  }
  
  getMetrics() {
    const responseTimes = this.metrics.responseTimes;
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      uptime,
      requests: this.metrics.requests,
      responses: this.metrics.responses,
      errors: this.metrics.errors,
      errorRate: this.metrics.errors / this.metrics.requests,
      requestsPerSecond: this.metrics.requests / (uptime / 1000),
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      p95ResponseTime: this.calculatePercentile(responseTimes, 0.95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 0.99)
    };
  }
  
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }
  
  startMonitoring() {
    // Log metrics every minute
    setInterval(() => {
      const metrics = this.getMetrics();
      console.log('Performance Metrics:', metrics);
      
      // Alert on high error rate
      if (metrics.errorRate > 0.05) { // 5% error rate
        console.warn(`High error rate detected: ${Math.round(metrics.errorRate * 100)}%`);
      }
      
      // Alert on slow responses
      if (metrics.averageResponseTime > 1000) { // 1 second
        console.warn(`Slow response times detected: ${Math.round(metrics.averageResponseTime)}ms`);
      }
    }, 60000);
  }
}

export default PerformanceMonitor;
```

---

## Troubleshooting Guide

### Common PM2 Issues

#### PM2 Installation Issues

**Problem: PM2 command not found**
```bash
# Solution 1: Check npm global path
npm config get prefix
export PATH=$PATH:$(npm config get prefix)/bin

# Solution 2: Reinstall PM2 globally
npm uninstall -g pm2
npm install -g pm2@latest

# Solution 3: Use npx (no global installation)
npx pm2 --version
```

**Problem: Permission errors during installation**
```bash
# Solution 1: Use sudo (Linux/macOS)
sudo npm install -g pm2

# Solution 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g pm2

# Solution 3: Use Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
npm install -g pm2
```

#### Application Startup Issues

**Problem: Application fails to start**
```bash
# Debug process status
pm2 status
pm2 describe app-name

# Check logs for errors
pm2 logs app-name --lines 100

# Validate ecosystem file
pm2 ecosystem
```

**Solution: Debug startup failures**
```javascript
// Add debugging to ecosystem.config.js
{
  name: 'debug-app',
  script: '../server.js',
  
  // Enable debugging
  env: {
    NODE_ENV: 'development',
    DEBUG: '*',
    PM2_DEBUG: 'true'
  },
  
  // Disable auto-restart for debugging
  autorestart: false,
  
  // Increase verbosity
  error_file: './logs/debug-error.log',
  out_file: './logs/debug-out.log',
  log_file: './logs/debug-combined.log'
}
```

#### Port Conflicts

**Problem: Port already in use**
```bash
# Find process using port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process using port
kill -9 <PID>

# Use different port
export PORT=3001
pm2 start ecosystem.config.js
```

**Solution: Dynamic port assignment**
```javascript
// ecosystem.config.js - Dynamic port assignment
const os = require('os');

function getAvailablePort(basePort = 3000) {
  // Simple port increment logic
  return basePort + (parseInt(process.env.INSTANCE_ID) || 0);
}

module.exports = {
  apps: [{
    name: 'nodejs-tutorial-dynamic',
    script: '../server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      PORT: getAvailablePort(),
      BASE_PORT: 3000
    },
    increment_var: 'PORT'
  }]
};
```

### Memory and Performance Issues

#### Memory Leaks

**Problem: Memory usage continuously increasing**
```bash
# Monitor memory usage
pm2 monit

# Check memory over time
watch -n 5 'pm2 show app-name | grep memory'

# Force garbage collection
pm2 trigger app-name gc
```

**Solution: Memory leak detection**
```javascript
// utils/memory-leak-detector.js
class MemoryLeakDetector {
  constructor(app, options = {}) {
    this.app = app;
    this.threshold = options.threshold || 100; // MB
    this.interval = options.interval || 30000; // 30 seconds
    this.samples = [];
    this.maxSamples = options.maxSamples || 20;
    
    this.startDetection();
  }
  
  startDetection() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      
      this.samples.push({
        timestamp: Date.now(),
        heapUsed: heapUsedMB,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
      });
      
      // Keep only recent samples
      if (this.samples.length > this.maxSamples) {
        this.samples = this.samples.slice(-this.maxSamples);
      }
      
      this.detectLeak();
    }, this.interval);
  }
  
  detectLeak() {
    if (this.samples.length < 5) return;
    
    // Check if memory is consistently increasing
    const recentSamples = this.samples.slice(-5);
    const isIncreasing = recentSamples.every((sample, index) => {
      if (index === 0) return true;
      return sample.heapUsed >= recentSamples[index - 1].heapUsed;
    });
    
    const currentUsage = this.samples[this.samples.length - 1].heapUsed;
    const firstUsage = recentSamples[0].heapUsed;
    const increase = currentUsage - firstUsage;
    
    if (isIncreasing && increase > this.threshold) {
      console.warn(`Potential memory leak detected: ${increase}MB increase`);
      this.generateMemoryReport();
    }
  }
  
  generateMemoryReport() {
    console.log('Memory Usage Report:');
    this.samples.forEach(sample => {
      console.log(`${new Date(sample.timestamp).toISOString()}: ${sample.heapUsed}MB`);
    });
    
    // Force garbage collection if available
    if (global.gc) {
      console.log('Forcing garbage collection...');
      global.gc();
    }
  }
}

export default MemoryLeakDetector;
```

#### High CPU Usage

**Problem: High CPU utilization**
```bash
# Monitor CPU usage
pm2 monit

# Check process details
pm2 show app-name

# Profile application
pm2 profile:cpu app-name
```

**Solution: CPU optimization**
```javascript
// utils/cpu-monitor.js
import { cpuUsage } from 'process';
import os from 'os';

class CPUMonitor {
  constructor(options = {}) {
    this.threshold = options.threshold || 80; // 80% CPU threshold
    this.interval = options.interval || 5000; // 5 seconds
    this.previousUsage = cpuUsage();
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.checkCPUUsage();
    }, this.interval);
  }
  
  checkCPUUsage() {
    const currentUsage = cpuUsage(this.previousUsage);
    const totalUsage = currentUsage.user + currentUsage.system;
    const cpuPercent = (totalUsage / (this.interval * 1000)) * 100;
    
    console.log(`CPU usage: ${cpuPercent.toFixed(2)}%`);
    
    if (cpuPercent > this.threshold) {
      console.warn(`High CPU usage detected: ${cpuPercent.toFixed(2)}%`);
      this.optimizeCPU();
    }
    
    this.previousUsage = cpuUsage();
  }
  
  optimizeCPU() {
    // Reduce event loop blocking
    setImmediate(() => {
      console.log('CPU optimization: Yielding to event loop');
    });
    
    // Suggest process scaling
    const cpuCount = os.cpus().length;
    console.log(`Consider scaling to ${cpuCount} instances for better CPU distribution`);
  }
}

export default CPUMonitor;
```

### Cluster Mode Issues

#### Worker Process Failures

**Problem: Workers frequently dying**
```bash
# Check worker status
pm2 status

# Monitor worker restarts
pm2 logs --lines 50 | grep -i restart

# Check system resources
free -h
df -h
```

**Solution: Worker stability improvement**
```javascript
// ecosystem.config.js - Stable worker configuration
{
  name: 'stable-workers',
  script: '../server.js',
  instances: 'max',
  exec_mode: 'cluster',
  
  // Worker stability settings
  max_restarts: 10,
  restart_delay: 4000,
  min_uptime: '10s',
  max_memory_restart: '1G',
  
  // Graceful shutdown
  kill_timeout: 5000,
  listen_timeout: 3000,
  
  // Error handling
  autorestart: true,
  ignore_watch: ['node_modules', 'logs'],
  
  // Health monitoring
  health_check_grace_period: 3000,
  
  env: {
    NODE_ENV: 'production',
    WORKER_STABILITY: 'true'
  }
}
```

#### Load Balancing Issues

**Problem: Uneven load distribution**
```bash
# Monitor load distribution
pm2 monit

# Check individual worker performance
pm2 show app-name
```

**Solution: Improved load balancing**
```javascript
// server.js - Load balancing optimization
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const workers = new Map();
  const numCPUs = os.cpus().length;
  
  // Create workers with monitoring
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.set(worker.id, {
      worker,
      requests: 0,
      errors: 0,
      startTime: Date.now()
    });
    
    // Monitor worker performance
    worker.on('message', (msg) => {
      if (msg.type === 'request_handled') {
        workers.get(worker.id).requests++;
      }
      if (msg.type === 'error_occurred') {
        workers.get(worker.id).errors++;
      }
    });
  }
  
  // Worker replacement with load consideration
  cluster.on('exit', (worker, code, signal) => {
    const workerInfo = workers.get(worker.id);
    console.log(`Worker ${worker.id} died (handled ${workerInfo.requests} requests)`);
    
    workers.delete(worker.id);
    const newWorker = cluster.fork();
    workers.set(newWorker.id, {
      worker: newWorker,
      requests: 0,
      errors: 0,
      startTime: Date.now()
    });
  });
  
  // Performance reporting
  setInterval(() => {
    console.log('Worker Performance:');
    workers.forEach((info, id) => {
      const uptime = Date.now() - info.startTime;
      const rps = info.requests / (uptime / 1000);
      console.log(`Worker ${id}: ${info.requests} requests, ${rps.toFixed(2)} req/s`);
    });
  }, 30000);
  
} else {
  // Worker process with performance reporting
  const app = require('./app.js');
  
  app.use((req, res, next) => {
    res.on('finish', () => {
      process.send({ type: 'request_handled' });
    });
    
    res.on('error', () => {
      process.send({ type: 'error_occurred' });
    });
    
    next();
  });
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening on port ${port}`);
  });
}
```

### Deployment Issues

#### Zero-Downtime Deployment Failures

**Problem: Reload command fails**
```bash
# Check current process status
pm2 status

# Attempt manual reload
pm2 reload app-name --force

# Check for blocking operations
pm2 logs app-name --lines 20
```

**Solution: Robust deployment script**
```bash
#!/bin/bash
# robust-deploy.sh - Bulletproof deployment

set -e

APP_NAME="nodejs-tutorial-app"
HEALTH_URL="http://localhost:3000/health"
MAX_RETRIES=30
RETRY_INTERVAL=2

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_health() {
  local retries=0
  while [ $retries -lt $MAX_RETRIES ]; do
    if curl -f "$HEALTH_URL" >/dev/null 2>&1; then
      log "✅ Health check passed"
      return 0
    fi
    
    retries=$((retries + 1))
    log "⏳ Health check attempt $retries/$MAX_RETRIES"
    sleep $RETRY_INTERVAL
  done
  
  log "❌ Health check failed after $MAX_RETRIES attempts"
  return 1
}

deploy() {
  log "🚀 Starting deployment..."
  
  # Pre-deployment health check
  if ! check_health; then
    log "❌ Pre-deployment health check failed"
    exit 1
  fi
  
  # Update code
  log "📥 Updating code..."
  git pull origin main
  
  # Install dependencies
  log "📦 Installing dependencies..."
  npm ci --production
  
  # Run tests
  log "🧪 Running tests..."
  npm run test:production
  
  # Backup current PM2 state
  log "💾 Backing up PM2 state..."
  pm2 save
  
  # Perform zero-downtime reload
  log "🔄 Performing zero-downtime reload..."
  if pm2 reload "$APP_NAME"; then
    log "✅ Reload successful"
  else
    log "❌ Reload failed, attempting restart..."
    pm2 restart "$APP_NAME"
  fi
  
  # Post-deployment health check
  log "🏥 Performing post-deployment health check..."
  if check_health; then
    log "🎉 Deployment successful!"
    
    # Save successful state
    pm2 save
  else
    log "❌ Post-deployment health check failed, rolling back..."
    pm2 resurrect
    exit 1
  fi
}

# Trap errors and provide rollback
trap 'log "❌ Deployment failed, rolling back..."; pm2 resurrect; exit 1' ERR

deploy
```

### Log Analysis and Debugging

#### Log Analysis Tools

```bash
# Real-time log monitoring
pm2 logs | grep -i error

# Error pattern analysis
pm2 logs --lines 1000 | grep -E "(error|exception|failed)" | tail -20

# Performance analysis
pm2 logs | grep -E "response time|duration" | awk '{print $NF}' | sort -n

# Memory analysis
pm2 logs | grep -i "memory" | tail -20
```

#### Advanced Debugging Configuration

```javascript
// ecosystem.config.debug.js - Debug configuration
module.exports = {
  apps: [{
    name: 'nodejs-tutorial-debug',
    script: '../server.js',
    
    // Debug settings
    instances: 1, // Single instance for debugging
    exec_mode: 'fork',
    autorestart: false,
    
    // Verbose logging
    log_level: 'debug',
    merge_logs: false,
    log_file: './logs/debug-combined.log',
    out_file: './logs/debug-out.log',
    error_file: './logs/debug-error.log',
    
    // Debug environment
    env: {
      NODE_ENV: 'development',
      DEBUG: '*',
      PM2_DEBUG: 'true',
      VERBOSE_LOGGING: 'true'
    },
    
    // Enable Node.js debugging
    node_args: [
      '--inspect=0.0.0.0:9229',
      '--trace-warnings',
      '--trace-deprecation',
      '--stack-trace-limit=50'
    ]
  }]
};
```

### System Resource Issues

#### Disk Space Problems

```bash
# Check disk usage
df -h

# Find large log files
find . -name "*.log" -type f -exec du -h {} + | sort -hr | head -20

# Clean PM2 logs
pm2 flush

# Rotate logs manually
pm2 reloadLogs
```

#### File Descriptor Limits

```bash
# Check current limits
ulimit -n

# Increase limits (temporary)
ulimit -n 65536

# Permanent limit increase (add to /etc/security/limits.conf)
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

---

## Best Practices

### Production Deployment Best Practices

#### Environment Configuration

**Separate Environment Configurations**
```javascript
// config/environments.js - Environment-specific settings
const environments = {
  development: {
    instances: 1,
    exec_mode: 'fork',
    autorestart: false,
    watch: true,
    env: {
      NODE_ENV: 'development',
      DEBUG: '*',
      LOG_LEVEL: 'debug'
    }
  },
  
  staging: {
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'staging',
      LOG_LEVEL: 'info'
    }
  },
  
  production: {
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 15,
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn'
    },
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size'
    ]
  }
};

export default environments;
```

**Environment-Aware Ecosystem Generation**
```javascript
// ecosystem.config.js - Dynamic environment configuration
import environments from './config/environments.js';

const currentEnv = process.env.NODE_ENV || 'production';
const envConfig = environments[currentEnv];

if (!envConfig) {
  throw new Error(`Unknown environment: ${currentEnv}`);
}

module.exports = {
  apps: [{
    name: `nodejs-tutorial-${currentEnv}`,
    script: './server.js',
    ...envConfig,
    
    // Common settings
    source_map_support: true,
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT',
    
    // Logging configuration
    log_file: `./logs/${currentEnv}-combined.log`,
    error_file: `./logs/${currentEnv}-error.log`,
    out_file: `./logs/${currentEnv}-out.log`,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring
    monitoring: currentEnv === 'production',
    pmx: currentEnv === 'production'
  }]
};
```

#### Security Best Practices

**Process Isolation and Security**
```javascript
// ecosystem.config.js - Security-focused configuration
{
  name: 'nodejs-tutorial-secure',
  script: './server.js',
  
  // Process isolation
  uid: 'pm2user', // Run as non-root user
  gid: 'pm2group',
  cwd: '/var/www/nodejs-tutorial',
  
  // Security environment
  env: {
    NODE_ENV: 'production',
    // Remove debug information
    NODE_OPTIONS: '--no-deprecation --no-warnings',
    // Secure defaults
    SECURE_MODE: 'true'
  },
  
  // Disable potentially dangerous features
  automation: false,
  vizion: false,
  
  // Resource limits
  max_memory_restart: '1G',
  max_restarts: 10,
  
  // Log security
  log_file: '/var/log/nodejs-tutorial/combined.log',
  error_file: '/var/log/nodejs-tutorial/error.log',
  out_file: '/var/log/nodejs-tutorial/out.log'
}
```

**Security Headers Integration**
```javascript
// middleware/security.js - Production security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Security middleware stack
export const securityMiddleware = [
  // Helmet security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
  }),
  
  // Rate limiting
  createRateLimit(15 * 60 * 1000, 100, 'Too many requests'), // 100 requests per 15 minutes
  createRateLimit(60 * 1000, 20, 'Too many requests per minute') // 20 requests per minute
];
```

#### Performance Best Practices

**Resource Optimization**
```javascript
// config/performance.js - Performance optimization settings
export const performanceConfig = {
  // Cluster optimization
  cluster: {
    instances: 'max',
    exec_mode: 'cluster',
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT'
  },
  
  // Memory optimization
  memory: {
    max_memory_restart: '1G',
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size',
      '--max-new-space-size=256'
    ]
  },
  
  // Process management
  process: {
    autorestart: true,
    max_restarts: 15,
    restart_delay: 4000,
    min_uptime: '10s',
    kill_timeout: 5000,
    listen_timeout: 3000
  },
  
  // Monitoring
  monitoring: {
    pmx: true,
    monitoring: true,
    health_check_grace_period: 3000
  }
};
```

**Application Performance Optimization**
```javascript
// app.js - Performance-optimized Express application
import express from 'express';
import compression from 'compression';
import { securityMiddleware } from './middleware/security.js';
import PerformanceMonitor from './utils/performance-monitor.js';

const app = express();
const performanceMonitor = new PerformanceMonitor();

// Performance middleware (order matters)
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    return compression.filter(req, res) && !req.headers['x-no-compression'];
  }
}));

// Security middleware
app.use(securityMiddleware);

// Performance monitoring
app.use(performanceMonitor.trackRequest.bind(performanceMonitor));

// Optimized static file serving
app.use('/static', express.static('public', {
  maxAge: '1y', // Long cache for static assets
  etag: true,
  lastModified: true,
  immutable: true
}));

// Health check endpoint (no middleware overhead)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    instanceId: process.env.INSTANCE_ID
  });
});

// Application routes
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello world', timestamp: new Date().toISOString() });
});

app.get('/good-evening', (req, res) => {
  res.json({ message: 'Good evening', timestamp: new Date().toISOString() });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(performanceMonitor.getMetrics());
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
```

#### Monitoring and Alerting Best Practices

**Comprehensive Monitoring Setup**
```javascript
// monitoring/alerting.js - Production alerting system
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

class AlertingSystem {
  constructor(config) {
    this.config = config;
    this.emailTransporter = this.setupEmailTransporter();
    this.lastAlerts = new Map();
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes cooldown
  }
  
  setupEmailTransporter() {
    return nodemailer.createTransporter({
      host: this.config.email.host,
      port: this.config.email.port,
      secure: this.config.email.secure,
      auth: {
        user: this.config.email.user,
        pass: this.config.email.password
      }
    });
  }
  
  async sendAlert(type, message, severity = 'warning') {
    const alertKey = `${type}-${severity}`;
    const now = Date.now();
    
    // Check cooldown period
    if (this.lastAlerts.has(alertKey)) {
      const lastAlert = this.lastAlerts.get(alertKey);
      if (now - lastAlert < this.alertCooldown) {
        return; // Skip alert due to cooldown
      }
    }
    
    this.lastAlerts.set(alertKey, now);
    
    const alertData = {
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      pid: process.pid,
      instanceId: process.env.INSTANCE_ID
    };
    
    // Send email alert
    if (this.config.email.enabled) {
      await this.sendEmailAlert(alertData);
    }
    
    // Send webhook alert
    if (this.config.webhook.enabled) {
      await this.sendWebhookAlert(alertData);
    }
    
    // Log alert
    console.error(`ALERT [${severity.toUpperCase()}]: ${type} - ${message}`);
  }
  
  async sendEmailAlert(alertData) {
    const subject = `[${alertData.severity.toUpperCase()}] ${alertData.type} - ${alertData.hostname}`;
    const text = `
Alert Details:
- Type: ${alertData.type}
- Severity: ${alertData.severity}
- Message: ${alertData.message}
- Timestamp: ${alertData.timestamp}
- Hostname: ${alertData.hostname}
- Process ID: ${alertData.pid}
- Instance ID: ${alertData.instanceId}
    `;
    
    await this.emailTransporter.sendMail({
      from: this.config.email.from,
      to: this.config.email.to,
      subject,
      text
    });
  }
  
  async sendWebhookAlert(alertData) {
    await fetch(this.config.webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
  }
}

export default AlertingSystem;
```

#### Deployment Pipeline Best Practices

**Automated Deployment Pipeline**
```yaml
# .github/workflows/deploy.yml - GitHub Actions deployment
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:production
      
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: Run linting
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_KEY }}
          script: |
            cd /var/www/nodejs-tutorial
            git pull origin main
            npm ci --production
            npm run test:production
            pm2 reload ecosystem.config.js --env production
            
            # Wait for deployment to stabilize
            sleep 10
            
            # Verify deployment
            curl -f http://localhost:3000/health || exit 1
            
            # Save PM2 state
            pm2 save
            
            echo "Deployment completed successfully"
```

#### Backup and Recovery Best Practices

**Automated Backup Strategy**
```bash
#!/bin/bash
# backup.sh - Automated backup script

BACKUP_DIR="/backup/nodejs-tutorial"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/nodejs-tutorial"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup application code
tar -czf "$BACKUP_DIR/code_$TIMESTAMP.tar.gz" -C "$APP_DIR" .

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2_dump_$TIMESTAMP.json"

# Backup logs
tar -czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" -C "$APP_DIR" logs/

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +7 -delete
find "$BACKUP_DIR" -name "*.json" -type f -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
```

**Disaster Recovery Procedure**
```bash
#!/bin/bash
# disaster-recovery.sh - Recovery script

BACKUP_DIR="/backup/nodejs-tutorial"
APP_DIR="/var/www/nodejs-tutorial"

# Stop current processes
pm2 delete all

# Restore from latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/code_*.tar.gz | head -1)
LATEST_PM2_DUMP=$(ls -t "$BACKUP_DIR"/pm2_dump_*.json | head -1)

echo "Restoring from: $LATEST_BACKUP"

# Restore application code
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
tar -xzf "$LATEST_BACKUP" -C "$APP_DIR"

# Restore PM2 configuration
cp "$LATEST_PM2_DUMP" ~/.pm2/dump.pm2
pm2 resurrect

# Verify recovery
sleep 10
curl -f http://localhost:3000/health

echo "Disaster recovery completed"
```

---

## Educational Examples

### Basic PM2 Usage Examples

#### Example 1: Simple Application Startup

**Basic server.js**
```javascript
// server.js - Simple Express server for PM2 demonstration
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Basic route
app.get('/hello', (req, res) => {
  res.json({ 
    message: 'Hello world',
    timestamp: new Date().toISOString(),
    process: process.pid,
    instanceId: process.env.INSTANCE_ID || 'N/A'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}, PID: ${process.pid}`);
});
```

**PM2 Commands Tutorial**
```bash
# 1. Start application with PM2
pm2 start server.js --name tutorial-app

# 2. Check application status
pm2 status

# 3. View real-time logs
pm2 logs tutorial-app

# 4. Monitor processes
pm2 monit

# 5. Restart application
pm2 restart tutorial-app

# 6. Stop application
pm2 stop tutorial-app

# 7. Delete application from PM2
pm2 delete tutorial-app
```

#### Example 2: Cluster Mode Demonstration

**Cluster-aware server implementation**
```javascript
// cluster-server.js - Cluster-aware Express server
import express from 'express';
import cluster from 'cluster';
import os from 'os';

const app = express();
const port = process.env.PORT || 3000;

// Cluster information middleware
app.use((req, res, next) => {
  res.locals.clusterInfo = {
    isPrimary: cluster.isPrimary,
    workerId: cluster.worker?.id || 'primary',
    processId: process.pid,
    cpuCount: os.cpus().length
  };
  next();
});

// Demonstrate load balancing
app.get('/cluster-info', (req, res) => {
  res.json({
    message: 'Cluster mode demonstration',
    ...res.locals.clusterInfo,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  });
});

// Simulate CPU-intensive task
app.get('/cpu-intensive', (req, res) => {
  const start = Date.now();
  
  // Simulate CPU work (Fibonacci calculation)
  function fibonacci(n) {
    if (n < 2) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  
  const result = fibonacci(35);
  const duration = Date.now() - start;
  
  res.json({
    result,
    duration: `${duration}ms`,
    processId: process.pid,
    workerId: cluster.worker?.id || 'primary'
  });
});

app.listen(port, () => {
  console.log(`Worker ${process.pid} listening on port ${port}`);
});
```

**Cluster mode ecosystem configuration**
```javascript
// ecosystem.cluster.js - Cluster mode example
module.exports = {
  apps: [{
    name: 'cluster-demo',
    script: './cluster-server.js',
    
    // Cluster configuration
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Monitoring
    monitoring: true,
    
    // Load balancing demonstration
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT'
  }]
};
```

**Testing cluster mode performance**
```bash
# Start cluster mode
pm2 start ecosystem.cluster.js

# Test load distribution
for i in {1..20}; do
  curl http://localhost:3000/cluster-info | jq '.processId'
done

# Monitor workers
pm2 monit

# Test CPU-intensive endpoint
curl http://localhost:3000/cpu-intensive
```

#### Example 3: Zero-Downtime Deployment Simulation

**Deployment simulation script**
```bash
#!/bin/bash
# deployment-simulation.sh - Educational deployment demo

echo "🎯 Zero-Downtime Deployment Simulation"
echo "======================================"

# Start initial application
echo "1. Starting initial application..."
pm2 start ecosystem.config.js --env production
sleep 5

# Show running processes
echo "2. Current running processes:"
pm2 status

# Simulate traffic during deployment
echo "3. Starting background traffic simulation..."
(
  while true; do
    curl -s http://localhost:3000/hello > /dev/null
    sleep 0.1
  done
) &
TRAFFIC_PID=$!

# Monitor requests for 10 seconds
echo "4. Monitoring requests (10 seconds)..."
(
  for i in {1..10}; do
    response=$(curl -s http://localhost:3000/cluster-info)
    pid=$(echo "$response" | jq -r '.processId')
    timestamp=$(echo "$response" | jq -r '.timestamp')
    echo "Request served by PID: $pid at $timestamp"
    sleep 1
  done
) &

sleep 10

# Perform zero-downtime reload
echo "5. Performing zero-downtime reload..."
pm2 reload ecosystem.config.js

# Monitor requests during reload
echo "6. Monitoring requests during reload (15 seconds)..."
for i in {1..15}; do
  response=$(curl -s http://localhost:3000/cluster-info 2>/dev/null)
  if [ $? -eq 0 ]; then
    pid=$(echo "$response" | jq -r '.processId' 2>/dev/null)
    timestamp=$(echo "$response" | jq -r '.timestamp' 2>/dev/null)
    echo "✅ Request served by PID: $pid at $timestamp"
  else
    echo "❌ Request failed at $(date)"
  fi
  sleep 1
done

# Stop traffic simulation
kill $TRAFFIC_PID 2>/dev/null

echo "7. Final process status:"
pm2 status

echo "🎉 Zero-downtime deployment simulation completed!"
```

### Advanced Educational Examples

#### Example 4: Custom Monitoring Implementation

**Custom monitoring dashboard**
```javascript
// monitoring-demo.js - Educational monitoring example
import express from 'express';
import os from 'os';
import EventEmitter from 'events';

class ApplicationMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: 0,
      errors: 0,
      responses: 0,
      startTime: Date.now(),
      responseTimes: []
    };
    
    this.startMetricsCollection();
  }
  
  startMetricsCollection() {
    // Collect system metrics every 5 seconds
    setInterval(() => {
      const systemMetrics = {
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        system: {
          loadAverage: os.loadavg(),
          freeMemory: os.freemem(),
          totalMemory: os.totalmem()
        }
      };
      
      this.emit('system-metrics', systemMetrics);
    }, 5000);
  }
  
  trackRequest(req, res, next) {
    const startTime = Date.now();
    this.metrics.requests++;
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.metrics.responses++;
      this.metrics.responseTimes.push(responseTime);
      
      // Keep only last 100 response times
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
      }
      
      this.emit('request-completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        timestamp: Date.now()
      });
    });
    
    res.on('error', () => {
      this.metrics.errors++;
      this.emit('request-error', {
        method: req.method,
        url: req.url,
        timestamp: Date.now()
      });
    });
    
    next();
  }
  
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const responseTimes = this.metrics.responseTimes;
    
    return {
      uptime: Math.round(uptime / 1000),
      requests: this.metrics.requests,
      responses: this.metrics.responses,
      errors: this.metrics.errors,
      errorRate: this.metrics.errors / this.metrics.requests,
      requestsPerSecond: this.metrics.requests / (uptime / 1000),
      averageResponseTime: responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
      processInfo: {
        pid: process.pid,
        instanceId: process.env.INSTANCE_ID,
        nodeVersion: process.version,
        platform: os.platform()
      }
    };
  }
}

const app = express();
const monitor = new ApplicationMonitor();

// Apply monitoring middleware
app.use(monitor.trackRequest.bind(monitor));

// Monitoring endpoints
app.get('/metrics', (req, res) => {
  res.json(monitor.getMetrics());
});

app.get('/health', (req, res) => {
  const metrics = monitor.getMetrics();
  const isHealthy = metrics.errorRate < 0.1 && metrics.averageResponseTime < 1000;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    ...metrics
  });
});

// Event listeners for real-time monitoring
monitor.on('request-completed', (data) => {
  if (data.responseTime > 1000) {
    console.warn(`Slow request detected: ${data.method} ${data.url} - ${data.responseTime}ms`);
  }
});

monitor.on('request-error', (data) => {
  console.error(`Request error: ${data.method} ${data.url}`);
});

monitor.on('system-metrics', (data) => {
  const memoryUsagePercent = (data.memory.heapUsed / data.memory.heapTotal) * 100;
  if (memoryUsagePercent > 80) {
    console.warn(`High memory usage: ${Math.round(memoryUsagePercent)}%`);
  }
});

// Application routes
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello world', timestamp: new Date().toISOString() });
});

app.get('/slow', (req, res) => {
  // Simulate slow endpoint
  setTimeout(() => {
    res.json({ message: 'Slow response', timestamp: new Date().toISOString() });
  }, 2000);
});

app.get('/error', (req, res) => {
  // Simulate error
  res.status(500).json({ error: 'Simulated error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Monitoring demo server running on port ${port}`);
});
```

#### Example 5: Performance Comparison Demo

**Performance testing script**
```bash
#!/bin/bash
# performance-comparison.sh - Compare single vs cluster performance

echo "🚀 PM2 Performance Comparison Demo"
echo "=================================="

# Install autocannon for load testing
if ! command -v autocannon &> /dev/null; then
  echo "Installing autocannon..."
  npm install -g autocannon
fi

# Test single instance performance
echo "1. Testing single instance performance..."
pm2 delete all 2>/dev/null || true

# Start single instance
pm2 start server.js --name single-instance --instances 1

sleep 5

echo "Running load test on single instance..."
autocannon -c 50 -d 30 http://localhost:3000/hello > single-instance-results.txt

# Test cluster mode performance
echo "2. Testing cluster mode performance..."
pm2 delete all

# Start cluster mode
pm2 start server.js --name cluster-mode --instances max

sleep 5

echo "Running load test on cluster mode..."
autocannon -c 50 -d 30 http://localhost:3000/hello > cluster-mode-results.txt

# Compare results
echo "3. Performance Comparison Results:"
echo "================================="

echo "Single Instance Results:"
grep -E "Requests/sec|Latency" single-instance-results.txt

echo ""
echo "Cluster Mode Results:"
grep -E "Requests/sec|Latency" cluster-mode-results.txt

# Calculate improvement
single_rps=$(grep "Requests/sec" single-instance-results.txt | awk '{print $1}')
cluster_rps=$(grep "Requests/sec" cluster-mode-results.txt | awk '{print $1}')

if [ ! -z "$single_rps" ] && [ ! -z "$cluster_rps" ]; then
  improvement=$(echo "scale=2; $cluster_rps / $single_rps" | bc -l)
  echo ""
  echo "Performance Improvement: ${improvement}x"
  echo "CPU Cores Available: $(nproc)"
fi

# Cleanup
pm2 delete all
rm -f single-instance-results.txt cluster-mode-results.txt

echo "🎉 Performance comparison completed!"
```

### Cross-Platform Deployment Examples

#### Example 6: Flask Integration Comparison

**Flask equivalent server**
```python
# flask_server.py - Flask equivalent for comparison
from flask import Flask, jsonify
import os
import psutil
import time

app = Flask(__name__)

@app.route('/hello')
def hello():
    return jsonify({
        'message': 'Hello world',
        'timestamp': time.time(),
        'process': os.getpid(),
        'framework': 'Flask'
    })

@app.route('/health')
def health():
    process = psutil.Process()
    return jsonify({
        'status': 'OK',
        'uptime': time.time() - process.create_time(),
        'memory': process.memory_info()._asdict(),
        'framework': 'Flask'
    })

@app.route('/metrics')
def metrics():
    process = psutil.Process()
    return jsonify({
        'process': {
            'pid': os.getpid(),
            'memory': process.memory_info()._asdict(),
            'cpu_percent': process.cpu_percent(),
            'create_time': process.create_time()
        },
        'system': {
            'cpu_count': psutil.cpu_count(),
            'memory': psutil.virtual_memory()._asdict(),
            'load_average': os.getloadavg()
        },
        'framework': 'Flask'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=False)
```

**Cross-platform deployment comparison**
```bash
#!/bin/bash
# cross-platform-demo.sh - Compare Node.js and Python deployment

echo "🌍 Cross-Platform Deployment Comparison"
echo "======================================="

# Node.js PM2 deployment
echo "1. Deploying Node.js application with PM2..."
pm2 start ecosystem.config.js --name nodejs-app
sleep 3

# Python deployment (using gunicorn for comparison)
echo "2. Deploying Flask application with Gunicorn..."
pip install gunicorn flask psutil
gunicorn -w 4 -b 0.0.0.0:3001 flask_server:app --daemon --pid flask.pid

sleep 3

# Test both endpoints
echo "3. Testing both applications..."

echo "Node.js Response:"
curl -s http://localhost:3000/hello | jq '.'

echo ""
echo "Flask Response:"
curl -s http://localhost:3001/hello | jq '.'

# Performance comparison
echo ""
echo "4. Quick performance test..."

echo "Node.js performance:"
autocannon -c 10 -d 10 http://localhost:3000/hello | grep "Requests/sec"

echo "Flask performance:"
autocannon -c 10 -d 10 http://localhost:3001/hello | grep "Requests/sec"

# Cleanup
pm2 delete nodejs-app
kill $(cat flask.pid) 2>/dev/null || true
rm -f flask.pid

echo "🎉 Cross-platform comparison completed!"
```

### Educational Testing Examples

#### Example 7: PM2 Testing Integration

**PM2 testing utilities**
```javascript
// test/pm2-helpers.js - PM2 testing utilities
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PM2TestHelper {
  constructor(appName = 'test-app') {
    this.appName = appName;
  }
  
  async startApp(configPath) {
    const { stdout, stderr } = await execAsync(`pm2 start ${configPath} --name ${this.appName}`);
    return { stdout, stderr };
  }
  
  async stopApp() {
    try {
      await execAsync(`pm2 delete ${this.appName}`);
    } catch (error) {
      // App might not exist, ignore error
    }
  }
  
  async getAppStatus() {
    try {
      const { stdout } = await execAsync(`pm2 jlist`);
      const processes = JSON.parse(stdout);
      return processes.find(proc => proc.name === this.appName);
    } catch (error) {
      return null;
    }
  }
  
  async reloadApp() {
    const { stdout, stderr } = await execAsync(`pm2 reload ${this.appName}`);
    return { stdout, stderr };
  }
  
  async getAppLogs() {
    const { stdout } = await execAsync(`pm2 logs ${this.appName} --nostream --lines 50`);
    return stdout;
  }
  
  async waitForHealthy(url = 'http://localhost:3000/health', timeout = 30000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }
}
```

**PM2 integration tests**
```javascript
// test/pm2.test.js - PM2 integration tests
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { PM2TestHelper } from './pm2-helpers.js';
import fetch from 'node-fetch';

describe('PM2 Integration Tests', () => {
  let pm2Helper;
  
  beforeEach(async () => {
    pm2Helper = new PM2TestHelper('test-nodejs-tutorial');
    await pm2Helper.stopApp(); // Ensure clean state
  });
  
  afterEach(async () => {
    await pm2Helper.stopApp();
  });
  
  describe('Application Startup', () => {
    it('should start application successfully', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      
      const status = await pm2Helper.getAppStatus();
      expect(status).toBeTruthy();
      expect(status.pm2_env.status).toBe('online');
    });
    
    it('should respond to health checks', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      
      const isHealthy = await pm2Helper.waitForHealthy();
      expect(isHealthy).toBe(true);
      
      const response = await fetch('http://localhost:3000/health');
      expect(response.ok).toBe(true);
      
      const healthData = await response.json();
      expect(healthData.status).toBe('OK');
    });
  });
  
  describe('Cluster Mode', () => {
    it('should start multiple instances in cluster mode', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      
      const status = await pm2Helper.getAppStatus();
      expect(status.pm2_env.exec_mode).toBe('cluster_mode');
      expect(status.pm2_env.instances).toBeGreaterThan(1);
    });
    
    it('should distribute load across instances', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      await pm2Helper.waitForHealthy();
      
      const pids = new Set();
      
      // Make multiple requests to collect PIDs
      for (let i = 0; i < 20; i++) {
        const response = await fetch('http://localhost:3000/cluster-info');
        const data = await response.json();
        pids.add(data.processId);
      }
      
      // Should have multiple unique PIDs (load balancing)
      expect(pids.size).toBeGreaterThan(1);
    });
  });
  
  describe('Zero-Downtime Deployment', () => {
    it('should reload without service interruption', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      await pm2Helper.waitForHealthy();
      
      let requestsFailed = 0;
      let requestsSucceeded = 0;
      
      // Start making requests during reload
      const requestInterval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:3000/hello');
          if (response.ok) {
            requestsSucceeded++;
          } else {
            requestsFailed++;
          }
        } catch (error) {
          requestsFailed++;
        }
      }, 100);
      
      // Perform reload after 1 second
      setTimeout(async () => {
        await pm2Helper.reloadApp();
      }, 1000);
      
      // Continue requests for 10 seconds total
      await new Promise(resolve => setTimeout(resolve, 10000));
      clearInterval(requestInterval);
      
      // Should have minimal or no failed requests
      const failureRate = requestsFailed / (requestsFailed + requestsSucceeded);
      expect(failureRate).toBeLessThan(0.1); // Less than 10% failure rate
      expect(requestsSucceeded).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Monitoring', () => {
    it('should expose performance metrics', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      await pm2Helper.waitForHealthy();
      
      const response = await fetch('http://localhost:3000/metrics');
      expect(response.ok).toBe(true);
      
      const metrics = await response.json();
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('processInfo');
      expect(typeof metrics.uptime).toBe('number');
    });
  });
  
  describe('Error Handling', () => {
    it('should restart on process crash', async () => {
      await pm2Helper.startApp('ecosystem.config.js');
      const initialStatus = await pm2Helper.getAppStatus();
      const initialPid = initialStatus.pid;
      
      // Simulate process crash
      process.kill(initialPid, 'SIGKILL');
      
      // Wait for PM2 to restart
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newStatus = await pm2Helper.getAppStatus();
      expect(newStatus.pm2_env.status).toBe('online');
      expect(newStatus.pid).not.toBe(initialPid);
    });
  });
});
```

---

## Conclusion

This comprehensive PM2 Process Manager guide provides complete coverage of production deployment for the Node.js tutorial project. Key learning outcomes include:

### ✅ Achieved Learning Objectives

1. **Production Deployment Mastery**: Complete understanding of PM2 cluster mode deployment with x10 performance improvement on multi-core systems
2. **Zero-Downtime Operations**: Implementation of graceful reload strategies ensuring continuous service availability
3. **Process Management Excellence**: Advanced process monitoring, health checks, and automatic restart policies
4. **Performance Optimization**: Resource management, memory optimization, and CPU utilization strategies
5. **Operational Excellence**: Comprehensive troubleshooting, monitoring, and best practices for production environments

### 🚀 Performance Achievements

- **Cluster Mode**: x10 performance boost on 16-core machines through intelligent load balancing
- **Zero-Downtime**: < 5 seconds deployment with zero service interruption
- **Process Restart**: < 2 seconds individual worker restart capability
- **Health Monitoring**: < 100ms health check response times
- **Resource Efficiency**: < 5% logging overhead with comprehensive monitoring

### 📚 Educational Value

This guide demonstrates:
- **Modern Deployment Patterns**: Industry-standard PM2 deployment strategies
- **Horizontal Scaling**: Process multiplication for performance improvement
- **Production Readiness**: Enterprise-grade process management and monitoring
- **Cross-Platform Integration**: Express.js v5.1.0 and Node.js v22.x LTS compatibility
- **Operational Excellence**: Comprehensive monitoring, alerting, and maintenance procedures

### 🔗 Integration Points

- **Express.js v5.1.0**: Enhanced security and performance integration
- **Security Middleware**: Helmet.js and rate limiting configuration
- **Testing Framework**: Jest/Mocha integration for deployment validation
- **Monitoring Systems**: Custom metrics and external monitoring integration
- **CI/CD Pipeline**: GitHub Actions deployment automation

### 📖 Next Steps

1. **Implement PM2 cluster mode** for your Express.js application
2. **Configure zero-downtime deployment** pipeline with health validation
3. **Set up comprehensive monitoring** with alerting and performance tracking
4. **Apply security best practices** for production deployment
5. **Establish backup and recovery** procedures for operational resilience

This guide completes **Phase 5: PM2 Production Deployment** of the Node.js Tutorial Project, providing the foundation for enterprise-grade application deployment and management.

---

**Version**: 2.0.0  
**Supported PM2 Version**: Latest (6.0.8+)  
**Supported Node.js Versions**: 22.x LTS  
**Performance Target**: x10 improvement on 16 cores machines  
**Zero-Downtime Deployment**: ✅ Enabled  
**Educational Tutorial Phase**: Phase 5: PM2 Production Deployment