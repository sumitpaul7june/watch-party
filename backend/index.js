import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { log } from 'console';
import isValidVideoCommand from './utils/videoValidators.js';

const app = express();

// Let react app on port 5173 connect to backend.
app.use(cors());

const PORT = 8080;

// Express only handles request-response connection unlike birdirectional peristent communication so we took the help of raw Node js server.
const server = http.createServer(app);

// It hooks the socketio into the server and configured to allow cors requests and it's methods.
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
});




// Event listener for when any React frontend connects
io.on('connection', (socket) => {
    console.log(`Command recieved from ${socket.id}`);

    // Listen for video commands from this user
    socket.on('video-command', (data) => {
        console.log(`Command recieved from ${socket.id}: `, data);

        // Validate the payload before broadcasting it to other end user.
        if (!isValidVideoCommand(data)) return;

        // Broadcast this exact command to everyone else
        socket.broadcast.emit('video-command', data);

    })

    // When the user gets disconnected
    socket.on('disconnect', () => {
        console.log(`User disconnected: `, socket.id);
    });

});





// Listen to all requests
server.listen(PORT, (req, res) => {
    console.log('Port is running');

})

