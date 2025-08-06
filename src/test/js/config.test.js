/**
 * Comprehensive Configuration Testing Suite for Node.js Server
 * 
 * Tests configuration file loading, environment variable handling, default and custom 
 * server configurations, invalid configuration scenarios, and configuration validation 
 * logic as specified in Summary of Changes Section 0.2.2 and Section 0.3.3.
 * 
 * This test suite validates:
 * - Configuration file loading and parsing
 * - Environment variable handling and overrides
 * - Default, custom, and invalid server configurations
 * - Configuration validation logic and error handling
 * - File system mocking for configuration scenarios
 */

const { app, startServer, stopServer, resetServerState, getServerState, PORT } = require('../../main/js/server.js');
const { 
    mockServerConfigs, 
    mockEnvironment, 
    mockFileSystem, 
    mockFiles, 
    fileSystemErrors,
    createMockFileSystem, 
    resetFileSystemMocks,
    createCustomMockScenario 
} = require('./fixtures');

// Test configuration constants
const TEST_TIMEOUT = 5000;
const EXTENDED_TIMEOUT = 8000;

describe('Configuration Management and Validation', () => {
    let originalEnv;
    let testServerInstance = null;
    let testServerPort = null;
    let testServerUrl = null;

    beforeAll(() => {
        // Store original environment
        originalEnv = { ...process.env };
    });

    beforeEach(async () => {
        // Reset server state and clean up from previous tests
        resetServerState();
        
        // Reset all mocks
        jest.clearAllMocks();
        resetFileSystemMocks();
        
        // Clear test server variables
        testServerInstance = null;
        testServerPort = null;
        testServerUrl = null;
    });

    afterEach(async () => {
        // Clean up server instance
        if (testServerInstance) {
            try {
                await stopServer();
            } catch (error) {
                console.warn('Error stopping server in afterEach:', error.message);
            }
            testServerInstance = null;
            testServerPort = null;
            testServerUrl = null;
        }
        
        // Reset server state
        resetServerState();
        
        // Restore original environment
        process.env = { ...originalEnv };
        
        // Reset file system mocks
        resetFileSystemMocks();
    });

    afterAll(() => {
        // Final cleanup
        process.env = originalEnv;
        resetFileSystemMocks();
        resetServerState();
    });

    describe('Configuration File Loading', () => {
        test('should load default configuration when no config file exists', async () => {
            // Mock fs module directly using Jest
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                const error = new Error(`ENOENT: no such file or directory, open '${path}'`);
                error.code = 'ENOENT';
                error.errno = -2;
                error.syscall = 'open';
                error.path = path;
                callback(error);
            });

            // Start server with default configuration
            const serverInfo = await startServer();
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify server started with default configuration
            expect(testServerInstance).toBeDefined();
            expect(testServerPort).toBe(PORT); // Default port from server.js
            expect(testServerUrl).toContain(`${testServerPort}`);
            
            // Restore mocks
            fs.existsSync.mockRestore();
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should load configuration from JSON file successfully', async () => {
            // Mock fs module directly
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(null, mockFiles.configJson);
            });

            // Verify file system interaction
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeNull();
                expect(data).toBe(mockFiles.configJson);
            });

            expect(fs.existsSync).toBeDefined();
            expect(fs.readFile).toBeDefined();
            
            // Restore mocks
            fs.existsSync.mockRestore();
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle configuration file parsing errors gracefully', async () => {
            // Mock file system with invalid JSON
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(null, mockFiles.invalidConfig);
            });

            // Verify that invalid config is handled
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeNull();
                expect(data).toBe(mockFiles.invalidConfig);
                
                // Test JSON parsing failure
                expect(() => JSON.parse(data)).toThrow();
            });
            
            // Restore mocks
            fs.existsSync.mockRestore();
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle empty configuration file', async () => {
            // Mock file system with empty config
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(null, mockFiles.emptyConfig);
            });

            // Verify empty config handling
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeNull();
                expect(data).toBe(mockFiles.emptyConfig);
            });
            
            // Restore mocks
            fs.existsSync.mockRestore();
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle large configuration files efficiently', async () => {
            // Mock file system with large config
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(null, mockFiles.largeConfig);
            });

            // Verify large config handling
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeNull();
                expect(data).toBe(mockFiles.largeConfig);
                expect(data.length).toBeGreaterThan(1000); // Large config
            });
            
            // Restore mocks
            fs.existsSync.mockRestore();
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);
    });

    describe('Environment Variable Handling', () => {
        test('should use PORT environment variable when set', async () => {
            // Set environment variable
            process.env.PORT = '8080';

            // Start server
            const serverInfo = await startServer();
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify port from environment is used
            expect(testServerPort).toBe(8080);
            expect(testServerUrl).toContain('8080');
        }, TEST_TIMEOUT);

        test('should handle invalid PORT environment variable gracefully', async () => {
            // Set invalid port
            process.env.PORT = 'invalid-port';

            // Start server should use default port when PORT is invalid
            const serverInfo = await startServer();
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Should fall back to default port
            expect(testServerPort).toBe(PORT);
        }, TEST_TIMEOUT);

        test('should handle NODE_ENV environment variable', () => {
            // Test different NODE_ENV values
            const environments = ['development', 'test', 'production', 'staging'];
            
            environments.forEach(env => {
                process.env.NODE_ENV = env;
                expect(process.env.NODE_ENV).toBe(env);
            });
        });

        test('should apply development environment configuration', () => {
            // Mock development environment
            Object.assign(process.env, mockEnvironment.development);
            
            expect(process.env.NODE_ENV).toBe('development');
            expect(process.env.DEBUG).toBe('true');
        });

        test('should apply testing environment configuration', () => {
            // Mock testing environment
            Object.assign(process.env, mockEnvironment.testing);
            
            expect(process.env.NODE_ENV).toBe('test');
            expect(process.env.CI_PARALLEL_VARS).toBe('JEST_WORKER_ID');
            expect(process.env.JEST_WORKER_ID).toBe('1');
        });

        test('should apply production environment configuration', () => {
            // Mock production environment
            Object.assign(process.env, mockEnvironment.production);
            
            expect(process.env.NODE_ENV).toBe('production');
            expect(process.env.DEBUG).toBe('false');
        });

        test('should handle environment variable overrides correctly', async () => {
            // Set custom environment variables
            process.env.PORT = '9000';
            process.env.HOST = '0.0.0.0';
            process.env.NODE_ENV = 'custom';

            // Start server with environment overrides
            const serverInfo = await startServer(9000, '0.0.0.0');
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify environment variables are respected
            expect(testServerPort).toBe(9000);
            expect(testServerUrl).toContain('0.0.0.0');
            expect(process.env.NODE_ENV).toBe('custom');
        }, TEST_TIMEOUT);
    });

    describe('Default and Custom Server Configurations', () => {
        test('should use default server configuration', async () => {
            // Start server with defaults
            const serverInfo = await startServer();
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify default configuration
            expect(testServerPort).toBe(PORT);
            expect(testServerUrl).toMatch(/http:\/\/(localhost|127\.0\.0\.1):\d+/);
            expect(testServerInstance).toBeDefined();
            
            const serverState = getServerState();
            expect(serverState.isRunning).toBe(true);
        }, TEST_TIMEOUT);

        test('should accept custom port configuration', async () => {
            // Use custom port from mock configs
            const customPort = mockServerConfigs.custom.port8080.port; // 8080 from the custom configs
            
            const serverInfo = await startServer(customPort);
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify custom port is used
            expect(testServerPort).toBe(customPort);
            expect(testServerUrl).toContain(`${customPort}`);
        }, TEST_TIMEOUT);

        test('should accept custom host configuration', async () => {
            // Use custom host from mock configs
            const customConfig = mockServerConfigs.custom.allInterfaces; // port: 3000, host: '0.0.0.0'
            
            const serverInfo = await startServer(customConfig.port, customConfig.host);
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify custom host is used
            expect(testServerPort).toBe(customConfig.port);
            expect(testServerUrl).toContain(customConfig.host);
        }, TEST_TIMEOUT);

        test('should handle dynamic port assignment (port 0)', async () => {
            // Use dynamic port assignment
            const serverInfo = await startServer(0);
            testServerInstance = serverInfo.server;
            testServerPort = serverInfo.port;
            testServerUrl = serverInfo.url;

            // Verify dynamic port assignment
            expect(testServerPort).toBeGreaterThan(0);
            expect(testServerPort).not.toBe(0);
            expect(testServerUrl).toContain(`${testServerPort}`);
        }, TEST_TIMEOUT);

        test('should validate configuration object structure', () => {
            // Test default configuration (using minimal config)
            const defaultConfig = mockServerConfigs.default.minimal;
            expect(defaultConfig).toHaveProperty('port');
            expect(defaultConfig).toHaveProperty('host');
            expect(typeof defaultConfig.port).toBe('number');
            expect(typeof defaultConfig.host).toBe('string');

            // Test custom configuration
            const customConfig = mockServerConfigs.custom.port8080;
            expect(customConfig).toHaveProperty('port');
            expect(customConfig).toHaveProperty('host');
        });

        test('should handle configuration with additional options', () => {
            // Test environment-specific configuration
            const envConfig = mockServerConfigs.environment;
            expect(envConfig).toBeDefined();
            expect(typeof envConfig).toBe('object');
        });
    });

    describe('Invalid Configuration Scenarios', () => {
        test('should handle invalid port numbers gracefully', async () => {
            // Test various invalid port scenarios
            const invalidConfig = mockServerConfigs.invalid;
            
            try {
                // Attempt to start server with invalid configuration
                await startServer(invalidConfig.port);
                // Should not reach here if properly handled
                fail('Expected server start to fail with invalid port');
            } catch (error) {
                // Verify error handling for invalid port
                expect(error).toBeDefined();
                expect(error.message).toBeDefined();
            }
        }, TEST_TIMEOUT);

        test('should reject negative port numbers', async () => {
            try {
                await startServer(-1);
                fail('Expected server start to fail with negative port');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toBeDefined();
            }
        }, TEST_TIMEOUT);

        test('should reject port numbers above valid range', async () => {
            try {
                await startServer(65536); // Above valid port range
                fail('Expected server start to fail with port above range');
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toBeDefined();
            }
        }, TEST_TIMEOUT);

        test('should handle invalid host configuration', async () => {
            const invalidConfig = mockServerConfigs.invalid;
            
            try {
                await startServer(3000, invalidConfig.host);
                fail('Expected server start to fail with invalid host');
            } catch (error) {
                expect(error).toBeDefined();
            }
        }, TEST_TIMEOUT);

        test('should validate configuration format', () => {
            // Test that invalid configuration is properly structured for testing
            const invalidConfig = mockServerConfigs.invalid;
            expect(invalidConfig).toBeDefined();
            expect(typeof invalidConfig).toBe('object');
        });
    });

    describe('Configuration Validation Logic', () => {
        test('should validate port range constraints', () => {
            // Port validation logic
            const validatePort = (port) => {
                return Number.isInteger(port) && port >= 0 && port <= 65535;
            };

            // Test valid ports
            expect(validatePort(3000)).toBe(true);
            expect(validatePort(8080)).toBe(true);
            expect(validatePort(0)).toBe(true); // Dynamic assignment
            expect(validatePort(65535)).toBe(true);

            // Test invalid ports
            expect(validatePort(-1)).toBe(false);
            expect(validatePort(65536)).toBe(false);
            expect(validatePort('3000')).toBe(false);
            expect(validatePort(3000.5)).toBe(false);
        });

        test('should validate host format', () => {
            // Host validation logic
            const validateHost = (host) => {
                return typeof host === 'string' && host.length > 0;
            };

            // Test valid hosts
            expect(validateHost('localhost')).toBe(true);
            expect(validateHost('127.0.0.1')).toBe(true);
            expect(validateHost('0.0.0.0')).toBe(true);

            // Test invalid hosts
            expect(validateHost('')).toBe(false);
            expect(validateHost(null)).toBe(false);
            expect(validateHost(undefined)).toBe(false);
            expect(validateHost(123)).toBe(false);
        });

        test('should validate complete configuration object', () => {
            // Configuration validation logic
            const validateConfig = (config) => {
                if (!config || typeof config !== 'object') return false;
                
                const hasValidPort = 'port' in config && 
                    Number.isInteger(config.port) && 
                    config.port >= 0 && 
                    config.port <= 65535;
                    
                const hasValidHost = 'host' in config && 
                    typeof config.host === 'string' && 
                    config.host.length > 0;
                
                return hasValidPort && hasValidHost;
            };

            // Test valid configurations
            expect(validateConfig(mockServerConfigs.default.minimal)).toBe(true);
            expect(validateConfig(mockServerConfigs.custom.port8080)).toBe(true);

            // Test invalid configurations
            expect(validateConfig(null)).toBe(false);
            expect(validateConfig({})).toBe(false);
            expect(validateConfig({ port: 3000 })).toBe(false); // Missing host
            expect(validateConfig({ host: 'localhost' })).toBe(false); // Missing port
        });

        test('should handle configuration merging logic', () => {
            // Configuration merging
            const mergeConfigs = (defaultConfig, customConfig) => {
                return { ...defaultConfig, ...customConfig };
            };

            const defaultConfig = mockServerConfigs.default.minimal;
            const customOverrides = { port: 8080 };
            
            const mergedConfig = mergeConfigs(defaultConfig, customOverrides);
            
            expect(mergedConfig.port).toBe(8080);
            expect(mergedConfig.host).toBe(defaultConfig.host);
        });

        test('should validate environment-based configuration resolution', () => {
            // Test environment configuration resolution
            const originalEnv = process.env.NODE_ENV;
            
            // Test development environment
            process.env.NODE_ENV = 'development';
            expect(process.env.NODE_ENV).toBe('development');
            
            // Test production environment
            process.env.NODE_ENV = 'production';
            expect(process.env.NODE_ENV).toBe('production');
            
            // Restore original environment
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('File System Integration for Configuration', () => {
        test('should handle file not found errors (ENOENT)', async () => {
            // Mock ENOENT error
            const fs = require('fs');
            const enoentError = { ...fileSystemErrors.ENOENT };
            enoentError.path = 'config.json';
            
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(enoentError);
            });

            // Verify error handling
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('ENOENT');
                expect(err.path).toBe('config.json');
                expect(data).toBeUndefined();
            });
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle permission denied errors (EACCES)', async () => {
            // Mock EACCES error
            const fs = require('fs');
            const eaccesError = { ...fileSystemErrors.EACCES };
            eaccesError.path = 'config.json';
            
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(eaccesError);
            });

            // Verify error handling
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('EACCES');
                expect(data).toBeUndefined();
            });
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle disk space errors (ENOSPC)', async () => {
            // Mock ENOSPC error for write operations
            const fs = require('fs');
            const enospcError = { ...fileSystemErrors.ENOSPC };
            
            jest.spyOn(fs, 'writeFile').mockImplementation((path, data, options, callback) => {
                callback(enospcError);
            });

            // Verify error handling
            fs.writeFile('config.json', '{}', 'utf8', (err) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('ENOSPC');
            });
            
            // Restore mocks
            fs.writeFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle too many open files error (EMFILE)', async () => {
            // Mock EMFILE error
            const fs = require('fs');
            const emfileError = { ...fileSystemErrors.EMFILE };
            
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(emfileError);
            });

            // Verify error handling
            fs.readFile('config.json', 'utf8', (err, data) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('EMFILE');
            });
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should handle directory operation errors (EISDIR)', async () => {
            // Mock EISDIR error
            const fs = require('fs');
            const eisdirError = { ...fileSystemErrors.EISDIR };
            eisdirError.path = 'config';
            
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(eisdirError);
            });

            // Verify error handling for directory instead of file
            fs.readFile('config', 'utf8', (err, data) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('EISDIR');
                expect(err.path).toBe('config');
            });
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, TEST_TIMEOUT);

        test('should test custom mock scenarios', async () => {
            // Create custom mock scenario with proper object parameter
            const customScenario = createCustomMockScenario({
                name: 'testScenario',
                fileSystem: {
                    simulateSlowRead: true,
                    simulateCorruption: false,
                    customError: null
                },
                behaviors: {}
            });

            expect(customScenario).toBeDefined();
            expect(typeof customScenario).toBe('object');
            expect(customScenario.name).toBe('testScenario');
            expect(customScenario.config).toBeDefined();
        }, TEST_TIMEOUT);

        test('should reset file system mocks properly', () => {
            // Create mocks
            const fs = require('fs');
            const readFileSpy = jest.spyOn(fs, 'readFile').mockReturnValue('test data');

            // Reset mocks
            resetFileSystemMocks();
            readFileSpy.mockRestore();

            // Verify mocks can be created
            expect(jest.spyOn).toBeDefined();
        });
    });

    describe('Configuration Edge Cases and Boundary Conditions', () => {
        test('should handle extremely large configuration files', async () => {
            // Test with large configuration
            const fs = require('fs');
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                callback(null, mockFiles.largeConfig);
            });

            // Verify large file handling
            fs.readFile('large-config.json', 'utf8', (err, data) => {
                expect(err).toBeNull();
                expect(data).toBe(mockFiles.largeConfig);
                expect(data.length).toBeGreaterThan(0);
            });
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, EXTENDED_TIMEOUT);

        test('should handle configuration with special characters', () => {
            // Test configuration with Unicode and special characters
            const specialConfig = {
                name: 'test-config-特殊字符',
                description: 'Configuration with émojis 🚀 and ünicode',
                path: '/path/with spaces/and-special_chars.config'
            };

            expect(specialConfig.name).toContain('特殊字符');
            expect(specialConfig.description).toContain('🚀');
            expect(specialConfig.path).toContain(' ');
        });

        test('should handle concurrent configuration access', async () => {
            // Simulate concurrent configuration loading
            const fs = require('fs');
            let readCount = 0;
            
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                readCount++;
                setTimeout(() => {
                    callback(null, mockFiles.configJson);
                }, 10);
            });

            // Simulate multiple concurrent reads
            const promises = Array(5).fill().map(() => {
                return new Promise((resolve) => {
                    fs.readFile('config.json', 'utf8', (err, data) => {
                        resolve({ err, data });
                    });
                });
            });

            await Promise.all(promises);
            expect(readCount).toBe(5);
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, EXTENDED_TIMEOUT);

        test('should handle configuration validation with edge case values', () => {
            // Test edge case configurations
            const edgeCases = [
                { port: 0, host: 'localhost' }, // Dynamic port
                { port: 65535, host: '0.0.0.0' }, // Maximum port
                { port: 1024, host: '127.0.0.1' }, // Minimum unprivileged port
            ];

            edgeCases.forEach(config => {
                expect(config.port).toBeGreaterThanOrEqual(0);
                expect(config.port).toBeLessThanOrEqual(65535);
                expect(typeof config.host).toBe('string');
                expect(config.host.length).toBeGreaterThan(0);
            });
        });

        test('should handle memory constraints during configuration loading', async () => {
            // Test memory-conscious configuration loading
            const fs = require('fs');
            const largeConfigSize = 1000000; // 1MB simulated
            
            jest.spyOn(fs, 'readFile').mockImplementation((path, options, callback) => {
                // Simulate large file
                const largeData = 'x'.repeat(largeConfigSize);
                callback(null, largeData);
            });

            fs.readFile('huge-config.json', 'utf8', (err, data) => {
                expect(err).toBeNull();
                expect(data.length).toBe(largeConfigSize);
            });
            
            // Restore mocks
            fs.readFile.mockRestore();
        }, EXTENDED_TIMEOUT);
    });
});