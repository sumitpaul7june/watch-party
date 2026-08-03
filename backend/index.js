import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import { initSocket } from './socket.js';
import { initDB } from './src/config/init.js';
import authRoutes from './src/routes/authRoutes.js';


// Initialize the Express application
const app = express();

// Ensure the database schema is correctly set up before accepting requests
initDB();

// Determine allowed origins from environment variables, defaulting to allow all ('*')
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];

// --- MIDDLEWARE CONFIGURATION ---

// Configure Cross-Origin Resource Sharing (CORS) to control which clients can access the API
app.use(cors({
    origin: function (origin, callback) {
        // Allow non-browser requests (like mobile apps, Postman, or curl) which do not send an origin header
        if (!origin) return callback(null, true);

        // Allow any Chrome Extension to connect, regardless of its dynamically generated ID
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }

        // Allow requests if the origin is explicitly listed in the environment variables, or if all are allowed
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }

        // Reject any other origin that does not meet the security criteria
        return callback(new Error('Not allowed by CORS'), false);
    }
}));

// Automatically parse incoming raw request bodies into usable JSON objects (populates req.body)
app.use(express.json());


// --- ROUTE MOUNTING ---
// Delegate all requests starting with '/api/auth' to the dedicated authentication router
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 8080;

// --- SERVER INITIALIZATION ---

// Express inherently only handles standard HTTP request-response cycles. 
// A raw Node.js HTTP server is created here and wraps the Express app. 
// This is required to support the bidirectional, persistent connections needed by WebSockets.
const server = http.createServer(app);

// Attach the Socket.IO server to the raw HTTP server
initSocket(server);

// Start the server and listen for incoming connections on the specified port
server.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
});

