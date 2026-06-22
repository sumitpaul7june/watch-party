import { roomStore } from '../store/roomStore.js';

const roomHandler = (socket) => {
    // Handle socket room registration
    socket.on('join-room', (roomId) => {
        if (!roomId) return;

        if (roomStore.isUserInRoom(roomId, socket.id)) {
            return;
        }

        // Enforce room capacity limits
        if (roomStore.isRoomFull(roomId)) {
            console.log('Room capacity exceeded, rejecting join request');
            socket.emit('full-room-error', roomId);
            return;
        }

        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Register user in store and sync current video state
        const room = roomStore.joinRoom(roomId, socket.id);
        if (room.mediaSource) {
            socket.emit('media-source', room.mediaSource);
        }

        // Sync chat history to the newly joined user
        if (room.chatHistory && room.chatHistory.length > 0) {
            socket.emit('chat-history', room.chatHistory);
        }
    });

    socket.on('leave-room', (roomId) => {
        if (!roomId) return;

        socket.leave(roomId);
        roomStore.leaveRoom(roomId, socket.id);
        console.log(`User ${socket.id} left room ${roomId}`);
    });

    // Handle pre-flight room capacity check
    socket.on('check-room', (roomId, callback) => {
        if (roomStore.isRoomFull(roomId)) {
            callback({ status: 'full' });
        } else {
            callback({ status: 'ok' });
        }
    });



}

export default roomHandler;
