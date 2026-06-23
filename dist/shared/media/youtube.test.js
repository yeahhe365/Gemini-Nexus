import { describe, expect, it } from 'vitest';
import { getYouTubeVideoId, getYouTubeVideoUrl, isYouTubeVideoUrl } from './youtube.js';

const VIDEO_ID = 'nU9c-PffHPg';
const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

describe('YouTube URL helpers', () => {
    it('detects supported YouTube video page URLs', () => {
        [
            WATCH_URL,
            `https://youtu.be/${VIDEO_ID}?t=12`,
            `https://m.youtube.com/shorts/${VIDEO_ID}`,
            `https://www.youtube.com/live/${VIDEO_ID}?feature=share`,
            `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
        ].forEach((url) => {
            expect(getYouTubeVideoId(url)).toBe(VIDEO_ID);
        });
    });

    it('normalizes video pages to regular watch URLs for Gemini Web', () => {
        expect(getYouTubeVideoUrl(`https://youtu.be/${VIDEO_ID}?t=12`)).toBe(WATCH_URL);
    });

    it('rejects non-video and non-YouTube URLs', () => {
        [
            'https://www.youtube.com/feed/subscriptions',
            'https://www.youtube.com/watch',
            `https://example.com/watch?v=${VIDEO_ID}`,
            'not a url',
        ].forEach((url) => {
            expect(isYouTubeVideoUrl(url)).toBe(false);
        });
    });
});
