import { roomStore } from '../store/roomStore.js';

export const canAccessRoom = (socket, roomId) => {
    if (!roomId) return false;
    return roomStore.isUserInRoom(roomId, socket.id);
};
