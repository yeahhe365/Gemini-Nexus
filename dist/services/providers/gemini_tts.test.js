import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGeminiTtsAudio, GeminiTtsInternals } from './gemini_tts.js';

const CONTEXT = {
    atValue: 'at-token',
    blValue: 'boq_assistant-bard-web-server_20260525.09_p0',
    fSid: '123456789',
    locale: 'zh-CN',
    authUser: '0',
};

function createBatchResponse(audioBase64 = 'T2dnUw==') {
    return `)]}'\n\n123\n${JSON.stringify([['wrb.fr', 'XqA3Ic', JSON.stringify([audioBase64])]])}`;
}

describe('Gemini Web TTS provider', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        global.fetch = vi.fn(async () => ({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => createBatchResponse('audio-base64'),
        }));
    });

    it('calls Gemini Web GetTts with the reversed XqA3Ic batch payload', async () => {
        const result = await fetchGeminiTtsAudio('  Hello   Gemini  ', CONTEXT);

        expect(result).toEqual({
            audioBase64: 'audio-base64',
            mimeType: 'audio/ogg',
            locale: 'zh-CN',
        });

        const [url, init] = fetch.mock.calls[0];
        expect(url).toContain('/_/BardChatUi/data/batchexecute?');
        expect(url).toContain('rpcids=XqA3Ic');
        expect(url).toContain('bl=boq_assistant-bard-web-server_20260525.09_p0');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('include');
        expect(init.headers['X-Same-Domain']).toBe('1');
        expect(init.headers['x-goog-ext-73010989-jspb']).toBe('[0]');
        expect(init.headers['x-goog-ext-525001261-jspb']).toContain('[4,5,6,8]');

        expect(init.body.get('at')).toBe('at-token');
        expect(JSON.parse(init.body.get('f.req'))).toEqual([
            [['XqA3Ic', JSON.stringify([null, 'Hello Gemini', 'zh-CN', null, 2]), null, 'generic']],
        ]);
    });

    it('uses the account-specific Gemini URL when authUser is not zero', async () => {
        await fetchGeminiTtsAudio('Hello', { ...CONTEXT, authUser: '2' });

        const [url, init] = fetch.mock.calls[0];
        expect(url).toContain('https://gemini.google.com/u/2/_/BardChatUi');
        expect(init.headers['X-Goog-AuthUser']).toBe('2');
    });

    it('parses the batch response audio payload', () => {
        expect(GeminiTtsInternals.parseTtsBatchResponse(createBatchResponse('abc123'))).toBe(
            'abc123'
        );
    });

    it('rejects empty text before making a network request', async () => {
        await expect(fetchGeminiTtsAudio('   ', CONTEXT)).rejects.toThrow('No readable text');
        expect(fetch).not.toHaveBeenCalled();
    });
});
