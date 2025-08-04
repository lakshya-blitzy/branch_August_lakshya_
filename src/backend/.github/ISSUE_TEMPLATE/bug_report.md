---
name: Bug Report
about: Create a report to help us improve the Node.js tutorial project
title: '[BUG] Brief description of the issue'
labels: ['bug', 'needs-triage']
assignees: []
---

# Bug Report

## 📋 Bug Description

**Clear and Concise Description:**
Provide a clear and concise description of the bug and its impact on the tutorial learning experience.

**Expected Behavior:**
Describe what you expected to happen based on the tutorial documentation.

**Actual Behavior:**
Describe what actually happened during tutorial execution.

**Educational Impact:**
- [ ] Prevents tutorial progression or completion
- [ ] Affects learning objectives for specific phase
- [ ] Causes confusion about technical concepts
- [ ] Breaks educational examples or explanations
- [ ] Impacts cross-platform learning comparison

**Frequency of Occurrence:**
- [ ] Always (100% reproducible)
- [ ] Sometimes (intermittent issue)
- [ ] Rarely (hard to reproduce)
- [ ] Once (single occurrence)

---

## 🎓 Tutorial Phase Information

**Affected Tutorial Phase:**
- [ ] Phase 1: Basic HTTP Server Implementation
- [ ] Phase 2: Express.js v5.1.0 Framework Integration
- [ ] Phase 3: Cross-Platform Flask Migration
- [ ] Phase 4: Comprehensive Testing Suite (Jest/Mocha)
- [ ] Phase 5: PM2 Production Deployment & Cluster Mode
- [ ] Phase 6: Security Implementation (Helmet.js + Headers)
- [ ] Phase 7: Documentation & Production Readiness

**Specific Lesson/Step:**
Identify the specific lesson or step within the tutorial phase where the issue occurs.

**Implementation Type:**
- [ ] Node.js/Express.js implementation
- [ ] Python/Flask implementation
- [ ] Both implementations affected
- [ ] Cross-platform comparison issue

**Related Tutorial Files:**
List the specific files or components involved in the bug (e.g., `server.js`, `app.js`, `ecosystem.config.js`).

---

## 🔄 Steps to Reproduce

**Detailed Reproduction Steps:**

1. **Environment Setup:**
   ```bash
   # Commands used to set up environment
   ```

2. **Specific Actions Taken:**
   ```bash
   # Step-by-step commands or actions
   ```

3. **Input Data/Configuration:**
   ```bash
   # Any specific input data or configuration used
   ```

4. **Expected vs Actual Results:**
   ```bash
   # What should happen vs what actually happens
   ```

**Minimal Reproduction Example:**
```javascript
// Include minimal code example that reproduces the issue
```

**Environmental Conditions:**
- Time of day: 
- System load: 
- Network conditions:
- Concurrent processes:

---

## 💻 Environment Details

**System Information:**
- **Operating System:** (e.g., Ubuntu 22.04, macOS 13.1, Windows 11)
- **Architecture:** (e.g., x64, arm64)
- **Shell/Terminal:** (e.g., bash, zsh, PowerShell)

**Node.js Environment:**
- **Node.js Version:** (run `node --version`) [Required: ≥22.0.0]
- **npm Version:** (run `npm --version`) [Required: ≥10.0.0]
- **Package Manager:** (npm, yarn, pnpm)

**Framework Versions:**
- **Express.js Version:** (check `package.json`) [Current: 5.1.0]
- **PM2 Version:** (run `pm2 --version`) [If applicable]
- **Python Version:** (run `python --version`) [If using Flask: ≥3.9]
- **Flask Version:** (run `flask --version`) [If applicable: 3.1.1]

**Development Tools:**
- **IDE/Editor:** (e.g., VS Code, WebStorm, Vim)
- **Git Version:** (run `git --version`)
- **Docker Version:** (if applicable)

---

## 🐛 Error Information

**Complete Error Messages:**
```
Paste complete error messages and stack traces here
```

**Console Output:**
```
Include relevant console output, debug information, and warnings
```

**PM2 Process Information (if applicable):**
```bash
# Output of pm2 status
# Output of pm2 logs --lines 20
# Output of pm2 describe nodejs-tutorial-app
```

**Browser Console Errors (if applicable):**
```
Include any browser console errors if the issue affects frontend functionality
```

**Log Files:**
```
Include relevant entries from log files (./logs/, PM2 logs, etc.)
```

**Network Information (if applicable):**
```bash
# Output of curl commands
# Network request/response details
# CORS or security header issues
```

---

## 🧪 Testing Impact

**Test Framework Affected:**
- [ ] Jest testing framework
- [ ] Mocha testing framework
- [ ] Both testing frameworks
- [ ] Performance testing
- [ ] Security testing

**Test Coverage Impact:**
- [ ] Unit tests failing
- [ ] Integration tests failing
- [ ] End-to-end tests failing
- [ ] Coverage below threshold (≥90%)
- [ ] Test execution errors

**Specific Test Failures:**
```
Include specific test failure output and error messages
```

**Performance Impact:**
- [ ] Response time degradation
- [ ] Memory usage increase
- [ ] CPU usage increase
- [ ] Throughput reduction

**Test Commands Affected:**
```bash
# List specific npm test commands that fail
npm test
npm run test:coverage
npm run test:performance
```

---

## 🔒 Security Considerations

> **⚠️ Important:** For security vulnerabilities, please use our [Security Policy](../../SECURITY.md) and GitHub Security Advisories for responsible disclosure.

**Security Assessment:**
- [ ] This is NOT a security vulnerability
- [ ] Potential security concern (please use SECURITY.md procedures)
- [ ] Security configuration issue
- [ ] Helmet.js implementation problem
- [ ] Express.js v5.1.0 security feature issue

**Security Headers Impact:**
- [ ] Missing or incorrect security headers
- [ ] Content Security Policy violations
- [ ] CORS configuration issues
- [ ] Authentication/authorization problems

**Helmet.js Configuration Issues:**
```javascript
// Include any Helmet.js configuration problems
```

**Security Testing Results:**
```bash
# Output of npm run security:audit
# Any security scan results
```

---

## 🌐 Cross-Platform Validation

**Node.js Implementation Behavior:**
```
Describe the behavior in the Node.js/Express.js implementation
```

**Python/Flask Implementation Behavior:**
```
Describe the behavior in the Python/Flask implementation (if applicable)
```

**Feature Parity Issues:**
- [ ] API response format differences
- [ ] Status code inconsistencies
- [ ] Performance characteristic variations
- [ ] Configuration differences
- [ ] Deployment procedure discrepancies

**Cross-Platform Testing Commands:**
```bash
# Commands used to test both implementations
npm run flask:setup
npm run flask:compare
```

**Compatibility Matrix:**
| Feature | Node.js Status | Flask Status | Parity Status |
|---------|---------------|---------------|---------------|
| API Endpoints | ✅/❌ | ✅/❌ | ✅/❌ |
| Response Format | ✅/❌ | ✅/❌ | ✅/❌ |
| Error Handling | ✅/❌ | ✅/❌ | ✅/❌ |
| Performance | ✅/❌ | ✅/❌ | ✅/❌ |

---

## 📎 Additional Context

**Screenshots or Video:**
<!-- Drag and drop screenshots or video recordings of the issue -->

**Configuration Files:**
```javascript
// Include relevant configuration files or code snippets
// e.g., ecosystem.config.js, package.json, .env files (without sensitive data)
```

**Related Issues:**
- Link to any related GitHub issues or discussions
- Reference to similar problems encountered

**Workarounds Attempted:**
1. **Workaround 1:** Description and effectiveness
2. **Workaround 2:** Description and effectiveness
3. **Workaround 3:** Description and effectiveness

**Timeline Information:**
- **When did this issue first appear?**
- **Was it working before?** (If yes, when did it break?)
- **Any recent changes made?** (dependencies, configuration, environment)

**Community Resources Consulted:**
- [ ] Reviewed [README.md troubleshooting section](../../README.md#troubleshooting)
- [ ] Consulted [Contributing Guidelines](../../.github/CONTRIBUTING.md)
- [ ] Checked existing GitHub issues
- [ ] Searched Stack Overflow or other forums

---

## 🎯 Educational Impact Assessment

**Learning Objectives Affected:**
Describe how this bug affects the specific learning objectives for the tutorial phase.

**Beginner vs Advanced Impact:**
- [ ] Primarily affects beginners learning Node.js
- [ ] Affects intermediate developers learning frameworks
- [ ] Impacts advanced developers learning production deployment
- [ ] Affects all skill levels equally

**Concept Confusion:**
Describe any confusion this bug might cause regarding technical concepts being taught.

**Suggested Educational Improvements:**
Provide suggestions for improving error handling, documentation, or teaching approach.

---

## ✅ Bug Report Checklist

**Pre-Submission Verification:**
- [ ] Searched existing issues for similar bug reports
- [ ] Reviewed [troubleshooting section](../../README.md#troubleshooting) in README.md
- [ ] Verified environment meets minimum requirements (Node.js ≥22.0.0)
- [ ] Tested on clean installation when possible
- [ ] Included complete reproduction steps with expected vs actual results
- [ ] Provided relevant error messages and logs without sensitive information
- [ ] Assessed cross-platform impact if applicable (Node.js vs Flask)
- [ ] Followed [community guidelines](../../.github/CODE_OF_CONDUCT.md) for respectful communication
- [ ] Used appropriate labels and provided comprehensive information

**Educational Validation:**
- [ ] Confirmed issue impacts learning progression or educational value
- [ ] Identified specific tutorial phase and learning objectives affected
- [ ] Considered impact on different skill levels (beginner, intermediate, advanced)
- [ ] Provided context for how fix would improve educational experience

**Technical Validation:**
- [ ] Verified issue is reproducible with provided steps
- [ ] Included all relevant technical details and environment information
- [ ] Assessed security implications and used appropriate reporting channels
- [ ] Tested both implementations if cross-platform issue
- [ ] Included performance impact assessment if applicable

---

## 📞 Additional Support

**For Complex Issues:**
- **GitHub Discussions:** Use for questions and clarifications
- **Security Issues:** Follow [Security Policy](../../SECURITY.md) procedures
- **Educational Support:** Community mentoring available for learning-related issues

**Documentation References:**
- [Contributing Guidelines](../../.github/CONTRIBUTING.md) - Comprehensive development standards
- [Security Policy](../../SECURITY.md) - Vulnerability reporting procedures  
- [README.md](../../README.md) - Project documentation and troubleshooting
- [Code of Conduct](../../.github/CODE_OF_CONDUCT.md) - Community behavioral standards

---

*Thank you for contributing to the Node.js Tutorial Project! Your bug reports help improve the educational experience for developers learning modern web development practices.*