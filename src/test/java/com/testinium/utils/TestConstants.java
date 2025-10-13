package com.testinium.utils;

/**
 * TestConstants provides shared configuration values and expected responses for all Java-based HTTP integration tests.
 * This class defines constants for server URLs, ports, performance thresholds, response strings, and HTTP status codes
 * that are used across ServerEndpointTest, ErrorHandlingTest, PerformanceTest, and other test classes.
 * 
 * <p>All constants are derived from functional requirements specified in the technical specification:
 * <ul>
 *   <li>F-001: Root endpoint "/" requirements</li>
 *   <li>F-002: Evening endpoint "/evening" requirements</li>
 *   <li>F-003: Request logging requirements</li>
 *   <li>F-004: Error handling requirements</li>
 *   <li>F-005: Port configuration requirements</li>
 * </ul>
 * 
 * <p>This class is final and has a private constructor to prevent instantiation.
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public final class TestConstants {

    /**
     * Base URL for the Node.js Express server under test.
     * Value: "http://localhost"
     * 
     * <p>Requirement Traceability: Section 0.4.2 - Base URL specification
     */
    public static final String BASE_URL = "http://localhost";

    /**
     * Default port number for the Express server as configured in server.js.
     * Value: 3000
     * 
     * <p>Requirement Traceability: F-005-RQ-002 - Default server port configuration
     */
    public static final int DEFAULT_PORT = 3000;

    /**
     * Alternative port number for testing port configuration scenarios.
     * Value: 8080
     * 
     * <p>Requirement Traceability: Section 0.4.2 - Alternative port testing
     */
    public static final int TEST_PORT = 8080;

    /**
     * Complete base URL including the default port.
     * Value: "http://localhost:3000"
     * 
     * <p>This is the primary URL used for most test cases.
     */
    public static final String BASE_URL_WITH_PORT = BASE_URL + ":" + DEFAULT_PORT;

    /**
     * Maximum acceptable response time in milliseconds for HTTP requests.
     * Value: 10 milliseconds
     * 
     * <p>Requirement Traceability: 
     * <ul>
     *   <li>F-001-RQ-003 - Root endpoint performance requirement</li>
     *   <li>F-002-RQ-003 - Evening endpoint performance requirement</li>
     * </ul>
     */
    public static final int RESPONSE_TIME_THRESHOLD_MS = 10;

    /**
     * Number of concurrent requests to use in concurrency testing.
     * Value: 100
     * 
     * <p>Used to validate the server can handle multiple simultaneous requests
     * without degradation in performance or correctness.
     */
    public static final int CONCURRENT_REQUEST_COUNT = 100;

    /**
     * Duration in seconds for sustained load testing scenarios.
     * Value: 30 seconds
     * 
     * <p>Used to validate server stability and performance consistency under prolonged load.
     */
    public static final int LOAD_TEST_DURATION_SECONDS = 30;

    /**
     * Maximum time in milliseconds to wait for server startup.
     * Value: 10000 milliseconds (10 seconds)
     * 
     * <p>Used in ServerLifecycleTest to ensure server initialization completes within acceptable timeframe.
     */
    public static final int SERVER_STARTUP_TIMEOUT_MS = 10000;

    /**
     * Maximum time in milliseconds to wait for server shutdown.
     * Value: 5000 milliseconds (5 seconds)
     * 
     * <p>Used in ServerLifecycleTest to ensure graceful server termination.
     */
    public static final int SERVER_SHUTDOWN_TIMEOUT_MS = 5000;

    /**
     * Expected response body for the root endpoint GET /.
     * Value: "Hello world"
     * 
     * <p>Requirement Traceability: F-001-RQ-001 - Root endpoint acceptance criteria
     */
    public static final String HELLO_WORLD = "Hello world";

    /**
     * Expected response body for the evening endpoint GET /evening.
     * Value: "Good evening"
     * 
     * <p>Requirement Traceability: F-002-RQ-001 - Evening endpoint acceptance criteria
     */
    public static final String GOOD_EVENING = "Good evening";

    /**
     * Expected error message for 404 Not Found responses.
     * Value: "Not Found"
     * 
     * <p>Requirement Traceability: F-004-RQ-001 - 404 error handling acceptance criteria
     */
    public static final String NOT_FOUND = "Not Found";

    /**
     * Expected error message for 500 Internal Server Error responses.
     * Value: "Internal Server Error"
     * 
     * <p>Requirement Traceability: F-004-RQ-002 - 500 error handling acceptance criteria
     */
    public static final String INTERNAL_ERROR = "Internal Server Error";

    /**
     * Content-Type header value for HTML responses.
     * Value: "text/html; charset=utf-8"
     * 
     * <p>Used to validate HTTP response headers contain proper content type information.
     */
    public static final String CONTENT_TYPE_TEXT_HTML = "text/html; charset=utf-8";

    /**
     * Content-Type header value for plain text responses.
     * Value: "text/plain; charset=utf-8"
     * 
     * <p>Alternative content type that may be used by the Express server.
     */
    public static final String CONTENT_TYPE_TEXT_PLAIN = "text/plain; charset=utf-8";

    /**
     * HTTP status code for successful requests.
     * Value: 200
     * 
     * <p>Expected status code for GET / and GET /evening endpoints.
     */
    public static final int HTTP_OK = 200;

    /**
     * HTTP status code for not found errors.
     * Value: 404
     * 
     * <p>Expected status code when requesting non-existent endpoints.
     * Requirement Traceability: F-004-RQ-001
     */
    public static final int HTTP_NOT_FOUND = 404;

    /**
     * HTTP status code for internal server errors.
     * Value: 500
     * 
     * <p>Expected status code when server encounters unhandled exceptions.
     * Requirement Traceability: F-004-RQ-002
     */
    public static final int HTTP_INTERNAL_ERROR = 500;

    /**
     * URL path for the root endpoint.
     * Value: "/"
     * 
     * <p>Requirement Traceability: F-001 - Root endpoint specification
     */
    public static final String ROOT_ENDPOINT = "/";

    /**
     * URL path for the evening endpoint.
     * Value: "/evening"
     * 
     * <p>Requirement Traceability: F-002 - Evening endpoint specification
     */
    public static final String EVENING_ENDPOINT = "/evening";

    /**
     * URL path for a non-existent endpoint used in error handling tests.
     * Value: "/nonexistent"
     * 
     * <p>Used to validate 404 error handling behavior.
     */
    public static final String NONEXISTENT_ENDPOINT = "/nonexistent";

    /**
     * Private constructor to prevent instantiation of this utility class.
     * 
     * @throws UnsupportedOperationException if instantiation is attempted via reflection
     */
    private TestConstants() {
        throw new UnsupportedOperationException("TestConstants is a utility class and should not be instantiated");
    }
}
