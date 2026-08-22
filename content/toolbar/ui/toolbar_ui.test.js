// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ToolbarUI renderer bridge lifecycle', () => {
    let bridgeInstances;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = '';
        bridgeInstances = [];
        globalThis.GeminiNexusConfig = {
            DEFAULT_NOAUTH_MODEL: 'gemini-3.7-flash',
            DEFAULT_NOAUTH_MODELS: 'gemini-3.7-flash, gemini-3.6-flash',
        };

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
            setSelectedProvider() {}
            updateModelOptions = vi.fn();
            getSelectedModel() {
                return 'gemini-3.7-flash';
            }
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
        delete globalThis.GeminiNexusConfig;
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

    it('shows no-auth model names with Gemini 3.7 Flash first', () => {
        const ui = new window.GeminiToolbarUI();
        ui.build();

        ui.updateModelList({ provider: 'gemini_noauth' }, 'gemini-3.7-flash');

        expect(ui.view.updateModelOptions).toHaveBeenCalledWith(
            [
                { value: 'gemini-3.7-flash', label: 'gemini-3.7-flash' },
                { value: 'gemini-3.6-flash', label: 'gemini-3.6-flash' },
            ],
            'gemini-3.7-flash'
        );
    });
});
