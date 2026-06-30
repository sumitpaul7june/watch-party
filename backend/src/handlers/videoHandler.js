import isValidVideoCommand from '../utils/videoValidators.js';
import { roomStore } from '../store/roomStore.js';
import { canAccessRoom } from '../utils/socketGuards.js';


const videoHandler = (socket) => {
    // Handle video state synchronization
    socket.on('media-source', (data) => {
        const { roomId, mediaSource } = data;
        if (!roomId || !mediaSource) return;
        if (!canAccessRoom(socket, roomId)) return;


        roomStore.setRoomMediaSource(roomId, mediaSource);


        socket.to(roomId).emit('media-source', mediaSource);
    });

    // Listen for video commands from this user
    socket.on('video-command', (data) => {
        console.log(`Command received from ${socket.id}: `, data);

        // Validate the payload before broadcasting it to other end user.
        if (!isValidVideoCommand(data) || !canAccessRoom(socket, data.roomId)) {
            console.log('backend command data: ', data);
            console.log("Invalid video command payload dropped.");
            return;
        }

        // Relay the sync command to everyone else in the room
        socket.to(data.roomId).emit('video-command', data);

        // --- Generate a system chat message for the action ---
        const actionText = data.action === 'play' ? 'started playing the video' : 
                           data.action === 'pause' ? 'paused the video' : 
                           'jumped to a new timestamp';
                           
        const systemMessage = {
            text: actionText,
            senderId: socket.id,
            senderName: socket.user?.username || 'Anonymous',
            type: 'system' // Tag it so the UI knows it's a system event
        };

        // Persist it and broadcast it so it shows in the chat sidebar
        roomStore.addChatMessage(data.roomId, systemMessage);
        socket.to(data.roomId).emit('new-messages', systemMessage);
        socket.emit('new-messages', systemMessage); // Echo back to the sender
    });
};

export default videoHandler;
