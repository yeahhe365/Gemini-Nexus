(function () {
    function cropImage(base64, area) {
        return new Promise((resolve, reject) => {
            const imageElement = new Image();
            imageElement.onload = () => {
                const canvas = document.createElement('canvas');
                const canvasContext = canvas.getContext('2d');
                if (!canvasContext) {
                    reject(new Error('Canvas 2D context is unavailable.'));
                    return;
                }

                const scale = area.pixelRatio || 1;
                canvas.width = area.width * scale;
                canvas.height = area.height * scale;

                canvasContext.drawImage(
                    imageElement,
                    area.x * scale,
                    area.y * scale,
                    area.width * scale,
                    area.height * scale,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                resolve(canvas.toDataURL('image/png'));
            };
            imageElement.onerror = () => reject(new Error('Failed to load image for cropping.'));
            imageElement.src = base64;
        });
    }

    globalThis.GeminiNexusCrop = {
        ...(globalThis.GeminiNexusCrop || {}),
        cropImage,
    };
})();
