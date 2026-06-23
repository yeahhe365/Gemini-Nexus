(function () {
    const TOOLBAR_ACTIONS = [
        ['copySelection', 'copy_selection'],
        ['ask', 'ask'],
        ['grammar', 'grammar'],
        ['translate', 'translate'],
        ['explain', 'explain'],
        ['summarize', 'summarize'],
        ['generateImage', 'generate_image'],
        ['readSelection', 'read_selection'],
    ];

    const IMAGE_MENU_ACTIONS = [
        ['imageChat', 'image_chat'],
        ['imageDescribe', 'image_describe'],
        ['imageExtract', 'image_extract'],
        ['imageTranslate', 'image_translate'],
        ['imageRemoveBg', 'image_remove_bg'],
        ['imageRemoveText', 'image_remove_text'],
        ['imageRemoveWatermark', 'image_remove_watermark'],
        ['imageUpscale', 'image_upscale'],
        ['imageExpand', 'image_expand'],
    ];

    const WINDOW_ACTIONS = [
        ['headerClose', 'cancelAsk'],
        ['stop', 'stopAsk'],
        ['continue', 'continueChat'],
        ['copy', 'copyResult'],
        ['retry', 'retryAsk'],
        ['insert', 'insertResult'],
        ['replace', 'replaceResult'],
    ];

    class ToolbarEvents {
        constructor(controller) {
            this.controller = controller;
            this.resizeObserver = null;
            this.submenuPlacementHandlers = [];
            this.handleGlobalKeydown = this.handleGlobalKeydown.bind(this);
        }

        bind(elements, askWindow) {
            const {
                buttons,
                imageBtn,
                askInput,
                askProviderSelect,
                askModelSelect,
                askThinkingToggle,
                translationTargets,
                translationTargetTrigger,
            } = elements;

            TOOLBAR_ACTIONS.forEach(([buttonName, actionName]) => {
                this._bindTrigger(buttons[buttonName], 'mousedown', actionName);
            });

            this._add(imageBtn, 'click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.controller.handleImageClick();
            });
            this._add(imageBtn, 'mouseover', () => this.controller.handleImageHover(true));
            this._add(imageBtn, 'mouseout', () => this.controller.handleImageHover(false));

            IMAGE_MENU_ACTIONS.forEach(([buttonName, actionName]) => {
                this._bindTrigger(buttons[buttonName], 'click', actionName, {
                    stopPropagation: true,
                });
            });
            this._bindSubmenuPlacement(imageBtn);

            WINDOW_ACTIONS.forEach(([buttonName, methodName]) => {
                this._bindActionMethod(buttons[buttonName], methodName);
            });

            this._add(askInput, 'keydown', (event) => {
                if (event.key === 'Enter' && !event.isComposing) {
                    event.preventDefault();
                    this.controller.actions.submitAsk(event);
                }
                event.stopPropagation();
            });

            this._add(askModelSelect, 'change', (event) => {
                this.controller.handleModelChange(event.target.value);
                const Layout = window.GeminiViewLayout;
                if (Layout && Layout.resizeSelect) Layout.resizeSelect(event.target);
            });

            this._add(askProviderSelect, 'change', (event) => {
                this.controller.handleProviderChange?.(event.target.value);
                const Layout = window.GeminiViewLayout;
                if (Layout && Layout.resizeSelect) Layout.resizeSelect(event.target);
            });

            this._add(askThinkingToggle, 'click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.controller.handleWebThinkingToggle?.();
            });

            this._add(translationTargets, 'change', (event) => {
                if (event.target?.name !== 'translation-target') return;
                const selected = [
                    ...translationTargets.querySelectorAll('input[name="translation-target"]'),
                ]
                    .filter((input) => input.checked)
                    .map((input) => input.value);
                this.controller.handleTranslationTargetsChange(selected);
                event.stopPropagation();
            });

            this._add(translationTargetTrigger, 'click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.controller.toggleTranslationTargetDropdown();
            });

            // Prevent event bubbling to page
            if (elements.askWindow) {
                this._add(elements.askWindow, 'mousedown', (event) => event.stopPropagation());
            }

            if (elements.resultText) {
                this._add(elements.resultText, 'click', (event) =>
                    this.controller.codeCopy.handle(event)
                );
            }

            this._initResizeObserver(askWindow);

            // Bind Global Escape Key
            document.addEventListener('keydown', this.handleGlobalKeydown, true);
        }

        handleGlobalKeydown(event) {
            if (event.key === 'Escape') {
                if (this.controller.isWindowVisible()) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.controller.actions.cancelAsk(event);
                } else if (this.controller.isVisible()) {
                    // Hides small toolbar (selection or image button)
                    this.controller.hide();
                    this.controller.hideImageButton();
                }
            }
        }

        _add(element, event, handler) {
            if (element) {
                element.addEventListener(event, handler);
            }
        }

        _bindTrigger(button, eventName, actionName, { stopPropagation = false } = {}) {
            this._add(button, eventName, (event) => {
                if (stopPropagation) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.controller.actions.triggerAction(event, actionName);
            });
        }

        _bindActionMethod(button, methodName) {
            this._add(button, 'click', (event) => this.controller.actions[methodName](event));
        }

        _initResizeObserver(targetElement) {
            if (!targetElement) return;

            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (this.controller.isWindowVisible()) {
                        let width, height;
                        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
                            width = entry.borderBoxSize[0].inlineSize;
                            height = entry.borderBoxSize[0].blockSize;
                        } else {
                            width = entry.contentRect.width;
                            height = entry.contentRect.height;
                        }

                        if (width > 50 && height > 50) {
                            this.controller.saveWindowDimensions(width, height);
                        }
                    }
                }
            });
            this.resizeObserver.observe(targetElement);
        }

        _bindSubmenuPlacement(imageBtn) {
            if (!imageBtn || typeof imageBtn.querySelectorAll !== 'function') return;

            const submenuTriggers = imageBtn.querySelectorAll('.has-submenu');
            submenuTriggers.forEach((trigger) => {
                const handler = () => this._positionSubmenu(trigger);
                trigger.addEventListener('mouseenter', handler);
                trigger.addEventListener('focusin', handler);
                this.submenuPlacementHandlers.push({ trigger, handler });
            });
        }

        _positionSubmenu(trigger) {
            const submenu = trigger?.querySelector?.('.submenu');
            if (!submenu) return;

            trigger.classList.remove('submenu-open-left');
            submenu.style.setProperty('--submenu-offset-y', '0px');

            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            const edgePadding = 8;
            const triggerRect = trigger.getBoundingClientRect();
            const submenuRect = submenu.getBoundingClientRect();

            const wouldOverflowRight = submenuRect.right > viewportWidth - edgePadding;
            const hasMoreRoomOnLeft =
                triggerRect.left >= viewportWidth - triggerRect.right ||
                triggerRect.left >= submenuRect.width + edgePadding;
            if (wouldOverflowRight && hasMoreRoomOnLeft) {
                trigger.classList.add('submenu-open-left');
            }

            let offsetY = 0;
            if (submenuRect.bottom > viewportHeight - edgePadding) {
                offsetY -= submenuRect.bottom - (viewportHeight - edgePadding);
            }
            if (submenuRect.top + offsetY < edgePadding) {
                offsetY += edgePadding - (submenuRect.top + offsetY);
            }

            submenu.style.setProperty('--submenu-offset-y', `${Math.round(offsetY)}px`);
        }

        disconnect() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            this.submenuPlacementHandlers.forEach(({ trigger, handler }) => {
                trigger.removeEventListener('mouseenter', handler);
                trigger.removeEventListener('focusin', handler);
            });
            this.submenuPlacementHandlers = [];
            document.removeEventListener('keydown', this.handleGlobalKeydown, true);
        }
    }

    window.GeminiToolbarEvents = ToolbarEvents;
})();
