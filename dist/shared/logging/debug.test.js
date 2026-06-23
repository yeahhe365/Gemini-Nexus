import { afterEach, describe, expect, it, vi } from 'vitest';

import { debugLog } from './debug.js';

describe('debugLog', () => {
    afterEach(() => {
        delete globalThis.GeminiNexusDebug;
        vi.restoreAllMocks();
    });

    it('does not write debug logs unless debug mode is enabled', () => {
        const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

        debugLog('hidden');

        expect(spy).not.toHaveBeenCalled();

        globalThis.GeminiNexusDebug = true;
        debugLog('shown');

        expect(spy).toHaveBeenCalledWith('shown');
    });
});
