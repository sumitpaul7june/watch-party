import { io } from '../lib/socket.io.esm.min.js';
import { CONFIG } from '../config.js';

/**
 * SocketManager
 * 
 * Job: Holds the WebSocket connection alive so it survives page refreshes and Netflix episode changes.
 * Flow: Connects to the Node.js backend, joins the Watch Party room, and handles real-time bidirectional communication.
 */
export class SocketManager {
    constructor() {
        this.roomId = null;
        this.socket = null;
        this.tabId = null; // Keeps track of which Chrome Tab (Netflix) is currently active
        this.chatHistory = [];
        this.participantCount = 1;
    }

    getRoomId() {
        return this.roomId;
    }

    // --- INTERNAL CONNECTION LOGIC ---
    
    /**
     * Establishes the raw Socket.IO connection to the backend.
     * This is an internal helper method used by both createRoom() and connect() (join room).
     */
    _connectSocket(token) {
        // Clean up any old connections to prevent memory leaks and duplicate events
        this.disconnect();

        // Connect to backend using the JWT token for authentication.
        // CRITICAL FOR MV3: transports are forced to ['websocket']. Service Workers hate HTTP Long-Polling.
        // Forcing WebSockets bypasses the Chrome 30-second Service Worker death timer!
        this.socket = io(CONFIG.BACKEND_URL, {
            auth: { token: token },
            transports: ['websocket']
        });

        this.socket.on('connect_error', (err) => {
            console.error("SocketManager: FATAL CONNECTION ERROR!", err.message);
        });

        // 1. Listen for Video Commands from Backend
        // The backend broadcasts a video sync command (e.g., someone paused the video).
        // It is caught here, and forwarded down to the active Netflix tab via Chrome Messages.
        this.socket.on('video-command', (data) => {
            console.log("SocketManager: Received video-command from backend:", data);
            if (this.tabId) {
                chrome.tabs.sendMessage(this.tabId, data).catch(() => {});
            }
        });

        // 2. Listen for Chat Messages
        // The backend broadcasted a new chat message. 
        // It is saved to the local history array and the Chrome UI (Sidebar/Popup) is notified to render it.
        this.socket.on('new-messages', (message) => {
            this.chatHistory.push(message);
            
            // Prevent memory leaks by capping the history array
            if (this.chatHistory.length > 100) this.chatHistory.shift();

            chrome.runtime.sendMessage({
                action: "NEW_CHAT_MESSAGE",
                payload: message,
                myId: this.socket.id // Helps the UI differentiate between "My Messages" and "Other Messages"
            }).catch(() => {});
        });

        // 3. Listen for Room Updates (User Count)
        this.socket.on('room-update', (data) => {
            this.participantCount = data.count;
            chrome.runtime.sendMessage({
                action: "ROOM_UPDATE",
                count: data.count
            }).catch(() => {});
        });

        // 4. Listen for Initial Chat History (On join)
        this.socket.on('chat-history', (historyArray) => {
            console.log("SocketManager: Received chat history: ", historyArray);
            this.chatHistory = historyArray;
        });
    }

    // --- PUBLIC METHODS ---

    /**
     * Creates a brand new Watch Party room.
     * Connects to the socket, emits 'create-room', and auto-joins upon success.
     */
    /**
     * Creates a brand new Watch Party room.
     */
    createRoom(token, tabId) {
        // Everything is wrapped in a 'new Promise' so that other files (like popup.js) 
        // can use 'async/await' when calling this function, even though Socket.IO uses callbacks.
        return new Promise((resolve, reject) => {
            
            // 1. Save the Netflix Tab ID to know where to send video commands later
            this.tabId = tabId;
            
            // 2. Start the connection to the Node.js backend
            this._connectSocket(token);

            // 3. Wait for the socket to successfully connect...
            this.socket.on('connect', () => {
                console.log("SocketManager: Connected. Creating room...");

                // 4. Ask the backend to generate a unique room code
                // The (response) callback is how Socket.IO sends data directly back!
                this.socket.emit('create-room', (response) => {
                    if (response && response.roomId) {
                        // 5. Success! Save the new Room ID to the local state
                        this.roomId = response.roomId;
                        
                        // 6. Now that the room exists, officially tell the backend to join it
                        this.socket.emit('join-room', response.roomId);
                        console.log(`SocketManager: Room created and joined: ${response.roomId}`);
                        
                        // 7. Resolve the Promise. This tells popup.js the operation is complete.
                        resolve({ success: true, roomId: response.roomId });
                    } else {
                        // If the backend fails to make a room, the Promise is rejected
                        reject({ success: false, error: "Failed to create room." });
                    }
                });
            });
        });
    }

    /**
     * Joins an existing Watch Party room.
     */
    joinRoom(roomId, token, tabId) {
        return new Promise((resolve, reject) => {
            this.tabId = tabId;
            this._connectSocket(token);

            this.socket.on('connect', () => {
                console.log(`SocketManager: Connected. Joining room: ${roomId}`);
                this.socket.emit('join-room', roomId);
            });

            // SUCCESS: Backend confirms the room exists and join is successful
            this.socket.once('room-update', () => {
                this.roomId = roomId;
                resolve({ success: true });
            });

            // ERROR: Backend says the room code doesn't exist
            this.socket.once('invalid-room-error', () => {
                console.warn("SocketManager: Room does not exist!");
                this.disconnect();
                reject({ success: false, error: "Room does not exist!" });
            });

            // ERROR: Backend says the room is full
            this.socket.once('full-room-error', () => {
                console.warn("SocketManager: Room is full!");
                this.disconnect();
                reject({ success: false, error: "Room is full!" });
            });
        });
    }

    /**
     * Forward a video command from the Netflix content script to the Node.js backend.
     */
    sendVideoCommand(payload) {
        if (this.socket && this.roomId) {
            // Tags the payload with the current roomId so the backend knows where to broadcast it
            payload.roomId = this.roomId;
            this.socket.emit('video-command', payload);
        }
        else {
            console.warn("SocketManager: Tried to send a video command, but not connected");
        }
    }

    /**
     * Forward a user chat message from the UI to the Node.js backend.
     */
    sendChatMessage(text) {
        if (this.socket && this.roomId) {
            this.socket.emit('chat-message', { roomId: this.roomId, currentText: text });
        } else {
            console.error("SocketManager: Failed to send! Socket or roomId is missing.");
        }
    }

    /**
     * Completely tear down the socket connection and reset the state.
     * Called when the user leaves a room or encounters an error.
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.roomId = null;
            this.tabId = null;
            this.chatHistory = [];
            this.participantCount = 1;
        }
    }
}

