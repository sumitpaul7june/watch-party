export const extractYouTubeVideoId = (url) => {
    if (!url || !url.includes("v=")) return '';

    // Extracts the ID from standard youtube.com/watch?v=XXXXX links
    return url.split("v=")[1].split("&")[0];
}