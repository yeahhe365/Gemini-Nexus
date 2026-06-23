import './constants_global.js';

const config = globalThis.GeminiNexusConfig;

export const DEFAULT_SHORTCUTS = config.DEFAULT_SHORTCUTS;
export const normalizeShortcutDefaults = config.normalizeShortcutDefaults;
export const DEFAULT_PROVIDER = config.DEFAULT_PROVIDER;
export const DEFAULT_STORED_GEMINI_MODEL = config.DEFAULT_STORED_GEMINI_MODEL;
export const DEFAULT_OFFICIAL_MODEL = config.DEFAULT_OFFICIAL_MODEL;
export const DEFAULT_OFFICIAL_MODELS = config.DEFAULT_OFFICIAL_MODELS;
export const DEFAULT_OFFICIAL_BASE_URL = config.DEFAULT_OFFICIAL_BASE_URL;
export const DEFAULT_OPENAI_MODEL = config.DEFAULT_OPENAI_MODEL;
export const DEFAULT_THINKING_LEVEL = config.DEFAULT_THINKING_LEVEL;
export const DEFAULT_CONTEXT_MODE = config.DEFAULT_CONTEXT_MODE;
export const DEFAULT_CONTEXT_RECENT_TURNS = config.DEFAULT_CONTEXT_RECENT_TURNS;
export const CONTEXT_RECENT_TURNS_LIMITS = config.CONTEXT_RECENT_TURNS_LIMITS;
export const DEFAULT_SIDE_PANEL_SCOPE = config.DEFAULT_SIDE_PANEL_SCOPE;
export const DEFAULT_MCP_TRANSPORT = config.DEFAULT_MCP_TRANSPORT;
export const DEFAULT_MCP_HTTP_URL = config.DEFAULT_MCP_HTTP_URL;
export const DEFAULT_MCP_SSE_URL = config.DEFAULT_MCP_SSE_URL;
export const DEFAULT_MCP_WS_URL = config.DEFAULT_MCP_WS_URL;
export const DEDICATED_API_PROVIDERS = config.DEDICATED_API_PROVIDERS;
export const DEDICATED_API_PROVIDER_IDS = config.DEDICATED_API_PROVIDER_IDS;

export function normalizeContextRecentTurns(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return CONTEXT_RECENT_TURNS_LIMITS.DEFAULT;

    return Math.min(
        CONTEXT_RECENT_TURNS_LIMITS.MAX,
        Math.max(CONTEXT_RECENT_TURNS_LIMITS.MIN, parsed)
    );
}
