/**
 * "No-Auth Gemini" provider — embedded port of the gemini-web2api anonymous
 * StreamGenerate protocol (gemini_web2api/gemini.py + models.py).
 *
 * Talks directly to gemini.google.com without any API key, Google sign-in,
 * or a separate local server. bl (build label) is auto-fetched from the
 * page, mirroring web2api's auto-update + 405 retry.
 *
 * ponytail: single-turn protocol; multi-turn is simulated by folding history
 * into the prompt (same as web2api). Image/file upload needs a signed-in
 * session, so attachment input is rejected with a clear hint.
 */
import { debugLog } from '../../shared/logging/debug.js';
import { DEFAULT_NOAUTH_MODEL } from '../../shared/config/constants.js';

// MODE_CATEGORY enum from Gemini frontend JS (gemini-web2api models.py):
// 1=FAST 2=THINKING 3=PRO 4=AUTO 5=FAST_DYNAMIC_THINKING 6=FLASH_LITE
const MODELS = Object.freeze({
    'gemini-3.7-flash': Object.freeze({ mode: 1, think: 4 }),
    'gemini-3.6-flash': Object.freeze({ mode: 1, think: 4 }),
    'gemini-3.5-flash': Object.freeze({ mode: 1, think: 4 }),
    'gemini-3.5-flash-thinking': Object.freeze({ mode: 2, think: 0 }),
    'gemini-3.1-pro': Object.freeze({ mode: 3, think: 4 }),
    'gemini-3.1-pro-enhanced': Object.freeze({ mode: 3, think: 4, extra: { 31: 2, 80: 3 } }),
    'gemini-auto': Object.freeze({ mode: 4, think: 4 }),
    'gemini-3.5-flash-thinking-lite': Object.freeze({ mode: 5, think: 0 }),
    'gemini-flash-lite': Object.freeze({ mode: 6, think: 4 }),
});

const FALLBACK_BL = 'boq_assistant-bard-web-server_20260716.08_p0';
const BL_PATTERN = /(boq_assistant-bard-web-server_\d+\.\d+_p\d+)/;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

let cachedBl = '';

function resolveModel(modelName) {
    let name = String(modelName || '').trim() || DEFAULT_NOAUTH_MODEL;
    let thinkOverride = null;
    const thinkIdx = name.indexOf('@think=');
    if (thinkIdx !== -1) {
        const suffix = name.slice(thinkIdx + '@think='.length);
        name = name.slice(0, thinkIdx);
        const parsed = Number.parseInt(suffix, 10);
        if (Number.isFinite(parsed)) thinkOverride = parsed;
    }
    const cfg = MODELS[name];
    if (!cfg) {
        const fallback = MODELS[DEFAULT_NOAUTH_MODEL];
        debugLog(
            `[No-Auth Gemini] Unknown model '${name}', falling back to '${DEFAULT_NOAUTH_MODEL}'`
        );
        return {
            ...fallback,
            modelId: fallback.mode,
            thinkMode: thinkOverride ?? fallback.think,
        };
    }
    return { ...cfg, modelId: cfg.mode, thinkMode: thinkOverride ?? cfg.think };
}

async function fetchLatestBl() {
    try {
        const response = await fetch('https://gemini.google.com/app', {
            headers: { 'User-Agent': USER_AGENT },
            credentials: 'omit',
        });
        if (!response.ok) return null;
        const html = await response.text();
        const match = html.match(BL_PATTERN);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

async function getBl(forceRefresh = false) {
    if (!cachedBl || forceRefresh) {
        const latest = await fetchLatestBl();
        if (latest) cachedBl = latest;
    }
    return cachedBl || FALLBACK_BL;
}

function buildPayload(prompt, modelId, thinkMode, fileRefs, extraFields) {
    const inner = new Array(102).fill(null);
    if (fileRefs && fileRefs.length > 0) {
        inner[0] = [prompt, 0, null, fileRefs.map((ref) => [null, null, ref]), null, null, 0];
    } else {
        inner[0] = [prompt, 0, null, null, null, null, 0];
    }
    inner[1] = ['en'];
    inner[2] = ['', '', '', null, null, null, null, null, null, ''];
    inner[6] = [0];
    inner[7] = 1;
    inner[10] = 1;
    inner[11] = 0;
    inner[17] = [[thinkMode]];
    inner[18] = 0;
    inner[27] = 1;
    inner[30] = [4];
    inner[41] = [2]; // persist to account history (web2api temporary_chats=false)
    inner[53] = 0;
    inner[59] = crypto.randomUUID();
    inner[61] = [];
    inner[68] = 1;
    inner[79] = modelId;
    if (extraFields) {
        for (const [key, value] of Object.entries(extraFields)) inner[key] = value;
    }
    const outer = [null, JSON.stringify(inner)];
    return new URLSearchParams({ 'f.req': JSON.stringify(outer) });
}

function cleanText(text, strip = true) {
    let cleaned = String(text || '').replace(
        /```(?:python|javascript|text)\?code_(?:reference|stdout)&code_event_index=\d+\n.*?```\n?/gs,
        ''
    );
    cleaned = cleaned.replace(/http:\/\/googleusercontent\.com\/card_content\/\d+\n?/g, '');
    return strip ? cleaned.trim() : cleaned;
}

function extractTextsFromLine(line) {
    if (!line.includes('"wrb.fr"') || line.length < 200) return [];
    try {
        const arr = JSON.parse(line);
        const innerStr = arr?.[0]?.[2];
        if (!innerStr || innerStr.length < 50) return [];
        const inner = JSON.parse(innerStr);
        if (!Array.isArray(inner) || inner.length <= 4 || !inner[4]) return [];
        const texts = [];
        for (const part of inner[4]) {
            if (Array.isArray(part) && part.length > 1 && part[1] && Array.isArray(part[1])) {
                for (const t of part[1]) {
                    if (typeof t === 'string' && t) texts.push(t);
                }
            }
        }
        return texts;
    } catch {
        return [];
    }
}

function buildEndpoint(bl) {
    const params = new URLSearchParams({
        bl,
        hl: 'en',
        _reqid: String(Date.now() % 1000000),
        rt: 'c',
    });
    return `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${params.toString()}`;
}

function buildHeaders() {
    return {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://gemini.google.com',
        Referer: 'https://gemini.google.com/app',
        'X-Same-Domain': '1',
        'User-Agent': USER_AGENT,
    };
}

export function resolveNoAuthModel(modelName) {
    return resolveModel(modelName);
}

/**
 * Sends a single message through the anonymous StreamGenerate protocol.
 * Returns { text } or { text, truncated: true, error } on mid-stream failure.
 */
export async function sendNoAuthGeminiMessage(
    prompt,
    model,
    files,
    signal,
    onUpdate,
    options = {}
) {
    if (Array.isArray(files) && files.length > 0) {
        throw new Error(
            'No-Auth Gemini does not support image/file input (anonymous upload requires a signed-in session). Use Gemini Web or an API provider for image input.'
        );
    }

    const { modelId, thinkMode, extra } = resolveModel(model);
    const body = buildPayload(prompt, modelId, thinkMode, options.fileRefs || null, extra);

    // One retry after refreshing bl on upstream rejection (405 / BardErrorInfo),
    // matching gemini-web2api's auto-update behaviour.
    for (let attempt = 0; attempt < 2; attempt++) {
        const bl = await getBl(attempt === 1);
        debugLog(`[No-Auth Gemini] POST StreamGenerate (${bl}, attempt ${attempt + 1})`);

        let response;
        try {
            response = await fetch(buildEndpoint(bl), {
                method: 'POST',
                signal,
                headers: buildHeaders(),
                credentials: 'omit',
                body,
            });
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            throw new Error(`Failed to fetch Gemini upstream: ${error.message || error}`);
        }

        if (response.status === 405) {
            if (attempt === 0) continue;
            throw new Error('Gemini upstream rejected request: HTTP 405');
        }
        if (!response.ok) {
            throw new Error(`Network Error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let emittedRawText = '';
        let streamError = null;

        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                if (buffer.includes('BardErrorInfo')) {
                    const m = buffer.match(/BardErrorInfo\s*\[(\d+)\]/);
                    throw new Error(
                        `Gemini upstream rejected request: BardErrorInfo${m ? ` [${m[1]}]` : ''}`
                    );
                }

                let newlineIndex;
                while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, newlineIndex);
                    buffer = buffer.slice(newlineIndex + 1);
                    for (const t of extractTextsFromLine(line)) {
                        if (t === emittedRawText || emittedRawText.startsWith(t)) continue;
                        if (!t.startsWith(emittedRawText)) {
                            throw new Error('Gemini stream content changed during retry');
                        }
                        emittedRawText = t;
                        if (onUpdate) onUpdate(cleanText(emittedRawText), undefined);
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            if (attempt === 0 && /BardErrorInfo/.test(error.message)) {
                continue; // refresh bl and retry
            }
            streamError = error; // includes upstream rejection on final attempt
        }

        // Tail: a final line may end without a trailing newline.
        if (buffer.length > 0) {
            for (const t of extractTextsFromLine(buffer)) {
                if (t.startsWith(emittedRawText) && t !== emittedRawText) {
                    emittedRawText = t;
                    if (onUpdate) onUpdate(cleanText(emittedRawText), undefined);
                }
            }
        }

        if (!emittedRawText) {
            if (/BardErrorInfo/.test(String(streamError?.message || ''))) {
                throw streamError;
            }
            const hint = buffer.includes('Sign in') ? ' (session required?)' : '';
            throw new Error(
                `No valid response found. Check network.${hint}${
                    streamError ? ` (stream error: ${streamError.message || streamError})` : ''
                }`
            );
        }

        if (streamError) {
            return { text: cleanText(emittedRawText), truncated: true, error: streamError };
        }

        return { text: cleanText(emittedRawText) };
    }

    throw new Error('Gemini upstream rejected request (retry exhausted).');
}
