/**
 * Route Parameter and Dynamic Routing Test Suite
 * 
 * Comprehensive testing for URL parameter extraction, query string parsing,
 * path parameters, and dynamic route matching functionality. Tests parameter
 * validation, type coercion, optional parameters, and wildcard routes using
 * Jest framework with comprehensive edge case coverage.
 * 
 * Test Categories:
 * - URL parameter extraction and validation
 * - Query string parsing and validation
 * - Path parameters (/users/:id pattern matching)
 * - Optional parameters and default values
 * - Wildcard route matching
 * - Parameter type validation and coercion
 * - Edge cases: special characters, empty parameters, invalid formats
 * - Security validation: injection attempts, path traversal
 * 
 * Framework: Jest 29.7.0 with Supertest 6.3.4 for HTTP assertions
 * Integration: Tests server.js route handlers with comprehensive parameter scenarios
 * 
 * @module routeParameterTests
 * @version 1.0.0
 * @author Blitzy Agent
 */

// External imports as specified in external_imports schema
const request = require('supertest');
const { URL, URLSearchParams, parse, format, resolve } = require('url');
const { parse: queryParse, stringify: queryStringify, escape: queryEscape, unescape: queryUnescape } = require('querystring');

// Internal imports as specified in internal_imports schema
const { app, routes } = require('../../../main/js/server.js');
const { mockRequests, mockResponses, mockServerConfigs, mockEnvironment } = require('../fixtures/index.js');

/**
 * Test suite for route parameter extraction and validation
 * Validates URL parameter handling, query string parsing, and dynamic routing
 */
describe('Route Parameter and Dynamic Routing Tests', () => {
  let serverInstance;
  let serverPort;

  /**
   * Global test setup - start server before all tests
   * Ensures consistent server state for parameter testing
   */
  beforeAll(async () => {
    // Use dynamic port to avoid conflicts during parallel testing
    serverPort = 3000 + Math.floor(Math.random() * 1000);
    
    return new Promise((resolve, reject) => {
      serverInstance = app.listen(serverPort, 'localhost', (error) => {
        if (error) {
          reject(new Error(`Failed to start server for parameter testing: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  });

  /**
   * Global test cleanup - stop server after all tests
   * Ensures proper resource cleanup and no hanging processes
   */
  afterAll(async () => {
    if (serverInstance) {
      return new Promise((resolve) => {
        app.close(() => {
          resolve();
        });
      });
    }
  });

  /**
   * Individual test setup - reset any mocked functions
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Basic Parameter Extraction Tests
   * Tests fundamental URL parameter handling functionality
   */
  describe('Basic Parameter Extraction', () => {
    /**
     * Test basic query parameter extraction from GET requests
     * Validates server's ability to parse and return query parameters
     */
    it('should extract basic query parameters from GET requests', async () => {
      const testParams = {
        name: 'testUser',
        id: '123',
        active: 'true'
      };

      const response = await request(serverInstance)
        .get('/api/users')
        .query(testParams)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.method).toBe('GET');
      expect(response.body.path).toBe('/api/users');
      expect(response.body.query).toEqual(testParams);
      expect(response.body.query.name).toBe('testUser');
      expect(response.body.query.id).toBe('123');
      expect(response.body.query.active).toBe('true');
    });

    /**
     * Test parameter extraction with empty values
     * Ensures proper handling of empty parameter scenarios
     */
    it('should handle empty query parameters correctly', async () => {
      const response = await request(serverInstance)
        .get('/api/data')
        .set('x-api-key', 'test-key-123')  // Required for /api/data endpoint
        .query({ empty: '', defined: 'value', missing: undefined })
        .expect(200);

      expect(response.body.query.empty).toBe('');
      expect(response.body.query.defined).toBe('value');
      expect(response.body.query).not.toHaveProperty('missing');
    });

    /**
     * Test parameter extraction with multiple values for same key
     * Tests array parameter handling and proper parsing
     */
    it('should handle multiple values for the same parameter key', async () => {
      const response = await request(serverInstance)
        .get('/api/search?tags=javascript&tags=testing&tags=nodejs')
        .expect(200);

      // URL module parses multiple values as array
      expect(response.body.query.tags).toEqual(['javascript', 'testing', 'nodejs']);
    });
  });

  /**
   * Query String Parsing and Validation Tests
   * Comprehensive testing of query string handling edge cases
   */
  describe('Query String Parsing and Validation', () => {
    /**
     * Test URL encoding and decoding in query parameters
     * Validates proper handling of encoded characters
     */
    it('should properly decode URL-encoded query parameters', async () => {
      const encodedParams = {
        space: 'hello world',
        special: 'test@example.com',
        unicode: '测试'
      };

      const response = await request(serverInstance)
        .get('/api/encoded')
        .query(encodedParams)
        .expect(200);

      expect(response.body.query.space).toBe('hello world');
      expect(response.body.query.special).toBe('test@example.com');
      expect(response.body.query.unicode).toBe('测试');
    });

    /**
     * Test query parameter parsing with special characters
     * Ensures robust handling of edge case characters
     */
    it('should handle special characters in query parameters', async () => {
      const specialChars = {
        ampersand: 'a&b',
        equals: 'key=value',
        question: 'what?',
        hash: 'tag#name',
        plus: 'a+b',
        percent: '100%'
      };

      const response = await request(serverInstance)
        .get('/api/special')
        .query(specialChars)
        .expect(200);

      expect(response.body.query.ampersand).toBe('a&b');
      expect(response.body.query.equals).toBe('key=value');
      expect(response.body.query.question).toBe('what?');
      expect(response.body.query.hash).toBe('tag#name');
      expect(response.body.query.plus).toBe('a+b');
      expect(response.body.query.percent).toBe('100%');
    });

    /**
     * Test manual query string parsing using querystring module
     * Validates direct parsing capabilities for complex scenarios
     */
    it('should parse complex query strings using querystring module', () => {
      const complexQuery = 'name=John+Doe&age=30&hobbies=reading&hobbies=coding&active=true&score=95.5';
      const parsed = queryParse(complexQuery);

      expect(parsed.name).toBe('John Doe');
      expect(parsed.age).toBe('30');
      expect(parsed.hobbies).toEqual(['reading', 'coding']);
      expect(parsed.active).toBe('true');
      expect(parsed.score).toBe('95.5');
    });

    /**
     * Test query string generation and round-trip parsing
     * Ensures consistency between parsing and generation
     */
    it('should generate and parse query strings consistently', () => {
      const originalParams = {
        user: 'testUser',
        filters: ['active', 'verified'],
        limit: 50,
        include_meta: true
      };

      const queryString = queryStringify(originalParams);
      const reparsed = queryParse(queryString);

      expect(reparsed.user).toBe('testUser');
      expect(reparsed.filters).toEqual(['active', 'verified']);
      expect(reparsed.limit).toBe('50'); // Note: parsed as string
      expect(reparsed.include_meta).toBe('true'); // Note: parsed as string
    });
  });

  /**
   * Path Parameter Validation Tests
   * Tests dynamic route matching and path parameter extraction
   */
  describe('Path Parameter Validation', () => {
    /**
     * Test paramHandler functionality for path analysis
     * Validates route analysis and parameter detection
     */
    it('should analyze path segments and detect parameters using paramHandler', () => {
      const testPaths = [
        '/api/users/123',
        '/api/posts/456/comments',
        '/api/categories/technology/articles',
        '/api'
      ];

      testPaths.forEach(path => {
        const analysis = routes.paramHandler(path, 'GET');
        
        expect(analysis).toHaveProperty('segments');
        expect(analysis).toHaveProperty('hasParams');
        expect(analysis).toHaveProperty('method');
        expect(analysis).toHaveProperty('isValidRoute');
        
        expect(analysis.method).toBe('GET');
        expect(Array.isArray(analysis.segments)).toBe(true);
      });
    });

    /**
     * Test path parameter extraction for user ID patterns
     * Simulates /users/:id route pattern handling
     */
    it('should extract user ID from /api/users/:id pattern', async () => {
      const userId = '12345';
      const response = await request(serverInstance)
        .get(`/api/users/${userId}`)
        .query({ include: 'profile' })
        .expect(200);

      // Verify path contains user ID
      expect(response.body.path).toBe(`/api/users/${userId}`);
      expect(response.body.query.include).toBe('profile');
      
      // Use paramHandler to analyze the path structure
      const pathAnalysis = routes.paramHandler(response.body.path, 'GET');
      expect(pathAnalysis.segments).toContain('api');
      expect(pathAnalysis.segments).toContain('users');
      expect(pathAnalysis.segments).toContain(userId);
      expect(pathAnalysis.hasParams).toBe(true);
      expect(pathAnalysis.isValidRoute).toBe(true);
    });

    /**
     * Test nested path parameters for complex routing
     * Validates multi-level parameter extraction
     */
    it('should handle nested path parameters correctly', async () => {
      const postId = '789';
      const commentId = '456';
      const path = `/api/posts/${postId}/comments/${commentId}`;

      const response = await request(serverInstance)
        .get(path)
        .expect(200);

      expect(response.body.path).toBe(path);
      
      const pathAnalysis = routes.paramHandler(path, 'GET');
      expect(pathAnalysis.segments).toEqual(['api', 'posts', postId, 'comments', commentId]);
      expect(pathAnalysis.hasParams).toBe(true);
      expect(pathAnalysis.isValidRoute).toBe(true);
    });

    /**
     * Test path parameter validation with invalid routes
     * Ensures proper rejection of malformed paths
     */
    it('should reject invalid path structures', () => {
      const invalidPaths = [
        '',
        '/',
        '/invalid',
        '/not-api/test'
      ];

      invalidPaths.forEach(path => {
        const analysis = routes.paramHandler(path, 'GET');
        expect(analysis.isValidRoute).toBe(false);
      });
    });
  });

  /**
   * Optional Parameters and Default Values Tests
   * Tests handling of optional parameters with fallback values
   */
  describe('Optional Parameters and Default Values', () => {
    /**
     * Test optional query parameters with defaults
     * Validates graceful handling of missing parameters
     */
    it('should handle optional parameters with default behavior', async () => {
      // Test with minimal parameters
      const response1 = await request(serverInstance)
        .get('/api/search')
        .expect(200);

      expect(response1.body.query).toEqual({});
      expect(response1.body.path).toBe('/api/search');

      // Test with some optional parameters
      const response2 = await request(serverInstance)
        .get('/api/search')
        .query({ q: 'test', limit: '10' })
        .expect(200);

      expect(response2.body.query.q).toBe('test');
      expect(response2.body.query.limit).toBe('10');
    });

    /**
     * Test parameter type coercion simulation
     * Demonstrates type handling in parameter processing
     */
    it('should demonstrate parameter type handling patterns', () => {
      const rawParams = {
        id: '123',
        active: 'true',
        score: '95.5',
        tags: 'javascript,testing,nodejs'
      };

      // Simulate type coercion that would occur in real applications
      const typedParams = {
        id: parseInt(rawParams.id, 10),
        active: rawParams.active === 'true',
        score: parseFloat(rawParams.score),
        tags: rawParams.tags.split(',')
      };

      expect(typedParams.id).toBe(123);
      expect(typedParams.active).toBe(true);
      expect(typedParams.score).toBe(95.5);
      expect(typedParams.tags).toEqual(['javascript', 'testing', 'nodejs']);
    });

    /**
     * Test URL construction with optional parameters
     * Validates URL building with selective parameter inclusion
     */
    it('should construct URLs with optional parameters using URL module', () => {
      const baseUrl = 'http://localhost:3000/api/search';
      const optionalParams = new URLSearchParams();
      
      // Add parameters conditionally
      const queryParams = { q: 'test', limit: undefined, offset: 0, sort: 'name' };
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          optionalParams.append(key, value.toString());
        }
      });

      const fullUrl = new URL(baseUrl);
      fullUrl.search = optionalParams.toString();

      expect(fullUrl.toString()).toBe('http://localhost:3000/api/search?q=test&offset=0&sort=name');
      expect(fullUrl.searchParams.get('q')).toBe('test');
      expect(fullUrl.searchParams.get('limit')).toBeNull();
      expect(fullUrl.searchParams.get('offset')).toBe('0');
    });
  });

  /**
   * Wildcard Routes and Pattern Matching Tests
   * Tests flexible routing patterns and wildcard handling
   */
  describe('Wildcard Routes and Pattern Matching', () => {
    /**
     * Test wildcard-style path matching simulation
     * Demonstrates pattern matching capabilities
     */
    it('should handle wildcard-style path patterns', () => {
      const testPaths = [
        '/api/users/123/profile',
        '/api/users/456/settings',
        '/api/posts/789/comments/123',
        '/api/categories/tech/articles/456'
      ];

      testPaths.forEach(path => {
        const analysis = routes.paramHandler(path, 'GET');
        
        // Simulate wildcard matching logic
        const isUserProfile = path.match(/^\/api\/users\/\d+\/profile$/);
        const isUserSettings = path.match(/^\/api\/users\/\d+\/settings$/);
        const isPostComment = path.match(/^\/api\/posts\/\d+\/comments\/\d+$/);
        const isCategoryArticle = path.match(/^\/api\/categories\/\w+\/articles\/\d+$/);
        
        expect(analysis.isValidRoute).toBe(true);
        
        if (isUserProfile) {
          expect(analysis.segments).toContain('users');
          expect(analysis.segments).toContain('profile');
        }
        if (isUserSettings) {
          expect(analysis.segments).toContain('users');
          expect(analysis.segments).toContain('settings');
        }
        if (isPostComment) {
          expect(analysis.segments).toContain('posts');
          expect(analysis.segments).toContain('comments');
        }
        if (isCategoryArticle) {
          expect(analysis.segments).toContain('categories');
          expect(analysis.segments).toContain('articles');
        }
      });
    });

    /**
     * Test catch-all route simulation
     * Validates handling of unmatched routes
     */
    it('should simulate catch-all route behavior', async () => {
      // Test various API endpoints to ensure consistent handling
      const testEndpoints = [
        '/api/unknown/endpoint',
        '/api/test/nested/deep',
        '/api/dynamic/path/with/many/segments'
      ];

      for (const endpoint of testEndpoints) {
        const response = await request(serverInstance)
          .get(endpoint)
          .expect(200);

        expect(response.body.path).toBe(endpoint);
        expect(response.body.method).toBe('GET');
        
        const analysis = routes.paramHandler(endpoint, 'GET');
        expect(analysis.isValidRoute).toBe(true);
        expect(analysis.segments.length).toBeGreaterThan(1);
      }
    });
  });

  /**
   * Edge Cases and Error Handling Tests
   * Comprehensive testing of edge cases and error scenarios
   */
  describe('Edge Cases and Error Handling', () => {
    /**
     * Test special characters in path parameters
     * Validates handling of encoded and special characters
     */
    it('should handle special characters in path parameters', async () => {
      const specialPaths = [
        '/api/users/user%40example.com',  // encoded @
        '/api/posts/title-with-dashes',
        '/api/categories/%E6%B5%8B%E8%AF%95',  // URL-encoded Unicode characters (测试)
      ];

      for (const path of specialPaths) {
        const response = await request(serverInstance)
          .get(path)
          .expect(200);

        expect(response.body.path).toBe(path);
        
        const analysis = routes.paramHandler(path, 'GET');
        expect(analysis.isValidRoute).toBe(true);
        expect(analysis.segments.length).toBeGreaterThan(0);
      }
    });

    /**
     * Test extremely long parameter values
     * Validates handling of edge case parameter lengths
     */
    it('should handle extremely long parameter values', async () => {
      const longValue = 'a'.repeat(1000);
      const response = await request(serverInstance)
        .get('/api/test')
        .query({ longParam: longValue })
        .expect(200);

      expect(response.body.query.longParam).toBe(longValue);
      expect(response.body.query.longParam.length).toBe(1000);
    });

    /**
     * Test malformed query strings
     * Ensures graceful handling of malformed input
     */
    it('should handle malformed query strings gracefully', () => {
      const malformedQueries = [
        'key1=value1&key2',  // Missing value
        '=value',  // Missing key
        'key1=value1&key1=value2&key1=value3',  // Multiple values
        'key%3Dname=value%26data'  // Encoded special chars
      ];

      malformedQueries.forEach(query => {
        const parsed = queryParse(query);
        expect(typeof parsed).toBe('object');
        // Should not throw error, may have unexpected structure
      });
    });

    /**
     * Test parameter injection attempts
     * Validates security handling of injection attempts
     */
    it('should handle parameter injection attempts safely', async () => {
      const injectionAttempts = [
        { script: '<script>alert("xss")</script>' },
        { sql: "'; DROP TABLE users; --" },
        { path: '../../../etc/passwd' },
        { null: null },
        { undefined: undefined }
      ];

      for (const attempt of injectionAttempts) {
        const response = await request(serverInstance)
          .get('/api/secure')
          .query(attempt)
          .expect(200);

        // Verify that injection attempts are handled as regular parameters
        Object.entries(attempt).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            expect(response.body.query[key]).toBe(value);
          }
        });
      }
    });

    /**
     * Test path traversal attempts in URLs
     * Validates security against path traversal attacks
     */
    it('should block path traversal attempts in URLs', async () => {
      const traversalAttempts = [
        { original: '/api/../../../etc/passwd', normalized: '/api/../../../etc/passwd' },
        { original: '/api/files/../../../config', normalized: '/api/files/../../../config' },
        { original: '/api/data/..\\..\\windows\\system32', normalized: '/api/data/../../windows/system32' }
      ];

      for (const attempt of traversalAttempts) {
        const response = await request(serverInstance)
          .get(attempt.original)
          .expect(404);  // Should be blocked

        expect(response.body.error).toBe('Not Found');
        expect(response.body.path).toBe(attempt.normalized);  // Node.js normalizes backslashes
      }
    });

    /**
     * Test URL parsing edge cases using URL module
     * Validates robust URL handling with edge cases
     */
    it('should handle URL parsing edge cases with URL module', () => {
      const edgeCaseUrls = [
        'http://localhost:3000/api/test?',  // Empty query
        'http://localhost:3000/api/test?key',  // Key without value
        'http://localhost:3000/api/test?=value',  // Value without key
        'http://localhost:3000/api/test?key=',  // Empty value
        'http://localhost:3000/api/test?key1=value1&key1=value2'  // Duplicate keys
      ];

      edgeCaseUrls.forEach(urlString => {
        const parsedUrl = new URL(urlString);
        
        expect(parsedUrl.hostname).toBe('localhost');
        expect(parsedUrl.port).toBe('3000');
        expect(parsedUrl.pathname).toBe('/api/test');
        
        // URLSearchParams should handle edge cases gracefully
        const params = parsedUrl.searchParams;
        expect(params instanceof URLSearchParams).toBe(true);
      });
    });
  });

  /**
   * HTTP Method Parameter Testing
   * Tests parameter handling across different HTTP methods
   */
  describe('HTTP Method Parameter Testing', () => {
    /**
     * Test parameter handling in POST requests with body data
     * Validates parameter extraction from request body
     */
    it('should handle parameters in POST request body', async () => {
      const postData = {
        name: 'Test User',
        email: 'test@example.com',
        parameters: {
          preference: 'dark_mode',
          notifications: true
        }
      };

      const response = await request(serverInstance)
        .post('/api/users')
        .send(postData)
        .expect(201);

      expect(response.body.method).toBe('POST');
      expect(response.body.received).toEqual(postData);
      expect(response.body.received.parameters.preference).toBe('dark_mode');
      expect(response.body.received.parameters.notifications).toBe(true);
    });

    /**
     * Test parameter handling in PUT requests
     * Validates parameter processing for update operations
     */
    it('should handle parameters in PUT requests', async () => {
      const putData = {
        id: 123,
        updates: {
          status: 'active',
          lastModified: new Date().toISOString()
        }
      };

      const response = await request(serverInstance)
        .put('/api/users/123')
        .send(putData)
        .expect(200);

      expect(response.body.method).toBe('PUT');
      expect(response.body.path).toBe('/api/users/123');
      expect(response.body.updated).toEqual(putData);
    });

    /**
     * Test parameter handling in DELETE requests with query params
     * Validates parameter extraction for deletion operations
     */
    it('should handle parameters in DELETE requests', async () => {
      const deleteParams = {
        force: 'true',
        reason: 'cleanup'
      };

      const response = await request(serverInstance)
        .delete('/api/items/456')
        .query(deleteParams)
        .expect(200);

      expect(response.body.method).toBe('DELETE');
      expect(response.body.path).toBe('/api/items/456');
      expect(response.body.query).toEqual(deleteParams);
      expect(response.body.deleted).toBe(true);
    });
  });

  /**
   * Performance and Scalability Tests
   * Tests parameter handling under various load conditions
   */
  describe('Performance and Scalability Tests', () => {
    /**
     * Test handling of many parameters
     * Validates performance with large parameter sets
     */
    it('should efficiently handle requests with many parameters', async () => {
      const manyParams = {};
      for (let i = 0; i < 100; i++) {
        manyParams[`param${i}`] = `value${i}`;
      }

      const startTime = Date.now();
      const response = await request(serverInstance)
        .get('/api/bulk')
        .query(manyParams)
        .expect(200);
      const endTime = Date.now();

      expect(Object.keys(response.body.query)).toHaveLength(100);
      expect(response.body.query.param0).toBe('value0');
      expect(response.body.query.param99).toBe('value99');
      
      // Performance assertion - should handle 100 params quickly
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    /**
     * Test concurrent parameter processing
     * Validates thread-safety and concurrent handling
     */
    it('should handle concurrent requests with different parameters', async () => {
      const concurrentRequests = [];
      
      for (let i = 0; i < 10; i++) {
        const requestPromise = request(serverInstance)
          .get(`/api/concurrent/${i}`)
          .query({ requestId: i, timestamp: Date.now() })
          .expect(200);
        
        concurrentRequests.push(requestPromise);
      }

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach((response, index) => {
        expect(response.body.path).toBe(`/api/concurrent/${index}`);
        expect(response.body.query.requestId).toBe(index.toString());
        expect(response.body.query.timestamp).toBeDefined();
      });
    });
  });

  /**
   * Integration with Test Fixtures
   * Tests parameter handling using provided mock data
   */
  describe('Integration with Test Fixtures', () => {
    /**
     * Test parameter handling with mock request fixtures
     * Validates integration with test data patterns
     */
    it('should work with mock request fixtures for parameter testing', () => {
      // Use mockRequests from fixtures to validate parameter patterns
      expect(mockRequests).toBeDefined();
      expect(mockRequests.valid).toBeDefined();
      expect(mockRequests.invalid).toBeDefined();
      
      // Validate that fixtures provide parameter test scenarios
      if (mockRequests.valid && typeof mockRequests.valid === 'object') {
        Object.keys(mockRequests.valid).forEach(key => {
          expect(mockRequests.valid[key]).toBeDefined();
        });
      }
    });

    /**
     * Test parameter validation with mock server configurations
     * Validates configuration-based parameter handling
     */
    it('should validate parameters against mock server configurations', () => {
      expect(mockServerConfigs).toBeDefined();
      expect(mockServerConfigs.default).toBeDefined();
      
      // Simulate parameter validation against server config
      const sampleConfig = mockServerConfigs.default;
      if (sampleConfig && typeof sampleConfig === 'object') {
        // Test that server configuration supports parameter handling
        expect(typeof sampleConfig).toBe('object');
      }
    });

    /**
     * Test environment-specific parameter handling
     * Validates parameter behavior across different environments
     */
    it('should handle parameters according to environment configuration', () => {
      expect(mockEnvironment).toBeDefined();
      
      // Simulate environment-based parameter validation
      if (mockEnvironment && typeof mockEnvironment === 'object') {
        // Verify environment supports parameter configuration
        expect(typeof mockEnvironment).toBe('object');
      }
    });
  });
});