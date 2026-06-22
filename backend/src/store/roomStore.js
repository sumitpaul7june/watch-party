import { MAX_CHAT_HISTORY, MAX_ROOM_USERS } from '../config/roomConfig.js';

const rooms = new Map();


class RoomStore {
    // Add a user to the room
    joinRoom(roomId, userId) {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                roomId: roomId,
                users: new Set(),
                mediaSource: null,
                chatHistory: []
            });
        }
        const room = rooms.get(roomId);
        room.users.add(userId);
        return room;
    }

    // Remove a user from specific room
    leaveRoom(roomId, userId) {
        const room = rooms.get(roomId);
        if (room) {
            room.users.delete(userId);

            // Cleanup empty rooms to free memory
            if (room.users.size === 0) {
                rooms.delete(roomId);
            }
        }
    }

    // Set the media source for the room
    setRoomMediaSource(roomId, mediaSource) {
        const room = rooms.get(roomId);
        if (room) {
            room.mediaSource = mediaSource;
        }
    }

    // Get the current state of a room
    getRoom(roomId) {
        return rooms.get(roomId);
    }

    // Check if the room has reached max capacity
    isRoomFull(roomId) {
        const size = this.getRoom(roomId)?.users.size || 0;
        return size >= MAX_ROOM_USERS;
    }

    isUserInRoom(roomId, userId) {
        return this.getRoom(roomId)?.users.has(userId) || false;
    }

    // Clean up a user from all rooms when they disconnect
    removeUserFromAllRooms(userId) {
        for (const [roomId, room] of rooms.entries()) {
            if (room.users.has(userId)) {
                room.users.delete(userId);
                if (room.users.size == 0) {
                    rooms.delete(roomId);
                }
            }
        }
    }

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
