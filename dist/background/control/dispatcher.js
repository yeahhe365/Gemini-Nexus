/**
 * Maps string tool names to executable actions.
 * Decouples logic from the main ControlManager.
 */
export class ToolDispatcher {
    static DEBUGGER_OPTIONAL_TOOL_NAMES = new Set([
        'navigate_page',
        'new_page',
        'close_page',
        'list_pages',
        'select_page',
    ]);

    static LOCAL_TOOL_NAMES = new Set([
        // Navigation
        'navigate_page',
        'new_page',
        'close_page',
        'list_pages',
        'select_page',

        // Interaction
        'click',
        'hover',
        'fill',
        'fill_form',
        'press_key',
        'type_text',
        'attach_file',

        // Observation & Logic
        'take_snapshot',
        'wait_for',
        'handle_dialog',
        'evaluate_script',
    ]);

    static SNAPSHOT_OPTIONAL_TOOL_NAMES = new Set([
        'click',
        'hover',
        'fill',
        'fill_form',
        'press_key',
        'type_text',
        'attach_file',
    ]);

    static isLocalTool(name) {
        return ToolDispatcher.LOCAL_TOOL_NAMES.has(name);
    }

    static requiresDebugger(name) {
        return !ToolDispatcher.DEBUGGER_OPTIONAL_TOOL_NAMES.has(name);
    }

    constructor(actions, snapshotManager, connection = null) {
        this.actions = actions;
        this.snapshotManager = snapshotManager;
        this.connection = connection;
    }

    getOpenDialogText() {
        const dialog = this.connection?.getDialog?.();
        if (!dialog) return '';

        const defaultValue =
            dialog.type === 'prompt' && dialog.defaultPrompt
                ? ` (default value: "${dialog.defaultPrompt}")`
                : '';
        return `# Open dialog\n${dialog.type}: ${dialog.message}${defaultValue}.\nCall handle_dialog to handle it before continuing.`;
    }

    maybeAppendDialogHint(name, result) {
        if (name === 'handle_dialog' || typeof result !== 'string') return result;

        const dialogText = this.getOpenDialogText();
        if (!dialogText || result.includes('# Open dialog')) return result;

        return `${result}\n\n${dialogText}`;
    }

    async maybeAppendSnapshot(name, args, result) {
        if (
            !ToolDispatcher.SNAPSHOT_OPTIONAL_TOOL_NAMES.has(name) ||
            args?.includeSnapshot !== true ||
            typeof result !== 'string' ||
            result.startsWith('Error')
        ) {
            return result;
        }

        const dialogText = this.getOpenDialogText();
        if (dialogText) {
            return `${result}\n\n${dialogText}`;
        }

        const snapshot = await this.snapshotManager.takeSnapshot();
        return `${result}\n\n## Latest page snapshot\n${snapshot}`;
    }

    async dispatch(name, args) {
        let result;
        switch (name) {
            // Navigation
            case 'navigate_page':
                result = await this.actions.navigatePage(args);
                break;
            case 'new_page':
                result = await this.actions.newPage(args);
                break;
            case 'close_page':
                result = await this.actions.closePage(args);
                break;
            case 'list_pages':
                result = await this.actions.listPages();
                break;
            case 'select_page':
                result = await this.actions.selectPage(args);
                break;

            // Interaction
            case 'click':
                result = await this.actions.clickElement(args);
                break;
            case 'hover':
                result = await this.actions.hoverElement(args);
                break;
            case 'fill':
                result = await this.actions.fillElement(args);
                break;
            case 'fill_form':
                result = await this.actions.fillForm(args);
                break;
            case 'press_key':
                result = await this.actions.pressKey(args);
                break;
            case 'type_text':
                result = await this.actions.typeText(args);
                break;
            case 'attach_file':
                result = await this.actions.attachFile(args);
                break;

            // Observation & Logic
            case 'take_snapshot':
                result = await this.snapshotManager.takeSnapshot(args);
                break;
            case 'wait_for':
                result = await this.actions.waitFor(args);
                break;
            case 'handle_dialog':
                result = await this.actions.handleDialog(args);
                break;
            case 'evaluate_script':
                result = await this.actions.evaluateScript(args);
                break;

            default:
                return `Error: Unknown tool '${name}'`;
        }

        result = await this.maybeAppendSnapshot(name, args, result);
        return this.maybeAppendDialogHint(name, result);
    }
}
