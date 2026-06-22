import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useRoomManagement } from '../../hooks/useRoomManagement.js';
import VideoPlayer from '../../components/media/VideoPlayer.jsx';
import ChatBox from '../../components/ChatBox.jsx';
import { socket } from '../../socket.js';
import './RoomPage.css';
import MediaSelector from '../../components/media/MediaSelector.jsx';

const RoomPage = () => {


    const[mediaSource, setMediaSource] = useState(null);

    // Fetch room from the url params
    const {roomId} = useParams();
    console.log('fetched ', roomId);

    // Join the socket to a specific room
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
        const handleMediaSource = (source) => {
            setMediaSource(source);
        };

        socket.on("media-source", handleMediaSource);

        return () => {
            socket.off("media-source", handleMediaSource);
        }
    }, []);


    return (
        <div className="room-container">
            <div className="media-container">
                <MediaSelector onMediaSelect={handleMediaSelect}/>
            </div>

            <VideoPlayer
                socket={socket}
                roomId={roomId}
                mediaSource = {mediaSource}
            />

            <div className="chat-section">
                <ChatBox roomId={roomId} />
            </div>
        </div>
    );
};

export default RoomPage;
