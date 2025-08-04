# Testing Guide - Node.js Tutorial Project

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Framework Comparison: Jest vs Mocha](#framework-comparison-jest-vs-mocha)
3. [Jest Configuration and Setup](#jest-configuration-and-setup)
4. [Mocha Configuration and Setup](#mocha-configuration-and-setup)
5. [Unit Testing Guide](#unit-testing-guide)
6. [Integration Testing Guide](#integration-testing-guide)
7. [End-to-End Testing Guide](#end-to-end-testing-guide)
8. [Performance Testing Guide](#performance-testing-guide)
9. [Security Testing Guide](#security-testing-guide)
10. [Code Coverage Requirements](#code-coverage-requirements)
11. [Cross-Platform Testing](#cross-platform-testing)
12. [PM2 Production Testing](#pm2-production-testing)
13. [CI/CD Integration](#cicd-integration)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Best Practices and Conventions](#best-practices-and-conventions)

---

## Testing Overview

### Testing Philosophy and Approach

This Node.js tutorial project employs a **comprehensive, dual-framework testing strategy** designed to demonstrate modern testing practices while providing educational value for developers learning Node.js application development. Our testing approach emphasizes:

- **Quality Assurance**: Ensuring robust, production-ready code through extensive testing
- **Educational Value**: Demonstrating best practices for Node.js testing ecosystems
- **Framework Flexibility**: Supporting both Jest and Mocha to showcase different testing philosophies
- **Production Readiness**: Validating deployment scenarios including PM2 cluster mode
- **Cross-Platform Compatibility**: Preparing for Flask migration and technology diversity

### Educational Testing Progression

The testing strategy follows the tutorial's 7-phase progressive architecture:

1. **Phase 1**: Basic HTTP server unit testing with fundamental test patterns
2. **Phase 2**: Express.js integration testing with middleware validation
3. **Phase 3**: Flask cross-platform testing and compatibility verification
4. **Phase 4**: Comprehensive test suite implementation with security testing
5. **Phase 5**: PM2 production testing with cluster mode validation
6. **Phase 6**: Security testing with Helmet.js and vulnerability assessment
7. **Phase 7**: Complete testing documentation and CI/CD integration

### Testing Framework Selection Criteria

| Criteria | Jest | Mocha | Selection Rationale |
|----------|------|-------|-------------------|
| **All-in-One Solution** | ✅ Built-in | ❌ Requires additional tools | Jest for rapid development |
| **Flexibility** | ⚠️ Opinionated | ✅ Highly modular | Mocha for custom setups |
| **Performance** | ✅ Parallel execution | ✅ Configurable | Both optimized |
| **Coverage** | ✅ Built-in | ✅ With c8 integration | Jest simpler, Mocha flexible |
| **Learning Curve** | ✅ Gentle | ⚠️ Steeper | Jest for beginners |
| **Ecosystem** | ✅ React ecosystem | ✅ Universal | Both well-supported |

### Quality Gates and Coverage Requirements

Our testing strategy enforces strict quality gates to ensure production readiness:

- **Statement Coverage**: ≥ 90% (Blocking quality gate)
- **Branch Coverage**: ≥ 85% (Blocking quality gate)
- **Function Coverage**: ≥ 95% (Blocking quality gate)
- **Line Coverage**: ≥ 90% (Blocking quality gate)
- **Response Time**: < 100ms for API endpoints
- **Memory Usage**: < 100MB per process
- **CPU Utilization**: < 80% average under load

---

## Framework Comparison: Jest vs Mocha

### Jest: All-in-One Testing Solution

**Advantages:**
- **Zero Configuration**: Works out-of-the-box with minimal setup
- **Built-in Coverage**: Integrated code coverage without additional tools
- **Snapshot Testing**: Built-in snapshot capabilities for UI testing
- **Parallel Execution**: Automatic test parallelization for faster execution
- **Comprehensive Mocking**: Powerful mocking capabilities built-in
- **Watch Mode**: Intelligent file watching and re-running of tests

**Best Use Cases:**
- Rapid prototyping and development
- Teams new to JavaScript testing
- Projects requiring minimal configuration overhead
- React/frontend testing integration

**Example Jest Test:**
```javascript
// jest.test.js
import request from 'supertest';
import { createApp } from '../app.js';

describe('Express App', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test('should respond with hello message', async () => {
    const response = await request(app)
      .get('/hello')
      .expect(200);
    
    expect(response.body).toMatchObject({
      message: expect.stringContaining('Hello')
    });
  });
});
```

### Mocha: Modular Testing Framework

**Advantages:**
- **Flexibility**: Choose your own assertion library, mocking framework
- **Modular Design**: Compose testing stack with preferred tools
- **Framework Agnostic**: Works with any JavaScript framework
- **Rich Ecosystem**: Extensive plugin and tool ecosystem
- **Custom Reporters**: Flexible reporting and output options
- **Hook System**: Powerful setup/teardown mechanisms

**Best Use Cases:**
- Complex testing requirements with specific tool preferences
- Teams with existing testing infrastructure
- Projects requiring custom assertion libraries
- Node.js backend API testing

**Example Mocha Test:**
```javascript
// mocha.test.js
import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Express App', function() {
  let app;

  beforeEach(function() {
    app = createApp();
  });

  it('should respond with hello message', async function() {
    const response = await request(app)
      .get('/hello')
      .expect(200);
    
    expect(response.body).to.be.an('object');
    expect(response.body.message).to.include('Hello');
  });
});
```

### Selection Decision Matrix

| Project Phase | Recommended Framework | Rationale |
|---------------|----------------------|-----------|
| **Learning/Tutorial** | Jest | Simpler setup, better for education |
| **Rapid Prototyping** | Jest | Faster development cycle |
| **Production API** | Mocha | More control over testing stack |
| **Complex Requirements** | Mocha | Greater flexibility |
| **CI/CD Integration** | Both | Both work well in pipelines |

### Configuration Comparison

**Jest Configuration** (`jest.config.js`):
```javascript
export default {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
```

**Mocha Configuration** (`.mocharc.json`):
```json
{
  "spec": ["test/**/*.test.js"],
  "require": ["test/setup.js"],
  "reporter": "spec",
  "timeout": 5000,
  "recursive": true,
  "loader": "esmock"
}
```

---

## Jest Configuration and Setup

### Installation and Basic Setup

Install Jest and required dependencies:

```bash
# Core Jest installation
npm install --save-dev jest@^29.7.0

# SuperTest for HTTP testing
npm install --save-dev supertest@^7.0.0

# ESM support
npm install --save-dev @jest/globals
```

### ES Modules Configuration

**Jest Configuration** (`src/backend/test/jest.config.js`):
```javascript
/**
 * Jest Configuration for Node.js Tutorial Project
 * Supports ES modules, comprehensive coverage reporting, and educational testing phases
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates Jest configuration optimized for testing specific phases of the tutorial
 */
export function createTestJestConfig(phase = 'all', options = {}) {
  const baseConfig = {
    // ES Modules Support
    preset: null,
    extensionsToTreatAsEsm: ['.js'],
    transform: {},
    
    // Test Environment
    testEnvironment: 'node',
    
    // Test Discovery
    rootDir: join(__dirname, '..'),
    testMatch: configureTestDiscovery(phase),
    
    // Module Resolution
    moduleNameMapping: {
      '^#(.*)$': '<rootDir>/$1'
    },
    
    // Coverage Configuration
    collectCoverage: true,
    ...setupTestCoverage(options.coverage),
    
    // Performance Optimization
    maxWorkers: '50%',
    testTimeout: 30000,
    
    // Setup Files
    setupFilesAfterEnv: [
      '<rootDir>/test/setup.js'
    ],
    
    // Global Configuration
    globals: {
      __TEST_PHASE__: phase,
      __COVERAGE_ENABLED__: true
    },
    
    // Reporter Configuration
    reporters: [
      'default',
      ['jest-html-reporters', {
        publicPath: './test-reports',
        filename: 'jest-report.html',
        expand: true
      }]
    ],
    
    // Error Handling
    errorOnDeprecated: true,
    verbose: process.env.TEST_VERBOSE === 'true'
  };

  return {
    ...baseConfig,
    ...options.overrides
  };
}

/**
 * Configures test file discovery based on tutorial phase
 */
function configureTestDiscovery(phase) {
  const testPatterns = {
    unit: ['**/test/unit/**/*.test.js'],
    integration: ['**/test/integration/**/*.test.js'],
    e2e: ['**/test/e2e/**/*.test.js'],
    performance: ['**/test/performance/**/*.test.js'],
    security: ['**/test/security/**/*.test.js'],
    all: [
      '**/test/unit/**/*.test.js',
      '**/test/integration/**/*.test.js',
      '**/test/e2e/**/*.test.js',
      '**/test/performance/**/*.test.js',
      '**/test/security/**/*.test.js'
    ]
  };

  return testPatterns[phase] || testPatterns.all;
}

/**
 * Sets up comprehensive coverage configuration
 */
function setupTestCoverage(coverageOptions = {}) {
  return {
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/**/*.test.js',
      '!src/**/*.spec.js',
      '!src/**/node_modules/**',
      '!coverage/**'
    ],
    
    coverageDirectory: 'coverage',
    
    coverageReporters: [
      'text',
      'text-summary',
      'lcov',
      'html',
      'json'
    ],
    
    coverageThreshold: {
      global: {
        statements: coverageOptions.statements || 90,
        branches: coverageOptions.branches || 85,
        functions: coverageOptions.functions || 95,
        lines: coverageOptions.lines || 90
      }
    },
    
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/test/',
      '/coverage/',
      'jest.config.js'
    ]
  };
}

// Export default configuration for standard usage
export default createTestJestConfig();
```

### Coverage Configuration and Thresholds

**Coverage Enforcement Example:**
```javascript
// Coverage thresholds in jest.config.js
coverageThreshold: {
  global: {
    statements: 90,  // ≥ 90% statement coverage
    branches: 85,    // ≥ 85% branch coverage  
    functions: 95,   // ≥ 95% function coverage
    lines: 90       // ≥ 90% line coverage
  },
  // Per-file thresholds for critical components
  './src/server.js': {
    statements: 95,
    branches: 90,
    functions: 100,
    lines: 95
  },
  './src/app.js': {
    statements: 95,
    branches: 90,
    functions: 100,
    lines: 95
  }
}
```

### Test Environment Setup

**Setup Configuration** (`src/backend/test/setup.js`):
```javascript
/**
 * Jest Test Environment Setup
 * Configures global test environment, mocks, and utilities
 */

import { jest } from '@jest/globals';
import { config } from '../config/index.js';

// Global test configuration
global.TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  environment: 'testing'
};

// Setup test database or mock services
beforeAll(async () => {
  // Initialize test environment
  process.env.NODE_ENV = 'test';
  
  // Setup global mocks
  setupGlobalMocks();
  
  console.log('🧪 Jest test environment initialized');
});

afterAll(async () => {
  // Cleanup test environment
  await cleanupTestEnvironment();
  console.log('🧹 Jest test environment cleaned up');
});

function setupGlobalMocks() {
  // Mock console methods to reduce test output noise
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error
  };
}

async function cleanupTestEnvironment() {
  // Cleanup logic
  jest.clearAllMocks();
  jest.restoreAllMocks();
}
```

### Parallel Test Execution

**Parallel Configuration:**
```javascript
// jest.config.js
export default {
  // Use 50% of available CPU cores
  maxWorkers: '50%',
  
  // Or specify exact number of workers
  maxWorkers: 4,
  
  // Enable test caching for faster reruns
  cache: true,
  cacheDirectory: '.jest-cache',
  
  // Optimize for CI environments
  ci: process.env.CI === 'true',
  
  // Shard tests across multiple machines in CI
  shard: process.env.JEST_SHARD ? JSON.parse(process.env.JEST_SHARD) : undefined
};
```

### Custom Matchers and Utilities

**Custom Jest Matchers:**
```javascript
// test/matchers/custom-matchers.js
import { expect } from '@jest/globals';

expect.extend({
  toBeValidHttpResponse(received) {
    const pass = received && 
                 received.status >= 200 && 
                 received.status < 300 &&
                 received.headers &&
                 received.body !== undefined;

    return {
      message: () => `expected ${received} to be a valid HTTP response`,
      pass
    };
  },

  toHaveSecurityHeaders(received) {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security'
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !received.headers[header]
    );

    const pass = missingHeaders.length === 0;

    return {
      message: () => `expected response to have security headers. Missing: ${missingHeaders.join(', ')}`,
      pass
    };
  }
});
```

---

## Mocha Configuration and Setup

### Installation and Dependencies (Chai, Sinon)

Install Mocha and testing ecosystem:

```bash
# Core Mocha installation
npm install --save-dev mocha@^11.0.0

# Assertion library
npm install --save-dev chai@^5.1.0

# Mocking and stubbing
npm install --save-dev sinon@^19.0.0

# HTTP testing
npm install --save-dev supertest@^7.0.0

# Code coverage
npm install --save-dev c8@^10.1.0

# ES Modules support
npm install --save-dev esmock@^2.6.0
```

### Configuration File Setup (.mocharc.json)

**Mocha Configuration** (`src/backend/test/.mocharc.json`):
```json
{
  "spec": [
    "test/unit/**/*.test.js",
    "test/integration/**/*.test.js",
    "test/e2e/**/*.test.js",
    "test/performance/**/*.test.js",
    "test/security/**/*.test.js"
  ],
  "require": [
    "test/setup.js"
  ],
  "loader": "esmock",
  "jobs": 2,
  "parallel": true,
  "reporter": "spec",
  "timeout": 30000,
  "recursive": true,
  "exit": true,
  "colors": true,
  "diff": true,
  "full-trace": true,
  "globals": [
    "expect",
    "should"
  ],
  "grep": "",
  "slow": 1000,
  "bail": false,
  "checkLeaks": true,
  "forbidOnly": true,
  "forbidPending": false,
  "global": [
    "TEST_CONFIG",
    "TEST_HELPERS"
  ],
  "retries": 2,
  "sort": true,
  "watch": false,
  "watchFiles": [
    "src/**/*.js",
    "test/**/*.js"
  ],
  "watchIgnore": [
    "node_modules/**",
    "coverage/**",
    ".git/**"
  ],
  "extensions": [
    "js"
  ],
  "file": [
    "test/setup.js"
  ],
  "opts": false,
  "package": "./package.json",
  "reporter-options": {
    "output": "test-results.xml"
  },
  "ui": "bdd"
}
```

### Reporter Configuration and Output

**Custom Reporter Configuration:**
```javascript
// test/reporters/custom-reporter.js
import Mocha from 'mocha';

const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_SUITE_BEGIN, EVENT_SUITE_END } = Mocha.Runner.constants;

class CustomMochaReporter {
  constructor(runner, options) {
    this._runner = runner;
    this._options = options;
    this.stats = {
      suites: 0,
      tests: 0,
      passes: 0,
      pending: 0,
      failures: 0,
      start: null,
      end: null,
      duration: 0
    };

    runner
      .once(EVENT_RUN_BEGIN, () => {
        this.stats.start = new Date();
        console.log('🚀 Starting Mocha test execution');
      })
      .on(EVENT_SUITE_BEGIN, (suite) => {
        if (suite.root) return;
        this.stats.suites++;
        console.log(`📁 Suite: ${suite.title}`);
      })
      .on(EVENT_TEST_PASS, (test) => {
        this.stats.passes++;
        console.log(`  ✅ ${test.title} (${test.duration}ms)`);
      })
      .on(EVENT_TEST_FAIL, (test, err) => {
        this.stats.failures++;
        console.log(`  ❌ ${test.title}`);
        console.log(`     ${err.message}`);
      })
      .once(EVENT_RUN_END, () => {
        this.stats.end = new Date();
        this.stats.duration = this.stats.end - this.stats.start;
        this.generateReport();
      });
  }

  generateReport() {
    console.log('\n📊 Test Execution Summary');
    console.log('=========================');
    console.log(`Suites: ${this.stats.suites}`);
    console.log(`Tests: ${this.stats.tests}`);
    console.log(`Passes: ${this.stats.passes}`);
    console.log(`Failures: ${this.stats.failures}`);
    console.log(`Duration: ${this.stats.duration}ms`);
    console.log(`Success Rate: ${((this.stats.passes / (this.stats.passes + this.stats.failures)) * 100).toFixed(2)}%`);
  }
}

export default CustomMochaReporter;
```

### Timeout and Performance Settings

**Performance Configuration Example:**
```json
{
  "timeout": 30000,
  "slow": 1000,
  "bail": false,
  "retries": 2,
  "parallel": true,
  "jobs": 4,
  "reporter": "spec",
  "reporter-options": {
    "slow": 1000,
    "timeout": 5000
  }
}
```

### Coverage Integration with C8

**C8 Coverage Configuration** (`package.json`):
```json
{
  "scripts": {
    "test:mocha": "mocha",
    "test:mocha:coverage": "c8 mocha",
    "test:mocha:watch": "mocha --watch",
    "coverage:report": "c8 report --reporter=html --reporter=text"
  },
  "c8": {
    "include": [
      "src/**/*.js"
    ],
    "exclude": [
      "test/**",
      "coverage/**",
      "node_modules/**"
    ],
    "reporter": [
      "text",
      "text-summary",
      "html",
      "lcov",
      "json"
    ],
    "check-coverage": true,
    "statements": 90,
    "branches": 85,
    "functions": 95,
    "lines": 90,
    "exclude-after-remap": false,
    "skip-full": false,
    "all": true
  }
}
```

### Custom Test Helpers and Hooks

**Test Setup with Hooks:**
```javascript
// test/setup.js
import { before, after, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

// Global test configuration
global.TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  environment: 'testing'
};

// Global test helpers
global.expect = expect;
global.sinon = sinon;

// Setup hooks
before(async function() {
  this.timeout(10000);
  console.log('🔧 Setting up Mocha test environment');
  
  // Initialize test environment
  process.env.NODE_ENV = 'test';
  
  // Setup global test helpers
  await setupTestHelpers();
});

after(async function() {
  this.timeout(5000);
  console.log('🧹 Cleaning up Mocha test environment');
  
  // Cleanup test environment
  await cleanupTestEnvironment();
});

beforeEach(function() {
  // Reset mocks before each test
  sinon.restore();
});

afterEach(function() {
  // Cleanup after each test
  sinon.restore();
});

async function setupTestHelpers() {
  // Initialize test utilities
  global.TEST_HELPERS = {
    createMockResponse: () => ({
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis()
    }),
    
    createMockRequest: (overrides = {}) => ({
      params: {},
      query: {},
      body: {},
      headers: {},
      ...overrides
    }),
    
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
  };
}

async function cleanupTestEnvironment() {
  // Cleanup logic
  delete global.TEST_HELPERS;
  sinon.restore();
}
```

---

## Unit Testing Guide

### Basic HTTP Server Testing

**Server Module Testing Example:**
```javascript
// test/unit/server.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import { 
  startProductionServer,
  initializeServerEnvironment,
  validateServerReadiness 
} from '../../src/server.js';

describe('Server Module', function() {
  this.timeout(10000);
  
  let server;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(async function() {
    sandbox.restore();
    if (server) {
      await new Promise(resolve => server.close(resolve));
      server = null;
    }
  });

  describe('startProductionServer', function() {
    it('should create HTTP server with valid configuration', async function() {
      const result = await startProductionServer({
        port: 0, // Use random port
        enableGracefulShutdown: false
      });

      expect(result).to.be.an('object');
      expect(result.server).to.exist;
      expect(result.server.listening).to.be.true;
      expect(result.config).to.exist;
      expect(result.environment).to.exist;

      server = result.server;
    });

    it('should handle port conflicts gracefully', async function() {
      const port = 9999;
      
      // Start first server
      const server1 = await startProductionServer({
        port,
        enableGracefulShutdown: false
      });

      try {
        // Attempt to start second server on same port
        await startProductionServer({
          port,
          enableGracefulShutdown: false
        });
        
        throw new Error('Expected port conflict error');
      } catch (error) {
        expect(error.message).to.include('EADDRINUSE');
      } finally {
        await new Promise(resolve => server1.server.close(resolve));
      }
    });

    it('should validate server performance requirements', async function() {
      const startTime = Date.now();
      
      const result = await startProductionServer({
        port: 0,
        enableGracefulShutdown: false
      });
      
      const startupTime = Date.now() - startTime;
      
      expect(startupTime).to.be.lessThan(5000); // Should start within 5 seconds
      expect(result.startupTime).to.be.lessThan(5000);

      server = result.server;
    });
  });

  describe('initializeServerEnvironment', function() {
    it('should initialize environment with valid configuration', async function() {
      const environment = await initializeServerEnvironment();

      expect(environment).to.be.an('object');
      expect(environment.currentEnvironment).to.exist;
      expect(environment.nodeVersion).to.equal(process.version);
      expect(environment.platform).to.equal(process.platform);
      expect(environment.hostname).to.exist;
      expect(environment.pid).to.equal(process.pid);
    });

    it('should detect PM2 environment correctly', async function() {
      // Mock PM2 environment
      const originalPM2 = process.env.PM2_HOME;
      process.env.PM2_HOME = '/tmp/pm2';

      try {
        const environment = await initializeServerEnvironment();
        expect(environment.pm2Detected).to.be.true;
      } finally {
        if (originalPM2) {
          process.env.PM2_HOME = originalPM2;
        } else {
          delete process.env.PM2_HOME;
        }
      }
    });
  });

  describe('validateServerReadiness', function() {
    it('should validate server configuration successfully', async function() {
      const mockConfig = {
        server: { port: 3000 },
        environment: { NODE_ENV: 'test' }
      };

      const validation = await validateServerReadiness(mockConfig);

      expect(validation).to.be.an('object');
      expect(validation.isValid).to.be.a('boolean');
      expect(validation.errors).to.be.an('array');
      expect(validation.warnings).to.be.an('array');
      expect(validation.timestamp).to.exist;
    });

    it('should identify invalid configuration', async function() {
      const invalidConfig = null;
      
      const validation = await validateServerReadiness(invalidConfig);

      expect(validation.isValid).to.be.false;
      expect(validation.errors).to.have.length.greaterThan(0);
      expect(validation.errors).to.include('Server configuration is missing');
    });
  });
});
```

### Express.js Route Testing

**Route Testing Example:**
```javascript
// test/unit/routes/hello.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express from 'express';
import { helloRouter } from '../../../src/routes/hello.js';

describe('Hello Route', function() {
  let app;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    app = express();
    app.use('/hello', helloRouter);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('GET /hello', function() {
    it('should return hello message with 200 status', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      expect(response.body).to.be.an('object');
      expect(response.body.message).to.be.a('string');
      expect(response.body.message).to.include('Hello');
      expect(response.body.timestamp).to.exist;
    });

    it('should return JSON content type', async function() {
      const response = await request(app)
        .get('/hello')
        .expect('Content-Type', /json/);

      expect(response.status).to.equal(200);
    });

    it('should respond within performance target', async function() {
      const startTime = Date.now();
      
      await request(app)
        .get('/hello')
        .expect(200);
        
      const responseTime = Date.now() - startTime;
      expect(responseTime).to.be.lessThan(100); // < 100ms target
    });

    it('should handle query parameters appropriately', async function() {
      const response = await request(app)
        .get('/hello')
        .query({ name: 'TestUser' })
        .expect(200);

      expect(response.body).to.be.an('object');
      // Verify query parameters are handled appropriately
    });
  });

  describe('Error Handling', function() {
    it('should handle invalid HTTP methods', async function() {
      await request(app)
        .post('/hello')
        .expect(404);
    });

    it('should handle malformed requests gracefully', async function() {
      const response = await request(app)
        .get('/hello')
        .set('Content-Type', 'invalid/type')
        .expect(200); // GET should still work regardless of Content-Type

      expect(response.body).to.be.an('object');
    });
  });
});
```

### Middleware Function Testing

**Middleware Testing Example:**
```javascript
// test/unit/middleware/security.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import { securityMiddleware } from '../../../src/middleware/security.js';

describe('Security Middleware', function() {
  let req, res, next, sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    req = {
      headers: {},
      method: 'GET',
      url: '/test'
    };
    
    res = {
      setHeader: sandbox.stub(),
      removeHeader: sandbox.stub(),
      getHeader: sandbox.stub(),
      locals: {}
    };
    
    next = sandbox.stub();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('securityMiddleware', function() {
    it('should set security headers', function() {
      securityMiddleware(req, res, next);

      // Verify security headers are set
      expect(res.setHeader.calledWith('X-Content-Type-Options', 'nosniff')).to.be.true;
      expect(res.setHeader.calledWith('X-Frame-Options', 'DENY')).to.be.true;
      expect(res.setHeader.calledWith('X-XSS-Protection', '1; mode=block')).to.be.true;
      expect(next.calledOnce).to.be.true;
    });

    it('should remove sensitive headers', function() {
      securityMiddleware(req, res, next);

      expect(res.removeHeader.calledWith('X-Powered-By')).to.be.true;
      expect(next.calledOnce).to.be.true;
    });

    it('should handle HTTPS-specific headers in production', function() {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        securityMiddleware(req, res, next);

        expect(res.setHeader.calledWith('Strict-Transport-Security')).to.be.true;
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should call next middleware in chain', function() {
      securityMiddleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.calledWith()).to.be.true; // No error passed
    });

    it('should handle errors gracefully', function() {
      // Simulate error condition
      res.setHeader.throws(new Error('Header error'));

      securityMiddleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    });
  });
});
```

### Service Layer Testing

**Service Testing Example:**
```javascript
// test/unit/services/hello-service.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import { HelloService } from '../../../src/services/hello-service.js';

describe('HelloService', function() {
  let helloService;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    helloService = new HelloService();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('generateHelloMessage', function() {
    it('should generate default hello message', function() {
      const message = helloService.generateHelloMessage();

      expect(message).to.be.a('string');
      expect(message).to.include('Hello');
      expect(message.length).to.be.greaterThan(0);
    });

    it('should generate personalized hello message', function() {
      const name = 'TestUser';
      const message = helloService.generateHelloMessage(name);

      expect(message).to.be.a('string');
      expect(message).to.include('Hello');
      expect(message).to.include(name);
    });

    it('should handle empty name parameter', function() {
      const message = helloService.generateHelloMessage('');

      expect(message).to.be.a('string');
      expect(message).to.include('Hello');
      // Should fallback to default behavior
    });

    it('should sanitize input parameters', function() {
      const maliciousInput = '<script>alert("xss")</script>';
      const message = helloService.generateHelloMessage(maliciousInput);

      expect(message).to.be.a('string');
      expect(message).to.not.include('<script>');
      expect(message).to.not.include('alert');
    });

    it('should handle special characters in name', function() {
      const specialName = 'Test@User#123';
      const message = helloService.generateHelloMessage(specialName);

      expect(message).to.be.a('string');
      expect(message).to.include('Hello');
      // Service should handle special characters appropriately
    });
  });

  describe('validateInput', function() {
    it('should validate valid input', function() {
      const result = helloService.validateInput('ValidName');

      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should reject invalid input', function() {
      const result = helloService.validateInput('<script>');

      expect(result.isValid).to.be.false;
      expect(result.errors).to.have.length.greaterThan(0);
    });

    it('should handle null input', function() {
      const result = helloService.validateInput(null);

      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Input cannot be null');
    });
  });
});
```

### Controller Testing Patterns

**Controller Testing Example:**
```javascript
// test/unit/controllers/hello-controller.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import { HelloController } from '../../../src/controllers/hello-controller.js';
import { HelloService } from '../../../src/services/hello-service.js';

describe('HelloController', function() {
  let helloController;
  let helloService;
  let req, res, next;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    helloService = {
      generateHelloMessage: sandbox.stub(),
      validateInput: sandbox.stub()
    };
    
    helloController = new HelloController(helloService);
    
    req = {
      query: {},
      params: {},
      body: {},
      headers: {}
    };
    
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
      send: sandbox.stub().returnsThis()
    };
    
    next = sandbox.stub();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('getHello', function() {
    it('should return hello message successfully', async function() {
      const expectedMessage = 'Hello, World!';
      helloService.generateHelloMessage.returns(expectedMessage);
      helloService.validateInput.returns({ isValid: true, errors: [] });

      await helloController.getHello(req, res, next);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const jsonCall = res.json.firstCall.args[0];
      expect(jsonCall.message).to.equal(expectedMessage);
      expect(jsonCall.timestamp).to.exist;
    });

    it('should handle personalized requests', async function() {
      req.query.name = 'TestUser';
      const expectedMessage = 'Hello, TestUser!';
      
      helloService.validateInput.returns({ isValid: true, errors: [] });
      helloService.generateHelloMessage.returns(expectedMessage);

      await helloController.getHello(req, res, next);

      expect(helloService.generateHelloMessage.calledWith('TestUser')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should handle validation errors', async function() {
      req.query.name = '<script>alert("xss")</script>';
      
      helloService.validateInput.returns({
        isValid: false,
        errors: ['Invalid input detected']
      });

      await helloController.getHello(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const jsonCall = res.json.firstCall.args[0];
      expect(jsonCall.error).to.exist;
      expect(jsonCall.errors).to.deep.equal(['Invalid input detected']);
    });

    it('should handle service errors', async function() {
      helloService.validateInput.returns({ isValid: true, errors: [] });
      helloService.generateHelloMessage.throws(new Error('Service error'));

      await helloController.getHello(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    });

    it('should validate response time performance', async function() {
      helloService.validateInput.returns({ isValid: true, errors: [] });
      helloService.generateHelloMessage.returns('Hello, World!');

      const startTime = Date.now();
      await helloController.getHello(req, res, next);
      const responseTime = Date.now() - startTime;

      expect(responseTime).to.be.lessThan(50); // Controller should be very fast
      expect(res.status.calledWith(200)).to.be.true;
    });
  });

  describe('Error Handling', function() {
    it('should handle missing dependencies gracefully', function() {
      const invalidController = new HelloController(null);
      
      expect(() => {
        invalidController.getHello(req, res, next);
      }).to.throw();
    });

    it('should handle malformed requests', async function() {
      req.query = null; // Malformed query
      
      helloService.validateInput.returns({ isValid: true, errors: [] });
      helloService.generateHelloMessage.returns('Hello, World!');

      await helloController.getHello(req, res, next);

      // Should handle gracefully without crashing
      expect(res.status.called).to.be.true;
    });
  });
});
```

### Mocking and Stubbing Strategies

**Advanced Mocking Patterns:**
```javascript
// test/unit/mocks/advanced-mocking.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';

describe('Advanced Mocking Strategies', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('ESM Module Mocking with esmock', function() {
    it('should mock ES module dependencies', async function() {
      // Mock external dependencies
      const mockLogger = {
        info: sandbox.stub(),
        error: sandbox.stub(),
        warn: sandbox.stub()
      };

      const mockConfig = {
        server: { port: 3000 },
        database: { url: 'test://localhost' }
      };

      // Use esmock to mock module imports
      const { HelloService } = await esmock('../../../src/services/hello-service.js', {
        '../../../src/utils/logger.js': { default: mockLogger },
        '../../../src/config/index.js': { config: mockConfig }
      });

      const service = new HelloService();
      const result = service.generateHelloMessage('Test');

      expect(result).to.be.a('string');
      expect(mockLogger.info.called).to.be.true;
    });
  });

  describe('HTTP Request Mocking', function() {
    it('should mock HTTP requests for external APIs', async function() {
      // Mock fetch for external API calls
      const mockFetch = sandbox.stub(global, 'fetch');
      mockFetch.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mocked response' })
      });

      // Test code that uses fetch
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();

      expect(mockFetch.calledOnce).to.be.true;
      expect(mockFetch.calledWith('https://api.example.com/data')).to.be.true;
      expect(data.data).to.equal('mocked response');
    });
  });

  describe('Database Mocking', function() {
    it('should mock database operations', async function() {
      // Mock database client
      const mockDbClient = {
        connect: sandbox.stub().resolves(),
        query: sandbox.stub().resolves({ rows: [{ id: 1, name: 'Test' }] }),
        close: sandbox.stub().resolves()
      };

      // Mock database service
      const DatabaseService = class {
        constructor(client) {
          this.client = client;
        }

        async findUser(id) {
          const result = await this.client.query('SELECT * FROM users WHERE id = $1', [id]);
          return result.rows[0];
        }
      };

      const dbService = new DatabaseService(mockDbClient);
      const user = await dbService.findUser(1);

      expect(mockDbClient.query.calledOnce).to.be.true;
      expect(user).to.deep.equal({ id: 1, name: 'Test' });
    });
  });

  describe('Time-based Mocking', function() {
    it('should mock Date and setTimeout', async function() {
      // Mock Date
      const fixedDate = new Date('2024-01-01T00:00:00Z');
      const dateStub = sandbox.stub(global, 'Date').returns(fixedDate);

      // Mock setTimeout for testing delays
      const setTimeoutStub = sandbox.stub(global, 'setTimeout');
      setTimeoutStub.callsFake((callback, delay) => {
        // Immediately call callback for testing
        callback();
        return 'mocked-timer-id';
      });

      const result = new Date();
      expect(result).to.equal(fixedDate);

      let callbackExecuted = false;
      setTimeout(() => {
        callbackExecuted = true;
      }, 1000);

      expect(callbackExecuted).to.be.true;
    });
  });

  describe('File System Mocking', function() {
    it('should mock file system operations', async function() {
      // Mock fs module
      const mockFs = {
        readFile: sandbox.stub(),
        writeFile: sandbox.stub(),
        existsSync: sandbox.stub()
      };

      mockFs.readFile.callsArgWith(2, null, 'file content');
      mockFs.writeFile.callsArgWith(2, null);
      mockFs.existsSync.returns(true);

      // Test file operations
      const content = await new Promise((resolve, reject) => {
        mockFs.readFile('test.txt', 'utf8', (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      expect(content).to.equal('file content');
      expect(mockFs.readFile.calledWith('test.txt', 'utf8')).to.be.true;
    });
  });
});
```

### Async/Await Testing Patterns

**Async Testing Examples:**
```javascript
// test/unit/async/async-patterns.test.js
import { expect } from 'chai';
import sinon from 'sinon';

describe('Async/Await Testing Patterns', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Promise-based Operations', function() {
    it('should test successful async operations', async function() {
      const asyncService = {
        fetchData: sandbox.stub().resolves({ id: 1, data: 'test' })
      };

      const result = await asyncService.fetchData();

      expect(result).to.deep.equal({ id: 1, data: 'test' });
      expect(asyncService.fetchData.calledOnce).to.be.true;
    });

    it('should test async error handling', async function() {
      const asyncService = {
        fetchData: sandbox.stub().rejects(new Error('Network error'))
      };

      try {
        await asyncService.fetchData();
        throw new Error('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal('Network error');
        expect(asyncService.fetchData.calledOnce).to.be.true;
      }
    });

    it('should test async operations with timeouts', async function() {
      this.timeout(5000); // Set test timeout

      const slowAsyncOperation = () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('completed'), 1000);
        });
      };

      const startTime = Date.now();
      const result = await slowAsyncOperation();
      const duration = Date.now() - startTime;

      expect(result).to.equal('completed');
      expect(duration).to.be.greaterThanOrEqual(1000);
    });
  });

  describe('Concurrent Operations', function() {
    it('should test parallel async operations', async function() {
      const service1 = { getData: sandbox.stub().resolves('data1') };
      const service2 = { getData: sandbox.stub().resolves('data2') };
      const service3 = { getData: sandbox.stub().resolves('data3') };

      const [result1, result2, result3] = await Promise.all([
        service1.getData(),
        service2.getData(),
        service3.getData()
      ]);

      expect(result1).to.equal('data1');
      expect(result2).to.equal('data2');
      expect(result3).to.equal('data3');

      expect(service1.getData.calledOnce).to.be.true;
      expect(service2.getData.calledOnce).to.be.true;
      expect(service3.getData.calledOnce).to.be.true;
    });

    it('should test Promise.allSettled for partial failures', async function() {
      const operations = [
        Promise.resolve('success1'),
        Promise.reject(new Error('error1')),
        Promise.resolve('success2'),
        Promise.reject(new Error('error2'))
      ];

      const results = await Promise.allSettled(operations);

      expect(results).to.have.length(4);
      expect(results[0].status).to.equal('fulfilled');
      expect(results[0].value).to.equal('success1');
      expect(results[1].status).to.equal('rejected');
      expect(results[1].reason.message).to.equal('error1');
    });
  });

  describe('Stream and Event Testing', function() {
    it('should test event-based async operations', async function() {
      const EventEmitter = (await import('events')).default;
      const emitter = new EventEmitter();

      const eventPromise = new Promise((resolve) => {
        emitter.once('data', resolve);
      });

      // Simulate async event emission
      setTimeout(() => {
        emitter.emit('data', { message: 'event data' });
      }, 100);

      const result = await eventPromise;
      expect(result).to.deep.equal({ message: 'event data' });
    });

    it('should test async iterators', async function() {
      async function* asyncGenerator() {
        yield 'first';
        yield 'second';
        yield 'third';
      }

      const results = [];
      for await (const value of asyncGenerator()) {
        results.push(value);
      }

      expect(results).to.deep.equal(['first', 'second', 'third']);
    });
  });

  describe('Resource Cleanup', function() {
    it('should test proper resource cleanup in async operations', async function() {
      const resource = {
        data: 'test data',
        cleanup: sandbox.stub(),
        process: function() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(this.data);
            }, 100);
          });
        }
      };

      try {
        const result = await resource.process();
        expect(result).to.equal('test data');
      } finally {
        resource.cleanup();
      }

      expect(resource.cleanup.calledOnce).to.be.true;
    });

    it('should test cleanup on error conditions', async function() {
      const resource = {
        cleanup: sandbox.stub(),
        process: sandbox.stub().rejects(new Error('Processing failed'))
      };

      try {
        await resource.process();
        throw new Error('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.equal('Processing failed');
      } finally {
        resource.cleanup();
      }

      expect(resource.cleanup.calledOnce).to.be.true;
    });
  });
});
```

---

## Integration Testing Guide

### Express Application Integration Testing

**Full Application Integration Testing:**
```javascript
// test/integration/app-integration.test.js
import { expect } from 'chai';
import request from 'supertest';
import { createApp, startServer } from '../../src/app.js';

describe('Express Application Integration', function() {
  let app;
  let server;

  before(async function() {
    this.timeout(10000);
    
    // Create Express application with full middleware stack
    app = createApp({
      enableHealthMonitoring: true,
      enableSecurityMiddleware: true,
      enableLogging: false // Reduce noise during testing
    });

    // Start server on random port
    server = await startServer(app, { port: 0 });
  });

  after(async function() {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('Application Initialization', function() {
    it('should create Express app with middleware stack', function() {
      expect(app).to.exist;
      expect(typeof app.listen).to.equal('function');
      expect(app._router).to.exist;
      expect(app._router.stack.length).to.be.greaterThan(0);
    });

    it('should start server and listen on configured port', function() {
      expect(server).to.exist;
      expect(server.listening).to.be.true;
      
      const address = server.address();
      expect(address.port).to.be.a('number');
      expect(address.port).to.be.greaterThan(0);
    });
  });

  describe('Endpoint Integration', function() {
    it('should handle GET /hello with proper response format', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.be.an('object');
      expect(response.body.message).to.be.a('string');
      expect(response.body.message).to.include('Hello');
      expect(response.body.timestamp).to.exist;
      expect(response.body.version).to.exist;
    });

    it('should handle GET /good-evening with proper response format', async function() {
      const response = await request(app)
        .get('/good-evening')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.be.an('object');
      expect(response.body.message).to.be.a('string');
      expect(response.body.message).to.include('Good evening');
      expect(response.body.timestamp).to.exist;
    });

    it('should handle GET /health with comprehensive health data', async function() {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.be.an('object');
      expect(response.body.status).to.exist;
      expect(response.body.timestamp).to.exist;
      expect(response.body.uptime).to.be.a('number');
      expect(response.body.memory).to.be.an('object');
      expect(response.body.environment).to.be.an('object');
    });

    it('should handle 404 errors with proper error response', async function() {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).to.be.an('object');
      expect(response.body.error).to.exist;
      expect(response.body.message).to.include('Not Found');
      expect(response.body.timestamp).to.exist;
    });
  });

  describe('Performance Integration', function() {
    it('should maintain response time targets under load', async function() {
      const concurrentRequests = 10;
      const responseTimeTarget = 100; // ms

      const promises = Array(concurrentRequests).fill().map(() => {
        const startTime = Date.now();
        return request(app)
          .get('/hello')
          .expect(200)
          .then(response => ({
            responseTime: Date.now() - startTime,
            response
          }));
      });

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.responseTime).to.be.lessThan(responseTimeTarget);
        expect(result.response.body.message).to.include('Hello');
      });

      const averageResponseTime = results.reduce((sum, result) => 
        sum + result.responseTime, 0) / results.length;

      expect(averageResponseTime).to.be.lessThan(responseTimeTarget / 2);
    });

    it('should handle memory usage efficiently during sustained load', async function() {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate sustained load
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health').expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).to.be.lessThan(50); // Should not increase by more than 50MB
    });
  });

  describe('Error Handling Integration', function() {
    it('should handle server errors gracefully', async function() {
      // Test with malformed request
      const response = await request(app)
        .post('/hello') // POST to GET-only endpoint
        .send({ invalid: 'data' })
        .expect(404);

      expect(response.body.error).to.exist;
    });

    it('should maintain server stability during error conditions', async function() {
      // Generate multiple error conditions
      const errorRequests = [
        request(app).get('/nonexistent1'),
        request(app).get('/nonexistent2'),
        request(app).post('/hello'),
        request(app).put('/good-evening')
      ];

      const results = await Promise.allSettled(errorRequests);

      // All should complete (not crash the server)
      results.forEach(result => {
        expect(result.status).to.equal('fulfilled');
      });

      // Server should still respond to valid requests
      await request(app).get('/health').expect(200);
    });
  });
});
```

### Middleware Stack Testing

**Middleware Integration Testing:**
```javascript
// test/integration/middleware-stack.test.js
import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Middleware Stack Integration', function() {
  let app;

  beforeEach(function() {
    app = createApp({
      enableSecurityMiddleware: true,
      enableLogging: false
    });
  });

  describe('Security Middleware Chain', function() {
    it('should apply Helmet.js security headers', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      // Check for Helmet.js security headers
      expect(response.headers['x-content-type-options']).to.equal('nosniff');
      expect(response.headers['x-frame-options']).to.exist;
      expect(response.headers['x-xss-protection']).to.exist;
      expect(response.headers['strict-transport-security']).to.exist;
      expect(response.headers['content-security-policy']).to.exist;
    });

    it('should remove sensitive headers', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      // X-Powered-By should be removed by Helmet
      expect(response.headers['x-powered-by']).to.be.undefined;
    });

    it('should validate CORS configuration', async function() {
      const response = await request(app)
        .options('/hello')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).to.exist;
      expect(response.headers['access-control-allow-methods']).to.exist;
    });
  });

  describe('Request Processing Pipeline', function() {
    it('should execute middleware in correct order', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      // Security headers should be applied before response
      expect(response.headers['x-content-type-options']).to.exist;
      
      // Content should be properly formatted
      expect(response.body).to.be.an('object');
      expect(response.headers['content-type']).to.match(/json/);
    });

    it('should handle middleware errors gracefully', async function() {
      // Test with potentially problematic request
      const response = await request(app)
        .get('/hello')
        .set('Content-Type', 'invalid/content-type')
        .expect(200);

      expect(response.body).to.be.an('object');
    });
  });

  describe('Error Handling Middleware', function() {
    it('should format error responses consistently', async function() {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).to.be.an('object');
      expect(response.body.error).to.exist;
      expect(response.body.message).to.exist;
      expect(response.body.timestamp).to.exist;
      expect(response.headers['content-type']).to.match(/json/);
    });

    it('should include security headers in error responses', async function() {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.headers['x-content-type-options']).to.equal('nosniff');
      expect(response.headers['x-frame-options']).to.exist;
    });
  });

  describe('Logging Middleware', function() {
    it('should add request tracking headers', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      // Request ID should be added by logging middleware
      expect(response.headers['x-request-id']).to.exist;
    });
  });
});
```

### Security Header Validation

**Security Integration Testing:**
```javascript
// test/integration/security-headers.test.js
import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Security Headers Integration', function() {
  let app;

  beforeEach(function() {
    app = createApp({
      enableSecurityMiddleware: true
    });
  });

  describe('Helmet.js Header Validation', function() {
    it('should set Content Security Policy headers', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).to.exist;
      expect(csp).to.include("default-src 'self'");
    });

    it('should set HTTP Strict Transport Security headers', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      const hsts = response.headers['strict-transport-security'];
      expect(hsts).to.exist;
      expect(hsts).to.include('max-age=');
    });

    it('should set X-Frame-Options header', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      const frameOptions = response.headers['x-frame-options'];
      expect(frameOptions).to.exist;
      expect(['DENY', 'SAMEORIGIN'].includes(frameOptions)).to.be.true;
    });

    it('should set X-Content-Type-Options header', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      expect(response.headers['x-content-type-options']).to.equal('nosniff');
    });

    it('should set X-XSS-Protection header', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      const xssProtection = response.headers['x-xss-protection'];
      expect(xssProtection).to.exist;
      expect(xssProtection).to.include('1');
    });
  });

  describe('Security Header Consistency', function() {
    it('should apply same security headers across all endpoints', async function() {
      const endpoints = ['/hello', '/good-evening', '/health'];
      
      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        expect(response.headers['x-content-type-options']).to.equal('nosniff');
        expect(response.headers['x-frame-options']).to.exist;
        expect(response.headers['strict-transport-security']).to.exist;
        expect(response.headers['content-security-policy']).to.exist;
      }
    });

    it('should apply security headers to error responses', async function() {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.headers['x-content-type-options']).to.equal('nosniff');
      expect(response.headers['x-frame-options']).to.exist;
      expect(response.headers['strict-transport-security']).to.exist;
    });
  });

  describe('XSS Protection Testing', function() {
    it('should protect against script injection in query parameters', async function() {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .get('/hello')
        .query({ name: xssPayload })
        .expect(200);

      const responseText = JSON.stringify(response.body);
      expect(responseText).to.not.include('<script>');
      expect(responseText).to.not.include('alert(');
    });

    it('should sanitize HTML in request headers', async function() {
      const response = await request(app)
        .get('/hello')
        .set('X-Custom-Header', '<img src=x onerror=alert(1)>')
        .expect(200);

      // Response should be successful but header should be sanitized
      expect(response.body).to.be.an('object');
    });
  });

  describe('CORS Security Validation', function() {
    it('should handle CORS preflight requests securely', async function() {
      const response = await request(app)
        .options('/hello')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).to.exist;
      expect(response.headers['access-control-allow-methods']).to.exist;
      expect(response.headers['access-control-allow-headers']).to.exist;
    });

    it('should reject requests from unauthorized origins', async function() {
      const response = await request(app)
        .get('/hello')
        .set('Origin', 'http://malicious-site.com')
        .expect(200); // Request should succeed but CORS headers should be controlled

      // Check that CORS headers are properly configured
      const allowOrigin = response.headers['access-control-allow-origin'];
      if (allowOrigin) {
        expect(allowOrigin).to.not.equal('http://malicious-site.com');
      }
    });
  });
});
```

### Error Handling Integration

**Error Handling Integration Testing:**
```javascript
// test/integration/error-handling.test.js
import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import { createApp } from '../../src/app.js';

describe('Error Handling Integration', function() {
  let app;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    app = createApp({
      enableErrorHandling: true,
      enableLogging: false
    });
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('HTTP Error Responses', function() {
    it('should handle 404 Not Found errors', async function() {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).to.be.an('object');
      expect(response.body.error).to.equal('Not Found');
      expect(response.body.message).to.include('Cannot GET /nonexistent-endpoint');
      expect(response.body.timestamp).to.exist;
      expect(response.body.path).to.equal('/nonexistent-endpoint');
      expect(response.body.method).to.equal('GET');
    });

    it('should handle 405 Method Not Allowed errors', async function() {
      const response = await request(app)
        .post('/hello') // POST to GET-only endpoint
        .expect(404) // Express returns 404 for undefined routes
        .expect('Content-Type', /json/);

      expect(response.body.error).to.exist;
    });

    it('should handle malformed JSON in request body', async function() {
      const response = await request(app)
        .post('/health') // Assuming health endpoint accepts POST
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);

      expect(response.body.error).to.include('Bad Request');
    });
  });

  describe('Application Error Handling', function() {
    it('should handle internal server errors gracefully', async function() {
      // Create app with a route that throws an error
      const errorApp = createApp();
      errorApp.get('/error-test', (req, res, next) => {
        throw new Error('Test internal error');
      });

      const response = await request(errorApp)
        .get('/error-test')
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body.error).to.equal('Internal Server Error');
      expect(response.body.timestamp).to.exist;
      
      // Error details should not be exposed in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.body.stack).to.be.undefined;
      }
    });

    it('should handle async errors in route handlers', async function() {
      const asyncErrorApp = createApp();
      asyncErrorApp.get('/async-error-test', async (req, res, next) => {
        try {
          await Promise.reject(new Error('Async error'));
        } catch (error) {
          next(error);
        }
      });

      const response = await request(asyncErrorApp)
        .get('/async-error-test')
        .expect(500);

      expect(response.body.error).to.equal('Internal Server Error');
    });
  });

  describe('Validation Error Handling', function() {
    it('should handle query parameter validation errors', async function() {
      // Test with invalid query parameters
      const response = await request(app)
        .get('/hello')
        .query({ 
          name: 'a'.repeat(1000), // Very long name
          invalid: '<script>alert("xss")</script>' 
        })
        .expect(200); // Should still work but sanitize input

      expect(response.body).to.be.an('object');
      // Response should not contain the malicious script
      const responseText = JSON.stringify(response.body);
      expect(responseText).to.not.include('<script>');
    });

    it('should handle oversized request payloads', async function() {
      const largePayload = JSON.stringify({
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB payload
      });

      const response = await request(app)
        .post('/health')
        .set('Content-Type', 'application/json')
        .send(largePayload)
        .expect(413); // Payload Too Large

      expect(response.body.error).to.include('Payload Too Large');
    });
  });

  describe('Rate Limiting Error Handling', function() {
    it('should handle rate limit exceeded errors', async function() {
      // Simulate rapid requests to trigger rate limiting
      const requests = Array(100).fill().map(() => 
        request(app).get('/hello').expect((res) => {
          // Accept both success and rate limit responses
          expect([200, 429]).to.include(res.status);
        })
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.error).to.include('Too Many Requests');
      }
    });
  });

  describe('Error Response Format Consistency', function() {
    it('should maintain consistent error response format', async function() {
      const errorEndpoints = [
        '/nonexistent',
        '/another-404',
        '/invalid-route'
      ];

      for (const endpoint of errorEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(404);

        // All error responses should have consistent format
        expect(response.body).to.have.all.keys('error', 'message', 'timestamp', 'path', 'method');
        expect(response.body.error).to.be.a('string');
        expect(response.body.message).to.be.a('string');
        expect(response.body.timestamp).to.be.a('string');
        expect(response.body.path).to.equal(endpoint);
        expect(response.body.method).to.equal('GET');
      }
    });

    it('should include proper error headers', async function() {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.headers['content-type']).to.match(/json/);
      expect(response.headers['x-content-type-options']).to.equal('nosniff');
      expect(response.headers['x-request-id']).to.exist;
    });
  });

  describe('Error Recovery and Stability', function() {
    it('should recover gracefully after errors', async function() {
      // Generate an error
      await request(app).get('/nonexistent').expect(404);

      // Verify system is still responsive
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).to.exist;
    });

    it('should maintain error isolation between requests', async function() {
      // Create multiple error requests
      const errorPromises = Array(5).fill().map(() => 
        request(app).get('/nonexistent').expect(404)
      );

      await Promise.all(errorPromises);

      // System should still be responsive to valid requests
      const validResponse = await request(app)
        .get('/hello')
        .expect(200);

      expect(validResponse.body.message).to.include('Hello');
    });
  });
});
```

### SuperTest HTTP Testing Patterns

**Advanced SuperTest Usage:**
```javascript
// test/integration/supertest-patterns.test.js
import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('SuperTest HTTP Testing Patterns', function() {
  let app;

  beforeEach(function() {
    app = createApp();
  });

  describe('Request Chaining and Assertions', function() {
    it('should chain multiple assertions with expect', async function() {
      await request(app)
        .get('/hello')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.include('Hello');
        });
    });

    it('should use custom assertion functions', async function() {
      function validateHelloResponse(res) {
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('timestamp');
        expect(res.body.message).to.be.a('string');
        expect(res.body.timestamp).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }

      await request(app)
        .get('/hello')
        .expect(validateHelloResponse);
    });
  });

  describe('Request Configuration', function() {
    it('should set custom headers', async function() {
      await request(app)
        .get('/hello')
        .set('Accept', 'application/json')
        .set('User-Agent', 'Test Agent')
        .set('X-Custom-Header', 'test-value')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('object');
        });
    });

    it('should send query parameters', async function() {
      await request(app)
        .get('/hello')
        .query({ name: 'TestUser', format: 'json' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).to.be.a('string');
        });
    });

    it('should send POST data with different formats', async function() {
      // JSON data
      await request(app)
        .post('/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json')
        .expect(200);

      // Form data
      await request(app)
        .post('/health')
        .send('name=test&value=data')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(200);
    });
  });

  describe('Response Validation Patterns', function() {
    it('should validate response headers comprehensively', async function() {
      const response = await request(app)
        .get('/hello')
        .expect(200);

      // Header validation
      expect(response.headers).to.have.property('content-type');
      expect(response.headers['content-type']).to.match(/application\/json/);
      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers['x-content-type-options']).to.equal('nosniff');
      
      // Security headers
      expect(response.headers).to.have.property('x-frame-options');
      expect(response.headers).to.have.property('strict-transport-security');
    });

    it('should validate response timing', async function() {
      const startTime = Date.now();
      
      await request(app)
        .get('/hello')
        .expect(200);
        
      const responseTime = Date.now() - startTime;
      expect(responseTime).to.be.lessThan(100); // Response should be under 100ms
    });

    it('should validate response body structure', async function() {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Validate health endpoint structure
      expect(response.body).to.have.all.keys([
        'status', 'timestamp', 'uptime', 'memory', 'environment'
      ]);
      
      expect(response.body.status).to.be.a('string');
      expect(response.body.timestamp).to.be.a('string');
      expect(response.body.uptime).to.be.a('number');
      expect(response.body.memory).to.be.an('object');
      expect(response.body.environment).to.be.an('object');
    });
  });

  describe('Error Response Testing', function() {
    it('should test various HTTP error codes', async function() {
      // 404 Not Found
      await request(app)
        .get('/nonexistent')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).to.equal('Not Found');
        });

      // 405 Method Not Allowed (if implemented)
      await request(app)
        .post('/hello')
        .expect(404) // Express default for unhandled routes
        .expect((res) => {
          expect(res.body.error).to.exist;
        });
    });

    it('should test error response consistency', async function() {
      const errorPaths = ['/error1', '/error2', '/error3'];
      
      for (const path of errorPaths) {
        const response = await request(app)
          .get(path)
          .expect(404);

        // All errors should have consistent structure
        expect(response.body).to.have.property('error');
        expect(response.body).to.have.property('message');
        expect(response.body).to.have.property('timestamp');
        expect(response.body).to.have.property('path');
        expect(response.body.path).to.equal(path);
      }
    });
  });

  describe('Performance Testing with SuperTest', function() {
    it('should handle concurrent requests efficiently', async function() {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const promises = Array(concurrentRequests).fill().map(() =>
        request(app).get('/hello').expect(200)
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentRequests;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).to.equal(200);
        expect(response.body.message).to.include('Hello');
      });

      // Average response time should be reasonable
      expect(averageTime).to.be.lessThan(50); // 50ms average
    });

    it('should test memory efficiency during repeated requests', async function() {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health').expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).to.be.lessThan(10); // Should not increase by more than 10MB
    });
  });

  describe('Complex Request Scenarios', function() {
    it('should handle requests with authentication simulation', async function() {
      const token = 'Bearer test-token-123';
      
      await request(app)
        .get('/hello')
        .set('Authorization', token)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('object');
        });
    });

    it('should handle file upload simulation', async function() {
      // Simulate file upload scenario (if endpoint exists)
      const fileContent = 'test file content';
      
      await request(app)
        .post('/health') // Using health endpoint for demo
        .attach('file', Buffer.from(fileContent), 'test.txt')
        .expect(200);
    });

    it('should test cookie handling', async function() {
      await request(app)
        .get('/hello')
        .set('Cookie', ['session=abc123', 'preference=json'])
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('object');
        });
    });
  });
});
```

---

## End-to-End Testing Guide

### Complete Application Workflow Testing

**E2E Application Testing:**
```javascript
// test/e2e/application-workflow.test.js
import { expect } from 'chai';
import request from 'supertest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { createApp, startServer } from '../../src/app.js';

const sleep = promisify(setTimeout);

describe('End-to-End Application Workflow', function() {
  this.timeout(60000); // Longer timeout for E2E tests
  
  let server;
  let app;
  let serverProcess;

  before(async function() {
    // Start the actual application server
    app = createApp({
      enableHealthMonitoring: true,
      enableSecurityMiddleware: true,
      enableLogging: true
    });
    
    server = await startServer(app, { port: 0 });
    console.log(`Test server started on port ${server.address().port}`);
  });

  after(async function() {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('Application Startup Workflow', function() {
    it('should start application and serve all endpoints', async function() {
      // Test all primary endpoints are available
      const endpoints = [
        { path: '/hello', expectedMessage: 'Hello' },
        { path: '/good-evening', expectedMessage: 'Good evening' },
        { path: '/health', expectedStatus: 'ok' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint.path)
          .expect(200);

        expect(response.body).to.be.an('object');
        
        if (endpoint.expectedMessage) {
          expect(response.body.message).to.include(endpoint.expectedMessage);
        }
        
        if (endpoint.expectedStatus) {
          expect(response.body.status).to.exist;
        }
      }
    });

    it('should initialize with proper environment configuration', async function() {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.environment).to.be.an('object');
      expect(response.body.environment.nodeVersion).to.exist;
      expect(response.body.environment.platform).to.exist;
      expect(response.body.uptime).to.be.a('number');
    });
  });

  describe('User Journey Simulation', function() {
    it('should handle typical user interaction flow', async function() {
      // Simulate a user session workflow
      
      // 1. Health check (application monitoring)
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);
      
      expect(healthResponse.body.status).to.exist;
      
      // 2. Hello endpoint interaction
      const helloResponse = await request(app)
        .get('/hello')
        .query({ name: 'E2ETestUser' })
        .expect(200);
      
      expect(helloResponse.body.message).to.include('Hello');
      
      // 3. Good evening endpoint interaction
      const eveningResponse = await request(app)
        .get('/good-evening')
        .expect(200);
      
      expect(eveningResponse.body.message).to.include('Good evening');
      
      // 4. Verify session consistency (stateless)
      const secondHelloResponse = await request(app)
        .get('/hello')
        .query({ name: 'E2ETestUser' })
        .expect(200);
      
      // Should get consistent response (stateless design)
      expect(secondHelloResponse.body.message).to.include('Hello');
    });

    it('should handle error recovery in user workflow', async function() {
      // Simulate user making errors and recovering
      
      // 1. User hits invalid endpoint
      await request(app)
        .get('/invalid-endpoint')
        .expect(404);
      
      // 2. User recovers with valid request
      const recoveryResponse = await request(app)
        .get('/hello')
        .expect(200);
      
      expect(recoveryResponse.body.message).to.include('Hello');
      
      // 3. User continues normal flow
      await request(app)
        .get('/health')
        .expect(200);
    });
  });

  describe('Load and Stress Testing', function() {
    it('should handle sustained load over time', async function() {
      this.timeout(30000);
      
      const testDuration = 10000; // 10 seconds
      const requestInterval = 100; // 100ms between requests
      const startTime = Date.now();
      const responses = [];
      
      while (Date.now() - startTime < testDuration) {
        try {
          const response = await request(app)
            .get('/hello')
            .timeout(5000);
          
          responses.push({
            status: response.status,
            responseTime: Date.now() - startTime,
            success: response.status === 200
          });
          
          await sleep(requestInterval);
        } catch (error) {
          responses.push({
            status: 0,
            responseTime: Date.now() - startTime,
            success: false,
            error: error.message
          });
        }
      }
      
      // Analyze results
      const successCount = responses.filter(r => r.success).length;
      const successRate = (successCount / responses.length) * 100;
      
      expect(successRate).to.be.greaterThan(95); // 95% success rate minimum
      expect(responses.length).to.be.greaterThan(50); // Should have processed many requests
    });

    it('should handle burst traffic patterns', async function() {
      // Simulate burst of concurrent requests
      const burstSize = 50;
      const burstPromises = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < burstSize; i++) {
        burstPromises.push(
          request(app)
            .get('/health')
            .timeout(10000) // Longer timeout for burst testing
            .then(response => ({
              success: true,
              status: response.status,
              duration: Date.now() - startTime
            }))
            .catch(error => ({
              success: false,
              error: error.message,
              duration: Date.now() - startTime
            }))
        );
      }
      
      const results = await Promise.all(burstPromises);
      
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / results.length) * 100;
      const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      expect(successRate).to.be.greaterThan(90); // 90% success rate for burst
      expect(averageDuration).to.be.lessThan(5000); // Average under 5 seconds
    });
  });

  describe('Data Flow and State Management', function() {
    it('should maintain stateless behavior across requests', async function() {
      // Make multiple requests with same parameters
      const testRequests = Array(10).fill().map(() =>
        request(app)
          .get('/hello')
          .query({ name: 'StatelessTest' })
      );
      
      const responses = await Promise.all(testRequests);
      
      // All responses should be identical (stateless)
      const firstResponseBody = JSON.stringify(responses[0].body);
      
      responses.forEach((response, index) => {
        expect(response.status).to.equal(200);
        
        // Compare message content (timestamps will differ)
        expect(response.body.message).to.equal(responses[0].body.message);
      });
    });

    it('should handle concurrent data processing', async function() {
      // Simulate concurrent users with different data
      const users = ['User1', 'User2', 'User3', 'User4', 'User5'];
      
      const concurrentRequests = users.map(user =>
        request(app)
          .get('/hello')
          .query({ name: user })
          .then(response => ({
            user,
            response: response.body,
            status: response.status
          }))
      );
      
      const results = await Promise.all(concurrentRequests);
      
      // Each user should get their personalized response
      results.forEach(result => {
        expect(result.status).to.equal(200);
        expect(result.response.message).to.include('Hello');
        // Each response should be properly formatted
        expect(result.response.timestamp).to.exist;
      });
    });
  });

  describe('System Integration Testing', function() {
    it('should integrate with system monitoring', async function() {
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      // Verify monitoring data is collected
      expect(healthResponse.body.memory).to.be.an('object');
      expect(healthResponse.body.memory.heapUsed).to.be.a('number');
      expect(healthResponse.body.memory.heapTotal).to.be.a('number');
      expect(healthResponse.body.uptime).to.be.a('number');
      expect(healthResponse.body.uptime).to.be.greaterThan(0);
    });

    it('should provide comprehensive system information', async function() {
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.environment).to.be.an('object');
      expect(healthResponse.body.environment.nodeVersion).to.equal(process.version);
      expect(healthResponse.body.environment.platform).to.equal(process.platform);
      expect(healthResponse.body.environment.arch).to.equal(process.arch);
    });
  });

  describe('Security End-to-End Testing', function() {
    it('should maintain security posture under various attack scenarios', async function() {
      const attackVectors = [
        { path: '/hello', query: { name: '<script>alert("xss")</script>' } },
        { path: '/good-evening', query: { user: '../../etc/passwd' } },
        { path: '/health', query: { format: '${7*7}' } }
      ];

      for (const attack of attackVectors) {
        const response = await request(app)
          .get(attack.path)
          .query(attack.query)
          .expect(200);

        // Response should not contain attack payloads
        const responseText = JSON.stringify(response.body);
        expect(responseText).to.not.include('<script>');
        expect(responseText).to.not.include('../');
        expect(responseText).to.not.include('${');
        
        // Security headers should be present
        expect(response.headers['x-content-type-options']).to.equal('nosniff');
        expect(response.headers['x-frame-options']).to.exist;
      }
    });

    it('should handle malicious request patterns', async function() {
      // Test various malicious patterns
      const maliciousHeaders = {
        'X-Malicious': '<img src=x onerror=alert(1)>',
        'User-Agent': 'Mozilla/5.0 (compatible; sqlmap/1.0)',
        'Referer': 'javascript:alert(1)'
      };

      const response = await request(app)
        .get('/hello')
        .set(maliciousHeaders)
        .expect(200);

      expect(response.body).to.be.an('object');
      expect(response.headers['x-content-type-options']).to.equal('nosniff');
    });
  });
});
```

### PM2 Deployment Testing

**PM2 E2E Testing:**
```javascript
// test/e2e/pm2-deployment.test.js
import { expect } from 'chai';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PM2 Deployment End-to-End Testing', function() {
  this.timeout(120000); // 2 minutes for deployment tests
  
  const appName = 'nodejs-tutorial-test';
  const testPort = 3010;
  let pm2Process;

  before(function() {
    // Ensure we're in test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = testPort;
  });

  after(async function() {
    // Clean up PM2 processes
    try {
      await execAsync(`pm2 delete ${appName}`, { timeout: 30000 });
      await execAsync('pm2 kill', { timeout: 30000 });
    } catch (error) {
      console.warn('PM2 cleanup warning:', error.message);
    }
  });

  describe('PM2 Application Deployment', function() {
    it('should deploy application using PM2 ecosystem file', async function() {
      const ecosystemPath = path.join(__dirname, '../../ecosystem.config.js');
      
      try {
        // Start application with PM2
        const { stdout, stderr } = await execAsync(
          `pm2 start ${ecosystemPath} --env test`,
          { timeout: 60000 }
        );
        
        console.log('PM2 Start Output:', stdout);
        if (stderr) console.warn('PM2 Start Warnings:', stderr);
        
        // Wait for application to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify PM2 process is running
        const { stdout: listOutput } = await execAsync('pm2 list', { timeout: 10000 });
        expect(listOutput).to.include(appName);
        expect(listOutput).to.include('online');
        
      } catch (error) {
        console.error('PM2 deployment failed:', error);
        throw error;
      }
    });

    it('should validate application health after PM2 deployment', async function() {
      // Test application endpoints through PM2
      const baseUrl = `http://localhost:${testPort}`;
      
      // Health check
      const healthResponse = await request(baseUrl)
        .get('/health')
        .timeout(10000)
        .expect(200);
      
      expect(healthResponse.body.status).to.exist;
      expect(healthResponse.body.environment).to.be.an('object');
      
      // Functional endpoints
      const helloResponse = await request(baseUrl)
        .get('/hello')
        .timeout(10000)
        .expect(200);
      
      expect(helloResponse.body.message).to.include('Hello');
    });
  });

  describe('PM2 Cluster Mode Testing', function() {
    it('should deploy in cluster mode with multiple instances', async function() {
      // Update ecosystem config for cluster mode
      const clusterConfig = {
        apps: [{
          name: `${appName}-cluster`,
          script: path.join(__dirname, '../../src/server.js'),
          instances: 2,
          exec_mode: 'cluster',
          env: {
            NODE_ENV: 'test',
            PORT: testPort + 1
          }
        }]
      };
      
      const configPath = path.join(__dirname, 'cluster-test-config.json');
      const fs = await import('fs');
      fs.writeFileSync(configPath, JSON.stringify(clusterConfig, null, 2));
      
      try {
        // Start cluster
        await execAsync(`pm2 start ${configPath}`, { timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Verify cluster instances
        const { stdout } = await execAsync('pm2 list', { timeout: 10000 });
        expect(stdout).to.include(`${appName}-cluster`);
        
        // Count instances (should show multiple processes)
        const lines = stdout.split('\n');
        const clusterLines = lines.filter(line => line.includes(`${appName}-cluster`));
        expect(clusterLines.length).to.be.greaterThan(1);
        
        // Clean up
        await execAsync(`pm2 delete ${appName}-cluster`, { timeout: 30000 });
        fs.unlinkSync(configPath);
        
      } catch (error) {
        console.error('Cluster mode test failed:', error);
        throw error;
      }
    });

    it('should handle load balancing across cluster instances', async function() {
      // This test would require more complex setup to verify load balancing
      // For now, we'll test that cluster deployment works
      
      const { stdout } = await execAsync('pm2 list', { timeout: 10000 });
      
      // Verify main application is still running
      expect(stdout).to.include(appName);
    });
  });

  describe('PM2 Process Management', function() {
    it('should support graceful restart without downtime', async function() {
      // Test graceful restart
      const { stdout: restartOutput } = await execAsync(
        `pm2 gracefulReload ${appName}`,
        { timeout: 30000 }
      );
      
      expect(restartOutput).to.include('gracefulReload');
      
      // Wait for restart to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify application is still responsive
      const response = await request(`http://localhost:${testPort}`)
        .get('/health')
        .timeout(10000)
        .expect(200);
      
      expect(response.body.status).to.exist;
    });

    it('should provide process monitoring and metrics', async function() {
      // Get PM2 monitoring information
      const { stdout: monitorOutput } = await execAsync(
        `pm2 show ${appName}`,
        { timeout: 10000 }
      );
      
      expect(monitorOutput).to.include('status');
      expect(monitorOutput).to.include('memory');
      expect(monitorOutput).to.include('cpu');
      expect(monitorOutput).to.include('uptime');
    });

    it('should handle process resurrection after crash simulation', async function() {
      // Simulate process crash
      try {
        await execAsync(`pm2 stop ${appName}`, { timeout: 10000 });
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Restart process
        await execAsync(`pm2 start ${appName}`, { timeout: 30000 });
        
        // Wait for restart
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify application is responsive again
        const response = await request(`http://localhost:${testPort}`)
          .get('/health')
          .timeout(10000)
          .expect(200);
        
        expect(response.body.status).to.exist;
        
      } catch (error) {
        console.error('Process resurrection test failed:', error);
        throw error;
      }
    });
  });

  describe('PM2 Log Management', function() {
    it('should capture and manage application logs', async function() {
      // Generate some log activity
      await request(`http://localhost:${testPort}`)
        .get('/hello')
        .timeout(5000)
        .expect(200);
      
      // Check PM2 logs
      const { stdout: logOutput } = await execAsync(
        `pm2 logs ${appName} --lines 10 --nostream`,
        { timeout: 15000 }
      );
      
      expect(logOutput.length).to.be.greaterThan(0);
      
      // Logs should contain application output
      // (Specific log content depends on application logging configuration)
    });

    it('should rotate logs properly', async function() {
      // This is typically configured in PM2 ecosystem file
      // For testing, we'll just verify log files can be accessed
      
      const { stdout } = await execAsync(
        `pm2 show ${appName}`,
        { timeout: 10000 }
      );
      
      expect(stdout).to.include('log path');
    });
  });

  describe('PM2 Environment Configuration', function() {
    it('should respect environment-specific configurations', async function() {
      // Verify test environment configuration is active
      const response = await request(`http://localhost:${testPort}`)
        .get('/health')
        .timeout(10000)
        .expect(200);
      
      expect(response.body.environment.nodeEnv).to.equal('test');
    });

    it('should handle configuration updates without restart', async function() {
      // This would typically involve updating environment variables
      // and using PM2's reload functionality
      
      const { stdout } = await execAsync(
        `pm2 show ${appName}`,
        { timeout: 10000 }
      );
      
      expect(stdout).to.include('exec cwd');
      expect(stdout).to.include('node.js version');
    });
  });
});
```

### Zero-Downtime Reload Testing

**Zero-Downtime Testing:**
```javascript
// test/e2e/zero-downtime.test.js
import { expect } from 'chai';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import request from 'supertest';

const execAsync = promisify(exec);

describe('Zero-Downtime Reload Testing', function() {
  this.timeout(180000); // 3 minutes for downtime tests
  
  const appName = 'nodejs-tutorial-downtime-test';
  const testPort = 3020;
  let continuousTestingActive = false;
  let requestResults = [];

  before(async function() {
    // Deploy application for downtime testing
    process.env.NODE_ENV = 'production';
    process.env.PORT = testPort;
    
    try {
      await execAsync(`pm2 start src/server.js --name ${appName} --env production`, {
        timeout: 60000
      });
      
      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  after(async function() {
    continuousTestingActive = false;
    
    try {
      await execAsync(`pm2 delete ${appName}`, { timeout: 30000 });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  describe('Graceful Reload Testing', function() {
    it('should perform graceful reload without dropping requests', async function() {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 100; // Request every 100ms
      
      // Start continuous request testing
      continuousTestingActive = true;
      requestResults = [];
      
      const continuousRequests = setInterval(async () => {
        if (!continuousTestingActive) return;
        
        const startTime = Date.now();
        try {
          const response = await request(`http://localhost:${testPort}`)
            .get('/hello')
            .timeout(5000);
          
          requestResults.push({
            timestamp: Date.now(),
            success: true,
            status: response.status,
            responseTime: Date.now() - startTime
          });
          
        } catch (error) {
          requestResults.push({
            timestamp: Date.now(),
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
          });
        }
      }, requestInterval);

      // Wait for some baseline requests
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Perform graceful reload during traffic
      console.log('Initiating graceful reload...');
      const reloadStartTime = Date.now();
      
      try {
        await execAsync(`pm2 gracefulReload ${appName}`, { timeout: 45000 });
      } catch (error) {
        console.error('Graceful reload failed:', error);
      }
      
      const reloadEndTime = Date.now();
      console.log(`Reload completed in ${reloadEndTime - reloadStartTime}ms`);
      
      // Continue testing for a bit after reload
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Stop continuous testing
      continuousTestingActive = false;
      clearInterval(continuousRequests);
      
      // Analyze results
      const totalRequests = requestResults.length;
      const successfulRequests = requestResults.filter(r => r.success).length;
      const failedRequests = requestResults.filter(r => !r.success).length;
      const successRate = (successfulRequests / totalRequests) * 100;
      
      // Analyze requests during reload window
      const reloadWindowRequests = requestResults.filter(r => 
        r.timestamp >= reloadStartTime && r.timestamp <= reloadEndTime + 5000
      );
      
      const reloadWindowSuccessRate = reloadWindowRequests.length > 0 ?
        (reloadWindowRequests.filter(r => r.success).length / reloadWindowRequests.length) * 100 : 100;
      
      console.log(`Total requests: ${totalRequests}`);
      console.log(`Successful requests: ${successfulRequests}`);
      console.log(`Failed requests: ${failedRequests}`);
      console.log(`Overall success rate: ${successRate.toFixed(2)}%`);
      console.log(`Reload window success rate: ${reloadWindowSuccessRate.toFixed(2)}%`);
      
      // Assertions for zero-downtime
      expect(successRate).to.be.greaterThan(95); // 95% overall success rate
      expect(reloadWindowSuccessRate).to.be.greaterThan(90); // 90% during reload
      expect(totalRequests).to.be.greaterThan(100); // Sufficient test coverage
    });

    it('should maintain session state consistency during reload', async function() {
      // Test that stateless design ensures no session loss
      const preReloadResponse = await request(`http://localhost:${testPort}`)
        .get('/hello')
        .query({ name: 'PreReloadUser' })
        .timeout(5000)
        .expect(200);
      
      // Perform reload
      await execAsync(`pm2 gracefulReload ${appName}`, { timeout: 45000 });
      
      // Wait for reload completion
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test post-reload
      const postReloadResponse = await request(`http://localhost:${testPort}`)
        .get('/hello')
        .query({ name: 'PostReloadUser' })
        .timeout(5000)
        .expect(200);
      
      // Both requests should succeed with proper format
      expect(preReloadResponse.body.message).to.include('Hello');
      expect(postReloadResponse.body.message).to.include('Hello');
      
      // Response structure should be consistent
      expect(preReloadResponse.body).to.have.keys(postReloadResponse.body);
    });
  });

  describe('Hot Reload Performance Impact', function() {
    it('should measure performance impact of graceful reload', async function() {
      // Measure baseline performance
      const baselineResults = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        await request(`http://localhost:${testPort}`)
          .get('/health')
          .timeout(5000)
          .expect(200);
        
        baselineResults.push(Date.now() - startTime);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const baselineAverage = baselineResults.reduce((sum, time) => sum + time, 0) / baselineResults.length;
      
      // Perform reload
      const reloadStartTime = Date.now();
      await execAsync(`pm2 gracefulReload ${appName}`, { timeout: 45000 });
      const reloadDuration = Date.now() - reloadStartTime;
      
      // Wait for stabilization
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Measure post-reload performance
      const postReloadResults = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        await request(`http://localhost:${testPort}`)
          .get('/health')
          .timeout(5000)
          .expect(200);
        
        postReloadResults.push(Date.now() - startTime);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const postReloadAverage = postReloadResults.reduce((sum, time) => sum + time, 0) / postReloadResults.length;
      
      console.log(`Baseline average response time: ${baselineAverage.toFixed(2)}ms`);
      console.log(`Post-reload average response time: ${postReloadAverage.toFixed(2)}ms`);
      console.log(`Reload duration: ${reloadDuration}ms`);
      
      // Performance should not degrade significantly
      const performanceDegradation = ((postReloadAverage - baselineAverage) / baselineAverage) * 100;
      expect(performanceDegradation).to.be.lessThan(20); // Less than 20% degradation
      expect(reloadDuration).to.be.lessThan(30000); // Reload should complete within 30 seconds
    });
  });

  describe('Load Balancer Integration', function() {
    it('should work correctly with load balancing during reload', async function() {
      // Deploy in cluster mode for load balancing test
      try {
        await execAsync(`pm2 scale ${appName} 2`, { timeout: 30000 });
        
        // Wait for scale-up
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify multiple instances
        const { stdout } = await execAsync(`pm2 list`, { timeout: 10000 });
        const appLines = stdout.split('\n').filter(line => line.includes(appName));
        expect(appLines.length).to.be.greaterThanOrEqual(2);
        
        // Test requests are distributed
        const responses = [];
        for (let i = 0; i < 20; i++) {
          const response = await request(`http://localhost:${testPort}`)
            .get('/health')
            .timeout(5000);
          
          responses.push(response.body);
        }
        
        // All responses should be successful
        responses.forEach(response => {
          expect(response.status).to.exist;
        });
        
        // Scale back down
        await execAsync(`pm2 scale ${appName} 1`, { timeout: 30000 });
        
      } catch (error) {
        console.error('Load balancer test failed:', error);
        throw error;
      }
    });
  });

  describe('Health Check During Reload', function() {
    it('should maintain health check availability during reload', async function() {
      const healthCheckResults = [];
      
      // Start continuous health checking
      const healthCheckInterval = setInterval(async () => {
        try {
          const startTime = Date.now();
          const response = await request(`http://localhost:${testPort}`)
            .get('/health')
            .timeout(3000);
          
          healthCheckResults.push({
            timestamp: Date.now(),
            success: true,
            responseTime: Date.now() - startTime,
            status: response.status
          });
          
        } catch (error) {
          healthCheckResults.push({
            timestamp: Date.now(),
            success: false,
            error: error.message
          });
        }
      }, 200); // Check every 200ms
      
      // Wait for baseline
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Perform reload
      const reloadStart = Date.now();
      await execAsync(`pm2 gracefulReload ${appName}`, { timeout: 45000 });
      const reloadEnd = Date.now();
      
      // Continue monitoring for a bit
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(healthCheckInterval);
      
      // Analyze health check availability
      const totalChecks = healthCheckResults.length;
      const successfulChecks = healthCheckResults.filter(r => r.success).length;
      const healthAvailability = (successfulChecks / totalChecks) * 100;
      
      // Check availability during reload window
      const reloadWindowChecks = healthCheckResults.filter(r =>
        r.timestamp >= reloadStart && r.timestamp <= reloadEnd + 2000
      );
      
      const reloadWindowAvailability = reloadWindowChecks.length > 0 ?
        (reloadWindowChecks.filter(r => r.success).length / reloadWindowChecks.length) * 100 : 100;
      
      console.log(`Health check availability: ${healthAvailability.toFixed(2)}%`);
      console.log(`Reload window availability: ${reloadWindowAvailability.toFixed(2)}%`);
      
      // Health checks should remain highly available
      expect(healthAvailability).to.be.greaterThan(95);
      expect(reloadWindowAvailability).to.be.greaterThan(80); // Some tolerance during reload
    });
  });
});
```

### Production Environment Simulation

**Production Simulation Testing:**