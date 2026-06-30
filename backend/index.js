import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import { initSocket } from './socket.js';
import { pool } from './src/config/db.js';
import { initDB } from './src/config/init.js';
import authRoutes from './src/routes/authRoutes.js';


const app = express();
initDB();

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];

// React app and Chrome Extension connect to backend.
app.use(cors({
    origin: allowedOrigins // Use origins from environment variables for scalability
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

