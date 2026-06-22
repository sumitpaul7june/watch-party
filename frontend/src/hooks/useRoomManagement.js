import { useEffect } from "react";

export const useRoomManagement = (roomId, socket) => {
    useEffect(() => {
        if (!roomId) return;
        console.log('hello its emitting: ', roomId);

        socket.emit('join-room', roomId);

        const handleFullRoomError = (fullRoomId) => {
            alert(`This room is full ${fullRoomId}. Please try join other rooms`);
        };

        socket.on('full-room-error', handleFullRoomError);

        return () => {
            socket.emit('leave-room', roomId);
            socket.off('full-room-error', handleFullRoomError);
        }
    }, [socket, roomId]);
};
