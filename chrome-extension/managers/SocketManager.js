import { io } from '../lib/socket.io.esm.min.js';
import { CONFIG } from '../config.js';

/*
 * SocketManager
 * 
 * Job: Holds the WebSocket connection alive so it survives page refreshes.
 * Flow: Connects to our backend, joins the room, and listens for video commands.
 * When the backend yells to pause, it forwards that command down to the Netflix tab!
 */
export class SocketManager {
    constructor() {
        this.roomId = null;
        this.socket = null;
        this.tabId = null;
        this.chatHistory = [];
        this.participantCount = 1;
    }

    getRoomId() {
        return this.roomId;
    }

    // Establish a raw socket connection to the backend (shared by both create and join)
    _connectSocket(token) {
        // Clean up any old connections just in case
        this.disconnect();

        // Connect with JWT token (FORCE websocket because Service Workers don't support XHR polling!)
        this.socket = io(CONFIG.BACKEND_URL, {
            auth: { token: token },
            transports: ['websocket']
        });

        this.socket.on('connect_error', (err) => {
            console.error("SocketManager: FATAL CONNECTION ERROR!", err.message);
        });

        // When the backend broadcasts a video command (like pause/play)...
        this.socket.on('video-command', (data) => {
            console.log("SocketManager: Received video-command from backend:", data);
            if (this.tabId) {
                chrome.tabs.sendMessage(this.tabId, data).catch(() => {});
            }
        });

        this.socket.on('new-messages', (message) => {
            this.chatHistory.push(message);
            if (this.chatHistory.length > 100) this.chatHistory.shift();

            chrome.runtime.sendMessage({
                action: "NEW_CHAT_MESSAGE",
                payload: message,
                myId: this.socket.id
            }).catch(() => {});
        });

        this.socket.on('room-update', (data) => {
            this.participantCount = data.count;
            chrome.runtime.sendMessage({
                action: "ROOM_UPDATE",
                count: data.count
            }).catch(() => {});
        });

        this.socket.on('chat-history', (historyArray) => {
            console.log("SocketManager: Received chat history: ", historyArray);
            this.chatHistory = historyArray;
        });
    }

    // Create a new room: connect, then emit 'create-room', then auto-join
    createRoom(token, tabId) {
        return new Promise((resolve, reject) => {
            this.tabId = tabId;
            this._connectSocket(token);

            this.socket.on('connect', () => {
                console.log("SocketManager: Connected. Creating room...");

                // Ask the backend to generate a unique room code
                this.socket.emit('create-room', (response) => {
                    if (response && response.roomId) {
                        this.roomId = response.roomId;
                        // Now join the room we just created
                        this.socket.emit('join-room', response.roomId);
                        console.log(`SocketManager: Room created and joined: ${response.roomId}`);
                        resolve({ success: true, roomId: response.roomId });
                    } else {
                        reject({ success: false, error: "Failed to create room." });
                    }
                });
            });
        });
    }

    // Join an existing room: connect, then emit 'join-room', wait for confirmation or error
    connect(roomId, token, tabId) {
        return new Promise((resolve, reject) => {
            this.tabId = tabId;
            this._connectSocket(token);

            this.socket.on('connect', () => {
                console.log(`SocketManager: Connected. Joining room: ${roomId}`);
                this.socket.emit('join-room', roomId);
            });

            // If the backend confirms the room is valid, we get a room-update
            this.socket.once('room-update', () => {
                this.roomId = roomId;
                resolve({ success: true });
            });

            // If the room code doesn't exist
            this.socket.once('invalid-room-error', () => {
                console.warn("SocketManager: Room does not exist!");
                this.disconnect();
                reject({ success: false, error: "Room does not exist!" });
            });

            // If the room is full
            this.socket.once('full-room-error', () => {
                console.warn("SocketManager: Room is full!");
                this.disconnect();
                reject({ success: false, error: "Room is full!" });
            });
        });
    }

    sendVideoCommand(payload) {
        if (this.socket && this.roomId) {
            payload.roomId = this.roomId;
            this.socket.emit('video-command', payload);
        }
        else {
            console.warn("SocketManager: Tried to send a video command, but we aren't connected");
        }
    }

    sendChatMessage(text) {
        if (this.socket && this.roomId) {
            this.socket.emit('chat-message', { roomId: this.roomId, currentText: text });
        } else {
            console.error("SocketManager: Failed to send! Socket or roomId is missing.");
        }
    }

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

