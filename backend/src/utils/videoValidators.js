const mediaCommandValidators = {
    youtube: ({ stateCode }) => {
        stateCode === 1 || stateCode === 2 || stateCode === 3;
    },

    direct: ({ action }) => {
        action === "play" || action === "pause" || action === "seek";
    }
};

// Stateless bouncer function to catch bad payloads before they reach a room.
const isValidVideoCommand = (data) => {
    if (!data || typeof data !== 'object') return false;

    const { mediaType, currentTime } = data;

    if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) return false;
    if (currentTime < 0 || currentTime > 86400) return false;

    const validateMediaCommand = mediaCommandValidators[mediaType];
    if (!validateMediaCommand) return false;

    return validateMediaCommand(data);
};

export default isValidVideoCommand;
