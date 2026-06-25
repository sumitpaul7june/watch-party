import express from 'express';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket.js';
import { pool } from './src/config/db.js';
import { initDB } from './src/config/init.js';
import authRoutes from './src/routes/authRoutes.js';


const app = express();
initDB();


// Let react app connect to backend. This MUST be before routes!
app.use(cors());

// This tells Express to convert incoming data into JSON so we can read req.body
app.use(express.json());

// Mount our new routes
app.use('/api/auth', authRoutes);




// (CORS moved to the top)

const PORT = 8080;

// Express only handles request-response connection unlike birdirectional peristent communication so we took the help of raw Node js server.
const server = http.createServer(app);


// Initialize the socket
initSocket(server)


// Listen to all requests
server.listen(PORT, (req, res) => {
    console.log('Port is running');

})

