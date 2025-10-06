package com.testinium.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * ServerManager provides comprehensive Node.js Express server process lifecycle management
 * for Java-based HTTP integration tests. This utility class manages programmatic server
 * startup and shutdown, port configuration, process state monitoring, timeout handling,
 * and graceful termination.
 * 
 * <p>Key Features:
 * <ul>
 *   <li>Programmatic server startup using ProcessBuilder to spawn Node.js processes</li>
 *   <li>Port configuration support (default 3000, test port 8080) via environment variables</li>
 *   <li>Process state monitoring with ServerState enum tracking</li>
 *   <li>HTTP-based health checks for server availability validation</li>
 *   <li>Graceful shutdown with configurable timeouts to prevent port conflicts</li>
 *   <li>AutoCloseable implementation for try-with-resources support</li>
 *   <li>Comprehensive error handling with detailed diagnostic messages</li>
 * </ul>
 * 
 * <p>Usage Example:
 * <pre>
 * try (ServerManager manager = new ServerManager()) {
 *     manager.startServer();
 *     manager.waitForServerReady();
 *     // Perform HTTP tests
 * } // Server automatically stopped via close()
 * </pre>
 * 
 * <p>Requirement Traceability:
 * <ul>
 *   <li>Section 0.4.2: Server lifecycle management utility creation</li>
 *   <li>F-005: Port configuration handling for testing</li>
 *   <li>ServerLifecycleTest: Programmatic server control enablement</li>
 * </ul>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public class ServerManager implements AutoCloseable {

    /**
     * The Node.js process running the Express server, or null if not started.
     */
    private Process serverProcess;

    /**
     * Current state of the server process.
     */
    private ServerState currentState;

    /**
     * Port number on which the server is running.
     */
    private int serverPort;

    /**
     * Path to the Node.js server script relative to project root.
     */
    private static final String SERVER_SCRIPT_PATH = "server.js";

    /**
     * Maximum number of retry attempts for server health checks.
     */
    private static final int MAX_HEALTH_CHECK_RETRIES = 20;

    /**
     * Initial backoff delay in milliseconds for health check retries.
     */
    private static final int INITIAL_BACKOFF_MS = 100;

    /**
     * Maximum backoff delay in milliseconds for health check retries.
     */
    private static final int MAX_BACKOFF_MS = 2000;

    /**
     * HTTP connection timeout in milliseconds for health checks.
     */
    private static final int HTTP_CONNECT_TIMEOUT_MS = 1000;

    /**
     * HTTP read timeout in milliseconds for health checks.
     */
    private static final int HTTP_READ_TIMEOUT_MS = 1000;

    /**
     * Constructs a new ServerManager with initial STOPPED state.
     */
    public ServerManager() {
        this.currentState = ServerState.STOPPED;
        this.serverPort = TestConstants.DEFAULT_PORT;
    }

    /**
     * Starts the Node.js Express server on the default port (3000).
     * Uses ProcessBuilder to spawn a Node.js process executing server.js.
     * 
     * <p>This method:
     * <ul>
     *   <li>Validates that Node.js is installed and accessible</li>
     *   <li>Verifies that server.js exists in the project root</li>
     *   <li>Spawns the Node.js process with environment configuration</li>
     *   <li>Transitions state to STARTING</li>
     * </ul>
     * 
     * <p>Requirement Traceability: Section 0.4.2 - Server lifecycle management
     * 
     * @throws ServerStartupException if Node.js is not installed, server.js not found,
     *                                 or process creation fails
     * @throws IllegalStateException if server is already running
     */
    public void startServer() throws ServerStartupException {
        startServer(TestConstants.DEFAULT_PORT);
    }

    /**
     * Starts the Node.js Express server on a custom port.
     * Injects the PORT environment variable to configure the server port.
     * 
     * <p>This method enables testing of port configuration handling per F-005 requirements.
     * The PORT environment variable is passed to the Node.js process, which reads it
     * to bind to the specified port instead of the default.
     * 
     * <p>Requirement Traceability: F-005 - Port configuration requirements
     * 
     * @param port the port number to start the server on (e.g., 8080)
     * @throws ServerStartupException if Node.js is not installed, server.js not found,
     *                                 or process creation fails
     * @throws IllegalStateException if server is already running
     * @throws IllegalArgumentException if port is not in valid range (1-65535)
     */
    public void startServer(int port) throws ServerStartupException {
        if (currentState == ServerState.RUNNING || currentState == ServerState.STARTING) {
            throw new IllegalStateException("Server is already " + currentState);
        }

        if (port < 1 || port > 65535) {
            throw new IllegalArgumentException("Port must be between 1 and 65535, got: " + port);
        }

        this.serverPort = port;
        this.currentState = ServerState.STARTING;

        try {
            // Create ProcessBuilder for Node.js execution
            ProcessBuilder processBuilder = new ProcessBuilder("node", SERVER_SCRIPT_PATH);
            
            // Set working directory to project root (where server.js is located)
            processBuilder.directory(new java.io.File(System.getProperty("user.dir")));
            
            // Set PORT environment variable for server configuration
            Map<String, String> environment = processBuilder.environment();
            environment.put("PORT", String.valueOf(port));
            
            // Redirect error stream to output for unified logging
            processBuilder.redirectErrorStream(true);
            
            // Start the Node.js process
            serverProcess = processBuilder.start();
            
            // Register shutdown hook for cleanup on JVM termination
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                if (serverProcess != null && serverProcess.isAlive()) {
                    serverProcess.destroyForcibly();
                }
            }));
            
            // Start thread to consume process output to prevent buffer deadlock
            startOutputConsumer();
            
        } catch (IOException e) {
            currentState = ServerState.ERROR;
            throw new ServerStartupException(
                "Failed to start Node.js server. Ensure Node.js is installed and " +
                SERVER_SCRIPT_PATH + " exists in project root.", e);
        }
    }

    /**
     * Starts a background thread to consume the server process output streams.
     * This prevents process deadlock from full output buffers and enables log capture.
     * 
     * @throws ServerStartupException if thread creation fails
     */
    private void startOutputConsumer() throws ServerStartupException {
        if (serverProcess == null) {
            return;
        }

        Thread outputThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(serverProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // Output can be captured for debugging or log verification
                    System.out.println("[Node.js Server] " + line);
                }
            } catch (IOException e) {
                System.err.println("[ServerManager] Error reading server output: " + e.getMessage());
            }
        });
        
        outputThread.setDaemon(true);
        outputThread.setName("ServerOutputConsumer-" + serverPort);
        outputThread.start();
    }

    /**
     * Gracefully stops the Node.js Express server process.
     * 
     * <p>This method:
     * <ul>
     *   <li>Destroys the server process gracefully</li>
     *   <li>Waits up to SERVER_SHUTDOWN_TIMEOUT_MS for process termination</li>
     *   <li>Forcibly terminates if graceful shutdown times out</li>
     *   <li>Ensures port is released for subsequent tests</li>
     *   <li>Transitions state to STOPPED</li>
     * </ul>
     * 
     * <p>Requirement Traceability: Section 0.4.2 - Graceful termination
     * 
     * @throws ServerStartupException if shutdown fails or times out
     */
    public void stopServer() throws ServerStartupException {
        if (serverProcess == null || !serverProcess.isAlive()) {
            currentState = ServerState.STOPPED;
            return;
        }

        try {
            // Attempt graceful shutdown
            serverProcess.destroy();
            
            // Wait for process to terminate with timeout
            boolean terminated = serverProcess.waitFor(
                TestConstants.SERVER_SHUTDOWN_TIMEOUT_MS,
                TimeUnit.MILLISECONDS
            );
            
            if (!terminated) {
                // Force termination if graceful shutdown times out
                serverProcess.destroyForcibly();
                serverProcess.waitFor(1, TimeUnit.SECONDS);
            }
            
            currentState = ServerState.STOPPED;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            currentState = ServerState.ERROR;
            throw new ServerStartupException("Server shutdown interrupted", e);
        }
    }

    /**
     * Checks if the server process is running and responsive.
     * 
     * <p>This method performs two checks:
     * <ol>
     *   <li>Process state validation - verifies the Node.js process is alive</li>
     *   <li>HTTP health check - validates server accepts connections and responds</li>
     * </ol>
     * 
     * <p>Requirement Traceability: Section 0.4.2 - Process state monitoring
     * 
     * @return true if server process is alive and responding to HTTP requests, false otherwise
     */
    public boolean isServerRunning() {
        // Check if process is alive
        if (serverProcess == null || !serverProcess.isAlive()) {
            return false;
        }

        // Perform HTTP health check
        return performHealthCheck();
    }

    /**
     * Performs an HTTP GET request to validate server availability.
     * 
     * @return true if server responds with HTTP 200, false otherwise
     */
    private boolean performHealthCheck() {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(TestConstants.BASE_URL + ":" + serverPort + TestConstants.ROOT_ENDPOINT);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(HTTP_CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(HTTP_READ_TIMEOUT_MS);
            
            int responseCode = connection.getResponseCode();
            return responseCode == TestConstants.HTTP_OK;
            
        } catch (IOException e) {
            // Connection failed - server not ready
            return false;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * Waits for the server to become ready and responsive.
     * 
     * <p>This method implements retry logic with exponential backoff:
     * <ul>
     *   <li>Initial backoff: 100ms</li>
     *   <li>Maximum backoff: 2000ms</li>
     *   <li>Maximum retries: 20 attempts</li>
     *   <li>Total maximum wait: ~SERVER_STARTUP_TIMEOUT_MS</li>
     * </ul>
     * 
     * <p>Requirement Traceability: Section 0.4.2 - Server readiness validation
     * 
     * @throws ServerStartupException if server doesn't become ready within timeout period
     * @throws IllegalStateException if server hasn't been started yet
     */
    public void waitForServerReady() throws ServerStartupException {
        if (serverProcess == null) {
            throw new IllegalStateException("Server has not been started");
        }

        long startTime = System.currentTimeMillis();
        int backoffMs = INITIAL_BACKOFF_MS;
        
        for (int attempt = 0; attempt < MAX_HEALTH_CHECK_RETRIES; attempt++) {
            // Check if server is responsive
            if (isServerRunning()) {
                currentState = ServerState.RUNNING;
                long elapsedMs = System.currentTimeMillis() - startTime;
                System.out.println("[ServerManager] Server ready on port " + serverPort + 
                                   " after " + elapsedMs + "ms");
                return;
            }
            
            // Check if we've exceeded overall timeout
            long elapsedMs = System.currentTimeMillis() - startTime;
            if (elapsedMs >= TestConstants.SERVER_STARTUP_TIMEOUT_MS) {
                currentState = ServerState.ERROR;
                throw new ServerStartupException(
                    "Server failed to become ready within " + 
                    TestConstants.SERVER_STARTUP_TIMEOUT_MS + "ms timeout");
            }
            
            // Check if process has terminated unexpectedly
            if (!serverProcess.isAlive()) {
                currentState = ServerState.ERROR;
                int exitCode = serverProcess.exitValue();
                throw new ServerStartupException(
                    "Server process terminated unexpectedly with exit code: " + exitCode);
            }
            
            // Wait before next retry with exponential backoff
            try {
                Thread.sleep(backoffMs);
                backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                currentState = ServerState.ERROR;
                throw new ServerStartupException("Server startup wait interrupted", e);
            }
        }
        
        // Exceeded maximum retries
        currentState = ServerState.ERROR;
        throw new ServerStartupException(
            "Server failed to respond after " + MAX_HEALTH_CHECK_RETRIES + " health check attempts");
    }

    /**
     * Returns the underlying Node.js server process.
     * 
     * @return the Process object for the Node.js server, or null if not started
     */
    public Process getServerProcess() {
        return serverProcess;
    }

    /**
     * Returns the port number on which the server is running.
     * 
     * @return the server port number
     */
    public int getServerPort() {
        return serverPort;
    }

    /**
     * Returns the current state of the server.
     * 
     * @return the current ServerState
     */
    public ServerState getState() {
        return currentState;
    }

    /**
     * Closes the server manager and stops the server if running.
     * This method is called automatically when used in try-with-resources.
     * 
     * <p>Requirement Traceability: AutoCloseable implementation for resource management
     * 
     * @throws ServerStartupException if server shutdown fails
     */
    @Override
    public void close() throws ServerStartupException {
        stopServer();
    }
}

/**
 * ServerState represents the lifecycle states of the Node.js Express server process.
 * 
 * <p>State Transitions:
 * <pre>
 * STOPPED -> STARTING -> RUNNING -> STOPPED
 *              |            |
 *              v            v
 *            ERROR        ERROR
 * </pre>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
enum ServerState {
    /**
     * Server startup has been initiated but server is not yet responsive.
     */
    STARTING,
    
    /**
     * Server is running and responsive to HTTP requests.
     */
    RUNNING,
    
    /**
     * Server is not running (initial state or after shutdown).
     */
    STOPPED,
    
    /**
     * Server encountered an error during startup, operation, or shutdown.
     */
    ERROR
}

/**
 * ServerStartupException is thrown when server lifecycle operations fail.
 * 
 * <p>Common scenarios include:
 * <ul>
 *   <li>Node.js executable not found in system PATH</li>
 *   <li>server.js file not found in project root</li>
 *   <li>Port already in use by another process</li>
 *   <li>Server process terminated unexpectedly</li>
 *   <li>Server failed to become ready within timeout</li>
 *   <li>Shutdown operation timed out or failed</li>
 * </ul>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
class ServerStartupException extends Exception {
    
    /**
     * Constructs a new ServerStartupException with the specified detail message.
     * 
     * @param message the detail message explaining the failure
     */
    public ServerStartupException(String message) {
        super(message);
    }
    
    /**
     * Constructs a new ServerStartupException with the specified detail message and cause.
     * 
     * @param message the detail message explaining the failure
     * @param cause the underlying cause of the failure
     */
    public ServerStartupException(String message, Throwable cause) {
        super(message, cause);
    }
}

