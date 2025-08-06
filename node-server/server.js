// Express.js server implementation with two REST endpoints
// Implements GET routes for "/" returning "Hello world" and "/evening" returning "Good evening"

const express = require('express');

// Create Express application instance
const app = express();

// Configure port with environment variable fallback
const port = process.env.PORT || 3000;

// Define GET route handler for root path "/" returning "Hello world"
app.get('/', (req, res) => {
  res.send('Hello world');
});

// Define GET route handler for "/evening" path returning "Good evening"
app.get('/evening', (req, res) => {
  res.send('Good evening');
});

// Start HTTP server and listen on configured port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access endpoints:`);
  console.log(`  GET / - Returns "Hello world"`);
  console.log(`  GET /evening - Returns "Good evening"`);
});