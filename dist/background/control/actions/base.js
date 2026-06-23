import { ActionWaiter } from '../action_waiter.js';

export class BaseActionHandler {
    constructor(connection, snapshotManager, waitHelper) {
        this.connection = connection;
        this.snapshotManager = snapshotManager;
        this.waitHelper = waitHelper || new ActionWaiter(connection);
    }

    cmd(method, params) {
        return this.connection.sendCommand(method, params);
    }

    async getObjectIdFromUid(uid) {
        // This will throw "Stale Element Reference" if versions mismatch,
        // catching errors early before sending commands to browser.
        const backendNodeId = this.snapshotManager.getBackendNodeId(uid);

        if (!backendNodeId) {
            throw new Error(`Node with uid ${uid} has no backend ID. It might be a virtual node.`);
        }

        const resolveNode = async (backendId) => {
            try {
                const { object } = await this.cmd('DOM.resolveNode', { backendNodeId: backendId });
                return object ? object.objectId : null;
            } catch {
                // DOM.resolveNode fails if node is detached from document
                return null;
            }
        };

        const objectId = await resolveNode(backendNodeId);

        if (!objectId) {
            throw new Error(`Element ${uid} is detached from the DOM. Please take a new snapshot.`);
        }

        // Trigger highlight for visual feedback on interaction
        this._doHighlight({ objectId }).catch(() => {});

        return objectId;
    }

    async _doHighlight(params) {
        try {
            await this.cmd('Overlay.enable');
            await this.cmd('Overlay.highlightNode', {
                ...params,
                highlightConfig: {
                    showInfo: true,
                    showRulers: false,
                    showExtensionLines: false,
                    contentColor: { r: 11, g: 87, b: 208, a: 0.3 }, // Gemini Blue fill
                    paddingColor: { r: 11, g: 87, b: 208, a: 0.1 },
                    borderColor: { r: 11, g: 87, b: 208, a: 0.8 }, // Border
                },
            });

            // Auto-hide after 1.5 seconds
            setTimeout(() => {
                this.cmd('Overlay.hideHighlight').catch(() => {});
            }, 1500);
        } catch {
            // Ignore highlight errors
        }
    }
}
