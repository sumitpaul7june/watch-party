import { MAX_CHAT_HISTORY, MAX_ROOM_USERS } from '../config/roomConfig.js';

// In-memory data store for all active rooms. Maps roomId -> Room object
const rooms = new Map();

class RoomStore {
    // --- ROOM STORE MANAGER ---
    
    // Creates a new empty room
    createRoom(roomId) {
        rooms.set(roomId, {
            roomId: roomId,
            users: new Map(),       // Maps socketId -> { socketId, username, isGuest }
            mediaSource: null,      // Current video URL/source being watched
            chatHistory: []         // Array of recent chat messages
        });
    }

    // Attempts to add a user to a room. Returns null if room doesn't exist.
    joinRoom(roomId, socketId, userInfo) {
        const room = rooms.get(roomId);
        if (!room) return null;

        room.users.set(socketId, {
            socketId,
            username: userInfo.username || 'Anonymous',
            isGuest: String(userInfo.id).startsWith('guest_')
        });

        return room;
    }

    // Removes a user from a specific room and cleans up empty rooms
    leaveRoom(roomId, socketId) {
        const room = rooms.get(roomId);
        if (room) {
            room.users.delete(socketId);

            if (room.users.size === 0) {
                rooms.delete(roomId);
            }
        }
    }

    // Sets the active media source for the room
    setRoomMediaSource(roomId, mediaSource) {
        const room = rooms.get(roomId);
        if (room) {
            room.mediaSource = mediaSource;
        }
    }

    // Retrieves the full current state of a room
    getRoom(roomId) {
        return rooms.get(roomId);
    }

    // Checks if the room has reached its maximum allowed capacity
    isRoomFull(roomId) {
        const size = this.getRoom(roomId)?.users.size || 0;
        return size >= MAX_ROOM_USERS;
    }

    // Verifies if a specific socket ID is currently in the specified room
    isUserInRoom(roomId, socketId) {
        return this.getRoom(roomId)?.users.has(socketId) || false;
    }

    // Cleans up a user from all rooms when they disconnect unexpectedly
    // Returns an array of room IDs the user was removed from
    removeUserFromAllRooms(socketId) {
        const removedFrom = [];
        for (const [roomId, room] of rooms.entries()) {
            if (room.users.has(socketId)) {
                room.users.delete(socketId);
                removedFrom.push(roomId);
                
                if (room.users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        }
        return removedFrom;
    }

    // Appends a chat message to the room's history, enforcing a maximum history limit
    addChatMessage(roomId, messageObject) {
        const room = this.getRoom(roomId);
        if (room && messageObject) {
            room.chatHistory.push(messageObject);
            
            if (room.chatHistory.length > MAX_CHAT_HISTORY) {
                room.chatHistory.shift();
            }
        }
    }
};

export const roomStore = new RoomStore();

