// script.js
const socket = io();
let username;

function login() {
  username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Login successful') {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('chatScreen').style.display = 'block';
    } else {
      alert('Invalid credentials');
    }
  });
}

function sendMessage() {
  const message = document.getElementById('messageInput').value;
  if (message) {
    socket.emit('newMessage', { username, message });
    document.getElementById('messageInput').value = '';
  }
}

// Display message history
socket.on('loadHistory', (messages) => {
  const chatBox = document.getElementById('chatBox');
  messages.forEach(msg => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${msg.username}: ${msg.message}`;
    chatBox.appendChild(messageElement);
  });
});

// Display new messages
socket.on('newMessage', (data) => {
  const chatBox = document.getElementById('chatBox');
  const messageElement = document.createElement('div');
  messageElement.textContent = `${data.username}: ${data.message}`;
  chatBox.appendChild(messageElement);
});
