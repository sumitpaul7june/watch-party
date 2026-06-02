import { useEffect } from 'react';

export const useRoomSocket = (socket, roomId, videoId, onVideoCommand, onVideoIdChange) => {

    // 1. Broadcast new video ID to the room if we are the ones changing it
    useEffect(() => {
        if (!roomId || !videoId) return;
        socket.emit('video-id', { roomId, videoId });
    }, [socket, roomId, videoId]);

    // 2. Listen for incoming socket events (The Ears)
    useEffect(() => {
        if (!socket) return;

        socket.on('video-command', onVideoCommand);
        socket.on('video-id', onVideoIdChange);

        return () => {
            socket.off('video-command', onVideoCommand);
            socket.off('video-id', onVideoIdChange);
        };
    }, [socket, onVideoCommand, onVideoIdChange]);

    // 3. Helper to shout commands to the room (The Mouth)
    const broadcastCommand = (stateCode, currentTime) => {
        socket.emit('video-command', { roomId, stateCode, currentTime });
    };

    return { broadcastCommand };
};
