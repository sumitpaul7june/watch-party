/*
 * Netflix API Bridge (Main World Script)
 * 
 * Purpose: Attempting to play/pause the <video> element directly from the isolated 
 * content script causes Netflix's DRM to throw an M7375 error and crash the player. 
 * Additionally, Netflix's CSP (Content Security Policy) blocks normal script injections. 
 * 
 * Architecture: Setting "world": "MAIN" in manifest.json forces Chrome to inject 
 * this script directly into the Main World JavaScript environment. This provides 
 * direct access to Netflix's internal React variables (like window.netflix), bypassing 
 * the Isolated World restrictions.
 */

// Listens for messages sent from the content script (the Isolated World)
window.addEventListener('message', (event) => {
    // Security check: Ignore any messages that aren't specifically tagged as 'WP_NETFLIX_CMD'
    if (event.source !== window || !event.data || event.data.type !== 'WP_NETFLIX_CMD') return;

    try {
        // 1. Dig deep into Netflix's internal React app to find the Video Player API.
        const videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;

        // 2. Netflix can have multiple video players in memory (like background trailers).
        // Grab the ID of the very first session, which is always the main movie playing.
        const sessionId = videoPlayer.getAllPlayerSessionIds()[0];
        if (!sessionId) return; // If no movie is playing, do nothing.

        // 3. Ask Netflix to hand over the exact player object for this specific movie session.
        const player = videoPlayer.getVideoPlayerBySessionId(sessionId);

        // 4. Now that the official Netflix player object is acquired, it can be commanded 
        // to play, pause, or seek. Because this uses their official API, the DRM doesn't crash!
        const { action, time } = event.data;
        if (action === 'play') player.play();
        if (action === 'pause') player.pause();
        if (action === 'seek') player.seek(time);

    } catch (e) {
        // Netflix API might not be fully loaded yet when the page first opens.
        // Log a warning just in case it's a real error that needs debugging.
        console.warn("WatchParty: Failed to execute Netflix command.", e);
    }
});
