import express from 'express';
import supertest from 'supertest';
import { createEndpointSpecificLimiter } from './middleware/rate-limiter.js';

async function debugRateTest() {
  console.log('Creating test app...');
  const testApp = express();
  
  console.log('Creating rate limiters...');
  
  try {
    const strictLimiter = createEndpointSpecificLimiter('/sensitive', {
      windowMs: 10000,
      max: 3,
      message: 'Strict rate limit exceeded'
    });
    console.log('Strict limiter created successfully');

    testApp.get('/sensitive', strictLimiter, (req, res) => {
      res.json({ message: 'Sensitive endpoint', timestamp: new Date().toISOString() });
    });

    const request = supertest(testApp);
    
    // Test the exact same pattern as the failing test
    console.log('Testing rate limiting behavior...');
    
    // First 3 requests should succeed
    for (let i = 1; i <= 3; i++) {
      console.log(`Making request ${i}/3...`);
      const response = await request
        .get('/sensitive')
        .set('X-Test-Client', 'endpoint-test');
      console.log(`Request ${i} - Status: ${response.status}, Headers:`, {
        rateLimitUsed: response.headers['ratelimit-used'],
        rateLimitRemaining: response.headers['ratelimit-remaining'],
        retryAfter: response.headers['retry-after']
      });
    }
    
    // Fourth request should be rate limited
    console.log('Making request 4/4 (should be rate limited)...');
    const response4 = await request
      .get('/sensitive')
      .set('X-Test-Client', 'endpoint-test');
    console.log(`Request 4 - Status: ${response4.status}, Body:`, response4.body);
    
    console.log('All requests completed');
    return { success: true };
    
  } catch (error) {
    console.error('Error in test:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

debugRateTest().then(result => {
  console.log('Final result:', result);
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});