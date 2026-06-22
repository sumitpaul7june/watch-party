import YoutubePlayer from "./players/YoutubePlayer.jsx";
import DirectPlayer from "./players/DirectPlayer.jsx";

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
