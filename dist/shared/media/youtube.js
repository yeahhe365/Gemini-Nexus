import './youtube_global.js';

const youtube = globalThis.GeminiNexusYouTube;

export function getYouTubeVideoId(urlLike) {
    return youtube.getYouTubeVideoId(urlLike);
}

export function getYouTubeVideoUrl(urlLike) {
    return youtube.getYouTubeVideoUrl(urlLike);
}

export function isYouTubeVideoUrl(urlLike) {
    return youtube.isYouTubeVideoUrl(urlLike);
}
