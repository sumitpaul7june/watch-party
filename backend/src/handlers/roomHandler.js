
const roomHandler = (socket) => {
    socket.on('join-room', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`)
    })
}

export default roomHandler;