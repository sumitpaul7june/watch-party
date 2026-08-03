import { roomStore } from '../store/roomStore.js';

// --- ROOM EVENT HANDLERS ---
// Manages the complete lifecycle of a Watch Party room, including creation,
// joining, leaving, and pre-flight validation checks.
const roomHandler = (socket) => {

    // 1. Create a New Room
    // Triggered when a host clicks "Create Room" on the frontend.
    // Uses a callback to instantly return the newly generated room code to the specific user who requested it.
    socket.on('create-room', (callback) => {
        let newRoomId;

        // Generate a 7-character alphanumeric code. 
        // The loop ensures we never accidentally generate a room ID that is already in use.
        do {
            newRoomId = Math.random().toString(36).substring(2, 9);
        } while (roomStore.getRoom(newRoomId));

        // Initialize the empty room in our in-memory store so it is ready to accept users.
        roomStore.createRoom(newRoomId);

        // Execute the callback function provided by the frontend, sending back the new ID.
        callback({ roomId: newRoomId });
    });

    // 2. Join an Existing Room
    // Triggered when a user attempts to enter a room via the RoomPage component.
    socket.on('join-room', (roomId) => {
        if (!roomId) return;

        // Prevent a user who is already in the room from triggering the join logic twice.
        if (roomStore.isUserInRoom(roomId, socket.id)) return;

        // Enforce the 10-person capacity limit. 
        // If full, notify this specific socket to redirect to the home page.
        if (roomStore.isRoomFull(roomId)) {
            socket.emit('full-room-error', roomId);
            return;
        }

        // Register the user in the in-memory Room Store. 
        // We pass the decoded JWT user data (socket.user) to attach their identity to this session.
        const room = roomStore.joinRoom(roomId, socket.id, socket.user);

        // If the store returns null, the room code does not exist.
        if (!room) {
            socket.emit('invalid-room-error');
            return;
        }

        // Native Socket.IO command: Subscribe this connection to the room's broadcast channel.
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Broadcast the updated participant count to everyone in the room (including the new user).
        const currentCount = room.users.size;
        socket.to(roomId).emit('room-update', { count: currentCount });
        socket.emit('room-update', { count: currentCount });

        // Synchronize the new user's video player with what the room is currently watching.
        if (room.mediaSource) {
            socket.emit('media-source', room.mediaSource);
        }

        // Send the recent chat history to the new user so they aren't looking at an empty chat box.
        if (room.chatHistory && room.chatHistory.length > 0) {
            socket.emit('chat-history', room.chatHistory);
        }

        // Announce the arrival of the new user to everyone in the chat box via a system message.
        const joinMessage = {
            text: 'joined the room',
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous',
            type: 'system'
        };
        roomStore.addChatMessage(roomId, joinMessage);
        socket.to(roomId).emit('new-messages', joinMessage);
        socket.emit('new-messages', joinMessage);
    });

    // 3. Leave a Room
    // Triggered when a user explicitly clicks a "Leave" button or navigates away.
    socket.on('leave-room', (roomId) => {
        if (!roomId) return;

        // Native Socket.IO command: Unsubscribe from the room's broadcast channel.
        socket.leave(roomId);

        // Remove the user from the in-memory store.
        roomStore.leaveRoom(roomId, socket.id);
        console.log(`User ${socket.id} left room ${roomId}`);

        // Calculate the new participant count and broadcast it to the remaining users.
        const roomAfterLeave = roomStore.getRoom(roomId);
        const newCount = roomAfterLeave ? roomAfterLeave.users.size : 0;
        socket.to(roomId).emit('room-update', { count: newCount });

        // Announce the departure of the user to the remaining participants.
        const leaveMessage = {
            text: 'left the room',
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous',
            type: 'system'
        };
        roomStore.addChatMessage(roomId, leaveMessage);
        socket.to(roomId).emit('new-messages', leaveMessage);
    });

    // 4. Pre-flight Room Validation
    // Triggered by the Landing Page before the frontend changes the URL.
    // Uses a callback to instantly answer: "Is it safe to navigate to this room?"
    socket.on('check-room', (roomId, callback) => {
        if (!roomStore.getRoom(roomId)) {
            callback({ status: 'invalid' });
        } else if (roomStore.isRoomFull(roomId)) {
            callback({ status: 'full' });
        } else {
            callback({ status: 'ok' });
        }
    });

};

export default roomHandler;
