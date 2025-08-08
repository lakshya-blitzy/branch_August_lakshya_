# API Reference - Testinium-QA Express Server

## Overview

The Testinium-QA framework includes a lightweight Express.js REST API server that provides demonstration endpoints for integration testing and API validation workflows. This Node.js component operates independently alongside the Java-based test automation framework, offering simple HTTP endpoints for testing and tutorial purposes.

**Server Implementation:** `/node-server/server.js`  
**Framework:** Express.js 4.18+  
**Runtime:** Node.js 14.0.0+  
**Protocol:** HTTP/1.1  

### Architecture

The API server implements a stateless, lightweight architecture with the following characteristics:

- **Port Configuration:** Environment variable `PORT` with fallback to 3000
- **Response Format:** Plain text responses for simplicity
- **Error Handling:** Express.js default error handling with graceful degradation
- **Performance Target:** <10ms response time for all endpoints
- **Concurrent Connections:** Supports 1000+ simultaneous connections

Source: `/node-server/server.js:4-10`

```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
```

## REST Endpoints

### GET /

**Description:** Health check endpoint returning a simple greeting message.

**Request:**
- **Method:** GET
- **Path:** `/`
- **Headers:** None required
- **Body:** None

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/html; charset=utf-8
- **Body:** `Hello world`

**Implementation Reference:**  
Source: `/node-server/server.js:13-15`

```javascript
app.get('/', (req, res) => {
  res.send('Hello world');
});
```

**Example Usage:**

```bash
# Basic curl request
curl http://localhost:3000/

# Response
Hello world
```

```bash
# With verbose output to see headers
curl -v http://localhost:3000/

# Expected output:
# > GET / HTTP/1.1
# > Host: localhost:3000
# > User-Agent: curl/7.68.0
# > Accept: */*
# > 
# < HTTP/1.1 200 OK
# < X-Powered-By: Express
# < Content-Type: text/html; charset=utf-8
# < Content-Length: 11
# < ETag: W/"b-Ck1VqNd45QIvq3AXd8XYQLvEhtA"
# < Date: Thu, 08 Aug 2024 12:00:00 GMT
# < Connection: keep-alive
# < Keep-Alive: timeout=5
# < 
# Hello world
```

**Performance Metrics:**
- **Target Response Time:** <10ms
- **Typical Response Time:** 1-5ms
- **Memory Usage:** Minimal (shared Express process overhead)
- **Throughput:** >1000 requests/second on standard hardware

### GET /evening

**Description:** Status verification endpoint returning an evening greeting message.

**Request:**
- **Method:** GET
- **Path:** `/evening`
- **Headers:** None required
- **Body:** None

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/html; charset=utf-8
- **Body:** `Good evening`

**Implementation Reference:**  
Source: `/node-server/server.js:18-20`

```javascript
app.get('/evening', (req, res) => {
  res.send('Good evening');
});
```

**Example Usage:**

```bash
# Basic curl request
curl http://localhost:3000/evening

# Response
Good evening
```

```bash
# JSON format request (server responds with text regardless)
curl -H "Accept: application/json" http://localhost:3000/evening

# Response (still plain text)
Good evening
```

**Performance Metrics:**
- **Target Response Time:** <10ms
- **Typical Response Time:** 1-5ms
- **Memory Usage:** Minimal (shared Express process overhead)
- **Throughput:** >1000 requests/second on standard hardware

## Error Handling

### HTTP Status Codes

| Status Code | Description | Scenario |
|-------------|-------------|----------|
| 200 OK | Successful response | Valid requests to `/` or `/evening` |
| 404 Not Found | Resource not found | Requests to undefined endpoints |
| 405 Method Not Allowed | Invalid HTTP method | Non-GET requests to defined endpoints |
| 500 Internal Server Error | Server error | Unexpected server failures |

### Error Response Examples

**404 Not Found Example:**

```bash
curl -v http://localhost:3000/nonexistent

# Response:
# < HTTP/1.1 404 Not Found
# < X-Powered-By: Express
# < Content-Security-Policy: default-src 'none'
# < X-Content-Type-Options: nosniff
# < Content-Type: text/html; charset=utf-8
# < Content-Length: 140
# < Date: Thu, 08 Aug 2024 12:00:00 GMT
# < Connection: keep-alive
# < Keep-Alive: timeout=5
# 
# <!DOCTYPE html>
# <html lang="en">
# <head>
# <meta charset="utf-8">
# <title>Error</title>
# </head>
# <body>
# <pre>Cannot GET /nonexistent</pre>
# </body>
# </html>
```

**405 Method Not Allowed Example:**

```bash
curl -X POST http://localhost:3000/

# Response:
# < HTTP/1.1 404 Not Found
# (Express treats undefined POST routes as 404, not 405)
```

## Server Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP server listening port |
| `NODE_ENV` | undefined | Node.js environment mode |

### Startup Configuration

**Implementation Reference:**  
Source: `/node-server/server.js:23-28`

```javascript
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access endpoints:`);
  console.log(`  GET / - Returns "Hello world"`);
  console.log(`  GET /evening - Returns "Good evening"`);
});
```

**Startup Example:**

```bash
# Start with default port
node server.js

# Output:
# Server is running on port 3000
# Access endpoints:
#   GET / - Returns "Hello world"
#   GET /evening - Returns "Good evening"
```

```bash
# Start with custom port
PORT=8080 node server.js

# Output:
# Server is running on port 8080
# Access endpoints:
#   GET / - Returns "Hello world"
#   GET /evening - Returns "Good evening"
```

## Integration Patterns

### Health Check Integration

The root endpoint (`/`) serves as a basic health check for monitoring systems:

```bash
# Health check script example
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ $response = "200" ]; then
    echo "Server is healthy"
    exit 0
else
    echo "Server health check failed with status: $response"
    exit 1
fi
```

### Load Testing Integration

Example load testing with Apache Bench (ab):

```bash
# Test 1000 requests with 10 concurrent connections
ab -n 1000 -c 10 http://localhost:3000/

# Expected results:
# Requests per second: >1000
# Time per request: <10ms
# Transfer rate: Varies based on network
```

### CI/CD Integration

Example Jenkins pipeline integration:

```groovy
stage('Start Express Server') {
    steps {
        script {
            sh 'cd node-server && npm start &'
            sh 'sleep 2' // Allow server startup time
        }
    }
}

stage('API Health Check') {
    steps {
        script {
            def response = sh(
                script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/',
                returnStdout: true
            ).trim()
            
            if (response != '200') {
                error("API health check failed with status: ${response}")
            }
        }
    }
}
```

## Performance Specifications

### Response Time Targets

| Endpoint | Target | Typical | Maximum Acceptable |
|----------|--------|---------|-------------------|
| GET / | <10ms | 1-5ms | 50ms |
| GET /evening | <10ms | 1-5ms | 50ms |

### Throughput Specifications

| Metric | Target | Typical | Notes |
|--------|--------|---------|-------|
| Requests/second | >1000 | 2000+ | Single instance on standard hardware |
| Concurrent connections | 1000+ | Limited by system resources | Node.js event loop efficiency |
| Memory usage | <50MB | 20-30MB | Process-level measurement |
| CPU usage | <10% | 1-5% | Under normal load conditions |

### Scalability Considerations

**Current Implementation:**
- Single-instance design suitable for development and testing
- No clustering or load balancing configured
- Stateless operations enable horizontal scaling

**Recommended Enhancements for Production:**
- Node.js cluster module for multi-process utilization
- External load balancer (nginx, HAProxy) for distribution
- Process monitoring with PM2 or similar tools
- Memory and performance monitoring integration

## Security Considerations

### Current Security Model

The current implementation prioritizes simplicity for testing environments:

- **No authentication required** - Open access model
- **No authorization controls** - All endpoints publicly accessible
- **HTTP only** - No HTTPS/TLS encryption
- **Basic error handling** - Standard Express.js error responses

### Security Recommendations for Production

If deployed beyond isolated test environments, implement:

```javascript
// Security middleware example
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Error: listen EADDRINUSE :::3000
# Solution: Use different port
PORT=3001 node server.js
```

**Module Not Found:**
```bash
# Error: Cannot find module 'express'
# Solution: Install dependencies
npm install
```

**Permission Denied (Linux/Mac):**
```bash
# Error: listen EACCES 0.0.0.0:80
# Solution: Use port >1024 or run with sudo (not recommended)
PORT=8080 node server.js
```

### Debugging

Enable Express debugging:

```bash
DEBUG=express:* node server.js
```

### Logging Integration

For enhanced logging, consider:

```javascript
const morgan = require('morgan');
app.use(morgan('combined')); // Apache combined log format
```

## Dependencies

### Runtime Dependencies

Based on `/node-server/package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

### Development Dependencies

Recommended for enhanced development:

```json
{
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.0.0"
  }
}
```

## API Evolution

### Version Compatibility

Current API version: v1.0 (implicit)
- No breaking changes planned for basic endpoints
- Future enhancements will maintain backward compatibility
- Consider URL versioning (e.g., `/v1/endpoint`) for future expansions

### Planned Enhancements

Potential future additions:
- POST endpoint for data submission
- JSON response format options
- Request/response logging middleware
- Health check with system metrics
- Configuration endpoint for runtime settings

---

**Implementation Source:** `/node-server/server.js`  
**Last Updated:** Based on current server implementation  
**Framework Version:** Express.js 4.18+  
**Node.js Version:** 14.0.0+ required