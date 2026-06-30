import YoutubePlayer from "./players/YoutubePlayer.jsx";
import DirectPlayer from "./players/DirectPlayer.jsx";

/**
 * VideoPlayer Component
 * 
 * I designed this as a wrapper component that dynamically loads the correct 
 * underlying video player based on the current media source type.
 * 
 * @param {object} socket - The active Socket.io connection.
 * @param {string} roomId - The ID of the room.
 * @param {object} mediaSource - The media configuration (type, url, videoId, etc.).
 */
const VideoPlayer = ({ socket, roomId, mediaSource }) => {
    if (!mediaSource) return null;

    switch (mediaSource.type) {
        case "youtube":
            return (
                <YoutubePlayer
                    socket={socket}
                    roomId={roomId}
                    mediaSource={mediaSource}
                />
            );

        case "direct":
            return(
                <DirectPlayer
                    socket={socket}
                    roomId={roomId}
                    mediaSource={mediaSource}
                />);

        default:
            return <div>This media type is not supported yet.</div>;
    }
};

export default VideoPlayer;
