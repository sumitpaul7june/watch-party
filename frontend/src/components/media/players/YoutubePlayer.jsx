import YouTube from "react-youtube";
import { useYoutubeSync } from "./youtube/useYoutubeSync.js";

const YoutubePlayer = ({ socket, roomId, mediaSource }) => {
    const { onPlayerReady, handleStateChange } = useYoutubeSync(socket, roomId);

    const opts = {
        height: "500",
        width: "800",
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
        />
    );
};

export default YoutubePlayer;
