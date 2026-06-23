import { respondWithUiTask } from './ui_async.js';

const GEMINI_PAGE_ORIGINS = new Set([
    'https://gemini.google.com',
    'https://business.gemini.google',
]);

function isGeminiPageSender(sender) {
    try {
        return GEMINI_PAGE_ORIGINS.has(new URL(sender?.tab?.url || '').origin);
    } catch {
        return false;
    }
}

function isExtensionPageSender(sender) {
    return !sender?.tab;
}

export function handleFetchImage(context, request, sender, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const payload = {
                ...(await context.imageHandler.fetchImage(request.url)),
                tabId: context.getTargetSidePanelTabId(request, sender),
            };

            if (isExtensionPageSender(sender)) return payload;

            await context.sendToRequestSource(sender, payload);
        },
        { errorLabel: 'Fetch image error' }
    );
}

function normalizeRequestHeaders(headers = {}) {
    if (!headers || typeof headers !== 'object') return {};

    return Object.fromEntries(
        Object.entries(headers)
            .filter(([name, value]) => name && value != null)
            .map(([name, value]) => [name, String(value)])
    );
}

function createGwrErrorResponse(request, error) {
    return {
        ok: false,
        finalUrl: request?.url || '',
        status: 0,
        statusText: '',
        headers: {},
        bytes: [],
        error: error?.message || String(error),
    };
}

export function handleGwrExtensionXhrRequest(context, request, sender, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const xhrRequest = request.request || {};

            if (!isGeminiPageSender(sender)) {
                return createGwrErrorResponse(xhrRequest, new Error('Unsupported sender'));
            }

            try {
                const response = await fetch(xhrRequest.url, {
                    method: xhrRequest.method || 'GET',
                    headers: normalizeRequestHeaders(xhrRequest.headers),
                    body: xhrRequest.data ?? undefined,
                    credentials: 'omit',
                    redirect: 'follow',
                });
                const bytes = Array.from(new Uint8Array(await response.arrayBuffer()));

                return {
                    ok: response.ok,
                    finalUrl: response.url || '',
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    bytes,
                };
            } catch (error) {
                return createGwrErrorResponse(xhrRequest, error);
            }
        },
        { errorLabel: 'GWR extension XHR request error' }
    );
}

export function handleFetchGeneratedImage(context, request, sender, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const result = await context.imageHandler.fetchImage(request.url);
            const payload = {
                action: 'GENERATED_IMAGE_RESULT',
                tabId: context.getTargetSidePanelTabId(request, sender),
                reqId: request.reqId,
                base64: result.base64,
                error: result.error,
            };

            if (isExtensionPageSender(sender)) return payload;

            await context.sendToRequestSource(sender, payload);
        },
        { errorLabel: 'Fetch generated image error' }
    );
}
