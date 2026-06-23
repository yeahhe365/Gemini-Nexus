(function () {
    const STORAGE_KEYS = [
        'geminiTextSelectionEnabled',
        'geminiTextSelectionBlacklist',
        'geminiCustomSelectionTools',
        'geminiImageToolsEnabled',
        'geminiGeneratedImageWatermarkRemovalEnabled',
    ];

    function isSelectionBlacklisted(blacklist) {
        return (
            window.GeminiSelectionBlacklist?.matchesLocation?.(window.location, blacklist) === true
        );
    }

    function applySelectionSetting(toolbar, selectionState) {
        toolbar?.setSelectionEnabled?.(
            selectionState.enabled && !isSelectionBlacklisted(selectionState.blacklist)
        );
    }

    function applyToolbarSettings(toolbar, result) {
        const generatedImageWatermarkRemovalEnabled =
            result.geminiGeneratedImageWatermarkRemovalEnabled !== false;

        toolbar?.setImageToolsEnabled?.(result.geminiImageToolsEnabled !== false);
        toolbar?.setGeneratedImageWatermarkRemovalEnabled?.(generatedImageWatermarkRemovalEnabled);
        toolbar?.setCustomSelectionTools?.(
            Array.isArray(result.geminiCustomSelectionTools)
                ? result.geminiCustomSelectionTools
                : []
        );
    }

    function getStorageReadError() {
        return chrome.runtime?.lastError?.message || null;
    }

    function init(toolbar) {
        if (!toolbar) return;

        const selectionState = {
            enabled: true,
            blacklist: '',
        };

        const applyCurrentSelectionState = () => {
            applySelectionSetting(toolbar, selectionState);
        };

        chrome.storage.local.get(STORAGE_KEYS, (result) => {
            const errorMessage = getStorageReadError();
            if (errorMessage) {
                console.warn('Failed to load content toolbar settings:', errorMessage);
                return;
            }

            const stored = result || {};
            selectionState.enabled = stored.geminiTextSelectionEnabled !== false;
            selectionState.blacklist = stored.geminiTextSelectionBlacklist || '';

            applyCurrentSelectionState();
            applyToolbarSettings(toolbar, stored);
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;

            let shouldApplySelection = false;

            if (changes.geminiTextSelectionEnabled) {
                selectionState.enabled = changes.geminiTextSelectionEnabled.newValue !== false;
                shouldApplySelection = true;
            }

            if (changes.geminiTextSelectionBlacklist) {
                selectionState.blacklist = changes.geminiTextSelectionBlacklist.newValue || '';
                shouldApplySelection = true;
            }

            if (shouldApplySelection) {
                applyCurrentSelectionState();
            }

            if (changes.geminiImageToolsEnabled) {
                toolbar?.setImageToolsEnabled?.(changes.geminiImageToolsEnabled.newValue !== false);
            }

            if (changes.geminiGeneratedImageWatermarkRemovalEnabled) {
                const enabled =
                    changes.geminiGeneratedImageWatermarkRemovalEnabled.newValue !== false;
                toolbar?.setGeneratedImageWatermarkRemovalEnabled?.(enabled);
            }

            if (changes.geminiCustomSelectionTools) {
                toolbar?.setCustomSelectionTools?.(
                    Array.isArray(changes.geminiCustomSelectionTools.newValue)
                        ? changes.geminiCustomSelectionTools.newValue
                        : []
                );
            }
        });
    }

    window.GeminiContentSettingsSync = { init };
})();
