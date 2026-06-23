(function () {
    function generateUUID() {
        if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
            return globalThis.crypto.randomUUID().toUpperCase();
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, (character) => {
                const random = (Math.random() * 16) | 0;
                const value = character === 'x' ? random : (random & 0x3) | 0x8;
                return value.toString(16);
            })
            .toUpperCase();
    }

    function createPrefixedId(prefix) {
        const safePrefix = String(prefix || 'id')
            .replace(/[^A-Za-z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '');
        return `${safePrefix || 'id'}_${generateUUID()}`;
    }

    globalThis.GeminiNexusIds = {
        generateUUID,
        createPrefixedId,
    };
})();
