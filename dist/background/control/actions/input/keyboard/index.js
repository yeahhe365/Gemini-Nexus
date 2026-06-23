import { BaseActionHandler } from '../../base.js';
import { handleFillElement, handleFillForm } from './fill.js';
import { handlePressKey } from './press.js';
import { handleTypeText } from './type.js';

export class KeyboardActions extends BaseActionHandler {
    async fillElement(args) {
        try {
            return await handleFillElement(this, args);
        } catch (error) {
            const uid = typeof args?.uid === 'string' ? args.uid : '';
            return `Error filling element${uid ? ` ${uid}` : ''}: ${error.message}. Call take_snapshot before retrying if the page changed.`;
        }
    }

    async fillForm(args) {
        return handleFillForm(this, args);
    }

    async pressKey(args) {
        return handlePressKey(this, args);
    }

    async typeText(args) {
        return handleTypeText(this, args);
    }
}
