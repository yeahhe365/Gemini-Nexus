// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ToolbarUI renderer bridge lifecycle', () => {
    let bridgeInstances;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = '';
        bridgeInstances = [];

        window.GeminiToolbarDOM = class {
            create() {
                const host = document.createElement('div');
                host.id = 'gemini-nexus-toolbar-host';
                document.body.appendChild(host);
                const shadow = host.attachShadow({ mode: 'open' });
                this.host = host;
                this.shadow = shadow;
                return { host, shadow };
            }

            rerender() {
                if (!this.shadow) return;
                this.shadow.innerHTML = '';
            }
        };

        window.GeminiToolbarView = class {
            constructor(shadow) {
                this.shadow = shadow;
                this.elements = {
                    askWindow: document.createElement('div'),
                    askHeader: document.createElement('div'),
                    toolbar: document.createElement('div'),
                    toolbarDrag: document.createElement('div'),
                };
            }

            setSelectedTranslationTargets() {}
        };

        window.GeminiUIGrammar = class {
            constructor() {}
        };

        window.GeminiRendererBridge = class {
            constructor(host) {
                this.host = host;
                this.destroyed = false;
                bridgeInstances.push(this);
            }

            destroy() {
                this.destroyed = true;
            }
        };

        window.GeminiUIRenderer = class {
            constructor(view, bridge) {
                this.view = view;
                this.bridge = bridge;
            }
        };

        window.GeminiToolbarUIActions = class {
            constructor() {}
        };

        window.GeminiCodeCopyHandler = class {
            constructor() {}
        };

        window.GeminiCustomSelectionToolsUI = class {
            constructor() {}
            render() {}
            getTools() {
                return [];
            }
            setTools() {}
        };

        window.GeminiTranslationTargetStore = class {
            getTargets() {
                return ['auto'];
            }
            setTargets(targets) {
                return targets;
            }
            restore() {
                return Promise.resolve(['auto']);
            }
            normalizeTargets() {}
        };

        window.GeminiDragController = class {
            constructor() {}
        };

        window.GeminiToolbarEvents = class {
            bind() {}
            disconnect() {}
        };

        window.GeminiViewLayout = {
            rememberOffsetFromDrag() {},
            resetOffset() {},
        };

        window.GeminiNexusWebModelCatalog = {
            DEFAULT_WEB_MODEL: '56fdd199312815e2',
            createWebModelOptions: () => [
                { value: '56fdd199312815e2', label: '4 Hydrogen' },
                { value: 'argon', label: '4 Argon' },
            ],
            normalizeWebModel: (model) =>
                ({ '95a4c0abcba24364': 'argon' })[model] || model || '56fdd199312815e2',
        };
        window.GeminiWebModels = {
            DEFAULT_WEB_MODEL: '56fdd199312815e2',
            createOptions: () => window.GeminiNexusWebModelCatalog.createWebModelOptions(),
            normalizeModel: (model) => window.GeminiNexusWebModelCatalog.normalizeWebModel(model),
        };

        await import('./toolbar_ui.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        delete window.GeminiToolbarUI;
        delete window.GeminiToolbarDOM;
        delete window.GeminiToolbarView;
        delete window.GeminiUIGrammar;
        delete window.GeminiRendererBridge;
        delete window.GeminiUIRenderer;
        delete window.GeminiToolbarUIActions;
        delete window.GeminiCodeCopyHandler;
        delete window.GeminiCustomSelectionToolsUI;
        delete window.GeminiTranslationTargetStore;
        delete window.GeminiDragController;
        delete window.GeminiToolbarEvents;
        delete window.GeminiViewLayout;
        delete window.GeminiNexusWebModelCatalog;
        delete window.GeminiWebModels;
    });

    it('creates a Markdown renderer bridge on first build', () => {
        const ui = new window.GeminiToolbarUI();
        ui.build();

        expect(bridgeInstances).toHaveLength(1);
        expect(bridgeInstances[0].destroyed).toBe(false);
        expect(ui.bridge).toBe(bridgeInstances[0]);
        expect(ui.renderer.bridge).toBe(bridgeInstances[0]);
    });

    it('recreates the Markdown renderer bridge after language rebuild', () => {
        const ui = new window.GeminiToolbarUI();
        ui.build();
        const firstBridge = bridgeInstances[0];

        ui.rebuildForLanguageChange();

        expect(firstBridge.destroyed).toBe(true);
        expect(bridgeInstances).toHaveLength(2);
        expect(bridgeInstances[1].destroyed).toBe(false);
        expect(ui.bridge).toBe(bridgeInstances[1]);
        expect(ui.renderer.bridge).toBe(bridgeInstances[1]);
    });

    it('coalesces rapid window-size saves into one trailing write', () => {
        vi.useFakeTimers();
        const set = vi.fn(() => Promise.resolve());
        globalThis.chrome = { storage: { local: { set } } };
        try {
            const ui = new window.GeminiToolbarUI();

            ui.saveWindowDimensions(100, 100);
            ui.saveWindowDimensions(200, 200);
            ui.saveWindowDimensions(640, 520);
            expect(set).not.toHaveBeenCalled();

            vi.advanceTimersByTime(300);

            expect(set).toHaveBeenCalledTimes(1);
            expect(set).toHaveBeenCalledWith({ gemini_nexus_window_size: { w: 640, h: 520 } });
        } finally {
            vi.useRealTimers();
            delete globalThis.chrome;
        }
    });

    it('flushes the pending window size on dispose', () => {
        const set = vi.fn(() => Promise.resolve());
        globalThis.chrome = { storage: { local: { set } } };
        try {
            const ui = new window.GeminiToolbarUI();

            ui.saveWindowDimensions(640, 520);
            expect(set).not.toHaveBeenCalled();

            ui.flushWindowDimensions();

            expect(set).toHaveBeenCalledTimes(1);
            expect(set).toHaveBeenCalledWith({ gemini_nexus_window_size: { w: 640, h: 520 } });
        } finally {
            delete globalThis.chrome;
        }
    });

    it('restores a saved Web hash using the current catalog value', () => {
        const ui = Object.create(window.GeminiToolbarUI.prototype);
        ui.view = {
            elements: {},
            getSelectedModel: () => 'argon',
            setSelectedProvider: vi.fn(),
            updateModelOptions: vi.fn(),
        };

        ui.updateModelList({ provider: 'web' }, '95a4c0abcba24364');

        expect(ui.view.updateModelOptions).toHaveBeenCalledWith(
            [
                { value: '56fdd199312815e2', label: '4 Hydrogen' },
                { value: 'argon', label: '4 Argon' },
            ],
            'argon'
        );
    });
});
