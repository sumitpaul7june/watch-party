import { roomStore } from '../store/roomStore.js';
import { canAccessRoom } from '../utils/socketGuards.js';

const chatHandler = (socket) => {
    // Handle chat message routing
    socket.on('chat-message', (data) => {
        const { roomId, currentText } = data;
        const text = currentText?.trim();
        if (!text || !canAccessRoom(socket, roomId)) return;

        // Construct message payload (pull username from the JWT-decoded socket.user)
        const messageObject = {
            text,
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous'
        };

        // Persist message in memory
        roomStore.addChatMessage(roomId, messageObject);

        // Broadcast to other peers in the room
        socket.to(roomId).emit('new-messages', messageObject);
        
        // Echo message back to sender
        socket.emit('new-messages', messageObject);
    });
};

export default chatHandler;
