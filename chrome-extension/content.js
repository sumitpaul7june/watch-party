/*
 * Content Script (The Main Controller)
 * 
 * Purpose: This is the entry point for the extension on the Netflix page.
 * Previously, this was one massive "God Object" doing everything. It has now been refactored
 * using the Single Responsibility Principle and the Facade Pattern. 
 * The architecture consists of three specialized Managers and one Controller (ContentController) to coordinate them.
 */

// ==========================================
// 1. Sidebar Manager
// Job: Strictly handles the UI iframe injection and toggling.
// ==========================================
class SidebarManager {
    constructor() {
        this.iframeId = 'watch-party-sidebar';
    }

    inject() {
        // Prevent injecting twice
        if (document.getElementById(this.iframeId)) return;
        
        console.log("WatchParty SidebarManager: Injecting Sidebar!");
        const iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL('sidebar/sidebar.html') + '?url=' + encodeURIComponent(window.location.href);
        iframe.id = this.iframeId;
        iframe.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 350px;
            height: 100vh;
            border: none;
            z-index: 999999;
            box-shadow: -5px 0 15px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(iframe);

        // Squish Netflix to the left to make room (Teleparty style)
        document.documentElement.style.setProperty('width', 'calc(100% - 350px)', 'important');
    }

    toggle() {
        const iframe = document.getElementById(this.iframeId);
        if (iframe) {
            const isHidden = iframe.style.display === 'none';
            iframe.style.display = isHidden ? 'block' : 'none';
            document.documentElement.style.setProperty(
                'width', 
                isHidden ? 'calc(100% - 350px)' : '100%', 
                'important'
            );
        }
    }

    remove() {
        const iframe = document.getElementById(this.iframeId);
        if (iframe) iframe.remove();
        document.documentElement.style.setProperty('width', '100%', 'important');
    }
}


// ==========================================
// 2. Video Manager
// Job: Strictly handles DOM mutation, hooking into the <video>, 
// and shouting over the wall to inject.js.
// ==========================================
class VideoManager {
    constructor(onLocalVideoAction) {
        this.video = null;
        this.isShieldUp = false; // Prevents echo loops
        
        // Callback function used to pass video events (play/pause) UP to the ContentController.
        this.onLocalVideoAction = onLocalVideoAction;

        // Bound event listeners so they can be cleanly removed later
        this._onPlay = () => this.handleLocalEvent('play');
        this._onPause = () => this.handleLocalEvent('pause');
        this._onSeek = () => this.handleLocalEvent('seek');
    }

    startWatchingForVideo() {
        console.log("WatchParty VideoManager: Hunting for video player...");
        
        // Check immediately in case it's already there
        const existing = document.querySelector('video');
        if (existing) this.hookVideo(existing);

        // Watch the DOM for new video elements (e.g. when clicking Next Episode)
        const observer = new MutationObserver(() => {
            if (this.video && document.contains(this.video)) return; // Already have it!

            const newVideo = document.querySelector('video');
            if (newVideo && newVideo !== this.video) {
                console.log("WatchParty VideoManager: New video element detected!");
                this.hookVideo(newVideo);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * hookVideo(videoElement)
     * 
     * PURPOSE: Attaches the event listeners (play, pause, seek) to the Netflix <video> tag.
     * FLOW: MutationObserver (finds new video) --> calls hookVideo() --> starts listening to clicks.
     */
    hookVideo(videoElement) {
        // Defensive Programming: If a different video was already being watched 
        // (like a trailer that just finished), strip the listeners off it first!
        // If this isn't done, duplicate listeners will send double events.
        if (this.video) this.cleanup(); 
        
        this.video = videoElement;
        
        // Use the bound versions of the functions (this._onPlay) instead of 
        // anonymous functions like () => {}. This is required so they can be cleanly 
        // removed later in the cleanup() function.
        this.video.addEventListener('play', this._onPlay);
        this.video.addEventListener('pause', this._onPause);
        this.video.addEventListener('seeked', this._onSeek);
    }

    /**
     * cleanup()
     * 
     * PURPOSE: Removes the event listeners from the Netflix <video> tag.
     * FLOW: User closes the sidebar/room --> ContentController receives TEARDOWN 
     *       --> calls VideoManager.cleanup() --> frees up memory and stops watching the video.
     */
    cleanup() {
        if (this.video) {
            this.video.removeEventListener('play', this._onPlay);
            this.video.removeEventListener('pause', this._onPause);
            this.video.removeEventListener('seeked', this._onSeek);
        }
    }

    /**
     * handleLocalEvent(action)
     * 
     * PURPOSE: The actual function that fires when the user clicks Play, Pause, or Seek on Netflix.
     * FLOW: User clicks Pause --> _onPause fires --> handleLocalEvent('pause') 
     *       --> Shield check (is this a remote command or local?) 
     *       --> If local: pass UP to ContentController.
     */
    handleLocalEvent(action) {
        // --- THE ECHO SHIELD ---
        // If the shield is up, it means a REMOTE USER paused the video, and the script 
        // just paused the LOCAL video automatically. This event MUST be ignored!
        // If it isn't ignored, a "pause" is sent back to the server, which sends
        // a "pause" back to the remote user, creating an infinite Echo Loop!
        if (this.isShieldUp) return; 
        
        // If the shield is down, it means a REAL LOCAL USER clicked the pause button.
        // Trigger the callback function to pass this event UP to the ContentController.
        this.onLocalVideoAction(action, this.video.currentTime);
    }

    /**
     * applyRemoteCommand(actionStr, time, forceSeek)
     * 
     * PURPOSE: Receives commands from the server (like "a remote user paused") and applies them to the local Netflix player.
     * FLOW: Background Script (MessageRouter) receives "pause" from Server 
     *       --> MessageRouter sends to ContentController via chrome.tabs.sendMessage
     *       --> ContentController calls VideoManager.applyRemoteCommand('pause', 42.5)
     *       --> VideoManager passes message to inject.js via window.postMessage
     *       --> inject.js executes the command on Netflix's internal React API.
     */
    applyRemoteCommand(actionStr, time, forceSeek = false) {
        console.log("WatchParty VideoManager: Executing remote command via inject.js bridge!", actionStr);

        // 1. THE ECHO SHIELD (CRITICAL!)
        // Raise the shield. When Netflix actually pauses a millisecond from now, 
        // the handleLocalEvent() will ignore it, preventing an infinite loop with the server.
        this.isShieldUp = true;

        // 2. THE TIME SYNC CHECK
        // If the server sends a seek command (forceSeek = true) OR if the local video is more than 1 second 
        // out of sync with the remote video, force Netflix to jump to the exact correct time.
        if (forceSeek || (this.video && Math.abs(this.video.currentTime - time) > 1)) {
            // NOTE: Netflix's internal API expects time in milliseconds, so multiply by 1000!
            window.postMessage({ type: 'WP_NETFLIX_CMD', action: 'seek', time: time * 1000 }, '*');
        }

        // 3. THE PLAY/PAUSE COMMAND
        // Use window.postMessage to communicate across the boundary into the Main World (where inject.js lives).
        // content.js is trapped in the Isolated World and cannot touch Netflix's React variables directly.
        if (actionStr === 'play' || actionStr === 'pause') {
            window.postMessage({ type: 'WP_NETFLIX_CMD', action: actionStr }, '*');
        }

        // 4. LOWERING THE SHIELD
        // It takes Netflix a split second to actually process the play/pause/seek command and fire its native events.
        // Leave the shield up for 500ms to safely absorb the shockwave of those local events, then drop it.
        setTimeout(() => {
            this.isShieldUp = false;
        }, 500);
    }
}


// ==========================================
// 3. Network Manager
// Job: Strictly handles sending/receiving messages to background.js
// ==========================================
class NetworkManager {
    constructor(onMessageReceived) {
        // Listen for messages from background.js and pass them UP to the ContentController
        chrome.runtime.onMessage.addListener((message) => {
            onMessageReceived(message);
        });
    }

    sendMessage(action, payload = null, callback = null) {
        // Start building the message object. E.g., { action: "VIDEO_COMMAND" }
        const msg = { action };
        
        // --- FLOW EXPLANATION ---
        // 1. AUTO-JOIN SPECIAL CASE
        // If the action is JOIN_ROOM, the Background Script (MessageRouter.handleJoinRoom) 
        // expects the 'roomId' to be at the root level of the message object.
        // Example: { action: "JOIN_ROOM", roomId: "x8kq2m1" }
        if (action === "JOIN_ROOM" && payload && payload.roomId) {
            msg.roomId = payload.roomId;
        } 
        // 2. STANDARD PAYLOAD CASE
        // For all other actions (like VIDEO_COMMAND), nest the data inside a 'payload' property.
        // Example: { action: "VIDEO_COMMAND", payload: { action: "pause", currentTime: 42 } }
        else if (payload) {
            msg.payload = payload;
        }
        
        // 3. SENDING WITH CALLBACK (WAITING FOR A REPLY)
        // If a callback was provided (e.g., auto-join wants to know if it succeeded),
        // pass it to chrome.runtime.sendMessage. The Background Script will reply using sendResponse().
        if (typeof callback === 'function') {
            chrome.runtime.sendMessage(msg, callback);
        } 
        // 4. "FIRE AND FORGET" CASE (NO REPLY EXPECTED)
        // If no callback is provided (e.g., RECONNECT_TAB or VIDEO_COMMAND), just send the message.
        // Use .catch(() => {}) because if the Background Script went to sleep, Chrome will throw a 
        // "Receiving end does not exist" error. This catch block silently swallows that error to keep the console clean.
        else {
            chrome.runtime.sendMessage(msg).catch(() => {
                // Defensive programming: Background script might be asleep or reloading, safe to ignore.
            });
        }
    }
}


// ==========================================
// 4. Content Controller (The Facade Pattern)
// Job: The Central Coordinator. Initializes the Managers and routes data between them.
// ==========================================
class ContentController {
    constructor() {
        console.log("WatchParty: ContentController Booting Up...");
        
        // Initialize the managers
        this.sidebar = new SidebarManager();
        this.network = new NetworkManager((msg) => this.handleNetworkMessage(msg));
        
        // Pass a callback into VideoManager. When the user clicks play/pause on Netflix,
        // VideoManager calls this function, and ContentController routes it to the NetworkManager.
        this.video = new VideoManager((action, currentTime) => {
            this.network.sendMessage("VIDEO_COMMAND", { mediaType: "netflix", action, currentTime });
        });

        // Start hunting for the video tag
        this.video.startWatchingForVideo();

        // Check if there's an auto-join link in the URL
        this.checkAutoJoin();
    }

    // This handles commands coming DOWN from the server/background script
    handleNetworkMessage(message) {
        switch (message.action) {
            case "INJECT_SIDEBAR":
                this.sidebar.inject();
                break;
            case "TOGGLE_CHAT":
                this.sidebar.toggle();
                break;
            case "TEARDOWN":
                console.log("WatchParty: Disconnecting! Cleaning up...");
                this.sidebar.remove();
                this.video.cleanup();
                break;
            case "play":
            case "pause":
                this.video.applyRemoteCommand(message.action, message.currentTime, false);
                break;
            case "seek":
                this.video.applyRemoteCommand('seek', message.currentTime, true);
                break;
        }
    }

    checkAutoJoin() {
        const wpUrl = new URL(window.location.href);
        const autoRoomId = wpUrl.searchParams.get('wpRoom');
        
        if (autoRoomId) {
            // Strip the param from the URL so Netflix doesn't get confused
            wpUrl.searchParams.delete('wpRoom');
            history.replaceState(null, '', wpUrl.toString());

            // Tell the network manager to ask the background script to join this room
            this.network.sendMessage("JOIN_ROOM", { roomId: autoRoomId }, (response) => {
                if (response && response.success) {
                    console.log("WatchParty: Auto-joined room from shared link:", autoRoomId);
                }
            });
        } else {
            // If we aren't auto-joining, check if we need to reconnect (e.g. user refreshed the page)
            this.network.sendMessage("RECONNECT_TAB");
        }
    }
}

// Start the engine!
const app = new ContentController();
