import { getGuestToken } from '../services/AuthServices.js';

/*
 * ==========================================
 * MESSAGE ROUTER (The "Switchboard" Pattern)
 * ==========================================
 * 
 * DESIGN PATTERN: Router / Switchboard Pattern
 * Purpose: Chrome extensions have many moving parts (Popup, Sidebar, Background, Content Scripts).
 * If all the logic was stuffed into one massive `chrome.runtime.onMessage` listener, the file would be 
 * 1,000 lines long and impossible to read (often called "Spaghetti Code").
 * 
 * Instead, this class acts as a Traffic Cop. It has ONE job:
 * 1. Catch every incoming message.
 * 2. Look at the `action` string (e.g., "CREATE_ROOM").
 * 3. Route the data to a tiny, specific helper function to do the actual work.
 */
export class MessageRouter {
    constructor(socketManager) {
        // DEPENDENCY INJECTION: The SocketManager is passed in so the Router can use it!
        this.socketManager = socketManager;
        this.setupListeners();
    }

    /**
     * Registers the global listeners that wait for Chrome events.
     */
    setupListeners() {
        // 1. TAB CLOSING LISTENER (Cleanup Crew)
        // Detect if the user simply closed their Netflix tab, and auto-disconnect the socket
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (this.socketManager.tabId === tabId) {
                console.log("MessageRouter: Netflix tab was closed! Auto-disconnecting socket.");
                // An empty callback () => {} is passed because there is no Popup waiting for a response!
                this.handleDisconnect(tabId, () => { });
            }
        });

        // 2. THE GLOBAL MESSAGE LISTENER (The Switchboard)
        // It catches every message sent by chrome.runtime.sendMessage and decides where it goes.
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

            switch (message.action) {
                case "CREATE_ROOM":
                    // Popup asked to create a room.
                    this.handleCreateRoom(message.tabId, sendResponse);
                    return true; // Returns true to tell Chrome: "Keep the sendResponse connection open for async work!"

                case "JOIN_ROOM":
                    // Popup asked to join a room.
                    const joinTabId = message.tabId || (sender.tab ? sender.tab.id : null);
                    this.handleJoinRoom(message.roomId, joinTabId, sendResponse);
                    return true;

                case "VIDEO_COMMAND":
                    // Content script sent a video play/pause event.
                    this.handleVideoCommand(message.payload);
                    break; // No sendResponse needed here, so it just breaks.

                case "GET_STATE":
                    // Popup opened and wants to know if the user is already in a room.
                    this.handleGetState(sendResponse);
                    return true;

                case "DISCONNECT":
                    // User clicked "Leave Room" in the Popup.
                    this.handleDisconnect(message.tabId, sendResponse);
                    return true;

                case "TOGGLE_CHAT":
                    // User clicked the eye icon to hide/show the chat sidebar.
                    this.handleToggleChat(message.tabId, sendResponse);
                    return true;

                case "RECONNECT_TAB":
                    // User refreshed the Netflix page, the sidebar needs to be re-injected!
                    const reconnectTabId = sender.tab ? sender.tab.id : null;
                    this.handleReconnectTab(reconnectTabId, sendResponse);
                    return true;

                case "GET_CHAT_HISTORY":
                    // Sidebar UI just loaded and needs all the old chat messages.
                    this.handleGetChatHistory(sendResponse);
                    return true;

                case "SEND_CHAT_MESSAGE":
                    // Sidebar UI sent a new chat message to broadcast.
                    console.log("MessageRouter: Received message from Sidebar. Passing to SocketManager.");
                    this.socketManager.sendChatMessage(message.text);
                    break;
            }
        });
    }

    // ==========================================
    // HANDLER FUNCTIONS
    // ==========================================
    // By breaking these out into small functions, the main listener is kept clean and modular.

    /**
     * Handles creating a new room. 
     * Talks to SocketManager, then dynamically injects the Sidebar into Netflix!
     */
    async handleCreateRoom(tabId, sendResponse) {
        console.log("MessageRouter: Routing CREATE_ROOM request");

        const token = await getGuestToken();
        if (!token) {
            sendResponse({ success: false, error: "Failed to get auth token." });
            return;
        }

        try {
            // Wait for SocketManager to create the room...
            const result = await this.socketManager.createRoom(token, tabId);

            // Room created successfully! Now, inject the Sidebar HTML/JS into the Netflix Tab.
            if (tabId) {
                // Try sending a message to see if the script is already there
                chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" })
                    .catch(err => {
                        // If it fails, the script isn't there! Dynamically inject it using Chrome Scripting API.
                        console.log("MessageRouter: Content script not found, injecting dynamically...");
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        }).then(() => {
                            // After injection, tell it to open the sidebar.
                            chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" }).catch(() => { });
                        });
                    });
            }

            // Replies to the Popup indicating success!
            sendResponse({ success: true, roomId: result.roomId });
        } catch (err) {
            // Replies to the Popup indicating failure.
            sendResponse({ success: false, error: err.error || "Failed to create room." });
        }
    }

    /**
     * Handles joining an existing room.
     */
    async handleJoinRoom(roomId, tabId, sendResponse) {
        console.log(`MessageRouter: Routing JOIN_ROOM request for room ${roomId}`);

        const token = await getGuestToken();
        if (!token) {
            sendResponse({ success: false, error: "Failed to get auth token." });
            return;
        }

        try {
            // Ask SocketManager to join the room...
            await this.socketManager.joinRoom(roomId, token, tabId);

            // Successfully joined! Inject the sidebar.
            if (tabId) {
                chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" })
                    .catch(err => {
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        }).then(() => {
                            chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" }).catch(() => { });
                        });
                    });
            }

            sendResponse({ success: true });
        } catch (err) {
            sendResponse({ success: false, error: err.error || "Failed to join room." });
        }
    }

    /**
     * Forwards a video play/pause command directly to the SocketManager.
     */
    handleVideoCommand(payload) {
        console.log("MessageRouter: Routing VIDEO_COMMAND to backend:", payload);
        this.socketManager.sendVideoCommand(payload);
    }

    /**
     * When the Popup opens, it calls this to check if the user is already in a room.
     */
    handleGetState(sendResponse) {
        console.log("MessageRouter: Routing GET_STATE request");
        sendResponse({ roomId: this.socketManager.getRoomId() });
    }

    /**
     * Sends the entire chat history array to the Sidebar so it can render old messages.
     */
    handleGetChatHistory(sendResponse) {
        console.log("MessageRouter: Sending chat history to sidebar");
        sendResponse({
            roomId: this.socketManager.getRoomId(),
            history: this.socketManager.chatHistory,
            myId: this.socketManager.socket ? this.socketManager.socket.id : null,
            participantCount: this.socketManager.participantCount
        });
    }

    /**
     * Handles leaving a room. Kills the socket and tells Netflix to delete the Sidebar.
     */
    handleDisconnect(tabId, sendResponse) {
        console.log("MessageRouter: Routing DISCONNECT request");

        // Use the provided tabId, or fallback to the one saved in SocketManager.
        const targetTabId = tabId || this.socketManager.tabId;

        // 1. Kill the WebSocket connection
        this.socketManager.disconnect();

        // 2. Tell the specific Netflix tab to destroy the sidebar UI
        if (targetTabId) {
            chrome.tabs.sendMessage(targetTabId, { action: "TEARDOWN" }).catch(() => { });
        }

        // 3. Reply to the caller (if a callback was provided)
        if (sendResponse) sendResponse({ success: true });
    }

    /**
     * Tells the Netflix tab to temporarily hide/show the Sidebar without disconnecting.
     */
    handleToggleChat(tabId, sendResponse) {
        const targetTabId = tabId || this.socketManager.tabId;
        if (targetTabId) {
            chrome.tabs.sendMessage(targetTabId, { action: "TOGGLE_CHAT" }).catch(() => { });
        }
        sendResponse({ success: true });
    }

    /**
     * If the user presses F5 to refresh Netflix, Chrome deletes the Sidebar.
     * This function catches the page reload and instantly re-injects the Sidebar!
     */
    handleReconnectTab(tabId, sendResponse) {
        if (tabId && this.socketManager.roomId) {
            this.socketManager.tabId = tabId;
            chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" }).catch(() => { });
        }
        if (sendResponse) sendResponse({ success: true });
    }
}
