// Stateless bouncer function to catch bad payloads from malicious users before they hit the server
const isValidVideoCommand = (data) => {
    const { stateCode, currentTime } = data;

    // Validating the state code by checking if it's empty, it's data type and is it within the valid state code range.
    if (stateCode == null) return false;
    if (typeof (stateCode) !== 'number' || Number.isNaN(stateCode)) return false;
    if (!(stateCode === 1 || stateCode === 2 || stateCode === 3)) return false;

    // Validating the current time by checking if it's empty, it's data type and is it within the duration.
    if (currentTime == null) return false;
    if (typeof (currentTime) !== 'number' || Number.isNaN(currentTime)) return false;
    if (currentTime < 0 || currentTime > 86400) return false;

    return true;

};

export default isValidVideoCommand;