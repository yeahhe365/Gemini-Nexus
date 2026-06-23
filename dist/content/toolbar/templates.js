(function () {
    const ICONS = window.GeminiToolbarIcons || {};
    // Combine modular styles (loaded previously)
    const STYLES = window.GeminiToolbarStyles || '';
    const WEB_MODEL_OPTIONS = window.GeminiWebModels.createOptionMarkup();

    function buildTranslationTargetOptions(toolbarStrings) {
        const options = toolbarStrings.translationTargetOptions || [];
        return options
            .map(
                (option) => `
                    <label class="translation-target-option">
                        <input type="checkbox" name="translation-target" value="${option.value}" ${option.value === 'auto' ? 'checked' : ''}>
                        <div class="selection-check">
                            ${ICONS.CHECK}
                        </div>
                        <span>${option.label}</span>
                    </label>
                `
            )
            .join('');
    }

    function getDefaultTranslationTargetLabel(toolbarStrings) {
        return (
            (toolbarStrings.translationTargetOptions || []).find(
                (option) => option.value === 'auto'
            )?.label || 'Auto'
        );
    }

    function buildTranslationTargetMarkup(toolbarStrings) {
        return `
            <div class="translation-targets hidden" id="translation-targets" aria-label="${toolbarStrings.translateTargetLabel}">
                <span class="translation-targets-label">${toolbarStrings.translateTargetLabel}</span>
                <div class="translation-target-dropdown" id="translation-target-dropdown">
                    <button type="button" class="translation-target-trigger" id="translation-target-trigger" aria-haspopup="true" aria-expanded="false">
                        <span class="translation-target-summary" id="translation-target-summary">${getDefaultTranslationTargetLabel(toolbarStrings)}</span>
                        <span class="translation-target-caret" aria-hidden="true">${ICONS.CHEVRON_RIGHT}</span>
                    </button>
                    <div class="translation-target-menu hidden" id="translation-target-menu">
                        <div class="translation-target-options" id="translation-target-options">
                            ${buildTranslationTargetOptions(toolbarStrings)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function buildMainStructure() {
        const toolbarStrings = window.GeminiToolbarStrings || {};
        const toolbarHTML = `
        <div class="toolbar" id="toolbar">
            <div class="toolbar-drag-handle" id="toolbar-drag">${ICONS.DRAG}</div>
            <button class="btn" id="btn-ask" title="${toolbarStrings.askAi}">${ICONS.LOGO}</button>
            <button class="btn" id="btn-copy" title="${toolbarStrings.copy}">${ICONS.COPY}</button>
            <button class="btn hidden" id="btn-grammar" title="${toolbarStrings.fixGrammar}">${ICONS.GRAMMAR}</button>
            <button class="btn" id="btn-translate" title="${toolbarStrings.translate}">${ICONS.TRANSLATE}</button>
            <button class="btn" id="btn-explain" title="${toolbarStrings.explain}">${ICONS.EXPLAIN}</button>
            <button class="btn" id="btn-summarize" title="${toolbarStrings.summarize}">${ICONS.SUMMARIZE}</button>
            <button class="btn" id="btn-generate-image" title="${toolbarStrings.generateImage}">${ICONS.IMAGE_SPARKLE}</button>
            <button class="btn" id="btn-read-selection" title="${toolbarStrings.readSelection}">${ICONS.SPEAKER}</button>
            <div class="custom-selection-tools" id="custom-selection-tools"></div>
            <div class="custom-selection-more hidden" id="custom-selection-more">
                <button class="btn" id="btn-custom-selection-more" title="${toolbarStrings.customSelectionMore || 'More custom tools'}">${ICONS.TOOLS}</button>
                <div class="custom-selection-more-menu" id="custom-selection-more-menu"></div>
            </div>
        </div>
    `;

        const imageMenuHTML = `
        <div class="image-btn" id="image-btn">
            <div class="ai-tool-trigger" title="${toolbarStrings.aiTools}">
                ${ICONS.LOGO}
            </div>
            <div class="ai-tool-menu">
                <div class="menu-item" id="btn-image-chat">
                    ${ICONS.CHAT_BUBBLE} <span>${toolbarStrings.chatWithImage}</span>
                </div>
                <div class="menu-item" id="btn-image-describe">
                    ${ICONS.IMAGE_EYE} <span>${toolbarStrings.describeImage}</span>
                </div>
                <div class="menu-item" id="btn-image-extract">
                    ${ICONS.SCAN_TEXT} <span>${toolbarStrings.extractText}</span>
                </div>
                <div class="menu-item" id="btn-image-translate">
                    ${ICONS.TRANSLATE} <span>${toolbarStrings.translateImageText}</span>
                </div>

                <div class="menu-item has-submenu">
                    ${ICONS.TOOLS} <span>${toolbarStrings.imageTools}</span>
                    <div class="submenu-arrow">${ICONS.CHEVRON_RIGHT}</div>

                    <div class="submenu">
                        <div class="menu-item" id="btn-image-remove-bg">${ICONS.REMOVE_BG} <span>${toolbarStrings.removeBg}</span></div>
                        <div class="menu-item" id="btn-image-remove-text">${ICONS.REMOVE_TEXT} <span>${toolbarStrings.removeText}</span></div>
                        <div class="menu-item" id="btn-image-remove-watermark">${ICONS.REMOVE_WATERMARK} <span>${toolbarStrings.removeWatermark}</span></div>
                        <div class="menu-item" id="btn-image-upscale">${ICONS.UPSCALE} <span>${toolbarStrings.upscale}</span></div>
                        <div class="menu-item" id="btn-image-expand">${ICONS.EXPAND} <span>${toolbarStrings.expand}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;

        const windowHTML = `
        <div class="ask-window" id="ask-window">
            <div class="ask-header" id="ask-header">
                <div class="header-title-group">
                    <span class="window-title" id="window-title">${toolbarStrings.windowTitle}</span>
                    ${buildTranslationTargetMarkup(toolbarStrings)}
                </div>
                <div class="header-actions">
                    <select id="ask-provider-select" class="ask-provider-select" title="${toolbarStrings.toolbarProviderLabel || 'Popup provider'}">
                        <option value="web">${toolbarStrings.providerWebShort || 'Web'}</option>
                        <option value="official">${toolbarStrings.providerOfficialShort || 'API'}</option>
                        <option value="openai">${toolbarStrings.providerOpenAIShort || 'OpenAI'}</option>
                        <option value="openai_official">${toolbarStrings.providerOpenAIOfficialShort || 'OpenAI API'}</option>
                        <option value="deepseek">${toolbarStrings.providerDeepSeekShort || 'DeepSeek'}</option>
                        <option value="openrouter">${toolbarStrings.providerOpenRouterShort || 'OpenRouter'}</option>
                        <option value="dashscope">${toolbarStrings.providerDashScopeShort || 'DashScope'}</option>
                        <option value="anthropic">${toolbarStrings.providerAnthropicShort || 'Anthropic'}</option>
                        <option value="zhipu">${toolbarStrings.providerZhipuShort || 'Zhipu'}</option>
                    </select>
                    <select id="ask-model-select" class="ask-model-select">
                        ${WEB_MODEL_OPTIONS}
                    </select>
                    <button class="ask-thinking-toggle" id="ask-thinking-toggle" type="button" hidden title="${toolbarStrings.toolbarThinkingToggleAria || 'Toggle thinking level'}" aria-label="${toolbarStrings.toolbarThinkingToggleAria || 'Toggle thinking level'}" aria-pressed="false">
                        ${ICONS.ZAP}
                    </button>
                    <button class="icon-btn" id="btn-header-close" title="${toolbarStrings.close}">${ICONS.CLOSE}</button>
                </div>
            </div>

            <div class="window-body">
                <div class="input-container">
                    <input type="text" id="ask-input" placeholder="${toolbarStrings.askPlaceholder}" autocomplete="off">
                </div>

                <div class="context-preview hidden" id="context-preview"></div>

                <div class="result-area" id="result-area">
                    <div class="markdown-body" id="result-text"></div>
                </div>
            </div>

            <div class="window-footer" id="window-footer">
                <div class="footer-actions hidden" id="footer-actions">
                    <div class="footer-left">
                        <button class="footer-btn" id="btn-retry" title="${toolbarStrings.retry}">
                            ${ICONS.RETRY}
                        </button>
                        <button class="footer-btn text-btn" id="btn-continue-chat" title="${toolbarStrings.openSidebar}">
                            ${ICONS.CONTINUE} <span>${toolbarStrings.chat}</span>
                        </button>
                    </div>
                    <div class="footer-right">
                        <button class="footer-btn text-btn hidden" id="btn-insert" title="${toolbarStrings.insertTooltip}">
                            ${ICONS.INSERT} <span>${toolbarStrings.insert}</span>
                        </button>
                        <button class="footer-btn text-btn hidden" id="btn-replace" title="${toolbarStrings.replaceTooltip}">
                            ${ICONS.REPLACE} <span>${toolbarStrings.replace}</span>
                        </button>
                         <button class="footer-btn" id="btn-copy-result" title="${toolbarStrings.copyResult}">
                            ${ICONS.COPY}
                        </button>
                    </div>
                </div>

                <div class="footer-stop hidden" id="footer-stop">
                    <button class="stop-pill-btn" id="btn-stop-gen">
                        ${ICONS.STOP} ${toolbarStrings.stopGenerating}
                    </button>
                </div>
            </div>
        </div>
    `;

        return `
            <style>${STYLES}</style>
            ${toolbarHTML}
            ${imageMenuHTML}
            ${windowHTML}
        `;
    }

    window.GeminiToolbarTemplates = {
        get mainStructure() {
            return buildMainStructure();
        },
    };
})();
