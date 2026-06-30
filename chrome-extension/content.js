/*
 * Content Script (The Main Controller)
 * 
 * Why we made this: This is the entry point for our extension on the Netflix page.
 * Previously, we had one massive "God Object" doing everything. Now, we have refactored
 * it using the Single Responsibility Principle and the Facade Pattern. 
 * We have three specialized Managers and one Controller to boss them around.
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
        
        // We use a callback so we can tell our Boss (ContentController) when the user clicks play/pause
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

    hookVideo(videoElement) {
        if (this.video) this.cleanup(); // Strip old events before hooking new ones
        
        this.video = videoElement;
        this.video.addEventListener('play', this._onPlay);
        this.video.addEventListener('pause', this._onPause);
        this.video.addEventListener('seeked', this._onSeek);
    }

    cleanup() {
        if (this.video) {
            this.video.removeEventListener('play', this._onPlay);
            this.video.removeEventListener('pause', this._onPause);
            this.video.removeEventListener('seeked', this._onSeek);
        }
    }

    handleLocalEvent(action) {
        // If the shield is up, it means the server caused this event. We ignore it to prevent an echo loop!
        if (this.isShieldUp) return; 
        
        // Otherwise, it was a real user click. Tell the Boss!
        this.onLocalVideoAction(action, this.video.currentTime);
    }

    applyRemoteCommand(actionStr, time, forceSeek = false) {
        console.log("WatchParty VideoManager: Executing remote command via inject.js bridge!", actionStr);

        // 1. Raise the shield so our local event listeners don't echo this back
        this.isShieldUp = true;

        // 2. Tell inject.js to execute the action via Netflix's internal API
        if (forceSeek || (this.video && Math.abs(this.video.currentTime - time) > 1)) {
            window.postMessage({ type: 'WP_NETFLIX_CMD', action: 'seek', time: time * 1000 }, '*');
        }

        if (actionStr === 'play' || actionStr === 'pause') {
            window.postMessage({ type: 'WP_NETFLIX_CMD', action: actionStr }, '*');
        }

        // 3. Lower the shield after 500ms (gives Netflix time to buffer without echoing)
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
        // Listen for messages from background.js and pass them to the Boss
        chrome.runtime.onMessage.addListener((message) => {
            onMessageReceived(message);
        });
    }

    sendMessage(action, payload = null, callback = null) {
        // If the background script expects a payload OR just a room id like auto-join did:
        // Wait, auto-join expects roomId at the root level, so let's allow spreading if payload is object
        const msg = { action };
        
        // If it's the auto-join JOIN_ROOM action, it expects roomId at root level
        if (action === "JOIN_ROOM" && payload && payload.roomId) {
            msg.roomId = payload.roomId;
        } else if (payload) {
            msg.payload = payload;
        }
        
        if (typeof callback === 'function') {
            chrome.runtime.sendMessage(msg, callback);
        } else {
            chrome.runtime.sendMessage(msg).catch(() => {
                // Background script might be asleep or reloading, safe to ignore
            });
        }
    }
}


// ==========================================
// 4. Content Controller (The Facade)
// Job: The Boss. Coordinates the Sidebar, Video, and Network Managers.
// ==========================================
class ContentController {
    constructor() {
        console.log("WatchParty: ContentController Booting Up...");
        
        // Initialize our managers
        this.sidebar = new SidebarManager();
        this.network = new NetworkManager((msg) => this.handleNetworkMessage(msg));
        
        // When we create the VideoManager, we tell it what to do when a local user clicks play
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
