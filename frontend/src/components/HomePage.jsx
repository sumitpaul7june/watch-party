import React, { useState } from 'react';
import { io } from 'socket.io-client';import { useParams } from 'react-router';
import { useRoomManagement } from '../hooks/useRoomManagement.js';
import VideoPlayer from './VideoPlayer.jsx';

const socket = io("http://localhost:8080");

const HomePage = () => {

    const [inputValue, setInputValue] = useState('');
    const [videoId, setVideoId] = useState('');

   
    // Fetch room from the url params
    const {roomId} = useParams();
    console.log('fetched ', roomId);
    
    
    // Join the socket to a specific room
    useRoomManagement(roomId, socket);

    // Fetch video Id from the
    const handleInputChange = (e) => {
        const url = e.target.value;
        setInputValue(url);

        let extracted = '';
        if (url.includes("v=")) 
        {
            // Standard youtube.com/watch?v=XXXXX
            extracted = url.split("v=")[1].split("&")[0];
        }
        else if (url.includes("youtu.be/")) 
        {
            // Shortened youtu.be/XXXXX
            extracted = url.split("youtu.be/")[1].split("?")[0];
        }

        if(extracted)
        {
            setVideoId(extracted);
        }
    }
   

    return (
        <div>
            <input 
                type="text" 
                placeholder="Enter the youtube link" 
                value={inputValue} 
                onChange={handleInputChange}
            />

            <div>
                <VideoPlayer
                socket={socket}
                roomId={roomId}
                videoId={videoId}
                setVideoId = {setVideoId}
                />
            </div>
        </div>
    );
};

export default HomePage;