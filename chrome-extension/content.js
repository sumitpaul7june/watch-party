/*
 * VideoSync (The Hands and Eyes)
 * 
 * Job: Physically injected into the Netflix webpage. 
 * Flow: Watches the Netflix video player (Eyes) and executes commands from the server (Hands) to keep everyone in sync.
 */
class VideoSync {
    constructor() {
        this.video = null;
        
        // The shield! This stops us from accidentally telling the server we paused 
        // when the server is the one that forced us to pause. (Prevents infinite Echo loops).
        this.isSyncing = false; 
        
        // Save the bound versions of our functions so we can cleanly remove them later
        this._onPlay = () => this.onPlay();
        this._onPause = () => this.onPause();
        this._onSeek = () => this.onSeek();
        
        // Netflix doesn't reload the page when you click "Next Episode".
        // We have to hunt for the video and constantly watch for new ones.
        this.findVideoPlayer();
        this.listenForRemoteCommands();
    }

    findVideoPlayer() {
        console.log("WatchParty: Hunting for video player...");
        
        // If the user is already watching a movie when they open the extension, grab it immediately!
        const existing = document.querySelector('video');
        if (existing) {
            console.log("WatchParty: Found existing video on load!");
            this.video = existing;
            this.bindEvents();
        }

        // Watch the whole webpage for changes
        const observer = new MutationObserver(() => {
            // Optimization: If we already have the video and it's safely on screen, do nothing. (Saves CPU!)
            if (this.video && document.contains(this.video)) return;

            const video = document.querySelector('video');
            
            // If they clicked Next Episode, the video element changes. We need to grab the new one!
            if (video && video !== this.video) {
                console.log("WatchParty: New video element detected!");
                this.video = video;
                this.bindEvents();
            }
        });

        // Tell the observer to watch the whole body for elements being added/removed
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    bindEvents() {
        // Strip off any old event listeners first so we don't accidentally double-fire events
        this.video.removeEventListener('play', this._onPlay);
        this.video.removeEventListener('pause', this._onPause);
        this.video.removeEventListener('seeked', this._onSeek);

        // The EYES: Watch what the user does and tell the server
        this.video.addEventListener('play', this._onPlay);
        this.video.addEventListener('pause', this._onPause);
        this.video.addEventListener('seeked', this._onSeek);
    }

    onPlay() {
        if (this.isSyncing) return; // Shield is up! We are being controlled by the server, do nothing!
        
        chrome.runtime.sendMessage({
            action: "VIDEO_COMMAND",
            payload: { mediaType: "netflix", action: "play", currentTime: this.video.currentTime }
        }).catch(err => console.warn("Background not ready:", err));
    }

    onPause() {
        if (this.isSyncing) return; 

        chrome.runtime.sendMessage({
            action: "VIDEO_COMMAND",
            payload: { mediaType: "netflix", action: "pause", currentTime: this.video.currentTime }
        }).catch(err => console.warn("Background not ready:", err));
    }

    onSeek() {
        if (this.isSyncing) return;

        chrome.runtime.sendMessage({
            action: "VIDEO_COMMAND",
            payload: { mediaType: "netflix", action: "seek", currentTime: this.video.currentTime }
        }).catch(err => console.warn("Background not ready:", err));
    }

    listenForRemoteCommands() {
        // The HANDS: Listen for commands coming down from the Background Script (from your friends)
        chrome.runtime.onMessage.addListener((message) => {
            if (!this.video) return;

            if (message.action === "play") {
                this.applyRemoteEvent(() => this.video.play(), message.currentTime, false);
            } else if (message.action === "pause") {
                this.applyRemoteEvent(() => this.video.pause(), message.currentTime, false);
            } else if (message.action === "seek") {
                // If it's a SEEK command, force the video to jump exactly to that timestamp
                this.applyRemoteEvent(() => Promise.resolve(), message.currentTime, true); 
            }
        });
    }

    async applyRemoteEvent(videoAction, time, forceSeek = false) {
        console.log("WatchParty: Executing remote command!");
        
        // 1. Raise the shield! Don't let our own event listeners catch what we are about to do.
        this.isSyncing = true;
        
        // 2. Sync the time perfectly. 
        // If it's a SEEK command, force it. Otherwise, only fix it if we drifted more than 1 second apart.
        if (forceSeek) {
            this.video.currentTime = time;
        } else if (Math.abs(this.video.currentTime - time) > 1) {
            this.video.currentTime = time;
        }

        // 3. Execute the play/pause action safely. 
        // We await it because browsers get angry (DOMException) if you try to play a video too fast.
        try {
            await videoAction();
        } catch (err) {
            console.warn("WatchParty: Video action failed (usually browser autoplay policy):", err);
        }

        // 4. Lower the shield after a tiny delay so our events don't fire.
        setTimeout(() => {
            this.isSyncing = false;
        }, 500);
    }
}

// Start the engine
const sync = new VideoSync();
