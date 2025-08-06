/**
 * Mock HTTP Response Objects and Templates for Server Response Validation Testing
 * 
 * This file provides comprehensive mock response fixtures for testing HTTP server
 * functionality including status codes, headers, content-type negotiation, and 
 * response body formats as specified in the testing requirements.
 * 
 * @module mockResponses
 * @description Mock HTTP response templates for unit and integration testing
 */

/**
 * Success response templates for 200 OK status codes
 * Includes JSON, HTML, and plain text response formats with appropriate headers
 */
const success = {
  // Standard JSON API response
  jsonApi: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'etag': '"123456789"',
      'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
      'x-response-time': '15ms',
      'x-powered-by': 'Node.js'
    },
    body: {
      success: true,
      data: {
        id: 1,
        message: 'Request processed successfully',
        timestamp: '2025-01-08T10:30:00.000Z'
      },
      meta: {
        version: '1.0.0',
        requestId: 'req_123456789'
      }
    }
  },

  // JSON user data response
  jsonUserData: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-cache',
      'x-user-id': '12345',
      'x-response-time': '8ms'
    },
    body: {
      user: {
        id: 12345,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'PosManager',
        createdAt: '2023-01-15T09:00:00.000Z'
      },
      permissions: ['read', 'write', 'dashboard_access']
    }
  },

  // HTML response template
  htmlResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=86400',
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'content-length': '156'
    },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <h1>Server Response Test</h1>
    <p>This is a test HTML response from the server.</p>
</body>
</html>`
  },

  // Plain text response
  textResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache',
      'content-length': '43'
    },
    body: 'Hello World! This is a plain text response.'
  },

  // File download response
  fileDownload: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': 'attachment; filename="test-file.txt"',
      'content-length': '1024',
      'cache-control': 'private, no-cache',
      'x-download-token': 'abc123'
    },
    body: 'Binary file content would be here...'
  },

  // Streaming response
  streamingResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'access-control-allow-origin': '*'
    },
    body: 'data: {"event": "update", "data": {"status": "active"}}\n\n'
  }
};

/**
 * Error response templates for client and server error status codes
 * Includes 400, 404, 500 error responses with proper error formatting
 */
const error = {
  // 400 Bad Request - Client error
  badRequest: {
    status: 400,
    statusText: 'Bad Request',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      'x-error-id': 'err_400_001',
      'x-response-time': '5ms'
    },
    body: {
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid request parameters provided',
        details: [
          {
            field: 'email',
            error: 'Invalid email format'
          },
          {
            field: 'password',
            error: 'Password must be at least 8 characters'
          }
        ],
        timestamp: '2025-01-08T10:30:00.000Z',
        requestId: 'req_bad_123'
      }
    }
  },

  // 400 Bad Request - Invalid JSON
  invalidJson: {
    status: 400,
    statusText: 'Bad Request',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      'x-error-id': 'err_400_002'
    },
    body: {
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON',
        details: 'Unexpected token } in JSON at position 25',
        timestamp: '2025-01-08T10:30:00.000Z'
      }
    }
  },

  // 404 Not Found
  notFound: {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-error-id': 'err_404_001',
      'x-response-time': '3ms'
    },
    body: {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        path: '/api/users/99999',
        method: 'GET',
        timestamp: '2025-01-08T10:30:00.000Z',
        suggestions: [
          'Check the resource ID',
          'Verify the endpoint URL',
          'Ensure proper authentication'
        ]
      }
    }
  },

  // 404 Not Found - HTML response
  notFoundHtml: {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300'
    },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>404 - Page Not Found</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The requested page could not be found on this server.</p>
    <a href="/">Return to Home</a>
</body>
</html>`
  },

  // 500 Internal Server Error
  internalServerError: {
    status: 500,
    statusText: 'Internal Server Error',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      'x-error-id': 'err_500_001',
      'x-response-time': '120ms'
    },
    body: {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing your request',
        timestamp: '2025-01-08T10:30:00.000Z',
        requestId: 'req_500_123',
        support: {
          email: 'support@example.com',
          reference: 'ERR-500-20250108-103000'
        }
      }
    }
  },

  // 500 Database Connection Error
  databaseError: {
    status: 500,
    statusText: 'Internal Server Error',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      'x-error-id': 'err_500_db',
      'retry-after': '30'
    },
    body: {
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Unable to connect to the database',
        timestamp: '2025-01-08T10:30:00.000Z',
        retryable: true,
        retryAfter: 30
      }
    }
  },

  // 401 Unauthorized
  unauthorized: {
    status: 401,
    statusText: 'Unauthorized',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'www-authenticate': 'Bearer realm="api"',
      'cache-control': 'no-cache'
    },
    body: {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access this resource',
        timestamp: '2025-01-08T10:30:00.000Z'
      }
    }
  },

  // 403 Forbidden
  forbidden: {
    status: 403,
    statusText: 'Forbidden',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    },
    body: {
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
        requiredRole: 'admin',
        currentRole: 'user',
        timestamp: '2025-01-08T10:30:00.000Z'
      }
    }
  }
};

/**
 * Empty response templates for no-content scenarios
 * Includes 204 No Content and empty body responses
 */
const empty = {
  // 204 No Content - successful request with no response body
  noContent: {
    status: 204,
    statusText: 'No Content',
    headers: {
      'cache-control': 'no-cache',
      'x-response-time': '5ms',
      'x-operation': 'delete'
    },
    body: null
  },

  // 200 OK with empty response body
  emptySuccess: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-length': '0',
      'cache-control': 'no-cache'
    },
    body: ''
  },

  // 200 OK with empty JSON object
  emptyJsonObject: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-length': '2',
      'cache-control': 'no-cache'
    },
    body: {}
  },

  // 200 OK with empty JSON array
  emptyJsonArray: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-length': '2',
      'cache-control': 'no-cache'
    },
    body: []
  },

  // HEAD request response (no body)
  headResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-length': '1024',
      'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
      'etag': '"123456789"'
    },
    body: undefined
  }
};

/**
 * Custom response templates with specialized headers and formats
 * Includes CORS, authentication, caching, and custom content-type responses
 */
const custom = {
  // CORS preflight response
  corsPreflightResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization, X-Requested-With',
      'access-control-max-age': '86400',
      'access-control-allow-credentials': 'true',
      'content-length': '0'
    },
    body: ''
  },

  // CORS enabled JSON response
  corsEnabledResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': 'https://example.com',
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'X-Total-Count, X-Page-Info',
      'x-total-count': '150',
      'x-page-info': 'page=1;size=10;total=15'
    },
    body: {
      data: ['item1', 'item2', 'item3'],
      pagination: {
        page: 1,
        size: 10,
        total: 150
      }
    }
  },

  // JWT Authentication response
  jwtAuthResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'x-token-expires': '3600',
      'x-refresh-token': 'refresh_abc123',
      'cache-control': 'private, no-cache'
    },
    body: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'refresh_abc123',
      scope: 'read write admin'
    }
  },

  // API Rate Limiting response
  rateLimitResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-ratelimit-limit': '1000',
      'x-ratelimit-remaining': '999',
      'x-ratelimit-reset': '1641024000',
      'x-ratelimit-window': '3600',
      'retry-after': '3600'
    },
    body: {
      data: 'rate limit response data',
      rateLimit: {
        limit: 1000,
        remaining: 999,
        resetTime: '2022-01-01T12:00:00Z'
      }
    }
  },

  // Caching headers response
  cachedResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=7200',
      'etag': '"v1.0-abc123"',
      'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
      'expires': 'Thu, 21 Oct 2015 08:28:00 GMT',
      'vary': 'Accept-Encoding, User-Agent',
      'age': '300'
    },
    body: {
      data: 'cached content',
      cacheInfo: {
        version: '1.0',
        lastUpdated: '2015-10-21T07:28:00Z'
      }
    }
  },

  // Custom content-type responses
  xmlResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<response>
    <status>success</status>
    <data>
        <item id="1">Test Item 1</item>
        <item id="2">Test Item 2</item>
    </data>
</response>`
  },

  // CSV content response
  csvResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="data.csv"',
      'cache-control': 'private, no-cache'
    },
    body: `id,name,email,role
1,John Doe,john@example.com,admin
2,Jane Smith,jane@example.com,user
3,Bob Johnson,bob@example.com,manager`
  },

  // Server-Sent Events response
  sseResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'access-control-allow-origin': '*',
      'x-accel-buffering': 'no'
    },
    body: `event: message
data: {"type": "notification", "message": "Hello World"}

event: update
data: {"type": "status", "status": "connected"}

event: heartbeat
data: {"timestamp": "2025-01-08T10:30:00.000Z"}

`
  },

  // GraphQL response
  graphqlResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
      'x-graphql-operation': 'query',
      'x-response-time': '45ms'
    },
    body: {
      data: {
        user: {
          id: '123',
          name: 'John Doe',
          posts: [
            { id: '1', title: 'First Post' },
            { id: '2', title: 'Second Post' }
          ]
        }
      },
      extensions: {
        tracing: {
          version: 1,
          startTime: '2025-01-08T10:30:00.000Z',
          endTime: '2025-01-08T10:30:00.045Z',
          duration: 45000000
        }
      }
    }
  },

  // Multipart form response
  multipartResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      'cache-control': 'no-cache'
    },
    body: `------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="text"

Hello World
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

File content here
------WebKitFormBoundary7MA4YWxkTrZu0gW--`
  },

  // Binary content response
  binaryResponse: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': '2048',
      'content-disposition': 'attachment; filename="binary-file.bin"',
      'cache-control': 'private, no-cache',
      'x-checksum': 'sha256:a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
    },
    body: Buffer.from('Binary content would be here as Buffer or Uint8Array')
  },

  // WebSocket upgrade response
  websocketUpgrade: {
    status: 101,
    statusText: 'Switching Protocols',
    headers: {
      'upgrade': 'websocket',
      'connection': 'Upgrade',
      'sec-websocket-accept': 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=',
      'sec-websocket-protocol': 'chat, superchat',
      'sec-websocket-version': '13'
    },
    body: null
  },

  // Redirect response
  redirectResponse: {
    status: 302,
    statusText: 'Found',
    headers: {
      'location': 'https://example.com/new-location',
      'cache-control': 'no-cache',
      'x-redirect-reason': 'moved-temporarily'
    },
    body: 'Redirecting to new location...'
  },

  // Permanent redirect
  permanentRedirect: {
    status: 301,
    statusText: 'Moved Permanently',
    headers: {
      'location': 'https://newdomain.com/resource',
      'cache-control': 'public, max-age=31536000',
      'x-redirect-reason': 'domain-migration'
    },
    body: 'Resource has moved permanently'
  }
};

/**
 * Complete mock responses object with all categories
 * Default export containing success, error, empty, and custom response templates
 */
const mockResponses = {
  success,
  error,
  empty,
  custom
};

// Export the complete mock responses object as default export
export default mockResponses;