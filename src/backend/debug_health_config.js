import express from 'express';
import supertest from 'supertest';
import { createEndpointSpecificLimiter } from './middleware/rate-limiter.js';

async function debugHealthConfig() {
  console.log('Testing health endpoint configuration...');
  
  const testApp = express();
  
  // Test the exact same configuration as the failing test
  const customConfig = {
    windowMs: 10000,
    max: 10, // We expect this to be the actual limit
    message: 'Lenient rate limit exceeded'
  };
  
  console.log('Creating health endpoint limiter with config:', customConfig);
  
  const healthLimiter = createEndpointSpecificLimiter('/health', customConfig);
  
  testApp.get('/health', healthLimiter, (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  const request = supertest(testApp);

  try {
    console.log('\n=== Testing /health endpoint ===');
    console.log('Expected limit: 10 requests');
    console.log('Making 12 requests to see where it stops...');
    
    let successCount = 0;
    let firstFailure = null;
    
    for (let i = 1; i <= 12; i++) {
      const response = await request
        .get('/health')
        .set('X-Test-Client', 'health-debug');
      
      if (response.status === 200) {
        successCount++;
        console.log(`Request ${i}: ✓ SUCCESS (Status: ${response.status}, Remaining: ${response.headers['ratelimit-remaining']})`);
      } else {
        console.log(`Request ${i}: ✗ BLOCKED (Status: ${response.status}, Remaining: ${response.headers['ratelimit-remaining']})`);
        if (!firstFailure) {
          firstFailure = i;
          console.log('First failure details:', {
            status: response.status,
            headers: response.headers,
            body: response.body
          });
        }
      }
    }
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Successful requests: ${successCount}/12`);
    console.log(`First failure at request: ${firstFailure || 'none (all succeeded)'}`);
    console.log(`Expected limit reached: ${successCount === 10 ? 'YES ✓' : 'NO ✗'}`);
    
    if (successCount !== 10) {
      console.log(`\n⚠️  ISSUE DETECTED:`);
      console.log(`Expected exactly 10 successful requests, but got ${successCount}`);
      if (successCount > 10) {
        console.log(`This suggests the custom config (max: 10) is being overridden`);
        console.log(`by the default health endpoint config (max: 1000)`);
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugHealthConfig().then(() => {
  console.log('\nHealth configuration debug completed');
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});