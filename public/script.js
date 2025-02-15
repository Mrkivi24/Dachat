const socket = io();
let username;

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
