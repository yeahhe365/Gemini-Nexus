(function () {
    const ICONS = window.GeminiToolbarIcons || {};

    class ImagePreviewController {
        constructor({ resultText, askWindow }) {
            this.resultText = resultText;
            this.askWindow = askWindow;
            this.imagePreview = null;
            this.previewImage = null;
            this.previewState = this.createInitialState();
            this.bindResultImagePreview();
        }

        createInitialState() {
            return {
                scale: 1,
                pointX: 0,
                pointY: 0,
                panning: false,
                startX: 0,
                startY: 0,
            };
        }

        bindResultImagePreview() {
            if (!this.resultText) return;

            this.resultText.addEventListener('click', (event) => {
                const imageElement = event.target?.closest?.(
                    '.generated-image, .markdown-body img'
                );
                if (!imageElement || !this.resultText.contains(imageElement)) return;
                if (imageElement.classList.contains('loading')) return;

                const src = imageElement.currentSrc || imageElement.src;
                if (!src || src.startsWith('data:image/svg+xml')) return;

                event.preventDefault();
                event.stopPropagation();
                this.open(src, imageElement.alt || 'Image');
            });
        }

        ensurePreview() {
            if (this.imagePreview) return this.imagePreview;

            const preview = document.createElement('div');
            preview.className = 'gemini-image-preview';
            preview.setAttribute('role', 'dialog');
            preview.setAttribute('aria-modal', 'true');
            preview.hidden = true;

            const image = document.createElement('img');
            image.className = 'gemini-image-preview-img';
            image.draggable = false;

            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'gemini-image-preview-close';
            closeButton.setAttribute('aria-label', 'Close image preview');
            closeButton.innerHTML = ICONS.CLOSE || 'x';

            preview.appendChild(image);
            preview.appendChild(closeButton);

            preview.addEventListener('click', (event) => {
                if (event.target === preview) this.close();
            });
            closeButton.addEventListener('mousedown', (event) => {
                event.stopPropagation();
            });
            closeButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.close();
            });
            preview.addEventListener('wheel', (event) => this.handleWheel(event), {
                passive: false,
            });
            preview.addEventListener('mousedown', (event) => this.startPan(event));
            document.addEventListener('mousemove', (event) => this.pan(event));
            document.addEventListener('mouseup', () => this.endPan());
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && preview.classList.contains('visible')) {
                    this.close();
                }
            });

            const parent = this.askWindow?.parentNode || document.body;
            parent.appendChild(preview);
            this.imagePreview = preview;
            this.previewImage = image;
            return preview;
        }

        open(src, alt) {
            const preview = this.ensurePreview();
            this.previewImage.src = src;
            this.previewImage.alt = alt;
            preview.hidden = false;
            preview.classList.add('visible');
            this.resetTransform();
        }

        close() {
            if (!this.imagePreview) return;
            this.imagePreview.classList.remove('visible');
            this.imagePreview.hidden = true;
            if (this.previewImage) this.previewImage.removeAttribute('src');
            this.resetState();
        }

        resetState() {
            this.previewState = this.createInitialState();
        }

        resetTransform() {
            this.previewState.scale = 1;
            this.previewState.pointX = 0;
            this.previewState.pointY = 0;
            this.updateTransform();
        }

        updateTransform() {
            if (!this.previewImage) return;
            const { pointX, pointY, scale } = this.previewState;
            this.previewImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        }

        handleWheel(event) {
            event.preventDefault();
            const direction = event.deltaY < 0 ? 1 : -1;
            const nextScale = this.previewState.scale + direction * 0.1;
            this.previewState.scale = Math.min(Math.max(nextScale, 0.2), 5);
            this.updateTransform();
        }

        startPan(event) {
            if (event.button !== 0 || event.target?.closest?.('.gemini-image-preview-close')) {
                return;
            }
            event.preventDefault();
            this.previewState.panning = true;
            this.previewState.startX = event.clientX - this.previewState.pointX;
            this.previewState.startY = event.clientY - this.previewState.pointY;
            if (this.imagePreview) this.imagePreview.classList.add('is-panning');
        }

        pan(event) {
            if (!this.previewState.panning) return;
            event.preventDefault();
            this.previewState.pointX = event.clientX - this.previewState.startX;
            this.previewState.pointY = event.clientY - this.previewState.startY;
            this.updateTransform();
        }

        endPan() {
            this.previewState.panning = false;
            if (this.imagePreview) this.imagePreview.classList.remove('is-panning');
        }
    }

    window.GeminiImagePreviewController = ImagePreviewController;
})();
