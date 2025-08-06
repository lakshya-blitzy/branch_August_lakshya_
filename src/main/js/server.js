const http = require('http');
const url = require('url');

/**
 * Simple HTTP server for testing purposes
 * Provides basic REST endpoints and error handling
 */
class SimpleServer {
  constructor(options = {}) {
    this.port = options.port !== undefined ? options.port : 3000;
    this.host = options.host || 'localhost';
    this.server = null;
    this.isRunning = false;
  }

  /**
   * Create HTTP server with route handling
   */
  createServer() {
    this.server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const path = parsedUrl.pathname;
      const method = req.method;

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      try {
        this.handleRequest(req, res, path, method);
      } catch (error) {
        this.handleError(res, error);
      }
    });

    return this.server;
  }

  /**
   * Handle incoming HTTP requests
   */
  handleRequest(req, res, path, method) {
    switch (path) {
      case '/':
        this.handleRoot(req, res);
        break;
      case '/health':
        this.handleHealth(req, res);
        break;
      case '/api/test':
        this.handleApiTest(req, res, method);
        break;
      case '/api/data':
        this.handleApiData(req, res, method);
        break;
      default:
        this.handleNotFound(res);
    }
  }

  /**
   * Root endpoint handler
   */
  handleRoot(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Testinium-QA Server Running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Health check endpoint
   */
  handleHealth(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }));
  }

  /**
   * API test endpoint with method handling
   */
  handleApiTest(req, res, method) {
    switch (method) {
      case 'GET':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: 'GET', data: 'test data' }));
        break;
      case 'POST':
        this.handlePostRequest(req, res, '/api/test');
        break;
      case 'PUT':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: 'PUT', updated: true }));
        break;
      case 'DELETE':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: 'DELETE', deleted: true }));
        break;
      default:
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }

  /**
   * API data endpoint
   */
  handleApiData(req, res, method) {
    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      }));
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }

  /**
   * Handle POST requests with body parsing
   */
  handlePostRequest(req, res, endpoint) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          method: 'POST',
          endpoint: endpoint,
          received: data,
          created: true
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }

  /**
   * Handle 404 errors
   */
  handleNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }

  /**
   * Handle server errors
   */
  handleError(res, error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message
    }));
  }

  /**
   * Start the server
   */
  start() {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        reject(new Error('Server is already running'));
        return;
      }

      this.createServer();
      
      this.server.listen(this.port, this.host, (error) => {
        if (error) {
          reject(error);
        } else {
          this.isRunning = true;
          console.log(`Server running at http://${this.host}:${this.port}/`);
          resolve(this);
        }
      });

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Stop the server gracefully
   */
  stop() {
    return new Promise((resolve) => {
      if (!this.isRunning || !this.server) {
        resolve();
        return;
      }

      this.server.close(() => {
        this.isRunning = false;
        console.log('Server stopped');
        resolve();
      });
    });
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      host: this.host
    };
  }
}

module.exports = SimpleServer;

// Allow direct execution for testing
if (require.main === module) {
  const server = new SimpleServer({ port: 3000 });
  
  server.start()
    .then(() => {
      console.log('Server started successfully');
    })
    .catch((error) => {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.stop().then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    server.stop().then(() => process.exit(0));
  });
}