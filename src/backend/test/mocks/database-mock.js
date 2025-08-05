/**
 * Mock Database Configuration for Testing
 * Provides minimal database config to bypass complex initialization
 */

export const defaultDatabaseConfig = {
  enabled: false,
  stateless: true,
  type: 'mock',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password'
  }
};

export function getDatabaseConfig(environment = 'test') {
  return defaultDatabaseConfig;
}

export function validateDatabaseConfig(config = defaultDatabaseConfig) {
  return {
    isValid: true,
    errors: [],
    warnings: []
  };
}

export function isStatelessArchitecture() {
  return true;
}

export default defaultDatabaseConfig;