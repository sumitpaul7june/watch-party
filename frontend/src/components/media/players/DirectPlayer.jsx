import { useDirectSync } from "./direct/useDirectSync.js";

/**
 * DirectPlayer Component
 * 
 * I created this component to handle native HTML5 video playback for direct media links (like .mp4).
 * It attaches React event listeners to the native `<video>` element and passes those events
 * to my custom `useDirectSync` hook to broadcast playback state to the rest of the room.
 * 
 * @param {object} socket - The active Socket.io connection.
 * @param {string} roomId - The ID of the room.
 * @param {object} mediaSource - Contains the direct media URL.
 */
const DirectPlayer = ({ socket, roomId, mediaSource }) => {
    const {
        videoRef,
        handlePlay,
        handlePause,
        handleSeeked
    } = useDirectSync(socket, roomId);

    return (
        <video
            ref={videoRef}
            key={mediaSource.url}
            src={mediaSource.url}
            controls
            width="800"
            height="500"
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={handleSeeked}
        >
            Your browser does not support video playback.
        </video>
    );
};

export default DirectPlayer;