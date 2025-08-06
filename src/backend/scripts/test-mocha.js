/**
 * @fileoverview Mocha Test Runner Module
 * @description Test runner implementation for Mocha framework
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import logger from '../utils/logger.js';

/**
 * Mocha test runner class
 */
export class MochaTestRunner {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 10000,
      reporter: options.reporter || 'spec',
      recursive: options.recursive ?? true,
      exit: options.exit ?? true,
      ...options
    };
  }

  /**
   * Run Mocha tests
   * @param {string[]} testFiles - Test files to run
   * @param {Object} options - Test execution options
   * @returns {Promise<Object>} Test results
   */
  async run(testFiles = [], options = {}) {
    logger.info('🧪 Running Mocha tests...');
    
    const mochaArgs = [
      '--timeout', this.options.timeout.toString(),
      '--reporter', this.options.reporter
    ];

    if (this.options.recursive) {
      mochaArgs.push('--recursive');
    }

    if (this.options.exit) {
      mochaArgs.push('--exit');
    }

    if (testFiles.length > 0) {
      mochaArgs.push(...testFiles);
    } else {
      mochaArgs.push('test/**/*.test.js');
    }

    return new Promise((resolve, reject) => {
      const mochaProcess = spawn('npx', ['mocha', ...mochaArgs], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      mochaProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Mocha tests completed successfully');
          resolve({
            framework: 'mocha',
            passed: true,
            exitCode: code
          });
        } else {
          logger.error('❌ Mocha tests failed');
          resolve({
            framework: 'mocha',
            passed: false,
            exitCode: code
          });
        }
      });

      mochaProcess.on('error', (error) => {
        logger.error('Mocha process error:', error);
        reject(error);
      });
    });
  }

  /**
   * Check if Mocha is available
   * @returns {boolean} True if Mocha is available
   */
  static isAvailable() {
    return existsSync('node_modules/.bin/mocha') || existsSync('node_modules/mocha');
  }
}

export default MochaTestRunner;