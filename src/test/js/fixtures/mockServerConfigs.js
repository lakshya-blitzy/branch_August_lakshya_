/**
 * Mock Server Configuration Objects for Testing
 * 
 * This file provides comprehensive mock server configurations for testing different
 * server initialization scenarios, including default configurations, custom settings,
 * invalid configurations, environment variable overrides, port conflict handling,
 * and dynamic port assignment scenarios.
 * 
 * Used in Node.js server testing to validate various server startup conditions,
 * configuration validation, error handling, and edge case scenarios.
 */

/**
 * Default server configurations for standard testing scenarios
 */
const defaultConfigs = {
  // Standard development configuration
  standard: {
    port: 3000,
    host: 'localhost',
    timeout: 5000,
    maxConnections: 1000,
    keepAlive: true,
    headers: {
      'X-Powered-By': 'Node.js Test Server',
      'Content-Type': 'application/json'
    }
  },

  // Minimal configuration with only required fields
  minimal: {
    port: 3000,
    host: 'localhost'
  },

  // Configuration with all optional fields set to defaults
  complete: {
    port: 3000,
    host: 'localhost',
    timeout: 5000,
    maxConnections: 1000,
    keepAlive: true,
    compression: false,
    cors: {
      enabled: false,
      origin: '*'
    },
    ssl: {
      enabled: false
    },
    logging: {
      level: 'info',
      enabled: true
    },
    headers: {
      'X-Powered-By': 'Node.js Test Server',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  }
};

/**
 * Custom server configurations for alternative setup testing
 */
const customConfigs = {
  // Alternative port configurations
  port8080: {
    port: 8080,
    host: 'localhost',
    timeout: 3000,
    maxConnections: 500
  },

  port8000: {
    port: 8000,
    host: 'localhost',
    timeout: 10000,
    maxConnections: 2000
  },

  // Alternative host configurations
  allInterfaces: {
    port: 3000,
    host: '0.0.0.0',
    timeout: 5000,
    maxConnections: 1000
  },

  loopback: {
    port: 3000,
    host: '127.0.0.1',
    timeout: 5000,
    maxConnections: 1000
  },

  // High-performance configuration
  highPerformance: {
    port: 3000,
    host: '0.0.0.0',
    timeout: 1000,
    maxConnections: 10000,
    keepAlive: true,
    compression: true,
    headers: {
      'X-Powered-By': 'High-Performance Node.js Server',
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  },

  // Security-focused configuration
  secure: {
    port: 443,
    host: 'localhost',
    timeout: 30000,
    maxConnections: 100,
    ssl: {
      enabled: true,
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem'
    },
    cors: {
      enabled: true,
      origin: 'https://trusted-domain.com',
      methods: ['GET', 'POST'],
      credentials: true
    },
    headers: {
      'X-Powered-By': 'Secure Node.js Server',
      'Content-Type': 'application/json',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }
  }
};

/**
 * Invalid server configurations for error handling testing
 */
const invalidConfigs = {
  // Invalid port numbers
  negativePort: {
    port: -1,
    host: 'localhost'
  },

  zeroPort: {
    port: 0,
    host: 'localhost'
  },

  oversizedPort: {
    port: 70000,
    host: 'localhost'
  },

  stringPort: {
    port: 'invalid',
    host: 'localhost'
  },

  // Invalid host configurations
  invalidHost: {
    port: 3000,
    host: 'invalid!!!host'
  },

  emptyHost: {
    port: 3000,
    host: ''
  },

  nullHost: {
    port: 3000,
    host: null
  },

  // Missing required fields
  missingPort: {
    host: 'localhost'
  },

  missingHost: {
    port: 3000
  },

  emptyConfig: {},

  // Invalid data types
  portAsObject: {
    port: { value: 3000 },
    host: 'localhost'
  },

  hostAsNumber: {
    port: 3000,
    host: 12345
  },

  // Invalid timeout values
  negativeTimeout: {
    port: 3000,
    host: 'localhost',
    timeout: -1000
  },

  // Invalid connection limits
  negativeMaxConnections: {
    port: 3000,
    host: 'localhost',
    maxConnections: -100
  },

  // Invalid SSL configuration
  invalidSSL: {
    port: 3000,
    host: 'localhost',
    ssl: {
      enabled: true,
      cert: '/nonexistent/cert.pem',
      key: 'invalid-key-format'
    }
  }
};

/**
 * Environment variable-based configurations for CI/CD testing
 */
const environmentConfigs = {
  // Configuration using PORT environment variable
  fromPortEnv: {
    port: process.env.PORT || 3000,
    host: 'localhost',
    timeout: 5000
  },

  // Configuration using multiple environment variables
  fromMultipleEnv: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    timeout: parseInt(process.env.TIMEOUT) || 5000,
    maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000
  },

  // CI/CD specific configuration
  cicd: {
    port: process.env.CI_PORT || process.env.PORT || 8080,
    host: process.env.CI_HOST || '0.0.0.0',
    timeout: parseInt(process.env.CI_TIMEOUT) || 10000,
    maxConnections: parseInt(process.env.CI_MAX_CONNECTIONS) || 500,
    logging: {
      level: process.env.LOG_LEVEL || 'debug',
      enabled: process.env.ENABLE_LOGGING !== 'false'
    }
  },

  // Development environment configuration
  development: {
    port: process.env.DEV_PORT || 3000,
    host: process.env.DEV_HOST || 'localhost',
    timeout: 5000,
    logging: {
      level: 'debug',
      enabled: true
    },
    cors: {
      enabled: true,
      origin: '*'
    }
  },

  // Production environment configuration
  production: {
    port: process.env.PROD_PORT || 80,
    host: process.env.PROD_HOST || '0.0.0.0',
    timeout: parseInt(process.env.PROD_TIMEOUT) || 30000,
    maxConnections: parseInt(process.env.PROD_MAX_CONNECTIONS) || 10000,
    ssl: {
      enabled: process.env.SSL_ENABLED === 'true',
      cert: process.env.SSL_CERT_PATH,
      key: process.env.SSL_KEY_PATH
    },
    logging: {
      level: process.env.LOG_LEVEL || 'error',
      enabled: process.env.ENABLE_LOGGING !== 'false'
    }
  },

  // Test environment configuration
  test: {
    port: process.env.TEST_PORT || 3001,
    host: process.env.TEST_HOST || 'localhost',
    timeout: parseInt(process.env.TEST_TIMEOUT) || 1000,
    maxConnections: parseInt(process.env.TEST_MAX_CONNECTIONS) || 100,
    logging: {
      level: 'silent',
      enabled: false
    }
  }
};

/**
 * Port conflict scenarios for testing port availability and conflict resolution
 */
const portConflictConfigs = {
  // Standard port that might be in use
  conflictPort3000: {
    port: 3000,
    host: 'localhost',
    fallbackPorts: [3001, 3002, 3003],
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Common development ports that might conflict
  conflictPort8080: {
    port: 8080,
    host: 'localhost',
    fallbackPorts: [8081, 8082, 8083],
    retryAttempts: 5,
    retryDelay: 500
  },

  // Port range for testing sequential port scanning
  portRange: {
    startPort: 3000,
    endPort: 3010,
    host: 'localhost',
    scanTimeout: 2000
  },

  // Multiple potential conflicts
  multipleConflicts: {
    port: 3000,
    host: 'localhost',
    fallbackPorts: [3001, 3002, 3003, 3004, 3005],
    retryAttempts: 10,
    retryDelay: 100,
    giveUpAfter: 30000
  },

  // Reserved ports that should not be used
  reservedPorts: {
    wellKnownPorts: [80, 443, 22, 21, 25, 53],
    systemPorts: [1, 7, 9, 13, 17, 19, 20],
    avoidPorts: [3000, 8000, 8080, 9000]
  },

  // Port conflict with immediate fallback
  immediateNallback: {
    port: 3000,
    host: 'localhost',
    fallbackPorts: [0], // Use dynamic port assignment
    retryAttempts: 1,
    retryDelay: 0
  }
};

/**
 * Dynamic port assignment configurations for automatic port discovery
 */
const dynamicConfigs = {
  // Automatic port discovery starting from default
  autoDiscovery: {
    port: 0, // Let OS assign available port
    host: 'localhost',
    preferredPortRange: {
      min: 3000,
      max: 3100
    },
    discovery: {
      strategy: 'sequential',
      timeout: 5000,
      maxAttempts: 50
    }
  },

  // Dynamic assignment with port range constraints
  constrainedRange: {
    port: 0,
    host: 'localhost',
    portRange: {
      min: 8000,
      max: 8999
    },
    discovery: {
      strategy: 'random',
      timeout: 3000,
      maxAttempts: 20
    }
  },

  // Dynamic assignment for testing environments
  testDynamic: {
    port: 0,
    host: '127.0.0.1',
    portRange: {
      min: 10000,
      max: 19999
    },
    discovery: {
      strategy: 'sequential',
      timeout: 1000,
      maxAttempts: 100
    },
    isolation: {
      processId: process.pid,
      testSuite: 'server-tests',
      parallel: true
    }
  },

  // Dynamic assignment with fallback to specific ports
  hybridDynamic: {
    port: 3000,
    host: 'localhost',
    fallbackToDynamic: true,
    dynamicRange: {
      min: 4000,
      max: 4999
    },
    discovery: {
      strategy: 'sequential',
      timeout: 2000,
      maxAttempts: 30
    }
  },

  // OS-managed port assignment
  osManaged: {
    port: 0, // OS assigns available port
    host: 'localhost',
    discovery: {
      strategy: 'os-assigned',
      timeout: 1000
    },
    retrieval: {
      method: 'address',
      callback: true
    }
  },

  // Clustered dynamic assignment
  clustered: {
    port: 0,
    host: 'localhost',
    cluster: {
      enabled: true,
      workers: 4,
      portOffset: 100 // Worker 0: base+0, Worker 1: base+100, etc.
    },
    discovery: {
      strategy: 'offset',
      basePort: 3000,
      timeout: 2000
    }
  }
};

/**
 * Main export object containing all mock server configurations
 * organized by testing scenario categories
 */
const mockServerConfigs = {
  default: defaultConfigs,
  custom: customConfigs,
  invalid: invalidConfigs,
  environment: environmentConfigs,
  portConflict: portConflictConfigs,
  dynamic: dynamicConfigs
};

export default mockServerConfigs;