(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelBody = `
        /* --- Window Body --- */

        .window-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 4px 16px 16px 16px;
            overflow: hidden; /* Crucial for internal scroll */
            background: #fff;
            position: relative;
            min-height: 0;
        }

        /* Input Styles */
        .input-container {
            margin-bottom: 12px;
            flex-shrink: 0;
        }

        input[type="text"]#ask-input {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            outline: none;
            color: #1f1f1f;
            background: #fff;
            box-sizing: border-box;
            transition: border-color 0.2s;
            font-family: inherit;
        }
        input[type="text"]#ask-input:focus {
            border-color: #0b57d0;
            box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.1);
        }

        .context-preview {
            font-size: 12px;
            color: #444746;
            background: #f0f4f9;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }
        .context-preview.hidden { display: none; }
        .context-preview::before {
            content: "Context:";
            font-weight: 600;
            margin-right: 6px;
            color: #0b57d0;
        }

        .gemini-error-card {
            padding: 12px 0;
            color: #d93025;
        }
        .gemini-error-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .gemini-error-text {
            font-size: 14px;
            line-height: 1.5;
            color: #1f1f1f;
        }
        .gemini-error-link {
            color: inherit;
            text-decoration: underline;
        }

        .gemini-loading-message {
            margin-top: 10px;
            color: #888;
            font-style: italic;
        }

        .gemini-image-preview {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 15, 15, 0.86);
            cursor: grab;
            overflow: hidden;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.25s ease, visibility 0.25s;
        }
        .gemini-image-preview.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }
        .gemini-image-preview.is-panning {
            cursor: grabbing;
        }
        .gemini-image-preview-img {
            max-width: 92vw;
            max-height: 88vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
            transform-origin: center center;
            user-select: none;
            will-change: transform;
        }
        .gemini-image-preview-close {
            position: fixed;
            top: 16px;
            right: 18px;
            z-index: 1;
            width: 36px;
            height: 36px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.92);
            color: #202124;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
        }
    `;
})();
