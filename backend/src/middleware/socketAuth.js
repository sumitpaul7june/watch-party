import jwt from 'jsonwebtoken';

// --- SOCKET AUTHENTICATION MIDDLEWARE ---

export const socketAuthMiddleware = (socket, next) => {

    // 🔥 Let's rip open the engine! Check your backend terminal for this log:
    console.log("================= HANDSHAKE OBJECT =================");
    console.log(socket.handshake); // Make sure this is .handshake, not just socket!
    console.log("====================================================");

    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decodedUser;
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid or expired token"));
    }
}
