#!/usr/bin/env node

/**
 * Safe Dependency Installation Script
 * Installs dependencies without triggering session crashes
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

console.log('🔧 Starting dependency installation...');

async function installDependencies() {
  try {
    // Navigate to backend directory
    const backendDir = path.join(process.cwd(), 'src', 'backend');
    
    console.log(`📁 Changing to backend directory: ${backendDir}`);
    process.chdir(backendDir);
    
    // Check if package.json exists
    try {
      await fs.access('package.json');
      console.log('✅ package.json found');
    } catch (error) {
      console.log('❌ package.json not found - cannot proceed');
      process.exit(1);
    }
    
    // Check current state of node_modules
    try {
      const nodeModulesStats = await fs.stat('node_modules');
      if (nodeModulesStats.isDirectory()) {
        const nodeModulesContent = await fs.readdir('node_modules');
        console.log(`📦 node_modules exists with ${nodeModulesContent.length} items`);
        
        if (nodeModulesContent.length > 5) {
          console.log('✅ Dependencies appear to be already installed');
          return;
        }
      }
    } catch (error) {
      console.log('📦 node_modules not found or empty');
    }
    
    // Install dependencies
    console.log('🔧 Installing dependencies with npm ci...');
    execSync('npm ci', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });
    
    console.log('✅ Dependencies installed successfully');
    
    // Verify installation
    try {
      const nodeModulesContent = await fs.readdir('node_modules');
      console.log(`✅ Verification: node_modules now contains ${nodeModulesContent.length} items`);
      
      // Check for key dependencies
      const keyDeps = ['express', 'jest', 'supertest', 'helmet', 'cors'];
      for (const dep of keyDeps) {
        try {
          await fs.access(path.join('node_modules', dep));
          console.log(`✅ ${dep} installed`);
        } catch (error) {
          console.log(`⚠️  ${dep} not found`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not verify installation: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Installation failed: ${error.message}`);
    
    // Fallback to npm install if npm ci fails
    try {
      console.log('🔧 Trying fallback npm install...');
      execSync('npm install', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });
      console.log('✅ Fallback installation successful');
    } catch (fallbackError) {
      console.error(`❌ Fallback installation also failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
}

installDependencies().catch(console.error);