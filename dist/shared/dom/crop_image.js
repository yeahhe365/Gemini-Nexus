import './crop_global.js';

export async function cropImage(base64, area) {
    return globalThis.GeminiNexusCrop.cropImage(base64, area);
}
