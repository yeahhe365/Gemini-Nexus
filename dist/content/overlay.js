const OVERLAY_STYLE_ID = 'gemini-nexus-overlay-styles';
const OVERLAY_STYLE_TEXT = `
    .gemini-nexus-capture-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        z-index: 2147483647;
        cursor: crosshair;
        user-select: none;
        overflow: hidden;
    }

    .gemini-nexus-capture-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
        filter: brightness(0.6);
    }

    .gemini-nexus-capture-selection {
        position: fixed;
        border: 2px solid #0b57d0;
        background-color: rgba(11, 87, 208, 0.1);
        display: none;
        pointer-events: none;
        z-index: 2147483648;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
    }

    .gemini-nexus-capture-selection.has-background {
        overflow: hidden;
    }

    .gemini-nexus-capture-selection-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-size: 100vw 100vh;
        background-repeat: no-repeat;
        pointer-events: none;
    }

    .gemini-nexus-capture-hint {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        background: rgba(0, 0, 0, 0.8);
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-family: sans-serif;
        pointer-events: none;
        z-index: 2147483649;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
`;

function ensureOverlayStyles() {
    if (document.getElementById(OVERLAY_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = OVERLAY_STYLE_ID;
    style.textContent = OVERLAY_STYLE_TEXT;
    (document.head || document.documentElement).appendChild(style);
}

function sendRuntimeMessage(message) {
    try {
        const result = chrome.runtime.sendMessage(message);
        result?.catch?.((error) => {
            console.warn('Could not send selected capture area:', error);
        });
    } catch (error) {
        console.warn('Could not send selected capture area:', error);
    }
}

class SelectionOverlay {
    constructor() {
        this.overlay = null;
        this.backgroundImg = null;
        this.selectionBox = null;
        this.hint = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.onCancelCallback = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    start(screenshotBase64 = null, options = {}) {
        this.cleanup();
        this.onCancelCallback = typeof options.onCancel === 'function' ? options.onCancel : null;
        this.createDOM(screenshotBase64);
        this.attachListeners();
    }

    createDOM(screenshotBase64) {
        ensureOverlayStyles();

        this.overlay = document.createElement('div');
        this.overlay.id = 'gemini-nexus-overlay';
        this.overlay.className = 'gemini-nexus-capture-overlay';

        if (screenshotBase64) {
            this.backgroundImg = document.createElement('img');
            this.backgroundImg.src = screenshotBase64;
            this.backgroundImg.className = 'gemini-nexus-capture-background';
            this.overlay.appendChild(this.backgroundImg);
        }

        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'gemini-nexus-capture-selection';

        if (screenshotBase64) {
            const innerImg = document.createElement('div');
            innerImg.className = 'gemini-nexus-capture-selection-image';
            innerImg.style.backgroundImage = `url(${screenshotBase64})`;
            this.selectionBox.appendChild(innerImg);
            this.selectionBox.classList.add('has-background');

            this.innerImgRef = innerImg;
        }

        this.hint = document.createElement('div');

        this.hint.textContent =
            window.GeminiToolbarStrings?.captureHint ||
            'Drag to capture area / Click anywhere to cancel';

        this.hint.className = 'gemini-nexus-capture-hint';

        this.overlay.appendChild(this.selectionBox);
        this.overlay.appendChild(this.hint);
        (document.documentElement || document.body).appendChild(this.overlay);
    }

    attachListeners() {
        this.overlay.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove, { capture: true });
        window.addEventListener('mouseup', this.onMouseUp, { capture: true });
        window.addEventListener('keydown', this.onKeyDown, { capture: true });

        window.addEventListener('click', this.onClick, { capture: true });
        window.addEventListener('contextmenu', this.onClick, { capture: true });
    }

    cleanup() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        window.removeEventListener('mousemove', this.onMouseMove, true);
        window.removeEventListener('mouseup', this.onMouseUp, true);
        window.removeEventListener('keydown', this.onKeyDown, true);

        setTimeout(() => {
            window.removeEventListener('click', this.onClick, true);
            window.removeEventListener('contextmenu', this.onClick, true);
        }, 100);

        this.overlay = null;
        this.selectionBox = null;
        this.backgroundImg = null;
        this.innerImgRef = null;
    }

    cancel() {
        const onCancel = this.onCancelCallback;
        this.isDragging = false;
        this.cleanup();
        this.onCancelCallback = null;
        if (onCancel) onCancel();
    }

    onMouseDown(pointerEvent) {
        if (pointerEvent.button !== 0) return;
        pointerEvent.preventDefault();
        pointerEvent.stopPropagation();

        this.isDragging = true;
        this.startX = pointerEvent.clientX;
        this.startY = pointerEvent.clientY;

        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = this.startX + 'px';
        this.selectionBox.style.top = this.startY + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';

        if (this.innerImgRef) {
            this.innerImgRef.style.marginLeft = `-${this.startX}px`;
            this.innerImgRef.style.marginTop = `-${this.startY}px`;
        }

        this.hint.style.display = 'none';
    }

    onMouseMove(pointerEvent) {
        if (!this.isDragging) return;
        pointerEvent.preventDefault();
        pointerEvent.stopPropagation();

        const currentX = pointerEvent.clientX;
        const currentY = pointerEvent.clientY;

        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);

        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';

        if (this.innerImgRef) {
            this.innerImgRef.style.marginLeft = `-${left}px`;
            this.innerImgRef.style.marginTop = `-${top}px`;
        }
    }

    onMouseUp(pointerEvent) {
        if (!this.isDragging) return;
        pointerEvent.preventDefault();
        pointerEvent.stopPropagation();
        this.isDragging = false;

        const rect = this.selectionBox.getBoundingClientRect();

        if (rect.width < 5 || rect.height < 5) {
            this.cancel();
            return;
        }

        this.cleanup();
        this.onCancelCallback = null;

        setTimeout(() => {
            sendRuntimeMessage({
                action: 'AREA_SELECTED',
                area: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    pixelRatio: window.devicePixelRatio,
                },
            });
        }, 50);
    }

    onKeyDown(keyEvent) {
        if (keyEvent.key === 'Escape') {
            keyEvent.preventDefault();
            keyEvent.stopPropagation();
            this.cancel();
        }
    }

    onClick(clickEvent) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
    }
}

window.GeminiNexusOverlay = SelectionOverlay;
