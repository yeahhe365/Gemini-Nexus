import { debugLog } from '../../shared/logging/debug.js';

const ALARM_NAME = 'gemini_cookie_rotate';
const ROTATE_URL = 'https://accounts.google.com/RotateCookies';
// Matches Python implementation (540s = 9 minutes)
const INTERVAL_MINUTES = 9;
const MIN_ROTATION_INTERVAL_MS = 60000;
const LAST_ROTATION_ATTEMPT_KEY = 'geminiKeepAliveLastRotationAttempt';

class KeepAliveManager {
    constructor() {
        this.lastRotation = 0;
        this.isRotating = false;
        this.consecutiveErrors = 0;
        this.boundOnAlarm = this._onAlarm.bind(this);
    }

    init() {
        chrome.alarms.get(ALARM_NAME, (alarm) => {
            if (!alarm) {
                chrome.alarms.create(ALARM_NAME, { periodInMinutes: INTERVAL_MINUTES });
            }
        });

        if (!chrome.alarms.onAlarm.hasListener(this.boundOnAlarm)) {
            chrome.alarms.onAlarm.addListener(this.boundOnAlarm);
        }

        this.performRotation();
    }

    _onAlarm(alarm) {
        if (alarm.name === ALARM_NAME) {
            this.performRotation();
        }
    }

    async _getLastRotationAttempt() {
        try {
            const result = await chrome.storage?.local?.get?.([LAST_ROTATION_ATTEMPT_KEY]);
            const storedValue = result?.[LAST_ROTATION_ATTEMPT_KEY];
            if (Number.isFinite(storedValue)) {
                this.lastRotation = storedValue;
            }
        } catch {}

        return this.lastRotation;
    }

    async _setLastRotationAttempt(timestamp) {
        this.lastRotation = timestamp;
        try {
            await chrome.storage?.local?.set?.({
                [LAST_ROTATION_ATTEMPT_KEY]: timestamp,
            });
        } catch {}
    }

    async performRotation() {
        if (this.isRotating) return;
        this.isRotating = true;

        const now = Date.now();

        try {
            const lastRotationAttempt = await this._getLastRotationAttempt();
            // Throttling: Don't rotate if attempted in last 60s
            // (Matches Python logic to avoid 429 Too Many Requests)
            if (now - lastRotationAttempt < MIN_ROTATION_INTERVAL_MS) {
                return;
            }

            await this._setLastRotationAttempt(now);
            debugLog('[Gemini Nexus] Keep-Alive: Rotating cookies...');

            // This endpoint refreshes __Secure-1PSIDTS
            // Browser automatically handles the Cookie header in request and Set-Cookie in response
            // due to host permissions.
            const response = await fetch(ROTATE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Raw payload compatible with Google's endpoint logic
                // [000,"-0000000000000000000"]
                body: '[000,"-0000000000000000000"]',
            });

            if (response.ok) {
                await this._setLastRotationAttempt(Date.now());
                this.consecutiveErrors = 0;
                debugLog('[Gemini Nexus] Keep-Alive: Rotation successful');
            } else {
                this.consecutiveErrors++;
                await this._handleError(response.status);
            }
        } catch (error) {
            this.consecutiveErrors++;
            console.error('[Gemini Nexus] Keep-Alive: Network error', error);
        } finally {
            this.isRotating = false;
        }
    }

    async _handleError(status) {
        console.warn(`[Gemini Nexus] Keep-Alive: Rotation failed with status ${status}`);

        // If 401 Unauthorized or 403 Forbidden, session is likely dead.
        // We clear the context so the next user action triggers a fresh auth check.
        if (status === 401 || status === 403) {
            debugLog('[Gemini Nexus] Session expired. Clearing local context.');
            try {
                await chrome.storage.local.remove(['geminiContext']);
            } catch (error) {
                console.warn('[Gemini Nexus] Keep-Alive: Failed to clear expired context:', error);
            }
        }

        // If 429 Too Many Requests, do nothing, just wait for next interval.
    }
}

export const keepAliveManager = new KeepAliveManager();
