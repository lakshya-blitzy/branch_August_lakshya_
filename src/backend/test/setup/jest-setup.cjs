/**
 * Simple Jest Setup File for Test Environment (CommonJS)
 * Provides Jest globals and custom matchers
 */

console.log('Loading jest-setup.cjs file with custom matchers...');

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
    toBeValidServiceResponse(received) {
      // Check if received is a valid service response with required properties
      const isObject = received && typeof received === 'object' && !Array.isArray(received);
      const hasSuccess = isObject && received.hasOwnProperty('success');
      const hasMetadata = isObject && received.hasOwnProperty('metadata');
      const hasValidTimestamp = isObject && received.metadata && received.metadata.timestamp;
      
      const pass = isObject && hasSuccess && hasMetadata && hasValidTimestamp;
      
      if (pass) {
        return {
          message: () => `expected ${this.utils.printReceived(received)} not to be a valid service response`,
          pass: true
        };
      } else {
        const missing = [];
        if (!isObject) missing.push('to be an object');
        if (!hasSuccess) missing.push('success property');  
        if (!hasMetadata) missing.push('metadata property');
        if (!hasValidTimestamp) missing.push('metadata.timestamp');
        
        return {
          message: () => `expected ${this.utils.printReceived(received)} to be a valid service response (missing: ${missing.join(', ')})`,
          pass: false
        };
      }
    },
    toMeetPerformanceTarget(received, target) {
      const receivedNum = typeof received === 'number' ? received : parseFloat(received);
      const targetNum = typeof target === 'number' ? target : parseFloat(target);
      
      if (isNaN(receivedNum) || isNaN(targetNum)) {
        return {
          message: () => `expected both values to be numbers, got received: ${typeof received}, target: ${typeof target}`,
          pass: false
        };
      }
      
      const pass = receivedNum <= targetNum;
      
      if (pass) {
        return {
          message: () => `expected ${receivedNum}ms not to be less than or equal to ${targetNum}ms`,
          pass: true
        };
      } else {
        const difference = receivedNum - targetNum;
        const percentOver = ((receivedNum / targetNum) * 100 - 100).toFixed(1);
        return {
          message: () => `expected ${receivedNum}ms to be less than or equal to ${targetNum}ms (exceeded by ${difference}ms, ${percentOver}% over target)`,
          pass: false
        };
      }
    }
  });
  
  console.log('Custom Jest matchers loaded successfully: toBeValidServiceResponse, toMeetPerformanceTarget');
} else {
  console.warn('expect.extend not available - custom matchers could not be loaded');
}

// Set up global test environment
global.TEST_ENVIRONMENT = 'jest';
global.TEST_TIMEOUT = 30000;