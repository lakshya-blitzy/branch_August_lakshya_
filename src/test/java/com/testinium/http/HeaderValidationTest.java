package com.testinium.http;

import com.testinium.utils.TestConstants;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.anyOf;

/**
 * HeaderValidationTest validates HTTP response headers from the Express.js server.
 * 
 * <p>This test class verifies that the Express server at server.js sets correct HTTP headers
 * for all endpoints, ensuring compliance with HTTP/1.1 standards and application requirements.
 * 
 * <p>Test Coverage:
 * <ul>
 *   <li>Content-Type header validation per F-001-RQ-002 and F-002-RQ-002</li>
 *   <li>HTTP status code and status line format verification</li>
 *   <li>Express default headers (X-Powered-By, Connection, etc.)</li>
 *   <li>Content-Length header accuracy</li>
 *   <li>Date header presence and format</li>
 *   <li>Header case-insensitivity per HTTP specification</li>
 *   <li>Custom header handling and processing</li>
 *   <li>Mandatory HTTP/1.1 header completeness</li>
 * </ul>
 * 
 * <p>Requirements Traceability:
 * <ul>
 *   <li>F-001-RQ-002: GET / endpoint must set appropriate Content-Type header</li>
 *   <li>F-002-RQ-002: GET /evening endpoint must set appropriate Content-Type header</li>
 *   <li>HTTP/1.1 RFC 2616: All responses must include proper headers</li>
 * </ul>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public class HeaderValidationTest {

    /**
     * Test setup method executed before each test.
     * Configures RestAssured with the base URL and port from TestConstants.
     */
    @Before
    public void setUp() {
        RestAssured.baseURI = TestConstants.BASE_URL;
        RestAssured.port = TestConstants.DEFAULT_PORT;
    }

    /**
     * Test: Validates Content-Type header for GET / endpoint.
     * 
     * <p>Requirement: F-001-RQ-002 - Root endpoint must set appropriate Content-Type header.
     * 
     * <p>Expected Behavior:
     * Express.js res.send() sets Content-Type to "text/html; charset=utf-8" by default
     * for string responses.
     * 
     * <p>Assertions:
     * - Content-Type header is present
     * - Content-Type contains "text/html" or matches HTML content type
     * - Charset utf-8 is included in Content-Type
     */
    @Test
    public void testRootEndpointContentType() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Verify Content-Type header is present and not null
        String contentType = response.getHeader("Content-Type");
        Assert.assertNotNull("Content-Type header should be present", contentType);

        // Verify Content-Type is text/html with charset=utf-8 (Express default for res.send())
        Assert.assertThat("Content-Type should be text/html with charset",
            contentType,
            containsString("text/html"));
        Assert.assertThat("Content-Type should include charset=utf-8",
            contentType,
            containsString("charset=utf-8"));

        // Alternative verification using RestAssured ContentType matcher
        response.then().contentType(ContentType.HTML);
    }

    /**
     * Test: Validates Content-Type header for GET /evening endpoint.
     * 
     * <p>Requirement: F-002-RQ-002 - Evening endpoint must set appropriate Content-Type header.
     * 
     * <p>Expected Behavior:
     * The /evening endpoint should return the same Content-Type as the root endpoint
     * since both use res.send() with string values.
     * 
     * <p>Assertions:
     * - Content-Type header is present
     * - Content-Type is properly formatted
     * - Charset utf-8 is included
     */
    @Test
    public void testEveningEndpointContentType() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.EVENING_ENDPOINT);

        // Verify Content-Type header exists
        String contentType = response.getHeader("Content-Type");
        Assert.assertNotNull("Content-Type header should be present for /evening endpoint", contentType);

        // Verify Content-Type is text/html or text/plain with charset
        Assert.assertThat("Content-Type should include charset=utf-8",
            contentType,
            containsString("charset=utf-8"));

        // Verify it's HTML content type (Express res.send() sets text/html for strings)
        // Same as root endpoint since both use res.send() with string values
        response.then().contentType(ContentType.HTML);
    }

    /**
     * Test: Validates Content-Type consistency across endpoints.
     * 
     * <p>Both GET / and GET /evening use Express res.send() method, so they should
     * return identical Content-Type headers for consistency.
     * 
     * <p>Assertions:
     * - Both endpoints return the same Content-Type format
     * - Content-Type values are consistent
     */
    @Test
    public void testContentTypeConsistency() {
        Response rootResponse = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        Response eveningResponse = RestAssured
            .given()
            .when()
            .get(TestConstants.EVENING_ENDPOINT);

        String rootContentType = rootResponse.getHeader("Content-Type");
        String eveningContentType = eveningResponse.getHeader("Content-Type");

        Assert.assertNotNull("Root endpoint Content-Type should not be null", rootContentType);
        Assert.assertNotNull("Evening endpoint Content-Type should not be null", eveningContentType);

        // Both endpoints should use the same Content-Type format
        Assert.assertEquals("Content-Type headers should be consistent across endpoints",
            rootContentType, eveningContentType);
    }

    /**
     * Test: Validates HTTP 200 OK status code for successful requests.
     * 
     * <p>Verifies that the status line contains "200 OK" and the status code
     * matches the expected value from TestConstants.HTTP_OK.
     * 
     * <p>Assertions:
     * - Status code equals 200
     * - Status line contains "200 OK"
     */
    @Test
    public void testSuccessStatusCode() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Verify status code is 200
        Assert.assertEquals("Status code should be 200 OK",
            TestConstants.HTTP_OK, response.getStatusCode());

        // Verify status line contains "200 OK"
        String statusLine = response.getStatusLine();
        Assert.assertNotNull("Status line should not be null", statusLine);
        Assert.assertThat("Status line should contain '200 OK'",
            statusLine, containsString("200 OK"));
    }

    /**
     * Test: Validates HTTP status line format compliance.
     * 
     * <p>Per HTTP/1.1 specification, status line format should be:
     * "HTTP/1.1 200 OK"
     * 
     * <p>Assertions:
     * - Status line starts with "HTTP/"
     * - Status line contains protocol version (1.0 or 1.1)
     * - Status line contains status code and reason phrase
     */
    @Test
    public void testStatusCodeFormat() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        String statusLine = response.getStatusLine();
        Assert.assertNotNull("Status line should not be null", statusLine);

        // Verify status line format: "HTTP/version code reason"
        Assert.assertThat("Status line should start with HTTP/",
            statusLine, containsString("HTTP/"));
        Assert.assertThat("Status line should contain 200 status code",
            statusLine, containsString("200"));
        Assert.assertThat("Status line should contain OK reason phrase",
            statusLine, containsString("OK"));
    }

    /**
     * Test: Validates Express X-Powered-By header.
     * 
     * <p>Express.js by default includes an "X-Powered-By: Express" header
     * in all responses to identify the framework.
     * 
     * <p>Assertions:
     * - X-Powered-By header is present
     * - X-Powered-By header value equals "Express"
     */
    @Test
    public void testXPoweredByHeader() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Express sets X-Powered-By: Express by default
        String xPoweredBy = response.getHeader("X-Powered-By");
        Assert.assertNotNull("X-Powered-By header should be present", xPoweredBy);
        Assert.assertEquals("X-Powered-By should be 'Express'", "Express", xPoweredBy);
    }

    /**
     * Test: Validates Connection header presence.
     * 
     * <p>HTTP/1.1 servers should include a Connection header indicating
     * whether the connection will be kept alive or closed.
     * 
     * <p>Assertions:
     * - Connection header is present
     * - Connection header value is either "keep-alive" or "close"
     */
    @Test
    public void testConnectionHeader() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        String connection = response.getHeader("Connection");
        Assert.assertNotNull("Connection header should be present", connection);

        // Connection should be either "keep-alive" or "close"
        Assert.assertThat("Connection header should be 'keep-alive' or 'close'",
            connection.toLowerCase(),
            anyOf(containsString("keep-alive"), containsString("close")));
    }

    /**
     * Test: Validates Content-Length header accuracy for GET / endpoint.
     * 
     * <p>Content-Length header should match the exact byte length of the response body.
     * For GET /, the body is "Hello world" (11 bytes).
     * 
     * <p>Assertions:
     * - Content-Length header is present
     * - Content-Length value matches actual body length
     * - Content-Length equals 11 for "Hello world"
     */
    @Test
    public void testContentLengthHeaderForRoot() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        String contentLength = response.getHeader("Content-Length");
        Assert.assertNotNull("Content-Length header should be present", contentLength);

        // "Hello world" is 11 characters/bytes
        int expectedLength = TestConstants.HELLO_WORLD.length();
        int actualLength = Integer.parseInt(contentLength);

        Assert.assertEquals("Content-Length should match body length for /",
            expectedLength, actualLength);
    }

    /**
     * Test: Validates Content-Length header accuracy for GET /evening endpoint.
     * 
     * <p>Content-Length header should match the exact byte length of the response body.
     * For GET /evening, the body is "Good evening" (12 bytes).
     * 
     * <p>Assertions:
     * - Content-Length header is present
     * - Content-Length value matches actual body length
     * - Content-Length equals 12 for "Good evening"
     */
    @Test
    public void testContentLengthHeaderForEvening() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.EVENING_ENDPOINT);

        String contentLength = response.getHeader("Content-Length");
        Assert.assertNotNull("Content-Length header should be present for /evening", contentLength);

        // "Good evening" is 12 characters/bytes
        int expectedLength = TestConstants.GOOD_EVENING.length();
        int actualLength = Integer.parseInt(contentLength);

        Assert.assertEquals("Content-Length should match body length for /evening",
            expectedLength, actualLength);
    }

    /**
     * Test: Validates custom request headers don't affect response headers.
     * 
     * <p>Sending custom headers in the request should not cause errors or
     * affect the standard response headers returned by the server.
     * 
     * <p>Assertions:
     * - Request with custom headers succeeds with 200 OK
     * - Response still contains all standard headers
     * - Custom request headers don't pollute response
     */
    @Test
    public void testCustomHeaderHandling() {
        Response response = RestAssured
            .given()
            .header("X-Custom-Header", "TestValue")
            .header("X-Test-Client", "RestAssured")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Request should succeed despite custom headers
        Assert.assertEquals("Custom headers should not affect request processing",
            TestConstants.HTTP_OK, response.getStatusCode());

        // Standard response headers should still be present
        Assert.assertNotNull("Content-Type should still be present", 
            response.getHeader("Content-Type"));
        Assert.assertNotNull("X-Powered-By should still be present", 
            response.getHeader("X-Powered-By"));

        // Response body should be correct
        Assert.assertEquals("Response body should be correct with custom headers",
            TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    /**
     * Test: Validates HTTP header case-insensitivity per RFC 2616.
     * 
     * <p>HTTP header names are case-insensitive according to HTTP/1.1 specification.
     * Servers and clients must treat "Content-Type", "content-type", and "CONTENT-TYPE"
     * as equivalent header names.
     * 
     * <p>Assertions:
     * - Header values are identical regardless of case used to access them
     * - All case variations return the same header value
     */
    @Test
    public void testHeaderCaseInsensitivity() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // HTTP header names are case-insensitive per RFC 2616
        String contentTypeLower = response.getHeader("content-type");
        String contentTypeMixed = response.getHeader("Content-Type");
        String contentTypeUpper = response.getHeader("CONTENT-TYPE");

        Assert.assertNotNull("content-type (lowercase) should be accessible", contentTypeLower);
        Assert.assertNotNull("Content-Type (mixed case) should be accessible", contentTypeMixed);
        Assert.assertNotNull("CONTENT-TYPE (uppercase) should be accessible", contentTypeUpper);

        // All case variations should return the same value
        Assert.assertEquals("Header should be case-insensitive (lower vs mixed)",
            contentTypeLower, contentTypeMixed);
        Assert.assertEquals("Header should be case-insensitive (mixed vs upper)",
            contentTypeMixed, contentTypeUpper);
    }

    /**
     * Test: Validates no authentication headers required for public endpoints.
     * 
     * <p>GET / and GET /evening are public endpoints that should not require
     * authentication. Requests without Authorization headers should succeed.
     * 
     * <p>Assertions:
     * - Request without Authorization header returns 200 OK
     * - No 401 Unauthorized response
     * - Response body is correct
     */
    @Test
    public void testNoAuthenticationHeaders() {
        // Request without any authentication headers
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Should return 200 OK, not 401 Unauthorized
        Assert.assertEquals("Public endpoint should not require authentication",
            TestConstants.HTTP_OK, response.getStatusCode());

        // Response should be correct
        Assert.assertEquals("Response body should be correct without auth headers",
            TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    /**
     * Test: Validates Date header presence in HTTP responses.
     * 
     * <p>HTTP/1.1 servers should include a Date header in all responses
     * per RFC 2616 Section 14.18.
     * 
     * <p>Assertions:
     * - Date header is present
     * - Date header is not null or empty
     */
    @Test
    public void testDateHeaderPresence() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        String dateHeader = response.getHeader("Date");
        Assert.assertNotNull("Date header should be present in HTTP response", dateHeader);
        Assert.assertTrue("Date header should not be empty",
            dateHeader != null && !dateHeader.trim().isEmpty());

        // Date header should be in HTTP-date format (RFC 2616)
        // Example: "Sun, 06 Nov 1994 08:49:37 GMT"
        // Verify it contains expected date components
        Assert.assertThat("Date header should be in proper format",
            dateHeader, containsString("GMT"));
    }

    /**
     * Test: Validates all mandatory HTTP/1.1 headers are present.
     * 
     * <p>Per HTTP/1.1 specification, certain headers are mandatory in responses.
     * This test ensures completeness of the HTTP response.
     * 
     * <p>Mandatory Headers Checked:
     * - Content-Type: Indicates the media type of the response body
     * - Content-Length: Indicates the size of the response body in bytes
     * - Date: Indicates when the response was generated
     * 
     * <p>Assertions:
     * - All mandatory headers are present
     * - No mandatory headers are null
     */
    @Test
    public void testMandatoryHeadersPresent() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Verify all mandatory HTTP/1.1 response headers are present
        Assert.assertThat("Content-Type header must be present",
            response.getHeader("Content-Type"), notNullValue());

        Assert.assertThat("Content-Length header must be present",
            response.getHeader("Content-Length"), notNullValue());

        Assert.assertThat("Date header must be present",
            response.getHeader("Date"), notNullValue());

        // Additional validation: all mandatory headers should have values
        Assert.assertTrue("Content-Type should have a value",
            !response.getHeader("Content-Type").trim().isEmpty());
        Assert.assertTrue("Content-Length should have a value",
            !response.getHeader("Content-Length").trim().isEmpty());
        Assert.assertTrue("Date should have a value",
            !response.getHeader("Date").trim().isEmpty());
    }

    /**
     * Test: Validates header values use proper encoding.
     * 
     * <p>HTTP header values should not contain invalid characters or
     * control characters that violate HTTP specification.
     * 
     * <p>Assertions:
     * - Header values don't contain line breaks or control characters
     * - Headers are properly formatted
     */
    @Test
    public void testHeaderValueEncoding() {
        Response response = RestAssured
            .given()
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        String contentType = response.getHeader("Content-Type");
        String xPoweredBy = response.getHeader("X-Powered-By");

        // Verify headers don't contain invalid characters
        Assert.assertFalse("Content-Type should not contain line breaks",
            contentType.contains("\n") || contentType.contains("\r"));
        Assert.assertFalse("X-Powered-By should not contain line breaks",
            xPoweredBy.contains("\n") || xPoweredBy.contains("\r"));

        // Verify headers are in valid ASCII range (printable characters)
        for (char c : contentType.toCharArray()) {
            Assert.assertTrue("Content-Type should contain valid characters",
                c >= 32 && c < 127 || c == 9); // Printable ASCII or tab
        }
    }

    /**
     * Test: Validates no header injection vulnerabilities.
     * 
     * <p>Sending malicious headers with CRLF injection attempts should not
     * pollute the response headers or allow header injection attacks.
     * 
     * <p>Assertions:
     * - Malicious headers don't inject additional response headers
     * - Response remains well-formed
     * - Server processes request normally
     */
    @Test
    public void testNoHeaderInjection() {
        // Attempt header injection with CRLF characters
        Response response = RestAssured
            .given()
            .header("X-Test", "value\r\nX-Injected: malicious")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);

        // Request should still succeed (or be rejected cleanly)
        // If it succeeds, verify no injected headers appear
        if (response.getStatusCode() == TestConstants.HTTP_OK) {
            // Verify the malicious header wasn't injected into response
            String injectedHeader = response.getHeader("X-Injected");
            Assert.assertNull("Injected header should not appear in response", injectedHeader);

            // Response should still be correct
            Assert.assertEquals("Response body should be normal despite injection attempt",
                TestConstants.HELLO_WORLD, response.getBody().asString());
        }

        // Either way, status code should be valid (200 or 400, not 500)
        int statusCode = response.getStatusCode();
        Assert.assertTrue("Status code should be valid (200 or 400, not 500)",
            statusCode == 200 || statusCode == 400);
    }
}
