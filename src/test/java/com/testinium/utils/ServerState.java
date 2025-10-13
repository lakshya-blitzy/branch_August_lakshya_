package com.testinium.utils;

/**
 * ServerState represents the lifecycle states of the Node.js Express server process.
 * 
 * <p>State Transitions:
 * <pre>
 *       ┌─────────┐
 *   ┌──▶│ STOPPED │◀──┐
 *   │   └────┬────┘   │
 *   │        │         │
 *   │   startServer()  │
 *   │        │         │
 *   │        ▼         │
 *   │   ┌──────────┐   │
 *   │   │ STARTING │   │
 *   │   └────┬─────┘   │
 *   │        │         │
 *   │ waitForServerReady()
 *   │        │         │
 *   │        ▼         │
 *   │   ┌─────────┐   │
 *   └───│ RUNNING │   │
 *       └────┬────┘   │
 *            │         │
 *       stopServer()  │
 *            │         │
 *            └─────────┘
 *            
 *       All states can transition to ERROR on failure:
 *       STARTING ──────▶ ERROR
 *       RUNNING  ──────▶ ERROR
 *              v            v
 *            ERROR        ERROR
 * </pre>
 * 
 * @author Testinium QA Team
 * @version 1.0
 * @since 1.0
 */
public enum ServerState {
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
