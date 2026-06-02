import { useSyncLogic } from "../hooks/useSyncLogic.js";
import YouTube from 'react-youtube';
const VideoPlayer = ({socket, roomId, videoId, setVideoId}) => {
    const {onPlayerReady, handleStateChange } = useSyncLogic(socket, roomId, videoId, setVideoId);

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