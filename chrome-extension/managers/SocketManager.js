import { io } from '../lib/socket.io.esm.min.js';
import { forwardToActiveTab } from '../communicators/TabCommunicator.js';

/*
 * SocketManager
 * 
 * Job: Holds the WebSocket connection alive so it survives page refreshes.
 * Flow: Connects to our backend, joins the room, and listens for video commands.
 * When the backend yells to pause, it forwards that command down to the Netflix tab!
 */
export class SocketManager {
    constructor() {
        // Keep the socket alive in the background
        this.socket = null;
        this.roomId = null;
    }

    connect(roomId, token) {
        // Clean up any old connections just in case
        this.disconnect();

        this.roomId = roomId;

        // Connect with our JWT token
        this.socket = io('http://localhost:8080', {
            auth: { token: token }
        });

        this.socket.on('connect', () => {
            console.log(`SocketManager: Successfully connected to backend. Joining room: ${roomId}`);
            this.socket.emit('join-room', roomId);
        });

        // When the backend broadcasts a video command (like pause/play)...
        this.socket.on('video-command', (data) => {
            console.log("SocketManager: Received video-command from backend:", data);

            // Send it down into the Netflix tab's content script to execute it
            forwardToActiveTab(data);
        });
    }

    sendVideoCommand(payload) {
        if (this.socket && this.roomId) {
            // Inject the roomId before sending
            payload.roomId = this.roomId;
            this.socket.emit('video-command', payload);
        }
        else {
            console.warn("SocketManager: Tried to send a video command, but we aren't connected");
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
