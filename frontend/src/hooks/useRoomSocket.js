import { useEffect } from 'react';

/**
 * useRoomSocket Hook
 * 
 * A specialized hook that manages the low-level socket connections for media synchronization.
 * It abstracts away the repetitive logic of setting up and tearing down event listeners 
 * for video playback commands, providing a clean interface for media players to use.
 * 
 * @param {object} socket - The active Socket.io connection.
 * @param {string} roomId - The ID of the current room.
 * @param {function} onVideoCommand - The callback function to execute when a command is received.
 */
export const useRoomSocket = (socket, roomId, onVideoCommand) => {

    useEffect(() => {
        if (!socket) return;

        // Attaches the provided callback function to listen for incoming video synchronization 
        // commands (like play, pause, or seek) broadcasted by the server.
        socket.on('video-command', onVideoCommand);

        // Cleanup: Removes the listener when the component unmounts to prevent memory 
        // leaks and duplicate event firing if the user rejoins the room.
        return () => {
            socket.off('video-command', onVideoCommand);
        };
    }, [socket, onVideoCommand]);

    /**
     * Helper function to send video synchronization commands to the rest of the room.
     * Automatically packages the command payload with the correct roomId.
     * 
     * @param {object} command - The payload (e.g., { mediaType: 'youtube', stateCode: 1, currentTime: 12.5 })
     */
    const broadcastCommand = (command) => {
        if (!socket || !roomId) return;
        
        // Transmits the local video action to the backend server to be broadcasted to all other users
        socket.emit('video-command', { ...command, roomId });
    };

    return { broadcastCommand };
};
