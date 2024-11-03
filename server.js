// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Database setup
const db = new sqlite3.Database('./database.db');

// Middleware to serve static files
app.use(express.static('public'));
app.use(express.json());

// Create users and messages tables if not exist
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS messages (username TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// Endpoint to authenticate users
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.status(500).json({ message: 'Error comparing passwords' });
      if (match) {
        res.json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });
  });
});

// Serve the chatroom HTML file
app.get('/chat.html', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html'); // Serve chat.html
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Load message history
  db.all("SELECT * FROM messages", (err, rows) => {
    if (!err) {
      socket.emit('loadHistory', rows);
    }
  });

  // Listen for messages from clients
  socket.on('chatMessage', ({ username, message }) => {
    // Store new message in the database
    const stmt = db.prepare("INSERT INTO messages (username, message) VALUES (?, ?)");
    stmt.run(username, message);
    stmt.finalize();

    // Broadcast message to all clients
    io.emit('chatMessage', { username, message });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
