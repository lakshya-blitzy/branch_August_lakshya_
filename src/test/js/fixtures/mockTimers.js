/**
 * Mock Timer Utilities for Node.js Server Testing
 * 
 * Provides comprehensive timer mocking utilities for testing timeout behavior,
 * asynchronous operations, and time-based functionality in Node.js server environments.
 * 
 * Features:
 * - Jest timer mocking for setTimeout, setInterval, clearTimeout, clearInterval
 * - Utilities for advancing timers and running pending timers
 * - Mock Date objects for time-based testing
 * - performance.now() mocks for measuring execution time
 * - Support for testing request timeouts, connection timeouts, graceful shutdown delays
 * - Retry logic with configurable delays including exponential backoff
 * 
 * @module mockTimers
 * @version 1.0.0
 */

// Import modules with fallbacks for standalone operation
let jestAPI;
try {
  // Try to access global Jest functions (available when running under Jest)
  jestAPI = (typeof global !== 'undefined' && global.jest) || 
            (typeof window !== 'undefined' && window.jest) ||
            // Create fallback Jest-like functions for standalone operation
            createJestFallback();
} catch (error) {
  jestAPI = createJestFallback();
}

const { performance } = require('perf_hooks');
const util = require('util');

/**
 * Create fallback Jest-like functions for standalone operation
 * This allows the module to work outside of Jest environment
 */
function createJestFallback() {
  const mockFunctions = new Map();
  
  return {
    fn: (implementation) => {
      const mockFn = implementation || (() => {});
      mockFn.mock = {
        calls: [],
        instances: [],
        results: [],
        invocationCallOrder: []
      };
      mockFn.mockClear = () => {
        mockFn.mock.calls = [];
        mockFn.mock.instances = [];
        mockFn.mock.results = [];
        mockFn.mock.invocationCallOrder = [];
      };
      mockFn.mockImplementation = (newImplementation) => {
        const originalFn = mockFn;
        return function(...args) {
          const result = newImplementation.apply(this, args);
          originalFn.mock.calls.push(args);
          originalFn.mock.results.push({ type: 'return', value: result });
          return result;
        };
      };
      return mockFn;
    },
    spyOn: (object, method) => {
      if (!object || typeof object[method] !== 'function') {
        throw new Error(`Cannot spy on property ${method} because it is not a function`);
      }
      const originalMethod = object[method];
      const spy = jestAPI.fn(originalMethod);
      spy.mockImplementation = (impl) => {
        object[method] = jestAPI.fn(impl || originalMethod);
        return object[method];
      };
      spy.mockRestore = () => {
        object[method] = originalMethod;
      };
      return spy;
    },
    useFakeTimers: (options = {}) => {
      // Fallback implementation for standalone operation
      console.log('Jest useFakeTimers called with options:', options);
      return {
        advanceTimers: options.advanceTimers || false,
        doNotFake: options.doNotFake || [],
        now: options.now || Date.now(),
        timerLimit: options.timerLimit || 100
      };
    },
    useRealTimers: () => {
      // Fallback implementation for standalone operation
      console.log('Jest useRealTimers called');
      return {};
    },
    advanceTimersByTime: (msToRun) => {
      // Fallback implementation for standalone operation
      console.log(`Jest advanceTimersByTime called with ${msToRun}ms`);
      return {};
    },
    runOnlyPendingTimers: () => {
      // Fallback implementation for standalone operation
      console.log('Jest runOnlyPendingTimers called');
      return {};
    },
    runAllTimers: () => {
      // Fallback implementation for standalone operation
      console.log('Jest runAllTimers called');
      return {};
    },
    restoreAllMocks: () => {
      // Fallback implementation for standalone operation
      console.log('Jest restoreAllMocks called');
      mockFunctions.clear();
    },
    clearAllTimers: () => {
      // Fallback implementation for standalone operation
      console.log('Jest clearAllTimers called');
    }
  };
}

/**
 * Performance Measurement Mock Utilities
 * 
 * Provides comprehensive mocking capabilities for Node.js performance measurement APIs
 * including performance.now(), performance.mark(), and performance.measure() for
 * testing execution time and performance monitoring in server scenarios.
 */
const performanceMocks = {
  /**
   * Create a mock performance.now() function
   * @param {number} startTime - Starting time in milliseconds (default: 0)
   * @returns {Function} Mocked performance.now function
   */
  createNowMock: (startTime = 0) => {
    let currentTime = startTime;
    return jestAPI.fn(() => {
      return currentTime;
    });
  },

  /**
   * Create a controllable performance.now() mock that can be advanced
   * @param {number} startTime - Starting time in milliseconds (default: 0)
   * @returns {Object} Mock controller with now function and advance method
   */
  createAdvancableNowMock: (startTime = 0) => {
    let currentTime = startTime;
    const nowMock = jestAPI.fn(() => currentTime);
    
    return {
      now: nowMock,
      advance: (milliseconds) => {
        currentTime += milliseconds;
        return currentTime;
      },
      reset: (newStartTime = 0) => {
        currentTime = newStartTime;
        nowMock.mockClear();
      },
      getCurrentTime: () => currentTime
    };
  },

  /**
   * Mock performance.mark() for performance timeline testing
   * @returns {Function} Mocked performance.mark function
   */
  createMarkMock: () => {
    const marks = new Map();
    return jestAPI.fn((name) => {
      marks.set(name, performance.now());
      return marks.get(name);
    });
  },

  /**
   * Mock performance.measure() for duration measurement testing
   * @param {Function} markMock - Associated mark mock function
   * @returns {Function} Mocked performance.measure function
   */
  createMeasureMock: (markMock) => {
    const measurements = new Map();
    return jestAPI.fn((name, startMark, endMark) => {
      const startTime = markMock.mock.calls.find(call => call[0] === startMark)?.[1] || 0;
      const endTime = markMock.mock.calls.find(call => call[0] === endMark)?.[1] || performance.now();
      const duration = endTime - startTime;
      measurements.set(name, { duration, startTime, endTime });
      return measurements.get(name);
    });
  },

  /**
   * Complete performance API mock suite
   * @param {Object} options - Mock configuration options
   * @returns {Object} Complete mocked performance API
   */
  createPerformanceMock: (options = {}) => {
    const { startTime = 0, autoAdvance = false } = options;
    const nowController = performanceMocks.createAdvancableNowMock(startTime);
    const markMock = performanceMocks.createMarkMock();
    const measureMock = performanceMocks.createMeasureMock(markMock);

    const performanceMock = {
      now: nowController.now,
      mark: markMock,
      measure: measureMock,
      
      // Test utilities
      advance: nowController.advance,
      reset: nowController.reset,
      getCurrentTime: nowController.getCurrentTime,
      getMarks: () => markMock.mock.calls,
      getMeasurements: () => measureMock.mock.calls
    };

    if (autoAdvance) {
      // Auto-advance timers when performance.now() is called
      const originalNow = nowController.now;
      performanceMock.now = jestAPI.fn(() => {
        const result = originalNow();
        nowController.advance(1); // Advance by 1ms each call
        return result;
      });
    }

    return performanceMock;
  }
};

/**
 * Utility Function Helpers
 * 
 * Leverages Node.js util module for enhanced testing capabilities including
 * promisification of callback-based timer functions and inspection utilities.
 */
const utilHelpers = {
  /**
   * Create promisified version of setTimeout for async testing
   * @returns {Function} Promisified setTimeout function
   */
  createPromisifiedTimeout: () => {
    return util.promisify(setTimeout);
  },

  /**
   * Create promisified version of setImmediate for async testing
   * @returns {Function} Promisified setImmediate function
   */
  createPromisifiedImmediate: () => {
    return util.promisify(setImmediate);
  },

  /**
   * Convert promise-based delay to callback-based for testing
   * @param {Function} promiseFn - Promise-based function to convert
   * @returns {Function} Callback-based function
   */
  promiseToCallback: (promiseFn) => {
    return util.callbackify(promiseFn);
  },

  /**
   * Inspect timer objects for debugging and testing validation
   * @param {Object} timerObj - Timer object to inspect
   * @param {Object} options - Inspection options
   * @returns {string} Formatted inspection output
   */
  inspectTimer: (timerObj, options = {}) => {
    return util.inspect(timerObj, {
      depth: options.depth || 3,
      colors: options.colors !== undefined ? options.colors : true,
      showHidden: options.showHidden || false,
      ...options
    });
  }
};

/**
 * Advanced Timer Testing Scenarios
 * 
 * Provides high-level testing scenarios for common server timeout patterns
 * including request timeouts, connection management, and graceful shutdown testing.
 */
const timerScenarios = {
  /**
   * Create a request timeout testing scenario
   * @param {number} timeoutMs - Request timeout in milliseconds
   * @param {Function} requestHandler - Function to execute with timeout
   * @returns {Promise} Promise that resolves or rejects based on timeout
   */
  createRequestTimeoutScenario: (timeoutMs, requestHandler) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      requestHandler()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  },

  /**
   * Create a connection timeout testing scenario
   * @param {number} timeoutMs - Connection timeout in milliseconds
   * @param {Function} connectionAttempt - Function that attempts connection
   * @returns {Promise} Promise that resolves when connected or rejects on timeout
   */
  createConnectionTimeoutScenario: (timeoutMs, connectionAttempt) => {
    return Promise.race([
      connectionAttempt(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Connection timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  },

  /**
   * Create a graceful shutdown testing scenario
   * @param {number} gracePeriodMs - Grace period for shutdown in milliseconds
   * @param {Function} shutdownHandler - Function to handle shutdown
   * @returns {Promise} Promise that resolves when shutdown completes
   */
  createGracefulShutdownScenario: (gracePeriodMs, shutdownHandler) => {
    return new Promise((resolve, reject) => {
      let shutdownCompleted = false;

      // Start shutdown process
      shutdownHandler()
        .then(() => {
          shutdownCompleted = true;
          resolve();
        })
        .catch(reject);

      // Force shutdown after grace period
      setTimeout(() => {
        if (!shutdownCompleted) {
          reject(new Error(`Graceful shutdown failed within ${gracePeriodMs}ms grace period`));
        }
      }, gracePeriodMs);
    });
  },

  /**
   * Create a retry scenario with configurable backoff
   * @param {Function} operation - Operation to retry
   * @param {Object} retryOptions - Retry configuration
   * @returns {Promise} Promise that resolves on success or rejects after max attempts
   */
  createRetryScenario: async (operation, retryOptions = {}) => {
    const {
      maxAttempts = 3,
      strategy = 'exponential',
      baseDelay = 1000,
      maxDelay = 30000,
      jitter = false
    } = retryOptions;

    let lastError;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts - 1) {
          throw new Error(`Operation failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
        }

        const delay = delays.retryDelay(attempt, {
          strategy,
          baseDelay,
          maxDelay,
          jitter
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

/**
 * Jest Timer Control Utilities
 * 
 * Provides centralized access to Jest's timer mocking capabilities for comprehensive
 * timeout and asynchronous behavior testing in server scenarios.
 */
const jestTimers = {
  /**
   * Enable fake timers to mock setTimeout, setInterval, and Date.now()
   * @param {Object} options - Timer configuration options
   * @returns {void}
   */
  useFakeTimers: (options = {}) => {
    return jestAPI.useFakeTimers({
      advanceTimers: options.advanceTimers || false,
      doNotFake: options.doNotFake || [],
      now: options.now || Date.now(),
      timerLimit: options.timerLimit || 100,
      ...options
    });
  },

  /**
   * Restore real timers for normal execution
   * @returns {void}
   */
  useRealTimers: () => {
    return jestAPI.useRealTimers();
  },

  /**
   * Advance all timers by specified time in milliseconds
   * @param {number} msToRun - Milliseconds to advance timers
   * @returns {void}
   */
  advanceTimersByTime: (msToRun) => {
    return jestAPI.advanceTimersByTime(msToRun);
  },

  /**
   * Run only currently pending timers without advancing time
   * @returns {void}
   */
  runOnlyPendingTimers: () => {
    return jestAPI.runOnlyPendingTimers();
  },

  /**
   * Run all timers until none are left in the queue
   * @returns {void}
   */
  runAllTimers: () => {
    return jestAPI.runAllTimers();
  },

  /**
   * Create Jest spy functions for timer callback testing
   * @param {Function} implementation - Optional implementation function
   * @returns {Function} Jest spy function
   */
  createTimerSpy: (implementation) => {
    return jestAPI.spyOn(global, 'setTimeout').mockImplementation(implementation || jestAPI.fn());
  },

  /**
   * Create Jest mock function for timer callback testing
   * @param {Function} implementation - Optional implementation function
   * @returns {Function} Jest mock function
   */
  createTimerMock: (implementation) => {
    return jestAPI.fn(implementation);
  },

  /**
   * Reset all timer mocks and spies
   * @returns {void}
   */
  resetTimerMocks: () => {
    jestAPI.restoreAllMocks();
    jestAPI.clearAllTimers();
  }
};

/**
 * Predefined Timeout Values
 * 
 * Standard timeout configurations for different server testing scenarios
 * following Node.js Service Resource Management requirements.
 */
const timeouts = {
  /**
   * Short timeout for quick operations (100ms)
   * Used for immediate response validation and quick checks
   */
  shortTimeout: 100,

  /**
   * Long timeout for standard operations (5000ms)
   * Used for standard HTTP request/response cycles and database operations
   */
  longTimeout: 5000,

  /**
   * Very long timeout for complex operations (30000ms)  
   * Used for file uploads, large data processing, and complex integrations
   */
  veryLongTimeout: 30000,

  /**
   * Request timeout for HTTP operations (10000ms)
   * Standard timeout for external API calls and HTTP request processing
   */
  requestTimeout: 10000,

  /**
   * Shutdown timeout for graceful server termination (15000ms)
   * Timeout for graceful server shutdown with connection cleanup
   */
  shutdownTimeout: 15000
};

/**
 * Predefined Interval Values
 * 
 * Standard interval configurations for periodic operations and monitoring
 * in server testing scenarios.
 */
const intervals = {
  /**
   * Health check interval for server monitoring (1000ms)
   * Used for periodic health status validation and availability checks
   */
  healthCheck: 1000,

  /**
   * Monitoring interval for performance metrics (5000ms)
   * Used for periodic performance data collection and resource monitoring
   */
  monitoring: 5000,

  /**
   * Cleanup interval for resource management (30000ms)
   * Used for periodic cleanup operations and garbage collection
   */
  cleanup: 30000
};

/**
 * Delay Calculation Utilities
 * 
 * Provides various delay calculation strategies for retry mechanisms,
 * backoff algorithms, and jitter implementations.
 */
const delays = {
  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current retry attempt (0-based)
   * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
   * @param {number} maxDelay - Maximum delay in milliseconds (default: 30000)
   * @param {number} multiplier - Exponential multiplier (default: 2)
   * @returns {number} Calculated delay in milliseconds
   */
  exponentialBackoff: (attempt, baseDelay = 1000, maxDelay = 30000, multiplier = 2) => {
    const delay = baseDelay * Math.pow(multiplier, attempt);
    return Math.min(delay, maxDelay);
  },

  /**
   * Calculate linear backoff delay
   * @param {number} attempt - Current retry attempt (0-based)
   * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
   * @param {number} increment - Linear increment per attempt (default: 1000)
   * @param {number} maxDelay - Maximum delay in milliseconds (default: 30000)
   * @returns {number} Calculated delay in milliseconds
   */
  linearBackoff: (attempt, baseDelay = 1000, increment = 1000, maxDelay = 30000) => {
    const delay = baseDelay + (attempt * increment);
    return Math.min(delay, maxDelay);
  },

  /**
   * Calculate jitter delay for randomized backoff
   * @param {number} baseDelay - Base delay in milliseconds
   * @param {number} jitterPercent - Jitter percentage (0-100, default: 25)
   * @returns {number} Calculated delay with jitter in milliseconds
   */
  jitterDelay: (baseDelay, jitterPercent = 25) => {
    const jitterRange = baseDelay * (jitterPercent / 100);
    const jitter = (Math.random() * 2 - 1) * jitterRange; // Random between -jitterRange and +jitterRange
    return Math.max(0, Math.round(baseDelay + jitter));
  },

  /**
   * Calculate retry delay with configurable strategy
   * @param {number} attempt - Current retry attempt (0-based)
   * @param {Object} options - Retry configuration options
   * @param {string} options.strategy - Retry strategy ('exponential' | 'linear' | 'fixed')
   * @param {number} options.baseDelay - Base delay in milliseconds
   * @param {number} options.maxDelay - Maximum delay in milliseconds
   * @param {number} options.jitter - Enable jitter (default: false)
   * @param {number} options.jitterPercent - Jitter percentage if enabled
   * @returns {number} Calculated retry delay in milliseconds
   */
  retryDelay: (attempt, options = {}) => {
    const {
      strategy = 'exponential',
      baseDelay = 1000,
      maxDelay = 30000,
      jitter = false,
      jitterPercent = 25,
      multiplier = 2,
      increment = 1000
    } = options;

    let delay;
    
    switch (strategy) {
      case 'exponential':
        delay = delays.exponentialBackoff(attempt, baseDelay, maxDelay, multiplier);
        break;
      case 'linear':
        delay = delays.linearBackoff(attempt, baseDelay, increment, maxDelay);
        break;
      case 'fixed':
      default:
        delay = baseDelay;
        break;
    }

    if (jitter) {
      delay = delays.jitterDelay(delay, jitterPercent);
    }

    return delay;
  }
};

/**
 * Timer Test Fixtures and Examples
 * 
 * Provides pre-configured test fixtures and example usage patterns for common
 * server timeout testing scenarios.
 */
const timerFixtures = {
  /**
   * Common server response time test scenarios
   */
  serverResponseScenarios: {
    /**
     * Fast response scenario - under 100ms
     */
    fastResponse: {
      timeout: timeouts.shortTimeout,
      expectedTime: 50,
      tolerance: 25
    },

    /**
     * Standard response scenario - under 5 seconds
     */
    standardResponse: {
      timeout: timeouts.longTimeout,
      expectedTime: 2000,
      tolerance: 500
    },

    /**
     * Slow response scenario - under 30 seconds
     */
    slowResponse: {
      timeout: timeouts.veryLongTimeout,
      expectedTime: 15000,
      tolerance: 5000
    }
  },

  /**
   * HTTP request timeout patterns for different endpoints
   */
  httpTimeoutPatterns: {
    /**
     * API endpoint timeouts
     */
    api: {
      healthCheck: 2000,
      userLogin: 5000,
      dataUpload: 30000,
      reportGeneration: 60000
    },

    /**
     * Database operation timeouts
     */
    database: {
      simpleQuery: 1000,
      complexQuery: 10000,
      migration: 300000,
      backup: 1800000
    },

    /**
     * External service timeouts
     */
    external: {
      thirdPartyApi: 15000,
      emailService: 10000,
      fileStorage: 20000,
      paymentGateway: 30000
    }
  },

  /**
   * Retry configuration patterns for different failure scenarios
   */
  retryPatterns: {
    /**
     * Network retry pattern with exponential backoff
     */
    networkRetry: {
      maxAttempts: 3,
      strategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
      jitter: true,
      jitterPercent: 25
    },

    /**
     * Database retry pattern with linear backoff
     */
    databaseRetry: {
      maxAttempts: 5,
      strategy: 'linear',
      baseDelay: 500,
      increment: 500,
      maxDelay: 5000,
      jitter: false
    },

    /**
     * Quick retry pattern for transient failures
     */
    quickRetry: {
      maxAttempts: 3,
      strategy: 'fixed',
      baseDelay: 100,
      maxDelay: 100,
      jitter: false
    },

    /**
     * Critical operation retry with aggressive backoff
     */
    criticalRetry: {
      maxAttempts: 10,
      strategy: 'exponential',
      baseDelay: 2000,
      maxDelay: 60000,
      jitter: true,
      jitterPercent: 50
    }
  },

  /**
   * Server lifecycle timeout configurations
   */
  serverLifecycleTimeouts: {
    /**
     * Startup sequence timeouts
     */
    startup: {
      databaseConnection: 5000,
      configurationLoad: 2000,
      serviceDiscovery: 10000,
      healthCheck: 3000,
      totalStartup: 30000
    },

    /**
     * Shutdown sequence timeouts
     */
    shutdown: {
      gracefulShutdown: timeouts.shutdownTimeout,
      connectionDrain: 10000,
      pendingRequestsComplete: 5000,
      resourceCleanup: 3000,
      forceShutdown: 2000
    },

    /**
     * Runtime operation timeouts
     */
    runtime: {
      requestProcessing: timeouts.requestTimeout,
      sessionTimeout: 1800000, // 30 minutes
      cacheExpiry: 300000, // 5 minutes
      logRotation: 86400000 // 24 hours
    }
  }
};

/**
 * Timer Mock Factory Functions
 * 
 * Factory functions for creating specific timer mock configurations
 * tailored to different testing scenarios.
 */
const timerMockFactory = {
  /**
   * Create a complete timer testing environment
   * @param {Object} config - Configuration options
   * @returns {Object} Complete timer testing environment
   */
  createTimerTestEnv: (config = {}) => {
    const {
      useFakeTimers = true,
      enablePerformanceMocks = true,
      autoAdvanceTime = false,
      startTime = 0
    } = config;

    const env = {};

    if (useFakeTimers) {
      jestTimers.useFakeTimers({ 
        advanceTimers: autoAdvanceTime,
        now: startTime
      });
      env.timers = jestTimers;
    }

    if (enablePerformanceMocks) {
      env.performance = performanceMocks.createPerformanceMock({
        startTime,
        autoAdvance: autoAdvanceTime
      });
    }

    env.utils = utilHelpers;
    env.scenarios = timerScenarios;
    env.fixtures = timerFixtures;

    // Cleanup function
    env.cleanup = () => {
      if (useFakeTimers) {
        jestTimers.useRealTimers();
      }
      jestAPI.restoreAllMocks();
    };

    return env;
  },

  /**
   * Create timeout test suite for server endpoint
   * @param {string} endpointName - Name of the endpoint being tested
   * @param {Object} timeoutConfig - Timeout configuration
   * @returns {Object} Test suite configuration
   */
  createEndpointTimeoutSuite: (endpointName, timeoutConfig = {}) => {
    const {
      requestTimeout = timeouts.requestTimeout,
      connectionTimeout = 5000,
      responseTimeout = 3000,
      retryConfig = timerFixtures.retryPatterns.networkRetry
    } = timeoutConfig;

    return {
      endpoint: endpointName,
      timeouts: {
        request: requestTimeout,
        connection: connectionTimeout,
        response: responseTimeout
      },
      retry: retryConfig,
      
      // Test scenario generators
      createTimeoutTest: () => {
        return timerScenarios.createRequestTimeoutScenario(
          requestTimeout,
          () => new Promise(resolve => setTimeout(resolve, responseTimeout))
        );
      },

      createRetryTest: (failingOperation) => {
        return timerScenarios.createRetryScenario(failingOperation, retryConfig);
      },

      createConnectionTest: (connectionAttempt) => {
        return timerScenarios.createConnectionTimeoutScenario(
          connectionTimeout,
          connectionAttempt
        );
      }
    };
  },

  /**
   * Create graceful shutdown test configuration
   * @param {Object} shutdownConfig - Shutdown configuration
   * @returns {Object} Shutdown test configuration
   */
  createShutdownTestConfig: (shutdownConfig = {}) => {
    const {
      gracePeriod = timeouts.shutdownTimeout,
      drainConnections = true,
      waitForPendingRequests = true,
      cleanupResources = true
    } = shutdownConfig;

    return {
      gracePeriod,
      phases: {
        connectionDrain: drainConnections ? 5000 : 0,
        pendingRequests: waitForPendingRequests ? 3000 : 0,
        resourceCleanup: cleanupResources ? 2000 : 0
      },
      
      createShutdownTest: (shutdownHandler) => {
        return timerScenarios.createGracefulShutdownScenario(
          gracePeriod,
          shutdownHandler
        );
      }
    };
  }
};

// Export all timer utilities for testing server timeout behavior
module.exports = {
  // Required exports per schema - exact match to specification
  jestTimers,
  timeouts, 
  intervals,
  delays,
  
  // Additional comprehensive timer testing utilities
  performanceMocks,
  utilHelpers,
  timerScenarios,
  timerFixtures,
  timerMockFactory,
  
  // Direct access to external dependencies for advanced usage
  jestAPI: jestAPI,
  performance,
  util
};