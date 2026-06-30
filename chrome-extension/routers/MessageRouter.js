import { getGuestToken } from '../services/AuthServices.js';

/*
 * Message Router
 * 
 * Why we made this: Chrome extensions have many moving parts (popups, sidebars, background scripts).
 * This class acts as the "Traffic Cop" or "Switchboard" for our background service worker. 
 * Instead of stuffing all our logic into one massive listener, this class listens to incoming 
 * messages and routes them to small, specific handler functions (or to the SocketManager).
 */
export class MessageRouter {
    constructor(socketManager) {
        // Pass the socket manager in to connect when asked
        this.socketManager = socketManager;
        this.setupListeners();
    }

    setupListeners() {
        // Detect if the user simply closed their Netflix tab, and auto-disconnect the socket
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (this.socketManager.tabId === tabId) {
                console.log("MessageRouter: Netflix tab was closed! Auto-disconnecting socket.");
                this.handleDisconnect(tabId, () => {});
            }
        });

        // The one global listener for the entire extension.
        // It catches every message sent by chrome.runtime.sendMessage and decides where it goes.
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

            switch (message.action) {
                // When the user clicks "Create Room" in the popup
                case "CREATE_ROOM":
                    this.handleCreateRoom(message.tabId, sendResponse);
                    return true;

                // When the user clicks "Join" in the popup or auto-joins via URL
                case "JOIN_ROOM":
                    // We use sender.tab.id as fallback — this covers auto-join from the content script
                    const joinTabId = message.tabId || (sender.tab ? sender.tab.id : null);
                    this.handleJoinRoom(message.roomId, joinTabId, sendResponse);
                    return true; // Keeps the sendResponse channel open asynchronously

                // When the user plays/pauses/seeks the video
                case "VIDEO_COMMAND":
                    this.handleVideoCommand(message.payload);
                    break;

                // When the popup asks what room we are currently in
                case "GET_STATE":
                    this.handleGetState(sendResponse);
                    return true;

                // When the user clicks the disconnect button
                case "DISCONNECT":
                    this.handleDisconnect(message.tabId, sendResponse);
                    return true;

                // When the user clicks toggle chat in the popup
                case "TOGGLE_CHAT":
                    this.handleToggleChat(message.tabId, sendResponse);
                    return true;

                // When a user refreshes the Netflix tab, it asks if it was in a room
                case "RECONNECT_TAB":
                    const reconnectTabId = sender.tab ? sender.tab.id : null;
                    this.handleReconnectTab(reconnectTabId, sendResponse);
                    return true;

                // When the Sidebar opens and asks for the chat history
                case "GET_CHAT_HISTORY":
                    this.handleGetChatHistory(sendResponse);
                    return true;

                // When the Sidebar sends a message
                case "SEND_CHAT_MESSAGE":
                    console.log("MessageRouter: Received message from Sidebar. Passing to SocketManager.");
                    this.socketManager.sendChatMessage(message.text);
                    break;
            }
        });
    }

    // --- HANDLER FUNCTIONS ---
    // By breaking these out into small functions, we keep the main listener clean and easy to read.

    async handleCreateRoom(tabId, sendResponse) {
        console.log("MessageRouter: Routing CREATE_ROOM request");

        const token = await getGuestToken();
        if (!token) {
            sendResponse({ success: false, error: "Failed to get auth token." });
            return;
        }

        try {
            const result = await this.socketManager.createRoom(token, tabId);

            // Inject the sidebar into the active tab
            if (tabId) {
                chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" })
                    .catch(err => {
                        console.log("MessageRouter: Content script not found, injecting dynamically...", err);
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        }).then(() => {
                            chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" }).catch(() => {});
                        }).catch(e => console.error("MessageRouter: Dynamic injection failed.", e));
                    });
            }

            sendResponse({ success: true, roomId: result.roomId });
        } catch (err) {
            sendResponse({ success: false, error: err.error || "Failed to create room." });
        }
    }

    async handleJoinRoom(roomId, tabId, sendResponse) {
        console.log(`MessageRouter: Routing JOIN_ROOM request for room ${roomId}`);

        // 1. Get the auth token from the backend
        const token = await getGuestToken();

        if (!token) {
            sendResponse({ success: false, error: "Failed to get auth token." });
            return;
        }

        try {
            // 2. Instruct the SocketManager to connect (pass tabId so it knows where to forward commands)
            await this.socketManager.connect(roomId, token, tabId);

            // 3. Inject the sidebar directly into the tab the user was looking at!
            if (tabId) {
                console.log(`MessageRouter: Injecting into exact tab ID: ${tabId}`);
                chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" })
                    .catch(err => {
                        console.log("MessageRouter: Content script not found, injecting dynamically...", err);
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        }).then(() => {
                            chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" }).catch(() => {});
                        }).catch(e => console.error("MessageRouter: Dynamic injection failed.", e));
                    });
            } else {
                console.warn("MessageRouter: No tabId provided to inject sidebar into!");
            }

            // 4. Tell the popup it succeeded
            sendResponse({ success: true });
        } catch (err) {
            // The Promise rejected — room doesn't exist or is full
            sendResponse({ success: false, error: err.error || "Failed to join room." });
        }
    }

    handleVideoCommand(payload) {
        console.log("MessageRouter: Routing VIDEO_COMMAND to backend:", payload);
        this.socketManager.sendVideoCommand(payload);
    }

    handleGetState(sendResponse) {
        console.log("MessageRouter: Routing GET_STATE request");
        sendResponse({ roomId: this.socketManager.getRoomId() });
    }

    handleGetChatHistory(sendResponse) {
        console.log("MessageRouter: Sending chat history to sidebar");
        sendResponse({
            roomId: this.socketManager.getRoomId(),
            history: this.socketManager.chatHistory,
            myId: this.socketManager.socket ? this.socketManager.socket.id : null,
            participantCount: this.socketManager.participantCount
        });
    }

    handleDisconnect(tabId, sendResponse) {
        console.log("MessageRouter: Routing DISCONNECT request");
        
        const targetTabId = tabId || this.socketManager.tabId;

        // 1. Kill the WebSocket connection
        this.socketManager.disconnect();
        
        // 2. Tell the specific Netflix tab to destroy the sidebar UI and stop listening
        if (targetTabId) {
            chrome.tabs.sendMessage(targetTabId, { action: "TEARDOWN" }).catch(() => {});
        }

        if (sendResponse) sendResponse({ success: true });
    }

    handleToggleChat(tabId, sendResponse) {
        const targetTabId = tabId || this.socketManager.tabId;
        if (targetTabId) {
            chrome.tabs.sendMessage(targetTabId, { action: "TOGGLE_CHAT" }).catch(() => {});
        }
        sendResponse({ success: true });
    }

    handleReconnectTab(tabId, sendResponse) {
        if (tabId && this.socketManager.roomId) {
            this.socketManager.tabId = tabId;
            chrome.tabs.sendMessage(tabId, { action: "INJECT_SIDEBAR" }).catch(() => {});
        }
        if (sendResponse) sendResponse({ success: true });
    }
}
