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
 * I use this component as the primary view when a user is actively participating in a watch party.
 * It manages the high-level state for the room (like the current media source) and renders the
 * layout comprising the video player, chat box, and media selector.
 */
const RoomPage = () => {

    // I track the currently playing media source (e.g., YouTube URL or Direct Link) here.
    // This state is shared down to the VideoPlayer so it knows what to render.
    const[mediaSource, setMediaSource] = useState(null);

    // I fetch the roomId directly from the URL path so I know which room to join.
    const {roomId} = useParams();

    // Custom hook I created to handle all the socket joining/leaving logic automatically on mount/unmount.
    useRoomManagement(roomId, socket);

    const handleMediaSelect = (source) =>
    {
        setMediaSource(source);
        socket.emit("media-source", {
            roomId,
            mediaSource: source
        })
    }

    useEffect(() => {
        // Save the room ID to local storage so I can easily rejoin it
        localStorage.setItem('watchPartyLastRoom', roomId);

        const handleMediaSource = (source) => {
            setMediaSource(source);
        };

        socket.on("media-source", handleMediaSource);

        return () => {
            socket.off("media-source", handleMediaSource);
        }
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
