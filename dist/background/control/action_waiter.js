/**
 * Ensures actions wait for potential side effects (navigation) and DOM stability.
 * Enhanced logic based on the Chrome DevTools MCP action wait flow.
 */
export class ActionWaiter {
    constructor(connection, cpuMultiplier = 1, networkMultiplier = 1) {
        this.connection = connection;
        // Constants derived from MCP implementation logic
        this.timeouts = {
            // Max time to wait for DOM to stabilize
            stableDom: 3000 * cpuMultiplier,
            // Duration of no mutations to consider DOM stable
            stableDomFor: 100 * cpuMultiplier,
            // Time to wait for a navigation to potentially start after an action
            expectNavigationIn: 500 * cpuMultiplier,
            // Max time to wait for navigation to complete
            navigation: 15000 * networkMultiplier,
        };
    }

    /**
     * Executes an action and waits for navigation/DOM stability afterwards.
     * @param {Function} actionFn - Async function performing the browser action
     */
    async execute(actionFn) {
        // Fallback for non-attached sessions (e.g. restricted URLs like chrome://)
        if (!this.connection.attached) {
            await actionFn();
            // Wait a bit for potential navigation to start/process since we can't track it precisely via CDP
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return {};
        }

        try {
            await this.connection.sendCommand('Page.enable');
        } catch {
            // The action can still run if Page events are unavailable.
        }

        const initialUrl = await this._getCurrentUrl();
        const mainFrameId = await this._getMainFrameId();
        // Listen before the action so immediate transitions and fast loads are not missed.
        const navigationWatcher = this._createNavigationWatcher(mainFrameId);
        let navigationStarted = false;

        try {
            await actionFn();
            navigationStarted = await navigationWatcher.wait();
        } catch (error) {
            navigationWatcher.dispose();
            console.error('Error during action execution/waiting:', error);
            throw error;
        }

        await this.waitForStableDOM();
        const finalUrl = await this._getCurrentUrl();

        return {
            navigationStarted,
            ...(initialUrl && finalUrl && initialUrl !== finalUrl
                ? { navigatedToUrl: finalUrl }
                : {}),
        };
    }

    async _getCurrentUrl() {
        if (!this.connection.attached) return '';

        try {
            const response = await this.connection.sendCommand('Runtime.evaluate', {
                expression: 'typeof location === "undefined" ? "" : location.href',
                returnByValue: true,
            });
            return typeof response?.result?.value === 'string' ? response.result.value : '';
        } catch {
            return '';
        }
    }

    async _getMainFrameId() {
        if (!this.connection.attached) return '';

        try {
            const response = await this.connection.sendCommand('Page.getFrameTree');
            return response?.frameTree?.frame?.id || '';
        } catch {
            return '';
        }
    }

    _isSameDocumentNavigation(params = {}) {
        return ['sameDocument', 'historySameDocument'].includes(params.navigationType);
    }

    _createNavigationWatcher(mainFrameId = '') {
        let done = false;
        let sawNavigationStart = false;
        let sawLoadEvent = false;
        let navigationFrameId = '';
        let startTimer = null;
        let navigationTimer = null;

        const cleanup = () => {
            this.connection.removeListener(listener);
            if (startTimer) clearTimeout(startTimer);
            if (navigationTimer) clearTimeout(navigationTimer);
        };

        const finish = (value = false) => {
            if (done) return;
            done = true;
            cleanup();
            resolvePromise(value);
        };

        let resolvePromise;
        const waitPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        const listener = (method, params) => {
            if (method === 'Page.javascriptDialogOpening') {
                finish(false);
                return;
            }

            if (method === 'Page.navigatedWithinDocument') {
                finish(false);
                return;
            }

            if (method === 'Page.frameStartedNavigating') {
                if (mainFrameId && params?.frameId && params.frameId !== mainFrameId) {
                    return;
                }

                if (this._isSameDocumentNavigation(params)) {
                    finish(false);
                    return;
                }

                sawNavigationStart = true;
                navigationFrameId = params?.frameId || mainFrameId || '';
                if (startTimer) {
                    clearTimeout(startTimer);
                    startTimer = null;
                }
                if (sawLoadEvent) {
                    finish(true);
                    return;
                }
                if (navigationTimer) {
                    clearTimeout(navigationTimer);
                    navigationTimer = null;
                }
                navigationTimer = setTimeout(() => {
                    finish(false);
                }, this.timeouts.navigation);
                return;
            }

            if (method === 'Page.loadEventFired' || method === 'Page.frameStoppedLoading') {
                if (
                    method === 'Page.frameStoppedLoading' &&
                    navigationFrameId &&
                    params?.frameId &&
                    params.frameId !== navigationFrameId
                ) {
                    return;
                }

                sawLoadEvent = true;
                if (sawNavigationStart) {
                    finish(true);
                }
            }
        };

        this.connection.addListener(listener);
        startTimer = setTimeout(() => {
            finish(false);
        }, this.timeouts.expectNavigationIn);

        return {
            wait: () => waitPromise,
            dispose: cleanup,
        };
    }

    _waitForNavigationStart() {
        return this._waitForEvent(
            (method, params) =>
                method === 'Page.frameStartedNavigating' && !this._isSameDocumentNavigation(params),
            this.timeouts.expectNavigationIn
        );
    }

    _waitForLoadEvent() {
        return this._waitForEvent(
            (method) => method === 'Page.loadEventFired',
            this.timeouts.navigation
        );
    }

    _waitForEvent(matchesEvent, timeout) {
        return new Promise((resolve) => {
            let timer = null;

            const listener = (method, params) => {
                if (matchesEvent(method, params)) {
                    cleanup();
                    resolve(true);
                }
            };

            const cleanup = () => {
                this.connection.removeListener(listener);
                if (timer) clearTimeout(timer);
            };

            this.connection.addListener(listener);

            timer = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeout);
        });
    }

    /**
     * Waits for the DOM to be stable (no mutations) for a certain duration.
     * @param {number} [timeout] - Override max timeout
     * @param {number} [stabilityDuration] - Override stability duration
     */
    async waitForStableDOM(timeout = null, stabilityDuration = null) {
        if (!this.connection.attached) return;
        if (this.connection.getDialog?.()) return;

        const maxStableDomWait = timeout || this.timeouts.stableDom;
        const stableDomQuietWindow = stabilityDuration || this.timeouts.stableDomFor;

        try {
            await this.connection.sendCommand('Runtime.evaluate', {
                expression: `
                    (async () => {
                        const startTime = Date.now();

                        while (typeof document === 'undefined' || !document.body) {
                            if (Date.now() - startTime > ${maxStableDomWait}) return false;
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        return await new Promise((resolve) => {
                            let timer = null;

                            const observer = new MutationObserver(() => {
                                // Mutation detected, reset timer
                                if (timer) clearTimeout(timer);
                                timer = setTimeout(done, ${stableDomQuietWindow});
                            });

                            function done() {
                                observer.disconnect();
                                resolve(true);
                            }

                            // Start observing
                            observer.observe(document.body, {
                                attributes: true,
                                childList: true,
                                subtree: true
                            });

                            // Resolve if no mutations happen immediately.
                            timer = setTimeout(done, ${stableDomQuietWindow});

                            // Max safety timeout (deduct time spent waiting for body)
                            const remaining = Math.max(100, ${maxStableDomWait} - (Date.now() - startTime));
                            setTimeout(() => {
                                observer.disconnect();
                                resolve(false);
                            }, remaining);
                        });
                    })()
                `,
                awaitPromise: true,
                returnByValue: true,
            });
        } catch {
            // Ignore errors if runtime context is gone (e.g. page closed or navigated away mid-script)
        }
    }
}
