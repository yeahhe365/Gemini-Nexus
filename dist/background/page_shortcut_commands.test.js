import { describe, expect, it, vi } from 'vitest';

import { createPageShortcutCommandHandler } from './page_shortcut_commands.js';

describe('page shortcut command relay', () => {
    it('opens quick ask in the sender tab', async () => {
        const handlers = {
            showQuickAskForTab: vi.fn(() => Promise.resolve()),
            startAreaOcrForTab: vi.fn(),
        };
        const sendResponse = vi.fn();
        const handler = createPageShortcutCommandHandler(handlers);

        const handled = handler(
            { action: 'SHOW_QUICK_ASK_FROM_SHORTCUT' },
            { tab: { id: 7, url: 'https://example.com/' } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' }));
        expect(handlers.showQuickAskForTab).toHaveBeenCalledWith({
            id: 7,
            url: 'https://example.com/',
        });
    });

    it('starts area OCR in the sender tab', async () => {
        const handlers = {
            showQuickAskForTab: vi.fn(),
            startAreaOcrForTab: vi.fn(() => Promise.resolve()),
        };
        const sendResponse = vi.fn();
        const handler = createPageShortcutCommandHandler(handlers);

        const handled = handler(
            { action: 'START_AREA_OCR_FROM_SHORTCUT' },
            { tab: { id: 8, windowId: 3, url: 'https://example.com/' } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' }));
        expect(handlers.startAreaOcrForTab).toHaveBeenCalledWith({
            id: 8,
            windowId: 3,
            url: 'https://example.com/',
        });
    });

    it('reports shortcut relay failures to the sender', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const handlers = {
            showQuickAskForTab: vi.fn(() => Promise.reject(new Error('No tab'))),
            startAreaOcrForTab: vi.fn(),
        };
        const sendResponse = vi.fn();
        const handler = createPageShortcutCommandHandler(handlers);

        const handled = handler({ action: 'SHOW_QUICK_ASK_FROM_SHORTCUT' }, {}, sendResponse);

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'No tab',
            })
        );
        errorSpy.mockRestore();
    });

    it('ignores unrelated messages', () => {
        const handler = createPageShortcutCommandHandler({
            showQuickAskForTab: vi.fn(),
            startAreaOcrForTab: vi.fn(),
        });

        expect(handler({ action: 'UNKNOWN' }, {}, vi.fn())).toBe(false);
    });
});
