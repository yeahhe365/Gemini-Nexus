// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const INPUT_DATA_URL = `data:image/png;base64,${btoa('original')}`;
const PROCESSED_DATA_URL = `data:image/png;base64,${btoa('processed')}`;

function installGwrRuntime() {
    const removeWatermarkFromBlob = vi.fn(
        async (blob) => new Blob(['processed'], { type: blob.type || 'image/png' })
    );

    globalThis.__gwrPageProcessRuntimeInstalled__ = {
        removeWatermarkFromBlob,
    };
    window.__gwrPageProcessRuntimeInstalled__ = globalThis.__gwrPageProcessRuntimeInstalled__;

    return { removeWatermarkFromBlob };
}

function readBlobText(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
        reader.readAsText(blob);
    });
}

describe('WatermarkRemover', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        delete globalThis.GeminiNexusWatermarkRemover;
        delete globalThis.__gwrPageProcessRuntimeInstalled__;
        delete window.GeminiNexusWatermarkRemover;
        delete window.__gwrPageProcessRuntimeInstalled__;
    });

    it('delegates blob cleanup to the vendored GWR page runtime', async () => {
        const { removeWatermarkFromBlob } = installGwrRuntime();
        const inputBlob = new Blob(['original'], { type: 'image/webp' });
        const { WatermarkRemover } = await import('./watermark_remover.js');

        const result = await WatermarkRemover.processBlob(inputBlob);

        expect(removeWatermarkFromBlob).toHaveBeenCalledWith(inputBlob, { adaptiveMode: 'always' });
        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('image/webp');
        await expect(readBlobText(result)).resolves.toBe('processed');
    });

    it('keeps the data URL API while processing through the GWR blob runtime', async () => {
        const { removeWatermarkFromBlob } = installGwrRuntime();
        const { WatermarkRemover } = await import('./watermark_remover.js');

        const result = await WatermarkRemover.process(INPUT_DATA_URL);

        expect(result).toBe(PROCESSED_DATA_URL);
        const inputBlob = removeWatermarkFromBlob.mock.calls[0][0];
        expect(inputBlob).toBeInstanceOf(Blob);
        expect(inputBlob.type).toBe('image/png');
        await expect(readBlobText(inputBlob)).resolves.toBe('original');
    });
});
