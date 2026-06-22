import { useEffect } from 'react';

export const useRoomSocket = (socket, roomId, onVideoCommand) => {

    // Listen for incoming socket events
    useEffect(() => {
        if (!socket) return;

        socket.on('video-command', onVideoCommand);

        return () => {
            socket.off('video-command', onVideoCommand);
        };
    }, [socket, onVideoCommand]);

    const broadcastCommand = (command) => {
        if (!socket || !roomId) return;
        socket.emit('video-command', { ...command, roomId });
    };

    return { broadcastCommand };
};
