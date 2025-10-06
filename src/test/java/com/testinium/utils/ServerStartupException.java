package com.testinium.utils;

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
public class ServerStartupException extends Exception {
    
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
