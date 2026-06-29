import jwt from 'jsonwebtoken';

// --- SOCKET AUTHENTICATION MIDDLEWARE ---

export const socketAuthMiddleware = (socket, next) => {

    // Extract token from handshake

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
