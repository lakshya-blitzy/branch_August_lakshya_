/**
 * HTTP Response Compression Middleware Configuration
 * 
 * Wraps the compression npm package with optimized settings for the Testinium-QA Node.js server.
 * Implements gzip and deflate compression algorithms for response payload optimization,
 * reducing bandwidth usage and improving API response times for large payloads while
 * maintaining response time under 100ms per technical constraints.
 * 
 * Key Features:
 * - Environment-based compression level configuration (higher in production: 6, dev: 1)
 * - Intelligent threshold management (1KB default minimum for compression efficiency)
 * - Content-type filtering excluding already compressed file types (images, videos)
 * - Real-time compression ratio monitoring for performance metrics
 * - Graceful fallback compression algorithm support (gzip -> deflate)
 * - Comprehensive logging and debugging capabilities
 * - Production-optimized performance with minimal overhead
 * 
 * @module compression
 * @version 1.0.0
 * @author Blitzy Agent
 */

// Internal imports - Configuration and logging utilities
const config = require('../utils/config.js');
const logger = require('../utils/logger.js');

// External imports - HTTP compression and Node.js utilities
const compression = require('compression');
const process = require('process');
const util = require('util');

/**
 * Default compression configuration constants
 * Provides baseline settings with environment-specific overrides
 * 
 * THRESHOLD: Minimum response size (bytes) before compression is applied
 * LEVEL: Compression level (1-9, higher = better compression but slower)
 * EXCLUDE_TYPES: MIME types that should not be compressed (already compressed)
 * CONTENT_TYPES: MIME types that benefit from compression
 */
const COMPRESSION_DEFAULTS = {
    THRESHOLD: 1024, // 1KB minimum threshold for compression efficiency
    LEVEL: 6, // Default compression level (balanced speed vs compression)
    EXCLUDE_TYPES: [
        // Image formats (already compressed)
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/ico',
        
        // Video formats (already compressed)
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/3gp',
        
        // Audio formats (already compressed)
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        
        // Archive formats (already compressed)
        'application/zip',
        'application/gzip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        
        // Font formats (may be compressed)
        'font/woff',
        'font/woff2',
        'application/font-woff',
        'application/font-woff2'
    ],
    CONTENT_TYPES: [
        // Text-based content types that benefit from compression
        'text/html',
        'text/css',
        'text/javascript',
        'text/plain',
        'text/xml',
        'text/csv',
        
        // Application content types
        'application/json',
        'application/xml',
        'application/javascript',
        'application/x-javascript',
        'application/ecmascript',
        'application/rss+xml',
        'application/atom+xml',
        'application/soap+xml',
        'application/xhtml+xml',
        'application/x-font-ttf',
        'application/vnd.ms-fontobject',
        
        // API-specific content types
        'application/vnd.api+json',
        'application/hal+json',
        'application/ld+json'
    ]
};

/**
 * Global compression metrics for performance monitoring
 * Tracks compression effectiveness and performance characteristics
 */
let compressionMetricsData = {
    totalRequests: 0,
    compressedRequests: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    compressionRatio: 0,
    averageCompressionTime: 0,
    compressionErrors: 0
};

/**
 * Determines if a response should be compressed based on content type and size
 * Implements intelligent filtering to avoid compressing already compressed content
 * and small responses where compression overhead exceeds benefits
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if response should be compressed, false otherwise
 */
function shouldCompress(req, res) {
    try {
        // Get response content type
        const contentType = res.getHeader('content-type') || '';
        const normalizedContentType = contentType.toLowerCase().split(';')[0].trim();
        
        // Check if content type is explicitly excluded
        const excludeTypes = config.compression.excludeTypes || COMPRESSION_DEFAULTS.EXCLUDE_TYPES;
        if (excludeTypes.includes(normalizedContentType)) {
            logger.debug('Skipping compression for excluded content type', {
                contentType: normalizedContentType,
                url: req.url,
                method: req.method
            });
            return false;
        }
        
        // Check if content type is compressible
        const contentTypes = COMPRESSION_DEFAULTS.CONTENT_TYPES;
        const isCompressibleType = contentTypes.some(type => 
            normalizedContentType.startsWith(type) || normalizedContentType.includes(type)
        );
        
        if (!isCompressibleType) {
            logger.debug('Skipping compression for non-compressible content type', {
                contentType: normalizedContentType,
                url: req.url,
                method: req.method
            });
            return false;
        }
        
        // Check content length threshold
        const contentLength = res.getHeader('content-length');
        const threshold = config.compression.threshold || COMPRESSION_DEFAULTS.THRESHOLD;
        
        if (contentLength && parseInt(contentLength, 10) < threshold) {
            logger.debug('Skipping compression for small response', {
                contentLength: contentLength,
                threshold: threshold,
                url: req.url,
                method: req.method
            });
            return false;
        }
        
        // Check Accept-Encoding header
        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
            logger.debug('Client does not support compression', {
                acceptEncoding: acceptEncoding,
                url: req.url,
                method: req.method
            });
            return false;
        }
        
        logger.debug('Response will be compressed', {
            contentType: normalizedContentType,
            contentLength: contentLength,
            url: req.url,
            method: req.method
        });
        
        return true;
        
    } catch (error) {
        logger.error('Error in shouldCompress function', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method
        }, error);
        
        // Default to compression on error to maintain functionality
        return true;
    }
}

/**
 * Creates compression options object with environment-specific configuration
 * Adapts compression settings based on environment performance requirements
 * 
 * @returns {Object} Compression options object for compression middleware
 */
function createCompressionOptions() {
    try {
        // Determine compression level based on environment
        let compressionLevel;
        if (config.isProduction) {
            // Production: Higher compression level (6) for bandwidth optimization
            compressionLevel = config.compression.level || 6;
        } else if (config.isDevelopment) {
            // Development: Lower compression level (1) for faster response times
            compressionLevel = 1;
        } else {
            // Test or other environments: Balanced compression
            compressionLevel = config.compression.level || 3;
        }
        
        // Validate compression level range
        if (compressionLevel < 1 || compressionLevel > 9) {
            logger.warn('Invalid compression level, using default', {
                providedLevel: compressionLevel,
                environment: config.nodeEnv,
                fallbackLevel: COMPRESSION_DEFAULTS.LEVEL
            });
            compressionLevel = COMPRESSION_DEFAULTS.LEVEL;
        }
        
        // Create compression options with optimized settings
        const options = {
            // Compression level (1-9, higher = better compression but slower)
            level: compressionLevel,
            
            // Minimum threshold for compression (bytes)
            threshold: config.compression.threshold || COMPRESSION_DEFAULTS.THRESHOLD,
            
            // Custom filter function for intelligent compression decisions
            filter: shouldCompress,
            
            // Memory level (1-9, higher = more memory but better compression)
            memLevel: config.isProduction ? 8 : 6,
            
            // Window size (affects compression quality and memory usage)
            windowBits: 15,
            
            // Strategy for compression algorithm optimization
            strategy: compression.constants?.Z_DEFAULT_STRATEGY || 0,
            
            // Chunk size for streaming compression
            chunkSize: 16384, // 16KB chunks for optimal performance
            
            // Enable flush for immediate compression output
            flush: compression.constants?.Z_SYNC_FLUSH || 2
        };
        
        logger.info('Compression options configured', {
            level: options.level,
            threshold: options.threshold,
            memLevel: options.memLevel,
            environment: config.nodeEnv,
            isProduction: config.isProduction
        });
        
        return options;
        
    } catch (error) {
        logger.error('Error creating compression options', {
            error: error.message,
            stack: error.stack,
            environment: config.nodeEnv
        }, error);
        
        // Return safe default options on error
        return {
            level: COMPRESSION_DEFAULTS.LEVEL,
            threshold: COMPRESSION_DEFAULTS.THRESHOLD,
            filter: shouldCompress
        };
    }
}

/**
 * Updates and retrieves compression performance metrics
 * Provides real-time monitoring of compression effectiveness and performance
 * 
 * @param {Object} metricsUpdate - Optional metrics update object
 * @returns {Object} Current compression metrics
 */
function compressionMetrics(metricsUpdate = null) {
    try {
        // Update metrics if provided
        if (metricsUpdate && util.isObject(metricsUpdate)) {
            if (typeof metricsUpdate.totalRequests === 'number') {
                compressionMetricsData.totalRequests += metricsUpdate.totalRequests;
            }
            if (typeof metricsUpdate.compressedRequests === 'number') {
                compressionMetricsData.compressedRequests += metricsUpdate.compressedRequests;
            }
            if (typeof metricsUpdate.bytesIn === 'number') {
                compressionMetricsData.totalBytesIn += metricsUpdate.bytesIn;
            }
            if (typeof metricsUpdate.bytesOut === 'number') {
                compressionMetricsData.totalBytesOut += metricsUpdate.bytesOut;
            }
            if (typeof metricsUpdate.compressionTime === 'number') {
                // Calculate rolling average compression time
                const currentAvg = compressionMetricsData.averageCompressionTime;
                const totalRequests = compressionMetricsData.totalRequests;
                compressionMetricsData.averageCompressionTime = 
                    ((currentAvg * (totalRequests - 1)) + metricsUpdate.compressionTime) / totalRequests;
            }
            if (typeof metricsUpdate.errors === 'number') {
                compressionMetricsData.compressionErrors += metricsUpdate.errors;
            }
            
            // Recalculate compression ratio
            if (compressionMetricsData.totalBytesIn > 0) {
                compressionMetricsData.compressionRatio = 
                    ((compressionMetricsData.totalBytesIn - compressionMetricsData.totalBytesOut) / 
                     compressionMetricsData.totalBytesIn) * 100;
            }
            
            logger.debug('Compression metrics updated', {
                totalRequests: compressionMetricsData.totalRequests,
                compressedRequests: compressionMetricsData.compressedRequests,
                compressionRatio: compressionMetricsData.compressionRatio.toFixed(2),
                averageTime: compressionMetricsData.averageCompressionTime.toFixed(2)
            });
        }
        
        // Return current metrics
        return {
            totalRequests: compressionMetricsData.totalRequests,
            compressedRequests: compressionMetricsData.compressedRequests,
            compressionRatio: Number(compressionMetricsData.compressionRatio.toFixed(2)),
            averageCompressionTime: Number(compressionMetricsData.averageCompressionTime.toFixed(2)),
            bandwidthSaved: compressionMetricsData.totalBytesIn - compressionMetricsData.totalBytesOut,
            totalBytesIn: compressionMetricsData.totalBytesIn,
            totalBytesOut: compressionMetricsData.totalBytesOut,
            compressionErrors: compressionMetricsData.compressionErrors,
            compressionRate: compressionMetricsData.totalRequests > 0 ? 
                Number(((compressionMetricsData.compressedRequests / compressionMetricsData.totalRequests) * 100).toFixed(2)) : 0
        };
        
    } catch (error) {
        logger.error('Error in compressionMetrics function', {
            error: error.message,
            stack: error.stack,
            metricsUpdate: util.inspect(metricsUpdate)
        }, error);
        
        // Return safe default metrics on error
        return {
            totalRequests: 0,
            compressedRequests: 0,
            compressionRatio: 0,
            averageCompressionTime: 0,
            bandwidthSaved: 0,
            totalBytesIn: 0,
            totalBytesOut: 0,
            compressionErrors: 0,
            compressionRate: 0
        };
    }
}

/**
 * Creates and configures compression middleware with comprehensive monitoring
 * Main compression configuration function that wraps the compression package
 * with optimized settings, performance monitoring, and intelligent compression decisions
 * 
 * @returns {Function} Express middleware function for HTTP response compression
 */
function compressionConfig() {
    try {
        // Create optimized compression options
        const options = createCompressionOptions();
        
        logger.info('Initializing HTTP compression middleware', {
            compressionLevel: options.level,
            threshold: options.threshold,
            environment: config.nodeEnv,
            excludeTypesCount: COMPRESSION_DEFAULTS.EXCLUDE_TYPES.length,
            compressibleTypesCount: COMPRESSION_DEFAULTS.CONTENT_TYPES.length
        });
        
        // Create compression middleware instance
        const compressionMiddleware = compression(options);
        
        // Return enhanced middleware with metrics collection
        return function compressionWithMetrics(req, res, next) {
            const startTime = Date.now();
            let bytesIn = 0;
            let bytesOut = 0;
            let isCompressed = false;
            
            try {
                // Capture original response methods for metrics collection
                const originalWrite = res.write;
                const originalEnd = res.end;
                
                // Override res.write to capture output bytes
                res.write = function(chunk, encoding) {
                    if (chunk) {
                        bytesOut += chunk.length || 0;
                    }
                    return originalWrite.call(this, chunk, encoding);
                };
                
                // Override res.end to capture final metrics
                res.end = function(chunk, encoding) {
                    if (chunk) {
                        bytesOut += chunk.length || 0;
                    }
                    
                    // Calculate compression metrics
                    const compressionTime = Date.now() - startTime;
                    const contentEncoding = res.getHeader('content-encoding');
                    isCompressed = !!(contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('deflate')));
                    
                    // Estimate input bytes (before compression)
                    bytesIn = parseInt(res.getHeader('content-length'), 10) || bytesOut || 0;
                    
                    // Update compression metrics
                    compressionMetrics({
                        totalRequests: 1,
                        compressedRequests: isCompressed ? 1 : 0,
                        bytesIn: bytesIn,
                        bytesOut: bytesOut,
                        compressionTime: compressionTime
                    });
                    
                    // Log compression results for monitoring
                    if (isCompressed && bytesIn > 0) {
                        const ratio = ((bytesIn - bytesOut) / bytesIn) * 100;
                        logger.debug('Response compressed successfully', {
                            url: req.url,
                            method: req.method,
                            bytesIn: bytesIn,
                            bytesOut: bytesOut,
                            compressionRatio: ratio.toFixed(2),
                            compressionTime: compressionTime,
                            contentEncoding: contentEncoding
                        });
                    } else if (config.isDevelopment) {
                        logger.debug('Response not compressed', {
                            url: req.url,
                            method: req.method,
                            bytesOut: bytesOut,
                            contentType: res.getHeader('content-type'),
                            reason: isCompressed ? 'compressed' : 'filtered_out'
                        });
                    }
                    
                    return originalEnd.call(this, chunk, encoding);
                };
                
                // Apply compression middleware
                compressionMiddleware(req, res, next);
                
            } catch (error) {
                logger.error('Error in compression middleware', {
                    error: error.message,
                    stack: error.stack,
                    url: req.url,
                    method: req.method
                }, error);
                
                // Update error metrics
                compressionMetrics({
                    totalRequests: 1,
                    errors: 1
                });
                
                // Continue without compression on error
                next();
            }
        };
        
    } catch (error) {
        logger.error('Error initializing compression middleware', {
            error: error.message,
            stack: error.stack,
            environment: config.nodeEnv
        }, error);
        
        // Return pass-through middleware on initialization error
        return function(req, res, next) {
            logger.warn('Compression middleware disabled due to initialization error', {
                url: req.url,
                method: req.method
            });
            next();
        };
    }
}

/**
 * Graceful shutdown handler for compression middleware
 * Logs final compression metrics and cleans up resources
 */
function shutdownCompressionMiddleware() {
    try {
        const finalMetrics = compressionMetrics();
        
        logger.info('Compression middleware shutdown - Final metrics', {
            totalRequests: finalMetrics.totalRequests,
            compressedRequests: finalMetrics.compressedRequests,
            compressionRate: finalMetrics.compressionRate,
            compressionRatio: finalMetrics.compressionRatio,
            bandwidthSaved: finalMetrics.bandwidthSaved,
            averageCompressionTime: finalMetrics.averageCompressionTime,
            compressionErrors: finalMetrics.compressionErrors
        });
        
        // Reset metrics for clean shutdown
        compressionMetricsData = {
            totalRequests: 0,
            compressedRequests: 0,
            totalBytesIn: 0,
            totalBytesOut: 0,
            compressionRatio: 0,
            averageCompressionTime: 0,
            compressionErrors: 0
        };
        
    } catch (error) {
        logger.error('Error during compression middleware shutdown', {
            error: error.message,
            stack: error.stack
        }, error);
    }
}

// Handle graceful shutdown signals
process.on('SIGTERM', shutdownCompressionMiddleware);
process.on('SIGINT', shutdownCompressionMiddleware);

// Log successful middleware initialization
logger.info('Compression middleware module loaded successfully', {
    defaultThreshold: COMPRESSION_DEFAULTS.THRESHOLD,
    defaultLevel: COMPRESSION_DEFAULTS.LEVEL,
    excludeTypesCount: COMPRESSION_DEFAULTS.EXCLUDE_TYPES.length,
    compressibleTypesCount: COMPRESSION_DEFAULTS.CONTENT_TYPES.length,
    environment: config.nodeEnv
});

// Export all functions and constants
module.exports = compressionConfig; // Default export
module.exports.createCompressionOptions = createCompressionOptions;
module.exports.shouldCompress = shouldCompress;
module.exports.compressionMetrics = compressionMetrics;
module.exports.COMPRESSION_DEFAULTS = COMPRESSION_DEFAULTS;