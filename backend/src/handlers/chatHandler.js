import { roomStore } from '../store/roomStore.js';
import { canAccessRoom } from '../utils/socketGuards.js';

// --- CHAT EVENT HANDLER ---
const chatHandler = (socket) => {
    
    // 1. Process incoming chat messages
    socket.on('chat-message', (data) => {
        const { roomId, currentText } = data;
        const text = currentText?.trim();
        
        // Security check: Ignore empty messages or requests from users not in the room
        if (!text || !canAccessRoom(socket, roomId)) return;

        // Create the message object using JWT data attached to the socket
        const messageObject = {
            text,
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous'
        };

        // Save message to in-memory room history
        roomStore.addChatMessage(roomId, messageObject);

        // Broadcast the new message to everyone in the room, including the sender
        socket.to(roomId).emit('new-messages', messageObject);
        socket.emit('new-messages', messageObject);
    });
};

export default chatHandler;
