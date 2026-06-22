import { useRef } from 'react';
import { useRoomSocket } from '../../../../hooks/useRoomSocket.js';

export const useYoutubeSync = (socket, roomId) => {
    const playerRef = useRef(null);
    const expectedState = useRef(null);

    const onPlayerReady = (e) => {
        playerRef.current = e.target;
        console.log('YouTube Player is ready and connected!');
    };

    const onVideoCommand = (data) => {
        if (data.mediaType !== 'youtube') return;

        const player = playerRef.current;
        if (!player) return;

        const currentState = player.getPlayerState();
        const myCurrentTime = player.getCurrentTime() || 0;

        if (Math.abs(myCurrentTime - data.currentTime) > 2) {
            console.log(`Forcing sync to ${data.currentTime}`);
            player.seekTo(data.currentTime);
        }

        expectedState.current = data.stateCode;

        if (data.stateCode === 1 && currentState !== 1) {
            player.playVideo();
        }
        else if (data.stateCode === 2 && currentState !== 2) {
            player.pauseVideo();
        }
    };

    const { broadcastCommand } = useRoomSocket(socket, roomId, onVideoCommand);

    const handleStateChange = (e) => {
        const player = playerRef.current;
        if (!player) return;

        const stateCode = e.data;
        const currentTime = player.getCurrentTime() || 0;

        if (expectedState.current !== null) {
            if (stateCode === expectedState.current) {
                console.log(`Reached expected state: ${stateCode}. Dropping shield.`);
                expectedState.current = null;
            }
            return;
        }

        if ([1, 2].includes(stateCode)) {
            console.log("Human interaction detected! Shouting to the room...");
            broadcastCommand({
                mediaType: 'youtube',
                stateCode,
                currentTime
            });
        }
    };

    return {
        onPlayerReady,
        handleStateChange
    };
};
