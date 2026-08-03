// --- VIDEO COMMAND VALIDATORS ---
// A dictionary of platform-specific validation rules.
// Each platform has different ways of representing play/pause/seek states.
const mediaCommandValidators = {
    youtube: ({ stateCode }) => {
        // YouTube Player API states: 1 (Playing), 2 (Paused), 3 (Buffering)
        return stateCode === 1 || stateCode === 2 || stateCode === 3;
    },

    direct: ({ action }) => {
        // Standard HTML5 video element actions
        return action === "play" || action === "pause" || action === "seek";
    },

    netflix: ({ action }) => {
        // Netflix specific actions (currently mirrors HTML5 standard)
        return action === "play" || action === "pause" || action === "seek";
    }
};

/**
 * Stateless bouncer function to catch bad or malicious payloads before they are broadcasted to a room.
 * Ensures the data structure is safe and the video timestamps are within physical reality.
 */
const isValidVideoCommand = (data) => {
    // 1. Structural Check
    // Reject completely empty payloads or raw strings/numbers instead of objects
    if (!data || typeof data !== 'object') return false;

    const { mediaType, currentTime } = data;

    // 2. Timestamp Sanity Check
    // Ensure currentTime is an actual number (not undefined, null, or a string like "10s")
    if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) return false;
    
    // Ensure the timestamp isn't negative or impossibly long (86,400 seconds = 24 hours)
    if (currentTime < 0 || currentTime > 86400) return false;

    // 3. Platform Verification
    // Check if we support this specific mediaType (e.g., 'youtube', 'direct')
    const validateMediaCommand = mediaCommandValidators[mediaType];
    
    // If a hacker sends { mediaType: 'hulu' }, this will be undefined and return false
    if (!validateMediaCommand) return false;

    // 4. State Verification
    // Pass the payload to the specific platform validator to ensure the action/stateCode is valid
    return validateMediaCommand(data);
};

export default isValidVideoCommand;
