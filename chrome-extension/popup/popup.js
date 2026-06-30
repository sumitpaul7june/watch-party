class UIManager {
    constructor() {
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

    showJoinView() {
        this.managementView.style.display = 'none';
        this.joinView.style.display = 'block';
        this.statusText.innerText = "";
    }

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

// --- The Walkie Talkie ---
function createRoom(onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "CREATE_ROOM", tabId: activeTabId }, onResponse);
    });
}
function joinRoom(roomId, onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "JOIN_ROOM", roomId: roomId, tabId: activeTabId }, onResponse);
    });
}
function getState(onResponse) {
    chrome.runtime.sendMessage({ action: "GET_STATE" }, onResponse);
}
function disconnect(onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "DISCONNECT", tabId: activeTabId }, onResponse);
    });
}
function toggleChat(onResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0] ? tabs[0].id : null;
        chrome.runtime.sendMessage({ action: "TOGGLE_CHAT", tabId: activeTabId }, onResponse);
    });
}
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

// --- The Orchestrator ---
function init() {
    const ui = new UIManager();

    // 1. INSTANT STATE CHECK (The Teleparty Illusion)
    getState((state) => {
        if (state && state.roomId) {
            ui.showManagementView(state.roomId);
        } else {
            ui.showJoinView();
        }
    });

    // 2. CREATE ROOM LOGIC
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

    // 3. JOIN LOGIC
    ui.onJoinClick(() => {
        const roomId = ui.getRoomId();
        if (!roomId) return ui.setStatus("Please enter a room ID!");

        ui.setStatus("Joining...");
        joinRoom(roomId, (response) => {
            if (response && response.success) {
                ui.showManagementView(roomId);
            } else {
                // Show specific error from the backend
                ui.setStatus(response?.error || "Failed to connect.");
            }
        });
    });

    // 4. DISCONNECT LOGIC
    ui.onDisconnectClick(() => {
        disconnect(() => {
            ui.showJoinView();
        });
    });

    // 5. TOGGLE CHAT LOGIC
    ui.onToggleChatClick(() => {
        toggleChat();
    });

    // 6. COPY PARTY LINK
    ui.onCopyLinkClick(() => {
        const roomId = ui.currentRoomText.innerText;
        copyPartyLink(roomId, ui);
    });
}

init();

