#!/usr/bin/env node

/**
 * Project Validation Script
 * Safely validates the current project state without triggering session crashes
 */

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('🔍 Starting project validation...');

async function validateProject() {
  try {
    // Check current working directory
    const currentDir = process.cwd();
    console.log(`📁 Current directory: ${currentDir}`);
    
    // Navigate to backend directory
    const backendDir = path.join(currentDir, 'src', 'backend');
    
    try {
      await fs.access(backendDir);
      console.log('✅ Backend directory exists');
    } catch (error) {
      console.log('❌ Backend directory not found');
      return;
    }
    
    // Change to backend directory
    process.chdir(backendDir);
    console.log(`📁 Changed to: ${process.cwd()}`);
    
    // Check if package.json exists
    try {
      await fs.access('package.json');
      console.log('✅ package.json exists');
    } catch (error) {
      console.log('❌ package.json not found');
      return;
    }
    
    // Check if node_modules exists and has content
    try {
      const nodeModulesStats = await fs.stat('node_modules');
      if (nodeModulesStats.isDirectory()) {
        const nodeModulesContent = await fs.readdir('node_modules');
        console.log(`📦 node_modules exists with ${nodeModulesContent.length} items`);
        
        if (nodeModulesContent.length === 0) {
          console.log('⚠️  node_modules is empty - dependencies need to be installed');
          console.log('🔧 Installing dependencies...');
          execSync('npm install', { stdio: 'inherit' });
          console.log('✅ Dependencies installed');
        } else {
          console.log('✅ Dependencies appear to be installed');
        }
      }
    } catch (error) {
      console.log('❌ node_modules not found');
      console.log('🔧 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed');
    }
    
    // Check if core files exist
    const coreFiles = [
      'server.js',
      'app.js',
      'test/unit/server.test.js',
      'jest.config.simple.js'
    ];
    
    for (const file of coreFiles) {
      try {
        await fs.access(file);
        console.log(`✅ ${file} exists`);
      } catch (error) {
        console.log(`❌ ${file} not found`);
      }
    }
    
    // Try to run syntax check
    console.log('🧪 Running syntax checks...');
    try {
      execSync('node -c server.js', { stdio: 'inherit' });
      console.log('✅ server.js syntax OK');
    } catch (error) {
      console.log(`❌ server.js syntax error: ${error.message}`);
    }
    
    try {
      execSync('node -c app.js', { stdio: 'inherit' });
      console.log('✅ app.js syntax OK');
    } catch (error) {
      console.log(`❌ app.js syntax error: ${error.message}`);
    }
    
    // Check git status
    console.log('📝 Checking git status...');
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        console.log('📝 Git status (modified files):');
        console.log(gitStatus);
      } else {
        console.log('✅ Git working tree clean');
      }
    } catch (error) {
      console.log(`⚠️  Git status check failed: ${error.message}`);
    }
    
    console.log('✅ Project validation complete');
    
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

validateProject().catch(console.error);