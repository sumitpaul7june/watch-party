import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { initSocket } from './socket.js';

const app = express();

// Let react app on port 5173 connect to backend.
app.use(cors());

const PORT = 8080;

// Express only handles request-response connection unlike birdirectional peristent communication so we took the help of raw Node js server.
const server = http.createServer(app);


// Initialize the socket
initSocket(server)


// Listen to all requests
server.listen(PORT, (req, res) => {
    console.log('Port is running');

})

