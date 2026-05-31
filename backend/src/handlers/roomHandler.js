
const roomHandler = (socket) => {

    // Join the socket into a specific room
    socket.on('join-room', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`)
    })
}

export default roomHandler;