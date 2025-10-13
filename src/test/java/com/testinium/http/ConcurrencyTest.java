package com.testinium.http;

import com.testinium.utils.TestConstants;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.hamcrest.Matchers;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * ConcurrencyTest validates the Express server's ability to handle multiple concurrent HTTP requests
 * without errors, response corruption, race conditions, or resource conflicts.
 * 
 * <p>This test class implements comprehensive multi-threaded testing requirements from Section 0.3.1
 * Edge Case Tests, validating that the server maintains response integrity, thread safety, and proper
 * isolation when processing 100+ simultaneous requests to both GET / and GET /evening endpoints.
 * 
 * <p>Test Coverage:
 * <ul>
 *   <li>Concurrent requests to root endpoint (/) with response validation</li>
 *   <li>Concurrent requests to evening endpoint (/evening) with integrity checks</li>
 *   <li>Mixed concurrent requests to both endpoints simultaneously</li>
 *   <li>High concurrency stress testing with 500+ requests</li>
 *   <li>Response isolation validation between concurrent clients</li>
 *   <li>Thread safety validation using atomic counters and synchronization primitives</li>
 * </ul>
 * 
 * <p>The tests use Java's ExecutorService with fixed thread pools to simulate concurrent clients,
 * RestAssured 5.5.5 for HTTP communication, and thread-safe collections (CopyOnWriteArrayList,
 * AtomicInteger) to aggregate results without race conditions.
 * 
 * <p>Requirement Traceability:
 * <ul>
 *   <li>Section 0.3.1 - Edge Case Tests: Concurrent request handling capabilities</li>
 *   <li>Section 0.3.2 - Performance boundaries: 100+ concurrent requests handling</li>
 *   <li>Section 0.5.1 - Coverage Metrics: Thread safety and response isolation validation</li>
 * </ul>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public class ConcurrencyTest {

    /**
     * ExecutorService for managing concurrent request threads.
     * Initialized with a fixed thread pool sized to handle the configured concurrent request count.
     */
    private ExecutorService executorService;

    /**
     * Test setup method executed before each test case.
     * Configures RestAssured base URI and port, and initializes the ExecutorService
     * with a thread pool sized to TestConstants.CONCURRENT_REQUEST_COUNT.
     * 
     * <p>This method ensures each test starts with a fresh ExecutorService instance
     * and properly configured HTTP client settings.
     */
    @Before
    public void setUp() {
        // Configure RestAssured for the Express server under test
        RestAssured.baseURI = TestConstants.BASE_URL;
        RestAssured.port = TestConstants.DEFAULT_PORT;
        
        // Initialize ExecutorService with fixed thread pool for concurrent request execution
        executorService = Executors.newFixedThreadPool(TestConstants.CONCURRENT_REQUEST_COUNT);
    }

    /**
     * Test teardown method executed after each test case.
     * Gracefully shuts down the ExecutorService, awaiting termination with a timeout
     * to ensure all threads complete before the next test begins.
     * 
     * <p>If threads do not terminate within the timeout period, forces shutdown
     * to prevent resource leaks and test hangs.
     */
    @After
    public void tearDown() {
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
            try {
                // Wait up to 10 seconds for all tasks to complete
                if (!executorService.awaitTermination(10, TimeUnit.SECONDS)) {
                    // Force shutdown if tasks don't complete in time
                    executorService.shutdownNow();
                    // Wait again for tasks to respond to cancellation
                    if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                        System.err.println("ExecutorService did not terminate gracefully");
                    }
                }
            } catch (InterruptedException e) {
                executorService.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Tests concurrent requests to the root endpoint (GET /).
     * 
     * <p>Executes TestConstants.CONCURRENT_REQUEST_COUNT (100) simultaneous HTTP GET requests
     * to the root endpoint and validates that all requests return status 200 with the correct
     * response body "Hello world" without any corruption or errors.
     * 
     * <p>This test validates:
     * <ul>
     *   <li>Server can handle 100+ concurrent requests without failures</li>
     *   <li>All responses have correct HTTP status code (200)</li>
     *   <li>All response bodies are exactly "Hello world" without corruption</li>
     *   <li>No exceptions occur during concurrent request processing</li>
     * </ul>
     * 
     * <p>Uses CopyOnWriteArrayList for thread-safe result collection and Future objects
     * to aggregate results from all concurrent tasks.
     * 
     * @throws Exception if task execution or result collection fails
     */
    @Test
    public void testConcurrentRootEndpointRequests() throws Exception {
        // Thread-safe list to collect responses from all concurrent requests
        List<Response> responses = new CopyOnWriteArrayList<>();
        List<Future<Response>> futures = new ArrayList<>();
        
        // Submit CONCURRENT_REQUEST_COUNT tasks to execute GET / requests in parallel
        for (int i = 0; i < TestConstants.CONCURRENT_REQUEST_COUNT; i++) {
            Callable<Response> task = new Callable<Response>() {
                @Override
                public Response call() throws Exception {
                    // Execute GET request to root endpoint
                    Response response = RestAssured.given()
                            .when()
                            .get(TestConstants.ROOT_ENDPOINT)
                            .then()
                            .extract()
                            .response();
                    return response;
                }
            };
            futures.add(executorService.submit(task));
        }
        
        // Collect all responses from completed tasks
        for (Future<Response> future : futures) {
            Response response = future.get(10, TimeUnit.SECONDS);
            responses.add(response);
        }
        
        // Validate all responses were collected
        Assert.assertEquals("All concurrent requests should complete", 
                TestConstants.CONCURRENT_REQUEST_COUNT, responses.size());
        
        // Validate each response has correct status and body
        int successCount = 0;
        for (Response response : responses) {
            Assert.assertNotNull("Response should not be null", response);
            Assert.assertEquals("Status code should be 200", 200, response.getStatusCode());
            Assert.assertEquals("Response body should be 'Hello world'", 
                    TestConstants.HELLO_WORLD, response.getBody().asString());
            successCount++;
        }
        
        // Verify all requests succeeded
        Assert.assertEquals("All requests should return correct responses", 
                TestConstants.CONCURRENT_REQUEST_COUNT, successCount);
    }

    /**
     * Tests concurrent requests to the evening endpoint (GET /evening).
     * 
     * <p>Executes 100 simultaneous HTTP GET requests to the /evening endpoint and validates
     * response integrity, ensuring no corruption or cross-contamination occurs under concurrent load.
     * 
     * <p>This test validates:
     * <ul>
     *   <li>Evening endpoint handles concurrent requests without failures</li>
     *   <li>All responses return HTTP status 200</li>
     *   <li>All response bodies are exactly "Good evening" without corruption</li>
     *   <li>Response isolation is maintained between concurrent requests</li>
     * </ul>
     * 
     * @throws Exception if task execution or result collection fails
     */
    @Test
    public void testConcurrentEveningEndpointRequests() throws Exception {
        // Thread-safe list to collect responses from all concurrent requests
        List<Response> responses = new CopyOnWriteArrayList<>();
        List<Future<Response>> futures = new ArrayList<>();
        
        // Submit CONCURRENT_REQUEST_COUNT tasks to execute GET /evening requests in parallel
        for (int i = 0; i < TestConstants.CONCURRENT_REQUEST_COUNT; i++) {
            Callable<Response> task = new Callable<Response>() {
                @Override
                public Response call() throws Exception {
                    // Execute GET request to evening endpoint
                    Response response = RestAssured.given()
                            .when()
                            .get(TestConstants.EVENING_ENDPOINT)
                            .then()
                            .extract()
                            .response();
                    return response;
                }
            };
            futures.add(executorService.submit(task));
        }
        
        // Collect all responses from completed tasks
        for (Future<Response> future : futures) {
            Response response = future.get(10, TimeUnit.SECONDS);
            responses.add(response);
        }
        
        // Validate all responses were collected
        Assert.assertEquals("All concurrent requests should complete", 
                TestConstants.CONCURRENT_REQUEST_COUNT, responses.size());
        
        // Validate each response has correct status and body
        int successCount = 0;
        for (Response response : responses) {
            Assert.assertNotNull("Response should not be null", response);
            Assert.assertEquals("Status code should be 200", 200, response.getStatusCode());
            Assert.assertEquals("Response body should be 'Good evening'", 
                    TestConstants.GOOD_EVENING, response.getBody().asString());
            successCount++;
        }
        
        // Verify all requests succeeded
        Assert.assertEquals("All requests should return correct responses", 
                TestConstants.CONCURRENT_REQUEST_COUNT, successCount);
    }

    /**
     * Tests mixed concurrent requests to both root and evening endpoints simultaneously.
     * 
     * <p>Executes 50 concurrent requests to GET / and 50 concurrent requests to GET /evening
     * simultaneously, validating that each endpoint returns its correct response without
     * cross-contamination or corruption.
     * 
     * <p>This test validates:
     * <ul>
     *   <li>Server correctly routes concurrent requests to different endpoints</li>
     *   <li>No response mixing occurs between different endpoint types</li>
     *   <li>Each endpoint maintains its specific response under concurrent load</li>
     *   <li>Response isolation is maintained across different endpoint paths</li>
     * </ul>
     * 
     * <p>Uses CountDownLatch to synchronize thread execution and ensure all requests
     * are submitted as close to simultaneously as possible.
     * 
     * @throws Exception if task execution or result collection fails
     */
    @Test
    public void testMixedConcurrentRequests() throws Exception {
        final int requestsPerEndpoint = TestConstants.CONCURRENT_REQUEST_COUNT / 2;
        final CountDownLatch startLatch = new CountDownLatch(1);
        final CountDownLatch completionLatch = new CountDownLatch(TestConstants.CONCURRENT_REQUEST_COUNT);
        
        // Thread-safe lists to collect responses from each endpoint
        final List<Response> rootResponses = new CopyOnWriteArrayList<>();
        final List<Response> eveningResponses = new CopyOnWriteArrayList<>();
        
        // Submit tasks for root endpoint requests
        for (int i = 0; i < requestsPerEndpoint; i++) {
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    try {
                        // Wait for start signal to synchronize all threads
                        startLatch.await();
                        
                        // Execute GET request to root endpoint
                        Response response = RestAssured.given()
                                .when()
                                .get(TestConstants.ROOT_ENDPOINT)
                                .then()
                                .extract()
                                .response();
                        rootResponses.add(response);
                    } catch (Exception e) {
                        Assert.fail("Root endpoint request failed: " + e.getMessage());
                    } finally {
                        completionLatch.countDown();
                    }
                }
            });
        }
        
        // Submit tasks for evening endpoint requests
        for (int i = 0; i < requestsPerEndpoint; i++) {
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    try {
                        // Wait for start signal to synchronize all threads
                        startLatch.await();
                        
                        // Execute GET request to evening endpoint
                        Response response = RestAssured.given()
                                .when()
                                .get(TestConstants.EVENING_ENDPOINT)
                                .then()
                                .extract()
                                .response();
                        eveningResponses.add(response);
                    } catch (Exception e) {
                        Assert.fail("Evening endpoint request failed: " + e.getMessage());
                    } finally {
                        completionLatch.countDown();
                    }
                }
            });
        }
        
        // Release all threads to execute concurrently
        startLatch.countDown();
        
        // Wait for all requests to complete (with timeout)
        boolean completed = completionLatch.await(30, TimeUnit.SECONDS);
        Assert.assertTrue("All concurrent requests should complete within timeout", completed);
        
        // Validate root endpoint responses
        Assert.assertEquals("Should have " + requestsPerEndpoint + " root endpoint responses", 
                requestsPerEndpoint, rootResponses.size());
        for (Response response : rootResponses) {
            Assert.assertNotNull("Root response should not be null", response);
            Assert.assertEquals("Root endpoint status should be 200", 200, response.getStatusCode());
            Assert.assertEquals("Root endpoint should return 'Hello world'", 
                    TestConstants.HELLO_WORLD, response.getBody().asString());
        }
        
        // Validate evening endpoint responses
        Assert.assertEquals("Should have " + requestsPerEndpoint + " evening endpoint responses", 
                requestsPerEndpoint, eveningResponses.size());
        for (Response response : eveningResponses) {
            Assert.assertNotNull("Evening response should not be null", response);
            Assert.assertEquals("Evening endpoint status should be 200", 200, response.getStatusCode());
            Assert.assertEquals("Evening endpoint should return 'Good evening'", 
                    TestConstants.GOOD_EVENING, response.getBody().asString());
        }
    }

    /**
     * Tests server stability under extreme concurrent load with 500+ simultaneous requests.
     * 
     * <p>This stress test executes 500 concurrent requests to validate server behavior
     * under high load conditions, ensuring minimal failures and consistent performance.
     * 
     * <p>This test validates:
     * <ul>
     *   <li>Server remains stable under extreme concurrent load (500+ requests)</li>
     *   <li>Success rate is at least 99% (allowing minimal failure tolerance)</li>
     *   <li>No catastrophic failures or server crashes occur</li>
     *   <li>Server can recover gracefully from high load conditions</li>
     * </ul>
     * 
     * <p>Uses AtomicInteger for thread-safe counting of successes and failures
     * without synchronization overhead.
     * 
     * @throws Exception if task execution fails catastrophically
     */
    @Test
    public void testHighConcurrencyStressTest() throws Exception {
        final int stressTestRequestCount = 500;
        final AtomicInteger successCount = new AtomicInteger(0);
        final AtomicInteger failureCount = new AtomicInteger(0);
        final CountDownLatch completionLatch = new CountDownLatch(stressTestRequestCount);
        
        // Create a larger thread pool for stress testing
        ExecutorService stressExecutor = Executors.newFixedThreadPool(200);
        
        try {
            // Submit stress test requests
            for (int i = 0; i < stressTestRequestCount; i++) {
                final int requestId = i;
                stressExecutor.submit(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            // Alternate between root and evening endpoints
                            String endpoint = (requestId % 2 == 0) ? 
                                    TestConstants.ROOT_ENDPOINT : TestConstants.EVENING_ENDPOINT;
                            String expectedResponse = (requestId % 2 == 0) ? 
                                    TestConstants.HELLO_WORLD : TestConstants.GOOD_EVENING;
                            
                            // Execute request
                            Response response = RestAssured.given()
                                    .when()
                                    .get(endpoint)
                                    .then()
                                    .extract()
                                    .response();
                            
                            // Validate response
                            if (response.getStatusCode() == 200 && 
                                    expectedResponse.equals(response.getBody().asString())) {
                                successCount.incrementAndGet();
                            } else {
                                failureCount.incrementAndGet();
                            }
                        } catch (Exception e) {
                            failureCount.incrementAndGet();
                        } finally {
                            completionLatch.countDown();
                        }
                    }
                });
            }
            
            // Wait for all requests to complete (with generous timeout for stress test)
            boolean completed = completionLatch.await(60, TimeUnit.SECONDS);
            Assert.assertTrue("All stress test requests should complete within timeout", completed);
            
            // Calculate success rate
            int totalProcessed = successCount.get() + failureCount.get();
            double successRate = (double) successCount.get() / totalProcessed * 100.0;
            
            // Validate success rate is at least 99%
            Assert.assertTrue(
                    String.format("Success rate should be >= 99%% (actual: %.2f%%, %d/%d)", 
                            successRate, successCount.get(), totalProcessed),
                    successRate >= 99.0
            );
            
            // Log stress test results
            System.out.println(String.format(
                    "Stress test completed: %d requests, %d successes (%.2f%%), %d failures",
                    totalProcessed, successCount.get(), successRate, failureCount.get()
            ));
            
        } finally {
            // Clean up stress executor
            stressExecutor.shutdown();
            stressExecutor.awaitTermination(10, TimeUnit.SECONDS);
        }
    }

    /**
     * Tests response isolation between concurrent clients to ensure no response mixing or corruption.
     * 
     * <p>Executes concurrent requests with unique request identifiers and validates that each
     * client receives independent, correct responses without any cross-contamination from
     * other concurrent requests.
     * 
     * <p>This test validates:
     * <ul>
     *   <li>Each concurrent client receives independent response without mixing</li>
     *   <li>Response content is never corrupted or combined from multiple requests</li>
     *   <li>Server maintains proper request/response isolation under concurrent load</li>
     *   <li>No race conditions exist in response handling logic</li>
     * </ul>
     * 
     * <p>This test uses a combination of both endpoints to ensure response isolation
     * is maintained even when different endpoint types are processed concurrently.
     * 
     * @throws Exception if task execution or validation fails
     */
    @Test
    public void testResponseIsolationBetweenConcurrentClients() throws Exception {
        final CountDownLatch startLatch = new CountDownLatch(1);
        final CountDownLatch completionLatch = new CountDownLatch(TestConstants.CONCURRENT_REQUEST_COUNT);
        
        // Thread-safe collection to store request metadata and responses
        final List<RequestResponsePair> results = new CopyOnWriteArrayList<>();
        
        // Submit concurrent requests with unique identifiers
        for (int i = 0; i < TestConstants.CONCURRENT_REQUEST_COUNT; i++) {
            final int requestId = i;
            final boolean useRootEndpoint = (i % 2 == 0);
            
            executorService.submit(new Runnable() {
                @Override
                public void run() {
                    try {
                        // Wait for start signal
                        startLatch.await();
                        
                        // Determine endpoint and expected response
                        String endpoint = useRootEndpoint ? 
                                TestConstants.ROOT_ENDPOINT : TestConstants.EVENING_ENDPOINT;
                        String expectedResponse = useRootEndpoint ? 
                                TestConstants.HELLO_WORLD : TestConstants.GOOD_EVENING;
                        
                        // Execute request
                        Response response = RestAssured.given()
                                .when()
                                .get(endpoint)
                                .then()
                                .extract()
                                .response();
                        
                        // Store request metadata and response for validation
                        results.add(new RequestResponsePair(requestId, endpoint, expectedResponse, response));
                        
                    } catch (Exception e) {
                        Assert.fail("Request " + requestId + " failed: " + e.getMessage());
                    } finally {
                        completionLatch.countDown();
                    }
                }
            });
        }
        
        // Release all threads to execute concurrently
        startLatch.countDown();
        
        // Wait for all requests to complete
        boolean completed = completionLatch.await(30, TimeUnit.SECONDS);
        Assert.assertTrue("All concurrent requests should complete within timeout", completed);
        
        // Validate all responses
        Assert.assertEquals("Should have received all responses", 
                TestConstants.CONCURRENT_REQUEST_COUNT, results.size());
        
        // Validate each response is correct and isolated
        int correctResponses = 0;
        for (RequestResponsePair pair : results) {
            Assert.assertNotNull("Response should not be null for request " + pair.requestId, 
                    pair.response);
            Assert.assertEquals("Status code should be 200 for request " + pair.requestId, 
                    200, pair.response.getStatusCode());
            
            String actualBody = pair.response.getBody().asString();
            
            // Validate response matches expected value for this endpoint
            Assert.assertEquals(
                    String.format("Request %d to %s should return expected response", 
                            pair.requestId, pair.endpoint),
                    pair.expectedResponse,
                    actualBody
            );
            
            // Ensure response is EXACTLY the expected value with no corruption
            Assert.assertTrue(
                    String.format("Response for request %d should not contain unexpected content", 
                            pair.requestId),
                    actualBody.equals(TestConstants.HELLO_WORLD) || 
                    actualBody.equals(TestConstants.GOOD_EVENING)
            );
            
            // Ensure response does not contain mixed content
            Assert.assertFalse(
                    "Response should not contain both endpoint responses",
                    actualBody.contains(TestConstants.HELLO_WORLD) && 
                    actualBody.contains(TestConstants.GOOD_EVENING)
            );
            
            correctResponses++;
        }
        
        // Verify all responses were correct and isolated
        Assert.assertEquals("All responses should be correct and isolated", 
                TestConstants.CONCURRENT_REQUEST_COUNT, correctResponses);
    }

    /**
     * Inner class to encapsulate request metadata and response for isolation validation.
     * Stores the request ID, endpoint path, expected response, and actual response
     * to facilitate validation of response isolation between concurrent requests.
     */
    private static class RequestResponsePair {
        final int requestId;
        final String endpoint;
        final String expectedResponse;
        final Response response;
        
        /**
         * Constructs a RequestResponsePair with the specified parameters.
         * 
         * @param requestId Unique identifier for this request
         * @param endpoint The endpoint path that was requested
         * @param expectedResponse The expected response body for this endpoint
         * @param response The actual HTTP response received
         */
        RequestResponsePair(int requestId, String endpoint, String expectedResponse, Response response) {
            this.requestId = requestId;
            this.endpoint = endpoint;
            this.expectedResponse = expectedResponse;
            this.response = response;
        }
    }
}

