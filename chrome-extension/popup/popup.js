/*
 * ==========================================
 * POPUP SCRIPT (popup.js)
 * ==========================================
 * 
 * This file runs ONLY when the user clicks the extension icon in Chrome's toolbar.
 * The popup is a tiny HTML page that drops down. It is completely destroyed
 * the moment the user clicks away from it (Chrome kills it to save memory).
 * 
 * ARCHITECTURE:
 * - UIManager class: Handles all DOM manipulation (showing/hiding views, reading inputs).
 * - Helper Functions (createRoom, joinRoom, etc.): Act as "Walkie Talkies" that send
 *   messages from this Popup to the Background Script (MessageRouter) via chrome.runtime.sendMessage.
 * - init() Orchestrator: Wires up button clicks to the correct helper functions.
 * 
 * DATA FLOW SUMMARY:
 * Popup (popup.js) ---> chrome.runtime.sendMessage ---> Background Script (MessageRouter)
 * Background Script (MessageRouter) ---> sendResponse() ---> Popup (popup.js) catches it in the callback
 */


// ==========================================
// 1. UIManager Class
// Job: Strictly handles DOM elements. It does NOT know about Chrome APIs or networking.
// It only knows how to show/hide views and read user input from the HTML.
// ==========================================
class UIManager {
    constructor() {
        // Grab references to all the HTML elements in popup.html
        this.joinView = document.getElementById('join-view');
        this.managementView = document.getElementById('management-view');
        this.roomInput = document.getElementById('room-input');
        this.joinBtn = document.getElementById('join-btn');
        this.createBtn = document.getElementById('create-btn');
        this.statusText = document.getElementById('status');
        this.disconnectBtn = document.getElementById('disconnect-btn');
        this.toggleChatBtn = document.getElementById('toggle-chat-btn');
        this.copyLinkBtn = document.getElementById('copy-link-btn');
        this.copyStatus = document.getElementById('copy-status');
        this.currentRoomText = document.getElementById('current-room-id');
    }

    /**
     * Shows the default "Create Room / Join Room" screen.
     * Called when the user is NOT currently in any room.
     */
    showJoinView() {
        this.managementView.style.display = 'none';
        this.joinView.style.display = 'block';
        this.statusText.innerText = "";
    }

    /**
     * Shows the "You are connected!" screen with Disconnect, Toggle Chat, and Copy Link buttons.
     * Called when the user IS currently in a room.
     */
    showManagementView(roomId) {
        this.joinView.style.display = 'none';
        this.managementView.style.display = 'block';
        this.currentRoomText.innerText = roomId;
    }

    getRoomId() {
        return this.roomInput.value.trim();
    }

    setStatus(message) {
        this.statusText.innerText = message;
    }

    // These methods register click event listeners using the callback pattern.
    // The init() function passes in the actual logic to run when each button is clicked.
    onCreateClick(callback) {
        this.createBtn.addEventListener('click', callback);
    }

    onJoinClick(callback) {
        this.joinBtn.addEventListener('click', callback);
    }

    onDisconnectClick(callback) {
        this.disconnectBtn.addEventListener('click', callback);
    }

    onToggleChatClick(callback) {
        this.toggleChatBtn.addEventListener('click', callback);
    }

    onCopyLinkClick(callback) {
        this.copyLinkBtn.addEventListener('click', callback);
    }

    showCopyStatus(msg) {
        this.copyStatus.innerText = msg;
        setTimeout(() => { this.copyStatus.innerText = ''; }, 2000);
    }
}


// ==========================================
// 2. Helper Functions (The "Walkie Talkies")
// ==========================================
// Each function sends a message from Popup --> Background Script (MessageRouter).
// The Background Script processes it, then replies via sendResponse().
// The reply lands in the "onResponse" callback passed as the second argument.

/**
 * FLOW: Popup --> chrome.runtime.sendMessage(CREATE_ROOM) --> Background (MessageRouter)
 *       --> MessageRouter calls handleCreateRoom() --> AuthServices fetches JWT token from Backend
 *       --> SocketManager.createRoom() --> Backend creates room via WebSocket
 *       --> MessageRouter injects sidebar into Netflix tab via chrome.tabs.sendMessage(INJECT_SIDEBAR)
 *       --> MessageRouter replies via sendResponse({ success, roomId }) --> Popup catches it in onResponse
 */
function createRoom(onResponse) {
    // First, it must be determined WHICH tab the user is looking at (the Netflix tab).
    // chrome.tabs.query finds the currently active tab and retrieves its ID.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        // Send the message to the Background Script with the tab ID attached.
        chrome.runtime.sendMessage({ action: "CREATE_ROOM", tabId: activeTabId }, onResponse);
    });
}

/**
 * FLOW: Popup --> chrome.runtime.sendMessage(JOIN_ROOM, roomId) --> Background (MessageRouter)
 *       --> MessageRouter calls handleJoinRoom() --> AuthServices fetches JWT token from Backend
 *       --> SocketManager.joinRoom() --> Backend validates room exists via WebSocket
 *       --> MessageRouter injects sidebar into Netflix tab via chrome.tabs.sendMessage(INJECT_SIDEBAR)
 *       --> MessageRouter replies via sendResponse({ success }) --> Popup catches it in onResponse
 *       --> If room doesn't exist: sendResponse({ success: false, error: "Room does not exist!" })
 */
function joinRoom(roomId, onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "JOIN_ROOM", roomId: roomId, tabId: activeTabId }, onResponse);
    });
}

/**
 * FLOW: Popup --> chrome.runtime.sendMessage(GET_STATE) --> Background (MessageRouter)
 *       --> MessageRouter calls handleGetState() --> SocketManager.getRoomId()
 *       --> MessageRouter replies via sendResponse({ roomId }) --> Popup catches it in onResponse
 *       --> If roomId exists: Popup shows the "Connected" screen
 *       --> If roomId is null: Popup shows the "Create/Join" screen
 */
function getState(onResponse) {
    chrome.runtime.sendMessage({ action: "GET_STATE" }, onResponse);
}

/**
 * FLOW: Popup --> chrome.runtime.sendMessage(DISCONNECT) --> Background (MessageRouter)
 *       --> MessageRouter calls handleDisconnect() --> SocketManager.disconnect() kills the WebSocket
 *       --> MessageRouter sends chrome.tabs.sendMessage(TEARDOWN) to Netflix tab
 *       --> content.js ContentController receives TEARDOWN --> SidebarManager.remove() destroys the sidebar
 *       --> MessageRouter replies via sendResponse({ success }) --> Popup catches it in onResponse
 *       --> Popup switches back to the "Create/Join" screen
 */
function disconnect(onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "DISCONNECT", tabId: activeTabId }, onResponse);
    });
}

/**
 * FLOW: Popup --> chrome.runtime.sendMessage(TOGGLE_CHAT) --> Background (MessageRouter)
 *       --> MessageRouter calls handleToggleChat() --> sends chrome.tabs.sendMessage(TOGGLE_CHAT) to Netflix tab
 *       --> content.js ContentController receives TOGGLE_CHAT --> SidebarManager.toggle() hides/shows the sidebar
 *       --> MessageRouter replies via sendResponse({ success }) --> Popup catches it in onResponse
 */
function toggleChat(onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "TOGGLE_CHAT", tabId: activeTabId }, onResponse);
    });
}

/**
 * FLOW: This function does NOT talk to the Background Script at all!
 *       It reads the current Netflix tab's URL, appends ?wpRoom=roomId to it,
 *       and copies it to the user's clipboard. When a friend opens this link,
 *       content.js will detect the ?wpRoom parameter and auto-join the room.
 */
function copyPartyLink(roomId, ui) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            const url = new URL(tabs[0].url);
            url.searchParams.set('wpRoom', roomId);
            navigator.clipboard.writeText(url.toString()).then(() => {
                ui.showCopyStatus('Link copied!');
            }).catch(() => {
                ui.showCopyStatus('Failed to copy');
            });
        }
    });
}


// ==========================================
// 3. The Orchestrator (init function)
// Job: Wires everything together. Creates the UIManager, checks the current state,
// and registers click handlers for every button.
// ==========================================
function init() {
    const ui = new UIManager();

    // 1. INSTANT STATE CHECK
    // FLOW: Popup --> sendMessage(GET_STATE) --> Background (MessageRouter)
    //       --> MessageRouter checks SocketManager.getRoomId()
    //       --> sendResponse({ roomId }) --> Popup receives it here in the callback
    //       --> If roomId exists: show "Connected" screen. If null: show "Create/Join" screen.
    // This runs IMMEDIATELY when the popup opens, so the user sees the correct screen instantly.
    getState((state) => {
        if (state && state.roomId) {
            ui.showManagementView(state.roomId);
        } else {
            ui.showJoinView();
        }
    });

    // 2. CREATE ROOM — When user clicks "Create Room" button
    // FLOW: Popup --> Background (MessageRouter) --> AuthServices --> Backend (JWT)
    //       --> SocketManager.createRoom() --> Backend (WebSocket) --> Room created
    //       --> MessageRouter injects sidebar into Netflix --> sendResponse back to Popup
    ui.onCreateClick(() => {
        ui.setStatus("Creating room...");
        createRoom((response) => {
            if (response && response.success) {
                ui.showManagementView(response.roomId);
            } else {
                ui.setStatus("Failed to create room.");
            }
        });
    });

    // 3. JOIN ROOM — When user clicks "Join" button
    // FLOW: Popup --> Background (MessageRouter) --> AuthServices --> Backend (JWT)
    //       --> SocketManager.joinRoom() --> Backend validates room (WebSocket)
    //       --> If valid: inject sidebar, sendResponse(success) --> Popup shows "Connected"
    //       --> If invalid: sendResponse(error) --> Popup shows error message
    ui.onJoinClick(() => {
        const roomId = ui.getRoomId();
        if (!roomId) return ui.setStatus("Please enter a room ID!");

        ui.setStatus("Joining...");
        joinRoom(roomId, (response) => {
            if (response && response.success) {
                ui.showManagementView(roomId);
            } else {
                // Show specific error from the backend (e.g., "Room does not exist!")
                ui.setStatus(response?.error || "Failed to connect.");
            }
        });
    });

    // 4. DISCONNECT — When user clicks "Leave Room" button
    // FLOW: Popup --> Background (MessageRouter) --> SocketManager.disconnect()
    //       --> MessageRouter sends TEARDOWN to Netflix tab --> content.js removes sidebar
    //       --> sendResponse(success) --> Popup switches to "Create/Join" screen
    ui.onDisconnectClick(() => {
        disconnect(() => {
            ui.showJoinView();
        });
    });

    // 5. TOGGLE CHAT — When user clicks the eye icon
    // FLOW: Popup --> Background (MessageRouter) --> sends TOGGLE_CHAT to Netflix tab
    //       --> content.js toggles sidebar visibility (hide/show)
    ui.onToggleChatClick(() => {
        toggleChat();
    });

    // 6. COPY PARTY LINK — When user clicks "Copy Link"
    // FLOW: No Background Script involved! Reads the Netflix URL, appends ?wpRoom=roomId,
    //       and copies it to clipboard. When a friend opens this URL, content.js auto-joins.
    ui.onCopyLinkClick(() => {
        const roomId = ui.currentRoomText.innerText;
        copyPartyLink(roomId, ui);
    });
}

// Start the popup!
init();
