import { useRef } from 'react';
import { useYoutubePlayer } from './useYoutubePlayer';
import { useRoomSocket } from './useRoomSocket';

export const useSyncLogic = (socket, roomId, videoId, setVideoId) => {
    // 1. Get our Player Muscles
    const player = useYoutubePlayer();

    // 2. The Shield: What state are we waiting for the player to reach?
    const expectedState = useRef(null);

    // 3. What to do when the Ears hear a command from another user
    const onVideoCommand = (data) => {
        const currentState = player.getState();
        const myCurrentTime = player.getCurrentTime();

        // 3a. Force sync time if we are too far apart
        if (Math.abs(myCurrentTime - data.currentTime) > 2) {
            console.log(`Forcing sync to ${data.currentTime}`);
            player.seekTo(data.currentTime);
        }

        // 3b. Raise the shield: tell the Brain exactly what state we expect to hit
        expectedState.current = data.stateCode;

        // 3c. Command the Muscles to move
        if (data.stateCode === 3 && currentState !== 2) player.pause();
        else if (data.stateCode === 1 && currentState !== 1) player.play();
        else if (data.stateCode === 2 && currentState !== 2) player.pause();
    };

    const onVideoIdChange = (newVideoId) => {
        if (setVideoId) setVideoId(newVideoId);
    };

    // 4. Get our Mouth and Ears
    const { broadcastCommand } = useRoomSocket(socket, roomId, videoId, onVideoCommand, onVideoIdChange);

    // 5. The Sensor: This listens to the actual YouTube video player
    const handleStateChange = (e) => {
        const stateCode = e.data;
        const currentTime = player.getCurrentTime();

        // If the shield is up, check if we reached our destination!
        if (expectedState.current !== null) {
            if (stateCode === expectedState.current) {
                console.log(`Reached expected state: ${stateCode}. Dropping shield.`);
                expectedState.current = null; // Drop the shield!
            }
            return; // Ignore this event, do NOT broadcast
        }

        // If the shield is down, this was a real human click!
        if ([1, 2, 3].includes(stateCode)) {
            console.log("Human interaction detected! Shouting to the room...");
            broadcastCommand(stateCode, currentTime);
        }
    };

    // Return the two things the VideoPlayer.jsx component needs to render the video
    return {
        onPlayerReady: player.onPlayerReady,
        handleStateChange
    };
};
