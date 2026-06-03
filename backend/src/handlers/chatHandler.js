import { roomStore } from '../store/roomStore.js';

const chatHandler = (socket) => {
    // Handle chat message routing
    socket.on('chat-message', (data) => {
        const { roomId, currentText } = data;

        // Construct message payload
        const messageObject = {
            text: currentText,
            senderId: socket.id
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
