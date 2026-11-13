import { describe, expect, it } from 'vitest';

import {
    collectProjectSourceFiles,
    readJson,
    readProjectFile,
} from './project-structure/helpers.js';

describe('project code hygiene', () => {
    it('does not export helpers that are only used inside their own module', async () => {
        const officialFunctionResponse = await readProjectFile(
            'background/handlers/session/official_function_response.js'
        );
        const uiAsync = await readProjectFile('background/handlers/ui_async.js');
        const packageExtension = await readProjectFile('scripts/package-extension.mjs');

        expect(officialFunctionResponse).not.toMatch(
            /export function createOfficialFunctionResponsePart\s*\(/
        );
        expect(uiAsync).not.toMatch(/export function createErrorResponse\s*\(/);
        expect(packageExtension).not.toMatch(/export function getLocalDependencyAssets\s*\(/);
    });

    it('does not keep orphaned legacy message actions without senders', async () => {
        const sourcePaths = [
            'background/messages.js',
            'background/handlers/ui.js',
            'content/messages.js',
            'sandbox/boot/messaging.js',
            'sandbox/controllers/message_handler.js',
        ];
        const retiredActions = [
            'CAPTURE_SCREENSHOT',
            'FOCUS_INPUT',
            'DOM_NOT_FOUND',
            'RESTORE_BROWSER_LOOP_LIMIT',
            'SET_SIDEBAR_CAPTURE_MODE',
            'TOGGLE_PAGE_CONTEXT',
            'LOG_ENTRY',
        ];

        for (const sourcePath of sourcePaths) {
            const source = await readProjectFile(sourcePath);
            for (const action of retiredActions) {
                expect(source).not.toContain(action);
            }
        }
    });

    it('does not keep controller methods that only supported retired message actions', async () => {
        const appController = await readProjectFile('sandbox/controllers/app_controller.js');

        expect(appController).not.toMatch(/\bsetPageContext\s*\(/);
    });

    it('keeps content toolbar bindings scoped to controls rendered by the content toolbar', async () => {
        const events = await readProjectFile('content/toolbar/events.js');

        expect(events).not.toContain('browser-control-btn');
    });

    it('does not keep browser-control action wrapper methods without distinct behavior', async () => {
        const baseActionHandler = await readProjectFile('background/control/actions/base.js');

        expect(baseActionHandler).not.toMatch(/\bhighlightObjectId\s*\(/);
    });

    it('does not expose content toolbar template helpers that only back the rendered template getter', async () => {
        const templates = await readProjectFile('content/toolbar/templates.js');

        expect(templates).not.toMatch(
            /window\.GeminiToolbarTemplates\s*=\s*\{[\s\S]*\bbuildMainStructure\s*,/
        );
    });

    it('keeps toolbar template and style globals descriptive', async () => {
        const templates = await readProjectFile('content/toolbar/templates.js');
        const styleIndex = await readProjectFile('content/toolbar/styles/index.js');
        const panelStyleIndex = await readProjectFile('content/toolbar/styles/panel/index.js');

        expect(templates).not.toMatch(/\b(?:function\s+\w+\s*\(\s*t\s*\)|const\s+t\s*=)/);
        expect(templates).not.toContain('<!--');
        expect(styleIndex).not.toMatch(/\bconst\s+s\s*=/);
        expect(panelStyleIndex).not.toMatch(/\bconst\s+s\s*=/);
    });

    it('does not keep content toolbar pin/dock state facades after removing the pin UI entry point', async () => {
        const files = [
            'content/toolbar/controller.js',
            'content/toolbar/view/index.js',
            'content/toolbar/view/window.js',
            'content/toolbar/view/layout.js',
        ];

        for (const file of files) {
            const source = await readProjectFile(file);
            expect(source).not.toMatch(/\b(isPinned|togglePin|isDocked)\b/);
        }
    });

    it('does not keep obsolete content toolbar HTML-mode render parameters', async () => {
        const view = await readProjectFile('content/toolbar/view/index.js');

        expect(view).not.toContain('isHtml');
    });

    it('does not keep unread content toolbar controller fields for self-bound DOM listeners', async () => {
        const toolbarUi = await readProjectFile('content/toolbar/ui/toolbar_ui.js');
        const controller = await readProjectFile('content/toolbar/controller.js');

        expect(toolbarUi).not.toContain('toolbarDragController');
        // streamHandler stays local (init-only). selectionObserver is retained
        // on `this` so destroy() can disconnect document-level listeners.
        expect(controller).not.toMatch(/\bthis\.streamHandler\s*=/);
        expect(controller).toMatch(/\bthis\.selectionObserver\s*=/);
        expect(controller).toMatch(/selectionObserver\.disconnect/);
    });

    it('does not keep CSS selectors with no runtime or template producer', async () => {
        const toolbarCoreStyles = await readProjectFile('content/toolbar/styles/core.js');
        const settingsStyles = await readProjectFile('css/settings.css');

        expect(toolbarCoreStyles).not.toContain('loading-state');
        expect(toolbarCoreStyles).not.toMatch(/\.spinner\b/);
        expect(settingsStyles).not.toContain('setting-panel-note');
    });

    it('does not keep retired content toolbar icon constants', async () => {
        const icons = await readProjectFile('content/toolbar/icons.js');

        expect(icons).not.toMatch(/\b(PIN|PIN_FILLED|BRAIN):/);
    });

    it('keeps image preview styling in the toolbar style modules', async () => {
        const imagePreview = await readProjectFile('content/toolbar/view/image_preview.js');
        const panelBodyStyles = await readProjectFile('content/toolbar/styles/panel/body.js');

        expect(imagePreview).not.toContain('style.cssText');
        expect(panelBodyStyles).toContain('.gemini-image-preview');
    });

    it('keeps style ownership out of runtime DOM builders', async () => {
        const overlay = await readProjectFile('content/overlay.js');

        expect(overlay).not.toContain('style.cssText');
    });

    it('keeps parser protocol indexes named', async () => {
        const parser = await readProjectFile('services/parser.js');

        expect(parser).toContain('PAYLOAD_CANDIDATES_INDEX');
        expect(parser).toContain('CANDIDATE_THOUGHTS_INDEX');
        expect(parser).not.toContain('payload[4]');
        expect(parser).not.toContain('firstCandidate[37]');
    });

    it('keeps TypeScript config limited to options used by this codebase', async () => {
        const tsconfig = await readJson('tsconfig.json');
        const compilerOptions = tsconfig.compilerOptions || {};
        const viteConfig = await readProjectFile('vite.config.ts');

        expect(compilerOptions.experimentalDecorators).toBeUndefined();
        expect(compilerOptions.useDefineForClassFields).toBeUndefined();
        expect(compilerOptions.jsx).toBeUndefined();
        expect(compilerOptions.allowImportingTsExtensions).toBeUndefined();
        expect(compilerOptions.paths).toBeUndefined();
        expect(viteConfig).not.toContain('alias:');
    });

    it('uses explicit catchless syntax for intentionally ignored errors', async () => {
        const sourceFiles = [
            'sidepanel/preload.js',
            'sandbox/index.html',
            'sandbox/core/i18n.js',
            'services/providers/official.js',
            'services/providers/openai_compatible.js',
            'background/handlers/session/prompt/builder.js',
            'background/handlers/session/prompt_handler.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*\}/);
        }
    });

    it('keeps dormant debug output behind debugLog instead of commented console calls', async () => {
        const sourceFiles = [
            'background/control/connection.js',
            'background/managers/keep_alive.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\/\/\s*console\.(debug|log)/);
        }
    });

    it('keeps common comments free of typo drift', async () => {
        const appBoot = await readProjectFile('sandbox/boot/app.js');
        const sharedConstants = await readProjectFile('shared/config/constants.js');

        expect(appBoot).not.toContain('Bootstapping');
        expect(sharedConstants).not.toContain(['shared', 'constants.js'].join(''));
    });

    it('keeps deprecated phrases out of hygiene test literals', async () => {
        const hygieneTest = await readProjectFile('scripts/project-code-hygiene.test.js');
        const deprecatedPhrases = [
            ['shared', 'constants.js'].join(''),
            ['New Icons', 'for AI Tools'].join(' '),
            ['Optionally', 'style error'].join(' '),
            ['Remove', 'Watermark'].join(' '),
            ['Fixing', 'grammar'].join(' '),
        ];

        for (const phrase of deprecatedPhrases) {
            const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            expect(hygieneTest.match(new RegExp(escapedPhrase, 'g')) ?? [], phrase).toHaveLength(0);
        }
    });

    it('keeps source files free of raw control characters', async () => {
        // A literal C0 byte (for example a raw U+0000 written as the start of a regex
        // range instead of the escape) makes git treat the whole file as binary, so
        // every future diff of that file becomes unreviewable.
        const sourceFiles = await collectProjectSourceFiles();

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            const controlChars = source.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g);

            expect(controlChars, sourcePath).toBeNull();
        }
    });

    it('does not keep decorative section-banner comments', async () => {
        // The repo groups code with descriptive function names instead of ruled
        // banners, so a '// --- Section ---' header is noise that goes stale silently
        // once the members under it change. Stylesheets and the CSS template strings in
        // the toolbar style modules use the `/* --- Section --- */` spelling, which the
        // line-comment form above never caught.
        const sourceFiles = await collectProjectSourceFiles();
        const stylesheetFiles = await collectProjectSourceFiles('css', /\.css$/);
        const decorativeBanner = /^\s*(?:\/\/|\/\*)\s*[-=*~_]{3,}/;

        for (const sourcePath of [...sourceFiles, ...stylesheetFiles]) {
            const source = await readProjectFile(sourcePath);
            const banner = source.split('\n').find((line) => decorativeBanner.test(line));

            expect(banner, `${sourcePath}: ${banner}`).toBeUndefined();
        }
    });

    it('does not keep redundant source path banner comments', async () => {
        const sourceFiles = await collectProjectSourceFiles();

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            const firstLine = source.split('\n')[0];

            expect(firstLine, sourcePath).not.toMatch(
                /^\/\/\s+(?=.*(?:^|[\s>])(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.(?:js|mjs|ts)\b).*$/
            );
        }
    });

    it('keeps stale placeholder comments out of toolbar and message code', async () => {
        const icons = await readProjectFile('content/toolbar/icons.js');
        const messageHandler = await readProjectFile('sandbox/controllers/message_handler.js');

        expect(icons).not.toContain(['New Icons', 'for AI Tools'].join(' '));
        expect(messageHandler).not.toContain(['Optionally', 'style error'].join(' '));
    });

    it('keeps toolbar copy labels consistent', async () => {
        const strings = await readProjectFile('content/toolbar/i18n.js');

        expect(strings).not.toContain(['Remove', 'Watermark'].join(' '));
        expect(strings).not.toContain(['Fixing', 'grammar'].join(' '));
    });

    it('uses readable model option field names in UI option builders', async () => {
        const sourceFiles = [
            'shared/models/web_models.js',
            'content/toolbar/model_options.js',
            'sandbox/ui/model_options.js',
            'sandbox/ui/ui_controller.js',
            'content/toolbar/view/index.js',
            'content/toolbar/ui/toolbar_ui.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\b(val|txt)\b/);
        }
    });

    it('uses readable setting callback value names', async () => {
        const sourceFiles = [
            'sandbox/ui/settings/view.js',
            'sandbox/ui/settings/index.js',
            'sandbox/ui/settings/sections/general.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\bval\b/);
        }
    });

    it('uses descriptive DOM variable names in UI and control code', async () => {
        const sourceFiles = [
            'background/control/actions/input/mouse.js',
            'background/control/connection.js',
            'content/toolbar/view/widget.js',
            'content/toolbar/view/window.js',
            'sandbox/boot/app.js',
            'sandbox/core/i18n.js',
            'sandbox/controllers/app_controller.js',
            'sandbox/ui/chat.js',
            'sandbox/ui/settings/sections/general.js',
            'sidepanel/core/downloads.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\b(?:const|let|var)\s+(?:btn|el)\b/);
            expect(source, sourcePath).not.toMatch(
                /(?:\((?:el|fn|cb)\)\s*=>|\.forEach\(\((?:el|fn|cb)\)\s*=>)/
            );
        }

        const chat = await readProjectFile('sandbox/ui/chat.js');
        expect(chat).not.toMatch(/\b(?:const|let|var)\s+(?:wrapper|codeEl)\b/);

        const uiDomBuilderFiles = [
            'sandbox/core/image_manager.js',
            'sandbox/ui/settings/sections/mcp_tools_view.js',
            'sandbox/ui/sidebar.js',
            'sandbox/ui/tab_selector.js',
        ];
        for (const sourcePath of uiDomBuilderFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /\b(?:const|let|var)\s+(?:emptyEl|nameEl|fullEl|descEl|delBtn|lockBtn|removeBtn)\b/
            );
        }

        const uiEventFiles = [
            'sandbox/boot/events.js',
            'sandbox/core/image_manager.js',
            'sandbox/ui/chat.js',
            'sandbox/ui/sidebar.js',
            'sandbox/ui/settings/index.js',
            'sandbox/ui/settings/view.js',
            'sandbox/ui/tab_selector.js',
        ];
        for (const sourcePath of uiEventFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /(?:\((?:e|ev)\)\s*=>|\.on\w+\s*=\s*\((?:e|ev)\)\s*=>)/
            );
        }
    });

    it('does not keep comments that only restate obvious UI section names', async () => {
        const sourceFiles = [
            'sandbox/core/image_manager.js',
            'sandbox/ui/chat.js',
            'sandbox/ui/tab_selector.js',
        ];
        const obviousComments = [
            '// Auto-resize Textarea',
            '// Code Block Copy Delegation',
            '// Toggle button between Send and Stop',
            '// Stop Icon (Square)',
            '// Send Icon (Paper plane)',
            '// File selection',
            '// Drag and Drop',
            '// Remove Button',
            '// Content',
            '// Tab Icon/Favicon',
            '// Icons',
            '// Tab Selector',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            for (const comment of obviousComments) {
                expect(source, `${sourcePath}: ${comment}`).not.toContain(comment);
            }
        }
    });

    it('uses setting-specific input classes outside the shortcut settings section', async () => {
        const sourceFiles = [
            'sandbox/ui/templates/settings/appearance.js',
            'sandbox/ui/templates/settings/connection.js',
            'sandbox/ui/templates/settings/general.js',
            'sandbox/ui/settings/sections/general.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toContain('shortcut-input settings-');
            expect(source, sourcePath).not.toContain('shortcut-input setting-panel-small-input');
        }
    });

    it('keeps tracked project guideline docs free of generator placeholders', async () => {
        const sourceFiles = [
            'docs/project-guidelines/backend-quality.md',
            'docs/project-guidelines/frontend-components.md',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toContain('(To be filled by the team)');
            expect(source, sourcePath).not.toContain("Document your project's");
        }
    });

    it('keeps retained superpowers docs aligned with current settings structure', async () => {
        const sourceFiles = [
            'docs/superpowers/specs/2026-05-20-settings-optimization-design.md',
            'docs/superpowers/plans/2026-05-20-settings-optimization-plan.md',
        ];
        const staleSnippets = [
            'css/settings_layout.test.js` -> `test/ui/settings_layout.test.js',
            'Move: `css/settings_layout.test.js` -> `test/ui/settings_layout.test.js`',
            'test/ui/settings_layout.test.js',
            'shortcut-input settings-full-input',
            'srv_${Date.now()}_${Math.random()',
            'custom-tool-${Date.now()}',
            "from './connection_utils.js'",
            'placeholder="Paste your Gemini API Key"',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            for (const snippet of staleSnippets) {
                expect(source, `${sourcePath}: ${snippet}`).not.toContain(snippet);
            }
        }
    });

    it('keeps YAML formatting readable under the project Prettier config', async () => {
        const prettierConfig = await readJson('.prettierrc');

        expect(prettierConfig.overrides).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    files: ['*.yml', '*.yaml'],
                    options: expect.objectContaining({ tabWidth: 2 }),
                }),
            ])
        );
    });

    it('keeps settings help button markup centralized', async () => {
        const templatePaths = [
            'sandbox/ui/templates/settings/connection.js',
            'sandbox/ui/templates/settings/general.js',
            'sandbox/ui/templates/settings/shortcuts.js',
        ];
        const helpButton = await readProjectFile('sandbox/ui/templates/settings/help_button.js');

        for (const sourcePath of templatePaths) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).toContain("from './help_button.js'");
            expect(source, sourcePath).not.toMatch(/\bconst HelpButtons\b/);
            expect(source, sourcePath).not.toMatch(/\bconst HelpButton\b/);
            expect(source, sourcePath).not.toContain('aria-label="Help"');
        }

        expect(helpButton).toContain('createSettingsHelpButton');
        expect(helpButton).not.toContain('aria-label="Help"');
        expect(helpButton).toContain('data-i18n-title');
    });

    it('keeps tab selector lock icons in the shared template icon registry', async () => {
        const tabSelector = await readProjectFile('sandbox/ui/tab_selector.js');
        const icons = await readProjectFile('sandbox/ui/templates/icons.js');

        expect(tabSelector).toContain('TemplateIcons.LOCK_CLOSED');
        expect(tabSelector).toContain('TemplateIcons.LOCK_OPEN');
        expect(tabSelector).not.toContain('const CLOSED_LOCK');
        expect(tabSelector).not.toContain('const OPEN_LOCK');
        expect(icons).toContain('LOCK_CLOSED');
        expect(icons).toContain('LOCK_OPEN');
    });

    it('keeps sandbox UI SVG icons in the shared template icon registry', async () => {
        const sourceFiles = [
            'sandbox/render/config.js',
            'sandbox/render/context_compression.js',
            'sandbox/render/copy_button.js',
            'sandbox/render/message_edit.js',
            'sandbox/ui/chat.js',
        ];
        const icons = await readProjectFile('sandbox/ui/templates/icons.js');

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).toContain('TemplateIcons');
            expect(source, sourcePath).not.toContain('<svg');
            expect(source, sourcePath).not.toMatch(/\b(?:copyIcon|EDIT_ICON|SAVE_ICON)\b/);
        }

        for (const iconName of ['CHECK', 'COPY', 'EDIT', 'SEND', 'STOP', 'SUMMARY']) {
            expect(icons).toContain(`${iconName}:`);
        }
    });

    it('uses descriptive event parameter names in content pointer handlers', async () => {
        const sourceFiles = ['content/selection.js', 'content/overlay.js'];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /\b(?:onMouseDown|onMouseMove|onMouseUp|onKeyDown|onClick|scheduleSelectionCheck|getEventPoint)\s*\(\s*e\s*\)/
            );
        }
    });

    it('uses descriptive cache and response names in sidepanel state and auth helpers', async () => {
        const sidepanelState = await readProjectFile('sidepanel/core/state.js');
        const sidepanelStateMessages = await readProjectFile('sidepanel/core/state_messages.js');
        const auth = await readProjectFile('services/auth.js');

        expect(sidepanelState).toContain('localStorageData');
        expect(sidepanelState).toContain('sessionStorageData');
        expect(sidepanelState).not.toContain('this.data');
        expect(sidepanelState).not.toContain('this.sessionData');
        expect(sidepanelStateMessages).toContain('localStorageData');
        expect(sidepanelStateMessages).not.toMatch(/\bfunction\s+\w+\s*\(\s*data\b/);
        expect(auth).not.toMatch(/\bconst\s+resp\b/);
    });

    it('uses descriptive stream payload and settings error names', async () => {
        const sourceFiles = [
            'background/control/connection.js',
            'background/handlers/ui_tab_actions.js',
            'background/managers/mcp/connection_client.js',
            'background/managers/mcp/streamable_http.js',
            'background/managers/mcp/sse_stream.js',
            'sandbox/controllers/app_controller.js',
            'sandbox/controllers/session_flow.js',
            'sandbox/core/session_manager.js',
            'sandbox/ui/settings/github_metadata.js',
            'sandbox/ui/settings/index.js',
            'sandbox/ui/settings/view.js',
            'services/providers/sse.js',
            'services/providers/web.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /\b(?:const|let)\s+(?:data|msg|err)\b|\(\s*(?:msg|err)\s*(?:[,)]|=>)/
            );
        }
    });

    it('uses descriptive callback names in session and settings collection code', async () => {
        const sessionCollectionFiles = [
            'background/managers/history_manager.js',
            'background/managers/session/history_store.js',
            'sandbox/core/session_manager.js',
        ];

        for (const sourcePath of sessionCollectionFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\.(?:find|findIndex|filter)\(\(s\)\s*=>/);
        }

        const sessionManager = await readProjectFile('sandbox/core/session_manager.js');
        expect(sessionManager).not.toMatch(/\.sort\(\(a,\s*b\)\s*=>/);

        const settingsView = await readProjectFile('sandbox/ui/settings/view.js');
        expect(settingsView).not.toMatch(/\.forEach\(\((?:t|s)\)\s*=>/);

        const sidebar = await readProjectFile('sandbox/ui/sidebar.js');
        expect(sidebar).not.toMatch(/\.map\(\(r\)\s*=>/);
    });

    it('uses descriptive callback names in MCP server collection code', async () => {
        const sourceFiles = [
            'background/handlers/session/prompt/builder.js',
            'background/handlers/session/prompt/tool_executor.js',
            'background/managers/mcp_remote_manager.js',
            'sandbox/controllers/prompt.js',
            'sandbox/ui/settings/sections/connection.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /\.(?:some|find|filter|map)\(\((?:s|t|m)\)\s*=>/
            );
        }
    });

    it('uses descriptive callback names in account and model list parsing', async () => {
        const sourceFiles = [
            'background/managers/auth_manager.js',
            'background/managers/session/settings_store.js',
            'services/providers/official.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\.(?:map|filter)\(\((?:s|m|k)\)\s*=>/);
        }
    });

    it('uses descriptive provider history and RPC message names', async () => {
        const sourceFiles = [
            'background/managers/mcp/rpc_messages.js',
            'services/providers/official.js',
            'services/providers/openai_compatible.js',
            'services/providers/openai_payloads.js',
            'services/providers/web.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toContain('JSON.stringify(data)');
            expect(source, sourcePath).not.toMatch(/\bmsg\b/);
            expect(source, sourcePath).not.toMatch(/\(\s*data\s*\)\s*=>/);
            expect(source, sourcePath).not.toMatch(/\(\s*img\s*\)\s*=>/);
        }
    });

    it('uses descriptive settings payload names across settings helpers', async () => {
        const sourceFiles = [
            'settings/bridge.js',
            'shared/messaging/index.js',
            'shared/settings/connection.js',
            'shared/settings/openai.js',
            'sandbox/ui/settings/index.js',
            'sandbox/ui/settings/index.test.js',
            'sandbox/ui/settings/settings_save.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /\b(?:function|export function|async function)\s+\w+\s*\(\s*data\b/
            );
            expect(source, sourcePath).not.toMatch(/\(\s*data\s*\)\s*=>/);
            expect(source, sourcePath).not.toMatch(/\b(?:const|let|var)\s+data\b/);
        }

        const settingsBridge = await readProjectFile('settings/bridge.js');
        expect(settingsBridge).not.toContain('const result = await getLocalStorageData');
    });

    it('uses descriptive payload and image names in toolbar dispatch actions', async () => {
        const dispatcher = await readProjectFile('content/toolbar/dispatch.js');

        expect(dispatcher).not.toMatch(/\bdispatch\s*\(\s*actionType,\s*data\b/);
        expect(dispatcher).not.toMatch(/\bconst\s+(?:img|imgUrl|rect)\b/);
        expect(dispatcher).not.toMatch(/\bcatch\s*\(\s*err\s*\)/);
    });

    it('uses descriptive image element names in generated image UI code', async () => {
        const sourceFiles = [
            'content/toolbar/image.js',
            'content/toolbar/ui/renderer.js',
            'sandbox/controllers/message_results.js',
            'sandbox/render/generated_image.js',
        ];
        const redundantComments = [
            'Bind method for event listeners',
            'Default to enabled, but actual state set via setEnabled',
            'Hide immediately',
            'Loading Placeholder',
            'Request Background Fetch',
            'Click to view full size',
            'Execute fetch tasks',
            'Send message to background to fetch actual image',
            'Export to Window',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\bconst\s+(?:img|reqId)\b/);
            expect(source, sourcePath).not.toMatch(/\bonImageHover\s*\(\s*e\s*\)/);
            expect(source, sourcePath).not.toMatch(/\binit\s*\(\s*\)\s*\{\s*\}/);

            for (const comment of redundantComments) {
                expect(source, `${sourcePath}: ${comment}`).not.toContain(comment);
            }
        }

        const toolbarController = await readProjectFile('content/toolbar/controller.js');
        expect(toolbarController).not.toContain('this.imageDetector.init()');
    });

    it('uses descriptive image element names in UI image builders', async () => {
        const sourceFiles = [
            'sandbox/core/image_manager.js',
            'sandbox/render/message_media.js',
            'sandbox/ui/tab_selector.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\bconst\s+img\b/);
            expect(source, sourcePath).not.toMatch(/\(\s*img\s*\)\s*=>/);
        }
    });

    it('uses descriptive canvas and render pipeline names in image helpers', async () => {
        const imageHelpers = ['shared/dom/crop_global.js', 'shared/media/watermark_remover.js'];

        for (const sourcePath of imageHelpers) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\b(?:const|let|var)\s+(?:ctx|img)\b/);
            expect(source, sourcePath).not.toMatch(/\bfunction\s+\w+\s*\(\s*ctx\b/);
        }

        const toolbarRenderer = await readProjectFile('content/toolbar/ui/renderer.js');
        expect(toolbarRenderer).not.toMatch(/\blet\s+(?:html|tasks)\b/);
        expect(toolbarRenderer).not.toContain('const result = await this.bridge.render');
        expect(toolbarRenderer).not.toContain('Pass to view');
    });

    it('uses a descriptive root element name in message rendering', async () => {
        const messageRenderer = await readProjectFile('sandbox/render/message.js');

        expect(messageRenderer).toContain('messageElement');
        expect(messageRenderer).not.toContain('const div = document.createElement');
        expect(messageRenderer).not.toContain('messageEl: div');
    });

    it('uses descriptive DOM root names in small UI builders', async () => {
        const contextCompression = await readProjectFile('sandbox/render/context_compression.js');
        const mcpToolsView = await readProjectFile(
            'sandbox/ui/settings/sections/mcp_tools_view.js'
        );

        expect(contextCompression).toContain('noticeElement');
        expect(contextCompression).not.toContain('const div = document.createElement');
        expect(mcpToolsView).toContain('helpTextElement');
        expect(mcpToolsView).not.toContain('const div = document.createElement');
    });

    it('uses descriptive sort callback names in settings and source helpers', async () => {
        const sourceFiles = [
            'shared/mcp/transport.js',
            'sandbox/render/sources.js',
            'sandbox/ui/settings/sections/connection.js',
            'sandbox/ui/settings/sections/mcp_tools_view.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(/\.sort\(\(a,\s*b\)\s*=>/);
        }
    });

    it('keeps toolbar view DOM lookup and section labels descriptive', async () => {
        const toolbarView = await readProjectFile('content/toolbar/view/index.js');
        const lowInformationLabels = [
            'New Window Elements',
            'Footer Elements',
            'Buttons',
            'Image Menu Buttons',
            'Image Edit Buttons',
            'Delegation to Widget View',
            'Delegation to Window View',
            'Model Selection',
            'General',
        ];

        expect(toolbarView).not.toContain('const get = (id)');
        expect(toolbarView).toContain('getToolbarElement');
        for (const label of lowInformationLabels) {
            expect(toolbarView, label).not.toContain(label);
        }
    });

    it('uses descriptive restored model state names in boot messaging', async () => {
        const messaging = await readProjectFile('sandbox/boot/messaging.js');

        expect(messaging).toContain('previousModelValue');
        expect(messaging).not.toContain('const prev =');
    });

    it('keeps low-information narration comments out of UI flow code', async () => {
        const sourceFiles = [
            'background/index.js',
            'background/managers/image_manager.js',
            'background/managers/auth_manager.js',
            'background/managers/control_manager.js',
            'background/managers/history_manager.js',
            'background/managers/keep_alive.js',
            'background/managers/log_manager.js',
            'background/managers/session_manager.js',
            'background/managers/session/settings_store.js',
            'background/managers/session/request_dispatcher.js',
            'background/control/action_waiter.js',
            'background/control/snapshot/index.js',
            'background/handlers/session/prompt/tool_executor.js',
            'background/handlers/ui.js',
            'content/index.js',
            'content/messages.js',
            'content/toolbar/i18n.js',
            'content/toolbar/stream.js',
            'content/toolbar/ui/grammar.js',
            'content/toolbar/view/index.js',
            'content/toolbar/view/window.js',
            'background/menus.js',
            'sandbox/boot/renderer.js',
            'sandbox/boot/messaging.js',
            'sandbox/controllers/app_controller.js',
            'sandbox/controllers/message_handler.js',
            'sandbox/controllers/prompt.js',
            'sandbox/controllers/session_flow.js',
            'sandbox/core/session_manager.js',
            'sandbox/render/message.js',
            'sandbox/render/content.js',
            'sandbox/ui/chat.js',
            'sandbox/ui/sidebar.js',
            'sandbox/ui/settings/view.js',
            'sandbox/ui/ui_controller.js',
            'services/parser.js',
            'services/providers/web.js',
            'services/providers/official.js',
        ];
        const redundantComments = [
            'Setup Console Interception',
            'Setup Sidepanel',
            'Initialize Advanced Keep-Alive',
            'Initialize LogManager',
            'Initialize Managers',
            'Initialize Modules',
            'Add Current Prompt',
            'Add System Instruction if present',
            'Fetch History',
            'Show/Hide the tab switcher in header',
            'Update UI settings panel',
            'Restore Sessions',
            'Tab list response',
            'Tab Locked Notification',
            'Page Context Check Result',
            'Pass other messages to message bridge handler',
            'Tab switching logic for the split settings layout',
            'Update tab title and i18n',
            'Reset to the connection tab on open',
            'Delegation to Shortcuts',
            'Delegation to Appearance',
            'Delegation to General',
            'Delegation to Connection',
            'Delegation to About',
            'Delegation to Sub-Controllers',
            'Event Handling',
            'If forceState is provided, match it. Otherwise toggle.',
            'Disable page context if browser control is on',
            'For now, keeping them independent.',
            'Add to top',
            'Update context',
            'Lazy Init Fuse',
            'Cache data for searching',
            'Reset Fuse index as data changed',
            'Check if there is an active search query',
            'Reset height only once',
            'Bind Escape key event listener safely',
            'Safely unbind Escape key event listener',
            'If deleted current session, return true to signal a switch is needed',
            'Clean text (remove newlines) for display',
            'Handle attachments based on role',
            'AI generated images',
            'Store image array if present',
            'Add unique images.',
            'Ensure alarm is set up',
            'Add listener (ensure single binding)',
            'Perform initial check immediately on load',
            'Export singleton instance',
            'Load indices',
            'Load last pointer',
            'Handle API Key Rotation',
            'Reset pointer if out of bounds',
            'Advance pointer for next call',
            'Trim single key just in case',
            'Context management',
            'Store current text state',
            'Dynamic Model Selection',
            'Explicit Mapping logic',
            'Handle locally',
            'Fetch image from a URL or Data URI',
            'Convert blob to base64',
            'Internal helper for capturing visible tab',
            'Capture the visible tab and return base64',
            'Used when content script selects an area',
            'Return data to UI for cropping',
            'Handle Context Menu Clicks',
            'Process line-by-line',
            'Process remaining buffer',
            'Render Markdown and Math for AI responses',
            'Use shared pipeline',
            'Process KaTeX if available',
            'Loading Messages',
            '// Settings',
            'Dependencies (Loaded via manifest order)',
            'Initialize Helpers',
            'Initialize Router',
            'Link Shortcuts',
            'Initialize Message Handler',
            'Initialize Sub-Controllers',
            'Initialize Sub-Views',
            'Settings and Viewer now self-manage their DOM',
            'Properties exposed for external use',
            'Initialize Layout Detection',
            'Dynamic Model List',
            'Update result in real-time',
            'Finished, pass isStreaming = false',
            'Pass result.images array',
            'If result is null',
            'Export to Window',
            'Bind immediately',
            'Check if MCP is enabled',
            'Check if this is a multi-server tool ID',
            'Multi-server mode: route by tool ID',
            'Default to first option',
            'Dispatch change to update app state',
            '--- Delegation Methods ---',
            'Queue messages until app is ready',
            'Safety check: if invalid model, fallback',
            'Force index 0 if still invalid',
            'Forward general messages to App Controller',
            'Pass msg.thoughts to appendMessage',
            'Update Title if needed',
            'Render User Message',
            "If we don't have a bubble yet, create one",
            'Update content if text or thoughts exist',
            'Ensure UI state reflects generation',
            'Reset Content',
            'Hide Footer initially',
            'Show Footer with Stop button',
            'Only auto-scroll to bottom during streaming',
            'Content is now always HTML rendered via Bridge',
            'Ensure Footer is visible',
            'Empty and not streaming',
            'Finished: Scroll to top',
            'Reset Copy Icon',
            'Show Footer with Actions',
            '--- IMAGE FETCHING (USER INPUT) ---',
            '--- IMAGE FETCHING (GENERATED DISPLAY) ---',
            '--- SIDEPANEL & SELECTION ---',
            '--- PAGE CONTEXT CHECK ---',
            '--- MCP (External Tools) ---',
            '--- TAB MANAGEMENT ---',
            '--- BROWSER CONTROL TOGGLE ---',
            '--- Thinking Process (Optional) ---',
            '--- Scroll Logic ---',
            '--- AI Prompts (Centralized) ---',
            'Image Actions',
            '--- View Manipulation ---',
            'Control Lifecycle',
            'Internal Helpers',
            'Execution Entry Point',
            'SW Lifecycle Persistence',
            'Console Interception Helper',
            'Prune if too large',
            'Normalize files',
            'Handle common user-facing errors',
            'Delegate to dispatcher',
            'Upload in parallel',
            'Start observing',
            'Clear maps',
            'Increment Snapshot ID',
            'Map console level to LogManager level',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            for (const comment of redundantComments) {
                expect(source, `${sourcePath}: ${comment}`).not.toContain(comment);
            }
        }
    });

    it('keeps settings element lookup helper centralized', async () => {
        const sourceFiles = [
            'sandbox/ui/settings/view.js',
            'sandbox/ui/settings/sections/about.js',
            'sandbox/ui/settings/sections/appearance.js',
            'sandbox/ui/settings/sections/connection.js',
            'sandbox/ui/settings/sections/general.js',
            'sandbox/ui/settings/sections/shortcuts.js',
        ];
        const helper = await readProjectFile('sandbox/ui/settings/dom.js');

        expect(helper).toContain('getSettingsElement');

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).toContain('getSettingsElement');
            expect(source, sourcePath).not.toContain(
                'const get = (id) => document.getElementById(id);'
            );
        }
    });

    it('keeps transitional settings schema comments out of stable UI code', async () => {
        const sourceFiles = [
            'sandbox/ui/settings/index.js',
            'sandbox/ui/settings/sections/connection.js',
        ];
        const transitionalComments = [
            'Legacy support',
            'Servers list (preferred)',
            'Legacy single server fields',
            'backward compatibility but',
            'Legacy fields for single-server backward compatibility',
            'Legacy compat:',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            for (const comment of transitionalComments) {
                expect(source, `${sourcePath}: ${comment}`).not.toContain(comment);
            }
        }
    });

    it('does not duplicate localized placeholder text in templates', async () => {
        const sourceFiles = [
            'sandbox/ui/templates/footer.js',
            'sandbox/ui/templates/sidebar.js',
            'sandbox/ui/templates/settings/connection.js',
            'sandbox/ui/templates/settings/general.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).not.toMatch(
                /(?:data-i18n-placeholder="[^"]+"[^>]*\splaceholder=|\splaceholder=(?:"[^"]*"|'[^']*')[^>]*data-i18n-placeholder=)/
            );
        }
    });

    it('keeps tool render DOM lookup helpers out of MessageHandler', async () => {
        const handler = await readProjectFile('sandbox/controllers/message_handler.js');
        const toolMessages = await readProjectFile('sandbox/controllers/message_tool_messages.js');

        expect(handler).toContain("from './message_tool_messages.js'");
        expect(handler).not.toContain("from './message_tool_render_state.js'");
        expect(toolMessages).toContain("from './message_tool_render_state.js'");
        expect(handler).not.toMatch(/^\s{4}hasRenderedToolOutput\s*\(/m);
        expect(handler).not.toMatch(/^\s{4}findRenderedToolStatus\s*\(/m);
        expect(handler).not.toMatch(/^\s{4}removeRenderedToolStatus\s*\(/m);
    });

    it('keeps generated image request IDs centralized', async () => {
        const sourceFiles = ['sandbox/render/generated_image.js', 'sandbox/boot/renderer.js'];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).toContain('createPrefixedId');
            expect(source, sourcePath).not.toContain('Date.now()');
            expect(source, sourcePath).not.toContain('Math.random()');
            expect(source, sourcePath).not.toContain('.substr(');
        }
    });

    it('keeps DOM and settings correlation IDs centralized', async () => {
        const sourceFiles = [
            'content/toolbar/bridge.js',
            'sandbox/render/content.js',
            'sandbox/render/thoughts_block.js',
            'sandbox/ui/settings/sections/connection.js',
            'sandbox/ui/settings/sections/general.js',
            'shared/settings/connection.js',
        ];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).toContain('createPrefixedId');
            expect(source, sourcePath).not.toMatch(/Date\.now\(\)[\s\S]{0,80}Math\.random\(\)/);
            expect(source, sourcePath).not.toContain('custom-tool-${Date.now()}');
        }
    });

    it('keeps model select width measurement in the shared UI helper', async () => {
        const sourceFiles = ['sandbox/boot/input_events.js', 'sandbox/ui/ui_controller.js'];

        for (const sourcePath of sourceFiles) {
            const source = await readProjectFile(sourcePath);
            expect(source, sourcePath).toContain('resizeSelectToSelectedOption');
            expect(source, sourcePath).not.toContain("document.createElement('span')");
            expect(source, sourcePath).not.toContain('getBoundingClientRect().width');
        }
    });

    it('keeps sidepanel download anchor triggering centralized', async () => {
        const downloads = await readProjectFile('sidepanel/core/downloads.js');

        expect(downloads).toContain('triggerDownload');
        expect(downloads).toContain('downloadLink');
        expect(downloads).not.toMatch(/\bconst\s+a\s*=/);
        expect(downloads.match(/document\.createElement\('a'\)/g) ?? []).toHaveLength(1);
        expect(downloads.match(/document\.body\.appendChild\(/g) ?? []).toHaveLength(1);
        expect(downloads.match(/document\.body\.removeChild\(/g) ?? []).toHaveLength(1);
    });

    it('uses descriptive fallback UUID names and the vendored Gemini watermark runtime wrapper', async () => {
        const utils = await readProjectFile('shared/utils/id_global.js');
        const watermarkRemover = await readProjectFile('shared/media/watermark_remover_global.js');

        // index.js only forwards these two helpers, so the naming guard belongs
        // on the module that owns the fallback generator.
        expect(utils).toContain('randomNibble');
        expect(utils).toContain('uuidNibble');
        expect(utils).not.toMatch(/\.replace\(\s*\/\[xy\]\/g,\s*\(c\)\s*=>/);
        expect(utils).not.toMatch(/\bconst\s+(?:r|v)\s*=/);

        expect(watermarkRemover).toContain('__gwrPageProcessRuntimeInstalled__');
        expect(watermarkRemover).toContain('removeWatermarkFromBlob');
        expect(watermarkRemover).not.toContain('redTotal');
        expect(watermarkRemover).not.toContain('watermarkX');
        expect(watermarkRemover).not.toContain('SAMPLE_SIZE');
        expect(watermarkRemover).not.toContain('fillRect');
    });
});

describe('project stylesheet hygiene', () => {
    it('declares every custom property the stylesheets reference', async () => {
        // An unresolved var() silently drops the declaration, so a renamed or
        // deleted token fails visually instead of failing loudly. References that
        // carry their own fallback (var(--x, 140px)) are intentional and skipped.
        const { readdir } = await import('node:fs/promises');
        const cssDir = new URL('../css/', import.meta.url);
        const entries = await readdir(cssDir, { withFileTypes: true });
        const stylePaths = entries
            .filter((e) => e.isFile() && e.name.endsWith('.css'))
            .map((e) => `css/${e.name}`);

        const styles = await Promise.all(stylePaths.map((p) => readProjectFile(p)));
        const declared = new Set();
        for (const style of styles) {
            for (const match of style.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
        }

        for (const [index, style] of styles.entries()) {
            // Only references without an inline fallback depend on the declaration.
            for (const match of style.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/g)) {
                expect(declared.has(match[1]), `${stylePaths[index]}: ${match[1]}`).toBe(true);
            }
        }
    });
});
