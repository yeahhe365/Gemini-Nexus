(function () {
    const catalog = window.GeminiNexusWebModelCatalog;

    function createOptions() {
        return catalog.createWebModelOptions();
    }

    function createOptionMarkup() {
        return catalog.createWebModelOptionMarkup();
    }

    function resolveImagePromptModel(model) {
        return model || catalog.DEFAULT_WEB_MODEL;
    }

    function normalizeModel(model) {
        return catalog.normalizeWebModel(model);
    }

    window.GeminiWebModels = {
        DEFAULT_WEB_MODEL: catalog.DEFAULT_WEB_MODEL,
        createOptions,
        createOptionMarkup,
        normalizeModel,
        resolveImagePromptModel,
    };
})();
