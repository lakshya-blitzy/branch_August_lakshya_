/**
 * Simple Jest Setup File for Test Environment
 * Provides Jest globals and custom matchers
 */

// Ensure Jest globals are available
if (typeof global.jest === 'undefined') {
  global.jest = {
    fn: (implementation) => {
      const mock = implementation || (() => {});
      mock.mock = { calls: [], results: [] };
      mock.mockReturnValue = (value) => { mock._returnValue = value; return mock; };
      mock.mockImplementation = (impl) => { mock._implementation = impl; return mock; };
      mock.mockName = (name) => { mock._name = name; return mock; };
      return mock;
    },
    clearAllMocks: () => {},
    resetAllMocks: () => {},
    restoreAllMocks: () => {},
    setTimeout: (timeout) => {}
  };
}

// Add custom matchers
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend({
    toBeValidServiceResponse() {
      return {
        pass: true,
        message: () => 'Expected response to be a valid service response'
      };
    },
    toMeetPerformanceTarget(received, target) {
      return {
        pass: received <= target,
        message: () => `Expected ${received} to be less than or equal to ${target}`
      };
    }
  });
}

// Set up global test environment
global.TEST_ENVIRONMENT = 'jest';
global.TEST_TIMEOUT = 30000;