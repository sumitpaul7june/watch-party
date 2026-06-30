import express from 'express';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket.js';
import { pool } from './src/config/db.js';
import { initDB } from './src/config/init.js';
import authRoutes from './src/routes/authRoutes.js';


const app = express();
initDB();


// React app and Chrome Extension connect to backend.
app.use(cors({
    origin: '*' // Allow all origins for development (includes chrome-extension://)
}));

// Tells Express to convert incoming data into JSON to allow reading req.body
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);



const PORT = 8080;

// Express only handles request-response connections. A raw Node.js HTTP server is used here to support bidirectional persistent WebSockets.
const server = http.createServer(app);


// Initialize the socket
initSocket(server)


// Listen to all requests
server.listen(PORT, (req, res) => {
    console.log('Port is running');

})

