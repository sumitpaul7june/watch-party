import isValidVideoCommand from '../utils/videoValidators.js';


const videoHandler = (socket) => {
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