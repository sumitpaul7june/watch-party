import { useEffect } from "react";

export const useRoomManagement = (roomId, socket) => {
    useEffect(() => {
        if (!roomId) return;
        console.log('hello its emitting: ', roomId);

        socket.emit('join-room', roomId);

        // Listen for a full room error from the sever
        socket.on('full-room-error', (roomId) => {
            alert(`This room is full ${roomId}. Please try join other rooms`);
        });

        // Cleanup on unmount
        return () => {
            socket.off('full-room-error');
        }
    }, [socket, roomId]);

};


