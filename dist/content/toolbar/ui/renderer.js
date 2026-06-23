(function () {
    /**
     * Handles the rendering of results in the toolbar window,
     * including Markdown transformation (via Bridge) and Generated Images grid.
     */
    class UIRenderer {
        constructor(view, bridge) {
            this.view = view;
            this.bridge = bridge;
            this.currentResultText = '';
            this.generatedImageWatermarkRemovalEnabled = true;
        }

        /**
         * Renders the text result and optionally processes generated images.
         */
        async show(text, title, isStreaming, images = []) {
            this.currentResultText = text;

            let renderedHtml = text;
            let imageFetchTasks = [];

            if (this.bridge) {
                try {
                    const renderResult = await this.bridge.render(text, isStreaming ? [] : images);
                    renderedHtml = renderResult.html;
                    imageFetchTasks = renderResult.fetchTasks || [];
                } catch {
                    console.warn('Bridge render failed, falling back to simple escape');
                    renderedHtml = text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n/g, '<br>');
                }
            }

            this.view.showResult(renderedHtml, title, isStreaming);

            if (imageFetchTasks.length > 0) {
                this._executeImageFetchTasks(imageFetchTasks);
            }
        }

        _executeImageFetchTasks(tasks) {
            const container = this.view.elements.resultText;
            if (!container) return;

            tasks.forEach((task) => {
                const imageElement = container.querySelector(`img[data-req-id="${task.reqId}"]`);
                if (imageElement) {
                    try {
                        const sendResult = chrome.runtime.sendMessage({
                            action: 'FETCH_GENERATED_IMAGE',
                            url: task.url,
                            reqId: task.reqId,
                        });
                        sendResult
                            ?.then?.((response) => {
                                if (response?.action === 'GENERATED_IMAGE_RESULT') {
                                    this.handleGeneratedImageResult(response);
                                    return;
                                }
                                if (response?.status === 'error') {
                                    throw new Error(
                                        response.error || 'Generated image fetch failed'
                                    );
                                }
                            })
                            ?.catch?.((error) => {
                                console.warn('Generated image fetch request failed:', error);
                                this._markGeneratedImageFailed(imageElement);
                            });
                    } catch (error) {
                        console.warn('Generated image fetch request failed:', error);
                        this._markGeneratedImageFailed(imageElement);
                    }
                }
            });
        }

        _markGeneratedImageFailed(imageElement) {
            imageElement.classList.remove('loading');
            imageElement.style.background = '#ffebee';
            imageElement.alt = 'Failed to load';
        }

        setGeneratedImageWatermarkRemovalEnabled(enabled) {
            this.generatedImageWatermarkRemovalEnabled = enabled !== false;
        }

        async _prepareGeneratedImageBase64(base64Image) {
            if (this.generatedImageWatermarkRemovalEnabled === false) return base64Image;

            const watermarkRemover = globalThis.GeminiNexusWatermarkRemover;
            if (typeof watermarkRemover?.process !== 'function') return base64Image;

            try {
                return await watermarkRemover.process(base64Image);
            } catch (error) {
                console.warn('Generated image watermark removal failed:', error);
                return base64Image;
            }
        }

        async handleGeneratedImageResult(request) {
            const container = this.view.elements.resultText;
            if (!container) return;

            const imageElement = container.querySelector(`img[data-req-id="${request.reqId}"]`);
            if (imageElement) {
                if (request.base64) {
                    imageElement.src = await this._prepareGeneratedImageBase64(request.base64);
                    imageElement.classList.remove('loading');
                    imageElement.style.minHeight = 'auto';
                } else {
                    this._markGeneratedImageFailed(imageElement);
                }
            }
        }

        get currentText() {
            return this.currentResultText;
        }
    }

    window.GeminiUIRenderer = UIRenderer;
})();
