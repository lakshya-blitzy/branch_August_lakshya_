/**
 * @fileoverview Comprehensive Performance Benchmarking Suite for Node.js Tutorial Project
 * @description Central orchestrator for performance testing, analysis, and validation providing
 * enterprise-grade benchmarking capabilities for Express.js v5.1.0, PM2 cluster mode validation,
 * cross-platform performance comparison, and production deployment optimization.
 * 
 * Implements comprehensive performance testing including:
 * - Response time analysis with nanosecond precision
 * - Concurrent request testing and load balancing validation
 * - Memory usage profiling and leak detection
 * - PM2 cluster mode performance validation (x10 scaling target)
 * - Helmet.js security overhead analysis (15 sub-middlewares)
 * - Cross-platform Node.js vs Flask performance comparison
 * - Statistical analysis and regression detection
 * - Automated performance reporting and optimization recommendations
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Educational Value:
 * - Demonstrates professional performance testing methodologies
 * - Showcases statistical analysis and benchmarking best practices
 * - Provides comprehensive PM2 cluster mode validation
 * - Illustrates security middleware performance impact analysis
 * - Teaches performance optimization and regression detection
 * - Shows enterprise-grade monitoring and alerting patterns
 * 
 * Production Features:
 * - Enterprise-grade performance validation and compliance checking
 * - Comprehensive statistical analysis with percentile distributions
 * - Automated performance regression detection and alerting
 * - Production deployment performance validation workflows
 * - Cross-platform performance parity validation for educational purposes
 * - Memory leak detection and optimization recommendation generation
 */

// Node.js built-in module imports for high-precision timing and system monitoring
import process from 'node:process'; // Built-in - Process monitoring, high-resolution timing, memory tracking
import { EventEmitter } from 'node:events'; // Built-in - Event-driven benchmark orchestration and progress tracking
import fs from 'node:fs/promises'; // Built-in - Benchmark report persistence and result archival
import os from 'node:os'; // Built-in - System resource baseline and CPU core detection for scaling analysis
import path from 'node:path'; // Built-in - Benchmark report file management and directory organization

// Internal performance testing module imports
import {
  measureSingleRequestTime,
  measureMultipleRequests,
  measureConcurrentResponseTimes
} from './response-time.js';

import {
  runConcurrentBenchmark,
  validateLoadBalancing,
  runStressTest
} from './concurrent-requests.js';

import {
  MemoryUsageAnalyzer,
  measureSecurityMiddlewareMemoryImpact
} from './memory-usage.js';

import {
  runLoadTest
} from './load-test.js';

// Application infrastructure imports
import createApp, { createProductionApp } from '../app.js';
import logger, { logPerformanceMetrics } from '../utils/logger.js';
import { PERFORMANCE_CONSTANTS } from '../utils/constants.js';
import { collectSystemMetrics } from '../monitoring/metrics.js';

// Global performance suite configuration and state management
const PERFORMANCE_SUITE_VERSION = '1.0.0';
const BENCHMARK_CACHE = new Map(); // Cache for performance results across test runs
const ACTIVE_TESTS = new Set(); // Track currently executing performance tests
const SUITE_METRICS = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  executionTime: 0,
  memoryUsage: 0
};

// Default performance testing configuration with comprehensive parameter coverage
const defaultSuiteConfig = {
  iterations: 1000,
  concurrency: [10, 50, 100],
  endpoints: ['/hello', '/good-evening', '/health'],
  enableMemoryProfiling: true,
  enableStressTesting: true,
  generateReports: true,
  outputDirectory: './benchmarks/results'
};

/**
 * Orchestrates execution of complete performance benchmark suite including response time analysis,
 * concurrent request testing, memory profiling, load testing, and cross-platform comparison
 * with comprehensive result aggregation and reporting.
 * 
 * @param {Object} suiteConfig - Performance suite configuration
 * @param {number} [suiteConfig.iterations=1000] - Number of test iterations per benchmark
 * @param {Array<number>} [suiteConfig.concurrency=[10,50,100]] - Concurrency levels for testing
 * @param {Array<string>} [suiteConfig.endpoints] - API endpoints to benchmark
 * @param {boolean} [suiteConfig.enableMemoryProfiling=true] - Enable memory usage analysis
 * @param {boolean} [suiteConfig.enableStressTesting=true] - Enable stress testing scenarios
 * @param {boolean} [suiteConfig.generateReports=true] - Generate comprehensive reports
 * @param {string} [suiteConfig.outputDirectory] - Output directory for benchmark results
 * @returns {Promise<Object>} Comprehensive benchmark results with performance analysis,
 *   statistical summary, optimization recommendations, and detailed reporting
 */
export async function runComprehensiveBenchmark(suiteConfig = {}) {
  const config = { ...defaultSuiteConfig, ...suiteConfig };
  const benchmarkId = `bench-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Starting comprehensive performance benchmark suite', {
    benchmarkId,
    config,
    version: PERFORMANCE_SUITE_VERSION,
    systemInfo: {
      nodeVersion: process.version,
      platform: os.platform(),
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    }
  });

  try {
    // Validate performance suite configuration and initialize benchmark environment
    validateSuiteConfiguration(config);
    
    // Set up comprehensive logging and metrics collection for the entire benchmark suite
    const suiteLogger = logger.child({ benchmarkId, component: 'performance-suite' });
    const metricsCollector = await initializeMetricsCollection(benchmarkId);
    
    // Initialize Express.js application instances for testing with production and development configurations
    const testEnvironment = await setupBenchmarkEnvironment({
      enableProductionMode: true,
      enableSecurityMiddleware: true,
      enableMonitoring: true
    });

    const benchmarkResults = {
      metadata: {
        benchmarkId,
        timestamp: new Date().toISOString(),
        duration: 0,
        config,
        systemBaseline: await collectSystemMetrics(),
        nodeVersion: process.version,
        performanceSuiteVersion: PERFORMANCE_SUITE_VERSION
      },
      responseTimeAnalysis: null,
      concurrencyAnalysis: null,
      memoryAnalysis: null,
      loadTestingResults: null,
      crossPlatformComparison: null,
      performanceValidation: null,
      optimizationRecommendations: [],
      statisticalSummary: null
    };

    const startTime = process.hrtime.bigint();
    ACTIVE_TESTS.add(benchmarkId);

    try {
      // Execute baseline performance measurement to establish reference metrics
      suiteLogger.info('Establishing baseline performance metrics');
      const baselineMetrics = await establishBaselineMetrics(testEnvironment, config);
      benchmarkResults.metadata.baseline = baselineMetrics;

      // Run response time benchmarks using measureSingleRequestTime and measureMultipleRequests functions
      suiteLogger.info('Executing response time benchmark analysis');
      benchmarkResults.responseTimeAnalysis = await runResponseTimeBenchmarks(
        config.endpoints,
        {
          iterations: config.iterations,
          includeStatisticalAnalysis: true,
          enableRegressionDetection: true,
          testEnvironment
        }
      );

      // Execute concurrent request testing using runConcurrentBenchmark with various concurrency levels
      suiteLogger.info('Executing concurrent request and load balancing analysis');
      benchmarkResults.concurrencyAnalysis = await runConcurrencyBenchmarks(
        config.concurrency,
        {
          endpoints: config.endpoints,
          enableLoadBalancingValidation: true,
          enableStressTesting: config.enableStressTesting,
          testEnvironment
        }
      );

      // Perform memory usage analysis using MemoryUsageAnalyzer for leak detection and optimization
      if (config.enableMemoryProfiling) {
        suiteLogger.info('Executing comprehensive memory usage analysis');
        benchmarkResults.memoryAnalysis = await runMemoryBenchmarks({
          endpoints: config.endpoints,
          concurrencyLevels: config.concurrency,
          enableLeakDetection: true,
          enableSecurityOverheadAnalysis: true,
          testEnvironment
        });
      }

      // Run load testing scenarios with sustained traffic patterns and scaling validation
      suiteLogger.info('Executing load testing and sustainability analysis');
      benchmarkResults.loadTestingResults = await runLoadTestBenchmarks({
        testDurations: [30, 60, 120], // seconds
        sustainedLoad: [50, 100, 200], // requests per second
        endpoints: config.endpoints,
        testEnvironment
      });

      // Execute PM2 cluster mode validation using validateLoadBalancing for horizontal scaling assessment
      suiteLogger.info('Validating PM2 cluster mode performance and scaling');
      benchmarkResults.pm2ClusterValidation = await validatePM2ClusterPerformance({
        targetScalingFactor: 10, // x10 performance increase target
        coreCount: os.cpus().length,
        testEnvironment
      });

      // Perform stress testing using runStressTest to identify system breaking points
      if (config.enableStressTesting) {
        suiteLogger.info('Executing stress testing and breaking point analysis');
        benchmarkResults.stressTestResults = await executeStressTestingSuite({
          maxConcurrency: 500,
          rampUpDuration: 60, // seconds
          sustainDuration: 120, // seconds
          testEnvironment
        });
      }

      // Analyze security middleware performance impact using measureSecurityMiddlewareMemoryImpact
      suiteLogger.info('Analyzing Helmet.js security middleware performance impact');
      benchmarkResults.securityOverheadAnalysis = await analyzeSecurityMiddlewareOverhead({
        enableHelmetAnalysis: true,
        testWith15Middlewares: true,
        testEnvironment
      });

      // Run cross-platform performance comparison for educational feature parity validation
      if (config.enableCrossPlatformComparison) {
        suiteLogger.info('Executing cross-platform Node.js vs Flask performance comparison');
        benchmarkResults.crossPlatformComparison = await runCrossPlatformComparison({
          nodejsEndpoints: config.endpoints,
          flaskEndpoints: config.endpoints,
          comparisonMetrics: ['responseTime', 'throughput', 'memoryUsage'],
          validateFeatureParity: true
        });
      }

      // Aggregate all benchmark results and perform comprehensive statistical analysis
      suiteLogger.info('Aggregating results and performing statistical analysis');
      benchmarkResults.statisticalSummary = await generateStatisticalSummary(benchmarkResults);

      // Generate comprehensive performance report with optimization recommendations
      if (config.generateReports) {
        suiteLogger.info('Generating comprehensive performance reports');
        benchmarkResults.reports = await generateBenchmarkReport(benchmarkResults, {
          outputDirectory: config.outputDirectory,
          generateVisualizations: true,
          includeOptimizationRecommendations: true,
          exportFormats: ['json', 'html', 'csv']
        });
      }

      // Validate performance against targets and thresholds
      suiteLogger.info('Validating performance against defined targets and SLAs');
      benchmarkResults.performanceValidation = await validatePerformanceTargets(
        benchmarkResults,
        PERFORMANCE_CONSTANTS
      );

      // Generate optimization recommendations based on analysis results
      benchmarkResults.optimizationRecommendations = await generateOptimizationRecommendations(
        benchmarkResults
      );

      const endTime = process.hrtime.bigint();
      benchmarkResults.metadata.duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      // Log comprehensive benchmark completion with summary metrics
      logPerformanceMetrics({
        type: 'comprehensive-benchmark-completion',
        benchmarkId,
        duration: benchmarkResults.metadata.duration,
        totalTests: SUITE_METRICS.totalTests,
        passedTests: SUITE_METRICS.passedTests,
        failedTests: SUITE_METRICS.failedTests,
        performanceScore: calculateOverallPerformanceScore(benchmarkResults)
      });

      suiteLogger.info('Comprehensive performance benchmark suite completed successfully', {
        benchmarkId,
        duration: benchmarkResults.metadata.duration,
        performanceScore: calculateOverallPerformanceScore(benchmarkResults),
        optimizationRecommendations: benchmarkResults.optimizationRecommendations.length
      });

      return benchmarkResults;

    } finally {
      // Clean up test environment and finalize benchmark execution
      ACTIVE_TESTS.delete(benchmarkId);
      await cleanupBenchmarkEnvironment(testEnvironment, {
        preserveLogs: true,
        generateCleanupReport: true
      });
    }

  } catch (error) {
    logger.error('Comprehensive performance benchmark failed', error, {
      benchmarkId,
      config,
      activeTests: Array.from(ACTIVE_TESTS)
    });

    // Generate failure report for debugging and analysis
    const failureReport = {
      benchmarkId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      config,
      systemInfo: {
        nodeVersion: process.version,
        platform: os.platform(),
        memoryUsage: process.memoryUsage()
      }
    };

    // Write failure report to file for analysis
    if (config.outputDirectory) {
      await ensureDirectoryExists(config.outputDirectory);
      await fs.writeFile(
        path.join(config.outputDirectory, `benchmark-failure-${benchmarkId}.json`),
        JSON.stringify(failureReport, null, 2)
      );
    }

    throw error;
  }
}

/**
 * Executes comprehensive response time testing including single request precision measurement,
 * statistical distribution analysis, concurrent response time validation, and percentile
 * calculations with performance threshold validation.
 * 
 * @param {Array<string>} endpoints - API endpoints to benchmark
 * @param {Object} responseTimeConfig - Response time testing configuration
 * @param {number} [responseTimeConfig.iterations=1000] - Number of test iterations
 * @param {boolean} [responseTimeConfig.includeStatisticalAnalysis=true] - Enable statistical analysis
 * @param {boolean} [responseTimeConfig.enableRegressionDetection=true] - Enable regression detection
 * @param {Object} responseTimeConfig.testEnvironment - Test environment configuration
 * @returns {Promise<Object>} Response time benchmark results with statistical analysis,
 *   percentile distributions, and performance validation status
 */
export async function runResponseTimeBenchmarks(endpoints, responseTimeConfig = {}) {
  const config = {
    iterations: 1000,
    includeStatisticalAnalysis: true,
    enableRegressionDetection: true,
    warmupIterations: 100,
    cooldownPeriod: 1000, // milliseconds
    ...responseTimeConfig
  };

  logger.info('Starting response time benchmark execution', {
    endpoints,
    config: config,
    targets: PERFORMANCE_CONSTANTS.RESPONSE_TIME_TARGETS
  });

  const responseTimeResults = {
    timestamp: new Date().toISOString(),
    configuration: config,
    endpoints: {},
    aggregatedMetrics: null,
    statisticalAnalysis: null,
    performanceValidation: null,
    regressionAnalysis: null
  };

  try {
    // Initialize response time benchmark configuration with endpoint validation
    for (const endpoint of endpoints) {
      logger.debug(`Benchmarking response times for endpoint: ${endpoint}`);
      
      const endpointResults = {
        endpoint,
        singleRequestMetrics: null,
        multipleRequestMetrics: null,
        concurrentRequestMetrics: null,
        percentileDistribution: null,
        performanceScore: 0
      };

      // Execute single request measurements for baseline establishment using measureSingleRequestTime
      const singleRequestResults = await measureSingleRequestTime(endpoint, {
        iterations: config.warmupIterations,
        includeSystemMetrics: true,
        enableHighPrecisionTiming: true,
        testEnvironment: config.testEnvironment
      });

      endpointResults.singleRequestMetrics = {
        ...singleRequestResults,
        averageResponseTime: singleRequestResults.measurements.reduce((a, b) => a + b) / singleRequestResults.measurements.length,
        minResponseTime: Math.min(...singleRequestResults.measurements),
        maxResponseTime: Math.max(...singleRequestResults.measurements),
        standardDeviation: calculateStandardDeviation(singleRequestResults.measurements)
      };

      // Perform multiple sequential request analysis using measureMultipleRequests for statistical distribution
      const multipleRequestResults = await measureMultipleRequests(endpoint, {
        requestCount: config.iterations,
        enableStatisticalAnalysis: true,
        includePercentileCalculations: true,
        testEnvironment: config.testEnvironment
      });

      endpointResults.multipleRequestMetrics = {
        ...multipleRequestResults,
        percentiles: calculatePercentiles(multipleRequestResults.measurements, [50, 90, 95, 99, 99.9]),
        distribution: analyzeDistribution(multipleRequestResults.measurements),
        outliers: detectOutliers(multipleRequestResults.measurements)
      };

      // Run concurrent response time testing using measureConcurrentResponseTimes for load analysis
      const concurrentRequestResults = await measureConcurrentResponseTimes(endpoint, {
        concurrencyLevels: [10, 50, 100],
        requestsPerLevel: Math.floor(config.iterations / 3),
        enableLoadBalancingAnalysis: true,
        testEnvironment: config.testEnvironment
      });

      endpointResults.concurrentRequestMetrics = concurrentRequestResults;

      // Calculate comprehensive statistics including mean, median, percentiles, and standard deviation
      endpointResults.percentileDistribution = calculateComprehensivePercentiles(
        multipleRequestResults.measurements
      );

      // Validate response times against PERFORMANCE_CONSTANTS.RESPONSE_TIME_TARGETS
      endpointResults.performanceValidation = validateResponseTimeTargets(
        endpointResults,
        PERFORMANCE_CONSTANTS.RESPONSE_TIME_TARGETS
      );

      // Calculate performance score for this endpoint
      endpointResults.performanceScore = calculateEndpointPerformanceScore(endpointResults);

      responseTimeResults.endpoints[endpoint] = endpointResults;
      
      // Add cooldown period between endpoint tests
      await new Promise(resolve => setTimeout(resolve, config.cooldownPeriod));
    }

    // Aggregate metrics across all endpoints
    responseTimeResults.aggregatedMetrics = aggregateEndpointMetrics(responseTimeResults.endpoints);

    // Perform comprehensive statistical analysis
    if (config.includeStatisticalAnalysis) {
      responseTimeResults.statisticalAnalysis = performStatisticalAnalysis(
        responseTimeResults.endpoints
      );
    }

    // Detect performance regressions if enabled
    if (config.enableRegressionDetection) {
      responseTimeResults.regressionAnalysis = await detectPerformanceRegressions(
        responseTimeResults,
        await loadHistoricalBenchmarkData('response-time')
      );
    }

    // Validate overall response time performance
    responseTimeResults.performanceValidation = validateOverallResponseTimePerformance(
      responseTimeResults,
      PERFORMANCE_CONSTANTS.RESPONSE_TIME_TARGETS
    );

    // Generate response time trend analysis and regression detection
    responseTimeResults.trendAnalysis = analyzeTrends(responseTimeResults);

    logger.info('Response time benchmarks completed successfully', {
      endpointCount: endpoints.length,
      totalMeasurements: config.iterations * endpoints.length,
      averageResponseTime: responseTimeResults.aggregatedMetrics.averageResponseTime,
      performanceScore: responseTimeResults.aggregatedMetrics.performanceScore
    });

    return responseTimeResults;

  } catch (error) {
    logger.error('Response time benchmark execution failed', error, {
      endpoints,
      config,
      completedEndpoints: Object.keys(responseTimeResults.endpoints)
    });
    throw error;
  }
}

/**
 * Executes comprehensive concurrent request testing including load balancing validation,
 * stress testing, throughput analysis, and PM2 cluster mode performance validation
 * with horizontal scaling effectiveness assessment.
 * 
 * @param {Array<number>} concurrencyLevels - Concurrency levels to test
 * @param {Object} concurrencyConfig - Concurrency testing configuration
 * @param {Array<string>} [concurrencyConfig.endpoints] - Endpoints to test
 * @param {boolean} [concurrencyConfig.enableLoadBalancingValidation=true] - Enable load balancing tests
 * @param {boolean} [concurrencyConfig.enableStressTesting=true] - Enable stress testing
 * @param {Object} concurrencyConfig.testEnvironment - Test environment configuration
 * @returns {Promise<Object>} Concurrency benchmark results with load balancing analysis,
 *   throughput metrics, and scaling effectiveness validation
 */
export async function runConcurrencyBenchmarks(concurrencyLevels, concurrencyConfig = {}) {
  const config = {
    endpoints: ['/hello', '/good-evening', '/health'],
    enableLoadBalancingValidation: true,
    enableStressTesting: true,
    requestsPerLevel: 1000,
    rampUpDuration: 10, // seconds
    sustainDuration: 30, // seconds
    ...concurrencyConfig
  };

  logger.info('Starting concurrency benchmark execution', {
    concurrencyLevels,
    config,
    targets: PERFORMANCE_CONSTANTS.THROUGHPUT_TARGETS
  });

  const concurrencyResults = {
    timestamp: new Date().toISOString(),
    configuration: config,
    concurrencyAnalysis: {},
    loadBalancingValidation: null,
    stressTestResults: null,
    throughputAnalysis: null,
    scalingEffectiveness: null,
    performanceValidation: null
  };

  try {
    // Initialize concurrency benchmark with progressive load testing configuration
    for (const concurrencyLevel of concurrencyLevels) {
      logger.debug(`Testing concurrency level: ${concurrencyLevel}`);
      
      const levelResults = {
        concurrencyLevel,
        throughputMetrics: null,
        responseTimeMetrics: null,
        errorAnalysis: null,
        resourceUtilization: null,
        scalingEfficiency: null
      };

      // Execute concurrent request benchmarks using runConcurrentBenchmark for each concurrency level
      const concurrentBenchmarkResults = await runConcurrentBenchmark({
        concurrency: concurrencyLevel,
        totalRequests: config.requestsPerLevel,
        endpoints: config.endpoints,
        rampUpDuration: config.rampUpDuration,
        testEnvironment: config.testEnvironment
      });

      levelResults.throughputMetrics = {
        requestsPerSecond: concurrentBenchmarkResults.throughput,
        totalRequests: concurrentBenchmarkResults.totalRequests,
        successfulRequests: concurrentBenchmarkResults.successfulRequests,
        failedRequests: concurrentBenchmarkResults.failedRequests,
        averageResponseTime: concurrentBenchmarkResults.averageResponseTime,
        throughputEfficiency: calculateThroughputEfficiency(concurrentBenchmarkResults)
      };

      levelResults.responseTimeMetrics = {
        percentiles: concurrentBenchmarkResults.responseTimePercentiles,
        distribution: concurrentBenchmarkResults.responseTimeDistribution,
        consistency: calculateResponseTimeConsistency(concurrentBenchmarkResults.responseTimes)
      };

      // Analyze throughput performance and scaling characteristics across concurrency levels
      levelResults.scalingEfficiency = calculateScalingEfficiency(
        concurrencyLevel,
        levelResults.throughputMetrics,
        concurrencyResults.concurrencyAnalysis
      );

      // Measure resource utilization and bottleneck identification during concurrent load
      levelResults.resourceUtilization = await measureResourceUtilization(
        concurrencyLevel,
        config.testEnvironment
      );

      concurrencyResults.concurrencyAnalysis[concurrencyLevel] = levelResults;
    }

    // Validate PM2 cluster mode load balancing effectiveness using validateLoadBalancing
    if (config.enableLoadBalancingValidation) {
      logger.info('Validating PM2 load balancing effectiveness');
      concurrencyResults.loadBalancingValidation = await validateLoadBalancing({
        concurrencyLevels,
        endpoints: config.endpoints,
        validateDistribution: true,
        testEnvironment: config.testEnvironment
      });
    }

    // Perform stress testing using runStressTest to identify system breaking points
    if (config.enableStressTesting) {
      logger.info('Executing stress testing to identify breaking points');
      concurrencyResults.stressTestResults = await runStressTest({
        maxConcurrency: Math.max(...concurrencyLevels) * 2,
        rampUpDuration: config.rampUpDuration * 2,
        sustainDuration: config.sustainDuration,
        endpoints: config.endpoints,
        testEnvironment: config.testEnvironment
      });
    }

    // Calculate scaling efficiency and PM2 cluster mode performance improvements
    concurrencyResults.scalingEffectiveness = calculateOverallScalingEffectiveness(
      concurrencyResults.concurrencyAnalysis,
      os.cpus().length
    );

    // Validate throughput against PERFORMANCE_CONSTANTS.THROUGHPUT_TARGETS
    concurrencyResults.performanceValidation = validateThroughputTargets(
      concurrencyResults,
      PERFORMANCE_CONSTANTS.THROUGHPUT_TARGETS
    );

    // Generate comprehensive throughput analysis
    concurrencyResults.throughputAnalysis = generateThroughputAnalysis(
      concurrencyResults.concurrencyAnalysis
    );

    logger.info('Concurrency benchmarks completed successfully', {
      concurrencyLevels,
      maxThroughput: concurrencyResults.throughputAnalysis.maxThroughput,
      scalingEfficiency: concurrencyResults.scalingEffectiveness.overallEfficiency,
      loadBalancingEffective: concurrencyResults.loadBalancingValidation?.effective
    });

    return concurrencyResults;

  } catch (error) {
    logger.error('Concurrency benchmark execution failed', error, {
      concurrencyLevels,
      config,
      completedLevels: Object.keys(concurrencyResults.concurrencyAnalysis)
    });
    throw error;
  }
}

/**
 * Executes comprehensive memory usage analysis including memory leak detection,
 * security middleware overhead measurement, endpoint memory profiling, and PM2
 * cluster memory validation with optimization recommendations.
 * 
 * @param {Object} memoryConfig - Memory testing configuration
 * @param {Array<string>} [memoryConfig.endpoints] - Endpoints to profile
 * @param {Array<number>} [memoryConfig.concurrencyLevels] - Concurrency levels for testing
 * @param {boolean} [memoryConfig.enableLeakDetection=true] - Enable memory leak detection
 * @param {boolean} [memoryConfig.enableSecurityOverheadAnalysis=true] - Enable security overhead analysis
 * @param {Object} memoryConfig.testEnvironment - Test environment configuration
 * @returns {Promise<Object>} Memory benchmark results with usage analysis, leak detection,
 *   security overhead assessment, and optimization guidance
 */
export async function runMemoryBenchmarks(memoryConfig = {}) {
  const config = {
    endpoints: ['/hello', '/good-evening', '/health'],
    concurrencyLevels: [10, 50, 100],
    enableLeakDetection: true,
    enableSecurityOverheadAnalysis: true,
    monitoringDuration: 60000, // 60 seconds
    measurementInterval: 1000, // 1 second
    ...memoryConfig
  };

  logger.info('Starting memory usage benchmark execution', {
    config,
    targets: PERFORMANCE_CONSTANTS.MEMORY_LIMITS
  });

  const memoryResults = {
    timestamp: new Date().toISOString(),
    configuration: config,
    baselineMemory: null,
    endpointMemoryProfiles: {},
    memoryLeakAnalysis: null,
    securityMiddlewareOverhead: null,
    pm2ClusterMemoryAnalysis: null,
    optimizationRecommendations: [],
    performanceValidation: null
  };

  let memoryAnalyzer = null;

  try {
    // Initialize memory usage analyzer using MemoryUsageAnalyzer class for comprehensive monitoring
    memoryAnalyzer = new MemoryUsageAnalyzer({
      monitoringInterval: config.measurementInterval,
      enableDetailed: true,
      trackGarbageCollection: true,
      testEnvironment: config.testEnvironment
    });

    // Start memory monitoring using startMonitoring for baseline establishment
    await memoryAnalyzer.startMonitoring();
    
    // Establish baseline memory usage
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second baseline
    memoryResults.baselineMemory = await memoryAnalyzer.analyzeMemoryUsage();

    logger.debug('Memory baseline established', memoryResults.baselineMemory);

    // Profile endpoint-specific memory consumption for optimization opportunities
    for (const endpoint of config.endpoints) {
      logger.debug(`Profiling memory usage for endpoint: ${endpoint}`);
      
      const endpointProfile = {
        endpoint,
        memoryUsagePattern: null,
        peakMemoryUsage: null,
        memoryEfficiency: null,
        leakIndicators: null
      };

      // Reset memory analyzer for clean endpoint profiling
      await memoryAnalyzer.resetTracking();
      
      // Execute requests to measure memory impact
      await executeEndpointMemoryProfiling(endpoint, {
        requestCount: 100,
        concurrency: 10,
        testEnvironment: config.testEnvironment
      });

      // Analyze overall memory usage patterns using analyzeMemoryUsage function
      endpointProfile.memoryUsagePattern = await memoryAnalyzer.analyzeMemoryUsage();
      endpointProfile.peakMemoryUsage = memoryAnalyzer.getPeakUsage();
      endpointProfile.memoryEfficiency = calculateMemoryEfficiency(
        endpointProfile.memoryUsagePattern,
        memoryResults.baselineMemory
      );

      memoryResults.endpointMemoryProfiles[endpoint] = endpointProfile;
    }

    // Perform memory leak detection using detectMemoryLeaks with statistical analysis
    if (config.enableLeakDetection) {
      logger.info('Executing memory leak detection analysis');
      memoryResults.memoryLeakAnalysis = await memoryAnalyzer.detectMemoryLeaks({
        testDuration: config.monitoringDuration,
        loadPattern: 'sustained',
        endpoints: config.endpoints,
        testEnvironment: config.testEnvironment
      });
    }

    // Measure security middleware memory impact using measureSecurityMiddlewareMemoryImpact
    if (config.enableSecurityOverheadAnalysis) {
      logger.info('Analyzing Helmet.js security middleware memory overhead');
      memoryResults.securityMiddlewareOverhead = await measureSecurityMiddlewareMemoryImpact({
        testWith15Middlewares: true,
        enableDetailedAnalysis: true,
        testEnvironment: config.testEnvironment
      });
    }

    // Monitor PM2 cluster memory distribution and process isolation effectiveness
    logger.info('Analyzing PM2 cluster memory distribution');
    memoryResults.pm2ClusterMemoryAnalysis = await analyzePM2ClusterMemory({
      processCount: os.cpus().length,
      loadTestDuration: 30000, // 30 seconds
      testEnvironment: config.testEnvironment
    });

    // Validate memory usage against PERFORMANCE_CONSTANTS.MEMORY_LIMITS
    memoryResults.performanceValidation = validateMemoryTargets(
      memoryResults,
      PERFORMANCE_CONSTANTS.MEMORY_LIMITS
    );

    // Generate memory optimization recommendations based on analysis results
    memoryResults.optimizationRecommendations = generateMemoryOptimizationRecommendations(
      memoryResults
    );

    logger.info('Memory benchmarks completed successfully', {
      baselineMemory: memoryResults.baselineMemory.heapUsed,
      peakMemory: Math.max(...Object.values(memoryResults.endpointMemoryProfiles)
        .map(profile => profile.peakMemoryUsage?.heapUsed || 0)),
      memoryLeaksDetected: memoryResults.memoryLeakAnalysis?.leaksDetected || false,
      optimizationRecommendations: memoryResults.optimizationRecommendations.length
    });

    return memoryResults;

  } catch (error) {
    logger.error('Memory benchmark execution failed', error, {
      config,
      completedEndpoints: Object.keys(memoryResults.endpointMemoryProfiles)
    });
    throw error;
  } finally {
    // Stop memory monitoring using stopMonitoring and collect final metrics
    if (memoryAnalyzer) {
      await memoryAnalyzer.stopMonitoring();
      const finalMetrics = await memoryAnalyzer.analyzeMemoryUsage();
      logger.debug('Final memory metrics collected', finalMetrics);
    }
  }
}

/**
 * Executes sustained load testing scenarios with various traffic patterns, duration testing,
 * performance degradation analysis, and system stability validation under extended load conditions.
 * 
 * @param {Object} loadTestConfig - Load testing configuration
 * @param {Array<number>} [loadTestConfig.testDurations] - Test durations in seconds
 * @param {Array<number>} [loadTestConfig.sustainedLoad] - Sustained load levels (req/sec)
 * @param {Array<string>} [loadTestConfig.endpoints] - Endpoints to test
 * @param {Object} loadTestConfig.testEnvironment - Test environment configuration
 * @returns {Promise<Object>} Load testing results with sustainability analysis,
 *   performance degradation assessment, and stability validation
 */
export async function runLoadTestBenchmarks(loadTestConfig = {}) {
  const config = {
    testDurations: [30, 60, 120], // seconds
    sustainedLoad: [50, 100, 200], // requests per second
    endpoints: ['/hello', '/good-evening', '/health'],
    rampUpDuration: 10, // seconds
    cooldownDuration: 5, // seconds
    ...loadTestConfig
  };

  logger.info('Starting load testing benchmark execution', {
    config,
    totalTests: config.testDurations.length * config.sustainedLoad.length
  });

  const loadTestResults = {
    timestamp: new Date().toISOString(),
    configuration: config,
    testScenarios: {},
    performanceDegradation: null,
    systemStability: null,
    sustainabilityAnalysis: null,
    performanceValidation: null
  };

  try {
    // Initialize load testing configuration with traffic pattern validation
    for (const duration of config.testDurations) {
      for (const loadLevel of config.sustainedLoad) {
        const scenarioKey = `${duration}s-${loadLevel}rps`;
        logger.debug(`Executing load test scenario: ${scenarioKey}`);
        
        const scenarioResults = {
          duration,
          targetLoad: loadLevel,
          actualLoad: null,
          performanceMetrics: null,
          stabilityMetrics: null,
          degradationAnalysis: null
        };

        // Execute sustained load tests using runLoadTest with various duration scenarios
        const loadTestResult = await runLoadTest({
          duration: duration * 1000, // Convert to milliseconds
          requestsPerSecond: loadLevel,
          endpoints: config.endpoints,
          rampUpDuration: config.rampUpDuration * 1000,
          enableStabilityMonitoring: true,
          testEnvironment: config.testEnvironment
        });

        scenarioResults.actualLoad = loadTestResult.actualThroughput;
        scenarioResults.performanceMetrics = {
          averageResponseTime: loadTestResult.averageResponseTime,
          responseTimePercentiles: loadTestResult.responseTimePercentiles,
          throughput: loadTestResult.throughput,
          errorRate: loadTestResult.errorRate,
          successRate: loadTestResult.successRate
        };

        // Monitor system performance degradation over extended load periods
        scenarioResults.degradationAnalysis = analyzeDegradationPattern(
          loadTestResult.timeSeriesData
        );

        // Validate system stability and error rate analysis under continuous load
        scenarioResults.stabilityMetrics = analyzeSystemStability(
          loadTestResult.stabilityData
        );

        // Assess system recovery capabilities after load testing completion
        const recoveryAnalysis = await assessSystemRecovery({
          testEnvironment: config.testEnvironment,
          cooldownDuration: config.cooldownDuration * 1000
        });

        scenarioResults.recoveryMetrics = recoveryAnalysis;

        loadTestResults.testScenarios[scenarioKey] = scenarioResults;

        // Cooldown between test scenarios
        await new Promise(resolve => setTimeout(resolve, config.cooldownDuration * 1000));
      }
    }

    // Analyze performance degradation trends across all scenarios
    loadTestResults.performanceDegradation = analyzeOverallDegradation(
      loadTestResults.testScenarios
    );

    // Evaluate system stability across different load levels and durations
    loadTestResults.systemStability = evaluateSystemStability(
      loadTestResults.testScenarios
    );

    // Generate sustainability analysis based on extended testing
    loadTestResults.sustainabilityAnalysis = generateSustainabilityAnalysis(
      loadTestResults.testScenarios
    );

    // Validate load testing performance against targets
    loadTestResults.performanceValidation = validateLoadTestPerformance(
      loadTestResults,
      PERFORMANCE_CONSTANTS
    );

    logger.info('Load testing benchmarks completed successfully', {
      scenariosExecuted: Object.keys(loadTestResults.testScenarios).length,
      maxSustainedLoad: Math.max(...config.sustainedLoad),
      longestDuration: Math.max(...config.testDurations),
      overallStability: loadTestResults.systemStability.overallScore
    });

    return loadTestResults;

  } catch (error) {
    logger.error('Load testing benchmark execution failed', error, {
      config,
      completedScenarios: Object.keys(loadTestResults.testScenarios)
    });
    throw error;
  }
}

/**
 * Executes comprehensive performance comparison between Node.js Express and Flask implementations
 * for educational feature parity validation and technology stack performance analysis.
 * 
 * @param {Object} comparisonConfig - Cross-platform comparison configuration
 * @param {Array<string>} [comparisonConfig.nodejsEndpoints] - Node.js endpoints to test
 * @param {Array<string>} [comparisonConfig.flaskEndpoints] - Flask endpoints to test
 * @param {Array<string>} [comparisonConfig.comparisonMetrics] - Metrics to compare
 * @param {boolean} [comparisonConfig.validateFeatureParity=true] - Validate feature parity
 * @returns {Promise<Object>} Cross-platform performance comparison with feature parity analysis
 *   and technology evaluation recommendations
 */
export async function runCrossPlatformComparison(comparisonConfig = {}) {
  const config = {
    nodejsEndpoints: ['/hello', '/good-evening', '/health'],
    flaskEndpoints: ['/hello', '/good-evening', '/health'],
    comparisonMetrics: ['responseTime', 'throughput', 'memoryUsage'],
    validateFeatureParity: true,
    testIterations: 1000,
    concurrencyLevels: [10, 50, 100],
    ...comparisonConfig
  };

  logger.info('Starting cross-platform performance comparison', {
    config,
    platformsCompared: ['Node.js Express', 'Flask']
  });

  const comparisonResults = {
    timestamp: new Date().toISOString(),
    configuration: config,
    nodejsResults: {},
    flaskResults: {},
    performanceComparison: null,
    featureParityValidation: null,
    technologyRecommendations: [],
    educationalInsights: []
  };

  try {
    // Initialize cross-platform comparison configuration with endpoint validation
    logger.debug('Validating endpoint parity between platforms');
    validateEndpointParity(config.nodejsEndpoints, config.flaskEndpoints);

    // Execute Node.js Express performance benchmarks for baseline establishment
    logger.info('Executing Node.js Express performance benchmarks');
    comparisonResults.nodejsResults = await executePlatformBenchmarks('nodejs', {
      endpoints: config.nodejsEndpoints,
      iterations: config.testIterations,
      concurrencyLevels: config.concurrencyLevels,
      metrics: config.comparisonMetrics,
      testEnvironment: config.testEnvironment
    });

    // Run equivalent Flask implementation performance tests for comparison
    logger.info('Executing Flask implementation performance benchmarks');
    comparisonResults.flaskResults = await executePlatformBenchmarks('flask', {
      endpoints: config.flaskEndpoints,
      iterations: config.testIterations,
      concurrencyLevels: config.concurrencyLevels,
      metrics: config.comparisonMetrics,
      flaskTestEnvironment: await setupFlaskTestEnvironment(config)
    });

    // Analyze response time differences between Node.js and Flask implementations
    comparisonResults.performanceComparison = comparePerformanceMetrics(
      comparisonResults.nodejsResults,
      comparisonResults.flaskResults,
      config.comparisonMetrics
    );

    // Validate feature parity and functionality equivalence between implementations
    if (config.validateFeatureParity) {
      logger.info('Validating feature parity between platforms');
      comparisonResults.featureParityValidation = await validateFeatureParity(
        config.nodejsEndpoints,
        config.flaskEndpoints,
        config.testEnvironment
      );
    }

    // Generate technology evaluation recommendations
    comparisonResults.technologyRecommendations = generateTechnologyRecommendations(
      comparisonResults.performanceComparison,
      comparisonResults.featureParityValidation
    );

    // Create educational insights about platform differences
    comparisonResults.educationalInsights = generateEducationalInsights(
      comparisonResults.performanceComparison,
      comparisonResults.nodejsResults,
      comparisonResults.flaskResults
    );

    logger.info('Cross-platform comparison completed successfully', {
      nodejsPerformanceScore: calculatePlatformScore(comparisonResults.nodejsResults),
      flaskPerformanceScore: calculatePlatformScore(comparisonResults.flaskResults),
      featureParityAchieved: comparisonResults.featureParityValidation?.parityAchieved,
      recommendationsGenerated: comparisonResults.technologyRecommendations.length
    });

    return comparisonResults;

  } catch (error) {
    logger.error('Cross-platform comparison execution failed', error, {
      config,
      nodejsCompleted: Object.keys(comparisonResults.nodejsResults).length > 0,
      flaskCompleted: Object.keys(comparisonResults.flaskResults).length > 0
    });
    throw error;
  }
}

/**
 * Creates comprehensive performance benchmark report with executive summary, detailed analysis,
 * statistical visualizations, optimization recommendations, and educational insights for
 * stakeholders and development teams.
 * 
 * @param {Object} benchmarkResults - Complete benchmark results data
 * @param {Object} reportOptions - Report generation options
 * @param {string} [reportOptions.outputDirectory] - Output directory for reports
 * @param {boolean} [reportOptions.generateVisualizations=true] - Generate visual charts
 * @param {boolean} [reportOptions.includeOptimizationRecommendations=true] - Include recommendations
 * @param {Array<string>} [reportOptions.exportFormats] - Export formats (json, html, csv, pdf)
 * @returns {Object} Comprehensive benchmark report with analysis, visualizations, recommendations,
 *   and export capabilities
 */
export async function generateBenchmarkReport(benchmarkResults, reportOptions = {}) {
  const options = {
    outputDirectory: './benchmarks/results',
    generateVisualizations: true,
    includeOptimizationRecommendations: true,
    exportFormats: ['json', 'html', 'csv'],
    includeExecutiveSummary: true,
    includeDetailedAnalysis: true,
    includeTechnicalMetrics: true,
    ...reportOptions
  };

  logger.info('Generating comprehensive benchmark report', {
    options,
    benchmarkId: benchmarkResults.metadata?.benchmarkId
  });

  const report = {
    metadata: {
      reportId: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      benchmarkId: benchmarkResults.metadata?.benchmarkId,
      performanceSuiteVersion: PERFORMANCE_SUITE_VERSION,
      reportOptions: options
    },
    executiveSummary: null,
    performanceOverview: null,
    detailedAnalysis: null,
    visualizations: null,
    optimizationRecommendations: null,
    educationalInsights: null,
    appendices: null,
    exportedFiles: []
  };

  try {
    // Ensure output directory exists
    await ensureDirectoryExists(options.outputDirectory);

    // Generate executive summary with key performance indicators and compliance status
    if (options.includeExecutiveSummary) {
      report.executiveSummary = generateExecutiveSummary(benchmarkResults);
    }

    // Create performance overview with aggregated metrics
    report.performanceOverview = generatePerformanceOverview(benchmarkResults);

    // Create detailed statistical analysis with distribution charts and trend data
    if (options.includeDetailedAnalysis) {
      report.detailedAnalysis = generateDetailedAnalysis(benchmarkResults);
    }

    // Generate visualization data for performance dashboards and charts
    if (options.generateVisualizations) {
      report.visualizations = generateVisualizationData(benchmarkResults);
    }

    // Add optimization recommendations with priority ranking and impact assessment
    if (options.includeOptimizationRecommendations) {
      report.optimizationRecommendations = benchmarkResults.optimizationRecommendations || [];
    }

    // Generate educational insights about Node.js performance optimization techniques
    report.educationalInsights = generateEducationalInsights(benchmarkResults);

    // Include cross-platform comparison analysis and technology evaluation
    if (benchmarkResults.crossPlatformComparison) {
      report.crossPlatformAnalysis = analyzeCrossPlatformResults(
        benchmarkResults.crossPlatformComparison
      );
    }

    // Create appendices with technical details and raw data
    report.appendices = {
      rawBenchmarkData: benchmarkResults,
      systemInformation: benchmarkResults.metadata?.systemBaseline,
      configurationDetails: benchmarkResults.metadata?.config,
      statisticalData: benchmarkResults.statisticalSummary
    };

    // Export report in multiple formats for distribution
    for (const format of options.exportFormats) {
      const exportedFile = await exportReportInFormat(report, format, options.outputDirectory);
      report.exportedFiles.push(exportedFile);
      logger.debug(`Report exported in ${format} format`, { filePath: exportedFile });
    }

    logger.info('Benchmark report generated successfully', {
      reportId: report.metadata.reportId,
      exportFormats: options.exportFormats,
      filesGenerated: report.exportedFiles.length,
      optimizationRecommendations: report.optimizationRecommendations?.length || 0
    });

    return report;

  } catch (error) {
    logger.error('Benchmark report generation failed', error, {
      reportId: report.metadata.reportId,
      options
    });
    throw error;
  }
}

/**
 * Validates all benchmark results against predefined performance targets and thresholds,
 * generating compliance reports, identifying violations, and providing performance
 * improvement recommendations with detailed analysis.
 * 
 * @param {Object} benchmarkResults - Complete benchmark results data
 * @param {Object} performanceTargets - Performance targets and thresholds from constants
 * @returns {Object} Performance validation results with compliance status, violations,
 *   improvement recommendations, and educational guidance
 */
export async function validatePerformanceTargets(benchmarkResults, performanceTargets) {
  logger.info('Starting performance target validation', {
    benchmarkId: benchmarkResults.metadata?.benchmarkId,
    targets: performanceTargets
  });

  const validation = {
    timestamp: new Date().toISOString(),
    benchmarkId: benchmarkResults.metadata?.benchmarkId,
    overallCompliance: null,
    categoryValidation: {},
    violations: [],
    recommendations: [],
    complianceScore: 0,
    educationalGuidance: []
  };

  try {
    // Load performance targets from PERFORMANCE_CONSTANTS for validation baseline
    const targets = {
      responseTime: performanceTargets.RESPONSE_TIME_TARGETS || { max: 100, target: 50 },
      throughput: performanceTargets.THROUGHPUT_TARGETS || { min: 1000 },
      memory: performanceTargets.MEMORY_LIMITS || { max: 104857600 }, // 100MB
      ...performanceTargets
    };

    // Validate response time measurements against configured targets and thresholds
    if (benchmarkResults.responseTimeAnalysis) {
      validation.categoryValidation.responseTime = validateResponseTimeCompliance(
        benchmarkResults.responseTimeAnalysis,
        targets.responseTime
      );
    }

    // Check throughput performance against minimum requirements and scaling expectations
    if (benchmarkResults.concurrencyAnalysis) {
      validation.categoryValidation.throughput = validateThroughputCompliance(
        benchmarkResults.concurrencyAnalysis,
        targets.throughput
      );
    }

    // Assess memory usage compliance with limits and optimization targets
    if (benchmarkResults.memoryAnalysis) {
      validation.categoryValidation.memory = validateMemoryCompliance(
        benchmarkResults.memoryAnalysis,
        targets.memory
      );
    }

    // Validate concurrency performance against PM2 cluster mode expectations
    if (benchmarkResults.pm2ClusterValidation) {
      validation.categoryValidation.pm2Cluster = validatePM2ClusterCompliance(
        benchmarkResults.pm2ClusterValidation,
        { scalingFactor: 10, minEfficiency: 0.7 }
      );
    }

    // Identify critical performance violations requiring immediate attention
    validation.violations = identifyPerformanceViolations(validation.categoryValidation);

    // Generate prioritized recommendations for performance improvement and optimization
    validation.recommendations = generatePerformanceRecommendations(
      validation.violations,
      benchmarkResults
    );

    // Calculate overall compliance score
    validation.complianceScore = calculateComplianceScore(validation.categoryValidation);

    // Determine overall compliance status
    validation.overallCompliance = {
      status: validation.complianceScore >= 80 ? 'compliant' : 'non-compliant',
      score: validation.complianceScore,
      criticalViolations: validation.violations.filter(v => v.severity === 'critical').length,
      totalViolations: validation.violations.length
    };

    // Include educational explanation of performance optimization techniques
    validation.educationalGuidance = generatePerformanceEducationalGuidance(
      validation.violations,
      benchmarkResults
    );

    logger.info('Performance target validation completed', {
      benchmarkId: benchmarkResults.metadata?.benchmarkId,
      complianceScore: validation.complianceScore,
      complianceStatus: validation.overallCompliance.status,
      violationsFound: validation.violations.length,
      recommendationsGenerated: validation.recommendations.length
    });

    return validation;

  } catch (error) {
    logger.error('Performance target validation failed', error, {
      benchmarkId: benchmarkResults.metadata?.benchmarkId
    });
    throw error;
  }
}

/**
 * Initializes and configures the complete performance benchmark environment including
 * server instances, monitoring systems, resource allocation, and test isolation for
 * optimal and consistent benchmark execution.
 * 
 * @param {Object} environmentConfig - Environment configuration options
 * @param {boolean} [environmentConfig.enableProductionMode=false] - Enable production configuration
 * @param {boolean} [environmentConfig.enableSecurityMiddleware=true] - Enable security middleware
 * @param {boolean} [environmentConfig.enableMonitoring=true] - Enable monitoring systems
 * @returns {Object} Benchmark environment setup results with server instances, monitoring handles,
 *   configuration validation, and test isolation
 */
export async function setupBenchmarkEnvironment(environmentConfig = {}) {
  const config = {
    enableProductionMode: false,
    enableSecurityMiddleware: true,
    enableMonitoring: true,
    serverPort: 0, // Random available port
    enablePM2Testing: false,
    isolateTests: true,
    ...environmentConfig
  };

  logger.info('Setting up benchmark environment', { config });

  const environment = {
    setupId: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    configuration: config,
    servers: {},
    monitoring: null,
    systemBaseline: null,
    cleanup: []
  };

  try {
    // Validate environment configuration and system prerequisites for benchmark execution
    await validateSystemPrerequisites();

    // Create Express.js application instances using createApp and createProductionApp
    if (config.enableProductionMode) {
      environment.servers.production = createProductionApp({
        enableSecurity: config.enableSecurityMiddleware,
        enableMonitoring: config.enableMonitoring
      });
      logger.debug('Production Express.js application created');
    } else {
      environment.servers.development = createApp({
        enableSecurity: config.enableSecurityMiddleware,
        enableMonitoring: config.enableMonitoring
      });
      logger.debug('Development Express.js application created');
    }

    // Initialize comprehensive monitoring systems using collectSystemMetrics
    if (config.enableMonitoring) {
      environment.monitoring = await initializeMonitoringSystems(environment.setupId);
      environment.cleanup.push(() => environment.monitoring.shutdown());
    }

    // Set up performance tracking and metrics collection infrastructure
    environment.systemBaseline = await collectSystemMetrics();
    logger.debug('System baseline metrics collected', environment.systemBaseline);

    // Configure test isolation and resource allocation for consistent benchmarking
    if (config.isolateTests) {
      await configureTestIsolation(environment);
    }

    // Initialize memory usage analyzer and monitoring systems
    environment.memoryAnalyzer = new MemoryUsageAnalyzer({
      monitoringInterval: 1000,
      enableDetailed: true
    });

    // Start server instances on available ports
    if (environment.servers.production) {
      const server = environment.servers.production.listen(config.serverPort);
      environment.servers.productionServer = server;
      environment.servers.productionPort = server.address().port;
      environment.cleanup.push(() => server.close());
    }

    if (environment.servers.development) {
      const server = environment.servers.development.listen(config.serverPort);
      environment.servers.developmentServer = server;
      environment.servers.developmentPort = server.address().port;
      environment.cleanup.push(() => server.close());
    }

    // Verify server health and readiness for benchmark execution
    await verifyServerHealth(environment);

    logger.info('Benchmark environment setup completed successfully', {
      setupId: environment.setupId,
      serversStarted: Object.keys(environment.servers).filter(k => k.endsWith('Server')).length,
      monitoringEnabled: !!environment.monitoring,
      baselineCollected: !!environment.systemBaseline
    });

    return environment;

  } catch (error) {
    logger.error('Benchmark environment setup failed', error, {
      setupId: environment.setupId,
      config
    });

    // Cleanup any partially created resources
    await cleanupBenchmarkEnvironment(environment, { force: true });
    throw error;
  }
}

/**
 * Safely tears down the performance benchmark environment including server shutdown,
 * data persistence, resource cleanup, and final metric collection after benchmark
 * completion with comprehensive cleanup validation.
 * 
 * @param {Object} environmentHandles - Environment handles from setup
 * @param {Object} cleanupOptions - Cleanup configuration options
 * @param {boolean} [cleanupOptions.preserveLogs=true] - Preserve log files
 * @param {boolean} [cleanupOptions.generateCleanupReport=false] - Generate cleanup report
 * @param {boolean} [cleanupOptions.force=false] - Force cleanup even on errors
 * @returns {Promise<void>} Cleanup completion confirmation with resource release status
 *   and final data persistence
 */
export async function cleanupBenchmarkEnvironment(environmentHandles, cleanupOptions = {}) {
  const options = {
    preserveLogs: true,
    generateCleanupReport: false,
    force: false,
    ...cleanupOptions
  };

  const setupId = environmentHandles.setupId || 'unknown';
  logger.info('Starting benchmark environment cleanup', { setupId, options });

  const cleanupResults = {
    setupId,
    timestamp: new Date().toISOString(),
    resourcesCleaned: [],
    errors: [],
    finalMetrics: null
  };

  try {
    // Stop all active benchmark tests and HTTP request generators
    if (ACTIVE_TESTS.size > 0) {
      logger.debug('Stopping active benchmark tests', { 
        activeTests: Array.from(ACTIVE_TESTS) 
      });
      ACTIVE_TESTS.clear();
    }

    // Gracefully shutdown Express.js server instances and monitoring systems
    if (environmentHandles.cleanup) {
      for (const cleanupFn of environmentHandles.cleanup) {
        try {
          await cleanupFn();
          cleanupResults.resourcesCleaned.push('cleanup-function');
        } catch (error) {
          cleanupResults.errors.push(`Cleanup function error: ${error.message}`);
          if (!options.force) throw error;
        }
      }
    }

    // Stop memory monitoring if active
    if (environmentHandles.memoryAnalyzer) {
      try {
        await environmentHandles.memoryAnalyzer.stopMonitoring();
        cleanupResults.resourcesCleaned.push('memory-analyzer');
      } catch (error) {
        cleanupResults.errors.push(`Memory analyzer cleanup error: ${error.message}`);
        if (!options.force) throw error;
      }
    }

    // Collect final system metrics and performance data for archival
    try {
      cleanupResults.finalMetrics = await collectSystemMetrics();
      cleanupResults.resourcesCleaned.push('final-metrics');
    } catch (error) {
      cleanupResults.errors.push(`Final metrics collection error: ${error.message}`);
      if (!options.force) throw error;
    }

    // Clear benchmark cache if requested
    if (!options.preserveLogs) {
      BENCHMARK_CACHE.clear();
      cleanupResults.resourcesCleaned.push('benchmark-cache');
    }

    // Generate cleanup report if requested
    if (options.generateCleanupReport) {
      try {
        await generateCleanupReport(cleanupResults, environmentHandles);
        cleanupResults.resourcesCleaned.push('cleanup-report');
      } catch (error) {
        cleanupResults.errors.push(`Cleanup report generation error: ${error.message}`);
        if (!options.force) throw error;
      }
    }

    logger.info('Benchmark environment cleanup completed successfully', {
      setupId,
      resourcesCleaned: cleanupResults.resourcesCleaned.length,
      errors: cleanupResults.errors.length,
      finalMetrics: !!cleanupResults.finalMetrics
    });

  } catch (error) {
    logger.error('Benchmark environment cleanup failed', error, {
      setupId,
      options,
      partialCleanup: cleanupResults.resourcesCleaned
    });

    if (!options.force) {
      throw error;
    }
  }

  return cleanupResults;
}

/**
 * Schedules and manages automated execution of performance benchmark suites with
 * configurable timing, regression testing, continuous monitoring, and alert generation
 * for production performance oversight.
 * 
 * @param {Object} scheduleConfig - Scheduler configuration
 * @param {string} [scheduleConfig.interval='daily'] - Execution interval
 * @param {Array<string>} [scheduleConfig.benchmarkTypes] - Types of benchmarks to run
 * @param {boolean} [scheduleConfig.enableRegression=true] - Enable regression detection
 * @param {boolean} [scheduleConfig.enableAlerting=true] - Enable performance alerting
 * @returns {Object} Benchmark scheduler with execution timing, monitoring capabilities,
 *   and automated alerting
 */
export async function scheduleBenchmarkSuite(scheduleConfig = {}) {
  const config = {
    interval: 'daily',
    benchmarkTypes: ['response-time', 'memory', 'concurrency'],
    enableRegression: true,
    enableAlerting: true,
    alertThresholds: {
      responseTimeDegradation: 20, // percent
      memoryIncrease: 15, // percent
      throughputDecrease: 10 // percent
    },
    ...scheduleConfig
  };

  logger.info('Initializing benchmark scheduler', { config });

  const scheduler = new EventEmitter();
  const schedulerId = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let scheduledInterval = null;
  let isRunning = false;

  // Calculate interval in milliseconds
  const intervalMs = getIntervalMs(config.interval);

  // Configure benchmark schedule with timing intervals and execution parameters
  scheduler.config = config;
  scheduler.schedulerId = schedulerId;
  scheduler.nextExecution = new Date(Date.now() + intervalMs);
  scheduler.executionHistory = [];
  scheduler.performanceBaseline = null;

  // Set up automated benchmark execution with comprehensive error handling
  const executeScheduledBenchmark = async () => {
    if (isRunning) {
      logger.warn('Scheduled benchmark already running, skipping execution', { schedulerId });
      return;
    }

    isRunning = true;
    const executionId = `exec-${Date.now()}`;
    
    try {
      logger.info('Executing scheduled benchmark suite', {
        schedulerId,
        executionId,
        benchmarkTypes: config.benchmarkTypes
      });

      const benchmarkResults = await runComprehensiveBenchmark({
        iterations: 500, // Reduced for scheduled runs
        concurrency: [10, 50],
        endpoints: ['/hello', '/good-evening', '/health'],
        enableMemoryProfiling: config.benchmarkTypes.includes('memory'),
        enableStressTesting: false, // Disabled for scheduled runs
        generateReports: true,
        outputDirectory: `./benchmarks/scheduled/${executionId}`
      });

      // Initialize performance regression detection and baseline comparison
      if (config.enableRegression && scheduler.performanceBaseline) {
        const regressionAnalysis = await detectPerformanceRegressions(
          benchmarkResults,
          scheduler.performanceBaseline
        );

        benchmarkResults.regressionAnalysis = regressionAnalysis;

        // Configure alerting systems for performance degradation
        if (config.enableAlerting && regressionAnalysis.regressionsDetected.length > 0) {
          await generatePerformanceAlerts(regressionAnalysis, config.alertThresholds);
        }
      }

      // Update performance baseline
      scheduler.performanceBaseline = extractPerformanceBaseline(benchmarkResults);

      // Record execution in history
      scheduler.executionHistory.push({
        executionId,
        timestamp: new Date().toISOString(),
        duration: benchmarkResults.metadata.duration,
        performanceScore: calculateOverallPerformanceScore(benchmarkResults),
        regressionsDetected: benchmarkResults.regressionAnalysis?.regressionsDetected.length || 0
      });

      // Limit history size
      if (scheduler.executionHistory.length > 50) {
        scheduler.executionHistory = scheduler.executionHistory.slice(-50);
      }

      scheduler.emit('benchmark-completed', {
        executionId,
        results: benchmarkResults,
        schedulerId
      });

      logger.info('Scheduled benchmark completed successfully', {
        schedulerId,
        executionId,
        performanceScore: calculateOverallPerformanceScore(benchmarkResults)
      });

    } catch (error) {
      logger.error('Scheduled benchmark execution failed', error, {
        schedulerId,
        executionId
      });

      scheduler.emit('benchmark-failed', {
        executionId,
        error,
        schedulerId
      });

      // Generate failure alert if alerting is enabled
      if (config.enableAlerting) {
        await generateFailureAlert(error, { schedulerId, executionId });
      }
    } finally {
      isRunning = false;
      scheduler.nextExecution = new Date(Date.now() + intervalMs);
    }
  };

  // Start the scheduler
  scheduler.start = () => {
    if (scheduledInterval) {
      logger.warn('Scheduler already started', { schedulerId });
      return;
    }

    scheduledInterval = setInterval(executeScheduledBenchmark, intervalMs);
    scheduler.emit('scheduler-started', { schedulerId, interval: config.interval });
    
    logger.info('Benchmark scheduler started', {
      schedulerId,
      interval: config.interval,
      nextExecution: scheduler.nextExecution
    });
  };

  // Stop the scheduler
  scheduler.stop = () => {
    if (scheduledInterval) {
      clearInterval(scheduledInterval);
      scheduledInterval = null;
      scheduler.emit('scheduler-stopped', { schedulerId });
      
      logger.info('Benchmark scheduler stopped', { schedulerId });
    }
  };

  // Get scheduler status
  scheduler.getStatus = () => ({
    schedulerId,
    isRunning: !!scheduledInterval,
    isExecuting: isRunning,
    nextExecution: scheduler.nextExecution,
    executionHistory: scheduler.executionHistory,
    config: scheduler.config
  });

  // Manual execution trigger
  scheduler.executeNow = () => {
    logger.info('Manual benchmark execution triggered', { schedulerId });
    return executeScheduledBenchmark();
  };

  logger.info('Benchmark scheduler initialized successfully', {
    schedulerId,
    interval: config.interval,
    nextExecution: scheduler.nextExecution
  });

  return scheduler;
}

// Helper functions for comprehensive performance analysis and statistical calculations

/**
 * Validates suite configuration for proper parameter ranges and compatibility
 * @private
 */
function validateSuiteConfiguration(config) {
  if (!config.endpoints || !Array.isArray(config.endpoints) || config.endpoints.length === 0) {
    throw new Error('Invalid endpoints configuration: must be non-empty array');
  }

  if (!config.concurrency || !Array.isArray(config.concurrency) || config.concurrency.length === 0) {
    throw new Error('Invalid concurrency configuration: must be non-empty array');
  }

  if (config.iterations && (config.iterations < 1 || config.iterations > 10000)) {
    throw new Error('Invalid iterations configuration: must be between 1 and 10000');
  }

  logger.debug('Suite configuration validated successfully', config);
}

/**
 * Calculates standard deviation for statistical analysis
 * @private
 */
function calculateStandardDeviation(values) {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDifferences.reduce((a, b) => a + b) / squaredDifferences.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculates percentiles for performance distribution analysis
 * @private
 */
function calculatePercentiles(values, percentiles) {
  const sorted = [...values].sort((a, b) => a - b);
  const result = {};
  
  for (const p of percentiles) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    result[`p${p}`] = sorted[Math.max(0, index)];
  }
  
  return result;
}

/**
 * Calculates overall performance score based on multiple metrics
 * @private
 */
function calculateOverallPerformanceScore(benchmarkResults) {
  let score = 100;
  
  // Response time scoring (30% weight)
  if (benchmarkResults.responseTimeAnalysis) {
    const avgResponseTime = benchmarkResults.responseTimeAnalysis.aggregatedMetrics?.averageResponseTime || 0;
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime - 50) * 2); // Target: 50ms
    score -= (100 - responseTimeScore) * 0.3;
  }
  
  // Throughput scoring (25% weight)
  if (benchmarkResults.concurrencyAnalysis) {
    const maxThroughput = Math.max(...Object.values(benchmarkResults.concurrencyAnalysis)
      .map(level => level.throughputMetrics?.requestsPerSecond || 0));
    const throughputScore = Math.min(100, (maxThroughput / 1000) * 100); // Target: 1000 req/sec
    score -= (100 - throughputScore) * 0.25;
  }
  
  // Memory efficiency scoring (20% weight)
  if (benchmarkResults.memoryAnalysis) {
    const peakMemory = benchmarkResults.memoryAnalysis.baselineMemory?.heapUsed || 0;
    const memoryScore = Math.max(0, 100 - ((peakMemory - 50000000) / 1000000)); // Target: 50MB
    score -= (100 - memoryScore) * 0.2;
  }
  
  // Stability scoring (15% weight)
  if (benchmarkResults.loadTestingResults) {
    const stabilityScore = benchmarkResults.loadTestingResults.systemStability?.overallScore || 50;
    score -= (100 - stabilityScore) * 0.15;
  }
  
  // Compliance scoring (10% weight)
  if (benchmarkResults.performanceValidation) {
    const complianceScore = benchmarkResults.performanceValidation.complianceScore || 0;
    score -= (100 - complianceScore) * 0.1;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Ensures directory exists, creating it if necessary
 * @private
 */
async function ensureDirectoryExists(directory) {
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Converts interval string to milliseconds
 * @private
 */
function getIntervalMs(interval) {
  const intervals = {
    'minute': 60 * 1000,
    'hourly': 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
    'weekly': 7 * 24 * 60 * 60 * 1000
  };
  
  return intervals[interval] || intervals.daily;
}

// Export constants that are not exported elsewhere
export {
  defaultSuiteConfig,
  PERFORMANCE_SUITE_VERSION
};

// Initialize performance suite on module load
logger.info('Performance benchmarking suite initialized', {
  version: PERFORMANCE_SUITE_VERSION,
  nodeVersion: process.version,
  platform: os.platform(),
  cpuCores: os.cpus().length
});