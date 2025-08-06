#!/usr/bin/env node

/**
 * Quick 404 test to verify our fix
 */

import { createApp } from './app.js';
import supertest from 'supertest';

console.log('🔍 Testing 404 fix...');

try {
  const app = await createApp();
  const request = supertest(app);
  
  console.log('✅ Testing known endpoint (/hello)...');
  const helloResponse = await request.get('/hello');
  console.log(`✅ /hello: ${helloResponse.status} - ${helloResponse.text}`);
  
  console.log('🔍 Testing non-existent route (/non-existent-route)...');
  const notFoundResponse = await request.get('/non-existent-route');
  console.log(`🎯 /non-existent-route: ${notFoundResponse.status}`);
  console.log(`📝 Response body:`, notFoundResponse.body);
  
  if (notFoundResponse.status === 404) {
    console.log('🎉 SUCCESS: 404 handler working correctly!');
  } else {
    console.log(`❌ UNEXPECTED: Expected 404, got ${notFoundResponse.status}`);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('🏁 404 test completed');