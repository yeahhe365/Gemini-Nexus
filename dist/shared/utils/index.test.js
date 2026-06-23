import { describe, expect, it } from 'vitest';

import { createPrefixedId } from './index.js';

describe('shared utils', () => {
    it('creates readable prefixed IDs for DOM and request correlation', () => {
        const id = createPrefixedId('gen_img');

        expect(id).toMatch(/^gen_img_[A-Z0-9-]+$/);
    });
});
