import { useState } from "react";
import {useNavigate } from "react-router";


function CreateRoom()
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

    const handleJoinRoom = () => {
        if(roomId.trim() === '') return;
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