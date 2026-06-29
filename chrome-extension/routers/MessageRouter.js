import { getGuestToken } from '../services/AuthServices.js';

/*
 * MessageRouter (The Switchboard Operator)
 * 
 * Job: Listens to all messages flying around the extension (like from the popup).
 * Flow: It catches the message, checks the 'action' tag, and hands it off to the right manager 
 * so our background script doesn't turn into a messy 500-line if/else block.
 */
export class MessageRouter {
    constructor(socketManager) {
        // Pass the socket manager in so we can connect when asked
        this.socketManager = socketManager;
        this.setupListeners();
    }

    setupListeners() {
        // The one global listener for the entire extension
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            
            // If the popup yells JOIN_ROOM, we handle it here
            if (message.action === "JOIN_ROOM") {
                this.handleJoinRoom(message.roomId, sendResponse);
                
                // Return true so Chrome knows we're gonna reply later (async)
                return true; 
            }
        });
    }

    async handleJoinRoom(roomId, sendResponse) {
        console.log(`MessageRouter: Routing JOIN_ROOM request for room ${roomId}`);
        
        // 1. Get the auth token from our backend
        const token = await getGuestToken();
        
        if (token) {
            // 2. Tell the SocketManager to connect
            this.socketManager.connect(roomId, token);
            // 3. Tell the popup we succeeded
            sendResponse({ success: true });
        } else {
            // 3. Tell the popup we failed
            sendResponse({ success: false });
        }
    }
}
