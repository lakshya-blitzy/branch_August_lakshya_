/**
 * Mock File System Operations
 * 
 * Provides comprehensive mocking for Node.js file system operations to enable
 * isolated testing of configuration loading, file reading, and file-based storage scenarios.
 * 
 * This module supports testing of:
 * - Configuration file parsing (JSON, YAML, properties formats)
 * - File system error scenarios (ENOENT, EACCES, etc.)
 * - Cache management and log file operations
 * - File permission scenarios and validation
 * 
 * @module MockFileSystem
 * @version 1.0.0
 * @requires fs
 * @requires path
 * @requires util
 * @requires jest
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Import all required members from external dependencies
const { 
    readFile: originalReadFile,
    readFileSync: originalReadFileSync,
    writeFile: originalWriteFile,
    writeFileSync: originalWriteFileSync,
    existsSync: originalExistsSync,
    access: originalAccess,
    mkdir: originalMkdir,
    rmdir: originalRmdir,
    constants: fsConstants,
    Stats: originalStats
} = fs;

const {
    join: pathJoin,
    resolve: pathResolve,
    basename: pathBasename,
    dirname: pathDirname,
    extname: pathExtname,
    normalize: pathNormalize,
    sep: pathSep
} = path;

const {
    promisify: utilPromisify,
    inspect: utilInspect,
    isError: utilIsError,
    format: utilFormat
} = util;

// Jest mocking utilities - available in test environment
const createJestMockFunction = () => {
    // Create a mock function that can be called and tracked
    const mockFn = function(...args) {
        mockFn.mock.calls.push(args);
        mockFn.mock.instances.push(this);
        
        // Execute the implementation if available
        if (mockFn.mock.implementation) {
            return mockFn.mock.implementation.apply(this, args);
        }
        return undefined;
    };
    
    // Add Jest mock properties
    mockFn.mock = {
        calls: [],
        instances: [],
        results: [],
        implementation: null
    };
    
    // Add Jest mock methods
    mockFn.mockImplementation = function(implementation) {
        mockFn.mock.implementation = implementation;
        return mockFn;
    };
    
    mockFn.mockReturnValue = function(value) {
        mockFn.mock.implementation = () => value;
        return mockFn;
    };
    
    mockFn.mockResolvedValue = function(value) {
        mockFn.mock.implementation = () => Promise.resolve(value);
        return mockFn;
    };
    
    mockFn.mockRejectedValue = function(value) {
        mockFn.mock.implementation = () => Promise.reject(value);
        return mockFn;
    };
    
    mockFn.getMockImplementation = function() {
        return mockFn.mock.implementation;
    };
    
    return mockFn;
};

// Mock file contents for different configuration formats
const mockFiles = {
    // Valid JSON configuration file
    configJson: JSON.stringify({
        server: {
            port: 3000,
            host: 'localhost',
            timeout: 30000
        },
        database: {
            host: 'localhost',
            port: 5432,
            name: 'testdb',
            ssl: false
        },
        logging: {
            level: 'info',
            file: 'app.log',
            maxSize: '10MB'
        },
        features: {
            authentication: true,
            monitoring: true,
            caching: false
        }
    }, null, 2),

    // Valid YAML configuration file content
    configYaml: `server:
  port: 3000
  host: localhost
  timeout: 30000

database:
  host: localhost
  port: 5432
  name: testdb
  ssl: false

logging:
  level: info
  file: app.log
  maxSize: 10MB

features:
  authentication: true
  monitoring: true
  caching: false`,

    // Invalid configuration file (malformed JSON)
    invalidConfig: `{
        "server": {
            "port": 3000,
            "host": "localhost",
            "timeout": 30000
        },
        "database": {
            "host": "localhost",
            "port": 5432,
            "name": "testdb",
            "ssl": false
        // Missing closing braces and invalid syntax
    `,

    // Empty configuration file
    emptyConfig: '',

    // Large configuration file for testing memory limits
    largeConfig: JSON.stringify({
        metadata: {
            generated: new Date().toISOString(),
            version: '1.0.0',
            description: 'Large configuration file for testing'
        },
        data: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `item_${i}`,
            value: Math.random() * 1000,
            active: i % 2 === 0,
            tags: [`tag_${i % 10}`, `category_${i % 5}`],
            metadata: {
                created: new Date(Date.now() - i * 86400000).toISOString(),
                updated: new Date().toISOString(),
                version: Math.floor(Math.random() * 10) + 1
            }
        }))
    }, null, 2)
};

// File permission scenarios for testing access control
const permissions = {
    // Read-only access (444 permissions)
    readOnly: {
        mode: 0o444,
        readable: true,
        writable: false,
        executable: false
    },

    // Write-only access (222 permissions)
    writeOnly: {
        mode: 0o222,
        readable: false,
        writable: true,
        executable: false
    },

    // No access (000 permissions)
    noAccess: {
        mode: 0o000,
        readable: false,
        writable: false,
        executable: false
    },

    // Full access (777 permissions)
    fullAccess: {
        mode: 0o777,
        readable: true,
        writable: true,
        executable: true
    }
};

// Common file system error scenarios
const errors = {
    // File or directory not found
    ENOENT: {
        code: 'ENOENT',
        errno: -2,
        syscall: 'open',
        path: '/nonexistent/file.txt',
        message: 'ENOENT: no such file or directory, open \'/nonexistent/file.txt\''
    },

    // Permission denied
    EACCES: {
        code: 'EACCES',
        errno: -13,
        syscall: 'open',
        path: '/restricted/file.txt',
        message: 'EACCES: permission denied, open \'/restricted/file.txt\''
    },

    // Too many open files
    EMFILE: {
        code: 'EMFILE',
        errno: -24,
        syscall: 'open',
        path: '/tmp/file.txt',
        message: 'EMFILE: too many open files, open \'/tmp/file.txt\''
    },

    // No space left on device
    ENOSPC: {
        code: 'ENOSPC',
        errno: -28,
        syscall: 'write',
        path: '/tmp/file.txt',
        message: 'ENOSPC: no space left on device, write'
    },

    // Is a directory (when expecting file)
    EISDIR: {
        code: 'EISDIR',
        errno: -21,
        syscall: 'read',
        path: '/tmp/directory',
        message: 'EISDIR: illegal operation on a directory, read'
    }
};

/**
 * Creates a custom file system error with specified properties
 * @param {string} code - Error code (ENOENT, EACCES, etc.)
 * @param {string} path - File path associated with error
 * @param {string} syscall - System call that generated the error
 * @returns {Error} Custom file system error object
 */
function createFileSystemError(code, path, syscall = 'open') {
    const errorTemplate = errors[code] || errors.ENOENT;
    const error = new Error(utilFormat('%s: %s, %s \'%s\'', code, errorTemplate.message.split(':')[1].split(',')[0], syscall, path));
    error.code = code;
    error.errno = errorTemplate.errno;
    error.syscall = syscall;
    error.path = path;
    return error;
}

/**
 * Mock Stats object for file system operations
 */
class MockStats {
    constructor(options = {}) {
        this.size = options.size || 0;
        this.mode = options.mode || 0o644;
        this.mtime = options.mtime || new Date();
        this.atime = options.atime || new Date();
        this.ctime = options.ctime || new Date();
        this.birthtime = options.birthtime || new Date();
        this.isFile = createJestMockFunction().mockReturnValue(options.isFile !== false);
        this.isDirectory = createJestMockFunction().mockReturnValue(options.isDirectory === true);
        this.isSymbolicLink = createJestMockFunction().mockReturnValue(options.isSymbolicLink === true);
        this.isBlockDevice = createJestMockFunction().mockReturnValue(false);
        this.isCharacterDevice = createJestMockFunction().mockReturnValue(false);
        this.isFIFO = createJestMockFunction().mockReturnValue(false);
        this.isSocket = createJestMockFunction().mockReturnValue(false);
    }
}

// Mocked file system implementation
const mockedFs = {
    // Async file reading with callback
    readFile: createJestMockFunction().mockImplementation((filePath, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = 'utf8';
        }

        const normalizedPath = pathNormalize(filePath);
        const filename = pathBasename(normalizedPath);

        // Simulate async operation
        process.nextTick(() => {
            // Check for error scenarios based on file path
            if (normalizedPath.includes('nonexistent')) {
                return callback(createFileSystemError('ENOENT', normalizedPath, 'open'));
            }
            if (normalizedPath.includes('restricted') || normalizedPath.includes('noaccess')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'open'));
            }
            if (normalizedPath.includes('directory') && !normalizedPath.includes('.')) {
                return callback(createFileSystemError('EISDIR', normalizedPath, 'read'));
            }

            // Return appropriate mock content based on filename
            let content = '';
            if (filename.includes('invalid') && filename.includes('.json')) {
                content = mockFiles.invalidConfig;
            } else if (filename.includes('empty')) {
                content = mockFiles.emptyConfig;
            } else if (filename.includes('large')) {
                content = mockFiles.largeConfig;
            } else if (filename.endsWith('.json')) {
                content = mockFiles.configJson;
            } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
                content = mockFiles.configYaml;
            } else {
                content = JSON.stringify({ message: 'Mock file content', path: normalizedPath });
            }

            callback(null, content);
        });
    }),

    // Sync file reading
    readFileSync: createJestMockFunction().mockImplementation((filePath, options = 'utf8') => {
        const normalizedPath = pathNormalize(filePath);
        const filename = pathBasename(normalizedPath);

        // Check for error scenarios
        if (normalizedPath.includes('nonexistent')) {
            throw createFileSystemError('ENOENT', normalizedPath, 'open');
        }
        if (normalizedPath.includes('restricted') || normalizedPath.includes('noaccess')) {
            throw createFileSystemError('EACCES', normalizedPath, 'open');
        }
        if (normalizedPath.includes('directory') && !normalizedPath.includes('.')) {
            throw createFileSystemError('EISDIR', normalizedPath, 'read');
        }

        // Return appropriate mock content
        if (filename.includes('invalid') && filename.includes('.json')) {
            return mockFiles.invalidConfig;
        } else if (filename.includes('empty')) {
            return mockFiles.emptyConfig;
        } else if (filename.includes('large')) {
            return mockFiles.largeConfig;
        } else if (filename.endsWith('.json')) {
            return mockFiles.configJson;
        } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
            return mockFiles.configYaml;
        }

        return JSON.stringify({ message: 'Mock file content', path: normalizedPath });
    }),

    // Async file writing with callback
    writeFile: createJestMockFunction().mockImplementation((filePath, data, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = 'utf8';
        }

        const normalizedPath = pathNormalize(filePath);

        // Simulate async operation
        process.nextTick(() => {
            // Check for error scenarios
            if (normalizedPath.includes('readonly')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'open'));
            }
            if (normalizedPath.includes('nospace')) {
                return callback(createFileSystemError('ENOSPC', normalizedPath, 'write'));
            }
            if (normalizedPath.includes('restricted')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'open'));
            }

            // Simulate successful write
            callback(null);
        });
    }),

    // Sync file writing
    writeFileSync: createJestMockFunction().mockImplementation((filePath, data, options = 'utf8') => {
        const normalizedPath = pathNormalize(filePath);

        // Check for error scenarios
        if (normalizedPath.includes('readonly')) {
            throw createFileSystemError('EACCES', normalizedPath, 'open');
        }
        if (normalizedPath.includes('nospace')) {
            throw createFileSystemError('ENOSPC', normalizedPath, 'write');
        }
        if (normalizedPath.includes('restricted')) {
            throw createFileSystemError('EACCES', normalizedPath, 'open');
        }

        // Simulate successful write (no return value)
    }),

    // Check if file exists synchronously
    existsSync: createJestMockFunction().mockImplementation((filePath) => {
        const normalizedPath = pathNormalize(filePath);
        
        // Files that should not exist
        if (normalizedPath.includes('nonexistent') || 
            normalizedPath.includes('missing') ||
            normalizedPath.includes('deleted')) {
            return false;
        }

        // All other files exist in our mock
        return true;
    }),

    // Check file access permissions
    access: createJestMockFunction().mockImplementation((filePath, mode, callback) => {
        if (typeof mode === 'function') {
            callback = mode;
            mode = fsConstants.F_OK;
        }

        const normalizedPath = pathNormalize(filePath);

        process.nextTick(() => {
            // Check existence
            if (normalizedPath.includes('nonexistent')) {
                return callback(createFileSystemError('ENOENT', normalizedPath, 'access'));
            }

            // Check specific permissions
            if (mode & fsConstants.R_OK && normalizedPath.includes('writeonly')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'access'));
            }
            if (mode & fsConstants.W_OK && normalizedPath.includes('readonly')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'access'));
            }
            if (normalizedPath.includes('noaccess')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'access'));
            }

            // Access granted
            callback(null);
        });
    }),

    // Create directory
    mkdir: createJestMockFunction().mockImplementation((dirPath, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        const normalizedPath = pathNormalize(dirPath);

        process.nextTick(() => {
            // Check for error scenarios
            if (normalizedPath.includes('restricted')) {
                return callback(createFileSystemError('EACCES', normalizedPath, 'mkdir'));
            }
            if (normalizedPath.includes('exists') && !options.recursive) {
                const error = new Error(`EEXIST: file already exists, mkdir '${normalizedPath}'`);
                error.code = 'EEXIST';
                error.errno = -17;
                error.syscall = 'mkdir';
                error.path = normalizedPath;
                return callback(error);
            }

            callback(null);
        });
    }),

    // Remove directory
    rmdir: createJestMockFunction().mockImplementation((dirPath, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        const normalizedPath = pathNormalize(dirPath);

        process.nextTick(() => {
            // Check for error scenarios
            if (normalizedPath.includes('nonexistent')) {
                return callback(createFileSystemError('ENOENT', normalizedPath, 'rmdir'));
            }
            if (normalizedPath.includes('notempty') && !options.recursive) {
                const error = new Error(`ENOTEMPTY: directory not empty, rmdir '${normalizedPath}'`);
                error.code = 'ENOTEMPTY';
                error.errno = -39;
                error.syscall = 'rmdir';
                error.path = normalizedPath;
                return callback(error);
            }

            callback(null);
        });
    })
};

/**
 * Creates a comprehensive mock file system with predefined scenarios
 * @param {Object} options - Configuration options for the mock setup
 * @param {Object} options.files - Custom file content mappings
 * @param {Array} options.existingPaths - Paths that should exist
 * @param {Array} options.errorPaths - Paths that should trigger errors
 * @returns {Object} Mock file system configuration
 */
function createMockFileSystem(options = {}) {
    const { files = {}, existingPaths = [], errorPaths = [] } = options;

    // Reset all existing mocks
    Object.keys(mockedFs).forEach(methodName => {
        if (mockedFs[methodName] && mockedFs[methodName].mock) {
            mockedFs[methodName].mock.calls = [];
            mockedFs[methodName].mock.instances = [];
            mockedFs[methodName].mock.results = [];
        }
    });

    // Create custom file content mapping
    const customFiles = { ...mockFiles, ...files };

    // Update existsSync behavior for custom paths
    mockedFs.existsSync.mockImplementation((filePath) => {
        const normalizedPath = pathNormalize(filePath);
        
        // Check custom existing paths
        if (existingPaths.some(p => normalizedPath.includes(p))) {
            return true;
        }
        
        // Check error paths
        if (errorPaths.some(p => normalizedPath.includes(p))) {
            return false;
        }

        // Default behavior
        return !normalizedPath.includes('nonexistent') && 
               !normalizedPath.includes('missing') && 
               !normalizedPath.includes('deleted');
    });

    // Update readFile behavior for custom files
    const originalReadFileImpl = mockedFs.readFile.getMockImplementation();
    mockedFs.readFile.mockImplementation((filePath, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = 'utf8';
        }

        const normalizedPath = pathNormalize(filePath);
        const customContent = Object.keys(customFiles).find(key => 
            normalizedPath.includes(key) || pathBasename(normalizedPath) === key
        );

        if (customContent) {
            process.nextTick(() => callback(null, customFiles[customContent]));
        } else {
            originalReadFileImpl(filePath, options, callback);
        }
    });

    return {
        fs: mockedFs,
        mockFiles: customFiles,
        reset: () => resetFileSystemMocks(),
        addFile: (name, content) => {
            customFiles[name] = content;
        },
        addErrorPath: (path) => {
            errorPaths.push(path);
        }
    };
}

/**
 * Resets all file system mocks to their initial state
 */
function resetFileSystemMocks() {
    // Reset all mock call history but preserve implementations
    Object.keys(mockedFs).forEach(methodName => {
        if (mockedFs[methodName] && mockedFs[methodName].mock) {
            mockedFs[methodName].mock.calls = [];
            mockedFs[methodName].mock.instances = [];
            mockedFs[methodName].mock.results = [];
            // Don't reset implementation - preserve the original mock behavior
        }
    });
}

/**
 * Creates a custom mock scenario for specific testing needs
 * @param {Object} scenario - Scenario configuration
 * @param {string} scenario.name - Scenario name for identification
 * @param {Object} scenario.fileSystem - File system state configuration
 * @param {Object} scenario.behaviors - Custom behavior overrides
 * @returns {Object} Custom mock scenario configuration
 */
function createCustomMockScenario(scenario) {
    const { name, fileSystem = {}, behaviors = {} } = scenario;

    // Validate scenario parameters
    if (!name || typeof name !== 'string') {
        throw new Error('Scenario name is required and must be a string');
    }

    const mockConfig = createMockFileSystem(fileSystem);

    // Apply custom behaviors
    Object.keys(behaviors).forEach(methodName => {
        if (mockedFs[methodName] && typeof behaviors[methodName] === 'function') {
            mockedFs[methodName].mockImplementation(behaviors[methodName]);
        }
    });

    return {
        name,
        config: mockConfig,
        teardown: () => {
            resetFileSystemMocks();
        },
        inspect: () => {
            return {
                name,
                fileSystem,
                behaviors: Object.keys(behaviors),
                calls: Object.keys(mockedFs).reduce((acc, methodName) => {
                    if (mockedFs[methodName].mock) {
                        acc[methodName] = mockedFs[methodName].mock.calls.length;
                    }
                    return acc;
                }, {})
            };
        }
    };
}

// Export all required components
module.exports = {
    fs: mockedFs,
    mockFiles,
    permissions,
    errors,
    createMockFileSystem,
    resetFileSystemMocks,
    createCustomMockScenario
};