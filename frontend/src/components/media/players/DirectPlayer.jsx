import { useDirectSync } from "./direct/useDirectSync.js";

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