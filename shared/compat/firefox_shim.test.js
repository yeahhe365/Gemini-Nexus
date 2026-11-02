import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('shared/compat/firefox_shim', () => {
    const shimSource = fs.readFileSync(path.resolve(__dirname, 'firefox_shim.js'), 'utf8');

    function createFirefoxSandbox() {
        class StorageArea {
            constructor() {
                this.data = {};
            }
            get(keys) {
                const result = {};
                if (Array.isArray(keys)) {
                    keys.forEach((key) => {
                        result[key] = this.data[key];
                    });
                }
                return Promise.resolve(result);
            }
            set(items) {
                Object.assign(this.data, items);
                return Promise.resolve();
            }
        }

        class EventManager {
            constructor() {
                this.listeners = [];
            }
            addListener(fn) {
                this.listeners.push(fn);
            }
            emit(...args) {
                this.listeners.forEach((fn) => fn(...args));
            }
        }

        const browser = {
            runtime: {
                id: 'test-id',
                getURL(relPath) {
                    return `moz-extension://uuid/${relPath}`;
                },
                sendMessage(message) {
                    return Promise.resolve({ ack: message });
                },
                onMessage: new EventManager(),
            },
            storage: {
                local: new StorageArea(),
                session: new StorageArea(),
                onChanged: new EventManager(),
            },
            tabs: {
                query(filter) {
                    return Promise.resolve([{ id: 42, active: true }]);
                },
                getCurrent() {
                    return Promise.resolve({ id: 42 });
                },
            },
            sidebarAction: {
                open() {
                    return Promise.resolve();
                },
                setPanel() {
                    return Promise.resolve();
                },
            },
        };

        const context = {
            globalThis: {},
            Promise,
            Array,
            WeakMap,
            Proxy,
            Object,
            String,
        };
        context.globalThis = context;
        context.browser = browser;

        vm.runInNewContext(shimSource, context);
        return { context, browser };
    }

    it('wraps storage.local.get to support Chrome-style callback on custom prototype objects', async () => {
        const { context, browser } = createFirefoxSandbox();
        browser.storage.local.data.geminiSessions = [{ id: 's1', title: 'hello' }];

        const result = await new Promise((resolve) => {
            context.chrome.storage.local.get(['geminiSessions'], (data) => {
                resolve(data);
            });
        });

        expect(result).toEqual({ geminiSessions: [{ id: 's1', title: 'hello' }] });
    });

    it('preserves promise-style usage when no callback is provided', async () => {
        const { context, browser } = createFirefoxSandbox();
        browser.storage.local.data.testKey = 'value';

        const result = await context.chrome.storage.local.get(['testKey']);
        expect(result).toEqual({ testKey: 'value' });
    });

    it('wraps tabs.query and tabs.getCurrent callbacks', async () => {
        const { context } = createFirefoxSandbox();

        const tabs = await new Promise((resolve) => {
            context.chrome.tabs.query({ active: true }, (items) => resolve(items));
        });
        expect(tabs).toEqual([{ id: 42, active: true }]);

        const currentTab = await new Promise((resolve) => {
            context.chrome.tabs.getCurrent((tab) => resolve(tab));
        });
        expect(currentTab).toEqual({ id: 42 });
    });

    it('handles listener methods without callback wrapping', () => {
        const { context, browser } = createFirefoxSandbox();
        let received = null;

        context.chrome.runtime.onMessage.addListener((msg) => {
            received = msg;
        });

        browser.runtime.onMessage.emit({ action: 'TEST_ACTION' });
        expect(received).toEqual({ action: 'TEST_ACTION' });
    });

    it('keeps sendMessage pending until a listener calls sendResponse after returning true', async () => {
        const { context, browser } = createFirefoxSandbox();
        browser.runtime.sendMessage = (message) => {
            const replies = browser.runtime.onMessage.listeners.map((listener) =>
                listener(message, { id: 'sender' })
            );
            const pending = replies.find((reply) => reply && typeof reply.then === 'function');
            return pending || Promise.resolve(undefined);
        };
        let release;
        context.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            setTimeout(() => sendResponse({ status: 'completed', echo: message.text }), 0);
            release = true;
            return true;
        });

        const response = await context.chrome.runtime.sendMessage({
            action: 'SEND_PROMPT',
            text: 'hi',
        });

        expect(release).toBe(true);
        expect(response).toEqual({ status: 'completed', echo: 'hi' });
    });

    it('keeps the listener promise pending until sendResponse even without returning true', async () => {
        const { context, browser } = createFirefoxSandbox();
        browser.runtime.sendMessage = (message) => {
            const replies = browser.runtime.onMessage.listeners.map((listener) =>
                listener(message, { id: 'sender' })
            );
            const pending = replies.find((reply) => reply && typeof reply.then === 'function');
            return pending || Promise.resolve(undefined);
        };
        context.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            sendResponse({ status: 'completed', echo: message.text });
        });

        const response = await context.chrome.runtime.sendMessage({
            action: 'TOGGLE_BROWSER_CONTROL',
            text: 'hi',
        });

        expect(response).toEqual({ status: 'completed', echo: 'hi' });
    });

    it('does not claim sendMessage response when a listener does not handle the message', async () => {
        const { context, browser } = createFirefoxSandbox();
        browser.runtime.sendMessage = (message) => {
            const replies = browser.runtime.onMessage.listeners.map((listener) =>
                listener(message, { id: 'sender' })
            );
            const pending = replies.find((reply) => reply && typeof reply.then === 'function');
            return pending || Promise.resolve(undefined);
        };

        // First listener ignores the message
        context.chrome.runtime.onMessage.addListener((message) => {
            if (message.action === 'OTHER') return true;
            return false;
        });

        // Second listener handles the message
        context.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'TARGET') {
                sendResponse({ status: 'handled', echo: message.text });
                return true;
            }
        });

        const response = await context.chrome.runtime.sendMessage({
            action: 'TARGET',
            text: 'test-data',
        });

        expect(response).toEqual({ status: 'handled', echo: 'test-data' });
    });

    it('emulates chrome.sidePanel on top of sidebarAction', () => {
        const { context } = createFirefoxSandbox();
        expect(typeof context.chrome.sidePanel?.setPanelBehavior).toBe('function');
        expect(typeof context.chrome.sidePanel?.open).toBe('function');
        expect(typeof context.chrome.sidePanel?.setOptions).toBe('function');
    });

    it('calls Firefox sidebar open and close with no arguments', async () => {
        const { context, browser } = createFirefoxSandbox();
        const calls = [];
        browser.sidebarAction.open = function () {
            calls.push(['open', arguments.length]);
            return Promise.resolve();
        };
        browser.sidebarAction.close = function () {
            calls.push(['close', arguments.length]);
            return Promise.resolve();
        };
        browser.sidebarAction.setPanel = function (details) {
            calls.push(['setPanel', details]);
            return Promise.resolve();
        };

        await context.chrome.sidePanel.open({ tabId: 7, windowId: 3 });
        await context.chrome.sidePanel.setOptions({ tabId: 7, enabled: false });
        await context.chrome.sidePanel.setOptions({
            path: 'sidepanel/index.html',
            enabled: false,
        });
        await context.chrome.sidePanel.setOptions({
            tabId: 7,
            path: 'sidepanel/index.html?tabId=7',
            enabled: true,
        });

        expect(calls).toEqual([
            ['open', 0],
            ['close', 0],
            ['setPanel', { panel: 'sidepanel/index.html' }],
            ['setPanel', { panel: 'sidepanel/index.html?tabId=7', tabId: 7 }],
        ]);
    });

    it('reports chrome.runtime.lastError when callback operation fails', async () => {
        const { context, browser } = createFirefoxSandbox();
        browser.storage.local.get = () => Promise.reject(new Error('Storage failure'));

        const result = await new Promise((resolve) => {
            context.chrome.storage.local.get(['err'], (data) => {
                resolve({ data, lastError: context.chrome.runtime.lastError });
            });
        });

        expect(result.data).toBeUndefined();
        expect(result.lastError?.message).toContain('Storage failure');
    });
});
