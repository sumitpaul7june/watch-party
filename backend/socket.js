import { Server } from "socket.io";
import roomHandler from "./src/handlers/roomHandler.js";
import videoHandler from "./src/handlers/videoHandler.js";
import chatHandler from "./src/handlers/chatHandler.js";
import { roomStore } from "./src/store/roomStore.js";
import { socketAuthMiddleware } from './src/middleware/socketAuth.js';


export function initSocket(server) {
    // Attach Socket.IO to the HTTP server and configure CORS
    const io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"],
        }
    });

    // Enforce authentication on all incoming WebSocket connections
    io.use(socketAuthMiddleware);

    // Handle new client connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Register event handlers
        videoHandler(socket);
        roomHandler(socket);
        chatHandler(socket);

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            
            // Remove user from their active rooms
            const roomsRemovedFrom = roomStore.removeUserFromAllRooms(socket.id);
            
            // Notify remaining users in those rooms
            roomsRemovedFrom.forEach(roomId => {
                const room = roomStore.getRoom(roomId);
                const newCount = room ? room.users.size : 0;
                
                socket.to(roomId).emit('room-update', { count: newCount });

                // Broadcast a system message indicating the user left
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
    });
}