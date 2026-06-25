import { io } from 'socket.io-client'

// We create the socket connection ONCE here.
// Any file that imports this will share the exact same live connection!
export const socket = io('http://localhost:8080', {
    autoConnect: false, // 🔥 Industry Standard: Do not dial until AuthContext says so!
    auth: (cb) => {
        cb({ token: localStorage.getItem('watchPartyToken') });
    }
})
