export function extractFromHTML(variableName, html) {
    const regex = new RegExp(`"${variableName}":"([^"]+)"`);
    const match = regex.exec(html);
    return match?.[1];
}

export function generateUUID() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID().toUpperCase();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, (placeholder) => {
            const randomNibble = (Math.random() * 16) | 0;
            const uuidNibble = placeholder === 'x' ? randomNibble : (randomNibble & 0x3) | 0x8;
            return uuidNibble.toString(16);
        })
        .toUpperCase();
}

export function createPrefixedId(prefix) {
    const safePrefix = String(prefix || 'id')
        .replace(/[^A-Za-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return `${safePrefix || 'id'}_${generateUUID()}`;
}

export async function dataUrlToBlob(dataUrl) {
    try {
        const parts = dataUrl.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const binaryString = atob(parts[1]);
        const bytes = new Uint8Array(binaryString.length);

        for (let index = 0; index < binaryString.length; index++) {
            bytes[index] = binaryString.charCodeAt(index);
        }

        return new Blob([bytes], { type: mimeType });
    } catch (error) {
        throw new Error('Failed to convert data URL to Blob: ' + error.message);
    }
}

export function getHighResImageUrl(url) {
    if (!url) return null;

    // Robustly replace or append size parameter
    const parts = url.split('?');
    let base = parts[0];
    const query = parts.slice(1).join('?');

    // Remove any existing sizing parameter from the path, such as =w500-h500 or =s1024.
    base = base.replace(/=[a-zA-Z0-9_-]+$/, '');

    base += '=s0';

    return base + (query ? '?' + query : '');
}
