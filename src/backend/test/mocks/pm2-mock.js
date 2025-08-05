/**
 * Mock PM2 Configuration for Testing
 * Provides minimal PM2 config to bypass complex initialization
 */

export const defaultPM2Config = {
  name: 'test-server',
  script: './server.js',
  instances: 1,
  exec_mode: 'fork',
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

export default defaultPM2Config;