import React from 'react';
import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { io } from 'socket.io-client';

// Initialize WebSocket connection outside the component.
// This prevents the socket from disconnecting/reconnecting on every React re-render.
const socket = io("http://localhost:8080");

const HomePage = () => {
    
    const [inputValue, setInputValue] = useState('');

    // This acts as our "remote control" for the YouTube video. 
    // We save the player instance here so we can force it to play/pause later.
    const playerRef = useRef(null);

    // THE SHIELD (Client-Side Debouncer)
    // Tracks event origin (Human vs. Server). We use useRef instead of useState 
    // because it updates synchronously in memory, bypassing React's batched render cycle. 
    // This allows us to instantly intercept raw DOM events from the YouTube API.
    const isReceivingSyncRef = useRef(false);

    // Extract Video ID from youtube video url (handles standard "v=" format)
    const videoId = inputValue && inputValue.includes("v=") ? inputValue.split("v=")[1].split("&")[0] : '';
    
    const opts = {
        height: '500',
        width: '800',
        playerVars: {
            controls: 1,
            rel: 0,
            modestbranding: 1,
        }
    }

    const onPlayerReady = (e) => {
        // Save the raw YouTube player instance to our ref so we can command it directly
        playerRef.current = e.target;
        console.log('Remote control connected');
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    }

    // THE SENSOR / EMITTER
    // Fires whenever the YouTube player changes state (Play, Pause, Scrub).
    const handleStateChange = (e) => {

        // GATEKEEPER: Prevent the infinite ping-pong loop.
        // If the server forced this state change, we block the local API from echoing it back.
        if(isReceivingSyncRef.current === true) {
            console.log(`Shield is UP. The server caused this. Ignoring to prevent loop.`);
            isReceivingSyncRef.current = false; // Drop shield for the next human interaction
            return;
        }

        const stateCode = e.data;
        const currentTime = e.target.getCurrentTime();
        
        console.log(`Current Time: ${currentTime}`);
        
        // Youtube player states: 1 = Playing, 2 = Paused, 3 = Buffering/Scrubbing
        if(stateCode == 1 || stateCode == 2 || stateCode == 3) {
            console.log(" Human interaction detected. Sending command to backend...");
            // Emit the state code and current timestamp to the server to broadcast
            socket.emit('video-command', { stateCode, currentTime });
        }   
    }

   // THE RECEIVER
   useEffect(() => {
    socket.on('video-command', (data) => {
        if(!playerRef.current) return;
        
        const currentState = playerRef.current.getPlayerState();
        const myCurrentTime = playerRef.current.getCurrentTime();
        
        // 1. SYNC THE TIME FIRST
        // Fix the location before we touch the play/pause buttons
        const timeDifferences = Math.abs(myCurrentTime - data.currentTime);
        if(timeDifferences > 2) {
            console.log(`Large time gap detected. Forcing sync to ${data.currentTime}`);
            isReceivingSyncRef.current = true;
            playerRef.current.seekTo(data.currentTime);
        }

        // 2. THE "WAIT FOR ME" PROTOCOL (Red Light)
        // If they are buffering, we must pause and wait.
        if(data.stateCode === 3) {
            if(currentState !== 2) { // Protect against the stuck shield!
                console.log('Other user is buffering. Pausing to wait.');
                isReceivingSyncRef.current = true;
                playerRef.current.pauseVideo();
            }
        }

        // 3. HANDLE PLAY (Green Light)
        if(data.stateCode === 1) {
            if(currentState !== 1) {
                console.log('Received PLAY. Raising shield.');
                isReceivingSyncRef.current = true;
                playerRef.current.playVideo();
            }
        }

        // 4. HANDLE PAUSE
        if(data.stateCode === 2) {
            if(currentState !== 2) {
                console.log('Received PAUSE. Raising shield.');
                isReceivingSyncRef.current = true;
                playerRef.current.pauseVideo();
            }
        }
    });

    return () => {
        socket.off('video-command');
    }
}, []);

    return (
        <div>
            <input type="text" placeholder="Enter the youtube link" value={inputValue} onChange={handleInputChange}/>

            <div>
            {videoId && <YouTube videoId={videoId} opts={opts} onStateChange={handleStateChange} onReady={onPlayerReady} />}
            </div>
        </div>
    )
}

export default HomePage;