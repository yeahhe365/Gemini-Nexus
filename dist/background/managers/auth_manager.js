import { fetchRequestParams } from '../../services/auth.js';
import { debugLog } from '../../shared/logging/debug.js';

function hasUploadTokenFields(context) {
    return (
        Object.prototype.hasOwnProperty.call(context, 'uploadPushId') &&
        Object.prototype.hasOwnProperty.call(context, 'uploadClientPctx')
    );
}

function createAuthContext(context = {}) {
    return {
        atValue: context.atValue,
        blValue: context.blValue,
        fSid: context.fSid,
        locale: context.locale,
        authUser: context.authUser,
        uploadPushId: context.uploadPushId,
        uploadClientPctx: context.uploadClientPctx,
    };
}

export class AuthManager {
    constructor() {
        this.currentContext = null;
        this.accountIndices = ['0'];
        this.currentAccountPointer = 0;
        this.isInitialized = false;
    }

    async ensureInitialized() {
        if (this.isInitialized) return;

        try {
            const stored = await chrome.storage.local.get([
                'geminiContext',
                'geminiAccountIndices',
                'geminiAccountPointer',
            ]);

            if (stored.geminiContext) {
                this.currentContext = stored.geminiContext;
            }

            if (stored.geminiAccountIndices) {
                this.accountIndices = stored.geminiAccountIndices
                    .split(',')
                    .map((accountIndex) => accountIndex.trim())
                    .filter((accountIndex) => accountIndex !== '');
            }
            if (typeof stored.geminiAccountPointer === 'number') {
                this.currentAccountPointer = stored.geminiAccountPointer;
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to restore auth session:', error);
        }
    }

    /**
     * Rotates to the next account index and returns it.
     */
    async rotateAccount() {
        // Refresh list from storage in case it changed
        try {
            const stored = await chrome.storage.local.get(['geminiAccountIndices']);
            if (stored.geminiAccountIndices) {
                this.accountIndices = stored.geminiAccountIndices
                    .split(',')
                    .map((accountIndex) => accountIndex.trim())
                    .filter((accountIndex) => accountIndex !== '');
            }
        } catch (error) {
            console.warn(
                '[Gemini Nexus] Failed to refresh account indices before rotation:',
                error
            );
        }
        if (this.accountIndices.length === 0) this.accountIndices = ['0'];

        this.currentAccountPointer = (this.currentAccountPointer + 1) % this.accountIndices.length;
        try {
            await chrome.storage.local.set({ geminiAccountPointer: this.currentAccountPointer });
        } catch (error) {
            console.warn('[Gemini Nexus] Failed to persist account rotation pointer:', error);
        }

        debugLog(
            `[Gemini Nexus] Rotated to account index: ${this.accountIndices[this.currentAccountPointer]}`
        );
        return this.accountIndices[this.currentAccountPointer];
    }

    /**
     * Gets credentials for the current account pointer.
     * If context is null, it fetches fresh tokens.
     */
    async getOrFetchContext() {
        if (
            this.currentContext?.atValue &&
            this.currentContext?.blValue &&
            this.currentContext?.fSid &&
            this.currentContext?.locale &&
            hasUploadTokenFields(this.currentContext)
        ) {
            this.currentContext = createAuthContext(this.currentContext);
            return this.currentContext;
        }

        const targetIndex = this.accountIndices[this.currentAccountPointer] || '0';
        try {
            const params = await fetchRequestParams(targetIndex);
            this.currentContext = createAuthContext({
                atValue: params.atValue,
                blValue: params.blValue,
                fSid: params.fSid,
                locale: params.locale,
                authUser: params.authUserIndex || targetIndex,
                uploadPushId: params.uploadPushId,
                uploadClientPctx: params.uploadClientPctx,
            });
            return this.currentContext;
        } catch (error) {
            console.warn(`Failed to fetch context for account ${targetIndex}:`, error);
            throw error;
        }
    }

    getCurrentIndex() {
        return this.accountIndices[this.currentAccountPointer] || '0';
    }

    async updateContext(newContext) {
        this.currentContext = createAuthContext(newContext);

        try {
            await chrome.storage.local.set({
                geminiContext: this.currentContext,
            });
        } catch (error) {
            console.warn('[Gemini Nexus] Failed to persist Web auth context:', error);
        }
    }

    async resetContext() {
        this.currentContext = null;
        // Do not remove geminiModel to preserve user preference in UI
        try {
            await chrome.storage.local.remove(['geminiContext']);
        } catch (error) {
            console.warn('[Gemini Nexus] Failed to clear Web auth context:', error);
        }

        // Rotate to spread load on reset
        if (this.accountIndices.length > 1) {
            await this.rotateAccount();
        }
    }

    forceContextRefresh() {
        this.currentContext = null;
    }
}
