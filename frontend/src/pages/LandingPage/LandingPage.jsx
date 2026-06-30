import { useState, useContext } from "react";
import {useNavigate } from "react-router";
import { socket } from "../../socket.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./LandingPage.css";

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
        // If they aren't logged in, auto-create a guest session first
        if (!user) {
            const guestResult = await loginAsGuest();
            if (!guestResult.success) {
                alert('Failed to create guest session');
                return;
            }
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

    const lastRoomId = localStorage.getItem('watchPartyLastRoom');

    const handleJoinRecentRoom = () => {
        if(lastRoomId) {
            setRoomId(lastRoomId);
            // I can't directly call handleJoinRoom because it relies on the state which is async, 
            // so I'll just navigate or call the logic directly. But since I need to check validity:
            socket.emitWithAck('check-room', lastRoomId).then(response => {
                if (response.status === 'invalid') {
                    alert('This room is no longer active!');
                    localStorage.removeItem('watchPartyLastRoom');
                } else if (response.status === 'full') {
                    alert('Sorry, this room is currently full! Max 4 people allowed.');
                } else {
                    navigate(`/home/${lastRoomId}`);
                }
            });
        }
    }

    return(
        <div className="landing-page-container">
            <div className="auth-controls">
                {user ? (
                    <button onClick={handleLogout} className="btn-logout">
                        Logout ({user.username})
                    </button>
                ) : (
                    <button onClick={() => navigate('/login')} className="btn-secondary" style={{width: 'auto'}}>
                        Login
                    </button>
                )}
            </div>

            <div className="landing-card">
                <h1 className="landing-title">Watch Party</h1>
                <p className="landing-subtitle">Watch videos in sync with your friends.</p>

                <div className="action-section">
                    <button className="btn-primary" onClick={handleCreateRoom}>
                        Create a New Room
                    </button>
                    
                    <div className="divider">or</div>
                    
                    <div className="join-section">
                        <input 
                            type="text" 
                            placeholder="Enter room code" 
                            value={roomId} 
                            onChange={handleJoinChange}
                        />
                        <button className="btn-secondary" onClick={handleJoinRoom}>
                            Join Room
                        </button>
                    </div>

                    {lastRoomId && (
                        <>
                            <div className="divider"></div>
                            <button 
                                className="btn-secondary" 
                                style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: 'var(--accent-primary)' }}
                                onClick={handleJoinRecentRoom}
                            >
                                Rejoin Recent Room ({lastRoomId})
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LandingPage;