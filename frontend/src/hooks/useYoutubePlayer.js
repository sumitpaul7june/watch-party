import { useRef } from "react";


export const useYoutubePlayer = () => {
    const playerRef = useRef(null);

    // 1. The callback for when the Youtube iframe finishes loading
    const onPlayerReady = (e) => {
        playerRef.current = e.target;
        console.log('YouTube Player is ready and connected!');
    }
    // 2. Helper functions so other files don't have to touch playerRef directly
    const play = () => playerRef.current?.playVideo();
    const pause = () => playerRef.current?.pauseVideo();
    const seekTo = (time) => playerRef.current?.seekTo(time);
    const getCurrentTime = () => playerRef.current?.getCurrentTime() || 0;
    const getState = () => playerRef.current?.getPlayerState() || -1;

    return {
        onPlayerReady,
        play,
        pause,
        seekTo,
        getCurrentTime,
        getState
    };
}