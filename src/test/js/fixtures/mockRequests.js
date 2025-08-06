/**
 * Mock HTTP Request Objects and Templates for Comprehensive Server Testing
 * 
 * This module provides reusable HTTP request fixtures for testing various scenarios
 * including valid requests, invalid structures, malformed patterns, oversized payloads,
 * and security injection attacks. Supports all HTTP methods (GET, POST, PUT, DELETE)
 * with comprehensive edge case coverage as specified in the testing strategy.
 * 
 * @module mockRequests
 * @version 1.0.0
 * @author Blitzy Agent
 */

/**
 * Comprehensive mock HTTP request objects for testing scenarios
 * Organized by request type: valid, invalid, malformed, oversized, injection
 */
const mockRequests = {
  /**
   * Valid HTTP request patterns for testing standard functionality
   * Covers all major HTTP methods with proper headers and body formats
   */
  valid: {
    // Standard GET request with query parameters
    get: {
      method: 'GET',
      url: '/api/users?page=1&limit=10&sort=name',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TestRunner/1.0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'X-Request-ID': 'test-req-001'
      },
      query: {
        page: '1',
        limit: '10',
        sort: 'name'
      }
    },

    // Standard POST request with JSON body
    post: {
      method: 'POST',
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TestRunner/1.0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'X-Request-ID': 'test-req-002'
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'user',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      })
    },

    // Standard PUT request with form data
    put: {
      method: 'PUT',
      url: '/api/users/123',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'TestRunner/1.0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'X-Request-ID': 'test-req-003'
      },
      body: 'name=Jane+Smith&email=jane.smith%40example.com&role=admin'
    },

    // Standard DELETE request
    delete: {
      method: 'DELETE',
      url: '/api/users/456',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TestRunner/1.0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'X-Request-ID': 'test-req-004'
      },
      query: {
        confirm: 'true',
        reason: 'user_request'
      }
    },

    // File upload request with multipart/form-data
    upload: {
      method: 'POST',
      url: '/api/upload',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        'Accept': 'application/json',
        'User-Agent': 'TestRunner/1.0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      },
      body: '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nTest file content\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n'
    },

    // PATCH request for partial updates
    patch: {
      method: 'PATCH',
      url: '/api/users/789',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TestRunner/1.0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      },
      body: JSON.stringify({
        preferences: {
          theme: 'light'
        }
      })
    },

    // OPTIONS request for CORS preflight
    options: {
      method: 'OPTIONS',
      url: '/api/users',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    }
  },

  /**
   * Invalid HTTP request structures for error testing
   * Tests server resilience against malformed or incomplete requests
   */
  invalid: {
    // Missing required headers
    missingHeaders: {
      method: 'POST',
      url: '/api/users',
      // Missing Content-Type header for JSON body
      headers: {
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name: 'Test User' })
    },

    // Invalid Content-Type for body
    invalidContentType: {
      method: 'POST',
      url: '/api/users',
      headers: {
        'Content-Type': 'text/xml', // Wrong type for JSON body
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name: 'Test User' })
    },

    // Malformed JSON body
    malformedJson: {
      method: 'POST',
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: '{"name": "Test User", "email":}' // Invalid JSON syntax
    },

    // Invalid HTTP method
    invalidMethod: {
      method: 'INVALID',
      url: '/api/users',
      headers: {
        'Accept': 'application/json'
      }
    },

    // Empty URL
    emptyUrl: {
      method: 'GET',
      url: '',
      headers: {
        'Accept': 'application/json'
      }
    },

    // Invalid URL format
    invalidUrl: {
      method: 'GET',
      url: 'not-a-valid-url',
      headers: {
        'Accept': 'application/json'
      }
    },

    // Conflicting headers
    conflictingHeaders: {
      method: 'GET',
      url: '/api/users',
      headers: {
        'Accept': 'application/json',
        'Accept': 'text/html' // Duplicate header with different value
      }
    }
  },

  /**
   * Malformed HTTP requests for edge case validation
   * Tests handling of corrupted, incomplete, or unusual request patterns
   */
  malformed: {
    // Invalid JSON for error handling tests
    invalidJson: '{"invalid": json}',

    // Request with null values
    nullValues: {
      method: null,
      url: null,
      headers: null,
      body: null
    },

    // Request with undefined properties
    undefinedValues: {
      method: undefined,
      url: undefined,
      headers: undefined,
      body: undefined
    },

    // Mixed data types in headers
    mixedTypeHeaders: {
      method: 'GET',
      url: '/api/test',
      headers: {
        'Accept': 123, // Number instead of string
        'User-Agent': true, // Boolean instead of string
        'Authorization': ['Bearer', 'token'], // Array instead of string
        'X-Custom': { nested: 'object' } // Object instead of string
      }
    },

    // Extremely nested JSON
    deeplyNested: {
      method: 'POST',
      url: '/api/deep',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    level7: {
                      level8: {
                        level9: {
                          level10: {
                            data: 'deeply nested value'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    },

    // Binary data in JSON field
    binaryInJson: {
      method: 'POST',
      url: '/api/binary',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"data": "' + Buffer.from('Binary data', 'binary').toString('base64') + '"}'
    },

    // Circular reference attempt (would fail JSON.stringify)
    circularReference: {
      method: 'POST',
      url: '/api/circular',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"self": {"ref": {"back": "self"}}}' // Simulated circular reference
    }
  },

  /**
   * Oversized HTTP requests for memory and performance testing
   * Tests server handling of large payloads and resource exhaustion scenarios
   */
  oversized: {
    // Large payload for size limit testing
    largePayload: {
      data: 'x'.repeat(2000000), // 2MB of data
      metadata: {
        size: '2MB',
        type: 'oversized-test-payload'
      }
    },

    // Large JSON payload (1MB+)
    largeJson: {
      method: 'POST',
      url: '/api/large',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        data: 'x'.repeat(1048576), // 1MB of data
        metadata: {
          size: '1MB',
          type: 'stress_test'
        }
      })
    },

    // Extremely long URL (8KB+)
    longUrl: {
      method: 'GET',
      url: '/api/long?' + 'param=value&'.repeat(1000) + 'end=true', // ~12KB URL
      headers: {
        'Accept': 'application/json'
      }
    },

    // Large number of headers
    manyHeaders: {
      method: 'GET',
      url: '/api/headers',
      headers: Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`X-Custom-Header-${i}`, `value-${i}`])
      )
    },

    // Large form data
    largeFormData: {
      method: 'POST',
      url: '/api/form',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: Array.from({ length: 10000 }, (_, i) => `field${i}=value${i}`).join('&')
    },

    // Large file upload simulation
    largeFileUpload: {
      method: 'POST',
      url: '/api/upload/large',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryLarge',
        'Content-Length': '10485760' // 10MB
      },
      body: '------WebKitFormBoundaryLarge\r\nContent-Disposition: form-data; name="largefile"; filename="large.bin"\r\nContent-Type: application/octet-stream\r\n\r\n' + 
             'x'.repeat(10485000) + // ~10MB of data
             '\r\n------WebKitFormBoundaryLarge--\r\n'
    }
  },

  /**
   * Security injection patterns for vulnerability testing
   * Tests server resilience against various attack vectors and malicious inputs
   */
  injection: {
    // SQL Injection attempts
    sqlInjection: {
      method: 'GET',
      url: "/api/users?id=1'; DROP TABLE users; --",
      headers: {
        'Accept': 'application/json',
        'User-Agent': "'; DELETE FROM sessions; --"
      }
    },

    // XSS (Cross-Site Scripting) attempts
    xssInjection: {
      method: 'POST',
      url: '/api/comments',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        comment: '<script>alert("XSS");</script>',
        user: '<img src="x" onerror="alert(\'XSS\')">'
      })
    },

    // Command injection attempts
    commandInjection: {
      method: 'POST',
      url: '/api/process',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'test.txt; rm -rf /',
        command: 'ls; cat /etc/passwd',
        path: '../../../etc/passwd'
      })
    },

    // Path traversal attempts
    pathTraversal: {
      method: 'GET',
      url: '/api/files?path=../../../etc/passwd',
      headers: {
        'Accept': 'application/json',
        'X-File-Path': '../../../../etc/shadow'
      }
    },

    // LDAP injection attempts
    ldapInjection: {
      method: 'POST',
      url: '/api/auth',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin)(cn=*',
        filter: '(|(uid=admin)(uid=*))'
      })
    },

    // NoSQL injection attempts
    nosqlInjection: {
      method: 'POST',
      url: '/api/login',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: { $ne: null },
        password: { $regex: '.*' }
      })
    },

    // Header injection attempts
    headerInjection: {
      method: 'GET',
      url: '/api/redirect',
      headers: {
        'Host': 'evil.com',
        'X-Forwarded-For': '127.0.0.1\r\nSet-Cookie: evil=true',
        'User-Agent': 'Agent\r\nX-Injected: malicious'
      }
    },

    // XML injection attempts
    xmlInjection: {
      method: 'POST',
      url: '/api/xml',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>'
    },

    // Template injection attempts
    templateInjection: {
      method: 'POST',
      url: '/api/template',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template: '{{ 7*7 }}',
        content: '${process.env}',
        expression: '#{java.lang.Runtime.getRuntime().exec("id")}'
      })
    },

    // Prototype pollution attempts
    prototypePollution: {
      method: 'POST',
      url: '/api/merge',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        '__proto__': { 'polluted': true },
        'constructor': { 'prototype': { 'polluted': true } }
      })
    }
  }
};

// Export using CommonJS to meet Node.js requirements
module.exports = mockRequests;