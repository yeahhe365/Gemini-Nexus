import { describe, expect, it, vi } from 'vitest';
import { fetchRequestParams } from './auth.js';

describe('fetchRequestParams', () => {
    it('extracts current Gemini web request tokens from logged-in HTML', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            text: () =>
                Promise.resolve(
                    '<html lang="zh-CN"><script>{"SNlM0e":"at-token","cfb2h":"boq_assistant-bard-web-server_20260511.16_p5","FdrFJe":"3956664217185504700","qKIAYe":"feeds/upload-dynamic","Ylro7b":"client-pctx-token"}</script><div data-index="2"></div></html>'
                ),
        });

        await expect(fetchRequestParams('2')).resolves.toEqual({
            atValue: 'at-token',
            blValue: 'boq_assistant-bard-web-server_20260511.16_p5',
            fSid: '3956664217185504700',
            locale: 'zh-CN',
            authUserIndex: '2',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        });
        expect(global.fetch).toHaveBeenCalledWith('https://gemini.google.com/u/2/app', {
            method: 'GET',
            credentials: 'include',
        });
    });

    it('rejects HTML that no longer exposes required Web request tokens', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            text: () => Promise.resolve('<html><script>{"SNlM0e":"at-token"}</script></html>'),
        });

        await expect(fetchRequestParams('0')).rejects.toThrow(
            'Gemini Web request tokens unavailable for account 0: blValue, fSid'
        );
    });
});
