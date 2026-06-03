import { useState } from "react";
import {useNavigate } from "react-router";
import { socket } from "../socket.js";

const CreateRoom = () =>
{
    
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');

    const handleJoinChange = (e) => {
        setRoomId(e.target.value);
    }

    const handleCreateRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 8);
        navigate(`/home/${newRoomId}`);
    }

     const handleJoinRoom = async () => {
        if(roomId.trim() === '') return;

        // 1. Emit the question and wait for the server's direct answer
        const response = await socket.emitWithAck('check-room', roomId);

        // 2. Check the answer
        if (response.status === 'full') {
            alert('Sorry, this room is currently full! Max 4 people allowed.');
            return; // Stop them from navigating to the room
        }

        // 3. If the server says 'ok', route them to the room!
        navigate(`/home/${roomId}`);
    }


    return(
    <div>
        <div className="create-btn">
            <button onClick={handleCreateRoom}>
                Create a new room
            </button>
        </div>
        
        <div>
            <input type="text" placeholder="Enter the joining code" value={roomId} onChange={handleJoinChange}/>
            <button value={roomId}  onClick={handleJoinRoom}>Join the room</button>
        </div>
        
    </div>
    );
}

export default CreateRoom;