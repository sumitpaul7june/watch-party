import { Server } from "socket.io";
import roomHandler from "./src/handlers/roomHandler.js";
import videoHandler from "./src/handlers/videoHandler.js";
import chatHandler from "./src/handlers/chatHandler.js";
import { roomStore } from "./src/store/roomStore.js";
import { socketAuthMiddleware } from './src/middleware/socketAuth.js';


export function initSocket(server) {

    // It hooks the socketio into the server and configured to allow cors requests
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins including Chrome Extension
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
            const roomsRemovedFrom = roomStore.removeUserFromAllRooms(socket.id);
            
            roomsRemovedFrom.forEach(roomId => {
                const room = roomStore.getRoom(roomId);
                const newCount = room ? room.users.size : 0;
                socket.to(roomId).emit('room-update', { count: newCount });

                // Send a system message that the user left
                const leaveMessage = {
                    text: 'left the room',
                    senderId: socket.id,
                    senderName: socket.user?.username || 'Anonymous',
                    type: 'system'
                };
                roomStore.addChatMessage(roomId, leaveMessage);
                socket.to(roomId).emit('new-messages', leaveMessage);
            });
        });

    })
}