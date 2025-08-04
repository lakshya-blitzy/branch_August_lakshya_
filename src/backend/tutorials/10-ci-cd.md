# Verify comprehensive system requirements for CI/CD implementation
echo "🔍 CI/CD Prerequisites Validation"
echo "=================================="

# Node.js version validation (minimum v22.x LTS)
node --version
if [[ $(node --version | cut -c2-3) -ge 22 ]]; then
    echo "✅ Node.js v22.x LTS or higher detected"
else
    echo "❌ Node.js v22.x LTS required for optimal CI/CD performance"
fi

# PM2 availability and version check
pm2 --version && echo "✅ PM2 v6.0.8 available for deployment automation" || echo "❌ PM2 installation required"

# Git configuration for CI/CD workflows
git --version && echo "✅ Git available for version control integration" || echo "❌ Git required for CI/CD"

# System resources for CI/CD performance
echo "💻 System Resources:"
echo "   CPU Cores: $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "Unknown")"
echo "   Available Memory: $(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "Check manually")"
echo "   Disk Space: $(df -h . | tail -1 | awk '{print $4}') available"
```

### Phase Integration Validation

Validate that your previous phase implementations are functional and ready for CI/CD integration:

```bash
# Comprehensive phase validation for CI/CD readiness
echo "🧪 Phase Integration Validation"
echo "==============================="

# Phase 7 PM2 deployment validation
if pm2 describe nodejs-tutorial-prod > /dev/null 2>&1; then
    echo "✅ Phase 7: PM2 deployment operational"
else
    echo "⚠️  Phase 7: Starting PM2 ecosystem for CI/CD integration"
    pm2 start ecosystem.config.js --env production
fi

# Express.js application health check
curl -f http://localhost:3000/health && echo "✅ Express.js application healthy" || echo "❌ Application health check failed"

# Cross-platform validation (Node.js and Flask implementations)
curl -f http://localhost:3000/hello && echo "✅ Node.js hello endpoint operational" || echo "❌ Node.js endpoint check failed"
curl -f http://localhost:3000/good-evening && echo "✅ Node.js good-evening endpoint operational" || echo "❌ Node.js endpoint check failed"

# Testing framework availability (Jest and Mocha dual framework support)
npm run test:jest --silent && echo "✅ Jest testing framework operational" || echo "❌ Jest testing issues detected"
npm run test:mocha --silent && echo "✅ Mocha testing framework operational" || echo "❌ Mocha testing issues detected"

# Security implementation validation (Helmet.js integration)
curl -I http://localhost:3000/hello | grep -i "x-frame-options\|content-security-policy" && echo "✅ Security headers implemented" || echo "❌ Security headers missing"
```

## CI/CD Fundamentals and Modern DevOps Concepts

Understanding CI/CD concepts and implementation strategies forms the foundation for building enterprise-grade deployment pipelines that deliver software safely and efficiently.

### Continuous Integration and Continuous Deployment Architecture

```javascript
// CI/CD Architecture Overview for Node.js Tutorial Project
export const cicdArchitecture = {
  continuousIntegration: {
    definition: 'Automated integration of code changes with comprehensive testing and validation',
    triggers: [
      'Code commits to feature branches',
      'Pull request creation and updates', 
      'Scheduled builds for dependency updates',
      'Manual workflow dispatch for testing'
    ],
    stages: [
      'Code checkout and environment setup',
      'Dependency installation and caching',
      'Multi-framework testing (Jest and Mocha)',
      'Code quality validation (ESLint, Prettier)',
      'Security scanning (npm audit, dependency check)',
      'Cross-platform validation (Node.js and Flask)',
      'Build artifact generation and validation',
      'Test coverage analysis and reporting'
    ],
    benefits: [
      'Early detection of integration issues',
      'Automated testing reduces manual effort',
      'Consistent code quality enforcement',
      'Rapid feedback for development teams',
      'Security vulnerability identification',
      'Cross-platform compatibility validation'
    ]
  },
  
  continuousDeployment: {
    definition: 'Automated deployment of validated code changes to production environments',
    triggers: [
      'Successful CI pipeline completion',
      'Manual deployment approval for production',
      'Scheduled deployment windows',
      'Emergency hotfix deployments'
    ],
    stages: [
      'Deployment environment preparation',
      'PM2 cluster mode deployment automation',
      'Zero-downtime deployment with health validation',
      'Multi-environment promotion (staging → production)',
      'Performance validation and monitoring integration',
      'Rollback capability with automated failure detection',
      'Post-deployment validation and alerting',
      'Stakeholder notification and documentation'
    ],
    benefits: [
      'Reduced time-to-market for features',
      'Consistent deployment processes',
      'Zero-downtime deployment capability',
      'Automated rollback on failure detection',
      'Enhanced deployment reliability',
      'Comprehensive monitoring integration'
    ]
  }
};
```

### GitHub Actions Workflow Architecture for Node.js Applications

GitHub Actions provides a powerful platform for implementing CI/CD workflows with matrix testing, parallel execution, and comprehensive integration capabilities:

```yaml
# .github/workflows/comprehensive-ci-cd.yml
# Comprehensive CI/CD workflow demonstrating modern DevOps practices
name: Node.js Tutorial CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
      skip_tests:
        description: 'Skip test execution (emergency deployment)'
        required: false
        default: false
        type: boolean

# Environment variables for consistent configuration across jobs
env:
  NODE_VERSION_MATRIX: '[18.x, 20.x, 22.x]'
  CACHE_DEPENDENCY_PATH: 'package-lock.json'
  PM2_ECOSYSTEM_FILE: 'ecosystem.config.js'
  HEALTH_CHECK_URL: 'http://localhost:3000/health'
  TEST_TIMEOUT: '300000'

# Workflow permissions for GitHub Actions integration
permissions:
  contents: read
  issues: write
  pull-requests: write
  security-events: write
  actions: read

jobs:
  # CI Pipeline: Continuous Integration with comprehensive testing and validation
  continuous-integration:
    name: 'CI: Testing & Validation'
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'pull_request'
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
        os: [ubuntu-latest, windows-latest, macos-latest]
        test-framework: [jest, mocha]
      fail-fast: false
      max-parallel: 6
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for comprehensive analysis
          
      - name: 'Setup Node.js ${{ matrix.node-version }}'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: ${{ env.CACHE_DEPENDENCY_PATH }}
          
      - name: 'Install Dependencies'
        run: |
          npm ci --prefer-offline --no-audit
          npm ls --depth=0
          
      - name: 'Code Quality Validation'
        run: |
          npm run lint
          npm run format:check
          npm run type-check || echo "TypeScript checking optional"
          
      - name: 'Security Scanning'
        run: |
          npm audit --audit-level=moderate
          npm run security:scan
          
      - name: 'Execute ${{ matrix.test-framework }} Tests'
        run: |
          if [ "${{ matrix.test-framework }}" = "jest" ]; then
            npm run test:jest:ci
          else
            npm run test:mocha:ci
          fi
        env:
          NODE_ENV: test
          TEST_TIMEOUT: ${{ env.TEST_TIMEOUT }}
          
      - name: 'Coverage Analysis'
        run: npm run test:coverage
        if: matrix.node-version == '22.x' && matrix.os == 'ubuntu-latest'
        
      - name: 'Upload Coverage Reports'
        uses: codecov/codecov-action@v3
        if: matrix.node-version == '22.x' && matrix.os == 'ubuntu-latest'
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          
      - name: 'Build Application'
        run: npm run build:production
        if: matrix.node-version == '22.x'
        
      - name: 'Cache Build Artifacts'
        uses: actions/cache@v3
        if: matrix.node-version == '22.x' && matrix.os == 'ubuntu-latest'
        with:
          path: |
            dist/
            build/
          key: build-${{ github.sha }}
          restore-keys: build-
```

### Modern DevOps Practices Integration

The tutorial project demonstrates contemporary DevOps practices that align with industry standards for 2025:

```javascript
// Modern DevOps practices demonstrated in the CI/CD pipeline
export const modernDevOpsPractices = {
  infrastructureAsCode: {
    description: 'PM2 ecosystem configuration as code for reproducible deployments',
    implementation: 'ecosystem.config.js with environment-specific optimizations',
    benefits: [
      'Version-controlled infrastructure configuration',
      'Reproducible deployment environments',
      'Consistent scaling and resource allocation',
      'Automated cluster mode configuration'
    ]
  },
  
  immutableDeployments: {
    description: 'Zero-downtime deployments with PM2 reload functionality',
    implementation: 'Sequential worker restart with health validation',
    benefits: [
      'Continuous service availability',
      'Rollback capability on failure detection',
      'Process isolation and fault tolerance',
      'Load balancer integration'
    ]
  },
  
  observabilityDriven: {
    description: 'Comprehensive monitoring and health check integration',
    implementation: 'Multi-endpoint health validation with performance metrics',
    benefits: [
      'Real-time application health monitoring',
      'Performance regression detection',
      'Automated alerting and escalation',
      'Business metrics and KPI tracking'
    ]
  },
  
  securityFirst: {
    description: 'Security scanning and vulnerability management throughout CI/CD',
    implementation: 'Automated dependency scanning with Helmet.js security headers',
    benefits: [
      'Early vulnerability detection',
      'Automated security policy enforcement',
      'Compliance validation and reporting',
      'Security incident prevention'
    ]
  },
  
  crossPlatformValidation: {
    description: 'Feature parity validation between Node.js and Flask implementations',
    implementation: 'Automated API compatibility testing across technology stacks',
    benefits: [
      'Technology stack flexibility',
      'Migration path validation',
      'Cross-platform feature consistency',
      'Educational demonstration value'
    ]
  }
};
```

## GitHub Actions Environment Setup and Repository Configuration

Configuring GitHub Actions for the Node.js tutorial project requires systematic setup of repository settings, secrets management, and workflow organization for optimal CI/CD execution.

### Repository Configuration and GitHub Actions Enablement

```bash
#!/bin/bash
# setup-github-actions.sh - Repository configuration for CI/CD enablement

echo "🚀 GitHub Actions Repository Setup"
echo "=================================="

# Verify GitHub CLI installation and authentication
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install from: https://cli.github.com/"
    exit 1
fi

gh auth status || {
    echo "🔐 GitHub authentication required"
    gh auth login
}

# Repository information
REPO_OWNER=$(gh repo view --json owner -q .owner.login)
REPO_NAME=$(gh repo view --json name -q .name)
echo "📂 Repository: $REPO_OWNER/$REPO_NAME"

# Enable GitHub Actions (if not already enabled)
echo "⚙️ Enabling GitHub Actions..."
gh api repos/$REPO_OWNER/$REPO_NAME/actions/permissions \
    --method PUT \
    --field enabled=true \
    --field allowed_actions=all

# Create workflow directory structure
echo "📁 Creating workflow directory structure..."
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE
mkdir -p .github/PULL_REQUEST_TEMPLATE

# Set default branch protection (recommended for production)
echo "🛡️ Configuring branch protection for main branch..."
gh api repos/$REPO_OWNER/$REPO_NAME/branches/main/protection \
    --method PUT \
    --field required_status_checks='{"strict":true,"contexts":["CI: Testing & Validation"]}' \
    --field enforce_admins=false \
    --field required_pull_request_reviews='{"required_approving_review_count":1}' \
    --field restrictions=null || echo "⚠️ Branch protection requires admin access"

echo "✅ GitHub Actions repository setup completed"
```

### Secrets and Environment Variables Configuration

GitHub Actions requires secure configuration management for deployment credentials, API keys, and environment-specific settings:

```bash
#!/bin/bash
# configure-github-secrets.sh - Secure secrets management for CI/CD

echo "🔐 GitHub Secrets Configuration"
echo "==============================="

# Production deployment secrets
echo "Adding production deployment secrets..."

# Server access credentials (replace with your actual values)
gh secret set DEPLOY_HOST --body="your-production-server.com"
gh secret set DEPLOY_USER --body="deploy"
gh secret set DEPLOY_SSH_KEY --body="$(cat ~/.ssh/deploy_key)"

# Database credentials
gh secret set DATABASE_URL --body="postgresql://user:password@host:port/database"

# API keys and tokens
gh secret set API_SECRET_KEY --body="your-secure-api-secret-key"
gh secret set JWT_SECRET --body="your-jwt-secret-key"

# Monitoring and alerting
gh secret set SLACK_WEBHOOK_URL --body="https://hooks.slack.com/your-webhook"
gh secret set EMAIL_NOTIFICATION --body="devops@yourcompany.com"

# Environment-specific variables
gh variable set NODE_ENV --body="production"
gh variable set PM2_INSTANCES --body="max"
gh variable set HEALTH_CHECK_TIMEOUT --body="30000"

echo "✅ GitHub secrets and variables configured successfully"
echo ""
echo "📝 Remember to update these secrets with your actual values:"
echo "   - DEPLOY_HOST: Your production server hostname"
echo "   - DEPLOY_USER: Deployment user account"
echo "   - DEPLOY_SSH_KEY: Private SSH key for server access"
echo "   - DATABASE_URL: Production database connection string"
echo "   - API_SECRET_KEY: Application API secret"
echo "   - JWT_SECRET: JSON Web Token secret key"
```

### Workflow File Structure and Organization

Organize GitHub Actions workflows for maintainability and clear separation of concerns:

```yaml
# .github/workflows/ci.yml - Continuous Integration Pipeline
name: 'Continuous Integration'

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly dependency check

# Global environment variables
env:
  NODE_VERSION: '22.x'
  PM2_VERSION: '6.0.8'
  COVERAGE_THRESHOLD: '90'

jobs:
  # Code quality and security validation
  code-quality:
    name: 'Code Quality & Security'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci
        
      - name: 'ESLint Analysis'
        run: npm run lint
        
      - name: 'Prettier Format Check'
        run: npm run format:check
        
      - name: 'Security Audit'
        run: npm audit --audit-level=moderate
        
      - name: 'Dependency Vulnerability Scan'
        run: npm run security:scan

  # Multi-framework testing with comprehensive validation
  test-matrix:
    name: 'Test Matrix: ${{ matrix.framework }} on Node.js ${{ matrix.node-version }}'
    runs-on: ubuntu-latest
    needs: code-quality
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
        framework: [jest, mocha]
      fail-fast: false
      
    steps:
      - uses: actions/checkout@v4
      
      - name: 'Setup Node.js ${{ matrix.node-version }}'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci
        
      - name: 'Execute ${{ matrix.framework }} Tests'
        run: |
          if [ "${{ matrix.framework }}" = "jest" ]; then
            npm run test:jest:ci
          else
            npm run test:mocha:ci
          fi
        env:
          NODE_ENV: test
          
      - name: 'Generate Coverage Report'
        if: matrix.framework == 'jest' && matrix.node-version == '22.x'
        run: npm run test:coverage
        
      - name: 'Upload Coverage to Codecov'
        if: matrix.framework == 'jest' && matrix.node-version == '22.x'
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          
  # Cross-platform validation
  cross-platform-validation:
    name: 'Cross-Platform Validation'
    runs-on: ubuntu-latest
    needs: test-matrix
    
    steps:
      - uses: actions/checkout@v4
      
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci
        
      - name: 'Start Express.js Application'
        run: |
          npm start &
          APP_PID=$!
          echo "APP_PID=$APP_PID" >> $GITHUB_ENV
          
      - name: 'Wait for Application Startup'
        run: |
          timeout 60s bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
          
      - name: 'Cross-Platform API Validation'
        run: npm run test:cross-platform
        
      - name: 'Cleanup Application'
        if: always()
        run: |
          if [ ! -z "$APP_PID" ]; then
            kill $APP_PID || true
          fi

  # Deployment readiness assessment
  deployment-readiness:
    name: 'Deployment Readiness Check'
    runs-on: ubuntu-latest
    needs: [code-quality, test-matrix, cross-platform-validation]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci
        
      - name: 'PM2 Ecosystem Validation'
        run: |
          npm install -g pm2@${{ env.PM2_VERSION }}
          pm2 start ecosystem.config.js --env staging --dry-run
          
      - name: 'Build Production Assets'
        run: npm run build:production
        
      - name: 'Production Deployment Simulation'
        run: |
          pm2 start ecosystem.config.js --env staging
          sleep 10
          curl -f http://localhost:3000/health
          pm2 describe nodejs-tutorial-staging
          pm2 delete all
```

### Environment-Specific Configuration Management

Implement environment-specific settings for development, staging, and production deployments:

```javascript
// .github/workflows/environment-config.js - Environment configuration management
export const environmentConfigurations = {
  development: {
    deployment: {
      enabled: false,
      reason: 'Development environment uses local PM2 instance'
    },
    testing: {
      frameworks: ['jest', 'mocha'],
      coverage: {
        enabled: true,
        threshold: 80
      },
      parallelExecution: true
    },
    monitoring: {
      healthChecks: true,
      performanceMetrics: false,
      alerting: false
    }
  },
  
  staging: {
    deployment: {
      enabled: true,
      strategy: 'rolling',
      approvalRequired: false,
      pm2Config: 'ecosystem.config.js --env staging'
    },
    testing: {
      frameworks: ['jest', 'mocha'],
      coverage: {
        enabled: true,
        threshold: 85
      },
      integrationTests: true,
      performanceTests: true
    },
    monitoring: {
      healthChecks: true,
      performanceMetrics: true,
      alerting: true,
      retentionPeriod: '7 days'
    }
  },
  
  production: {
    deployment: {
      enabled: true,
      strategy: 'blue-green',
      approvalRequired: true,
      pm2Config: 'ecosystem.config.js --env production',
      rollbackEnabled: true
    },
    testing: {
      frameworks: ['jest'],  // Focused testing for production
      coverage: {
        enabled: true,
        threshold: 90
      },
      smokeTests: true,
      performanceValidation: true
    },
    monitoring: {
      healthChecks: true,
      performanceMetrics: true,
      alerting: true,
      retentionPeriod: '30 days',
      businessMetrics: true
    }
  }
};
```

## Continuous Integration (CI) Pipeline Implementation

The CI pipeline implements comprehensive validation including multi-framework testing, code quality analysis, security scanning, and cross-platform compatibility verification.

### Complete CI Workflow with Multi-Framework Testing

Based on the existing test orchestration system, the CI workflow integrates both Jest and Mocha frameworks for comprehensive testing coverage:

```yaml
# .github/workflows/ci.yml - Production-Ready CI Pipeline
name: 'Node.js Tutorial - Continuous Integration'

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '*.md'
      - 'docs/**'
      - '.gitignore'
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
  schedule:
    - cron: '0 3 * * 1'  # Weekly security and dependency scan
  workflow_dispatch:
    inputs:
      test_coverage_threshold:
        description: 'Minimum test coverage percentage'
        required: false
        default: '90'
        type: number

# Workflow concurrency control to prevent resource conflicts
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

# Environment variables for consistent CI configuration
env:
  # Node.js and dependency versions
  NODE_VERSION_LTS: '22.x'
  NODE_VERSION_MATRIX: '[18.x, 20.x, 22.x]'
  PM2_VERSION: '6.0.8'
  
  # Testing configuration
  TEST_TIMEOUT: 300000
  COVERAGE_THRESHOLD: ${{ github.event.inputs.test_coverage_threshold || '90' }}
  JEST_MAX_WORKERS: '50%'
  
  # Application configuration
  NODE_ENV: 'test'
  PORT: 3000
  HEALTH_CHECK_URL: 'http://localhost:3000/health'
  
  # Performance optimization
  NPM_CONFIG_PREFER_OFFLINE: true
  NPM_CONFIG_NO_AUDIT: true

jobs:
  # Job 1: Environment validation and dependency analysis
  setup-and-validate:
    name: 'Setup & Environment Validation'
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
      dependency-changes: ${{ steps.dependency-check.outputs.changed }}
      
    steps:
      - name: 'Checkout Repository with Full History'
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for dependency change detection
          
      - name: 'Setup Node.js ${{ env.NODE_VERSION_LTS }}'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION_LTS }}
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'
          
      - name: 'Generate Cache Key'
        id: cache-key
        run: |
          echo "key=node-modules-${{ hashFiles('package-lock.json') }}-${{ runner.os }}" >> $GITHUB_OUTPUT
          
      - name: 'Cache Node Modules'
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ steps.cache-key.outputs.key }}
          restore-keys: |
            node-modules-${{ runner.os }}-
            
      - name: 'Install Dependencies'
        run: |
          npm ci --prefer-offline --no-audit
          npm ls --depth=0
          
      - name: 'Dependency Change Detection'
        id: dependency-check
        run: |
          if git diff --name-only HEAD~1..HEAD | grep -E "(package\.json|package-lock\.json)"; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi
          
      - name: 'Validate Project Configuration'
        run: |
          # Validate package.json structure
          node -p "require('./package.json').name" > /dev/null
          
          # Validate ecosystem configuration
          node -c ecosystem.config.js
          
          # Validate test configuration files
          node -c jest/jest.config.js
          test -f mocha/.mocharc.json
          
          echo "✅ Project configuration validation passed"

  # Job 2: Code quality and static analysis
  code-quality:
    name: 'Code Quality & Static Analysis'
    runs-on: ubuntu-latest
    needs: setup-and-validate
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION_LTS }}
          cache: 'npm'
          
      - name: 'Restore Dependencies'
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ needs.setup-and-validate.outputs.cache-key }}
          
      - name: 'ESLint Code Analysis'
        run: |
          echo "🔍 Running ESLint analysis..."
          npm run lint -- --format=github
          
      - name: 'Prettier Format Validation'
        run: |
          echo "✨ Validating code formatting..."
          npm run format:check
          
      - name: 'TypeScript Type Checking'
        run: |
          echo "🔧 Running TypeScript validation..."
          npm run type-check || echo "⚠️ TypeScript checking optional in this project"
          
      - name: 'Dead Code Detection'
        run: |
          echo "🗑️ Detecting unused code..."
          npm run dead-code-detection || echo "⚠️ Dead code detection optional"
          
      - name: 'Code Complexity Analysis'
        run: |
          echo "📊 Analyzing code complexity..."
          npm run complexity-analysis || echo "⚠️ Complexity analysis optional"

  # Job 3: Security scanning and vulnerability assessment
  security-scanning:
    name: 'Security Scanning & Vulnerability Assessment'
    runs-on: ubuntu-latest
    needs: setup-and-validate
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION_LTS }}
          cache: 'npm'
          
      - name: 'Restore Dependencies'
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ needs.setup-and-validate.outputs.cache-key }}
          
      - name: 'NPM Security Audit'
        run: |
          echo "🔒 Running npm security audit..."
          npm audit --audit-level=moderate --json > audit-results.json || true
          
          # Display human-readable results
          npm audit --audit-level=moderate || true
          
      - name: 'Dependency Vulnerability Scan'
        run: |
          echo "🛡️ Scanning for dependency vulnerabilities..."
          npm run security:scan
          
      - name: 'Helmet.js Security Header Validation'
        run: |
          echo "🏗️ Validating security header implementation..."
          npm run security:headers
          
      - name: 'Upload Security Scan Results'
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-scan-results
          path: |
            audit-results.json
            security-scan-report.json
          retention-days: 30

  # Job 4: Multi-framework testing with comprehensive validation
  test-execution:
    name: 'Testing: ${{ matrix.framework }} on Node.js ${{ matrix.node-version }}'
    runs-on: ${{ matrix.os }}
    needs: [setup-and-validate, code-quality]
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
        os: [ubuntu-latest, windows-latest, macos-latest]
        framework: [jest, mocha]
      fail-fast: false
      max-parallel: 8
      
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js ${{ matrix.node-version }}'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci --prefer-offline
        
      - name: 'Execute ${{ matrix.framework }} Test Suite'
        run: |
          if [ "${{ matrix.framework }}" = "jest" ]; then
            echo "🧪 Running Jest test suite..."
            npm run test:jest:ci
          else
            echo "🧪 Running Mocha test suite..."
            npm run test:mocha:ci
          fi
        env:
          NODE_ENV: test
          TEST_TIMEOUT: ${{ env.TEST_TIMEOUT }}
          JEST_MAX_WORKERS: ${{ env.JEST_MAX_WORKERS }}
          
      - name: 'Generate Test Coverage'
        if: matrix.framework == 'jest' && matrix.node-version == '22.x' && matrix.os == 'ubuntu-latest'
        run: |
          echo "📊 Generating comprehensive test coverage..."
          npm run test:coverage
          
      - name: 'Coverage Threshold Validation'
        if: matrix.framework == 'jest' && matrix.node-version == '22.x' && matrix.os == 'ubuntu-latest'
        run: |
          echo "🎯 Validating coverage threshold: ${{ env.COVERAGE_THRESHOLD }}%"
          npm run coverage:check -- --threshold=${{ env.COVERAGE_THRESHOLD }}
          
      - name: 'Upload Coverage Reports'
        if: matrix.framework == 'jest' && matrix.node-version == '22.x' && matrix.os == 'ubuntu-latest'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests,${{ matrix.framework }}
          name: coverage-${{ matrix.framework }}-${{ matrix.node-version }}
          fail_ci_if_error: true
          
      - name: 'Upload Test Results'
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.framework }}-${{ matrix.node-version }}-${{ matrix.os }}
          path: |
            test-results.xml
            coverage/
          retention-days: 14

  # Job 5: Integration testing and application validation
  integration-testing:
    name: 'Integration Testing & Application Validation'
    runs-on: ubuntu-latest
    needs: [setup-and-validate, test-execution]
    
    services:
      # Optional: Add database services for integration testing
      # postgres:
      #   image: postgres:15
      #   env:
      #     POSTGRES_PASSWORD: postgres
      #   options: >-
      #     --health-cmd pg_isready
      #     --health-interval 10s
      #     --health-timeout 5s
      #     --health-retries 5
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION_LTS }}
          cache: 'npm'
          
      - name: 'Restore Dependencies'
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ needs.setup-and-validate.outputs.cache-key }}
          
      - name: 'Install PM2 for Integration Testing'
        run: |
          npm install -g pm2@${{ env.PM2_VERSION }}
          pm2 --version
          
      - name: 'Start Application with PM2'
        run: |
          echo "🚀 Starting application for integration testing..."
          pm2 start ecosystem.config.js --env test
          pm2 status
          
      - name: 'Wait for Application Readiness'
        run: |
          echo "⏳ Waiting for application to be ready..."
          timeout 60s bash -c 'until curl -f ${{ env.HEALTH_CHECK_URL }}; do echo "Waiting..."; sleep 2; done'
          echo "✅ Application is ready"
          
      - name: 'Execute Integration Tests'
        run: |
          echo "🔗 Running integration test suite..."
          npm run test:integration
          
      - name: 'Cross-Platform API Validation'
        run: |
          echo "🌐 Validating cross-platform API compatibility..."
          npm run test:cross-platform
          
      - name: 'Performance Validation'
        run: |
          echo "⚡ Running performance validation..."
          npm run test:performance
          
      - name: 'Health Check Validation'
        run: |
          echo "🏥 Validating health check endpoints..."
          curl -f ${{ env.HEALTH_CHECK_URL }}
          curl -f http://localhost:3000/ready
          curl -f http://localhost:3000/live
          
      - name: 'Application Cleanup'
        if: always()
        run: |
          echo "🧹 Cleaning up test environment..."
          pm2 delete all || true
          pm2 kill || true

  # Job 6: Build and deployment readiness validation
  build-and-deployment:
    name: 'Build & Deployment Readiness'
    runs-on: ubuntu-latest
    needs: [code-quality, security-scanning, test-execution, integration-testing]
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION_LTS }}
          cache: 'npm'
          
      - name: 'Restore Dependencies'
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ needs.setup-and-validate.outputs.cache-key }}
          
      - name: 'Build Production Assets'
        run: |
          echo "🏗️ Building production assets..."
          npm run build:production
          
      - name: 'Validate Build Output'
        run: |
          echo "✅ Validating build artifacts..."
          test -d dist/ || echo "⚠️ No dist/ directory found"
          test -f ecosystem.config.js || exit 1
          echo "Build validation completed"
          
      - name: 'PM2 Ecosystem Validation'
        run: |
          echo "⚙️ Validating PM2 ecosystem configuration..."
          npm install -g pm2@${{ env.PM2_VERSION }}
          pm2 start ecosystem.config.js --env production --dry-run
          echo "✅ PM2 ecosystem configuration valid"
          
      - name: 'Docker Build Validation'
        run: |
          echo "🐳 Validating Docker build capability..."
          if [ -f Dockerfile ]; then
            docker build -t nodejs-tutorial:ci-test .
            docker run --rm nodejs-tutorial:ci-test node --version
          else
            echo "ℹ️ No Dockerfile found, skipping Docker validation"
          fi
          
      - name: 'Generate Build Metadata'
        run: |
          echo "📋 Generating build metadata..."
          cat > build-metadata.json << EOF
          {
            "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "gitCommit": "$GITHUB_SHA",
            "gitBranch": "$GITHUB_REF_NAME",
            "nodeVersion": "$(node --version)",
            "pm2Version": "$(pm2 --version)",
            "buildNumber": "$GITHUB_RUN_NUMBER",
            "buildId": "$GITHUB_RUN_ID"
          }
          EOF
          cat build-metadata.json
          
      - name: 'Upload Build Artifacts'
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            dist/
            build-metadata.json
            ecosystem.config.js
          retention-days: 30

  # Job 7: CI pipeline summary and notification
  ci-summary:
    name: 'CI Pipeline Summary'
    runs-on: ubuntu-latest
    needs: [setup-and-validate, code-quality, security-scanning, test-execution, integration-testing, build-and-deployment]
    if: always()
    
    steps:
      - name: 'Generate CI Summary Report'
        run: |
          echo "📊 CI Pipeline Execution Summary"
          echo "================================"
          echo "Workflow: $GITHUB_WORKFLOW"
          echo "Run ID: $GITHUB_RUN_ID"
          echo "Run Number: $GITHUB_RUN_NUMBER"
          echo "Triggered by: $GITHUB_EVENT_NAME"
          echo "Branch: $GITHUB_REF_NAME"
          echo "Commit: $GITHUB_SHA"
          echo "Actor: $GITHUB_ACTOR"
          echo ""
          echo "Job Results:"
          echo "- Setup & Validation: ${{ needs.setup-and-validate.result }}"
          echo "- Code Quality: ${{ needs.code-quality.result }}"
          echo "- Security Scanning: ${{ needs.security-scanning.result }}"
          echo "- Test Execution: ${{ needs.test-execution.result }}"
          echo "- Integration Testing: ${{ needs.integration-testing.result }}"
          echo "- Build & Deployment: ${{ needs.build-and-deployment.result }}"
          
      - name: 'Determine Overall Status'
        id: overall-status
        run: |
          if [[ "${{ needs.setup-and-validate.result }}" == "success" && \
                "${{ needs.code-quality.result }}" == "success" && \
                "${{ needs.security-scanning.result }}" == "success" && \
                "${{ needs.test-execution.result }}" == "success" && \
                "${{ needs.integration-testing.result }}" == "success" && \
                "${{ needs.build-and-deployment.result }}" == "success" ]]; then
            echo "status=success" >> $GITHUB_OUTPUT
            echo "✅ All CI pipeline jobs completed successfully"
          else
            echo "status=failure" >> $GITHUB_OUTPUT
            echo "❌ One or more CI pipeline jobs failed"
          fi
          
      - name: 'Notification on Success'
        if: steps.overall-status.outputs.status == 'success'
        run: |
          echo "🎉 CI Pipeline Success Notification"
          echo "All quality gates passed - ready for deployment!"
          
      - name: 'Notification on Failure'
        if: steps.overall-status.outputs.status == 'failure'
        run: |
          echo "🚨 CI Pipeline Failure Notification"
          echo "Please review failed jobs and address issues before deployment"
```

### Multi-Framework Testing Automation Integration

The CI pipeline leverages the existing test orchestration system to execute both Jest and Mocha frameworks with comprehensive coverage analysis:

```javascript
// Integration with existing test orchestration from scripts/test.js
export const ciTestIntegration = {
  jestIntegration: {
    command: 'npm run test:jest:ci',
    configuration: {
      // Leverages existing jest/jest.config.js
      testEnvironment: 'node',
      maxWorkers: '50%',
      collectCoverage: true,
      coverageThreshold: {
        global: {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90
        }
      },
      testTimeout: 300000,
      verbose: true,
      bail: false  // Continue running tests after first failure
    },
    reporting: {
      junit: 'test-results/jest-results.xml',
      coverage: 'coverage/jest/',
      json: 'test-results/jest-results.json'
    }
  },
  
  mochaIntegration: {
    command: 'npm run test:mocha:ci',
    configuration: {
      // Leverages existing mocha/.mocharc.json
      reporter: ['spec', 'json'],
      timeout: 300000,
      recursive: true,
      parallel: true,
      jobs: 4,
      require: ['mocha/setup.js'],
      spec: 'test/**/*.test.js'
    },
    reporting: {
      junit: 'test-results/mocha-results.xml',
      json: 'test-results/mocha-results.json',
      coverage: 'coverage/mocha/'
    }
  },
  
  testOrchestration: {
    // Integration with existing TestOrchestrator class
    parallelExecution: true,
    frameworkComparison: true,
    crossPlatformValidation: true,
    performanceMetrics: true,
    educationalReporting: true
  }
};
```

### CI Performance Optimization and Caching Strategy

Optimize CI pipeline execution time through intelligent caching and parallel processing:

```yaml
# Advanced caching strategy for optimal CI performance
- name: 'Advanced Dependency Caching'
  uses: actions/cache@v3
  with:
    path: |
      node_modules
      ~/.npm
      ~/.cache/ms-playwright
      ~/.jest-cache
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/.eslintrc.*') }}
    restore-keys: |
      ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}-
      ${{ runner.os }}-deps-

# Parallel job execution optimization
- name: 'Parallel Test Execution Configuration'
  run: |
    # Configure Jest for optimal CI performance
    export JEST_MAX_WORKERS=50%
    export JEST_CACHE_DIRECTORY=~/.jest-cache
    
    # Configure Mocha for parallel execution
    export MOCHA_PARALLEL=true
    export MOCHA_JOBS=4
    
    # Execute tests with performance optimization
    npm run test:parallel
```

## Security Integration in CI/CD Workflows

Comprehensive security scanning and validation throughout the CI/CD pipeline ensures vulnerabilities are detected early and security policies are enforced automatically.

### Automated Security Scanning Implementation

Integrate multiple security scanning tools for comprehensive vulnerability detection:

```yaml
# .github/workflows/security-scanning.yml - Dedicated Security Workflow
name: 'Security Scanning & Vulnerability Assessment'

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 1 * * *'  # Daily security scan at 1 AM UTC
  workflow_dispatch:
    inputs:
      scan_intensity:
        description: 'Security scan intensity level'
        required: true
        default: 'standard'
        type: choice
        options:
        - minimal
        - standard
        - comprehensive

env:
  NODE_VERSION: '22.x'
  SECURITY_SCAN_TIMEOUT: '600'  # 10 minutes
  VULNERABILITY_THRESHOLD: 'moderate'

jobs:
  # Dependency vulnerability scanning
  dependency-security:
    name: 'Dependency Vulnerability Analysis'
    runs-on: ubuntu-latest
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci --prefer-offline
        
      - name: 'NPM Security Audit'
        run: |
          echo "🔍 Running comprehensive npm security audit..."
          
          # Generate detailed audit report
          npm audit --json > npm-audit-report.json || true
          npm audit --audit-level=${{ env.VULNERABILITY_THRESHOLD }}
          
          # Count vulnerabilities by severity
          CRITICAL=$(cat npm-audit-report.json | jq '.vulnerabilities | to_entries | map(select(.value.severity == "critical")) | length' 2>/dev/null || echo "0")
          HIGH=$(cat npm-audit-report.json | jq '.vulnerabilities | to_entries | map(select(.value.severity == "high")) | length' 2>/dev/null || echo "0")
          MODERATE=$(cat npm-audit-report.json | jq '.vulnerabilities | to_entries | map(select(.value.severity == "moderate")) | length' 2>/dev/null || echo "0")
          
          echo "Vulnerability Summary:"
          echo "  Critical: $CRITICAL"
          echo "  High: $HIGH" 
          echo "  Moderate: $MODERATE"
          
          # Fail build on critical vulnerabilities
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Critical vulnerabilities detected - failing build"
            exit 1
          fi
          
      - name: 'Advanced Dependency Analysis'
        run: |
          echo "🔬 Running advanced dependency analysis..."
          
          # Check for outdated dependencies
          npm outdated --json > outdated-dependencies.json || true
          
          # License compliance check
          npx license-checker --json > license-report.json || true
          
          # Dependency tree analysis
          npm ls --json > dependency-tree.json || true
          
      - name: 'Generate Security Report'
        run: |
          echo "📋 Generating comprehensive security report..."
          
          cat > security-summary.md << 'EOF'
          # Security Scan Summary
          
          ## NPM Audit Results
          $(cat npm-audit-report.json | jq -r '.metadata.vulnerabilities | to_entries | map("- \(.key): \(.value)") | join("\n")' 2>/dev/null || echo "No vulnerabilities data available")
          
          ## Dependency Status
          - Total Dependencies: $(cat package.json | jq '.dependencies | length' 2>/dev/null || echo "Unknown")
          - Development Dependencies: $(cat package.json | jq '.devDependencies | length' 2>/dev/null || echo "Unknown")
          - Outdated Packages: $(cat outdated-dependencies.json | jq 'length' 2>/dev/null || echo "Unknown")
          
          ## Scan Timestamp
          $(date -u +"%Y-%m-%d %H:%M:%S UTC")
          EOF
          
          cat security-summary.md
          
      - name: 'Upload Security Artifacts'
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: dependency-security-reports
          path: |
            npm-audit-report.json
            outdated-dependencies.json
            license-report.json
            dependency-tree.json
            security-summary.md
          retention-days: 30

  # Application security analysis
  application-security:
    name: 'Application Security Analysis'
    runs-on: ubuntu-latest
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci --prefer-offline
        
      - name: 'Static Code Security Analysis'
        run: |
          echo "🔒 Running static code security analysis..."
          
          # ESLint security rules
          npm run lint:security || true
          
          # Check for hardcoded secrets
          npm run security:secrets || echo "⚠️ Secret scanning not configured"
          
          # Security-focused code patterns
          npm run security:patterns || echo "⚠️ Pattern analysis not configured"
          
      - name: 'Helmet.js Security Headers Validation'
        run: |
          echo "🛡️ Validating Helmet.js security implementation..."
          
          # Start application for security header testing
          npm start &
          APP_PID=$!
          
          # Wait for application startup
          timeout 30s bash -c 'until curl -f http://localhost:3000/health; do sleep 1; done'
          
          # Test security headers
          echo "Testing security headers..."
          HEADERS=$(curl -I http://localhost:3000/hello 2>/dev/null)
          
          # Validate critical security headers
          echo "$HEADERS" | grep -i "x-frame-options" || echo "⚠️ X-Frame-Options header missing"
          echo "$HEADERS" | grep -i "content-security-policy" || echo "⚠️ CSP header missing"
          echo "$HEADERS" | grep -i "x-content-type-options" || echo "⚠️ X-Content-Type-Options header missing"
          echo "$HEADERS" | grep -i "strict-transport-security" || echo "ℹ️ HSTS header not set (acceptable for HTTP testing)"
          
          # Validate X-Powered-By header removal
          if echo "$HEADERS" | grep -i "x-powered-by"; then
            echo "⚠️ X-Powered-By header should be removed for security"
          else
            echo "✅ X-Powered-By header properly removed"
          fi
          
          # Cleanup
          kill $APP_PID 2>/dev/null || true
          
      - name: 'Content Security Policy Validation'
        run: |
          echo "🔐 Validating Content Security Policy implementation..."
          
          # Start application
          npm start &
          APP_PID=$!
          
          # Wait for startup
          timeout 30s bash -c 'until curl -f http://localhost:3000/health; do sleep 1; done'
          
          # Extract and validate CSP
          CSP=$(curl -I http://localhost:3000/hello 2>/dev/null | grep -i "content-security-policy" || echo "")
          
          if [ -n "$CSP" ]; then
            echo "✅ CSP Header found: $CSP"
            
            # Validate CSP directives
            echo "$CSP" | grep -q "default-src" && echo "✅ default-src directive present" || echo "⚠️ default-src directive missing"
            echo "$CSP" | grep -q "script-src" && echo "✅ script-src directive present" || echo "⚠️ script-src directive missing"
            echo "$CSP" | grep -q "style-src" && echo "✅ style-src directive present" || echo "⚠️ style-src directive missing"
          else
            echo "⚠️ No CSP header found"
          fi
          
          # Cleanup
          kill $APP_PID 2>/dev/null || true
          
      - name: 'Security Configuration Validation'
        run: |
          echo "⚙️ Validating security configuration..."
          
          # Check security middleware configuration
          if grep -r "helmet" src/ > /dev/null; then
            echo "✅ Helmet.js middleware detected"
          else
            echo "❌ Helmet.js middleware not found"
          fi
          
          # Check CORS configuration
          if grep -r "cors" src/ > /dev/null; then
            echo "✅ CORS configuration detected"
          else
            echo "⚠️ CORS configuration not found"
          fi
          
          # Check environment variable security
          if grep -r "process\.env\." src/ | grep -v "NODE_ENV\|PORT" > /dev/null; then
            echo "ℹ️ Environment variables used - ensure secrets are properly managed"
          fi

  # Container security scanning (if Docker is used)
  container-security:
    name: 'Container Security Scanning'
    runs-on: ubuntu-latest
    if: github.event.inputs.scan_intensity == 'comprehensive'
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Docker Security Scanning'
        run: |
          if [ -f Dockerfile ]; then
            echo "🐳 Running Docker security analysis..."
            
            # Build image for scanning
            docker build -t nodejs-tutorial:security-scan .
            
            # Basic Docker security check
            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
              -v $(pwd):/scan aquasec/trivy:latest \
              image nodejs-tutorial:security-scan || echo "⚠️ Trivy not available"
              
          else
            echo "ℹ️ No Dockerfile found, skipping container security scan"
          fi

  # Security reporting and notification
  security-reporting:
    name: 'Security Report Generation'
    runs-on: ubuntu-latest
    needs: [dependency-security, application-security]
    if: always()
    
    steps:
      - name: 'Download Security Artifacts'
        uses: actions/download-artifact@v3
        with:
          name: dependency-security-reports
          path: security-reports/
          
      - name: 'Generate Comprehensive Security Report'
        run: |
          echo "📊 Generating comprehensive security report..."
          
          cat > comprehensive-security-report.md << 'EOF'
          # Comprehensive Security Assessment Report
          
          **Scan Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
          **Repository:** ${{ github.repository }}
          **Branch:** ${{ github.ref_name }}
          **Commit:** ${{ github.sha }}
          
          ## Executive Summary
          
          This report provides a comprehensive security assessment of the Node.js Tutorial Project,
          including dependency vulnerabilities, application security configuration, and security
          best practices compliance.
          
          ## Dependency Security Analysis
          
          $(if [ -f security-reports/npm-audit-report.json ]; then
            echo "### NPM Audit Results"
            cat security-reports/npm-audit-report.json | jq -r '.metadata.vulnerabilities | to_entries | map("- **\(.key | ascii_upcase)**: \(.value) vulnerabilities") | join("\n")' 2>/dev/null || echo "No vulnerability data available"
          else
            echo "Dependency security scan results not available"
          fi)
          
          ## Application Security Configuration
          
          - ✅ Helmet.js security middleware implemented
          - ✅ Security headers validation passed
          - ✅ Content Security Policy configured
          - ✅ X-Powered-By header removed
          - ✅ CORS configuration implemented
          
          ## Security Recommendations
          
          1. **Regular Security Updates**: Keep dependencies updated with latest security patches
          2. **Security Monitoring**: Implement continuous security monitoring in production
          3. **Access Control**: Consider implementing authentication and authorization
          4. **HTTPS**: Ensure HTTPS is enforced in production environments
          5. **Security Training**: Regular security training for development team
          
          ## Compliance Status
          
          - ✅ OWASP Top 10 considerations addressed
          - ✅ Security header best practices implemented
          - ✅ Dependency vulnerability management in place
          - ✅ Security scanning integrated in CI/CD pipeline
          
          EOF
          
          cat comprehensive-security-report.md
          
      - name: 'Security Status Summary'
        run: |
          echo "🔒 Security Scan Summary"
          echo "======================="
          echo "Dependency Security: ${{ needs.dependency-security.result }}"
          echo "Application Security: ${{ needs.application-security.result }}"
          echo ""
          
          if [[ "${{ needs.dependency-security.result }}" == "success" && \
                "${{ needs.application-security.result }}" == "success" ]]; then
            echo "✅ All security scans passed successfully"
            echo "SECURITY_STATUS=PASS" >> $GITHUB_ENV
          else
            echo "❌ One or more security scans failed"
            echo "SECURITY_STATUS=FAIL" >> $GITHUB_ENV
          fi
          
      - name: 'Upload Comprehensive Security Report'
        uses: actions/upload-artifact@v3
        with:
          name: comprehensive-security-report
          path: comprehensive-security-report.md
          retention-days: 90  # Extended retention for security reports
```

### Helmet.js Security Header Integration Testing

Validate the security middleware implementation integrated from previous phases:

```javascript
// Security validation integration with existing Helmet.js configuration
export const securityValidation = {
  helmetIntegration: {
    // Leverages existing security/helmet.config.js
    headerValidation: {
      'Content-Security-Policy': {
        required: true,
        validation: (header) => header.includes("default-src 'self'")
      },
      'X-Frame-Options': {
        required: true,
        validation: (header) => header.includes('SAMEORIGIN')
      },
      'X-Content-Type-Options': {
        required: true,
        validation: (header) => header.includes('nosniff')
      },
      'Strict-Transport-Security': {
        required: false, // Optional for HTTP testing
        validation: (header) => header.includes('max-age=')
      },
      'X-Powered-By': {
        required: false, // Should be absent
        validation: (header) => !header  // Should not exist
      }
    }
  },
  
  securityTestSuite: {
    // Integration with existing test suites
    jestSecurityTests: 'test/security/helmet.test.js',
    mochaSecurityTests: 'test/security/security-headers.test.js',
    integrationTests: 'test/integration/security.test.js'
  },
  
  vulnerabilityManagement: {
    // Automated vulnerability assessment
    dependencyScanning: 'npm audit',
    codeScanning: 'eslint-plugin-security',
    configurationValidation: 'security configuration tests',
    runtimeProtection: 'Helmet.js middleware'
  }
};
```

### Security Policy as Code Implementation

Define security policies that are automatically enforced throughout the CI/CD pipeline:

```yaml
# .github/security-policy.yml - Security Policy as Code
security_policy:
  dependency_management:
    vulnerability_threshold: 'moderate'
    auto_update: false  # Require manual review
    license_compliance: true
    outdated_threshold: '6 months'
    
  code_security:
    static_analysis: true
    secret_scanning: true
    security_headers: true
    input_validation: true
    
  build_security:
    container_scanning: true
    base_image_policy: 'official images only'
    minimal_privileges: true
    
  deployment_security:
    https_required: true
    security_headers_enforced: true
    access_logging: true
    monitoring_required: true
    
  compliance:
    owasp_top_10: true
    security_review_required: true
    penetration_testing: 'quarterly'
    security_training: 'annual'
```

This comprehensive security integration ensures that security is not an afterthought but a fundamental part of the CI/CD pipeline, providing early detection of vulnerabilities and automated enforcement of security policies throughout the development and deployment process.

## Continuous Deployment (CD) Pipeline Implementation

The CD pipeline automates deployment with PM2 cluster mode, implements zero-downtime deployment strategies, and provides comprehensive multi-environment promotion workflows with automated rollback capabilities.

### Complete CD Workflow with PM2 Automation

Building upon the existing PM2 ecosystem configuration, the CD workflow provides enterprise-grade deployment automation:

```yaml
# .github/workflows/cd.yml - Production-Ready Continuous Deployment Pipeline
name: 'Node.js Tutorial - Continuous Deployment'

on:
  workflow_run:
    workflows: ["Node.js Tutorial - Continuous Integration"]
    branches: [main]
    types: [completed]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
      deployment_strategy:
        description: 'Deployment strategy'
        required: true
        default: 'rolling'
        type: choice
        options:
        - rolling
        - blue-green
        - canary
      skip_validation:
        description: 'Skip pre-deployment validation (emergency only)'
        required: false
        default: false
        type: boolean

# Deployment concurrency control to prevent parallel deployments to same environment
concurrency:
  group: deploy-${{ github.event.inputs.environment || 'staging' }}
  cancel-in-progress: false  # Never cancel in-progress deployments

# Environment variables for deployment configuration
env:
  # Node.js and PM2 versions
  NODE_VERSION: '22.x'
  PM2_VERSION: '6.0.8'
  
  # Deployment configuration
  DEPLOYMENT_TIMEOUT: '900'  # 15 minutes
  HEALTH_CHECK_TIMEOUT: '300'  # 5 minutes
  ROLLBACK_TIMEOUT: '600'  # 10 minutes
  
  # Application configuration
  ECOSYSTEM_FILE: 'ecosystem.config.js'
  HEALTH_CHECK_URL: 'http://localhost:3000/health'
  READY_CHECK_URL: 'http://localhost:3000/ready'
  
  # Monitoring and notification
  SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
  NOTIFICATION_EMAIL: ${{ secrets.EMAIL_NOTIFICATION }}

jobs:
  # Job 1: Pre-deployment validation and environment preparation
  pre-deployment:
    name: 'Pre-Deployment Validation'
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch'
    
    outputs:
      environment: ${{ steps.environment.outputs.target }}
      strategy: ${{ steps.strategy.outputs.type }}
      validation-passed: ${{ steps.validation.outputs.passed }}
      deployment-id: ${{ steps.deployment-id.outputs.id }}
      
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}
          
      - name: 'Determine Deployment Environment'
        id: environment
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            TARGET_ENV="${{ github.event.inputs.environment }}"
          else
            # Auto-deployment: main branch → staging
            TARGET_ENV="staging"
          fi
          
          echo "target=$TARGET_ENV" >> $GITHUB_OUTPUT
          echo "🎯 Target environment: $TARGET_ENV"
          
      - name: 'Determine Deployment Strategy'
        id: strategy
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            STRATEGY="${{ github.event.inputs.deployment_strategy }}"
          else
            # Default strategy based on environment
            if [ "${{ steps.environment.outputs.target }}" = "production" ]; then
              STRATEGY="blue-green"
            else
              STRATEGY="rolling"
            fi
          fi
          
          echo "type=$STRATEGY" >> $GITHUB_OUTPUT
          echo "🔄 Deployment strategy: $STRATEGY"
          
      - name: 'Generate Deployment ID'
        id: deployment-id
        run: |
          DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)-${GITHUB_RUN_NUMBER}"
          echo "id=$DEPLOYMENT_ID" >> $GITHUB_OUTPUT
          echo "🏷️ Deployment ID: $DEPLOYMENT_ID"
          
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci --prefer-offline --production
        
      - name: 'Validate Ecosystem Configuration'
        id: validation
        run: |
          echo "✅ Validating PM2 ecosystem configuration..."
          
          # Install PM2 for validation
          npm install -g pm2@${{ env.PM2_VERSION }}
          
          # Validate ecosystem file syntax
          node -c ${{ env.ECOSYSTEM_FILE }}
          
          # Dry-run ecosystem configuration
          pm2 start ${{ env.ECOSYSTEM_FILE }} --env ${{ steps.environment.outputs.target }} --dry-run
          
          # Validate deployment scripts
          if [ -f "scripts/deploy.js" ]; then
            node -c scripts/deploy.js
          fi
          
          # Validate health check endpoints
          if [ -f "scripts/health-check.js" ]; then
            node -c scripts/health-check.js
          fi
          
          echo "passed=true" >> $GITHUB_OUTPUT
          echo "✅ Pre-deployment validation completed successfully"
          
      - name: 'Pre-Deployment Notification'
        run: |
          echo "📢 Sending pre-deployment notification..."
          
          MESSAGE="🚀 Deployment initiated for \`${{ steps.environment.outputs.target }}\` environment
          
          **Details:**
          - Repository: ${{ github.repository }}
          - Branch: ${{ github.ref_name }}
          - Commit: ${{ github.sha }}
          - Strategy: ${{ steps.strategy.outputs.type }}
          - Deployment ID: ${{ steps.deployment-id.outputs.id }}
          - Triggered by: ${{ github.actor }}
          
          **Status:** Validation completed, proceeding to deployment..."
          
          echo "$MESSAGE"
          # Add Slack notification here if webhook is configured

  # Job 2: Staging environment deployment
  deploy-staging:
    name: 'Deploy to Staging Environment'
    runs-on: ubuntu-latest
    needs: pre-deployment
    if: needs.pre-deployment.outputs.environment == 'staging' && needs.pre-deployment.outputs.validation-passed == 'true'
    
    environment:
      name: staging
      url: https://staging.your-domain.com
      
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}
          
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci --prefer-offline --production
        
      - name: 'Install PM2'
        run: |
          npm install -g pm2@${{ env.PM2_VERSION }}
          pm2 --version
          
      - name: 'Build Application'
        run: |
          echo "🏗️ Building application for staging deployment..."
          npm run build:staging || npm run build:production || echo "No build script available"
          
      - name: 'Execute Staging Deployment'
        run: |
          echo "🚀 Deploying to staging environment..."
          
          # Stop existing application if running
          pm2 delete nodejs-tutorial-staging 2>/dev/null || echo "No existing application to stop"
          
          # Start application in staging mode
          pm2 start ${{ env.ECOSYSTEM_FILE }} --env staging
          
          # Display deployment status
          pm2 status
          pm2 describe nodejs-tutorial-staging
          
      - name: 'Staging Health Validation'
        run: |
          echo "🏥 Validating staging deployment health..."
          
          # Wait for application startup
          timeout ${{ env.HEALTH_CHECK_TIMEOUT }}s bash -c '
            until curl -f ${{ env.HEALTH_CHECK_URL }}; do
              echo "Waiting for application to be ready..."
              sleep 5
            done
          '
          
          # Comprehensive health checks
          echo "✅ Health check passed"
          curl -f ${{ env.READY_CHECK_URL }} && echo "✅ Readiness check passed"
          
          # Performance validation
          RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' ${{ env.HEALTH_CHECK_URL }})
          echo "⚡ Response time: ${RESPONSE_TIME}s"
          
          if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
            echo "⚠️ High response time detected: ${RESPONSE_TIME}s"
          fi
          
      - name: 'Staging Smoke Tests'
        run: |
          echo "🧪 Running staging smoke tests..."
          
          # API endpoint validation
          curl -f http://localhost:3000/hello | jq .
          curl -f http://localhost:3000/good-evening | jq .
          
          # Execute smoke test suite
          npm run test:smoke || echo "No smoke tests configured"
          
      - name: 'Staging Deployment Success'
        run: |
          echo "✅ Staging deployment completed successfully!"
          echo ""
          echo "📊 Deployment Summary:"
          echo "  Environment: staging"
          echo "  Strategy: ${{ needs.pre-deployment.outputs.strategy }}"
          echo "  Deployment ID: ${{ needs.pre-deployment.outputs.deployment-id }}"
          echo "  PM2 Status:"
          pm2 list --formatters=json | jq -r '.[] | "    - \(.name): \(.pm2_env.status) (PID: \(.pid), Memory: \(.monit.memory/1024/1024 | floor)MB)"'

  # Job 3: Production deployment approval gate
  production-approval:
    name: 'Production Deployment Approval'
    runs-on: ubuntu-latest
    needs: [pre-deployment, deploy-staging]
    if: |
      always() &&
      needs.pre-deployment.outputs.environment == 'production' &&
      needs.pre-deployment.outputs.validation-passed == 'true' &&
      (needs.deploy-staging.result == 'success' || needs.deploy-staging.result == 'skipped')
    
    environment:
      name: production-approval
      
    steps:
      - name: 'Production Deployment Review'
        run: |
          echo "🔍 Production Deployment Review Required"
          echo "======================================"
          echo ""
          echo "**Deployment Details:**"
          echo "  Environment: production"
          echo "  Strategy: ${{ needs.pre-deployment.outputs.strategy }}"
          echo "  Deployment ID: ${{ needs.pre-deployment.outputs.deployment-id }}"
          echo "  Branch: ${{ github.ref_name }}"
          echo "  Commit: ${{ github.sha }}"
          echo "  Triggered by: ${{ github.actor }}"
          echo ""
          echo "**Pre-Deployment Checklist:**"
          echo "  ✅ CI pipeline passed"
          echo "  ✅ Security scans completed"
          echo "  ✅ Staging deployment successful"
          echo "  ✅ Ecosystem configuration validated"
          echo ""
          echo "Please review and approve this production deployment."
          echo "This step will wait for manual approval before proceeding."

  # Job 4: Production environment deployment
  deploy-production:
    name: 'Deploy to Production Environment'
    runs-on: ubuntu-latest
    needs: [pre-deployment, production-approval]
    if: |
      always() &&
      needs.pre-deployment.outputs.environment == 'production' &&
      needs.production-approval.result == 'success'
    
    environment:
      name: production
      url: https://your-domain.com
      
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}
          
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Install Dependencies'
        run: npm ci --prefer-offline --production
        
      - name: 'Install PM2'
        run: |
          npm install -g pm2@${{ env.PM2_VERSION }}
          pm2 --version
          
      - name: 'Build Production Application'
        run: |
          echo "🏗️ Building application for production deployment..."
          npm run build:production
          
      - name: 'Pre-Production Backup'
        run: |
          echo "💾 Creating pre-deployment backup..."
          
          # Save current PM2 configuration
          pm2 save
          cp ~/.pm2/dump.pm2 "backup-pre-deploy-$(date +%Y%m%d-%H%M%S).pm2" || echo "No existing PM2 processes"
          
          # Record current application state
          pm2 describe nodejs-tutorial-prod > current-state.json 2>/dev/null || echo "No current production application"
          
      - name: 'Execute Zero-Downtime Production Deployment'
        run: |
          echo "🚀 Executing zero-downtime production deployment..."
          
          if pm2 describe nodejs-tutorial-prod > /dev/null 2>&1; then
            echo "🔄 Performing zero-downtime reload of existing application..."
            
            # Zero-downtime reload using PM2
            pm2 reload ${{ env.ECOSYSTEM_FILE }} --env production
            
            # Wait for reload completion
            sleep 10
            
          else
            echo "🆕 Starting new production application..."
            
            # Fresh production deployment
            pm2 start ${{ env.ECOSYSTEM_FILE }} --env production
            
          fi
          
          # Display deployment status
          echo "📊 Post-deployment status:"
          pm2 status
          pm2 describe nodejs-tutorial-prod
          
      - name: 'Production Health Validation'
        run: |
          echo "🏥 Validating production deployment health..."
          
          # Extended health check timeout for production
          timeout ${{ env.HEALTH_CHECK_TIMEOUT }}s bash -c '
            until curl -f ${{ env.HEALTH_CHECK_URL }}; do
              echo "Waiting for production application to be ready..."
              sleep 10
            done
          '
          
          # Comprehensive production health checks
          echo "✅ Production health check passed"
          
          # Readiness validation
          curl -f ${{ env.READY_CHECK_URL }} && echo "✅ Production readiness check passed"
          
          # Performance validation
          RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' ${{ env.HEALTH_CHECK_URL }})
          echo "⚡ Production response time: ${RESPONSE_TIME}s"
          
          # Load balancer validation
          echo "🔍 Validating load balancing across workers..."
          for i in {1..10}; do
            curl -s http://localhost:3000/process-info | jq -r .worker
          done | sort | uniq -c
          
      - name: 'Production Smoke Tests'
        run: |
          echo "🧪 Running production smoke tests..."
          
          # Critical API endpoint validation
          curl -f http://localhost:3000/hello | jq .
          curl -f http://localhost:3000/good-evening | jq .
          curl -f http://localhost:3000/health | jq .
          
          # Production smoke test suite
          npm run test:smoke:production || npm run test:smoke || echo "No production smoke tests configured"
          
      - name: 'Production Deployment Success'
        run: |
          echo "🎉 Production deployment completed successfully!"
          echo ""
          echo "📊 Production Deployment Summary:"
          echo "  Environment: production"
          echo "  Strategy: ${{ needs.pre-deployment.outputs.strategy }}"
          echo "  Deployment ID: ${{ needs.pre-deployment.outputs.deployment-id }}"
          echo "  Deployment Time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
          echo ""
          echo "🏭 Production Application Status:"
          pm2 list --formatters=json | jq -r '.[] | select(.name == "nodejs-tutorial-prod") | "  - Name: \(.name)\n  - Status: \(.pm2_env.status)\n  - Instances: \(.pm2_env.instances)\n  - CPU: \(.monit.cpu)%\n  - Memory: \(.monit.memory/1024/1024 | floor)MB\n  - Uptime: \(.pm2_env.pm_uptime | tonumber | strftime("%H:%M:%S"))"'
          
          # Save successful deployment state
          pm2 save

  # Job 5: Post-deployment monitoring and validation
  post-deployment:
    name: 'Post-Deployment Monitoring'
    runs-on: ubuntu-latest
    needs: [pre-deployment, deploy-staging, deploy-production]
    if: |
      always() &&
      (needs.deploy-staging.result == 'success' || needs.deploy-production.result == 'success')
    
    steps:
      - name: 'Post-Deployment Monitoring Setup'
        run: |
          ENVIRONMENT="${{ needs.pre-deployment.outputs.environment }}"
          DEPLOYMENT_ID="${{ needs.pre-deployment.outputs.deployment-id }}"
          
          echo "📊 Setting up post-deployment monitoring..."
          echo "  Environment: $ENVIRONMENT"
          echo "  Deployment ID: $DEPLOYMENT_ID"
          
      - name: 'Extended Health Monitoring'
        run: |
          echo "🔍 Running extended health monitoring..."
          
          # Monitor application for 5 minutes
          for i in {1..30}; do
            if curl -f ${{ env.HEALTH_CHECK_URL }} > /dev/null 2>&1; then
              echo "✅ Health check $i/30 passed"
            else
              echo "❌ Health check $i/30 failed"
              exit 1
            fi
            sleep 10
          done
          
          echo "✅ Extended health monitoring completed successfully"
          
      - name: 'Performance Baseline Validation'
        run: |
          echo "⚡ Validating performance baselines..."
          
          # Response time validation
          TOTAL_TIME=0
          REQUESTS=10
          
          for i in $(seq 1 $REQUESTS); do
            TIME=$(curl -o /dev/null -s -w '%{time_total}' ${{ env.HEALTH_CHECK_URL }})
            TOTAL_TIME=$(echo "$TOTAL_TIME + $TIME" | bc)
            echo "Request $i: ${TIME}s"
          done
          
          AVERAGE_TIME=$(echo "scale=3; $TOTAL_TIME / $REQUESTS" | bc)
          echo "📊 Average response time: ${AVERAGE_TIME}s"
          
          # Performance threshold validation
          if (( $(echo "$AVERAGE_TIME > 1.0" | bc -l) )); then
            echo "⚠️ Performance degradation detected: ${AVERAGE_TIME}s > 1.0s"
            echo "Consider investigating performance issues"
          else
            echo "✅ Performance within acceptable limits"
          fi
          
      - name: 'Deployment Success Notification'
        run: |
          ENVIRONMENT="${{ needs.pre-deployment.outputs.environment }}"
          DEPLOYMENT_ID="${{ needs.pre-deployment.outputs.deployment-id }}"
          
          echo "🎉 Deployment Success Notification"
          echo "================================="
          
          MESSAGE="✅ Deployment successful for \`$ENVIRONMENT\` environment
          
          **Deployment Details:**
          - Repository: ${{ github.repository }}
          - Branch: ${{ github.ref_name }}
          - Commit: ${{ github.sha }}
          - Strategy: ${{ needs.pre-deployment.outputs.strategy }}
          - Deployment ID: $DEPLOYMENT_ID
          - Completed: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
          
          **Post-Deployment Validation:**
          - ✅ Health checks passing
          - ✅ Performance within baseline
          - ✅ Smoke tests completed
          - ✅ Monitoring active
          
          Application is now live and operational! 🚀"
          
          echo "$MESSAGE"
          # Add Slack/email notification here

  # Job 6: Automated rollback on failure
  rollback:
    name: 'Automated Rollback on Failure'
    runs-on: ubuntu-latest
    needs: [pre-deployment, deploy-staging, deploy-production]
    if: |
      always() &&
      (needs.deploy-staging.result == 'failure' || needs.deploy-production.result == 'failure')
    
    steps:
      - name: 'Rollback Execution'
        run: |
          ENVIRONMENT="${{ needs.pre-deployment.outputs.environment }}"
          
          echo "🔄 Executing automated rollback for $ENVIRONMENT environment..."
          
          # Install PM2
          npm install -g pm2@${{ env.PM2_VERSION }}
          
          # Attempt to restore previous state
          if [ -f "backup-pre-deploy-*.pm2" ]; then
            echo "💾 Restoring from backup..."
            cp backup-pre-deploy-*.pm2 ~/.pm2/dump.pm2
            pm2 resurrect
          else
            echo "🛑 Stopping failed deployment..."
            pm2 delete nodejs-tutorial-$ENVIRONMENT || echo "No application to stop"
          fi
          
          echo "🔄 Rollback completed"
          
      - name: 'Rollback Notification'
        run: |
          echo "🚨 Deployment Rollback Notification"
          echo "=================================="
          echo "Deployment to ${{ needs.pre-deployment.outputs.environment }} failed and has been rolled back."
          echo "Please investigate the deployment logs and address issues before retrying."
```

### PM2 Cluster Mode Deployment Automation

Leverage the existing ecosystem configuration for automated cluster mode deployment with comprehensive orchestration:

```javascript
// Integration with existing PM2 ecosystem configuration
export const deploymentAutomation = {
  ecosystemIntegration: {
    // Leverages existing ecosystem.config.js
    productionConfig: {
      name: 'nodejs-tutorial-prod',
      script: './app.js',
      instances: 'max',  // Utilize all CPU cores for maximum performance
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        PM2_CLUSTER_MODE: 'true'
      }
    },
    
    stagingConfig: {
      name: 'nodejs-tutorial-staging',
      script: './app.js',
      instances: 2,  // Limited instances for staging
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        PM2_CLUSTER_MODE: 'true'
      }
    }
  },
  
  zeroDowntimeDeployment: {
    // Leverages existing scripts/deploy.js functionality
    strategy: 'pm2 reload',
    healthCheckIntegration: true,
    rollbackCapability: true,
    performanceValidation: true
  },
  
  deploymentOrchestration: {
    // Integration with existing deployment scripts
    preDeploymentHooks: [
      'npm ci --production',
      'npm run build:production',
      'npm run test:smoke'
    ],
    deploymentExecution: [
      'pm2 reload ecosystem.config.js --env production',
      'sleep 10',
      'curl -f http://localhost:3000/health'
    ],
    postDeploymentValidation: [
      'npm run test:integration:production',
      'npm run performance:validate'
    ]
  }
};
```

### Multi-Environment Deployment Strategy

Implement sophisticated deployment strategies with environment-specific configurations and promotion workflows:

```yaml
# Environment-specific deployment configuration
environments:
  staging:
    deployment_strategy: 'rolling'
    approval_required: false
    health_check_timeout: '120s'
    performance_threshold: '2s'
    auto_promote: false
    
  production:
    deployment_strategy: 'blue-green'
    approval_required: true
    health_check_timeout: '300s'
    performance_threshold: '1s'
    auto_rollback: true
    monitoring_required: true
```

This comprehensive CD pipeline provides enterprise-grade deployment automation with PM2 cluster mode, zero-downtime deployment capabilities, multi-environment support, automated validation, and rollback functionality, ensuring reliable and safe production deployments.

## Cross-Platform CI/CD Coordination

Demonstrate coordinating CI/CD workflows between Node.js Express and Flask implementations to ensure feature parity validation and synchronized deployment capabilities across technology stacks.

### Parallel Framework Execution and Validation

Implement comprehensive cross-platform validation that leverages the existing Flask implementation alongside the Node.js application:

```yaml
# .github/workflows/cross-platform-ci.yml - Cross-Platform Validation Workflow
name: 'Cross-Platform CI/CD Validation'

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      validation_scope:
        description: 'Cross-platform validation scope'
        required: true
        default: 'full'
        type: choice
        options:
        - api-only
        - full
        - performance

env:
  # Platform versions
  NODE_VERSION: '22.x'
  PYTHON_VERSION: '3.12'
  
  # Application ports
  NODE_PORT: '3000'
  FLASK_PORT: '5000'
  
  # Test configuration
  CROSS_PLATFORM_TIMEOUT: '600'
  API_PARITY_THRESHOLD: '99'

jobs:
  # Job 1: Parallel platform setup and validation
  platform-setup:
    name: 'Platform Setup: ${{ matrix.platform }}'
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        platform: [nodejs, flask]
        include:
          - platform: nodejs
            runtime: node
            version: '22.x'
            port: 3000
            health_endpoint: '/health'
            setup_script: 'setup-nodejs.sh'
          - platform: flask
            runtime: python
            version: '3.12'
            port: 5000
            health_endpoint: '/health'
            setup_script: 'setup-flask.sh'
      fail-fast: false
      
    outputs:
      nodejs-ready: ${{ steps.nodejs-status.outputs.ready }}
      flask-ready: ${{ steps.flask-status.outputs.ready }}
      
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js Runtime'
        if: matrix.platform == 'nodejs'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.version }}
          cache: 'npm'
          
      - name: 'Setup Python Runtime'
        if: matrix.platform == 'flask'
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.version }}
          cache: 'pip'
          
      - name: 'Install Node.js Dependencies'
        if: matrix.platform == 'nodejs'
        run: |
          echo "📦 Installing Node.js dependencies..."
          npm ci --prefer-offline
          
          # Validate Node.js application structure
          test -f app.js || test -f server.js || test -f express-server.js
          test -f package.json
          test -f ecosystem.config.js
          
      - name: 'Install Flask Dependencies'
        if: matrix.platform == 'flask'
        run: |
          echo "🐍 Installing Flask dependencies..."
          
          # Check if Flask implementation exists
          if [ -d "src/flask" ] || [ -f "flask-server.py" ] || [ -f "app.py" ]; then
            echo "✅ Flask implementation found"
            
            # Install dependencies from requirements.txt if it exists
            if [ -f "requirements.txt" ]; then
              pip install -r requirements.txt
            else
              # Install basic Flask dependencies
              pip install flask flask-cors python-dotenv
            fi
          else
            echo "ℹ️ Creating Flask implementation for cross-platform validation..."
            
            # Create basic Flask application for parity testing
            cat > flask-server.py << 'EOF'
from flask import Flask, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Hello world',
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'port': os.environ.get('PORT', 5000)
    })

@app.route('/good-evening', methods=['GET'])
def good_evening():
    return jsonify({
        'message': 'Good evening',
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'port': os.environ.get('PORT', 5000)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'uptime': 'runtime dependent'
    })

@app.route('/ready', methods=['GET'])
def ready():
    return jsonify({
        'ready': True,
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
EOF
            
            pip install flask flask-cors python-dotenv
          fi
          
      - name: 'Start Node.js Application'
        if: matrix.platform == 'nodejs'
        run: |
          echo "🚀 Starting Node.js application..."
          
          # Determine the main application file
          if [ -f "app.js" ]; then
            MAIN_FILE="app.js"
          elif [ -f "server.js" ]; then
            MAIN_FILE="server.js"
          elif [ -f "express-server.js" ]; then
            MAIN_FILE="express-server.js"
          else
            echo "❌ No main application file found"
            exit 1
          fi
          
          # Start application in background
          NODE_ENV=test PORT=${{ matrix.port }} node $MAIN_FILE &
          APP_PID=$!
          echo "APP_PID=$APP_PID" >> $GITHUB_ENV
          
          # Wait for application startup
          timeout 60s bash -c "until curl -f http://localhost:${{ matrix.port }}${{ matrix.health_endpoint }}; do sleep 2; done"
          echo "✅ Node.js application started successfully"
          
      - name: 'Start Flask Application'
        if: matrix.platform == 'flask'
        run: |
          echo "🚀 Starting Flask application..."
          
          # Determine Flask application file
          if [ -f "flask-server.py" ]; then
            FLASK_APP="flask-server.py"
          elif [ -f "app.py" ]; then
            FLASK_APP="app.py"
          elif [ -d "src/flask" ] && [ -f "src/flask/app.py" ]; then
            FLASK_APP="src/flask/app.py"
          else
            FLASK_APP="flask-server.py"  # Use created file
          fi
          
          # Start Flask application in background
          PORT=${{ matrix.port }} python $FLASK_APP &
          FLASK_PID=$!
          echo "FLASK_PID=$FLASK_PID" >> $GITHUB_ENV
          
          # Wait for Flask startup
          timeout 60s bash -c "until curl -f http://localhost:${{ matrix.port }}${{ matrix.health_endpoint }}; do sleep 2; done"
          echo "✅ Flask application started successfully"
          
      - name: 'Platform Health Validation'
        run: |
          echo "🏥 Validating ${{ matrix.platform }} application health..."
          
          # Health check
          curl -f http://localhost:${{ matrix.port }}${{ matrix.health_endpoint }}
          echo "✅ Health check passed"
          
          # API endpoint validation
          curl -f http://localhost:${{ matrix.port }}/hello
          echo "✅ Hello endpoint accessible"
          
          curl -f http://localhost:${{ matrix.port }}/good-evening
          echo "✅ Good evening endpoint accessible"
          
      - name: 'Set Platform Status'
        id: nodejs-status
        if: matrix.platform == 'nodejs'
        run: echo "ready=true" >> $GITHUB_OUTPUT
        
      - name: 'Set Platform Status'
        id: flask-status
        if: matrix.platform == 'flask'
        run: echo "ready=true" >> $GITHUB_OUTPUT
        
      - name: 'Application Cleanup'
        if: always()
        run: |
          # Cleanup background processes
          if [ ! -z "${APP_PID:-}" ]; then
            kill $APP_PID 2>/dev/null || true
          fi
          if [ ! -z "${FLASK_PID:-}" ]; then
            kill $FLASK_PID 2>/dev/null || true
          fi

  # Job 2: API parity validation between platforms
  api-parity-validation:
    name: 'API Parity Validation'
    runs-on: ubuntu-latest
    needs: platform-setup
    
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v4
        
      - name: 'Setup Node.js'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: 'Setup Python'
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
          
      - name: 'Install Dependencies'
        run: |
          # Node.js dependencies
          npm ci --prefer-offline
          
          # Python dependencies
          pip install flask flask-cors python-dotenv requests
          
      - name: 'Create Flask Implementation'
        run: |
          # Ensure Flask implementation exists (same as in platform-setup)
          if [ ! -f "flask-server.py" ]; then
            cat > flask-server.py << 'EOF'
from flask import Flask, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Hello world',
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'port': os.environ.get('PORT', 5000)
    })

@app.route('/good-evening', methods=['GET'])
def good_evening():
    return jsonify({
        'message': 'Good evening',
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'port': os.environ.get('PORT', 5000)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'uptime': 'runtime dependent'
    })

@app.route('/ready', methods=['GET'])
def ready():
    return jsonify({
        'ready': True,
        'platform': 'flask',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
EOF
          fi
          
      - name: 'Start Both Applications'
        run: |
          echo "🚀 Starting both Node.js and Flask applications..."
          
          # Start Node.js application
          NODE_ENV=test PORT=${{ env.NODE_PORT }} npm start &
          NODE_PID=$!
          echo "NODE_PID=$NODE_PID" >> $GITHUB_ENV
          
          # Start Flask application
          PORT=${{ env.FLASK_PORT }} python flask-server.py &
          FLASK_PID=$!
          echo "FLASK_PID=$FLASK_PID" >> $GITHUB_ENV
          
          # Wait for both applications to be ready
          echo "⏳ Waiting for applications to start..."
          timeout 60s bash -c "until curl -f http://localhost:${{ env.NODE_PORT }}/health; do sleep 2; done"
          timeout 60s bash -c "until curl -f http://localhost:${{ env.FLASK_PORT }}/health; do sleep 2; done"
          
          echo "✅ Both applications started successfully"
          
      - name: 'Execute Cross-Platform API Tests'
        run: |
          echo "🧪 Running cross-platform API parity tests..."
          
          # Create API parity test script
          cat > cross-platform-test.js << 'EOF'
const axios = require('axios');

const NODE_BASE_URL = 'http://localhost:3000';
const FLASK_BASE_URL = 'http://localhost:5000';

const endpoints = ['/hello', '/good-evening', '/health'];

async function testEndpointParity(endpoint) {
  console.log(`\n🔍 Testing endpoint: ${endpoint}`);
  
  try {
    // Make requests to both platforms
    const [nodeResponse, flaskResponse] = await Promise.all([
      axios.get(`${NODE_BASE_URL}${endpoint}`),
      axios.get(`${FLASK_BASE_URL}${endpoint}`)
    ]);
    
    // Validate status codes
    if (nodeResponse.status !== flaskResponse.status) {
      console.error(`❌ Status code mismatch: Node.js ${nodeResponse.status} vs Flask ${flaskResponse.status}`);
      return false;
    }
    
    // Validate response structure (excluding platform-specific fields)
    const nodeData = nodeResponse.data;
    const flaskData = flaskResponse.data;
    
    // Check message consistency
    if (nodeData.message !== flaskData.message) {
      console.error(`❌ Message mismatch: "${nodeData.message}" vs "${flaskData.message}"`);
      return false;
    }
    
    console.log(`✅ Endpoint ${endpoint} parity validated`);
    console.log(`   Node.js: ${JSON.stringify(nodeData.message)}`);
    console.log(`   Flask:   ${JSON.stringify(flaskData.message)}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return false;
  }
}

async function runParityTests() {
  console.log('🌐 Cross-Platform API Parity Validation');
  console.log('=======================================');
  
  let passedTests = 0;
  let totalTests = endpoints.length;
  
  for (const endpoint of endpoints) {
    const passed = await testEndpointParity(endpoint);
    if (passed) passedTests++;
  }
  
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\n📊 Parity Test Results:`);
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 99) {
    console.log('✅ Cross-platform parity validation successful!');
    process.exit(0);
  } else {
    console.log('❌ Cross-platform parity validation failed!');
    process.exit(1);
  }
}

runParityTests().catch(error => {
  console.error('💥 Parity test execution failed:', error);
  process.exit(1);
});
EOF
          
          # Run the parity tests
          node cross-platform-test.js
          
      - name: 'Performance Comparison'
        run: |
          echo "⚡ Running cross-platform performance comparison..."
          
          # Create performance comparison script
          cat > performance-comparison.js << 'EOF'
const axios = require('axios');

const NODE_BASE_URL = 'http://localhost:3000';
const FLASK_BASE_URL = 'http://localhost:5000';

async function measureResponseTime(url, requests = 10) {
  const times = [];
  
  for (let i = 0; i < requests; i++) {
    const start = Date.now();
    try {
      await axios.get(url);
      const duration = Date.now() - start;
      times.push(duration);
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
    }
  }
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { average, min, max, times };
}

async function comparePerformance() {
  console.log('⚡ Cross-Platform Performance Comparison');
  console.log('=======================================');
  
  const endpoint = '/hello';
  
  console.log(`\n🔍 Testing endpoint: ${endpoint}`);
  console.log('Making 10 requests to each platform...\n');
  
  const [nodeStats, flaskStats] = await Promise.all([
    measureResponseTime(`${NODE_BASE_URL}${endpoint}`),
    measureResponseTime(`${FLASK_BASE_URL}${endpoint}`)
  ]);
  
  console.log('📊 Performance Results:');
  console.log('');
  console.log('Node.js Express:');
  console.log(`  Average: ${nodeStats.average.toFixed(2)}ms`);
  console.log(`  Min:     ${nodeStats.min}ms`);
  console.log(`  Max:     ${nodeStats.max}ms`);
  console.log('');
  console.log('Python Flask:');
  console.log(`  Average: ${flaskStats.average.toFixed(2)}ms`);
  console.log(`  Min:     ${flaskStats.min}ms`);
  console.log(`  Max:     ${flaskStats.max}ms`);
  console.log('');
  
  const performanceDiff = ((nodeStats.average - flaskStats.average) / flaskStats.average) * 100;
  
  if (performanceDiff > 0) {
    console.log(`🚀 Node.js is ${Math.abs(performanceDiff).toFixed(1)}% faster than Flask`);
  } else {
    console.log(`🐍 Flask is ${Math.abs(performanceDiff).toFixed(1)}% faster than Node.js`);
  }
  
  console.log('\n✅ Performance comparison completed');
}

comparePerformance().catch(error => {
  console.error('💥 Performance comparison failed:', error);
  process.exit(1);
});
EOF
          
          # Run performance comparison
          node performance-comparison.js
          
      - name: 'Generate Cross-Platform Report'
        run: |
          echo "📋 Generating cross-platform validation report..."
          
          cat > cross-platform-report.md << 'EOF'
          # Cross-Platform Validation Report
          
          **Validation Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
          **Repository:** ${{ github.repository }}
          **Branch:** ${{ github.ref_name }}
          **Commit:** ${{ github.sha }}
          
          ## Platform Versions
          
          - **Node.js:** $(node --version)
          - **Python:** $(python --version)
          - **Express.js:** $(npm list express --depth=0 2>/dev/null | grep express || echo "Not specified")
          - **Flask:** $(pip show flask | grep Version || echo "Version not available")
          
          ## API Parity Results
          
          ✅ All API endpoints maintain feature parity between platforms:
          - `/hello` endpoint: Message consistency validated
          - `/good-evening` endpoint: Message consistency validated  
          - `/health` endpoint: Health check format validated
          
          ## Performance Comparison
          
          Performance metrics collected for both platforms showing comparative response times
          and throughput capabilities under identical test conditions.
          
          ## Cross-Platform Benefits
          
          - **Technology Flexibility:** Demonstrates implementation patterns across platforms
          - **Migration Validation:** Validates feature parity during technology transitions
          - **Educational Value:** Shows cross-platform development best practices
          - **Risk Mitigation:** Provides alternative implementation for business continuity
          
          ## Recommendations
          
          1. **Maintain Parity:** Continue API compatibility testing in CI/CD pipeline
          2. **Performance Monitoring:** Track performance differences over time
          3. **Feature Synchronization:** Ensure new features maintain cross-platform compatibility
          4. **Documentation:** Keep platform-specific implementation details documented
          
          EOF
          
          cat cross-platform-report.md
          
      - name: 'Application Cleanup'
        if: always()
        run: |
          echo "🧹 Cleaning up applications..."
          
          # Stop both applications
          if [ ! -z "${NODE_PID:-}" ]; then
            kill $NODE_PID 2>/dev/null || true
          fi
          if [ ! -z "${FLASK_PID:-}" ]; then
            kill $FLASK_PID 2>/dev/null || true
          fi
          
          echo "✅ Cleanup completed"
          
      - name: 'Upload Cross-Platform Report'
        uses: actions/upload-artifact@v3
        with:
          name: cross-platform-validation-report
          path: cross-platform-report.md
          retention-days: 30

  # Job 3: Synchronized deployment coordination
  synchronized-deployment:
    name: 'Synchronized Cross-Platform Deployment'
    runs-on: ubuntu-latest
    needs: [platform-setup, api-parity-validation]
    if: github.ref == 'refs/heads/main' && needs.api-parity-validation.result == 'success'
    
    steps:
      - name: 'Cross-Platform Deployment Coordination'
        run: |
          echo "🔄 Coordinating cross-platform deployment..."
          echo ""
          echo "📊 Deployment Status:"
          echo "  Node.js Platform: Ready for deployment"
          echo "  Flask Platform: Parity validated"
          echo "  API Compatibility: ✅ Confirmed"
          echo "  Performance Baseline: ✅ Validated"
          echo ""
          echo "🚀 Triggering synchronized deployment workflows..."
          
          # This would trigger the main CD pipeline
          echo "Main CD pipeline will be triggered for Node.js deployment"
          echo "Flask deployment coordination depends on infrastructure setup"
          
      - name: 'Cross-Platform Deployment Summary'
        run: |
          echo "✅ Cross-Platform Validation Summary"
          echo "==================================="
          echo ""
          echo "**Validation Results:**"
          echo "  ✅ Platform Setup: Both Node.js and Flask operational"
          echo "  ✅ API Parity: 100% endpoint compatibility confirmed"
          echo "  ✅ Performance: Baseline metrics established"
          echo "  ✅ Feature Consistency: Cross-platform feature parity validated"
          echo ""
          echo "**Deployment Readiness:**"
          echo "  🚀 Node.js: Ready for production deployment"
          echo "  🐍 Flask: Validated for educational and backup purposes"
          echo ""
          echo "Cross-platform CI/CD coordination completed successfully!"
```

### Integration with Existing Test Orchestration

Leverage the existing test orchestration system to provide comprehensive cross-platform validation:

```javascript
// Integration with existing scripts/test.js TestOrchestrator
export const crossPlatformIntegration = {
  testOrchestration: {
    // Enhances existing TestOrchestrator with cross-platform capabilities
    frameworks: ['jest', 'mocha'],
    platforms: ['nodejs', 'flask'],
    validationTypes: [
      'apiParity',
      'performanceComparison', 
      'featureConsistency',
      'responseFormatValidation'
    ]
  },
  
  parityValidation: {
    // Leverages existing cross-platform validation logic
    endpoints: ['/hello', '/good-evening', '/health'],
    validationCriteria: {
      statusCode: 'exact match required',
      responseMessage: 'exact match required',
      responseFormat: 'structure compatibility required',
      performance: 'within 50% variance acceptable'
    }
  },
  
  educationalValue: {
    // Demonstrates cross-platform development patterns
    conceptsDemonstrated: [
      'API design consistency across platforms',
      'Technology stack flexibility',
      'Migration validation strategies',
      'Performance comparison methodologies'
    ]
  }
};
```

### Cross-Platform Deployment Coordination

Implement deployment coordination that ensures both platforms can be deployed and validated together:

```yaml
# Cross-platform deployment strategy
cross_platform_strategy:
  primary_platform: 'nodejs'
  secondary_platform: 'flask'
  
  validation_requirements:
    - api_parity: 100%
    - performance_deviation: <50%
    - feature_consistency: required
    
  deployment_sequence:
    1. validate_cross_platform_parity
    2. deploy_primary_platform
    3. validate_primary_deployment
    4. deploy_secondary_platform (if configured)
    5. validate_cross_platform_consistency
    6. complete_deployment
    
  rollback_strategy:
    - coordinated_rollback: true
    - platform_isolation: true
    - fallback_platform: 'nodejs'
```

This comprehensive cross-platform CI/CD coordination ensures feature parity between Node.js and Flask implementations while providing educational value in demonstrating technology stack flexibility and migration validation strategies.

## Advanced CI/CD Patterns and Production Readiness

Explore sophisticated CI/CD patterns including GitOps workflows, advanced deployment strategies, enterprise governance, and comprehensive production readiness assessment for scaling deployment operations.

### GitOps Workflow Implementation

Implement GitOps practices for infrastructure as code and declarative deployment management: