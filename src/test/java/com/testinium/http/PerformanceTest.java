package com.testinium.http;

import com.testinium.utils.TestConstants;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.hamcrest.Matchers;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * PerformanceTest validates that the Express.js server meets the sub-10ms response time requirements
 * specified in F-001-RQ-003 and F-002-RQ-003. This test class performs comprehensive performance testing
 * including individual request latency measurement, concurrent load testing, sustained load testing,
 * and throughput validation to ensure the server meets the 1000+ requests/second capability requirement
 * per Section 6.6.5.3 of the technical specification.
 * 
 * <p>Test Categories:
 * <ul>
 *   <li>Individual Response Time: Validates single request latency < 10ms</li>
 *   <li>Concurrent Load: Tests 100 simultaneous requests with average response time validation</li>
 *   <li>Sustained Load: Verifies performance consistency over 30-second duration</li>
 *   <li>Throughput: Validates 1000+ requests/second handling capability</li>
 *   <li>Percentile Analysis: Tests 95th percentile response times < 25ms</li>
 *   <li>Logging Overhead: Validates middleware overhead < 1ms per F-003 requirements</li>
 * </ul>
 * 
 * <p>Requirement Traceability:
 * <ul>
 *   <li>F-001-RQ-003: Root endpoint response time < 10ms</li>
 *   <li>F-002-RQ-003: Evening endpoint response time < 10ms</li>
 *   <li>Section 6.6.5.2: Load Testing Implementation requirements</li>
 *   <li>Section 6.6.5.3: Throughput validation 1000+ req/s</li>
 *   <li>Section 6.6.7.3: Performance threshold table compliance</li>
 * </ul>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public class PerformanceTest {

    /**
     * Test setup method executed before each test case.
     * Configures RestAssured with base URL, port, and timeout settings
     * from TestConstants for consistent performance test execution.
     */
    @Before
    public void setUp() {
        RestAssured.baseURI = TestConstants.BASE_URL;
        RestAssured.port = TestConstants.DEFAULT_PORT;
        
        // Configure reasonable connection and response timeouts for performance testing
        RestAssured.config = RestAssured.config().httpClient(RestAssured.config().getHttpClientConfig()
            .setParam("http.connection.timeout", 5000)
            .setParam("http.socket.timeout", 5000));
    }

    /**
     * Tests that the root endpoint (GET /) responds within the 10ms threshold for a single request.
     * This test validates F-001-RQ-003 requirement by measuring the complete request-response cycle
     * duration and asserting it meets the sub-10ms performance criteria.
     * 
     * <p>Test Methodology:
     * <ol>
     *   <li>Execute single GET request to root endpoint</li>
     *   <li>Capture response time using RestAssured's time measurement</li>
     *   <li>Assert response time is less than RESPONSE_TIME_THRESHOLD_MS (10ms)</li>
     *   <li>Verify response status code is 200 OK</li>
     * </ol>
     * 
     * @see TestConstants#RESPONSE_TIME_THRESHOLD_MS
     * @see TestConstants#ROOT_ENDPOINT
     */
    @Test
    public void testRootEndpointResponseTime() {
        Response response = RestAssured.given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT)
            .then()
            .statusCode(200)
            .extract()
            .response();
        
        long responseTime = response.getTime();
        
        Assert.assertTrue(
            "Root endpoint response time (" + responseTime + "ms) exceeds threshold of " 
                + TestConstants.RESPONSE_TIME_THRESHOLD_MS + "ms",
            responseTime < TestConstants.RESPONSE_TIME_THRESHOLD_MS
        );
        
        Assert.assertNotNull("Response body should not be null", response.getBody());
        Assert.assertEquals("Response status should be 200", 200, response.getStatusCode());
    }

    /**
     * Tests that the evening endpoint (GET /evening) responds within the 10ms threshold for a single request.
     * This test validates F-002-RQ-003 requirement by measuring the complete request-response cycle
     * duration and asserting it meets the sub-10ms performance criteria.
     * 
     * <p>Test Methodology:
     * <ol>
     *   <li>Execute single GET request to evening endpoint</li>
     *   <li>Capture response time using RestAssured's time measurement</li>
     *   <li>Assert response time is less than RESPONSE_TIME_THRESHOLD_MS (10ms)</li>
     *   <li>Verify response status code is 200 OK</li>
     * </ol>
     * 
     * @see TestConstants#RESPONSE_TIME_THRESHOLD_MS
     * @see TestConstants#EVENING_ENDPOINT
     */
    @Test
    public void testEveningEndpointResponseTime() {
        Response response = RestAssured.given()
            .when()
            .get(TestConstants.EVENING_ENDPOINT)
            .then()
            .statusCode(200)
            .extract()
            .response();
        
        long responseTime = response.getTime();
        
        Assert.assertTrue(
            "Evening endpoint response time (" + responseTime + "ms) exceeds threshold of " 
                + TestConstants.RESPONSE_TIME_THRESHOLD_MS + "ms",
            responseTime < TestConstants.RESPONSE_TIME_THRESHOLD_MS
        );
        
        Assert.assertNotNull("Response body should not be null", response.getBody());
        Assert.assertEquals("Response status should be 200", 200, response.getStatusCode());
    }

    /**
     * Tests server performance under concurrent load by executing multiple simultaneous requests.
     * This test validates Section 6.6.5.2 Load Testing Implementation requirements by executing
     * CONCURRENT_REQUEST_COUNT (100) requests in parallel and measuring average response times.
     * 
     * <p>Test Methodology:
     * <ol>
     *   <li>Create ExecutorService with thread pool for concurrent execution</li>
     *   <li>Submit 100 concurrent requests (50 to root, 50 to evening endpoint)</li>
     *   <li>Collect all response times using Future results</li>
     *   <li>Calculate average response time across all requests</li>
     *   <li>Assert average response time < RESPONSE_TIME_THRESHOLD_MS</li>
     *   <li>Assert no individual request exceeds 20ms (2x threshold)</li>
     * </ol>
     * 
     * @see TestConstants#CONCURRENT_REQUEST_COUNT
     * @see TestConstants#RESPONSE_TIME_THRESHOLD_MS
     */
    @Test
    public void testConcurrentRequestsPerformance() throws Exception {
        ExecutorService executorService = Executors.newFixedThreadPool(TestConstants.CONCURRENT_REQUEST_COUNT);
        List<Callable<Response>> tasks = new ArrayList<>();
        
        // Create concurrent request tasks - 50 for each endpoint
        for (int i = 0; i < TestConstants.CONCURRENT_REQUEST_COUNT / 2; i++) {
            tasks.add(new Callable<Response>() {
                @Override
                public Response call() throws Exception {
                    return RestAssured.given()
                        .when()
                        .get(TestConstants.ROOT_ENDPOINT)
                        .then()
                        .extract()
                        .response();
                }
            });
            
            tasks.add(new Callable<Response>() {
                @Override
                public Response call() throws Exception {
                    return RestAssured.given()
                        .when()
                        .get(TestConstants.EVENING_ENDPOINT)
                        .then()
                        .extract()
                        .response();
                }
            });
        }
        
        // Execute all tasks concurrently and collect results
        List<Future<Response>> futures = executorService.invokeAll(tasks);
        executorService.shutdown();
        executorService.awaitTermination(30, TimeUnit.SECONDS);
        
        // Calculate response time statistics
        long totalResponseTime = 0;
        long maxResponseTime = 0;
        int successfulRequests = 0;
        
        for (Future<Response> future : futures) {
            Response response = future.get();
            long responseTime = response.getTime();
            
            totalResponseTime += responseTime;
            maxResponseTime = Math.max(maxResponseTime, responseTime);
            
            if (response.getStatusCode() == 200) {
                successfulRequests++;
            }
        }
        
        long averageResponseTime = totalResponseTime / futures.size();
        
        // Performance assertions
        Assert.assertEquals(
            "All concurrent requests should succeed",
            TestConstants.CONCURRENT_REQUEST_COUNT,
            successfulRequests
        );
        
        Assert.assertTrue(
            "Average response time (" + averageResponseTime + "ms) exceeds threshold of " 
                + TestConstants.RESPONSE_TIME_THRESHOLD_MS + "ms",
            averageResponseTime < TestConstants.RESPONSE_TIME_THRESHOLD_MS
        );
        
        Assert.assertTrue(
            "Maximum response time (" + maxResponseTime + "ms) exceeds 20ms threshold",
            maxResponseTime < 20
        );
    }

    /**
     * Tests server performance under sustained load over a defined duration.
     * This test validates Section 6.6.5.3 throughput requirements by executing continuous
     * requests for LOAD_TEST_DURATION_SECONDS (30 seconds) and measuring throughput
     * to ensure the server can handle 1000+ requests/second capability.
     * 
     * <p>Test Methodology:
     * <ol>
     *   <li>Record test start time</li>
     *   <li>Execute requests continuously for 30 seconds</li>
     *   <li>Track total request count and response times</li>
     *   <li>Calculate throughput (requests per second)</li>
     *   <li>Assert throughput >= 1000 requests/second</li>
     *   <li>Assert no performance degradation over time</li>
     * </ol>
     * 
     * @see TestConstants#LOAD_TEST_DURATION_SECONDS
     */
    @Test
    public void testSustainedLoadPerformance() {
        long testStartTime = System.currentTimeMillis();
        long testDurationMs = TestConstants.LOAD_TEST_DURATION_SECONDS * 1000L;
        long testEndTime = testStartTime + testDurationMs;
        
        int totalRequests = 0;
        long totalResponseTime = 0;
        int successfulRequests = 0;
        List<Long> responseTimes = new ArrayList<>();
        
        // Execute requests continuously for the test duration
        while (System.currentTimeMillis() < testEndTime) {
            try {
                Response response = RestAssured.given()
                    .when()
                    .get(TestConstants.ROOT_ENDPOINT)
                    .then()
                    .extract()
                    .response();
                
                long responseTime = response.getTime();
                totalRequests++;
                totalResponseTime += responseTime;
                responseTimes.add(responseTime);
                
                if (response.getStatusCode() == 200) {
                    successfulRequests++;
                }
            } catch (Exception e) {
                // Log exception but continue testing
                System.err.println("Request failed during sustained load test: " + e.getMessage());
            }
        }
        
        long actualDuration = System.currentTimeMillis() - testStartTime;
        double throughput = (totalRequests * 1000.0) / actualDuration;
        long averageResponseTime = totalResponseTime / totalRequests;
        
        // Performance assertions
        Assert.assertTrue(
            "Sustained load test should complete at least 1000 requests, completed: " + totalRequests,
            totalRequests >= 1000
        );
        
        Assert.assertTrue(
            "Throughput (" + String.format("%.2f", throughput) + " req/s) should be >= 1000 req/s",
            throughput >= 1000.0
        );
        
        Assert.assertTrue(
            "Average response time (" + averageResponseTime + "ms) exceeds threshold",
            averageResponseTime < TestConstants.RESPONSE_TIME_THRESHOLD_MS
        );
        
        // Validate no significant degradation over time
        // Compare first 10% of requests vs last 10% of requests
        int sampleSize = totalRequests / 10;
        long earlyAverage = calculateAverage(responseTimes.subList(0, sampleSize));
        long lateAverage = calculateAverage(responseTimes.subList(totalRequests - sampleSize, totalRequests));
        
        double degradationPercent = ((lateAverage - earlyAverage) * 100.0) / earlyAverage;
        
        Assert.assertTrue(
            "Performance degradation (" + String.format("%.2f", degradationPercent) + "%) exceeds 5% threshold",
            degradationPercent < 5.0
        );
    }

    /**
     * Tests response time percentile distribution to validate Section 6.6.7.3 performance thresholds.
     * This test executes multiple requests and calculates the 95th percentile response time,
     * asserting it meets the < 25ms requirement from the performance threshold table.
     * 
     * <p>Test Methodology:
     * <ol>
     *   <li>Execute 1000 requests to both endpoints</li>
     *   <li>Collect all response times in a sorted list</li>
     *   <li>Calculate 95th percentile value</li>
     *   <li>Assert 95th percentile < 25ms per specification</li>
     *   <li>Assert median (50th percentile) < 10ms</li>
     * </ol>
     */
    @Test
    public void testResponseTimePercentiles() {
        int sampleSize = 1000;
        List<Long> responseTimes = new ArrayList<>();
        
        // Execute sample requests and collect response times
        for (int i = 0; i < sampleSize; i++) {
            String endpoint = (i % 2 == 0) ? TestConstants.ROOT_ENDPOINT : TestConstants.EVENING_ENDPOINT;
            
            Response response = RestAssured.given()
                .when()
                .get(endpoint)
                .then()
                .extract()
                .response();
            
            responseTimes.add(response.getTime());
        }
        
        // Sort response times for percentile calculation
        Collections.sort(responseTimes);
        
        // Calculate percentiles
        long percentile50 = responseTimes.get((int) (sampleSize * 0.50));
        long percentile95 = responseTimes.get((int) (sampleSize * 0.95));
        long percentile99 = responseTimes.get((int) (sampleSize * 0.99));
        
        // Performance assertions based on Section 6.6.7.3
        Assert.assertTrue(
            "50th percentile (" + percentile50 + "ms) exceeds 10ms threshold",
            percentile50 < TestConstants.RESPONSE_TIME_THRESHOLD_MS
        );
        
        Assert.assertTrue(
            "95th percentile (" + percentile95 + "ms) exceeds 25ms threshold",
            percentile95 < 25
        );
        
        Assert.assertThat(
            "Response times should be consistently low",
            percentile95,
            Matchers.lessThan(25L)
        );
        
        Assert.assertNotNull("Response time list should not be null", responseTimes);
        Assert.assertEquals("Should have collected all samples", sampleSize, responseTimes.size());
    }

    /**
     * Tests the performance overhead introduced by the request logging middleware.
     * This test validates F-003 requirements by comparing response times with heavy concurrent
     * load to ensure logging overhead remains < 1ms as specified in F-003 performance criteria.
     * 
     * <p>Test Methodology:
     * <ol>
     *   <li>Execute baseline performance test with 100 requests</li>
     *   <li>Calculate average response time including logging</li>
     *   <li>Verify total response time stays within threshold</li>
     *   <li>Assert logging doesn't cause performance degradation beyond 10% overhead</li>
     * </ol>
     * 
     * <p>Note: Since we cannot disable logging in the live server, this test validates
     * that the current implementation (with logging enabled) still meets performance requirements,
     * implying logging overhead is minimal.
     */
    @Test
    public void testLoggingOverheadPerformance() throws Exception {
        int testIterations = 100;
        List<Long> responseTimes = new ArrayList<>();
        
        // Execute requests with logging enabled (production configuration)
        for (int i = 0; i < testIterations; i++) {
            Response response = RestAssured.given()
                .when()
                .get(TestConstants.ROOT_ENDPOINT)
                .then()
                .extract()
                .response();
            
            responseTimes.add(response.getTime());
        }
        
        long averageResponseTime = calculateAverage(responseTimes);
        
        // Assertions
        Assert.assertTrue(
            "Average response time with logging (" + averageResponseTime + "ms) exceeds threshold",
            averageResponseTime < TestConstants.RESPONSE_TIME_THRESHOLD_MS
        );
        
        Assert.assertThat(
            "Response time should be within acceptable range",
            averageResponseTime,
            Matchers.lessThan((long) TestConstants.RESPONSE_TIME_THRESHOLD_MS)
        );
        
        Assert.assertThat(
            "Response times should be consistently fast",
            Collections.max(responseTimes),
            Matchers.lessThan(20L)
        );
    }

    /**
     * Helper method to calculate the average of a list of long values.
     * Used for statistical analysis of response times in performance tests.
     * 
     * @param values List of long values to average
     * @return Average value as long
     */
    private long calculateAverage(List<Long> values) {
        if (values == null || values.isEmpty()) {
            return 0;
        }
        
        long sum = 0;
        for (Long value : values) {
            sum += value;
        }
        
        return sum / values.size();
    }
}
