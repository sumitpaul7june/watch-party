import isValidVideoCommand from '../utils/videoValidators.js';
import { roomStore } from '../store/roomStore.js';


const videoHandler = (socket) => {
    // Handle video state synchronization
    socket.on('video-id', (data) => {
        const { videoId, roomId } = data;
        if (!videoId || !roomId) return;

        // Persist video state in memory
        roomStore.setRoomVideo(roomId, videoId);

        // Broadcast video state to peers
        socket.to(roomId).emit('video-id', videoId);
    });

    // Listen for video commands from this user
    socket.on('video-command', (data) => {
        console.log(`Command received from ${socket.id}: `, data);

        // Validate the payload before broadcasting it to other end user.
        if (!isValidVideoCommand(data) || !data.roomId) {
            console.log('backend command data: ', data);
            console.log("Invalid video command payload dropped.");
            return;
        }

        // Relay the sync command to everyone else in the room
        socket.to(data.roomId).emit('video-command', data);
    });
};

export default videoHandler;