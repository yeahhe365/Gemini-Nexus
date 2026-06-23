import { describe, expect, it } from 'vitest';
import { ImageManager } from './image_manager.js';

describe('ImageManager', () => {
    it('normalizes generic image data URLs before returning fetched image metadata', async () => {
        const manager = new ImageManager();

        await expect(
            manager.fetchImage('data:application/octet-stream;base64,iVBORw0KGgoAAA')
        ).resolves.toEqual({
            action: 'FETCH_IMAGE_RESULT',
            base64: 'data:image/png;base64,iVBORw0KGgoAAA',
            type: 'image/png',
            name: 'dropped_image.png',
        });
    });
});
