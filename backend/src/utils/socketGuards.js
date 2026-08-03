import { roomStore } from '../store/roomStore.js';

// --- SOCKET SECURITY GUARDS ---

/**
 * Validates whether a given socket connection is currently authorized to interact with a specific room.
 * This acts as a server-side security checkpoint to prevent malicious users from 
 * broadcasting events (like chat messages or video commands) to rooms they haven't formally joined.
 */
export const canAccessRoom = (socket, roomId) => {
    // 1. Fail fast if no room ID is provided
    if (!roomId) return false;
    
    // 2. Query the central in-memory store to confirm the user's presence
    return roomStore.isUserInRoom(roomId, socket.id);
};
