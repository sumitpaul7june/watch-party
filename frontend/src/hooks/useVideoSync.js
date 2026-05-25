import { useRef, useEffect } from 'react';

export const useVideoSync = (socket) => {
    const playerRef = useRef(null);
    const isReceivingSyncRef = useRef(false);

    // THE RECEIVER (Listens to the backend)
    useEffect(() => {
        const handleVideoCommand = (data) => {
            if (!playerRef.current) return;

            const currentState = playerRef.current.getPlayerState();
            const myCurrentTime = playerRef.current.getCurrentTime();

            // 1. SYNC THE TIME FIRST
            const timeDifferences = Math.abs(myCurrentTime - data.currentTime);
            if (timeDifferences > 2) {
                console.log(`Large time gap detected. Forcing sync to ${data.currentTime}`);
                isReceivingSyncRef.current = true;
                playerRef.current.seekTo(data.currentTime);
            }

            // 2. WAIT FOR ME PROTOCOL (Buffering)
            if (data.stateCode === 3 && currentState !== 2) {
                console.log('Other user is buffering. Pausing to wait.');
                isReceivingSyncRef.current = true;
                playerRef.current.pauseVideo();
            }

            // 3. HANDLE PLAY
            if (data.stateCode === 1 && currentState !== 1) {
                console.log('Received PLAY. Raising shield.');
                isReceivingSyncRef.current = true;
                playerRef.current.playVideo();
            }

            // 4. HANDLE PAUSE
            if (data.stateCode === 2 && currentState !== 2) {
                console.log('Received PAUSE. Raising shield.');
                isReceivingSyncRef.current = true;
                playerRef.current.pauseVideo();
            }
        };

        socket.on('video-command', handleVideoCommand);

        return () => {
            socket.off('video-command', handleVideoCommand);
        };
    }, [socket]);

    // THE SENSOR / EMITTER (Triggered by local human interaction)
    const handleStateChange = (e) => {
        if (isReceivingSyncRef.current === true) {
            console.log(`Shield is UP. Ignoring to prevent loop.`);
            isReceivingSyncRef.current = false;
            return;
        }

        const stateCode = e.data;
        const currentTime = e.target.getCurrentTime();

        if (stateCode === 1 || stateCode === 2 || stateCode === 3) {
            console.log("Human interaction detected. Sending command...");
            socket.emit('video-command', { stateCode, currentTime });
        }
    };

    const onPlayerReady = (e) => {
        playerRef.current = e.target;
        console.log('Remote control connected');
    };

    return {
        onPlayerReady,
        handleStateChange
    };
};