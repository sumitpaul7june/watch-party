import React from 'react'
import { useState, useRef } from 'react'
import YouTube from 'react-youtube'

const HomePage = () => {

    
    const [inputValue, setInputValue] = useState('');
    const playerRef = useRef(null);

    

    // Extract Video ID from youtube video url
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
        playerRef.current = e.target;
        console.log('Remote control connected');
        
    }
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    }

    const handleStateChange = (e) => {
        const stateCode = e.data;
        const state = e.target;
        const currentTime = state.getCurrentTime();
        
       console.log(currentTime);
       
        if(stateCode == 1) console.log('User hit play at:', currentTime);
        if(stateCode == 2) console.log('User hit pause at:', currentTime);
        if(stateCode == 3) console.log('User scrubbed to:', currentTime);
        
        
    }


  return (
    <div>
        <input type="text" placeholder="Enter the youtube link" value = {inputValue} onChange={handleInputChange}/>

        <div>
        {videoId &&  <YouTube videoId={videoId} opts={opts} onStateChange={handleStateChange} onReady={onPlayerReady} />}
        </div>

        <div>
            <button onClick={() => playerRef.current.playVideo()}>Force Play</button>
            <button onClick={() => playerRef.current.pauseVideo()}>Force Pause</button>
            <button onClick={() => playerRef.current.seekTo(60)}>Force Skip 1min</button>
        </div>
       

    </div>
  )
}

export default HomePage
