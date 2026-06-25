import { useEffect } from "react";
import { useNavigate } from "react-router";

// --- ROOM MANAGEMENT HOOK ---
// I built this custom hook to handle the complex lifecycle of joining and leaving rooms via WebSockets.
export const useRoomManagement = (roomId, socket) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!roomId) return;
        
        socket.emit('join-room', roomId);

        // Handle the case where the room is completely full
        const handleFullRoomError = (fullRoomId) => {
            alert(`This room is full (${fullRoomId}). Please try joining another room.`);
            navigate('/'); // Bounce them back to the landing page!
        };

        // Handle the case where someone typed a fake room code in the URL
        const handleInvalidRoomError = () => {
            alert(`This room code does not exist!`);
            navigate('/'); // Bounce them back to the landing page!
        }

        socket.on('full-room-error', handleFullRoomError);
        socket.on('invalid-room-error', handleInvalidRoomError);

        // Cleanup function runs when the user leaves the Room Page
        return () => {
            socket.emit('leave-room', roomId);
            socket.off('full-room-error', handleFullRoomError);
            socket.off('invalid-room-error', handleInvalidRoomError);
        }
    }, [socket, roomId, navigate]);
};
