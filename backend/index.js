import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import { initSocket } from './socket.js';
import { initDB } from './src/config/init.js';
import authRoutes from './src/routes/authRoutes.js';


const app = express();
initDB();

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];

// React app and Chrome Extension connect to backend.
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow ANY chrome extension to connect regardless of its generated ID
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }

        // Check if origin is in the allowed list, or if the list contains '*'
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'), false);
    }
}));

// Tells Express to convert incoming data into JSON to allow reading req.body
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);



const PORT = process.env.PORT || 8080;

// Express only handles request-response connections. A raw Node.js HTTP server is used here to support bidirectional persistent WebSockets.
const server = http.createServer(app);


// Initialize the socket
initSocket(server)


// Listen to all requests
server.listen(PORT, (req, res) => {
    console.log('Port is running');

})

