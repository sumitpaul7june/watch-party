import { Server } from "socket.io";
import registerVideoHandlers from './src/handlers/videoHandler.js';

export function initSocket(server) {

    // It hooks the socketio into the server and configured to allow cors requests and it's methods.
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        }
    });

    io.on('connection', (socket) => {
        console.log(`User is connected: ${socket.id}`);

        // Handle video-command from users
        registerVideoHandlers(io, socket);

        // When the user gets disconnected
        socket.on('disconnect', () => {
            console.log(`User disconnected: `, socket.id);
        });

    })
}