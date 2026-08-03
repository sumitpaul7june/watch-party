import isValidVideoCommand from '../utils/videoValidators.js';
import { roomStore } from '../store/roomStore.js';
import { canAccessRoom } from '../utils/socketGuards.js';


// --- VIDEO EVENT HANDLER ---
// Manages media source updates and real-time playback synchronization (play, pause, seek)
const videoHandler = (socket) => {

    // 1. Media Source Update
    // Triggered when a user pastes a new video link (e.g., a YouTube URL)
    socket.on('media-source', (data) => {
        const { roomId, mediaSource } = data;
        
        if (!roomId || !mediaSource) return;
        
        // Security check: ensure the user is actually in the room
        if (!canAccessRoom(socket, roomId)) return;

        // Persist the new media source in memory so late-joiners can sync to it
        roomStore.setRoomMediaSource(roomId, mediaSource);

        // Broadcast the new video source to everyone else in the room
        socket.to(roomId).emit('media-source', mediaSource);
    });

    // 2. Video Playback Commands
    // Triggered when a user plays, pauses, or seeks the video
    socket.on('video-command', (data) => {
        console.log(`Command received from ${socket.id}: `, data);

        // Security check: validate the payload structure and verify room access
        if (!isValidVideoCommand(data) || !canAccessRoom(socket, data.roomId)) {
            console.log('Invalid video command payload dropped or unauthorized access.', data);
            return;
        }

        // Relay the sync command to everyone else in the room to keep players synchronized
        socket.to(data.roomId).emit('video-command', data);

        // --- System Chat Message Generation ---
        // Automatically generate a chat notification describing the user's action
        const actionText = data.action === 'play' ? 'started playing the video' : 
                           data.action === 'pause' ? 'paused the video' : 
                           'jumped to a new timestamp';
                           
        const systemMessage = {
            text: actionText,
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous',
            type: 'system' // Tag it as a system event so the UI can style it differently
        };

        // Persist the system message in memory and broadcast it to everyone in the room
        roomStore.addChatMessage(data.roomId, systemMessage);
        socket.to(data.roomId).emit('new-messages', systemMessage);
        socket.emit('new-messages', systemMessage);
    });
};

export default videoHandler;
