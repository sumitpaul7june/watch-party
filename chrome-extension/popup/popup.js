/* 
 * 1. UI Manager (The Face)
 * Job: Strictly handles the HTML DOM. Grabbing the input, clicking the button, changing text.
 * It knows absolutely nothing about Chrome extensions or WebSockets.
 */
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
}

/*
 * 2. Communicator (The Walkie Talkie)
 * Job: Shoots messages from our tiny popup window down to the invisible Background Script.
 */
function joinRoom(roomId, onResponse) {
    chrome.runtime.sendMessage({ action: "JOIN_ROOM", roomId: roomId }, onResponse);
}

/*
 * 3. The Orchestrator
 * Job: Wires the Face and the Walkie Talkie together when the popup opens.
 */
function init() {
    const ui = new UIManager();

    ui.onJoinClick(() => {
        const roomId = ui.getRoomId();
        
        if (!roomId) {
            ui.setStatus("Please enter a room ID!");
            return;
        }

        ui.setStatus("Joining...");

        // Fire off the walkie talkie and wait for the Background Script to reply
        joinRoom(roomId, (response) => {
            if (response && response.success) {
                ui.setStatus(`Connected to ${roomId}!`);
            } else {
                ui.setStatus("Failed to connect.");
            }
        });
    });
}

// Boot up the popup!
init();