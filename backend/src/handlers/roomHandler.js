import { roomStore } from '../store/roomStore.js';
const roomHandler = (socket) => {

    // Join the socket into a specific room
    socket.on('join-room', (roomId) => {
        if (!roomId) return;

        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        //Register user in our store and sync video if one is already playing
        const room = roomStore.joinRoom(roomId, socket.id);
        if (room.videoId) {
            socket.emit('video-id', room.videoId);
        }
    });

    socket.on('video-id', (data) => {
        const { videoId, roomId } = data;
        if (!videoId || !roomId) return;

        // Save to our persistent in-memory state
        roomStore.setRoomVideo(roomId, videoId);

        // Broadcast to everyone else in the room
        socket.to(roomId).emit('video-id', videoId);
    })
}

export default roomHandler;