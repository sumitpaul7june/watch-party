import jwt from 'jsonwebtoken';

/**
 * Socket Authentication Middleware
 * 
 * Protects the WebSocket server from unauthorized connections. 
 * Because WebSockets do not automatically send HTTP headers (like Axios interceptors do),
 * the token must be manually extracted from the Socket.IO handshake payload.
 */
export const socketAuthMiddleware = (socket, next) => {
    // 1. Token Extraction
    // Retrieve the JWT token provided by the client during the initial WebSocket handshake
    const token = socket.handshake.auth.token;

    if (!token) {
        // If no token is provided, reject the connection immediately
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        // 2. Token Verification
        // Cryptographically verify the token against the server's private secret key.
        // If the token is valid, it decodes the payload (e.g., { id, username }).
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach User Data
        // Attach the decoded user data directly to the socket object. 
        // This ensures all subsequent handlers (chat, video) know exactly who this user is.
        socket.user = decodedUser;
        
        // 4. Allow Connection
        // Call next() to allow the connection to proceed to the 'connection' event listener.
        next();
    } catch (err) {
        // If the token is fake, expired, or tampered with, reject the connection.
        return next(new Error("Authentication error: Invalid or expired token"));
    }
}
