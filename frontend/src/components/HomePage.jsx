import React, { useState } from 'react';
import YouTube from 'react-youtube';
import { io } from 'socket.io-client';
import { extractYouTubeVideoId } from '../utils/videoUtils.js';
import { useVideoSync } from '../hooks/useVideoSync';
import { useParams } from 'react-router';
import { useRoomManagement } from '../hooks/useRoomManagement.js';
import VideoPlayer from './VideoPlayer.jsx';

const socket = io("http://localhost:8080");

const HomePage = () => {

    const [inputValue, setInputValue] = useState('');
   
    // Fetch room from the url params
    const {roomId} = useParams();
    console.log('fetched ', roomId);
    
    
    // Join the socket to a specific room
    useRoomManagement(roomId, socket);

    // Fetch video Id from the
    const videoId = extractYouTubeVideoId(inputValue);

    return (
        <div>
            <input 
                type="text" 
                placeholder="Enter the youtube link" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)}
            />

            <div>
                <VideoPlayer
                socket={socket}
                roomId={roomId}
                videoId={videoId}
                />
            </div>
        </div>
    );
};

export default HomePage;