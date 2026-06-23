import { BaseActionHandler } from '../base.js';
import { ScriptEvaluationActions } from './script_evaluation.js';
import { WaitActions } from './wait.js';
import { DialogActions } from './dialog.js';

export class ObservationActions extends BaseActionHandler {
    constructor(connection, snapshotManager, waitHelper) {
        super(connection, snapshotManager, waitHelper);

        this.script = new ScriptEvaluationActions(connection, snapshotManager, waitHelper);
        this.wait = new WaitActions(connection, snapshotManager, waitHelper);
        this.dialog = new DialogActions(connection, snapshotManager, waitHelper);
    }

    async waitFor(args) {
        return this.wait.waitFor(args);
    }

    async evaluateScript(args) {
        return this.script.evaluateScript(args);
    }

    async handleDialog(args) {
        return this.dialog.handleDialog(args);
    }
}
