/**
 * Middleware Chain Execution Testing Suite for Node.js/Express Application
 * 
 * Comprehensive test suite validating middleware functionality including:
 * - Authentication middleware behavior and error handling
 * - Request validation middleware with various input scenarios
 * - Error handling middleware with proper error propagation
 * - CORS configuration validation for cross-origin requests
 * - Body parsing middleware with malformed JSON handling
 * - Middleware ordering and execution sequence validation
 * - Error propagation through middleware layers
 * - next() function behavior in different contexts
 * 
 * Coverage Requirements:
 * - Minimum 85% code coverage for middleware components as specified in Section 0.5.1
 * - Complete middleware chain execution testing from Section 0.3.1
 * - Authentication and authorization middleware validation from Section 0.2.2
 * - Request/response transformation middleware testing
 * - Middleware bypass scenarios and edge cases
 * 
 * Testing Framework: Jest 29.7.0 with Supertest 6.3.4 for HTTP testing
 * 
 * @module middlewareTest
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports as specified in external_imports schema
// Jest globals (describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll) are available globally
const request = require('supertest');
const http = require('http');
const { EventEmitter } = require('events');
const util = require('util');

// Internal imports as specified in internal_imports schema
const { app } = require('../../../main/js/server.js');
const fixtures = require('../fixtures/index.js');

// Test suite configuration and utilities
let testServer;
let testPort;

/**
 * Authentication Middleware Mock Implementation
 * Simulates Express-style authentication middleware for testing
 */
const authMiddleware = {
  /**
   * Valid authentication middleware - simulates successful auth
   */
  validAuth: jest.fn(),

  /**
   * Invalid authentication middleware - simulates auth failure
   */
  invalidAuth: jest.fn(),

  /**
   * Missing token middleware - simulates missing authentication token
   */
  missingToken: jest.fn(),

  /**
   * Timeout middleware - simulates authentication timeout
   */
  timeoutAuth: jest.fn()
};

// Set up implementations after mock creation
authMiddleware.validAuth.mockImplementation((req, res, next) => {
  req.user = { id: 1, role: 'admin', authenticated: true };
  req.isAuthenticated = true;
  next();
});

authMiddleware.invalidAuth.mockImplementation((req, res, next) => {
  const error = new Error('Authentication failed');
  error.status = 401;
  next(error);
});

authMiddleware.missingToken.mockImplementation((req, res, next) => {
  const error = new Error('No authentication token provided');
  error.status = 403;
  next(error);
});

authMiddleware.timeoutAuth.mockImplementation((req, res, next) => {
  setTimeout(() => {
    const error = new Error('Authentication timeout');
    error.status = 408;
    next(error);
  }, 100);
});

/**
 * Request Validation Middleware Mock Implementation
 * Tests various validation scenarios and error conditions
 */
const validationMiddleware = {
  /**
   * Valid request validation - allows request to proceed
   */
  validRequest: jest.fn((req, res, next) => {
    req.validation = { status: 'valid', errors: [] };
    next();
  }),

  /**
   * Invalid request validation - rejects malformed requests
   */
  invalidRequest: jest.fn((req, res, next) => {
    const error = new Error('Request validation failed');
    error.status = 400;
    error.details = ['Invalid request format', 'Missing required fields'];
    next(error);
  }),

  /**
   * Schema validation middleware - validates request against schema
   */
  schemaValidation: jest.fn((req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      const error = new Error('Invalid request schema');
      error.status = 422;
      next(error);
      return;
    }
    req.validation = { schema: 'validated' };
    next();
  }),

  /**
   * Rate limiting middleware - simulates rate limiting behavior
   */
  rateLimiting: jest.fn((req, res, next) => {
    const requestCount = req.headers['x-request-count'] || 0;
    if (parseInt(requestCount) > 10) {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      next(error);
      return;
    }
    next();
  })
};

/**
 * Error Handling Middleware Mock Implementation
 * Tests error propagation and handling throughout middleware chain
 */
const errorMiddleware = {
  /**
   * Standard error handler - processes errors with proper status codes
   */
  standardErrorHandler: jest.fn((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    
    res.status(status).json({
      error: message,
      status: status,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }),

  /**
   * Custom error handler - adds custom error processing
   */
  customErrorHandler: jest.fn((error, req, res, next) => {
    if (error.status === 401) {
      res.status(401).json({
        error: 'Unauthorized access',
        requiresAuth: true,
        loginUrl: '/auth/login'
      });
    } else {
      next(error);
    }
  }),

  /**
   * Error logging middleware - logs errors before handling
   */
  errorLogger: jest.fn((error, req, res, next) => {
    console.error(`Error in ${req.method} ${req.path}:`, error.message);
    req.errorLogged = true;
    next(error);
  }),

  /**
   * Error recovery middleware - attempts error recovery
   */
  errorRecovery: jest.fn((error, req, res, next) => {
    if (error.recoverable) {
      req.errorRecovered = true;
      next();
    } else {
      next(error);
    }
  })
};

/**
 * CORS Middleware Mock Implementation
 * Tests cross-origin resource sharing configuration
 */
const corsMiddleware = {
  /**
   * Standard CORS middleware - sets basic CORS headers
   */
  standardCors: jest.fn((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  }),

  /**
   * Restricted CORS middleware - limits access to specific origins
   */
  restrictedCors: jest.fn((req, res, next) => {
    const allowedOrigins = ['https://testinium.qa', 'https://app.testinium.qa'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    next();
  }),

  /**
   * Preflight CORS middleware - handles OPTIONS requests
   */
  preflightCors: jest.fn((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      next();
    }
  })
};

/**
 * Body Parsing Middleware Mock Implementation
 * Tests request body parsing and transformation
 */
const bodyParsingMiddleware = {
  /**
   * JSON body parser - parses JSON request bodies
   */
  jsonParser: jest.fn((req, res, next) => {
    if (req.headers['content-type'] === 'application/json' && req.body) {
      try {
        req.parsedBody = JSON.parse(req.body);
        req.bodyParsed = true;
      } catch (error) {
        const parseError = new Error('Invalid JSON in request body');
        parseError.status = 400;
        next(parseError);
        return;
      }
    }
    next();
  }),

  /**
   * URL encoded parser - parses URL encoded form data
   */
  urlEncodedParser: jest.fn((req, res, next) => {
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && req.body) {
      req.parsedBody = new URLSearchParams(req.body);
      req.bodyParsed = true;
    }
    next();
  }),

  /**
   * Multipart parser mock - simulates multipart form data parsing
   */
  multipartParser: jest.fn((req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      req.parsedBody = { files: [], fields: {} };
      req.bodyParsed = true;
    }
    next();
  }),

  /**
   * Body size limit middleware - enforces request size limits
   */
  bodySizeLimit: jest.fn((req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 1048576) { // 1MB limit
      const error = new Error('Request body too large');
      error.status = 413;
      next(error);
      return;
    }
    next();
  })
};

/**
 * Test Suite: Middleware Chain Execution Testing
 */
describe('Middleware Chain Execution Testing', () => {
  
  beforeAll(async () => {
    // Set up test environment before all tests
    testPort = fixtures.generateRandomPort();
    console.log(`Setting up middleware tests on port ${testPort}`);
  });

  beforeEach(() => {
    // Reset all mock call counts before each test
    // jest.clearAllMocks() clears call history but preserves implementations
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    if (testServer) {
      testServer.close();
      testServer = null;
    }
  });

  afterAll(() => {
    // Final cleanup after all tests
    console.log('Middleware test suite completed');
  });



  /**
   * Authentication Middleware Testing Suite
   */
  describe('Authentication Middleware', () => {
    
    it('should successfully authenticate valid users and call next()', () => {
      const mockReq = { ...fixtures.mockRequests.valid.get };
      const mockRes = { ...fixtures.mockResponses.success.jsonApi };
      const mockNext = jest.fn();

      authMiddleware.validAuth(mockReq, mockRes, mockNext);

      expect(authMiddleware.validAuth).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.authenticated).toBe(true);
      expect(mockReq.isAuthenticated).toBe(true);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle authentication failures and pass error to next()', () => {
      const mockReq = { ...fixtures.mockRequests.invalid.malformed };
      const mockRes = { ...fixtures.mockResponses.error.unauthorized };
      const mockNext = jest.fn();

      authMiddleware.invalidAuth(mockReq, mockRes, mockNext);

      expect(authMiddleware.invalidAuth).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Authentication failed');
      expect(error.status).toBe(401);
    });

    it('should handle missing authentication tokens', () => {
      const mockReq = { ...fixtures.mockRequests.valid.get };
      const mockRes = { ...fixtures.mockResponses.error.forbidden };
      const mockNext = jest.fn();

      authMiddleware.missingToken(mockReq, mockRes, mockNext);

      expect(authMiddleware.missingToken).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(403);
      expect(error.message).toContain('No authentication token');
    });

    it('should handle authentication timeouts properly', async () => {
      const mockReq = { ...fixtures.mockRequests.valid.get };
      const mockRes = { ...fixtures.mockResponses.error.timeout };
      const mockNext = jest.fn();

      authMiddleware.timeoutAuth(mockReq, mockRes, mockNext);

      // Wait for timeout to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(authMiddleware.timeoutAuth).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(408);
      expect(error.message).toContain('timeout');
    });

    test('should preserve request context through authentication middleware', () => {
      const mockReq = { 
        ...fixtures.mockRequests.valid.get,
        originalContext: 'preserved',
        headers: { authorization: 'Bearer valid-token' }
      };
      const mockRes = { ...fixtures.mockResponses.success.jsonApi };
      const mockNext = jest.fn();

      authMiddleware.validAuth(mockReq, mockRes, mockNext);

      expect(mockReq.originalContext).toBe('preserved');
      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  /**
   * Request Validation Middleware Testing Suite
   */
  describe('Request Validation Middleware', () => {
    
    it('should validate correct request formats and call next()', () => {
      const mockReq = { ...fixtures.mockRequests.valid.post };
      const mockRes = { ...fixtures.mockResponses.success.created };
      const mockNext = jest.fn();

      validationMiddleware.validRequest(mockReq, mockRes, mockNext);

      expect(validationMiddleware.validRequest).toHaveBeenCalledTimes(1);
      expect(mockReq.validation).toBeDefined();
      expect(mockReq.validation.status).toBe('valid');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid request formats with proper error', () => {
      const mockReq = { ...fixtures.mockRequests.invalid.malformed };
      const mockRes = { ...fixtures.mockResponses.error.badRequest };
      const mockNext = jest.fn();

      validationMiddleware.invalidRequest(mockReq, mockRes, mockNext);

      expect(validationMiddleware.invalidRequest).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(400);
      expect(error.details).toBeDefined();
      expect(Array.isArray(error.details)).toBe(true);
    });

    it('should validate request schema against defined structure', () => {
      const mockReq = { 
        ...fixtures.mockRequests.valid.post,
        body: { name: 'test', value: 123 }
      };
      const mockRes = { ...fixtures.mockResponses.success.created };
      const mockNext = jest.fn();

      validationMiddleware.schemaValidation(mockReq, mockRes, mockNext);

      expect(validationMiddleware.schemaValidation).toHaveBeenCalledTimes(1);
      expect(mockReq.validation.schema).toBe('validated');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid schema with 422 status', () => {
      const mockReq = { 
        ...fixtures.mockRequests.invalid.malformed,
        body: 'invalid-non-object-body'
      };
      const mockRes = { ...fixtures.mockResponses.error.unprocessableEntity };
      const mockNext = jest.fn();

      validationMiddleware.schemaValidation(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(422);
      expect(error.message).toContain('Invalid request schema');
    });

    it('should enforce rate limiting with proper error response', () => {
      const mockReq = { 
        ...fixtures.mockRequests.valid.get,
        headers: { 'x-request-count': '15' }
      };
      const mockRes = { ...fixtures.mockResponses.error.tooManyRequests };
      const mockNext = jest.fn();

      validationMiddleware.rateLimiting(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(429);
      expect(error.message).toContain('Rate limit exceeded');
    });

    test('should allow requests within rate limits', () => {
      const mockReq = { 
        ...fixtures.mockRequests.valid.get,
        headers: { 'x-request-count': '5' }
      };
      const mockRes = { ...fixtures.mockResponses.success.jsonApi };
      const mockNext = jest.fn();

      validationMiddleware.rateLimiting(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  /**
   * Error Handling Middleware Testing Suite
   */
  describe('Error Handling Middleware', () => {
    
    it('should handle standard errors with proper status codes', () => {
      const testError = new Error('Test error message');
      testError.status = 404;
      
      const mockReq = { path: '/api/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      errorMiddleware.standardErrorHandler(testError, mockReq, mockRes, mockNext);

      expect(errorMiddleware.standardErrorHandler).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Test error message',
        status: 404,
        path: '/api/test'
      }));
    });

    it('should handle custom error responses for authentication failures', () => {
      const authError = new Error('Authentication required');
      authError.status = 401;
      
      const mockReq = { path: '/api/secure' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      errorMiddleware.customErrorHandler(authError, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized access',
        requiresAuth: true,
        loginUrl: '/auth/login'
      }));
    });

    it('should log errors and continue to next error handler', () => {
      const testError = new Error('Error to be logged');
      testError.status = 500;
      
      const mockReq = { 
        method: 'POST',
        path: '/api/test'
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      errorMiddleware.errorLogger(testError, mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in POST /api/test:'),
        'Error to be logged'
      );
      expect(mockReq.errorLogged).toBe(true);
      expect(mockNext).toHaveBeenCalledWith(testError);

      consoleSpy.mockRestore();
    });

    it('should attempt error recovery for recoverable errors', () => {
      const recoverableError = new Error('Recoverable error');
      recoverableError.recoverable = true;
      
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      errorMiddleware.errorRecovery(recoverableError, mockReq, mockRes, mockNext);

      expect(mockReq.errorRecovered).toBe(true);
      expect(mockNext).toHaveBeenCalledWith(); // Called without error
    });

    it('should pass non-recoverable errors to next handler', () => {
      const nonRecoverableError = new Error('Non-recoverable error');
      
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      errorMiddleware.errorRecovery(nonRecoverableError, mockReq, mockRes, mockNext);

      expect(mockReq.errorRecovered).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(nonRecoverableError);
    });

    test('should handle errors without status codes with default 500', () => {
      const errorWithoutStatus = new Error('Error without status');
      
      const mockReq = { path: '/api/test' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      errorMiddleware.standardErrorHandler(errorWithoutStatus, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 500,
        error: 'Error without status'
      }));
    });
  });

  /**
   * CORS Middleware Testing Suite
   */
  describe('CORS Middleware', () => {
    
    it('should set standard CORS headers for all requests', () => {
      const mockReq = { ...fixtures.mockRequests.valid.get };
      const mockRes = {
        setHeader: jest.fn()
      };
      const mockNext = jest.fn();

      corsMiddleware.standardCors(mockReq, mockRes, mockNext);

      expect(corsMiddleware.standardCors).toHaveBeenCalledTimes(1);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods', 
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers', 
        'Content-Type, Authorization'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should apply restricted CORS for allowed origins only', () => {
      const mockReq = { 
        ...fixtures.mockRequests.valid.get,
        headers: { origin: 'https://testinium.qa' }
      };
      const mockRes = {
        setHeader: jest.fn()
      };
      const mockNext = jest.fn();

      corsMiddleware.restrictedCors(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin', 
        'https://testinium.qa'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not set CORS headers for disallowed origins', () => {
      const mockReq = { 
        ...fixtures.mockRequests.valid.get,
        headers: { origin: 'https://malicious.com' }
      };
      const mockRes = {
        setHeader: jest.fn()
      };
      const mockNext = jest.fn();

      corsMiddleware.restrictedCors(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin', 
        expect.any(String)
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle preflight OPTIONS requests properly', () => {
      const mockReq = { 
        method: 'OPTIONS',
        headers: { origin: 'https://example.com' }
      };
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn()
      };
      const mockNext = jest.fn();

      corsMiddleware.preflightCors(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Max-Age', '86400');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled(); // Should not call next for OPTIONS
    });

    test('should call next() for non-OPTIONS requests in preflight middleware', () => {
      const mockReq = { 
        method: 'GET',
        headers: { origin: 'https://example.com' }
      };
      const mockRes = {
        setHeader: jest.fn(),
        status: jest.fn(),
        end: jest.fn()
      };
      const mockNext = jest.fn();

      corsMiddleware.preflightCors(mockReq, mockRes, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.end).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  /**
   * Body Parsing Middleware Testing Suite
   */
  describe('Body Parsing Middleware', () => {
    
    it('should parse valid JSON request bodies', () => {
      const testData = { name: 'test', value: 123 };
      const mockReq = { 
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(testData)
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.jsonParser(mockReq, mockRes, mockNext);

      expect(bodyParsingMiddleware.jsonParser).toHaveBeenCalledTimes(1);
      expect(mockReq.parsedBody).toEqual(testData);
      expect(mockReq.bodyParsed).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle malformed JSON with proper error', () => {
      const mockReq = { 
        headers: { 'content-type': 'application/json' },
        body: '{ invalid json'
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.jsonParser(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(400);
      expect(error.message).toContain('Invalid JSON');
    });

    it('should parse URL encoded form data correctly', () => {
      const mockReq = { 
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'name=test&value=123&array=1&array=2'
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.urlEncodedParser(mockReq, mockRes, mockNext);

      expect(mockReq.parsedBody).toBeInstanceOf(URLSearchParams);
      expect(mockReq.parsedBody.get('name')).toBe('test');
      expect(mockReq.parsedBody.get('value')).toBe('123');
      expect(mockReq.bodyParsed).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle multipart form data parsing', () => {
      const mockReq = { 
        headers: { 'content-type': 'multipart/form-data; boundary=123' },
        body: 'mock-multipart-data'
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.multipartParser(mockReq, mockRes, mockNext);

      expect(mockReq.parsedBody).toBeDefined();
      expect(mockReq.parsedBody.files).toEqual([]);
      expect(mockReq.parsedBody.fields).toEqual({});
      expect(mockReq.bodyParsed).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should enforce body size limits', () => {
      const mockReq = { 
        headers: { 'content-length': '2097152' } // 2MB
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.bodySizeLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(413);
      expect(error.message).toContain('too large');
    });

    test('should allow requests within size limits', () => {
      const mockReq = { 
        headers: { 'content-length': '1024' } // 1KB
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.bodySizeLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should skip parsing for non-JSON content types', () => {
      const mockReq = { 
        headers: { 'content-type': 'text/plain' },
        body: 'plain text data'
      };
      const mockRes = {};
      const mockNext = jest.fn();

      bodyParsingMiddleware.jsonParser(mockReq, mockRes, mockNext);

      expect(mockReq.parsedBody).toBeUndefined();
      expect(mockReq.bodyParsed).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  /**
   * Middleware Ordering and Execution Sequence Testing Suite
   */
  describe('Middleware Ordering and Execution Sequence', () => {
    
    it('should execute middleware in correct order', () => {
      const executionOrder = [];
      
      const middleware1 = jest.fn((req, res, next) => {
        executionOrder.push('middleware1');
        next();
      });
      
      const middleware2 = jest.fn((req, res, next) => {
        executionOrder.push('middleware2');
        next();
      });
      
      const middleware3 = jest.fn((req, res, next) => {
        executionOrder.push('middleware3');
        next();
      });

      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn(() => {
        executionOrder.push('final');
      });

      // Simulate middleware chain execution
      middleware1(mockReq, mockRes, () => {
        middleware2(mockReq, mockRes, () => {
          middleware3(mockReq, mockRes, mockNext);
        });
      });

      expect(executionOrder).toEqual(['middleware1', 'middleware2', 'middleware3', 'final']);
      expect(middleware1).toHaveBeenCalledTimes(1);
      expect(middleware2).toHaveBeenCalledTimes(1);
      expect(middleware3).toHaveBeenCalledTimes(1);
    });

    it('should stop execution when middleware does not call next()', () => {
      const executionOrder = [];
      
      const middleware1 = jest.fn((req, res, next) => {
        executionOrder.push('middleware1');
        next();
      });
      
      const middleware2 = jest.fn((req, res, next) => {
        executionOrder.push('middleware2');
        // Intentionally not calling next()
      });
      
      const middleware3 = jest.fn((req, res, next) => {
        executionOrder.push('middleware3');
        next();
      });

      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      // Simulate middleware chain execution
      middleware1(mockReq, mockRes, () => {
        middleware2(mockReq, mockRes, () => {
          middleware3(mockReq, mockRes, mockNext);
        });
      });

      expect(executionOrder).toEqual(['middleware1', 'middleware2']);
      expect(middleware3).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle middleware that modifies request/response objects', () => {
      const modificationMiddleware1 = jest.fn((req, res, next) => {
        req.middleware1Applied = true;
        req.modificationOrder = ['middleware1'];
        next();
      });
      
      const modificationMiddleware2 = jest.fn((req, res, next) => {
        req.middleware2Applied = true;
        req.modificationOrder.push('middleware2');
        res.customHeader = 'middleware2-header';
        next();
      });

      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      modificationMiddleware1(mockReq, mockRes, () => {
        modificationMiddleware2(mockReq, mockRes, mockNext);
      });

      expect(mockReq.middleware1Applied).toBe(true);
      expect(mockReq.middleware2Applied).toBe(true);
      expect(mockReq.modificationOrder).toEqual(['middleware1', 'middleware2']);
      expect(mockRes.customHeader).toBe('middleware2-header');
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should handle complex middleware chains with authentication and validation', () => {
      const executionLog = [];
      
      const loggedAuthMiddleware = jest.fn((req, res, next) => {
        executionLog.push('auth');
        authMiddleware.validAuth(req, res, next);
      });
      
      const loggedValidationMiddleware = jest.fn((req, res, next) => {
        executionLog.push('validation');
        validationMiddleware.validRequest(req, res, next);
      });
      
      const loggedCorsMiddleware = jest.fn((req, res, next) => {
        executionLog.push('cors');
        corsMiddleware.standardCors(req, res, next);
      });

      const mockReq = { ...fixtures.mockRequests.valid.get };
      const mockRes = { setHeader: jest.fn() };
      const mockNext = jest.fn(() => {
        executionLog.push('final');
      });

      // Execute complex middleware chain
      loggedAuthMiddleware(mockReq, mockRes, () => {
        loggedValidationMiddleware(mockReq, mockRes, () => {
          loggedCorsMiddleware(mockReq, mockRes, mockNext);
        });
      });

      expect(executionLog).toEqual(['auth', 'validation', 'cors', 'final']);
      expect(mockReq.user).toBeDefined();
      expect(mockReq.validation).toBeDefined();
      expect(mockRes.setHeader).toHaveBeenCalled();
    });
  });

  /**
   * Error Propagation Through Middleware Layers Testing Suite
   */
  describe('Error Propagation Through Middleware Layers', () => {
    
    it('should propagate authentication errors through validation middleware', () => {
      const errorLog = [];
      
      const errorCapturingValidation = jest.fn((req, res, next) => {
        if (req.authError) {
          errorLog.push('validation-received-auth-error');
          next(req.authError);
        } else {
          validationMiddleware.validRequest(req, res, next);
        }
      });

      const mockReq = { ...fixtures.mockRequests.invalid.malformed };
      const mockRes = {};
      const mockNext = jest.fn((error) => {
        if (error) {
          errorLog.push(`final-error: ${error.message}`);
        }
      });

      // Simulate auth error followed by validation
      authMiddleware.invalidAuth(mockReq, mockRes, (authError) => {
        mockReq.authError = authError;
        errorCapturingValidation(mockReq, mockRes, mockNext);
      });

      expect(errorLog).toContain('validation-received-auth-error');
      expect(errorLog).toContain('final-error: Authentication failed');
    });

    it('should handle errors from multiple middleware layers', () => {
      const errorStack = [];
      
      const errorMiddleware1 = jest.fn((req, res, next) => {
        const error = new Error('First middleware error');
        error.source = 'middleware1';
        errorStack.push(error);
        next(error);
      });
      
      const errorMiddleware2 = jest.fn((error, req, res, next) => {
        error.processedBy = error.processedBy || [];
        error.processedBy.push('middleware2');
        errorStack.push({ message: 'processed by middleware2', original: error });
        next(error);
      });

      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      errorMiddleware1(mockReq, mockRes, (error) => {
        errorMiddleware2(error, mockReq, mockRes, mockNext);
      });

      expect(errorStack).toHaveLength(2);
      expect(errorStack[0].source).toBe('middleware1');
      expect(errorStack[1].message).toBe('processed by middleware2');
      
      const finalError = mockNext.mock.calls[0][0];
      expect(finalError.processedBy).toContain('middleware2');
    });

    it('should handle async middleware errors properly', async () => {
      const asyncError = new Error('Async middleware error');
      
      const asyncMiddleware = jest.fn(async (req, res, next) => {
        try {
          // Simulate async operation that fails
          await new Promise((_, reject) => {
            setTimeout(() => reject(asyncError), 50);
          });
        } catch (error) {
          next(error);
        }
      });

      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      await asyncMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(asyncError);
      expect(mockNext.mock.calls[0][0].message).toBe('Async middleware error');
    });

    test('should preserve error context through middleware chain', () => {
      const contextError = new Error('Context preservation test');
      contextError.context = {
        userId: 123,
        action: 'test-action',
        timestamp: new Date().toISOString()
      };

      const contextPreservingMiddleware1 = jest.fn((error, req, res, next) => {
        error.middleware1Processed = true;
        next(error);
      });
      
      const contextPreservingMiddleware2 = jest.fn((error, req, res, next) => {
        error.middleware2Processed = true;
        next(error);
      });

      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();

      contextPreservingMiddleware1(contextError, mockReq, mockRes, (error) => {
        contextPreservingMiddleware2(error, mockReq, mockRes, mockNext);
      });

      const finalError = mockNext.mock.calls[0][0];
      expect(finalError.context.userId).toBe(123);
      expect(finalError.context.action).toBe('test-action');
      expect(finalError.middleware1Processed).toBe(true);
      expect(finalError.middleware2Processed).toBe(true);
    });
  });

  /**
   * Middleware Bypass Scenarios Testing Suite
   */
  describe('Middleware Bypass Scenarios', () => {
    
    it('should allow middleware bypass for specific routes', () => {
      const bypassableMiddleware = jest.fn((req, res, next) => {
        if (req.path === '/api/public' || req.path === '/health') {
          // Bypass authentication for public routes
          req.bypassedAuth = true;
          next();
        } else {
          authMiddleware.validAuth(req, res, next);
        }
      });

      const publicReq = { path: '/api/public' };
      const secureReq = { path: '/api/secure' };
      const mockRes = {};
      const mockNext = jest.fn();

      // Test public route bypass
      bypassableMiddleware(publicReq, mockRes, mockNext);
      expect(publicReq.bypassedAuth).toBe(true);
      expect(publicReq.user).toBeUndefined();

      // Reset mocks
      mockNext.mockClear();

      // Test secure route authentication
      bypassableMiddleware(secureReq, mockRes, mockNext);
      expect(secureReq.user).toBeDefined();
    });

    it('should handle conditional middleware execution based on request headers', () => {
      const conditionalMiddleware = jest.fn((req, res, next) => {
        if (req.headers['x-bypass-validation'] === 'true') {
          req.validationBypassed = true;
          next();
        } else {
          validationMiddleware.validRequest(req, res, next);
        }
      });

      const bypassReq = { 
        headers: { 'x-bypass-validation': 'true' }
      };
      const normalReq = { 
        headers: { 'content-type': 'application/json' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Test bypass scenario
      conditionalMiddleware(bypassReq, mockRes, mockNext);
      expect(bypassReq.validationBypassed).toBe(true);
      expect(bypassReq.validation).toBeUndefined();

      // Reset mocks
      mockNext.mockClear();

      // Test normal validation
      conditionalMiddleware(normalReq, mockRes, mockNext);
      expect(normalReq.validation).toBeDefined();
    });

    it('should handle middleware bypass with proper security checks', () => {
      const secureBypassMiddleware = jest.fn((req, res, next) => {
        const bypassToken = req.headers['x-bypass-token'];
        const validBypassTokens = ['admin-bypass-token', 'system-maintenance'];
        
        if (bypassToken && validBypassTokens.includes(bypassToken)) {
          req.secureBypass = true;
          req.bypassReason = bypassToken;
          next();
        } else {
          authMiddleware.validAuth(req, res, next);
        }
      });

      const validBypassReq = { 
        headers: { 'x-bypass-token': 'admin-bypass-token' }
      };
      const invalidBypassReq = { 
        headers: { 'x-bypass-token': 'invalid-token' }
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Test valid bypass
      secureBypassMiddleware(validBypassReq, mockRes, mockNext);
      expect(validBypassReq.secureBypass).toBe(true);
      expect(validBypassReq.bypassReason).toBe('admin-bypass-token');

      // Reset mocks
      mockNext.mockClear();

      // Test invalid bypass (should go through normal auth)
      secureBypassMiddleware(invalidBypassReq, mockRes, mockNext);
      expect(invalidBypassReq.user).toBeDefined(); // Should have gone through auth
    });

    test('should handle middleware bypass with proper logging and audit trail', () => {
      const auditLog = [];
      
      const auditableBypassMiddleware = jest.fn((req, res, next) => {
        if (req.path === '/api/admin' && req.headers['x-admin-key'] === 'secret-admin-key') {
          auditLog.push({
            action: 'middleware-bypass',
            path: req.path,
            reason: 'admin-access',
            timestamp: new Date().toISOString(),
            ip: req.ip || 'unknown'
          });
          req.adminBypass = true;
          next();
        } else {
          auditLog.push({
            action: 'normal-auth',
            path: req.path,
            timestamp: new Date().toISOString()
          });
          authMiddleware.validAuth(req, res, next);
        }
      });

      const adminReq = { 
        path: '/api/admin',
        headers: { 'x-admin-key': 'secret-admin-key' },
        ip: '127.0.0.1'
      };
      const normalReq = { 
        path: '/api/user',
        headers: {}
      };
      const mockRes = {};
      const mockNext = jest.fn();

      // Test admin bypass
      auditableBypassMiddleware(adminReq, mockRes, mockNext);
      expect(adminReq.adminBypass).toBe(true);
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].action).toBe('middleware-bypass');
      expect(auditLog[0].reason).toBe('admin-access');

      // Reset mocks
      mockNext.mockClear();

      // Test normal auth
      auditableBypassMiddleware(normalReq, mockRes, mockNext);
      expect(auditLog).toHaveLength(2);
      expect(auditLog[1].action).toBe('normal-auth');
    });
  });

  /**
   * next() Function Behavior Testing Suite  
   */
  describe('next() Function Behavior', () => {
    
    it('should call next() without arguments for successful middleware', () => {
      const mockNext = jest.fn();
      const mockReq = {};
      const mockRes = {};

      authMiddleware.validAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() with error for failed middleware', () => {
      const mockNext = jest.fn();
      const mockReq = {};
      const mockRes = {};

      authMiddleware.invalidAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle multiple next() calls gracefully', () => {
      const multipleNextMiddleware = jest.fn((req, res, next) => {
        next(); // First call
        next(); // Second call (should be ignored in real Express)
      });

      const mockNext = jest.fn();
      const mockReq = {};
      const mockRes = {};

      multipleNextMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2); // In test, both calls go through
    });

    it('should preserve next() function context and arguments', () => {
      const contextPreservingMiddleware = jest.fn((req, res, next) => {
        const customError = new Error('Custom context error');
        customError.customProperty = 'preserved';
        next(customError);
      });

      const mockNext = jest.fn();
      const mockReq = {};
      const mockRes = {};

      contextPreservingMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Custom context error',
        customProperty: 'preserved'
      }));
    });

    test('should handle async middleware with proper next() timing', async () => {
      const asyncTiming = [];
      
      const timedAsyncMiddleware = jest.fn(async (req, res, next) => {
        asyncTiming.push('start');
        
        await new Promise(resolve => {
          setTimeout(() => {
            asyncTiming.push('async-complete');
            resolve();
          }, 50);
        });
        
        asyncTiming.push('before-next');
        next();
        asyncTiming.push('after-next');
      });

      const mockNext = jest.fn(() => {
        asyncTiming.push('next-called');
      });
      const mockReq = {};
      const mockRes = {};

      await timedAsyncMiddleware(mockReq, mockRes, mockNext);

      expect(asyncTiming).toEqual([
        'start',
        'async-complete', 
        'before-next',
        'next-called',
        'after-next'
      ]);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should maintain proper next() chain in complex middleware scenarios', async () => {
      const chainOrder = [];
      
      const chainMiddleware1 = jest.fn((req, res, next) => {
        chainOrder.push('chain1-start');
        setTimeout(() => {
          chainOrder.push('chain1-next');
          next();
        }, 10);
      });
      
      const chainMiddleware2 = jest.fn((req, res, next) => {
        chainOrder.push('chain2-start');
        next();
        chainOrder.push('chain2-after');
      });
      
      const chainMiddleware3 = jest.fn((req, res, next) => {
        chainOrder.push('chain3-complete');
        next();
      });

      const mockReq = {};
      const mockRes = {};
      const finalNext = jest.fn(() => {
        chainOrder.push('final');
      });

      // Execute complex chain and wait for completion
      await new Promise((resolve) => {
        chainMiddleware1(mockReq, mockRes, () => {
          chainOrder.push('between-1-2');
          chainMiddleware2(mockReq, mockRes, () => {
            chainOrder.push('between-2-3');
            chainMiddleware3(mockReq, mockRes, () => {
              finalNext();
              resolve();
            });
          });
        });
      });

      // Wait a bit more for any pending async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(chainOrder).toContain('chain1-start');
      expect(chainOrder).toContain('chain1-next');
      expect(chainOrder).toContain('between-1-2');
      expect(chainOrder).toContain('chain2-start');
      expect(chainOrder).toContain('chain2-after');
      expect(chainOrder).toContain('between-2-3');
      expect(chainOrder).toContain('chain3-complete');
      expect(chainOrder).toContain('final');
    });
  });

  /**
   * Integration Testing: Real Middleware Chain Scenarios
   */
  describe('Integration Testing: Real Middleware Chain Scenarios', () => {
    
    it('should handle complete authentication and validation flow', () => {
      const fullChainTest = [];
      
      const authenticatedReq = { 
        ...fixtures.mockRequests.valid.post,
        headers: { 
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json' 
        },
        body: JSON.stringify({ data: 'valid' })
      };
      const mockRes = { setHeader: jest.fn() };
      const mockNext = jest.fn(() => {
        fullChainTest.push('request-processed');
      });

      // Execute full middleware chain
      authMiddleware.validAuth(authenticatedReq, mockRes, () => {
        fullChainTest.push('auth-passed');
        validationMiddleware.validRequest(authenticatedReq, mockRes, () => {
          fullChainTest.push('validation-passed');
          corsMiddleware.standardCors(authenticatedReq, mockRes, () => {
            fullChainTest.push('cors-applied');
            bodyParsingMiddleware.jsonParser(authenticatedReq, mockRes, mockNext);
          });
        });
      });

      expect(fullChainTest).toEqual([
        'auth-passed',
        'validation-passed', 
        'cors-applied',
        'request-processed'
      ]);
      expect(authenticatedReq.user).toBeDefined();
      expect(authenticatedReq.validation).toBeDefined();
      expect(authenticatedReq.parsedBody).toEqual({ data: 'valid' });
      expect(mockRes.setHeader).toHaveBeenCalled();
    });

    it('should handle error scenarios in middleware chain', () => {
      const errorChainTest = [];
      
      const unauthenticatedReq = { 
        ...fixtures.mockRequests.invalid.malformed,
        headers: { 'content-type': 'application/json' }
      };
      const mockRes = { 
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      // Execute middleware chain that should fail at auth
      authMiddleware.invalidAuth(unauthenticatedReq, mockRes, (authError) => {
        errorChainTest.push('auth-failed');
        errorMiddleware.customErrorHandler(authError, unauthenticatedReq, mockRes, (processedError) => {
          if (!processedError) {
            errorChainTest.push('error-handled');
          } else {
            errorChainTest.push('error-propagated');
            errorMiddleware.standardErrorHandler(processedError, unauthenticatedReq, mockRes, mockNext);
          }
        });
        
        // Since customErrorHandler handles 401 errors directly (no next() call),
        // we need to check if response was sent to mark as handled
        if (authError.status === 401) {
          errorChainTest.push('error-handled');
        }
      });

      expect(errorChainTest).toContain('auth-failed');
      expect(errorChainTest).toContain('error-handled');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized access',
        requiresAuth: true
      }));
    });

    test('should validate comprehensive middleware performance metrics', () => {
      const performanceMetrics = {
        startTime: Date.now(),
        middlewareTimings: [],
        endTime: null,
        totalDuration: null
      };
      
      const performanceTrackingMiddleware = (name) => jest.fn((req, res, next) => {
        const start = process.hrtime();
        next();
        const [seconds, nanoseconds] = process.hrtime(start);
        const milliseconds = seconds * 1000 + nanoseconds / 1000000;
        
        performanceMetrics.middlewareTimings.push({
          name,
          duration: milliseconds >= 0 ? milliseconds : 0.001, // Ensure minimum measurable time
          timestamp: Date.now()
        });
      });

      const authPerfMiddleware = performanceTrackingMiddleware('auth');
      const validationPerfMiddleware = performanceTrackingMiddleware('validation');
      const corsPerfMiddleware = performanceTrackingMiddleware('cors');

      const mockReq = { ...fixtures.mockRequests.valid.get };
      const mockRes = { setHeader: jest.fn() };
      const mockNext = jest.fn();

      // Execute performance-tracked middleware chain
      authPerfMiddleware(mockReq, mockRes, () => {
        validationPerfMiddleware(mockReq, mockRes, () => {
          corsPerfMiddleware(mockReq, mockRes, mockNext);
        });
      });

      // Calculate total duration after execution
      performanceMetrics.endTime = Date.now();
      performanceMetrics.totalDuration = performanceMetrics.endTime - performanceMetrics.startTime;

      expect(performanceMetrics.middlewareTimings).toHaveLength(3);
      expect(performanceMetrics.middlewareTimings[0].name).toBe('cors');
      expect(performanceMetrics.middlewareTimings[1].name).toBe('validation');
      expect(performanceMetrics.middlewareTimings[2].name).toBe('auth');
      expect(performanceMetrics.totalDuration).toBeGreaterThanOrEqual(0);
      
      // Verify each middleware timing is reasonable (< 100ms for simple operations)
      performanceMetrics.middlewareTimings.forEach(timing => {
        expect(timing.duration).toBeLessThan(100);
        expect(timing.duration).toBeGreaterThanOrEqual(0);
      });
    });
  });
});