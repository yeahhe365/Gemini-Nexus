/**
 * Model ID aliases for the Gemini Official API.
 * Externalized so model renames don't require code changes.
 *
 * Only listed here when the aliased ID is still referenced by saved settings or
 * older releases but is not served by the current `generativelanguage` endpoint.
 */
const OFFICIAL_MODEL_ALIASES = Object.freeze({
    // Gemini 3.1 Pro shipped as a preview endpoint; the API still exposes the
    // preview ID only, so saved GA-style IDs resolve to it.
    'gemini-3.1-pro': 'gemini-3.1-pro-preview',
});

/**
 * Resolve a model alias to its canonical Official API model ID.
 */
export function normalizeOfficialModelId(model) {
    return OFFICIAL_MODEL_ALIASES[model] ?? model;
}
