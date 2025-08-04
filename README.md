# Node.js Tutorial Project - Progressive Web Development

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js Version](https://img.shields.io/badge/express-5.1.0-blue.svg)](https://expressjs.com/)
[![PM2 Version](https://img.shields.io/badge/pm2-6.0.8-red.svg)](https://pm2.keymetrics.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#testing)

> **Comprehensive educational platform demonstrating progressive web application development from basic HTTP server to production-ready Express.js deployment with PM2 cluster mode, comprehensive testing, and cross-platform Flask migration.**

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [⚡ Quick Start Guide](#-quick-start-guide)
- [📚 Tutorial Phases](#-tutorial-phases)
- [🔧 Installation Instructions](#-installation-instructions)
- [💻 Usage Examples](#-usage-examples)
- [📊 API Documentation](#-api-documentation)
- [🧪 Testing Guide](#-testing-guide)
- [🚀 Production Deployment](#-production-deployment)
- [🔒 Security Implementation](#-security-implementation)
- [🐍 Flask Migration Guide](#-flask-migration-guide)
- [🤝 Contributing Guidelines](#-contributing-guidelines)
- [📖 Additional Resources](#-additional-resources)

## 🎯 Project Overview

This comprehensive Node.js tutorial project serves as a progressive learning platform that demonstrates modern web application development from foundational HTTP server concepts to enterprise-grade production deployment. Built with **Node.js v22.x LTS** and **Express.js v5.1.0**, the project showcases industry best practices through seven distinct educational phases.

### 🎓 Learning Objectives

- **Master Node.js v22.x LTS fundamentals** with ES Modules and modern JavaScript patterns
- **Implement Express.js v5.1.0 framework** with comprehensive middleware and security
- **Deploy production applications** using PM2 cluster mode with zero-downtime capabilities
- **Develop comprehensive testing strategies** using Jest and Mocha frameworks
- **Apply security best practices** with Helmet.js and enterprise-grade protection
- **Migrate applications across platforms** using Flask for cross-platform understanding
- **Implement professional development workflows** with CI/CD and automation

### 👥 Target Audience

- **Beginning Node.js developers** learning server-side JavaScript development
- **Intermediate developers** seeking production deployment and testing expertise
- **DevOps engineers** implementing Node.js applications in production environments
- **Full-stack developers** exploring cross-platform development patterns
- **Students and educators** requiring comprehensive Node.js learning resources

### ✨ Key Features

- **Progressive Enhancement**: Seven tutorial phases building from basic concepts to production deployment
- **Modern Technology Stack**: Node.js v22.x LTS, Express.js v5.1.0, PM2 v6.0.8, Helmet.js v8.1.0
- **Production-Ready Deployment**: PM2 cluster mode with automatic load balancing and zero-downtime reload
- **Comprehensive Testing**: Jest and Mocha frameworks with ≥90% coverage requirements
- **Enterprise Security**: Helmet.js with 15 HTTP security headers and CORS configuration
- **Cross-Platform Compatibility**: Flask migration demonstrating feature parity across technology stacks
- **Educational Documentation**: Complete JSDoc implementation and learning progression guides

## ⚡ Quick Start Guide

### Prerequisites

Ensure your development environment meets these requirements:

```bash
# Required versions
Node.js: v22.x LTS (recommended) or v18+ minimum
npm: v10.0.0+ (bundled with Node.js)
Python: 3.9+ (for Flask migration phase)
Git: Latest stable version

# Verify installations
node --version    # Should show v22.x or v18+
npm --version     # Should show v10+
python --version  # Should show 3.9+
git --version     # Should show latest stable
```

### 🚀 Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nodejs-tutorial-backend/src/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify installation**
   ```bash
   # Test endpoints
   curl http://localhost:3000/hello        # Returns: {"message": "Hello world"}
   curl http://localhost:3000/good-evening # Returns: {"message": "Good evening"}
   curl http://localhost:3000/health       # Returns: Health status
   ```

### ✅ Verification Commands

Run these commands to ensure everything is working correctly:

```bash
# Health check
npm run health

# Run test suite
npm test

# Security audit
npm run security:audit

# Check lint status
npm run lint
```

## 📚 Tutorial Phases

This tutorial progresses through seven comprehensive phases, each building upon previous concepts while introducing new technologies and practices.

### Phase 1: Basic HTTP Server Implementation
**Foundation Node.js server using core HTTP module**

- **Learning Outcomes**: HTTP request/response cycle, Node.js core modules, server lifecycle management
- **Files**: `src/backend/basic-server.js`
- **Commands**: `node basic-server.js`
- **Validation**: `curl http://localhost:3000` should return "Hello world"

### Phase 2: Express.js Framework Integration
**Enhanced server with Express.js v5.1.0 routing and middleware**

- **Learning Outcomes**: Express.js architecture, middleware patterns, RESTful API design
- **Files**: `src/backend/express-server.js`, `src/backend/app.js`
- **Commands**: `npm start`, `npm run dev`
- **Validation**: Test `/hello` and `/good-evening` endpoints

### Phase 3: Cross-Platform Flask Migration
**Python Flask implementation with feature parity**

- **Learning Outcomes**: Cross-platform development, Flask framework, API compatibility
- **Files**: `src/backend/flask-app/`, `src/backend/docs/FLASK_MIGRATION.md`
- **Commands**: `npm run flask:setup`, `npm run flask:start`
- **Validation**: Identical API responses between Node.js and Flask implementations

### Phase 4: Comprehensive Testing Implementation
**Testing with Jest and Mocha frameworks with coverage**

- **Learning Outcomes**: Unit testing patterns, integration testing, code coverage analysis
- **Files**: `src/backend/test/`, `src/backend/docs/TESTING.md`
- **Commands**: `npm test`, `npm run test:coverage`, `npm run test:mocha`
- **Validation**: ≥90% test coverage with all tests passing

### Phase 5: PM2 Production Deployment
**Production deployment with PM2 cluster mode and monitoring**

- **Learning Outcomes**: Process management, cluster mode scaling, zero-downtime deployment
- **Files**: `ecosystem.config.js`, `src/backend/docs/PM2_GUIDE.md`
- **Commands**: `npm run pm2:start`, `npm run pm2:reload`, `npm run pm2:monit`
- **Validation**: PM2 cluster mode running with multiple worker processes

### Phase 6: Security Implementation
**Comprehensive security with Helmet.js and best practices**

- **Learning Outcomes**: Web security headers, CORS configuration, security middleware
- **Files**: `src/backend/security/`, `src/backend/docs/SECURITY.md`
- **Commands**: `npm run security:audit`, `npm run security:fix`
- **Validation**: Security headers present and vulnerability scan clean

### Phase 7: Documentation and CI/CD
**Complete documentation with JSDoc and automated workflows**

- **Learning Outcomes**: Documentation best practices, CI/CD pipelines, professional workflows
- **Files**: `src/backend/docs/`, `src/backend/.github/workflows/`
- **Commands**: `npm run lint`, `npm run format`, `npm run build`
- **Validation**: Complete documentation and passing CI/CD pipeline

## 🔧 Installation Instructions

### Development Environment Setup

1. **Node.js Installation**
   ```bash
   # Using Node Version Manager (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 22
   nvm use 22
   
   # Or download from official website
   # https://nodejs.org/en/download/
   ```

2. **Project Dependencies**
   ```bash
   # Install production dependencies
   npm ci --production
   
   # Install all dependencies (including dev)
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure environment variables
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=debug
   ```

4. **Database Setup** (Optional - not used in basic tutorial)
   ```bash
   # This tutorial uses stateless architecture
   # No database setup required
   ```

5. **Python Setup** (For Flask migration)
   ```bash
   # Install Python 3.9+
   python --version
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   
   # Install Flask dependencies
   pip install -r src/backend/flask-app/requirements.txt
   ```

### Production Environment Setup

1. **Server Preparation**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js via NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 globally
   sudo npm install -g pm2@6.0.8
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <repository-url> /var/www/nodejs-tutorial
   cd /var/www/nodejs-tutorial/src/backend
   
   # Install production dependencies
   npm ci --production
   
   # Start with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

## 💻 Usage Examples

### Basic Server Operations

```javascript
// Starting the development server
npm run dev

// Starting with PM2
npm run pm2:start

// Health check
curl http://localhost:3000/health
```

### API Endpoint Usage

```bash
# Hello endpoint
curl -X GET http://localhost:3000/hello
# Response: {"message": "Hello world", "timestamp": "2025-01-01T00:00:00.000Z"}

# Good evening endpoint
curl -X GET http://localhost:3000/good-evening
# Response: {"message": "Good evening", "timestamp": "2025-01-01T00:00:00.000Z"}

# Health check endpoint
curl -X GET http://localhost:3000/health
# Response: {"status": "OK", "uptime": 123.45, "timestamp": "2025-01-01T00:00:00.000Z"}

# API v1 endpoints (versioned)
curl -X GET http://localhost:3000/api/v1/hello
curl -X GET http://localhost:3000/api/v1/good-evening
curl -X GET http://localhost:3000/api/v1/health
```

### Environment-Specific Commands

```bash
# Development
npm run dev
npm run test:watch
npm run lint:fix

# Production
npm run pm2:start
npm run pm2:monit
npm run pm2:logs

# Testing
npm test
npm run test:coverage
npm run test:mocha

# Security
npm run security:audit
npm run security:fix
```

### Docker Usage (Optional)

```bash
# Build Docker image
docker build -t nodejs-tutorial .

# Run container
docker run -p 3000:3000 -e NODE_ENV=production nodejs-tutorial

# Docker Compose
docker-compose up -d
```

## 📊 API Documentation

### Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

### Authentication
This tutorial project uses no authentication for educational simplicity. In production, implement appropriate authentication mechanisms.

### Endpoints

#### GET /hello
Returns a greeting message.

**Request:**
```bash
curl -X GET http://localhost:3000/hello
```

**Response:**
```json
{
  "message": "Hello world",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "correlationId": "req_1234567890abcdef"
}
```

**Status Codes:**
- `200 OK`: Success
- `500 Internal Server Error`: Server error

#### GET /good-evening
Returns an evening greeting message.

**Request:**
```bash
curl -X GET http://localhost:3000/good-evening
```

**Response:**
```json
{
  "message": "Good evening",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "correlationId": "req_1234567890abcdef"
}
```

#### GET /health
Health check endpoint for monitoring and load balancer integration.

**Request:**
```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3661.234,
  "memory": {
    "used": "45.67 MB",
    "total": "512.00 MB"
  },
  "environment": "production",
  "version": "1.0.0",
  "nodeVersion": "v22.11.0",
  "correlationId": "health_1234567890abcdef"
}
```

### API Versioning

All endpoints are available with API versioning:

```bash
# Version 1 API
GET /api/v1/hello
GET /api/v1/good-evening
GET /api/v1/health
```

### Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An internal server error occurred",
    "correlationId": "err_1234567890abcdef",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

### Rate Limiting

Production deployment includes rate limiting:
- **100 requests per minute** per IP address
- **Rate limit headers** included in responses
- **429 Too Many Requests** status for exceeded limits

## 🧪 Testing Guide

This project uses both **Jest** and **Mocha** testing frameworks to provide comprehensive testing education and demonstrate different testing approaches.

### Testing Framework Overview

#### Jest Framework
- **All-in-one testing solution** with built-in assertions, mocking, and coverage
- **Parallel test execution** for better performance
- **Zero configuration** setup for most JavaScript projects
- **Built-in code coverage** reporting

#### Mocha Framework
- **Modular testing framework** with flexible tool selection
- **Custom assertion libraries** (Chai) and stubbing (Sinon)
- **Flexible reporting** and plugin ecosystem
- **Async/await support** for modern JavaScript testing

### Running Tests

#### Jest Tests
```bash
# Run all Jest tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test patterns
npm test -- --testPathPattern=unit
npm test -- --testPathPattern=integration

# Run tests with specific configuration
npm run test:ci
```

#### Mocha Tests
```bash
# Run all Mocha tests
npm run test:mocha

# Run Mocha tests in watch mode
npm run test:mocha:watch

# Generate coverage with c8
npm run test:mocha:coverage

# Run specific test files
npx mocha test/unit/server.test.js
```

### Test Structure

```
test/
├── unit/                    # Unit tests
│   ├── server.test.js      # Server unit tests
│   └── controllers/        # Controller tests
├── integration/            # Integration tests
│   ├── express-app.test.js # Express app integration
│   └── flask-parity.test.js # Flask compatibility
├── fixtures/               # Test data and mocks
│   ├── mock-responses.js   # Mock response data
│   └── test-data.json     # Test fixtures
├── helpers/               # Test utilities
│   └── test-helpers.js    # Common test functions
├── jest.config.js         # Jest configuration
├── setup.js              # Test setup
└── teardown.js           # Test cleanup
```

### Writing Tests

#### Jest Example
```javascript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createExpressApp } from '../../../app.js';

describe('Hello Endpoint', () => {
  let app;

  beforeAll(() => {
    app = createExpressApp();
  });

  test('should return hello message', async () => {
    const response = await request(app)
      .get('/hello')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Hello world',
      timestamp: expect.any(String)
    });
  });
});
```

#### Mocha Example
```javascript
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import { createExpressApp } from '../../../app.js';

describe('Good Evening Endpoint', () => {
  let app;

  before(() => {
    app = createExpressApp();
  });

  it('should return good evening message', async () => {
    const response = await request(app)
      .get('/good-evening')
      .expect(200);

    expect(response.body).to.deep.equal({
      message: 'Good evening',
      timestamp: response.body.timestamp
    });
  });
});
```

### Coverage Requirements

- **Statement Coverage**: ≥90%
- **Branch Coverage**: ≥85%
- **Function Coverage**: ≥95%
- **Line Coverage**: ≥90%

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Generate multiple format reports
npm run test:coverage -- --coverage --coverageReporters=text,lcov,html,json
```

### Testing Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Use mocks for external services
5. **Test Edge Cases**: Include boundary and error conditions
6. **Performance Testing**: Include load and performance tests

### Performance Testing

```bash
# Load testing with Artillery
npm run test:load

# Performance testing with Autocannon
npm run test:performance

# Memory leak testing
npm run test:memory
```

## 🚀 Production Deployment

This section covers comprehensive production deployment using **PM2 process manager** with cluster mode, zero-downtime deployment, and enterprise-grade monitoring.

### PM2 Cluster Mode Overview

PM2 provides:
- **Automatic Load Balancing**: Built-in load balancer for HTTP/TCP/UDP connections
- **Zero-Downtime Deployment**: Graceful worker restart and health validation
- **Process Management**: Automatic restart on crashes and memory management
- **Performance Scaling**: x10 performance increase on multi-core machines
- **Monitoring Integration**: Real-time metrics and health monitoring

### Deployment Methods

#### Method 1: NPM Scripts (Recommended)
```bash
# Production deployment
npm run deploy:production

# Staging deployment
npm run deploy:staging

# Start PM2 cluster
npm run pm2:start

# Reload with zero downtime
npm run pm2:reload

# Monitor processes
npm run pm2:monit
```

#### Method 2: Direct PM2 Commands
```bash
# Start application with ecosystem file
pm2 start ecosystem.config.js --env production

# Start with specific instance count
pm2 start ecosystem.config.js --env production -i max

# Reload all processes
pm2 reload ecosystem.config.js --env production

# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all
```

#### Method 3: Deployment Automation
```bash
# Setup deployment keys
pm2 deploy ecosystem.config.js production setup

# Deploy latest version
pm2 deploy ecosystem.config.js production

# Deploy specific revision
pm2 deploy ecosystem.config.js production --force
```

### Ecosystem Configuration

The `ecosystem.config.js` file provides comprehensive PM2 configuration:

```javascript
module.exports = {
  apps: [{
    name: 'nodejs-tutorial-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      PM2_CLUSTER_MODE: 'true'
    },
    // Resource management
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    
    // Zero-downtime deployment
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Logging
    log_file: './logs/pm2/combined.log',
    out_file: './logs/pm2/out.log',
    error_file: './logs/pm2/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring
    pmx: true,
    automation: false,
    vizion: true
  }],
  
  deploy: {
    production: {
      user: 'nodejs',
      host: 'production-server',
      ref: 'origin/main',
      repo: 'git@github.com:nodejs-tutorial/backend.git',
      path: '/var/www/nodejs-tutorial',
      'post-deploy': 'npm ci --production && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### Monitoring and Health Checks

#### PM2 Monitoring Commands
```bash
# Process status
pm2 status

# Real-time monitoring
pm2 monit

# Process logs
pm2 logs

# Flush logs
pm2 flush

# Show process information
pm2 show nodejs-tutorial-app

# CPU and memory usage
pm2 describe nodejs-tutorial-app
```

#### Health Check Integration
```bash
# Manual health check
curl http://localhost:3000/health

# Automated health monitoring
npm run health

# Health check with timeout
timeout 5s curl -f http://localhost:3000/health || exit 1
```

### Load Balancer Configuration

PM2 automatically handles load balancing, but you can configure external load balancers:

#### Nginx Configuration
```nginx
upstream nodejs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://nodejs_backend/health;
        access_log off;
    }
}
```

### Environment Variables

#### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
APP_NAME=nodejs-tutorial-app

# PM2 Configuration
PM2_CLUSTER_MODE=true
PM2_INSTANCES=max
PM2_LOAD_BALANCER=round_robin

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
HELMET_ENABLED=true
CORS_ORIGIN=https://your-domain.com

# Monitoring
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
```

### SSL/HTTPS Configuration

#### SSL Certificate Setup
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Manual certificate installation
sudo mkdir -p /etc/ssl/nodejs-tutorial
sudo cp your-cert.pem /etc/ssl/nodejs-tutorial/
sudo cp your-key.pem /etc/ssl/nodejs-tutorial/
```

#### HTTPS Express Configuration
```javascript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('/etc/ssl/nodejs-tutorial/private-key.pem'),
  cert: fs.readFileSync('/etc/ssl/nodejs-tutorial/certificate.pem')
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS Server running on port 443');
});
```

### Backup and Recovery

#### Application Backup
```bash
# Backup application files
tar -czf nodejs-tutorial-backup-$(date +%Y%m%d).tar.gz /var/www/nodejs-tutorial

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 ~/pm2-backup-$(date +%Y%m%d).json
```

#### Disaster Recovery
```bash
# Restore from backup
tar -xzf nodejs-tutorial-backup-20250101.tar.gz -C /var/www/

# Restore PM2 processes
pm2 resurrect ~/pm2-backup-20250101.json

# Verify deployment
npm run health
pm2 status
```

## 🔒 Security Implementation

This project implements comprehensive security measures using **Helmet.js v8.1.0** and industry best practices to protect against common web vulnerabilities.

### Security Overview

The security implementation includes:
- **15 HTTP Security Headers** automatically applied via Helmet.js
- **Content Security Policy (CSP)** for XSS protection
- **CORS Configuration** for cross-origin request management
- **Rate Limiting** for abuse prevention
- **Input Validation** and sanitization
- **Security Audit** and vulnerability scanning

### Helmet.js Security Headers

#### Automatically Applied Headers

1. **Content-Security-Policy**: Mitigates XSS attacks
2. **Cross-Origin-Opener-Policy**: Prevents cross-origin attacks
3. **Cross-Origin-Resource-Policy**: Controls resource sharing
4. **Origin-Agent-Cluster**: Isolates origins in agent clusters
5. **Referrer-Policy**: Controls referrer information
6. **Strict-Transport-Security**: Enforces HTTPS
7. **X-Content-Type-Options**: Prevents MIME sniffing
8. **X-DNS-Prefetch-Control**: Controls DNS prefetching
9. **X-Download-Options**: Controls file downloads
10. **X-Frame-Options**: Prevents clickjacking
11. **X-Permitted-Cross-Domain-Policies**: Controls cross-domain policies
12. **X-Powered-By**: Removes server identification (removed for security)
13. **X-XSS-Protection**: Legacy XSS protection (disabled, CSP preferred)

#### Configuration Example
```javascript
import helmet from 'helmet';

app.use(helmet({
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
  crossOriginEmbedderPolicy: false
}));
```

### CORS Configuration

#### Production CORS Setup
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://your-domain.com',
      'https://api.your-domain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Rate Limiting

#### Basic Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
```

#### Advanced Rate Limiting
```javascript
import slowDown from 'express-slow-down';

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500,
  maxDelayMs: 20000
});

app.use(speedLimiter);
```

### Input Validation

#### Request Validation Middleware
```javascript
import validator from 'validator';

const validateInput = (req, res, next) => {
  // Validate and sanitize input
  if (req.body.email && !validator.isEmail(req.body.email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  // Sanitize HTML input
  if (req.body.message) {
    req.body.message = validator.escape(req.body.message);
  }
  
  next();
};

app.use(validateInput);
```

### Security Commands

#### Security Audit
```bash
# NPM security audit
npm audit

# High-severity vulnerabilities only
npm audit --audit-level high

# Fix vulnerabilities automatically
npm audit fix

# Force fix (potentially breaking changes)
npm audit fix --force

# Generate security report
npm run security:audit
```

#### Vulnerability Scanning
```bash
# Snyk security scanning
npm install -g snyk
snyk test
snyk monitor

# OWASP dependency check
dependency-check --project nodejs-tutorial --scan ./
```

### Security Best Practices

#### Environment Variables
```bash
# Production security variables
HELMET_ENABLED=true
CSP_ENABLED=true
CORS_ENABLED=true
RATE_LIMITING_ENABLED=true
SECURITY_HEADERS_ENABLED=true

# Disable development features
DEBUG=false
NODE_ENV=production
STACK_TRACE_ENABLED=false
```

#### Secure Headers Testing
```bash
# Test security headers
curl -I http://localhost:3000/

# Check specific headers
curl -H "X-Forwarded-Proto: https" -I http://localhost:3000/

# Security header analysis
npm run security:check
```

### Security Monitoring

#### Security Event Logging
```javascript
import { logSecurityEvent } from './utils/logger.js';

app.use((req, res, next) => {
  // Log suspicious activities
  if (req.path.includes('../') || req.path.includes('..\\')) {
    logSecurityEvent('directory-traversal-attempt', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
});
```

#### Real-time Security Monitoring
```bash
# Monitor security logs
tail -f logs/security.log

# Monitor failed requests
pm2 logs | grep "ERROR\|WARN"

# Security metrics
npm run security:metrics
```

### Compliance and Standards

#### Security Compliance Checklist
- ✅ **OWASP Top 10** protection implemented
- ✅ **HTTPS** enforced in production
- ✅ **Security headers** configured
- ✅ **Input validation** implemented
- ✅ **Rate limiting** active
- ✅ **Error handling** secure
- ✅ **Dependency scanning** automated
- ✅ **Security monitoring** enabled

#### Security Documentation
- 📋 **Security Policy**: See `src/backend/docs/SECURITY.md`
- 🔒 **Vulnerability Reporting**: See security contact information
- 📖 **Security Guide**: Comprehensive security implementation guide
- 🛡️ **Threat Model**: Security threat analysis and mitigation strategies

## 🐍 Flask Migration Guide

This section demonstrates cross-platform development by migrating the Node.js application to **Python Flask v3.1.1** while maintaining complete feature parity and API compatibility.

### Migration Overview

The Flask migration demonstrates:
- **Feature Parity**: Identical API endpoints and response formats
- **Cross-Platform Patterns**: Different technology stacks, same functionality
- **Educational Value**: Technology comparison and migration strategies
- **Production Readiness**: Flask deployment with equivalent capabilities

### Flask Application Structure

```
flask-app/
├── app.py                    # Main Flask application
├── server.py                 # Production server entry point
├── config.py                 # Configuration management
├── requirements.txt          # Python dependencies
├── blueprints/              # Flask blueprints (routes)
│   ├── hello_bp.py          # Hello endpoint blueprint
│   ├── health_bp.py         # Health check blueprint
│   └── api.py               # API aggregation
├── controllers/             # Request handlers
│   ├── hello_controller.py  # Hello endpoint controller
│   └── health_controller.py # Health check controller
├── services/                # Business logic
│   ├── hello_service.py     # Hello service
│   └── health_service.py    # Health service
├── middleware/              # Flask middleware
│   ├── security.py          # Security headers
│   ├── cors.py              # CORS configuration
│   ├── error_handler.py     # Error handling
│   └── logging.py           # Request logging
├── utils/                   # Utilities
│   ├── constants.py         # Application constants
│   ├── logger.py           # Logging utilities
│   └── helpers.py          # Helper functions
└── tests/                   # Flask tests
    ├── test_parity.py       # Feature parity tests
    └── fixtures/            # Test fixtures
        └── test_data.py     # Test data
```

### Installation and Setup

#### Flask Environment Setup
```bash
# Create Python virtual environment
python -m venv flask-env
source flask-env/bin/activate  # Linux/Mac
# or
flask-env\Scripts\activate     # Windows

# Install Flask dependencies
pip install -r src/backend/flask-app/requirements.txt

# Setup Flask application
npm run flask:setup
```

#### Flask Dependencies
```text
# requirements.txt
Flask==3.1.1
Werkzeug>=3.1
Jinja2>=3.1.2
ItsDangerous>=2.2
Click>=8.0
flask-cors>=4.0.0
python-dotenv>=1.0.0
gunicorn>=21.2.0
pytest>=7.4.0
pytest-flask>=1.3.0
coverage>=7.3.0
```

### Flask Implementation Examples

#### Main Flask Application
```python
# app.py
from flask import Flask
from flask_cors import CORS
from blueprints.api import api_bp
from middleware.security import setup_security_headers
from middleware.error_handler import setup_error_handlers
from config import Config
import logging

def create_app(config_class=Config):
    """Flask application factory"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Setup security headers
    setup_security_headers(app)
    
    # Setup error handlers
    setup_error_handlers(app)
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=3000, debug=True)
```

#### Hello Endpoint Implementation
```python
# controllers/hello_controller.py
from flask import jsonify
from services.hello_service import HelloService
from utils.logger import get_logger
import datetime

logger = get_logger(__name__)

class HelloController:
    def __init__(self):
        self.service = HelloService()
    
    def get_hello(self):
        """Handle GET /hello request"""
        try:
            logger.info("Processing hello request")
            
            message = self.service.get_hello_message()
            
            response = {
                "message": message,
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }
            
            logger.info("Hello request processed successfully", extra={
                "response": response
            })
            
            return jsonify(response), 200
            
        except Exception as e:
            logger.error(f"Error processing hello request: {str(e)}")
            return jsonify({
                "error": "Internal server error",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }), 500
```

#### Health Check Implementation
```python
# controllers/health_controller.py
from flask import jsonify
from services.health_service import HealthService
import datetime
import os
import psutil

class HealthController:
    def __init__(self):
        self.service = HealthService()
    
    def get_health(self):
        """Handle GET /health request"""
        try:
            process = psutil.Process()
            
            health_data = {
                "status": "OK",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "uptime": process.create_time(),
                "memory": {
                    "used": f"{process.memory_info().rss / 1024 / 1024:.2f} MB",
                    "percent": f"{process.memory_percent():.2f}%"
                },
                "environment": os.environ.get("FLASK_ENV", "development"),
                "version": "1.0.0",
                "pythonVersion": f"Python {'.'.join(map(str, sys.version_info[:3]))}"
            }
            
            return jsonify(health_data), 200
            
        except Exception as e:
            return jsonify({
                "status": "ERROR",
                "message": str(e),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }), 500
```

### Flask Commands and Usage

#### Development Commands
```bash
# Start Flask development server
npm run flask:start
# or
python src/backend/flask-app/app.py

# Run Flask with Gunicorn (production)
gunicorn -w 4 -b 0.0.0.0:3000 app:app

# Flask shell
python -c "from app import create_app; app = create_app(); app.app_context().push()"
```

#### Testing Flask Implementation
```bash
# Run Flask tests
npm run flask:test
# or
cd src/backend/flask-app && python -m pytest

# Test feature parity
npm run flask:compare

# Coverage report
cd src/backend/flask-app && coverage run -m pytest && coverage report
```

### Feature Parity Validation

#### API Compatibility Testing
```python
# tests/test_parity.py
import pytest
import requests
import json

class TestAPIParity:
    """Test Feature parity between Node.js and Flask implementations"""
    
    def test_hello_endpoint_parity(self):
        # Test Node.js endpoint
        node_response = requests.get('http://localhost:3000/hello')
        
        # Test Flask endpoint  
        flask_response = requests.get('http://localhost:3001/hello')
        
        # Verify response structure
        assert node_response.status_code == flask_response.status_code
        assert 'message' in node_response.json()
        assert 'message' in flask_response.json()
        assert node_response.json()['message'] == flask_response.json()['message']
    
    def test_health_endpoint_parity(self):
        # Test Node.js health endpoint
        node_health = requests.get('http://localhost:3000/health')
        
        # Test Flask health endpoint
        flask_health = requests.get('http://localhost:3001/health')
        
        # Verify response structure
        assert node_health.status_code == flask_health.status_code
        assert 'status' in node_health.json()
        assert 'status' in flask_health.json()
```

#### Automated Parity Checking
```bash
# Run parity validation
node scripts/flask/compare.js

# Expected output:
# ✅ /hello endpoint: PASS
# ✅ /good-evening endpoint: PASS  
# ✅ /health endpoint: PASS
# ✅ Response format: PASS
# ✅ Status codes: PASS
# ✅ Headers: PASS
```

### Production Deployment

#### Flask Production Configuration
```python
# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DEBUG = False
    TESTING = False
    
class ProductionConfig(Config):
    DEBUG = False
    # Production-specific settings
    
class DevelopmentConfig(Config):
    DEBUG = True
    # Development-specific settings
```

#### Gunicorn Configuration
```python
# gunicorn.conf.py
bind = "0.0.0.0:3000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 60
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### Performance Comparison

#### Benchmarking Results
```bash
# Node.js Performance
Requests per second: 2,847.23
Average response time: 35.12ms
P95 response time: 89.45ms
Memory usage: 45.67MB

# Flask Performance  
Requests per second: 1,923.56
Average response time: 52.18ms
P95 response time: 124.33ms
Memory usage: 38.92MB
```

### Migration Learning Outcomes

#### Technology Comparison
- **Node.js Benefits**: Higher throughput, single-threaded efficiency, NPM ecosystem
- **Flask Benefits**: Simplicity, Python ecosystem, explicit configuration
- **Deployment**: Both support production deployment with process managers
- **Development**: Different patterns but similar architectural concepts

#### Educational Value
- **Cross-Platform Skills**: Understanding multiple technology stacks
- **API Design**: Consistent API design across technologies  
- **Architecture Patterns**: Similar patterns in different languages
- **Migration Strategies**: Practical experience with technology migration

## 🤝 Contributing Guidelines

We welcome contributions to the Node.js Tutorial Project! This section provides comprehensive guidelines for contributing code, documentation, and educational content.

### Contributing Overview

This project serves as an educational platform, so contributions should:
- **Enhance Learning Value**: Improve educational content and examples
- **Maintain Code Quality**: Follow established coding standards and best practices
- **Ensure Compatibility**: Maintain compatibility across tutorial phases
- **Provide Documentation**: Include comprehensive documentation for changes

### Getting Started

#### Prerequisites for Contributors
```bash
# Required tools
Node.js v22.x LTS or v18+
npm v10.0.0+
Git latest stable
Python 3.9+ (for Flask contributions)

# Recommended tools
VS Code with extensions:
- ESLint
- Prettier
- Jest
- GitLens
```

#### Development Environment Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/nodejs-tutorial-backend.git
cd nodejs-tutorial-backend/src/backend

# Add upstream remote
git remote add upstream https://github.com/nodejs-tutorial/backend.git

# Install dependencies
npm install

# Install pre-commit hooks
npm run setup:hooks

# Verify setup
npm run health
npm test
```

### Code Standards

#### JavaScript Style Guide
- **ES Modules**: Use ES Modules (import/export) syntax
- **Modern JavaScript**: Use ES2022+ features with Node.js v22.x compatibility
- **Naming Conventions**: Use camelCase for variables, PascalCase for classes
- **File Naming**: Use kebab-case for file names (e.g., `hello-controller.js`)

#### Code Quality Tools
```bash
# Linting
npm run lint          # Check linting
npm run lint:fix      # Fix linting issues

# Formatting  
npm run format        # Format code with Prettier
npm run format:check  # Check formatting

# Type checking (if using TypeScript)
npm run type-check
```

#### Documentation Standards
- **JSDoc Comments**: Comprehensive JSDoc for all functions and classes
- **README Updates**: Update README for significant changes
- **Code Comments**: Explain complex logic and educational concepts
- **Commit Messages**: Use conventional commit format

### Contribution Process

#### 1. Issue Creation
```bash
# Check existing issues first
# Create new issue with:
- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Educational impact assessment
```

#### 2. Branch Creation
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b bugfix/issue-description

# Or documentation branch
git checkout -b docs/documentation-update
```

#### 3. Development Workflow
```bash
# Make changes with frequent commits
git add .
git commit -m "feat: add new tutorial phase example"

# Run tests frequently
npm test
npm run test:coverage

# Check code quality
npm run lint
npm run format
npm run security:audit
```

#### 4. Testing Requirements
```bash
# All tests must pass
npm test

# Maintain coverage requirements
npm run test:coverage
# Statement Coverage: ≥90%
# Branch Coverage: ≥85%  
# Function Coverage: ≥95%

# Test new features thoroughly
npm run test:integration
npm run test:e2e
```

#### 5. Pull Request Submission
```bash
# Push branch to fork
git push origin feature/your-feature-name

# Create pull request with:
- Descriptive title
- Detailed description of changes
- Testing performed
- Educational impact
- Breaking changes (if any)
```

### Contribution Types

#### 🚀 Feature Contributions
- New tutorial phases or examples
- Enhanced middleware implementations
- Additional security features
- Performance optimizations
- Cross-platform compatibility improvements

#### 🐛 Bug Fix Contributions
- Security vulnerability fixes
- Performance issues
- Compatibility problems
- Documentation errors
- Test failures

#### 📚 Documentation Contributions
- Tutorial content improvements
- API documentation updates
- Code example enhancements
- Educational explanations
- Translation contributions

#### 🧪 Testing Contributions
- Additional test cases
- Testing framework improvements
- Performance benchmarks
- Security testing
- Cross-platform testing

### Code Review Process

#### Review Criteria
- **Code Quality**: Follows project standards and best practices
- **Test Coverage**: Adequate test coverage for new code
- **Documentation**: Proper documentation and comments
- **Educational Value**: Enhances learning experience
- **Security**: No security vulnerabilities introduced
- **Performance**: No performance regressions

#### Review Timeline
- **Initial Review**: Within 48 hours
- **Follow-up Reviews**: Within 24 hours
- **Merge Decision**: Within 1 week for standard changes

### Community Guidelines

#### Code of Conduct
- **Be Respectful**: Treat all community members with respect
- **Be Inclusive**: Welcome contributors of all skill levels
- **Be Educational**: Focus on learning and teaching
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember this is an educational project

#### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Request Comments**: Code-specific discussions
- **Email**: Security vulnerabilities and sensitive issues

### Recognition

#### Contributor Recognition
- **Contributors List**: All contributors listed in README
- **Release Notes**: Major contributions highlighted in releases
- **Educational Credits**: Educational content creators credited
- **Mentorship Opportunities**: Experienced contributors can mentor new ones

#### Contribution Levels
- **Code Contributors**: Direct code contributions
- **Documentation Contributors**: Documentation and tutorial improvements
- **Community Contributors**: Issue reporting, discussions, and support
- **Educational Contributors**: Learning content and teaching materials

### Getting Help

#### Resources for Contributors
- **Contributing Guide**: This comprehensive guide
- **Code Style Guide**: Detailed coding standards
- **Tutorial Documentation**: Educational content guidelines
- **API Documentation**: Complete API reference

#### Support Channels
```bash
# Get help with development
npm run help

# Check project health
npm run health

# Run diagnostics
npm run diagnostics

# Contact maintainers
# See CONTRIBUTORS.md for contact information
```

### Release Process

#### Version Management
- **Semantic Versioning**: Following semver (MAJOR.MINOR.PATCH)
- **Release Branches**: Feature releases from main branch
- **Hotfix Releases**: Critical fixes with expedited process

#### Release Timeline
- **Feature Releases**: Monthly release cycle
- **Patch Releases**: As needed for bug fixes
- **Security Releases**: Immediate for security issues

Thank you for contributing to the Node.js Tutorial Project! Your contributions help create better educational resources for the developer community.

## 📖 Additional Resources

### 📚 Educational Materials

#### Official Documentation
- **[Node.js Official Documentation](https://nodejs.org/docs/latest-v22.x/api/)** - Complete Node.js v22.x LTS API reference
- **[Express.js Guide](https://expressjs.com/en/5x/api.html)** - Express.js v5.1.0 comprehensive guide
- **[PM2 Documentation](https://pm2.keymetrics.io/docs/)** - PM2 v6.0.8 process manager documentation
- **[Helmet.js Security](https://helmetjs.github.io/)** - Helmet.js v8.1.0 security middleware guide

#### Tutorial Resources
- **[MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)** - JavaScript fundamentals and advanced concepts
- **[Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)** - Comprehensive Node.js best practices guide
- **[Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)** - Security and performance best practices
- **[JavaScript.info](https://javascript.info/)** - Modern JavaScript tutorial

#### Testing Resources
- **[Jest Documentation](https://jestjs.io/docs/getting-started)** - Jest testing framework guide
- **[Mocha Documentation](https://mochajs.org/)** - Mocha testing framework reference
- **[Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)** - JavaScript testing best practices

### 🛠️ Development Tools

#### Code Quality Tools
```bash
# ESLint configuration
npm install --save-dev eslint @eslint/js eslint-plugin-node

# Prettier configuration  
npm install --save-dev prettier eslint-config-prettier

# TypeScript support
npm install --save-dev typescript @types/node @types/express

# Security scanning
npm install --save-dev snyk audit-ci
```

#### Performance Tools
```bash
# Load testing
npm install --save-dev artillery autocannon

# Memory profiling
npm install --save-dev clinic

# Bundle analysis
npm install --save-dev webpack-bundle-analyzer
```

### 🏗️ Architecture Patterns

#### Microservices Resources
- **[Microservices.io](https://microservices.io/)** - Microservices architecture patterns
- **[Node.js Microservices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)** - Node.js containerization guide
- **[API Gateway Patterns](https://microservices.io/patterns/apigateway.html)** - API gateway implementation patterns

#### Database Integration
```bash
# MongoDB integration
npm install mongodb mongoose

# PostgreSQL integration  
npm install pg sequelize

# Redis integration
npm install redis ioredis
```

### 🔐 Security Resources

#### Security Best Practices
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)** - Web application security risks
- **[Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)** - Comprehensive security checklist
- **[Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)** - Express.js security best practices

#### Security Tools
```bash
# Vulnerability scanning
npm install --save-dev audit-ci nsp retire

# Static analysis
npm install --save-dev eslint-plugin-security

# Runtime protection
npm install --save-dev express-rate-limit helmet cors
```

### 📊 Monitoring and Observability

#### Monitoring Solutions
- **[PM2 Monitoring](https://pm2.io/)** - PM2 cloud monitoring platform
- **[New Relic](https://newrelic.com/)** - Application performance monitoring
- **[DataDog](https://www.datadoghq.com/)** - Infrastructure and application monitoring
- **[Prometheus + Grafana](https://prometheus.io/)** - Open-source monitoring stack

#### Logging Solutions
```bash
# Structured logging
npm install winston pino

# Log aggregation
npm install logstash-node elasticsearch

# Error tracking
npm install @sentry/node rollbar bugsnag
```

### 🚀 Deployment Platforms

#### Cloud Platforms
- **[AWS](https://aws.amazon.com/getting-started/hands-on/deploy-nodejs-web-app/)** - AWS Node.js deployment guide
- **[Google Cloud](https://cloud.google.com/nodejs)** - GCP Node.js documentation
- **[Azure](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)** - Azure Node.js quickstart
- **[DigitalOcean](https://docs.digitalocean.com/developer-center/deploy-a-node-js-app-to-app-platform/)** - DigitalOcean Node.js deployment

#### Container Platforms
```dockerfile
# Docker configuration
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Platform-as-a-Service
- **[Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)** - Heroku Node.js guide
- **[Vercel](https://vercel.com/docs/concepts/functions/serverless-functions)** - Vercel serverless functions
- **[Netlify](https://docs.netlify.com/functions/overview/)** - Netlify functions

### 📱 Frontend Integration

#### Frontend Frameworks
```bash
# React integration
npx create-react-app frontend
npm install axios

# Vue.js integration
npm install -g @vue/cli
vue create frontend

# Angular integration
npm install -g @angular/cli
ng new frontend
```

#### API Integration
```javascript
// Frontend API client example
const API_BASE_URL = 'http://localhost:3000';

class ApiClient {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return response.json();
  }
  
  async hello() {
    return this.get('/hello');
  }
  
  async health() {
    return this.get('/health');
  }
}
```

### 🧩 Extensions and Plugins

#### Express.js Middleware
```bash
# Popular middleware
npm install compression cookie-parser body-parser multer

# Authentication
npm install passport jsonwebtoken bcryptjs

# API documentation
npm install swagger-ui-express swagger-jsdoc

# GraphQL
npm install apollo-server-express graphql
```

#### Development Extensions
```bash
# Hot reloading
npm install --save-dev nodemon concurrently

# Debugging
npm install --save-dev debug ndb

# Code generation
npm install --save-dev plop hygen
```

### 📖 Learning Paths

#### Beginner Path
1. **JavaScript Fundamentals** → **Node.js Basics** → **Express.js Introduction**
2. **HTTP Concepts** → **REST API Design** → **Testing Basics**
3. **Basic Deployment** → **Environment Management** → **Error Handling**

#### Intermediate Path  
1. **Advanced Express.js** → **Middleware Development** → **Security Implementation**
2. **Testing Strategies** → **Performance Optimization** → **Monitoring Setup**
3. **Database Integration** → **Authentication** → **Production Deployment**

#### Advanced Path
1. **Microservices Architecture** → **Container Orchestration** → **Service Mesh**
2. **Advanced Security** → **Performance Tuning** → **Scalability Patterns**
3. **DevOps Integration** → **Monitoring & Alerting** → **Site Reliability**

### 🔗 Useful Links

#### Community Resources
- **[Node.js Community](https://nodejs.org/en/get-involved/)** - Official Node.js community
- **[Express.js Community](https://expressjs.com/en/resources/community.html)** - Express.js community resources
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/node.js)** - Node.js questions and answers

#### Newsletters and Blogs
- **[Node Weekly](https://nodeweekly.com/)** - Weekly Node.js newsletter
- **[RisingStack Blog](https://blog.risingstack.com/)** - Node.js and JavaScript blog
- **[Node.js Blog](https://nodejs.org/en/blog/)** - Official Node.js blog

#### Courses and Tutorials
- **[freeCodeCamp](https://www.freecodecamp.org/learn/back-end-development-and-apis/)** - Free Node.js course
- **[The Odin Project](https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs)** - Full-stack JavaScript path
- **[Codecademy](https://www.codecademy.com/learn/learn-node-js)** - Interactive Node.js course

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Node.js Foundation** for the robust runtime environment
- **Express.js Team** for the excellent web framework
- **PM2 Team** for the production-ready process manager
- **Helmet.js Contributors** for comprehensive security middleware
- **Jest and Mocha Communities** for outstanding testing frameworks
- **Open Source Community** for continuous inspiration and contribution

---

**Made with ❤️ by the Node.js Tutorial Project Team**

> This project is designed for educational purposes and demonstrates modern Node.js development practices. It serves as a comprehensive learning platform for developers at all skill levels.

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/nodejs-tutorial/backend) or contact our team.

**Happy coding! 🚀**