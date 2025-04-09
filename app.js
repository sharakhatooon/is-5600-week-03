// Import required modules
const express = require('express');
const path = require('path');

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" directory (chat.js will load from here)
app.use(express.static(__dirname + '/public'));

/**
 * Responds with plain text
 */
function respondText(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.end('hi');
}

/**
 * Responds with JSON
 */
function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

/**
 * Responds with a transformed echo of input
 */
function respondEcho(req, res) {
  const { input = '' } = req.query;

  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

/**
 * Serves up the chat.html file
 */
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, '/chat.html'));
}

// Keep track of all client response objects for broadcasting
const clients = [];

/**
 * Broadcasts messages to all connected clients via SSE
 */
function broadcastMessage(message) {
  clients.forEach(res => {
    res.write(`data: ${message}\n\n`);
  });
}

// SSE endpoint for streaming chat messages
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add the response object to clients
  clients.push(res);

  // Remove it when the client disconnects
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) {
      clients.splice(idx, 1);
    }
  });
});

// Receives messages from client and broadcasts to all connected SSE clients
app.get('/chat', (req, res) => {
  const { message = '' } = req.query;
  broadcastMessage(message);
  res.end(); // We don't need to return anything to the sender
});

// Routing setup
app.get('/', chatApp);        // Serve chat.html
app.get('/json', respondJson);
app.get('/echo', respondEcho);

// Start the Express server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
