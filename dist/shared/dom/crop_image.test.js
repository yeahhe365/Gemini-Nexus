// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './crop_global.js';
import { cropImage } from './crop_image.js';

describe('crop utilities', () => {
    let originalCrop;

    beforeEach(() => {
        originalCrop = globalThis.GeminiNexusCrop;
    });

    afterEach(() => {
        globalThis.GeminiNexusCrop = originalCrop;
    });

    it('exposes the shared crop global for classic content scripts', () => {
        expect(globalThis.GeminiNexusCrop).toEqual(
            expect.objectContaining({
                cropImage: expect.any(Function),
            })
        );
    });

    it('delegates the ESM crop module to the shared crop global', async () => {
        const area = { x: 1, y: 2, width: 3, height: 4, pixelRatio: 2 };
        const cropImpl = vi.fn().mockResolvedValue('data:image/png;base64,cropped');
        globalThis.GeminiNexusCrop = { cropImage: cropImpl };

        await expect(cropImage('data:image/png;base64,source', area)).resolves.toBe(
            'data:image/png;base64,cropped'
        );
        expect(cropImpl).toHaveBeenCalledWith('data:image/png;base64,source', area);
    });
});
