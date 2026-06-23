import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionWaiter } from './action_waiter.js';

describe('ActionWaiter event waits', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function createConnection() {
        let listener = null;
        return {
            attached: true,
            addListener: vi.fn((handler) => {
                listener = handler;
            }),
            removeListener: vi.fn((handler) => {
                if (listener === handler) listener = null;
            }),
            emit(method, params = {}) {
                if (listener) listener(method, params);
            },
        };
    }

    it('removes the navigation-start listener after timeout', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const wait = helper._waitForNavigationStart();

        await vi.advanceTimersByTimeAsync(helper.timeouts.expectNavigationIn);

        await expect(wait).resolves.toBe(false);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('removes the load-event listener after the event fires', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const wait = helper._waitForLoadEvent();

        connection.emit('Page.loadEventFired');

        await expect(wait).resolves.toBe(true);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('handles a fast load event that arrives before navigation-start processing', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const watcher = helper._createNavigationWatcher();

        connection.emit('Page.loadEventFired');
        connection.emit('Page.frameStartedNavigating', { navigationType: 'differentDocument' });

        await expect(watcher.wait()).resolves.toBe(true);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('does not wait for a full page load after same-document navigation', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const watcher = helper._createNavigationWatcher();

        connection.emit('Page.frameStartedNavigating', { navigationType: 'sameDocument' });

        await expect(watcher.wait()).resolves.toBe(false);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('ignores iframe navigation starts when a main frame id is known', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const watcher = helper._createNavigationWatcher('main-frame');

        connection.emit('Page.frameStartedNavigating', {
            frameId: 'iframe',
            navigationType: 'differentDocument',
        });
        await vi.advanceTimersByTimeAsync(helper.timeouts.expectNavigationIn);

        await expect(watcher.wait()).resolves.toBe(false);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('waits for the navigating frame to stop loading instead of an unrelated frame', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const watcher = helper._createNavigationWatcher('main-frame');
        let settled = false;
        const wait = watcher.wait().then((result) => {
            settled = true;
            return result;
        });

        connection.emit('Page.frameStartedNavigating', {
            frameId: 'main-frame',
            navigationType: 'differentDocument',
        });
        connection.emit('Page.frameStoppedLoading', { frameId: 'iframe' });
        await Promise.resolve();

        expect(settled).toBe(false);

        connection.emit('Page.frameStoppedLoading', { frameId: 'main-frame' });

        await expect(wait).resolves.toBe(true);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('stops waiting for navigation when a JavaScript dialog opens', async () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);
        const watcher = helper._createNavigationWatcher();

        connection.emit('Page.frameStartedNavigating', { navigationType: 'differentDocument' });
        connection.emit('Page.javascriptDialogOpening', { type: 'beforeunload' });

        await expect(watcher.wait()).resolves.toBe(false);
        expect(connection.removeListener).toHaveBeenCalledTimes(1);
    });

    it('returns the final URL when an action changes pages', async () => {
        const connection = createConnection();
        connection.sendCommand = vi.fn(() => Promise.resolve({}));
        const helper = new ActionWaiter(connection);
        helper._getCurrentUrl = vi
            .fn()
            .mockResolvedValueOnce('https://before.test/')
            .mockResolvedValueOnce('https://after.test/');
        helper.waitForStableDOM = vi.fn(() => Promise.resolve());

        const resultPromise = helper.execute(async () => {
            connection.emit('Page.frameStartedNavigating', { navigationType: 'differentDocument' });
            connection.emit('Page.loadEventFired');
        });

        await expect(resultPromise).resolves.toEqual({
            navigationStarted: true,
            navigatedToUrl: 'https://after.test/',
        });
        expect(helper.waitForStableDOM).toHaveBeenCalledTimes(1);
    });

    it('skips DOM stability probing while a JavaScript dialog is open', async () => {
        const connection = {
            attached: true,
            getDialog: vi.fn(() => ({ type: 'alert', message: 'Stop' })),
            sendCommand: vi.fn(),
        };
        const helper = new ActionWaiter(connection);

        await helper.waitForStableDOM();

        expect(connection.sendCommand).not.toHaveBeenCalled();
    });

    it('does not retain unused multiplier fields after calculating timeouts', () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection, 2, 3);

        expect(helper.timeouts.stableDom).toBe(6000);
        expect(helper.timeouts.navigation).toBe(45000);
        expect(Object.hasOwn(helper, 'cpuMultiplier')).toBe(false);
        expect(Object.hasOwn(helper, 'networkMultiplier')).toBe(false);
    });

    it('does not expose a runtime multiplier update API when no caller uses one', () => {
        const connection = createConnection();
        const helper = new ActionWaiter(connection);

        expect(helper.updateMultipliers).toBeUndefined();
    });
});
