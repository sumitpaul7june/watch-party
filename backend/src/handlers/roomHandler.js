import { roomStore } from '../store/roomStore.js';

// --- ROOM EVENT HANDLERS ---
// I keep all socket events related to joining, leaving, and creating rooms here.
const roomHandler = (socket) => {

    // 1. Create a brand new room
    socket.on('create-room', (callback) => {
        let newRoomId;

        // Generate a 6-character code and ensure it is unique
        do {
            newRoomId = Math.random().toString(36).substring(2, 8);
        }
        while (roomStore.getRoom(newRoomId));

        // Physically create the room in memory so it exists before anyone joins
        roomStore.createRoom(newRoomId);

        callback({ roomId: newRoomId });
    })

    // 2. Handle users trying to join an existing room
    socket.on('join-room', (roomId) => {
        if (!roomId) return;

        if (roomStore.isUserInRoom(roomId, socket.id)) {
            return;
        }

        // Pre-flight check: Is the room full?
        if (roomStore.isRoomFull(roomId)) {
            console.log('Room capacity exceeded, rejecting join request');
            socket.emit('full-room-error', roomId);
            return;
        }

        // Attempt to join the room in our store
        const room = roomStore.joinRoom(roomId, socket.id);
        
        // If joinRoom returns null, the room code doesn't exist!
        if (!room) {
            socket.emit('invalid-room-error');
            return;
        }

        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Sync current video state to the newly joined user
        if (room.mediaSource) {
            socket.emit('media-source', room.mediaSource);
        }

        // Sync chat history to the newly joined user
        if (room.chatHistory && room.chatHistory.length > 0) {
            socket.emit('chat-history', room.chatHistory);
        }
    });

    // 3. Handle users leaving
    socket.on('leave-room', (roomId) => {
        if (!roomId) return;

        socket.leave(roomId);
        roomStore.leaveRoom(roomId, socket.id);
        console.log(`User ${socket.id} left room ${roomId}`);
    });

    // 4. Handle pre-flight check from Landing Page
    socket.on('check-room', (roomId, callback) => {
        if (!roomStore.getRoom(roomId)) {
            callback({ status: 'invalid' });
        } else if (roomStore.isRoomFull(roomId)) {
            callback({ status: 'full' });
        } else {
            callback({ status: 'ok' });
        }
    });

}

export default roomHandler;
