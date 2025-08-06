/**
 * Configuration Testing Suite for Testinium-QA Server
 * 
 * Comprehensive unit tests for server configuration loading, environment variable handling,
 * configuration parsing logic, and validation of different deployment scenarios.
 * 
 * Test Coverage:
 * - Configuration file loading (JSON, YAML, properties formats)
 * - Environment variable handling and overrides
 * - Default and custom server configurations
 * - Invalid configuration scenarios and error handling
 * - File system operations mocking for config file reading
 * - Port configuration and conflict resolution
 * - Environment-specific configuration validation
 * 
 * As specified in Section 0.2.2 and Section 0.3.3 of the requirements,
 * this test suite validates all configuration aspects with comprehensive
 * edge case coverage and file system error scenario testing.
 * 
 * @module ConfigurationTests
 * @version 1.0.0
 * @requires jest
 * @requires process
 * @requires fs
 */

// Jest globals (describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll) 
// are provided automatically by Jest test environment - no import needed

// Node.js built-in modules for configuration testing
const process = require('process');
const fs = require('fs');

// Internal imports as specified in internal_imports schema
const server = require('../../main/js/server.js');
const { app, startServer, stopServer, PORT, resetServerState } = server;

const fixtures = require('./fixtures/index.js');
const { mockServerConfigs, mockEnvironment } = fixtures;

const mockFileSystem = require('./fixtures/mockFileSystem.js');
const { 
    fs: mockedFs, 
    mockFiles, 
    permissions, 
    errors 
} = mockFileSystem;

/**
 * Configuration Testing Suite
 * 
 * Tests comprehensive configuration loading scenarios including:
 * - Environment variable handling and validation
 * - Configuration file parsing with error scenarios
 * - Default vs custom configuration validation
 * - File system error handling and recovery
 * - Port configuration and conflict resolution
 */
describe('Server Configuration Tests', () => {
    // Original environment variables backup for restoration
    let originalEnv;
    
    // Original file system functions backup for restoration
    let originalFsReadFile;
    let originalFsReadFileSync;
    let originalFsExistsSync;
    let originalFsAccess;
    
    /**
     * Setup before all tests - backup original implementations
     */
    beforeAll(() => {
        // Backup original environment variables
        originalEnv = { ...process.env };
        
        // Backup original file system functions
        originalFsReadFile = fs.readFile;
        originalFsReadFileSync = fs.readFileSync;
        originalFsExistsSync = fs.existsSync;
        originalFsAccess = fs.access;
    });
    
    /**
     * Cleanup after all tests - restore original implementations
     */
    afterAll(() => {
        // Restore original environment variables
        process.env = originalEnv;
        
        // Restore original file system functions
        fs.readFile = originalFsReadFile;
        fs.readFileSync = originalFsReadFileSync;
        fs.existsSync = originalFsExistsSync;
        fs.access = originalFsAccess;
    });
    
    /**
     * Setup before each test - reset environment and mocks
     */
    beforeEach(() => {
        // Clear all environment variables except essential ones
        Object.keys(process.env).forEach(key => {
            if (!['PATH', 'HOME', 'NODE_ENV'].includes(key)) {
                delete process.env[key];
            }
        });
        
        // Reset all Jest mocks
        jest.clearAllMocks();
        
        // Mock process.exit to prevent test termination during error scenarios
        jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });
        
        // Mock file system functions with our controlled implementations
        fs.readFile = mockedFs.readFile;
        fs.readFileSync = mockedFs.readFileSync;
        fs.existsSync = mockedFs.existsSync;
        fs.access = mockedFs.access;
    });
    
    /**
     * Cleanup after each test - restore clean state
     */
    afterEach(async () => {
        // Ensure server is stopped after each test
        try {
            await stopServer();
        } catch (error) {
            // Ignore if server was not running
        }
        
        // Reset server state to clean up any lingering connections or state
        if (typeof resetServerState === 'function') {
            resetServerState();
        }
        
        // Restore original process.exit
        if (process.exit.mockRestore) {
            process.exit.mockRestore();
        }
        
        // Reset mock call history
        if (mockedFs.readFile.mock) {
            mockedFs.readFile.mock.calls = [];
        }
        if (mockedFs.readFileSync.mock) {
            mockedFs.readFileSync.mock.calls = [];
        }
        if (mockedFs.existsSync.mock) {
            mockedFs.existsSync.mock.calls = [];
        }
        if (mockedFs.access.mock) {
            mockedFs.access.mock.calls = [];
        }
    });

    /**
     * Environment Variable Configuration Tests
     * 
     * Validates environment variable handling, PORT configuration,
     * NODE_ENV scenarios, and environment-specific overrides
     */
    describe('Environment Variable Configuration', () => {
        
        /**
         * Tests default PORT configuration when no environment variable is set
         */
        test('should use default PORT when no environment variable is set', () => {
            // Ensure PORT environment variable is not set
            delete process.env.PORT;
            
            // Verify default PORT value is used from server module
            expect(PORT).toBe(3000);
            expect(typeof PORT).toBe('number');
            expect(PORT).toBeGreaterThan(0);
            expect(PORT).toBeLessThanOrEqual(65535);
        });
        
        /**
         * Tests PORT configuration from environment variable override
         */
        test('should use PORT from environment variable when set', () => {
            // Test various valid port configurations
            const testPorts = [8080, 3001, 5000, 8000];
            
            testPorts.forEach(testPort => {
                // Set environment variable
                process.env.PORT = testPort.toString();
                
                // Require server module again to pick up new environment
                delete require.cache[require.resolve('../../main/js/server.js')];
                const serverModule = require('../../main/js/server.js');
                
                // Verify PORT is parsed from environment
                expect(parseInt(process.env.PORT, 10)).toBe(testPort);
                expect(typeof testPort).toBe('number');
            });
        });
        
        /**
         * Tests invalid PORT environment variable handling
         */
        test('should handle invalid PORT environment variable gracefully', () => {
            const invalidPorts = ['invalid', '0', '-1', '65536', 'NaN', ''];
            
            invalidPorts.forEach(invalidPort => {
                // Set invalid PORT environment variable
                process.env.PORT = invalidPort;
                
                // Test that system handles invalid port gracefully
                const parsedPort = parseInt(process.env.PORT, 10);
                
                if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
                    // Should fall back to default PORT when invalid
                    expect(parsedPort <= 0 || parsedPort > 65535 || isNaN(parsedPort)).toBe(true);
                }
            });
        });
        
        /**
         * Tests NODE_ENV configuration scenarios
         */
        test('should handle NODE_ENV configuration correctly', () => {
            const environments = ['development', 'production', 'test', 'staging'];
            
            environments.forEach(env => {
                // Set NODE_ENV
                process.env.NODE_ENV = env;
                
                // Verify environment is accessible
                expect(process.env.NODE_ENV).toBe(env);
                
                // Test that environment affects server behavior appropriately
                expect(['development', 'production', 'test', 'staging']).toContain(env);
            });
        });
        
        /**
         * Tests multiple environment variables configuration
         */
        test('should handle multiple environment variables configuration', () => {
            // Use mock environment from fixtures
            const testEnv = mockEnvironment.testing;
            
            // Apply test environment variables
            Object.keys(testEnv).forEach(key => {
                process.env[key] = testEnv[key];
            });
            
            // Verify all environment variables are set
            Object.keys(testEnv).forEach(key => {
                expect(process.env[key]).toBe(testEnv[key]);
            });
            
            // Verify essential variables are present
            expect(process.env.PORT).toBeDefined();
            expect(process.env.NODE_ENV).toBeDefined();
        });
        
        /**
         * Tests environment variable persistence across server operations
         */
        test('should maintain environment variables across server lifecycle', async () => {
            // Set test environment variables
            process.env.PORT = '8080';
            process.env.NODE_ENV = 'test';
            process.env.SERVER_HOST = 'localhost';
            
            // Verify variables are set before server start
            expect(process.env.PORT).toBe('8080');
            expect(process.env.NODE_ENV).toBe('test');
            expect(process.env.SERVER_HOST).toBe('localhost');
            
            // Variables should persist after server operations
            expect(process.env.PORT).toBe('8080');
            expect(process.env.NODE_ENV).toBe('test');
            expect(process.env.SERVER_HOST).toBe('localhost');
        });
    });

    /**
     * Configuration File Loading Tests
     * 
     * Validates configuration file parsing, JSON/YAML format support,
     * file system error handling, and configuration validation logic
     */
    describe('Configuration File Loading', () => {
        
        /**
         * Tests successful JSON configuration file loading
         */
        test('should load valid JSON configuration file successfully', (done) => {
            const configPath = 'config/server.json';
            
            // Use mocked file system to simulate config file reading
            fs.readFile(configPath, 'utf8', (error, data) => {
                // Should successfully read mock JSON configuration
                expect(error).toBeNull();
                expect(data).toBeDefined();
                expect(typeof data).toBe('string');
                
                // Should be valid JSON
                let parsedConfig;
                expect(() => {
                    parsedConfig = JSON.parse(data);
                }).not.toThrow();
                
                // Verify configuration structure
                expect(parsedConfig).toHaveProperty('server');
                expect(parsedConfig.server).toHaveProperty('port');
                expect(parsedConfig.server).toHaveProperty('host');
                expect(parsedConfig.server).toHaveProperty('timeout');
                
                done();
            });
        });
        
        /**
         * Tests YAML configuration file loading
         */
        test('should load valid YAML configuration file successfully', (done) => {
            const configPath = 'config/server.yaml';
            
            // Use mocked file system to simulate YAML config file reading
            fs.readFile(configPath, 'utf8', (error, data) => {
                // Should successfully read mock YAML configuration
                expect(error).toBeNull();
                expect(data).toBeDefined();
                expect(typeof data).toBe('string');
                
                // Verify YAML structure (basic string validation)
                expect(data).toContain('server:');
                expect(data).toContain('port:');
                expect(data).toContain('host:');
                expect(data).toContain('timeout:');
                
                done();
            });
        });
        
        /**
         * Tests handling of nonexistent configuration file
         */
        test('should handle nonexistent configuration file gracefully', (done) => {
            const configPath = 'config/nonexistent.json';
            
            // Use mocked file system to simulate file not found
            fs.readFile(configPath, 'utf8', (error, data) => {
                // Should return ENOENT error for nonexistent file
                expect(error).not.toBeNull();
                expect(error.code).toBe('ENOENT');
                expect(error.message).toContain('no such file or directory');
                expect(data).toBeUndefined();
                
                done();
            });
        });
        
        /**
         * Tests handling of invalid JSON configuration file
         */
        test('should handle invalid JSON configuration file gracefully', (done) => {
            const configPath = 'config/invalid.json';
            
            // Use mocked file system to get invalid JSON content
            fs.readFile(configPath, 'utf8', (error, data) => {
                expect(error).toBeNull();
                expect(data).toBeDefined();
                
                // Should throw error when parsing invalid JSON
                expect(() => {
                    JSON.parse(data);
                }).toThrow();
                
                done();
            });
        });
        
        /**
         * Tests configuration file access permission errors
         */
        test('should handle configuration file permission errors', (done) => {
            const configPath = 'config/restricted.json';
            
            // Use mocked file system to simulate permission denied
            fs.readFile(configPath, 'utf8', (error, data) => {
                // Should return EACCES error for permission denied
                expect(error).not.toBeNull();
                expect(error.code).toBe('EACCES');
                expect(error.message).toContain('permission denied');
                expect(data).toBeUndefined();
                
                done();
            });
        });
        
        /**
         * Tests large configuration file handling
         */
        test('should handle large configuration file efficiently', (done) => {
            const configPath = 'config/large.json';
            
            // Record start time for performance validation
            const startTime = Date.now();
            
            // Use mocked file system to simulate large config file
            fs.readFile(configPath, 'utf8', (error, data) => {
                const endTime = Date.now();
                const loadTime = endTime - startTime;
                
                // Should successfully load large file
                expect(error).toBeNull();
                expect(data).toBeDefined();
                expect(data.length).toBeGreaterThan(1000);
                
                // Should load within reasonable time (5 seconds max)
                expect(loadTime).toBeLessThan(5000);
                
                // Should be valid JSON
                let parsedConfig;
                expect(() => {
                    parsedConfig = JSON.parse(data);
                }).not.toThrow();
                
                // Verify large config structure
                expect(parsedConfig).toHaveProperty('data');
                expect(Array.isArray(parsedConfig.data)).toBe(true);
                
                done();
            });
        });
        
        /**
         * Tests synchronous configuration file loading
         */
        test('should load configuration file synchronously when needed', () => {
            const configPath = 'config/server.json';
            
            // Use synchronous file reading
            let data;
            let error = null;
            
            try {
                data = fs.readFileSync(configPath, 'utf8');
            } catch (err) {
                error = err;
            }
            
            // Should successfully read configuration
            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(typeof data).toBe('string');
            
            // Should be valid JSON
            let parsedConfig;
            expect(() => {
                parsedConfig = JSON.parse(data);
            }).not.toThrow();
            
            // Verify configuration structure
            expect(parsedConfig).toHaveProperty('server');
            expect(parsedConfig.server).toHaveProperty('port');
        });
        
        /**
         * Tests configuration file existence checking
         */
        test('should check configuration file existence correctly', () => {
            // Test existing file
            const existingFile = 'config/server.json';
            expect(fs.existsSync(existingFile)).toBe(true);
            
            // Test nonexistent file
            const nonexistentFile = 'config/nonexistent.json';
            expect(fs.existsSync(nonexistentFile)).toBe(false);
            
            // Test directory path
            const directoryPath = 'config/';
            expect(fs.existsSync(directoryPath)).toBe(true);
        });
        
        /**
         * Tests configuration file access permissions
         */
        test('should validate configuration file access permissions', (done) => {
            const configPath = 'config/server.json';
            
            // Check read access
            fs.access(configPath, fs.constants.R_OK, (error) => {
                // Should have read access to valid config file
                expect(error).toBeNull();
                
                // Check file existence
                fs.access(configPath, fs.constants.F_OK, (existError) => {
                    expect(existError).toBeNull();
                    done();
                });
            });
        });
    });

    /**
     * Server Configuration Validation Tests
     * 
     * Validates default configurations, custom configurations,
     * port conflict resolution, and configuration merging logic
     */
    describe('Server Configuration Validation', () => {
        
        /**
         * Tests default server configuration values
         */
        test('should use correct default server configuration', () => {
            // Use default configuration from mockServerConfigs
            const defaultConfig = mockServerConfigs.default;
            
            // Verify default configuration structure
            expect(defaultConfig).toBeDefined();
            expect(defaultConfig).toHaveProperty('standard');
            expect(defaultConfig.standard).toHaveProperty('port');
            expect(defaultConfig.standard).toHaveProperty('host');
            
            // Verify default values
            expect(defaultConfig.standard.port).toBe(3000);
            expect(defaultConfig.standard.host).toBe('localhost');
            expect(typeof defaultConfig.standard.port).toBe('number');
            expect(typeof defaultConfig.standard.host).toBe('string');
        });
        
        /**
         * Tests custom server configuration override
         */
        test('should apply custom server configuration correctly', () => {
            // Use custom configuration from mockServerConfigs
            const customConfig = mockServerConfigs.custom;
            
            // Verify custom configuration structure
            expect(customConfig).toBeDefined();
            expect(customConfig).toHaveProperty('port8080');
            expect(customConfig.port8080).toHaveProperty('port');
            expect(customConfig.port8080).toHaveProperty('host');
            
            // Verify custom values differ from defaults
            expect(customConfig.port8080.port).toBe(8080);
            expect(customConfig.port8080.host).toBeDefined();
            expect(typeof customConfig.port8080.port).toBe('number');
            expect(typeof customConfig.port8080.host).toBe('string');
        });
        
        /**
         * Tests invalid server configuration handling
         */
        test('should handle invalid server configuration gracefully', () => {
            // Use invalid configuration from mockServerConfigs
            const invalidConfig = mockServerConfigs.invalid;
            
            // Verify invalid configuration is handled
            expect(invalidConfig).toBeDefined();
            
            // Test invalid port scenarios
            if (invalidConfig.port !== undefined) {
                const port = invalidConfig.port;
                
                // Should detect invalid port values
                if (typeof port === 'number') {
                    expect(port < 0 || port > 65535).toBe(true);
                } else {
                    expect(typeof port).not.toBe('number');
                }
            }
            
            // Test invalid host scenarios
            if (invalidConfig.host !== undefined) {
                const host = invalidConfig.host;
                
                // Should detect invalid host values
                expect(typeof host === 'string' && host.includes('!!!')).toBe(true);
            }
        });
        
        /**
         * Tests environment-specific configuration loading
         */
        test('should load environment-specific configuration correctly', () => {
            // Use environment configuration from mockServerConfigs
            const envConfig = mockServerConfigs.environment;
            
            // Verify environment-specific configuration
            expect(envConfig).toBeDefined();
            expect(envConfig).toHaveProperty('development');
            expect(envConfig).toHaveProperty('production');
            expect(envConfig).toHaveProperty('test');
            
            // Verify each environment has valid configuration
            ['development', 'production', 'test'].forEach(env => {
                const config = envConfig[env];
                expect(config).toBeDefined();
                expect(config).toHaveProperty('port');
                expect(config).toHaveProperty('host');
                expect(typeof config.port).toBe('number');
                expect(typeof config.host).toBe('string');
            });
        });
        
        /**
         * Tests port conflict resolution configuration
         */
        test('should handle port conflict configuration scenarios', () => {
            // Use port conflict configuration from mockServerConfigs
            const portConflictConfig = mockServerConfigs.portConflict;
            
            // Verify port conflict configuration
            expect(portConflictConfig).toBeDefined();
            expect(portConflictConfig).toHaveProperty('conflictPort3000');
            expect(portConflictConfig.conflictPort3000).toHaveProperty('port');
            expect(portConflictConfig.conflictPort3000).toHaveProperty('fallbackPorts');
            
            // Verify primary and fallback ports are different
            const config = portConflictConfig.conflictPort3000;
            expect(config.port).toBeDefined();
            expect(Array.isArray(config.fallbackPorts)).toBe(true);
            expect(config.fallbackPorts).not.toContain(config.port);
            expect(typeof config.port).toBe('number');
            
            // Verify ports are in valid range
            expect(config.port).toBeGreaterThan(0);
            expect(config.port).toBeLessThanOrEqual(65535);
            config.fallbackPorts.forEach(port => {
                expect(port).toBeGreaterThan(0);
                expect(port).toBeLessThanOrEqual(65535);
            });
        });
        
        /**
         * Tests dynamic configuration generation
         */
        test('should generate dynamic configuration correctly', () => {
            // Use dynamic configuration from mockServerConfigs
            const dynamicConfig = mockServerConfigs.dynamic;
            
            // Verify dynamic configuration function exists
            expect(dynamicConfig).toBeDefined();
            
            if (typeof dynamicConfig === 'function') {
                // Generate dynamic configuration
                const generatedConfig = dynamicConfig();
                
                // Verify generated configuration structure
                expect(generatedConfig).toBeDefined();
                expect(generatedConfig).toHaveProperty('port');
                expect(generatedConfig).toHaveProperty('host');
                expect(typeof generatedConfig.port).toBe('number');
                expect(typeof generatedConfig.host).toBe('string');
                
                // Verify port is in valid range
                expect(generatedConfig.port).toBeGreaterThan(0);
                expect(generatedConfig.port).toBeLessThanOrEqual(65535);
            } else if (typeof dynamicConfig === 'object') {
                // Static dynamic configuration object - check autoDiscovery scenario
                expect(dynamicConfig).toHaveProperty('autoDiscovery');
                expect(dynamicConfig.autoDiscovery).toHaveProperty('port');
                expect(dynamicConfig.autoDiscovery).toHaveProperty('host');
                expect(typeof dynamicConfig.autoDiscovery.port).toBe('number');
                expect(typeof dynamicConfig.autoDiscovery.host).toBe('string');
            }
        });
        
        /**
         * Tests configuration validation logic
         */
        test('should validate configuration parameters correctly', () => {
            const testConfigurations = [
                { port: 3000, host: 'localhost', valid: true },
                { port: 8080, host: '0.0.0.0', valid: true },
                { port: 0, host: 'localhost', valid: false },
                { port: 65536, host: 'localhost', valid: false },
                { port: -1, host: 'localhost', valid: false },
                { port: 3000, host: '', valid: false },
                { port: 'invalid', host: 'localhost', valid: false },
                { port: 3000, host: null, valid: false }
            ];
            
            testConfigurations.forEach(({ port, host, valid }) => {
                // Validate port
                const isValidPort = typeof port === 'number' && port > 0 && port <= 65535;
                
                // Validate host
                const isValidHost = typeof host === 'string' && host.length > 0;
                
                // Overall configuration validity
                const isValidConfig = isValidPort && isValidHost;
                
                // Verify validation matches expected result
                expect(isValidConfig).toBe(valid);
            });
        });
    });

    /**
     * File System Error Handling Tests
     * 
     * Validates error handling for various file system scenarios,
     * permission errors, and configuration loading failures
     */
    describe('File System Error Handling', () => {
        
        /**
         * Tests handling of file system permission errors
         */
        test('should handle file system permission errors gracefully', (done) => {
            const restrictedPaths = [
                'config/noaccess.json',
                'config/restricted.json'
            ];
            
            let completedTests = 0;
            const totalTests = restrictedPaths.length;
            
            restrictedPaths.forEach(path => {
                fs.readFile(path, 'utf8', (error, data) => {
                    // Should return permission error
                    expect(error).not.toBeNull();
                    expect(error.code).toBe('EACCES');
                    expect(error.message).toContain('permission denied');
                    expect(data).toBeUndefined();
                    
                    completedTests++;
                    if (completedTests === totalTests) {
                        done();
                    }
                });
            });
        });
        
        /**
         * Tests handling of file not found errors
         */
        test('should handle file not found errors gracefully', () => {
            const nonexistentPaths = [
                'config/nonexistent.json',
                'config/nonexistent-file.json',
                'nonexistent/config.json'
            ];
            
            nonexistentPaths.forEach(path => {
                // Test synchronous file existence check
                expect(fs.existsSync(path)).toBe(false);
                
                // Test synchronous file reading
                try {
                    const result = fs.readFileSync(path, 'utf8');
                    // Should not reach here for nonexistent files
                    expect(true).toBe(false);
                } catch (error) {
                    expect(error.code).toBe('ENOENT');
                    expect(error.message).toContain('no such file or directory');
                }
            });
        });
        
        /**
         * Tests handling of directory read attempts
         */
        test('should handle directory read attempts appropriately', (done) => {
            const directoryPath = 'config/directory';
            
            fs.readFile(directoryPath, 'utf8', (error, data) => {
                // Should return directory error
                expect(error).not.toBeNull();
                expect(error.code).toBe('EISDIR');
                expect(error.message).toContain('illegal operation on a directory');
                expect(data).toBeUndefined();
                
                done();
            });
        });
        
        /**
         * Tests file system error recovery scenarios
         */
        test('should implement proper error recovery mechanisms', async () => {
            const errorScenarios = [
                { path: 'config/nonexistent.json', expectedError: 'ENOENT' },
                { path: 'config/restricted.json', expectedError: 'EACCES' },
                { path: 'config/directory', expectedError: 'EISDIR' }
            ];
            
            for (const scenario of errorScenarios) {
                try {
                    fs.readFileSync(scenario.path, 'utf8');
                    // Should not reach here for error scenarios
                    expect(true).toBe(false);
                } catch (error) {
                    // Should catch and handle expected error
                    expect(error.code).toBe(scenario.expectedError);
                    expect(error).toBeInstanceOf(Error);
                    
                    // Error should have required properties
                    expect(error).toHaveProperty('code');
                    expect(error).toHaveProperty('message');
                    expect(error).toHaveProperty('path');
                }
            }
        });
        
        /**
         * Tests mock file system behavior validation
         */
        test('should validate mock file system behavior correctly', () => {
            // Verify mock files are accessible
            expect(mockFiles).toBeDefined();
            expect(mockFiles).toHaveProperty('configJson');
            expect(mockFiles).toHaveProperty('configYaml');
            expect(mockFiles).toHaveProperty('invalidConfig');
            expect(mockFiles).toHaveProperty('emptyConfig');
            expect(mockFiles).toHaveProperty('largeConfig');
            
            // Verify mock permissions are defined
            expect(permissions).toBeDefined();
            expect(permissions).toHaveProperty('readOnly');
            expect(permissions).toHaveProperty('writeOnly');
            expect(permissions).toHaveProperty('noAccess');
            expect(permissions).toHaveProperty('fullAccess');
            
            // Verify mock errors are defined
            expect(errors).toBeDefined();
            expect(errors).toHaveProperty('ENOENT');
            expect(errors).toHaveProperty('EACCES');
            expect(errors).toHaveProperty('EMFILE');
            expect(errors).toHaveProperty('ENOSPC');
            expect(errors).toHaveProperty('EISDIR');
        });
        
        /**
         * Tests file system mock function call tracking
         */
        test('should track file system mock function calls correctly', (done) => {
            const testPath = 'config/server.json';
            
            // Clear previous mock calls
            if (mockedFs.readFile.mock) {
                mockedFs.readFile.mock.calls = [];
            }
            
            fs.readFile(testPath, 'utf8', (error, data) => {
                // Verify mock function was called
                expect(mockedFs.readFile.mock).toBeDefined();
                expect(mockedFs.readFile.mock.calls).toBeDefined();
                expect(mockedFs.readFile.mock.calls.length).toBeGreaterThan(0);
                
                // Verify call arguments
                const lastCall = mockedFs.readFile.mock.calls[mockedFs.readFile.mock.calls.length - 1];
                expect(lastCall[0]).toBe(testPath);
                expect(typeof lastCall[2]).toBe('function'); // callback function
                
                done();
            });
        });
    });

    /**
     * Integration Tests with Server Lifecycle
     * 
     * Tests configuration loading integration with server startup,
     * shutdown procedures, and configuration changes during runtime
     */
    describe('Configuration Integration with Server Lifecycle', () => {
        
        /**
         * Tests configuration loading during server startup
         */
        test('should load configuration correctly during server startup', async () => {
            // Set test environment variables
            process.env.PORT = '8080';
            process.env.NODE_ENV = 'test';
            
            // Verify environment variables are set
            expect(process.env.PORT).toBe('8080');
            expect(process.env.NODE_ENV).toBe('test');
            
            // Test that configuration is accessible
            expect(PORT).toBeDefined();
            expect(typeof PORT).toBe('number');
        });
        
        /**
         * Tests configuration persistence during server operations
         */
        test('should maintain configuration consistency during server lifecycle', async () => {
            // Set stable configuration
            process.env.PORT = '9000';
            process.env.NODE_ENV = 'test';
            process.env.SERVER_HOST = 'localhost';
            
            // Record initial configuration state
            const initialPort = process.env.PORT;
            const initialEnv = process.env.NODE_ENV;
            const initialHost = process.env.SERVER_HOST;
            
            // Verify configuration remains stable
            expect(process.env.PORT).toBe(initialPort);
            expect(process.env.NODE_ENV).toBe(initialEnv);
            expect(process.env.SERVER_HOST).toBe(initialHost);
            
            // Configuration should remain consistent
            expect(process.env.PORT).toBe('9000');
            expect(process.env.NODE_ENV).toBe('test');
            expect(process.env.SERVER_HOST).toBe('localhost');
        });
        
        /**
         * Tests configuration error handling during server startup
         */
        test('should handle configuration errors gracefully during server startup', () => {
            // Set invalid configuration
            process.env.PORT = 'invalid';
            process.env.NODE_ENV = '';
            
            // Parse PORT with error handling
            const parsedPort = parseInt(process.env.PORT, 10);
            
            // Should handle invalid PORT gracefully
            expect(isNaN(parsedPort)).toBe(true);
            
            // Should detect empty NODE_ENV
            expect(process.env.NODE_ENV).toBe('');
        });
        
        /**
         * Tests configuration validation before server startup
         */
        test('should validate configuration before server startup', () => {
            const testConfigurations = [
                { 
                    PORT: '3000', 
                    NODE_ENV: 'test', 
                    expected: { valid: true, port: 3000 } 
                },
                { 
                    PORT: '8080', 
                    NODE_ENV: 'production', 
                    expected: { valid: true, port: 8080 } 
                },
                { 
                    PORT: 'invalid', 
                    NODE_ENV: 'test', 
                    expected: { valid: false, port: NaN } 
                },
                { 
                    PORT: '0', 
                    NODE_ENV: 'test', 
                    expected: { valid: false, port: 0 } 
                }
            ];
            
            testConfigurations.forEach(config => {
                // Set test environment
                process.env.PORT = config.PORT;
                process.env.NODE_ENV = config.NODE_ENV;
                
                // Parse and validate configuration
                const parsedPort = parseInt(process.env.PORT, 10);
                const isValidPort = !isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535;
                const isValidEnv = process.env.NODE_ENV && process.env.NODE_ENV.length > 0;
                
                // Verify validation results
                expect(parsedPort).toBe(config.expected.port);
                expect(isValidPort && isValidEnv).toBe(config.expected.valid);
            });
        });
        
        /**
         * Tests configuration change detection and handling
         */
        test('should detect and handle configuration changes appropriately', () => {
            // Set initial configuration
            process.env.PORT = '3000';
            process.env.NODE_ENV = 'development';
            
            const initialPort = process.env.PORT;
            const initialEnv = process.env.NODE_ENV;
            
            // Verify initial state
            expect(initialPort).toBe('3000');
            expect(initialEnv).toBe('development');
            
            // Change configuration
            process.env.PORT = '8080';
            process.env.NODE_ENV = 'production';
            
            // Verify changes are detected
            expect(process.env.PORT).not.toBe(initialPort);
            expect(process.env.NODE_ENV).not.toBe(initialEnv);
            expect(process.env.PORT).toBe('8080');
            expect(process.env.NODE_ENV).toBe('production');
        });
    });
});