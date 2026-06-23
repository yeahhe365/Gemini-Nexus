(function () {
    const TRANSLATION_TARGET_STORAGE_KEY = 'geminiTranslationTargets';

    function getStrings() {
        return window.GeminiToolbarStrings || {};
    }

    function normalizeTranslationTargets(targets) {
        const normalizer = window.GeminiToolbarI18n?.normalizeTranslationTargets;
        if (typeof normalizer === 'function') return normalizer(targets);
        return Array.isArray(targets) && targets.length > 0 ? targets : ['auto'];
    }

    class TranslationTargetStore {
        constructor({
            storage = globalThis.chrome?.storage?.local,
            defaultTargets = getStrings().defaultTranslationTargets || ['auto'],
        } = {}) {
            this.storage = storage;
            this.targets = normalizeTranslationTargets(defaultTargets);
        }

        getTargets() {
            return this.targets;
        }

        normalizeTargets(targets) {
            this.targets = normalizeTranslationTargets(targets);
            return this.targets;
        }

        setTargets(targets) {
            this.normalizeTargets(targets);
            if (this.storage && typeof this.storage.set === 'function') {
                const writeResult = this.storage.set({
                    [TRANSLATION_TARGET_STORAGE_KEY]: this.targets,
                });
                writeResult?.catch?.(() => {});
            }
            return this.targets;
        }

        async restore() {
            if (!this.storage || typeof this.storage.get !== 'function') return this.targets;

            try {
                const stored = await this.storage.get(TRANSLATION_TARGET_STORAGE_KEY);
                this.targets = normalizeTranslationTargets(
                    stored?.[TRANSLATION_TARGET_STORAGE_KEY]
                );
            } catch {}
            return this.targets;
        }
    }

    TranslationTargetStore.STORAGE_KEY = TRANSLATION_TARGET_STORAGE_KEY;
    window.GeminiTranslationTargetStore = TranslationTargetStore;
})();
