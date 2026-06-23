import { getDataUrlMime, normalizeUserAttachments } from '../../shared/attachments/index.js';

function normalizeImageFetchResult(base64, type, name) {
    const [attachment] = normalizeUserAttachments([
        {
            base64,
            type: type || getDataUrlMime(base64),
            name,
        },
    ]);

    return {
        base64: attachment?.base64 || base64,
        type: attachment?.type || type || getDataUrlMime(base64) || 'application/octet-stream',
        name: attachment?.name || name,
    };
}

export class ImageManager {
    async fetchImage(url) {
        try {
            if (url.startsWith('data:')) {
                const matches = url.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    const image = normalizeImageFetchResult(url, matches[1], 'dropped_image.png');
                    return {
                        action: 'FETCH_IMAGE_RESULT',
                        ...image,
                    };
                }
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Fetch failed: ' + response.statusText);

            const blob = await response.blob();
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const image = normalizeImageFetchResult(base64, blob.type, 'web_image.png');
            return {
                action: 'FETCH_IMAGE_RESULT',
                ...image,
            };
        } catch (error) {
            return {
                action: 'FETCH_IMAGE_RESULT',
                error: error.message,
            };
        }
    }

    _captureTab(windowId) {
        return new Promise((resolve) => {
            // Use explicit windowId if provided to ensure correct window is captured
            chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    console.error('Capture failed:', chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(dataUrl);
                }
            });
        });
    }

    async captureScreenshot(windowId) {
        const dataUrl = await this._captureTab(windowId);

        if (!dataUrl) {
            return {
                action: 'FETCH_IMAGE_RESULT',
                error: 'Capture failed',
            };
        }

        return {
            action: 'FETCH_IMAGE_RESULT',
            base64: dataUrl,
            type: 'image/png',
            name: 'screenshot.png',
        };
    }

    async captureArea(area, windowId) {
        const dataUrl = await this._captureTab(windowId);

        if (!dataUrl) {
            return null;
        }

        return {
            action: 'CROP_SCREENSHOT',
            image: dataUrl,
            area: area,
        };
    }
}
