import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TtsHandler } from './tts_handler.js';
import { fetchGeminiTtsAudio } from '../../../services/providers/gemini_tts.js';

vi.mock('../../../services/providers/gemini_tts.js', () => ({
    fetchGeminiTtsAudio: vi.fn(),
}));

describe('TtsHandler', () => {
    let sessionManager;
    let handler;

    beforeEach(() => {
        vi.clearAllMocks();
        sessionManager = {
            ensureInitialized: vi.fn(async () => {}),
            auth: {
                getOrFetchContext: vi.fn(async () => ({
                    atValue: 'at',
                    blValue: 'bl',
                    fSid: 'sid',
                })),
                forceContextRefresh: vi.fn(),
            },
        };
        handler = new TtsHandler(sessionManager);
    });

    it('returns Gemini TTS audio for GEMINI_TTS messages', async () => {
        fetchGeminiTtsAudio.mockResolvedValue({
            audioBase64: 'audio-base64',
            mimeType: 'audio/ogg',
            locale: 'zh-CN',
        });

        const response = await handler.handleTts({
            action: 'GEMINI_TTS',
            text: 'Hello',
            locale: 'zh-CN',
        });

        expect(response).toEqual({
            action: 'GEMINI_TTS_RESULT',
            status: 'success',
            audioBase64: 'audio-base64',
            mimeType: 'audio/ogg',
            locale: 'zh-CN',
        });
        expect(fetchGeminiTtsAudio).toHaveBeenCalledWith(
            'Hello',
            { atValue: 'at', blValue: 'bl', fSid: 'sid' },
            { locale: 'zh-CN', sourcePath: undefined }
        );
    });

    it('refreshes auth context once for refreshable TTS errors', async () => {
        sessionManager.auth.getOrFetchContext
            .mockResolvedValueOnce({ atValue: 'old', blValue: 'old-bl', fSid: 'old-sid' })
            .mockResolvedValueOnce({ atValue: 'new', blValue: 'new-bl', fSid: 'new-sid' });
        fetchGeminiTtsAudio
            .mockRejectedValueOnce(new Error('Missing Gemini Web auth token: blValue'))
            .mockResolvedValueOnce({ audioBase64: 'new-audio', mimeType: 'audio/ogg' });

        const response = await handler.handleTts({ action: 'GEMINI_TTS', text: 'Hello' });

        expect(response.status).toBe('success');
        expect(response.audioBase64).toBe('new-audio');
        expect(sessionManager.auth.forceContextRefresh).toHaveBeenCalledTimes(1);
        expect(fetchGeminiTtsAudio).toHaveBeenCalledTimes(2);
    });

    it('reports errors without throwing through the message channel', async () => {
        fetchGeminiTtsAudio.mockRejectedValue(new Error('TTS failed'));

        await expect(handler.handleTts({ action: 'GEMINI_TTS', text: 'Hello' })).resolves.toEqual({
            action: 'GEMINI_TTS_RESULT',
            status: 'error',
            error: 'TTS failed',
        });
    });
});
