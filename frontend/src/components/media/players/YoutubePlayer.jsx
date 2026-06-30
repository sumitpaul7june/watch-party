import YouTube from "react-youtube";
import { useYoutubeSync } from "./youtube/useYoutubeSync.js";
import "./YoutubePlayer.css";

const YoutubePlayer = ({ socket, roomId, mediaSource }) => {
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
