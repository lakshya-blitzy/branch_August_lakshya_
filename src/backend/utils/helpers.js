/**
 * @fileoverview Minimal Helper Functions for Node.js Tutorial Project
 * @description Basic implementations of commonly used utility functions
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

// Simple input sanitization
export function sanitizeInput(input, options = {}) {
  if (!input || typeof input !== 'object') {
    return {};
  }
  
  // Basic sanitization - remove null/undefined values
  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Basic performance measurement
export function measurePerformance() {
  const startTime = process.hrtime.bigint();
  
  return {
    end: () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      return { duration };
    },
    getDuration: () => {
      const endTime = process.hrtime.bigint();
      return Number(endTime - startTime) / 1000000;
    }
  };
}

// Basic HTTP response formatting
export function formatHTTPResponse(data, statusCode = 200, options = {}) {
  return {
    status: statusCode,
    data: data,
    timestamp: new Date().toISOString(),
    ...options
  };
}

// Basic Flask format conversion
export function convertToFlaskFormat(response, options = {}) {
  // Simple conversion - just return the response as-is for now
  return {
    ...response,
    flask_compatible: true,
    converted_at: new Date().toISOString()
  };
}

// Request context creation stub
export function createRequestContext(req, options = {}) {
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    method: req?.method || 'GET',
    url: req?.url || '/',
    ...options
  };
}

// Request context validation stub
export function validateRequestContext(context) {
  return {
    isValid: true,
    errors: []
  };
}

// Request data sanitization stub
export function sanitizeRequestData(data) {
  return sanitizeInput(data);
}

// API response formatting stub
export function formatApiResponse(data, options = {}) {
  return formatHTTPResponse(data, 200, options);
}

// Health check creation function
export function createHealthCheck(options = {}) {
  const config = {
    timeout: options.timeout || 5000,
    includeMetrics: options.includeMetrics !== false,
    includeUptime: options.includeUptime !== false,
    ...options
  };
  
  return function healthCheck() {
    const startTime = performance.now();
    
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {}
      };
      
      if (config.includeUptime) {
        health.uptime = {
          seconds: process.uptime(),
          started: new Date(Date.now() - process.uptime() * 1000).toISOString()
        };
      }
      
      if (config.includeMetrics) {
        health.performance = {
          responseTime: performance.now() - startTime,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage ? process.cpuUsage() : null
        };
      }
      
      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          details: 'Health check failed'
        }
      };
    }
  };
}

// Mock response creation function for testing
export function createMockResponse(options = {}) {
  const mockResponse = {
    statusCode: options.statusCode || 200,
    headers: options.headers || {},
    body: options.body || null,
    locals: {},
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.body = JSON.stringify(data);
      this.headers['Content-Type'] = 'application/json';
      return this;
    },
    
    send(data) {
      this.body = data;
      return this;
    },
    
    set(field, value) {
      if (typeof field === 'object') {
        Object.assign(this.headers, field);
      } else {
        this.headers[field] = value;
      }
      return this;
    },
    
    get(field) {
      return this.headers[field];
    },
    
    end(data) {
      if (data !== undefined) {
        this.body = data;
      }
      return this;
    },
    
    // Additional Express response methods
    cookie(name, value, options) {
      // Basic cookie implementation
      return this;
    },
    
    clearCookie(name, options) {
      // Basic clear cookie implementation
      return this;
    },
    
    redirect(status, url) {
      if (typeof status === 'string') {
        url = status;
        status = 302;
      }
      this.statusCode = status;
      this.headers['Location'] = url;
      return this;
    }
  };
  
  return mockResponse;
}

// Deep clone function for object copying
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}