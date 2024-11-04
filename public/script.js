const socket = io();
let username;
let typingTimeout; // Variable to hold the timeout
const typingIndicator = document.getElementById('typingIndicator'); // Element to display typing status

// Get username from URL parameter
const urlParams = new URLSearchParams(window.location.search);
username = urlParams.get('username');

// Event listener for the message input field
messageInput.addEventListener('input', () => {
    if (!socket.typing) {
        socket.emit('typing', { username });
        socket.typing = true; // Set typing status to true
    }

    clearTimeout(typingTimeout); // Clear previous timeout
    typingTimeout = setTimeout(() => {
        socket.emit('stopTyping', { username });
        socket.typing = false; // Set typing status to false
    }, 3000); // Stop typing indicator after 3 seconds of inactivity
});

// Send message to server
sendBtn.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        socket.emit('chatMessage', { username, message });
        messageInput.value = '';
        socket.emit('stopTyping', { username }); // Stop typing indicator when message is sent
        socket.typing = false; // Reset typing status
    }
});

// Display typing indicator
socket.on('typing', ({ username }) => {
    typingIndicator.textContent = `${username} is typing...`;
});

// Hide typing indicator
socket.on('stopTyping', () => {
    typingIndicator.textContent = '';
});

// Load message history and display new messages
socket.on('loadHistory', (messages) => {
    messages.forEach(({ username, message }) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.textContent = `${username}: ${message}`;
        messagesDiv.appendChild(messageDiv);
    });
});

socket.on('chatMessage', ({ username, message }) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.textContent = `${username}: ${message}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
});
