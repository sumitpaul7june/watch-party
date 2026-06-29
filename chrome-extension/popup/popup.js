// 1. UI Manager: Responsible strictly for manipulating the DOM

class UIManager {
    constructor() {
        this.roomInput = document.getElementById('room-input');
        this.joinBtn = document.getElementById('join-btn');
        this.statusText = document.getElementById('status');
    }

    getRoomId() {
        return this.roomInput.value.trim();
    }

    setStatus(message) {
        this.statusText.innerText = message;
    }

    onJoinClick(callback) {
        this.joinBtn.addEventListener('click', callback);
    }
};

// 2. Communicator: Responsible strictly for talking to the background script

class ExtensionCommunicator {
    static joinRoom(roomId, onResponse) {
        chrome.runtime.sendMessage({ action: "JOIN_ROOM", roomId: roomId }, onResponse);
    }
};

const ui = new UIManager();

ui.onJoinClick(() => {
    const roomId = ui.getRoomId();
    if (!roomId) {
        ui.setStatus("Please enter a room ID!");
        return;
    }

    ui.setStatus("Joining");

    // Send the messafe and handle the callback

    ExtensionCommunicator.joinRoom(roomId, (response) => {
        if (response && response.success) {
            ui.setStatus(`Connected to ${roomId}!`);
        } else {
            ui.setStatus("Failed to connect.");
        }
    })
})