import express from 'express';
import supertest from 'supertest';
import { createEndpointSpecificLimiter } from './middleware/rate-limiter.js';

async function debugEndpointTest() {
  console.log('Creating test app for endpoint debugging...');
  const testApp = express();
  
  const config = { maxRequests: 5, window: 10000 };
  
  console.log('Creating rate limiters with config:', config);
  
  // Configure different rate limits for different endpoints
  const strictLimiter = createEndpointSpecificLimiter('/sensitive', {
    windowMs: config.window,
    max: 3, // Strict limit for sensitive endpoints
    message: 'Strict rate limit exceeded'
  });
  
  const moderateLimiter = createEndpointSpecificLimiter('/standard', {
    windowMs: config.window,
    max: config.maxRequests, // Standard limit (5)
    message: 'Moderate rate limit exceeded'
  });
  
  const lenientLimiter = createEndpointSpecificLimiter('/lenient', {
    windowMs: config.window,
    max: config.maxRequests * 2, // Higher limit (10)
    message: 'Lenient rate limit exceeded'
  });

  // Apply different rate limiting to different endpoints
  testApp.get('/sensitive', strictLimiter, (req, res) => {
    res.json({ message: 'Sensitive endpoint', timestamp: new Date().toISOString() });
  });
  
  testApp.get('/standard', moderateLimiter, (req, res) => {
    res.json({ message: 'Standard endpoint', timestamp: new Date().toISOString() });
  });
  
  testApp.get('/lenient', lenientLimiter, (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  const request = supertest(testApp);

  try {
    console.log('\n=== Testing /sensitive endpoint (limit: 3) ===');
    let successfulSensitive = 0;
    
    // Test strict endpoint - should allow 3, block 4th
    for (let i = 1; i <= 4; i++) {
      const response = await request
        .get('/sensitive')
        .set('X-Test-Client', 'endpoint-test');
      
      console.log(`Request ${i}/4: Status ${response.status}, Remaining: ${response.headers['ratelimit-remaining']}`);
      if (response.status === 200) successfulSensitive++;
    }
    
    console.log(`\n=== Testing /standard endpoint (limit: ${config.maxRequests}) ===`);
    let successfulStandard = 0;
    
    // Test moderate endpoint - should allow exactly config.maxRequests (5)
    for (let i = 1; i <= config.maxRequests + 1; i++) {
      const response = await request
        .get('/standard')
        .set('X-Test-Client', 'endpoint-test-2');
      
      console.log(`Request ${i}/${config.maxRequests + 1}: Status ${response.status}, Remaining: ${response.headers['ratelimit-remaining']}`);
      if (response.status === 200) successfulStandard++;
    }

    console.log(`\n=== Testing /lenient endpoint (limit: ${config.maxRequests * 2}) ===`);
    let successfulLenient = 0;
    
    // Test lenient endpoint - should allow config.maxRequests * 2 (10)
    console.log(`Testing /lenient endpoint: expecting limit of ${config.maxRequests * 2}, making ${config.maxRequests + 5} requests`);
    for (let i = 1; i <= config.maxRequests + 5; i++) {
      const response = await request
        .get('/lenient')
        .set('X-Test-Client', 'endpoint-test-3');
      
      if (i <= 3 || i > config.maxRequests + 3) { // Only log first few and last few
        console.log(`Request ${i}/${config.maxRequests + 5 + 1}: Status ${response.status}, Remaining: ${response.headers['ratelimit-remaining']}`);
      }
      if (response.status === 200) successfulLenient++;
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Sensitive endpoint: ${successfulSensitive} successful requests (expected: 3)`);
    console.log(`Standard endpoint: ${successfulStandard} successful requests (expected: ${config.maxRequests})`);
    console.log(`Lenient endpoint: ${successfulLenient} successful requests (expected: ${config.maxRequests * 2})`);
    
    // Check test expectations
    const strictLimitEnforced = successfulSensitive === 3;
    const moderateLimitFunctional = successfulStandard === config.maxRequests;
    const lenientLimitAllowsMore = successfulLenient === config.maxRequests * 2;
    
    console.log('\n=== TEST CONDITIONS ===');
    console.log(`strictLimitEnforced: ${strictLimitEnforced}`);
    console.log(`moderateLimitFunctional: ${moderateLimitFunctional}`);
    console.log(`lenientLimitAllowsMore: ${lenientLimitAllowsMore}`);
    
    const success = strictLimitEnforced && moderateLimitFunctional && lenientLimitAllowsMore;
    console.log(`\nOverall test success: ${success}`);
    
    return { success };
    
  } catch (error) {
    console.error('Error in test:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

debugEndpointTest().then(result => {
  console.log('\nFinal result:', result);
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});