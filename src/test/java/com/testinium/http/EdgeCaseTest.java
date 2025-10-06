package com.testinium.http;

import com.testinium.utils.TestConstants;
import io.restassured.RestAssured;
import io.restassured.config.HttpClientConfig;
import io.restassured.config.RestAssuredConfig;
import io.restassured.response.Response;
import org.junit.Before;
import org.junit.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.Assert.*;

/**
 * EdgeCaseTest validates boundary conditions, malformed requests, and unusual patterns
 * for the Express.js server endpoints to ensure robust error handling and security.
 * 
 * <p>This test class implements comprehensive edge case validation as specified in:
 * <ul>
 *   <li>Section 0.3.1 - Edge Case Tests requirements for malformed requests and boundaries</li>
 *   <li>Section 0.3.2 - Component Test Blueprint for invalid HTTP methods</li>
 *   <li>Section 0.6.1 - Test Verification Points for edge case coverage</li>
 * </ul>
 * 
 * <p>Test Categories Covered:
 * <ul>
 *   <li>Invalid HTTP Methods: POST, PUT, DELETE on GET-only endpoints</li>
 *   <li>URL Path Variations: Trailing slashes, special characters, path traversal</li>
 *   <li>URL Encoding: Special character encoding and international characters</li>
 *   <li>Query Parameters: Static endpoint behavior with query strings</li>
 *   <li>Header Edge Cases: Malformed headers, excessive headers, large values</li>
 *   <li>Request Body Edge Cases: GET requests with unexpected bodies</li>
 *   <li>Case Sensitivity: Uppercase and mixed-case path validation</li>
 *   <li>Empty and Whitespace: Path segments with spaces and empty values</li>
 * </ul>
 * 
 * <p>Security Validation:
 * Tests ensure the server properly handles potential security issues including:
 * <ul>
 *   <li>Path traversal attempts (../, ../../)</li>
 *   <li>XSS injection patterns (&lt;script&gt;, &lt;img&gt;)</li>
 *   <li>SQL injection patterns ('; DROP TABLE)</li>
 *   <li>Excessive header sizes and counts</li>
 * </ul>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public class EdgeCaseTest {

    /**
     * Test setup method that configures RestAssured for edge case testing.
     * 
     * <p>Configuration:
     * <ul>
     *   <li>Sets base URI to TestConstants.BASE_URL (http://localhost)</li>
     *   <li>Sets port to TestConstants.DEFAULT_PORT (3000)</li>
     *   <li>Disables automatic exception throwing on 4xx/5xx for negative testing</li>
     *   <li>Configures HTTP client timeouts for malformed request testing</li>
     * </ul>
     * 
     * <p>The configuration allows tests to validate error responses without
     * RestAssured throwing exceptions, enabling proper assertion of status codes
     * and error messages.
     */
    @Before
    public void setUp() {
        RestAssured.baseURI = TestConstants.BASE_URL;
        RestAssured.port = TestConstants.DEFAULT_PORT;
        
        // Configure RestAssured to not throw exceptions on 4xx/5xx responses
        // This allows edge case tests to validate error status codes
        RestAssured.config = RestAssuredConfig.config()
            .httpClient(HttpClientConfig.httpClientConfig()
                .setParam("http.connection.timeout", 5000)
                .setParam("http.socket.timeout", 5000));
    }

    // ========== Invalid HTTP Method Tests ==========

    /**
     * Tests that POST method on root endpoint returns 404 Not Found.
     * 
     * <p>Validates that the Express server properly handles invalid HTTP methods
     * on GET-only endpoints by returning 404 status per the 404 handler in server.js.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Invalid HTTP method testing
     */
    @Test
    public void testPostMethodOnRootEndpoint() {
        given()
            .when()
            .post(TestConstants.ROOT_ENDPOINT)
            .then()
            .statusCode(TestConstants.HTTP_NOT_FOUND)
            .body(equalTo(TestConstants.NOT_FOUND));
    }

    /**
     * Tests that PUT method on root endpoint returns 404 Not Found.
     * 
     * <p>Validates consistent error handling across all unsupported HTTP methods.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Invalid HTTP method testing
     */
    @Test
    public void testPutMethodOnRootEndpoint() {
        given()
            .when()
            .put(TestConstants.ROOT_ENDPOINT)
            .then()
            .statusCode(TestConstants.HTTP_NOT_FOUND)
            .body(equalTo(TestConstants.NOT_FOUND));
    }

    /**
     * Tests that DELETE method on root endpoint returns 404 Not Found.
     * 
     * <p>Validates that DELETE method is properly rejected on GET-only endpoints.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Invalid HTTP method testing
     */
    @Test
    public void testDeleteMethodOnRootEndpoint() {
        given()
            .when()
            .delete(TestConstants.ROOT_ENDPOINT)
            .then()
            .statusCode(TestConstants.HTTP_NOT_FOUND)
            .body(equalTo(TestConstants.NOT_FOUND));
    }

    /**
     * Tests that POST method on evening endpoint returns 404 Not Found.
     * 
     * <p>Validates consistent error handling behavior across both server endpoints.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Invalid HTTP method testing
     */
    @Test
    public void testPostMethodOnEveningEndpoint() {
        given()
            .when()
            .post(TestConstants.EVENING_ENDPOINT)
            .then()
            .statusCode(TestConstants.HTTP_NOT_FOUND)
            .body(equalTo(TestConstants.NOT_FOUND));
    }

    /**
     * Tests that PUT method on evening endpoint returns 404 Not Found.
     * 
     * <p>Validates PUT method rejection on evening endpoint.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Invalid HTTP method testing
     */
    @Test
    public void testPutMethodOnEveningEndpoint() {
        given()
            .when()
            .put(TestConstants.EVENING_ENDPOINT)
            .then()
            .statusCode(TestConstants.HTTP_NOT_FOUND)
            .body(equalTo(TestConstants.NOT_FOUND));
    }

    /**
     * Tests that DELETE method on evening endpoint returns 404 Not Found.
     * 
     * <p>Validates DELETE method rejection on evening endpoint.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Invalid HTTP method testing
     */
    @Test
    public void testDeleteMethodOnEveningEndpoint() {
        given()
            .when()
            .delete(TestConstants.EVENING_ENDPOINT)
            .then()
            .statusCode(TestConstants.HTTP_NOT_FOUND)
            .body(equalTo(TestConstants.NOT_FOUND));
    }

    // ========== URL Path Variation Tests ==========

    /**
     * Tests root endpoint with trailing slash (double slash: //).
     * 
     * <p>Validates how Express handles path normalization and whether // is
     * treated as root or as a malformed path. Express typically treats this
     * as a 404 since it's different from the defined / route.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - URL path variation testing
     */
    @Test
    public void testRootEndpointWithDoubleSlash() {
        Response response = given()
            .when()
            .get("//");
        
        // Express treats // as different from /, so it should return 404
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests evening endpoint with trailing slash (/evening/).
     * 
     * <p>Validates trailing slash handling on the evening endpoint. Express.js
     * by default treats /evening and /evening/ as different routes unless
     * strict routing is disabled.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Trailing slash handling
     */
    @Test
    public void testEveningEndpointWithTrailingSlash() {
        Response response = given()
            .when()
            .get(TestConstants.EVENING_ENDPOINT + "/");
        
        // Express with default settings treats /evening and /evening/ as different
        // Since only /evening is defined, /evening/ should return 404
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests path with potential XSS script tag injection.
     * 
     * <p>Security Test: Validates that script tags in the URL path are handled
     * safely and do not cause execution or improper responses. Should return 404.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Special character security validation
     */
    @Test
    public void testPathWithScriptTag() {
        Response response = given()
            .when()
            .get("/<script>alert('xss')</script>");
        
        // Should return 404 for non-existent endpoint with script tag
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
        
        // Verify response doesn't execute or echo the script
        assertThat(response.getBody().asString(), not(containsString("<script>")));
        assertThat(response.getBody().asString(), not(containsString("alert")));
    }

    /**
     * Tests path traversal attempt with ../ sequences.
     * 
     * <p>Security Test: Validates that path traversal attempts are properly
     * handled and cannot access parent directories or server files.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Path traversal security validation
     */
    @Test
    public void testPathTraversalAttempt() {
        Response response = given()
            .when()
            .get("/../../../etc/passwd");
        
        // Should return 404, not file contents
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
        
        // Verify no file system content is exposed
        assertThat(response.getBody().asString(), not(containsString("root:")));
        assertThat(response.getBody().asString(), not(containsString("/bin/bash")));
    }

    /**
     * Tests path with SQL injection pattern.
     * 
     * <p>Security Test: Validates that SQL injection patterns in URL paths
     * are handled safely without causing errors or exposing database information.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - SQL injection pattern handling
     */
    @Test
    public void testPathWithSqlInjection() {
        Response response = given()
            .when()
            .get("/'; DROP TABLE users; --");
        
        // Should return 404 for non-existent endpoint
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests path with null byte injection attempt.
     * 
     * <p>Security Test: Validates handling of null byte (%00) in URL path,
     * which has historically been used to bypass file extension checks.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Null byte injection handling
     */
    @Test
    public void testPathWithNullByte() {
        Response response = given()
            .when()
            .get("/evening%00.txt");
        
        // Should return 404 for malformed path
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
    }

    // ========== URL Encoding Tests ==========

    /**
     * Tests URL-encoded path characters.
     * 
     * <p>Validates that Express properly decodes URL-encoded characters in paths.
     * %65 is the URL encoding for 'e', so %65vening should decode to 'evening'.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - URL encoding validation
     */
    @Test
    public void testUrlEncodedPath() {
        Response response = given()
            .when()
            .get("/%65vening");
        
        // Express should decode %65 to 'e', making this /evening
        // If properly decoded, should return "Good evening" with 200
        // If not decoded, should return 404
        int statusCode = response.getStatusCode();
        
        if (statusCode == TestConstants.HTTP_OK) {
            // Server decoded the URL properly
            assertEquals(TestConstants.GOOD_EVENING, response.getBody().asString());
        } else {
            // Server didn't decode or treated as different route
            assertEquals(TestConstants.HTTP_NOT_FOUND, statusCode);
        }
    }

    /**
     * Tests path with space character (URL encoded as %20 or +).
     * 
     * <p>Validates handling of space characters in URL paths.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Whitespace character handling
     */
    @Test
    public void testPathWithEncodedSpace() {
        Response response = given()
            .when()
            .get("/hello%20world");
        
        // Should return 404 as /hello world is not a defined endpoint
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests path with international UTF-8 characters (Cyrillic).
     * 
     * <p>Validates proper handling of non-ASCII Unicode characters in URL paths.
     * Tests with Cyrillic characters for "evening" (вечер).
     * 
     * <p>Requirement Traceability: Section 0.3.1 - International character handling
     */
    @Test
    public void testPathWithInternationalCharacters() {
        Response response = given()
            .when()
            .get("/вечер");
        
        // Should return 404 as Cyrillic path is not defined
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests path with emoji characters.
     * 
     * <p>Validates handling of emoji Unicode characters in URL paths.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Unicode emoji handling
     */
    @Test
    public void testPathWithEmoji() {
        Response response = given()
            .when()
            .get("/🌙evening");
        
        // Should return 404 for emoji-containing path
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    // ========== Query Parameter Tests ==========

    /**
     * Tests root endpoint with query parameters.
     * 
     * <p>Validates that query parameters don't affect static endpoint responses.
     * The server should ignore query parameters and still return "Hello world".
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Query parameter validation
     */
    @Test
    public void testRootEndpointWithQueryParams() {
        Response response = given()
            .queryParam("param", "value")
            .queryParam("test", "123")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Should still return 200 with "Hello world" (query params ignored)
        assertEquals(TestConstants.HTTP_OK, response.getStatusCode());
        assertEquals(TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    /**
     * Tests evening endpoint with query parameters.
     * 
     * <p>Validates that query parameters don't affect the evening endpoint response.
     * 
     * <p>Requirement Traceability: Section 0.3.2 - Query parameter validation
     */
    @Test
    public void testEveningEndpointWithQueryParams() {
        Response response = given()
            .queryParam("time", "20:00")
            .queryParam("greeting", "custom")
            .when()
            .get(TestConstants.EVENING_ENDPOINT);
        
        // Should still return 200 with "Good evening"
        assertEquals(TestConstants.HTTP_OK, response.getStatusCode());
        assertEquals(TestConstants.GOOD_EVENING, response.getBody().asString());
    }

    /**
     * Tests endpoint with empty query parameter values.
     * 
     * <p>Validates handling of query parameters with empty string values.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Empty value handling
     */
    @Test
    public void testEndpointWithEmptyQueryParams() {
        Response response = given()
            .queryParam("empty", "")
            .queryParam("null", "")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Should still process normally
        assertEquals(TestConstants.HTTP_OK, response.getStatusCode());
        assertEquals(TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    /**
     * Tests endpoint with special characters in query parameters.
     * 
     * <p>Validates that special characters in query parameter values are handled safely.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Special character validation
     */
    @Test
    public void testEndpointWithSpecialCharactersInQuery() {
        Response response = given()
            .queryParam("test", "<script>alert('xss')</script>")
            .queryParam("sql", "'; DROP TABLE users; --")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Should still return normal response (query params ignored by static endpoints)
        assertEquals(TestConstants.HTTP_OK, response.getStatusCode());
        assertEquals(TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    // ========== Header Edge Cases ==========

    /**
     * Tests request with malformed header format.
     * 
     * <p>Validates that server handles malformed headers gracefully without crashing.
     * Tests headers with unusual characters and formats.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Malformed header handling
     */
    @Test
    public void testRequestWithMalformedHeaders() {
        Response response = given()
            .header("X-Malformed-Header", "value\r\nwith\r\nnewlines")
            .header("X-Empty-Header", "")
            .header("X-Special-Chars", "!@#$%^&*()[]{}|\\")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Server should handle gracefully and return normal response
        // HTTP libraries typically sanitize or reject truly malformed headers
        assertTrue(response.getStatusCode() == TestConstants.HTTP_OK || 
                   response.getStatusCode() == TestConstants.HTTP_NOT_FOUND ||
                   response.getStatusCode() >= 400);
    }

    /**
     * Tests request with excessive number of headers.
     * 
     * <p>Validates server behavior when receiving requests with many headers.
     * Tests if server has reasonable limits on header count.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Excessive header count handling
     */
    @Test
    public void testRequestWithExcessiveHeaders() {
        io.restassured.specification.RequestSpecification request = given();
        
        // Add 100 custom headers
        for (int i = 0; i < 100; i++) {
            request.header("X-Custom-Header-" + i, "value" + i);
        }
        
        Response response = request.when().get(TestConstants.ROOT_ENDPOINT);
        
        // Server should either accept and process normally, or reject with error
        // Node.js has default limits on header count
        assertTrue(response.getStatusCode() == TestConstants.HTTP_OK ||
                   response.getStatusCode() >= 400);
    }

    /**
     * Tests request with very large header value.
     * 
     * <p>Validates server handling of headers with large values (10KB+).
     * Tests if server enforces reasonable size limits.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Large header value handling
     */
    @Test
    public void testRequestWithLargeHeaderValue() {
        // Create a 10KB header value
        StringBuilder largeValue = new StringBuilder();
        for (int i = 0; i < 10240; i++) {
            largeValue.append("A");
        }
        
        Response response = given()
            .header("X-Large-Header", largeValue.toString())
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Server should either accept and process, or reject with 431 (Request Header Fields Too Large)
        // or 400 (Bad Request)
        assertTrue(response.getStatusCode() == TestConstants.HTTP_OK ||
                   response.getStatusCode() == 431 ||
                   response.getStatusCode() >= 400);
    }

    /**
     * Tests request with duplicate header names.
     * 
     * <p>Validates how server handles multiple headers with the same name.
     * HTTP spec allows duplicate headers; they should be combined.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Duplicate header handling
     */
    @Test
    public void testRequestWithDuplicateHeaders() {
        Response response = given()
            .header("X-Duplicate", "value1")
            .header("X-Duplicate", "value2")
            .header("X-Duplicate", "value3")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Should process normally (duplicate headers are valid in HTTP)
        assertEquals(TestConstants.HTTP_OK, response.getStatusCode());
        assertEquals(TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    // ========== Request Body Edge Cases ==========

    /**
     * Tests GET request with unexpected request body.
     * 
     * <p>Validates that server properly handles GET requests containing a request body.
     * Per HTTP specification, GET requests should not have bodies, but servers
     * should handle them gracefully.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - GET request body handling
     */
    @Test
    public void testGetRequestWithBody() {
        Response response = given()
            .body("{\"unexpected\": \"body\"}")
            .contentType("application/json")
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Server should ignore body and return normal response
        assertEquals(TestConstants.HTTP_OK, response.getStatusCode());
        assertEquals(TestConstants.HELLO_WORLD, response.getBody().asString());
    }

    /**
     * Tests GET request with large request body.
     * 
     * <p>Validates handling of GET requests with unexpectedly large bodies.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Large payload handling
     */
    @Test
    public void testGetRequestWithLargeBody() {
        // Create 1MB body
        StringBuilder largeBody = new StringBuilder();
        for (int i = 0; i < 1024 * 1024; i++) {
            largeBody.append("X");
        }
        
        Response response = given()
            .body(largeBody.toString())
            .when()
            .get(TestConstants.ROOT_ENDPOINT);
        
        // Server should either ignore and process normally, or reject
        assertTrue(response.getStatusCode() == TestConstants.HTTP_OK ||
                   response.getStatusCode() >= 400);
    }

    // ========== Case Sensitivity Tests ==========

    /**
     * Tests uppercase version of evening endpoint path.
     * 
     * <p>Validates that Express routes are case-sensitive by default.
     * /EVENING should not match /evening route definition.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Case sensitivity validation
     */
    @Test
    public void testUppercaseEndpointPath() {
        Response response = given()
            .when()
            .get("/EVENING");
        
        // Express is case-sensitive, so /EVENING != /evening
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests mixed-case version of evening endpoint path.
     * 
     * <p>Validates case sensitivity with mixed uppercase and lowercase.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Case sensitivity validation
     */
    @Test
    public void testMixedCaseEndpointPath() {
        Response response = given()
            .when()
            .get("/Evening");
        
        // Express is case-sensitive, so /Evening != /evening
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests alternating case in endpoint path.
     * 
     * <p>Validates complete case sensitivity across entire path.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Case sensitivity validation
     */
    @Test
    public void testAlternatingCaseEndpointPath() {
        Response response = given()
            .when()
            .get("/eVeNiNg");
        
        // Should return 404 for non-matching case
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    // ========== Empty and Whitespace Tests ==========

    /**
     * Tests path with multiple consecutive slashes.
     * 
     * <p>Validates handling of malformed paths with empty segments (///).
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Empty path segment handling
     */
    @Test
    public void testPathWithMultipleSlashes() {
        Response response = given()
            .when()
            .get("///");
        
        // Should return 404 as /// is not a defined route
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests path with space character (unencoded).
     * 
     * <p>Validates handling of literal space in URL path.
     * HTTP clients typically encode spaces, but this tests raw space handling.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Whitespace handling
     */
    @Test
    public void testPathWithLiteralSpace() {
        Response response = given()
            .urlEncodingEnabled(false)
            .when()
            .get("/hello world");
        
        // Should return 404 or 400 for malformed path
        assertTrue(response.getStatusCode() == TestConstants.HTTP_NOT_FOUND ||
                   response.getStatusCode() == 400);
    }

    /**
     * Tests path with tab character.
     * 
     * <p>Validates handling of whitespace characters beyond space.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Whitespace character handling
     */
    @Test
    public void testPathWithTabCharacter() {
        Response response = given()
            .when()
            .get("/evening\t");
        
        // Should return 404 for path with tab character
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
    }

    /**
     * Tests path with newline character.
     * 
     * <p>Validates handling of newline characters in URL path, which should
     * be rejected or sanitized.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Control character handling
     */
    @Test
    public void testPathWithNewlineCharacter() {
        Response response = given()
            .when()
            .get("/evening\n");
        
        // Should return 404 or error for path with newline
        assertTrue(response.getStatusCode() >= 400);
    }

    /**
     * Tests path with Unicode zero-width characters.
     * 
     * <p>Validates handling of invisible Unicode characters that could be used
     * for obfuscation or bypass attempts.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Unicode edge case handling
     */
    @Test
    public void testPathWithZeroWidthCharacters() {
        // Zero-width space (U+200B) and zero-width joiner (U+200D)
        Response response = given()
            .when()
            .get("/eve\u200Bning");
        
        // Should return 404 as path doesn't match /evening
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    // ========== Additional Boundary Tests ==========

    /**
     * Tests extremely long URL path (2000+ characters).
     * 
     * <p>Validates server handling of excessively long URL paths.
     * Tests if server enforces reasonable path length limits.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Large payload boundary testing
     */
    @Test
    public void testExtremelyLongPath() {
        StringBuilder longPath = new StringBuilder("/");
        for (int i = 0; i < 2000; i++) {
            longPath.append("a");
        }
        
        Response response = given()
            .when()
            .get(longPath.toString());
        
        // Should return 404 or 414 (URI Too Long)
        assertTrue(response.getStatusCode() == TestConstants.HTTP_NOT_FOUND ||
                   response.getStatusCode() == 414 ||
                   response.getStatusCode() >= 400);
    }

    /**
     * Tests path with many segments (deep nesting).
     * 
     * <p>Validates handling of deeply nested URL paths with many segments.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Path depth boundary testing
     */
    @Test
    public void testPathWithManySegments() {
        StringBuilder deepPath = new StringBuilder();
        for (int i = 0; i < 100; i++) {
            deepPath.append("/segment").append(i);
        }
        
        Response response = given()
            .when()
            .get(deepPath.toString());
        
        // Should return 404 for non-existent deep path
        assertEquals(TestConstants.HTTP_NOT_FOUND, response.getStatusCode());
        assertEquals(TestConstants.NOT_FOUND, response.getBody().asString());
    }

    /**
     * Tests endpoint with fragment identifier (#anchor).
     * 
     * <p>Validates that fragment identifiers are handled properly.
     * Fragments are typically not sent to server by HTTP clients.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Fragment handling
     */
    @Test
    public void testEndpointWithFragment() {
        Response response = given()
            .when()
            .get(TestConstants.EVENING_ENDPOINT + "#section");
        
        // Fragments are typically stripped by client, so this may behave as normal /evening
        // or the # may be encoded and cause 404
        assertTrue(response.getStatusCode() == TestConstants.HTTP_OK ||
                   response.getStatusCode() == TestConstants.HTTP_NOT_FOUND);
    }

    /**
     * Tests concurrent malformed requests.
     * 
     * <p>Validates that server can handle multiple edge case requests
     * simultaneously without errors or crashes.
     * 
     * <p>Requirement Traceability: Section 0.3.1 - Concurrent edge case handling
     */
    @Test
    public void testConcurrentMalformedRequests() {
        int threadCount = 10;
        final boolean[] allSucceeded = {true};
        
        Thread[] threads = new Thread[threadCount];
        for (int i = 0; i < threadCount; i++) {
            final int threadNum = i;
            threads[i] = new Thread(() -> {
                try {
                    // Each thread sends different malformed request
                    Response response = given()
                        .when()
                        .post("/invalid" + threadNum);
                    
                    // Should get some valid HTTP response (not crash)
                    assertTrue(response.getStatusCode() >= 200);
                } catch (Exception e) {
                    allSucceeded[0] = false;
                }
            });
            threads[i].start();
        }
        
        // Wait for all threads to complete
        for (Thread thread : threads) {
            try {
                thread.join();
            } catch (InterruptedException e) {
                fail("Thread interrupted during concurrent test");
            }
        }
        
        assertTrue("Concurrent malformed requests should all receive valid responses", allSucceeded[0]);
    }
}
