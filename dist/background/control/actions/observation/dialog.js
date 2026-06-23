import { BaseActionHandler } from '../base.js';

export class DialogActions extends BaseActionHandler {
    async handleDialog({ action = 'accept', promptText } = {}) {
        try {
            if (action !== 'accept' && action !== 'dismiss') {
                return "Error: 'action' must be either 'accept' or 'dismiss'.";
            }

            const params = { accept: action === 'accept' };
            if (promptText !== undefined) {
                params.promptText = String(promptText);
            }

            await this.cmd('Page.handleJavaScriptDialog', params);
            this.connection.clearDialog?.();

            return action === 'accept' ? 'Accepted dialog' : 'Dismissed dialog';
        } catch (error) {
            return `Error handling dialog: ${error.message}`;
        }
    }
}
