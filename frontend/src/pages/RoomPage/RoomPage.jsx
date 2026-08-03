import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useRoomManagement } from '../../hooks/useRoomManagement.js';
import VideoPlayer from '../../components/media/VideoPlayer.jsx';
import ChatBox from '../../components/ChatBox.jsx';
import { socket } from '../../socket.js';
import './RoomPage.css';
import MediaSelector from '../../components/media/MediaSelector.jsx';

/**
 * RoomPage Component
 * 
 * This is the main screen users see when they join a watch party.
 * It holds the video player on the left and the chat box on the right.
 */
const RoomPage = () => {

    // Keeps track of what video is currently playing (like a YouTube link)
    const[mediaSource, setMediaSource] = useState(null);

    // Gets the room code from the website URL (e.g., /home/1234 -> gets '1234')
    const {roomId} = useParams();

    // A helper that automatically connects the user to the room when they open the page
    // and disconnects them when they leave
    useRoomManagement(roomId, socket);

    // When the user picks a new video, update our screen and tell everyone else in the room
    const handleMediaSelect = (source) =>
    {
        setMediaSource(source);
        socket.emit("media-source", {
            roomId,
            mediaSource: source
        })
    }

    useEffect(() => {
        // Remember this room code so the user can easily click "Rejoin" on the home page later
        localStorage.setItem('watchPartyLastRoom', roomId);

        // This function updates the video when someone else changes it
        const updateVideo = (source) => setMediaSource(source);

        // Start listening for video changes from the server
        socket.on("media-source", updateVideo);

        // Cleanup: Stop listening when the user leaves the page
        return () => socket.off("media-source", updateVideo);
    }, [roomId]);


    return (
        <div className="room-page-layout">
            <div className="main-content-area">
                <div className="media-control-panel">
                    <MediaSelector onMediaSelect={handleMediaSelect}/>
                </div>

                <div className="video-container">
                    <VideoPlayer
                        socket={socket}
                        roomId={roomId}
                        mediaSource={mediaSource}
                    />
                </div>
            </div>

            <div className="side-panel">
                <ChatBox roomId={roomId} />
            </div>
        </div>
    );
};

export default RoomPage;
