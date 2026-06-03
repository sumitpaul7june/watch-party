const rooms = new Map();



class RoomStore {
    // Add a user to the room
    joinRoom(roomId, userId) {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                roomId: roomId,
                users: new Set(),
                videoId: '',
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
            if (rooms.users.size === 0) {
                rooms.delete(roomId);
            }
        }
    }

    // Update the videoId for a room
    setRoomVideo(roomId, videoId) {
        const room = rooms.get(roomId);
        if (room) {
            room.videoId = videoId;
        }
        else {
            // If the room somehow doesn't exist but a video ID is set, create it
            rooms.set(roomId, {
                roomId: roomId,
                users: new Set(),
                videoId: videoId
            });
        }
    }

    // Get the current state of a room
    getRoom(roomId) {
        return rooms.get(roomId);
    }

    // Check if the room has reached max capacity
    isRoomFull(roomId) {
        const size = this.getRoom(roomId)?.users.size || 0;
        return size >= 4;
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
        }
    }


};


export const roomStore = new RoomStore();