/**
 * Mock PM2 Configuration for Testing
 * Provides minimal PM2 config to bypass complex initialization
 */

export const defaultPM2Config = {
  name: 'test-server',
  script: './server.js',
  instances: 1,
  exec_mode: 'fork',
  apps: [{
    name: 'test-server',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork'
  }],
  cluster: {
    enabled: false,
    instances: 1
  },
  monitoring: {
    enabled: false
  },
  env: {
    NODE_ENV: 'test',
    PORT: 0
  },
  autorestart: false,
  watch: false,
  max_memory_restart: '100M',
  log_date_format: 'YYYY-MM-DD HH:mm Z',
  merge_logs: true,
  out_file: './logs/out.log',
  error_file: './logs/error.log',
  log_file: './logs/combined.log'
};

export function createPM2Config(environment = 'test') {
  return defaultPM2Config;
}

export function validatePM2Config(config = defaultPM2Config) {
  return {
    isValid: true,
    errors: [],
    warnings: []
  };
}

export default defaultPM2Config;