import { useRef } from 'react';
import { useRoomSocket } from '../../../../hooks/useRoomSocket.js';

/**
 * useYoutubeSync Hook
 * 
 * Handles the logic of synchronizing a YouTube video across multiple users.
 * It ensures that when one person pauses, plays, or scrubs the video, everyone else's 
 * video player does the same without getting caught in an infinite echo loop.
 */
export const useYoutubeSync = (socket, roomId) => {
    // Stores a direct reference to the YouTube player instance so it can be controlled programmatically
    const playerRef = useRef(null);

    // Acts as a "shield" to prevent infinite echo loops. When the server tells this player to pause, 
    // it expects a pause event to fire locally. This ref remembers that expected state so the 
    // local event isn't accidentally broadcasted back to the server again.
    const expectedState = useRef(null);

    // Fires exactly once when the YouTube iframe finishes loading
    const onPlayerReady = (e) => {
        playerRef.current = e.target;
        console.log('YouTube Player is ready and connected!');
    };

    // Receiver: Handles incoming commands (play/pause/seek) broadcasted by other users in the room
    const onVideoCommand = (data) => {
        // Ignore commands meant for different media players (like direct MP4s)
        if (data.mediaType !== 'youtube') return;

        const player = playerRef.current;
        if (!player) return;

        const currentState = player.getPlayerState();
        const myCurrentTime = player.getCurrentTime() || 0;

        // If the local video is more than 2 seconds out of sync with the incoming command, force a seek
        if (Math.abs(myCurrentTime - data.currentTime) > 2) {
            console.log(`Forcing sync to ${data.currentTime}`);
            player.seekTo(data.currentTime);
        }

        // Raise the "shield". The local player is about to be forced into a new state.
        // Remembering this state prevents the local player from shouting it back to the server.
        expectedState.current = data.stateCode;

        // Apply the incoming state (1 = Playing, 2 = Paused)
        if (data.stateCode === 1 && currentState !== 1) {
            player.playVideo();
        }
        else if (data.stateCode === 2 && currentState !== 2) {
            player.pauseVideo();
        }
    };

    // A helper hook that sets up the socket listeners and provides a function to broadcast commands
    const { broadcastCommand } = useRoomSocket(socket, roomId, onVideoCommand);

    // Sender: Listens to the local user's manual interactions with the YouTube player
    const handleStateChange = (e) => {
        const player = playerRef.current;
        if (!player) return;

        const stateCode = e.data;
        const currentTime = player.getCurrentTime() || 0;

        // If this state change was caused by the server (the "shield" is up), drop the shield 
        // and ignore it. Do not broadcast this back to the room.
        if (expectedState.current !== null) {
            if (stateCode === expectedState.current) {
                console.log(`Reached expected state: ${stateCode}. Dropping shield.`);
                expectedState.current = null;
            }
            return;
        }

        // If this state change was a genuine human interaction (1 = Play, 2 = Pause),
        // broadcast it to everyone else in the room so they can sync up.
        if ([1, 2].includes(stateCode)) {
            console.log("Human interaction detected! Shouting to the room...");
            broadcastCommand({
                mediaType: 'youtube',
                stateCode,
                currentTime
            });
        }
    };

    // Expose only the necessary functions to the UI component
    return {
        onPlayerReady,
        handleStateChange
    };
};
