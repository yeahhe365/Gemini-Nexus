// @vitest-environment jsdom

import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const bridgeSourcePromise = readFile('content/shortcut_frame_bridge.js', 'utf8');

function createKeyboardEvent(frameWindow, key, modifiers = {}) {
    return new frameWindow.KeyboardEvent('keydown', {
        key,
        code: modifiers.code,
        ctrlKey: modifiers.ctrlKey === true,
        altKey: modifiers.altKey === true,
        shiftKey: modifiers.shiftKey === true,
        metaKey: modifiers.metaKey === true,
        bubbles: true,
        cancelable: true,
    });
}

async function installBridge(frameWindow) {
    frameWindow.chrome = globalThis.chrome;
    frameWindow.eval(await bridgeSourcePromise);
}

describe('shortcut frame bridge', () => {
    let storageChangeListener;

    beforeEach(() => {
        storageChangeListener = null;
        delete window.GeminiNexusShortcutFrameBridge;
        delete window.GeminiNexusShortcutFrameBridgeReady;
        document.body.innerHTML = '';
        globalThis.chrome = {
            storage: {
                local: {
                    get: vi.fn((keys, callback) => callback({})),
                },
                onChanged: {
                    addListener: vi.fn((listener) => {
                        storageChangeListener = listener;
                    }),
                    removeListener: vi.fn(),
                },
            },
            runtime: {
                lastError: null,
                sendMessage: vi.fn(),
            },
        };
    });

    it('routes quick ask from the top document through the early shortcut bridge', async () => {
        window.chrome = globalThis.chrome;
        window.eval(await bridgeSourcePromise);

        const event = createKeyboardEvent(window, 'œ', { altKey: true, code: 'KeyQ' });
        document.dispatchEvent(event);

        expect(window.GeminiNexusShortcutFrameBridgeReady).toBe(true);
        expect(window.GeminiNexusShortcutFrameBridge).toBeTruthy();
        expect(event.defaultPrevented).toBe(true);
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SHOW_QUICK_ASK_FROM_SHORTCUT',
        });
    });

    it('routes quick ask from a focused iframe to the background shortcut command', async () => {
        const frame = document.createElement('iframe');
        document.body.appendChild(frame);
        await installBridge(frame.contentWindow);

        const event = createKeyboardEvent(frame.contentWindow, 'œ', {
            altKey: true,
            code: 'KeyQ',
        });
        frame.contentDocument.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SHOW_QUICK_ASK_FROM_SHORTCUT',
        });
    });

    it('routes macOS option-modified OCR shortcuts from iframes by physical key code', async () => {
        const frame = document.createElement('iframe');
        document.body.appendChild(frame);
        await installBridge(frame.contentWindow);

        const event = createKeyboardEvent(frame.contentWindow, 'ø', {
            altKey: true,
            code: 'KeyO',
        });
        frame.contentDocument.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'START_AREA_OCR_FROM_SHORTCUT',
            mode: 'ocr',
            source: 'local',
        });
    });

    it('updates iframe shortcuts from storage changes', async () => {
        const frame = document.createElement('iframe');
        document.body.appendChild(frame);
        await installBridge(frame.contentWindow);

        storageChangeListener(
            {
                geminiShortcuts: {
                    newValue: {
                        quickAsk: 'Alt+Q',
                    },
                },
            },
            'local'
        );

        frame.contentDocument.dispatchEvent(
            createKeyboardEvent(frame.contentWindow, 'œ', { altKey: true, code: 'KeyQ' })
        );

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SHOW_QUICK_ASK_FROM_SHORTCUT',
        });
    });
});
