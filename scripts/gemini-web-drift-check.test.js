import { describe, expect, it } from 'vitest';

import { GEMINI_WEB_EXPECTATIONS, inspectGeminiWebSources } from './gemini-web-drift-check.mjs';

function buildCurrentHtml() {
    return `
        <html lang="zh-CN">
            <script>
                {"SNlM0e":"at-token","cfb2h":"boq_assistant-bard-web-server_20260521.02_p1","FdrFJe":"4903080392591128673","qKIAYe":"feeds/mc-dynamic","Ylro7b":"client-pctx"}
            </script>
        </html>
    `;
}

function buildCurrentScript() {
    return [
        GEMINI_WEB_EXPECTATIONS.streamRpcPath,
        GEMINI_WEB_EXPECTATIONS.streamRpcId,
        GEMINI_WEB_EXPECTATIONS.processFileRpcPath,
        GEMINI_WEB_EXPECTATIONS.processFileRpcId,
        GEMINI_WEB_EXPECTATIONS.uploadEndpoint,
        ...GEMINI_WEB_EXPECTATIONS.uploadHeaders,
        ...GEMINI_WEB_EXPECTATIONS.streamHeaderExtensions,
        ...GEMINI_WEB_EXPECTATIONS.nativeThinkingMarkers,
        ...GEMINI_WEB_EXPECTATIONS.temporaryChatMarkers,
        '8c46e95b1a07cecc',
        '56fdd199312815e2',
        'e6fa609c3fa255c0',
        '95a4c0abcba24364',
    ].join('\n');
}

describe('Gemini Web drift check', () => {
    it('requires at least one source to avoid false-positive checks', () => {
        const report = inspectGeminiWebSources();

        expect(report.ok).toBe(false);
        expect(report.failures).toContain(
            'No Gemini Web sources provided. Pass --html, --script, or --url.'
        );
    });

    it('accepts sources that match the current reverse-engineered contract', () => {
        const report = inspectGeminiWebSources({
            html: buildCurrentHtml(),
            script: buildCurrentScript(),
        });

        expect(report.ok).toBe(true);
        expect(report.failures).toEqual([]);
        expect(report.html.locale).toBe('zh-CN');
    });

    it('reports missing request tokens, RPCs, upload contract, headers, and model hashes', () => {
        const report = inspectGeminiWebSources({
            html: '<html><script>{"SNlM0e":"at-token"}</script></html>',
            script: 'only old content-push.googleapis.com/upload and gemini-3-pro-image-preview',
        });

        expect(report.ok).toBe(false);
        expect(report.failures).toEqual(
            expect.arrayContaining([
                'Missing HTML tokens: cfb2h, FdrFJe, qKIAYe, Ylro7b',
                'Missing StreamGenerate RPC mapping.',
                'Missing ProcessFile RPC mapping.',
                'Missing current push upload endpoint.',
                'Missing upload headers: Push-ID, X-Tenant-Id, X-Client-Pctx',
                'Missing stream side-channel headers: 525001261, 525005358, 73010989, 73010990',
                'Missing configured model hashes: 8c46e95b1a07cecc, 56fdd199312815e2, e6fa609c3fa255c0, 95a4c0abcba24364',
                'Missing native thinking markers: THINKING_LEVEL_STANDARD, THINKING_LEVEL_EXTENDED, THINKING_LEVEL_DEEP_THINK',
                'Missing temporary chat markers: gemini_chat_temp, is-temporary-chat, temporary-chat-header, disable_temp_chat_soft_badge',
            ])
        );
    });
});
