import { useEffect } from "react";

export const useRoomManagement = (roomId, socket) => {
    useEffect(() => {
        if (!roomId) return;
        console.log('hello its emitting: ', roomId);

        socket.emit('join-room', roomId);
    }, [socket, roomId]);
};
