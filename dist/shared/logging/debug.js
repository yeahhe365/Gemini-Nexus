export function debugLog(...args) {
    if (globalThis.GeminiNexusDebug === true) {
        console.debug(...args);
    }
}
