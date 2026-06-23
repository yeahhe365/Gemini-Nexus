import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function readWatermarkPageScript() {
    return readFile('content/gemini_watermark_page.js', 'utf8');
}

describe('Gemini page watermark cleanup script', () => {
    it('installs a stable Nexus sentinel before the vendored GWR runtime loads', async () => {
        const source = await readWatermarkPageScript();

        expect(source).toContain('GeminiNexusGeminiWatermarkRemoverPage');
        expect(source).toContain('installed: true');
        expect(source).not.toContain('GeminiNexusWatermarkPage');
    });

    it('removes the old sampled-color Gemini watermark implementation', async () => {
        const source = await readWatermarkPageScript();

        expect(source).not.toContain('GEMINI_NEXUS_WATERMARK_REMOVAL_ENABLED');
        expect(source).not.toContain('GEMINI_NEXUS_FETCH_GEMINI_IMAGE_REQUEST');
        expect(source).not.toContain('SAMPLE_SIZE');
        expect(source).not.toContain('fillRect');
    });
});
