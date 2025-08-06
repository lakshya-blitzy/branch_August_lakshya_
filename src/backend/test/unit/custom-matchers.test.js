/**
 * Simple test to verify custom Jest matchers are working
 */

// Add custom matchers directly to verify they work
beforeAll(() => {
  expect.extend({
    toBeValidServiceResponse(received) {
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
});

describe('Custom Jest Matchers Test', () => {
  test('should have toBeValidServiceResponse matcher', () => {
    const validResponse = {
      success: true,
      data: { message: 'test' },
      metadata: {
        timestamp: '2025-01-01T00:00:00.000Z'
      }
    };
    
    expect(validResponse).toBeValidServiceResponse();
  });

  test('should have toMeetPerformanceTarget matcher', () => {
    expect(100).toMeetPerformanceTarget(200);
    expect(50).toMeetPerformanceTarget(100);
  });
});