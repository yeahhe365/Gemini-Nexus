(function () {
    if (window.GeminiNexusGwrBridgeReady === true) return;
    window.GeminiNexusGwrBridgeReady = true;

    const XHR_REQUEST_TYPE = 'GWR_EXTENSION_GM_XHR_REQUEST';
    const XHR_RESPONSE_TYPE = 'GWR_EXTENSION_GM_XHR_RESPONSE';
    const STATE_REQUEST_TYPE = 'GWR_EXTENSION_STATE_REQUEST';
    const STATE_RESPONSE_TYPE = 'GWR_EXTENSION_STATE_RESPONSE';
    const STORAGE_DEFAULTS = {
        geminiGeneratedImageWatermarkRemovalEnabled: true,
    };

    function postStateResponse(requestId, enabled) {
        window.postMessage(
            {
                type: STATE_RESPONSE_TYPE,
                requestId,
                enabled: enabled !== false,
            },
            '*'
        );
    }

    function postXhrResponse(requestId, response) {
        window.postMessage(
            {
                type: XHR_RESPONSE_TYPE,
                requestId,
                response: response || {
                    ok: false,
                    status: 0,
                    statusText: '',
                    headers: {},
                    bytes: [],
                    error: chrome.runtime?.lastError?.message || 'No extension response',
                },
            },
            '*'
        );
    }

    function handleStateRequest(requestId) {
        chrome.storage.local.get(STORAGE_DEFAULTS, (result) => {
            postStateResponse(requestId, result?.geminiGeneratedImageWatermarkRemovalEnabled);
        });
    }

    function handleXhrRequest(data) {
        chrome.runtime.sendMessage(
            {
                action: XHR_REQUEST_TYPE,
                request: data.request || {},
            },
            (response) => {
                postXhrResponse(data.requestId, response);
            }
        );
    }

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        const data = event.data || {};
        if (data.type === STATE_REQUEST_TYPE && data.requestId) {
            handleStateRequest(data.requestId);
            return;
        }

        if (data.type === XHR_REQUEST_TYPE && data.requestId) {
            handleXhrRequest(data);
        }
    });
})();
