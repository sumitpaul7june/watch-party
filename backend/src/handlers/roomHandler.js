import { roomStore } from '../store/roomStore.js';

// --- ROOM EVENT HANDLERS ---
// This file manages all socket events related to joining, leaving, and creating rooms.
const roomHandler = (socket) => {

    // 1. Create a brand new room
    socket.on('create-room', (callback) => {
        let newRoomId;

        // Generate a 6-character code and ensure it is unique
        do {
            newRoomId = Math.random().toString(36).substring(2, 8);
        }
        while (roomStore.getRoom(newRoomId));

        // Physically create the room in memory so it exists before anyone joins.
        // This ensures the room state (chat history, media source, user map) is initialized.
        roomStore.createRoom(newRoomId);

        callback({ roomId: newRoomId });
    })

    // 2. Handle users trying to join an existing room
    socket.on('join-room', (roomId) => {
        if (!roomId) return;

        // Prevent joining if the user is already in the room
        if (roomStore.isUserInRoom(roomId, socket.id)) {
            return;
        }

        // Pre-flight check: Is the room full? Reject the request if capacity is reached.
        if (roomStore.isRoomFull(roomId)) {
            console.log('Room capacity exceeded, rejecting join request');
            socket.emit('full-room-error', roomId);
            return;
        }

        // Attempt to join the room in the store. 
        // Pass socket.user from JWT to store the user's identity (username, guest status) along with their socket ID.
        const room = roomStore.joinRoom(roomId, socket.id, socket.user);
        
        // If joinRoom returns null, the room code doesn't exist!
        if (!room) {
            socket.emit('invalid-room-error');
            return;
        }

        // Add the socket to the socket.io room channel
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Broadcast the new participant count to everyone in the room, including the newly joined user
        const currentCount = room.users.size;
        socket.to(roomId).emit('room-update', { count: currentCount });
        socket.emit('room-update', { count: currentCount });

        // Sync current video state to the newly joined user
        if (room.mediaSource) {
            socket.emit('media-source', room.mediaSource);
        }

        // Sync chat history to the newly joined user
        if (room.chatHistory && room.chatHistory.length > 0) {
            socket.emit('chat-history', room.chatHistory);
        }

        // Send a system message to everyone indicating that the user joined
        const joinMessage = {
            text: 'joined the room',
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous',
            type: 'system'
        };
        roomStore.addChatMessage(roomId, joinMessage);
        socket.to(roomId).emit('new-messages', joinMessage);
        socket.emit('new-messages', joinMessage); // Also show it to the user who just joined
    });

    // 3. Handle users explicitly leaving a room
    socket.on('leave-room', (roomId) => {
        if (!roomId) return;

        // Remove the socket from the socket.io room channel and the in-memory store
        socket.leave(roomId);
        roomStore.leaveRoom(roomId, socket.id);
        console.log(`User ${socket.id} left room ${roomId}`);

        // Notify remaining participants about the new user count
        const roomAfterLeave = roomStore.getRoom(roomId);
        const newCount = roomAfterLeave ? roomAfterLeave.users.size : 0;
        socket.to(roomId).emit('room-update', { count: newCount });

        // Send a system message to remaining participants indicating that the user left
        const leaveMessage = {
            text: 'left the room',
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous',
            type: 'system'
        };
        roomStore.addChatMessage(roomId, leaveMessage);
        socket.to(roomId).emit('new-messages', leaveMessage);
    });

    // 4. Handle pre-flight check from Landing Page (checking if a room is valid before navigating)
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
