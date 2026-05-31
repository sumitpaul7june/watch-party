import { useVideoSync } from "../hooks/useVideoSync";
const VideoPlayer = ({socket, roomId, videoId}) => {

    const {onPlayerReady, handleStateChange } = useVideoSync(socket);

    const opts = {
        height: '500',
        width: '800',
        playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
        }
    };
    
    if(!videoId) return;
    return(
        <YouTube 
            videoId={videoId} 
            opts={opts} 
            onStateChange={handleStateChange} 
            onReady={onPlayerReady} 
        />
     );
};

export default VideoPlayer;