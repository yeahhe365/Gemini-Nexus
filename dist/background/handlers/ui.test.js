import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UIMessageHandler } from './ui.js';

describe('UIMessageHandler browser control tab ownership', () => {
    let controlManager;
    let imageHandler;
    let handler;

    beforeEach(() => {
        imageHandler = {
            fetchImage: vi.fn(() =>
                Promise.resolve({
                    action: 'FETCH_IMAGE_RESULT',
                    base64: 'data:image/jpeg;base64,abc',
                    type: 'image/jpeg',
                })
            ),
        };
        controlManager = {
            setOwnerSidePanelTabId: vi.fn(),
            enableControl: vi.fn(),
            disableControl: vi.fn(),
            setTargetTab: vi.fn(),
            isTabControllable: vi.fn(() => true),
        };
        handler = new UIMessageHandler(imageHandler, controlManager, null, null);
    });

    it('scopes browser control toggle broadcasts to the requesting side panel tab', () => {
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'TOGGLE_BROWSER_CONTROL',
                enabled: true,
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        expect(controlManager.setOwnerSidePanelTabId).toHaveBeenCalledWith(123);
        expect(controlManager.enableControl).toHaveBeenCalledWith({ createDefaultTab: false });
        expect(sendResponse).toHaveBeenCalledWith({ status: 'processed' });
    });

    it('does not create a default Google tab for host-tab chat pages with webpage context', () => {
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'TOGGLE_BROWSER_CONTROL',
                enabled: true,
                hostIsTab: true,
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        expect(controlManager.setOwnerSidePanelTabId).toHaveBeenCalledWith(123);
        expect(controlManager.enableControl).toHaveBeenCalledWith({ createDefaultTab: false });
        expect(sendResponse).toHaveBeenCalledWith({ status: 'processed' });
    });

    it('creates a default Google tab for true standalone chat pages', () => {
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'TOGGLE_BROWSER_CONTROL',
                enabled: true,
                hostIsTab: true,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        expect(controlManager.setOwnerSidePanelTabId).toHaveBeenCalledWith(null);
        expect(controlManager.enableControl).toHaveBeenCalledWith({ createDefaultTab: true });
        expect(sendResponse).toHaveBeenCalledWith({ status: 'processed' });
    });

    it('reports browser control enable failures to the requester', async () => {
        const error = new Error('Debugger attach failed');
        controlManager.enableControl = vi.fn(() => Promise.reject(error));
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            const handled = handler.handle(
                {
                    action: 'TOGGLE_BROWSER_CONTROL',
                    enabled: true,
                    sidePanelTabId: 123,
                },
                {},
                sendResponse
            );

            expect(handled).toBe(true);
            await vi.waitFor(() =>
                expect(sendResponse).toHaveBeenCalledWith({
                    status: 'error',
                    error: 'Debugger attach failed',
                })
            );
            expect(errorSpy).toHaveBeenCalledWith('Browser control toggle failed', error);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('reports browser control enable attempts that resolve without attaching', async () => {
        controlManager.enableControl = vi.fn(() => Promise.resolve(false));
        controlManager.lastControlError = 'No controllable browser tab is selected.';
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'TOGGLE_BROWSER_CONTROL',
                enabled: true,
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'No controllable browser tab is selected.',
            })
        );
    });

    it('scopes manual tab switching broadcasts to the requesting side panel tab', async () => {
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'SWITCH_TAB',
                tabId: 45,
                switchVisual: false,
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() => {
            expect(controlManager.setOwnerSidePanelTabId).toHaveBeenCalledWith(123);
            expect(controlManager.setTargetTab).toHaveBeenCalledWith(45);
            expect(sendResponse).toHaveBeenCalledWith({ status: 'switched' });
        });
    });

    it('does not manually switch browser control to an uncontrollable tab', async () => {
        controlManager.isTabControllable = vi.fn(() => Promise.resolve(false));
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'SWITCH_TAB',
                tabId: 45,
                switchVisual: false,
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'Tab cannot be controlled.',
            })
        );
        expect(controlManager.setTargetTab).not.toHaveBeenCalled();
    });

    it('returns only controlled group tabs while browser control is scoped', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                query: vi.fn(({ groupId }) => {
                    if (groupId === 7) {
                        return Promise.resolve([
                            { id: 1, title: 'Inside', url: 'https://inside.test/' },
                        ]);
                    }
                    return Promise.resolve([
                        { id: 1, title: 'Inside', url: 'https://inside.test/' },
                        { id: 2, title: 'Outside', url: 'https://outside.test/' },
                    ]);
                }),
            },
        };
        controlManager.getControlledGroupId = vi.fn(() => 7);
        controlManager.getTargetTabId = vi.fn(() => 1);
        const sendResponse = vi.fn();

        const handled = handler.handle(
            { action: 'GET_OPEN_TABS', sidePanelTabId: 123 },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'OPEN_TABS_RESULT',
                    tabs: [expect.objectContaining({ id: 1, title: 'Inside' })],
                })
            )
        );
        expect(chrome.tabs.query).toHaveBeenCalledWith({ currentWindow: true, groupId: 7 });
    });

    it('returns tabs from the controlled popup window when the control scope has no group', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                query: vi.fn(({ windowId }) => {
                    if (windowId === 55) {
                        return Promise.resolve([
                            { id: 9, title: 'Worker', url: 'https://worker.test/', windowId: 55 },
                        ]);
                    }
                    return Promise.resolve([
                        { id: 1, title: 'Main', url: 'https://main.test/', windowId: 1 },
                    ]);
                }),
            },
        };
        controlManager.getControlledGroupId = vi.fn(() => null);
        controlManager.getControlledWindowId = vi.fn(() => 55);
        controlManager.getTargetTabId = vi.fn(() => 9);
        const sendResponse = vi.fn();

        const handled = handler.handle(
            { action: 'GET_OPEN_TABS', sidePanelTabId: 123 },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'OPEN_TABS_RESULT',
                    tabs: [expect.objectContaining({ id: 9, title: 'Worker' })],
                })
            )
        );
        expect(chrome.tabs.query).toHaveBeenCalledWith({ windowId: 55 });
    });

    it('sends an empty open-tabs result to the side panel when tab lookup fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                query: vi.fn(() => Promise.reject(new Error('Tabs unavailable'))),
            },
        };
        controlManager.getTargetTabId = vi.fn(() => 1);
        const sendResponse = vi.fn();

        const handled = handler.handle(
            { action: 'GET_OPEN_TABS', sidePanelTabId: 123 },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'OPEN_TABS_RESULT',
                tabId: 123,
                tabs: [],
                lockedTabId: 1,
                error: 'Tabs unavailable',
            })
        );
        expect(sendResponse).toHaveBeenCalledWith({
            status: 'error',
            error: 'Tabs unavailable',
        });
    });

    it('reports open-tabs result delivery failures to the requester', async () => {
        const deliveryError = new Error('Side panel unavailable');
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.reject(deliveryError)),
            },
            tabs: {
                query: vi.fn(() =>
                    Promise.resolve([{ id: 1, title: 'Inside', url: 'https://inside.test/' }])
                ),
            },
        };
        controlManager.getTargetTabId = vi.fn(() => 1);
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            const handled = handler.handle(
                { action: 'GET_OPEN_TABS', sidePanelTabId: 123 },
                {},
                sendResponse
            );

            expect(handled).toBe(true);
            await vi.waitFor(() =>
                expect(sendResponse).toHaveBeenCalledWith({
                    status: 'error',
                    error: 'Side panel unavailable',
                })
            );
            expect(errorSpy).toHaveBeenCalledWith('Open tabs delivery error', deliveryError);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('reports side panel open failures to the requesting content script', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        globalThis.chrome = {
            storage: {
                local: {
                    set: vi.fn(() => Promise.resolve()),
                    remove: vi.fn(() => Promise.resolve()),
                },
            },
            sidePanel: {
                open: vi.fn(() => Promise.reject(new Error('Panel unavailable'))),
                setOptions: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, null);

        const handled = handler.handle(
            { action: 'OPEN_SIDE_PANEL' },
            { tab: { id: 9, windowId: 4 } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'Panel unavailable',
            })
        );
    });

    it('toggles the side panel through the side panel scope manager', async () => {
        const sidePanelScopeManager = {
            toggleForTab: vi.fn(() => Promise.resolve({ status: 'closed' })),
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, sidePanelScopeManager);

        const handled = handler.handle(
            { action: 'TOGGLE_SIDE_PANEL' },
            { tab: { id: 9, windowId: 4 } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'closed' }));
        expect(sidePanelScopeManager.toggleForTab).toHaveBeenCalledWith(9, 4);
    });

    it('marks the side panel closed when the side panel page unloads', () => {
        const sidePanelScopeManager = {
            markClosedForTab: vi.fn(),
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, sidePanelScopeManager);

        const handled = handler.handle({ action: 'SIDE_PANEL_CLOSED', tabId: 9 }, {}, sendResponse);

        expect(handled).toBe(false);
        expect(sidePanelScopeManager.markClosedForTab).toHaveBeenCalledWith(9);
        expect(sendResponse).toHaveBeenCalledWith({ status: 'processed' });
    });

    it('clears pending side panel actions when opening the side panel fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        globalThis.chrome = {
            storage: {
                local: {
                    set: vi.fn(() => Promise.resolve()),
                    remove: vi.fn(() => Promise.resolve()),
                },
            },
            sidePanel: {
                open: vi.fn(() => Promise.reject(new Error('Panel unavailable'))),
                setOptions: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, null);

        const handled = handler.handle(
            { action: 'OPEN_SIDE_PANEL', sessionId: 'session-1', mode: 'browser_control' },
            { tab: { id: 9, windowId: 4 } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'Panel unavailable',
            })
        );
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            pendingSessionId: 'session-1',
            pendingMode: 'browser_control',
        });
        expect(chrome.storage.local.remove).toHaveBeenCalledWith([
            'pendingSessionId',
            'pendingMode',
        ]);
    });

    it('continues opening the side panel when pending action storage fails', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        globalThis.chrome = {
            storage: {
                local: {
                    set: vi.fn(() => Promise.reject(new Error('Pending storage unavailable'))),
                    remove: vi.fn(() => Promise.resolve()),
                },
            },
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            sidePanel: {
                open: vi.fn(() => Promise.resolve()),
                setOptions: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, null);

        const handled = handler.handle(
            { action: 'OPEN_SIDE_PANEL', sessionId: 'session-1', mode: 'browser_control' },
            { tab: { id: 9, windowId: 4 } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'opened' }));
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 9, windowId: 4 });
        expect(console.warn).toHaveBeenCalledWith(
            'Could not store pending side panel actions:',
            expect.any(Error)
        );
    });

    it('reports browser control side panel open failures to the requester', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        globalThis.chrome = {
            storage: {
                local: {
                    set: vi.fn(() => Promise.resolve()),
                    remove: vi.fn(() => Promise.resolve()),
                },
            },
            sidePanel: {
                open: vi.fn(() => Promise.reject(new Error('Panel unavailable'))),
                setOptions: vi.fn(() => Promise.resolve()),
            },
        };
        controlManager.getTargetTabId = vi.fn(() => null);
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, null);

        const handled = handler.handle(
            { action: 'TOGGLE_SIDE_PANEL_CONTROL' },
            { tab: { id: 9, windowId: 4 } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'Panel unavailable',
            })
        );
    });

    it('reads selected text from the requesting side panel tab instead of the active tab', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                get: vi.fn(() =>
                    Promise.resolve({
                        id: 123,
                        title: 'Side panel owner',
                        windowId: 8,
                        url: 'https://owner.test/',
                    })
                ),
                query: vi.fn(() =>
                    Promise.resolve([{ id: 999, title: 'Wrong active tab', windowId: 1 }])
                ),
                sendMessage: vi.fn(() => Promise.resolve({ selection: 'selected from owner' })),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, null);

        const handled = handler.handle(
            { action: 'GET_ACTIVE_SELECTION', sidePanelTabId: 123 },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
                action: 'GET_SELECTION',
            })
        );
        expect(chrome.tabs.query).not.toHaveBeenCalled();
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SELECTION_RESULT',
            tabId: 123,
            text: 'selected from owner',
        });
    });

    it('reports active selection result delivery failures to the requester', async () => {
        const deliveryError = new Error('Side panel unavailable');
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.reject(deliveryError)),
            },
            tabs: {
                get: vi.fn(() =>
                    Promise.resolve({
                        id: 123,
                        title: 'Side panel owner',
                        windowId: 8,
                        url: 'https://owner.test/',
                    })
                ),
                query: vi.fn(() => Promise.resolve([])),
                sendMessage: vi.fn(() => Promise.resolve({ selection: 'selected from owner' })),
            },
        };
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const handler = new UIMessageHandler({}, controlManager, null, null);

        try {
            const handled = handler.handle(
                { action: 'GET_ACTIVE_SELECTION', sidePanelTabId: 123 },
                {},
                sendResponse
            );

            expect(handled).toBe(true);
            await vi.waitFor(() =>
                expect(sendResponse).toHaveBeenCalledWith({
                    status: 'error',
                    error: 'Side panel unavailable',
                })
            );
            expect(errorSpy).toHaveBeenCalledWith('Active selection lookup error', deliveryError);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('returns an empty active selection result when no target tab is available', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                get: vi.fn(() => Promise.reject(new Error('Tab not found'))),
                query: vi.fn(() => Promise.resolve([])),
                sendMessage: vi.fn(),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler({}, controlManager, null, null);

        const handled = handler.handle(
            { action: 'GET_ACTIVE_SELECTION', sidePanelTabId: 123 },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'SELECTION_RESULT',
                tabId: 123,
                text: '',
            })
        );
        expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('starts area capture on the requesting side panel tab instead of the active tab', async () => {
        const imageHandler = {
            captureScreenshot: vi.fn(() =>
                Promise.resolve({
                    base64: 'data:image/png;base64,AAAA',
                })
            ),
        };
        globalThis.chrome = {
            tabs: {
                get: vi.fn(() =>
                    Promise.resolve({
                        id: 123,
                        title: 'Side panel owner',
                        windowId: 8,
                        url: 'https://owner.test/',
                    })
                ),
                query: vi.fn(() =>
                    Promise.resolve([{ id: 999, title: 'Wrong active tab', windowId: 1 }])
                ),
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler(imageHandler, controlManager, null, null);

        const handled = handler.handle(
            {
                action: 'INITIATE_CAPTURE',
                mode: 'snip',
                source: 'sidepanel',
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(false);
        await vi.waitFor(() => expect(imageHandler.captureScreenshot).toHaveBeenCalledWith(8));
        expect(chrome.tabs.query).not.toHaveBeenCalled();
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
            action: 'START_SELECTION',
            image: 'data:image/png;base64,AAAA',
            mode: 'snip',
            source: 'sidepanel',
            targetSidePanelTabId: 123,
        });
    });

    it('reports side panel area capture overlay start failures after screenshot capture succeeds', async () => {
        const imageHandler = {
            captureScreenshot: vi.fn(() =>
                Promise.resolve({
                    base64: 'data:image/png;base64,AAAA',
                })
            ),
        };
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                get: vi.fn(() =>
                    Promise.resolve({
                        id: 123,
                        title: 'Side panel owner',
                        windowId: 8,
                        url: 'https://owner.test/',
                    })
                ),
                query: vi.fn(() => Promise.resolve([])),
                sendMessage: vi.fn(() => Promise.reject(new Error('Content script unavailable'))),
            },
        };
        const handler = new UIMessageHandler(imageHandler, controlManager, null, null);

        const handled = handler.handle(
            {
                action: 'INITIATE_CAPTURE',
                mode: 'snip',
                source: 'sidepanel',
                sidePanelTabId: 123,
            },
            {},
            vi.fn()
        );

        expect(handled).toBe(false);
        await vi.waitFor(() =>
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'SCREEN_CAPTURE_ERROR',
                error: 'Content script unavailable',
                tabId: 123,
            })
        );
    });

    it('reports side panel area capture start failures without opening the selection overlay', async () => {
        const imageHandler = {
            captureScreenshot: vi.fn(() =>
                Promise.resolve({
                    error: 'Capture failed',
                })
            ),
        };
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                get: vi.fn(() =>
                    Promise.resolve({
                        id: 123,
                        windowId: 8,
                        url: 'https://owner.test/',
                    })
                ),
                query: vi.fn(() => Promise.resolve([])),
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
        const handler = new UIMessageHandler(imageHandler, controlManager, null, null);

        const handled = handler.handle(
            {
                action: 'INITIATE_CAPTURE',
                mode: 'snip',
                source: 'sidepanel',
                sidePanelTabId: 123,
            },
            {},
            vi.fn()
        );

        expect(handled).toBe(false);
        await vi.waitFor(() =>
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'SCREEN_CAPTURE_ERROR',
                error: 'Capture failed',
                tabId: 123,
            })
        );
        expect(chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
            123,
            expect.objectContaining({ action: 'START_SELECTION' })
        );
    });

    it('reports local area capture start failures to the content script', async () => {
        const imageHandler = {
            captureScreenshot: vi.fn(() =>
                Promise.resolve({
                    error: 'Capture failed',
                })
            ),
        };
        globalThis.chrome = {
            tabs: {
                query: vi.fn(() => Promise.resolve([{ id: 9, title: 'Active', windowId: 4 }])),
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
        const handler = new UIMessageHandler(imageHandler, controlManager, null, null);

        const handled = handler.handle(
            {
                action: 'INITIATE_CAPTURE',
                mode: 'snip',
                source: 'local',
            },
            {},
            vi.fn()
        );

        expect(handled).toBe(false);
        await vi.waitFor(() =>
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(9, {
                action: 'SHOW_EXTENSION_ERROR',
                message: 'Capture failed',
            })
        );
        expect(chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
            9,
            expect.objectContaining({ action: 'START_SELECTION' })
        );
    });

    it('notifies the content script when area capture fails after selection', async () => {
        const imageHandler = {
            captureArea: vi.fn(() => Promise.resolve(null)),
        };
        globalThis.chrome = {
            tabs: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();
        const handler = new UIMessageHandler(imageHandler, controlManager, null, null);

        const handled = handler.handle(
            {
                action: 'AREA_SELECTED',
                area: { x: 1, y: 2, width: 10, height: 20 },
            },
            { tab: { id: 9, windowId: 4 } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(9, {
                action: 'CROP_SCREENSHOT_FAILED',
                error: 'Capture failed',
            })
        );
        expect(sendResponse).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('reports area crop delivery failures to the selected area requester', async () => {
        const imageHandler = {
            captureArea: vi.fn(() =>
                Promise.resolve({
                    action: 'CROP_SCREENSHOT',
                    image: 'data:image/png;base64,BBBB',
                    area: { x: 1, y: 2, width: 10, height: 20 },
                })
            ),
        };
        const deliveryError = new Error('Content script unavailable');
        globalThis.chrome = {
            tabs: {
                sendMessage: vi.fn(() => Promise.reject(deliveryError)),
            },
        };
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const handler = new UIMessageHandler(imageHandler, controlManager, null, null);

        try {
            const handled = handler.handle(
                {
                    action: 'AREA_SELECTED',
                    area: { x: 1, y: 2, width: 10, height: 20 },
                },
                { tab: { id: 9, windowId: 4 } },
                sendResponse
            );

            expect(handled).toBe(true);
            await vi.waitFor(() =>
                expect(sendResponse).toHaveBeenCalledWith({
                    status: 'error',
                    error: 'Content script unavailable',
                })
            );
            expect(errorSpy).toHaveBeenCalledWith('Area capture error', deliveryError);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('reports crop forwarding failures to the content script bridge', async () => {
        const deliveryError = new Error('Side panel unavailable');
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.reject(deliveryError)),
            },
        };
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const handler = new UIMessageHandler({}, controlManager, null, null);

        try {
            const handled = handler.handle(
                {
                    action: 'PROCESS_CROP_IN_SIDEPANEL',
                    payload: {
                        action: 'CROP_SCREENSHOT',
                        image: 'data:image/png;base64,BBBB',
                    },
                    sidePanelTabId: 123,
                },
                {},
                sendResponse
            );

            expect(handled).toBe(true);
            await vi.waitFor(() =>
                expect(sendResponse).toHaveBeenCalledWith({
                    status: 'error',
                    error: 'Side panel unavailable',
                })
            );
            expect(errorSpy).toHaveBeenCalledWith('Crop forwarding error', deliveryError);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('returns fetched image results directly to extension page senders', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'FETCH_IMAGE',
                url: 'https://example.test/image.png',
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                action: 'FETCH_IMAGE_RESULT',
                base64: 'data:image/jpeg;base64,abc',
                type: 'image/jpeg',
                tabId: 123,
            })
        );
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('returns generated image results directly to extension page senders', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'FETCH_GENERATED_IMAGE',
                url: 'https://example.test/generated.png',
                reqId: 'req-1',
                sidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                action: 'GENERATED_IMAGE_RESULT',
                tabId: 123,
                reqId: 'req-1',
                base64: 'data:image/jpeg;base64,abc',
                error: undefined,
            })
        );
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('reports generated image result delivery failures to tab senders', async () => {
        const deliveryError = new Error('Content script unavailable');
        globalThis.chrome = {
            tabs: {
                sendMessage: vi.fn(() => Promise.reject(deliveryError)),
            },
        };
        const sendResponse = vi.fn();
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            const handled = handler.handle(
                {
                    action: 'FETCH_GENERATED_IMAGE',
                    url: 'https://example.test/generated.png',
                    reqId: 'req-1',
                },
                { tab: { id: 7 } },
                sendResponse
            );

            expect(handled).toBe(true);
            await vi.waitFor(() =>
                expect(sendResponse).toHaveBeenCalledWith({
                    status: 'error',
                    error: 'Content script unavailable',
                })
            );
            expect(warnSpy).toHaveBeenCalledWith(
                'Could not send UI result to request source:',
                expect.any(Error)
            );
            expect(errorSpy).toHaveBeenCalledWith('Fetch generated image error', deliveryError);
        } finally {
            warnSpy.mockRestore();
            errorSpy.mockRestore();
        }
    });

    it('proxies GWR XHR requests from Gemini page senders as response bytes', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(
                    new Response(new Uint8Array([1, 2, 3]), {
                        status: 201,
                        statusText: 'Created',
                        headers: { 'content-type': 'image/png' },
                    })
                )
            )
        );
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'GWR_EXTENSION_GM_XHR_REQUEST',
                request: {
                    method: 'POST',
                    url: 'https://lh3.googleusercontent.com/gg/sample=s0-rw',
                    headers: { 'x-test': '1' },
                    data: 'payload',
                },
            },
            { tab: { id: 7, url: 'https://gemini.google.com/app' } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                ok: true,
                finalUrl: '',
                status: 201,
                statusText: 'Created',
                headers: { 'content-type': 'image/png' },
                bytes: [1, 2, 3],
            })
        );
        expect(fetch).toHaveBeenCalledWith('https://lh3.googleusercontent.com/gg/sample=s0-rw', {
            method: 'POST',
            headers: { 'x-test': '1' },
            body: 'payload',
            credentials: 'omit',
            redirect: 'follow',
        });
        expect(imageHandler.fetchImage).not.toHaveBeenCalled();
    });

    it('allows GWR XHR requests from business Gemini page senders', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(
                    new Response(new Uint8Array([4, 5]), {
                        status: 200,
                        statusText: 'OK',
                    })
                )
            )
        );
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'GWR_EXTENSION_GM_XHR_REQUEST',
                request: { url: 'https://googleusercontent.com/generated' },
            },
            { tab: { id: 7, url: 'https://business.gemini.google/app' } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                ok: true,
                finalUrl: '',
                status: 200,
                statusText: 'OK',
                headers: {},
                bytes: [4, 5],
            })
        );
    });

    it('rejects GWR XHR requests from non-Gemini page senders', async () => {
        vi.stubGlobal('fetch', vi.fn());
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'GWR_EXTENSION_GM_XHR_REQUEST',
                request: { url: 'https://lh3.googleusercontent.com/gg/sample=s0-rw' },
            },
            { tab: { id: 7, url: 'https://example.com/' } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                ok: false,
                finalUrl: 'https://lh3.googleusercontent.com/gg/sample=s0-rw',
                status: 0,
                statusText: '',
                headers: {},
                bytes: [],
                error: 'Unsupported sender',
            })
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    it('returns GWR XHR network errors in the source-extension response shape', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('Network down')))
        );
        const sendResponse = vi.fn();

        const handled = handler.handle(
            {
                action: 'GWR_EXTENSION_GM_XHR_REQUEST',
                request: { url: 'https://lh3.googleusercontent.com/gg/sample=s0-rw' },
            },
            { tab: { id: 7, url: 'https://gemini.google.com/app' } },
            sendResponse
        );

        expect(handled).toBe(true);
        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                ok: false,
                finalUrl: 'https://lh3.googleusercontent.com/gg/sample=s0-rw',
                status: 0,
                statusText: '',
                headers: {},
                bytes: [],
                error: 'Network down',
            })
        );
    });
});
