import { BaseActionHandler } from '../base.js';

const MAX_LAYOUT_RETRIES = 3;
const LAYOUT_RETRY_DELAY_MS = 150;

function isTransientLayoutError(error) {
    const message = error?.message || '';
    return message.includes('layout object') || message.includes('Node is detached');
}

function delay(delayMs) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export class MouseActions extends BaseActionHandler {
    async hoverElement({ uid }) {
        const objectId = await this.getObjectIdFromUid(uid);
        const backendNodeId = this.snapshotManager.getBackendNodeId(uid);

        try {
            const { x, y } = await this._getElementCenter({ objectId, backendNodeId });

            await this.waitHelper.execute(async () => {
                await this.cmd('Input.dispatchMouseEvent', {
                    type: 'mouseMoved',
                    x,
                    y,
                });
            });

            return `Hovered element ${uid} at ${Math.round(x)},${Math.round(y)}`;
        } catch (error) {
            console.warn(
                `Physical hover on ${uid} failed (${error.message}), attempting JS fallback.`
            );

            await this.waitHelper.execute(async () => {
                await this.cmd('Runtime.callFunctionOn', {
                    objectId,
                    functionDeclaration: `function() {
                        this.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
                        const rect = this.getBoundingClientRect();
                        const x = rect.left + (rect.width / 2);
                        const y = rect.top + (rect.height / 2);

                        ['mouseover', 'mouseenter', 'mousemove'].forEach(type => {
                            this.dispatchEvent(new MouseEvent(type, {
                                view: window,
                                bubbles: type !== 'mouseenter',
                                cancelable: true,
                                composed: true,
                                clientX: x,
                                clientY: y
                            }));
                        });
                    }`,
                });
            });

            return `Hovered element ${uid} (JS Fallback)`;
        }
    }

    async clickElement({ uid, dblClick = false }) {
        const objectId = await this.getObjectIdFromUid(uid);
        const backendNodeId = this.snapshotManager.getBackendNodeId(uid);

        try {
            const { x, y } = await this._getElementCenter({ objectId, backendNodeId });

            const hitTestResult = await this.cmd('Runtime.callFunctionOn', {
                objectId,
                functionDeclaration: `function(x, y) {
                    const hitElement = document.elementFromPoint(x, y);
                    if (!hitElement) return false;
                    return this.contains(hitElement) || hitElement.contains(this);
                }`,
                arguments: [{ value: x }, { value: y }],
                returnByValue: true,
            });

            // Resilient Occlusion Detection:
            // Instead of throwing an error that stops the action, throw a specific error
            // to trigger immediate JS fallback logic in the catch block.
            if (!hitTestResult.result || hitTestResult.result.value === false) {
                throw new Error('OCCLUSION_DETECTED');
            }

            await this.waitHelper.execute(async () => {
                await this.cmd('Input.dispatchMouseEvent', {
                    type: 'mouseMoved',
                    x,
                    y,
                });
                await this.cmd('Input.dispatchMouseEvent', {
                    type: 'mousePressed',
                    x,
                    y,
                    button: 'left',
                    clickCount: 1,
                });
                await this.cmd('Input.dispatchMouseEvent', {
                    type: 'mouseReleased',
                    x,
                    y,
                    button: 'left',
                    clickCount: 1,
                });

                if (dblClick) {
                    await this.cmd('Input.dispatchMouseEvent', {
                        type: 'mousePressed',
                        x,
                        y,
                        button: 'left',
                        clickCount: 2,
                    });
                    await this.cmd('Input.dispatchMouseEvent', {
                        type: 'mouseReleased',
                        x,
                        y,
                        button: 'left',
                        clickCount: 2,
                    });
                }
            });

            return `Clicked element ${uid} at ${Math.round(x)},${Math.round(y)}${dblClick ? ' (Double Click)' : ''}`;
        } catch (error) {
            const isOccluded = error.message === 'OCCLUSION_DETECTED';
            const reason = isOccluded ? 'Occluded' : error.message;

            console.warn(
                `Physical click on ${uid} failed (${reason}), attempting Enhanced JS fallback.`
            );

            // The JS fallback mirrors the full mouse chain and lets waitHelper catch navigation.
            await this.waitHelper.execute(async () => {
                await this.cmd('Runtime.callFunctionOn', {
                    objectId,
                    functionDeclaration: `function() {
                        this.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

                        const rect = this.getBoundingClientRect();
                        const x = rect.left + (rect.width / 2);
                        const y = rect.top + (rect.height / 2);

                        const eventTypes = ['mouseover', 'mousedown', 'mouseup', 'click'];

                        eventTypes.forEach(type => {
                             const event = new MouseEvent(type, {
                                 view: window,
                                 bubbles: true,
                                 cancelable: true,
                                 composed: true, // Penetrate ShadowDOM
                                 buttons: 1,
                                 clientX: x,
                                 clientY: y
                             });
                             this.dispatchEvent(event);
                        });

                        if (this.focus) this.focus();
                    }`,
                });
            });

            return `Clicked element ${uid} (${isOccluded ? 'Occluded, ' : ''}JS Fallback)`;
        }
    }

    async _getElementCenter({ objectId, backendNodeId }) {
        for (let attempt = 0; attempt < MAX_LAYOUT_RETRIES; attempt++) {
            try {
                await this.cmd('DOM.scrollIntoViewIfNeeded', { objectId });

                const { model } = await this.cmd('DOM.getBoxModel', { backendNodeId });
                if (!model || !model.content) throw new Error('No box model');

                return {
                    x: (model.content[0] + model.content[4]) / 2,
                    y: (model.content[1] + model.content[5]) / 2,
                };
            } catch (error) {
                const hasRetryLeft = attempt < MAX_LAYOUT_RETRIES - 1;
                if (isTransientLayoutError(error) && hasRetryLeft) {
                    await delay(LAYOUT_RETRY_DELAY_MS);
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Unable to resolve element center');
    }
}
