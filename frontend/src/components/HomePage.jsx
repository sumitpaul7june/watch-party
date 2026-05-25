import React, { useState } from 'react';
import YouTube from 'react-youtube';
import { io } from 'socket.io-client';
import { extractYouTubeVideoId } from '../utils/videoUtils';
import { useVideoSync } from '../hooks/useVideoSync';

const socket = io("http://localhost:8080");

const HomePage = () => {
    const [inputValue, setInputValue] = useState('');

    const { onPlayerReady, handleStateChange } = useVideoSync(socket);
    const videoId = extractYouTubeVideoId(inputValue);
    
    const opts = {
        height: '500',
        width: '800',
        playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
        }
    };

    return (
        <div>
            <input 
                type="text" 
                placeholder="Enter the youtube link" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)}
            />

            <div>
                {videoId && (
                    <YouTube 
                        videoId={videoId} 
                        opts={opts} 
                        onStateChange={handleStateChange} 
                        onReady={onPlayerReady} 
                    />
                )}
            </div>
        </div>
    );
};

export default HomePage;