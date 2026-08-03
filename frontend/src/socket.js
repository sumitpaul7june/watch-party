import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

// Creates a singleton socket connection instance here.
// Any file that imports this will share the exact same live connection.
export const socket = io(SOCKET_URL, {
    autoConnect: false, // Prevents automatic connection until explicitly triggered by AuthContext
    
    // Dynamically fetches the freshest JWT token from localStorage right when the socket connects
    auth: (cb) => {
        cb({ token: localStorage.getItem('watchPartyToken') });
    }
})
