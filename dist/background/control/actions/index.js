import { NavigationActions } from './navigation.js';
import { InputActions } from './input/index.js';
import { ObservationActions } from './observation/index.js';
import { ActionWaiter } from '../action_waiter.js';

/**
 * Facade class that aggregates specific action modules.
 */
export class BrowserActions {
    constructor(connection, snapshotManager, groupContext = {}) {
        // Share one action waiter so navigation and input actions observe the same CDP stream.
        this.waitHelper = new ActionWaiter(connection);

        this.navigation = new NavigationActions(
            connection,
            snapshotManager,
            this.waitHelper,
            groupContext
        );
        this.input = new InputActions(connection, snapshotManager, this.waitHelper);
        this.observation = new ObservationActions(connection, snapshotManager, this.waitHelper);
    }

    async navigatePage(args) {
        return this.navigation.navigatePage(args);
    }
    async newPage(args) {
        return this.navigation.newPage(args);
    }
    async closePage(args) {
        return this.navigation.closePage(args);
    }
    async listPages(args) {
        return this.navigation.listPages(args);
    }
    async selectPage(args) {
        return this.navigation.selectPage(args);
    }

    async clickElement(args) {
        return this.input.clickElement(args);
    }
    async hoverElement(args) {
        return this.input.hoverElement(args);
    }
    async fillElement(args) {
        return this.input.fillElement(args);
    }
    async fillForm(args) {
        return this.input.fillForm(args);
    }
    async pressKey(args) {
        return this.input.pressKey(args);
    }
    async typeText(args) {
        return this.input.typeText(args);
    }
    async attachFile(args) {
        return this.input.attachFile(args);
    }

    async waitFor(args) {
        return this.observation.waitFor(args);
    }

    async evaluateScript(args) {
        return this.observation.evaluateScript(args);
    }

    async handleDialog(args) {
        return this.observation.handleDialog(args);
    }
}
