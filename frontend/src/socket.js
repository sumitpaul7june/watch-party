import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

// I create the socket connection ONCE here.
// Any file that imports this will share the exact same live connection!
export const socket = io(SOCKET_URL, {
    autoConnect: false, // 🔥 Industry Standard: Do not dial until AuthContext says so!
    auth: (cb) => {
        cb({ token: localStorage.getItem('watchPartyToken') });
    }
})
