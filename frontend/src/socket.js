import { io } from 'socket.io-client';

// We create the socket connection ONCE here.
// Any file that imports this will share the exact same live connection!
export const socket = io("http://localhost:8080");
