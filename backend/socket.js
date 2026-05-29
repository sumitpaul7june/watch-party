import { Server } from "socket.io";
import roomHandler from "./src/handlers/roomHandler.js";
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
        roomHandler(socket);

        // When the user gets disconnected
        socket.on('disconnect', () => {
            console.log(`User disconnected: `, socket.id);
        });

    })
}