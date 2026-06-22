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
    });
};

export default videoHandler;
