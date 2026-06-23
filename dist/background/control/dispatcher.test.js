import { describe, expect, it, vi } from 'vitest';
import { ToolDispatcher } from './dispatcher.js';
import { BROWSER_CONTROL_PREAMBLE } from '../handlers/session/prompt/preamble.js';

describe('ToolDispatcher local tool registry', () => {
    it('only exposes core browser automation tools by default', () => {
        const coreAutomationTools = [
            'take_snapshot',
            'click',
            'fill',
            'fill_form',
            'hover',
            'press_key',
            'type_text',
            'attach_file',
            'navigate_page',
            'new_page',
            'close_page',
            'list_pages',
            'select_page',
            'wait_for',
            'handle_dialog',
            'evaluate_script',
        ];

        expect([...ToolDispatcher.LOCAL_TOOL_NAMES].sort()).toEqual(
            [...coreAutomationTools].sort()
        );
    });

    it('does not treat retired browser-control tools as local tools', () => {
        const retiredTools = [
            'run_javascript',
            'run_script',
            'start_trace',
            'stop_trace',
            'get_network_activity',
            'performance_analyze_insight',
            'emulate',
        ];

        for (const toolName of retiredTools) {
            expect(ToolDispatcher.isLocalTool(toolName)).toBe(false);
            expect(BROWSER_CONTROL_PREAMBLE).not.toContain(toolName);
        }
    });

    it('does not expose retired diagnostics tools as local browser-control tools', () => {
        const retiredDiagnosticsTools = [
            'performance_start_trace',
            'performance_stop_trace',
            'list_network_requests',
            'get_network_request',
        ];

        for (const toolName of retiredDiagnosticsTools) {
            expect(ToolDispatcher.isLocalTool(toolName)).toBe(false);
            expect(BROWSER_CONTROL_PREAMBLE).not.toContain(toolName);
        }
    });

    it('does not expose visual, debugging, or narrow interaction tools', () => {
        const nonCoreTools = ['take_screenshot', 'resize_page', 'get_logs', 'drag_element'];

        for (const toolName of nonCoreTools) {
            expect(ToolDispatcher.isLocalTool(toolName)).toBe(false);
            expect(BROWSER_CONTROL_PREAMBLE).not.toContain(toolName);
        }
    });
});

describe('ToolDispatcher includeSnapshot responses', () => {
    it('documents includeSnapshot in the browser-control prompt', () => {
        expect(BROWSER_CONTROL_PREAMBLE).toContain('"includeSnapshot": true');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('latest snapshot');
    });

    it('documents batch fill and wait tools in the browser-control prompt', () => {
        expect(BROWSER_CONTROL_PREAMBLE).toContain('fill_form');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('wait_for');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('hover');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('type_text');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('attach_file');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('handle_dialog');
    });

    it('documents browser-control tool selection strategy in the prompt', () => {
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Use fill when you have a UID and want to replace a field value.'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Use type_text only after the desired element is already focused'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Prefer includeSnapshot on supported interaction tools'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'call handle_dialog before retrying other actions'
        );
    });

    it('documents advanced browser-control prompt strategy', () => {
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Do not output multiple tool calls in one response.'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Use take_snapshot first only if no current accessibility tree is already provided.'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain('Pass DOM elements as { "uid": "..." } in args');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('{ "type": "forward" }');
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Use list_pages before select_page or close_page'
        );
    });

    it('documents browser-control recovery and scope details in the prompt', () => {
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'List controllable pages in the current controlled scope'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain('index from the latest list_pages output');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('For <select>, pass the select element UID');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('do not reuse the failed UID');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('same document');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('wait_for only waits for visible page text');
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Use evaluate_script mainly for inspection, extraction, and calculations.'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'Use press_key only when the right page or element has focus'
        );
    });

    it('documents navigation, timeout, and return-value caveats in the prompt', () => {
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'After new_page succeeds, control switches to the new page.'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'background: true opens a separate popup outside the current tab group.'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'After navigate_page or new_page, wait for expected page text'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'If an interaction returns an Error, includeSnapshot will not provide a fresh snapshot'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain(
            'If wait_for times out, take_snapshot or evaluate_script'
        );
        expect(BROWSER_CONTROL_PREAMBLE).toContain('fill_form fills fields sequentially');
        expect(BROWSER_CONTROL_PREAMBLE).toContain('do not return DOM nodes directly');
    });

    it('appends a fresh snapshot after interaction tools request one', async () => {
        const actions = {
            clickElement: vi.fn(() => Promise.resolve('Clicked element 1_2')),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 RootWebArea "Done"')),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager);

        const result = await dispatcher.dispatch('click', {
            uid: '1_2',
            includeSnapshot: true,
        });

        expect(actions.clickElement).toHaveBeenCalledWith({
            uid: '1_2',
            includeSnapshot: true,
        });
        expect(snapshotManager.takeSnapshot).toHaveBeenCalledWith();
        expect(result).toBe(
            'Clicked element 1_2\n\n## Latest page snapshot\nuid=2_1 RootWebArea "Done"'
        );
    });

    it('appends a fresh snapshot after fill_form requests one', async () => {
        const actions = {
            fillForm: vi.fn(() => Promise.resolve('Filled form (2 elements)')),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 RootWebArea "Signed in"')),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager);

        const result = await dispatcher.dispatch('fill_form', {
            elements: [
                { uid: '1_2', value: 'alice' },
                { uid: '1_3', value: 'secret' },
            ],
            includeSnapshot: true,
        });

        expect(actions.fillForm).toHaveBeenCalledWith({
            elements: [
                { uid: '1_2', value: 'alice' },
                { uid: '1_3', value: 'secret' },
            ],
            includeSnapshot: true,
        });
        expect(snapshotManager.takeSnapshot).toHaveBeenCalledWith();
        expect(result).toBe(
            'Filled form (2 elements)\n\n## Latest page snapshot\nuid=2_1 RootWebArea "Signed in"'
        );
    });

    it('does not append a snapshot when an interaction tool reports an error', async () => {
        const actions = {
            pressKey: vi.fn(() =>
                Promise.resolve("Error pressing key Meta+K: Key 'Meta+K' not supported.")
            ),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 RootWebArea')),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager);

        const result = await dispatcher.dispatch('press_key', {
            key: 'Meta+K',
            includeSnapshot: true,
        });

        expect(snapshotManager.takeSnapshot).not.toHaveBeenCalled();
        expect(result).toBe("Error pressing key Meta+K: Key 'Meta+K' not supported.");
    });

    it('appends a fresh snapshot after hover requests one', async () => {
        const actions = {
            hoverElement: vi.fn(() => Promise.resolve('Hovered element 1_2 at 10,20')),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 menu "Open"')),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager);

        const result = await dispatcher.dispatch('hover', {
            uid: '1_2',
            includeSnapshot: true,
        });

        expect(actions.hoverElement).toHaveBeenCalledWith({
            uid: '1_2',
            includeSnapshot: true,
        });
        expect(snapshotManager.takeSnapshot).toHaveBeenCalledWith();
        expect(result).toBe(
            'Hovered element 1_2 at 10,20\n\n## Latest page snapshot\nuid=2_1 menu "Open"'
        );
    });

    it('routes type_text and appends a fresh snapshot when requested', async () => {
        const actions = {
            typeText: vi.fn(() => Promise.resolve('Typed text: hello')),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 textbox "hello"')),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager);

        const result = await dispatcher.dispatch('type_text', {
            text: 'hello',
            includeSnapshot: true,
        });

        expect(actions.typeText).toHaveBeenCalledWith({
            text: 'hello',
            includeSnapshot: true,
        });
        expect(snapshotManager.takeSnapshot).toHaveBeenCalledWith();
        expect(result).toBe(
            'Typed text: hello\n\n## Latest page snapshot\nuid=2_1 textbox "hello"'
        );
    });

    it('routes attach_file and appends a fresh snapshot when requested', async () => {
        const actions = {
            attachFile: vi.fn(() =>
                Promise.resolve('Successfully attached 1 files to element 1_2.')
            ),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 button "Upload complete"')),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager);

        const result = await dispatcher.dispatch('attach_file', {
            uid: '1_2',
            paths: ['/tmp/photo.png'],
            includeSnapshot: true,
        });

        expect(actions.attachFile).toHaveBeenCalledWith({
            uid: '1_2',
            paths: ['/tmp/photo.png'],
            includeSnapshot: true,
        });
        expect(snapshotManager.takeSnapshot).toHaveBeenCalledWith();
        expect(result).toBe(
            'Successfully attached 1 files to element 1_2.\n\n## Latest page snapshot\nuid=2_1 button "Upload complete"'
        );
    });

    it('reports an open dialog instead of trying to take a snapshot after an interaction', async () => {
        const actions = {
            clickElement: vi.fn(() => Promise.resolve('Clicked element 1_2')),
        };
        const snapshotManager = {
            takeSnapshot: vi.fn(() => Promise.resolve('uid=2_1 RootWebArea')),
        };
        const connection = {
            getDialog: vi.fn(() => ({
                type: 'alert',
                message: 'Please confirm',
            })),
        };
        const dispatcher = new ToolDispatcher(actions, snapshotManager, connection);

        const result = await dispatcher.dispatch('click', {
            uid: '1_2',
            includeSnapshot: true,
        });

        expect(snapshotManager.takeSnapshot).not.toHaveBeenCalled();
        expect(result).toContain('Clicked element 1_2');
        expect(result).toContain('# Open dialog');
        expect(result).toContain('Call handle_dialog to handle it before continuing.');
    });
});

describe('ToolDispatcher wait_for responses', () => {
    it('routes wait_for to observation actions', async () => {
        const actions = {
            waitFor: vi.fn(() => Promise.resolve('Found text: Dashboard')),
        };
        const dispatcher = new ToolDispatcher(actions, {});

        const result = await dispatcher.dispatch('wait_for', {
            text: ['Dashboard', 'Home'],
            timeout: 5000,
        });

        expect(actions.waitFor).toHaveBeenCalledWith({
            text: ['Dashboard', 'Home'],
            timeout: 5000,
        });
        expect(result).toBe('Found text: Dashboard');
    });

    it('routes handle_dialog to observation actions', async () => {
        const actions = {
            handleDialog: vi.fn(() => Promise.resolve('Accepted dialog')),
        };
        const dispatcher = new ToolDispatcher(actions, {});

        const result = await dispatcher.dispatch('handle_dialog', {
            action: 'accept',
            promptText: 'ok',
        });

        expect(actions.handleDialog).toHaveBeenCalledWith({
            action: 'accept',
            promptText: 'ok',
        });
        expect(result).toBe('Accepted dialog');
    });
});
