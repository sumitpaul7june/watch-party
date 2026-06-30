/*
 * 1. Sidebar UI (The Face)
 * Job: Strictly handles rendering chat bubbles, auto-scrolling, and reading the input box.
 */

// Prevent Netflix from intercepting typing in the chat!
document.addEventListener('keydown', (e) => e.stopPropagation(), true);
document.addEventListener('keyup', (e) => e.stopPropagation(), true);
document.addEventListener('keypress', (e) => e.stopPropagation(), true);

class SidebarUI {
    constructor() {
        this.messagesList = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.roomBadge = document.getElementById('room-badge');
        this.myId = null;
    }

    setMyId(id) {
        this.myId = id;
    }

    setRoomId(roomId) {
        this.roomBadge.innerText = `Copy Code: ${roomId}`;
        this.roomBadge.onclick = () => {
            // Get the Netflix URL passed from content.js
            const urlParams = new URLSearchParams(window.location.search);
            const netflixUrlStr = urlParams.get('url');
            
            let textToCopy = roomId; // Fallback
            if (netflixUrlStr) {
                try {
                    const url = new URL(netflixUrlStr);
                    url.searchParams.set('wpRoom', roomId);
                    textToCopy = url.toString();
                } catch(e) {}
            }
            
            navigator.clipboard.writeText(textToCopy);
            this.roomBadge.innerText = 'Copied!';
            setTimeout(() => { this.roomBadge.innerText = `Copy Code: ${roomId}`; }, 2000);
        };
    }

    getInputValue() {
        return this.chatInput.value.trim();
    }

    clearInput() {
        this.chatInput.value = '';
    }

    setParticipantCount(count) {
        document.getElementById('participant-count').innerHTML = `${count} <span class="participant-icon">👤</span>`;
    }

    appendMessage(messageObj) {
        const { text, senderId, senderName, type } = messageObj;
        
        const li = document.createElement('li');
        let rowClass = 'chat-row';
        if (senderId === this.myId) {
            rowClass += ' mine';
        }
        if (type === 'system') {
            rowClass += ' system-row';
        }
        li.className = rowClass;

        // Generate the identical robot avatar using the backend senderId
        const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${senderId}`;
        const displayName = senderName || 'Anonymous';

        const style = type === 'system' ? 'font-style: italic; opacity: 0.8;' : '';

        li.innerHTML = `
            <img class="avatar" src="${avatarUrl}" alt="avatar" />
            <div class="message-bubble">
                <span class="sender-name">${displayName}</span>
                <span class="text-message" style="${style}">${text}</span>
            </div>
        `;

        this.messagesList.appendChild(li);

        // Auto-scroll to the bottom so you can see the newest message
        this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }

    onSendClick(callback) {
        this.sendBtn.addEventListener('click', callback);
        // Also send when they press the Enter key!
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') callback();
        });
    }
}

/*
 * 2. Sidebar Communicator (The Walkie Talkie)
 * Job: Talks to the Background Script to send/receive chat history and live messages.
 */
class SidebarCommunicator {
    static getChatHistory(onResponse) {
        chrome.runtime.sendMessage({ action: "GET_CHAT_HISTORY" }, onResponse);
    }

    static sendMessage(text) {
        chrome.runtime.sendMessage({ action: "SEND_CHAT_MESSAGE", text: text });
    }
}

/*
 * 3. The Orchestrator
 * Job: Boot up the UI, grab the history, and listen for live incoming messages.
 */
function init() {
    const ui = new SidebarUI();

    // 1. Fetch initial state and chat history from Background Script
    SidebarCommunicator.getChatHistory((response) => {
        if (response && response.history) {
            ui.setRoomId(response.roomId);
            if (response.myId) ui.setMyId(response.myId);
            
            // Set the participant count right away!
            if (response.participantCount) {
                ui.setParticipantCount(response.participantCount);
            }

            response.history.forEach(msg => ui.appendMessage(msg));
        }
    });

    // 2. Handle sending new messages
    ui.onSendClick(() => {
        const text = ui.getInputValue();
        if (!text) return;
        
        console.log("Sidebar: 1. User clicked send! Sending to background script:", text);
        SidebarCommunicator.sendMessage(text);
        ui.clearInput();
    });

    // 3. Listen for live messages coming from the Background Script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "NEW_CHAT_MESSAGE") {
            console.log("Sidebar: 6. SUCCESS! Received chat message from background script:", message.payload);
            if (message.myId) ui.setMyId(message.myId);
            ui.appendMessage(message.payload);
        }
        if (message.action === "ROOM_UPDATE") {
            ui.setParticipantCount(message.count);
        }
    });
}

// Start the engine
init();
