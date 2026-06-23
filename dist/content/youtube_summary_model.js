(function () {
    const config = globalThis.GeminiNexusConfig;
    const catalog = globalThis.GeminiNexusWebModelCatalog;
    const PROVIDERS = Object.freeze({
        official: 'official',
        openai: 'openai',
    });
    const STORAGE_KEYS = Object.freeze([
        'geminiProvider',
        'geminiUseOfficialApi',
        'geminiModel',
        'geminiOfficialModel',
        'geminiOpenaiModel',
        'geminiOpenaiSelectedModel',
        ...getDedicatedStorageKeys(),
    ]);

    function parseConfiguredModels(rawModels) {
        return String(rawModels || '')
            .split(',')
            .map((model) => model.trim())
            .filter(Boolean);
    }

    function isSupportedWebModel(model) {
        return Boolean(catalog?.getWebModelHeaderConfig?.(model));
    }

    function getDefaultWebModel() {
        return catalog?.DEFAULT_WEB_MODEL || config?.DEFAULT_STORED_GEMINI_MODEL || null;
    }

    function getDedicatedProviderConfigs() {
        return config?.DEDICATED_API_PROVIDERS || {};
    }

    function getDedicatedProviderConfig(provider) {
        return getDedicatedProviderConfigs()[provider] || null;
    }

    function getDedicatedProviderStorageKeys(provider) {
        const providerConfig = getDedicatedProviderConfig(provider);
        if (!providerConfig) return null;
        return {
            model: `gemini${providerConfig.storagePrefix}Model`,
            selectedModel: `gemini${providerConfig.storagePrefix}SelectedModel`,
        };
    }

    function getDedicatedStorageKeys() {
        return Object.keys(getDedicatedProviderConfigs()).flatMap((provider) =>
            Object.values(getDedicatedProviderStorageKeys(provider) || {})
        );
    }

    function getStoredProvider(stored) {
        return (
            stored.geminiProvider ||
            (stored.geminiUseOfficialApi === true ? PROVIDERS.official : config?.DEFAULT_PROVIDER)
        );
    }

    function createSummaryConfig(provider, model) {
        return {
            provider: provider || config?.DEFAULT_PROVIDER,
            model: model || null,
        };
    }

    async function getStoredSummaryModel() {
        const summaryConfig = await getStoredSummaryConfig();
        return summaryConfig.model;
    }

    async function getStoredSummaryConfig() {
        const fallback = getDefaultWebModel();
        try {
            const stored = await chrome.storage?.local?.get?.(STORAGE_KEYS);
            if (!stored) return createSummaryConfig(config?.DEFAULT_PROVIDER, fallback);

            const provider = getStoredProvider(stored);

            if (provider === PROVIDERS.openai) {
                const configured = parseConfiguredModels(stored.geminiOpenaiModel);
                const model = stored.geminiOpenaiSelectedModel
                    ? stored.geminiOpenaiSelectedModel
                    : configured.includes(stored.geminiModel)
                      ? stored.geminiModel
                      : config?.DEFAULT_OPENAI_MODEL;
                return createSummaryConfig(provider, model);
            }

            const dedicatedConfig = getDedicatedProviderConfig(provider);
            if (dedicatedConfig) {
                const keys = getDedicatedProviderStorageKeys(provider);
                const configured = parseConfiguredModels(stored[keys.model]);
                const model =
                    stored[keys.selectedModel] ||
                    configured[0] ||
                    dedicatedConfig.defaultModel ||
                    null;
                return createSummaryConfig(provider, model);
            }

            if (provider === PROVIDERS.official) {
                const configured = parseConfiguredModels(stored.geminiOfficialModel);
                const model = configured.includes(stored.geminiModel) ? stored.geminiModel : null;
                return createSummaryConfig(provider, model);
            }

            const model =
                stored.geminiModel && isSupportedWebModel(stored.geminiModel)
                    ? stored.geminiModel
                    : fallback;
            return createSummaryConfig(provider, model);
        } catch {
            return createSummaryConfig(config?.DEFAULT_PROVIDER, fallback);
        }
    }

    window.GeminiYouTubeSummaryModel = {
        getStoredSummaryConfig,
        getStoredSummaryModel,
    };
})();
