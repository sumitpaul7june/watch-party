import YouTube from "react-youtube";
import { useYoutubeSync } from "./youtube/useYoutubeSync.js";
import "./YoutubePlayer.css";

/**
 * YoutubePlayer Component
 * 
 * I use this component specifically to embed and synchronize YouTube videos.
 * It leverages the 'react-youtube' wrapper to interface with the official YouTube IFrame API.
 * The heavy lifting of synchronization logic is abstracted away into the 'useYoutubeSync' hook.
 * 
 * @param {object} socket - The active Socket.io connection.
 * @param {string} roomId - The ID of the room.
 * @param {object} mediaSource - Contains the parsed YouTube videoId.
 */
const YoutubePlayer = ({ socket, roomId, mediaSource }) => {
    // I extract the sync handlers from my custom hook
    const { onPlayerReady, handleStateChange } = useYoutubeSync(socket, roomId);

    const opts = {
        height: "100%",
        width: "100%",
        playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
        }
    };

    return (
        <YouTube
            videoId={mediaSource.videoId}
            opts={opts}
            onStateChange={handleStateChange}
            onReady={onPlayerReady}
            className="youtube-container"
            iframeClassName="youtube-iframe"
        />
    );
};

export default YoutubePlayer;
