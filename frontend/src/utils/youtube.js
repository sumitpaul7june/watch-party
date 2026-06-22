export const extractYouTubeVideoId = (url) => {
    if (!url) return '';

    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname.includes('youtube.com')) {
            return parsedUrl.searchParams.get('v') || '';
        }

        if (parsedUrl.hostname.includes('youtu.be')) {
            return parsedUrl.pathname.replace('/', '').split('/')[0] || '';
        }
    } catch {
        return '';
    }

    return '';
};
