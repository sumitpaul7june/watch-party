import { MAX_CHAT_HISTORY, MAX_ROOM_USERS } from '../config/roomConfig.js';

// In-memory data store for all active rooms. Maps roomId -> Room object
const rooms = new Map();

class RoomStore {
    // --- ROOM STORE MANAGER ---
    // This class provides a centralized way to manage room state without touching the database.

    // Creates a brand new empty room
    createRoom(roomId) {
        rooms.set(roomId, {
            roomId: roomId,
            // Use a Map for users to store metadata (username, isGuest) alongside the socketId
            users: new Map(),       // Map<socketId, { socketId, username, isGuest }>
            mediaSource: null,      // Stores the current video URL/source being watched
            chatHistory: []         // Stores recent chat messages
        });
    }

    // Attempt to add a user to a room. Returns null if the room doesn't exist to prevent blind joining.
    joinRoom(roomId, socketId, userInfo) {
        const room = rooms.get(roomId);

        // If the room doesn't exist, return null so the caller (roomHandler) can handle the error appropriately.
        if (!room) return null;

        // Store the user with their identity from the JWT payload
        room.users.set(socketId, {
            socketId,
            username: userInfo.username || 'Anonymous',
            isGuest: String(userInfo.id).startsWith('guest_')
        });

        return room;
    }

    // Remove a user from a specific room
    leaveRoom(roomId, socketId) {
        const room = rooms.get(roomId);
        if (room) {
            room.users.delete(socketId);

            // Cleanup empty rooms to free memory and prevent memory leaks
            if (room.users.size === 0) {
                rooms.delete(roomId);
            }
        }
    }

    // Set the active media source (e.g., Netflix URL or YouTube ID) for the room
    setRoomMediaSource(roomId, mediaSource) {
        const room = rooms.get(roomId);
        if (room) {
            room.mediaSource = mediaSource;
        }
    }

    // Get the full current state of a room (users, chat history, media source)
    getRoom(roomId) {
        return rooms.get(roomId);
    }

    // Check if the room has reached its maximum allowed capacity
    isRoomFull(roomId) {
        const size = this.getRoom(roomId)?.users.size || 0;
        return size >= MAX_ROOM_USERS;
    }

    // Verify if a specific socket ID is currently in the specified room
    isUserInRoom(roomId, socketId) {
        return this.getRoom(roomId)?.users.has(socketId) || false;
    }

    // Clean up a user from all rooms when they disconnect unexpectedly (e.g., closing the browser)
    // Returns an array of room IDs the user was removed from, so the socket handler can broadcast leave messages.
    removeUserFromAllRooms(socketId) {
        const removedFrom = [];
        for (const [roomId, room] of rooms.entries()) {
            if (room.users.has(socketId)) {
                room.users.delete(socketId);
                removedFrom.push(roomId);
                
                // Cleanup the room if it becomes empty after this user leaves
                if (room.users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        }
        return removedFrom;
    }

    // Append a chat message to the room's history, enforcing a maximum history size
    addChatMessage(roomId, messageObject) {
        const room = this.getRoom(roomId);
        if (room && messageObject) {
            room.chatHistory.push(messageObject);
            // If the chat history exceeds the max limit, remove the oldest messages
            if (room.chatHistory.length > MAX_CHAT_HISTORY) {
                room.chatHistory.shift();
            }
        }
    }
};

export const roomStore = new RoomStore();

