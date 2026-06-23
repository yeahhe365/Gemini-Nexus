(function () {
    const RUNTIME_NAME = '__gwrPageProcessRuntimeInstalled__';
    const PROCESS_OPTIONS = { adaptiveMode: 'always' };

    function getRuntime() {
        const runtime = globalThis[RUNTIME_NAME];
        if (typeof runtime?.removeWatermarkFromBlob !== 'function') {
            throw new Error('Gemini watermark remover runtime is unavailable');
        }
        return runtime;
    }

    async function dataUrlToBlob(dataUrl) {
        return await (await fetch(dataUrl)).blob();
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Failed to read image blob'));
            reader.readAsDataURL(blob);
        });
    }

    async function removeWatermark(base64Image) {
        const processedBlob = await removeWatermarkFromBlob(await dataUrlToBlob(base64Image));
        return await blobToDataUrl(processedBlob);
    }

    async function removeWatermarkFromBlob(blob) {
        return await getRuntime().removeWatermarkFromBlob(blob, PROCESS_OPTIONS);
    }

    globalThis.GeminiNexusWatermarkRemover = {
        ...(globalThis.GeminiNexusWatermarkRemover || {}),
        process: removeWatermark,
        processBlob: removeWatermarkFromBlob,
    };
})();
