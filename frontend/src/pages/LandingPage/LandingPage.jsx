import { useState, useContext } from "react";
import {useNavigate } from "react-router";
import { socket } from "../../socket.js";
import { AuthContext } from "../../context/AuthContext.jsx";

const LandingPage = () =>
{
    
    const navigate = useNavigate();
    const { user, logout, loginAsGuest } = useContext(AuthContext);
    const [roomId, setRoomId] = useState('');

    const handleJoinChange = (e) => {
        setRoomId(e.target.value);
    }

    const handleLogout = () => {
        logout();
        navigate('/login'); // Send them back to the login screen
    }

    const handleCreateRoom = async () => {
        // If they aren't logged in, route them straight to login!
        if (!user) {
            alert('You must be logged in to create a room!');
            navigate('/login');
            return;
        }

        // Ask the backend for a guaranteed unique code!
        const response = await socket.emitWithAck('create-room');
        navigate(`/home/${response.roomId}`);
    }

     const handleJoinRoom = async () => {
        if(roomId.trim() === '') return;

        // If they aren't logged in, route them straight to login!
        if (!user) 
        {

            const guestResult = await loginAsGuest();
            if(!guestResult.success)
            {
                alert('Failed to join as guest');
                return;
            }
        }

        // 1. Emit the question and wait for the server's direct answer
        const response = await socket.emitWithAck('check-room', roomId);

        // 2. Check the answer
        if (response.status === 'invalid') {
            alert('This room code does not exist!');
            return;
        }

        if (response.status === 'full') {
            alert('Sorry, this room is currently full! Max 4 people allowed.');
            return; // Stop them from navigating to the room
        }

        // 3. If the server says 'ok', route them to the room!
        navigate(`/home/${roomId}`);
    }


    return(
    <div>
        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
            {user && (
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Logout ({user.username})
                </button>
            )}
        </div>

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

export default LandingPage;