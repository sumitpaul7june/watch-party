/*
 * Netflix API Bridge (Main World Script)
 * 
 * Why we made this: If we try to play/pause the <video> element directly from content.js, 
 * Netflix's DRM throws an M7375 error and crashes the player. Also, Netflix's CSP 
 * (Content Security Policy) blocks normal script injections. 
 * 
 * To fix this, we set "world": "MAIN" in manifest.json. This forces Chrome to inject 
 * this script directly into Netflix's own JavaScript environment. Now we are "undercover" 
 * and have full access to Netflix's secret internal variables (like window.netflix).
 */


// We are listening for messages sent from our own content.js script (the Isolated World)
window.addEventListener('message', (event) => {
    // Security check: Ignore any messages that aren't specifically tagged as 'WP_NETFLIX_CMD'
    if (event.source !== window || !event.data || event.data.type !== 'WP_NETFLIX_CMD') return;

    try {
        // 1. Dig deep into Netflix's internal React app to find the Video Player API
        const videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;

        // 2. Netflix can have multiple video players in memory (like background trailers).
        // We grab the ID of the very first session, which is always the main movie playing.
        const sessionId = videoPlayer.getAllPlayerSessionIds()[0];
        if (!sessionId) return; // If no movie is playing, do nothing.

        // 3. We ask Netflix to hand us the exact player object for this specific movie session
        const player = videoPlayer.getVideoPlayerBySessionId(sessionId);

        // 4. Now that we have the official Netflix player object, we can politely ask it 
        // to play, pause, or seek. Because we use their official API, the DRM doesn't crash!
        const { action, time } = event.data;
        if (action === 'play') player.play();
        if (action === 'pause') player.pause();
        if (action === 'seek') player.seek(time);

    } catch (e) {
        // Netflix API might not be fully loaded yet when the page first opens.
        // We will log a warning just in case it's a real error we need to debug!
        console.warn("WatchParty: Failed to execute Netflix command.", e);
    }
});
