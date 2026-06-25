import { Server } from "socket.io";
import roomHandler from "./src/handlers/roomHandler.js";
import videoHandler from "./src/handlers/videoHandler.js";
import chatHandler from "./src/handlers/chatHandler.js";
import { roomStore } from "./src/store/roomStore.js";
import { socketAuthMiddleware } from './src/middleware/socketAuth.js';


export function initSocket(server) {

    // It hooks the socketio into the server and configured to allow cors requests and it's methods.
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        }
    });

    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        console.log(`User is connected: ${socket.id}`);

        // Handle video-command from users
        videoHandler(socket);

        // Handle room management
        roomHandler(socket);

        // Handle chat messages
        chatHandler(socket);

        // When the user gets disconnected
        socket.on('disconnect', () => {
            console.log(`User disconnected: `, socket.id);
            roomStore.removeUserFromAllRooms(socket.id);
        });

    })
}