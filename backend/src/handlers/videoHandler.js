import isValidVideoCommand from '../utils/videoValidators.js';


export default (socket) => {
    // Listen for video commands from this user
    socket.on('video-command', (data) => {
        console.log(`Command received from ${socket.id}: `, data);

        // Validate the payload before broadcasting it to other end user.
        if (!isValidVideoCommand(data)) {
            console.log("Invalid video command payload dropped.");
            return;
        }

        // Global broadcast: Send this exact command to everyone else connected
        socket.broadcast.emit('video-command', data);
    });
};