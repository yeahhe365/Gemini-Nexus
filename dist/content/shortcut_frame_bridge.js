(function () {
    window.GeminiNexusShortcutFrameBridgeReady = true;
    window.GeminiNexusShortcutFrameBridge?.destroy?.();

    const DEFAULT_SHORTCUTS = Object.freeze({
        quickAsk: 'Alt+Q',
        openPanel: 'Alt+G',
        browserControl: 'Ctrl+B',
        ocrCapture: 'Alt+O',
    });
    const LEGACY_DEFAULT_SHORTCUTS = Object.freeze([
        Object.freeze({
            quickAsk: 'Ctrl+Q',
            openPanel: 'Alt+G',
            browserControl: 'Ctrl+B',
            ocrCapture: 'Alt+O',
        }),
        Object.freeze({
            quickAsk: 'Ctrl+G',
            openPanel: 'Alt+S',
            browserControl: 'Ctrl+B',
            ocrCapture: 'Alt+O',
        }),
    ]);
    const SHORTCUT_KEYS = Object.freeze(Object.keys(DEFAULT_SHORTCUTS));
    const MODIFIER_KEYS = ['ctrl', 'alt', 'shift', 'meta', 'command'];

    function isShortcutObject(shortcuts) {
        return shortcuts && typeof shortcuts === 'object' && !Array.isArray(shortcuts);
    }

    function isDefaultShortcutValue(key, value) {
        return (
            value === DEFAULT_SHORTCUTS[key] ||
            LEGACY_DEFAULT_SHORTCUTS.some((shortcuts) => value === shortcuts[key])
        );
    }

    function normalizeDefaultShortcutValue(key, value) {
        return isDefaultShortcutValue(key, value) ? DEFAULT_SHORTCUTS[key] : value;
    }

    function normalizeShortcutDefaults(shortcuts) {
        const stored = isShortcutObject(shortcuts) ? shortcuts : {};
        const usesOnlyDefaultValues = SHORTCUT_KEYS.every((key) => {
            if (!Object.prototype.hasOwnProperty.call(stored, key)) return true;
            return isDefaultShortcutValue(key, stored[key]);
        });
        const migrated = { ...stored };

        if (usesOnlyDefaultValues) {
            SHORTCUT_KEYS.forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(migrated, key)) {
                    migrated[key] = normalizeDefaultShortcutValue(key, migrated[key]);
                }
            });
        }

        return { ...DEFAULT_SHORTCUTS, ...migrated };
    }

    function getStorageReadError() {
        return chrome.runtime?.lastError?.message || null;
    }

    function getCodeKey(event) {
        if (typeof event?.code !== 'string') return '';
        const letterMatch = event.code.match(/^Key([A-Z])$/i);
        if (letterMatch) return letterMatch[1].toLowerCase();
        const digitMatch = event.code.match(/^Digit([0-9])$/);
        if (digitMatch) return digitMatch[1];
        return '';
    }

    function matchShortcut(event, shortcutString) {
        if (!shortcutString || typeof shortcutString !== 'string') return false;
        if (!event || typeof event.key !== 'string') return false;

        const parts = shortcutString.split('+').map((part) => part.trim().toLowerCase());
        const key = event.key.toLowerCase();

        if (event.ctrlKey !== parts.includes('ctrl')) return false;
        if (event.altKey !== parts.includes('alt')) return false;
        if (event.shiftKey !== parts.includes('shift')) return false;
        if (event.metaKey !== (parts.includes('meta') || parts.includes('command'))) return false;

        const mainKeys = parts.filter((part) => !MODIFIER_KEYS.includes(part));
        if (mainKeys.length !== 1) return false;

        const mainKey = mainKeys[0];
        return key === mainKey || getCodeKey(event) === mainKey;
    }

    function sendRuntimeMessage(message) {
        try {
            const result = chrome.runtime.sendMessage(message);
            result?.catch?.(() => {});
        } catch {}
    }

    class ShortcutFrameBridge {
        constructor() {
            this.appShortcuts = {};
            this.handleStorageChange = this.handleStorageChange.bind(this);
            this.handleDocumentKeydown = (event) => this.handleKeydown(event);
            this.init();
        }

        init() {
            chrome.storage.local.get(['geminiShortcuts'], (result) => {
                const errorMessage = getStorageReadError();
                if (errorMessage) {
                    console.warn('Failed to load Gemini Nexus frame shortcuts:', errorMessage);
                    return;
                }

                this.appShortcuts = normalizeShortcutDefaults(result?.geminiShortcuts);
            });

            chrome.storage.onChanged.addListener(this.handleStorageChange);
            window.addEventListener('keydown', this.handleDocumentKeydown, true);
            document.addEventListener('keydown', this.handleDocumentKeydown, true);
        }

        destroy() {
            window.removeEventListener('keydown', this.handleDocumentKeydown, true);
            document.removeEventListener('keydown', this.handleDocumentKeydown, true);
            chrome.storage?.onChanged?.removeListener?.(this.handleStorageChange);
        }

        handleStorageChange(changes, area) {
            if (area === 'local' && changes.geminiShortcuts) {
                this.appShortcuts = normalizeShortcutDefaults(changes.geminiShortcuts.newValue);
            }
        }

        handleKeydown(event) {
            if (matchShortcut(event, this.appShortcuts.quickAsk)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                sendRuntimeMessage({ action: 'SHOW_QUICK_ASK_FROM_SHORTCUT' });
                return;
            }

            if (matchShortcut(event, this.appShortcuts.ocrCapture)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                sendRuntimeMessage({
                    action: 'START_AREA_OCR_FROM_SHORTCUT',
                    mode: 'ocr',
                    source: 'local',
                });
            }
        }
    }

    window.GeminiNexusShortcutFrameBridge = new ShortcutFrameBridge();
})();
