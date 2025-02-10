const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Database setup
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(express.static('public')); // Serve static files
app.use(express.json());
app.use(bodyParser.json());

// Track online users
const onlineUsers = {};

// Create users and messages tables if they do not exist
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)",
    (err) => {
      if (err) console.error("Error creating users table:", err);
    }
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS messages (username TEXT, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)",
    (err) => {
      if (err) console.error("Error creating messages table:", err);
    }
  );
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
  res.sendFile(__dirname + '/public/chat.html');
});

// WebSocket connection
io.on('connection', (socket) => {
  let username = null;

  // Load message history
  db.all("SELECT * FROM messages", (err, rows) => {
    if (!err) {
      socket.emit('loadHistory', rows);
    }
  });

  // Listen for a user joining
  socket.on('userJoined', (user) => {
    username = user;
    onlineUsers[username] = socket.id;

    // Notify all clients about the updated user list
    io.emit('updateUserList', onlineUsers);

    // Broadcast that the user has joined
    io.emit('userActivity', { message: `${username} has joined the chat.` });
  });

  // Listen for messages from clients
  socket.on('chatMessage', ({ username, message }) => {
    const stmt = db.prepare("INSERT INTO messages (username, message) VALUES (?, ?)");
    stmt.run(username, message, (err) => {
      if (err) console.error("Error inserting message:", err);
    });
    stmt.finalize();

    io.emit('chatMessage', { username, message });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    if (username) {
      delete onlineUsers[username];

      // Notify all clients about the updated user list
      io.emit('updateUserList', onlineUsers);

      // Broadcast that the user has left
      io.emit('userActivity', { message: `${username} has left the chat.` });
    }
  });
});

// Endpoint to send a message
app.post('/send', (req, res) => {
  const { sender, recipient, message } = req.body;

  if (!sender || !recipient || !message) {
    return res.status(400).json({ error: 'Sender, recipient, and message are required.' });
  }

  // Store the message
  const newMessage = { sender, recipient, text: message };
  messages.push(newMessage);

  console.log(`Message from ${sender} to ${recipient}: ${message}`);
  res.status(200).json({ message: 'Message sent successfully!' });
});

// Endpoint to get messages for a specific user
app.get('/messages', (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required to fetch messages.' });
  }

  // Filter messages for the logged-in user
  const userMessages = messages.filter(
    msg => msg.recipient === username || msg.sender === username
  );

  res.json(userMessages);
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
