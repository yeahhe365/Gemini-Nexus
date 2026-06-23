(function () {
    const YOUTUBE_HOSTS = new Set([
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'music.youtube.com',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
    ]);

    const YOUTU_BE_HOSTS = new Set(['youtu.be', 'www.youtu.be']);
    const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

    function parseUrl(urlLike) {
        if (typeof urlLike !== 'string' || !urlLike.trim()) return null;

        try {
            return new URL(urlLike);
        } catch {
            return null;
        }
    }

    function getPathVideoId(pathname, segmentName) {
        const segments = pathname.split('/').filter(Boolean);
        const index = segments.indexOf(segmentName);
        return index >= 0 ? segments[index + 1] || null : null;
    }

    function getYouTubeVideoId(urlLike) {
        const url = parseUrl(urlLike);
        if (!url || !/^https?:$/i.test(url.protocol)) return null;

        const hostname = url.hostname.toLowerCase();
        let videoId = null;

        if (YOUTU_BE_HOSTS.has(hostname)) {
            videoId = url.pathname.split('/').filter(Boolean)[0] || null;
        } else if (YOUTUBE_HOSTS.has(hostname)) {
            if (url.pathname === '/watch') {
                videoId = url.searchParams.get('v');
            } else {
                videoId =
                    getPathVideoId(url.pathname, 'shorts') ||
                    getPathVideoId(url.pathname, 'live') ||
                    getPathVideoId(url.pathname, 'embed');
            }
        }

        return videoId && VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
    }

    function getYouTubeVideoUrl(urlLike) {
        const videoId = getYouTubeVideoId(urlLike);
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
    }

    function isYouTubeVideoUrl(urlLike) {
        return Boolean(getYouTubeVideoId(urlLike));
    }

    globalThis.GeminiNexusYouTube = Object.freeze({
        parseUrl,
        getYouTubeVideoId,
        getYouTubeVideoUrl,
        isYouTubeVideoUrl,
    });
})();
